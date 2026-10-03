package lease

// Adversarial probes of fence.go (B1-04), written by someone other than its implementer. A plain
// test file: not a done-test, not registered in build/done-tests/B1-04.yml. Each of probes 1-4 was
// shown to fail against a mutant of fence.go (partial grant left in place, storage fence check
// removed, an older token of the same job accepted, detector off) before it was committed.
//
// Every lease clock is injected. Probe 1 sleeps for a few microseconds of real time between
// retries only to vary interleavings; nothing it asserts depends on wall-clock time.

import (
	"context"
	"errors"
	"fmt"
	"math/rand/v2"
	"slices"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

const (
	advE    = "repo://r/src/e.ts#*"
	advF    = "repo://r/src/f.ts#*"
	advGlob = "repo://r/lib/**"
	advLib  = "repo://r/lib/x.ts#f"
)

func advPush(job string, tokens map[string]uint64, touched ...string) Push {
	return Push{Job: job, Tokens: tokens, Touched: touched}
}

// advStale asserts p is refused as a stale token (and not merely as undeclared) and that the
// refusal names every resource in names.
func advStale(t *testing.T, v Verifier, p Push, names ...string) {
	t.Helper()
	err := v.Receive(context.Background(), p)
	if !errors.Is(err, ErrStaleToken) {
		t.Fatalf("push by %s touching %v with %v: want ErrStaleToken, got %v", p.Job, p.Touched, p.Tokens, err)
	}
	if errors.Is(err, ErrUndeclared) {
		t.Fatalf("push by %s touching %v: refused as undeclared too, but every touched resource was presented: %v", p.Job, p.Touched, err)
	}
	for _, n := range names {
		if !strings.Contains(err.Error(), n) {
			t.Fatalf("refusal does not name %s: %v", n, err)
		}
	}
}

func advAccept(t *testing.T, v Verifier, p Push) {
	t.Helper()
	if err := v.Receive(context.Background(), p); err != nil {
		t.Fatalf("push by %s touching %v with %v: want accepted, got %v", p.Job, p.Touched, p.Tokens, err)
	}
}

func advLease(t *testing.T, c Coordinator, r string) (Lease, bool) {
	t.Helper()
	l, ok, err := c.Holder(context.Background(), r)
	if err != nil {
		t.Fatalf("Holder(%s): %v", r, err)
	}
	return l, ok
}

// ---------------------------------------------------------------------------------------------
// 1. Concurrent acquire race.

// TestAdvConcurrentAcquireNoPartialGrant races workers over three Coordinators sharing one Journal.
// Each worker repeatedly requests a random 2-4 resource subset of six, in random order, and releases
// before its next request, so no worker ever holds while it waits.
//
// Asserted, by each worker about itself: a grant carries one token per requested resource, all
// equal; immediately after it, Holder shows the worker on every requested resource with that token
// (under WoundWait, or a larger token if an older worker has since wounded it); the worker has no
// outstanding wait; and the repo:// verifier accepts the grant (AllOrNothing only — under WoundWait
// it may already be wounded). An ErrWait leaves the worker holding none of the requested resources,
// with exactly that request as its outstanding wait. Detect never breaks anything (no worker holds
// while it waits, so there is no cycle). Every worker finishes within the deadline.
//
// Asserted, by an observer on its own Coordinator, against the grants the workers recorded: if job
// J is seen holding r with token T, then T granted r to J, and every other resource of that grant
// is, when read afterwards, either unheld or held with a token >= T. A row with a smaller token seen
// later existed, unchanged, at T — so seeing one means T was granted while part of its request was
// held elsewhere. The reads are not one snapshot, and the invariant does not need them to be.
func TestAdvConcurrentAcquireNoPartialGrant(t *testing.T) {
	for _, pol := range []Policy{AllOrNothing, WoundWait} {
		t.Run(string(pol), func(t *testing.T) { advRace(t, pol) })
	}
}

type advIssued struct {
	job string
	set []string
}

func advRace(t *testing.T, pol Policy) {
	const (
		workers = 8
		rounds  = 10
		coords  = 3
	)
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	all := []string{fA, fB, fC, fD, advE, advF}
	cs := make([]Coordinator, coords)
	for i := range cs {
		cs[i] = fCoord(t, j, clk)
	}
	obs := fCoord(t, j, clk)
	v := fVerifier(t, j)
	ctx := context.Background()

	var grants sync.Map // token -> advIssued
	var failed atomic.Bool
	fail := func(format string, a ...any) {
		if failed.CompareAndSwap(false, true) {
			t.Errorf(format, a...)
		}
	}
	// gaveUp is the contract's "gave up after N contended attempts": an honest refusal under
	// contention, retried here rather than counted as a defect.
	gaveUp := func(err error) bool { return err != nil && strings.Contains(err.Error(), "contended attempts") }

	done := make(chan struct{})
	stopObs := make(chan struct{})
	obsDone := make(chan struct{})
	var observed atomic.Int64

	go func() {
		defer close(obsDone)
		for {
			select {
			case <-stopObs:
				return
			default:
			}
			for _, r := range all {
				l, ok, err := obs.Holder(ctx, r)
				if err != nil {
					fail("observer Holder(%s): %v", r, err)
					return
				}
				if !ok {
					continue
				}
				gi, known := grants.Load(l.Token)
				if !known {
					continue // granted, but its worker has not recorded it yet
				}
				g := gi.(advIssued)
				if g.job != l.Job || !slices.Contains(g.set, r) {
					fail("observer: %s held by %s with token %d, but token %d granted %v to %s",
						r, l.Job, l.Token, l.Token, g.set, g.job)
					return
				}
				for _, o := range g.set {
					if o == r {
						continue
					}
					lo, oko, err := obs.Holder(ctx, o)
					if err != nil {
						fail("observer Holder(%s): %v", o, err)
						return
					}
					if oko && lo.Token < l.Token {
						fail("observer: PARTIAL GRANT — token %d granted %v to %s, yet %s is afterwards held by %s with older token %d",
							l.Token, g.set, g.job, o, lo.Job, lo.Token)
						return
					}
				}
				observed.Add(1)
			}
		}
	}()

	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			c := cs[w%coords]
			job := fmt.Sprintf("w%d", w)
			born := fEpoch.Add(time.Duration(w) * time.Second)
			rng := rand.New(rand.NewPCG(uint64(w)+1, uint64(time.Now().UnixNano())))
			waits := 0
			for got := 0; got < rounds && !failed.Load(); {
				k := 2 + rng.IntN(3)
				perm := rng.Perm(len(all))
				set := make([]string, k)
				for i := range set {
					set[i] = all[perm[i]]
				}
				g, err := c.Acquire(ctx, Request{Job: job, Born: born, Resources: set, Policy: pol, TTL: time.Hour})
				switch {
				case gaveUp(err):
					continue
				case errors.Is(err, ErrWait):
					waits++
					ws, ok, err := c.Waiting(ctx, job)
					if err != nil || !ok {
						fail("%s: ErrWait on %v but Waiting = %v, %v, %v", job, set, ws, ok, err)
						return
					}
					if a, b := slices.Sorted(slices.Values(ws)), slices.Sorted(slices.Values(set)); !slices.Equal(a, b) {
						fail("%s: ErrWait on %v but outstanding wait is %v", job, set, ws)
						return
					}
					for _, r := range set {
						l, ok, err := c.Holder(ctx, r)
						if err != nil {
							fail("%s Holder(%s): %v", job, r, err)
							return
						}
						if ok && l.Job == job {
							fail("%s: PARTIAL GRANT — ErrWait on %v, yet it holds %s (token %d)", job, set, r, l.Token)
							return
						}
					}
					if waits%4 == 0 {
						br, err := c.Detect(ctx)
						if gaveUp(err) {
							break
						}
						if err != nil || len(br) != 0 {
							fail("%s: Detect broke %v (err %v) though no worker holds while it waits", job, br, err)
							return
						}
					}
					time.Sleep(time.Duration(rng.IntN(300)) * time.Microsecond)
				case err != nil:
					fail("%s Acquire(%v): %v", job, set, err)
					return
				default:
					if len(g.Tokens) != len(set) {
						fail("%s: grant for %v carries %d tokens: %v", job, set, len(g.Tokens), g.Tokens)
						return
					}
					tok := g.Tokens[set[0]]
					for _, r := range set {
						if g.Tokens[r] != tok || tok == 0 {
							fail("%s: grant for %v carries unequal or zero tokens: %v", job, set, g.Tokens)
							return
						}
					}
					grants.Store(tok, advIssued{job: job, set: set})
					if _, ok, err := c.Waiting(ctx, job); err != nil || ok {
						fail("%s: granted %v but still has an outstanding wait (err %v)", job, set, err)
						return
					}
					for _, r := range set {
						l, ok, err := c.Holder(ctx, r)
						if err != nil {
							fail("%s Holder(%s): %v", job, r, err)
							return
						}
						mine := ok && l.Job == job && l.Token == tok
						woundedSince := pol == WoundWait && (!ok || l.Token > tok) // wounded since, and perhaps released by the winner
						if !mine && !woundedSince {
							fail("%s: PARTIAL GRANT — granted %v at token %d, but %s shows holder %q token %d (held %v)",
								job, set, tok, r, l.Job, l.Token, ok)
							return
						}
					}
					if pol == AllOrNothing {
						if err := v.Receive(ctx, Push{Job: job, Tokens: g.Tokens, Touched: set}); err != nil {
							fail("%s: verifier refused its own live grant %v: %v", job, g.Tokens, err)
							return
						}
					}
					for {
						err := c.Release(ctx, job)
						if gaveUp(err) {
							continue
						}
						if err != nil {
							fail("%s Release: %v", job, err)
							return
						}
						break
					}
					got++
				}
			}
		}(w)
	}

	go func() { wg.Wait(); close(done) }()
	select {
	case <-done:
	case <-time.After(60 * time.Second):
		failed.Store(true)
		close(stopObs)
		t.Fatalf("%s: workers did not finish within 60s — deadlock or livelock", pol)
	}
	close(stopObs)
	<-obsDone
	if failed.Load() {
		return
	}
	if observed.Load() == 0 {
		t.Fatalf("%s: the observer checked no held resource against a recorded grant; the probe was vacuous", pol)
	}
	n := 0
	grants.Range(func(any, any) bool { n++; return true })
	if n != workers*rounds {
		t.Fatalf("%s: %d grants recorded, want %d", pol, n, workers*rounds)
	}
	for _, r := range all {
		if l, ok := advLease(t, obs, r); ok {
			t.Fatalf("%s: every worker released, yet %s is held by %s", pol, r, l.Job)
		}
	}
}

