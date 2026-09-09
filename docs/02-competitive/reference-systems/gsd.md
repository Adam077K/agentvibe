# Reference system: GSD Core (open-gsd/gsd-core)

Studied from the vendored checkout at
`/private/tmp/claude-501/.../scratchpad/refs/gsd` (a single-commit shallow
clone, HEAD `05092ff3` dated 2026-09-01). All counts below were derived with
shell commands against that checkout, not read off the README.

---

## 1 · WHAT

GSD Core is a meta-prompting / context-engineering / spec-driven-development
framework that drives AI coding agents through a fixed five-step phase loop
(Discuss → Plan → Execute → Verify → Ship), keeps all state as files under
`.planning/`, and installs itself across 14+ AI coding runtimes (Claude Code,
Codex, OpenCode, Antigravity, Cursor, Windsurf, Cline, and more). Built and
maintained by the `open-gsd` GitHub org under the `@opengsd/gsd-core` npm
package (MIT license); the brief that assigned this report cites ~58K GitHub
stars, which was not independently re-checked here (no network access).
Scale, counted directly: **35 agents** (`agents/*.md` — `docs/ARCHITECTURE.md`
itself still says "33", which is stale against the code), **71 slash
commands** (`commands/gsd/*.md`), **71 skill directories** (65 concrete +
6 namespace routers, `skills/gsd-*`), **46 capability manifests**
(`capabilities/*/capability.json`: 19 runtime adapters, 5 external-reviewer
CLIs, 22 feature flags), **89 ADRs** (`docs/adr/`), **228 compiled source
modules** (`src/*.cts`), **892 test files**. Maturity: npm `1.12.0` as of
2026-08-30 per `CHANGELOG.md`, 20 tracked releases since `1.2.0`
(2026-05-31) — roughly weekly over ~3 months — with issue/PR references
running past `#4125` in that same file. `CONTRIBUTING.md` alone is 83KB.
This is not a toy: it is a heavily tooled, CI-gated, mutation-tested product
whose own build system (lint scripts, generators, drift checks) is larger
than many of the projects it's meant to help ship.

---

## 2 · THE SPINE

**The phase**, materialized as three files: `.planning/ROADMAP.md` (the
ordered list of phases and their status), `.planning/STATE.md` (current
position, decisions, blockers, metrics — "living memory"), and
`.planning/phases/XX-phase-name/` (per-phase artifacts: `CONTEXT.md`,
`RESEARCH.md`, `PLAN.md`, `SUMMARY.md`, `VERIFICATION.md`, `UAT.md`). Every
workflow, agent, and command reads and writes this state through one CLI:
`gsd-core/bin/gsd-tools.cjs` (a single 249KB file), invoked as `gsd_run` —
every workflow's first executable step is `gsd_run query init.<workflow>`.
If forced to name one file, it's `gsd-core/bin/gsd-tools.cjs`; the thing
that file exists to protect is `.planning/STATE.md`. The contested part of
that protection — STATE.md carries the same fact in both YAML frontmatter
and markdown body, body is authoritative — has a single named owner,
`src/state-transition.cts`'s `FIELD_CLASSIFICATION` table (compiled to
`gsd-core/bin/lib/state-transition.cjs`), which assigns each field a
`preservation` policy (`preserve-when-unchanged` / `preserve-always` /
`preserve-if-placeholder` / `derive`) so a re-derive from the body can never
silently clobber a field it wasn't supposed to touch. Concurrent writers
(parallel executors in one wave) are serialized with a real lockfile
(`STATE.md.lock`, `O_EXCL` atomic creation, 10s stale-lock timeout,
spin-wait with jitter) — `docs/ARCHITECTURE.md` §"The STATE.md Write Path".

---

## 3 · ANSWER THESE TEN

**1. Goals that outlive a session.** Three tiers, all in `.planning/`:
`PROJECT.md` (vision, constraints, decisions, evolution rules — the
project's own north star), `REQUIREMENTS.md` (scoped requirements, v1/v2/
out-of-scope), and `ROADMAP.md` (phase breakdown with status). All three are
plain markdown, git-committed, human-editable. Templates at
`gsd-core/templates/{project,requirements,roadmap}.md`.

