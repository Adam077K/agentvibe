//go:build donetest

// Done-tests for B1-12, round 3 (docs/vision-v3/14-BUILD-PLAN.md §6, B1-12: "Q3 subset: faults at
// 4 crash points -> one effect; `uncertain` never auto-retries"). Re-frozen 2026-10-02 after an
// Opus review of f38dc0d (B1-12a r2) found a timeout-before-landing double effect, a hung
// provider call that never escalates, an r2 late-receipt test that the attempt lock could be
// deleted under, and a global-lock mutant nothing killed. Rounds 1 and 2 are unchanged. Shares
// TestMain, fakeClock and effect() with outbox_donetest_test.go.
// Run: go -C kernel test -tags donetest ./internal/outbox/...
//
// Canon:
//   - 09a §7.2, check_before: "Query, send if absent" — "A measured `visibility_lag_s`; a query
//     inside it returns `unknown`, not `absent` [R3-red X05]".
//   - 09a §7 diagram: "dispatching --> uncertain: crash · timeout · ambiguous"; "uncertain -->
//     failed: proven absent → next attempt, same Operation"; "uncertain --> human: at_most_once,
//     or deadline before proof"; and "recovery reconciles first, by class, never re-dispatches
//     blindly".
//   - 09a risk table (X05): "Retry duplicates an effect; `check_before` races visibility" — "Q3:
//     faults at four crash points, new worker IDs, delayed reads → one payment".
//
// WHO OWNS THE LAG GUARD — read before judging tests 1 and 2. outbox.go's Presence doc says "A
// lookup inside the provider's visibility lag answers Unknown, never Absent", which reads as a
// Provider obligation. The providers below do NOT honour it: their lookup reports only what has
// landed, so a request still in transit reads Absent. Tests 1 and 2 therefore require the OUTBOX
// to refuse an Absent read too soon after the attempt began to be proof (§7.2, and the reviewer's
// HIGH). They read at ZERO elapsed fake-clock time, so any positive guard passes; round 1 already
// requires Absent to be accepted 70s after the attempt began with a 30s lag, which bounds it from
// above. Canon gives no number for visibility_lag_s and does not say which side applies it: OPEN.
package outbox

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"testing"
	"time"
)

const r3ChildEnv = "B112R3_CHILD"

// A round-3 child is selected in init, before the round-1 TestMain runs.
func init() {
	if os.Getenv(r3ChildEnv) != "" {
		os.Exit(r3ChildMain())
	}
}

var r3Start = time.Date(2026, 10, 13, 3, 17, 0, 0, time.UTC)

// lateBank is an in-memory provider with NO deduplication whose lookup answers from what has
// LANDED. Each call to Do takes the next mode from modes ("ok" once they run out):
//
//	ok        land now, return nil
//	late      do not land yet (the request is in transit), return an ambiguous timeout; land()
//	          lands it later
//	hold      signal entered, block until release closes, then land and return nil
type lateBank struct {
	mu      sync.Mutex
	modes   []string
	calls   int
	landed  map[string]int // idem -> landed effects
	effects map[string]int // payload -> landed effects
	pending []struct{ idem, payload string }
	entered chan string // receives the idem of every held call
	release chan struct{}
}

func newLateBank(modes ...string) *lateBank {
	return &lateBank{modes: modes, landed: map[string]int{}, effects: map[string]int{},
		entered: make(chan string, 8), release: make(chan struct{})}
}

