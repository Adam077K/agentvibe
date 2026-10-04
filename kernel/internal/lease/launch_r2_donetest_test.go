//go:build donetest

// B1-08d done-tests, round 2: "2026-10-03 red-team r1 gaps + rulings". The red-team on 26000de
// proved the r1 tests reachable and found 8 of 33 mutants surviving; these close the lease-store
// gaps, adapted from its proposals, plus the orchestrator's Verify-then-CAS ruling:
//
//	R1 (HIGH) The lease encoding is canonical, "job://<id>#<decimal token>", and consumption is keyed
//	   by the parsed (job, token): after a Consume, a zero-padded or signed rendering is refused.
//	R2 (HIGH) The CAS holds when Append is slow (3 ms): of 64 concurrent Consumes exactly one wins.
//	R3 (HIGH) Consumption is in the Journal: a successful Consume changes its StateHash, and an
//	   independent Journal with the same job id and token still consumes (no process-global map).
//	R4 (MED) An Append-only failure (reads healthy) fails Consume.
//	R5 (MED) A read failure after a healthy Verify fails Verify: no last-known-good fallback.
//	R6 (ruling) Verify-then-CAS: a release and re-claim landing between Consume's read and its write
//	   must not consume the stale token. The CAS is conditioned on the job's current claim.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_08d ./internal/lease/
package lease_test

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

// TestB1_08d_R2_CanonicalEncoding: R1.
func TestB1_08d_R2_CanonicalEncoding(t *testing.T) {
	j, _ := d8Open(t)
	c := d8Claim(t, d8Claimer(t, j), "job-nc", "runner-a", time.Hour)
	if got, want := lease.FencedLease(c), fmt.Sprintf("job://job-nc#%d", c.Token); got != want {
		t.Fatalf("FencedLease = %q; want the canonical %q", got, want)
	}
	v := d8Verifier(t, j, time.Now)
	real := d8Lease(t, c)
	variants := []string{
		fmt.Sprintf("job://job-nc#0%d", c.Token),
		fmt.Sprintf("job://job-nc#00%d", c.Token),
		fmt.Sprintf("job://job-nc#+%d", c.Token),
		fmt.Sprintf("job://job-nc# %d", c.Token),
	}
	for _, p := range variants {
		if err := v.Verify("job-nc", p, time.Now()); err == nil {
			t.Errorf("Verify of the non-canonical %q: nil; want refused", p)
		}
	}
	if err := v.Consume("job-nc", real); err != nil {
		t.Fatalf("Consume of the canonical lease: %v", err)
	}
	for _, p := range variants {
		if err := v.Consume("job-nc", p); err == nil {
			t.Errorf("Consume of %q after %q was consumed: nil; want refused", p, real)
		}
	}
}

// slowAppend widens the window between a Consume's read and its write.
type slowAppend struct{ journal.Journal }

func (s slowAppend) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	time.Sleep(3 * time.Millisecond)
	return s.Journal.Append(ctx, p)
}

// TestB1_08d_R2_CASUnderSlowAppend: R2.
func TestB1_08d_R2_CASUnderSlowAppend(t *testing.T) {
	j, _ := d8Open(t)
	c := d8Claim(t, d8Claimer(t, j), "job-slow", "runner-a", time.Hour)
	v := d8Verifier(t, slowAppend{j}, time.Now)
	if wins := d8Race(v, nil, "job-slow", d8Lease(t, c), 64); wins != 1 {
		t.Errorf("%d of 64 Consumes succeeded with a 3 ms Append; want exactly 1", wins)
	}
}

// TestB1_08d_R2_ConsumptionIsInTheJournal: R3.
func TestB1_08d_R2_ConsumptionIsInTheJournal(t *testing.T) {
	ctx := context.Background()
	j, _ := d8Open(t)
	c := d8Claim(t, d8Claimer(t, j), "job-x", "runner-a", time.Hour)
	before, err := j.StateHash(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err := d8Verifier(t, j, time.Now).Consume("job-x", d8Lease(t, c)); err != nil {
		t.Fatalf("Consume: %v", err)
	}
	if after, err := j.StateHash(ctx); err != nil || after == before {
		t.Errorf("StateHash %q -> %q (%v) across a successful Consume; consumption must be written to the Journal", before, after, err)
	}
	j2, _ := d8Open(t) // an independent Journal: same job id, same token
	c2 := d8Claim(t, d8Claimer(t, j2), "job-x", "runner-a", time.Hour)
	if c2.Token != c.Token {
		t.Fatalf("fixture: tokens %d and %d differ", c.Token, c2.Token)
	}
	if err := d8Verifier(t, j2, time.Now).Consume("job-x", d8Lease(t, c2)); err != nil {
		t.Errorf("Consume on an independent Journal: %v; consumption leaked across Journals", err)
	}
}

type appendFails struct {
	journal.Journal
	mu   sync.Mutex
	fail bool
}

func (a *appendFails) set(b bool) { a.mu.Lock(); a.fail = b; a.mu.Unlock() }

func (a *appendFails) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	a.mu.Lock()
	f := a.fail
	a.mu.Unlock()
	if f {
		return journal.Event{}, errInjected
	}
	return a.Journal.Append(ctx, p)
}

