//go:build donetest

// B1-04r follow-up LC-2 done-test: "Acquire must refuse a grant that overlaps a lease another job
// holds", and the follow-up "refuse non-canonical names at Acquire" (same entry point). Hash-registered
// in build/done-tests/B1-04r.yml (RE-FREEZE r7). The contract it freezes is Coordinator.Acquire and
// Detect in fence.go, which are NOT registered: they are what the job implements. It reuses the
// helpers of the frozen B1-04 file (fence_donetest_test.go), of fence_r_donetest_test.go and of
// fence_cover_donetest_test.go, and changes nothing there.
//
// The holes, each measured by a probe against main @963613b before this file was written: job_a holds
// repo://a/** and job_b is granted repo://a/x.ts#f, and the reverse; repo://a/** and repo://a/src/**
// are both granted; db://x/** and db://x/t#f are both granted; and Acquire grants repo://**,
// repo://a/../b/x.ts#f, repo://a/x.ts#, repo://a//x.ts#f, repo://a/src/*.ts#f, repo://a and
// repo://a/x.ts#f#g. Holding overlapping grants, both jobs' pushes of the shared symbol are accepted.
//
// Ruling (orchestrator ceo-1, 2026-10-04): two jobs must never both hold coverage of one resource.
// Acquire treats a requested resource as conflicting with every lease another job holds that covers
// it or that it covers, under covers() as frozen by LC-1 (C1-C6, R1-R5 in
// fence_cover_donetest_test.go). Fail closed: if overlap cannot be judged, refuse.
//
// Decided here, inside that ruling, each following an existing rule:
//
//	O1 Queue, not refuse. An overlapping lease makes a requested resource BUSY exactly as an
//	   identical name does today, so it goes through the machinery the B1-04 contract and the
//	   2026-10-03 B1-04r rulings already define for a busy resource: AllOrNothing waits (ErrWait,
//	   the request is the job's outstanding wait, nothing granted); WoundWait wounds only strictly
//	   younger holders and otherwise waits (fence.go Coordinator.Acquire); the wait is an edge of
//	   the wait-for graph that Detect breaks at the youngest mission (Coordinator.Detect: "each
//	   outstanding wait -> the live holders of its busy resources"); and max_wait starves it
//	   (hot.go). Refusing outright would bypass all four: an older mission would be refused rather
//	   than wound, and a refused job has no wait for max_wait to cap or for Detect to see.
//	O2 Both directions. A held glob covering the request, and a requested glob covering a held
//	   name, are both overlap; so are two globs whose directories are equal or one below the other
//	   (covers() judges a touched name, so glob against glob compares the two canonical directories,
//	   on the same "/" boundary).
//	O3 The job's own leases never conflict (fence.go: "A resource the requesting job already
//	   holds live is not busy for that job").
//	O4 Revocation is of the overlapping ROW. A wound revokes the holder's whole overlapping lease
//	   (a glob cannot be partly revoked) and nothing else it holds (TestAdvWoundKeepsUnrequestedLeases);
//	   the holder's token for it goes stale at storage.
//	O5 Expired is free AND reclaimed. An expired overlapping lease does not make the request busy
//	   (fence.go: "expired leases are free"), and the grant that takes over its coverage leaves the
//	   former holder no current token for it: for an identical name the re-grant overwrites the row,
//	   and the B1-04 acceptance is "stale holder rejected by storage" (SP2 drill). Without this,
//	   both pushes of the shared resource are accepted again, which is the defect.
//	O6 Hot resources are part of the request (hot.go): an auto-added hot resource that overlaps a
//	   held lease makes the request busy, even when no named resource does.
//	O7 R5: a glob of any other scheme keeps the plain-prefix rule for overlap, as for coverage.
//	O8 Superseded by R6 (r7 part 2). It read: "#*" stays literal (LC-1 r6, StarAnchorIsLiteral):
//	   x.ts#* and x.ts#f do not overlap.
//
// R6 (orchestrator ceo-1, 2026-10-04), for Acquire overlap ONLY; Receive coverage stays literal
// (fence_cover_donetest_test.go StarAnchorIsLiteral is unchanged). Two repo:// resources on the
// SAME file (everything before the first '#') overlap when either is the whole-file name file#* or
// the bare file. Distinct symbols of one file (file#f, file#g) do not. Rationale: SP2 leases
// whole-file as "#*" precisely so that a whole-file editor collides with a symbol editor; two
// writers on one file is the conflict LC-2 exists to stop. R6 binds repo:// only, as R1 does; another
// scheme keeps the plain-prefix rule (R5) and its '#' means nothing to overlap.
//
// Non-canonical names at Acquire (follow-up LC-1 "Whether Acquire may GRANT such a glob is not
// decided here"; decided now, fail closed). A requested repo:// name is canonical when it is one of:
// a canonical touched name (C1-C4, R2-R4: repo://<repo>/<path>#<anchor>); a canonical glob
// "<canonical dir>/**" (C5); or a bare canonical file repo://<repo>/<path> with no '#', because the
// frozen r1 test HotTouchRule acquires repo://shop-core/src/config.ts and hot.go's touches() names
// "r == file". Anything else is refused at Acquire before anything is decided or written: not
// ErrWait, not ErrStaleToken, the name named. Only repo:// is judged; other schemes are validResource
// as before (R5: Receive judges repo:// only). Hot resources pulled in by AddHot are not re-judged
// here (R2 judges touched names only; HotSetValidationAndOrder pulls in src/a.ts#b#c).
//
// R7 (orchestrator ceo-1, 2026-10-04). Detect's wait-for edges and cycleResources (and so
// HotCandidates) judge a wait by the same overlap predicate as Acquire, ignoring expired rows and the
// waiting job's own rows. A cycle that runs only through overlaps is a deadlock, and the waited
// resources on its edges are counted toward the hot proposal.
//
// r7 part 3 (red-team of LC-2, 2026-10-04) pins, besides R7: reclaim on the wound path; the own-job
// exemption keyed on the exact job id (not Born, not case-folded, not a prefix); overlap waits
// starve under max_wait; Detect ignoring expired and own overlapping rows; and the canonical check
// on every requested resource, not only the first.
//
// NOT frozen, and why:
//   - That EVERY expired row is reclaimed on any grant (red-team item 7). Not ruled; it stays the
//     logged follow-up on expired-but-unreclaimed tokens (fence.go). Only an expired row that
//     overlaps what the grant takes is pinned (O5).
//   - The error text and sentinel of a non-canonical refusal beyond "not ErrWait, not ErrStaleToken".
//
// Every clock is injected; nothing sleeps. Each test names, in its comment, the wrong implementation
// it is there to kill. Subtests are numbered: t.TempDir is named after the subtest, and the Journal
// refuses '#'.
//
// Run: go -C kernel test -tags donetest -count=1 -run B1_04R_Overlap ./internal/lease/
package lease_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

