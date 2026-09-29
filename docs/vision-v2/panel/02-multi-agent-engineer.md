# Panel 2 — Staff engineer, agent organisation and runtime (opus, read-only)

Read: the brief, the explorer data (components, stages, decisions, execution-profiles), the 09-28 and 09-10 handoffs, F2-07 (executive assessment and economics sections), AGENTS.md, the agent frontmatter, the workflow headers and .mcp.json.

## 1. Keep from S1.1
- **AD-002 (S1-C03): no department-agent roster.** Deterministic predicates go to code, waits go to durable procedures, interpretation goes to bounded model work and real-world work goes to humans. This matches the 7-engine collapse; there are no CEO/CMO personas.
- **AD-017: every step declares its read set, and the loader delivers and records what it actually delivered.** This is the fix for the 30-turn cap. Builders ran out of turns because they walked an 815 KB spec. A worker should get a generated context pack of 40 KB or less and nothing else.
- **AD-018: acceptance criteria are frozen before the step that produces the work and cannot be amended by the producer.** Agents may not grade their own work. Keep this as the job's `done_test`.
- **AD-021 (S1-C01): a standing role is a record, not a live agent carrying model memory.** A persistent "venture desk" is a folder: state, ledger, memory and playbook position. Every agent that touches it is temporary.
- **AD-020, reduced to one field.** Each worker brief carries `why_separate`, one of: isolation, parallelism, fresh context, or a different model family. Drop the six-reason admission test.
- **Execution profiles (07-integrations §5), core idea only.** Launch by argv, not through a shell; use structured output (`--output-format json --json-schema`, and `--output-schema` for codex exec); no inherited API keys; `--bare` stays forbidden because it drops subscription OAuth.
- **D6 operating rules.** A stage exits on running code, there is one review pass, and there are no recheck chains.
- **The harness as it stands.** Keep the 7 engines, the qa.js oracle-first gate, verdict hash-binding, the claim ledger, Rule 10 (unresolved never counts as a pass), the skill routers, the sandbox, and Workflow containment (no subagent can call Workflow). This is the base.

## 2. Cut or defer (each with the trigger that brings it back)
| Cut | Trigger to bring back |
|---|---|
| B01–B03 authority kernel: SERIALIZABLE Postgres, authority witness, restriction epochs, release order, controlled egress identities (S1-C04, S1-C08) | First money movement that the system itself can release, or first employee holding credentials |
| Pinned-version admission profiles (Claude 2.1.269, Codex 0.154.0) with an all-channel capability inventory before admission | First customer data processed by agents. Until then, pin with a lockfile and run a smoke test after each update |
| The separate mediated-MCP profile and the MCP broker (N-CLAUDE-MEDIATED) | First third-party MCP server that holds write credentials to a money or customer system |
| The 46-capability matrix, 566 question answers and 305K fixture checks as gates | Never as gates. Mine them as a backlog only |
| B08 protected-improvement boundary as a separate subsystem | More than 5 automated prompt or skill edits a week |
| The war-room bash launcher as the dispatch path. Six QA rounds showed it is a hostile surface for injection and exfiltration | Do not bring back. Keep it only as a human terminal layout |
| The 11 shim agents and the `vision-round-*` workflows | Phase 9 already removes the shims |

## 3. Add (what S1.1 missed)
1. **A job runner as a host process.** This is the missing layer. It is founder-launched, runs outside the agent sandbox, and has a SQLite queue. It does four things:
   - Creates the worktree before launch. This removes the sandbox problem: the harness documents that `git worktree add` fails under the armed sandbox with exit 128.
   - Launches `claude -p` or `codex exec` by argv, with a JSON schema for the return.
   - Persists stdout as the report. Subagents can't write report files (sourcer has no Write tool), so reports become return values and the runner writes them to disk.
   - Validates the return against the job. An empty result, a return with no diff, or a return that fails the schema all become `unresolved`.

   Build it by extending the mission-control 8b queue consumer that already exists, not by starting a new project.
2. **A standard job envelope, the same for both providers:** `{job_id, venture, engine, model, provider, context_pack[], done_test, max_turns, budget_tokens, why_separate, parent}`. The return is `{status: done|partial|blocked|unresolved, files_changed, commits, evidence[], continuation?}`. When a job hits its turn cap it returns `partial` plus a continuation job, not a failure. The planner splits work to 30 turns or fewer; the runner handles overruns.
3. **Subscription capacity accounting.** One semaphore per provider, starting at 3 Claude and 2 Codex jobs at once. The ceiling is an assumption; measure it. Add a 5-hour-window and weekly budget tracker fed by the usage logs (ccusage). When a window is nearly used up, the runner degrades: pause new builds and let reviews finish. There is no silent fallback to paid API usage (F2-07 economics). The explorer's Q-022 one-concurrent-job pin becomes a runner setting rather than an architecture decision.
4. **Codex as the second model family, used as a read-only reviewer** (`codex exec -s read-only --json --output-schema`). This is the first real way to meet "at least 2 model families" for the irreversible tier and `risk: high`. The single-family risk the harness accepted until 2026-11-17 can close. Handle the known Codex bug #19945, where it exits 0 with empty output when detached from a terminal: treat empty output as `unresolved` (Rule 10). Codex does not write code until its sandbox story holds. The 09-10 handoff shows a Codex pane cannot be tool-scoped.
5. **Portfolio packaging.** One repo per venture or project. The harness (agents, skills, hooks, lenses, playbooks) ships as a versioned Claude Code plugin from a private marketplace, so the ventures don't drift apart. A top-level `portfolio.yml` lists each venture, its weekly budget share and its active playbook.
6. **Swarm rule.** Fan-out is only for read-only work: research, review and option generation, via the `research.js` and `qa.js` patterns. Write work is serial per worktree, with at most one writer per venture repo unless paths are disjoint by declaration. Merges queue through the gate.
7. **Session rhythm.** The orchestrator is the main interactive session, the only one that can use Workflow, and it is stateless across days. It rebuilds state from the runner database, the ledger and the playbook position. Nightly and weekly jobs run from local launchd calling the runner, on an always-on Mac. Claude Code cloud routines and `claude-code-action` in GitHub Actions stay a later option once billing is confirmed.
8. **Observability.** Claude Code's OpenTelemetry export plus the runner's job table gives cost per job, turns per job, and the partial and unresolved rates. That is the self-improvement signal.

