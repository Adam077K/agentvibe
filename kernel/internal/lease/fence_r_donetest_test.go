//go:build donetest

// B1-04 remainder done-test (B1-04r). B1-04's row (docs/vision-v3/14-BUILD-PLAN.md §6) names "hot
// resources" and its acceptance "SP2 B0-greedy + drill fixtures nightly"; the frozen B1-04 file
// (fence_donetest_test.go) left both out, and max_wait with them. Hash-registered in
// build/done-tests/B1-04r.yml. The contract it freezes is hot.go and nightly.go, plus Request.MaxWait
// and the three hot methods on Coordinator in fence.go; none of those is registered.
//
// It reuses the frozen file's helpers (b104Open, b104Coord, holder, wantWait, accept, refuse,
// detect, b104Journaled, b104Load) and does not edit it.
//
// Every clock is injected; nothing sleeps. Each test names the wrong implementation it kills.
//
// Run: go -C kernel test -tags donetest -count=1 -run B1_04R ./internal/lease/
package lease_test

import (
	"context"
	"errors"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

func r04Keys(g lease.Grant) []string {
	out := make([]string, 0, len(g.Tokens))
	for r := range g.Tokens {
		out = append(out, r)
	}
	sort.Strings(out)
	return out
}

func r04Sorted(rs ...string) []string {
	out := append([]string(nil), rs...)
	sort.Strings(out)
	return out
}

func r04Same(a, b []string) bool { return strings.Join(a, "\n") == strings.Join(b, "\n") }

// r04Grant acquires and checks the Grant covers exactly want, every token equal and nonzero.
func r04Grant(t *testing.T, c lease.Coordinator, req lease.Request, want []string) lease.Grant {
	t.Helper()
	g, err := c.Acquire(context.Background(), req)
	if err != nil {
		t.Fatalf("%s Acquire(%v): want a grant, got %v", req.Job, req.Resources, err)
	}
	if got := r04Keys(g); !r04Same(got, r04Sorted(want...)) {
		t.Fatalf("%s Acquire(%v): grant covers %v, want exactly %v", req.Job, req.Resources, got, r04Sorted(want...))
	}
	var tok uint64
	for r, v := range g.Tokens {
		if v == 0 || (tok != 0 && v != tok) {
			t.Fatalf("%s Acquire: token %d for %s in %v; want one nonzero token for the whole grant", req.Job, v, r, g.Tokens)
		}
		tok = v
	}
	return g
}

func r04AddHot(t *testing.T, c lease.Coordinator, rs ...string) {
	t.Helper()
	for _, r := range rs {
		if err := c.AddHot(context.Background(), r); err != nil {
			t.Fatalf("AddHot(%s): %v", r, err)
		}
	}
}

func r04HotSet(t *testing.T, c lease.Coordinator) []string {
	t.Helper()
	got, err := c.HotSet(context.Background())
	if err != nil {
		t.Fatalf("HotSet: %v", err)
	}
	return got
}

func r04Candidates(t *testing.T, c lease.Coordinator) []string {
	t.Helper()
	got, err := c.HotCandidates(context.Background())
	if err != nil {
		t.Fatalf("HotCandidates: %v", err)
	}
	return got
}

// TestB1_04R_HotAutoAddedAndFenced ports SP2 finding (2) (09a §6): the declared footprint missed
// src/config.ts#<header> in 2 of 2 tasks. With it in the hot set, Acquire adds it to every footprint
// that touches config.ts, so the land is not refused as undeclared, a second job touching config.ts
// waits on it, and the storage fence refuses the first job's old token for it.
//
// Kills: no auto-add (discount's land is refused ErrUndeclared; tax is granted beside it); a hot set
// held in one Coordinator's memory (the second Coordinator grants tax); adding hot resources to the
// Grant but not to the wait or the lease row (Holder(<header>) is empty, the verifier refuses the
// land); adding every hot resource to every request (pricing.ts gains <header>); an auto-added
// lease the verifier does not fence (discount's old <header> token is accepted after tax re-took it).
func TestB1_04R_HotAutoAddedAndFenced(t *testing.T) {
	ctx := context.Background()
	f := b104Load(t, "b0-greedy.json")
	if len(f.Hot) != 1 {
		t.Fatalf("fixture hot = %v, want SP2's one hot resource", f.Hot)
	}
	disc, tax := f.DispatchOrder[0], f.DispatchOrder[1]
	hdr := f.uris(f.Hot)[0]
	declared := f.uris(f.Declared[disc])
	for _, r := range declared {
		if r == hdr {
			t.Fatalf("fixture: %s declared %s; SP2 says the footprint missed it", disc, hdr)
		}
	}

	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	c := b104Coord(t, j, clk)
	v := b104Verifier(t, j)
	r04AddHot(t, c, hdr, hdr) // the second add is a no-op
	if got := r04HotSet(t, c); !r04Same(got, []string{hdr}) {
		t.Fatalf("HotSet = %v, want [%s]", got, hdr)
	}

	gd := r04Grant(t, c, b104Req(disc, f.born(disc), lease.AllOrNothing, declared...), append(append([]string(nil), declared...), hdr))
	if h, tok := holder(t, c, hdr); h != disc || tok != gd.Tokens[hdr] {
		t.Fatalf("Holder(%s) = %q token %d, want %s token %d", hdr, h, tok, disc, gd.Tokens[hdr])
	}

	// A restarted Coordinator applies the same hot set: tax touches config.ts, so it waits on
	// <header>, and nothing of its request is granted.
	c2 := b104Coord(t, j, clk)
	taxRate := f.URIPrefix + "src/config.ts#taxRate"
	mustWait(t, c2, b104Req(tax, f.born(tax), lease.AllOrNothing, taxRate))
	wantWait(t, c2, tax, taxRate, hdr)
	if h, _ := holder(t, c2, taxRate); h != "" {
		t.Fatalf("%s granted beside a busy hot resource: Holder(%s) = %q", tax, taxRate, h)
	}

	// A footprint that does not touch config.ts gains nothing.
	pricing := f.URIPrefix + "src/pricing.ts#unused"
	r04Grant(t, c2, b104Req("job_other", f.born(tax).Add(time.Second), lease.AllOrNothing, pricing), []string{pricing})

	// discount lands what SP2 measured it touched, <header> included.
	accept(t, v, lease.Push{Job: disc, Tokens: gd.Tokens, Touched: f.uris(f.Touched[disc])})
	if err := c.Release(ctx, disc); err != nil {
		t.Fatalf("Release(%s): %v", disc, err)
	}
	gt := r04Grant(t, c2, b104Req(tax, f.born(tax), lease.AllOrNothing, taxRate), []string{taxRate, hdr})
	if gt.Tokens[hdr] <= gd.Tokens[hdr] {
		t.Fatalf("re-grant of %s: token %d not above %d", hdr, gt.Tokens[hdr], gd.Tokens[hdr])
	}
	// The auto-added lease is fenced like a declared one.
	refuse(t, v, lease.Push{Job: disc, Tokens: map[string]uint64{hdr: gd.Tokens[hdr]}, Touched: []string{hdr}},
		[]error{lease.ErrStaleToken}, []string{hdr})
	accept(t, v, lease.Push{Job: tax, Tokens: gt.Tokens, Touched: []string{hdr, taxRate}})
}

// TestB1_04R_HotTouchRule pins which footprints touch a hot resource's file: the file itself, any
// symbol of it, and a glob that covers it. Nothing beside it.
//
// Kills: matching by bare string prefix (config.tsx, config.ts.bak); ignoring globs (src/** writes
// config.ts unfenced, the SP2 miss again); a glob matched as a bare prefix (src/conf/**); ignoring the
// repository (repo://other); adding a resource the request already names a second time.
func TestB1_04R_HotTouchRule(t *testing.T) {
	const p = "repo://shop-core/"
	hdr := p + "src/config.ts#<header>"
	cases := []struct {
		name  string
		req   []string
		added bool
	}{
		{"bare file", []string{p + "src/config.ts"}, true},
		{"symbol of the file", []string{p + "src/config.ts#config"}, true},
		{"glob over the directory", []string{p + "src/**"}, true},
		{"glob over the repository", []string{p + "**"}, true},
		{"hot resource named already", []string{p + "src/config.ts#<header>", p + "src/config.ts#config"}, false},
		{"longer file name", []string{p + "src/config.tsx#config"}, false},
		{"backup file", []string{p + "src/config.ts.bak"}, false},
		{"glob beside it", []string{p + "src/conf/**"}, false},
		{"glob elsewhere", []string{p + "lib/**"}, false},
		{"other repository", []string{"repo://other/src/config.ts#config"}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			j, _ := b104Open(t)
			clk := &b104Clock{t: b104Epoch}
			c := b104Coord(t, j, clk)
			r04AddHot(t, c, hdr)
			want := append([]string(nil), tc.req...)
			if tc.added {
				want = append(want, hdr)
			}
			r04Grant(t, c, b104Req("job_a", b104Epoch, lease.AllOrNothing, tc.req...), want)
		})
	}
}

