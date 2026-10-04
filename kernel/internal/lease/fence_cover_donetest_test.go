//go:build donetest

// B1-04r follow-up LC-1 done-test: "Receive accepts any covering token" (docs/vision-v3/HANDOFF-BUILD-3.md
// §6, B1-04r). Hash-registered in build/done-tests/B1-04r.yml (RE-FREEZE r4). The contract it freezes
// is Verifier.Receive in fence.go, which is NOT registered: it is what the job implements. It reuses
// the helpers of the frozen B1-04 file (fence_donetest_test.go) and changes nothing there.
//
// The holes, each measured by a probe against main @c367d15 before this file was written: covers()
// is a string compare or a string prefix, and a touched resource is never checked for shape, so a
// job holding repo://a/** lands repo://a/../b/x.ts#f, repo://a/%2e%2e/b/x.ts#f, repo://a/src/#f,
// repo://a/x.ts (no symbol), repo://a/**, and names carrying control bytes or invalid UTF-8; a job
// holding repo://** lands in every repository; and a job that acquired a non-canonical name lands it
// by exact match.
//
// The contract. A touched resource is accepted only when it is CANONICAL and covered by a presented
// lease whose token is current for this job. A non-canonical touched resource is refused and named,
// never normalised and then judged: storage recomputes Touched (fence.go, Push), so a name that is
// not one storage would have produced is a forgery or a bug, and either way not a landing.
//
// Rulings (LC-1, 2026-10-04), each following an existing grammar or ruling:
//
//	C1 Shape. A canonical touched resource is repo://<repo>/<seg>(/<seg>)*#<anchor>. Push.Touched
//	   is "file#symbol resources" (fence.go) and 09a §6 recomputes "Touched file#symbol"; hot.go
//	   already refuses a file#anchor with no '#' or an empty anchor (HotSetValidationAndOrder). So:
//	   no '#', an empty anchor, an empty repository, or no file path is non-canonical.
//	C2 Segments. Every segment of the repository and the path is non-empty (no "//", no trailing
//	   "/") and is not a dot segment, literally or with a dot percent-encoded as %2e or %2E (RFC 3986
//	   §2.3 and §6.2.2.2: a percent-encoded unreserved octet is equivalent to the octet, and dot
//	   segments are removed after decoding). "..x", "x.." and "..." are file names, not dot segments.
//	C3 No '*' in the path. B1-14a r3 ruling 3: "*" appears only in rules, never in what is judged
//	   (Walk refuses an action whose verb holds "*"). The presented lease is the rule; the touched
//	   resource is the action. The anchor is not the path: "#*", the whole-file symbol SP2 recomputes
//	   (testdata/sp2), stays canonical.
//	C4 Bytes. Valid UTF-8 and no control character, as validResource already requires of every
//	   requested resource. Compared byte for byte: no case folding (B1-14a r3: case variants are
//	   refused, not folded; git paths are bytes) and no Unicode normalisation (NFC and NFD spellings
//	   of one name are two names). Non-ASCII file names are canonical.
//	C5 Globs. A presented glob covers only resources strictly below a canonical repository
//	   directory. repo://** and repo:///** name no repository and cover nothing (09a §6 "a path
//	   outside the glob"; B1-04 TouchedNotDeclaredRefused kills "a verifier that ignores the
//	   repo"). The directory itself is not below itself: repo://a/** does not cover repo://a,
//	   repo://a/ or repo://a#f. Whether Acquire may GRANT such a glob is not decided here: each test
//	   accepts Acquire refusing it, and judges Receive only when it is granted.
//	C6 Sentinel. A refusal for shape is never ErrStaleToken: no token is wrong. It may wrap
//	   ErrUndeclared, or no sentinel (as a non-repo:// refusal does). An uncovered canonical resource
//	   is ErrUndeclared, as before.
//
// RE-FREEZE r5 (red-team r1 of 6c030a5; orchestrator ceo-1 rulings, 2026-10-04):
//
//	C2 also binds the REPOSITORY segment: repo://../x.ts#f, repo://%2e%2e/x.ts#f, repo://./x.ts#f,
//	   repo:///x.ts#f and repo://*/x.ts#f are non-canonical, and a held repo://../** covers nothing.
//	   Every case mix of %2e is a dot. Any other percent-encoding is a byte-literal file name:
//	   repo://a/100%25.md#*, repo://a/a%2ex/y.ts#f and repo://a/%2e%2ex/y.ts#f are ACCEPTED.
//	C5 A glob is spelled exactly "<canonical dir>/**". repo://a/**/, repo://a**, repo://a/* are
//	   exact names, never globs: they cover no other resource (ErrUndeclared for what they miss).
//	R1 hot.go touches() uses the SAME glob predicate as Receive: a glob that covers nothing in
//	   Receive (repo://**) pulls no hot resource into a grant.
//	R2 The anchor is a symbol name: non-empty; no '/', '\', '#', '%', C0 or C1 control, no "..";
//	   '*' only as the whole anchor ("#*"). The name splits at the FIRST '#', so a second '#' is
//	   refused. (Measured before freezing: no repo:// anchor in kernel code or tests carries any of
//	   these, except fence_r_donetest_test.go's hot resource src/a.ts#b#c, which is only ever held
//	   and acquired there, never pushed; R2 judges touched names only.)
//	R3 A path or repository segment holding '\' or an encoded separator (%2f %2F %5c %5C) is
//	   refused, fail closed.
//
// Not decided here, and NOT frozen: whether a glob lease and a file#symbol lease under it, held by
// two jobs, conflict (fence.go "Open, NOT decided here"). Measured on main: both are granted and
// BOTH jobs' pushes of the symbol are accepted. That needs a ruling first.
//
// Every clock is injected; nothing sleeps. Each test names, in its comment, the wrong implementation
// it is there to kill.
//
// Run: go -C kernel test -tags donetest -count=1 -run B1_04R_Cover ./internal/lease/
package lease_test

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"testing"

	"github.com/Adam077K/agentvibe/kernel/internal/journal"
	"github.com/Adam077K/agentvibe/kernel/internal/lease"
)

