# F2 Step 2 — cross-lane comparison

> **What this is.** Eight research lanes were formed blind of each other against the 42 thesis claims. This
> artifact compares them and **keeps their disagreements**. It selects nothing, recommends nothing, and
> resolves no conflict by preference. Machine-readable mirror:
> [`cross-lane-comparison.json`](cross-lane-comparison.json).
>
> **Standing caveat.** No runtime exists and no lane ran an experiment. Every lane shares one model family;
> independence between them is procedural only — separate context, no sight of sibling output. Agreement
> between two lanes is **not** statistically independent confirmation, and where two lanes read the *same*
> source the agreement is one observation with two readers. Every agreement below says which it is.
>
> Claims made by this artifact carry a DIRECTIVE §6 kind. Finding ids are cited in each lane's own form —
> `R1 F-01`, `R3 F1`, `R5 R5-01`, `R8 W-1`.

---

## I. What is now known about the thesis

*For the founder. Plain language, no recommendation.*

**Your five criteria come out unevenly, and two point at a different target than you aimed them.**

**Distinct tools or permissions** is the strongest: the only one enforced outside the model and the only one
with a published price — 77% of benchmark tasks solved with provable security against 84% undefended
[R2 F-09]. But in the runtime you would use, a helper inherits every tool by default and a skill file can
grant tools for the turn that loads it [R4 F5, R2 F-08, R6 F7]. It works, and it has to be built.

**Isolated context** covers two things. Isolation for attention moves with the model generation and is
shrinking; isolation for confidentiality is structural. Separated topologies cut disclosure violations by 20
to 50 points and still leave over 75% [R1 F-15], and separation at the process and credential level does not
happen by default [R4 F5]. Only the confidentiality sense is exercised by any of your six fixtures [R2 §8].

**Independent verification** is half achievable. You can stop the producer influencing the checker. You
cannot make their errors independent inside one model family, and no blinding reaches it [R7 TC-37, F13].
The best independent reviewer anyone has measured found under a third of planted defects [R7 F9].

**Parallel work** is real in general and close to inert here: whether splitting pays is a property of the
*partition*, not the job [R2 F-06], and your concurrency policy admits two slots that are not
interchangeable [R2 F-19].

**Specialized knowledge** is weakest. No source separates it from a versioned skill [R6 TC-33], and role
labels alone showed no benefit across 162 roles and 2,410 questions [R6 F6, R2 F-10].

**The list is not closed.** Five candidate sixth reasons survived adversarial search: input provenance,
provider or account separation, consequence class, attributable identity, and — for people only — a
differently-correlated error source [R2 F-21, R4 F4, R7 §8 F-6].

**Your four costs.** Handoffs: real and mis-aimed — facts survive a compressed transfer at about 0.97, rules
and promises at about 0.57, and typed constraints leaked 0 of 48 where prose leaked 73% [R2 F-04]. Token
cost: real in direction, folklore in magnitude, wrong unit; five lanes flagged the same methodless figure.
Latency: sign indeterminate without a concurrency count. Context loss: **mis-assigned** — owed by the
single-agent arm too, and mandatory because a job caps at a 360-second window [R2 F-13, F-18].

**What nobody could measure.** Four cost claims cannot be measured at your current concurrency, and raising
it is circular. There is no published denominator for capacity, so every figure here is a ratio between arms
and never a fraction of your week. Nobody has measured joint false acceptance for a same-family producer and
checker, what one compaction loses in facts rather than tokens, whether a shared view raises or lowers
duplicated effects, or how often genuinely new work arrives. The last is cheapest and needs no software:
count admitted work over a past window against what you already knew how to do.

**The three findings most likely to change a decision.**

1. **How you cut matters more than whether you cut.** Auto-generated multi-agent systems underperformed a
   single agent at up to ten times the cost; an expert-designed one reached 96.5% against 57.0% on the same
   diagnostic, in the same paper. The discriminator is whether separation is enforced by construction or
   only described in prompts [R2 F-03, R3 F52].
2. **The defence against a false entry fails against the kind that matters.** A poisoning attack carrying no
   instruction passed a four-stage screen 360 times out of 360, while the same screen caught injections at
   0.832 recall. The ranking defence matched no defence at its shipped setting, and took evidence recall to
   zero at the setting that worked [R1 F-10].
3. **Under a subscription, architecture does not change what you spend.** It changes the date work stops,
   and unused allowance is destroyed rather than saved [R8 §3].

**One thing about the round.** No lane registered a claim: seven of eight report the registration tool
absent while the roster says the grant exists. No quotation here has been machine-checked against its
source, so the round reproduced the declared-versus-delivered gap it identifies as a finding.

---

## Counts

| | |
|---|---|
| Claims with a flagged conflict | 15 of 42 |
| Agreements | 18 |
| Disagreements preserved | 16 |
| Existing axes reconciled | 10 |
| New axes | 10 |
| Falsifiers against a **fixed boundary** | **0** |
| Falsifier candidates examined | 14 |
| Cross-lane questions open | 41 of 65 |

---

## A. Per-claim verdict matrix

Lane assignment is from `00-thesis-claims.json`. "Other lanes" records findings from lanes that strayed into
a claim they were not assigned. **DIRECT OBSERVATION: every one of the 42 claims received a bearing finding
from at least one unassigned lane.** The lane boundaries partitioned the claims; they did not partition the
evidence.

