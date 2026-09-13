#!/usr/bin/env python3
"""Per-phase criterion CONTENT, derived from the prose contracts.

FI-11's mechanism was closed by the canonical repair: every edge guard calls its own
`criterion.<Record>.<phase>.v1` and reads real arguments. What stayed open is CONTENT.
For 167 of 173 records the corpus stated no per-phase evidence requirement, so two
criteria of one record still had byte-different but SHAPE-identical bodies -- 210
sibling collisions under the reviewer's all-strings-erased method, 92 distinct
skeletons, largest share 567.

This module is where the content is stated. It has exactly three moving parts:

  CITE         every prose passage this package relies on, quoted, with its file.
  ROLES        evidence ROLES, matched against a record's own REQUIRED payload
               fields. A role is not a field list: it is "the fields of this record
               that carry its custodian", and it resolves per record.
  PHASE_SPECS  for each phase NAME, what the prose says a transition INTO that phase
               requires, as a composition of registered primitives, with citations.

The rule every entry obeys: two phases of one record must differ in WHAT they check,
not only in which phase name they mention. The discriminators are real -- which
primitives are composed, how many of the record's own fields each demands, and which
lifecycle phases the related records must be in -- and all three survive the
all-strings-erased skeleton, which is the point.

Where the prose is SILENT the entry is absent and the criterion becomes
`content_unspecified` with a `gap_id`. A visible gap is acceptable here. A gap filled
with plausible text is the false closure this package refuses, so there is no default
family and nothing falls through to one.

Read with tools/author_phase_content.py (applies it) and validate_contracts.py
(fails a `content_unspecified` body with no matching entry in phase-content-gaps.json).
"""
from __future__ import annotations

import re

# --- Citations. Every quote below was read from the file it names. ---------------
#
# Paths are relative to the specification directory (contracts/..), which is how
# `source` is already written in the predicate registry. validate_contracts.py
# resolves every one of them and fails on a path that does not exist -- a citation
# that cannot be opened is not a citation.

CITE = {
    "arch3-distinctions": (
        "../02-architecture-selection.md",
        "Cases distinguish proposed, admitted, active, waiting-for-evidence, accepted, "
        "disputed, parked and abandoned states. Obligations distinguish reported "
        "performance from legitimate discharge, transfer and surviving dispute. "
        "Operations distinguish held, independently recorded, released, observed and "
        "unknown effect. The authority owning each transition verifies its "
        "prerequisites; a convenient common “done” flag cannot replace these "
        "distinctions."),
    "arch3-outcome": (
        "../02-architecture-selection.md",
        "an obligation survives that case; an operation can remain uncertain after both "
        "a worker and a plan stop. Accepted work cannot discharge external standing "
        "through an internal status."),
    "arch4-admission": (
        "../02-architecture-selection.md",
        "The case authority applies existing duty and exploration mandates, identifies "
        "ownership and actual competence/capacity, and admits bounded work. Missing "
        "information creates a specific investigation or dependency; it never becomes "
        "assumed readiness."),
    "arch4-envelope": (
        "../02-architecture-selection.md",
        "Before release, independently persist the `RecoveryEnvelope`: exact recoverable "
        "executable bytes, identities, conflict set, grants/policy/configuration "
        "versions, holds, evidence contract and potential new obligations. ... Current "
        "release state, valid evidence, disclosure contract, parameter authority and "
        "time bounds are checked in the ordered release transaction."),
    "arch4-revocation": (
        "../02-architecture-selection.md",
        "Revocation before the cutoff prevents release; later revocation leaves a "
        "released operation in flight and starts cancellation/reconciliation where "
        "available."),
    "arch6-acceptance": (
        "../02-architecture-selection.md",
        "End-to-end acceptance belongs to its sponsor with actual counterparty/discharge "
        "rules, not the sum of completed tasks."),
    "arch6-delivery": (
        "../02-architecture-selection.md",
        "Delivery produces independently observed results; support can reopen the demand "
        "or claim evidence without undoing existing duties."),
    "arch6-verify": (
        "../02-architecture-selection.md",
        "independently verify delivery against the offer"),
    "arch6-closure": (
        "../02-architecture-selection.md",
        "Closure requires real dispositions and continued reachable redress for "
        "surviving issues; stopping processes cannot fulfill duties"),
    "arch5-deletion": (
        "../02-architecture-selection.md",
        "`DeletionScope` persists restrictions across initial cutoff, late derivatives, "
        "in-flight exports, backups and offline custodians. ... Deletion can reduce "
        "reconstructability; the account declares the resulting gaps rather than "
        "retaining everything for convenience."),
    "arch5-evidence": (
        "../02-architecture-selection.md",
        "Acceptance protects the **transitive evidence base**: capture, source "
        "selection, decoders, mappings, metrics, denominators, datasets, build/runtime "
        "dependencies and administration. ... Missing or changed semantics suspend "
        "acceptance."),

    "k-envelope": (
        "01-contract-kernel.md",
        "Owner assignment is required even for unfinished work. ... No service name, "
        "model identity or self-reference manufactures legal standing or competence."),
    "k-supersede": (
        "01-contract-kernel.md",
        "Superseding a record does not erase its history or silently migrate its "
        "relationships."),
    "k-claim-state": (
        "01-contract-kernel.md",
        "Claim epistemic state is unassessed → supported / contested / unsupported / "
        "unknown. New evidence can move any assessed state to contested or unknown; a "
        "qualified assessor can produce a new supported/unsupported revision with "
        "reasons. Stale is a validity flag, not a truth verdict."),
    "k-decision": (
        "01-contract-kernel.md",
        "DecisionRecord | Exact question/options, deciding actor and mandate, "
        "considered evidence/omissions, chosen scope, resulting command refs | Approval "
        "cannot supply a missing license, service capacity or authority"),
    "k-case-admit": (
        "01-contract-kernel.md",
        "Case | proposed → admitted: sponsor acceptance, intent/mandate, finite "
        "allowance, prerequisites and acceptance contract; admitted → active: valid "
        "WorkOrder/lease and capacity | Missing owner/capacity leaves proposed with "
        "protective custody and deadline; it is not silently admitted"),
    "k-case-wait": (
        "01-contract-kernel.md",
        "Case | active → waiting-for-evidence: named missing evidence/observer and "
        "deadline; waiting-for-evidence → active: bounded needed work; active or "
        "waiting-for-evidence → accepted: C06 judgment and sponsor acceptance of exact "
        "scope | Producer success alone cannot accept; surviving obligations remain "
        "linked"),
    "k-case-park": (
        "01-contract-kernel.md",
        "Case | proposed/admitted/active/waiting-for-evidence → parked or abandoned: "
        "authorized reason, next review/closure account, cancellation and surviving duty "
        "ownership | No obligation disappears."),
    "k-case-dispute": (
        "01-contract-kernel.md",
        "Case | accepted → disputed: attributable challenge or changed prerequisite; "
        "disputed → active/waiting-for-evidence/accepted/parked/abandoned with competent "
        "disposition | Acceptance history remains; disputes cannot be deleted by "
        "resubmission"),
    "k-case-successor": (
        "01-contract-kernel.md",
        "Case | parked → admitted: renewed current prerequisites and finite authority; "
        "abandoned → new successor Case only | Neither restores old grant or allowance"),
    "k-obl-arise": (
        "01-contract-kernel.md",
        "Obligation | potential → recognized: evidence of arising duty; potential → "
        "not_arisen: competent determination and effect reconciliation | A missing "
        "receipt leaves potential, with custodian and inquiry deadline"),
    "k-obl-discharge": (
        "01-contract-kernel.md",
        "Obligation | performance_reported → discharged: authorized evidence of actual "
        "discharge; transfer_pending → transferred: legitimate acknowledged transfer; "
        "transfer_pending → prior substantive state: refusal/expiry | Internal task "
        "acceptance, owner absence and timeouts cannot discharge or transfer"),
    "k-obl-dispute": (
        "01-contract-kernel.md",
        "Obligation | discharged/transferred/not_arisen → disputed revision: new "
        "legitimate challenge; disputed disposition restores recognized/"
        "performance_reported or reaffirms original with authority | Dispute is a "
        "separate flag while substantive status is retained"),
    "k-obl-perform": (
        "01-contract-kernel.md",
        "Obligation | recognized → performing → performance_reported; "
        "recognized/performing/performance_reported → transfer_pending | Exact duty and "
        "beneficiary remain, including disputed flags"),
    "k-workorder": (
        "01-contract-kernel.md",
        "WorkOrder | proposed → admitted → leased → running → report_submitted → "
        "accepted / rejected | C02 admits, worker acknowledges lease, C03 reports, "
        "independent acceptance owner decides"),
    "k-workorder-stop": (
        "01-contract-kernel.md",
        "WorkOrder | admitted/leased/running → parked / cancelled; leased/running → "
        "recovery_required on missed heartbeat or invalidation | Any released effects "
        "move independently to reconciliation"),
    "k-artifact": (
        "01-contract-kernel.md",
        "ArtifactVersion | staged → validation_pending → active: atomic lineage/"
        "current-epoch publication; validation_pending → rejected | Rejected/stale bytes "
        "cannot be used as current input"),
    "k-artifact-restrict": (
        "01-contract-kernel.md",
        "ArtifactVersion | active → invalidated / restricted / deletion_pending; "
        "staged/validation_pending → invalidated / deletion_pending; deletion_pending → "
        "tombstoned after scoped receipts | Revalidation creates a new artifact revision "
        "with new manifest; does not flip old content back to active"),
    "k-manifest": (
        "01-contract-kernel.md",
        "ContextManifest | captured → admitted → closed; captured/admitted → "
        "invalidated; admitted → exhausted | New source, session continuation or "
        "disclosure destination requires a new/extended manifest before reading"),
    "k-judgment": (
        "01-contract-kernel.md",
        "EvidenceJudgment | proposed → accepted / rejected / inconclusive / contested; "
        "contested → accepted / rejected / inconclusive after scoped reassessment | "
        "proposed is unfinished assessment; inconclusive is completed assessment with "
        "insufficient evidence; rejected is evidence that the subject fails its exact "
        "criterion; contested records challenged evidence/judgment"),
    "k-judgment-stale": (
        "01-contract-kernel.md",
        "EvidenceJudgment | accepted / rejected / inconclusive → stale / contested / "
        "withdrawn; stale → contested for current reassessment; withdrawn → new "
        "successor judgment only | Any transitive dependency revocation invalidates "
        "current use until reassessed"),
    "k-continuation": (
        "01-contract-kernel.md",
        "Continuation | prepared → offered → acknowledged → active → completed; offered "
        "→ rejected/expired; active → transfer_pending | Old owner retains unfinished "
        "scope until exact acknowledged transfer; failure activates accepted continuity"),
    "k-protected-change": (
        "01-contract-kernel.md",
        "ProtectedChange | proposed → reviewed → authorized → staged → activated → "
        "verified; any preactivation state → rejected; activated/verified → "
        "rollback_required → rolled_back | Improver cannot review/authorize its own "
        "protected change"),
    "k-acceptance-guard": (
        "01-contract-kernel.md",
        "Every dependent acceptance guard must match the exact required subject/version "
        "and predicate, require current state accepted, and validate scope, "
        "evidence-base closure, authority and expiry. An accepted report whose "
        "proposition is \"evidence is insufficient\" does not satisfy a product, capacity "
        "or launch predicate."),
    "k-terminal": (
        "01-contract-kernel.md",
        "All state machines reject unlisted transitions. Revision changes that preserve "
        "a state still validate the same prerequisites. Terminal records are not "
        "overwritten; a new linked revision/event or successor case records "
        "reconsideration."),
    "k-removal": (
        "01-contract-kernel.md",
        "Removal exports exact records, source-native references, meanings, policies, "
        "active grants, all duties/unknown effects, current frontier, evidence and a "
        "human-readable account. A replacement accepts ownership and reconciliation "
        "before old controls retire."),
    "k11-transfer": (
        "01-contract-kernel.md",
        "K11 | Ownership transfer requires acknowledgment of actual scope/capacity; "
        "parking, closure, absence and tool success never discharge external standing"),
    "k08-epochs": (
        "01-contract-kernel.md",
        "K08 | Publication, use and release compare live transitive "
        "validity/access/deletion epochs; stale workers cannot publish by presenting an "
        "old valid token"),
    "k09-closure": (
        "01-contract-kernel.md",
        "K09 | Evidence acceptance depends on the full capture-to-interpretation "
        "closure, including selection and denominator; compromised dependencies "
        "invalidate affected judgments"),
    "k-observation": (
        "01-contract-kernel.md",
        "Observation | Source identity and capture ref, observed interval, received_at, "
        "source version, claim scope, completeness/omissions, access provenance | "
        "Receiving a signed observation does not establish its factual truth"),

    "a-grant-life": (
        "02-authority-recovery.md",
        "Grant lifecycle: proposed → active only with accepted issuer standing, "
        "human/standing mandate, current prerequisites and D2 proof. active → "
        "suspended/revoked/expired. suspended → active requires a new current "
        "authorization revision; revoked/expired grants never reactivate ... Expiry is "
        "checked live even if a timer has not written the expired revision."),
    "a-reservation": (
        "02-authority-recovery.md",
        "State held → partly_consumed/consumed/released; held/partly_consumed → "
        "uncertain; uncertain → consumed/released only on sufficient reconciliation "
        "evidence. Expiry can release a purely internal unclaimed reservation after "
        "fencing; it cannot clear uncertainty about a possible external effect."),
    "a-release-steps": (
        "02-authority-recovery.md",
        "P2 authority.envelope.confirm | Freeze complete RecoveryEnvelope and obtain R "
        "content/transaction proof | Operation becomes envelope_durable; still no "
        "invocation ... P3 authority.operation.release | In one serial transaction "
        "reread current grants/identity/validity/scope/participant/time/profile/"
        "prerequisites; bind exact envelope and deadline; append Release | Only after R "
        "witnesses exact Release may its response say released"),
    "a-op-states": (
        "02-authority-recovery.md",
        "Operation states are proposed → held → envelope_durable → released → observed "
        "/ unknown_effect → reconciled. proposed/held/envelope_durable may become denied "
        "or cancelled_before_release after witnessed release of proven unused "
        "reservations. released may become expired_without_claim only with current "
        "complete frontier proving no claim and complete old-generation/gateway fencing."),
    "a-attempt-states": (
        "02-authority-recovery.md",
        "prepared → claimed | Unique P4 transaction, current release/prerequisites and "
        "independent claim receipt ... claimed/transport_armed → proven_unsent | "
        "Positive complete gateway/transport proof covering every permitted route plus "
        "fencing; missing logs are insufficient ... → unknown_effect | Crash, timeout, "
        "partition, partial send, ambiguous response or missing authoritative outcome"),
    "a-attempt-observed": (
        "02-authority-recovery.md",
        "transport_armed → transport_observed | Protected capture records at least one "
        "admitted packet/request-stage observation; not business effect ... "
        "response_recorded/unknown_effect → reconciled_applied / reconciled_not_applied "
        "/ disputed | Qualified native observation/standing determines exact effect and "
        "related new duties"),
    "a-http200": (
        "02-authority-recovery.md",
        "An HTTP 200, CLI exit zero, payment authorization or delivery receipt is an "
        "observation whose business meaning comes from the EvidenceContract. Effects can "
        "be applied even when the user-facing call failed."),
    "a-scope-migration": (
        "02-authority-recovery.md",
        "ScopeRegistry state is active → freezing → migration_prepared → active(new "
        "version), with failed/reconciliation_required alternatives; no timeout advances "
        "it."),
    "a-membership": (
        "02-authority-recovery.md",
        "State proposed → admitted → active → sealing → sealed; sealed generations never "
        "reactivate. Changing members is a protected recovery operation with old/new "
        "independent evidence, not service discovery by hostname."),
    "a-invalidation": (
        "02-authority-recovery.md",
        "Invalidation first increments the affected restrictive epoch and creates a "
        "durable propagation task in the same transaction. Current read/release checks "
        "evaluate the complete closure or fail pending a verified closure index."),
    "a-deletion-scope": (
        "02-authority-recovery.md",
        "DeletionScope remains active until the specified source/derived/copied/"
        "exported/backup/native-retention scopes have actual receipts or explicit "
        "justified retention/unresolved states. Policy-qualified retained evidence, "
        "continuing duties and external provider copies are not called deleted."),
    "a-descendants": (
        "02-authority-recovery.md",
        "If enumeration/containment is incomplete, mark residual_authority unknown, hold "
        "affected scopes and invoke actual provider/admin/service continuity. Native "
        "access that cannot be bounded/reconciled fails admission for that consequence "
        "class."),
    "a-containment": (
        "02-authority-recovery.md",
        "Upon compromise/revocation, deny future claims, rotate/revoke the relevant "
        "native credential/session, enumerate and contain descendants, remove "
        "resource-policy grants and scheduled automation where actually authorized, "
        "fence old workspaces/routes, and independently verify native state. A revoked "
        "parent token is not proof that a resource policy, minted token, deploy key or "
        "server-side task lost authority."),
    "a-recovery-steps": (
        "02-authority-recovery.md",
        "Fence old A writer identities and G routes, native sessions, token descendants "
        "and automation. Wait for all old finite transport windows to expire under the "
        "admitted time bounds or obtain stronger complete cutoff evidence."),
    "a-cursor-freshness": (
        "02-authority-recovery.md",
        "A valid signature on an old receipt/frontier is not evidence that nothing later "
        "exists."),

    "c-seed": (
        "03-company-capabilities.md",
        "`company.record.propose` implements the catalog's explicit seed factories. It "
        "validates typed source inputs, creates only the allowed initial state and "
        "assigns the declared custodian before admission. ... Types without a "
        "specialized state enum use `proposed/validated/superseded/restricted`: "
        "validation is a recorded domain acceptance decision, not a generic write. Every "
        "catalog entry has a distinct substantive acceptance condition and responsible "
        "acceptance role in addition to kernel checks."),
    "c-terminal-acceptance": (
        "03-company-capabilities.md",
        "Ports describe typed records produced during and at the end of a procedure. ... "
        "Terminal acceptance requires the catalog's substantive condition; “waiting on "
        "another capability” does not satisfy it."),
    "c-goal-review": (
        "03-company-capabilities.md",
        "Goals have a review date, next bounded discriminator, horizon and abandonment "
        "authority. ... At review time an untouched goal is reaffirmed with evidence, "
        "narrowed, parked with a reopening trigger or abandoned with duty disposition."),
    "c-launch": (
        "03-company-capabilities.md",
        "Launch composes multiple judgments through "
        "`LaunchReadiness.acceptance_bindings: JudgmentBinding[]`. The current "
        "independently admitted requirements manifest resolves each unique requirement "
        "ID to its exact subject/version and predicate ... Assembly requires a complete "
        "join with no missing, duplicate, wrong or stale child"),
    "c-capacity": (
        "03-company-capabilities.md",
        "Before any sale, `company.delivery_capacity.verify.v1` accepts proposed "
        "DeliveryCapacity, actual performer assignments, service workflow, "
        "materials/access evidence, availability window, reservations and continuity "
        "arrangement. It verifies actual acknowledged availability and competence ... "
        "then obtains independent scoped acceptance."),
    "c-price": (
        "03-company-capabilities.md",
        "Price acceptance distinguishes `provisional_hypothesis` from "
        "`demand_supported`. With unknown demand, CAP-18 can complete an honest internal "
        "provisional price and, under a specific current grant, a `test-authorized` "
        "bounded validation offer; it cannot label that price demand-supported or "
        "justify scaling."),
    "c-fulfillment": (
        "03-company-capabilities.md",
        "Fulfillment executes the actual agreed digital, human or physical service "
        "through an accepted performer. For each milestone record promised outcome, "
        "window, evidence and remaining obligations. Partial receipts do not complete "
        "the entire order. Acceptance uses the agreed criteria and counterparty "
        "acknowledgment where required; a silent customer does not acquire a new "
        "discharge meaning."),
    "d-taste": (
        "../../inputs/DIRECTIVE.md",
        "The system must help the founder remain capable of ... exercising taste ... "
        "making difficult decisions"),
    "c-onboarding-failure": (
        "03-company-capabilities.md",
        "CAP-30 then executes onboarding ... Failure creates a support/remedy duty with "
        "an update deadline."),
    "c-sales-outcome": (
        "03-company-capabilities.md",
        "Sales marks its complete commercial outcome only after CAP-30 ... accepted "
        "delivery and the specified payment conditions; agreement formation remains "
        "separately visible before then."),
    "c-triage-independence": (
        "03-company-capabilities.md",
        "A complaint about the current custodian routes outside the disputed "
        "decision/incentive dependency."),
    "c-grievance-remedy": (
        "03-company-capabilities.md",
        "A competent authority has decided a specific remedy, its funding is **actually "
        "reserved**, and a performer and due date exist"),
    "c-shifted-burden": (
        "03-company-capabilities.md",
        "run an operationally successful losing case and a profitable case with excessive "
        "customer/applicant/contractor coordination. Report distinct economic, usefulness "
        "and individual-burden failures; no combined score rescues them."),
    "c-closure": (
        "03-company-capabilities.md",
        "CAP-39 closure inventories accepted and potential promises, refunds, service, "
        "workers/suppliers, renewals, filings, records/data and grievance resources; "
        "performs each real disposition; and records surviving unresolved scope. "
        "`closed-with-residuals` has actual custodian, funding and review dates. It "
        "cannot be advertised as no remaining responsibility."),
    "c-assessment-states": (
        "03-company-capabilities.md",
        "CAP-11 may complete its assessment with canonical EvidenceJudgment state "
        "`inconclusive` when evidence cannot decide the subject, or `rejected` when it "
        "establishes failure. `proposed` means assessment is unfinished; `contested` "
        "means its evidence/judgment is challenged, with “disputed” only a presentation "
        "label. A finished assessment does not accept its subject."),
    "c-grievance": (
        "03-company-capabilities.md",
        "CAP-42 provides noncustomer-inclusive intake without unnecessary product "
        "access, proportionate identity checks, reasons, deadlines, actual competent "
        "escalation and funded remedy. ... After product closure the reachable intake "
        "and competent residual custodian continue as long as required duties remain."),
    "c-pause": (
        "03-company-capabilities.md",
        "CAP-36 pause withdraws specified new-work authority, cancels avoidable "
        "renewals, and retains active support, data, payment and reporting duties. "
        "Resume requires current provider rights, artifacts, contexts, people, reserves "
        "and stale assumptions to be reconciled."),
    "c-succession": (
        "03-company-capabilities.md",
        "CAP-41 succession has accepted scope, actual authority/competence/access, a "
        "usable original-evidence package and rehearsal of unfamiliar duties. The old "
        "custodian does not disappear on packet transmission."),
    "c-mapping-migration": (
        "03-company-capabilities.md",
        "Mapping changes that reveal overlapping entitlements or new required "
        "participants follow technical R1: fence combined scope, preserve old unknown "
        "holds, invalidate obsolete unreleased preparations, reconcile new identities "
        "and establish a common release order before resuming."),

    "h-packet": (
        "04-human-operation.md",
        "`DecisionPacket` ... `latest_decision_at:Instant`, `expires_at:Instant`, "
        "`no_answer_rule_ref:Ref`, `continuing_work_refs:Ref[]`, "
        "`competence_requirement_ref:Ref?`; state "
        "`draft/ready/presented/answered/expired/superseded/conflicted`"),
    "h-packet-ready": (
        "04-human-operation.md",
        "Packet readiness requires exact effects, alternatives, significant uncertainty, "
        "resource/counterparty consequences and no-answer behavior. If preparation "
        "cannot establish these before the latest time, escalate the lack of readiness "
        "as the issue; do not pressure a hurried signature."),
    "h-no-answer": (
        "04-human-operation.md",
        "The no-answer rule is explicit by case: refuse new purchase/publication/"
        "commitment; continue an already authorized procedure; invoke accepted "
        "substitute; or carry out preauthorized bounded preservation. Expiry never means "
        "consent."),
    "h-answer": (
        "04-human-operation.md",
        "`human.decision.answer` | Exact packet ref, option ID and qualification; "
        "current packet/subject revisions, expiry, competent prerequisites and deciding "
        "rule must hold | `HumanResponse` and next workflow refs; accepted response is "
        "not external effect release"),
    "h-handoff": (
        "04-human-operation.md",
        "Recipient acknowledgment of receipt differs from acceptance of responsibility. "
        "Responsibility transfers only after authority, competence and access checks and "
        "explicit scope acceptance. If rejected, the existing custodian or accepted "
        "alternate remains responsible."),
    "h-participation": (
        "04-human-operation.md",
        "`ParticipationEncounter` ... state "
        "`offered/accepted/completed/declined/interrupted` ... Decline, interruption and "
        "noncompletion remain visible coverage limits; they do not establish "
        "incompetence."),
    "h-assessment": (
        "04-human-operation.md",
        "`DomainAssessment` ... state "
        "`proposed/contested/confirmed-with-limits/resolved/inconclusive` ... On material "
        "domain misunderstanding, a competent assessor states the exact factual "
        "proposition/intervention, evidence and limits."),
    "h-projection": (
        "04-human-operation.md",
        "`OperatorProjection` ... `freshness:current/stale/incomplete/unknown` ... "
        "Projection position establishes what the view consumed, not universal world "
        "completeness or independently durable release."),
    "h-stop": (
        "04-human-operation.md",
        "Stop displays five separate facts: command received; future release denied; "
        "worker cessation observed; released/external effects reconciled; required "
        "remedy completed."),
    "h-departure": (
        "04-human-operation.md",
        "Departure stops new assignments, inventories and revokes effective native "
        "access including descendants, transfers duties with accepted acknowledgment, "
        "settles fees/worker duties, restricts retained records and provides permitted "
        "exports."),

    "w-blocker": (
        "05-work-agents-skills.md",
        "`Blocker` states exactly what cannot proceed, what observation/decision/"
        "capacity would unblock it, who can provide that result, next check and due "
        "impact. Unknown cause differs from known impossibility. Its state is "
        "`open/investigating/awaiting_dependency/resolved/accepted_limit`; only "
        "supported evidence satisfies the predicate. An accepted limit parks or narrows "
        "affected work and preserves duty ownership. Silence, a new timer, or a new "
        "worker name cannot resolve it."),
    "w-run-states": (
        "05-work-agents-skills.md",
        "A run follows `prepared/running/waiting/parked/acceptance_pending/accepted/"
        "failed/cancelled`. A step follows `ready/dispatched/running/reported/accepted/"
        "rejected/waiting/cancelled`. Only C02 advances the cursor, in the same "
        "protected transaction that records the step result and creates the next work "
        "intent. C06 judgment plus the required sponsor acceptance permits a run's "
        "accepted state."),
    "w-occurrence": (
        "05-work-agents-skills.md",
        "Occurrence states are `planned/due/admitted/running/completed/missed/disposed`; "
        "completion follows actual workflow acceptance. Missing work is not "
        "automatically marked completed when the next occurrence starts. The scheduling "
        "owner records what was intended, actual wake/start, lateness, duplicates "
        "suppressed, partial work and remaining duty."),
    "w-dependency": (
        "05-work-agents-skills.md",
        "`WorkDependency` has source/target exact refs, kind `requires_output/"
        "requires_authority/requires_capacity/shared_resource/knowledge_question`, a "
        "typed predicate, evidence freshness, custodian and latest responsible "
        "resolution time."),
    "w-delegation": (
        "05-work-agents-skills.md",
        "`MessageAcknowledgment` distinguishes received, understood-scope, "
        "accepted-assignment, refused and answered. Assignment acceptance requires "
        "current authority/capacity and a check of purpose, exclusions and expected "
        "result. A receipt, model paraphrase or emoji cannot transfer duties."),
    "w-abandon": (
        "05-work-agents-skills.md",
        "Abandonment always identifies current custodian, allowed cleanup, remaining "
        "deadlines and reopening condition."),
    "w-retire-skill": (
        "05-work-agents-skills.md",
        "Retirement requires reassignment of remaining work and revocation of effective "
        "tools/sessions, not deletion of a name alone."),
    "w-failure": (
        "05-work-agents-skills.md",
        "`FailureRecord` captures error class, exact procedure/input/dependency "
        "versions, observed cause, unknowns, affected scope, attempts and proposed next "
        "discriminator. ... Two failed attempts with the same cause and no accepted "
        "progress open a Blocker; they do not prove impossibility."),
    "w-trust-scope": (
        "05-work-agents-skills.md",
        "Trust is scoped eligibility, not a general score. New templates start with "
        "fixture/internal production scopes and no outward credentials. Increased "
        "autonomy requires observed conformance in the specific consequence/data domain, "
        "independent acceptance and an actual amended grant."),

    "e-judgment-states": (
        "06-knowledge-evidence-evaluation.md",
        "Its proposed state is unfinished assessment; inconclusive is a completed "
        "assessment that cannot establish its subject predicate; rejected is an adverse "
        "judgment; contested means disputed evidence, not automatic rejection. Later "
        "reassessment creates a witnessed revision with historical reasons retained. "
        "Acceptance of an uncertainty report establishes only that exact report "
        "criterion."),
    "e-closure": (
        "06-knowledge-evidence-evaluation.md",
        "Changed/corrupted dependencies trigger C05 invalidation and mark affected "
        "judgments stale/contested before their next consequential use. The graph stores "
        "reverse dependencies and a verified complete traversal/index frontier; a "
        "delayed background traversal cannot be the sole admission guard."),
    "e-staleness": (
        "06-knowledge-evidence-evaluation.md",
        "A material active prerequisite receives a review deadline and actual "
        "responsible provider; overdue unverified evidence loses current eligibility for "
        "its dependent use. Low-stakes historical material can remain attributed and "
        "qualified. Time passing alone cannot renew a claim."),
    "e-forget": (
        "06-knowledge-evidence-evaluation.md",
        "`ForgetRequest` links the legitimate instruction or DeletionScope, exact "
        "sources/purpose, known derivative closure, cutoff, owner and verification. C05/ "
        "C08 enforce the continuing restriction epoch and isolated rejoin rules; the "
        "domain request cannot weaken them. ... Unknown provider-held copies are recorded "
        "and follow the actual available rights/retention route; the software cannot "
        "certify erasure it cannot observe."),
    "e-contradiction": (
        "06-knowledge-evidence-evaluation.md",
        "Contradictions first compare entity, time, conditions, units, source authority "
        "and interpretation. Different scopes may both be valid ... Otherwise retain a "
        "`ContradictionSet` and scoped competing claims. A competent assessor records "
        "settlement, qualification or continued uncertainty with reasons."),
    "e-source": (
        "06-knowledge-evidence-evaluation.md",
        "`SourceRecord` identifies the actual publisher/issuer or captured origin, "
        "source type, publication/observation/received times, incentives or known "
        "conflicts, retrieval/capture route, version, scope, completeness limits and "
        "verification owner. Unknown authorship or date stays unknown."),
    "e-question": (
        "06-knowledge-evidence-evaluation.md",
        "`KnowledgeQuestion` records what is unknown, why it matters, affected "
        "decisions, search already attempted, resolution predicate, custodian, latest "
        "check and stopping rule. “Not found,” “not searched,” “inaccessible,” "
        "“withheld by policy” and “insufficient evidence” are distinct dispositions."),
    "e-independence": (
        "06-knowledge-evidence-evaluation.md",
        "Independent perspective means different relevant evidence, method, measurement "
        "or competent human grounding under separate protected authority. ... A different "
        "model family can add a tested viewpoint but is not a proof of independent "
        "error."),
    "e-reopen": (
        "06-knowledge-evidence-evaluation.md",
        "Reopen on material contrary outcome, changed source/model/prompt/skill/tool/"
        "schema, missed expiry, new applicable duty, failed original-source "
        "reconstruction, a naive credible challenge, or an alternative that could "
        "materially improve the purpose."),

    "i-adapter": (
        "07-integrations-capacity.md",
        "proposed → examined → admitted; admitted → quarantined or draining; "
        "examined/quarantined → admitted only new evidence; draining → removed after "
        "unknown effects and descendants accounted. C04 admits exact profile with C06 "
        "assessment; author cannot assess its own admission."),
    "i-connection": (
        "07-integrations-capacity.md",
        "pending → active on verified profile/account/standing; active → "
        "paused/quarantined/draining; paused → active after revalidation; draining → "
        "removed. Updating any scoped identity creates a revision and invalidates "
        "incompatible prepares."),
    "i-invocation": (
        "07-integrations-capacity.md",
        "proposed → admitted → dispatched → observed or interrupted; refused before "
        "dispatch; unknown after possible dispatch. These are execution observations, "
        "never replacements for OperationIntent outcomes."),
    "i-observation": (
        "07-integrations-capacity.md",
        "recorded → superseded or contested, append-only revisions; transport_outcome "
        "enum refused/proven_unsent/response_received/interrupted/unknown_effect. C06 "
        "records, qualified domain procedure judges meaning."),
    "i-cursor": (
        "07-integrations-capacity.md",
        "current → gapped/stale → rebuilding → current only after a complete declared "
        "rescan. A webhook heartbeat cannot prove no missing events."),
    "i-billing": (
        "07-integrations-capacity.md",
        "unverified → verified → stale/revoked. No absent price or quota value is zero."),
    "i-capacity-obs": (
        "07-integrations-capacity.md",
        "observed → superseded/stale. Different units and allowance buckets remain "
        "separate."),
    "i-removal": (
        "07-integrations-capacity.md",
        "Connection removal freezes new admissions, enumerates dependent offers/"
        "workflows/schedules/skills/context/evaluators/credentials/native sessions/"
        "public versions and unresolved operations, assigns replacement/manual "
        "performance for existing duties, cancels or expires continuing provider "
        "objects, exports source records with completeness, drains unknown effects, "
        "revokes credentials ... Removing a provider does not discharge a customer duty."),
    "i-circuit": (
        "07-integrations-capacity.md",
        "Authentication failure, schema drift, unexpected redirect/destination, charge "
        "mode change or capture corruption quarantines immediately. A refusal records "
        "the unmet authority/standing/capacity predicate; a provider error records what "
        "was attempted; a timeout after possible send is unknown."),

    "b-change-states": (
        "08-improvement-implementation.md",
        "Exact kernel states are proposed → reviewed → authorized → staged → activated "
        "→ verified; any preactivation state may become rejected; activated/verified → "
        "rollback_required → rolled_back. reviewed requires completed independent "
        "assessment; authorized requires the exact current competent decision; staged "
        "means the exact manifest is prepared with no activation claim; activated "
        "requires native effect evidence; verified requires the declared "
        "monitoring/outcome predicates."),
    "b-rollback": (
        "08-improvement-implementation.md",
        "Rollback restores an old code/configuration version only if current "
        "schema/meaning and live obligations permit it. It never restores expired "
        "grants, old recovery membership, revoked identities, deleted knowledge, stale "
        "context, consumed budgets or old native sessions. Completed disclosures, sends, "
        "payments, physical acts and schema data loss need compensation/reconciliation "
        "and communication; a git revert cannot undo them."),
    "b-trial": (
        "08-improvement-implementation.md",
        "Before a stochastic trial, freeze a task-stratified baseline, exact candidate, "
        "random assignment, common inputs and permitted context, resources, competent "
        "judges, critical failure predicates and outcome thresholds. ... Report every "
        "run, timeout, refusal, invalid output, retry, cost and missing observation."),
    "b-inconclusive": (
        "08-improvement-implementation.md",
        "An improvement claim requires no disqualifying regression, the predeclared "
        "useful-effect threshold, acceptable uncertainty and complete relevant evidence. "
        "Inconclusive remains inconclusive; extending sample size needs a declared "
        "sequential rule or a new trial, not optional stopping until significance."),
    "b-stop": (
        "08-improvement-implementation.md",
        "Stop immediately on a critical invariant violation, unexpected "
        "principal/destination/charge mode, evidence integrity failure or unaccounted "
        "effect. Other regressions use predeclared thresholds, not a posteriori "
        "explanations."),

    "s-per-edge": (
        "11-schemas-state-contracts.md",
        "Per-edge programs bind the actual subject type, from/to phases, permitted "
        "commands, current owner, relevant criterion, event basis and duty disposition. "
        "Readiness uses the corresponding subject-specific criterion; expiry needs "
        "actual deadline evidence; restrictive action preserves duties; external "
        "settlement needs exact native correlation."),
    "s-acceptance": (
        "11-schemas-state-contracts.md",
        "The kernel checks the exact current subject head, exact current judgment and "
        "judgment lifecycle, exact predicate and arguments, competence/mandates, scope, "
        "expiry, and complete live dependency closure. If they satisfy the registered "
        "subject edge, it writes the new `LifecycleStatus`, its output judgment link and "
        "the transition event in one ordered group."),
    "s-no-self-support": (
        "11-schemas-state-contracts.md",
        "Structural backlinks are permitted only as typed relationships. Evidence, "
        "authority and work-dependency cycles cannot support themselves."),
    "s-world-propositions": (
        "11-schemas-state-contracts.md",
        "Some propositions require the world: whether a service was delivered, a human "
        "understood a transfer, a professional is competent for an activity, a customer "
        "accepted terms, or a tested runtime actually enforces egress. These enter "
        "through typed protected observations under a named actual performer/assessor "
        "and admitted method."),
    "s-stale-status": (
        "11-schemas-state-contracts.md",
        "A later stale/contested/restricted status invalidates dependent current use "
        "even though the underlying business bytes remain unchanged."),
    "s-restriction-reads": (
        "11-schemas-state-contracts.md",
        "Current access and deletion restrictions filter historical reads too. "
        "Continuing DeletionScope covers late derivatives, offline copies and rejoin, "
        "while receipts state residual retention and unknown copies. A deletion cutoff "
        "is an inventory boundary, not an exclusion for later discovered descendants."),
    "s-bootstrap": (
        "11-schemas-state-contracts.md",
        "The first lifecycle heads follow from this one initialization command and its "
        "verified root authorization, not recursively from accepted lifecycle records. "
        "The initial grant set permits only the declared preparatory scope."),
    # --- BEGIN WORK-1.1 citations (F2 amendment) ---
    #
    # Every quote below is asserted present in the file it names before the
    # registries are written, and validate_contracts.py resolves each one again
    # on every run: a citation that cannot be opened, or that its file does not
    # contain, is not a citation.  Section 10 of 05 states what must be true to
    # be in each new phase, section 11 of 11 states the transition the registry
    # must enforce, and sections 11 and 12 of 05 state the layer rules they sit
    # inside.  Per-phase content is derived from those three and nowhere else.
    "s-ai": (
        "11-schemas-state-contracts.md",
        '`* → accepted` is **rejected by the writer guard when the resolution reason is '
        'empty**'),
    "s-ar": (
        "11-schemas-state-contracts.md",
        '`→ refused` requires a **named failed predicate** and an acceptance owner; '
        '**silence is not refusal**'),
    "s-as": (
        "11-schemas-state-contracts.md",
        '**No component may prevent membership.** The admission authority holds no write '
        'access to any precondition-bearing kind'),
    "s-cd": (
        "11-schemas-state-contracts.md",
        '`recomputed_at_release → parked_on_mismatch` **never resolves downward**; '
        '`mismatch_disposition` is writable only by the party owning the park'),
    "s-cs": (
        "11-schemas-state-contracts.md",
        'a transfer whose set **fails schema validation** produces a quarantined report '
        'and a bounded repair request, **never a best-effort continue**'),
    "s-ei": (
        "11-schemas-state-contracts.md",
        'a second claimant **joins the first and inherits its outcome**; it does not race '
        'and does not re-release'),
    "s-ej": (
        "11-schemas-state-contracts.md",
        '`proposed → admitted` is **refused if the decidable test cannot return false**'),
    "s-fa": (
        "11-schemas-state-contracts.md",
        '**no last-writer-wins path exists anywhere**'),
    "s-gr": (
        "11-schemas-state-contracts.md",
        'an executor whose grant did not arrive **fails loudly**, never completing with less'),
    "s-ic": (
        "11-schemas-state-contracts.md",
        "a **missing clean-case rate** makes the checker's verdict `unresolved`"),
    "s-pg": (
        "11-schemas-state-contracts.md",
        '**re-read at every read** of the derived projection; revocation invalidates '
        'derivatives already written'),
    "s-registered-type": (
        "11-schemas-state-contracts.md",
        'Each is a registered type in the closed set above'),
    "s-sd": (
        "11-schemas-state-contracts.md",
        'records the lane, the authority, the obligations moved with named custodians, '
        'the stated minimum, whether it was breached, the overflow count and the '
        'lapsed-unconsumed quantity'),
    "s-sh": (
        "11-schemas-state-contracts.md",
        '`staffed → retired_into` is **refused while any duty it holds is live**; `* → '
        'suspended` **stops admission in that duty class**'),
    "s-si": (
        "11-schemas-state-contracts.md",
        '`proposed → trial` is admissible **only at the two lowest effect classes**; a '
        'proposal declaring a writer key is **refused, naming the predicate**'),
    "s-up": (
        "11-schemas-state-contracts.md",
        'retention **exceeds the longest plausible outage**; the arrival alarm has a '
        '**named reader**'),
    "w-acceptance-role-unfilled": (
        "05-work-agents-skills.md",
        'admission in that duty class stops while it is unfilled'),
    "w-ai-in-acceptance": (
        "05-work-agents-skills.md",
        'The producer has declared completion, the acceptance owner has not written the '
        "terminal edge, and the interval holder is the producing structure's sponsor"),
    "w-ar-refused": (
        "05-work-agents-skills.md",
        'A named failed predicate is recorded and an acceptance owner is named'),
    "w-cd-park": (
        "05-work-agents-skills.md",
        'The recomputed set differs from the admitted set and the effect is held'),
    "w-cd-recompute": (
        "05-work-agents-skills.md",
        'The class set has been recomputed inside the ordered release transaction, on the '
        '**frozen bytes**, by the release path'),
    "w-class-gates-all": (
        "05-work-agents-skills.md",
        "**Every reached class's gates apply.** No total rank exists"),
    "w-class-one-function": (
        "05-work-agents-skills.md",
        'The set is computed by **one deterministic function** from four inputs and no others'),
    "w-ei-claimed": (
        "05-work-agents-skills.md",
        'An allocation has been claimed by a releasing attempt before the effect is released'),
    "w-ej-admitted": (
        "05-work-agents-skills.md",
        'Exactly one admitted reason is named with its unit, and the decidable test **can '
        'return false**'),
    "w-fa-superseded": (
        "05-work-agents-skills.md",
        'A later epoch declares the authority for that `field_path`'),
    "w-gr-written": (
        "05-work-agents-skills.md",
        "The enforcement point attested the grant's arrival at the first effect"),
    "w-holder-ephemeral": (
        "05-work-agents-skills.md",
        "an ephemeral worker instantiated under the holder's mandate, carrying the "
        "holder's reservation ref and intake address and nothing else of the holder's."),
    "w-holder-iff": (
        "05-work-agents-skills.md",
        'A standing holder exists for a duty class if and only if all three of these hold.'),
    "w-holder-minimum-evidence": (
        "05-work-agents-skills.md",
        "**The holder's stated minimum is evidence, not consent**"),
    "w-holder-no-veto": (
        "05-work-agents-skills.md",
        'A holder **may negotiate, never veto; may not refuse admission narrowing; and '
        'may not defend its own mandate.**'),
    "w-holder-prohibitions": (
        "05-work-agents-skills.md",
        'A holder **never produces**, **never releases**, **never decides the matter it '
        'is the subject of**, and **carries no model memory**.'),
    "w-ic-run": (
        "05-work-agents-skills.md",
        'A calibration session has recorded the planted-defect result **and** the paired '
        'clean-case refusal rate from that same session'),
    "w-intake-subcap": (
        "05-work-agents-skills.md",
        'every published intake carries a **per-counterparty and per-origin-channel sub-cap**'),
    "w-pg-active": (
        "05-work-agents-skills.md",
        'A grant issued as a C2 act and released by C04, with `recipient_scope` and '
        '`purpose` resolved from a `ParameterAuthority`'),
    "w-precedence": (
        "05-work-agents-skills.md",
        'Lower-numbered layers govern.'),
    "w-sd-written": (
        "05-work-agents-skills.md",
        'C02 proposed and C01 authorised a shed; the lane, the moved obligations with '
        'named custodians, the stated minimum, whether it was breached, the overflow '
        'count and the lapsed-unconsumed quantity are all recorded'),
    "w-sh-suspended": (
        "05-work-agents-skills.md",
        "The holder's mandate is live and its intake is stopped, and **admission in that "
        'duty class has stopped with it**'),
    "w-si-trial": (
        "05-work-agents-skills.md",
        'An interest is admitted on an **expiring bounded trial**, at one of the two '
        'lowest effect classes, under a standing mandate'),
    "w-up-landed": (
        "05-work-agents-skills.md",
        "A work record armed no interest, the entry's retention exceeds the longest "
        'plausible outage, and the arrival alarm has reached its named reader'),
    # --- END WORK-1.1 citations ---
}


