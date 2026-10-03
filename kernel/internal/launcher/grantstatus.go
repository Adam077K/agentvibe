// B1-08d: the real GrantStatus. This file is the CONTRACT the job implements. It is not registered
// in build/done-tests/B1-08d.yml; the done-test that freezes it is grantstatus_donetest_test.go.
//
// Where the grant's status lives (09a §4.2 and §8.5): launcher_grant is a Constitution record, a
// signed versioned file; its release reaches the Journal as a policy.released event carrying the
// file digest, and a revocation is an authority transition, whose canonical store is the Journal.
// So the status is the GrantStream of the Kernel's main Journal, read at every Live(). Verifying the
// founder signature on the record is upstream of this type (Grant's doc comment).
package launcher

import (
	"context"
	"errors"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// GrantStream is the Journal stream holding the launcher_grant's releases and revocations.
const GrantStream = "policy:launcher_grant"

// errGrantNotImplemented is the stub's refusal until B1-08d lands.
var errGrantNotImplemented = errors.New("launcher: grant status not implemented")

// ReleaseGrant journals the release of the launcher_grant record whose file digest is digest
// ("sha256:" + 64 lowercase hex), live until until. A later release supersedes an earlier one.
func ReleaseGrant(ctx context.Context, j journal.Journal, digest string, until time.Time) error {
	return errGrantNotImplemented
}

// RevokeGrant journals the revocation of the released record digest; it binds the next Live().
func RevokeGrant(ctx context.Context, j journal.Journal, digest string) error {
	return errGrantNotImplemented
}

// NewGrantStatus returns the status of the grant whose record digest the launcher holds. Live()
// reads GrantStream at every call and returns nil only when its latest transition releases exactly
// digest, unrevoked, and now() is before that release's until. Anything else, including a stream it
// cannot read or cannot parse, is an error: it fails closed.
func NewGrantStatus(j journal.Journal, digest string, now func() time.Time) (GrantStatus, error) {
	return nil, errGrantNotImplemented
}
