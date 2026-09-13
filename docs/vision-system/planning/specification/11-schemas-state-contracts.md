# 11 — Canonical schemas and state contracts

Status: CS1 author proposal, 2026-09-12. S1.0 remains the logical architecture anchor. This document specifies a proposed version 2.0 representation and command contract; it is not released software or independent acceptance. FI-10/11 consolidation and the new FI-12 acceptance join require independent assessment before the Phase G conformance freeze. No runtime, provider, recovery or economic experiment was executed for this authoring task.

The source baseline is integrated `3ff24a1`, including [01 kernel](01-contract-kernel.md), [02 authority/recovery](02-authority-recovery.md), [03 company](03-company-capabilities.md), [04 human operation](04-human-operation.md), [05 work](05-work-agents-skills.md), [06 knowledge/evidence](06-knowledge-evidence-evaluation.md), [07 integrations](07-integrations-capacity.md), [08 improvement/build](08-improvement-implementation.md), [09 company/human answers](09-company-human-traceability.md), and their machine catalogs. Component ownership additionally consumes `133c57d7a1e85251f6106d074c3238cedbb286c7`, the source of `10-components-authority-traceability.md` and `components-authority.json`. That component source introduces no competing grant, evidence or recovery authority. Existing primary-supported research and SC-POLICY-1 continue to govern substrate claims; schema authoring supplies no new empirical support for them.

The early CS1 commit freezes the interpretation, migration proposal and tests in this document for independent examination. The machine registry and its specification validator are a subsequent part of the same authoring task. References to that registry below describe its required contract, not a claim that every entry has already been delivered in the early commit.

## FI-12: exact subject revisions and acceptance

The existing documents combine exact subject-version judgments with mutable records whose `state` and acceptance-reference fields belong to the same revision. A normal sequence exposes a join conflict: a `ProductSpec` at revision 7 is assessed, then changing its state from proposed to validated produces revision 8. A judgment of revision 7 cannot authorize revision 8. Adding an output acceptance reference to the subject has the same problem. Quietly ignoring state, comparing a subset of fields, accepting a future record or weakening exact-version matching would contradict the stated authority contract.

CS1 selects **immutable business revisions with separately versioned authoritative lifecycle decisions**. A business revision is recorded before it is assessed. Its bytes and exact `Ref` never change. The result of assessment, admission, execution progress or closure changes a `LifecycleStatus` that refers to that exact business revision. Output links to the judgment that decides the subject belong to that status. Input evidence that the subject itself asserts remains in the business payload.

This is a change to the drafted representation, not a discovery that the old runtime failed; no such runtime exists. Preserving the old drafts is not the reason for the choice. The chosen mechanism removes a repeated coordination operation from ordinary acceptance while keeping exact content identity and authoritative state transitions.

The strongest alternative is an atomic candidate-postimage and judgment group. It can avoid a future-proof cycle: preallocate all record/event refs, freeze the complete candidate including business and state fields, independently assess those exact bytes, obtain final evaluator and owner endorsements of the same digest, recheck prior state/current mandates/epochs, and commit only the complete declared group. Captured performance evidence must precede the group; references cannot mean arbitrary optimistic future records. Editing any candidate byte invalidates review, and a group cannot manufacture a native effect or exempt a C04/C08 guard.

That alternative is technically plausible, but it requires a preparation protocol, full-group review, final digest endorsements and edit-after-review recovery for ordinary acceptance. Composite launches amplify that labor. Late links to actual responses/reasons have to be prepared without smuggling assumptions into the frozen group. The immutable-revision solution instead records a proposed subject, evaluates it, then records the disposition. Its main cost is a second authoritative head and explicit joins on current lifecycle. The migration is broader but mechanical and auditable. Independent assessment must challenge that cost comparison and the correctness of the selected joins; author preference does not establish closure.

### Two identities, one current interpretation

`Ref<T>` remains `{record_id, record_type, revision}`. Revision is the existing canonical nonzero unsigned decimal string. A reference never means “latest.” A `Ref<ProductSpec>` identifies immutable business content. A `Ref<LifecycleStatus>` identifies one immutable decision about that content. These are different record types, not two meanings for the same reference.

The version 2.0 business envelope retains the exact kernel identity, company/principal, owner assignment, schema version, creation/last event refs, recorded/effective times, access and retention policies, and provenance. It removes `state`. All payload and envelope fields remain immutable for that business revision. `last_event_id` means the event that recorded those immutable bytes; it is not backfilled on a later lifecycle transition. The lifecycle event has its own identifier. Owner, policy or payload changes create a new business revision and are not hidden metadata edits.

