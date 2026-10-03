---
role: builder
task: j3-decisions
tier: full
qa_verdict: PENDING
---
J3 on build/j3-decisions (from b0-03 @55f2f26): founder answers an agent's question in the UI and the waiting mission continues.
Store ~/.agentvibe/decisions.jsonl (MC_DECISIONS_FILE): decision_needed / decision_answered, plus decision_expired (not in brief: a timed-out wait must leave pending, and a late answer is refused 409).
Server only appends (server/decisions.ts fold, routes/decisions.ts); runner logic is scripts/decisions.ts, run-missions.ts edit is one call site + `extraPrompt`.
POST guards: app-level crossSiteGuard (403 tested through createApp) + Content-Type application/json (415) + 2 KiB body cap; no Zod in the package, so hand validation like the missions routes.
Client: DecisionsView, nav badge (AppBar `badges`), "needs you" pill on Missions cards derived from pending decisions, not written to the board.
Verification: see the builder's return message for tallies. Tier floor full (mission-control/server/**, scripts/**).