// ovBorn: older is earlier. ovOld < ovMid < ovYoung.
var (
	ovOld   = b104Epoch.Add(-time.Hour)
	ovMid   = b104Epoch.Add(-30 * time.Minute)
	ovYoung = b104Epoch.Add(-time.Minute)
)

type ovEnv struct {
	j   journal.Journal
	clk *b104Clock
	c   lease.Coordinator
	v   lease.Verifier
}

func ovOpen(t *testing.T) ovEnv {
	t.Helper()
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	return ovEnv{j: j, clk: clk, c: b104Coord(t, j, clk), v: b104Verifier(t, j)}
}

// ovNotHeldBy fails if job holds r live.
func ovNotHeldBy(t *testing.T, c lease.Coordinator, r, job string) {
	t.Helper()
	if h, tok := holder(t, c, r); h == job {
		t.Fatalf("Holder(%s) = %s token %d; want %s to hold it no longer", r, h, tok, job)
	}
}

// ovStale checks job's push of touched, presenting tokens, is refused as stale and names touched.
func ovStale(t *testing.T, v lease.Verifier, job string, tokens map[string]uint64, touched ...string) {
	t.Helper()
	refuse(t, v, lease.Push{Job: job, Tokens: tokens, Touched: touched}, []error{lease.ErrStaleToken}, touched)
}

// ovPair runs one held/requested pair: job_a is granted held, then job_b requests req. When overlap
// is true job_b must wait with nothing granted; when false it must be granted.
func ovPair(t *testing.T, held, req string, overlap bool) {
	t.Helper()
	e := ovOpen(t)
	ga := mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, held))
	if !overlap {
		mustGrant(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, req))
		return
	}
	mustWait(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, req))
	wantWait(t, e.c, "job_b", req)
	if req != held {
		if h, _ := holder(t, e.c, req); h != "" {
			t.Fatalf("job_b waits, yet Holder(%s) = %s", req, h)
		}
	}
	if h, tok := holder(t, e.c, held); h != "job_a" || tok != ga.Tokens[held] {
		t.Fatalf("Holder(%s) = %q token %d after job_b's wait; want job_a token %d untouched", held, h, tok, ga.Tokens[held])
	}
}

// TestB1_04R_OverlapGlobAndExact: O1, O2. A glob held by job_a and a symbol under it requested by
// job_b, and the reverse: job_b waits, nothing is granted, job_a keeps its lease and is the only job
// storage accepts the symbol from. Names beside the glob are granted: the directory boundary, the
// glob's own root (C5), another repository, a longer file name.
//
// Kills: no overlap check (main); a check in one direction only (held covers requested, or
// requested covers held); a glob matched as a bare string prefix without its "/" (srcx, src.ts); a
// glob that covers its own root (src#h); overlap refused outright instead of queued (no ErrWait, no
// wait recorded).
func TestB1_04R_OverlapGlobAndExact(t *testing.T) {
	const glob, in = "repo://a/src/**", "repo://a/src/deep/x.ts#f"
	for i, tc := range []struct{ held, req string }{{glob, in}, {in, glob}} {
		t.Run(fmt.Sprintf("dir%d", i), func(t *testing.T) {
			ovPair(t, tc.held, tc.req, true)

			e := ovOpen(t)
			ga := mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, tc.held))
			mustWait(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, tc.req))
			accept(t, e.v, lease.Push{Job: "job_a", Tokens: ga.Tokens, Touched: []string{in}})
			// job_b was granted nothing, so whatever it presents, storage does not take the symbol.
			refuse(t, e.v, lease.Push{Job: "job_b", Tokens: map[string]uint64{tc.req: ga.Tokens[tc.held]}, Touched: []string{in}},
				nil, []string{in})
		})
	}
	for i, beside := range []string{
		"repo://a/srcx/y.ts#f",
		"repo://a/src.ts#f",
		"repo://a/src#h",
		"repo://ab/src/x.ts#f",
		"repo://a/lib/x.ts#f",
		"repo://a/srcx/**",
	} {
		t.Run(fmt.Sprintf("beside%d", i), func(t *testing.T) { ovPair(t, glob, beside, false) })
	}
	for i, beside := range []string{
		"repo://a/src/deep/x.ts#g",
		"repo://a/src/deep/x.tsx#f",
		"repo://a/src/other/**",
		"repo://a/lib/**",
		"repo://b/**",
	} {
		t.Run(fmt.Sprintf("besideExact%d", i), func(t *testing.T) { ovPair(t, in, beside, false) })
	}
}

