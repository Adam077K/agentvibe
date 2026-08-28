# Agentvibe — Project Context
*Auto-loaded by Claude Code on every session.*

> This is a TEMPLATE adapted from the Beamix agent system (2026-05-16 rethink baseline). Replace every `{{PLACEHOLDER}}` and the "Project State" section before first use. See [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md).

---

## The Team

> **Superseded (Phases 1–4a).** This section described a 3-layer C-suite org: CEO at the top, then
> seven C-suite roles (CTO, CPO, CMO, CBO, QA-Lead, Research-Lead, Design-Lead), then thirteen Layer 3
> workers — twenty-one named roles total. Ten had no agent file at all; eleven existed only as routing
> shims. Zero resolved to a real engine directly. The collapse is documented in
> [AGENTS.md §What replaced what](AGENTS.md).

This project runs on **seven engines**. Domain expertise is a lens, not an agent.

| Engine | Distinct because |
|--------|-----------------|
| **orchestrator** | Entry point — owns state and the human boundary |
| **framer** | Fuzzy → structure → options → decision |
| **sourcer** | Evidence and research; never asserts without it |
| **builder** | Artifact in isolation → structured return |
| **designer** | Perception loop: render → look → iterate |
| **reviewer** | Read-only review, out of band |
| **reviewer-readonly** | Review with no shell (used by the binding QA gate) |

Eleven shim files (`ceo`, `qa-lead`, `code-reviewer`, `security-engineer`, `design-lead`,
`research-lead`, `researcher`, `ai-engineer`, `database-engineer`, `technical-writer`,
`test-engineer`) also exist to shadow drifted global copies — routing stubs, not team members.
Phase 9 removes them.

**Slash commands:** `/build` `/fix` `/design` `/review` `/daily` `/plan` `/ship` `/audit` `/research`
**Identity:** `/color [name]` · `/name [session-slug]` — set at the start of every session.

See [AGENTS.md](AGENTS.md) for the full routing table and [.claude/agents/](.claude/agents/) for canonical agent definitions.

---

## Skills Library

**134 curated skills** at `.claude/skills/[skill-name]/SKILL.md`, in 7 namespaces. Every cut and every
reversal is recorded in [CURATION.yml](.claude/skills/CURATION.yml) with the test that made it, and
`npm run check:curation` fails when the directory drifts from that decision.

**Discovery is two-tier — start at the routers, not the manifest:**

```
Step 1: Read .claude/skills/routers/INDEX.md — six namespaces, one line each (~370 tokens)
Step 2: Read the ONE namespace that matches (~700 tokens)
Step 3: Load 3-5 matching SKILL.md files (orchestrator, leads) · 2-3 (workers)
```

Reading `MANIFEST.json` whole cost **~15,000 tokens across 147 entries** and grew with every
skill added, so a good new skill made every unrelated task more expensive. A typical lookup is
now **~1,070 tokens**. The manifest remains the exhaustive index and is what `check:manifest`
verifies — it is not where a lookup starts. Never `ls | grep`.

Skills load **on demand only** — never preload.

---

## Lenses — the encoded expertise, as data

| File | Holds | Linted by |
|------|-------|-----------|
| [.claude/lenses.yml](.claude/lenses.yml) | Domain procedure: how to *produce* work in business, customer, growth, product, engineering, research, design — plus `evidence`, which every engine inherits | `schema-lint.js` |
| [.claude/review-lenses.yml](.claude/review-lenses.yml) | Review dimensions: how to *judge* it — correctness, security, adversarial, craft, evidence, scope | `schema-lint.js` |

Prose rots; a linted data file cannot. Fifteen of twenty-six agent files failed their own validator before
Phase 1 — the expertise was real and the container was not holding it. The linter checks **content**, not
only shape: a vague step ("looks reasonable") with no measurable anchor fails, a placeholder fails, and a
lens citing a `sources:` file that does not exist fails.

A review lens marked `independent: true` must name **≥2 distinct model families** — the same predicate that
governs `risk: high` claim panels, shared from `scripts/lib/claims.js` rather than written twice.

---

## Playbooks — the operating standard

Six seed playbooks at [.claude/playbooks/](.claude/playbooks/): `ship-feature` ·
`launch-landing-page` · `price-a-product` · `validate-a-market` · `design-pass` ·
`research-question`.

A playbook declares the **stages** a category of work passes and the **claims and criteria required to exit
each**. It **never declares method** — the engine picks its own path inside a stage, and `schema-lint.js`
refuses a stage carrying `steps:`, `how:`, `method:` or `implementation:`. Without that rule a playbook drifts
back into the pipeline prose it replaced.

Every reference resolves or the lint fails: `review(lens=X)` against `review-lenses.yml`, `claim(kind=K,
verified_by=V)` against the ledger's own kinds and resolvers.

**Slash commands are invocations, not descriptions.** `/build` `/fix` `/ship` `/design` `/research` each name
a playbook and stop. The pipeline is described once, in the playbook — `/build` alone previously restated it
in 50 lines, which is two descriptions of one pipeline, and two descriptions of one thing disagree silently.

**Capabilities are real or absent.** **Two** agents declare `mcpServers`: `designer` granted
`[playwright]`, and `sourcer` granted `[claim-append]` as of #112 — `.mcp.json` backs both. Derive it,
do not read the number here: `grep -n 'mcpServers' .claude/agents/*.md` and check each name against
`Object.keys(require('./.mcp.json').mcpServers)`.

> **Superseded 2026-08-28.** This read *"Exactly one agent declares `mcpServers`: `designer`"*, and the
> wave-one train falsified it two paragraphs' worth of argument later than it falsified the count. Note
> what `sourcer`'s grant is and is not: it appends a claim through one audited server, and its `tools:`
> line is still `[Read, Glob, Grep, WebSearch, WebFetch]` — **no `Write`, no `Edit`**. A capability
> narrow enough to name is the point; "sourcer can write now" is the wrong summary of it.

> **Superseded 2026-08-20.** This line read *"No agent declares `mcpServers`"* — true when written, false
> since the browser grant landed, and it sat beside a ledger claim asserting that same grant is live. Two
> statements about one capability, disagreeing. The original point stands, and is why the count is one
> rather than fifty-two: all 52 agents once declared the field while no MCP config existed anywhere, so it
> granted nothing.
 `schema-lint.js` now fails any declaration that no configuration
backs. The **`reviewer`** engine carries no `Write` or `Edit`: an agent that can edit what it reviews
will review what it can edit. Before Phase 4b, five per-agent read-only reviewers enforced this rule; the
collapse into `reviewer` made it structural.

---

## Stack

> Replace this block with your actual stack. The defaults below were inherited from the source project and are reasonable starting points; agents reference them when generating code.

```
Frontend:   Next.js 16 (App Router), React 19, TypeScript strict, Tailwind, Shadcn/UI
Backend:    Next.js API Routes / Server Actions, Zod validation on all inputs
Database:   Supabase (auth, DB, RLS)
Payments:   Stripe        # e.g., Paddle / Stripe / LemonSqueezy
Email:      Resend          # e.g., Resend / Postmark / SendGrid
Jobs:       Inngest           # e.g., Inngest / Trigger.dev / Temporal
Hosting:    Vercel
AI:         OpenAI, Claude, Gemini (direct API integration)
Memory:     Mem0 (primary) + Anthropic Memory Tool (auto-fallback after 3 retries)
```

---

## Memory

| File | Purpose | Updated by |
|------|---------|-----------|
| `.claude/memory/DECISIONS.md` | Architecture & strategy decisions, append-only, 50-entry cap · 40,000-byte cap (**byte cap binds**) | Any agent making a decision affecting others |
| `.claude/memory/DECISIONS_ARCHIVE*.md` | Evicted entry bodies, one capped volume per file. Written only by `scripts/evict-memory.mjs` | The eviction tool — never by hand |
| `.claude/memory/CODEBASE-MAP.md` | Key files, patterns, tech debt | code-reviewer |
| `.claude/memory/USER-INSIGHTS.md` | Customer language, pain phrases, JTBD | `orchestrator` (only authorized writer) |
| `.claude/memory/LONG-TERM.md` | Cross-session facts: user prefs, recurring patterns | `orchestrator` after each session |
| `docs/08-agents_work/sessions/` | Engine session summaries (`YYYY-MM-DD-[engine]-[task].md`) | Each engine (write at task close) |