func (b *lateBank) Do(_ context.Context, idem string, payload []byte) error {
	b.mu.Lock()
	mode := "ok"
	if b.calls < len(b.modes) {
		mode = b.modes[b.calls]
	}
	b.calls++
	if mode == "late" {
		b.pending = append(b.pending, struct{ idem, payload string }{idem, string(payload)})
		b.mu.Unlock()
		return context.DeadlineExceeded
	}
	b.mu.Unlock()
	if mode == "hold" {
		b.entered <- idem
		<-b.release
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.landed[idem]++
	b.effects[string(payload)]++
	return nil
}

func (b *lateBank) Lookup(_ context.Context, idem string) (Presence, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.landed[idem] > 0 {
		return Present, nil
	}
	return Absent, nil
}

// land delivers every request still in transit.
func (b *lateBank) land() {
	b.mu.Lock()
	defer b.mu.Unlock()
	for _, p := range b.pending {
		b.landed[p.idem]++
		b.effects[p.payload]++
	}
	b.pending = nil
}

func (b *lateBank) count(payload []byte) (effects, calls int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.effects[string(payload)], b.calls
}

type r3World struct {
	t     *testing.T
	dir   string
	clock *fakeClock
	p     Provider
}

func newR3World(t *testing.T, p Provider) *r3World {
	return &r3World{t: t, dir: filepath.Join(t.TempDir(), "outbox"), clock: &fakeClock{t: r3Start}, p: p}
}

func (w *r3World) open(worker string) Outbox {
	w.t.Helper()
	ob, err := Open(w.dir, Deps{WorkerID: worker, Clock: w.clock, Provider: w.p})
	if err != nil || ob == nil {
		w.t.Fatalf("Open(%s) = %v, %v", worker, ob, err)
	}
	return ob
}

func (w *r3World) state(id string) Operation {
	w.t.Helper()
	got, err := w.open("reader").Get(context.Background(), id)
	if err != nil {
		w.t.Fatalf("Get(%s): %v", id, err)
	}
	return got
}

// dispatchHeld starts Dispatch(id) on its own Outbox and returns once the provider call is held.
func (w *r3World) dispatchHeld(b *lateBank, worker, id string) <-chan error {
	w.t.Helper()
	done := make(chan error, 1)
	ob := w.open(worker)
	go func() { _, err := ob.Dispatch(context.Background(), id); done <- err }()
	select {
	case <-b.entered:
	case err := <-done:
		w.t.Fatalf("Dispatch(%s) returned (%v) before its provider call was held", id, err)
	case <-time.After(30 * time.Second):
		w.t.Fatalf("Dispatch(%s) never called the provider", id)
	}
	return done
}

// releaseAndWait lets every held call land and waits for the given Dispatches to return.
func releaseAndWait(t *testing.T, b *lateBank, done ...<-chan error) {
	t.Helper()
	close(b.release)
	for _, d := range done {
		select {
		case <-d:
		case <-time.After(30 * time.Second):
			t.Fatal("a held Dispatch did not return after its provider call was released")
		}
	}
}

// B1-12 · round 3 · test 1: timeout BEFORE landing gives exactly one effect.
// The provider times out with the request still in transit (§7 diagram: "dispatching -->
// uncertain: crash · timeout · ambiguous"). Dispatch has returned, so nothing is in flight on this
// host any more — yet the effect has not landed, and a lookup right away reads Absent. §7.2: "a
// query inside [visibility_lag_s] returns `unknown`, not `absent`", so that read is not proof of
// absence, the attempt stays in doubt, and the re-Dispatch is refused. The request then lands; the
// reconciler observes it (§7 diagram, "uncertain --> confirmed: reconciler observes it after
// visibility lag"). Risk table X05: "delayed reads → one payment". At f38dc0d the attempt lock is
// free once Dispatch returns, the Absent read becomes Failed, and the re-Dispatch pays twice.
func TestB112R3TimeoutBeforeLandingIsOneEffect(t *testing.T) {
	for _, class := range []Class{CheckBefore, NativeKey} {
		t.Run(string(class), func(t *testing.T) {
			ctx := context.Background()
			b := newLateBank("late")
			w := newR3World(t, b)
			eff := effect(class, "invoice_3141")

			ob := w.open("w1")
			op, err := ob.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
				t.Fatalf("setup: Dispatch after a timeout = %v, want ErrUncertain", err)
			}

			// Zero elapsed time: a second worker reconciles and re-dispatches while the request is
			// still in transit. The lookup reads Absent.
			ob2 := w.open("w2")
			_ = ob2.Reconcile(ctx)
			if got := w.state(op.ID); got.State == Failed {
				t.Errorf("an Absent read at zero elapsed time after the attempt began moved it to %q: inside "+
					"visibility_lag_s that read is unknown, not absent (09a §7.2)", got.State)
			}
			if _, err := ob2.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
				t.Errorf("re-Dispatch while the timed-out request may still land: error = %v, want ErrUncertain", err)
			}

			// The request lands; a later reconcile observes it.
			b.land()
			w.clock.Advance(10 * time.Minute)
			_ = w.open("w3").Reconcile(ctx)
			if got := w.state(op.ID); got.State != Confirmed || got.Attempt != 1 {
				t.Errorf("after the request landed: state %q attempt %d; want %q attempt 1", got.State, got.Attempt, Confirmed)
			}
			_, _ = w.open("w4").Dispatch(ctx, op.ID)
			if n, calls := b.count(eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, provider calls = %d; want 1 and 1 (X05: delayed reads → one payment)", n, calls)
			}
		})
	}
}

