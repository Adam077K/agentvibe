//go:build donetest

// B1-05 done-test, frozen by B0-17a (docs/vision-v3/14-BUILD-PLAN.md §6): "1,000 two-runner races
// → 0 double claims". Hash-registered in build/done-tests/B0-17a.yml.
//
// Re-frozen 2026-10-01 on two B1-05 review findings, by a builder that is not the implementer: a
// Check that ignored expiry (M6) passed, and a Claimer that counted an ExpectSeq conflict as a win
// was caught only when the scheduler interleaved (~80% of runs). Added: Check of an expired token
// with nobody reclaiming, and one forced conflict (cutIn) at the end of the race test.
//
// Run: go -C kernel test -tags donetest -count=1 ./internal/lease/
package lease_test

// Why the race is two Claimers over ONE Journal handle, not two handles or two processes: the
// Journal has exactly one writer (09a §4.1), and the B1-01a done-test requires a second Open to be
// refused with ErrLocked. Real runners never open it; they reach the claim through the Kernel's
// command socket (09a §3-§4.1, B1-03), which is the one writer. So the claim must be decided in
// the Journal, not in a Claimer's memory. Two independent Claimers show that within a process, and
// TestB1_05_ClaimSurvivesReopen shows it across processes: a claim made by this process is refused
// to a different OS process that opens the same file afterwards.

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

const (
	claimChildEnv = "AVK_DONETEST_CLAIM_CHILD" // "<journal path>|<job id>|<parent token>"
)

// TestMain lets the test binary re-execute itself as a second OS process that opens the Journal,
// tries to claim a job and checks the first process's token.
func TestMain(m *testing.M) {
	if spec := os.Getenv(claimChildEnv); spec != "" {
		os.Exit(claimChild(spec))
	}
	os.Exit(m.Run())
}

func claimChild(spec string) int {
	ctx := context.Background()
	parts := strings.Split(spec, "|")
	if len(parts) != 3 {
		fmt.Println("error bad spec")
		return 0
	}
	token, _ := strconv.ParseUint(parts[2], 10, 64)
	j, err := journal.Open(parts[0])
	if err != nil {
		fmt.Printf("error open %v\n", err)
		return 0
	}
	defer j.Close()
	c, err := lease.New(j)
	if err != nil {
		fmt.Printf("error new %v\n", err)
		return 0
	}
	claim := "claimed"
	if _, err := c.ClaimJob(ctx, parts[1], "runner-child", 90*time.Second); errors.Is(err, lease.ErrHeld) {
		claim = "held"
	} else if err != nil {
		claim = "error " + err.Error()
	}
	check := "live"
	if err := c.Check(ctx, parts[1], token); err != nil {
		check = "check-error " + err.Error()
	}
	fmt.Println(claim, check)
	return 0
}

func TestB1_05_TwoRunnerRace(t *testing.T) {
	ctx := context.Background()
	j, cA := setup(t, filepath.Join(t.TempDir(), "journal.db"))
	defer j.Close()
	cB, err := lease.New(j) // a second, independent Claimer: no shared in-memory state
	if err != nil {
		t.Fatalf("second lease.New: %v", err)
	}
	claimers := []lease.Claimer{cA, cB}

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
				claims[r], errs[r] = claimers[r].ClaimJob(ctx, jobID, fmt.Sprintf("runner-%c", 'a'+r), 90*time.Second)
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
				// Both Claimers must agree: the winner's token is live in the other one too.
				for _, c := range claimers {
					if err := c.Check(ctx, jobID, claims[r].Token); err != nil {
						t.Fatalf("race %d: the winner's token fails Check: %v", i, err)
					}
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

	// One forced conflict, so the loser's path runs on every run and not only when the scheduler
	// interleaves: runner-b's claim commits after runner-c has read the free head and before its
	// Append lands. runner-c's Append is then refused with ErrSeqConflict, and the claim must go
	// to runner-b alone.
	cut := &cutIn{Journal: j}
	cC, err := lease.New(cut)
	if err != nil {
		t.Fatalf("lease.New over the cut-in Journal: %v", err)
	}
	var b lease.Claim
	var errB error
	cut.before = func() { b, errB = cB.ClaimJob(ctx, "job_forced", "runner-b", 90*time.Second) }
	c, errC := cC.ClaimJob(ctx, "job_forced", "runner-c", 90*time.Second)
	if cut.before != nil {
		t.Fatalf("ClaimJob never appended through the Journal it was given; the conflict was not forced")
	}
	if errB != nil {
		t.Fatalf("forced conflict: runner-b's claim: %v", errB)
	}
	if !errors.Is(errC, lease.ErrHeld) {
		t.Fatalf("forced conflict: runner-c got token %d, err=%v; want ErrHeld (a seq conflict is not a win)", c.Token, errC)
	}
	for _, cl := range claimers {
		if err := cl.Check(ctx, "job_forced", b.Token); err != nil {
			t.Fatalf("forced conflict: runner-b's token fails Check: %v", err)
		}
	}
}

// cutIn is a Journal whose next Append first runs before: a competing transition that commits
// between the caller's read of the head and its own Append.
type cutIn struct {
	journal.Journal
	before func()
}

func (c *cutIn) Append(ctx context.Context, p journal.Proposal) (journal.Event, error) {
	if f := c.before; f != nil {
		c.before = nil
		f()
	}
	return c.Journal.Append(ctx, p)
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
	// Expired with nobody reclaiming: the token is dead by its ttl alone, not by a newer claim.
	if err := c.Check(ctx, "job_ttl", a.Token); !errors.Is(err, lease.ErrStaleToken) {
		t.Fatalf("Check(token a, expired, not reclaimed): %v, want ErrStaleToken", err)
	}
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
	// A different OS process opens the same file: no package-level state can carry the claim.
	cmd := exec.Command(os.Args[0], "-test.run=^$")
	cmd.Env = append(os.Environ(), fmt.Sprintf("%s=%s|%s|%d", claimChildEnv, path, "job_durable", a.Token))
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("claim child: %v", err)
	}
	if got := strings.TrimSpace(string(out)); got != "held live" {
		t.Fatalf("second process: %q, want \"held live\" (the claim row and its token live in the Journal)", got)
	}
}
