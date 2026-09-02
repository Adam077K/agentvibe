# Reference System: Metaswarm

Source: `dsifry/metaswarm`, studied as a local checkout (single squashed commit, `33d39f7`, dated
2026-06-19; no usable git history — maturity is read from `CHANGELOG.md` instead). Version at study
time: **0.12.0**. All paths below are relative to the repo root unless stated otherwise.

---

## 1 · WHAT

Metaswarm is a markdown-defined multi-agent SDLC framework distributed as a **plugin** for three
coding CLIs — Claude Code, Gemini CLI, Codex CLI — rather than as a standalone program. Counted
directly: **19 agent files** (`ls agents/*.md`), **14 skills** (`ls skills/`, each a `SKILL.md` with
YAML frontmatter), **16 commands** (`ls commands/*.md`), **9 rubrics** (`ls rubrics/`). These four
counts match what `.claude-plugin/plugin.json` and `gemini-extension.json` self-report — the
project's own numbers are accurate. `CHANGELOG.md` records **19 releases**, 0.1.0 → 0.12.0; the
project began as an `npx metaswarm init` file-copy CLI (0.1.0–0.6.0), became a Claude Code
marketplace plugin (0.9.0), then added native Gemini and Codex targets (0.10.0–0.12.0). It has no
implementation of its own issue tracker or knowledge engine — both are delegated to an external
plugin, BEADS (`steveyegge/beads`, `bd` CLI), acknowledged explicitly in `README.md`'s credits, and
it builds on a second external skills framework, `obra/superpowers`, for brainstorming/TDD/plan-writing.
Metaswarm's own code is thin: `lib/sync-resources.js` (a co-location/drift checker), `hooks/session-start.sh`,
two TypeScript scripts, four shell adapters, and 158 markdown files carrying the actual behavior.

---

## 2 · THE SELF-IMPROVEMENT LOOP — and it is mostly not a mechanism

