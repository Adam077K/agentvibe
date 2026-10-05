// B1-04: multi-resource leases and storage fencing (docs/vision-v3/09a-ENGINEERING.md §6;
// docs/vision-v3/14-BUILD-PLAN.md §6 row B1-04). This file is the CONTRACT the job implements and
// its implementation. It is not registered in build/done-tests/B1-04.yml; the done-test that
// freezes it is fence_donetest_test.go.
//
// What B1-04 owns here, and B1-05 (lease.go, the job:// claim) does not: a request for SEVERAL
// resources granted all-or-nothing; wound-wait ordering between missions; the wait-for-graph
// deadlock detector; and the repo:// storage verifier (the pre-receive hook of SP2, which recomputes
// what a write touched and refuses a stale token or a resource no presented lease covers).
//
// How it holds. Every lease, every outstanding wait and every break lives in ONE Journal stream,
// FenceStream. Each transition — a whole grant, a wait, a release, a deadlock break — is exactly one
// event appended with ExpectSeq = the stream head, so a multi-resource grant is one atomic write and
// two Coordinators racing overlapping requests are settled by the Journal's optimistic concurrency,
// never by either one's memory. A grant's fencing token, for every resource it covers, is the seq of
// the event that granted it; seqs only grow, so a re-grant's token is above every token that
// resource was ever issued. The state a Coordinator or Verifier acts on is the fold of that stream;
// each keeps a cache of the fold, but re-reads the stream from its cached head on every call and
// checks the cached head's hash still names the same event, so the cache is never the authority.
//
// Decided here, inside the contract, and recorded for the reviewer:
//   - A resource the requesting job already holds live is not busy for that job: the grant re-issues
//     it with the new token and expiry, so the job's earlier token for it goes stale.
//   - A job uses one Born for all of its requests (the contract says so); a request whose Born
//     differs from the Born the job's live leases or outstanding wait carry is refused outright.
//   - Wound-wait wounds only holders strictly younger (Born strictly later). An equal Born waits.
//   - Ties in Born inside a deadlock cycle go to the larger job id as the victim. Only a tie; age is
//     otherwise always Born.
//   - Release and a deadlock break remove every lease row the job has, expired ones included, so a
//     released or broken job has no current token anywhere.
//
// Hot resources, max_wait and lease.starved are B1-04r's, in hot.go: the hot set and the starvation
// clocks are folded from this same stream, and every event that carries a time carries the injected
// clock's reading, because the Journal stores none.
//
// Open, NOT decided here, and logged as B1-04 follow-ups for the BUILD-LOG rather than settled
// silently: renew and heartbeat and shared mode (09a §6 names them; no register row owns them, see
// lease.go); whether a glob lease and a file#symbol lease under it conflict (today only an identical
// ResourceUri is busy); whether the verifier also refuses an expired-but-unreclaimed token (it has
// no clock and does not, 09a §6 "a worker that paused ten minutes and woke cannot push"); and the
// db://, effect://, budget:// and brain:// verifiers (NewRepoVerifier refuses every non-repo://
// touched resource rather than judge it).
package lease

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

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

// Event types of FenceStream besides TypeDeadlockBroken. They are distinct from the job:// claim's
// TypeClaimed and TypeReleased, which live in other streams and mean other things.
const (
	TypeGranted = "lease.granted" // one whole Grant, wounds included
	// TypeGrantedDisplacing is a Grant that also deletes rows of other jobs under other names: a
	// wounded holder's overlapping lease, or an expired one it reclaims. It is a distinct type, and
	// Displaced is refused on any other, so a fold that predates it stops at "unknown event type"
	// instead of ignoring the field and bringing the rows back.
	TypeGrantedDisplacing = "lease.granted_displacing"
	TypeWaited            = "lease.waited"       // a job's outstanding wait, replacing any earlier one
	TypeJobReleased       = "lease.job_released" // Release: every lease row of the job, and its wait
)

// FenceStream is the one Journal stream holding every multi-resource lease, wait and break.
const FenceStream = "lease:fence"

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
	// MaxWait is lease_request.max_wait_s (09a §6): the detector's hard cap on how long this
	// request may stay an outstanding wait. Contract in hot.go (B1-04 remainder).
	MaxWait time.Duration
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

	// AddHot, HotSet and HotCandidates: the hot-resource map. Contract in hot.go.
	AddHot(ctx context.Context, resource string) error
	HotSet(ctx context.Context) ([]string, error)
	HotCandidates(ctx context.Context) ([]string, error)
}

