> Archival provenance — 2026-09-12: This separate builder/scribe turn preserves the completed read-only FIR report below verbatim, with this note as the only addition. Archival base: `0bc3ab2ac9831d56a89904e360e5f883d2e281f5`; the review subject remains `e7530ff2c9458920c0374551508d8e47c5f30fb7`. This archival turn has repository write access; the review used procedural read-only restrictions, not hardened isolation. No new review judgment, runtime test, deployment or Phase G acceptance is supplied by archival. Navigation: [kernel](../specification/01-contract-kernel.md), [authority/recovery](../specification/02-authority-recovery.md), [company capabilities](../specification/03-company-capabilities.md), [human operation](../specification/04-human-operation.md), [capability catalog](../specification/capabilities.json), [frozen G protocol](G-acceptance-protocol.md). These links open the checkout versions; all cited line numbers refer to the frozen review subject.

**Phase F integration review — 2026-09-12**

**Subject:** `e7530ff2c9458920c0374551508d8e47c5f30fb7`.

The reviewed contracts need four bounded integration corrections. These concern promised behavior and canonical meanings already selected here; they are not complaints that later implementation tracks remain unfinished. I found no new basis in this review to require replacing S1’s foundation. This is **not Phase G acceptance**.

I reviewed `01-contract-kernel.md`, `02-authority-recovery.md`, `03-company-capabilities.md`, `04-human-operation.md` and `capabilities.json` against the directive, original vision framing and frozen G protocol. References below use the frozen subject’s line numbers; paths are beneath `docs/vision-system/planning/specification/`.

This was read-only, with procedural restrictions rather than hardened isolation. I did not consult current specification authors before forming the judgment, use their self-assessments, execute runtime tests or inspect deployed configuration. I previously authored N01 and the substrate source audit. Their incorporation is disclosed provenance, **not independent validation of my own evidence or of the composed system**.

**Findings — all medium severity, requiring resolution before these interfaces can claim conformance**

**FIR-01 — The declared pre-sale capacity route requires an existing sale**

Evidence:

- `capabilities.json:5384–5389`: the `DeliveryCapacity` seed creates only `proposed`, says admission requires `verified`, and routes next to CAP-30.
- `capabilities.json:3320–3342`: CAP-30 requires a `SalesAgreement`, `DeliveryCapacity` and workflow; its outputs are fulfillment and acceptance, not a verified capacity record.
- `capabilities.json:7282–7289`: verified delivery/support capacity precedes the ready pilot offer and first commerce.
- `03-company-capabilities.md:17–21` explicitly says launch does not require an earlier sale and that seed factories supply otherwise unexplained inputs.

**Trigger → failure → consequence:** A first venture has actual willing performers, materials, a service procedure and verification evidence, but no customer agreement. Its capacity seed routes to a procedure requiring that agreement. Following the declared route cannot establish the prerequisite for making the first offer. An implementer must add an undeclared pre-sale assessment branch, invent an agreement or bypass the verified-state boundary.

The existing validator at `capabilities.json:7385–7386` supplies useful substantive criteria. It does not identify the promised pre-sale procedure, its result or the transition establishing that state. Generic CAP-11 assessment may be intended, but that relationship is not the declared seed route.

**Required resolution:** Bind a pre-sale capacity assessment to its actual inputs, responsible acceptance authority, output and `proposed → verified` transition. It must work without a customer agreement and must not count proposed availability as demonstrated capacity.

**Discriminating check:** Starting with no sales, verified real performer/access/material evidence can establish bounded delivery capacity; missing acknowledgment cannot. Subsequently removing the performer invalidates dependent launch readiness while unrelated research continues.

**Dimensions:** Buildability, internal coherence, completeness, operational feasibility, vision preservation.

---

**FIR-02 — Pilot pricing permits unknown demand in one contract and requires actual demand in its acceptance predicate**

Evidence:

- `03-company-capabilities.md:17–19` permits unknown demand and an explicitly authorized pilot whose commercial hypothesis remains unvalidated.
- `capabilities.json:7271–7284` carries empty observations and explicit uncertainty into provisional pricing and pilot readiness.
- `capabilities.json:2256–2257` permits a narrower experiment under an existing grant.
- But `capabilities.json:2275–2277` requires the accepted price recommendation to use “actual demand and complete declared costs.”
- `capabilities.json:5293–5297` requires an **accepted** `PriceProposal` to seed the offer.

