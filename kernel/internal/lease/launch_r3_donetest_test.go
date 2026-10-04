//go:build donetest

// B1-08d done-tests, round 3: "2026-10-03 review r1 gaps". The review of 40ee162 (SHIP, with a
// test gap) asked for the claim semantics of a consumed claim to be pinned, not left to the
// implementation:
//
//	V1 Exclusivity: ClaimJob while a consumed claim is live is ErrHeld.
//	V2 Check on a consumed, live claim is nil: a launched worker's effects are fenced, not refused.
//	V3 A corrupt or forged lease.consumed head is ErrCorrupt on Check, Verify and ClaimJob: a row
//	   with an extended expiry, a token mismatch, a second consumption, a consumption after release.
//	V4 The read window: a transition that commits between a reader's Head and its Read is never
//	   ErrCorrupt. Check racing the holder's Release is ErrStaleToken; the loser of two ClaimJobs on
//	   an expired consumed claim is ErrHeld. A deterministic Read hook places the transition.
//
// Run: go -C kernel test -count=1 -tags donetest -run B1_08d ./internal/lease/
package lease_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

// d8Consumed is a live claim on job, consumed through the real LaunchVerifier.
func d8Consumed(t *testing.T, j journal.Journal, job string, ttl time.Duration) (lease.Claimer, lease.Claim) {
	t.Helper()
	cl := d8Claimer(t, j)
	c := d8Claim(t, cl, job, "runner-a", ttl)
	if err := d8Verifier(t, j, time.Now).Consume(job, d8Lease(t, c)); err != nil {
		t.Fatalf("Consume(%s): %v", job, err)
	}
	return cl, c
}

// TestB1_08d_R3_ConsumedClaimIsHeld: V1.
func TestB1_08d_R3_ConsumedClaimIsHeld(t *testing.T) {
	ctx := context.Background()
	j, _ := d8Open(t)
	cl, c := d8Consumed(t, j, "job-held", time.Hour)
	if _, err := cl.ClaimJob(ctx, "job-held", "runner-b", time.Hour); !errors.Is(err, lease.ErrHeld) {
		t.Errorf("ClaimJob while a consumed claim is live: %v; want ErrHeld", err)
	}
	if _, err := d8Claimer(t, j).ClaimJob(ctx, "job-held", "runner-a", time.Hour); !errors.Is(err, lease.ErrHeld) {
		t.Errorf("ClaimJob by the holder's own runner on a fresh Claimer: %v; want ErrHeld", err)
	}
	if err := cl.Release(ctx, c); err != nil {
		t.Fatalf("Release of the consumed claim: %v", err)
	}
	if _, err := cl.ClaimJob(ctx, "job-held", "runner-b", time.Hour); err != nil {
		t.Errorf("ClaimJob after the consumed claim was released: %v; want nil", err)
	}
}

// TestB1_08d_R3_ConsumedClaimChecks: V2.
func TestB1_08d_R3_ConsumedClaimChecks(t *testing.T) {
	ctx := context.Background()
	j, _ := d8Open(t)
	cl, c := d8Consumed(t, j, "job-chk", time.Hour)
	if err := cl.Check(ctx, "job-chk", c.Token); err != nil {
		t.Errorf("Check of a consumed, live claim: %v; want nil (effects are fenced, not refused)", err)
	}
	if err := d8Claimer(t, j).Check(ctx, "job-chk", c.Token+1); !errors.Is(err, lease.ErrStaleToken) {
		t.Errorf("Check of another token on a consumed claim: %v; want ErrStaleToken", err)
	}
}

// d8Row returns the data of the lease.claimed event that issued c, as a JSON object.
func d8Row(t *testing.T, j journal.Journal, c lease.Claim) map[string]any {
	t.Helper()
	evs, err := j.Read(context.Background(), lease.Stream(c.JobID), c.Token)
	if err != nil || len(evs) == 0 || evs[0].Seq != c.Token || evs[0].Type != lease.TypeClaimed {
		t.Fatalf("the claim event at seq %d: %v, %v", c.Token, evs, err)
	}
	var m map[string]any
	if err := json.Unmarshal(evs[0].Data, &m); err != nil {
		t.Fatal(err)
	}
	return m
}