// TestB1_08d_R2_AppendOnlyFailureFailsClosed: R4.
func TestB1_08d_R2_AppendOnlyFailureFailsClosed(t *testing.T) {
	j, _ := d8Open(t)
	c := d8Claim(t, d8Claimer(t, j), "job-af", "runner-a", time.Hour)
	f := &appendFails{Journal: j, fail: true}
	v := d8Verifier(t, f, time.Now)
	if err := v.Verify("job-af", d8Lease(t, c), time.Now()); err != nil {
		t.Fatalf("Verify with reads healthy: %v (control)", err)
	}
	if err := v.Consume("job-af", d8Lease(t, c)); err == nil {
		t.Error("Consume with Append failing and reads healthy: nil; want an error")
	}
	f.set(false)
	if err := v.Consume("job-af", d8Lease(t, c)); err != nil {
		t.Errorf("Consume once Append recovers: %v; the failed one must not have consumed", err)
	}
}

// TestB1_08d_R2_NoLastKnownGood: R5.
func TestB1_08d_R2_NoLastKnownGood(t *testing.T) {
	j, _ := d8Open(t)
	c := d8Claim(t, d8Claimer(t, j), "job-lkg", "runner-a", time.Hour)
	f := &failing{Journal: j}
	v := d8Verifier(t, f, time.Now)
	l := d8Lease(t, c)
	if err := v.Verify("job-lkg", l, time.Now()); err != nil {
		t.Fatalf("healthy Verify: %v (control)", err)
	}
	f.set(true)
	if err := v.Verify("job-lkg", l, time.Now()); err == nil {
		t.Error("Verify with the Journal failing after a healthy Verify: nil; want an error")
	}
	if err := v.Consume("job-lkg", l); err == nil {
		t.Error("Consume with the Journal failing after a healthy Verify: nil; want an error")
	}
}

// interleave runs hook once, on the underlying Journal, just before the first Append through it is
// forwarded: a transition that lands between a Consume's read and its write.
type interleave struct {
	journal.Journal
	once sync.Once
	hook func()
}

func (w *interleave) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	w.once.Do(w.hook)
	return w.Journal.Append(ctx, p)
}

// TestB1_08d_R2_VerifyThenCASIsConditioned: R6.
func TestB1_08d_R2_VerifyThenCASIsConditioned(t *testing.T) {
	ctx := context.Background()
	j, _ := d8Open(t)
	cl := d8Claimer(t, j)
	old := d8Claim(t, cl, "job-toctou", "runner-a", time.Hour)
	var cur lease.Claim
	w := &interleave{Journal: j, hook: func() {
		if err := cl.Release(ctx, old); err != nil {
			t.Errorf("hook Release: %v", err)
			return
		}
		c, err := cl.ClaimJob(ctx, "job-toctou", "runner-b", time.Hour)
		if err != nil {
			t.Errorf("hook re-claim: %v", err)
			return
		}
		cur = c
	}}
	v := d8Verifier(t, w, time.Now)
	if err := v.Consume("job-toctou", d8Lease(t, old)); err == nil {
		t.Error("Consume of a token released and re-claimed between its read and its write: nil; want refused")
	} else if !errors.Is(err, lease.ErrStaleToken) && !errors.Is(err, journal.ErrSeqConflict) {
		t.Logf("refused with %v", err) // any refusal passes; ErrStaleToken is the expected one
	}
	if cur.Token == 0 {
		t.Fatal("the hook never ran: Consume wrote nothing through the Journal it was given")
	}
	if err := v.Consume("job-toctou", d8Lease(t, cur)); err != nil {
		t.Errorf("Consume of the new holder's token: %v; want nil", err)
	}
	if err := v.Consume("job-toctou", d8Lease(t, old)); err == nil {
		t.Error("a later Consume of the stale token: nil; want refused")
	}
}
