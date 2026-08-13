# Mission Control

A local, read-only, multi-project control plane. It watches multiple agentvibe projects at
once from one place, on this machine only — nothing here talks to the network beyond
loopback, and nothing here writes back into a project it observes.

**This PR ships the rail only.** No views, no collectors. It exists to prove one thing: a
Bun/Hono app under `mission-control/` is inside `npm run check`, and CI can run it. The
server has exactly one route (`GET /api/health`) and the client is not started yet — React
and Vite are deliberately not added in this PR.

## Running it

```bash
cd mission-control
bun install
bun run server/index.ts
```

Then `curl http://127.0.0.1:4300/api/health` → `{"ok":true,"port":4300,"host":"127.0.0.1"}`.

## Ports

| Port | What |
|---|---|
| 4300 | Server (`MC_PORT` overrides) |
| 4301 | Client (reserved; nothing serves it yet) |

4200/4201 belong to the old dashboard at `war-room/dashboard/` — Mission Control does not
import from or run alongside it, but the ports are kept distinct so both could run at once
during any transition.

The server binds `127.0.0.1` only, as a literal in `server/config.ts` rather than an
environment override — there is no flag that pushes this onto `0.0.0.0`.

## Why there is no database

Mission Control's job is to answer "what happened in this project," and that answer already
exists on disk as Claude Code transcripts. This machine's `~/.claude/projects/` holds
**2,029 files, 2.83 GB** — a full cold build of Mission Control's in-memory session index
measures **3.6–4.1 s**, against a **10 s** budget. Once that cost is paid, the incremental
refresh — reading only bytes appended since the file was last seen, skipping any file whose
mtime hasn't moved — measures **~4 ms**. So the lived cost of deriving history on demand
rather than storing it is the 4 ms, not the several seconds: cold start is paid once per
daemon launch, not on every request.

*(An earlier version of this section said 72 files / 0.44 GB / 1,283 ms. That scan walked
`~/.claude/projects/` only two levels deep and undercounted the real corpus by 28x — corrected
2026-08-13. Do not restate the old figures.)*

This is an accepted cost, not a solved problem — the corpus only grows, and 3.6–4.1 s today
is not 3.6–4.1 s forever. Rather than let the budget quietly become fiction, it is bound to a
claim with an expiry (`c-mission-control-cold-start`, below): when the real cold build crosses
10 s, the ledger fails and forces a Refresh, Deprecate or Waive instead of silence. A database
would still be a cache for a read that stays fast between those checkpoints; collectors and
views that read the transcripts land across PR2–PR5.

## Checking it

`npm run check:mc` from the repo root runs `mission-control/check.mjs`, which confirms bun
and its dependencies are present (`--probe`) and then runs `bun test`. It fails with a named
message — never a stack trace — when bun or `node_modules` is missing.

```claims
claims:
  - id: c-mission-control-rail
    assert: "Mission Control's check entry point resolves Bun and its dependencies, and reports a named failure rather than a stack trace when either is absent"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "node mission-control/check.mjs --probe", expect_exit: 0, expect_stdout: "bun .* ok"}
    valid_until: 2027-02-12
    confidence: 0.95
  - id: c-mission-control-cold-start
    assert: "Mission Control's cold index build over the full local transcript corpus completes within the 10s budget"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "bun run mission-control/scripts/check-cold-start.ts", expect_exit: 0}
    valid_until: 2026-11-13
    confidence: 0.8
```

`check-cold-start.ts` exits 2 — not 0, not the same failure as going over budget — when this
machine has no real transcript corpus to measure (e.g. a CI runner with no
`~/.claude/projects`): unresolved, not a vacuous pass. `expect_exit: 0` means both "over
budget" (exit 1) and "no corpus" (exit 2) correctly fail this claim rather than silently
passing on a machine that never actually measured anything.