| Claim | Lane | Assigned lane's verdict | Other lanes | ⚠ |
|---|---|---|---|---|
| **TC-01** handoffs lose facts | R2 | **Partially supported, mis-aimed as written.** Facts survive ~0.97–0.98, boundary markers ~0.57–0.58; the stated measure averages the two [R2 F-04, F-05, F-18] | R1 F-01…F-05 documented compaction loss with no record of what left; R3 F10, F8, F20, F21 — one vendor's default transfer sends the *entire* history and the guardrails do not travel | ⚠ |
| **TC-02** ephemeral agents cost more capacity | R2 | **Supported by structure in the specified units, unmeasured empirically.** Every published figure is in tokens or dollars and non-conforming [R2 F-01, F-02, F-18, F-19] | R8 W-1 (serialised at CP1, so elapsed time not multiplication), W-2 (cache TTL asymmetry costs *more* than token arithmetic predicts), W-6 (no denominator); R1, R3 reject token counts as a capacity model | ⚠ |
| **TC-03** higher elapsed time | R2 | **Unmeasurable as specified.** Latency's sign depends on realised concurrency; the pin admits two non-interchangeable slots [R2 F-06, F-07, F-19] | R8 W-1, R8 §5 — same disposition reached independently from the same specification section | |
| **TC-04** splitting loses facts faster than a single context fails to use them | R1 | **Partially supported, generation-dependent.** 19 and 15 point losses on knowledge update; the control half is also measured and larger [R1 F-04…F-07, F-11] | R2 F-13, F-18 — the cost is owed by the single arm too and is mandatory under the launch contract; R3 §10.8 | ⚠ |
| **TC-05** agent count matters less than context quality | R1 | **Supported in direction on the axis measured; unmeasured on the axis the claim names** [R1 F-08 vs F-09] | R3 F49, F50 (same primary; secondary summaries of it drifted within months); R2 F-02, F-11; R6 F6; R8 A-2, B-3; R5 R5-22 | ⚠ |
| **TC-06** five criteria jointly sufficient, individually necessary | R2 | **Refuted in both directions.** Four sixth reasons survive; specialized knowledge alone yields no measured benefit [R2 F-09, F-10, F-21] | R6 TC-33, R7 TC-37, R4 F5 — three lanes weaken three different criteria from three evidence bases | |
| **TC-07** independent parts pay off in parallel | R2 | **Supported conditionally, condition now named.** Cohesion-aware partitioning +11.3/+14.0 points; poor partitioning degrades both [R2 F-06, F-07] | R1 F-17 (266 vs 21 findings at 27M vs 6.5M tokens, 12 in common); R8 competing interpretation 2 | ⚠ |
| **TC-08** union of permissions increases blast radius | R4 | **Hypothesis. Premise strengthened, claim unmeasured, instruction arm evidenced against** [R4 F8, F5, F9] | R2 F-08; R6 F7, FC-6 (80% attack success through skill files); R1 F-10 | |
| **TC-09** executor isolation prevents disclosure a filter does not | R1 | **Partially supported and refuted as stated.** 20–50 point reduction, >75% residual, and shared memory is where defences work worst [R1 F-14…F-16] | R4 F5, §5 — separation separates no credentials, environment, sandbox or process; R2 F-12 and the attention/confidentiality split | ⚠ |
| **TC-10** specialist beats general-plus-skill | R6 | **Still contested, narrowed.** Strong form poorly supported; weak form untested; the discriminating fixture run by nobody [R6 F4, F5, F6, F10] | R2 F-10 (same persona study, plus an expired-transfer role ablation); R3 F34, F62 | ⚠ |
| **TC-11** a separate verifier justifies itself | R7 | **First clause supported, second unresolved.** 28.6% vs 24.6% F1, p=0.008; the best arm missed ~71% of defects [R7 F9, F10, F19] | R2 F-14 adds the resampling ceiling; R3 §9 F-4; R8 §7 | |
| **TC-12** persistent agents without shared state are worse | R8 | **Not measurable as written** — two variables move at once; needs a 2×2; not blocked by concurrency [R8 TC-12, A-7] | R1 F-17 (correlated duplication with no shared state at all); R7 preference leakage; R5 R5-01, R5-02 | |
| **TC-13** one authoritative view reduces contradiction | R1 | **Partially supported, with an unanticipated counter-mechanism** [R1 F-17, F-18, F-19] | R8 W-3 (a larger view makes every reader worse); R5 R5-23, R5-02; R3 competing interpretation 1 | ⚠ |
| **TC-14** the five constituents are sufficient | R1 | **Refuted as stated.** Authorization and recipient scope is outside the five and is the dominant measured failure [R1 TC-14] | R2 F-04/F-05 (typed constraints); R4 F3/F4 (grants, epochs, consequence class); R5 R5-13 (reason-finished ≠ status); R6 §9 Q1 (procedure freshness) | |
| **TC-15** frameworks decompose by role name | R3 | **Supported, and split into two populations** — authored frameworks yes, coding harnesses no [R3 F31…F35] | R2 F-10; R6 F6 | |
| **TC-16** title decomposition is worse | R3 | **Not established, in either direction.** Nobody runs the test at matched executor count [R3 F49, F51, F52, F34] | R2 F-10 offers the nearest reconciliation *as an inference*; R8 W-4 supplies a new test — is the partition recomputed or does it converge? | ⚠ |
| **TC-17** the five axes are separable and exhaustive | R2 | **Separable yes, exhaustive no.** Coverage fails on four axes plus a production-mode leftover [R2 F-20, F-21] | R6 F7 and **R2's own F-08** — a knowledge artifact carries a tool grant, so skills and authority are not independently variable in the shipping runtime | ⚠ |
| **TC-18** unanticipated work is frequent enough to design for | R5 | **Requirement supported, rate not established.** Five system classes carry the path; no source measures the fraction [R5-03…R5-10, R5-24] | R3 §9 F-1 — nothing in the survey refuses a job with a reason | |
| **TC-19** new work admitted, typed, staffed, accepted with no human edit | R5 | **Contradicted as one claim; splits into four with different answers.** Staffing is where it fails [R5-06, R5-08, R5-14, R5-21] | R6 §8 F-1 (skills are not an admission mechanism); R3 §9 F-1 | |
| **TC-20** a turning point in executor count | R8 | **Direction corroborated by a conflicted primary; turning point unmeasurable at the pin** [R8 W-1, W-3] | **R2 F-15 — two primary sources disagree on whether a turning point exists**; R1 F-08; R6 F3 (same shape in a different quantity) | ⚠ |
| **TC-21** one undifferentiated executor cannot deliver the scope | R8 | **Safety clause entailed by the frozen boundaries and must not be scored as empirical; cost clause unknown** [R8 TC-21] | R4 F5 — the undifferentiated executor is the runtime default; R1 F-14, F-15 | |
| **TC-22** some multi-executor arrangement wins at matched capacity | R8 | **Splits.** Verification half measurable now; parallelism half not. Evidence in genuine conflict and retained [R8 TC-22, A-2, B-2, B-3] | **R2 F-03 — expert-designed 96.5% vs 57.0%, the strongest "for" datum in the round**; R3 F51, F52 same paper read independently; R1 F-08 | ⚠ |
| **TC-23** mode chosen by the nature of the work | R2 | **Conformance rule, not falsifiable by measurement — and independently well-supported as engineering** [R2 F-02, F-16] | R8 B-4; R3 F52, F39 | |
| **TC-24** attenuated authority, no self-escalation | R4 | **Coherent, implementable, and currently false of the runtime default. Must be built, not assumed** [R4 F2, F3, F5, F6, F7, F10] | **R3 F2/F3 read the same docs as attenuation that HOLDS and list it as a transferable mechanism**; R3 F59 — the grant narrows reliably and *arrives* unreliably; R2 F-08; R6 F7 | ⚠ |
| **TC-25** supervision set by consequence, not by record | R4 | **No counterexample found; the runtime supplies a concrete anti-pattern** — a permanent repository-wide allow rule with no expiry [R4 F4, failure case 8] | R8 §8 (a persistent evaluated identity makes the ratchet more tempting); R5 R5-12 | |
| **TC-26** subscription units, no silent metered fallback | R8 | **Conforming as a unit system, unenforced as a constraint, missing its denominator** [R8 W-5, W-6, W-7] | R2 F-01; R3 §10.7 (no surveyed system models a reset window); R6 §5; R1 rejected mechanism 8 | |
| **TC-27** the context manifest | R1 | **Supported as a requirement, unprecedented in practice, partly unachievable across the provider boundary** [R1 F-01, F-02, F-03, F-21, F-22] | R3 §10.8, §9 F-5; R2 F-04 (the important field is which *constraints* were dropped); R6 §9 Q2, Q3 | |
| **TC-28** selection must not worsen as the library grows | R6 | **Constraint correct, unmet by default everywhere, and the specified mechanism is the one measured as costly at scale** [R6 F2, F3, F4, F10, F11] | R5 R5-18 — the vendor's own 30–50 tool threshold, no method published, landing in the same band as the academic capacity fit; R3 F7 | ⚠ |
| **TC-29** designed return of work to the founder | R1 | **Supported as a requirement, dose unknown, measurement run by nobody** [R1 TC-29] | R3 §9 — unknown across the entire field; **R7 F15, §9 — the human anchor is itself an unmeasured instrument**; R8 A-6 | |
| **TC-30** no executor because a department exists | R3 | **Supported, with the enforcement predicate named and the decorative-declaration loophole identified as the live risk** [R3 F59, F60, F61] | R8 W-4; R2 F-20; R4 F1 | |
| **TC-31** what "one shared source of truth" means | R1 | **Unresolved, with one reading now carrying an existence proof and a price tag** [R1 F-23] | **R3 F42/F44 answers R1's own open question** — single-writer keyed state; R3 F24/F25 state-write-as-event; R8 W-3; R5 R5-01 | |
| **TC-32** no measure for context engineering | R1 | **Supported, and useful on the remedy.** Four metrics survive the sham-change test; model judges fail the instrument test [R1 TC-32] | R2 F-05 — a fifth requirement: the metric must be *stratified* or it describes neither class; R7 F3, M7 | |
| **TC-33** which unit carries specialization | R6 | **Formally unknown; the evidence now discriminates, and the separation is already leaking in the harness** [R6 F6, F7, F9] | R2 F-08, F-20 — same conclusion from the same two vendor pages, independently; R3 F34 | |
| **TC-34** the next-action view | R5 | **The package's answer is corroborated; the thesis's phrasing is under-specified** — named author, different approver, explicit expiry, one cursor advancer [R5-23, R5-01, R5-02] | R1 F-17 (a trusted view suppresses the dissenting fact); R3 F26, F27 | |
| **TC-35** is the list closed | R2 | **Not closed.** Four candidates returned; closure is a founder decision packet [R2 F-21] | R4 F4, F9; R7 §8 F-6 (a fifth, human-only); R6 §8 declines and routes here | |
| **TC-36** the unit of justification | R2 | **Resolved: there is no single unit.** The five criteria predicate on five different objects [R2 F-20] | R7 §9; R6 F9; R4 F1 — four lanes push the unit away from "agent" | |
| **TC-37** independence under one model family | R7 | **Unresolved in general; decided NEGATIVE for one named error class. The claim should be split** [R7 F1, F2, F9, F12, F13, F14] | R2 F-14; R8 §7; R3 §9 F-4 | |
| **TC-38** do the criteria govern human performers | R2 | **Two transfer, one changes meaning, two do not; plus a human-only sixth** — professional standing the act itself requires [R2 TC-38] | R7 §8 F-6 (a second human-only reason); R5 §9 Q7 | |
| **TC-39** at what scale the costs bind | R8 | **Confirmed unknown, unmeasurable at the pin, and circular as specified** [R8 TC-39, W-6] | R2 F-19, G-5 — same conclusion independently; no published measurement at concurrency 2 | |
| **TC-40** the recogniser for unanticipated work | R5 | **Unspecified, and now specifiable.** Out-of-scope recall is the weak axis and the benchmark base rate is the inverse of a company's [R5-15, R5-16, R5-18] | R6 §8 F-1, F3; R3 §9 F-1 | |
| **TC-41** coordination: component, record or emergent | R5 | **A real open decision with a 1986 source that declines to resolve it and prices each resolution** [R5-01, R5-02, R5-22] | **R3 F33 supplies a fourth locus the trichotomy does not contain** — coordination by subscription; R1 F-17 | ⚠ |
| **TC-42** false entries: detection, correction, propagation | R1 | **Supported, and the finding most adverse to the current position** [R1 F-10, F-11, F-12, F-13] | R3 F47, F48 (tool poisoning, rug pull, hash pinning); R6 F7, FC-6; R4 F9 (four CVEs, all scope-changed) | |

