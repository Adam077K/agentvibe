// B1-08d: the launcher's lease store, the real launcher.LeaseVerifier (09a §6 table: the job://
// verifier is "the launcher's claim row"; §8.5 per_launch_requires: "fenced lease on job://<id>").
// It is not registered in build/done-tests/B1-08d.yml; the done-tests that freeze it are
// launch_donetest_test.go and launch_r2_donetest_test.go.
//
// The fenced lease the launcher is handed is a job:// Claim this package issued (lease.go), rendered
// by FencedLease. Verify and Consume read the job's claim rows in the Journal at every call; nothing
// is cached. Consume is a compare-and-set in the Journal: of every Consume of one (job, token), on
// every LaunchVerifier over that Journal, exactly one succeeds, and that survives a restart.
// Ruling Q3 (2026-10-03): only the job:// claim admits a launch; a Coordinator lease (fence.go) on
// job://<id>, wound-wait or not, is refused: that resource's claim rows are the job's lease stream
// (Stream), which a Coordinator never writes.
//
// Where consumption lives. A consumption is a lease.consumed event appended to the job's own lease
// stream (Stream), with ExpectSeq the seq of the claim it consumes. The claim row is therefore the
// compare-and-set's expected state: a release and re-claim, a second Consume, or any other
// transition that lands first moves the head, and the write fails with ErrSeqConflict. The event
// carries the claim's row, so a consumed claim is still the live claim (it still expires, and its
// runner still Releases it); only a launch is spent.
package lease

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// ErrConsumed: the fenced lease already admitted a launch. A lease admits one launch, ever.
var ErrConsumed = errors.New("lease: fenced lease already consumed")

// ErrBadLease: the string is not the canonical rendering (FencedLease) of a token for this job.
var ErrBadLease = errors.New("lease: not a canonical fenced lease for this job")

// TypeConsumed (review r1, 2026-10-03) is the event type of a consumption in the job's own lease
// stream (Stream), appended with ExpectSeq the seq of the claim it consumes and carrying that
// claim's row unchanged. A consumed claim is still the live claim: ClaimJob is ErrHeld and Check
// passes until it expires or is released. A lease.consumed head that is not exactly that (another
// row, another token, a second consumption, a consumption after a release) is ErrCorrupt on every
// operation; a transition that commits while one is being read is never ErrCorrupt.
const TypeConsumed = "lease.consumed"

// LaunchVerifier is launcher.LeaseVerifier, backed by the job:// claim rows.
type LaunchVerifier interface {
	// Verify returns nil iff lease is FencedLease of a Claim this package issued for jobID, and
	// that claim is the job's current live claim at now and has not been consumed. Verify never
	// consumes. A lease whose token is not the job's current live token (released, re-claimed,
	// expired) wraps ErrStaleToken; one already consumed wraps ErrConsumed; one that is not the
	// canonical rendering wraps ErrBadLease. It reads the Journal at every call: a read error is
	// an error, never a last-known-good answer.
	Verify(jobID, lease string, now time.Time) error
	// Consume is Verify at the LaunchVerifier's own clock, then an atomic compare-and-set in the
	// Journal that records the parsed (jobID, token) consumed. A second Consume of the same lease
	// wraps ErrConsumed. Consuming does not end the claim: its runner still Releases it.
	//
	// Ruling 2026-10-03 (red-team r1): the compare-and-set is conditioned on the job's CURRENT
	// claim, not only on the consumption record. A release and re-claim that lands between
	// Consume's read and its write must make the write fail and the stale token stay unconsumed
	// (ErrStaleToken), so the CAS's expected state names the claim row the read saw. A failed
	// Append is an error, never success.
	Consume(jobID, lease string) error
}

// FencedLease renders c as the launcher's Prerequisites.FencedLease, canonically:
// "job://" + JobID + "#" + the token in decimal, with no sign and no leading zero (ruling
// 2026-10-03, red-team r1). Only this exact rendering verifies; "#01" or "#+1" never does.
func FencedLease(c Claim) string {
	return resource(c.JobID) + "#" + strconv.FormatUint(c.Token, 10)
}

// NewLaunchVerifier returns the LaunchVerifier over the job:// claim rows in j; now is the clock
// Consume judges expiry by.
func NewLaunchVerifier(j journal.Journal, now func() time.Time) (LaunchVerifier, error) {
	if j == nil {
		return nil, errors.New("lease: nil journal")
	}
	if now == nil {
		return nil, errors.New("lease: nil clock")
	}
	return &launchVerifier{c: &claimer{j: j, now: now}}, nil
}

