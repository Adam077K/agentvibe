---
role: builder
task: main was red since #126 — the empty-diff regression, plus two panel advisories
date: 2026-09-01
branch: feat/w26-panel-findings
base: 32b3c72
tier: full
tier_driver: scripts/** (scripts/produce-verdict.mjs, scripts/produce-verdict.test.mjs)
qa_verdict: PASS
---

- **`main` was RED and every PR was GREEN.** J-9/J-10/J-12/J-13 left `runGateRunner` unset, so they called the live `run-gate.mjs`. A branch always has content in `origin/main...HEAD` (gate required → cells pass); on `main` the range is **empty**, the router returns `NOT_REQUIRED`, and all four fail their own DENOMINATOR. Found only by taking a baseline before mutating — CI at `32b3c72` FAILED on *Merge gate*, at `e8c8ae5` success.
- **Proven in the state that breaks it, not on my branch.** Detached at `origin/main`, emptiness asserted first (`origin/main...HEAD` → 0 files; control: the branch → 2; router: `files=0 gateRequired=false "empty diff"`), fix applied as working-tree changes so HEAD never moves. `fix REVERTED → rc=1, 141 pass · 4 fail` · `fix APPLIED → rc=0, 145 pass · 0 fail`. Control on a non-empty range: **both** arms rc=0, which is why no reviewer and no panel could have seen it.
- **Fix, in two parts** — route the four cells through the `routerRunner(routerJson(...))` seam the rest of the file already used, and pin the tip to the tree's **real HEAD**: `crossCheckArgs` refuses a synthetic sha ("the panel would review a different commit than the one this run is about"), so the seam alone moved `NOT_REQUIRED` → `REFUSED` one guard later.
- **Advisory `redundant-env-expr-produceVerdict` — closed.** The refusal message re-derived `o.env ?? process.env` while `env` holds that exact expression three lines above. Confirmed it reads the **same** source before deleting; a re-derivation of a *different* source would not be redundancy. Verified by execution: `REFUSED`, message renders `QA_KEEP_JUDGE_DIR="maybe"`.
- **Advisories `tests-unused-isjudgedirtracked` / `dead-isjudgedirtracked-unused` — closed by WIRING, and the docstring's own reason is not the one that justifies it.** J-9 already catches the `ephemeral` inversion. What nothing reached is the **REFUSED** path: the tree is kept either way there, so `fs.existsSync` cannot tell an armed directory from an unarmed one. J-14 asserts both arms at the registry.
- **Non-vacuity, measured, two mutations.** Invert `ephemeral` at the call site → J-14 red (with J-9/J-10/J-12). Delete the wrapper's REFUSED disarm → **J-14 is the ONLY cell that fails**; excluding J-14 the suite is `78 pass · 0 fail · rc=0`. Without J-14 that deletion leaves the exit sweep free to remove the one directory a refusal exists to preserve, after the last test has finished.
- **Verification:** `produce-verdict.test.mjs` 74 pass · 4 fail → **79 pass · 0 fail**; `npm run test:merge-gate` rc=1 → **rc=0, 145 pass**; `npm run check` **48 of 48 · 0 failed · rc=0** (169.5s; denominator derived from `check-suite.js`, not quoted).
- **Wrong-tree correction on my own earlier work:** two refutations I reported last round were void because I swept the **session root** (`e8c8ae5`) while the tree under test was my worktree (`32b3c72`). The grep was correctly quoted and its positive control fired in both arms — wrong subject, not broken operator. `QA_KEEP_JUDGE_DIR` and the judge-dir reclaim both exist.
- **Standing caveat:** author-recorded against a deterministic floor, one agent, one model family. No independent panel ran on this diff. *The checks ran and are green* is not *the tier was satisfied*.
