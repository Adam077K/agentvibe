//go:build donetest

// Done-tests for B1-12 (docs/vision-v3/14-BUILD-PLAN.md): "Q3 subset: faults at 4 crash points
// -> one effect; `uncertain` never auto-retries", plus gate G1(b)'s "a two-launcher race has one
// winner". Frozen by B0-17b; the file's sha256 is registered in build/done-tests/B0-17b.yml.
// Run: go -C kernel test -tags donetest ./internal/outbox/...
package outbox

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"
)

type fakeClock struct {
	mu sync.Mutex
	t  time.Time
}

func (c *fakeClock) Now() time.Time          { c.mu.Lock(); defer c.mu.Unlock(); return c.t }
func (c *fakeClock) Advance(d time.Duration) { c.mu.Lock(); c.t = c.t.Add(d); c.mu.Unlock() }

// crashSignal is the panic value a crash hook raises to simulate process death.
type crashSignal struct{ p Point }

func crashAt(p Point) func(Point) {
	return func(q Point) {
		if q == p {
			panic(crashSignal{q})
		}
	}
}

// survive runs f and reports the crash point it died at, or "" if it returned.
func survive(f func()) (died Point) {
	defer func() {
		if r := recover(); r != nil {
			c, ok := r.(crashSignal)
			if !ok {
				panic(r)
			}
			died = c.p
		}
	}()
	f()
	return ""
}

// bank is a provider with NO deduplication of its own: two sends are two payments. An effect
// becomes visible to Lookup only after lag; a key with no effect reads Unknown until
// absentAfter, then Absent. lookupBlind makes every lookup Unknown (an at_most_once channel).
type bank struct {
	mu          sync.Mutex
	clock       *fakeClock
	lag         time.Duration
	absentAfter time.Time
	lookupBlind bool
	landed      map[string]time.Time // idem key -> when the effect happened
	effects     map[string]int       // payload -> number of times the effect happened
	doCalls     int
	inFlight    func(Point) // set: the next Do performs the effect, then fires ProviderInFlight
	timeout     bool        // set: the next Do performs the effect, then returns an ambiguous error
	reject      bool        // set: the next Do performs nothing and returns ErrRejected
}

func newBank(c *fakeClock, lag time.Duration) *bank {
	return &bank{clock: c, lag: lag, landed: map[string]time.Time{}, effects: map[string]int{}}
}

func (b *bank) Do(_ context.Context, idem string, payload []byte) error {
	b.mu.Lock()
	b.doCalls++
	if b.reject {
		b.reject = false
		b.mu.Unlock()
		return fmt.Errorf("card declined: %w", ErrRejected)
	}
	b.landed[idem] = b.clock.Now()
	b.effects[string(payload)]++
	hook, timeout := b.inFlight, b.timeout
	b.inFlight, b.timeout = nil, false
	b.mu.Unlock()
	if hook != nil {
		hook(ProviderInFlight)
	}
	if timeout {
		return context.DeadlineExceeded
	}
	return nil
}

func (b *bank) Lookup(_ context.Context, idem string) (Presence, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	now := b.clock.Now()
	if b.lookupBlind {
		return Unknown, nil
	}
	if at, ok := b.landed[idem]; ok {
		if now.Before(at.Add(b.lag)) {
			return Unknown, nil
		}
		return Present, nil
	}
	if now.Before(b.absentAfter) {
		return Unknown, nil
	}
	return Absent, nil
}

func (b *bank) count(payload []byte) (effects, calls int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.effects[string(payload)], b.doCalls
}

type world struct {
	t     *testing.T
	dir   string
	clock *fakeClock
	bank  *bank
}

func newWorld(t *testing.T, lag time.Duration) *world {
	c := &fakeClock{t: time.Date(2026, 10, 13, 3, 0, 0, 0, time.UTC)}
	b := newBank(c, lag)
	b.absentAfter = c.Now().Add(lag)
	return &world{t: t, dir: t.TempDir(), clock: c, bank: b}
}

// open starts a worker process over the shared outbox directory.
func (w *world) open(worker string, crash func(Point)) Outbox {
	w.t.Helper()
	ob, err := Open(w.dir, Deps{WorkerID: worker, Clock: w.clock, Provider: w.bank, Crash: crash})
	if err != nil {
		w.t.Fatalf("Open(%s): %v", worker, err)
	}
	if ob == nil {
		w.t.Fatalf("Open(%s) returned a nil Outbox and no error", worker)
	}
	return ob
}

func payment(ref string) Effect {
	return Effect{
		Key:     BusinessKey{Venture: "keel", Verb: "payment.pay", Target: "supplier_44", Ref: ref},
		Class:   CheckBefore,
		Payload: []byte("pay supplier_44 " + ref + " EUR 1200"),
	}
}

