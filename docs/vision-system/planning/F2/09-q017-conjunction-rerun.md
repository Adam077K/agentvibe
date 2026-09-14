# Q-017 conjunction re-run: the three-part test applied strictly to all 46 acceptance-owner roles

**Lane:** q017-conjunction-rerun · **Engine:** framer · **Subject commit:** `e06fdce` (`git rev-parse --short HEAD` at write time). **Model family:** Anthropic (Claude), the same family as the F2 package's own authoring lane — one family only; this file does not discharge the round's standing multi-family requirement.

**What this answers.** On 2026-09-14 the founder answered [Q-017](../../registers/open-questions.json) with option **(d): reduce the number of roles by re-running the three-part conjunction test more strictly, before deciding who holds what.** This file is that re-run: the test from R-L5 applied, in a table, to every one of the 46 acceptance-owner roles the capability binding names in [`capabilities.json`](../specification/capabilities.json). It is the decision input the re-ask needs, not the re-ask's answer. No file besides this one is written or edited.

---

## 1. The test, stated as three decidable predicates, and what "strictly" adds

The rule is R-L5, [`05-work-agents-skills.md`](../specification/05-work-agents-skills.md) §12, line "**A standing holder exists for a duty class if and only if all three of these hold.**":

> (1) The duty's clock can run while no case is admitted. (2) An outside party has a right to reach the company about it. (3) The duty survives closure of the work that created it. All three, or no holder.

Restated as predicates decidable against this package's own records, in my own words:

- **P1 — STANDING CLOCK.** A concrete obligation in this duty class must be watched, held or acted on even when the company currently has **no admitted case** in that class at all. Recurrence of the *kind* of work is not this — a capability that comes up often but only ever exists inside an open case fails P1. Only a **named** mechanism (a retention timer, an open intake, a held reservation, a rotation) that keeps running with zero open cases counts.
- **P2 — OUTSIDE REACH.** A party who is not company-internal (customer, data subject, regulator, supplier, successor, complainant, the public) has a **standing right to initiate contact**, on their own schedule, specifically about this duty — not merely to receive an artifact this role produced in one transaction. Being the recipient of an outward deliverable is not this.
- **P3 — SURVIVES CLOSURE.** The **specific** obligation this role is accountable for continues to exist and require action **after** the case that created it is marked closed. The topic recurring in a *future* case is not this; the same obligation living on past *this* case's closure is.

**The strict reading adds a fourth, mechanical gate the substantive three do not by themselves supply**, stated two sentences later in the same section: *"A holder exercised by no frozen fixture is unjustified and is refused on sight."* [The F2 acceptance protocol](00-acceptance-protocol.md) §3 freezes exactly **six** fixtures (F-1 through F-6) plus the responsibility probe named in §12's own holder table, and fixture 10 of that protocol's negative controls voids **any fixture authored after a candidate's result is known** — so no new fixture may be invented here to rescue a role I find sympathetic. Per §12's DESIGN PROPOSAL, a role with no exercising fixture is not merely weak evidence — it is **refused on sight** unless it goes through the five-part admission path (conjunction holds, a *paired* conformance case is authored and frozen *before* anyone is staffed, the capability owner admits, C01 endorses, the amendment is recorded) — none of which has happened for any role below.

**"Strictly" therefore means two things at once, and I apply both:** (a) a part is **TRUE only if a named record, fixture or duty that outlives its case demonstrates it** — plausibility reads as FALSE, not "probably true"; (b) even three genuine TRUEs do not admit a *new* standing holder without an exercising fixture or a freshly authored paired case, which this file does not author. Where a role's three parts read TRUE on the text but no fixture exercises it, I mark the verdict **UNDECIDABLE** and route it to the admission path rather than to STANDS — this is the substantive difference the founder's "more strictly" instruction is doing work on.

The six fixtures, for reference ([00-acceptance-protocol.md](00-acceptance-protocol.md) §3): **F-1** an unplanned supplier-triggered data-deletion duty; **F-2** demand at 4× forcing a lane to be shed; **F-3** a task needing three distinct tool permissions; **F-4** a verification the producer must not influence; **F-5** a handoff across a capacity reset; **F-6** the founder absent for a week, with a day-one founder-only decision and a day-five incident. Plus the **responsibility probe** named only in §12's holder table (a non-customer contesting a harmful decision six months after closure, founder absent).

---

## 2. The table — all 46 acceptance-owner roles

Source for role name, concern and floor: `capabilities.json` `acceptance_contract.responsible_role`, `concern`, `declared_floor`, per capability, read directly (INFERENCE column is mine; everything under "deciding sentence" quotes or closely paraphrases the contract).

