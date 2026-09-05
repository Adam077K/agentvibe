# CENSUS — what exists on disk, 2026-09-04

Read-only census. Every row is a path plus a measurement. No judgement, no design.

**Trees measured**

| Label | Path | Head |
|---|---|---|
| TREE A | `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-3-1788468144` | `b2cabad` (branch `ceo-3`, = local main; carries Stage A/B fleet-installer commits origin lacks) |
| TREE B | `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-1-1788468144` | `280b5e7` (branch `ceo-1` = origin/main `4770d39` + round-5 docs) |

Measurement convention: `file:N` = N lines · `dir:N` = N entries at top level · `ABSENT` = path does not exist.

---

## 1 · Fate-table paths, verified

Source of the path list: `TREE B/docs/03-system-design/round-5/STARTUP-OS-v3.md` lines 2073–2106, the
"What exists today, and its fate" table (25 rows, each naming one or more concrete paths).

| Path | TREE A | TREE B | Note |
|---|---|---|---|
| `scripts/ledger.mjs` | file:1531 | file:1531 | identical size |
| `scripts/verdict.mjs` | file:534 | file:586 | **differs**: B is 52 lines longer |
| `.qa/verdicts/` | dir:68 | dir:80 | **differs**: B has 12 more verdict records |
| `scripts/run-checks.mjs` | file:312 | file:312 | |
| `scripts/check-citations.mjs` | file:846 | file:846 | |
| `scripts/lib/classifier.js` | file:187 | file:187 | the risk classifier |
| `.claude/workflows/qa.js` | file:1182 | file:1182 | |
| `.github/workflows/qa-lead-pass.yml` | file:692 | file:692 | |
| `.github/workflows/ci.yml` | file:581 | file:581 | |
| `.claude/agents/` | dir:18 | dir:18 | 18 files, matches the documented roster |
| `.claude/playbooks/` | dir:6 | dir:6 | |
| `.claude/lenses.yml` | file:201 | file:201 | |
| `.claude/review-lenses.yml` | file:230 | file:230 | |
| `.claude/skills/` | dir:140 | dir:140 | 140 top-level entries (134 skills + routers + CURATION.yml + MANIFEST.json + others; see §3) |
| `.claude/skills/CURATION.yml` | file:462 | file:462 | |
| `.claude/skills/routers/` | dir:8 | dir:8 | INDEX.md + 7 namespace routers |
| `.claude/skills/MANIFEST.json` | file:870 | file:870 | |
| `.claude/workflows/design.js` | file:143 | file:143 | |
| `.claude/workflows/coding.js` | file:170 | file:170 | |
| `.claude/workflows/research.js` | file:187 | file:187 | |
| `.claude/hooks/budget-guard.js` | file:204 | file:204 | |
| `.claude/hooks/pre-tool-use.sh` | file:676 | file:676 | |
| `.claude/hooks/session-start.js` | file:259 | file:259 | |
| `.claude/hooks/schema-lint.js` | file:1947 | file:1947 | |
| `CLAUDE.md` | file:886 | file:886 | |
| `AGENTS.md` | file:126 | file:126 | |
| `.claude/memory/DECISIONS.md` | file:424 | file:407 | **differs**: A is 17 lines longer |
| `.claude/memory/DECISIONS_ARCHIVE.md` | file:409 | file:409 | |
| `.claude/memory/DECISIONS_ARCHIVE_002.md` | file:216 | file:277 | **differs**: B is 61 lines longer |
| `scripts/evict-memory.mjs` | file:1125 | file:1125 | |
| `.claude/memory/LONG-TERM.md` | file:84 | file:96 | **differs**: B is 12 lines longer; cap is 100 lines |
| `.claude/memory/USER-INSIGHTS.md` | file:18 | file:18 | |
| `.claude/memory/CODEBASE-MAP.md` | file:202 | file:202 | |
| `docs/08-agents_work/sessions/` | dir:171 | dir:180 | **differs**: B has 9 more |
| `docs/08-agents_work/handoffs/` | dir:16 | dir:21 | **differs**: B has 5 more |
| `.claude/commands/` | dir:16 | dir:16 | |
| `mission-control/` | dir:9 | dir:9 | 9 top-level entries; file count in §7 |
| `bin/warroom` | file:3429 | file:3429 | matches the 3,429 lines the fate table cites |
| `bin/fleet-install.mjs` | file:1053 | file:1053 | present in BOTH trees |
| `war-room/bin/fleet-install.mjs` | ABSENT | ABSENT | confirms the census correction recorded in the fate table |
| `.mcp.json` | file:12 | file:12 | |
| `.claude/mcp-policy.json` | file:65 | file:65 | |
| `.claude/gates.yml` | file:221 | file:221 | |
| `.claude/qa-tier-floor.yml` | file:468 | file:468 | |
| `.claude/ledger/` | dir:1 | dir:1 | |
| `bin/` | dir:5 | dir:5 | |
| `war-room/` | dir:4 | dir:4 | |
| `docs/02-competitive/expansion/open-source.md` | **ABSENT** | file:1083 | round-5 corpus, TREE B only |
| `docs/02-competitive/expansion/hands.md` | **ABSENT** | file:901 | TREE B only |
| `docs/02-competitive/expansion/concepts.md` | **ABSENT** | file:2157 | TREE B only |
| `docs/02-competitive/reference-systems/` | **ABSENT** | dir:5 | TREE B only; 5 entries, matching "five reference studies" |
| `docs/03-system-design/STARTUP-OS.md` | **ABSENT** | file:2826 | v2; TREE B only |
| `docs/03-system-design/round-5/` | **ABSENT** | dir:8 | TREE B only |

