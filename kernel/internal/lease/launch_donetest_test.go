//go:build donetest

// B1-08d done-tests, round 1 (2026-10-03): the launcher's real lease store. launcher.LeaseVerifier
// (kernel/internal/launcher/launcher.go) is implemented here, over the job:// claim rows B1-05
// wrote (lease.go), because 09a §6 names "the launcher's claim row" as the job:// verifier and
// §4.2 makes the Journal the canonical store for leases. The contract is launch.go.
//
// Each test pins one acceptance item of the B1-08d brief:
//
//	(a1) Consume is an atomic compare-and-set: the same lease consumed twice is refused, from many
//	     goroutines and from two LaunchVerifiers over one Journal; exactly one wins.
//	(a2) the lease must be live and fenced: a stale (released or re-claimed) or expired holder is
//	     refused, and so is the right token presented for the wrong job.
//	(a3) consumption survives a restart (the Journal is closed and reopened).
//	(a4) a lease this package never issued is refused.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_08d ./internal/lease/
package lease_test

import (
	"context"
	"errors"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

// d8Open opens a fresh Journal in a temp dir and returns it with its path.
func d8Open(t *testing.T) (journal.Journal, string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "journal.db")
	j, err := journal.Open(path)
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { _ = j.Close() })
	return j, path
}

func d8Verifier(t *testing.T, j journal.Journal, now func() time.Time) lease.LaunchVerifier {
	t.Helper()
	v, err := lease.NewLaunchVerifier(j, now)
	if err != nil {
		t.Fatalf("NewLaunchVerifier: %v", err)
	}
	if v == nil {
		t.Fatal("NewLaunchVerifier returned nil and no error")
	}
	return v
}

func d8Claim(t *testing.T, c lease.Claimer, job, runner string, ttl time.Duration) lease.Claim {
	t.Helper()
	cl, err := c.ClaimJob(context.Background(), job, runner, ttl)
	if err != nil {
		t.Fatalf("ClaimJob(%s): %v", job, err)
	}
	return cl
}

func d8Claimer(t *testing.T, j journal.Journal) lease.Claimer {
	t.Helper()
	c, err := lease.New(j)
	if err != nil {
		t.Fatalf("lease.New: %v", err)
	}
	return c
}

// d8Lease renders c and checks the one shape the launcher states (launcher.go Prerequisites:
// "job://<id>" plus its fencing token).
func d8Lease(t *testing.T, c lease.Claim) string {
	t.Helper()
	s := lease.FencedLease(c)
	if !strings.HasPrefix(s, "job://"+c.JobID) || len(s) <= len("job://"+c.JobID) {
		t.Fatalf("FencedLease(%+v) = %q; want job://%s plus its token", c, s, c.JobID)
	}
	return s
}

// failing wraps a Journal; while fail is set, Head, Read and Append error.
type failing struct {
	journal.Journal
	mu   sync.Mutex
	fail bool
}

var errInjected = errors.New("injected journal failure")

func (f *failing) set(b bool) { f.mu.Lock(); f.fail = b; f.mu.Unlock() }
func (f *failing) on() bool   { f.mu.Lock(); defer f.mu.Unlock(); return f.fail }

func (f *failing) Head(ctx context.Context, s string) (uint64, string, error) {
	if f.on() {
		return 0, "", errInjected
	}
	return f.Journal.Head(ctx, s)
}

func (f *failing) Read(ctx context.Context, s string, from uint64) ([]journal.Event, error) {
	if f.on() {
		return nil, errInjected
	}
	return f.Journal.Read(ctx, s, from)
}

func (f *failing) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	if f.on() {
		return journal.Event{}, errInjected
	}
	return f.Journal.Append(ctx, p)
}

