# F2 Step 5a-i — attack consolidation

**What this is.** One disposition table over the five Step 4 attack reviews of the five candidates M1–M5.
Every row is a transcription or a grouping of something a review states. **Nothing here selects, ranks,
recommends, or resolves a disagreement between two reviews.** Where the reviews disagree, both positions are
recorded with the discriminating test each names.

**Sources, and the only ones read.** `planning/F2/00-acceptance-protocol.md` (frozen `26af5d5`) and
`00-acceptance-protocol-amendments.md` (AM-01); `planning/F2/reviews/findings-index.json`; and the five
reviews in full — `A-technical.md` (AT), `A-company-human.md` (AC), `A-economic-capacity.md` (AE),
`A-context-evidence.md` (AX), `A-security-adversarial.md` (AS). **No candidate file under
`planning/F2/candidates/` was read**, per brief; every statement about a candidate below is the review's
statement, not a re-verification. `state.json`, `history.jsonl` and `docs/08-agents_work/` were not read.

**Claim kinds (DIRECTIVE §6).**

- Sections **A** and **B** are **DIRECT OBSERVATION** of the named review: the judgment, class, passage,
  contract and issue are the review's own, condensed.
- The `mechanism_targeted` column is **INFERENCE** by this agent from the review's cited passage — it names
  the mechanism in the candidate the finding lands on, so that a synthesis keeping that mechanism inherits
  the finding.
- Sections **C**, **E**, **F**, **G** are **INFERENCE**: the grouping and merging are this agent's; every
  member is DIRECT OBSERVATION and cited by finding id.
- Section **D** is DIRECT OBSERVATION where a review states a control result, and **UNKNOWN** where no
  review applied a control to a candidate — an unapplied control is recorded as unapplied, never as passed.
- Section **H** counts are **DIRECT OBSERVATION** (computed from the finding table), and the merge count in
  C is INFERENCE.

**Index reconciliation.** `findings-index.json` carries **111** ids. All 111 are real findings in the five
reports. **None added, none removed.** Two index defects recorded in B: `AC-M2-01` carries `class: null`
because the report gives it no (a)/(b)/(c)/(d) class — it is a **negative-control failure**, which protocol
§8 makes blocking on its own footing; and `AS-M5-01`'s extracted heading is the wrong line (the reviewer's
blocking-summary sentence, not the finding heading), while its class `(d)` is correct.

**Standing caveat, per protocol §8.** No runtime exists. Every judgment consolidated here is about
**specified behaviour checked offline** by reviewers of one model family with procedural independence only.
Four of the five reviews add, in their own words, that their agreement with each other is not corroboration.
Nothing here establishes runtime conformance, deployment readiness, or business value.

---

## A. Verdict matrix — M1…M5 × W1…W15

**Legend.** `S` sufficient · `S-r` sufficient with reservations or residuals · `I` insufficient ·
`I-n` insufficient, narrowly. The reviewing lane is in the column header; **every dimension was judged by
exactly one review**.

| | W1 *AC* | W2 *AT* | W3 *AX* | W4 *AE* | W5 *AX* | W6 *AS* | W7 *AT* | W8 *AT* | W9 *AT* | W10 *AS* | W11 *AC* | W12 *AC* | W13 *AE* | W14 *AX* | W15 *AC* |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **M1** | **I** | S | S | S | S | **I** | S | S-r | S | **I** | S | **I** | S | S | S |
| **M2** | **I** | S | S | **I** | S | **I** | S¹ | S | S | **I** | S | S | S | S | S |
| **M3** | S | **I** | S | S | S | S-r | S² | **I** | S | **I-n** | S | **I** | S | S | S |
| **M4** | **I** | **I** | S | **I** | S | **I** | S | S-r | S | **I** | S | **I** | S | S | S |
| **M5** | **I** | **I** | S | S | S | **I** | S | **I** | S | **I** | S | S | S | S | S |

¹ AT: "sufficient (inherited, and it says so)". ² AT: "sufficient (strongest in the round)".

**Insufficient counts, by candidate:** M1 4 · M2 3 · M3 4 · M4 6 · M5 5.
**Insufficient counts, by dimension:** W10 5 · W6 4 · W1 4 · W12 4 · W2 3 · W4 2 · W8 2 · W3/W5/W7/W9/W11/W13/W14/W15 0.

### W-gaps

**No dimension went unjudged. Every dimension was judged exactly once, and that is the gap.**

| Observation | Kind |
|---|---|
| All fifteen dimensions carry a judgment for all five candidates — 75 of 75 cells filled | DIRECT OBSERVATION |
| **No dimension received a second, independent judgment.** Each of W1…W15 rests on one reviewer of one model family | DIRECT OBSERVATION |
| Coverage is disjoint by design: AC took W1/W11/W12/W15, AT W2/W7/W8/W9, AX W3/W5/W14, AE W4/W13, AS W6/W10 | DIRECT OBSERVATION |
| Two probes were run that map to no W row and are recorded by their reviews as cross-cutting: AC's **responsibility probe** (non-customer contests a harmful decision, custodian implicated, founder absent) and AT's **internal consistency** check against `contracts/record-registry.json` | DIRECT OBSERVATION |
| Cross-dimension leakage is flagged by the reviews themselves and is not resolved: AT-M4-02 is raised "with W2 exposure" and its severity is contested; AS-M2-03/AS-M4-04 note the metered path is "another reviewer's dimension" (W4); AS-X-01 lands on the checker's inputs, which is W5, while AX returns W5 **sufficient for all five and no (d)** | DIRECT OBSERVATION |
| **The synthesis must answer, and no review does:** whether a (d) raised by the lane that does *not* own the affected dimension changes that dimension's verdict — specifically AS-X-01 against AX's five W5 sufficients | INFERENCE |

---

## B. Finding table — all 111

Columns: **id · review · candidate(s) · dimension(s) · class (as the report states it) · issue · required
contract · mechanism_targeted.** `X` = cross-candidate, `ALL` = all five, `ROUND` = against the round's own
instrument. Class is the **report's**; where the index disagrees, the report wins and the correction is
noted in the class cell.

### B.1 — A-technical (AT) · W2, W7, W8, W9 · 22 findings

| id | cand | dim | class | issue | required contract | mechanism_targeted |
|---|---|---|---|---|---|---|
| AT-M1-01 | M1 | W2, W8 | **d** | `HandoffAcceptance` is declared NEW and already exists in the registry, owned by S1-C07, with a different state set and a human-only command | A distinct record name, or an explicit registry amendment naming owner, state set and admissible command families | M1 `HandoffAcceptance` record — the handoff/continuation discipline F-5 rests on |
| AT-M1-02 | M1 | W7 | **d** | The set of "critical fields" a resumed attempt must re-derive is never defined and has no author | A named authority that marks a field critical, recorded on the `WorkOrder` or the `FieldAuthority`, not decided at resume time | M1 §4.5 resume rule ("re-derive every critical field by direct probe") |
| AT-M1-03 | M1 | W7 | **d** | The checkpoint trigger is unspecified and M1's own capacity finding says the denominator it would need does not exist | A named observable close-out predicate, or an explicit statement that the system checkpoints every step boundary and carries the cost | M1 `Continuation` prepared under a "reserved closing allowance" |
| AT-M1-04 | M1 | W2, W8 | a | The release locus for F-3's outward effect is stated two ways — a third executor holding the send scope, and "C04 alone releases" | One sentence making an executor's scope a proposal right with C04 performing every release, or the converse | M1 executor grant scope vs C04 release authority |
| AT-M1-05 | M1 | W9 | b | W9's in-flight provider/model change is answered by inheritance from `05` §3; the reviewer verified the rule and **withdrew its own drafted finding** | None — recorded as agreement, not as a defect | M1 §11 item 9 inheritance of `05` §3 migration rule |
| AT-M2-01 | M2 | W2/W11 | a | §8's narrowing claim is false for 6 of its 15 rows; four of the six read "all five", the opposite of a narrowing | Write the narrowing into the six cells or restate the claim as "9 of 15"; the 26/5/15 counts themselves recompute correctly | M2 §8 chartered-capability table and the sentence W11 leans on |
| AT-M2-02 | M2 | W2 | **c, not (d)** | Charter persistence is adopted against a spec clause requiring demonstrated benefit; M2 supplies the demonstration protocol rather than the demonstration | None blocking — §9.1's fresh-holder arm meets §5's (c) in full and is "the best-specified removal test in the round" | M2 `Charter` persistence + §9.1 fresh-holder arm |
| AT-M2-03 | M2 | W2, W8 | **d** | Suspension's "admissions narrow" has no quantum and no computing party, and fires under F-6 when nobody can decide it | A named narrowing predicate and its owner, in the same table row as the suspension trigger | M2 §6.6 charter-lifecycle suspension row |
| AT-M2-04 | M2 | W8 | a | The two-desk tie-break is undefined for incomparable predicates (`CT-DUTY` vs `CT-STANDING` on one supplier deletion duty) | A terminal ordering, as `03`'s custody resolver already supplies for ownership | M2 `duty_scope` predicate-specificity tie-break |
| AT-M3-01 | M3 | W2, W9 | **d** | Deleting `AgentTemplate` and `AgentInstance` leaves 52 and 50 dangling registry references with no migration | A reference-migration table, or retention as tombstones with refs preserved | M3 §9.1 deletion list — `AgentTemplate` / `AgentInstance` removal |
| AT-M3-02 | M3 | W2, W8 | a | Four of eleven primitives are existing registry records renamed (`WorkOrder`, `WorkflowDefinition`, `StepExecution`, `DomainEvent`), with no mapping; a **partial false closure on negative control §4.1** | A four-row alias table, or adopt the registry names | M3 §2 primitive table (`WorkRecord`/`Procedure`/`Step`/`Journal`) |
| AT-M3-03 | M3 | W2, W7 | **d** | No authority can stop a pre-endorsed shed in the moment; the stated mitigation is same-day notification, which lands in an empty inbox under F-6 | A named party who may halt or reverse a shed inside the window with its own reserved capacity, or an explicit statement that shedding is irreversible within the period | M3 pre-endorsed capacity policy executed by the scheduler |
| AT-M3-04 | M3 | W8 | a | The adaptive step's declared envelope has no named author and no default, including for `unclassified-work/v1` | Envelope authorship assigned to the capability owner at procedure admission, and `unclassified-work/v1`'s envelope written out | M3 §3 adaptive step envelope (step kinds, read sets, effect classes, budget) |
| AT-M3-05 | M3 | W9 | a | The collapse rule's `N` is unnamed and unowned; §11 names the retirement window, a different number | Name `N` and its owner | M3 §6.5 procedure-collapse rule |
| AT-M4-01 | M4 | W2, W8 | **d** | Whether an outward artifact "carries a promise" is not computable from any of the four permitted derivation inputs, and the whole outward-communication column depends on it | Either floor CAP-13/14/15/16 at C3, or a named non-model step that recognises an obligation in a draft and writes the `Obligation` the join needs | M4 §2.2 `ConsequenceDerivation` inputs + §7.3 outward-send class |
| AT-M4-02 | M4 | W2 (**exposure**) | **d, severity contested** | `max(contributing_dimensions ∪ {floor})` converts six routing classes from predicates into a total rank, which `02-authority-recovery.md` §4 forbids by name; the C2→C3 pair drops C2's "H where a relationship is touched" gate | Keep the derivation as a **set** of reached classes and apply every reached row's gates, or prove the table monotone and state the proof | M4 `max()` class derivation over `contributing_dimensions` |
| AT-M4-03 | M4 | W8 | a | `H` appears as a preparing structure while §2.3 says H's performer is an E; inheritance of H's reservation ref and intake address is undefined | One sentence: "H prepares" means an E instantiated under H's mandate carrying H's reservation ref and address and nothing else of H's | M4 §4.1 May-PREPARE columns vs §2.3 `StandingHolder` performer binding |
| AT-M4-04 | M4 | W2, W8 | a | No terminal holder for a C3 duty class mapping to none of the nine; the resolver's fallback is a rule, which §7.1 forbids | A terminal standing holder for out-of-set C3 duties | M4 §7.1 terminal-element rule + the nine-holder set |
| AT-M5-01 | M5 | W2 | **d** | M5 adds a second writer (`constraint-discrimination`, a machine activation) to the existing `Constraint` record the kernel reserves to C01, under a preamble saying it reopens no fixed boundary | State that the interest may write only a `proposed` revision and that `proposed → endorsed` stays C01's | M5 §2.1 entry-kind writer table — `Constraint` row |
| AT-M5-02 | M5 | W2, W8 | a | Six of eleven entry kinds are existing registry records renamed, with no mapping table | An alias table | M5 §2.1 entry-kind table |
| AT-M5-03 | M5 | W2, W8 | **d** | The only named detector for M5's acknowledged semantic-conflict gap is a merge interest, which M5's own hard rule ("no precondition may invoke a model") forbids | Name the typed proxy the merge interest actually arms on, or withdraw it and record the gap as undetected | M5 §3.3 rule 4 merge interest vs §2.2 deterministic-precondition rule |
| AT-M5-04 | M5 | W2, W8 | a | No rule for custody landing on the Admission Authority's own identity; the prohibition and the `unowned-duty` resolver contradict and nothing says which yields | State which yields | M5 §3.2 prohibition table + `unowned-duty` ordered resolver |

