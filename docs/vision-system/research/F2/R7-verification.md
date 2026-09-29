> Archival provenance — 2026-09-13: Lane R7 (Independent verification under one model family) report for the F2 round, preserved verbatim. Subject package at `ffeba9c` (Step 0 committed; protocol frozen at `26af5d5`). The lane was formed blind: it read only the files named in its brief and no other lane's output. The return channel truncates at about 4,000 characters and drops drains over 16,000, so the report was **extracted in full from the sourcer engine's own session transcript** (the harness's record of the agent's final text block, 71,155 characters) rather than assembled from chunked resends; chunks that had already arrived were compared against the extracted text and matched verbatim. No edits were made. The lane shares a model family with every other lane and reviewer in this round; independence is procedural only. Archival is not acceptance of any finding.

# R7 — Independent verification under one model family

## 1. Provenance header

**Lane:** R7 (independent verification under one model family). **Date:** 2026-09-13. **Subject root:** `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685/docs/vision-system/`.

**Reads, in order, before any source was opened:** `inputs/DIRECTIVE.md` (complete, §6, §8.13, §8.14 in detail); `planning/F2/00-acceptance-protocol.md` (complete; §1, §2 row W5, §4, §7, §8 govern this return); `inputs/FOUNDER-THESIS-2026-09-13-agents.md`; `research/L06-evaluation.md`; `planning/specification/06-knowledge-evidence-evaluation.md` (complete, §6 and §7 in detail); `planning/F2/00-thesis-claims.json` (entries whose `lane` is `R7`: **TC-11** and **TC-37**, and no others); `.claude/memory/DECISIONS.md` entry dated 2026-08-29.

**Reads beyond the brief, disclosed:** while tracing the provenance of the 2026-08-29 DECISIONS.md entry I opened two repository system-design documents, `docs/03-system-design/MODEL-DIVERSITY.md` (2026-08-15) and `docs/03-system-design/DESIGN-CAPABILITY.md` §6.1, §14.2, §15.40. Neither is an F2 lane output. I opened them because the brief told me to treat the DECISIONS.md entry as a source claim, and a source claim whose numbers I cannot trace is folklore under §7 of the protocol. One consequence of that trace appears as Finding 16 and it is a correction against this repository. **No F2 lane report was read.** No `research/` file other than `L06-evaluation.md` was read.

**Independent formation.** This lane formed its question list from the brief and the protocol alone. It did not coordinate with R1–R6 or R8. Where my findings extend or contradict `L06-evaluation.md` I say so explicitly (Findings 3, 18, 20).

**Model-family disclosure, and I am an instance of the problem.** I am a Claude model. The producers whose work this lane's conclusions would govern are Claude models. The reviewers who will read this report are Claude models. Every source-selection judgment, every reading of an abstract, and every confidence label below was produced by the same family whose self-preference, familiarity bias and self-consistent error this report measures. **Nothing in this report is evidence that this report is unbiased.** The strongest thing I can say about my own procedure is that it satisfies the narrow form of independence Finding 9 measures and no more: I read primary sources rather than the repository's summaries of them, and in four cases (Findings 8, 16, and the two in §5 marked UNVERIFIED) the primary disagreed with the summary in this repository, which is weak evidence that the procedure has some discriminating power.

**Tool gap, material to §5 of my own operating procedure.** The `mcp__claim-append__append_claim` tool is not present in this session's tool set. I could not register any durable finding to the ledger. `claims_emitted` is empty, not because nothing here is durable, but because the mechanism was unavailable. Findings 3, 5, 8, 12, 13 and 16 each carry a `valid_until` and should be registered by an agent that has the tool. I have not routed any of them into prose as a substitute for a claim that was refused, because none was refused; the call could not be made at all.

---

## 2. Findings

Kind labels follow DIRECTIVE §6. Every measured effect carries its model generation and date, per protocol §7.

---

**F1. SOURCE CLAIM. Self-preference is real, it correlates with self-recognition, and the best-supported mechanism is familiarity rather than authorship.** Panickssery, Bowman and Feng define self-preference as an evaluator scoring its own output higher than others' where human annotators judge them equal, and self-recognition as the ability to distinguish own text from other text. They report that GPT-4 and Llama 2 have "non-trivial accuracy at distinguishing themselves from other LLMs and humans", and, through fine-tuning interventions, "a linear correlation between self-recognition capability and the strength of self-preference bias" [R7-S01, models GPT-4 and Llama 2, 2024-04-15].

Wataoka, Takahashi and Ri supply the mechanism that matters for design. They report that LLMs "assign significantly higher evaluations to outputs with lower perplexity than human evaluators", and hypothesise that "LLMs may favor outputs that are more familiar to them, as indicated by lower perplexity" [R7-S02, GPT-4, 2024-10-29, rev 2025-06-21].

**INFERENCE, and it is the load-bearing one in this report.** If self-preference is driven by the low perplexity of familiar text rather than by recognising an authorship label, then **removing the author label does not remove the bias**. A blinded Claude judge still prefers Claude-shaped text, because the preference is over the text, not over the attribution. L06 already says "removing author labels therefore cannot establish independence" [L06 S3]; R7-S02 tells us *why*, and the why rules out the obvious repairs. There is no prompt, no anonymisation and no role label that reaches a preference computed over the surface form of the artifact.

---

**F2. SOURCE CLAIM. Family relatedness contaminates judgement even where there is no self-authorship at all.** "Preference Leakage" formalises three relatedness types between a synthetic-data generator and a judge: same model, inheritance relationship, and same model family. It reports "a systematic bias of judge LLMs towards their related student models", and states that this contamination "is subtler and more challenging to detect" than length or egocentric bias, "especially given that most LLMs do not disclose their training data" [R7-S11, ICLR 2026, arXiv 2025-02-03].

**INFERENCE.** This closes a loophole the protocol's W5 probe does not currently test. A candidate could argue that a checker which never produced the artifact and never saw its rationale is independent of it. R7-S11 says relatedness alone is sufficient for bias. In this system every producer and every checker are the same family, so the relatedness condition holds unconditionally and cannot be designed away.

---

**F3. SOURCE CLAIM, and this contradicts how `L06-evaluation.md` uses its source S2.** L06 records MT-Bench as reporting "over 80% agreement between strong judges and human preferences" [L06 S2, quoting R7-S03 verbatim: "achieving over 80% agreement, the same level of agreement between humans", NeurIPS 2023, v4 2023-12-24].

A 2026 study of approximately 541,000 individual judgments across 118 runs and 21 judge models from 9 providers measures what that figure costs once corrected for chance. It reports: "every judge's exact-match score (orange) exceeds its chance-corrected agreement (Cohen's κ, blue) on MT-Bench by between 33.8 and 41.2 percentage points", with the deflation varying by benchmark (23.7 points on JudgeBench, 10.4 on RewardBench), and states that "judge validation in practice relies on exact-match agreement, a metric that does not correct for chance and systematically overstates discriminative ability" [R7-S04, 2026-06-17].

**INFERENCE.** Eighty percent exact-match agreement on MT-Bench corresponds to a Cohen's kappa in roughly the 0.39 to 0.46 band. That is "moderate" on the conventional scale and is not a number that supports an acceptance gate. **L06's S2 row should be amended**: not withdrawn, because the observation is historically true, but annotated, because the package currently carries an 80% figure with no chance correction beside it and R7-S04 measures the correction on the exact benchmark L06 cites. This is the clearest instance in this lane of a number that is accurate and misleading at once.

---

**F4. SOURCE CLAIM. Reproducibility and validity are orthogonal, and this is now measured at scale rather than argued.** R7-S04 reports test-retest reliability above 0.95 for some judges, with cohort means of 0.943 on MT-Bench and 0.911 on JudgeBench, coexisting with position bias ranging from 0.002 (Gemini 2.5 Pro) to 0.192 (Qwen 3 8B). The authors name this the "consistency–bias paradox" and recommend: "Report Cohen's κ (or Krippendorff's α) alongside any exact-match figure, and treat the chance-corrected metric as the headline reliability number" [R7-S04, 2026-06-17].

