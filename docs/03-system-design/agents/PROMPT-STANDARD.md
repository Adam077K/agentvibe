# Prompt Standard — how an agent file is written

**Status:** proposed, awaiting founder approval · **Written:** 2026-08-16 · **Scope:** every file under
`.claude/agents/`, and the dispatch sites in `.claude/workflows/*.js` where §3.1 and §5.3 say so.

This document exists because the founder blocked the roster migration on it:

> *"Before we delete the agent files and before we create the new agents and system prompts, do a deep dive
> on how we write and structure and actually write the prompts for the agents."*
> — [2026-08-15-implementation.md:27-31](../../08-agents_work/handoffs/2026-08-15-implementation.md)

The specs say **what** each engine is. This says **how the file is written**, and that turned out to be
load-bearing: a stale `model:` line silently governed `effort` across 269 runs, a declared skill that carries
`allowed-tools:` strips its host agent's grant at runtime, and fifteen of twenty-six agent files once failed
their own validator.

**Every rule below carries its lint rule id and its posture.** A rule with no mechanism is written
`ADVISORY` and says so. That is the shape [CLAUDE.md](../../../CLAUDE.md) already uses for its rules table,
for the same reason: this repo has shipped eight sentences that read as enforcement while nothing checked
them.

---

## 0 · The calibration rule — read this before proposing any rule

**A rule inherits the grammar of the thing it was calibrated on.**

`schema-lint.js:574` defines `VAGUE`, and it is a good rule. It was calibrated on lens `procedure:` entries —
single imperative sentences in a YAML list, where "the spacing looks off" really is unfalsifiable. Reuse it
over agent-file prose and it fails **6 of the 7 files this standard is meant to certify**:

```
$ cd .claude/agents
$ grep -nEi '\b(looks?|feels?|seems?|appropriate|reasonable|properly|adequately|good|nice|clean|sensible|as needed|where appropriate)\b' *.md \
    | grep -vEi '\b(match(es|ing)?|equals?|exceeds?|at least|no more than|within|per|against the|stated|written|measured|number|date|source|list(ed)?)\b'

builder.md:51            - **vs framer:** it decided what success looks like.
orchestrator.md:43       feel the urge to implement, you are routing wrong.
orchestrator.md:135      - **DO NOT pass a stage whose exit conditions are unmet** because the work "looks done".
designer.md:35           You build and refine what people look at, and you judge it by looking at the rendered result
designer.md:51           - **vs framer:** it decides what the screen must achieve; you decide how it looks achieving it.
designer.md:76           ### Step 4 — Render and look
reviewer-readonly.md:63  admits it could not look: the first is confidently wrong…
reviewer-readonly.md:109 lens's `blocking_severities`, not from how the problem feels.
reviewer.md:88           `blocking_severities`, not from how the problem feels.
framer.md:53             - **vs builder:** you say what success looks like; it decides how to get there.

  orchestrator 2 · builder 1 · designer 3 · reviewer 1 · reviewer-readonly 2 · sourcer 0 · framer 1
  6 of 7 files, 10 sites
```

Every one of those is *correct prose*. `designer`'s whole reason to exist as a separate engine is that it
**looks at** rendered output. A linter that fails `### Step 4 — Render and look` is not enforcing quality; it
is enforcing a grammar the corpus never used.