// B1-12 · done-test 1 (Q3 subset): a fault at each of four crash points, restarts under new
// worker IDs, and reads inside the visibility lag still give exactly one effect.
func TestB112FourCrashPointsGiveOneEffect(t *testing.T) {
	const lag = 30 * time.Second
	for _, p := range []Point{AfterDispatchingJournaled, ProviderInFlight, BeforeReceiptPersisted, DuringReconcile} {
		t.Run(string(p), func(t *testing.T) {
			ctx := context.Background()
			w := newWorld(t, lag)
			eff := payment("invoice_8812")

			// Life 1: propose and dispatch; die at the crash point.
			first := p
			if p == DuringReconcile {
				first = ProviderInFlight // the effect must be in doubt for reconcile to run
			}
			ob1 := w.open("w1", crashAt(first))
			op, err := ob1.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			if first == ProviderInFlight {
				w.bank.inFlight = crashAt(ProviderInFlight)
			}
			if died := survive(func() { _, _ = ob1.Dispatch(ctx, op.ID) }); died != first {
				t.Fatalf("life 1 died at %q, want %q (the outbox must reach the crash point)", died, first)
			}

			// Life 2 (DuringReconcile only): past the lag, the reconciler dies mid-record.
			if p == DuringReconcile {
				w.clock.Advance(2 * lag)
				ob := w.open("w2", crashAt(DuringReconcile))
				if died := survive(func() { _ = ob.Reconcile(ctx) }); died != DuringReconcile {
					t.Fatalf("reconcile died at %q, want %q", died, DuringReconcile)
				}
			}

			// A new worker inside the visibility lag: reads say Unknown, so nothing is re-sent.
			ob3 := w.open("w3", nil)
			if p != DuringReconcile {
				w.clock.Advance(lag / 3)
				_ = ob3.Reconcile(ctx)
				again, err := ob3.Propose(ctx, eff)
				if err != nil {
					t.Fatalf("re-Propose: %v", err)
				}
				if again.ID != op.ID {
					t.Fatalf("re-Propose under a new worker gave Operation %q, want the existing %q", again.ID, op.ID)
				}
				_, calls := w.bank.count(eff.Payload)
				if _, err := ob3.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
					t.Errorf("Dispatch inside the visibility lag: error = %v, want ErrUncertain", err)
				}
				if _, c := w.bank.count(eff.Payload); c != calls {
					t.Errorf("Dispatch inside the visibility lag called the provider (%d -> %d)", calls, c)
				}
			}

			// Past the lag: reconcile first, then whatever dispatch is still owed.
			w.clock.Advance(2 * lag)
			ob4 := w.open("w4", nil)
			if err := ob4.Reconcile(ctx); err != nil {
				t.Fatalf("Reconcile past the lag: %v", err)
			}
			final, err := ob4.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("final Propose: %v", err)
			}
			if final.ID != op.ID {
				t.Fatalf("final Propose gave Operation %q, want %q", final.ID, op.ID)
			}
			if final.State != Confirmed {
				if _, err := ob4.Dispatch(ctx, op.ID); err != nil {
					t.Fatalf("Dispatch of the next attempt: %v", err)
				}
			}
			if n, _ := w.bank.count(eff.Payload); n != 1 {
				t.Errorf("effects = %d, want exactly 1", n)
			}
			if got, err := ob4.Get(ctx, op.ID); err != nil || got.State != Confirmed {
				t.Errorf("Get = %+v, %v; want state %q", got, err, Confirmed)
			}
		})
	}
}

