<!-- PROVENANCE (orchestrator, ceo-4-1789314685, 2026-09-14). Reviewer: `reviewer` engine, lane `f2-06-recheck-03`; authored nothing in this package; brief carried subject + criteria only (no producer accounts, no names files, no index, no recheck-01, no register fields beyond F6X-02's issue/proposed_repair). Subject: `ee86480`; root HEAD advanced to `3d09545` during the review (state.json only, barred and unread; every judged file byte-identical, all reads via `git show ee86480:`). Validator and fixture runners not run by instruction. Return channel: not truncated; this file is the reviewer's final transcript message verbatim (64,825 chars, 378 lines, cmp-verified). Verdicts on 15 prose-side items: 12 CLOSED at specification level, 1 PARTIAL (F6A-12, denominator clause), 3 CLOSED with a regression or residue attached (F6C-05 → F6W-04; F6V-01 → F6W-05; F6V-04 → F6W-06; F6X-02 chapter half → F6W-07/08). New findings F6W-01..08, none (d). One model family; procedural independence only; no runtime exists. -->

Verification complete. Full report follows.

## Précis

Subject `ee86480` at start; `3d09545` at end. The only commit in between touches `docs/vision-system/state.json`, a path I was barred from and did not read, so every file I judged is byte-identical across the window. All reads were pinned with `git show ee86480:<path>`.

**Twelve of fifteen close at specification level. One is PARTIAL. Two close with a regression or a residue attached.** Eight new findings, numbered F6W-01…F6W-08; none is (d)-class, so none blocks.

What holds up. The repairs are unusually disciplined about their own limits. Every number that the package did not already hold is labelled a placeholder with the founder named as owner, so the scope-lens test for invented numbers passes on every item. Three arithmetic claims I recomputed from the capability binding rather than the prose — 46 capabilities, 46 distinct named acceptance roles, 41 of 46 carrying `human` among implementation modes — are exact. The R-G02, R-D15 and R-X07 rule-id traces added to the decisions register all resolve, and the one that did not land, R-X07, is recorded as outstanding rather than quietly dropped. `guard.launch.actual_compared_to_expected` carries no comparison operator, which I confirmed independently of the finding that said so, and the F6V-01 repair states the corrected mechanism in both places its contract named.

What does not. Four defects were introduced or left by the repairs themselves:

- The `07` chapter header still reads "the planning shares are unchanged" while the F6C-05 repair split the bundled 10% row into 6% and 4% in the same tree. The header was true before the repair and is false after (F6W-04).
- `05` §13 row 9 still says the conjunct compares the two launch counts — the exact claim F6V-01 corrected in `07` §6 and `02`. Three artifacts described one conjunct, two were fixed (F6W-05).
- `04` line 117 cites `05` §192 to carry the F6V-04 disposition. Line 192 of `05` is blank at the subject; the paragraph moved to 211 when the F6A-02 repair inserted two paragraphs into §7 the same day (F6W-06).
- The holder-review denominator is 46 roles + 46 alternates + 4 holders = 96 records. `05` §12 defines `StandingHolder` as carrying an alternate four lines above, so the count is 100 and the omission runs toward a smaller founder load (F6W-02). Branch B's formula has no term that puts a holder on the founder, so both stated endpoints — "at n = 0 branch B is branch A" and "at n = 46 the founder's load is the four holders alone" — contradict it (F6W-03). F6A-12 is PARTIAL on that clause alone; its other eight clauses are met in full.

Also raised: R-X07 is the rule two consolidation findings are recorded as repaired by, and it appears nowhere under the specification (F6W-01); "these ten strings" against an eight-member table plus one new field name (F6W-07); and the closed `boundary_kind` set claims one member per transfer the six fixtures name, while fixture 4 is cited by no row (F6W-08).

Independence is procedural only. I share one model family with the authors, I read no session file, no producer self-assessment and no field of the findings register beyond F6X-02's two permitted ones. No runtime exists.

## Provenance

**Subject.** `ee86480` confirmed at start by `git rev-parse --short HEAD`. At the end of the pass `HEAD` reads `3d09545`. The single intervening commit changes `docs/vision-system/state.json` and nothing else, verified by `git diff --name-only ee86480 3d09545`. `state.json` is on my barred list and I did not open it. Every file I judged is identical at both commits, and every read was taken through `git show ee86480:<path>` rather than from the working tree, so the subject was frozen in fact and not only by instruction. The working tree was clean throughout.

**Criteria applied.** `docs/vision-system/planning/F2/00-acceptance-protocol.md` as frozen 2026-09-13, read in full: §5 classes (a)/(b)/(c)/(d), §7 evidence rules and labels, §8 disposition rules and the standing caveat, §1 on fixed boundaries and reviewer independence, §3 fixtures and §4 negative controls where a repair touched them. Review-lens ids `evidence`, `correctness`, `scope`.

**Method.** For each item I listed the clauses of its required contract, then located the passage satisfying each clause by file and line. Where a repair states a number I recomputed it from the artifact rather than reading it: the capability counts from `planning/specification/capabilities.json`, the guard bodies from `planning/specification/contracts/predicate-registry.json`, the share arithmetic from `07` §6, the denominator arithmetic from `05` §12's own record definitions, and the consolidation matrix cells from the matrix itself. Where a repair cites a source I opened the cited range and compared it against the citing sentence.

**Bounded existence checks, declared.** Four citations resolved into `planning/F2/05-selection-record.md`, which my brief does not bar but which is another lane's artifact: the R-G02 rule-table row, the R-D15 and R-X07 rule-table rows, and the FAL-01 text at §8.3. In each case I read the cited lines, settled whether they say what the citing sentence claims, and carried nothing else out. All four resolve exactly.

**What I did not read, by instruction.** `.worktrees/` and `.claude/worktrees/`, `docs/08-agents_work/**`, `state.json`, `history.jsonl`, `planning/PLANNING-REPORT.md`, `planning/site/**`, `planning/F2/07-repair-names-contract.md`, `planning/F2/08-repair-names-prose-b.md`, `planning/reviews/F2-06-findings-index.json`, `planning/reviews/F2-06-recheck-01.md`, `.claude/memory/**`. Of `registers/review-findings.json` I read exactly two fields of exactly one entry, F6X-02's `issue` and `proposed_repair`, extracted programmatically so no neighbouring field entered context. `proposed_repair` is `null`; the `issue` field points at F6B-02's required contract, which I then read in review B to recover the two clauses.

**Commit metadata.** I used `git log --format` on file paths to establish when a line changed, and `git diff` on artifact content. I did not read commit messages as evidence for any verdict; where I needed to know whether a defect predates a repair I compared the file contents at the two commits directly.

**I authored nothing in this package.** I did not produce, edit or review any of the fifteen repairs before this pass, and I hold no write tools.

## 1. Per-item verdicts

| id | class | verdict | one line |
|---|---|---|---|
| F6A-02 | (c) | **CLOSED at specification level** | The world-change sweep is named in `05` §7 with owner C02 and a latest responsible start, and the (c)-class probe carries protocol, baseline, unit, repetition, stopping rule and an owner who is not C02. |
| F6A-04 | (b) | **CLOSED at specification level** | `02-architecture-selection.md` §4 now states the answer as a labelled DECISION: the standing pre-authorisation performs the ordered release transaction once, at grant, and C04 remains the only releaser. |
| F6A-05 | (b) | **CLOSED at specification level** | `05`'s header records AT-M5-03 / MD-24 as dissolved by non-adoption and names §6's unmechanised overlap detector as the residue. |
| F6A-11 | (b) | **CLOSED at specification level** | AD-019, AD-020 and AD-021 gained specification references; the three unlanded rule ids are each traced or declared outstanding. New finding F6W-01 on the consequence. |
| F6A-12 | (c) | **PARTIAL** | Eight of nine clauses met, including the §13 entry with its full protocol. The denominator clause is met in form and wrong in content: F6W-02, F6W-03. |
| F6B-04 | (c) | **CLOSED at specification level** | `06` §7 adds the fifth F-4 arm with a 10-point floor, a rate per controlled defect case, five trials, a 60-case stopping rule and owner C06. |
| F6B-08 | (c) | **CLOSED at specification level** | The human-anchor error rate is the sixth owed measurement in `05` §13(2), with a stopping rule and a SPECIFICATION-labelled interim reporting rule. |
| F6C-05 | (a) | **CLOSED · regression F6W-04** | The 10% row is split into 6% maintenance and 4% evaluation as placeholders under MD-08; the same edit falsified the chapter header. |
| F6C-12 | (a) | **CLOSED at specification level** | `05` §6 counter (4) now names the registered `AdmissionRecord.escalated` phase, whose criterion I verified demands exactly the three fields claimed. |
| F6C-18 | (b) | **CLOSED at specification level** | FAL-01 is carried into `07` §7 as a SOURCE CLAIM, with what it does and does not change to the money rows stated, and the capacity figure marked UNKNOWN. |
| F6C-19 | (b) | **CLOSED at specification level** | The consolidation carries an amendment recording the two inconsistent matrix cells, editing no cell, and naming the method fix as owed with an owner. |
| F6V-01 | (a) | **CLOSED · new finding F6W-05** | Both sites the contract named are corrected and carry the pin's reason. A third site, `05` §13 row 9, still states the falsified claim. |
| F6V-03 | (a) | **CLOSED at specification level** | Foundation 6's five-shapes-at-90%-over-one-month is carried into both `02` §8 and `05` §124 with the placeholder label and the founder as owner. |
| F6V-04 | (b) | **CLOSED · new finding F6W-06** | Both properties are restated in `04` §117 as SPECIFICATION with the dose left proposed; the paragraph's closing cross-reference is dead. |
| F6X-02 (chapter half) | — | **CLOSED · new findings F6W-07, F6W-08** | `05` §5 states an eight-member closed `boundary_kind` set and names `contested_refs` as required on `OperatorProjection`. The string count and one fixture's coverage do not follow. |

## 2. Detail per item

### F6A-02 · class (c) · CLOSED at specification level

**Clauses.** (i) Either a named periodic sweep in `05` with an owner and a latest responsible time, or an explicit statement that world-change work enters through `02`'s scheduled cross-domain review with a pointer; (ii) plus the protocol, baseline, unit and stopping rule that would test whether it catches them.

**Clause (i) — first branch taken.** `05-work-agents-skills.md:205` specifies a `Schedule` whose accepted capability version is the world-change sweep, with **owner C02** holding the schedule and its alternate, **missed-occurrence policy `individual reconciliation`**, and a **latest responsible start of one occurrence per review period**. Each occurrence enumerates jurisdiction, provider terms, professional obligations and counterparty agreements and writes a work record for every change, which is what returns the item to the armed set's reach. A sweep that finds nothing records that it found nothing; an occurrence that does not run is `missed` and is itself admitted work. The policy value is real: `05` §7's second paragraph enumerates individual reconciliation, coalesce, skip-expired and escalate as the four admissible policies, and `missed` is one of the seven occurrence states, so the sweep is expressed in vocabulary the section already carries.

**Clause (ii).** `05:207` is labelled DESIGN PROPOSAL and states the hypothesis as a hypothesis — *"naming a sweep does not supply any [evidence]"*. **Protocol:** a planted-item probe, where a party outside the sweep's producing path records a dated set of real external changes out of band before the window opens, compared against the sweep's output after it closes. **Baseline:** the first full review period of ordinary operation. **Unit:** planted items surfaced within their latest responsible time as a fraction of planted items, reported beside the count of unplanted items surfaced, with the reason given — a sweep that surfaces everything and one that surfaces nothing each score well on one number alone. **Repetition:** every review period. **Stopping rule:** two consecutive periods at or above threshold retire the probe; one below withdraws the sufficiency claim and reopens the layer-3 removal criterion. **Owner:** the instrument custodian of `06` §5, explicitly **not C02**, which owns the sweep and may not grade itself.

**Evidence check.** `06-knowledge-evidence-evaluation.md:90` (§5, R-X14) does name "a dedicated instrument custodian excluded from every producing path" as the sole writer alongside C06. The citation is exact and the exclusion it relies on is real.

**Scope.** The repair also rewrote the layer-3 removal criterion at `05:203`, whose comparator read *"the existing scheduled review"*. That is inside the finding's ask, not outside it: the finding's own "what the chapter offers instead" paragraph named that comparator as the thing that resolves to nothing. The amendment note states the old text, the reason and the check date.

**Observation, not a finding.** The sweep's latest responsible time is one occurrence per review period, and the period length is UNKNOWN, a founder parameter shared with §12. F6A-12's repair proposes four participation cycles as a placeholder. So the sweep's deadline is settable only once the founder sets that parameter. It is deferred with an owner rather than silent, which is what the class permits, but the two items are coupled and a reader should know it.

### F6A-04 · class (b) · CLOSED at specification level

**Clause.** One sentence in `02-architecture-selection.md` §4 stating whether a standing pre-authorisation discharges the ordered release transaction for C2, or a decision packet if it does not.

**Where it is satisfied.** `planning/02-architecture-selection.md:100`, immediately after the paragraph carrying the five ordered-release checks, labelled **DECISION (F6A-04, 2026-09-14)**. It states that a standing pre-authorisation does not dispense with the ordered release transaction; it performs it once, at grant. What a model call consumes per turn is the attempt right that transaction already produced. Three consequences are drawn: an expired or revoked standing contract leaves no attempt right to consume, so the call is refused rather than defaulted; a per-call projection that fails conformance is an attempt right never acquired rather than a release C04 declined; and C04 remains the only releaser.

**Evidence check, both citations.** The DECISION says `05` §11 refuses the "model calls are exempt" branch by name. `05-work-agents-skills.md:315` does: *"The 'model calls are exempt' branch is refused: exemption would have relaxed a fixed boundary, and taking a construction the boundary already admits does not."* It says `02-authority-recovery.md` §8.2's two admissible constructions govern what bytes may be built and are silent on who releases and when. `02-authority-recovery.md:299` carries the R-D12 paragraph and confines itself to the projection as the destination-clean construction that discharges the disclosure contract. The DECISION is explicit that its answer is read from itself and from the contract's expiry, **not** from §8.2 — which is the narrow reading the finding asked for, stated as such.

**Label.** DECISION is the honest label under §7. It is a choice between two readings of an existing boundary, not a specification of new behaviour and not a measurement. Because the reading taken is that the boundary is satisfied rather than relaxed, no decision packet is owed, and the finding's disjunction permitted exactly this.

**Minor, noted not raised.** The paragraph says "the five checks above are checks on the standing `DisclosureContract`" and then parenthesises four of them, the fifth being the disclosure contract itself. Self-consistent on a careful reading.

### F6A-05 · class (b) · CLOSED at specification level

**Clause.** One line recording MD-24 as dissolved by non-adoption, naming §6's pre-existing detector as the residue.

**Where it is satisfied.** `05-work-agents-skills.md:3`, in the chapter header's packet mapping: *"One consolidation finding is in no packet and is closed by no passage, and it is recorded here as dissolved rather than left unlisted: AT-M5-03 (MD-24 in the consolidation's numbering, dimensions W2/W8) is dissolved by non-adoption"* — layer 3 adopts `StandingInterest` generically and not the semantic-conflict merge interest the finding was against, the same dissolution MD-20 takes, with the four adopted interests named. The residue clause follows in the same sentence: §6's pre-existing S1.0 sentence *"C02 detects new overlap"* states no mechanism, and §9 conformance case 2 depends on it.