// TestB1_08d_ConsumeIsCompareAndSet: item a1.
func TestB1_08d_ConsumeIsCompareAndSet(t *testing.T) {
	t.Run("constructor refuses nil collaborators", func(t *testing.T) {
		j, _ := d8Open(t)
		if v, err := lease.NewLaunchVerifier(nil, time.Now); err == nil || v != nil {
			t.Errorf("nil journal: %v, %v; want an error and no verifier", v, err)
		}
		if v, err := lease.NewLaunchVerifier(j, nil); err == nil || v != nil {
			t.Errorf("nil clock: %v, %v; want an error and no verifier", v, err)
		}
	})

	t.Run("a live lease verifies, consumes once, and Verify never consumes", func(t *testing.T) {
		j, _ := d8Open(t)
		c := d8Claim(t, d8Claimer(t, j), "job-1", "runner-a", time.Hour)
		v := d8Verifier(t, j, time.Now)
		l := d8Lease(t, c)
		for i := 0; i < 3; i++ {
			if err := v.Verify("job-1", l, time.Now()); err != nil {
				t.Fatalf("Verify #%d of a live lease: %v", i+1, err)
			}
		}
		if err := v.Consume("job-1", l); err != nil {
			t.Fatalf("first Consume: %v", err)
		}
		if err := v.Consume("job-1", l); !errors.Is(err, lease.ErrConsumed) {
			t.Errorf("second Consume: %v; want ErrConsumed", err)
		}
	})

	t.Run("64 goroutines on one verifier: exactly one wins", func(t *testing.T) {
		j, _ := d8Open(t)
		c := d8Claim(t, d8Claimer(t, j), "job-race", "runner-a", time.Hour)
		v := d8Verifier(t, j, time.Now)
		if wins := d8Race(v, nil, "job-race", d8Lease(t, c), 64); wins != 1 {
			t.Errorf("%d of 64 concurrent Consumes succeeded; want exactly 1", wins)
		}
	})

	t.Run("two verifiers over one Journal, 32 goroutines each: exactly one wins", func(t *testing.T) {
		j, _ := d8Open(t)
		c := d8Claim(t, d8Claimer(t, j), "job-two", "runner-a", time.Hour)
		a, b := d8Verifier(t, j, time.Now), d8Verifier(t, j, time.Now)
		if wins := d8Race(a, b, "job-two", d8Lease(t, c), 32); wins != 1 {
			t.Errorf("%d of 64 Consumes across two verifiers succeeded; want exactly 1", wins)
		}
		if err := b.Consume("job-two", d8Lease(t, c)); !errors.Is(err, lease.ErrConsumed) {
			t.Errorf("a later Consume on the other verifier: %v; want ErrConsumed", err)
		}
	})

	t.Run("consumption is per (job, token): a later claim of the job consumes", func(t *testing.T) {
		j, _ := d8Open(t)
		cl := d8Claimer(t, j)
		v := d8Verifier(t, j, time.Now)
		c1 := d8Claim(t, cl, "job-again", "runner-a", time.Hour)
		if err := v.Consume("job-again", d8Lease(t, c1)); err != nil {
			t.Fatalf("Consume c1: %v", err)
		}
		// Consuming does not end the claim: its runner still releases it, and the job re-claims.
		if err := cl.Release(context.Background(), c1); err != nil {
			t.Fatalf("Release after Consume: %v; consumption must not break the claim row", err)
		}
		c2 := d8Claim(t, cl, "job-again", "runner-b", time.Hour)
		if err := v.Consume("job-again", d8Lease(t, c2)); err != nil {
			t.Errorf("Consume of the job's next claim: %v; want nil", err)
		}
		other := d8Claim(t, cl, "job-other", "runner-a", time.Hour)
		if err := v.Consume("job-other", d8Lease(t, other)); err != nil {
			t.Errorf("Consume of another job's first claim: %v; want nil", err)
		}
	})
}

// d8Race runs n Consumes of lease on a and, when b is set, n more on b, all at once, and returns
// how many succeeded.
func d8Race(a, b lease.LaunchVerifier, job, l string, n int) int {
	vs := []lease.LaunchVerifier{a}
	if b != nil {
		vs = append(vs, b)
	}
	var (
		wg    sync.WaitGroup
		mu    sync.Mutex
		wins  int
		start = make(chan struct{})
	)
	for _, v := range vs {
		for i := 0; i < n; i++ {
			wg.Add(1)
			go func(v lease.LaunchVerifier) {
				defer wg.Done()
				<-start
				if v.Consume(job, l) == nil {
					mu.Lock()
					wins++
					mu.Unlock()
				}
			}(v)
		}
	}
	close(start)
	wg.Wait()
	return wins
}

