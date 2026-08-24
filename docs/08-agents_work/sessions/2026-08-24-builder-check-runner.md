---
date: 2026-08-24
role: builder
task: check-runner
qa_verdict: NOT-RUN
tier: full
risk: full
branch: fix/pr4-checkrunner
---
# `npm run check` ran 21 of 30 steps and reported one failure

Measured on `main` (`6db92ff`): thirty steps joined by `&&`; `check:mc` is step 21 and exits 1 without
`bun install` in `mission-control/`, so steps 22-30 never ran — the safety-hook tests, the gate's own tests,
`test:sandbox`. Baseline confirms zero invocations of all nine. CI is unaffected (separate steps);
`.claude/workflows/qa.js`'s ORACLE is not — it runs `npm run check` as one command as its deterministic floor.
`scripts/lib/check-suite.js` now owns the list (31 steps, adding `test:check-suite`); `scripts/run-checks.mjs`
runs all of them, streams via `stdio:'inherit'`, names failures before the tally, and sets `process.exitCode`
rather than `process.exit()` after a large write. `scripts/check-suite.test.mjs` is the drift guard, proved by
mutating the real `package.json` — 14/14. `check:citations` is EXCLUDED for the reason its own header gives.
