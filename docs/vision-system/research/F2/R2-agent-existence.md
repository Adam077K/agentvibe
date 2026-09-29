> Archival provenance — 2026-09-13: Lane R2 (When does an agent earn its existence) report for the F2 round, preserved verbatim. Subject package at `ffeba9c` (Step 0 committed; protocol frozen at `26af5d5`). The lane was formed blind: it read only the files named in its brief and no other lane's output. The return channel truncates at about 4,000 characters and drops drains over 16,000, so the report was **extracted in full from the sourcer engine's own session transcript** (the harness's record of the agent's final text block, 44,577 characters) rather than assembled from chunked resends; chunks that had already arrived were compared against the extracted text and matched verbatim. No edits were made. The lane shares a model family with every other lane and reviewer in this round; independence is procedural only. Archival is not acceptance of any finding.

# 1. Provenance header

**Lane:** R2 — When does an agent earn its existence. **Date:** 2026-09-13. **Status:** COMPLETE for the bounded question, with two named gaps (§5) and one capability I did not have (below).

**Independent formation.** I read, in the order given: `inputs/FOUNDER-THESIS-2026-09-13-agents.md`; `planning/F2/00-acceptance-protocol.md` §7 and §3 (and §1, §2, §4, §5, §6, §8 for context, since §7's rules are unreadable without §5's class definitions); `planning/F2/00-thesis-claims.json`, from which I took only the ten claims whose `lane` is `R2`; `research/L03-architectures.md`; `research/L13-contrarian.md`; `research/cross-lane-comparison.json` axis X03; `planning/specification/05-work-agents-skills.md` (whole, since §4 and §5 depend on §1 and §9); `planning/specification/07-integrations-capacity.md` §5–§6; `inputs/DIRECTIVE.md` §6, §8.7, §8.8. **I read no other lane's output.** I did not read any F2 candidate, review, or session file. All web sources were accessed 2026-09-13.

**Model-family disclosure.** I am Claude Opus 5, Anthropic. Five of my thirty sources are Anthropic's own engineering and product documentation (S01, S02, S03, S04, S05). That is a double conflict: vendor self-report, and a vendor I share a model family with. Every claim resting on those five is marked conflicted in §3 and is corroborated by a non-Anthropic source wherever one exists. Where none exists I say so rather than letting the vendor figure stand alone, per protocol §7.

**Capability I did not have.** `mcp__claim-append__append_claim` is **not present in this session's toolset**. I could not register any durable claim in the ledger. Nothing in §2 was refused by a resolver; the mechanism was simply absent. Eight findings below are `valid_until`-bearing and therefore belong in the ledger; I name them in §8 so that an agent holding the tool can register them. `claims_emitted: []`.

**Neutrality.** Per protocol §1, this lane earns nothing by agreeing with the founder and nothing by contradicting him. Three of his five criteria come out weaker than he states them, one comes out stronger, and two of his four costs come out pointed at a different target than he aims them. That distribution is the result, not a posture.

---

# 2. Findings

Each finding carries a DIRECTIVE §6 kind. Source ids resolve in §3.

**F-01. SOURCE CLAIM (conflicted, uncorroborated method).** The most-cited multi-agent cost figure in circulation has no published method. Anthropic states that "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens as chats" [S01, 2025-06-13]. No task distribution, no denominator, no reproduction procedure is given. Under protocol §7 this is a **source claim, not a measurement**, and it is a vendor self-report about the vendor's own architecture. It has propagated widely; repetition has not upgraded it. Do not cite `15×` as measured.

**F-02. SOURCE CLAIM (primary, independent, recent).** An independent evaluation reports the opposite sign of benefit at a comparable cost multiple. "Across traditional reasoning datasets and tasks with interactive multi-step workflows (e.g., BrowseComp-Plus), we demonstrate that automatic MAS consistently underperform CoT-SC despite being up to 10x more expensive" [S15, 2026-06-11, GPT-4o / GPT-5 / GPT-OSS-120B / Gemini-2.5-Pro]. Their diagnosis is architectural, not fundamental: automated design "produces architectural bloat that prioritizes superficial complexity which does not translate into functional utility."

**F-03. SOURCE CLAIM (primary) + INFERENCE.** The same paper supplies the strongest evidence *for* two of the founder's criteria, and it is easy to miss because it sits inside a paper whose title reads as a refutation. On their synthetic diagnostic built with explicit task decomposition and context separation, an **expert-designed** multi-agent system reached 96.5% on GPT-5 against 57.0% for the single-agent CoT-SC baseline [S15]. **INFERENCE:** what failed in F-02 was *automatically generated* structure, and what succeeded here was structure that *enforces* context separation and decomposition. The discriminator is not agent count. It is whether the separation is enforced by construction or merely described in prompts. This is the single most decision-relevant result I found for this round.

**F-04. SOURCE CLAIM (primary, independent).** Handoff loss is real, measured, and aimed at a different target than the founder names. On the BOUND-Handoff testbed, under a 25-word compression budget, **operational-fact survival stayed near 0.97–0.98 while boundary-marker survival fell to roughly 0.57 (GPT-5-mini) and 0.58 (DeepSeek-R1-32B)** [S27, 2026-08-29, 36 scenarios across seven domains, 180 stratified handoffs per model]. Vague constraint language ("use discretion") leaked protected information in **73% of GPT cases and 50% of DeepSeek cases, against under 15% with explicit constraints**. A gold-derived typed allowlist reduced leakage to **0 of 48** cases. The authors conclude that "boundary information should therefore travel as typed, machine-actionable constraints rather than natural-language sentiment."