**Hard caps:** DECISIONS.md ≤ 50 entries AND ≤ 40,000 bytes — **the byte cap binds, and the entry cap will
never fire.** LONG-TERM.md ≤ 100 lines. Session summaries ≤ 10 lines each. Every archive volume is capped
at the same 40,000 bytes, **per volume**, not in total.

**Ask the checker, do not read a number here:** `node scripts/check-memory-budget.mjs`.

> **Superseded 2026-08-26.** This paragraph carried a worked arithmetic — "39,909 bytes at 23 entries", a
> "marginal cost of 1,735 bytes per entry", "35,952 bytes over 24 headings", a 1,470-byte all-entry mean, a
> 1,849-byte real-entry mean, and the conclusion that the cap fires on the **27th** entry. It then advised,
> two sentences later, *"recompute with `node scripts/check-memory-budget.mjs` rather than quoting them."*
> Every one of those figures was stale by the time you are reading this, the 27th entry had already landed,
> and the file's own advice is what is kept. Frozen arithmetic in prose rots; a command does not.

**When the cap is close, eviction is a tool, not a judgement call.** `node scripts/evict-memory.mjs plan`
classifies every entry and prints the **net** bytes each eviction would actually free — the entry minus the
stub that replaces it, which is smaller than the entry and much smaller for a heavily-cited one. `apply`
performs it. Four rules, all mechanised in `scripts/lib/memory-entries.js` and pinned by mutation in
`scripts/evict-memory.test.mjs`: an `irreversible` entry is never archived while its subject exists; an
entry whose `Affects:` targets are all gone is archivable on sight; anything cited by a live claim is
pinned; and every archival leaves a stub under the original heading, so a citation by date or by title
still resolves. **Never hand-edit an entry out of the file** — the tool refuses what these rules forbid and
checks that no byte was lost, and a manual move does neither.

**The archive rotates and nothing is ever deleted to meet a cap.** `DECISIONS_ARCHIVE.md` is volume 1;
volumes 2+ are `DECISIONS_ARCHIVE_002.md`, `_003.md`, … The 40,000-byte cap applies to each volume
independently and bounds **what one reader must load**, never the lifetime total — a cap on the lifetime
total of an append-only decision log is a mechanism for losing decisions. `check-memory-budget.mjs` finds
volumes by pattern, so a new one is governed the moment it exists.

---

## Models (May 2026)

| Tier | Model | Use for |
|------|-------|---------|
| Opus 5 | `claude-opus-5` | Six engines — `orchestrator`, `sourcer`, `builder`, `designer`, `reviewer`, `reviewer-readonly` |
| Sonnet 5 | `claude-sonnet-5` | `framer` |
| Haiku 4.5 | `claude-haiku-4-5` | Simple/lookup — test runs, lint, log parsing, classification |

> **Superseded 2026-08-20.** These rows read `claude-opus-4-7` and `claude-sonnet-4-6`. Both identifiers are
> retired, and `scripts/prompt-standard.test.mjs` pins the valid set to `claude-opus-5`, `claude-sonnet-5`,
> `claude-fable-5`, `claude-haiku-4-5` — so an agent following this table wrote a brief that **failed a
> blocking lint**. The rows are now derived from what the seven engine files declare. `claude-fable-5` is
> valid and currently unused.

`orchestrator` specifies the model in every brief. Other engines default to Sonnet if unspecified.

---

## Risk-Tiered QA Gate (4-tier)

Every PR is risk-tiered. **No merge without `qa-lead` PASS.** No orchestrator session can override it.

| Tier | Trigger | Review pipeline | Required label |
|------|---------|-----------------|----------------|
| **Trivial** | Typo, single-line, comment-only | `.github/workflows/ci.yml` only (schema-lint + gate tests + registration check) | none |
| **Lite** | Isolated feature, < 300 LOC, no API/DB/auth | `reviewer` + semgrep | `risk:lite` |
| **Full** | API/DB/auth/billing touched, ≥ 300 LOC | Lite + `reviewer` (security lens) + Codex CLI second opinion | `risk:full` |
| **Irreversible** | DB migration, workflow file, agent definition, billing flow | Full + 2-of-3 multi-judge + Founder sign-off | `risk:irreversible` |

Auto-classification: [.claude/qa-tier-floor.yml](.claude/qa-tier-floor.yml), read through
[scripts/lib/classifier.js](scripts/lib/classifier.js) — **one file computes the tier of a path.** Query it
with `node scripts/classify.mjs <paths...>`, or ask whether a diff needs the binding gate with
`npm run gate`.

This line used to read *"one file computes risk, and it is the only implementation."* **It was not true**, and
it cost a PR split to find out: the `risk:irreversible` step in
[qa-lead-pass.yml](.github/workflows/qa-lead-pass.yml) computed a second, stricter answer and demanded
`tier: full|irreversible` on session files the classifier tiers `trivial`. The two are reconciled as of
2026-08-16 — that step now requires the tier on **at least one** session file rather than all of them — but
the claim is stated narrowly now, because the broad version is exactly the kind of sentence that reads as
enforcement while nothing checks it. `scripts/classify.mjs`'s own header warned about this before it
happened: *"Two implementations of risk classification will disagree, and you find out during the incident."*

[.github/workflows/ci.yml](.github/workflows/ci.yml) **blocks** on schema-lint, the gate tests, the manifest
check, the registration check, the launcher guard rails, and the claim ledger.
[.github/workflows/qa-lead-pass.yml](.github/workflows/qa-lead-pass.yml) **blocks** as of Phase 3
(2026-08-11) — promoted out of shadow after running correctly across every PR of Phases 1 and 2. Per
[ADR-001](docs/03-system-design/adr/001-claim-ledger-as-enforcement-spine.md).

---

## Context Budget — Hard Limits

- `DECISIONS.md`: ≤ 50 entries AND ≤ 40,000 bytes — **the byte cap binds**; `scripts/check-memory-budget.mjs` enforces both
- `LONG-TERM.md`: ≤ 100 lines (compress quarterly)
- Session summaries: ≤ 10 lines each
- Agent handoffs: ≤ 500 tokens (summarize, never forward raw conversation)
- Skills per task: **3-5 for orchestrator · 2-3 for other engines** — never preload
- Pre-flight reads: cache as **one block** (avoid mid-session re-reads — they break 90% of prompt-cache savings)

---

## Cost Optimization

- `/clear` between unrelated tasks — saves 40-70%
- Sonnet 4.6 is the default — escalate to Opus only for synthesis, design, orchestration
- Haiku 4.5 for trivial subagent tasks
- Subagents run in isolated contexts — return summaries, not raw data dumps
- Use memory files (`.claude/memory/*.md`) for shared state, not handoff payloads

---

## Layer Contract — Hard Rules

> **Superseded (Phases 1–4a).** This section described a 3-layer layer contract (CEO → C-suite + Leads →
> Workers). Those layers no longer exist as distinct agent roles — they collapsed into seven engines. The
> contracts below are updated for the engine model.

### orchestrator
| DO | DO NOT |
|----|--------|
| Plan, ask, delegate, synthesize | Write source code |
| Structured briefs with all required fields | Vague "build the thing" |
| Validate engine returns (branch, worktree, files_changed, qa_verdict, session_file) | Accept returns missing required fields |
| Set `/color` + `/name` at session start | Run unnamed/uncolored |

### framer · sourcer · builder · designer
| DO | DO NOT |
|----|--------|
| Explore, plan, brief or produce within scope | Edit files outside stated scope |
| Use the right engine for each task | Do another engine's job to "save turns" |
| Verify branches via `git branch --list` | Trust summaries blindly |
| Write session file at task close | Complete a task with no session file |

### reviewer · reviewer-readonly
| DO | DO NOT |
|----|--------|
| One focused review per session | Write or edit the code under review |
| Return structured verdict (PASS/FAIL + evidence per lens) | Return vague "looks good" |
| Escalate when findings are outside the diff and severe | Auto-approve; the gate blocks |
| Atomic commits per logical change | Commit to `main` |

---

## Rules (All Agents)

**Every rule names the mechanism that enforces it.** A rule enforced only by this sentence is a wish, not a
rule — and this list previously had eight of them, zero enforced. `ENFORCED` rules fail something.
`ADVISORY` rules are honest about having no mechanism yet; each names the phase that gives it one.