**Evidence check, both halves.** *"C02 detects new overlap"* is at `05:173`, which falls inside §6 (heading at line 169). §9's numbered case 2 is *"Two producers independently improve product and onboarding. Their isolated edits merge, but an incompatible promise fails integration acceptance"* — a case that cannot be evaluated without semantic conflict detection. Both citations land.

**Cosmetic, noted not raised.** The passage reads `**dissolved by non-adoption****` — four trailing asterisks, which will render as two stray characters. It fits none of the four §5 classes and is not a finding.

### F6A-11 · class (b) · CLOSED at specification level

This finding carries no "Required contract" line, so I judged it against the four computable claims in its own body.

**Claim 1 — AD-019, AD-020, AD-021 carry no `evidence_and_reasoning` entry under `planning/specification/`.** Repaired. AD-019 gains three: `05#7-durable-schedules-and-capacity-gaps` for R-L3, `05#9-positive-adverse-and-capacity-limited-conformance` naming adverse row 5, `05#10-registered-lifecycle-phases-named-only-in-the-registry` for `StandingInterest.trial`, plus `11-schemas-state-contracts.md`. AD-020 gains `05#4…` for R-L4, `05#10…` for `ExistenceJustification.admitted`, plus `11`. AD-021 gains `05#12-standing-accountability` for R-L5, `05#10…` for `StandingHolder.suspended`, plus `11`. Every anchor I checked matches a real heading by the standard slug rule, and the one content claim I could test from the chapter — adverse row 5 as "an untrusted entry promoted to attested by the investigating activation" — is verbatim.

