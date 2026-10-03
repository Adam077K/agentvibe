// B1-08d: the launcher's lease store, the real launcher.LeaseVerifier (09a §6 table: the job://
// verifier is "the launcher's claim row"; §8.5 per_launch_requires: "fenced lease on job://<id>").
// This file is the CONTRACT the job implements. It is not registered in build/done-tests/B1-08d.yml;
// the done-test that freezes it is launch_donetest_test.go.
//
// The fenced lease the launcher is handed is a job:// Claim this package issued (lease.go), rendered
// by FencedLease. Verify and Consume read the job's claim rows in the Journal at every call; nothing
// is cached. Consume is a compare-and-set in the Journal: of every Consume of one (job, token), on
// every LaunchVerifier over that Journal, exactly one succeeds, and that survives a restart.
package lease

import (
	"errors"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// ErrConsumed: the fenced lease already admitted a launch. A lease admits one launch, ever.
var ErrConsumed = errors.New("lease: fenced lease already consumed")

// LaunchVerifier is launcher.LeaseVerifier, backed by the job:// claim rows.
type LaunchVerifier interface {
	// Verify returns nil iff lease is FencedLease of a Claim this package issued for jobID, and
	// that claim is the job's current live claim at now. Verify never consumes.
	Verify(jobID, lease string, now time.Time) error
	// Consume is Verify at the LaunchVerifier's own clock, then an atomic compare-and-set in the
	// Journal that records (jobID, token) consumed. A second Consume of the same lease wraps
	// ErrConsumed. Consuming does not end the claim: its runner still Releases it.
	Consume(jobID, lease string) error
}

// FencedLease renders c as the launcher's Prerequisites.FencedLease: "job://<id>" plus its
// fencing token. The encoding is the implementer's; it must name the job unambiguously.
func FencedLease(c Claim) string {
	return ""
}

// NewLaunchVerifier returns the LaunchVerifier over the job:// claim rows in j; now is the clock
// Consume judges expiry by.
func NewLaunchVerifier(j journal.Journal, now func() time.Time) (LaunchVerifier, error) {
	return nil, ErrNotImplemented
}
