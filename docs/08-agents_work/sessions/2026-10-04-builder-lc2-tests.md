---
role: builder
task: lc2-tests
branch: build/b1-04r-overlap-tests
tier: full
qa_verdict: PENDING
---
LC-2 done-tests frozen, not implemented: new kernel/internal/lease/fence_overlap_donetest_test.go (10 tests), registered as RE-FREEZE r7 in build/done-tests/B1-04r.yml; check-done-tests exit 0 (102 hashes, 15 registers).
Ruling (ceo-1): no two jobs hold coverage of one resource. Chosen: an overlap QUEUES like an identical name (wait, wound-wait, Detect edge, max_wait); an expired overlapping row is reclaimed by the grant; Acquire refuses non-canonical repo:// names before deciding.
Probed on 963613b: glob/exact both ways, nested globs and db:// globs all double-granted; Acquire granted repo://**, traversal, empty anchor, '*' paths, repo://a.
Red 10 of 10 on main; every other lease test green untagged, tagged, -race. Scratch reference green in all four configs. Mutants 30 of 32 killed by the new file, 1 by frozen HotSetValidationAndOrder, 1 equivalent (slash-bounded string prefix).
r7 part 2 (R6): #* and the bare file overlap every symbol of their repo:// file for Acquire only; OverlapWholeFile replaces StarAnchorIsLiteral; mutants 36 of 38 (+1 frozen, 1 equivalent), R6 9 of 9.
NOT frozen: HotCandidates edges through overlap; legacy non-canonical rows in a Journal.