---

## B. Agreements

Two or more lanes supporting one statement with their own sources. They could not cite each other, so the
only question is whether the sources are the **same** (one observation, two readers) or **different**
(corroboration). Both are recorded because they are worth different amounts.

| # | Statement | Lanes | Findings | Same source or different |
|---|---|---|---|---|
| **AG-01** | An instruction file is not enforcement, and the vendors say so in their own documentation | R1, R3, R4, R6 | R1 F-20 · R3 F4, F16 · R4 F6, F12 · R6 F7 | **Mixed** — R1 and R3 read the same memory page; the permissions, skills, community-format and second-vendor pages are independent |
| **AG-02** | No substrate emits a record of what a lossy transform dropped | R1, R3, R6 | R1 F-02, F-21 · R3 F8, §10.8 · R6 §9 Q2 | **Different** — protocol registries, three transforms in one harness, the skill selection surface |
| **AG-03** | A separate invocation is not independence; the binding quantity is correlated error and the verifier's false-positive rate | R2, R3, R7, R8 | R2 F-14 · R3 §9 F-4 · R7 F12, F13 · R8 §7 | **Mixed** — R2 and R7 share two primaries; R3 and R8 arrive from unrelated material |
| **AG-04** | Matched-budget comparison removes much of the reported multi-agent advantage | R1, R2, R3 | R1 F-08 · R2 F-02 · R3 F49, F51 | **Both** — R1 and R3 read the *same* matched-budget primary and agree on its model families and boundary condition; R2's source is a different paper |
| **AG-05** | How you decompose dominates whether you decompose: expert-designed beats auto-generated at the same cost class | R2, R3 | R2 F-03 · R3 F51, F52 | **Same source, two readers** — both opened the same 2026 preprint independently and extracted the same internal split |
| **AG-06** | Selection over a growing catalogue degrades, and confusability rather than count drives it | R3, R5, R6 | R3 F7 · R5-18 · R6 F2, F3, F10 | **Different** — a vendor threshold claim with no method, three academic groups, and a vendor publishing no curve. The vendor band and the academic capacity fit land in the same region |
| **AG-07** | A knowledge artifact can carry a tool grant, so the knowledge unit is already an authority unit | R2, R4, R6 | R2 F-08 · R4 F5 · R6 F7, FC-6 | **Mixed** — R2 and R6 quote the same two sentences of the same vendor page independently; R4's instance is a different file type |
| **AG-08** | The model cannot be the disclosure or release boundary | R1, R4, R6 | R1 F-14, F-15, F-16 · R4 F4, F6, F12 · R6 F12 | **Different** — three layers, three evidence bases, one conclusion |
| **AG-09** | Transfer loses constraints preferentially, and the loss is not exclusive to multi-agent designs | R1, R2, R3 | R1 F-01, F-04 · R2 F-04, F-05, F-13, F-18 · R3 F10 | **Different**. R2's stratified measurement is unique to R2 and changes the instrument |
| **AG-10** | Nothing in any lane's source set measures whether a system's human operator remains competent | R1, R3, R7 | R1 TC-29 · R3 §9 · R7 §9 | **Different source sets**; each states it as an absence in its own corpus, not as evidence of absence |
| **AG-11** | Durable-execution engines guarantee the control flow and not the external effect | R3, R5, R8 | R3 F40–F44 · R5-08 · R8 B-1 | **Partly shared** — three lanes, one vendor, different pages; R3 adds three other engines |
| **AG-12** | Refusal must be a recorded terminal state, and a catch-all must name what it cannot catch | R3, R5, R6 | R5-09, R5-14 · R3 §9 F-1 · R6 §8 F-1 | **Different** |
| **AG-13** | The package's own concurrency policy makes several thesis cost claims unmeasurable as specified | R2, R8 | R2 F-19, G-5 · R8 TC-20, TC-39, §5 | **Same source, two readers** — the round's strongest same-source agreement, and it is about the package rather than the literature |
| **AG-14** | The most-circulated multi-agent cost multiple is a vendor self-report with no published method | R1, R2, R3, R5, R8 | R1 rejected mech. 8 · R2 F-01 · R3 F12 · R5-22 · R8 W-1, W-7 | **One source, five readers** — five independent flags on one number, none upgraded by repetition |
| **AG-15** | Every adverse control needs its paired clean case, because a neutrally framed checker flags almost everything | R1, R6, R7 | R1 F-10, useful mech. 9 · R6 F8 · R7 F8, M4 | **Different** — a defence that took recall to 0.00%, false-positive rates of 68.4–96.8% on patched files, and a shipping tool that excludes graders which cannot fail in the baseline |
| **AG-16** | A declared capability is not a delivered capability, and nothing routinely observes the difference | R3, R4, R6 | R3 F57, F59, F60 · R4 F1 · R6 §5 | **Different**; R3 F59 is a direct observation no vendor document supplies |
| **AG-17** | Duplicated action has a cause the thesis does not name: correlated behaviour between identical models | R1, R3, R5 | R1 F-17 · R3 §8 · R5-22 | **Mixed** — R3 and R5 share one vendor post; R1's measurements come from a later publication |
| **AG-18** | No system in the field has an acceptance-owner concept; all terminate on producer-declared completion | R3, R5, R7 | R3 §9, §10.1 · R5-13 · R7 §8 F-1 | **Different** |

