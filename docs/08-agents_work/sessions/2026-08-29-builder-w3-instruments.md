---
title: "W3-instruments — buffer ceiling, refusal diagnosis, judge-dir reclamation, and the tests that were missing"
date: 2026-08-29
engine: builder
task: w3-instruments
branch: feat/w3-instruments
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
tier: full
qa_verdict: PASS
round: "fix round after evidence FAIL on E-1 plus two converged blocking findings"
verification: "VERIFIED-BY-EXECUTION throughout. Composite baseline test:merge-gate 126 pass / 0 fail before, 141 pass / 0 fail after (merge-gate 61 -> 67, produce-verdict 65 -> 74). MUTATION TABLE, 14 cells against that green baseline, each restored by cp from a git show snapshot and byte-identity asserted at the end: 13 RED under mutation, 1 GREEN must-not-fire (an inert comment reword). Cells: ceiling never applied - malformed never refused - ENOBUFS branch deleted - run-refusal relabelled - readCommitted bare catch - keep-flag ignored - operator dir reclaimed - sweep no-op - never registered - stderr not captured - exit handler removed - signal handlers re-added - ephemeral predicate INVERTED. Every mutation asserts the file differs from its snapshot before the suite runs, so a denied write cannot read as a passing cell."
finding_my_own_tests_were_vacuous: "THE MUTATION TABLE CAUGHT THREE OF MY OWN CELLS. J-7 measured a before/after listener DELTA around an arming that installs nothing, because judgeDirCleanupArmed is already true by then - so re-adding the signal handlers was invisible; and its 'exit >= 1' was satisfied by the test file's own cleanup listener, so deleting the library's was invisible too. J-9 drove a REFUSED outcome, where the tree is deliberately KEPT either way, so the inverted predicate and the correct one were byte-indistinguishable - reclamation only happens on an outcome that reached an answer, and the cell now sits there with a mirror arm. Mutation 04 never ran at all: its anchor matched 2 sites and the driver skipped it rather than mutating the wrong one. Two wrong-arm controls and one unreachable baseline, all three in the tests written to close a finding about untested code."
widening_enumeration: "The no-relabel predicate WIDENED from e.config (malformed env only) to e.aboutThisRun (malformed env OR a buffer limit). What the old predicate relabelled and the new one does not: an ENOBUFS refusal from rev-parse inside mergeBase's try, and one from git show inside readCommitted. What is still relabelled, unchanged and pinned by W-5: a base that genuinely does not resolve, which still reports 'cannot resolve origin/main - Fetch it first'. What needed the old behaviour: nothing - it produced a false cause, and a sweep over scripts/, .github/ and mission-control/ finds no consumer matching that string (positive control on the same sweep found 'no readable JSON' in produce-verdict.mjs; negative control returned empty)."
disclosure_acknowledged: "The captured stderr can carry the absolute repository path into a machine-readable field an operator may paste into a committed --evidence string. Capped at 400 bytes, cannot carry diff bytes or environment values. Acknowledged in the source beside the capture and judged acceptable against losing the cause of every refusal."
not_done: "run-gate.mjs still sets no maxBuffer. Left deliberately at the reviewer's instruction: its exec sites are git diff --name-only and rev-parse, so output is bounded by path count, not content size."
---

Fix round on #126. Three blocking findings, all reproduced before being changed.

1. **E-1 — nothing asserted a line of this change.** 15 cells added across the two files
   `test:merge-gate` already runs, so no new step name. The specification is the mutation table.
2. **The ENOBUFS refusal was still relabelled** — its own thesis, unfixed. The marker covered
   malformed input while the comment claimed the class; ceilings of 1, 10, 40 and " 12 ", all
   well-formed, reported `cannot resolve "origin/main"` on a repo where it resolves.
3. **`readCommitted` asserted absence it had not checked.** A 20,301-byte record with a 105-byte
   diff read `ok:true` at the default ceiling and `absent` at 5000 — on the blocking path.

Also: signal handlers removed from the library and given to the CLI that owns the process;
`QA_KEEP_JUDGE_DIR` given a declared vocabulary so `0`/`false`/`no`/`off` stop meaning KEEP; and a
REFUSED run now keeps the tree it names, at one structural exit point rather than six return sites.