// lcCompanion is a canonical resource under every glob these tests hold. It rides along in each
// refused push, so a refusal that names it, or a verifier that refuses the whole push for one bad
// name, is caught.
const lcCompanion = "repo://a/companion.ts#keep"

// lcNamed reports whether err names r, raw or Go-quoted (a refusal may quote a name carrying
// control bytes rather than print them).
func lcNamed(err error, r string) bool {
	q := strconv.Quote(r)
	return strings.Contains(err.Error(), r) || strings.Contains(err.Error(), q[1:len(q)-1])
}

// lcRefusedForShape checks that a push of bad (alongside lcCompanion, whose token is current) is
// refused, names bad, does not name lcCompanion, and does not wrap ErrStaleToken.
func lcRefusedForShape(t *testing.T, v lease.Verifier, job string, tokens map[string]uint64, bad string) {
	t.Helper()
	err := v.Receive(context.Background(), lease.Push{Job: job, Tokens: tokens, Touched: []string{lcCompanion, bad}})
	if err == nil {
		t.Errorf("Receive(%s touching %q under %v): accepted, want refused as non-canonical", job, bad, keys(tokens))
		return
	}
	if !lcNamed(err, bad) {
		t.Errorf("Receive(%s touching %q): refusal does not name it: %v", job, bad, err)
	}
	if strings.Contains(err.Error(), lcCompanion) {
		t.Errorf("Receive(%s touching %q): refusal names the accepted %s: %v", job, bad, lcCompanion, err)
	}
	if errors.Is(err, lease.ErrStaleToken) {
		t.Errorf("Receive(%s touching %q): refusal wraps ErrStaleToken, but no token is stale: %v", job, bad, err)
	}
}

