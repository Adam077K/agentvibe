//go:build donetest

// B1-08d done-tests, round 1 (2026-10-03): the launcher's real dependencies.
//
//	(b)  GrantStatus.Live() reads the grant's status from the Kernel's main Journal (GrantStream;
//	     09a §4.2: a Constitution record's release is journalled as policy.released with its file
//	     digest, and a revocation is an authority transition, canonical in the Journal). A revoked,
//	     expired, superseded or missing grant fails; a read error or an unreadable record fails
//	     closed. The contract is grantstatus.go.
//	(e2e) A launcher built on the real lease store (lease.NewLaunchVerifier) and the real grant
//	     status refuses a replayed lease end to end, and a revocation binds its next launch.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_08d ./internal/launcher/
package launcher

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

const (
	d8GrantA = "sha256:" + "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	d8GrantB = "sha256:" + "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
)

func d8Journal(t *testing.T) (journal.Journal, string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "journal.db")
	j, err := journal.Open(path)
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { _ = j.Close() })
	return j, path
}

func d8Status(t *testing.T, j journal.Journal, digest string, now func() time.Time) GrantStatus {
	t.Helper()
	g, err := NewGrantStatus(j, digest, now)
	if err != nil {
		t.Fatalf("NewGrantStatus: %v", err)
	}
	if g == nil {
		t.Fatal("NewGrantStatus returned nil and no error")
	}
	return g
}

func d8Release(t *testing.T, j journal.Journal, digest string, until time.Time) {
	t.Helper()
	if err := ReleaseGrant(context.Background(), j, digest, until); err != nil {
		t.Fatalf("ReleaseGrant(%s): %v", digest, err)
	}
}

// d8Failing wraps a Journal; while fail is set, Head and Read error.
type d8Failing struct {
	journal.Journal
	mu   sync.Mutex
	fail bool
}

func (f *d8Failing) set(b bool) { f.mu.Lock(); f.fail = b; f.mu.Unlock() }
func (f *d8Failing) on() bool   { f.mu.Lock(); defer f.mu.Unlock(); return f.fail }

func (f *d8Failing) Head(ctx context.Context, s string) (uint64, string, error) {
	if f.on() {
		return 0, "", errors.New("injected head failure")
	}
	return f.Journal.Head(ctx, s)
}

func (f *d8Failing) Read(ctx context.Context, s string, from uint64) ([]journal.Event, error) {
	if f.on() {
		return nil, errors.New("injected read failure")
	}
	return f.Journal.Read(ctx, s, from)
}

