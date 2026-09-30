// Package lease holds the Kernel's fenced leases (docs/vision-v3/09a-ENGINEERING.md §6).
//
// B0-17a freezes only the job:// claim contract, so that B1-05's done-test ("1,000 two-runner
// races → 0 double claims") exists before the lease does. New returns ErrNotImplemented until
// B1-05 lands; nothing here holds logic.
package lease

import (
	"context"
	"errors"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// ErrNotImplemented is returned until B1-05 implements the claim lease.
var ErrNotImplemented = errors.New("lease: not implemented")

// ErrHeld: the job is claimed by a live lease another runner holds. Nothing is written.
var ErrHeld = errors.New("lease: job already claimed")

// ErrStaleToken: a fencing token is not the job's current live token (09a §6: the launcher's
// claim row refuses a stale token).
var ErrStaleToken = errors.New("lease: stale fencing token")

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

// New returns the Claimer whose claim rows live in j, the canonical store for leases (09a §4.2).
func New(j journal.Journal) (Claimer, error) {
	return nil, ErrNotImplemented
}