A `LifecycleStatus` has the common immutable envelope and this closed payload:

| Field | Exact meaning |
|---|---|
| `subject_ref` | Exact immutable business revision being decided; never a `LifecycleStatus` subject. |
| `phase` | The finite lifecycle enum registered for that subject type. |
| `links` | A closed, subject-type-specific object containing output disposition links moved from the old payload. |
| `entered_event_id`, `entered_at` | Actual transition event and recorded time. These do not contain the event's future transaction proof. |
| `reason_ref` | Attributed reason for this transition. |
| `supporting_judgment_refs` | Exact C06 judgments used by the registered transition predicate. An arbitrary report judgment is insufficient. |
| `decision_refs`, `response_refs` | Actual competent decisions and authenticated responses supporting this transition. |
| `continuation_ref` | Optional exact continuation required when unresolved work/duties persist. |
| `prior_status_ref` | Previous lifecycle decision for this same exact subject, absent only at initialization. |

The database has one constrained business head per `(company_id, record_id)` and one constrained lifecycle head per exact business `Ref`. Every revision behind either head remains immutable. `LifecycleStatus` is an intrinsic control fact: it has no lifecycle record of its own and requires no judgment accepting itself. Its validity follows from the authorized command, exact edge guard, transaction and independent durability. Immutable event bodies, reason records and witness receipts similarly have intrinsic representations. They do not generate an infinite status or acceptance chain.

A lifecycle head is authoritative control state maintained by the subject's responsible component through the kernel. A UI projection is disposable. Rebuilding a projection cannot move a business or lifecycle head, restore an old accepted phase, clear a live restriction, or produce durability proof. C09 renders the joined state and its watermark; it cannot author the join.

### Ordinary acceptance and change

A producer first records the complete proposed business revision. Required inputs may be honest unknown values where the capability permits uncertainty. For example, a provisional price need not invent demand, and preparatory interview research does not need an Offer or product delivery capacity. Its own actual contact/privacy/interviewer/response requirements still apply. Recording the revision does not make its output acceptable or authorize effects.

An evaluator receives that exact immutable revision, an independently admitted criterion, the actual evidence base and its current source/meaning/selection/denominator/evaluator closure. The evaluator's `EvidenceJudgment` body is also recorded as immutable proposed content. Its predicate, subject, evidence, limitations and reason are fixed before C06 decides its lifecycle. C06 may mark the judgment accepted, rejected, inconclusive or contested under the kernel distinctions. The judgment itself cannot be in its own supporting evidence graph.

The domain owner then requests a lifecycle transition of the already recorded subject. The kernel checks the exact current subject head, exact current judgment and judgment lifecycle, exact predicate and arguments, competence/mandates, scope, expiry, and complete live dependency closure. If they satisfy the registered subject edge, it writes the new `LifecycleStatus`, its output judgment link and the transition event in one ordered group. The business `Ref` stays unchanged.

For the example above, revision 7 remains revision 7 when validated. Its validation status refers to a judgment of precisely revision 7. If a producer changes one requirement, policy, input child judgment binding or owner assignment, that is revision 8. Its lifecycle initializes as proposed; the revision-7 judgment remains historical and cannot accept revision 8. If a field represents a fact already fixed by a prior event, model that immutable fact explicitly and refer to it; do not declare all later content edits harmless.

A correction to a judgment's predicate, source set or reason is a new judgment business revision. Contestation, staleness and withdrawal are separate lifecycle decisions with their own reasons and evidence. An accepted judgment can later become stale or contested without rewriting its original body. Reassessment can create a successor judgment revision or record as the source contract permits. A completed inconclusive assessment remains distinct from an unfinished proposed assessment, a rejected subject and contested evidence. “Disputed” is a presentation of contested evidence only where that binding is explicit.

### Input links, output links and composite launch

Moving every judgment-shaped field would be wrong. A `LaunchReadiness.acceptance_bindings` collection asserts required **child** evidence and remains immutable payload. It is evaluated against the exact admitted, predeclared launch-requirements configuration. A one-to-one mapping must cover every unique requirement ID with the exact subject revision, predicate configuration and arguments, scope and acceptance owner. Different product, formation, delivery and support subjects can have distinct judgments. A missing, duplicate, wrong, stale or incomplete child fails the launch criterion. An accepted uncertainty report cannot substitute for a delivery or product predicate.

