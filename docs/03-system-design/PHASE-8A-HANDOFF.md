# Handoff — Phase 8a, complete

**For:** whoever picks this up next.
**State: all 5 PRs merged. `main` = `30f6c35`.** 193 tests / 1,213 assertions, `npm run check` exits 0 after
`bun install` in `mission-control/`. All six views work end to end.
**Read [SECURITY-FINDINGS-2026-08-14.md](SECURITY-FINDINGS-2026-08-14.md) before running the server** —
three confirmed RCEs are open on `main`, and until they are closed, do not point Mission Control at a tree
containing repositories you did not write.
**Read first:** [PHASE-8A-STATUS.md](PHASE-8A-STATUS.md) · [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) · [CLAIM-LEDGER.md](CLAIM-LEDGER.md)

---

## 0 · One defect class shipped nine times. Read this section before writing code.

Every review round across three PRs found the same thing wearing different clothes: **a mechanism reporting
success about something it did not measure.**

| # | Where | What it claimed | What was true |
|---|---|---|---|
| 1 | `probe-readonly-engine.sh` | *"The restriction binds at runtime"* | Inferred from a file's absence. The engine had `Bash`, was capable, and **declined** |
| 2 | Its round-1 fix | An attempt record proved refusal | The record was written by the same actor the probe tests |
| 3 | `c-lenses-and-playbooks-are-loaded` | Lenses load *"mechanically"*, `confidence: 1` | Resolver tested the hook's **stdout**; the session got ~2 KB and a file path |
| 4 | `qa-lead-pass.yml` | Gates merges on QA | Gates on the session file **saying** PASS — which the author writes |
| 5 | `probe-readonly.test.mjs:4` | *"Run by `ci.yml`"* | CI never ran it. Written the same day, in the series removing false claims |
| 6 | MC write-guard v1 | `server/**` performs no disk mutation | Grepped `writeFile\|mkdir\|rm` — **missed a live command-injection RCE** |
| 7 | MC write-guard v2 | *"no shell is invoked... ever"* | Missed `exec()`, which always spawns a shell |
| 8 | Fleet headline | *"every in-scope launcher on the modal generation"* | Rendered when **nothing was compared** |
| 9 | The machine gate | *"verified against the real fleet"* | Hardcoded a corpus path the code under test resolved differently |

**Single-point fixes did not work.** Each was correct about the hole it was shown and left one a level down —
the gate alone took four attempts: skip-on-the-result-under-test, then a second unpinned copy, then a pin that
validated its own excuse, then one predicate with two implementations of the value it read.

**What finally worked was a second, independent barrier.** The real-fleet parity test now asserts it compared
something non-zero, *separately from the gate*. A reviewer proved it by forcing `machineGate()` to `if (false)`
and running against an empty corpus — it still failed.

**So: when you add a guard, add the barrier that catches the guard being wrong.** Two cheap independent checks
beat one careful one. This is the single most transferable thing this phase produced.

**PR4 and PR5 added sixteen more instances, and the count is no longer the point.** What the last two PRs
established is *which* shapes recur and what actually catches them. Read this before writing a test:

- **The dominant shape is: a rendered fact is pinned while the thing computing it runs free.** It appeared
  three separate times — the async sweep, the 10 s bound, the freshness stamp — and each time the consumer
  had five or more assertions on it while inverting one line in the producer left the whole suite green.
  Once, that inversion restored a defect we had already fixed and reviewed, verbatim. **The fix never needed
  a DOM or new tooling: extract the decision into a pure function and assert producer and consumer in one
  place.** The builder's own tell, which is cheaper than any review: *"I wrote the producer and the consumer
  in the same PR, and only one of them appeared in a test file."*
- **Coverage is the cheapest instrument that exists, and it disagrees with careful prose.** A residue
  described in good faith as "one line of JSX" measured **91 lines** — the entire component. A 99.08% figure
  counted three unexecuted callback bodies as covered, because line coverage marks the **hook call**, not the
  body. Run it on the branch you are most confident about, not the one you doubt.
- **Three defects were in guards rather than in code.** A guard that imported its threshold from the module
  it guards (raising the cap 2→64 kept the suite green while 20 processes ran). A sampler that never
  overlapped its subject, because the thing it measured needed the same JS thread it was sleeping on. And a
  non-vacuity guard aimed at the premise that did not need it, leaving the one that did reduce to `2 === 2`.
- **Never gate a test on the environment unless it genuinely needs the environment.** Two tests correctly
  print `NOT VERIFIED — nothing was compared` because they need a real fleet and a real corpus. A third
  consulted the machine while only rendering markup — that one was never testing what it claimed on *either*
  machine, and passing locally was the accident. **If a test renders components and reads markup, every input
  it uses must be one it names.**
