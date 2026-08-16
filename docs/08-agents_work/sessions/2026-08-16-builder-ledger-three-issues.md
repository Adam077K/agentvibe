---
date: 2026-08-16
role: builder
task: ledger-three-issues
branch: fix/ledger-three-issues
worktree: .worktrees/lane-ledger3
qa_verdict: PASS
tier: irreversible
issues_closed: [69, 55, 68]
---

Closed three ledger issues in a single branch. All 148 tests pass; npm run check exits 0.

**#69** — Replace HTML marker system with UNRESOLVABLE_CITATIONS. proseCodeSpans() scans only backtick inline code spans; dead citations now fail on CI with no global ledger present. Seven HTML marker comments removed from docs. Ratchet fires on uncited entries or scope:global entries the real global ledger no longer has.

**#55** — Add first_waived to KEY_ORDER; add WAIVER_CAP_DAYS=90 and waiverCapIssues() in cmdLint. Schema requires first_waived for scope:project waivers. Global waivers exempt (machine state, PR cannot migrate).

**#68** — collectGlobalClaims() catches ClaimError from parseYamlSubset, re-throws with err.stack = err.message (one-line clean message naming file and line). Three states remain structurally distinct: absent, corrupt, valid.

Files changed: scripts/ledger.mjs, scripts/lib/claims.js, scripts/claims.test.mjs, scripts/ledger.test.mjs, docs/03-system-design/CLAIM-LEDGER.md, docs/03-system-design/MODEL-DIVERSITY.md, docs/03-system-design/IMPLEMENTATION-PLAN.md. Tier floor: irreversible (scripts/lib/claims.js).
