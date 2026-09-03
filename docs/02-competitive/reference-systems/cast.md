# CAST — Reference System Study

**Studied:** `claude-code-dashboard` (the only repo checked out; see caveat below)
**Source:** local checkout at `scratchpad/refs/cast`, single squashed commit `4414647`, package.json `version: 2.7.0`
**Read:** full `server/`, `src/api`, key `src/utils`, `CHANGELOG.md`, `dashboard-audit-report-2026-04-01.md`, `docs/audits/2026-07-02-v9-system-audit.md`, `articles/dev-to-cast-dashboard.md`, `docs/superpowers/{plans,specs}/2026-03-22-cast-senior-dev-architecture*.md`

## 0 · A caveat that reshapes this whole report

CAST is **two repositories**. `claude-code-dashboard` (checked out here) is a **read-only observability UI** — it has no `.claude/agents/`, `.claude/hooks/`, or `.claude/commands/` of its own (`find .claude` returns one file, `launch.json`). The 23 agents, hook scripts, slash commands, `CLAUDE.md` dispatch table, and `cast-db-init.sh` that *owns* `cast.db`'s schema all live in a sibling repo, `claude-agent-team` (`github.com/ek33450505/claude-agent-team`), which was **not** provided and is not on disk anywhere in this environment (`scratchpad/refs/` holds `cast`, `auto-company`, `gsd`, `metaswarm`, `omnigent`, `ralph` — no `claude-agent-team`).

This means: the **observability schema** (§2) and **what a hook can be observed doing from the dashboard side** (§3, partial) are grounded in real code. The **actual hook scripts, their exit-code contracts, and the live `CLAUDE.md` dispatch table** (§3 full detail, §4) are reconstructed from planning documents (`docs/superpowers/plans|specs/`) that were committed *into the dashboard repo* as design artifacts for a cross-repo change — they are the best evidence available, but they are plan/spec prose about the other repo, not that repo's code. Every claim below is labeled by its evidence tier.

---

## 1 · What

- **This repo is 0 agents, 0 hooks, 0 commands.** It is an Express 5 + better-sqlite3 API (`server/`, 47 route files, 24 `__tests__` files) and a React 19 + Vite 6 SPA (`src/`, 22 views) that reads `~/.claude/` and `~/.claude/cast.db`.
- **Agents (per README, unverifiable here):** 23, installed by `claude-agent-team/install.sh`. This number moved: v2.4.1's changelog corrects an earlier fallback list of 30 (including 7 retired agents) down to 23; a 2026-03-22 design doc in this repo talks about "28 specialized agents"; the 60-second-pitch article (undated draft) says 17. Treat 23 as current-as-of-README, not as independently verified — it is asserted by a repo this environment doesn't have.
- **Hooks:** the dashboard's own `/api/hooks` route parses `~/.claude/settings.json`'s `hooks` block at request time — it does not know hook *count* ahead of reading a live installation. README's architecture table names 4 by function: `PostToolUse:Agent` (code-reviewer auto-dispatch), `PreToolUse:Bash` (guard), cost-tracker, agent-stop. An earlier changelog entry (v2.2.0) corrects a prior README claim of "81 hooks" to "26 registered handlers across 13 events" — another instance of this project publishing a number about the other repo and later retracting it.
- **Commands:** not enumerable from this repo either; `DocsView` hardcodes a slash-command list the 2026-07-02 audit calls stale (18/21 commands, docs/audits §C).
- **Maturity:** `package.json` version 2.7.0; `CHANGELOG.md` runs v1.1.0 (2026-03-31) → v2.7.0 (2026-07-04), so roughly 3 months of dated history, 9 releases. Git history itself is a single squashed commit — no per-commit archaeology possible; CHANGELOG is the record.

---

## 2 · The observability schema

### 2.1 The contract, not the DDL

No `CREATE TABLE` statement for `cast.db` exists in this repo — schema is "owned by CAST's `cast-db-init.sh`" (`CLAUDE.md`, `CHANGELOG.md` v2.6.0). What exists instead is `server/utils/schemaGuard.ts`'s `EXPECTED_SCHEMA`: a **hand-maintained column contract** the dashboard's SQL depends on, diffed against the live DB at every server start (`verifySchema`/`logSchemaDrift`) and pinned by `server/__tests__/schemaContract.test.ts`. This is the closest thing to a schema this repo has, and it is explicitly a *subset* — the 2026-07-02 audit found the real `dispatch_decisions` table carries at least `model, effort, wave_id, parallel, outcome` on top of what's listed below (audit §E2), none of which the dashboard reads.

