> Archival provenance — 2026-09-12: This separate builder/scribe turn preserves the completed read-only reassessment below verbatim, with this note as the only addition. Archival base: `7215adc6119accc62ab853b3c0a7893d05f2d611`; reassessment subject: `86bb9ef84a1f3d91d3c0123586c6f322c470eaf0`; prior subject: `e7530ff2c9458920c0374551508d8e47c5f30fb7`. This archival turn has repository write access; the judgment used procedural read-only restrictions, not hardened isolation. Archival supplies no new review judgment, runtime test, deployment clearance or Phase G acceptance. Navigation: [kernel](../specification/01-contract-kernel.md), [authority/recovery](../specification/02-authority-recovery.md), [company capabilities](../specification/03-company-capabilities.md), [human operation](../specification/04-human-operation.md), [capability catalog](../specification/capabilities.json), [original FIR report](F-integration-01.md). These links open checkout versions; cited line numbers refer to the frozen reassessment subject.

**FIR reassessment — 2026-09-12**

**Subject:** `86bb9ef84a1f3d91d3c0123586c6f322c470eaf0`, including repair `845a29b`. Original reviewed subject: `e7530ff2c9458920c0374551508d8e47c5f30fb7`.

**FIR-01–04 are closed at specification level.** The repairs introduce one new medium integration defect, FIR-05, in the launch acceptance mapping. The corrected subset therefore still needs that bounded correction before it can be treated as a consistent conformance contract. This is not Phase G acceptance.

I examined the changed normative contracts and their connections to unchanged 01–04/catalog definitions, using the original findings and discriminating checks. I did not consult specification authors or rely on author self-assessment. This judgment involved no repository writes, runtime tests, deployed configuration inspection, model invocation or spending. Read-only restrictions were procedural, not hardened isolation. My previous authorship of N01 and the substrate source audit remains disclosed; this reassessment does not independently validate those sources or their runtime composition.

All paths below are beneath `docs/vision-system/planning/specification/`; line numbers refer to the frozen reassessment subject.

**Original finding dispositions**

| Finding | Disposition and contract evidence | Remaining discriminating obligation |
|---|---|---|
| **FIR-01 — Pre-sale capacity route requires a sale** | **Closed at specification level.** `capabilities.json:5394–5399` now routes the seed to `company.delivery_capacity.verify.v1`. Its explicit inputs and outputs at `7416–7458` require no SalesAgreement. The procedure specifies actual acknowledgment, authorized rehearsal, independent acceptance, verified/constrained/unavailable results and replacement behavior at `7467–7476`. `03-company-capabilities.md:87` connects this procedure to pre-sale readiness and leaves actual customer fulfillment with CAP-30. | With no sales, actual performer/access/material/continuity evidence can establish bounded capacity. Missing acknowledgment or an unavailable alternate cannot. Changing the performer, window or dependency invalidates affected readiness while unrelated preparation continues. These behaviors remain unexecuted. |
| **FIR-02 — Pilot pricing conflicts with actual-demand acceptance** | **Closed at specification level.** `PriceProposal` now separates evidence basis and acceptance scope at `capabilities.json:296–304`. CAP-18’s substantive acceptance at `2281–2285` distinguishes internal provisional, bounded validation, demand-supported offer and scale recommendation. Validators at `7396–7401` bind those scopes to appropriate state, actual authority and demand evidence. `03-company-capabilities.md:81` preserves unknown costs and prevents an unvalidated pilot from establishing demand or scale readiness. | Empty genuine observations permit an honest provisional price and an explicitly authorized bounded pilot, but cannot pass a demand-dependent decision. Removing actual capacity, readiness or the limited grant still prevents the pilot. A later supported recommendation requires applicable evidence and a current judgment, not a relabeled earlier hypothesis. |
| **FIR-03 — RecoveryFrontier incorrectly used as a record Ref** | **Closed at specification level.** `RecoveryPacket.frontier_evidence_refs` now points to Observations (`capabilities.json:541–549`). The binding at `7274–7277` explicitly makes RecoveryFrontier a fresh signed query response, with exact historical bytes captured as ArtifactVersion/Observation evidence. CAP-37 requires a fresh nonce-bound query and refuses saved evidence as current authority (`4014–4028`). `03-company-capabilities.md:125` preserves the same distinction. | Round-trip the historical response with its nonce, request/time and verification evidence. After a later release or generation change, that retained response remains inspectable but cannot authorize recovery. An unavailable current witness must not be replaced by a historically valid signature. |
| **FIR-04 — Inconclusive/disputed verdicts lack canonical meanings** | **Closed at specification level.** `01-contract-kernel.md:256–257` now defines inconclusive and the relevant reassessment/invalidation transitions. Line `263` separates completed assessment from subject acceptance and makes disputed a presentation label for contested. `evidence.decide` includes the revised states at `278`. Company treatment at `03-company-capabilities.md:85` and CAP-11’s revised acceptance contract preserve these distinctions. | A completed inconclusive assessment must remain different from unfinished, rejected and contested assessment. New evidence must follow a listed reassessment transition. Neither an inconclusive subject nor an accepted report whose proposition is “evidence is insufficient” can satisfy the subject’s product/capacity/launch criterion. |