**Outside both trees**

| Path | Measurement |
|---|---|
| `~/.agentvibe/events.jsonl` | exists · **1,119,259 bytes** · 3,840 lines · mtime 2026-09-04 00:03 |
| `~/.claude/projects/` | 60 project directories · **3,060 `.jsonl` transcripts** (fate table says "2,936+") |

---

## 2 · Agent files

Measured on **TREE A**, `.claude/agents/*.md`. **Actual count: 18** (matches the documented roster).
Seven are engines carrying full frontmatter; eleven are shims (23 lines each, no `model:`, no `tools:`,
no `maxTurns:`, no `isolation:`) that exist only to shadow drifted global copies in `~/.claude/agents/`.

### The seven engines

| File | model | `tools:` verbatim | `mcpServers:` | maxTurns | isolation | `worktree add` in body | Role (from `description:`) |
|---|---|---|---|---|---|---|---|
| `builder.md` | `claude-opus-5` | `tools: [Read, Write, Edit, Bash, Glob, Grep]` | — | 30 | worktree | **yes (2)** | Produces an artifact in isolation, structured return |
| `designer.md` | `claude-opus-5` | `tools: [Read, Write, Edit, Bash, Glob, Grep]` | `mcpServers: [playwright]` | 30 | worktree | **yes (1)** | The only producing engine with a perception loop |
| `framer.md` | `claude-sonnet-5` | `tools: [Read, Write, Edit, Glob, Grep]` | — | 25 | none | no | Turns something fuzzy into structure and a decision |
| `orchestrator.md` | `claude-opus-5` | `tools: [Read, Write, Edit, Bash, Glob, Grep, Task]` | — | 30 | none | no | Entry point; owns state and the human boundary |
| `reviewer.md` | `claude-opus-5` | `tools: [Read, Glob, Grep, Bash]` | — | 30 | none | no | Read-only out-of-band judgement; never fixes |
| `reviewer-readonly.md` | `claude-opus-5` | `tools: [Read, Glob, Grep]` | — | 30 | none | no | `reviewer` with no shell, for the binding QA gate |
| `sourcer.md` | `claude-opus-5` | `tools: [Read, Glob, Grep, WebSearch, WebFetch]` | `mcpServers: [claim-append]` | 25 | none | no | Answers bounded questions with sourced evidence |

File lengths: builder 134 · designer 151 · framer 121 · orchestrator 154 · reviewer 149 ·
reviewer-readonly 169 · sourcer 147.

### The eleven shims

All 23 lines, all with `description:` beginning "Shim. This agent was collapsed into the `X` engine in
Phase 4b." None declares `model:`, `tools:`, `mcpServers:`, `maxTurns:` or `isolation:`; none contains
`worktree add`.