# --- Evidence roles. -------------------------------------------------------------
#
# A role resolves against the record's own REQUIRED payload fields, never against
# optional ones: `nonempty_fields` means "every named path is present", and demanding
# an optional field is a requirement the record's own schema says need not hold.
#
# The patterns are matched against the field NAME. They are deliberately narrow --
# a role that matched everything would make every phase demand the same fields and
# reintroduce the shared guard by another route.

ROLES = {
    "subject_identity": [
        r"^(kind|scope|purpose|method|unit|population|denominator|channel|audience)$",
        r"^(outcome|predicate|proposition|question|statement|problem|hypothesis|title)$",
        r"^(subject_ref|subject_refs|target_ref|target_state|measure|version|generation)$",
        r"^(agreed_terms|terms|criteria_version|acceptance_rule|acceptance_contract)$",
        r"^(beneficiary|beneficiary_cohort|options|steps|mode|projection|phase)$",
        r"_predicate$", r"_predicates$", r"_criteria$", r"_rule$", r"_rules$",
        r"^outcome_", r"^spec_", r"_kind$",
    ],
    "custodian": [
        r"^(custodian|owner|sponsor|assessor|deciding|performer|holder|issuer)",
        r"^(recipient|sender|assignee|observer|provider|relationship_owner|parties)",
        r"^(executor|continuity_assignment|alternate_assignment|competence)",
        r"_assignment_ref$", r"_assignment_refs$",
        r"_custodian_refs?$", r"_owner$", r"_owner_refs?$", r"_identity_ref$",
        r"^principal_ref$", r"^participant_refs$", r"^parties$",
    ],
    "authority": [
        r"^(mandate|grant|authority|standing|decision|approval|permission|intent_ref)",
        r"^(issuer_mandate|deciding_mandate|amendment_authority|admitting_mandate)",
        r"_authority_refs?$", r"_authority_contract_refs$", r"_mandate_ref$",
        r"^(can_delegate|max_delegation_depth|depth|nondelegable_scopes)$",
        r"^authority_", r"^decision_", r"^approval_",
    ],
    "evidence": [
        r"^(evidence|capture|observation|verification|supporting|original|originals)",
        r"^(raw_capture|test_refs|trial_refs|sample|measurement|reading|receipt)",
        r"_evidence$", r"_evidence_refs$", r"_capture_ref$", r"_capture_refs$",
        r"_observation_refs?$", r"_verification_refs$", r"^exit_evidence_refs$",
        r"^result_refs$", r"^response_ref$", r"^response_refs$", r"^usage$",
    ],
    "uncertainty": [
        r"^(omission|omitted|unknown|uncertain|limit|limitation|gap|missing)",
        r"^(incomplete|residual|unresolved|next_discriminator|rival_hypotheses)",
        r"^(coverage|complete_through|source_watermarks|as_of_position|conflicts)",
        r"_unknowns$", r"_gaps$", r"_omissions$", r"^unknown_", r"^residual_",
        r"^known_limits$", r"^stop_rule$", r"^stop_predicate$", r"^stop_predicates$",
    ],
    "duty": [
        r"^(obligation_refs|duty_refs|duty_source_refs|duties|unfinished_)",
        r"^(remaining_obligation|residual_obligation|residual_duties|closure_duty)",
        r"^(continuing_work_refs|affected_work_refs|beneficiary_refs|protected_)",
        r"_obligation_refs$", r"_duty_refs$", r"_duties$",
    ],
    "dispute": [
        r"^(dispute|disputed|contest|objection|challenge|disagree|contrary|opposing)",
        r"^(retracted|retraction|conflict|grievance|complaint|escalation)",
        r"_contestation_ref$", r"^reopen", r"^prior_substantive_state$",
    ],
    "dependency": [
        r"^(depend|prerequisite|input|requirement|participant|reservation|shared)",
        r"^(parent|child|source_ref|source_refs|component|configuration|closure)",
        r"^(acceptance_contract_ref|acceptance_bindings|step_refs|case_refs|goal_refs)",
        r"^(work_order_ref|work_order_refs|run_ref|plan_ref|profile_ref|template_ref)",
        r"_contract_ref$", r"_contract_refs$", r"_dependency_refs$",
        r"^resource_reservation", r"^resource_account", r"^schedule_ref",
    ],
    "restriction": [
        r"^(restrict|deletion|retention|access|suppress|contain|exclusion|purpose_ids)",
        r"^(disclosure|destination|fence|classification_policy|allowed_paths)",
        r"^(read_policy|scope_epoch|scope_epochs|scope_refs|epochs|epoch)",
        r"_scope_ref$", r"_scope_refs$", r"_policy_ref$", r"_restriction_refs$",
        r"^competence_scope$", r"^maximum_exposure$", r"^bounds$", r"^resource_bounds$",
    ],
    "successor": [
        r"^(successor|predecessor|prior_|replacement|alias|amendment|rollback)",
        r"^(migration|change_ref|original_ref|reason_ref|reason_refs|reason)$",
        r"^(compatible_predecessor_refs|next_|no_answer_rule_ref|fallback_refs)",
        r"_successor_refs?$", r"_predecessor_refs?$", r"^reason_", r"^superseded_",
    ],
    "native": [
        r"^(native|provider|connection|adapter|gateway|credential|registry_generation)",
        r"^(request_|payload_|send_claim|release_ref|transaction|frontier|snapshot)",
        r"^(account_ref|account_refs|receipt|position|source_position|membership_ref)",
        r"^(lease_epoch|identity_epoch|schema_digest|key_manifest_ref|correlation_id)",
        r"_digest$", r"_epoch$", r"^native_", r"^connector_", r"^attempt_",
    ],
    # Deliberately narrow. `_at$` is how this corpus spells BOTH ends of an interval,
    # so a generic suffix match would hand `created_at` to a freshness check as its
    # upper bound -- a guard that reads as an expiry test while testing nothing.
    "deadline_start": [
        r"^(not_before|created_at|active_from|effective_interval|start_at)$",
        r"^(latest_start_at|intended_at|opened_at|activated_at|window_start)$",
        r"^(occurrence_window|capture_interval|activation_interval)$",
        r"_start_at$", r"_from$",
    ],
    "deadline_end": [
        r"^(expires_at|expiry|expires|deadline|deadlines|due_at|due|cutoff)$",
        r"^(valid_until|review_at|recheck_at|next_check_at|next_update_at)$",
        r"^(horizon|delivery_expires_at|observation_deadline|not_after)$",
        r"^(maximum_elapsed|maximum_idle|latest_resolution_at|latest_decision_at)$",
        r"^(receipt_due|response_due|result_due|local_expiry|next_refresh_at)$",
        r"_due$", r"_until$", r"_deadline$", r"^latest_",
    ],
    "quantity": [
        r"^(amount|quantity|cost|minutes|budget|maximum|total|reserved|consumed)",
        r"^(available|uncertain_quantity|allowance|balance|currency|usage|carrying)",
        r"^(resource_bounds|expected_resources|capacity|owner_minutes|denominator)",
        r"_quantity$", r"_amount$", r"_cost$", r"_minutes$", r"_bounds$",
    ],
}