// NewCoordinator returns the Coordinator whose leases live in j; now is its clock.
func NewCoordinator(j journal.Journal, now func() time.Time) (Coordinator, error) {
	if j == nil {
		return nil, errors.New("lease: nil journal")
	}
	if now == nil {
		return nil, errors.New("lease: nil clock")
	}
	return &coordinator{fold: fold{j: j}, now: now}, nil
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
	if j == nil {
		return nil, errors.New("lease: nil journal")
	}
	return &repoVerifier{fold: fold{j: j}}, nil
}

// ---------------------------------------------------------------------------------------------
// Stored rows and the fold.

// lrec is one lease row: who holds resource, with which token, until when. An expired row stays
// until something overwrites or removes it; it is not busy, but it is still storage's current
// record for the resource.
type lrec struct {
	Job   string
	Born  int64 // Unix nanoseconds
	Token uint64
	Exp   int64 // Unix nanoseconds
}

// wrec is a job's outstanding wait.
type wrec struct {
	Born      int64
	Resources []string
	MaxWait   int64 // nanoseconds; zero is DefaultMaxWait
}

// held names one lease row in event data: the audit of what a transition revoked or waited on.
type held struct {
	Resource string `json:"resource"`
	Job      string `json:"job"`
	Token    uint64 `json:"token"`
}

type grantedData struct {
	Job       string   `json:"job"`
	Born      int64    `json:"born_unix_nano"`
	Policy    Policy   `json:"policy"`
	Resources []string `json:"resources"`
	ExpiresAt int64    `json:"expires_at_unix_nano"`
	Token     uint64   `json:"token"`
	Wounded   []held   `json:"wounded,omitempty"`
	// Displaced is every row of another job that overlaps the grant and that its Resources do not
	// overwrite: a wounded holder's overlapping lease, or an expired one the grant takes the coverage
	// over from. The fold deletes exactly these, and only under TypeGrantedDisplacing.
	Displaced []held `json:"displaced,omitempty"`
}

type waitedData struct {
	Job       string   `json:"job"`
	Born      int64    `json:"born_unix_nano"`
	Policy    Policy   `json:"policy"`
	Resources []string `json:"resources"`
	BlockedBy []held   `json:"blocked_by"`
	At        int64    `json:"at_unix_nano"`
	MaxWait   int64    `json:"max_wait_ns,omitempty"`
}

// removedData is TypeJobReleased's, TypeDeadlockBroken's and TypeStarved's data: Victim is the job
// whose rows Removed lists and whose wait is dropped. A break also carries when it happened and the
// resources on the cycle's edges, which is what HotCandidates counts.
type removedData struct {
	Victim  string   `json:"victim"`
	Cycle   []string `json:"cycle,omitempty"`
	Removed []held   `json:"removed"`
	At      int64    `json:"at_unix_nano,omitempty"`
	Edges   []string `json:"edges,omitempty"`
}

type fstate struct {
	seq    uint64
	hash   string
	leases map[string]lrec
	waits  map[string]wrec
	// clocks[job][resource] is when job first waited on resource since its last grant or release; a
	// replaced wait keeps it. It is what max_wait measures.
	clocks map[string]map[string]int64
	hot    map[string]bool
	cycles []cycleRec
}

func emptyState() fstate {
	return fstate{leases: map[string]lrec{}, waits: map[string]wrec{}, clocks: map[string]map[string]int64{}, hot: map[string]bool{}}
}

// fold is FenceStream folded into its current state. It is only ever brought up to date from the
// Journal; callers hold mu for the whole of an operation.
type fold struct {
	j  journal.Journal
	mu sync.Mutex
	st fstate
}

// sync brings f.st to the stream head. It re-reads the cached head event itself and refuses to go
// on if that event no longer carries the cached hash.
func (f *fold) sync(ctx context.Context) error {
	if f.st.leases == nil {
		f.st = emptyState()
	}
	from := f.st.seq
	if from == 0 {
		from = 1
	}
	evs, err := f.j.Read(ctx, FenceStream, from)
	if err != nil {
		return fmt.Errorf("lease: read %s: %w", FenceStream, err)
	}
	if f.st.seq > 0 {
		if len(evs) == 0 || evs[0].Seq != f.st.seq || evs[0].Hash != f.st.hash {
			seq := f.st.seq
			f.st = emptyState()
			return fmt.Errorf("%w: %s seq %d no longer carries the hash it was folded from", ErrCorrupt, FenceStream, seq)
		}
		evs = evs[1:]
	}
	for _, ev := range evs {
		if ev.Seq != f.st.seq+1 {
			seq := f.st.seq
			f.st = emptyState()
			return fmt.Errorf("%w: %s holds seq %d after %d", ErrCorrupt, FenceStream, ev.Seq, seq)
		}
		if err := f.st.apply(ev); err != nil {
			f.st = emptyState()
			return err
		}
		f.st.seq, f.st.hash = ev.Seq, ev.Hash
	}
	return nil
}