// TestB1_04R_OverlapGlobs: O2. Two globs overlap when one is at or below the other, in either order;
// sibling globs, a glob beside another by a longer directory name, and globs in two repositories do
// not.
//
// Kills: overlap judged by one direction only (the nested glob held and the outer one requested is
// granted); a bare string prefix (srcx/** under src/**, ab/** under a/**); globs never compared with
// globs (only glob-vs-exact handled).
func TestB1_04R_OverlapGlobs(t *testing.T) {
	for i, tc := range []struct {
		held, req string
		overlap   bool
	}{
		{"repo://a/**", "repo://a/src/deep/**", true},
		{"repo://a/src/deep/**", "repo://a/**", true},
		{"repo://a/src/**", "repo://a/src/deep/**", true},
		{"repo://a/src/deep/**", "repo://a/src/**", true},
		{"repo://a/src/**", "repo://a/src/**", true},
		{"repo://a/src/**", "repo://a/srcx/**", false},
		{"repo://a/srcx/**", "repo://a/src/**", false},
		{"repo://a/src/**", "repo://a/lib/**", false},
		{"repo://a/**", "repo://ab/**", false},
		{"repo://ab/**", "repo://a/**", false},
		{"repo://a/**", "repo://b/src/**", false},
	} {
		t.Run(fmt.Sprintf("glob%d", i), func(t *testing.T) { ovPair(t, tc.held, tc.req, tc.overlap) })
	}
}

// TestB1_04R_OverlapSameJob: O3. A job's own lease never conflicts with its own request, in either
// direction, and its glob still excludes every other job afterwards.
//
// Kills: an overlap check that does not skip the requester's own rows (job_a waits on itself); one
// that re-grants the own glob away when a symbol under it is granted (job_b is then granted).
func TestB1_04R_OverlapSameJob(t *testing.T) {
	const glob, x, y = "repo://a/src/**", "repo://a/src/x.ts#f", "repo://a/src/y.ts#g"
	for i, order := range [][2]string{{glob, x}, {x, glob}} {
		t.Run(fmt.Sprintf("order%d", i), func(t *testing.T) {
			e := ovOpen(t)
			mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, order[0]))
			g2 := mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, order[1]))
			wantWait(t, e.c, "job_a")
			accept(t, e.v, lease.Push{Job: "job_a", Tokens: g2.Tokens, Touched: []string{x}})
			mustWait(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, y))
			mustWait(t, e.c, b104Req("job_c", ovYoung, lease.AllOrNothing, x))
		})
	}
}

// TestB1_04R_OverlapClearedByReleaseAndExpiry: O1, O5. Release ends the overlap; so does expiry, and
// the grant that follows an expiry leaves the former holder no current token for the shared
// resource, so storage takes it from the new holder only. Before expiry the request still waits.
//
// Kills: an expired overlapping lease still counted as busy (job_b waits after expiry); liveness
// ignored altogether; a grant that checks only live leases and leaves an expired overlapping row
// current, so the stale holder's push of the shared symbol is accepted beside the new holder's — the
// defect this job exists to close, through the expiry door (SP2 drill: stale holder rejected).
func TestB1_04R_OverlapClearedByReleaseAndExpiry(t *testing.T) {
	ctx := context.Background()
	const glob, in = "repo://a/src/**", "repo://a/src/x.ts#f"
	for i, tc := range []struct{ held, req string }{{glob, in}, {in, glob}} {
		t.Run(fmt.Sprintf("release%d", i), func(t *testing.T) {
			e := ovOpen(t)
			ga := mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, tc.held))
			mustWait(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, tc.req))
			if err := e.c.Release(ctx, "job_a"); err != nil {
				t.Fatalf("Release(job_a): %v", err)
			}
			gb := mustGrant(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, tc.req))
			accept(t, e.v, lease.Push{Job: "job_b", Tokens: gb.Tokens, Touched: []string{in}})
			ovStale(t, e.v, "job_a", ga.Tokens, in)
		})
		t.Run(fmt.Sprintf("expiry%d", i), func(t *testing.T) {
			e := ovOpen(t)
			ga := mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, tc.held))
			e.clk.Advance(b104TTL - time.Second)
			mustWait(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, tc.req))
			e.clk.Advance(2 * time.Second)
			gb := mustGrant(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, tc.req))
			wantWait(t, e.c, "job_b")
			accept(t, e.v, lease.Push{Job: "job_b", Tokens: gb.Tokens, Touched: []string{in}})
			ovStale(t, e.v, "job_a", ga.Tokens, in)
		})
	}
}

