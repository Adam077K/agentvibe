---
date: 2026-08-13
role: builder
task: mission-control-views
tier: lite
qa_verdict: PENDING_REVIEW
---

React 19 + Vite + Tailwind v4 client on 4301 proxying to 4300; `server/routes/stream.ts` (SSE, hash-compared slices, 1s sessions / 10s fleet); `server/state.ts` (one shared index); Fleet and Sessions views. Fleet gained per-project output tokens and launcher drift vs the modal in-scope generation; the index gained each session's latest-turn model (52ms across 2,037 files, vs +2.6s for the full set). 92 bun tests pass (was 47), `tsc --noEmit` clean and now IN the gate, `bun run build` ok, `npm run check` exit 0; `/api/sessions` 3.9s cold, 16-26ms warm; `/api/fleet` returns 10 non-agentvibe projects with data, `finfun` among them; server binds `127.0.0.1:4300` only (`lsof`).
Found by running/rendering it: Bun's 10s `idleTimeout` reaped every idle SSE connection (EventSource hid it by reconnecting forever) — now opted out per-request for `/events` only; `shortId` rendered every subagent transcript as the word "agent"; a cost column repeated three words in 200 rows. Found in review and fixed: the drift headline printed a convergence all-clear in the three cases where nothing was compared (`modalGeneration` is a named union now); the machine gate skipped on discovery returning zero — the result under test — so `MC_PROJECT_ROOTS=/nonexistent` reported 3 pass / 1 expect and now fails; scan diagnostics inside the fleet hash pushed the whole payload on writes that changed no figure; three parity mutations that survived green (time columns uncompared, `FleetHeadline` rendered by no test) now turn red; eleven design defects incl. sticky headers 100% occluded on scroll and `--color-dim` at 3.98:1. No dollar cost and no per-project 5h burn are shown — neither exists in this repo, and both absences are stated in the UI naming what would fill them.