**2. The loop.** `/gsd:autonomous` (`gsd-core/workflows/autonomous.md`, 842
lines) drives all remaining incomplete phases — or a `--from N`/`--to N`/
`--only N` range — through discuss → plan → execute per phase, re-reading
`ROADMAP.md` after each phase to pick up dynamically inserted phases. It is
**always human-started** (a slash command or skill invocation) — no daemon,
cron, or self-retrigger exists anywhere in the codebase. It stops on: full
completion of the phase range; any `checkpoint:decision` or
`gate="blocking-human"` checkpoint (never auto-approved, even in `--auto`
mode); or, in the optional cross-AI convergence path, a `--max-cycles` cap
or stall detection (issue count not decreasing between iterations —
`gsd-core/references/gates.md` Revision Gate). Circling is prevented by
bounded iteration counts everywhere a revision loop exists (plan-checker:
max 3 iterations) rather than by a global step budget.

**3. Workers.** Agents differ by domain-and-shape of work, not by a shared
taxonomy field: researchers (parallel fan-out, 4-way), planners, checkers
(bounded revision loop), executors (wave-parallel, one per `PLAN.md`),
verifiers (sequential, adversarial), auditors (security/UI), mappers,
debuggers — see the category table in `docs/ARCHITECTURE.md` §Agent Model.
Frontmatter schema (YAML): `name`, `description`, `tools` (explicit list,
including MCP wildcards like `mcp__context7__*`), `color`. Example:
`agents/gsd-executor.md` grants `Read, Write, Edit, Bash, Grep, Glob, Skill,
mcp__context7__*`; `agents/gsd-security-auditor.md` grants only
`Read, Bash, Glob, Grep, Skill` (no Write — "the auditor does NOT write any
files"). Verifier- and auditor-class agents additionally carry a body
`<adversarial_stance>` block that states the null hypothesis explicitly and
enumerates named failure modes (see STEAL #5).

**4. Tools/capabilities.** Expressed purely as the `tools:` YAML list per
agent file (item 3). **Enforcement is not GSD's** — no hook in `hooks/*.js`
restricts a tool call by agent identity; it is delegated entirely to the
host runtime's native subagent mechanism (Claude Code's `Task` tool honors
`tools:` frontmatter on its own). GSD's own hooks (`gsd-workflow-guard.js`,
`gsd-read-guard.js`) are advisory, opt-in, and orthogonal — they guard
edit-scope and read-before-write, not tool grants.

**5. Memory.** Project-scoped, file-based, git-committed, no expiry:
`STATE.md` (current position/decisions/blockers), `CONTEXT.md` per phase
(discussed decisions), `MILESTONES.md` (completed-milestone archive),
`threads/` (persistent context threads), `seeds/` (forward-looking ideas),
`debug/knowledge-base.md` (persistent debug learnings). Nothing here
expires or is auto-pruned — completion just moves things into
`MILESTONES.md`. Optional **cross-session, cross-project** memory exists as
a feature flag, off by default (`capabilities/mempalace/capability.json`,
`mempalace.enabled: false`): the MemPalace MCP/CLI files verbatim artifacts
into "rooms" (`decisions`/`planning`/`milestones`/`problems`) of a "wing"
(project), plus a temporal knowledge graph, written by `gsd-mempalace-curator`
at phase boundaries and read via a deliberate-recall skill
(`skills/gsd-mempalace-capture/SKILL.md`, `skills/gsd-mempalace-recall/`).