**F-05. INFERENCE from F-04, high consequence for this package.** TC-01's proposed recall probe seeds "an exclusion, a deadline, a promised remedy, a rejected alternative, a unit." Four of those five are **boundary metadata**, not operational facts. F-04 predicts the probe will show near-total survival of the unit and near-half survival of the exclusion and the promised remedy. If the probe reports a single aggregate "facts lost per handoff" it will average a 0.97 and a 0.57 into a number that describes neither. **The measure must be stratified into facts and constraints or it will not discriminate.**

**F-06. SOURCE CLAIM (primary) + INFERENCE.** Parallel splitting pays or costs depending on the dependency structure of the work, and the sign flips. Co-Coder reports, on 2,828 real coding tasks with GPT-5-mini held uniform across baselines, pass-rate gains of 11.3 points on DevEval (56.8% to 68.1%) and 14.0 points on CodeProjectEval (20.1% to 34.1%), with 1.81× and 2.10× wall-clock speedup and 28% and 35% cost reduction, **when tightly coupled files are assigned to the same agent** [S28, 2026-05-31]. "On high-dependency projects, poor parallelization actually degrades both speed and quality." Their baselines included Claude Code with Agent Teams. **INFERENCE:** "parallel work" is not a property of a job. It is a property of a *partition* of a job, and the same job admits good and bad partitions. A criterion that licenses an executor because work "can be parallelized" licenses the bad partition too.

**F-07. SOURCE CLAIM (conflicted, vendor).** Anthropic's own account agrees on the conditionality and names the exclusion. Multi-agent excels at "breadth-first queries that involve pursuing multiple independent directions simultaneously," and underperforms in domains requiring "all agents to share the same context or involve many dependencies between agents," with coding named because "most coding tasks involve fewer truly parallelizable tasks than research" [S01]. Parallel spawning of 3-5 subagents "cut research time by up to 90% for complex queries." Early failure mode: agents spawned "50 subagents for simple queries."

**F-08. FACT (documented mechanism) + INFERENCE, decisive for this system.** In the Claude Code harness, the subagent boundary attenuates authority and the skill boundary does not. Subagents: "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions," with tools set as an allowlist or denylist [S02]. Skills: the `allowed-tools` field "grants permission for the listed tools during the turn that invokes the skill," and "**It does not restrict which tools are available**: every tool remains callable," and "**A skill can grant itself broad tool access**, so review the `allowed-tools` of skills checked into a repository before you run Claude Code there" [S03]. **INFERENCE:** the current position's substitution of "general executor plus versioned skill" for a specialist agent is sound for *knowledge* and **unsound for *authority*** in at least this harness. `05-work-agents-skills.md` §8 specifies that "a prose package cannot install, contact, spend or execute by being loaded." That specification is correct as a design intent and **false as a description of one real runtime the system plans to launch** (`N-CLAUDE-*` profiles, `07` §5). The gap must be closed by the launcher, not assumed.

**F-09. SOURCE CLAIM (primary, independent, two sources).** Permission and provenance separation is the one criterion whose benefit is enforced outside the model, and its cost is measured. CaMeL separates trusted control flow from untrusted data so that "the untrusted data retrieved by the LLM can never impact the program flow," enforcing capability-based policies at tool call time; on AgentDojo it solves **77% of tasks with provable security against 84% undefended** [S20, 2025-03-24, Google DeepMind and ETH Zurich]. A companion pattern catalogue states the shared principle: "once an LLM agent has ingested untrusted input, it must be constrained so that it is *impossible* for that input to trigger any consequential actions," naming six patterns including Dual LLM and Context-Minimization [S21, 2025-06-10]. **The 7-point gap is the measured price of the boundary.** It is a utility cost, not a token cost, and no other criterion in the founder's five has a comparable published price.

**F-10. SOURCE CLAIM (primary, independent) + DISAGREEMENT PRESERVED.** Evidence on whether specialized *identity* helps is genuinely split, and the split resolves on a definition. Against: across 4 LLM families, 2,410 factual questions and 162 social roles, "adding personas in system prompts does not improve model performance" over no persona, and selecting the best persona per question performs "no better than random selection" [S12, EMNLP Findings 2024]. Also against: a 2026 study of 208 runs and 13,786 coded messages across seven heterogeneous models finds distinct behavioral profiles emerge from a two-line identity-and-peers prompt with **no role directives at all** [S14, 2026-03-11, single independent author, non-peer-reviewed]. For: ChatDev's ablation reports that "the most substantial impact on performance occurs when the roles of all agents are removed from their system prompts," with Quality falling from 0.3953 to 0.2212 [S13]. **The reconciliation:** S12 removes a *label*; S13 removes a *label plus its procedural content* ("prefer GUI design", "careful reviewer for bug detection"). Both results are consistent with: procedural content carries the benefit, the job title carries none. Neither study isolates the two, so this reconciliation is an **INFERENCE, not a measured decomposition**, and it is the cleanest experiment nobody has run.