| CAP | Role | P1 | P2 | P3 | Verdict | Deciding sentence |
|---|---|---|---|---|---|---|
| 01 Intent/commitments | Direction authority | F | F | F | **DISSOLVES** | "Only the identified direction authority endorses purpose" — an internal decision-rights fact, no outside party, no clock without a stated intent to endorse |
| 02 Portfolio direction | Portfolio allocation authority | F | F | F | **DISSOLVES** | Internal resource allocation; review date belongs to the venture record, not this role |
| 03 Opportunity discovery | Discovery custodian | F | F | F | **DISSOLVES** | Internal analysis acceptance; no named outside reach |
| 04 Customer research | Research acceptance owner | F | F | F | **MERGES → CAP-22** | Participants are real people, but their standing right is over *their data*, not over "was the research accepted" — that right already belongs to Rights/data responsibility owner |
| 05 Market research | Market interpretation owner | F | F | F | **DISSOLVES** | Internal interpretation of public/bought sources |
| 06 Strategy | Strategy decision authority | F | F | F | **DISSOLVES** | Internal build/buy/partner/defer decision |
| 07 Product management | Product outcome sponsor | F | F | F | **DISSOLVES** | "No conflicting sold promise is overwritten" points the surviving promise at CAP-15/16/17/30, not at this sponsor |
| 08 Experience/product design | Design acceptance owner | F | F | F | **DISSOLVES** | Internal usability/taste acceptance |
| 09 Brand and identity | Actual identity/taste owner | F | F | F | **DISSOLVES** | Taste and asset-rights administration, not a reachable duty |
| 10 Technical construction | Technical acceptance owner | F | F | F | **DISSOLVES** | Internal artifact acceptance, independent of producer but not of the company |
| 11 Quality assurance | Independent acceptance owner | F | F | F | **DISSOLVES** | Internal evidence judgment |
| 12 Launch and release | Offer outcome sponsor / release authority | F | F | F | **DISSOLVES** | The release decision discharges at launch; ongoing customer duties pass to CAP-16/17/30 |
| 13 Content production | Content acceptance owner | F | F | F | **DISSOLVES** | Internal asset acceptance |
| 14 Marketing/distribution | Campaign outcome sponsor | F | T (opt-out only) | T (opt-out only) | **MERGES → CAP-22** | "opt-out duties" is a real standing, outsider-invokable, closure-surviving duty, but it is a contact-preference/data duty, not the campaign sponsor's own |
| 15 Sales | Sales signatory and delivery sponsor | F | F | F | **DISSOLVES**, residue **→ CAP-30/17** | "unresolved promised delivery prevents complete sales-outcome acceptance" explicitly hands the surviving piece to fulfillment/remedy |
| 16 Customer communication | Relationship owner | F | F* | F | **DISSOLVES** *(dissent below)* | "next update" is assigned per case, not a persisting duty; the standing "customer may always reach us" fact already belongs to CAP-17/42 |
| 17 Support/customer success | Customer-remedy owner | **T** | **T** | **T** | **MERGES → CAP-42's chain** *(dissent below)* | "unresolved disagreement retains its grievance route" — the remedy duty is owed until delivered, invocable by the customer, surviving the originating case, but its escalation IS CAP-42's exercised fixture, not a second one |
| 18 Pricing | Pricing authority | F | F | F | **DISSOLVES** | Internal commercial decision; pricing disputes route through 17/42 |
| 19 Finance/treasury | Treasury authority | F | F | F | **DISSOLVES** | Internal cash-view reconciliation |
| 20 Bookkeeping | Ledger owner / competent reviewer | F | F | F | **DISSOLVES** | Reviewer is an engaged professional (Q-008 family), not an outsider reaching in |
| 21 Legal/regulatory | Authorized recipient / competent issuer | **UNDECIDABLE** (F/T/T) | T | T | **FLAGGED — propose via admission path** | A filing deadline outlives the case and a regulator can reach the company, but no named standing regulatory-calendar clock is specified (Q-008 is on-demand engagement); no fixture exercises it |
| 22 Privacy/data rights | Rights/data responsibility owner | **T** | **T** | **T** | **STANDS** | This *is* the admitted "Personal data and deletion scopes" holder; exercised by **F-1** — "a data-deletion procedure nobody planned... admitted, typed, staffed and completed, with an acceptance owner" |
| 23 Security operations | Security incident responsibility owner | F | F | ~T | **DISSOLVES**, residue **→ CAP-31** *(flagged)* | Notification is outbound, not an inbound standing intake; containment obligations that persist route to the incident holder, not a separate security intake |
| 24 Procurement | Procurement acceptance owner | F | F | F | **DISSOLVES** | Supplier disputes route through contract/legal, not a standing intake |
| 25 Partnerships | Partnership responsibility owner | T | T | T | **FLAGGED — propose via admission path** | "continuing obligations" is textually a real surviving, outsider-invocable duty, but no fixture exercises a named-counterparty relationship — refused on sight per §12's mechanical rule despite passing on substance |
| 26 Hiring | Authorized hiring decision maker | F | F | F | **DISSOLVES** | Candidate data rights are CAP-22's, not this role's |
| 27 Human collaboration | Actual mandate recipient/assigning authority | T | T | T | **FLAGGED — propose via admission path** | An engaged collaborator's standing mandate plausibly reads all three TRUE, but F-3 exercises *tool* permission delegation, not a *human* mandate — no fixture covers this shape |
| 28 Analytics | Metric interpretation owner | F | F | F | **DISSOLVES** | Internal metric acceptance |
| 29 Experimentation | Experiment acceptance owner | F | F | F | **DISSOLVES** | Internal protocol acceptance |
| 30 Operations/fulfillment | Fulfillment outcome sponsor | ~T | T | T | **FLAGGED — propose via admission path** | "partial receipts leave remaining duties open" is a real surviving, customer-invocable duty, but it is unclear whether the clock runs absent *any* admitted fulfillment case — no fixture exercises it |
| 31 Incident response | Incident outcome commander | T (partial) | T (partial) | T (partial) | **STANDS (partial)** | This is "Continuity and on-call"'s day-five arm — exercised by **F-6**: "an incident occurs on day five." The day-one arm (a decision needing only the founder) is **open under MD-03** and is not this role's to resolve |
| 32 Knowledge management | Knowledge steward | F | F | F | **DISSOLVES** | Internal retrieval/currency acceptance |
| 33 Governance | Legitimate governance decision authority | F | F | F | **DISSOLVES** | Internal rule application |
| 34 Organizational learning | Learning decision owner | F | F | F | **DISSOLVES** | Internal hypothesis acceptance |
| 35 Scaling | Growth/admission authority | F | F | F | **DISSOLVES** | Internal capacity-study acceptance |
| 36 Pause | Maintenance custodian | F | F | F | **DISSOLVES** | Per-pause-event acceptance; the maintenance custodian named in §2's escalation ladder is a *different*, already-specified default recipient, not this acceptance role |
| 37 Recovery/resumption | Recovery authority/capable substitute | F | F | F | **DISSOLVES** | This is F-5's technical handoff fixture (context/checkpoint trust), not an outside-reachable duty |
| 38 Pivot | Direction owner/transition sponsor | F | F | F | **DISSOLVES** | Internal direction-change acceptance |
| 39 Closure/wind-down | Closure custodian/competent actors | F | F | ~T | **MERGES → CAP-42 + CAP-22** | R-X08: "Closure cannot complete until the grievance holder's duties are transferred to an accepted custodian" — the surviving residue is explicitly handed to the already-STANDS holders, not retained by this role |
| 40 Institutional formation | Principal signatory/prerequisite assessors | F | F | F | **DISSOLVES** | Q-007/Q-040 family: a one-time admission gate, not a recurring reachable duty |
| 41 Succession/transfer | Actual successor/transferring authority | **T** | **T** | **T** | **FLAGGED — propose via admission path** (strongest candidate) | Q-012: "an appointment and a funding route that survive the founder's absence" is by design a standing arrangement whose mandate outlives any triggering case and exists for customers with continuing duties — but no fixture tests joint founder-and-provider loss; F-6 tests only a one-week absence with routine operations continuing |
| 42 External grievance | Competent grievance recipient | **T** | **T** | **T** | **STANDS** | This *is* the admitted, **unretirable** "Grievance and rights" holder; exercised by **the responsibility probe** — a non-customer contesting a harmful decision, founder absent |
| 43 Owner attention/competence | Owner/domain-competent assessor | F | F | F | **DISSOLVES** | Q-010's ParticipationPlan is the founder's own consented instrument, not an outside party's reach |
| 44 Truthful account | Account acceptance owner | F | F | F | **DISSOLVES** | Internal reproducibility acceptance |
| 45 Compute/infrastructure capacity | Execution capacity steward | F | F | F | **DISSOLVES** | The *acceptance* role is internal; the **reserved lane** holder that F-2 actually exercises is a different, cross-cutting C02 object (§7), not this capability's acceptance owner — see §3 below |
| 46 Controlled system improvement | Independent promotion authority | F | F | F | **DISSOLVES** | Internal protected-change acceptance (08's own C5 gate already governs it) |

**Dissent preserved, as instructed:**
- **CAP-16 (Relationship owner).** A second reading holds P2 TRUE on the general fact that "a customer can always reach the company," making this role a MERGE candidate into CAP-17 rather than a clean DISSOLVE. I do not adopt it, because that general reachability fact is already carried by CAP-17's and CAP-42's named intakes; "Relationship owner" adds nothing CAP-17 does not already supply, and duplicating the reach with no distinct mechanism is the decorative-declaration failure §3 of `05-work-agents-skills.md` refuses elsewhere in this same chapter.
- **CAP-17 (Customer-remedy owner).** A second reading treats CAP-17 as its *own* STANDS — it is the only role besides 22/42/31 where all three predicates read cleanly TRUE off the contract text, and the fact that it feeds CAP-42 on dispute is not, by itself, proof the pre-dispute duty is the *same* duty. I record both readings and do not force one: whether an *ordinary, undisputed* remedy owed is its own duty class or the first phase of the grievance holder's is the one place in this table where the text genuinely underdetermines the answer, and it is worth a founder decision, not an inference.

---

## 3. The reduced list of distinct standing roles that survive

Three roles pass strictly, one of them partially, plus one pre-existing holder that sits **outside** the 46 entirely:

| Standing role | Duty that outlives the case | Exercising fixture | Outsider reaches it by name? |
|---|---|---|---|
| **Personal data and deletion scopes** (= CAP-22, Rights/data responsibility owner) | The retention/deletion clock keeps running after the case that created the data closes | **F-1** | No — reachable by *right* (a data-subject or regulator request), not by needing to know a person's name; the intake need only be discoverable |
| **Grievance and rights** (= CAP-42, Competent grievance recipient) — **unretirable per §12** | Continuing contestation/escalation rights; closure cannot complete until this holder's duties are transferred to an accepted custodian (R-X08) | **The responsibility probe** | **Yes, explicitly** — §12: "a party an outsider can reach by name, without knowing the company's internal topology." This is the one role CAP-42's whole purpose is built around |
| **Continuity and on-call** (≈ CAP-31, Incident outcome commander) — **partial** | Readiness for an incident occurring at an arbitrary time, independent of any admitted case | **F-6, day-five arm only** | Yes for an incident with an external party affected (via CAP-17/42's channels); the day-one founder-only-decision arm has no outsider-reach question at all and is separately open under **MD-03** |
| *(outside the 46)* **A reserved lane** | A protected capacity share that must not be silently consumed by demand spikes | **F-2**, but only exercised **at 4× demand, not executable at the current concurrency pin — recorded as owed, not passed** | No — this is an internal capacity-protection object under C02 (§7), not a party-facing role, and it does not correspond to any single capability's acceptance owner |

**Six roles are flagged, not admitted:** CAP-21 (legal/regulatory), CAP-25 (partnerships), CAP-27 (human collaboration/mandate), CAP-30 (fulfillment), CAP-41 (succession — the strongest of the six), CAP-23 (security, residue only). Each reads plausible-to-strong on the substantive three parts but **none is exercised by any of the six frozen fixtures**, so each is mechanically refused on sight under §12's own rule pending a **paired conformance case authored and frozen before anyone is staffed** — the same discipline that admitted the three that already pass. This file does not author those cases; it names which six are worth the founder spending that authoring effort on, in the order the evidence supports (CAP-41 and CAP-25 read strongest; CAP-23 is the weakest, being mostly residue of CAP-31).

**Five roles merge** rather than stand or dissolve cleanly: CAP-04 and CAP-14 (residues into CAP-22), CAP-39 (residue into CAP-42 + CAP-22, per R-X08's explicit transfer requirement), CAP-15/CAP-07 style residues generally point at CAP-17/CAP-30/CAP-16 without needing separate treatment, and CAP-17 itself sits in the disputed middle described above.

**Thirty-two roles dissolve** into the ordinary per-case `AcceptanceInterval` / C06 acceptance mechanism ([`05-work-agents-skills.md`](../specification/05-work-agents-skills.md) §5) with no standing infrastructure: CAP-01, 02, 03, 05, 06, 07, 08, 09, 10, 11, 12, 13, 15, 18, 19, 20, 24, 26, 28, 29, 32, 33, 34, 35, 36, 37, 38, 40, 43, 44, 45, 46.

---

## 4. What changed the count, and the honest consequence

**SPECIFICATION.** R-X09 currently states: *"Every acceptance-owner role is a record. Each carries a reachability route, a capacity reservation, an alternate and a review date; admission in that duty class stops while it is unfilled."* That sentence was written for **all 46** acceptance-owner roles without distinguishing which ones actually meet R-L5's own conjunction — which is exactly the gap Q-017's evidence names: *"The staffing-precondition mechanism exists in one candidate and was not applied to that candidate's own acceptance table."*

**INFERENCE, from this re-run.** Of the **41 of 46 capabilities that carry `human` among their production modes** (figure sourced from `05-work-agents-skills.md` §12's own F6A-12 paragraph, not recomputed here), **at most 4 remain legitimately gated** by R-D09's admission-stops-while-unfilled rule after this re-run: CAP-22, CAP-42, CAP-31 (partial — only its day-five arm), and CAP-17 if the founder resolves its dissent toward an independent STANDS rather than a merge. The other **37 to 38** keep needing a **human at acceptance time** — that requirement is untouched, because R-L5 governs standing *infrastructure*, not whether a person must sign off — but **admission of new work in those classes no longer legally waits on a pre-staffed, reachable, reserved, alternated, review-dated office existing in advance.** It waits only on a competent person being available *when a case is actually open*, which is a narrower, later-binding, and far cheaper constraint.

**UNKNOWN, carried forward rather than guessed.** This file does not resolve which real person (or the founder as exception) staffs the 3-to-4 confirmed roles, nor whether the six flagged roles are worth authoring a conformance case for before real venture work needs them — those are Q-017's original (a)/(b)/(c)/(d) choices, now asked over a list nine-tenths shorter.

**Consequence for a one-person company, stated plainly.** This re-run does **not** touch the founder's acceptance *workload* — the per-case sampling and unsampleable-release rules of §2 (F6B-05) are a separate mechanism and are unaffected; a human still looks at the outcome of most of these 46 capability classes when a case closes. What it changes is **how much must be pre-built before the company may take on work at all**: instead of 46 standing offices each needing an alternate and a review date, the design's own R-D09 narrowing rule now has a real, small, named surface — 3 confirmed plus up to 6 candidates pending a conformance case — rather than a blanket claim covering nearly every capability the company has. In the design's own arithmetic (F6A-12), the denominator that produced "46 roles + 46 alternates + 4 holders = 96 records" shrinks, for the *standing-infrastructure* half of that count, to roughly **4 roles + up to 4 alternates + the 4 pre-existing layer-5 holders ≈ 12**, before the founder decides who staffs even those.

---

## 5. Re-ask

**Question:** Of the 4 roles this re-run finds legitimately standing (Personal data/deletion, Grievance/rights, Continuity/on-call's day-five arm, and — pending your resolution of the CAP-17 dissent — Customer-remedy), and the 6 it finds plausible but not yet fixture-exercised (legal/regulatory, partnerships, human-collaboration mandate, fulfillment, succession, security-residue): who staffs the confirmed roles, and what should happen to the flagged six before any work in their classes is admitted?

**Options, each with its consequence:**

1. **Staff the confirmed roles now; authorize a paired conformance case for the flagged six before staffing any of them.** Consequence: keeps §12's admission-path discipline intact — no role is staffed ahead of the evidence that justifies it — but adds authoring work (six new frozen fixtures, each with its adverse twin) before those classes may safely start.
2. **Declare the founder the holder of record for the confirmed roles too** (consistent with Q-016's own (d) answer), and leave the flagged six unadmitted until real venture work forces one of them. Consequence: cheapest now; concentrates grievance-independence and data-rights custody in the same person the grievance route may need to be independent *of* — the specific risk Q-003/Q-004 already named.
3. **Reopen this re-run's DISSOLVES verdicts as too permissive** and restore standing infrastructure for a larger set (e.g., keep CAP-25, CAP-21, CAP-39, CAP-41 as STANDS despite no exercising fixture). Consequence: safer against an unmeasured false-exclusion, at the direct cost of repeating the undisciplined-application defect this whole re-run exists to fix.

**Recommendation, by the evidence rather than by preference: option 1 for the flagged six, option 2's staffing question left genuinely open for the 4 confirmed.** The evidence supports authoring conformance cases before admitting new standing roles, because §12 states that requirement as a mechanical gate, not a suggestion, and CAP-41 (succession) and CAP-25 (partnerships) both read as genuine three-part passes being held back by nothing but the missing fixture — the cheapest and most evidence-faithful next step is to write those two fixtures first, not to either force them in or leave them out by default.