| # | Rule | Mechanism |
|---|------|-----------|
| 1 | **Read before acting.** Glob/Grep before creating; check memory before deciding. | `ADVISORY` — **no mechanism, and none planned.** Phase 3 was supposed to give it one and did not: a ledger can check what you *assert*, not what you *read*. The enforceable half of this rule is rule 3 |
| 2 | **Own your domain.** Don't do another agent's work. | `ADVISORY` — no mechanism. Phase 4 (`tools:` scoping) |
| 3 | **Source claims.** No agent invents data. | **`ENFORCED`** for repo paths — `scripts/check-registration.mjs` (dead-path check) and `scripts/ledger.mjs` at `lint` (a claim citing a nonexistent ADR fails). **`SHADOW`** for external sources — the `claim-source` resolver fetches the URL and asserts the quote is present, logging `claim.would_block` |
| 4 | **Leave breadcrumbs.** Append to DECISIONS.md when choices affect others. | `ADVISORY` — nothing forces the append. What *is* enforced: a claim's `supports:` targets must resolve to a real ADR or a real claim, so a breadcrumb that is written cannot dangle |
| 5 | **Iterate, don't overwrite.** Understand existing code before replacing. | `ADVISORY` — no mechanism |
| 6 | **No placeholder UI.** Zero tolerance for stubs / TODOs in deliverables. | `ADVISORY` — no mechanism. Phase 4 (review lenses) |
| 7 | **Worktrees for code.** Every code worker creates a worktree. | **`ENFORCED`** (partial) — `.claude/hooks/schema-lint.js` warns when `isolation: worktree` lacks the worktree block |
| 8 | **QA gate is sacred.** No merge without QA-Lead PASS + user confirmation. | **`ENFORCED`** — `.github/workflows/qa-lead-pass.yml` blocks as of Phase 3, 2026-08-11. It ran in shadow through Phases 1–2, was correct every time, and adds no ceremony that the documentation gate did not already require |
| 9 | **Claims expire, and expiry forces a decision.** A durable claim carries `valid_until` or it is not a claim; when it comes due, exactly one disposition is recorded — Refresh, Deprecate, or Waive with a new deadline. | **`ENFORCED`** — `scripts/ledger.mjs` at `lint` fails a `global`/`project` claim with no expiry; `claim-freshness` fails it once the date passes; a `waive` with no `until` is refused by the schema, and a **lapsed** waiver fails harder than none. This is the rule that would have caught the nested-spawn fabrication |
| 10 | **A resolver never passes what it could not check.** | **`ENFORCED`** — `scripts/ledger.test.mjs` pins `unresolved` (offline, timeout, unjudged, disabled) as distinct from `pass` for every resolver |

Additionally enforced, and blocking today: agent schema (`schema-lint.js`), QA verdict logic
(`gate-logic.test.mjs`), skills manifest drift (`build-skills-manifest.mjs --check`), registration
completeness (`check-registration.mjs`), the launcher guard rails (`warroom-install.test.mjs`), and the claim
ledger — parser, classifier, resolvers, and index reproducibility (`npm run check:ledger`) — all run by
[.github/workflows/ci.yml](.github/workflows/ci.yml). Dangerous shell and `.env`/migration writes are blocked
in-session by [.claude/hooks/pre-tool-use.sh](.claude/hooks/pre-tool-use.sh) (`exit 2`).

**Shadow mode.** Claim failures are computed, written to `events.jsonl` as `claim.would_block`, and do not
fail the build — so the friction is measured rather than guessed. The exceptions block from day one, because
`git revert` does not undo them: **migration · deploy · harness self-edit**, marked `enforcement: block` in
[.claude/qa-tier-floor.yml](.claude/qa-tier-floor.yml). See
[CLAIM-LEDGER.md](docs/03-system-design/CLAIM-LEDGER.md).

---

## Git Worktree Protocol

> **Superseded 2026-08-24.** This block used to anchor child worktrees at the **main repository** —
> `MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')`, then
> `git -C "$MAIN_REPO" worktree add "$MAIN_REPO/.worktrees/[slug]"` — and closed with *"Never run
> `git worktree add` from inside a worktree without `-C $MAIN_REPO`."* Both instructions were wrong in the
> same way: **an agent's writes are scoped to its session project root, and `$MAIN_REPO` is above it.** An
> orchestrator here is itself always inside a worktree, so the documented path placed every child worktree in
> a *sibling* of the only root its own `Write`/`Edit` may reach. The `-C` sentence was the wrong rule for the
> right worry: what makes the command safe is the **absolute path**, not the flag.

```bash
# Anchor at YOUR OWN toplevel — never at the main repo. Run this from a cwd INSIDE the session
# project root (see the caveat below); `$MAIN_REPO` is above that root and is always wrong.
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# ⚠ THIS COMMAND STILL FAILS UNDER THE ARMED SANDBOX. Read the next block before running it.
git worktree add "$PROJECT_ROOT/.worktrees/[slug]" -b feat/[slug]
cd "$PROJECT_ROOT/.worktrees/[slug]"

# Atomic commits
git commit -m "feat(scope): description"
```

`.worktrees/` is gitignored.

> **The location above is corrected. The command is still not a working protocol — say so, do not
> discover it.** With `sandbox.enabled: true`, `git worktree add` cannot complete *anywhere*, including
> inside the project root. Measured 2026-08-24 at the corrected path: **exit 128**, 32×
> `error: unable to create file .claude/agents/<name>.md: Operation not permitted`, the same for
> `.claude/commands/*.md` and `.mcp.json`, then `fatal: Could not reset index file to revision 'HEAD'`.
> No worktree survived and the branch was left behind — `git worktree add` creates the branch before it
> checks out. The same command with the sandbox disabled: **exit 0, 809 files.**
>
> **Why:** a full checkout must write the agent-config paths, and the runtime protects those
> independently of this repo's configuration. It is not `permissions.deny` and not
> `~/.claude/settings.json`. **Adding them to the write allow-list does not lift it, and this has already
> been tried:** `sandbox.filesystem.allowWrite` in [.claude/settings.json](.claude/settings.json) already
> carries `**/.worktrees` and `**/.worktrees/**`, which match
> `…/.worktrees/<slug>/.claude/commands/`, and that path was still refused in the same session. Those two
> entries do not achieve what they were added for.
>
> **Remedy: escalate that one command.** Create the worktree with the sandbox disabled, then work inside
> it normally — the `Write`/`Edit` scoping this section fixes applies from then on, which is why the
> location correction still matters. Every worktree created in this session needed that escalation.
>
> Fixing this properly is a sandbox change, not a documentation change, and is tracked against
> [SANDBOX.md](docs/03-system-design/SANDBOX.md). **Until it lands, an agent that follows the corrected
> location and hits the wall has not made a mistake** — it has hit a known, measured limit. What would be
> a mistake is reporting the resulting partial tree as its own broken work.

> **Caveat on `--show-toplevel`.** It is correct **from any cwd inside the session project root** — which
> is where an agent always is — and that is the whole claim. It is *not* an unconditional truth: run it from
> **the main repository above your session root** (here, `…/VibeCoding/agentvibe`) and it returns *that*
> path, which is above the session root and reproduces the original defect exactly. The obvious hardening is unavailable: `CLAUDE_PROJECT_DIR`
> is **empty in an agent's Bash environment**, so it cannot be used as the anchor in a shell command even
> though `pre-tool-use.sh` reads it.

**Why: the write boundary is the session project root, not the repository.**
[.claude/hooks/pre-tool-use.sh](.claude/hooks/pre-tool-use.sh) permits `Edit`/`Write` under
`${CLAUDE_PROJECT_DIR:-$PWD}` plus two named exemptions, and the Bash sandbox's
`sandbox.filesystem.allowWrite` list in [.claude/settings.json](.claude/settings.json) — the field is
`allowWrite`; there is no `allowOnly` key — is anchored the same way. Measured 2026-08-24, one real
`Write` per row — the hook names the root itself when it refuses, and the root it named was
`…/.worktrees/ceo-1-1787566829`, a **worktree**, not `…/agentvibe`:

| Creating agent's project root | Child worktree path | Result |
|---|---|---|
| `…/.worktrees/ceo-1-1787566829` | `$MAIN_REPO/.worktrees/<slug>` — **the old protocol** | **refused** |
| `…/.worktrees/ceo-1-1787566829` | `$PROJECT_ROOT/.worktrees/<slug>` — the corrected protocol | allowed |
| a builder inside `…/.worktrees/pr5-systemic` | its own `$PROJECT_ROOT/.worktrees/<slug>` | allowed |

**Three consequences, all observed 2026-08-24, none theoretical:**

1. **Silent partial checkout — and the location fix does NOT cure this one.** `git worktree add` into a
   location it may not fully write leaves a tree holding `.git`, `.github` and one file under `scripts/` —
   no `package.json`, no `.claude/`, no `docs/`. `git status` there then reports ~800 *deletions* that read
   as the agent's own edits, and nothing inside such a worktree can diagnose it. The old location fails
   harder and earlier (`could not create leading directories`, zero files); the corrected location fails
   later, on `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`. **Both fail.** That is the sandbox
   wall documented above, and escalation — not relocation — is what clears it.
2. **False regressions.** `test:lenses` and `test:playbooks` failed in a sibling worktree and passed on the
   same commit (`db5bf45`) inside the project root — those tests write fixtures into the repo root. Two
   failures in one location, seven passes in the other, identical code.
3. **Divergence by tool, not by task.** One builder succeeded where two were refused, because it used `Bash`
   while they used `Write`/`Edit`. The hook gives `Bash` no path concept at all; only `Edit`/`Write` are
   root-scoped. Same instruction, opposite outcomes, and the difference was invisible to all three.

