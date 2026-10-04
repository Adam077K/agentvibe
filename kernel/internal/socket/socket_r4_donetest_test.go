//go:build donetest

// B1-03 done-tests, round 4 (re-frozen 2026-10-01 after an Opus review of ec1a2a0 reasoned out
// four mutants in the owner-unreadable narrowing and the socket-removal path of files.go).
// Registered in build/done-tests/B1-03.yml beside rounds 1-3, whose helpers (userlandGID,
// fakeBackend) this file reuses. Only tests that killed a mutant when run are kept here.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/socket/
package socket_test

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"sync/atomic"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

// TestB103OwnerUnreadableSidecarRaceNotFollowed: ratified 2026-10-01, the Kernel never follows a
// symlink beside its Journal. A Kernel-owned sidecar the owner cannot read (0o066) is narrowed by
// name, not through a descriptor, so the name must be changed without following a link: here
// journal.db.decoy flips between such a file and a symlink to a victim while Serve runs repeatedly.
// The victim must keep its mode.
//
// Kills (r4 mutant 1): Fchmodat with flags 0 instead of AT_SYMLINK_NOFOLLOW, which narrows the
// victim when the flip lands between the Lstat and the chmod. Round 2's race uses a 0644 decoy,
// which opens, so it never reaches this path. Like that race, this one can miss a wrong Kernel but
// cannot fail a correct one.
func TestB103OwnerUnreadableSidecarRaceNotFollowed(t *testing.T) {
	victimDir, err := os.MkdirTemp("", "avk-b103-victim-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(victimDir) })
	victim := filepath.Join(victimDir, "victim")
	if err := os.WriteFile(victim, []byte("not the Kernel's"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(victim, 0o644); err != nil {
		t.Fatal(err)
	}
	victimMode := func() fs.FileMode {
		fi, err := os.Stat(victim)
		if err != nil {
			t.Fatal(err)
		}
		return fi.Mode().Perm()
	}

	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	cfg := socket.Config{SocketPath: filepath.Join(dir, "avk.sock"), JournalPath: filepath.Join(dir, "journal.db"),
		UserlandGID: userlandGID(t, dir), Backend: &fakeBackend{}}
	decoy, reg, lnk := filepath.Join(dir, "journal.db.decoy"), filepath.Join(dir, "reg.tmp"), filepath.Join(dir, "lnk.tmp")

	var stop atomic.Bool
	var flips atomic.Int64
	done := make(chan struct{})
	go func() {
		defer close(done)
		for !stop.Load() {
			os.Remove(reg)
			if os.WriteFile(reg, nil, 0o600) == nil && os.Chmod(reg, 0o066) == nil {
				os.Rename(reg, decoy)
			}
			os.Remove(lnk)
			if os.Symlink(victim, lnk) == nil {
				os.Rename(lnk, decoy)
			}
			flips.Add(1)
		}
	}()
	const rounds = 3000
	deadline := time.Now().Add(30 * time.Second)
	n := 0
	for ; n < rounds && time.Now().Before(deadline) && victimMode() == 0o644; n++ {
		if srv, err := socket.Serve(context.Background(), cfg); err == nil {
			if err := srv.Close(); err != nil {
				stop.Store(true)
				<-done
				t.Fatalf("Close: %v", err)
			}
		}
	}
	stop.Store(true)
	<-done
	if flips.Load() == 0 {
		t.Fatal("the swapper never flipped the decoy; the race was not run")
	}
	if m := victimMode(); m != 0o644 {
		t.Errorf("victim mode %#o after %d Serve rounds; want 0644: Serve followed a symlink at %s while narrowing an owner-unreadable file",
			m, n, decoy)
	}
	t.Logf("%d Serve rounds, %d flips", n, flips.Load())
}

// TestB103RefusedSocketLeavesNothingBehind: Close "removes the socket file", and a Serve that
// fails creates no server to Close, so it must remove what it created. UserlandGID -1 is a group no
// socket can carry (lchown's -1 means "leave the group unchanged"), so the socket Serve links into
// place fails its own owner/group check every time: Serve must return an error and leave nothing at
// SocketPath.
//
// Kills (r4 mutant 2, forced false): the device/inode check before removal forced to false, which
// leaves the Kernel's own refused socket at the public path, where the next Serve then refuses to
// start because "an existing file there is refused, not removed".
func TestB103RefusedSocketLeavesNothingBehind(t *testing.T) {
	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	sock := filepath.Join(dir, "avk.sock")
	srv, err := socket.Serve(context.Background(), socket.Config{
		SocketPath: sock, JournalPath: filepath.Join(dir, "journal.db"), UserlandGID: -1, Backend: &fakeBackend{},
	})
	if err == nil {
		srv.Close()
		t.Fatal("Serve with UserlandGID -1 started; want it refused: no socket can be grouped to gid -1")
	}
	if fi, err := os.Lstat(sock); !errors.Is(err, fs.ErrNotExist) {
		t.Errorf("after a refused Serve, %s is %v (err %v); want nothing left at the socket path", sock, fi.Mode(), err)
	}
}

// TestB103OwnerUnreadableNeverExposed: narrowing a Kernel-owned file never makes it wider than it
// was on the way to 0600. A sidecar at 0o000 is recreated before each of many Serve rounds while
// pollers Lstat it; no observation may carry a group or other bit. Like round 2's socket poller, it
// can miss a wrong Kernel but cannot fail a correct one, and a positive control fails it if the
// pollers never saw the file.
//
// Kills (r4 mutant 4): the owner-unreadable path narrows to 0o644 before reopening and fixing the
// mode, which makes a file nobody could read readable by every local user for a few syscalls.
func TestB103OwnerUnreadableNeverExposed(t *testing.T) {
	dir, err := os.MkdirTemp("", "avk-b103-")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { os.RemoveAll(dir) })
	old := syscall.Umask(0)
	t.Cleanup(func() { syscall.Umask(old) })
	cfg := socket.Config{SocketPath: filepath.Join(dir, "avk.sock"), JournalPath: filepath.Join(dir, "journal.db"),
		UserlandGID: userlandGID(t, dir), Backend: &fakeBackend{}}
	side := filepath.Join(dir, "journal.db.side")

	var stop atomic.Bool
	var observed, exposed atomic.Int64
	var mu sync.Mutex
	var examples []string
	var wg sync.WaitGroup
	pollers := min(max(runtime.NumCPU()-1, 2), 6)
	for range pollers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for !stop.Load() {
				fi, err := os.Lstat(side)
				if err != nil {
					continue
				}
				observed.Add(1)
				if fi.Mode().Perm()&0o077 != 0 && fi.Mode().Perm() != 0o000 {
					exposed.Add(1)
					mu.Lock()
					if len(examples) < 5 {
						examples = append(examples, fmt.Sprintf("%#o", fi.Mode().Perm()))
					}
					mu.Unlock()
				}
			}
		}()
	}
	const rounds = 300
	var failure error
	for i := range rounds {
		os.Remove(side)
		if err := os.WriteFile(side, nil, 0o600); err != nil {
			failure = err
			break
		}
		if err := os.Chmod(side, 0o000); err != nil {
			failure = err
			break
		}
		srv, err := socket.Serve(context.Background(), cfg)
		if err != nil {
			failure = fmt.Errorf("Serve, round %d, with a Kernel-owned 0o000 sidecar: %w; want it narrowed and served", i+1, err)
			break
		}
		if err := srv.Close(); err != nil {
			failure = fmt.Errorf("Close, round %d: %w", i+1, err)
			break
		}
	}
	stop.Store(true)
	wg.Wait()
	if failure != nil {
		t.Fatal(failure)
	}
	if observed.Load() == 0 {
		t.Fatalf("the pollers never saw %s; the check proved nothing", side)
	}
	if n := exposed.Load(); n > 0 {
		t.Errorf("%d of %d observations of a 0o000 sidecar being narrowed carried group/other bits, e.g. %q; want none: narrowing must never widen",
			n, observed.Load(), examples)
	}
	t.Logf("%d rounds, %d observations by %d pollers, %d exposed", rounds, observed.Load(), pollers, exposed.Load())
}