---

## C. Disagreements, preserved

Not resolved by preference. Each gives both positions, the definitional or contextual difference where one
explains it, and the measurement that would settle it.

### D-01 · Does the subagent boundary attenuate authority, or inherit it? — **the sharpest lane-vs-lane conflict in the round**

- **R3 [F2, F3, §7]:** the tool grant is *subtractive* and client-enforced in two filters, with a fixed
  unremovable core and a bounded depth that withholds the delegation tool at the limit. Listed as a
  mechanism that **transfers**, answering the composite-grant question with "refused, not minted".
- **R4 [F5, TC-24]:** tool inheritance is *total* unless a file says otherwise; the delegator cannot
  attenuate at the call; an escalated mode propagates downward and the child's stricter setting is
  discarded; sandboxed shell commands inherit the parent environment including credentials. The governing
  directive's second clause is failing in the default configuration.
- **Underlying difference — two questions, not two answers.** R3 asks whether the *child* can exceed the
  *parent's set* (it cannot, for inherited tools). R4 asks whether the *delegator* can narrow *at the call*
  (it cannot) and whether authority can arrive from a *file* the parent never held (it can). R4 names the
  definitional question that decides it: **does authority belong to the conversation or to the project?**
- **Discriminators, both cheap.** (1) Dispatch a subagent whose definition declares an MCP grant the main
  conversation lacks, and observe whether the tool is present *at the effect*. (2) R3 F58's own probe:
  dispatch the read-only reviewer, whose tool list omits the shell, and attempt one shell call.

### D-02 · Does isolation by executor buy confidentiality a filtered loader does not?

- **For [R1 F-15]:** separated topologies reduce appropriateness violations by 20–50 points.
- **Against [R4 F5, §5; R1 F-14 and its own residual]:** separation separates no credentials, environment,
  sandbox configuration or process in this runtime; and the residual stays above 75% with the bottleneck
  attributed to model judgement rather than topology.
- **Underlying difference:** three layers wear one word — attention, information flow, and process or
  credential isolation. Only the second sense is exercised by any frozen fixture [R2 §8].
- **Discriminator:** the seeded private-term canary at matched utility under three arms — loader filter with
  one context; separated executors sharing process and environment; separated executors with scrubbed
  environments and separate credentials — counting disclosures per destination *and* false exclusions.

### D-03 · Share everything, or narrow every delivery?

- **Share [R1 F-19, R8 B-2, R3 F54]:** share context and full traces, because actions carry implicit
  decisions and conflicting decisions carry bad results.
- **Narrow [R1 F-06, F-07, R8 W-3]:** performance grows increasingly unreliable as input length grows with
  complexity held constant, and even a single distractor reduces it.
- **Underlying difference:** the two optimise against different failure modes — conflicting implicit
  decisions versus context exhaustion — and both are coherent. R3 names the same split as isolation versus
  continuity. R8 adds that the founder's requirement therefore cannot mean one store read by everyone; it
  must mean one **authority per field** with delivery narrowed per attempt, and the thesis does not
  distinguish those designs.
- **Discriminator:** the quantity neither side has measured — how much load-bearing content survives
  narrowing, against how much accuracy is lost by carrying it all.

### D-04 · Is there a turning point in executor count?

Two primary sources inside one lane [R2 F-15]: one measures performance rising then falling with the number
of calls; the other reports it scaling with the number of agents. Compatible only if the turn sits beyond
the second's sweep, and neither located it for agentic work. **Discriminator blocked:** the sweep the claim
specifies is forbidden by the concurrency policy. See axis X14.

### D-05 · Is the reported multi-agent gain architecture, or resource?

- **Architecture [R1 F-09, R8 A-2, R5-22]:** a 90.2% improvement on an internal research evaluation.
- **Resource [R1 F-08, R2 F-02, F-11, R3 F49]:** at matched budget the advantage disappears, and the same
  vendor's own decomposition attributes 80% of variance to token usage.
- **Underlying difference:** budget matching plus task shape; the vendor source itself excludes most coding
  work. R8's reconciliation — research parallelises, construction does not — is an inference it declines to
  call settled.
- **Discriminator:** matched-capacity comparison on a research-shaped and a construction-shaped task, each
  reported beside its realised concurrency count.

### D-06 · Does the simple baseline minimise scarce capacity? — **against a protocol §6 granted strength**

- **Protocol §6** grants B0 "the lowest plausible consumption of scarce subscription capacity".
- **R8 B-6** names four documented provider mechanisms that contradict it, and **R2 F-18** independently
  removes a different B0 premise on a different ground: a native job caps at a 360-second window, so one
  long context cannot run at all.
- **Underlying difference:** B0 minimises *launches*; it does not minimise the *weekly bucket*, and the
  weekly bucket is what binds. Neither lane amended the frozen protocol and both said so.
- **Discriminator:** instrument the four mechanisms and measure B0's weekly draw against a continuation
  arm at matched accepted outcomes — as a ratio, since no absolute denominator exists.

### D-07 · Is metadata-only skill discovery adequate?

Vendor: progressive disclosure lets many skills be installed without context penalty, in a regime designed
around roughly 100 skills. Academic: hiding the body costs 37–44 points of routing accuracy at roughly
80,000 overlapping skills, and body-distilled descriptions remain 7–21 points short [R6 F2]. **They measure
different quantities at library sizes ~600× apart**; R6 says they locate a crossover rather than contradict
each other, and the crossover is unknown for a Claude-family model over a real corpus.

### D-08 · Do seeded defects estimate real-defect detection?

One study finds mutants correlate with real fault detection while hand-seeded faults do not; a later, larger
study finds all such correlations weak once test-suite size is controlled [R7 F19]. Preserved. **The
operative consequence is identical under both readings:** the control detects an always-pass checker and
does not license a published detection rate.

