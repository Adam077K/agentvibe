// B1-04 remainder (B1-04r): hot resources and the max_wait cap (docs/vision-v3/09a-ENGINEERING.md §6;
// docs/vision-v3/04-AGENT-ORGANISATION.md §9.2). This file is the CONTRACT the job implements. It is
// not registered in build/done-tests/B1-04r.yml; the done-test that freezes it is
// fence_r_donetest_test.go.
//
// Hot resources (04 §9.2, DR-21): "import headers (#<header>), appends (#<eof>), barrel registries,
// config objects, lockfiles, migration numbers, route tables — are auto-added to every footprint
// that touches their file." 09a §6: "repo://beacon/src/config.ts#<header>  # hot resource, auto-added
// because the footprint touches config.ts".
//
//   - The hot set lives in FenceStream (one TypeHotAdded event per resource), so every Coordinator
//     over one Journal applies the same set, and a restarted one still does. A hot resource is a
//     ResourceUri "<file>#<anchor>"; its file is everything before the first '#'.
//   - Acquire adds every hot resource whose file the request touches, before it decides anything:
//     the added resources are part of the all-or-nothing request, are waited on like any other, and
//     are covered by the Grant's tokens. A requested resource touches file F when it equals F,
//     starts with F+"#", or ends in "/**" and F starts with everything before the "**" (the
//     covers rule the verifier uses). A resource the request already names is not added twice.
//   - Threshold (09a §6): "a resource in three cycles a week (parameter) is proposed to 04 as a hot
//     resource." Proposed, not added: HotCandidates lists every resource that was on at least three
//     wait-for cycles Detect broke in the rolling 7×24h before now, minus the hot set. It changes
//     nothing, and lists a resource once however many cycles it was on.
//     A resource is on a broken cycle when a job of the cycle waited on it while the next job of
//     the cycle held it. Only AddHot changes the hot set.
//
// max_wait (09a §6): "max_wait_s: 120  # detector's hard cap → release all, requeue, event
// lease.starved" and "A wait-for graph breaks any cycle or over-cap wait at the youngest mission and
// journals it." Orchestrator rulings 2026-10-03: Detect starves every wait outstanding longer than
// its request's MaxWait (DefaultMaxWait when MaxWait is zero; never unbounded), whether the waiter is
// younger or older than its holders: every lease the waiter holds is released, its wait is dropped,
// and one TypeStarved event naming it is journaled. A wait's age runs from the job's first wait on
// that resource: replacing the wait does not restart it. The age is read from the Journal, never
// from a Coordinator's memory. Requeueing a starved job is the caller's. No hot-resource exemptions
// in v0. Renew, heartbeat, ttl and shared mode are a follow-up job, not this contract.
package lease

import (
	"context"
	"time"
)

// TypeHotAdded is the FenceStream event that adds one resource to the hot set.
const TypeHotAdded = "lease.hot_added"

// TypeStarved is the FenceStream event Detect journals for each over-cap wait it breaks. Its data
// names the starved job.
const TypeStarved = "lease.starved"

// DefaultMaxWait is max_wait_s: 120 (09a §6), applied when Request.MaxWait is zero.
const DefaultMaxWait = 120 * time.Second

// HotCycleThreshold is "three cycles a week" (09a §6, a parameter).
const HotCycleThreshold = 3

// AddHot adds resource to the hot set. Adding a resource already in the set is a no-op.
func (c *coordinator) AddHot(ctx context.Context, resource string) error {
	return ErrNotImplemented
}

// HotSet returns the hot set, sorted.
func (c *coordinator) HotSet(ctx context.Context) ([]string, error) {
	return nil, ErrNotImplemented
}

// HotCandidates returns, sorted, every resource on at least HotCycleThreshold broken cycles in the
// week before now that is not already hot.
func (c *coordinator) HotCandidates(ctx context.Context) ([]string, error) {
	return nil, ErrNotImplemented
}
