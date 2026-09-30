# Panel 3 — Open-source scout (sonnet, sourcer engine)

## 1. Keep from S1.1
Specific S1.1 section refs could not be resolved from the explorer data in the time available (`components.json` returned one compressed line; see Gaps). At the level visible from the brief: keep the **7-engine harness + claim ledger + QA gate** as the control plane (non-negotiable #6). Nothing in the landscape below replaces it; these tools slot *under* it as capabilities, not around it.

## 2. Cut or defer
- **Defer building any custom multi-agent orchestrator.** LangGraph, CrewAI, AG2, smolagents and OpenHands's agent loop already solve graph/role/conversation orchestration; a bespoke one is BUILD-without-a-reason.
- **Defer a bespoke vector DB / RAG stack.** Graphiti/Zep and Mem0 already combine vector + graph + temporal retrieval.
- **Cut PostHog self-host from v1.** PostHog's own docs call self-hosted deployments "officially unsupported"; ClickHouse-backed and resource-heavy — wrong fit for a single Mac. Trigger: first paying customer needing real product analytics → hosted PostHog or a lighter tool (Plausible for the marketing site meanwhile).
- **Defer Temporal/DBOS-grade durable workflow.** Inngest's dev server or retry-wrapped functions are enough pre-employee. Trigger: first workflow that must survive a multi-day human-approval gate or must never silently drop a step (e.g. billing).

## 3. Add
- **A licence-compatibility pass as a standing capability.** Several best-fit tools carry AGPL-3.0, SSPL or ELv2 terms (Twenty CRM, Inngest server, Phoenix) — fine for personal/internal use, constraining for redistribution or hosted resale.
- **A recurring "capability intake" playbook** that re-checks whether a newer, better-maintained OSS project has overtaken a chosen one (this scout's job, on a cadence).
- **Local-first as a first-class filter.** Temporal server, full PostHog and Langfuse's ClickHouse backend assume hosted or multi-container deployment a one-person Mac setup will resist.

## 4. ADOPT / ADAPT / LEARN table by area
| Area | Project | Licence | Activity / maturity | 1 Mac, no paid API? | Fit |
|---|---|---|---|---|---|
| Orchestration | **LangGraph** | MIT (verified) | ~126–147k★, active, LangChain Inc | Yes, library | ADOPT for stateful multi-step graphs; most mature |
| Orchestration | **CrewAI** | MIT (reported, not re-verified) | ~52.8k★, 5.2M mo. downloads | Yes | ADOPT/LEARN for role framing |
| Orchestration | **AG2** (AutoGen fork) | MIT (reported) | Pre-1.0, APIs moving; AutoGen in maintenance | Yes | LEARN only (GroupChat pattern) |
| Orchestration | **smolagents** (HF) | Apache-2.0 | 27k★+, v1.26 | Yes | ADOPT for lightweight code-writing sub-agents |
| Multi-agent coding | **OpenHands** | MIT (verified) | 77–88k★, v1.6.0 Mar 2026, Series A | Core yes; enterprise tier paid | ADOPT core coding loop |
| Memory | **Mem0** | Apache-2.0 (verified) | ~56–60k★, v2.0 Jun 2026 | Yes, local OpenMemory MCP | ADOPT as primary memory layer (matches CLAUDE.md Mem0-primary) |
| Memory | **Letta** (ex-MemGPT) | Apache-2.0 (verified) | 23k★+, active | Local server process | ADAPT/LEARN — self-editing memory is the strongest self-improvement design idea |
| Knowledge graph | **Graphiti** (getzep) | Apache-2.0 (verified) | Active | Yes; needs Neo4j | ADOPT for temporal company knowledge (facts with validity windows) |
| Durable workflows | **Temporal** | MIT | Mature | Heavier than needed | LEARN now; ADOPT at first irreversible billing/legal workflow |
| Durable workflows | **Inngest** | Server SSPL, source-available (moderate confidence) | Active; light dev server | Yes | ADOPT for light retries/steps; re-check licence before resale |
| Durable workflows | **DBOS** | Apache-2.0 | Active, Postgres-native | Yes with Postgres (Supabase) | ADOPT candidate — closest to existing stack |
| Durable workflows | **Restate** | Server BSL; SDKs MIT/Apache | Active | Single binary | LEARN (actor model) |
| Evals/observability | **Langfuse** | Core MIT (verified); EE separate | Active; part of ClickHouse since Jan 2026 | Docker Compose feasible | ADOPT once volume justifies |
| Evals/observability | **promptfoo** | MIT | 10.8k★; acquired by OpenAI Mar 2026, stays OSS | Yes, CLI | ADOPT for prompt/agent regression tests |
| Evals/observability | **Arize Phoenix** | Elastic 2.0 (not OSI) | 10k★+ | Yes | LEARN/ADAPT with care |
| Skills | **anthropics/skills** | Official | Active | N/A | ADOPT as reference format |
| Skills | **VoltAgent/awesome-agent-skills** | Mixed per skill | 1000+ skills | N/A | LEARN — mine, rewrite before adopting |
| MCP servers | **wong2/awesome-mcp-servers**, **Glama registry** | Per server | Very active | Per server | ADOPT the discovery habit; vet each server |
| Browser | **browser-use** | MIT (reported) | Active | Yes, local Playwright | ADOPT for autonomous browser agents |
| Browser | **Stagehand** (Browserbase) | MIT (reported) | Active | Yes locally | ADOPT structured extract/act on Playwright |
| Self-improvement | **DSPy** | Apache-2.0 (reported) | Active, mainstream | Yes | ADOPT for prompt/pipeline optimisation against a metric |
| Self-improvement | **TextGrad** | Open source | Static since mid-2025 | Yes | LEARN only |
| Email | **Listmonk** | Open source, Go binary | Active | Yes | ADOPT for newsletter/email |
| CRM | **Twenty CRM** | Reported AGPL-3.0 (unverified — resolver failed) | Active | Yes | ADAPT after confirming licence |
| Web analytics | **Plausible** | AGPL (reported) | Active | Yes | ADOPT for marketing sites |
| Billing | **Lago** | UNKNOWN | — | — | Gap — do not assume terms |
| Agent task boards | **Agent-Kanban** projects | Unverified, young | Low maturity | Yes | LEARN the pattern only |

## 5. Top 3 risks
1. **Licence mismatch drift** (Inngest SSPL, Twenty AGPL-3.0, Phoenix ELv2) once anything is hosted for a third party.
2. **"Best OSS project" is a moving target** (AG2, Mastra, Restate pre-1.0 or being superseded) — ADOPT needs a scheduled re-check.
3. **Local-Mac feasibility was assessed from documentation, not measured.**

## 6. Founder questions
1. Is any v2 component ever offered to a third party (even a client project)? That makes AGPL/SSPL/ELv2 terms load-bearing.
2. Given DBOS's Postgres-native fit with Supabase, adopt durable workflow now rather than defer?

## Gaps
- S1.1 section refs unsourced (see §1).
- Lago licence UNKNOWN; Mastra licence UNKNOWN.
- Twenty CRM AGPL-3.0 unverified (ledger `RESOLVER_FAIL`).
- CrewAI, browser-use, Stagehand, DSPy licences from search summaries, not quote-verified.

## Claims registered to the ledger
`c-langgraph-license-mit`, `c-mem0-license-apache2`, `c-graphiti-license-apache2`, `c-openhands-license-mit`, `c-letta-license-apache2`, `c-inngest-server-license-sspl` (moderate confidence). Refused: the Twenty CRM AGPL-3.0 claim (RESOLVER_FAIL; never registered). All valid_until 2027-03-29.
