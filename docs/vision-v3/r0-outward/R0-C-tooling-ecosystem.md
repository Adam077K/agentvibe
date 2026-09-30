# R0-C — The agent tooling ecosystem (skills, MCP, memory, voice), September 2026

Round 0 outward seat. Sources accessed 2026-09-30. **Verified** = I counted it (GitHub contents API) or read it on the
vendor's own page. **Claimed** = someone else's number, not checked. Speculation is marked.

## 1. Skill sources

The format has converged. **Agent Skills** (a folder with `SKILL.md` + `name`/`description` frontmatter, plus optional
scripts/references/assets, loaded by progressive disclosure) started at Anthropic and is now an open standard. About 45 clients
support it, including Claude Code, ChatGPT & Codex, Cursor, Gemini CLI, Copilot, VS Code, OpenHands, Goose, Letta, Factory
and Kiro ([agentskills.io](https://agentskills.io/)). **AGENTS.md** is the project-instructions sibling. The Agentic AI
Foundation (Linux Foundation) stewards it, and it claims 60k+ OSS repos ([agents.md](https://agents.md/)).

| Source | # skills | Licence | Quality signal | URL |
|---|---|---|---|---|
| anthropics/skills | **19, verified** | Apache-2.0; docx/pdf/pptx/xlsx source-available only | First-party reference (skill-creator, mcp-builder, frontend-design, webapp-testing…) | [gh](https://github.com/anthropics/skills) |
| obra/superpowers | **15, verified** | OSS | A coherent SDLC workflow (brainstorm → plan → TDD → subagents → verify). In the official Claude marketplace since 2026-01-15 | [gh](https://github.com/obra/superpowers) |
| anthropics/claude-plugins-official | unstated (internal + external_plugins) | Apache-2.0 | Submission review, but "Anthropic doesn't verify functionality". 37.2k★ | [gh](https://github.com/anthropics/claude-plugins-official) |
| openai/plugins (Codex) | unstated (Figma, Notion, Build-Web-Apps, Expo, Netlify…) | unstated | First-party. openai/skills (27.8k★) is **deprecated** in its favour | [gh](https://github.com/openai/plugins) |
| skills.sh + vercel-labs/skills CLI | directory of any repo with SKILL.md | OSS | Install telemetry: find-skills 3.4M, mattpocock grill-me 1.1M (4 of the top 5 are mattpocock), anthropic frontend-design 881k. The CLI targets **79 harnesses** (claimed) | [gh](https://github.com/vercel-labs/skills) |
| ComposioHQ/awesome-claude-skills | "1000+" claimed | Apache-2.0, per-skill varies | 75.9k★. 78 SaaS automations through Composio. Rule: "based on a real use case" | [gh](https://github.com/ComposioHQ/awesome-claude-skills) |
| sickn33/antigravity-awesome-skills | "2,602+" claimed (forks 1.3k–2.4k) | MIT core; per-skill MIT/Apache/**AGPL**/CC-BY | 47.1k★. Validation is structural only; its README says it "does not certify … operational safety". Upstream of the founder's old 426-skill kit | [gh](https://github.com/sickn33/antigravity-awesome-skills) |
| this repo | 134 curated | — | CURATION.yml records each cut. The founder says not to anchor on it | local |

**Safety evidence:** Snyk scanned 3,984 skills (ClawHub + skills.sh, Feb 2026). **13.4% had a critical issue**, and 36% had
prompt injection ([Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)). A USENIX Security 2026 study
narrowed 98,380 marketplace skills to 157 confirmed malicious
([OWASP ref](https://github.com/OWASP/secure-agent-playbook/issues/21)), and 30+ malicious skills targeted Claude Code users in
Feb 2026. Detectors are research-grade: SkillProbe ([2603.21019](https://arxiv.org/pdf/2603.21019)), SkillSieve
([2604.06550](https://arxiv.org/pdf/2604.06550)), SkillGuard ([2606.03024](https://arxiv.org/pdf/2606.03024)).
**Reading:** thousands of skills exist and only dozens are high-signal. Installs measure popularity, and nobody publishes
measured outcomes.

## 2. MCP catalogue by business function

MCP now sits in the Linux Foundation's Agentic AI Foundation, co-founded by Anthropic, Block and OpenAI
([blog](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/)). Spec revisions: 2025-11-25
(async Tasks, M2M auth) and 2026-07-28. Registries (secondary counts): the official one at registry.modelcontextprotocol.io
(about 2,000 servers, open API), Smithery (about 7,300) and PulseMCP (15,930+).

| Function | Server | Maintainer | Maturity |
|---|---|---|---|
| Code hosting / PM | GitHub MCP (remote OAuth) · Linear MCP | vendors | Production |
| Deploys / backend | Vercel MCP (deploys, env, logs) · Cloudflare · Netlify · Supabase (can run SQL, so scope it) | vendors | Production |
| Payments | Stripe MCP + agent toolkit | Stripe | Production |
| Email | [Resend MCP](https://github.com/resend/resend-mcp): 10 tool groups, remote at mcp.resend.com | Resend | Official |
| Mail / calendar / docs | Gmail, Google Calendar, Drive, Notion, Figma (all live in this session) | vendors | Production |
| CRM | HubSpot MCP | HubSpot | Official |
| Ads | Meta Ads AI Connectors, mcp.facebook.com/ads: **read + write** (since 2026-04-29) · Google Ads MCP: **read-only**, 3 tools (since 2026-04-28) ([ref](https://www.digitalapplied.com/blog/official-ads-mcp-servers-meta-google-tiktok-2026-playbook)) | Meta · Google | Beta · Official OSS |
| Analytics | [Google Analytics MCP](https://github.com/googleanalytics/google-analytics-mcp) (local, read-only, experimental) · PostHog MCP | Google · PostHog | Exp. · Prod |
| Browser | [Playwright MCP](https://github.com/microsoft/playwright-mcp) (a11y snapshots) · [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp/) | Microsoft · Google | Mature |
| Telephony / voice | [Twilio MCP](https://www.twilio.com/en-us/blog/developers/twilio-update-e4-mcp) (1,400+ endpoints) · [ElevenLabs MCP](https://github.com/elevenlabs/elevenlabs-mcp) (local + hosted OAuth) | vendors | **Alpha** · Official |
| Memory | Graphiti MCP 1.0 · mem0 MCP | Zep · Mem0 | 1.0 · Prod |
| Long tail | Composio (hundreds of SaaS toolkits behind one auth) · n8n | vendors | Production |

**Security evidence:** MCPTox ran 353 real tools from 45 servers against 20 models and found an **average tool-poisoning attack
success rate of 36.5% (worst 72.8%)** ([2508.14925](https://arxiv.org/html/2508.14925v1)). Secondary and unverified: 38% of
500+ servers had no authentication, and 36.7% of 7,000+ were SSRF-vulnerable. Any server we have not scanned is untrusted
input.

## 3. Memory systems

| System | Model | Forgetting / consolidation | Benchmark reality |
|---|---|---|---|
| **Anthropic memory stores** (Managed Agents, beta) | Path-addressed files mounted at /mnt/memory; ≤8 stores per session, ≤100 kB per memory, ≤10k memories per store | **Immutable version per write** (30-day history), redact, sha256 preconditions, read_only mounts. **Dreaming** writes a *new* consolidated store instead of mutating the old one ([docs](https://platform.claude.com/docs/en/managed-agents/memory)) | None public. The docs warn that injected content persists as "trusted memory" |
| Anthropic memory tool | Client-side file directory | none | — |
| **Letta** | Shared, size-capped memory blocks; Letta Code rewrites its own system prompt | **Sleep-time agents** consolidate while idle ([docs](https://docs.letta.com/guides/agents/architectures/sleeptime/)); the paper reports about 5× less test-time compute at equal accuracy ([2504.13171](https://arxiv.org/pdf/2504.13171)) | LoCoMo about 74–83 (third party) |
| **Zep / Graphiti** | Temporal KG, **bi-temporal edges** (valid/invalid + learned times) | Invalidates rather than deletes, so it can answer "what was true when" | Claims 94.7% LoCoMo; a third party measured 75.1%. LongMemEval R@5 63.8% |
| **Mem0** | LLM extract → ADD/UPDATE/DELETE over vectors (+ graph) | LLM-decided; no temporal validity | Self-reported about 93–94% LongMemEval; **independent OSS test: 32.4%** ([dev.to](https://dev.to/everest_an/-i-benchmarked-ai-agent-memory-in-2026-and-the-numbers-tell-a-different-story-than-the-marketing-2ae4), by an author who maintains a competitor) |
| **Cognee** | Graph + vector + relational; 14 retrieval modes | "memify" prunes stale nodes and reweights edges by usage | Vendor claims only |
| **LangMem** | Semantic + **procedural** | Rewrites prompts from trajectories | — |

**Evidence on forgetting (2026):**
- **ForgetEval** ([2606.15903](https://arxiv.org/abs/2606.15903)): 13 configurations, 385 adversarial cases. Deterministic
  stores score 0–5% on canonicalization. An LLM at write time fixes that (100%) but scores **0% on intent-aware deletion**.
  An LLM *at mutation time* scores 78–85% on deletion and **91.7–93.2% overall**, at $0.17 per run. Where the model sits
  decides which forgetting failures you can recover from.
- **SleepGate** ([2603.14517](https://arxiv.org/abs/2603.14517)): conflict-gated forgetting keeps 97–99.5% retrieval under
  interference, where every baseline stays below 18%. Superseded facts actively damage retrieval.
- Forgetting "should be governed, not incidental" ([SSGM 2603.11768](https://arxiv.org/pdf/2603.11768)). New benchmarks
  (MemoryArena, AMA-Bench, EvoMemBench, FiFA) score use and privacy-aware forgetting, not just recall.
- **Nobody measures whether a memory was read and whether reading it changed an outcome.**

## 4. Voice / phone stack for reaching the founder

| Layer | Option | Cost (claimed) | Note |
|---|---|---|---|
| Carrier | Twilio Voice | about $0.014/min US outbound | Numbers, SMS fallback, SIP |
| LLM bridge | Twilio **ConversationRelay** | +$0.07/min ([quiq](https://quiq.com/blog/twilio-voice-pricing/)) | WebSocket; Twilio handles STT/TTS; **Claude is the brain** |
| Speech-to-speech | OpenAI **gpt-realtime** (SIP, native MCP) | $0.06–0.11/min, mini $0.02–0.05 ([forasoft](https://www.forasoft.com/blog/article/openai-realtime-api-pricing)) | Lowest latency; GPT is the brain |
| Platforms | Retell ($0.07 base, about $0.11–0.15 all-in) · Vapi ($500/mo at 10k min) · ElevenLabs Agents ($0.08/min) | — | Median turn latency 1.96 s / 2.34 s / 1.73 s. Source is **Retell's own blog, so vendor-biased** ([retell](https://www.retellai.com/blog/retell-vs-bland-vs-vapi-vs-elevenlabs)) |

Speculation: a single founder produces minutes per day, so cost doesn't matter and **controllability** does. A hosted
platform is a second agent runtime with its own memory. Twilio + ConversationRelay keeps the brain in our harness.

## 5. What we should use

1. **Agent Skills + AGENTS.md are the only formats.** Claude Code and Codex both read them, so one library serves both equal
   workers.
2. **Harvest from about 6 upstreams, not 2,600 skills.** Tier A: anthropics/skills, superpowers, openai/plugins,
   mattpocock/skills, vendor-authored skills (Vercel, Stripe, Supabase, Figma). Tier B (mine, don't trust): awesome lists and
   antigravity.
3. **Acquisition pipeline.** Every stage leaves a record:
   ```
   DISCOVER skills.sh trending · GitHub topics · MCP registry API · gap signals from failed missions
   → FETCH    pin commit SHA; record URL + licence
   → SCAN     static (secrets, curl|sh, exfil hosts, hidden unicode) + LLM ToxicSkills read + licence filter (no AGPL in ventures)
   → SANDBOX  3 golden tasks, with vs without the skill, on Claude AND Codex
   → SCORE    Δ success, Δ tokens, Δ wall-clock, trigger precision
   → ADMIT    into a namespace router with version + scorecard  |  REJECT with reason
   → OBSERVE  loads, loads-in-successful-missions, last used
   → RETIRE   unused 60 d or negative Δ → archive; upstream change → re-SANDBOX
   ```
4. **Agents author skills.** A wall hit twice → the post-mission reviewer drafts a skill (skill-creator / writing-skills) →
   it enters the pipeline at SANDBOX.
5. **First-party remote MCPs first** (GitHub, Vercel, Stripe, Supabase, Linear, Resend, HubSpot, Meta Ads, Playwright,
   DevTools). Community servers only when pinned and scanned. A 36.5% poisoning success rate rules out "anything from a
   registry".
6. **Per-mission MCP grants, read-only by default.** The team composer grants only what the mission needs. Write scopes
   (Meta Ads, Stripe refunds, email send) sit behind approval gates.
7. **Mirror the official registry API** into our own catalogue. Don't depend on third-party directories.
8. **Memory backbone: versioned files + a temporal graph.** Anthropic-style versioned stores fit "no graveyard". **Graphiti**
   handles the per-venture company brain ("price was $29 until 2026-08-01"). This **contradicts CLAUDE.md's "Mem0 primary"**,
   because the independent OSS number is 32%. Re-measure Mem0 on our data before keeping it.
9. **LLM at mutation time**, following ForgetEval: a hook on every update/delete, not only at write time.
10. **Consolidate into a new store**, as dreaming does: diff it, promote it, keep the old one read-only. Consolidation becomes
    reviewable and reversible.
11. **Phone: Twilio number + ConversationRelay + a Claude brain**, about $0.08/min, with ElevenLabs voice. gpt-realtime is the
    fallback, which keeps OpenAI/Codex an equal.
12. **Calls escalate by altitude and budget.** Every call produces a transcript and a decision record, and blocked missions
    resume.
13. **Our own outcome leaderboard** for skills and MCPs: "missions succeeded with vs without", per model. This is the metric
    nobody publishes.
14. **The simulation twin pins the tool plane** (skill SHAs, MCP versions), or a rehearsal proves nothing.

## 6. Gaps nobody fills yet

- Outcome-scored skills. Only installs and structural checks exist.
- Cross-harness equivalence: does a skill behave the same in Claude Code and Codex?
- **Read/use-tracking memory.** Everyone measures recall; nobody measures influence.
- Governed forgetting as a product: intent-aware deletion with audit. It exists only in research.
- Signing and provenance for SKILL.md and MCP servers. "Verified" registries are promised for Q4 2026.
- Multi-agent memory concurrency: leases and merges for *knowledge*, not code.
- Founder-reach orchestration. Voice stacks are built for call centres, not "one person, many agents, interrupt only on
  altitude".
- Cross-venture lessons without leakage: separating a generalizable lesson from private facts.

## 7. Where this hits the founder's direction

- **#11 Skills from scratch:** §5.2–5.4 is the pipeline he asked for. His old kit's upstream is the *least* trustworthy source
  here. "Harvest widely" is right only behind a scanner and a sandbox eval, or it imports the 13.4%.
- **#10 Memory without a graveyard:** his criterion (read *and used*) is ahead of every vendor, so we build the read/use
  telemetry ourselves on top of versioned stores + new-store consolidation + mutation-time LLM hooks.
- **#6 Claude = Codex:** the shared formats make equality cheap at the tool layer. Scorecards must be per model.
- **#12 Voice/phone:** feasible now for about $0.08/min, and it stays inside our harness. Addition: **make it two-way.** The
  founder calls in and dictates a mission.
- **External interfaces + approvals:** first-party MCPs already cover code, deploys, payments, email, CRM, ads (Meta with
  write), analytics and browser. The real design work is per-mission grants and write gates, not finding integrations.
- **Skills economy / self-improvement:** outcome-ranked skills are the weekly measurable improvement signal, and each
  retirement is a lesson.
- **Adding, not shrinking:** treat the tool plane as a supply chain (provenance → scan → eval → telemetry → retire) and as one
  of the organisation's own products. An outcome-scored public skill index could be a venture (speculation).