// TestB1_04R_OverlapWoundWait: O1, O4. Under WoundWait an older requester wounds a strictly younger
// holder of an overlapping lease: that whole lease is revoked (its token is stale for the shared
// symbol), and the holder's other leases stay. A younger requester waits on an older overlapping
// holder and wounds nobody.
//
// Kills: wound-wait that sees identical names only (the older mission waits); a wound that revokes
// only rows named identically, so the younger's glob row stays current and its push of the symbol
// is accepted beside the older's; a wound that revokes everything the holder has (u.ts refused); a
// younger requester that wounds an older holder.
func TestB1_04R_OverlapWoundWait(t *testing.T) {
	const glob, in, keep = "repo://a/src/**", "repo://a/src/x.ts#f", "repo://z/u.ts#keep"
	for i, tc := range []struct{ held, req string }{{glob, in}, {in, glob}} {
		t.Run(fmt.Sprintf("wound%d", i), func(t *testing.T) {
			e := ovOpen(t)
			gy := mustGrant(t, e.c, b104Req("young", ovYoung, lease.WoundWait, tc.held, keep))
			gold := mustGrant(t, e.c, b104Req("old", ovOld, lease.WoundWait, tc.req))
			ovNotHeldBy(t, e.c, tc.held, "young")
			if h, tok := holder(t, e.c, tc.req); h != "old" || tok != gold.Tokens[tc.req] {
				t.Fatalf("Holder(%s) = %q token %d, want old token %d", tc.req, h, tok, gold.Tokens[tc.req])
			}
			if h, tok := holder(t, e.c, keep); h != "young" || tok != gy.Tokens[keep] {
				t.Fatalf("Holder(%s) = %q token %d; the wound revoked a lease it does not overlap", keep, h, tok)
			}
			ovStale(t, e.v, "young", gy.Tokens, in)
			accept(t, e.v, lease.Push{Job: "young", Tokens: onlyTokens(gy, keep), Touched: []string{keep}})
			accept(t, e.v, lease.Push{Job: "old", Tokens: gold.Tokens, Touched: []string{in}})
		})
		t.Run(fmt.Sprintf("younger%d", i), func(t *testing.T) {
			e := ovOpen(t)
			gold := mustGrant(t, e.c, b104Req("old", ovOld, lease.WoundWait, tc.held))
			mustWait(t, e.c, b104Req("young", ovYoung, lease.WoundWait, tc.req))
			wantWait(t, e.c, "young", tc.req)
			if h, tok := holder(t, e.c, tc.held); h != "old" || tok != gold.Tokens[tc.held] {
				t.Fatalf("Holder(%s) = %q token %d; a younger requester wounded an older holder", tc.held, h, tok)
			}
			accept(t, e.v, lease.Push{Job: "old", Tokens: gold.Tokens, Touched: []string{in}})
		})
	}
}

// TestB1_04R_OverlapDeadlockDetected: O1. A cycle whose edge is an overlap, not an identical name, is
// a deadlock: Detect breaks it at the youngest mission, the victim's overlapping lease is gone, and
// the survivor's request is then granted. Both directions of the overlap edge are covered.
//
// Kills: a wait-for graph that looks up identical names only (Detect finds no cycle, and the two
// jobs wait until max_wait starves one); a graph edge in one direction of the overlap only.
func TestB1_04R_OverlapDeadlockDetected(t *testing.T) {
	const glob, in, other = "repo://a/src/**", "repo://a/src/y.ts#g", "repo://b/x.ts#f"
	for i, tc := range []struct{ youngHolds, oldWants string }{{glob, in}, {in, glob}} {
		t.Run(fmt.Sprintf("cycle%d", i), func(t *testing.T) {
			e := ovOpen(t)
			gy := mustGrant(t, e.c, b104Req("young", ovYoung, lease.AllOrNothing, tc.youngHolds))
			mustGrant(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, other))
			mustWait(t, e.c, b104Req("young", ovYoung, lease.AllOrNothing, other))
			mustWait(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, tc.oldWants))

			breaks := detect(t, e.c)
			if len(breaks) != 1 || breaks[0].Victim != "young" || len(breaks[0].Cycle) != 2 {
				t.Fatalf("Detect = %+v; want one break of the two-job cycle at young", breaks)
			}
			ovNotHeldBy(t, e.c, tc.youngHolds, "young")
			wantWait(t, e.c, "young")
			ovStale(t, e.v, "young", gy.Tokens, in)
			gold := mustGrant(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, tc.oldWants))
			accept(t, e.v, lease.Push{Job: "old", Tokens: gold.Tokens, Touched: []string{in}})
		})
	}
}