// TestB1_08d_LeaseMustBeLiveAndFenced: item a2.
func TestB1_08d_LeaseMustBeLiveAndFenced(t *testing.T) {
	ctx := context.Background()

	t.Run("a released holder is refused", func(t *testing.T) {
		j, _ := d8Open(t)
		cl := d8Claimer(t, j)
		c := d8Claim(t, cl, "job-rel", "runner-a", time.Hour)
		if err := cl.Release(ctx, c); err != nil {
			t.Fatal(err)
		}
		v := d8Verifier(t, j, time.Now)
		if err := v.Verify("job-rel", d8Lease(t, c), time.Now()); err == nil {
			t.Error("Verify of a released lease: nil; want refused")
		}
		if err := v.Consume("job-rel", d8Lease(t, c)); err == nil {
			t.Error("Consume of a released lease: nil; want refused")
		}
	})

	t.Run("a superseded holder is refused and the new holder is not", func(t *testing.T) {
		j, _ := d8Open(t)
		cl := d8Claimer(t, j)
		old := d8Claim(t, cl, "job-sup", "runner-a", 30*time.Millisecond)
		time.Sleep(80 * time.Millisecond) // the claim expires unrenewed
		cur := d8Claim(t, cl, "job-sup", "runner-b", time.Hour)
		if cur.Token <= old.Token {
			t.Fatalf("re-claim token %d not above %d", cur.Token, old.Token)
		}
		v := d8Verifier(t, j, time.Now)
		if err := v.Verify("job-sup", d8Lease(t, old), time.Now()); !errors.Is(err, lease.ErrStaleToken) {
			t.Errorf("Verify of the superseded token: %v; want ErrStaleToken", err)
		}
		if err := v.Consume("job-sup", d8Lease(t, old)); !errors.Is(err, lease.ErrStaleToken) {
			t.Errorf("Consume of the superseded token: %v; want ErrStaleToken", err)
		}
		if err := v.Consume("job-sup", d8Lease(t, cur)); err != nil {
			t.Errorf("Consume of the current token: %v; want nil", err)
		}
	})

	t.Run("an expired lease is refused, by Verify at its now and by Consume at the store's clock", func(t *testing.T) {
		j, _ := d8Open(t)
		c := d8Claim(t, d8Claimer(t, j), "job-exp", "runner-a", time.Hour)
		l := d8Lease(t, c)
		later := func() time.Time { return time.Now().Add(2 * time.Hour) }
		live := d8Verifier(t, j, time.Now)
		if err := live.Verify("job-exp", l, time.Now()); err != nil {
			t.Fatalf("Verify now: %v; want nil (control)", err)
		}
		if err := live.Verify("job-exp", l, later()); err == nil {
			t.Error("Verify two hours past a one-hour claim: nil; want refused")
		}
		if err := live.Verify("job-exp", l, c.ExpiresAt); err == nil {
			t.Error("Verify at exactly ExpiresAt: nil; want refused (live iff now < ExpiresAt)")
		}
		if err := d8Verifier(t, j, later).Consume("job-exp", l); err == nil {
			t.Error("Consume on a store clock past expiry: nil; want refused")
		}
		if err := live.Consume("job-exp", l); err != nil {
			t.Errorf("the refused Consume above must have written nothing; Consume now: %v", err)
		}
	})

	t.Run("the right token for the wrong job is refused", func(t *testing.T) {
		j, _ := d8Open(t)
		cl := d8Claimer(t, j)
		a := d8Claim(t, cl, "job-a", "runner-a", time.Hour)
		b := d8Claim(t, cl, "job-b", "runner-b", time.Hour)
		if a.Token != b.Token {
			t.Fatalf("fixture: tokens %d and %d; each job's first claim should carry the same seq", a.Token, b.Token)
		}
		hash := d8Claim(t, cl, "job-a#1", "runner-c", time.Hour) // a job id that a naive split misreads
		v := d8Verifier(t, j, time.Now)
		for _, tc := range []struct{ job, l, name string }{
			{"job-b", d8Lease(t, a), "job-a's lease presented for job-b"},
			{"job-a", d8Lease(t, b), "job-b's lease presented for job-a"},
			{"job-a", d8Lease(t, hash), "job-a#1's lease presented for job-a"},
			{"job-a#1", d8Lease(t, a), "job-a's lease presented for job-a#1"},
			{"job-c", d8Lease(t, a), "job-a's lease presented for a never-claimed job"},
		} {
			if err := v.Verify(tc.job, tc.l, time.Now()); err == nil {
				t.Errorf("Verify, %s: nil; want refused", tc.name)
			}
			if err := v.Consume(tc.job, tc.l); err == nil {
				t.Errorf("Consume, %s: nil; want refused", tc.name)
			}
		}
		// None of the refused Consumes consumed anything.
		for _, c := range []lease.Claim{a, b, hash} {
			if err := v.Consume(c.JobID, d8Lease(t, c)); err != nil {
				t.Errorf("Consume of %s's own lease after the refusals: %v; want nil", c.JobID, err)
			}
		}
	})

	t.Run("a read or write failure fails closed and consumes nothing", func(t *testing.T) {
		j, _ := d8Open(t)
		c := d8Claim(t, d8Claimer(t, j), "job-io", "runner-a", time.Hour)
		f := &failing{Journal: j}
		v := d8Verifier(t, f, time.Now)
		l := d8Lease(t, c)
		f.set(true)
		if err := v.Verify("job-io", l, time.Now()); err == nil {
			t.Error("Verify with the Journal failing: nil; want an error")
		}
		if err := v.Consume("job-io", l); err == nil {
			t.Error("Consume with the Journal failing: nil; want an error")
		}
		f.set(false)
		if err := v.Consume("job-io", l); err != nil {
			t.Errorf("Consume after the failure cleared: %v; the failed one must not have consumed", err)
		}
	})
}

