//go:build donetest

// B1-04 done-test (docs/vision-v3/14-BUILD-PLAN.md §6 row B1-04, acceptance: "SP2 B0-greedy + drill
// fixtures nightly; stale holder rejected by storage; touched ≠ declared → refused"). Hash-registered
// in build/done-tests/B1-04.yml with the two SP2 fixtures it reads. The contract it freezes is
// fence.go, which is NOT registered: it is the interface the job implements.
//
// Not re-tested here: the job:// claim (B1-05, lease_donetest_test.go).
//
// Every clock is injected; nothing sleeps. Each test names, in its comment, the wrong
// implementation it is there to kill.
//
// Run: go -C kernel test -tags donetest -count=1 -run B1_04 ./internal/lease/
package lease_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

// b104Clock is the injected clock. Advance is the only way time moves.
type b104Clock struct {
	mu sync.Mutex
	t  time.Time
}

func (c *b104Clock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.t
}

func (c *b104Clock) Advance(d time.Duration) {
	c.mu.Lock()
	c.t = c.t.Add(d)
	c.mu.Unlock()
}

var b104Epoch = time.Date(2026, 10, 1, 9, 0, 0, 0, time.UTC)

const b104TTL = 90 * time.Second

func b104Open(t *testing.T) (journal.Journal, string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "journal.db")
	j, err := journal.Open(path)
	if err != nil {
		t.Fatalf("journal.Open: %v", err)
	}
	t.Cleanup(func() { j.Close() })
	return j, path
}

func b104Coord(t *testing.T, j journal.Journal, clk *b104Clock) lease.Coordinator {
	t.Helper()
	c, err := lease.NewCoordinator(j, clk.Now)
	if err != nil {
		t.Fatalf("lease.NewCoordinator: %v", err)
	}
	if c == nil {
		t.Fatalf("lease.NewCoordinator returned nil and no error")
	}
	return c
}

func b104Verifier(t *testing.T, j journal.Journal) lease.Verifier {
	t.Helper()
	v, err := lease.NewRepoVerifier(j)
	if err != nil {
		t.Fatalf("lease.NewRepoVerifier: %v", err)
	}
	if v == nil {
		t.Fatalf("lease.NewRepoVerifier returned nil and no error")
	}
	return v
}

func b104Req(job string, born time.Time, policy lease.Policy, res ...string) lease.Request {
	return lease.Request{Job: job, Born: born, Resources: res, Policy: policy, TTL: b104TTL}
}

// mustGrant acquires and checks the Grant carries exactly one nonzero token per requested resource.
func mustGrant(t *testing.T, c lease.Coordinator, req lease.Request) lease.Grant {
	t.Helper()
	g, err := c.Acquire(context.Background(), req)
	if err != nil {
		t.Fatalf("%s Acquire(%v): want a grant, got %v", req.Job, req.Resources, err)
	}
	if g.Job != req.Job || len(g.Tokens) != len(req.Resources) {
		t.Fatalf("%s Acquire(%v): grant %+v does not cover exactly the request", req.Job, req.Resources, g)
	}
	for _, r := range req.Resources {
		if g.Tokens[r] == 0 {
			t.Fatalf("%s Acquire: no token for %s in %+v", req.Job, r, g.Tokens)
		}
	}
	return g
}

// mustWait acquires and checks the request waits with nothing granted.
func mustWait(t *testing.T, c lease.Coordinator, req lease.Request) {
	t.Helper()
	g, err := c.Acquire(context.Background(), req)
	if !errors.Is(err, lease.ErrWait) {
		t.Fatalf("%s Acquire(%v): want ErrWait, got grant %+v err %v", req.Job, req.Resources, g, err)
	}
	if len(g.Tokens) != 0 {
		t.Fatalf("%s Acquire(%v): ErrWait came with tokens %v", req.Job, req.Resources, g.Tokens)
	}
}

// holder returns the live holder of r ("" when free) and its token.
func holder(t *testing.T, c lease.Coordinator, r string) (string, uint64) {
	t.Helper()
	l, ok, err := c.Holder(context.Background(), r)
	if err != nil {
		t.Fatalf("Holder(%s): %v", r, err)
	}
	if !ok {
		return "", 0
	}
	if l.Resource != r {
		t.Fatalf("Holder(%s) returned a lease on %s", r, l.Resource)
	}
	return l.Job, l.Token
}