**INFERENCE.** A judge that returns the same verdict every time is evidence that it is a stable instrument, and evidence of nothing else. This repository's own DECISIONS.md entry of 2026-08-29 reaches the same conclusion from an unrelated domain and states it more sharply than the paper does: *"a biased coin on the merge path, reproducible while invalid, which looks exactly like a working mechanism"* [R7-S25]. Two independent derivations of one result is the strongest corroboration available in this report.

---

**F5. SOURCE CLAIM. Where correctness is objectively checkable, judges approach chance.** JudgeBench constructs response pairs whose preference labels reflect "objective correctness" rather than crowdsourced preference, spanning knowledge, reasoning, math and coding. Its evaluation covers "prompted judges, fine-tuned judges, multi-agent judges, and reward models" and concludes that it "poses a significantly greater challenge than previous benchmarks, with many strong models (e.g., GPT-4o) performing just slightly better than random guessing" [R7-S05, ICLR 2025, arXiv 2024-10-16, rev 2025-04-05, abstract read verbatim].

Secondary detail, search-derived and not confirmed against the primary: best model Claude-3.5-Sonnet at 64%, vanilla GPT-4o at 50.86%, Arena-Hard prompting at 56.57%. Treat the 50.86% and 64% as directional; the primary-confirmed statement is "just slightly better than random guessing".

**INFERENCE, and this is the single most decision-relevant number in the lane.** This repository already holds an independently derived figure of the same shape from a completely different domain: a design-quality judge at 0.543 against a designer panel that is itself only 0.741 self-consistent [R7-S25, tracing to arXiv 2605.20731 via DESIGN-CAPABILITY.md §6.1]. JudgeBench measures near-chance judging on *objectively correct* answers, where no taste is involved and a ground truth exists. Two domains, two research groups, two years apart, same band. The repository's line **"conformance binds, quality informs"** is not a local heuristic about design. It is the general result.

---

**F6. SOURCE CLAIM. Judges flip verdicts under semantically equivalent rephrasings of the evaluation prompt, and scale does not fix it.** JudgeSense hand-validates 500 prompt-paraphrase pairs across four evaluation tasks and thirteen judge models (seven commercial, six open-source), defining a Judge Sensitivity Score as the fraction of paraphrase pairs on which the judge's decision is identical. Verbatim: "In our data, GPT-4o flips its 1–5 coherence rating of the same summary on 8.5% of pairs under this kind of rephrasing. Smaller, less instruction-tuned judges flip far more often: gemini-2.5-flash flips on 61.3% of the same coherence pairs." And: "we find that model scale is not a reliable proxy for consistency; notably, as an interesting result in our analysis, the largest and newest models are not the most consistent" [R7-S08, thirteen judge models, arXiv 2026-05-07, v2 2026-05-11].

The paper states the consequence for anyone versioning a rubric: "If two researchers pick slightly different templates and get systematically different rankings of the same models, they will draw different conclusions from the same underlying data. The judge stops being a measurement tool and starts being a noise source."

**INFERENCE.** This is evaluator drift over prompt versions, measured. A checker whose prompt is edited between two runs of the same fixture has not been improved and has not been degraded; it has become a different instrument, and the protocol has no way to know which. Any candidate that versions its review rubric owes a bridged comparison on common cases, which `06` §7 already requires for a moving baseline but does not currently require for a rubric edit.

---

**F7. SOURCE CLAIM. Evaluator drift over model versions is measured and large.** Between the March and June 2023 releases of the same named service, GPT-4's accuracy on prime-number identification moved from 84% to 51%, with reduced responsiveness to chain-of-thought prompting; GPT-4 also became more reluctant on sensitive questions, and both models produced more code-formatting errors [R7-S20, GPT-3.5 and GPT-4, arXiv 2023-07-18, rev 2023-10-31]. The authors conclude that identical services drift substantially within short timeframes and that continuous monitoring is necessary.

**INFERENCE.** A known-defect control is not a one-time qualification. It is a continuously re-run instrument check, and the interval must be shorter than the provider's release cadence, which the buyer does not control and is not told.

---

**F8. SOURCE CLAIM, and it carries a qualification this repository has not recorded.** The largest measured intervention in this entire corpus is withholding the producer's framing from the checker. On 250 vulnerability/patch pairs across five CWE-language combinations, detection on vulnerable files under neutral framing versus strong "bug-free" framing [R7-S12 v1, arXiv 2026-03-19]:

| Model (generation, 2026-03) | Neutral | "Bug-free" framing | Change |
|---|---|---|---|
| GPT-4o-mini | 240/247 (97.2%) | 9/247 (3.6%) | −93.5 pp |
| Claude 3.5 Haiku | 169/247 (68.4%) | 21/247 (8.5%) | −59.9 pp |
| DeepSeek V3 | 239/247 (96.8%) | 133/247 (53.8%) | −42.9 pp |
| Gemini 2.0 Flash | 236/247 (95.5%) | 196/247 (79.4%) | −16.2 pp |

Against an autonomous agent (Claude Code) on 17 vulnerabilities across 10 real projects, iterative adversarial refinement succeeded in 15/17 (88.2%) cases. Redacting the pull-request description recovered 11 of 16 missed detections (68.75%); adding an instruction to ignore commit metadata raised detection to 94% (16/17).

**The qualification, from the same paper, same table, which changes what the numbers mean.** Verbatim: *"All models exhibit high false positive rates even under neutral conditions, ranging from 68.4% (Claude 3.5 Haiku) to 96.8% (GPT-4o-mini) on patched code."* Per model, on patched (already fixed) files under neutral framing: GPT-4o-mini 242/250 (96.8%), Claude 3.5 Haiku 171/250 (68.4%), Gemini 2.0 Flash 232/250 (92.8%), DeepSeek V3 238/250 (95.2%). The authors attribute this to "pattern-based flagging without semantic analysis".

**INFERENCE, and it is a correction against `docs/03-system-design/MODEL-DIVERSITY.md` §0, which cites this study as its single strongest piece of evidence without the false-positive row.** Under neutral framing these judges say "vulnerable" to nearly everything. Detection of 97.2% alongside a 96.8% false-positive rate is not detection; it is a constant. What the framing manipulation moved was the **decision threshold**, not the **discrimination**. Debiasing by redaction restores an almost-always-flag regime, which is safe in the narrow sense that it fails closed, and useless as a gate because it cannot tell a fixed artifact from a broken one.

This does not overturn the recommendation to withhold producer framing. It reframes what withholding buys: it prevents an attacker or an optimistic producer from **silencing** the checker, and it buys nothing at all toward the checker's ability to **discriminate**. Those are different properties and the repository's current summary conflates them.

---

**F9. SOURCE CLAIM. Procedural independence has been measured directly once, and the effect is real, small, and on a low absolute base.** Cross-Context Review compared four conditions on 30 artifacts with 150 injected errors across 360 reviews [R7-S13, single author, arXiv 2026-03-12]:

| Condition | F1 | vs CCR |
|---|---|---|
| Cross-context review (fresh session, artifact only) | 28.6% | — |
| Subagent review (context-aware) | 23.8% | p=0.004, d=0.57 |
| Self-review (same session) | 24.6% | p=0.008, d=0.52 |
| Repeated self-review (same session, twice) | 21.7% | p<0.001, d=0.72 |

The control that carries the argument: reviewing twice in the same session did not outperform reviewing once (p=0.11). Extra compute in the producer's context buys nothing; **context separation is what moves the number**.

**INFERENCE.** Two readings must be held together. First, procedural independence is not a naming convention: a fresh context beats a subagent that carries the producer's context, at p=0.004, which is a measured difference between "second prompt" and "separate context" and is exactly what W5's two-arm probe is designed to detect. Second, **28.6% F1 is not a gate**. The best procedurally independent reviewer in the only direct study I found missed roughly seven of ten injected defects. Any candidate that proposes a same-family checker as the acceptance mechanism for a consequential effect is proposing an instrument whose only published measurement is in this range.