### B.2 — A-company-human (AC) · W1, W11, W12, W15 + responsibility · 26 findings

| id | cand | dim | class | issue | required contract | mechanism_targeted |
|---|---|---|---|---|---|---|
| AC-ALL-01 | **ALL** | W12 | b | The fixed founder-competence mechanism in `04-human-operation.md` is cited by no candidate; each re-derives a return from the research lanes instead, so two accounts of one mechanism exist | Each candidate names `04`'s `ParticipationPlan`/`ParticipationEncounter` as the mechanism it inherits and states only its deltas; any delta is a decision packet | Every candidate's §6.3 designed founder return |
| AC-M1-01 | M1 | W1, W12 | **d** | A novel job needing a new capability cannot be staffed while the founder is absent; the two colliding rules are both M1's | A named standing approver for capability creation with a consequence ceiling and an expiry, plus the maximum tolerable delay when even that is unavailable | M1 `CapabilityProposal` approval + §7 F-6 parking rule |
| AC-M1-02 | M1 | W1, responsibility | **d** | The terminal owner of otherwise-unowned harm is "the founder's standing delegate", a term appearing once in M1 and nowhere in the specification or coverage | Define the standing delegate as a record with an acceptance act, scope, consequence ceiling and alternate, or delete the fourth tier and make the maintenance/discovery custodian terminal | M1 §3.2.4 ordered ownership resolver, fourth tier |
| AC-M1-03 | M1 | W12 | **d** | Acceptance above C2 is bound to the founder's *availability*, not his *participation*; the two readings build different companies | State the acceptance rule as a property of the evidence and drop presence from it entirely | M1 §7 F-6.8 absence acceptance rule |
| AC-M1-04 | M1 | W15 | b | Grouped binding hides four genuinely different acceptance owners in one row (CAP-21/22/40/41 → "qualified professional") | Split the row; name an internal standing acceptance owner for CAP-22 and CAP-41 with the professional as a consulted determination | M1 §8 grouped capability table (46 ids over 18 rows) |
| AC-M1-05 | M1 | W15, responsibility | b | The grievance custodian is standing but unfunded; `03` calls an authorisation without reserved funding an unowned promise | Closure inventories a funded remedy reserve alongside the custodian, or records `closed_with_residuals` with the funding gap as a surviving duty | M1 §8 CAP-42 custodian named in the closure record |
| AC-M1-06 | M1 | W11 | a **(strength)** | The profile-convergence probe is a pre-declared negative control against M1's own thesis, with the remedy named in advance | None — recorded as a strength | M1 §6.5 profile-convergence probe |
| AC-M2-01 | M2 | W11 | **negative control §4.4 FAILED · blocks · no (a)–(d) class** *(index records `null`; correct — the report assigns no letter class)* | `CT-MEANING` is a chartered desk exercised by no fixture, and §2.5's three-part test is asserted for five duties without being applied to any individually | Exercise `CT-MEANING` in a frozen fixture and name the outside party who must reach it by name, or drop it and bind CAP-32/34 to ephemeral production under C05 and C03 | M2 `CT-MEANING` charter + §2.5 three-part charter test |
| AC-M2-02 | M2 | W1 | b | No acceptance owner is named for an admitted duty matching no charter predicate; the inherited `03` resolver is never cited (M2 cites `03` zero times) | One sentence naming `03`'s ordered resolver as the fallback, with the resolver's output — not a desk — as the acceptance owner | M2 `duty_scope` predicate matching / charter-keyed acceptance |
| AC-M2-03 | M2 | responsibility, W1 | **d** | A grievance about `CT-STANDING`'s own disposition has no named independent recipient; M2 names one fixed desk, so the implicated custodian has no second route | A `disputed_holder` predicate on grievance intake and a required `independent_escalation` field on every charter carrying external standing, with the two assignments guarded to differ | M2 `CT-STANDING` charter + §6.6 suspension triggers |
| AC-M2-04 | M2 | W12 | b | The designed return covers one of the fixed mechanism's four encounter kinds; the three dropped are the customer, taste and adverse-financial encounters | Adopt `04`'s four encounters and state only the delta, or reopen with a decision packet | M2 §6.3 monthly single-duty return |
| AC-M2-05 | M2 | W12 | b | Absence-only acceptance rules are bound to the founder's availability rather than to the evidence; same shape as AC-M1-03 | State the rule as a property of the evidence and delete the absence condition, or name the act of participation his presence supplies | M2 §7 F-6 absence-only acceptance classes |
| AC-M2-06 | M2 | W13, W11 | a **(strength)** | Two blocking (d)s declared against itself, plus an offer to withdraw the candidate if the founder's five criteria are a closed list | None — recorded as a strength | M2 §11 self-audit + admissibility note |
| AC-M3-01 | M3 | W1 | **d** | The grant backing an effect step on unclassified work is undefined, and the two readings destroy different invariants — an omnibus standing grant, or a system edit per novel effect | A named `unclassified-effect` grant class with a consequence ceiling, per-authorisation expiry, value ceiling and human authoriser per effect; or the explicit statement that novel effect classes need a grant-policy change with an owner and a turnaround, narrowing F-1's zero-edit claim | M3 `unclassified-work/v1` + §6.2 grant-policy admission rule |
| AC-M3-02 | M3 | W12 | **d** | The founder-attention load is the design's central cost and is counted nowhere: 19 of 46 name the founder, 13 more an unspecified human, and every outward artifact needs a human acceptance | A staffing precondition per standing role, enforced with M3's own "admission in that class stops" rule; and name which of the eight custodian roles are staffed by a non-founder before work is admitted in that class | M3 §8 acceptance-owner column + §6.1 "no model step is an acceptance step" for irreversible/outward classes |
| AC-M3-03 | M3 | responsibility | b | The grievance route has no disputed-custodian predicate; `03`'s guard with absent-denies semantics is not carried across | Apply §6.1's committed-configuration routing rule to CAP-42 explicitly, with `03`'s absent-field-denies semantics | M3 CAP-42 grievance route + §6.1 router rule |
| AC-M3-04 | M3 | method | a **(strength)** | §11 is the only self-audit walking all ten negative controls individually, and the only one preserving a disagreement with its own classification | None — recorded as a strength | M3 §11 self-audit |
| AC-M4-01 | M4 | W12 | **d** | A person is the acceptor on 37 of 46 capabilities and on every action in the 26 that floor at C3+, and M4 does not say who that person is or what happens when there is only one | A staffing precondition per holder with a stated behaviour when unfilled, plus either a C3 sampling rule equivalent to §6.3's C2 rule or an explicit statement that C3 acceptance is unsampleable with the resulting per-week count | M4 §8 acceptor column + §4.1 C3 "Must ACCEPT: P" + "the floor is a minimum" |
| AC-M4-02 | M4 | W12, responsibility | **d** | H9 is the founder, every holder must carry an alternate, and H9's alternate is unnamed and in a one-person company unfillable | Name the alternate as a role with its own admission and funding, or mark H9 a declared exception with the parking behaviour stated as the consequence | M4 `StandingHolder.alternate_holder_ref` applied to H9 |
| AC-M4-03 | M4 | W12, W15 | **d** | CAP-43's holder, subject and acceptor are the same party, which M4's own §2.3 prohibition ("may never decide the matter it is the subject of") forbids | Name a competent assessor outside H9 for CAP-43 with the owner's contestation right, as `04` specifies | M4 §8 CAP-43 row + §2.3 holder prohibition |
| AC-M4-04 | M4 | W12 | b | The competence instrument fires only after an absence rather than on a schedule | Schedule it on `04`'s fixed cycle | M4 §7.6 re-entry brief vs §6.3 ordinary-operation return |
| AC-M4-05 | M4 | responsibility | a **(strength)** | The closure interlock — CAP-39 cannot complete until H3's duties are transferred to an accepted custodian — is the strongest standing-accountability mechanism in the round | None — recorded as a strength, and AC says it composes with M5's unretirable grievance interest | M4 §8 closure interlock on CAP-39 |
| AC-M5-01 | M5 | W11, W15 | b | §8's table excludes the standing interests by its own column rule, applies the rule inconsistently in 11 rows, and the single worked example for M5's negative-control-8 answer is contradicted by the table it points at; 22 standing interests have their capability coverage stated nowhere | Publish the `capability_refs` of the 22 standing interests, or add a second column | M5 §8 "Interest(s) beyond the standing set" column + §2.2 mandatory `capability_refs` |
| AC-M5-02 | M5 | W15, responsibility | **d** | Twelve acceptance-owner roles are named with no record that makes any of them exist; §11 declares only the terminal one open | Generalise §11's own rule: every acceptance-owner role named in §8 is a record with a reachability route, a capacity reservation and an alternate, and admission in that class stops while it is unfilled | M5 §8 acceptance-owner column (outcome sponsor, relationship owner, privacy custodian, …) |
| AC-M5-03 | M5 | responsibility | b | The grievance route states the implicated-custodian case and supplies no mechanism; `grievance` is a single ∞ interest, so there is no second route by construction | A `disputed_custodian` precondition field and a second `grievance-independent` interest whose precondition is that field, with absent-denies semantics | M5 `grievance` standing interest |
| AC-M5-04 | M5 | W15 | a **(strength)** | §11's first open (d) names, declares and routes the same gap M1 carries silently as AC-M1-02 | None — recorded as a strength | M5 §11 declared open (d) — the terminal standing custodian |

### B.3 — A-economic-capacity (AE) · W4, W13 · 24 findings

Probe codes: E1 units/denominators · E2 mid-week exhaustion · E3 metered fallback · E4 runaway
cost and retry · E5 F-2 honesty · E6 comparator honesty · E7 operational complexity and removal criteria.

