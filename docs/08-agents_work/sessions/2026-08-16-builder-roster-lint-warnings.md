---
date: 2026-08-16
role: builder
task: roster-lint-warnings
branch: fix/roster-lint-warnings
qa_verdict: PASS
tier: irreversible
---

- Fixed PS-SECTION-ORDER in reviewer-readonly.md: moved `## Workflow position` and `## Key distinctions` before `## Pre-flight reads` to match canonical order.
- Fixed framer isolation=none warning: schema-lint.js now scopes the collision-risk warning to workers that also have Bash (can commit); document-only producers without Bash (framer) are correctly exempt.
- Fixed PS-BODY-VAGUE: introduced `BODY_VAGUE` in `lintPromptStandard` excluding `looks?`/`feels?` — all 10 false positives used those words as observation verbs or comparison constructors, not vague quality judgments. Full `VAGUE` preserved for lens procedure checks.
- Updated prompt-standard.test.mjs pinned counts from 6 files/10 sites to 0/0; updated PS-SECTION-ORDER test to verify the fix.
- Documented §0 decision in PROMPT-STANDARD.md: option (b), predicate narrowed, not prose deleted.
- Result: schema-lint → 18 pass · 0 fail · 0 warnings. npm run check → 59 pass · 0 fail.
- Tier: irreversible (.claude/agents/** + .claude/hooks/**). PR needs `risk:irreversible` label.
