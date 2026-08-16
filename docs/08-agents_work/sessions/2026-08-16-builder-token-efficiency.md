---
date: 2026-08-16
role: builder
task: token-efficiency
tier: full
qa_verdict: PASS
---

**DECISIONS.md grew to 58,166 bytes (38 entries) with no enforcement.** The entry cap was under budget; the byte budget was not, because CLAUDE.md declared the entry cap only — no byte budget existed, so nothing could measure a violation. TOKEN-EFFICIENCY.md §3.2 measured it at 46,655 bytes as of the previous audit and already marked it VERIFIED as exceeding budget. By 2026-08-16 it had grown 25% further with no mechanism to notice.
**Archived 15 entries** (Phase 1-3 specifics, superseded decisions, and entries whose information lives in other documents) to `.claude/memory/DECISIONS_ARCHIVE.md`. Nothing deleted. Remaining: 23 entries, 39,909 bytes — under the 40,000-byte ceiling.
**`scripts/check-memory-budget.mjs` enforces both the entry cap (≤ 50 dated `## YYYY-MM-DD` headings) and a byte ceiling (≤ 40,000 bytes) on DECISIONS.md, plus the ≤ 100-line cap on LONG-TERM.md.** The byte cap is 50 entries × 800 bytes/entry. The checker counts entries by the `/^## \d{4}-\d{2}-\d{2}/m` pattern, so the `## Format` heading in the template section is excluded. 8/8 mutation tests pass, including one asserting the format heading does not add to the count and one pinning the real repo against the floor.
**`scripts/check-dispatch-prompt-size.mjs` implements `PS-DISPATCH-BRIEF-SIZE` from PROMPT-STANDARD.md §6.2.** Posture: `WARN` (exits 0 on policy violations; exits 1 only on the non-vacuity floor). The spec threshold is ~30,000 chars (the brief mentions 8,000; the spec wins — reported here). Second condition per spec: inline fenced block > 200 lines. Both conditions WARN, never FAIL, because "blocking on a byte count over free text is exactly the false positive §0 forbids" (§6.2). This script lives in `scripts/` not in `schema-lint.js` because it scans `.claude/workflows/*.js` (a different surface from agent files), and schema-lint.js owns `.claude/agents/*.md` only. The PS-* rule id is the same in both places.
**Coverage limits, stated:** Runtime prompt size is out of reach. A template `\`hello ${bigVar}\`` that is 30 chars in source but 500,000 chars at runtime is invisible to a static linter — stated in both the script header and PR body. Threshold difference: team-lead brief said ~8,000 chars; PROMPT-STANDARD.md §6.2 says ~30,000 chars. Spec wins.
**Non-vacuity floor: 12 dispatch sites asserted.** Currently finds exactly 12. Largest inline literal: 399 chars (design.js) — well under 30,000.
**CI line needed but not added (owner: lane editing ci.yml):** `npm run check:dispatch-prompt && npm run check:memory` after the existing `check:dispatch` step, or via the updated `npm run check` chain.
**Verified:** `npm run check:memory` 8/8 pass; `npm run check:dispatch-prompt` 8/8 pass; `npm run check` exits 0; `node scripts/ledger.mjs verify` → 7 would_block (shadow) · 0 block (baseline origin/main was 9).
