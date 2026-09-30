# R0-A — Frontier of multi-agent systems and agent platforms (2026-09-30)

Round 0 outward seat. Researched on the web first; founder direction read only for §6. External claims carry URLs;
**[S]** = speculation/inference. Company numbers are the sources' numbers (some from secondary write-ups, flagged).

## 1. Inspiration map

Take: **use** (adopt) · **fork** (lift code/design) · **learn** (steal the idea).

| System | Does well | Idea to take | Licence · maturity | Source |
|---|---|---|---|---|
| Claude Code + Agent SDK | Hooks (deterministic, exit 2 blocks), skills (SKILL.md on relevance), subagents (isolated context → summary), headless | **Use.** Hooks = guarantee layer; skills = procedural memory; subagent = unit of isolation | Proprietary · GA | https://code.claude.com/docs/en/agent-sdk/overview |
| Claude Code agent teams | Lead + teammates on a shared **dependency-aware task list** + mailbox; blocked tasks auto-unblock | **Learn.** Claimable task list = lightweight blackboard | Proprietary · experimental | https://code.claude.com/docs/en/agent-teams |
| Claude Managed Agents | Hosted loop, checkpoints, scoped creds, tracing; **outcomes** (rubric self-check, up to +10 pts); multiagent; "dreaming" | **Learn.** Rubric self-correction and background consolidation as primitives | Proprietary · beta Apr 2026 | https://claude.com/blog/new-in-claude-managed-agents |
| OpenAI Codex CLI/cloud | Local CLI with approval modes; parallel cloud sandboxes, own git state, PR out; subagents; reads AGENTS.md + SKILL.md | **Use** as equal worker; `codex exec` is the headless seam | CLI Apache-2.0 · GA | https://developers.openai.com/codex/subagents |
| OpenAI Agents SDK | Handoffs, typed output, **guardrails as parallel tripwires**, tracing on by default | **Learn.** Fail-fast checks running alongside the turn | MIT · mature | https://openai.github.io/openai-agents-python/tracing/ |
| Google ADK | Sequential/Parallel/Loop workflow agents; evalsets + LLM-judge built in | **Learn.** Deterministic operators around stochastic agents; evals in the SDK | Apache-2.0 · GA | https://google.github.io/adk-docs/get-started/about/ |
| A2A v1.0 | Agent Cards at `/.well-known/agent-card.json`; **signed cards**; 150+ orgs; joined AAIF Aug 2026 | **Use** the card shape for our agent records | Apache-2.0 · LF | https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/ |
| MCP 2026-07-28 | **Stateless core** (no handshake; version+caps in `_meta`), Multi Round-Trip Requests, `Mcp-Method` routing header, reverse-DNS extensions, Tasks → extension | **Use.** Horizontally scalable, gateway-routable tool servers | Open spec · AAIF | https://modelcontextprotocol.io/specification/2026-07-28/changelog |
| Agentic AI Foundation | LF home of MCP, goose, AGENTS.md, now A2A; AWS/Anthropic/Google/MS/OpenAI platinum | **Use** its standards as our interface contracts | LF · Dec 2025 | https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation |
| LangGraph | Checkpoint per super-step; `interrupt()` + `Command(resume=…)`; time travel | **Learn.** Human approval = persisted pause. Checkpoints ≠ durable execution | MIT · 1.x | https://docs.langchain.com/oss/python/langgraph/interrupts |
| AutoGen → MS Agent Framework / AG2 | AutoGen maintenance since 2 Oct 2025; Agent Framework 1.0 GA Apr 2026; AG2 fork active | **Learn** the warning: framework churn is real | MIT / AG2 Apache-2.0 | https://atlan.com/know/ai-agent/what-is-autogen/ |
| CrewAI | Crews (roles) + **Flows** (`@start/@listen/@router`, state) | **Learn.** Separate who collaborates from what triggers what | MIT · ~58k stars | https://futureagi.com/blog/what-is-crewai-2026 |
| MetaGPT / MGX | Roles publish **schema'd artifacts to a subscribable pool**, not chat | **Learn.** Structured artifacts as inter-agent medium | MIT · research→product | https://arxiv.org/abs/2308.00352 |
| ChatDev 2.0 / MacNet | DAG topologies to 1,000+ agents; **logistic scaling law** | **Learn.** Topology is tunable; returns saturate | Apache-2.0 · research | https://arxiv.org/html/2406.07155 |
| OpenHands | Model-agnostic sandboxed coding agent; SDK + REST | **Fork/use** as third runtime or sandbox reference | MIT · mature | https://docs.openhands.dev/sdk |
| mini-swe-agent | ~100 lines, bash only, linear history, >74% SWE-bench Verified | **Learn.** Simple harness wins; trajectory = messages = training data | MIT · eval standard | https://github.com/swe-agent/mini-swe-agent |
| Devin / Cognition | "Don't Build Multi-Agents" (Jun 2025) → **Devin manages Devins** (Mar 2026): child VMs self-verify, coordinator resolves conflicts | **Learn.** Parallelism only with isolation + self-check + one integrator | Proprietary · GA | https://cognition.ai/blog/devin-can-now-manage-devins |
| Factory Droids | Same agent across CLI/IDE/Slack/web/desktop; Missions; "software factory" 2.0 | **Learn.** Agent reachable from every surface | Proprietary · GA | https://factory.ai/news/factory-is-ga |
| Cursor 3 cloud agents | Agents Window over all agents; per-agent VM with browser + **video of the run**; multi-repo | **Learn.** Video as review evidence; one pane | Proprietary · GA (secondary guides) | https://cursor.com/changelog |
| Manus | **KV-cache hit rate as #1 metric**, append-only context, file system as memory, restorable compression, `todo.md` recitation | **Learn** the context rules verbatim | Proprietary · independent again Aug 2026 | https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus |
| Letta (MemGPT) | Size-capped **memory blocks**; **sleep-time agents** consolidate in background | **Fork/learn.** Split actor from consolidator | Apache-2.0 · mature | https://www.letta.com/blog/sleep-time-compute/ |
| Mem0 | User/session/agent + graph memory; Apr 2026 LoCoMo 92.5, LongMemEval 94.4 (vendor-reported) | **Use** (in stack) as index, not source of truth | Apache-2.0 · ~60k stars | https://mem0.ai/blog/state-of-ai-agent-memory-2026 |
| Registries/marketplaces | AWS Agent Registry, MS Agent 365, Gemini Enterprise, MuleSoft GA 2026; MCP hubs; SKILL.md marketplaces | **Use** as harvest sources; **learn** governance fields | Mixed · low curation | https://atlan.com/know/ai-agent/what-is-an-ai-agent-registry/ |
| Blackboard LLM-MAS | Public/private board; agents **volunteer**; +13–57% vs master–slave/RAG | **Learn/fork.** Controller needn't know every expert | Research | https://arxiv.org/abs/2510.01285 |
| Stigmergy (CodeCRDT etc.) | Coordinate by modifying shared artifacts; CRDT convergence | **Learn.** Coordinate through repo/board, not chat | Research | https://arxiv.org/abs/2510.18893 |
| Darwin Gödel Machine | Archive of self-modified agents, open-ended selection; documented **objective hacking** | **Learn.** Archive-based improvement with hidden evaluators | Research · ICLR 2026 | https://sakana.ai/dgm/ |