# Envelope fallbacks. Used ONLY when a role matches nothing in the record's own
# required payload -- the kernel envelope carries these on EVERY record, which is
# why they can stand in for a role the payload does not name, and why they are a
# last resort rather than a first choice: an envelope path is the same on 173
# records and carries no record-specific content.
#
#   01-contract-kernel.md: "Owner assignment is required even for unfinished work."
#   01-contract-kernel.md: "effective_from/until describe the asserted business
#   interval." Declaring them in a criterion is the assertion that this phase has
#   one; `fresh_interval`'s own contract is "when start/end paths are declared they
#   must exist". Recorded in phase-content-gaps.json#/limits.

ENVELOPE_FALLBACK = {
    "custodian": ["/owner_assignment_ref"],
    "restriction": ["/access_policy_ref", "/retention_policy_ref"],
    "dependency": ["/provenance_refs"],
    "evidence": ["/provenance_refs"],
    "deadline_start": ["/effective_from"],
    "deadline_end": ["/effective_until"],
}


# --- Conjunct DSL. ---------------------------------------------------------------
#
#   ("nf",  [role, ...])                        nonempty_fields over those roles
#   ("nfp", [path, ...])                        nonempty_fields over EXACTLY those paths
#   ("rp",  [(role, [phase, ...], optional)])    related_phases, one binding per role
#   ("rpp", [(path, [phase, ...], optional)])    related_phases over EXACTLY those paths
#   ("af",)                                     accepted_for, naming this criterion
#   ("ar",)                                     attested_result, naming this criterion
#   ("nc",  result)                             native_correlated with that result
#   ("fi",)                                     fresh_interval over the record's own
#                                               declared start/end paths
#   ("rc",  phase)                              release_contract for that phase
#   ("ag",  [role, ...])                        acyclic_record_graph over those edges
#   ("s1",  op)                                 a {subject_ref} primitive
#   ("not", inner)                              negation of one conjunct
#   ("ne",  arg)                                nonempty over a declared argument
#   ("uq",  arg)                                unique over a declared argument
#   ("neF", path)                               nonempty over the subject's own value
#   ("prF", path)                               present at the subject's own path
#   ("eqF", path, literal)                      that path equals that exact literal
#   ("either", [item, ...])                     any over built conjuncts
#   ("every", [item, ...])                      a nested all over built conjuncts
#
# `nf` and `ag` need at least one role to RESOLVE on the record; `fi` needs both a
# start and an end path. A conjunct whose roles resolve to nothing is DROPPED rather
# than emitted empty -- an empty `field_paths` is the vacuous check this package is
# here to remove, not a smaller version of a real one. A spec marked `hard` loses its
# whole criterion to a gap when its conjunct cannot resolve, because the requirement
# it states cannot be expressed against that record at all.
#
# `nfp` and `rpp` name FIELD PATHS rather than roles, and exist for one reason: a
# recorded decision that names the exact field. AD-013 says `criterion.SalesAgreement.
# performed.v1` must require `/payload/fulfillment_ref` -- not "whatever the dependency
# role happens to match on SalesAgreement". Resolving that through a role would make the
# decision depend on a regex, and widening a role to reach one field changes what every
# other record's criteria demand. They are deliberately unavailable to PHASE_SPECS, which
# is kind-level and must stay record-independent: `compose` refuses a `nfp`/`rpp` outside
# RECORD_OVERRIDES, and refuses a path the record's own schema does not declare, so a
# typo is a crash here rather than a criterion that silently checks nothing.


def spec(requires, cites, conjuncts, hard=()):
    return {"requires": requires, "cites": list(cites),
            "conjuncts": list(conjuncts), "hard": tuple(hard)}


AR = ("ar",)
AF = ("af",)