// lcRefusedAlone checks that a push touching only r is refused, names r, and does not wrap
// ErrStaleToken: the C6 posture, where the sentinel of a shape refusal is not pinned.
func lcRefusedAlone(t *testing.T, v lease.Verifier, job string, tokens map[string]uint64, r string) {
	t.Helper()
	err := v.Receive(context.Background(), lease.Push{Job: job, Tokens: tokens, Touched: []string{r}})
	if err == nil {
		t.Errorf("Receive(%s touching %q under %v): accepted, want refused", job, r, keys(tokens))
		return
	}
	if !lcNamed(err, r) {
		t.Errorf("Receive(%s touching %q): refusal does not name it: %v", job, r, err)
	}
	if errors.Is(err, lease.ErrStaleToken) {
		t.Errorf("Receive(%s touching %q): refusal wraps ErrStaleToken, but no token is stale: %v", job, r, err)
	}
}

func keys(m map[string]uint64) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

// lcHoldA grants job_a the whole of repository a.
func lcHoldA(t *testing.T) (journal.Journal, lease.Verifier, lease.Grant) {
	t.Helper()
	j, _ := b104Open(t)
	clk := &b104Clock{t: b104Epoch}
	c := b104Coord(t, j, clk)
	g := mustGrant(t, c, b104Req("job_a", b104Epoch, lease.AllOrNothing, "repo://a/**"))
	return j, b104Verifier(t, j), g
}

// TestB1_04R_CoverTraversalRefused: rulings C2. Holding repo://a/**, a touched name with a dot
// segment — literal, after an empty segment, or percent-encoded — is refused, whether it climbs out
// of the glob or stays inside it. File names that merely contain dots are accepted.
//
// Kills: path.Clean (or %2e-decode then Clean) and then the prefix test, which accepts
// repo://a/src/../x.ts#f as repo://a/x.ts#f; a refusal list of the literal ".." only (./, %2e%2e,
// %2E%2E, .%2e survive it); a decoder that knows %2e but not %2E; a refusal of ".." as a substring
// (it refuses the positive controls); the canonical check applied to the presented side only.
func TestB1_04R_CoverTraversalRefused(t *testing.T) {
	_, v, g := lcHoldA(t)

	accept(t, v, lease.Push{Job: "job_a", Tokens: g.Tokens, Touched: []string{
		lcCompanion,
		"repo://a/src/x.ts#f",
		"repo://a/src/..x/y.ts#f",
		"repo://a/src/x../y.ts#f",
		"repo://a/src/.../y.ts#f",
		"repo://a/.github/ci.yml#*",
		"repo://a/src/.hidden.ts#f",
		// r5 item 4: other percent-encodings are byte-literal names, not separators or dots
		"repo://a/100%25.md#*",
		"repo://a/a%2ex/y.ts#f",
		"repo://a/%2e%2ex/y.ts#f",
		"repo://a/%2e%2e%2e/y.ts#f",
		"repo://a/x%2e/y.ts#f",
	}})

	for _, bad := range []string{
		// climbing out of the glob
		"repo://a/../b/x.ts#f",
		"repo://a/./../b/x.ts#f",
		"repo://a//../b/x.ts#f",
		"repo://a/%2e%2e/b/x.ts#f",
		"repo://a/%2E%2E/b/x.ts#f",
		"repo://a/.%2e/b/x.ts#f",
		"repo://a/%2E./b/x.ts#f",
		"repo://a/src/../../b/x.ts#f",
		// staying inside it: still not a name storage produces
		"repo://a/src/../x.ts#f",
		"repo://a/./x.ts#f",
		"repo://a/src/%2e%2e/x.ts#f",
		"repo://a/%2e/x.ts#f",
		"repo://a/src/./x.ts#f",
		"repo://a/src/x.ts/..#f",
		"repo://a/src/.#f",
		// r5 item 2: every case mix of an encoded dot
		"repo://a/%2e%2E/b/x.ts#f",
		"repo://a/%2E%2e/b/x.ts#f",
		"repo://a/%2E/x.ts#f",
		"repo://a/.%2E/b/x.ts#f",
		"repo://a/%2e./b/x.ts#f",
		// r5 R3: a backslash or an encoded separator, fail closed
		"repo://a/src\\..\\..\\b/x.ts#f",
		"repo://a/src\\x.ts#f",
		"repo://a/..%2fb/x.ts#f",
		"repo://a/..%2Fb/x.ts#f",
		"repo://a/..%5cb/x.ts#f",
		"repo://a/..%5Cb/x.ts#f",
		"repo://a/src%2fx.ts#f",
	} {
		lcRefusedForShape(t, v, "job_a", g.Tokens, bad)
	}
}