---

**F10. SOURCE CLAIM. Self-verification inside the producer's own context is the weakest arm and can be negative.** "In the context of reasoning, our research indicates that LLMs struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction" [R7-S18, ICLR 2024, arXiv 2023-10-03, rev 2024-03-14]. This corroborates the bottom row of R7-S13's table from a different task family and a different year.

---

**F11. SOURCE CLAIM. The producer's stated preference moves the judge independently of the artifact.** Five state-of-the-art assistants "consistently exhibit sycophancy across four varied free-form text-generation tasks"; preference models favour "convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time"; and "when a response matches a user's views, it is more likely to be preferred" [R7-S19, five assistants, arXiv 2023-10-20, last rev 2025-05-10].

**INFERENCE.** F-4's adverse variation, "the producer's rationale and preferred conclusion are made available to the checker", is not testing an exotic failure. It is testing the single best-documented behaviour of models trained on human preference data, and it has two distinct attack surfaces: the rationale (anchoring, F8) and the stated preferred conclusion (sycophancy, F11). A candidate that blinds one and not the other has closed half the door.

---

**F12. SOURCE CLAIM. Error correlation persists across providers and architectures, and rises with capability.** Across "over 350 LLMs overall, using two popular leaderboards and a resume-screening task": "on one leaderboard dataset, models agree 60% of the time when both models err"; "larger and more accurate models have highly correlated errors, even with distinct architectures and providers"; and the paper explicitly evaluates downstream effects on "LLM-as-judge evaluation" and frames the risk as algorithmic monoculture [R7-S12 is the framing paper; this is **R7-S09**, ICML 2025, arXiv 2025-06-09].

**INFERENCE, and it is uncomfortable for the obvious remedy.** Buying a second frontier family buys the *most correlated* available second opinion, because correlation rises with accuracy. A weaker, architecturally distant model is a better independence purchase and a worse reviewer. That tension is not resolvable by spending more, and it means "get a second vendor" is not a fix that scales with budget.

---

**F13. SOURCE CLAIM. There is a defect class that same-family verification provably cannot reach.** Self-consistent errors are those where models "repeatedly generate the same incorrect response across multiple stochastic samples". Inconsistent errors diminish as scale increases; self-consistent error frequency "remains stable or even increases". "All four types of detection methods significantly struggle to detect self-consistent errors." The intervention that worked was a cross-model probe using an external verifier's hidden states, which "significantly enhances performance on self-consistent errors across three LLM families" [R7-S10, EMNLP 2025 Main, arXiv 2025-05-23, rev 2025-09-08].

**INFERENCE.** This is the sharpest available answer to TC-37. Sampling one family N times is not N pieces of evidence about a family-level error, because the error is a property of the family, not of the draw. Three same-family checkers on a family-shaped blind spot return unanimous agreement with high confidence, every time, and the unanimity is the failure rather than the assurance. §7 of `06` already forbids treating panel agreement as assurance before joint false acceptance is measured; R7-S10 is the published reason that rule is correct.

---

**F14. SOURCE CLAIM. Juries of weaker, disjoint-family judges beat a single large judge, and the mechanism is family disjointness.** A Panel of LLM evaluators "composed of a larger number of smaller models outperforms a single large judge, exhibits less intra-model bias due to its composition of disjoint model families, and does so while being over seven times less expensive", across three judge settings and six datasets [R7-S17, arXiv 2024-04-29].

**INFERENCE.** The cited cause is "disjoint model families". This result does not transfer to a panel drawn from one family, and a candidate that cites juries to justify a same-family panel is citing a result whose stated mechanism it has removed.

---

**F15. SOURCE CLAIM. The evaluator effect is a property of evaluation, not of language models, and it was measured twenty-three years ago.** Hertzum and Jacobsen reviewed eleven studies across cognitive walkthrough, heuristic evaluation and thinking-aloud studies. Verbatim from the abstract: *"The average agreement between any two evaluators who have evaluated the same system using the same UEM ranges from 5% to 65%, and no 1 of the 3 UEMs is consistently better than the others."* The effect persists "for both novice and experienced evaluators, for both cosmetic and severe problems, for both problem detection and severity assessment, and for evaluations of both simple and complex systems" [R7-S21, IJHCI 15(1), 2003, pp. 183–204, primary PDF read].

The detail that converts this from an observation into a design rule, from the study by Jacobsen and colleagues reviewed therein:

| Measure | Value |
|---|---|
| Problems found by one evaluator analysing four users | 48 (average) |
| Problems found collectively by four evaluators | 93 |
| Problems detected by only a single evaluator | 46% |
| Problems detected by only two evaluators | a further 20% |
| Average increase in problems found, 1→2 evaluators | +42% |
| 2→3 evaluators | +20% |
| 3→4 evaluators | +13% |
| Any-two agreement on which problems are *severe* (CW / TA) | 28% / 20% |
| Average Spearman correlation on severity (three studies) | 0.31 · 0.24 · 0.23 |

And, verbatim: *"Not a single problem was unanimously judged as severe in these two studies."* In a separate cognitive-walkthrough study, 58% of the 33 problems detected collectively were detected only once, and "no single problem was detected by all evaluators". In two multi-laboratory thinking-aloud studies, 129 of 141 and 147 of 186 reported problems were each detected by only one laboratory.

**INFERENCE.** Union is worth a great deal and average is worth nothing. One evaluator recovers roughly half the collective finding set; four recover all of it; agreement on *severity* runs at 20 to 28 percent with rank correlations near 0.25. Read as a rule for this system: **a panel may aggregate findings by union and may not aggregate verdicts by vote or by mean.** That is the same conclusion the 2026-08-29 DECISIONS.md entry reached, and it now has a primary source with numbers rather than a corollary.

---

**F16. DIRECT OBSERVATION, and it is a correction against this repository.** The brief instructed me to treat the 2026-08-29 DECISIONS.md entry as a source claim. Its corollary reads: *"evaluators agree with each other 5-17% of the time while each finds 18-60% of the real problems"* [R7-S25]. `DESIGN-CAPABILITY.md` §14.2 and §15.40 repeat the same pair of ranges. `DESIGN-CAPABILITY.md` §6.1, in the same document, attributes to the same source a different figure: *"Any-two evaluator agreement on which problems exist · 5%–65% · Hertzum & Jacobsen 2003, verified"*.

Against the primary [R7-S21], §6.1 is right and §14.2, §15.40 and DECISIONS.md are not reproducible. The paper's stated range is 5% to 65%. The per-evaluator detection rates it reports are 59% and 45% for experienced and less experienced evaluators respectively, not 18% to 60%. I searched the primary for a 5–17% range and a 18–60% range and found neither; the nearest figures are the severity-agreement values of 20% and 28% and the "46% detected by a single evaluator" decomposition.

**I am not asserting the DECISIONS.md numbers are wrong**, because they may derive from a source I did not locate, possibly the LLM-judge arm of the same internal sweep rather than the Hertzum arm. I am asserting that they **cannot be traced from the repository's own citation**, that the same repository states the traceable version elsewhere, and that under protocol §7 an untraceable number cited as measurement is folklore. **The direction is unaffected and is strongly corroborated:** low pairwise agreement, each evaluator finding a largely distinct subset, and union far exceeding any single evaluator are all primary-verified above. Only the two numeric ranges fail to reconcile.

This is an instance of the failure mode this repository names about itself in `CLAUDE.md`: *"the orchestrator's brief is a defect surface nobody reviews."* A worker recorded 5%–65% with "verified" beside it; a synthesis two sections later rendered it 5–17%; the synthesis is what propagated into DECISIONS.md and into the brief I was given.

---

