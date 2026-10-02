package outbox

import (
	"context"
	"errors"
	"regexp"
	"sync"
	"testing"
	"time"
)

// Unit tests for what B1-12 adds beyond its frozen done-tests (outbox_donetest_test.go).

type tclock struct {
	mu sync.Mutex
	t  time.Time
}

func (c *tclock) Now() time.Time { c.mu.Lock(); defer c.mu.Unlock(); return c.t }
func (c *tclock) add(d time.Duration) {
	c.mu.Lock()
	c.t = c.t.Add(d)
	c.mu.Unlock()
}

// prov counts Do calls; lookups answer what it is told.
type prov struct {
	mu     sync.Mutex
	calls  int
	err    error
	answer Presence
}

func (p *prov) Do(context.Context, string, []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.calls++
	return p.err
}
func (p *prov) Lookup(context.Context, string) (Presence, error) { return p.answer, nil }

func fixture(t *testing.T) (string, *tclock, *prov, Effect) {
	return t.TempDir(), &tclock{t: time.Date(2026, 10, 2, 9, 0, 0, 0, time.UTC)}, &prov{},
		Effect{Key: BusinessKey{"keel", "mail.send", "founder", "digest_1"}, Class: CheckBefore, Payload: []byte("hi")}
}

func mustOpen(t *testing.T, dir string, c Clock, p Provider) Outbox {
	t.Helper()
	ob, err := Open(dir, Deps{WorkerID: "w", Clock: c, Provider: p})
	if err != nil {
		t.Fatal(err)
	}
	return ob
}

func TestULIDShape(t *testing.T) {
	at := time.UnixMilli(1790000000000)
	a, _ := newULID(at)
	b, _ := newULID(at)
	if !regexp.MustCompile(`^[0-7][0-9A-HJKMNP-TV-Z]{25}$`).MatchString(a) || a == b || a[:10] != b[:10] {
		t.Fatalf("ULIDs %q %q: want 26 Crockford chars, one 10-char time prefix, distinct randomness", a, b)
	}
	if later, _ := newULID(at.Add(time.Millisecond)); later[:10] <= a[:10] {
		t.Fatalf("time prefix does not sort: %q then %q", a, later)
	}
}

// Many workers proposing one business action at once, each through its own Open, get one Operation.
func TestConcurrentProposersShareOneOperation(t *testing.T) {
	dir, c, p, e := fixture(t)
	ids := make([]string, 8)
	var wg sync.WaitGroup
	for i := range ids {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			ob, err := Open(dir, Deps{WorkerID: "w", Clock: c, Provider: p})
			if err != nil {
				t.Error(err)
				return
			}
			op, err := ob.Propose(context.Background(), e)
			if err != nil {
				t.Error(err)
			}
			ids[i] = op.ID
		}(i)
	}
	wg.Wait()
	for _, id := range ids {
		if id == "" || id != ids[0] {
			t.Fatalf("proposers got %v, want one Operation", ids)
		}
	}
}

func TestChangedPayloadIsAnAmendmentNotANewOperation(t *testing.T) {
	dir, c, p, e := fixture(t)
	ob := mustOpen(t, dir, c, p)
	if _, err := ob.Propose(context.Background(), e); err != nil {
		t.Fatal(err)
	}
	e.Payload = []byte("other")
	if _, err := ob.Propose(context.Background(), e); !errors.Is(err, ErrAmended) {
		t.Fatalf("re-proposal with another payload: %v, want ErrAmended", err)
	}
	if _, err := ob.Get(context.Background(), "01J0000000000000000000000Z"); !errors.Is(err, ErrUnknownOperation) {
		t.Fatalf("Get of an unknown ID: %v, want ErrUnknownOperation", err)
	}
}

// An attempt that stays unprovable reaches Human at the deadline and is never re-sent; a receipt
// that arrives after a reconciler marked the attempt uncertain still confirms it.
func TestDeadlineAndLateReceipt(t *testing.T) {
	ctx := context.Background()
	dir, c, p, e := fixture(t)
	p.err = context.DeadlineExceeded
	ob := mustOpen(t, dir, c, p)
	op, _ := ob.Propose(ctx, e)
	if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
		t.Fatalf("ambiguous provider error: %v, want ErrUncertain", err)
	}
	for _, step := range []time.Duration{time.Hour, UncertainDeadline} {
		c.add(step)
		if err := ob.Reconcile(ctx); err != nil {
			t.Fatal(err)
		}
	}
	if got, _ := ob.Get(ctx, op.ID); got.State != Human || p.calls != 1 {
		t.Fatalf("past the deadline: %+v after %d calls; want %q and 1 call", got, p.calls, Human)
	}
	late := &outbox{path: ob.(*outbox).path, d: Deps{Clock: c, Provider: p}}
	if got, err := late.record(ctx, op.ID, 1, Confirmed, "receipt"); err != nil || got.State != Confirmed {
		t.Fatalf("late receipt: %+v, %v; want %q", got, err, Confirmed)
	}
	if _, err := late.record(ctx, op.ID, 1, Failed, "late refusal"); err == nil {
		t.Fatal("a confirmed attempt was moved to failed")
	}
}

