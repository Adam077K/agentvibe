package outbox

import (
	"context"
	"errors"
	"testing"
	"time"
)

// absentProv times out (an ambiguous answer, nothing landed) and then always looks up Absent.
type absentProv struct{ calls int }

func (p *absentProv) Do(context.Context, string, []byte) error {
	p.calls++
	return context.DeadlineExceeded
}
func (p *absentProv) Lookup(context.Context, string) (Presence, error) { return Absent, nil }

// laggedProv declares its own visibility lag.
type laggedProv struct {
	*absentProv
	lag time.Duration
}

func (p laggedProv) VisibilityLag() time.Duration { return p.lag }

// Founder ruling B: a call with no answer at all goes to a human at 15 minutes, not before, and is
// never re-sent; its Receipt, when it comes, still confirms.
func TestHungCallGoesToHumanAtFifteenMinutes(t *testing.T) {
	ctx := context.Background()
	dir, c, _, e := fixture(t)
	p := &heldProv{entered: make(chan struct{}, 1), release: make(chan struct{})}
	ob := mustOpen(t, dir, c, p)
	op, _ := ob.Propose(ctx, e)
	done := make(chan error, 1)
	go func() { _, err := ob.Dispatch(ctx, op.ID); done <- err }()
	wait(t, p.entered, "the call to reach the provider")
	for _, step := range []struct {
		at   time.Duration
		want State
	}{{15*time.Minute - time.Second, Dispatching}, {15 * time.Minute, Human}} {
		c.add(step.at - (c.Now().Sub(time.Date(2026, 10, 2, 9, 0, 0, 0, time.UTC))))
		_ = mustOpen(t, dir, c, p).Reconcile(ctx)
		if got, _ := ob.Get(ctx, op.ID); got.State != step.want {
			t.Fatalf("hung %v: %q, want %q", step.at, got.State, step.want)
		}
		if _, err := mustOpen(t, dir, c, p).Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
			t.Fatalf("Dispatch of a hung attempt at %v: %v, want ErrUncertain", step.at, err)
		}
	}
	close(p.release)
	wait(t, done, "the hung call to return")
	if got, _ := ob.Get(ctx, op.ID); got.State != Confirmed || p.calls != 1 {
		t.Fatalf("after the Receipt: %q, %d calls; want %q and 1", got.State, p.calls, Confirmed)
	}
}

// Founder ruling A (docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md): after a sent
// attempt, Absent is not proof inside the visibility lag. The default is 2 minutes; a Provider
// may declare its own.
func TestVisibilityLagWindow(t *testing.T) {
	for _, tc := range []struct {
		name           string
		p              Provider
		inside, beyond time.Duration
	}{
		// The ruling's number, written out: deriving it from DefaultVisibilityLag would pin nothing.
		{"default 2m", &absentProv{}, 2*time.Minute - time.Second, 2 * time.Minute},
		{"declared 10s", laggedProv{&absentProv{}, 10 * time.Second}, 9 * time.Second, 10 * time.Second},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			dir, c, _, e := fixture(t)
			ob := mustOpen(t, dir, c, tc.p)
			op, _ := ob.Propose(ctx, e)
			if _, err := ob.Dispatch(ctx, op.ID); !errors.Is(err, ErrUncertain) {
				t.Fatalf("setup: %v", err)
			}
			c.add(tc.inside)
			_ = ob.Reconcile(ctx)
			if got, _ := ob.Get(ctx, op.ID); got.State != Uncertain {
				t.Fatalf("Absent %v after the attempt: %q, want %q", tc.inside, got.State, Uncertain)
			}
			c.add(tc.beyond - tc.inside)
			_ = ob.Reconcile(ctx)
			if got, _ := ob.Get(ctx, op.ID); got.State != Failed {
				t.Fatalf("Absent %v after the attempt: %q, want %q", tc.beyond, got.State, Failed)
			}
		})
	}
}