// TestB1_04R_OverlapHotResources: O4, O6. A hot resource auto-added to a request is judged for
// overlap like a named one; and a wound revokes both the younger's glob and its hot row.
//
// The hot-only case needs R5: under repo:// a glob that covers a hot resource also covers whatever
// in its file touches it, so only the plain-prefix rule of another scheme can make the auto-added
// resource the sole overlap. job_a takes db://x/t#h/** BEFORE db://x/t#h/sub is hot, so it holds no
// row for it; job_b names db://x/t#zzz, which db://x/t#h/** does not cover, and the hot
// db://x/t#h/sub it pulls in is covered.
//
// Kills: overlap judged on the named resources only, not on the hot-expanded request (job_b is
// granted beside job_a's glob); a wound that revokes the hot row (an identical name) but leaves the
// younger's glob current (young's push of config.ts#total is accepted).
func TestB1_04R_OverlapHotResources(t *testing.T) {
	ctx := context.Background()
	t.Run("hot only", func(t *testing.T) {
		const glob, hot, named = "db://x/t#h/**", "db://x/t#h/sub", "db://x/t#zzz"
		e := ovOpen(t)
		r04Grant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, glob), []string{glob})
		r04AddHot(t, e.c, hot)
		mustWait(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, named))
		wantWait(t, e.c, "job_b", named, hot)
		if h, _ := holder(t, e.c, named); h != "" {
			t.Fatalf("job_b waits, yet Holder(%s) = %s", named, h)
		}
		if err := e.c.Release(ctx, "job_a"); err != nil {
			t.Fatalf("Release(job_a): %v", err)
		}
		r04Grant(t, e.c, b104Req("job_b", ovYoung, lease.AllOrNothing, named), []string{named, hot})
	})
	t.Run("wound", func(t *testing.T) {
		const p = "repo://x/src/"
		glob, hdr, total := p+"**", p+"config.ts#<header>", p+"config.ts#total"
		e := ovOpen(t)
		r04AddHot(t, e.c, hdr)
		gy := r04Grant(t, e.c, b104Req("young", ovYoung, lease.WoundWait, glob), []string{glob, hdr})
		gold := r04Grant(t, e.c, b104Req("old", ovOld, lease.WoundWait, total), []string{total, hdr})
		ovNotHeldBy(t, e.c, glob, "young")
		if h, _ := holder(t, e.c, hdr); h != "old" {
			t.Fatalf("Holder(%s) = %q, want old", hdr, h)
		}
		ovStale(t, e.v, "young", gy.Tokens, total)
		ovStale(t, e.v, "young", gy.Tokens, hdr)
		accept(t, e.v, lease.Push{Job: "old", Tokens: gold.Tokens, Touched: []string{total, hdr}})
		// A third job that touches config.ts waits on old's rows, named and hot.
		mustWait(t, e.c, b104Req("mid", ovMid, lease.AllOrNothing, p+"config.ts#rate"))
		wantWait(t, e.c, "mid", p+"config.ts#rate", hdr)
	})
}

// TestB1_04R_OverlapNonRepoPlainPrefix: O7 (R5). A glob of another scheme overlaps what starts with
// everything before its "**", in either direction, so db://** overlaps every db:// name. Schemes
// never overlap each other, and a longer directory name is beside the glob, not under it.
//
// Kills: the repo:// canonical predicate applied to every scheme (db://x/** then covers nothing and
// db://x/t#f is granted beside it); a non-repo glob matched as a bare prefix without its "/"
// (db://xy/t#f waits); a check in one direction only (db://x/y/** held, db://x/** granted); the
// scheme ignored (repo://x/** against db://x/t#f).
func TestB1_04R_OverlapNonRepoPlainPrefix(t *testing.T) {
	for i, tc := range []struct {
		held, req string
		overlap   bool
	}{
		{"db://x/**", "db://x/t#f", true},
		{"db://x/t#f", "db://x/**", true},
		{"db://x/**", "db://x/y/**", true},
		{"db://x/y/**", "db://x/**", true},
		{"db://**", "db://x/t", true},
		{"db://x/t", "db://**", true},
		{"db://x/**", "db://xy/t#f", false},
		{"db://xy/**", "db://x/**", false},
		{"repo://x/**", "db://x/t#f", false},
		{"db://x/**", "repo://x/t.ts#f", false},
		{"budget://beacon/2026-10", "budget://beacon/2026-11", false},
	} {
		t.Run(fmt.Sprintf("r5_%d", i), func(t *testing.T) { ovPair(t, tc.held, tc.req, tc.overlap) })
	}
}

// TestB1_04R_OverlapWholeFile: R6. On one repo:// file, the whole-file name x.ts#* and the bare file
// x.ts each overlap every symbol of the file and each other, either way round; distinct symbols do
// not overlap each other. A glob over the directory overlaps all three forms. The file is the whole
// name before the first '#', compared byte for byte: a longer file name, another file, another
// repository, or a "file" read as a directory are beside it. Another scheme is not judged by R6.
//
// Kills: "#*" literal for overlap (the superseded O8: x.ts#f granted beside x.ts#*); the bare file
// treated as non-overlapping (x.ts#f granted beside x.ts); either rule in one direction only; every
// pair of symbols of one file overlapping (file compare ignoring the anchor: #g waits on #f); the
// file matched as a string prefix (x.tsx#f, x.ts.bak, x.ts/y.ts#f wait); R6 applied to every
// scheme (db://x/t#f waits on db://x/t#*).
func TestB1_04R_OverlapWholeFile(t *testing.T) {
	const x = "repo://a/src/x.ts"
	for i, tc := range []struct {
		held, req string
		overlap   bool
	}{
		// #* against a symbol, either way
		{x + "#*", x + "#f", true},
		{x + "#f", x + "#*", true},
		{x + "#*", x + "#<header>", true},
		{x + "#<eof>", x + "#*", true},
		// the bare file against a symbol, against #*, either way
		{x, x + "#f", true},
		{x + "#f", x, true},
		{x, x + "#*", true},
		{x + "#*", x, true},
		// distinct symbols of one file do not overlap
		{x + "#f", x + "#g", false},
		{x + "#g", x + "#f", false},
		{x + "#f", x + "#<header>", false},
		// a glob over the directory overlaps all three forms, either way
		{"repo://a/src/**", x + "#*", true},
		{x + "#*", "repo://a/src/**", true},
		{"repo://a/**", x, true},
		{x, "repo://a/**", true},
		{"repo://a/src/**", x + "#f", true},
		{x + "#f", "repo://a/**", true},
		// beside the file
		{x + "#*", "repo://a/src/x.tsx#f", false},
		{x + "#*", "repo://a/src/y.ts#f", false},
		{x + "#*", "repo://b/src/x.ts#f", false},
		{x, "repo://a/src/x.ts.bak", false},
		{x, "repo://a/src/x.ts/y.ts#f", false},
		{"repo://a/src/x.tsx", x + "#f", false},
		// R6 binds repo:// only
		{"db://x/t#*", "db://x/t#f", false},
		{"db://x/t", "db://x/t#f", false},
	} {
		t.Run(fmt.Sprintf("file%d", i), func(t *testing.T) { ovPair(t, tc.held, tc.req, tc.overlap) })
	}
}