**Do not fix this by widening the hook.** The previous instance of this same `Bash`-vs-`Write` divergence
(issue #96.3, recorded in `pre-tool-use.sh` beside the allowed-roots loop) was *correctly* resolved by
widening the `Write` side with a third allowed root — `Bash` already had the scratchpad and `Write` was the
one in the wrong. Applying that template here inverts it: allowing `$MAIN_REPO/.worktrees` would put every
parallel session's tree inside every other session's write scope, so a subagent of `ceo-1` could overwrite
`ceo-2`'s work. **Two instances of one divergence, opposite correct resolutions** — which is the durable
lesson: this class has no single rule. When `Bash` and `Write` disagree about a path, decide which one is
right *for that path* and move the other to meet it.

And be clear about what this boundary is **not**. Two worktrees that share a root are mutually writable
**when the writing agent's own project root is that shared parent** — which is the normal case for
subagents of one session, and was measured that way the same day, by both tools. It is not a property of
the paths: drive the hook with a different `CLAUDE_PROJECT_DIR` and the same target path flips from allowed
to refused, because the rule is computed from the *writer's* root, not the target's. Either way the
conclusion holds — isolation between agents inside a session is a convention they keep, not a rule anything
enforces.

**This section now contradicts a live lint rule, deliberately and visibly.**
[.claude/hooks/schema-lint.js](.claude/hooks/schema-lint.js) warns when an agent that writes app code
declares `isolation: worktree` and its body does not carry the worktree-creation block, so the linter still
asks for the block this section supersedes. **Find the rule by what it tests, never by where it sits:**
`grep -n "fm.isolation === 'worktree'" .claude/hooks/schema-lint.js`.

> **Superseded 2026-08-24.** This passage said the linter "tests agent bodies for the literal string
> `MAIN_REPO=$(git worktree list`" and told you to *grep that string to find the rule*. **Grepping it
> returns nothing** — the source holds the regex-escaped form, not the literal — so the recovery
> instruction inside the very sentence forbidding line-number pins did not work either. The predicate
> above is the durable handle: it survives an edit above it, and it survives the pending rename of the
> string being tested.

It **warns**, it does not fail (`schema-lint` exits non-zero only on `failCount`), but
the repo holds itself to `18 pass · 0 fail · 0 warnings`, so the two cannot both stand. Three call sites
still teach the superseded form and are what a worker actually executes:
[.claude/agents/builder.md](.claude/agents/builder.md) (the creation block and the `-C "$MAIN_REPO"`
sentence), [.claude/agents/designer.md](.claude/agents/designer.md), and
[.claude/skills/worktree-isolation-pattern/SKILL.md](.claude/skills/worktree-isolation-pattern/SKILL.md)
— the last of which is marked superseded in place. The agent files and the lint predicate are **not** changed
here on purpose: both are `irreversible` tier and would raise a documentation fix's floor. They move together
in one follow-up PR, because changing the agent bodies without the predicate turns 0 warnings into 2.

---

## Agent Identity — Colors & Session Naming

### Color

> **Superseded.** The table below used to list colors by C-suite role (CTO, CPO, CMO, CBO, backend-engineer,
> frontend-engineer, devops-engineer, data-engineer, product-designer, design-critic, etc.). The roster
> collapsed in Phase 4b. Engine colors and the full assignment table are now in
> [.claude/commands/color.md](.claude/commands/color.md).

| Engine | Color |
|--------|-------|
| `orchestrator` (primary) | `gold` |
| `orchestrator` (parallel #2/3/4) | `orange` / `teal` / `lime` |
| `framer` | `cyan` · `sourcer` `purple` |
| `builder` | `blue` · `designer` `pink` |
| `reviewer` · `reviewer-readonly` | `gray` |

### Naming
```
orchestrator: /name orchestrator-[task-slug]   e.g., /name orchestrator-onboarding-flow
builder:      /name builder-[task-slug]        e.g., /name builder-rate-limit
reviewer:     /name reviewer-[task-slug]       e.g., /name reviewer-auth-audit
```

### Documentation Gate
No task is COMPLETE without a session file at:
```
docs/08-agents_work/sessions/YYYY-MM-DD-[role]-[task-slug].md
```
With frontmatter including `qa_verdict: PASS` and (when applicable) `tier: full|irreversible`.

---

## Project State

> This is the only section the agents read to know "where are we right now." It was an unfilled template
> through Phase 8a — eight phases shipped while it said "Sprint 1 — foundation." **If you change the phase,
> change this block in the same PR.**

- **THE BINDING GATE CAN COMPLETE NOW — 2026-08-24 · re-measured 2026-08-26 after the eight-merge train.**
  `npm run check` is now **49 of 49 steps · 0 failed · exit 0 with the sandbox armed**, measured on
  `fix/ci-chain-structure-holes` merged with `main`. *It read `46 of 46` at the head of the eight-merge
  train and that was correct there; 46 → 48 is the same KIND of move as 43 → 44 and not as 30 → 43 —
  `test:citations` and `check:citations-exist` are genuinely NEW work in the suite, not a renaming of work
  it already did. `docs/STATUS.md` §4 keeps that distinction and why it matters.* **Wall clock is a range so wide it carries almost no information —
  90 to 480s**, measured 137.6s and 273.5s on one tree minutes apart, and 180.2s then 480.0s on another
  the same day. It tracks how many lanes are
  building, not the suite. Read the tally and the exit code;
  see `docs/STATUS.md` §4. Derive the denominator, never quote it from memory:
  `node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"` → **49**. That counts the
  steps the suite actually runs, which is the one list — `scripts/lib/check-suite.js` owns it, and
  `test:check-suite` fails if `package.json` drifts away from it.
  *Superseded 2026-08-25: the derivation here was
  `node -e "console.log(require('./package.json').scripts.check.split('&&').length)"` → 30, and it now
  returns **1**. The same session replaced the `&&` chain with `node scripts/run-checks.mjs`, so it counts
  one runner invocation and hands back a plausible small integer instead of erring. A derivation that keeps
  working after it stops being true is worse than none, which is why the replacement names what it counts.*
  *Superseded 2026-08-25: the reading was "29 of 30 steps with the sandbox armed", the one failure being
  `check:mc`. `check:mc` is no longer a step — it is EXCLUDED with its measurement written down, because it
  fails under the armed sandbox wherever it runs (denied loopback `bind()`), and `.github/workflows/ci.yml`
  runs it as its own unsandboxed step instead. The denominator changed for that reason, not because
  anything was dropped out of it.*
  *Superseded 2026-08-24: this line read "29 of 29" and the P0 bullet below read "29 steps now". Both were
  wrong in the same way, and the provenance is the point.* The builder who did the work recorded **"29 of 30
  `check` steps pass; only `check:mc` fails"** and was right; the CEO synthesis that same day rendered it
  "29 of 29" — dropping the one failing step out of the denominator, so a partial pass read as a clean
  sweep — and *that* version is what propagated into this file and two handoffs. The worker measured
  correctly; the orchestrator's summary lost it. This repo already concluded that **the orchestrator's brief
  is a defect surface nobody reviews**; this is the second instance of it in one week.
  **The runner reports the tally itself now, and a single invocation is the whole coverage claim:** it runs
  every step whatever the ones before it did, names each failure with the command to reproduce it, and
  prints `Tally: N of M passed`. A partial run cannot wear the passing verdict — an interrupted run prints
  INCOMPLETE and names what never started, a subset run says SUBSET, and a zero-step run is REFUSED.
  *Superseded 2026-08-25: this read "the tally is per-step, and `npm run check` cannot itself report it: the
  script chains its 30 steps with `&&` and `check:mc` is step 21, so one invocation aborts there and the
  final 9 steps (`test:probe-readonly` through `test:sandbox`) never run." All three clauses are false as
  the tree now stands — there is no chain, `check:mc` is not a step at all, and the runner does report the
  tally. What it described was real: that is the defect `scripts/run-checks.mjs` was written to end, and the
  nine steps it named are pinned in `scripts/check-suite.test.mjs` so they cannot leave the suite quietly.*
  Before the fix it was 26 by that same per-step tally, and the gate BLOCKed on its own oracle for every
  diff: `test:skill-clamp` and `test:registration` built fixtures inside `.claude/agents/` and
  `.claude/hooks/`, which the armed sandbox denies. Two individually-correct changes — arming the sandbox
  (#94) and oracle-first ordering — collided, and nothing watched the seam. Fixed in `494c95b`, which also
  adds a preloaded tripwire that turns the next collision into a red test. **No step of the suite blocks it
  now.** *Superseded 2026-08-25: this read "One blocker remains — `check:mc` — and it is not a
  mission-control defect". It is still not a mission-control defect and it still fails under the sandbox;
  what changed is that it is no longer a step, so it no longer blocks `npm run check`. See the next bullet
  for the cause and `scripts/lib/check-suite.js` for where the coverage went.*
  **`.qa/verdicts/` is NOT empty and gate runs DO complete end to end** — `git ls-tree -r --name-only
  origin/main .qa | wc -l` → **50**, every one `verdict: PASS` — re-derived 2026-08-28 at `d1294a4`,
  50 files and 50 `PASS`, which is the whole of `.qa/`.
  *Superseded 2026-08-28: the figure read **23**, correct at the head of the eight-merge train. The
  wave-one train (#109–#117) more than doubled it and nobody edited the number. The command was already
  written down beside it and re-running it takes a second, which is the argument for keeping commands in
  this file rather than results.*
  *Superseded 2026-08-26: this read "`.qa/verdicts/` is still empty: no gate run has yet completed end to
  end." True when written, falsified by the merge train with nobody editing the sentence.* **Read the 50
  narrowly**: each is author-recorded against a deterministic floor, one agent, one model family, so the
  `irreversible`-tier requirement of 2-of-3 multi-judge and ≥2 model families is unmet on every one of
  them. Artifacts exist; the multi-judge panel has still never run. *The checks ran and are green* is not
  *the tier was satisfied*.
- **`check:mc`'s single failure is caused by the ARMED SANDBOX, not by mission-control — measured
  2026-08-24.** Two cells at the session root, same commit, same deps, Bun 1.3.10 in both:
  **sandboxed → 344 pass · 1 fail · exit 1** (`EADDRINUSE`, in the real-socket SSE test in
  `mission-control/test/stream.test.ts`); **sandbox disabled → 345 pass · 0 fail · exit 0**, zero
  `EADDRINUSE`. *This supersedes the reading that the failure was "deterministic and pre-existing" in
  mission-control, and the 2026-08-25 handoff's hypothesis of "a leaked server from an earlier test in the
  same file". Both are refuted by the second cell.* **Reproduced 2026-08-25 on `fix/pr5-review-fixes`,
  foreground and top level: sandboxed 344 pass · 1 fail · exit 1, sandbox off 345 pass · 0 fail · exit 0** —
  and note that the armed cell fails STANDALONE, not only nested, so there is no local workaround.
  Isolating one file makes it sharpest: `bun test test/stream.test.ts` alone is 9/1 sandboxed and 10/0
  unsandboxed, thirty seconds apart. *A first reading of the armed cell said 343 · 2, the extra failure
  being `crosscheck.test.ts` at its 120s timeout. It did not reproduce on a quiet machine (146s vs 206s for
  the same run) and is recorded here as load, not as a defect — mission-control's wall-clock checks flake
  when several lanes build at once, which this file already warns about further down.* `grep -rn 'Bun.serve' mission-control` finds exactly
  **one** server in the whole tree, it is stopped in a `finally`, and `port: 0` asks the kernel for an
  ephemeral port and so cannot collide. The reported error carries **`errno: 0`**, where a genuine macOS
  `EADDRINUSE` is errno **48** — a code synthesized by Bun, not one returned by the kernel. It is the
  sandbox denying a loopback `bind()`, surfaced under a misleading name.
  **Do NOT edit `stream.test.ts` to make this green.** It is a regression test for a real shipped bug that
  was found by running it; taking away its real socket would leave it vacuous — precisely the defect class
  this repo found and fixed last session.
  **No network allowance can fix it either.** The sandbox's network model is an outbound domain proxy and
  exposes **no setting for inbound or loopback binding** (Claude Code sandboxing documentation, accessed
  2026-08-24 — <https://code.claude.com/docs/en/sandboxing>); consistent with that, the `sandbox` block in
  `.claude/settings.json` carries only `filesystem` and has no `network` key at all. Fuller write-up:
  [SANDBOX.md](docs/03-system-design/SANDBOX.md).
- **The sandbox deny-set is PER SESSION ROOT, and this matters more than it sounds.** `.claude/hooks`,
  `.claude/skills` and `.claude/workflows` are denied at the session root and WRITABLE in a nested worktree.
  It hid half a finding three separate times on 2026-08-24 and produced four false "regressions". **Measure
  at the session root, never in a sibling worktree.**
- **`git worktree add` cannot complete anywhere under the armed sandbox** — exit 128, 32 denials across
  `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`. Adding those paths to `allowWrite` does not
  lift it: `**/.worktrees/**` already matches the refused path and it was refused anyway. That closes
  SANDBOX.md's two open acceptance questions. Escalation is required for that one command.
- **Known contradiction, deliberate and visible — and this is the state on `main` as of 2026-08-24.**
  `.claude/agents/builder.md` and `designer.md` still teach the superseded worktree command as Step 1, and
  `schema-lint.js` still REQUIRES it: the rule warns when an agent that writes app code declares
  `isolation: worktree` and its body lacks the worktree-creation block, so `lint:agents` is green only
  because those bodies still carry it. Find it by what it tests —
  `grep -n "fm.isolation === 'worktree'" .claude/hooks/schema-lint.js`.
  *Superseded 2026-08-24: this bullet pinned `schema-lint.js:1068`. That line is now
  `if (fm.skills !== undefined) {` — the pin had rotted, in the same file that warns prose line numbers rot.
  It is deliberately **not** replaced with the current number, because a corrected pin rots on the next edit
  above it.*
  Both irreversible tier. **A change that would resolve this contradiction is in flight in this session and
  has NOT landed on `main`** — it moves the agent bodies and the lint predicate together to the
  `PROJECT_ROOT` form. Do not read this bullet as resolved until someone reconciles it against `main` and
  says so here. Required follow-up with an exit criterion in
  [the handoff](docs/08-agents_work/handoffs/2026-08-25-after-the-gate-ran.md).
- **THE MERGE TRAIN LANDED 2026-08-26 — eight merges.** #106, #99, #101, #102, #103, #104, #105, #107.
  *Superseded 2026-08-28: the headline read "eight merges, **zero open PRs**", parenthesised
  "(`REPORTED`; branch state is not readable from here — the sandbox denies `~/.config/gh`)". Both halves
  went stale inside two days — a nine-PR wave landed on top of it, and an open-PR count is a fact about a
  moment, which no document can hold.* **Do not write an open-PR count into this file. Name the command:**
  `gh pr list --state open --json number,title`. It needs the sandbox lifted for that one invocation:
  `denyRead` covers `~/.config/gh`, so `gh` fails reading its own config before it reaches the network,
  and the failure is a config error rather than anything about the repository.
  **#77 was CLOSED, not merged**: it bound a verdict to a HEAD sha while `scripts/verdict.mjs` already
  binds by content hash, and merging it would have put two implementations of one check side by side —
  the defect this repo has hit before and names explicitly.
- **WAVE ONE LANDED 2026-08-28 — nine PRs, `47dbbd6` → `d1294a4`, 127 commits.** Derive the set rather
  than quoting it: `git log --oneline 47dbbd6..d1294a4 | grep -oE '\(#[0-9]+\)' | sort -u` → **#109
  through #117**, nine of them. CI on `d1294a4` is one job, *Deterministic checks*: **57 of 57 steps
  success, 0 failed, 0 skipped** — 49 suite checks plus 4 setup and 4 post steps, so do not read 57 as a
  count of checks. Taken from the jobs API and `jobs[].steps`, because `gh pr checks` has rendered a
  cancelled run as `fail` and a green branch as "no checks reported" in this repository.
  What each one changed:
  - **#109** binds the QA bypass to the diff it authorises, and its failure path was **observed on the
    runner**, not argued from the source.
  - **#110** stops a failed launch reading as success on the mission-control dispatch path. Until it
    landed, a dispatch that never happened reported like one that did.
  - **#111** settles `Workflow` reachability as containment rather than as a gap — see the Wave 2 bullet
    below, which is where the measurement lives.
  - **#112** gives `sourcer` a narrow MCP capability, `mcpServers: [claim-append]`, backed by `.mcp.json`.
    **It is not a `Write` tool, and that distinction is the whole design:** `sourcer`'s `tools:` line is
    still `[Read, Glob, Grep, WebSearch, WebFetch]`, so it can append a claim through one audited server
    and still cannot edit a file. Read both halves together or the grant looks larger than it is —
    `grep -n 'mcpServers\|^tools:' .claude/agents/sourcer.md`. Two agents now declare `mcpServers`,
    `designer` and `sourcer`, and `.mcp.json` backs both; the count in the Playbooks section above,
    written when it was one, moves with the config and not with this sentence.
  - **#113** turns `gate:` from a spelling allowlist into declarations something executes — see Wave 2 —
    **and it closes two thirds of the wiring gap in the same PR**, which is easy to miss from its title:
    `framer` went from **0 dispatch sites to 5**, and `/launch`, `/price` and `/validate` gave the three
    unnamed playbooks a trigger each, so all six are now reachable from a command. `docs/STATUS.md` §7
    carries the counts. The third part of that gap did **not** move: `coding.js`, `design.js` and
    `research.js` are still invoked by nothing.
  - **#114** closes the structure holes in `parseCiSteps` that let a chained step past the exit-code
    guard. The count, the eight shapes and the corrected mechanism are in the guard bullet below, which
    #114 wrote about itself; they are deliberately not restated here.
  - **#115** makes a refusal a terminal value distinct from a block. Before it, a gate that reviewed
    nothing was byte-indistinguishable from one that ran every reviewer and found defects.
  - **#116** makes `verdict.mjs` refuse an unknown flag **instead of performing the non-dry action**.
    A mistyped `--dry-run` was dropped in silence and the real thing ran, which is the worst direction
    for that class of mistake to fail in.
  - **#117** sweeps fixture position, so a fixture that passes only because of where it sits in a file
    now fails — and makes the suite **read its denominator before its verdict**, which is the same rule
    the preamble states about instruments generally.
  **The standing caveat applies to all nine and none of them discharges it:** each is author-recorded
  against a deterministic floor, one agent, one model family. `irreversible` asks for 2-of-3 multi-judge
  and ≥2 distinct model families; neither is met, because no non-Anthropic model is reachable from inside
  Claude Code. *The checks ran and are green* is not *the tier was satisfied*. Accepted risk, exit
  condition **2026-11-17**.
  **The sentence this wave earned, and it is a lane's rather than the orchestrator's:** *not one of the
  instrument failures this session was caught by reading.* Every one was caught by a control that
  disagreed with an expectation.
- **WAVE 2 IS CLOSED EXCEPT 2.7, WHICH IS THE FOUNDER'S.** Landed: 2.1 the
  deterministic oracle · 2.3 the first real verdict · 2.4 the external-judge seam (`claim-judge-external`
  is a registered, dispatchable resolver as of #103) · 2.6 `cmd_merge` opens a PR · **2.2 the gate
  declarations (#113)** · **2.5 the gate's reachability, settled as containment (#111)**.
  *Superseded 2026-08-28: this read "**WAVE 2 IS EFFECTIVELY CLOSED, with two items left**", and named
  them: "**Still open — 2.2 and 2.5, and they are one gap seen twice:** playbooks name `gate: qa-verdict`
  with **no implementation behind it**, and **no engine declares a `Workflow` tool**, so a dispatched
  engine cannot reach `qa.js` at all." It was one gap seen twice and it closed twice, in opposite
  directions — 2.2 by building the missing thing, 2.5 by establishing that the missing thing must stay
  missing.*
  **2.2 — `gate:` has an implementation behind it now (#113).** [.claude/gates.yml](.claude/gates.yml)
  declares **four gates: one `kind: command` (`qa-verdict`) and three `kind: human`**
  (`founder-approval`, `outbound-approval`, `migration-approval`), and `scripts/check-gates.mjs`
  resolves them — `npm run gates` for every finding, `check-gates.mjs resolve <id>` to run one. The
  **blocking** assertion is `scripts/gates.test.mjs`, run by `npm run test:playbooks`. Before it,
  `gate:` was a spelling allowlist in `schema-lint.js` and nothing more: a stage could name
  `qa-verdict`, run nothing, and every check in the repository stayed green.
  A `command` gate names its exact argv and treats **any exit other than 0 or 1 as `unresolved`, never
  as pass** — Rule 10, and `gates.test.mjs` pins the two apart for spawn failure, signal, and every other
  exit code. A `human` gate has no `run:` and writing one is refused. That is the load-bearing half:
  "a person must decide" and "nothing implements this" used to be the same string in the same array, and
  no reader could tell them apart.
  **A command gate VERIFIES; it does not PRODUCE, and reading it the other way is the failure the file
  warns about.** `qa-verdict` asks whether a PASS is committed and sha256-bound to this exact diff — a
  file lookup and a hash compare, no model in the loop, which is why it is safe behind an exit code. It
  does not run five dimension reviewers and a judge, and **nothing in `gates.yml` can**. Read
  `gate: qa-verdict` as the third step of *session runs the panel → session records the verdict → anyone
  checks the binding*, never as the first.
  **2.5 — the count is still ZERO and the meaning inverted (#111).** `grep -c '^tools:.*Workflow'
  .claude/agents/*.md` → **0 on all eighteen files**; positive control on the same arm,
  `grep -l '^tools:.*Task' .claude/agents/*.md` → `orchestrator.md`, so the grep can find a tool that is
  there. That zero was recorded here as a gap in reach. It is a **deliberate containment** now, enforced
  by `PS-WORKFLOW-CONTAINMENT` in `.claude/hooks/schema-lint.js` and probed by
  `scripts/probe-workflow-reach.mjs` (`npm run test:probe-workflow-reach`). **The gate may not be
  invocable by the thing it gates** — the same reason `reviewer` carries no `Write`. The measurement
  underneath: 0 of 55 recorded `Workflow` calls came from a sidechain, against 57,590 subagent `Bash`
  calls in the same scan. `Workflow` is a main-session tool; a dispatched engine that declared it would
  get a **silent no-op**, not an error, so a stage that made its engine run the gate would report success
  having gated nothing. **Do not delete the zero to tidy this up** — the zero is the guarantee, and what
  would overturn it is a `Workflow` call recorded with `isSidechain: true`, which is what the probe
  looks for.
  **Still open, and it is neither 2.2 nor 2.5:** the forgeability `qa-lead-pass.yml` documents about
  itself — a verdict record is hash-bound, not signed, so anyone with repo-write can author one.
  Hash-binding stops an *inherited* verdict, not a *forged* one.
  **2.7 is the founder's and its prerequisite is now discharged (#101):** `enforce_admins` is still
  `false`.
- **EIGHT bypasses of the exit-code guard are CLOSED, and the mechanism was not the one recorded here.**
  Each was silent on `main` at `244e8db` — `ciChainFindings -> []`, `unguardedSteps -> []` — and each is a
  finding now, with the benign single-command control unchanged in both cells. Every fixture is valid YAML
  (checked against PyYAML 6.0.3) carrying `npm run x && npm run y`:
  a **second job**; `run :` with a space before the colon; a flow-mapping step `- {run: …}`; a quoted
  `"run":` key; `-  name:` with a **two-space dash**, which puts the step's keys at +3 where the column was
  hardcoded to +2; `steps: [{run: …}]` as a **flow sequence**; `- <<: *base`, a **merge key**; and a
  **flush-style job**, `steps:` at column N with its items `- ` also at column N.
  **The eighth was found by an independent review of the fix for the first seven, and it was a REGRESSION
  the fix introduced** — the one entry here that is not a pre-existing hole. `main`'s `break` collapsed the
  parse to ZERO steps on meeting that shape, tripping the `CI_CHAINS_ALLOWED` rot-check and nine tests;
  replacing the `break` with a resume kept a *plausible* 52-step parse and reported clean, giving a view
  byte-identical to the pristine file. Nothing named that backstop and nothing tested it, so **a deletion
  removed a control while every test stayed green** — the class this repo names in four other places,
  committed by the change that was closing seven instances of it. Flush style is also the likeliest of the
  eight to be hand-written.
  *Superseded 2026-08-26: this read "Four bypasses are live on `main`, all one class — `parseCiSteps` does
  not see the step at all, so the guard never runs on it."* **Four was the count and the mechanism was
  wrong for three of them, and the wrong mechanism is why the other three went unfound.** `parseCiSteps`
  DOES see those steps: it returned one step for every fixture. `record()`'s key pattern did not match the
  line, it returned in silence, and the step kept `run: null` — which is precisely what a step that runs no
  command looks like, and every check downstream filters on `s.run !== null`. Only the second job is
  genuinely never reached. The cure is round 9's, one layer up — declare what is read, refuse the rest, at
  the LINE rather than the value — and it changes **zero** live verdicts: measured across the real
  `ci.yml` first — **50 item lines and 97 step-key lines, ZERO of them anything but a plain `key: value`
  pair**. *Those two counts are the census taken BEFORE the change and are kept as provenance, not as a
  live figure: this same change added two steps and they are 52 and 101 now. The **zero** is the
  load-bearing half, it is what makes the refusals free, and `npm run check:ci-chains` re-derives it on
  every run.*
  **The composed variant is the one worth remembering:** a second job whose items sit at eight spaces was
  invisible to every backstop in the repo, including all three raw-line cross-checks, because they count
  `/^ {6}- /`. The other four DO trip an incidental assertion — with a message that says nothing about a
  chain, which is a backstop someone deletes.
- **THE CITATION DECISION IS TAKEN, and it is a SPLIT posture: existence BLOCKS, drift WARNS** (2026-08-26).
  *Superseded: this read "`check-citations.mjs` is STILL UNWIRED … Recommendation on the table … Founder
  decision, not an agent's." The decision was made on the run that deferral asked for and this records it
  as taken.* **The run it was made from: 2 existence findings · 85 drift · 25% drift coverage · 85% of
  locators resolved by basename.** Existence is deterministic with no false positives by construction, so
  it is cheap to enforce; drift is heuristic over a quarter of the corpus and rests on a resolution the
  checker's own blind-spot list says may be the WRONG FILE, so blocking on it would teach contributors to
  route around the checker. What is wired: **`check:citations-exist`** (`--no-anchors --strict
  --external-prefix adamos`) and its mutation gate **`test:citations`**, both STEPS and both steps of
  `.github/workflows/ci.yml`. **`check:citations` — the full run — is still `EXCLUDED` and still WARN.**
  Verify all three, never recall them:
  `node -e "const c=require('./scripts/lib/check-suite.js');
  console.log(c.STEPS.includes('check:citations-exist'), c.STEPS.includes('test:citations'),
  'check:citations' in c.EXCLUDED)"` → `true true true`.
  Both existence findings were FIXED rather than waived: one stale path from a rename, and one true
  citation into a sibling project declared with `--external-prefix`.
- **Where we are:** Phases 1–7 complete · **Phase 8a complete** · **8b (Dispatch) BUILT 2026-08-16 against
  `agentvibe` as its only target** — the loop is end to end (the server enqueues to a queue file, a
  founder-run consumer in `mission-control/scripts/` reads it; the server still never spawns, and
  `crosscheck.test.ts`'s shell ban stays at zero exceptions) · **Phase 9 (fleet rollout) not started.**
  **8b's original exit gate is UNDISCHARGED and cannot be reached yet:** it requires dispatching into a
  *second* project whose ledger receives the claims, and no sibling project has a ledger — measured
  2026-08-12, zero of thirteen. That gate needs Phase 9. Built ≠ gate met; do not read one as the other.
  Authoritative plan: [AGENT-SYSTEM-REBUILD.md](docs/03-system-design/AGENT-SYSTEM-REBUILD.md).
  `IMPLEMENTATION-PLAN.md` is **superseded** — do not follow its numbering.
- **P0 IS CLOSED except the Codex resolver, and `main` moved on 2026-08-23** — `5b8e127` → `413a029`,
  nine branches in one train, the first time `main` had moved since before 2026-08-20. What landed: the
  PR-route gate **blocks** and posts a check-run signed by `GITHUB_TOKEN` with the author grep deleted;
  `qa.js` runs a deterministic oracle before any panel agent is dispatched; credential `denyRead` covers
  the CLI credential stores; `test:tier-gate` is in `npm run check` (**49** steps now — this read "46" until the citation
  steps landed on 2026-08-26, "30" earlier that day and "29" until 2026-08-24, the same dropped-step
  error corrected in the gate bullet above); and
  `war-room/bin/PROJECT_NAME.tmpl` no longer seeds an unreviewed model-resolved merge into every generated
  project. **P0 item 6 — `claim-judge-external` — HAS NOW LANDED (#103)**: the resolver is registered and
  dispatchable, and `scripts/ledger.test.mjs` asserts both, plus that it attaches only where a tier rule
  names it. *Superseded 2026-08-26: this read "Only P0 item 6 remains … still correctly deferred".*
  **A seam is not a second opinion**: what landed is the mechanism, and Codex bug #19945 — exit 0 with
  empty stdout when detached from a TTY, which is exactly how a resolver runs — is why the panel below is
  still single-family.
  Handoff: [2026-08-23-after-p0.md](docs/08-agents_work/handoffs/2026-08-23-after-p0.md).
- **Single-family review is an ACCEPTED RISK, decided 2026-08-23, not a satisfied requirement.**
  Irreversible tier asks for 2-of-3 multi-judge and `risk: high` requires ≥2 distinct model families;
  there is no non-Anthropic model inside Claude Code. Every review behind that merge said so in its own
  session file. **Re-measured 2026-08-26 and STILL ACCEPTED — the exit condition runs to 2026-11-17.**
  *This bullet used to close "Revisit if the Codex resolver lands." It landed (#103) and the risk did not
  change*, because the seam is dispatchable while no non-Anthropic model is reachable from inside Claude
  Code. Landing the mechanism is not satisfying the requirement; do not read #103 as discharging this.
- **Branch protection exists and did not bind on the path actually used.** The push that moved `main`
  reported *"2 of 2 required status checks are expected"* — and succeeded anyway, having run no checks.
  So required checks govern the PR route and not a direct push. Treat `.github/workflows/**` as
  unprotected against a determined writer until CODEOWNERS or a push restriction is added; that is a
  repository setting, not a file, and only the founder can set it.
- **The prompt-craft standard exists, is enforced, and the roster migration is DONE.** It landed as
  `PROMPT-STANDARD.md` (#64) and became `PS-*` lint rules (#71). The roster is **7 engines of 18 files** —
  eighteen, not the seventeen this block said until 2026-08-16, because `reviewer-readonly.md` landed in #47.
  Count with `ls .claude/agents/*.md` and the `ENGINES` list in `.claude/hooks/schema-lint.js`, never from
  memory — and note that the dead-path check refused a pinned line number here, correctly: a line number in
  prose rots the next time anyone edits the file above it.
  `schema-lint` is **18 pass · 0 fail · 0 warnings** as of #75. The eight warnings that stood before it were
  not eight defects: **six were `PS-BODY-VAGUE`, a rule whose own message admitted it "cannot tell a
  perception loop from a hand-wave."** It was firing on six of six engines. The fix narrowed the *predicate*
  and left the prose alone — deleting judgement words to green a rule that cannot judge would have made the
  prompts worse and the output cleaner, which is the trade this repo exists to refuse.
- **The gate refuses now.** `qa.js` ran three times against PR #47 and **blocked every time, on its own
  author's work**; three independent reviewers then returned FAIL and found a path traversal, eleven SSRF
  bypasses, two more in the fix for those, and an auto-approved RCE path — all in work already called
  finished. It is no longer a mechanism nothing invokes.
- **`maxTurns` BINDS when a dispatch names an `agentType`, and not otherwise.** This repo recorded the
  opposite as measured fact; the corpus behind that belief named no agent file. Now that `qa.js` names
  `agentType`, the cap is live — 30 on `builder`, `designer`, `orchestrator`, `reviewer` and
  `reviewer-readonly`, and **25 on `framer` and `sourcer`**, not "30 on every engine" as this block claimed
  until 2026-08-16. **The lint ceiling is 120, raised from 30** — at 30 the ceiling was setting the value
  rather than bounding an error (every engine sat at or near it while a measured reviewer run needed 68 tool
  calls). Raising it changed no engine's declared value. The declared value is a per-engine tuning decision.
  Do not "clean up" this field believing it inert. Registered as `c-maxturns-binds-when-agenttype-named`.
- **Known and accepted:** **no venture work has ever run through this harness** (stop condition 6). The
  founder's decision is to finish the harness first. Recorded so it is a choice, not an oversight.
- **Enforced today (fails a build):** schema-lint · gate tests · manifest drift · registration · launcher
  guard rails · the claim ledger (`npm run check:ledger`) · **`qa-lead-pass.yml` blocks** — a session file
  added *in the PR* must carry `qa_verdict: PASS`.
- **Shadow (computed, does not block):** claim resolvers, except migration · deploy · harness self-edit,
  which block from day one because `git revert` does not undo them.
- **Durable facts are claims now, not prose.** Registered 2026-08-16 in
  [CLAIM-LEDGER.md](docs/03-system-design/CLAIM-LEDGER.md): the MCP grant binds and narrows across an `Agent`
  dispatch (`c-mcp-grant-binds-through-agent-dispatch`), `maxTurns` binds
  (`c-maxturns-binds-when-agenttype-named`), an MCP call reaches `pre-tool-use.sh` only if the matcher names
  that exact tool (`c-mcp-hook-matcher-must-name-the-tool`), and nested spawning works
  (`c-nested-subagent-spawn-works`). All four are `verified_by: command` — a `judge` claim with an empty panel
  resolves `unresolved` forever, and two of those already exist.
- **#56 is CLOSED — the payload was shrunk, the budget was not raised.** `session-start.js` emitted **27,069
  bytes** against a 4,096 budget; it now emits **2,941** (#76), a 9.2x cut, and the claim passes. The point
  was never the number: at 27KB the runtime *truncated* the output and inlined a ~2KB preview, so the lenses
  and playbooks **never reached agent context at all** — a file pointer did, and whether anyone opened it was
  discretionary. Under the ceiling the index actually arrives. Same two-tier cure that took skills discovery
  from ~15,000 tokens to ~1,300: ids, one-line summaries, and the path to read on demand.
- **The claim ledger's shadow list is CLEAN, and 5 is the number.** `ledger verify` → **5 would_block · 0
  block**, and **none of the five is a real defect**: two are one deliberate canary (`example.invalid`,
  deliberately expired) that exists to prove a resolver reports `unresolved` rather than passing, and three
  are `verified_by: judge` claims with empty panels. Those three may be **structurally unresolvable in this
  runtime** — `risk: high` requires ≥2 distinct model families and there is no non-Anthropic model inside
  Claude Code. That is a founder decision, not a bug: accept permanent shadow, or re-register as `command`
  where a deterministic test exists. Do not "fix" the canary.
- **The prose-citation check can fail on CI now (#69, #83).** It previously could not: with no
  `~/.warroom/ledger/global.yml` — structurally always true on a runner — `lint` downgraded unresolvable
  citations to a warning and exited 0. Verified after the fix by simulating a runner with an empty `HOME`:
  a dead citation exits **1**, a clean tree exits **0**. This is why `main` was once red locally and green in
  CI on the same commit for forty minutes.
- **The OS sandbox is BUILT and ARMED (#84 built · #94 armed).** `sandbox.enabled: true` and
  `failIfUnavailable: true` in `.claude/settings.json`, with `denyRead` over `~/.ssh`, `~/.aws`,
  `~/.config/gh`, `~/.netrc`, `**/.env*`. "Armed" is a **checked fact**, not a comment:
  `npm run test:sandbox` fails if `enabled` is flipped, and CI runs it. Two facts sourced from the Claude
  Code docs 2026-08-16 and recorded in [SANDBOX.md](docs/03-system-design/SANDBOX.md): **(1)
  `failIfUnavailable` defaults to `false` (fail-open), but is set to `true` here** — if the sandbox cannot
  start, the command is blocked rather than running unsandboxed; **(2) there is an escape hatch,
  `dangerouslyDisableSandbox`** — Claude Code may retry a sandbox-denied command with the sandbox off. So it
  is a **guardrail against accident, not containment against the agent.** Do not describe it as containment.
  It is also the **Bash** sandbox: it governs Bash and its children, not the file-edit tools, and not a whole
  session. **Do not hand-write a `.sb` profile** — Seatbelt (macOS) and bubblewrap (Linux/WSL2) are already
  implemented in the binary.
- **Blockers:** none blocking. `--dangerously-skip-permissions` was removed by #47 — the **39** allow/deny
  rules in `settings.json` (29 allow · 10 deny) are live now, so a command that used to pass silently may
  prompt. This block said 26 until 2026-08-16.
  **Founder decisions — of the four this bullet listed, TWO were already discharged. Checked 2026-08-24.**
  *Superseded: all four were listed as "pending", so this told the founder they owed decisions already made.
  The list is corrected in place rather than deleted, because which entries went stale is the useful part.*
  - ~~whether to merge PR #77~~ — **DISCHARGED; the work is live.** `scripts/verdict.mjs` exists and
    `package.json` exposes it as `verdict`; `qa-lead-pass.yml` runs `node scripts/verdict.mjs check --json`
    in a step that `exit 1`s on a failing verdict, so it is on the **blocking** path, not advisory. The
    binding is `subject = sha256(diff)`. Note the bounded guarantee the workflow states about itself: the
    verdict record is **hash-bound, not signed** — anyone with repo-write access can author a
    `.qa/verdicts/*.json`. Hash-binding stops an *inherited* verdict, not a *forged* one.
  - ~~whether to arm the sandbox~~ — **DISCHARGED.** `sandbox.enabled: true` and `failIfUnavailable: true`,
    armed by #94, pinned by `npm run test:sandbox` (7 tests, exit 0), which fails if either is flipped back.
  - **STILL OPEN — the three unresolvable judge claims.** They are `c-sessionstart-injection-unverified`,
    `c-read-only-binding-unverified` and `c-runtime-nested-spawn`, each resolving `unresolved: no judgment
    recorded`; naming them beats counting them. Not unexamined, though: the founder waiver of 2026-08-20 on
    `c-shadow-window-open` reasoned about them, recorded that it *stays 5*, and set an exit condition
    running to **2026-11-17** — one real sourced claim arising from non-harness work, plus a judge panel
    with two distinct model families.
  - **STILL OPEN — the credential scopes for `instrument`/`operator`**, which remain uncreated: 18 files in
    `.claude/agents/` and neither is among them. Reasoning in `docs/STATUS.md` item 3.
- **Before you trust any local measurement:** `cd mission-control && bun install`. Without it three
  mission-control claims look like regressions when they are only missing dependencies. Measure from a clean
  checkout, never a stale working tree. `c-mission-control-cold-start` is a **wall-clock** check (9.5s against
  a 10s budget) and flakes when several lanes build at once — re-run it before believing it.

---

## Template Provenance

Adopted from the Beamix agent system snapshot dated **2026-05-25**.
The pre-template variant was not preserved in this repo; recover it from git history if needed.
See [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md) for the placeholder list and first-run checklist.