// r04Cycle builds one two-job wait-for cycle over r1 and r2 and lets Detect break it: a holds r1 and
// waits on r2, b holds r2 and waits on r1. Both resources are on the cycle. Then it frees both.
func r04Cycle(t *testing.T, c lease.Coordinator, born time.Time, a, b, r1, r2 string) {
	t.Helper()
	ctx := context.Background()
	r04Grant(t, c, b104Req(a, born, lease.AllOrNothing, r1), []string{r1})
	r04Grant(t, c, b104Req(b, born.Add(time.Second), lease.AllOrNothing, r2), []string{r2})
	mustWait(t, c, b104Req(a, born, lease.AllOrNothing, r2))
	mustWait(t, c, b104Req(b, born.Add(time.Second), lease.AllOrNothing, r1))
	if br := detect(t, c); len(br) != 1 || br[0].Victim != b {
		t.Fatalf("Detect = %+v, want one break at %s", br, b)
	}
	for _, job := range []string{a, b} {
		if err := c.Release(ctx, job); err != nil {
			t.Fatalf("Release(%s): %v", job, err)
		}
	}
}

// TestB1_04R_HotThresholdProposesNotAdds: 09a §6 "a resource in three cycles a week (parameter) is
// proposed to 04 as a hot resource". At the threshold the resource is a candidate; below it it is
// not; counting is per resource; a candidate is not hot until AddHot; the answer is read from the
// Journal, so it is the same after a restart and does not move on a second ask; a week later it is
// gone. All three cycles fall in one morning, so a rolling and a calendar week agree here.
//
// Kills: auto-adding at the threshold (HotSet grows); a threshold of two (ra after two cycles);
// counting cycles rather than cycles per resource (rb and rc proposed); counting only the victim's
// released rows (ra, held by the older job, never counted); counts in memory (the restarted
// Coordinator proposes nothing); no window (still proposed eight days later); proposing what is
// already hot.
func TestB1_04R_HotThresholdProposesNotAdds(t *testing.T) {
	const p = "repo://x/"
	ra, rb, rc := p+"src/a.ts#<header>", p+"src/b.ts#<header>", p+"src/c.ts#<header>"
	if lease.HotCycleThreshold != 3 {
		t.Fatalf("HotCycleThreshold = %d, want 09a §6's three", lease.HotCycleThreshold)
	}
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	c := b104Coord(t, j, clk)

	r04Cycle(t, c, b104Epoch, "a1", "b1", ra, rb)
	clk.Advance(time.Hour)
	r04Cycle(t, c, b104Epoch.Add(time.Hour), "a2", "b2", ra, rb)
	if got := r04Candidates(t, c); len(got) != 0 {
		t.Fatalf("after two cycles HotCandidates = %v, want none", got)
	}
	clk.Advance(time.Hour)
	r04Cycle(t, c, b104Epoch.Add(2*time.Hour), "a3", "b3", ra, rc)
	clk.Advance(time.Hour)

	for i := 0; i < 2; i++ {
		if got := r04Candidates(t, c); !r04Same(got, []string{ra}) {
			t.Fatalf("ask %d: HotCandidates = %v, want [%s] (ra 3 cycles, rb 2, rc 1)", i+1, got, ra)
		}
	}
	if got := r04HotSet(t, c); len(got) != 0 {
		t.Fatalf("HotSet = %v after the threshold; a candidate is proposed, not added", got)
	}
	if got := r04Candidates(t, b104Coord(t, j, clk)); !r04Same(got, []string{ra}) {
		t.Fatalf("restarted Coordinator: HotCandidates = %v, want [%s]", got, ra)
	}
	later := &b104Clock{t: clk.Now().Add(8 * 24 * time.Hour)}
	if got := r04Candidates(t, b104Coord(t, j, later)); len(got) != 0 {
		t.Fatalf("eight days later HotCandidates = %v, want none", got)
	}
	r04AddHot(t, c, ra)
	if got := r04Candidates(t, c); len(got) != 0 {
		t.Fatalf("after AddHot(%s) HotCandidates = %v, want none", ra, got)
	}
}