**F-11. SOURCE CLAIM (primary, independent).** A single agent with a strong prompt matches the best multi-agent discussion method on a wide range of reasoning tasks and backbones, and discussion beats a single agent "only when there is no demonstration in the prompt" [S10, ACL 2024]. **INFERENCE:** part of the measured multi-agent gain in the 2023-2024 literature is a *prompt-quality* gain misattributed to structure. This is the same confound `00-thesis-claims.json` preserves under TC-02 from L04.

**F-12. SOURCE CLAIM (primary, independent).** Multi-agent structure can also beat long context on the same task. Chain-of-Agents, assigning each worker a short context and aggregating through a manager, reports "significant improvements by up to 10% over strong baselines of RAG, Full-Context, and multi-agent LLMs" on question answering, summarization and code completion [S11, 2024-06-04, Google authors, conflicted]. Note its shape: **sequential, not parallel**, and its benefit is attributed to bounded per-agent context. This is direct evidence for the *isolated context* criterion and no evidence at all for the *parallel work* criterion.

**F-13. SOURCE CLAIM (primary).** Context loss is not a cost of multi-agent architecture specifically. It is a cost of any context transformation, including ones inside a single session. Across 18 models, "model performance degrades as input length increases, often in surprising and non-uniform ways" [S19, 2025-07-14]. Across more than 200,000 simulated conversations, sharding one instruction across turns produced "an average drop of 39% across six generation tasks," decomposing into "a minor loss in aptitude and a significant increase in unreliability" [S16, 2025-05-09]. Anthropic states of compaction that "overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later" [S04, 2025-09-29]. **The founder's fourth cost is therefore mis-assigned:** it is charged to agent separation and is owed by the single-context arm too.

**F-14. SOURCE CLAIM (primary, independent, three sources).** Independent verification is a requirement the evidence supports and a *separate executor* is not what discharges it. LLMs "struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction" [S23, ICLR 2024]. Evaluator models show "non-trivial accuracy at distinguishing themselves from other LLMs and humans" with "a linear correlation between self-recognition capability and the strength of self-preference bias" [S22, 2024-04-15]. And where a verifier has a non-zero false-positive rate, "resampling cannot decrease this probability, so it imposes an upper bound to the accuracy of resampling-based inference scaling, regardless of compute budget," with optimal attempt counts "often fewer than 10" [S24, revised 2026-03-26]. **INFERENCE:** the verifier's false-positive rate, not the verifier's separateness, is the binding quantity. This is exactly what protocol §4 control 3 and fixture F-4 test, and it is why "a second invocation" is not an answer.

**F-15. SOURCE CLAIM (primary, independent).** More executors is not monotonically better even under the friendliest possible aggregation. "The performance of both Vote and Filter-Vote can first increase but then decrease as a function of the number of LM calls," because more calls help easy queries and hurt hard ones in the same dataset [S17, 2024-03-04]. Against it, and preserved as disagreement: sampling-and-voting shows "the performance of large language models (LLMs) scales with the number of agents instantiated" [S18, TMLR]. The two are compatible only if the turning point sits beyond the range S18 swept. **A turning point is predicted by one primary source and denied by another; neither located it for agentic work.**

**F-16. SOURCE CLAIM (primary, independent).** Complexity is not free and the field's own measurements say so. MAST's opening sentence: "Despite enthusiasm for Multi-Agent LLM Systems (MAS), their performance gains on popular benchmarks are often minimal," supported by 1,600+ annotated traces across 7 frameworks, a 14-mode taxonomy built from 150 expert-annotated traces at kappa = 0.88 [S08, v3 2025-10-26]. Independently, "SOTA agents are needlessly complex and costly," and joint accuracy-cost optimization can "greatly reduce cost while maintaining accuracy" [S25, 2024-07-01]. And across 21,730 rollouts, 9 models and 9 benchmarks costing about $40,000, "higher reasoning effort reducing accuracy in the majority of runs" [S26, 2025-10-13].

**F-17. FACT (documented mechanism).** The delegation-versus-consultation distinction is implemented and named by a major vendor, and the two are not interchangeable. "Use handoffs when routing itself is part of the workflow and you want the chosen specialist to own the remainder of the current turn." "Use agents as tools when a specialist should help with a bounded subtask but should not take over the user-facing conversation." "Orchestrating via code makes tasks more deterministic and predictable, in terms of speed, cost and performance" [S06, S07]. **INFERENCE:** combining this with F-04, a handoff is the construct that discards boundary metadata, because it transfers *ownership of the turn* through a compressed artifact. Agents-as-tools keeps the obligation-holder in place. For work carrying obligations, the evidence points at consultation over handoff. The choice is the framer's; the evidence is mine.

**F-18. INFERENCE from this package's own specification, not from any external source. High consequence.** **The B0 comparator's "one long-context session" is not purchasable under this system's own launch contract.** `07-integrations-capacity.md` §5 proposes a native job default of "one launch, ≤360 s network window," "≤16 MiB emitted result/capture per job," and §6 fixes CP1 at "one native N job and one X job concurrently." A six-hour single context cannot run. Therefore **continuation across launches is mandatory in every arm**, and the boundary-metadata loss measured in F-04 is a cost this system pays even with exactly one agent. The founder's handoff cost is real here and is **not avoidable by refusing to split work**; it is avoidable only by typing what crosses the boundary.

