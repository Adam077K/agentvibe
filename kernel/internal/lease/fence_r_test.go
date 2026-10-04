package lease

// Plain unit tests for the B1-04r edges its done-test does not reach. Every clock is injected;
// nothing sleeps.

import (
	"context"
	"errors"
	"testing"
	"time"
)

// A job that takes a free resource while it waits on a busy one is still waiting on the busy one:
// the grant ends the clock of the granted resource only, so re-waiting cannot dodge max_wait.
func TestMaxWaitSurvivesAGrantOfAnotherResource(t *testing.T) {
	const r1, r2, r3 = "repo://x/src/one.ts#f", "repo://x/src/two.ts#g", "repo://x/src/three.ts#h"
	oldBorn, youngBorn := fEpoch.Add(-time.Hour), fEpoch.Add(-time.Minute)
	req := func(job string, born time.Time, rs ...string) Request {
		q := fReq(job, born, AllOrNothing, rs...)
		q.TTL, q.MaxWait = time.Hour, 120*time.Second
		return q
	}
	t.Run("another resource", func(t *testing.T) {
		j := fOpen(t)
		clk := &fClock{t: fEpoch}
		c := fCoord(t, j, clk)
		fGrant(t, c, req("old", oldBorn, r2))
		fGrant(t, c, req("young", youngBorn, r1))
		fWait(t, c, req("young", youngBorn, r2))
		clk.advance(100 * time.Second)
		fGrant(t, c, req("young", youngBorn, r3))
		fWait(t, c, req("young", youngBorn, r2))
		clk.advance(21 * time.Second) // 121 s since the first wait on r2
		if _, err := c.Detect(context.Background()); err != nil {
			t.Fatalf("Detect: %v", err)
		}
		if h := fHolder(t, c, r1); h != "" {
			t.Fatalf("a job that dodged its cap with a free grant still holds %s (%q)", r1, h)
		}
		if _, ok, _ := c.Waiting(context.Background(), "young"); ok {
			t.Fatalf("starved job still waits")
		}
	})
	t.Run("the same resource", func(t *testing.T) {
		j := fOpen(t)
		clk := &fClock{t: fEpoch}
		c := fCoord(t, j, clk)
		fGrant(t, c, req("old", oldBorn, r2))
		fGrant(t, c, req("young", youngBorn, r1))
		fWait(t, c, req("young", youngBorn, r2))
		clk.advance(100 * time.Second)
		if err := c.Release(context.Background(), "old"); err != nil {
			t.Fatalf("Release: %v", err)
		}
		fGrant(t, c, req("young", youngBorn, r2)) // granted r2: its clock ends
		if err := c.Release(context.Background(), "young"); err != nil {
			t.Fatalf("Release: %v", err)
		}
		fGrant(t, c, req("old", oldBorn, r2))
		fGrant(t, c, req("young", youngBorn, r1))
		fWait(t, c, req("young", youngBorn, r2))
		clk.advance(60 * time.Second)
		if _, err := c.Detect(context.Background()); err != nil {
			t.Fatalf("Detect: %v", err)
		}
		if h := fHolder(t, c, r1); h != "young" {
			t.Fatalf("a wait begun after a grant of its resource starved at 60 s: Holder(%s) = %q", r1, h)
		}
	})
}

// The fold refuses a wait stamped at or before the Unix epoch, so Acquire refuses to write one.
func TestAcquireRefusesAClockAtTheEpoch(t *testing.T) {
	const r = "repo://x/src/one.ts#f"
	for _, at := range []time.Time{time.Unix(0, 0), time.Unix(-5, 0)} {
		j := fOpen(t)
		clk := &fClock{t: fEpoch}
		c := fCoord(t, j, clk)
		fGrant(t, c, fReq("old", fEpoch.Add(-time.Hour), AllOrNothing, r))
		clk.t = at
		_, err := c.Acquire(context.Background(), fReq("young", fEpoch, AllOrNothing, r))
		if err == nil || errors.Is(err, ErrWait) {
			t.Fatalf("Acquire at %v = %v, want a refusal that is not a wait", at, err)
		}
		clk.t = fEpoch
		if _, _, err := c.Waiting(context.Background(), "young"); err != nil {
			t.Fatalf("the stream is unreadable after a refused Acquire at %v: %v", at, err)
		}
		if seq := fHead(t, j); seq != 1 {
			t.Fatalf("a refused Acquire wrote events: head %d, want 1", seq)
		}
	}
}
