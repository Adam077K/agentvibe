// Package lease holds the Kernel's fenced leases (docs/vision-v3/09a-ENGINEERING.md §6).
//
// B1-05 implements exactly one lease kind: the launcher's exclusive claim on job://<id>. The claim
// row IS the storage verifier for job:// (09a §6 table: "the launcher's claim row"): each job's
// claims live in one Journal stream, a claim's fencing token is the Journal seq of the event that
// granted it, and every transition is an Append with ExpectSeq = the stream head. Two Claimers that
// read the same free head both propose seq N+1; the Journal's optimistic concurrency admits one and
// refuses the other with ErrSeqConflict, so the claim is decided in storage and never in a
// Claimer's memory. Nothing here caches state between calls.
//
// Out of scope here. B1-04's plan row ("leases + storage fencing": all-or-nothing, wound-wait,
// deadlock detector, hot resources, storage verifiers) owns multi-resource all-or-nothing
// acquisition, wound-wait, the wait-for-graph deadlock detector, hot resources, and the storage
// verifiers for repo://, db://, effect://, budget:// and brain://. Renew/heartbeat, shared mode and
// max_wait/lease.starved are named in 09a §6 but owned by NO plan row; they are listed as a
// follow-up in BUILD-LOG. Until renew exists a claim simply expires at its ttl.
//
// Release authenticates the holder by runner name plus token. That is a guard against a confused
// runner, not against a hostile one: runner names are not secrets. Caller identity is the command
// socket's job (09a §4.1, B1-03).
package lease

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"time"
	"unicode/utf8"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// ErrNotImplemented was returned by New before B1-05 landed. Nothing returns it now; it stays so
// the frozen contract's exported surface does not shrink.
var ErrNotImplemented = errors.New("lease: not implemented")

// ErrHeld: the job is claimed by a live lease another runner holds. Nothing is written.
var ErrHeld = errors.New("lease: job already claimed")

// ErrStaleToken: a fencing token is not the job's current live token (09a §6: the launcher's
// claim row refuses a stale token).
var ErrStaleToken = errors.New("lease: stale fencing token")

// ErrCorrupt: a lease stream's head event is not a claim row this package wrote. Every operation
// on that job fails closed rather than guessing who holds it.
var ErrCorrupt = errors.New("lease: unreadable claim row")

// ErrNotHolder: a Release presented the live token but a runner other than the claim's holder.
// Nothing is written.
var ErrNotHolder = errors.New("lease: runner does not hold the claim")

// Claim is a fenced, exclusive lease on job://<JobID>.
type Claim struct {
	JobID     string
	Resource  string // always "job://" + JobID
	Runner    string
	Token     uint64 // fencing token; strictly increases across successive claims of one job
	ExpiresAt time.Time
}

// Claimer is the launcher's job claim (09a §6: "a fenced lease on job://<id>"). It is safe for
// concurrent use; two runners racing one job produce exactly one winner.
type Claimer interface {
	// ClaimJob claims job://jobID for runner for ttl, or returns an error wrapping ErrHeld.
	ClaimJob(ctx context.Context, jobID, runner string, ttl time.Duration) (Claim, error)
	// Release ends c; releasing with a stale token returns an error wrapping ErrStaleToken.
	Release(ctx context.Context, c Claim) error
	// Check returns nil iff token is the job's current live token, else wraps ErrStaleToken.
	Check(ctx context.Context, jobID string, token uint64) error
}

// Event types written to a job's lease stream.
const (
	TypeClaimed  = "lease.claimed"
	TypeReleased = "lease.released"
)

// maxAttempts bounds the optimistic retry loop. Each ErrSeqConflict means another transition
// committed, so a retry reads a strictly newer head; the bound only stops a livelock spinning
// forever.
const maxAttempts = 64

// New returns the Claimer whose claim rows live in j, the canonical store for leases (09a §4.2).
func New(j journal.Journal) (Claimer, error) {
	if j == nil {
		return nil, errors.New("lease: nil journal")
	}
	return &claimer{j: j, now: time.Now}, nil
}

type claimer struct {
	j   journal.Journal
	now func() time.Time
}

