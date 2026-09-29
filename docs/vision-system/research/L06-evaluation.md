# L06 — Evaluation, evidence, truthful accounts, and reproducibility

Research date: 2026-09-12. Independent expansion; no architecture selected. Inputs read: the complete `THE-VISION-AND-THE-FIELDS.md`, `directive-contract.json`, and engine guidance. No other lane reports or plans were read. This report addresses fields 13–14, 23, 31–32, 40–45, 48–50, with business and owner consequences across the lifecycle. Empirical findings below are source claims, not experiments reproduced here; mechanisms are proposals.

## Findings

**The object of evaluation must be specified before its instrument.** A useful artifact, an authorized process, a faithful account, and a valuable business outcome are different objects. τ-bench compares final database state and required response content, but explicitly acknowledges that a passing episode can omit required user confirmation. Thus even an objective outcome oracle can miss a consequential process violation. Its simplified policies and simulated users also limit transfer to actual customers. [S1](https://arxiv.org/html/2406.12045v1)

**Judges are fallible measuring instruments.** MT-Bench reports over 80% agreement between strong judges and human preferences while identifying position, verbosity, and self-enhancement bias. These results support economical preference approximation in the tested setting; they do not establish factual correctness or safe authorization. Controlled self-recognition experiments find evidence connecting recognition and self-preference, while acknowledging that the causal hypothesis is not fully validated. Removing author labels therefore cannot establish independence. [S2](https://arxiv.org/abs/2306.05685v4), [S3](https://arxiv.org/html/2404.13076v1)

**Bias, manipulation, and collusion require different evidence.** Universal adversarial suffixes can inflate judge scores, including transfer to unseen judges; comparative assessment was less susceptible than absolute scoring in that study. Simulated auction experiments found that communication increased seller collusion. The latter establishes a possible interaction failure in an economic simulation, not its prevalence among production evaluators. Correlated favorable judgments alone do not demonstrate secret cooperation. Shared training, criteria, evidence, or incentives can produce agreement without collusion. [S4](https://arxiv.org/abs/2402.14016v2), [S5](https://arxiv.org/abs/2507.01413)

**A trace is evidence of recorded events, not complete access to causation.** Turpin and colleagues demonstrate rationalizations that omit experimentally introduced influences. Generated explanations can help diagnosis, but cannot certify why a model acted. An account should distinguish observed calls and state changes, producer explanations, reviewer inferences, and unavailable observations. Missing spans must remain distinguishable from inactivity; a recorder’s silence is insufficient evidence that nothing happened. [S6](https://arxiv.org/abs/2305.04388v2) The last two sentences are engineering inferences.

**Productivity is heterogeneous and its measurement can drift.** A staggered customer-support deployment reported 14% more resolved issues per hour in its November 2023 working-paper version, with larger gains among novices. METR’s 2025 randomized study of 16 experienced developers and 246 tasks found 19% longer completion times, despite perceived acceleration. Different tasks, populations, interventions, and methods prevent treating these as contradictory estimates of one universal effect. In February 2026, METR reported that selection, attrition, and concurrent agent use undermined interpretation of its newer experiment. A frozen measurement procedure can become invalid even before its code changes. [S7](https://www.gsb.stanford.edu/faculty-research/working-papers/generative-ai-work), [S8](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), [S9](https://metr.org/blog/2026-02-24-uplift-update/)

**Provenance and assurance support challenge; neither manufactures truth.** W3C PROV represents derivation, attribution, activities, and invalidation. SLSA provenance identifies artifacts, inputs, and a trusted builder; its security still depends on that trust base. SEI assurance cases connect claims to evidence through an explicit argument, exposing unsupported subclaims. An authentic record of a false claim remains false; a complete argument can still rest on a defective measurement. [S10](https://www.w3.org/TR/2013/REC-prov-dm-20130430/), [S11](https://slsa.dev/spec/v1.2/build-provenance), [S12](https://www.sei.cmu.edu/documents/2190/2010_004_001_15176.pdf)

## Sources, dates, incentives, confidence, and invalidation

All sources are primary and were searched/opened on 2026-09-12. Dates below preserve available precision; unknown publication days are not invented. Confidence concerns the narrow use here, not present-day model performance. **R** means reassess applicability by 2026-12-12 or earlier model/domain/rubric change; **D** means recheck documentation by 2026-10-12 or version change; **M** means review method applicability by 2027-09-12 or violated assumptions. Historical observations do not become false when their applicability expires. Incentives listed are institutional exposures, not allegations.

| ID and dated source | Type; incentive; confidence | Expiry or invalidation condition |
|---|---|---|
| S1: Yao et al., τ-bench, 2024-06-17 | Benchmark paper, methods read; benchmark authors/agent vendor; medium | R; changed simulator, policy, oracle, or customer population |
| S2: Zheng et al., MT-Bench, 2023-06-09; v4 2023-12-24 | NeurIPS research, abstract; benchmark adoption; medium | R; new judges, languages, tasks, preference distribution |
| S3: Panickssery et al., self-preference, 2024-04-15 | Controlled experiments, methods/limitations; academic/safety research; medium | R; effects absent under relevant blinded calibration |
| S4: Raina et al., judge attacks, 2024-02-21; v2 2024-07-04 | Research preprint, abstract; attack-method novelty; medium | R; defenses or judge changes invalidate measured transfer |
| S5: Agrawal et al., auction collusion, 2025-07-02 | Simulation preprint, abstract; publication novelty; medium for simulation, low transfer | R; communication/incentives differ; no evaluator prevalence estimate |
| S6: Turpin et al., explanation faithfulness, 2023-05-07; v2 2023-12-09 | NeurIPS experiments, abstract; academic/safety research; medium | R; new explanation method requires new intervention tests |
| S7: Brynjolfsson, Li, Raymond, working paper, 2023-11 | Field study, primary indexed abstract; partner-firm access/publication; medium | Historical version only; no current company-wide extrapolation; later journal version differs |
| S8: METR productivity RCT, 2025-07-10 | Primary research account; AI-risk measurement mission; medium | Historical intervention only; tools/population have changed |
| S9: METR experiment update, 2026-02-24 | Primary methodological disclosure; same institution, not independent replication; medium | Revisit on redesigned study; effect-size inference already limited |
| S10: W3C PROV-DM, 2013-04-30 | Normative specification, sections read; interoperability adoption; high for semantics | M; errata or incompatibility; never validates source truth |
| S11: SLSA v1.2 build provenance; [release 2025-11-24](https://slsa.dev/blog/2025/11/announce-slsa-v1.2); page undated | Normative specification, sections read; supply-chain standard adoption; high for declared scope | D; version, signer, builder, or verification-policy change |
| S12: Ellison et al., CMU/SEI-2010-TN-016, 2010-05; landing page 2010-05-01 | Technical report, indexed §§3/5; defense-sponsored assurance practice; medium | M; business adaptation needs validation; reference model was preliminary |
| S13: [Lipsitch et al., negative controls](https://pubmed.ncbi.nlm.nih.gov/20335814/), 2010-05 | Peer-reviewed methods, abstract; academic inference research; medium | M; control affected by treatment or unlike relevant confounding |
| S14: [Dmitriev et al., metric pitfalls](https://www.microsoft.com/en-us/research/publication/a-dirty-dozen-twelve-common-metric-interpretation-pitfalls-in-online-controlled-experiments/), 2017-08 | KDD industry research, abstract; Microsoft experimentation practice; medium | M; different causal structure or unavailable assignment data |
| S15: [LangSmith evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts), undated | Product documentation; commercial adoption; medium for capability claims | D; SDK, hosting, evaluation behavior change |
| S16: [Braintrust dataset evaluation](https://www.braintrust.dev/docs/annotate/datasets/use-in-evaluations), undated | Product documentation/examples; commercial adoption; medium | D; version lookup, retention, or export changes |
| S17: [Phoenix documentation](https://arize.com/docs/phoenix/), undated | Product documentation; Arize/community adoption; medium | D; instrumentation, sampling, storage, or evaluator change |

Corroboration is limited: S2/S3 support related bias concerns through different experiments; S1/S6 expose different limits of process evidence; S7–S9 establish contextual heterogeneity, not replication. Product documentation was not operationally tested. S7 and S12 full-text retrieval failed; their indexed primary excerpts and accessible metadata support only the narrow statements used. The GSN standard was inaccessible and is not claimed as reviewed.

## Assumptions and unknowns

Assumptions: selected low-consequence tasks permit controlled comparisons; domain owners can articulate at least some unacceptable outcomes; external systems provide independently queryable state; evaluation access can differ from production access. These are feasibility conditions, not established facts.

Unknowns: task mix, outcome delays, defect prevalence, owner attention baseline, acceptable uncertainty, available human expertise, and judges’ joint error distribution. No evidence reviewed establishes that a single owner can validate indefinitely increasing work without growing attention cost. Deliberate evaluator collusion in this intended setting remains unmeasured.

## Competing interpretations

One interpretation favors outcome evaluation because it tolerates many valid methods and resists persuasive narratives. Another favors process evaluation because final state cannot reveal unauthorized disclosure, wasted spend, or skipped consent. S1 supports retaining both, with separate judgments.

A second disagreement concerns automation: inexpensive model judgments can expand coverage, while human judgment supplies an external anchor. Humans also disagree, tire, and misestimate productivity. The defensible comparison is measured error and attention cost on the relevant task, including uncertainty; neither “human” nor “different provider” is a sufficient independence certificate.

The vision’s assertion that nobody sells, or will build, truthful accounts is unproven. Existing products sell meaningful pieces of the evidence workflow. Their existence weakens a blanket absence claim without demonstrating the complete accountability proposition.

## Useful and rejected mechanisms

**Useful proposals:** maintain separate fixed regression cases, fresh production samples, withheld challenge cases, and adversarial cases. Record denominators including refused, abandoned, timed-out, and unobservable work. Calibrate evaluators against independently labeled cases; preserve disagreements, error types, and abstentions. Randomize presentation order and conceal irrelevant identity signals. Measure joint false acceptance directly before treating a panel as additional assurance.

For stochastic tasks, retain every trial, budget, seed when available, and environment reset. Report endpoint-specific intervals and task strata. τ-bench’s `pass@k` asks whether any attempt succeeds; `pass^k` asks whether all succeed. Neither is a company-wide success score. With zero failures in 30 independent identical Bernoulli trials, the one-sided 95% upper failure bound is still about 9.5%, calculated as `1 − 0.05^(1/30)`; shared outages or memory break that independence assumption. [S1](https://arxiv.org/html/2406.12045v1)

Use sham changes and unaffected outcomes as negative controls for spurious improvement, subject to causal assumptions. Separately, inject known defects as positive detection controls and include clean cases to detect indiscriminate rejection. Randomize eligible work before selection where feasible; retain noncompletion; predeclare outcomes, stopping rules, and meaningful differences. Small samples warrant unresolved conclusions, not manufactured certainty. [S13](https://pubmed.ncbi.nlm.nih.gov/20335814/), [S14](https://www.microsoft.com/en-us/research/publication/a-dirty-dozen-twelve-common-metric-interpretation-pitfalls-in-online-controlled-experiments/)

**Reject:** evaluator unanimity as proof; one successful run as reliability; best-of-many demonstrations hiding attempts; summary confidence as evidence; generated rationales as complete causes; weighted aggregate success scores; and evaluation performance that silently expands authority.

## Real tools and their limits

LangSmith documents datasets, experiments, traces, offline evaluation, and production evaluation without reference outputs. Braintrust documents pinning dataset versions and reusing experiment results. Phoenix documents OpenTelemetry/OpenInference capture, code/model/human evaluation, prompt versioning, and replay. These solve collection, comparison, and workflow problems. None of these documents establishes that recorded coverage is complete, labels are correct, reviewers independent, or outcomes causally valuable. Converting a producer’s output into an expected answer can preserve an error perfectly. [S15](https://docs.langchain.com/langsmith/evaluation-concepts), [S16](https://www.braintrust.dev/docs/annotate/datasets/use-in-evaluations), [S17](https://arize.com/docs/phoenix/)

Reproducibility should name its promise: reconstruct recorded events; replay captured tool responses; rerun live execution; or reproduce an outcome distribution. These are different. Proposed capture includes resolved model identifiers, prompts, policies, skills, tools, code/dependency digests, selected context and omissions, dataset/evaluator versions, initial state, budgets, timestamps, and raw observations subject to retention constraints. Pinning controllable inputs cannot freeze customers, remote providers, or missing observations. A replay must declare which external effects were simulated.

## Concrete failure cases

| Failure | Discriminating observation or test |
|---|---|
| “Refund completed” after a timeout; retry pays twice | Reconcile transaction identity and destination state; retain ambiguous completion |
| Correct refund state after skipped authorization | Independently inspect authorization evidence; state equality alone passes |
| Producer and judge reward fabricated citations | Resolve cited sources and check support; swap judges and inject nonexistent sources |
| Exporter drops failed runs; quality appears better | Reconcile submitted/run/completion counts through a separate observation point |
| Customer-support throughput rises by closing unresolved tickets | Measure reopening, customer-confirmed resolution, and delayed complaints |
| Summary removes an uncertainty that would change approval | Compare owner decisions using full evidence versus summaries, with omissions seeded |
| Wind-down appears complete while promises survive | Check refunds, notices, renewals, and retained obligations after closure |

These are proposed tests, not observed incidents in this repository.

## Implications

Evaluation scope must cross levels: model/prompt/skill behavior; tool calls and handoff fidelity; agent/workflow/run outcomes; artifact and decision quality; project value; business, safety, and attention outcomes. A component improvement does not establish improvement at the next level.

Any candidate should demonstrate a challengeable account containing attempted, skipped, stale, inferred, disputed, and unverifiable work with remaining consequences. Compare business outcomes using actual customer behavior, retained margin, rework, and closure cost; count owner review and recovery time. Evaluate decision quality using evidence available when decided, separately from lucky outcomes. Measure comprehension and retained competence as well as reading speed. These requirements leave the execution and storage architecture open.

## Questions others may miss

Who notices evidence that was never emitted? Can a rejected opportunity disappear from the denominator? Does making summaries shorter increase harmful approvals? Who can change the evaluator’s labels, and can the producer discover withheld cases? What would expose jointly biased judges? Can deleted private data leave a defensible, explicitly limited account? When a profitable project closes, which unfulfilled promises remain? What result would show that the evaluation system itself costs more attention than it saves?