// TestB1_04R_CoverShapeRefused: rulings C1, C3, C4. Holding repo://a/**, a touched name that is not
// repo://<repo>/<path>#<anchor> — the subtree root, a trailing or doubled slash, no symbol, an empty
// symbol, a glob or a '*' in the path, a control byte, invalid UTF-8 — is refused. The anchors SP2
// recomputes (#*, #<header>, #<eof>, #+Region) and non-ASCII file names are accepted.
//
// Kills: a verifier that does not require '#'; one that requires it but accepts an empty anchor;
// one that lets '*' into the path (a touched glob is then "covered" by the glob that holds it); one
// that refuses every '*' (it refuses #*); one that skips the UTF-8 and control-byte check
// validResource applies to requests; one that refuses non-ASCII names.
func TestB1_04R_CoverShapeRefused(t *testing.T) {
	_, v, g := lcHoldA(t)

	accept(t, v, lease.Push{Job: "job_a", Tokens: g.Tokens, Touched: []string{
		lcCompanion,
		"repo://a/src/index.ts#*",
		"repo://a/src/config.ts#<header>",
		"repo://a/src/types.ts#<eof>",
		"repo://a/src/types.ts#+Region",
		"repo://a/x.ts#f",
		"repo://a/src/caf\u00e9.ts#f",
		"repo://a/docs/\u65e5\u672c.md#*",
		"repo://a/src/types.ts#Foo.bar",
		"repo://a/src/types.ts#total_2",
		"repo://a/src/types.ts#caf\u00e9",
	}})

	for _, bad := range []string{
		// the subtree root and its aliases (C1, C5)
		"repo://a",
		"repo://a/",
		"repo://a#f",
		"repo://a/#f",
		// empty segments and trailing slashes (C2)
		"repo://a//x.ts#f",
		"repo://a/src//x.ts#f",
		"repo://a/src/#f",
		"repo://a/src/",
		"repo://a/src/x.ts/#f",
		// no symbol, or an empty one (C1)
		"repo://a/x.ts",
		"repo://a/src/x.ts",
		"repo://a/x.ts#",
		// a glob, or a '*', as the touched path (C3)
		"repo://a/**",
		"repo://a/src/**",
		"repo://a/**/x.ts#f",
		"repo://a/src/*.ts#f",
		"repo://a/*/x.ts#f",
		"repo://a/src/**#f",
		// bytes (C4)
		"repo://a/x\n.ts#f",
		"repo://a/x\x00.ts#f",
		"repo://a/x\x7f.ts#f",
		"repo://a/x\xff.ts#f",
		"repo://a/src/x.ts#f\n",
		// r5 R2: the anchor is a symbol name
		"repo://a/src#/../../b/x.ts#f",
		"repo://a/x.ts#f/../../../b",
		"repo://a/x.ts#a/b",
		"repo://a/x.ts#a\\b",
		"repo://a/x.ts#f#g",
		"repo://a/x.ts##",
		"repo://a/x.ts#%2e%2e",
		"repo://a/x.ts#a%20b",
		"repo://a/x.ts#..",
		"repo://a/x.ts#a..b",
		"repo://a/x.ts#a*",
		"repo://a/x.ts#*f",
		"repo://a/x.ts#**",
		"repo://a/x.ts#\tf",
		"repo://a/x.ts#a\u0085b",
		"repo://a/x.ts#a\u009fb",
	} {
		lcRefusedForShape(t, v, "job_a", g.Tokens, bad)
	}
}

