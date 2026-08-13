# Phase 8a — Mission Control, read plane

**Living status.** Updated at each PR. Phase 8b (Dispatch) is deferred — see §1.
**State:** **PR3 of 5 merged.** `main` = `0a23471`. `npm run check` exit 0 after `bun install` in `mission-control/`.
Handoff for whoever continues: [PHASE-8A-HANDOFF.md](PHASE-8A-HANDOFF.md).

---

## 0 · Progress

| PR | Contents | Tier | State |
|---|---|---|---|
| **1** | The rail — Bun/Hono, `check:mc`, CI `setup-bun` | irreversible | ✅ **merged** ([#21](https://github.com/Adam077K/agentvibe/pull/21)) |
| **2** | Collectors, project discovery, cross-check tests | lite | ✅ **merged** ([#26](https://github.com/Adam077K/agentvibe/pull/26)) — 4 review rounds, 1 CRITICAL (command-injection RCE) |
| **3** | The client, SSE, Fleet + Sessions views | lite | ✅ **merged** ([#27](https://github.com/Adam077K/agentvibe/pull/27)) — 5 review rounds, 3 CRITICAL |
| 4 | Belief + Conflicts views | lite | not started |
| 5 | Project + Inbox honest empty states | lite | not started |

**Where it is: 108 tests / 558 assertions, `tsc --noEmit` clean and inside the gate, cold index 3.7–4.1 s
against a 10 s budget, incremental 16 ms, 19 projects and ~2,000 sessions rendered.** Fleet and Sessions
work end to end. Belief, Conflicts, Project and Inbox have collectors and routes but no view.

Merged alongside, out of Phase 8a's own scope but found by it:
[#20](https://github.com/Adam077K/agentvibe/pull/20) the read-only probe · [#22](https://github.com/Adam077K/agentvibe/pull/22) two claim corrections ·
[#23](https://github.com/Adam077K/agentvibe/pull/23) the Bun lock-in in `LONG-TERM.md` · [#24](https://github.com/Adam077K/agentvibe/pull/24) this status doc and the Phase 8 gate amendment ·
[#25](https://github.com/Adam077K/agentvibe/pull/25) the corpus measured 28× too small.

---

## 1 · Why the phase is split, and why 8b waits

Phase 8's gate in [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) §4 reads: *"Dispatch a goal into a
second project with no terminal attached; session appears in history with real cost; **claims land in that
repo's ledger**."*

That last clause is **unreachable as written.** Measured 2026-08-12: **no sibling project has a ledger** —
zero `scripts/ledger.mjs`, zero `CLAIM-LEDGER.md` across all 13, every one still on the pre-collapse 26–32
agent roster. Making it reachable means installing the spine in another project first, which is propagation,
which is Phase 9, which the 2026-08-11 founder decision forbids before Phase 9. **Phase 8's gate depends on
Phase 9.**

Six of the seven views only ever read, and reads need no spine in the target. **Dispatch is the only view
that writes**, and it is the only one the conflict touches. So the phase splits at that seam:

- **8a** — Fleet · Sessions · Belief · Conflicts · Project · Inbox. Read-only. Builds now.
- **8b** — Dispatch. Specced, deferred until Phase 9 gives it targets that run the current harness.

The deeper reason, worth keeping: dispatching into those projects today would steer the *old* system.
Mission Control would be a control plane over 13 copies of what seven phases replaced.

**Phase 9 did not move up.** The monthly fleet baseline (stop condition 5b, unrun since Phase 2) was re-run
2026-08-12: **8 generations total, 5 in scope — unchanged.** The 15→14 launcher drop is `agentvibe` itself
leaving the standalone set when Phase 2 converted it. The debt is not growing.

---

## 2 · Decisions binding this phase

Eight, made 2026-08-12. Five went against the recommendation, which is recorded in
[LONG-TERM.md](../../.claude/memory/LONG-TERM.md) as a pattern rather than a complaint.

| Decision | Chosen | Cost accepted |
|---|---|---|
| Path | **Phase 8**, over one real venture task | Stop condition 6 stays live — nothing built has met a task it did not author |
| Scope | **8a now, 8b gated** | Gate amended, with the measurement that forced it |
| Codebase | **Greenfield** | The existing 2,575-line dashboard's tmux parsing, cost-from-jsonl and conflict detection are not reused |
| Runtime | **Bun + Hono + React + Vite** | **First dependency this repo has ever had** |
| Verification | **Folded into `npm run check`** | `.github/workflows/ci.yml` still needed a step — see §5 |
| Views | **All six**, two with empty states | In tension with rule 6; resolved by making the empty states state their own reason |
| Gate | **Cross-checked truth + speed budget** | — |
| Execution | **Delegated** — CTO packet, then workers | — |

---

## 3 · The gate — what makes 8a done

1. **Every figure shown is reproducible by an independent command.** Session cost ↔ `scripts/lib/usage.js`;
   launcher generation ↔ `npm run warroom:fleet`; claim counts ↔ `node scripts/ledger.mjs verify`. Mission
   Control never recomputes a figure the repo already computes — it imports or shells out.
2. **Mutating a fixture turns a test red.** A cross-check that cannot fail is not a cross-check.
3. **Live data from ≥3 projects other than `agentvibe`.**
4. **Cold start < 10 s, incremental refresh < 250 ms.** ~~< 3 s~~ — raised 2026-08-13 by founder decision
   after the corpus was recounted (§4). Measured: **3.6–4.1 s** cold, **4 ms** incremental. The 3 s figure
   was set against a corpus 28× smaller than the real one, so it was never a budget anything had been
   measured against. Bound to `c-mission-control-cold-start` with an expiry, so growth forces a decision.
5. **`npm run check` exit 0** from a clean clone after `bun install`.

---

## 4 · Measurements the build rests on

> **CORRECTED 2026-08-13. The first version of this table was wrong by 28×, and the "no database"
> decision below was made on it.** The original scan walked `~/.claude/projects/` only two levels deep and
> reported **72 files / 0.44 GB / 1,283 ms**. Transcripts nest deeper than that. A recursive count gives
> **2,029 files / 2.83 GB**, and a raw full parse **9,252 ms** — the same ~9 s Phase 6 hit on the same
> corpus before it adopted mtime-skip. The wrong figures reached this file, two PR bodies, `README.md` and
> the brief the builder worked from. Caught by the builder measuring the real corpus instead of trusting
> the number it was handed.

All VERIFIED 2026-08-13 by execution, not estimated.

| | |
|---|---|
| Transcript corpus | **2,029 files, 2.83 GB** — counted recursively |
| Raw cold full parse | **9,252 ms** — 257,834 lines, 90,805,765 output tokens, **0 unparseable** |
| Mission Control cold build | **3,633 / 3,870 / 4,060 ms** over three runs, 19 projects, 54 transcript dirs |
| Stat-all / incremental | **4 ms** / **4 ms** (14 files touched in 5h) |
| Live worktree registries | **8 projects** — etsyc 7, agentvibe 4, Beamix 4, evalove 4, finfun 4, noam-website 4, adamos 3, ghostb 3 |
| Fleet | 14 launchers, 8 generations, 11 in scope, 5 generations in scope |

**There is still no database, but the reason is narrower than it was.** The original reason — "history is
derived in ~1.3 s" — was false. The real reason is that **cold start is paid once per daemon launch and the
incremental refresh is 4 ms**, so the lived cost is the 4 ms, not the 4 s. A store would add a schema to
migrate and a second source of truth to disagree with the transcripts, and would repeat the
`initDb()`-with-zero-`INSERT`s shape sitting unused in `war-room/dashboard/`.

**This is an accepted cost, not a solved problem.** Founder decision 2026-08-13, taken with the alternatives
on the table (lazy per-project loading, Mission Control keeping its own cache as `scripts/lib/usage.js`
already does, parallelising the cold read). **The corpus only grows** — 2,029 files today. So the budget is
bound to `c-mission-control-cold-start` with an expiry rather than left as a comment: when the build crosses
10 s the ledger fails and forces a Refresh, Deprecate or Waive, instead of the budget quietly becoming
fiction.

---

## 5 · Traps found while building, that the next PR must respect

- **`npm run check` is not what CI runs.** CI executes nine individual `check:*`/`test:*` steps and has
  **no aggregate step**. Folding something into the `check` chain puts it in the local chain only; CI needs
  its own step, which is a `.github/workflows/**` change and therefore irreversible tier.
- **`recentTurns()` writes a cache the budget guard owns.** Use the pure functions — `listTranscripts`,
  `turnsFrom`, `windowUsage`. A test asserts that cache is byte- and mtime-identical after an index build.
- **The event log cannot distinguish a synthetic run from a real one.** All 45 `budget.block` events carry
  ceilings of 1 or 100 against real ceilings of 3,000,000 / 400,000 — forced proof-runs. A naive "blocks
  today" tile would report 45. Parse the ceiling out of the reason string and label the bucket; do not guess
  intent.
- **`ledger:build` must run before `build:map`** — the map reads the ledger index. The other order leaves
  `CODEBASE-MAP.md` stale against the new claim count.
- **Every worktree now needs `bun install`** before `npm run check` passes. The ledger caught this on its
  first day: `c-mission-control-rail` failed correctly in a fresh worktree.
- **Do not hardcode the project list.** A hand-typed list omitted `finfun`; the corrected count came from
  `find`. Compute it.

---

## 6 · Five checkers found reporting success about the unobserved

The session that started Phase 8a found these. Three were pre-existing and mine.

| Mechanism | What it claimed | What was true |
|---|---|---|
| `probe-readonly-engine.sh` | *"The restriction binds at runtime"* | Concluded it from file absence. The engine had `Bash`, was fully capable, and simply **declined**. ✅ fixed — it can no longer emit success under any input |
| Its round-1 fix | An attempt record proved refusal | The record was written by the same actor the probe tests. Relocated the forgeable signal. ✅ fixed |
| `c-lenses-and-playbooks-are-loaded` | Lenses load *"mechanically rather than discretionary"*, `confidence: 1` | Resolver tested **the hook's stdout**. 25,613 bytes emitted, ~2 KB inlined, the rest handed over as a file path. ✅ corrected; now fails visibly until the router fix |
| `qa-lead-pass.yml` | Gates merges on QA | Gates on the session file **saying** `PASS` — which the author writes. Demonstrated live on one PR: green with two CRITICAL findings against it, red when the verdict was honest. ⏳ **open, #24** |
| `probe-readonly.test.mjs:4` | *"Run by `.github/workflows/ci.yml`"* | CI never ran it. Written **the same day**, inside the commit series removing false enforcement claims. ✅ corrected pre-merge |

**None was caught by a mechanism.** Every one came from running the thing and looking, mostly by a reviewer
asked to attack the work. Where enforcement is mechanical it works — `curate-skills.mjs` fired six times the
moment it was written, the ledger caught a missing `node_modules` on day one. Where a check reports on
something it cannot see, it is decorative.

**A counter-measurement, so this is not read as a pattern of rot:** 22 files on `main` carry a `POSTURE:`
header claiming BLOCKS, and **zero claim it falsely**. A checker for that was proposed and withdrawn — a
mechanism with no subject is as dead as a rule with no mechanism.

---

## 7 · Open

- **#24 — the QA gate.** Proposed, not started. Three enforceable pieces: bind the verdict to a commit SHA
  (kills stale and premature verdicts, the one failure a machine could have caught today); require the
  verdict commit to touch no source; reuse the existing ≥2-model-family predicate from
  `scripts/lib/claims.js` for irreversible tier. **It cannot prove a review happened** — any artifact a
  reviewer writes, a builder can write. It raises the cost of a false PASS; say so in the workflow header
  rather than letting the next reader assume more.
- **Every review in this phase has been single-model.** Rule 3 above would have failed both CEO-authored PRs,
  correctly.
- **`c-runtime-nested-spawn` rests on a stale reason.** Waived because *"subagent spawning is disabled by
  founder instruction"* — that instruction was lifted 2026-08-12 and seven subagents ran. Cheaply resolvable
  now by probing; do not wait for 2026-09-08.
- **Four claims still land on 2026-09-08**: `c-shadow-window-open` (expiry — the promotion decision),
  `c-read-only-binding-unverified`, `c-runtime-nested-spawn`, `c-rolling-five-hour-window`.
- **The SessionStart payload still needs a router**, not a dump — lens ids plus one-line summaries under the
  inline threshold. Until then `c-lenses-and-playbooks-are-loaded` fails, by design.
