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
exists on disk as Claude Code transcripts. A full parse of all 72 transcripts in this
machine's `~/.claude/projects/` measures **1,283 ms**. That is fast enough to derive history
on demand, on every request, from the source of truth — so there is nothing to keep in sync,
nothing to migrate, and nothing that can drift from the transcripts themselves. A database
would be a cache for a read that is already fast; collectors and views that read the
transcripts land in a later PR.

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
```