// TestB1_04R_CoverExactNonCanonicalRefused: rulings C1–C3 bind an exact match too. A job that holds
// a lease on a non-canonical name, if Acquire grants one at all, still cannot land that name: the
// shape of the touched resource is judged before, and regardless of, what covers it.
//
// Kills: a verifier that checks shape only on the glob path and lets p == t through; one that
// checks only the presented side's glob shape.
func TestB1_04R_CoverExactNonCanonicalRefused(t *testing.T) {
	for i, bad := range []string{
		"repo://a/../b/x.ts#f",
		"repo://a/%2e%2e/b/x.ts#f",
		"repo://a//x.ts#f",
		"repo://a/**/x.ts#f",
		"repo://a/src/*.ts#f",
		"repo://a/x.ts",
		"repo://a/",
		// r5 item 1: the repository segment
		"repo://../x.ts#f",
		"repo://%2e%2e/x.ts#f",
		"repo://./x.ts#f",
		"repo:///x.ts#f",
		"repo://*/x.ts#f",
		"repo://a#f",
		"repo://a\\b/x.ts#f",
		// r5 R2
		"repo://a/x.ts#f/../../../b",
	} {
		// Subtests are numbered: t.TempDir is named after the subtest, and the Journal refuses '#'.
		t.Run(fmt.Sprintf("exact%d", i), func(t *testing.T) {
			j, _ := b104Open(t)
			c := b104Coord(t, j, &b104Clock{t: b104Epoch})
			v := b104Verifier(t, j)
			g, err := c.Acquire(context.Background(), b104Req("job_x", b104Epoch, lease.AllOrNothing, bad, lcCompanion))
			if err != nil {
				return // Acquire refused the name: nobody can hold it, which is also the contract
			}
			if g.Tokens[bad] == 0 || g.Tokens[lcCompanion] == 0 {
				t.Fatalf("Acquire(%q): grant %+v does not cover the request", bad, g)
			}
			lcRefusedForShape(t, v, "job_x", g.Tokens, bad)
		})
	}
}

