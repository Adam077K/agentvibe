//go:build donetest

// Done-tests for B1-12, round 4 (docs/vision-v3/14-BUILD-PLAN.md §6, B1-12: "Q3 subset: faults at
// 4 crash points -> one effect; `uncertain` never auto-retries"). Re-frozen 2026-10-02 after an
// Opus review of ee19236 (B1-12a r3) found founder ruling B unenforced, a declared lag <= 0 that
// re-sends at once, and six surviving mutants. Rounds 1-3 are unchanged. Shares TestMain,
// fakeClock, effect(), r3World, fileBank and killBank with the earlier rounds.
// Run: go -C kernel test -tags donetest ./internal/outbox/...
//
// Canon and rulings:
//   - 09a §7.2, check_before: "A measured `visibility_lag_s`; a query inside it returns `unknown`,
//     not `absent`". 09a §7 diagram: "uncertain --> human: at_most_once, or deadline before
//     proof"; recovery "never re-dispatches blindly".
//   - Founder ruling A, 2026-10-02 (docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md):
//     each provider declares its visibility lag, default 2 minutes; the OUTBOX enforces it; an
//     Absent read inside the window after a timed-out or uncertain attempt is not trusted.
//   - Founder ruling B, same note: a hung effect, one with no answer at all, goes uncertain, is
//     never retried, and escalates to Human after 15 minutes. It covers hung calls only; the 24h
//     UncertainDeadline stays for answered-but-unclear outcomes.
//   - A declared lag <= 0 is invalid and the 2-minute default applies: the Opus review of ee19236
//     (MED, fail safe), relayed by the coordinator 2026-10-02. Not a founder ruling.
//
// The 15 minutes and 2 minutes are written here as literals, not as HungDeadline and
// DefaultVisibilityLag, so that moving a constant cannot move the test with it.
package outbox