func detect(t *testing.T, c lease.Coordinator) []lease.Break {
	t.Helper()
	b, err := c.Detect(context.Background())
	if err != nil {
		t.Fatalf("Detect: %v", err)
	}
	return b
}

func accept(t *testing.T, v lease.Verifier, p lease.Push) {
	t.Helper()
	if err := v.Receive(context.Background(), p); err != nil {
		t.Fatalf("Receive(%s): want accepted, got %v", p.Job, err)
	}
}

// refuse checks p is refused wrapping every sentinel in want, and that the error names every
// resource in named.
func refuse(t *testing.T, v lease.Verifier, p lease.Push, want []error, named []string) {
	t.Helper()
	err := v.Receive(context.Background(), p)
	if err == nil {
		t.Fatalf("Receive(%s, tokens %v, touched %v): accepted, want refused", p.Job, p.Tokens, p.Touched)
	}
	for _, w := range want {
		if !errors.Is(err, w) {
			t.Fatalf("Receive(%s): err %v does not wrap %v", p.Job, err, w)
		}
	}
	for _, r := range named {
		if !strings.Contains(err.Error(), r) {
			t.Fatalf("Receive(%s): refusal does not name %s: %v", p.Job, r, err)
		}
	}
}

func onlyTokens(g lease.Grant, rs ...string) map[string]uint64 {
	m := make(map[string]uint64, len(rs))
	for _, r := range rs {
		m[r] = g.Tokens[r]
	}
	return m
}

// peekJournal runs after() once every Append has returned, while the Acquire that issued it is
// still in progress. A partial grant written and then rolled back is visible to it.
type peekJournal struct {
	journal.Journal
	mu    sync.Mutex
	after func()
}

func (p *peekJournal) Append(ctx context.Context, pr journal.Proposal) (journal.Event, error) {
	ev, err := p.Journal.Append(ctx, pr)
	p.mu.Lock()
	f := p.after
	p.mu.Unlock()
	if f != nil {
		f()
	}
	return ev, err
}

func (p *peekJournal) set(f func()) {
	p.mu.Lock()
	p.after = f
	p.mu.Unlock()
}

// TestB1_04_AllOrNothingNoPartialGrant: one busy resource refuses the whole request, and no
// observer ever sees part of it granted — not the requester's Coordinator, not a second
// Coordinator over the same Journal, not the storage verifier, not even between two Appends of the
// refused Acquire.
//
// Kills: a Coordinator that takes each free resource in turn and rolls back on the first busy one
// (the peek sees A held by job_req); one that keeps the free ones (Holder(A) after the refusal);
// one that holds leases only in memory (the second Coordinator never sees job_b's lease).
func TestB1_04_AllOrNothingNoPartialGrant(t *testing.T) {
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	pj := &peekJournal{Journal: j}
	c := b104Coord(t, pj, clk)
	obs := b104Coord(t, j, clk) // no shared memory with c
	v := b104Verifier(t, j)
	const A, B, C = "repo://beacon/src/a.ts#*", "repo://beacon/src/b.ts#*", "repo://beacon/src/c.ts#*"

	gB := mustGrant(t, c, b104Req("job_b", b104Epoch.Add(time.Second), lease.AllOrNothing, B))
	if h, tok := holder(t, obs, B); h != "job_b" || tok != gB.Tokens[B] {
		t.Fatalf("second Coordinator sees B held by %q token %d, want job_b token %d", h, tok, gB.Tokens[B])
	}

	var seen []string
	pj.set(func() {
		for _, r := range []string{A, C} {
			if h, _ := holder(t, obs, r); h == "job_req" {
				seen = append(seen, r)
			}
		}
	})
	mustWait(t, c, b104Req("job_req", b104Epoch, lease.AllOrNothing, A, B, C))
	pj.set(nil)
	if len(seen) > 0 {
		t.Fatalf("a partial grant was visible mid-Acquire: job_req held %v before the refusal", seen)
	}
	for _, co := range []lease.Coordinator{c, obs} {
		for _, r := range []string{A, C} {
			if h, _ := holder(t, co, r); h != "" {
				t.Fatalf("after the refused request %s is held by %q, want free", r, h)
			}
		}
		if h, tok := holder(t, co, B); h != "job_b" || tok != gB.Tokens[B] {
			t.Fatalf("after the refused request B is held by %q token %d, want job_b token %d", h, tok, gB.Tokens[B])
		}
	}
	for tok := uint64(1); tok <= 3; tok++ {
		refuse(t, v, lease.Push{Job: "job_req", Tokens: map[string]uint64{A: tok}, Touched: []string{A}},
			[]error{lease.ErrStaleToken}, []string{A})
	}
	accept(t, v, lease.Push{Job: "job_b", Tokens: gB.Tokens, Touched: []string{B}})

	// The free resources really are free: a third job takes them, and the observer agrees.
	gAC := mustGrant(t, c, b104Req("job_c", b104Epoch.Add(2*time.Second), lease.AllOrNothing, A, C))
	if h, tok := holder(t, obs, A); h != "job_c" || tok != gAC.Tokens[A] {
		t.Fatalf("A held by %q token %d, want job_c token %d", h, tok, gAC.Tokens[A])
	}
}