// TestB1_04R_CoverRepoWideGlobCoversNothing: ruling C5. repo://** and repo:///** name no repository;
// if a job is granted one, it covers nothing, and a canonical resource it was meant to cover is
// refused as undeclared. A glob that names its repository still covers, and only that repository.
//
// Kills: a verifier that trusts any presented "/**" (repo://** then covers every repository); one
// that refuses only an empty repository (repo:///**) and not a missing one (repo://**); a glob
// matched as a bare prefix (repo://a/** covering repo://ab/...).
func TestB1_04R_CoverRepoWideGlobCoversNothing(t *testing.T) {
	for i, wide := range []string{"repo://**", "repo:///**", "repo://../**", "repo://%2e%2e/**", "repo://./**", "repo://*/**"} {
		t.Run(fmt.Sprintf("wide%d", i), func(t *testing.T) {
			j, _ := b104Open(t)
			c := b104Coord(t, j, &b104Clock{t: b104Epoch})
			v := b104Verifier(t, j)
			g, err := c.Acquire(context.Background(), b104Req("job_w", b104Epoch, lease.AllOrNothing, wide))
			if err != nil {
				return // Acquire refused it: nobody can hold it
			}
			for _, r := range []string{"repo://b/x.ts#f", "repo://a/src/x.ts#f"} {
				err := v.Receive(context.Background(), lease.Push{Job: "job_w", Tokens: g.Tokens, Touched: []string{r}})
				if err == nil {
					t.Fatalf("holding %s, Receive touching %s: accepted, want ErrUndeclared (no repository named)", wide, r)
				}
				if !errors.Is(err, lease.ErrUndeclared) || !lcNamed(err, r) {
					t.Fatalf("holding %s, Receive touching %s: %v, want ErrUndeclared naming it", wide, r, err)
				}
			}
			// What the glob's own prefix would cover, e.g. repo://../b/x.ts#f under repo://../**.
			lcRefusedAlone(t, v, "job_w", g.Tokens, strings.TrimSuffix(wide, "**")+"b/x.ts#f")
		})
	}

	j, _ := b104Open(t)
	c := b104Coord(t, j, &b104Clock{t: b104Epoch})
	v := b104Verifier(t, j)
	g := mustGrant(t, c, b104Req("job_b", b104Epoch, lease.AllOrNothing, "repo://b/**"))
	accept(t, v, lease.Push{Job: "job_b", Tokens: g.Tokens, Touched: []string{"repo://b/x.ts#f", "repo://b/src/deep/y.ts#*"}})
	for _, r := range []string{"repo://bb/x.ts#f", "repo://a/x.ts#f"} {
		refuse(t, v, lease.Push{Job: "job_b", Tokens: g.Tokens, Touched: []string{r}}, []error{lease.ErrUndeclared}, []string{r})
	}
	// Non-canonical (C1): refused, sentinel not pinned (C6).
	lcRefusedAlone(t, v, "job_b", g.Tokens, "repo://b#f")
}

// TestB1_04R_CoverGlobSpelling: ruling C5 (r5). Only "<canonical dir>/**" is a glob. A held
// repo://a/**/, repo://a** or repo://a/* is an exact name: it covers neither repo://a/x.ts#f nor
// repo://ab/x.ts#f, and both are refused as undeclared, named.
//
// Kills: "**" without the slash taken as a glob (repo://a** then covers repo://ab/...); a trailing
// "/" trimmed before the glob test (repo://a/**/ then acts as repo://a/**); a single "*" taken as
// a one-level glob.
func TestB1_04R_CoverGlobSpelling(t *testing.T) {
	for i, held := range []string{"repo://a/**/", "repo://a**", "repo://a/*", "repo://a/**/**"} {
		t.Run(fmt.Sprintf("glob%d", i), func(t *testing.T) {
			j, _ := b104Open(t)
			c := b104Coord(t, j, &b104Clock{t: b104Epoch})
			v := b104Verifier(t, j)
			g, err := c.Acquire(context.Background(), b104Req("job_g", b104Epoch, lease.AllOrNothing, held))
			if err != nil {
				return // Acquire refused it: nobody can hold it
			}
			for _, r := range []string{"repo://a/x.ts#f", "repo://ab/x.ts#f"} {
				refuse(t, v, lease.Push{Job: "job_g", Tokens: g.Tokens, Touched: []string{r}}, []error{lease.ErrUndeclared}, []string{r})
			}
		})
	}
}