| File | Collapsed into |
|---|---|
| `ai-engineer.md` | `builder` |
| `database-engineer.md` | `builder` |
| `technical-writer.md` | `builder` |
| `test-engineer.md` | `builder` |
| `ceo.md` | `orchestrator` |
| `design-lead.md` | `orchestrator` |
| `code-reviewer.md` | `reviewer` |
| `qa-lead.md` | `reviewer` |
| `security-engineer.md` | `reviewer` |
| `research-lead.md` | `sourcer` |
| `researcher.md` | `sourcer` |

**Two agents declare `mcpServers`** (`designer`, `sourcer`) — consistent with `.mcp.json` (12 lines).
**Two agent bodies contain `worktree add`** (`builder`, `designer`) — the known contradiction with
`schema-lint.js`'s `isolation: worktree` rule, both files `irreversible` tier.
**One agent declares `Task`** (`orchestrator`). **Zero declare `Workflow`.**

---

## 3 · Skills, with a fate class

Measured on **TREE A**. `.claude/skills/` holds **140 top-level entries**: 134 skill directories each
containing a `SKILL.md` (`find -maxdepth 2 -name SKILL.md | wc -l` → **134**), the `routers/` directory,
and five loose files (`BUNDLES.md`, `CURATION.yml`, `GETTING_STARTED.md`, `MANIFEST.json`, `README.md`).
**Actual skill count: 134**, matching the documented figure.

Router namespace totals, from `routers/INDEX.md` and confirmed by counting rows in each router file:
engineering 17 · frontend-design 24 · quality-security 21 · ai-agents 18 · ops-delivery 13 ·
business-growth 13 · thinking 28. **Sum = 134.**

Fate class assigned from the router's one-line description per the stated rules.

### ai-agents (18)

| Skill | Class |
|---|---|
| `agent-evaluation` | ANCHOR-CANDIDATE |
| `agent-memory-systems` | PROCEDURE |
| `brainstorming` | PROCEDURE |
| `context-compression` | PROCEDURE |
| `deep-research` | INFRA |
| `dispatching-parallel-agents` | PROCEDURE |
| `embedding-strategies` | PROCEDURE |
| `llm-app-patterns` | EXEMPLAR-CANDIDATE |
| `mcp-builder` | PROCEDURE |
| `mem0-patterns` | PROCEDURE |
| `multi-agent-patterns` | EXEMPLAR-CANDIDATE |
| `prompt-caching` | PROCEDURE |
| `skill-creator` | PROCEDURE |
| `subagent-driven-development` | PROCEDURE |
| `tool-design` | PROCEDURE |
| `verification-before-completion` | ANCHOR-CANDIDATE |
| `writing-plans` | PROCEDURE |
| `writing-skills` | PROCEDURE |

### business-growth (13)

| Skill | Class |
|---|---|
| `competitive-landscape` | PROCEDURE |
| `form-cro` | PROCEDURE |
| `launch-strategy` | PROCEDURE |
| `market-sizing-analysis` | PROCEDURE |
| `marketing-psychology` | PROCEDURE |
| `onboarding-cro` | PROCEDURE |
| `page-cro` | PROCEDURE |
| `pricing-strategy` | PROCEDURE |
| `product-manager-toolkit` | PROCEDURE |
| `seo-content-writer` | EXEMPLAR-CANDIDATE |
| `social-content` | EXEMPLAR-CANDIDATE |
| `startup-financial-modeling` | PROCEDURE |
| `startup-metrics-framework` | PROCEDURE |

### engineering (17)

| Skill | Class |
|---|---|
| `api-design-principles` | PROCEDURE |
| `architecture-decision-records` | PROCEDURE |
| `code-refactoring-tech-debt` | PROCEDURE |
| `database-design` | PROCEDURE |
| `doc-coauthoring` | PROCEDURE |
| `domain-driven-design` | PROCEDURE |
| `error-handling-patterns` | EXEMPLAR-CANDIDATE |
| `full-output-enforcement` | ANCHOR-CANDIDATE |
| `nodejs-backend-patterns` | EXEMPLAR-CANDIDATE |
| `pgvector-rag-conventions` | INFRA |
| `postgresql` | PROCEDURE |
| `prisma-expert` | INFRA |
| `sharp-edges` | ANCHOR-CANDIDATE |
| `sql-optimization-patterns` | PROCEDURE |
| `supabase-rls-conventions` | INFRA |
| `systematic-debugging` | PROCEDURE |
| `trust-spec-contracts` | ANCHOR-CANDIDATE |

