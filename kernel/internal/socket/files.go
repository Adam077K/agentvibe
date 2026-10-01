package socket

import (
	"errors"
	"fmt"
	"io/fs"
	"net"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

// The OS is what stops Userland appending to the Journal directly, so the modes here are set
// explicitly and then read back: nothing below depends on the umask Serve inherits.

const (
	journalMode = 0o600 // 09a §4.1: owner avk, mode 600
	socketMode  = 0o660 // 09a §2: avk:avd, mode 660
)

// permOf is a mode's permission bits together with setuid, setgid and sticky, so a file that
// carries one of those is not mistaken for an exact 0600 or 0660.
func permOf(m fs.FileMode) fs.FileMode {
	return m & (fs.ModePerm | fs.ModeSetuid | fs.ModeSetgid | fs.ModeSticky)
}

func ownerOf(fi fs.FileInfo) (uid, gid int) {
	st := fi.Sys().(*syscall.Stat_t)
	return int(st.Uid), int(st.Gid)
}

// resolveJournal names the Journal the way the journal package keys its writer lock (every
// symlink resolved; a missing file resolved through its directory), so the files narrowed here are
// the files SQLite and the lock actually use.
func resolveJournal(path string) (string, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	if real, err := filepath.EvalSymlinks(abs); err == nil {
		return real, nil
	} else if !errors.Is(err, fs.ErrNotExist) {
		return "", err
	}
	dir, err := filepath.EvalSymlinks(filepath.Dir(abs))
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, filepath.Base(abs)), nil
}

// createJournal creates an absent Journal as an empty file at 0600 (SQLite treats an empty file
// as a new database), so the -wal and -shm files SQLite derives from its mode start at 0600 too.
// A Journal that already exists is left for narrowJournal.
func createJournal(path string) error {
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL|syscall.O_NOFOLLOW, journalMode)
	if errors.Is(err, fs.ErrExist) {
		return nil
	}
	if err != nil {
		return err
	}
	err = f.Chmod(journalMode) // the umask may have narrowed the create mode; never widened it
	if cerr := f.Close(); err == nil {
		err = cerr
	}
	return err
}

// narrowJournal holds the Journal and every file beside it whose name begins with the Journal's
// name (-wal, -shm, .lock) at exactly 0600, owned by the Kernel's euid. A file the Kernel owns at
// another mode is narrowed. A file it does not own, or that is not a regular file, is refused: the
// Kernel cannot hold it at 0600, and chmod-ing it as root would not make it the Kernel's.
func narrowJournal(path string) error {
	dir, base := filepath.Dir(path), filepath.Base(path)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	found := false
	euid := os.Geteuid()
	for _, e := range entries {
		if !strings.HasPrefix(e.Name(), base) {
			continue
		}
		name := filepath.Join(dir, e.Name())
		found = found || e.Name() == base
		fi, err := os.Lstat(name)
		if errors.Is(err, fs.ErrNotExist) {
			continue // a sidecar SQLite removed between the listing and here
		}
		if err != nil {
			return err
		}
		if !fi.Mode().IsRegular() {
			return fmt.Errorf("%s is %v, not a regular file", name, fi.Mode().Type())
		}
		if uid, _ := ownerOf(fi); uid != euid {
			return fmt.Errorf("%s is owned by uid %d, not the Kernel's %d", name, uid, euid)
		}
		if permOf(fi.Mode()) != journalMode {
			if err := os.Chmod(name, journalMode); err != nil {
				return err
			}
			if fi, err = os.Lstat(name); err != nil {
				return err
			}
			if !fi.Mode().IsRegular() || permOf(fi.Mode()) != journalMode {
				return fmt.Errorf("%s is %v after narrowing to %#o", name, fi.Mode(), journalMode)
			}
		}
	}
	if !found {
		return fmt.Errorf("%s does not exist", path)
	}
	return nil
}

// listen creates the socket at path already owned by the Kernel, grouped to gid and at 0660, so
// no client ever sees it wider. It binds inside a fresh 0700 directory beside path, sets owner and
// mode there, and only then gives it its public name with link(2), which refuses an existing file
// atomically. An existing file at path is refused, never removed.
func listen(path string, gid int) (*net.UnixListener, fs.FileInfo, error) {
	if _, err := os.Lstat(path); err == nil {
		return nil, nil, fmt.Errorf("%s already exists; refusing to replace it", path)
	} else if !errors.Is(err, fs.ErrNotExist) {
		return nil, nil, err
	}
	private, err := os.MkdirTemp(filepath.Dir(path), ".")
	if err != nil {
		return nil, nil, err
	}
	defer os.RemoveAll(private)
	if err := os.Chmod(private, 0o700); err != nil {
		return nil, nil, err
	}
	tmp := filepath.Join(private, "s")
	l, err := net.ListenUnix("unix", &net.UnixAddr{Name: tmp, Net: "unix"})
	if err != nil {
		return nil, nil, err
	}
	l.SetUnlinkOnClose(false) // the public name is removed by Close, and only if it is still ours
	fail := func(err error) (*net.UnixListener, fs.FileInfo, error) {
		l.Close()
		return nil, nil, err
	}
	if err := os.Lchown(tmp, -1, gid); err != nil {
		return fail(fmt.Errorf("chown socket to gid %d: %w", gid, err))
	}
	if err := os.Chmod(tmp, socketMode); err != nil {
		return fail(err)
	}
	if err := os.Link(tmp, path); err != nil {
		return fail(err)
	}
	fi, err := os.Lstat(path)
	if err != nil {
		return fail(err)
	}
	uid, g := ownerOf(fi)
	if fi.Mode().Type() != fs.ModeSocket || permOf(fi.Mode()) != socketMode || uid != os.Geteuid() || g != gid {
		os.Remove(path)
		return fail(fmt.Errorf("%s is %v uid %d gid %d; want a socket at %#o, uid %d, gid %d",
			path, fi.Mode(), uid, g, socketMode, os.Geteuid(), gid))
	}
	return l, fi, nil
}