// heldProv holds its FIRST Do open until release closes; any later Do lands at once, so a missing
// guard shows as a second call rather than a hang. Lookup says Absent, honestly, until one lands.
type heldProv struct {
	mu      sync.Mutex
	calls   int
	landed  bool
	entered chan struct{}
	release chan struct{}
	fail    error // returned after the effect lands: an ambiguous answer
}

func (p *heldProv) Do(context.Context, string, []byte) error {
	p.mu.Lock()
	p.calls++
	first := p.calls == 1
	p.mu.Unlock()
	if first {
		p.entered <- struct{}{}
		<-p.release
	}
	p.mu.Lock()
	p.landed = true
	p.mu.Unlock()
	return p.fail
}

func (p *heldProv) Lookup(context.Context, string) (Presence, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.landed {
		return Present, nil
	}
	return Absent, nil
}

// A next Dispatch that runs BEFORE an in-flight attempt's Receipt lands is refused on this host:
// reconcilers leave a locked attempt alone, so Absent never makes it eligible for a second send.
func TestRedispatchBeforeLateReceiptIsRefused(t *testing.T) {
	ctx := context.Background()
	dir, c, _, e := fixture(t)
	p := &heldProv{entered: make(chan struct{}, 1), release: make(chan struct{})}
	ob1 := mustOpen(t, dir, c, p)
	op, _ := ob1.Propose(ctx, e)
	done := make(chan error, 1)
	go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
	wait(t, p.entered, "attempt 1 to reach the provider")
	for i := 0; i < 3; i++ {
		c.add(UncertainDeadline)
		ob := mustOpen(t, dir, c, p)
		if err := ob.Reconcile(ctx); err != nil {
			t.Fatalf("Reconcile with an attempt in flight: %v", err)
		}
		if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
			t.Fatalf("re-Dispatch while attempt 1 is in flight: %v, want ErrUncertain", err)
		}
	}
	close(p.release)
	if err := wait(t, done, "attempt 1 to return"); err != nil {
		t.Fatalf("attempt 1: %v", err)
	}
	if got, _ := mustOpen(t, dir, c, p).Get(ctx, op.ID); got.State != Confirmed || got.Attempt != 1 || p.calls != 1 {
		t.Fatalf("after the Receipt: %+v, %d calls; want %q at attempt 1 and 1 call", got, p.calls, Confirmed)
	}
}

// The in-flight attempt ends ambiguously after a reconciler ran during it. Had the reconciler
// believed its Absent, the attempt would sit at failed and the next Dispatch would send again.
func TestReconcileDuringFlightThenAmbiguousStaysUncertain(t *testing.T) {
	ctx := context.Background()
	dir, c, _, e := fixture(t)
	p := &heldProv{entered: make(chan struct{}, 1), release: make(chan struct{}), fail: context.DeadlineExceeded}
	ob1 := mustOpen(t, dir, c, p)
	op, _ := ob1.Propose(ctx, e)
	done := make(chan error, 1)
	go func() { _, err := ob1.Dispatch(ctx, op.ID); done <- err }()
	wait(t, p.entered, "attempt 1 to reach the provider")
	_ = mustOpen(t, dir, c, p).Reconcile(ctx)
	close(p.release)
	if err := wait(t, done, "attempt 1 to return"); !errors.Is(err, ErrUncertain) {
		t.Fatalf("attempt 1 after an ambiguous answer: %v, want ErrUncertain", err)
	}
	ob := mustOpen(t, dir, c, p)
	if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) || p.calls != 1 {
		t.Fatalf("next Dispatch: %v after %d calls; want ErrUncertain and 1 call", err, p.calls)
	}
}

// A Receipt for the current attempt confirms it even after a reconciler (on a host that could not
// see the attempt lock) recorded it failed.
func TestReceiptAfterFailedConfirms(t *testing.T) {
	ctx := context.Background()
	dir, c, p, e := fixture(t)
	p.err = context.DeadlineExceeded
	ob := mustOpen(t, dir, c, p)
	op, _ := ob.Propose(ctx, e)
	_, _ = ob.Dispatch(ctx, op.ID)
	in := ob.(*outbox)
	if got, err := in.record(ctx, op.ID, 1, Failed, "lookup: absent"); err != nil || got.State != Failed {
		t.Fatalf("setup: %+v, %v", got, err)
	}
	if got, err := in.record(ctx, op.ID, 1, Confirmed, "receipt"); err != nil || got.State != Confirmed {
		t.Fatalf("Receipt after failed: %+v, %v; want %q", got, err, Confirmed)
	}
}

// wait receives from c or fails the test after 10s, so a broken guard fails instead of hanging.
func wait[T any](t *testing.T, c <-chan T, what string) T {
	t.Helper()
	select {
	case v := <-c:
		return v
	case <-time.After(10 * time.Second):
		t.Fatalf("timed out waiting for %s", what)
	}
	var zero T
	return zero
}