The judgment that decides that assembled `LaunchReadiness` is an **output** disposition and belongs to its lifecycle status. It does not appear as a child of itself. Composite children are already recorded immutable revisions with current accepted judgments; there is no need for a self-referential future launch group. Structural backlinks are permitted only as typed relationships. Evidence, authority and work-dependency cycles cannot support themselves.

Output acceptance fields moved to typed lifecycle links include `Case.acceptance_judgment_ref`, `WorkOrder.acceptance_judgment_ref`, `WorkflowRun.acceptance_judgment_ref`, `StepExecution.judgment_ref`, artifact validation judgments, transformation judgments, fulfillment and recovery-packet acceptance, obligation discharge/transfer judgments, and operation/attempt/claim/reservation reconciliation judgments. The registry enumerates every field migration. Existing input judgments for an evaluated child, actual exercise, demand assertion or independently observed prerequisite stay input fields unless a specific migration says otherwise.

The same distinction resolves Handoff. A `Continuation` preserves exact partial work and context. Successful transfer additionally joins the current accepted responsibility assignment, actual recipient acknowledgment and `HandoffAcceptance` in the appropriate output lifecycle links. Delivery of a message cannot perform that join. Budget is a value binding of concrete `ResourceAccount` and `Reservation` refs. Evaluation is a value binding of role-specific plan, run, trial and judgment refs. Neither becomes a new spendable or accepting record.

### Atomicity, invalidation and current reads

Lifecycle transition CAS includes the exact business head, prior lifecycle head, judgment business and lifecycle heads, current authority/meaning/configuration heads, and complete live restriction epochs relevant to the predicate. A business edit CASes the same business head and records its new initial lifecycle in that transaction. Therefore an edit and acceptance cannot both claim the same current subject under inconsistent assumptions.

If acceptance commits first, a subsequent business edit initializes a new unaccepted revision and invalidates dependent current use. If the edit commits first, acceptance of the old revision conflicts. Neither branch silently applies the old judgment to the new bytes. An acceptance command retry with the same ID returns its stable original result; a new command must reread current refs.

The dependency graph distinguishes content edges from lifecycle-decision edges. Evaluations of immutable content depend on the exact content, sources and criteria they actually assessed. They do not depend on their own eventual acceptance phase. When a predicate explicitly requires a prerequisite to remain admitted/accepted, its evidence closure includes that prerequisite's exact lifecycle decision plus current restriction epoch. A later stale/contested/restricted status invalidates dependent current use even though the underlying business bytes remain unchanged.

C04 reads current business heads, lifecycle heads, admitted predicates, dependency closure and live epochs in the same current-check transaction that orders release against restrictions and competing consequences. Index cleanup and UI refresh may lag; these are not authority barriers. A cached old accepted status is historical evidence only. False or unresolved predicates deny the dependent transition and preserve surviving duties, holds, reasons and accessible complaint intake.

The normal kernel rule that new referenced records may be present in the same complete transaction still applies to structural bookkeeping, such as a status and its event. It does not permit evaluating an unrecorded future business subject. Evidence judgment subjects and their actual supporting performance evidence must precede their deciding lifecycle transaction. This is the boundary that removes the candidate-group alternative from normal acceptance.

### C04, C06 and C08 proof boundaries

The amendment changes subject/state identity; it does not fold proof into committed content.

| Object or response | Representation and required boundary |
|---|---|
| `GroupBody`, `BusinessResult`, `CommittedEventBody` | Canonical immutable pre-proof bytes. They never contain their own transaction hash, Position, receipt or signature. DomainEvent refs index the immutable event body as revision 1. |
| `Position`, `DurabilityReceipt` | Post-commit independent evidence. A receipt is produced by R from the exact contiguous group and required recoverable contents. Receipt lookup is external to its signed subject. |
| `Release` | Immutable exact C04 authorization body with a TransactionKey; lifecycle restriction does not mutate the released bytes or erase an issued window. |
| `SendClaim` | Immutable one-use claim for exact request, attempt, gateway generation/boot and finite first-send window. |
| `SendAuthorizationBundle` | Post-commit join of claim, Position, independent receipt and current restrictions. A locally recovered committed row is insufficient. |
| `RecoveryFrontier` | Fresh authenticated nonce-bound signed query response. Historical captured response is an artifact/observation, never a current authority Ref. |
| `OperationStatus` | Derived operation/release/attempt/frontier projection. Neither its existence nor “accepted” command status proves an actual effect. |