**Claim 2 — AD-018 cites no attack-consolidation finding id.** AD-018 cites AS-X-01 and G-02, which are a review id and a uniform gap rather than one of the 105 in the consolidation. The repair did not change this and did not claim to.

**Claim 3 — R-G02, R-X07 and R-D15 appear nowhere in the specification.** Still true, and I recomputed it: `git grep` over `planning/specification/` returns zero files for each of the three, against one file each for the R-D11, R-X20 and R-X14 controls. The repair addresses each in the relevant `epistemic_basis`, and all three claims verify:

- **R-G02 (AD-018).** The selection record's rule table at line 459 reads `| **R-G02** | G-02 | = **R-D11** (acceptance-criteria authorship) |`. R-D11 lands at `06-knowledge-evidence-evaluation.md:141`, inside §7 (heading at 127). The claim "the ID did not land; the RULE did" is exact.
- **R-D15 (AD-019).** The rule table at line 697 gives R-D15 two halves: no promotion of trust class by an activation, and the floor rule that a derived entry's trust class is the floor of its inputs'. The repair traces the first to `05` §9 adverse row 5, the trust-class prerequisite to `05` §7 where it is cited as "D-15", and the floor half to `R-X13` in the predicate registry. I confirmed the last directly: the predicate's `meaning` reads *"A derived item's trust level is the floor of its inputs', never higher (R-X13, AX-M2-04)."*
- **R-X07 (AD-021).** The repair states flatly that it **DID NOT LAND** — neither the string, nor `capability_refs`, nor the per-capability-never-grouped rule appears under the specification — and records it as outstanding, not as specified. Both greps return zero. This is the right disposition and the honest one.

**Claim 4 — AD-001…AD-010 also carry zero specification references.** Unchanged and not asked for.

**Consequence raised as new.** The selection record records AC-M1-04 and AC-M5-01 as "repaired-by R-X07", and its whole-company-scope row rests on it. A rule that repairs two findings and lands in no chapter is F6W-01.

### F6A-12 · class (c) · PARTIAL

**Clauses.** (1) review-period length; (2) holder-hours-per-period figure with its denominator; (3) scope over the 46 acceptance-owner roles as well as the four holders; (4) baseline; (5) unit; (6) repetition; (7) stopping rule; (8) owner; (9) added to §13's list of missing measurements.

**Met.** Clause 1 at `05:350` — four participation cycles, twenty declared operating days, with the five-day cycle sourced to `04` §107 and the **four** labelled a DESIGN PROPOSAL placeholder owned by the founder. Clause 3 at `05:350` and `:352`, explicitly over the 46 roles and their alternates as well as the four holders. Clauses 4–8 at `05:393`, as the fifth owed measurement: **baseline** the first full review period of ordinary operation; **unit** holder-hours per period reported with its record-count denominator and never without it; **repetition** every review period; **stopping rule** two consecutive periods within the declared batch minutes, one period above reopening §12's placeholders; **owner** C02 for the count, founder for the placeholders. Clause 9 is satisfied by that same entry, and the list's own count is consistent — it says six and enumerates six.

**Numbers recomputed, and they hold.** The denominator's basis is *"46 capabilities, 46 distinct named acceptance roles, 41 of the 46 carrying `human` among their production modes."* From `planning/specification/capabilities.json`: 46 CAP entries; 46 distinct `acceptance_contract.responsible_role` strings with no repeats; and 41 entries whose `implementation_mode` array contains `human`. All three are exact. The prose says "production modes" where the field is `implementation_mode`, which is a vocabulary difference the package already lives with, since `Obligation.production_mode` is a different field in `07` §6.

**Not met — clause 2's content.** The denominator is *"46 roles + 46 alternates + 4 holders = 96 records on one party"*, and 96 × 10 minutes = 960 minutes = 16.0 hours per period = 4.0 hours per participation cycle. The arithmetic is internally correct. The enumeration is not: `05:340` defines `StandingHolder` as *"an address, a mandate, a reservation, an alternate, a suspension procedure and a review date"*, four lines above, so the four holders carry four alternates. The count under the chapter's own rule is 100 records, 1,000 minutes, 16.67 hours per period, 4.17 hours per cycle. That is F6W-02. Separately, branch B's formula carries no term that can place a layer-5 holder on the founder, so neither of its two stated endpoints follows from it — F6W-03.

