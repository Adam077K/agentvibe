---
role: builder
task: j3-decisions
tier: full
verdict recorded by: j3-reviewer, Opus 5.5, single family (recorded by founder)
qa_verdict: PASS
---
J3 on build/j3-decisions (from b0-03 @55f2f26): founder answers an agent's question in the UI and the waiting mission continues.
Store ~/.agentvibe/missions/decisions.jsonl, beside the board (follows MC_MISSIONS_DIR; was a global file, which let a runner on another board expire a live question): decision_needed / decision_answered / decision_expired (mine: a timed-out or orphaned wait must leave pending; a late answer is refused 409).
Server only appends (server/decisions.ts fold, routes/decisions.ts); runner logic is scripts/decisions.ts; run-missions.ts edit is one call site, `extraPrompt`, and an orphan sweep at start.
POST guards: app-level crossSiteGuard (403, tested via createApp) + Content-Type JSON (415) + Content-Length/2 KiB cap (413) + mission must be `working` (409) + post-append re-fold (200 only if it landed).
Review follow-ups fixed: orphan expiry on runner start (dead/absent runnerPid or non-working mission), answer-vs-expiry race (re-fold after `expired`, first terminal wins), torn-tail newline in appendMissionLine, single-flight answer buttons, quoted Builder-authored question in the resumed prompt.
KNOWN LIMITS: (1) a runner killed mid-wait and not restarted leaves the card `working` and the answer unread; the sweep runs only at runner start. (2) the wait is inside the serial runner loop, so a mission waiting on a founder blocks every other queued mission for up to MC_DECISION_TIMEOUT_MS (default 30 min). Not changed, by decision.
Client: DecisionsView, nav badge (AppBar `badges`), "needs you" pill on Missions cards derived from pending decisions. Tier floor full.
