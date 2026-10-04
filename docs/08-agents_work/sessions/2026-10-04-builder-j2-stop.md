---
date: 2026-10-04
engine: builder
task: j2-stop
branch: build/j2-stop
qa_verdict: PENDING
tier: full
---
J2 Stop: `POST /api/missions/:id/stop` appends a `stop_requested` board line (202; 409 unless queued/working; idempotent). The server never signals: the runner spawns children `detached` (own process group), polls the board every 250ms, SIGTERMs the group, SIGKILLs after STOP_GRACE_MS (5s default, MC_STOP_GRACE_MS), waits for the group to be empty, then writes `stopped` (terminal) and releases the lock. No Referee after a stop; a queued+stopped mission is claimed, settled and never launched. Runner SIGINT/SIGTERM now terminate live groups; reconcile of a dead runner honours a pending stop.
Tests: test/run-missions.stop.test.ts (fake forking claude/codex; SIGTERM-ignoring grandchild), missions.test.ts (route, guard, server-has-no-kill scan), missions-stop.view.test.tsx. Mutations (kill pid not group; drop detached) fail 3 tests.
Verified: tsc clean; bun test 556 pass / 2 fail, both environmental (crosscheck ledger-verify timeout 120s, perf corpus test; perf passes alone).
Not verified: runner SIGKILL leaves orphan groups (no pgid recorded on the board).