**Honesty of the packet handling.** The paragraph states plainly that it does not answer Q-017 and must not be read as having answered it, and it names n, h and m as stated nowhere in the package. I read Q-017 directly: status `Open`, owner `founder`, and the four options in its packet correspond to the branches the paragraph prices. The paragraph's sharpest line is not arithmetic — *"a party that is its own alternate is one point of failure recorded as two"* — and that objection survives both of my corrections.

**Observation.** `02` §8 still opens the sentence *"The second unpriced item is the founder-attention load"* while `05` §12 now prices it. Defensible, since what §12 produces is placeholders rather than measurements, and the contract did not name `02` §8. Worth one line to whoever next edits that row.

**Observation.** The fifth measurement's stopping rule is "two consecutive periods within the declared batch minutes", and `04` §105's `maximum decision-batch minutes` is, in the repair's own words, a container carrying no value. The rule is settable once a `ParticipationPlan` exists, which the design requires, and the fourth measurement carries the same shape from before this repair. Not a finding.

### F6B-04 · class (c) · CLOSED at specification level

**Clauses.** A fifth F-4 arm, the same checker run twice over the same context, reported beside the other four, with a stated floor, a unit, a repetition count, a stopping rule and an owner.

**Where satisfied.** `06-knowledge-evidence-evaluation.md:143`, a single SPECIFICATION paragraph carrying all seven. The arm: one checker run twice over the same context, its two verdicts combined exactly as a two-channel panel's are, **reported beside the other four rather than in a separate study**. Its purpose is stated as the finding stated it — the control that excludes "more compute" as the explanation of any separation the independent arms show. **Unit:** joint false acceptance on controlled injected defects, as a rate per controlled defect case, reported with its paired clean-case refusal rate under §6's both-numbers-or-neither rule. **Floor:** an arm counts as different from single review only at ≥10 percentage points **and** with the 95% interval excluding zero under the cluster-aware method the section already requires; below the floor the arms are reported as not separated, **not as equal**. **Repetition:** five attributable trials per selected case. **Stopping rule:** 60 controlled defect cases, or when the interval excludes the floor in either direction, whichever comes first, with a budget-truncated run reporting the shortfall and resolving `unresolved`, never `pass`. **Owner:** C06, the owner of the fourth arm.

**Labels.** The arm is SPECIFICATION; the 10 points, the 60 cases and the five trials are DESIGN PROPOSAL placeholders with C06 named. That split is the honest one: the procedure is decided, the constants are not.

**Closing clause worth keeping.** *"Until this arm runs, agreement between the independent arms is reported and not credited as extra assurance."* That is the §6 rule the finding said was adjacent, now carrying the comparator it lacked.

**Observation on negative control 10.** Protocol §4 item 10 voids any fixture or measurement rule written once a candidate's result was known. A fifth F-4 arm is a measurement rule written now. I do not raise it, for two reasons that I think are the right ones rather than convenient ones: the arm makes the candidate's verification obligation harder rather than easier, which is the opposite of the direction NC-10 exists to catch; and protocol §3 describes the six fixtures as "required future evaluation cases", which a fourth arm already extended before this round. A reader should still know the tension exists, because the same reasoning would not excuse an arm that loosened a test.

### F6B-08 · class (c) · CLOSED at specification level

**Clauses.** Add the human-anchor error rate to the owed-measurement list with a stopping rule, and state the interim reporting rule while MD-04 is open.

**Where satisfied.** `05-work-agents-skills.md:393`, as the sixth owed measurement. It carries the instrument (`04` supplies unaided recognition, intervention quality, false-positive assessments, owner time and reported burden measured separately; delayed transfer after a predeclared interval; consented longitudinal comparison before any preservation claim), states what `04` does **not** supply, and names the circularity rather than hiding it: the owner is itself packet MD-04 / Q-019, whose `uncertainty` field records that the measuring test is blocked behind that decision. **Baseline** the first full participation cycle after MD-04 is answered; **unit** disagreements per hundred human acceptance decisions, reported with the count and never as a bare rate; **repetition** every participation cycle; **stopping rule** two consecutive cycles inside the interval declared with the baseline, with any cycle outside reopening the instrument rather than the subject; **owner** the acceptance owner named by MD-04 and explicitly **not the founder, who is the subject**.

**Interim rule, and it is the better half.** Labelled SPECIFICATION rather than placeholder: every figure anchored on the human acceptance step is reported with its anchor's error rate stated as `unknown` with a reason, in the `MeasuredQuantity` shape — `{knowledge: unknown, reason, held_maximum}` — so an unmeasured anchor cannot be reported as a measured one and no downstream number inherits a confidence the anchor has not earned. I verified the shape exists as cited: `05:215` defines `MeasuredQuantity` as exactly that exclusive-or.

**Evidence check on the dependency.** The entry says the rate is "the expected error rate of the human acceptance step that (4) below names". Item (4) of §13's excludes list does name it: *"`04-human-operation.md`'s competence mechanism — inherited here by name — is the instrument that reads him, with an unmeasured error rate of its own."* The cross-reference resolves.

### F6C-05 · class (a) · CLOSED · regression F6W-04

**Clauses.** Split the 10% row and register evaluation's own share in `07` §6 units, **or** withdraw "its own row" and say evaluation is funded from the maintenance row.

**First branch taken.** `07-integrations-capacity.md:99` now reads *"6% maintenance and 4% evaluation — two separate rows summing to the 10% this pair previously shared"*, marked a DESIGN PROPOSAL placeholder owned by the founder under packet MD-08, with "neither number is a measurement" stated. I recomputed the shares: 50 + 20 + 15 + 6 + 4 + 5 = 100.

**The R-X11 paragraph now agrees with the table.** `07:111` states evaluation carries its own row among the enumerated shares, distinct from maintenance's 6%, *"not funded out of whatever is left and not funded out of the maintenance row"*, and resolves the tension the finding identified between a distinct row and a shared shed tier: *"the row says what evaluation is funded from, the tier says when it yields."* `05:215` carries the matching sentence, so the chapter that said evaluation "sheds at the maintenance tier" now says both halves.

**Amendment note.** Present and accurate: it quotes the superseded text, states that the enumerated shares are the only table the section has, and explains why the split branch was taken rather than the withdrawal branch.

**Regression.** The chapter header at `07:3` still asserts that "the planning shares are unchanged". I traced this: the clause was added at `896a4f0` on 2026-09-13, when the shares still read 10%; it was true then. The shares changed at `c5e60d0` today, the commit carrying this repair, and the header was not touched. See F6W-04.

**Cosmetic.** `07:111` contains a doubled em dash, "— —". Not a finding.

### F6C-12 · class (a), low severity · CLOSED at specification level

**Clause.** Say `escalated`, or register the phase.

**First branch taken.** `05-work-agents-skills.md:185`, silent-drop shape (4), now reads *"the terminus of every ladder is the registered `AdmissionRecord.escalated` phase, whose criterion demands a named acceptance holder standing at `staffed`, a recorded `escalation_deadline` and the duty class escalated in."* The amendment note records what the string was, that it occurred once in the specification and zero times in the registry, and that the substance was already registered under another name — *"This is naming, not mechanism: nothing about the ladder's terminus changes."*