Actual first transport remains separately bounded from retry and delayed provider acceptance. Current generation, gateway boot, finite first-send deadline, cancellation, expiry/revocation interval, independent durability and one-use egress observation remain mandatory. Every unreconciled effect retains its possible maximum hold and duty. `LifecycleStatus` cannot convert an unknown payment, delayed message or unavailable professional into a fulfilled business outcome.

## Registration and transition routing

The machine registry is the closed set of record/value types, command payloads, predicates, phase enums and legal edges. No command accepts an arbitrary record name or arbitrary JSON object as authority. Reusable registration/revision commands dispatch to the registered type owner and guards; they do not let C02 write another component's protected records.

`kernel.record.register` creates only the registered initial business revision and initial phase. Intrinsic authority facts have exclusive factories: a release is created only by the release handler, a send claim only by the attempt-claim handler, a witness receipt only by R, an event only by the commit builder, and a lifecycle decision only by its authorized transition handler. A producer cannot register a preaccepted subject or add an accepted output link.

`kernel.record.revise` takes an exact prior ref and a closed typed payload. It creates a successor immutable business revision, records why it changed, initializes its phase, and invalidates dependent current acceptance. Authority-sensitive revisions additionally require the appropriate protected-change, mandate and migration contracts. Material revision is not an implicit renewal, reservation reset, ownership transfer or permission enlargement.

`kernel.record.transition` takes the exact subject, target phase, typed output links, reason, actual evidence/decisions and any required protected-change ref. It cannot change business payload. Source commands such as `work.run.advance`, `human.handoff.accept` and `authority.operation.reconcile` remain specialized entries to the same exact per-edge predicates and component responsibility. A generic name is not a bypass. Commands authenticate the actor from transport, reject type mismatches, use exact expected revisions and keep stable duplicate results.

Public query responses return immutable business content and the exact current lifecycle ref/phase separately, with source Position, freshness and omissions. The wire envelope remains permission-filtered. A historical request labels both historical content and historical status; it never supplies a latest alias for an authority check. D1 staging continues to use `StageRef`, including explicit local durability and expiry. A browser draft is not a StageRef until actually staged, and neither is a witnessed record Ref.

## Predicate runtime boundary

A `TypedPredicate` is an exact registered ID, version and closed argument object. The registry contains its typed arguments, pure expression, component owner, source contract, failure behavior and planned implementation module. Unregistered IDs, missing arguments, implicit coercion, unknown record types and recursive predicate call graphs fail validation. A string describing a desirable result is not an executable predicate.

Common functions handle exact comparison, field lookup, finite sets, decimal arithmetic, ref/lifecycle resolution and graph traversal. Per-edge programs bind the actual subject type, from/to phases, permitted commands, current owner, relevant criterion, event basis and duty disposition. Readiness uses the corresponding subject-specific criterion; expiry needs actual deadline evidence; restrictive action preserves duties; external settlement needs exact native correlation. The 373 earlier work-catalog edge delegates are inputs to this expansion, not evidence that their guards were already complete.

**"Uses the criterion" means an `op: "call"`, and that is checked.** This paragraph claimed the criterion was used while `criterion_id` was named on every edge and evaluated by no guard — `op: "call"` occurred zero times in any edge program, and the whole `criterion.*` family was unreachable. An edge guard now calls its own `criterion_id`, passing exactly the arguments that criterion declares, and the criterion is the sole home of target-phase content: it reads `judgment_refs` through `accepted_for` against its own id, so a judgment accepted for one criterion cannot license a different transition. `validate_contracts.py` fails an edge that does not call its criterion, and fails any predicate declaring an argument nothing transitively reads. What remains open is CONTENT, not mechanism: for 167 of 173 records the source corpus states no per-phase evidence requirement, so two criteria of one record can still differ only by the criterion a judgment must name. Measure it with `contracts/tools/guard_distinctness.py`; do not take this paragraph's word for it.

Some propositions require the world: whether a service was delivered, a human understood a transfer, a professional is competent for an activity, a customer accepted terms, or a tested runtime actually enforces egress. These enter through typed protected observations under a named actual performer/assessor and admitted method. The predicate checks source/capture identity, exact subject and arguments, applicable competence/mandate, freshness, actual inputs, independent evaluator roots, completeness and observed result. It cannot make the underlying fact true. A model may propose an assessment; it does not mint a competent professional's standing.