| id | cand | dim | class | issue | required contract | mechanism_targeted |
|---|---|---|---|---|---|---|
| AE-M1-01 | M1 | W4 (E1) | b | A cost figure in a forbidden unit ("up to ten times the cost") carried into a capacity argument without its TC-26 non-conformance label; cited in B0's favour, so a unit error not a flattery error | Label any external cost multiple with its unit and non-conformance, re-express in `07` §6 units, or drop it | M1 §9.2 B0 comparison citation |
| AE-M1-02 | M1 | W4 (E2) | b | The shed ladder answers pressure and not exhaustion: 50% of an empty bucket is zero and nothing says what performs a due refund | The F-2 answer names the exhaustion case distinctly: the non-model production mode that performs it, who is alerted, and the record the breach-or-perform decision leaves | M1 §7 F-2 shed ladder + protected due-service minimum |
| AE-M1-03 | M1 | W4 (E3) | b | The metered-path observation point is named; cadence, owner and response are not, and the cache-lifetime collapse is unpriced | A refresh cadence bound to `07` §6, a named reader, and a launch quarantine as the response | M1 §10 / §11 O-1 account-setting read |
| AE-M1-04 | M1 | W4 (E4) | b | No attempt ceiling behind the non-terminating validator; CP-99 measures the loop and does not stop it | An attempt ceiling per work order with a named owner and stated behaviour at the ceiling, plus the same for an executor's internal retry | M1 §4.2 `WorkOrder` budget/stop rule + §4.3 meaningful progress |
| AE-M1-05 | M1 | W13 (E7) | c | "Every mechanism carries a removal criterion" is asserted more broadly than the text supports — 7 of 17 standing mechanisms have none | A removal criterion per new record, in the table that introduces it, in §9.2's falsifier form | M1 §6.5 removal-criterion rule + `ExistenceJustification.removal_criterion` |
| AE-M2-01 | M2 | W4 (E2/E1) | **d** | The size of each reserved lane and its lapse point is undecided, and it decides what the company sheds; **recorded as confirmed rather than discovered** — it is M2's own (d-M2-2) | Per-lane share, stated minimum and lapse point, decided by the founder, expressed as shares of the observed allowance because no absolute denominator exists | M2 `reserved_lane` field + `ShedNegotiation` |
| AE-M2-02 | M2 | W4 (E1) | b | "Zero per work order" is contradicted by M2's own decision probe, which runs inside the work order before every consequential action | The F-2 row reads one decision probe per consequential action under a chartered duty, in `07` §6 units, charged to the arm that requires it | M2 §5.3 decision probe + §7 F-2 coordination-cost row |
| AE-M2-03 | M2 | W4/W13 (E1/E7) | c | The evaluation cadence is M2's largest new recurring draw on the weekly bucket and appears in no capacity row; the interval driving it is itself marked unevidenced | An evaluation-capacity row in `07` §6 units, and a stated behaviour when the evaluation cycle collides with a capacity-pressure window | M2 `review_cadence` + §9.1 fresh-holder arm + `CT-INSTRUMENT` pools |
| AE-M2-04 | M2 | W4 (E3) | b | Silent on the metered path — the words do not occur in any capacity sense, in the candidate whose central fixture is capacity pressure | Name `AuthAttestation`'s credit-settings field as the observation point, state `07` §6's quarantine as the response, and add a shed-record row for whether the metered affordance was offered | M2 inherited `07` §5–§6 provider dependence |
| AE-M2-05 | M2 | W4 (E4) | c | The wake right can re-arm itself on a lapsed `valid_until` it refreshes; the lane caps the loop but a fully-consumed lane is not a breached minimum, so the failure is invisible to the instrument built to watch it | A progress predicate on the lane, with a named recipient told when a lane's consumption carries no accepted outcome across a reset window | M2 charter wake right + `valid_until` refresh + `reserved_lane` bound |
| AE-M2-06 | M2 | W4 (E4) | b | No retry ceiling anywhere; delegation depth is closed by inheritance and iteration is not | An attempt ceiling per duty with a named owner and a stated behaviour at the ceiling | M2 duty wake/attempt loop |
| AE-M3-01 | M3 | W4 (E1/E2) | b | The reserve-fill rule fills idle reserve only within the reserving class, so an idle class's share is still destroyed at the reset; M3 states the stronger principle it does not implement | A cross-class release at a declared lapse point, a precedence for which class receives released capacity, and a record of how much lapsed unconsumed | M3 §7 F-2 scheduler reserve-fill rule |
| AE-M3-02 | M3 | W4/W13 (E5) | b | The F-2 answer never states the fixture's disposition and never names the unblocking act; substance honest, form is what control 10 exists to catch | The disposition in the fixture answer — not executable at CP1, measurement owed, blocked on a reviewed `CapacityPlan` revision — plus the named owner of that revision decision | M3 §7 F-2 answer (disposition placement) |
| AE-M3-03 | M3 | W4 (E1) | c | The per-step cacheless launch is named as M3's own counter-cost and then charged to nothing; the design's growth direction and its dominant unpriced cost point the same way | An expected-launch count per procedure version checked against actual at run close, and D-06 written out with baseline, unit, repetition, stopping rule and owner | M3 per-step launch model (`Procedure` carries no launch budget) |
| AE-M3-04 | M3 | W4 (E3) | b | The metered answer is the round's best and is described as "the only one available", which `07` §6's quarantine rule contradicts | Bind the observation to `07` §6's quarantine response and `07` §5's `AuthAttestation` refresh cadence, and drop "the only one available" | M3 §10 metered-path observer + journal entry |
| AE-M4-01 | M4 | W4 (E2) | **d** | A standing holder can veto the shedding of its own reserved lane and no override exists anywhere; four protected holders can refuse four times while the bucket stays empty | A stated decider when a protected-lane holder refuses, with the holder's minimum as **evidence rather than consent**; a bound on how long a refusal may stand; and a record of refusals that outlived their deadline | M4 §7.2 reserved lanes + "only its holder may shed it" |
| AE-M4-02 | M4 | W4 (E3) | b | Silent on the metered path, and it compounds with the veto: a deadlocked shed leaves whoever is at the terminal facing a one-click offer to buy capacity | Name the observation point and its response, and add the metered-offer event to the shed record | M4 inherited `07` provider dependence |
| AE-M4-03 | M4 | W4 (E1/E2) | b | The return-to-pool rule is conditional on a **decline**, an act the veto lets a holder withhold | A time-triggered lapse point per lane independent of consent, plus a recorded quantity of allowance that lapsed unconsumed per lane per window | M4 §7.2 "a declined reservation returns to the pool immediately" |
| AE-M4-04 | M4 | W4 (E4) | b | No retry ceiling and no no-progress class; `budget_exhausted` exists as a typing outcome only | An attempt ceiling per work order with a named owner, a `no progress` error class, and a recipient told when a lane's consumption produces no accepted outcome | M4 re-derive/re-attempt loop at C2 and above |
| AE-M4-05 | M4 | W4/W13 (E7) | c | Nine holder records are recurring human labour named in prose and never priced in any unit, against DIRECTIVE §8.21's requirement to model founder attention | Review-period length, an estimated holder-hours-per-period figure with its denominator, and a stated behaviour when holder review collides with a pressure window | M4 nine `StandingHolder` records + `review_date` |
| AE-M5-01 | M5 | W4/W13 (E1) | c | The design's own sharpest economic falsifier — the fraction of conditions expressible as deterministic typed predicates — carries no evaluation protocol while six less consequential questions do | That count with a baseline, a unit, a stopping rule and an owner, plus a stated threshold below which the candidate is withdrawn rather than relaxed | M5 "no arming condition may call a model" (deterministic preconditions) |
| AE-M5-02 | M5 | W4 (E4) | c | The per-cause allowance bounds the re-arming loop and its size is set by nobody; generous suppresses nothing, tight suppresses legitimate re-arming invisibly | The allowance in `07` §6 units per cause class, an owner, and a recorded count of causes that exhausted their allowance in a window | M5 §3.4 per-cause allowance |
| AE-M5-03 | M5 | W4 (E2) | b | The protected floors are shares of an allowance that may be zero, and no non-model performer is named for a due obligation past exhaustion; M5 is closer than M1/M2/M4 and does not take the last step | An exhaustion rule distinct from the pressure rule, naming the non-model production mode that carries a due obligation past exhaustion, who is alerted, and the record left | M5 §7 F-2 protected floors (50% due service, 15% reserve) + `production_mode` |
| AE-M5-04 | M5 | W4/W13 (E5) | b | The F-2 disposition is correct and is stated two sections away from the fixture | The disposition in the fixture answer, with §11's "settling it is an account inspection, not an experiment" attached | M5 §7 F-2 answer (disposition placement) |

### B.4 — A-context-evidence (AX) · W3, W5, W14 · 14 findings

| id | cand | dim | class | issue | required contract | mechanism_targeted |
|---|---|---|---|---|---|---|
| AX-M1-01 | M1 | W3 | b | The founder brief is the one untyped transfer and the highest-consequence one; M1 argues the general form and stops one recipient short | The founder brief carries a `ConstraintSet` in the same schema as every machine transfer, with the omissions section rendered rather than narrated | M1 §6.3 / F-6.7 re-entry brief vs §4.2's `ConstraintSet` obligation list |
| AX-M1-02 | M1 | W3 | c | Contamination has detection and supersession but no blast-radius enumeration; the `Projection` revocation cascade exists for grants and is not wired to corrections | A supersession enumerates the accepted outcomes whose evidence closure includes the superseded value and re-accepts or flags each; protocol, baseline and owner needed | M1 §5.3 supersession + `Projection` revocation cascade |
| AX-M1-03 | M1 | W14 | b | One ledger restatement carries a date error ("two days later" against one day) and nothing in the round could have caught it | None beyond the round's own instrument — the finding is against the instrument, not the argument | M1 §12 ledger row citing R3 F59 |
| AX-M2-01 | M2 | W3 | b | Typing covers the carried record and does not cover the work-order transfer; the handoff rule is inherited prose, not a typed carrier | Extend the typed-member rule from `CarriedRecord` to every transfer the fixtures name, including the `WorkOrder` dispatch and the founder's charter sheet | M2 §5.2 `CarriedRecord` typing + §4 work-order handoff |
| AX-M2-02 | M2 | W5 | c | The instrument desk evaluates every other desk and is accepted by the founder alone — a one-instrument chain with a measured human error rate and no second reading | The instrument desk's readings carry their own paired clean case and a deterministic reproduction path, so founder acceptance is a check of a computation | M2 `CT-INSTRUMENT` + founder acceptance of its readings |
| AX-M2-03 | M2 | W14 | a | The ledger's row 1 contradicts the body's own count, in the direction that flatters R8 and drops the reachability property CAP-42 depends on | The ledger row states M2's count and cites R8 A-1 as the source it departs from | M2 §12 ledger row 1 vs §2.4 charter-delta count |
| AX-M2-04 | M2 | W3 | b | M2 names no trust level anywhere, at any granularity, while running a deliberately untrusted published intake route | Trust level named as a manifest field, per input | M2 inherited `06` §2 manifest |
| AX-M3-01 | M3 | W3 | b | The manifest omits per-input trust level, which DIRECTIVE §8.12 requires by name; trust exists at record granularity only | Trust level as a per-item manifest field, not a per-record one | M3 `ContextManifest` |
| AX-M4-01 | M4 | W3 | b | The manifest omits trust level, and M4's own derivation makes the omission bite harder — a producer cannot tell a reader which of its inputs were trusted | Per-input trust level as a manifest field, so the derivation's trust assumption is visible to the step that acts on it | M4 §5 context manifest (dropped constraints + assembled-for class) |
| AX-M4-02 | M4 | W14 | b | One row labelled DIRECT OBSERVATION rests on two files the provenance header does not list; the content resolved and is accurate | A DIRECT OBSERVATION names the artifact it observed in the provenance header | M4 §12 ledger row 7 kind label |
| AX-M5-01 | M5 | W3 | c | Contamination suspends future firing and does not reopen what already fired; M5 has the `derived` lineage to close it and no rule walks it | A supersession arms an interest over the transitive closure of `derived` entries naming the superseded entry, and each reopened `AcceptanceState` is re-decided or flagged | M5 §5.2 contradiction suspension + `derived` trust class |
| AX-M5-02 | M5 | W14 | b | One citation presents the favourable half of a documented tension (MCP progressive scope) and omits the fallback clause; M1 cites both | Cite R4 F11 beside R3 F46 wherever progressive scope is claimed | M5 §7 F-3 least-privilege progressive-elevation claim |
| AX-M5-03 | M5 | W14 | a | Two citations to the governing directive do not resolve; M5 is the only candidate with a dead relative link and it is dead twice | `../../../inputs/DIRECTIVE.md` | M5 header and §12 kind-line link paths |
| AX-ROUND-01 | **ROUND** (carried by M1, M3, M4, M5; M2 never cites the source) | W14 | b | One measured interval drifted inside its own lane's summary, propagated through the cross-lane artifact, and was reproduced by all four candidates that cited it — the round has no mechanism that catches a restatement drifting from its own source | Run the repository's existence-and-drift check over `research/F2/**` and `planning/F2/candidates/**` before Step 4 consumes the candidates — existence blocking, drift warning | The round's own citation instrument (no quotation machine-verified) |

### B.5 — A-security-adversarial (AS) · W6, W10 · 25 findings

