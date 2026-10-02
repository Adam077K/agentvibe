//go:build donetest

// Done-tests for B1-12, round 5 (docs/vision-v3/14-BUILD-PLAN.md §6, B1-12: "Q3 subset: faults at
// 4 crash points -> one effect; `uncertain` never auto-retries"). Re-frozen 2026-10-02 after the
// founder's dead-worker ruling and an Opus re-review of 87059ac that passed it with surviving
// mutants. Rounds 1-4 are unchanged. Shares TestMain, world/child (round 1), r3World, fileBank,
// killBank (round 3), r4Bank, hangBank, r4Child, childOpID (round 4).
// Run: go -C kernel test -tags donetest ./internal/outbox/...
//
// Rulings (docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md):
//   - A: each provider's visibility lag, default 2 minutes, enforced by the outbox; an attempt
//     with no sent record provably never reached the provider.
//   - B: a call with no answer at all is never retried and escalates to Human after 15 minutes.
//   - C (founder, 2026-10-02, via AskUserQuestion, relayed by the coordinator): a worker dies
//     before 15 minutes on a call that never answered; once the 2-minute lag has passed, a
//     provider lookup of Absent allows ONE retry. A second such death goes to Human. Past 15
//     minutes the attempt goes to Human.
// Canon: 09a §7 diagram, "uncertain --> failed: proven absent → next attempt, same Operation" and
// "uncertain --> human: at_most_once, or deadline before proof"; 09a §7.2 visibility_lag_s.
//
// The 15 minutes are the literal rulingB (round 4), never HungDeadline, so moving the constant
// cannot move the test.
package outbox

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"
)

// hungWorker starts a worker process that sends eff's request and then never answers. It returns
// once the request is on the wire; kill ends it.
type hungWorker struct {
	cmd *exec.Cmd
	out *strings.Builder
}

