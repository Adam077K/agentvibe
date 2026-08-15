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

## Trusted projects — which directories may have programs run for them

Mission Control shells out. `git status` runs with its working directory **inside** a
discovered worktree, and git there honours that repository's own `.git/config` — where
`core.fsmonitor` names a program git executes. `node <project>/scripts/ledger.mjs` runs the
project's own file. On 2026-08-14 that produced three confirmed RCEs, reachable by any
repository under `~/VibeCoding` that you did not write
([SECURITY-FINDINGS-2026-08-14.md](../docs/03-system-design/SECURITY-FINDINGS-2026-08-14.md)).

All three shared one premise: **discovery implied trust.** So discovery no longer does.

```bash
bun run trust list            # what is trusted, and what was discovered and is not
bun run trust seed            # write the list from what is discovered right now
bun run trust add <path>      # trust one project
bun run trust remove <path>   # stop trusting one
```

The list is `~/.warroom/trusted-projects` — one absolute path per line, `#` for comments,
hand-editable. It lives there and not in this repository for two reasons: `mission-control`
itself sits inside `~/VibeCoding/agentvibe`, which is one of the directories the list
governs, so a file in the tree would be inside the boundary it defines; and the paths are
machine-specific, so committing them makes one person's fleet another person's trust
decision. `MC_TRUSTED_FILE` points at a different file (tests, a second instance); it does
not carry the list.

Matching is **exact path equality** after canonicalisation. No globs, no prefixes — a prefix
rule spells "everything under `~/VibeCoding` is trusted", which is the premise above wearing
a config file.

**On a machine with no list, nothing is trusted, and nothing is hidden.** Every project is
still discovered and still shown; each one renders with the reason it was excluded and the
command that includes it. `bun run trust seed` writes the whole discovered fleet in one go so
nobody types nineteen paths — and the file it writes says, in its own header, that seeding
trusted whatever was already on disk and checked none of it. What the list buys is that every
project appearing *after* the seed is a decision.

The server does not write this file. `bun run trust` does. `server/**` mutates no disk at all
— `test/crosscheck.test.ts` fails on a write call site anywhere under it — and a trust
decision made silently at first boot would be the one thing a trust list must never do.

**What this does not fix.** An allowlisted project that later becomes hostile — a dependency
you pulled, a clone you forgot writing — is still full RCE. This converts *trust what you
find* into *trust what you named*. That is a real reduction and it is not a fix.

**What is still ungated, stated rather than left to be found.** `/api/fleet` runs
`git worktree list --porcelain` with its working directory inside every discovered project,
trusted or not, to produce each row's worktree count. Measured on 2026-08-15 through that
route: the `core.fsmonitor` payload that F1 executes through `/api/conflicts` did **not** run
under `git worktree list`. That is one measurement of one subcommand, not an audit of git's
config surface, and it is the reason this section says "collectors that execute project code"
rather than "every subprocess".

## Cross-site browser requests are refused

Every route answers `403` to a request carrying `Sec-Fetch-Site: cross-site`
(`server/routes/guard.ts`, registered above the router in `server/app.ts` so a route added
later is covered by default).

Measured on 2026-08-15 in Chromium, attacker page on `localhost:4312` against the server on
`127.0.0.1:4311`, read from the server side because the browser does not expose `sec-*` to
page script:

| request | `Sec-Fetch-Dest` | `Origin` | `Sec-Fetch-Site` | result |
|---|---|---|---|---|
| `<img src>` | `image` | **absent** | `cross-site` | 403 |
| `<script src>` | `script` | **absent** | `cross-site` | 403 |
| `<link rel=stylesheet>` | `style` | **absent** | `cross-site` | 403 |
| form GET into an iframe | `iframe` | **absent** | `cross-site` | 403 |
| `fetch(…, {mode:'no-cors'})` | `empty` | **absent** | `cross-site` | 403 |
| `fetch(…)` with CORS | `empty` | `http://localhost:4312` | `cross-site` | 403 |
| the user typing the URL | `document` | absent | `none` | **200** |