| id | cand | dim | class | issue | required contract | mechanism_targeted |
|---|---|---|---|---|---|---|
| AS-X-01 | **X** — M1, M2, M4, M5 (**M3 exempt, structurally**) | W6/W10, lands on W5 | **d** | The acceptance criteria are an unblinded channel into the checker and no candidate names their author; all five close the three channels R7 named and none closes the fourth | Name the author of the acceptance criteria; forbid the producing path from authoring or amending them; version and freeze them before the producing step starts; add a fourth F-4 arm in which the criteria are authored by the producing path | The acceptance-criteria channel — the checker's declared read set in all but M3 |
| AS-X-02 | **ALL** | W6 | b | The W6 boundary in all five rests on one unbuilt policy object; four name no check on the launcher; and none applies to grant **removal** the positive-control rule three of them apply to grant **delivery** | The policy object is a record with a named writer and a protected-change class; the launcher's stripping carries a positive control — a probe skill whose arrival at the enforcement point is a failure | The external policy object (R4 F7) + launcher tool-grant stripping |
| AS-X-03 | **X** — M1, M2, M3, M5 (for M4 this is AS-M4-01) | W6, W10 | b | The model provider is a C2 destination under the fixed boundary and four of five never say so, so nobody authors the contract, sets allowed data categories, or checks the projection is clean *for that destination* | Name the provider as a destination; carry a standing `DisclosureContract`; state that the loader's narrowed projection is the destination-clean construction discharging it; class the contract's amendment as a protected change | The model-call path / provider channel |
| AS-X-04 | **ALL** | W6, W10 | b | Fan-out is bounded only by budget in all five; four answer depth only, and a budget bounds cost while the blast radius is the union of read sets | A width ceiling per attempt with the same owner and checkpoint as the depth ceiling, expressed over distinct read sets rather than over cost | The delegation ceiling (depth-only) in all five |
| AS-M1-01 | M1 | W6, W10 | **d** | The consultation return is an unfiltered model-to-model channel into the identity holding the effect grants, defended by a rule M1's own text proves cannot be model-enforced | The return crosses the loader; the obligation-holder's delivered inputs are typed `ConstraintSet` members and typed outputs only; prose is stored at a Ref and **not delivered** | M1 §4.4 `ConsultationRequest` / `AttemptReport` return |
| AS-M1-02 | M1 | W6 | **d** | `ProjectionGrant` has no issuing authority, in the object M1 itself calls its highest-risk one; a worker can issue one over its own work and choose the recipient scope | Issuance is a C2 act released by C04; `recipient_scope` and `purpose` resolve from a `ParameterAuthority`, never from the granting executor's text; the grant is re-read at every read of the derived `Projection` | M1 `Projection` / `ProjectionGrant` pair |
| AS-M1-03 | M1 | W10 | b | `InstrumentCalibration` has no named writer and it is evidence history under DIRECTIVE §8.22; M1 declares writers for only two of its new records | The calibration writer is C06 or a dedicated instrument custodian excluded from every producing path, and a calibration write is a protected change | M1 `InstrumentCalibration` record |
| AS-M1-04 | M1 | W10 | b | Six existence reasons multiply the channels AS-M1-01 travels on, and M1 concedes the direction | Read with AS-M1-01 — the fix must scale with executor count | M1 §4.1 six existence reasons (executor-count multiplier) |
| AS-M2-01 | M2 | W10 | b | The published reachability route is an attacker-reachable write path into a capped store; the unaddressed axis is **volume**, and a full cap refuses the next legitimate complainant at the one object whose purpose is guaranteed reachability | A per-counterparty and per-origin-channel sub-cap, and a cap-exhaustion behaviour that preserves intake — overflow to a named destination with an alarm and a reader | M2 `Charter.reachability` + §5.4 write-time cap |
| AS-M2-02 | M2 | W6 | b | The ratchet is closed against the charter's record and left open against the accumulated **approval set**; M2 nowhere states that an approval expires, and F-6 is exactly when the ratchet cannot be corrected | Approvals carry an expiry, and the monotonic-exposure diff is over effects releasable without a human, not over the declared ceiling | M2 monotonic-exposure check + `eligibility_ceiling` |
| AS-M2-03 | M2 | W6 (W4-adjacent) | b | No metered-path observer — the rule is inherited and **unenforced**; three other candidates name at least an observation point | Name an observation point and a response | M2 provider dependence ("identical to S1.0") |
| AS-M3-01 | M3 | W6, W10 | b | Inside the declared branch set a model-authored typed value selects the producing step's own downstream treatment, so checker *selection* is a producer choice even though checker *inputs* are a record | Procedure admission refuses a branch set in which a model-authored value selects between acceptance strengths for one artifact; acceptance-strength selection is a guard over journal state and consequence class | M3 invariant 1 declared branch set + pure-function guard |
| AS-M3-02 | M3 | W6, W10 | b | The unclassified custodian may authorise effects one at a time with no stated ceiling, on evidence assembled by model steps from untrusted input, and M3 routes every unknown job through that one path | A per-class ceiling on what one unclassified-path custodian may authorise without a second party; at minimum C4/C5-equivalent effects require the founder or a professional | M3 `unclassified-work/v1` triage-custodian authorisation |
| AS-M3-03 | M3 | W10 | b | A false journal entry's blast radius is stated by M3 and unmeasured, and the containment is a person M3 itself measures at 5–65% agreement | The measurement is owed; recorded as the residual that survives M3's strongest mechanism | M3 Journal as the account + human acceptance |
| AS-M3-04 | M3 | W6 | b | AS-X-03 in reverse: M3's step table denies that a `model` step releases an effect, while its per-step declared read set **is** the destination-clean construction `02` §8.2 requires | Correct the row — M3 is the candidate best placed to claim it and the only one whose text denies it | M3 §2 step-kind table, `model` row |
| AS-M4-01 | M4 | W6 (W2-adjacent) | **d** | M4's own derivation makes every provider prompt a C2 effect and its own mapping table then requires C04 to release it, so every E's every turn is a C04 release; the obvious exemption is foreclosed by `02` §8.2 | State that the provider channel carries a standing `DisclosureContract`; that the loader's class-narrowed projection is the destination-clean construction discharging it; that a model call is a pre-authorised C2 release gated by projection conformance rather than a C04 transaction; and that amending the contract is C5 | M4 §2.2 rule 2 destination input + §4.1 C2 release row |
| AS-M4-02 | M4 | W10 | b | The `ConsequenceDerivation` record names no writer; §6.5 protects the derivation function and not the per-operation record, and the candidate never says append-only | The record is written only inside the release path; `mismatch_disposition` is writable only by the party owning the park; the record is append-only | M4 `ConsequenceDerivation` per-operation record |
| AS-M4-03 | M4 | W10 | b | Composition across unjoined records is unsolved, and M4 is the candidate for which that matters most — its guarantee is per action and an adversary works per campaign; M4 concedes it as one of its own open (d)s | Recorded as conceded; the reviewer agrees and adds that this is the one an adversary uses | M4 per-action class derivation + `ConflictClaim` join |
| AS-M4-04 | M4 | W6 (W4-adjacent) | b | No metered-path observer | As AS-M2-03 | M4 provider dependence |
| AS-M4-05 | M4 | W10 | b | Nine intake addresses are nine published inbound channels and M4 does not say so; it has no stated write cap at all, where M2 at least has one to be exhausted | A stated write cap per intake; the AS-M2-01 volume argument transfers | M4 `StandingHolder.intake_address` × 9 |
| AS-M5-01 | M5 | W6, W10 | **d** *(index heading is the wrong line; class correct)* | The untrusted-input gate contradicts the investigation path meant to discharge it, and the contradiction is the laundering route: either untrusted material is inert and unhandled, or an activation promotes untrusted to attested on a model's judgement of the attacker's own text | Promotion from `untrusted-external` is an effect with its own class, a named non-model discriminator running before the write, and a writer that is not the investigating activation; plus the missing rule that a `derived` entry's trust class is the floor of its inputs' | M5 §5.3 trust-class gate + `investigate-untrusted-report` interest |
| AS-M5-02 | M5 | W6 | **d** | A self-admitted trial interest declares `writer_keys` and nothing says they must be disjoint from the existing sole-writer assignments, so a model-authored object can reach the permission boundary over the Record with no human in the loop | `writer_keys` are assigned only by the §2.1 authority and refused to any proposal; a trial may write only into kinds whose writer is already "any activation"; the admission check is deterministic and names the failed predicate | M5 `InterestProposal` graduated admission at `read_only` / `internal_artifact` |
| AS-M5-03 | M5 | W10 | c | Arming is unstoppable by design — the property M5 is built on — and it is also the amplifier an adversary rides; the per-cause fingerprint's key is chosen from attacker-supplied material | Restate T07's evaluation protocol inside the candidate, and give the Admission Authority one refusal predicate it lacks — a per-origin arming rate | M5 §3.1 unstoppable arming + §3.4 per-cause allowance |
| AS-M5-04 | M5 | W6 (W5-adjacent) | b | The producer's own write arms its checker, and the tie-break selects the **narrowest sufficient** effect class, which for checking means the weakest check | A `check` interest's precondition reads only fields the producer could not author, and the tie-break for check interests inverts to strongest sufficient | M5 `submitted` transition arming `check` + §3.3 tie-break |
| AS-M5-05 | M5 | W6 (W4-adjacent) | b **(strength, recorded with its limit)** | The `credit-setting` interest observes and does not prevent, correctly stated — the strongest treatment of the metered path in the round | None — recorded as a strength, not as a finding against M5 | M5 `credit-setting` standing interest |

---

## C. (d)-class missing decisions, grouped by the decision

**28 (d)-class findings across the five reviews merge into 24 distinct missing decisions.** Four merges were
performed, all of them cases where the same missing decision was found in different candidates or by
different reviews. Protocol §8: any (d) blocks acceptance of the layer, and excellence elsewhere does not
offset it. **The negative-control failure AC-M2-01 blocks on its own footing and is not a (d); it is in
section D.**

The founder/design column applies the DIRECTIVE §3 test as the brief states it: a decision is the founder's
only if it turns on **personal intent, values, risk tolerance, irreversible commitment, or information only
the founder holds**. That classification is **INFERENCE** by this agent; where a review or a candidate
already routed the decision, the routing is quoted and the inference follows it.