**F-19. INFERENCE from the specification.** At CP1 the maximum concurrency is two, and the two slots are **not interchangeable**: one is native Claude, one is external. So "parallel work" as a reason to create an executor can be exercised at most once per work order, and the two parallel executors necessarily differ in provider, capability, quota bucket and disclosure scope. Under `07` §5 the Codex profile is additionally not yet admitted ("until then Claude supplied-input profile is the selected native execution route"). **The parallel-work criterion is close to unmeasurable as specified**, and F-2's 4× demand fixture cannot be run at all without a reviewed CapacityPlan revision.

**F-20. INFERENCE.** The founder's five criteria do not share a unit of justification, which is why TC-36 has no single answer:

| Criterion | The unit it actually predicates |
|---|---|
| Parallel work | a running **instance**, and only relative to a chosen partition |
| Distinct tools or permissions | a **permission scope**, which may outlive any instance |
| Isolated context | a **context boundary**, which is not the same object as an instance |
| Specialized knowledge | a **template or skill version**, not an identity |
| Independent verification | a **relation between two instances**, a property of neither alone |

`05` §4 already carries three of these units (`AgentTemplate`, `AgentInstance`, `ExecutionSelection`) where the thesis has one word. **A criterion evaluated against the wrong unit returns an undecidable answer**, which is what protocol §4 control 4 is hunting.

**F-21. INFERENCE.** Four candidate sixth reasons survive adversarial search against the five, in descending strength:

1. **Provenance of the input.** F-09's patterns separate executors because one of them *touched untrusted data*, not because it needs different tools. Collapsing this into "distinct permissions" loses the reason and keeps only the remedy.
2. **Provider, account or quota separation.** `07` §6 keeps "subscription entitlement, provider quota buckets, native-job launches" as separate units. An executor may exist because it spends a different bucket. None of the five names the account axis.
3. **Consequence class.** DIRECTIVE §1.5 sets supervision by possible consequence and reversibility. Drafting an internal note and drafting an outward customer promise can be identical in work, tools, skills and context and still require different performers. TC-17's own fixture predicts this, and it is the strongest leftover.
4. **Attributable identity for the record.** Fixture F-3 requires "the record of which identity performed which effect." That is a reason to separate identities even where capability is identical.

---

# 3. Source table

