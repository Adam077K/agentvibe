---
date: 2026-08-25
role: builder
task: review-fixes
qa_verdict: NOT-RUN
tier: full
risk: full
branch: fix/pr5-review-fixes
---
# Four review findings, and a brief corrected twice by the measurements

`node scripts/run-checks.mjs --steps ,` printed `✓ check suite passed — every step ran.` at exit 0 — a real
green floor from a process that ran nothing, reachable from `npm run check` by appending arguments, in the
one output `.claude/workflows/qa.js` dispatches an agent to read. Now two independent guards: `--steps`/
`--root` require `CHECK_SUITE_TEST_HARNESS=1`, and a zero-step list is REFUSED whatever produced it. The new
test then found a third hole unaided — `--steps ""` ran the WHOLE suite while the banner said subset.
**The `check:mc` exclusion cited `sandbox.excludedCommands`, reverted in `ab46d40`.** Re-measuring refuted its
conclusion, not just its citation: sandboxed **343 pass / 2 fail**, sandbox off **345 pass / 0 fail**, same
top-level command five minutes apart. **The variable is the sandbox, not nesting** — the old 345-vs-344 pair
was that settings key exempting the standalone cell. `check-suite.test.mjs` now checks CI citations against
`ci.yml` by mutation. CLAUDE.md's derivation returned **1**, not 30; replaced, with three false statements
corrected in place. `npm run check` → **30 of 30 · exit 0**; `test:check-suite` 21/21.
