---
role: builder
task: honest-dispatch
date: 2026-08-26
branch: fix/dispatch-reports-what-happened
worktree: .worktrees/honest-dispatch
base: 47dbbd6
tier: full
risk: full
tier_note: "node scripts/classify.mjs over the five changed paths returns floor=full, driven by mission-control/server/** (index-cache.ts, routes/api.ts). Not irreversible: no workflow, agent definition, migration or billing path is touched."
qa_verdict: PASS
verification_round2: "After blind review returned correctness:fail with one p1. C1 fixed by allow-listing selection (classifyDispatches): unrecognised statuses are reported and left EXACTLY as found — re-measured table shows all four untouched, both controls firing, exactly 1 launch across six cases. C2 complement counting. C3 consumerPid + isAlive liveness. C5 dry-run parity. C6 not-started distinguished from no-result. C7 label. C8 fold contract now asserted in crosscheck.test.ts. UI half now tested (C4): 9 tests, and reverting to the enumerating headline turns 3 of them red. Suites: npm run check 46 of 46 · 0 failed; dispatch 47/0; index-cache 32/0; write-barrier 7/0; shell ban 12/0."
qa_caveat: "A PASS I recorded myself. One author, one model family, no independent review — that is the deterministic floor being met, not the `full` tier's review requirement."
decisions:
  - "Widened DispatchStatus rather than adding a parallel `outcome` field. A second field leaves `status` still lying to anything that reads only it — including the UI, which did. Widening the union makes the wrong state unrepresentable and forces every reader to handle failure."
  - "Kept `consumed` as the success value instead of renaming it to `completed`. Rename churn across UI, tests and existing queue files buys nothing; `readDispatch()` does not validate `status`, so old lines keep parsing."
  - "Wrote `running` to the queue BEFORE the launch. A marker written afterwards records nothing about the interval it exists to cover — that is what makes `no-result` detectable at all."
  - "Folded append-only lines to current state in GET /api/dispatch, not in the client. client/src imports server/** as `export type` only; folding client-side meant breaking that boundary or writing the fold twice."
  - "Did NOT route dispatch through the orchestrator. Measured blocker, reported instead — see corrections."
corrections:
  - "I invented a CSS class. `text-err` does not exist in styles.css; the token is `text-bad`. Caught by grepping with a control that fired (8 files use text-warn) rather than by assuming. Five occurrences replaced."
  - "The brief named two defects; execution found a third. An already-finished dispatch was relaunched on EVERY run, because the consumer filtered raw lines by `status === 'pending'` and append-only never removes the original pending line."
  - "The preamble pins `origin/main` = 244e8db and says STOP if it differs. It is 47dbbd6 — 244e8db is an ancestor. Proceeded on the lead's newer explicit base."
  - "ROUND 2, p1 from review, and the sharpest correction of the lane: I replaced an ALLOW-list with a DENY-list. Base selected `status === 'pending'`; my first cut selected `!TERMINAL.includes(status)`, so every status this build did not recognise was LAUNCHED and then OVERWRITTEN with `consumed`. Reproduced: `timed-out`, a missing field, `7` and `null` all launched, record destroyed. I defeated the code I ADDED and left the code I REMOVED fail-open — and my own UI comment names that exact class one file away. Class named, one site swept."
  - "ROUND 2, p2: `unsuccessful` enumerated `failed`/`no-result`, so `running` and unknown statuses counted as neither — the field reproduced the defect its own doc says it exists to prevent. Now a complement."
  - "ROUND 2: the existing `every LiveState in test/** says where its index cache goes` guard caught my new crosscheck test writing an index cache into $HOME. Fixed by naming the path; the guard was right."
claims_touched: []
verification: "See prose. All figures VERIFIED-BY-EXECUTION; none read off the source."
---

# A failed launch and a successful one wrote the same record

**The defect, reproduced before it was touched.** `consume-dispatch.ts:136` read
`status: ok ? 'consumed' : 'consumed'`. Against a fixture `claude` exiting 3, the durable record was
byte-identical to the success case — same keys, same `"status":"consumed"`, differing only in id and goal.
The failure was printed once to a console and was absent from the only record that persists. That is this
repo's recurring shape: `findings: []` read as *clean*, `0 matches` read as *absence*.

**The root cause was in the type, not at the write site.** `status: 'pending' | 'consumed'` made failure
*unspellable*, so the ternary was the only honest thing that line could do. `DispatchStatus` is now
`pending | running | consumed | failed | no-result`, with `exitCode`, `signal`, `startedAt`, `finishedAt`
and `error`. **`no-result` is not an edge case** — roughly half of subagent runs end mid-tool
(n=2,581, [48.4%, 52.2%]), so the most likely outcome of a dispatch was the one state the union could not
express. `exitCode` is *absent* rather than `0` for a signalled launch: writing `0` would rebuild the
defect one field along.

**`running` is written before the launch, and that is the whole mechanism.** A consumer killed mid-flight
leaves `running` in the queue, and a later run resolves it to `no-result` instead of relaunching. Proved
with the input that would defeat it — the fixture `claude` in that test **exits 0**, so a consumer that
relaunched would record `consumed` and look correct; the assertion is on the line count and the verdict.

**A third defect, found by running rather than reading: every finished dispatch was relaunched on every
run.** The consumer filtered raw lines by `status === 'pending'`, and an append-only queue never removes
that line. Measured: a second run on a consumed queue relaunched the goal and appended a third line. The
script's own comment absorbed this as safe — *"`claude --print` is idempotent in the worst case"* — an
assumption doing load-bearing work for a bug nobody had checked for. `resolveDispatchStates()` now folds
to the last line per id.

**The UI would have re-hidden the failure.** `DispatchView` rendered `pending` or, for everything else, the
word "consumed" in muted grey. Widening the type without widening the view moves the lie from the file to
the screen. All five states now render distinctly, `failed`/`no-result` in the error tone, with an unknown
status shown as unknown rather than folded into a known one. The headline gained `unsuccessful`, because
"12 entries · 0 pending" beside twelve failures is true in every number and wrong in what it conveys.

**Non-vacuity.** Reinstating the original ternary turns exactly the two distinguishing tests red
(`32 pass · 2 fail`); restoring gives `34 pass · 0 fail`. Every assertion is paired with the outcome it
must *not* equal — `status === 'failed'` alone would pass against a build that wrote `'failed'`
unconditionally.

**The second defect is BLOCKED and not worked around.** Routing through the orchestrator needs a capability
that does not exist: `claude --agent` is available, but **no engine declares a `Workflow` tool** — 7 of 7
engine files carry `tools:` and none lists it, the orchestrator's being
`[Read, Write, Edit, Bash, Glob, Grep, Task]` — so `qa.js` is unreachable from any dispatched engine.
`--agent orchestrator` would buy the lens and the playbook and **not** the gate, while looking from outside
as though it had. The existing comment defending `claude --print` is right that it avoids assumptions about
the harness; the measurement records that freedom from assumptions about the harness is freedom from the
harness. The design is owned by the lane establishing workflow invocation, and is not chosen here.
