# Agent Architecture

*The roster specification. Supersedes `AGENT-ARCHITECTURE-REDIVE.md` (the plan), the roster half of
`2026-08-13-rethink-board.md` (the findings), and the 2026-08-14 15:15 draft of this file (written
before three of the fourteen hostile critiques had returned). Written 2026-08-14 from a
fourteen-specialist board with twenty-eight hostile critics, plus direct re-measurement of every
load-bearing claim in this document.*

Every number below was produced by a command run against this repo or against
`~/.claude/projects` (2,383 subagent records, 57 projects) during the writing of this document. No
claim is carried from the dossier unverified; where a specialist's number did not reproduce, the
reproduced number is used and the discrepancy is noted.

---

## 0. Read this first: what the runtime actually reads

One measurement decides more of this document than any argument in it.

An agent file elsewhere on this machine declares, in one frontmatter block:

```yaml
# /Users/adamks/VibeCoding/etsyc/.claude/agents/impeccable-finish-reviewer.md:5-7
model: inherit
effort: high
maxTurns: 12
```

Joining its recorded runs (`agent-*.meta.json` → sibling `.jsonl`):

| Declared | What the runtime did | Verdict |
|---|---|---|
| `effort: high` | every run executed at `effort: high` — **overriding the global `effortLevel: xhigh`** in `~/.claude/settings.json` | **BINDS** |
| `maxTurns: 12` | runs of 47, 36, 36, **633**, 42, 37, 46 assistant turns | **DOES NOT BIND** |

Two fields, one file, one runtime. One is a real capability dial. The other is decoration this repo
has been reasoning about as if it were a safety property.

**This corrects the brief.** The board was told `reviewer`'s `maxTurns: 20` truncated ten of
fourteen finders. It did not. `reviewer.md:7` declares 20; across 269 recorded `reviewer` runs the
median is 27 turns and the longest is 68 — the cap never fires. Half of all subagent runs exceed 30,
the hard ceiling `schema-lint.js:285` imposes on the entire roster. **Raising a number nothing reads
would have fixed nothing**, and every recommendation in the dossier that turns on a turn cap is
corrected below.

### The binding table

| Surface | Binds? | Evidence (re-run 2026-08-14) |
|---|---|---|
| `tools:` — **subtraction** | **YES, behaviourally, in every observable case.** `framer` (no `Bash`): 3 runs, 30 tool calls, **0 Bash**. `sourcer` (no `Bash`): 7 runs, 284 tool calls, **0 Bash**. `reviewer` (no `Write`/`Edit`): 269 runs, 4,373 tool calls, **0 Write, 0 Edit**. | tool_use census over all `agent-*.jsonl` |
| `tools:` — **addition** | **NO.** The runtime augments: reviewer, granted 4 tools, called `StructuredOutput` 259 times. The declaration is not the tool set. | same census |
| `effort:` | **YES.** `low\|medium\|high\|xhigh\|max`. `max` is real — 95 recorded turns. | model×effort census |
| `skills:` | **YES, and this is the arrival channel the board nearly missed.** Skill bodies are injected as `isMeta` user messages *before the first turn*: **288 of 431** subagent transcripts in this session carry `<skill-format>`. | `grep -l '<skill-format>'` |
| `mcpServers:` | **YES — and this refutes A4's central claim.** `adamos/.claude/agents/archivist.md` declares `mcpServers: [mem0]` and made mem0 calls in **12** runs. `evalove/.claude/agents/design-critic.md` declares `mcpServers: [playwright, refero]` and made playwright calls in **6**. Neither lists any `mcp__*` name in `tools:`. Neither project's `.mcp.json` names the server used — both resolved from **user scope**. | per-agent MCP census |
| `model:` | **Default only on the `Agent` path** — overridden in 637 of 1,133 calls, always by alias (`opus`/`sonnet`/`fable`/`haiku`), never by pinned ID. **Governs absolutely on the workflow path** — see below. | `Agent` input census |
| `isolation: worktree` | **YES, at dispatch.** 22 calls carried it; 62 meta records carry `worktreePath`. This is git, not a prompt. | same census |
| `maxTurns:` | **NO.** | above |
| `return_contract:` | **NO.** `schema-lint.js:353` checks the key exists. Nothing validates a return against it. | `grep -rn return_contract scripts/ .claude/workflows/` → 0 |

### The pin governs where it matters most, and it costs a capability rung

The previous draft said the frontmatter `model:` pin "never governed." That was measured on the
wrong channel and is wrong. On the workflow channel:

> **269 of 269 `reviewer` runs executed `claude-sonnet-4-6` at `effort: high`** — dispatched with no
> `model` option, inside runs whose manifest default was `claude-opus-5[1m]`. The pin beat the
> workflow default every single time.

And machine-wide, across every assistant turn on this machine:

```
claude-opus-5    xhigh  46,975      claude-opus-4-8  high   12,506
claude-sonnet-5  xhigh  42,501      claude-fable-5   xhigh   9,548
claude-sonnet-4-6 high  23,404      claude-opus-4-8  xhigh   3,460
claude-sonnet-4-6 xhigh      0      claude-opus-4-7  xhigh   1,556
```

`claude-sonnet-4-6` — pinned in all five producing/reviewing engines — has **23,404 turns and not
one at `xhigh`**, while four other models including two of the same generation reach it. **Stated
confound:** in this corpus sonnet-4-6 is produced *only* by these pins, so "the model is clamped"
and "the pinned engines are clamped" are the same population and cannot be separated here. Either
way the consequence is identical and it is not a stale label — **it is a silent one-rung capability
downgrade on the agent doing the deepest work in the system.**

### Two dispatch surfaces, and the asymmetry the whole design turns on

The complete measured parameter surface of the `Agent` tool, over all 1,133 calls on this machine:

```
description (1133) · prompt (1133) · subagent_type (1127) · name (684) · model (637) · isolation (22)
```

No `tools`. No `effort`. No `maxTurns`. No `schema`. **`Task` was called zero times** — the dispatch
tool is `Agent`; `Task` is a name in prose (`orchestrator.md:6`, `.claude/entry/ceo.md:6-11`,
`board-meeting.md:25`) that no runtime accepts. `TeamCreate` and `TeamDelete`: zero.

A richer option set — `{model, effort, isolation, agentType, disallowedTools, bashCommandClamp,
schema}` — exists in the installed CLI (2.1.232, verified by `strings`: `bashCommandClamp` 18
occurrences, `disallowedTools` 55) but **only on the workflow-scripting surface** (`agent()` inside
`.claude/workflows/*.js`). Per-call `effort` is real there and has been exercised: 95 turns at
`effort: max` exist on this machine, and 62 of them came from a single workflow dispatch.

> **That asymmetry is the most important topology fact in this document.** A per-call tool narrowing,
> a per-call effort, and an enforced return schema are available on one surface and unavailable on
> the other. §2 is built on it.

### The one thing that can refuse a call, and what it cannot see

`.claude/hooks/pre-tool-use.sh` is the only mechanism in this repo that can stop an action. Its
payload parse (`:67-90`) extracts exactly three values: `tool_name`, `tool_input.command`,
`tool_input.file_path`. **There is no agent identity in the payload, anywhere.**

Consequence, and it is load-bearing: **no per-agent hook rule is buildable today.** The dossier
proposed eleven of them across five specialists — a scribe path allowlist, a per-agent bash clamp,
a finder write-denial, a reviewer bash allowlist, an arbiter message-queue carve-out, a
loopback-only browser rule. Every one requires a predicate the hook cannot evaluate. All are cut.
Where a boundary in §1 says *unenforced*, that is why.

The coverage is also asymmetric. Reproduced by me, `CLAUDE_PROJECT_DIR` pinned to the repo:

```
Write /Users/adamks/.claude/settings.json                    → exit 2   BLOCKED
echo "{}" > /Users/adamks/.claude/settings.json   (via Bash) → exit 0   ALLOWED
mcp__playwright__browser_navigate  (external host)           → exit 0   ALLOWED
```

The project-root containment walk lives inside the `Edit|Write|NotebookEdit` arm (`:237`). The
`Bash` arm (`:115`) has no path rule at all, and the `*)` arm (`:333`, `# Unknown tool — allow`) is
every `mcp__*` call. **Any agent holding `Bash` can write anywhere on the filesystem.** That is the
true state of "read-only," and no roster fixes it — only a sandbox does (§7 step 3).

### Admissibility

- **Cost is inadmissible.** Every dollar figure in the dossier — `$553/day`, `$15/ticket`
  (`.claude/workflows/README.md:24`), `$3/meeting` (`board-meeting.md:3`) — is struck.
- **Admissible scarcity, in order:** rate-limit headroom in the rolling 5h window; wall-clock;
  context. Every model and fan-out decision below is argued from one of those three, or from
  correctness.
- **The model generation is Claude 5.** `schema-lint.js:97` still pins the 4.x set, which is why the
  migration's step 0 is a linter edit and not a roster edit.
- **Nesting is not blocked.** `spawnDepth` across 2,383 records: `{0: 585, 1: 1,744, 2: 49, 3: 5}`.
  Depth-2 and depth-3 have already happened 54 times. §2 argues depth on blast radius and
  observability, never on permission — and reaches a different answer than the dossier expected.

---

## 1. The roster

### The number: five. Two subtractions, no additions.

```
Today:     orchestrator · framer · sourcer · builder · designer · reviewer   + 11 shims  = 17 files
Proposed:  orchestrator · sourcer · builder · designer* · reviewer          + 0 shims   =  5 files
                                              *conditional — see 1.5; four if the condition fails
```

**`framer` is cut. The 11 shims are cut. `judge` — proposed by A1, A8 and by this document's own
previous draft — is also cut, on a measurement taken while writing this section.** Nothing is added.
The four survivors are re-specified on fields the runtime reads, not re-conceived.

### The test, and its second conjunct

> **The container test.** A role earns its own agent file only if **(a)** at least one of these
> differs *and the runtime reads the field that expresses it* — **capability** (a tool it holds or
> is denied), **isolation** (a filesystem or context boundary the dispatcher sets), or
> **provenance** (who spawned it changes whether its output can be trusted) — **and (b) something
> dispatches it.**

Conjunct (b) is new and it is doing real work, because A1's hostile critic showed (a) alone is
insufficient: capability difference is *manufacturable*. Withhold one tool and you have minted an
agent; the test as A1 wrote it admits any N. Reachability is what stops that, and it is the criterion
this repo has already been rewarded for applying — `reviewer.md:3` records five reviewers collapsing
into one because they "differed only in which lens they carried."

`effort` and `skills` are now *also* container-forming (both bind, measured), which strengthens the
case for **fewer** agents, not more: a lens can arrive as an injected skill payload, which is a
mechanism rather than a sentence.

### Why `framer` is cut — and the dissent, stated

**The dissent first, because it is correct on the narrow point.** A1's feasibility critic argued
that framer *passes* clause (a): its distinguishing property is the denial of `Bash`, subtraction
demonstrably binds (3 runs, 30 tool calls, zero Bash), and the denial lands inside the one tool
surface `pre-tool-use.sh` actually matches. By clause (a) alone, framer is a container and designer
is not. That reading is right and the previous draft was wrong to claim framer fails on capability.

