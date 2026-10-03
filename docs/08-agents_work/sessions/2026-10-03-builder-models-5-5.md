---
date: 2026-10-03
engine: builder
task: models-5-5
branch: chore/models-5-5
qa_verdict: FOUNDER-APPROVED-NO-REVIEW
tier: irreversible
---
Pinned agents to `claude-opus-5-5` / `claude-sonnet-5-5` only. The founder approved this on 2026-10-03 ("I approve, no review needed") and waived review, so no QA verdict was recorded by the builder.
Changed: `VALID_MODELS` in `.claude/hooks/schema-lint.js`, the `model:` line of the 7 engine files, the `VALID_MODELS` pin and GOOD fixture in `scripts/prompt-standard.test.mjs`, the Models table in `CLAUDE.md`. The 11 shims declare no `model:` and are unchanged.
Verified: `schema-lint.js` 18 pass / 0 fail / 0 warnings; `node --test scripts/prompt-standard.test.mjs` 76 pass / 0 fail.
r2 (founder-approved extension): `build/jobs.yml`, `build/lint-jobs.mjs`, `build/lint-jobs.test.mjs` and the `scripts/warroom-engine.test.mjs` fixture moved to the two 5.5 ids (opus-5/fable-5 -> opus-5-5, sonnet-5/haiku-4-5 -> sonnet-5-5). lint-jobs 0 errors; build + prompt-standard tests 92 pass; warroom-engine 109 pass.
Not changed: `build/providers/registry.yml` (and its README) still name the four old ids. The row deletion it needs (haiku and fable rows would duplicate) was refused by the auto-mode classifier, so it is left for the founder.
