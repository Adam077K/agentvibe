//go:build donetest

// Done-tests for B1-12 (docs/vision-v3/14-BUILD-PLAN.md): "Q3 subset: faults at 4 crash points
// -> one effect; `uncertain` never auto-retries". Frozen by B0-17b; the file's sha256 is
// registered in build/done-tests/B0-17b.yml.
// Run: go -C kernel test -tags donetest ./internal/outbox/...
//
// Crashes are REAL: the test re-executes its own binary (os.Args[0]) with B017B_OUTBOX_CHILD
// set, and the child SIGKILLs itself at the named crash point. The next life is a different
// process, so nothing survives except what the outbox put on disk. The provider is a file too,
// so effects are counted across processes.
//
// Out of scope here: the two-launcher race of gate G1(b). Per 09a §19 (the `job://` lease row,
// "two runners claim one job") it is the job:// lease — B1-05, frozen by B0-17a.
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
	"testing"
	"time"
)

const childEnv = "B017B_OUTBOX_CHILD"

func TestMain(m *testing.M) {
	if os.Getenv(childEnv) != "" {
		os.Exit(childMain())
	}
	os.Exit(m.Run())
}

type fakeClock struct{ t time.Time }

func (c *fakeClock) Now() time.Time          { return c.t }
func (c *fakeClock) Advance(d time.Duration) { c.t = c.t.Add(d) }

// bank is a provider with NO deduplication of its own — two sends are two payments — kept in
// an append-only file. An effect becomes visible to Lookup only after lag; a key with no
// effect reads Unknown until absentAfter, then Absent. Flags: "blind" (every lookup Unknown),
// "absent" (every lookup Absent), "inflight" (perform, then die at ProviderInFlight),
// "timeout" (perform, then return an ambiguous error), "reject" (one definite refusal).
type bank struct {
	path        string
	clock       *fakeClock
	lag         time.Duration
	absentAfter time.Time
	flags       map[string]bool
	crash       func(Point)
}

func (b *bank) record(kind, idem string, payload []byte) {
	f, err := os.OpenFile(b.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		panic(err)
	}
	fmt.Fprintf(f, "%s\t%s\t%s\t%d\n", kind, idem, payload, b.clock.Now().UnixNano())
	if err := f.Sync(); err != nil {
		panic(err)
	}
	f.Close()
}

func (b *bank) lines() [][]string {
	f, err := os.Open(b.path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		panic(err)
	}
	defer f.Close()
	var out [][]string
	s := bufio.NewScanner(f)
	for s.Scan() {
		out = append(out, strings.Split(s.Text(), "\t"))
	}
	return out
}

func (b *bank) Do(_ context.Context, idem string, payload []byte) error {
	if b.flags["reject"] {
		b.flags["reject"] = false
		b.record("rejected", idem, payload)
		return fmt.Errorf("card declined: %w", ErrRejected)
	}
	b.record("effect", idem, payload)
	if b.flags["inflight"] {
		b.crash(ProviderInFlight)
	}
	if b.flags["timeout"] {
		return context.DeadlineExceeded
	}
	return nil
}

func (b *bank) Lookup(_ context.Context, idem string) (Presence, error) {
	switch {
	case b.flags["blind"]:
		return Unknown, nil
	case b.flags["absent"]:
		return Absent, nil
	}
	now := b.clock.Now()
	for _, l := range b.lines() {
		if l[0] == "effect" && l[1] == idem {
			at, _ := strconv.ParseInt(l[3], 10, 64)
			if now.Before(time.Unix(0, at).Add(b.lag)) {
				return Unknown, nil
			}
			return Present, nil
		}
	}
	if now.Before(b.absentAfter) {
		return Unknown, nil
	}
	return Absent, nil
}

// count reports how many times payload's effect happened, and all provider calls.
func (b *bank) count(payload []byte) (effects, calls int) {
	for _, l := range b.lines() {
		calls++
		if l[0] == "effect" && l[2] == string(payload) {
			effects++
		}
	}
	return
}