// ovHead is FenceStream's head seq.
func ovHead(t *testing.T, j journal.Journal) uint64 {
	t.Helper()
	seq, _, err := j.Head(context.Background(), lease.FenceStream)
	if err != nil {
		t.Fatalf("Head(%s): %v", lease.FenceStream, err)
	}
	return seq
}

// ovRefused checks that a request naming bad is refused before anything is decided: an error that
// is neither ErrWait nor ErrStaleToken and names bad, no grant, no event written, no wait recorded,
// and the request's other resource not held by job. badLast puts bad after other in the request
// (r7 part 3, item 6: every requested resource is judged, not only the first).
func ovRefused(t *testing.T, e ovEnv, job, bad, other string, badLast bool) {
	t.Helper()
	before := ovHead(t, e.j)
	rs := []string{bad, other}
	if badLast {
		rs = []string{other, bad}
	}
	g, err := e.c.Acquire(context.Background(), b104Req(job, ovYoung, lease.AllOrNothing, rs...))
	if err == nil {
		t.Fatalf("Acquire(%q, %s): granted %v, want refused as non-canonical", bad, other, keys(g.Tokens))
	}
	if errors.Is(err, lease.ErrWait) {
		t.Fatalf("Acquire(%q, %s): %v; a non-canonical name is refused, never queued", bad, other, err)
	}
	if errors.Is(err, lease.ErrStaleToken) {
		t.Fatalf("Acquire(%q, %s): %v wraps ErrStaleToken, but no token is involved", bad, other, err)
	}
	if !lcNamed(err, bad) {
		t.Fatalf("Acquire(%q, %s): refusal does not name it: %v", bad, other, err)
	}
	if len(g.Tokens) != 0 {
		t.Fatalf("Acquire(%q): refused with tokens %v", bad, g.Tokens)
	}
	if after := ovHead(t, e.j); after != before {
		t.Fatalf("Acquire(%q): refused, but %s moved from seq %d to %d", bad, lease.FenceStream, before, after)
	}
	wantWait(t, e.c, job)
	ovNotHeldBy(t, e.c, other, job)
}

// TestB1_04R_AcquireRefusesNonCanonical: the LC-1 follow-up, decided fail closed. A request naming a
// non-canonical repo:// name is refused whole, whether its other resource is free or busy, and
// writes nothing. Canonical names — symbols, "#*", hot anchors, globs over a canonical directory,
// bare files, non-ASCII and byte-literal percent names — and every non-repo:// name are granted.
//
// Kills: no check (main); a check that admits only touched-shaped names (it refuses repo://a/** and
// the bare file HotTouchRule acquires); a check placed after the busy test (a busy companion turns
// the refusal into ErrWait and records a wait); the repository segment left unchecked
// (repo://../**, repo://a\u009f/...); dot segments matched literally only (%2e%2e, %2E.); the repo
// grammar applied to every scheme (db://** refused); a bare repository (repo://a) admitted as a
// file; a refusal reported as a stale token; only the first (or only the last) requested resource
// judged (r7 part 3, item 6: the bad name is tried in both positions).
func TestB1_04R_AcquireRefusesNonCanonical(t *testing.T) {
	bad := []string{
		// no repository, or a non-canonical one (C5, C2 r5, R3, R4)
		"repo://**",
		"repo:///**",
		"repo://../**",
		"repo://%2e%2e/**",
		"repo://./**",
		"repo://*/**",
		"repo:///x.ts#f",
		"repo://a%5Cb/x.ts#f",
		"repo://a\u009f/x.ts#f",
		// glob spellings that are not "<canonical dir>/**" (C5 r5), and '*' in a path (C3)
		"repo://a**",
		"repo://a/*",
		"repo://a/**/",
		"repo://a/**/**",
		"repo://a/**/x.ts#f",
		"repo://a/src/*.ts#f",
		"repo://a/src/**#f",
		// dot segments, literal or encoded (C2)
		"repo://a/../b/x.ts#f",
		"repo://a/%2e%2e/b/x.ts#f",
		"repo://a/%2E./x.ts#f",
		"repo://a/./x.ts#f",
		"repo://a/src/../**",
		"repo://a/../b/x.ts",
		// empty segments, and no path (C1, C2)
		"repo://a//x.ts#f",
		"repo://a/",
		"repo://a/src/",
		"repo://a",
		"repo://a#f",
		"repo://a/#f",
		// the anchor (C1, R2, R4)
		"repo://a/x.ts#",
		"repo://a/x.ts#f#g",
		"repo://a/x.ts#a/b",
		"repo://a/x.ts#..",
		"repo://a/x.ts#a*",
		"repo://a/x.ts#**",
		"repo://a/x.ts#%2e%2e",
		"repo://a/x.ts#a\u0085b",
		// separators and C1 controls in the path (R3, R4)
		"repo://a/..%2fb/x.ts#f",
		"repo://a/src\\x.ts#f",
		"repo://a/x\u0085.ts#f",
		"repo://a/\u0085/**",
	}
	for i, b := range bad {
		t.Run(fmt.Sprintf("bad%d", i), func(t *testing.T) {
			e := ovOpen(t)
			ovRefused(t, e, "job_x", b, "repo://q/free.ts#f", false)
			ovRefused(t, e, "job_x", b, "repo://q/free.ts#f", true)
			mustGrant(t, e.c, b104Req("job_o", ovOld, lease.AllOrNothing, lcCompanion))
			ovRefused(t, e, "job_x", b, lcCompanion, false)
			ovRefused(t, e, "job_x", b, lcCompanion, true)
			if h, _ := holder(t, e.c, lcCompanion); h != "job_o" {
				t.Fatalf("Holder(%s) = %q after a refused request, want job_o", lcCompanion, h)
			}
		})
	}
	good := []string{
		"repo://a/**",
		"repo://a/src/**",
		"repo://a/src/x.ts#f",
		"repo://a/x.ts#*",
		"repo://a/src/config.ts#<header>",
		"repo://a/src/types.ts#<eof>",
		"repo://a/src/types.ts#+Region",
		"repo://a/src/café.ts#f",
		"repo://a/100%25.md#*",
		"repo://a/src/..x/y.ts#f",
		"repo://a/.github/ci.yml#*",
		"repo://a/src/x.ts",
		"repo://a/src/config.ts.bak",
		"db://**",
		"db://x/t#h/**",
		"budget://beacon/2026-10",
		"job://job-ww",
	}
	for i, r := range good {
		t.Run(fmt.Sprintf("good%d", i), func(t *testing.T) {
			e := ovOpen(t)
			mustGrant(t, e.c, b104Req("job_g", ovOld, lease.AllOrNothing, r))
		})
	}
}