// TestB1_04R_MaxWaitStarvesYoungestWaiter: 09a §6 "max_wait_s: 120 # detector's hard cap → release
// all, requeue, event lease.starved". The waiter here is younger than the holder it waits on, so
// it is the youngest mission either way the spec is read. Within the cap nothing happens; past it,
// Detect — on a restarted Coordinator — releases everything the waiter holds, drops its wait and
// journals lease.starved naming it. The older holder keeps its lease.
//
// Kills: MaxWait ignored (nothing starves); the cap measured from the request's Born or from the
// grant rather than from the wait (starves at 119 s); the wait's start held in memory (the restarted
// Coordinator sees no age); starving without releasing (Holder(r1) is still young); releasing
// without dropping the wait; no lease.starved event; starving the holder instead.
func TestB1_04R_MaxWaitStarvesYoungestWaiter(t *testing.T) {
	const p = "repo://x/"
	r1, r2 := p+"src/one.ts#f", p+"src/two.ts#g"
	const maxWait = 120 * time.Second
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	c := b104Coord(t, j, clk)
	oldBorn, youngBorn := b104Epoch.Add(-time.Hour), b104Epoch.Add(-time.Minute)

	old := b104Req("old", oldBorn, lease.AllOrNothing, r2)
	old.TTL = time.Hour
	r04Grant(t, c, old, []string{r2})
	clk.Advance(5 * time.Minute) // the young job's grant is old news before it waits
	young := b104Req("young", youngBorn, lease.AllOrNothing, r1)
	young.TTL = time.Hour
	r04Grant(t, c, young, []string{r1})
	wait := b104Req("young", youngBorn, lease.AllOrNothing, r2)
	wait.TTL, wait.MaxWait = time.Hour, maxWait
	clk.Advance(30 * time.Second) // the cap runs from the wait, not from the grant
	mustWait(t, c, wait)

	clk.Advance(maxWait - time.Second)
	if br := detect(t, c); len(br) != 0 {
		t.Fatalf("Detect inside the cap = %+v, want nothing broken", br)
	}
	if h, _ := holder(t, c, r1); h != "young" {
		t.Fatalf("inside the cap Holder(%s) = %q, want young", r1, h)
	}
	wantWait(t, c, "young", r2)
	if b104Journaled(t, j, lease.TypeStarved, "young") {
		t.Fatalf("lease.starved journaled inside the cap")
	}

	clk.Advance(2 * time.Second)
	c2 := b104Coord(t, j, clk)
	detect(t, c2)
	if h, _ := holder(t, c2, r1); h != "" {
		t.Fatalf("starved waiter still holds %s (%q)", r1, h)
	}
	wantWait(t, c2, "young")
	if !b104Journaled(t, j, lease.TypeStarved, "young") {
		t.Fatalf("no lease.starved event naming young")
	}
	if h, _ := holder(t, c2, r2); h != "old" {
		t.Fatalf("Holder(%s) = %q, want old untouched", r2, h)
	}
}

