---
role: builder
task: lc1-cover-tests
branch: build/b1-04r-cover-tests
tier: full
qa_verdict: PENDING
---
LC-1 (B1-04r follow-up "Receive accepts any covering token") done-tests frozen, not implemented. New kernel/internal/lease/fence_cover_donetest_test.go (5 tests), registered as RE-FREEZE r4 in build/done-tests/B1-04r.yml; check-done-tests exit 0 (101 hashes, 15 registers).
Holes probed on c367d15 first: under repo://a/**, traversal (../, ./../, //../, %2e%2e, %2E%2E), trailing/empty segments, no or empty symbol, touched globs and '*', control bytes and invalid UTF-8 were all accepted; repo://** covered every repository; a non-canonical name held exactly landed. Rulings C1-C6 are in the test header, each citing its source.
Red 4 of 5 on c367d15 (ByteExact is a green pin); all other lease tests green tagged, untagged and -race. $TMPDIR reference green in all four configurations (-race -count=2 tagged). Mutants 22 of 22 killed.
OPEN (not frozen, needs a ruling): a glob held by one job and a symbol under it held by another are both granted and both pushes accepted. Whether Acquire should refuse repo://** and non-canonical names is not decided; the tests accept either.
Round r5 (red-team r1 GAPS at 6c030a5, 13 of 37 survivors): rulings R1-R3 of orchestrator ceo-1 recorded in B1-04r.yml; repo segment, encoded-dot mixes, glob spelling, over-refusal controls, anchor grammar, encoded separators added; new GlobSpelling and HotUsesSameRule. Red 5 of 7 on c367d15; reference green in all four configs; mutants 47 of 47 killed. Shared $TMPDIR/lc1 was found written by another agent; r5 proof ran in a private mktemp dir.
r5 addendum: red-team r5 material scanned (no unsafe imports), their reference ported to r5 passes all lease tests; their 36 mutants: 33 killed after HotUsesSameRule became an 11-case table, 3 survive (C6b allowed by C6, C4e equivalent under R2, C4d needs a ruling on C1 controls in paths). My set is 48 mutants, not 47; all 48 killed.
r6 (ruling R4): C1 controls refused in repo and path segments too; tests added as escapes; reference updated; inverse of red-team C4d killed; builder mutants 48 of 49 (R2h now equivalent).
r6 part 2: R5 (non-repo globs keep the pre-LC-1 touches rule), red-team r5 survivors folded in (percent compare, #* literal per SP2 lib.mjs/fence-hook.mjs, R3 in repo segment, R1 asymmetry). Red 5 of 8 on c367d15; mutants 59 of 60 (R2h equivalent).