### frontend-design (24)

| Skill | Class |
|---|---|
| `12-principles-of-animation` | ANCHOR-CANDIDATE |
| `design-mirror` | PROCEDURE |
| `design-orchestration` | PROCEDURE |
| `design-taste-frontend` | ANCHOR-CANDIDATE |
| `emilkowal-animations` | EXEMPLAR-CANDIDATE |
| `high-end-visual-design` | EXEMPLAR-CANDIDATE |
| `impeccable` | PROCEDURE |
| `industrial-brutalist-ui` | EXEMPLAR-CANDIDATE |
| `minimalist-ui` | EXEMPLAR-CANDIDATE |
| `nextjs-app-router-patterns` | INFRA |
| `nextjs-best-practices` | INFRA |
| `pitch-deck-visuals` | EXEMPLAR-CANDIDATE |
| `radix-ui-design-system` | INFRA |
| `react-patterns` | EXEMPLAR-CANDIDATE |
| `redesign-existing-projects` | PROCEDURE |
| `stitch-design-taste` | EXEMPLAR-CANDIDATE |
| `tailwind-design-system` | INFRA |
| `tailwind-patterns` | INFRA |
| `ui-typography` | ANCHOR-CANDIDATE |
| `ui-visual-validator` | ANCHOR-CANDIDATE |
| `vercel-composition-patterns` | EXEMPLAR-CANDIDATE |
| `vercel-react-native-skills` | INFRA |
| `wcag-audit-patterns` | ANCHOR-CANDIDATE |
| `web-design-guidelines` | ANCHOR-CANDIDATE |

### ops-delivery (13)

| Skill | Class |
|---|---|
| `clerk-auth` | INFRA |
| `deployment-procedures` | PROCEDURE |
| `email-systems` | PROCEDURE |
| `finishing-a-development-branch` | PROCEDURE |
| `github-actions-templates` | INFRA |
| `inngest` | INFRA |
| `nextjs-supabase-auth` | INFRA |
| `paddle-integration` | INFRA |
| `payment-integration` | INFRA |
| `segment-cdp` | INFRA |
| `stripe-integration` | INFRA |
| `vercel-deployment` | INFRA |
| `worktree-isolation-pattern` | PROCEDURE |

### quality-security (21)

| Skill | Class |
|---|---|
| `auth-implementation-patterns` | EXEMPLAR-CANDIDATE |
| `aws-compliance-checker` | ANCHOR-CANDIDATE |
| `aws-iam-best-practices` | ANCHOR-CANDIDATE |
| `aws-secrets-rotation` | INFRA |
| `broken-authentication` | ANCHOR-CANDIDATE |
| `cc-skill-coding-standards` | EXEMPLAR-CANDIDATE |
| `cc-skill-security-review` | ANCHOR-CANDIDATE |
| `e2e-testing-patterns` | ANCHOR-CANDIDATE |
| `gdpr-data-handling` | PROCEDURE |
| `object-calisthenics` | ANCHOR-CANDIDATE |
| `playwright-skill` | INFRA |
| `production-code-audit` | ANCHOR-CANDIDATE |
| `react19-test-patterns` | **REHEARSAL-CANDIDATE** |
| `receiving-code-review` | PROCEDURE |
| `requesting-code-review` | PROCEDURE |
| `secrets-management` | INFRA |
| `security-audit` | ANCHOR-CANDIDATE |
| `tdd-workflow` | PROCEDURE |
| `web-security-testing` | ANCHOR-CANDIDATE |
| `writing-good-tests` | ANCHOR-CANDIDATE |
| `xss-html-injection` | ANCHOR-CANDIDATE |

### thinking (28)

