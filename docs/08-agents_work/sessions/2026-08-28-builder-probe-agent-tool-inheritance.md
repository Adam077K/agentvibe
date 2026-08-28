---
date: 2026-08-28
role: builder
task: probe-agent-tool-inheritance
qa_verdict: PASS
tier: irreversible
engines: [builder]
claims_touched: []
---

# A launched `--agent` session is CONTAINED: routing dispatch through the orchestrator would not buy the gate

**The verdict is `CONTAINED`, exit 0, measured against `claude 2.1.246` on 2026-08-28.** A session launched
as `claude --agent orchestrator` is offered **5 tools — `Read Write Edit Bash Task`** — and `Workflow` is not
among them, against **41** in a main session where it is. `.claude/workflows/qa.js` runs under `Workflow`, so
**routing a dispatched goal through `--agent orchestrator` buys the lens and the playbook and does NOT buy the
gate** — while looking, from outside, as though it had. That was the dangerous branch of the question and it
is the one that is true. The design decision it gates is the founder's and the orchestrator's; nothing in
`mission-control/scripts/consume-dispatch.ts` was touched here.

**The absence is only worth reading because the instrument was made to produce its opposite in the same run.**
Four arms, three of them controls, and all four must fire before any verdict is printed:

| arm | invocation | tools | `Read` | `Workflow` |
|---|---|---|---|---|
| baseline | no `--agent` | 41 | yes | **yes** |
| subject | `--agent orchestrator` | 5 | yes | no |
| fixture | `--agents '{…}'` declaring `[Read, Workflow]` | 2 | yes | **yes** |
| differential | `--agent reviewer-readonly` | 3 | yes | no |

The fixture arm is the load-bearing one. "No `Workflow` under `--agent`" is byte-identical whether a launched
agent session cannot carry `Workflow` at all, the flag was ignored, the CLI never started, or the parser broke
— so an agent that *declares* `Workflow` is launched in the same run, and it gets it. The differential arm
kills the remaining reading: two agents with different declared sets came back different, so `--agent` is
read rather than falling back. **A run missing any control reports `UNRESOLVED` at its own exit code 2 and
concludes nothing** — that is a terminal value here, not an error and not a default.

**And the actionable half was measured rather than inferred.** A **file-defined** agent — `.claude/agents/…md`
with `tools: [Read, Workflow]` — launched with `--agent` comes back with exactly `Read Workflow`. So adding
`Workflow` to `.claude/agents/orchestrator.md` **would** put the gate in reach of a dispatched session. That
is a live option for the design decision, not a hypothesis.

**A side-finding nobody was looking for, and it changes how a declared `tools:` list should be read.**
`Glob` and `Grep` are dropped from the advertised set exactly when `Bash` is declared beside them — 4 agents
of 4: `orchestrator` 7 declared → 5, `builder` 6 → 4, `reviewer` 4 → 2, and `sourcer` (no `Bash`) 5 → 5. So an
engine's frontmatter is an upper bound on what it is offered, not a description of it.

**What the method cannot see, and which way it is biased.** The probe reads the tool set a session
**advertises** at init, never a successful `Workflow` **invocation** — it kills each child at the init line, so
a tool that was advertised and then failed on use would read as `INHERITS`. **The bias therefore runs against
the answer this returned:** the only error the method can make is over-reporting inheritance, and it reported
containment. A reader will assume the reverse, because the usual case is the reverse.

**What it costs to run, and why it is not a step.** The probe spends no model turn, but it launches four real
sessions and needs credentials, so it cannot run on a runner. Its prefix is outside `GOVERNED`, so it needs no
exclusion. **Its test is hermetic** (a fake CLI written into a temp dir, 17 of 17 in 15.6s) and is `EXCLUDED`
for a figures reason measured on this tree, not quoted from the sibling entry: wiring it moves `suiteSteps`
48 → 49, `check:figures` returns **11 findings across 8 locators** in `docs/STATUS.md` (4), `CLAUDE.md` (3)
and the workflow (1), and `test:check-suite` fails again on the guard that every step has a workflow
counterpart — a workflow edit this lane did not hold. *Re-derived after merging `origin/main` at `62e0c26`,
which moved every one of those line numbers: the counts are unchanged, and the promotion shape was measured
with the step added AND the exclusion removed, because a tree carrying both fails for a different reason.*

**So read this branch's suite tally narrowly.** `test:probe-agent-tool-inheritance` is `EXCLUDED`, which means
**the 48 of 48 below is green with the probe's own test never having run inside the suite.** It passed 17 of
17 by hand, and that is the only place it passed. The consequence is written into the exclusion entry rather
than glossed: **nothing automated checks the probe's refusal path today** — the mutation that proves the
fixture control is load-bearing is a hand-run.

**Verification, re-run after merging `origin/main` at `62e0c26` — every figure below is from the merged tree.**
`npm run check` → **48 of 48 passed · 0 failed**, sandbox armed (159.4s here against 198.1s before the merge;
wall clock tracks how many lanes are building and is not a figure to read).
`npm run test:probe-agent-tool-inheritance` → **17 pass · 0 fail**.
`node scripts/probe-agent-tool-inheritance.mjs` → **CONTAINED, exit 0** against the real CLI, and the arms came
back **41 / 5 / 2 / 3** — identical to the pre-merge run, which is the third independent reading of the subject
arm. Mutation, by hand: deleting the fixture control turns the "empty bucket the probe could not have filled"
case green — **16 pass · 1 fail**, restored to 17 · 0. Tier from `node scripts/classify.mjs`:
**irreversible**, floored by `scripts/lib/check-suite.js` — where this branch's diff is **35 insertions and 0
deletions**, one `EXCLUDED` entry and nothing else.

**The standing caveat applies unchanged.** This PASS means the checks ran and are green, recorded by the
author, single model family. `irreversible` asks for 2-of-3 multi-judge across ≥2 model families and that is
not met. Accepted risk, exit condition 2026-11-17.