// ---------------------------------------------------------------------------------------------
// 2. A wounded job keeps writing.

func TestAdvWoundedJobRefusedForEveryLostResource(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	c2 := fCoord(t, j, clk) // the older mission comes through another Coordinator
	v := fVerifier(t, j)

	young := fGrant(t, c, fReq("young", fEpoch.Add(time.Hour), WoundWait, fA, fB, fC, advGlob))
	advAccept(t, v, advPush("young", young.Tokens, fA, fB, fC, advLib))

	old := fGrant(t, c2, fReq("old", fEpoch, WoundWait, fA, fB, advGlob))
	lost := []string{fA, fB, advLib} // advLib is covered only by the wounded glob lease

	// Each lost resource, alone, is refused as stale — however often the wounded job retries, and
	// however many unrelated transitions happen in between.
	for round := 0; round < 3; round++ {
		for _, r := range lost {
			advStale(t, v, advPush("young", young.Tokens, r), r)
		}
		other := fmt.Sprintf("bystander%d", round)
		fGrant(t, c2, fReq(other, fEpoch.Add(time.Minute), AllOrNothing, fD))
		if err := c2.Release(context.Background(), other); err != nil {
			t.Fatal(err)
		}
	}

	// All of them at once, mixed with one it kept: refused, naming every lost one and not the kept one.
	err := v.Receive(context.Background(), advPush("young", young.Tokens, fA, fB, fC, advLib))
	if !errors.Is(err, ErrStaleToken) {
		t.Fatalf("mixed push: want ErrStaleToken, got %v", err)
	}
	for _, r := range lost {
		if !strings.Contains(err.Error(), r) {
			t.Fatalf("mixed refusal does not name %s: %v", r, err)
		}
	}
	if strings.Contains(err.Error(), fC) {
		t.Fatalf("mixed refusal names %s, which young still holds: %v", fC, err)
	}

	// The wounded job presents the winner's tokens: still refused — a token is issued to a job.
	advStale(t, v, advPush("young", old.Tokens, fA, fB, advLib), fA, fB, advLib)
	// It presents the winner's token AND its own for an overlapping glob: still refused.
	mixed := map[string]uint64{fA: old.Tokens[fA], advGlob: young.Tokens[advGlob]}
	advStale(t, v, advPush("young", mixed, fA, advLib), fA, advLib)

	// The winner writes. After it releases, the wounded job's tokens are still not current.
	advAccept(t, v, advPush("old", old.Tokens, fA, fB, advLib))
	if err := c2.Release(context.Background(), "old"); err != nil {
		t.Fatal(err)
	}
	for _, r := range lost {
		advStale(t, v, advPush("young", young.Tokens, r), r)
	}
}