| # | The missing decision | Finding ids | Blocks | Already decided anywhere? | Founder or design |
|---|---|---|---|---|---|
| **MD-01** | **Who is the terminal owner of an unowned duty or harm, and does that party exist as a record** | AC-M1-02 · AC-M5-02 *(merged: one gap, two candidates, one review)* | M1, M5 | **M5 declares it** as its own open (d) and routes it as a founder decision packet; AC records "Same hole; one candidate walked past it and one stopped at it and told the founder." M4 has the (a)-class version (AT-M4-04), M5 a second (AT-M5-04), M2 the (b) version (AC-M2-02) | **Founder** — AC §7.3: "the resolution is a staffing decision and belongs to the founder" |
| **MD-02** | **Which standing roles or holders are staffed by a person other than the founder before work is admitted in that class, and what happens in a class where none is** | AC-M3-02 · AC-M4-01 · AC-M4-02 *(merged: three findings, two candidates)* | M3, M4 | **M3 has the mechanism and has not applied it to its own acceptance table** — "admission in that class stops rather than letting the record sit assigned and silent". M5 applies the same rule to one case. M1 and M4 park individual items instead | **Founder** — staffing and money; DIRECTIVE §3 irreversible commitment and information only he holds |
| **MD-03** | **Who may approve creation of a new capability, and what happens during a founder absence** | AC-M1-01 | M1 | **Partially decided by two candidates**: M3 carries the job to an outcome with no edit through `unclassified-work/v1`; M5 splits it by effect class, admitting `read_only` and `internal_artifact` capabilities on an expiring bounded trial. AC §7.1: every candidate concedes a human approver is needed for the outward half | **Founder** — delegation of authority with a consequence ceiling; risk tolerance |
| **MD-04** | **Who accepts CAP-43 — the assessment of the founder's own competence** | AC-M4-03 | M4 | **`04-human-operation.md` already fixes the opposite arrangement** (a competent assessor states it; the owner contests). M4's CAP-33 avoids it with "P, independent authorization"; CAP-43 carries a bare `P` | **Founder** — naming the assessor is staffing and personal; the mechanism itself is fixed and inherited |
| **MD-05** | **Whether acceptance is bound to the founder's presence or to a property of the evidence** | AC-M1-03 *(d)*; same shape, non-blocking: AC-M2-05 *(b)*, AC-M4-04 *(b)* | M1; shape present in M2, M4 | No candidate decides it. AC: "the model family's correlation does not change with his calendar" | **Design** — the reviews name the contract (state the rule as a property of the evidence and drop presence) |
| **MD-06** | **Whether a grievance about the custodian's own disposition has a named independent recipient** | AC-M2-03 *(d)*; same gap, non-blocking: AC-M3-03 *(b)*, AC-M5-03 *(b)*; M1 handles it definitionally only | M2; gap present in M1, M3, M5 | **`03` fixes and checks it** — `disputed_custodian` read at `received → triaged`, absent-value denies. No candidate carries it across; M5 states the requirement without a mechanism. (d) for M2 because M2 names one fixed desk, so there is no second route | **Design** — carrying an existing fixed mechanism across, not inventing one |
| **MD-07** | **Shedding authority: may anything halt or reverse a shed in the moment, and who decides when a protected-lane holder refuses** | AT-M3-03 · AE-M4-01 *(merged: two reviews, two candidates, opposite failure directions)* | M3, M4 | **M2 writes the prohibition explicitly** — a holder "may negotiate, never veto", "may not refuse admission narrowing, and may not defend its own mandate". AE cites that as proof the obligation "was available to be written and is not an artifact of hindsight". M5 sides with M3 and adds an overflow count | **Founder** — who holds authority under pressure; AE's contract asks for "a stated decider", which is a delegation of authority |
| **MD-08** | **The size of each reserved lane, its stated minimum and its lapse point** | AE-M2-01 *(= M2's own declared (d-M2-2); AE records it as confirmed, not discovered)* | M2; the unsized-share problem recurs in M4 (AE-M4-03/05) and M5 (shares fixed but "authority to change the shares is the founder's") | **M2 decides that it cannot be decided here** and routes it as a decision packet; AE agrees, because no published denominator exists and the lanes are what the company gives up | **Founder** — explicitly; risk tolerance and what the company surrenders under pressure |
| **MD-09** | **What "admissions narrow" means quantitatively and who computes it** | AT-M2-03 | M2 | Not decided. §12 marks the lifecycle unevidenced; §11 is silent | **Design**, with a founder-owned parameter — the narrowing policy is what the company stops taking on |
| **MD-10** | **What grant backs an effect step on work of an unknown kind** | AC-M3-01 | M3 | Not decided; both readings break something M3 relies on (the omnibus scope its §6.2 refuses, or a system edit that reopens W1) | **Design**, with a founder-owned consequence and value ceiling |
| **MD-11** | **Who authors the acceptance criteria, and may the producing path author or amend them** | AS-X-01 | M1, M2, M4, M5 (**M3 exempt, structurally** — the criteria sit in an immutable `Procedure` accepted by a human capability owner, or are set by a person for unclassified work) | **M3 decides it by construction and did not argue for it.** No other candidate names the author | **Design** — a rule about a mechanism, and it decides whether F-4's independence claim is real |
| **MD-12** | **Whether the model provider is a named C2 disclosure destination, and how a model call is released** | AS-M4-01 *(d)*; same decision, non-blocking elsewhere: AS-X-03 *(b)*, AS-M3-04 *(b)* | M4 blocking; M1, M2, M3, M5 carry the (b) form | **No candidate names it.** M4 is the only one whose own derivation forces the contradiction, which is why it is (d) there and (b) elsewhere. M3 has the discharging mechanism and denies the claim | **Design** — the reviewer supplies the contract; but the "model calls are exempt" branch relaxes a fixed boundary and would need a **founder decision packet** |
| **MD-13** | **Does a model-to-model consultation return cross the loader, and what is the receiving obligation-holder's read set** | AS-M1-01 | M1 | **M3 and M5 have no model-to-model channel at all**, so the decision has no subject there; AS calls that divide "structural rather than agreed" | **Design** |
| **MD-14** | **Who issues a `ProjectionGrant`, at what consequence class, and where `recipient_scope` comes from** | AS-M1-02 | M1 | Not decided; CP-84, the cited anchor, states what a worker may read and names no issuing authority | **Design**, with the cross-venture disclosure ceiling arguably a founder call |
| **MD-15** | **May an activation promote an entry's trust class, and under what authority and non-model discriminator** | AS-M5-01 | M5 | Not decided; M5's §5.3 gate and its §7 F-1 adverse walkthrough cannot both hold | **Design** |
| **MD-16** | **May a trial interest declare a `writer_key`, and what does the admission check refuse** | AS-M5-02 | M5 | **M5's §11 half-sees it** — it asks whether a trial may auto-renew, never what a trial may claim | **Design**, and it reaches DIRECTIVE §8.22's protected set |
| **MD-17** | **Which definition of `HandoffAcceptance` governs — the registry's or M1's** | AT-M1-01 | M1 | Not decided; M1 §11 lists it as "Decided", not knowing the record exists | **Design** — a registry amendment, and irreversible-tier by the repository's own classifier |
| **MD-18** | **Which fields a resumed attempt must re-derive, and who marks a field critical** | AT-M1-02 | M1 | **Half decided** — M1 §11 decides the *trust* half and leaves the *re-derive* half open; AT records it as a partial false closure | **Design** |
| **MD-19** | **The checkpoint or close-out predicate before a capacity cut** | AT-M1-03 | M1 | Not decided, and M1's own capacity finding says the figure it would need does not exist | **Design** |
| **MD-20** | **How ~50 dangling registry references migrate when `AgentTemplate` and `AgentInstance` are deleted** | AT-M3-01 | M3 | Not addressed in §11 or §12; M3 supplies a migration rule for procedures with runs in flight and none for the registry | **Design** — irreversible-tier (record deletion), computed rather than argued |
| **MD-21** | **How "carries a promise" is recognised on an outward artifact** | AT-M4-01 | M4 | Not decided; §2.2 forbids the only sources that could compute it | **Design**, and the C3-floor branch is a throughput trade the founder would own |
| **MD-22** | **Whether an action satisfying several classes is gated by every reached class's gates, or by a maximum over a rank** | AT-M4-02 | M4 | Not decided; §12 row 2 asserts conformance as "Specification", which AT records as a false closure | **Design**; **severity contested** — if it is a fixed-boundary change it needs a founder decision packet and blocks W2 under §8. AT records the passage conflict as established and the severity as unresolved |
| **MD-23** | **May a standing interest write `Constraint` directly, or only a `proposed` revision C01 endorses** | AT-M5-01 | M5 | Not addressed in §11 or §12, though §7 F-1 step 4's wording suggests the compatible reading is what M5 means | **Design** — a one-line repair that removes the finding |
| **MD-24** | **How the semantic-conflict merge interest arms without a model in its precondition, or whether the gap is recorded as undetected** | AT-M5-03 | M5 | Not decided anywhere in M5; the gap is listed in neither §11 nor §12 | **Design** |

**Totals.** 24 merged decisions · **6 founder** (MD-01, 02, 03, 04, 07, 08) · **18 design**, of which **5**
carry a founder-owned parameter or a conditional founder decision packet (MD-09, MD-10, MD-12, MD-21,
MD-22).

**Decisions blocking each candidate** (reviewer-raised (d) only; the candidates' own declared (d)s are
listed below and are additional): M1 — MD-01, 03, 05, 11, 13, 14, 17, 18, 19 · M2 — MD-06, 08, 09, 11 (+ the
AC-M2-01 control failure) · M3 — MD-02, 07, 10, 20 · M4 — MD-02, 04, 07, 11, 12, 21, 22 · M5 — MD-01, 11,
15, 16, 23, 24.

### C.1 — The candidates' own declared (d)s, recorded because the reviews reviewed them and did not dispute them

**DIRECT OBSERVATION of the reviews; the candidate files were not read.**

| Candidate | Declared open items | Reviewers' disposition |
|---|---|---|
| **M1** | O-1 the metered-path affordance can be observed, not prevented · O-2 the shared record may itself be a preference-leakage channel into the checker | M1 argues neither is (d); **AT agrees** and **AX** records O-2 as already carrying its own required contract. AS credits O-1 as correctly distinguishing a stated decision with an absent mechanism from a missing decision |
| **M2** | **(d-M2-1)** whether a model may hold a desk carrying external standing · **(d-M2-2)** reserved lane size and lapse point | **AT, AC, AE and AS all agree both are real and correctly routed.** AE records (d-M2-2) as the same hole it reached independently (= MD-08). AS calls (d-M2-1) the security-relevant one |
| **M3** | three open items, one of which M3 flags as arguably (d) — the abstain threshold — plus who the `unclassified-work/v1` custodian is, plus whether a model step may accept a reversible internal class | **AC agrees with M3's (c)** on the abstain threshold; **AX preserves the disagreement** and routes it to the W1 lane. AC: the custodian item is "the single-decision shadow of AC-M3-02" and misses that the same question recurs 32 times |
| **M4** | whether this system has a credential at the boundary at all · **composition across unjoined records** · the arrival rate of genuinely novel work | **AT and AS both agree and add nothing**; AS records composition as "the one an adversary uses" (AS-M4-03) |
| **M5** | the terminal standing custodian is unnamed · whether a read-only bounded trial auto-renews · **plus one that blocks the evaluation rather than the specification**: whether the concurrency pin is a provider constraint or self-imposed policy | **AT, AC and AE agree.** AC records the terminal-custodian item as the declared form of the gap M1 carries silently (= MD-01). AE calls the third item the sharpest sentence in the round on X14 |

---

## D. Negative-control results (protocol §4)

**Read the "not applied" cells as UNKNOWN, not as passed.** Protocol §8: a failure of any §4 control blocks
acceptance. Reviews state which controls they applied: AC applied 1, 2, 4, 8; AX applied 3, 5, 6, 9; AE
applied 7 and 10 (and ran 1 through its comparator probe E6); AS applied 4, 6, 7, 8; AT ran control 1 per
candidate in its §7 table. **All ten controls were touched by at least one review.**

| Control | M1 | M2 | M3 | M4 | M5 | Review(s) |
|---|---|---|---|---|---|---|
| **1** rename-only candidate | **caught — not a rename**: eleven behavioural changes, each argued against a named position; the distinguishing test exists (`ExistenceJustification`) but cannot be run, no runtime | **caught — not a rename**: "remove the three new rows and M2 is S1.0 exactly", which is the opposite of a rename; fresh-holder arm is the best-specified test of the five | **split**: passes at the mechanism layer (four named deletions, checkable by inspection), **fails at the record layer** — four primitives are existing records renamed (AT-M3-02) | **caught — not a rename**: M4 offers the falsifying test against itself (change only the class, four records must differ); cannot be run, and weakened by AT-M4-02 | **caught — not a rename**: a deferral and an absence are different observables; checkable in principle from the armed set | AT §7 · AE E6 · AC |
| **2** a shared source of truth nobody is forced to read | **passed** — the loader discovers and records actual delivered inputs; the caller's claimed read list is not trusted (the paired benign case) | passed by the same mechanism (all five carry it) | passed | passed | passed | AX · AC |
| **3** a checker that passes without checking | **passed** in all five — the known-defect control plus AM-01's paired clean case, in the same session, both rates or neither | ← | ← | ← | ← | AX |
| **4** an agent justified by a capability no fixture exercises | **passed** — §6.5 pre-declares the probe against its own thesis | **FAILED · blocks** — `CT-MEANING` is chartered and exercised in none of the six fixtures (AC-M2-01) | not applied per candidate | not applied per candidate | **passed** — §5.4 declines two credits it could have taken, naming this control as the reason | AC · AS |
| **5** a manifest that lists inputs but not omissions | **passed** — and goes past it, reading "omitted" as which typed constraints were dropped | **passed by inheritance** from `06` §2, and AX records that as thinner than M1's | **passed** — omissions, summarisations and known loss named in the row | **passed** — plus two fields nobody else adds (dropped constraints; the class the manifest was assembled for) | **passed** — the most literal rendering of DIRECTIVE §8.12 in the round | AX |
| **6** an "independent" reviewer fed the producer's rationale | **detectable** — loader-recorded delivered inputs | **detectable** — loader-recorded delivered inputs | **detectable** — a declared read set the loader enforces | **detectable** — loader-recorded delivered inputs | **detectable** — entry-class restriction on the checker's projection | AX · AS |
| **7** a cost comparison counting tokens but not scarce capacity | **passed** | **passed** | **passed** | **passed** | **passed** — "negative control 7 catches nobody"; not one candidate uses the 15× figure or any token multiple as a capacity model | AE E8.3 · AS |
| **8** a job-title roster relabelled as capabilities | **passed** — §4.1 refuses specialised knowledge and attributable identity as reasons to create a worker | **passed** — the four department-shaped capabilities verified blank in the chartered column | **passed** on specified behaviour; AC records the vocabulary as the exposure and M3 names it against itself | **passed** — "the most specific in the round"; the H2/H3 and H4/H6 partition is one a department roster cannot produce | **shape right, evidence wrong** — the many-to-many argument is correct and its single worked example is contradicted by M5's own table (AC-M5-01, class (b)) | AC · AS |
| **9** a router that admits everything | **passed** in all five — refusal is a terminal state of the same record with a named failed predicate and an owner, and all five pair it; M2, M4 and M5 additionally report a refusal rate on a matched benign case | ← | ← | ← | ← | AX |
| **10** a fixture authored after the candidate | **passed** — states F-2 is not executable at CP1 in its first sentence on the fixture and names control 10 by name | **passed** — same, and finds the sub-experiment that *is* executable under the pin | **substance passed, form failed** — never states the fixture's disposition and never names the unblocking act (AE-M3-02, class (b)) | **passed** — states the disposition in full and commits to the two quantities measurable at the pin | **substance passed, form deficient** — the correct disposition is stated two sections away from the fixture (AE-M5-04, class (b)) | AE |

### D.1 — The one recorded failure, and what the protocol says it means

**AC-M2-01 · M2 · negative control §4 item 4 FAILED.** `CT-MEANING` is one of five chartered desks; grepping
the candidate returns three hits — the list of five duties, and two capability bindings — and **none of the
six frozen fixtures exercises it**, including F-5, whose "a source fact changed during the gap" variation is
its natural home. §2.5 requires all three parts of the charter test to hold and asserts "Five duties pass"
without applying the test to any of them individually; part 3 asks who outside the duty's own production path
must reach this desk by name, and for `CT-MEANING` M2 names nobody anywhere.

**What the protocol says.** §4 item 4: such an agent "must be flagged as unjustified". §8: "a failure of any
negative control in §4" **blocks acceptance of the layer**, on the same footing as a (d) — it is not offset
by excellence elsewhere and there is no aggregate score to absorb it. AC records the asymmetry that makes it
cheap to fix and expensive to ignore: §2.5's whole argument is that the test is refutable, and one of the
five was never run through it.

**Two things the synthesis must answer about this cell, and no review does.**

1. **The M3 split result on control 1 is not dispositioned.** AT's §7 table returns "passes at the mechanism
   layer; fails at the record layer", and calls AT-M3-02 "the control's own failure shape" — while classing
   AT-M3-02 **(a)**, which does not block. Protocol §8 makes a §4 control failure blocking. Whether a control
   that fails at one layer and passes at another is a §4 failure is not resolved by any review. *(INFERENCE:
   the tension is real and unowned.)*
2. **Control 4 was not applied to M3 or M4 by any review.** Those two cells are UNKNOWN, not passed.
   Protocol §4's opening sentence — "a candidate is not accepted until the round has run these" — is
   therefore not satisfied for every candidate-control pair, whatever the verdicts above say. The other 48
   cells are resolved: controls 2, 3, 5, 6, 7 and 9 are stated for all five by AX or AS, control 8 for all
   five by AC, and controls 1 and 10 for all five by AT and AE.

---

## E. Mechanisms

### E.1 — Shared by three or more candidates, with each review's caveat

Four reviews produced a shared-mechanism list independently. **The caveats differ in force and the strongest
one governs.**

| Review | What it found shared | Its caveat, in its own words |
|---|---|---|
| **AT** §8 | **Nine mechanisms in five of five**, in near-identical terms, usually citing one finding id in common: one authority per field with delivery narrowed per attempt; a typed constraint envelope on every boundary crossing; deterministic oracle before any model checker with AM-01's paired clean case and union-not-vote aggregation; authority re-checked at the moment of the effect; the idempotency record on the effect as the duplicate detector; refusal as a terminal state of the same record; an escalation ladder may not end assigned-and-silent; the continuation held to handoff discipline; F-2 at 4× reported as owed | "That convergence is the most useful output of Step 3 and it is independent of the selection… A synthesis that re-derives them per candidate is doing work already done five times." AT adds one correction against all five: **FAL-02 is weaker than all five state it** — the 360-second cap is a default of one profile with an admitted persistent alternative, carried as a design proposal, not a contract ceiling. Class (b), five of five |
| **AX** X7 | **Twelve mechanisms in three or more**, all five on ten of them, including: loader records actual delivered inputs; single-writer keyed state; correction = supersession plus an understanding check; write-path screening and provenance ranking both **rejected** on measurement; a pre-gap model verdict is stale in the same class as a pre-gap fact; the re-entry brief carries what was omitted and what was contested | "Five candidates formed blind of each other agree on twelve mechanisms. That is **not** twelve independent confirmations… these are five readers of **one** upstream corpus, in one model family… The convergence is evidence that the research lanes were legible, not that the mechanisms are right" |
| **AS** Part 0 | **Ten mechanisms in all five**, each correctly sourced: revocation as a live epoch re-read at the effect; `derived ⊆ parent` checked by the enforcement point; a skill's `allowed-tools` grant refused; tool self-description and command-text matching refused as a source of class; loader-recorded inputs; deterministic oracle first; AM-01's pairing; union of findings; the idempotency record; no candidate presents a second invocation as independence | **The strongest caveat in the round, and the one to carry:** "Every one traces to R4, to R7, or to `02` §4 and §6.2. Five authors of one model family read one lane set and agreed… **The correct reading of the convergence is one source with five copies**, and a defect in R4, in R7, or in `02` §4 and §6.2 propagates into all five candidates with nothing in this round positioned to catch it. I am the same family." |
| **AC** §7.1 | **Fifteen company duties handled identically by all five** — refusal of a spurious job, admission bias, typing's three outcomes, what a resumed attempt may trust, already-released effect detection, permission composition, revocation, typed constraints, the paired clean case, what independence can mean in one family, the founder as a differently-correlated instrument, the re-entry brief, token counts refused as a capacity model, reserved-but-unconsumed allowance destroyed, B0's two falsified strengths | "**A reviewer comparing candidates on any of them is comparing nothing.**" |
| **AE** E8.3 | **Three things all five get right**: no candidate uses a token multiple as a capacity model; all five state that no absolute denominator exists and every figure is a ratio between arms; all five refuse to report F-2 as passed | The E8.1 ordering built on top of these is labelled ordinal and INFERENCE at every step, because "no arm is expressible as a fraction of the weekly allowance" |

**One divide AS says is *not* inherited and therefore carries independent information:** two candidates (M3,
M5) have **no model-to-model channel**; three (M1, M2, M4) have one. "That divide falls out of each
candidate's own shape… Every propagation finding in this review lands on the side that has the channel."

### E.2 — Mechanisms a review says to keep even if its candidate is rejected

| Candidate | Keep, per review |
|---|---|
| **M1** | **AT:** `ExistenceJustification` — "what makes negative control 4 mechanical instead of rhetorical", portable into any candidate that creates workers; second, `GrantDeliveryReceipt`, the only answer to a measured delivery asymmetry. **AE:** `ExistenceJustification.expected_cost` — "the only place in the five candidates where an invisible capacity cost is attached to the decision that incurs it". **AX:** per-item trust level in the manifest, and reading "what was omitted" as which typed constraints were dropped. **AC:** the re-entry brief carrying what was omitted and what was contested, and the founder described as "an instrument with an unmeasured error rate" whose errors are uncorrelated with the family's. **AS:** the R4 F1 sentence, and grant **arrival** as a record |
| **M2** | **AT and AE:** **the lapse rule** — reserved-but-unconsumed allowance destroyed rather than banked, "the only correct costing of a reservation under a non-rolling allowance anywhere in the round"; second, the monotonic-exposure check, "the only concrete mechanism against the autonomy ratchet in any candidate". **AT:** §9.1's fresh-holder arm, "the best-specified removal test in the round… should be lifted whatever is selected". **AC:** the three-act refund separation (decision, release, **discharge**, with discharge the customer's), and the pre-declared shed minimum. **AS:** typed Ref-only carried memory with no free-text field, and M2's two refusals — no standing reviewer, no standing admitter |
| **M3** | **AT:** **the declared read set, delivered and recorded by the loader** — "it converts 'the checker did not read the producer's rationale' from an assertion into a manifest fact", and a design where a worker assembles its own context cannot make that claim at all. **AE:** the zero-allowance step kind; bounded retry by error class with a `Blocker` on two failures with the same cause — "**E4 is closed, and M3 is the only candidate that closes it**"; and the removal criterion declared per model step. **AX:** the founder brief as a deterministic projection plus one model step validated field-by-field against it, "the only mechanism in the five candidates that makes omission structurally visible"; and the routing rule that a producing run may not select its own checker. **AC:** `unclassified-work/v1` with a declared maximum age whose breach is itself admitted work. **AS:** non-composition rather than attenuation; admission-time resolution of a declared grant against the grant policy; a drafted procedure executable only after a passing test suite and a human capability owner's acceptance |
| **M4** | **AT:** **recomputing the class inside the ordered release transaction, on the frozen bytes, parking on mismatch and never resolving downward**; and the §9.1 one-action-two-classes anti-renaming test. **AE:** the 90%-C0/C1 falsifier — "the most executable in the round and it is aimed at M4's own foundation". **AX:** a missing clean-case rate resolving `unresolved` rather than `pass` (the only terminal-value treatment in the set), and the manifest field recording the class it was assembled for. **AC:** the closure interlock on CAP-39, and the `ConflictClaim` double-payment guard keyed on the original charge. **AS:** approval expiry, and classing the derivation function, table, holders and floors as C5 |
| **M5** | **AT:** **arming as a computed, unstoppable set** — "the only mechanism that makes a deferral a visible state with a deadline rather than an absence indistinguishable from an oversight". **AE:** `budget` as a mandatory schema field on the object that consumes capacity; `CapacityState` with `remaining-or-unknown`; and the `credit-setting` interest, "the round's only real answer to X20". **AX:** trust class as a gate on what an entry may activate rather than a weight on a ranking; the armed set recomputed rather than carried in a summary; `refusal-sample`. **AC:** the graduated read-only/internal-artifact trial — "the tightest concession in the round and should survive into any synthesis"; the unmatched pool defined as the computable complement; the re-entry brief's checker clean-case refusal rate |