// r04Nightly builds the scheduler; a nil run counts its calls and passes.
func r04Nightly(t *testing.T, j journal.Journal, w lease.NightWindow, clk *b104Clock, calls *atomic.Int32, run func(context.Context) error) lease.Nightly {
	t.Helper()
	if run == nil {
		run = func(context.Context) error { calls.Add(1); return nil }
	}
	n, err := lease.NewNightly(j, "sp2-drill", w, clk.Now, run)
	if err != nil {
		t.Fatalf("NewNightly: %v", err)
	}
	if n == nil {
		t.Fatalf("NewNightly returned nil and no error")
	}
	return n
}

func r04Tick(t *testing.T, n lease.Nightly, want bool, at time.Time) {
	t.Helper()
	got, err := n.Tick(context.Background())
	if err != nil {
		t.Fatalf("Tick at %s: %v", at.Format(time.RFC3339), err)
	}
	if got != want {
		t.Fatalf("Tick at %s fired=%v, want %v", at.Format(time.RFC3339), got, want)
	}
}

func r04Runs(t *testing.T, n lease.Nightly) []lease.NightlyRun {
	t.Helper()
	runs, err := n.Runs(context.Background())
	if err != nil {
		t.Fatalf("Runs: %v", err)
	}
	return runs
}

var r04Window = lease.NightWindow{Start: 23 * time.Hour, Length: 5 * time.Hour, Loc: time.UTC}

