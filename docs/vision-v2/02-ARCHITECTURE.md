# 02 — Architecture

## 1. Layers (five, each with one job)
| # | Layer | Holds | Built from |
|---|---|---|---|
| L1 | **Founder surface** | Monday page, `runner inbox`, Mission Control (read-only view), ntfy, interactive Claude Code | Mission Control, ntfy, CLI |
| L2 | **Orchestration** | The interactive `orchestrator` session; playbooks pick the stages; stateless across days | This harness |
| L3 | **Runner** (new) | SQLite job queue, job envelope, worktree creation, launch, status adjudication, capacity, schedules | Extends `mission-control/scripts/consume-dispatch.ts` |
| L4 | **Engines and capabilities** | 7 engines, lenses, playbooks, 134 skills, MCP servers, gates | This harness |
| L5 | **Records** | Per-venture repo (`venture.yml`, `company/`, ledger, `outcomes.jsonl`), owner memory, runner DB | git + claim ledger + SQLite |

Rule: **L1 never writes.** Approvals are written by the runner CLI (`runner approve <id>`); Mission Control stays a view (`crosscheck.test.ts` bans server writes and spawns). **L3 decides every status** — never the agent.

## 2. Agent organisation
- **Engines (standing, 7):** `orchestrator`, `framer`, `sourcer`, `builder`, `designer`, `reviewer`, `reviewer-readonly`. Unchanged. Domain (growth, customer, finance, legal-prep, support) is a **lens**, not an agent. No CEO/CMO personas (AD-002 kept).
- **Temporary workers:** every runner job is one engine instance with a fresh context, one context pack and one done-test. It dies when the job ends. A venture's "desk" is a folder, not a live agent (AD-021 kept).
- **Why a worker exists:** each envelope carries `why_separate` ∈ {isolation, parallelism, fresh-context, other-model-family}.
- **Swarms:** fan-out only for **read-only** work — research, review, option generation (the `research.js` and `qa.js` patterns). Write work is serial per worktree; at most one writer per venture repo unless paths are declared disjoint.
- **Codex:** second model family, **reviewer and judge only**, read-only sandbox, behind a PTY wrapper. Empty output = `unresolved`. Codex does not write code (cannot be tool-scoped).
- **Workflow tool:** main-session only (containment kept, `PS-WORKFLOW-CONTAINMENT`).

## 3. The runner and the job envelope
The runner is a host process the founder starts (launchd keeps it alive). It runs **outside** the agent sandbox because `git worktree add` fails under the armed sandbox (exit 128). It creates the worktree, launches the engine, and judges the result.

**Envelope** (`runner/schema/job.json`):
```
job_id, parent, chain_id, venture_id, kind (venture|project|harness),
engine, model, provider (claude|codex), provider_mode (subscription|api),
context_pack[] (paths+hashes, ≤40 KB), done_test (argv, frozen before launch),
max_turns (≤30), budget_tokens, why_separate,
flags: {untrusted_input, secrets, external_send}
```
**Return** (from the agent, via `--output-format json --json-schema`): `{claimed_status, files_changed, commits, evidence[], continuation?}`.

**Status is computed by the runner**, in this order: (1) harness preflight token present; (2) output non-empty and schema-valid; (3) a diff exists when the job is a write job; (4) `done_test` passes in a clean checkout of the job's commit; (5) no refused flag combination. Any check that could not run → `unresolved` (Rule 10). Status ∈ `done | partial | blocked | unresolved`. The agent's `claimed_status` is logged, never trusted.

**Launch:** argv, never a shell. `claude -p --agent <engine> --model <m> --output-format json --json-schema <f>` inside the worktree; `maxTurns` binds through the agent file (the CLI has no `--max-turns` in 2.1.284). Never `--safe-mode`, `--restricted` or `--bare` — each switches off the harness or subscription auth.