| id | URL | accessed | source date | type | P/S | confidence | conflict of interest | corroborated by | expiry | invalidator |
|---|---|---|---|---|---|---|---|---|---|---|
| S01 | anthropic.com/engineering/multi-agent-research-system | 2026-09-13 | 2025-06-13 | vendor engineering post | P | high on text, **low on the 15× as measurement** | Anthropic; my own family | S15 on cost order; nothing on method | 2026-12-13 | a published method, or a restated multiple |
| S02 | code.claude.com/docs/en/sub-agents | 2026-09-13 | undated, v2.1.x | vendor product docs | P | high | Anthropic; my own family | S03 | 2026-11-13 | a docs change to `tools`/`disallowedTools` semantics |
| S03 | code.claude.com/docs/en/skills | 2026-09-13 | undated, v2.1.260 cited | vendor product docs | P | high | Anthropic; my own family | none located | 2026-11-13 | `allowed-tools` becoming restrictive |
| S04 | anthropic.com/engineering/effective-context-engineering-for-ai-agents | 2026-09-13 | 2025-09-29 | vendor engineering post | P | high on text, medium on transfer | Anthropic; my own family | S19 on context rot | 2026-12-13 | a measured compaction-loss study |
| S05 | anthropic.com/engineering/building-effective-agents | 2026-09-13 | 2024-12-19 | vendor engineering post | P | high on text | Anthropic; my own family | S25, S15 | already aged by its own notice | — |
| S06 | openai.github.io/openai-agents-python/multi_agent/ | 2026-09-13 | undated | vendor SDK docs | P | high on mechanism | OpenAI | S07 | 2026-12-13 | SDK API change |
| S07 | openai.github.io/openai-agents-python/tools/ | 2026-09-13 | undated | vendor SDK docs | P | high on mechanism | OpenAI | S06 | 2026-12-13 | SDK API change |
| S08 | arxiv.org/abs/2503.13657v3 | 2026-09-13 | v3 2025-10-26 | research paper | P | high | authors advocate taxonomy | S15, S25 | 2027-03-13 | newer models changing the mode distribution |
| S09 | cognition.com/blog/dont-build-multi-agents | 2026-09-13 | 2025-06-12 | practitioner essay | P as testimony | **folklore, not measurement** | vendor of a single-threaded product | S27 on mechanism | n/a | — |
| S10 | arxiv.org/abs/2402.18272 | 2026-09-13 | 2024-02-28, ACL 2024 | research paper | P | high on result, **generation-bound** | none apparent | S15 | 2026-12-13 | replication on 2026 models |
| S11 | arxiv.org/abs/2406.02818 | 2026-09-13 | 2024-06-04, NeurIPS | research paper | P | medium-high, generation-bound | Google authors on own method | S15 expert-MAS result | 2026-12-13 | replication at 1M context |
| S12 | aclanthology.org/2024.findings-emnlp.888 · arxiv 2311.10054 | 2026-09-13 | EMNLP Findings 2024 | research paper | P | high | none apparent | S14 | 2027-03-13 | a persona study on agentic, not factual, tasks |
| S13 | arxiv.org/html/2307.07924v5 | 2026-09-13 | 2023-07, ACL 2024 | research paper | P | medium; GPT-3.5 era | authors evaluate own system | contradicted by S12 on labels | **expired for transfer** | already superseded by generation |
| S14 | arxiv.org/html/2604.00026 | 2026-09-13 | 2026-03-11 | preprint, single independent author | P | **low-medium, not peer reviewed** | none declared | S12 | 2027-03-13 | peer review or failed replication |
| S15 | arxiv.org/abs/2606.13003 | 2026-09-13 | 2026-06-11 | preprint | P | medium-high | authors propose the critique | S08, S17, S25 | 2027-03-13 | peer review outcome |
| S16 | arxiv.org/abs/2505.06120 | 2026-09-13 | 2025-05-09 | research paper | P | high | Microsoft/Salesforce authors | S19 | 2026-12-13 | replication on 2026 models |
| S17 | arxiv.org/abs/2403.02419 | 2026-09-13 | 2024-03-04 | research paper | P | high on the analytic result | none apparent | contradicted by S18 | 2027-03-13 | a sweep locating the turning point |
| S18 | arxiv.org/abs/2402.05120 | 2026-09-13 | 2024-02-03, TMLR | research paper | P | medium | Tencent authors on own method | contradicted by S17 | 2027-03-13 | agentic (not QA) replication |
| S19 | trychroma.com/research/context-rot | 2026-09-13 | 2025-07-14 | vendor research report | P | medium-high | Chroma sells retrieval | S04, S16 | 2026-12-13 | a 2026-model replication |
| S20 | arxiv.org/abs/2503.18813 | 2026-09-13 | 2025-03-24, rev 2025-06-24 | research paper | P | high | Google DeepMind on own system | S21 | 2027-03-13 | an AgentDojo successor benchmark |
| S21 | arxiv.org/abs/2506.08837 | 2026-09-13 | 2025-06-10, rev 2025-06-27 | research paper | P | high on patterns | industry consortium of authors | S20 | 2027-03-13 | a demonstrated bypass of a pattern |
| S22 | arxiv.org/abs/2404.13076 | 2026-09-13 | 2024-04-15 | research paper | P | high | none apparent | S23, S24 | 2027-03-13 | replication on 2026 judges |
| S23 | arxiv.org/abs/2310.01798 | 2026-09-13 | 2023-10-03, rev 2024-03-14, ICLR 2024 | research paper | P | high, **generation-bound** | Google authors | S24 | **at risk of expiry**; re-test on reasoning models | a 2026-model self-correction result |
| S24 | arxiv.org/abs/2411.17501 | 2026-09-13 | 2024-11-26, rev 2026-03-26 | research paper | P | high; analytic | none apparent | S22 | 2027-03-13 | a verifier with a provably zero FP rate |
| S25 | arxiv.org/abs/2407.01502 | 2026-09-13 | 2024-07-01 | research paper | P | high | none apparent | S26, S15 | 2027-03-13 | — |
| S26 | arxiv.org/abs/2510.11977 | 2026-09-13 | 2025-10-13 | research paper | P | high | none apparent | S25 | 2027-03-13 | — |
| S27 | arxiv.org/html/2608.29028 | 2026-09-13 | 2026-08-29 | preprint (UIUC) | P | medium-high; **not peer reviewed** | none declared | S09 qualitatively, S16 | 2027-03-13 | peer review or failed replication |
| S28 | arxiv.org/html/2606.00953 | 2026-09-13 | 2026-05-31 | preprint | P | medium-high; **not peer reviewed** | authors propose Co-Coder | S01 on conditionality | 2027-03-13 | peer review or failed replication |
| S29 | arxiv.org/abs/2506.17208 | 2026-09-13 | 2025-06-20, rev 2026-02-05 | research paper | P | **abstract only; key sentence unverified** | none apparent | none | — | see gap G-1 |
| S30 | openai.com "A practical guide to building agents" | 2026-09-13 | undated | vendor guide | **S — could not open primary** | **low** | OpenAI | S06 | — | see gap G-2 |

---

# 4. Per-claim verdicts

### The ten R2 claims

