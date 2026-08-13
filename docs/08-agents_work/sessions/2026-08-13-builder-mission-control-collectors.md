---
date: 2026-08-13
role: builder
task: mission-control-collectors
tier: lite
qa_verdict: PENDING_REVIEW
---

`server/projects.ts` (discovery, 8 registry-active incl. `finfun`), `server/index-store.ts` (disk-write-free, mtime-skip refresh), 7 collectors, `server/routes/api.ts`. No UI. 36 bun tests pass, incl. write-guard (test/crosscheck.test.ts:194-220, walks server/** from disk) and mutation gate.
Fixture perf (24 files) passes <3000ms/<250ms — CI-safe, no `~/.claude/projects` on a runner. REAL corpus measured once (not asserted): 2,029 files / 2.7GB cold-builds in 3.6-4.1s across 3 runs — OVER the 3000ms target, reported plainly, not tuned to pass. `qa_verdict` stays PENDING_REVIEW (task #24).