func effect(class Class, ref string) Effect {
	if class == AtMostOnce {
		return Effect{
			Key:     BusinessKey{Venture: "keel", Verb: "sms.send", Target: "+15550100", Ref: ref},
			Class:   AtMostOnce,
			Payload: []byte("sms " + ref),
		}
	}
	return Effect{
		Key:     BusinessKey{Venture: "keel", Verb: "payment.pay", Target: "supplier_44", Ref: ref},
		Class:   class,
		Payload: []byte("pay supplier_44 " + ref + " EUR 1200"),
	}
}

func flagSet(list string) map[string]bool {
	m := map[string]bool{}
	for _, f := range strings.Split(list, ",") {
		if f != "" {
			m[f] = true
		}
	}
	return m
}

// childMain is one worker process: open the outbox, run one step, and — if B017B_CRASH names
// a point — SIGKILL itself there.
func childMain() int {
	env := os.Getenv
	now, _ := strconv.ParseInt(env("B017B_NOW"), 10, 64)
	absent, _ := strconv.ParseInt(env("B017B_ABSENT_AFTER"), 10, 64)
	lag, _ := time.ParseDuration(env("B017B_LAG"))
	clock := &fakeClock{t: time.Unix(0, now).UTC()}
	var crash func(Point)
	if p := Point(env("B017B_CRASH")); p != "" {
		crash = func(q Point) {
			if q != p {
				return
			}
			fmt.Println("CRASH", q)
			self, _ := os.FindProcess(os.Getpid())
			_ = self.Kill()
			select {}
		}
	}
	b := &bank{path: env("B017B_BANK"), clock: clock, lag: lag, absentAfter: time.Unix(0, absent),
		flags: flagSet(env("B017B_FLAGS")), crash: crash}
	ob, err := Open(env("B017B_DIR"), Deps{WorkerID: env("B017B_WORKER"), Clock: clock, Provider: b, Crash: crash})
	if err != nil {
		fmt.Println("ERR open:", err)
		return 3
	}
	ctx := context.Background()
	switch env(childEnv) {
	case "dispatch":
		op, err := ob.Propose(ctx, effect(Class(env("B017B_CLASS")), env("B017B_REF")))
		if err != nil {
			fmt.Println("ERR propose:", err)
			return 3
		}
		fmt.Println("OP", op.ID)
		_, err = ob.Dispatch(ctx, op.ID)
		fmt.Println("DISPATCHED", err)
	case "reconcile":
		fmt.Println("RECONCILED", ob.Reconcile(ctx))
	}
	return 0
}

type world struct {
	t           *testing.T
	obDir       string
	lag         time.Duration
	absentAfter time.Time
	clock       *fakeClock
	bank        *bank // the parent's view of the provider file
}

func newWorld(t *testing.T, lag time.Duration, parentFlags string) *world {
	dir := t.TempDir()
	c := &fakeClock{t: time.Date(2026, 10, 13, 3, 17, 0, 0, time.UTC)}
	w := &world{t: t, obDir: filepath.Join(dir, "outbox"), lag: lag, absentAfter: c.Now().Add(lag), clock: c}
	if err := os.MkdirAll(w.obDir, 0o700); err != nil {
		t.Fatal(err)
	}
	w.bank = &bank{path: filepath.Join(dir, "bank.log"), clock: c, lag: lag, absentAfter: w.absentAfter,
		flags: flagSet(parentFlags), crash: func(Point) { panic("parent never crashes") }}
	return w
}

type childRun struct {
	out    string
	killed bool
}

// child runs one worker process against the shared outbox directory and provider file.
func (w *world) child(step, worker string, crash Point, e Effect, flags string) childRun {
	w.t.Helper()
	cmd := exec.Command(os.Args[0], "-test.run=^$")
	cmd.Env = append(os.Environ(),
		childEnv+"="+step,
		"B017B_DIR="+w.obDir,
		"B017B_BANK="+w.bank.path,
		"B017B_NOW="+strconv.FormatInt(w.clock.Now().UnixNano(), 10),
		"B017B_ABSENT_AFTER="+strconv.FormatInt(w.absentAfter.UnixNano(), 10),
		"B017B_LAG="+w.lag.String(),
		"B017B_WORKER="+worker,
		"B017B_CRASH="+string(crash),
		"B017B_CLASS="+string(e.Class),
		"B017B_REF="+e.Key.Ref,
		"B017B_FLAGS="+flags,
	)
	out, err := cmd.CombinedOutput()
	var ee *exec.ExitError
	r := childRun{out: string(out), killed: errors.As(err, &ee) && !ee.Exited()}
	if err != nil && !r.killed {
		w.t.Fatalf("worker %s (%s) failed: %v\n%s", worker, step, err, out)
	}
	return r
}