// TestB1_04R_NightlyFiresOncePerWindow: the window 23:00–04:00 UTC crosses midnight. It fires on
// the first Tick inside it, never again that night, never outside it, and again the next night.
// The window is half-open. Malformed construction is refused.
//
// Kills: firing on the first Tick whatever the hour (12:00 fires); keying the night by now's date
// (02:00 fires again); an inclusive end (04:00 fires); firing once ever (the next night is silent);
// firing on every Tick in the window.
func TestB1_04R_NightlyFiresOncePerWindow(t *testing.T) {
	j, _ := b104Open(t)
	day := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	clk := &b104Clock{t: day.Add(12 * time.Hour)}
	var calls atomic.Int32
	n := r04Nightly(t, j, r04Window, clk, &calls, nil)

	steps := []struct {
		at   time.Duration // from day
		fire bool
	}{
		{12 * time.Hour, false},
		{23*time.Hour - time.Nanosecond, false},
		{23 * time.Hour, true},
		{23*time.Hour + 30*time.Minute, false},
		{26 * time.Hour, false}, // 02:00 the next date, same night
		{28*time.Hour - time.Nanosecond, false},
		{28 * time.Hour, false}, // 04:00: the window has closed
		{36 * time.Hour, false},
		{47 * time.Hour, true}, // 23:00 on 2 October
	}
	for _, s := range steps {
		clk.t = day.Add(s.at)
		r04Tick(t, n, s.fire, clk.t)
	}
	if calls.Load() != 2 {
		t.Fatalf("run called %d times, want 2", calls.Load())
	}
	runs := r04Runs(t, n)
	if len(runs) != 2 || runs[0].Night != "2026-10-01" || runs[1].Night != "2026-10-02" || !runs[0].Passed || !runs[1].Passed {
		t.Fatalf("Runs = %+v, want passed runs for nights 2026-10-01 and 2026-10-02", runs)
	}

	ok := func(context.Context) error { return nil }
	bad := []struct {
		name string
		j    journal.Journal
		w    lease.NightWindow
		now  func() time.Time
		run  func(context.Context) error
		job  string
	}{
		{"nil journal", nil, r04Window, clk.Now, ok, "x"},
		{"nil clock", j, r04Window, nil, ok, "x"},
		{"nil run", j, r04Window, clk.Now, nil, "x"},
		{"nil location", j, lease.NightWindow{Start: time.Hour, Length: time.Hour}, clk.Now, ok, "x"},
		{"empty name", j, r04Window, clk.Now, ok, ""},
		{"zero length", j, lease.NightWindow{Start: time.Hour, Loc: time.UTC}, clk.Now, ok, "x"},
		{"longer than a day", j, lease.NightWindow{Start: time.Hour, Length: 25 * time.Hour, Loc: time.UTC}, clk.Now, ok, "x"},
		{"start past midnight", j, lease.NightWindow{Start: 24 * time.Hour, Length: time.Hour, Loc: time.UTC}, clk.Now, ok, "x"},
		{"negative start", j, lease.NightWindow{Start: -time.Hour, Length: time.Hour, Loc: time.UTC}, clk.Now, ok, "x"},
	}
	for _, b := range bad {
		if n, err := lease.NewNightly(b.j, b.job, b.w, b.now, b.run); err == nil || n != nil {
			t.Fatalf("NewNightly(%s) = %v, %v; want refused", b.name, n, err)
		}
	}
}

