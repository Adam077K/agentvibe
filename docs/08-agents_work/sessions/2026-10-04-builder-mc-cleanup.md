---
role: builder
task: mc-cleanup
branch: build/mc-cleanup
tier: full
verdict recorded by: r139-reviewer, Opus 5.5, single family (recorded by founder)
qa_verdict: PASS
---
Six LOW mission-control follow-ups, test-first. (1) One shared pidAlive in scripts/pid-alive.ts; any error but ESRCH reads as alive. (2) withDecisions returns {interrupted:true} on a stop, so the runner settles stopped without a board read. (3) foldTeam resets slot mismatches at the runner's claim event (data.claimed); misindented for fixed. (6) foldBoard clears costUsd on queued/working, like error.
(4) GET /api/decisions rows carry missionStatus; the history shows "answered (mission stopped)". (5) Added the missing test: a stop from an earlier attempt does not block an answer after relaunch (200).
Left alone: scripts/consume-dispatch.ts has a third isAlive (EPERM-only alive, pid validity check first) outside the two named; not unified here.
Single-family review only: author-recorded against its own new tests, one agent, one model family; no multi-judge panel has run. No verdict recorded here.
