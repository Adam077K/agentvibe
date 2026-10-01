package lease

import (
	"context"
	"errors"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// countingJournal counts the ErrSeqConflicts the Journal returns, so a race test can show the
// claim really was contended in storage rather than serialised by luck.
type countingJournal struct {
	journal.Journal
	conflicts atomic.Int64
}

func (c *countingJournal) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	ev, err := c.Journal.Append(ctx, p)
	if errors.Is(err, journal.ErrSeqConflict) {
		c.conflicts.Add(1)
	}
	return ev, err
}

func open(t *testing.T) journal.Journal {
	t.Helper()
	j, err := journal.Open(filepath.Join(t.TempDir(), "journal.db"))
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j
}

// The race is decided by the Journal's expect_seq check: with many runners on one job, losers
// reach Append and are refused there, and exactly one claim exists.
func TestRaceIsDecidedInStorage(t *testing.T) {
	ctx := context.Background()
	cj := &countingJournal{Journal: open(t)}
	const runners, jobs = 8, 200
	for i := 0; i < jobs; i++ {
		job := "job_contend_" + string(rune('a'+i%26)) + time.Duration(i).String()
		start := make(chan struct{})
		var wg sync.WaitGroup
		var wins atomic.Int64
		for r := 0; r < runners; r++ {
			c, _ := New(cj)
			wg.Add(1)
			go func() {
				defer wg.Done()
				<-start
				if _, err := c.ClaimJob(ctx, job, "r", time.Minute); err == nil {
					wins.Add(1)
				} else if !errors.Is(err, ErrHeld) {
					t.Errorf("claim: %v", err)
				}
			}()
		}
		close(start)
		wg.Wait()
		if wins.Load() != 1 {
			t.Fatalf("job %s: %d winners, want 1", job, wins.Load())
		}
		if seq, _, _ := cj.Head(ctx, Stream(job)); seq != 1 {
			t.Fatalf("job %s: lease stream at seq %d, want exactly one claim row", job, seq)
		}
	}
	if cj.conflicts.Load() == 0 {
		t.Fatalf("no ErrSeqConflict in %d contended races: the race never reached storage", jobs)
	}
}

func TestCorruptHeadFailsClosed(t *testing.T) {
	ctx := context.Background()
	j := open(t)
	if _, err := j.Append(ctx, journal.Proposal{Stream: Stream("job_x"), Type: "lease.claimed", Data: []byte("not json")}); err != nil {
		t.Fatal(err)
	}
	c, _ := New(j)
	if _, err := c.ClaimJob(ctx, "job_x", "r", time.Minute); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("ClaimJob over corrupt head: %v, want ErrCorrupt", err)
	}
	if err := c.Check(ctx, "job_x", 1); !errors.Is(err, ErrCorrupt) {
		t.Fatalf("Check over corrupt head: %v, want ErrCorrupt", err)
	}
}

func TestExpiryUsesInjectedClock(t *testing.T) {
	ctx := context.Background()
	now := time.Unix(1_800_000_000, 0)
	c := &claimer{j: open(t), now: func() time.Time { return now }}
	a, err := c.ClaimJob(ctx, "job_clock", "a", time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	now = now.Add(59 * time.Second)
	if _, err := c.ClaimJob(ctx, "job_clock", "b", time.Minute); !errors.Is(err, ErrHeld) {
		t.Fatalf("claim before expiry: %v, want ErrHeld", err)
	}
	now = now.Add(time.Second) // exactly at ExpiresAt: expired
	if err := c.Release(ctx, a); !errors.Is(err, ErrStaleToken) {
		t.Fatalf("release of expired claim: %v, want ErrStaleToken", err)
	}
	b, err := c.ClaimJob(ctx, "job_clock", "b", time.Minute)
	if err != nil || b.Token != a.Token+1 {
		t.Fatalf("reclaim: %+v %v, want token %d", b, err, a.Token+1)
	}
}

func TestRejectsBadInput(t *testing.T) {
	ctx := context.Background()
	c, _ := New(open(t))
	for _, tc := range []struct {
		job, runner string
		ttl         time.Duration
	}{{"", "r", time.Second}, {"a/b", "r", time.Second}, {"a b", "r", time.Second}, {"j", "", time.Second}, {"j", "r", 0}} {
		if _, err := c.ClaimJob(ctx, tc.job, tc.runner, tc.ttl); err == nil {
			t.Errorf("ClaimJob(%q,%q,%v) accepted", tc.job, tc.runner, tc.ttl)
		}
	}
	if _, err := New(nil); err == nil {
		t.Error("New(nil) accepted")
	}
	if err := c.Check(ctx, "never", 1); !errors.Is(err, ErrStaleToken) {
		t.Errorf("Check on unclaimed job: %v, want ErrStaleToken", err)
	}
}