// TestB1_08d_ConsumptionSurvivesRestart: item a3.
func TestB1_08d_ConsumptionSurvivesRestart(t *testing.T) {
	path := filepath.Join(t.TempDir(), "journal.db")
	j, err := journal.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	c := d8Claim(t, d8Claimer(t, j), "job-rs", "runner-a", time.Hour)
	unused := d8Claim(t, d8Claimer(t, j), "job-rs2", "runner-a", time.Hour)
	if err := d8Verifier(t, j, time.Now).Consume("job-rs", d8Lease(t, c)); err != nil {
		t.Fatalf("Consume before restart: %v", err)
	}
	if err := j.Close(); err != nil {
		t.Fatal(err)
	}
	j2, err := journal.Open(path)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	t.Cleanup(func() { _ = j2.Close() })
	v := d8Verifier(t, j2, time.Now)
	if err := v.Consume("job-rs", d8Lease(t, c)); !errors.Is(err, lease.ErrConsumed) {
		t.Errorf("Consume after restart: %v; want ErrConsumed", err)
	}
	if err := v.Consume("job-rs2", d8Lease(t, unused)); err != nil {
		t.Errorf("an unconsumed lease after restart: %v; want nil", err)
	}
}

// TestB1_08d_NeverIssuedRefused: item a4.
func TestB1_08d_NeverIssuedRefused(t *testing.T) {
	j, _ := d8Open(t)
	c := d8Claim(t, d8Claimer(t, j), "job-n", "runner-a", time.Hour)
	real := d8Lease(t, c)
	v := d8Verifier(t, j, time.Now)
	forged := []struct{ name, l string }{
		{"a token above the current one", lease.FencedLease(lease.Claim{JobID: "job-n", Resource: "job://job-n", Runner: "runner-a", Token: c.Token + 1, ExpiresAt: c.ExpiresAt})},
		{"token zero", lease.FencedLease(lease.Claim{JobID: "job-n", Resource: "job://job-n", Runner: "runner-a", Token: 0, ExpiresAt: c.ExpiresAt})},
		{"the empty string", ""},
		{"the resource alone", "job://job-n"},
		{"garbage", "not-a-lease"},
		{"the real lease with a digit appended", real + "0"},
		{"the real lease with a space prepended", " " + real},
		{"the real lease with a space appended", real + " "},
		{"the real lease upper-cased", strings.ToUpper(real)},
	}
	for _, f := range forged {
		if f.l == real {
			t.Fatalf("fixture %q equals the real lease", f.name)
		}
		if err := v.Verify("job-n", f.l, time.Now()); err == nil {
			t.Errorf("Verify, %s (%q): nil; want refused", f.name, f.l)
		}
		if err := v.Consume("job-n", f.l); err == nil {
			t.Errorf("Consume, %s (%q): nil; want refused", f.name, f.l)
		}
	}
	ghost := lease.FencedLease(lease.Claim{JobID: "job-ghost", Resource: "job://job-ghost", Runner: "runner-a", Token: 1, ExpiresAt: c.ExpiresAt})
	if err := v.Consume("job-ghost", ghost); err == nil {
		t.Error("Consume of a never-claimed job's token 1: nil; want refused")
	}
	if err := v.Consume("job-n", real); err != nil {
		t.Errorf("the real lease after every refusal: %v; want nil (nothing forged consumed it)", err)
	}
}