func corrupt(ev journal.Event, format string, a ...any) error {
	return fmt.Errorf("%w: %s seq %d (%s): %s", ErrCorrupt, ev.Stream, ev.Seq, ev.Type, fmt.Sprintf(format, a...))
}

// apply folds one event. Every event is checked against the state it was decided on, so a row
// this package did not write fails closed instead of being half-applied.
func (st *fstate) apply(ev journal.Event) error {
	switch ev.Type {
	case TypeGranted, TypeGrantedDisplacing:
		var d grantedData
		if err := json.Unmarshal(ev.Data, &d); err != nil {
			return corrupt(ev, "%v", err)
		}
		if d.Job == "" || len(d.Resources) == 0 || d.Token != ev.Seq {
			return corrupt(ev, "job %q, %d resources, token %d", d.Job, len(d.Resources), d.Token)
		}
		if (ev.Type == TypeGrantedDisplacing) != (len(d.Displaced) > 0) {
			return corrupt(ev, "%d displaced rows under this event type", len(d.Displaced))
		}
		for _, h := range d.Displaced {
			cur, ok := st.leases[h.Resource]
			if !ok || h.Job == d.Job || cur.Job != h.Job || cur.Token != h.Token {
				return corrupt(ev, "displaces %s token %d of %q, which storage does not record", h.Resource, h.Token, h.Job)
			}
			if !overlapsAny(h.Resource, d.Resources) {
				return corrupt(ev, "displaces %s, which overlaps nothing the grant takes", h.Resource)
			}
			delete(st.leases, h.Resource)
		}
		for _, r := range d.Resources {
			st.leases[r] = lrec{Job: d.Job, Born: d.Born, Token: ev.Seq, Exp: d.ExpiresAt}
		}
		delete(st.waits, d.Job)
		// A grant ends the clock of what it granted and no other: a job that takes a free resource
		// while it waits on a busy one is still waiting on the busy one.
		for _, r := range d.Resources {
			delete(st.clocks[d.Job], r)
		}
		if len(st.clocks[d.Job]) == 0 {
			delete(st.clocks, d.Job)
		}
	case TypeWaited:
		var d waitedData
		if err := json.Unmarshal(ev.Data, &d); err != nil {
			return corrupt(ev, "%v", err)
		}
		if d.Job == "" || len(d.Resources) == 0 || d.At <= 0 || d.MaxWait < 0 {
			return corrupt(ev, "job %q, %d resources, at %d, max wait %d", d.Job, len(d.Resources), d.At, d.MaxWait)
		}
		st.waits[d.Job] = wrec{Born: d.Born, Resources: append([]string(nil), d.Resources...), MaxWait: d.MaxWait}
		if st.clocks[d.Job] == nil {
			st.clocks[d.Job] = map[string]int64{}
		}
		for _, r := range d.Resources {
			if _, ok := st.clocks[d.Job][r]; !ok {
				st.clocks[d.Job][r] = d.At
			}
		}
	case TypeHotAdded:
		var d hotData
		if err := json.Unmarshal(ev.Data, &d); err != nil {
			return corrupt(ev, "%v", err)
		}
		if _, err := hotFile(d.Resource); err != nil {
			return corrupt(ev, "%v", err)
		}
		st.hot[d.Resource] = true
	case TypeJobReleased, TypeDeadlockBroken, TypeStarved:
		var d removedData
		if err := json.Unmarshal(ev.Data, &d); err != nil {
			return corrupt(ev, "%v", err)
		}
		if d.Victim == "" {
			return corrupt(ev, "no job named")
		}
		for _, h := range d.Removed {
			cur, ok := st.leases[h.Resource]
			if !ok || h.Job != d.Victim || cur.Job != h.Job || cur.Token != h.Token {
				return corrupt(ev, "removes %s token %d of %q, which storage does not record", h.Resource, h.Token, h.Job)
			}
			delete(st.leases, h.Resource)
		}
		for r, l := range st.leases {
			if l.Job == d.Victim {
				return corrupt(ev, "leaves %s held by %q", r, d.Victim)
			}
		}
		delete(st.waits, d.Victim)
		delete(st.clocks, d.Victim)
		if ev.Type == TypeDeadlockBroken && len(d.Edges) > 0 {
			st.cycles = append(st.cycles, cycleRec{at: d.At, resources: append([]string(nil), d.Edges...)})
		}
	default:
		return corrupt(ev, "unknown event type")
	}
	return nil
}

