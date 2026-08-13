---
date: 2026-08-13
role: builder
task: mission-control-views
tier: lite
qa_verdict: PENDING_REVIEW
---

React 19 + Vite + Tailwind v4 client on 4301 proxying to 4300; `server/routes/stream.ts` (SSE, hash-compared slices, 1s sessions / 10s fleet); `server/state.ts` (one shared index); Fleet and Sessions views. Fleet gained per-project output tokens and launcher drift vs the modal in-scope generation; the index gained each session's latest-turn model (52ms across 2,036 files, vs +2.6s for the full set). 79 bun tests pass (was 47), `bun run build` ok, `npm run check` exit 0; `/api/sessions` 3.9s cold, 23-26ms warm; `/api/fleet` returns 10 non-agentvibe projects with data, `finfun` among them; server binds `127.0.0.1:4300` only (`lsof`).
Three defects found by running and rendering it, all fixed and pinned by tests: Bun's 10s `idleTimeout` reaped every idle SSE connection (EventSource hid it by reconnecting forever); `shortId` rendered every subagent transcript as the word "agent"; the cost column printed the same three words in 200 rows and is now one statement below the table. No dollar cost and no per-project 5h burn are shown — neither exists in this repo, and both absences are stated in the UI naming what would fill them.
