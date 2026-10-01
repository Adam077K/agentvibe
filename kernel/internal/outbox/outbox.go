// Package outbox is the write-ahead effect outbox: Operation IDs, attempts, and the reconciler
// (docs/vision-v3/09a-ENGINEERING.md §7, DR-26).
//
// B0-17b freezes this surface and its done-tests (outbox_donetest_test.go, build tag
// donetest). The implementation is B1-12's; until it lands every entry point returns
// ErrNotImplemented and the done-tests fail red.
//
// The outbox persists under a directory handed to Open. The done-tests crash it for real: a
// worker process is SIGKILLed at a named Point and the next life is another process opening
// the same directory, so only what is on disk survives. A test process may also Open the same
// directory several times without closing, so an implementation must not hold a lock that a
// second Open in the same process cannot pass.
//
// The two-launcher race of gate G1(b) is not this package's: it is the job:// lease (B1-05).
package outbox

import (
	"context"
	"errors"
	"time"
)

// ErrNotImplemented is returned by every entry point until B1-12 lands.
var ErrNotImplemented = errors.New("outbox: not implemented")

// ErrUncertain: the Operation's last attempt is uncertain (or handed to a human) and is not
// re-dispatched. Recovery reconciles first, by class; it never re-dispatches blindly (§7).
var ErrUncertain = errors.New("outbox: attempt uncertain; reconcile first")

// ErrRejected is what a Provider wraps to report a DEFINITE failure: the effect did not happen.
// Any other Provider error is ambiguous and leaves the attempt uncertain.
var ErrRejected = errors.New("outbox: provider rejected the effect")

// Class is the idempotency class of an effect type (§7.2).
type Class string

const (
	NativeKey   Class = "native_key"
	CheckBefore Class = "check_before"
	Natural     Class = "natural"
	AtMostOnce  Class = "at_most_once"
)

// State is an Operation's state (§7 state diagram). Approval states are upstream of this
// subset: Dispatch covers the auto/notify path, proposed -> dispatching.
type State string

const (
	Proposed    State = "proposed"
	Dispatching State = "dispatching"
	Confirmed   State = "confirmed"
	Failed      State = "failed"
	Uncertain   State = "uncertain"
	Human       State = "human" // obligations-lane reconciliation task; never auto-retried
)

// Presence is what a provider lookup can say about an idempotency key. A lookup inside the
// provider's visibility lag answers Unknown, never Absent.
type Presence int

const (
	Unknown Presence = iota
	Present
	Absent
)

// BusinessKey is venture ‖ verb ‖ target ‖ business_ref. At most ONE open Operation per key.
type BusinessKey struct {
	Venture, Verb, Target, Ref string
}

// Effect is a proposed business action.
type Effect struct {
	Key     BusinessKey
	Class   Class
	Payload []byte
}

// Operation is the identity of an effect across workers, hosts and attempts.
type Operation struct {
	ID      string // ULID, assigned the first time the business action is proposed
	Key     BusinessKey
	Class   Class
	State   State
	Attempt int
}

// Provider is the external system an effect lands in.
type Provider interface {
	// Do performs the effect under idempotency key idem (the operation_id, suffixed with the
	// attempt only where the provider requires it and the previous attempt is proven absent).
	Do(ctx context.Context, idem string, payload []byte) error
	// Lookup reports whether an effect under idem is visible at the provider.
	Lookup(ctx context.Context, idem string) (Presence, error)
}

// Point names a crash point. The outbox calls Deps.Crash at each point it owns; a test hook
// that panics there simulates process death. ProviderInFlight is fired by the provider side:
// the effect happened and the call never returned.
type Point string

const (
	AfterDispatchingJournaled Point = "after_dispatching_journaled" // before the provider call
	ProviderInFlight          Point = "provider_in_flight"          // effect done, no response
	BeforeReceiptPersisted    Point = "before_receipt_persisted"    // provider ok, not yet recorded
	DuringReconcile           Point = "during_reconcile"            // lookup answered, not yet recorded
)

// Clock is the outbox's only source of time.
type Clock interface{ Now() time.Time }

// Deps are the outbox's injected collaborators.
type Deps struct {
	WorkerID string // the process/worker holding this Outbox; changes across restarts
	Clock    Clock
	Provider Provider
	Crash    func(Point) // nil: no fault injection; called on the goroutine of the Outbox call
}

// Outbox is the durable effect outbox.
type Outbox interface {
	// Propose returns the open Operation for e.Key, creating it (journal first) if none exists.
	// A replacement worker re-proposing the same action receives the existing Operation.
	Propose(ctx context.Context, e Effect) (Operation, error)
	// Dispatch runs the next attempt of an Operation if, and only if, no earlier attempt may
	// have happened. Confirmed returns as-is with no provider call; Uncertain or Human returns
	// ErrUncertain with no provider call.
	Dispatch(ctx context.Context, id string) (Operation, error)
	// Reconcile resolves every Dispatching or Uncertain Operation by class: Present ->
	// Confirmed, Absent -> Failed (eligible for a next attempt), Unknown -> stays Uncertain;
	// at_most_once never resolves by itself and moves to Human.
	Reconcile(ctx context.Context) error
	// Get reads an Operation by ID.
	Get(ctx context.Context, id string) (Operation, error)
}

// Open opens (creating if needed) the outbox persisted under dir.
func Open(dir string, d Deps) (Outbox, error) {
	return nil, ErrNotImplemented
}