func (w *world) mustDie(r childRun, p Point) {
	w.t.Helper()
	if !r.killed || !strings.Contains(r.out, "CRASH "+string(p)) {
		w.t.Fatalf("worker was not killed at %q (killed=%v); the outbox must reach the crash point:\n%s", p, r.killed, r.out)
	}
}

func (w *world) mustPersist() {
	w.t.Helper()
	entries, err := os.ReadDir(w.obDir)
	if err != nil || len(entries) == 0 {
		w.t.Fatalf("after the worker died, %s holds nothing (err %v): the outbox must journal to disk", w.obDir, err)
	}
}

func opID(t *testing.T, r childRun) string {
	t.Helper()
	for _, l := range strings.Split(r.out, "\n") {
		if id, ok := strings.CutPrefix(l, "OP "); ok && id != "" {
			return id
		}
	}
	t.Fatalf("worker printed no Operation ID:\n%s", r.out)
	return ""
}

// open is an in-process worker: a restart, since this process has never opened the outbox.
func (w *world) open(worker string) Outbox {
	w.t.Helper()
	ob, err := Open(w.obDir, Deps{WorkerID: worker, Clock: w.clock, Provider: w.bank})
	if err != nil {
		w.t.Fatalf("Open(%s): %v", worker, err)
	}
	if ob == nil {
		w.t.Fatalf("Open(%s) returned a nil Outbox and no error", worker)
	}
	return ob
}

// B1-12 · done-test 1 (Q3 subset): a worker process killed at each of four crash points,
// restarts under new worker IDs, and reads inside the visibility lag still give exactly one
// effect, recovered from what is on disk.
func TestB112FourCrashPointsGiveOneEffect(t *testing.T) {
	const lag = 30 * time.Second
	for _, p := range []Point{AfterDispatchingJournaled, ProviderInFlight, BeforeReceiptPersisted, DuringReconcile} {
		t.Run(string(p), func(t *testing.T) {
			ctx := context.Background()
			w := newWorld(t, lag, "")
			eff := effect(CheckBefore, "invoice_8812")

			// Life 1, a process: propose and dispatch; SIGKILLed at the crash point.
			first, flags := p, ""
			if p == DuringReconcile {
				first = ProviderInFlight // the effect must be in doubt for reconcile to run
			}
			if first == ProviderInFlight {
				flags = "inflight"
			}
			r := w.child("dispatch", "w1", first, eff, flags)
			w.mustDie(r, first)
			id := opID(t, r)
			w.mustPersist()

			// Life 2, a process (DuringReconcile only): past the lag, the reconciler dies mid-record.
			if p == DuringReconcile {
				w.clock.Advance(2 * lag)
				w.mustDie(w.child("reconcile", "w2", DuringReconcile, eff, ""), DuringReconcile)
			}

			// A new worker inside the visibility lag: reads say Unknown, so nothing is re-sent.
			ob3 := w.open("w3")
			if p != DuringReconcile {
				w.clock.Advance(lag / 3)
				_ = ob3.Reconcile(ctx)
				again, err := ob3.Propose(ctx, eff)
				if err != nil {
					t.Fatalf("re-Propose: %v", err)
				}
				if again.ID != id {
					t.Fatalf("re-Propose after the crash gave Operation %q, want the journaled %q", again.ID, id)
				}
				_, calls := w.bank.count(eff.Payload)
				if _, err := ob3.Dispatch(ctx, id); !errors.Is(err, ErrUncertain) {
					t.Errorf("Dispatch inside the visibility lag: error = %v, want ErrUncertain", err)
				}
				if _, c := w.bank.count(eff.Payload); c != calls {
					t.Errorf("Dispatch inside the visibility lag called the provider (%d -> %d)", calls, c)
				}
			}

			// Past the lag: reconcile first, then whatever dispatch is still owed.
			w.clock.Advance(2 * lag)
			ob4 := w.open("w4")
			if err := ob4.Reconcile(ctx); err != nil {
				t.Fatalf("Reconcile past the lag: %v", err)
			}
			final, err := ob4.Propose(ctx, eff)
			if err != nil {
				t.Fatalf("final Propose: %v", err)
			}
			if final.ID != id {
				t.Fatalf("final Propose gave Operation %q, want %q", final.ID, id)
			}
			if final.State != Confirmed {
				if _, err := ob4.Dispatch(ctx, id); err != nil {
					t.Fatalf("Dispatch of the next attempt: %v", err)
				}
			}
			if n, _ := w.bank.count(eff.Payload); n != 1 {
				t.Errorf("effects = %d, want exactly 1", n)
			}
			if got, err := w.open("w5").Get(ctx, id); err != nil || got.State != Confirmed {
				t.Errorf("Get after restart = %+v, %v; want state %q", got, err, Confirmed)
			}
		})
	}
}