**Two compositions the reviews name explicitly, both in AC §7.2:** M4's closure interlock and M5's
unretirable `grievance` interest "compose, and a synthesis should take both"; and on persistence, M2's
separable reachability plus M4's refusal of carried memory compose into "a reachable named party with no
carried memory, which is what M4's `StandingHolder` already is".

### E.3 — Mechanisms a review says must **not** be kept as written

| Mechanism | Review's instruction | Finding |
|---|---|---|
| M4's `max()` over routing classes | Replace with a **set** of reached classes, applying every reached row's gates — or prove the table monotone | AT-M4-02 |
| M4's holder **veto** over shedding a protected lane | Must not stand without a named override; the holder's minimum is **evidence, not consent** | AE-M4-01 |
| M4's consent-conditional return-to-pool | Replace with a time-triggered lapse point independent of the holder | AE-M4-03 |
| M4's bare `P` acceptor on CAP-43 | Must not stand — it makes the owner the acceptor of the assessment of himself, which §2.3 forbids | AC-M4-03 |
| M5's merge interest as specified | Either name the typed proxy it arms on, or **withdraw it** and record the gap as undetected | AT-M5-03 |
| M5's `writer_keys` on a trial interest | **Refused to any proposal** — assignment stays with the §2.1 authority | AS-M5-02 |
| M5's untrusted → attested promotion by the investigating activation | Must not stand; promotion is an effect with a non-model discriminator and a different writer | AS-M5-01 |
| M5's narrowest-sufficient tie-break, applied to check interests | **Inverts** to strongest sufficient | AS-M5-04 |
| M5's second writer on `Constraint` | Only a `proposed` revision; `proposed → endorsed` stays C01's | AT-M5-01 |
| M1's unfiltered consultation prose | Not delivered — stored at a Ref as evidence; the return crosses the loader | AS-M1-01 |
| M1's issuer-less `ProjectionGrant` | Closed — issuance is a C2 act released by C04 with parameters from a `ParameterAuthority` | AS-M1-02 |
| M1's `HandoffAcceptance` name | Must not collide with the registry's record | AT-M1-01 |
| M1's cost figure in a forbidden unit | Relabelled, re-expressed, or **dropped** | AE-M1-01 |
| M3's deletion of `AgentTemplate`/`AgentInstance` without migration | Not without a reference-migration table or tombstones | AT-M3-01 |
| M3's branch set where a model-authored value picks acceptance strength | Refused at procedure admission | AS-M3-01 |
| M3's "the only one available" claim about the metered response | **Dropped** — `07` §6 supplies a stronger response (quarantine) M3 declines | AE-M3-04 |
| M2's "zero per work order" coordination cost | Must not be stated as zero; one decision probe per consequential action | AE-M2-02 |
| M2's ledger row 1 charter-delta count | Corrected to M2's own count, citing R8 A-1 as the source it departs from | AX-M2-03 |
| M5's dead DIRECTIVE links and half-cited MCP tension | Fixed; cite R4 F11 beside R3 F46 | AX-M5-03, AX-M5-02 |
| **All five:** FAL-02 stated at full strength | "The strength of the claim should be reduced wherever Step 5 restates it" | AT §9, class (b), five of five |
| **All five:** `CP-nn` cited as a specification anchor | The namespace resolves to a Step 0 artifact, not to `specification/`; AT verified the meanings hold and flags the namespace, AS records it as out of its scope | AT §9 · AS out-of-scope note 2 |

