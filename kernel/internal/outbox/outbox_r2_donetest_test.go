//go:build donetest

// Done-tests for B1-12, round 2 (docs/vision-v3/14-BUILD-PLAN.md §6, B1-12: "Q3 subset: faults at
// 4 crash points -> one effect; `uncertain` never auto-retries"). Re-frozen 2026-10-02 after an
// Opus review of 78d5ac2 found a double effect the round-1 file could not see and three wrong
// implementations it let through. Registered in build/done-tests/B0-17b.yml beside the round-1
// file, which is unchanged. Shares TestMain, fakeClock and effect() with outbox_donetest_test.go.
// Run: go -C kernel test -tags donetest ./internal/outbox/...
//
// Canon: 09a-ENGINEERING.md §7.1 (Operation ID; business_key = venture ‖ verb ‖ target ‖
// business_ref; at most one open Operation per key), §7.2 (idempotency classes; check_before
// "query, send if absent"; a query that cannot tell returns unknown, not absent), the §7 state
// diagram ("dispatching --> confirmed: provider ok → Receipt"; "uncertain --> failed: proven
// absent"; "uncertain --> human: at_most_once, or deadline before proof") and its closing rule:
// recovery "reconciles first, by class, never re-dispatches blindly". The interface contract is
// outbox.go (Dispatch: "Confirmed returns as-is with no provider call"; Reconcile: "Present ->
// Confirmed, Absent -> Failed ... Unknown -> stays Uncertain until UncertainDeadline ... then
// Human").
//
// These tests run in one process: the provider below is in memory, and the Outbox is opened
// afresh for each worker, which is a restart for every purpose the outbox can observe (outbox.go:
// "a test process may also Open the same directory several times without closing").
package outbox

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

// memBank is a provider with NO deduplication (two sends are two effects) whose lookups answer
// from what has actually landed. Do lands the effect when it returns, so a call held open (hold)
// is a request still in transit: the provider has not seen it, and an honest lookup says Absent.
type memBank struct {
	mu        sync.Mutex
	landed    map[string]int // idem -> effects landed under it
	effects   map[string]int // payload -> effects landed
	calls     int            // every Do
	hold      chan struct{}  // non-nil: Do signals entered, then waits for hold to close
	entered   chan struct{}
	timeout   bool  // land the effect, then return an ambiguous error
	lookupErr error // every Lookup fails with this
}

func newMemBank() *memBank {
	return &memBank{landed: map[string]int{}, effects: map[string]int{}}
}

func (b *memBank) Do(_ context.Context, idem string, payload []byte) error {
	b.mu.Lock()
	b.calls++
	hold, entered := b.hold, b.entered
	b.mu.Unlock()
	if hold != nil {
		entered <- struct{}{}
		<-hold
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.landed[idem]++
	b.effects[string(payload)]++
	if b.timeout {
		return context.DeadlineExceeded
	}
	return nil
}

func (b *memBank) Lookup(_ context.Context, idem string) (Presence, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.lookupErr != nil {
		return Unknown, b.lookupErr
	}
	if b.landed[idem] > 0 {
		return Present, nil
	}
	return Absent, nil
}

func (b *memBank) count(payload []byte) (effects, calls int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.effects[string(payload)], b.calls
}

type memWorld struct {
	t     *testing.T
	dir   string
	clock *fakeClock
	bank  *memBank
}

func newMemWorld(t *testing.T) *memWorld {
	return &memWorld{t: t, dir: filepath.Join(t.TempDir(), "outbox"),
		clock: &fakeClock{t: time.Date(2026, 10, 13, 3, 17, 0, 0, time.UTC)}, bank: newMemBank()}
}

func (w *memWorld) open(worker string) Outbox {
	w.t.Helper()
	ob, err := Open(w.dir, Deps{WorkerID: worker, Clock: w.clock, Provider: w.bank})
	if err != nil || ob == nil {
		w.t.Fatalf("Open(%s) = %v, %v", worker, ob, err)
	}
	return ob
}

func (w *memWorld) state(id string) Operation {
	w.t.Helper()
	got, err := w.open("reader").Get(context.Background(), id)
	if err != nil {
		w.t.Fatalf("Get(%s): %v", id, err)
	}
	return got
}

// B1-12 · round 2 · finding 1 (HIGH). A reconciler that runs while an attempt is still in flight
// gets an honest Absent: the request has not reached the provider. Then the provider answers ok,
// which is a Receipt for that same attempt (09a §7 diagram: "dispatching --> confirmed: provider
// ok → Receipt"). The hard rule (14-BUILD-PLAN B1-12) is one effect. Whatever the reconciler
// concluded, the late Receipt proves the effect happened, so the Operation must end Confirmed and
// the next Dispatch must not send again (outbox.go: "Confirmed returns as-is with no provider
// call"). At 78d5ac2 legalFrom[Confirmed] excludes Failed: the Receipt is refused, the Operation
// stays Failed, and the next worker's Dispatch pays the supplier a second time.
//
// Not asserted here, named for the reviewer: a next Dispatch that runs BEFORE the late Receipt
// arrives. Making that one effect needs fencing of the in-flight attempt (a lease, or refusing
// Absent as proof while an attempt may be in flight), which is a design decision this brief did
// not make.
func TestB112R2LateReceiptAfterAbsentIsOneEffect(t *testing.T) {
	for _, class := range []Class{CheckBefore, NativeKey} {
		t.Run(string(class), func(t *testing.T) {
			ctx := context.Background()
			w := newMemWorld(t)
			w.bank.hold, w.bank.entered = make(chan struct{}), make(chan struct{}, 4)
			eff := effect(class, "invoice_8812")

			ob1 := w.open("w1")
			op, err := ob1.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			done := make(chan error, 1)
			go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
			select {
			case <-w.bank.entered: // attempt 1 is in transit; nothing has landed
			case err := <-done:
				t.Fatalf("Dispatch returned (%v) before calling the provider", err)
			case <-time.After(30 * time.Second):
				t.Fatal("Dispatch never called the provider")
			}

			// A second worker reconciles while attempt 1 is in flight. Lookup honestly says Absent.
			_ = w.open("w2").Reconcile(ctx)

			// The in-flight call now lands and answers ok: the Receipt for attempt 1.
			close(w.bank.hold)
			select {
			case <-done:
			case <-time.After(30 * time.Second):
				t.Fatal("Dispatch did not return after the provider answered")
			}

			if got := w.state(op.ID); got.State != Confirmed || got.Attempt != 1 {
				t.Errorf("after the late Receipt: state %q attempt %d; want %q attempt 1 (provider ok is a Receipt)",
					got.State, got.Attempt, Confirmed)
			}
			// A replacement worker re-proposes, reconciles, and dispatches whatever it believes is owed.
			ob3 := w.open("w3")
			if _, err := ob3.Propose(ctx, eff); err != nil {
				t.Fatalf("re-Propose: %v", err)
			}
			_ = ob3.Reconcile(ctx)
			_, _ = ob3.Dispatch(ctx, op.ID)
			if n, calls := w.bank.count(eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, provider calls = %d; want 1 and 1: a late Receipt after an Absent "+
					"lookup must not become a second payment", n, calls)
			}
		})
	}
}

