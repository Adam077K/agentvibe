# 10 — Inspiration map: everything studied, and where it landed

*Owner of this file (00-CANON §8): every system, organisation and research result the outward rounds (r0) and the
specialist seats (r2) studied — what it does well, what v3 takes, where the idea lands, its licence (software only)
and its source. Names the borrowing; does not re-argue the design — that is [02-ORGANISATION](02-ORGANISATION.md) and
the files §8 of [00-CANON](00-CANON.md) names.*

## How to read this file

- **Take**: **USE** — adopt close to as-is. **FORK** — lift the code/data shape and change it. **LEARN** — steal the
  idea, our own implementation, no dependency.
- **Lands** names the v3 file and mechanism per [00-CANON §8](00-CANON.md#8-file-map--who-owns-which-topic) and the
  decisions register (`DR-nn`). A dash (`—`) means studied and rejected, or filed only as a speculative addition.
- **Licence** applies to software; papers, government publications, essays and books carry none — the cell names the
  source kind instead.
- Every number is the source's own claim, not re-verified here. Confidence markers (**High/Medium/Low/Provisional**,
  or **[S]** for outward-seat speculation) carry over from the seat that made them.
- Five outward rounds (`r0-outward/R0-A`–`R0-E`) and `r2-seats/S05` are primary. §6 folds in case studies
  `S10-organisation-theory.md` sourced independently and systems-theory sources from `S11-wildcard-systems.md`. §1
  folds in commerce-protocol/infrastructure citations from `S12-engineering.md` and `S13-external-world-humans.md`.
  The other nine r2 seats cite no external system not already covered here (grepped 2026-09-30:
  `grep -ohE '\[[^]]+\]\(https?://[^)]+\)' r2-seats/*.md`).

## 1. Agent platforms, protocols and infrastructure

*Primary: [R0-A](r0-outward/R0-A-agent-platforms.md). Protocol/infrastructure rows extend it with citations from
`S12-engineering.md` and `S13-external-world-humans.md`.*

### 1.1 Platforms, frameworks and coordination research