**F17. SOURCE CLAIM. Debate buys accuracy where the judge cannot check directly, and the evidence for anything wider is mixed.** Khan and colleagues report non-expert judge accuracy of 76% under debate versus 48% at baseline for LLM judges, and 88% versus 60% for human judges, and that "optimising expert debaters for persuasiveness in an unsupervised manner improves non-expert ability to identify the truth in debates" [R7-S14, arXiv 2024-02-09, rev 2024-07-25].

The countervailing measurement, from a larger protocol comparison: "debate outperforms consultancy across all tasks when the consultant is randomly assigned to argue for the correct/incorrect answer", but "in extractive QA tasks with information asymmetry debate outperforms direct question answering, but in other tasks without information asymmetry the results are mixed". Stronger debaters raised judge accuracy "though more modestly than in prior studies" [R7-S15, tasks spanning extractive QA, mathematics, coding, logic and multimodal reasoning, arXiv 2024-07-05].

**INFERENCE, and it decides against debate for F-4 specifically.** Debate's measured advantage is concentrated where the judge lacks access the debaters have. In fixture F-4 the checker holds the artifact. There is no information asymmetry to exploit, so the regime in which debate is measured to help is precisely the one F-4 is not in. Adding a debate round to F-4 would purchase the "mixed" result at the cost of two more same-family dispatches.

---

**F18. SOURCE CLAIM. Adversarial training of the checker against a deliberately sneaky producer improves checkability, and the improvement transfers to time-limited humans.** Prover-verifier games iteratively train "small verifiers to predict solution correctness, 'helpful' provers to produce correct solutions that the verifier accepts, and 'sneaky' provers to produce incorrect solutions that fool the verifier". Reported results: verifier robustness against adversarial attacks increased during training; helpful-prover accuracy improved; and human accuracy increased when verifying helpful-prover solutions and decreased when checking sneaky-prover output [R7-S16, arXiv 2024-07-18, rev 2024-08-01].

**INFERENCE.** The sneaky prover is the known-defect control, generated adaptively rather than planted by hand. This is the strongest available answer to the weakness Finding 19 identifies in hand-planted defects, and it is also the only mechanism in this corpus that improves a checker rather than merely measuring it.

---

**F19. SOURCE CLAIM, with a preserved disagreement, and it is a caution against the F-4 control as specified.** The known-defect control has a thirty-year evidence base in software engineering, and its central finding is not the reassuring one.

