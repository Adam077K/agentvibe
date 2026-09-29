**Lane 03 — Agent and workflow architectures**

**Status:** COMPLETE for the bounded research question. No repository files changed; no claims appended to the repository ledger. This report evaluates mechanisms and evidence without selecting a final architecture.

**Decision informed:** Which control, execution, communication, and persistence mechanisms could support the complete company lifecycle while preserving intent, truthful accounting, bounded authority, and owner competence?

All sources below were accessed **2026-09-12**. “Source claim” means the source describes the behavior; it does not mean this lane independently executed or benchmarked it. Confidence is **high** in the reported documentation or paper content, **medium** in transferability, and **unknown** in whole-company effectiveness unless stated otherwise.

**Findings**

1. **OpenAI Agents SDK: distinguish delegation from consultation.**  
   **Source claim:** The SDK provides two different arrangements: handoffs transfer conversational control to another agent; agents exposed as tools keep a manager responsible for the response. Guardrails validate inputs, outputs, or tool behavior, while approval mechanisms pause consequential calls. Its actual problem is composing model/tool applications with legible control ownership. Its assumptions include executable tool interfaces and an application supplying domain policy. **Inference:** The transferable distinction is between assigning responsibility and requesting bounded assistance. Calling something a specialist does not establish its authority, and a generated final response does not establish that an external effect occurred. The inspected documentation demonstrates APIs and examples, not longitudinal business reliability. [Orchestration](https://developers.openai.com/api/docs/guides/agents/orchestration), [guardrails and review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals).

2. **OpenAI Swarm: a deliberately small instructional model.**  
   **Source claim:** Swarm centers on instructions, tools, and handoffs. It is client-side and stateless between calls; its repository identifies it as educational and superseded by the Agents SDK. Its actual problem was exploring understandable multi-agent coordination, particularly where one prompt cannot conveniently describe all capabilities. **Inference:** Small coordination primitives remain useful comparative evidence. Statelessness would leave recovery, retained intent, commitments, and outcome reconciliation to another component. Swarm’s examples provide inspectable mechanism demonstrations; its “scalable” description is not evidence that this design operates an organization. Treating this historical repository as a current production recommendation would misread its explicit status. [Swarm repository](https://github.com/openai/swarm).

3. **Anthropic’s patterns: allocate control according to task structure.**  
   **Source claim:** Anthropic distinguishes predefined workflows from agents whose models dynamically choose their processes and tools. Its December 2024 account describes chaining, routing, parallelization, orchestrator/worker, and evaluator/optimizer patterns, and reports that simpler compositions often worked well for customers. **Inference:** These are control choices, not departments or organizational roles. Fixed checks fit stable procedures; discovery may need dynamic branching. The evidence is practitioner experience with illustrative implementations, not a randomized comparison proving universal superiority. The article now warns that its tooling discussion has aged. Its useful transfer is the diagnostic question—what requires runtime judgment?—rather than copying its catalog as a mandatory architecture. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).

4. **Anthropic Managed Agents: separate what must survive from replaceable execution.**  
   **Source claim:** The April 2026 architecture separates an append-only session, the model/tool harness, and execution sandboxes. Anthropic describes failures of an earlier coupled container, keeping credentials outside generated-code environments, and reconstructing a failed harness from stored events. It also reports that a context-reset intervention useful for one model became unnecessary for another. **Inference:** Durable records and replaceable workers solve different problems; harness interventions need expiration tests. This is concrete vendor engineering experience, stronger than an unsupported feature slogan but not an independent security audit. It does not establish business authorization, complete evidence semantics, or owner competence. Its hosted service model also differs from subscription coding environments. [Managed Agents architecture](https://www.anthropic.com/engineering/managed-agents).

5. **Google ADK: heterogeneous execution within one composition model.**  
   **Source claim:** Current ADK documentation defines agents around a model, instructions, and optional tools. It supports graph workflows mixing agents and deterministic nodes, programmatic dynamic workflows, coordinating agents, and fixed sequential, loop, or parallel templates. Its stated motivation includes managing context limits, instruction complexity, and modularity. **Inference:** Its transferable mechanism is allowing code and judgment to coexist without forcing every executable unit to be an autonomous agent. Decomposition may reduce context pressure but introduce information-loss and coordination boundaries. The inspected pages establish supported composition styles, not which style performs best for customer research, hiring, finance, or wind-down. Those allocations remain application decisions. [Agents](https://adk.dev/agents/), [workflows](https://adk.dev/workflows/).

6. **Microsoft Agent Framework: enterprise application plumbing with explicit execution paths.**  
   **Source claim:** Microsoft describes agents, an opinionated harness, functional/graph workflows, sessions, context providers, middleware, telemetry, and integrations. It identifies Agent Framework as successor to AutoGen and Semantic Kernel. The documentation explicitly says ordinary functions should handle tasks that can be implemented as functions and assigns application-specific safety, reliability, and data-boundary responsibilities to developers. **Inference:** Interception points and explicit paths are useful enforcement locations; enterprise branding does not supply a company’s policy. Provider integration support does not prove equivalent behavior across providers. Evidence here is current documentation and examples, with no independent whole-system evaluation located. The page was updated August 25, 2026. [Agent Framework overview](https://learn.microsoft.com/en-us/agent-framework/overview/).

7. **AutoGen: messages and execution ownership are separable.**  
   **Source claim:** AutoGen Core describes runtimes that manage agent identities, lifecycles, and communication, with standalone and distributed implementations. Its distributed arrangement separates a host service from workers. The original research treats programmable conversations among models, tools, and people as application structure and reports evaluations across several example domains. **Inference:** Message transport and worker lifecycle are reusable mechanisms without inheriting “conversation” as the source of business truth. Distribution introduces delivery, authorization, and recovery obligations that conversational quality cannot discharge. Original-paper results support the tested applications and contemporary models, not today’s Agent Framework or unattended company operation. [Runtime architecture](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/core-concepts/architecture.html), [original paper](https://arxiv.org/abs/2308.08155).

8. **LangGraph: execution state and cross-run knowledge have different scopes.**  
   **Source claim:** LangGraph presents itself as a low-level orchestration runtime. Checkpointers retain thread-scoped graph state; stores retain application-defined information across threads. Its documentation warns that in-memory checkpoints disappear on restart, checkpoint accumulation has costs, and subgraph state does not automatically behave as shared parent state. **Inference:** These distinctions are transferable to any implementation. A persisted conversation is not automatically vetted organizational knowledge, and “persistence enabled” is insufficient without naming storage and failure semantics. The inspected documentation establishes primitives and documented pitfalls, not the accuracy of stored beliefs or adequacy of a business audit trail. [Overview](https://docs.langchain.com/oss/python/langgraph/overview), [persistence](https://docs.langchain.com/oss/python/langgraph/persistence).

9. **CrewAI: task collaboration and event-driven flows are distinct offerings.**  
   **Source claim:** Crews group agents and tasks under sequential or hierarchical processes. Flows provide stateful orchestration and persistence, with SQLite as the documented default. The versioned flow documentation distinguishes resuming from forking state and explicitly states that an absent restore identifier can fall back silently. Crew configuration can also load executable local Python. **Inference:** Stateful flows may be useful without adopting role backstories or manager hierarchies. Recovery needs identity validation, and configuration is potentially executable code. Documentation and examples substantiate mechanics; no independent comparative business-outcome evidence was located. The silent-fallback behavior is a concrete case for testing “resume” rather than trusting its label. [Crews](https://docs.crewai.com/v1.15.21/en/concepts/crews), [flows](https://docs.crewai.com/v1.15.21/en/concepts/flows).

10. **MetaGPT: structured deliverables reduce one kind of communication ambiguity.**  
    **Source claim:** MetaGPT encodes software-development SOPs using specialized roles, a shared message environment, structured documents, and execution feedback. Its paper compares collaborative software-engineering outputs with earlier approaches. **Inference:** Typed intermediate deliverables and executable checks transfer more broadly than the particular product-manager/architect/engineer assembly line. That assembly line assumes requirements can become a sequential production process; market discovery and negotiation may repeatedly invalidate upstream premises. The paper provides empirical software-task evidence, not proof that simulated company roles operate a real company. Its claim that structured documents prevent missing information is stronger than what a schema alone guarantees. [MetaGPT paper, version 7](https://arxiv.org/html/2308.00352v7).

11. **CAMEL: cooperation experiments reveal protocol failures.**  
    **Source claim:** CAMEL studies autonomous role-playing cooperation and synthetic data generation. It reports role reversal, repeated instructions, promises without execution, and conversations that continue without progress. Its task comparisons use human preferences and GPT-4 evaluation of summarized solutions against a single-shot baseline. **Inference:** Explicit termination conditions and failure taxonomies are useful. Role-playing is not evidence of organizational competence. The evaluation is not a matched-budget test of modern single-agent versus multi-agent execution, and judging a summarized answer does not verify its real-world effects. Its research contribution is informative even where its performance comparison does not transfer. [CAMEL paper, version 2](https://arxiv.org/html/2303.17760v2).

12. **Temporal: a non-agent control model exposes the limits of durability.**  
    **Source claim:** Temporal executes durable workflow functions using recorded event histories and replay, with external work performed as activities. Its activity documentation describes the ambiguous-completion case: an external effect succeeds, but a worker fails before reporting completion, so the activity is retried. Idempotency must be implemented with the target service; a business-level duplicate need not produce a Temporal error. **Inference:** Durable continuation cannot itself guarantee one external effect or a correct business result. The transferable mechanism is deterministic control around fallible operations, with explicit reconciliation. Temporal assumes developers can define workflow semantics and manage replay compatibility. It does not discover company strategy or judge whether a commitment should exist. [Workflow execution](https://docs.temporal.io/workflow-execution), [activity semantics](https://docs.temporal.io/activity-definition).

**Cross-system evidence**

**Source claim:** MAST’s current paper reports more than 1,600 annotated traces across seven frameworks and 14 failure modes spanning system design, inter-agent misalignment, and verification. Its taxonomy development used expert annotation of 150 traces. **Inference:** This provides empirical counterweight to framework success examples, but its sampled tasks and older models do not establish current universal failure rates. Search results still surfaced earlier-version counts; the current paper supersedes those counts. [MAST, version 3](https://arxiv.org/abs/2503.13657v3).

**Assumptions**

- Business objectives, commitments, and approved constraints must remain meaningful after an execution framework is replaced.
- Some tasks have mechanically checkable outputs; others require delayed customer, human, or market evidence.
- Documentation describes intended interfaces, not a complete tested account of deployed behavior.
- Framework adoption and framework-inspired mechanisms are separate choices.

These are research assumptions, not established implementation decisions.

**Unknowns and gaps**

No inspected source establishes longitudinal preservation of founder intent, owner competence, or truthful accountability across an entire company lifecycle. This is a gap in this source set, not evidence that no such study exists.

Exact subscription-environment compatibility, account authorization, capacity exposure, and unattended execution rights were not established by these framework sources. Neither were comparative operating costs under the founders’ subscription assumptions.

Production security properties, dependency provenance, cancellation races, and crash recovery require source inspection and executable tests against pinned releases. No frameworks were installed or run in this lane.

**Competing interpretations**

- **Workflow interpretation:** Stable business obligations favor explicit transitions and predictable control. **Competing inference:** Predetermining transitions can encode a false understanding of unfamiliar work.
- **Agent interpretation:** Dynamic delegation accommodates tasks that cannot be specified in advance. **Competing inference:** It increases coordination and verification obligations and can obscure responsibility.
- **Conversation interpretation:** Flexible communication is a general coordination interface. **Competing inference:** Human-readable dialogue is an unreliable transaction boundary.
- **Organization interpretation:** Human roles package useful expertise. **Competing inference:** Roles may carry irrelevant social structure; capability-specific contracts can preserve expertise without simulating departments.

The evidence does not justify resolving these into one universal pattern.

**Useful mechanisms and rejected extrapolations**

Potentially useful mechanisms include bounded delegation, typed handoffs, separate thread state and organizational knowledge, durable event histories, replaceable workers, external credential brokers, explicit completion predicates, and target-enforced idempotency.

The evidence does **not** justify these extrapolations:

- More agents necessarily improve outcomes.
- Role titles establish authority or evaluation independence.
- A checkpoint proves recovery.
- A trace proves truth.
- A schema proves completeness.
- A guardrail provides an unbypassable authorization boundary.
- A coding benchmark establishes company-operating competence.

These reject unsupported conclusions, not entire frameworks.

**Failure cases and implications**

**Inference:** Candidate architectures must explain what happens when a refund succeeds but its acknowledgement is lost; a restored run references missing state; a handoff omits a rejected alternative; two workers act on inconsistent commitments; or a competent-looking summary hides unsuccessful attempts. Each case crosses more than one framework primitive.

**Design proposal for later evaluation, not a selected architecture:** Compare candidates using the same scenarios, including owner absence, contradictory customer evidence, revoked authorization, provider interruption, and a process crash immediately after an external effect. Record correctness, retained intent, recoverability, unauthorized consequence, and owner attention separately.

**Hypothesis:** The durable unit of accountability may need to be a commitment or proposed effect rather than an agent or conversation. Evidence here motivates testing that possibility; it does not establish the answer.

**Questions other lanes may miss**

1. Who may declare an external effect absent when its acknowledgement is missing?
2. Does changing a goal invalidate queued actions, approvals, context, or all three?
3. Can a human understand which evidence a handoff omitted?
4. How does shutdown preserve obligations that survive the project?
5. Which harness interventions have explicit removal tests after model changes?
6. Can an execution adapter be replaced without rewriting the business’s authoritative history?

**Source provenance and freshness**

The linked pages above form the source index. OpenAI, Anthropic, Google, Microsoft, LangChain, CrewAI, and Temporal documentation are **primary vendor sources** with commercial incentives; their descriptions are strong evidence of intended mechanisms and weak evidence of comparative superiority.

Dated primary sources: Anthropic patterns **2024-12-19**; Anthropic Managed Agents **2026-04-08**; Microsoft overview updated **2026-08-25**; AutoGen paper revised **2023-10-03**; MetaGPT v7 **2024-11-01**; CAMEL v2 **2023-11-02**; MAST v3 **2025-10-26**. Other inspected documentation exposed no publication date; CrewAI exposed version **1.15.21**.

Framework-specific capability claims should be revalidated by **2026-10-12**, and before implementation against pinned versions. Historical paper descriptions remain attributable to their versions; performance transfer is invalidated by material changes in models, tasks, budgets, evaluators, or implementation. Cross-source agreement supports separating deterministic execution from model judgment, while no shared benchmark here establishes a winning architecture.
