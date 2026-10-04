package journal

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"syscall"
)

// realPath is the name the writer lock is keyed on: the absolute path with every symlink resolved,
// in the final component and in every directory above it. Two spellings of one database (a
// symlink to the file, a symlinked parent directory, a relative path) must take one lock file, or
// a second writer is admitted under the other spelling. Resolving is chosen over refusing symlinks
// because refusing only the final component still lets a symlinked directory through, and refusing
// every symlinked component would refuse ordinary paths (on macOS /tmp and /var are symlinks).
// Not covered: a hard link names the same inode under an unrelated path, and nothing here sees it.
func realPath(path string) (string, error) {
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("journal: resolving %s: %w", path, err)
	}
	real, err := filepath.EvalSymlinks(abs)
	if err == nil {
		return real, nil
	}
	if !errors.Is(err, fs.ErrNotExist) {
		return "", fmt.Errorf("journal: resolving %s: %w", path, err)
	}
	// The database does not exist yet. A dangling symlink would let SQLite create it at a target
	// this lock never named, so it is refused; otherwise resolve the directory and keep the name.
	if _, lerr := os.Lstat(abs); lerr == nil {
		return "", fmt.Errorf("journal: %s is a symlink to a missing file", path)
	}
	dir, err := filepath.EvalSymlinks(filepath.Dir(abs))
	if err != nil {
		return "", fmt.Errorf("journal: resolving %s: %w", path, err)
	}
	return filepath.Join(dir, filepath.Base(abs)), nil
}

// writerLock is the OS-level single-writer lock (09a §4.1: one writer). It is flock(2) on a
// sidecar file, not on the database: SQLite takes its own fcntl locks on the database file, and on
// some kernels flock and fcntl locks interact. flock belongs to the open file description, so a
// second Open in the same process is refused exactly like one from another process, and the
// kernel drops the lock when the holder dies, SIGKILL included. dbPath must already be realPath's
// result; open does that, so the lock and the SQLite connection name the same file.
type writerLock struct{ f *os.File }

func acquireWriterLock(dbPath string) (*writerLock, error) {
	f, err := os.OpenFile(dbPath+".lock", os.O_RDWR|os.O_CREATE, 0o600)
	if err != nil {
		return nil, fmt.Errorf("journal: opening writer lock: %w", err)
	}
	if err := syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); err != nil {
		f.Close()
		if errors.Is(err, syscall.EWOULDBLOCK) {
			return nil, fmt.Errorf("%w: %s", ErrLocked, dbPath)
		}
		return nil, fmt.Errorf("journal: taking writer lock: %w", err)
	}
	return &writerLock{f: f}, nil
}

// release unlocks and closes; closing the descriptor alone would also release it.
func (l *writerLock) release() error {
	if l == nil || l.f == nil {
		return nil
	}
	err := syscall.Flock(int(l.f.Fd()), syscall.LOCK_UN)
	if cerr := l.f.Close(); err == nil {
		err = cerr
	}
	l.f = nil
	return err
}
