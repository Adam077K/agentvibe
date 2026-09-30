# SP2: Claude and Codex on one repo without collisions

**Status: harness built and dry-run; live arms not run.** Every launch of a real worker was refused by the
session's auto-mode permission classifier. The first attempt was refused as `Create Unsafe Agents`, when Claude
was launched with `--dangerously-skip-permissions`. The second was refused as `Safety Bypass Flag`, when Claude
was given scoped `--permission-mode acceptEdits --allowedTools …` and Codex was sandboxed with
`-s workspace-write`. Both times the launcher ran with the Bash sandbox lifted, as the common brief requires.
**No Claude or Codex worker ran in this spike: 0 of 40 launches used, $0 spent.** The mechanism findings below come
from the coordinator running against **canned workers**. Canned workers write reference edits after a fixed delay.
The findings are real properties of the mechanism. They are not evidence of how LLM workers behave. §6 lists what only
the live arms can answer, and gives the command to run them.

## 1. Hypothesis and pass/fail criteria (written before any run)

**H:** a Claude worker and a Codex worker can work concurrently on overlapping files of one repo. With v3's
mechanisms, which are fenced file#symbol leases, a clone per worker, a merge queue that integrates current main and
re-tests before landing, and a receipt per landed change, this happens with **zero lost edits and zero red commits on
main**. The mechanisms must cost less wall-clock than doing the tasks one after another. Without the mechanisms (the
naive arm), the same pair visibly collides.

| # | Criterion | PASS if |
|---|---|---|
| C1 | Lost or clobbered edits, Arm B | 0 over 3 runs. A task is lost if its hidden acceptance suite fails on final main after its worker said DONE |
| C2 | Red commits on main, Arm B | 0: every first-parent commit on main passes `bun test` |
| C3 | Stale holder | A holder whose lease expired and was re-granted is **rejected by storage**, not by the coordinator's own bookkeeping |
| C4 | Wall-clock | Arm B median < the sum of the two workers' solo durations. It must beat serial execution |
| C5 | Integration | The `combined` acceptance suite passes on final main in ≥2 of 3 Arm B runs |
| C6 | Contrast | Arm A shows ≥1 lost edit, red final state or combined failure in 3 runs. If it does not, the mechanisms are insurance against a problem not observed at this scale |

## 2. Setup (all under `spikes/collision/`)

- **Target app** (`target-template/`, copied into its own nested `git init` repo per run, never `git worktree add`):
  `shop-core` has six source files (`types.ts`, `config.ts`, `money.ts`, `cart.ts`, `pricing.ts`, `index.ts`), two
  test files, and a README that fixes the **order of operations** in `computeTotal`.
- **Tasks** (`tasks/*.md`) overlap on purpose.
  - `discount` goes to Claude (`claude-sonnet-5`).
  - `tax` goes to Codex (`gpt-6-astra`).
  - Both tasks must edit the `Cart` and `Totals` types, the **single** `config` object, `computeTotal`, `index.ts` and
    `test/pricing.test.ts`.
  - Each task also creates one file of its own (`discounts.ts` or `tax.ts`).
- **Hidden acceptance** (`acceptance/`) is copied in only at evaluation time: one suite per task, plus a `combined`
  suite that passes only if both features landed **and** compose (tax is charged on the discounted subtotal). The suites
  were validated against reference implementations (`validate-ref.mjs`). Discount-only passes discount; tax-only passes
  tax; both together pass all three.
- **Arm A** (`armA.mjs`): one checkout, both workers launched concurrently with `Promise.all`, no coordination.
  Afterwards the harness runs own tests plus the 3 hidden suites.
- **Arm B** (`armB.mjs`, `fence-hook.mjs`, `lib.mjs`) has five parts:
  - **Origin.** A bare repo stands in for "main". Each worker gets its own `git clone` of it.
  - **Leases.** A lease is held per `file#symbol`. A symbol is a top-level declaration; `<header>` is the import block
    and `<eof>` is an append. Symbol granularity applies to `types`, `config`, `pricing`, `cart` and `money`; other
    files are leased whole. Each task declares its footprint, which the dispatcher acquires. The resources the diff
    **actually** touched are computed at land time. Leases have a TTL and are renewed while the task is live, and each
    grant increments a per-resource **fencing token**.
  - **Storage fence.** A `pre-receive` hook in the bare repo recomputes the touched resources from the pushed commit.
    It rejects the push unless the commit's `Lease-Tokens:` trailer presents the *current* token for every one of
    them. This check does not trust the coordinator.
  - **Merge queue.** It fetches main, merges it in, and squashes onto main. A merge conflict or a red `bun test` sends
    the task back to the **same worker** for rework, with the conflict list. The push is a compare-and-swap, because a
    non-fast-forward push is refused.
  - **Receipt** (`receipts.jsonl`). Each record holds the base sha, landed sha, touched resources, the tokens
    presented, undeclared resources, conflicts, reworks, fence rejections, lease-wait seconds and worker cost.