// d8Forge appends a lease.consumed event carrying m at the head of job's stream.
func d8Forge(t *testing.T, j journal.Journal, job string, m map[string]any) {
	t.Helper()
	ctx := context.Background()
	data, err := json.Marshal(m)
	if err != nil {
		t.Fatal(err)
	}
	head, _, err := j.Head(ctx, lease.Stream(job))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := j.Append(ctx, journal.Proposal{Stream: lease.Stream(job), ExpectSeq: head, Type: lease.TypeConsumed, Data: data}); err != nil {
		t.Fatalf("forge: %v", err)
	}
}

// TestB1_08d_R3_ForgedConsumptionIsCorrupt: V3.
func TestB1_08d_R3_ForgedConsumptionIsCorrupt(t *testing.T) {
	ctx := context.Background()
	for _, tc := range []struct {
		name  string
		forge func(t *testing.T, j journal.Journal, cl lease.Claimer, c lease.Claim)
	}{
		{"a consumption whose row extends the expiry", func(t *testing.T, j journal.Journal, _ lease.Claimer, c lease.Claim) {
			m := d8Row(t, j, c)
			exp, ok := m["expires_at_unix_nano"].(float64)
			if !ok {
				t.Fatalf("claim row has no expires_at_unix_nano: %v", m)
			}
			m["expires_at_unix_nano"] = exp + float64(time.Hour)
			d8Forge(t, j, c.JobID, m)
		}},
		{"a consumption naming another token", func(t *testing.T, j journal.Journal, _ lease.Claimer, c lease.Claim) {
			m := d8Row(t, j, c)
			m["token"] = c.Token + 1
			d8Forge(t, j, c.JobID, m)
		}},
		{"a consumption naming another runner", func(t *testing.T, j journal.Journal, _ lease.Claimer, c lease.Claim) {
			m := d8Row(t, j, c)
			m["runner"] = "runner-z"
			d8Forge(t, j, c.JobID, m)
		}},
		{"a second consumption", func(t *testing.T, j journal.Journal, _ lease.Claimer, c lease.Claim) {
			if err := d8Verifier(t, j, time.Now).Consume(c.JobID, d8Lease(t, c)); err != nil {
				t.Fatalf("real Consume: %v", err)
			}
			d8Forge(t, j, c.JobID, d8Row(t, j, c))
		}},
		{"a consumption after release", func(t *testing.T, j journal.Journal, cl lease.Claimer, c lease.Claim) {
			if err := cl.Release(ctx, c); err != nil {
				t.Fatal(err)
			}
			d8Forge(t, j, c.JobID, d8Row(t, j, c))
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			j, _ := d8Open(t)
			cl := d8Claimer(t, j)
			c := d8Claim(t, cl, "job-forged", "runner-a", time.Hour)
			v := d8Verifier(t, j, time.Now)
			tc.forge(t, j, cl, c)
			if err := cl.Check(ctx, "job-forged", c.Token); !errors.Is(err, lease.ErrCorrupt) {
				t.Errorf("Check: %v; want ErrCorrupt", err)
			}
			if err := v.Verify("job-forged", d8Lease(t, c), time.Now()); !errors.Is(err, lease.ErrCorrupt) {
				t.Errorf("Verify: %v; want ErrCorrupt", err)
			}
			if _, err := d8Claimer(t, j).ClaimJob(ctx, "job-forged", "runner-b", time.Hour); !errors.Is(err, lease.ErrCorrupt) {
				t.Errorf("ClaimJob: %v; want ErrCorrupt", err)
			}
		})
	}
}

