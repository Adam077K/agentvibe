> Archival provenance — 2026-09-12: This separate builder/scribe turn preserves the completed read-only FIR-05 recheck below verbatim, with this note as the only addition. Archival base: `e8e0d54e2b7186676289f9301163b3a54c2d8314`; recheck subject: `ef676def08e4074cfa2d5db812039b3c5cbf2255`; prior reassessment subject: `86bb9ef84a1f3d91d3c0123586c6f322c470eaf0`. This archival turn has repository write access; the judgment used procedural read-only restrictions, not hardened isolation. Archival supplies no new review judgment, runtime test, deployment clearance or Phase G acceptance. Navigation: [kernel](../specification/01-contract-kernel.md), [authority/recovery](../specification/02-authority-recovery.md), [company capabilities](../specification/03-company-capabilities.md), [human operation](../specification/04-human-operation.md), [capability catalog](../specification/capabilities.json), [prior reassessment](F-integration-02.md). These links open checkout versions; cited line numbers refer to the frozen recheck subject.

**FIR-05 recheck — 2026-09-12**

**Subject:** `ef676def08e4074cfa2d5db812039b3c5cbf2255`, including repair `2c7a4a3`. Previous reassessment subject: `86bb9ef84a1f3d91d3c0123586c6f322c470eaf0`.

**FIR-05 is closed at specification level.** The repair supplies an explicit mapping from each required subject and predicate to its own judgment. I found no new contradiction in the changed contracts and adjoining acceptance/release rules examined. FIR-01–04’s prior specification-level closures remain intact. This is a disposition of the corrected subset, **not Phase G acceptance**.

This was a separate read-only judgment without author consultation or reliance on author self-assessment. I inspected frozen diffs, definitions, procedure inputs and adjoining invariants. No repository writes, runtime tests, deployed configuration inspection, model invocation or spending occurred. Independence was procedural, not hardened isolation. My prior authorship of N01 and the substrate source audit remains disclosed; their runtime claims were not independently validated here.

Paths below are beneath `docs/vision-system/planning/specification/`; cited lines refer to this frozen subject.

**Why the original contradiction is resolved**

`capabilities.json:229–239` replaces LaunchReadiness’s singular acceptance reference with:

- `acceptance_requirements_ref`, identifying the admitted requirements manifest;
- `acceptance_bindings: JudgmentBinding[]`.

CAP-12’s input ports now carry the same manifest and binding array (`capabilities.json:1640–1656`). Each binding contains the requirement ID, exact subject reference, predicate reference and judgment reference (`7389–7396`).

The validation rules at `7425–7430` require a complete match against the independently admitted manifest. Each child judgment must match its own exact subject/version and predicate, be currently accepted, and satisfy scope, evidence-closure, authority and expiry checks. Distinct legitimate subjects therefore receive distinct matching judgments. One judgment may be reused only where the required subject and predicate are truly identical.

`03-company-capabilities.md:87` states the same composition rule and makes the manifest and child judgments precede readiness assembly. This avoids requiring the readiness record to establish its own future acceptance.

The repair chooses the explicit-binding resolution contemplated by FIR-05. It no longer requires one singular-subject judgment to match several different subjects. I found no remaining use of the removed singular launch mapping in the scoped 01–04/catalog contracts.

**Discriminating cases — specified outcomes, not executed results**

| Case | Required result and supporting contract |
|---|---|
| **Ordinary distinct-subject launch** | Separate product, delivery-capacity, support-capacity and applicable offer-condition judgments can populate separate bindings. A complete, current join satisfies this acceptance prerequisite (`capabilities.json:7426–7428`). Actual launch still requires the other authority and readiness conditions. |
| **Missing, duplicate or substituted child** | Missing requirements, duplicate requirement IDs, unapproved additions, wrong subjects and wrong predicates fail the join (`7427–7428`). A general accepted launch report cannot fill an absent capacity judgment. |
| **Inconclusive or misleading acceptance** | Rejected, inconclusive, contested and stale judgments cannot satisfy a child predicate. An accepted report about missing evidence also fails (`7429`; `01-contract-kernel.md:263`). Completed assessment remains distinct from accepted subject. |
| **Support evidence changes after assembly, before release** | A changed required child or mapping invalidates readiness (`7429`). The release transaction rereads current prerequisites and restrictive state (`02-authority-recovery.md:186–187`); live dependency checks are not deferred solely to background traversal (`297–299`). |
| **Producer selects easier criteria** | The manifest must be independently admitted and selected from actual offer/service scope and mandates; the producer cannot substitute easier criteria (`capabilities.json:7425`). Bindings cannot redefine the manifest’s required subjects or predicates. |
| **Unrelated change or genuinely identical requirement** | Matching and invalidation concern the declared dependency closure. No new rule requires global rejection merely because an unrelated record changes. Reusing a judgment for an identical subject/predicate is explicitly permitted; this does not create additional independent evidence (`7428`; `01-contract-kernel.md:261`). |

These cases establish reviewable expected behavior. They do not establish that an implementation derives the complete manifest, enforces its admission, computes dependency closure correctly or survives a release race.

**New connections checked**

The record representation, CAP-12 inputs and domain validators agree on the same binding structure. The change preserves one canonical state per EvidenceJudgment and the exact-subject acceptance rule rather than introducing a second verdict authority.

The mapping also preserves the preceding repairs: capacity verification does not require an earlier sale; provisional pricing does not establish demand; historical frontier evidence does not become current recovery authority; and an inconclusive assessment cannot be promoted into subject acceptance.

Readiness remains a prerequisite to release. It does not establish payment, customer delivery, discharge or instantaneous recall of an already released effect. The existing bounded-attempt and unknown-effect semantics remain unchanged.

**Disposition and limits**

Close FIR-05 at specification level and retain its positive, negative and concurrency cases as unexecuted conformance obligations. There is no unresolved FIR-01–05 finding in the corrected subset on this review’s grounds.

This recheck does not accept unfinished 05–08 work, the full schema/component matrix, priced BOM, coverage, deployment prerequisites, comparative economics or empirical performance. It supplies no aggregate score, runtime clearance, new foundation-selection verdict or Phase G acceptance.