These closures concern the original semantic gaps. They do not establish that actual performers are available, that demand exists, that a recovery deployment works or that an evaluator implements the states correctly.

**FIR-05 — Medium: one launch acceptance reference is required to match several distinct subjects**

Evidence:

- `capabilities.json:228–237` gives LaunchReadiness one `acceptance_ref: Ref<AcceptanceRecord>`, alongside separate offer, formation, fulfillment-capacity and support-capacity references.
- `capabilities.json:205–213` gives AcceptanceRecord one `subject_ref: Ref<Record>`.
- The new validator at `capabilities.json:7411` requires that singular acceptance reference to resolve to a current accepted judgment “on each exact required launch/product/capacity subject and predicate.”
- `01-contract-kernel.md:263` requires dependent acceptance to match the exact required subject/version and predicate.

**Trigger → failure → consequence:** An ordinary launch has different product, delivery-capacity and support-capacity records, each with its own valid assessment. The singular referenced judgment cannot have all those distinct records as its singular exact subject. Literal implementation rejects a properly supported launch. A permissive implementation must invent a composition rule, potentially treating a generally accepted launch report as sufficient despite an absent or stale capacity judgment.

This is a new join introduced by the repair, not a request to finish unrelated schemas. The repair deliberately strengthened exact-subject matching; the launch representation now needs to express how that matching applies to multiple prerequisites.

**Strongest countermodel:** The intended `acceptance_ref` may point to a composite launch judgment whose predicate is the conjunction of the necessary product and capacity judgments. That is a reasonable design. The current clause does not specify that interpretation, the child-judgment bindings or their required revalidation. It instead says the referenced judgment itself must be on each exact subject.

**Required resolution:** Define the acceptance mapping explicitly. It may use separate subject/predicate judgment bindings or a composite launch judgment with an explicit dependency contract. In either form, identify which exact product, fulfillment-capacity and support-capacity versions and criteria must be accepted, and how current validity is checked. An accepted general report cannot substitute for a missing prerequisite judgment.

**Discriminating checks:**

- Distinct product, delivery and support subjects, with every required current judgment, permit the authorized launch.
- An otherwise accepted launch report with one missing or inconclusive capacity judgment does not.
- Revoke or replace only the support-capacity evidence after composite assessment but before release: the old aggregate acceptance cannot authorize the affected launch.
- A newer unrelated record or genuinely disjoint venture does not cause an unexplained global rejection.

**Dimensions affected:** Internal coherence, buildability, traceability, evidence quality and operational feasibility.

**Composed-path assessment and retained limits**

The first-venture path now has a specified pre-sale capacity procedure and a legitimate unknown-demand pricing branch. Neither needs a fabricated customer agreement. Actual sale, payment conditions, usable delivery and remaining service duties retain their separate meanings. FIR-05 concerns assembling their prerequisites into launch acceptance.

Recovery now distinguishes retained historical frontier evidence from a fresh authority response. The corrections do not erase unknown refund effects, release held entitlement capacity or discharge a grievance through recovery status alone. Actual substitute performance, funded remedies and continuing custody remain required.

The authority/recovery and human-operation files are unchanged between these subjects. Their previously reviewed narrow witness, transport, authority, attention and competence claims remain in place; they have not acquired runtime validation through this reassessment. Destination-clean context still requires the binding approved claim/content-form constraints and appropriate actual disclosure authority.

I did not expand this reassessment into unfinished 05–08 work, the complete schema/component matrix, priced BOM, coverage or empirical acceptance. Those obligations remain at their proper gates.

**Disposition:** FIR-01–04 are conceptually resolved in the specification; retain their unexecuted conformance checks. Correct FIR-05 before freezing the affected launch acceptance interface. No aggregate score, foundation-selection verdict, deployment clearance or Phase G acceptance is supplied.