```ts
// server/utils/schemaGuard.ts — verified against CAST v8 (PRAGMA user_version = 8)
agent_runs:                ['id','session_id','agent','model','started_at','ended_at','status',
                             'input_tokens','output_tokens','cost_usd','agent_id','response',
                             'duration_ms','tool_uses']
dispatch_decisions:        ['id','session_id','chosen_agent','prompt_snippet','created_at']
sessions:                  ['id','project','project_root','started_at','ended_at','status','deleted_at']
dispatch_events:           ['id','agent','task_name','triggered_at','status','report_path']
tool_call_failures:        ['id','timestamp','session_id','tool_name','error','project','data']
quality_gates:              ['id','session_id','agent_name','timestamp','status_line','contract_passed','created_at']
hook_failures:              ['id','hook_name','exit_code','stderr','session_id','timestamp']
routing_events:             ['id','session_id','timestamp','prompt_preview','action','matched_route','event_type','data']
agent_truncations:          ['id','session_id','agent_type','agent_id','timestamp','has_status','has_json','last_line','char_count']
agent_protocol_violations:  ['id','session_id','agent_type','agent_id','violation','pattern','timestamp','raw_excerpt']
worktree_anomalies:         ['id','agent_id','worktree_path','detected_at','repo_root','state','reason']
eval_runs:                  ['id','eval_id','agent','attempt','status','grader_results','pass_at_k','k','duration_ms','started_at','model','cost_tier']
rate_limit_snapshots:       ['ts','tpm_limit','tpm_used','rpm_limit','rpm_used']
memory_consolidation_runs:  ['id','run_id','project_id','status','memory_files_read','transcripts_scanned','candidates_written','started_at','completed_at','error']
archived_memories:          ['id','agent','archived_at']
```

Tables the dashboard queries but does **not** put in this contract (so drift on them is silent — no `verifySchema` coverage): `swarm_sessions`, `teammate_runs`, `agent_memories`, `incidents`, `injection_log` (`id, session_id, prompt_hash, fact_id, score, score_breakdown, injected_at` — `server/routes/injectionLog.ts`), `parry_guard_events` (`id, tool_name, input_snippet, rejected_at` — `server/routes/parryGuard.ts`), `routines`, `budgets`. Per the 2026-07-02 audit, `parry_guard_events`'s writer "never shipped" — the route and its dashboard panel exist over a table that has always been empty by design, and `teammate_messages` was retired mid-project (v9) while a route (`swarm.ts`) kept querying it unguarded until fixed.

### 2.2 What writes each row, and when

**Nothing in this repo writes `agent_runs`, `sessions`, `dispatch_decisions`, `routing_events`, or any of the tables above** except in one narrow, now-deliberately-limited case: `server/routes/seed.ts`'s `POST /api/cast/seed`, gated behind `CAST_DASHBOARD_CONTROL=1` + token, backfills token/cost columns from JSONL — it does not create rows, and as of v2.6.0 it no longer runs automatically at boot (see §6, finding A1). The actual writer is the CAST hook pipeline in the other repo — moment-of-write is asserted only in prose: "Hook-driven dispatch... CAST hooks write every agent spawn, completion, and status change" (`articles/dev-to-cast-dashboard.md`). This dashboard is consumer-only.

### 2.3 Cost per dispatch: measured or estimated? Two independent pipelines, and they disagree

There are **two cost numbers for the same activity**, computed two different ways, and the dashboard is explicit that it doesn't fully trust either:

1. **`agent_runs.cost_usd`** — a column the flagship writes directly into `cast.db`. The dashboard treats it as "the record CAST treats as ground truth" (audit §A1) but never recomputes or verifies it — it's opaque from this side.
2. **JSONL-derived cost** (`server/utils/jsonlTokenTotals.ts` → `estimateCost()` in `server/utils/costEstimate.ts`) — the dashboard's **own** hardcoded per-model $/Mtok table (`MODEL_RATES`, e.g. `claude-sonnet-4-6: {input:3, output:15, cacheWrite:3.75, cacheRead:0.30}`), multiplied against token counts parsed straight out of `~/.claude/projects/**/*.jsonl`, **including cache creation/read tokens that `agent_runs.cost_usd` may not capture**.