PHASE_SPECS = {

    # -- Recording, before anything is accepted. ----------------------------------
    "proposed": spec(
        "The subject's own declared identity/scope fields are recorded and a custodian "
        "is assigned. Recording is not acceptance: no judgment is required and none is "
        "sufficient, and no related record need be in any particular phase.",
        ["c-seed", "k-envelope"],
        [("nf", ["subject_identity", "custodian"]), AR]),
    "draft": spec(
        "As `proposed`, and additionally the draft's own no-answer / disposition rule "
        "is recorded before it can be offered to anyone.",
        ["c-seed", "h-packet"],
        [("nf", ["subject_identity", "custodian", "successor"]), AR]),
    "recorded": spec(
        "An append-only observation record: its source identity, capture reference and "
        "declared coverage are present, and its completeness limits are stated. "
        "Receiving it establishes attribution, not truth.",
        ["k-observation", "i-observation", "e-source"],
        [("nf", ["evidence", "uncertainty"]), ("s1", "complete_capture"), AR],
        hard=["nf"]),
    "registered": spec(
        "The registered entry names its owner and the exact scope it registers, and its "
        "structural links are acyclic; registration grants nothing.",
        ["c-seed", "s-no-self-support"],
        [("nf", ["subject_identity", "custodian"]), ("ag", ["dependency", "successor"]), AR],
        hard=["ag"]),
    "made": spec(
        "The act is attributed to an identified actor under a current authority, with "
        "its scope recorded; being made is not being accepted.",
        ["k-decision", "c-seed"],
        [("nf", ["subject_identity", "authority"]),
         ("rp", [("authority", ["accepted"], False)]), AR],
        hard=["rp"]),
    "required": spec(
        "The requirement names the exact subject it binds and the authority that "
        "imposes it; a requirement with no issuer is not a requirement.",
        ["k-decision", "w-dependency"],
        [("nf", ["subject_identity", "authority", "dependency"]), AR]),
    "potential": spec(
        "A duty that may have arisen: the beneficiary and duty source are recorded, a "
        "custodian holds it, and an inquiry deadline exists. A missing receipt leaves "
        "it potential rather than resolving it either way.",
        ["k-obl-arise", "arch3-distinctions"],
        [("nf", ["duty", "custodian"]), ("fi",), AR],
        hard=["nf"]),
    "produced": spec(
        "Output exists and is attributed to the attempt that produced it, with its "
        "captured lineage. Production is not validation.",
        ["k-artifact", "e-independence"],
        [("nf", ["evidence", "dependency"]), ("s1", "storage_admitted"), AR],
        hard=["nf"]),
    "reported": spec(
        "A report by the performer about its own work: attributable, with its unknowns "
        "and omissions recorded. The producer cannot accept its own report.",
        ["k-workorder", "e-independence"],
        [("nf", ["evidence", "uncertainty", "custodian"]), AR],
        hard=["nf"]),
    "report_submitted": spec(
        "As `reported`, and the acceptance owner is named and currently accepted -- so "
        "the independent decision has somewhere to go.",
        ["k-workorder", "e-independence"],
        [("nf", ["evidence", "uncertainty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["rp"]),
    "presented": spec(
        "The packet has actually reached the person: it carries its exact effects, its "
        "latest-decision time and its no-answer rule, and it is inside its validity "
        "window at presentation.",
        ["h-packet", "h-packet-ready"],
        [("nf", ["subject_identity", "successor", "custodian"]), ("fi",), AR],
        hard=["fi"]),
    "offered": spec(
        "The offer names its recipient and the scope offered; an offer outstanding is "
        "an exposure, so its window is bounded and current.",
        ["k-continuation", "h-participation"],
        [("nf", ["subject_identity", "custodian"]), ("fi",),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["fi"]),
    "queued": spec(
        "Admitted to a durable queue under a named service class with its own reserved "
        "capacity; queue position is not admission of the work.",
        ["w-occurrence", "arch4-admission"],
        [("nf", ["dependency", "quantity"]), AR],
        hard=["nf"]),
    "routed": spec(
        "Routed to a named recipient with the standing that lets them act; routing is "
        "not performance.",
        ["c-grievance", "w-delegation"],
        [("nf", ["custodian", "authority"]),
         ("rp", [("custodian", ["accepted"], False), ("authority", ["accepted"], False)]),
         AR],
        hard=["rp"]),

    # -- Admission and execution. -------------------------------------------------
    "admitted": spec(
        "Current authority covers this exact work, its prerequisites resolve, and the "
        "custodian's assignment and the admitting mandate are both currently accepted. "
        "Missing information becomes an investigation, never assumed readiness.",
        ["k-case-admit", "arch4-admission", "i-adapter"],
        [("nf", ["authority", "dependency", "custodian"]),
         ("rp", [("custodian", ["accepted"], False), ("authority", ["accepted"], False)]),
         AR],
        hard=["rp"]),
    "dispatched": spec(
        "Dispatched to an identified executor against a current lease and an admitted "
        "runtime; dispatch is an execution observation, never an outcome.",
        ["i-invocation", "k-workorder"],
        [("nf", ["dependency", "native", "custodian"]), ("s1", "lease_current"), AR],
        hard=["nf"]),
    "leased": spec(
        "An identified executor holds a current, unexpired lease with a monotonic "
        "epoch. An expired lease permits recovery of internal work, not repetition of "
        "an external effect.",
        ["k-workorder", "a-recovery-steps"],
        [("s1", "lease_current"), ("fi",), ("nf", ["custodian"]), AR],
        hard=["s1"]),
    "running": spec(
        "Execution is live under a current lease inside its declared window, and the "
        "resource reservation covering it is still held.",
        ["k-workorder", "w-run-states", "a-reservation"],
        [("nf", ["dependency", "quantity"]), ("s1", "lease_current"), ("fi",), AR],
        hard=["s1"]),
    "executing": spec(
        "As `running`, and the executing identity and its admitted profile are bound to "
        "the exact work; a resumed session is a new attempt.",
        ["k-workorder", "w-run-states"],
        [("nf", ["native", "dependency", "quantity"]), ("s1", "lease_current"), ("fi",), AR],
        hard=["s1"]),
    "working": spec(
        "A person or service is actually performing under an accepted scope, inside the "
        "availability window they acknowledged.",
        ["c-capacity", "h-handoff"],
        [("nf", ["custodian", "subject_identity"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "advanced": spec(
        "The cursor moved in the same protected transaction that recorded the step "
        "result; only the admitting component advances it, and heartbeat is not "
        "progress.",
        ["w-run-states"],
        [("nf", ["dependency", "evidence"]), ("s1", "lease_current"), AR],
        hard=["nf"]),
    "due": spec(
        "The occurrence's intended instant has arrived against its own declared "
        "calendar rule; a clock jump cannot create a second logical occurrence.",
        ["w-occurrence"],
        [("nf", ["deadline_end", "subject_identity"]), ("fi",), AR],
        hard=["fi"]),
    "triaged": spec(
        "The item has an assigned custodian, a recorded class and a next check time; "
        "triage decides who and when, not whether it is true.",
        ["c-grievance", "w-blocker"],
        [("nf", ["custodian", "subject_identity", "deadline_end"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["rp"]),
    "selected": spec(
        "The selection records its candidates, its eligibility reasons and the chosen "
        "fallback; a name or rank is not an eligibility reason.",
        ["w-trust-scope", "e-independence"],
        [("nf", ["subject_identity", "dependency", "evidence"]), AR],
        hard=["nf"]),

    # -- Live and current. --------------------------------------------------------
    "active": spec(
        "Every prerequisite is itself currently admitted or accepted, the subject's own "
        "validity interval contains trusted now, and the authority behind it is live. "
        "Expiry is checked live even when no timer has written the expired revision.",
        ["a-grant-life", "k08-epochs", "k-artifact"],
        [("nf", ["authority", "dependency"]),
         ("rp", [("dependency", ["admitted", "active", "accepted"], False)]),
         ("fi",), AR],
        hard=["rp"]),
    "current": spec(
        "This is the live head for its scope: its coverage closes at the named "
        "witnessed frontier with no declared gap, and its freshness bound holds.",
        ["i-cursor", "h-projection", "a-cursor-freshness"],
        [("nf", ["native", "uncertainty"]), ("s1", "complete_capture"), ("fi",), AR],
        hard=["s1"]),
    "available": spec(
        "The capability is actually reachable now: its performer/route is accepted and "
        "its availability window is current. Absence of a refusal is not availability.",
        ["c-capacity", "i-connection"],
        [("nf", ["custodian", "dependency"]),
         ("rp", [("custodian", ["accepted", "verified"], False)]), ("fi",), AR],
        hard=["rp"]),
    "activated": spec(
        "Native effect evidence exists for this exact manifest -- version readback from "
        "the thing itself. An unknown deployment stays unknown.",
        ["b-change-states", "k-protected-change"],
        [("nf", ["native", "dependency"]), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "adopted": spec(
        "Adoption rests on actual applicable demand evidence and a current accepted "
        "judgment on the stated commercial criterion; an unknown-demand provisional "
        "result cannot reach it.",
        ["c-price"],
        [("nf", ["evidence", "subject_identity"]),
         ("rp", [("evidence", ["accepted"], False)]), ("s1", "price_scope"), AF, AR],
        hard=["s1"]),
    "trial": spec(
        "A bounded trial under a specific current grant with frozen baseline, "
        "assignment and stopping rule recorded before results are seen.",
        ["b-trial", "c-price"],
        [("nf", ["dependency", "quantity", "authority"]), ("fi",), AR],
        hard=["nf"]),
    "test-authorized": spec(
        "A bounded validation offer under an exact current grant and verified delivery "
        "readiness; it is not demand-supported adoption.",
        ["c-price", "c-capacity"],
        [("nf", ["authority", "dependency"]),
         ("rp", [("authority", ["active"], False)]), ("s1", "price_scope"), ("fi",), AR],
        hard=["s1"]),
    "eligible": spec(
        "Eligibility is scoped: the exact purpose, destination and version constraints "
        "resolve, and the scope's own authority is current. Eligibility is not a score.",
        ["w-trust-scope", "e-independence"],
        [("nf", ["restriction", "authority", "dependency"]),
         ("rp", [("authority", ["accepted", "active"], False)]), AR],
        hard=["rp"]),
    "qualified": spec(
        "Qualification is evidenced against the exact criterion, by an assessor outside "
        "the producer's write authority, and the qualifying evidence is itself accepted.",
        ["c-capacity", "e-independence"],
        [("nf", ["evidence", "custodian", "subject_identity"]),
         ("rp", [("evidence", ["accepted"], False), ("custodian", ["accepted"], False)]),
         AF, AR],
        hard=["rp"]),

    # -- Readiness, which is not acceptance. --------------------------------------
    "ready": spec(
        "Every required child prerequisite resolves to a current accepted judgment on "
        "its exact subject and predicate, the dependency graph over those children is "
        "acyclic, and no activation or effect is claimed.",
        ["s-per-edge", "c-launch", "s-no-self-support"],
        [("nf", ["dependency", "evidence"]),
         ("rp", [("dependency", ["accepted", "verified"], False)]),
         ("ag", ["dependency"]), AF, AR],
        hard=["ag"]),
    "conditionally-ready": spec(
        "As `ready`, except the unmet conditions are themselves enumerated and carried "
        "rather than waived; an unstated condition is not a condition.",
        ["c-launch", "s-per-edge"],
        [("nf", ["dependency", "evidence", "uncertainty"]),
         ("rp", [("dependency", ["accepted", "verified"], False)]),
         ("ag", ["dependency"]), AF, AR],
        hard=["ag"]),
    "prepared": spec(
        "The exact partial work, its context and its next owner are preserved so a "
        "different person could continue; preparation transfers nothing.",
        ["k-continuation", "c-succession"],
        [("nf", ["dependency", "evidence", "custodian"]), ("ag", ["dependency"]), AR],
        hard=["ag"]),
    "staged": spec(
        "The exact manifest is prepared and content-addressed, with NO activation "
        "claim; staged bytes are data until an admitted worker acts on them.",
        ["b-change-states", "k-artifact"],
        [("nf", ["native", "dependency"]), ("s1", "storage_admitted"), AR],
        hard=["nf"]),
    "migration_prepared": spec(
        "The union of old and new scopes is frozen, every unconsumed preparation in it "
        "is invalidated, and every unknown hold is carried across the mapping.",
        ["a-scope-migration", "c-mapping-migration"],
        [("nf", ["dependency", "restriction", "uncertainty"]),
         ("rp", [("dependency", ["freezing", "frozen"], False)]),
         ("ag", ["dependency"]), AR],
        hard=["rp"]),

    # -- Decisions. ---------------------------------------------------------------
    "decided": spec(
        "A deciding actor whose mandate currently covers this exact scope, the options "
        "and omissions considered, and the decision inside its validity window. A "
        "decision supplies no authority the mandate does not already carry.",
        ["k-decision", "h-answer"],
        [("nf", ["authority", "custodian", "subject_identity"]),
         ("rp", [("authority", ["accepted"], False), ("custodian", ["accepted"], False)]),
         ("fi",), AR],
        hard=["rp"]),
    "determined": spec(
        "A competent issuer's scoped conclusion with its conditions, uncertainties and "
        "expiry; naming an endpoint does not create the competence.",
        ["c-seed", "s-world-propositions"],
        [("nf", ["authority", "uncertainty", "subject_identity"]),
         ("rp", [("authority", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "answered": spec(
        "The identified actor answered inside the packet's expiry against the exact "
        "current packet and subject revisions. Expiry never means consent.",
        ["h-answer", "h-no-answer"],
        [("nf", ["custodian", "subject_identity"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), ("ne", "judgment_refs"), AR],
        hard=["rp"]),
    "authorized": spec(
        "The exact current competent decision exists, no conflicting protected change "
        "is open, and the authorizer is outside the proposer's write authority.",
        ["b-change-states", "k-protected-change", "e-independence"],
        [("nf", ["authority", "custodian", "dependency"]),
         ("rp", [("authority", ["accepted"], False), ("custodian", ["accepted"], False)]),
         ("ag", ["dependency"]), AF, AR],
        hard=["rp"]),
    "approved": spec(
        "As `authorized`; approval is evidence and prerequisite, never a second grant.",
        ["k-decision", "b-change-states"],
        [("nf", ["authority", "custodian"]),
         ("rp", [("authority", ["accepted"], False), ("custodian", ["accepted"], False)]),
         AF, AR],
        hard=["rp"]),
    "direction_authorized": spec(
        "The direction change is endorsed by the actual holder of the direction domain, "
        "with the superseded purpose and its surviving duties both preserved.",
        ["k-decision", "c-goal-review"],
        [("nf", ["authority", "successor", "duty"]),
         ("rp", [("authority", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "endorsed": spec(
        "Endorsement by the authenticated holder of the direction domain against the "
        "original statement; an inferred goal cannot become endorsed intent.",
        ["k-decision", "c-goal-review"],
        [("nf", ["authority", "custodian", "subject_identity"]),
         ("rp", [("custodian", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "reviewed": spec(
        "A completed INDEPENDENT assessment exists whose findings and omissions are "
        "recorded; an inconclusive or contested assessment cannot advance past it.",
        ["b-change-states", "e-independence"],
        [("nf", ["evidence", "uncertainty", "custodian"]),
         ("rp", [("evidence", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "examined": spec(
        "Examination records what was inspected and what was not; the author cannot "
        "examine its own admission.",
        ["i-adapter", "e-independence"],
        [("nf", ["evidence", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["nf"]),
    "analyzed": spec(
        "The analysis names its population, denominator and exclusions; a result "
        "without its denominator is not an analysis.",
        ["e-closure", "b-trial"],
        [("nf", ["evidence", "uncertainty", "subject_identity"]),
         ("s1", "complete_capture"), AR],
        hard=["nf"]),
    "assessing": spec(
        "Assessment is under way by a named assessor with a recorded stopping rule; an "
        "unfinished assessment establishes nothing about its subject.",
        ["e-judgment-states", "e-question"],
        [("nf", ["custodian", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "distinguished": spec(
        "The competing scopes have been separated on entity, time, conditions, units and "
        "source authority; different scopes may both remain valid.",
        ["e-contradiction"],
        [("nf", ["subject_identity", "dispute", "evidence"]), AR],
        hard=["nf"]),

    # -- Acceptance. --------------------------------------------------------------
    "accepted": spec(
        "A current accepted EvidenceJudgment on THIS criterion, the deciding authority "
        "currently accepted, and the evidence base closed. Producer success alone "
        "cannot accept; an accepted report about uncertainty cannot pass this guard.",
        ["k-acceptance-guard", "k-case-wait", "s-acceptance"],
        [("nf", ["evidence", "authority", "subject_identity"]),
         ("rp", [("evidence", ["accepted"], False), ("authority", ["accepted"], False)]),
         AF, AR],
        hard=["rp"]),
    "validated": spec(
        "A recorded domain acceptance decision against the catalog's substantive "
        "condition by the responsible acceptance role, with the validated lineage "
        "published against current epochs. A generic write is not validation.",
        ["c-seed", "k-artifact", "k08-epochs"],
        [("nf", ["evidence", "dependency", "custodian"]),
         ("rp", [("dependency", ["active", "accepted"], False)]),
         ("s1", "storage_admitted"), AF, AR],
        hard=["rp"]),
    "verified": spec(
        "Independently observed conformance against the declared predicates -- actual "
        "acknowledged availability, competence and exercised access, not a compute "
        "check and not the producer's own report.",
        ["c-capacity", "b-change-states", "e-independence"],
        [("nf", ["evidence", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "verified_with_limits": spec(
        "As `verified`, with the unmet or unobserved dimensions enumerated and carried "
        "rather than averaged away.",
        ["c-capacity", "e-independence"],
        [("nf", ["evidence", "custodian", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "confirmed": spec(
        "Confirmed against an independently held observation, not against the assertion "
        "being confirmed.",
        ["e-independence", "s-world-propositions"],
        [("nf", ["evidence"]), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "confirmed-with-limits": spec(
        "A competent assessor states the exact proposition, its evidence AND its limits; "
        "the limits are part of the finding, not a footnote to it.",
        ["h-assessment"],
        [("nf", ["evidence", "uncertainty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]), AF, AR],
        hard=["nf"]),
    "supported": spec(
        "A qualified assessor produced a supported revision with reasons over the "
        "supporting and opposing references; a repeated statement is not support.",
        ["k-claim-state"],
        [("nf", ["evidence", "dispute", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]), AF, AR],
        hard=["nf"]),
    "satisfied": spec(
        "The stated predicate is met by evidence of the kind it names, and the "
        "prerequisite it discharges is itself current.",
        ["k-acceptance-guard", "w-dependency"],
        [("nf", ["subject_identity", "evidence", "dependency"]),
         ("rp", [("dependency", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "acknowledged": spec(
        "The identified recipient acknowledged this exact scope. Acknowledgment of "
        "receipt is not acceptance of responsibility, and it transfers nothing.",
        ["h-handoff", "w-delegation", "k11-transfer"],
        [("nf", ["custodian", "subject_identity"]),
         ("rp", [("custodian", ["accepted"], False)]), ("ne", "judgment_refs"), AR],
        hard=["rp"]),

    # -- Observed effect in the world. --------------------------------------------
    "achieved": spec(
        "OBSERVED benefit against the subject's own success predicate, natively "
        "correlated to this exact subject. Completion of tasks is not achievement, and "
        "the sum of accepted subtasks is not the outcome.",
        ["arch6-acceptance", "s-per-edge", "s-world-propositions"],
        [("nf", ["subject_identity"]), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "observed": spec(
        "A protected capture, correlated by exact adapter/account/business key to this "
        "subject, records the result. A status code is an observation whose business "
        "meaning comes from the evidence contract.",
        ["a-http200", "a-attempt-observed", "s-per-edge"],
        [("nf", ["native", "evidence"]), ("nc", "observed_applied"),
         ("s1", "complete_capture"), AR],
        hard=["nc"]),
    "delivered": spec(
        "Independently observed delivery against the agreed criteria, with the "
        "counterparty acknowledgment the promise requires. A silent customer acquires no "
        "new discharge meaning, and partial receipts do not complete the order.",
        ["c-fulfillment", "arch6-acceptance"],
        [("nf", ["subject_identity", "duty", "evidence"]),
         ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "performed": spec(
        "Actual performance by the accepted performer, observed independently of the "
        "performer's own report.",
        ["c-fulfillment", "e-independence"],
        [("nf", ["custodian", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("nc", "observed_applied"), AR],
        hard=["nc"]),
    "partially-performed": spec(
        "Part of the promise is observed complete and the remainder is still owed, with "
        "the outstanding scope named. Partial is not complete.",
        ["c-fulfillment"],
        [("nf", ["duty", "evidence", "uncertainty"]),
         ("nc", "observed_applied"), AR],
        hard=["nc"]),
    "settled": spec(
        "External settlement, established by exact native correlation to the provider's "
        "own object -- not by a company status and not by a receipt alone.",
        ["s-per-edge", "a-http200"],
        [("nf", ["native", "quantity"]), ("nc", "observed_applied"),
         ("s1", "complete_capture"), AF, AR],
        hard=["nc"]),
    "posted": spec(
        "The entry is posted and its batch balances per currency and ledger against its "
        "original sources; a balanced journal establishes nothing about compliance.",
        ["c-seed"],
        [("nf", ["quantity", "evidence", "dependency"]),
         ("s1", "resource_equation"), AR],
        hard=["s1"]),
    "balanced": spec(
        "Reserved plus consumed plus uncertain does not exceed the authorized total, in "
        "each account's own canonical unit, reconciled against actual observations.",
        ["a-reservation"],
        [("nf", ["quantity"]), ("s1", "resource_equation"), AR],
        hard=["s1"]),
    "transport_observed": spec(
        "Protected capture records at least one admitted packet or request-stage "
        "observation. This is transport, NOT business effect.",
        ["a-attempt-observed"],
        [("nf", ["native"]), ("nc", "transport_observed"), ("s1", "complete_capture"), AR],
        hard=["nc"]),
    "response_recorded": spec(
        "A bounded provider response correlated to this exact request and account is "
        "captured; the response is evidence, not an outcome.",
        ["a-attempt-observed", "a-http200"],
        [("nf", ["native", "evidence"]), ("nc", "response_received"), AR],
        hard=["nc"]),
    "reconciled_applied": spec(
        "A qualified native observation determines that the effect WAS applied, and the "
        "new duties it creates are recorded.",
        ["a-attempt-observed"],
        [("nf", ["native", "duty", "evidence"]), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "reconciled": spec(
        "Competent evidence resolved the entitlement, amount, standing and descendant "
        "effects; only capacity and claims PROVEN free are released.",
        ["a-release-steps", "a-op-states"],
        [("nf", ["quantity", "duty", "evidence"]),
         ("s1", "resource_equation"), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "repaired": spec(
        "The authorized repair was performed AND the resulting customer condition was "
        "checked; performing a remedy is not the same as the remedy working.",
        ["c-grievance", "h-stop"],
        [("nf", ["evidence", "duty"]), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "verified_repaired": spec(
        "As `repaired`, and independently verified by someone outside the repairing "
        "party.",
        ["c-grievance", "e-independence"],
        [("nf", ["evidence", "duty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),

    # -- Discharge and transfer, which are not reported performance. --------------
    "performing": spec(
        "Performance is under way by the accountable custodian; the exact duty and "
        "beneficiary remain unchanged, including any disputed flag.",
        ["k-obl-perform", "arch3-distinctions"],
        [("nf", ["duty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "performance_reported": spec(
        "The performer REPORTED performance. This is testimony about performance, is "
        "recorded as such, and cannot discharge the duty.",
        ["k-obl-discharge", "arch3-distinctions"],
        [("nf", ["duty", "evidence", "custodian"]), AR],
        hard=["nf"]),
    "recognized": spec(
        "Evidence that the duty actually arose, with the beneficiary, the duty source "
        "and the custodian all named. A missing receipt leaves it potential.",
        ["k-obl-arise"],
        [("nf", ["duty", "custodian", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "discharged": spec(
        "AUTHORIZED evidence of ACTUAL discharge, natively correlated, with the "
        "discharge authority currently accepted. Internal task acceptance, owner absence "
        "and timeouts cannot discharge; parking and closure never discharge external "
        "standing.",
        ["k-obl-discharge", "k11-transfer", "arch3-distinctions"],
        [("nf", ["duty", "authority", "evidence"]),
         ("rp", [("authority", ["accepted"], False), ("custodian", ["accepted"], False)]),
         ("nc", "observed_applied"), AF, AR],
        hard=["nc", "rp"]),
    "transferred": spec(
        "A legitimate ACKNOWLEDGED transfer: the recipient is identified and accepted, "
        "their access and competence were checked, and they explicitly accepted the "
        "scope. Delivery of a message cannot perform that join.",
        ["k-obl-discharge", "h-handoff", "k11-transfer"],
        [("nf", ["duty", "custodian", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("ne", "judgment_refs"), AF, AR],
        hard=["rp"]),
    "transfer_pending": spec(
        "Transfer is offered and not yet accepted: the old custodian still holds the "
        "unfinished scope, and the offer has a bounded deadline.",
        ["k-obl-perform", "h-handoff"],
        [("nf", ["duty", "custodian", "successor"]), ("fi",), AR],
        hard=["nf"]),

    # -- Closure. -----------------------------------------------------------------
    "closed": spec(
        "Every surviving duty has an actual disposition and a named accepted custodian, "
        "and redress remains reachable. Stopping processes cannot fulfil duties.",
        ["arch6-closure", "c-closure", "k11-transfer"],
        [("nf", ["duty", "custodian", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AF, AR],
        hard=["rp"]),
    "closed-with-residuals": spec(
        "As `closed`, and the residual scope is inventoried with an actual custodian, "
        "funding and review dates. It cannot be advertised as no remaining "
        "responsibility.",
        ["c-closure", "arch6-closure"],
        [("nf", ["duty", "custodian", "uncertainty", "quantity"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AF, AR],
        hard=["rp"]),
    # AD-014. The same requirement `ended_with_residuals` states, at the phase name a
    # terminated agreement uses. It is kind-level and not a record override on purpose:
    # `terminated` is a closure event wherever it appears, and a residuals state that
    # only one record could reach would invite the next record to settle the question
    # silently by writing a guard, which is exactly how G2-02 arose.
    "terminated_with_residuals": spec(
        "As `terminated` -- forward performance has ended -- except that the transitive "
        "due set is NOT empty. Every surviving obligation, claim, reservation, descendant "
        "and pending operation is carried on the record with an accepted custodian for "
        "each, its funding and its review interval. This phase asserts that duties "
        "survive; `terminated` asserts that none do, and the difference is the whole "
        "point of having both.",
        ["c-closure", "arch6-closure", "arch4-revocation"],
        [("nf", ["duty", "custodian", "uncertainty", "quantity"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("fi",), AF, AR],
        hard=["rp"]),
    "closed_with_residuals": spec(
        "As `closed-with-residuals`; this spelling is the same requirement.",
        ["c-closure", "arch6-closure"],
        [("nf", ["duty", "custodian", "uncertainty", "quantity"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AF, AR],
        hard=["rp"]),
    "ended": spec(
        "New liabilities stop and existing duties keep a real performer or a legitimate "
        "disposition; an honest list of incapacity is a failed outcome, not an ending.",
        ["arch6-closure", "c-closure"],
        [("nf", ["duty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "ended_with_residuals": spec(
        "As `ended`, with the unresolved scope, its funding and its review dates carried "
        "explicitly.",
        ["c-closure"],
        [("nf", ["duty", "custodian", "uncertainty", "quantity"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AF, AR],
        hard=["rp"]),
    "accepted_residual": spec(
        "An owner with the standing to do so accepted a named residual defect through an "
        "explicit scoped disposition, preserving dissent and an expiry.",
        ["c-closure", "e-independence"],
        [("nf", ["uncertainty", "authority", "dispute"]),
         ("rp", [("authority", ["accepted"], False)]), ("fi",), AF, AR],
        hard=["rp"]),
    "verified_with_residuals": spec(
        "Verification succeeded for part of the scope and the unverified remainder is "
        "named and still owned.",
        ["c-capacity", "c-closure"],
        [("nf", ["evidence", "uncertainty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "disposed": spec(
        "A real disposition of this occurrence is recorded -- what was intended, what "
        "actually happened, and what duty remains. Not marked complete because the next "
        "occurrence started.",
        ["w-occurrence", "c-closure"],
        [("nf", ["duty", "uncertainty", "successor"]), AF, AR],
        hard=["nf"]),
    "disposition_issued": spec(
        "A competent, attributable disposition with its reasons and the escalation route "
        "that survives it.",
        ["c-grievance", "k-case-dispute"],
        [("nf", ["authority", "successor", "custodian"]),
         ("rp", [("authority", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "terminated": spec(
        "Termination fences future work AND preserves already authorized or possibly "
        "applied effects; it does not assert that they did not happen.",
        ["arch4-revocation", "b-rollback"],
        [("nf", ["restriction", "duty", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "complete": spec(
        "The declared completion predicate holds over the whole scope, with no "
        "outstanding unit and no missing interval.",
        ["c-terminal-acceptance", "w-occurrence"],
        [("nf", ["subject_identity", "evidence"]), ("s1", "complete_capture"), AF, AR],
        hard=["s1"]),
    "completed": spec(
        "Completion follows the actual acceptance of the work, not the cursor reaching "
        "the end of the definition.",
        ["w-run-states", "w-occurrence"],
        [("nf", ["evidence", "dependency"]),
         ("rp", [("dependency", ["accepted"], False)]), AF, AR],
        hard=["rp"]),

    # -- Restriction, which preserves duties. -------------------------------------
    "restricted": spec(
        "The restriction reason and its exact scope are recorded, the affected "
        "restrictive epoch is incremented with a durable propagation task, the surviving "
        "duties keep a named accepted custodian, and the record's storage/retention "
        "classification is admitted. Restrictive action preserves duties.",
        ["a-invalidation", "s-per-edge", "s-restriction-reads"],
        [("nf", ["restriction", "duty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("s1", "storage_admitted"), AR],
        hard=["nf", "rp"]),
    "retained-restricted": spec(
        "Continuing lawful retention with an actual retention basis, an expiry and a "
        "review; retained evidence is not called deleted.",
        ["a-deletion-scope", "s-restriction-reads"],
        [("nf", ["restriction", "authority", "uncertainty"]),
         ("rp", [("authority", ["accepted"], False)]), ("fi",),
         ("s1", "storage_admitted"), AR],
        hard=["fi"]),
    "invalidated": spec(
        "The complete derivative closure is enumerated at a verified frontier before the "
        "invalidation stands; a delayed background traversal cannot be the sole guard.",
        ["a-invalidation", "e-closure", "k08-epochs"],
        [("nf", ["restriction", "dependency"]),
         ("s1", "complete_capture"), ("ag", ["dependency"]), AR],
        hard=["s1"]),
    "deletion_pending": spec(
        "The deletion scope names every source, derived, copied, exported, backup and "
        "native-retention target, and the unknown provider-held copies are recorded "
        "rather than assumed absent.",
        ["a-deletion-scope", "e-forget"],
        [("nf", ["restriction", "dependency", "uncertainty"]),
         ("s1", "complete_capture"), AR],
        hard=["nf"]),
    "tombstoned": spec(
        "Scoped receipts exist for each declared physical class, and the residual "
        "retention that survives them is stated. Key destruction is not proof that "
        "plaintext copies vanished.",
        ["a-deletion-scope", "e-forget"],
        [("nf", ["restriction", "evidence", "uncertainty"]),
         ("s1", "storage_admitted"), ("nc", "observed_applied"), AR],
        hard=["nc"]),
    "suspended": spec(
        "Suspension halts new use and RETAINS the descendants and duties; returning to "
        "active requires a new current authorization revision, not the lifting of a "
        "flag.",
        ["a-grant-life", "a-containment"],
        [("nf", ["restriction", "duty", "authority"]),
         ("rp", [("authority", ["accepted"], False)]), AR],
        hard=["nf"]),
    "revoked": spec(
        "Future claims are denied AND the descendants are enumerated and contained; a "
        "revoked parent is not proof that a minted token, resource policy or scheduled "
        "job lost authority. Revoked authority never reactivates.",
        ["a-containment", "a-grant-life", "a-descendants"],
        [("nf", ["restriction", "native", "uncertainty"]),
         ("s1", "complete_capture"), ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "quarantined": spec(
        "Quarantine is immediate on the named trigger and records which unmet predicate "
        "fired; the quarantined thing keeps its unresolved effects.",
        ["i-circuit", "i-connection"],
        [("nf", ["restriction", "uncertainty", "evidence"]), AR],
        hard=["nf"]),
    "contained": spec(
        "Containment is verified independently at the native boundary, and the residual "
        "authority that could not be enumerated is recorded as unknown rather than "
        "assumed zero.",
        ["a-containment", "a-descendants"],
        [("nf", ["restriction", "native", "uncertainty"]),
         ("nc", "observed_applied"), ("s1", "complete_capture"), AR],
        hard=["nc"]),
    "containment_requested": spec(
        "A request is recorded with its scope and requester; a request is not an "
        "enforcement observation and must be shown separately from one.",
        ["a-containment", "h-stop"],
        [("nf", ["restriction", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["rp"]),
    "containment_authorized": spec(
        "Containment is authorized by a standing that actually carries it, for an exact "
        "scope and a bounded interval.",
        ["a-containment", "c-grievance"],
        [("nf", ["restriction", "authority"]),
         ("rp", [("authority", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "suspension_authorized": spec(
        "A justified suspension distinguished from an allegation and from an expiring "
        "containment, authorized by the competent standing for a bounded interval.",
        ["c-grievance", "a-containment"],
        [("nf", ["restriction", "authority", "dispute"]),
         ("rp", [("authority", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "frozen": spec(
        "The union of affected scopes is frozen: new preparation, release and claim on "
        "that union are prevented and the outstanding items are captured.",
        ["a-scope-migration", "c-mapping-migration"],
        [("nf", ["restriction", "dependency", "uncertainty"]),
         ("rp", [("dependency", ["freezing", "frozen", "active"], False)]), AR],
        hard=["rp"]),
    "freezing": spec(
        "The freeze is ordered and its union is being captured; no timeout advances it.",
        ["a-scope-migration"],
        [("nf", ["restriction", "dependency"]),
         ("rp", [("dependency", ["active"], False)]), AR],
        hard=["rp"]),
    "sealing": spec(
        "Sealing is in progress at the surviving witness: new release and claim receipts "
        "are denied while the old windows are still being waited out.",
        ["a-membership", "a-recovery-steps"],
        [("nf", ["native", "restriction"]), ("fi",), AR],
        hard=["nf"]),
    "sealed": spec(
        "The generation is sealed and never reactivates; its old receipts cannot "
        "authorize a new generation.",
        ["a-membership", "a-recovery-steps"],
        [("nf", ["native", "restriction", "uncertainty"]),
         ("s1", "complete_capture"), ("not", ("fi",)), AR],
        hard=["not"]),
    "lifted": spec(
        "The restriction is lifted only by a NEW current authorization revision naming "
        "the exact scope; it is not the expiry of the old one.",
        ["a-grant-life", "c-pause"],
        [("nf", ["restriction", "authority", "successor"]),
         ("rp", [("authority", ["accepted"], False)]), ("fi",), AF, AR],
        hard=["rp"]),

    # -- Supersession. ------------------------------------------------------------
    "superseded": spec(
        "A successor revision exists and is itself live, the change reason is recorded, "
        "and the successor/predecessor links are acyclic. Superseding does not erase "
        "history or silently migrate relationships.",
        ["k-supersede", "k-terminal", "s-no-self-support"],
        [("nf", ["successor"]),
         ("rp", [("successor", ["proposed", "active", "accepted"], False)]),
         ("ag", ["successor"]), AR],
        hard=["nf", "ag"]),
    "withdrawn": spec(
        "Withdrawal admits only a new successor: the original stays historical with its "
        "reasons, and nothing depends on the withdrawn revision as current.",
        ["k-judgment-stale", "k-supersede"],
        [("nf", ["successor", "uncertainty"]),
         ("rp", [("successor", ["proposed"], False)]),
         ("ag", ["successor"]), AR],
        hard=["ag"]),
    "corrected": spec(
        "A correction preserves the original words and effective time, classifies "
        "changed intent versus corrected fact, and identifies the dependent work that "
        "must be rechecked.",
        ["e-reopen", "k-supersede"],
        [("nf", ["successor", "dependency", "evidence"]),
         ("rp", [("successor", ["accepted", "active"], False)]),
         ("ag", ["successor", "dependency"]), AR],
        hard=["ag"]),
    "rolled_back": spec(
        "Rollback is permitted only where current schema, meaning and live obligations "
        "allow it, and the intervening effects are reconciled rather than undone; a "
        "revert cannot recall a disclosure, send or payment.",
        ["b-rollback"],
        [("nf", ["successor", "duty", "uncertainty"]),
         ("rp", [("successor", ["accepted"], False)]),
         ("not", ("nc", "observed_applied")), AF, AR],
        hard=["not"]),
    "rollback_required": spec(
        "An activated change must be rolled back: the affected in-flight scope and its "
        "unaccounted effects are named before anything is reverted.",
        ["b-rollback", "b-stop"],
        [("nf", ["duty", "uncertainty", "dependency"]),
         ("rp", [("dependency", ["activated", "verified"], False)]), AR],
        hard=["rp"]),

    # -- Retirement and removal. --------------------------------------------------
    "retired": spec(
        "Remaining work is reassigned to a named accepted successor, the dependent "
        "descendants are enumerated completely, and the replacement's own readiness is "
        "evidenced. Deleting a name is not retirement, and removal discharges no duty.",
        ["w-retire-skill", "k-removal", "i-removal"],
        [("nf", ["successor", "duty", "custodian"]),
         ("rp", [("successor", ["accepted", "active"], False),
                 ("custodian", ["accepted"], False)]),
         ("s1", "complete_capture"), AF, AR],
        hard=["rp", "s1"]),
    "retired-with-residuals": spec(
        "As `retired`, and the residual duties that no successor took are named with "
        "their custodian and review date.",
        ["k-removal", "c-closure"],
        [("nf", ["successor", "duty", "custodian", "uncertainty"]),
         ("rp", [("successor", ["accepted", "active"], False),
                 ("custodian", ["accepted"], False)]),
         ("s1", "complete_capture"), ("fi",), AF, AR],
        hard=["rp"]),
    "removed": spec(
        "Removal enumerates every dependent object and unresolved operation, assigns "
        "replacement performance for existing duties, and verifies the native-side "
        "deletion rather than assuming it.",
        ["i-removal", "k-removal"],
        [("nf", ["dependency", "duty", "native"]),
         ("s1", "complete_capture"), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    "draining": spec(
        "New admissions are frozen while unknown effects and descendants are still being "
        "accounted for; draining is not removed.",
        ["i-adapter", "i-removal"],
        [("nf", ["restriction", "uncertainty", "dependency"]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "exhausted": spec(
        "The declared allowance is spent in its own unit; a provider reset, new revision "
        "or delegated child cannot refill it.",
        ["k-manifest", "a-reservation"],
        [("nf", ["quantity"]), ("s1", "resource_equation"),
         ("not", ("fi",)), AR],
        hard=["s1"]),
    "budget_exhausted": spec(
        "As `exhausted`, and the unknown metered consumption still holds the maximum "
        "authorized remainder until reconciled.",
        ["a-reservation"],
        [("nf", ["quantity", "uncertainty"]), ("s1", "resource_equation"),
         ("not", ("fi",)), AR],
        hard=["s1"]),
    "unavailable": spec(
        "The capability has no admitted implementation or no reachable performer. "
        "Unavailable is a stated operating fact with its own consequence, and a fixture "
        "cannot change it to available.",
        ["c-capacity", "i-adapter"],
        [("nf", ["uncertainty", "dependency"]),
         ("not", ("rp", [("custodian", ["accepted"], False)])), AR],
        hard=["not"]),

    # -- Expiry, which needs actual deadline evidence. ----------------------------
    "expired": spec(
        "The subject's OWN declared validity bounds exist and trusted now is outside "
        "them. Expiry needs actual deadline evidence, is checked live, and is not a "
        "timer having fired.",
        ["s-per-edge", "a-grant-life", "e-staleness"],
        [("nf", ["deadline_end"]), ("not", ("fi",)), AR],
        hard=["nf", "not"]),
    "expired_unsent": spec(
        "The declared window passed with no claim in the current complete order, and "
        "eligibility is fenced. Missing logs are not proof of unsent.",
        ["a-attempt-states", "a-op-states"],
        [("nf", ["deadline_end", "native"]), ("not", ("fi",)),
         ("s1", "complete_capture"), AR],
        hard=["not"]),
    "expired_without_claim": spec(
        "Only with a current COMPLETE frontier proving no claim and complete "
        "old-generation and gateway fencing. Absence from a lagging index is not proof.",
        ["a-op-states", "a-recovery-steps"],
        [("nf", ["deadline_end", "native", "restriction"]), ("not", ("fi",)),
         ("s1", "complete_capture"), AR],
        hard=["not", "s1"]),
    "missed": spec(
        "The occurrence's own deadline passed without the work; the lateness and the "
        "remaining duty are recorded, and the next occurrence does not mark it complete.",
        ["w-occurrence"],
        [("nf", ["deadline_end", "duty"]), ("not", ("fi",)), AR],
        hard=["not"]),
    "stale": spec(
        "The declared review deadline passed without revalidation, so current "
        "eligibility is lost. Staleness is a validity flag, not a truth verdict, and "
        "time passing alone cannot renew the claim.",
        ["e-staleness", "k-claim-state", "s-stale-status"],
        [("nf", ["deadline_end", "evidence"]), ("not", ("fi",)),
         ("rp", [("dependency", ["restricted", "invalidated", "superseded"], True)]), AR],
        hard=["not"]),

    # -- Unknown, which is a positive statement about what is not established. ----
    "unknown": spec(
        "The enumeration is POSITIVELY recorded as incomplete and no native correlation "
        "establishes the fact. Unknown is not zero, not false and not unlimited.",
        ["a-descendants", "arch3-distinctions"],
        [("nf", ["uncertainty"]), ("not", ("nc", "observed_applied")), AR],
        hard=["nf", "not"]),
    "unknown_effect": spec(
        "A claim was made and no positive proof narrows it: holds and duties survive. "
        "Absence of a response or a log is insufficient.",
        ["a-attempt-states", "a-op-states"],
        [("nf", ["uncertainty", "duty", "native"]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "effect_unknown": spec(
        "As `unknown_effect`; this spelling is the same requirement.",
        ["a-attempt-states"],
        [("nf", ["uncertainty", "duty", "native"]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "uncertain": spec(
        "Uncertainty holds capacity until evidence permits release; it cannot be cleared "
        "by expiry.",
        ["a-reservation"],
        [("nf", ["uncertainty", "quantity"]), ("s1", "resource_equation"),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "residual_unknown": spec(
        "Enumeration or containment was incomplete, so residual authority is recorded as "
        "unknown, the affected scopes stay held, and continuity is invoked.",
        ["a-descendants", "a-containment"],
        [("nf", ["uncertainty", "restriction", "native"]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "unknown_material": spec(
        "A material interaction class could not be classified, so the affected effect is "
        "blocked and the semantic-maintenance inquiry is owned. The catalog is not "
        "assumed complete.",
        ["a-scope-migration", "e-question"],
        [("nf", ["uncertainty", "dependency", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "visibility_gap": spec(
        "Telemetry or capture is missing, which is itself a finding: expansion is blocked "
        "and the gap is owned rather than read as nothing happened.",
        ["b-stop", "h-projection"],
        [("nf", ["uncertainty", "custodian"]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "gapped": spec(
        "The cursor's declared coverage has an enumerated gap; a webhook heartbeat "
        "cannot prove no missing events.",
        ["i-cursor"],
        [("nf", ["uncertainty", "native"]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "incomplete": spec(
        "Coverage does not close at the named frontier and the missing strata are "
        "listed; a known subtotal is reported instead of a complete total.",
        ["arch5-evidence", "e-closure"],
        [("nf", ["uncertainty", "evidence"]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not", "nf"]),
    "no_match": spec(
        "No candidate satisfied the exact declared key, and the search scope that was "
        "actually examined is recorded. Not found differs from not searched.",
        ["e-question"],
        [("nf", ["uncertainty", "subject_identity"]),
         ("not", ("ne", "judgment_refs")), AR],
        hard=["not"]),
    "unresolved": spec(
        "The discriminating observation is still missing and the next check is owned; "
        "silence, a new timer or a new worker name cannot resolve it.",
        ["w-blocker", "e-question"],
        [("nf", ["uncertainty", "custodian", "deadline_end"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("ne", "judgment_refs")), AR],
        hard=["not"]),

    # -- Waiting and blocking. ----------------------------------------------------
    "waiting": spec(
        "Execution is suspended on a NAMED dependency with a deadline, and its custodian "
        "is accepted; waiting is not progress and not failure.",
        ["k-case-wait", "w-run-states", "w-blocker"],
        [("nf", ["dependency", "custodian", "deadline_end"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["nf"]),
    "waiting-for-evidence": spec(
        "The missing evidence AND its observer are named, with a deadline. Bounded work "
        "to obtain it is what returns the subject to active.",
        ["k-case-wait"],
        [("nf", ["evidence", "custodian", "deadline_end", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["nf"]),
    "awaiting_evidence": spec(
        "As `waiting-for-evidence`; this spelling is the same requirement.",
        ["k-case-wait", "w-blocker"],
        [("nf", ["evidence", "custodian", "deadline_end", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["nf"]),
    "awaiting_dependency": spec(
        "The blocking dependency is identified by exact ref, with who can supply the "
        "result and when it is next checked.",
        ["w-blocker", "w-dependency"],
        [("nf", ["dependency", "custodian", "deadline_end"]),
         ("rp", [("dependency", ["proposed", "admitted", "active"], False)]),
         ("fi",), AR],
        hard=["rp"]),
    "awaiting_input": spec(
        "The exact missing fact or decision is named, with the person who must supply it "
        "and the default behaviour if they do not.",
        ["w-blocker", "h-no-answer"],
        [("nf", ["uncertainty", "custodian", "successor"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["nf"]),
    "blocked": spec(
        "Exactly what cannot proceed, what would unblock it, who can provide that, and "
        "the due impact. Unknown cause differs from known impossibility.",
        ["w-blocker"],
        [("nf", ["dependency", "uncertainty", "custodian", "deadline_end"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["nf"]),
    "open": spec(
        "The blocker is stated with its unblocking predicate and its due impact; only "
        "supported evidence can later satisfy that predicate.",
        ["w-blocker"],
        [("nf", ["subject_identity", "uncertainty", "custodian"]), AR],
        hard=["nf"]),
    "investigating": spec(
        "A named investigator is working a bounded inquiry with a recorded next "
        "discriminator and stopping rule. Existing alone, an investigation cannot suspend "
        "valid service.",
        ["w-blocker", "e-question", "c-grievance"],
        [("nf", ["uncertainty", "custodian", "dependency"]),
         ("rp", [("custodian", ["accepted"], False)]), ("fi",), AR],
        hard=["rp"]),
    "accepted_limit": spec(
        "A limit is accepted with authority: the affected work is parked or narrowed AND "
        "duty ownership is preserved.",
        ["w-blocker"],
        [("nf", ["uncertainty", "duty", "authority"]),
         ("rp", [("authority", ["accepted"], False)]), AF, AR],
        hard=["rp"]),
    "acceptance_pending": spec(
        "The work is finished and the INDEPENDENT acceptance owner has not decided. The "
        "producer's own completion cannot stand in for that decision.",
        ["w-run-states", "e-independence"],
        [("nf", ["custodian", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("ne", "judgment_refs")), AR],
        hard=["not"]),
    "acceptance-pending": spec(
        "As `acceptance_pending`; this spelling is the same requirement.",
        ["w-run-states", "e-independence"],
        [("nf", ["custodian", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("ne", "judgment_refs")), AR],
        hard=["not"]),

    # -- Parking, pausing, holding. -----------------------------------------------
    "parked": spec(
        "An AUTHORIZED reason, a next review or closure account, and every surviving "
        "duty keeping a named accepted custodian. No obligation disappears, and parking "
        "never discharges external standing.",
        ["k-case-park", "k11-transfer", "c-pause"],
        [("nf", ["duty", "custodian", "successor"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["potential", "recognized", "performing"], True)]),
         ("fi",), AR],
        hard=["rp", "fi"]),
    "paused": spec(
        "New-work authority is withdrawn while active support, data, payment and "
        "reporting duties are retained; resuming requires reconciling stale assumptions, "
        "not flipping the flag back.",
        ["c-pause", "i-connection"],
        [("nf", ["restriction", "duty", "authority"]),
         ("rp", [("duty", ["potential", "recognized", "performing"], True)]), AR],
        hard=["rp"]),
    "held": spec(
        "Reservations across every resource dimension are taken and the potential "
        "obligations with their custodians and deadlines are created. Nothing external "
        "has been invoked.",
        ["a-release-steps", "a-op-states", "arch3-distinctions"],
        [("nf", ["quantity", "duty", "dependency"]), ("rc", "held"),
         ("s1", "resource_equation"), AR],
        hard=["rc"]),

    # -- Abandonment and cancellation. --------------------------------------------
    "abandoned": spec(
        "The current custodian, the allowed cleanup, the remaining deadlines and the "
        "reopening condition are all identified, and no released effect is left "
        "unreconciled. An abandoned subject admits only a successor; nothing restores "
        "its old grant or allowance.",
        ["w-abandon", "k-case-successor", "k-case-park"],
        [("nf", ["custodian", "duty", "deadline_end"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not", "rp"]),
    "cancelled": spec(
        "Not-yet-dispatched work is cancelled and admitted workers are asked to stop; an "
        "expired lease fences writes but does not prove no external effect.",
        ["k-workorder-stop", "w-abandon", "h-stop"],
        [("nf", ["custodian", "restriction", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "cancelled_before_release": spec(
        "Only after witnessed release of PROVEN unused reservations; before that the "
        "holds stand.",
        ["a-op-states", "a-reservation"],
        [("nf", ["quantity", "native"]), ("rc", "cancelled_before_release"),
         ("s1", "resource_equation"), ("not", ("nc", "observed_applied")), AR],
        hard=["rc", "not"]),
    "stopped": spec(
        "Worker cessation is OBSERVED, which is a separate fact from the stop request "
        "and from the reconciliation of released effects.",
        ["h-stop", "w-abandon"],
        [("nf", ["custodian", "uncertainty"]), ("nc", "observed_not_applied"), AR],
        hard=["nc"]),
    "stop_required": spec(
        "A critical trigger fired -- invariant violation, unexpected "
        "principal/destination/charge mode, evidence integrity failure or an unaccounted "
        "effect -- and exposure freezes immediately.",
        ["b-stop", "h-stop"],
        [("nf", ["restriction", "uncertainty", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["nf"]),
    "interrupted": spec(
        "Interruption records the completed and partial work, the exact next action and "
        "the unknowns; it does not establish that remote work stopped.",
        ["h-participation", "i-invocation"],
        [("nf", ["uncertainty", "evidence", "successor"]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "declined": spec(
        "The person declined. Declining is a visible coverage limit and establishes "
        "neither incompetence nor freedom from the duty.",
        ["h-participation"],
        [("nf", ["custodian", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("ne", "judgment_refs")), AR],
        hard=["not"]),

    # -- Adverse assessment. ------------------------------------------------------
    "rejected": spec(
        "A COMPLETED assessment establishing that the subject fails its exact criterion, "
        "with the defect evidence recorded, and NO current acceptance standing for this "
        "same criterion.",
        ["k-judgment", "e-judgment-states", "c-assessment-states"],
        [("nf", ["evidence", "uncertainty"]),
         ("rp", [("evidence", ["accepted"], False)]),
         ("not", AF), AR],
        hard=["not", "rp"]),
    "unsupported": spec(
        "A qualified assessor produced an unsupported revision with reasons over the "
        "supporting and opposing references; this is an adverse finding, not an absence "
        "of one.",
        ["k-claim-state"],
        [("nf", ["evidence", "dispute", "custodian"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", AF), AR],
        hard=["not"]),
    "failed": spec(
        "The failure record names the error class, the exact versions, the observed "
        "cause, the unknowns and the next discriminator. Two failures with one cause "
        "open a blocker; they do not prove impossibility.",
        ["w-failure", "w-run-states"],
        [("nf", ["evidence", "uncertainty", "dependency"]),
         ("not", AF), AR],
        hard=["not", "nf"]),
    "refused": spec(
        "A refusal records the exact unmet authority, standing or capacity predicate, "
        "and it consumes its actual causal resources.",
        ["i-circuit", "i-invocation"],
        [("nf", ["authority", "uncertainty", "quantity"]),
         ("not", AF), AR],
        hard=["not"]),
    "denied": spec(
        "Denial preserves the prior status, the typed reason and every existing duty and "
        "hold; the request itself remains recorded and routed.",
        ["arch4-revocation", "k-case-park"],
        [("nf", ["duty", "successor", "restriction"]),
         ("not", AF), AR],
        hard=["not"]),
    "inconclusive": spec(
        "A COMPLETED assessment that cannot establish its subject predicate: its "
        "evidence base and omissions are recorded and its coverage explicitly does not "
        "close. Accepting this report accepts only this report.",
        ["k-judgment", "e-judgment-states", "b-inconclusive"],
        [("nf", ["evidence", "uncertainty"]),
         ("not", ("s1", "complete_capture")), AF, AR],
        hard=["not", "nf"]),
    "not_arisen": spec(
        "A competent determination that the duty did NOT arise, with the effect "
        "reconciliation that supports it. A missing receipt leaves it potential instead.",
        ["k-obl-arise"],
        [("nf", ["duty", "authority", "evidence"]),
         ("nc", "observed_not_applied"), AF, AR],
        hard=["nc"]),
    "proven_unsent": spec(
        "POSITIVE complete gateway and transport proof covering every permitted route, "
        "plus fencing. Missing logs are insufficient.",
        ["a-attempt-states"],
        [("nf", ["native", "restriction"]), ("nc", "proven_unsent"),
         ("s1", "complete_capture"), AF, AR],
        hard=["nc", "s1"]),
    "reconciled_not_applied": spec(
        "A qualified native observation determines that the effect was NOT applied; the "
        "holds it releases are only those proven free.",
        ["a-attempt-observed", "a-release-steps"],
        [("nf", ["native", "quantity", "evidence"]),
         ("nc", "observed_not_applied"), AF, AR],
        hard=["nc"]),

    # -- Dispute. -----------------------------------------------------------------
    "contested": spec(
        "An attributable challenge naming the contested evidence and its author, with "
        "the challenge itself live, the prior substantive status preserved, and the "
        "evidence graph acyclic. Contested is challenged evidence, not automatic "
        "rejection.",
        ["k-judgment", "e-judgment-states", "s-no-self-support"],
        [("nf", ["dispute", "evidence", "custodian"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("dispute", ["open", "investigating", "proposed"], True)]),
         ("ag", ["evidence", "dependency"]), AR],
        hard=["nf", "ag"]),
    "disputed": spec(
        "A new legitimate challenge with standing; the dispute is a separate flag while "
        "the substantive status is retained, and resubmission cannot delete it.",
        ["k-obl-dispute", "k-case-dispute"],
        [("nf", ["dispute", "duty", "custodian"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["recognized", "performance_reported", "discharged"], True)]),
         ("ag", ["dispute"]), AR],
        hard=["nf", "ag"]),
    "conflicted": spec(
        "A required party changed or withdrew before authorization, so the proposal "
        "remains conflicted with each position preserved and the latest responsible time "
        "visible.",
        ["h-packet", "e-contradiction"],
        [("nf", ["dispute", "custodian", "deadline_end"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", AF), AR],
        hard=["not"]),
    "resolved": spec(
        "A competent disposition by a currently accepted authority, the remedy evidence "
        "recorded, and the restored substantive status named. Acceptance history "
        "remains.",
        ["k-case-dispute", "k-obl-dispute", "e-contradiction"],
        [("nf", ["authority", "successor", "evidence", "dispute"]),
         ("rp", [("authority", ["accepted"], False)]), AF, AR],
        hard=["rp", "nf"]),

    # -- Release path. ------------------------------------------------------------
    "envelope_durable": spec(
        "The complete RecoveryEnvelope is frozen and INDEPENDENTLY persisted, with its "
        "exact content and blob manifest verified by the witness. Still no invocation.",
        ["arch4-envelope", "a-release-steps", "a-op-states"],
        [("nf", ["native", "dependency"]), ("rc", "envelope_durable"),
         ("s1", "complete_capture"), AR],
        hard=["rc", "s1"]),
    "released": spec(
        "A persisted RecoveryEnvelope bound by digest, the independent witness receipt "
        "for the exact Release, the reread prerequisite snapshot, and a bounded transport "
        "window. Only after the witness sees the exact Release may this say released.",
        ["arch4-envelope", "a-release-steps", "a-op-states"],
        [("nf", ["native", "authority", "dependency"]), ("rc", "released"),
         ("fi",), AR],
        hard=["rc", "fi"]),
    "claimed": spec(
        "A unique claim for this exact operation and attempt index, the restrictive "
        "epochs reread, the attempt allowance debited, and an independent claim receipt.",
        ["a-attempt-states", "a-release-steps"],
        [("nf", ["native", "quantity"]), ("rc", "claimed"),
         ("s1", "resource_equation"), AR],
        hard=["rc"]),
    "transport_armed": spec(
        "The correct gateway boot and profile, the exact rule and bytes, and the local "
        "durable one-use claim consumption.",
        ["a-attempt-states"],
        [("nf", ["native", "restriction"]), ("rc", "transport_armed"), ("fi",), AR],
        hard=["rc"]),
    "reconciliation_required": spec(
        "An effect is outstanding that competent evidence must resolve before capacity "
        "or claims can be released.",
        ["a-op-states", "a-scope-migration"],
        [("nf", ["uncertainty", "quantity", "duty"]),
         ("rc", "reconciliation_required"), ("not", ("nc", "observed_applied")), AR],
        hard=["rc"]),
    "retry_admitted": spec(
        "A new current attempt within the remaining count and budget and the ORIGINAL "
        "business conflict; the deadline is newly authorized, never replayed.",
        ["a-attempt-states", "a-op-states"],
        [("nf", ["native", "quantity", "dependency"]), ("rc", "retry_admitted"),
         ("fi",), ("s1", "resource_equation"), AR],
        hard=["rc"]),
    "recovery_required": spec(
        "A missed heartbeat or an invalidation: internal work becomes recoverable while "
        "any released effect moves independently to reconciliation.",
        ["k-workorder-stop", "a-recovery-steps"],
        [("nf", ["uncertainty", "native", "duty"]),
         ("not", ("s1", "lease_current")), AR],
        hard=["not"]),

    # -- Reservation accounting. --------------------------------------------------
    "consumed": spec(
        "Consumption is recorded against the account's own canonical unit and the "
        "invariant still holds; uncertainty is not silently converted to consumption.",
        ["a-reservation"],
        [("nf", ["quantity", "evidence"]), ("s1", "resource_equation"),
         ("nc", "observed_applied"), AR],
        hard=["s1", "nc"]),
    "partly_consumed": spec(
        "Part of the reservation is consumed and the remainder is still held; the "
        "invariant holds across both.",
        ["a-reservation"],
        [("nf", ["quantity", "evidence", "uncertainty"]),
         ("s1", "resource_equation"), ("nc", "observed_applied"), AR],
        hard=["s1", "nc"]),

    # -- Maintenance and native reconciliation. -----------------------------------
    "rebuilding": spec(
        "A complete DECLARED rescan is under way; it returns to current only when that "
        "rescan closes, not when the first page succeeds.",
        ["i-cursor"],
        [("nf", ["native", "uncertainty"]),
         ("not", ("s1", "complete_capture")), ("fi",), AR],
        hard=["not"]),
    "propagating": spec(
        "The durable propagation task created with the restriction is still running; the "
        "descendants it has not reached are not yet restricted.",
        ["a-invalidation", "e-closure"],
        [("nf", ["restriction", "dependency", "uncertainty"]),
         ("not", ("s1", "complete_capture")), ("ag", ["dependency"]), AR],
        hard=["not"]),
    "rotating": spec(
        "Rotation replaces the credential generation AND enumerates the descendants that "
        "survive it; rotating one secret is not recovery evidence.",
        ["a-containment", "a-descendants"],
        [("nf", ["native", "restriction", "uncertainty"]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "converting": spec(
        "The converter runs against an exact versioned identity and field mapping; "
        "unknown or ambiguous mappings stay restricted rather than being guessed.",
        ["c-mapping-migration", "b-rollback"],
        [("nf", ["dependency", "successor", "uncertainty"]),
         ("rp", [("dependency", ["freezing", "frozen"], True)]),
         ("ag", ["successor"]), AR],
        hard=["ag"]),
    "repairing": spec(
        "An authorized repair is under way by an accepted performer; the customer "
        "condition it must restore is not yet checked.",
        ["c-grievance"],
        [("nf", ["duty", "custodian", "evidence"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "remedy_performing": spec(
        "The funded remedy is being performed under the standing that authorized it; a "
        "disabled credential is not a completed refund.",
        ["c-grievance", "a-containment"],
        [("nf", ["duty", "authority", "custodian"]),
         ("rp", [("authority", ["accepted"], False)]),
         ("not", ("nc", "observed_applied")), AR],
        hard=["not"]),
    "remedy_authorized": spec(
        "Remedy authority and its funded resources exist for this exact entitlement "
        "before performance starts.",
        ["c-grievance"],
        [("nf", ["authority", "quantity", "duty"]),
         ("rp", [("authority", ["accepted"], False)]),
         ("s1", "resource_equation"), AR],
        hard=["rp"]),
    "remedy-pending": spec(
        "A remedy is owed and not yet performed; the entitlement it will consume is "
        "identified and held.",
        ["c-grievance", "h-stop"],
        [("nf", ["duty", "quantity", "deadline_end"]),
         ("not", ("nc", "observed_applied")), ("fi",), AR],
        hard=["not"]),
    "calibrating": spec(
        "The evaluator is under calibration against known-defect and clean-case controls "
        "and is not yet admitted to decide anything.",
        ["e-independence", "b-trial"],
        [("nf", ["evidence", "dependency"]),
         ("not", AF), ("fi",), AR],
        hard=["not"]),
    "closing": spec(
        "The closure inventory is being performed: each promise, refund, renewal and "
        "record is being disposed of individually, and none is assumed handled.",
        ["c-closure", "arch6-closure"],
        [("nf", ["duty", "custodian", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("not", ("s1", "complete_capture")), AR],
        hard=["not"]),
    "release_pending": spec(
        "The prerequisites for release are not all current; nothing is released and the "
        "holds stand.",
        ["a-release-steps", "a-op-states"],
        [("nf", ["dependency", "quantity"]), ("rc", "release_pending"),
         ("not", ("fi",)), AR],
        hard=["rc"]),
    "recovery-pending": spec(
        "Recovery is required and the current frontier has not yet been established; no "
        "new authority arises from the cached view.",
        ["a-recovery-steps", "a-cursor-freshness"],
        [("nf", ["native", "uncertainty", "restriction"]),
         ("not", ("s1", "complete_capture")), ("not", ("fi",)), AR],
        hard=["not"]),
    "validation_pending": spec(
        "The atomic lineage and current-epoch validation is requested and its manifest "
        "and source lineage are complete; until it passes, the bytes are not usable as "
        "current input.",
        ["k-artifact", "k08-epochs"],
        [("nf", ["dependency", "evidence"]), ("s1", "complete_capture"),
         ("not", AF), AR],
        hard=["not"]),
    "constrained": spec(
        "Verification completed and the capacity is REAL but narrower than proposed: the "
        "constraint is named and carried, not averaged into a pass.",
        ["c-capacity"],
        [("nf", ["custodian", "evidence", "uncertainty"]),
         ("rp", [("custodian", ["accepted"], False)]),
         ("s1", "delivery_ready"), AF, AR],
        hard=["s1"]),
    "waived-inapplicable": spec(
        "A declared guard established that this dependency does not apply, with its "
        "reason recorded. Current authority, data permission, required review and actual "
        "duty-discharge predicates can never be waived this way -- which this criterion "
        "expresses only as far as the record's own fields allow: it requires the "
        "declared kind, the waiver reason and the waiving authority, and cannot itself "
        "check that the waived predicate was not one of the four.",
        ["w-dependency"],
        [("nf", ["subject_identity", "successor", "authority"]),
         ("rp", [("authority", ["accepted"], False)]), AF, AR],
        hard=["nf"]),
    "labeled": spec(
        "Labels are attached by an identified labeller under the declared method, with "
        "the label set and its disagreements recorded; a label is evidence, not a "
        "verdict.",
        ["e-independence", "b-trial"],
        [("nf", ["evidence", "custodian", "subject_identity"]),
         ("rp", [("custodian", ["accepted"], False)]), AR],
        hard=["rp"]),
    "settled_dispute_placeholder": spec(
        "unused sentinel; never assigned to a phase",
        ["k-terminal"], [AR]),
}

# `settled_dispute_placeholder` exists only so a reviewer grepping for an unassigned
# key finds one deliberately; it is filtered out below and matches no phase name.
PHASE_SPECS.pop("settled_dispute_placeholder")


# --- Record-specific overrides. --------------------------------------------------
#
# The six records `capabilities.json#/domain_validators` already states per-phase
# content for. These are the ONLY entries whose content comes from a per-record
# source rather than from a phase-kind passage, and each cites that source directly.

DOMAIN_VALIDATOR_CITE = ("capabilities.json", "#/domain_validators")

RECORD_OVERRIDES = {

    # -- R-C / AD-013: Fulfillment's domain lifecycle. ----------------------------
    #
    # `refunded` is deliberately ABSENT and becomes a registered gap. The corpus says
    # what a refund IS (CAP-17: "authorized repair/completion/refund", conflict identity
    # so support and sales "cannot pay it twice") and says it about the SupportCase that
    # performs it. It nowhere says what a Fulfillment record in `refunded` must show.
    # Inventing that sentence here is the false closure this module exists to refuse.
    ("Fulfillment", "delivering"): spec(
        "The agreed service is being performed by a currently accepted performer, with "
        "the milestone steps, the service window and the obligations still outstanding "
        "all recorded. Being in delivery asserts nothing about delivery: no receipt, no "
        "counterparty acknowledgment and no independent observation is required here, "
        "and none of them would be sufficient to leave this phase either.",
        ["c-fulfillment", "arch6-verify"],
        [("nfp", ["/payload/performer_assignment", "/payload/delivery_steps",
                  "/payload/service_window", "/payload/remaining_duties"]),
         ("rpp", [("/payload/performer_assignment", ["accepted"], False)]),
         AR],
        hard=["nfp", "rpp"]),
    ("Fulfillment", "delivered"): spec(
        "Delivery is established by an independently observed result correlated to the "
        "delivery adapter's own native object, by the receipts the milestones require "
        "and by a current accepted judgment on THIS criterion. Correlation is against "
        "the delivery, never against the payment: a settled charge is evidence about "
        "money and says nothing about whether the service arrived. Partial receipts do "
        "not complete the order and a silent customer acquires no new discharge meaning.",
        ["c-fulfillment", "arch6-delivery", "arch6-acceptance"],
        [("nfp", ["/payload/receipts", "/payload/delivery_steps",
                  "/payload/remaining_duties"]),
         ("rpp", [("/payload/performer_assignment", ["accepted"], False)]),
         ("nc", "delivered"), AF, AR],
        hard=["nfp", "rpp", "nc"]),
    # RC-01: `not(native_correlated delivered)` USED TO BE A CONJUNCT HERE, and it made
    # this criterion contradict the only edge that could reach it. `failed` was entered
    # solely from `delivered`, which is entered only by an edge REQUIRING
    # `native_correlated(result: "delivered")` -- so the phase demanded the absence of the
    # correlation its own inbound route had just established, and a delivery that failed
    # in flight had no transition at all. The absence of correlation is a property of the
    # ROUTE, not of the phase: it is required by `edge.Fulfillment.delivering.failed.v1`,
    # the in-flight edge, and it is deliberately NOT required by the edge from `delivered`,
    # where a delivery was correlated and later failed anyway. One criterion cannot assert
    # both, and the layer that can tell the two routes apart is the guard.
    ("Fulfillment", "failed"): spec(
        "The delivery did not complete and the failure is owned rather than closed: the "
        "service window and the receipts actually obtained are recorded, the remaining "
        "obligations survive on the record, and a currently accepted performer still "
        "carries them. Failure creates a support/remedy duty with an update deadline; it "
        "does not discharge the order. Whether any observation correlates a delivery is "
        "decided by the inbound edge rather than here -- a failure in flight requires "
        "that none does, and a failure after delivery cannot, because the route it took "
        "required exactly that correlation.",
        ["c-onboarding-failure", "arch3-outcome"],
        [("nfp", ["/payload/remaining_duties", "/payload/receipts",
                  "/payload/service_window"]),
         ("rpp", [("/payload/performer_assignment", ["accepted"], False)]),
         AR],
        hard=["nfp", "rpp"]),

    # -- R-A / AD-013: what evidence constitutes performance of a sale. -----------
    #
    # The gap the Phase G reviewer classified (d): `performed` demanded byte-identical
    # `field_paths` to `accepted`, SalesAgreement had no relation to Fulfillment, and the
    # only native object reachable from the record was the Stripe payment behind
    # `payment_operation`. A buyer could pay, the Fulfillment stay `proposed`, every
    # Obligation stay `recognized`, and the agreement reach `performed` with nothing in
    # the machine objecting. AD-013 decides it: delivery, not payment.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                  "/payload/acceptance_evidence", "/payload/agreed_terms"]),
         ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                  ("/payload/obligation_refs", ["discharged", "transferred"], False)]),
         ("nc", "delivered"), AF, AR],
        hard=["nfp", "rpp", "nc"]),

    # -- R-F / G4-02: CAP-42's "funded remedy" was prose. -------------------------
    #
    # `remedy_reservation_refs` is required in the payload and was read by 0 predicates;
    # `criterion.GrievanceCase.remedy_authorized.v1` carried `nonempty_fields: []` for the
    # funding half, so a remedy could be authorized with no reservation at all. The
    # kind-level `remedy_authorized` spec reaches for `resource_equation`, which CCR-03
    # restricted to ResourceAccount, so on GrievanceCase it drops out entirely -- which is
    # exactly why this record needs its own entry naming its own funding field.
    ("GrievanceCase", "remedy_authorized"): spec(
        "A competent authority has decided a specific remedy and its funding is ACTUALLY "
        "RESERVED: every `remedy_reservation_refs` entry resolves to a Reservation "
        "currently `held` or `partly_consumed`, and the list is not empty. A performer "
        "and a due date exist, and the deciding response decision is recorded. An "
        "authorization with no live reservation is an unowned promise, not this phase, "
        "and an empty reservation list is the shape that made CAP-42's funded remedy "
        "prose.",
        ["c-grievance-remedy", "c-grievance"],
        [("nfp", ["/payload/remedy_reservation_refs", "/payload/response_decision_refs",
                  "/payload/requested_remedy", "/payload/decision_due_at",
                  "/payload/custodian_assignment_ref"]),
         ("rpp", [("/payload/remedy_reservation_refs", ["held", "partly_consumed"], False),
                  ("/payload/custodian_assignment_ref", ["accepted"], False)]),
         AF, AR],
        hard=["nfp", "rpp"]),

    # -- R-H / G4-08: the schema and the guard disagreed, and the guard was wrong. -
    #
    # `records.schema.json#/$defs/DecisionPacket` omitted `competence_requirement_ref`
    # from `required`; `criterion.DecisionPacket.ready.v1` listed it in `nonempty_fields`,
    # so a packet could not reach `ready` without it. Two implementers derive different
    # packets from one contract. It is optional in BOTH now, and the guard states the case
    # the stricter reading destroyed: DIRECTIVE.md §1.6 wants the founder exercising taste
    # and making difficult decisions, and a pure taste decision has no competence
    # prerequisite to name. `taste_decision` is a required flag rather than an inference,
    # because "this is a matter of taste" is a claim someone makes, not one a guard reads
    # off an absent field -- and an absent flag is unresolved and denies.
    ("DecisionPacket", "ready"): spec(
        "Every required child prerequisite resolves to a current accepted judgment on its "
        "exact subject and predicate, the dependency graph over those children is "
        "acyclic, and no activation or effect is claimed. AND the packet states its "
        "competence footing exactly once: either `taste_decision` is true -- a decision "
        "the owner makes because it is theirs to make, which has no competence "
        "prerequisite to name and must not be blocked for lacking one -- or "
        "`competence_requirement_ref` is present. Neither is inferred from the absence of "
        "the other.",
        ["s-per-edge", "c-launch", "s-no-self-support", "d-taste"],
        [("nf", ["dependency", "evidence"]),
         ("rp", [("dependency", ["accepted", "verified"], False)]),
         ("ag", ["dependency"]),
         ("either", [("eqF", "/payload/taste_decision", True),
                     ("prF", "/payload/competence_requirement_ref")]),
         AF, AR],
        hard=["ag", "either"]),

    # -- R-K(2): parking records BOTH, and the kernel's `or` is read as a conjunction.
    #
    # The two halves answer different questions -- the review date says when someone looks
    # again, the closure account says what happens to the duties if nobody does -- and a
    # guard cannot check `or` without knowing which field carries which. The cheapest
    # correct reading of an ambiguous `or` in a duty-preserving contract is the one that
    # preserves more.
    ("Case", "parked"): spec(
        "An AUTHORIZED reason, and BOTH halves of the kernel's disjunction: the next "
        "review date and the closure account that says what becomes of the surviving "
        "duties if that review never happens. Every surviving duty keeps a named accepted "
        "custodian. No obligation disappears, and parking never discharges external "
        "standing.",
        ["k-case-park", "k11-transfer", "c-pause", "c-goal-review"],
        [("nf", ["duty", "custodian", "successor"]),
         ("nfp", ["/payload/review_at", "/payload/parking_closure_account_ref"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["potential", "recognized", "performing"], True)]),
         ("fi",), AR],
        hard=["rp", "fi", "nfp"]),

    # -- GR-02: the other parked records, decided per record rather than in bulk.
    #
    # R-K left seven records with a `parked` phase and no closure account, and said so
    # rather than closing it. The discriminator used here is MECHANICAL and checkable in
    # record-registry.json, which is why it can be stated rather than argued: does the
    # record's OWN payload carry a `Ref<Obligation>[]` field? Where it does, parking the
    # record parks duties that belong to it, the kernel's account is what says what
    # becomes of them, and the field is added. Where it does not, the duties reachable
    # from the record belong to other records that each have their own parking guard, and
    # a second account here would duplicate an answer rather than give one. Case carries
    # `obligation_refs` and was decided the same way, so this extends one rule instead of
    # inventing a second.
    #
    # Four qualify: Mission `residual_obligation_refs`, Project `closure_duty_refs`,
    # WorkflowRun and WorkOrder `unfinished_obligation_refs`. Goal, KnowledgeQuestion and
    # Opportunity do not, and their dispositions are recorded in the CONTRADICTIONS entry
    # below -- not here, because "we decided this needs nothing" is not a criterion.
    #
    # Only Mission declares a review date, so only Mission can demand BOTH halves. On the
    # other three the `nfp` names the account alone: demanding a `/payload/review_at` that
    # the record does not declare is refused by compose(), correctly.
    ("Mission", "parked"): spec(
        "An AUTHORIZED reason, and BOTH halves of the kernel's disjunction: the next "
        "review date and the closure account that says what becomes of the mission's "
        "residual obligations if that review never happens. Every surviving duty keeps a "
        "named accepted custodian. No obligation disappears, and parking never discharges "
        "external standing.",
        ["k-case-park", "k11-transfer", "c-pause"],
        [("nf", ["duty", "custodian", "successor"]),
         ("nfp", ["/payload/review_at", "/payload/parking_closure_account_ref"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["potential", "recognized", "performing"], True)]),
         ("fi",), AR],
        hard=["rp", "fi", "nfp"]),

    ("Project", "parked"): spec(
        "An AUTHORIZED reason and the closure account that says what becomes of the "
        "project's closure duties if nobody returns to it. Every surviving duty keeps a "
        "named accepted custodian. The record declares NO review date, so the account is "
        "the only half of the kernel's disjunction that can be demanded here, and it is "
        "demanded rather than left to the reader. No obligation disappears, and parking "
        "never discharges external standing.",
        ["k-case-park", "k11-transfer", "c-pause"],
        [("nf", ["duty", "custodian", "successor"]),
         ("nfp", ["/payload/parking_closure_account_ref"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["potential", "recognized", "performing"], True)]),
         ("fi",), AR],
        hard=["rp", "fi", "nfp"]),

    ("WorkflowRun", "parked"): spec(
        "An AUTHORIZED reason and the closure account that says what becomes of the run's "
        "unfinished obligations if nobody resumes it. Every surviving duty keeps a named "
        "accepted custodian. The record declares NO review date, so the account is the "
        "only half of the kernel's disjunction that can be demanded here. A parked run is "
        "not a finished one: no obligation disappears, and parking never discharges "
        "external standing.",
        ["k-case-park", "k11-transfer", "c-pause"],
        [("nf", ["duty", "custodian", "successor"]),
         ("nfp", ["/payload/parking_closure_account_ref"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["potential", "recognized", "performing"], True)]),
         ("fi",), AR],
        hard=["rp", "fi", "nfp"]),

    ("WorkOrder", "parked"): spec(
        "An AUTHORIZED reason and the closure account that says what becomes of the "
        "order's duties and unfinished obligations if it is never resumed. Every "
        "surviving duty keeps a named accepted custodian. The record declares NO review "
        "date, so the account is the only half of the kernel's disjunction that can be "
        "demanded here. Parking an order does not release its lease, its reservations or "
        "the entitlement behind it: no obligation disappears, and parking never "
        "discharges external standing.",
        ["k-case-park", "k11-transfer", "c-pause"],
        [("nf", ["duty", "custodian", "successor"]),
         ("nfp", ["/payload/parking_closure_account_ref"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("duty", ["potential", "recognized", "performing"], True)]),
         ("fi",), AR],
        hard=["rp", "fi", "nfp"]),

    ("DeliveryCapacity", "verified"): spec(
        "verified requires actual performer acknowledgment, applicable access/materials, "
        "window, resources and continuity evidence; not compute availability.",
        ["c-capacity"],
        [("nf", ["custodian", "evidence", "dependency", "quantity"]),
         ("rp", [("custodian", ["accepted"], False),
                 ("dependency", ["accepted", "active"], False)]),
         ("s1", "delivery_ready"), ("nc", "observed_applied"), AF, AR],
        hard=["s1", "nc"]),
    ("Experiment", "running"): spec(
        "running requires exact controlling Case and current resource/grant admission; "
        "registered protocol alone cannot cause external work.",
        ["b-trial"],
        [("nf", ["dependency", "authority", "quantity"]),
         ("rp", [("dependency", ["admitted", "active"], False),
                 ("authority", ["active"], False)]),
         ("s1", "resource_equation"), ("fi",), AR],
        hard=["rp", "s1"]),
    ("PriceProposal", "proposed"): spec(
        "internal_provisional requires evidence_basis provisional_hypothesis and state "
        "proposed; missing demand is permitted and explicit.",
        ["c-price"],
        [("nf", ["subject_identity", "custodian", "uncertainty"]),
         ("s1", "price_scope"), AR],
        hard=["s1"]),
    ("PriceProposal", "test-authorized"): spec(
        "bounded_validation permits provisional_hypothesis with state test-authorized "
        "only under its exact current limited grant and actual readiness; it is not "
        "demand-supported adoption.",
        ["c-price", "c-capacity"],
        [("nf", ["authority", "dependency"]),
         ("rp", [("authority", ["active"], False),
                 ("dependency", ["verified"], False)]),
         ("s1", "price_scope"), ("fi",), AR],
        hard=["s1", "rp"]),
    ("PriceProposal", "adopted"): spec(
        "demand_supported_offer or scale_recommendation requires evidence_basis "
        "demand_supported, actual applicable willingness evidence and current accepted "
        "demand_judgment_ref on the exact criterion; state adopted cannot arise from an "
        "unknown-demand provisional result.",
        ["c-price"],
        [("nf", ["evidence", "subject_identity"]),
         ("rp", [("evidence", ["accepted"], False)]),
         ("s1", "price_scope"), ("nc", "observed_applied"), AF, AR],
        hard=["s1", "nc"]),
    ("LaunchReadiness", "validated"): spec(
        "acceptance_bindings must contain exactly one binding for every required "
        "requirement_id, no duplicate IDs and no unapproved additions; every "
        "binding.judgment_ref must resolve to a current accepted EvidenceJudgment with "
        "matching exact subject/version and predicate/scope.",
        ["c-launch"],
        [("nf", ["dependency", "evidence"]),
         ("rp", [("dependency", ["accepted", "verified"], False)]),
         ("s1", "launch_children"), ("uq", "judgment_refs"),
         ("ag", ["dependency"]), AF, AR],
        hard=["s1"]),
    # R-G / G4-03 extends this entry. The domain_validators requirement is unchanged and
    # still first; what is added is the external-burden half, which the criterion checked
    # nowhere. `external_burden_observations` is a required ARRAY, and an array validates
    # empty, so the protocol's required case -- a profitable venture shifting work onto
    # customers, applicants or contractors -- passed with `[]`.
    ("Economics", "validated"): spec(
        "observed_revenue and observed_cost allow observed or unknown, never estimated "
        "presented as actual; any unknown input makes the corresponding aggregate "
        "incomplete, so a known subtotal plus missing categories is reported instead of a "
        "complete total. AND the external burden this venture places on customers, "
        "applicants and contractors is accounted for: either the observations are "
        "nonempty, or `external_burden_account` positively finds `none_observed` and "
        "carries the reason, the observation window and the assignment answerable for it. "
        "An empty observation array on its own is the absence of evidence and establishes "
        "no absence of burden.",
        ["c-price", "c-shifted-burden"],
        [("nf", ["quantity", "evidence", "uncertainty"]),
         ("either", [("neF", "/payload/external_burden_observations"),
                     ("every", [("eqF", "/payload/external_burden_account/finding",
                                 "none_observed"),
                                ("prF", "/payload/external_burden_account/reason"),
                                ("prF", "/payload/external_burden_account/"
                                        "observation_window"),
                                ("prF", "/payload/external_burden_account/"
                                        "responsible_assignment")])]),
         ("s1", "resource_equation"), ("s1", "complete_capture"), AF, AR],
        hard=["s1", "either"]),
    ("CashPosition", "validated"): spec(
        "Each expected account has an AccountBalanceObservation or a named coverage gap; "
        "an absent reconciliation date or unknown balance cannot establish zero assets or "
        "a current available balance.",
        ["c-price"],
        [("nf", ["quantity", "evidence", "uncertainty", "native"]),
         ("s1", "resource_equation"), ("nc", "observed_applied"), AF, AR],
        hard=["nc"]),
    # --- BEGIN WORK-1.1 record overrides (F2 amendment) ---
    #
    # The fifteen records the WORK-1.1 amendment registers.  Every entry is a
    # RECORD OVERRIDE rather than a kind-level PHASE_SPECS entry, for the reason
    # the module header gives: `nfp`/`rpp` name the record's own exact fields, so
    # what a phase demands is a decision about THAT record rather than whatever a
    # role regex happens to match on it.  Two phases of one record differ in WHAT
    # they check -- which primitives compose, how many of the record's own fields
    # each demands, and which phases the related records must be in -- and all
    # three survive the all-strings-erased skeleton, which is what keeps two edges
    # out of one state distinguishable by something executable.

    # -- AcceptanceInterval (S1-C06) ---------------------------
    ("AcceptanceInterval", "declared_done"): spec(
        'The producer has declared completion against a work order, the submission is '
        'sequenced, the sponsor holding the interval is named, and the criteria this '
        'submission will be judged against were frozen before the producing step started.',
        ['w-ai-in-acceptance', 's-registered-type'],
        [('nfp', ['/payload/work_order_ref', '/payload/submission_seq', '/payload/holder_ref', '/payload/criteria_ref', '/payload/criteria_frozen_at', '/payload/producing_started_at']), AR],
        hard=['nfp']),
    ("AcceptanceInterval", "in_acceptance"): spec(
        'The acceptance owner is named and currently accepted, the latest responsible '
        'moment is recorded, and the effect class this interval sits at is recorded. '
        'Producer-declared completion is not acceptance and cannot advance by deadline.',
        ['w-ai-in-acceptance', 's-ai'],
        [('nfp', ['/payload/acceptance_owner_ref', '/payload/latest_responsible_at', '/payload/effect_class_id', '/payload/declared_done_at']), ('rpp', [('/payload/acceptance_owner_ref', ['accepted'], False)]), AR],
        hard=['nfp', 'rpp']),
    ("AcceptanceInterval", "accepted"): spec(
        'A resolution reason is recorded, the acceptance owner that wrote the terminal '
        'edge is named and currently accepted, and a current accepted judgment on this '
        'criterion exists. An acceptance with an empty reason is rejected by the writer '
        'guard.',
        ['w-ai-in-acceptance', 's-ai'],
        [('nfp', ['/payload/resolution_reason', '/payload/acceptance_owner_ref', '/payload/criteria_ref']), ('rpp', [('/payload/acceptance_owner_ref', ['accepted'], False)]), AF, AR],
        hard=['nfp', 'rpp']),
    ("AcceptanceInterval", "rejected"): spec(
        'A resolution reason is recorded and the work order the rejection returns to is '
        'named. Rejection is a decided outcome with a reason, never an interval that ran '
        'out.',
        ['w-ai-in-acceptance', 's-ai'],
        [('nfp', ['/payload/resolution_reason', '/payload/work_order_ref']), AR],
        hard=['nfp']),

    # -- AdmissionRecord (S1-C02) ---------------------------
    ("AdmissionRecord", "opened"): spec(
        'The arrival is attributed to its origin and channel and sequenced, and the '
        'consequence classes it reaches are computed before its kind is decided. Opening '
        'is not admitting.',
        ['w-ar-refused', 's-registered-type'],
        [('nfp', ['/payload/origin', '/payload/arrival_seq', '/payload/origin_channel_id', '/payload/effect_class_ids']), AR],
        hard=['nfp']),
    ("AdmissionRecord", "admitted"): spec(
        'The acceptance role for this duty class is staffed, the typing outcome is one of '
        'the three admissible ones, the ordered custody resolver skipped the admitting '
        'identity, and a current accepted judgment on this criterion exists.',
        ['w-acceptance-role-unfilled', 's-ar'],
        [('nfp', ['/payload/duty_class_id', '/payload/acceptance_holder_ref', '/payload/typing_outcome', '/payload/custody_order_identity_ids', '/payload/admitting_identity_id']), ('rpp', [('/payload/acceptance_holder_ref', ['staffed'], False)]), AF, AR],
        hard=['nfp', 'rpp']),
    ("AdmissionRecord", "refused"): spec(
        'A named failed predicate is recorded, an acceptance owner for the refusal is '
        'named, and the basis of the refusal is a failed predicate rather than unfamiliar '
        'wording. Silence is not refusal, and a genuine job in unfamiliar wording types '
        'as no match rather than as a refusal.',
        ['w-ar-refused', 's-ar'],
        [('nfp', ['/payload/failed_predicate_id', '/payload/acceptance_owner_ref']), ('eqF', '/payload/refusal_basis', 'failed_predicate'), AR],
        hard=['nfp', 'eqF']),
    ("AdmissionRecord", "parked"): spec(
        'The sub-caps for this origin channel and counterparty are recorded, intake was '
        'not refused, and the destination that received the overflow has a named reader. '
        'A full cap at the one object whose purpose is guaranteed reachability is the '
        'worst possible place for a refusal.',
        ['w-intake-subcap', 's-ar'],
        [('nfp', ['/payload/origin_subcap', '/payload/counterparty_subcap', '/payload/overflow_destination_ref', '/payload/overflow_alarm_reader_ref']), ('eqF', '/payload/intake_refused', False), ('rpp', [('/payload/overflow_alarm_reader_ref', ['accepted'], False)]), AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("AdmissionRecord", "escalated"): spec(
        'The standing holder the arrival escalated to is named and staffed, and the '
        'deadline the escalation carries is recorded. An escalation ladder that ends '
        'assigned and silent is the failure this phase exists to make visible.',
        ['w-acceptance-role-unfilled', 's-ar'],
        [('nfp', ['/payload/acceptance_holder_ref', '/payload/escalation_deadline', '/payload/duty_class_id']), ('rpp', [('/payload/acceptance_holder_ref', ['staffed'], False)]), AR],
        hard=['nfp', 'rpp']),

    # -- ArmedSet (S1-C02) ---------------------------
    ("ArmedSet", "current"): spec(
        'The projection names the journal position it was evaluated at, the moment of '
        'evaluation, the deterministic evaluator that produced it, and the interests it '
        'armed. It is derived: nobody writes it and no component may prevent membership.',
        ['s-as', 'w-precedence'],
        [('nfp', ['/payload/journal_position', '/payload/evaluated_at', '/payload/evaluator_module', '/payload/armed_interest_refs']), AR],
        hard=['nfp']),

    # -- ConsequenceDerivation (S1-C04) ---------------------------
    ("ConsequenceDerivation", "computed"): spec(
        'The derivation names the operation intent it is about, the exact version of the '
        'function that produced it, the moment it was produced and the inputs it read. '
        'Being computed is not being gated: an admission-time class set authorizes no '
        'release on its own.',
        ['w-class-one-function', 's-registered-type'],
        [('nfp', ['/payload/operation_intent_ref', '/payload/derivation_fn_version', '/payload/derived_at', '/payload/derivation_input_refs']), AR],
        hard=['nfp']),
    ("ConsequenceDerivation", "recomputed_at_release"): spec(
        'The class set was recomputed inside the ordered release transaction over the '
        'frozen bytes, by the release path and by nobody else, with the reached set, the '
        'gated set and the declared floor all recorded. A pre-drift class is stale the '
        'way a pre-drift fact is.',
        ['w-cd-recompute', 'w-class-gates-all', 's-cd'],
        [('nfp', ['/payload/frozen_payload_digest', '/payload/reached_class_ids', '/payload/gated_class_ids', '/payload/declared_floor_ref', '/payload/release_path_component_id']), ('eqF', '/payload/append_only', True), AR],
        hard=['nfp', 'eqF']),
    ("ConsequenceDerivation", "matched"): spec(
        'The recomputed set and the admitted set are both recorded and a current accepted '
        'judgment on this criterion establishes that they agree. Agreement is '
        'established, never assumed from the absence of a recorded disagreement.',
        ['w-cd-recompute', 's-cd'],
        [('nfp', ['/payload/recomputed_class_ids', '/payload/reached_class_ids', '/payload/release_ref']), AF, AR],
        hard=['nfp']),
    ("ConsequenceDerivation", "parked_on_mismatch"): spec(
        'The recomputed set differs from the admitted set, the effect is held, and the '
        'party owning the park is named on the record. There is no route from here to a '
        'release under the lower set, and the disposition is writable only by that party.',
        ['w-cd-park', 's-cd'],
        [('nfp', ['/payload/recomputed_class_ids', '/payload/park_owner_assignment_ref']), ('rpp', [('/payload/park_owner_assignment_ref', ['accepted'], False)]), AR],
        hard=['nfp', 'rpp']),

    # -- ConstraintSet (S1-C05) ---------------------------
    ("ConstraintSet", "issued"): spec(
        'The set is identified by its own content digest, every member it carries is a '
        'typed value, the boundary it was validated at is named, and any prose sits at a '
        'reference rather than in the transfer. A receiver may act only on members it can '
        'restate as typed values.',
        ['s-cs', 'w-precedence'],
        [('nfp', ['/payload/content_digest', '/payload/typed_members', '/payload/boundary_kind', '/payload/producing_structure_ref']), ('eqF', '/payload/validated_at_boundary', True), ('eqF', '/payload/prose_delivery', 'ref_only'), AR],
        hard=['nfp', 'eqF']),

    # -- EffectIdentity (S1-C04) ---------------------------
    ("EffectIdentity", "allocated"): spec(
        'The identity triple is complete before any release: the effect class, the '
        'counterparty and the digest of the payload, with the moment of allocation and '
        'the reserved name range it came from. Allocation happens before release and '
        'never after it.',
        ['w-ei-claimed', 's-registered-type'],
        [('nfp', ['/payload/effect_class_id', '/payload/counterparty_id', '/payload/payload_digest', '/payload/allocated_at', '/payload/reserved_name_range']), AR],
        hard=['nfp']),
    ("EffectIdentity", "claimed"): spec(
        'A releasing attempt has claimed the allocation, the claim is timestamped after '
        'the allocation, and the first claimant is named so a second joins it rather than '
        'racing it.',
        ['w-ei-claimed', 's-ei'],
        [('nfp', ['/payload/claimed_at', '/payload/first_claimant_ref']), ('rpp', [('/payload/first_claimant_ref', ['released', 'observed'], False)]), AF, AR],
        hard=['nfp', 'rpp']),
    ("EffectIdentity", "observed"): spec(
        'An independent observation of the effect is correlated to this identity. '
        'Observation is established by a recorded observation, never by the absence of a '
        'reported failure.',
        ['w-ei-claimed', 's-ei'],
        [('nfp', ['/payload/observation_refs']), ('nc', 'released'), AR],
        hard=['nfp']),

    # -- ExistenceJustification (S1-C02) ---------------------------
    ("ExistenceJustification", "proposed"): spec(
        'The justification names the instance it is about, exactly one reason and the '
        'unit that reason predicates on, the alternative that was considered and the '
        'criterion that would remove the worker. Proposing is not admitting.',
        ['w-ej-admitted', 's-registered-type'],
        [('nfp', ['/payload/agent_instance_ref', '/payload/reason_kind', '/payload/reason_unit', '/payload/alternative_considered', '/payload/removal_criterion']), AR],
        hard=['nfp']),
    ("ExistenceJustification", "admitted"): spec(
        'A decidable test is recorded and it can return false, the admitting mandate is '
        'currently accepted, an attributable identity is bound, the approval carries an '
        'expiry and a current accepted judgment on this criterion exists. A justification '
        'naming a capability is uncheckable and is refused here.',
        ['w-ej-admitted', 's-ej'],
        [('nfp', ['/payload/decidable_test', '/payload/admitting_mandate_ref', '/payload/attributable_identity_ref', '/payload/approval_expires_at']), ('eqF', '/payload/test_can_return_false', True), ('rpp', [('/payload/admitting_mandate_ref', ['accepted'], False)]), AF, AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("ExistenceJustification", "expired_with_instance"): spec(
        'The worker this justification exists for is no longer running and the expiry is '
        'recorded. The justification does not outlive its instance, and expiry is a '
        'recorded moment rather than an absence of activity.',
        ['w-ej-admitted', 's-ej'],
        [('nfp', ['/payload/approval_expires_at']), ('rpp', [('/payload/agent_instance_ref', ['stopped', 'expired'], False)]), AR],
        hard=['nfp', 'rpp']),

    # -- FieldAuthority (S1-C01) ---------------------------
    ("FieldAuthority", "declared"): spec(
        'The declaration names the exact field path it governs, the epoch it governs '
        'from, and the party C01 declared as its authority. Declaring an authority is not '
        'making it current.',
        ['s-fa', 's-registered-type'],
        [('nfp', ['/payload/field_path', '/payload/epoch', '/payload/authority_assignment_ref', '/payload/declaring_component_id']), AR],
        hard=['nfp']),
    ("FieldAuthority", "current"): spec(
        'The named authority is currently accepted and no last-writer-wins path is '
        'declared for this field. Only the named authority writes the value.',
        ['s-fa', 'w-precedence'],
        [('nfp', ['/payload/authority_assignment_ref', '/payload/field_path']), ('eqF', '/payload/last_writer_wins', False), ('rpp', [('/payload/authority_assignment_ref', ['accepted'], False)]), AF, AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("FieldAuthority", "superseded"): spec(
        'A later epoch declares the authority for that path, the transitive closure of '
        'derived entries naming the superseded value has been walked to completion, and '
        'every acceptance the walk reopened is recorded. The superseded authority writes '
        'nothing.',
        ['w-fa-superseded', 's-fa'],
        [('nfp', ['/payload/successor_epoch']), ('eqF', '/payload/closure_walk_completed', True), ('prF', '/payload/derived_closure_refs'), ('prF', '/payload/reopened_acceptance_refs'), AR],
        hard=['nfp', 'eqF', 'prF']),

    # -- GrantDeliveryReceipt (S1-C04) ---------------------------
    ("GrantDeliveryReceipt", "written"): spec(
        'The enforcement point names itself, the instance it attested and the grant that '
        'arrived, at the sequence number of the first effect. It attests arrival, not '
        'scope, and an executor whose grant did not arrive fails loudly instead of '
        'completing with less.',
        ['w-gr-written', 's-gr'],
        [('nfp', ['/payload/agent_instance_ref', '/payload/first_effect_seq', '/payload/enforcement_point_id', '/payload/grant_ref']), ('eqF', '/payload/arrival_attested', True), ('rpp', [('/payload/grant_ref', ['active'], False)]), AR],
        hard=['nfp', 'eqF', 'rpp']),

    # -- InstrumentCalibration (S1-C06) ---------------------------
    ("InstrumentCalibration", "scheduled"): spec(
        'The session names the checker and the rubric version it will exercise, the date '
        'it is due, and the custodian that will write it. Scheduling a calibration '
        'establishes nothing about the instrument.',
        ['w-ic-run', 's-registered-type'],
        [('nfp', ['/payload/checker_id', '/payload/rubric_version', '/payload/run_date', '/payload/custodian_assignment_ref']), AR],
        hard=['nfp']),
    ("InstrumentCalibration", "run"): spec(
        'Both numbers from the same session are recorded: the planted-defect result and '
        'the paired clean-case refusal rate. The custodian that wrote them is excluded '
        'from every producing path and the write is carried by an authorized protected '
        'change. A missing clean-case rate leaves the checker unresolved rather than '
        'passed.',
        ['w-ic-run', 's-ic'],
        [('nfp', ['/payload/planted_defect_detection_rate', '/payload/clean_case_refusal_rate', '/payload/session_observation_refs', '/payload/protected_change_ref']), ('eqF', '/payload/custodian_excluded_from_producing', True), ('rpp', [('/payload/protected_change_ref', ['authorized', 'activated', 'verified'], False)]), AF, AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("InstrumentCalibration", "superseded"): spec(
        'A later rubric version has been calibrated for the same checker. Superseding a '
        'reading does not erase it, and the old reading stays interpretable under its own '
        'rubric.',
        ['w-ic-run', 's-ic'],
        [('nfp', ['/payload/successor_rubric_version', '/payload/checker_id']), AR],
        hard=['nfp']),

    # -- ProjectionGrant (S1-C04) ---------------------------
    ("ProjectionGrant", "issued"): spec(
        'The grantor, the recipient scope and the purpose are recorded, the scope and '
        'purpose resolve from a parameter authority, and the approval carries an expiry. '
        'Issuing is a proposal right; the release is performed elsewhere.',
        ['w-pg-active', 's-registered-type'],
        [('nfp', ['/payload/grantor_ref', '/payload/recipient_scope', '/payload/purpose', '/payload/parameter_authority_ref', '/payload/approval_expires_at']), AR],
        hard=['nfp']),
    ("ProjectionGrant", "active"): spec(
        'The parameter authority the scope and purpose resolve from is currently '
        'verified, the release was performed by the component that performs every '
        'release, the grant is re-read at every read of the derived projection, and a '
        'current accepted judgment on this criterion exists.',
        ['w-pg-active', 's-pg'],
        [('nfp', ['/payload/parameter_authority_ref', '/payload/released_by_component_id', '/payload/granted_at']), ('eqF', '/payload/reread_at_every_read', True), ('rpp', [('/payload/parameter_authority_ref', ['verified'], False)]), AF, AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("ProjectionGrant", "revoked"): spec(
        'The reason for revocation is recorded and the derivatives written under the '
        'grant are enumerated, because revocation invalidates them. Revocation is not '
        'expiry and does not wait for one.',
        ['w-pg-active', 's-pg'],
        [('nfp', ['/payload/revocation_reason']), ('prF', '/payload/derivative_refs'), AR],
        hard=['nfp', 'prF']),
    ("ProjectionGrant", "expired"): spec(
        'The approval expiry has been reached and the derivatives written under the grant '
        'are enumerated. Expiry is a recorded moment reached, never a grant nobody used.',
        ['w-pg-active', 's-pg'],
        [('nfp', ['/payload/approval_expires_at', '/payload/approved_at']), ('prF', '/payload/derivative_refs'), AR],
        hard=['nfp', 'prF']),

    # -- ShedDecision (S1-C02) ---------------------------
    ("ShedDecision", "written"): spec(
        'The lane, the window, the proposing and authorising components, every obligation '
        'that moved with the custodian that took it, the stated minimum and whether it '
        'was breached, the overflow count and the quantity of allowance that lapsed '
        "unconsumed are all recorded. The holder's stated minimum is evidence and the "
        'record exists whether or not the holder concurred.',
        ['w-sd-written', 'w-holder-minimum-evidence', 's-sd'],
        [('nfp', ['/payload/lane_ref', '/payload/window', '/payload/proposing_component_id', '/payload/authorising_component_id', '/payload/moved_obligation_refs', '/payload/named_custodian_refs', '/payload/stated_minimum']), ('prF', '/payload/overflow_count'), ('prF', '/payload/lapsed_unconsumed_quantity'), ('prF', '/payload/minimum_breached'), AR],
        hard=['nfp', 'prF']),

    # -- StandingHolder (S1-C01) ---------------------------
    ("StandingHolder", "proposed"): spec(
        'The proposal names the duty class, the address an outside party reaches it by, '
        'the mandate it would hold and the frozen fixture that exercises it. A holder '
        'exercised by no fixture is unjustified and is refused on sight.',
        ['w-holder-iff', 's-registered-type'],
        [('nfp', ['/payload/holder_id', '/payload/duty_class_id', '/payload/intake_address', '/payload/exercising_fixture_id']), AR],
        hard=['nfp']),
    ("StandingHolder", "staffed"): spec(
        'All three parts of the conjunction are recorded as holding, the mandate is '
        'currently accepted, a reservation, an alternate, a suspension procedure and a '
        'review date exist, the holder carries no model memory, and a current accepted '
        'judgment on this criterion exists.',
        ['w-holder-iff', 'w-holder-prohibitions', 's-sh'],
        [('nfp', ['/payload/mandate_ref', '/payload/reservation_ref', '/payload/alternate_assignment_ref', '/payload/suspension_procedure', '/payload/review_at']), ('eqF', '/payload/carries_model_memory', False), ('rpp', [('/payload/mandate_ref', ['accepted'], False)]), AF, AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("StandingHolder", "suspended"): spec(
        'The mandate is still live, the suspension procedure that was followed is '
        'recorded, and admission in that duty class has stopped with it. Suspension is '
        'the state that stops work arriving; it never leaves work assigned to nobody.',
        ['w-sh-suspended', 's-sh'],
        [('nfp', ['/payload/suspension_procedure', '/payload/duty_class_id', '/payload/mandate_ref']), ('eqF', '/payload/admission_stopped_for_duty_class', True), AR],
        hard=['nfp', 'eqF']),
    ("StandingHolder", "retired_into"): spec(
        'No duty this holder carries is still live, and the successor that inherits the '
        'address and the residual duties is named. Retirement is refused while any duty '
        'it holds is live.',
        ['w-holder-iff', 's-sh'],
        [('nfp', ['/payload/successor_holder_ref']), ('rpp', [('/payload/successor_holder_ref', ['staffed'], False)]), AR],
        hard=['nfp', 'rpp']),

    # -- StandingInterest (S1-C02) ---------------------------
    ("StandingInterest", "proposed"): spec(
        'The proposal names the interest and its version, the deterministic preconditions '
        'it would arm on, the trust class those preconditions require and the maintenance '
        'custodian proposing it. Proposing is not arming.',
        ['w-si-trial', 's-registered-type'],
        [('nfp', ['/payload/interest_id', '/payload/interest_version', '/payload/precondition_predicate_ids', '/payload/required_trust_class', '/payload/maintenance_custodian_ref']), AR],
        hard=['nfp']),
    ("StandingInterest", "trial"): spec(
        'The trial is bounded and expires, it sits at one of the two lowest effect '
        'classes, it runs under a currently accepted standing mandate, its preconditions '
        'are evaluated deterministically, and it declares no writer key of its own.',
        ['w-si-trial', 's-si'],
        [('nfp', ['/payload/trial_expires_at', '/payload/effect_class_id', '/payload/standing_mandate_ref', '/payload/precondition_evaluator_kind']), ('eqF', '/payload/self_declared_writer_keys', []), ('rpp', [('/payload/standing_mandate_ref', ['accepted'], False)]), AR],
        hard=['nfp', 'eqF', 'rpp']),
    ("StandingInterest", "admitted"): spec(
        'The capability owner that admits it is currently accepted, the per-origin arming '
        'rate is declared, every declared prerequisite is recorded, the interest writes '
        'only proposals, and a current accepted judgment on this criterion exists.',
        ['w-si-trial', 's-si'],
        [('nfp', ['/payload/admitting_owner_ref', '/payload/per_origin_arming_rate', '/payload/prerequisite_refs', '/payload/write_target_phases']), ('rpp', [('/payload/admitting_owner_ref', ['accepted'], False)]), AF, AR],
        hard=['nfp', 'rpp']),
    ("StandingInterest", "suspended"): spec(
        'Arming has stopped and the custodian that may propose its resumption is '
        'recorded. Suspension stops the interest arming; it does not retire it and it '
        'does not discharge what already armed.',
        ['w-si-trial', 's-si'],
        [('nfp', ['/payload/maintenance_custodian_ref', '/payload/interest_version', '/payload/effect_class_id']), AR],
        hard=['nfp']),
    ("StandingInterest", "retired"): spec(
        'The interest no longer arms and the version that last armed is recorded. '
        'Retirement is a recorded end rather than an interest that stopped matching.',
        ['w-si-trial', 's-si'],
        [('nfp', ['/payload/interest_version']), AR],
        hard=['nfp']),

    # -- UnmatchedPoolEntry (S1-C05) ---------------------------
    ("UnmatchedPoolEntry", "landed"): spec(
        'A work record armed no interest, its retention exceeds the longest plausible '
        'outage, the arrival alarm has reached a named reader, and the residue this pool '
        'cannot catch is recorded. A catch-all that caught everything is not this.',
        ['w-up-landed', 's-up'],
        [('nfp', ['/payload/work_record_ref', '/payload/retention_until', '/payload/longest_plausible_outage', '/payload/alarm_reader_ref', '/payload/alarm_raised_at', '/payload/residue_note']), AR],
        hard=['nfp']),
    ("UnmatchedPoolEntry", "claimed"): spec(
        'An admitted interest has claimed the entry and that interest is named. Claiming '
        'is deterministic and by the pool interest, never by whoever noticed it first.',
        ['w-up-landed', 's-up'],
        [('nfp', ['/payload/claiming_interest_ref', '/payload/work_record_ref', '/payload/landed_at']), ('rpp', [('/payload/claiming_interest_ref', ['admitted'], False)]), AF, AR],
        hard=['nfp', 'rpp']),
    ("UnmatchedPoolEntry", "refused"): spec(
        'A reason for the refusal is recorded against the work record the entry names. A '
        'refusal from the pool is a decided outcome and not an entry whose retention ran '
        'out.',
        ['w-up-landed', 's-up'],
        [('nfp', ['/payload/refusal_reason', '/payload/work_record_ref']), AR],
        hard=['nfp']),
    ("UnmatchedPoolEntry", "escalated"): spec(
        'The standing holder the entry escalated to is named and staffed, the alarm '
        'reader that saw it is recorded, and the retention the entry still carries is '
        'recorded. Escalation preserves the entry rather than discharging it.',
        ['w-up-landed', 'w-acceptance-role-unfilled', 's-up'],
        [('nfp', ['/payload/escalation_holder_ref', '/payload/alarm_reader_ref', '/payload/retention_until', '/payload/residue_note']), ('rpp', [('/payload/escalation_holder_ref', ['staffed'], False)]), AR],
        hard=['nfp', 'rpp']),
    # --- END WORK-1.1 record overrides ---
}

# The `capabilities.json#/domain_validators` provenance for the eight overrides above.
OVERRIDE_SOURCE = {
    "DeliveryCapacity", "Experiment", "PriceProposal", "LaunchReadiness",
    "Economics", "CashPosition",
}


# --- Contradictions found in the prose. ------------------------------------------
#
# Where two passages disagree about what a phase requires, NEITHER is encoded. The
# entry is recorded and the criterion becomes an explicit gap.
#
# BOTH entries are RESOLVED BY DECISION as of R-K (2026-09-13) and kept here rather
# than deleted: which reading was chosen, and what the losing reading meant, is the
# part a later reader needs. A resolved contradiction is not an absent one.
#
# Resolving them here resolves them in the MACHINES. The prose files are deliberately
# untouched -- that is a separate pass -- so each entry names the sentences that now
# need a supersession note, in `prose_supersession_needed`.

CONTRADICTIONS = [
    {
        "id": "gap-contradiction-disputed-vs-contested",
        "records": ["EvidenceJudgment"],
        "phases": ["contested", "disputed"],
        "what_the_prose_would_need_to_say":
            "Whether `disputed` is a persisted phase or only a presentation label for "
            "`contested`. Both readings appear, and a record carrying both as separate "
            "phases needs one of them defined as something the other is not.",
        "passages": [
            ["01-contract-kernel.md",
             "EvidenceJudgment stores one canonical state. Presentation may call "
             "contested \"disputed\"; it must not persist a second disputed verdict."],
            ["../02-architecture-selection.md",
             "Obligations distinguish reported performance from legitimate discharge, "
             "transfer and surviving dispute."],
        ],
        "status": "resolved_by_decision",
        "resolution": (
            "RESOLVED AS MECHANISM (R-K, 2026-09-13). `contested` is the PERSISTED state "
            "and `disputed` is a PROJECTION of it: a presentation may call a contested "
            "judgment \"disputed\" and must never persist a second verdict. The registry "
            "already agrees and nothing had to be removed to make it so -- EvidenceJudgment "
            "declares proposed, accepted, rejected, inconclusive, contested, stale and "
            "withdrawn, and has never declared a `disputed` phase. "
            "02-architecture-selection.md's \"surviving dispute\" is about a DIFFERENT "
            "SUBJECT: an Obligation that remains contested after the Case carrying it "
            "closes. That is a duty surviving a closure, not a second state of a judgment, "
            "and the two passages were never about the same thing. Every `disputed` phase "
            "that does exist in the registry -- Case, Obligation, SalesAgreement, "
            "Commitment -- is a dispute about work, a duty or an agreement; none is a "
            "dispute about a judgment. `criterion.EvidenceJudgment.contested.v1` carries "
            "the content and no criterion encodes a second verdict. The kind-level "
            "`disputed` spec stays, because the records that use it are the ones this "
            "decision says may legitimately have one. "
            "SUPERSEDED READING: \"neither encoded; both phases keep their own kind-level "
            "content and no record-specific disambiguation is invented.\""),
        "applies_to_criteria": ["criterion.EvidenceJudgment.contested.v1"],
        "prose_supersession_needed": [
            ["01-contract-kernel.md",
             "EvidenceJudgment stores one canonical state. Presentation may call contested "
             "\"disputed\"; it must not persist a second disputed verdict.",
             "Now enforced rather than asserted; the sentence stands and should say so."],
            ["../02-architecture-selection.md",
             "Obligations distinguish reported performance from legitimate discharge, "
             "transfer and surviving dispute.",
             "Needs a note that \"surviving dispute\" means a CONTESTED OBLIGATION "
             "surviving case closure, not a second judgment state -- which is the reading "
             "that made this look like a contradiction."],
        ],
    },
    {
        "id": "gap-contradiction-parked-review-vs-closure",
        "records": ["Case"],
        "phases": ["parked"],
        "what_the_prose_would_need_to_say":
            "Whether parking requires a next REVIEW date or a CLOSURE account. The "
            "kernel's transition row names both with `or`, and the company contract "
            "names only the review date; a guard cannot check `or` without knowing "
            "which field carries which.",
        "passages": [
            ["01-contract-kernel.md",
             "proposed/admitted/active/waiting-for-evidence → parked or abandoned: "
             "authorized reason, next review/closure account, cancellation and surviving "
             "duty ownership"],
            ["03-company-capabilities.md",
             "At review time an untouched goal is reaffirmed with evidence, narrowed, "
             "parked with a reopening trigger or abandoned with duty disposition."],
        ],
        "status": "resolved_by_decision",
        "resolution": (
            "RESOLVED AS MECHANISM (R-K, 2026-09-13). Parking records BOTH. The kernel's "
            "`or` is read as a CONJUNCTION, because its two halves answer different "
            "questions: the review date says when someone looks again, the closure account "
            "says what becomes of the surviving duties if nobody does. A guard cannot check "
            "`or` without knowing which field carries which, and the cheapest correct "
            "reading of an ambiguous `or` in a duty-preserving contract is the one that "
            "preserves more -- the looser reading lets a park with a date and no account "
            "pass, and that park is how a duty goes quiet. Case gains "
            "`/payload/parking_closure_account_ref` -> ReasonRecord, OPTIONAL on the record "
            "and REQUIRED by `criterion.Case.parked.v1` beside `/payload/review_at`. "
            "Optional on the record because a field every Case must carry merely to be "
            "registered is not what parking needs; required by the criterion because that "
            "is where parking happens. Same shape AD-013 gives `fulfillment_ref`. "
            "03-company-capabilities.md is NOT contradicted by this: it names one of the "
            "two halves and the kernel names both, which is an incompleteness rather than a "
            "disagreement. "
            "SUPERSEDED READING: \"the shared half is encoded (authorized reason, surviving "
            "duty ownership, a bounded interval); the review-versus-closure choice is not.\""),
        "applies_to_criteria": ["criterion.Case.parked.v1"],
        "prose_supersession_needed": [
            ["01-contract-kernel.md",
             "proposed/admitted/active/waiting-for-evidence → parked or abandoned: "
             "authorized reason, next review/closure account, cancellation and surviving "
             "duty ownership",
             "Needs a note that `next review/closure account` is read as BOTH, and that "
             "the guard now demands both."],
            ["03-company-capabilities.md",
             "At review time an untouched goal is reaffirmed with evidence, narrowed, "
             "parked with a reopening trigger or abandoned with duty disposition.",
             "Names the review half only. Needs a note that parking a Case also records a "
             "closure account, so a reader does not take this sentence as the whole rule."],
        ],
        "scope_note": (
            "SUPERSEDED 2026-09-13 by GR-02, and kept verbatim because what was deferred "
            "is the useful part: \"The mechanism is on Case, the record the contradiction "
            "named. Seven other records declare a `parked` phase -- Goal, Mission, "
            "Project, WorkflowRun, KnowledgeQuestion, Opportunity, WorkOrder -- and none "
            "gains a closure-account field here. Adding one to eight records on the "
            "authority of a contradiction raised about one of them would be a bigger "
            "decision than the one recorded, and it is not made. That is a KNOWN residue, "
            "stated rather than closed.\" The residue is closed now, per record rather "
            "than in bulk, and `parked_record_disposition` below is the answer for all "
            "eight."),
        "parked_record_disposition": {
            "decided": "2026-09-13, GR-02",
            "discriminator": (
                "Does the record's OWN payload declare a `Ref<Obligation>[]` field? This "
                "is mechanical and checkable in record-registry.json, which is why it can "
                "be stated rather than argued. Where it does, parking the record parks "
                "duties belonging to that record, the kernel's closure account is what "
                "says what becomes of them when the review never happens, and the field "
                "is added and required by the parked criterion. Where it does not, every "
                "duty reachable from the record belongs to some OTHER record that has its "
                "own parking or closure guard, and a second account here would duplicate "
                "an answer rather than supply one. Case carries `obligation_refs` and was "
                "decided this way by R-K, so GR-02 extends one rule rather than inventing "
                "a second."),
            "field_added": {
                "Mission": (
                    "ADDED. Payload carries `residual_obligation_refs: Ref<Obligation>[]` "
                    "-- obligations that are residual to the mission itself. Mission also "
                    "declares `review_at`, so it is the only one of the four where "
                    "`criterion.Mission.parked.v1` can demand BOTH halves of the kernel's "
                    "disjunction, and it does."),
                "Project": (
                    "ADDED. Payload carries `closure_duty_refs: Ref<Obligation>[]`, and a "
                    "parked project is exactly the state in which those duties stop being "
                    "worked while remaining owed. No `review_at` on the record, so "
                    "`criterion.Project.parked.v1` demands the account half only."),
                "WorkflowRun": (
                    "ADDED. Payload carries `unfinished_obligation_refs: "
                    "Ref<Obligation>[]`. A run parked mid-execution holds a "
                    "`continuation_ref` and its unfinished obligations; without an account "
                    "those obligations have no disposition if the run is never resumed. No "
                    "`review_at`, so the account half only."),
                "WorkOrder": (
                    "ADDED. Payload carries both `duty_refs: Ref<Obligation>[]` and "
                    "`unfinished_obligation_refs: Ref<Obligation>[]`, plus a `lease` and "
                    "`reservation_refs`. It is the strongest case of the four: parking an "
                    "order suspends the work while the entitlement behind it survives. No "
                    "`review_at`, so the account half only."),
            },
            "no_account_needed": {
                "Goal": (
                    "NO ACCOUNT. Goal's payload declares no obligation field at all; its "
                    "duties are carried by the Cases in `case_refs`, and each Case's own "
                    "`criterion.Case.parked.v1` already demands an account for them. The "
                    "corpus says the same thing directly -- 03-company-capabilities.md: "
                    "\"At review time an untouched goal is reaffirmed with evidence, "
                    "narrowed, parked with a reopening trigger or abandoned with duty "
                    "disposition\" -- duty disposition happens at ABANDONMENT, parking "
                    "takes a reopening trigger, and `reopen_predicate` and `review_at` are "
                    "both REQUIRED fields on the record. The review half is already "
                    "structurally present; the account half would answer a question the "
                    "Cases answer."),
                "KnowledgeQuestion": (
                    "NO ACCOUNT. No obligation field; `affected_refs` point at records "
                    "that carry their own duties. A parked question owes nobody anything "
                    "-- the kernel's own Case row names this case exactly: \"Parking "
                    "discretionary inquiry may retain unknown truth.\" Retained unknown "
                    "truth is not a surviving duty, and the review half is already on the "
                    "record as required `next_check_at` beside a required `stop_predicate`."),
                "Opportunity": (
                    "NO ACCOUNT. No obligation field and nothing owed to anyone: an "
                    "Opportunity is pre-commitment, and 03-company-capabilities.md states "
                    "the limit as a rule -- `Opportunity.advanced` must not be mistaken "
                    "for \"Proven demand, a validated market or authority to sell. "
                    "Advancing an idea never implies authority to sell.\" An idea that "
                    "cannot create an entitlement cannot leave one behind when it is "
                    "parked. The review half is on the record as a required "
                    "`reopen_condition`."),
            },
            "what_would_reopen_this": (
                "Any of the three gaining a `Ref<Obligation>[]` payload field, or a guard "
                "elsewhere that lets a duty be owned by a Goal, KnowledgeQuestion or "
                "Opportunity directly rather than through a Case. The discriminator is "
                "re-checkable against record-registry.json at any time, which is the "
                "point of choosing a mechanical one."),
        },
    },
]


# --- Composition. ----------------------------------------------------------------

_INITIAL_PHASE_SPEC = spec(
    "A seed factory may create this initial state and no other: the record's own "
    "declared identity and scope fields are present, a custodian is assigned before "
    "admission, and required inputs may be honest unknowns where the capability "
    "permits uncertainty. Recording the revision does not make its output acceptable "
    "or authorize any effect, so no judgment is required and none would be sufficient.",
    ["c-seed", "k-envelope"],
    [("nf", ["subject_identity", "custodian"]), AR])

_COMPILED = {role: [re.compile(p) for p in pats] for role, pats in ROLES.items()}

# CCR-03's repair restricted every subject-taking primitive's `record_type` enum, and
# four of them to a SINGLE record: `delivery_ready` to DeliveryCapacity,
# `launch_children` to LaunchReadiness, `price_scope` to PriceProposal and
# `resource_equation` to ResourceAccount. A criterion composing one of those on any
# other record fails `validate_contracts.py` -- correctly. So a conjunct is checked
# against the primitive's own enum before it is emitted, and dropped (or turned into
# a gap, when the requirement depends on it) rather than written and caught later.
PRIMITIVES = {}

# Distinct from None. None means "this record carries no evidence of that kind", which
# is a content gap when the requirement depends on it. NOT_APPLICABLE means "the
# primitive that expresses this is defined for a different record" -- `resource_equation`
# is ResourceAccount's, `price_scope` is PriceProposal's -- which is a limit of the
# primitive, not an absence in the source. The requirement's other conjuncts still
# hold, so it is dropped even where it was marked hard, and the drop is reported.
NOT_APPLICABLE = object()


def set_primitives(registry):
    PRIMITIVES.clear()
    PRIMITIVES.update(registry)


def primitive_admits(op, record):
    entry = PRIMITIVES.get(op)
    if entry is None:
        return True
    schema = entry.get("argument_schema", {}).get("properties", {}).get("subject_ref")
    if not schema:
        return True
    enum = schema.get("properties", {}).get("record_type", {}).get("enum")
    return enum is None or record in enum


ENVELOPE_PATHS = frozenset({
    "/owner_assignment_ref", "/access_policy_ref", "/retention_policy_ref",
    "/provenance_refs", "/effective_from", "/effective_until",
})


def payload_declared(records_schema, record):
    """Every payload field the record's schema declares, required or not.

    `nfp`/`rpp` may name an OPTIONAL field -- AD-013 makes `/payload/fulfillment_ref`
    optional at registration and required to reach `performed`, which is the whole
    point of the decision. What they may not name is a field that does not exist.
    """
    payload = records_schema["$defs"][record].get("properties", {}).get("payload", {})
    names = set(payload.get("properties", {}))
    for branch in payload.get("oneOf", []):
        names |= set(branch.get("properties", {}))
    return names


RECORD_SPECIFIC_KINDS = ("nfp", "rpp", "neF", "prF", "eqF")


def literal_paths(item):
    """Every field path this conjunct names, recursively; () when it names none."""
    if item[0] == "nfp":
        return tuple(item[1])
    if item[0] == "rpp":
        return tuple(path for path, _states, _optional in item[1])
    if item[0] in ("neF", "prF", "eqF"):
        return (item[1],)
    if item[0] == "not":
        return literal_paths(item[1])
    if item[0] in ("either", "every"):
        return tuple(p for inner in item[1] for p in literal_paths(inner))
    return ()


def literal_kinds(item):
    """Every conjunct kind this item uses, recursively."""
    found = [item[0]]
    if item[0] == "not":
        found.extend(literal_kinds(item[1]))
    if item[0] in ("either", "every"):
        for inner in item[1]:
            found.extend(literal_kinds(inner))
    return found


def payload_required(records_schema, record):
    """The record's REQUIRED payload field names, in schema order."""
    definition = records_schema["$defs"][record]
    payload = definition.get("properties", {}).get("payload", {})
    names = list(payload.get("required", []))
    for branch in payload.get("oneOf", []):
        for name in branch.get("required", []):
            if name not in names:
                names.append(name)
    return names


def role_paths(required_fields, role):
    """`/payload/<field>` for every required field this role matches.

    `deadline_end` subtracts `deadline_start`: `_at$` is how this corpus spells both
    ends of an interval, and a criterion that took `created_at` for an end bound would
    read as a freshness check while checking nothing about freshness.

    Falls back to the kernel envelope only when the payload names nothing for the role.
    """
    patterns = _COMPILED[role]
    found = ["/payload/" + name for name in required_fields
             if any(p.search(name) for p in patterns)]
    if role == "deadline_end":
        starts = set(role_paths(required_fields, "deadline_start"))
        found = [path for path in found if path not in starts]
    if not found:
        found = list(ENVELOPE_FALLBACK.get(role, []))
    return found


def interval_paths(required_fields):
    """The record's own declared start and end paths, or None."""
    starts = role_paths(required_fields, "deadline_start")
    ends = role_paths(required_fields, "deadline_end")
    if not starts or not ends:
        return None
    return starts[0], ends[0]


def _subject():
    return {"arg": "subject_ref"}


def _subject_path(pointer):
    """The subject's own decoded value at `pointer`.

    One idiom, already in the registry: `identity.current.v1` and
    `capture.kind.present.v1` both spell a field read as path-over-resolve. Unlike
    `nonempty_fields` this reaches INSIDE a payload value, which is what a typed marker
    with its own `reason` and window needs.
    """
    return {"op": "path", "value": {"op": "resolve", "ref": _subject()},
            "pointer": pointer}


def build_conjunct(item, record, criterion_id, required_fields):
    """One conjunct node, or None when its evidence does not exist on this record."""
    kind = item[0]
    if kind == "s1" and not primitive_admits(item[1], record):
        return NOT_APPLICABLE
    if kind == "nf":
        paths = []
        for role in item[1]:
            for path in role_paths(required_fields, role):
                if path not in paths:
                    paths.append(path)
        if not paths:
            return None
        return {"op": "nonempty_fields", "subject_ref": _subject(), "field_paths": paths}
    if kind == "nfp":
        return {"op": "nonempty_fields", "subject_ref": _subject(),
                "field_paths": list(item[1])}
    if kind == "rpp":
        return {"op": "related_phases", "subject_ref": _subject(),
                "bindings": [{"field_path": path, "states": list(states),
                              "optional": bool(optional)}
                             for path, states, optional in item[1]]}
    if kind == "rp":
        bindings = []
        for role, states, optional in item[1]:
            for path in role_paths(required_fields, role):
                bindings.append({"field_path": path, "states": list(states),
                                 "optional": bool(optional)})
                break  # one binding per role: the role's first declared carrier
        if not bindings:
            return None
        return {"op": "related_phases", "subject_ref": _subject(), "bindings": bindings}
    if kind == "af":
        return {"op": "accepted_for", "subject_ref": _subject(),
                "predicate_id": criterion_id, "judgment_refs": {"arg": "judgment_refs"}}
    if kind == "ar":
        return {"op": "attested_result", "subject_ref": _subject(),
                "predicate_id": criterion_id, "predicate_version": "1.0",
                "observation_refs": {"arg": "observation_refs"}}
    if kind == "nc":
        return {"op": "native_correlated", "subject_ref": _subject(),
                "observation_refs": {"arg": "observation_refs"}, "result": item[1]}
    if kind == "fi":
        pair = interval_paths(required_fields)
        if pair is None:
            return None
        return {"op": "fresh_interval", "subject_ref": _subject(),
                "start_path": pair[0], "end_path": pair[1]}
    if kind == "rc":
        return {"op": "release_contract", "subject_ref": _subject(), "phase": item[1]}
    if kind == "ag":
        edges = []
        for role in item[1]:
            for path in role_paths(required_fields, role):
                if path not in edges:
                    edges.append(path)
        if not edges:
            return None
        return {"op": "acyclic_record_graph", "subject_ref": _subject(),
                "edge_fields": edges}
    if kind == "s1":
        return {"op": item[1], "subject_ref": _subject()}
    if kind == "ne":
        return {"op": "nonempty", "value": {"arg": item[1]}}
    if kind == "uq":
        return {"op": "unique", "items": {"arg": item[1]}}
    if kind == "not":
        inner = build_conjunct(item[1], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "not", "predicate": inner}
    if kind == "neF":
        return {"op": "nonempty", "value": _subject_path(item[1])}
    if kind == "prF":
        return {"op": "present", "value": _subject_path(item[1])}
    if kind == "eqF":
        return {"op": "eq", "left": _subject_path(item[1]), "right": item[2]}
    if kind in ("either", "every"):
        built = []
        for inner_item in item[1]:
            inner = build_conjunct(inner_item, record, criterion_id, required_fields)
            if inner is None or inner is NOT_APPLICABLE:
                # A disjunct that does not resolve is not a disjunct that is satisfied.
                # Dropping it would WIDEN an `any`; dropping one from an `all` narrows the
                # requirement. Either way the stated requirement is no longer what is
                # written, so the whole conjunct fails to resolve and its spec decides.
                return inner
            built.append(inner)
        return {"op": "any" if kind == "either" else "all", "predicates": built}
    raise ValueError("unknown conjunct kind: " + kind)


def compose(record, phase, criterion_id, records_schema, declared_args,
            initial_phase=None):
    """(body, derived_from, dropped) or (None, None, reason) when this is a gap."""
    entry = RECORD_OVERRIDES.get((record, phase)) or PHASE_SPECS.get(phase)
    if entry is None and phase == initial_phase:
        # A record's INITIAL phase is not entered by any transition -- no edge names
        # its criterion -- so what it states is "what a seed factory may create",
        # which the company contract states once for every such phase rather than
        # per name. 27 initial phases carry names the corpus uses nowhere else
        # (`captured`, `unassessed`, `suspected`, `invited`, ...); this is the source
        # for all of them, and it is deliberately NOT applied to any phase an edge
        # enters, where a general rule would paper over a real per-phase question.
        entry = _INITIAL_PHASE_SPEC
    if entry is None:
        return None, None, "the prose states no evidence requirement for this phase name"

    # A literal path is a claim about THIS record's schema, so it is checked against it
    # before anything is emitted. Unchecked, a renamed or misspelled field would produce
    # a `nonempty_fields` naming nothing -- a criterion that reads as a requirement and
    # demands a field the record cannot have.
    declared_paths = payload_declared(records_schema, record)
    for item in entry["conjuncts"]:
        for path in literal_paths(item):
            if path in ENVELOPE_PATHS:
                continue
            # Only the first payload segment is checked: `eqF` and `prF` reach INSIDE a
            # typed value (`/payload/external_burden_account/finding`), whose shape is
            # values.schema.json's business and not this module's.
            segments = path.split("/")
            if len(segments) < 3 or segments[1] != "payload" \
                    or segments[2] not in declared_paths:
                raise ValueError(
                    "%s %s: conjunct names %r, which %s does not declare"
                    % (record, phase, path, record))
        if (record, phase) not in RECORD_OVERRIDES:
            for kind in literal_kinds(item):
                if kind in RECORD_SPECIFIC_KINDS:
                    raise ValueError(
                        "%s %s: `%s` names one record's own fields and belongs in "
                        "RECORD_OVERRIDES, not in a kind-level PHASE_SPECS entry"
                        % (record, phase, kind))

    required_fields = payload_required(records_schema, record)
    predicates, dropped = [], []
    for item in entry["conjuncts"]:
        node = build_conjunct(item, record, criterion_id, required_fields)
        if node is NOT_APPLICABLE:
            dropped.append("%s:%s(not defined for %s)" % (item[0], item[1], record))
            continue
        if node is None:
            if item[0] in entry["hard"]:
                return None, None, (
                    "the requirement states evidence this record carries no field for: "
                    "conjunct '%s' does not resolve" % item[0])
            dropped.append(item[0])
            continue
        # A criterion may only read arguments it declares.
        if _reads_undeclared(node, declared_args):
            if item[0] in entry["hard"]:
                return None, None, (
                    "the requirement needs an argument this criterion does not declare: "
                    "conjunct '%s'" % item[0])
            dropped.append(item[0])
            continue
        predicates.append(node)

    if not predicates:
        return None, None, "every conjunct of the stated requirement dropped on this record"

    derived_from = [{"file": CITE[c][0], "anchor_or_quote": CITE[c][1]}
                    for c in entry["cites"]]
    if record in OVERRIDE_SOURCE and (record, phase) in RECORD_OVERRIDES:
        derived_from.insert(0, {"file": DOMAIN_VALIDATOR_CITE[0],
                                "anchor_or_quote": DOMAIN_VALIDATOR_CITE[1]})
    body = {"op": "all", "predicates": predicates}
    return body, {"requires": entry["requires"], "derived_from": derived_from,
                  "dropped_conjuncts": sorted(set(dropped))}, None


def _reads_undeclared(node, declared):
    stack = [node]
    while stack:
        item = stack.pop()
        if isinstance(item, dict):
            if set(item) == {"arg"}:
                if item["arg"] not in declared:
                    return True
                continue
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)
    return False