**Trigger → failure → consequence:** An authorized first pilot has a bounded loss allowance, actual delivery/remedy resources, attributable estimates and no observed demand. The narrative allows it, but its required pricing acceptance predicate does not distinguish it from an evidence-backed commercial recommendation. One implementation refuses the pilot; another treats an empty demand set or estimated costs as satisfying “actual demand.”

This is a conflict in acceptance meaning, not a demand for successful empirical results before experimentation. It also does not establish that every first venture is blocked: one with adequate prior customer evidence can follow the ordinary path.

**Required resolution:** Specify the distinct acceptance conditions for a bounded price experiment and a demand-dependent commercial or scale decision. Preserve actual financial authority and capacity requirements in both. Empty evidence must remain empty.

**Discriminating check:** The unknown-demand pilot proceeds under its exact experimental authority and remains labeled unvalidated. The same evidence cannot establish demand validation or justify a demand-dependent scale decision. Removing the pilot’s real reserve or delivery capacity still blocks the offer.

**Dimensions:** Internal coherence, unknown integrity, evidence quality, vision preservation, buildability.

---

**FIR-03 — RecoveryPacket requires a canonical record reference to something expressly defined as a query response**

Evidence:

- `capabilities.json:538–540` defines `RecoveryPacket.frontier_refs` as `Ref<RecoveryFrontier>[]`.
- `01-contract-kernel.md:54` and `77` define `Ref` as an exact immutable record revision.
- `02-authority-recovery.md:170–172` defines `RecoveryFrontier` as a nonce-bound signed query response over R’s durable ledger, explicitly distinguishing it from an ordinary record.
- `02-authority-recovery.md:174–176` requires current frontier/proof lookup and distinguishes immutable proof from current generation status.

**Trigger → failure → consequence:** CAP-37 captures the current signed frontier during recovery. Its required domain packet cannot represent that response using the canonical reference contract. An implementer must invent a frontier record identity/lifecycle or introduce an undeclared evidence wrapper. Treating a stored snapshot reference as the current frontier would additionally obscure the freshness requirement.

The technical contract already rejects stale frontier reuse. I am **not** claiming this type mismatch itself defeats that guard. It prevents the two specified interfaces from composing without an additional decision.

**Required resolution:** Specify how the signed response and its nonce, snapshot identity, verification evidence and observation time enter the recovery packet. Separate retained historical evidence from the fresh query required for activation; do not create a competing frontier authority.

**Discriminating check:** A packet round-trips the exact captured response without fabricating `Ref.record_type` semantics. Replaying that packet after a later release or generation seal cannot satisfy current recovery activation, although it remains usable historical evidence.

**Dimensions:** Internal coherence, traceability, buildability, changeability, adversarial robustness.

---

**FIR-04 — The quality procedure promises verdicts absent from its canonical judgment contract**

Evidence:

