//go:build donetest

// B1-03 done-tests, round 3 (re-frozen 2026-10-01 after an Opus review of the ratified-bounds
// implementation found four surviving mutants). Registered in build/done-tests/B1-03.yml beside
// rounds 1 and 2, whose helpers (serveWith, connect, closedUnanswered, refusals, compileLine,
// fakeBackend, userlandGID) this file reuses.
//
// The bounds below are the founder's ratified numbers (2026-10-01), written here as literals on
// purpose: a test that read socket.StallTimeout would follow a mutant that changed it.
//
// Tests whose names end in "Ratify" assert a property the review rated low and the founder has not
// ratified; they need ratification before they bind.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/socket/
package socket_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
	"syscall"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/socket"
)

const (
	ratifiedStall = 30 * time.Second        // founder, 2026-10-01: a stalled connection is closed within 30 s
	stallSlack    = 1500 * time.Millisecond // scheduling tolerance; well under the 4 s a 34 s timeout would add
)

// TestB103SidecarSymlinkRefusesToStart: ratified 2026-10-01, a symlink beside the Journal is never
// followed and Serve refuses to start. Each case puts a symlink at a name narrowJournal must hold
// at 0600; Serve must return an error, leave no socket behind, and not touch the link's target.
//
// Kills (r3 mutant 1): on ELOOP, report the sidecar "gone" and start anyway. That Kernel follows
// nothing, so round 2's victim check passes it, but it serves beside a Journal whose files it does
// not hold.
func TestB103SidecarSymlinkRefusesToStart(t *testing.T) {
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
	cases := []struct{ name, link, target string }{
		{"decoy-to-file", "journal.db.decoy", victim},
		{"decoy-dangling", "journal.db.decoy", filepath.Join(victimDir, "absent")},
		{"wal-to-file", "journal.db-wal", victim},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			dir, err := os.MkdirTemp("", "avk-b103-")
			if err != nil {
				t.Fatal(err)
			}
			t.Cleanup(func() { os.RemoveAll(dir) })
			old := syscall.Umask(0)
			t.Cleanup(func() { syscall.Umask(old) })
			sock := filepath.Join(dir, "avk.sock")
			if err := os.Symlink(tc.target, filepath.Join(dir, tc.link)); err != nil {
				t.Fatal(err)
			}
			srv, err := socket.Serve(context.Background(), socket.Config{
				SocketPath: sock, JournalPath: filepath.Join(dir, "journal.db"),
				UserlandGID: userlandGID(t, dir), Backend: &fakeBackend{},
			})
			if err == nil {
				srv.Close()
				t.Errorf("Serve started with %s a symlink beside the Journal; want it to refuse to start", tc.link)
			}
			if _, err := os.Lstat(sock); !errors.Is(err, fs.ErrNotExist) {
				t.Errorf("after Serve with a symlink sidecar, Lstat(socket) = %v; want no socket left behind", err)
			}
			fi, err := os.Stat(victim)
			if err != nil {
				t.Fatal(err)
			}
			if fi.Mode().Perm() != 0o644 {
				t.Errorf("victim mode %#o; want 0644: Serve changed the target of %s", fi.Mode().Perm(), tc.link)
			}
		})
	}
}

// TestB103StallTimeoutIsThirtySecondsPerLine: ratified 2026-10-01, a stalled connection is closed
// within 30 s, and the 30 s runs per line, not per connection. Three clients run at once:
//   - silent: sends nothing; must be closed within 30 s + slack of connecting.
//   - trickle: sends one byte of a line every second and never ends it; the line has not arrived
//     within 30 s, so it must be closed within 30 s + slack too (a deadline reset on every read
//     would keep it for ever).
//   - active: sends a complete request every 2 s for 38 s; every one must be answered, because no
//     line of it ever stalled.
//
// Kills (r3 mutant 2): StallTimeout = 34 s (silent and trickle outlive 31.5 s).
// Kills (r3 mutant 3): the read deadline set once per connection (active is cut off at 30 s).
func TestB103StallTimeoutIsThirtySecondsPerLine(t *testing.T) {
	r := serveWith(t, &fakeBackend{})
	bound := ratifiedStall + stallSlack
	results := make([]string, 3)
	var wg sync.WaitGroup
	wg.Add(3)

	silent := connect(t, r.sock)
	go func() {
		defer wg.Done()
		t0 := time.Now()
		if ok, why := silent.closedUnanswered(bound); !ok {
			results[0] = fmt.Sprintf("a silent connection: %s (after %v)", why, time.Since(t0).Round(time.Millisecond))
		}
	}()

	trickle := connect(t, r.sock)
	go func() {
		defer wg.Done()
		t0 := time.Now()
		stop := make(chan struct{})
		defer close(stop)
		go func() {
			prefix := []byte(`{"cmd":"compile","action":"`)
			for i := 0; ; i++ {
				b := []byte{'x'}
				if i < len(prefix) {
					b = prefix[i : i+1]
				}
				trickle.c.SetWriteDeadline(time.Now().Add(5 * time.Second))
				if _, err := trickle.c.Write(b); err != nil {
					return
				}
				select {
				case <-stop:
					return
				case <-time.After(time.Second):
				}
			}
		}()
		if ok, why := trickle.closedUnanswered(bound); !ok {
			results[1] = fmt.Sprintf("a connection trickling one byte a second: %s (after %v)", why, time.Since(t0).Round(time.Millisecond))
		}
	}()

	active := connect(t, r.sock)
	go func() {
		defer wg.Done()
		t0 := time.Now()
		n := 0
		for time.Since(t0) < ratifiedStall+8*time.Second {
			resp, err := active.do(`{"cmd":"compile","action":{}}`, 5*time.Second)
			n++
			if err != nil || !resp.OK {
				results[2] = fmt.Sprintf("an active connection, request %d at %v: %+v, %v; want every request served",
					n, time.Since(t0).Round(time.Millisecond), resp, err)
				return
			}
			time.Sleep(2 * time.Second)
		}
	}()

	wg.Wait()
	for i, s := range results {
		if s == "" {
			continue
		}
		if i < 2 {
			t.Errorf("%s; want it closed within %v of connecting", s, bound)
		} else {
			t.Error(s)
		}
	}
}