// B1-12 · round 2 · mutant 2a: Dispatch re-sends an Operation that is already Confirmed.
// outbox.go Dispatch: "Confirmed returns as-is with no provider call"; 09a §7.1: a replacement
// worker re-proposing the same action receives the existing Operation, and so must not pay again.
// Round 1 never dispatches a Confirmed Operation, so it could not see this. Both roads to
// Confirmed are covered: a provider ok, and a reconciler observing Present (§7 diagram,
// "uncertain --> confirmed: reconciler observes it after visibility lag").
func TestB112R2ConfirmedIsNeverDispatchedAgain(t *testing.T) {
	for _, road := range []string{"provider ok", "reconciled present"} {
		t.Run(road, func(t *testing.T) {
			ctx := context.Background()
			w := newMemWorld(t)
			w.bank.timeout = road == "reconciled present"
			eff := effect(CheckBefore, "invoice_6100")

			ob := w.open("w1")
			op, err := ob.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			_, _ = ob.Dispatch(ctx, op.ID)
			if road == "reconciled present" {
				w.bank.timeout = false
				if err := w.open("w2").Reconcile(ctx); err != nil {
					t.Fatalf("Reconcile: %v", err)
				}
			}
			if got := w.state(op.ID); got.State != Confirmed {
				t.Fatalf("setup: state %q, want %q", got.State, Confirmed)
			}
			_, calls := w.bank.count(eff.Payload)

			for i, worker := range []string{"w3", "w4", "w3"} {
				got, err := w.open(worker).Dispatch(ctx, op.ID)
				if err != nil {
					t.Errorf("Dispatch #%d of a Confirmed Operation: %v; want nil", i+1, err)
				}
				if got.ID != op.ID || got.State != Confirmed || got.Attempt != 1 {
					t.Errorf("Dispatch #%d returned %+v; want Operation %q unchanged at attempt 1, %q",
						i+1, got, op.ID, Confirmed)
				}
			}
			if n, c := w.bank.count(eff.Payload); n != 1 || c != calls {
				t.Errorf("effects = %d, provider calls %d -> %d; Dispatch of a Confirmed Operation must not call the provider",
					n, calls, c)
			}
		})
	}
}

