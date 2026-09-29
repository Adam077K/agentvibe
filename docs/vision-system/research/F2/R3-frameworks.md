> Archival provenance — 2026-09-13: Lane R3 (Frameworks and harnesses as evidence) report for the F2 round, preserved verbatim. Subject package at `ffeba9c` (Step 0 committed; protocol frozen at `26af5d5`). The lane was formed blind: it read only the files named in its brief and no other lane's output. The return channel truncates at about 4,000 characters and drops drains over 16,000, so the report was **extracted in full from the sourcer engine's own session transcript** (the harness's record of the agent's final text block, 77,808 characters) rather than assembled from chunked resends; chunks that had already arrived were compared against the extracted text and matched verbatim. No edits were made. The lane shares a model family with every other lane and reviewer in this round; independence is procedural only. Archival is not acceptance of any finding.

# R3 — Frameworks and harnesses as evidence

## 1. Provenance header

**Lane:** R3, Frameworks and harnesses as evidence. **Date of work:** 2026-09-13. **Model family disclosure:** this lane was executed by a single Anthropic model instance. Every finding below was produced and checked inside one model family, so the independence available to this lane is **procedural only**: separate context, no sight of sibling lane outputs, and per-claim return to primary sources. Nothing here is corroborated by a second model family, and the acceptance protocol's standing caveat applies in full.

**Formed independently.** No other F2 lane's output was read. No file under `docs/vision-system/research/` was read except `L03-architectures.md` and `L04-engineering.md`, which the brief names as prior-round input to extend or contradict. No F2 candidate exists yet and none was read.

**Read before research, in order:** `planning/F2/00-acceptance-protocol.md` in full, with §7 and §3 binding; `inputs/DIRECTIVE.md` in full, with §4 and §6 binding; `inputs/FOUNDER-THESIS-2026-09-13-agents.md`; the three R3-assigned entries in `planning/F2/00-thesis-claims.json` (TC-15, TC-16, TC-30, confirmed by exhaustive grep on `"lane": "R3"`, three matches); `research/L03-architectures.md`; `research/L04-engineering.md`. Repository harness read as a system under study: `CLAUDE.md`, `AGENTS.md`, all eighteen files under `.claude/agents/`, `.claude/hooks/schema-lint.js` at the tool and read-only-engine rules, `.claude/ledger/index.json`, and `docs/STATUS.md` at the dispatch-site census.

**On "what has changed since 2026-09-12."** The brief asks this and the honest answer is that the interval is one day. **Fact.** No system below can have materially changed in that window, and I found no evidence that any did. What this lane adds is therefore depth rather than recency, plus eight subjects L03 and L04 did not cover at all: Claude Code's subagent, hook, memory, skill and permission mechanics as *specified behaviour*; dynamic workflows; Gemini CLI subagents; mini-SWE-agent; DBOS, Restate and Inngest; the MCP Registry; two 2026 primary papers on matched-budget multi-agent comparison; and this repository's harness read against its own lint and ledger.

**Ledger registration could not occur. Gap, not omission.** My agent definition grants `mcpServers: [claim-append]`, and that tool is **not present in this session's tool list** (available: Read, Glob, Grep, WebSearch, WebFetch, SendMessage). Six findings below meet the durability test and carry a proposed `valid_until`; they are marked `NOT REGISTERED` and listed in §5. This is a capability absence, not a resolver refusal, and no assertion below has been moved into prose to escape a check.

---

## 2. Per-system blocks

### 2.1 Claude Code (subagents, hooks, memory, skills, permissions)

**F1. Source claim [R3-S01].** A subagent is a Markdown file with frontmatter `name`, `description`, `tools`, `model`. Non-fork subagents start with fresh isolated context: *"It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read."* What does load: the agent's own system prompt, the delegation message, CLAUDE.md files, a git status snapshot, preloaded skills, and a sibling roster. What does not: output style, the main conversation's auto memory, the parent's context window, and conversation history.

**F2. Source claim [R3-S01].** Tool grant is **subtractive and enforced by the client**, in two filters. The first removes a fixed list from every subagent regardless of declaration, including `Agent` at depth limit, `AskUserQuestion`, `EnterPlanMode`, `ScheduleWakeup`, `Workflow` and `WaitForMcpServers`. The second restricts *background* subagents to a named allowlist. `disallowedTools` applies before `tools`. `Agent(worker, researcher)` is an allowlist over which subagents may be spawned.

**F3. Source claim [R3-S01].** Delegation depth is bounded and the bound is a configuration value, not a law: *"By default, a subagent can spawn subagents of its own, up to three layers below the main conversation."* At the limit the `Agent` tool is withheld rather than the call failing, so the agent *"does its delegated work itself and returns one summary."*

| Claude Code declared limit | Value |
|---|---|
| Subagent spawn depth below main conversation | 3 |
| Concurrent subagents per session | 20 |
| Combined subagent `description` budget before warning | 15,000 tokens |
| Skill `description` + `when_to_use` truncation | 1,536 characters |
| Re-attached skill budget after compaction | 25,000 tokens, 5,000 retained per skill |
| `MEMORY.md` loaded at session start | first 200 lines or 25 KB |
| CLAUDE.md import depth | 4 hops |

**F4. Source claim, and the single most load-bearing sentence this lane found [R3-S03].** Of CLAUDE.md and auto memory: *"Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead."* The vendor states plainly that its instruction-file mechanism is persuasion and its hook mechanism is enforcement. The same page adds that *"Settings rules are enforced by the client regardless of what Claude decides to do. CLAUDE.md instructions shape Claude's behavior but are not a hard enforcement layer."*

**F5. Source claim [R3-S02].** Hooks are the enforcement surface. Exit code 2 blocks, and blocks *"whether or not you print JSON"*, with `permissionDecision: "allow"` unable to override it. Exit 1 does not block on most events. Hook processes *"inherit the parent environment"* apart from OTEL variables, so a hook holds every credential the session holds. Tool events fire inside subagents with `agent_id` and `agent_type` in the payload, and MCP tools are matchable as ordinary tool names.

**F6. Source claim, and a vendor admission against interest [R3-S05].** Bash permission rules are text matchers, not boundaries: *"A Bash rule matches the command text Claude writes ... It doesn't match the same program invoked in a different form, so a deny or ask rule covers the invocation Claude usually produces and isn't a security boundary around the program."* Rule order is deny, then ask, then allow, first match wins, and specificity does not reorder. For enforcement independent of command text the page directs the reader to sandboxing or a PreToolUse hook.

**F7. Source claim [R3-S04].** Skills are two-stage: descriptions always in context, body loaded on invocation, body persisting in context afterwards. The mitigation for library growth is a truncation cap and an observability command, `/skill-doctor`, which reports *"what each of your skills costs and how often it gets used."* **Unknown.** The documentation states no selection-degradation curve and offers no measurement of retrieval quality against library size.

**F8. Source claim [R3-S06].** Compaction *"Replaces the conversation with a structured summary."* Some entries are marked as not surviving compaction and others as restored after it. The page's interactive widget models the summary at twelve per cent of pre-compaction tokens. **Inference.** That constant is an illustrative figure inside a teaching widget, not a measurement, and must not be cited as a compression ratio.

**F9. Source claim [R3-S07].** The Agent SDK exposes the Claude Code loop as a library with hooks, subagents, MCP, permissions, sessions, and automatic loading of `.claude/` configuration. Managed Agents is named as the separate product for *"Running long-running or asynchronous agents without managing your own sandbox or session infrastructure."* A licensing constraint bears directly on this system's economics: *"Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products,"* which means a subscription seat is not a substrate a product may be built on.

**F10. Source claim [R3-S08].** The long-running harness experiment names three failure modes in the operator's own words: premature completion, where *"a later agent instance would look around, see that progress had been made, and declare the job done"*; oversized attempts, where the agent *"tended to try to do too much at once"* and ran out of context mid-implementation; and broken handovers, since *"Each new session begins with no memory of what came before."* The cures were an initializer producing a startup script, a progress log and a first commit, a feature list with pass or fail entries, and a fresh session running an end-to-end test before extending anything. **Direct observation.** No measured number appears in the piece.

**F11. Source claim [R3-S10].** As of the dynamic workflows release, Claude Code *"can now write its own harness on the fly, custom-built for the task at hand"*, executing JavaScript that spawns and coordinates subagents and decides *"which models an agent uses and whether subagents are run in their own worktree."* The stated motivation names three single-context failures: agentic laziness, self-preferential bias, and goal drift. The stated cost is candid: workflows *"are not needed for every task and may end up using significantly more tokens."*