// fileBank is the cross-process provider for test 2: an append-only file. "sent" is a request
// that reached the wire, "landed" an effect the provider applied. Lookup answers from landed.
type fileBank struct{ path string }

func (f fileBank) appendLine(kind, idem string, payload []byte) {
	fh, err := os.OpenFile(f.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		panic(err)
	}
	fmt.Fprintf(fh, "%s\t%s\t%s\n", kind, idem, payload)
	if err := fh.Sync(); err != nil {
		panic(err)
	}
	fh.Close()
}

func (f fileBank) lines() [][]string {
	fh, err := os.Open(f.path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		panic(err)
	}
	defer fh.Close()
	var out [][]string
	s := bufio.NewScanner(fh)
	for s.Scan() {
		out = append(out, strings.SplitN(s.Text(), "\t", 3))
	}
	return out
}

// Do in the parent lands at once.
func (f fileBank) Do(_ context.Context, idem string, payload []byte) error {
	f.appendLine("sent", idem, payload)
	f.appendLine("landed", idem, payload)
	return nil
}

func (f fileBank) Lookup(_ context.Context, idem string) (Presence, error) {
	for _, l := range f.lines() {
		if l[0] == "landed" && l[1] == idem {
			return Present, nil
		}
	}
	return Absent, nil
}

// landPending lands every sent request that has not landed.
func (f fileBank) landPending() {
	sent, landed := map[string]int{}, map[string]int{}
	payload := map[string]string{}
	for _, l := range f.lines() {
		if l[0] == "sent" {
			sent[l[1]]++
			payload[l[1]] = l[2]
		} else if l[0] == "landed" {
			landed[l[1]]++
		}
	}
	for idem, n := range sent {
		for i := landed[idem]; i < n; i++ {
			f.appendLine("landed", idem, []byte(payload[idem]))
		}
	}
}

func (f fileBank) count(payload []byte) (effects, calls int) {
	for _, l := range f.lines() {
		if l[2] != string(payload) {
			continue
		}
		switch l[0] {
		case "sent":
			calls++
		case "landed":
			effects++
		}
	}
	return
}

// killBank is the child's provider: the request reaches the wire and the process is SIGKILLed
// before the provider applies it.
type killBank struct{ fileBank }

func (k killBank) Do(_ context.Context, idem string, payload []byte) error {
	k.appendLine("sent", idem, payload)
	fmt.Println("CRASH in transit")
	_ = syscall.Kill(os.Getpid(), syscall.SIGKILL)
	select {}
}

func r3ChildMain() int {
	now, _ := strconv.ParseInt(os.Getenv("B112R3_NOW"), 10, 64)
	clock := &fakeClock{t: time.Unix(0, now).UTC()}
	ob, err := Open(os.Getenv("B112R3_DIR"), Deps{WorkerID: "w1", Clock: clock,
		Provider: killBank{fileBank{path: os.Getenv("B112R3_BANK")}}})
	if err != nil {
		fmt.Println("ERR open:", err)
		return 3
	}
	ctx := context.Background()
	op, err := ob.Propose(ctx, effect(Class(os.Getenv("B112R3_CLASS")), os.Getenv("B112R3_REF")))
	if err != nil {
		fmt.Println("ERR propose:", err)
		return 3
	}
	fmt.Println("OP", op.ID)
	_, err = ob.Dispatch(ctx, op.ID)
	fmt.Println("DISPATCHED", err)
	return 0
}