**It fails on (b), and on redundancy.** `grep -h 'engine:' .claude/playbooks/*.yml` returns
`builder×4, sourcer×4, designer×2` — **framer 0**, across all six playbooks. The `ship-feature.yml`
`frame` stage that would summon it carries lenses and exit criteria and no `dispatch:` block at all.
It has been dispatched **3 times** in the entire recorded history of this machine. And its output —
a written spec — is an artifact `builder` already produces and the orchestrator already frames. A
container whose only distinction is a boundary against a threat that has never materialised, which
nothing dispatches, and whose product two other containers already make, is a lens.

Framing survives as a **lens the orchestrator loads** (`product`, `business` — `lenses.yml:84`
widens `applies_to: [framer]` to `[orchestrator, builder]`) and as a **written artifact builder
produces**.

### Why `judge` is cut — the measurement that changed this document

A1, A8 and this file's previous draft all proposed a `judge` agent: the container whose defining
property is provenance, whose verdict binds, identity-disjoint from every producer. Reading
`.claude/workflows/qa.js` line by line kills it:

```js
:151  const blockEligible = (sev) => sev === 'P1' || (TIER === 'irreversible' && sev === 'P2')
:157  let eligible = rawFindings.filter(f => blockEligible(f.severity))   // ONLY these are verified
:211  const mustBlock = confirmed.filter(f => f.severity === 'P1' || (TIER === 'irreversible' && f.severity === 'P2'))
:212  if (mustBlock.length) { finalVerdict = 'BLOCK'; ... }
```

Only block-eligible findings are ever verified, so `confirmed ⊆ eligible`; `mustBlock` then applies
**the identical predicate** to `confirmed`. `mustBlock ≡ confirmed`, unconditionally. Add the
critical-coverage-gap override at `:202-208` and the arithmetic is:

> **The verdict is already deterministic.** If any finding is confirmed → BLOCK, in plain JS. If a
> critical dimension failed → BLOCK, in plain JS. Otherwise the judge prompt (`:116`) instructs
> "Otherwise PASS." **The LLM judge cannot grant a pass the rule denies.** Its only discretionary
> power is to add a BLOCK the rule did not require. Its net contribution is the `summary` string.

So the judge is not a missing container; it is a summary writer standing next to a computed verdict.
Adding an agent file for it is the ceremony this repo names as its worst failure mode. **What is
real is the containment defect underneath it:** `qa.js` passes **no `agentType`** at any of its four
dispatch sites (`:122`, `:132`, `:179`, `:199` all pass only `{label, phase, model, schema}`), so
every reviewer *and* the judge currently run as default general-purpose agents **holding `Write` and
`Edit` on the diff they are judging.** The fix is four words, not a file (§7 step 2).

### What else was rejected, and why

Twenty-six further agents were proposed across the dossier. All cut. Named so nobody re-proposes
them.

| Proposed | Cut because |
|---|---|
| `judge` | The verdict is already deterministic — `mustBlock ≡ confirmed` (above). The container adds a summary writer. |
| `prover` (run the software) | No application exists here (`package.json` is `gsa-startup-kit`, a template installer; zero dependencies; no `src/`). Running the artifact is builder's job under the `evidence` lens — builder holds `Bash` and a worktree. Both critics also noted `prover` duplicates `designer`'s stated perception loop. |
| `shipper` (merge + deploy) | Deploy has no stage, no script, no config (`grep -rn deploy .claude/` → 3 prose hits). Its one real content is a hook rule: `gh pr merge` should be a hard block, not `softwarn` (`pre-tool-use.sh:230-233`). A rule, not an agent. |
| `integrator` (merge N branches) | Measured: only **62 of 2,383** spawns carry `worktreePath` (2.6%), only 11 sessions ever produced a branch-bearing child, only 6 produced more than three, and 36 of 36 PRs are single-branch. Parallel-build integration has effectively never happened. It is a brief on builder with a merged scope. |
| `visual-referee` | Splitting reviewer by tool grant is structurally sound reasoning, but designer has 0 dispatches and there is no rendered surface in this repo to referee. Revisit only after 1.5's condition is met. |
| `finder` | This is `Explore`, a runtime built-in dispatched 147 times in the workflow channel alone. Naming it adds a rival, not a definition. |
| `operator` (MCP reach) | Refuted by both its critics: it grants MCP through the same field it declares non-load-bearing, and duplicates designer's browser grant and sourcer's outside-reads mandate in the same document. |
| `warden` + `breaker` | `warden`'s whole boundary is unbuildable (no agent identity in the hook). `breaker` is `scripts/pre-tool-use.test.mjs` — it exists, runs in `npm run check`, and I reproduced three of the board's containment measurements with it in one shell loop. |
| `steward` + `auditor` | `steward` is granted no write yet its purpose is "record a disposition," and no clock in this repo can launch an agent (`.github/workflows/ledger-sweep.yml` runs `node` on a runner with no Claude session). `auditor`'s subject is a corpus a shipped collector should index. |
| `scribe` | Its own proposed barrier (promote the DECISIONS.md non-append softwarn to `block`) blocks its own central job, because every `Edit` carries a non-empty `old_string`. And `Supersedes:` already exists, written unprompted in-run, at `DECISIONS.md:287`. |
| `arbiter` (decision routing) | Its single permitted write is `~/.<project>/messages/`, outside the project root — **measured exit 2, BLOCKED** by the hook it cites as its enforcement model. It also cannot self-dispatch, so the party it exists to check decides whether it runs. |
| `refuter` | It is the verifier `qa.js:131-140` already spawns three of. Its four real deltas are edits inside that function (§5 M2). |
| `counter-judge` / `second-opinion` | Both are the second model family, wearing an agent's costume. Model family is a property of the executor, not of a roster slot; specifying it as a Claude agent is a fig leaf its own author named. This is founder decision 3, not an agent. |
| `advisor` (mid-turn consult) | Its stated value is a fresh context reachable without ending the turn — which is a property of *nesting*, not of a new file, and `Explore` already provides it (147 dispatches in the workflow channel alone). Its structured-return contract is also unenforceable on the `Agent` path, which accepts no `schema`. |
| `design-director` (N blind variations) | Its own author recommended not building it: `.claude/workflows/design.js` already implements the fan-out-and-judge shape and has been invoked **zero** times, while `qa` ran 8 and `coding` 5. A mechanism that exists and is never used argues for deletion, not respecification. |
| `contrarian`, `red-team`, `devil's-advocate`, `metric-watcher`, `sre`, `incident-commander`, `postmortem-writer`, `librarian`, `capability-probe` | Assigned-posture disagreement is uncorrelated with defects; the rest are scripts, or jobs with no recorded instance. |

**Net: 17 agent files → 5.** Zero added.

> **Superseded as a statement of current state — kept as the record of what this analysis concluded.**
> The roster is **7 engines out of 18 files** as of 2026-08-16 (`ls .claude/agents/*.md` → 18; `ENGINES` at
> `.claude/hooks/schema-lint.js:59` → 7). Two were added after this analysis, each by an explicit decision
> rather than by drift: `reviewer-readonly` landed in #47 under a capability-only exception (the binding QA
> gate needs a judge with no shell), and `framer` was **kept** by founder decision on 2026-08-16 — it is the
> only engine carrying the `business`, `customer`, `growth` and `product` lenses, and `product` names framer
> and nothing else, so retiring it would have orphaned that lens outright.
> The eleven shims are not engines and are not deletable: deleting one silently hands its name to a drifted
> copy in `~/.claude/agents/`, with no error reported.

---

### Enforcement primitives, named once

Every *Enforced by* cell below references these. This is the complete set of things in this system
that can stop or catch an action.

| id | Mechanism | Posture | Verified |
|---|---|---|---|
| **E1** | `tools:` grant | **Subtracts** (framer/sourcer 0 Bash; reviewer 0 Write/Edit across 4,373 calls). **Does not bind `Bash`.** Runtime augments with coordination tools. Whether it *refuses* or merely *fails to offer* is `c-read-only-binding-unverified` — waived to 2026-09-08, still unprobed. | tool census; `schema-lint.js:54-61` states the limit itself |
| **E2** | `.claude/hooks/pre-tool-use.sh` | **BLOCKS** (`exit 2`). Writes outside project root, `.env` writes, existing-migration edits, ~15 shell patterns. **No agent identity → no per-agent rule.** Blind to `Bash` paths and to all `mcp__*`. | reproduced live, above |
| **E3** | `.claude/hooks/schema-lint.js` | **BLOCKS CI** on declaration shape. A lint over a declaration, never a binding. | `ci.yml:53` |
| **E4** | Branch protection on `main` | Required contexts `Deterministic checks`, `Verify QA Lead PASS`. `enforce_admins: false`. | `gh api .../branches/main/protection` |
| **E5** | `isolation: worktree` at dispatch | **Real.** git, not prose. 22 calls, 62 `worktreePath` records. | `Agent` input census |
| **E6** | Caller-side dropout check | **Real and shipped.** `qa.js:120-127` (2 attempts → typed coverage gap), `qa.js:199-200` (judge dropout → auto-BLOCK), `coding.js:61-67` (positional null → refuse to QA a partial diff). The only mechanism that can catch a *terminated* process, because a terminated process files nothing. | read |
| **E7** | OS sandbox | **Available, configured nowhere.** CLI 2.1.232 carries `sandbox.enabled`, `sandbox.filesystem.{disabled,denyRead,denyWrite}`, `sandbox.network.{deniedDomains,allowedDomains,allowManagedDomainsOnly,allowAllUnixSockets}`, `autoAllowBashIfSandboxed`, `failIfUnavailable`, `permissions.disableBypassPermissionsMode`. `grep -c '"sandbox"'` → **0** in both `.claude/settings.json` and `~/.claude/settings.json`. **The only real containment upgrade available.** | `strings` on the binary + grep |
| **E8** | Workflow-surface narrowing | `disallowedTools` and `bashCommandClamp` on `agent()` — a per-call tool denial the `Agent` tool cannot express, which throws at spawn if the clamp can bind nothing. **Real in the binary, used zero times in this repo.** | `strings`; `grep -rn bashCommandClamp .claude/` → 0 |

One standing caveat on E1–E4: `bin/warroom:235,237` (and two more copies at
`war-room/bin/PROJECT_NAME.tmpl:184,186` and `…tmpl.bak.1780299079:187,189`) launch every pane with
`--dangerously-skip-permissions`, so the 20 allow / 6 deny entries in `.claude/settings.json` are
inert during normal operation. Hooks still fire — proven, this read-only board agent was refused a
`wget` mid-run. **Every boundary in this roster must therefore live in E1, E2, E5, E6, E7 or E8.
Never in the allow-list.**

---

### 1.1 `orchestrator` — the session, not a spawn target

