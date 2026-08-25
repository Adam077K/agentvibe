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
conclusion, not just its citation: top level and foreground it is **344 pass / 1 fail**, sandbox off **345 /
0**. **It cannot pass locally at all — the variable is the sandbox, not nesting**; the old 345-vs-344 pair was
that settings key exempting the standalone cell, so there is no local workaround to prescribe and CI is where
the coverage lives. The regex pinning those figures kept passing after they stopped reproducing; dropped for
citation checks that resolve. Also: `lint:agents` could be deleted from `STEPS` with the drift guard green
(`GOVERNED` matched only `check:`/`test:`), and a real Ctrl+C never reached the INCOMPLETE path. Both fixed,
both proved by mutation. CLAUDE.md's derivation returned **1**, not 30. `npm run check` → **30 of 30 · exit
0**; `test:check-suite` 24/24.
**Post-merge:** `main` went red on step 1 — `protected-write.test.mjs` asserted the **spec** reporter's
`ℹ tests 1`, but `node --test` picks its reporter by version and `ci.yml` pins Node 20, which emits TAP
`# tests 1`. The probe worked; the detector asserted a format instead of a fact. It now records that the case
ran by touching a marker file — true under any reporter — and pins `--test-reporter=tap` for the assertions
that parse the same output. Verified under tap, spec and the version default. Sole such site in the repo.