| id | verdict | findings |
|---|---|---|
| **TC-01** *(handoffs lose facts)* | **Partially supported, and mis-aimed as written.** Facts survive handoffs at ~0.97–0.98; **boundary metadata survives at ~0.57–0.58**. The claim is true of constraints and close to false of facts. Its stated measure conflates the two. | F-04, F-05, F-18 |
| **TC-02** *(ephemeral-agent-per-task costs more capacity)* | **Supported in the specified units by structure, unmeasured empirically.** All published figures (15×, 10×, 3.2×) are in tokens or dollars and are therefore **non-conforming under TC-26**. Re-expressed in `07` §6 units, each executor is at least one native job launch, and launches are the scarce unit at CP1. The empirical arm remains unmeasured. | F-01, F-02, F-18, F-19 |
| **TC-03** *(higher elapsed time)* | **Unmeasurable as specified.** Latency's sign depends entirely on realized concurrency, and CP1 caps concurrency at two non-interchangeable slots. Published speedups (1.81×–2.10×, up to 90%) were obtained at concurrency this system does not admit. | F-06, F-07, F-19 |
| **TC-06** *(five criteria jointly sufficient, individually necessary)* | **Refuted in both directions.** Not sufficient: four sixth reasons survive adversarial search (F-21), of which input provenance and consequence class are supported by primary sources and by the package's own directive. Not individually load-bearing: "specialized knowledge" alone yields no measured benefit over a general executor loading procedural content (F-10). One confirmed instance either way falsifies it, per the claim's own measure; I return two. | F-09, F-10, F-21 |
| **TC-07** *(genuinely independent parts pay off in parallel)* | **Supported conditionally, with the condition now named and measurable.** Cohesion-aware partitioning gained 11.3 and 14.0 pass-rate points with 1.81× and 2.10× speedup; poor partitioning "degrades both speed and quality" on high-dependency projects. The claim's own guard is right: a design that wins the independent split and loses the semantic-conflict split has not won. | F-06, F-07 |
| **TC-17** *(five axes separable and exhaustive)* | **Partially supported: separable yes, exhaustive no.** Each axis can vary alone. Coverage fails on consequence class, input provenance, provider/account and attributable identity. `02` §3's production-mode axis is a fifth leftover the founder's list does not contain. | F-20, F-21 |
| **TC-23** *(mode chosen by nature of work, never to maximize agent count)* | **Founder constraint; conformance rule, not falsifiable by measurement — and independently well-supported as engineering.** Four primary sources converge on complexity being penalized: minimal gains (S08), architectural bloat (S15), needless complexity and cost (S25), higher effort reducing accuracy in a majority of runs (S26). | F-02, F-16 |
| **TC-35** *(is the list closed)* | **Not closed.** Four sixth-reason candidates returned with evidence (F-21). Per the claim's own measure, closure is now a founder decision packet, not a research finding. I make no recommendation on it. | F-21 |
| **TC-36** *(what unit must justify its existence)* | **Resolved, and the resolution is that there is no single unit.** The five criteria predicate on five different objects; three already exist in `05` §4. A criterion applied to the wrong unit returns undecidable, which is the signal protocol §4 control 4 looks for. | F-20 |
| **TC-38** *(do the criteria govern human and professional performers)* | **Partially: two transfer, one changes meaning, two do not.** Specialized knowledge and independent verification transfer intact. Distinct tools or permissions transfers but becomes *authorization and liability*, which is enforced by institutions rather than by an allowlist. Parallel work becomes a scheduling and payment question, and isolated context is not constructible for a person who has already read something. A sixth criterion applies only to human performers: **professional standing that the act itself requires**, which no capability difference can supply. | F-09, F-14, F-21 |

### The five criteria, one line each

| Criterion | Verdict | Evidence |
|---|---|---|
| **Parallel work** | **Real, conditional on partition quality, and near-unmeasurable at CP1.** Not a property of a job; a property of a partition. | F-06, F-07, F-19 |
| **Distinct tools or permissions** | **Real, the strongest of the five, enforced outside the model, and the only one with a published price** (77% vs 84% on AgentDojo). Not generation-dependent. | F-08, F-09 |
| **Isolated context** | **Real but double-meaning.** Isolation for attention is generation-dependent and shrinking. Isolation for confidentiality is structural and is not. The word covers both and the evidence differs. | F-03, F-12, F-13, F-19 |
| **Specialized knowledge** | **Assumed, and the evidence points at the skill rather than the agent** for knowledge, while pointing at the agent for authority. Generation-dependent. | F-08, F-10 |
| **Independent verification** | **Real as a requirement, assumed as discharged by separation.** The binding quantity is the verifier's false-positive rate, not its separateness. Generation-dependent through correlated error. | F-14 |

### The four costs, one line each

| Cost | Verdict | Evidence |
|---|---|---|
| **Handoffs** | **Real, measured, and aimed at the wrong target as stated.** Rules die, facts survive. Typed constraints reduced leakage to 0/48. | F-04, F-05 |
| **Token cost** | **Real in direction, folklore in magnitude, wrong unit for this system.** 15× is an unmethodded vendor claim; 10× is independent but in tokens; TC-26 forbids tokens as the primary unit. | F-01, F-02 |
| **Latency** | **Generation- and concurrency-dependent, sign indeterminate.** Cannot be stated without the concurrency count beside it. | F-06, F-07, F-19 |
| **Context loss** | **Real and mis-assigned.** It is a cost of context transformation, owed by the single-agent arm too, and mandatory in this system because a native job caps at 360 seconds. | F-13, F-18 |

---

# 5. Assumptions · Unknowns · Competing interpretations

**Assumptions.** That the specification's launch contract (`07` §5–§6) describes what will actually be built, since F-18 and F-19 rest on it. That arXiv preprints dated 2026 (S14, S15, S27, S28) are what they present themselves as; I could not check peer review status for any of them. That documentation describes deployed behavior, which `L03` already warns against.

