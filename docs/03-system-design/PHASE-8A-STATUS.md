# Phase 8a — Mission Control, read plane

**Living status.** Updated at each PR. Phase 8b (Dispatch) is deferred — see §1.
**State: PHASE 8a COMPLETE — all 5 PRs merged** at `main` = `30f6c35`; six follow-on PRs have landed since,
so seven have landed since ([#29](https://github.com/Adam077K/agentvibe/pull/29) budget-guard,
[#34](https://github.com/Adam077K/agentvibe/pull/34) stall gate,
[#36](https://github.com/Adam077K/agentvibe/pull/36) gate extraction,
[#31](https://github.com/Adam077K/agentvibe/pull/31) the RCE record,
[#33](https://github.com/Adam077K/agentvibe/pull/33) this doc + the handoff,
[#35](https://github.com/Adam077K/agentvibe/pull/35) the truncated-status fix,
[#37](https://github.com/Adam077K/agentvibe/pull/37) the untracked clamp). ~~**`main` = `0bd7625`**~~ → **`main` = `08e7981`**
(2026-08-16; `0bd7625` was 13 commits behind when this line was last read). `npm run check` exit 0 after
`bun install` in `mission-control/` — **without that install the ledger reports 8 would_block instead of 5 and
three mission-control claims fail for missing dependencies, not for defects.**
**Phase 8a is closed.** See [PHASE-8A-CLOSE.md](PHASE-8A-CLOSE.md).
Handoff for whoever continues: [PHASE-8A-HANDOFF.md](PHASE-8A-HANDOFF.md).

---

## 0 · Progress

| PR | Contents | Tier | State |
|---|---|---|---|
| **1** | The rail — Bun/Hono, `check:mc`, CI `setup-bun` | irreversible | ✅ **merged** ([#21](https://github.com/Adam077K/agentvibe/pull/21)) |
| **2** | Collectors, project discovery, cross-check tests | lite | ✅ **merged** ([#26](https://github.com/Adam077K/agentvibe/pull/26)) — 4 review rounds, 1 CRITICAL (command-injection RCE) |
| **3** | The client, SSE, Fleet + Sessions views | lite | ✅ **merged** ([#27](https://github.com/Adam077K/agentvibe/pull/27)) — 5 review rounds, 3 CRITICAL |
| **4** | The view registry, Belief over both ledgers, Conflicts async + three-state + scoped | **full** | ✅ **merged** ([#30](https://github.com/Adam077K/agentvibe/pull/30)) — 4 fix rounds, all 3 lenses FAIL on the first pass |
| **5** | Project + Inbox, `projectEmptyState` async **and bounded**, the #39/#40 debt | **full** | ✅ **merged** ([#32](https://github.com/Adam077K/agentvibe/pull/32)) — 6 fix rounds, correctness FAILed twice before clearing |

**Where it is: 222 tests / 0 fail across 8 files** (VERIFIED on `main` = `28626d8`, `bun test`, exit 0, and
independently reproduced — 193 at phase close on `30f6c35`, 205 at `01fcadd`; #34, #36 and #35 added the
difference). **The test and file counts are stable. Nothing else here is.** Wall time has read **77.2 s,
166.63 s and 177.88 s on quiet machines** — so this doc's earlier story, that 168 s proved contamination and
77.2 s was the truth, was **the outlier promoted because it arrived after the fix and confirmed the
narrative**. **The assertion count is not stable either, and quoting one is a mistake this doc made twice.** Two *identical* clean runs of
`collectors.test.ts` alone returned **386 and 360** `expect()` calls — the live fleet tests loop over real
projects, so the number moves with what is on disk. This doc has quoted 1,213, then 1,246, then 1,312 as
though the differences measured something. **They do not.** Use pass/fail counts; treat any `expect()` total
here as one sample of a moving quantity, `tsc --noEmit`
clean and inside the gate, cold index 3.7–4.1 s against a 10 s budget, incremental 16 ms, 19 projects and
~2,000 sessions rendered. **All six views work end to end.**

Two figures the phase corrected about itself, both first reported by the CEO and both caught by a worker:
`/api/belief` is **10,385 ms**, not the 25 ms briefed; the project probe on Beamix is **107,806 ms**, not
3,657 ms. Both wrong for the same reason — a command timed without checking it ran to completion — and the
second changed a design: async alone cannot bound an unbounded recursive scan, so the probe stops at 10 s
and says so (`GET /api/project/Beamix`, **113,158 ms → 28 ms**).

Merged alongside, out of Phase 8a's own scope but found by it:
[#20](https://github.com/Adam077K/agentvibe/pull/20) the read-only probe · [#22](https://github.com/Adam077K/agentvibe/pull/22) two claim corrections ·
[#23](https://github.com/Adam077K/agentvibe/pull/23) the Bun lock-in in `LONG-TERM.md` · [#24](https://github.com/Adam077K/agentvibe/pull/24) this status doc and the Phase 8 gate amendment ·
[#25](https://github.com/Adam077K/agentvibe/pull/25) the corpus measured 28× too small ·
[#28](https://github.com/Adam077K/agentvibe/pull/28) the post-PR3 handoff ·
[#29](https://github.com/Adam077K/agentvibe/pull/29) **the budget ceiling removed from the system**, by Founder instruction ·
[#31](https://github.com/Adam077K/agentvibe/pull/31) the three confirmed RCEs, recorded before the evidence expired.

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
- ~~**`c-runtime-nested-spawn` rests on a stale reason.**~~ **RESOLVED 2026-08-13 by measurement, not by
  date.** Two independent probes, one spawn attempt each: `Agent` is un-deferred in a depth-1 subagent's own
  tool list, the spawn succeeded with no block or error, and the depth-2 child ran and returned `ACK`.
  Disposition **Refresh** — the claim asserts nesting *works* and is correct. **What is false is the CEO's
  own operating instructions**, which state *"subagents cannot spawn subagents (nested Task is blocked)"* —
  and that line is the stated reason chiefs return dispatch packets instead of spawning workers, so **the T2
  orchestration tier rests on a false premise.** Flagged for the Founder, not changed.
- **Three claims still land on 2026-09-08**: `c-shadow-window-open` (expiry — the promotion decision),
  `c-read-only-binding-unverified`, `c-rolling-five-hour-window`.

### Found on `main` by the Phase 8a reviews, needing work

| # | |
|---|---|
| **#36** | **Three confirmed RCEs**, each executed: git `core.fsmonitor` via the conflicts sweep — *and that request renders the worktree as clean*; `node <discovered-project>/scripts/ledger.mjs` via `/api/belief`, with `?project=` choosing whose code runs; a claim's `evidence.cmd` reaching `/bin/sh -c`. Plus no Origin check on side-effecting GETs, which makes all three drive-by. **Recorded in [SECURITY-FINDINGS-2026-08-14.md](SECURITY-FINDINGS-2026-08-14.md); awaiting a Founder design decision.** **An Origin check is NOT the fix, and calling it "no-regret" was a CEO error caught before it shipped.** Measured in a real browser (Playwright, two servers, one page): `Origin` is **absent** on `<img>`, `<script>`, `<link rel=stylesheet>`, form GET and no-cors `fetch` — **only CORS `fetch` sends it.** A check must therefore treat absent as allowed, since the app's own same-origin GETs also send none, and every drive-by subresource vector then passes. That is **a guard satisfied while the property it protects is violated** — §0's defect class, proposed by the CEO while quoting §0. **`Sec-Fetch-Site` is the instrument that works, and this is CONFIRMED, not reasoned:** it is sent on *every* one of those requests and reads `cross-site` from a different site, `same-site` from the same host on another port, `same-origin` for the app itself. So **reject `cross-site`**; allow `same-origin`, `same-site` and `none` (a typed URL or bookmark). Describe it as *"blocks cross-site browser requests"*, never as *"blocks drive-by"* — **`same-site` is allowed, so anything else on loopback retains all three RCEs**, which no header check can reach. Ship `Origin` alongside it only as defence in depth, never alone. **A suspected fourth vector was investigated and is not one — the count of three is correct.** `fleet.ts:131` runs `execFileSync('node', [script, 'fleet'], {cwd: repoRoot})`, F2's shape at a second call site, but `script` is `path.join(repoRoot, 'scripts', 'warroom-install.mjs')` where `repoRoot` traces to `REPO_ROOT` — **Mission Control's own install directory, computed from `import.meta.url`, not a discovered project** — and neither production entry point — `/api/fleet` **and `routes/stream.ts:86`, a second reachable call site the first write-up omitted** — reads a query parameter, so unlike F2's `?project=` there is nothing for a caller to choose. Enumeration independently confirmed exhaustive: exactly two entry points, both hard-passing `REPO_ROOT`. **CONFIRMED-by-trace, not by execution, and deliberately so:** a payload shows only that the one input chosen fails to reach the sink, while the question is whether *any* request-controlled value can, which only call-site enumeration answers. Recorded, not fixed: `fleetSlice(repoRoot: string = REPO_ROOT)` is a defaulted parameter and `buildFleet` takes a plain `string`, so the seam for a future caller to pass a discovered root exists though nothing uses it — a latent shape no execution could have found | The finding behind them: *"`server/**` invokes no shell" is literally true and operationally void* |
| **#43** | A PR4 pin flakes at **0.5%** margin (0.835 against a 0.750 bound, having passed at 0.746). Its gate watches idle noise while the confound is the **shared spawn floor** both paths pay. Use the floor as a gate, never as a divisor — subtracting it divides two small differences of noisy quantities and flakes harder. **A flaky pin is worse than a missing one: the first thing anyone does to one is loosen it** |
| **#43a** | **The trade #43's fix makes, stated rather than discovered later.** The gate's variance term was removed entirely, because `max − min` over five samples is not a dispersion estimate and was hiding failures on its own: a memoised lister escaped by *both* paths at once — the median reporting **17.0 ms** for a lister blocking 130 ms+ per cold path, while `spread(asyncStalls) = 174.0` inflated the resolution term to 211.9 ms so the gate fired anyway. **What replaced it is blind to variance that appears only in the async rounds.** Measured counter-example: async spread **153.0 ms** against a floor spread of 2.4 ms and a control spread of 8.1 ms — neither environment term noticed. The feared cost was a higher false-RED rate on a loaded runner. **Measured over 50 executions and largely refuted: contention *improves* the margin** — ratio max **0.151 loaded** (12-way CPU contention, load avg 22 on 10 cores) against **0.229 unloaded**, because the control is twelve sequential blocking spawns that absorb load linearly while the async worst is one burst of asks. `max` costs 30.5% of the budget worst-case against `median`'s 9.2%; a false-RED needs one round above 94.3 ms, which is 2.98× the worst of 100 observed rounds. **What is real instead: the withhold branch is unexercised.** The gate implicitly assumes `amax < 2 × fmax` for correct code, and 3 of 20 clean runs exceeded that factor (median 1.28, p90 2.33, max 3.15) — safe only because `lineMs/fmax` sat at 5.4–16.3 so the branch never came near firing. Arithmetic on the CI numbers says it fires when `Fmax > 0.375 × Cmed`, and there floor/control was 0.61–0.84, so **on the runner that produced the flake the new gate probably abstains rather than asserts** |
| **#43b** | **A timing gate cannot be made subject-independent, and this is the measured proof.** #34's redesign removed every syntactic path from the subject to the gate — verified by trace, no gate input reads a `detectConflicts` return value. It is still influenceable **causally**. A stale-while-revalidate lister (async answer returned immediately, synchronous `execFileSync` revalidation on a timer) at 100 ms escaped 3 of 4; **at 220 ms, landing inside the control window, it was invisible 4 of 4** — and the leak *raised* the gate: `median(control)` 129 → 190 ms, so the pass line went 96 → 143 ms. **The code under test widened its own pass bound by ~48%.** Background work the subject starts contaminates any window the test measures, so no reducer, threshold or input choice closes this. **#45 is the only thing that retires it** — module interception has no window to contaminate |
| **#41** | `changedFilesFor`'s partial recovery truncates **mid-line** and puts a fabricated filename (`dir_with_a_re`) into `changedFiles` and the conflict map — a conflict rendered against a file that does not exist. Needs whole-line parsing **and** `readable:false` on rejection: *the signal for "this is partial" is the rejection, never the buffer* |
| **#42 · #44** | The probe semaphore is module-global, coupling every project's tab to the slowest; and deleting `api.ts`'s `!res.ok` throw leaves the suite green and restores #39's symptom |
| **#47** | **Audited — and the audit disproved the cause this entry used to assert.** This entry previously said three tests "failed under ~200% desktop CPU load," which was a **CEO attribution that had never been tested**. It has now been tested and it is wrong. At load average 42 — 12× CPU spin, then 6× CPU plus 6× concurrent git-spawn — **81 of 81 passed**; `views.test.tsx` went 13.5 s → 43.0 s and `stream.test.ts` 14.6 s → 18.0 s, and the three historically-failing tests kept 2.9×–6.2× margin. The observed 572 s and 964 s are **43×–190× beyond anything CPU or fork contention produced**, so CPU contention is out; memory/swap pressure and fork-table exhaustion are the surviving candidates and neither has been tested. **Any fix aimed at CPU load would be aimed at the wrong thing, and nothing here should be called fixed until the real cause is named.** What the audit did establish: **no Category-1 duration assertions exist in either file** — nothing compares a measured duration to a threshold. The exposure is Category 2, an *implicit* timeout acting as an unwritten duration assertion. **F1 (CONFIRMED as a fact, DECLINED as a fix, and its severity was wrong): `views.test.tsx` carries zero explicit timeouts across 71 tests while 25 spawn real git**, and `initGitRepo` is **5** synchronous spawns (a fact-check corrected 6), so one test can fork 10–15 processes inside bun's default 5 s budget. That structure is real. **The severity claimed from it was not, and was disproved by measuring it:** one fixture build is **333 ms median (336/315/333/343/321, 5 reps at load average 55) — 6.7% of the 5000 ms budget**, so a hoist reclaims ~330 ms and moves the margin from ~12× to ~70×, against the ~8.6× stall a test needs before it can time out at all. **A count of expensive-looking operations is not a cost.** The hoist is also *actively unwanted right now*: it would not hide the 964 s case, which blows any budget, but it would mask the **marginal** cases — the only ones still carrying information about the unexplained cause — so it buys 330 ms by degrading the sole instrument aimed at the open question. And a correct hoist is not the cheap one: `views.test.tsx:1431` writes into `projectsRoot`, and all 16 prefixes are used exactly once, so collapsing to one shared fixture would leak that write across tests; it would need per-prefix construction in a hook. **Not done, deliberately.** Revisit only if the 964 s cause is named and turns out to interact with fixture cost. **This entry previously said that failure was "indistinguishable from a broken fixture." That was also wrong, and it was corrected by reading the log instead of describing it.** Bun printed `^ this test timed out after 5000ms` both times, and the git error carried `signal: "SIGTERM", status: null` — git was *killed by the runner tearing down the child*, not failing. The stack ending in `initGitRepo` is the **consequence** of the timeout, and one of the two failures printed no git stack at all. So the diagnosis was available in bytes we already had: a multi-line stack is visually louder than the single trailing line that says what happened, and we read the loud one. F1 remains a real test defect; its severity drops, because it does not disguise itself — it gets misread. **General form: when a runner kills a child, the child's error arrives first and looks like the cause; check for a signal before believing a stack.** Still unexplained and not explained away: **964,435 ms for a test whose baseline is 580 ms** — 1660×, on a test that renders markup with no sleeps and no sockets. Contention does not do that; something suspended the process wholesale. **F2:** the reaper test burns 13.3 s of real sleep under a 40 s ceiling; its failure direction is *safe* (load lengthens the silence it asserts on, strengthening it) and it is irreducible from JS — you cannot intercept the reaper you are testing — so the best available is to make it report its own elapsed time, so a load event stops masquerading as a reap. **F3 — asserted, then DISPROVED by execution; no fix, no branch.** The claim was that a fixture at `now - 95_000` flips "2m ago" → "3m ago" at 150 s wherever a test renders against a fresh `Date.now()`. Tested under a clock that jumps **60 s forward on every single `Date.now()` read** — strictly harsher than any stall, since no two reads can agree at all — and **71/71 passed**. The experiment was itself checked for non-vacuity first: a probe asserting two consecutive reads differ by ≥60 s passes with the preload and fails without it, so a silently-unloaded preload could not have manufactured the result. Why it cannot flip: the three sites asserting a relative string pass **the same captured `now`** to both the expectation and the component, so skew cancels exactly; the nine fresh-`Date.now()` sites assert drift labels, hashes, counts, CSS classes and ordering — **none asserts a time string**; and `:1334`'s `'43d ago'` comes from a `days: 43` prop that never reads the clock. **The general form, and it is about how the claim was reached:** a margin was computed from the formatter's bucket width and reported as an exposure *without first checking whether anything reads the clock twice*. **A bucket boundary is only a risk once the two sides are shown to come from different reads — otherwise it is arithmetic about a comparison that never happens.** Evidence: `/private/tmp/claude-501/audit-47.md`, worktree `.worktrees/audit-47` at `01fcadd`, **no code changed** |
| **#48** | **A fabricated conflict in the untracked-directory case — pre-existing and unconditional, not introduced, and that correction is itself the finding.** `statusConfigEnv` forces `status.showUntrackedFiles=normal`, which **raises** `=no` (the point) and **lowers `=all`** (unstated). `detectConflicts` keys on the exact string with no branch between (`conflicts.ts:546-557`), so two worktrees adding *different* files under one new directory collide on `?? newdir/`. **The first write-up of this entry — and the CEO's brief — called it a defect PR #35 introduced, and proposed a raise-only clamp. Both were wrong, and the three-way table settles it:** `git -c status.showUntrackedFiles=X status --porcelain` over two new files in one new directory gives `no` → *nothing*, `normal` → `?? newdir/`, `all` → `?? newdir/a.ts` + `?? newdir/b.ts`. **`normal` is git's own default**, so the collision already happened for everyone; forcing it merely removed an accidental escape that `all` users happened to have. Raise-only would have restored that escape for a minority, left the defect for the majority, and made the directory-vs-files distinction depend on ambient config — the hermeticity hole closed twice already. **The fix is to force `all`** (PR [#37](https://github.com/Adam077K/agentvibe/pull/37)), which corrects both directions at once and is **one-directional by construction, because `all` is an endpoint of the domain** — the rule this bug produced, applied to its own source. Cost measured at 5,000 untracked files in one directory: `all` = 143,893 B / 5,000 records in 32 ms vs `normal` = 17 B / 1 record in 33 ms — **1.7% of the 8 MiB ceiling, no time cost**, and overflow degrades to `readable: false` rather than the silent miss `no` gave. Found by the delta reviewer *after* both the author and the CEO had run mutation matrices over the same code and both missed it; **the severity was then corrected by the author against the CEO's stated lean.** **Why both missed it, and this is the durable part:** every mutation asked *"what if the setting is absent?"* — the fix's own axis — and none asked *"what if the ambient value sits on the far side of the value I force?"* **The rule, in the sharpest form it reached:** forcing a value that is **not an extreme of its domain** is a clamp in *both* directions; forcing an extreme is not. `core.quotePath` is boolean and was forced to an endpoint, so it could only raise and was safe *structurally*, not by luck; `showUntrackedFiles` is `no\|normal\|all` and `normal` is **interior**. Enumerate the domain before writing any mutation: if the forced value is interior, the downward case is mandatory; if it is an endpoint, skip it **with a stated reason**. Open decision for the fix: raise-only, or keep `normal` and handle the collision in `detectConflicts` |
| **#50** | **RESOLVED — two causes named, one bounded negative, and the fix stops asserting on the clock.** The `/api/sessions` cold call spanned 2,158–12,610 ms against a 10 s budget. **Cause 1, CONFIRMED: corpus growth.** `buildCold` reads every transcript through `readFileSync` with no sampling and no early exit — **3.03 GB / 2,535 files, linear at ~1.5 GB/s**, and the corpus went **1.01 → 3.03 GB in 21 days**, moving the floor ~700 → ~2,050 ms. **Cause 2, CONFIRMED: OS memory reclaim, not load.** 30 builds at constant corpus: pageins<10k median 2,130 ms vs pageins>20k median 3,534 ms with load flat, **r(ms,pageins)=0.915**, verified causally by evicting 8 GB (2,154 → 4,406 ms) against a 0 GB control at ratio 0.87. Load correlates (r=0.715) but **partial r(ms,pageins|load)=0.864 vs r(ms,load|pageins)=0.491**, and load tracks *rep index* at 0.889 — the measurer's own repeated runs warming the machine, **which is what produced the earlier false reading that "the quieter machine was five times slower"**. **BOUNDED NEGATIVE: 12,610 ms was not reproduced** — it needs ~0.24 GB/s, 2.5× worse than anything inducible; eviction plateaus at ~4.4 s exactly as theory predicts for re-reading 3 GB; **zero swapouts across 30+ builds**, leaving swap as the live candidate, catastrophic rather than linear. **Two candidate designs were built and measured, and both failed** — a control-ratio in the repo's own `stallGateVerdict` shape gave an **8.58× ratio spread against a 1.90× raw spread** (directory sizes are skewed, so the small half stays cache-resident), and a fixed 0.5 GB slice rate spanned **2.07× across sessions** while averaging 330 KB/file against the corpus's 1.2 MB. **The constraint both failures prove:** *any assertion tight enough to catch a 2× code regression will also fire on machine state; any assertion loose enough to survive machine state cannot catch a 2× regression* — and the 10 s line sat **inside** the 2.1–12.6 s spread, the worst of both. **The fix asserts deterministic invariants instead of the clock**: every transcript read exactly once, bytes read equal corpus bytes, via a counting seam whose byte figure is genuinely independent (read-side `byteLength` vs `statSync`). Two measurements justify the whole redesign: **truncating every read made the clock go 3722 → 2048 ms with the rate still in band — the stopwatch would have called it a win** — and **duplicating a directory dropped the rate to the warm floor, so reading the corpus twice looked *better* on the clock.** A 5,000 ms/GB ceiling remains as a labelled gross-regression detector that explicitly **does not catch 2×**, plus a **warn at 2,500** deliberately placed *below* the assertion so the unexplained 12,610 ms event (≈4,162 ms/GB) prints its pageins and swapout deltas **and still passes** — turning it red would report machine state as code quality one more time, in the assertion built to stop doing that. Original context: ~10 Category-1 duration assertions across three files — and the first two answers to "how many" were both wrong.** #47's audit reported **none**, accurately for the two files it was scoped to. The correction said **one**, in `live.test.ts`. A fact-check found **three files**: `live.test.ts`, plus three in `perf.test.ts` (`:63` `<10000`, `:77` `<250`, `:99` `<250`) and five in `collectors.test.ts` (`:479`, `:823`, `:937`, `:1069`, `:1078`). **So the correction to an incomplete search was itself an incomplete search** — the same defect one level up, and it survived precisely because "only one" sounds like the end of an investigation. The grep that settles it costs one command and was not run either time. A real distinction both earlier answers missed: **`perf.test.ts` runs on fixed synthetic fixtures, so it is exposed to machine state but not to corpus growth** — the two risks are separable and had been conflated. Original context: it has now failed for real.** `live.test.ts` → *"a cold call is under 10s and the next one is under 250ms"* compares a measured duration against a threshold — the exact class #47's audit reported finding **none** of. That report was accurate for the two files it covered and the scope was wrong: **the CEO drew it from where failures had been *seen* (`stream.test.ts`, `views.test.tsx`) rather than from where the property lives**, and neither party said the limit out loud. The cheap instrument is to grep the whole suite for assertions on elapsed time *before* choosing what to audit. **It is also the first Category-1 failure anyone has observed rather than reasoned about**: 14,345 ms, then 16,580 ms in an independent run, against a 10 s budget. **A first correction attributed both to load and declared corpus growth disproved with "~4× headroom". That was another single sample, and it is withdrawn.** Seven measurements now exist: **2,372 ms** (alone, load 17.8) · **4,927 / 4,224 / 4,723 ms** (alone, load 5–8, three consecutive) · **12,022 / 12,610 ms** (alone, load 47) · **11,911 ms** (inside `npm run check`, load 4.1). **The spread is 5.3× and the 10 s budget sits inside it**, so the assertion's verdict is decided by machine state rather than by the code — #50's Category-1 problem, now quantified rather than asserted. **No single cause is established.** Load correlates but does not explain the 11,911 ms reading at load 4.1; page-cache warm-up was tested and rejected (three consecutive runs show no warm-up trend); the best remaining pattern is *isolation* — fastest alone on a quiet machine, slowest inside the full suite or under competing work — which is the original #47 shape and is **not the same claim as "load average is high"**. **Corpus growth is neither proved nor disproved by any of this**, and `c-mission-control-cold-start` cannot be honestly refreshed or breached until the variance has a named cause. What follows for the budget: a threshold whose subject varies 5.3× is not a budget, it is a coin flip with a number on it. **The spinners below were real and were killed; they explain the load-47 readings and nothing else — and even that was overclaimed.** The suite's own wall time was reported as **77.2 s clean versus 168 s "contaminated"**. An independent fact-check read **166.63 s and 177.88 s with no spinners running**, at load 3.5–4.5. So **168 s was never evidence of contamination**; the suite's runtime varies at least 2× on its own, and **77.2 s was the outlier that got promoted to the true value** because it was measured after the fix and confirmed the story. Use pass/fail counts. The independently reproduced figures are **222 tests / 8 files / 0 fail**, which are stable; every wall-clock number attached to them is a sample. The strongest pattern in the cold-call data is likewise **alone-vs-in-suite (~3× penalty)**, independently reproduced — 2,158–3,810 ms alone, **7,337 ms and a failing 11,259 ms inside the full suite with no spinners** — and that is a different claim from "the machine was loaded" ~14 orphaned `bun -e while(true){}` processes from #47's own load probe were still running 42–47 minutes after that audit returned, holding the machine at load average 47. Killed; the same call then measured **2,372 ms at 2,512 sessions**, and the full suite **222 pass / 0 fail in 77.2 s** (load 13.7 → 5.9) against **168 s** while the spinners ran. **So the corpus-growth hypothesis is disproved — `c-mission-control-cold-start` has ~4× headroom and is not being approached.** The general rule, which nearly produced two fabricated findings inside twenty minutes: **an instrument left running becomes part of the environment it was measuring.** A load generator needs its teardown in the same breath as its setup, and any timing taken afterwards needs the load average recorded beside it. What remains genuinely open: this assertion has no bound on machine state, so it will keep failing on a busy machine and saying nothing about the code |
| **#51** | **`/api/conflicts` has no ceiling on its own output, and one repo can make it 1,448× larger.** Measured on a `node_modules`-shaped fixture: the response goes **1,288 B → 1,864,653 B**, 2 → 5,001 conflicts. `detectConflicts` bounds neither the record count nor the payload, and `api.ts:85` fans out across every discovered project, so the worst case is per-project cost multiplied by the fleet. **Signal-drowning, not fabrication** — every conflict reported is real, and it is not on the SSE tick — which is why it is filed rather than fixed inside PR #37: bounding output is a design question (truncate with an honest `readable:false`-style marker? cap per project? aggregate?) and smuggling it into a two-line clamp fix would be the opposite of the discipline this phase spent itself establishing. Found by the #37 reviewer while measuring the *input* cost the PR did claim: **the unmeasured side was the output** |
| **#52** | **Forcing `showUntrackedFiles=all` does not close the fabricated-conflict class — it cannot split a repo boundary.** `all` splits untracked *directories* within one repository, so `?? newdir/` becomes the individual files and #48's collision goes away. It has no effect across a **nested repository**: git reports a nested repo as one entry, so two worktrees vendoring *different* nested repos at `vendor/thing` both render `vendor/thing/` and collide — **reproduced through real `detectConflicts`**, not reasoned. So PR #37's comment claiming the fix works "for everyone" was too strong and was weakened to what is true. `agentvibe` itself is unaffected **only incidentally**, because it gitignores `.worktrees/` — *an incidental mitigation is not a fix and must not be recorded as one.* Caught by the reviewer going looking for repo boundaries specifically, after the author's fix and the CEO's brief had both missed it |
| **#49** | **A test asserting a 380 B margin asserts it against 0 bytes in an environment this repo's own matrix runs green.** `collectors.test.ts:1320` reads `raw` with no env pin: **130 bytes clean, 0 bytes under ambient `showUntrackedFiles=no`**, so `0 < 2000` succeeds *for the opposite of the stated reason* and the headroom is measured against nothing. The mutation still dies via `changedFiles.length > 0`, so this is test integrity rather than collector correctness. **It is the same hermeticity hole the author had closed in two other tests in the very same commit** — closed the two that were reported, did not look for the third. Fix: pin that setting only (pinning `quotePath` would destroy the raw stream the test exists to exercise; the helper already exists three tests up) and add a non-vacuity guard asserting the raw read is non-empty *before* asserting anything about its size. `0 < 2000` should have been impossible to write as a pass |
| **#46** | **The conflict-path barrier's coverage is decided by its fixture, which is a standing property rather than a fixed bug.** The exists-on-disk assertion caught the C-quoting fabrication (F2 on PR #35) *only because* the fixture was extended to space / quote / backslash / tab / non-ASCII / emoji / rename names — it would miss a seventh quoting case nobody thought to write down. **That is no longer hypothetical — it happened on the very next review.** Under `core.quotePath=false` git emits non-ASCII raw while still quoting for spaces, and a parser iterating by UTF-16 code unit destroys astral characters: `"fire 🔥 space.ts"` rendered as a path that does not exist, executed, no truncation involved. **The barrier stayed green** because its exotic set contained no name carrying *both* a space and an astral character — the one combination where the defect lives. A fixture cannot enumerate what nobody has thought of, and this is the measured proof. **The instrument that removes the dependency: assert `parseStatusPorcelain`'s output against `git status -z`**, which is NUL-separated and **unquoted**, so git itself supplies the ground truth and the fixture stops deciding what is covered. Same argument as #45 one level over: replace a check whose coverage comes from enumeration with one whose coverage comes from the source of truth. Not built — a new instrument, out of scope for the PR that found it |
| **#45** | **The no-blocking guarantee has no instrument that binds everywhere.** Timing cannot: *any statistic computed from the subject's own timings is under the subject's influence*, and no threshold, reducer or fixture removes that — measured, a memoised lister (block on cache miss, async on hit, a shape already in `index-store.ts`) escaped **5 runs of 5** by inflating the gate's own variance term. Timing also cannot resolve on the CI runner at any reachable child count (headroom/resolution 3.06 · 11.98 · 3.07 at N=6/12/24; needs >2). And the **source-text pin reads `conflicts.ts` only**, so a call that moves to `worktrees.ts` — or behind an alias, a re-export, or a computed property — is invisible to it. **The instrument that binds is not timing: intercept `child_process` for the duration of the collector call and assert no `*Sync` export is invoked.** No clock, no floor, no variance term, identical on every machine, and it hooks the real module so it survives every bypass the source-text pin lost to. Assert on the specific `*Sync` exports rather than a call count, and pair it with a non-vacuity check that the async path actually ran — otherwise it passes on a collector that made no call at all. Keep the timing test beside it: the two fail for **different** reasons, which is a second barrier rather than two copies of one check |
| **#34 · #35** | No `qa-tier-floor.yml` rule mentions mission-control, so every path in it classifies `lite / matched: (none — default)` — PR2's RCE would have too, and both PR4 and PR5 were tiered **by hand, which is not a mechanism**. And CLAUDE.md requires a Codex CLI second opinion at Full tier; `codex` is not installed, so every Full-tier review this repo has run was missing a documented required step |
- **The SessionStart payload still needs a router**, not a dump — lens ids plus one-line summaries under the
  inline threshold. Until then `c-lenses-and-playbooks-are-loaded` fails, by design.