| | |
|---|---|
| **Purpose** | Hold run state and the human boundary. The only context that ends a turn on founder approval, and the only holder of `Agent`. |
| **Owns** | Name the outcome; refuse an unroutable request. Pick the playbook. **Open the job file before dispatch** (§3). Decompose into units and set `isolation: worktree` per unit. Dispatch depth-1. Verify every return against the branch, the file or the artifact — never against the return's own summary. Stop at every `gate:`. Write the session file and emit the claims a stage's exit requires. Carry the `product` and `business` lenses — this is where framing went. |
| **Model** | `claude-opus-5` |
| **Effort** | `xhigh`. It decides what every other agent does; depth here multiplies across the run. Not `max`: `max` costs rate-limit headroom, the first scarce resource, and there is no binding single call here to protect. |
| **Tools** | `Read, Write, Edit, Bash, Glob, Grep, Agent` — **`Task` deleted** (0 calls in 1,133 dispatches). |
| **Skills** | `multi-agent-patterns`, `writing-plans`, `context-compression` — unchanged, and now known to arrive as injected payload rather than as a pointer. |
| **Boundary** | May write `docs/08-agents_work/**`, `.claude/memory/**`, `docs/**`. May **not** write source, `.claude/agents/**`, `.claude/hooks/**`, `.github/workflows/**`. May not merge. May not override a gate verdict. |
| **Enforced by** | **E2** for the hard floor — nothing outside the project root, no `.env`, no existing-migration edits. **The project-scoped half is unenforced**, because E2 cannot tell orchestrator from builder. **E4** at the git edge: `.claude/agents/**`, `.claude/hooks/**` and `.claude/settings.json` are `tier: irreversible, enforcement: block` in `qa-tier-floor.yml:70-88`, so a write that escapes in-session cannot land unlabelled. **Honest gap: in-session, the orchestrator is bounded by instruction.** |
| **Turn budget** | **None declared.** `maxTurns` is deleted from the schema (§0). The bound is **E6** — the run is bounded by artifacts, and a dispatch with no return is a hard failure at the call site. |
| **At exhaustion** | Every job file it opened stays at a non-terminal `state` with a committed `checkpoint`. **Loud because absence is the signal:** success requires a positive artifact, so returning nothing cannot read as success. Caveat, stated: CI fires on `pull_request`/`push` to `main` only, so a run that dies before a PR exists triggers no check at all (§3). |
| **Decides alone** | Anything `scripts/classify.mjs` rates `trivial` or `lite`. Decomposition. Which playbook. Which engine gets a unit. |
| **Escalates** | To **founder**: any `irreversible` classification; any `gate:` stage; a gate BLOCK it disagrees with — escalate, never route around. To nobody else: it is the root. |
| **Why not a lens** | It holds `Agent` and it is the only context that ends a turn on a human. Both are permission facts. **Stated honestly: 1 spawn in 2,383 records** — it is the top-level session, not a subagent, so its `tools:` line has bound almost nothing to date. This file is the session's operating instructions, and it is what `.claude/entry/ceo.md` should have been. |

### 1.2 `builder` — the only producing container with filesystem isolation

| | |
|---|---|
| **Purpose** | Produce one artifact in an isolated worktree and return exactly what landed, with the command that verified it. |
| **Owns** | Code, schema, migrations, tests, docs, copy — one unit, one worktree. **Run the thing** and report the real exit code. Integrate N sibling branches when briefed with a merged scope (same procedure, different input — not a new agent). Commit a `checkpoint` before any turn that could be its last. Return BLOCKED rather than making an architectural decision the brief did not make. |
| **Model** | `claude-opus-5` — **founder instruction**, and independently correct: `builder.md:5` pins `claude-sonnet-4-6`, the one model in this corpus that never reaches `xhigh` (0 of 23,404 turns). |
| **Effort** | `xhigh`. Note the constraint the dossier repeatedly assumed away: **per-dispatch effort does not exist on the `Agent` path** (0 of 1,133 calls), so "xhigh when the tier is irreversible" is unwritable. Effort is one static value per agent file unless the dispatch goes through a workflow script. |
| **Tools** | `Read, Write, Edit, Bash, Glob, Grep` (unchanged) |
| **Skills** | `api-design-principles`, `error-handling-patterns`, **`tdd` (added)** — this is where "prove the falsifier goes red" lives, instead of a `prover` agent. |
| **Boundary** | Writes only inside the worktree its brief names, only within the `files:` fence the job file declares. Never `main`, never another unit's worktree, never `.claude/agents/**`. |
| **Enforced by** | **E5** — `isolation: worktree` at dispatch, which is git and is real. **E2** for the destructive half, which is genuinely strong: existing-migration edits, `--no-verify`, force-push to main, `git clean -fdx`, `git checkout .`, interpreter-based deletion and writes outside the project root all `exit 2` today. **E4** for the merge. **Honest gap:** the `files:` fence is unenforced in-session (E2 has no per-agent predicate) and is checked only at the git edge (§3). |
| **Turn budget** | None declared. Bound by **E6** plus the mandatory checkpoint commit. |
| **At exhaustion** | The last committed `checkpoint` is the resume point; the job file stays at `state: building`. This survives `rm -rf` of the worktree, because the checkpoint is a commit on the branch and `bin/warroom:429-431` deliberately keeps branches when it removes worktrees. |
| **Decides alone** | Implementation. Structure within the fence. Which test proves the change. |
| **Escalates** | An architectural decision the brief did not make. A change that would exceed the `files:` fence. Three failed attempts on one failure. A dependency unit not yet at `state: built`. |
| **Why not a lens** | `isolation: worktree` is a real, inspectable, dispatcher-set boundary — the only one in the roster. |

### 1.3 `reviewer` — the deepest work in the roster, on its weakest settings

| | |
|---|---|
| **Purpose** | Read-only, out-of-band judgement of an artifact someone else produced, under named lenses. Finds; never fixes; never decides the merge. |
| **Owns** | Apply the lenses a stage names to a diff or artifact. Return findings with `file:line` and a reproduction. **Return a typed coverage gap rather than an empty findings array when it could not finish.** Declare its own model family, so a single-family pass is never read as an independent panel. |
| **Model** | `claude-opus-5`. **This is the single worst allocation in the current repo and it is measured, not asserted:** 269 of 269 recorded runs executed `claude-sonnet-4-6` at `effort: high`, dispatched inside runs whose default was `claude-opus-5[1m]`. A reviewer weaker than the agents it judges is a rubber stamp. |
| **Effort** | `xhigh`. Reviewer is also the highest-fan-out agent (269 of 2,383 dispatches), which makes it the real rate-limit driver. **The answer to that is fan-out discipline — fewer, deeper reviewers — not a weaker model.** |
| **Tools** | `Read, Glob, Grep, Bash` (unchanged) |
| **Skills** | `security-audit`, `agent-evaluation` (unchanged) |
| **Boundary** | No `Write`, no `Edit`, ever. Does not decide a merge. |
| **Enforced by** | **E1**, and this is the roster's weakest cell, stated rather than dressed. The declaration is checked by **E3** (`schema-lint.js:62`, `READ_ONLY_ENGINES = ['reviewer']`, hard-fails a Write/Edit declaration) and the census shows **0 Write and 0 Edit calls across 269 runs and 4,373 tool calls**. But reviewer holds `Bash` — 2,185 of those calls, 50% of its tool use — and `Bash` is an unrestricted write channel (§0). **Read-only is asserted at the tool layer and unenforced underneath.** `Bash` is retained deliberately: a reviewer that cannot run `git diff` or the test suite cannot verify a correctness finding, and corpus-wide `Bash` (44,200) is the search tool, not `Glob` (217) and `Grep` (173). The honest close is **E7**, or **E8** at the workflow dispatch — not a hook rule, which cannot see who is calling. |
| **Turn budget** | None declared. **Delete `maxTurns: 20`** — the roster's lowest cap on its deepest job, and it does not fire. Bound by **E6**. |
| **At exhaustion** | Two attempts, then a typed coverage gap `{ok: false, dimension: <lens>}` — **already implemented, `qa.js:120-127`.** The caller converts a *critical*-dimension gap to a deterministic BLOCK (`:202-208`). **Note the hole this does not cover:** a non-critical gap does not block, and a block-eligible finding whose verifiers all dropped out is reported nowhere at all (§5 M3). |
| **Decides alone** | Severity. Whether a finding is in scope. Nothing about the merge. |
| **Escalates** | A severe finding outside the artifact. A lens the work needs is absent from `review-lenses.yml` — return BLOCKED rather than inventing criteria. A `scope: rendered-output` lens is named and it holds no capture tool — return BLOCKED, never substitute a source read. Three tool failures on one target. |
| **Why not a lens** | It **is** the lens-carrying engine, and that collapse was right. What is not a lens is the *subtraction* of `Write`/`Edit` — a lens is additive prose and cannot remove a capability. |

### 1.4 `sourcer` — the only container with network reach