// TestB1_04_AllOrNothingRace: two Coordinators over one Journal race overlapping requests {x,y} and
// {y,z}. Every race has exactly one winner, which holds both of its resources; the loser gets
// ErrWait and holds neither.
//
// Kills: check-then-grant outside one storage transition (both win y, or each holds one side);
// per-resource acquisition with rollback (sometimes neither wins).
func TestB1_04_AllOrNothingRace(t *testing.T) {
	const n = 200
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	cs := []lease.Coordinator{b104Coord(t, j, clk), b104Coord(t, j, clk)}
	ctx := context.Background()
	bad := 0
	for i := 0; i < n; i++ {
		x, y, z := fmt.Sprintf("repo://r/%d/x#*", i), fmt.Sprintf("repo://r/%d/y#*", i), fmt.Sprintf("repo://r/%d/z#*", i)
		reqs := []lease.Request{
			b104Req(fmt.Sprintf("job_%d_0", i), b104Epoch, lease.AllOrNothing, x, y),
			b104Req(fmt.Sprintf("job_%d_1", i), b104Epoch.Add(time.Second), lease.AllOrNothing, y, z),
		}
		errs := make([]error, 2)
		start := make(chan struct{})
		var wg sync.WaitGroup
		for k := 0; k < 2; k++ {
			wg.Add(1)
			go func(k int) {
				defer wg.Done()
				<-start
				_, errs[k] = cs[k].Acquire(ctx, reqs[k])
			}(k)
		}
		close(start)
		wg.Wait()
		win := -1
		for k, err := range errs {
			switch {
			case err == nil && win == -1:
				win = k
			case err == nil:
				t.Errorf("race %d: both requests granted (y double-leased)", i)
				bad++
			case !errors.Is(err, lease.ErrWait):
				t.Fatalf("race %d: request %d failed with %v, want nil or ErrWait", i, k, err)
			}
		}
		if win == -1 {
			t.Errorf("race %d: neither request granted", i)
			bad++
			continue
		}
		lose := 1 - win
		for _, r := range reqs[win].Resources {
			if h, _ := holder(t, cs[lose], r); h != reqs[win].Job {
				t.Errorf("race %d: winner's %s held by %q", i, r, h)
				bad++
			}
		}
		for _, r := range reqs[lose].Resources {
			if r == y {
				continue
			}
			if h, _ := holder(t, cs[win], r); h != "" {
				t.Errorf("race %d: loser's %s held by %q, want free", i, r, h)
				bad++
			}
		}
		if bad > 5 {
			t.Fatalf("stopping after %d bad races", bad)
		}
	}
}