The dashboard's own article states the reconciliation rule explicitly: *"When they overlap, JSONL wins — it's the ground truth from Claude Code itself"* — e.g. `agentRuns.ts`: `totalCost: costMap.get(s.session_id) ?? s.total_cost`. So cost is **estimated by the dashboard from raw tokens**, not read verbatim from a CAST-computed field, whenever a session-level number is shown. Per-run `cost_usd` in `agent_runs` list views is read as-is from the DB (unverified provenance). The 2026-07-02 audit adds a third data source neither pipeline uses: `otel_metrics` (19,412 rows, "REAL token/cost/LoC/commit metrics" per the audit) sits completely unqueried — `grep -rn otel server src` returns zero hits at HEAD. The richest, most likely-accurate cost source in `cast.db` is simply never read.

### 2.4 "What did this task cost" vs "what did this session cost" — not answerable as asked

**Session cost:** yes, cleanly — `getSessionCostMap()` sums one JSONL session's tokens through `estimateCost()`. One session = one number.

**Task (single agent dispatch) cost:** partially, and only via `agent_runs.cost_usd`, which the dashboard does not independently verify and which the audit flags as possibly using estimation internally on the CAST side too (unknown — that logic isn't in this repo). There is **no join from a `dispatch_decisions` row (a routing choice) to the resulting `agent_runs.cost_usd`** by primary key — the correlation used everywhere in this codebase is a **heuristic**, repeated verbatim in `agentRuns.ts`, `routing.ts`, `analytics.ts`, `workLogStream.ts`:

```sql
(SELECT dd.prompt_snippet FROM dispatch_decisions dd
  WHERE dd.session_id = ar.session_id AND dd.chosen_agent = ar.agent
    AND unixepoch(dd.created_at) <= unixepoch(ar.started_at) + 60
  ORDER BY unixepoch(dd.created_at) DESC LIMIT 1)
```
i.e. "the most recent dispatch decision for this same agent in this same session, within 60 seconds before this run started." No foreign key; if two dispatches of the same agent land within 60s of each other in one session, this silently picks the wrong one. So: **"what did this task cost" is answerable only approximately**, by trusting `agent_runs.cost_usd` for that one row and a best-effort textual match back to the prompt that caused it — not a real query you'd cite in a bill-back.

### 2.5 Dashboard update mechanism — SSE-delivered, two different latencies underneath

Not pure SSE end to end — it's **file-watch push + DB poll-then-push**, both funneled through one SSE stream:

- `server/watchers/sse.ts`: `chokidar.watch(PROJECTS_DIR, {depth:4})` on `~/.claude/projects/**/*.jsonl`. On `add`/`change`, parses the new/changed JSONL tail and **broadcasts immediately** (`session_updated`, `agent_spawned`, `routing_event`, `tool_use_event`) — this path is genuinely event-driven, sub-second latency bounded only by filesystem event delivery + JSONL parse time. A 15s heartbeat keeps `EventSource` alive; client reconnects after 3s on `onerror` (`src/api/useLive.ts`).
- `server/watchers/castDbWatcher.ts`: `cast.db` (better-sqlite3, no native change notification) is **polled every 3000ms** (`pollMs = 3000` default), tracking a high-water-mark `rowid` per table (`agent_runs`, `sessions`, `routing_events`) and broadcasting only new rows as `db_change_*` events over the same SSE channel. **This is the real latency bound for anything sourced from `cast.db` — up to 3s, not "live."**
- On every new SSE connection: replays the last 15 JSONL lines from the most-recently-active session file (no per-connection directory sweep — an incrementally tracked pointer, `activeJsonlPath`), plus a "stale reconciliation" query for `agent_runs` completed in the last 2 hours so a reconnecting client can clear phantom "running" badges.
- Frontend: TanStack Query cache invalidation keyed off the SSE event `type` (e.g. `db_change_agent_run` → invalidate the `agent-runs` query key), not blind polling — README states the Swarm page separately polls every 5s (this appears to be a page not wired to SSE invalidation, an inconsistency worth checking if reimplementing).

---

## 3 · Hooks and gates

### 3.1 What this repo can prove about hooks (code-backed)

`server/routes/hooks.ts` (`GET /api/hooks`, `GET /api/hooks/health`) parses `~/.claude/settings.json`'s `hooks` object — a Claude Code standard structure keyed by event name (`PreToolUse`, `PostToolUse`, `Stop`, etc.) with `matcher`/`hooks[].command`/`timeout` — plus any `hookify.*.local.md` files (frontmatter `event:`/`description:`/`conditions:`, a separate declarative-hook convention). It does **not** execute or intercept anything; it is read-only introspection of whatever is installed. Health scoring is filesystem-only: resolve the script path out of the shell command string, `stat` it, and cross-reference `hook_failures` (a table with `hook_name, exit_code, stderr, session_id, timestamp` — see §2.1) for a same-hook failure in the last 24h → `red`/`yellow`/`green`. **This is the entire enforcement surface visible from the dashboard: it reports a hook is broken; it cannot make a hook block anything.**

### 3.2 What the plan/spec docs show about the actual hooks (prose-backed, other repo)

`docs/superpowers/specs/2026-03-22-cast-senior-dev-architecture-design.md` lays out a 5-layer enforcement stack, explicit about which layers are soft and which are hard:

```
Layer 1 (soft):   CLAUDE.md triage protocol + capability registry   — text the model may ignore
Layer 2 (medium): route.sh context injection — no-match fallback     — a script, but advisory output
Layer 3 (medium): PostToolUse hook — after Write/Edit, remind to dispatch code-reviewer
Layer 4 (medium): Stop hook — audit agent usage before session ends
Layer 5 (hard):   git-commit-intercept.sh — blocks raw git commit (exit code 2)
```

**The requested "auto-dispatch-a-reviewer-after-edits" hook (Layer 3) is explicitly NOT a block.** Its full script, per the companion plan doc:

```bash
#!/bin/bash
# post-write-review.sh — PostToolUse hook for Write|Edit
# This is a prompt-type hook output (stdout becomes additionalContext).
echo "**[CAST]** You just modified code. After completing your current logical unit of changes, dispatch the \`code-reviewer\` agent (haiku) to review. Do NOT skip this step."
```
It writes to stdout, which Claude Code's `PostToolUse` convention folds into `additionalContext` for the model's next turn — a **nudge**, not an interrupt. Nothing stops the model from ignoring it; there is no exit-code check downstream. Registration is a second `PostToolUse` entry under the `Write|Edit` matcher, timeout 3s, alongside a pre-existing `auto-format.sh` entry.

**The requested "cost-tracker" hook is not documented at the script level anywhere in this repo** — README names it only as a table-row label ("cost-tracker") with no script content, no event binding beyond implication (likely `PostToolUse` on the Agent tool or a `SubagentStop`, based on where `agent_runs.cost_usd` would need to be finalized, but this is inference, not evidence).

**The one confirmed hard block** is `git-commit-intercept.sh`, described only as blocking a raw `git commit` with **exit code 2** — the standard Claude Code convention for "reject and feed stderr back to the model as a blocking error," as opposed to exit 1 (non-blocking error surfaced to the user) or exit 0 (pass). This is the only place in the entire corpus (code + docs) where a specific blocking exit code is named. Its actual script is not present in this repo.

**The Stop-hook "audit" (Layer 4) is a `prompt`-type hook**, not a script — configured inline in `settings.local.json` as literal text injected at session end asking the model to self-report whether it delegated correctly. This is enforcement by asking the model to grade its own homework, with no downstream check on the answer — weaker than Layer 3, despite being labeled "medium."

### 3.3 The dashboard's own gate — real code, worth separating from Claude Code hooks

`server/middleware/controlGate.ts` is a **dashboard-side** authorization gate (not a Claude Code hook) guarding the dashboard's own mutating endpoints (`/api/control/*`, `/api/castd/*`, `/api/cast/exec`, and others added over time). It is genuinely well-built: safe verbs (`GET/HEAD/OPTIONS`) always pass; disabled → 404 (hides existence); enabled-but-unconfigured → 503 (refuses rather than run unauthenticated); bad/absent token → 403 via `crypto.timingSafeEqual`, with a same-length dummy compare on a length mismatch so timing can't distinguish "no token" from "wrong token." See §7 (Steal).

Its coverage was, however, **incomplete for months** — the 2026-07-02 audit (§A2) found it protected only 3 of the mounts that needed it; `POST /api/memory/backup-trigger` ran `execSync` on **any anonymous POST**, unauthenticated, until fixed in the same pass. A well-designed gate with an incompletely-applied perimeter is a distinct failure mode from a badly-designed gate — worth naming precisely if reimplementing this pattern: **build the gate once, and enumerate every mutating route against it as a checked list, not by memory.**

---

## 4 · Model-driven dispatch

**Regex-first, model-as-fallback — this is the load-bearing nuance the request's framing ("routing by a table the model reads, rather than by regex") slightly overstates.** Per the 2026-03-22 design doc, the actual architecture is **layered, not purely model-driven**:

1. `scripts/route.sh` + `config/routing-table.json` — a **regex pattern table** matched first against the user prompt (example from the plan doc's own test snippet: `patterns = {'planner': [r"let's build", r'add.*feature', r'implement', ...]}`). This is classic keyword/regex routing, run before the model ever reasons about it.
2. Only on no-match does the **Triage Protocol** — injected into `CLAUDE.md` as prose the model reads and follows at its own discretion — kick in: INTERPRET → DECOMPOSE → MATCH against an "Agent Capability Registry" (a decision table in `CLAUDE.md`, organized "when you see this, dispatch this," tiered HAIKU/SONNET/OPUS by task weight) → MODEL SELECTION (cheapest capable tier) → LOG to `routing-log.jsonl`.

So "model-driven dispatch" here means: **the fallback path is model-driven; the primary path is regex.** This is architecturally honest given the alternative (pure-regex misses "vague work prompts" — literally the stated problem this doc set out to fix) but it means a claim of "routing by a table the model reads, rather than by regex" describes only the escape hatch, not the common case.

**How routing decisions get recorded:** a new action type, `senior_dev_dispatch`, appended to the routing log alongside the existing regex-matched `dispatched`/`agent_dispatch` actions, distinguished in the dashboard by a third badge type (`senior dev` vs `hook` vs `auto` — `SystemView.tsx` per the plan). The logged shape includes a `reasoning` field the regex path never has:
```json
{"timestamp":"...", "prompt_preview":"keybindings page is broken", "action":"senior_dev_dispatch",
 "matched_route":"debugger", "agentName":"debugger", "agentModel":"sonnet",
 "reasoning":"Bug report → debugger agent"}
```
Whether this `reasoning` field made it into `routing_events.data` (a JSON blob column) in the live schema, or whether the whole Senior Dev layer shipped as designed, **cannot be confirmed from this repo** — no later CHANGELOG entry references "Senior Dev" or "Triage Protocol" by name, and `dispatch_decisions`'s actual columns per the 2026-07-02 audit (`chosen_agent, model, effort, wave_id, parallel, outcome`) don't obviously include a free-text `reasoning` field either — plausible the design shipped in a revised shape, or didn't ship at all. Flag as unverified.

**Does anything measure whether routing was correct after the fact? No — and there's a specific, load-bearing bug that keeps the one column that could answer this from ever being seen.** The real `dispatch_decisions` table has an `outcome` column (per the 2026-07-02 audit, §E2) — exactly the field you'd want for "was this dispatch decision right." But `GET /api/dispatch-decisions` (`server/routes/qualityGates.ts` (lines 126 to 155, in the studied repository)), the dashboard's dedicated "Dispatch Decisions" panel, queries **`dispatch_events`** — a different, 6-column table (`id, agent, task_name, triggered_at, status, report_path`) used for cron/scheduled dispatch (the "Routines" page) — and aliases its columns to fit the frontend's `DispatchDecision` shape:
```sql
-- server/routes/qualityGates.ts:143-152 — confirmed still live at HEAD, 2026-09-01
SELECT id, NULL AS session_id, triggered_at AS timestamp,
       agent AS dispatch_backend, task_name AS plan_file
FROM dispatch_events
ORDER BY triggered_at DESC LIMIT ?
```
This was documented as finding **B6** in the 2026-07-02 audit ("Dispatch Decisions panel shows the WRONG TABLE... real `dispatch_decisions` [393, written today] unsurfaced") and explicitly deferred to future work ("R5 ... sessions 2-3") in that audit's own disposition — **it is unresolved at the current HEAD**, verified directly against the file rather than inferred from the changelog. Everywhere else `dispatch_decisions` is touched, it's only via the narrow `prompt_snippet` correlated subquery (§2.4) — never `model`, `effort`, `wave_id`, `parallel`, or `outcome`. **So: the data to answer "was routing correct" exists in the real database and has existed since at least 2026-07-02; nothing in this codebase reads it.**

---

## 5 · Agent tiering

**Declared per-agent, read live off disk — not computed, not enforced by the dashboard.** `server/parsers/agents.ts::loadAgents()` reads every `~/.claude/agents/*.md`, parses YAML frontmatter with `gray-matter`, and takes `model` straight from the frontmatter field (`data.model || 'sonnet'` — sonnet is the fallback default if unspecified). No logic infers a tier from task type, cost, or history; it's whatever string the agent file's author wrote (`haiku` / `sonnet` / `opus`, presumably, though nothing here validates the value against an enum — a typo in a `.md` file would just render as-is). `writeAgent()`/`createAgent()` let the dashboard's own System page edit this field in place (behind `controlGate`), so tiering is a **live-editable config value**, not a build-time constant.

`src/utils/localAgents.ts` is an explicit **fallback-only** list (comment: *"FALLBACK ONLY — primary source is GET /api/agents/roster... Update this file only if the roster API is unavailable"*) — 23 bare agent names, no model field at all; tiering information only exists in the live `.md` files, never duplicated into the frontend fallback. `server/parsers/agents.ts` is the single source of truth when the flagship is actually installed; degrade path is names-only with tier information absent.

The pricing table (`costEstimate.ts` `MODEL_RATES`) is a **separate, independently-maintained** tier→price mapping that has to be hand-kept in sync with both the frontmatter values agents actually use and `~/.claude/config/model-pricing.json` (cited in a code comment as authoritative) — the 2026-07-02 audit's §C notes this drifted (missing `claude-fable-5` and `claude-opus-4-8` rates, mispricing "100/194 live sessions" via a sonnet fallback) until fixed same-day. Two independently-maintained tier tables (agent frontmatter `model:` field, and a hardcoded pricing dict) is a coupling the codebase pays for repeatedly.

---

## 6 · The self-audit

Two audits exist in-repo, roughly 3 months apart, auditing two different layers — read together they show a project that **repeatedly discovers its own architecture was wrong at a systemic level**, not just buggy at the margins.

**`dashboard-audit-report-2026-04-01.md`** (pre-consolidation, ~773-line `LiveView.tsx` era, later deleted wholesale in v2.0.0): the headline finding isn't any single bug, it's **scale of dead code as a symptom of unmanaged growth** — 10 dead components, an entire dead `LiveGraph/` visualization suite (`@xyflow/react` + `@nivo/network` installed for code with zero imports), `StatusBadge` and a 10-entry color map each independently redefined 3 times, date formatting reimplemented 5+ times. Nothing here is subtle; it's the accumulated cost of "every CAST feature got its own page" (confirmed independently by the article's dogfooding retrospective: 21 views, 7 nav groups, at peak). The fix that followed (v2.0.0, 2026-04-03) wasn't incremental cleanup — it was **deleting 14 view files and −6,802/+522 lines in one pass**.

**`docs/audits/2026-07-02-v9-system-audit.md`** (post-consolidation, current architecture) is the sharper document — 172 SQL queries, 122 endpoints, 22 views actually exercised against a live DB, "1 claim refuted and reclassified" (i.e. the audit process itself caught and corrected a false positive before publishing, worth noting as a practice). Its verdict sentence is unusually blunt for a document a team wrote about itself: *"CI is green and tsc is clean — the rot is semantic, not syntactic."* Its single most important finding (**A1**) is that **the dashboard itself was the cause of the schema drift it kept complaining about**: a `POST /api/cast/seed` fired on every server boot and silently re-`ALTER`'d back in six columns the flagship's canonical migration had deliberately dropped, one of which (`agent_runs.prompt`) turned out to be genuinely load-bearing (435 real rows powering `task_summary` everywhere) while the other five were provably dead (write-only, always 0/empty). This is presented candidly as *"the counter-shot in an ongoing war the dashboard keeps re-starting"* against the flagship's own migration. The fix (v2.6.0, same date) was to make the dashboard **perform zero DB writes at startup** and go fully "canonical-strict" — a direct reversal of the earlier article's own celebrated design ("Migrate idempotently... read the database you don't own defensively," see §8).

Beyond A1: a **control gate that only covered 3 of the mounts that needed it** (§3.3, worst case: unauthenticated `execSync` on `/api/memory/backup-trigger`), **timestamp-format comparisons broken as one bug class across many call sites** (ISO-`T` vs SQLite space-format compared lexicographically — corrupts a "last 15 minutes" filter into "same calendar day," documented producing 26 phantom "active" agents), a **join-key bug that fanned 5,891 real agent runs into 9,720 duplicated rows** with false truncation banners attached, and the dispatch-decisions/dispatch-events table-name confusion (§4). And — named explicitly and left undone by design — **the single richest data source in the database (`otel_events`/`otel_metrics`, ~111k rows, real per-tool timing and cost) has zero queries against it anywhere in the codebase**, both at the time of the audit and still today (confirmed via `grep`). The audit's own disposition (recorded by "Ed," the project owner, same day) explicitly scoped that work out as multi-session future effort — an honest "we know, and chose not to yet," not a missed finding.

---

## 7 · Steal

1. **`server/middleware/controlGate.ts` — the fail-closed control-surface pattern, verbatim.** Disabled → 404 (hides the endpoint exists at all, not "403 forbidden"); enabled-but-unconfigured → 503 (refuse rather than run open); bad/missing token → 403 via `crypto.timingSafeEqual`, with a dummy same-length compare on length mismatch so response timing can't distinguish "no token sent" from "wrong token sent." Reads (`GET/HEAD/OPTIONS`) always pass regardless of gate state, so observability keeps working even fully locked down. ~50 lines, zero dependencies beyond Node's `crypto`. Path: `server/middleware/controlGate.ts`.

2. **`server/utils/schemaGuard.ts` — a checked column-contract for any DB you consume but don't own.** A flat `Record<table, string[]>` of every (table, column) any route actually reads, diffed via `PRAGMA table_info` at boot (never throws, just logs — fail-soft by design since a drift warning must not block startup) and pinned by a dedicated `schemaContract.test.ts`. The mechanism generalizes directly to Agentvibe's own `cast.db`-shaped problem: any place one system's schema is a contract another system depends on without a shared migration tool. Keep the enumeration *complete* though — CAST's own miss (dispatch_decisions' `outcome`/`model`/`wave_id` columns existing but uncontracted and unread) shows a partial contract still lets exactly the useful columns silently drift into disuse.

3. **The dual-timestamp discipline, stated as a rule after being burned by it (A4):** *"Live timestamps are ISO with T; SQLite datetime('now') yields space-separated. Text comparison makes windows lie."* Fix-once via `unixepoch()` on both sides of every window comparison, plus a single shared client-side parser (`parseTimestamp()` in `src/utils/time.ts`) rather than each view inventing its own. Worth adopting as a lint-level rule before it ships once: **never compare two timestamp strings from different producers without normalizing to epoch first** — this bit CAST in at least 4 independent call sites (active-agent filter, SSE staleness window, executive-summary gate-pass-rate, completeness-badge rendering) despite each being a "small" bug individually.

4. **SSE architecture: chokidar-driven push for the fast path, poll-then-broadcast for the DB, one wire protocol.** `server/watchers/sse.ts` + `server/watchers/castDbWatcher.ts` — don't poll the client; poll the *unwatchable* source (SQLite) server-side on a fixed interval against a high-water-mark rowid, and forward everything (file events *and* DB deltas) down one `EventSource`. Client invalidates TanStack Query cache by event `type` rather than re-fetching everything. Directly reusable if Agentvibe wants a live "what's the fleet doing right now" view without inventing a second transport for DB vs filesystem sources.

5. **The audit discipline itself:** the 2026-07-02 audit is structured as **claims with inline proof** ("live 500 reproduced," "curl verified," row counts cited per finding) and explicitly separates *dead* surfaces (producer retired, remove) from *dormant* ones (producer exists but idle, keep and annotate honestly) — a distinction Agentvibe's own STATUS.md already leans toward but could make more literal. The audit also self-corrects mid-document (one claim "refuted and reclassified" before publication) — worth requiring adversarial re-verification of audit findings as a step, not just running one pass and shipping it.

---

## 8 · Reject

- **"Migrate idempotently" against a database you don't own, via defensive `ALTER TABLE ... try/catch` on every boot.** This is presented as a virtue in `articles/dev-to-cast-dashboard.md` (*"No migration framework, no version tracking. Just idempotent ALTER TABLE statements... SQLite throws if the column exists — we catch and move on"*) and was, per the project's own later audit, **the root cause of the exact schema-drift war the article is describing as solved**. The correct version of "don't own this schema" turned out to be *"perform zero writes at startup, period"* — not "write defensively." If Agentvibe consumes a DB or file another agent produces, the lesson is: never self-heal a schema you don't control; fail loud (schemaGuard's later posture) rather than silently re-adding what the owner deliberately removed.

- **A `/api/dispatch-decisions` endpoint that queries a table with a different name and shape than the one implied by its own route name**, shipped and left broken across at least two months of dated audit findings. Not a one-off — it's evidence that a route's name is not evidence of what it does; if Agentvibe builds a similarly-named observability endpoint, name it for the table it actually reads, or write the test that would have caught this (`SELECT` the literal table name and assert it, not just "returns 200 with the right JSON shape").

- **21 views / 7 nav groups grown by "every new feature gets its own page."** The project's own retrospective calls this out directly (*"observability UI for a running system grows unbounded... resist. Tabs > nav items"*) — worth taking as a pre-emptive constraint rather than something to rediscover after 21 views.

- **A Stop-hook "audit" that asks the model to self-report whether it delegated correctly, with nothing downstream checking the answer.** Labeled "medium" enforcement in the design doc but weaker than the PostToolUse nudge next to it — a hook that can only produce a confession, never a correction, isn't a gate. If porting the layered-enforcement idea, keep the *hard* layer (exit-code block) and treat self-audit prompts as observability signal only, not as an enforcement layer worth counting.

---

## 9 · Abandoned

Sourced from `CHANGELOG.md` (single available history; no per-commit git log to cross-check against, see §0):

- **`HookHealthView.tsx` + `server/routes/hookHealth.ts`** (v2.2.0) — removed as orphaned; backed a `hook_health` table that **does not exist** in `cast.db`'s schema. A whole page shipped against a table that was never real.
- **The "managed agents" feature** (v2.7.0) — frontend hook, `/api/managed-agents` route, and its `EXPECTED_SCHEMA` entry all deleted as dead code (unconsumed).
- **File Writes page** (v2.4.0 nav removal, v2.4.1 backend cleanup) — CHANGELOG explicitly notes the backend route survived one full release after the page was pulled from navigation ("v2.4.0 said page was removed but backend route was never cleaned up") — a small, honest admission that "removed" and "removed" don't always mean the same thing across a frontend/backend split.
- **Regex-only routing → "model-driven dispatch"** (v2.4.1): `docs/LIVE_ACTIVITY_REDESIGN.md` corrected in-place from *"36 specialized agents, pattern-based routing"* to *"23 specialist agents, model-driven dispatch"* — a real architectural shift the project tracked as a documentation fix, not (visibly) as a migration with its own plan doc, which is one reason §4's regex-vs-model split above had to be reconstructed from a different, earlier planning doc rather than read off a single canonical description.
- **`teammate_messages` table** — retired in CAST v9 on the flagship side; the dashboard's `swarm.ts` kept querying it unguarded and 500'd until patched (found in the 2026-07-02 audit, §B4). A retirement on one side of a two-repo system silently broke the other side for an unknown period.
- **The entire `LiveView`/Activity page + `LiveGraph/` visualization suite** — not a changelog line item but the largest single deletion: 773-line `LiveView.tsx`, an entire dead `@xyflow/react`/`@nivo/network`-based graph nobody imported, 10 more dead components, all removed in the v2.0.0 consolidation (14 files, −6,802/+522 lines) rather than incrementally fixed. The 2026-04-01 audit had recommended *fixing* LiveView first (it was, per the audit, the top user-reported issue); the actual resolution three days later was to delete it instead — worth noting as a real instance of "delete rather than fix" being the right call once a component accretes enough architectural debt, contra the audit's own recommendation.
- **Agent roster count churn** — 30-agent fallback list (with 7 already-retired agents baked in) replaced by the real 23-agent v7.4 roster in v2.4.1; this wasn't a one-time typo fix, it's evidence the dashboard's own hardcoded fallback list had been silently wrong for at least one full agent-team release cycle before anyone caught it.

---

## Report structure note

Sections are numbered per the assignment (1·WHAT through 9·ABANDONED). Every SQL query, TypeScript excerpt, and file path above was read directly from the checkout, not inferred from README prose, with the explicit exception of §3.2 (hook scripts) and part of §4 (the routing-table/Senior-Dev design), which are sourced from planning documents about the *other* repo and are labeled as such inline.
