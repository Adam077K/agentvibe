# Agentvibe — Project Context
*Auto-loaded by Claude Code on every session.*

> This is a TEMPLATE adapted from the Beamix agent system (2026-05-16 rethink baseline). Replace every `{{PLACEHOLDER}}` and the "Project State" section before first use. See [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md).

---

## The Team

This project runs as an autonomous C-suite company. **Every task starts at the CEO.**

```
Layer 1 — Entry
  CEO  (Founder-driven or ticket-triggered; orchestrates only, never implements)

Layer 2 — C-suite
  CTO   · CPO   · CMO   · CBO   · QA-Lead   · Research-Lead
  Design-Lead reports under CPO.

Layer 3 — Workers (13)
  backend-engineer · frontend-engineer · database-engineer · ai-engineer
  devops-engineer  · data-engineer     · security-engineer · test-engineer
  code-reviewer    · researcher        · technical-writer
  product-designer · design-critic
```

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

**Capabilities are real or absent.** No agent declares `mcpServers` — all 52 did, while no MCP config existed
anywhere, so the field granted nothing. `schema-lint.js` now fails any declaration that no configuration
backs. Read-only reviewers (`code-reviewer`, `security-engineer`, `design-critic`, `researcher`,
`adversary-engineer`) carry no `Write` or `Edit`: an agent that can edit what it reviews will review what it
can edit.

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
| `.claude/memory/DECISIONS.md` | Architecture & strategy decisions, append-only, 50-entry cap | Any agent making a decision affecting others |
| `.claude/memory/CODEBASE-MAP.md` | Key files, patterns, tech debt | code-reviewer |
| `.claude/memory/USER-INSIGHTS.md` | Customer language, pain phrases, JTBD | CMO + CPO (only authorized writers) |
| `.claude/memory/LONG-TERM.md` | Cross-session facts: user prefs, recurring patterns | CEO after each session |
| `docs/08-agents_work/sessions/` | Lead session summaries (`YYYY-MM-DD-[lead]-[task].md`) | Each C-suite / Lead |

**Hard caps:** DECISIONS.md ≤ 50 entries (archive when full); LONG-TERM.md ≤ 100 lines; session summaries ≤ 10 lines each.

---

## Models (May 2026)

| Tier | Model | Use for |
|------|-------|---------|
| Opus 4.7 | `claude-opus-4-7` | CEO + research synthesis + design + orchestration heavy |
| Sonnet 4.6 | `claude-sonnet-4-6` | **Default** — C-suite, leads, most workers |
| Haiku 4.5 | `claude-haiku-4-5` | Simple/lookup — test runs, lint, log parsing, classification |

CEO specifies the model in every brief. Workers default to Sonnet if unspecified.

---

## Risk-Tiered QA Gate (4-tier)

Every PR is risk-tiered. **No merge without QA-Lead PASS.** The CEO and CTO cannot override.

| Tier | Trigger | Review pipeline | Required label |
|------|---------|-----------------|----------------|
| **Trivial** | Typo, single-line, comment-only | `.github/workflows/ci.yml` only (schema-lint + gate tests + registration check) | none |
| **Lite** | Isolated feature, < 300 LOC, no API/DB/auth | code-reviewer + qa-engineer + semgrep | `risk:lite` |
| **Full** | API/DB/auth/billing touched, ≥ 300 LOC | Lite + security-engineer + craft-reviewer + Codex CLI second opinion | `risk:full` |
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

- `DECISIONS.md`: ≤ 50 entries (archive when full)
- `LONG-TERM.md`: ≤ 100 lines (compress quarterly)
- Session summaries: ≤ 10 lines each
- Agent handoffs: ≤ 500 tokens (summarize, never forward raw conversation)
- Skills per task: **3-5 for CEO/C-suite/leads · 2-3 for workers** — never preload
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

### CEO
| DO | DO NOT |
|----|--------|
| Plan, ask, delegate, synthesize | Write source code |
| Structured briefs with all required fields | Vague "build the thing" |
| Validate C-suite returns (workers_spawned, qa_verdict, session_file) | Accept returns missing required fields |
| Set `/color` + `/name` at session start | Run unnamed/uncolored |

