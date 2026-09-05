# Lane · roster · 2026-09-05

## Questions answered

Fifteen sources fetched, six local files read. Every shipped **running** roster I could verify is **5–6 agents**; every roster of **150+** is a *catalogue* you pick from, not a team that runs together. That distinction is the single most load-bearing fact for the founder's "ten to fifteen". No system I fetched publishes a measured optimum for roster size. Devin/Cognition, Factory droids, Google ADK, LangGraph and Sakana are gaps — named below, not glossed.

## Rosters found

**MetaGPT** — https://raw.githubusercontent.com/FoundationAgents/MetaGPT/main/README.md · 2026-09-05 · confidence M (README names roles in prose, not a table)

| Role | Fields defined | Model | Tools | Source line |
|---|---|---|---|---|
| product manager · architect · project manager · engineer | not exposed in README | none stated | none stated | "product managers / architects / project managers / engineers" |

SOP statement, verbatim: **"Code = SOP(Team) is the core philosophy."** Entry point is `generate_repo("Create a 2048 game")`. Licence: **MIT**, from the README badge `License: MIT` — **the LICENSE file itself was not fetched (UNVERIFIED)**.

**ChatDev** — https://raw.githubusercontent.com/OpenBMB/ChatDev/main/README.md · 2026-09-05 · confidence M

| Role | Fields defined | Model | Tools | Source line |
|---|---|---|---|---|
| CEO · CTO · Programmer · Reviewer · Tester · Designer | `RoleConfig`, `PhaseConfig`, `ChatChainConfig.json` | none stated | none stated | "CEO, CTO, Programmer, Reviewer, Tester, and Designer" |

Phases: **"designing, coding, testing, and documenting"**, waterfall. Six roles. Licence **UNVERIFIED** — the README names none and I did not fetch the LICENSE file.

**Magentic-One (Microsoft)** — https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/ · 2026-09-05 · confidence H

| Role | Verbatim definition | Model | Tools |
|---|---|---|---|
| Orchestrator | "The lead agent responsible for task decomposition, planning, directing other agents in executing subtasks, tracking overall progress, and taking corrective actions as needed" | LLM | dispatch |
| WebSurfer | "proficient in commanding and managing the state of a Chromium-based web browser" | LLM | browser |
| FileSurfer | "commands a markdown-based file preview application to read local files" | LLM | file read |
| Coder | "specialized in writing code, analyzing information collected from the other agents, and creating new artifacts" | LLM | code |
| ComputerTerminal | "Provides access to a console shell for executing programs and installing new libraries" | none | shell |

**Five agents, and the split is by TOOL, not by domain.** There is no marketing agent, no finance agent. Built on AutoGen, released open-source. Licence **UNVERIFIED**.

**TheAgentCompany benchmark** — https://raw.githubusercontent.com/TheAgentCompany/TheAgentCompany/main/README.md · 2026-09-05 · confidence H for roles, licence

Job functions simulated, verbatim: **"Software Engineer, Product Manager, Data Scientist, Human Resource, Financial Staff, Administrator."** Six. **175 task images.** Licence: **"Distributed under the MIT License."** Best model and completion rate: **NOT OBTAINED** — the README defers to a leaderboard and the site fetch returned only a header.

**wshobson/agents** — https://raw.githubusercontent.com/wshobson/agents/main/README.md · 2026-09-05 · confidence M for counts, H for licence

Claimed inventory, verbatim: **"202 agents, 183 skills, 105 commands"**. Categories named: **"architecture, languages, infra, security, data, ML, docs, business, SEO"**, plus 16 orchestrators. Per-category counts are **not published**. No example frontmatter block appears in the README. **Five model tiers, verbatim:**

| Tier | Verbatim |
|---|---|
| 0 | "Fable 5 — Longest-horizon autonomous work" (premium, opt-in) |
| 1 | "Opus — Architecture, security, code review, production-critical" |
| 2 | "inherit — User-chosen — backend, frontend, AI/ML, specialized" |
| 3 | "Sonnet — Docs, testing, debugging, API references" |
| 4 | "Haiku — Fast operational tasks, SEO, deployment, content" |

Agent-count-per-tier is **not quantified**. Licence, from the LICENSE file: **"MIT License / Copyright (c) 2024 Seth Hobson"**.

**VoltAgent/awesome-claude-code-subagents** — https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/main/README.md · 2026-09-05 · confidence H

Claim, verbatim: **"158+ Claude Code subagents across 10 categories."** Category counts as listed:

| Category | n | Category | n |
|---|---|---|---|
| 01 Core Development | 11 | 06 Developer Experience | 15 |
| 02 Language Specialists | 31 | 07 Specialized Domains | 16 |
| 03 Infrastructure | 16 | 08 Business & Product | 17 |
| 04 Quality & Security | 17 | 09 Meta & Orchestration | 13 |
| 05 Data & AI | 13 | 10 Research & Analysis | 11 |