**Unknowns, stated as unknowns.**
- **G-1.** I could not verify from the primary abstract the widely repeated sentence that the SWE-bench leaderboards do not show one architecture beating the other [S29]. The abstract confirms 79 Lite and 99 Verified entries across 80 approaches and "the presence of both agentic and non-agentic designs" and no more. **I am not asserting the comparison.** R3 or R8 should open the full paper.
- **G-2.** OpenAI's practical guide returned HTTP 403 on the HTML and unreadable binary on the PDF. Its single-agent-first guidance is therefore **secondary and uncorroborated** in this report and I have not used it as support for any finding.
- **G-3.** No source I found measures **facts lost per agent-to-agent handoff in an agentic work system carrying real obligations**. S27 is the closest and is a testbed. TC-01's probe is still owed.
- **G-4.** No source decomposes a "role" into label and procedural content and measures each (F-10). The cleanest available experiment is unrun.
- **G-5.** No published measurement of coordination cost at concurrency 2. Every figure I found assumes concurrency the CP1 policy forbids.
- **G-6.** Nothing establishes what compaction loses **in the units that matter here**, which are surviving obligations and restrictions, not tokens.

**Competing interpretations, preserved rather than resolved.**
1. **Bloat versus structure.** S15 reads a 10× cost with no gain as evidence against multi-agent; the same paper's expert-MAS result reads it as evidence against *automatic* design. Both readings are in one paper and I retain both.
2. **Turning point.** S17 predicts performance rising then falling with executor count; S18 reports monotone gains. Compatible only if the turn is beyond S18's sweep. Unresolved, and TC-20's sweep is what would settle it.
3. **Roles.** S13 says removing roles costs 44% of Quality; S12 says personas do not help; S14 says differentiation needs no roles at all. My reconciliation in F-10 is an inference, not a measurement, and a reader is entitled to reject it.
4. **Isolation.** S11 and S15's expert arm say bounded per-agent context helps; S09 and S27 say the boundary is where governance dies. Both can be true, because the first is about attention and the second is about what crosses.

---

# 6. Useful mechanisms · Rejected mechanisms

**Useful mechanisms, each with the named problem it solves.**

1. **Typed, machine-actionable constraints on the wire.** Solves boundary-metadata collapse at handoff, F-04, which is the failure that turns a promised remedy into a lost one. Measured: 0 of 48 leaks with a gold-derived allowlist versus 73% with vague language.
2. **Stratified loss measurement, facts separately from constraints.** Solves the averaging defect in F-05 that would make TC-01's probe non-discriminating.
3. **Capability-based enforcement at the tool call, not in the prompt.** Solves "an executor grants itself authority", F-09, and is the mechanism dimension W6 and fixture F-3 test. Its price is published.
4. **Constraint-after-untrusted-input, as a design pattern rather than a rule.** Solves the confused deputy, F-09, and supplies the sixth-reason candidate in F-21.1.
5. **Consultation (agents-as-tools) in place of handoff for obligation-bearing work.** Solves ownership ambiguity, F-17: the obligation-holder never leaves the turn, so there is no compressed artifact for a duty to fall out of.
6. **Cohesion-aware partitioning as the admission test for a split.** Solves F-06: turns "can this be parallelized" into a computable property of a proposed partition rather than an assertion about the job.
7. **Cost-controlled comparison as the default evaluation shape.** Solves F-16 and directly serves comparator B0 in protocol §6.
8. **A verifier false-positive rate as the reported quantity.** Solves F-14, and is what fixture F-4's planted-defect control actually measures.

**Rejected mechanisms, with reasons.**

1. **Token-multiple arithmetic as a capacity model.** Rejected by TC-26 and by protocol §4 control 7 before any evidence; F-01 shows the headline figure is also methodless.
2. **Role titles as a source of differentiation.** F-10 and F-14: the label carries no measured benefit, and a label cannot establish evaluation independence.
3. **Separate invocation as independence.** F-14: correlated error is a property of the shared model, and separateness does not touch it.
4. **Automatic or generative multi-agent architecture design.** F-02: measured at 10× cost with consistent underperformance.
5. **Resampling as a substitute for a better verifier.** F-14: an accuracy ceiling holds regardless of compute budget.
6. **A skill's `allowed-tools` as an authority boundary.** F-08: in the harness this system plans to launch, it grants and does not restrict, and a skill can grant itself broad access.
7. **"One long context" as this system's simple baseline without qualification.** F-18: a 360-second native job cannot host it. B0 keeps all its other legitimate strengths and loses this one.

---

# 7. Failure cases