func startHung(t *testing.T, w *r3World, bank fileBank, eff Effect) *hungWorker {
	t.Helper()
	_, before := bank.count(eff.Payload)
	h := &hungWorker{cmd: r4Child(w, bank, "hang", 0, eff), out: &strings.Builder{}}
	h.cmd.Stdout, h.cmd.Stderr = h.out, h.out
	if err := h.cmd.Start(); err != nil {
		t.Fatalf("start worker: %v", err)
	}
	deadline := time.Now().Add(30 * time.Second)
	for {
		if _, sends := bank.count(eff.Payload); sends > before {
			return h
		}
		if time.Now().After(deadline) {
			h.kill()
			t.Fatalf("worker never sent:\n%s", h.out.String())
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func (h *hungWorker) kill() string {
	_ = h.cmd.Process.Signal(syscall.SIGKILL)
	_ = h.cmd.Wait()
	return h.out.String()
}

// reconcileAndDispatch is a replacement worker: reconcile first, re-propose, dispatch what is owed.
func reconcileAndDispatch(t *testing.T, w *r3World, eff Effect, id, worker string) (Operation, error) {
	t.Helper()
	ob := w.open(worker)
	_ = ob.Reconcile(context.Background())
	if again, err := ob.Propose(context.Background(), eff); err != nil || again.ID != id {
		t.Fatalf("re-Propose = %q, %v; want %q", again.ID, err, id)
	}
	return ob.Dispatch(context.Background(), id)
}

// B1-12 · round 5 · test 1: founder ruling C, pinned three ways.
func TestB112R5DeadWorkerRetriesOnce(t *testing.T) {
	// A worker dies 5 minutes into a call that never answered. After the 2-minute lag the lookup
	// reads Absent: exactly one re-send, which lands.
	t.Run("death at 5m then Absent: one re-send", func(t *testing.T) {
		bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
		w := newR3World(t, bank)
		eff := effect(CheckBefore, "invoice_5101")
		h := startHung(t, w, bank, eff)
		w.clock.Advance(5 * time.Minute)
		id := childOpID(t, h.kill())

		w.clock.Advance(rulingA + time.Minute) // 8 minutes after the attempt began
		got, err := reconcileAndDispatch(t, w, eff, id, "w2")
		if err != nil || got.State != Confirmed || got.Attempt != 2 {
			t.Errorf("after a death at 5m and Absent past the lag: %+v, %v; want attempt 2 %q (ruling C: retry once)",
				got, err, Confirmed)
		}
		if n, sends := bank.count(eff.Payload); n != 1 || sends != 2 {
			t.Errorf("effects = %d, sends = %d; want 1 and 2 (the lost request and exactly one re-send)", n, sends)
		}
	})

	// The re-send's worker dies too, also before 15 minutes, also unanswered. No third send, ever;
	// the Operation goes to Human.
	t.Run("second death on the re-send: Human, no third send", func(t *testing.T) {
		bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
		w := newR3World(t, bank)
		eff := effect(CheckBefore, "invoice_5102")
		h := startHung(t, w, bank, eff)
		w.clock.Advance(5 * time.Minute)
		id := childOpID(t, h.kill())

		w.clock.Advance(rulingA + time.Minute)
		ob := w.open("w2")
		_ = ob.Reconcile(context.Background())
		if got := w.state(id); got.State != Failed {
			t.Fatalf("setup: first death, Absent past the lag: state %q, want %q", got.State, Failed)
		}
		h2 := startHung(t, w, bank, eff) // the one re-send: attempt 2, also never answered
		w.clock.Advance(5 * time.Minute)
		h2.kill()

		for i, step := range []time.Duration{rulingA + time.Minute, rulingB, 6 * time.Hour} {
			w.clock.Advance(step)
			obN := w.open(fmt.Sprintf("w%d", i+3))
			_ = obN.Reconcile(context.Background())
			if got := w.state(id); got.State == Failed {
				t.Errorf("second death, reconcile %d: state %q makes a second retry eligible; ruling C allows one",
					i+1, got.State)
			}
			if _, err := obN.Dispatch(context.Background(), id); !errors.Is(err, ErrUncertain) {
				t.Errorf("Dispatch %d after the second death: %v, want ErrUncertain (ruling C: one retry only)", i+1, err)
			}
		}
		if got := w.state(id); got.State != Human || got.Attempt != 2 {
			t.Errorf("after two unanswered deaths: state %q attempt %d; want %q attempt 2", got.State, got.Attempt, Human)
		}
		if n, sends := bank.count(eff.Payload); n != 0 || sends != 2 {
			t.Errorf("effects = %d, sends = %d; want 0 and 2 (no third send)", n, sends)
		}
	})

	// A worker dies 16 minutes into a call that never answered: Human, no re-send (ruling B).
	t.Run("death at 16m: Human, no re-send", func(t *testing.T) {
		bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
		w := newR3World(t, bank)
		eff := effect(CheckBefore, "invoice_5103")
		h := startHung(t, w, bank, eff)
		w.clock.Advance(16 * time.Minute)
		id := childOpID(t, h.kill())

		for i, step := range []time.Duration{0, rulingA + time.Minute, 6 * time.Hour} {
			w.clock.Advance(step)
			if _, err := reconcileAndDispatch(t, w, eff, id, fmt.Sprintf("w%d", i+2)); !errors.Is(err, ErrUncertain) {
				t.Errorf("Dispatch %d after a death at 16m: %v, want ErrUncertain", i+1, err)
			}
		}
		if got := w.state(id); got.State != Human {
			t.Errorf("death at 16m: state %q, want %q", got.State, Human)
		}
		if _, sends := bank.count(eff.Payload); sends != 1 {
			t.Errorf("sends = %d, want 1", sends)
		}
	})
}

// rejectBank refuses every request definitely: the effect did not happen (outbox.go ErrRejected).
type rejectBank struct{}

func (rejectBank) Do(context.Context, string, []byte) error {
	return fmt.Errorf("card declined: %w", ErrRejected)
}
func (rejectBank) Lookup(context.Context, string) (Presence, error) { return Absent, nil }

// B1-12 · round 5 · test 2 (MED mutant: answered not reset per attempt). "Answered" is a fact
// about ONE attempt's call. Attempt 1 is answered with a definite rejection (§7 "dispatching -->
// failed: definite error"); attempt 2 is sent and its worker dies with no answer. Sixteen minutes
// on, attempt 2 has had no answer at all: Human, never re-sent (ruling B). Carrying attempt 1's
// answer forward would let an Absent read re-send it.
func TestB112R5AnswerBelongsToItsAttempt(t *testing.T) {
	ctx := context.Background()
	bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
	w := newR3World(t, rejectBank{})
	eff := effect(CheckBefore, "invoice_5201")
	ob := w.open("w1")
	op, err := ob.Propose(ctx, eff)
	if err != nil {
		t.Fatalf("Propose: %v", err)
	}
	if _, err := ob.Dispatch(ctx, op.ID); err == nil {
		t.Fatal("setup: a rejected attempt returned nil")
	}
	if got := w.state(op.ID); got.State != Failed || got.Attempt != 1 {
		t.Fatalf("setup: state %q attempt %d, want %q attempt 1", got.State, got.Attempt, Failed)
	}

	w.p = bank
	h := startHung(t, w, bank, eff) // attempt 2: sent, never answered
	if id := childOpID(t, h.kill()); id != op.ID {
		t.Fatalf("worker dispatched %q, want %q", id, op.ID)
	}
	w.clock.Advance(rulingB + time.Minute)
	if _, err := reconcileAndDispatch(t, w, eff, op.ID, "w3"); !errors.Is(err, ErrUncertain) {
		t.Errorf("Dispatch after attempt 2 went 16m unanswered: %v, want ErrUncertain", err)
	}
	if got := w.state(op.ID); got.State != Human || got.Attempt != 2 {
		t.Errorf("attempt 2 unanswered for 16m: state %q attempt %d; want %q attempt 2 (attempt 1's answer is not attempt 2's)",
			got.State, got.Attempt, Human)
	}
	if _, sends := bank.count(eff.Payload); sends != 1 {
		t.Errorf("sends after the rejection = %d, want 1", sends)
	}
}

// B1-12 · round 5 · test 3 (LOW mutant: the hung gate ignores `sent`). Ruling A's note: "an
// attempt with no sent record provably never reached the provider". Ruling B concerns a call with
// no answer, and an attempt killed before its call was never a call. Killed after journaling and
// before sending, it reconciles 16 minutes later on an Absent read to Failed and runs its next
// attempt (§7 "proven absent → next attempt, same Operation"); it is not handed to a human.
func TestB112R5UnsentAttemptIsNotHung(t *testing.T) {
	ctx := context.Background()
	w := newWorld(t, 30*time.Second, "")
	eff := effect(CheckBefore, "invoice_5301")
	r := w.child("dispatch", "w1", AfterDispatchingJournaled, eff, "")
	w.mustDie(r, AfterDispatchingJournaled)
	id := opID(t, r)

	w.clock.Advance(rulingB + time.Minute)
	ob := w.open("w2")
	if err := ob.Reconcile(ctx); err != nil {
		t.Fatalf("Reconcile: %v", err)
	}
	if got, err := ob.Get(ctx, id); err != nil || got.State != Failed {
		t.Errorf("never-sent attempt, Absent at 16m: %+v, %v; want %q (it was never a call)", got, err, Failed)
	}
	got, err := ob.Dispatch(ctx, id)
	if err != nil || got.State != Confirmed || got.Attempt != 2 {
		t.Errorf("next attempt = %+v, %v; want attempt 2 %q", got, err, Confirmed)
	}
	if n, _ := w.bank.count(eff.Payload); n != 1 {
		t.Errorf("effects = %d, want 1", n)
	}
}

// B1-12 · round 5 · test 4 (LOW mutants: both 15-minute boundaries). Ruling B: Human "after 15
// minutes". Pinned as the implementation reads it and the re-review passed: at 15m exactly the
// attempt is Human, at 15m-1ns it is not. Two places apply it — a call that finally times out
// (Dispatch) and a call whose worker died (the reconciler) — and each is pinned at 15m-1ns, 15m
// and 15m+1ns.
func TestB112R5FifteenMinuteBoundary(t *testing.T) {
	cases := []struct {
		at    time.Duration
		human bool
	}{{rulingB - time.Nanosecond, false}, {rulingB, true}, {rulingB + time.Nanosecond, true}}

	for _, c := range cases {
		t.Run(fmt.Sprintf("call times out at %v", c.at), func(t *testing.T) {
			ctx := context.Background()
			b := newR4Bank("hold-drop")
			w := newR3World(t, b)
			eff := effect(CheckBefore, "invoice_5401")
			op, err := w.open("w1").Propose(ctx, eff)
			if err != nil {
				t.Fatalf("Propose: %v", err)
			}
			done := make(chan error, 1)
			ob1 := w.open("w1")
			go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
			waitEntered(t, b, done)
			w.clock.Advance(c.at)
			close(b.release)
			_ = waitDone(t, done)
			got := w.state(op.ID)
			if c.human && got.State != Human {
				t.Errorf("timed out %v after the attempt began: state %q, want %q", c.at, got.State, Human)
			}
			if !c.human && got.State != Uncertain {
				t.Errorf("timed out %v after the attempt began: state %q, want %q", c.at, got.State, Uncertain)
			}
		})

		t.Run(fmt.Sprintf("dead worker reconciled at %v", c.at), func(t *testing.T) {
			ctx := context.Background()
			bank := fileBank{path: filepath.Join(t.TempDir(), "bank.log")}
			w := newR3World(t, bank)
			eff := effect(CheckBefore, "invoice_5402")
			out, _ := r4Child(w, bank, "kill", 0, eff).CombinedOutput()
			id := childOpID(t, string(out))
			w.clock.Advance(c.at)
			_ = w.open("w2").Reconcile(ctx)
			got := w.state(id)
			if c.human && got.State != Human {
				t.Errorf("dead worker, reconciled %v after the attempt began: state %q, want %q", c.at, got.State, Human)
			}
			if !c.human && got.State != Failed {
				t.Errorf("dead worker, reconciled %v after the attempt began, Absent past the lag: state %q, want %q "+
					"(ruling C: before 15m one retry is allowed)", c.at, got.State, Failed)
			}
		})
	}
}