import (
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

const (
	r4ChildEnv = "B112R4_CHILD"
	rulingB    = 15 * time.Minute // founder ruling B: no answer at all -> Human after 15 minutes
	rulingA    = 2 * time.Minute  // founder ruling A: default visibility lag
)

func init() {
	if os.Getenv(r4ChildEnv) != "" {
		os.Exit(r4ChildMain())
	}
}

// r4Bank is an in-memory provider with NO deduplication whose lookup answers from what has
// LANDED. Each Do takes the next mode ("ok" once they run out):
//
//	ok         land now, return nil
//	drop       never land, return an ambiguous timeout
//	late       land only when land() is called, return an ambiguous timeout
//	hold-drop  signal entered, wait for release, then as drop
//	hold-late  signal entered, wait for release, then as late
//
// lookupHold, when set, makes the next Lookup signal lookupEntered and wait for it to close.
type r4Bank struct {
	mu            sync.Mutex
	modes         []string
	calls         int
	landed        map[string]int
	effects       map[string]int
	pending       []struct{ idem, payload string }
	entered       chan string
	release       chan struct{}
	lookupHold    chan struct{}
	lookupEntered chan struct{}
}

func newR4Bank(modes ...string) *r4Bank {
	return &r4Bank{modes: modes, landed: map[string]int{}, effects: map[string]int{},
		entered: make(chan string, 8), release: make(chan struct{}), lookupEntered: make(chan struct{}, 8)}
}

func (b *r4Bank) Do(_ context.Context, idem string, payload []byte) error {
	b.mu.Lock()
	mode := "ok"
	if b.calls < len(b.modes) {
		mode = b.modes[b.calls]
	}
	b.calls++
	b.mu.Unlock()
	if strings.HasPrefix(mode, "hold-") {
		b.entered <- idem
		<-b.release
		mode = strings.TrimPrefix(mode, "hold-")
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	switch mode {
	case "drop":
		return context.DeadlineExceeded
	case "late":
		b.pending = append(b.pending, struct{ idem, payload string }{idem, string(payload)})
		return context.DeadlineExceeded
	}
	b.landed[idem]++
	b.effects[string(payload)]++
	return nil
}

func (b *r4Bank) Lookup(_ context.Context, idem string) (Presence, error) {
	b.mu.Lock()
	hold := b.lookupHold
	b.lookupHold = nil
	b.mu.Unlock()
	if hold != nil {
		b.lookupEntered <- struct{}{}
		<-hold
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.landed[idem] > 0 {
		return Present, nil
	}
	return Absent, nil
}

func (b *r4Bank) land() {
	b.mu.Lock()
	defer b.mu.Unlock()
	for _, p := range b.pending {
		b.landed[p.idem]++
		b.effects[p.payload]++
	}
	b.pending = nil
}

func (b *r4Bank) count(payload []byte) (effects, calls int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.effects[string(payload)], b.calls
}

// lagBank is r4Bank declaring a visibility lag (the VisibilityLagger of founder ruling A).
type lagBank struct {
	*r4Bank
	lag time.Duration
}

func (l lagBank) VisibilityLag() time.Duration { return l.lag }

func (w *r3World) openCrash(worker string, crash func(Point)) Outbox {
	w.t.Helper()
	ob, err := Open(w.dir, Deps{WorkerID: worker, Clock: w.clock, Provider: w.p, Crash: crash})
	if err != nil || ob == nil {
		w.t.Fatalf("Open(%s) = %v, %v", worker, ob, err)
	}
	return ob
}

func waitEntered(t *testing.T, b *r4Bank, done <-chan error) {
	t.Helper()
	select {
	case <-b.entered:
	case err := <-done:
		t.Fatalf("Dispatch returned (%v) before its provider call was held", err)
	case <-time.After(30 * time.Second):
		t.Fatal("Dispatch never called the provider")
	}
}

func waitDone(t *testing.T, done <-chan error) error {
	t.Helper()
	select {
	case err := <-done:
		return err
	case <-time.After(30 * time.Second):
		t.Fatal("Dispatch did not return")
		return nil
	}
}

// hangBank is the child's provider for a worker that dies with its call unanswered: the request
// reaches the wire, then the call never returns until the parent kills the process.
type hangBank struct{ fileBank }

func (h hangBank) Do(_ context.Context, idem string, payload []byte) error {
	h.appendLine("sent", idem, payload)
	select {}
}

// r4ChildMain: one worker. B112R4_CHILD is "kill" (send, then SIGKILL itself) or "hang" (send,
// then wait to be killed). B112R4_ADVANCE moves the worker's clock at AfterDispatchingJournaled:
// a worker slow between journaling the attempt and sending it.
func r4ChildMain() int {
	now, _ := strconv.ParseInt(os.Getenv("B112R4_NOW"), 10, 64)
	adv, _ := time.ParseDuration(os.Getenv("B112R4_ADVANCE"))
	clock := &fakeClock{t: time.Unix(0, now).UTC()}
	fb := fileBank{path: os.Getenv("B112R4_BANK")}
	var p Provider = killBank{fb}
	if os.Getenv(r4ChildEnv) == "hang" {
		p = hangBank{fb}
	}
	crash := func(q Point) {
		if q == AfterDispatchingJournaled {
			clock.Advance(adv)
		}
	}
	ob, err := Open(os.Getenv("B112R4_DIR"), Deps{WorkerID: "w1", Clock: clock, Provider: p, Crash: crash})
	if err != nil {
		fmt.Println("ERR open:", err)
		return 3
	}
	ctx := context.Background()
	op, err := ob.Propose(ctx, effect(Class(os.Getenv("B112R4_CLASS")), os.Getenv("B112R4_REF")))
	if err != nil {
		fmt.Println("ERR propose:", err)
		return 3
	}
	fmt.Println("OP", op.ID)
	_, err = ob.Dispatch(ctx, op.ID)
	fmt.Println("DISPATCHED", err)
	return 0
}

func r4Child(w *r3World, bank fileBank, mode string, advance time.Duration, eff Effect) *exec.Cmd {
	cmd := exec.Command(os.Args[0], "-test.run=^$")
	cmd.Env = append(os.Environ(), r4ChildEnv+"="+mode, "B112R4_DIR="+w.dir, "B112R4_BANK="+bank.path,
		"B112R4_NOW="+strconv.FormatInt(w.clock.Now().UnixNano(), 10), "B112R4_ADVANCE="+advance.String(),
		"B112R4_CLASS="+string(eff.Class), "B112R4_REF="+eff.Key.Ref)
	return cmd
}

func childOpID(t *testing.T, out string) string {
	t.Helper()
	for _, l := range strings.Split(out, "\n") {
		if v, ok := strings.CutPrefix(l, "OP "); ok && v != "" {
			return v
		}
	}
	t.Fatalf("worker printed no Operation ID:\n%s", out)
	return ""
}

// B1-12 · round 4 · test 1 (HIGH): a call silent for more than 15 minutes is never re-sent, and
// reaches Human — founder ruling B ("no answer at all ... never retried ... Human after 15
// minutes"); 09a §7 "uncertain --> human: ... deadline before proof". Three ways the silence
// ends: it does not (still hung), the call finally times out, or its worker dies. The request
// never lands, so every lookup afterwards honestly reads Absent: the read a re-send would trust.
// At ee19236 a late timeout is recorded Uncertain, whose lag window then passes, and a dead
// worker's attempt is resolved by lookup without HungDeadline: both re-send.
func TestB112R4SilentPastFifteenMinutesIsNeverResent(t *testing.T) {
	t.Run("still hung", func(t *testing.T) {
		ctx := context.Background()
		b := newR4Bank("hold-drop")
		w := newR3World(t, b)
		eff := effect(CheckBefore, "invoice_1501")
		op, err := w.open("w1").Propose(ctx, eff)
		if err != nil {
			t.Fatalf("Propose: %v", err)
		}
		done := make(chan error, 1)
		ob1 := w.open("w1")
		go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
		waitEntered(t, b, done)
		defer func() { close(b.release); waitDone(t, done) }()

		w.clock.Advance(rulingB + time.Minute)
		ob := w.open("w2")
		_ = ob.Reconcile(ctx)
		if got := w.state(op.ID); got.State != Human {
			t.Errorf("a call with no answer for 16 minutes: state %q, want %q (founder ruling B)", got.State, Human)
		}
		if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
			t.Errorf("Dispatch of a hung attempt: %v, want ErrUncertain", err)
		}
		if _, calls := b.count(eff.Payload); calls != 1 {
			t.Errorf("provider calls = %d, want 1", calls)
		}
	})

	t.Run("times out after 20 minutes", func(t *testing.T) {
		ctx := context.Background()
		b := newR4Bank("hold-drop")
		w := newR3World(t, b)
		eff := effect(CheckBefore, "invoice_1502")
		op, err := w.open("w1").Propose(ctx, eff)
		if err != nil {
			t.Fatalf("Propose: %v", err)
		}
		done := make(chan error, 1)
		ob1 := w.open("w1")
		go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
		waitEntered(t, b, done)
		w.clock.Advance(20 * time.Minute) // nobody reconciles while it hangs
		close(b.release)                  // the call finally ends: an ambiguous timeout
		if err := waitDone(t, done); !errors.Is(err, ErrUncertain) {
			t.Errorf("Dispatch whose call timed out after 20 silent minutes: %v, want ErrUncertain", err)
		}

		for _, after := range []time.Duration{rulingA + time.Minute, time.Hour, 6 * time.Hour} {
			w.clock.Advance(after)
			ob := w.open("w2")
			_ = ob.Reconcile(ctx)
			_, _ = ob.Propose(ctx, eff)
			_, _ = ob.Dispatch(ctx, op.ID)
		}
		if got := w.state(op.ID); got.State != Human {
			t.Errorf("a call silent for 20 minutes, then timed out: state %q, want %q (founder ruling B)", got.State, Human)
		}
		if n, calls := b.count(eff.Payload); n != 0 || calls != 1 {
			t.Errorf("effects = %d, provider calls = %d; want 0 and 1: silent past 15 minutes is never retried", n, calls)
		}
	})

	t.Run("worker dies", func(t *testing.T) {
		for _, class := range []Class{CheckBefore, NativeKey} {
			t.Run(string(class), func(t *testing.T) {
				ctx := context.Background()
				bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
				w := newR3World(t, bank)
				eff := effect(class, "invoice_1503")

				var out strings.Builder
				cmd := r4Child(w, bank, "hang", 0, eff)
				cmd.Stdout, cmd.Stderr = &out, &out
				if err := cmd.Start(); err != nil {
					t.Fatalf("start worker: %v", err)
				}
				deadline := time.Now().Add(30 * time.Second)
				for {
					if _, sends := bank.count(eff.Payload); sends == 1 {
						break
					}
					if time.Now().After(deadline) {
						_ = cmd.Process.Kill()
						_ = cmd.Wait()
						t.Fatalf("worker never sent:\n%s", out.String())
					}
					time.Sleep(10 * time.Millisecond)
				}
				// 20 silent minutes, unobserved; then the worker is killed.
				w.clock.Advance(20 * time.Minute)
				_ = cmd.Process.Signal(syscall.SIGKILL)
				_ = cmd.Wait()
				id := childOpID(t, out.String())

				for _, after := range []time.Duration{0, rulingA + time.Minute, 6 * time.Hour} {
					w.clock.Advance(after)
					ob := w.open("w2")
					_ = ob.Reconcile(ctx)
					if again, err := ob.Propose(ctx, eff); err != nil || again.ID != id {
						t.Fatalf("re-Propose = %q, %v; want %q", again.ID, err, id)
					}
					if _, err := ob.Dispatch(ctx, id); !errors.Is(err, ErrUncertain) {
						t.Errorf("Dispatch %v after a worker died with its call silent for 20 minutes: %v, want ErrUncertain",
							after, err)
					}
				}
				if got := w.state(id); got.State != Human {
					t.Errorf("worker died with its call silent for 20 minutes: state %q, want %q (founder ruling B)", got.State, Human)
				}
				if n, sends := bank.count(eff.Payload); n != 0 || sends != 1 {
					t.Errorf("effects = %d, sends = %d; want 0 and 1: silent past 15 minutes is never retried", n, sends)
				}
			})
		}
	})
}

// B1-12 · round 4 · test 2 (MED): a declared lag <= 0 is invalid and the 2-minute default applies
// (ruling A's default; fail safe per the Opus review of ee19236). The request is in transit when
// the call times out; one minute later a lookup reads Absent. Inside 2 minutes that read is not
// proof (09a §7.2), so nothing is re-sent. Paired legitimate cases, so that "never retry" cannot
// pass: a declared lag is honoured beyond the default, and once a short declared lag has passed
// an Absent read IS proof and the next attempt runs (09a §7 "uncertain --> failed: proven absent
// → next attempt, same Operation").
func TestB112R4NonPositiveLagUsesTheDefault(t *testing.T) {
	for _, lag := range []time.Duration{0, -time.Nanosecond, -time.Hour} {
		t.Run("declared "+lag.String(), func(t *testing.T) {
			ctx := context.Background()
			b := newR4Bank("late")
			w := newR3World(t, lagBank{b, lag})
			eff := effect(CheckBefore, "invoice_2001")
			ob := w.open("w1")
			op, err := ob.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			_, _ = ob.Dispatch(ctx, op.ID)

			w.clock.Advance(time.Minute)
			ob2 := w.open("w2")
			_ = ob2.Reconcile(ctx)
			if got := w.state(op.ID); got.State == Failed {
				t.Errorf("declared lag %v: an Absent read 1 minute after the timeout became %q; a lag <= 0 is invalid "+
					"and the 2-minute default applies", lag, got.State)
			}
			_, _ = ob2.Dispatch(ctx, op.ID)
			b.land()
			w.clock.Advance(10 * time.Minute)
			_ = w.open("w3").Reconcile(ctx)
			if n, calls := b.count(eff.Payload); n != 1 || calls != 1 {
				t.Errorf("declared lag %v: effects = %d, provider calls = %d; want 1 and 1", lag, n, calls)
			}
		})
	}

	t.Run("declared 10m is honoured past the default", func(t *testing.T) {
		ctx := context.Background()
		b := newR4Bank("late")
		w := newR3World(t, lagBank{b, 10 * time.Minute})
		eff := effect(CheckBefore, "invoice_2002")
		ob := w.open("w1")
		op, _ := ob.Propose(ctx, eff)
		_, _ = ob.Dispatch(ctx, op.ID)
		w.clock.Advance(5 * time.Minute)
		ob2 := w.open("w2")
		_ = ob2.Reconcile(ctx)
		_, _ = ob2.Dispatch(ctx, op.ID)
		b.land()
		if n, calls := b.count(eff.Payload); n != 1 || calls != 1 {
			t.Errorf("declared lag 10m, read at 5m: effects = %d, provider calls = %d; want 1 and 1", n, calls)
		}
	})

	t.Run("declared 30s has passed: Absent is proof", func(t *testing.T) {
		ctx := context.Background()
		b := newR4Bank("drop")
		w := newR3World(t, lagBank{b, 30 * time.Second})
		eff := effect(CheckBefore, "invoice_2003")
		ob := w.open("w1")
		op, _ := ob.Propose(ctx, eff)
		_, _ = ob.Dispatch(ctx, op.ID)
		w.clock.Advance(time.Minute)
		ob2 := w.open("w2")
		if err := ob2.Reconcile(ctx); err != nil {
			t.Fatalf("Reconcile: %v", err)
		}
		if got := w.state(op.ID); got.State != Failed {
			t.Errorf("declared lag 30s, Absent at 1m: state %q, want %q (proven absent)", got.State, Failed)
		}
		got, err := ob2.Dispatch(ctx, op.ID)
		if err != nil || got.State != Confirmed || got.Attempt != 2 {
			t.Errorf("next attempt = %+v, %v; want attempt 2 %q", got, err, Confirmed)
		}
	})
}

// B1-12 · round 4 · test 3 (mutant: uncertain-extends-window removed). Ruling A: an Absent read is
// not trusted "within the lag window after a timed-out or uncertain attempt" — the window runs
// from the timeout, not only from the send. The call is silent 5 minutes (under ruling B's 15),
// then times out with the request still in transit; a lookup 1 minute after the timeout reads
// Absent. Measured from the send that is 6 minutes, past the 2-minute default; measured from the
// timeout it is 1 minute, inside it. One effect.
func TestB112R4LagWindowRunsFromTheTimeout(t *testing.T) {
	ctx := context.Background()
	b := newR4Bank("hold-late")
	w := newR3World(t, b)
	eff := effect(CheckBefore, "invoice_3001")
	op, err := w.open("w1").Propose(ctx, eff)
	if err != nil {
		t.Fatalf("Propose: %v", err)
	}
	done := make(chan error, 1)
	ob1 := w.open("w1")
	go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
	waitEntered(t, b, done)
	w.clock.Advance(5 * time.Minute)
	close(b.release)
	_ = waitDone(t, done)

	w.clock.Advance(time.Minute)
	ob2 := w.open("w2")
	_ = ob2.Reconcile(ctx)
	if got := w.state(op.ID); got.State == Failed {
		t.Errorf("Absent 1 minute after the timeout (6 after the send) became %q; the window runs from the timeout", got.State)
	}
	_, _ = ob2.Dispatch(ctx, op.ID)
	b.land()
	w.clock.Advance(10 * time.Minute)
	_ = w.open("w3").Reconcile(ctx)
	if n, calls := b.count(eff.Payload); n != 1 || calls != 1 {
		t.Errorf("effects = %d, provider calls = %d; want 1 and 1", n, calls)
	}
	if got := w.state(op.ID); got.State != Confirmed {
		t.Errorf("after the request landed: state %q, want %q", got.State, Confirmed)
	}
}

// B1-12 · round 4 · test 4 (mutant: lagFrom = began). The window guards a request that may be in
// transit, so it runs from when the request LEFT (ruling A; 09a §7.2), not from when the attempt
// was journaled. The worker is slow: 10 minutes pass between journaling the attempt and sending
// it, and it dies with the request in transit. A lookup 1 minute after the send (11 after the
// attempt began, under ruling B's 15) reads Absent and is not proof. One effect.
func TestB112R4LagWindowRunsFromTheSend(t *testing.T) {
	for _, class := range []Class{CheckBefore, NativeKey} {
		t.Run(string(class), func(t *testing.T) {
			ctx := context.Background()
			bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
			w := newR3World(t, bank)
			eff := effect(class, "invoice_4001")

			out, err := r4Child(w, bank, "kill", 10*time.Minute, eff).CombinedOutput()
			var ee *exec.ExitError
			if !errors.As(err, &ee) || ee.Exited() || !strings.Contains(string(out), "CRASH in transit") {
				t.Fatalf("worker was not killed with the request in transit (err %v):\n%s", err, out)
			}
			id := childOpID(t, string(out))

			w.clock.Advance(11 * time.Minute) // 1 minute after the send
			ob := w.open("w2")
			_ = ob.Reconcile(ctx)
			if got := w.state(id); got.State == Failed {
				t.Errorf("Absent 1 minute after the send (11 after the attempt began) became %q; the window runs from the send",
					got.State)
			}
			_, _ = ob.Dispatch(ctx, id)
			bank.landPending()
			w.clock.Advance(2 * time.Minute)
			_ = w.open("w3").Reconcile(ctx)
			if n, sends := bank.count(eff.Payload); n != 1 || sends != 1 {
				t.Errorf("effects = %d, sends = %d; want 1 and 1", n, sends)
			}
			if got := w.state(id); got.State != Confirmed {
				t.Errorf("after the request landed: state %q, want %q", got.State, Confirmed)
			}
		})
	}
}

// B1-12 · round 4 · test 5 (mutant: the hung branch's state guard removed). Ruling B covers a
// call with no answer AT ALL; an attempt whose call answered with a timeout is answered-but-
// unclear and keeps the 24h UncertainDeadline (coordinator, 2026-10-02, correcting the decision
// note). Here an Uncertain attempt is an hour old and one reconciler holds it, mid-lookup; a
// second reconciler finds it locked. That lock is a reconciler, not a hung call: the attempt
// must stay Uncertain.
func TestB112R4AnsweredAttemptIsNotTreatedAsHung(t *testing.T) {
	ctx := context.Background()
	b := newR4Bank("drop")
	w := newR3World(t, b)
	eff := effect(CheckBefore, "invoice_5001")
	ob := w.open("w1")
	op, err := ob.Propose(ctx, eff)
	if err != nil {
		t.Fatalf("Propose: %v", err)
	}
	if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
		t.Fatalf("setup: Dispatch after a timeout = %v, want ErrUncertain", err)
	}
	w.clock.Advance(time.Hour)

	hold := make(chan struct{})
	b.mu.Lock()
	b.lookupHold = hold
	b.mu.Unlock()
	doneA := make(chan error, 1)
	obA := w.open("wA")
	go func() { doneA <- obA.Reconcile(ctx) }()
	select {
	case <-b.lookupEntered:
	case <-time.After(30 * time.Second):
		t.Fatal("reconciler A never looked the attempt up")
	}
	_ = w.open("wB").Reconcile(ctx)
	if got := w.state(op.ID); got.State != Uncertain {
		t.Errorf("an answered attempt 1h old, locked by a reconciler: state %q, want %q (24h UncertainDeadline, not ruling B)",
			got.State, Uncertain)
	}
	close(hold)
	select {
	case <-doneA:
	case <-time.After(30 * time.Second):
		t.Fatal("reconciler A did not finish")
	}
}

// B1-12 · round 4 · test 6 (mutant: markSent's guard removed). The attempt is journaled, then the
// worker stalls 20 minutes before sending; meanwhile a reconciler finds it locked and silent past
// ruling B's 15 minutes and hands it to a human. The worker must not then send it: §7 "never
// re-dispatches blindly", ruling B "never retried". Zero provider calls.
func TestB112R4NoSendAfterHandedToHuman(t *testing.T) {
	ctx := context.Background()
	b := newR4Bank()
	w := newR3World(t, b)
	eff := effect(CheckBefore, "invoice_6001")
	stalled := func(q Point) {
		if q == AfterDispatchingJournaled {
			w.clock.Advance(20 * time.Minute)
			_ = w.open("w2").Reconcile(ctx)
		}
	}
	ob := w.openCrash("w1", stalled)
	op, err := ob.Propose(ctx, eff)
	if err != nil {
		t.Fatalf("Propose: %v", err)
	}
	if got := w.state(op.ID); got.State != Proposed {
		t.Fatalf("setup: state %q", got.State)
	}
	_, err = ob.Dispatch(ctx, op.ID)
	if got := w.state(op.ID); got.State != Human {
		t.Fatalf("setup: the reconciler did not hand the stalled attempt to a human (state %q)", got.State)
	}
	if !errors.Is(err, ErrUncertain) {
		t.Errorf("Dispatch whose attempt was handed to a human before it was sent: %v, want ErrUncertain", err)
	}
	if _, calls := b.count(eff.Payload); calls != 0 {
		t.Errorf("provider calls = %d, want 0: an attempt handed to a human is not then sent", calls)
	}
}