---

## F. Dissent preserved

**Each row states both positions and the discriminating test the reviews name. None is resolved here.**

**F-1 · Shedding — "ask the holder" (M2, M4) versus "pre-endorsed order" (M3, M5).**
*Position A (M2):* a class cannot be asked to yield, a desk can, and a holder returns a minimum **declared in
advance, not invented under pressure**; a charter never vetoes. M4 sides with this and adds consent, which
AE-M4-01 records as the step too far.
*Position B (M3):* "at 4× there is no time to negotiate and a pre-endorsed, auditable order is faster and
reviewable", conceding that "a pre-endorsed order cannot notice that this particular shed is catastrophic".
M5 sides with this and adds an overflow count.
*Reviews:* AC §7.4 — "opposite and individually correct positions, and neither is refuted". AE's closing —
"M4's veto and M2's prohibition on veto are two defensible readings of the same R8 finding, and I have
recorded both positions rather than merging them."
*Discriminating test, named and unrun:* **whether a shed at 4× has time for a negotiation round.** Nobody has
measured it. AC: "It should be retained as a design input rather than resolved." M2's own executable falsifier
is the nearest instrument: run the shed decision twice on one tabletop, once asking named holders and once
applying `07` §6's class reservations with no holder, and count founder reversals and breached minimums.
*Both (d)s in this dissent are live:* AT-M3-03 (nothing can halt a shed) and AE-M4-01 (nothing can override a
refusal). They fail in opposite directions from one unsettled question.

**F-2 · AT-M4-02 severity — contested by the reviewer who raised it.**
*Established:* the passage conflict. `02-authority-recovery.md` §4 heads its table "Routing classes are
predicates, not a total privilege rank" and says an action may satisfy several classes and must meet all
their gates; M4's `max()` returns one class and applies one row, dropping C2's `H` requirement on a C2∧C3
refund message.
*Contested:* whether this rises to "a fixed boundary changed without a decision packet", which protocol §8
makes **blocking on W2**. AT: "The classes are reused verbatim and no seventh is added, which is what M4
claims; what changed is how an action satisfying several of them is gated. I record the passage conflict as
established and the severity as contested, and do not resolve it."
*Discriminating test:* prove the §4.1 table monotone in both the ACCEPT and the May-PREPARE columns. AT
supplies one counterexample in each, so the proof as stated fails; whether a repaired table exists is open.

**F-3 · Persistence — what the charter delta actually is.**
*Position A (M2):* **three** properties, against R8 A-1's two, "because a party an outsider can reach by name
is not a consequence of memory or of reservation, and CAP-42 is carried by that row alone".
*Position B (M4):* **one** — take the reserved capacity, explicitly refuse the carried memory, "no source
measures persistent model identity improving accepted outcomes".
*Review:* AC §7.4 — "Both are defensible on the same evidence and the disagreement is about which property
CAP-42 needs. **M2 is right that reachability is separable; M4 is right that carried memory is unsupported.**
Those are compatible."
*Discriminating test:* M2's §9.1 fresh-holder arm — incumbent desk with its carried record against a freshly
bound holder with an empty one, same template version, same window, on a pool neither may write; five
attributable trials per case, chance-corrected, two-consecutive-quarter stopping rule, owner not the subject.
AT calls it the best-specified removal test in the round. Unrun; no runtime.
*Related and unresolved:* AT-M2-02 classes charter persistence **(c) not (d)** and argues it is not a W2
breach because a `Charter` is a record of a standing duty rather than a model identity — while M2's own §11
says that if the founder's five criteria are a closed list, **M2 is inadmissible on the founder's own gate and
should be withdrawn rather than argued**. Those two readings are not reconciled by any review, and the second
is a founder question.

**F-4 · D-01 — attenuation versus inheritance.** *Recorded with a stated limit: I did not read the cross-lane
artifact or the research lanes, so I record only what the five reviews say about this identifier.*
*Position A, specified:* attenuation narrows and does not revoke; `derived ⊆ parent` is decidable and is
checked **by the enforcement point**, not asserted by the delegator. AS records this as shared by all five,
citing R4 F3 and `02` §6.2 P3.
*Position B, measured in the runtime:* four default **inheritance** paths on subagent spawn (R4 F5, cited in
M1's ledger row 29 together with FAL-03 and **D-01**, verified "exact" by AX). M3's claim is that none of the
four "has a subject in M3" because there is no helper — which is a way of avoiding the disagreement rather
than settling it.
*Discriminating tests named:* AS-X-02's required positive control on grant **removal** — a probe skill
declaring a tool grant whose arrival at the enforcement point is a failure — and, for the delivery direction,
M1's `GrantDeliveryReceipt` with a positive control at first use. **AS records the asymmetry as the finding:**
three candidates adopt the positive-control rule for delivery and none applies it to removal, so "a stripping
that silently did not happen is invisible by exactly the same mechanism that made a delivery that silently did
not happen invisible."
*Status:* unresolved, and untestable in this round — no runtime.

**F-5 · Whether AS-X-01 changes AX's five W5 verdicts.** AX judges **W5 sufficient for all five** and records
**no (d) on W3, W5 or W14**; AS raises **AS-X-01 as (d)** against four of five, and it lands on the checker's
delivered inputs, which is W5's subject. The two are not in factual conflict: AX tested the three channels R7
named and found them closed; AS found a fourth that no lane named and AS says so — "**That is what a single
shared source set costs.**" **The dispositions are in conflict and no review owns the reconciliation.**
*Discriminating test, named by AS:* add a fourth F-4 arm in which the acceptance criteria are authored by the
producing path, reported beside the existing three.

**F-6 · Severity of the provider-as-C2-destination gap.** AS classes it **(b)** for M1, M2, M3 and M5 and
**(d)** for M4 — not because M4 is worse but because M4's own derivation forces the contradiction into the
open. AS also tells M3 it **has** the discharging mechanism and denies the claim (AS-M3-04). So one substantive
gap carries three different dispositions in one review, by design. A synthesis that keeps M4's derivation
inherits the (d); one that keeps any other candidate's silence inherits the (b).

**F-7 · M3's abstain threshold — (c) or (d).** M3 classes it (c) and records in its own text that "a reviewer
could reasonably read it as (d)". **AX declines to resolve it** and routes it to the lane owning W1; **AC, the
W1 lane, agrees with M3's (c)** on the ground that it carries a protocol, a unit, a baseline, a stopping rule
and an owner. Recorded as resolved-by-deferral rather than as agreed, because the two reviews reached it by
different routes and neither read the other.

**F-8 · Two of AX's own preserved dissents.** (i) Whether M4's row-7 DIRECT OBSERVATION label is a defect at
all — "a reader may hold that a harness-loaded `CLAUDE.md` is ambient context rather than a declared read, and
that requiring it in a provenance header is pedantry"; AX records the finding and verified the content as
accurate. (ii) Whether AX-ROUND-01 is (b) or (a) — "a reviewer who classes it (a) and edits the five files has
fixed the instance and not the instrument."

**F-9 · A dimension judged sufficient while carrying a blocking finding.** AC judges **M3's W1 sufficient**
— the only candidate completing the unfamiliar job with no agent, skill or route added — "**subject to
AC-M3-01**", which is a (d). AT judges **M3's W7 the strongest in the round** while returning W2 and W8
insufficient. These are not contradictions under §8, which has no aggregate score, but a synthesis reading
the verdict matrix alone will not see them. *(INFERENCE.)*

---

## G. Uniform gaps — findings that land on all five

Ordered by how many reviews independently reach them. **AC's framing applies to every row: a selection cannot
turn on any of these, because no candidate is better or worse on them.**

| # | The gap | Lands on | Found by |
|---|---|---|---|
| **G-01** | **No candidate names a non-model performer for a due obligation past exhaustion.** M1 forbids shedding the due-service minimum, M5 forbids shedding the floors, M4 lets a holder refuse, M2 alerts on a breached minimum, M3 parks the run — "none says who performs the refund on Thursday when the bucket emptied on Wednesday". The rule exists upstream in `07` §6 ("available manual/other-provider paths") and reached none of them | all five | **AE** (E8.3 item 1; findings AE-M1-02, AE-M5-03). AE: "Uniformity across five blind-formed candidates is evidence about the specification's visibility at this layer, not about five authors" |
| **G-02** | **The acceptance criteria are an unblinded channel into the checker and no candidate names their author.** All five close the three channels R7 named — rationale, preferred conclusion, shared record — and none closes the fourth, "because no lane named it" | M1, M2, M4, M5; **M3 exempt structurally** | **AS** (AS-X-01, (d)). **AX did not find it** and returned W5 sufficient for all five — see dissent F-5 |
| **G-03** | **Nobody cites `04-human-operation.md`'s fixed founder-competence mechanism.** Zero hits in all five on the file, on `ParticipationPlan`, `ParticipationEncounter`, `DomainAssessment`, `AuthorityMatrix`, `DecisionPacket`, `GrievanceCase`; each re-derives a return from the research lanes instead. M5 cites `04` once, for the no-answer rule, not for the mechanism. M4 has zero hits on every competence term searched | all five | **AC** (AC-ALL-01, (b)) |
| **G-04** | **Nobody owns X14** — whether the concurrency pin is a provider constraint or a self-imposed policy. All five state the pin blocks F-2; M1 and M4 name the unblocking act as a reviewed `CapacityPlan` revision; M5 names what would settle the prior question, "an account inspection, not an experiment". **Nobody names who does it.** "The round's highest-leverage open question, gating four claim verdicts, ends this step with five agreements that it is open and no owner" | all five | **AE** (E8.3 item 3) |
| **G-05** | **No candidate types the founder-facing transfer except M3**, and M3 only by validating a narrative against a computation. "**Every candidate relies on prose at the boundary to the one reader whose errors are uncorrelated with the family's**", against a measured boundary-marker survival of ~0.57 under compression, in a measurement not conditioned on the receiver being a machine | all five | **AX** (X7; findings AX-M1-01 and the X7 table) |
| **G-06** | **No candidate enumerates what a false entry already influenced.** All five detect and supersede; none reopens accepted outcomes downstream. M5 has the `derived` lineage and does not walk it; M3 states the gap against itself and says the sizing measurement is unrun; M4 concedes it directly; M2's Ref indirection narrows the question without answering it | all five | **AX** (AX-M1-02, AX-M5-01) · **AS** (AS-M3-03) |
| **G-07** | **No candidate prices the cache-lifetime collapse the metered flip causes.** Enabling credits drops the prompt-cache lifetime from an hour to five minutes; only M1 carries the figure at all, and only for a different case. "In every candidate the metered affordance is modelled as a money and policy event and never as the **capacity** event it also is" | all five | **AE** (E8.3 item 2) |
| **G-08** | **Fan-out is bounded only by budget.** Four candidates answer depth only; M3 has no model-to-model delegation but states no width ceiling either. "Fifty sequential consultations, each individually cheap, sits inside one work order's budget and is a fan-out incident — the blast radius is the union of fifty read sets, not the sum of fifty costs." The real containment today is the CP1 concurrency pin, which is a property of the capacity pin and not of any candidate | all five | **AS** (AS-X-04, (b)) |
| **G-09** | **The W6 boundary in all five rests on one unbuilt policy object**, and four name no check on the launcher that is supposed to strip a skill-carried tool grant. Plus the asymmetry: three candidates adopt a positive control for grant **delivery** and none applies it to grant **removal** | all five | **AS** (AS-X-02, (b)) |
| **G-10** | **None of the five queried the contract registry.** Four of AT's nine (d)-class findings exist only because the registry was resolved rather than trusted; "that is a finding about the round's method rather than about any one author" | all five | **AT** (§6 pattern; findings AT-M1-01, AT-M3-01, AT-M5-01 and their (a)-class companions AT-M3-02, AT-M5-02) |
| **G-11** | **Every candidate concedes that creating a capability for genuinely novel work requires a human approver**, all citing the same lane verdicts. "The differences are in what each can do *while* that approval is pending, and only there" — M3 through `unclassified-work/v1`, M5 by effect class, M4 by class-before-kind, M1 and M2 not at all | all five | **AC** (§7.1, the one negative shared by all five) |
| **G-12** | **F-2 at 4× is not executable at CP1 and is reported as owed rather than passed, by all five.** Handled correctly in substance everywhere; two candidates place the disposition badly (AE-M3-02, AE-M5-04) | all five | **AT** (§8 item 9) · **AE** (E5 across five) |
| **G-13** | **FAL-02 is weaker than all five state it.** The cited source reads "DESIGN PROPOSAL. Native job **default**: one launch, ≤360 s", and the same section admits a persistent native profile using `--resume`. "This does not overturn any candidate's design… but the strength of the claim should be reduced wherever Step 5 restates it" | all five | **AT** (§9, class (b)) |
| **G-14** | **Not one quotation in this round has been machine-verified against its source.** Seven of eight lanes report the claim-registration tool absent while the roster declares the grant; AX located the predicted instance — one interval that drifted inside its own lane's summary and was reproduced by all four candidates that cited it | round-level; carried by M1, M3, M4, M5 | **AX** (AX-ROUND-01, AX-M1-03, AX-M5-03) · **AT** (§9, citing M3's own §12) |
| **G-15** | **Every §11 self-audit is strong against protocol §5's ten enumerated examples and blind outside that frame.** AC reaches this against three candidates in identical words — "§11's frame is again narrower than the class it reports on" — and AT reaches it as a method observation: "auditing against a checklist: the checklist is the coverage" | all five | **AT** (§9) · **AC** (§2, §3, §5) |

