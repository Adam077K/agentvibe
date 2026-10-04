package runner

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"os/user"
	"strconv"
	"strings"
	"time"
)

// aclWritable reports whether any of paths carries an extended ACL entry that grants a write-class
// right to anyone but root or the daemon's uid. It fails closed (r3, orchestrator ceo-1, 2026-10-04):
// an ACL it cannot read, or an entry it cannot parse, counts as writable.
//
// macOS keeps ACLs in the filesystem and exposes them through acl_get_file(3) (libc, cgo) and through
// ls -e. The Kernel builds without cgo, so one /bin/ls -led reads every path at once; /bin/ls is the
// reader the done-test's own preconditions use, and it runs under the armed sandbox.
func aclWritable(paths []string) bool {
	if len(paths) == 0 {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	c := exec.CommandContext(ctx, "/bin/ls", append([]string{"-led", "--"}, paths...)...)
	c.Env = []string{"LC_ALL=C"}
	var stderr bytes.Buffer
	c.Stderr = &stderr
	out, err := c.Output()
	if err != nil || stderr.Len() > 0 { // any complaint, for any path, and the answer is not trustworthy
		return true
	}
	exempt := map[string]bool{"user:root": true}
	if u, err := user.LookupId(strconv.Itoa(os.Getuid())); err == nil {
		exempt["user:"+u.Username] = true
	}
	return entriesWritable(string(out), exempt)
}

// entriesWritable judges ls -led output: true when an allow entry for anyone outside exempt grants a
// write-class right, or when an entry cannot be parsed.
func entriesWritable(out string, exempt map[string]bool) bool {
	for _, l := range strings.Split(out, "\n") {
		if !isACLEntry(strings.TrimSpace(l)) {
			continue
		}
		// "0: group:everyone allow add_file,delete_child"; "inherited" may precede allow or deny.
		f := strings.Fields(l)
		if len(f) < 4 {
			return true
		}
		who, rest := f[1], f[2:]
		if rest[0] == "inherited" {
			rest = rest[1:]
		}
		switch {
		case len(rest) < 2:
			return true
		case rest[0] == "deny":
		case rest[0] == "allow":
			if !exempt[who] && writeClass(rest[1]) {
				return true
			}
		default:
			return true // an entry in a grammar this does not know
		}
	}
	return false
}

// isACLEntry: an ls -e entry line is "<index>: <who> ...", the index being digits.
func isACLEntry(l string) bool {
	i := strings.IndexByte(l, ':')
	if i < 1 {
		return false
	}
	for _, r := range l[:i] {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func writeClass(perms string) bool {
	for _, p := range strings.Split(perms, ",") {
		switch p {
		case "write", "append", "add_file", "add_subdirectory", "delete", "delete_child", "writeattr", "writeextattr", "writesecurity", "chown":
			return true
		}
	}
	return false
}