// ---------------------------------------------------------------------------------------------
// 3. Token reuse.

func TestAdvOldTokenRefusedAfterReleaseAndRegrant(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	v := fVerifier(t, j)
	tok := func(g Grant) map[string]uint64 { return map[string]uint64{fA: g.Tokens[fA]} }

	// Re-request of a resource the job holds: the new token supersedes the old one.
	g1 := fGrant(t, c, fReq("a", fEpoch, AllOrNothing, fA))
	advAccept(t, v, advPush("a", tok(g1), fA))
	g2 := fGrant(t, c, fReq("a", fEpoch, AllOrNothing, fA, fB))
	if g2.Tokens[fA] <= g1.Tokens[fA] {
		t.Fatalf("re-grant token %d not above %d", g2.Tokens[fA], g1.Tokens[fA])
	}
	advStale(t, v, advPush("a", tok(g1), fA), fA)
	advAccept(t, v, advPush("a", tok(g2), fA))

	// Release: no token of the job is current.
	if err := c.Release(context.Background(), "a"); err != nil {
		t.Fatal(err)
	}
	advStale(t, v, advPush("a", tok(g1), fA), fA)
	advStale(t, v, advPush("a", tok(g2), fA), fA)

	// Another job takes it: neither a's old tokens nor b's token, presented by a, are accepted.
	g3 := fGrant(t, c, fReq("b", fEpoch.Add(time.Second), AllOrNothing, fA))
	advStale(t, v, advPush("a", tok(g2), fA), fA)
	advStale(t, v, advPush("a", tok(g3), fA), fA)
	advAccept(t, v, advPush("b", tok(g3), fA))

	// a re-acquires after b releases: only the newest token works, for a; b's is now stale too.
	if err := c.Release(context.Background(), "b"); err != nil {
		t.Fatal(err)
	}
	g4 := fGrant(t, c, fReq("a", fEpoch, AllOrNothing, fA))
	for _, old := range []Grant{g1, g2, g3} {
		advStale(t, v, advPush("a", tok(old), fA), fA)
	}
	advStale(t, v, advPush("b", tok(g3), fA), fA)
	advAccept(t, v, advPush("a", tok(g4), fA))

	// Expiry, then another job takes it: a's last token is refused.
	clk.advance(2 * time.Minute)
	g5 := fGrant(t, c, fReq("b", fEpoch.Add(time.Second), AllOrNothing, fA))
	advStale(t, v, advPush("a", tok(g4), fA), fA)
	advAccept(t, v, advPush("b", tok(g5), fA))

	// Re-request repeatedly: each re-grant strands the one before it.
	prev := g5
	for i := 0; i < 5; i++ {
		next := fGrant(t, c, fReq("b", fEpoch.Add(time.Second), AllOrNothing, fA))
		advStale(t, v, advPush("b", tok(prev), fA), fA)
		advAccept(t, v, advPush("b", tok(next), fA))
		prev = next
	}
}

