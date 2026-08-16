# Handoff: implement the seven-agent system

**From:** ceo, session `ceo-2-1786445435` · **To:** the next session · **Date:** 2026-08-15 · **Priority:** High

Three boards and nineteen agents produced the specification. **Your job is to build it.** Everything below is
decided unless marked open. You may dispatch subagents, research, measure, decide — and you may **grill the
founder**: ask hard questions, push back, refuse a bad instruction with a reason. That is wanted, not tolerated.

**Read in this order.** Do not start from the code.

| # | File | What it settles |
|---|---|---|
| 1 | [ROSTER-SIZE.md](../../03-system-design/ROSTER-SIZE.md) | The roster is **seven**, and the runtime asymmetry that forces the number |
| 2 | [agents/CONTROL-PLANE.md](../../03-system-design/agents/CONTROL-PLANE.md) | `orchestrator` · `reviewer` |
| 3 | [agents/PRODUCERS.md](../../03-system-design/agents/PRODUCERS.md) | `builder` · `designer`, worktrees, isolation |
| 4 | [agents/GRANT-HOLDERS.md](../../03-system-design/agents/GRANT-HOLDERS.md) | `sourcer` · `instrument` · `operator`, credentials, scheduled work |
| 5 | [agents/DESIGNER.md](../../03-system-design/agents/DESIGNER.md) | Supersedes PRODUCERS on designer. The `design/` process |
| 6 | [agents/SKILLS.md](../../03-system-design/agents/SKILLS.md) | 6–8 skills per agent, the builder's two-layer index |
| 7 | [agents/CAPABILITY.md](../../03-system-design/agents/CAPABILITY.md) | MCP grants, and the out-of-depth escalation ladder |
| 8 | [ORCHESTRATION.md](../../03-system-design/ORCHESTRATION.md) | Eight environments, authority, the entry prompt |
| 9 | [TOKEN-EFFICIENCY.md](../../03-system-design/TOKEN-EFFICIENCY.md) | Where tokens actually go — 95.2% is re-read prefix |
| 10 | [MODEL-DIVERSITY.md](../../03-system-design/MODEL-DIVERSITY.md) | Why not to buy a second vendor |
| 11 | [AGENT-ARCHITECTURE.md](../../03-system-design/AGENT-ARCHITECTURE.md) | The first board. **Wrong on the number**, right on nearly everything else |

---

## THE GATE: prompt craft before any agent file is touched

**Founder instruction, and it blocks the roster migration entirely.**

> Before we delete the agent files and before we create the new agents and system prompts, do a deep dive on
> how we write and structure and actually write the prompts for the agents — best practices, the words we
> decide to use, the length, the usage, explaining, structuring — to make sure the agents are the highest
> quality possible.

**Nothing under `.claude/agents/` may be created, rewritten or deleted until a written prompt standard exists
and the founder has approved it.** The specs say *what* each agent is. They do not say *how an agent file
should be written*, and that is now known to be load-bearing: a stale `model:` line silently clamped `effort`
across 269 runs, a declared skill that restricts tools can strip an agent's grant at runtime, and 15 of 26
agent files once failed their own validator.

What the deep dive must produce, as a document plus a linted standard:

- **Structure.** What belongs in frontmatter, in the file body, in an injected skill, in `CLAUDE.md`, and at
  the dispatch site. These are five different channels with different binding force — the repo has measured
  which bind and which do not, and the standard must respect that rather than restate it.
- **Length.** With evidence. The corpus (~2,532 transcripts) can show what actually gets attended to. Do not
  assert a number.
- **Word choice.** Which constructions produce behaviour and which produce agreement. `MODEL-DIVERSITY.md`
  carries the sharpest datum available: framing alone moved defect detection from 97.2% to 3.6%.
- **Anti-sycophancy, mechanically.** Not "be critical" — the repo has learned that class of instruction binds
  nothing.
- **What must never appear:** a capability the runtime does not grant, a tool that does not exist, a
  constraint that is false (the current entry prompt asserts subagents cannot spawn subagents; they can), a
  restated pipeline a playbook already owns.
- **How the standard is enforced.** `schema-lint.js` already checks agent files. A standard with no linter
  rule is a wish; this repo has a rule numbered and marked ADVISORY for exactly that reason.
- **Evidence sources:** the installed binary's own schema strings (they settled the `allowed-tools` question),
  the transcript corpus, Anthropic's published guidance, and the external packs already assessed in
  `DESIGNER.md` §6 — BMAD's persona files, Spec Kit, Agent OS, superpowers, anthropics/skills.

Then apply it: rewrite the seven, delete the rest, in the order in the migration sections of the specs.

---

## Current state — updated 2026-08-16

**#42 and #43 are MERGED.** The safety floor, the three gate fixes and the eleven specification documents are
on `main`.

**PR #47 `fix/gate-routing-and-probe` is open and deliberately red.** It carries handoff items 1-4 plus six
founder decisions. `npm run check` exits 0; `Verify QA Lead PASS` fails because `qa_verdict: PENDING`, which
is honest — see below.