- **A threshold anyone can tune is a threshold that gets tuned until it is quiet.** Prefer a comparison
  against a control measured in the same run on the same machine — and note that a **ratio against the run's
  own total cannot catch work that inflates its own denominator**. Where a ratio is the wrong instrument,
  read the quantity as a *gate* rather than a *divisor*; only the gate fails safe.
- **Run the mutation on the test you just wrote — especially when you are confident.** This is the
  mechanical form of everything above, and it is not a matter of instinct. Twice in this phase a builder
  found a vacuous barrier in its own brand-new test, and both times it was because the brief demanded a
  mutation *per barrier* and one came back `0 fail` — not because anyone suspected it. Confidence is
  precisely the state in which an unfiring check survives review, since nobody re-reads what they just
  reasoned carefully about. The rule is cheap and it does not depend on being clever that day.
- **A comment arguing why code is correct is a claim with no mechanism.** One PR argued at length — in the
  source and in its report — that `!(a < b)` was chosen over `>=` *because they differ on NaN*, then pinned
  it with nothing: flipping the operator left the suite green. **The argument was standing in for the
  evidence.** If a comment explains why a choice matters, the test that makes it matter belongs beside it,
  or the next refactor discards both silently.
- **The signal for "this is partial" is the rejection, never the buffer.** A truncated read that happens to
  end on a record boundary is byte-identical to a complete one. Inspecting output to decide whether an
  operation succeeded is the same error as every entry in the table above; the operation already told you.

Corollaries, each earned:
- **A guard's name gets written aspirationally and its body literally.** Name it from the body.
- **A claim's numerator and denominator must be drawn from the same population.** The drift headline counted
  drifted *projects* over in-scope *launchers* and rendered "2 of 11" when the answer was 4.
- **Never report absence when you mean "I could not look."** `grep` exits 2 on permission error *and still
  writes matches to stdout*; the catch read only `status`. `check-cold-start.ts` gets this right — exit 2 is
  UNCHECKED, never a vacuous pass.
- **An assertion inside a branch that never runs reads as coverage.** Add a counter that fails at zero.

---

## 1 · What exists

`mission-control/` — Bun + Hono + React 19 + Vite + Tailwind, **loopback only** (`HOST` is a literal; there is
no override that could reach `0.0.0.0`), server 4300 / client dev 4301. `war-room/dashboard/` and
`war-room-dashboard/` are untouched and unrelated — greenfield was the decision.

| Layer | |
|---|---|
| `server/projects.ts` | Discovery. Every git repo under `MC_PROJECT_ROOTS` (default `~/VibeCoding`); those with a live `.worktrees/.registry` flagged agent-active. **Computed, never configured** |
| `server/state.ts` | `LiveState` — one discovery + index pair shared by the routes and the SSE tick |
| `server/index-store.ts` | In-memory session index. Cold build, then mtime-skip refresh. **Writes nothing** |
| `server/lib/usage.ts` | Façade over `scripts/lib/usage.js`. Deliberately does **not** re-export `recentTurns()` — it calls `saveCache`, and that cache belongs to the budget guard |
| `server/collectors/*.ts` | transcripts · fleet · worktrees · conflicts · belief · events · empty |
| `server/routes/api.ts` | `GET /api/{fleet,sessions,belief,conflicts,project/:id,inbox}` |
| `server/routes/stream.ts` | `GET /events`, SSE. Pushes only slices whose content hash moved |
| `client/src/views/` | `FleetView` and `SessionsView` |

**Working end to end:** Fleet and Sessions. **Collectors and routes but no view:** Belief, Conflicts, Project,
Inbox — that is PR4 and PR5.

---

## 2 · The rules this codebase holds, and why

- **`server/**` writes nothing and invokes no shell.** Pinned by a guard test — which is a regex over source
  text and **says so in its own name**, listing what it cannot catch. A command-injection RCE shipped through
  its predecessor: a project directory named `evilproj;touch PWNED;echo done` executed arbitrary shell on
  `GET /api/project/:id`. Use `execFileSync(binary, [args])` with an args array, a `--` sentinel before any
  path positional, **and no shell**. Never build a command string.
- **Never recompute a figure the repo already computes.** Import from `server/lib/usage.ts`; shell out to
  `warroom-install.mjs` and `ledger.mjs`. Cross-check tests assert equality against those commands run
  independently, and a mutation gate proves the cross-check can fail.
- **A test must never assert what it could not check.** `test/gate.ts` is the one predicate; it reads the
  corpus path from `server/lib/usage.ts` (not a recomputed copy) and requires a *transcript*, not a directory.
  `notVerified()` prints `... NOT VERIFIED — <reason>. Nothing was compared; this is not a pass on the merits.`
  **Gate on the environment, never on an assertion failing.**
- **No placeholder UI.** An absent value states why and names what would fill it. Three absences are
  deliberate: no dollar cost (nothing computes a price; hardcoding rates plants data that goes stale), no
  per-project 5h burn, and Model shows the latest turn only.