All 28 are PROCEDURE by rule. `thinking-bounded-rationality` · `thinking-circle-of-competence` ·
`thinking-cynefin` · `thinking-effectuation` · `thinking-first-principles` · `thinking-five-whys-plus` ·
`thinking-jobs-to-be-done` · `thinking-kepner-tregoe` · `thinking-lindy-effect` ·
`thinking-map-territory` · `thinking-margin-of-safety` · `thinking-model-combination` ·
`thinking-model-router` · `thinking-ooda` · `thinking-opportunity-cost` · `thinking-pre-mortem` ·
`thinking-probabilistic` · `thinking-red-team` · `thinking-reversibility` ·
`thinking-scientific-method` · `thinking-second-order` · `thinking-socratic` ·
`thinking-steel-manning` · `thinking-systems` · `thinking-theory-of-constraints` ·
`thinking-thought-experiment` · `thinking-triz` · `thinking-via-negativa`

### Tally

| Class | Count |
|---|---|
| PROCEDURE | 73 |
| ANCHOR-CANDIDATE | 22 |
| INFRA | 22 |
| EXEMPLAR-CANDIDATE | 16 |
| REHEARSAL-CANDIDATE | 1 |
| **Total** | **134** |

Only **one** skill in the corpus carries known-answer cases with expected outputs
(`react19-test-patterns`, before/after migration pairs). Anchor candidates cluster in
`quality-security` (11 of 21) and `frontend-design` (6 of 24); `ops-delivery` and `thinking` have zero
between them.

### CURATION.yml and MANIFEST.json

| Fact | Measurement |
|---|---|
| `.claude/skills/CURATION.yml` exists | yes, 462 lines |
| List entries in it (`grep -c '^  - '`) | 67 |
| Top-level keys | `version`, `curated_on`, `source_count`, `namespaces`, `added`, and five cut-reason keys: `dead_subject`, `near_duplicate`, `reconstructible`, `role_duplicate`, `shadowed_by_global` |
| `.claude/skills/MANIFEST.json` exists | yes, 870 lines |
| Entries (`grep -c '"name"'`) | **134** — matches the skill directory count exactly |

---

## 4 · Commands, workflows, playbooks, lenses, gates

Measured on **TREE A**.

### `.claude/commands/` — 16 files, 791 lines

| File | Lines | File | Lines |
|---|---|---|---|
| `audit.md` | 63 | `name.md` | 77 |
| `board-meeting.md` | 89 | `plan.md` | 59 |
| `build.md` | 29 | `price.md` | 32 |
| `color.md` | 67 | `research.md` | 27 |
| `daily.md` | 48 | `review.md` | 77 |
| `debug.md` | 81 | `ship.md` | 34 |
| `design.md` | 28 | `validate.md` | 28 |
| `fix.md` | 23 | `launch.md` | 29 |

### `.claude/workflows/` — 6 files, 2,184 lines, plus a `lib/` directory

| File | Lines | `agentType` occurrences | Named by a command file | Files anywhere in repo that reference it |
|---|---|---|---|---|
| `qa.js` | 1182 | 6 | **yes** — `audit.md`, `review.md` | 41 |
| `research.js` | 187 | 4 | **no** | 4 |
| `coding.js` | 170 | 9 | **no** | 6 |
| `design.js` | 143 | 4 | **no** | 6 |
| `design-screen.md` | 476 | n/a | n/a | n/a |
| `README.md` | 26 | n/a | n/a | n/a |

**Three of four workflow `.js` files are named by no command file** — `coding.js`, `design.js`,
`research.js`. This matches the "invoked by nothing" state recorded in `CLAUDE.md` for those three.

### `.claude/playbooks/` — 6 files, 284 lines, all reachable from a command

| Playbook | Lines | Command(s) naming it |
|---|---|---|
| `design-pass.yml` | 67 | `design.md` |
| `ship-feature.yml` | 60 | `build.md`, `fix.md`, `review.md`, `ship.md` |
| `price-a-product.yml` | 49 | `price.md` |
| `launch-landing-page.yml` | 40 | `launch.md` |
| `validate-a-market.yml` | 35 | `validate.md` |
| `research-question.yml` | 33 | `research.md` |

`gate:` declarations across all six playbooks: **`qa-verdict` ×3 · `founder-approval` ×3 ·
`outbound-approval` ×1** (7 total). One playbook carries an inline note that its stages are advisory
and that only `gate: qa-verdict` resolves to a process.

### Lens and gate files — all four present

| File | Exists | Lines |
|---|---|---|
| `.claude/lenses.yml` | yes | 201 |
| `.claude/review-lenses.yml` | yes | 230 |
| `.claude/gates.yml` | yes | 221 |
| `.claude/qa-tier-floor.yml` | yes | 468 |