**The rows sum to 160; the fetch reported "Total: 150 listed agents"; the headline says "158+". Three numbers, none reconciled in the README.** Treat any of them as approximate. Per-agent fields: `name`, `description`, `tools` (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch), `model` (opus, sonnet, haiku, or inherit). Licence from the LICENSE file: **"MIT License / Copyright (c) 2025 VoltAgent"**. The README adds: **"All subagents are provided 'as is' without warranty. We do not audit or guarantee the security or correctness of any subagent."**

**CrewAI** — https://docs.crewai.com/en/concepts/agents · 2026-09-05 · confidence H. Not a roster; a per-agent schema of **28 attributes**. The three the founder's model needs, verbatim: `role` — "Defines the agent's function and expertise within the crew"; `goal` — "The individual objective that guides the agent's decision-making"; `backstory` — "Provides context and personality to the agent, enriching interactions". Also `llm` (per-agent model), `tools`, `allow_delegation` (default **False**), `allow_code_execution` (default False), `code_execution_mode` ("safe" via Docker or "unsafe"), `max_iter` (20), `max_rpm`, `max_execution_time`, `reasoning`, `knowledge_sources`, `respect_context_window` (True). Example roles named in docs: Research Analyst, Senior Python Developer, Data Analyst, Customer Service Representative, Market Analyst, Strategic Planner, Visual Content Analyst. **No published multi-agent company template was found.** Licence **UNVERIFIED**.

**OpenAI Agents SDK** — https://openai.github.io/openai-agents-python/handoffs/ · 2026-09-05 · confidence H. Verbatim: **"Handoffs allow an agent to delegate tasks to another agent."** `handoff()` fields: `agent`, `tool_name_override` (default tool name `transfer_to_<agent_name>`), `tool_description_override`, `on_handoff`, `input_type`, `input_filter`. Published example roster is three: `triage_agent` with handoffs to `billing_agent` and `refund_agent`. **No multi-agent company template found.** Licence **UNVERIFIED**.

**Paperclip — IT EXISTS, and there are TWO of them.** Web search 2026-09-05, confidence **M (search snippets only — neither repository was fetched, so every field below is second-hand)**. `paperclipai/paperclip` — "The open-source app everyone uses to manage agents at work", described as a Node.js server plus React UI orchestrating a team of agents, with **org charts, budgets, governance, goal alignment**, and company-scoped multi-tenant isolation. `agencyenterprise/paperclip-ai` — "Open-source orchestration for zero-human companies". **Roster, per-agent fields and licence: UNVERIFIED for both.** The framing "you bring your own agents" suggests a control plane with no shipped roster, which would make it a surfaces input, not a roster input — but I did not verify that.

## Per-agent definition formats

| System | File format | Fields | Licence |
|---|---|---|---|
| **Claude Code** (the runtime we ship on) | Markdown + YAML frontmatter | **Required (2): `name`, `description`.** Optional (15): `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`, `experimental` | n/a (docs) |
| wshobson/agents | Markdown + frontmatter (no example in README) | not published in README | **MIT, (c) 2024 Seth Hobson** — LICENSE file read |
| VoltAgent | Markdown + frontmatter | name, description, tools, model | **MIT, (c) 2025 VoltAgent** — LICENSE file read |
| CrewAI | Python / YAML | 28 attributes incl. role, goal, backstory, llm, tools | UNVERIFIED |
| MetaGPT | Python `Role` classes | not exposed in README | MIT (badge only) |
| ChatDev | JSON: `ChatChainConfig.json`, `RoleConfig`, `PhaseConfig` | role, phase | UNVERIFIED |
| OpenAI Agents SDK | Python `Agent(...)` + `handoff(...)` | name, handoffs, + 6 handoff fields | UNVERIFIED |
| Magentic-One | Python agent classes | name, tool binding | UNVERIFIED |

Source: https://code.claude.com/docs/en/sub-agents · 2026-09-05 · confidence H. Two verbatim lines that bear on the founder's roster. On tools: **"Inherits every tool available to subagents if omitted."** On model: **"`sonnet`, `opus`, `haiku`, `fable`, a full model ID such as `claude-opus-5`, or `inherit`"** — so per-agent model assignment, including Fable, is a first-class field. Named examples in the docs: `code-improver`, `code-reviewer`, `safe-researcher`, `no-writes`, `local-only`, `db-reader`, `api-developer`, `browser-tester`, `repo-auditor`, `coordinator`, plus built-ins `Explore`, `Plan`, `General-purpose`.

## Measured outcomes on specialist vs generalist