**F12. Source claim [R3-S09].** Anthropic's own research system reports *"agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats"*, and that of three factors explaining ninety-five per cent of performance variance, *"token usage by itself explains 80% of the variance."* It names the unsuitable class explicitly: *"most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time."* Early coordination failures included *"spawning 50 subagents for simple queries"* and subagents that *"duplicate work, leave gaps."*

**Disagreement to preserve.** F12's fifteen-times figure is a vendor self-report on one task distribution and is **conflicted** under §7. It is also the number most often repeated as folklore. It agrees in direction with F1 of §2.15 below and with [R3-S25], and it is not independent of them in method.

### 2.2 Codex and Codex CLI

**F13. Source claim [R3-S11].** Codex separates two orthogonal controls. Sandbox mode decides capability: `read-only`, `workspace-write` where *"Codex can read files, make edits, and run commands in the workspace"*, and `danger-full-access`, described as *"No sandbox; no approvals."* Approval policy decides when a human is asked: `on-request`, `never`, `granular`. Enforcement is at the operating system, not in the prompt: Seatbelt via `sandbox-exec` on macOS, `bwrap` plus `seccomp` on Linux, a restricted-token implementation on Windows. **By default, *"the agent runs with network access turned off."*** The page warns directly that *"Prompt injection can cause the agent to fetch and follow untrusted instructions."*

**F14. Inference, extending L04.** The two-axis design is the cleanest authority separation in the surveyed set, because the axis that grants capability is enforced by the kernel and the axis that grants consent is enforced by the client. Neither is a prompt. A candidate that conflates "what it may do" with "when it must ask" has one axis where this has two, and cannot express `read-only` plus `never ask`, which is the shape of an unattended verifier.

**F15. Source claim [R3-S12].** `AGENTS.md` is *"a simple, open format for guiding coding agents"*, *"just standard Markdown"*, claimed as used by over sixty thousand open-source projects, and read by a long list of tools including Codex, Gemini CLI, Cursor, Copilot, Zed and Aider. Precedence is stated in one sentence: *"The closest AGENTS.md to the edited file wins; explicit user chat prompts override everything."*

**F16. Inference, and it is the same finding as F4 from a different vendor.** The industry's convergent instruction format is a convention with a nearest-file rule and no enforcement, no schema, no version, no provenance and no expiry. Claude Code does not even read it and instructs users to import it into a file it does read [R3-S03]. Two ecosystems independently arrived at "put the rules in a Markdown file the model may or may not follow", and both then built a *separate* enforcement layer beside it. **That separation, not the file, is the transferable finding.**

### 2.3 Gemini CLI

**F17. Source claim [R3-S13].** Subagents are defined as Markdown with frontmatter carrying `name`, `description`, `kind` (`local` or `remote`), `tools` with wildcard support, `model` or `inherit`, `temperature`, `max_turns` defaulting to 30, `timeout_mins` defaulting to 10, and inline `mcpServers`. Files live at `.gemini/agents/*.md` project-level and `~/.gemini/agents/*.md` user-level with project precedence. Each runs *"in its own isolated context loop."*

**F18. Source claim, and the sharpest structural contrast in the set [R3-S13].** **Gemini CLI's recursion protection is absolute: subagents cannot invoke other subagents even with wildcard tool access.** Claude Code permits three layers and withholds the tool at the limit [R3-S01]. Two vendors, one decision, opposite answers, both deliberate. **Disagreement preserved.** The evidence does not adjudicate; it establishes that delegation depth is a *design choice with a named owner*, which is exactly what protocol §5 item 7 requires of any candidate.

**F19. Source claim, secondary [R3-S13 via search corroboration].** Secondary reporting describes subagents as experimental with incomplete permission inheritance and known parallel-execution bugs. **Confidence: low.** This is not in the primary document I fetched and is recorded as an unresolved secondary claim, not as evidence.

### 2.4 OpenAI Agents SDK, and OpenAI Swarm

**F20. Source claim [R3-S14].** A handoff *"transfer[s] control to the specific agent you passed in"*, and the receiving agent *"gets to see the entire previous conversation history"* by default. An `input_filter` is the only mechanism that narrows what it sees. Guardrails do not travel: *"Input guardrails still apply only to the first agent in the chain, and output guardrails only to the agent that produces the final output."*

**F21. Direct reading of F20, and it is a finding against the pattern.** The SDK's default handoff is the opposite of context isolation: full history transfers and the checking apparatus does not. An architecture that calls this "delegation to a specialist" has delegated the *work* while leaving the *context boundary* and the *verification boundary* behind. Agents-as-tools is the SDK's own alternative when you want *"structured input for a nested specialist without transferring the conversation."*

**F22. Source claim [R3-S15].** The SDK draws the state line explicitly: *"The context object is not sent to the LLM. It is purely a local object."* Local context reaches tools and lifecycle hooks; LLM context is only what is in conversation history. Nested runs *"do not get an isolated copy of your app state by default."*

**F23. Source claim, from L03 and unchanged.** Swarm is client-side, stateless between calls, and its own repository marks it educational and superseded. Treating it as a current recommendation misreads its stated status.

### 2.5 Google ADK

**F24. Source claim [R3-S16].** State is a keyed scratchpad with four scopes: unprefixed (session), `user:`, `app:`, and `temp:`, where `temp:` is *"discarded after the invocation completes and does not carry over to the next one."* Writes are committed through `append_event`, which applies `EventActions.state_delta`; the service *"reads the `state_delta` from the event's actions, applies these changes ... correctly handling prefixes and persistence."*

**F25. Source claim, and a named trap [R3-S16].** Direct mutation of a retrieved `session.state` is warned against because *"Changes made this way will likely NOT be saved"*, and because it bypasses event history, breaks persistence, creates thread-safety problems and loses auditability. **Inference.** ADK's real contribution to this round is not its agent taxonomy but its insistence that *a state write is an event*, so the audit trail and the state are the same artifact rather than two artifacts that can disagree. That property is what the founder's "shared source of truth" needs and what a plain shared file does not have.

### 2.6 Microsoft Agent Framework

**F26. Source claim [R3-S17, R3-S18].** Workflows connect *typed* executors through edges and conditions, support fan-out and fan-in, emit per-executor events, and *"checkpoint[] progress at superstep boundaries."* Human input is a first-class node type: `RequestInfoExecutor` in the graph API, `ctx.request_info()` in the functional API. Both APIs are stated to produce the same observable results, and a workflow can be exposed as an agent through `.as_agent()`.

**F27. Inference, extending L03.** Two properties transfer and are rare elsewhere. First, **human input is a typed node rather than an out-of-band pause**, so "waiting for a person" is a state the graph can be inspected in rather than a process that is simply blocked. Second, **checkpoint boundaries are declared by the framework at supersteps**, so what is recoverable is a structural fact rather than a developer's discipline. Both matter for fixture F-6, where "what parks" must be a queryable state and not a stalled process.

### 2.7 LangGraph

**F28. Source claim [R3-S20].** Durability is a three-valued setting rather than a boolean. `"exit"` persists only when the graph exits, `"async"` persists while the next step executes with a stated crash-loss window, `"sync"` persists before the next step starts at a performance cost. Non-deterministic operations and side effects must be wrapped in tasks or nodes.

**F29. Source claim, and the most operationally dangerous mechanism in the survey [R3-S19].** On resume after `interrupt()`, *"the entire node restarts from the beginning"*, not from the interrupted line, so *"any code that ran before the interrupt will execute again"* and side effects before the interrupt **must be idempotent**. Interrupt matching is *index-based*, so reordering or conditionally skipping interrupts within a node causes resume failures. Bare `try/except` around `interrupt()` breaks the mechanism by catching its signalling exception.

**F30. Inference.** F29 is the precise mechanism by which a human approval step can *duplicate the external effect it was approving*. It is documented, it is not a bug, and it is invisible to anyone reading the node's source as ordinary sequential code. **This is fixture F-3's revocation case and fixture F-5's already-released-effect case, arriving from the direction nobody looks.**

### 2.8 CrewAI

**F31. Source claim [R3-S21].** The three mandatory agent attributes are `role`, `goal` and `backstory`, described as defining function, objective and *"context and personality."* Tools are assigned per agent. `allow_delegation` defaults to `False`. `max_iter` defaults to 20. The documentation frames role, goal and backstory as *instructional content that influences behaviour*, not as enforced capability.

**F32. Direct reading.** CrewAI is the clearest instance of the pattern TC-15 describes: the decomposition axis the framework asks the author to fill in first is a human job description, and the axis that carries enforced difference, the tool list, is optional and secondary. **The role name is prompt text. Nothing checks it against what the agent can do.**