| | |
|---|---|
| **Purpose** | Answer one bounded question against the outside world with sourced evidence, and answer "has this already been decided here?" against the repo's own record. |
| **Owns** | Bound the question or return a narrower one. Primary sources before general search. URL, access date and confidence on every finding. Name the gaps explicitly. Prior-art retrieval over `DECISIONS.md`, the ledger and the session files. |
| **Model** | `claude-opus-5` |
| **Effort** | `high`. Static, not conditional — per-call effort is unavailable on the `Agent` path (§0). If prior-art depth proves to need `xhigh`, that is a second agent file or a workflow dispatch, not a rule. |
| **Tools** | `Read, Glob, Grep, WebSearch, WebFetch` (unchanged) |
| **Skills** | `deep-research` (unchanged) |
| **Boundary** | Read-only over the repo. Network read only. **No `Bash`.** No repo write. |
| **Enforced by** | **E1, and here the grant is close to sufficient** — measured, 7 runs and 284 tool calls with **zero Bash**. Sourcer is the only agent in the roster with no shell, so there is no interpreter to assert around. This is the one read-only boundary whose enforcement story is not a hole. It is also why sourcer stays separate from reviewer rather than merging into one "finder": **an agent with full repo read plus unrestricted network egress is an exfiltration surface; an agent with repo read and `git` is not.** That is a containment argument, not a domain one, and it is the only reason the merge was rejected. |
| **Turn budget** | None declared. Measured: all 7 runs exceeded the declared `maxTurns: 25`. |
| **At exhaustion** | `status: PARTIAL` **with a non-empty `gaps` array required.** A return with `findings: []`, no gaps and no partial marker is refused by the caller — it is indistinguishable from "I looked and found nothing," which is the three-state failure `mission-control/server/collectors/empty.ts:19-33` was written to prevent. Copy that contract verbatim. |
| **Decides alone** | Which sources to consult. How to scope a sub-question, once. |
| **Escalates** | The question stays unbounded after one re-scoping. A primary source contradicts a live decision. Three fetch failures on one source. |
| **Why not a lens** | Network reach is a tool grant. A reviewer wearing a `research` lens still cannot fetch a page. |
| **Known defect it does not fix** | Sourcer cannot write, and a claim is emitted by writing a fenced ` ```claims ` block into a git-tracked file (`scripts/lib/claims.js:22-30`; `scripts/ledger.mjs:94-107` uses `git ls-files` and explicitly refuses a directory walk). So `claim(kind=external-fact, verified_by=source)` — the literal exit of `price-a-product.yml` and `research-question.yml`, the stages that dispatch sourcer — cannot be produced by the engine dispatched to produce it. Measured consequence: **31 ledger claims, exactly one `external-fact`, and it is `c-canary-unresolvable`, the deliberately-failing canary.** **Resolved by the orchestrator owning the stage exit, not by granting sourcer `Write`** (§3) — a stage's exit is evaluated by the dispatcher, and widening sourcer's grant trades its one clean boundary for a convenience. Sourcer's return gains a required `quote` field so the dispatcher can build a valid claim block from it; `sourcer.md`'s return contract currently omits it while its own prose demands a verbatim quote. |

### 1.5 `designer` — CONDITIONAL, with a stated expiry

| | |
|---|---|
| **Purpose** | Build a customer-facing surface and close the perception loop on it: render, look at the render, change, re-render. |
| **Owns** | Implement screens against a written design system. Capture rendered evidence at ≥2 widths × 4 states into a manifest carrying the git SHA it was captured against. Iterate on measured differences from stated rules, never impressions. Return BLOCKED naming the missing token family rather than inventing a design rule. |
| **Model** | `claude-opus-5` — founder instruction. |
| **Effort** | `xhigh`. The perception loop is the highest-iteration work in the roster; depth per call reduces render cycles, and wall-clock is the second scarce resource. |
| **Tools** | `Read, Write, Edit, Bash, Glob, Grep` — **unchanged.** The browser arrives through **`mcpServers: [playwright]`**, not through `mcp__*` entries in `tools:`. This corrects every browser proposal in the dossier: measured, `archivist` (`mcpServers: [mem0]`) made mem0 calls in 12 runs and `design-critic` (`mcpServers: [playwright, refero]`) made playwright calls in 6, and **neither lists a single `mcp__*` name in `tools:`**. |
| **Boundary** | Worktree-scoped writes (as builder). **Explicitly must not use `browser_evaluate` or `browser_run_code_unsafe`** — arbitrary in-page JS in a browser carrying live session cookies, and not hypothetical: 154 and 69 real calls respectively on this machine. Navigation should be loopback-only. |
| **Enforced by** | **E5** for writes. **The browser restrictions are unenforced and must be stated as such.** `.claude/settings.json` sets the PreToolUse matcher to `Bash\|Edit\|Write\|NotebookEdit`, so `mcp__*` calls reach the `*) # Unknown tool — allow` arm — I reproduced `mcp__playwright__browser_navigate` to an external host returning exit 0. **Widening the matcher does not fix it**: the hook has no `mcp__` case arm and no URL field in its parse, so it would fall through to the same allow. Egress belongs in **E7** (`sandbox.network.deniedDomains`); per-tool denial belongs in **E8** (`disallowedTools` at a workflow dispatch). Neither is configured. |
| **Turn budget** | None declared. **No baseline exists — designer has been dispatched zero times.** The first three runs are calibration and must be recorded before any number here is treated as anything but a guess. |
| **At exhaustion** | `status: PARTIAL` with the manifest produced so far. **`rendered_evidence: []` with `status: COMPLETE` must be refused by the caller**, and the manifest must carry the **git SHA** it was captured against — not an mtime, which git does not preserve and which the capturing agent controls. `designer.md:90` currently writes silent degradation into its own contract ("Return PARTIAL after three failed capture attempts, and say the evidence is source-only") — **that line is deleted** (§6). A failed capture is BLOCKED. |
| **Decides alone** | Anything the written design system already rules on. |
| **Escalates** | The design system has no rule for the decision. Capture fails three times — escalate; never fall back to a source read and label it as rendering. |
| **Why not a lens** | **Only because of the browser.** State it plainly: today `designer.md:6-11` is byte-identical to `builder.md:6-11` in every field the runtime reads — same six tools, same `maxTurns: 30`, same `isolation: worktree` — and it has 0 dispatches. It is builder with a different colour until it holds a capture tool. |
| **⚠ CONDITION** | **If the browser grant is not approved, `designer.md` is deleted and `craft`, `voice` and `accessibility` are retagged `scope: diff-only` in `review-lenses.yml` — in the same PR.** The grant is now cheap and evidenced: `playwright` is live at user scope in `~/.claude.json`; the only blocker is `mcpConfigured()` (`schema-lint.js:85-93`) checking for a repo `.mcp.json` that does not exist. **Caveat that must ship with it:** `mcpConfigured()` tests only that the file *exists*, so adding one flips the lint permissive for every agent at once. Keeping designer without the grant is the worst of the three options — three review lenses declare `scope: rendered-output` at `blocking_severities: [p1]` and no agent can satisfy them, so every design gate either deadlocks or passes on evidence nothing checked. |

---

## 2. The topology

### The measured shape

```
depth 0 ──── 585 records    the session (tmux pane / CLI). NOT an agent.
depth 1 ──── 1,744          the overwhelming majority of all work
depth 2 ──── 49             real, used, uneventful
depth 3 ──── 5              one observed chain: main → cto → qa-lead → adversary-engineer
```

Depth is settled and it was never a permission question. `.claude/entry/ceo.md:11` asserts *"RUNTIME
CONSTRAINT: subagents cannot spawn subagents (nested Task is blocked)"* and it is false. Worse,
three of the four tiers it defines dispatch verbs that have **never been called**: `Task` 0,
`TeamCreate` 0, `TeamDelete` 0 across every tool_use block on this machine. The two verbs that carry
all real coordination — `Agent` (1,133) and `SendMessage` (2,665, the 6th most-used tool overall) —
appear in no agent file, no playbook and no command.

**T1–T4 are deleted outright, not re-derived** (§6).

### Two dispatch surfaces

| | `Agent` tool (an agent spawns) | `agent()` in a workflow script |
|---|---|---|
| Settable per call | `description, subagent_type, prompt, model, name, isolation` | `model, effort, isolation, agentType, disallowedTools, bashCommandClamp, schema` |
| Structured return enforced | **No** | **Yes** — `schema:` is passed and validated by the runtime |
| Observed return discipline | reviewer 259/269 emitted `StructuredOutput` | `workflow-subagent` ≈ 99% |
| Can narrow a child's tools | **No** | **Yes** (E8) |
| Records `parentAgentId` | **Sometimes** — 141 of 981 non-workflow records | **Never** — 0 of 1,402 |
| Runs today in this repo | Everywhere | **`qa.js`: zero times.** Its 8 recorded invocations are all in one Beamix worktree |

### The rule — and it is simpler than the dossier expected

> **Depth 1, everywhere. Fan-out wider than three, and the QA gate specifically, go through a
> committed workflow script — which is still depth 1.**

Two measurements collapsed the depth-2 argument the previous draft made:

1. **Script-spawned agents are depth 1.** All 1,402 workflow-channel records carry `spawnDepth: 1`.
   The script runs in the session; its panel is depth 1. **Routing the gate through a script does
   not require depth 2 at all.**
2. **The independence check that justified depth 2 is unbuildable on that surface.** The previous
   draft argued: let the judge spawn the reviewers, then assert `parentAgentId` in CI. Measured:
   `parentAgentId` appears in **141 of 2,383** records (5.9%) and in **zero of the 1,402
   workflow-channel records**. The field the argument depends on is not written on the channel the
   gate runs on.

So depth 2 buys nothing the gate needs and is not recommended. It remains permitted — it has
happened 49 times without incident — but no mechanism in this design requires it, and "prefer
deletion" applies to topology too.

**Where independence actually comes from, then.** Three properties, all real, none needing a parent
edge:

- **The panel roster is committed code**, not a runtime decision by an interested party. `qa.js` is
  a file under **E4**; the party being reviewed cannot re-spawn reviewers until it likes the answer,
  because it does not choose them.
- **The finding arrives as data.** `qa.js:100` already `JSON.stringify`s the finding so a malicious
  finding string cannot inject instructions into the verifier.
- **The verdict is computed, not opined** (§1, §5 M4). Independence of the *judge* is moot, because
  the judge cannot grant a pass the rule denies.

**One caveat on "route it through a script," and it is sharp.** Of 41 recorded `Workflow`
invocations, **15 carried an inline `script`** — code the dispatching agent wrote at call time,
executing unreviewed, in no repository, seen by no linter. Only 15 named a committed repo workflow
(`qa` 8, `coding` 5, `research` 2). **The rule must therefore be: a committed `name:` or
`scriptPath:` under `.claude/workflows/`, never an inline `script`.** Otherwise "the script has no
judgement to drift" is false — the script is an agent's judgement, frozen ten seconds earlier.

### Who owns the gate