// TestB1_04_WoundWait: the older mission wounds a younger holder (the younger's token goes stale at
// storage); a younger mission waits for an older holder and wounds nothing. Age is Born, never the
// job id and never arrival order; both name orders are run.
//
// Kills: wait-die (roles swapped); requester-always-wins; holder-always-wins (plain
// all-or-nothing); ordering by job id; ordering by arrival (young asks first in step 1).
func TestB1_04_WoundWait(t *testing.T) {
	for _, names := range [][2]string{{"zz_old", "aa_young"}, {"aa_old", "zz_young"}} {
		old, young := names[0], names[1]
		t.Run(old+"_vs_"+young, func(t *testing.T) {
			j, _ := b104Open(t)
			clk := &b104Clock{t: b104Epoch}
			c := b104Coord(t, j, clk)
			v := b104Verifier(t, j)
			bornOld, bornYoung := b104Epoch, b104Epoch.Add(time.Minute)
			const R1, R2, R3 = "repo://beacon/src/one.ts#*", "repo://beacon/src/two.ts#*", "repo://beacon/src/three.ts#*"

			// 1. The younger holds R1 first. The older asks for R1 and R2: it wounds and is granted.
			gy := mustGrant(t, c, b104Req(young, bornYoung, lease.WoundWait, R1))
			go1 := mustGrant(t, c, b104Req(old, bornOld, lease.WoundWait, R1, R2))
			if go1.Tokens[R1] <= gy.Tokens[R1] {
				t.Fatalf("wounding grant token %d for R1 is not above the wounded token %d", go1.Tokens[R1], gy.Tokens[R1])
			}
			if h, tok := holder(t, c, R1); h != old || tok != go1.Tokens[R1] {
				t.Fatalf("after the wound R1 is held by %q token %d, want %s token %d", h, tok, old, go1.Tokens[R1])
			}
			refuse(t, v, lease.Push{Job: young, Tokens: onlyTokens(gy, R1), Touched: []string{R1}},
				[]error{lease.ErrStaleToken}, []string{R1})
			accept(t, v, lease.Push{Job: old, Tokens: go1.Tokens, Touched: []string{R1, R2}})

			// 2. The younger asks for R1 (held by the older) and R3 (free): it waits, gets nothing,
			// and the older keeps R1 with the same token.
			mustWait(t, c, b104Req(young, bornYoung, lease.WoundWait, R1, R3))
			if h, tok := holder(t, c, R1); h != old || tok != go1.Tokens[R1] {
				t.Fatalf("younger request disturbed R1: held by %q token %d, want %s token %d", h, tok, old, go1.Tokens[R1])
			}
			if h, _ := holder(t, c, R3); h != "" {
				t.Fatalf("waiting younger request was partly granted: R3 held by %q", h)
			}
			accept(t, v, lease.Push{Job: old, Tokens: go1.Tokens, Touched: []string{R1, R2}})
		})
	}
}