- **Drill** (`armB.mjs --drill`). The discount worker's leases are not renewed, which simulates a hung or partitioned
  holder. When it finishes, it pushes with the tokens it *remembers* and does not consult the lease table.
- **Dry-run mode** (`SP2_FAKE=1`, `fake-worker.mjs`). A canned "worker" writes the reference edit for its task after a
  fixed delay: 20 s for "claude", 8 s for "codex". A rework writes the combined reference.

## 3. What happened

### 3.1 Live arms: not run

| Arm | Planned runs | Launched | Cost | Why |
|---|---|---|---|---|
| A (naive) | 3 × 2 workers | 0 | $0 | Launch refused by the auto-mode classifier (`Create Unsafe Agents`) |
| B (coordinated) | 3 × 2 workers + reworks, then 1 drill | 0 | $0 | Refused again after narrowing Claude's permissions (`Safety Bypass Flag`) |

`results/launches.csv` holds only its header. That is correct: nothing was launched.

### 3.2 Dry runs with canned workers (`results/logs/dryrun/`)

| Run | Lease policy at land | Outcome | Wall | Conflicts | Reworks | Fence rejects | Lease wait | Final main |
|---|---|---|---|---|---|---|---|---|
| B0-greedy | Take each free resource as found | **DEADLOCK**, nothing landed | n/a | 0 | 0 | 0 | ∞ (guard at 15 s) | seed only |
| B0 | All-or-nothing | Both landed | 30.2 s | 1 (4 files) | 1 | 0 | 13.2 s (tax) | 3/3 suites green, 3/3 commits green |
| B0-drill (TTL 5 s) | All-or-nothing, zombie holder | Both landed | 41.0 s | 1 (4 files) | 1 | **1** | 0 | 3/3 suites green |

**Finding 1: lazy land-time acquisition deadlocks, and it did so on the first run.** Both tasks added an `import type` to
the top of `config.ts`, which is the resource `src/config.ts#<header>`. Neither task had declared it, because a planner
writing footprints thinks in symbols, not import lines. The trace from `dryrun/B0-greedy/events.jsonl`:

```
t=8.2  tax worker_done        → tax grabs undeclared config.ts#<header>, waits for discount's 7 declared leases
t=20.2 discount worker_done   → discount needs config.ts#<header>
t=20.4 blocked  config.ts#<header>  h=discount heldBy=tax
t=35.5 DEADLOCK discount missing=[config.ts#<header>]   (tax: missing 7, all held by discount)
```

This is a textbook hold-and-wait cycle, and it came from an ordinary edit. Making land-time acquisition all-or-nothing
fixed it in `B0`. That fix is sufficient here only because declared leases are taken at dispatch, in one order.

**Finding 2: the declared footprint missed a real resource in 2 of 2 tasks.** Each task's receipt lists
`declared_missed: ["src/config.ts#<header>"]`. Import lines are shared hot spots that no one declares.

**Finding 3: symbol-level leases did not prevent the merge conflict.** With exclusive leases the two landings are
ordered. The second task still hit a textual conflict in **4 files** (`config`, `index`, `pricing`, `types`) and needed
a rework. Both tasks rewrite the same `computeTotal` body and the same object literal. At this overlap, a lease fixes
**order**. It does not fix **integration**, and the integration work is a rework launch whose cost falls on the second
worker.

**Finding 4: the fence at storage works, and it is what stops the zombie.** In the drill, discount's 10 leases expired
at t=6.1 s. Tax was promoted with token 2 and landed at 9.0 s. Discount then pushed with its remembered token-1 set. The
hook refused it (`fence.log`):

```
REJECT discount src/config.ts#config: presented 1 by discount, current 2 by tax | src/pricing.ts#computeTotal:
presented 1 by discount, current 2 by tax | … (7 resources)
```

It re-acquired (tokens 3), passed the queue, and landed green. The coordinator's own lease table was bypassed on
purpose on that path, so the rejection is the storage's alone.