**The binding gate ran for the first time in its existence, three times, and BLOCKED every time.** It earned
it. Across those runs it found, in the CEO's own work: a **CWE-22 path traversal** that read files outside
`.claude/skills/` and echoed their contents into fork-visible CI logs; a **symlink bypass of the fix for
that**; a 135-line script shipped with **zero tests**; an unasserted **tier boundary** that would have
silently un-gated every `full` PR; and a **false premise** repeated in three files. Every one reproduced by
hand before being accepted.

**Then the third run's judge dropped out, and diagnosing that produced the session's largest finding.**

### `maxTurns` binds, and this repo believed it did not

Tool-call count separates the two populations perfectly where turns, context and wall-clock all overlapped:
agents making ≤17 calls returned findings, agents reaching 20 returned nothing, and **13 of 20 dropouts sat at
exactly 20** — the `maxTurns` on the reviewer containers.

**The CEO caused it** by adding `agentType` at the four `qa.js` dispatch sites. `general-purpose` declares no
cap, which is why the eight historical runs completed. This **refutes the recorded claim** that *"`maxTurns`
does not bind — 196 of 269 runs exceeded a cap of 20"*: that was measured where no agent file was named. It
binds hard the moment a dispatch names an `agentType`.

**Consequence for you: any dispatch naming an `agentType` inherits that agent's `maxTurns`.** Check it before
you blame the runtime, and read the run journal before trusting any multi-agent result.

### What changed on this branch beyond items 1-4

| Change | Note |
|---|---|
| `--dangerously-skip-permissions` removed from `bin/warroom` | Six allow entries added, chosen from 11,342 measured Bash calls. Pinned so restoring the flag fails CI |
| F13 requires the tier on **one** session file, not all | It was a second implementation of risk and disagreed with `classifier.js`. `CLAUDE.md:156` corrected |
| `reviewer-readonly` created | The binding judge has no shell; evidence-gatherers keep `Bash` because they must run `git diff` |
| `designer` granted `playwright` | Per-server MCP allowlist landed in the same commit — `mcpConfigured()` was a boolean that would have opened MCP to every agent at once |
| Browser policy | **Open web allowed**, local network refused. Founder overruled a localhost-only proposal; agents already hold WebSearch/WebFetch, so blocking the browser closes nothing and costs research |
| `maxTurns` 20 → 30 on reviewers, judge gains retry | Above |

- Two known flakes are not yours: a mission-control cold-start performance test and a `crosscheck.test.ts`
  mtime assertion.

**Still open and needing the founder:** the `qa_verdict` on #47 (the gate cannot bless it — its judge is
subject to the same dropout), and whether `operator`/`instrument` wait for the OS sandbox (recorded in
`DECISIONS.md` as: ship five, defer two).

## What was done

- **The safety floor was rebuilt.** `pre-tool-use.sh` parsed `tool_name` with a line-oriented `awk` field
  split over JSON; on the real compact payload every rule was skipped, so **the hook blocked nothing**.
  Replaced with a structural parse that fails closed. 49 tests, red-first, every dangerous case through both
  payload encodings.
- **Three hooks unregistered, none deleted.** Two `Stop` hooks that used relative paths and broke from any
  subdirectory, and `gsa-context-monitor.js`, which ran after every tool call and typed `/compact` into the
  founder's pane on its own initiative.
- **Three gate fixes** — see `sessions/2026-08-15-ceo-gate-fixes.md`. The gate's record was 34 PASS and 0
  refusals; all three causes are removed.
- **Eleven specification and research documents.**

## What remains, in the order I would do it

**1 — Under an hour, and it makes everything already committed actually fire.**
- `qa.js` passes **no `agentType`** at any of its four dispatch sites, so every reviewer and the binding judge
  run as `general-purpose` agents **holding `Write` and `Edit` on the diff they are judging**. Four words.
- **`run-gate.mjs`, ~30 lines.** `qa.js` is reachable and has run 8 times, but nothing routes to it, so the
  merge gate greps a self-written string instead of running the real gate.

**2 — Half a day, needs no decisions.**
- **The `stop_reason` probe.** Add `message.stop_reason` to `turnsFrom()` in `scripts/lib/usage.js`, reindex
  the corpus, cross-tabulate against runs that returned nothing. `maxTurns` does not bind and stop reasons are
  recorded nowhere, so **nobody knows what stops a run** — a defect that hit three times in the sessions that
  produced these specs.

**3 — Dead declarations and broken skills.** `maxTurns` in all six agent files; `Task` in `orchestrator.md`;
the duplicated `DIMENSIONS` array in `qa.js`. Three skills are broken: `web-design-guidelines` needs
`WebFetch` no assigned agent holds, `pitch-deck-visuals` needs a CLI not on this machine, and `impeccable`
would strip designer's browser grant.

**4 — THE PROMPT-CRAFT GATE.** Above. Blocks everything after it.

**5 — The roster migration.** 17 agent files → 7. Blocked on the gate and on the sandbox.

**6 — The MCP servers.** Five of six do not exist: billing read, analytics, deploy, DB admin, payments. Only
the read-only database pattern is proven. **This is the real distance between the specification and a working
system**, and no amount of further specification shortens it.

