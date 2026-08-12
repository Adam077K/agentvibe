---
date: 2026-08-12
role: builder
task: mission-control-rail
tier: irreversible
qa_verdict: PASS
---

Added `mission-control/` — Bun+Hono, loopback-only (127.0.0.1), server 4300 / client 4301, rail only: no views, no collectors, no React/Vite yet.
`check.mjs` probes bun+deps before `bun test`; bun-absent prints a named stderr message and exits 1, never a stack trace. `npm run check` passes.