**Finding 5: leases block the fast worker.** In `B0`, tax finished at 8.2 s and then sat 13.2 s waiting for discount's
leases. Lease priority is dispatch order, not finish order. With canned timings, Arm B took 30.2 s against 28 s of
serial worker time. Most of the 2.2 s overhead is the extra rework launch (8 s), offset by the parallel start.

## 4. Verdict against §1

| Criterion | Result |
|---|---|
| C1 lost edits (Arm B) | **Not tested live.** 0 in 2/2 canned runs, which proves the plumbing and nothing about workers |
| C2 red main (Arm B) | **Not tested live.** 0 red commits in canned runs; guaranteed by construction (test runs before the CAS push) |
| C3 stale holder rejected by storage | **PASS** (mechanism-level; does not depend on the worker) |
| C4 beats serial | **Not tested live.** Canned: 30.2 s against 28 s serial, a **fail** at this overlap |
| C5 combined green | **Not tested live** |
| C6 naive arm collides | **Not tested** |

**Overall: INCONCLUSIVE, and not a pass.** The live-worker hypothesis is untested. Two mechanism results stand without
live workers:

- The storage-side fence works (C3 PASS).
- A naive lease design deadlocks on ordinary edits (a negative result for the lease design as sketched).

## 5. What this changes in the v3 design

1. **The fence belongs in storage, not in the coordinator.** v3's "fenced leases" must mean that the resource
   (repo ref, DB, effect gateway) verifies tokens, as the pre-receive hook here does. A fence enforced only by the
   coordinator's table does not stop a zombie that no longer consults it. The storage also has to **recompute the
   touched resources itself**, which also catches scope drift.
2. **Land-time lease acquisition must be all-or-nothing, or use wound-wait** by mission age: the older mission revokes
   the younger one's lease and the younger one's token goes stale. Never acquire resources incrementally. Add a deadlock
   detector with a hard wait cap as a backstop.
3. **Treat `#<header>` (imports), `<eof>` (appends) and registries such as `index.ts` and config objects as hot
   resources** that no footprint declares. Either (a) auto-add them to every footprint that touches the file, or
   (b) exempt them from leasing and rely on the merge queue for them.
4. **Downgrade what leases are for.** When workers already have their own clones, a lease cannot prevent clobbering;
   the clone does that. A lease buys three things: **ordering**, **scope detection** (touched against declared) and
   **staleness rejection**. It does **not** buy conflict-free integration. Budget one **integration rework launch** per
   overlapping pair, and put that cost into mission pricing.
5. **Lease priority should follow readiness, not dispatch order.** A finished worker waiting on an unfinished holder
   is pure waste (13.2 s of 21.6 s in `B0`). Make leases optimistic: take them at land, first-ready wins. Keep
   pessimistic up-front leases only for resources with irreversible effects.
6. **Receipts work as specified.** One JSON line per landing, with the tokens presented, is enough to audit who wrote
   what under which lease. Keep them.
7. **The harness runtime must be able to launch workers.** This spike was stopped by the permission layer, not by a
   design flaw. A v3 "Referee" or dispatcher that cannot launch a worker without a human approving each launch cannot
   run a merge queue unattended. That needs a founder-level policy decision (a standing permission rule for the
   dispatcher), not a per-session workaround.

## 6. What we still don't know, and how to find out

- Whether **real LLM workers in one checkout (Arm A)** actually clobber each other, or adapt. Claude's Edit tool refuses
  to write a file that changed since it was read, and Codex's `apply_patch` fails on context mismatch. Both are built-in
  optimistic checks that could make Arm A far less bad than assumed. That is C6.
- The **rework quality** of real workers resolving conflict markers, the cost of a rework, and whether the `combined`
  suite passes (C5).
- Live wall-clock and cost (C4), and how often a real worker touches undeclared resources.
- Whether symbol leases at finer grain (object keys, function bodies) would buy real parallelism, or only more
  deadlock surface.

**To run the live arms**, allow the launch and run the following from `spikes/collision/` with the sandbox lifted.
Claude runs with `acceptEdits` and a `bun test`-only Bash allowlist; Codex runs `-s workspace-write`; run dirs go under
`$TMPDIR/sp2runs`:

```
node armA.mjs 1; node armA.mjs 2; node armA.mjs 3
node armB.mjs 1; node armB.mjs 2; node armB.mjs 3; node armB.mjs 4 --drill
```

Expected spend is about 16–20 launches. Each run writes `results/logs/<run>/summary.json` and appends to
`results/launches.csv`.