// B1-12 · round 3 · test 2: test 1 with a SIGKILL in place of the timeout. A worker process puts
// the request on the wire and is killed before the provider applies it (§7: "Crash anywhere after
// `dispatching` — before the provider returns ... leaves the attempt in `dispatching` or
// `uncertain`, and recovery reconciles first, by class, never re-dispatches blindly"). The kernel
// drops the dead worker's attempt lock, so the lock alone cannot tell a reconciler that the
// request may still land; §7.2's visibility_lag_s must. A replacement worker at zero elapsed time
// reads Absent and must not re-send; once the request lands there is exactly one effect.
func TestB112R3KilledBeforeLandingIsOneEffect(t *testing.T) {
	for _, class := range []Class{CheckBefore, NativeKey} {
		t.Run(string(class), func(t *testing.T) {
			ctx := context.Background()
			bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
			w := newR3World(t, bank)
			eff := effect(class, "invoice_2718")

			cmd := exec.Command(os.Args[0], "-test.run=^$")
			cmd.Env = append(os.Environ(), r3ChildEnv+"=1", "B112R3_DIR="+w.dir, "B112R3_BANK="+bank.path,
				"B112R3_NOW="+strconv.FormatInt(w.clock.Now().UnixNano(), 10),
				"B112R3_CLASS="+string(class), "B112R3_REF="+eff.Key.Ref)
			out, err := cmd.CombinedOutput()
			var ee *exec.ExitError
			if !errors.As(err, &ee) || ee.Exited() || !strings.Contains(string(out), "CRASH in transit") {
				t.Fatalf("worker was not killed with the request in transit (err %v):\n%s", err, out)
			}
			var id string
			for _, l := range strings.Split(string(out), "\n") {
				if v, ok := strings.CutPrefix(l, "OP "); ok {
					id = v
				}
			}
			if id == "" {
				t.Fatalf("worker printed no Operation ID:\n%s", out)
			}

			// Zero elapsed time: a replacement worker reconciles, re-proposes, re-dispatches.
			ob2 := w.open("w2")
			_ = ob2.Reconcile(ctx)
			if got := w.state(id); got.State == Failed {
				t.Errorf("an Absent read at zero elapsed time after a killed attempt moved it to %q; "+
					"inside visibility_lag_s it is unknown, not absent (09a §7.2)", got.State)
			}
			if again, err := ob2.Propose(ctx, eff); err != nil || again.ID != id {
				t.Fatalf("re-Propose = %q, %v; want the journaled %q", again.ID, err, id)
			}
			if _, err := ob2.Dispatch(ctx, id); !errors.Is(err, ErrUncertain) {
				t.Errorf("re-Dispatch after the worker died with the request in transit: error = %v, want ErrUncertain", err)
			}

			bank.landPending()
			w.clock.Advance(10 * time.Minute)
			_ = w.open("w3").Reconcile(ctx)
			if got := w.state(id); got.State != Confirmed || got.Attempt != 1 {
				t.Errorf("after the request landed: state %q attempt %d; want %q attempt 1", got.State, got.Attempt, Confirmed)
			}
			_, _ = w.open("w4").Dispatch(ctx, id)
			if n, calls := bank.count(eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, sends = %d; want 1 and 1 (X05: four crash points, new worker IDs → one payment)", n, calls)
			}
		})
	}
}

// B1-12 · round 3 · test 3: a provider call that never returns still reaches Human.
// §7 diagram: "uncertain --> human: at_most_once, or deadline before proof"; 09a §7 Q3 note:
// "Without proof before the deadline, the Operation stays `uncertain` ... and the founder gets a
// bounded reconciliation task". A hung call is the limit case of no proof. CANON GIVES NO NUMBER
// for the deadline — OPEN. The bound used is the implementation's own UncertainDeadline parameter
// (store.go), plus one minute. Before the deadline the attempt must stay in doubt and not be
// re-sent; past it, a reconciler must hand it to a human although the call is still hung. At
// f38dc0d the reconciler skips any Operation whose attempt lock is held, so it never escalates.
func TestB112R3HungCallReachesHumanByTheDeadline(t *testing.T) {
	ctx := context.Background()
	b := newLateBank("hold")
	w := newR3World(t, b)
	eff := effect(CheckBefore, "invoice_1618")

	op, err := w.open("w1").Propose(ctx, eff)
	if err != nil {
		t.Fatalf("Propose: %v", err)
	}
	done := w.dispatchHeld(b, "w1", op.ID)
	defer releaseAndWait(t, b, done)

	w.clock.Advance(UncertainDeadline - time.Hour)
	ob := w.open("w2")
	_ = ob.Reconcile(ctx)
	if got := w.state(op.ID); got.State == Failed || got.State == Confirmed {
		t.Errorf("before the deadline, a hung attempt became %q; want it still in doubt", got.State)
	}
	if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
		t.Errorf("Dispatch while the attempt is hung: error = %v, want ErrUncertain", err)
	}

	w.clock.Advance(time.Hour + time.Minute) // UncertainDeadline + 1m after the attempt began
	_ = w.open("w3").Reconcile(ctx)
	if got := w.state(op.ID); got.State != Human {
		t.Errorf("a provider call hung past UncertainDeadline: state %q, want %q (§7: deadline before proof)",
			got.State, Human)
	}
	if _, calls := b.count(eff.Payload); calls != 1 {
		t.Errorf("provider calls = %d, want 1", calls)
	}
}

