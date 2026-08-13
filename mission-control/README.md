# Mission Control

A local, read-only, multi-project control plane. It watches multiple agentvibe projects at
once from one place, on this machine only — nothing here talks to the network beyond
loopback, and nothing here writes back into a project it observes.

PR1 shipped the rail, PR2 the data layer. **This PR ships the browser client and the first
two views: Fleet and Sessions.** Project and Inbox are PR5 and are absent rather than
stubbed.

## Running it

Two processes.

```bash
cd mission-control
bun install
bun run server    # 4300 — index, collectors, SSE
bun run dev       # 4301 — the client, proxying /api and /events to 4300
```

Then open <http://127.0.0.1:4301>. `curl http://127.0.0.1:4300/api/health` →
`{"ok":true,"port":4300,"host":"127.0.0.1"}`.

`bun run build` produces `client/dist/`. Nothing serves it yet — a single-port production
mode lands with PR5; the build is here because it is what proves the client compiles.

## Ports

| Port | What |
|---|---|
| 4300 | Server (`MC_PORT` overrides) |
| 4301 | Client (Vite dev server, `strictPort`) |

4200/4201 belong to the old dashboard at `war-room/dashboard/` — Mission Control does not
import from or run alongside it, but the ports are kept distinct so both could run at once
during any transition.

## The live channel

`GET /events` is Server-Sent Events, not a WebSocket. Read-only data flows one way, and the
browser's own `EventSource` reconnects with backoff and no client library — PR 8b's write
path is plain HTTP POST and reuses this stream for its reads.

The tick pushes **differences, not snapshots**: each slice is hashed (ignoring the
"generated at" fields) and written only when the hash moves, so an idle fleet costs an idle
socket. Two cadences, because the two slices cost three orders of magnitude apart —
measured on this machine's fleet of 19 projects and 2,036 transcripts:

| Slice | Cost per tick | Cadence | Why |
|---|---|---|---|
| `sessions` | ~16 ms | 1 s | `IndexStore.refresh()` — a `stat()` per transcript, and a read only of appended bytes |
| `fleet` | ~430 ms | 10 s | spawns `warroom-install.mjs fleet` once and `git worktree list` per project, plus the account-wide rolling-5h scan |

`Bun.serve`'s `idleTimeout` is set to `0` in `server/index.ts`. Its 10-second default reaped
every SSE connection the moment the fleet went quiet — which `EventSource` hid, by silently
reconnecting every ten seconds forever. `test/stream.test.ts` holds a real silent socket
open past that window rather than asserting the config value.

## What the views will not show you

- **Dollar cost.** The transcript index records token counts, not prices, and this repo has
  no per-model rate table. A hardcoded one would go stale silently. The Sessions view says
  so once, below the table, rather than printing a placeholder in every row.
- **Per-project rolling-5h burn.** `scripts/lib/usage.js` computes that window account-wide
  only. The Fleet view shows all-time per-project output tokens and labels the header figure
  as account-wide; it does not invent a per-project window.
- **The model a session used, in full.** The Model column is the model on the session's most
  recent recorded turn. Collecting every distinct model costs a second full parse of the
  corpus (measured: +2.6 s on a 4.1 s cold build against a 10 s budget); reading the last
  usage-bearing line costs 52 ms for all 2,036 files.

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
would still be a cache for a read that stays fast between those checkpoints. The live figure
as of PR3, measured through the route the views actually read: `/api/sessions` answers in
**3.9 s** cold and **26 ms** on the next call, across 2,036 sessions.

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