// rowsOf lists every lease row job has, live or expired, sorted by resource.
func (st *fstate) rowsOf(job string) []held {
	var out []held
	for r, l := range st.leases {
		if l.Job == job {
			out = append(out, held{Resource: r, Job: job, Token: l.Token})
		}
	}
	sort.Slice(out, func(a, b int) bool { return out[a].Resource < out[b].Resource })
	return out
}

func live(l lrec, now int64) bool { return now < l.Exp }

// overlapping lists, sorted by resource, every lease row of a job other than job, live or expired,
// whose resource overlaps r.
func (st *fstate) overlapping(r, job string) []held {
	var out []held
	for k, l := range st.leases {
		if l.Job != job && overlaps(k, r) {
			out = append(out, held{Resource: k, Job: l.Job, Token: l.Token})
		}
	}
	sort.Slice(out, func(a, b int) bool { return out[a].Resource < out[b].Resource })
	return out
}

// ---------------------------------------------------------------------------------------------
// Coordinator.

type coordinator struct {
	fold
	now func() time.Time
}

func validResource(r string) error {
	if err := validText("resource", r); err != nil {
		return err
	}
	i := strings.Index(r, "://")
	if i <= 0 || i+3 == len(r) {
		return fmt.Errorf("lease: resource %q is not a ResourceUri (scheme://path)", r)
	}
	for _, c := range r {
		if c < 0x20 || c == 0x7f {
			return fmt.Errorf("lease: resource %q contains a control character", r)
		}
	}
	return nil
}

func validRequest(req Request, now time.Time) error {
	if err := validJobID(req.Job); err != nil {
		return err
	}
	if req.Born.IsZero() {
		return fmt.Errorf("lease: %s request has no Born; wound-wait and the detector cannot order it", req.Job)
	}
	if req.Policy != AllOrNothing && req.Policy != WoundWait {
		return fmt.Errorf("lease: unknown policy %q", req.Policy)
	}
	if len(req.Resources) == 0 {
		return fmt.Errorf("lease: %s request names no resource", req.Job)
	}
	seen := make(map[string]bool, len(req.Resources))
	for _, r := range req.Resources {
		if err := validResource(r); err != nil {
			return err
		}
		if !canonicalRequested(r) {
			return fmt.Errorf("lease: %s request names %q, which is not canonical (want repo://<repo>/<path>#<anchor>, repo://<repo>/<dir>/** or repo://<repo>/<path>)", req.Job, r)
		}
		if seen[r] {
			return fmt.Errorf("lease: %s request names %s twice", req.Job, r)
		}
		seen[r] = true
	}
	if req.TTL <= 0 {
		return fmt.Errorf("lease: ttl %v must be positive", req.TTL)
	}
	if req.MaxWait < 0 {
		return fmt.Errorf("lease: %s request has a negative MaxWait %v", req.Job, req.MaxWait)
	}
	// Expiries are stored as int64 Unix nanoseconds; a ttl past that range would wrap negative and
	// the lease would be born expired.
	if n := now.UnixNano(); n < 0 || int64(req.TTL) > math.MaxInt64-n {
		return fmt.Errorf("lease: ttl %v overflows the expiry", req.TTL)
	}
	return nil
}

// append proposes one event at the folded head. A seq conflict is returned as is for the caller to
// re-sync and decide again.
func (c *coordinator) append(ctx context.Context, typ string, v any) (journal.Event, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return journal.Event{}, err
	}
	return c.j.Append(ctx, journal.Proposal{Stream: FenceStream, ExpectSeq: c.st.seq, Type: typ, Data: data})
}