// TestB1_04R_NightlyWindowInLocation: the window is local time. 02:00–04:00 at UTC+3 is 23:00–01:00
// UTC of the previous date, and the night is the local date.
//
// Kills: reading Start in UTC (23:00 UTC is silent, 02:00 UTC fires); naming the night by the UTC
// date (2026-10-01).
func TestB1_04R_NightlyWindowInLocation(t *testing.T) {
	j, _ := b104Open(t)
	loc := time.FixedZone("UTC+3", 3*3600)
	w := lease.NightWindow{Start: 2 * time.Hour, Length: 2 * time.Hour, Loc: loc}
	clk := &b104Clock{t: time.Date(2026, 10, 2, 2, 0, 0, 0, time.UTC)} // 05:00 local
	var calls atomic.Int32
	n := r04Nightly(t, j, w, clk, &calls, nil)
	r04Tick(t, n, false, clk.t)
	clk.t = time.Date(2026, 10, 1, 22, 59, 0, 0, time.UTC) // 01:59 local
	r04Tick(t, n, false, clk.t)
	clk.t = time.Date(2026, 10, 1, 23, 0, 0, 0, time.UTC) // 02:00 local, 2 October
	r04Tick(t, n, true, clk.t)
	if runs := r04Runs(t, n); len(runs) != 1 || runs[0].Night != "2026-10-02" {
		t.Fatalf("Runs = %+v, want one run for local night 2026-10-02", runs)
	}
}