// TestB1_04R_CoverHotUsesSameRule: ruling R1. Acquire adds a hot resource when a requested glob
// covers its file, and "covers" is the predicate Receive uses. repo://** and repo:///** cover
// nothing in Receive, so a grant of either (if Acquire grants it at all) carries no hot resource;
// repo://x/** and repo://x/src/** carry it; repo://x** and repo://xx/** do not.
//
// Kills: touches() keeping the bare "/**" prefix rule while Receive tightens (repo://** then pulls
// every hot resource in); a touches() that stops expanding globs altogether.
func TestB1_04R_CoverHotUsesSameRule(t *testing.T) {
	const hdr = "repo://x/src/config.ts#<header>"
	ctx := context.Background()
	grant := func(t *testing.T, res string) (lease.Grant, error) {
		t.Helper()
		j, _ := b104Open(t)
		c := b104Coord(t, j, &b104Clock{t: b104Epoch})
		if err := c.AddHot(ctx, hdr); err != nil {
			t.Fatalf("AddHot(%s): %v", hdr, err)
		}
		return c.Acquire(ctx, b104Req("job_h", b104Epoch, lease.AllOrNothing, res))
	}
	for _, wide := range []string{"repo://**", "repo:///**", "repo://x**"} {
		g, err := grant(t, wide)
		if err != nil {
			continue // Acquire refused it: nothing is granted, hot or not
		}
		if _, ok := g.Tokens[hdr]; ok {
			t.Errorf("Acquire(%s) with %s hot: the grant carries the header %v, but %s covers nothing in Receive", wide, hdr, keys(g.Tokens), wide)
		}
	}
	for _, res := range []string{"repo://x/**", "repo://x/src/**"} {
		g, err := grant(t, res)
		if err != nil {
			t.Fatalf("Acquire(%s): %v", res, err)
		}
		if _, ok := g.Tokens[hdr]; !ok {
			t.Errorf("Acquire(%s) with %s hot: grant %v lacks the header", res, hdr, keys(g.Tokens))
		}
	}
	g, err := grant(t, "repo://xx/**")
	if err != nil {
		t.Fatalf("Acquire(repo://xx/**): %v", err)
	}
	if _, ok := g.Tokens[hdr]; ok {
		t.Errorf("Acquire(repo://xx/**): grant %v carries %s from another repository", keys(g.Tokens), hdr)
	}
}

// TestB1_04R_CoverByteExact: ruling C4. Case and Unicode spelling are part of the name. A case
// variant of the repository, a directory or a file, and the NFD spelling of an NFC name (and the
// reverse), are other resources: refused as undeclared, never folded into the held one. The prefix
// test stops at the directory boundary.
//
// Kills: strings.EqualFold or a lower-casing compare; a Unicode normaliser on either side; a glob
// matched as a bare prefix (repo://a/src/** covering repo://a/srcx/...).
func TestB1_04R_CoverByteExact(t *testing.T) {
	const (
		nfc = "repo://a/src/caf\u00e9.ts#f"  // U+00E9, one code point
		nfd = "repo://a/src/cafe\u0301.ts#f" // e + combining acute
	)
	j, _ := b104Open(t)
	c := b104Coord(t, j, &b104Clock{t: b104Epoch})
	v := b104Verifier(t, j)
	g := mustGrant(t, c, b104Req("job_c", b104Epoch, lease.AllOrNothing,
		"repo://a/src/**", "repo://a/lib/Config.ts#f", "repo://a/lib/caf\u00e9.ts#f", "repo://a/lib/nai\u0308ve.ts#f"))

	accept(t, v, lease.Push{Job: "job_c", Tokens: g.Tokens, Touched: []string{
		"repo://a/src/x.ts#f", nfc, nfd, "repo://a/lib/Config.ts#f", "repo://a/lib/caf\u00e9.ts#f", "repo://a/lib/nai\u0308ve.ts#f",
	}})

	for _, r := range []string{
		"repo://A/src/x.ts#f",
		"repo://a/SRC/x.ts#f",
		"repo://a/Src/x.ts#f",
		"repo://a/lib/config.ts#f",
		"repo://a/lib/CONFIG.ts#f",
		"repo://a/lib/Config.ts#F",
		"repo://a/lib/cafe\u0301.ts#f", // NFD of a held NFC name
		"repo://a/lib/na\u00efve.ts#f", // NFC of a held NFD name
		"repo://a/srcx/y.ts#f",
		"repo://a/src.ts#f",
		"repo://ab/src/x.ts#f",
	} {
		refuse(t, v, lease.Push{Job: "job_c", Tokens: g.Tokens, Touched: []string{r}}, []error{lease.ErrUndeclared}, []string{r})
	}
}
