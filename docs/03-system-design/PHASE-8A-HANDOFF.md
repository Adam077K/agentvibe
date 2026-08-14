# Handoff — Phase 8a, complete

**For:** whoever picks this up next.
**State: all 5 PRs merged; `main` has since moved to `0bd7625`** (#29, #34, #36, #31, #33, #35, #37 landed after phase close).
**222 tests, 0 fail** (VERIFIED on `28626d8`, independently reproduced; #37 added 2 more since). **Do not quote a wall time** — the same suite has read 77.2 s, 166.63 s and 177.88 s on quiet machines, so the runtime varies ≥2× on its own and no single reading evidences anything. 205 tests at `01fcadd`, 193 at close. Do not quote an
assertion total: identical runs differ (386 vs 360 on one file), because the live fleet tests loop over
what is on disk.
`npm run check` exits 0 after `bun install` in `mission-control/`. All six views work end to end.
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
- **An environment override you set can be beaten by one the parent exported.** Forcing
  `core.quotePath=true` through `GIT_CONFIG_COUNT`/`KEY_0`/`VALUE_0` was verified to beat repo-local,
  `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_SYSTEM` — and to **lose** to `GIT_CONFIG_PARAMETERS`, which git reads
  afterwards **and exports into every child** of `git -c …`, aliases, hooks, `rebase -x`, `bisect run` and
  `submodule foreach`. Anything spreading `...process.env` inherits it. So "equivalent to the command line"
  was true against the three configs anyone thinks to test and false against the one that arrives by
  inheritance. When you force a setting, enumerate every channel that can set it *later*, not just the ones
  a user edits.
- **A prior PASS covers a later commit only when the mechanism is unchanged — "it's test-only" is not the
  test.** Two PRs in this phase merged on an earlier verdict, and the justification was narrow both times:
  the delta was additive tests each proven by its own mutation, *plus* one substitution already shown
  bit-identical across 20,163 differential cases. That holds because the mechanism was provably the same,
  **not because tests are harmless**. The counter-example is in this very phase: making an unfired branch
  testable *required* extracting the arithmetic into a pure function — a mechanism change wearing the
  costume of a test addition. When a new test needs the code touched to become testable, the verdict is
  stale even though the diff looks like more of the same. This is the enforceable half of #24: nothing in
  the gate notices that a PR number's earlier PASS was passed on different code.
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
- **A cause you attributed but never tried to reproduce is a claim with no mechanism** — and it is the same
  defect class as everything above, aimed at a diagnosis instead of a value. #47 sat in the status doc for a
  day asserting three tests "failed under ~200% CPU load." Nobody had induced load and watched. When someone
  did, **81 of 81 passed at load average 42** and the historical failures were 43×–190× beyond anything CPU
  or fork contention could produce. The entry named a cause, a reader would have fixed *that* cause, and the
  fix would have been aimed at the wrong thing while the entry closed green. **When you write down why
  something failed, either reproduce it or mark the cause UNTESTED.** The cheap instrument is to try to make
  it fail on purpose; a failure you cannot reproduce under the condition you blamed is not explained.
- **An instrument left running becomes part of the environment it was measuring — and a teardown that
  prints its own success is not a teardown.** A load probe from #47 answered its question, then kept ~14
  spinners alive for 47 minutes at load average 47, and became the confound for every timing taken on this
  machine afterwards: a suite that runs in 77 s read 168 s and was published as VERIFIED in two documents,
  and a 2.4 s cold call read 14.3 s and nearly became a finding that the corpus had grown into a budget with
  an expiring claim attached. **Neither the author nor the CEO looked at the machine before trusting a
  timing.** The teardown had printed `cleaned` unconditionally and never checked — this phase's own defect
  class, committed inside the cleanup of an audit hunting that class. Two mechanical causes, both invisible
  to reasoning and instant to `pgrep`: **each Bash call is a separate shell, so `jobs -p` cannot see jobs
  started in an earlier call**, and **`pkill -f 'while true; do …'` never matches, because a subshell's
  command line is not the string you typed.** So: `pgrep` after the kill and fail loudly if anything
  survives, and **record the load average beside every timing you report.**
  **Two instruments, and they do different jobs — take both.** *Prevention:* not a `pgrep` helper someone
  must remember to call, which is a discipline with a nicer surface, but one that owns the whole lifetime —
  `withLoad(n, fn)` starts the generators, runs `fn`, and in a `finally` kills them **and asserts none
  survive**. Then there is no teardown to forget because there is none to write, and the check can fail at
  the point of the offence rather than 45 minutes later inside someone else's measurement. Same move as
  extracting `stallGateVerdict`: the branch could not be tested until it stopped being inline, and could not
  be got wrong once it was a function with its own tests. *Detection:* print `uptime` either side of every
  timing run. **The helper does not close the class** — today's leak came from ad-hoc shell during an audit,
  where no helper is in scope, and that is the common case for exploratory work. The helper covers the
  repeatable path; `uptime` catches contamination from any source, including the ones nobody instrumented.
- **Execution proves existence; enumeration proves absence. Do not demand the wrong one.** This handoff is
  otherwise a long argument for running things rather than reasoning about them, and that argument has a
  boundary. Asked whether a fourth RCE existed at `fleet.ts:131`, the CEO's brief said *"execute it or say
  plainly that you could not."* **That was the wrong instrument**: a payload can only show that the *one*
  input you chose does or does not reach the sink, while the question — can *any* request-controlled value
  reach it — is answered only by enumerating every call site. A negative from execution would have been the
  **weaker** evidence and would have read as the stronger. The trace settled it (`REPO_ROOT` is computed
  from `import.meta.url`, and `/api/fleet` reads no query parameter), and it is checkable because the trace
  is printed rather than summarised. **Mark it CONFIRMED-by-trace, not CONFIRMED-by-execution** — the two
  support different claims. Corollary, and it is why the trace still matters: `fleetSlice(repoRoot: string =
  REPO_ROOT)` is a *defaulted parameter*, so the seam for a future caller to pass a discovered root exists
  even though none does. A latent shape is worth recording precisely because no execution can find it.
- **Say what you are NOT covering — and note that the correction to an incomplete search is usually another
  incomplete search.** This one has three rounds and is the clearest instance in the phase. An audit reported
  **no** Category-1 duration assertions, exactly true of the two files it was scoped to, and was read as a
  statement about the repo. The correction said **one**, in `live.test.ts`. A fact-check found **three files
  and ~10 assertions** — `perf.test.ts` carries three with identical thresholds, `collectors.test.ts` five
  (#50). Each answer was produced by someone who had just been told the previous one was too narrow. **"Only
  one" reads like the end of an investigation, which is exactly why nobody ran the grep** — and the grep is
  one command. Scope from where the *property* lives, never from where failures were *seen*; name the
  exclusion in the verdict line; and when you correct someone else's scope, run the exhaustive search rather
  than the next-widest one.
- **Forcing a value that is not an extreme of its domain is a clamp in BOTH directions.** Enumerate the
  domain before writing a single mutation: if the forced value is interior, the downward case is mandatory;
  if it is an endpoint, skip it *with a stated reason*. `core.quotePath` is boolean, forced to an endpoint,
  and was therefore safe structurally rather than by luck. `showUntrackedFiles` is `no|normal|all` and
  `normal` is interior — the upward clamp was the intent, the downward one invented a conflict (#48). Every
  mutation written for it asked *"what if the setting is absent?"*, the fix's own axis; **none asked what
  happens on the far side of the pin. That is mutating the fix rather than the space the fix clamps.**
- **A severity is a measurement or it is a guess wearing a number. Before quoting one, name the command
  that produced it.** Four severities were quoted in one day with no command behind any of them — "12–18
  spawns inside a 5 s budget", "55 s of margin", "~200% CPU load", "1,246 assertions" — and all four
  dissolved when someone finally ran something. None needed a new instrument: a stopwatch, a control run,
  a preload, and a log that had already been printed.
- **Independent review is not ceremony, and here is the evidence rather than the principle.** The author and
  the CEO each ran a mutation matrix over `statusConfigEnv`, on the same afternoon, both holding the rule
  above, and both asked the *same incomplete question* — does the guard fire when the setting is absent?
  Both got a satisfying red and called it verified. The downward clamp was found by a reader who had briefed
  none of it. **Two people who share a frame will share its blind spot, and running the check twice does not
  find what the frame excludes.**
- **Before reporting that a number moved, check that it holds still.** Assertion counts across this suite's
  three hostile-config runs read 396 / 360 / 390, which looks exactly like "the hostile config is covering
  less" — the phase's own defect class, a green run that measured less. It is not. Two *identical* clean runs
  give 386 and 360, because the live fleet tests loop over whatever projects are on disk. **A difference is
  only evidence once you have measured the noise floor**, and the control run costs one command. The
  corollary: `expect()` totals are not a coverage metric here, and this handoff quoted one as a headline
  figure twice before checking.
- **A computed margin is not an exposure.** A bucket boundary is only a risk once you have shown the two
  sides come from *different reads*; otherwise it is arithmetic about a comparison that never happens. F3
  was reported as a 55 s margin derived from a formatter's bucket width, before anyone checked whether any
  test reads the clock twice. None does — the sites asserting a relative string pass one captured `now` to
  both the expectation and the component, so skew cancels exactly. Under a clock jumping 60 s on *every*
  read, 71 of 71 passed.
- **Check the experiment before believing it, especially when it confirms you.** That F3 probe would have
  produced an identical clean result if the preload had silently failed to load. It was validated first:
  an assertion that two consecutive reads differ by ≥60 s passes with the preload and fails without it. **A
  negative result from an instrument you have not shown to be live is not a negative result.**
- **When a runner kills a child, the child's error arrives first and looks like the cause. Check for a
  signal before believing a stack.** The #47 failures were read as a broken git fixture because the log
  ended in a multi-line stack at `initGitRepo`. It carried `signal: "SIGTERM", status: null` — git was
  *killed*, not failing — and bun had already printed `^ this test timed out after 5000ms`. One of the two
  failures printed no git stack at all. The diagnosis was in bytes we already had; a stack is visually
  louder than the one line that says what happened, and we read the loud one. **`status: null` with a
  signal set means someone else ended it — that is teardown, not a defect.**
- **A test with no explicit timeout still has one, and it is an unwritten duration assertion.** 71 tests on
  bun's implicit 5 s default, 25 of them forking 12–18 git processes: the budget is real, nobody chose it,
  and when it blows it surfaces *inside the fixture* as a git throw — indistinguishable from a broken
  fixture. Hoist the fixture out of the timed region. Raising the timeout only moves the line.

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