// TestB1_08d_GrantStatusIsReal: item b.
func TestB1_08d_GrantStatusIsReal(t *testing.T) {
	ctx := context.Background()
	day := func() time.Time { return time.Now().Add(24 * time.Hour) }

	t.Run("constructor refuses a nil journal, an empty or malformed digest, a nil clock", func(t *testing.T) {
		j, _ := d8Journal(t)
		for _, tc := range []struct {
			name string
			j    journal.Journal
			d    string
			now  func() time.Time
		}{
			{"nil journal", nil, d8GrantA, time.Now},
			{"empty digest", j, "", time.Now},
			{"digest without sha256:", j, strings.TrimPrefix(d8GrantA, "sha256:"), time.Now},
			{"nil clock", j, d8GrantA, nil},
		} {
			if g, err := NewGrantStatus(tc.j, tc.d, tc.now); err == nil || g != nil {
				t.Errorf("%s: %v, %v; want an error and no status", tc.name, g, err)
			}
		}
	})

	t.Run("a missing grant fails", func(t *testing.T) {
		j, _ := d8Journal(t)
		if err := d8Status(t, j, d8GrantA, time.Now).Live(); err == nil {
			t.Error("Live with nothing released: nil; want an error")
		}
	})

	t.Run("a released grant is live, and only for its own digest", func(t *testing.T) {
		j, _ := d8Journal(t)
		d8Release(t, j, d8GrantA, day())
		if err := d8Status(t, j, d8GrantA, time.Now).Live(); err != nil {
			t.Fatalf("Live after release: %v; want nil (control)", err)
		}
		if err := d8Status(t, j, d8GrantB, time.Now).Live(); err == nil {
			t.Error("Live for a digest never released: nil; want an error")
		}
	})

	t.Run("a revocation binds the next Live of an existing status", func(t *testing.T) {
		j, _ := d8Journal(t)
		d8Release(t, j, d8GrantA, day())
		g := d8Status(t, j, d8GrantA, time.Now)
		if err := g.Live(); err != nil {
			t.Fatalf("Live before revoke: %v", err)
		}
		if err := RevokeGrant(ctx, j, d8GrantA); err != nil {
			t.Fatalf("RevokeGrant: %v", err)
		}
		if err := g.Live(); err == nil {
			t.Error("Live after revoke, same status: nil; want an error (no cached answer)")
		}
		if err := d8Status(t, j, d8GrantA, time.Now).Live(); err == nil {
			t.Error("Live after revoke, fresh status: nil; want an error")
		}
	})

	t.Run("an expired grant fails, at and after until", func(t *testing.T) {
		j, _ := d8Journal(t)
		until := time.Now().Add(time.Hour)
		d8Release(t, j, d8GrantA, until)
		clock := until.Add(-time.Second)
		var mu sync.Mutex
		now := func() time.Time { mu.Lock(); defer mu.Unlock(); return clock }
		g := d8Status(t, j, d8GrantA, now)
		if err := g.Live(); err != nil {
			t.Fatalf("Live a second before until: %v; want nil (control)", err)
		}
		for _, at := range []time.Time{until, until.Add(time.Minute)} {
			mu.Lock()
			clock = at
			mu.Unlock()
			if err := g.Live(); err == nil {
				t.Errorf("Live at %s (until %s): nil; want an error", at.Format(time.RFC3339Nano), until.Format(time.RFC3339Nano))
			}
		}
	})

	t.Run("a later release supersedes the grant the launcher holds", func(t *testing.T) {
		j, _ := d8Journal(t)
		d8Release(t, j, d8GrantA, day())
		held := d8Status(t, j, d8GrantA, time.Now)
		d8Release(t, j, d8GrantB, day())
		if err := held.Live(); err == nil {
			t.Error("Live for grant A after B was released: nil; want an error")
		}
		if err := d8Status(t, j, d8GrantB, time.Now).Live(); err != nil {
			t.Errorf("Live for the current grant B: %v; want nil", err)
		}
	})

	t.Run("a read error fails closed", func(t *testing.T) {
		j, _ := d8Journal(t)
		d8Release(t, j, d8GrantA, day())
		f := &d8Failing{Journal: j}
		g := d8Status(t, f, d8GrantA, time.Now)
		if err := g.Live(); err != nil {
			t.Fatalf("Live with the journal healthy: %v (control)", err)
		}
		f.set(true)
		if err := g.Live(); err == nil {
			t.Error("Live with the journal failing: nil; want an error")
		}
	})

	t.Run("an unreadable record on GrantStream fails closed", func(t *testing.T) {
		for _, bad := range []struct{ typ, data string }{
			{"policy.released", "not json"},
			{"policy.released", `{}`},
			{"something.else", `{}`},
		} {
			j, _ := d8Journal(t)
			d8Release(t, j, d8GrantA, day())
			head, _, err := j.Head(ctx, GrantStream)
			if err != nil || head == 0 {
				t.Fatalf("GrantStream head after a release: %d, %v; ReleaseGrant must write GrantStream", head, err)
			}
			if _, err := j.Append(ctx, journal.Proposal{Stream: GrantStream, ExpectSeq: head, Type: bad.typ, Data: []byte(bad.data)}); err != nil {
				t.Fatal(err)
			}
			if err := d8Status(t, j, d8GrantA, time.Now).Live(); err == nil {
				t.Errorf("Live with a %q %q record at the head: nil; want an error", bad.typ, bad.data)
			}
		}
	})

	t.Run("status survives a restart", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "journal.db")
		reopen := func(j journal.Journal) journal.Journal {
			must(t, j.Close())
			j2, err := journal.Open(path)
			if err != nil {
				t.Fatalf("reopen: %v", err)
			}
			return j2
		}
		j, err := journal.Open(path)
		if err != nil {
			t.Fatal(err)
		}
		d8Release(t, j, d8GrantA, day())
		j = reopen(j)
		if err := d8Status(t, j, d8GrantA, time.Now).Live(); err != nil {
			t.Fatalf("Live for A after restart: %v; want nil (the release is durable)", err)
		}
		d8Release(t, j, d8GrantB, day())
		if err := RevokeGrant(ctx, j, d8GrantB); err != nil {
			t.Fatal(err)
		}
		j = reopen(j)
		t.Cleanup(func() { _ = j.Close() })
		for _, d := range []string{d8GrantA, d8GrantB} {
			if err := d8Status(t, j, d, time.Now).Live(); err == nil {
				t.Errorf("Live for %s after restart (A superseded, B revoked): nil; want an error", d[:12])
			}
		}
	})
}