- `capabilities.json:1582` promises accepted/rejected/**inconclusive/disputed** verdicts.
- `capabilities.json:7182–7186` binds `AcceptanceRecord` to `EvidenceJudgment`, using its canonical state and explicitly allowing no independent verdict field.
- `01-contract-kernel.md:238` rejects unlisted state transitions.
- `01-contract-kernel.md:256` permits proposed/accepted/contested/rejected, with later stale/withdrawn states.
- `01-contract-kernel.md:275` permits accepted/contested/rejected decisions.

**Trigger → failure → consequence:** An independent assessment finishes properly but cannot determine whether the subject meets its criteria. CAP-11 owes an inconclusive outcome, while the canonical write contract has neither that state nor a defined mapping. Leaving it `proposed`, rejecting the subject, marking it contested or accepting a proposition about uncertainty have different downstream meanings.

“Disputed” may map straightforwardly to “contested,” but the mapping is not stated. Inconclusiveness particularly needs to remain distinguishable from a failed subject and an unfinished assessment.

**Required resolution:** Define the canonical representation and allowed transitions for these outcomes, including the difference between completing an assessment and accepting its subject. Keep missing evidence from becoming a pass.

**Discriminating check:** A completed inconclusive assessment is reconstructible and can receive further evidence without being counted as subject acceptance. A confirmed defect, unresolved contradictory evidence and a clean pass remain distinguishable to Case acceptance, launch readiness and the owner account.

**Dimensions:** Evidence quality, internal coherence, unknown integrity, traceability, buildability.

**Whole-company traces**

| Trace | Supported composition and remaining limitation |
|---|---|
| First-venture discovery and preparation | Endorsed intent, bounded inquiry and honestly empty observations are permitted. Research need not fabricate customers. FIR-01 and FIR-02 interrupt the specified transition from preparation to a ready first offer. |
| Actual sale and delivery | Once valid readiness exists, exact offer acceptance, payment conditions and fulfillment remain separate. `03-company-capabilities.md:87–95` and CAP-15/CAP-30 require actual usable delivery before complete sales-outcome acceptance. A packet, provisioned account or partial receipt does not automatically satisfy the journey. |
| Support and finance | Support retrieves the sold version and actual problem; refund identity follows entitlement and previous unknown effects. Journals do not establish bank settlement or retrospective authority (`03-company-capabilities.md:33–45`, `93–103`). These are substantive domain distinctions rather than generic “done” labels. |
| Closure with unknown refund, absent owner/supplier and grievance | New liabilities stop while the refund hold, surviving duties and individual grievance remain. Accepted substitutes must actually perform or obtain legitimate disposition; truthful incapacity is explicitly a failed operating outcome (`03-company-capabilities.md:117–132`). FIR-03 affects the recovery packet, and FIR-04 affects uncertain assessment results. Actual substitute/channel implementation remains a later-track and deployment obligation. |

**Preserved strengths and enforcement limits**

The canonical bindings generally prevent duplicate authority: Party/Principal, Intent/IntentVersion, Operation/OperationIntent and the human ActorBinding projection are explicitly related. The findings above identify remaining joins, rather than rejecting that consolidation.

The witness protocol separates committed business content, receipt creation and response assembly. Primary rows cannot authorize dispatch; status reconstruction cannot renew an attempt. Potential duties and unknown holds survive interrupted acknowledgment and primary loss. These are useful specified safeguards, not executed durability results.

The transport contract now names **kernel-buffer admission at the forwarding hook**, preserves downstream buffering and partial-request uncertainty, and discloses its clock/root assumptions. It does not claim provider acceptance by the cutoff or protection against an instantaneous violation of the admitted clock root. I found no new substrate impossibility established by these passages.

The human contract distinguishes lawful authority, factual competence and personal values. It supplies a changed operating path for material misunderstanding, permits contestation, reserves actual attention and requires capable continuity. Its learning schedule remains a proposed intervention with longitudinal uncertainty; attendance is not competence evidence.

One important **existing conformance obligation**, rather than a new finding: destination-clean context cannot by itself prevent invented claims or promises. The binding TF1 §5 also requires approved claim/content forms. Later communication adapters must preserve that restriction when implementing `02-authority-recovery.md:288–293` and CAP-16. A malicious clean-context output promising unlimited service should be paired with a legitimate routine reply; rejecting every reply would fail useful service. Human review, where necessary, must count toward the operating burden.

**Scope and disposition**

These findings require explicit contract correction and discriminating fixtures. None is closed by adding links, increasing schema coverage counts or asserting that a later implementer will interpret the intended meaning.

I did not assess unfinished 05–08 contracts, the complete schema/component matrix, priced BOM or final coverage. Their expected absence is not a finding here. Deployment independence, native isolation, provider availability, actual professional capacity, sustainable founder burden and longitudinal competence remain unverified.

S0 and EAS-R1’s distinct rights, business-effectiveness, representation and simpler-policy comparisons remain required at their proper gate. This review supplies neither evidence of S1’s comparative superiority nor a reason to change those comparators.

**Disposition:** continue Phase F with these four integration corrections. The reviewed subset is not yet internally consistent enough to freeze as a conformance contract. No aggregate score, whole-plan acceptance, runtime clearance or new foundation-selection verdict is given.
