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

The tick pushes **differences, not snapshots**: each slice is hashed and written only when
the hash moves. Two cadences, because the two slices cost three orders of magnitude apart —
measured on this machine's fleet of 19 projects and 2,037 transcripts:

| Slice | Cost per tick | Cadence | Why |
|---|---|---|---|
| `sessions` | ~16 ms | 1 s | `IndexStore.refresh()` — a `stat()` per transcript, and a read only of appended bytes |
| `fleet` | ~430 ms | 10 s | spawns `warroom-install.mjs fleet` once and `git worktree list` per project, plus the account-wide rolling-5h scan |

**What "an idle fleet costs an idle socket" does and does not mean.** The `sessions` slice
goes completely silent — appending a line that carries no usage record moves no figure and
writes no bytes, which `test/stream.test.ts` pins in both directions. The `fleet` slice does
**not** go permanently silent even on a wholly idle machine: it carries the account-wide
rolling-5h token figure, and that changes as turns age *out* of the window with nothing
happening at all. An occasional `fleet` frame on an idle fleet is a number that really did
change, not a spurious push.

What is excluded from the hash is written as an explicit projection in `server/state.ts`
rather than a set of key names stripped at any depth — a name-based stripper would silently
exclude the next field anyone happens to call `now`. `filesScanned` and `bytesRead` are
excluded too: they are diagnostics of the scan, not the figure it produced, and they move on
*any* append to *any* transcript, which pushed the whole 19-project payload on writes that
changed nothing on screen. They stay in the payload as provenance.

**The idle reaper.** `Bun.serve` closes a connection after 10 idle seconds by default, which
killed every SSE connection the moment the fleet went quiet — hidden by `EventSource`
silently reconnecting every ten seconds forever. `/events` opts out **per request** via
`server.timeout(req, 0)`; the server keeps Bun's default for every other route, because a
server-wide `idleTimeout: 0` also lets a finished `GET /api/health` hold its keep-alive
socket open indefinitely. `test/stream.test.ts` serves with the default and holds a real
silent socket past the window, rather than asserting a config value.

## Explanations are not mouse-only

Every absent value in this UI says what would fill it, and for one round that sentence was
delivered exclusively through `title` — 118 attributes on Fleet, 806 on Sessions, none on a
focusable element. `title` is unreachable by keyboard, is not volunteered by a screen reader,
and does not exist on touch. Naming a gap and withholding the one sentence that makes it
actionable is worse than showing no explanation at all.

`Unavailable` — the component that renders every such value — is now `tabIndex={0}` with the
full reason as its `aria-label`, so it is in the tab order and announced on focus. `title`
stays for the pointer.

This is deliberately **not** applied to all ~900 titles. Making every exact token count and
every timestamp a tab stop would put hundreds of stops between a keyboard user and the next
control, which is its own failure. The line drawn: an element whose *whole purpose* is to
explain an absence must be focusable; a title that merely adds precision to a value already
on screen need not be. Every capped column (`Session`, `Project`, `Model`) does carry its full
value in a title, which is a pointer-user fix — CSS truncation never removes text from the
accessibility tree.

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
**3.9–4.1 s** cold and **16–26 ms** on the next call, across 2,037 sessions.

## Checking it

`npm run check:mc` from the repo root runs `mission-control/check.mjs`, which confirms bun
and its dependencies are present (`--probe`), then **typechecks** (`tsc --noEmit`), then runs
`bun test`. It fails with a named message — never a stack trace — when bun or `node_modules`
is missing.

The typecheck is in the gate as of PR3, and it should have been there from PR1: `bun test`
runs TypeScript by *stripping* types, never checking them, so for two PRs nothing in
`npm run check` or CI ever ran `tsc`. That was survivable for server code with heavy runtime
tests. It stopped being survivable when the client landed, because the client imports its
wire types straight from the server specifically so that adding a field to `FleetRow` and
forgetting the view is a compile error — a guarantee whose entire enforcement was a comment
claiming it existed.

### Machine-gated tests

`test/gate.ts` is the one implementation of "can this machine answer", imported by both
`live.test.ts` and `views.test.tsx`. It fires on exactly one condition — `~/.claude/projects`
absent, the CI-runner case — and prints
`… NOT VERIFIED — <reason>. Nothing was compared; this is not a pass on the merits.`

It deliberately does **not** consult discovery. An earlier version skipped whenever discovery
returned zero projects, which is the *result of the operation under test*, not a property of
the machine: `MC_PROJECT_ROOTS=/nonexistent bun test test/live.test.ts` reported **3 pass, 1
expect() call** — every real assertion skipped, the gate's own pin still green.

Extracting the gate did not by itself finish the job. For one round `views.test.tsx` kept an
inline copy carrying the same defect, so that command turned `live.test.ts` red and left
`views.test.tsx` at **17 pass / 0 fail** — while this section, and two code comments, said
the consolidation was complete. Both files fail now.

## One claim, one population

The Fleet headline reads *"N of M in-scope launchers, off X"*. For one round its numerator
counted **projects** (`projects.filter(p => p.launcherDrift)`) and its denominator counted
**launchers**. On this machine it rendered `2 of 11` while four in-scope launchers were
genuinely off-modal — `acme` has no discovered project and so could never be counted, and
`beamix` was lost to a case-sensitive lookup against a `Beamix` directory. The all-clear
branch was reachable with launchers still off-modal, re-entering the sentence the named
`ModalGeneration` union exists to prevent.

Both figures now come out of `modalInScopeGeneration()`, one pass over one array, and travel
together inside the `modal` variant. `GenerationFigure` takes no second count, so there is no
other population within reach of the component that renders the sentence. Per-project
`launcherDrift` still exists and is still a fact about that project's launcher — it is simply
not what the headline counts.

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