The conformance interpreter exercises the specified pure logic and synthetic trusted-input boundary. Production collectors, signatures, clock/egress mechanisms and physical competence checks remain implementation and operating obligations. Unsupported boundary inputs return unresolved; tests cannot fill them with a default true. Source claims, negative results and uncertainty are retained under SC-POLICY-1.

## Bootstrap and competent acceptance

Bootstrap is a finite, narrow protocol with an external human trust boundary. The actual founder/root custodian authenticates a preparatory company namespace, original intent material, initial identities, scoped mandates/assignments, access/retention policies and actual key/witness custodians. The exact initial group and scope are signed by the admitted root identities. Structural crossrefs are permitted inside that complete group; no bootstrap record proves its own real legal registration, bank balance, professional qualification or provider capacity.

The first lifecycle heads follow from this one initialization command and its verified root authorization, not recursively from accepted lifecycle records. The initial grant set permits only the declared preparatory scope. It provides no ungranted spending, publishing, contacting, private disclosure or professional engagement. A legal entity can remain an asserted principal with its formation unknown. Preparatory investigation can proceed with honest unknowns where its actual activity prerequisites permit it.

A first evaluator cannot be admitted by an infinite chain of model evaluators. `evidence.bootstrap` binds an actual competent human assessor and independently accountable custodian to a narrowly described evaluation scope, their actual identity/standing/competence evidence, exact method, source captures and accepted responsibility. **This section described that binding while no predicate implemented it:** `bootstrap_roots` was defined in the primitive registry and invoked by zero of 2252 predicates, and nothing named `evidence.bootstrap` existed in any registry, so mandate acceptance required an accepted assessor mandate with no terminator. It is now `evidence.bootstrap.<Record>.v1`, registered for each of the nine criteria the chain walk returns as ungrounded, offered as a disjunct beside the derived path so acceptance is either out of band at the root or derived and never neither. `contracts/tools/acceptance_chain.py` walks the chain from `criterion.Mandate.accepted.v1` and the validator fails if it does not terminate. The genesis group is the signed `BootstrapCandidate` set that `BootstrapAuthorization` covers — there is no separate genesis record type, because membership of that signed group is the distinction. **Who the founder and root custodian actually are is a deployment prerequisite and is supplied by no contract in this repository.** The root decision admits that evaluator for the named scope after the person actually accepts. A same-person configuration records the common root and cannot satisfy a predicate requiring independent review. If independent competent review is required but unavailable, that acceptance path is unavailable; low-consequence preparatory work may continue within its own authorized scope.

Later evaluator admission uses the ordinary calibration, negative-control, false-accept/reject and drift contracts. Root admission is not a permanent exemption or a route to professional standing. Expired competence, source restrictions, departure or common-failure discovery invalidates dependent use. Actual owner values decisions remain with the owner; a competence gap routes assistance or narrows operations instead of replacing personal preferences with model rankings.

## Storage, retention and historical interpretation