### D-09 · Grade the outcome, or the path?

Vendor guidance says grade what the agent produced, not the path. R7 contradicts it for this system: a
benchmark that compares final state acknowledges a passing episode can omit a required user confirmation, so
in a system whose fixed boundaries include who may release an effect, **the path contains the obligation**
[R7 F20, M1]. The vendor guidance is calibrated to coding agents where the product is the whole obligation.

### D-10 · Is delegation depth a policy, a resource limit, or a safety property?

One vendor permits three layers and withholds the tool at the limit; another forbids recursion absolutely
even with wildcard tool access [R3 F18]. Two vendors, opposite defaults, same year, both deliberate. The
answer decides who may change the ceiling and whether changing it is a self-modification requiring review.
R4 §9 Q3 sharpens it: spawning costs no permission check at all, so the ceiling needs an owner **and** a
checkpoint.

### D-11 · What happens to work nothing can currently handle?

Three incompatible dispositions, all shipped [R5-08, R5-14, R5-03, R5-12]: park indefinitely pending a human
deploy; refuse with a recorded reason as a terminal state; assign by default upward and escalate on a timer.
Each fails differently — a deadline rots in the first, a real duty is declined in the second, the third ends
assigned and silent. R5's reading is that the choice is almost certainly per consequence class rather than
global.

### D-12 · Is re-routing a defect?

The ticket-routing literature scores any assignment to a non-resolver as inefficient; a large study of bug
reassignment finds it is often how the right owner is found and names the harmful shape as *cycles at the
end of a sequence* [R5-20]. **Discriminator:** measure end-of-sequence cycles separately from reassignment
count. A design that minimises re-routing may be suppressing diagnosis.

### D-13 · Buy a second model family, or stop relying on model judgement?

A panel of smaller judges from **disjoint** families beats a single large judge at over seven times lower
cost, and the only working remedy for self-consistent errors was a cross-model probe [R7 F14, F13]. Against
that, error correlation persists across providers and **rises with capability**, so the strongest second
opinion is the most correlated one, and on objectively checkable correctness strong judges are near chance
regardless of family [R7 F12, F5]. R7 states this is a decision and declines to make it.

### D-14 · Are the founder's five axes separable in practice?

R2's verdict says separable; R2's own F-08 and R6 F7 say a knowledge artifact carries a tool grant and can
fork a context, so skills, authority and context are not independently variable in the shipping runtime.
**Underlying difference:** separability in the *taxonomy* versus in the *implementation*. **Discriminator:**
build a skill carrying no tool grant and a tool grant carrying no procedure, and see whether either varies
without touching the other.

### D-15 · Is coordination a trichotomy or a quadrichotomy? — *surfaced only by putting two lanes side by side*

R5-01 names three loci from the 1986 source. R3 F33 documents a fourth in a shipped system: **coordination
by subscription** — structured messages published to a shared pool, extracted by role-specific interests,
with activation gated on receiving all prerequisite dependencies. It is the one reading with an
implementation and reported scores. The claim's own measure now needs four arms rather than three.

### D-16 · A number in this repository cannot be traced to its own cited primary

A decision record and two sections of an internal design document state evaluator agreement of 5–17% and
per-evaluator detection of 18–60%. The primary states 5–65% and 59%/45%, and a *third section of the same
document* states the traceable version with "verified" beside it [R7 F16]. R7 does not assert the figures
are wrong — only that they cannot be traced from the repository's own citation, which makes them folklore
under the evidence rules. **The direction is primary-verified and unaffected.** The untraceable version is
what propagated into the brief R7 itself was given.

---

## D. Reconciliation with the ten existing axes

This round owns **X03 coordination**, **X07 owner competence** and **X10 improvement and simplification**.
All ten are reconciled; none is superseded outright, and two have their framing narrowed.

| Axis | Moved? | How, with findings |
|---|---|---|
| **X01** Intent and obligations | **Moved** — an instrument now exists | Constraints survive transfer at ~0.57 against ~0.97 for operational facts, and typed constraints leaked 0 of 48 where prose leaked 73% [R2 F-04, F-05]. Three further missing constituents named: surviving obligations and contradiction state [R1 TC-14], and a reason-finished field separate from status, which shipped software makes optional [R5-13] |
| **X02** Production and institutional boundaries | **Barely moved; the evidence base was found narrow** | Two performer-type criteria that apply only to people: professional standing the act requires [R2 TC-38] and a differently-correlated error source [R7 §8 F-6]. Every surveyed system is software-construction or generic orchestration, so no evidence bears on customs disputes, refunds, supplier commitments or wind-down [R3 §9] — the W11 narrowing risk is a risk of importing the **evidence base**, not only the vocabulary |
| **X03** Coordination | **Moved substantially** | The arrangement is a named 1970s–80s architecture whose author states no control component is specified [R5-01]; the coordinator reading's cost is documented at the source — broad executive power that violates the opportunism the record existed to enable [R5-02]; a counter-mechanism none of the readings predicts was measured [R1 F-17]; and a fourth locus was surfaced [R3 F33]. Status moves from "foundational alternatives retained" to *four* alternatives, one cost priced, one counter-mechanism measured |
| **X04** Knowledge structures | **Moved** — two relied-upon defences now measured and both fail | Write-path screening 0 of 360; provenance ranking indistinguishable from no defence at its shipped weight and utility-destroying at its effective one [R1 F-10]; retrieved wrong facts override correct prior knowledge >60% of the time [R1 F-11]; one reading has a production existence proof for one fact class at a named price [R1 F-23]; and two structural mechanisms arrived — state-write-as-event and single-writer keyed state [R3 F24, F25, F42] |
| **X05** Evidence versus truth | **Moved** — the distinctions now carry magnitudes | Chance-corrected agreement is 33.8–41.2 points below exact match [R7 F3]; reproducible and invalid coexist [R7 F4]; near-chance judging on objective correctness [R7 F5]; withholding framing moves the *threshold*, not the *discrimination* [R7 F8]; the best independent reviewer measures 28.6% F1 [R7 F9]; human evaluators agree 5–65% [R7 F15]; and one internal figure was corrected [R7 F16] |
| **X06** Authority and recovery | **Moved** — invariant unchanged, options now named | Three production attenuation families, all putting it in the credential or the call [R4 F2]; attenuation buys narrowing and not revocation [R4 F3]; four default inheritance paths [R4 F5]; one deterministic path buildable today outside the model [R4 F7]; four scope-changed vulnerability records [R4 F9]; no standard verifies that a chain narrows [R4 F10]; an approval interrupt can duplicate the effect it approves [R3 F29, F30]; and a grant was observed to narrow reliably and arrive unreliably [R3 F59] |
| **X07** Owner competence and attention | **Left where it was, with two new constraints** | The transfer test is unexecuted in the literature [R1 TC-29]; nothing in the field measures operator competence [R3 §9]; the human anchor is itself an unmeasured instrument [R7 F15, §9]; the founder's value is that his errors are uncorrelated with the family's, so his absence removes the only cross-family error source [R7 §8 F-6]; and W11 and W12 pull in opposite directions [R8 A-6] |
| **X08** Economics and scope | **Moved substantially; the central reading inverted** | Architecture does not change what is spent — it changes the date work stops, and unused allowance is destroyed rather than banked [R8 §3]; no published denominator, so every figure is a ratio [R8 W-6]; a parallel executor's cache expires far sooner than the main session's [R8 W-2]; thirty executors serialise rather than multiply [R8 W-1]; the metered path is one setting away [R8 W-5]; and continuation is mandatory in every arm [R2 F-18] |
| **X09** Records and deletion | **Barely moved; two new instances** | A peer projection is a derivative that may outlive the grant justifying it, and erasure does not propagate to derivatives [R1 §9.5, §9.7]; high-risk-system logging may be a legal obligation whose scope nobody owns [R1 F-22]; and a skill retired out from under an accepted run breaks that run's pinned references [R6 §9 Q5] |
| **X10** Improvement and simplification | **Moved** — a removal test now has an exemplar | The group that established interface design matters ships a 100-line successor that deletes it and scores competitively, so a scaffold's contribution is a function of the generation that motivated it [R3 F38, F39]; which mechanisms carry a removal test remains unanswered [R3 §10.6]; corpus quality rather than retrieval is the limiting factor and compact beat comprehensive by ~4× [R6 F4, F5]; determinism is the only lever that cuts consumption without cutting work, and it belongs to every position [R8 B-7] |