**6. Context management.** Layered and explicit: (a) every spawned subagent
gets a fresh context window, nothing accumulates across steps
(`docs/ARCHITECTURE.md` Design Principle 1); (b) workflow files carry
tiered, enforced byte-budget ceilings (XL 90,000 / LARGE 54,000 / DEFAULT
38,000 bytes, `tests/workflow-size-budget.test.cjs`) under a **tighten-only
ratchet** — a ceiling may only shrink over time; (c) progressive disclosure
— large workflows extract per-mode bodies into `modes/*.md` and
`templates/*.md`, `Read` only when that mode is active, never eagerly
`@`-imported (`gsd-core/workflows/discuss-phase/` is the canonical example);
(d) two-stage hierarchical skill routing — 6 namespace meta-skills front the
~65 concrete skills on non-recursive-loader runtimes, cutting the eager
listing from ~67 entries to ~6 (`docs/ARCHITECTURE.md` #2792); (e)
context-window-aware read depth — under 500K tokens read frontmatter only,
at ≥500K full bodies are permitted (`gsd-core/references/context-budget.md`);
(f) a 4-tier degradation monitor (PEAK/GOOD/DEGRADING/POOR) that forces
behavior change, not just a warning, at 70%+ usage, backed by a live hook
(`hooks/gsd-context-monitor.js` injects warnings at 35%/25% remaining).

**7. Quality.** Mostly findings, not scores, with one real scored artifact
and one hard deterministic gate. `gsd-plan-checker` reviews `PLAN.md` in a
bounded revision loop (max 3 iterations, stall detection). `gsd-verifier`
does goal-backward verification and explicitly distrusts its own inputs:
"Do NOT trust SUMMARY.md claims... your starting hypothesis: tasks
completed, goal missed" (`agents/gsd-verifier.md`) — output is
`VERIFICATION.md`, findings not a score. `gsd-security-auditor` returns a
structured tri-state verdict (`SECURED` / `OPEN_THREATS` / `ESCALATE`)
against a declared threat model, read-only, no patching
(`agents/gsd-security-auditor.md`). `gsd-ui-auditor`/`gsd-ui-checker` do
produce scored output (`UI-REVIEW.md`). The one hard deterministic floor in
the user-facing loop is the **Package Legitimacy Gate**: a registry-API
verdict (npm/PyPI/crates.io) on every package a plan wants to install —
`SLOP`-verdict packages are removed from the plan outright, `SUS`/`ASSUMED`
are flagged and force a `gate="blocking-human"` checkpoint before install
(`docs/ARCHITECTURE.md` Phase Execution Flow). Who can block: any of the
above route into escalation gates that pause for a human; nothing in
`--auto`/`--chain` mode can auto-approve a `gate="blocking-human"`
checkpoint (`gsd-core/references/checkpoints.md`). Separately, GSD's own
codebase (not what it hands users) enforces a real deterministic floor on
itself — c8 coverage gate at 70% lines/60% branches and Stryker mutation
testing at 80%/60% thresholds, both in CI (`package.json` `test:coverage`,
`test:mutation`; `stryker.config.mjs`).

**8. Second opinion.** Real, not simulated: `/gsd:review` and
`/gsd:plan-review-convergence` (`gsd-core/workflows/review.md`,
`plan-review-convergence.md`) shell out to **actually-installed
competing-vendor CLIs** as independent reviewers — detected with
`command -v gemini|codex|coderabbit|qwen|cursor-agent|kimi` and invoked as
real subprocesses — covering Gemini, Codex, CodeRabbit, Qwen Code, Cursor,
Kimi CLI, OpenCode, Antigravity, Ollama, LM Studio, llama.cpp. The
convergence loop is plan → external review → replan on findings →
re-review, bounded by `--max-cycles` (default 3) with stall detection,
feature-gated off by default (`workflow.plan_review_convergence`). This is
a genuine multi-vendor panel — the review is not Claude grading itself.

**9. Cost/tokens.** No dollar-cost ledger anywhere; the enforced currency is
context-window percentage and file byte-count, not spend. Model choice is
tiered (`model_profile`: `quality`/`balanced`/`budget`/`adaptive`/`inherit`)
mapping each of 12 primary agents to opus/sonnet/haiku, with 3-layer
override precedence (per-agent > per-phase-type > profile table,
`gsd-core/references/model-profiles.md`). The byte-budget ceilings and
context-degradation tiers (Q6) are the actual enforcement; there's also a
documented pre-phase MCP-schema audit checklist (disable unused MCP servers
— can cost 20k+ tokens/turn each) but that's advisory, not gated.

**10. Human control.** Checkpoints live inside `PLAN.md` tasks themselves
(`checkpoint:human-verify`, `checkpoint:decision`, `checkpoint:human-action`)
carrying a `gate` attribute: `gate="blocking"` (default — auto-approved
under `--auto`/`--chain`) vs `gate="blocking-human"` (never auto-approved,
enforced at two independent layers so the orchestrator can't paper over the
executor's refusal — `gsd-core/references/checkpoints.md`). Default mode
(`human_verify_mode=end-of-phase`, #3309) batches mid-flight verify
checkpoints into one end-of-phase `UAT.md` review specifically to avoid
paying a full subagent cold-start per checkpoint; decision/action
checkpoints are unaffected by that batching. Control is synchronous within
the same terminal session — the workflow halts and prints the checkpoint
inline; no separate notification channel (Slack/email/etc.) exists in
`hooks/`. `UAT.md` is the final human-authored acceptance record before
Ship — a person, not a model, has the last word.

---

## 4 · STEAL

**1. Cross-vendor CLI review panel.** `gsd-core/workflows/review.md` +
`plan-review-convergence.md`: probe for installed competitor CLIs with
`command -v gemini`, `command -v codex`, `command -v coderabbit`, `command
-v qwen`, `command -v cursor-agent`, `command -v kimi`; for each present,
invoke it as a real subprocess against the plan/diff and collect its
findings into `REVIEWS.md`; feed that back into a replan step; repeat,
bounded by `--max-cycles` (default 3) with stall detection (issue count not
shrinking between cycles → escalate). Solves exactly the gap agentvibe's
own CLAUDE.md names ("no non-Anthropic model reachable from inside Claude
Code") by shelling out to whatever the user actually has installed, rather
than requiring an API integration.

**2. Two-tier checkpoint gate that survives full automation.** A checkpoint
task carries a `gate` XML attribute with exactly two values:
`gate="blocking"` (auto-mode may auto-approve it) and `gate="blocking-human"`
(auto-mode must never auto-approve it, full stop —
`gsd-core/references/checkpoints.md`). Enforced at two independent points
on purpose: the producing agent (`gsd-executor`) refuses to auto-approve a
`blocking-human` checkpoint regardless of caller instructions, and the
orchestrator's checkpoint-handling step is required to honor that refusal
rather than dispatching on checkpoint *type* alone — closing the specific
hole where an orchestrator that only looked at type would silently
auto-approve the very checkpoint the executor just refused. Directly
reusable for "irreversible-tier" work that must never be nodded through by
an unattended run.

**3. Byte-budget ratchet + forced progressive disclosure for prompt files.**
Every workflow/agent markdown file has a byte ceiling by role tier (XL
90,000 / LARGE 54,000 / DEFAULT 38,000 — `docs/ARCHITECTURE.md`
"Progressive disclosure for workflows", enforced by
`tests/workflow-size-budget.test.cjs`), and the ceiling can only shrink
over time (tighten-only ratchet), never grow. The structural rule paired
with it: extract per-mode bodies to `<workflow>/modes/<mode>.md` and shared
prose to `<workflow>/templates/`, and `Read` them only when that mode is
actually active — an `@`-import inside a conditional still counts as
eager-loaded and fails the budget's intent even if it passes the byte
count. A mechanical, testable answer to "how do you stop agent prompts from
growing forever."

**4. Package Legitimacy Gate.** Before a plan is allowed to install any
dependency, a registry-API check (npm/PyPI/crates.io, pluggable adapters —
`src/package-legitimacy.cts`) returns a verdict per package: `OK` / `SUS` /
`SLOP`. `SLOP` packages are removed from the plan outright, not flagged;
`SUS`/`ASSUMED` are flagged and force a `gate="blocking-human"` checkpoint
before install. A deterministic, non-LLM defense against hallucinated
package names ("slopsquatting") — worth taking wholesale for any workflow
where an agent chooses its own dependencies.

**5. Adversarial "FORCE stance" prompting on judgment-class agents.**
`agents/gsd-verifier.md` and `agents/gsd-security-auditor.md` both open
their role with the null hypothesis stated as a command — "assume the phase
goal was not achieved / threats are open until [specific evidence]
proves otherwise" — followed by a named list of failure modes ("how
verifiers go soft": trusting SUMMARY.md bullets, accepting file-exists as
behavior-verified, treating one grep match as full coverage). Zero
infrastructure cost; directly portable into any reviewer/verifier agent
prompt in `.claude/agents/*.md` or `.claude/review-lenses.yml`.

---

## 5 · REJECT

**14-runtime abstraction as a permanent, first-class surface.**
`bin/install.js` (~10,700 lines) translates every workflow, agent, and hook
into 14+ runtimes' native formats (`docs/ARCHITECTURE.md` §Runtime
Abstraction). The maintenance tax shows directly in their own history: a
runtime (Gemini CLI) had to be forcibly retired when the vendor
discontinued it (`CHANGELOG.md`, see ABANDONED #1), and two further
runtime-in-core requests were declined outright
(`.out-of-scope/crush-runtime-in-core.md`,
`.out-of-scope/omp-runtime-in-core.md`) alongside a standing policy of "not
accepting new add-ons as first-party... full stop"
(`.out-of-scope/codex-native-plugin-skips-preproposal.md`). Agentvibe
targets one runtime. Don't build N-runtime translation until something
forces it — it is expensive to build, more expensive to keep in sync, and
GSD's own paper trail is a record of walking that expense back.

**Duplicated executable boilerplate, papered over with sync tooling instead
of avoided.** The `gsd_run` launcher shim
(`gsd-core/workflows/_runtime-launcher.snippet.sh`) is copy-pasted
byte-for-byte into workflow `.md` files because prompt markdown has no
include mechanism that survives to inference time — verified count:
`grep -rl '_GSD_SHIM_NAME="gsd-tools.cjs"' gsd-core/workflows/` returns
**101** files. GSD's answer is a dedicated sync script
(`scripts/sync-runtime-launcher.cjs`) plus a parity test to catch drift —
functional, but it means 101 independent copies of identity-verification
logic (`GSD_IDENTITY_STATUS`) have to be kept in lockstep by tooling rather
than by construction. GSD is itself mid-migration off this pattern toward
build-time composition (`<!-- gsd:section -->` markers, ADR-1671) — treat
that migration, not the snippet-duplication it's replacing, as the pattern
worth copying.

**A 40+-step lint chain concatenated with `&&` in one `package.json` line.**
`lint:ci` is a single string chaining `node scripts/lint-*.cjs` more than
40 times. This is exactly the "two implementations disagree and you find
out during the incident" failure class agentvibe's own CLAUDE.md already
names from its own `check:mc`/step-count history — a flat `&&`-chain has no
single owner and is fragile to a step silently going missing from the
count, with nothing that would notice. Prefer a runner that enumerates and
reports its own step list (as agentvibe's `scripts/run-checks.mjs` now
does) over a shell chain, even when every individual script in the chain is
sound.

---

## 6 · ABANDONED

**Gemini CLI as a first-class runtime** — built, then removed when Google
discontinued it (2026-06-18): `npx gsd-core --gemini` now prints a
deprecation notice pointing to Antigravity CLI, the anointed successor
(`CHANGELOG.md`, "Removed the sunset Gemini CLI runtime"). Lesson: don't
couple architecture permanently to a third-party CLI's continued existence.

**The `verify-phase` workflow** — ~40KB shipped to every runtime install,
never wired to any command, agent, or skill. Its still-useful verification
gates (decision-coverage validation, test-quality audit, infra-phase
human-verification scoping) were rescued into a reference the verifier
agent actually loads; the dead file was deleted; a new reachability lint
was added so a shipped-but-unloaded workflow now fails CI
(`CHANGELOG.md`, #1891/#3422). Lesson: unreferenced prompt content doesn't
error the way unreferenced code does — it needs its own "is this ever
loaded" check or it silently ships as bloat indefinitely.

**Golden-install-parity snapshot fixtures + per-file size baselines**
(`npm run gen:golden`, `UPDATE_GOLDEN`, `npm run size:baseline`) — an
entire committed-fixture regression-testing approach for detecting
unintended changes to shipped content, replaced by one differential test
that reasons about the diff instead
(`tests/emitted-attribution.test.cjs`, `CHANGELOG.md` #2724/#2767), needing
zero manual fixture regeneration when shipped content legitimately
changes. Lesson: snapshot/golden-fixture testing for generated artifacts
creates ongoing regeneration toil that a diff-aware check can supersede.

**`runtime.hostBehaviors.reviewerCli` capability field** — a special-cased
config field for wiring a reviewer CLI, deprecated once every runtime
capability could just declare a normal `reviewer` body instead; kept as a
silently-ignored alias for one release with a build/install-time warning
(`CHANGELOG.md` #2801/#3272). Lesson: collapse special-case fields back
into the general schema rather than let them accumulate.

**Worth noting, distinct from true abandonment:** `.out-of-scope/` (12
files) is a standing practice of writing down *rejected proposals with
their reasoning* before any code is built — e.g.
`.out-of-scope/agent-template-rendering.md` records a "wontfix — closed on
the technical merits" decision against rendering agent definitions from
templates at install time, with the counter-argument spelled out. This
isn't a deletion of shipped work, but the same discipline in a cheaper
form: a durable, greppable record of what was considered and why it wasn't
built, so the question doesn't get re-litigated from scratch a year later.