**Decision (2026-08-16, lane-roster):** Option (b) — narrowed the predicate, not the prose. `BODY_VAGUE`
(used in PS-BODY-VAGUE) excludes `looks?` and `feels?` from the agent-body check. Every flagged site used
those words as literal observation verbs ("look at the rendered output"), comparison constructors ("looks
like"), or explicit rejections of vagueness ("not from how the problem feels"). No meaningful vagueness is
missed: "looks good/clean/reasonable" is caught by "good"/"clean"/"reasonable"; "feels right" is the only
uncovered case and it does not appear in the corpus. The full `VAGUE` pattern (including `looks?`/`feels?`)
is preserved at line ~1124 for lens procedure checks, where those words ARE the constructions it was
calibrated against. Pinned test updated from 6 files/10 sites to 0/0.

**What it means that a rule shipped firing on every engine it governs:** the gap between calibration and
deployment was the scope change — `VAGUE` was calibrated on YAML procedure entries (one imperative sentence
each) and then applied, unchanged, to full-paragraph agent body prose. A grammar rule that is correct for
one register is not automatically correct for another. The lesson is not "never reuse a pattern"; it is
"record what the pattern was calibrated on and re-measure when the scope changes."

So this standard binds itself to a method:

> **Calibration.** Before a rule may be proposed as `FAIL`, it is run against all seven live engine files and
> the hit count is recorded. The pattern is narrowed until it fires **zero** times. A rule that cannot reach
> zero without becoming vacuous is demoted to `WARN`, labelled as such, and the reason is written down.
> A rule that reaches zero must additionally **fire on a constructed violation**, or it is vacuous and is not
> a rule at all.

That second half is the discipline `schema-lint.js:975-978` already names for lens rules — *"the rules are
tested by constructing the failures rather than by trusting that they fire."* Section 6 records both numbers
for every rule.

**The FAIL/WARN split is not by severity of the offence. It is by whether a false positive is possible.**

| Posture | Applies over | Because |
|---|---|---|
| `FAIL` | closed sets — a frontmatter enum, the tool universe, the configured-server set, a literal phrase list, a count, a key-set comparison | membership is decidable; there is no judgement call to get wrong |
| `WARN` | open prose | any pattern over English will eventually be wrong about a sentence nobody anticipated, and a linter that is wrong blocks good work |

A severe offence over open prose is a `WARN`. A trivial offence over a closed set is a `FAIL`. That ordering
looks backwards and is deliberate.

---

## 1 · Structure — the five channels, ordered by binding force

An instruction can be written in five places. They are not interchangeable, and the repo has **measured**
which bind ([AGENT-ARCHITECTURE.md:45-57](../AGENT-ARCHITECTURE.md), tool-use census over every
`agent-*.jsonl`).

| # | Channel | Binding force | What it can carry |
|---|---|---|---|
| 1 | **Dispatch site** — the `Agent` tool call, or `agent()` in `.claude/workflows/*.js` | **HARD.** It selects the container. `agentType` decides which frontmatter applies at all | the task, the scope, the return format, the agent type, the model alias, isolation |
| 2 | **Agent frontmatter** — the YAML block | **HARD, and for some fields it is the ONLY channel** | tools, model pin, `effort`, `maxTurns`, skills, MCP servers, isolation default |
| 3 | **Injected skills** — `skills:` in frontmatter | **hard delivery, soft content — and `allowed-tools:` SUBTRACTS** | reusable procedure |
| 4 | **The file body** — everything after the frontmatter | **SOFT.** It is text in a system prompt. It persuades; it does not bind | identity, procedure, distinctions, anti-patterns |
| 5 | **`CLAUDE.md`** | **SOFTEST, and it does not reach a subagent at all** | facts true of every session in the main terminal |

### 1.1 The routing rule

> **A sentence goes in the weakest channel that can carry it, and never in a channel weaker than the one that
> must enforce it.**

Both halves matter. Putting a tool restriction in the body when `tools:` exists is writing a wish
(`PS-BODY-TOOL-AFFIRM`). Putting the whole design rationale in frontmatter is paying prefix cost on every turn
for something the body carries fine.

### 1.2 Frontmatter is not a default — for several fields it is the only channel

The `Agent` tool path accepts exactly: `description`, `prompt`, `subagent_type`, `name`, `model`, `isolation`
(plus the deprecated `team_name` / `mode`). The workflow path — `agent()` in `.claude/workflows/qa.js:222`,
`:235`, `:283`, `:322` — accepts `label`, `phase`, `model`, `agentType`, `schema`.

**Neither path can set `allowedTools`, `disallowedTools`, or `maxTurns`** — `strings -a` over the installed
binary returns **0** hits for `allowedTools?:`, and neither signature carries `maxTurns`. So those are not
defaults a caller overrides; frontmatter is where they are decided or they are not decided.

**`effort` splits by path, and an earlier draft of this section got it wrong.** The `Agent` tool cannot send
it. The workflow `agent()` **can** — the binary's own signature is
`{label?, phase?, schema?, model?, effort?, isolation?, agentType?}`
([GRANT-HOLDERS.md:28-40](GRANT-HOLDERS.md), read from `strings -a` on version 2.1.232). No live workflow
passes it today (`grep -n effort .claude/workflows/*.js` → no matches), so the parameter exists and is unused.
Treat `effort` as frontmatter-only on the `Agent` path and caller-overridable on the workflow path.

`model` is the exception, and it has two namespaces that must not be confused:

- **frontmatter** takes a pinned id — `claude-sonnet-4-6` (`schema-lint.js:115`).
- **dispatch** takes an alias — `'sonnet'`, `'opus'`.
- On the `Agent` path the alias **wins**: overridden in 637 of 1,133 calls.
- On the workflow path the pin **wins**: 269 of 269 `reviewer` runs executed `claude-sonnet-4-6` at
  `effort: high`, dispatched with no `model` option, inside runs whose manifest default was
  `claude-opus-5[1m]` ([AGENT-ARCHITECTURE.md:54, :63-67](../AGENT-ARCHITECTURE.md)).

This is the "stale `model:` line" the handoff warned about. It is not inert.

### 1.3 `skills:` is the arrival channel, and it subtracts

Skill bodies are injected as `isMeta` user messages **before the first turn** — 288 of 431 subagent
transcripts carry `<skill-format>` ([AGENT-ARCHITECTURE.md:53](../AGENT-ARCHITECTURE.md)). That makes
`skills:` the one reliable way to put shared procedure into a subagent's context.

It is also the one channel that can silently **remove** a capability. A skill declaring `allowed-tools:` is a
ceiling, not a grant, for as long as it is active. Eight skills in this repo declare it, and two clamp to a
single Bash pattern:

```
$ grep -rl '^allowed-tools:' .claude/skills/*/SKILL.md
.claude/skills/impeccable/SKILL.md            → Bash(npx impeccable *), Bash(node .claude/skills/impeccable/scripts/*)
.claude/skills/pitch-deck-visuals/SKILL.md    → Bash(belt *)
.claude/skills/database-design/SKILL.md       → Read, Write, Edit, Glob, Grep
.claude/skills/deployment-procedures/SKILL.md → Read, Glob, Grep, Bash
.claude/skills/nextjs-best-practices/SKILL.md → Read, Write, Edit, Glob, Grep
.claude/skills/react-patterns/SKILL.md        → Read, Write, Edit, Glob, Grep
.claude/skills/tailwind-patterns/SKILL.md     → Read, Write, Edit, Glob, Grep
.claude/skills/tdd-workflow/SKILL.md          → Read, Write, Edit, Glob, Grep, Bash
```

`impeccable` is the skill the roster spec assigns to `designer`, whose entire purpose is a browser perception
loop it would no longer be able to reach — no Read, no Write, no MCP. `schema-lint.js:440-448` already fails
this (`PS-SKILL-CLAMP`); the rule costs nothing today and fires exactly when the migration attaches one.

### 1.4 `CLAUDE.md` does not reach a subagent

The `SessionStart` hook fires once per session, **and a subagent is not a session**
([AGENT-ARCHITECTURE.md:473](../AGENT-ARCHITECTURE.md), and `:803` on the 24,490-byte lens dump it delivers
to the context that needs it least). Anything an engine must know at turn 1 goes in its frontmatter, its
skills, or its dispatch brief. Writing it in `CLAUDE.md` and expecting a builder to have read it is the
commonest way to author a rule that binds nothing.

### 1.5 What frontmatter binds, current as of 2026-08-16

Reproduced from [AGENT-ARCHITECTURE.md:45-57](../AGENT-ARCHITECTURE.md) **with one row corrected**, because
that table is now partly stale and a standard that copies it forward propagates the error:

| Field | Binds? |
|---|---|
| `tools:` — subtraction | **YES.** `framer` (no Bash): 30 tool calls, 0 Bash. `sourcer` (no Bash): 284 calls, 0 Bash. `reviewer` (no Write/Edit): 4,373 calls, 0 Write, 0 Edit |
| `tools:` — addition | **NO.** The runtime augments — `reviewer`, granted 4 tools, called `StructuredOutput` 259 times. The declaration is not the tool set |
| `effort:` | **The VALUE binds where it is set** — `low\|medium\|high\|xhigh\|max`, and `max` is real at 95 recorded turns (model×effort census). **Whether the FRONTMATTER FIELD is read is UNVERIFIED: zero agent files declare it, so that channel has never been exercised.** The census measured effort as it arrived at the runtime, not as an agent file declared it. Do not let this row be read as a grant — that is the `mcpServers` failure, which 52 files carried |
| `skills:` | **YES** — injected pre-turn-1, 288/431 |
| `mcpServers:` | **YES** — and it resolves from user scope even when the repo's `.mcp.json` does not name the server |
| `model:` | Default on the `Agent` path; **governs** on the workflow path (§1.2) |
| `isolation: worktree` | **YES, at dispatch.** This is git, not a prompt |
| `maxTurns:` | **CORRECTED — binds when the dispatch names an `agentType`, and not otherwise.** The `NO` in the source table was measured over a corpus in which no dispatch named an agent file. Now that `qa.js` names `agentType` at all four sites, the cap is live and is 30 on every engine. Do not "clean up" this field believing it inert |
| `return_contract:` | **NO.** `schema-lint.js` checks the key exists; nothing validates a return against it. `PS-RETURN-EXAMPLE-MATCHES` gives it the one guarantee a linter can give — that the file agrees with itself — and the orchestrator's Step 4 is the only other check there is |

---

## 2 · Length

The handoff is explicit: *"With evidence. Do not assert a number."* So this section derives, and the first
thing the derivation kills is the reason people usually reach for a number.

### 2.1 File length is not a cost argument. Say so, or someone re-derives a budget from money

Across 2,412 subagent launches, fixed startup is a median 35,769 tokens each — **86.3M tokens, 0.33% of the
26.1B the corpus has ever spent** ([TOKEN-EFFICIENCY.md §2.5](../TOKEN-EFFICIENCY.md)). The agent file is a
fraction of that fraction: the seven live files are 113-149 lines, roughly 1,200-1,600 tokens, so the entire
roster's file text across the whole corpus is on the order of **0.013% of all tokens spent**.

**Halving every agent file in this repo would save less than one hundredth of one percent of token spend.**
Any argument for a shorter agent file that rests on cost is arguing about a rounding error, and this
paragraph exists so that nobody has to re-derive that from the pricing table a third time.

### 2.2 The real mechanism is unconditional cost, not volume

95.2% of every input token this system has spent is re-read context — the accumulated prefix, re-sent every
turn ([TOKEN-EFFICIENCY.md §1](../TOKEN-EFFICIENCY.md)).

The system prompt sits in that prefix from turn 1 and is re-read on **every** turn of the container's life. A
tool result enters the prefix only at the turn the agent chose to fetch it. The difference that matters is
therefore not the multiplier — both get re-read — it is **conditionality**:

> A line in the agent file is paid on every turn of every run, whether or not that run needed it.
> A line in a file the agent `Read`s is paid only in the runs that needed it, only from the turn it was
> fetched.

So the length question is not "how many lines" but **"is this true of every run of this engine?"** A rule the
engine needs in one task out of twenty belongs in a skill, a lens, or the brief — not because of the tokens,
but because it is being asserted in the runs where it is wrong.

### 2.3 The measured length problem is the dispatch brief, not the file

This is where the corpus actually has a pathology, and it is not in `.claude/agents/`
([TOKEN-EFFICIENCY.md §2.4](../TOKEN-EFFICIENCY.md), 2,412 dispatch prompts):

```
  p50       3,518 chars
  p75       5,084
  p90      11,161
  p95      28,855
  p99     212,282
  max   1,069,297

  >= 42,000 chars:   69 prompts (2.9%)
  the top 1% of dispatch prompts carry 37.7% of all 26,017,236 dispatch chars
```

The three largest contain **zero `tool_use_id` and zero `system-reminder`** — so this is not replayed
conversation. It is hand-composed briefs carrying **verbatim peer-agent output**, the board pattern where
each round pastes the previous round's full text into the next dispatch. The three largest were issued by
this repo's own team.

**The rule that follows, and it is the only length rule with measured force behind it:**

> **A dispatch brief passes file paths, branch names and identifiers. It does not paste an artifact, a
> transcript, or another agent's return by value.** Trimming conversation history would do nothing here;
> passing paths instead of bodies would do everything.

Posture: `WARN` (`PS-DISPATCH-BRIEF-SIZE`) — see §6.2 for why a byte threshold over free text cannot be
`FAIL`.

### 2.4 The observed band, reported descriptively

The seven files that pass today, measured, not prescribed:

| File | `wc -l` | `### Step N` | `DO NOT` |
|---|---|---|---|
| orchestrator | 138 | 7 | 7 |
| builder | 123 | 5 | 7 |
| designer | 116 | 6 | 5 |
| reviewer | 129 | 5 | 6 |
| reviewer-readonly | 149 | 5 | 6 |
| sourcer | 113 | 5 | 6 |
| framer | 120 | 6 | 6 |
| **band** | **113-149** | **5-7** | **5-7** |

A new engine file landing well outside that band is a signal to look, not a defect. `reviewer-readonly` is
the top of the range **because it carries two extra sections justifying why it exists at all** — that is the
right reason to be long, and a rule that punished it would delete the justification.

*Precision note for the linter implementer:* `schema-lint.js` reports 114-150 for these same files because it
counts `text.split('\n').length`, which is `wc -l` + 1 for a trailing newline. Any threshold must state which
convention it uses. The existing warn caps (350 / 500 / 600 lines, `schema-lint.js:542-544`) sit **2.3× above
the top of the observed band** and therefore bind nothing on this roster; §6.2 replaces them with a band drawn
from the corpus.

---

## 3 · Word choice

Three rules. The first has the sharpest number in this repository behind it.

### 3.1 Never state a prior belief about the artifact under judgement

> Framing alone — telling a reviewer the code is believed correct — collapsed vulnerability detection from
> **97.2% to 3.6%** on GPT-4o-mini and **68.4% to 8.5%** on Claude 3.5 Haiku across 250 CVE patch pairs.
> Redacting that framing recovered detection to **94-100%**.
> ([arXiv:2603.18740](https://arxiv.org/html/2603.18740v1), accessed 2026-08-15, via
> [MODEL-DIVERSITY.md:34-44](../MODEL-DIVERSITY.md))

A 60-to-94-point swing from a sentence. Nothing else in this standard has that magnitude, and it is a *word
choice* finding rather than a model-capability finding: the same model, on the same 250 patch pairs, with one
clause removed.

This repo wrote the failure mode into its own gate. Until 2026-08-15, two of the three adversarial verifiers
in `qa.js` were told to assume the finding was false. The gate's record at that point was **34 PASS and 0
BLOCK** (`qa.js:154-160`).

**The rule.** No text that reaches a judging model may assert what the artifact under judgement is believed
to be. Not "this is believed correct", not "this has already been reviewed", not "this is probably a false
positive", not "the author is confident". Facts about *provenance* are fine and often necessary — "this diff
touches auth", "this is the third attempt" — because they describe the artifact, not its verdict.

*Scoping the rule so it does not eat its own documentation:* it reads only the text that **reaches the
model** — an agent file's frontmatter `description` and body, and in a workflow file only string literals
passed as prompts. Not comments. `qa.js:154-155` describes the defect it fixed; a rule about prior belief is
not a prior belief, exactly as `schema-lint.js:558-560` learned that a rule about TODOs is not a TODO.

One thing this rule cannot reach, stated so it is not mistaken for covered: the *balance* of a panel.
`qa.js:165` still says `Default to is_real=false` — deliberately, as one of three postures, alongside one
neutral reproduction and one steelman. A panel that can only argue one direction is not a panel, but that is
a property of the **dispatch set**, not of any one string, and no linter over an agent file can see it. §4 is
where that property lives.

### 3.2 Instruction, not description

"The analysis should be sensitivity-tested" tells nobody to do anything. `schema-lint.js:569` encodes this as
`NOT_AN_INSTRUCTION` — a step opening with an article or a bare pronoun is a description.

**And that rule stays scoped to lens `procedure:` entries.** It is calibrated on single imperative sentences.
Agent-file prose legitimately opens paragraphs with "The tool list above is the mission" (`reviewer.md:37`)
and "You take one focused task" (`builder.md:37`). Applying one grammar rule to three kinds of statement is
the error `schema-lint.js:566-568` records having made once already.

For agent files the enforceable residue is structural rather than grammatical: an `## Operating procedure` is
`### Step N` headings, and an `## Anti-patterns` is `- **DO NOT …**` bullets. Both are shapes, both are
closed, both are checkable (`PS-STEP-SHAPE`, `PS-ANTIPATTERN-SHAPE`). The seven files satisfy both today.

### 3.3 Name the mechanism, not the disposition

"Be critical" binds nothing. It names a mood and supplies no test the agent can fail.

Compare, from the live files:

| Disposition — refused | Mechanism — the same intent, enforceable |
|---|---|
| "Be rigorous about severity" | *"Severity comes from the lens's `blocking_severities`, not from how the problem feels."* — `reviewer.md:88` |
| "Be careful not to overreach" | *"Take the changed-file list from the brief. That list is the boundary."* — `reviewer-readonly.md:91` |
| "Be honest about what you checked" | *"Never guess at what a command would have printed. If a check genuinely requires execution, say so in `out_of_scope_notes`."* — `reviewer-readonly.md:60-63` |
| "Be thorough" | *"Empty, loading, error, populated. A screen that only has a populated state is a screenshot, not a screen."* — `designer.md:87` |

Every right-hand cell names an artifact, a field, or a condition. Every one can be checked by someone who was
not there. That is the difference, and §4 turns it into a rule.

---

## 4 · Anti-sycophancy, mechanically

The founder's instruction is the whole section:

> *"Not 'be critical' — the repo has learned that class of instruction binds nothing."*

**Anti-sycophancy is a structural property of the dispatch, not a word choice in a file.** The repo has
receipts for every load-bearing piece of it, and not one of them is a sentence in a prompt:

| Property | Mechanism | Evidence |
|---|---|---|
| The judge cannot be primed by the producer | `independence: provenance` — a lens claiming it may not also declare `scope: whole-artifact`, because judging the whole artifact requires the producer's own account of it | `schema-lint.js:1465-1489` (verified 2026-08-24; `schema-lint.js:729-742` was cited until then and is the `PS-BODY-VAGUE` comment block, not this check) |
| The judge cannot edit what it judges | `reviewer-readonly` declares `tools: [Read, Glob, Grep]` — no Write, no Edit, **no shell** — and `qa.js` dispatches the one binding judge into it | `reviewer-readonly.md:6`, `qa.js:102` (`JUDGE_AGENT`) |
| A read-only engine cannot quietly regain write | the lint refuses `Write`/`Edit`/`NotebookEdit` on `READ_ONLY_ENGINES` | `schema-lint.js:455-463` |
| An LLM judge cannot grant a pass the rule denies | the verdict is arithmetic: a confirmed P1 blocks regardless of what the judge returned | `.claude/workflows/lib/gate-logic.mjs:39-46` |
| Disagreement resolves strictly | *"A second judge may only turn `PASS` into `BLOCK`, never `BLOCK` into `PASS`"* | [MODEL-DIVERSITY.md §0](../MODEL-DIVERSITY.md) |
| Severity is not the finder's to choose | it comes from the lens's `blocking_severities` | `.claude/review-lenses.yml`, applied at `reviewer.md:88` |

None of that is achieved by telling an agent to be tough. It is achieved by removing the tool, removing the
priming, and making the arithmetic final. `qa.js` **blocked three times on its own author's work** — that is
what a structural property looks like when it holds.

### The rule

> **An agent file may not contain a disposition instruction at all.** Where a file needs adversarial
> behaviour, it must instead **name the artifact it judges against and the condition under which it returns
> BLOCKED.**

Both halves are checked, and **the two halves do not have the same posture.** This paragraph read: *"The
ban is a literal phrase list over a closed set (`PS-DISPOSITION`, `FAIL`)... a presence check over a closed
set of files (`PS-JUDGE-BLOCK-CONDITION`, `FAIL`)."* Half of that is corrected as of 2026-08-24.

**The ban is `WARN`.** The phrase *list* is closed, but the set of English sentences that instruct a
disposition is not, and `Be extremely critical.` is off the list — so is *"Determine whether the code is
correct."*, which the sibling `PS-PRIOR-BELIEF` pattern wrongly catches. A regex over that category cannot
decide membership, and §0 assigns it to `WARN`.

**The positive requirement is still `FAIL`, and stays.** `PS-JUDGE-BLOCK-CONDITION` is a presence check over
`READ_ONLY_ENGINES` — two files, a genuinely closed set. It is blunt: the token `BLOCKED` anywhere in a body
satisfies it, so it passes files it should question. That error is **false-negative**, and demoting a rule
whose errors run that direction deletes a floor rather than preventing a wrong block. It was demoted on
2026-08-24 and restored in the same change, once the direction of its error was looked at rather than
assumed. §6.2 records the paraphrase that defeats it, as a sharpening target.

The rule in the box above is unchanged and is still the standard. What changed is the honesty about which
half a regex can carry: a reviewer, not a pattern, is what tells a disposition instruction from a mechanism.

**What this rule is not.** It is not a ban on strong language. `reviewer.md:37` says *"an agent that can edit
what it reviews will review what it can edit"* and that sentence stays — it explains a mechanism that exists.
The ban is on asking for a mood in place of a mechanism.

---

## 5 · The never-appear list

Four classes. Each maps to an enforceable rule, and the enforcement is named rather than implied.

### 5.1 A capability the runtime does not grant

`mcpServers:` was required frontmatter on all 52 agent files while `settings.json` had no `mcpServers` key
and no `.mcp.json` existed anywhere. The field granted nothing to anybody and read as a boundary.

The fix, already live at `schema-lint.js:381-406`, is **per-server**, not per-repo. An earlier draft asked
"does any MCP config exist", which meant the first `.mcp.json` to land would have flipped the check
permissive for the entire roster at once.

Generalised: **a frontmatter key must be one the schema knows.** An unknown key is decoration by definition —
nothing reads it, and it will be mistaken for a grant. `PS-FM-KEY-ALLOWLIST`, `FAIL`, closed set of 14 keys.

Today `designer.md:7` declares `mcpServers: [playwright]` and `.mcp.json` configures `playwright`. The
declaration is real, and it passes because it is real.

### 5.2 A tool that does not exist

Two rules, because there are two places to get this wrong.

- **`PS-TOOL-EXISTS`** (`FAIL`) — every entry in `tools:` is in the runtime tool universe, and every
  `mcp__<server>__<tool>` entry names a **configured** server. A malformed `mcp__` id (either half
  empty) fails too, rather than being ignored.
- **`PS-BODY-TOOL-AFFIRM`** (`WARN` since 2026-08-24, `FAIL` before it) — the body may not affirmatively
  direct the use of a tool the frontmatter does not grant. It is paragraph-scoped, and **one negation
  anywhere in the paragraph clears the paragraph** — **90 of 222 paragraphs (40.5%) in the live seven already contain a clearing word** (measured 2026-08-24 against `TOOL_NEGATION_RE`; this figure was **84 of 215 / 39.1%** when first recorded, and the diff that carries this revision is itself what moved it — the corpus grows every time an engine file gains a paragraph, so re-measure rather than quote),
  so what it certifies is far less than it reads as. §6.2.

> **The `mcp__` half of `PS-TOOL-EXISTS` was added 2026-08-24, and this section said the opposite until
> then.** `schema-lint.js` skipped every `mcp__*` entry, under a comment asserting that `PS-MCP-BACKED`
> covered them. It did not: `PS-MCP-BACKED` reads `mcpServers:`, a **different frontmatter field**, so
> `tools: [mcp__nonexistent__doAnything]` passed the whole standard clean. That is §5.1's `mcpServers`
> fabrication re-created one field over and hidden behind a comment describing a delegation nobody
> implemented — which is why the comment was corrected in the same commit as the code. The `<tool>` half
> is still unchecked and stated as such: a server's tool list exists only on a running server.

The second is where the calibration rule earned its place. All seven out-of-grant tool mentions in the live
files are *negations* — "You have no `Write` and no `Edit`" — and they must survive. A line-scoped check
fires on **2** of them, because these files hard-wrap at ~110 characters and the negation lands on the
neighbouring line:

```
reviewer-readonly.md:45   `general-purpose` with tools `*` — holding `Write` and `Edit` on the diff under judgement.
reviewer-readonly.md:46   `reviewer` removed `Write` and `Edit`; it left `Bash`, and `tools:` is not known to bind `Bash`…
```

**A line is not a sentence in a hard-wrapped file.** Scoped to the paragraph — the blank-line-delimited
block — the rule measures **0** on all seven and still fires on
`Run the suite with \`Bash\` before returning a verdict.`

### 5.3 A constraint that is false

The handoff names the live instance: the entry prompt asserts subagents cannot spawn subagents. **They can.**

This class is the reason [CLAUDE.md](../../../CLAUDE.md) carries Rule 9 — *"claims expire, and expiry forces a
decision"* — and it is the failure mode that "would have caught the nested-spawn fabrication." A false
constraint is worse than a missing one: it is obeyed.

`PS-FALSE-CONSTRAINT` (`FAIL`) is a **literal phrase list of statements this repo has measured false**,
held
in the linter next to the measurement that refuted each. It is deliberately not a general truth-checker. Its
current contents are in §6.5.

It measures 0 on the seven and fires on all three constructed violations. It is **silent on a paraphrase of
any of them** — *"A subagent has no way to start another subagent"* is off the list — and it **still
blocks**, because the list is closed, its false-positive surface is bounded and separately tested, and the
paraphrase gap makes it miss things rather than refuse good work. Briefly demoted on 2026-08-24 and restored
in the same change. Note what it must **not** catch:
`reviewer-readonly.md:46` reads *"`tools:` is not known to bind `Bash`"* — a hedged, true statement the list
is written to leave alone.

**Adding to this list is part of retiring a claim.** When a resolver refutes something the repo believed, the
refuted sentence goes in this list in the same PR. That is what stops the belief coming back.

The live example, today: `AGENT-ARCHITECTURE.md:56` still records `maxTurns: NO`, and §1.5 above corrects it.
The correction is written out here rather than left as a pointer, because a standard that forwards a stale
row propagates it.

### 5.4 A restated pipeline a playbook already owns

`/build` alone once restated the pipeline in 50 lines while the playbook also declared it. **Two descriptions
of one thing disagree silently.**

`orchestrator.md:79-81` shows the correct form — it *points*: *"Match the work to a playbook in
`.claude/playbooks/`. The playbook supplies the stages and the exit criteria; you do not invent a pipeline."*
Not one stage name is listed.

`PS-PIPELINE-RESTATE` (`FAIL`) fires when three or more stage ids of a **single** playbook appear on one line
joined by `→`, `->`, `,` or ` then `. Scoped that tightly on purpose: the stage ids are ordinary English —
`build`, `review`, `ship`, `frame`, `plan`, `design`, `model`, `judge`, `evidence`, `copy` — and any looser
rule would fire on every file in the repo. 0 on the seven; fires on
`Your pipeline is frame → plan → build → review → ship`.

---

## 6 · Enforcement

Proposed lint rule id: `PS-*`, emitted by `schema-lint.js` alongside its existing checks so there is one
linter over agent files rather than two. Every `FAIL` row below was **run** against the seven live engines
and reports its hit count; every `FAIL` row also reports whether it fires on a constructed violation, because
a rule that fires on nothing is not a rule.

### 6.1 Blocking — `FAIL`, over closed sets

| id | Checks | Hits on the 7 | Fires on control | Where |
|---|---|---|---|---|
| `PS-FM-REQUIRED` | the 9 required frontmatter fields, plus `escalates_to` / `escalates_when` / `return_contract` / `pre_flight_reads` | 0 | yes | exists — `schema-lint.js:347` |
| `PS-FM-KEY-ALLOWLIST` | every frontmatter key is one of the 14 the schema knows | 0 | yes | **new** (§5.1) |
| `PS-MODEL-ENUM` | `model` ∈ {`claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-haiku-4-5`} — the **target** set | **7 of 7 today** — see the note below | yes | `:360`, **enum changes in the linter PR** |
| `PS-EFFORT-ENUM` | `effort` ∈ {`low`, `medium`, `high`, `xhigh`, `max`} when the field is present | 0 (no engine declares it) | yes | **new** — see the binding caveat below |
| `PS-ISOLATION-ENUM` · `PS-TIER-ENUM` · `PS-MAXTURNS-RANGE` | enum · enum · `[5,30]` | 0 | yes | exists — `:370-376`, `:466` |
| `PS-NAME-MATCH` | `name:` equals the filename | 0 | yes | exists — `:355` |
| `PS-TOOL-EXISTS` | every `tools:` entry is a real runtime tool, **and every `mcp__<server>__<tool>` entry names a configured server** | 0 | yes — 3 controls: unconfigured server, malformed id, configured server passes | **new** (§5.2); `mcp__` half added 2026-08-24 |
| `PS-MCP-BACKED` | every `mcpServers:` entry is configured, **per server** | 0 | yes | exists — `:381-406` |
| `PS-SKILL-EXISTS` | every `skills:` entry is in `MANIFEST.json` | 0 | yes | exists — `:418` |
| `PS-SKILL-CLAMP` | no attached skill declares `allowed-tools:` | 0 | yes | exists — `:440-448` |
| `PS-READONLY-NOWRITE` | read-only engines declare no `Write` / `Edit` / `NotebookEdit` | 0 | yes | exists — `:455-463` |
| `PS-SECTIONS` | the 7 mandatory `##` sections, plus one of the 3 section-6 options | 0 | yes | exists — `:488-496` |
| `PS-SECTION-BOOKENDS` | first `##` is `Identity & mission`; last `##` is `Anti-patterns` | 0 | yes | **new** (§6.2) |
| `PS-ANTIPATTERN-SHAPE` | every bullet under `## Anti-patterns` opens `- **DO NOT ` | 0 | yes | **new** (§3.2) |
| `PS-STEP-SHAPE` | `## Operating procedure` contains ≥ 1 `### Step N` heading | 0 | yes | **new** (§3.2) |
| `PS-STATUS-FIELD` | `return_contract.required_fields` includes `status` | 0 | yes | **new** |
| `PS-RETURN-EXAMPLE-MATCHES` | the JSON block under `## Return contract` carries exactly the keys in `required_fields` | 0 | yes | **new** (§1.5) |
| `PS-JUDGE-BLOCK-CONDITION` | a read-only engine's body names a BLOCKED or per-lens-verdict condition | 0 | yes | **new** (§4); demoted and restored 2026-08-24 |
| `PS-FALSE-CONSTRAINT` | no statement this repo has measured false — literal list of 8 executed-and-refuted sentences | 0 | 3 / 3 | **new** (§5.3); demoted and restored 2026-08-24 |
| `PS-PIPELINE-RESTATE` | no chain of ≥ 3 stage ids of one playbook on one line | 0 | yes | **new** (§5.4) |

> **The two rows above made a round trip on 2026-08-24 and this table lost them in the middle of
> it.** The demotion commit removed all five rows; the restoration commit put the prose right in §4
> and §5.3 and did not put these two rows back. For one commit the prose said `FAIL` and the table a
> reader consults as *the list* did not contain them — which is the same defect as a comment
> describing coverage that does not exist, one document over. Both are `FAIL`, both measure 0 on the
> seven, and both are defeated by a paraphrase that is recorded in §6.2 as a sharpening target
> rather than a demotion, because their errors run false-negative.

> **Three rows left this table on 2026-08-24 and are now in §6.2:** `PS-DISPOSITION`,
> `PS-PRIOR-BELIEF`, `PS-BODY-TOOL-AFFIRM`. Each regexes over an open category of English, which §0's
> own split assigns to `WARN`, each is defeated by a paraphrase, and each has a demonstrated FALSE
> POSITIVE — `/\b(make|be) sure to\b/` and `/\bthe (code|change|diff|work|patch) is (correct|fine|
> safe|secure|valid)\b/` both fire on the legitimate *"Determine whether the code is correct."*
> Nothing is deleted: the messages are unchanged and every one still reports.
>
> **`PS-JUDGE-BLOCK-CONDITION` and `PS-FALSE-CONSTRAINT` were demoted with them and RESTORED in the
> same change.** A first version of this note said "all five regex over open English." That was false
> for these two and is corrected here. Neither is open prose: one is a token-presence floor over the
> closed `READ_ONLY_ENGINES` set, the other a literal list of eight executed-and-refuted sentences
> whose false-positive surface is bounded and has its own test. Both are defeated by a paraphrase and
> both keep blocking, because their errors run **false-negative** — demoting a floor removes it rather
> than reducing wrong blocking. Their paraphrase weakness is a sharpening backlog item, pinned as a
> test so it goes red the day someone fixes it.

**`PS-MODEL-ENUM` is the one blocking rule that does not measure zero, and the exception is stated rather
than hidden.** `schema-lint.js:115` holds `{claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5}`. That set
is stale: the fleet's own transcripts run the Claude 5 family, and the two models currently pinned are the
two *smallest* lines in the census —

```
VERIFIED  TOKEN-EFFICIENCY.md §6 "Model split", python3 scratchpad/econ.py § by model
  claude-opus-5     input 10,359,349,758        claude-fable-5    input 3,166,418,927
  claude-sonnet-5   input  5,457,739,760        claude-sonnet-4-6 input 1,536,772,733
  claude-opus-4-8   input  5,198,600,976        claude-opus-4-7   input   286,132,075
```

A stale pin is not cosmetic: it **silently clamps `effort`**, the one quality dial that binds
([GRANT-HOLDERS.md §3.1, :176](GRANT-HOLDERS.md)). All seven engines are pinned to superseded models today,
so this rule measures **7 of 7** against the target set.

**It is therefore not blocking yet, and it must not be turned on before the roster is re-pinned** — a
blocking rule that fails every good file is precisely what §0 exists to prevent. The two converge in the
linter PR (`feat/prompt-standard-lint`), already planned as `irreversible`: *"`VALID_MODELS` → Claude 5 set;
add `effort` to `REQUIRED_FRONTMATTER`; drop `maxTurns`"* ([GRANT-HOLDERS.md:1705](GRANT-HOLDERS.md)). Until
that lands, **the standard specifies the target set and `schema-lint.js:115` still holds the old one.**
Whoever lands `feat/prompt-standard-lint` re-pins the seven engine files in the same change, then flips this
row to `0`.

`PS-EFFORT-ENUM` validates the *value* whenever `effort:` is present — a closed enum, so it is safe to block
on from day one. It says nothing about whether the field is honoured. **Whether the frontmatter `effort:`
field actually binds is UNVERIFIED:** zero agent files declare it today, so that channel has never been
exercised, and its support in subagent frontmatter could not be confirmed from documentation. Tracked as
claim `c-effort-frontmatter-binding-unverified`. Adding the field is how that gets tested; asserting it works
is how `mcpServers` got onto 52 files.

**Reproduce the existing-rule column:**

```bash
node .claude/hooks/schema-lint.js .claude/agents/{orchestrator,builder,designer,reviewer,reviewer-readonly,sourcer,framer}.md
# today: 7 pass · 0 fail · 1 warning
```

The one warning is `framer`: `isolation: none` on an engine holding `Write` / `Edit`. It is correct — `framer`
writes specs, not implementation files — and it is why `PS-ISOLATION-WRITE` is a warning and not a failure.

### 6.2 Warnings — `WARN`, over open prose or an unavoidable judgement call

Every row names why it cannot be `FAIL`.

**The three demoted on 2026-08-24 head the table, because the reason they are here generalises.** Each was
certified by §0's method as originally written — zero hits on the seven, fires on a constructed violation
— and each is still defeated by a **negative control**: one restatement that means the same thing and is
not on the list. *Zero-on-corpus plus fires-on-one-control is not sufficient.* Narrowing a predicate until
it stops firing on real files is indistinguishable from fixing it, and reads as "certified" either way.
§0's method now carries a third step for any rule over open prose: run the paraphrase. The paraphrases
below are pinned as tests in `scripts/prompt-standard.test.mjs` §12b, so a future sharpening has to beat
them rather than assert that it would.

They are **tripwires, not judgements**. A tripwire that reports costs an implementer nothing; a tripwire
that blocks costs a correct sentence.

| id | Checks | Why not `FAIL` |
|---|---|---|
| `PS-PRIOR-BELIEF` | no stated prior belief about the artifact under judgement — pattern list over an open category of English, applied to model-reaching text only | fires on *"The diff is believed to be correct."* — **silent on** *"Two senior engineers shipped this. Findings here are usually noise."* This is the rule guarding the 97.2%→3.6% priming effect, **and the phrasing the study actually measured is invisible to it.** Demoted 2026-08-24 |
| `PS-DISPOSITION` | no disposition instruction — pattern list over an open category of English | fires on *"Be critical of every finding."* — silent on *"Be extremely critical."* The regex requires the words adjacent. Demoted 2026-08-24 |
| `PS-BODY-TOOL-AFFIRM` | no affirmative direction to use an ungranted tool, **paragraph-scoped** | fires on *"Run the suite with `Bash`…"* — silent on the same line **plus "Do not skip it."** One negation anywhere in the paragraph clears the paragraph, and **90 of 222 paragraphs (40.5%) in the live seven already contain a clearing word** (measured 2026-08-24 against `TOOL_NEGATION_RE`; this figure was **84 of 215 / 39.1%** when first recorded, and the diff that carries this revision is itself what moved it — the corpus grows every time an engine file gains a paragraph, so re-measure rather than quote). Demoted 2026-08-24 |
| `PS-LENGTH-BAND` | file outside 100-175 lines (`wc -l` convention) | the band is descriptive — 113-149 observed (§2.4). `reviewer-readonly` is longest *because it justifies its own existence*, which is the right reason to be long. A cap would delete the justification |
| `PS-STEP-COUNT` | `### Step N` count outside 4-8 | observed 5-7. A genuinely simpler engine may need fewer, and no evidence supports a hard floor |
| `PS-ANTIPATTERN-COUNT` | `DO NOT` count outside 4-8 | observed 5-7, same reasoning |
| `PS-SECTION-ORDER` | the 5 leading sections are out of canonical order | **fires on 1 of 7 today.** `reviewer-readonly` puts `## Pre-flight reads` before `## Workflow position` and inserts two sections explaining why the file exists at all. That is a better file, not a worse one. `PS-SECTION-BOOKENDS` is the part of it that reaches zero |
| `PS-BODY-VAGUE` | `VAGUE && !ANCHOR` over the body | **fires on 6 of 7 today** (§0). Kept as a warning because it does surface real vagueness; it can never block, because it cannot distinguish `designer`'s perception loop from a hand-wave |
| `PS-DISPATCH-BRIEF-SIZE` | a dispatch brief in `.claude/workflows/*.js` over ~30,000 chars, or containing a fenced block over 200 lines | the payload is composed at runtime from free text, so a static check sees the template and not the brief. p95 is 28,855 chars and legitimate large briefs exist. Blocking on a byte count over free text is exactly the false positive §0 forbids |
| `PS-ISOLATION-WRITE` | `isolation: none` on an engine holding `Write` / `Edit` | `framer` is a correct instance. Exists — `schema-lint.js:508-511` |
| `PS-WORKTREE-BLOCK` | `isolation: worktree` with no `MAIN_REPO=` block in the body | exists — `schema-lint.js:516-519` |

### 6.3 Advisory — no mechanism, and saying so is the point

| id | Rule | Status |
|---|---|---|
| `PS-ADV-CONDITIONAL` | *A line in an agent file must be true of every run of that engine* (§2.2) | **ADVISORY — no mechanism, and none proposed.** Nothing can decide from a file whether a sentence is true of every run. This is a review question and it belongs in a review lens, not a linter |
| `PS-ADV-PANEL-BALANCE` | *A verifier panel must not have every posture leaning the same way* (§3.1) | **ADVISORY — no mechanism.** The property belongs to the dispatch set, not to any file. Checkable only by something that reads all of `qa.js`'s `lenses` array at once and judges the postures, which is an LLM judgement and not a lint |
| `PS-ADV-BRIEF-BY-REFERENCE` | *A brief passes paths, not bodies* (§2.3) | **ADVISORY at authoring time.** `PS-DISPATCH-BRIEF-SIZE` catches the symptom after the fact and only as a warning; nothing prevents the paste |
| `PS-ADV-RETURN-VALIDATED` | *A return is validated against `return_contract`* | **ADVISORY — nothing validates a return.** `PS-RETURN-EXAMPLE-MATCHES` only proves the file agrees with itself. The real check runs at dispatch, which is the workflow runtime's job and not the linter's |

Four advisory rules, four honest "no mechanism" labels. That is the count this standard is willing to carry;
a fifth should arrive with a plan or not at all.

### 6.4 Adding a rule to this standard

1. Write it.
2. Run it against all seven live engine files. Paste the count.
3. Narrow until the count is **0**.
4. Run it against a constructed violation. If it does not fire, it is vacuous — delete it.
5. If step 3 cannot reach 0 without step 4 failing, it is a `WARN`. Say so, and say why, in §6.2.
6. If it has no mechanism at all, it goes in §6.3 with the words "no mechanism" in the row.

### 6.5 The three phrase lists, in full

The implementing agent needs these verbatim; they are the whole content of three blocking rules. All three are
case-insensitive and are applied only to **model-reaching text** (§3.1): frontmatter `description` and the
file body for an agent file; string literals passed as prompts for a workflow file. Never comments.

```js
// PS-DISPOSITION — a mood in place of a mechanism. 0 hits on the seven; fires 4/4 on controls.
const DISPOSITION =
  /\b(be|stay|remain|act) (critical|thorough|skeptical|sceptical|rigorous|honest|careful|objective|harsh|brutal|diligent|meticulous|paranoid|adversarial|ruthless|vigilant|aggressive)\b/i
  // …plus: (think|dig|look) (deeply|hard|carefully) · you are (a|an)? (world-class|senior|expert|seasoned|elite|10x)
  //        act as (a|an) · don't be (afraid|shy|gentle) · take your time · (make|be) sure to · do your best
  //        carefully (review|consider|examine|check|read) · pay (close)? attention · high-quality · world-class

// PS-PRIOR-BELIEF — the 97.2% → 3.6% class. 0 hits on the seven; fires 4/4 on controls.
const PRIOR_BELIEF =
  /\b(is|was|are|were) (believed|assumed|presumed|known|thought) to be\b/i
  // …plus: assume (the|this|it|that)? (finding|code|change|diff|work|patch|it|this) (is|was|to be)
  //        (likely|probably) (correct|fine|safe|valid|a false positive) · known-good
  //        already (been)? (reviewed|approved|vetted|verified|audited)
  //        has (already)? passed (review|QA|the gate) · the (code|change|diff|work|patch) is (correct|fine|safe|secure|valid)
  //        default to is_real=false

// PS-FALSE-CONSTRAINT — statements this repo has MEASURED false. 0 hits on the seven; fires 3/3 on controls.
const FALSE_CONSTRAINT =
  /subagents? can ?not spawn|can ?not spawn (a |an )?subagents?/i
  // …plus: nested spawn(ing)? is (not|impossible|unsupported)
  //        maxTurns (is|are) (not enforced|advisory|inert|ignored|not binding) · maxTurns does not bind
  //        tools:? binds Bash · there is no way to spawn · spawning is disabled
```

Each entry in `FALSE_CONSTRAINT` carries, in the linter, a comment naming the measurement that refuted it.
An entry with no citation is someone's opinion wearing a rule's clothes.

---

## Appendix · Reproduction

All commands run 2026-08-16 against `origin/main` = `55176ed`, from the repository root.

```bash
# The seven engines pass today — 7 pass · 0 fail · 1 warning
node .claude/hooks/schema-lint.js .claude/agents/{orchestrator,builder,designer,reviewer,reviewer-readonly,sourcer,framer}.md

# §0 — VAGUE over agent bodies fails 6 of 7, 10 sites
cd .claude/agents && grep -nEi '\b(looks?|feels?|seems?|appropriate|reasonable|properly|adequately|good|nice|clean|sensible|as needed|where appropriate)\b' \
  orchestrator.md builder.md designer.md reviewer.md reviewer-readonly.md sourcer.md framer.md \
  | grep -vEi '\b(match(es|ing)?|equals?|exceeds?|at least|no more than|within|per|against the|stated|written|measured|number|date|source|list(ed)?)\b'

# §2.4 — the observed band
wc -l .claude/agents/{orchestrator,builder,designer,reviewer,reviewer-readonly,sourcer,framer}.md
grep -c '^### Step '     .claude/agents/*.md
grep -c '^- \*\*DO NOT'  .claude/agents/*.md

# §5.2 — every out-of-grant tool mention, and its file's grant
grep -nE '`(Read|Write|Edit|Bash|Glob|Grep|Task|WebSearch|WebFetch|NotebookEdit)`' .claude/agents/*.md

# §1.3 — the skills that clamp
grep -rl '^allowed-tools:' .claude/skills/*/SKILL.md

# §5.1 — the MCP servers actually configured
cat .mcp.json
```

The five pattern rules and `PS-RETURN-EXAMPLE-MATCHES` were measured with a throwaway harness rather than by
hand. Their patterns are written out in full in §6.5 and §5.4 precisely so the implementing agent reproduces
the numbers from this document rather than from a script that is not in the repository.

---

## What this standard does not cover

- **Which skills each engine gets.** [agents/SKILLS.md](SKILLS.md) owns that — 6-8 per agent, plus the
  builder's two-layer index. In passing: the seven currently carry 1-3, which is that document's gap and not
  this one's.
- **`effort:` policy.** No engine declares it, so all seven run at the runtime default, and whether the
  frontmatter field is honoured is untested (§1.5). `PS-EFFORT-ENUM` validates the value if present and
  claims nothing more. Choosing values per engine is a separate decision with its own evidence requirement.
- **The roster migration itself.** The founder's decision of 2026-08-16 **keeps `framer`**. The engines are
  `orchestrator` · `builder` · `designer` · `reviewer` · `reviewer-readonly` · `sourcer` · `framer`, with
  `instrument` and `operator` shipping as files whose grants are withheld. This standard is the gate on that
  migration, not the plan for it — and it governs the `instrument` and `operator` files from the moment they
  exist, grants or no grants, because a withheld grant is still a declaration.
- **Entry prompts** under `.claude/entry/`. They are a sixth channel with different reach, and the false
  constraint named in §5.3 lives in one of them. They should come under this standard; sequencing that is a
  separate change.