// TestB1_04R_NightlyIdempotentAcrossRestart: a night claimed before a restart is not fired again
// after it, and a failed run is recorded and not retried that night.
//
// Kills: the fired night held in memory (the reopened scheduler fires again); recording only
// passes (the failure is missing from Runs, or shows as passed); retrying a failed night.
func TestB1_04R_NightlyIdempotentAcrossRestart(t *testing.T) {
	t.Run("restart", func(t *testing.T) {
		j, path := b104Open(t)
		clk := &b104Clock{t: time.Date(2026, 10, 1, 23, 10, 0, 0, time.UTC)}
		var calls atomic.Int32
		r04Tick(t, r04Nightly(t, j, r04Window, clk, &calls, nil), true, clk.t)
		if err := j.Close(); err != nil {
			t.Fatalf("Close: %v", err)
		}
		j2, err := journal.Open(path)
		if err != nil {
			t.Fatalf("reopen: %v", err)
		}
		t.Cleanup(func() { j2.Close() })
		n2 := r04Nightly(t, j2, r04Window, clk, &calls, nil)
		clk.t = time.Date(2026, 10, 2, 1, 0, 0, 0, time.UTC)
		r04Tick(t, n2, false, clk.t)
		if calls.Load() != 1 {
			t.Fatalf("run called %d times across the restart, want 1", calls.Load())
		}
		if runs := r04Runs(t, n2); len(runs) != 1 || runs[0].Night != "2026-10-01" || !runs[0].Passed {
			t.Fatalf("Runs after restart = %+v, want one passed run for 2026-10-01", runs)
		}
		clk.t = time.Date(2026, 10, 2, 23, 0, 0, 0, time.UTC)
		r04Tick(t, n2, true, clk.t)
	})
	t.Run("failed run", func(t *testing.T) {
		j, _ := b104Open(t)
		clk := &b104Clock{t: time.Date(2026, 10, 1, 23, 10, 0, 0, time.UTC)}
		var calls atomic.Int32
		const why = "SP2 drill: stale holder accepted on src/config.ts#<header>"
		n := r04Nightly(t, j, r04Window, clk, &calls, func(context.Context) error {
			calls.Add(1)
			return errors.New(why)
		})
		if fired, _ := n.Tick(context.Background()); !fired {
			t.Fatalf("Tick in the window did not fire")
		}
		clk.t = clk.t.Add(time.Hour)
		r04Tick(t, n, false, clk.t)
		if calls.Load() != 1 {
			t.Fatalf("failed run called %d times in one night, want 1", calls.Load())
		}
		runs := r04Runs(t, n)
		if len(runs) != 1 || runs[0].Passed || !strings.Contains(runs[0].Detail, why) {
			t.Fatalf("Runs = %+v, want one failed run whose Detail carries %q", runs, why)
		}
	})
}

// TestB1_04R_NightlyOneFireUnderRace: the claim is made before run is called and is decided by the
// Journal. A second scheduler ticking while the first run is still in progress does not fire, and
// eight schedulers ticking at once fire once.
//
// Kills: claiming after run returns (the second scheduler fires mid-run); read-then-append without
// ExpectSeq (two of the eight fire); a per-instance lock instead of a Journal claim.
func TestB1_04R_NightlyOneFireUnderRace(t *testing.T) {
	t.Run("mid-run", func(t *testing.T) {
		j, _ := b104Open(t)
		clk := &b104Clock{t: time.Date(2026, 10, 1, 23, 10, 0, 0, time.UTC)}
		var calls atomic.Int32
		started, release := make(chan struct{}), make(chan struct{})
		n1 := r04Nightly(t, j, r04Window, clk, &calls, func(context.Context) error {
			calls.Add(1)
			close(started)
			<-release
			return nil
		})
		done := make(chan bool, 1)
		go func() {
			fired, _ := n1.Tick(context.Background())
			done <- fired
		}()
		<-started
		n2 := r04Nightly(t, j, r04Window, clk, &calls, nil)
		got, err := n2.Tick(context.Background())
		close(release)
		if err != nil || got {
			t.Fatalf("second scheduler mid-run: fired=%v err=%v, want not fired", got, err)
		}
		if !<-done {
			t.Fatalf("first scheduler did not report firing")
		}
		if calls.Load() != 1 {
			t.Fatalf("run called %d times, want 1", calls.Load())
		}
	})
	t.Run("eight at once", func(t *testing.T) {
		j, _ := b104Open(t)
		clk := &b104Clock{t: time.Date(2026, 10, 1, 23, 10, 0, 0, time.UTC)}
		var calls, fired atomic.Int32
		ns := make([]lease.Nightly, 8)
		for i := range ns {
			ns[i] = r04Nightly(t, j, r04Window, clk, &calls, nil)
		}
		var wg sync.WaitGroup
		gate := make(chan struct{})
		for _, n := range ns {
			wg.Add(1)
			go func(n lease.Nightly) {
				defer wg.Done()
				<-gate
				if ok, _ := n.Tick(context.Background()); ok {
					fired.Add(1)
				}
			}(n)
		}
		close(gate)
		wg.Wait()
		if fired.Load() != 1 || calls.Load() != 1 {
			t.Fatalf("eight concurrent Ticks: %d fired, run called %d times; want 1 and 1", fired.Load(), calls.Load())
		}
	})
}