func (c *coordinator) Acquire(ctx context.Context, req Request) (Grant, error) {
	if err := validRequest(req, c.now()); err != nil {
		return Grant{}, err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	born := req.Born.UnixNano()
	for attempt := 0; attempt < maxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			return Grant{}, err
		}
		if err := c.sync(ctx); err != nil {
			return Grant{}, err
		}
		now := c.now()
		nowN := now.UnixNano()
		// A wait is stamped with this reading and the fold refuses a stamp at or before the epoch, so
		// a clock there would write a row every reader fails closed on.
		if nowN <= 0 {
			return Grant{}, fmt.Errorf("lease: clock reads %s, at or before the Unix epoch", now.UTC().Format(time.RFC3339Nano))
		}
		if w, ok := c.st.waits[req.Job]; ok && w.Born != born {
			return Grant{}, fmt.Errorf("lease: %s requested with Born %s but waits with Born %s; a job has one Born",
				req.Job, req.Born.UTC().Format(time.RFC3339Nano), time.Unix(0, w.Born).UTC().Format(time.RFC3339Nano))
		}
		for r, l := range c.st.leases {
			if l.Job == req.Job && live(l, nowN) && l.Born != born {
				return Grant{}, fmt.Errorf("lease: %s requested with Born %s but holds %s with Born %s; a job has one Born",
					req.Job, req.Born.UTC().Format(time.RFC3339Nano), r, time.Unix(0, l.Born).UTC().Format(time.RFC3339Nano))
			}
		}

		// Every hot resource the request touches is part of it: waited on, granted and fenced like a
		// resource the caller named.
		resources := c.st.withHot(req.Resources)
		var busy, rows []held
		older := false
		seenRow := map[string]bool{}
		for _, r := range resources {
			for _, h := range c.st.overlapping(r, req.Job) {
				if seenRow[h.Resource] {
					continue
				}
				seenRow[h.Resource] = true
				rows = append(rows, h)
				// An expired lease is free; the grant below still takes its coverage over.
				if l := c.st.leases[h.Resource]; live(l, nowN) {
					busy = append(busy, h)
					if l.Born <= born { // not strictly younger: the requester may not wound it
						older = true
					}
				}
			}
		}

		if len(busy) > 0 && (req.Policy == AllOrNothing || older) {
			_, err := c.append(ctx, TypeWaited, waitedData{Job: req.Job, Born: born, Policy: req.Policy,
				Resources: resources, BlockedBy: busy, At: nowN, MaxWait: int64(req.MaxWait)})
			if errors.Is(err, journal.ErrSeqConflict) {
				continue
			}
			if err != nil {
				return Grant{}, fmt.Errorf("lease: record %s wait: %w", req.Job, err)
			}
			names := make([]string, len(busy))
			for i, h := range busy {
				names[i] = fmt.Sprintf("%s (held by %s, token %d)", h.Resource, h.Job, h.Token)
			}
			return Grant{}, fmt.Errorf("%w: %s waits on %s", ErrWait, req.Job, strings.Join(names, ", "))
		}

		// Free, expired, the job's own, or (wound-wait) held only by younger missions: grant all of
		// it in one event. Its seq is every token.
		tok := c.st.seq + 1
		exp := now.Add(req.TTL).UnixNano()
		granted := make(map[string]bool, len(resources))
		for _, r := range resources {
			granted[r] = true
		}
		var displaced []held
		for _, h := range rows {
			if !granted[h.Resource] { // a row of the same name is overwritten by the grant itself
				displaced = append(displaced, h)
			}
		}
		typ := TypeGranted
		if len(displaced) > 0 {
			typ = TypeGrantedDisplacing
		}
		ev, err := c.append(ctx, typ, grantedData{Job: req.Job, Born: born, Policy: req.Policy,
			Resources: resources, ExpiresAt: exp, Token: tok, Wounded: busy, Displaced: displaced})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return Grant{}, fmt.Errorf("lease: grant %s: %w", req.Job, err)
		}
		if ev.Seq != tok {
			return Grant{}, fmt.Errorf("%w: grant appended at seq %d, want %d", ErrCorrupt, ev.Seq, tok)
		}
		g := Grant{Job: req.Job, Tokens: make(map[string]uint64, len(resources)), ExpiresAt: time.Unix(0, exp)}
		for _, r := range resources {
			g.Tokens[r] = tok
		}
		return g, nil
	}
	return Grant{}, fmt.Errorf("lease: acquire for %s: gave up after %d contended attempts", req.Job, maxAttempts)
}

func (c *coordinator) Release(ctx context.Context, job string) error {
	if err := validJobID(job); err != nil {
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
		rows := c.st.rowsOf(job)
		if _, waits := c.st.waits[job]; len(rows) == 0 && !waits {
			return nil
		}
		_, err := c.append(ctx, TypeJobReleased, removedData{Victim: job, Removed: rows})
		if errors.Is(err, journal.ErrSeqConflict) {
			continue
		}
		if err != nil {
			return fmt.Errorf("lease: release %s: %w", job, err)
		}
		return nil
	}
	return fmt.Errorf("lease: release %s: gave up after %d contended attempts", job, maxAttempts)
}