**Computed, not taken on trust.** `criterion.AdmissionRecord.escalated.v1` in the predicate registry requires `nonempty_fields` over `/payload/acceptance_holder_ref`, `/payload/escalation_deadline` and `/payload/duty_class_id`, plus `related_phases` binding the holder to `staffed`. The chapter's three demands map one to one onto the guard's three field paths and its phase binding. Its stated meaning is *"An escalation ladder that ends assigned and silent is the failure this phase exists to make visible."*

**Why this one matters more than its severity suggests.** The repair cites `05` §10's own principle in the converse direction — a state in the prose and nowhere in the machine costs what a state in the machine and nowhere in the prose costs. That symmetry is the durable part.

### F6C-18 · class (b) · CLOSED at specification level

This finding carries no "Required contract" line. Its implicit ask is propagation: a reader comparing the simple baseline on capacity inside the specification should not be left with the intuitive answer that a primary source the round already holds has falsified.

**Where satisfied.** `07-integrations-capacity.md:174`, at the end of §7, labelled **SOURCE CLAIM**. It carries FAL-01 in full — B0 does not have the lowest plausible consumption of scarce capacity, on four documented provider mechanisms: the full conversation sent with every request and again with every tool batch; the first message after a break longer than the cache lifetime reprocessing the full context; compaction reading the conversation it summarises and being itself a large request; idle check-ins each sending full context. It then states precisely what it does and does not do to the section's rows: the tables price money only, claim no capacity advantage for S1 in either direction, and close with *allow S0 to win*, all of which stands. What the falsifier removes is the **intuitive** argument that the option making fewest launches consumes least scarce capacity. It closes **UNKNOWN**: the weekly-bucket consumption of S1, S1-VPS and S0 is unmeasured, with §6's expected-versus-actual launch count named as the owed instrument.

**Evidence check.** Bounded read of the cited range in the selection record, line 1152: *"FAL-01. B0 does not have the lowest plausible consumption of scarce capacity. Four documented provider mechanisms contradict it: the full conversation is sent with every request and again with every tool batch; the first message after a break longer than the cache lifetime reprocesses the full context;"* — verbatim, including the two mechanisms visible in the range. The citing passage does not overstate its source.

**Label.** SOURCE CLAIM is the conservative and correct choice under §7. The four mechanisms are provider-documented, but the package holds them through the selection record rather than through a primary inspection recorded here, and §7's rule on model-generation dependence is exactly about this material.

### F6C-19 · class (b) · CLOSED at specification level

No "Required contract" line. The implicit ask is that the reporting inconsistency be recorded where the matrix lives.

**Where satisfied.** `planning/F2/04-attack-consolidation.md:629`, a dated amendment. It records that M1 on W7 reads `S` while AT-M1-02 and AT-M1-03, both class (d), are recorded against M1 on W7, and that M3 on W7 reads `S²` while AT-M3-03, class (d), is recorded against M3 on W2/W7.

**Every count recomputed from the matrix itself.** Row M1 column W7 is `S`; row M3 column W7 is `S²`, with the footnote defining it as "sufficient (strongest in the round)". Line 88 classes AT-M1-02 as **d** against M1 on W7; line 89 the same for AT-M1-03; line 98 classes AT-M3-03 as **d** against M3 on W2, W7. The insufficient-count line reads W13 among the dimensions at 0, and the coverage line records AE as having taken W4 and W13, which is F6C-19's "judged once, by the lane that also judged W4". The by-candidate counts M1 4 · M2 3 · M3 4 · M4 6 · M5 5 match what F6C-19 quoted.

**What makes this a good amendment rather than a cosmetic one.** It states its own limit — no matrix cell edited, no verdict restated, no finding reclassified — and it declares the honest UNKNOWN: the consolidation never stated whether a dimension verdict summarises blocking findings only or all findings, so it cannot be settled here whether the two cells are wrong or merely under-specified. It names the resolution as owed, with the consolidating lane as owner, and sets the interim rule that the finding list governs wherever the two disagree. That is the disposition §5 asks for on a (b).

### F6V-01 · class (a) · CLOSED · new finding F6W-05

**Clauses.** Amend `07` §6 to say that both counts are demanded at run close and the divergence is readable from the record rather than stored, carrying the pin's reason, **or** add the comparison conjunct and the divergence field; and `02` line 188's "checked against actual" moves with it.

**First branch taken, in both named places.** `07:113` now reads that both counts are demanded at run close, `WorkflowRun.actual_native_launch_count` beside the declared expectation, bound by a conjunct requiring both pointers present and the definition to be an admitted procedure version — and that *"the divergence is readable from those two values and is deliberately NOT stored as a third number"*, quoting the pin's reason verbatim: *"a stored difference can disagree with the two values it is derived from, and this package has paid for that class of mistake more than once."* `02-architecture-selection.md:190` moves with it, carrying the same construction and its own amendment note recording that the old wording "reads as a stored comparison the pinned conjunct deliberately does not make."

**Computed independently.** `guard.launch.actual_compared_to_expected` contains exactly two predicates: `nonempty_fields` over `/payload/actual_native_launch_count`, `/payload/expected_native_launch_count` and `/payload/workflow_ref`, and `related_phases` binding `workflow_ref` to `admitted` or `restricted`. There is no comparison operator. The guard's own `meaning` now reads *"so the divergence is readable from the record"*, which agrees with both repaired chapters.

**The third site.** `05` §13 row 9 still reads *"compared by a conjunct on the run's `* → accepted` edge"*. The contract named two locations and both are fixed; this one was not named and was not fixed. F6W-05.

### F6V-03 · class (a) · CLOSED at specification level

**Clauses.** Carry foundation 6's five-shapes-at-90%-over-one-month into the layer-4 removal criterion at `02` §8 and `05` §124, with the same DESIGN PROPOSAL placeholder label and owner; **or** mark the removal criterion UNKNOWN with a packet id and state that the reopen condition's numbers do not govern it.

**First branch taken, in both named places.** `05-work-agents-skills.md:124` now reads *"It is removed when at most five distinct worker shapes account for 90% or more of admitted work orders over one month"*, sourced to `02` §9 foundation 6 and §8's layer-1 row, *"carried here by F6V-03 so that one observable carries one threshold and not two"*, and labelled **DESIGN PROPOSAL placeholder (F6C-17 / F6V-03): the five and the 90% are proposals, not measurements, and their owner is the founder**. `02-architecture-selection.md:182` carries the identical threshold with the identical label and owner. Both keep the second disjunct — removal also when no admitted worker in a window names a reason other than permission scope.

**The negative control survives the repair.** Both sites still state that the profile-convergence probe is run deliberately as a pre-declared negative control against this design's own thesis. That is the property F6V-03 said was most at risk from being left unquantified, and quantifying it did not cost it.

**Observation on one citation.** Foundation 6 says its threshold is "the same window and the same 90% the layer-1 removal criterion above already uses", and `05:124` repeats the reference to §8's layer-1 row. The layer-1 row at `02:179` reads *"more than 90% of admitted actions derive to the two lowest classes over a fixed window"*, with "a month of admitted work" appearing in its data-needs clause rather than in the criterion. So the magnitude matches, the boundary differs between "more than 90%" and "90% or more", and the month is inherited from a neighbouring sentence rather than from the criterion. Too small to raise, and recorded because the claim is one of family resemblance rather than identity.