// TestB1_04_DeadlockDetectorBreaksCycle: a constructed three-job cycle is found and broken at its
// youngest mission, which loses every lease (stale at storage) and its wait; the break is journaled;
// a waiter outside the cycle — even a younger one — is never broken; and once broken, the cycle's
// next job can be granted.
//
// Kills: a detector that only finds two-job cycles; one that breaks any waiter or the globally
// youngest waiter (job_0); one that picks the oldest or the first by name; one that reports the
// victim without revoking (Holder(B) and the verifier); one that does not journal.
func TestB1_04_DeadlockDetectorBreaksCycle(t *testing.T) {
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	c := b104Coord(t, j, clk)
	v := b104Verifier(t, j)
	const A, B, C = "repo://beacon/src/a.ts#*", "repo://beacon/src/b.ts#*", "repo://beacon/src/c.ts#*"
	// Name order is unrelated to age. Cycle: job_c → job_a → job_b → job_c. job_a is its youngest;
	// job_0 is younger still but only waits, outside the cycle.
	born := map[string]time.Time{
		"job_c": b104Epoch,
		"job_b": b104Epoch.Add(1 * time.Minute),
		"job_a": b104Epoch.Add(2 * time.Minute),
		"job_0": b104Epoch.Add(3 * time.Minute),
	}
	req := func(job string, res ...string) lease.Request {
		return b104Req(job, born[job], lease.AllOrNothing, res...)
	}
	gA := mustGrant(t, c, req("job_c", A))
	gB := mustGrant(t, c, req("job_a", B))
	gC := mustGrant(t, c, req("job_b", C))

	mustWait(t, c, req("job_c", B)) // job_c waits on job_a
	mustWait(t, c, req("job_a", C)) // job_a waits on job_b
	mustWait(t, c, req("job_0", A)) // job_0 waits on job_c: not a cycle
	if br := detect(t, c); len(br) != 0 {
		t.Fatalf("Detect broke %+v with no cycle in the graph", br)
	}
	mustWait(t, c, req("job_b", A)) // job_b waits on job_c: closes the cycle

	br := detect(t, c)
	if len(br) != 1 || br[0].Victim != "job_a" {
		t.Fatalf("Detect = %+v, want exactly one break with victim job_a (youngest in the cycle)", br)
	}
	cyc := append([]string(nil), br[0].Cycle...)
	sort.Strings(cyc)
	if strings.Join(cyc, ",") != "job_a,job_b,job_c" {
		t.Fatalf("break cycle %v, want job_a, job_b, job_c", br[0].Cycle)
	}
	if h, _ := holder(t, c, B); h != "" {
		t.Fatalf("victim job_a still holds B (held by %q)", h)
	}
	refuse(t, v, lease.Push{Job: "job_a", Tokens: gB.Tokens, Touched: []string{B}}, []error{lease.ErrStaleToken}, []string{B})
	accept(t, v, lease.Push{Job: "job_c", Tokens: gA.Tokens, Touched: []string{A}})
	accept(t, v, lease.Push{Job: "job_b", Tokens: gC.Tokens, Touched: []string{C}})
	if !b104Journaled(t, j, lease.TypeDeadlockBroken, "job_a") {
		t.Fatalf("no %s event naming job_a in the Journal", lease.TypeDeadlockBroken)
	}

	if br := detect(t, c); len(br) != 0 {
		t.Fatalf("second Detect broke %+v; the cycle is already broken", br)
	}
	g := mustGrant(t, c, req("job_c", B))
	if g.Tokens[B] <= gB.Tokens[B] {
		t.Fatalf("B re-granted with token %d, not above the victim's %d", g.Tokens[B], gB.Tokens[B])
	}
}

// b104Journaled reports whether any stream holds an event of type typ whose data mentions job.
func b104Journaled(t *testing.T, j journal.Journal, typ, job string) bool {
	t.Helper()
	ctx := context.Background()
	streams, err := j.Streams(ctx)
	if err != nil {
		t.Fatalf("Streams: %v", err)
	}
	for _, s := range streams {
		evs, err := j.Read(ctx, s, 1)
		if err != nil {
			t.Fatalf("Read %s: %v", s, err)
		}
		for _, ev := range evs {
			if ev.Type == typ && bytes.Contains(ev.Data, []byte(job)) {
				return true
			}
		}
	}
	return false
}

// TestB1_04_TouchedNotDeclaredRefused: the verifier recomputes touched resources and refuses one no
// presented lease covers. A glob covers what is under it and nothing beside it.
//
// Kills: a verifier that checks only the presented tokens; one that matches a glob as a bare string
// prefix (billing.ts); one that matches by file ignoring the symbol (config.ts#<header>); one that
// ignores the repo; one that demands touched == declared (the billing-only positive control).
func TestB1_04_TouchedNotDeclaredRefused(t *testing.T) {
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	c := b104Coord(t, j, clk)
	v := b104Verifier(t, j)
	const glob, cfg = "repo://beacon/src/billing/**", "repo://beacon/src/config.ts#config"
	g := mustGrant(t, c, b104Req("job_billing", b104Epoch, lease.AllOrNothing, glob, cfg))
	in := []string{"repo://beacon/src/billing/invoice.ts#total", "repo://beacon/src/billing/deep/ledger.ts#<eof>"}

	accept(t, v, lease.Push{Job: "job_billing", Tokens: g.Tokens, Touched: append(append([]string(nil), in...), cfg)})
	accept(t, v, lease.Push{Job: "job_billing", Tokens: g.Tokens, Touched: in}) // declared but untouched is fine

	for _, out := range []string{
		"repo://beacon/src/config.ts#<header>",
		"repo://beacon/src/billing.ts#total",
		"repo://other/src/billing/invoice.ts#total",
		"repo://beacon/src/index.ts#*",
	} {
		touched := append(append([]string(nil), in...), out)
		refuse(t, v, lease.Push{Job: "job_billing", Tokens: g.Tokens, Touched: touched}, []error{lease.ErrUndeclared}, []string{out})
	}
	// The lease exists, but no token for it came with the push.
	refuse(t, v, lease.Push{Job: "job_billing", Tokens: onlyTokens(g, glob), Touched: []string{cfg}},
		[]error{lease.ErrUndeclared}, []string{cfg})
}