func (c *coordinator) Holder(ctx context.Context, resource string) (Lease, bool, error) {
	if err := validResource(resource); err != nil {
		return Lease{}, false, err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.sync(ctx); err != nil {
		return Lease{}, false, err
	}
	l, ok := c.st.leases[resource]
	if !ok || !live(l, c.now().UnixNano()) {
		return Lease{}, false, nil
	}
	return Lease{Resource: resource, Job: l.Job, Token: l.Token, ExpiresAt: time.Unix(0, l.Exp)}, true, nil
}

func (c *coordinator) Waiting(ctx context.Context, job string) ([]string, bool, error) {
	if err := validJobID(job); err != nil {
		return nil, false, err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.sync(ctx); err != nil {
		return nil, false, err
	}
	w, ok := c.st.waits[job]
	if !ok {
		return nil, false, nil
	}
	return append([]string(nil), w.Resources...), true, nil
}

// graph is the wait-for graph at now: each waiting job → the sorted live holders (other than
// itself) of the resources it waits on.
func (st *fstate) graph(now int64) map[string][]string {
	g := make(map[string][]string, len(st.waits))
	for job, w := range st.waits {
		set := map[string]bool{}
		for _, r := range w.Resources {
			for _, h := range st.overlapping(r, job) {
				if live(st.leases[h.Resource], now) {
					set[h.Job] = true
				}
			}
		}
		out := make([]string, 0, len(set))
		for h := range set {
			out = append(out, h)
		}
		sort.Strings(out)
		g[job] = out
	}
	return g
}

// findCycle returns one cycle of g, or nil. It walks jobs and edges in sorted order, so the same
// graph always yields the same cycle.
func findCycle(g map[string][]string) []string {
	nodes := make([]string, 0, len(g))
	for n := range g {
		nodes = append(nodes, n)
	}
	sort.Strings(nodes)
	const (
		white = iota
		grey
		black
	)
	color := map[string]int{}
	var stack []string
	var cycle []string
	var visit func(n string) bool
	visit = func(n string) bool {
		color[n] = grey
		stack = append(stack, n)
		for _, m := range g[n] {
			switch color[m] {
			case grey:
				for i := len(stack) - 1; i >= 0; i-- {
					if stack[i] == m {
						cycle = append([]string(nil), stack[i:]...)
						return true
					}
				}
			case white:
				if visit(m) {
					return true
				}
			}
		}
		stack = stack[:len(stack)-1]
		color[n] = black
		return false
	}
	for _, n := range nodes {
		if color[n] == white && visit(n) {
			return cycle
		}
	}
	return nil
}

// youngest is the cycle's victim: the latest Born; a tie goes to the larger job id.
func (st *fstate) youngest(cycle []string) string {
	v := cycle[0]
	for _, j := range cycle[1:] {
		bj, bv := st.waits[j].Born, st.waits[v].Born
		if bj > bv || (bj == bv && j > v) {
			v = j
		}
	}
	return v
}

// Detect breaks every cycle first, so a deadlock is journaled as one and counted toward the hot
// proposal, then starves every wait older than its cap. A starvation is not a break and is not
// returned: it is journaled as TypeStarved, and requeueing the job is the caller's.
func (c *coordinator) Detect(ctx context.Context) ([]Break, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	var breaks []Break
	conflicts := 0
	for {
		if err := ctx.Err(); err != nil {
			return breaks, err
		}
		if err := c.sync(ctx); err != nil {
			return breaks, err
		}
		now := c.now().UnixNano()
		cycle := findCycle(c.st.graph(now))
		if cycle == nil {
			job, over := c.st.starved(now)
			if !over {
				return breaks, nil
			}
			_, err := c.append(ctx, TypeStarved, removedData{Victim: job, Removed: c.st.rowsOf(job), At: now})
			if errors.Is(err, journal.ErrSeqConflict) {
				if conflicts++; conflicts >= maxAttempts {
					return breaks, fmt.Errorf("lease: detect: gave up after %d contended attempts", maxAttempts)
				}
				continue
			}
			if err != nil {
				return breaks, fmt.Errorf("lease: starve %s: %w", job, err)
			}
			continue
		}
		victim := c.st.youngest(cycle)
		_, err := c.append(ctx, TypeDeadlockBroken, removedData{Victim: victim, Cycle: cycle, Removed: c.st.rowsOf(victim),
			At: now, Edges: c.st.cycleResources(cycle, now)})
		if errors.Is(err, journal.ErrSeqConflict) {
			if conflicts++; conflicts >= maxAttempts {
				return breaks, fmt.Errorf("lease: detect: gave up after %d contended attempts", maxAttempts)
			}
			continue
		}
		if err != nil {
			return breaks, fmt.Errorf("lease: break cycle at %s: %w", victim, err)
		}
		breaks = append(breaks, Break{Victim: victim, Cycle: cycle})
	}
}

// ---------------------------------------------------------------------------------------------
// repo:// verifier.

type repoVerifier struct {
	fold
}

const repoScheme = "repo://"

// covers reports whether presented resource p covers touched resource t: p is t, or p is a glob
// "<dir>/**" over a canonical repository directory and t lies strictly below it. Nothing else is a
// glob, so repo://**, repo://a**, repo://a/* and repo://a/**/ are exact names and cover only
// themselves; a glob over any other scheme keeps its plain prefix meaning. Receive and the hot-set
// expansion (hot.go touches) both use it.
func covers(p, t string) bool {
	if p == t {
		return true
	}
	if !strings.HasPrefix(p, repoScheme) {
		// Not repo://: the canonical predicate does not apply, and a glob keeps its original meaning.
		return strings.HasSuffix(p, "/**") && strings.HasPrefix(t, strings.TrimSuffix(p, "**"))
	}
	pre, ok := globPrefix(p)
	return ok && below(pre, t, false)
}

// overlaps reports whether two resources can both be covered by one touched name, so that two jobs
// holding them would both be accepted for it. It is symmetric. For repo:// it is covers() both ways,
// a glob against a glob comparing the two directories on the "/" boundary, plus ruling R6: two names of
// one file overlap when either is the whole-file name file#* or the bare file, and file#f, file#g do
// not. Any other scheme keeps covers' plain prefix meaning.
func overlaps(a, b string) bool {
	if a == b {
		return true
	}
	if !strings.HasPrefix(a, repoScheme) || !strings.HasPrefix(b, repoScheme) {
		return covers(a, b) || covers(b, a)
	}
	pa, ga := globPrefix(a)
	pb, gb := globPrefix(b)
	switch {
	case ga && gb:
		return strings.HasPrefix(pa, pb) || strings.HasPrefix(pb, pa)
	case ga:
		return below(pa, b, false)
	case gb:
		return below(pb, a, false)
	}
	fa, anchorA, foundA := strings.Cut(a, "#")
	fb, anchorB, foundB := strings.Cut(b, "#")
	return fa == fb && (!foundA || !foundB || anchorA == "*" || anchorB == "*")
}

func overlapsAny(row string, resources []string) bool {
	for _, r := range resources {
		if overlaps(row, r) {
			return true
		}
	}
	return false
}

// canonicalRequested reports whether a requested resource may be granted. Only repo:// is judged: it
// is a canonical touched name, a glob "<canonical dir>/**", or a bare canonical file (which hot.go's
// touches names as "r == file"). Every other scheme is left to validResource.
func canonicalRequested(r string) bool {
	rest, ok := strings.CutPrefix(r, repoScheme)
	switch {
	case !ok:
		return true
	case !utf8.ValidString(r):
		return false
	case strings.Contains(r, "#"):
		return canonicalTouched(r)
	case strings.HasSuffix(r, "/**"):
		_, glob := globPrefix(r)
		return glob
	}
	return strings.Contains(rest, "/") && canonSegs(rest)
}

// globPrefix returns "<dir>/" for a presented glob "<dir>/**" whose dir is a canonical repository
// directory, and false for every other spelling.
func globPrefix(p string) (string, bool) {
	dir, ok := strings.CutSuffix(p, "/**")
	if !ok || !strings.HasPrefix(dir, repoScheme) || !canonSegs(dir[len(repoScheme):]) {
		return "", false
	}
	return dir + "/", true
}

// below reports whether t lies strictly below the glob prefix pre. A caller that has already judged t
// canonical passes canon to skip re-checking its segments.
func below(pre, t string, canon bool) bool {
	rest, ok := strings.CutPrefix(t, pre)
	if !ok {
		return false
	}
	file, _, _ := strings.Cut(rest, "#")
	return canon || canonSegs(file)
}

// canonSegs reports whether s is a "/"-joined run of canonical segments: each non-empty, not a dot
// segment (literally or with a dot spelled %2e in any case), and free of controls, '*', a backslash
// and an encoded separator (%2f, %5c in any case). Other percent-encodings are literal bytes.
func canonSegs(s string) bool {
	for _, seg := range strings.Split(s, "/") {
		low := strings.ToLower(seg)
		if seg == "" || hasControl(seg) || strings.ContainsAny(seg, "*\\") || strings.Contains(low, "%2f") || strings.Contains(low, "%5c") {
			return false
		}
		if dots := strings.ReplaceAll(low, "%2e", "."); dots == "." || dots == ".." {
			return false
		}
	}
	return true
}

// canonicalTouched reports whether t is a name storage could have produced:
// repo://<repo>/<path>#<anchor>, split at the first '#', byte for byte. The repository and every path
// segment satisfy canonSegs, and there is at least one path segment. The anchor is a symbol name:
// non-empty, no '/', '\\', '#', '%', control character or "..", and '*' only as the whole anchor.
func canonicalTouched(t string) bool {
	if !utf8.ValidString(t) {
		return false
	}
	file, anchor, found := strings.Cut(t, "#")
	rest, ok := strings.CutPrefix(file, repoScheme)
	if !found || !ok || anchor == "" || !strings.Contains(rest, "/") || !canonSegs(rest) {
		return false
	}
	if anchor == "*" {
		return true
	}
	if strings.ContainsAny(anchor, "*/\\#%") || strings.Contains(anchor, "..") {
		return false
	}
	return !hasControl(anchor)
}

// hasControl reports a C0 control, DEL or a C1 control (U+0080-U+009F) in s.
func hasControl(s string) bool {
	for _, c := range s {
		if c < 0x20 || (c >= 0x7f && c <= 0x9f) {
			return true
		}
	}
	return false
}

func (v *repoVerifier) Receive(ctx context.Context, p Push) error {
	if err := validJobID(p.Job); err != nil {
		return err
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	if err := v.sync(ctx); err != nil {
		return err
	}
	presented := make([]string, 0, len(p.Tokens))
	for r := range p.Tokens {
		presented = append(presented, r)
	}
	sort.Strings(presented)
	// A glob's prefix is computed once per presented resource, not once per touched name.
	prefix := make(map[string]string, len(presented))
	for _, r := range presented {
		if pre, ok := globPrefix(r); ok {
			prefix[r] = pre
		}
	}

	var foreign, malformed, undeclared, stale []string
	seen := map[string]bool{}
	for _, t := range p.Touched {
		if seen[t] {
			continue
		}
		seen[t] = true
		// Only repo:// is judged here. The other verifiers of 09a §6 are a logged follow-up, and a
		// resource this verifier cannot judge is refused, never waved through.
		if !strings.HasPrefix(t, repoScheme) {
			foreign = append(foreign, strconv.Quote(t))
			continue
		}
		// A name storage would not have produced is refused, never normalised and then judged.
		if !canonicalTouched(t) {
			malformed = append(malformed, strconv.Quote(t))
			continue
		}
		var cover []string
		for _, r := range presented {
			if pre, glob := prefix[r]; r == t || (glob && below(pre, t, true)) {
				cover = append(cover, r)
			}
		}
		if len(cover) == 0 {
			undeclared = append(undeclared, strconv.Quote(t))
			continue
		}
		ok := false
		var why []string
		for _, r := range cover {
			// No clock here: storage's current row is the current token, live or expired. Whether
			// an expired-but-unreclaimed token is also refused is a logged follow-up (09a §6).
			l, has := v.st.leases[r]
			if has && l.Job == p.Job && l.Token == p.Tokens[r] {
				ok = true
				break
			}
			cur := "no current token"
			if has {
				cur = fmt.Sprintf("current token %d issued to %s", l.Token, l.Job)
			}
			why = append(why, fmt.Sprintf("presented %d, %s", p.Tokens[r], cur))
		}
		if !ok {
			stale = append(stale, fmt.Sprintf("%q (%s)", t, strings.Join(why, "; ")))
		}
	}
	if len(foreign)+len(malformed)+len(undeclared)+len(stale) == 0 {
		return nil
	}
	// Name only what is refused: an accepted touched resource never appears in the refusal.
	var parts []string
	var wrapped []error
	if len(undeclared) > 0 {
		parts = append(parts, "undeclared: "+strings.Join(undeclared, ", "))
		wrapped = append(wrapped, ErrUndeclared)
	}
	if len(stale) > 0 {
		parts = append(parts, "stale: "+strings.Join(stale, ", "))
		wrapped = append(wrapped, ErrStaleToken)
	}
	if len(malformed) > 0 {
		parts = append(parts, "non-canonical (want repo://<repo>/<path>#<anchor>): "+strings.Join(malformed, ", "))
	}
	if len(foreign) > 0 {
		parts = append(parts, "not repo:// (this verifier judges repo:// only): "+strings.Join(foreign, ", "))
	}
	return &refusal{job: p.Job, msg: strings.Join(parts, "; "), errs: wrapped}
}

// refusal is a refused push. It wraps ErrUndeclared, ErrStaleToken, both, or neither (a push
// refused only for touching a non-repo:// resource).
type refusal struct {
	job  string
	msg  string
	errs []error
}

func (r *refusal) Error() string   { return fmt.Sprintf("lease: push by %s refused: %s", r.job, r.msg) }
func (r *refusal) Unwrap() []error { return r.errs }
