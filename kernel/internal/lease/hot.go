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
// and one TypeStarved event naming it is journaled; one Detect starves every over-cap wait. A
// wait's age runs from the job's first wait on that resource since its last grant or release of it:
// replacing the wait does not restart it, a re-wait after a grant does, and the replacement's
// MaxWait is the cap. A negative MaxWait is refused by Acquire (red-team rulings 2026-10-03).
// Starvations are not broken cycles and never count toward HotCandidates. The age is read from the Journal, never
// from a Coordinator's memory. Requeueing a starved job is the caller's. No hot-resource exemptions
// in v0. Renew, heartbeat, ttl and shared mode are a follow-up job, not this contract.
package lease

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
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

// hotWindow is "a week": the rolling 7x24h before now.
const hotWindow = 7 * 24 * time.Hour

// hotData is TypeHotAdded's data.
type hotData struct {
	Resource string `json:"resource"`
}

// cycleRec is one broken cycle as the fold keeps it: when, and the resources on its edges.
type cycleRec struct {
	at        int64 // Unix nanoseconds
	resources []string
}

// hotFile splits a hot resource "<file>#<anchor>" at its first '#'. It refuses what is not one: not a
// ResourceUri, no '#', or an empty file or anchor.
func hotFile(resource string) (string, error) {
	if err := validResource(resource); err != nil {
		return "", err
	}
	file, anchor, found := strings.Cut(resource, "#")
	if !found || anchor == "" {
		return "", fmt.Errorf("lease: hot resource %q has no anchor (<file>#<anchor>)", resource)
	}
	if err := validResource(file); err != nil {
		return "", fmt.Errorf("lease: hot resource %q has no file before its first '#': %w", resource, err)
	}
	return file, nil
}

// touches reports whether requested resource r touches file: r is the file, a symbol of it, or a glob
// that covers it.
func touches(r, file string) bool {
	return r == file || strings.HasPrefix(r, file+"#") || covers(r, file)
}

// withHot returns resources plus every hot resource whose file one of them touches and that they do
// not already name, in hot-set order.
func (st *fstate) withHot(resources []string) []string {
	out := append([]string(nil), resources...)
	named := make(map[string]bool, len(resources))
	for _, r := range resources {
		named[r] = true
	}
	for _, h := range st.hotSet() {
		if named[h] {
			continue
		}
		file, err := hotFile(h)
		if err != nil {
			continue // unreachable: the fold admits only valid hot resources
		}
		for _, r := range resources {
			if touches(r, file) {
				out = append(out, h)
				break
			}
		}
	}
	return out
}

func (st *fstate) hotSet() []string {
	out := make([]string, 0, len(st.hot))
	for h := range st.hot {
		out = append(out, h)
	}
	sort.Strings(out)
	return out
}

// cycleResources lists, sorted, the resources on the edges of cycle: those one job of the cycle waits
// on while the next job of the cycle holds them.
func (st *fstate) cycleResources(cycle []string, now int64) []string {
	set := map[string]bool{}
	for i, job := range cycle {
		next := cycle[(i+1)%len(cycle)]
		for _, r := range st.waits[job].Resources {
			if l, ok := st.leases[r]; ok && l.Job == next && live(l, now) {
				set[r] = true
			}
		}
	}
	out := make([]string, 0, len(set))
	for r := range set {
		out = append(out, r)
	}
	sort.Strings(out)
	return out
}

// starved returns the first job, by id, whose outstanding wait is older than its cap at now. A wait's
// age is that of the oldest clock among the resources it names; the cap is the latest request's
// MaxWait, DefaultMaxWait when that is zero.
func (st *fstate) starved(now int64) (string, bool) {
	jobs := make([]string, 0, len(st.waits))
	for job := range st.waits {
		jobs = append(jobs, job)
	}
	sort.Strings(jobs)
	for _, job := range jobs {
		w := st.waits[job]
		limit := w.MaxWait
		if limit == 0 {
			limit = int64(DefaultMaxWait)
		}
		for _, r := range w.Resources {
			if since, ok := st.clocks[job][r]; ok && now-since > limit {
				return job, true
			}
		}
	}
	return "", false
}

// AddHot adds resource to the hot set. Adding a resource already in the set is a no-op. A resource
// that is not a ResourceUri, has no '#', or has an empty path before or an empty anchor after its first '#' is refused and
// changes nothing.
func (c *coordinator) AddHot(ctx context.Context, resource string) error {
	if _, err := hotFile(resource); err != nil {
		return err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := c.sync(ctx); err != nil {
			return err
		}
		if c.st.hot[resource] {
			return nil
		}
		_, err := c.append(ctx, TypeHotAdded, hotData{Resource: resource})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return fmt.Errorf("lease: add hot %s: %w", resource, err)
		}
		return nil
	}
	return fmt.Errorf("lease: add hot %s: gave up after %d contended attempts", resource, maxAttempts)
}

// HotSet returns the hot set, sorted.
func (c *coordinator) HotSet(ctx context.Context) ([]string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.sync(ctx); err != nil {
		return nil, err
	}
	return c.st.hotSet(), nil
}

// HotCandidates returns, sorted, every resource on at least HotCycleThreshold broken cycles in the
// week before now that is not already hot.
func (c *coordinator) HotCandidates(ctx context.Context) ([]string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.sync(ctx); err != nil {
		return nil, err
	}
	now := c.now().UnixNano()
	count := map[string]int{}
	for _, cy := range c.st.cycles {
		if cy.at > now || now-cy.at >= int64(hotWindow) {
			continue
		}
		for _, r := range cy.resources {
			count[r]++
		}
	}
	out := []string{}
	for r, n := range count {
		if n >= HotCycleThreshold && !c.st.hot[r] {
			out = append(out, r)
		}
	}
	sort.Strings(out)
	return out, nil
}
