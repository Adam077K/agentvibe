//go:build donetest

// B1-05 done-test, frozen by B0-17a (docs/vision-v3/14-BUILD-PLAN.md §6): "1,000 two-runner races
// → 0 double claims". Hash-registered in build/done-tests/B0-17a.yml.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/lease/
package lease_test

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

const races = 1000

func setup(t *testing.T, path string) (journal.Journal, lease.Claimer) {
	t.Helper()
	j, err := journal.Open(path)
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	c, err := lease.New(j)
	if err != nil {
		j.Close()
		t.Fatalf("lease.New: %v", err)
	}
	return j, c
}

func TestB1_05_TwoRunnerRace(t *testing.T) {
	ctx := context.Background()
	j, c := setup(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()

	double, none := 0, 0
	for i := 0; i < races; i++ {
		jobID := fmt.Sprintf("job_race_%04d", i)
		start := make(chan struct{})
		var wg sync.WaitGroup
		claims := make([]lease.Claim, 2)
		errs := make([]error, 2)
		for r := 0; r < 2; r++ {
			wg.Add(1)
			go func(r int) {
				defer wg.Done()
				<-start
				claims[r], errs[r] = c.ClaimJob(ctx, jobID, fmt.Sprintf("runner-%c", 'a'+r), 90*time.Second)
			}(r)
		}
		close(start)
		wg.Wait()

		winners := 0
		for r := 0; r < 2; r++ {
			switch {
			case errs[r] == nil:
				winners++
				if claims[r].Resource != "job://"+jobID || claims[r].JobID != jobID {
					t.Fatalf("race %d: claim on %q/%q, want job://%s", i, claims[r].Resource, claims[r].JobID, jobID)
				}
				if err := c.Check(ctx, jobID, claims[r].Token); err != nil {
					t.Fatalf("race %d: the winner's own token fails Check: %v", i, err)
				}
			case !errors.Is(errs[r], lease.ErrHeld):
				t.Fatalf("race %d: loser err=%v, want ErrHeld", i, errs[r])
			}
		}
		switch winners {
		case 2:
			double++
		case 0:
			none++
		}
	}
	if double != 0 || none != 0 {
		t.Fatalf("%d races: %d double claims, %d with no winner; want 0 and 0", races, double, none)
	}
}

func TestB1_05_FencedAfterRelease(t *testing.T) {
	ctx := context.Background()
	j, c := setup(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()

	a, err := c.ClaimJob(ctx, "job_fence", "runner-a", 90*time.Second)
	if err != nil {
		t.Fatalf("claim a: %v", err)
	}
	if err := c.Release(ctx, a); err != nil {
		t.Fatalf("release a: %v", err)
	}
	b, err := c.ClaimJob(ctx, "job_fence", "runner-b", 90*time.Second)
	if err != nil {
		t.Fatalf("claim b after release: %v", err)
	}
	if b.Token <= a.Token {
		t.Fatalf("token b %d not greater than token a %d", b.Token, a.Token)
	}
	if err := c.Check(ctx, "job_fence", a.Token); !errors.Is(err, lease.ErrStaleToken) {
		t.Fatalf("Check(stale token a): %v, want ErrStaleToken", err)
	}
	if err := c.Release(ctx, a); !errors.Is(err, lease.ErrStaleToken) {
		t.Fatalf("Release with stale token a: %v, want ErrStaleToken", err)
	}
	if err := c.Check(ctx, "job_fence", b.Token); err != nil {
		t.Fatalf("Check(live token b): %v", err)
	}
}

func TestB1_05_ExpiredClaimIsReclaimable(t *testing.T) {
	ctx := context.Background()
	j, c := setup(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()

	a, err := c.ClaimJob(ctx, "job_ttl", "runner-a", 50*time.Millisecond)
	if err != nil {
		t.Fatalf("claim a: %v", err)
	}
	time.Sleep(200 * time.Millisecond) // the runner paused and woke
	b, err := c.ClaimJob(ctx, "job_ttl", "runner-b", 90*time.Second)
	if err != nil {
		t.Fatalf("claim b after a expired: %v", err)
	}
	if b.Token <= a.Token {
		t.Fatalf("token b %d not greater than expired token a %d", b.Token, a.Token)
	}
	if err := c.Check(ctx, "job_ttl", a.Token); !errors.Is(err, lease.ErrStaleToken) {
		t.Fatalf("Check(expired token a): %v, want ErrStaleToken (the zombie is fenced)", err)
	}
}

func TestB1_05_ClaimSurvivesReopen(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "journal.db")
	j, c := setup(t, path)
	a, err := c.ClaimJob(ctx, "job_durable", "runner-a", 90*time.Second)
	if err != nil {
		j.Close()
		t.Fatalf("claim a: %v", err)
	}
	if err := j.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}
	j, c = setup(t, path)
	defer j.Close()
	if _, err := c.ClaimJob(ctx, "job_durable", "runner-b", 90*time.Second); !errors.Is(err, lease.ErrHeld) {
		t.Fatalf("claim b of a live job after reopen: %v, want ErrHeld (the claim row lives in the Journal)", err)
	}
	if err := c.Check(ctx, "job_durable", a.Token); err != nil {
		t.Fatalf("Check(token a) after reopen: %v", err)
	}
}
