package runner

import "testing"

func TestEntriesWritable(t *testing.T) {
	const hdr = "drwxr-xr-x+ 3 adamks staff 96 Oct  4 07:50 /x\n"
	exempt := map[string]bool{"user:root": true, "user:me": true}
	for _, c := range []struct {
		name, out string
		want      bool
	}{
		{"no ACL", "drwxr-xr-x  3 root wheel 96 Oct  4 07:50 /x\n", false},
		{"deny delete only (the home dir's)", hdr + " 0: group:everyone deny delete\n", false},
		{"allow read-class only", hdr + " 0: group:staff allow list,search,readattr\n", false},
		{"the measured ruling: everyone add_file,delete_child", hdr + " 0: group:everyone allow add_file,delete_child\n", true},
		{"allow write on a file", hdr + " 0: user:other allow write\n", true},
		{"allow add_subdirectory with inheritance", hdr + " 0: group:everyone allow add_subdirectory,file_inherit\n", true},
		{"inherited allow", hdr + " 0: user:other inherited allow append\n", true},
		{"each write-class right", hdr + " 0: user:u allow chown\n", true},
		{"allow to root", hdr + " 0: user:root allow write,delete\n", false},
		{"allow to the daemon", hdr + " 0: user:me allow write\n", false},
		{"allow to a group, even one named like the daemon", hdr + " 0: group:me allow write\n", true},
		{"a later entry is judged too", hdr + " 0: user:me allow write\n 1: group:admin allow writesecurity\n", true},
		{"unknown grammar fails closed", hdr + " 0: whatever\n", true},
		{"truncated entry fails closed", hdr + " 0: user:u allow\n", true},
	} {
		if got := entriesWritable(c.out, exempt); got != c.want {
			t.Errorf("%s: writable %v, want %v", c.name, got, c.want)
		}
	}
}