// ---------------------------------------------------------------------------------------------
// 4. Deadlock detector: a 3-cycle is broken once, at its youngest; a self-cycle never forms.

func TestAdvDetectThreeCycle(t *testing.T) {
	jobs := []string{"ja", "jb", "jc"}
	res := []string{fA, fB, fC}
	// Rotate which job is youngest so the victim is chosen by Born, not by position or id.
	for youngest := 0; youngest < 3; youngest++ {
		t.Run(jobs[youngest]+"-youngest", func(t *testing.T) {
			j := fOpen(t)
			clk := &fClock{t: fEpoch}
			c := fCoord(t, j, clk)
			v := fVerifier(t, j)
			born := func(i int) time.Time {
				if i == youngest {
					return fEpoch.Add(time.Hour)
				}
				return fEpoch.Add(time.Duration(i) * time.Minute)
			}
			grants := make([]Grant, 3)
			for i := range jobs {
				grants[i] = fGrant(t, c, fReq(jobs[i], born(i), AllOrNothing, res[i]))
			}
			// ja waits on jb, jb on jc: a chain, not a cycle.
			fWait(t, c, fReq(jobs[0], born(0), AllOrNothing, res[1]))
			fWait(t, c, fReq(jobs[1], born(1), AllOrNothing, res[2]))
			if br, err := c.Detect(context.Background()); err != nil || len(br) != 0 {
				t.Fatalf("Detect on a chain broke %v (err %v)", br, err)
			}
			// jc waits on ja: the cycle closes.
			fWait(t, c, fReq(jobs[2], born(2), AllOrNothing, res[0]))
			br, err := c.Detect(context.Background())
			if err != nil {
				t.Fatal(err)
			}
			if len(br) != 1 {
				t.Fatalf("Detect on a 3-cycle returned %d breaks: %v", len(br), br)
			}
			if br[0].Victim != jobs[youngest] {
				t.Fatalf("victim %s, want the youngest %s", br[0].Victim, jobs[youngest])
			}
			if got := slices.Sorted(slices.Values(br[0].Cycle)); !slices.Equal(got, jobs) {
				t.Fatalf("cycle %v, want %v", br[0].Cycle, jobs)
			}
			// The victim holds nothing and waits on nothing; its token is dead at storage.
			vi := youngest
			if h := fHolder(t, c, res[vi]); h != "" {
				t.Fatalf("victim's %s still held by %s", res[vi], h)
			}
			if _, ok, _ := c.Waiting(context.Background(), jobs[vi]); ok {
				t.Fatalf("victim %s still waits", jobs[vi])
			}
			advStale(t, v, advPush(jobs[vi], grants[vi].Tokens, res[vi]), res[vi])
			// The others keep their leases and their waits.
			for i := range jobs {
				if i == vi {
					continue
				}
				if h := fHolder(t, c, res[i]); h != jobs[i] {
					t.Fatalf("%s holder %q, want %s", res[i], h, jobs[i])
				}
				if _, ok, _ := c.Waiting(context.Background(), jobs[i]); !ok {
					t.Fatalf("%s lost its wait, but it was not the victim", jobs[i])
				}
				advAccept(t, v, advPush(jobs[i], grants[i].Tokens, res[i]))
			}
			if br, err := c.Detect(context.Background()); err != nil || len(br) != 0 {
				t.Fatalf("second Detect broke %v (err %v); the cycle was already broken", br, err)
			}
			// The job that waited on the victim can now proceed.
			waiter := (vi + 2) % 3 // jobs[i] waits on res[i+1]
			fGrant(t, c, fReq(jobs[waiter], born(waiter), AllOrNothing, res[vi]))
		})
	}
}