### C-suite + Leads
| DO | DO NOT |
|----|--------|
| Explore, plan, brief workers | Edit `.ts`, `.tsx`, `.sql` directly |
| Spawn the right worker for each task | Do a worker's job to "save turns" |
| Verify branches via `git branch --list` | Trust worker summaries blindly |
| Spawn QA-Lead before merge | Merge anything without QA-Lead PASS |
| Write session file at task close | Complete a task with no session file |

### Workers (Layer 3)
| DO | DO NOT |
|----|--------|
| One focused task per worktree | Touch files outside scope |
| Return structured JSON (branch, worktree, files_changed) | Return vague "done" |
| Auto-fix type errors, missing imports (Deviation Rules 1-3) | Make architectural decisions — return BLOCKED instead |
| Atomic commits per logical change | Commit to `main` or a lead's branch |

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

```bash
# Detect — you may already be inside a worktree
git worktree list
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

# Create child worktree FROM the main repo root
git -C "$MAIN_REPO" worktree add "$MAIN_REPO/.worktrees/[slug]" -b feat/[slug]
cd "$MAIN_REPO/.worktrees/[slug]"

# Atomic commits
git commit -m "feat(scope): description"
```

**Never** run `git worktree add` from inside a worktree without `-C $MAIN_REPO`. `.worktrees/` is gitignored.

---

## Agent Identity — Colors & Session Naming

### Color
| Role | Color |
|------|-------|
| CEO (primary) | `gold` |
| CEO (parallel #2/3/4) | `orange` / `teal` / `lime` |
| CTO | `blue` · CPO `green` · CMO `yellow` · CBO `emerald` · QA-Lead `red` · Research-Lead `purple` · Design-Lead `pink` |
| backend-engineer | `blue` · frontend-engineer `pink` · database-engineer `teal` · ai-engineer `purple` |
| security-engineer | `red` · test-engineer `yellow` · code-reviewer `gray` · researcher `purple` · technical-writer `gray` |

### Naming
```
CEO:    /name ceo-[task-slug]       e.g., /name ceo-onboarding-flow
C-suite: /name [role]-[task-slug]   e.g., /name cto-scan-engine
Workers: /name [role]-[task-slug]   e.g., /name backend-engineer-rate-limit
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

- **Where we are:** Phases 1–7 complete · **Phase 8a (Mission Control read plane) complete** · 8b (Dispatch)
  deferred — it is the only view that writes and needs Phase 9 to give it targets · **Phase 9 (fleet rollout)
  not started.** Authoritative plan: [AGENT-SYSTEM-REBUILD.md](docs/03-system-design/AGENT-SYSTEM-REBUILD.md).
  `IMPLEMENTATION-PLAN.md` is **superseded** — do not follow its numbering.
- **Active now — one session, completing the harness.** Founder decision 2026-08-16: finish the harness in a
  single autonomous pass, heavy review process cut, **scope stops before Phase 9** (no other project is
  touched). See [the build brief](docs/08-agents_work/handoffs/2026-08-16-harness-completion.md).
- **Step one is the prompt-craft standard** — it gates every edit under `.claude/agents/`, and the roster
  migration (17 files → 7) is blocked until it exists and is approved.
- **Known and accepted:** **no venture work has ever run through this harness** (stop condition 6). The
  founder's decision is to finish the harness first. Recorded so it is a choice, not an oversight.
- **Enforced today (fails a build):** schema-lint · gate tests · manifest drift · registration · launcher
  guard rails · the claim ledger (`npm run check:ledger`) · **`qa-lead-pass.yml` blocks** — a session file
  added *in the PR* must carry `qa_verdict: PASS`.
- **Shadow (computed, does not block):** claim resolvers, except migration · deploy · harness self-edit,
  which block from day one because `git revert` does not undo them.
- **Blockers:** none blocking. Founder decisions pending: **#56** (is 4,096 bytes the right session-start
  budget?) and the two `--dangerously-skip-permissions` invocations in `bin/warroom` (lines 235 and 237).
- **Before you trust any local measurement:** `cd mission-control && bun install`. Without it
  `ledger verify` reports 8 would_block instead of 5 and three mission-control claims look like regressions
  when they are missing dependencies. Measure from a clean checkout, never a stale working tree.

---

## Template Provenance

Adopted from the Beamix agent system snapshot dated **2026-05-25**.
The pre-template variant was not preserved in this repo; recover it from git history if needed.
See [TEMPLATE-USAGE.md](TEMPLATE-USAGE.md) for the placeholder list and first-run checklist.