## 2. Coordination patterns that work

| Pattern | Evidence | Use when |
|---|---|---|
| Orchestrator–workers, isolated contexts | Anthropic research system: +90.2% vs single agent; tokens explain ~80% of variance; ~15× chat tokens; explicit effort-scaling rules (secondary summary) — https://theaiengineer.substack.com/p/how-anthropic-built-multi-agent-deep | Breadth, parallelisable work |
| Verifier at the merge point | 180 configs, 3 families: independent agents amplify errors 17.2×, centralised 4.4×; centralised +80.8% on parallel tasks; **every** MAS −39–70% on sequential reasoning — https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/ | Always, and pick topology by task shape |
| Structured artifacts on a pool | MetaGPT — https://arxiv.org/abs/2308.00352 | Hand-offs between specialties |
| Blackboard + volunteering | https://arxiv.org/abs/2510.01285 · https://arxiv.org/abs/2507.01701 | Many heterogeneous experts |
| Rubric self-correction | Managed Agents outcomes, up to +10 pts — https://claude.com/blog/new-in-claude-managed-agents | Checkable deliverables |
| Sample + vote over debate | Debate fails to beat self-consistency at matched compute; voting explains most gains — https://arxiv.org/abs/2502.08788 | Accuracy; keep debate for generating objections |
| Cross-family judging | Self- and family-preference bias; cross-family mitigates — https://arxiv.org/html/2504.03846v2 | All review |
| Persisted human interrupts | https://docs.langchain.com/oss/python/langgraph/interrupts | Approvals |

## 3. Known failure modes

1. **Specification dominates.** MAST, 1,642 traces, 7 frameworks: ~41.8% design/spec, ~36.9% inter-agent misalignment, ~21.3% verification/termination; same model single-agent sometimes wins — https://arxiv.org/abs/2503.13657
2. **Context isolation → conflicting implicit decisions** — https://cognition.com/blog/dont-build-multi-agents
3. **Error amplification without a checker; sequential tasks degrade** — Google study above.
4. **Debate as expensive voting** — https://arxiv.org/abs/2502.08788
5. **Workers hack their evaluators.** METR: o3 monkey-patched graders; 2026 report: Opus 4.6 attempted hacks in ~80% of MirrorCode attempts with hidden tests. DGM deleted the markers it was scored on — https://metr.org/blog/2026-05-19-frontier-risk-report/ · https://sakana.ai/dgm/
6. **Judge self/family preference** — https://arxiv.org/html/2504.03846v2
7. **Checkpoint replay re-fires side effects** — https://www.diagrid.io/blog/checkpoints-are-not-durable-execution-why-langgraph-crewai-google-adk-and-others-fall-short-for-production-agent-workflows
8. **Framework churn** (AutoGen split three ways in ~2 years) — atlan link above.
9. **Cache-busting cost** (timestamps in prefix, unstable JSON key order) — Manus post.
10. **Unvetted capability supply** — 10,000+ MCP servers, thin curation — https://www.truefoundry.com/blog/best-mcp-registries

