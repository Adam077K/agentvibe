// B1-08d: the launcher's lease store, the real launcher.LeaseVerifier (09a §6 table: the job://
// verifier is "the launcher's claim row"; §8.5 per_launch_requires: "fenced lease on job://<id>").
// This file is the CONTRACT the job implements. It is not registered in build/done-tests/B1-08d.yml;
// the done-test that freezes it is launch_donetest_test.go.
//
// The fenced lease the launcher is handed is a job:// Claim this package issued (lease.go), rendered
// by FencedLease. Verify and Consume read the job's claim rows in the Journal at every call; nothing
// is cached. Consume is a compare-and-set in the Journal: of every Consume of one (job, token), on
// every LaunchVerifier over that Journal, exactly one succeeds, and that survives a restart.
// Ruling Q3 (2026-10-03): only the job:// claim admits a launch; a Coordinator lease (fence.go) on
// job://<id>, wound-wait or not, is refused.
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
	// that claim is the job's current live claim at now. Verify never consumes. A lease whose token
	// is not the job's current live token (released, re-claimed, expired) wraps ErrStaleToken; a
	// lease that is not the canonical rendering is refused. It reads the Journal at every call: a
	// read error is an error, never a last-known-good answer.
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
	return ""
}

// NewLaunchVerifier returns the LaunchVerifier over the job:// claim rows in j; now is the clock
// Consume judges expiry by.
func NewLaunchVerifier(j journal.Journal, now func() time.Time) (LaunchVerifier, error) {
	return nil, ErrNotImplemented
}