1. **Anthropic, +90.2%.** Verbatim: *"Multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by 90.2% on our internal research eval."* https://www.anthropic.com/engineering/multi-agent-research-system · 2026-09-05 · H.
2. **The cost multiple.** Verbatim: *"Agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats."* Same source · H.
3. **The roster size that actually runs.** The system spawns **"3-5 subagents in parallel"** for standard research tasks. Same source · M (phrasing is descriptive, not a measured optimum).
4. **Coding is excluded by the same post.** Verbatim: *"Most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time"* — such domains *"are not a good fit for multi-agent systems today."* Same source · H.
5. **Cognition's two principles**, verbatim: *"Share context, and share full agent traces, not just individual messages"* and *"Actions carry implicit decisions, and conflicting decisions carry bad results."* https://cognition.com/blog/dont-build-multi-agents · 2026-09-05 · H.
6. **Cognition's failure case**, verbatim: *"The actions subagent 1 took and the actions subagent 2 took were based on conflicting assumptions not prescribed upfront."* One subagent built a Super Mario Bros-style background while another built an incompatible bird sprite; the joining agent got *"the undesirable task of combining these two miscommunications."* Same source · H.
7. **Cognition's recommendation**: start with *"a single-threaded linear agent"* where *"the context is continuous."* Same source · H.
8. **Magentic-One's five agents** reach *"statistically comparable performance to previous SOTA methods on both GAIA and AssistantBench and competitive performance on WebArena"* — comparable, **not better**. Microsoft Research · 2026-09-05 · H.
9. **SWE-bench generalist-vs-specialist: NOT MEASURED BY ME.** FINAL-PLAN §7.1 states *"OpenHands reaches 72% on SWE-Bench Verified with one generalist architecture across providers."* That is a local document's claim; I did not fetch a source for it and it is **UNVERIFIED** in this lane.

## Coverage of the founder's §23–§30 by any shipped roster

Category-level only for wshobson and VoltAgent — I have their category names and counts, **not their individual role names**, so a department marked present may be present as one agent or as fifteen.

| § | Department | Appears in | Confidence |
|---|---|---|---|
| 23 | design & product | VoltAgent "Business & Product" (17); ChatDev **Designer** and CPO; TheAgentCompany **Product Manager**; CrewAI "Visual Content Analyst"; MetaGPT **product manager** | M |
| 24 | engineering | Every roster. MetaGPT engineer/architect; ChatDev Programmer/Reviewer/Tester; Magentic-One **Coder**+**ComputerTerminal**; VoltAgent categories 01+02+03+04 (75); wshobson architecture/languages/infra/security | H |
| 25 | data & analytics | VoltAgent "Data & AI" (13); wshobson data/ML; TheAgentCompany **Data Scientist** | H |
| 26 | marketing & content | wshobson "SEO" + "business" + Tier 4 "SEO, deployment, content"; VoltAgent "Business & Product" | M |
| 27 | **sales & growth** | **NONE of the rosters I fetched names a sales, lead-scraping, lead-scoring, CRM or churn agent** | M — absence over the fetched set only |
| 28 | customer service | Only as framework *examples*, not shipped rosters: CrewAI "Customer Service Representative"; OpenAI SDK triage/billing/refund | H |
| 29 | finance & legal | TheAgentCompany **Financial Staff**. **No legal, contract or compliance agent in any fetched roster** | M |
| 30 | operations & HR | TheAgentCompany **Human Resource** and **Administrator** | H |

**In no fetched roster:** sales and growth as a function (§27), legal and contracts (§29), branding and visual identity (§23), video and asset generation (§26), influencer outreach, cap-table tracking. Their absence from research rosters and code-agent catalogues is weak evidence — those systems target software and research, not a company.

## What this changes against FINAL-PLAN §1 rows 6/8 and §7

Facts, no recommendation.

1. **Row 8 ("Labels, not names") is contradicted by every shipped system I fetched.** MetaGPT, ChatDev, Magentic-One, CrewAI, the OpenAI SDK, wshobson and VoltAgent all ship **named, persistent roles**. Zero of the seven ship an unnamed-shape-plus-loadout model. CrewAI goes furthest in the opposite direction: `backstory` exists explicitly to give an agent "context and personality".
2. **Row 6's "three shapes" is closest to Magentic-One's five, but the axis differs.** Magentic-One splits by **grant** (browser, file-read, code, shell) under one Orchestrator, not by domain and not by maker/scout/checker. §7.1's rule "domain is a loadout" is consistent with all seven rosters at the *domain* level; the tool-axis split is a fourth cut none of §7 names.
3. **§7.1's premise that specialists differ only in memory and a check is contradicted on one field: the model.** wshobson assigns five model tiers by role, and VoltAgent carries a per-agent `model`. The Claude Code format makes `model`, `effort`, `mcpServers`, `skills`, `memory` and `isolation` per-agent frontmatter. A loadout is therefore expressible **as a file per role** in this runtime, which removes the technical part of §7.2's objection to "a file per role" and leaves only the drift argument.
4. **§7.2's "no registry of personalities" has no shipped precedent** among the systems fetched. The nearest is Anthropic's research system, which spawns 3–5 subagents that are unnamed and task-scoped — and whose own post says coding is *"not a good fit"* for that pattern.
5. **The 10–15 target sits in an unoccupied band.** Running rosters are 5–6 (Magentic-One 5, ChatDev 6, MetaGPT 4–5, TheAgentCompany's 6 job functions, Anthropic's 3–5 concurrent). Catalogues are 150–202. Nobody I fetched publishes a measured roster size between them, in either direction.
6. **Cognition and Anthropic do not conflict, and both bear on the split.** Anthropic's +90.2% is on **research** with independent parallel subtasks; Cognition's failure is on **one artifact** split across parallel builders. That is the maker/scout boundary in §7.1, and it is the one part of §7 that the world's evidence directly supports.