1. **The averaged probe.** TC-01's measurement reports one loss rate, the exclusion and the unit average to something in the middle, and the round concludes handoff loss is moderate. The real distribution is bimodal and the constraint half is the dangerous half.
2. **The unavoidable handoff.** A single-agent design is chosen to eliminate handoff loss, and then hits the 360-second launch window. Continuation happens anyway, untyped, because the design assumed it would not.
3. **The skill that grants.** A general worker loads a domain skill whose `allowed-tools` pre-authorizes an outward-effect tool. The specification says a prose package cannot contact or spend by being loaded; the runtime disagrees; nothing in between notices.
4. **The partition that looks independent.** Two executors change onboarding and pricing without touching a shared file. Textual merge is clean, the combined journey promises something neither promised, and the parallel arm is scored a win because the integration cost was charged to nobody.
5. **The criterion applied to the wrong unit.** "Isolated context" is offered to justify a persistent template. The criterion predicates on a context boundary, the answer is undecidable, and undecidable reads as satisfied.
6. **The verified-by-agreement artifact.** Producer and verifier agree. Joint false acceptance was never measured, the clean-case control was never run, and agreement is recorded as assurance.
7. **The 4× fixture nobody can run.** F-2 requires measuring coordination cost per unit of work at 1×, 2× and 4×. CP1 admits 2. The fixture is reported as passed on a projection.
8. **The expired transfer.** ChatDev-era figures (GPT-3.5, 2023) are cited for 2026 design. S13's transfer is expired and its ablation is the most-quoted role evidence in existence.

---

# 8. Implications for this system

Bound to the fixed boundaries of protocol §1 and the six fixtures of §3. These are implications, not recommendations, and none of them reopens a fixed boundary.

**On F-1 (unknown job).** Nothing in my evidence bears on admission or typing; that is R5's. What my evidence does bear on: whichever executor takes the unknown job, the *constraints* arriving with it are the part most likely to be lost in transfer (F-04), and an unknown job is exactly the case where constraints arrive as prose rather than as types.

**On F-2 (demand 4×).** F-19 says this fixture is not executable at CP1. The honest disposition is that F-2's coordination-cost-per-unit measurement is **owed and blocked on a CapacityPlan revision**, not that it passed. Reporting it as passed on projection would be the §4 control 10 failure in a different costume.

**On F-3 (three permissions).** This is the fixture the evidence most strongly supports as load-bearing. F-08 says the skill route does not attenuate in the real harness and the subagent route does; F-09 gives a published utility price for the attenuation. F-3's adverse variation, a helper that must not receive all three, is precisely the CaMeL and Dual-LLM shape.

**On F-4 (independent verification).** F-14 says the two-arm design in W5 is testing the right thing and that the planted-defect control is the load-bearing half. It also says the round should report a **false-positive rate**, not a verdict, and that S23's self-correction result is the one most at risk of expiring against 2026 reasoning models.

**On F-5 (capacity reset).** F-18 makes this fixture central rather than peripheral. Continuation across a launch boundary is not an edge case in this system; it is every job longer than six minutes. The context manifest requirement of TC-27 and DIRECTIVE §8.12 is the instrument, and F-04 says its most important field is what *constraints* were dropped, which "what was omitted" does not obviously cover.

**On F-6 (founder absent).** Nothing in my lane measures this. I note only that F-21.3, consequence class, is the sixth reason most likely to matter when nobody is watching, because the supervision difference is the whole point of the absence.

**On the eight ledger-worthy findings.** These carry a `valid_until` and a named invalidator and belong in the claim ledger. I could not register them (see §1). An agent holding `mcp__claim-append__append_claim` should register: F-01 (expiry 2026-12-13), F-04 (2027-03-13), F-06 (2027-03-13), F-08 (2026-11-13), F-09 (2027-03-13), F-13 (2026-12-13), F-14 (2027-03-13), F-24-equivalent for S24's ceiling result (2027-03-13). Each needs its quote fetched and matched by the resolver at registration time; I have recorded the quotes verbatim in §2 for that purpose.

**On negative control 4** (an agent justified by a capability no fixture exercises). My §3 and §4 supply the discriminator the control needs: "isolated context" must be split into isolation-for-attention and isolation-for-confidentiality before the control can be applied, because only the second is exercised by any fixture in the frozen set.

---

# 9. Questions other lanes may have missed

1. **Whose 360 seconds?** If a native job caps at a 360-second network window, what is the *smallest* work order that can complete inside one launch, and does the answer change what "one unit of work" means in `05` §2?
2. **Does a continuation count as a handoff?** F-18 says the system hands off to itself on every long job. If the continuation protocol is not held to the same typed-constraint discipline as an inter-agent handoff, the system has one unguarded boundary it does not call a boundary.
3. **Which of the 46 capabilities carry constraints that would not survive a 25-word compression?** F-04 makes this a computable audit rather than a worry.
4. **Is any executor in the candidate justified by a reason not on the founder's list, and does it say so?** If a candidate silently uses input provenance or consequence class as its reason while citing one of the five, TC-06 is being satisfied verbally.
5. **What is the false-positive rate this system is willing to accept from a verifier?** S24 says the ceiling is set by that number and by nothing else. No lane appears to own naming it.
6. **If concurrency stays at two non-interchangeable slots, does "parallel work" belong on the list at all right now?** It may be a criterion that is real in general and inert in this deployment, which is a different disposition from real or assumed.
7. **Who re-checks an expired transfer?** S13 is 2023-era and is the most-cited role evidence in the field. What in this system prevents a 2023 measurement from justifying a 2026 structure?
8. **Does the specification's claim that a loaded prose package cannot spend survive contact with the actual launcher?** F-08 says it does not in one harness the system names by version.