// b104Fixture is one SP2 dry run, ported from spikes/collision (see the file's "sources").
type b104Fixture struct {
	URIPrefix     string              `json:"uri_prefix"`
	DispatchOrder []string            `json:"dispatch_order"`
	Zombie        string              `json:"zombie"`
	TTLms         int64               `json:"ttl_ms"`
	Hot           []string            `json:"hot"`
	Declared      map[string][]string `json:"declared"`
	Touched       map[string][]string `json:"touched"`
	Greedy        map[string][]string `json:"greedy"`
	ZombieRefused map[string][]string `json:"zombie_refused"`
}

func b104Load(t *testing.T, name string) b104Fixture {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join("testdata", "sp2", name))
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	var f b104Fixture
	dec := json.NewDecoder(bytes.NewReader(raw))
	if err := dec.Decode(&f); err != nil {
		t.Fatalf("parse fixture %s: %v", name, err)
	}
	if f.URIPrefix == "" || len(f.DispatchOrder) != 2 || len(f.Declared) != 2 || len(f.Touched) != 2 {
		t.Fatalf("fixture %s is incomplete: %+v", name, f)
	}
	return f
}

// uris prefixes SP2's file#symbol names with the fixture's repo://.
func (f b104Fixture) uris(lists ...[]string) []string {
	var out []string
	seen := map[string]bool{}
	for _, l := range lists {
		for _, r := range l {
			if u := f.URIPrefix + r; !seen[u] {
				seen[u] = true
				out = append(out, u)
			}
		}
	}
	return out
}

// born orders the fixture's jobs by SP2's dispatch order: the first dispatched is the oldest.
func (f b104Fixture) born(job string) time.Time {
	for i, j := range f.DispatchOrder {
		if j == job {
			return b104Epoch.Add(time.Duration(i) * time.Millisecond)
		}
	}
	panic("fixture job not in dispatch_order: " + job)
}