**7 — One real venture task, end to end.** Price something, build the page, promote it, test a payment, read
the result back. **No venture work has ever run through this harness** — all 40 session files are
infrastructure, and every process walk in 7,000 lines of specification traced files rather than running the
playbook. Both boards converge on this as the experiment that settles whether seven is right.

## Decisions already made — do not reopen without new evidence

- **The roster is seven:** `orchestrator · builder · designer · reviewer · sourcer · instrument · operator`.
  `framer` is cut. All 26 other proposed agents are cut.
- **`allowed-tools` in a `SKILL.md` subtracts, it never grants** — settled from the binary's own schema. The
  roster number survives. Strip the field *before* attaching such a skill, because it does something.
- **Token cost is not a constraint** (Claude Max $200). Cost arguments are inadmissible. Admissible scarcity:
  rate-limit headroom in the rolling 5h window, wall-clock, context. **Never propose a global token or turn
  cap** — one existed, it blocked the CEO mid-session, and the founder removed it.
- **6–8 skills per agent**, superseding CLAUDE.md's 2–3 budget.
- **Designer is the default** for anything a customer will look at; builder-alone is the prototype path and
  must be named as the exception in the brief.
- **One worktree per dispatch**, not per agent.
- **Scheduled work belongs to a script and a real clock** (`launchd`), with no agent owner.
- **Authority follows the write:** the terminal writes state, Mission Control writes nothing, so when they
  disagree the terminal is right by definition.
- **Codex is deferred, not rejected.** Revisit after the gate has actually refused something.
  `independence: vendor` remains valid in the lens schema for when it is.
- **The founder's disagreement is not evidence** — and neither is mine. Both boards were run with that in
  writing.

## Open — needs the founder

1. **The OS sandbox.** Configured nowhere. Precondition for `operator`, `instrument`, and designer's browser,
   because `tools:` does not bind `Bash`. It also binds the founder's own interactive sessions.
2. **`--dangerously-skip-permissions`** — still in `bin/warroom` twice. The autonomy dial welded to maximum;
   the allow/deny lists are inert until it goes.
3. **Designer's browser grant** — grant it, or delete designer the same day. Leaving it is the one
   indefensible option.
4. **The 44 files in `~/.claude/agents/`** — precondition for deleting the 11 shims, and **order matters**:
   deleting a shim first un-shadows a drifted global, so the name keeps working and quietly means something
   older.
5. ~~Whether to push and open a PR.~~ **Resolved** — pushed and split into #42 and #43; see *Current state*.
6. **Whether F13 or the classifier is right** about a mixed-tier PR. Not urgent, but it is now the only
   mechanism that has ever refused a merge in this repo, so how it is fixed matters more than most things
   on this list.

## Gotchas

**Corrections made in this session. Do not re-inherit them — each was asserted confidently and was wrong.**

| Claim | Truth |
|---|---|
| A read-only agent disarmed the permission model | **Retracted.** It was PR #29, founder-instructed and merged two minutes earlier |
| `maxTurns: 20` truncated ten finders | **False.** 196 of 269 runs exceeded it. The cap never fires |
| Declaring `tools:` amputates MCP | **Refuted.** `sourcer` gets 0/7 because it declares no `mcpServers:` |
| No injection reaches subagents | **Wrong.** `skills:` injection works — 288 of 431 |
| `qa.js` never runs | **Wrong.** `Workflow` fires 42×, `qa.js` 8. Nothing *routes* to it — that part stands |
| A perf failure came from corpus growth | **Wrong.** +4% cannot explain 3.4×. It was concurrent load |
| Two designer skills must be imported | **Already in the repo.** And `design-audit` is a symlinked global |

**Operational:**

- **A subagent that stops early reports as "available", not "incomplete."** It happened three times here.
  **Always verify a subagent's work on disk before believing its silence — or its report.**
- `pre-tool-use.sh` scans the whole Bash command string including heredoc bodies, so a commit message
  *describing* a destructive command is blocked as if it were one. Write the message to a file.
- `~/.claude/plans/` is allowed; the session scratchpad is not. Both are outside the project root.
- Every worktree needs `bun install` in `mission-control/` before `npm run check`.
- ~~**Never** edit files carrying ```claims blocks — editing moves `source_line` and fails `ledger build
  --check`.~~ **No longer true.** The index stopped recording `source_line`, so prose edits to
  claim-bearing files are safe; changing a *claim* still fails the check, by design. Positions come from
  `node scripts/ledger.mjs locate <id>`. **Never** hand-edit `CODEBASE-MAP.md` or
  `.claude/ledger/index.json`; regenerate with `npm run ledger:build` then `npm run build:map`, in that order.
- Bash working directory persists between calls. A stray `cd` breaks relative paths for the rest of the session.
- `PHASE-8A-STATUS.md` is stale — it still says PR3 of 5 with 4 and 5 not started; both merged. ~~It carries
  claim blocks, so fixing it has a line-number cost.~~ **No line-number cost any more** — the index stopped
  recording `source_line`, so editing prose around a claim block costs nothing. Just fix it.

---

_Written by: ceo · 2026-08-15 · against `2468736`_