Just and colleagues report "a statistically significant correlation between mutant detection and real fault detection, independently of code coverage", and, per the search record, that "hand-seeded faults are not a good substitute for real faults, but mutants are" [R7-S22, FSE 2014; **primary not read** — the ACM Digital Library returned HTTP 403 to two fetch attempts; the first quotation is taken verbatim from R7-S23's citation of it and the second from a search summary. Confidence medium, corroboration partial].

Papadakis, Shin, Yoo and Bae contest it, and I read their abstract page directly: *"Empirical validation of software testing studies is increasingly relying on mutants... In contrast, our study shows that correlations are the results of the confounding effects of the test suite size... we find evidence that all correlations between mutation scores and real fault detection are weak when controlling for test suite size... Taken together, our data suggest that mutants provide good guidance for improving the fault detection of test suites, but their correlation with fault detection are weak."* Datasets CoreBench and Defects4J, large C and Java programs [R7-S23, ICSE 2018, abstract page read verbatim].

**The disagreement is preserved, per DIRECTIVE §6.** Both agree that seeded defects guide improvement. They disagree on whether a seeded-defect detection rate estimates a real-defect detection rate, with the later and larger study controlling for the confound the earlier one did not.

**INFERENCE for F-4.** The known-defect control tells you whether a checker is an always-pass checker. That is exactly what protocol §4 control 3 asks of it, and for that purpose it is sound and sufficient. It does **not** tell you what fraction of real defects the checker would catch, and both sources above caution against that reading, one directly (hand-seeded faults are not a valid substitute) and one indirectly (the correlation is weak once size is controlled). **A candidate that reports "the checker caught 9 of 10 planted defects" as evidence of real-world detection rate has committed the error both papers warn about.** The planted-defect rate is an upper bound on a capability, not an estimate of a rate.

---

**F20. SOURCE CLAIM, conflicted, corroborated where it matters.** Anthropic's published guidance ranks grader types: "Code-based graders are fast, cheap, objective, and reproducible" but "brittle to valid variations"; "Model-based graders are flexible, scalable, and capture nuance" yet are "non-deterministic" and "more expensive"; human graders are "gold standard quality" but "expensive" and "slow". It recommends that "LLM-based rubrics should be frequently calibrated against expert human judgment", that "to avoid hallucinations, give the LLM a way out, like providing an instruction to return 'Unknown' when it doesn't have enough information", and, on process versus outcome, that step-checking is "too rigid and results in overly brittle tests, as agents regularly find valid approaches that eval designers didn't anticipate", so "it's often better to grade what the agent produced, not the path it took" [R7-S24, vendor, 2026-01-09].

**Flagged as conflicted** under protocol §7: this is the vendor whose models are the producers, the checkers and the author of this report. It is not the sole support for anything here.

**INFERENCE, and it contradicts the vendor on one point.** The abstention instruction ("return Unknown") is exactly Rule 10 in this repository's own CLAUDE.md and exactly the `unresolved` disposition `06` §6 specifies; three independent derivations, adopt it. The outcome-over-process guidance is **wrong for this system as a general rule** and L06 already holds the counterexample: τ-bench compares final database state and explicitly acknowledges that a passing episode can omit required user confirmation [L06 S1]. In a system whose fixed boundaries include who may release an external effect, a grader that scores only the product cannot see a skipped authorisation. The vendor's guidance is calibrated to coding agents where the product is the whole obligation; `06` §6's row for "Step/run/workflow" already says the opposite and is right.

---

## 3. Source table

Confidence refers to the narrow use made here, not to general model performance. Expiry follows protocol §7: **R** reassess applicability by the date given or on a relevant model/domain change; **D** recheck documentation on version change; **M** review method applicability on violated assumptions.

| id | URL | Accessed | Source date | Type | P/S | Conf. | Conflict of interest | Corroborated by | Expiry | Invalidator |
|---|---|---|---|---|---|---|---|---|---|---|
| R7-S01 | https://arxiv.org/abs/2404.13076 | 2026-09-13 | 2024-04-15; NeurIPS 2024 | Controlled experiments, abstract read | P | med | academic/safety research | R7-S02, L06 S3 | R 2026-12-13 | self-preference absent under blinded calibration on current generation |
| R7-S02 | https://arxiv.org/abs/2410.21819 | 2026-09-13 | 2024-10-29, rev 2025-06-21; NeurIPS 2024 workshop | Research preprint, abstract read | P | med | workshop novelty | R7-S01 | R 2026-12-13 | perplexity explanation refuted; label-blinding shown sufficient |
| R7-S03 | https://arxiv.org/abs/2306.05685 | 2026-09-13 | 2023-06-09, v4 2023-12-24; NeurIPS 2023 | Benchmark paper, abstract verbatim | P | med (historical) | benchmark adoption | contradicted in interpretation by R7-S04 | R; historical only | superseded by chance-corrected re-analysis (already is) |
| R7-S04 | https://arxiv.org/html/2606.19544v1 | 2026-09-13 | 2026-06-17 | Large-scale empirical study, results read | P | high for its own measurements | preprint, unreviewed | R7-S25, R7-S08 | R 2027-06-17 | kappa deflation not reproduced on other judge cohorts |
| R7-S05 | https://arxiv.org/abs/2410.12784 | 2026-09-13 | 2024-10-16, rev 2025-04-05; ICLR 2025 | Benchmark paper, abstract verbatim | P | high for abstract claim; low for the 64%/50.86% detail | benchmark adoption | R7-S25 (different domain) | R 2026-12-13 | newer judges clear the benchmark materially |
| R7-S06 | https://arxiv.org/abs/2406.18403 | 2026-09-13 | 2024-06-26, rev 2025-06-02; ACL 2025 | 11 judges × 20 datasets, abstract read | P | med | academic | R7-S04 | R 2026-12-13 | variance across datasets shown to be task artifact |
| R7-S07 | https://arxiv.org/abs/2410.02736 | 2026-09-13 | 2024-10-03 | Bias quantification framework, abstract read | P | low-med (no numbers obtained) | preprint novelty | R7-S08 | R 2026-12-13 | CALM numbers obtained and contradict summary |
| R7-S08 | https://arxiv.org/pdf/2604.23478 | 2026-09-13 | 2026-05-07, v2 2026-05-11 | Benchmark, pp. 1–2 read verbatim | P | med-high | preprint, unreviewed | R7-S04 | R 2027-05-11 | flip rates fall below 5% on current judges |
| R7-S09 | https://arxiv.org/abs/2506.07962 | 2026-09-13 | 2025-06-09; ICML 2025 | 350+ models, abstract verbatim | P | high | academic | R7-S10 | R 2027-06-09 | cross-provider correlation falls with newer families |
| R7-S10 | https://arxiv.org/abs/2505.17656 | 2026-09-13 | 2025-05-23, rev 2025-09-08; EMNLP 2025 Main | Empirical, abstract read | P | high | academic | R7-S09 | R 2027-05-23 | a same-family method detects self-consistent errors |
| R7-S11 | https://arxiv.org/abs/2502.01534 | 2026-09-13 | 2025-02-03; ICLR 2026 | Contamination study, search-derived summary + abstract | P (read S) | med | academic | R7-S01, R7-S02 | R 2027-02-03 | leakage shown absent without distillation relationship |
| R7-S12 | https://arxiv.org/html/2603.18740v1 | 2026-09-13 | v1 2026-03-19, v2 2026-04-23 | Controlled + field study, Tables 1–2 read verbatim | P | med-high | preprint, attack-novelty incentive | R7-S19 (mechanism) | R 2027-03-19 | effect absent on current generation; note v1/v2 designs differ (250 pairs in Study 1; 17 CVEs in Study 2) |
| R7-S13 | https://arxiv.org/abs/2603.12123 | 2026-09-13 | 2026-03-12 | Single-author experiment, abstract read | P | low-med (N=30, one model) | single author, unreplicated | R7-S18 (direction only) | R 2027-03-12 | replication with cross-vendor arm |
| R7-S14 | https://arxiv.org/abs/2402.06782 | 2026-09-13 | 2024-02-09, rev 2024-07-25 | Experiments, abstract read | P | med | AI-safety research | partially contradicted by R7-S15 | R 2026-12-13 | debate gains absent on new judge generations |
| R7-S15 | https://arxiv.org/abs/2407.04622 | 2026-09-13 | 2024-07-05, rev 2024-07-12 | Protocol comparison, abstract verbatim | P | med-high | vendor-affiliated research lab | partially contradicts R7-S14 | R 2026-12-13 | debate shown to beat direct QA absent asymmetry |
| R7-S16 | https://arxiv.org/abs/2407.13692 | 2026-09-13 | 2024-07-18, rev 2024-08-01 | Training method, abstract verbatim | P | med | vendor research | R7-S19 | R 2027-07-18 | legibility gains fail to transfer beyond grade-school math |
| R7-S17 | https://arxiv.org/abs/2404.18796 | 2026-09-13 | 2024-04-29 | Empirical, abstract verbatim | P | med | vendor research (Cohere) | R7-S09 (mechanism) | R 2026-12-13 | PoLL advantage shown to survive within one family |
| R7-S18 | https://arxiv.org/abs/2310.01798 | 2026-09-13 | 2023-10-03, rev 2024-03-14; ICLR 2024 | Experiments, abstract verbatim | P | med (historical) | vendor research | R7-S13 | R; historical | current generation self-corrects without feedback |
| R7-S19 | https://arxiv.org/abs/2310.13548 | 2026-09-13 | 2023-10-20, last rev 2025-05-10 | Experiments, abstract read | P | med | vendor research (Anthropic) | R7-S12 | R 2026-12-13 | sycophancy eliminated by current post-training |
| R7-S20 | https://arxiv.org/abs/2307.09009 | 2026-09-13 | 2023-07-18, rev 2023-10-31 | Longitudinal measurement, abstract read | P | med (historical) | academic | R7-S08 | Historical; do not extrapolate | n/a; a dated observation |
| R7-S21 | https://mortenhertzum.dk/publ/IJHCI2003.pdf | 2026-09-13 | 2003; IJHCI 15(1) 183–204 | Peer-reviewed review of 11 studies, pp. 1, 6–11 read verbatim | P | high for its own domain | academic | R7-S25 direction; R7-S04 | M; transfer to model evaluators unvalidated | shown not to transfer from human to model evaluators |
| R7-S22 | https://dl.acm.org/doi/10.1145/2635868.2635929 | 2026-09-13 (403) | 2014; FSE 2014 | Empirical study | S (primary unreachable) | med | academic | quoted by R7-S23 | M | primary read and found to differ |
| R7-S23 | https://coinse.github.io/publications/pdfs/Papadakis2018hi.pdf | 2026-09-13 | 2018; ICSE 2018 | Empirical study, abstract page read verbatim | P | high for abstract claim | academic | contradicts R7-S22 | M | size confound shown not to explain the correlation |
| R7-S24 | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | 2026-09-13 | 2026-01-09 | Vendor engineering guidance | P | med for capability claims | **conflicted: vendor of the producer, checker and this author** | R7-S05 (deterministic-first), L06 S1 (contradicts outcome-only) | D on page revision | guidance revised |
| R7-S25 | repo: `.claude/memory/DECISIONS.md` 2026-08-29; `docs/03-system-design/DESIGN-CAPABILITY.md` §6.1, §14.2, §15.40 | 2026-09-13 | 2026-08-29 | Internal decision record + internal research sweep | P for the decision; S for its cited figures | high for the decision, **low for the 5–17% / 18–60% pair** | authored inside this system | R7-S04, R7-S05, R7-S21 for direction | R 2026-11-17 | see Finding 16 |
| R7-S26 | repo: `docs/03-system-design/MODEL-DIVERSITY.md` | 2026-09-13 | 2026-08-15 | Internal research document | P for repo measurements; S for external | med; §0 summary corrected by Finding 8 | authored inside this system | R7-S09, R7-S12 | R 2026-11-15 | runtimes it measures have already rotted by its own §1.4 |

**Not obtained, and named rather than filled.** Exact CALM per-bias numbers from R7-S07. The "roughly 10–25% uniform self-preference bias" figure that `MODEL-DIVERSITY.md` attributes to R7-S02: **I could not confirm it in the primary abstract and I am not repeating it as measurement.** Any published direct comparison of a blinded same-family reviewer against a cross-family reviewer on one defect corpus: I searched and found none, which corroborates `MODEL-DIVERSITY.md` §4's statement that "nobody has published that comparison". Cross-family judge kappa ranges surfaced by search (0.74–0.84, 0.89–0.97) had no identifiable primary and are **excluded**.

---

## 4. Per-claim verdicts for every R7 claim

Two claims in `00-thesis-claims.json` carry `lane: R7`. No others.

### TC-11 — "A verifier that is a separate executor detects defects a producer's own self-check misses, at a rate high enough to justify the extra work." (kind: contested)

**Verdict: FIRST CLAUSE SUPPORTED, SECOND CLAUSE UNRESOLVED — and the second clause cannot be settled by any source located, because the measure the claim itself names has never been taken.**

*First clause, supported.* R7-S13 measures it directly on 30 artifacts with 150 injected errors: a separate-context reviewer reaches 28.6% F1 against 24.6% for same-session self-review (p=0.008, d=0.52) and 23.8% for a context-carrying subagent (p=0.004, d=0.57). R7-S18 corroborates the direction on reasoning tasks from a different year and task family: intrinsic self-correction without external feedback fails and sometimes degrades performance. The decisive internal control is that reviewing twice in the same session did not beat reviewing once (p=0.11), so the gain is attributable to separation and not to additional compute.

*Second clause, unresolved, and the gap is precise.* The claim's own `measure` field asks for three quantities: known-defect detection rate under planted defects, **joint false-acceptance rate across the producer/verifier pair on the same planted set**, and a clean-case control. I found no study that measures the second. R7-S09 and R7-S10 establish that joint false acceptance must be substantial for family-level self-consistent errors, but neither measures a producer/verifier pair on a planted defect set. Under `06` §7 ("Measure joint false acceptance on controlled defects before treating panel agreement as extra assurance") that is precisely the missing measurement, and the package is right that it is missing.

*Three qualifications the claim should carry forward.* First, the only direct measurement of the effect is a single-author, single-model, N=30 study; the package should not treat 28.6 versus 24.6 as a stable estimate. Second, the absolute level matters more than the margin: **the best arm missed roughly 71% of injected defects**, so "detects defects a self-check misses" is true and "is a checker you can accept work on" does not follow from it. Third, per Finding 19, a planted-defect detection rate is an upper bound on real-defect detection, not an estimate of it, so even a good number on the planted corpus would not license the "high enough to justify" conclusion.

*Disposition.* Class **(c)** under protocol §5: an empirical hypothesis that carries an adequate evaluation protocol. It has a baseline (producer self-check), a unit (planted defect), a repetition rule (`06` §7's five trials per case), a stopping rule and an owner. It does not block.

---

### TC-37 — "Whether independent verification is achievable when producer and verifier share a model family is unresolved." (kind: unknown)

**Verdict: CONFIRMED AS UNRESOLVED IN GENERAL, AND NOW DECIDED IN THE NEGATIVE FOR ONE NAMED ERROR CLASS. The claim should be split.**

The word "independent" is doing two jobs and the evidence separates them cleanly.

**Decided in the negative: independence of *error*.** R7-S10 establishes a defect class, self-consistent errors, whose frequency is stable or rising with scale, which all four families of detection method struggle to detect, and whose only working remedy in that study was a **cross-model** probe across three LLM families. R7-S09 establishes at 350-model scale that error correlation persists across distinct architectures and providers and **rises with capability**, so the same-family case is the worst case of a phenomenon that survives even the remedy. R7-S02 adds that the self-preference mechanism is plausibly familiarity over text rather than recognition of authorship, so no blinding procedure reaches it. Taken together: **for family-level correlated error, same-family verification is not independent and no procedure makes it so.** That is no longer unknown.

**Achievable, and measured: independence of *influence*.** Four error sources are demonstrably reducible by procedure alone, within one family, at no vendor cost:

| Error source | Intervention | Measured effect | Source |
|---|---|---|---|
| Anchoring on producer framing | Withhold rationale and metadata from checker | Detection recovery from 3.6% to 94%; but see Finding 8 on what "detection" means here | R7-S12 |
| Same-context contamination | Fresh context, artifact only | 28.6% vs 24.6% F1, p=0.008 | R7-S13 |
| Sycophancy toward stated conclusion | Withhold the producer's preferred conclusion | Not separately quantified; mechanism established | R7-S19 |
| Self-assessment | Producer never accepts own work | Intrinsic self-correction degrades | R7-S18 |

**The honest statement for F-4, and it is the answer the fixture asks for.** Under one model family, "independent" can honestly mean: *the checker did not produce the artifact, did not share the producer's context, did not receive the producer's rationale or preferred conclusion, and did not select its own evidence.* It cannot honestly mean: *the checker's errors are uncorrelated with the producer's.* A candidate that states the first and implies the second has laundered the disclosure the protocol §1 forbids laundering.

**Still genuinely unknown, and it is a smaller question than the claim states.** Whether the residual family-correlated error is large or small *on this system's actual defect distribution* is unmeasured, and I found no published measurement that would settle it. `MODEL-DIVERSITY.md` §4 reaches the same conclusion independently and calls the missing instrument by name: a seeded-defect corpus.

*Disposition.* Class **(c)**, not **(d)**. It does not block, because `06` §6–§7 already specifies the behaviour that follows from the negative half: the producer may supply self-checks but "cannot become sole independent acceptor by changing role labels", a different model family "is not a proof of independent error", and joint false acceptance must be measured before panel agreement counts. The specification is already correct on this point; what is missing is the measurement, not the decision.

---

## 5. Assumptions · Unknowns · Competing interpretations

**Assumptions.** That published measurements on GPT-4-class, Claude-3.5-class and 2026-generation judges transfer directionally to the models this system will run, which protocol §7 requires be flagged and which I flag here for every measured effect in §2. That abstracts and results sections I read verbatim represent the papers' full findings; for R7-S22 I could not read the primary at all. That this repository's internal figures are honestly reported, which Finding 16 partially qualifies. That a defect can be planted in an artifact without changing the artifact's other properties, which mutation-testing literature treats as non-trivial.

**Unknowns.**
- The joint false-acceptance rate of a same-family producer/checker pair on a controlled planted-defect set. Nobody has published it. It is the quantity TC-11 names and the quantity `06` §7 requires.
- Whether a blinded same-family checker matches a cross-family checker on one defect corpus. Searched; no published comparison found.
- The magnitude of self-preference bias as a percentage. The "10–25%" figure circulating in this repository could not be confirmed against the primary and is marked UNVERIFIED.
- Whether the evaluator effect measured on human evaluators in 2003 [R7-S21] transfers quantitatively to model evaluators. The direction is corroborated; the magnitudes are not transferable and I do not transfer them.
- Whether this system's real defect distribution resembles any planted corpus anyone would construct. Finding 19 says this is the question that decides whether the F-4 control means anything beyond always-pass detection.
- The provenance of the 5–17% and 18–60% figures in DECISIONS.md.

**Competing interpretations, preserved rather than resolved.**

*One.* Whether seeded defects estimate real-defect detection. R7-S22 says mutants do and hand-seeded faults do not; R7-S23 says all such correlations are weak once test-suite size is controlled. The later study is larger and controls the confound; I do not conclude from that that it is right, because the two measure different dependent variables (correlation of mutant kills with fault detection, versus actual fault detection of mutation-guided suites), which R7-S23's own introduction notes. **Retained as an unresolved design input.** The practical consequence is identical under either reading: use the control to detect an always-pass checker, do not use it to publish a detection rate.

*Two.* Whether the right response to family-correlated error is to buy a second family or to stop relying on model judgement for the affected decisions. R7-S17 and R7-S10 support the first; R7-S09 undercuts it by showing correlation rises with capability, so the best second opinion is the most correlated one; R7-S05 and R7-S25 support the second by showing that model judgement on objective correctness is near chance regardless of family. **I do not resolve this. It is a decision, and §6 of my operating procedure forbids me to recommend.**

*Three.* Whether a near-chance judge is useless. R7-S05 and R7-S25 say it is useless as a **scorer**. R7-S21 says an evaluator that agrees with its peers 20% of the time is nonetheless recovering roughly half of a collective finding set that no single evaluator reaches, which makes it valuable as a **finder**. These are not in conflict once the two jobs are separated, and the separation is the finding. They are in conflict for any design that uses one panel for both jobs.

---

## 6. Useful mechanisms · Rejected mechanisms

### Useful mechanisms

Each names the problem it solves, what it buys, and what it does not buy **under one model family**.

**M1. Deterministic oracle before any model checker.** *Problem:* judge unreliability, in all its forms. *Buys:* the only source of independence with zero model correlation, because no model is in the loop. Corroborated by R7-S24 (vendor, "fast, cheap, objective, and reproducible") and by R7-S05 (where a deterministic ground truth exists, model judges are near chance against it). *Does not buy:* process compliance. L06 S1's τ-bench result is the standing counterexample: a passing episode can omit a required user confirmation. An oracle that compares destination state cannot see a skipped authorisation.

**M2. Provenance separation as an executable predicate, not a declaration.** *Problem:* anchoring and sycophancy. *Buys:* the measured differences in R7-S12 and R7-S13, at zero cost, and a checkable property: the checker's stated inputs are the artifact plus the acceptance criteria, and the transcript proves it. *Does not buy:* anything against family-correlated error (R7-S10), and it must be **checked at the input**, not asserted in a role name.

**M3. The known-defect control, scoped to always-pass detection only.** *Problem:* a checker that never refuses. *Buys:* exactly what `06` §6 asks of it, "an always-pass reviewer must fail the known-defect control", and protocol §4 control 3. *Does not buy:* a real-world detection rate (Finding 19, both readings).

**M4. The clean-case control, mandatory and paired.** *Problem:* the indiscriminate rejecter, which is the failure R7-S12's false-positive data shows is the *normal* state of a neutrally framed security judge (68.4% to 96.8% on patched files). *Buys:* discrimination as a measured quantity rather than a sensitivity measured alone. *Does not buy:* anything about severity ranking, where R7-S21 measures any-two agreement at 20–28%.

**M5. Union aggregation of findings; no vote, no mean, no aggregate score.** *Problem:* weak evaluators whose disagreement is signal, not noise. *Buys:* R7-S21's measured structure: 46% of problems found by exactly one evaluator, one evaluator recovering 48 of 93, marginal gains of +42%/+20%/+13% for evaluators two, three and four. *Does not buy:* a verdict. A union of findings is an input to a decision, and `06` §6 already assigns release authority elsewhere.

**M6. Adversarial generation of the defect, not hand-planting.** *Problem:* planted defects test only the defects the planter thought of (Finding 19). *Buys:* R7-S16's measured result, that training a checker against a sneaky producer raises its robustness and that the gain transfers to time-limited human checkers. *Does not buy:* a guarantee, and it is the most expensive mechanism here.

**M7. Chance-corrected reporting of every agreement figure.** *Problem:* exact-match agreement overstates discrimination by 33.8 to 41.2 points (R7-S04). *Buys:* an instrument reading that does not silently flatter itself. *Does not buy:* validity; R7-S04's whole point is that a reliable judge can still be an invalid one.

**M8. Rubric and prompt versions treated as instrument changes requiring a bridge.** *Problem:* R7-S08's measured flip rates of 8.5% to 61.3% under semantically equivalent rephrasing. *Buys:* comparability across time. *Does not buy:* stability within a version, which R7-S08 shows is model-dependent and not predicted by scale.

**M9. Abstention as a first-class verdict.** *Problem:* a checker forced to choose produces a coin flip. *Buys:* triple-derived support: R7-S24's "give the LLM a way out", this repository's Rule 10, and `06` §6's `inconclusive` phase. *Does not buy:* coverage. An abstaining checker leaves the work undone and someone must own it.

**M10. Human calibration on a fixed set, re-run on a schedule shorter than provider release cadence.** *Problem:* R7-S20's measured 84% to 51% drift in three months on an unchanged service. *Buys:* detection of instrument drift. *Does not buy:* independence; R7-S21 measures the human evaluator effect at 5–65% any-two agreement, so the human anchor is itself a noisy instrument and must be reported with its own uncertainty.

### Rejected mechanisms

**R1. Vendor identity as the independence predicate.** Rejected because R7-S09 measures correlation persisting "even with distinct architectures and providers" and rising with accuracy, so the strongest second opinion is the most correlated one. This repository already reached the same conclusion and already acted on it. Vendor diversity is real and is the fourth-best available independence here, not the definition of it.

**R2. Panel unanimity as assurance.** Rejected on R7-S10: the errors that survive scaling are the ones every instance of the family makes identically, so unanimity on a family-shaped blind spot is the failure signature, not the pass condition. `06` §7 already forbids it.

**R3. Debate rounds in F-4.** Rejected for this fixture specifically. R7-S15 measures debate beating direct question-answering in extractive QA **with information asymmetry**, and "mixed" results without it. F-4's checker holds the artifact, so there is no asymmetry to exploit, and the debate machinery would purchase the mixed result at the cost of additional same-family dispatches. R7-S14's larger effect (76% vs 48%) is measured in the asymmetric regime.

**R4. Averaged or weighted multi-dimension scores.** Rejected on R7-S21's severity data: any-two agreement of 20–28%, Spearman 0.23–0.31, and not one problem unanimously judged severe across two studies. Averaging instruments that disagree at that level manufactures a number with no referent. `06` §6's per-subject separate judgments and protocol §2's "no aggregate score" are the correct design and now have a primary source.

**R5. Removing author labels as the independence mechanism.** Rejected on R7-S02: if self-preference tracks perplexity, the preference is over the text and the label is not where it lives. Label removal is cheap and harmless; it is not the mechanism and should not be named as one.

**R6. A second same-family sample as a second opinion.** Rejected on R7-S13's own control (repeated same-session review did not beat single review, p=0.11) and R7-S10. Repetition within a family buys recall on independent draws, which is a real and different benefit, and buys nothing for precision.

**R7. Reporting planted-defect detection as expected real-defect detection.** Rejected on Finding 19 under both readings of the disagreement.

---

## 7. Failure cases

Each is stated with the observation that discriminates it. None is an observed incident in this system; there is no runtime.

| Failure | What it looks like from inside | Discriminating observation |
|---|---|---|
| **Always-pass checker** | A clean verdict history and rising throughput | Plant a known defect. `06` §6 already requires this. Note that a 100% pass history is the expected appearance of both a perfect producer and a broken checker |
| **Always-fail checker, the half usually forgotten** | High "detection", a checker that looks vigilant | Submit a correct artifact. R7-S12's 68.4–96.8% false-positive rate on patched files is the published demonstration that this is the *normal* state of a neutrally framed security judge, not an exotic case |
| **Evaluator collusion, as distinct from correlated error** | Panel agreement | Not distinguishable from correlation by agreement alone. L06 S5 already records that correlated favourable judgments do not demonstrate cooperation. The discriminator is joint false acceptance on planted defects where the defect was never visible to both, plus whether the panel roster came from committed configuration or from a runtime choice by the party under review |
| **Laundered independence** | A review that states procedural independence in its own words, as protocol §1 requires | Check the checker's *stated inputs* against its *actual delivered inputs*, which `06` §2 already specifies the loader records ("The caller's claimed read list is not trusted"). A review that says it did not read the producer's rationale, in a system where nothing recorded what it read, is an assertion |
| **Preference leakage through shared state** | No producer rationale anywhere in the checker's prompt, and bias anyway | R7-S11. The shared source of truth the founder's thesis proposes is a leakage channel: a canonical record written by the producer and read by the checker carries the producer's framing without carrying the producer's rationale. Discriminator: two arms, one where the checker reads the shared record and one where it reads only the artifact and the criteria |
| **Drift by rubric edit** | Verdicts change; nobody changed the code | R7-S08. Bridge on common cases across rubric versions, as `06` §7 requires for a moving baseline |
| **Drift by provider release** | Verdicts change; nobody changed anything | R7-S20. Re-run the fixed pool on a schedule shorter than release cadence |
| **Reproducible invalidity** | Test-retest above 0.95, stable dashboards | R7-S04's consistency–bias paradox. Discriminator: counterfactual probes. `06` §8 already names this: "Counterfactual evaluator checks can reveal an instrument that stopped responding even while its average score looks stable" |
| **Sample selection by the producer** | Good numbers | `06` §5 already forbids it: "A producer cannot choose all adverse samples, delete failed attempts, alter expected answers or activate its new evaluator". The observation is the denominator, reconciled from an independent counting point |
| **Summary distortion in the acceptance chain** | A verdict that is accurate and a summary of it that is not | Finding 16 is a live instance inside this repository: a worker recorded 5%–65% with "verified" beside it and a synthesis rendered it 5–17%, which propagated into a decision record and into a lane brief. The discriminator is re-derivation from the primary, which is why protocol §1's "compute rather than trust" is the right rule |

---

## 8. Implications for this system

Bound to the fixed boundaries of protocol §1 and the six fixtures of §3. **I reopen no fixed boundary and I route no decision packet**; nothing below requires one.

**On F-4, which is this lane's fixture.** The fixture asks for "the checker's stated inputs, the known-defect control failing, and an honest account of what 'independent' can mean in one model family". The third item now has an answer with sources: independence of *influence* is achievable and measurable by procedure; independence of *error* is not achievable within one family for the self-consistent class, and no procedure converts one into the other (Finding 13, TC-37 verdict). **A candidate that writes this sentence and names the residual is compliant. A candidate that writes "independent verification" without the split is not.**

Three amendments the fixture needs, all of which strengthen it and none of which weakens a criterion.

*First, F-4's adverse variation is currently under-specified and the specification's own §7 knows it.* The fixture plants a known defect and makes the producer's rationale available. It does not require the **paired clean case**. Protocol §4 control 3 does pair them ("*Paired with:* a correct artifact, which it must still pass") and `06` §7 requires "clean valid controls detect indiscriminate rejection". F-4's own table does not. Given R7-S12's false-positive data, **an unpaired known-defect control cannot distinguish a working checker from a checker that refuses everything**, and refusing everything is the measured default behaviour of the closest published analogue. This is a **(b)**-class gap, a documented mechanism whose deployment in the fixture is incomplete, not a **(d)**.

*Second, F-4's two arms should be three.* W5 specifies rationale withheld versus rationale supplied. R7-S19 and R7-S12 identify two distinct channels: the producer's **reasoning** (anchoring) and the producer's **preferred conclusion** (sycophancy). A candidate can blind the first and leak the second through a status field, a verdict draft or a shared-state record. R7-S11 makes the shared-state channel specific rather than hypothetical, and it is the founder's own proposed architecture, so it is exactly the channel this round must probe.

*Third, "a measurable difference between arms" needs a stated floor.* W5's failure condition is "fails if 'independent' means only a second prompt, a second name, or a second copy of the same context". R7-S13 gives the shape of a real difference: separate context beat context-carrying subagent at p=0.004, and repeated same-context review did not beat single review at p=0.11. **The second result is the control that makes the first mean something**, and a candidate should be required to show it, because a candidate that reports only an improvement has not excluded "more compute" as the explanation.

**On the other five fixtures, where this lane's evidence reaches.**

*F-1, an unknown kind of job.* The acceptance owner for a job nobody anticipated is a judgement call with no fixed pool and no regression case. R7-S05 says model judgement on novel objectively-checkable material is near chance. The implication is not that F-1 needs a better judge; it is that F-1's acceptance owner must be a **human or a deterministic predicate**, and a candidate that routes novel-work acceptance to a model checker has put its weakest instrument at its highest-variance point.

*F-2, demand at 4×.* Under capacity pressure, verification is the cheapest thing to shed and the last thing that should be shed. `06` §8 already states the rule: "Protected checks and due service cannot be silently starved to improve scores." The measurable tell is a rising pass rate as load rises, and that should be a registered alert, not a discovery.

*F-3, three permissions.* Out of this lane's scope except in one respect: the checker must not hold the permissions of the work it checks. This is the same structural argument as `reviewer` carrying no `Write` in this repository's own harness, and it is enforceable by configuration rather than by instruction.

*F-5, handoff across a capacity reset.* R7-S20's measured drift is the reason a resumed attempt cannot trust a verdict taken before the gap without re-deriving the instrument's calibration. `06` §5's `EvidenceBaseVersion` pins the evaluator version; what it does not pin, and cannot, is the provider's silent update to the model behind that version. A resumed attempt should treat a pre-gap model verdict as **stale**, in the same class as a pre-gap source fact.

*F-6, founder absent for a week.* R7-S21 measures the human anchor at 5–65% any-two agreement, so the founder is not an oracle either; he is a differently-correlated instrument whose errors are uncorrelated with the family's, which is the whole of his value here. The design implication is that the founder's week of absence costs the system its only cross-family error source, and a candidate should say what it does not accept during that week for that reason.

**On the comparator, B0.** Protocol §6 requires every candidate to be compared against one long-context session plus deterministic scripts plus one shared record. This lane's evidence is mixed for B0 and I preserve it rather than resolving it. Against B0: R7-S13 and R7-S18 measure same-context self-review as the worst arm, and B0 has no separate context by construction, so B0 has no verification independence of any kind. For B0: R7-S05 and R7-S25 say model judgement of quality is near chance, so a candidate whose advantage over B0 is "it adds a checker" is claiming an advantage worth roughly four F1 points on a 28.6% base, against B0's legitimate strength of a record one person can read end to end. **B0 plus deterministic scripts plus human acceptance is, on this lane's evidence, not obviously worse than B0 plus deterministic scripts plus a same-family checker.** That is a finding, not a recommendation, and R8 and the synthesis own what follows from it.

**On the standing caveat.** Every "sufficient" this round produces is specified behaviour checked offline by reviewers of one model family with procedural independence only. This lane's contribution is to say what that caveat costs in measurable terms rather than as a disclaimer: reviewers in this round share the error class R7-S10 describes, cannot detect it by agreeing, and are subject to the familiarity preference R7-S02 describes, which blinding does not remove. The caveat is not ceremony. It is the accurate description of a known limitation with a published magnitude.

---

## 9. Questions other lanes may have missed

**On shared state, which is the founder's central proposal.** Does the shared source of truth become the preference-leakage channel that defeats provenance separation (R7-S11)? If a producer writes its framing into the canonical record and a checker reads the canonical record, the checker has the producer's framing without anyone having passed it a rationale, and every provenance check in the system passes. **Who decides what a producer may write into shared state that a checker will later read?** R1 and R5 may own the state model; this is the question their model has to answer for W5 to mean anything.

**On the founder's five criteria.** "Independent verification" is the fifth reason an agent earns its existence in the founder's thesis. This lane finds that the criterion is **half achievable** by procedure and **not achievable** for one named error class within a family. Does a criterion that is only half satisfiable still justify creating a separate agent, or does it justify creating a separate *context* and a separate *input set*, which are cheaper and are what the measured effect actually attaches to (R7-S13)? R2 owns the unit-of-justification question (TC-36); this is the same question arriving from the evidence side.

**On who checks the checker's inputs.** `06` §2 says the loader records actual delivered inputs and "the caller's claimed read list is not trusted". Does that apply to the **checker's** loader? If a checker's context is assembled by the same mechanism the producer's is, and nothing separately attests what the checker received, then the independence claim rests on a record the system generated about itself. R1 may have this; it is not visible from the specification text.

**On the cost of the instrument.** `06` §8 requires registering evaluation's expected information value and budget before running it. This lane can price one side: at 28.6% F1, a same-family checker costs a dispatch and returns a finding set that misses most defects. **At what detection rate does a checker stop being worth its capacity under CP1 concurrency?** R8 owns capacity; this is the number that decides whether the verification mechanism survives F-2.

**On the human anchor's own error rate.** Every design in this package eventually routes to human acceptance. R7-S21 measures human evaluators at 5–65% any-two agreement and 20–28% agreement on severity, with no problem unanimously judged severe. **Nothing in the package states an expected human error rate or requires it to be measured.** The founder-competence mechanism (CAP-level, `04-human-operation.md`) assumes the founder can detect a misleading summary; that is an empirical claim about a human instrument and it has the same status as a claim about a model instrument.

**On whether "no runtime exists" is protecting a wrong number.** Every measurement this lane cites is about someone else's system. The one instrument this repository could build cheaply and has repeatedly deferred is the seeded-defect corpus, named in `MODEL-DIVERSITY.md` §6 Step 3 and in `CONTROL-PLANE.md`. **Until it exists, every statement anyone makes about this system's verification quality, including every statement in this report, is a transfer from published work on other systems.** That is a gap, and naming it is the honest end of this lane.

---

*Return format note: `claims_emitted: []`. Six findings here carry a `valid_until` and warrant ledger registration, and the append tool was not available in this session. Findings 3, 5, 8, 12, 13 and 16 are the ones a ledger-capable agent should register, with expiry dates as given in the source table.*