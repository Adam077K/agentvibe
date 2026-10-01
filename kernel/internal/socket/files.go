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
// another mode is narrowed. A file it does not own, a symlink, or anything that is not a regular
// file is refused: the Kernel cannot hold it at 0600, and chmod-ing it as root would not make it
// the Kernel's. (Ratified 2026-10-01: never follow a symlink there; refuse to start instead.)
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
		gone, err := narrowFile(name, euid)
		if err != nil {
			return err
		}
		found = found || (e.Name() == base && !gone)
	}
	if !found {
		return fmt.Errorf("%s does not exist", path)
	}
	return nil
}

// narrowFile holds one file at journalMode through a descriptor opened with O_NOFOLLOW, so the mode
// it checks and the mode it changes belong to the same inode, and a symlink is never followed: a
// name that is a symlink, or becomes one, is refused (ELOOP), and Serve does not start. A name
// that vanished between the directory listing and the open is reported gone.
func narrowFile(name string, euid int) (gone bool, err error) {
	f, err := os.OpenFile(name, os.O_RDONLY|syscall.O_NOFOLLOW|syscall.O_NONBLOCK, 0)
	switch {
	case errors.Is(err, fs.ErrNotExist):
		return true, nil // a sidecar SQLite removed between the listing and here
	case errors.Is(err, syscall.ELOOP):
		return false, fmt.Errorf("%s is a symlink; the Kernel never follows one beside its Journal", name)
	case err != nil:
		return false, err
	}
	defer f.Close()
	fi, err := f.Stat()
	if err != nil {
		return false, err
	}
	if !fi.Mode().IsRegular() {
		return false, fmt.Errorf("%s is %v, not a regular file", name, fi.Mode().Type())
	}
	if uid, _ := ownerOf(fi); uid != euid {
		return false, fmt.Errorf("%s is owned by uid %d, not the Kernel's %d", name, uid, euid)
	}
	if permOf(fi.Mode()) == journalMode {
		return false, nil
	}
	if err := f.Chmod(journalMode); err != nil { // fchmod(2): the inode just checked, never a link target
		return false, err
	}
	if fi, err = f.Stat(); err != nil {
		return false, err
	}
	if permOf(fi.Mode()) != journalMode {
		return false, fmt.Errorf("%s is %v after narrowing to %#o", name, fi.Mode(), journalMode)
	}
	return false, nil
}

// listen creates the socket at path already owned by the Kernel, grouped to gid and at 0660, so
// no client ever sees it wider. It binds inside a fresh 0700 directory beside path, sets owner and
// mode there, and only then gives it its public name with link(2), which refuses an existing file
// atomically. An existing file at path is refused, never removed. link, not rename: rename(2)
// moves the socket into place just as privately but silently replaces a file created at path after
// the Lstat check, which the contract forbids.
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