The removal of inline `state` does not relax [06's protected-storage rule](06-knowledge-evidence-evaluation.md). Classification is independent of size and primitive type. Titles, reasons and short human/model strings are protected by default. IDs, salaries, enums and relationships may also be personal or confidential. The exact field storage registry names permitted plaintext metadata only after sensitivity and purpose assessment.

Protected canonical business and lifecycle bytes are encrypted before any GroupBody, JSONB, WAL, event/log, index, cache or backup plaintext duplicate is made. Necessary plaintext routing/projection fields require an explicit copy-class retention/deletion policy; they may keep deletion incomplete until genuine purge or authorized expiry. Encrypted blobs and control references retain exact hashes and key manifests without retaining accidental plaintext proofs. Smallness is never permission to persist cleartext.

Current access and deletion restrictions filter historical reads too. Continuing DeletionScope covers late derivatives, offline copies and rejoin, while receipts state residual retention and unknown copies. A deletion cutoff is an inventory boundary, not an exclusion for later discovered descendants. Copy/purge evidence must name its physical class and limits. A historical revision may be inaccessible while its safe audit metadata remains interpretable; that does not authorize reconstituting deleted content from an old index or backup.

## Amendment and migration contract

CS1 proposes this finite amendment set; none is silently applied to the earlier documents:

1. In 01, remove lifecycle `state` from immutable business-version bytes, introduce intrinsic `LifecycleStatus`, distinguish business and lifecycle heads, and bind exact acceptance/current checks as above. Preserve common identity, immutable Ref, canonical bytes, events, independent receipt and command-result rules.
2. In 02, retain release/claim/receipt bodies and their proof ordering; change mutable reconciliation/restriction/status references to exact lifecycle decisions. Current-check transactions join business and lifecycle heads plus live epochs. OperationStatus remains a response projection.
3. In 03–09 and their machine catalogs, retain source capability/procedure meaning and source question answers, but map output acceptance/transfer/reconciliation fields into typed lifecycle links. Keep child evidence and predeclared launch bindings in immutable inputs. Resolve Evaluation/Budget/Handoff and source aliases through explicit field maps.
4. In 10's component contracts, replace any “record.state” read with the joined authoritative lifecycle read. Component ownership does not change. C02 dispatches, the relevant domain/control owner decides, C06 judges evidence, C04 releases and C08 establishes recovery truth.

A migration freezes affected writers and admissions, captures the complete old business/status/unknown-hold frontier, and uses an exact versioned identity/field mapping. Old history remains byte-addressable under its original schema. The converter extracts the old payload and lifecycle/output-link fields into version 2.0 objects and records source evidence. It must not assert that an old judgment now matches newly constructed content: such judgments are historical unless a competent fresh assessment accepts the exact converted business revision. Unknown or ambiguous alias mappings remain restricted.

During the fence, old unreleased preparations using obsolete state/meaning/issuer definitions are invalidated. Combined conflict scopes retain all old unknown holds and order admission before resumption. Reader/writer compatibility, current subject/lifecycle indexes, deletion policy, evidence closure and exact native reconciliation are tested before activation. There is no in-place rewrite of old signed bytes or a rollback that restores revoked permission, erases business effects or forgets old unknowns.

## Conformance cases and limits

These are specification obligations, with synthetic pure-logic checks distinguished from future integration/operating tests:

| Case | Required result |
|---|---|
| Record proposed product, judge exact revision, validate it | Business Ref unchanged; new lifecycle ref cites that exact current accepted judgment. |
| Edit a requirement after assessment | New business revision starts unaccepted; prior judgment remains historical and fails the new subject guard. |
| Race content edit with acceptance | One subject-head CAS wins; loser conflicts. No revision receives a judgment of different bytes. |
| Replay an old accepted projection/status | Current authoritative heads and epochs prevail; no resurrection. |
| Complete inconclusive assessment of uncertainty | Judgment may be completed-inconclusive; subject launch/product acceptance fails. Acceptance of a report about uncertainty only accepts that report predicate. |
| Distinct product, formation, delivery and support launch children | Exact complete bijection succeeds; missing/duplicate/wrong/stale child, wrong predicate arguments or self-support fails. |
| First venture and pre-sale delivery check | No invented customers or SalesAgreement; actual performer/access/material/window/continuity check can verify capacity. Unknown demand permits the internal provisional price path. |
| Actual scoped interview research | Research activity prerequisites apply; an unrelated Offer/ProductSpec/product delivery requirement is not introduced. |
| Handoff receipt without actual recipient acceptance | Work and duties stay with the current custodian; access cutover cannot silently discharge them. |
| First root/evaluator setup | Finite scoped initialization succeeds with actual root and competent human evidence; absent independent competence cannot be satisfied by recursive self-review. |
| Lost witness acknowledgment after local commit | Generic accepted/dispatch response withheld until authoritative exact independent durability evidence exists. |
| Old frontier or delayed first transport | Old nonce/snapshot cannot recover authority; expired/wrong-boot first send fails even if the caller began earlier. Unknown provider effect retains holds. |
| Source/evaluator restriction after acceptance | Transitive current use fails through live epochs/lifecycle dependencies before cache cleanup. |
| Protected short number/string or relationship in WAL | No unscoped plaintext copy; necessary exceptions stay in purge accounting and can prevent complete deletion. |
| Owner/provider joint failure, closure or unavailable professional | Actual accepted independent continuity and funding are required for affected duties; a packet or software result cannot fulfill the unavailable service. |

CS1 does not select new technologies, remove EAS-R1 comparator controls or change the frozen G protocol. It adds representation and guard specificity needed to build and challenge the selected S1 architecture. Independent review must decide FI-12 conceptual closure and whether the final registry resolves FI-10/11. Production predicate implementation, boundary failure injection, real continuity and professional/provider availability, customer benefit, accumulated institutional labor and longitudinal economics remain unexecuted.