### 2.9 MetaGPT

**F33. Source claim [R3-S22].** Coordination is *"a shared message pool that allows all agents to exchange messages directly"* with agents publishing structured messages and reading others' transparently. Scale is managed by subscription rather than addressing: *"agents utilize role-specific interests to extract relevant information ... based on their role profiles."* Activation is dependency-gated: *"an agent activates its action only after receiving all its prerequisite dependencies."* Executable feedback loops the Engineer over its own execution and debugging memory until tests pass or three retries are exhausted. Reported with GPT-4: 85.9 per cent Pass@1 on HumanEval, 87.7 per cent on MBPP, 3.75 of 4.0 executability on SoftwareDev.

**F34. Inference, and it is the important qualification to TC-15.** MetaGPT's roles are named after human job titles **and** carry an enforced difference: the message types a role subscribes to and the actions it may take. It is therefore evidence on *both* sides. The titles are inherited from human organisation; the routing is real. What the architecture assumes is that requirements flow forward through a sequential production process, which is a strong assumption for software construction and a weak one for market discovery, negotiation or wind-down, where upstream premises are repeatedly invalidated.

### 2.10 CAMEL

**F35. Source claim, from L03 and unchanged.** CAMEL's role-playing study reports its own protocol failures by name: role reversal, repeated instructions, promises without execution, and conversations that continue without progress. **Inference.** A failure taxonomy produced by the authors of the method is stronger evidence than a benchmark produced by the same authors, because it runs against interest. Roles here are purely prompt; nothing enforces them, and the reported failures are exactly what unenforced roles produce.

### 2.11 OpenHands

**F36. Source claim [R3-S35].** The SDK is four packages: core framework, pre-built tools, workspace implementations, and a multi-user agent server. Local and sandboxed deployment differ only by workspace type: *"Same agent code works in both modes, just swap the workspace type."* A Security component performs *"Action risk assessment and validation before execution."* **Gap:** the fetched architecture page does not state persistence or resumption semantics, and states nothing about delegation or sub-agents.

**F37. Inference.** The transferable property is that the **execution boundary is a swappable parameter of the same agent definition**, so containment is a deployment decision rather than a rewrite. The untransferable inference is that a `LocalWorkspace` object constitutes containment; it does not, and the documentation does not claim it does.

### 2.12 SWE-agent and mini-SWE-agent

**F38. Source claim [R3-S34].** mini-SWE-agent is *"The 100 line AI agent that's actually useful"*, *"Just 100 lines of python (+100 total for env, model, script)"*, and it *"does not have any tools other than bash, it doesn't even use the tool-calling interface of the LMs."* It uses *"a completely linear history"* and `subprocess.run` rather than a stateful shell. It *"Scores >74% on the SWE-bench verified benchmark"*, with a dated note attributing 74 per cent to Gemini 3 Pro.

**F39. Inference, and it is the strongest single datum for the simple baseline B0.** The same research group that established that agent-computer interface design measurably changes behaviour [L04, S12/S13] now ships a successor that **deletes** the interface engineering, keeps one tool, keeps a linear history, and reaches a competitive score. **This does not show that scaffolding never helps.** It shows that a scaffold's contribution is a function of the model generation that motivated it, and that the scaffold must be re-ablated when the model changes. Cited without its model and date, "you need an elaborate harness" is folklore.

### 2.13 Durable workflow engines

**F40. Source claim [R3-S27].** Temporal's constraint is stated as a rule about call sequences: you *"must take care to ensure that any time your Workflow code is executed it makes the same Workflow API calls in the same sequence, given the same input."* A mismatch against event history yields a non-determinism error. Code changes to workflows with runs in flight require either Worker Versioning or explicit patching.

**F41. Source claim [R3-S28].** DBOS checkpoints to Postgres, requires the workflow function to be deterministic and steps to be idempotent, and states the recovery property directly: *"once a step completes and is checkpointed, it is never re-executed."* There is *"no separate orchestration server and no infrastructure required besides Postgres"*, and the control plane is *"never involved in workflow execution."*

**F42. Source claim [R3-S29].** Restate journals and replays; non-deterministic operations must be wrapped in `run()` because *"Without `run()`, these operations would produce different results during replay, breaking deterministic recovery."* Virtual Objects supply keyed state with single-writer concurrency.

**F43. Source claim [R3-S30].** Inngest memoizes by step: on success *"the response is saved in the function run state and the step will not re-run"*, keyed by step id with a counter for repeated ids so loops do not require unique names. Failing steps retry *"independently, without re-executing other successful steps."* **Gap:** the page does not state at-least-once or exactly-once semantics explicitly.

**F44. Inference across all four, and it contains the whole class's limit.** Every one of them converges on the same contract: **the engine guarantees the control flow, and the developer guarantees the effect.** Temporal's ambiguous-completion case (L03, finding 12) is the general form, and none of the four removes it. Restate's single-writer keyed object is the only mechanism in the survey that answers protocol §5 item 8, "no writer authority on shared state", structurally rather than by convention.

| Engine | Where truth lives | What it guarantees | What it requires of you |
|---|---|---|---|
| Temporal | External service event history | Replay of the same call sequence | Determinism, patching for in-flight code change |
| DBOS | Your Postgres | Completed step never re-executed | Deterministic workflow, idempotent steps |
| Restate | Journal plus keyed virtual objects | Deterministic replay, single-writer per key | `run()` around every non-deterministic call |
| Inngest | Run state keyed by step id | Per-step memoization and independent retry | Side effects inside `step.run()` |

### 2.14 MCP and the MCP Registry

**F45. Source claim [R3-S31].** The Registry is metadata only, *"currently in preview"*, and delegates security: *"The MCP Registry delegates security scanning to: Underlying package registries ... Downstream aggregators."* Trust rests on namespace authentication through GitHub, DNS or HTTP challenge plus manual takedown. It is *"deliberately unopinionated"* and *"not intended to be directly consumed by host applications."*

**F46. Source claim [R3-S32].** The specification's own security document names confused deputy, token passthrough, session hijacking, SSRF during OAuth discovery, local server compromise, authorization URL injection, and scope inflation. It carries hard requirements: proxies **MUST** implement per-client consent; servers **MUST NOT** accept tokens not issued for them; servers **MUST NOT** use sessions for authentication; clients **MUST** reject `javascript:`, `data:` and `file:` authorization URLs; and least privilege is specified as a *progressive* scope model with incremental elevation.

**F47. Source claim [R3-S33].** Tool poisoning embeds instructions in tool descriptions *"that are invisible to users but visible to AI models"*, exploiting the asymmetry that *"AI models see the complete tool descriptions, including hidden instructions, while users typically only see simplified versions."* A rug pull is a server that *"can change the tool description after the client has already approved it."* Named mitigations are description visibility, version and hash pinning, and cross-server boundaries.

**F48. Inference.** F45 and F47 compose into a specific hole. The registry verifies *who published* a name and explicitly not *what the code does*, while the injection surface is the *description string that the registry distributes*. Approval at install time therefore binds a name to an owner and binds nothing to the text the model will read at call time. **Pinning by content hash, re-checked at use, is the only mitigation in this set that survives a rug pull.**

### 2.15 Cross-system empirical work

**F49. Source claim, primary [R3-S25].** Tran and Kiela, arXiv 2604.02460, v1 2026-04-02 and v2 2026-04-11. The abstract states that multi-agent gains *"are often confounded by increased test-time computation"*, gives an information-theoretic argument grounded in the Data Processing Inequality that under a fixed reasoning-token budget and perfect context utilisation single-agent systems are more information-efficient, and **predicts the boundary condition explicitly**: multi-agent systems *"become competitive when a single agent's effective context utilization is degraded, or when more compute is expended."* Tested across Qwen3, DeepSeek-R1-Distill-Llama and Gemini 2.5.

**F50. Disagreement, and it is a real one about method, not about direction.** Secondary summaries of the same paper reported the model families as GPT-5, Gemini and Claude Sonnet, and reported 260 configurations. The primary abstract names Qwen3, DeepSeek-R1-Distill-Llama and Gemini 2.5. **The primary source wins.** Any configuration count is recorded as unverified. This is a live instance of protocol §7's rule: a secondary restatement drifted within months, in a direction that made the result sound more relevant to this system than the paper supports.

**F51. Source claim, primary [R3-S26].** Jwalapuram et al., arXiv 2606.13003, submitted 2026-06-11, revised 2026-06-13. Automatically-generated multi-agent systems *"consistently underperform CoT-SC despite being up to 10x more expensive"*, producing *"architectural bloat that prioritizes superficial complexity which does not translate into functional utility."* **Expert-designed systems substantially outperformed automatically-generated ones.**