## 4. ADOPT / ADAPT / LEARN / BUILD
| Component | Verdict | Tool (licence) | Reason |
|---|---|---|---|
| Worker execution | ADOPT | `claude -p`, Claude Agent SDK (TS), `codex exec` | Both run on the subscriptions. LangGraph, CrewAI and AutoGen expect metered API keys, which breaks non-negotiable 2 |
| Engines, gate, ledger, skills | ADAPT | This repo | Add the envelope schema and `why_separate`; per-job-class `maxTurns` inside the lint ceiling of 120 |
| Job queue and runner | ADAPT, with a written BUILD reason | mission-control 8b consumer plus SQLite | The GUI tools are built for a human watching a board. No known tool does schema-validated returns, a per-provider semaphore and window budgeting against subscription CLIs |
| Parallel worktree UI | ADOPT, optional | Claude Squad (AGPL-3.0, tmux + worktrees), Vibe Kanban (Apache-2.0; community-maintained since Bloop's April 2026 shutdown), Conductor (Mac app) | Founder view of live lanes only. Never the source of truth |
| Durable execution | LEARN | Temporal, LangGraph checkpoints | Take checkpoint-per-step, idempotent effects and resume-by-id. Git plus SQLite is enough at this scale |
| Role and crew patterns | LEARN | CrewAI, AutoGen/AG2, MetaGPT | Take the lesson that role personas add tokens, not capability. Confirms AD-002 |
| Agent loop and sandbox | LEARN | OpenHands (MIT) | Event-stream history and container sandboxing. Container sandbox is deferred until the first customer-data trigger |
| Usage metering | ADOPT | ccusage (MIT), Claude Code OTel | Parse local usage logs for the window tracker |
| MCP | ADOPT the official servers, one grant per engine | Playwright (already in use), GitHub, Supabase/Postgres, Stripe (read-only until first payment) | Declare them per engine in frontmatter; schema-lint already refuses undeclared servers |
| Harness distribution | ADOPT | Claude Code plugins and marketplace | One versioned harness across N ventures |
| Scheduling | ADOPT | launchd/cron calling the runner | Cloud routines later, once billing is confirmed |

## 5. Top 3 risks
1. **Subscription terms or limits change underneath the system.** The Claude help page describes a separate Agent SDK / `claude -p` credit with overflow billed at API rates. Current reporting says that change is paused and headless use still draws on plan limits. The status is unstable, and the help page itself says shared production automation should use an API key. Codex restored its 5-hour window on 2026-07-30 and meters by tokens. Mitigation: a job envelope that works with either provider; runner-side budget caps, with overflow off by default; a policy that any always-on, customer-facing automation moves to an API key when the first customer arrives.
2. **Silent false success.** Examples: exit 0 with empty stdout; a turn-capped run that reads like it finished; a Workflow call from a subagent that does nothing; a partial worktree whose ~800 deletions look like the agent's own edits. Mitigation: the runner checks the return schema, the diff exists, and the `done_test` passes, and it maps anything unverifiable to `unresolved`. Never trust an agent's claim that it finished.
3. **The orchestrator overflows its context and becomes an unreviewed defect surface** (this repo has two logged cases, including 29/30 reported as 29/29). Mitigation: every orchestrator summary must quote the runner's own tally, not the orchestrator's restatement of it; the orchestrator carries no state across sessions; a 500-token handoff cap; the work's author and its gate reviewer are different model families.

## 6. Founder-only questions
1. Which plans exactly: Claude Max 5x or 20x, and ChatGPT Plus, Pro 5x or Pro 20x? Is any paid overflow at API rates allowed, and if so, what is the monthly cap? (Recommendation: overflow off; measure four weeks, then set the concurrency ceilings.)
2. Codex's role: reviewer-only (recommended) or also a builder, given it cannot be tool-scoped?
3. Is there an always-on machine for overnight runner jobs, or should scheduled work move to GitHub Actions or cloud routines?
4. One repo per venture plus a harness plugin (recommended), or a monorepo?
5. What starting ceiling for concurrent write jobs? (Recommendation: 3 Claude writers across the portfolio, plus Codex reviews.)

Sources (accessed 2026-09-29):
- https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
- https://www.digitalapplied.com/blog/anthropic-claude-credit-overhaul-june-15-2026
- https://extraheadroom.com/codex-usage-limits
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- https://www.augmentcode.com/tools/open-source-agent-orchestrators
- https://nimbalyst.com/blog/best-multi-agent-coding-tools-2026/
