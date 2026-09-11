# Round 1 · truth-and-quality

*Salvaged from the workflow journal. The lane ran as a `sourcer`, which has no Write tool,
so it could not author its own file; this is its structured return rendered as prose.*

## Headline

Truthfulness is buildable only if every belief carries a computed provenance grade, a volatility-derived expiry that lapses loudly rather than silently, and a priced "cheapest next check" — and if independence between reviewers is a measured error-decorrelation number rather than a label.

**Fields covered:** 13, 14, 32, 40, 41, 43, 49, 50

## Claims

### 1. [measured]

NOT WRITTEN TO DISK: this lane has no Write, Edit or Bash tool (tools are Read, Glob, Grep, WebSearch, WebFetch plus the claim-append MCP server), so the artifact could not be created at the requested path. The complete document is in this lane's final assistant message and must be copied verbatim to docs/03-system-design/final-v3/round-1/truth-and-quality.md by an agent that has Write.

**Basis:** measured — tool list available to this agent

### 2. [reasoned]

Measured/told/inferred needs six grades, not three: OBSERVED, RETURNED, ATTESTED (our own producer's self-report), REPORTED, DERIVED, RECALLED. The grade must be COMPUTED as the weakest link in the chain and an inference may never raise it — otherwise three RECALLED facts combine into a conclusion that reads as OBSERVED because it is stated in the same voice.

**Basis:** reasoned, anchored on ICD 203 Distinctions and ISA 580 (https://archive.dni.gov/files/documents/ICD/ICD-203.pdf, https://www.ifac.org/system/files/publications/files/A033%202012%20IAASB%20Handbook%20ISA%20580.pdf)

### 3. [sourced]

ISA 580 settles 'should the maker judge it': a written representation from the party who did the work 'do[es] not provide sufficient appropriate audit evidence on their own about any of the matters'. So the maker must STATE (it is the only source that knows what it skipped) and must never CLEAR. IESBA adds that self-review is disqualifying regardless of size — 'materiality of the outcome... is not a relevant factor'.

**Basis:** https://www.ifac.org/system/files/publications/files/A033%202012%20IAASB%20Handbook%20ISA%20580.pdf and https://ifacweb.blob.core.windows.net/publicfiles/2024-03/Summary%20-%20Prohibition%20List%20for%20PIE%20Audit%20Clients%20(Final).pdf

### 4. [sourced]

Agreement between two similar judges is correlation, and it is now quantifiable: 'LLM-as-a-judge scores favor models similar to the judge', and 'model mistakes are becoming more similar with increasing capabilities'. Therefore report an EFFECTIVE REVIEWER COUNT derived from measured error-decorrelation on a seed corpus, not a headcount. Registered as c-llm-judges-favor-similar-models.

**Basis:** https://arxiv.org/abs/2502.04313 (fetched, quote verified by the claim-source resolver at append time)

### 5. [reasoned]

The cheapest genuinely independent perspective is NOT a second model family — that is fifth. Ranked by decorrelation per unit cost: (1) different artifact (run it, don't read it), (2) different question ('produce the failing case', not 'is this good'), (3) different representation, (4) different time with the conclusion hidden, (5) different model family, (6) different person. Items 1-4 run in a single-vendor runtime; a design resting on (5) silently degrades to single-family while still reporting 'independent'.

**Basis:** reasoned, from the CAPA convergence trend plus single-vendor runtime constraint

### 6. [reasoned]

Keeping a checker from agreeing by default needs a mechanism, not an instruction, because sycophancy is the trained-in prior: five frontier assistants show it across four tasks and 'both humans and preference models prefer convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time'. Two mechanisms: seeded known-bad work in the live review queue (mutation testing pointed at the reviewer), and a blind-then-sighted protocol where the blind-to-sighted revision delta is a continuously-running per-reviewer sycophancy meter costing one extra turn.

**Basis:** https://arxiv.org/abs/2310.13548 for the prior; the two mechanisms are reasoned

### 7. [sourced]

How a check stops checking while still passing, and the cure. Equifax's traffic-monitoring device was inactive 19 months on an expired certificate and inspected zero packets; Boeing found the 737 MAX AOA Disagree alert inoperative on most airframes in 2017 and did not tell the FAA until after Lion Air. Cure: every check must report the POPULATION it examined ('examined: 0, passed' is structurally REFUSED, never pass) and must carry a negative control that runs in the SAME invocation, not a separate suite. A check whose negative control passes is auto-disabled.

**Basis:** https://oversight.house.gov/wp-content/uploads/2018/12/Equifax-Report.pdf and https://boeing.mediaroom.com/news-releases-statements?item=130431; the watchdog pattern per https://training.promlabs.com/training/monitoring-and-debugging-prometheus/metrics-based-meta-monitoring/end-to-end-watchdog-alerts/

### 8. [reasoned]

Discovering long-running wrongness needs three non-overlapping detectors because every instrument reports normal by definition: (a) BLIND differential re-derivation of past decisions from today's evidence with the old conclusion withheld, output being a drift RATE not a verdict — the silent-data-corruption method, where Meta found hundreds of bad CPUs only by re-running, since SDCs 'are not captured by error reporting mechanisms within a CPU'; (b) a load-bearing register ranking beliefs by dependency x age-since-first-hand-check (Horizon sat at the top of that list for two decades and nobody computed it); (c) Brier-scored calibration back-test, because a calibrated system can be wrong often and stay safe to delegate to, while a miscalibrated one makes every confidence-reading gate decorative.

**Basis:** https://arxiv.org/abs/2102.11245 and https://journals.sas.ac.uk/deeslr/article/download/5226/5073/9232; the three-detector design is reasoned

### 9. [reasoned]

Expiry must not fail closed by default. A due belief becomes LAPSED — a third value that propagates, making dependents conditional and downgrading the ACCOUNT rather than stopping work — with a single visible 'lapse debt' number leading the owner's morning view, payable, waivable-with-expiry, or retirable but not ignorable. Fail closed only where the guarded act is irreversible, spends money, or reaches a stranger. Cloudflare's 18 Nov 2025 outage was a deliberately chosen fail-closed hard limit: exceeding it meant 'the system panicking', and because the bad file regenerated every five minutes the intermittency was initially read as an attack.

**Basis:** https://blog.cloudflare.com/18-november-2025-outage/; the LAPSED design is reasoned

### 10. [sourced]

Scoring shapes the vocabulary of uncertainty, so design the scoring rule before the vocabulary. Under binary grading that scores abstention as zero, models are 'optimized to be good test-takers, and guessing when uncertain improves test performance'. A system whose internal evaluation penalises 'I could not determine' will be trained by its own eval to bluff, and every truth mechanism downstream is then built on a liar. Hence: a DISCLAIMED day must cost the system nothing and must be positively credited by a proper scoring rule.

**Basis:** https://arxiv.org/abs/2509.04664

### 11. [reasoned]

Evaluation of open-ended work: refuse the single score and run five instruments chosen to disagree (frozen adversarial set built from RETIRED REAL WORK; owner-graded rolling sample stratified by consequence; lagging reality outcomes; abstention quality under a proper scoring rule; realised cost of being wrong). Anti-Goodhart controls that are mechanisms: holdout inaccessible by capability not policy; rubric changes versioned with an overlap period and a published offset, never compared across versions; EVERY variant evaluated recorded, not just the shipped one; and a mandatory score-motion audit — name the change and predict which other instruments should move, and if the prediction fails, presume measurement rather than improvement.

**Basis:** reasoned; the best-of-N mechanism is measured at https://arxiv.org/abs/2504.20879 ('27 private LLM variants tested by Meta', 'overfitting to Arena-specific dynamics rather than general model quality'); binary-not-Likert and TPR/TNR-not-agreement from https://hamel.dev/blog/posts/llm-judge/

### 12. [sourced]

Calibration against borrowing audit's outcomes, and it is the most important number I found: 46% of public-company audits the PCAOB inspected in 2023 had a Part I.A deficiency — the firm appeared not to have obtained sufficient evidence for an opinion it had already issued — up from 40% in 2022 and 29% in 2020, with the Big Four at 26%. Mandatory independence, mandatory review, mandatory documentation, criminal liability, centuries of practice. Take the vocabulary; refuse to assume the outcome. It is also the strongest live objection to this whole design, and §6 of the file records that I could not answer it.

**Basis:** https://pcaobus.org/news-events/news-releases/news-release-detail/pcaob-posts-2023-annual-inspection-reports-alongside-staff-observations-new-charts-to-boost-transparency and https://www.auditupdate.com/post/pcaob-staff-explains-the-2023-inspection-results

## Refusals — what this lane says NOT to do

- Refuse a single quality score. The measured corruption mechanism is not fraud but selective disclosure of best-of-N, which an agent system does to itself every time it generates several attempts and ships the best.
- Refuse letting a producer clear its own work at any size. IESBA: materiality is not a relevant factor in whether self-review disqualifies. The producer states; it never clears.
- Refuse counting two same-family reviewers as two. Report effective reviewer count from measured error-decorrelation, or report one.
- Refuse fail-closed as a global default. Correct for irreversible, outbound and spending acts; wrong everywhere else, and Cloudflare is the price of inverting it. Also refuse any failure path that has never been rehearsed — an unrehearsed failure path is a hypothesis about your own system.
- Refuse any check that can return pass having examined zero items; that verdict is `unresolved`, enforced at the framework level rather than by each check's own diligence. And refuse 'no findings' as a complete review output — a review returns the population examined, what it could not reach, and its own negative-control result.
- Refuse silent expiry in either direction: neither silent deletion nor silent persistence. LAPSED propagates and is visible on the front page.
- Refuse synthetic eval sets as the primary instrument for agentic work, and refuse changing the rubric and the system in the same step. Models detect evaluation contexts at AUC 0.83 (human baseline 0.92), better in agentic settings than chat — so a test that looks like a test measures test-taking.
- Refuse the presumption of reliability toward the system's own output. The Horizon convictions rested on a legal presumption that 'mechanical instruments were in order at the material time' with no evidence that software earns it. This system's output is presumed unverified until graded — and refuse letting review cost scale with output, since the vision's own stated failure condition is the owner becoming a reviewer.

## Unknowns — could not determine

- Whether seeded-defect review stays honest in practice. Mutation testing exists at production scale for code (Google, 6,000 engineers, diff-scoped, arid nodes suppressed); I found nothing analogous pointed at reviewers, so whether a reviewer games the seed distribution or over-fails real work is untested.
- The real cost of blind differential re-derivation (M3a), which is the centrepiece. No figure for what fraction of past decisions can be affordably re-derived, and no baseline for what drift rate is normal.
- Whether an effective-reviewer-count metric is stable at small N. CAPA is defined over large benchmark result sets; estimating error-decorrelation from dozens of seeded cases may be pure noise, in which case the metric is worse than no metric.
- What a calibration target should be for judgements reality never resolves ('is this copy good'). Brier needs resolvable predictions. The honest possibility is that such judgements simply cannot carry confidence numbers, which would materially restrict the provenance-grade design.
- How much lapse debt is tolerable before the account should decline work. The mechanism is clear; the threshold is not, and either direction defeats it.
- Whether the suppression log survives volume. Unknown real suppression rate; at thousands of items a day the count is uninformative and the mechanism becomes decorative in a document about falsifiability.
- Whether audit's vocabulary is part of its 46% failure rather than a defence against it — i.e. whether graded opinions and formal representations are precisely what lets an unsupported conclusion look supported. Strongest objection to the account design in §2.7; unanswered.
- Whether ICD 203 compliance improves accuracy. Found the standards and their stated rationale; found no measurement that compliant products are more accurate than non-compliant ones — itself exactly the kind of gap this lane exists to name.