// B1-12 · round 2 · mutant 2b: a lookup that FAILS is not a lookup that answered Absent.
// 09a §7 diagram: only "proven absent" moves uncertain --> failed; §7.2: a query that cannot tell
// returns unknown, not absent; outbox.go Reconcile: Unknown "stays Uncertain until
// UncertainDeadline after the attempt began, then Human". A provider outage during reconcile must
// leave the attempt in doubt, never auto-retried, and hand it to a human past the deadline.
// Mapping the error to Failed makes the next Dispatch a blind re-send.
func TestB112R2LookupErrorIsNotProofOfAbsence(t *testing.T) {
	for _, class := range []Class{CheckBefore, NativeKey, Natural} {
		t.Run(string(class), func(t *testing.T) {
			ctx := context.Background()
			w := newMemWorld(t)
			w.bank.timeout = true // attempt 1 lands, the answer is lost: uncertain
			eff := effect(class, "invoice_5150")

			ob := w.open("w1")
			op, err := ob.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
				t.Fatalf("setup: Dispatch after an ambiguous provider error = %v, want ErrUncertain", err)
			}
			w.bank.timeout = false
			w.bank.lookupErr = errors.New("provider lookup: 503 service unavailable")

			for round := 1; round <= 3; round++ { // 18h in total: inside UncertainDeadline
				w.clock.Advance(6 * time.Hour)
				ob = w.open(fmt.Sprintf("w%d", round+1))
				_ = ob.Reconcile(ctx)
				if got := w.state(op.ID); got.State != Uncertain {
					t.Errorf("round %d: a failed lookup moved the attempt to %q; want %q", round, got.State, Uncertain)
				}
				if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
					t.Errorf("round %d Dispatch after a failed lookup: error = %v, want ErrUncertain", round, err)
				}
			}
			w.clock.Advance(UncertainDeadline) // past the deadline with no proof
			ob = w.open("w9")
			_ = ob.Reconcile(ctx)
			if got := w.state(op.ID); got.State != Human {
				t.Errorf("past UncertainDeadline with every lookup failing: state %q, want %q", got.State, Human)
			}
			if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
				t.Errorf("Dispatch of a Human Operation: error = %v, want ErrUncertain", err)
			}
			if n, calls := w.bank.count(eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, provider calls = %d; want 1 and 1 (a failed lookup is not proof of absence)", n, calls)
			}
		})
	}
}

// B1-12 · round 2 · mutant 2c: the business key has four fields, and target is one of them.
// 09a §7.1: "business_key  venture ‖ verb ‖ target ‖ business_ref", "at most ONE open Operation
// per business_key". Two suppliers paid against the same invoice reference are two business
// actions: two Operations, two effects. A key that drops target either refuses the second as an
// amendment (different payload) or silently folds it into the first (same payload). Either way
// one supplier is never paid.
func TestB112R2TargetIsPartOfTheBusinessKey(t *testing.T) {
	for _, samePayload := range []bool{false, true} {
		name := "different payloads"
		if samePayload {
			name = "same payload"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			w := newMemWorld(t)
			a := effect(CheckBefore, "invoice_4242")
			b := a
			b.Key.Target = "supplier_45"
			if !samePayload {
				b.Payload = []byte("pay supplier_45 invoice_4242 EUR 1200")
			}

			ob := w.open("w1")
			opA, err := ob.Propose(ctx, a)
			if err != nil {
				t.Fatalf("Propose(target %s): %v", a.Key.Target, err)
			}
			opB, err := ob.Propose(ctx, b)
			if err != nil {
				t.Fatalf("Propose(target %s) after target %s: %v; distinct targets are distinct business keys",
					b.Key.Target, a.Key.Target, err)
			}
			if opA.ID == opB.ID {
				t.Fatalf("targets %s and %s got one Operation %q; want two", a.Key.Target, b.Key.Target, opA.ID)
			}
			if opB.Key != b.Key {
				t.Errorf("Operation %q carries key %+v; want %+v", opB.ID, opB.Key, b.Key)
			}
			for _, op := range []Operation{opA, opB} {
				if got, err := w.open("w2").Dispatch(ctx, op.ID); err != nil || got.State != Confirmed {
					t.Errorf("Dispatch(%s, target %s) = %+v, %v; want %q", op.ID, op.Key.Target, got, err, Confirmed)
				}
			}
			// Each key, re-proposed by a new worker, still finds its own Operation.
			ob3 := w.open("w3")
			for _, c := range []struct {
				e  Effect
				id string
			}{{a, opA.ID}, {b, opB.ID}} {
				if again, err := ob3.Propose(ctx, c.e); err != nil || again.ID != c.id {
					t.Errorf("re-Propose(target %s) = %q, %v; want %q", c.e.Key.Target, again.ID, err, c.id)
				}
			}
			if _, calls := w.bank.count(nil); calls != 2 {
				t.Errorf("provider calls = %d, want 2 (one per target)", calls)
			}
			na, _ := w.bank.count(a.Payload)
			nb, _ := w.bank.count(b.Payload)
			want := [2]int{1, 1}
			if samePayload {
				want = [2]int{2, 2} // one payload, counted once per target
			}
			if na != want[0] || nb != want[1] {
				t.Errorf("effects by payload = %d, %d; want %v", na, nb, want)
			}
		})
	}
}
