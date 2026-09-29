**Lane 05 — Memory, knowledge, context, and grounding**

**Status: COMPLETE for this independent research lane.** [Observation] No repository files were changed, no claims were appended, and no other lane’s conclusions were consulted. This artifact informs memory and context decisions without selecting the final architecture.

**Findings**

[Inference; high confidence] The mission requires several independently testable properties: retaining information, retrieving relevant material, determining whether it still applies, preserving its provenance, controlling who may use it, and explaining what a run omitted. Calling all these properties “memory” risks hiding failures behind successful recall.

[Source claim; high confidence about reported findings, limited transfer confidence] LongMemEval separates extraction, multi-session reasoning, temporal reasoning, knowledge updates, and abstention. Its experiments show that retrieval success does not guarantee correct use of retrieved material. Extracting isolated facts improved some aggregation tasks but harmed overall performance through information loss. Its commercial-assistant observations were collected in August 2024; they are historical evidence, not measurements of current products. [LongMemEval](https://arxiv.org/html/2410.10813v2)

[Source claim; high confidence about historical result] *Lost in the Middle* found substantial sensitivity to where relevant information appeared within long contexts, including degradation for information in the middle. [Inference] The transferable lesson is to evaluate context utilization, not assume that a larger accepted input guarantees dependable comprehension. The 2023 result does not establish present-model failure rates. [Lost in the Middle](https://arxiv.org/abs/2307.03172v3)

[Source claim; medium confidence about generalization] Memora tests repeated updates and consolidation across simulated weekly, monthly, and quarterly conversations. Its Forgetting-Aware Memory Accuracy penalizes using obsolete information, and experiments found recurring invalid-memory reuse among four models and six memory agents. [Inference] A founder’s correction must affect later behavior, not merely become another retrievable sentence alongside the superseded belief. Simulated conversations provide controlled tests but do not establish reliability over an actual company’s operating history. [Memora](https://arxiv.org/html/2604.20006v1)

[Source claim; high confidence about documented mechanism] XTDB distinguishes **system time**, when information entered the database, from **valid time**, the period to which that information applies. [Inference] This distinction transfers directly to late-arriving invoices, retroactive customer corrections, scheduled price changes, and reconstructions of what an owner knew when deciding. It does not require adopting XTDB: equivalent semantics can be implemented elsewhere. [XTDB time model](https://docs.xtdb.com/about/time-in-xtdb.html)

[Source claim; high confidence] W3C PROV supplies concepts for entities, activities, responsible agents, derivation, revision, and quotation. [Inference] These can connect an original interview recording, extracted observation, synthesized customer insight, decision, and resulting artifact. Provenance establishes a derivation account; it does not establish that the originating statement was true. Multiple summaries descending from one source are not independent corroboration. [PROV-DM](https://www.w3.org/TR/prov-dm/)

**Competing mechanisms and interpretations**

| Mechanism | Evidence and transferable property | Failure or unresolved trade-off |
|---|---|---|
| Entire history in context | [Source claim] Long-context studies supply a straightforward baseline without extraction loss. | [Inference] Repeated reading consumes capacity and still needs permission filtering, temporal interpretation, and utilization tests. |
| Tool-managed memory tiers | [Source claim] MemGPT moves information between context and external storage, using explicit operations and interrupts. | [Inference] A model deciding what to retain can discard future-critical details; the mechanism alone does not provide authoritative records. |
| Structured records and temporal queries | [Source claim] XTDB demonstrates deterministic historical and current-state queries. | [Inference] Excellent for explicit identifiers, amounts, dates, commitments, and statuses; schema design and natural-language interpretation remain necessary. |
| Temporal knowledge graph | [Source claim] Zep combines conversational and business information, temporal relationships, and retrieval; its authors report benchmark gains. | [Observation] All paper authors identify as Zep employees. [Inference] These are vendor experiments, not independent evidence that graphs dominate alternatives. |
| Source text with lexical/vector retrieval | [Source claim] LongMemEval and the recent selective-forgetting study provide competitive flat-retrieval baselines. | [Inference] Similarity cannot by itself establish current validity, authorization, contradiction resolution, or completeness. |

Sources for the table: [MemGPT](https://arxiv.org/abs/2310.08560v2), [Zep](https://arxiv.org/html/2501.13956v1), [XTDB](https://docs.xtdb.com/about/time-in-xtdb.html), [LongMemEval](https://arxiv.org/html/2410.10813v2), [Selective Forgetting](https://arxiv.org/html/2608.28978v1).

[Source claim; provisional] The August 2026 *Selective Forgetting* preprint reports token F1 of 0.417 for its graph pipeline versus 0.468 for flat vector retrieval, with a paired confidence interval excluding zero. Its largest deficit concerns recalling specific assistant statements. The authors restrict the conclusion to their extractor and benchmark. [Inference] This does not refute Zep: implementations, extraction choices, and comparisons differ. It does refute treating graph structure alone as sufficient evidence of improvement. [Selective Forgetting](https://arxiv.org/html/2608.28978v1)

[Proposal] Preserve this disagreement through candidate evaluation. Compare representations on the same founder/customer corpus, equivalent retrieval and context budgets, identical answer models, and separate measures for exact wording, temporal updates, aggregation, access control, and source coverage. A representation may win one dimension and lose another.

**Harmful persistence and selective forgetting**

[Source claim; medium transfer confidence] PersistBench evaluates harmful use of stored information, including cross-domain leakage and memory-induced sycophancy. It reports median failures of 53% and 97%, respectively, across its tested models. These are benchmark rates, not predicted company incident rates. Its authors explicitly state that the evaluation supplies synthetic memories directly in context and abstracts away memory construction. [Inference] Preserving founder preferences must not turn disagreements, biases, or temporary frustrations into permanent operating instructions. [PersistBench](https://arxiv.org/html/2602.01146v2)

[Source claim; high confidence about demonstrated attack class] AgentPoison demonstrates targeted poisoning of retrieved memory or knowledge without retraining the model. MINJA demonstrates a different access assumption: attackers can induce malicious memory through ordinary queries and observed responses rather than directly editing storage. [Inference] Protecting database writes alone does not protect memory formation; customer messages, support interactions, and imported task histories may become indirect write channels. [AgentPoison](https://arxiv.org/abs/2407.12784v1), [MINJA](https://arxiv.org/abs/2503.03704v5)

[Source claim; high confidence about guidance] OWASP identifies permission failures, sensitive-data leakage, and poisoning in vector and embedding systems. [Proposal] Retrieval authorization belongs before content reaches a model, including tenant, venture, customer, purpose, and sensitivity restrictions. Summarization should not silently remove those restrictions. [OWASP LLM08](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/)

[Inference] “Forget” needs distinct operations: exclude from routine retrieval; mark superseded; archive; redact; and erase. These have different consequences for operational correctness, auditability, and privacy. A preference can become obsolete while the historical statement remains relevant to explaining an earlier decision.

[Source claim] XTDB documents `ERASE` separately from ordinary deletion, removing records across historical timelines. [Inference] Database erasure does not establish deletion from exports, derived summaries, embeddings, backups, or provider-held copies. Those require an inventory and verification protocol. No jurisdiction-specific retention conclusion is established by this lane. [XTDB transactions](https://docs.xtdb.com/reference/main/sql/txs.html)

**Proposals available to any architecture**

- [Proposal] Keep authenticated founder statements, model interpretations, approved decisions, and observed outcomes distinguishable. A founder correction should identify its scope, effective time, superseded assertion, and whether it changes intent or corrects a misunderstanding.
- [Proposal] Treat extracted facts, embeddings, summaries, and graphs as versioned derivatives with source links. Record the extraction process and unresolved ambiguity. Retain original wording where taste, promises, customer language, or rejected alternatives depend on it.
- [Proposal] Give each consequential context assembly a manifest: source identifiers and versions, authorization basis, timestamps, trust classification, selection reason, transformation, token allocation, and known omissions. Enumerate the material considered but excluded; do not imply knowledge of every relevant item that was never discovered.
- [Proposal] Represent contradiction explicitly before arbitration. Determine whether two statements concern different times, entities, conditions, or authorities. “Latest wins” is plausible for an authenticated address update but insufficient for disputed customer evidence or competing founders’ decisions.
- [Proposal] Separate freshness from popularity. Frequent retrieval should not renew a claim’s verification date. Expiration should trigger revalidation or qualified use rather than automatically declaring the claim false.
- [Proposal] Evaluate correction propagation and deletion propagation across every derivative. Include interrupted rebuilds, restored backups, revoked access, duplicated evidence, poisoned episodes, and a summary that drops a crucial exception.

**Implications for the full-company mission**

[Inference] Different business activities require different memory guarantees. Bookkeeping needs exact amounts and historical corrections; sales needs current promises and customer-specific restrictions; branding needs examples and original language; market research needs disagreement and source incentives; incident recovery needs attempted and failed actions; shutdown needs retention and disposal accountability. One retrieval score cannot establish competence across these jobs.

[Hypothesis] A small set of authoritative business records plus reversible search and synthesis projections may preserve accountability more efficiently than treating every conversation as equally important durable knowledge. This remains a candidate mechanism, not a selected architecture.

[Inference] Owner competence requires access to original evidence and contradictory material, not only increasingly polished summaries. A comprehensible account should distinguish “not found,” “not searched,” “excluded by policy,” “summarized,” and “unverified.”

**Assumptions, gaps, and questions**

[Hypothesis/assumption] Records will change, people may disagree, and multiple ventures may have incompatible confidentiality boundaries. Actual volumes, jurisdictions, retention obligations, and acceptable retrieval latency remain unknown.

[Observation] This lane did not independently reproduce the cited experiments or establish a longitudinal benchmark covering an entire real company. It found no evidence sufficient to choose one memory representation for all required work.

[Proposal—questions for other lanes] Who arbitrates conflicting founder corrections? Can an approval depend on stale context? How is an already-issued commitment repaired after its supporting claim changes? Which records must survive shutdown, and under whose authority? How does a restored backup avoid resurrecting deleted personal data? What evidence must the founder periodically inspect to detect summary distortion?

**Source index and confidence controls**

[Observation] All sources below were accessed **2026-09-12**; all are primary sources. Dates identify the examined publication/version. Academic authors have incentives to demonstrate their methods; vendor involvement is identified where verified. No independent replication was performed.

| ID | Source, publisher, date | Type and qualification |
|---|---|---|
| S1 | Wu et al., [LongMemEval](https://arxiv.org/html/2410.10813v2), arXiv, 2025-03-04 | ICLR 2025 research; Tencent/UCLA involvement |
| S2 | Liu et al., [Lost in the Middle](https://arxiv.org/abs/2307.03172v3), arXiv, 2023-11-20 | TACL-accepted experimental research; historical models |
| S3 | Uddin et al., [Memora](https://arxiv.org/html/2604.20006v1), arXiv, 2026-04-21 | ACL Findings; university/Genies research |
| S4 | Pulipaka et al., [PersistBench](https://arxiv.org/html/2602.01146v2), arXiv, 2026-06-02 | ICML 2026; synthetic stress tests |
| S5 | [PROV-DM](https://www.w3.org/TR/prov-dm/), W3C, 2013-04-30 | Standards recommendation |
| S6 | [Time in XTDB](https://docs.xtdb.com/about/time-in-xtdb.html), XTDB, undated | Vendor documentation; behavioral claims |
| S7 | [SQL transactions](https://docs.xtdb.com/reference/main/sql/txs.html), XTDB, undated | Vendor documentation; erasure semantics |
| S8 | Packer et al., [MemGPT](https://arxiv.org/abs/2310.08560v2), arXiv, 2024-02-12 | System research; historical evaluation |
| S9 | Rasmussen et al., [Zep](https://arxiv.org/html/2501.13956v1), arXiv, 2025-01-20 | Vendor-authored system preprint |
| S10 | Rusu et al., [Selective Forgetting](https://arxiv.org/html/2608.28978v1), arXiv, 2026-08-29 | Recent preprint; narrow experimental scope |
| S11 | Chen et al., [AgentPoison](https://arxiv.org/abs/2407.12784v1), arXiv, 2024-07-17 | Experimental security research |
| S12 | Dong et al., [MINJA](https://arxiv.org/abs/2503.03704v5), arXiv, 2026-02-12 | Experimental security research |
| S13 | [LLM08](https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/), OWASP, 2025 edition | Security guidance; not incidence measurement |

[Proposal] Preserve historical results as historical claims. Revalidate current product behavior against the chosen version before implementation and after material upgrades. Reopen comparative conclusions when independent reproductions, corrected benchmarks, changed access models, or actual company workloads contradict them. `claims_emitted: []`.