**`Origin` was absent on five of the six attack vectors.** That is why this is not an Origin
check: an Origin check must allow *absent* — the app's own same-origin GETs send none either
— and once it does, the `<img>` vector walks straight through. `Origin` is checked alongside
as defence in depth only.

**It blocks cross-site browser requests. It does not "block drive-by".** `same-site` is
allowed, so any other service on your loopback still reaches everything here, and a
non-browser client (curl, any local script) sends no such header at all and is allowed. No
header check can reach the loopback case. The wording in the code says the same thing.

Verified end to end with the hostile project *deliberately trusted*, so the header guard was
the only thing standing between the attacker's `<img>` and execution: the marker file was
**not** written by the attacker's page, and **was** written by the user's own navigation to
the same URL in the same browser against the same server.

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

`test/gate.ts` holds two things, and they are not the same thing. `machineGate()` is the one
implementation of "can this machine answer" — used by `live.test.ts` and `views.test.tsx`, and
firing on exactly one condition: the corpus, resolved the way the code under test resolves it,
holds no transcript. `notVerified()` is only the printer, and emits
`… NOT VERIFIED — <reason>. Nothing was compared; this is not a pass on the merits.`

`crosscheck.test.ts` imports the printer alone. Its subject is `~/bin`, not the corpus, so it
has its own predicate and should — one wording for "nothing was compared" is worth sharing; one
predicate across two different subjects would be the same conflation this section is about.

It deliberately does **not** consult discovery. An earlier version skipped whenever discovery
returned zero projects, which is the *result of the operation under test*, not a property of
the machine: `MC_PROJECT_ROOTS=/nonexistent bun test test/live.test.ts` reported **3 pass, 1
expect() call** — every real assertion skipped, the gate's own pin still green.

Extracting the gate did not by itself finish the job, twice over.

For one round `views.test.tsx` kept an inline copy carrying that same defect, so the command
above turned `live.test.ts` red and left `views.test.tsx` at **17 pass / 0 fail** — while this
section, and two code comments, said the consolidation was complete.

Then, with one implementation of the *predicate*, there were still two of the **value it
consumes**: the gate recomputed `~/.claude/projects` while everything under test resolves the
corpus through `scripts/lib/usage.js`'s `projectsDir()`, which honours
`AGENTVIBE_PROJECTS_DIR`. Point that at an empty directory and the gate inspected the real
corpus, opened, and the real-fleet parity test compared nineteen rows of zeros to nineteen
rows of zeros: **25 pass / 0 fail**, no NOT VERIFIED printed. The path is now imported rather
than recomputed; "is there a corpus" means *contains a transcript* — the same condition
`check-cold-start.ts` already exits 2 on — rather than *the directory exists*; `live.test.ts`
pins that the gate's path and `projectsDir()` are the same string; and the real-fleet test
additionally asserts it compared something non-zero, so a vacuous comparison cannot report
success even if the gate is fooled again.

The lesson worth carrying: the header's own advice — grep `test/` for `existsSync` — could not
have caught the second one. The divergence was not in the predicate. It was one level down, in
a value the predicate read.

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
  - id: c-mission-control-trusted-roots
    assert: "Mission Control runs no program for a project absent from the trusted-projects list, and the three RCEs of 2026-08-14 execute through the real routes when it is present — so the barrier is measured against a live exploit rather than an inert fixture"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "cd mission-control && bun test test/trust.test.ts", expect_exit: 0}
    valid_until: 2027-02-15
    confidence: 0.9
  - id: c-mission-control-cross-site-refused
    assert: "Every route Mission Control serves answers 403 to Sec-Fetch-Site: cross-site, and performs no work for such a request — this blocks cross-site BROWSER requests only, since same-site is allowed and a non-browser client sends no such header"
    kind: behavior
    scope: project
    verified_by: command
    evidence: {cmd: "cd mission-control && bun test test/trust.test.ts -t 'guard is registered above every route'", expect_exit: 0}
    valid_until: 2027-02-15
    confidence: 0.9
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