**Continuations:** a turn-capped job returns `partial` + a continuation. ≤2 continuations per chain, then `blocked` into the inbox. Each chain has a token budget. **Breaker:** if >30% of a day's jobs end `partial`/`unresolved`, the queue pauses and pushes one ntfy.

## 4. Memory layers and context packs
| Layer | Location | Written by | Rule |
|---|---|---|---|
| Working | Context window + context pack | Loader | Pack ≤40 KB, lists paths+hashes, "not found" ≠ "not searched" ≠ "excluded" |
| Session | Session files, CLI transcripts | Each job | ≤10 lines; transcripts searchable by FTS |
| Venture/project | `company/` in the venture repo: decisions, customers, offers, metrics, verbatim quotes | Engines via claims | Quotes and promises stay verbatim with source |
| Owner | `~/.agentvibe/owner.md` + `preference` claims | `/correct` only | ≤4 KB; a correction supersedes, never appends |
| Portfolio | `~/.agentvibe/portfolio/` — generated read-only view | Monday-page job | Reads only each repo's `venture.yml` + `outcomes.jsonl` summary (declared read set) |
| Harness | This repo | Build jobs | `CLAUDE.md` ≤8 KB, CI-checked |

- **Storage:** markdown in git + the claim ledger (`valid_until`, three-valued resolvers) + SQLite FTS5 for search. **Mem0 is cut** as a system of record; the `CLAUDE.md` stack line is corrected in J10.
- **Ledger additions:** `supersedes`, `valid_from`, `venture_id`.
- **Write quarantine:** web pages, customer messages and tool output enter memory only as a `source` claim with a quote — never as a preference, instruction or skill edit.
- **Auto memory** (Claude Code) is an inbox, promoted weekly.
- **Forgetting:** supersede and archive (`evict-memory.mjs`); deletion propagation waits for its trigger.
- **Isolation:** the context-pack loader refuses a path outside the job's `venture_id` repo, except the harness and the declared portfolio read set.

## 5. Skills and MCP
- **Skills:** the 134 curated skills and two-tier routers stay. New skills enter through `CURATION.yml` with a test. A skill unused for 90 days, or losing its subtraction test, is retired.
- **MCP:** one grant per engine in frontmatter, backed by `.mcp.json` (schema-lint refuses undeclared). Month one: `playwright` (designer), `claim-append` (sourcer). Each further server — GitHub, Stripe (read-only), Supabase, Gmail — is added **at its trigger** (03-COMPONENTS), after one vetting job.
- **Capability intake:** a quarterly `sourcer` job re-checks chosen tools (licence, maintenance) and proposes swaps.

## 6. Self-improvement loop
**Dormant until trigger:** ≥4 weeks of `outcomes.jsonl` across ≥2 ventures **or** ≥20 labelled cases for one skill. Until then only the drift alarms run.

When on (one session a week, <30 turns): cluster failures from `outcomes.jsonl` → ≤3 one-page change packets (evidence, diff, rival explanation, falsifier, rollback) → golden suite (promptfoo, pass^3) → Codex judges blind pairs → founder yes/no → merge through the gate. The candidate may not edit evals, hooks, resolvers or its own logs. Approvals with no edits are **not** positive labels. The loop pauses in any week with no shipped venture output, and whenever a drift alarm fires (06-METRICS).

## 7. Approvals, trust ladder, and "never without the founder"
**DecisionPacket** (kept from S1.1): exact artifact and version, options including refuse/delay, the no-answer behaviour, expiry. **Unanswered = refuse.** Daily cap: **10 decisions**; overflow waits and the runner lowers the proposing lane's rate.

**Trust ladder, per capability per venture:** propose-only → approve-then-execute → auto-with-notify → autonomous. Promotion needs 20 consecutive approvals **with** the founder having looked (not rubber-stamped) and is itself a founder decision; any reversal drops one rung. Every auto action still appears on the Monday page.