// TestB1_04R_OverlapReclaimOnWound: O4, O5 on the wound path (r7 part 3, item 1). One WoundWait
// grant both wounds a younger live holder and takes over an expired holder's coverage: the expired
// holder's glob token is stale afterwards, as is the wounded holder's.
//
// Kills: reclaiming expired overlapping rows only when nothing is wounded; reclaiming only rows of
// the jobs being wounded.
func TestB1_04R_OverlapReclaimOnWound(t *testing.T) {
	e := ovOpen(t)
	gx := mustGrant(t, e.c, b104Req("job_x", ovMid, lease.AllOrNothing, "repo://a/src/**"))
	e.clk.Advance(b104TTL + time.Second)
	gy := mustGrant(t, e.c, b104Req("young", ovYoung, lease.WoundWait, "repo://a/lib/y.ts#g"))
	gold := mustGrant(t, e.c, b104Req("old", ovOld, lease.WoundWait, "repo://a/**"))
	ovStale(t, e.v, "job_x", gx.Tokens, "repo://a/src/z.ts#f")
	ovStale(t, e.v, "young", gy.Tokens, "repo://a/lib/y.ts#g")
	accept(t, e.v, lease.Push{Job: "old", Tokens: gold.Tokens, Touched: []string{"repo://a/src/z.ts#f", "repo://a/lib/y.ts#g"}})
}

// TestB1_04R_OverlapOwnJobIsExactID: O3 (r7 part 3, item 2). The own-lease exemption is the exact
// job id, byte for byte. A job with job_a's Born, JOB_A, and job_ab all wait on job_a's glob; and
// job_a waits on job_ab's (red-team r7 probe: the prefix taken the other way).
//
// Kills: the exemption keyed on Born (the same-Born job is granted); a case-folded job compare
// (JOB_A is granted); a prefix compare in either direction (job_ab is granted beside job_a, or
// job_a beside job_ab).
func TestB1_04R_OverlapOwnJobIsExactID(t *testing.T) {
	const glob, x = "repo://a/src/**", "repo://a/src/x.ts#f"
	for i, tc := range []struct {
		holder, job string
		born        time.Time
	}{
		{"job_a", "job_same_born", ovOld},
		{"job_a", "JOB_A", ovYoung},
		{"job_a", "job_ab", ovYoung},
		{"job_ab", "job_a", ovYoung},
	} {
		t.Run(fmt.Sprintf("job%d", i), func(t *testing.T) {
			e := ovOpen(t)
			mustGrant(t, e.c, b104Req(tc.holder, ovOld, lease.AllOrNothing, glob))
			mustWait(t, e.c, b104Req(tc.job, tc.born, lease.AllOrNothing, x))
			wantWait(t, e.c, tc.job, x)
		})
	}
}

// TestB1_04R_OverlapWaitStarves: O1 (r7 part 3, item 3). An overlap wait is a wait like any other:
// over its MaxWait, Detect starves it (its wait is dropped), and it is not reported as a break.
//
// Kills: a max_wait clock that runs only on resources with an identical holder; an overlap wait
// recorded without its MaxWait (it would starve only at the 120 s default).
func TestB1_04R_OverlapWaitStarves(t *testing.T) {
	e := ovOpen(t)
	ga := mustGrant(t, e.c, b104Req("job_a", ovOld, lease.AllOrNothing, "repo://a/src/**"))
	req := b104Req("job_b", ovYoung, lease.AllOrNothing, "repo://a/src/x.ts#f")
	req.MaxWait = time.Second
	mustWait(t, e.c, req)
	e.clk.Advance(2 * time.Second)
	if b := detect(t, e.c); len(b) != 0 {
		t.Fatalf("Detect = %+v; a starvation is not a break", b)
	}
	wantWait(t, e.c, "job_b")
	if h, tok := holder(t, e.c, "repo://a/src/**"); h != "job_a" || tok != ga.Tokens["repo://a/src/**"] {
		t.Fatalf("Holder(repo://a/src/**) = %q token %d; starving job_b touched job_a", h, tok)
	}
}