`gates.yml` declares **four gates**: `qa-verdict` (`kind: command`), `founder-approval`,
`outbound-approval`, `migration-approval` (all `kind: human`). Matches the documented shape.

---

## 5 · Hooks, settings, sandbox

Measured on **TREE A**.

### `.claude/hooks/` — 8 files, 3,579 lines

| File | Lines | Registered in `settings.json`? |
|---|---|---|
| `schema-lint.js` | 1947 | no — invoked by `npm run lint:agents` |
| `pre-tool-use.sh` | 676 | **yes** — `PreToolUse`, matcher `Bash\|Edit\|Write\|NotebookEdit\|mcp__` |
| `session-start.js` | 259 | **yes** — `SessionStart` |
| `budget-guard.js` | 204 | **no — zero references in `settings.json`** |
| `gsa-context-monitor.js` | 182 | no |
| `stop.sh` | 139 | no |
| `gsa-statusline.js` | 109 | no (referenced via `statusLine`, see below) |
| `gsa-check-update.js` | 63 | **yes** — `SessionStart`, runs before `session-start.js` |

`grep -c 'budget-guard' .claude/settings.json` → **0**. It is referenced in 10+ Markdown/JS files
elsewhere in the repo (`README.md`, `CODEBASE-MAP.md`, `qa.js`, five `docs/03-system-design/*.md`) but
nothing wires it to an event. This confirms the "unregistered" note in the fate table.

### `settings.json` — 100 lines

| Fact | Measurement |
|---|---|
| Top-level keys | `permissions`, `hooks`, `statusLine`, `sandbox` |
| `sandbox.enabled` | **exists, value `true`** |
| `sandbox.failIfUnavailable` | exists, value `true` |
| `sandbox` sub-keys | `enabled`, `failIfUnavailable`, `filesystem` |
| `sandbox.filesystem` sub-keys | `denyRead`, `allowWrite` |
| `sandbox.network` key | **absent** (`grep -c '"network"'` → 0) |
| `sandbox.credentials` key | **absent** (`grep -c '"credentials"'` → 0) |
| `permissions.allow` entries | 29 |
| `permissions.deny` entries | 10 |
| `hooks:` event names present | **`SessionStart`** and **`PreToolUse`** only — 2 of the available events |
| `.claude/settings.json.proposed` | exists, 60 lines |

There is no `PostToolUse`, `Stop`, `SubagentStop`, `UserPromptSubmit`, `PreCompact` or `Notification`
registration. `stop.sh` (139 lines) exists on disk with no `Stop` event to fire it.

---

## 6 · Scripts and checks

`scripts/` holds **71 `.mjs` files** (47,021 lines total) and `scripts/lib/` holds **10 `.js` files**
(6,576 lines). **The file-name listings of `scripts/` and `scripts/lib/` are byte-identical between
TREE A and TREE B** (`diff` returns nothing); only `verdict.mjs` differs in size (A 534, B 586).

`scripts/lib/*.js`, all ten:

| File | Lines |
|---|---|
| `check-suite.js` | 1978 |
| `claim-append.js` | 967 |
| `claims.js` | 912 |
| `memory-entries.js` | 702 |
| `resolvers.js` | 663 |
| `judges.js` | 421 |
| `figures.js` | 415 |
| `usage.js` | 264 |
| `classifier.js` | 187 |
| `events.js` | 67 |

Largest `scripts/*.mjs`: `check-suite.test.mjs` 3241 · `ledger.test.mjs` 2401 · `extract-reference.mjs`
2106 · `evict-memory.test.mjs` 2092 · `run-gate.test.mjs` 1802 · `build-tokens.test.mjs` 1742 ·
`design-probe.test.mjs` 1651 · `merge-gate.test.mjs` 1651 · `extract-reference.test.mjs` 1652 ·
`ledger.mjs` 1531 · `design-probe.mjs` 1453 · `produce-verdict.test.mjs` 1303 ·
`pre-tool-use.test.mjs` 1302 · `evict-memory.mjs` 1125 · `claim-append.test.mjs` 1090 ·
`produce-verdict.mjs` 1084.

### Check-suite size and verdicts