**Trigger: none is automatic.** No hook and no git event fires reflection. `hooks/hooks.json` wires
exactly two events — `SessionStart` and `PreCompact` — both to `hooks/session-start.sh`, which does
knowledge **priming** (`bd prime`), not capture. Self-reflection is invoked by an agent following a
prose instruction inside `skills/orchestrated-execution/SKILL.md:717` ("## 8.5. Pre-PR Knowledge
Capture (MANDATORY) ... run `/self-reflect`"), with `skills/pr-shepherd/SKILL.md:391-413` as a
post-merge fallback if that step was skipped. "MANDATORY" here means "the skill text says so" — there
is no test, hook, or CI step that checks it happened. `README.md:164` markets this as "After every PR
merge, the self-reflect workflow... analyzes what happened," which is not what the code does: the
primary path is explicitly **pre**-PR (`SKILL.md:733`, "By the time a PR is merged, the implementing
agent's context may be gone... Capture them now"). Believe the skill file, not the README line.

**What is captured — the schema is real, and it's a template stub.** `knowledge/README.md` documents
the JSONL record:

```json
{
  "id": "fact-abc123",
  "type": "api_behavior|code_quirk|pattern|gotcha|decision|dependency|performance|security",
  "fact": "Clear description of the knowledge",
  "recommendation": "What to do about it",
  "confidence": "high|medium|low",
  "provenance": [{"source": "coderabbit|human|agent|documentation|test|production", "reference": "PR #123", "date": "2026-01-09"}],
  "tags": ["api", "rate-limiting"],
  "affectedFiles": ["src/lib/services/example.ts"],
  "affectedServices": ["ExampleService"],
  "createdAt": "2026-01-09T12:00:00Z", "updatedAt": "2026-01-09T12:00:00Z",
  "usageCount": 0, "helpfulCount": 0, "outdatedReports": 0
}
```

The real example shipped in `knowledge/decisions.jsonl` is the only non-comment line in that file:

```json
{"id":"decision-example-001","type":"decision","fact":"Example: Chose Zustand over Redux for client state management because of simpler API and smaller bundle size.","recommendation":"Use Zustand stores for client state. Use TanStack Query for server state. Do not mix the two patterns.","confidence":"high","provenance":[{"source":"human","reference":"Architecture decision","date":"2026-01-09"}],"tags":["architecture","state-management","zustand"],"affectedFiles":["src/stores/**/*.ts"],"affectedServices":[],"createdAt":"2026-01-09T00:00:00Z","updatedAt":"2026-01-09T00:00:00Z","usageCount":0,"helpfulCount":0,"outdatedReports":0}
```

Every one of the seven `knowledge/*.jsonl` files (`wc -l` → 4 lines each: 2 comment lines + 1 schema
comment + 1 example) is in this state — the repo ships the **container**, never a populated store; a
project's real knowledge base only exists after `/self-reflect` has actually run against it.

**How disagreement is detected — this is the single most important finding, and the answer changed
mid-repo.** A real, non-trivial regex classifier exists: `scripts/beads-fetch-conversation-history.ts`
(and its copy at `skills/setup/scripts/`) parses `~/.claude/projects/{encoded-path}/*.jsonl` session
transcripts and tags each user message against five pattern sets — `CORRECTION_PATTERNS`,
`DISAGREEMENT_PATTERNS`, `CLARIFICATION_PATTERNS`, `DISCOVERY_PATTERNS`, `DECISION_PATTERNS` (lines
122–173). Disagreement, specifically, is `/\bI\s+disagree\b/i`, `/\bI'd\s+prefer\b/i`, `/\bthat\s+doesn't\s+(seem|sound|make sense)\b/i`,
etc. — real code, real confidence tiers, genuinely mechanical.

**But it is not wired into the command that ships.** `.claude/commands/self-reflect.md` (a
self-hosted dogfood copy the maintainers use on their own repo) still calls this script in its "Phase
B: Conversation History Mining." The canonical, distributed `commands/self-reflect.md` — the file that
`.claude-plugin/plugin.json` actually ships and every skill/command reference resolves to — has
**dropped the invocation entirely**. Its Phase B reads: "Analyze current context window and
optionally historical sessions for implicit insights," backed only by a markdown table of patterns to
look for (`| "I disagree", "I'd prefer", "But what about" |`). `grep -rln
beads-fetch-conversation-history` across every `.md` in the repo turns up only docs (`USAGE.md`,
`skills/setup/SKILL.md`, two template files) that describe the script as one that gets copied into a
target project's `scripts/` folder — never one that gets called. **The mechanism exists in the repo
as dead code; the shipped self-reflect command detects disagreement by asking a model to notice it in
its own context window, unaided.** This is exactly the "prose instructing a model to notice" case the
brief asked me to flag, and it is worse than that: a working detector was built once and then quietly
orphaned when Phase B was rewritten to "(Optional)."

Everything else in the loop is equally prose-driven and unenforced. `agents/knowledge-curator-agent.md`
specifies deduplication as pseudocode ("if similarity > 0.8: merge provenance... else: append") — no
similarity function exists anywhere in the repo; it's an instruction for the agent to judge similarity
itself. `commands/self-reflect.md`'s "Conflict Resolution" table (new-supersedes-old / keep-both /
ask-user) is the entire contradiction-handling policy, applied at write time by the reflecting agent's
own judgment — nothing re-checks it later. There is no test file anywhere under `tests/` that touches
`self-reflect`, `knowledge-curator`, or the JSONL schema (`tests/` covers only the installer, hooks,
CI templates, and cross-platform sync — infrastructure, not behavior).

**Retrieval and growth bound.** Retrieval is `bd prime` (see §3) or, manually, `grep -l "<keyword>"
.beads/knowledge/*.jsonl` (`knowledge/README.md`). There is **no cap, no expiry, no decay** anywhere
in the codebase — `grep -rn "max.*entries|cap|prune"` across `knowledge/` and the curator agent
returns nothing. `usageCount`, `helpfulCount`, and `outdatedReports` are schema fields with no reader
or writer in any script — `grep -rln` for all three across `*.ts|*.sh|*.js` matches only the two
agent-definition markdown files that declare the schema, never code that increments them. "Weekly
maintenance" and "staleness detection" in `agents/knowledge-curator-agent.md:198-244` are a prose
job description ("Check for stale facts... not referenced in 90 days") with no scheduler behind it —
`.github/workflows/` contains one file, `ci.yml`, which runs installer/hook/sync tests only; there is
no cron, no scheduled workflow, no `@beads curate` dispatcher. As of 0.11.0 the one piece of custom
summarization code the project did write (`scripts/beads-self-reflect.ts`) was deleted and replaced
with a bare reference to `bd compact`, a command belonging to the external BEADS plugin whose
semantics are not defined anywhere in this repo — "how compaction works" is now entirely outside
metaswarm's own source.

**Verdict:** the self-improvement loop's honest description is: a human-in-the-loop workflow step
(`/self-reflect`, invoked by prose instruction, most reliably pre-PR) that asks a model to read PR
comments and its own context window and write JSONL entries by hand-written heuristics, with no
enforcement that the step ran, no automated dedup, no expiry, and one genuinely mechanical piece
(the regex disagreement classifier) that is present in the repo but disconnected from the shipped path.

---

## 3 · SELECTIVE PRIMING — the filter is not in this repo

`commands/prime.md` documents `bd prime --files <globs> --keywords <terms> --work-type
<planning|implementation|review|debugging|recovery>` and shows example output ("MUST FOLLOW / GOTCHAS
/ PATTERNS / DECISIONS / API BEHAVIORS," "_25 facts loaded for this context_"). But `bd` is the
external BEADS binary — as of 0.11.0, `CHANGELOG.md:11` states plainly: "Metaswarm now defers to the
standalone beads plugin... for context priming, semantic summarization, and config management." There
is no filtering algorithm, relevance scorer, or ranking code inside metaswarm; `--files`/`--keywords`/
`--work-type` are CLI flags passed through to a binary this repo does not ship or implement. The
repo's own contribution to "selective priming" is: (a) the JSONL schema fields (`tags`,
`affectedFiles`, `affectedServices`) that give `bd` something to filter on, (b) the markdown
documentation of the flag interface, and (c) `hooks/session-start.sh`, which calls plain `bd prime`
(no filter args) automatically on `SessionStart`/`PreCompact` — gated by `command -v bd`, so on a
machine without BEADS installed, priming silently does nothing (`bd_output=$(bd prime 2>/dev/null ||
true)`).

**Token-savings claim: present, not substantiated.** `README.md:181-189` claims "the knowledge base
can grow to hundreds or thousands of entries without consuming context window. Agents get precisely
the facts they need — the 5 critical gotchas for the files they're about to touch, not the entire
institutional memory." No number, percentage, or measurement backs this anywhere in the repo — `grep
-rn "token"` across `README.md`, `USAGE.md`, `GETTING_STARTED.md`, `commands/prime.md`, and
`skills/start/SKILL.md` returns zero savings/percentage claims. It is a qualitative claim about an
external tool's behavior that this repo cannot verify from inside itself.

---

## 4 · REVIEW GATES

Two gates, structurally identical, no shared code — each is a `SKILL.md` with `auto_activate: true`
and semantic `triggers:` in its frontmatter (Claude Code's skill-activation heuristic; not a hard
block — nothing prevents an agent from skipping a skill whose trigger phrase it doesn't happen to emit).

**Design Review Gate** (`skills/design-review-gate/SKILL.md`) — fires after `superpowers:brainstorming`
produces `docs/plans/*-design.md`. Spawns **5** fresh `Task()` subagents in parallel: Product Manager,
Architect, Designer, Security Design, CTO (prompts at `SKILL.md:135-` onward). Each returns a
structured `ReviewResult` (`agent`, `verdict: APPROVED|NEEDS_REVISION`, `blockers[]`,
`suggestions[]`, `questions[]`, plus agent-specific fields like the PM's `use_case_analysis` or
Security's `threat_model`). Gate logic (`SKILL.md:110-122`): all five `APPROVED` → proceed; any
`NEEDS_REVISION` → consolidate feedback, iterate, **max 3 iterations**, then escalate to the human with
a summary of remaining blockers (override/defer/cancel).

**Plan Review Gate** (`skills/plan-review-gate/SKILL.md`) — fires after a plan is drafted. Spawns
**3** fresh `Task()` reviewers: Feasibility, Completeness, Scope & Alignment, each with a table of
BLOCKING vs WARNING checks (e.g. Feasibility: fabricated file paths = BLOCKING, verified via
glob/grep). Binary `PASS`/`FAIL` per reviewer, no scores. Same combination rule: all `PASS` → gate
approved, present to user; any `FAIL` → planner reads all feedback, fixes-or-rebuts each finding with
evidence, **entirely fresh** `Task()` instances are spawned for re-review (explicitly: "New reviewers
see ONLY the revised plan and original request — NOT previous findings" — anchoring-bias avoidance is
a named design goal). **Max 3 iterations**, then an `## ESCALATION REQUIRED (3/3 iterations exhausted)`
block is emitted with an iteration-history table and four options for the human (Override / Revise /
Simplify / Cancel). On approval, the plan is persisted to `.beads/plans/active-plan.md` with a
`gate-iterations` count in a comment header (`SKILL.md:396-413`).

**Mechanism, precisely.** The `await Promise.all([Task(...), ...])` blocks in both skill files are
TypeScript-flavored pseudocode, not executable code — they map to a real Claude Code capability (the
`Task`/`Agent` tool can be called multiple times in one turn to run subagents in parallel), so the
gate is real in the sense that following the skill's instructions produces genuinely independent
parallel subagent reviews. But nothing enforces that the orchestrating agent follows the skill:
`auto_activate`/`triggers` are a prompting hint, not a hook. `find tests -type f` turns up 7 test
files, all infrastructure (installer, session-start hook, CI template, sync-resources) — **zero tests
touch either gate's spawn count, verdict combination, or 3-iteration cap.** Compare to agentvibe's own
`gate-logic.test.mjs`, which pins this repo's QA verdict logic in code; metaswarm has no equivalent.

---

## 5 · TASK STATE

Metaswarm does not implement an issue tracker; it is a markdown-instruction layer over **BEADS**
(`bd`, `github.com/steveyegge/beads`), a fully external plugin. There is no `.beads/` directory
committed in this repo (dogfooding would need it installed locally) and no `bd` implementation code
anywhere under `lib/`, `scripts/`, or `bin/` — `grep -rln steveyegge` finds only prose acknowledging
the dependency. What metaswarm's own skills add on top of `bd` is a **file-based context contract**,
all under git-tracked `.beads/`:

- `.beads/plans/active-plan.md` — the gate-approved plan, with an HTML-comment header
  (`<!-- status: in-progress -->`, `<!-- gate-iterations: N -->`) written by `plan-review-gate` after
  user approval.
- `.beads/context/project-context.md` — completed work units, established patterns, tooling; updated
  after each work-unit commit (per `README.md`'s design principles list).
- `.beads/context/execution-state.md` — current work unit, phase (`IMPLEMENT|VALIDATE|REVIEW|COMMIT`),
  retry count.
- `.beads/knowledge/*.jsonl` — the fact store (§2).

**Compaction survival, mechanically:** `hooks/hooks.json` fires `session-start.sh` on both
`SessionStart` (`startup|resume|clear|compact`) and `PreCompact`. On either, if `.metaswarm/` is
already set up and no standalone BEADS plugin is separately priming, it runs bare `bd prime` and
injects the output as `hookSpecificOutput.additionalContext` in the hook's JSON response — this is a
real, mechanical re-injection, not a suggestion. `commands/prime.md`'s "Context Recovery" mode
(`--work-type recovery`) is the documented **manual** fallback: read `active-plan.md` +
`project-context.md` + `execution-state.md` + all `knowledge/*.jsonl` back into context — described as
triggering "when an orchestrator detects it lost context," which, absent a hook, means the
orchestrating agent has to notice on its own and choose to run it.

---

## 6 · CROSS-RUNTIME

One directory of markdown — `agents/*.md` and `skills/*/SKILL.md`, both YAML-frontmattered and
provider-agnostic — is the single source of truth. Each of the three CLI targets consumes it
differently, and the mapping is **not** generated uniformly:

| Target | What ships | How it's produced | Source of truth |
|---|---|---|---|
| Claude Code | `.claude-plugin/plugin.json` + `commands/*.md` + `skills/` (native) | Skills/commands used directly as markdown | The markdown itself |
| Gemini CLI | `gemini-extension.json` (`contextFileName: GEMINI.md`) + `commands/metaswarm/*.toml` | **Hand-maintained** `TOML_COMMAND_MAP` object in `lib/sync-resources.js:87-` — one entry per command, each with an independently-written `description`/`prompt` string that re-describes what to do; `generateTomlContent()` renders it to TOML | The JS map, not the Claude markdown — no code reads `commands/*.md` to build the map |
| Codex CLI | `.codex-plugin/plugin.json` (`"skills": "./skills/"`) + `.agents/plugins/marketplace.json` | The `skills/` directory is symlinked wholesale into `~/.agents/skills/` by `.codex/install.sh`; skills are invoked by their `SKILL.md` `name:` field (e.g. `$start`) | Same `SKILL.md` files as Claude, unmodified |

So the real "one definition, many runtimes" story is at the **skill** layer (Codex reuses `SKILL.md`
files verbatim via symlink), not the **command** layer (Gemini's TOML is a parallel, hand-written
re-expression that a CI check, `node lib/sync-resources.js --check` in `.github/workflows/ci.yml`,
only verifies is internally consistent with its own map — it cannot detect that the map has drifted
from what the Claude command actually says, because nothing diffs the two).

**What it takes to add a second model family: nothing agent-specific.** No agent or skill file pins a
model. `grep -rn "gpt-|gemini-|claude-[0-9]|model:"` across every `*.json`/`*.toml` in the repo matches
only the word "gemini" inside package metadata strings — never a model identifier. Gemini CLI and
Codex CLI call Google's and OpenAI's models respectively by virtue of being different CLI harnesses;
installing `gemini-extension.json` or running `.codex/install.sh` is sufficient to run the identical
agent/skill definitions against a different model family, because the definitions never referenced
Claude in the first place. The **only** work of "porting" is the Gemini TOML re-authoring described
above, and that is prompt-plumbing, not model-targeting.

A second, distinct cross-model mechanism exists mid-session: `skills/external-tools/` (real bash, not
prose — `adapters/_common.sh`, `codex.sh`, `gemini.sh`) lets a running Claude Code session shell out to
`codex`/`gemini` CLIs as delegated implementers or adversarial reviewers, with an escalation chain
(Model A, 2 tries → Model B, 2 tries → Claude, 1 try → alert user) documented in `README.md:17` and
`CHANGELOG.md` (0.6.0). This is orthogonal to running the whole framework under a different CLI — it's
one CLI borrowing another's model for one task.

---

## 7 · STEAL

1. **Regex-classified transcript mining for user pushback**, `scripts/beads-fetch-conversation-history.ts:122-173`.
   Five labeled pattern arrays (`CORRECTION_PATTERNS`, `DISAGREEMENT_PATTERNS`, `CLARIFICATION_PATTERNS`,
   `DISCOVERY_PATTERNS`, `DECISION_PATTERNS`), each an array of `RegExp` tested case-insensitively
   against every `user`/`external` message in a Claude Code session JSONL (`~/.claude/projects/<encoded-path>/*.jsonl`),
   first-match-wins across the five sets in that priority order, tagged with a confidence tier
   (correction/discovery = high, disagreement/clarification/decision = medium). Reimplementable in an
   afternoon: parse the same JSONL format (`entry.type === "user" && entry.userType === "external"`,
   text via `entry.message.content`), run the regex sets, emit `{type, userMessage, sessionId,
   timestamp, confidence}`. The lesson to take along with the mechanism: metaswarm built this and then
   let it go unwired (§2) — reimplement it, but also wire it into whatever runs the actual capture step,
   and add a test that fails if that wiring is ever removed.

2. **Fresh-instance, no-cross-visibility parallel review with a hard iteration cap**,
   `skills/plan-review-gate/SKILL.md:77-104` and `skills/design-review-gate/SKILL.md:110-129`. The
   concrete rule worth lifting: on any FAIL/NEEDS_REVISION, spawn **entirely new** reviewer instances
   with zero memory of prior findings (named anti-pattern #1 in the plan-review skill: reusing
   instances causes anchoring bias — a reviewer starts checking whether previous findings were
   addressed instead of judging fresh). Cap at 3 rounds; escalate with a full iteration-history table
   (`| Iteration | R1 | R2 | R3 |` verdict grid) and named human options (Override/Revise/Simplify/Cancel)
   rather than a bare "review failed."

3. **A machine-checkable co-location/drift map**, `lib/sync-resources.js`. `RUBRIC_SYNC` and
   `GUIDE_SYNC` are declarative `{src, dests[]}` arrays; `hashFile()` normalizes line endings and
   trailing whitespace before SHA-256 hashing so the check isn't defeated by CRLF/whitespace noise;
   `--check` mode fails CI if any destination has drifted from its source. Cheap, general pattern for
   "this file is intentionally duplicated into N places, and CI must prove they still match" — directly
   applicable to agentvibe's own rubric/lens duplication if any exists.

4. **A single generator function guaranteeing docs match a JS source-of-truth map**,
   `lib/sync-resources.js:144-171` (`generateTomlContent` + `checkTomlCommands`). The pattern —
   derive the artifact from code at write time, re-derive-and-diff at check time, fail CI on mismatch
   — is more trustworthy than the artifact-matches-artifact-manually pattern it uses for the Claude→Gemini
   command mapping itself (§6's own critique). Worth stealing the *pattern*, not the specific
   Claude-markdown → hand-written-JS-map instance.

5. **Recovery-mode context reconstruction as a named, triggerable mode**, `commands/prime.md`'s
   `--work-type recovery` section: an explicit list of what "lost context" means operationally (active
   plan file with `status: in-progress`, project-context file, execution-state file) and a fixed read
   order to reconstruct it. Small, but the naming discipline — a distinct mode with a distinct output
   format, rather than folding "recover" into ordinary priming — makes it something a hook or command
   can target precisely.

---

## 8 · REJECT

- **`auto_activate: true` + semantic `triggers:` as the entire enforcement mechanism for a "mandatory"
  gate.** Both review gates and the pre-PR knowledge capture step are described as mandatory in prose
  but enforced by nothing — no hook blocks progress, no test checks the gate ran, no CI step verifies a
  PR's design/plan actually passed 5-agent or 3-agent review. This is the precise failure mode
  agentvibe's own `CLAUDE.md` already names and fixes structurally (`ENFORCED` vs `ADVISORY` rule
  table, `qa-lead-pass.yml` blocking on a verdict file) — don't reintroduce it by copying metaswarm's
  skill-trigger pattern as if the trigger were the enforcement.
- **Unbounded JSONL knowledge files with no cap, expiry, or dedup code.** Every safeguard (staleness,
  90-day flags, similarity-based merge) is a paragraph asking an agent to remember to do it, never code
  that runs. agentvibe's own memory system (`DECISIONS.md` byte caps, `evict-memory.mjs`, archive
  rotation) is already a stricter and more honest design than anything in metaswarm's knowledge base —
  do not regress toward metaswarm's version.
- **Marketing claims that don't match the shipped command.** `README.md`'s "After every PR merge"
  description of self-reflect (§2) and its unqualified "the system flags these as candidates for
  automation" for user-repetition detection are not what `commands/self-reflect.md` currently does.
  Don't import README-level framing without checking it against the current skill file — this repo is
  itself the cautionary example.
- **A three-way runtime port that silently allows the ports to diverge.** The Gemini TOML map (§6) is
  re-authored by hand and only checked for self-consistency, not against the Claude source it claims
  to mirror. If agentvibe ever targets a second CLI, generate the second target's artifact
  programmatically from the one canonical file, not from a parallel hand-maintained map.
- **Depending on an external tool for a claim's substantiation, then repeating the claim as fact.** The
  token-savings claim (§3) is asserted about `bd`'s behavior, which this repo cannot verify from
  inside itself. Don't publish a savings number (or a savings claim without a number) for a mechanism
  you don't own and haven't measured.

---

## 9 · ABANDONED

From `CHANGELOG.md`'s only explicit `### Removed` section (0.11.0) and surrounding `### Changed`
entries:

- **`scripts/beads-self-reflect.ts`** — metaswarm's own custom summarization script for closed BEADS
  issues, deleted in 0.11.0 and replaced by a bare reference to the external `bd compact`. This is the
  project voluntarily giving up ownership of a piece of its self-improvement mechanism in favor of an
  unversioned dependency on another project's CLI semantics.
- **`templates/beads-config.yaml`** and its two setup-skill copies** — custom BEADS configuration
  templates, removed the same release because "beads plugin manages its own configuration" —
  consistent with the broader 0.11.0 shift from "metaswarm owns BEADS integration" to "metaswarm
  documents how to use the standalone BEADS plugin."
- **Conversation-history-driven self-reflection, as a *wired* feature** (not in the changelog by name,
  found by code archaeology in §2): the regex classifier script was kept, but the step in
  `commands/self-reflect.md` that called it was cut down to prose-only "(Optional)" analysis of the
  current context window. Not announced as a removal anywhere — the changelog only documents what was
  *added* in the same commits; this is exactly the kind of quiet capability loss the brief asked me to
  catch by reading code over docs.
- **The npm-install distribution model** — 0.7.0 made `npx metaswarm init` a "thin bootstrap" (3 files)
  pointing at an interactive setup skill instead of a 60+-file copy; 0.9.0 deprecated the npm package
  entirely in favor of the Claude Code plugin marketplace, then 0.10.0 un-deprecated and repurposed the
  npm package as a cross-platform installer (`init`/`setup`/`detect`) once Gemini/Codex needed a
  platform-detecting entry point that isn't a Claude Code plugin. Three distinct distribution strategies
  tried and discarded/repurposed within the version history available.