### F6V-04 · class (b) · CLOSED · new finding F6W-06

**Clauses.** Restate in `04` §117, as SPECIFICATION, the two properties F6A-03's disposition depends on — that the customer-material encounter carries an adverse/abandoned/underserved stratum, and that selection within strata uses the recorded seed outside the producing path — **or** have `05` §192 cite §117 rather than the proposal.

**First branch taken.** `04-human-operation.md:117`, inside the SPECIFICATION paragraph that states the inheritance, now carries both properties explicitly. **First:** the original-customer-material encounter carries an adverse/abandoned/underserved stratum, alternating ordinary cases with adverse, abandoned and underserved ones, *"and that stratum exists whatever cycle length or encounter count the schedule is later given."* **Second:** selection within strata uses a recorded reproducible random seed drawn outside the producing path, outside the account producer's write authority, with empty strata and unavailable originals recorded rather than replaced by flattering examples.

**The separation the finding actually needed.** The paragraph states what remains DESIGN PROPOSAL — the dose, meaning the cycle length, the number of encounters per cycle and the minutes — and that a revision of that proposal does not remove the two properties. That is precisely the (b) the finding raised: the disposition leaned on properties stated only in a proposal, and now leans on two SPECIFICATION sentences whose survival does not depend on the dose.

**The defect the repair added.** Its closing clause reads *"and it is what §192 of that chapter cites."* At the subject commit, line 192 of `05` is blank. The refusal-sample paragraph sits at line 211. I traced the shift: at `d8cf96e` the paragraph was at 192; commit `a457be1`, today, inserted the F6A-02 world-change sweep and its probe into §7 above it. The convention is sound elsewhere — `05`'s own pins to `04` §105 and §107 both resolve to the right paragraphs — which is why this one reads as correct and is not. F6W-06.

### F6X-02, chapter half · CLOSED · new findings F6W-07, F6W-08

**Scope.** Per the brief, I judged only whether `05` §5 states a closed `boundary_kind` set and names a contested-refs field. The registration of those strings under `contracts/**` is out of scope and I did not judge it. I read only F6X-02's `issue` and `proposed_repair`; `proposed_repair` is `null`, and the `issue` pointed me to F6B-02's required contract, whose four clauses are: `constraint_set_ref` required on `Continuation` and the operator record carrying the re-entry brief; required rather than optional on `Delegation`; `boundary_kind` as an enum covering the transfers the six fixtures name; and a contested-refs field beside `omission_manifest_ref`. The two clauses at issue here are the third and fourth.

**Closed set — yes.** `05-work-agents-skills.md:146` declares `ConstraintSet.payload.boundary_kind` a closed set of exactly eight members, with the enforcement stated: *"a transfer whose boundary kind is not a member is refused at the boundary, never defaulted, which is what makes the field an assertion rather than a free string."* The table gives each member with the transfer it names and where that transfer is named: `delegation`, `machine_handoff`, `consultation_return`, `continuation`, `acceptance_submission`, `founder_brief`, `custody_transfer`, `stage_import`. I counted eight rows. The distinctions drawn are real and load-bearing — `consultation_return` is separated from `machine_handoff` on the ground that consultation leaves the parent accountable while a handoff moves accountability, which is the same distinction §5's next paragraph keys to consequence class.

**Contested-refs field — yes.** `05:159` names it `contested_refs`, types it `Ref<Record>[]`, makes it **required** on `OperatorProjection.payload`, and assigns it to the same authority that writes the projection. The reason for required rather than optional is stated and is the right one: *"An empty array is the positive statement that nothing was contested and is not the same fact as an absent field."* It carries the second limb of `04` DELTA 1, which F6B-02 established had no field on any operator-facing record.

**Two defects in the same passage.** The sentence handing the list downstream says *"These ten strings are what the contracts lane registers; it registers exactly these and invents none"*, against a table of eight members and one new field name — F6W-07. And the set claims *"one for each transfer the six frozen fixtures and this section name"*, while the table's own provenance column cites fixtures 1, 2, 3, 5 and 6 and never fixture 4 — F6W-08.

## 3. New findings

### F6W-01 · class (b) · R-X07 repairs two consolidation findings and lands in no chapter of the specification

**Governing requirement.** Protocol §5 class (b) — a documented mechanism whose deployment is unverified. Protocol §1's discipline that nothing gets credit for existing.

**Passage.** `registers/decisions.json`, AD-021 `epistemic_basis`, which states honestly: *"R-X07, cited by this record, DID NOT LAND (F6A-11, 2026-09-14): neither the string R-X07, nor `capability_refs`, nor the per-capability-never-grouped rule appears anywhere under the specification directory."*

**Counterexample, computed.** `git grep -c R-X07` over `docs/vision-system/planning/specification/` returns zero files; the same for `capability_refs`. Against that, the selection record's rule table at line 484 defines R-X07 as *"The capability binding is per capability, never grouped, and every standing structure publishes its `capability_refs`. No column rule excludes a row from coverage"*; line 543 records AC-M1-04 as *"inherited → repaired-by R-X07"*; line 561 records AC-M5-01 the same way; and line 1007 rests the whole-company-scope retention on it — *"The capability binding covers all 46 ids individually (R-X07), with no grouped rows and no capability left to a chapter link in place of an operative answer."*

**Resulting failure.** Two consolidation findings are recorded as repaired, and a fixed-boundary retention is recorded as preserved, by a rule an implementer reading the specification will never encounter. The coverage discipline that forbids grouped capability rows is enforceable only if it is written where the binding is specified.

**Why (b) and not (d).** The decision is not missing — it is taken and written down in the selection record, and AD-021 now records its absence from the specification rather than implying its presence. What is unverified is that anything downstream carries it.

**Required contract.** Either land R-X07 in the chapter that specifies the capability binding, with `capability_refs` named on the standing structures that must publish it, or amend the selection record's rows for AC-M1-04 and AC-M5-01 to read "repaired-by a rule not carried into the specification", so that the repair status and the landing status stop being the same string.

**Confidence.** High for the greps and the rule-table rows; the reading that this weakens two recorded repairs is mine.

### F6W-02 · class (a) · The holder-review denominator omits the four holders' alternates, and the omission runs toward a smaller founder load

**Governing requirement.** F6A-12's required contract — "an estimated holder-hours-per-period figure **with its denominator**". Protocol §1: compute rather than trust.

**Passage.** `05-work-agents-skills.md:352`: *"The denominator is 46 roles + 46 alternates + 4 holders = **96 records on one party**: 96 × 10 min = **960 minutes = 16.0 hours per period**, i.e. **4.0 hours per participation cycle**."* The enumeration behind it is at `:350`: *"plus this section's **four** layer-5 holders and, under R-X09, **one alternate per acceptance-owner role**."*

**Counterexample, computed.** `05:340`, four lines above in the same section, defines `StandingHolder` as *"an address, a mandate, **an alternate**, a suspension procedure and a review date — and nothing else."* Each of the four holders therefore carries an alternate record of its own. The enumeration sources alternates only from R-X09, which governs acceptance-owner roles, and so drops four records. Under the chapter's own definitions the denominator is 46 + 46 + 4 + 4 = **100 records**, and the figure at the same placeholder m is **1,000 minutes = 16.67 hours per period = 4.17 hours per participation cycle**.