// TestB1_04R_OverlapDetectIgnoresExpired: R7 (r7 part 3, item 4). A two-job cycle whose overlap edge
// runs through a glob that has since expired is no cycle: Detect breaks nothing and both waits stand.
//
// Kills: a wait-for graph that counts an expired overlapping row as a live holder.
func TestB1_04R_OverlapDetectIgnoresExpired(t *testing.T) {
	const glob, in, other = "repo://a/src/**", "repo://a/src/y.ts#g", "repo://b/x.ts#f"
	e := ovOpen(t)
	mustGrant(t, e.c, b104Req("young", ovYoung, lease.AllOrNothing, glob)) // expires at 90 s
	e.clk.Advance(60 * time.Second)
	mustGrant(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, other)) // expires at 150 s
	mustWait(t, e.c, b104Req("young", ovYoung, lease.AllOrNothing, other))
	mustWait(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, in))
	e.clk.Advance(40 * time.Second) // 100 s: the glob is expired, other is live, no wait is over 120 s
	if b := detect(t, e.c); len(b) != 0 {
		t.Fatalf("Detect = %+v; the overlap edge runs through an expired glob, so there is no cycle", b)
	}
	wantWait(t, e.c, "young", other)
	wantWait(t, e.c, "old", in)
	if h, _ := holder(t, e.c, other); h != "old" {
		t.Fatalf("Holder(%s) = %q after Detect, want old", other, h)
	}
}

// TestB1_04R_OverlapDetectIgnoresOwn: R7 (r7 part 3, item 5). A job waiting on a symbol under its own
// glob has no edge to itself: Detect breaks nothing.
//
// Kills: a wait-for graph that counts the waiter's own overlapping row (a self-loop, broken as a
// one-job cycle).
func TestB1_04R_OverlapDetectIgnoresOwn(t *testing.T) {
	const glob, x, other = "repo://a/src/**", "repo://a/src/x.ts#f", "repo://b/x.ts#f"
	e := ovOpen(t)
	ga := mustGrant(t, e.c, b104Req("job_a", ovYoung, lease.AllOrNothing, glob))
	mustGrant(t, e.c, b104Req("job_b", ovOld, lease.AllOrNothing, other))
	mustWait(t, e.c, b104Req("job_a", ovYoung, lease.AllOrNothing, x, other))
	if b := detect(t, e.c); len(b) != 0 {
		t.Fatalf("Detect = %+v; job_a's own glob is not an edge", b)
	}
	wantWait(t, e.c, "job_a", x, other)
	if h, tok := holder(t, e.c, glob); h != "job_a" || tok != ga.Tokens[glob] {
		t.Fatalf("Holder(%s) = %q token %d after Detect, want job_a token %d", glob, h, tok, ga.Tokens[glob])
	}
}

// TestB1_04R_OverlapCycleCountsTowardHot: R7. A cycle that runs only through overlaps (no identical
// names) is broken at the youngest, and the waited resources on its edges are what it counts toward
// HotCandidates. Three such cycles propose exactly those two resources. A resource the waiter also
// waits on, overlapped only by the next job's EXPIRED row, is not on an edge and is not proposed.
//
// Kills: cycleResources looking up identical names only (nothing proposed); cycleResources counting
// an expired overlapping row (c/z.ts#f proposed); counting only one direction of the overlap.
func TestB1_04R_OverlapCycleCountsTowardHot(t *testing.T) {
	ctx := context.Background()
	const (
		youngGlob, oldGlob, oldExpired = "repo://a/src/**", "repo://b/lib/**", "repo://c/**"
		youngWants, oldWants, stale    = "repo://b/lib/q.ts#h", "repo://a/src/y.ts#g", "repo://c/z.ts#f"
	)
	e := ovOpen(t)
	for round := 0; round < lease.HotCycleThreshold; round++ {
		short := b104Req("old", ovOld, lease.AllOrNothing, oldExpired)
		short.TTL = time.Second
		mustGrant(t, e.c, short)
		e.clk.Advance(2 * time.Second)
		mustGrant(t, e.c, b104Req("young", ovYoung, lease.AllOrNothing, youngGlob))
		mustGrant(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, oldGlob))
		mustWait(t, e.c, b104Req("young", ovYoung, lease.AllOrNothing, youngWants, stale))
		mustWait(t, e.c, b104Req("old", ovOld, lease.AllOrNothing, oldWants))
		b := detect(t, e.c)
		if len(b) != 1 || b[0].Victim != "young" || len(b[0].Cycle) != 2 {
			t.Fatalf("round %d: Detect = %+v; want one break of the overlap-only cycle at young", round, b)
		}
		for _, j := range []string{"old", "young"} {
			if err := e.c.Release(ctx, j); err != nil {
				t.Fatalf("round %d: Release(%s): %v", round, j, err)
			}
		}
		e.clk.Advance(time.Minute)
	}
	if got, want := r04Candidates(t, e.c), r04Sorted(oldWants, youngWants); !r04Same(got, want) {
		t.Fatalf("HotCandidates = %v after %d overlap-only cycles; want exactly %v", got, lease.HotCycleThreshold, want)
	}
}