// d8Rig is one machine: a real Journal holding the job claims, the grant and the launch records;
// the real lease store and grant status over it; a receipt log shared by its launchers.
type d8Rig struct {
	*r4Rig
	j      journal.Journal
	claims lease.Claimer
	store  lease.LaunchVerifier
	status GrantStatus
}

func newD8(t *testing.T) *d8Rig {
	t.Helper()
	j, _ := d8Journal(t)
	d8Release(t, j, d8GrantA, time.Now().Add(24*time.Hour))
	claims, err := lease.New(j)
	if err != nil {
		t.Fatal(err)
	}
	store, err := lease.NewLaunchVerifier(j, time.Now)
	if err != nil {
		t.Fatalf("lease.NewLaunchVerifier: %v", err)
	}
	return &d8Rig{r4Rig: newR4(t, time.Now()), j: j, claims: claims, store: store,
		status: d8Status(t, j, d8GrantA, time.Now)}
}

// launcher is one launcher process on state, with the real store, the real status and the real
// Journal as Deps.Journal.
func (r *d8Rig) launcher(t *testing.T, state string) (Launcher, error) {
	t.Helper()
	d := r.deps()
	d.State, d.Leases, d.Grant, d.Journal = state, r.store, r.status, r.j
	return New(pinned(r3Grant(), d))
}

func (r *d8Rig) claim(t *testing.T, job string) string {
	t.Helper()
	c, err := r.claims.ClaimJob(context.Background(), job, "runner-1", time.Hour)
	if err != nil {
		t.Fatalf("ClaimJob(%s): %v", job, err)
	}
	return lease.FencedLease(c)
}

// TestB1_08d_ReplayRefusedEndToEnd: item e2e.
func TestB1_08d_ReplayRefusedEndToEnd(t *testing.T) {
	r := newD8(t)
	l1, err := r.launcher(t, r.state)
	if err != nil {
		t.Fatalf("New with the real store and status: %v", err)
	}
	ls := r.claim(t, "job-e2e")
	if err := launchErr(l1, r.req("job-e2e", ls)); err != nil {
		t.Fatalf("first launch on a live claim and a live grant: %v", err)
	}
	if r.exec.n() != 1 {
		t.Fatalf("%d execs after the first launch; want 1", r.exec.n())
	}

	t.Run("replayed on the same launcher", func(t *testing.T) {
		if err := launchErr(l1, r.req("job-e2e", ls)); !errors.Is(err, ErrLease) {
			t.Errorf("replay: %v; want ErrLease", err)
		}
	})

	t.Run("replayed on a launcher with its own State dir", func(t *testing.T) {
		other, err := r.launcher(t, t.TempDir())
		if err != nil {
			t.Fatalf("New on another State: %v", err)
		}
		if err := launchErr(other, r.req("job-e2e", ls)); !errors.Is(err, ErrLease) {
			t.Errorf("replay from another State dir: %v; want ErrLease from the lease store", err)
		}
	})

	t.Run("replayed after state.json is deleted", func(t *testing.T) {
		must(t, os.Remove(filepath.Join(r.state, "state.json")))
		if l, err := r.launcher(t, r.state); err == nil {
			if err := launchErr(l, r.req("job-e2e", ls)); err == nil {
				t.Error("replay after state.json was deleted: nil; want refused")
			}
		}
	})

	if r.exec.n() != 1 {
		t.Errorf("%d execs; a replayed lease reached exec", r.exec.n())
	}

	t.Run("a revocation binds the next launch", func(t *testing.T) {
		l, err := r.launcher(t, t.TempDir())
		if err != nil {
			t.Fatal(err)
		}
		if err := RevokeGrant(context.Background(), r.j, d8GrantA); err != nil {
			t.Fatalf("RevokeGrant: %v", err)
		}
		fresh := r.claim(t, "job-after-revoke")
		if err := launchErr(l, r.req("job-after-revoke", fresh)); !errors.Is(err, ErrGrant) {
			t.Errorf("a launch after revocation: %v; want ErrGrant", err)
		}
		if err := r.store.Consume("job-after-revoke", fresh); err != nil {
			t.Errorf("the refused launch consumed its lease: %v", err)
		}
		if r.exec.n() != 1 {
			t.Errorf("%d execs; the revoked grant launched", r.exec.n())
		}
	})
}