type launchVerifier struct{ c *claimer }

// parseLease returns the fencing token jobID's lease names. Only FencedLease's own rendering
// parses: the token is re-rendered and must equal what was presented, so a sign, a leading zero,
// a space or any case variant is refused, and so is token 0, which no claim ever carries.
func parseLease(jobID, lease string) (uint64, error) {
	if err := validJobID(jobID); err != nil {
		return 0, err
	}
	digits, ok := strings.CutPrefix(lease, resource(jobID)+"#")
	if !ok {
		return 0, fmt.Errorf("%w: %q is not %q plus a token", ErrBadLease, lease, resource(jobID)+"#")
	}
	tok, err := strconv.ParseUint(digits, 10, 64)
	if err != nil || tok == 0 || strconv.FormatUint(tok, 10) != digits {
		return 0, fmt.Errorf("%w: token %q is not a canonical decimal", ErrBadLease, digits)
	}
	return tok, nil
}

// current is the job's claim row at now if it is live, holds token and is unconsumed; otherwise
// the reason it is not.
func (v *launchVerifier) current(ctx context.Context, jobID string, token uint64, now time.Time) (state, error) {
	// A zero clock, or one past the int64 Unix-nanosecond range, has no meaningful UnixNano: refuse.
	if now.IsZero() || !time.Unix(0, now.UnixNano()).Equal(now) {
		return state{}, fmt.Errorf("lease: clock %v is zero or outside the representable range", now)
	}
	st, err := v.c.load(ctx, jobID)
	if err != nil {
		return state{}, err
	}
	if !st.live(now) || st.row.Token != token {
		return state{}, stale(jobID, token, st)
	}
	if st.consumed {
		return state{}, fmt.Errorf("%w: %s token %d", ErrConsumed, resource(jobID), token)
	}
	return st, nil
}

func (v *launchVerifier) Verify(jobID, lease string, now time.Time) error {
	token, err := parseLease(jobID, lease)
	if err != nil {
		return err
	}
	_, err = v.current(context.Background(), jobID, token, now)
	return err
}

func (v *launchVerifier) Consume(jobID, lease string) error {
	token, err := parseLease(jobID, lease)
	if err != nil {
		return err
	}
	ctx := context.Background()
	for attempt := 0; attempt < maxAttempts; attempt++ {
		st, err := v.current(ctx, jobID, token, v.c.now())
		if err != nil {
			return err
		}
		data, err := json.Marshal(st.row)
		if err != nil {
			return err
		}
		ev, err := v.c.j.Append(ctx, journal.Proposal{Stream: Stream(jobID), ExpectSeq: st.seq, Type: TypeConsumed, Data: data})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue // another transition committed first: re-read and decide again
		}
		if err != nil {
			return fmt.Errorf("lease: consume %s: %w", FencedLease(Claim{JobID: jobID, Token: token}), err)
		}
		if ev.Seq != st.seq+1 {
			return fmt.Errorf("%w: consumption appended at seq %d, want %d", ErrCorrupt, ev.Seq, st.seq+1)
		}
		return nil
	}
	return fmt.Errorf("lease: consume %s: gave up after %d contended attempts", resource(jobID), maxAttempts)
}

// checkConsumed verifies that ev, a lease.consumed head carrying r, is exactly the consumption of
// the claim written at seq r.Token directly before it: the same row, and no event between them.
// Events after ev may exist (a transition can commit between load's Head and this Read); they are
// not this check's business.
func (c *claimer) checkConsumed(ctx context.Context, stream string, ev journal.Event, r row) error {
	if r.Runner == "" || r.Token == 0 || r.Token+1 != ev.Seq {
		return fmt.Errorf("%w: %s seq %d consumes token %d", ErrCorrupt, stream, ev.Seq, r.Token)
	}
	evs, err := c.j.Read(ctx, stream, r.Token)
	if err != nil {
		return fmt.Errorf("lease: read %s: %w", stream, err)
	}
	if len(evs) < 2 || evs[0].Seq != r.Token || evs[0].Type != TypeClaimed || evs[1].Seq != ev.Seq {
		return fmt.Errorf("%w: %s seq %d is not the consumption of the claim at seq %d", ErrCorrupt, stream, ev.Seq, r.Token)
	}
	var claim row
	if err := json.Unmarshal(evs[0].Data, &claim); err != nil || claim != r {
		return fmt.Errorf("%w: %s seq %d differs from the claim it consumes", ErrCorrupt, stream, ev.Seq)
	}
	return nil
}
