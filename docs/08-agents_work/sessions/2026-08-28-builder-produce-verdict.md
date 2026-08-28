---
role: builder
task: produce-verdict — the step that makes a QA verdict exist
date: 2026-08-28
branch: feat/produce-verdict
base: b4ea862
tier: full
tier_driver: scripts/** (scripts/produce-verdict.mjs)
qa_verdict: PASS
---

- `scripts/produce-verdict.mjs` runs the panel in a bare session whose cwd is a materialised copy of `origin/main`, then decides only from a verdict record read with **main's** `verdict.mjs`. Four states: PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3 · usage 64.
- **F-2 (HIGH, fixed).** `tip` was frozen pre-launch and the post-check read there, but the session records *and commits*, putting the record on a descendant — so **PRODUCED was unreachable through a launch** and closed only on an undocumented second invocation. The post-check now reads at the post-launch HEAD and **requires the subject to equal the one reviewed**; the subject excludes `.qa/verdicts/*.json`, so equality proves the session added a verdict and nothing else. The pin is kept for the pre-check, where it is right.
- **F-1 (HIGH, fixed).** `run-gate.mjs` reads no repo flag (grepped: 0, controls 4 and 5) and resolves `REPO_ROOT` from its own location, so the CLI's `--repo` selected a tree nothing downstream honoured. The flag is **removed**; a programmatic `repo` that is not `harnessRoot` is REFUSED; and the human path now prints tree, ref and head.
- **F-3 (MEDIUM, fixed).** `verdict.mjs record` accepts only `PASS|FAIL`, so matching the literal `BLOCK` made BLOCKED unreachable and read a bound FAIL as "establishes nothing". `FAIL` and `BLOCK` both map to BLOCKED; `buildGoal` now asks for `PASS|FAIL` and says to record nothing on a refusal.
- **F-4 / F-5 (LOW, fixed):** `--help` exits **64**, outside the four terminal codes; a flag with a missing value is refused rather than defaulting — `--launcher --json` no longer spawns the real `claude`.
- **E6 (p1, fixed).** Nothing asserted the `test:merge-gate` argv names this file, so deleting the filename dropped its tests with everything green. `check-suite.test.mjs` now asserts **every** `scripts/*.test.mjs` is named by some script, with an exemption map that must say why and may not rot. **Found in passing:** `claim-append.test.mjs` is run by nothing — pre-existing, exempted with its reason, deliberately not wired by this lane.
- **The meta-finding is what drove the round:** every seam injected for testability was a seam the tests stopped watching. Four tests now drive the **real** `verdict.mjs` end to end — record, commit, re-check — and no longer stub the relationship.
- Evidence: `npm run check` **48 of 48 · 0 failed · exit 0**, 190.1s, sandbox armed · `produce-verdict` 40 pass · `check-suite` 72 pass · 8-cell mutation table, 7 FIRED and 1 SILENT, all as predicted; "post-check reads the pinned tip only" fires with 3 failures, so the fixtures express the defect rather than the fix.
- **Unresolved:** the end-to-end panel has never been driven through this mechanism, and nothing in CI invokes the producer — only its tests run. Author-recorded, one agent, one model family: *the checks ran and are green* is not *the tier was satisfied*.