### New axes this round surfaced

| # | Topic | Lanes | Discriminating question |
|---|---|---|---|
| **X11** | **The unit of justification for an executor** — the five criteria predicate on five different objects, and a criterion applied to the wrong unit returns undecidable, which reads as satisfied [R2 F-20; R7 §9; R6 F9; R4 F1] | R2, R4, R6, R7 | Applied to each candidate unit — template, instance, standing role, context boundary, permission scope, distribution unit, input set — which criteria return a decidable answer? |
| **X12** | **Handoff versus consultation** — one vendor implements both and states they are not interchangeable; a handoff transfers *ownership of the turn* through a compressed artifact, while another vendor's default handoff transfers everything and leaves the guardrails behind. And the system hands off to itself on every long job [R2 F-17, F-18; R3 F20, F21] | R2, R3 | For each transfer: does the obligation-holder leave the turn, what typed constraints travel, and is a continuation held to the same discipline? |
| **X13** | **Boundary metadata versus operational facts** — separate classes with different survival rates under one transformation, so a single aggregate figure describes neither [R2 F-04, F-05; R1 F-01; R6 FC-5] | R1, R2, R6 | Which of the 46 capabilities carry constraints that would not survive the compression the system actually performs? |
| **X14** | **The concurrency pin as containment versus as a demand** — it makes four claim verdicts unmeasurable, raising it is circular, and no inspected page establishes any account-level entitlement [R2 F-19; R8 TC-39, §10 Q7] | R2, R8 | Provider constraint or self-imposed policy? If policy, who owns a bounded trial with a stopping rule; if a constraint, does the round say those claims are permanently unmeasurable here? |
| **X15** | **The simple baseline's granted strengths are not purchasable as written** — its capacity strength is contradicted by vendor documentation, its "one long context" premise by the package's own launch contract, and it has no verification independence at all [R8 B-6; R2 F-18; R7 §8] | R2, R7, R8 | At what added mechanism has B0 rebuilt the case-admission authority and stopped being B0? |
| **X16** | **Declared capability versus delivered capability** — a grant narrowed reliably and arrived unreliably; 44 declarations and 16 budget blocks bound nothing; a lint rule records in its own source that it checks the declaration, not the binding [R3 F57, F59, F60; R4 F1] | R3, R4, R6 | Can a grant be observed to have *arrived*, and what does a task that silently did less look like from outside? |
| **X17** | **Who measures false exclusion** — every filtering source measures leakage and none measures correct work refused; the extreme case took evidence recall to exactly zero [R1 §9.1, F-10; R7 F8, M4; R6 F8] | R1, R6, R7 | For every filtering, trust and refusal mechanism, what is the rate of correct work refused, measured in the same session as the adverse case? |
| **X18** | **The interval between declared done and accepted** — it exists in no surveyed system and in every business obligation; shipped trackers let an item be Done with no resolution [R3 §10.1; R5-13; R7 §8 F-1] | R3, R5, R7 | Who is accountable in that interval, what is the state called, and can it be queried? |
| **X19** | **The founder as an instrument with an unmeasured error rate** — human evaluators agree 5–65%, agree on severity 20–28%, and nothing in the package states or requires a human error rate [R7 F15, §9, §8 F-6] | R1, R7 | What is the expected error rate of the human acceptance step, who measures it, and with what uncertainty is it reported beside the model instruments it anchors? |
| **X20** | **The metered-path affordance as an account property** — the constraint is stated, nothing enforces it, and the path is one setting away at both providers [R8 W-5, TC-26] | R8 | Who observes the account setting, how often, and what record is made when it changes? |

---

## E. Falsifiers against the fixed boundaries

The handoff fixes six boundaries unless a lane returns a **specific falsifier** — a named counterexample,
never a preference. Fourteen candidates were examined.

> **DIRECT OBSERVATION. Zero are falsifiers against a fixed boundary.** Two falsify a strength the frozen
> protocol §6 grants the simple baseline. Five are conformance counterexamples against the runtime or a
> founder constraint — they refute the assumption that a boundary holds *without being built*, not the
> boundary. One is a criterion tension argued as preference, and its own lane declines to advance it as a
> counterexample. Every lane that touched a fixed boundary said in its own words that it reopened none.

| # | Lane | What is claimed | Verdict |
|---|---|---|---|
| **FAL-01** | R8 B-6 | B0 does **not** have the lowest plausible consumption of scarce capacity — four documented provider mechanisms | **Falsifier of a protocol §6 granted strength**, not of a fixed boundary. R8 did not amend the protocol and said so |
| **FAL-02** | R2 F-18 | B0's "one long-context session" is **not purchasable** — a native job caps at a 360-second window, so continuation is mandatory in every arm | **Falsifier of a protocol §6 comparator premise**, derived from the package's own specification rather than an external source |
| **FAL-03** | R4 F5, TC-24 | The runtime's default inherits all permissions of its creator, in four documented ways | **Conformance counterexample against the runtime.** The invariant is not weakened; the assumption that it holds for free is. R4's own disposition: it must be built |
| **FAL-04** | R1 §8, F-14…F-16; R4 F12 | A release boundary inside a component with a 16–51% failure rate is in the wrong place | **Constraint on implementation, explicitly not a reopening** — R1 says so in its own words |
| **FAL-05** | R3 §9 | No surveyed system has an acceptance-owner concept; all terminate on producer-declared completion | **Evidence gap in the field**, and it *strengthens* the boundary's status as a design obligation that cannot be imported |
| **FAL-06** | R3 §9 | No evidence in the survey bears on customs disputes, refunds, supplier commitments or wind-down | **Evidence gap**, not a falsifier of whole-company scope |
| **FAL-07** | R1 F-20; R3 F4, F16 | Three vendors built the artifact negative control §4.2 says must fail, and two document that it is not enforcement | **Confirmation of a negative control**, now with a primary source |
| **FAL-08** | R7 TC-37, F12, F13 | Independence of *error* is unachievable within one family for the self-consistent class | **Names a residual the boundary must disclose.** R7 reopens nothing and routes no decision packet |
| **FAL-09** | R7 §8 amendment 1 | Fixture F-4's adverse variation lacks the **paired clean case** that negative control §4.3 requires | **Specific defect in a frozen fixture**, classed **(b)** by R7 itself. Given 68.4–96.8% false positives on patched files, an unpaired control cannot distinguish a working checker from one that refuses everything |
| **FAL-10** | R8 W-5 | The no-silent-metered-fallback rule has no mechanism and the path is a documented in-product affordance at both providers | **Conformance gap with a named observation point** |
| **FAL-11** | R8 A-6 | W11 rejects "a roster of digital employees" by name while W12 needs the structure a founder can most easily hold | **Preference with an argument.** R8 records it as "a criterion tension, not a defect" and declines to advance it as a counterexample. It is the closest thing in the round to an argument against a frozen criterion, and it is not one |
| **FAL-12** | R5-06 | The standard most cited for unanticipated work admits an unscheduled item, not an unanticipated *kind* | **Correction to a cited support**, not to a boundary |
| **FAL-13** | R8 TC-21 | The safety clause of TC-21 is entailed by the frozen boundaries and must not be scored as an empirical result | **The inverse of a falsifier** — a warning that a definitional truth sits where an empirical result would go |
| **FAL-14** | R7 F16 | Two numeric ranges in this repository's own records cannot be traced from its own citation | **Measurement-integrity finding against the round's own inputs**, not a boundary falsifier |