// B1-12 · done-test 2: `uncertain` never auto-retries — across process deaths, restarts,
// reconciles and a day of wall time, and even when the provider's lookup answers Absent for an
// at_most_once effect — while a DEFINITE failure does get its next attempt (the paired
// legitimate case: a design that never retries anything fails).
func TestB112UncertainNeverAutoRetries(t *testing.T) {
	ctx := context.Background()
	cases := []struct {
		name   string
		eff    Effect
		lookup string // provider lookup behaviour, in every process: "blind" or "absent"
		crash  bool   // true: the worker is killed in flight; false: the provider times out
		want   []State
	}{
		{"at_most_once killed in flight", effect(AtMostOnce, "reminder_1"), "blind", true, []State{Human}},
		{"at_most_once timeout", effect(AtMostOnce, "reminder_2"), "blind", false, []State{Human}},
		{"at_most_once killed in flight, lookup says Absent", effect(AtMostOnce, "reminder_3"), "absent", true, []State{Human}},
		{"at_most_once timeout, lookup says Absent", effect(AtMostOnce, "reminder_4"), "absent", false, []State{Human}},
		{"check_before timeout, never provable", effect(CheckBefore, "invoice_9001"), "blind", false, []State{Uncertain, Human}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			w := newWorld(t, 30*time.Second, tc.lookup)
			var id string
			if tc.crash {
				r := w.child("dispatch", "w1", ProviderInFlight, tc.eff, tc.lookup+",inflight")
				w.mustDie(r, ProviderInFlight)
				id = opID(t, r)
			} else {
				r := w.child("dispatch", "w1", "", tc.eff, tc.lookup+",timeout")
				if r.killed || strings.Contains(r.out, "DISPATCHED <nil>") || !strings.Contains(r.out, "DISPATCHED ") {
					t.Fatalf("Dispatch after an ambiguous provider error must return an error:\n%s", r.out)
				}
				id = opID(t, r)
			}
			w.mustPersist()
			var ob Outbox
			for round := 1; round <= 5; round++ {
				w.clock.Advance(6 * time.Hour)
				ob = w.open(fmt.Sprintf("w%d", round+1))
				_ = ob.Reconcile(ctx)
				again, err := ob.Propose(ctx, tc.eff)
				if err != nil {
					t.Fatalf("round %d Propose: %v", round, err)
				}
				if again.ID != id {
					t.Fatalf("round %d: Operation %q, want the journaled %q", round, again.ID, id)
				}
				if _, err := ob.Dispatch(ctx, id); !errors.Is(err, ErrUncertain) {
					t.Errorf("round %d Dispatch: error = %v, want ErrUncertain", round, err)
				}
			}
			if n, calls := w.bank.count(tc.eff.Payload); n != 1 || calls != 1 {
				t.Errorf("effects = %d, provider calls = %d; want 1 and 1 (zero re-sends)", n, calls)
			}
			got, err := ob.Get(ctx, id)
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
		w := newWorld(t, 30*time.Second, "reject")
		eff := effect(CheckBefore, "invoice_7000")
		ob := w.open("w1")
		op, err := ob.Propose(ctx, eff)
		if err != nil {
			t.Fatalf("Propose: %v", err)
		}
		if _, err := ob.Dispatch(ctx, op.ID); err == nil {
			t.Fatalf("Dispatch of a rejected effect returned nil error")
		}
		ob = w.open("w2")
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