| Measurement | TREE A | TREE B |
|---|---|---|
| `require('./scripts/lib/check-suite.js').STEPS.length` | **48** | **48** |
| `Object.keys(...EXCLUDED).length` | 10 | 10 |
| `ls .qa/verdicts \| wc -l` | **68** | **80** |

The 48 matches the figure `CLAUDE.md` states. The verdict count has moved well past the 50 recorded
there for `origin/main` at `d1294a4`.

---

## 7 · Mission control and launchers

### `mission-control/` — 60 files (excluding `node_modules`), 9 top-level entries

Top level: `bun.lock`, `check.mjs`, `client/`, `package.json`, `README.md`, `scripts/`, `server/`,
`test/`, `tsconfig.json`.

**There is no `web/` directory.** The client is `client/`.

`server/` top level (11 entries): `app.ts`, `collectors/`, `config.ts`, `index-cache.ts`,
`index-store.ts`, `index.ts`, `lib/`, `projects.ts`, `routes/`, `state.ts`, `trust.ts`.

`scripts/` (4 files): `check-cold-start.ts`, `consume-dispatch.ts`, `trust-store.ts`, `trust.ts`.
**`consume-dispatch.ts` exists: 685 lines** — the founder-run queue consumer.

### `bin/` — 5 files, 5,086 lines

| File | Lines |
|---|---|
| `warroom` | 3429 |
| `fleet-install.mjs` | 1053 |
| `install.js` | 308 |
| `install-war-room.sh` | 149 |
| `init-from-template.sh` | 147 |

### `war-room/` — exists

4 top-level entries (`bin/`, `dashboard/`, `README.md`, `tmux/`), **62 files** total. It does **not**
contain `bin/fleet-install.mjs`; that file lives only at `bin/fleet-install.mjs`, which is the
correction the fate table records.

---

## 8 · Memory and ledger

`.claude/memory/*.md` on **TREE A**:

| File | Lines | Bytes |
|---|---|---|
| `DECISIONS.md` | 424 | **39,543** (cap 40,000 — 457 bytes of headroom) |
| `DECISIONS_ARCHIVE.md` | 409 | 34,472 |
| `DECISIONS_ARCHIVE_002.md` | 216 | 18,964 |
| `CODEBASE-MAP.md` | 202 | 15,218 |
| `LONG-TERM.md` | 84 | 6,086 (cap 100 lines) |
| `USER-INSIGHTS.md` | 18 | 719 |
| **Total** | 1,353 | 115,002 |

`.claude/ledger/` contains exactly **one file: `index.json`**. There are no `*.yml` claim files under
`.claude/ledger/`.

`.claude/ledger/index.json`: 661 lines, 27,802 bytes. Top-level keys `version`, `note`, `total`,
`claims`. **`claims` holds 42 entries.** The narrative ledger is `docs/03-system-design/CLAIM-LEDGER.md`.

`.claude/memory/` on **TREE B**, for comparison (total 1,409 lines / 123,932 bytes):
`DECISIONS.md` 407 / 39,416 · `DECISIONS_ARCHIVE.md` 409 / 34,472 · `DECISIONS_ARCHIVE_002.md`
277 / 24,324 · `CODEBASE-MAP.md` 202 / 15,218 · `LONG-TERM.md` 96 / 9,783 · `USER-INSIGHTS.md` 18 / 719.

Both trees sit within 600 bytes of the 40,000-byte `DECISIONS.md` cap.

---

## 9 · Docs corpus

Counts only. `find -name '*.md'`.

| Corpus | TREE A | TREE B |
|---|---|---|
| `docs/08-agents_work/sessions/*.md` | 171 | 180 |
| `docs/08-agents_work/handoffs/*.md` | 16 | 21 |
| `docs/03-system-design/**/*.md` | 36 | **86** |
| `docs/02-competitive/**/*.md` | 4 | **13** |
| `docs/**/*.md` (whole corpus) | 259 | **354** |

**`docs/03-system-design/round-5/` exists only in TREE B**, 8 top-level entries. Its Markdown:

| File | Lines |
|---|---|
| `STARTUP-OS-v3.md` | 2309 |
| `COVERAGE-MAP.md` | 1157 |
| `00-SPINE.md` | 203 |
| `FOUNDER-LIST.md` | 143 |
| `PATH-CENSUS.md` | 130 |
| `FOUNDER-CONTEXT.md` | 65 |