**Resulting failure.** The one number the finding asked the chapter to produce understates the founder's branch-A load by four records, and understatement is the flattering direction for a section whose subject is whether the founder can carry the design. The package has already recorded one instance of an ambiguity running in the flattering direction, at F6B-06 in this same chapter's header.

**Second clause.** The "four" is stated as a fixed term while `05:337`, the F6A-01 repair two paragraphs earlier, admits new holders on a five-part test and explicitly frees the exercising case from the six frozen fixtures. The four is a floor, not a bound, and the denominator paragraph does not say so.

**Required contract.** Add the four holder alternates to the enumeration and restate the two derived figures; and state that the holder count is the current floor rather than a closed set, given §12's own admission route.

**Confidence.** High. Both inputs are sentences in the same section as the arithmetic.

### F6W-03 · class (a) · Branch B's formula carries no holder term, so both of its stated endpoints contradict it

**Governing requirement.** Protocol §5 (a) — concrete enough to implement and test, which a formula that disagrees with its own limiting cases is not.

**Passage.** `05-work-agents-skills.md:352`: *"The figure is **(2n + h) × m** minutes per period distributed over those parties and **2(46 − n) × m** on the founder, h being the number of layer-5 holders staffed … At **n = 0** branch B is branch A; at **n = 46** the founder's holder-review load is the four holders alone."*

**Counterexample, computed.** At n = 0 the formula gives the founder 2 × 46 × m = 92m = 920 minutes, while branch A gives 96m = 960 minutes on the founder. The two are not equal, and the four holders sit in the other term. At n = 46 the formula gives the founder 2 × 0 × m = 0 minutes, not "the four holders alone"; the holders are again in the `(2n + h) × m` term said to be distributed over the other parties. There is no assignment of h that makes both endpoints hold, because no term in the founder's expression can ever contain a holder.

**Resulting failure.** The paragraph exists to price two branches so the founder can choose between them. A reader who trusts the endpoints gets one answer and a reader who evaluates the formula gets another, which is the same defect class as F6V-01 — two descriptions of one quantity disagreeing — inside the paragraph that answers the founder-attention finding.

**Required contract.** Give the founder's term a holder component, for example `[2(46 − n) + 2(4 − h)] × m`, and restate the two endpoints against the corrected expression; or drop the endpoint sentences and let the formula stand alone.

**Confidence.** High. This is arithmetic on the passage's own symbols.

### F6W-04 · class (a) · REGRESSION · `07`'s header says the planning shares are unchanged; the F6C-05 repair changed them

**Governing requirement.** Protocol §5 (a), and the scope lens — a repair may not leave a statement about itself that its own edit falsifies.

**Passage.** `07-integrations-capacity.md:3`: *"**Contract:** IC1.0.1 — patch, recording the F2 join only; the adapter table, the CP1 pin, the pressure rule and **the planning shares are unchanged**."* Against `07:99`: *"**6% maintenance and 4% evaluation — two separate rows summing to the 10% this pair previously shared**."*

**Counterexample, computed.** At `896a4f0` (2026-09-13) the header carried the clause and the shares read "10% maintenance/evaluation"; the clause was true. At `c5e60d0` (2026-09-14), the commit carrying this repair, the shares became 6% and 4% and line 3 was not touched. The header is false at the subject commit, and it was true before the repair.

**Resulting failure.** A reader who takes the header at its word will not look for a share change, which is exactly the reliance the header invites. The header even enumerates what §6 gains and lists "the evaluation-capacity row" among them, so the two halves of one sentence now disagree about whether that row displaced anything.

**Required contract.** Amend the header clause to name the planning shares as changed by F6C-05, with the split recorded, or drop the shares from the unchanged list.

**Confidence.** High. Both passages are in one file and the commit history is unambiguous.

### F6W-05 · class (a) · `05` §13 row 9 still says the conjunct compares the two launch counts

**Governing requirement.** Protocol §5 (a). This is the defect F6V-01 named, at a third site the contract did not reach.

**Passage.** `05-work-agents-skills.md:393`, §13 row 9: *"the **expected-launch count per procedure version checked at run close** — `WorkflowDefinition.expected_native_launch_count` against `WorkflowRun.actual_native_launch_count`, **compared by a conjunct on the run's `* → accepted` edge** — which is the instrument that notices a changed provider (F6C-04, F6C-14)."*

**Counterexample, computed.** `guard.launch.actual_compared_to_expected` contains `nonempty_fields` over three pointers and `related_phases` on `workflow_ref`. No comparison operator appears in it. `pinned-conjuncts.json` states the refusal and its reason: a stored difference can disagree with the two values it is derived from. `07` §6 and `02` were both corrected today to say the divergence is readable rather than compared; `05` §13 was not.

**Resulting failure.** Three artifacts describe one conjunct; two now say it does not compare and one says it does. An implementer reading the self-audit table — the section whose stated purpose is to walk the (d)-class checklist individually — is told a comparison exists that the registry deliberately omits.

**Required contract.** Replace "compared by a conjunct" in §13 row 9 with the construction `07` §6 now carries: both counts demanded at run close, the divergence readable from the record rather than stored.

**Confidence.** High. The guard body was read directly.

### F6W-06 · class (a) · `04` §117 cites `05` §192, which is a blank line at the subject

**Governing requirement.** Protocol §5 (a); the `evidence` lens on whether a citation resolves.

**Passage.** `04-human-operation.md:117`, closing the F6V-04 restatement: *"That is what keeps `05` §7's `refusal-sample` riding an existing stratum rather than becoming a third delta, and **it is what §192 of that chapter cites**."*

**Counterexample, computed.** Line 192 of `05-work-agents-skills.md` at `ee86480` is empty. The `refusal-sample` paragraph is at line 211. The pin was correct at `d8cf96e` and went stale at `a457be1`, the same day, when the F6A-02 repair inserted the world-change sweep and its probe into §7 above it. The convention itself is sound and resolves elsewhere — `05`'s pins to `04` §105 and §107 both land on the intended paragraphs, which is why this one reads as verified and is not.

**Resulting failure.** The clause is the hinge of F6V-04's disposition: it asserts that the chapter relying on these properties cites them. A reader following it lands on nothing and cannot confirm the reliance.

**Required contract.** Repoint the reference to the paragraph rather than the line — cite `05` §7's `refusal-sample` paragraph by name — so that it survives the next insertion above it. A corrected line number would rot on the next edit, which is the same conclusion this repository reached about pinned line numbers in prose.

**Confidence.** High. The target line is empty at the frozen subject.

### F6W-07 · class (a), low severity · "These ten strings" against eight members and one field name

**Governing requirement.** Protocol §5 (a). The passage's declared purpose is to be the exact list a downstream lane registers, so a count that cannot be resolved defeats it.

**Passage.** `05-work-agents-skills.md:159`: *"**These ten strings are what the contracts lane registers; it registers exactly these and invents none**, which is why the enum is stated in the chapter first."*