// row is the data of a lease.claimed or lease.released event.
type row struct {
	Resource  string `json:"resource"`
	Runner    string `json:"runner,omitempty"`
	Token     uint64 `json:"token"`
	ExpiresAt int64  `json:"expires_at_unix_nano,omitempty"`
}

// state is the job's claim row as its stream head records it.
type state struct {
	seq     uint64 // stream head seq: the ExpectSeq of the next transition
	claimed bool   // the head is a lease.claimed event
	row     row
}

func resource(jobID string) string { return "job://" + jobID }

// Stream returns the Journal stream holding job://jobID's claim rows.
func Stream(jobID string) string { return "lease:" + resource(jobID) }

// validText refuses a string that is not valid UTF-8. json.Marshal would silently rewrite its
// invalid bytes to U+FFFD, so the stored row would no longer match the id it was written for and
// every later load of that job would fail ErrCorrupt.
func validText(what, s string) error {
	if s == "" {
		return fmt.Errorf("lease: empty %s", what)
	}
	if !utf8.ValidString(s) {
		return fmt.Errorf("lease: %s %q is not valid UTF-8", what, s)
	}
	return nil
}

func validJobID(jobID string) error {
	if err := validText("job id", jobID); err != nil {
		return err
	}
	for _, r := range jobID {
		if r < 0x21 || r == 0x7f || r == '/' {
			return fmt.Errorf("lease: job id %q contains a forbidden character", jobID)
		}
	}
	return nil
}

// load reads the head event of the job's lease stream. Only the head matters: a claim is live iff
// the head is lease.claimed and unexpired, and its token is the head's seq.
func (c *claimer) load(ctx context.Context, jobID string) (state, error) {
	stream := Stream(jobID)
	seq, _, err := c.j.Head(ctx, stream)
	if err != nil {
		return state{}, fmt.Errorf("lease: head %s: %w", stream, err)
	}
	if seq == 0 {
		return state{}, nil
	}
	evs, err := c.j.Read(ctx, stream, seq)
	if err != nil {
		return state{}, fmt.Errorf("lease: read %s: %w", stream, err)
	}
	if len(evs) == 0 || evs[0].Seq != seq {
		return state{}, fmt.Errorf("%w: %s head seq %d not readable", ErrCorrupt, stream, seq)
	}
	ev := evs[0]
	var r row
	if err := json.Unmarshal(ev.Data, &r); err != nil {
		return state{}, fmt.Errorf("%w: %s seq %d: %v", ErrCorrupt, stream, seq, err)
	}
	if r.Resource != resource(jobID) {
		return state{}, fmt.Errorf("%w: %s seq %d names resource %q", ErrCorrupt, stream, seq, r.Resource)
	}
	switch ev.Type {
	case TypeClaimed:
		if r.Token != ev.Seq || r.Runner == "" {
			return state{}, fmt.Errorf("%w: %s seq %d carries token %d runner %q", ErrCorrupt, stream, seq, r.Token, r.Runner)
		}
		return state{seq: seq, claimed: true, row: r}, nil
	case TypeReleased:
		return state{seq: seq, row: r}, nil
	default:
		return state{}, fmt.Errorf("%w: %s seq %d has type %q", ErrCorrupt, stream, seq, ev.Type)
	}
}

// live reports whether st holds an unexpired claim at now.
func (st state) live(now time.Time) bool {
	return st.claimed && now.UnixNano() < st.row.ExpiresAt
}

