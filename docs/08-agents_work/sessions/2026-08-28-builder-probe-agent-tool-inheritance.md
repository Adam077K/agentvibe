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
Four arms, three of them controls, and **five** controls must fire before any verdict is printed — the fifth
added after review, and it is the only one guarding the *other* direction:

| arm | invocation | tools | `Read` | `Workflow` |
|---|---|---|---|---|
| baseline | no `--agent` | 41–52 | yes | **yes** |
| subject | `--agent orchestrator` | 5 | yes | no |
| fixture | `--agents '{…}'` declaring `[Read, Workflow]` | 2 | yes | **yes** |
| differential | `--agent reviewer-readonly` | 3 | yes | no |

**The subject arm is 5 on every run; the baseline count is not a constant.** It read 90, 41 and 52 on this
machine in one day, because it includes whichever MCP servers happened to connect. `Workflow` was present in
all three, and that is the only property of it the verdict rests on — which is why the exclusion entry
describes the baseline rather than quoting a number for it.

**The fifth control, and it is the one whose absence would have shipped the worse verdict.** Every control
above guards the `CONTAINED` path. If the runtime ever resolved an unknown or unloadable `--agent <name>` to
the **main-session set** instead of erroring, all four still fire and the probe prints `INHERITS` — announcing
that dispatch reaches a gate it does not reach. So the subject arm must now also differ from the baseline arm.
Not reachable today, and that is measured rather than argued: `claude --agent zzznotarealagent` exits 1 with
the CLI's own message, so such an arm dies and is reported `UNRESOLVED`. The reviewer built both routes into
it — a fake CLI returning the baseline set, and a typo'd agent name — and both are pinned; removing the
control turns them red (20 pass · 2 fail against 22 · 0).

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

**That correction had to reach the artifact that prints, and it did not until a reviewer caught it.** The
probe's own `CONTAINED` note ended *"A launched agent session gets its DECLARED tools"* — refuted by the table
directly above it in the same file, and by the header the note sits under. The session file knew; the thing
someone runs in six months did not. Both the printed note and the test's header line now say **transformed by
the runtime, not delivered**, and name the transformation.

**The transformation is specific to `Glob`/`Grep`, and the remedy depends on that — so it was measured rather
than assumed.** `Workflow` declared beside `Bash` survives: inline `[Read, Bash, Workflow]` → exactly those
three, against `[Read, Workflow]` → 2 in the same run, differing in one element. In the shape the remedy would
actually take, a **file-defined** agent replicating the orchestrator's declared list returns the same 5 as the
real thing (which is what validates the replica), and **the replica plus `Workflow` returns 6**. So the
declaration is honoured on this path. Two limits on reading that as a green light, both stated in the note the
probe prints: it is the tool being **advertised**, not invoked, and `PS-WORKFLOW-CONTAINMENT` refuses the
declaration in this repo.

**And that lands on a live claim in `CLAUDE.md`, which is why it is recorded here rather than only measured.**
The Wave 2 bullet says *"a dispatched engine that declared it would get a silent no-op, not an error."* That
rests on `probe-workflow-reach.mjs`, which counts **sidechain `Workflow` calls** — a different path and a
different observable from this probe's. It is unrefuted for a **subagent**; it is **false for a launched
`claude --agent X` session**, which is the path `consume-dispatch.ts` would actually use. `PS-WORKFLOW-
CONTAINMENT`'s stated reason has the same shape: *"no field in this frontmatter is read on the path it runs
on"* is true of a bare `claude` and false of `claude --agent orchestrator`. **The containment those two
protect is not weakened by any of this** — the gate still must not be invocable by the thing it gates, and
that argument never depended on the declaration being inert. What changes is that "it grants nothing" is no
longer available as the reason. Neither file is touched here: both are `irreversible`, and this is an
orchestrator-and-founder call, not a builder's.

**What the method cannot see, and which way it is biased.** The probe reads the tool set a session
**advertises** at init, never a successful `Workflow` **invocation** — it kills each child at the init line, so
a tool that was advertised and then failed on use would read as `INHERITS`. **The bias therefore runs against
the answer this returned:** the only error the method can make is over-reporting inheritance, and it reported
containment. A reader will assume the reverse, because the usual case is the reverse.

**What it costs to run, and why it is not a step.** The probe spends no model turn, but it launches four real
sessions and needs credentials, so it cannot run on a runner. Its prefix is outside `GOVERNED`, so it needs no
exclusion. **Its test is hermetic** (a fake CLI written into a temp dir, 22 of 22 in 22.4s) and is `EXCLUDED`
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

**Three advisory findings taken rather than declined, because each was a way to report something the run did
not establish.** A truncated init line and a session that never spoke shared one timeout reason, and the
buffered bytes went unread — the reason now carries the tail, or says explicitly that nothing was buffered.
Naming one agent for both the subject and differential arms reported *"`--agent` is not being read"*, which is
a conclusion about the invocation dressed as one about the runtime; it is refused up front. And `--agent
builder`, the space-separated form, was **silently ignored** — `flag()` reads `--agent=` only — so the probe
measured the default agent and reported it under the name you asked for. Unrecognised arguments are now
refused before anything launches. That last one is *declare what is read and refuse the rest*, the same move
`parseCiSteps` was rebuilt around.

**Verification, re-run after merging `origin/main` at `62e0c26` — every figure below is from the merged tree.**
`npm run check` → **48 of 48 passed · 0 failed**, sandbox armed (159.4s here against 198.1s before the merge;
wall clock tracks how many lanes are building and is not a figure to read).
`npm run test:probe-agent-tool-inheritance` → **22 pass · 0 fail** (17 before review; the five added are the
main-session control by two routes, the two argument refusals, and the truncated-line reason).
`node scripts/probe-agent-tool-inheritance.mjs` → **CONTAINED, exit 0** against the real CLI, and the arms came
back **41 / 5 / 2 / 3** — identical to the pre-merge run, which is the third independent reading of the subject
arm. Mutation, by hand: deleting the fixture control turns the "empty bucket the probe could not have filled"
case green — **16 pass · 1 fail**, restored to 17 · 0 — and deleting the main-session control turns the two
tests written for it green, **20 pass · 2 fail**, restored to 22 · 0. Tier from `node scripts/classify.mjs`:
**irreversible**, floored by `scripts/lib/check-suite.js` — where this branch's diff is **35 insertions and 0
deletions**, one `EXCLUDED` entry and nothing else.

**The standing caveat applies unchanged.** This PASS means the checks ran and are green, recorded by the
author, single model family. `irreversible` asks for 2-of-3 multi-judge across ≥2 model families and that is
not met. Accepted risk, exit condition 2026-11-17.