**Counterexample, computed.** The table at `:148` has eight rows: `delegation`, `machine_handoff`, `consultation_return`, `continuation`, `acceptance_submission`, `founder_brief`, `custody_transfer`, `stage_import`. `:146` says "a closed set of **exactly eight** members". The new field name is `contested_refs`, giving nine. A tenth is derivable only by also counting `boundary_kind` itself, which is an existing field whose type narrows rather than a new string, and the passage does not say so.

**Resulting failure.** The sentence exists so that a contracts lane can register a list without inventing anything. A lane that counts nine and is told ten must either invent the tenth or ask, and asking is the good outcome rather than the reliable one.

**Required contract.** State the ten explicitly, or correct the count to match the enumeration — eight enum members plus `contested_refs`.

**Confidence.** High for the counts; the reading that a tenth is underivable is mine, and a reader who counts `boundary_kind` reaches ten.

### F6W-08 · class (a), low severity · The closed `boundary_kind` set claims one member per transfer the six fixtures name, and fixture 4 is cited by no row

**Governing requirement.** Protocol §5 (a); R-X27 at `05:144`, *"A constraint set is required on every transfer the fixtures name."*

**Passage.** `05-work-agents-skills.md:146`: *"a **closed set of exactly eight members**, one for each transfer the six frozen fixtures and this section name"*, with a table whose second column names the fixture for each member.

**Counterexample, computed.** Across the eight rows the fixture citations are: fixture 3, fixture 2, §9 adverse case 15, fixtures 3 and 5, fixtures 1, 2 and 6, R-X27, fixture 6, fixture 5. **Fixture 4 appears in no row and nowhere else in §5.** F-4 is the verification fixture, and its adverse arm turns on a transfer — the artifact and its criteria delivered to a checker who must not receive the producer's rationale. Because a transfer whose boundary kind is not a member is *"refused at the boundary, never defaulted"*, an uncovered transfer is a refusal rather than a gap that degrades quietly.

**Resulting failure.** Either F-4 names a transfer with no member, in which case the closed set refuses the fixture the round's own verification dimension rests on, or it names none, in which case the completeness claim is true and undemonstrated for one of the six.

**Required contract.** Name the member covering F-4's delivery to the checker — `delegation` and `acceptance_submission` are the candidates — or state in the paragraph that F-4 introduces no transfer of its own because the checker receives its inputs through the loader rather than through a constraint-set boundary.

**Confidence.** Medium. The counts are exact; whether F-4's checker delivery is a "transfer" in §5's sense is a judgement I could not settle from §5 alone, and I have stated both branches rather than resolving it in the subject's favour.

## 4. Not checked

**Instructed exclusions, honoured in full.** I opened no `.worktrees/` or `.claude/worktrees/` directory, no file under `docs/08-agents_work/`, and not `state.json`, `history.jsonl`, `planning/PLANNING-REPORT.md`, `planning/site/**`, `planning/F2/07-repair-names-contract.md`, `planning/F2/08-repair-names-prose-b.md`, `planning/reviews/F2-06-findings-index.json` or `planning/reviews/F2-06-recheck-01.md`. I read no `.claude/memory/` file. Of `registers/review-findings.json` I extracted exactly two fields of one entry, F6X-02's `issue` and `proposed_repair`, with a script that printed nothing else; no other entry and no other field entered context.

**`state.json` moved under me and I did not look.** `HEAD` advanced from `ee86480` to `3d09545` during the pass. `git diff --name-only` between them reports one path, `state.json`, which is barred. I detected the change through path names only and read no content. Every judgement above is taken from `git show ee86480:<path>`.

**Contracts registration for F6X-02, out of scope by instruction.** I did not judge whether the eight `boundary_kind` members, `contested_refs`, or the F6B-02 clauses on `Continuation`, `Delegation` and the operator record are registered under `contracts/**`. The brief states that work has not landed. My verdict on F6X-02 covers the chapter half only.

**Validators not run, by instruction.** I did not run `validate_contracts.py` or any fixture runner, because the contracts lane's validator was running. Where I needed a contract fact I read the JSON directly and parsed it — `predicate-registry.json` for three guards, `capabilities.json` for the 46/46/41 counts, `decisions.json` for the AD entries, `open-questions.json` for Q-017. This means I verified predicate **content** and not predicate **executability**: I can say `guard.launch.actual_compared_to_expected` contains no comparison operator, and I cannot say the registry as a whole passes its validator.

**The four bounded existence checks, declared.** I opened `planning/F2/05-selection-record.md` four times, each for a cited range only: the R-G02 row at line 459, the R-X07 row at 484, the R-D15 row at 697, and FAL-01 at 1152. My brief does not bar that file, but it is another lane's artifact, so I read the cited lines, settled whether they say what the citing sentence claims, and carried nothing else out. I did not read its dispositions, its §12.1 brief, or any section-by-section instruction to the chapters I was judging.

**F6A-11 and F6C-18 and F6C-19 carry no "Required contract" line.** For those three I derived the clause set from the finding's own body and said so in the detail. A reader who disagrees with my derivation should re-judge those three; the underlying facts I computed are stated so that re-judgement is possible without re-running the work.

**Not judged: whether the new findings change any dimension verdict.** Eight findings are recorded and none is (d)-class, so under protocol §8 none blocks. Whether they move W1, W2, W4, W11, W12 or W13 from sufficient to insufficient is the dimension owners' call and not a recheck's.

## 5. Standing caveat

**No runtime exists.** Every "closed", "repaired" and "verified" above is about **specified behaviour checked offline** against a frozen protocol. Nothing in this pass establishes runtime conformance, deployment readiness, actual fulfilment, or the business value of the intended system. Not one of the mechanisms I confirmed has ever executed. The world-change sweep has never run an occurrence; the fifth F-4 arm has never been executed; the launch-count guard has never evaluated a `WorkflowRun`; no `InstrumentCalibration` exists; and the holder-hours figure is placeholder arithmetic over records none of which has been written.

**Independence, stated in my own words and not laundered.** I share one model family with the authors of all fifteen repairs. What I have is procedural: a separate context, no authorship anywhere in this package, and no write tools with which to have produced any of it. I read no session file, no producer self-assessment, no repair-names contract and no summary any lane wrote about its own work; my evidence was the subject at a frozen commit and the criteria documents. That rules out one failure mode — a reviewer agreeing with a rationale it was shown — and rules out nothing about **correlated error**. If the authors and I share a blind spot, this pass did not find it, and my agreeing with them is weak evidence at best. Protocol §1's bar that a review calling itself independent must say this in its own words is why this paragraph exists, and §5 of `05` names the same limit from the other side: the founder is the only error source in this company uncorrelated with the model family's, and his error rate is the sixth owed measurement.

**Where I computed and where I trusted.** I recomputed every count the repairs state that could be recomputed from the artifacts: 46 capabilities, 46 distinct acceptance roles, 41 with `human`, the eight enum members, the 100 percent of planning shares, the branch-A arithmetic, the matrix cells, the guard bodies, the empty line 192. Four citations I checked by opening the cited range. Three things I could not compute and did not pretend to: whether the contracts registration behind F6X-02 is correct, whether the predicate registry passes its own validator, and whether F-4's checker delivery counts as a transfer under §5. Each is named where it bears.

**What this report is not.** It is one reviewer's pass over fifteen items at one commit. It approves nothing, accepts no layer, and lifts no hold on building.