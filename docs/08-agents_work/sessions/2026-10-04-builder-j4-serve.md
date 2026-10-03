---
role: builder
task: j4-serve
tier: full
qa_verdict: PENDING
---
J4 on build/j4-serve: mission-control serves client/dist from the Hono server (one port, 4300). New server/routes/static.ts, mounted last in app.ts behind the guard; /api and /events win; SPA fallback; missing dist -> 503 naming `bun run build`; `start` script added.
Confinement: NUL/backslash/`..` -> 400, realpath must stay under the real root (symlink out -> 404). test/static.test.ts 27/27; dropping the realpath check fails 2.
Full `bun test`: 526 pass / 3 fail before the LiveState fix. Fixed my test's indexCachePath (crosscheck convention); perf passes alone; ledger-summary test is a 120s timeout (the command alone takes 100s; same failure recorded on b0-03).
NOT RUN: live curl smoke test (refused by permissions), `bun run trust seed` (writes ~/.warroom), `bun run start`, `bun run missions`, consume-dispatch. README documents them from script headers.
Review FIX round: README now says `trust list` + `trust add` (seed only after reading); /events/ prefix excluded; nosniff + frame-ancestors on files; any-method JSON 404 under /api; safeSegments exported and unit-tested (static.test.ts 35/35, two mutations fail it).