// TestB1_04_SP2B0Greedy ports SP2's first deadlock (SP2-collision.md §3.2 Finding 1). Greedy:
// replaying B0-greedy's grants — tax takes the undeclared hot resource config.ts#<header>, then
// waits for 7 resources discount holds while discount waits for the header — is a cycle; the
// detector finds it and breaks it at tax, the younger mission, and both then land. All-or-nothing
// (SP2's B0): the same two tasks never deadlock and both land.
//
// Kills: a detector that misses SP2's real cycle or picks discount; all-or-nothing that lets tax
// keep its free declared resources while waiting (it would hold +Region and tax.ts); a verifier
// refusing an honest landing.
func TestB1_04_SP2B0Greedy(t *testing.T) {
	f := b104Load(t, "b0-greedy.json")
	disc, tax := f.DispatchOrder[0], f.DispatchOrder[1]
	req := func(job string, res []string) lease.Request {
		return b104Req(job, f.born(job), lease.AllOrNothing, res...)
	}
	land := func(t *testing.T, c lease.Coordinator, v lease.Verifier, job string, g lease.Grant) {
		t.Helper()
		accept(t, v, lease.Push{Job: job, Tokens: g.Tokens, Touched: f.uris(f.Touched[job])})
		if err := c.Release(context.Background(), job); err != nil {
			t.Fatalf("Release(%s): %v", job, err)
		}
	}

	t.Run("greedy_deadlock_broken", func(t *testing.T) {
		j, _ := b104Open(t)
		clk := &b104Clock{t: b104Epoch}
		c := b104Coord(t, j, clk)
		v := b104Verifier(t, j)
		gd := mustGrant(t, c, req(disc, f.uris(f.Declared[disc])))
		mustGrant(t, c, req(tax, f.uris(f.Greedy["tax_dispatch_granted"])))
		gHdr := mustGrant(t, c, req(tax, f.uris(f.Greedy["tax_land_granted"])))
		mustWait(t, c, req(tax, f.uris(f.Greedy["tax_missing"])))
		if br := detect(t, c); len(br) != 0 {
			t.Fatalf("Detect broke %+v before discount waited", br)
		}
		mustWait(t, c, req(disc, f.uris(f.Greedy["discount_missing"])))
		br := detect(t, c)
		if len(br) != 1 || br[0].Victim != tax {
			t.Fatalf("Detect = %+v, want one break with victim %s (younger by dispatch order)", br, tax)
		}
		for _, r := range f.uris(f.Greedy["tax_dispatch_granted"], f.Greedy["tax_land_granted"]) {
			if h, _ := holder(t, c, r); h != "" {
				t.Fatalf("victim's %s still held by %q", r, h)
			}
		}
		hdr := f.uris(f.Hot)
		refuse(t, v, lease.Push{Job: tax, Tokens: gHdr.Tokens, Touched: hdr}, []error{lease.ErrStaleToken}, hdr)

		gh := mustGrant(t, c, req(disc, f.uris(f.Greedy["discount_missing"])))
		all := lease.Grant{Job: disc, Tokens: map[string]uint64{}}
		for _, g := range []lease.Grant{gd, gh} {
			for r, tok := range g.Tokens {
				all.Tokens[r] = tok
			}
		}
		land(t, c, v, disc, all)
		land(t, c, v, tax, mustGrant(t, c, req(tax, f.uris(f.Declared[tax], f.Hot))))
		if br := detect(t, c); len(br) != 0 {
			t.Fatalf("Detect broke %+v after both landed", br)
		}
	})

	t.Run("all_or_nothing_never_deadlocks", func(t *testing.T) {
		j, _ := b104Open(t)
		clk := &b104Clock{t: b104Epoch}
		c := b104Coord(t, j, clk)
		v := b104Verifier(t, j)
		gd := mustGrant(t, c, req(disc, f.uris(f.Declared[disc])))
		mustWait(t, c, req(tax, f.uris(f.Declared[tax])))
		for _, r := range f.uris(f.Declared[tax]) {
			if h, _ := holder(t, c, r); h == tax {
				t.Fatalf("waiting tax holds %s", r)
			}
		}
		mustWait(t, c, req(tax, f.uris(f.Declared[tax], f.Hot))) // tax at land, hot header included
		gh := mustGrant(t, c, req(disc, f.uris(f.Hot)))          // so the header is still free for discount
		if br := detect(t, c); len(br) != 0 {
			t.Fatalf("all-or-nothing deadlocked: Detect broke %+v", br)
		}
		all := lease.Grant{Job: disc, Tokens: map[string]uint64{}}
		for _, g := range []lease.Grant{gd, gh} {
			for r, tok := range g.Tokens {
				all.Tokens[r] = tok
			}
		}
		land(t, c, v, disc, all)
		land(t, c, v, tax, mustGrant(t, c, req(tax, f.uris(f.Declared[tax], f.Hot))))
		if br := detect(t, c); len(br) != 0 {
			t.Fatalf("Detect broke %+v after both landed", br)
		}
	})
}

