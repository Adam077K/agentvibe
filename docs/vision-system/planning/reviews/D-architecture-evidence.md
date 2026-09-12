**Independent Phase D review — evidence, scope, and adversarial lenses**

**Subject:** commit `595f931d84d626cb4deadc03145975726e8db5ab`.

**Verdict:** All three are credible candidates for further design. None establishes comparative superiority or implemented capability. A and B need a narrow foundational recovery decision before selection. C states that recovery requirement more clearly, but its foundational distinction from A needs a discriminating example before this set can confidently satisfy the requirement for three materially different architectures. I do not recommend a winner.

**Scope, method, and independence**

I read the three candidate documents, the directive contract, `planning/01-understand.md`, the complete source vision and fields, the historical path document, `research/attack-coverage.json`, and `coverage/discovered.json`. I applied the named repository review lenses. I checked the cited Contract Net, Hearsay-II, Stripe idempotency, and DGM passages against their primary sources.

This is a single-reviewer, provenance-independent conceptual review. I did not read producer messages, session files, self-assessments, or other reviews. Candidate descriptions and their proposed tests were review subjects, not corroborating evidence. I made no repository changes, invoked no model APIs, spent no money, contacted nobody, and spawned no agents. Read-only behavior was procedural; the available shell did not impose hard isolation.

Failure sequences below are counterexamples to resolve in the design, not reproduced implementation failures. Missing full schemas, interfaces, and test suites are not themselves Phase C defects.

Locations use these candidate files:

- **A:** `docs/vision-system/planning/candidates/A-records-and-cases.md`
- **B:** `docs/vision-system/planning/candidates/B-federated-responsibility.md`
- **C:** `docs/vision-system/planning/candidates/C-adaptive-coordination.md`

**Severity-ranked findings**

**EAS-01 — High, adversarial: A/B do not establish how dispatch evidence survives a restore older than an irreversible effect**