---

## F. Measurement gaps

Two causes dominate and they are different in kind. **No runtime and no executed experiment** affects every
lane. **The concurrency pin** affects a specific, enumerable set of claims, and it is a decision rather than
a limit until someone establishes which it is.

| # | What could not be measured | Lanes | Cheapest experiment proposed |
|---|---|---|---|
| **MG-01** | Anything at all in this system — no runtime, no executed experiment; every number cited is about some other system, task distribution and date | all eight | The seeded-defect corpus R7 names as buildable cheaply and repeatedly deferred |
| **MG-02** | TC-03, TC-20, TC-39 wholly and TC-22's parallelism half, because of the concurrency pin; raising it is circular | R2, R8 | Establish whether the pin is a provider constraint or a policy by inspecting the account entitlement. If policy: a staged revision as an experiment with its own stopping rule |
| **MG-03** | Any capacity figure as a fraction of the week — the provider no longer publishes an absolute allowance | R8 | None available. Report ratios between arms and say so; note that any decision needing a fraction cannot be taken on this evidence |
| **MG-04** | Joint false acceptance for a same-family producer/checker pair on planted defects — the quantity TC-11 and the specification both demand | R7, R2 | Planted corpus; producer self-check versus separate-context checker; report a false-positive rate, with a paired clean case in the same session |
| **MG-05** | Facts lost per handoff in an agentic system carrying real obligations, stratified into facts and constraints | R2, R1 | The claim's recall probe run **stratified**, with the continuation boundary instrumented in *both* arms |
| **MG-06** | The arrival rate of genuinely novel work — the rate that decides whether any recogniser can work | R5 | **The cheapest item in the round and it needs no software:** count admitted items over a past window against the existing capability list |
| **MG-07** | What one compaction event loses in load-bearing facts rather than tokens | R1, R2 | Available today at one field read per response: reconcile the provider's reported edits against the manifest and treat any unaccounted edit as a defect |
| **MG-08** | A selection-degradation curve for a Claude-family model over a real skill library | R6 | The 10/100/1000 sweep with adversarial near-duplicates authored by a process other than the one that authored the library |
| **MG-09** | Whether a shared authoritative view raises or lowers duplicated external effects | R1 | R1 calls it its single most valuable unrun experiment: two executors, one shared view, an idempotency-key collision counter and a rate anomaly monitor |
| **MG-10** | Role label decomposed from role procedural content | R2, R3 | Three arms — label plus procedure, procedure only, label only — on one fixture at matched executor count |
| **MG-11** | Whether instantiated executor profiles converge over time | R8 | Run for a month and count distinct profiles. The only honest test of whether capability differentiation is a roster discovered rather than declared |
| **MG-12** | Whether declared tool scoping binds at runtime in this repository's own form | R3 | **One call.** Dispatch the read-only reviewer and attempt a single shell command |
| **MG-13** | Why an identical grant delivered 24 tools one day and zero on three dispatches two days later | R3 | Observe the grant *at the effect*; the verifying command currently checks configuration only |
| **MG-14** | False exclusion — correct work refused because a filter was too tight | R1, R7 | Run the paired clean case in the same session as every adverse case, and report both numbers or neither |
| **MG-15** | Authoring or maintenance effort in any unit, so the maintenance half of specialist-versus-skill is unevaluable | R6 | The "domain that changes" fixture: change one rule and count what must be edited, retested and revalidated under each unit |
| **MG-16** | An omitted **duty** in an otherwise valid skill; the closest studies omit implementation elements on software tasks | R6 | The conformance case already specified — a skill that passes every shape check whose example omits a cancellation duty |
| **MG-17** | Whether high-risk-system record-keeping is in scope for any of the four ventures | R1 | A scope determination, not an experiment. If in scope, the manifest's cost argument closes |
| **MG-18** | Whether the metered path is disabled on the actual accounts | R8 | Read the account setting. Observable today, costs nothing |
| **MG-19** | The founder-competence transfer test, or any human error rate, anywhere | R1, R3, R7 | The delayed unfamiliar-transfer test as specified. Attendance, confidence and agreement are explicitly not competence |
| **MG-20** | Coordination cost at a concurrency of two | R2 | Measure coordination minutes and transmitted context bytes separately from work performed, at the concurrency actually available |

---

## G. Cross-lane questions

Every item each lane listed under "questions other lanes may have missed", checked against the other seven
reports. **65 asked · 10 answered · 14 partially answered · 41 open.**

### Answered by another lane

| Question | From | Answered by |
|---|---|---|
| What is the writer authority on shared state, and what happens on a conflicting write? | R1 | **R3 F42, F44** — single-writer keyed state is the only surveyed mechanism answering it structurally; **R3 F24, F25** — state-write-as-event makes state and audit one artifact |
| Does any fixture actually put conflicting context in one window? | R1 | **R2 §8** — independently the same answer: "isolated context" must be split first, and only the confidentiality sense is exercised by any frozen fixture |
| Does "a loaded prose package cannot spend" survive contact with the launcher? | R2 | **R6 F7, FC-6** — no. Two lanes, same vendor page, same answer |
| Does approving a tool at install time approve the text the model reads at call time? | R3 | **R3 F48 + R4 F4 + R6** — no, from three directions |
| What is the unit of capacity under a subscription? | R3 | **R8 §3, W-6** — the units exist; the denominator does not, so every finding is a ratio |
| Does anything in the field measure whether the human operator is still competent? | R3 | **R1 TC-29 + R7 §9** — no, in three independent source sets |
| Is "role" one concept or two? | R3 | **R2 F-10 + R3's own census** — two, and the decomposition that would settle which half pays is unrun |
| What is the unit of the selection budget under a subscription? | R6 | **R8 W-6** — answered negatively; the conversion cannot be computed today |
| What is the denominator for scarce capacity? | R8 | **R8 W-6**, uncontradicted; R6 §9 Q6 asks the same and is blocked by it |
| What does idle reserved capacity cost? | R8 | **R8 §3** — allowance does not roll over, so a conservative scheduler destroys what it withholds |

### Partially answered — mechanism supplied, measurement or owner still missing

