---
date: 2026-08-13
role: builder
task: mission-control-collectors
tier: lite
qa_verdict: PENDING_REVIEW
---

Phase 8a PR2: `server/projects.ts` (discovery, 8 registry-active projects incl. `finfun`, matching the brief), `server/index-store.ts` (disk-write-free in-memory session index, mtime-skip incremental refresh), 7 collectors (`transcripts`/`fleet`/`worktrees`/`conflicts`/`belief`/`events`/`empty`), `server/routes/api.ts`. No UI — React/Vite not added.
36 bun tests pass (`collectors`/`crosscheck`/`perf`/`smoke`); mutation gate confirmed (mutating a fixture's `output_tokens` moves the rolling-5h figure; `npm run check` exits 0. No review has run yet — `qa_verdict` is honestly PENDING_REVIEW, not self-granted PASS (repo's standing gap, task #24).
