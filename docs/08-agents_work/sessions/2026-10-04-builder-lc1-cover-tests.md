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