Who measures false exclusion (R1 → R7 M4, R6 F8) · Is the delivered-inputs rule satisfiable across the
provider boundary (R1 → R1 F-02, R3 §10.8) · Does a continuation count as a handoff (R2 → R3 §10.8, R1 F-01)
· What verifier false-positive rate is acceptable (R2 → R7 F9, §9; two lanes independently call it unowned)
· Does "parallel work" belong on the list right now (R2 → R8 TC-20, TC-39) · Who re-checks an expired
transfer (R2 → R6 F8, R3 §10.6) · What happens when an instruction file and an enforcement rule disagree
(R3 → R4 F6) · Can a grant be observed to have arrived (R3 → R4 F7) · If only the summary survives, what
carries the omissions (R3 → R1 F-02, useful mechanism 2) · Who owns an agent definition file (R4 → R6 F7,
R3 F60) · What is the unit of identity for a work attempt (R4 → R3 F55, F59) · Is the terminal element of
the ownership default a person (R5 → R7 §8 F-1) · Does a skill count as an external effect when it grants a
tool (R6 → R4 F7, F1) · Does a half-satisfiable criterion justify an agent or a context plus an input set
(R7 → R2 F-20, TC-36).

### Open — no lane in this round addresses them

**R1:** Does shared truth increase duplicated external effects? · What is the unit and recipient scope of a
peer work projection? · What is its retention and deletion story? · Is the record-keeping obligation in scope
for any venture?

**R2:** What is the smallest work order that completes inside one launch window? · Which of the 46
capabilities carry constraints that would not survive a 25-word compression? · Is any executor justified by
a reason not on the list, and does it say so?

**R3:** Who is accountable between declared done and accepted? · Is delegation depth a policy, a resource
limit or a safety property? · Which harness mechanisms carry a removal test?

**R4:** **Does this system have a credential at the boundary at all?** — R4 believes this the most
load-bearing unknown in its lane: every attenuation mechanism assumes a token that can be narrowed, and a
subscription session's authority is settings files and hook decisions. If nothing can be attenuated, the
constraint must be enforced by mediation, which is a different architecture. · Is delegation itself an
authority operation? · Can low-consequence actions compose into a high-consequence one? · Does approval
expire? · Who may raise a ceiling, and how is that distinguished from using one? · Is the escalation
classifier in scope for the injection it is judging?

**R5:** Is the thesis a blackboard architecture? (R5's own finding; no other lane names the source) · What is
the base rate of novel work? · Does the refusal path have its own acceptance owner? · Is re-routing scored as
a defect anywhere in the package? · Who owns the triage queue's own backlog? · What is the alarm on the
unroutable destination, and who is paged by it? · Is the authority to add work to a live case separately
granted from the authority to perform it? · Does any mechanism count overflows? · What does "done" mean when
the resolution field is empty?

**R6:** Who owns a skill's expiry date? · What reaches the selection surface — what is the lossy projection
from a full package to its selectable description? · Is skill selection itself a run requiring a manifest? ·
How is a skill retired when a live claim or an accepted run pins it? · Who authors the adversarial
near-duplicates?

**R7:** **Does the shared source of truth become the preference-leakage channel that defeats provenance
separation?** — the sharpest adverse question against the thesis's central mechanism, and R1 owns state and
does not cover it. · Who checks the checker's inputs? · At what detection rate does a checker stop being
worth its capacity? · What is the human anchor's own error rate? · Is "no runtime exists" protecting a wrong
number?

**R8:** Are executor profiles stable over a month? · Who owns a reservation when reservations are held by
class and a class has no representative? · Is the metered path disabled on the actual accounts today? · If a
provider doubled or halved the allowance overnight, would any decision change? · **Is the concurrency pin a
provider constraint or a policy?** — the highest-leverage open question in the round, because it gates the
disposition of four claim verdicts. · When does the simple baseline stop being the simple baseline?

---

## H. Statement-kind census

Kinds are counted from the DIRECTIVE §6 label each lane attached to each numbered finding, taking the
**first** label where a finding carries two, so inference is undercounted by design and separately-headed
inference blocks are reported alongside. "Declared interest" is counted from each lane's own conflict-of-
interest column, including academic author-interest where the lane wrote one. Anthropic-family rows are
counted separately because every lane shares that family and cannot treat those rows as external.

| Lane | Findings | Kinds (first label) | Source rows | With a declared interest | Anthropic-family rows |
|---|---|---|---|---|---|
| R1 | 24 | fact 6 · source claim 17 · disagreement 1 · *(9 separate inference blocks, 1 unknown block)* | 31 | 18 | 8 |
| R2 | 21 | source claim 14 · fact 2 · inference 5 · *(5 compound, 6 named gaps)* | 30 | 18 | 5 |
| R3 | 62 | source claim 38 · inference 13 · direct observation 8 · disagreement 4 · unknown 2 | 37 | **35** | 10 (+1 self-observation) |
| R4 | 14 | source claim 10 · inference 2 · fact 1 · direct observation 1 | 27 | 25 | 6 |
| R5 | 24 | source claim 23 · unknown 1 *(2 flagged conflicted, 1 excluded as folklore)* | 30 | 17 | **2** |
| R6 | 12 | source claim 6 · direct observation 5 · fact 1 · *(8 inference blocks, 2 unknowns)* | 28 | **27** | 8 (+1 self-observation) |
| R7 | 20 | source claim 19 · direct observation 1 | 26 | **8** | **2** (+2 self-observation) |
| R8 | 22 | source claim 9 · inference 8 · direct observation 2 · disagreement 1 · unknown 1 · folklore 1 | 24 | 18 | 9 |
| **Total** | **199** | | **233** | **166** | **50** |

**What Step 3 should take from this.**

- **INFERENCE.** About seven in ten source rows carry a declared vendor, author or commercial interest, and
  roughly one in five of all rows is the lanes' own model family reporting on its own products. A framer who
  treats this evidence base as neutral is treating a vendor corpus as neutral.
- **DIRECT OBSERVATION.** The two lanes whose *subject is* vendor documentation — frameworks and skills —
  are the two most dependent on it, at 35 of 37 and 27 of 28 rows. Their least-conflicted rows are the
  matched-budget papers, and those rows carry the round's most cross-cutting result.
- **DIRECT OBSERVATION.** Verification and routing are the least dependent on the lanes' own vendor, at two
  rows each. Economics is most exposed exactly where it matters: nine of twenty-four rows are the provider
  describing its own allowance, and the quantity that binds is the one the provider stopped publishing.
- **DIRECT OBSERVATION.** Source claims outnumber facts and direct observations heavily in every lane. The
  direct-observation-heavy blocks are all *internal*: the frameworks lane reading this repository, the
  skills lane reading its own library, the authority lane reporting a tool absence, and the verification
  lane correcting this repository's own records. **The round's own artifacts are the only things anybody in
  it observed rather than read about.**
- **DIRECT OBSERVATION.** No lane registered a claim. **Seven of eight report the claim-registration tool
  absent from their session while the roster declares the grant**; the eighth declined on its own judgement,
  reasoning that registering an inference would launder it. So **not one quotation in this round has been
  machine-verified against its source by the resolver**, and the round reproduced, in its own operation, the
  declared-versus-delivered gap it identifies as axis X16.

---

*Step 2 artifact. Nothing here is a decision. `decision: null` in the machine-readable mirror.*
