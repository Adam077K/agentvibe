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