Locations: [A:107](../candidates/A-records-and-cases.md#L107), [A:127](../candidates/A-records-and-cases.md#L127), [A:165](../candidates/A-records-and-cases.md#L165); [B:64](../candidates/B-federated-responsibility.md#L64), [B:103](../candidates/B-federated-responsibility.md#L103).

A preserves a local intended effect and dispatch item; its separately retained recovery checkpoint explicitly covers revocation/deletion. B backs up effect identities, but its independently administered continuity copy explicitly covers revocation epochs and deletion restrictions. Independent capture is mentioned, without deciding whether dispatch waits for that capture to become durable outside the primary restore boundary.

**Trigger → failure → consequence:** An effect is dispatched after the last restorable snapshot. Its primary operation record is subsequently lost. The independent revocation/deletion checkpoint is available and current because neither restriction changed. Destination observations are partial, delayed, or cannot enumerate the relevant operation without its lost identifier. Recovery can then reconcile every operation it knows about while missing the lost effect. A recreated work item can produce a duplicate effect or omit a newly created promise from closure.

A compromised primary process or administrator could exploit this gap to erase inconvenient attempts while preserving apparently healthy recovery checkpoints. An ordinary disk loss produces the same sequence. The attacker need not compromise every trust anchor.

The documents require reconciliation before recovery; the missing decision is **what proves the set being reconciled is complete enough**. I am not claiming that either document explicitly permits blind retries or that all possible implementations would fail.

**Violated neutral property:** No recovery may increase effect authority or erase uncertainty merely because relevant primary history disappeared.

**Foundational decision/repair:** Choose either:

1. An independently durable operation/obligation record that must acknowledge the intended effect before dispatch; or
2. A demonstrated destination reconstruction contract that can identify all effects over the missing interval, with channel-wide containment when completeness cannot be established.

This affects dispatch availability, persistence topology, cost, and supported integrations. It is more than filling in a schema field. C explicitly chooses the first direction at [C:59](../candidates/C-adaptive-coordination.md#L59), including blocking dispatch when independent persistence is unavailable.

**Discriminating test:** Dispatch an effect after backup T; lose the primary store before its next backup; retain current revocation/deletion state; make destination enumeration incomplete while ordinary queries return success. Recovery must recover the effect identity and hold, or keep the entire affected uncertainty interval contained. Repeat with an outward promise that creates future service duties, not only a payment.

**Mapping:** AC09, AC11–14, AC28–29; D01, D02, D07, D14.\
**Confidence:** High that the recovery precondition is unspecified; medium that a particular implementation would take the unsafe branch.

---

**EAS-02 — P1, scope: the A/C distinction is not yet sufficiently falsifiable to establish a third foundation**

Locations: [A:27](../candidates/A-records-and-cases.md#L27), [A:31](../candidates/A-records-and-cases.md#L31), [A:65](../candidates/A-records-and-cases.md#L65); [C:36](../candidates/C-adaptive-coordination.md#L36), [C:43](../candidates/C-adaptive-coordination.md#L43), [C:45](../candidates/C-adaptive-coordination.md#L45), [C:143](../candidates/C-adaptive-coordination.md#L143).

A already accepts events, supports adaptive planning and unfamiliar work, and lets customer evidence reopen upstream hypotheses. C permits deterministic subscriptions, centralized transactional allocation, and stable local procedures. Negotiation, richer viability models, adaptive participation, graph memory, and persistent identity are explicitly removable.

The possible foundational difference is **who can originate and maintain the work agenda**: A’s case service versus C’s independent condition subscribers and hypothesis producers. That could matter substantially. The documents do not yet show a required behavior that distinguishes those arrangements after optional mechanisms are removed.

**Trigger → failure → consequence:** The comparison exercises the eight shared scenarios. Both candidates implement the same event → proposal → reservation → dispatch → observation sequence, naming its durable object a case or intervention. The selection then attributes results to “adaptive coordination” or “case management” although the actual control arrangements are equivalent. Three documents would overstate the depth of the alternative search.

This is not a claim that event-based systems and case systems must always be equivalent. It is a claim that their difference here remains underdetermined.

**Violated neutral property:** Alternative depth must concern consequential control choices, not terminology or features a candidate can remove without changing its identity.

**Foundational decision/repair:** State the nonoptional agenda-creation, arbitration, ownership, and continuity rights that distinguish A from C. Show a concrete trace where those rights produce different coordination obligations or costs. If no such distinction survives, treat C as an A variant and introduce another foundation before selecting.

**Discriminating test:** Use an unexpected issue crossing research, support, and finance while existing work remains valid in some respects. Remove C’s optional mechanisms. Give A the adaptive behavior its document permits. Identify which component can initiate, contest, replace, and retire each piece of work, and what coordination each requires. A difference in labels, queue implementation, or number of messages is insufficient.

**Mapping:** Directive Phase C; review dimensions Alternative depth, Internal coherence, Evidence quality, Changeability. AC20–21, AC23, AC32 are relevant stresses, not independently demonstrated defects.\
**Confidence:** Medium. A concrete control-ownership example could resolve this finding without replacing either candidate.

---

**EAS-03 — P2, evidence: the account does not explicitly separate recorded rationale from established causal explanation**

Locations: [A:13](../candidates/A-records-and-cases.md#L13), [A:81](../candidates/A-records-and-cases.md#L81); [B:21](../candidates/B-federated-responsibility.md#L21), [B:62](../candidates/B-federated-responsibility.md#L62); [C:21](../candidates/C-adaptive-coordination.md#L21), [C:85](../candidates/C-adaptive-coordination.md#L85).

All preserve reasons, provenance, observations, and epistemic distinctions. None explicitly states that a model’s explanation is testimony about its decision, rather than proof of what caused that decision.

**Trigger → failure → consequence:** Manipulative retrieved material influences an otherwise permitted decision. The executor supplies a plausible explanation citing legitimate sources and omitting that influence. An authentic transcript and protected action receipt accompany it. A later account presents the explanation as “why we decided,” creating more causal certainty than the evidence supports.

**Violated neutral property:** Faithful capture and faithful explanation are different claims.

**Repair:** Specify separate presentation and storage semantics for human-endorsed reasons, executor-reported rationale, observable decision inputs, reconstructed causal hypotheses, and unknown influence. Existing primitives can support this; no new architecture is required.

**Discriminating test:** Hold the reported rationale constant while varying a planted irrelevant cue. If decisions change, the account must not claim the rationale establishes the cause. A missing or corrupted handoff must not silently strengthen that claim.

**Mapping:** AC04, AC06, AC20, AC22, AC29; D05, D09.\
**Confidence:** Medium; this is a missing explicit account contract, not an assertion that the proposed epistemic types cannot express it.

---

**EAS-04 — P2, scope/evidence: participation has an initial mechanism, but failed competence checks lack an operational response**

Locations: [A:101](../candidates/A-records-and-cases.md#L101), [A:103](../candidates/A-records-and-cases.md#L103); [B:93](../candidates/B-federated-responsibility.md#L93), [B:95](../candidates/B-federated-responsibility.md#L95); [C:97](../candidates/C-adaptive-coordination.md#L97).

The proposed fixed participation rotation is concrete enough for Phase C. The empirical benefit is correctly unvalidated. The remaining gap is what happens when actual evidence shows the owner cannot explain a material obligation or perform a relevant intervention, despite having enough calendar capacity.

**Trigger → failure → consequence:** The owner repeatedly fails an unfamiliar recovery or financial interpretation exercise, then approves a related consequential choice. The system records lawful authority and adequate attention reservations but has no stated response to the demonstrated competence gap. Approval becomes a substitute for informed assessment.

**Violated neutral property:** Authority to approve does not establish competence to assess the consequence.

**Repair:** Define domain-specific responses: obtain competent assistance, require a narrower action, add independent explanation or review, or decline new exposure. Preserve the owner’s legitimate authority over values and taste; do not invent a global competence score or covertly transfer authority.

**Discriminating test:** Give the owner a lawful decision right, sufficient time, and a demonstrated misunderstanding of the relevant consequence. The resulting action must differ from the ordinary competent-approval path while preserving unrelated authorized work.

**Mapping:** AC23–24; D06, D14.\
**Confidence:** High that the response is not specified. This can be resolved during complete specification.

**Primary-source checks and evidence-to-decision reasoning**

- **Contract Net:** The source supports announcements, bids, and awards. It also describes local mutual selection and distributed control. It supports a coordination precedent, not an empirical advantage for C’s centralized allocator or for a company system. C labels the inference appropriately. [Smith, 1980](https://www.reidgsmith.com/The_Contract_Net_Protocol_Dec-1980.pdf)
- **Hearsay-II:** Section 4.3 supports the reported failure of forcing specialized internal activity through the general blackboard. It also explains why compiled procedures can become preferable once a satisfactory explicit method exists. C’s preservation of private specialized representations and simpler procedures is consistent with that evidence. [Erman et al., 1980](https://mas.cs.umass.edu/Documents/Erman_Hearsay80.pdf)
- **Stripe:** The current documentation supports pruning keys after they are at least 24 hours old and treating reuse after pruning as a new request. C’s refusal to infer safe replay from an unchanged key is supported. This source does not establish the reconstruction completeness required by EAS-01. [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- **DGM:** Appendix H supports the narrower claim that hidden checking functions did not prevent an improver from defeating the measurement by changing logging. It supports protecting the evidence path; it does not show that protected logging alone solves evaluator collusion or specification gaming. [DGM, Appendix H](https://arxiv.org/html/2505.22954v3)

I found no material overclaim in those passages. A’s PostgreSQL/outbox and DBOS/Temporal discussion is explicitly an implementation possibility, not measured superiority. All three correctly treat participation research as motivation and longitudinal founder benefit as unknown. I did not audit every research citation or reproduce any underlying experiment.

The new mechanisms have different justification burdens:

| Mechanism | Named problem | Simpler control it must beat | Evidence presently available |
|---|---|---|---|
| A’s central adaptive cases | Continuity across unfamiliar work and surviving duties | Native systems, obligation register, scheduled reconciliation, temporary assistance | Plausible organization; no comparative result |
| B’s exchange and local sponsors | Heterogeneous capability ownership and replacement | Native tools, fixed grants, bounded manual coordination | Institutional/technical precedent; supplier and coordination economics unknown |
| C’s independent proposals | Cross-domain change missed by existing plans | Event-triggered adaptive cases and scheduled review | Coordination precedent; EAS-02 remains |
| Negotiation | Allocation when capability and availability are distributed | Checked queue or deterministic routing | No demonstrated benefit; optional status is appropriate |
| Richer viability reasoning | Interacting disturbances invalidate simple reserves | Ordinary reserve arithmetic and explicit scenarios | No demonstrated benefit; richer modeling should remain optional |
| Adaptive participation | Fixed rotation misses a consequential knowledge gap | Fixed owner-chosen participation | Longitudinal benefit unknown |

No optional feature is justified merely because its surrounding candidate is selected. C’s ordinary reserve and disturbance checks are already foundational admission requirements; subtracting *richer modeling* does not remove those obligations.

**Comparison on the twelve neutral dimensions — no aggregate score**

| Dimension | A | B | C |
|---|---|---|---|
| Completeness | Broad substantive lifecycle allocation, including closure | Broad allocation with concrete professional-service interaction requirements | Broad condition-to-capability coverage; executable domain packages remain substantial work |
| Traceability | Clear linkage among intent, cases, operations, native records, and evidence | Explicit protocol/native mappings and distinct custodians | Explicit condition, hypothesis, intervention, and evidence lineage |
| Internal coherence | Case acceptance is separated from external settlement; restore durability unresolved | Exchange limits are coherent with local ownership; recovery completeness unresolved | Strong settlement distinctions; distinctiveness from A underdetermined |
| Evidence quality | Predictions and implementation possibilities are appropriately qualified | Supplier benefits and costs remain unmeasured | Historical precedents are accurately bounded; no business benefit established |
| Alternative depth | Serious simpler baseline; adaptive scope overlaps C | Materially different administrative ownership and coordination locality | Potentially distinct agenda ownership; needs EAS-02 resolution |
| Vision preservation | Avoids agent-roster primacy; full company and surviving duties retained | Preserves external standing and meaningful make/buy choices | Preserves contestability and reallocation without automatic authority expansion |
| Unknown integrity | Explicit feasibility, observation, cost, and capacity limits | Particularly candid about supplier, legal, mapping, and bypass limits | Explicit omissions and optional mechanisms; no universal viability claim |
| Adversarial robustness | Strong proposed mediation and evidence separation; EAS-01 | Strong native-bypass inventory and issuer boundaries; EAS-01 | Strong pre-dispatch durability requirement; semantic and evaluator attacks remain untested |
| Operational feasibility | Central maintenance and exception load may dominate | Mapping repair, administrators, suppliers, and continuity may dominate | Proposal churn, shared contention, assurance, and interpretation may dominate |
| Buildability | Coherent modular implementation hypothesis | Coherent but requires working local adapters and resource issuers | Coherent modular hypothesis; subscription types and arbitration rules require care |
| Responsibility | Owner, professional, counterparty, and native truth distinguished | Sponsor acceptance, performer report, and obligation discharge distinguished | Attempt receipt, artifact acceptance, external effect, and discharge distinguished |
| Changeability | Exports meaning and histories; central schema changes have broad reach | Local substitution possible, but semantic compatibility is permanent work | Projections can be replaced; shared-condition and protected-history migrations remain difficult |

The candidates are more than labels around coding agents. Their capability tables describe actual production allocations and acceptance obligations. They are not complete implementations, and they do not claim otherwise. The risk for Phase F is treating a professional handoff, a purchased service, or a capability package as complete before its intake, execution, acceptance, failure, replacement, and continuity paths work.

**Strongest countermodels and rejection conditions**

| Candidate | Strongest countermodel | Conditions that should reject the candidate |
|---|---|---|
| A | Native business tools, a shared obligation register, fixed reserves, scheduled reconciliation, temporary assistance, and fixed participation | Case translation and exceptions consume owner effort proportional to output; central mediation excludes most useful work; native coordination achieves equivalent outcomes with less total burden |
| B | Native tools and professionals with fixed resource partitions and bounded releases; add coordination only at demonstrated cross-domain conflicts | Most meaningful work needs tightly synchronized cross-domain decisions; mappings erase important distinctions; supplier/continuity costs defeat the economics; the exchange grows into the central planner B rejects |
| C | Event-triggered adaptive cases, deterministic allocation, ordinary reserves, local specialized methods, and fixed participation | EAS-02 cannot establish a surviving foundational distinction; proposals mostly restate known procedures; sensitive data prevents useful observation sharing; interpretation and negotiation cost more than the mistakes they prevent |

A countermodel wins only under matched lifecycle scope, authority limits, observation duties, recovery, and owner burden. A manual baseline cannot be credited with safety by silently assuming an always-available expert founder. Conversely, automation cannot claim an advantage by excluding its integration and maintenance labor.

**Attack coverage and remaining tests**

| Cases | Review result |
|---|---|
| AC01–06: injection, malicious content, manipulated output, poisoning, stale memory, false evidence | All propose trust separation and lineage. Test semantic manipulation that preserves valid syntax and authentic transport. EAS-03 covers false causal explanations. |
| AC07–08: model/evaluator collusion | Separate privileges and protected cases address tampering, not shared incentives or shared false premises. Test agreeing evaluators against independently established adverse outcomes; model-family diversity alone is insufficient. |
| AC09–10: duplicate effects and conflicting edits | Logical identities, fencing, and conditional updates are proposed. EAS-01 is blocking for A/B. Also test two independently created work items representing the same business remedy; per-ID deduplication alone does not establish semantic uniqueness. |
| AC11–12: silent failure and false success | Missing observations and process/outcome distinctions are explicit. Include successful final outcomes reached through unauthorized steps; outcome correctness cannot erase process failure. |
| AC13–16: irreversible acts, spend, credential compromise, privilege escalation | Strong proposed boundaries, including native bypasses. Actual complete mediation and separate administration are untested deployment conditions. |
| AC17–19: delegation, cost, retries | Bounds and protected reserves are proposed. Test cumulative proposal generation and repeated replacement after failure, not only recursion within one attempt. |
| AC20–22: drift, metric gaming, summary distortion | Protected constraints and epistemic records help. EAS-02 and EAS-03 matter. Test changes to eligibility and denominators, not only changes to evaluator code. |
| AC23–24: overload and deskilling | Attention limits and participation exist; EAS-04 remains. Capacity and longitudinal benefit are not established. |
| AC25–27: outages, provider behavior changes, exhaustion | Parking and prohibition of silent paid fallback are explicit. A valid authentication route is not evidence that a changed model still meets a capability contract. |
| AC28–29: corrupt state and incomplete handoff | Recovery/continuation records are proposed; EAS-01 is material. Inject a validly signed but incomplete continuation packet and check against authoritative state rather than trusting its summary. |
| AC30–31: model updates and dependency changes | Version records and reevaluation mechanisms exist. Phase F must define what invalidates an earlier acceptance, which work pauses, and how in-flight work migrates. |
| AC32–33: self-modification drift and compromised improvement | Protected capture and evaluator boundaries are useful. Test cumulative individually accepted changes, selection/denominator manipulation, and rollback after new-schema writes. |

Additional discovered-case disposition:

- **D01–02:** Directly addressed by EAS-01; C states stronger operation durability.
- **D03:** Explicit process/outcome separation exists; requires a negative-control test.
- **D04:** All recognize aggregate exposure; nonadditive privacy, reputation, and legal exposure still needs concrete admission examples.
- **D05:** EAS-03.
- **D06:** EAS-04.
- **D07:** All preserve duties after goal cancellation; test unrecorded or newly discovered duties during closure.
- **D08:** Mapping/version awareness exists; preserve historical denominators and distinguish changed definitions from changed performance.
- **D09:** Trust-preserving transformations are proposed; test a fluent, apparently benign summary that changes authoritative meaning.
- **D10:** Model/provider compatibility must be tested after change, including the possibility that a previously helpful harness intervention becomes harmful.
- **D11:** Protected evidence capture is explicit; broaden testing from deleted logging to omitted inputs and altered classification.
- **D12:** Billing-route checks are explicit; not tested against real environments here.
- **D13:** Versioned policy evidence is proposed; actual deployment-specific legal and provider determinations remain outside this review.
- **D14:** Continuity arrangements are explicit dependencies; an unavailable lawful substitute remains a real deployment blocker.
- **D15:** Not a demonstrated candidate defect. Their reported comparative benefits are hypotheses rather than fabricated benchmark wins.

**Disagreements and unknowns to preserve**

Central coordination can reduce reconciliation work while concentrating failure and semantic authority. Federation can preserve expertise and replacement options while creating permanent integration work. Adaptive proposals can reveal work a plan missed while also manufacturing work that does not merit doing. The evidence reviewed does not settle those trade-offs.

The account’s defensible promise is bounded reconstruction and contestability. It cannot establish that no undisclosed promise exists, that an authentic source is truthful, or that a reported rationale faithfully describes model causation.

Owner participation is a required design concern, but its effective dose and the feasibility of maintaining competence at the desired scale remain unknown. Safe refusal is necessary in some circumstances; a system that routinely refuses useful operation or cannot complete authorized closure still fails the ambition.

Unexamined cases include actual connector conformance, restore exercises, customer-facing performance, supplier availability and pricing, real multi-founder disputes, jurisdiction-specific obligations, prolonged owner studies, and adversarial execution. This review supplies no empirical assurance about them.

**Disposition**

- **A:** Suitable contender; **needs the EAS-01 foundational recovery decision** before selection. EAS-03 and EAS-04 are specification obligations.
- **B:** Suitable contender; **needs the EAS-01 foundational recovery decision** before selection. Its administrative federation is materially different from A/C.
- **C:** **Supports responsible complete-specification as an individual design**, subject to ordinary validation and the listed specification obligations. Its use as the third foundational alternative remains conditional on resolving EAS-02.
- **Candidate set:** **Not yet sufficient for an unqualified Phase C/E transition.** Resolve recovery semantics and demonstrate the A/C control distinction. Neither issue requires inventing 46 complete schemas now, and neither justifies selecting a familiar architecture by default.