| Depth | Who acts | Who owns the gate |
|---|---|---|
| 0 | session / orchestrator | Cannot self-certify. Writes the session/job file; the gate must read something it did not author (§3). |
| 1 | builder, designer, sourcer | Produces. Never emits a verdict. |
| 1 (script) | `qa.js` | Owns the run: dispatches the panel, tallies quorum, **computes the verdict deterministically**. |
| 1 (script's children) | reviewer × N | Produce findings. Never a merge decision. |
| — | the deterministic override in `qa.js:202-217` | Emits the binding verdict. No model can overturn it. |

### Handoff

A handoff is a **brief with a required shape**, not a token count. `CLAUDE.md:172` states "Agent
handoffs: ≤ 500 tokens," enforced by nothing, and the measured worst case is a `framer` whose first
turn carried **170,096 cache-creation tokens against a 175,290-token lifetime peak — 97% of
everything it ever held arrived before it had read anything.** The `Explore` agents in the same run
arrived at ~34K and reached 190K–364K by *reading*.

The harm is not cost. **The harm is that a large brief consumes the receiving agent's capacity to
look**, and context is the third named scarce resource.

> **A brief may name files. It may not paste them.**
>
> Required: `outcome` · `falsifier` (how we know it worked) · `paths` (≤ 7 named, not pasted) ·
> `prior_decisions` (by id) · `return_contract` · `on_exhaustion`. A spawn-time check hard-fails a
> missing field and warns above ~8K tokens.

**And the per-agent arrival channel already exists and works.** `skills:` frontmatter is injected as
`isMeta` user messages before the first turn — **288 of 431** subagent transcripts in this session
carry `<skill-format>`. So a per-agent arrival block is a configuration change to a measured,
working channel. The `SessionStart` hook is the wrong hop: it fires once per session, a subagent is
not a session, and it delivers 24,490 bytes of lens/playbook text to the one context that needs it
least (§6).

### State survival

Everything that must survive a session dying is a **commit on the unit's branch**. Not
`~/.agentvibe/last.json` (written by exactly one code path, `cmd_kill`, which a crash bypasses; its
`task` and `session_id` fields are empty for all three recorded CEOs). Not `events.jsonl` (3,000+
events, **zero** job starts, because `ceo_spawn` is logged inside `spawn_ceo` and grid mode never
calls it). Git is the only crash-safe store already in the loop, and `bin/warroom:429-431`
deliberately keeps branches when it removes worktrees.

---

## 3. The job model

There is no job object today. A unit of work is four unlinked shadows: a prose brief inside an
`Agent` prompt (dies with the turn), a git branch, a `.worktrees/ceo-N.task` label (**all four files
are 1 byte — empty**), and a markdown session file written at *close*. None carries an id, a state,
a parent, a dependency or an acceptance test.

### The object

**The session file is promoted to the job file. There is no `.jobs/` directory.** One store, one
glob, one schema — and the store already exists, is already parsed by CI, and already has 38 real
instances. A parallel directory would be a fifth shadow.

```yaml
---
id: <branch-name>          # the id IS the branch. one job, one branch, one worktree.
date: 2026-08-14
role: builder
state: specifying | building | built | reviewing | closed | blocked | abandoned
parent: <job id or "">
tier: lite                 # `node scripts/classify.mjs <declared paths>` — a PREDICTED tier
acceptance:                # measurable exits: a claim, or a runnable command. never prose.
  - "criterion(login-flow-exercised, verified_by=command): npm run test:auth"
files: [ ... ]             # the fence. ≤ 7 paths or globs.
depends_on: []
checkpoint:                # rewritten before any turn that could be the last
  done: "..."
  next: "..."
  blocking: "..."
qa_verdict: PENDING        # written by the gate, NEVER by the acting agent
---
```

### Lifecycle

| Step | Who | Mechanism |
|---|---|---|
| **Specify** | orchestrator, carrying the `product`/`business` lens | Writes `acceptance` as resolvable claims or runnable commands. A job with an empty `acceptance` cannot merge. |
| **Open** | orchestrator, **before dispatch** | The single most important change. Today the only durable artifact is authored *after* the work, so a unit in flight has no on-disk record at all. |
| **Assign** | orchestrator | `Agent({subagent_type, prompt, isolation: 'worktree', model})`, with the brief shape from §2. |
| **Track** | the acting agent | `checkpoint` committed on the branch. Nothing in `~/.agentvibe/`. |
| **Resume** | orchestrator at session start | Read every branch's job file. Record exactly one disposition per non-terminal job: resume / reassign / abandon. |
| **Close** | **the gate, never the producer** | Below. |

### The closure defect, and the fix

`.github/workflows/qa-lead-pass.yml:89` locates the session file by **globbing all of main** for
`*-${TASK_SLUG}.md` (duplicated at `:315`), falling back to the PR diff only when the glob misses.
Then it greps `qa_verdict: PASS` — a string the orchestrating agent writes about its own work.
Measured across the whole history: **34 PASS, 2 PENDING, 2 N/A, and zero refusals on the substance
of a change** (39 files, one of which is `_TEMPLATE.md` and carries no verdict). Branch
`ceo-phase-8a` still exists and `main` still carries `2026-08-12-ceo-phase-8a.md` with
`qa_verdict: PASS`, so a new PR from that branch inherits a pass for different work without writing
anything.

**Fix, in order of leverage:**

1. **Delete the glob** (`:87-91` and `:313-317`). The PR-diff path beneath it already resolves the
   session file from *this PR's changed files* and already validates all of them; deleting four
   lines makes it unconditional. **Pure subtraction, closes the inheritance.**
2. **Require the job file whose `id` equals the branch to appear in this PR's diff.**
3. **Stop grepping a string the producer wrote.** Read `qa_verdict` from the structured return of
   `qa.js`, committed by the script. Producer-cannot-close then becomes a property of who wrote the
   file.

> **Rejected: keying producer≠closer on session identity.** Measured: a subagent's transcript
> carries the **parent's** `sessionId` (verified — a `reviewer` subagent's records show
> `isSidechain: true` with the parent session's id and a separate `agentId`). A builder and a
> reviewer dispatched from one orchestrator are the same session id by construction. And git carries
> no session identity: two author identities across the whole history, no session trailer in any
> commit body. A check built on that field passes nothing, fails everything, and then gets waived.

### Loud failure — and the gap in it

Exhaustion is loud because **absence is the signal**, not because an exhausted agent files a report.
A terminated process files nothing; only its caller can notice.

- **E6 at the call site.** A dispatch with no return is a hard failure. `coding.js:61-67` already
  does this positionally; `qa.js:120-127` does it per dimension. Copy it to every dispatch site.
- **E4 at the git edge.** `qa-lead-pass.yml` fails a PR containing a job file in a non-terminal
  state, with an empty `acceptance`, or whose diff touches paths outside the union of its `files:`
  fences. Use `git status --porcelain`, **not** `git diff --quiet` — the latter is blind to
  untracked files, which is exactly what a new artifact is.
- **The gap, stated rather than papered over:** CI fires on `pull_request` and `push` to `main`
  only. A run that dies before a PR exists triggers no check anywhere. The honest options are a
  scheduled sweep over branches (the `ledger-sweep.yml` shape) or accepting that pre-PR crashes are
  caught by the next session's resume step. **Do not claim this is covered when it is not.**

---

## 4. The decision system

### Where decisions live

This repo has two decision systems and uses the weaker one — but the previous draft's remedy
(migrate all 31 entries into the ADR template) was refuted while writing this section.

| | `.claude/memory/DECISIONS.md` | `docs/03-system-design/adr/` |
|---|---|---|
| Entries | **31** real, 46,655 bytes | **1** |
| `id` / `Status` / first-class supersession | none / none / 1 ad-hoc line (`:287`) | `_TEMPLATE.md:27` / `:30` / yes |
| `Deciders` | none | `_TEMPLATE.md:31` |
| Alternatives recorded | 20 of 31 | `_TEMPLATE.md:69` |
| **`Reversibility`** | **32 lines — 25 reversible, 4 hard-to-reverse** | **absent from the template** |
| **`Affects`** | **32 lines** | **absent from the template** |
| Resolvable by the ledger | **no** | **yes** — `ledger.mjs:157-176` `checkSupports()` resolves `supports: d-NNN` against `adr/NNN-*.md` |
| Only mechanism | a `softwarn` that prints and exits 0 (`pre-tool-use.sh:315-329`) | CI-resolvable |

**Do not migrate 31 entries.** The ADR template lacks the two fields `DECISIONS.md` populates most
consistently, and one of them — `Reversibility` — is the exact input the founder's autonomy rule
reads. Two shipped files also cite `DECISIONS.md` by date (`mission-control/server/projects.ts:3`,
`scripts/lib/usage.js:8`), and `scripts/gen-codebase-map.mjs:197` emits a row about it that
`npm run check:map` enforces. A wholesale migration is a large change that loses information and
breaks three consumers.

**Do this instead — three lines and one rule:**

- **Add `id:`, `Status: live | superseded`, `Supersedes:` to the `DECISIONS.md` format block.**
  `Supersedes:` already appears in the wild, written unprompted and append-safe, pointing *backward*
  from the new entry (`:287`). Codify what works. This makes "is this decision locked" — a predicate
  named in nine places (`framer.md:17,58,119`; `sourcer.md:16`; `designer.md:17,89`;
  `lenses.yml:33,44,89`) and implemented in none, with the word `locked` appearing as a status
  marker nowhere in 46 KB — a lookup.
- **ADRs are for decisions that need a ledger edge.** A decision a claim must cite via `supports:`
  gets promoted to an ADR. The other 30 do not need a 148-line template each.
- **If the founder prefers full migration anyway**, the ADR template must gain `Reversibility` and
  `Affects` rows *first*, in the same PR, and `gen-codebase-map.mjs:197` must be updated with it.
- **Delete `docs/07-history/DECISIONS.md`** (29 lines, template only, zero real entries) — and note
  `sessions/_TEMPLATE.md:29` currently points every agent at *that* file.
- **Delete the 50-entry cap.** Stated at `CLAUDE.md:122, :128, :169` and `DECISIONS.md:2`; enforced
  by nothing; its archive target `DECISIONS_ARCHIVE.md` has never existed in any revision. The
  record is 1.2% of a 1M window. An uncounted cap stated four times reads as a mechanism.
- **Retrieval is `grep -n '^## '`.** Do **not** generate an index: `docs/08-agents_work/INDEX.md` is
  the same idea, created in the initial commit, and is *still* the unfilled template after 39 session
  files and 35 PRs. That is this repo's measured rot rate for a hand-maintained index.

### The variable-autonomy line

The line is already drawn as validated data and read by nobody. `schema-lint.js:623` defines a
closed gate vocabulary; three playbooks declare `gate: founder-approval`
(`ship-feature.yml:57`, `price-a-product.yml:42`, `validate-a-market.yml:31`); and
`grep -rn founder-approval` across every hook, workflow, script and command returns **only those
three declarations, one prose sentence, and the vocabulary entry**. `qa-verdict` has a consumer that
blocks. `founder-approval` has none.

The founder has already stated the rule, in `LONG-TERM.md:30-31`: *"Sign-off is wanted where the
rule requires it, not everywhere. Irreversible-tier merges get a real decision; lite work is
expected to just proceed."* That maps exactly onto the one classifier that works.

> **The line is `scripts/lib/classifier.js`. One file computes risk, and it is the only
> implementation.**

| Tier | Who decides | Mechanism |
|---|---|---|
| **trivial / lite** | the agent, alone | Proceed. No gate. This is the default and it is meant to be. |
| **full** | orchestrator | May not self-certify: the gate reads a gate-produced artifact. |
| **irreversible** | **founder, always** | `.claude/agents/**`, `.claude/hooks/**`, `.github/workflows/**`, migrations — `enforcement: block`, backed by **E4**. |
| **A gate BLOCK** | **nobody** | Final against the orchestrator. The founder may file a logged, finding-by-finding false-positive appeal (`qa.js:116`) — never a blanket override. |

**Give `founder-approval` the consumer `qa-verdict` has**, or delete it from `GATES`. A stage
carrying it cannot be exited without a recorded founder response. Delete `migration-approval`
outright — declared, used by zero playbooks.

**Two paths must change tier immediately.** Verified by running `classify.mjs`:
`docs/03-system-design/adr/**` → `tier=lite · enforcement=shadow`; `.claude/agents/framer.md` →
`tier=irreversible · enforcement=block`; and **`.claude/workflows/qa.js` → `tier=lite · matched:
(none — default)`.** The file describing how decisions are made is gated more weakly than the
decisions, and **the binding QA gate's own source code is the least-protected file in the harness.**
Raise `.claude/workflows/**` to `irreversible` and the ADR directory to `full` — with the caveat the
tier map states about itself at `:48-49`: enforcement "only bites files that actually carry claims,"
so a raise is inert until those files carry claim blocks.

**The one genuine gap:** `qa-tier-floor.yml` classifies **paths**, and pricing, positioning, vendor
and roster decisions touch no path. That judgement has no owner. The dossier proposed an `arbiter`
for it; that agent is cut (its single permitted write is outside the project root and is blocked,
measured). This is a founder decision (§8), not a mechanism.

---

## 5. The thinking system

An instruction to "be critical" is not a mechanism. A mechanism fails something.

### The measured shape of sycophancy here

It is not a model disposition — it is an **unforced verdict**. Two verdict mechanisms exist over the
same kind of artifact:

1. **Self-graded.** An agent writes `qa_verdict: PASS` into its own session file; CI greps for the
   string. Result across all of history: **34 PASS, 0 refusals.** The workflow's own header names
   its promotion criterion as "the friction it adds is therefore zero."
2. **`qa.js`.** A separate population reads the artifact, a strict-majority quorum confirms
   findings, and the verdict is computed. Result where it ran: BLOCK, with substantive blocker ids.
   It has run **8 times, all in one Beamix worktree, zero times in agentvibe.**

The repo teaches, lints, documents and CI-tests the gate logic while never subjecting its own
changes to it.

### The five mechanisms

**M1 — The verdict must come from an artifact the acting agent did not author.**
Delete the glob (§3); read the `qa.js` structured return. *Fails:* a merge whose gate input was
self-written. **This is the single highest-leverage change in this document.**

**M2 — Equal evidentiary burden in both directions.**
`qa.js:92-94` runs three verifiers with divergent prompts: verifier 0 is told *"Default to
`is_real=false` unless the defect is unambiguous"*; verifier 2 is told *"Assume the finding is a
false positive."* Only verifier 1 is neutral. Confirmation then requires a **strict majority**
(`:137`). So a true P1 must convert at least one prompt-instructed refuter, while a false negative
requires no conversion at all. **The adversarial panel is biased toward suppressing findings —
sycophancy toward the diff, wearing adversarial clothes.**
*Fix:* one symmetric instruction for all three, and `is_real: false` must cite the specific guard or
mitigation with its `file:line` or it scores UNRESOLVED rather than as a refutation. *Fails:* a
refutation with no evidence.

**M3 — Coverage gaps block; they do not vanish. This is the sharpest defect in the repo.**
`qa.js:137` requires quorum ≥ 2 valid votes. With two of three verifiers dropped, `confirmed` is
false. The returned object (`:219-232`) exposes `verified` (a count), `confirmed` (a count) and
`advisory` — and `advisory` is built at `:154` **exclusively from non-block-eligible findings**. So
**a block-eligible P1 whose verifiers all dropped out appears in no list, produces no blocker, is not
a coverage gap, and never reaches the verdict at all.** The gate returns PASS having never measured
it. That is the repo's named defect class reappearing inside the machine built to prevent it.
*Fix (~6 lines):* add `unverified_eligible` and `votes_cast`/`required_quorum` to the return, and
make quorum failure on a block-eligible finding force BLOCK, exactly as a critical coverage gap
already does at `:202-208`. *Fails:* a PASS that never measured a block-eligible finding.

**M4 — The deterministic override, kept verbatim — and understood.**
`qa.js:211-217` forces BLOCK on any confirmed block-eligible finding even if the model emitted PASS;
`:202-208` forces BLOCK on a critical coverage gap; `:199-200` fails safe to BLOCK on judge dropout.
**Keep all three.** Understand what they mean: `mustBlock ≡ confirmed` (§1), so **the verdict is
already computed and no model can overturn it.** Two consequences:
 - Rename the returned fields so nobody believes otherwise: `verdict` (computed) and
   `judge_opinion` (advisory). The return already separates `verdict` from `judge_verdict`; finish
   the job by making dropout distinguishable from a real BLOCK — today both surface as `'BLOCK'`.
 - **Delete `.claude/workflows/lib/gate-logic.mjs` and its test.** Its `decideVerdict()` defaults
   `judgeVerdict = 'PASS'`, so a null verdict returns PASS — the *opposite* posture from the shipped
   inline copy in `qa.js`, which fails safe to BLOCK. `qa.js` cannot import it (the workflow sandbox
   has no module import) and mirrors it by hand with a "keep in sync" comment. **CI runs 23 green
   unit tests over a copy that never executes and that disagrees with the executing code on a
   safety-relevant default.** Delete the mirror; keep the inline code; collapse `blockEligible` and
   `mustBlock` into one named predicate so the identity is designed rather than incidental.

**M5 — Fresh context and data-shaped findings, which already ship.**
The finding arrives as `JSON.stringify` data, not as prose that could carry instructions
(`qa.js:100`, with the comment saying exactly that). The verifiers never see each other's votes. The
panel roster is committed code, not a runtime choice by the party being reviewed (§2). *Fails:* a
panel chosen by the party it checks. **Do not claim `parentAgentId`-based independence** — it is
absent from 100% of workflow-channel spawns (§2).

### What must be deleted rather than instructed

**`independent: true` + `model_families: [anthropic, openai]`** on the `security`, `adversarial` and
`evidence` lenses (`review-lenses.yml:44-45, 57-58, 83-84`). `scripts/lib/claims.js:425-430` defines
independence as ≥N *distinct model families* — "one family agreeing with itself is one opinion."
There is no OpenAI runtime, credential or SDK anywhere in this repo; `which codex` returns
not-found; `DECISIONS.md:505-506` already records that "every Full-tier review this repo has run was
missing it"; and every `judged_by` in the ledger is `[]`, so the guard at `claims.js:498` has never
once executed. **A declared property with no mechanism is worse than an absent one: it makes a
single-model pass read as a panel.** Either the founder provisions a second family (§8) or the flag
comes out — and running three instances of one model is explicitly *not* the answer, by the repo's
own definition.

### What is explicitly not a mechanism

- **A `contrarian` / `red-team` agent.** An agent instructed to disagree produces disagreement
  uncorrelated with defects. This repo already ran that experiment — six board personas with a
  stated success criterion of measuring Round-1 divergence — and the baseline was never produced.
- **More prose in the injection channel.** It already carries 24,490 bytes per session and 34 of 38
  recorded verdicts are PASS with not one refusal. Spend the channel on state, not exhortation.
- **A turn cap.** It does not fire (§0).

---

## 6. What gets deleted

**Lead item: the QA gate's slug glob. Four lines, and it closes the hole that produced 34 unopposed
passes.**

### Blocking-mechanism deletions — do these first

| Delete | Lines | Why |
|---|---|---|
| **`qa-lead-pass.yml:87-91` and its duplicate `:313-317`** | ~8 | Resolves a branch name against session files *already merged to main*. The PR-diff fallback beneath it already does the right thing. **Pure subtraction; closes self-certification inheritance.** |
| **`maxTurns` from all six engines + `schema-lint.js:71, 252, 285-287, 405-407`** | ~12 | Measured non-binding: declared 12 → ran 633; declared 20 → 269 runs, median 27. It is the 45th decorative field of its class, after 44 `mcpServers` declarations and 16 war-room `budget:` blocks this repo already deleted for exactly this reason. **A budget that does not bind is worse than none, because it gets believed** — this board was briefed on a failure it did not cause. |
| **`.claude/workflows/lib/gate-logic.mjs` + its test** | 143 | Never executes; `qa.js` mirrors it inline; and its `decideVerdict()` default (`judgeVerdict = 'PASS'`) is the opposite safety posture from the code that runs. CI is green about a divergent copy of a binding gate. |
| **`Task` from `orchestrator.md:6`** | 1 | 0 calls in 1,133 dispatches. The tool is `Agent`. Note the side effect: `schema-lint.js:342-345` keys its worker/c-suite classification on `Task`, so this edit must land with the classifier change. |

### Roster deletions

| Delete | Why |
|---|---|
| **All 11 shims** (`ceo, qa-lead, code-reviewer, security-engineer, design-lead, research-lead, researcher, ai-engineer, database-engineer, technical-writer, test-engineer`) and the shim branch of `schema-lint.js` (~`:220-258`) | **Order matters and the dossier disagreed about it.** The hazard is real: I verified all 11 names exist as drifted copies in `~/.claude/agents/` (44 files), and deleting a project shim un-shadows the older global — "a failure that keeps working is worse than one that stops." But the shims also *cause* a live hole: `schema-lint.js:252-255` forbids a shim from declaring `tools`, so a dispatched shim inherits the parent session's `Write` and `Edit` — and `audit.md:14` dispatches `code-reviewer` by that exact name. (Correction to the dossier: `review.md:16,22` are prose headings, not agent identifiers; only `audit.md` names a shim.) **Resolution: delete the 11 global copies first, then the 11 shims in the same change.** The other order hands eleven live names to drifted definitions. Founder action outside the repo (§8). |
| **`.claude/agents/framer.md`** | §1. 3 dispatches ever, 0 playbook dispatch entries, redundant output. |
| **`.claude/agents/designer.md`** — *conditionally* | If the browser grant is refused (§1.5), in the same PR as retagging three lenses `scope: diff-only`. |
| **The `judge` agent — do not create it** | §1. The verdict is already deterministic. |

### Command-surface deletions

8 of 13 commands carry no `playbook:` key and are restated pipeline prose dispatching roles
collapsed on 2026-08-11.

| Delete | Why |
|---|---|
| **`board-meeting.md`** | Spawns personas that exist in neither `.claude/agents/` nor `~/.claude/agents/`. Cites `docs/08-agents_work/INDEX.md` as its protocol — that file contains zero occurrences of "board." Its output directory does not exist. Its veto interlock needs Linear, Telegram and a Cloudflare bridge, configured nowhere. Caps priced in dollars. **Nothing in it survives.** Its one real need — structured dissent — is `reviewer` under the `adversarial` and `risk` lenses. |
| **`audit.md`** | Instructs an agent to hand-edit `.claude/memory/CODEBASE-MAP.md`, whose own header says "do not edit" and which `npm run check:map` fails on drift. Dispatches the `code-reviewer` shim. |
| **`review.md`, `plan.md`, `daily.md`, `debug.md`** | Restate pipelines in terms of `Code Reviewer`, `Security Engineer`, `CPO`, `CTO`, `Backend Developer`, `Database Engineer`, `Frontend Developer`, `Test Engineer` — none of which exist. Every use trains the founder on a roster deleted 2026-08-12. |

**Add exactly one:** `/decide`, pointing at a playbook that terminates in a recorded decision. The
walk `question → evidence → options → decision → record` has **no entry point** today: the two
playbooks containing a `decide` stage and a `record` stage are reachable from no command.

### Context and injection deletions

| Delete | Why |
|---|---|
| **The lens/playbook dump in `session-start.js:162-199`** (24,490 of 25,613 emitted bytes) | Wrong hop. `SessionStart` fires once per session; a subagent is not a session. It delivers to the context that needs it least, as a file pointer, and nothing to the tier doing the work. **Keep the ledger-sweep half (`:121-160`)** — that genuinely belongs to a session. The per-agent channel already exists and works: `skills:` injection, 288/431 measured. |
| **`.claude/entry/ceo.md:6-11`** (T1–T4) and the duplicate at `war-room/bin/PROJECT_NAME.tmpl:57-62` | Three of four tiers dispatch verbs never called; the fourth routes around a constraint that does not exist. Replace with two sentences: the orchestrator dispatches depth-1 via `Agent`; the gate and any fan-out > 3 go through a committed workflow script. The rest of this 32-line file names 22 agents of which 13 resolve nowhere and 0 are engines, and orders a `MANIFEST.json` read that `CLAUDE.md:47-51` forbids the equivalent of. |
| **`CLAUDE.md`: `## The Team` (:10-31), `Models (May 2026)` (:132-141), `Cost Optimization` (:178-185), `Layer Contract` (:188-215), the worker colour table (:270-287)** — ~120 of 313 lines | The **highest-fidelity injection channel in the system** — auto-loaded on every top-level session — and the most-wrong artifact in the repo. It opens with the 26-agent roster deleted 2026-08-11, which `AGENTS.md:115` declares superseded *in the same auto-loaded context*. Its Cost Optimization section is inadmissible and is the last place teaching the downgrade-for-cost habit that put `claude-sonnet-4-6` on the reviewer. **Nothing replaces it — `AGENTS.md` already holds the roster.** |
| **`.claude/skills/routers/`** + `scripts/build-skill-routers.mjs` + its CI check | Two-tier discovery exists to save ~15,000 tokens per lookup — inadmissible as cost, marginal as context (1.2% of a 1M window). **Do not delete the 134 skills** — injection is the measured arrival channel and `Skill` tool calls (77) measure the wrong thing. Inline the namespace table into the arrival block; put the library on a falsifiable expiry (§8). |

### Dead-code deletions

| Delete | Lines | Why |
|---|---|---|
| **`.claude/workflows/coding.js`, `design.js`, `research.js`** | ~400 | `coding.js:54` defaults to `agentType: 'backend-engineer'`; `design.js:87,94` use `product-designer` and `design-critic`; `research.js:121,134` use `researcher` (a shim). Five names, none of which exists here. Nothing validates workflow `agentType` strings: `schema-lint.js:38` walks only `.claude/agents/`, and `check-registration.mjs:210` scans only `.claude/commands/` against a frozen 12-name denylist. **Harvest one thing first: the `{id, agentType, brief, files}` slice shape** — it is the job object, already written. |
| **`.claude/workflows/qa.js` — KEEP** | 232 | The only working anti-sycophancy mechanism in the repo. Make it reachable (§7 step 2) and fix M3. |
| **`.claude/workflows/design-screen.md`** | ~470 | References `product-designer`, `design-critic`, `design-polisher` — all deleted. `:53` states the false nesting premise. Outside every checker's coverage. |
| **`war-room/dashboard/`** | 2,575 | Superseded by `mission-control/`; `db.ts` creates tables with zero INSERTs; `bin/install-war-room.sh:96` still `cp -R`s it into every install. |
| **`war-room/bin/PROJECT_NAME.tmpl.bak.1780299079`** | — | A third live copy of the launcher carrying `--dangerously-skip-permissions` (`:187,189`), covered by no check. A backup that reintroduces what is being removed. |
| **`.claude/settings.json.proposed`** | — | Its `_NOTE` invites replacement of the live file, and adopting it removes `PreToolUse` — the only `exit 2` mechanism — plus the Stop hooks and `session-start.js`. It also strips `Bash(python3 *)`, which `pre-tool-use.sh:67-90` **depends on** for its structural parse; the hook blocks when that parse fails. **A stale proposal that would break the mechanism it proposes to harden.** |
| **`.claude/hooks/gsa-context-monitor.js`** | 7.4 KB | **Corrected rationale — the previous draft had this wrong.** It does *not* skip subagents: `:53` keys its metrics file on `sessionId`, subagents share the parent's `sessionId`, and both `claude-ctx-<session>.json` and a `-warned.json` exist on disk for this session. It therefore **reports the top-level pane's context pressure to subagents whose own context is unrelated** — misattribution, not absence. Its one action, `tmux send-keys '/compact'`, still needs a pane no subagent has. Delete it; replace with a `context_exhausted` field in the return contract, which the caller can act on. |
| **`.claude/hooks/budget-guard.js`** and its tests | — | Unregistered by founder decision. Do **not** re-arm — and note that four dossier specialists proposed re-arming it under new names (a window watchdog, a stall ceiling, a job-count cap); all are cut. It is now load-bearing as *data*: `mission-control/server/collectors/events.ts:26-38` reads `AGENTVIBE_WINDOW_BLOCK`/`AGENTVIBE_STALL_BLOCK` out of its source text. Inline those two constants into the collector, then delete the file so a `POSTURE: BLOCKS` hook is not sitting one settings line from returning. |
| **`docs/08-agents_work/INDEX.md`** | — | One commit (the initial one); still the unfilled template after 39 session files and 35 PRs. `board-meeting.md` cites it as a spec. |
| **`docs/08-agents_work/sessions/_TEMPLATE.md`** | — | Prescribes Duration / Status / a Files Changed table that **zero** of the 38 real session files use, and points decisions at `docs/07-history/DECISIONS.md`. The frontmatter is the real schema. |
| **`.claude/memory/USER-INSIGHTS.md`** | — | Body reads "Empty." Its declared authors are "CMO + CPO," both deleted 2026-08-11. `scripts/gen-codebase-map.mjs:199` hard-codes the assertion that it is empty *without reading it*, and `npm run check:map` enforces that assertion — so even after research populates the file, CI enforces that it is empty. Delete the file, the authorship line and the hard-coded sentence together. |

### Declaration deletions

- **`independent: true` + `model_families: [anthropic, openai]`** on three lenses (§5) — unless a
  second family is provisioned.
- **`migration-approval`** from `GATES` (`schema-lint.js:623`) — declared, used by zero playbooks.
- **`judgment`, `user-language`, `preference` claim kinds** — zero instances each across 31 claims
  (verified: `{external-fact: 1, behavior: 15, internal-fact: 13, runtime-capability: 2}`). Either
  bind `judgment` to the decision record so an unrevisited decision expires like a claim, or delete
  all three.
- **The `isCSuite` branch** at `schema-lint.js:404-408` — a linter still reasoning about a taxonomy
  Phase 4b deleted is how the taxonomy comes back.
- **`return_contract:` from frontmatter** — six existence-only declarations imitating the JSON
  schemas the workflow layer actually enforces. Either pass a real `schema` at the dispatch site or
  stop claiming a contract.

### Rough totals

**Deleted:** 11 shims + 1 engine + 5 commands + ~1,000 lines of unreachable workflow code + a
143-line unit-tested mirror of a binding gate + ~120 lines of `CLAUDE.md` + 24,490 bytes of
misdirected injection + 2 hooks + 1 dashboard + the router layer + one decorative frontmatter field
across six files and five linter sites.
**Added:** 1 command (`/decide`), 1 mission-control collector, ~6 lines in `qa.js`, and four words.
**No new agents.**

---

## 7. Migration path

Each step names its tier from `scripts/classify.mjs`. `.claude/hooks/**`, `.claude/agents/**`,
`.claude/settings.json` and `.github/workflows/**` are all `tier: irreversible, enforcement: block`,
so most of this needs the `risk:irreversible` label and founder sign-off. That is the correct shape,
not an obstacle.

### Step 0 — the linter, alone, first — `irreversible`

Nothing else can land before this. Five edits to `.claude/hooks/schema-lint.js`:

1. `:97` — `VALID_MODELS` → `['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5',
   'claude-fable-5', 'inherit']`. Without this every agent file below fails CI. (`inherit` is a real
   value in use on this machine.)
2. `:71, :252, :285-287, :405-407` — remove `maxTurns` from `REQUIRED_FRONTMATTER`; delete both
   range checks.
3. Add `effort` to the validated frontmatter with the ladder `low|medium|high|xhigh|max`. **It binds
   — this is the one new field in this document that is not decoration, and it is the only one.**
4. `:50` — `ENGINES` loses `framer`. `:62` — `READ_ONLY_ENGINES` gains `sourcer`.
5. `:342-345` — the worker/c-suite classifier keys on `Task`; re-key it on `Agent` or delete the
   branch, or removing `Task` from `orchestrator.md` silently reclassifies the orchestrator as a
   worker and trips a different rule set.

*Verify:* `npm run check` exits 0 with the current agents untouched.

### Step 1 — the gate's input — `irreversible`

Delete `qa-lead-pass.yml:87-91` and `:313-317`. The PR-diff path becomes unconditional.
**Largest single correctness win in the migration, and it is a subtraction.**
*Verify:* re-run the gate against a branch whose slug matches an already-merged session file. It
must now fail rather than inherit a pass.

### Step 2 — make the working gate reachable and honest — `full`

- Four words in `.claude/workflows/qa.js`: `agentType: 'reviewer'` at `:122`, `:132`, `:179`, `:199`.
  **Highest-leverage containment change in the document** — today every reviewer and the judge run
  as default agents holding `Write` and `Edit` on the diff they are judging.
- The ~6-line M3 fix: `unverified_eligible` + `votes_cast` in the return; quorum failure on a
  block-eligible finding forces BLOCK.
- The M2 fix: one symmetric verifier instruction; an unevidenced `is_real: false` scores UNRESOLVED.
- Rename `judge_verdict` → `judge_opinion`; make dropout distinguishable from a real BLOCK.
- Name the invocation at `ship-feature.yml`'s `gate: qa-verdict` stage. Note: `Workflow` is invoked
  by the **session**, not by a subagent — all 41 recorded calls are top-level — so this needs a line
  in the orchestrator's operating instructions, not a tool grant on a spawned agent.
- Raise `.claude/workflows/**` to `tier: irreversible` in `qa-tier-floor.yml`.

*Verify:* one real `qa.js` run on one agentvibe PR. Confirm the resulting `agent-*.meta.json` files
carry `agentType: reviewer`.

### Step 3 — the sandbox — `irreversible`, founder decision required

Configure `sandbox` in `.claude/settings.json`: `sandbox.enabled`, `filesystem.denyWrite` for
everything outside the project root plus `~/.ssh`, `~/.aws`, `~/.claude/`;
`network.deniedDomains` with a loopback carve-out; `autoAllowBashIfSandboxed`; and — first, not last
— **`failIfUnavailable: true`**, so a host where the sandbox will not start refuses to run rather
than reporting containment it does not have.

**This is the only step that closes the `Bash`-writes-anywhere hole.** It is also the precondition
for dropping `--dangerously-skip-permissions` from `bin/warroom:235,237` and the two template
copies: dropping the flag first restores a permission prompt on every call and it will be back
within a week. **Order: sandbox → drop the flag → `permissions.disableBypassPermissionsMode` to make
the removal stick.**

*Verify:* re-run the three-payload probe from §0. `echo "{}" > ~/.claude/settings.json` must now exit
non-zero.

### Step 4 — the roster — `irreversible`

Five agent files: `orchestrator` (drop `Task`, add `Agent`, add the `product`/`business` lens),
`builder`, `reviewer`, `sourcer` re-specified per §1; `designer` per §1.5 or deleted; `framer.md`
deleted; `lenses.yml:84` `applies_to` widened.
*Verify:* `npm run check` exits 0. `node scripts/check-registration.mjs` exits 0.

### Step 5 — the global fleet, then the shims — `irreversible`, founder action outside the repo

Delete or rename the 11 colliding files in `~/.claude/agents/` (verified: exactly the 11 shim names
collide, out of 44 global files). **Then** delete the 11 project shims and the shim branch of
`schema-lint.js`, in the same change. **Never the other order.**
*Verify:* `comm -12 <(ls .claude/agents/) <(ls ~/.claude/agents/)` is empty.

### Step 6 — commands and injection — `lite`

Delete `board-meeting.md`, `audit.md`, `review.md`, `plan.md`, `daily.md`, `debug.md`. Add
`/decide`. Delete the lens dump from `session-start.js:162-199`, `.claude/entry/ceo.md:6-11`, and
~120 lines of `CLAUDE.md`.
*Verify:* `node scripts/check-registration.mjs` exits 0 with fewer warnings than before.

### Step 7 — the job model — `full`

Job-file frontmatter (§3), opened at dispatch. `check-jobs.mjs` in CI: fails on a non-terminal job
file, an empty `acceptance`, or a diff outside the union of `files:` fences — using
`git status --porcelain`. Caller-side dropout checks (**E6**) at every dispatch site.
*Verify:* open a job, kill the session mid-run, start a new one; the checkpoint commit must be on the
branch and the resume step must list the job as stalled.

### Step 8 — observability — `lite`

One mission-control collector over the 2,383 `agent-*.meta.json` files (310 KB; ~30 ms) reading
`{agentType, spawnDepth, model, worktreePath, worktreeCleanlyRemoved}`, and `parentAgentId` where
present. Today `mission-control/server/` and `client/src/` contain **zero** references to any of
those fields, so `SessionsView` counts subagents as sessions and inflates the session count ~17×.
*Verify:* the Sessions view stops counting subagents as sessions; the fleet view can attribute
output to an engine.

### Step 9 — decisions — `full`

Three lines in the `DECISIONS.md` format block (`id`, `Status`, `Supersedes`). Delete
`docs/07-history/DECISIONS.md`, the 50-entry cap in four places, and the `softwarn` arm. Raise the
ADR directory's tier. Give `founder-approval` a consumer or delete it from `GATES`.

### Step 10 — validate — `lite`, and this is the real gate on all of it

**Run one real venture task through the harness.** All 39 session files cover harness
infrastructure; the system has never priced, launched, designed or shipped anything for a customer.
Every finding in this document is measurement of what the *runtime* does plus static analysis of
what the *repo* declares. **One real `/build` would price the difference between the defects traced
here and the ones that actually bite.**

---

## 8. Open decisions for the founder

Only the ones evidence cannot settle.

1. **Does the sandbox get turned on?** (Step 3.) It is the only layer that binds `Bash`, and every
   containment claim in §1 is honest about depending on it. The cost is not tokens: it is wall-clock
   and a false-positive tax on legitimate work that nobody has measured.
   **Sub-decision:** `permissions.disableBypassPermissionsMode` is the one line that makes flag
   removal stick — and it binds your interactive sessions, not just agents'.

2. **Does `designer` get the browser?** The mechanism is now evidenced rather than guessed:
   `mcpServers: [playwright]` in frontmatter, plus a repo `.mcp.json` to satisfy `mcpConfigured()`.
   Two sibling projects on this machine do exactly this and their agents make real playwright and
   mem0 calls. **If no, `designer.md` is deleted the same day and `craft`/`voice`/`accessibility`
   are retagged `scope: diff-only`.** Leaving it as-is is the only indefensible option. Two
   sequencing hazards ship with a yes: `mcp__*` calls reach the hook's allow arm, so the grant lands
   outside every guard until Step 3; and `mcpConfigured()` tests only that `.mcp.json` exists, so
   adding it flips the lint permissive for every agent at once.

3. **Second model family, or delete the independence claim?** Three review lenses and every
   `risk: high` judged claim require ≥2 families; `judged_by` is `[]` on all four judge claims;
   `codex` is not installed. Under a Claude-only subscription the predicate is *unsatisfiable*, not
   merely unsatisfied. The one admissible argument *for* a second vendor is rate-limit: a non-Claude
   call consumes zero headroom in the rolling 5h window. Against: a second key, a second failure
   mode, a data-egress decision. **If no, `independent: true` comes out of three lenses in the same
   change.**

   **CLOSED 2026-08-23:** the founder accepted single-family review for harness self-edits as an
   ACCEPTED RISK, not a satisfied requirement — see
   [2026-08-23-after-p0.md §6](../08-agents_work/handoffs/2026-08-23-after-p0.md) and
   [MODEL-DIVERSITY.md](MODEL-DIVERSITY.md). Its stale half: this item's premise ("three review
   lenses ... require ≥2 families") no longer holds for `security`, `adversarial` and `evidence` —
   they now declare `independence: provenance` — the `security`, `adversarial` and `evidence` entries
   in `.claude/review-lenses.yml`, cited by lens id rather than line number on purpose: an earlier
   draft of this very sentence cited `:65,79,106` and was rotted by a header edit to that file in the
   same commit. A lens id does not move when the file above it does. This routes
   AWAY from the ≥2-family predicate at `.claude/hooks/schema-lint.js:1472`. That predicate was not
   deleted: it still governs `independence: vendor` lenses and every `risk: high` claim panel via
   `independenceIssue()` in `scripts/lib/claims.js`.

4. **May the 44 files in `~/.claude/agents/` be deleted or renamed?** Precondition for deleting the
   11 shims (Step 5); costs zero repo files. `check-registration.mjs` measured the blast radius: the
   globals are live in 2 of 16 projects under `~/VibeCoding`, both of which can pin their own copies.
   If no, the shims stay and `check-registration.mjs` must **fail** rather than warn on all 44 names.

5. **Who classifies a decision that touches no path?** The tier map is path-shaped; pricing,
   positioning, vendor and roster decisions are not. Options: (a) the orchestrator classifies and
   you accept it; (b) every non-path decision escalates by default; (c) it stays informal. I
   recommend (b) with a named exception list, and I am not confident.

6. **Does a decision expire?** The resurface chain already works and is the one ADVISORY→ENFORCED
   promotion that succeeded: `valid_until` → `ledger sweep` → `session-start.js:150-159` → forced
   Refresh/Deprecate/Waive. It has never carried anything but harness self-assertions. Putting an
   expiry on a business decision means the sweep will one day interrupt a session to demand a
   disposition on a pricing choice. **Related and unavoidable:** 26 of 31 claims share
   `valid_until: 2026-11-09`. Stagger them now (weakening "expiry is a real deadline") or take a
   26-item triage day.

7. **Is the 134-skill library kept on faith or put on an expiry?** `Skill` was invoked 77 times
   corpus-wide against 44,200 `Bash` calls — but skills are delivered by **injection**, not by tool
   call, and 288 of 431 subagents received theirs. The tool count measures the wrong thing and the
   library may be working invisibly. A claim with `valid_until` settles it; keeping it unexamined
   does not.

8. **Does the war room stay?** `bin/warroom` (104 KB) launches N independent top-level `claude`
   processes with their own file-based message bus. It is a *third* topology alongside `Agent` and
   `Workflow`; it records no `parentAgentId` and no `spawnDepth`, so it is the least observable of
   the three — but it is the only one that survives a single session dying. Only you can say whether
   parallel CEO panes are a product feature or an artifact of the phantom nesting block.

9. **Is this repo a template or an instance?** `package.json` is `gsa-startup-kit` with a `files:`
   array that ships `.claude/agents/`, `commands/`, `hooks/` and `settings.json` to npm — but not
   `playbooks/`, `lenses.yml`, `review-lenses.yml`, `workflows/` or `skills/`. If this roster must
   survive `npx gsa-startup-kit`, the agents arrive at a fresh install with most of what they depend
   on missing.

---

## 9. What this board could not establish

An honest gap is worth more than a confident guess.

**`c-read-only-binding-unverified` is still unprobed.** The `tools:` field *subtracts* — measured
decisively (framer 0 Bash / 30 calls; sourcer 0 Bash / 284; reviewer 0 Write+Edit / 4,373). But
whether the runtime **refuses** a write or merely **fails to offer** the tool has never been tested,
and the distinction is the whole boundary. The claim is waived to 2026-09-08 and its stated reason
("the probe needs subagent spawning, which is disabled in these sessions") rests on a premise the
plan's §1.3 retired. **The probe is runnable today and takes ten minutes.**
`scripts/probe-readonly-engine.sh` is the right harness and is deliberately incapable of returning
PASS — two outcomes, FAIL and UNRESOLVED — so a positive result needs a different instrument.

**Nobody knows what actually stops a run.** `maxTurns` does not bind (measured). No runtime record
in the corpus carries a turn-limit stop reason. So an agent that stops has stopped for a reason this
repo cannot name — and every `on_exhaustion` contract in §1 is designed against an unmeasured cause.
The one honest datum: P2's census found the ten reviewer runs that returned no `StructuredOutput`
were the *longest* runs (43–68 turns, all above p90), and their final transcript record is a
`tool_result` with no assistant turn after it — cut off mid-loop, not concluded. **A cut-off agent
files nothing, which is why every remedy in this document is caller-side (E6).**

**The `claude-sonnet-4-6` effort clamp is correlational.** 23,404 turns, zero at `xhigh`. But in this
corpus that model is produced *only* by the frontmatter pins, so "the model cannot reach xhigh" and
"the pinned engines never reach xhigh" are the same population. Two same-generation models
(`opus-4-7`, `opus-4-8`) *do* reach `xhigh`, which weakens but does not eliminate the confound. **One
spawn of an unpinned engine settles it.** The recommendation does not depend on which is true.

**`parentAgentId` is unavailable where it was needed.** 141 of 2,383 records (5.9%), and **zero of
1,402 workflow-channel records**. The previous draft's depth-2 independence check was built on it.
It is unbuildable on the surface the gate runs on, and §2 was rewritten accordingly.

**The rolling-5h window length is a vendor fact nobody here has verified.**
`c-rolling-five-hour-window` is waived for exactly that reason. `scripts/lib/usage.js` measures
*output tokens* — a proxy for headroom, not headroom. Every rate-limit argument in this document is
reasoning over a proxy against an unknown limit.

**Whether a repo-scope `.mcp.json` is required, or only the frontmatter, is untested here.** Two
sibling agents on this machine made real MCP calls with `mcpServers:` frontmatter naming servers
their own project `.mcp.json` does **not** list (`adamos` has `[miro]`, its archivist used mem0;
`evalove` has `[supabase]`, its design-critic used playwright), which suggests user-scope resolution
and that `.mcp.json` matters only to the lint. **One `.mcp.json` and one spawn settles it in this
repo.** A4's central claim — "declaring `tools:` removes all MCP tools" — was refuted by its own
critics using those cases, and is not carried forward.

**The 30-day retention claim about `claude-fable-5` is unverified.** It appears throughout the
dossier as the argument against fable for the deepest calls. I could not confirm it from any source
in this repo or on this machine, so no recommendation here depends on it.

**Per-call `effort` was assumed by five proposals and exists on only one surface.** It binds in
frontmatter (decisive). It exists in the workflow `agent()` opts and has been exercised (95 `max`
turns on this machine, 62 from one dispatch). It appears in **zero** of 1,133 `Agent` tool calls.
Every conditional effort assignment in the dossier — "xhigh when the tier is irreversible" — is
therefore unwritable on the roster's normal dispatch path, and each is stated here as a single
static value instead.

**The one anti-sycophancy mechanism that works has never run here.** `qa.js`: 8 invocations, all in
one Beamix worktree, zero in agentvibe. Every claim in §5 about its behaviour is a claim about code
read, not about runs observed in this repo.

**No venture work has ever run through this harness.** All 39 session files cover harness
infrastructure. Of the six current engines, `builder`, `designer` and `orchestrator` have **0, 0 and
1** recorded dispatches respectively; the second-most-dispatched agent type on this machine is
`workflow-subagent` (682), a built-in that no agent file describes. **Every process finding in the
dossier — the ship-feature walk, the landing-page walk, the GTM walk, the research walk — traced
files rather than running the playbook.** This roster is derived from measurement of what the
runtime does and static analysis of what the repo declares. It is not validated against one real
customer-facing task, and Step 10 exists because it should be.

**Two things the previous draft of this file got wrong, corrected here so they are not inherited:**
the `model:` pin *does* govern (269 of 269 reviewer runs), and `gsa-context-monitor.js` *does* fire
for subagents (it misattributes rather than skips). Both were caught by critiques that arrived after
that draft was written.

---

*Every claim in this document is a file:line, a command run while writing it, or a labelled gap.
Where the board's specialists disagreed, the disagreement is presented rather than averaged — see
§1 (framer's container status, the judge, the sourcer/reviewer merge), §2 (depth-2), §4 (ADR
migration), §6 (shim ordering) and §9.*