**F52. Inference, and it is the finding that most directly touches the founder's thesis.** F51 splits the question the thesis asks. It is evidence *against* "more agents is better" and evidence *for* "how you cut matters." Decomposition designed by someone who understands the work beat decomposition generated to look like a multi-agent system. That is consistent with the founder's position that the axis should be work, authority, tools and context, and it does **not** establish that those five axes are the right ones, because the papers do not test a role-named decomposition against a capability-named one at matched executor count.

**F53. Source claim [R3-S23].** MAST, arXiv 2503.13657v3, annotates over 1,600 traces across seven frameworks into fourteen failure modes in three categories, system design, inter-agent misalignment, and verification, with inter-annotator kappa of 0.88, and concludes that *"The identified failures require more sophisticated solutions."*

**F54. Source claim, folklore with named propagation [R3-S24].** Cognition's position rests on two stated principles, *"Share context, and share full agent traces, not just individual messages"* and *"Actions carry implicit decisions, and conflicting decisions carry bad results"*, illustrated by parallel subagents that *"cannot not see what the other was doing and so their work ends up being inconsistent"*, and recommending *"a single-threaded linear agent"* with a compression model for long tasks, which they concede *"is hard to get right."* **Label: source claim, widely propagated, no measurement published.** It is recorded because its *mechanism* is testable and its *conclusion* is not evidence.

### 2.16 This repository's own harness

**F55. Direct observation.** `.claude/agents/` holds **18 files**. Seven carry full frontmatter; eleven carry only `name`, `description`, `kind: shim`, `engine`, `lenses`, `retired`, `retires_at`. Verified by grep across the directory, not from documentation.

| Engine | model | tools | mcpServers | maxTurns | isolation |
|---|---|---|---|---|---|
| orchestrator | claude-opus-5 | Read, Write, Edit, Bash, Glob, Grep, Task | none | 30 | none |
| framer | claude-sonnet-5 | Read, Write, Edit, Glob, Grep | none | 25 | none |
| sourcer | claude-opus-5 | Read, Glob, Grep, WebSearch, WebFetch | claim-append | 25 | none |
| builder | claude-opus-5 | Read, Write, Edit, Bash, Glob, Grep | none | 30 | worktree |
| designer | claude-opus-5 | Read, Write, Edit, Bash, Glob, Grep | playwright | 30 | worktree |
| reviewer | claude-opus-5 | Read, Glob, Grep, Bash | none | 30 | none |
| reviewer-readonly | claude-opus-5 | Read, Glob, Grep | none | 30 | none |

**F56. Direct observation, and a drift finding produced by computing rather than trusting.** `AGENTS.md` rows 39 to 45 record the engines' models as **Opus 4.7 and Sonnet 4.6**. The files record `claude-opus-5` and `claude-sonnet-5`. `CLAUDE.md` records the supersession and pins the valid set in a test. **The routing table was not moved in the same change as the files it describes.** `AGENTS.md` also describes `sourcer` as *"web, no repo write"* and does not record its `claim-append` grant. Two descriptions of one roster, disagreeing, which is the failure mode this repository names in four other places.

**F57. Direct observation, and the most useful thing this harness knows.** `.claude/hooks/schema-lint.js` states its own limit at the read-only rule: *"this checks the DECLARATION, not the binding. It proves the file does not ask for write tools; it does not prove the runtime refuses them if it did."* It records, as a refuted-phrase guard, that *"`tools:` SUBTRACTS but is not known to bind Bash, which is why reviewer-readonly exists at all."* **The repository has institutionalised the declaration-versus-binding distinction as lintable data.**

**F58. Disagreement, with a named discriminating test.** F57's "not known to bind Bash" is in tension with F2, where the vendor documents `tools` as a client-applied filter. The repository's status is *unverified*, not *refuted*. **Discriminating probe:** dispatch `reviewer-readonly`, whose `tools` omits `Bash`, and have it attempt one `Bash` call. A refusal settles it for this runtime and version; a success refutes the documentation's applicability to the YAML-flow-sequence form this repository uses.

**F59. Direct observation, and this is authority evidence of a kind no vendor document supplies.** Ledger claim `c-mcp-grant-binds-through-agent-dispatch` records that the grant **narrows reliably and arrives unreliably**: `builder`, declaring nothing, held zero MCP tools in all observations, while `designer` held twenty-four `mcp__playwright__*` tools on 2026-08-16 and zero across three independent dispatches on 2026-08-17 **with configuration unchanged**. Recorded confidence 0.6, cause unknown, and the verifying command checks configuration only. **Attenuation held. Delivery did not.** For fixture F-3 that asymmetry is the whole finding: a system may safely assume a child holds no more than it was granted, and may not assume it holds what it was granted.

**F60. Direct observation, decorative capability as a repeated failure class.** `AGENTS.md` records that a phase deleted **44 decorative `mcpServers` declarations** that no configuration backed, and that a `budget:` block in 25 war-room routine files declared `max_cost_usd`, `max_runtime_minutes` and `max_tool_calls` which **nothing read**, surviving because the linter deliberately did not walk that directory. It records the lesson in one line: *"A checker's coverage is not its subject."* `docs/STATUS.md` records the still-open instance: three of four workflow files, `coding.js`, `design.js` and `research.js`, are **invoked by nothing**, re-derived with a command carrying its own positive control.

**F61. Direct observation, the collapse itself.** The roster went from 21 named roles, ten with no agent file and eleven that were routing shims, to seven engines. `AGENTS.md` states why each group was never distinct: nine C-suite names were *"Nine copies of one orchestration procedure, one per domain"*; nine engineering titles were *"One procedure; what differed was which lens verified the result"*; five reviewer titles were *"Five agents differing only in which lens they carried."* Six parallel worker files *"were the engines, written twice."* **The domain knowledge was not discarded; it moved into two linted data files and a provenance manifest.**

**F62. Inference, and the caveat the handoff already demands.** F61 is evidence about **one harness**, whose roles were authored by a model, never staffed by people, and never measured against an alternative decomposition at matched executor count. It establishes that *this* roster carried no enforced difference. It does not establish that role-shaped decomposition carries none in general, and reading it that way would be the absence-of-evidence error DIRECTIVE §6 forbids.

---

## 3. Cross-system table

**Table A: control, state, authority.**

| System | Who decides the next move | Where truth lives | How authority attaches and attenuates |
|---|---|---|---|
| Claude Code | Model, inside a client loop; subagent returns one summary | Transcript plus files on disk; auto memory per repo | Client-enforced subtractive tool filter; hooks block at exit 2; sandbox at OS level; instruction files are not enforcement |
| Claude Agent SDK | Host program frames the loop; model chooses within it | Session objects, resumable and forkable | Same primitives as the CLI, programmable; subscription login prohibited for third-party products |
| Codex CLI | Model, bounded by sandbox mode and approval policy | Working tree plus JSONL execution events | Two orthogonal axes, capability by kernel, consent by client; network off by default |
| Gemini CLI | Main agent delegates by description match or explicit `@name` | Project snapshots in a shadow git repo | Per-agent tool array, `max_turns`, `timeout_mins`; **subagents may not spawn subagents** |
| OpenAI Agents SDK | Whichever agent currently holds the conversation | Conversation history plus a local, model-invisible context object | Handoff transfers full history by default; guardrails do not travel with it |
| OpenAI Swarm | Agent returns another Agent to transfer | Nothing between calls; client-side and stateless | Instructions plus functions; no permission model; superseded by the SDK |
| Google ADK | Composition style chosen by the author; sequential, loop, parallel or coordinator | Session state committed only through `append_event` | Scope prefixes, no per-agent permission model documented |
| Microsoft Agent Framework | Graph edges and conditions, or native control flow | Run-scoped and durable workflow state, checkpointed at supersteps | Middleware and typed executors as interception points; policy is the application's |
| LangGraph | Graph topology plus `Command` and conditional edges | Checkpointer for thread state, store for cross-thread | No permission model; durability is a three-valued setting |
| CrewAI | Sequential or hierarchical process, or event-driven flows | Flow state, SQLite by default | Tools per agent; `allow_delegation` off by default; role is prompt text |
| MetaGPT | Dependency gating on a shared message pool | The message pool plus structured documents | Subscription by role profile; no permission concept |
| CAMEL | Two-agent inception-prompted dialogue | The conversation | None |
| OpenHands | Single agent policy over an action and observation stream | Conversation state; workspace object | Risk assessment before execution; containment is the workspace type |
| SWE-agent / mini | Model, over one bash tool, linear history | The repository | Whatever the shell has |
| Temporal | Deterministic workflow code; engine replays | External event history | None; it is an execution guarantee, not an authority model |
| DBOS | Your process; Postgres holds checkpoints | Your Postgres | None |
| Restate | Journalled handler; engine replays | Journal plus keyed virtual objects | Single-writer per key is the only structural writer rule in the survey |
| Inngest | Event triggers plus memoized steps | Run state keyed by step id | None |
| MCP Registry | Not applicable; it is a catalogue | Server metadata only | Namespace ownership by GitHub, DNS or HTTP; **no code or behaviour verification** |
| This repository | Orchestrator session picks a playbook and dispatches | Git, plus a claim ledger, plus memory files under caps | Declared per engine, lint-checked as declaration; binding verified for narrowing, unverified for arrival |