func (c *claimer) ClaimJob(ctx context.Context, jobID, runner string, ttl time.Duration) (Claim, error) {
	if err := validJobID(jobID); err != nil {
		return Claim{}, err
	}
	if err := validText("runner", runner); err != nil {
		return Claim{}, err
	}
	if ttl <= 0 {
		return Claim{}, fmt.Errorf("lease: ttl %v must be positive", ttl)
	}
	// The expiry is stored as int64 Unix nanoseconds; a ttl past that range would wrap negative
	// and the claim would be born expired.
	if now := c.now().UnixNano(); now < 0 || int64(ttl) > math.MaxInt64-now {
		return Claim{}, fmt.Errorf("lease: ttl %v overflows the expiry", ttl)
	}
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return Claim{}, err
		}
		st, err := c.load(ctx, jobID)
		if err != nil {
			return Claim{}, err
		}
		now := c.now()
		if st.live(now) {
			return Claim{}, fmt.Errorf("%w: %s held by %s (token %d) until %s", ErrHeld, resource(jobID),
				st.row.Runner, st.row.Token, time.Unix(0, st.row.ExpiresAt).UTC().Format(time.RFC3339Nano))
		}
		// Never claimed, released, or expired: propose the next seq. That seq is the new fencing
		// token, so it is strictly greater than every token this job has issued.
		tok := st.seq + 1
		exp := now.Add(ttl).UnixNano()
		data, err := json.Marshal(row{Resource: resource(jobID), Runner: runner, Token: tok, ExpiresAt: exp})
		if err != nil {
			return Claim{}, err
		}
		ev, err := c.j.Append(ctx, journal.Proposal{Stream: Stream(jobID), ExpectSeq: st.seq, Type: TypeClaimed, Data: data})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue // another transition committed first: re-read and decide again
		}
		if err != nil {
			return Claim{}, fmt.Errorf("lease: claim %s: %w", resource(jobID), err)
		}
		if ev.Seq != tok {
			return Claim{}, fmt.Errorf("%w: claim appended at seq %d, want %d", ErrCorrupt, ev.Seq, tok)
		}
		return Claim{JobID: jobID, Resource: resource(jobID), Runner: runner, Token: tok, ExpiresAt: time.Unix(0, exp)}, nil
	}
	return Claim{}, fmt.Errorf("lease: claim %s: gave up after %d contended attempts", resource(jobID), maxAttempts)
}

// stale explains why token is not st's live token.
func stale(jobID string, token uint64, st state) error {
	switch {
	case st.seq == 0:
		return fmt.Errorf("%w: %s has never been claimed (token %d)", ErrStaleToken, resource(jobID), token)
	case !st.claimed:
		return fmt.Errorf("%w: %s released at seq %d (token %d)", ErrStaleToken, resource(jobID), st.seq, token)
	case st.row.Token != token:
		return fmt.Errorf("%w: %s current token %d, presented %d", ErrStaleToken, resource(jobID), st.row.Token, token)
	default:
		return fmt.Errorf("%w: %s token %d expired at %s", ErrStaleToken, resource(jobID), token,
			time.Unix(0, st.row.ExpiresAt).UTC().Format(time.RFC3339Nano))
	}
}

func (c *claimer) Check(ctx context.Context, jobID string, token uint64) error {
	if err := validJobID(jobID); err != nil {
		return err
	}
	st, err := c.load(ctx, jobID)
	if err != nil {
		return err
	}
	if st.live(c.now()) && st.row.Token == token {
		return nil
	}
	return stale(jobID, token, st)
}

func (c *claimer) Release(ctx context.Context, cl Claim) error {
	if err := validJobID(cl.JobID); err != nil {
		return err
	}
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		st, err := c.load(ctx, cl.JobID)
		if err != nil {
			return err
		}
		if !st.live(c.now()) || st.row.Token != cl.Token {
			return stale(cl.JobID, cl.Token, st)
		}
		if cl.Runner != st.row.Runner {
			return fmt.Errorf("%w: %s token %d is held by %q, release presented by %q", ErrNotHolder,
				resource(cl.JobID), cl.Token, st.row.Runner, cl.Runner)
		}
		data, err := json.Marshal(row{Resource: resource(cl.JobID), Runner: st.row.Runner, Token: cl.Token})
		if err != nil {
			return err
		}
		_, err = c.j.Append(ctx, journal.Proposal{Stream: Stream(cl.JobID), ExpectSeq: st.seq, Type: TypeReleased, Data: data})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return fmt.Errorf("lease: release %s: %w", resource(cl.JobID), err)
		}
		return nil
	}
	return fmt.Errorf("lease: release %s: gave up after %d contended attempts", resource(cl.JobID), maxAttempts)
}