// readHook runs fire once, on the underlying Journal, just before the n-th Read of stream through
// it is forwarded (after any Head that preceded it): a transition that commits inside a reader's
// window. Every other call passes straight through.
type readHook struct {
	journal.Journal
	stream string
	n      int
	fire   func()

	mu    sync.Mutex
	reads int
	fired bool
}

func (h *readHook) Read(ctx context.Context, s string, from uint64) ([]journal.Event, error) {
	if s == h.stream {
		h.mu.Lock()
		h.reads++
		run := h.reads == h.n && !h.fired
		if run {
			h.fired = true
		}
		h.mu.Unlock()
		if run {
			h.fire()
		}
	}
	return h.Journal.Read(ctx, s, from)
}

func (h *readHook) didFire() bool { h.mu.Lock(); defer h.mu.Unlock(); return h.fired }

// TestB1_08d_R3_ReadWindowIsNeverCorrupt: V4.
func TestB1_08d_R3_ReadWindowIsNeverCorrupt(t *testing.T) {
	ctx := context.Background()
	for n := 1; n <= 3; n++ {
		t.Run(fmt.Sprintf("Check racing the holder's Release, before Read %d", n), func(t *testing.T) {
			j, _ := d8Open(t)
			holder, c := d8Consumed(t, j, "job-rr", time.Hour)
			h := &readHook{Journal: j, stream: lease.Stream("job-rr"), n: n, fire: func() {
				if err := holder.Release(ctx, c); err != nil {
					t.Errorf("hook Release: %v", err)
				}
			}}
			err := d8Claimer(t, h).Check(ctx, "job-rr", c.Token)
			if n > 1 && !h.didFire() {
				return // this implementation reads fewer times; n == 1 already placed the race
			}
			if errors.Is(err, lease.ErrCorrupt) {
				t.Fatalf("Check with a Release inside its read window: %v; never ErrCorrupt", err)
			}
			switch {
			case n == 1 && !h.didFire():
				t.Fatal("Check never Read the job's stream")
			case n == 1 && !errors.Is(err, lease.ErrStaleToken):
				t.Errorf("Check with the Release committed before its first Read: %v; want ErrStaleToken", err)
			case n > 1 && err != nil && !errors.Is(err, lease.ErrStaleToken):
				t.Errorf("Check with the Release before Read %d: %v; want nil or ErrStaleToken", n, err)
			}
			if err := d8Claimer(t, j).Check(ctx, "job-rr", c.Token); !errors.Is(err, lease.ErrStaleToken) {
				t.Errorf("Check after the race: %v; want ErrStaleToken", err)
			}
		})

		t.Run(fmt.Sprintf("two ClaimJobs on an expired consumed claim, the winner before Read %d", n), func(t *testing.T) {
			j, _ := d8Open(t)
			_, _ = d8Consumed(t, j, "job-cc", 30*time.Millisecond)
			time.Sleep(80 * time.Millisecond) // the consumed claim expires unrenewed
			var won lease.Claim
			h := &readHook{Journal: j, stream: lease.Stream("job-cc"), n: n, fire: func() {
				c, err := d8Claimer(t, j).ClaimJob(ctx, "job-cc", "runner-w", time.Hour)
				if err != nil {
					t.Errorf("hook ClaimJob (the winner): %v", err)
				}
				won = c
			}}
			_, err := d8Claimer(t, h).ClaimJob(ctx, "job-cc", "runner-l", time.Hour)
			if n == 1 && !h.didFire() {
				t.Fatal("ClaimJob never Read the job's stream")
			}
			if !h.didFire() {
				return // this implementation reads fewer times; n == 1 already placed the race
			}
			if !errors.Is(err, lease.ErrHeld) {
				t.Errorf("the loser's ClaimJob: %v; want ErrHeld (never ErrCorrupt)", err)
			}
			if err := d8Claimer(t, j).Check(ctx, "job-cc", won.Token); err != nil {
				t.Errorf("the winner's claim after the race: %v; want live", err)
			}
		})
	}
}