Plus two subdirectories, `page/` and `research/`.

`docs/02-competitive/reference-systems/` (TREE B only) holds exactly the five studies the fate table
names: `cast.md`, `gsd.md`, `loops.md`, `metaswarm.md`, `omnigent.md`.

---

## 10 · Differences between the trees

**Git relationship, measured — and it corrects the brief's premise.**

| Measurement | Result |
|---|---|
| `git merge-base b2cabad 280b5e7` | **`b2cabad`** — TREE A's own head |
| `git rev-list --count b2cabad --not 280b5e7` (A-only commits) | **0** |
| `git rev-list --count 280b5e7 --not b2cabad` (B-only commits) | **75** |

**TREE B is a strict descendant of TREE A.** B contains every commit A has, including the Stage A/B
fleet-installer commits, plus 75 more (`origin/main` at `4770d39`, the rethink docs, and the round-5
corpus). Nothing exists in TREE A that is absent from TREE B, except the file this census is writing.

### Paths present in only one tree

| Path | Only in | Size |
|---|---|---|
| `docs/03-system-design/round-5/` | TREE B | dir:8 — `STARTUP-OS-v3.md` 2309, `COVERAGE-MAP.md` 1157, `00-SPINE.md` 203, `FOUNDER-LIST.md` 143, `PATH-CENSUS.md` 130, `FOUNDER-CONTEXT.md` 65, plus `page/` and `research/` |
| `docs/03-system-design/STARTUP-OS.md` | TREE B | file:2826 |
| `docs/03-system-design/designs/` | TREE B | dir |
| `docs/03-system-design/dream/` | TREE B | dir |
| `docs/03-system-design/envision/` | TREE B | dir |
| `docs/03-system-design/review/` | TREE B | dir |
| `docs/03-system-design/vision/` | TREE B | dir |
| `docs/02-competitive/expansion/00-TERRITORY.md` | TREE B | file |
| `docs/02-competitive/expansion/concepts.md` | TREE B | file:2157 |
| `docs/02-competitive/expansion/hands.md` | TREE B | file:901 |
| `docs/02-competitive/expansion/open-source.md` | TREE B | file:1083 |
| `docs/02-competitive/reference-systems/` | TREE B | dir:5 — `cast.md`, `gsd.md`, `loops.md`, `metaswarm.md`, `omnigent.md` |
| `docs/03-system-design/final/` | **TREE A** | dir:1 — created by this census run; does not exist in TREE B |

### Paths present in both, differing in size

| Path | TREE A | TREE B | Direction |
|---|---|---|---|
| `scripts/verdict.mjs` | 534 lines | 586 lines | B ahead |
| `.qa/verdicts/` | 68 files | 80 files | B ahead |
| `docs/08-agents_work/sessions/` | 171 | 180 | B ahead |
| `docs/08-agents_work/handoffs/` | 16 | 21 | B ahead |
| `.claude/memory/DECISIONS.md` | 424 lines / 39,543 B | 407 lines / 39,416 B | B smaller — consistent with an eviction |
| `.claude/memory/DECISIONS_ARCHIVE_002.md` | 216 lines / 18,964 B | 277 lines / 24,324 B | B larger — receives the evicted entries |
| `.claude/memory/LONG-TERM.md` | 84 lines / 6,086 B | 96 lines / 9,783 B | B ahead |
| `docs/**/*.md` | 259 | 354 | B ahead by 95 |

### Identical in both trees

The file-name listings of `.claude/agents/` (18), `.claude/commands/` (16), `.claude/workflows/` (6),
`.claude/playbooks/` (6), `.claude/skills/` (140 entries / 134 skills), `.claude/hooks/` (8),
`scripts/` (71 `.mjs`), `scripts/lib/` (10 `.js`), `bin/` (5), `war-room/` (62 files),
`mission-control/` (60 files), and `fleet/` (`MANIFEST.yml` only). `check-suite.js` reports **48
steps and 10 exclusions in both**. All eight of `lenses.yml`, `review-lenses.yml`, `gates.yml`,
`qa-tier-floor.yml`, `CLAUDE.md`, `AGENTS.md`, `.mcp.json`, `mcp-policy.json` are line-for-line the
same size in both.

