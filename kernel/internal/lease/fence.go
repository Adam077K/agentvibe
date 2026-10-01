// B1-04: multi-resource leases and storage fencing (docs/vision-v3/09a-ENGINEERING.md §6;
// docs/vision-v3/14-BUILD-PLAN.md §6 row B1-04). This file is the CONTRACT the job implements. It is
// not registered in build/done-tests/B1-04.yml; the done-test that freezes it is
// fence_donetest_test.go. Both constructors return ErrNotImplemented until B1-04 lands.
//
// What B1-04 owns here, and B1-05 (lease.go, the job:// claim) does not: a request for SEVERAL
// resources granted all-or-nothing; wound-wait ordering between missions; the wait-for-graph
// deadlock detector; and the repo:// storage verifier (the pre-receive hook of SP2, which recomputes
// what a write touched and refuses a stale token or a resource no presented lease covers).
//
// Not frozen by the done-test, and so still open for the implementer and the reviewer: renew and
// heartbeat, shared mode, max_wait and lease.starved (09a §6 names them; no register row owns them,
// see lease.go), hot-resource auto-addition and the three-cycles-a-week proposal, whether a glob
// lease and a file#symbol lease under it conflict, a request naming a resource its job already
// holds, ties in Born, whether the verifier also refuses an expired-but-unreclaimed token, and the
// db://, effect://, budget:// and brain:// verifiers.
package lease

import (
	"context"
	"errors"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
)

// ErrWait: a requested resource has a live lease held by another job. NOTHING was granted, and the
// request is recorded as that job's outstanding wait (an edge of the wait-for graph).
var ErrWait = errors.New("lease: resource held by another job; nothing granted, request waits")

// ErrUndeclared: a write touched a resource that no lease presented with the write covers
// (09a §6 storage verifiers: "touched ≠ declared → refused").
var ErrUndeclared = errors.New("lease: touched resource not covered by a presented lease")

// Policy is request_leases.policy (09a §2 KernelCommand, §6 lease_request).
type Policy string

const (
	// AllOrNothing grants every requested resource in one atomic transition, or none.
	AllOrNothing Policy = "all_or_nothing"
	// WoundWait is AllOrNothing plus age: an older mission revokes a younger holder's lease
	// (its token goes stale); a younger mission waits for an older holder.
	WoundWait Policy = "wound_wait"
)

// TypeDeadlockBroken is the type of the event Detect journals for each cycle it breaks. Its data
// names the victim job.
const TypeDeadlockBroken = "lease.deadlock_broken"

// Request is one request_leases command.
type Request struct {
	Job string
	// Born is the mission's age: earlier is older. Wound-wait and the deadlock detector order
	// missions by Born and never by job id or by arrival order. A job uses one Born for all of its
	// requests.
	Born time.Time
	// Resources are ResourceUris ("repo://beacon/src/billing/**", "repo://beacon/src/config.ts#<header>",
	// "budget://beacon/2026-10"): non-empty, no duplicates.
	Resources []string
	Policy    Policy
	TTL       time.Duration
}

// Grant is a satisfied Request: one fencing token per requested resource, all issued together.
type Grant struct {
	Job       string
	Tokens    map[string]uint64
	ExpiresAt time.Time
}

// Lease is one live lease as storage records it.
type Lease struct {
	Resource  string
	Job       string
	Token     uint64
	ExpiresAt time.Time
}

// Break is one wait-for cycle Detect broke.
type Break struct {
	Victim string   // the youngest mission (latest Born) in the cycle
	Cycle  []string // the jobs in the cycle
}

// Coordinator grants multi-resource leases. Its state lives in the Journal, never only in its own
// memory: two Coordinators over one Journal see one set of leases, and a Verifier built from the
// same Journal sees the tokens the Coordinators issued.
type Coordinator interface {
	// Acquire grants all of req.Resources or none of them.
	//
	// A resource is busy when another job holds a live lease on it (expired leases are free, judged
	// by the injected clock). AllOrNothing: if any is busy, nothing is granted, req becomes the job's
	// outstanding wait (replacing any earlier one) and the error wraps ErrWait. WoundWait: if every
	// busy holder is younger than req.Born, their leases on the requested resources are revoked and
	// the request is granted; if any busy holder is older, it behaves as AllOrNothing and wounds
	// nobody. On a grant every token is strictly greater than every token previously issued for that
	// resource, the job's outstanding wait is cleared, and no observer — another Coordinator, a
	// Verifier, a reader of the Journal — ever sees part of the request granted.
	Acquire(ctx context.Context, req Request) (Grant, error)
	// Release ends every lease job holds and drops its outstanding wait. A job holding nothing is a
	// no-op.
	Release(ctx context.Context, job string) error
	// Holder returns the live lease on resource, if there is one.
	Holder(ctx context.Context, resource string) (Lease, bool, error)
	// Waiting returns the resources of job's outstanding wait, if it has one. It is the only way
	// to see that Release dropped a wait: a released job holds nothing, so no cycle can pass
	// through it, and its next grant clears the wait anyway.
	Waiting(ctx context.Context, job string) ([]string, bool, error)
	// Detect builds the wait-for graph (each outstanding wait → the live holders of its busy
	// resources), breaks every cycle at the youngest mission in that cycle — revoking every lease the
	// victim holds and dropping its wait — journals one TypeDeadlockBroken event per break, and
	// returns the breaks. A wait that is not on a cycle is never broken.
	Detect(ctx context.Context) ([]Break, error)
}

// NewCoordinator returns the Coordinator whose leases live in j; now is its clock.
func NewCoordinator(j journal.Journal, now func() time.Time) (Coordinator, error) {
	return nil, ErrNotImplemented
}

// Push is one write arriving at repo:// storage: the SP2 pre-receive hook's input.
type Push struct {
	Job    string            // the Lease-Holder trailer
	Tokens map[string]uint64 // the Lease-Tokens trailer: presented resource → token
	// Touched is what storage recomputed from the pushed diff (file#symbol resources), not what the
	// pusher declared.
	Touched []string
}

// Verifier is a storage-side fence. It does not trust the pusher and does not ask a Coordinator.
type Verifier interface {
	// Receive accepts p or refuses it. Each touched resource must be covered by a presented
	// resource, else ErrUndeclared; and the presented token for that covering resource must be the
	// token storage currently records for it, issued to p.Job, else ErrStaleToken. A released or
	// revoked lease has no current token for its former holder. A presented resource covers a touched
	// one when the two are equal, or when the presented one ends in "/**" and the touched one starts
	// with everything before the "**". Refusal names every refused touched resource and no touched
	// resource it would have accepted (so it does not echo the push); when a push is
	// refused for both reasons, the error wraps both sentinels.
	Receive(ctx context.Context, p Push) error
}

// NewRepoVerifier returns the repo:// verifier (09a §6: the pre-receive hook on origin). It reads
// the current tokens from j at every Receive.
func NewRepoVerifier(j journal.Journal) (Verifier, error) {
	return nil, ErrNotImplemented
}