func TestAdvDetectNoSelfCycle(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	ctx := context.Background()

	fGrant(t, c, fReq("a", fEpoch, AllOrNothing, fA))
	fGrant(t, c, fReq("b", fEpoch.Add(time.Second), AllOrNothing, fB))

	// a asks again for what it alone holds: granted, never a wait on itself.
	fGrant(t, c, fReq("a", fEpoch, AllOrNothing, fA))
	fGrant(t, c, fReq("a", fEpoch, WoundWait, fA))
	if _, ok, _ := c.Waiting(ctx, "a"); ok {
		t.Fatal("a waits after re-requesting only its own resource")
	}

	// a asks for its own resource plus b's: its wait names fA, which it holds, but the only edge is a→b.
	fWait(t, c, fReq("a", fEpoch, AllOrNothing, fA, fB))
	ws, ok, err := c.Waiting(ctx, "a")
	if err != nil || !ok || !slices.Contains(ws, fA) {
		t.Fatalf("a's wait = %v, %v, %v; want one naming %s", ws, ok, err, fA)
	}
	for i := 0; i < 3; i++ {
		br, err := c.Detect(ctx)
		if err != nil || len(br) != 0 {
			t.Fatalf("Detect broke %v (err %v): a waiting partly on its own lease is not a cycle", br, err)
		}
	}
	if h := fHolder(t, c, fA); h != "a" {
		t.Fatalf("%s holder %q after Detect, want a", fA, h)
	}

	// b waits on its own resource and a's: now there is a real 2-cycle, and exactly one break.
	fWait(t, c, fReq("b", fEpoch.Add(time.Second), AllOrNothing, fB, fA))
	br, err := c.Detect(ctx)
	if err != nil || len(br) != 1 || br[0].Victim != "b" || len(br[0].Cycle) != 2 {
		t.Fatalf("2-cycle: Detect = %v, %v; want one break at b over 2 jobs", br, err)
	}
	for _, b := range br {
		for i, x := range b.Cycle {
			if slices.Contains(b.Cycle[i+1:], x) {
				t.Fatalf("cycle %v names %s twice", b.Cycle, x)
			}
		}
	}
}