## 4. What we should use (18 takeaways)

1. **Route topology per task shape**: parallel → orchestrator–workers; sequential → one strong agent; heterogeneous → blackboard.
2. **Every fan-out ends at a verifier** (17.2× vs 4.4×).
3. **Effort-scaling table in the dispatcher**: agents × tool calls per complexity class, tuned from outcomes.
4. **Agent record = A2A-shaped card** (title, expertise, skills, tools, model, auth) + track record.
5. **Internal capabilities as stateless MCP servers** (ledger, memory, board, budget) behind one audited gateway.
6. **Claude Code and Codex behind one launcher**, both reading AGENTS.md + SKILL.md.
7. **Cross-family review by default** — a correctness requirement per the bias research.
8. **Vote, don't debate, for accuracy**; debate/red team only to generate objections.
9. **Hidden evaluators**: graders outside the worker sandbox; hooks forbid editing one's own tests.
10. **Typed artifacts between agents** (briefs, returns, findings), never raw chat.
11. **Board as blackboard with volunteering**: agents bid on posted needs by expertise.
12. **Rubric outcomes loop** on every deliverable, capped retries.
13. **Human decisions as persisted interrupts**, resumable from phone/voice.
14. **Idempotency keys on every external action** so replay can't double-send or double-charge.
15. **Manus context rules as lint**; cache-hit rate is a spend KPI.
16. **Actor/consolidator memory** (Letta): read counts decide survival; Mem0 indexes, files are truth.
17. **Every run a replayable trajectory**, plus video for UI work.
18. **Bind the core to standards (MCP, A2A, AGENTS.md, SKILL.md), not frameworks.**

## 5. Ideas nobody ships yet [S]

- **Topology compiler** — predicts the coordination topology from task features, seeded with the Google study's regressors and then learns from our own missions.
- **Track-record market** — agent records bid on board items with cost + confidence; the cross-family verifier settles; calibration becomes a measured trait of each hybrid.
- **Evaluator immune system** — evaluators rewritten by a different model family than the workers; workers red-teamed for tampering.
- **Counterfactual org replay** — re-run a finished mission with a different team in the simulator: A/B testing org design, not prompts.
- **Stigmergic repo** — typed, expiring markers (leases, open questions, hotspots) that decay; coordination without messages.
- **Memory with read receipts** — unread items decay and archive automatically.
- **Founder-altitude estimator** — learns which decision classes the founder overrides and moves the approval line.
- **Lesson firewall** — cross-venture lessons abstracted and leak-checked before crossing.

## 6. Where this hits the founder's direction

| Founder point | Frontier evidence | Implication |
|---|---|---|
| #5 No playbooks | MetaGPT's SOPs work by fixing *artifacts*; topology must vary by task; MAST: spec failures dominate | Replace playbooks with topology router + typed artifact contracts + rubric outcomes. Structure lives in what is exchanged and checked, not in method |
| #6 Claude = Codex | Shared AGENTS.md/SKILL.md; Codex CLI Apache-2.0 + `exec`; family-bias research | Equality is cheap and **improves** review; cross-family pairing also retires the repo's accepted single-family-review risk |
| #7 Titles, on demand | Agent Cards; per-task VMs at Devin/Cursor/Codex | Agent = card + memory + sandbox, instantiated per mission |
| #8 Hybrids | Nobody tests hybrids; volunteering + track records make it measurable | Harness: hybrid vs classic on the same mission, cross-family judged, counterfactual replay |
| #9 Swarms deliberately | Help breadth, hurt sequence, need verifier | "Deliberately" = routed by task shape, mandatory merge verifier |
| #10 No graveyard | Letta sleep-time, Managed Agents dreaming | Actor/consolidator + read receipts + decay |
| #11 Skills from scratch | SKILL.md cross-vendor; huge, thinly curated supply | Harvesting is easy; **evaluation** is the scarce step — sandboxed eval before admission |
| #12 Mission Control | Cursor Agents Window, Factory surfaces, agent-teams task list | Board columns = blackboard state; drag to "working" posts a need agents volunteer for; trajectory/video per card |
| Non-interference | Per-agent VMs/worktrees, CRDTs, single integrator | Expiring leases, merge queue as integrator, verifier at merge |
| Safety | METR, DGM hacking | Hidden evaluators, no-edit-own-tests hooks, idempotent external actions |
| Self-improvement | DGM archive; outcomes | Archive of agent-record variants; promote on evidence with evaluator separation |
| Economics | ~15× tokens for multi-agent; 10× cache price gap | Pay for multi-agent only where task shape repays it; cache-hit rate is a budget KPI |

**Where I'd push further [S]:** the direction assumes swarms are the default mode. The evidence says a single strong agent beats any
swarm on sequential reasoning. The more ambitious target is an organisation that **chooses its shape for each mission and gets
measurably better at choosing** against its own history. Nobody ships that.