// B1-12 · done-test 2: `uncertain` never auto-retries — across restarts, reconciles and a day
// of wall time — while a DEFINITE failure does get its next attempt (the paired legitimate
// case: a design that never retries anything fails).
func TestB112UncertainNeverAutoRetries(t *testing.T) {
	ctx := context.Background()
	sms := func(ref string) Effect {
		return Effect{
			Key:     BusinessKey{Venture: "keel", Verb: "sms.send", Target: "+15550100", Ref: ref},
			Class:   AtMostOnce,
			Payload: []byte("sms " + ref),
		}
	}
	cases := []struct {
		name  string
		eff   Effect
		blind bool
		crash bool // true: the process dies in flight; false: the provider times out
		want  []State
	}{
		{"at_most_once crash in flight", sms("reminder_1"), true, true, []State{Human}},
		{"at_most_once timeout", sms("reminder_2"), true, false, []State{Human}},
		{"check_before timeout, never provable", payment("invoice_9001"), true, false, []State{Uncertain, Human}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := newWorld(t, 30*time.Second)
			w.bank.lookupBlind = tc.blind
			ob := w.open("w1", nil)
			op, err := ob.Propose(ctx, tc.eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			if tc.crash {
				w.bank.inFlight = crashAt(ProviderInFlight)
				if died := survive(func() { _, _ = ob.Dispatch(ctx, op.ID) }); died != ProviderInFlight {
					t.Fatalf("died at %q, want %q", died, ProviderInFlight)
				}
			} else {
				w.bank.timeout = true
				if _, err := ob.Dispatch(ctx, op.ID); err == nil {
					t.Fatalf("Dispatch after an ambiguous provider error returned nil error")
				}
			}
			for round := 1; round <= 5; round++ {
				w.clock.Advance(6 * time.Hour)
				ob = w.open(fmt.Sprintf("w%d", round+1), nil)
				_ = ob.Reconcile(ctx)
				again, err := ob.Propose(ctx, tc.eff)
				if err != nil {
					t.Fatalf("round %d Propose: %v", round, err)
				}
				if again.ID != op.ID {
					t.Fatalf("round %d: Operation %q, want %q", round, again.ID, op.ID)
				}
				if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
					t.Errorf("round %d Dispatch: error = %v, want ErrUncertain", round, err)
				}
			}
			if n, calls := w.bank.count(tc.eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, provider calls = %d; want 1 and 1 (never auto-retried)", n, calls)
			}
			got, err := ob.Get(ctx, op.ID)
			if err != nil {
				t.Fatalf("Get: %v", err)
			}
			ok := false
			for _, s := range tc.want {
				ok = ok || got.State == s
			}
			if !ok {
				t.Errorf("state = %q, want one of %v", got.State, tc.want)
			}
		})
	}

	t.Run("definite failure retries, same Operation", func(t *testing.T) {
		w := newWorld(t, 30*time.Second)
		eff := payment("invoice_7000")
		ob := w.open("w1", nil)
		op, err := ob.Propose(ctx, eff)
		if err != nil {
			t.Fatalf("Propose: %v", err)
		}
		w.bank.reject = true
		if _, err := ob.Dispatch(ctx, op.ID); err == nil {
			t.Fatalf("Dispatch of a rejected effect returned nil error")
		}
		if got, err := ob.Get(ctx, op.ID); err != nil || got.State != Failed {
			t.Fatalf("after a definite rejection: %+v, %v; want state %q", got, err, Failed)
		}
		got, err := ob.Dispatch(ctx, op.ID)
		if err != nil {
			t.Fatalf("next attempt after a definite failure: %v", err)
		}
		if got.ID != op.ID || got.Attempt != 2 || got.State != Confirmed {
			t.Errorf("next attempt = %+v; want Operation %q, attempt 2, %q", got, op.ID, Confirmed)
		}
		if n, _ := w.bank.count(eff.Payload); n != 1 {
			t.Errorf("effects = %d, want 1", n)
		}
	})
}

// B1-12 · done-test 3 (gate G1(b)): two launchers racing the same business action produce one
// Operation and one effect — one winner.
func TestB112TwoLauncherRaceHasOneWinner(t *testing.T) {
	ctx := context.Background()
	w := newWorld(t, 0)
	a, b := w.open("launcher-a", nil), w.open("launcher-b", nil)
	for i := 0; i < 50; i++ {
		eff := payment(fmt.Sprintf("invoice_race_%02d", i))
		var (
			start sync.WaitGroup
			done  sync.WaitGroup
			ids   [2]string
			perr  [2]error
		)
		start.Add(1)
		for j, ob := range []Outbox{a, b} {
			done.Add(1)
			go func(j int, ob Outbox) {
				defer done.Done()
				start.Wait()
				op, err := ob.Propose(ctx, eff)
				ids[j], perr[j] = op.ID, err
				if err == nil {
					_, _ = ob.Dispatch(ctx, op.ID)
				}
			}(j, ob)
		}
		start.Done()
		done.Wait()
		for j, err := range perr {
			if err != nil {
				t.Fatalf("race %d: launcher %d Propose: %v", i, j, err)
			}
		}
		if ids[0] == "" || ids[0] != ids[1] {
			t.Fatalf("race %d: Operations %q and %q, want one shared Operation", i, ids[0], ids[1])
		}
		if n, _ := w.bank.count(eff.Payload); n != 1 {
			t.Errorf("race %d: effects = %d, want exactly 1 winner", i, n)
		}
		if err := a.Reconcile(ctx); err != nil {
			t.Fatalf("race %d: Reconcile: %v", i, err)
		}
		if got, err := a.Get(ctx, ids[0]); err != nil || got.State != Confirmed || got.Attempt != 1 {
			t.Errorf("race %d: %+v, %v; want %q at attempt 1", i, got, err, Confirmed)
		}
	}
}
