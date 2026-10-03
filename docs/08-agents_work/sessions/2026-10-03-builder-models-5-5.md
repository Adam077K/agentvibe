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
Not changed: `build/jobs.yml`, `build/providers/registry.yml` and `build/lint-jobs.mjs` still name `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5` and `claude-fable-5` (outside the stated scope); `scripts/warroom-engine.test.mjs:3317` fixture string.