| System | Does well | Take | Lands in v3 · Licence/Source |
|---|---|---|---|
| Claude Code + Agent SDK | Hooks (exit 2 blocks), skills (progressive disclosure), subagents, headless mode | **USE** | 09a (hooks = guarantee layer); 07 (skills = memory) · Proprietary — [docs](https://code.claude.com/docs/en/agent-sdk/overview) |
| Claude Code agent teams | Lead + teammates on a shared task list + mailbox; blocked tasks auto-unblock | **LEARN** | 04 (blackboard) · Proprietary, experimental — [docs](https://code.claude.com/docs/en/agent-teams) |
| Claude Managed Agents | Rubric self-check +10 pts; "dreaming" background consolidation | **LEARN** | 09b (feeds Verifier Foundry) · Proprietary beta — [blog](https://claude.com/blog/new-in-claude-managed-agents) |
| OpenAI Codex CLI / cloud | Approval modes; parallel cloud sandboxes, own git state, PR out; reads AGENTS.md + SKILL.md | **USE** | 04 (equal-worker casting) · CLI Apache-2.0 — [docs](https://developers.openai.com/codex/subagents) |
| OpenAI Agents SDK | Handoffs, typed output, guardrails as parallel tripwires | **LEARN** | 09a (deterministic checks alongside judgment — DR-14) · MIT — [docs](https://openai.github.io/openai-agents-python/tracing/) |
| Google ADK | Sequential/Parallel/Loop operators around stochastic agents; evalsets + LLM-judge built in | **LEARN** | 03 (deterministic move vocabulary) · Apache-2.0 — [docs](https://google.github.io/adk-docs/get-started/about/) |
| A2A v1.0 | Signed Agent Cards; 150+ orgs, joined AAIF Aug 2026 | **USE** the card shape | 04 (Identity record = A2A card) · Apache-2.0/LF — [blog](https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/) |
| MCP 2026-07-28 | Stateless core, Multi Round-Trip Requests, `Mcp-Method` routing | **USE** | 07 (Capability Registry, every grant) · Open spec/AAIF — [changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog) |
| Agentic AI Foundation | LF home of MCP, goose, AGENTS.md, A2A; five platinum members | **USE** | 07 (bind the registry to standards, not a framework) · LF, Dec 2025 — [press](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) |
| LangGraph | Checkpoint per super-step; `interrupt()` + `Command(resume=…)` | **LEARN** | 05 (DecisionPacket = a persisted resumable interrupt) · MIT — [docs](https://docs.langchain.com/oss/python/langgraph/interrupts) |
| AutoGen → MS Agent Framework / AG2 | Maintenance since Oct 2025; Framework 1.0 GA Apr 2026; AG2 fork active | **LEARN** | 09a (DR-08: bind to standards, not a framework) · MIT/Apache-2.0 — [atlan](https://atlan.com/know/ai-agent/what-is-autogen/) |
| CrewAI | Crews (roles) + Flows (`@start`/`@listen`/`@router`, state) | **LEARN** | 04 (who collaborates separate from what triggers what) · MIT — [futureagi](https://futureagi.com/blog/what-is-crewai-2026) |
| MetaGPT / MGX | Roles publish schema'd artifacts to a subscribable pool, not chat | **LEARN** | 04 (blackboard, typed contributions) · MIT — [paper](https://arxiv.org/abs/2308.00352) |
| ChatDev 2.0 / MacNet | DAG topologies to 1,000+ agents; a logistic scaling law on returns | **LEARN** | 04 (DR-25: mission shape from dependency/interference) · Apache-2.0 — [paper](https://arxiv.org/html/2406.07155) |
| OpenHands | Model-agnostic sandboxed coding agent; SDK + REST | **FORK/USE** sandbox reference | 09a (isolation ladder) · MIT — [docs](https://docs.openhands.dev/sdk) |
| mini-swe-agent | ~100 lines, bash only, >74% SWE-bench Verified | **LEARN**: a simple harness wins | 09a (trajectory = training data) · MIT — [gh](https://github.com/swe-agent/mini-swe-agent) |
| Devin / Cognition | "Don't Build Multi-Agents" (2025) → "Devin manages Devins" (2026): child VMs self-verify, one coordinator | **LEARN** | 04 (DR-22: integration queue = one integrator) · Proprietary — [blog](https://cognition.ai/blog/devin-can-now-manage-devins) |
| Factory Droids | Same agent reachable across CLI/IDE/Slack/web/desktop | **LEARN** | 08 (one agent, every surface) · Proprietary — [news](https://factory.ai/news/factory-is-ga) |
| Cursor 3 cloud agents | Agents Window; per-agent VM with a video of the run | **LEARN** | 08 (video as review evidence) · Proprietary — [changelog](https://cursor.com/changelog) |
| Manus | KV-cache hit rate as the #1 metric; append-only context; `todo.md` recitation | **LEARN** | 09a (Launch Pack) · Proprietary — [blog](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) |
| Letta (MemGPT) | Size-capped memory blocks; sleep-time agents consolidate in the background | **FORK/LEARN** | 06 (Sleep splits actor from consolidator) · Apache-2.0 — [blog](https://www.letta.com/blog/sleep-time-compute/) |
| Mem0 | User/session/agent + graph memory; vendor LoCoMo 92.5, LongMemEval 94.4 | **USE** as index, not source of truth | 06 (DR-39: Mem0 not primary — root CLAUDE.md stale) · Apache-2.0 — [blog](https://mem0.ai/blog/state-of-ai-agent-memory-2026) |
| Registries / marketplaces | AWS Agent Registry, MS Agent 365, Gemini Enterprise, MCP hubs | **USE** harvest sources, **LEARN** governance | 07 (Source Ledger) · Mixed — [atlan](https://atlan.com/know/ai-agent/what-is-an-ai-agent-registry/) |
| Blackboard LLM-MAS | Public/private board, agents volunteer; +13–57% vs master–slave/RAG | **LEARN/FORK** | 04 (blackboard + volunteering) · Research — [paper](https://arxiv.org/abs/2510.01285) |
| Stigmergy (CodeCRDT etc.) | Coordinate by modifying shared artifacts; CRDT convergence | **LEARN** | 04 (coordinate through repo/board, not chat) · Research — [paper](https://arxiv.org/abs/2510.18893) |
| Darwin Gödel Machine | Archive of self-modified agents, open-ended selection; documented objective hacking | **LEARN** | 09b (self-improvement loop; DR-06) — see §4 · ICLR 2026 — [site](https://sakana.ai/dgm/) |

### 1.2 Agentic-commerce protocols and distributed-systems infrastructure

*Cited in `S13-external-world-humans.md` and `S12-engineering.md`; not in R0's outward sweep.*

| System | Does well | Take | Lands in v3 · Licence/Source |
|---|---|---|---|
| Google AP2 | Signed Intent/Cart/Payment mandates for agentic buying; v0.2 → FIDO Alliance Apr 2026 | **USE** | 16 (agentic buying → one-way door) · Open protocol — [explainer](https://eco.com/support/en/articles/15192002-ap2-protocol-explained-google-s-agentic-commerce-standard-2026) |
| x402 (Coinbase, HTTP 402) | A payment header on the wire, seller-verified before the request proceeds | **USE** | 16 (Commerce lane: payment verified first) · Open spec — [docs](https://docs.cdp.coinbase.com/x402/core-concepts/http-402) |
| Stripe Shared Payment Tokens | Seller-, amount- and expiry-scoped, revocable tokens | **USE** | 16 (Effect Mandate spend caps at the token) · Proprietary — [docs](https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens) |
| Cloudflare Web Bot Auth / signed agents | Cryptographically signed agent traffic, distinct from a self-declared UA | **USE** | 16 (Front Desk's three lanes: signed/unsigned/hostile) · RFC 9421 — [blog](https://blog.cloudflare.com/signed-agents/) |
| Mercury agent cards | Human-issued spend cards with limits the agent cannot widen | **LEARN** | 16 (Custody issues every Effect Mandate) · Proprietary — [article](https://support.mercury.com/hc/en-us/articles/51299754284948-Agent-cards-Giving-AI-agents-a-card-of-their-own) |
| DocuSign embedded signing | API-driven contract execution inside another app's flow | **USE** | 16 (contracts as a typed effect) · Proprietary — [docs](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/embedding/embedded-signing/) |
| RentAHuman | Agent-to-human hiring marketplace (Feb 2026) | **LEARN** | 16 (Human Task Market: one supplier under our worker rules) · Proprietary — [built in](https://builtin.com/articles/what-is-rentahuman) |
| Kleppmann, fencing tokens | A monotonically increasing token the *resource*, not the coordinator, must verify | **USE** | 04/09a (DR-20: fences verified by storage) · pattern, no licence — [post](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) |
| Litestream | Continuous SQLite→object-storage streaming replication, no separate DB server | **FORK/USE** candidate | 09a (Kernel journal durability, DR-09) · OSS — [site](https://litestream.io) |
| Apple container | macOS-native, OCI-compatible per-process containers | **USE** candidate | 09a (isolation ladder, dedicated Mac host) · OSS — [gh](https://github.com/apple/container) |

### 1.3 Coordination patterns, failure modes and takeaways (R0-A §2–4)

| Pattern | Evidence | Use when |
|---|---|---|
| Orchestrator–workers, isolated contexts | +90.2% vs a single agent; tokens explain ~80% of variance ([summary](https://theaiengineer.substack.com/p/how-anthropic-built-multi-agent-deep)) | Breadth, parallelisable work |
| Verifier at the merge point | 180 configs/3 families: independent agents amplify errors 17.2×, centralised 4.4×; every architecture lost 39–70% on sequential reasoning ([Google](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)) | Always — pick topology by task shape |
| Sample-and-vote over debate | Debate does not beat self-consistency at matched compute ([paper](https://arxiv.org/abs/2502.08788)) | Accuracy; keep debate for objections only |
| Cross-family judging | Self/family-preference bias measurable ([paper](https://arxiv.org/html/2504.03846v2)); SP3: Claude +1.1, Codex +3.2 | All review — DR-11, DR-12 |

**What v3 takes (R0-A §4, condensed):** topology routed by task shape; every fan-out ends at a verifier; an
effort-scaling table in the dispatcher; agent record = A2A card + track record; capabilities as stateless MCP servers
behind one gateway; Claude/Codex behind one launcher; cross-family review by default; vote, not debate, for accuracy;
hidden evaluators outside the sandbox; typed artifacts not chat; a volunteering blackboard; a rubric-outcomes loop;
human decisions as persisted resumable interrupts; idempotency keys on every effect; Manus's context rules as lint
with cache-hit rate as a spend KPI; actor/consolidator memory; replayable trajectories (+ video for UI); bind the core
to standards (MCP, A2A, AGENTS.md, SKILL.md), never a framework.

**Failure modes to design against (R0-A §3):** spec/design failures dominate MAS traces (MAST, 1,642 traces: ~41.8%
design/spec, ~36.9% misalignment, ~21.3% verification/termination — [paper](https://arxiv.org/abs/2503.13657));
context isolation produces conflicting implicit decisions ([Cognition](https://cognition.com/blog/dont-build-multi-agents));
workers hack their evaluators (METR: Opus 4.6 attempted hacks in ~80% of MirrorCode attempts with hidden tests; DGM
deleted its own scoring markers — [METR](https://metr.org/blog/2026-05-19-frontier-risk-report/),
[DGM](https://sakana.ai/dgm/)); checkpoint replay re-fires side effects
([Diagrid](https://www.diagrid.io/blog/checkpoints-are-not-durable-execution-why-langgraph-crewai-google-adk-and-others-fall-short-for-production-agent-workflows));
capability supply is unvetted at scale — 10,000+ MCP servers, thin curation
([TrueFoundry](https://www.truefoundry.com/blog/best-mcp-registries)).

**Ideas nobody ships yet [S]** (speculative additions to the owning file): a topology compiler predicting
coordination shape from task features; a track-record market where agent records bid on board items (both 04); an
evaluator immune system rewritten by a different model family; counterfactual org replay of a finished mission under
a different team (both 09b); a stigmergic repo of typed, expiring markers instead of messages (04); memory with read
receipts that decay unread items (06); a founder-altitude estimator (05).

## 2. Memory and world-model systems

*Primary: [R0-C §3–4](r0-outward/R0-C-tooling-ecosystem.md). All records owned by 06-MEMORY per 00-CANON §8.*

| System | Does well | Take | Lands in v3 · Licence/Source |
|---|---|---|---|
| Anthropic memory stores (beta) | ≤8 stores/session, ≤100kB/memory; **immutable version per write**; "dreaming" writes a *new* store, never mutates | **LEARN** | 06 (Wrap Deposit versioning; Sleep = a reviewable diff, never in-place — DR-07) · Proprietary — [docs](https://platform.claude.com/docs/en/managed-agents/memory) |
| Anthropic memory tool | Client-side file directory, no forgetting model | **USE** | 06 (versioned files canonical for policy/Minds/Brain — DR-07/39) · Proprietary — R0-C §3 |
| Letta | Size-capped memory blocks; sleep-time agents consolidate while idle, ~5× less test-time compute | **FORK/LEARN** | 06 (Sleep splits actor from consolidator) · Apache-2.0 — [docs](https://docs.letta.com/guides/agents/architectures/sleeptime/) |
| Zep / Graphiti | Temporal KG, bi-temporal edges; invalidates rather than deletes | **USE** Graphiti on trigger | 06 (per-venture Brain: "price was $29 until 2026-08-01") · Apache-2.0 core; 94.7% LoCoMo vendor vs 75.1% 3rd-party — R0-C §3 |
| Mem0 | LLM extract ADD/UPDATE/DELETE; vendor ~93–94% LongMemEval, **independent OSS test 32.4%** | **USE** as index, never source of truth | 06 (DR-39 corrects root CLAUDE.md's "Mem0 primary") · Apache-2.0 — [dev.to](https://dev.to/everest_an/-i-benchmarked-ai-agent-memory-in-2026-and-the-numbers-tell-a-different-story-than-the-marketing-2ae4) |
| Cognee / LangMem | Cognee: graph+vector+relational, "memify" prunes stale nodes (vendor claims only). LangMem: semantic + **procedural** memory, rewrites prompts from trajectories | **LEARN** | 07 (LangMem's procedural rewrite = Foundry drafting skills from settled-mission trajectories) · licences unstated — R0-C §3 |

**Forgetting research — a design constraint, not a shippable system:** **ForgetEval** (13 configs, 385 cases) found
deterministic stores score 0–5% on canonicalization; an LLM *at write time* fixes that but scores 0% on intent-aware
deletion; an LLM *at mutation time* scores 78–85%, 91.7–93.2% overall at $0.17/run — **LEARN**: 06's forgetting verbs
(decay·invalidate·redact·forget·quarantine, DR-41) hook at mutation time, not only write time
([paper](https://arxiv.org/abs/2606.15903)). **SleepGate**: conflict-gated forgetting keeps 97–99.5% retrieval under
interference where every baseline stays below 18% — Sleep's supersession check is load-bearing
([paper](https://arxiv.org/abs/2603.14517)). Governed forgetting as a discipline is **SSGM**'s argument
([paper](https://arxiv.org/pdf/2603.11768)). **Nobody measures whether a memory was read and changed an outcome** —
the Use Ledger and Orphan lint (06) close this gap, ahead of every vendor here.

## 3. Skills, tools and MCP: the capability supply chain

*Primary: [S05](r2-seats/S05-skills-tools-mcp.md), verified against the GitHub contents API 2026-09-30, and it
corrected R0-C's read of the Snyk figures. All rows land in 07-SKILLS-TOOLS-MCP unless noted.*

### 3.1 Skill libraries — verified counts, harvested at Tier A

| Library | Verified count | Does well | Take | Licence | Source |
|---|---:|---|---|---|---|
| anthropics/skills | **19** | First-party reference: skill-creator, mcp-builder, frontend-design, docx/pdf/pptx/xlsx | **USE** | Apache-2.0; office formats source-available only | [gh](https://github.com/anthropics/skills) |
| obra/superpowers | **15** | Coherent SDLC workflow: brainstorm→plan→TDD→subagents→verify; official marketplace | **USE** | OSS | [gh](https://github.com/obra/superpowers) |
| mattpocock/skills | **31 active** | grill-me, tdd, triage, prototype, handoff — top-installed author on skills.sh | **USE** | Per-skill | [gh](https://github.com/mattpocock/skills) |
| trailofbits/skills | **44 plugins** | Strongest security library: differential-review, semgrep-rule-creator | **USE**, feeds SCAN + reviewer lenses | Per-plugin | [gh](https://github.com/trailofbits/skills) |
| openai/plugins | **62 enumerated** | Codex plugins bundling skills+MCP: stripe, supabase, codex-security, **plugin-eval** | **USE**; `plugin-eval` informs SCORE | Per-plugin | [gh](https://github.com/openai/plugins) |
| huggingface/skills | **25 enumerated** | hf-cli, datasets, llm-trainer, community-evals | **USE** | Per-skill | [gh](https://github.com/huggingface/skills) |
| cloudflare/skills | **14** | agents-sdk, durable-objects, wrangler, web-perf | **USE** | Per-skill | [gh](https://github.com/cloudflare/skills) |
| vercel-labs/agent-skills | **9** | react-best-practices, deploy-to-vercel, web-design-guidelines | **USE** | Per-skill | [gh](https://github.com/vercel-labs/agent-skills) |
| supabase/agent-skills | **2** | supabase, supabase-postgres-best-practices | **USE** | Per-skill | [gh](https://github.com/supabase/agent-skills) |
| VoltAgent/awesome-agent-skills | "1,497+" claimed, 35.1k★ | An index of hand-picked upstream pointers | **USE** discovery feed only (B) | Mixed | [gh](https://github.com/VoltAgent/awesome-agent-skills) |
| skills-hub.ai | "13,307 indexed" claimed | Tracks source origin; "vetting is decentralised" by own admission | Discovery feed only (B) | Mixed | R0-C §1 |
| ComposioHQ/awesome-claude-skills | "1000+" claimed, 75.9k★ | 78 SaaS automations through Composio | Discovery feed, long tail (B) | Apache-2.0, per-skill | [gh](https://github.com/ComposioHQ/awesome-claude-skills) |
| sickn33/antigravity-awesome-skills | "2,602+" claimed, 47.1k★ | Mass collection; upstream of the founder's old 426-skill kit | Mine only, never trust (C) | MIT core; per-skill MIT/Apache/**AGPL**/CC-BY | [gh](https://github.com/sickn33/antigravity-awesome-skills) |
| MCP official registry | ~2,000 servers claimed | `registry.modelcontextprotocol.io/v0/servers`, JSON name/version/status | **USE**, mirrored into our catalogue | Open API | [registry](https://registry.modelcontextprotocol.io/v0/servers) |

**Correction S05 made to R0-C, verified against the source.** Snyk's ToxicSkills scanned **3,984 skills from ClawHub**
(not ClawHub + skills.sh). **13.4% (534) had a critical issue**, **36.82% (1,467) had a flaw of any severity**, and
prompt injection appeared in **91% of the 76 confirmed malicious payloads but only 2.6% of the whole ecosystem** —
R0-C's "36% had prompt injection" merged two different numbers. **LEARN**: most bad skills are *sloppy*, not
*hostile*; SCAN needs a volume engine and a depth engine, not one scanner
([Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)).

### 3.2 MCP servers, by business function (R0-C §2, S05 §2.7)

First-party/vendor-official servers cover code/PM (GitHub, Linear), deploy/infra (Vercel, Cloudflare, Supabase),
payments (Stripe), email (Resend), calendar/docs (Google, Notion), CRM (HubSpot), ads (Meta read+write beta, Google
read-only), analytics (PostHog, GA experimental), browser (Playwright, Chrome DevTools), voice (Twilio alpha,
ElevenLabs), memory (Graphiti, Mem0), long tail (Composio, n8n). **USE**, first-party first, per-mission read-only
grants by default; lands in 07-SKILLS-TOOLS-MCP's Function Slot table, write scopes behind the Effect Gateway.
**MCPTox** ran 353 real tools from 45 servers against 20 models: **average tool-poisoning attack success rate 36.5%
(worst 72.8%)** — **LEARN**: any unscanned server is untrusted input; the Tool Surface Lock hashes `{name,
description, inputSchema, annotations}` at admission, quarantines on drift
([paper](https://arxiv.org/html/2508.14925v1)). cisco-ai-defense/skill-scanner's 13-pass static architecture is one
of three independent SCAN passes, never the sole gate ([gh](https://github.com/cisco-ai-defense/skill-scanner)).
CaMeL's "Defeating Prompt Injections by Design" and Meta's Agents Rule of Two — **LEARN**: no session holds untrusted
input, private data and an external write all at once, a hard constraint on every MCP grant
([paper](https://arxiv.org/abs/2503.18813), [via Willison](https://simonwillison.net/2025/Nov/2/new-prompt-injection-papers/)).

### 3.3 The pipeline itself

S05's own contribution — discover→fetch→scan→normalise→sandbox→score→admit→observe→retire, one Capability Record
schema for skills/MCP/CLIs/recipes, a Projection Compiler writing two harnesses from one registry, a Skill Foundry
drafting in one model family and evaluating in the other — **is** the design, not a borrowed system, so it lives in
07-SKILLS-TOOLS-MCP rather than being re-stated here. What this map adds: every harvest number above is
independently reproducible (S05 §2.1's GitHub API command), and every safety number traces to its named paper.

## 4. Self-improving and evaluation research

*Primary: [R0-E](r0-outward/R0-E-self-improving-codex.md). Confidence markers are the seat's own: **High** (concrete
evaluation/experiment), **Medium** (author-reported, limited external validation), **Provisional**
(emerging/uncertain). "Verified" means checked against the primary publication, not reproduced by any v3 seat. **Take
is LEARN for every row in this table** — these are research systems and benchmarks, not software to adopt; we write
our own implementation of the idea.*

| System | What it showed | Conf. | Lands in v3 · Licence/Source |
|---|---|---|---|
| Voyager (2023) | Curriculum + skill library + env. feedback sustains exploration, no weight updates; 3.3× more items | High in-env | 07 (Gap Radar's "improvised procedure" detector) · research artifact — [project](https://voyager.minedojo.org/) |
| ADAS / Meta Agent Search (2024) | A meta-agent writes, evaluates, archives agent implementations; cross-domain transfer reported | Medium | 04 (Seam Miner, Audition Ladder) · research — [paper](https://arxiv.org/abs/2408.08435) |
| Darwin Gödel Machine (2025) | Agents modify their own scaffold; archive branching beats ablations; SWE-bench 20.0%→50.0% | Medium | 09b (self-improvement loop; DR-06) · ICLR 2026 — [results](https://sakana.ai/dgm/) |
| Hyperagents (Mar 2026) | Task agent + its improvement mechanism both editable; transfer shown, no verified indefinite rate | Provisional | 09b (guarded by protected computing base) · research — [paper](https://arxiv.org/abs/2603.19461) |
| AlphaEvolve (2025) | Evolutionary program search + executable evaluators; 0.7% of worldwide compute recovered (Google) | High bounded | 07 (SCORE stage; Verifier Foundry) · Google — [ann.](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) |
| AI Scientist-v2 (2025) | Generates hypotheses/experiments/manuscripts; 1/3 workshop submissions cleared threshold, then withdrawn | Medium | 03 (self-challenge, kill criteria) · research — [disc.](https://sakana.ai/ai-scientist-first-publication/) |
| Co-Scientist (Nature 2026) | Hypothesis generation, criticism, tournament selection; 3 biomedical validations, humans in the loop | High | 05 (Co-founder's wagers/dissent) — [paper](https://www.nature.com/articles/s41586-026-10644-y) |
| METR time horizons (2026) | Human-expert task duration at fixed success probability; one model's horizon ranged 11.3h–>270h by cheating treatment | High limit, low per-# | 09b (never quote one "hours of autonomy" figure) — [method](https://metr.org/time-horizons/) |
| MirrorCode (Jul 2026) | Reimplements whole programs from behaviour w/ hidden tests; Opus 4.7 solved 56% of 25 programs | High in-task | 09b (behavioural tests as a verifier source) · research — [paper](https://arxiv.org/html/2606.30182v2) |
| SWE-bench Pro/Live/V2 | Harder repos, fresh tasks; V2 removed 89 invalid, corrected 69 after finding leakage | High | 09b (sealed holdouts, anti-gaming) · mixed — [V2](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2) |
| GAIA (2023 baseline) | 466 questions; humans 92%, GPT-4+plugins 15% — dated | High, dated | 09b (fresh-capability tier) · research — [paper](https://arxiv.org/abs/2311.12983) |
| τ-bench / τ²-bench | Policy-following via final DB state; agents <50% overall; τ² degrades with an acting user | High, version-specific | 09b (report pass^k, not pass@k); 03 — [τ-bench](https://arxiv.org/abs/2406.12045) |
| TheAgentCompany (2025 rev.) | Simulated workplace; best baseline ~30% autonomous — completion ≠ operating a company | High, dated | 09b (twin fidelity scoping, DR-18) — [paper](https://arxiv.org/abs/2412.14161) |
| AppWorld / AppWorld-UL (2026) | Checks desired change *and* collateral damage; infeasible-request handling; 48.6% success | High in sim | 09b (twin checks collateral effects); 05 — [AppWorld](https://arxiv.org/abs/2407.18901) |
| Generative simulations of people | Interview-conditioned agents approximate survey responses; 1,052 people, 85% of test–retest accuracy | Medium; narrow | 09b (DR-18: enthusiasm awaits real validation) — [paper](https://arxiv.org/abs/2411.10109) |
| AgentDojo / MaMa | 97 tasks/629 adversarial cases; MaMa searches architectures resistant to compromised members | High/medium | 09a (canary skills, red-team catch-rate) — [AgentDojo](https://arxiv.org/abs/2406.13352) |
| Reflexion | Iterative self-feedback; 91% HumanEval pass@1 vs 80% baseline — not equal-cost | Medium | 03 (propose→run→score→stop-check, same loop) — [paper](https://arxiv.org/abs/2303.11366) |
| GEPA | Evolves prompts from execution traces; up to 35× fewer rollouts than GRPO | Medium | 07 (Foundry: evidence-bearing skill evolution) — [paper](https://arxiv.org/abs/2507.19457) |

**What reliably improves outcomes (R0-E §2):** executable feedback + selection is strongest (AlphaEvolve, Voyager,
MirrorCode). Reflection tied to traces (Reflexion, GEPA) is moderate, task-specific. Reusable versioned skill archives
(Voyager, DGM) support keeping alternative lineages, even initially-underperforming ones. Debate is conditional: one
experiment raised weak-model accuracy 48%→76% ([paper](https://arxiv.org/abs/2402.06782)), but a seven-benchmark
study found majority voting explains most of its apparent gain ([paper](https://arxiv.org/abs/2508.17536)) —
**LEARN**: test debate against independent answers plus selection at matched cost. Adversarial redesign (MaMa)
supports a persistent attack–repair loop, not a "red-team agent reviewing prose."

**What does not work (R0-E §3):** self-approval without external feedback can *degrade* reasoning
([paper](https://arxiv.org/abs/2310.01798)); the optimiser can improve its score instead of its work (METR's
hidden-test exploitation; SWE-Bench Pro V2's regrading after leakage); no single "hours of autonomy" number
generalises; `pass^k` ≠ `pass@k`, reported separately; a monitor can miss the action entirely — coverage gaps, older
sub-agents bypassing visibility ([note](https://metr.org/notes/2026-09-27-implementing-a-basic-blocking-action-monitor/));
recursive improvement remains bounded — METR's September assessment still finds limits in foresight, feedback
creation and judgment ([assessment](https://metr.org/blog/2026-09-22-claude-opus-5-5/)).

## 5. Tiny-team companies: what AI-run organisations have actually achieved

*Primary: [R0-D](r0-outward/R0-D-tiny-teams-codex.md), evidence cut 2026-09-30. Companies, not software — no licence
column. Confidence is the seat's own: **High** (documented event/processor-linked payment), **Medium**
(founder/vendor report), **Low** (promotional, uncorroborated).*

| Company / case | What is actually demonstrated | Conf. | Take · Lands in v3 |
|---|---|---|---|
| Base44 / Maor Shlomo | Founder-owned acquisition (~$80m initial consideration, Jun 2025), **8 employees** — "solo" meant ownership, not labour | High txn | **LEARN** · 17 (Genesis claims distinguish ownership from operation) |
| Cal AI | $40m+ sales/12mo, 7 employees+contractors (Mar 2026) — a >$5.7m/employee headline excluding contractors and a prior 17-person description | High/medium | **LEARN** the denominator trap · 09b (FTE-equivalent must exclude contractors) |
| Pieter Levels / Photo AI | $105k/mo revenue, $80k/mo profit (Mar 2026); "solo" but employed an AI developer 10 months; a Stripe-webhook flow won a $1,199 dispute | Medium | **LEARN** · 16 (dispute-evidence automation) |
| Marc Lou's portfolio | $1,032,000 portfolio revenue 2025 across 15 streams; $30,831 MRR by Sep 2026 | Medium | **LEARN** · 03 (Probe/Replication sleeves = a portfolio-of-bets pattern); 17 |
| Marc Lou / TrustMRR | $301,198 gross revenue + ~$30k fees over 9 months (cumulative, not ARR); founder redirected to acquisitions after failed experiments | Medium | **LEARN** · 05 (Co-founder keeps commercial judgment as building accelerates) |
| Nat Eliason / Claw Mart & Clawsourcing | $182,432 all-time revenue, Stripe-API verified; separate support/sales agents after one was overwhelmed; once promised refunds it could not execute | Med–high | **LEARN** · 04 (separate sales/support queues) |
| Nexus Creative Co. | Vendor-reported 8→11 clients, +$12,600 MRR/90d, unchanged team size; delivery admin automated, strategy stays human | Low | **LEARN**, directional · 17 (agency pattern, low-confidence) |
| StrongDM AI team | 3-person internal team; agents exploit narrow, implementation-owned tests (Feb 2026) | Medium | **LEARN** · 09b (coverage contract must include scenarios the worker can't rewrite) |
| Project Vend (I & II) | Agents sourced/priced/sold goods; phase 1 lost money via discounts; phase 2's agent cut discounts but leakage shifted to refunds; CEO persona shared the worker's blind spots | High | **LEARN** · 16 (margin floors enforced in the tool, not a persona) |
| Andon Market / Café | Agents run procurement, staff, sites, marketing, customer requests; still not profitable; weak analysis, unnecessary hiring after context loss | High | **LEARN** · 06 (obligations in structured records, not summaries) |
| Prediction Arena | 6 models traded $10k real capital each, 57 days; Kalshi returns −16.0% to −30.8% — a failure counterweight | Medium | **LEARN** · 09b (experiment budgets separated from operating cash, judged over fixed periods) |

**Patterns across the winners (R0-D §2):** customer judgment stays human while production accelerates; stacks are
concrete and heterogeneous, not one silver-bullet tool; sales/support split into distinct queues at volume; agencies
automate delivery admin, keep relationships human; automation reaches money and operations, not just content;
compliance stays explicit — Andon's staff remain formally employed after one incident exposed salary data.

**A denominator warning beyond Cal AI:** a study of 160,000+ Product Hunt launches found rising solo entry but greater
team representation near the top of *rankings* — not audited outcomes ([study](https://arxiv.org/abs/2605.10291)).
**LEARN**: v3's metrics report revenue, recurring revenue, gross margin and founder hours **separately** (17, 09b) —
a sales spike or acquisition price cannot measure operating independence.

## 6. Organisations in history

*Primary: [R0-B](r0-outward/R0-B-organisations.md), 17 mechanisms. Extended with safety/governance research found in
`S10-organisation-theory.md` and systems-theory sources found in `S11-wildcard-systems.md`. No licence column — these
are organisations, doctrines and research, not software.*

### 6.1 R0-B's seventeen mechanisms

| Organisation | Mechanism | Evidence | Take · Lands in v3/Source |
|---|---|---|---|
| Prussian army (Moltke) | Auftragstaktik: give the goal and reason, not the method | 1869 Instructions; US Army adopted 1986 | **LEARN** · 05 (briefs carry intent/purpose/end-state, never steps) — [army.gov.au](https://researchcentre.army.gov.au/library/australian-army-journal-aaj/auftragstaktik-mission-command) |
| Incident Command System | Modular org grows with the incident; span of control 3–7 | NIMS standard; Katrina showed the cost of skipping it | **LEARN** · 04 (mission shape expands/collapses with load, ≤5 lanes/lead) — [AIHA](https://publications.aiha.org/202104-taking-command-emergency-response) |
| Film production | Temporary crew per film; a call sheet and dailies each day | Industry standard for 100+ strangers against a fixed date | **LEARN** · 08 (the Dailies Reel) — [StudioBinder](https://www.studiobinder.com/blog/what-does-an-assistant-director-do/) |
| Toyota (TPS) | Jidoka (stop on defect), andon (anyone stops the line), kaizen | NUMMI: GM's worst workforce became its best in a year | **LEARN** · 05 (SCRAM safe state: any agent may pull andon) — [Wikipedia](https://en.wikipedia.org/wiki/Andon_(manufacturing)) |
| Bell Labs | Critical mass of disciplines; buildings forced corridor collisions | Transistor, information theory (Gertner) | **LEARN [S]** · 07 (Gap Radar's adjacent-possible sweep) — [summary](https://sts10.github.io/2015/09/14/bell-labs-the-idea-factory.html) |
| Lockheed Skunk Works | Near-total manager control; team kept small "in an almost vicious manner" | U-2/SR-71 built by small teams; needs one exceptional leader | **LEARN** · 04 (Mission Lead composes team inside a tranche) — [Good Science Project](https://goodscienceproject.org/articles/managing-lockheeds-skunk-works/) |
| Apollo (Mueller) | All-up testing: test the whole stack as flown | Saturn V flew crewed after few flights | **LEARN** · 09b (twin's whole-system rehearsal before a one-way door) — [heroicrelics](http://heroicrelics.org/info/all-up/reflections-mueller.html) |
| Amazon | Single-threaded leaders; six-page silent-read memos; Type 1/2 doors | Sustained across two decades of shareholder letters | **USE** · 00-CANON §3 (door type) — [2015 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF) |
| Bridgewater | Believability-weighted decisions; public "baseball cards" | Dalio's claimed meritocracy; Copeland's *The Fund* documents its human cost | **LEARN**, no cruelty · 09b (Calibration Ledger; Trust stock per identity×domain) — [Principles](https://www.principles.com/principles/88eaccff-925f-4571-aafe-b6668c007464/) |
| Renaissance (Medallion) | One single model everyone improves; no competing bonuses | ~200 of ~400 staff on Medallion; one model since 1988 | **LEARN** · 06 (the Brain: all agents improve one shared world model) — [Wikipedia](https://en.wikipedia.org/wiki/Renaissance_Technologies) |
| Linux kernel | MAINTAINERS maps path→owner; a trust tree of lieutenants | Largest collaborative codebase; "don't scale" is the counter-warning | **LEARN** · 04 (Responsibility, leases, hot resources) — [kernel.org](https://docs.kernel.org/maintainer/index.html) |
| Apache Foundation | Lazy consensus (silence = assent); a veto needs justification | Governs hundreds of projects | **LEARN** · 00-CANON §3 (P8 optional methods never block) — [ASF voting](https://www.apache.org/foundation/voting.html) |
| Hospitals | WHO checklist; I-PASS handoff; M&M conferences | Checklist: complications 11%→7%; I-PASS: errors −23%; Ontario found no mortality drop | **LEARN** · 04 (handoff schema per Responsibility transfer) — [NEJM 2009](https://www.nejm.org/doi/full/10.1056/NEJMsa0810119) |
| Haier (RenDanHeYi) | ~4,000 micro-enterprises of ~10; pay from the user, not the boss | World's largest appliance maker's cited model; units cannibalised each other | **USE** · 17 (Micro-venture tier; the 30% inter-venture cap) — [Corporate Rebels](https://www.corporate-rebels.com/blog/rendanheyi-forum) |
| Valve | No managers; people pick projects | Hits produced; Ellsworth: "a hidden layer of powerful management" | **LEARN**, warning · 00-CANON §2 (authority explicit and inspectable even fluid) — [GeekWire](https://www.geekwire.com/2013/valves-company-structure-felt-lot-high-school-employee/) |
| Venture studios | A shared team spins up many companies | GSSN self-report: 72% reach Series A vs 42% — directional | **LEARN** · 02 (shared services, per-venture teams, portfolio view) — [Bundl](https://www.bundl.com/articles/why-venture-studio-startups-have-higher-long-term-success-rates) |
| Pixar Braintrust | Peers critique a film in progress, no power to mandate | Toy Story 2 rebuilt with a year left; ~30% RSI in the crunch after | **LEARN** · 09b (review coverage graph: critics without a mandate) — [Fast Company](https://www.fastcompany.com/3027135/inside-the-pixar-braintrust) |

### 6.2 S10's safety, governance and doctrine research

| Source | Mechanism | Evidence | Take · Lands in v3/Source |
|---|---|---|---|
| Weick & Sutcliffe, High-Reliability Organizations | Deference to expertise: authority migrates to whoever holds the live picture during high tempo, then back | Five principles, applied to carriers/ATC/nuclear | **LEARN** · 04 (Incident Lead: scoped, expiring authority migration, an explicit return — DR-27) — [source](https://www.high-reliability.org/the-five-principles-of-weick-sutcliffe) |
| Naval War College — carrier flight ops | A self-designing high-reliability organisation, studied directly | Rochlin, La Porte, Roberts, 1987 | **LEARN** · 09b (in-flight checks: every Execute move declares its expected observable) — [source](https://digital-commons.usnwc.edu/nwc-review/vol40/iss4/7/) |
| Diane Vaughan, normalisation of deviance | Repeated anomaly without consequence becomes "acceptable risk" (Challenger) | Sociological case study, widely cited | **LEARN** · 09b (deviance-drift monitor watches waiver/override *rates*; this harness's own shadow-mode stream is exactly what Vaughan says to watch) — [source](https://en.wikipedia.org/wiki/Diane_Vaughan) |
| Knight Capital | SEC proceeding: ~45 min, >$460M loss, $12M penalty under the post-flash-crash market access rule | Documented regulatory record | **LEARN** the caution · 00-CANON §2 (DR-01: whoever takes risk does not set their own limits) — [source](https://www.sec.gov/files/litigation/admin/2013/34-70694.pdf) |
| Rust RFC process | Disposition-first: propose merge/close/**postpone** before debate settles; 10-day comment period | Governs the Rust language | **LEARN** · 00-CANON §3 (`disposition`: auto/notify/ask/co-sign/never, before precedence) — [source](https://rust-lang.github.io/rfcs/) |
| Boyd, OODA loop | The side whose orientation updates faster wins | Military doctrine, widely applied outside it | **LEARN** · 03 (OODA tempo as an Allocator input alongside VoI) — [source](https://gamechanger.nu/wp-content/uploads/2025/10/Boyds-OODA-Loop-Necesse-vol-5-nr-1.pdf) |
| US Army, After-Action Review (TC 25-20) | A structured four-question review after every action | Doctrine since 1993 | **USE** · 09b (valid only when it names a changed mechanism, owner, date) — [source](https://nick.groenen.me/attachments/public/gitignored/TC%2025-20%20A%20Leader's%20Guide%20to%20After-Action%20Reviews.pdf) |

### 6.3 S11's systems-theory sources

| Source | Contribution | Take | Lands in v3 |
|---|---|---|---|
| Donella Meadows, *Leverage Points* (1999) | Twelve leverage points, ranked weakest to strongest | **LEARN** | 09b (Regulation's Homeostats: the twelve points mapped to concrete levers) — [essay](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/) |
| Peter Senge, *The Fifth Discipline* (1990) | System archetypes: drift to low performance, shifting the burden, escalation, fixes that fail, limits to growth | **LEARN** | 09b (failure-attractor signatures classified against Senge's archetypes) — book, no URL |
| W. Ross Ashby, *An Introduction to Cybernetics* (1956) | The homeostat; requisite variety | **LEARN** | 09b (the Governor's set-point/band model and diversity floor) — book, no URL |

**Cross-cutting laws these cases agree on (R0-B §2), each answered above:** intent travels, instructions rot;
authority must be legible or it's negotiated in a crisis (Valve, Katrina); span is bounded by attention, not by how
tireless workers are; anyone can stop, few can start the irreversible; critique needs separation from power
(Braintrust, Apache, M&M); structure belongs at the seams, not the middle; learning counts only if it changes a
mechanism (M&M's 7.6% vs NUMMI's rebuilt system); autonomous units need a market rule against cannibalising each
other (Haier vs Renaissance); test the whole thing as it will run (Apollo); transparency without dignity collapses
for humans (Bridgewater) — why the twin's canaries and the Referee's telemetry can be exhaustive where a human
workplace cannot (R0-B §3).

## Open questions

1. **Should the Capability Custodian (S05 §2.11) get its own row in the authority stack, or stay inside 07 as S05's
   "Challenge to the synthesis" argues?** If Execution both chooses capabilities and requests grants, it sets its own
   powers — the violation DR-01 forbids elsewhere. **Recommendation:** a role under Custody (admits, grants, rings;
   never runs/judges missions), not an eighth authority — DR-52 already closed the count at seven.
2. **How much of §6.2's safety research (HRO, Vaughan, Knight Capital) belongs in 09b's normative text versus staying
   inspiration here?** They're real cases, correctly distinguished from licensed software, but 09b risks citing them
   as settled justification when they're analogy. **Recommendation:** 09b may cite for motivation, but every
   mechanism they motivate still needs its own test (00-CANON §10 rule 5).
3. **Should §5's tiny-team evidence be re-cut as it ages?** R0-D's confidence grades are a 2026-09-30 snapshot of
   fast-moving, mostly self-reported numbers. **Recommendation:** treat §5 as a dated appendix — re-run R0-D's method
   (not its numbers) after Q1 2027.

## Sources

**Primary (outward research, r0):**
- [R0-A — Frontier of multi-agent systems and agent platforms](r0-outward/R0-A-agent-platforms.md)
- [R0-B — How great organisations delegated, coordinated and learned](r0-outward/R0-B-organisations.md)
- [R0-C — The agent tooling ecosystem (skills, MCP, memory, voice)](r0-outward/R0-C-tooling-ecosystem.md)
- [R0-D — Tiny teams with AI: what is actually achieved](r0-outward/R0-D-tiny-teams-codex.md)
- [R0-E — Self-improving, open-ended and evaluated agents](r0-outward/R0-E-self-improving-codex.md)

**Primary (specialist seat, r2):**
- [S05 — Skills, tools and MCP: the capability supply chain](r2-seats/S05-skills-tools-mcp.md)

**Extended (grepped from all fourteen r2-seats for external citations not already in the primary six; nine seats —
S01, S03, S04, S06, S07, S08, plus overlapping URLs in S02/S09/S14 — cited nothing beyond R0-A/R0-E/S05):**
- [S10 — Organisation theory](r2-seats/S10-organisation-theory.md) — HRO, Vaughan, Knight Capital, Rust RFC, OODA, AAR
- [S11 — Wildcard: the Compounding Organisation as a living system](r2-seats/S11-wildcard-systems.md) — Meadows, Senge, Ashby
- [S12 — Engineering](r2-seats/S12-engineering.md) — Kleppmann fencing tokens, Litestream, Apple container, CaMeL
- [S13 — External world and humans](r2-seats/S13-external-world-humans.md) — AP2, x402, Stripe, Cloudflare, Mercury, DocuSign, RentAHuman

**Binding context read before writing:** [00-CANON.md](00-CANON.md) (§0–§8, §10), [00-FOUNDER-DIRECTION.md](00-FOUNDER-DIRECTION.md),
[01-VISION.md](01-VISION.md), [02-ORGANISATION.md](02-ORGANISATION.md), [_process/SEAT-CONTEXT.md](_process/SEAT-CONTEXT.md).
