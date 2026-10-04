---
date: 2026-10-04
engine: builder
task: j2-stop
branch: build/j2-stop
qa_verdict: PENDING
tier: full
---
J2 Stop: `POST /api/missions/:id/stop` appends `stop_requested` (202; 409 unless queued/working; idempotent); the server never signals. The runner spawns children `detached`, polls the board, TERMs the group, KILLs after 5s (MC_STOP_GRACE_MS), waits for it to be empty, writes `stopped`, skips the Referee.
Review fixes: runner SIGINT/SIGTERM/SIGHUP stop the loop, block spawns, terminate groups, settle in-flight as `stopped`, release locks, exit 128+n. Groups are recorded in `<id>/children.jsonl` (pgid + `ps lstart`); `reapOrphanGroups` validates each record (safe int >1, not own pid/pgid, non-empty identity) and signals only while the recorded LEADER is alive with matching identity. Live groups: signalled while the leader is unreaped, or pinned (a member existed at leader exit, no empty look since).
Tests: run-missions.stop.test.ts (forking fakes, signals, forged records via a detached harness with a bystander canary), missions.test.ts, missions-stop.view.test.tsx.
KNOWN LIMITS: setsid/setpgid children escape the group kill; a recorded group whose leader is already dead is not reaped; identity is `ps` start time (1s). The kernel runner (B1-09a) is the real fix.
