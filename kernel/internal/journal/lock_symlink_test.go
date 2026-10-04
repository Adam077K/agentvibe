package journal

import (
	"errors"
	"fmt"
	"os"
	osexec "os/exec"
	"path/filepath"
	"strings"
	"testing"
)

const lockChildEnv = "AVK_JOURNAL_LOCK_CHILD"

// TestLockChildProcess is not a test of its own: it is the second OS process the symlink test
// re-executes, so no in-process state can stand in for the file lock. Without the env var it
// returns at once.
func TestLockChildProcess(t *testing.T) {
	path := os.Getenv(lockChildEnv)
	if path == "" {
		return
	}
	j, err := Open(path)
	switch {
	case err == nil:
		j.Close()
		fmt.Println("child:opened")
	case errors.Is(err, ErrLocked):
		fmt.Println("child:locked")
	default:
		fmt.Printf("child:error %v\n", err)
	}
	os.Exit(0)
}

func openInChild(t *testing.T, path string) string {
	t.Helper()
	cmd := osexec.Command(os.Args[0], "-test.run=^TestLockChildProcess$", "-test.count=1")
	cmd.Env = append(os.Environ(), lockChildEnv+"="+path)
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("lock child: %v\n%s", err, out)
	}
	for _, line := range strings.Split(string(out), "\n") {
		if strings.HasPrefix(line, "child:") {
			return strings.TrimPrefix(line, "child:")
		}
	}
	t.Fatalf("lock child printed no result:\n%s", out)
	return ""
}

// TestSymlinkCannotAdmitSecondWriter: every spelling of one database file contends for one writer
// lock, across processes. Before the lock was keyed on the resolved path, the child's Open via a
// symlink took a different lock file and was admitted as a second writer.
func TestSymlinkCannotAdmitSecondWriter(t *testing.T) {
	root := t.TempDir()
	realDir := filepath.Join(root, "real")
	if err := os.Mkdir(realDir, 0o700); err != nil {
		t.Fatal(err)
	}
	db := filepath.Join(realDir, "journal.db")
	fileLink := filepath.Join(root, "link.db")
	dirLink := filepath.Join(root, "linkdir")
	// Create the database first, so the file symlink has a target.
	j, err := Open(db)
	if err != nil {
		t.Fatal(err)
	}
	j.Close()
	if err := os.Symlink(db, fileLink); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(realDir, dirLink); err != nil {
		t.Fatal(err)
	}
	viaDir := filepath.Join(dirLink, "journal.db")

	for _, tc := range []struct{ name, parent, child string }{
		{"parent real, child file symlink", db, fileLink},
		{"parent file symlink, child real", fileLink, db},
		{"parent real, child via symlinked dir", db, viaDir},
		{"parent via symlinked dir, child file symlink", viaDir, fileLink},
	} {
		j, err := Open(tc.parent)
		if err != nil {
			t.Fatalf("%s: parent Open(%s): %v", tc.name, tc.parent, err)
		}
		got := openInChild(t, tc.child)
		j.Close()
		if got != "locked" {
			t.Fatalf("%s: child Open(%s) while parent holds %s = %q, want locked", tc.name, tc.child, tc.parent, got)
		}
	}
	// Positive control: with no holder, the child CAN open through each symlink, so "locked"
	// above is the lock and not a failure to open through a symlink at all.
	for _, p := range []string{fileLink, viaDir} {
		if got := openInChild(t, p); got != "opened" {
			t.Fatalf("child Open(%s) with no holder = %q, want opened", p, got)
		}
	}
	// A dangling symlink is refused: SQLite would create the database at a target the lock never named.
	dangling := filepath.Join(root, "dangling.db")
	if err := os.Symlink(filepath.Join(root, "missing", "x.db"), dangling); err != nil {
		t.Fatal(err)
	}
	if j, err := Open(dangling); err == nil {
		j.Close()
		t.Fatal("Open through a dangling symlink succeeded, want refusal")
	}
}