// TestB103OversizedRefusalReasonAndDigest: ratified 2026-10-01 (socket.go BOUNDS): an oversized
// line is refused and journaled with ReasonLineTooLong ("line_too_long"), no cmd, and SHA256 and
// Bytes taken over its first MaxLine+1 bytes. Three lines, each on its own connection: exactly
// MaxLine+1 bytes, MaxLine+5000 bytes, and 2×MaxLine bytes with no newline. Each is unanswered,
// reaches no Backend, and leaves exactly that refusal.
//
// Kills (r3 mutant 4): the oversized-line refusal journaled with the wrong reason, or with a digest
// or length over anything but the first MaxLine+1 bytes.
func TestB103OversizedRefusalReasonAndDigest(t *testing.T) {
	if socket.ReasonLineTooLong != "line_too_long" {
		t.Fatalf("ReasonLineTooLong = %q; the ratified contract names it line_too_long", socket.ReasonLineTooLong)
	}
	b := &fakeBackend{}
	r := serveWith(t, b)
	payloads := []struct {
		name      string
		bytes     []byte
		terminate bool
	}{
		{"MaxLine+1", []byte(compileLine(t, socket.MaxLine+1)), true},
		{"MaxLine+5000", []byte(compileLine(t, socket.MaxLine+5000)), true},
		{"2xMaxLine unterminated", bytes.Repeat([]byte("y"), 2*socket.MaxLine), false},
	}
	for _, p := range payloads {
		c := connect(t, r.sock)
		go func() {
			c.c.SetWriteDeadline(time.Now().Add(10 * time.Second))
			out := p.bytes
			if p.terminate {
				out = append(append([]byte{}, out...), '\n')
			}
			c.c.Write(out) // the server may close mid-write
		}()
		if ok, why := c.closedUnanswered(10 * time.Second); !ok {
			t.Errorf("%s: %s; want the connection closed without an answer", p.name, why)
		}
	}
	if calls := b.snapshot(); len(calls) != 0 {
		t.Errorf("an oversized line reached the Backend: %+v", calls)
	}
	j := r.stop(t)
	got := refusals(t, j)
	if len(got) != len(payloads) {
		t.Fatalf("%d refusals journaled for %d oversized lines; want one each", len(got), len(payloads))
	}
	for i, d := range got {
		sum := sha256.Sum256(payloads[i].bytes[:socket.MaxLine+1])
		want := socket.RefusalData{Reason: "line_too_long", SHA256: hex.EncodeToString(sum[:]), Bytes: socket.MaxLine + 1}
		if d != want {
			t.Errorf("%s: refusal %+v; want %+v (reason line_too_long, digest and length of the first MaxLine+1 bytes)",
				payloads[i].name, d, want)
		}
	}
}

// TestB103KernelOwnedSidecarNarrowedRatify: socket.go says "A Journal file the Kernel owns at a
// wider mode is narrowed to 0600, not refused". A Journal file, and a sidecar, that the Kernel owns
// at 0o066 (group and other read-write, owner nothing) must be narrowed to 0600 and served.
//
// RATIFY (review low, files.go:106): narrowFile opens the file O_RDONLY before narrowing, which a
// mode without owner read refuses, so Serve refuses a file the contract says it narrows.
func TestB103KernelOwnedSidecarNarrowedRatify(t *testing.T) {
	for _, name := range []string{"journal.db", "journal.db.side"} {
		t.Run(name, func(t *testing.T) {
			dir, err := os.MkdirTemp("", "avk-b103-")
			if err != nil {
				t.Fatal(err)
			}
			t.Cleanup(func() { os.RemoveAll(dir) })
			old := syscall.Umask(0)
			t.Cleanup(func() { syscall.Umask(old) })
			f := filepath.Join(dir, name)
			if err := os.WriteFile(f, nil, 0o600); err != nil {
				t.Fatal(err)
			}
			if err := os.Chmod(f, 0o066); err != nil {
				t.Fatal(err)
			}
			srv, err := socket.Serve(context.Background(), socket.Config{
				SocketPath: filepath.Join(dir, "avk.sock"), JournalPath: filepath.Join(dir, "journal.db"),
				UserlandGID: userlandGID(t, dir), Backend: &fakeBackend{},
			})
			if err != nil {
				t.Fatalf("Serve with %s owned by the Kernel at 0o066: %v; want it narrowed to 0600 and served", name, err)
			}
			defer srv.Close()
			fi, err := os.Lstat(f)
			if err != nil {
				t.Fatal(err)
			}
			if p := fi.Mode() & (fs.ModePerm | fs.ModeSetuid | fs.ModeSetgid | fs.ModeSticky); p != 0o600 {
				t.Errorf("%s mode %#o after Serve; want 0600", name, p)
			}
		})
	}
}
