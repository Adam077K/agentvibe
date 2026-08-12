---
date: 2026-08-12
role: builder
task: mission-control-rail
tier: irreversible
qa_verdict: PASS
status: Complete
---

# Session Log: builder — Mission Control rail

Added `mission-control/` (Bun/Hono, one `/api/health` route, loopback-only, ports
4300/4301) with a plain-Node `check.mjs` probe/test entry, wired into `npm run check` and
CI via `oven-sh/setup-bun@v2`. No views, no collectors, no React/Vite — rail only.

`npm run check` and `node mission-control/check.mjs --probe` both pass; the bun-absent
path prints a named message and exits 1, never a stack trace.

---

*Session by: builder | 2026-08-12*