// ---------------------------------------------------------------------------------------------
// 5. Documented, allowed behaviour: a wounded job keeps what the older job did not ask for.

// TestAdvWoundKeepsUnrequestedLeases pins current behaviour. Wound-wait revokes a younger holder's
// leases only "on the requested resources" (Coordinator.Acquire's contract); the grant event's
// Wounded lists only those, and fold.apply overwrites only d.Resources (fence.go ~323). So the
// wounded job keeps — and can still push under — every resource the older job did not request.
// This is permitted by the contract, but it is not in the B1-04 builder's BUILD-LOG follow-up list
// (docs/08-agents_work/sessions/2026-10-01-builder-b1-04.md); it belongs in
// docs/08-agents_work/BUILD-LOG.md as an open question: should a wound abort the whole mission?
// If that is decided, this test changes with it.
func TestAdvWoundKeepsUnrequestedLeases(t *testing.T) {
	j := fOpen(t)
	clk := &fClock{t: fEpoch}
	c := fCoord(t, j, clk)
	v := fVerifier(t, j)

	young := fGrant(t, c, fReq("young", fEpoch.Add(time.Hour), WoundWait, fA, fC))
	fGrant(t, c, fReq("old", fEpoch, WoundWait, fA))

	if h := fHolder(t, c, fA); h != "old" {
		t.Fatalf("%s holder %q, want old", fA, h)
	}
	l, ok := advLease(t, c, fC)
	if !ok || l.Job != "young" || l.Token != young.Tokens[fC] {
		t.Fatalf("%s = %+v (held %v); want still young's, token %d", fC, l, ok, young.Tokens[fC])
	}
	advAccept(t, v, advPush("young", young.Tokens, fC))
	advStale(t, v, advPush("young", young.Tokens, fA), fA)
	if br, err := c.Detect(context.Background()); err != nil || len(br) != 0 {
		t.Fatalf("Detect = %v, %v; a wound is not a deadlock", br, err)
	}
}