**Table B: context, instructions, failure, evidence.**

| System | What a worker sees | Skill or instruction model | Failure model | Evidence that it works |
|---|---|---|---|---|
| Claude Code | Fresh window, or full inheritance if a fork | CLAUDE.md and rules always on; skills two-stage, description then body | Compaction summarises; premature completion, laziness, self-preference, goal drift named by the vendor | Vendor case reports; no controlled comparison |
| Claude Agent SDK | Host-assembled | Loads `.claude/` like the CLI | Session resumption and forking | Documented; none measured here |
| Codex CLI | Working tree plus AGENTS.md nearest-file | AGENTS.md, unenforced, nearest wins | Approval escalation; injection warned about explicitly | Documented mechanisms; OS enforcement is real |
| Gemini CLI | Isolated context loop per subagent | Per-agent Markdown with frontmatter | Recursion structurally prevented | Documented; secondary reports of immaturity, unverified |
| OpenAI Agents SDK | Entire prior conversation unless filtered | Instructions per agent | Guardrails scoped to first and last agent only | API documentation; no longitudinal evidence |
| OpenAI Swarm | Whatever the caller passes | Instructions and functions | Stateless; recovery is the caller's problem | Explicitly educational |
| Google ADK | Session state by scope prefix | Instructions per agent | Direct mutation silently unsaved | Documentation; composition styles, not outcomes |
| Microsoft Agent Framework | Executor inputs, typed | Application-supplied | Checkpoint and resume at supersteps; human input is a node | Documentation updated 2026-08-25; no independent evaluation found |
| LangGraph | Node reads the state channels it declares | Application-supplied | **Node re-runs from the top on resume; side effects must be idempotent** | Documentation with named pitfalls |
| CrewAI | Task context, crew memory | `role`, `goal`, `backstory` as prompt | Documented silent fallback when a restore identifier is absent | Documentation; no comparative outcome evidence |
| MetaGPT | Subscribed message types only | SOP encoded as role profiles | Three retries then stop | GPT-4 benchmark numbers, single paper |
| CAMEL | The full dialogue | Inception prompts | Author-reported protocol failures | Author-reported, against interest |
| OpenHands | Event stream | Microagents | Risk assessment component | Fifteen-benchmark paper evaluation |
| SWE-agent / mini | Linear history, bash only | None | Whatever bash does | **>74% SWE-bench Verified at 100 lines** |
| Temporal | Not applicable | Not applicable | Non-determinism error; ambiguous completion unsolved | Production-deployed, widely |
| DBOS | Not applicable | Not applicable | Completed step never re-executed | Documented guarantee |
| Restate | Not applicable | Not applicable | Replay divergence if `run()` omitted | Documented |
| Inngest | Not applicable | Not applicable | Per-step retry; at-least-once not stated | Documented |
| MCP Registry | Not applicable | Tool descriptions distributed as data the model reads | Tool poisoning and rug pull unaddressed by the registry | Preview status; no durability guarantee |
| This repository | Attempt-local, plus capped memory files | Two-tier router then skill body; lenses as linted data | 21 roles collapsed to 7; decorative capability found three times | Direct observation, one harness, no matched comparison |

---

## 4. Source table

