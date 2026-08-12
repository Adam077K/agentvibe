---
role: ceo
task: phase-6-warroom-collapse
date: 2026-08-12
branch: feat/phase-6-warroom-collapse
tier: irreversible
qa_verdict: PASS
---

**Deliverables 4 and 5 of Phase 6 — the last two.** `war-room/` is gone: 25 files, 3,256 lines. It was never
one population, which is why "cut 25 routines to 3" was the wrong frame:

| Population | Files | Lines | Where it went |
|---|---|---|---|
| `parallel-*` | 6 | 860 | They **were** the engines, written twice |
| personas | 7 | 857 | Two genuinely distinct judging dimensions became review lenses (`risk`, `customer-value`); five duplicated existing ones |
| clock/event | 12 | 1,435 | Deleted — 20 called Supabase, 19 Linear, 16 Mem0, none configured, **and nothing scheduled any of them** |

**All three `harness-health` routines §3.8 asked for turned out to be scripts.** `reader` is `ledger sweep`;
`claim-refresh` is that sweep plus the `claim-freshness` resolver; `fleet-drift` already existed as
`npm run warroom:fleet`. Nothing needed to be an agent. Roster: **17 files, 6 engines + 11 shims.**

That directory is also where the decorative-capability failure survived the phase that deleted it. Sixteen
routines declared `budget: {max_cost_usd, max_runtime_minutes, max_tool_calls}` and nothing read any field —
the same shape as the 44 `mcpServers` declarations Phase 4a removed. It survived because `schema-lint.js`
deliberately did not walk there. **A checker's coverage is not its subject**, for the third time this phase.

**Memory: only `CODEBASE-MAP.md` becomes generated, and the non-lossy proof is real rather than argued.**
The pre-migration file had **zero content lines** outside headings and comments — it said "Empty." So is
`USER-INSIGHTS.md`; `LONG-TERM.md` holds ~10 real lines. The "data migration over files holding real founder
memory" was one file, `DECISIONS.md`, and that one **cannot** be a ledger view: it records rejected options
and rationale, and the claim schema has no field for either, so non-lossy fails by construction. It stays
human and append-only. Recorded as `c-decisions-not-ledger-derivable`.

The map is generated from disk and reads each file's own `POSTURE:` header rather than restating it, so a
hook that changes posture changes the map with it. `npm run check:map` fails on drift — caught its own first
drift when adding its npm scripts changed the table it generates.

**Verified:** `npm run check` exit 0 · 215 tests · `ledger verify` 50 pass · 2 would_block (canary) · 0 block
· sweep clean over 29 claims, canary fired 78×.

**Phase 6 is complete.** Stop condition 4 — *"the build extends past Phase 6 without an explicit decision to
continue"* — is now live and goes to the founder.
