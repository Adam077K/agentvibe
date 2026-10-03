---
date: 2026-10-03
engine: builder
task: verdict-full-index
branch: fix/verdict-full-index
qa_verdict: PASS
tier: full
---
`scripts/verdict.mjs` computeSubject now diffs with `--full-index`, so the verdict subject no longer depends on core.abbrev (7 locally, 8 on the runner, growing with the repo). qa-lead-pass.yml calls `verdict.mjs subject`/`check`, so there is one implementation; `changedFiles` uses `--name-only` and prints no hashes.
Test: merge-gate.test.mjs "the subject does not depend on core.abbrev" asserts the raw diff differs at abbrev 7 vs 12 (premise), then the subject is identical under 7, 12 and the default. Mutation: removing `--full-index` fails it ("subject differs under core.abbrev=12").
Verified: `npm run test:merge-gate` 208/208; `npm run check:ledger` 113 pass, 0 block. classify: floor=full.
COMPAT: subjects of verdicts recorded before this change will not match after it; re-record any pending verdict. Merge after #166, #165, #167.
verdict recorded by: review-pr168, Opus 5.5, single family