| id | URL | Accessed | Source date | Type | P/S | Confidence | Conflict of interest | Corroborated by | Expiry | Invalidator |
|---|---|---|---|---|---|---|---|---|---|---|
| R3-S01 | code.claude.com/docs/en/sub-agents | 2026-09-13 | undated | vendor docs | P | high on mechanism | vendor | R3-S13 on isolation, not on depth | 2026-12-13 | version note changing filter or depth |
| R3-S02 | code.claude.com/docs/en/hooks | 2026-09-13 | undated | vendor docs | P | high | vendor | repo `pre-tool-use.sh` behaviour | 2026-12-13 | exit-code semantics change |
| R3-S03 | code.claude.com/docs/en/memory | 2026-09-13 | undated | vendor docs | P | high | vendor | R3-S05 restates it | 2026-12-13 | enforcement added to CLAUDE.md |
| R3-S04 | code.claude.com/docs/en/skills | 2026-09-13 | undated | vendor docs | P | high on limits, low on degradation | vendor | none | 2026-12-13 | published selection benchmark |
| R3-S05 | code.claude.com/docs/en/permissions | 2026-09-13 | undated | vendor docs | P | high | vendor, states limits against interest | R3-S03 | 2026-12-13 | rule engine becomes a boundary |
| R3-S06 | code.claude.com/docs/en/context-window | 2026-09-13 | undated | vendor docs | P | medium; widget constants are illustrative | vendor | none | 2026-12-13 | published compaction-loss measurement |
| R3-S07 | code.claude.com/docs/en/agent-sdk/overview | 2026-09-13 | undated | vendor docs | P | high | vendor | R3-S01 | 2026-12-13 | licensing change on subscription login |
| R3-S08 | anthropic.com/engineering/effective-harnesses-for-long-running-agents | 2026-09-13 | 2025-11-26 (per L04) | vendor engineering | P | medium; no numbers | vendor | R3-S10 names overlapping failures | 2026-11-26 | model generation change |
| R3-S09 | anthropic.com/engineering/multi-agent-research-system | 2026-09-13 | not exposed in fetch | vendor engineering | P | medium; single task distribution | **conflicted, vendor self-report** | R3-S25 agrees in direction, not method | 2026-12-13 | reproduction at matched budget |
| R3-S10 | claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code | 2026-09-13 | not exposed | vendor blog | P | medium | vendor | R3-S01 on worktrees and models | 2026-12-13 | feature withdrawal |
| R3-S11 | learn.chatgpt.com/docs/agent-approvals-security | 2026-09-13 | undated | vendor docs | P | high | vendor | L04 S5 | 2026-12-13 | default network policy change |
| R3-S12 | agents.md | 2026-09-13 | undated | community spec | P | high on format, unverified on adoption count | promoters | R3-S03 acknowledges it | 2026-12-13 | format gains enforcement semantics |
| R3-S13 | raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/core/subagents.md | 2026-09-13 | main branch | vendor repo docs | P | high | vendor | none on recursion rule | 2026-12-13 | recursion protection relaxed |
| R3-S14 | openai.github.io/openai-agents-python/handoffs/ | 2026-09-13 | undated | vendor docs | P | high | vendor | R3-S15 | 2026-12-13 | default history transfer changes |
| R3-S15 | openai.github.io/openai-agents-python/context/ | 2026-09-13 | undated | vendor docs | P | high | vendor | R3-S14 | 2026-12-13 | same |
| R3-S16 | adk.dev/sessions/state/ | 2026-09-13 | undated | vendor docs | P | high | vendor | L03 finding 5 | 2026-12-13 | state commit path changes |
| R3-S17 | learn.microsoft.com/en-us/agent-framework/workflows/ | 2026-09-13 | updated 2026-08-25 | vendor docs | P | high | vendor | R3-S18 | 2026-12-13 | checkpoint boundary redefined |
| R3-S18 | learn.microsoft.com/en-us/agent-framework/concepts/workflows/ | 2026-09-13 | updated 2026-08-25 | vendor docs | P | high | vendor | R3-S17 | 2026-12-13 | same |
| R3-S19 | docs.langchain.com/oss/python/langgraph/interrupts | 2026-09-13 | undated | vendor docs | P | high | vendor, states a trap against interest | R3-S20 | 2026-12-13 | resume semantics change to line-level |
| R3-S20 | docs.langchain.com/oss/python/langgraph/durable-execution and reference.langchain.com Durability | 2026-09-13 | undated | vendor docs plus search summary | P/S | medium; three-mode detail via secondary | vendor | R3-S19 | 2026-12-13 | mode set changes |
| R3-S21 | docs.crewai.com/en/concepts/agents | 2026-09-13 | undated | vendor docs | P | high | vendor | L03 finding 9 | 2026-12-13 | role gains enforced semantics |
| R3-S22 | arxiv.org/html/2308.00352v7 | 2026-09-13 | 2024-11-01 (per L03) | peer research | P | high on mechanism, dated on numbers | authors | L03 finding 10 | already stale for scores | any newer model run |
| R3-S23 | arxiv.org/abs/2503.13657v3 | 2026-09-13 | 2025-10-26 (per L03) | peer research | P | high on taxonomy, dated on rates | authors | L03 cross-system | 2026-10-26 | newer frameworks and models |
| R3-S24 | cognition.com/blog/dont-build-multi-agents | 2026-09-13 | undated | **practitioner position, folklore** | P as position, no measurement | low as evidence | vendor of a single-agent product | R3-S25 direction only | none; it is a position | published counter-measurement |
| R3-S25 | arxiv.org/abs/2604.02460 | 2026-09-13 | v1 2026-04-02, v2 2026-04-11 | peer research | P | **high, strongest in set** | none apparent | R3-S26 direction, R3-S09 direction | 2027-04-11 | matched-budget replication failing |
| R3-S26 | arxiv.org/abs/2606.13003 | 2026-09-13 | 2026-06-11, rev 2026-06-13 | peer research | P | high | none apparent | R3-S25 | 2027-06-13 | replication with expert-designed MAS winning |
| R3-S27 | docs.temporal.io/workflow-definition | 2026-09-13 | undated | vendor docs | P | high | vendor | L03 finding 12 | 2026-12-13 | determinism model change |
| R3-S28 | docs.dbos.dev/architecture | 2026-09-13 | undated | vendor docs | P | high | vendor | R3-S27, R3-S29 converge | 2026-12-13 | guarantee weakened |
| R3-S29 | docs.restate.dev/concepts/durable_building_blocks | 2026-09-13 | undated | vendor docs | P | medium; mechanism implied not stated | vendor | R3-S27 | 2026-12-13 | same |
| R3-S30 | inngest.com/docs/learn/inngest-steps | 2026-09-13 | undated | vendor docs | P | medium; delivery semantics not stated | vendor | R3-S28 | 2026-12-13 | semantics published |
| R3-S31 | modelcontextprotocol.io/registry/about | 2026-09-13 | preview, announced 2025-09-08 | spec-body docs | P | high | ecosystem sponsors | R3-S36 | at GA | registry adds behaviour verification |
| R3-S32 | modelcontextprotocol.io/specification/.../security_best_practices | 2026-09-13 | 2025-11-25 spec content served | normative spec | P | high | spec body | R3-S33 on the same surface | next spec revision | requirement changes |
| R3-S33 | invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks | 2026-09-13 | undated | security research | P | medium-high | **vendor of a scanning product** | R3-S32 scope section | 2026-12-13 | clients render full descriptions by default |
| R3-S34 | mini-swe-agent.com/latest/ | 2026-09-13 | benchmark note dated Nov 19 | project docs | P | high on design, model-dependent on score | authors | L04 S12, S13 | on next model generation | score not reproducing |
| R3-S35 | docs.openhands.dev/sdk/arch/overview | 2026-09-13 | undated | vendor docs | P | medium; gaps on persistence | vendor | L04 S11 | 2026-12-13 | architecture change |
| R3-S36 | github.com/modelcontextprotocol/registry | 2026-09-13 | preview, API freeze v0.1 | repo | P | high | ecosystem | R3-S31 | at GA | GA declaration |
| R3-R | this repository: AGENTS.md, CLAUDE.md, .claude/agents/*.md, schema-lint.js, ledger/index.json, docs/STATUS.md | 2026-09-13 | working tree at branch `ceo-4-1789314685` | **direct observation** | P | high on what is written, medium on what binds | self-observation of the system under study | ledger commands are re-runnable | at next harness change | a commit changing the files named |

---

## 5. Per-claim verdicts for every R3 claim

### TC-15 — "A substantial share of published multi-agent frameworks decompose work by human role name rather than by tools, permissions, context or verification need."

**Verdict: SUPPORTED as stated, and the census sharpens it into two populations that the claim as worded collapses together.** The measure asked R3 to record, per system, whether role names carry any enforced difference in tools, permissions or context. They do not sort the way the claim implies.

| System | Primary decomposition axis | Does the name carry enforced difference? |
|---|---|---|
| CrewAI | `role`, `goal`, `backstory` | **No.** Prompt text; tool list is a separate optional field [R3-S21] |
| CAMEL | role-play pairing | **No.** Prompt only; authors report role reversal as a failure |
| MetaGPT | SOP position | **Partly.** Name is a job title; subscription and action set are enforced routing [R3-S22] |
| OpenAI Agents SDK | named agent plus instructions | **Partly.** Tools per agent, but handoff transfers full history and guardrails do not travel [R3-S14] |
| Google ADK | named agent plus instruction | **Partly.** Composition enforced; no per-agent permission model [R3-S16] |
| Microsoft Agent Framework | typed executor | **No role names.** Types and edges are enforced [R3-S18] |
| LangGraph | node function | **No role names.** State channels are enforced [R3-S20] |
| Claude Code | named subagent | **Yes on capability, no on the name.** Tool filter, model, context isolation and depth all client-enforced; the name is free text [R3-S01] |
| Gemini CLI | named subagent | **Yes on capability, no on the name.** Tools, turns, timeout, recursion all enforced [R3-S13] |
| Codex CLI | no agents at all | Not applicable; sandbox and approval are the only axes [R3-S11] |
| SWE-agent / mini | no agents at all | Not applicable [R3-S34] |
| This repository, before the collapse | 21 job titles | **No.** Ten had no file; eleven were routing shims [R3-R] |

**The precise finding.** Role-name decomposition is characteristic of the *authored multi-agent frameworks* and is essentially absent from the *coding harnesses*, which decompose by tool grant and context boundary and leave the name free. The population the founder is describing is real and is a majority of the framework population. It is not the population his own substrate belongs to. **Kind: already-evidenced, extended.**

### TC-16 — "Decomposing by human job title produces worse accepted outcomes, or more coordination cost, than decomposing by work, authority, tools, skills and context."

**Verdict: NOT ESTABLISHED, in either direction, and the two 2026 papers do not settle it because they test a different contrast.**

What the evidence does establish:

1. **Matched-budget comparisons remove much of the reported multi-agent advantage.** [R3-S25] gives a mechanism, the Data Processing Inequality over handoffs, plus a controlled study across three model families, and **predicts the boundary**: multi-agent becomes competitive when single-agent context utilisation degrades or when more compute is spent. [R3-S26] finds auto-generated multi-agent systems underperforming a single-agent baseline at up to ten times the cost.
2. **How you decompose dominates whether you decompose.** [R3-S26]'s expert-designed systems substantially outperformed auto-generated ones. That is the closest thing in the literature to the founder's distinction, and it is *not* the same distinction: expert-versus-generated is not title-versus-capability.
3. **No source in this set runs the test TC-16 names.** Nobody compares a role-named decomposition against a capability-named decomposition at matched executor count and matched capacity. **Unknown, and it is the central unknown of this lane.**

**What the contrary reading has.** MetaGPT [R3-S22] is a title-named decomposition with real routing and competitive reported scores. Its titles are load-bearing for *subscription*, which is a genuine coordination mechanism. A title can be a compression of a bundle of tools, context and acceptance criteria, and compressing that bundle into a familiar word is not automatically a defect. **Disagreement preserved, as L03 preserved it.**

**Kind: contested. Verdict: insufficient evidence.** The discriminating fixture named in the claims file, F-1's unknown job, remains the right probe and has not been run.

### TC-30 — "No executor exists because a human company has that department."

**Verdict: SUPPORTED as a founder constraint, and this lane can say something stronger than support. It is a constraint that an existing checker shape can enforce, and one live harness has already executed the enforcement once.**

1. **Founder constraint, restated by the directive.** DIRECTIVE §8.8 states *"Do not create agents merely to imitate human departments"* and leaves open whether human structures are useful for each kind of work. The constraint forbids a *reason*, not a *shape*.
2. **Direct observation of the constraint applied.** This repository ran the conformance check TC-30's measure describes and failed nine C-suite names, nine engineering titles and five reviewer titles, on the stated ground that each group was one procedure repeated per domain [R3-R, F61]. Seven survived on named engineering differences: state ownership and the human boundary; artifact isolation; a perception loop; read-only status; read-only plus no shell.
3. **The check is mechanisable and the mechanism is known.** Claude Code and Gemini CLI both make the justifying difference a *declared, client-enforced field*: tools, model, context isolation, turn limit, spawn rights [R3-S01, R3-S13]. A conformance check can therefore be written as "name the enforced field that differs" rather than as a prose review.
4. **The failure mode to guard is not the department name; it is the decorative field.** This repository deleted 44 `mcpServers` declarations backed by no configuration and 16 `budget:` blocks read by nothing [R3-R, F60]. **A roster that passes TC-30 by declaring a capability nothing enforces has satisfied negative control §4.8 in form and failed it in substance.** The pairing TC-30 needs is not "does it have a department name" but "does the declared difference bind", and F59 shows that even a real grant can narrow reliably while arriving unreliably.

**Kind: founder constraint. Verdict: supported, with the enforcement predicate named and the decorative-declaration loophole identified as the live risk.**

---

## 6. Assumptions · Unknowns · Competing interpretations

**Assumptions.** Vendor documentation describes intended mechanism and is weak evidence of deployed reliability. A benchmark score is a fact about one model, one harness version, one task set and one date. Mechanism transfer and framework adoption are separate decisions; nothing here evaluates adopting any framework. The repository's own harness is one instance, authored by models, never staffed by people.

**Unknowns.**

- Whether any published system decomposes by *acceptance owner* rather than by role or by capability. I found none. **Absence in this source set, not evidence of absence.**
- Whether skill-selection quality degrades measurably with library size. No source supplies a curve [R3-S04]. The founder's concern is real and unmeasured.
- Whether `tools:` in this repository's YAML-flow form binds at runtime [F58]. Documented as a filter by the vendor, recorded as unverified by the repository, with a one-call discriminating probe.
- Why an identical MCP grant delivered twenty-four tools on one date and zero on three dispatches two days later with configuration intact [F59]. **Cause unknown, and this is the most operationally consequential unknown in the set.**
- Tran and Kiela's configuration count and exact datasets. Secondary summaries disagree with the primary abstract on model families; I recorded the primary and discarded the rest [F50].
- Whether Gemini CLI's subagents are production-ready. Secondary reports say no; the primary document does not say [F19].
- Inngest's delivery semantics. Not stated on the page fetched [F43].

**Competing interpretations, preserved.**

1. **Isolation versus continuity.** Claude Code, Gemini CLI and the MAST literature treat a fresh context window as the point of a subagent. Cognition [R3-S24] and the Agents SDK default [R3-S14] treat full history sharing as the point. Both are coherent; they optimise against different failure modes, context exhaustion versus conflicting implicit decisions. **Nothing in this evidence resolves it, and a system may need both, chosen per work item.**
2. **Depth as a resource versus depth as a hazard.** Claude Code permits three layers, Gemini CLI permits none [F18]. Two vendors, opposite defaults, same year.
3. **Titles as compression versus titles as noise.** MetaGPT's subscribed roles route real messages; CrewAI's roles route nothing. **The word "role" means two different things across the framework population**, and TC-15 as worded cannot distinguish them.
4. **Scaffolding as necessary versus scaffolding as a model-generation artifact.** SWE-agent established that interface design matters; the same group's mini-SWE-agent deletes it and scores competitively [F38, F39]. L04's ablation lesson is confirmed and generalised.
5. **Durable execution as a solution versus durable execution as a relocation.** All four engines guarantee control flow and none guarantees the external effect [F44]. Temporal's ambiguous-completion case survives in every one of them.

---

## 7. Mechanisms that transfer · Mechanisms that do not transfer

**Transfer, each with the problem it solves.**

| Mechanism | Problem it solves | Source |
|---|---|---|
| Two orthogonal axes: capability by kernel, consent by client | "May it?" and "must it ask?" are different questions and a single permission field cannot express an unattended read-only verifier | R3-S11 |
| Subtractive, client-enforced tool filter with a fixed unremovable core | A worker cannot grant itself more than its parent held; §5 item 6's composite-grant question gets a default answer of "refused, not minted" | R3-S01, R3-S13 |
| A named, configurable delegation ceiling with defined behaviour at the limit | §5 item 7's "no delegation ceiling with an owner"; withholding the tool rather than erroring keeps work completing instead of failing | R3-S01 |
| State write as an appended event, never as direct mutation | Makes the audit trail and the state one artifact, so "what is true" and "how it became true" cannot disagree | R3-S16 |
| Single-writer concurrency keyed per entity | §5 item 8's "no writer authority on shared state"; last-writer-wins becomes structurally impossible rather than discouraged | R3-S29 |
| Human input as a typed node with its own checkpoint | Fixture F-6 needs "parked awaiting a person" to be an inspectable state, not a blocked process | R3-S17 |
| Declared checkpoint boundaries fixed by the framework | Recoverability becomes a structural property rather than a developer's discipline | R3-S17, R3-S28 |
| Completed-step memoization with a stated never-re-execute rule | Fixture F-5's already-released effect; the resumed attempt must not repeat it | R3-S28, R3-S30 |
| Explicit versioning or patching for code change with runs in flight | W9's probe exactly; the only surveyed answer that is neither "abandon" nor "silently re-run" | R3-S27 |
| Content-hash pinning of an instruction or tool description, re-checked at use | Rug pull and skill corruption after the skill passed its test, which W10 names | R3-S33 |
| Progressive scope elevation from a minimal baseline | Fixture F-3's three-permission task; the grant is assembled by escalation rather than held from the start | R3-S32 |
| Separating "instruction file" from "enforcement layer" and saying which is which in the documentation | Negative control §4.2: a shared source of truth nobody is forced to read | R3-S03, R3-S05 |
| Two-stage instruction loading, always-on index plus on-demand body | Keeps a growing library from taxing every unrelated task | R3-S04, R3-R |
| A fresh session running an end-to-end check before extending anything | Premature completion; the resumed attempt verifies rather than infers | R3-S08 |
| Recording a declaration's *binding status* beside the declaration | Decorative capability, found three times in one harness | R3-R, F57, F60 |

**Do not transfer, and why.**

| Mechanism | Why not |
|---|---|
| Default full-history handoff | Transfers the work and leaves the verification boundary behind; guardrails are scoped to first and last agent only [R3-S14] |
| Role, goal and backstory as the primary decomposition field | Prompt text with no enforced correlate; fails TC-30's admissibility check by construction [R3-S21] |
| A sequential SOP assembly line as the general work shape | Assumes upstream premises survive; market discovery, negotiation and wind-down repeatedly invalidate them [R3-S22] |
| Role-playing dialogue as a coordination protocol | Its own authors report role reversal, repeated instructions and promises without execution [L03, R3-S23] |
| A local workspace object as containment | A deployment parameter, not a boundary; the vendor does not claim otherwise [R3-S35] |
| Command-text permission rules as a security boundary | The vendor states they are not: a deny rule "isn't a security boundary around the program" [R3-S05] |
| A git worktree as an isolation boundary | Separates files, not processes, ports, databases or network effects [L04, S14] |
| A registry listing as a trust signal | Verifies namespace ownership and explicitly delegates all code and behaviour checking downstream [R3-S31] |
| Benchmark scores as evidence of company-operating competence | Every score in this report is bound to one model, one harness and one date |
| The 15× token figure as a planning constant | Vendor self-report on one task distribution, and the folklore most often repeated without its method [R3-S09] |
| "Use a single-threaded linear agent" as a conclusion | A position with a testable mechanism and no published measurement [R3-S24] |

---

## 8. Failure cases observed in these systems

1. **Premature completion.** A later session sees progress and declares the job done [R3-S08].
2. **Oversized attempt.** The agent tries to one-shot the work and exhausts context mid-implementation [R3-S08].
3. **Broken handover.** A new session has no memory and re-derives, badly [R3-S08].
4. **Agentic laziness, self-preferential bias, goal drift.** Named by the vendor as the reason for isolating context [R3-S10].
5. **Fan-out without a stopping rule.** Fifty subagents for a simple query; endless search for sources that do not exist [R3-S09].
6. **Subagents duplicating work and leaving gaps** when task descriptions are underspecified [R3-S09].
7. **Conflicting implicit decisions.** Parallel workers build against incompatible premises because neither can see the other [R3-S24].
8. **Node re-execution on resume duplicating a side effect** that ran before an interrupt [R3-S19]. **This is the one that can duplicate a payment while a human is approving it.**
9. **Interrupt index mismatch** after reordering or conditionally skipping an interrupt, causing resume failure [R3-S19].
10. **Silent state loss** from mutating a retrieved session state outside the event path [R3-S16].
11. **Silent fallback on resume** when a restore identifier is absent [L03, CrewAI flows].
12. **Non-determinism error** when workflow code changes under runs in flight [R3-S27].
13. **Ambiguous completion.** External effect succeeds, worker dies before reporting, activity retries; no engine solves it [L03, R3-S27].
14. **Tool poisoning.** Instructions in a tool description the model reads and the user does not [R3-S33].
15. **Rug pull.** Description changed after approval [R3-S33].
16. **Confused deputy, token passthrough, session hijacking, SSRF via OAuth discovery, local server compromise** [R3-S32].
17. **Fourteen MAST failure modes** across system design, inter-agent misalignment and verification, at kappa 0.88 [R3-S23].
18. **Guardrail scope gap.** Input guardrails on the first agent only, output guardrails on the last only [R3-S14].
19. **Decorative capability.** 44 MCP declarations backed by nothing; 16 budget blocks read by nothing; three of four workflow files invoked by nothing [R3-R].
20. **Unreliable grant delivery.** Identical configuration, twenty-four tools one day and zero on three dispatches two days later [R3-R].
21. **Two descriptions of one roster disagreeing.** The routing table records retired model identifiers and omits a live MCP grant [R3-R].
22. **A checker that does not walk the directory it is trusted to cover** [R3-R].

---

## 9. Implications for this system, bound to the fixed boundaries and the six fixtures

These are constraints the evidence places on any candidate. They are not recommendations and they choose nothing.

**Against the fixed boundaries.**

- **Consequence and release boundary.** Every surveyed authority mechanism that actually binds sits *outside the model*: kernel sandbox [R3-S11], client-enforced tool filter [R3-S01], hook exit code [R3-S02], per-key single writer [R3-S29]. Every mechanism that sits *inside the prompt* is documented by its own vendor as non-binding [R3-S03, R3-S05, R3-S21]. **A candidate that places the release boundary in an instruction file has placed it where two vendors say it does not hold.**
- **Evidence and acceptance.** No surveyed system has an acceptance owner concept. Every one of them terminates on *producer-declared completion*: a returned summary, a graph reaching END, a workflow returning. **This is a genuine gap in the field, not a gap in this survey**, and it means the acceptance boundary is the one part of the specification that cannot be imported from any of these systems.
- **Recovery.** Four engines converge on one contract, control flow guaranteed and effect not [F44]. A candidate's recovery story must therefore be about *effects*, since the control-flow half is a solved commodity.
- **Human responsibility.** Microsoft's typed request node is the only surveyed mechanism that makes "waiting for a person" a state rather than a stall [R3-S17].
- **Founder competence.** Nothing in this survey addresses it. Not one system measures whether its human operator can still judge the work. **Unknown across the entire field.**
- **Whole-company scope.** Every system surveyed is a software-construction or generic-orchestration system. Their benchmarks measure repository issues, desktop tasks, web tasks and multi-hop reasoning. **No evidence here bears on customs disputes, refunds, supplier commitments or wind-down**, and W11's narrowing risk is therefore a risk of *importing the evidence base*, not only of importing the vocabulary.

**Against the six fixtures.**

- **F-1, unknown job.** The only surveyed admission mechanisms are description matching [R3-S01, R3-S13] and dependency-gated subscription [R3-S22]. Both are closed-world: they route to an existing definition or they do not route. **Nothing in the survey refuses a job with a reason.** Negative control §4.9's router-that-admits-everything has no counterexample in the field.
- **F-2, demand at 4×.** Claude Code's concurrency limit is 20 and its spawn depth is 3 [R3-S01]; both are the kind of number F-2 must make binding. The matched-budget papers [R3-S25, R3-S26] mean **any fan-out advantage claimed at 4× must be measured against a single executor given the same total budget**, or it is the confound those papers identify. Negative control §4.7 is directly supported: token arithmetic alone would have been wrong in both papers.
- **F-3, three permissions.** Progressive elevation [R3-S32] is the surveyed answer to composition. Attenuation on delegation is documented [R3-S01] and observed [F59]. **Revocation mid-attempt appears in no surveyed system.** The nearest mechanism is LangGraph's interrupt, and it re-runs the node from the top [R3-S19].
- **F-4, verification the producer must not influence.** The Agents SDK scopes guardrails to first and last agent [R3-S14]; Codex separates a review path that reads a diff and does not touch the tree [L04, S6]; this repository removed write tools from both reviewer engines and states the reason [R3-R]. **None of these establishes statistically independent errors between producer and checker**, which L04 already flagged and which one model family cannot supply.
- **F-5, handoff across a capacity reset.** This is the best-evidenced fixture in the survey and the news is bad. Compaction replaces the conversation with a summary and the documentation records no manifest of what was dropped [R3-S06]. The three harness failures [R3-S08] are all reset failures. The cure that was found was **artifact-based**: a progress file, a pass-or-fail feature list, a commit, and a fresh session running an end-to-end check before extending. **Negative control §4.5's manifest-without-omissions is not a hypothetical; it is what every surveyed system currently emits.**
- **F-6, founder absent.** Nothing in the survey covers it. The closest mechanism is a typed request node that parks [R3-S17]. No surveyed system has a latest-responsible-decision-time concept, a queue rule for decisions only a principal may take, or a re-entry brief.

**Against the simple baseline B0.** [R3-S25], [R3-S26] and [R3-S34] together give B0 more support than any source gives the multi-agent position: a hundred-line single-tool linear agent scores competitively, matched budgets erase most reported multi-agent gains, and auto-generated decomposition loses to a single-agent baseline at ten times the cost. **The honest reading is narrower than that sounds.** [R3-S25] names the exact conditions under which decomposition wins, degraded single-agent context utilisation or additional compute, and those are the conditions fixtures F-2 and F-5 construct on purpose. **The evidence does not favour B0 in general. It removes the presumption that a larger structure needs no defence, and it names what the defence has to show.**

---

## 10. Questions other lanes may have missed

1. **Who is accountable for a piece of work between the moment a producer declares it done and the moment an acceptance owner accepts it?** Every surveyed system terminates at producer-declared completion. This interval exists in none of them and exists in every business obligation.
2. **What is the system's answer when an instruction file and an enforcement rule disagree?** Two vendors document the gap and neither documents a reconciliation. This repository has a live instance: `AGENTS.md` records model identifiers the agent files contradict [F56].
3. **Is delegation depth a policy, a resource limit, or a safety property?** Claude Code treats it as configuration, Gemini CLI as an invariant [F18]. The answer determines who may change it and whether changing it is a self-modification requiring review.
4. **Can a grant be observed to have arrived, as distinct from having been declared?** F59 records a case where it did not, with configuration intact and cause unknown. **If a permission can be silently absent, then a task that silently does less looks identical to a task that was correctly scoped.**
5. **Does approving a tool at install time approve the text the model will read at call time?** The registry binds a name to an owner and not to a description [F48]. Rug pull makes those different objects.
6. **Which harness mechanisms carry a removal test?** SWE-agent to mini-SWE-agent is the field's clearest instance of scaffolding outliving its reason [F39]. L03 asked this and nothing has answered it. **A mechanism with no removal criterion is a permanent tax, and protocol W9 makes this a failure condition.**
7. **What is the unit of capacity when the provider bills a subscription?** Every economic figure in this survey is a token count. No surveyed system models a reset window, a weekly cap or a concurrency ceiling, and one vendor explicitly prohibits building a product on subscription authentication [R3-S09 licensing note]. **Negative control §4.7 has no counterexample in the field either.**
8. **If the summary of a run is the only thing that survives it, what carries the omissions?** Compaction, subagent return, and handoff input filters are three different lossy transforms in one substrate, and none of the three emits a record of what it dropped.
9. **Does anything in the surveyed field measure whether its human operator is still competent?** I found nothing. This is the one dimension of the directive with no external evidence base at all.
10. **Is "role" one concept or two?** MetaGPT's roles route messages; CrewAI's roles are prose. TC-15 and TC-16 are both stated over a word that means different things in the two systems most often cited for them.

---

**Findings not registered in the claim ledger.** `mcp__claim-append__append_claim` is absent from this session's tools, so six durable findings could not be appended. They are, with proposed expiries: the Claude Code subagent tool-filter and depth semantics, `valid_until` 2026-12-13; the Codex two-axis sandbox and approval model, 2026-12-13; the LangGraph interrupt re-execution rule, 2026-12-13; Tran and Kiela's matched-budget result with its stated boundary condition, 2027-04-11; the MCP Registry's explicit delegation of security scanning, at general availability; and this repository's grant-delivery asymmetry, 2026-12-13. **Whoever has the tool should append them; whoever reads this should treat them as unregistered until then.**

**Standing caveat.** No runtime was executed for this lane. Every statement above about an external system is about documented or published behaviour, read once, on 2026-09-13, by one model instance of one family, with procedural independence only.