**Two near-uniform gaps, recorded here because the exceptions matter to a synthesis.**

- **Per-input trust level in the context manifest**, which DIRECTIVE §8.12 names: **present and correct in M1
  and M5**; record-level only in M3; **absent at every granularity in M2 and M4** (AX-M2-04, AX-M4-01,
  AX-M3-01).
- **No metered-path observer**: absent in M2 and M4 (AS-M2-03, AS-M4-04, AE-M2-04, AE-M4-02); present with a
  named observation point in M1 (no cadence, owner or response — AE-M1-03); present with an observer and a
  journal entry in M3 (no response — AE-M3-04); present with an observer **and a response** in M5, correctly
  disclosed as observation not prevention (AS-M5-05, and AE calls it "the round's only real answer to X20").

---

## H. Counts

**All counts are DIRECT OBSERVATION, computed from section B. The merge count in C is INFERENCE.**

### H.1 — Findings by review

| Review | Dimensions | Findings |
|---|---|---|
| A-technical (AT) | W2, W7, W8, W9 | **22** |
| A-company-human (AC) | W1, W11, W12, W15 + responsibility | **26** |
| A-economic-capacity (AE) | W4, W13 | **24** |
| A-context-evidence (AX) | W3, W5, W14 | **14** |
| A-security-adversarial (AS) | W6, W10 | **25** |
| **Total** | | **111** |

### H.2 — Findings by candidate

Cross-candidate findings are counted once in the `X/ALL/ROUND` row and listed again per candidate as
*inherited*, because a synthesis keeping that candidate inherits them.

| Candidate | AT | AC | AE | AX | AS | Own total | Cross-candidate findings it also carries |
|---|---|---|---|---|---|---|---|
| **M1** | 5 | 6 | 5 | 3 | 4 | **23** | AC-ALL-01, AS-X-01, AS-X-02, AS-X-03, AS-X-04, AX-ROUND-01 (6) |
| **M2** | 4 | 6 | 6 | 4 | 3 | **23** | AC-ALL-01, AS-X-01, AS-X-02, AS-X-03, AS-X-04 (5) |
| **M3** | 5 | 4 | 4 | 1 | 4 | **18** | AC-ALL-01, AS-X-02, AS-X-03, AS-X-04, AX-ROUND-01 (4 + 1); **exempt from AS-X-01** |
| **M4** | 4 | 5 | 5 | 2 | 5 | **21** | AC-ALL-01, AS-X-01, AS-X-02, AS-X-04, AX-ROUND-01 (5); AS-X-03's M4 form is its own AS-M4-01 |
| **M5** | 4 | 4 | 4 | 3 | 5 | **20** | AC-ALL-01, AS-X-01, AS-X-02, AS-X-03, AS-X-04, AX-ROUND-01 (6) |
| **X / ALL / ROUND** | 0 | 1 | 0 | 1 | 4 | **6** | — |
| **Total** | 22 | 26 | 24 | 14 | 25 | **111** | |

### H.3 — Findings by class

| Class | AT | AC | AE | AX | AS | Total |
|---|---|---|---|---|---|---|
| **(d)** — blocks | 10 | 10 | 2 | 0 | 6 | **28** |
| **(c)** | 1 | 0 | 7 | 3 | 1 | **12** |
| **(b)** | 1 | 10 | 15 | 9 | 18 | **53** |
| **(a)** | 10 | 5 | 0 | 2 | 0 | **17** |
| negative-control failure, no letter class | 0 | 1 | 0 | 0 | 0 | **1** |
| **Total** | 22 | 26 | 24 | 14 | 25 | **111** |

**Of the 17 (a)-class findings, 5 are recorded as strengths rather than defects** — AC-M1-06, AC-M2-06,
AC-M3-04, AC-M4-05, AC-M5-04. **Two (b)s are likewise not defects against their candidate:** AT-M1-05 (a
drafted finding the reviewer withdrew on verification) and AS-M5-05 (a strength with its limit disclosed).

### H.4 — (d)-class findings by candidate

| Candidate | Own (d) | + cross-candidate (d) | Total blocking (d) | Plus |
|---|---|---|---|---|
| **M1** | 8 — AT-M1-01/02/03, AC-M1-01/02/03, AS-M1-01/02 | AS-X-01 | **9** | — |
| **M2** | 3 — AT-M2-03, AC-M2-03, AE-M2-01 | AS-X-01 | **4** | **AC-M2-01, a §4 control failure that blocks independently**, and M2's own two declared (d)s |
| **M3** | 4 — AT-M3-01/03, AC-M3-01/02 | none (**exempt from AS-X-01**) | **4** | M3's own three open items, one arguably (d) |
| **M4** | 7 — AT-M4-01/02, AC-M4-01/02/03, AE-M4-01, AS-M4-01 | AS-X-01 | **8** | M4's own three declared (d)s |
| **M5** | 5 — AT-M5-01/03, AC-M5-02, AS-M5-01/02 | AS-X-01 | **6** | M5's own two declared (d)s, plus one blocking the evaluation |
| **Total** | 27 | 1 | **28** | |

**No candidate is free of blockers.** AT adds, of its own nine: "every blocker I raised is repairable in
place — none requires a different architecture." No other review makes that claim about its own (d)s.

### H.5 — (d) decisions after merging

| Quantity | Count |
|---|---|
| (d)-class findings | **28** |
| Distinct missing decisions after merging | **24** |
| Merges performed | **4** (MD-01 ×2, MD-02 ×3, MD-07 ×2, and MD-12's (d) with its two (b) forms) |
| Founder decisions under the DIRECTIVE §3 test | **6** — MD-01, 02, 03, 04, 07, 08 |
| Design decisions | **18** |
| …of those, carrying a founder-owned parameter or a conditional founder decision packet | **5** — MD-09, 10, 12, 21, 22 |
| Candidate-declared (d)s, reviewed and not disputed | M2 2 · M3 3 (one arguably (d)) · M4 3 · M5 2 (+1 blocking the evaluation) · M1 2 open items all reviewers agree are **not** (d) |

### H.6 — Negative controls

| Quantity | Count |
|---|---|
| Controls in protocol §4 | 10 |
| Controls applied by at least one review | **10 of 10** |
| Candidate-control cells resolved (pass, fail or split) | **48 of 50** |
| Cells never applied to a candidate — **UNKNOWN, not passed** | **2** — control 4 against M3, and control 4 against M4 |
| **Failures recorded** | **1 outright — AC-M2-01 (control 4, M2), which blocks under §8** |
| Split results | **1 — control 1 against M3**: passes at the mechanism layer, fails at the record layer (AT-M3-02, classed (a)); the disposition is unowned |
| Substance-passed / form-failed | **2 — control 10 against M3 (AE-M3-02) and M5 (AE-M5-04)**, both class (b) |

---

*Consolidation artifact. No candidate is selected, ranked, recommended or accepted here, and no disagreement
between two reviews is resolved. Every row is traceable to a finding id in one of the five Step 4 reviews at
frozen subject `c6d62a3`. The standing caveat in the header applies to every line.*



---

## Amendment, 2026-09-14 — a reporting inconsistency in this consolidation's own matrix (F6C-19)

**SOURCE CLAIM — computed from the matrix above, not from any new reading of a candidate.** Two cells report a
dimension verdict of *sufficient* on a candidate that carries a (d)-class finding on that same dimension.
**M1 on W7 reads `S`** while **AT-M1-02 and AT-M1-03**, both class (d), are recorded against M1 on W7.
**M3 on W7 reads `S²`** — "sufficient (strongest in the round)" — while **AT-M3-03**, class (d), is recorded
against M3 on W2/W7.

**SPECIFICATION — what this note is, and the limit on it.** It records an inconsistency **in the reporting**, and
it is **not** a defect found in any subject and **not** a change to any disposition. **No matrix cell is edited,
no verdict is restated and no finding is reclassified**; the amendment's disposition stands exactly as written,
and it already lists AT-M3-03 among its five open (d)s. A reader who takes the matrix row and the finding list
together gets the correct picture today; a reader who takes the matrix row alone does not, and that is the whole
of the defect.

**UNKNOWN — which of the two the matrix means.** The consolidation does not state whether a dimension verdict
summarises the *blocking* findings only or *all* findings on that dimension, so it cannot be settled here whether
these two cells are wrong or merely under-specified. Resolving it means stating the summarisation rule once and
re-reading every cell against it — a change to this artifact's method, **owed and not done**, owner the
consolidating lane. Until then the finding list governs wherever the two disagree.

*Raised by F6C-19 in [`../reviews/F2-06-C-capacity-reliability-changeability-alternatives.md`](../reviews/F2-06-C-capacity-reliability-changeability-alternatives.md), whose own confidence note reads "High for the counts; the inconsistency reading is mine."*