**Never without the founder, at any rung:**
1. Move, spend, refund or commit money.
2. Contact a person outside the company, or publish under the founder's or a venture's name (outbound approved per batch template).
3. Sign, accept or send any legal document; form an entity; tax filings.
4. Destructive change to production data; database migration.
5. Change billing tier or provider mode (subscription → API).
6. Rotate, create or share credentials.
7. Merge an irreversible-tier change (agent files, hooks, workflows, settings).
8. Promote an autonomy rung; pivot or kill a venture.
9. Record, or use, a customer call without the one-line consent script.

## 8. What runs where, on which subscription
| Work | Where | Subscription | Concurrency (start) |
|---|---|---|---|
| Interactive orchestration and building | Founder's terminal | Claude Code | Founder's own |
| Write jobs (builder, designer, framer) | Runner on the Mac, worktree | Claude Code | **2** |
| Read-only jobs (sourcer, reviewer) | Runner | Claude Code | shares the 2 |
| Second-family review / judging | Runner, `codex exec -s read-only` via PTY | Codex | **1** |
| Nightly (canaries, CLI contract, backups, drift) | launchd → runner | Claude Code (small) | 1 |
| CI (deterministic checks only) | GitHub Actions | none — **no subscription credentials in CI** | — |

**Capacity rules:** ccusage reads local logs to estimate the 5-hour window. The runner keeps a floor for the founder: queue pauses above ~60% of the window or while a founder session is active. A limit error is `blocked`, never `partial`. Overflow billing is **off**; a hard stop, not an alert. `models.yml` maps engines → models in one file; `provider_mode: api` is the exit if a subscription is throttled, changed or lost (degraded mode: reviews only, no nightly jobs).

## 9. Venture isolation
One repo per venture or project. Every job carries `venture_id`. Credentials come from a **per-venture env file** read by the runner only for jobs flagged `secrets`; 1Password CLI never runs in a worker environment. Separate sending domain per venture. NDA or client work gets its own repo and is excluded from the portfolio read set. Paused ventures are archived read-only.

**Three-flag rule:** the queue refuses any job with `untrusted_input` **and** `secrets` **and** `external_send`. No chat front door until a trigger (a second person needs mobile access).

## 10. Failure handling — the red team's 12 modes
| # | Failure mode | Mechanism | Job |
|---|---|---|---|
| 1 | The machine eats the company | v2 build is timeboxed; after it, `harness-ratio` on the Monday page, cap 20%; acceptance is a live venture | J00, J25, M1 |
| 2 | Subscription starvation | Per-provider semaphores, 60% window pause, founder floor, limit → `blocked`, `provider_mode` | J05, J09 |
| 3 | Silent false success | Runner computes status; done-test in clean checkout; nightly canaries must return `unresolved` | J01, J03 |
| 4 | Harness missing in workers | Preflight hook writes a token on first tool call; runner rejects results without it; agent-file hash check; fleet census | J06, J11 |
| 5 | Approval fatigue | 10/day cap, expiry → refuse, batch templates, trust ladder, unedited ≠ label | J24 |
| 6 | Untrusted input + secrets + outbound | Three-flag refusal; per-venture env; no 1Password in workers; no chat front door | J02, J19 |
| 7 | Runaway continuations | ≤2 continuations, chain token budget, 30% breaker | J04 |
| 8 | Context overflow | `CLAUDE.md` ≤8 KB CI cap; context pack ≤40 KB; `runner status --brief` <2 KB quoting runner tallies verbatim | J10, J15 |
| 9 | Action for the wrong venture | `venture_id` on every job; loader refuses cross-venture paths; per-venture credentials; seeded test | J02, J15, J28 |
| 10 | CLI churn, single-Mac disaster | CLI pinned, auto-update off, nightly contract check; runner DB + transcripts backed up; `runner stop --all`; RUNBOOK | J08 |
| 11 | Second family never lands | Codex PTY wrapper + known-defect test must return non-empty FAIL | J07 |
| 12 | Integration hell | Thin end-to-end path is J01; every later job widens it; replay fixtures; one integrated test at the end | J01, J28, J29 |
