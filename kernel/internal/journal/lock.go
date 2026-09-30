package journal

import (
	"errors"
	"fmt"
	"os"
	"syscall"
)

// writerLock is the OS-level single-writer lock (09a §4.1: one writer). It is flock(2) on a
// sidecar file, not on the database: SQLite takes its own fcntl locks on the database file, and on
// some kernels flock and fcntl locks interact. flock belongs to the open file description, so a
// second Open in the same process is refused exactly like one from another process, and the
// kernel drops the lock when the holder dies, SIGKILL included.
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
