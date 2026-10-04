---
date: 2026-10-04
engine: builder
task: j2-stop
branch: build/j2-stop
qa_verdict: PENDING
tier: full
---
J2 Stop: `POST /api/missions/:id/stop` appends `stop_requested` (202; 409 unless queued/working; idempotent); the server never signals. The runner spawns children `detached`, polls the board, TERMs the group, KILLs after 5s (MC_STOP_GRACE_MS), waits for it to be empty, writes `stopped`, skips the Referee.
Review fixes: runner SIGINT/SIGTERM/SIGHUP stop the loop, block spawns, terminate groups, settle in-flight as `stopped`, release locks, exit 128+n. Each spawned group is recorded in `<id>/children.jsonl` (pgid + `ps lstart` identity); after a SIGKILLed runner, `reapOrphanGroups` kills it only while the identity holds. A group is forgotten only when empty (stragglers after a normal exit are terminated). `stop_requested` precedence fixed.
Tests: run-missions.stop.test.ts (forking fakes, signals, orphan reap, identity mismatch, straggler), missions.test.ts, missions-stop.view.test.tsx.
KNOWN LIMIT: a child that calls setsid/setpgid escapes the group kill; the kernel runner (B1-09a) is the real fix. Identity is `ps` start time (1s resolution).