- **Explanations must be reachable without a mouse** — but only where the element's whole purpose is
  explaining an absence. 17 tab stops, not 924.

---

## 3 · Measurements — VERIFIED, do not re-derive

| | |
|---|---|
| Transcript corpus | **2,029 files, 2.83 GB** — count it **recursively**; a two-level scan gave 72 files and was wrong by 28× |
| Raw cold parse | **9,252 ms** · MC's own cold build **3.7–4.1 s** against a **10 s** budget |
| Incremental | **16 ms** · stat-all 4 ms |
| Fleet | 19 projects discovered, 10 non-`agentvibe` with data, 14 launchers, 8 generations, 5 in scope |
| Fleet slice cost | **430 ms** vs 16 ms for sessions — which is why it polls at 10 s, not 1 s |

**There is no database.** Cold start is paid once per launch and incremental is 16 ms, so the lived cost is
the 16 ms. **The corpus only grows** — the budget is bound to `c-mission-control-cold-start` with an expiry, so
when it crosses 10 s the ledger fails and forces a disposition instead of the budget quietly becoming fiction.

---

## 4 · Traps

- **`npm run check` is not what CI runs.** CI executes individual `check:*`/`test:*` steps and has **no
  aggregate step**. Folding something into the chain puts it in the local chain only.
- **Every worktree needs `bun install` in `mission-control/`** before `npm run check` passes.
- **`ledger:build` before `build:map`** — the map reads the ledger index.
- **Editing `mission-control/README.md` moves the claim block's line numbers**, so `ledger build --check`
  fails until you rebuild the index.
- **Bun's default `idleTimeout` is 10 s and reaps idle SSE connections** — the failure hides behind
  `EventSource` reconnecting forever. `/events` opts out **per request**; do not set it server-wide.
- **Hono dispatches `HEAD` to the `GET` handler**, so a `route.on('HEAD', …)` guard does nothing.
- **CSS truncation never removes text from the accessibility tree** — a missing `title` on a truncated cell is
  a pointer-user gap, not a screen-reader one.

---

## 5 · Open

**Next in the phase:** PR4 (Belief + Conflicts) and PR5 (Project + Inbox honest empty states). Both depend
only on the scaffold PR3 landed, touch disjoint files, and can run in parallel.

**Logged, deliberately not fixed:**

| # | |
|---|---|
| **24** | `qa-lead-pass.yml` gates on a verdict the author writes. Demonstrated live: green on code with two CRITICALs, red when the verdict was honest. Three enforceable pieces — bind the verdict to a commit SHA, require the verdict commit to touch no source, reuse the ≥2-model-family predicate for irreversible tier. **It cannot prove a review happened**; say so in the workflow header |
| **26** | The shell-invocation guard is a regex over source text and gameable by construction. An AST walk is the durable fix. Not built: zero shipped code uses a bypass shape |
| **27** | That guard false-positives on prose merely *mentioning* `exec(` across a line wrap |
| **29** | A launcher with no discovered project is counted in the drift denominator but appears in **no row**. Matters at Phase 9 — an invisible drifted launcher is one you will not update |
| **30, 31** | A five-way tie's aria-label enumerates every generation; the row *above* the Fleet divider alternates with the active count's parity |

**Four claims land 2026-09-08** — `c-shadow-window-open` (the promotion decision), `c-read-only-binding-unverified`,
`c-runtime-nested-spawn`, `c-rolling-five-hour-window`. **One waiver's reason is already stale:**
`c-runtime-nested-spawn` is waived because *"subagent spawning is disabled by founder instruction"* — that was
lifted on 2026-08-13 and a dozen subagents have run since. Resolvable now by probing; do not wait for the date.

**Not one review in this phase was independent.** All were single model family. The `adversarial` and
`security` lenses are marked `independent: true` and require ≥2 families. Every session file says so.

**Stop condition 6 is still live.** Three PRs of control plane exist and **nobody has opened it against real
work.** The strongest remaining test of Phase 8a is not another PR — it is using it.

---

## 6 · How to work

```bash
git checkout -b feat/<slug> origin/main
cd mission-control && bun install --frozen-lockfile && cd ..
npm run check          # must exit 0 before you push — includes tsc --noEmit and 108 bun tests
npm run ledger:sweep   # expiry, lapsed waivers, dead resolvers
npm run warroom:fleet  # read-only; stop condition 5b wants this monthly
gh pr create --base main
# label risk:irreversible for .claude/**, .github/workflows/**, scripts/lib/** or migrations
# session file: docs/08-agents_work/sessions/YYYY-MM-DD-<role>-<branch-slug>.md, ≤10 lines,
#   frontmatter qa_verdict: PASS — the gate BLOCKS, and main is protected
```

Mark every figure **VERIFIED** or **ESTIMATED**. A builder does not self-grant PASS.

---

*Handoff written by: ceo · 2026-08-13 · `main` = `0a23471`*
