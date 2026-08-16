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

Closed three ledger issues plus one adjacent defect (dispositionOutcome gap) in a single branch. 101 ledger tests, 51 claims tests, 0 failures. npm run check exits 0. ledger verify: 83 pass · 5 would_block · 0 block (reduced by 1 from baseline of 6 by fixing the deprecate gap in command/source resolvers).

**#69** — Replace HTML marker system with UNRESOLVABLE_CITATIONS. proseCodeSpans() scans only backtick inline code spans; dead citations now fail on CI with no global ledger present. Seven HTML marker comments removed from docs. Ratchet fires on uncited entries or scope:global entries the real global ledger no longer has.

**#55** — Add first_waived to KEY_ORDER; add WAIVER_CAP_DAYS=90 and waiverCapIssues() in cmdLint. Schema requires first_waived for scope:project waivers. Global waivers exempt (machine state, PR cannot migrate).

**#68** — collectGlobalClaims() catches ClaimError from parseYamlSubset, re-throws with err.stack = err.message (one-line clean message naming file and line). Three states remain structurally distinct: absent, corrupt, valid.

**dispositionOutcome gap** — dispositionOutcome() was only called by claim-freshness and claim-judge, not claim-command or claim-source. Deprecated command-claims kept running and failing (making `deprecate` unusable for command-claims). Fixed by adding dispositionOutcome() at the entry of command() and source(). refresh still does not short-circuit either resolver.

Files changed: scripts/ledger.mjs, scripts/lib/claims.js, scripts/lib/resolvers.js, scripts/claims.test.mjs, scripts/ledger.test.mjs, docs/03-system-design/CLAIM-LEDGER.md, docs/03-system-design/MODEL-DIVERSITY.md, docs/03-system-design/IMPLEMENTATION-PLAN.md. Tier floor: irreversible (scripts/lib/).

Finding to report: 2, 3, 6 from team-lead's baseline (c-sessionstart-injection-unverified, c-read-only-binding-unverified, c-runtime-nested-spawn) are all verified_by:judge with empty panels. A risk:high claim needs ≥2 distinct model families and there is no non-Anthropic model inside Claude Code, so these may be structurally unresolvable in this runtime. Noted — not acted on.