// B1-12 · round 3 · test 4: Operations are isolated from each other.
// 09a §7.1: the Operation is the unit of identity ("at most ONE open Operation per
// business_key"); its attempts are its own. An attempt in flight on Operation A says nothing
// about Operation B: B must dispatch, and B's in-doubt attempt must reconcile, while A's provider
// call is held. A single lock shared by every Operation would refuse B as "in progress" and leave
// it unreconciled — a stall on one supplier freezing every other payment.
func TestB112R3OperationsDoNotBlockEachOther(t *testing.T) {
	ctx := context.Background()
	// Call 1: A, held. Call 2: B's first attempt times out in transit. Call 3: C lands at once.
	b := newLateBank("hold", "late")
	w := newR3World(t, b)
	effA, effB, effC := effect(CheckBefore, "invoice_A"), effect(CheckBefore, "invoice_B"), effect(CheckBefore, "invoice_C")

	ob := w.open("w1")
	var ops []Operation
	for _, e := range []Effect{effA, effB, effC} {
		op, err := ob.Propose(ctx, e)
		if err != nil {
			t.Fatalf("Propose(%s): %v", e.Key.Ref, err)
		}
		ops = append(ops, op)
	}
	doneA := w.dispatchHeld(b, "wA", ops[0].ID)
	defer releaseAndWait(t, b, doneA)

	// B: its attempt is in doubt, lands, and must reconcile to Confirmed while A is still held.
	if _, err := w.open("wB").Dispatch(ctx, ops[1].ID); !errors.Is(err, ErrUncertain) {
		t.Errorf("Dispatch(B) while A is in flight: error = %v, want ErrUncertain from B's own timeout", err)
	}
	b.land()
	w.clock.Advance(10 * time.Minute)
	_ = w.open("wR").Reconcile(ctx)
	if got := w.state(ops[1].ID); got.State != Confirmed {
		t.Errorf("Reconcile of B while A's call is held: B is %q, want %q", got.State, Confirmed)
	}

	// C: dispatches straight through while A is held.
	got, err := w.open("wC").Dispatch(ctx, ops[2].ID)
	if err != nil || got.State != Confirmed {
		t.Errorf("Dispatch(C) while A's call is held = %+v, %v; want %q and no error", got, err, Confirmed)
	}
	if n, _ := b.count(effC.Payload); n != 1 {
		t.Errorf("C effects = %d, want 1", n)
	}
	if got := w.state(ops[0].ID); got.State != Dispatching {
		t.Errorf("A, still held, is %q; want %q", got.State, Dispatching)
	}
}

// B1-12 · round 3 · test 5: no second send while an attempt is in flight — the guarantee the r2
// late-receipt test did not pin. Round 2 let the next Dispatch run only after the late Receipt
// had landed, so accepting a Receipt over Failed was enough to pass it and the in-flight guard
// could be deleted. Here the next worker reconciles AND dispatches while attempt 1 is still in
// flight and its lookup reads Absent. §7: recovery "never re-dispatches blindly"; §7.2: the read
// cannot be proof of absence while the request may still land; hard rule (14-BUILD-PLAN B1-12):
// one effect. Any guard that achieves it passes — a lock, a lease, a lag window.
func TestB112R3NoSecondSendWhileInFlight(t *testing.T) {
	for _, class := range []Class{CheckBefore, NativeKey} {
		t.Run(string(class), func(t *testing.T) {
			ctx := context.Background()
			b := newLateBank("hold")
			w := newR3World(t, b)
			eff := effect(class, "invoice_8812")

			op, err := w.open("w1").Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			done := w.dispatchHeld(b, "w1", op.ID)

			ob2 := w.open("w2")
			_ = ob2.Reconcile(ctx)
			if got := w.state(op.ID); got.State == Failed {
				t.Errorf("an attempt in flight was resolved %q by a lookup racing it", got.State)
			}
			// A second send would land at once (mode "ok"), so a missing guard shows as 2 effects.
			if _, err := ob2.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
				t.Errorf("Dispatch while attempt 1 is in flight: error = %v, want ErrUncertain", err)
			}
			releaseAndWait(t, b, done)

			if got := w.state(op.ID); got.State != Confirmed || got.Attempt != 1 {
				t.Errorf("after the Receipt: state %q attempt %d; want %q attempt 1", got.State, got.Attempt, Confirmed)
			}
			if n, calls := b.count(eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, provider calls = %d; want 1 and 1", n, calls)
			}
		})
	}
}