// TestB1_04_SP2DrillStaleHolderRejectedByStorage ports SP2's drill (SP2-collision.md §3.2 Finding
// 4). discount's leases are not renewed and expire; tax is granted the resources with higher tokens
// and lands; discount then pushes STRAIGHT TO STORAGE with the tokens it remembers, never asking a
// Coordinator. The verifier refuses exactly SP2's 7 resources (6 stale tokens and the undeclared
// header), from Journal state alone: a fresh Verifier, and one over the Journal reopened from disk,
// refuse it too. discount then re-acquires with higher tokens and lands.
//
// Kills: a verifier that trusts the presented token (accepts the zombie); one that accepts any token
// at least the current one (the forged push); one that checks the token but not its holder (the
// borrowed push); one that reads a Coordinator's memory rather than storage (the reopened Journal);
// a Coordinator whose re-grant token does not exceed the expired one.
func TestB1_04_SP2DrillStaleHolderRejectedByStorage(t *testing.T) {
	f := b104Load(t, "b0-drill.json")
	disc, tax := f.DispatchOrder[0], f.DispatchOrder[1]
	if f.Zombie != disc || f.TTLms <= 0 {
		t.Fatalf("fixture zombie %q ttl %d, want %s and a positive ttl", f.Zombie, f.TTLms, disc)
	}
	ttl := time.Duration(f.TTLms) * time.Millisecond
	req := func(job string, res []string) lease.Request {
		r := b104Req(job, f.born(job), lease.AllOrNothing, res...)
		r.TTL = ttl
		return r
	}
	j, path := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	cDisc := b104Coord(t, j, clk)
	cTax := b104Coord(t, j, clk)

	remembered := mustGrant(t, cDisc, req(disc, f.uris(f.Declared[disc]))).Tokens
	mustWait(t, cTax, req(tax, f.uris(f.Declared[tax])))
	clk.Advance(ttl + time.Second) // discount hung: never renewed
	gTax := mustGrant(t, cTax, req(tax, f.uris(f.Declared[tax], f.Hot)))
	for _, r := range f.uris(f.Declared[tax]) {
		if old, ok := remembered[r]; ok && gTax.Tokens[r] <= old {
			t.Fatalf("%s re-granted with token %d, not above the expired %d", r, gTax.Tokens[r], old)
		}
	}
	accept(t, b104Verifier(t, j), lease.Push{Job: tax, Tokens: gTax.Tokens, Touched: f.uris(f.Touched[tax])})

	zombie := lease.Push{Job: disc, Tokens: remembered, Touched: f.uris(f.Touched[disc])}
	named := f.uris(f.ZombieRefused["stale"], f.ZombieRefused["undeclared"])
	if len(named) != 7 {
		t.Fatalf("fixture names %d refused resources, SP2 recorded 7", len(named))
	}
	both := []error{lease.ErrStaleToken, lease.ErrUndeclared}
	refuse(t, b104Verifier(t, j), zombie, both, named)

	forged := map[string]uint64{}
	for r := range remembered {
		forged[r] = 1 << 40
	}
	stale := f.uris(f.ZombieRefused["stale"])
	refuse(t, b104Verifier(t, j), lease.Push{Job: disc, Tokens: forged, Touched: stale}, []error{lease.ErrStaleToken}, stale)
	refuse(t, b104Verifier(t, j), lease.Push{Job: disc, Tokens: gTax.Tokens, Touched: stale}, []error{lease.ErrStaleToken}, stale)

	if err := cTax.Release(context.Background(), tax); err != nil {
		t.Fatalf("Release(%s): %v", tax, err)
	}
	gDisc := mustGrant(t, cDisc, req(disc, f.uris(f.Declared[disc], f.Hot)))
	for r, old := range remembered {
		if gDisc.Tokens[r] <= old {
			t.Fatalf("%s re-acquired with token %d, not above the zombie's %d", r, gDisc.Tokens[r], old)
		}
	}
	accept(t, b104Verifier(t, j), lease.Push{Job: disc, Tokens: gDisc.Tokens, Touched: f.uris(f.Touched[disc])})
	refuse(t, b104Verifier(t, j), zombie, []error{lease.ErrStaleToken}, f.uris(f.ZombieRefused["stale"]))

	// From disk alone: close the Journal every Coordinator used, reopen the file, build a Verifier
	// that has never met a Coordinator.
	if err := j.Close(); err != nil {
		t.Fatalf("close journal: %v", err)
	}
	j2, err := journal.Open(path)
	if err != nil {
		t.Fatalf("reopen journal: %v", err)
	}
	defer j2.Close()
	v2 := b104Verifier(t, j2)
	refuse(t, v2, zombie, []error{lease.ErrStaleToken}, f.uris(f.ZombieRefused["stale"]))
	accept(t, v2, lease.Push{Job: disc, Tokens: gDisc.Tokens, Touched: f.uris(f.Touched[disc])})
}
