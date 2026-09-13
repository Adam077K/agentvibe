# Contract kernel

**Contract:** S1-KERNEL 1.0.0. **Authoring base:** 6a2487a, 2026-09-12. **Status:** final-intended specification for independent review, not implemented or accepted software. This author previously performed the technical review; this authoring turn cannot independently accept its own solution.

This document and [authority/recovery](02-authority-recovery.md) turn [S1.0](../02-architecture-selection.md) into one contract set. [TF1](../candidates/technical-foundation-repairs-v1.md), [CF1](../candidates/company-foundation-repairs-v1.md), and [D2 technical](../reviews/D2-technical.md) remain binding. The domain procedures and human decisions extend this kernel in [company capabilities](03-company-capabilities.md), [human operation](04-human-operation.md), and [the capability catalog](capabilities.json). A capability, schema subject, logical component and deployable process are different things.

## 1. Chosen execution model and alternatives

The core is a modular Node.js 24 LTS application with TypeScript, PostgreSQL 18, HTTPS JSON interfaces, and PostgreSQL transactional inbox/outbox/timer tables. It uses ordinary functions for predicates and arithmetic, durable records for waiting and resumption, bounded native model sessions for interpretation and generation, and actual competent humans/services for performance requiring them. It does not give each domain schema a service or permanent agent.

The operational profile is specified in authority/recovery section 2. PostgreSQL has one admitted writer per registry generation, an independently administered synchronous recovery standby, and a recovery witness reading that standby. The witness's separate small writable PostgreSQL cluster holds receipt/frontier state; it is not another departmental authority. There is no automatic failover, asynchronous release mode, or quorum election implemented by application workers.

| Feasible alternative | What it would simplify | Reason for the selected choice; reopening condition |
|---|---|---|
| S0: native applications, fixed grants, manual register and competent manual release | Least bespoke agenda software; a serious full-company comparator | Must still meet recovery, owner allowance, rights and continuity. Prefer S0 if it meets the same measured obligations and useful throughput at lower total cost |
| One application with SQLite and files on the founder's computer | Installation and SQL operations | A computer and its backup are one declared loss scope. Adding independent envelope/frontier/release ordering recreates infrastructure; this remains a simulation profile, not the operational profile |
| PostgreSQL primary with asynchronous replica/backups | Familiar recovery and fewer blocking dependencies | Cannot provide zero loss of acknowledged released consequences under primary-and-backup loss. Unacknowledged local rows are insufficient release evidence |
| PostgreSQL synchronous standby alone | Removes the application witness | Ordinary commit acknowledgments do not furnish the exact independently checkable recovery proof needed after a lost acknowledgment. The witness binds complete content, generation, membership and ordered frontier |
| Separate broker, workflow engine, Redis and event bus | Mature specialized features | Adds persistence, replay and permission contracts without a demonstrated need at this scope. SQL outbox/timers suffice; add another product only for a measured bottleneck and a reviewed authority/recovery mapping |
| Independent domain issuers / distributed transaction protocol | Administrative domain autonomy | S1 has no such internal autonomy requirement. All mutable company prerequisites share one serial order; independent issuers require the explicit extension rule in authority/recovery section 10 |
| Custom event-store/consensus implementation | A single bespoke abstraction | PostgreSQL already supplies transactions, constraints and replication. The witness is narrowly an independent proof/frontier boundary, not a new database or consensus algorithm |

The version baseline is Node 24.21.0 and PostgreSQL 18.6 as observed on 2026-09-12. Implementations pin exact supported patch/build/image digests in RuntimeProfile and undergo admission after changes. These observations do not authorize freezing vulnerable patches. Ajv 8's separate 2020-12 validator compiles repository-owned JSON Schema 2020-12; coercion, schema downloads and mutation of input during validation are disabled. Unknown command fields are rejected. External documents cannot supply executable validators.

## 2. Logical component and deployment interfaces

| ID | Component / write authority | Required input → output |
|---|---|---|
| S1-C01 | Direction and responsibility register | Authenticated endorsement, actual principal/standing and accepted assignments → immutable intent/mandate/ownership references |
| S1-C02 | Case admission and scheduler | Duties, proposals, observations, finite capacity and priorities → WorkOrder, causal reservation, checkpoint/continuation |
| S1-C03 | Domain production interfaces | WorkOrder, authorized ContextManifest and admitted runtime → staged artifact, AttemptReport, source observations and unfinished duties |
| S1-C04 | Consequence authority and release | Exact OperationIntent, current prerequisites, reservations and independent proof → release/denial, bounded SendClaim and truthful effect status |
| S1-C05 | Context and validity | Authorized references, purpose/destination and live lineage → ContextManifest or atomically published derivative |
| S1-C06 | Evidence and acceptance | Protected capture, independently versioned measurement/interpretation dependencies → scoped judgment, disagreements and acceptance evidence |
| S1-C07 | Human and external responsibility interface | DecisionPacket or accepted service handoff → attributable decision, competent performance, owned incapacity or grievance progress |
| S1-C08 | Recovery and continuity | Current independent frontier, fenced generations, surviving duties and actual substitutes → recovery permit, reconciliation and accepted continuation |
| S1-C09 | Operator surfaces | Permission-filtered projections with watermarks → conversation, terminal and accessible views; all mutations return through commands |

C01/C02/C05 and domain coordinators may share the protected application process. C03 native execution cannot share its credentials, writable database or host administration. C04's transport gate and C08's independent witness retain their separate privilege/fault boundaries. C06 capture is protected from the producer whose evidence it assesses. C09 projections have no authority over upstream state.

This table establishes identities and interfaces, not the complete directive 8.6 component catalog. Final schema/build integration must provide one component-contract matrix for S1-C01–09 covering accountable owner, nonresponsibilities, authoritative/derived state and lifecycle, trust/permissions, failure and observability/evaluation, scaling, versioning, replacement and removal, with links to these enforcement contracts and domain procedures. Those matrix obligations are not claimed complete by the nine rows here.

Domain-specific source systems remain authoritative about their native facts. The kernel is authoritative about the company's grants, work, recorded knowledge and acceptance. An invoice imported here does not become a bank settlement; an internal acceptance does not extinguish another party's standing. A SemanticMappingVersion names source fields, units, meanings, unmapped states, ownership and expiry before native data participates in decisions.

## 3. Normative types and record envelope

MUST, MUST NOT and required fields are normative. Optional fields are marked with ?. Missing and null differ; null is prohibited unless explicitly admitted by a payload schema. Timestamps are RFC 3339 UTC strings with explicit Z. Trusted time is a different type from a recorded timestamp. Decimal integer strings match 0 or a nonzero digit followed by digits, with signed forms only where explicitly allowed; arithmetic uses checked integers/decimals, never JavaScript floating point for authority.

~~~text
UUID = RFC 9562 UUIDv7 string
UInt64 = canonical decimal string, 0..18446744073709551615
Revision = UInt64 excluding "0"
Digest = "sha256:" followed by 64 lowercase hexadecimal digits
Ref = {record_id: UUID, record_type: string, revision: Revision}
Position = {
  registry_generation: UInt64,
  sequence: UInt64,
  transaction_hash: Digest
}
Quantity = {unit: string, amount: canonical decimal string, scale: integer 0..18}
Money = {currency: ISO-4217 code, minor_units: signed decimal integer string,
         exponent: integer 0..6}
RecordEnvelope = {
  record_id: UUID, record_type: string, schema_version: "major.minor",
  company_id: UUID, principal_id: UUID, venture_refs: Ref[],
  revision: Revision, owner_assignment_ref: Ref,
  created_event_id: UUID, last_event_id: UUID, recorded_at: UTC,
  effective_from?: UTC, effective_until?: UTC,
  access_policy_ref: Ref, retention_policy_ref: Ref,
  provenance_refs: Ref[], state: record-specific enum,
  payload: record-specific closed object
}
~~~

company_id identifies a coordination namespace, not a legal entity. principal_id identifies an actual natural or legal principal in the Principal register; a venture never silently creates one. Every operation also identifies the exact external account and standing under that principal. A common company namespace may contain multiple principals, but their money, permissions, liabilities and restricted reserves remain separate. Cross-company interactions cannot be released by assuming disjointness.

Ref always points to an immutable historical revision. A request for “current” is a query selector resolved server-side to an exact Ref plus current restriction epochs before use. IDs carry no ordering or trustworthy time merely because UUIDv7 has a time field. record_type and company/principal identity cannot change in place. Revision increments by exactly one, under a matching expected revision. Superseding a record does not erase its history or silently migrate its relationships.

Owner assignment is required even for unfinished work. Initialization atomically creates an actual Principal, founding mandate, root ResponsibilityAssignment and policies. Only that root assignment may reference its own first revision as owner; its signed/attributable acceptance and limited standing are explicit. Protective intake records use an already accepted provisional assignment. No service name, model identity or self-reference manufactures legal standing or competence. Changing the owner reference requires the domain transfer acknowledgment, with the old custodian retained for unresolved scope until transfer takes effect.

effective_from/until describe the asserted business interval. recorded_at describes when this system recorded it; backdated effective facts never rewrite history. Current source-validity/access epochs are separate authority inputs. Retention and access policies are versioned references but tightened live restrictions override an old permissive reference.

Canonical envelope/payload bytes use RFC 8785 JSON canonicalization, SHA-256 and domain-separated hash inputs. Strings are not silently Unicode-normalized. Duplicate JSON object keys, nonfinite numbers and ambiguous numerical encodings are rejected before parsing into authority types. Opaque provider bytes remain exact bytes with media type, length and digest; reserialization is not evidence of identical requests.

### 3.1 Directive subject bindings and reference identity

The later 46-subject catalog must bind a subject to its canonical record types explicitly. A subject label is not permission to create a second incompatible identity/state machine. The following bindings are fixed by this contract; the catalog supplies the remaining domain fields and relationships without changing these identities.

| Directive subject | Canonical binding / relationship |
|---|---|
| Vision | IntentVersion; Vision is the subject label, while stored Ref.record_type is IntentVersion |
| Goal | Distinct Goal domain record describing an intended outcome/predicate; Case references it as outcome_ref. A goal can have several cases or no admitted work |
| Mission / Project / Workstream | Distinct domain scope/grouping records with explicit parent and case_refs; none is an alias for Case or an automatic authority/admission layer |
| Task | WorkOrder for an executable admitted task contract; a proposed task is a proposed WorkOrder, not a second mutable Task “done” flag |
| Commitment | An attributable commitment/standing domain record linked to Obligation; a potential or recognized duty is not reduced to the commitment's prose/status |
| Context Manifest / Claim / Artifact | ContextManifest / Claim / ArtifactVersion respectively; knowledge/source/memory domain records link to these and current validity rather than duplicating content authority |
| Decision / Approval / Permission | DecisionRecord / attributable exact-action approval decision / Grant. Approval is evidence/prerequisite, never a second grant implementation |
| Handoff | Continuation plus the domain's acknowledged ResponsibilityAssignment transfer; neither alone discharges surviving obligations |
| Budget / Consequence Class | ResourceAccount and Reservation / versioned consequence predicate definition. Unit-specific authority and qualitative restrictions remain separate |
| Run / Step / Workflow | Domain execution/procedure records linked to WorkOrder, AttemptReport, capability version and causal episode; provider attempt/release states remain the authority contract's types |
| Evidence / Evaluation / Review | Domain evidence/assessment records referring to protected capture, EvidenceBaseVersion and EvidenceJudgment; no domain “pass” bypasses current dependency/acceptance checks |
| Change Proposal / Configuration Version / Deployment / Rollback | Domain lifecycle records linked to ProtectedChange and RuntimeProfile where protected surfaces are affected; actual external deployment/rollback uses OperationIntent |

Aliases are presentation/catalog metadata, not alternate Ref.record_type values. Historical imports with old type names need an explicit SemanticMappingVersion and stable source-to-canonical identity map. They do not obtain authority by renaming. New Goal/Mission/Project/Workstream fields belong to the catalog author; this binding table does not invent their accepted business scope.

The company catalog's agreed bindings additionally map its Intent payload/view to IntentVersion, PersonMandate to Mandate, AcceptanceRecord to EvidenceJudgment, Party to Principal, Operation to OperationIntent, Event to DomainEvent and Attempt to AttemptReport. StrategyDecision/GovernanceDecision specialize DecisionRecord; human ActorBinding is a projection of exact IdentityBinding/Principal/Mandate refs. Incident and Experiment retain their own domain identities with controlling Case refs. ImprovementProposal references ProtectedChange before protected promotion. These are payload/view specializations or linked records, never competing core state machines.

## 4. Intent, knowledge, rationale and events

These are separate record types, not one confidence/status field:

| Type | Required payload / meaning | Forbidden promotion |
|---|---|---|
| IntentVersion | Original endorsed text/attachment refs, authenticated endorser, actual principal, goals, exclusions, value decisions, predecessor and change reason | Inferred goals cannot become endorsed intent |
| Observation | Source identity and capture ref, observed interval, received_at, source version, claim scope, completeness/omissions, access provenance | Receiving a signed observation does not establish its factual truth |
| Claim | Proposition, subject/scope, supporting/opposing refs, epistemic state, uncertainty, validity conditions, assessor | A model confidence or repeated statement cannot become authority |
| ReasonRecord | kind = endorsed_reason / executor_report / causal_hypothesis / unknown_influence; attributable statement, inputs actually captured, limits and contradictions | Executor explanation cannot become established cause |
| DecisionRecord | Exact question/options, deciding actor and mandate, considered evidence/omissions, chosen scope, resulting command refs | Approval cannot supply a missing license, service capacity or authority |
| DomainEvent | A committed transition or attributed receipt, not a free-form claim of success | Event transport delivery cannot establish business completion |

Claim epistemic state is unassessed → supported / contested / unsupported / unknown. New evidence can move any assessed state to contested or unknown; a qualified assessor can produce a new supported/unsupported revision with reasons. Stale is a validity flag, not a truth verdict. Retracted claims remain attributed historical records and cannot be used as current support. No confidence threshold alone can admit work, impose containment or discharge an obligation.

ReasonRecord is immutable after capture; a correction creates a linked new record. An incomplete native handoff increases recorded unknown influence. Omitted provider internals, uncontrolled context and inaccessible evidence remain omissions. Evidence and causal explanation are displayed separately in owner accounts.

## 5. Command, query and event protocol

HTTPS JSON is the only ordinary write ingress. Actor identity comes from authenticated transport and current identity epoch, never a caller-supplied role or principal field. POST /v1/commands accepts:

~~~json
{
  "command_id": "0198fcca-1000-7000-8000-000000000001",
  "type": "case.admit",
  "schema_version": "1.0",
  "company_id": "0198fcca-1000-7000-8000-000000000002",
  "principal_id": "0198fcca-1000-7000-8000-000000000003",
  "expected_revisions": [],
  "causal_episode_id": "0198fcca-1000-7000-8000-000000000004",
  "authority_refs": [],
  "payload": {}
}
~~~

This is the common envelope only; an empty case.admit payload fails its payload contract. context_manifest_ref is required for any input-dependent judgment, publication or release, and prohibited as a substitute for missing captured inputs. expected_revisions is Ref[] for every record intentionally changed. The server also rereads all predicate dependencies; an omitted expected revision cannot bypass an invariant. Bootstrapping a company and intake of a new external report create a server-allocated bounded causal episode under standing authority; a producer cannot request unlimited fresh episodes.

The deduplication key is company_id + authenticated actor_id + command_id. Canonical digest includes all fields and authenticated actor identity. Same key and digest returns the original result; same key with different content returns 409 idempotency_conflict. A different command_id never bypasses business ConflictClaim identity.

~~~text
CommandResult = {
  command_id, outcome: accepted | rejected | conflict | duplicate | durability_pending,
  original_outcome?: accepted | rejected | conflict,
  result_refs: Ref[], event_ids: UUID[], committed_position?: Position,
  durability_receipt_ref?: Ref, reason_codes: string[],
  retry: never | same_command_status | reread_and_resubmit | after_named_dependency,
  status_url, obligation_refs: Ref[], operation_status_ref?: Ref
}
~~~

CommandResult is a response bundle assembled after commit/proof lookup, not the object hashed inside its own transaction. The immutable committed BusinessResult contains {command_id, decision: applied/rejected/conflict, result_refs, event_ids, reason_codes, obligation_refs, operation_status_ref?}. It contains no receipt, receipt reference, signature or its own transaction_hash. The committed group assigns {registry_generation, sequence}; the group hash is computed from the complete canonical body and then stored alongside that body. applied becomes the response outcome accepted only when the exact independent receipt exists. Response duplicate/original_outcome, durability_pending, retry/status routing, committed_position and durability_receipt_ref are assembled from the stable BusinessResult, external proof lookup and current restrictions. They are not backfilled into the original hashed result.

accepted means the transition is committed and independently witnessed. It does not mean a consequence is released, observed, accepted by a customer or discharged. A 202 durability_pending response or interrupted connection requires GET /v1/commands/{command_id}; status never synthesizes acceptance from a primary row. Rejected/conflict results may be logged; their absence after a crash cannot be interpreted as acceptance. A duplicate response includes the stable original business result and fresh live restrictions, not a renewed permit.

Local staging uses a separate POST /v1/staging endpoint, not an accepted /v1/commands response. Its payload is {stage_id: UUID, stage_revision: Revision, kind: draft/checkpoint/intake/report, company_id, principal_id, prior_witnessed_position?, source_refs: Ref[], blob_manifest, proposed_command?, local_owner_assignment_ref, local_expiry}. StageRef = {stage_id, stage_revision, digest, durability: local_staged}; it is deliberately not Ref. Response is locally_saved with exact digest/storage host and export handle, or a local error. Same stage identity/digest is stable; different bytes conflict. The staging service enforces existing local access bounds, size/retention limits and attribution, but cannot grant rights or attest current remote state.

GET /v1/staging/{id}/export yields a deterministic manifest and immutable encrypted blobs/checksums sufficient to retry import or transfer authorized local work without reconstructing a conversation. Survival of the staging host is required. After recovery, kernel.staging.import takes {stage_ref, import_kind, current_context_manifest_ref, responsibility_assignment_ref, proposed_command}; it revalidates all current prerequisites and returns ordinary D2 command results with a permanent source-stage mapping. Staged owner responses remain proposals. worker.checkpoint during witness outage uses this D1 route; it does not silently become an acknowledged authoritative checkpoint. See authority/recovery section 3 for D0/D1/D2 behavior.

A syntactically invalid payload returns 400; unauthenticated/unauthorized requests return 401/403 without leaking inaccessible object existence; expected revision or semantic conflict returns 409; unavailable witness/current generation returns 503 or 202 with status-only retry. Error bodies include machine reason codes and safe readable reasons, not secrets or unrestricted record payloads. Client disconnect does not cancel an already committed command.

Queries:

| Endpoint | Contract |
|---|---|
| GET /v1/records/{id}?revision={n} | Exact historical envelope if currently authorized; content may be restricted/tombstoned. A historical query is not a permission to use it |
| POST /v1/queries | Named query, closed typed filters, purpose, principal and optional minimum Position; no arbitrary SQL or model-selected filesystem paths |
| GET /v1/commands/{id} | Stable committed business result, independent durability state, live restrictions and operation status where applicable |
| GET /v1/events?after={cursor} | Authorized event notifications in registry order, bounded page and opaque cursor; omission/redaction markers preserve honest completeness |
| GET /v1/operations/{id}/status | OperationStatus defined below; cannot serve as a SendClaim |
| GET /v1/health/admission | Authenticated profile/generation/dependency readiness; public version exposes only service availability |

Queries used for decisions require a witnessed Position. If current primary state is ahead of the witness, authoritative queries wait or return durability_pending; they cannot expose its unwitnessed materialized state as accepted truth. History/projections may be served at an explicitly older witnessed position with current access checks. Projection lag can never authorize a mutation.

ProjectionMetadata = {committed_position: Position, source_watermarks: [{source_id, source_revision, observed_at, complete_through?, omissions: string[]}], generated_at: UTC, omissions: string[]}. A missing watermark means unknown completeness. complete_through is a source-defined cursor or timestamp, with its interpretation in the SemanticMappingVersion, not an invented universal watermark.

DomainEvent = {event_id, event_type, schema_version, company_id, principal_id, transaction_position, ordinal, command_id, actor_id, causal_episode_id, occurred_at?, recorded_at, subject_refs, before_refs, after_refs, evidence_refs, reason_ref?, access_policy_ref, payload} is the delivered event view. Its canonical committed event body uses transaction_key = {registry_generation, sequence} instead of transaction_position; it cannot contain its enclosing transaction's future hash. After hashing/commit, the transport attaches Position as metadata without changing the body. ordinal orders events within the group. The transport is at least once; ordering is by Position/ordinal, never arrival or wall-clock time. Consumers persist inbox receipt and projection changes in one transaction. Out-of-order events wait for a known gap or rebuild from an authorized snapshot. Redaction is represented explicitly; it cannot silently claim a complete consumer history.

## 6. Authoritative storage and transaction boundary

One PostgreSQL registry contains principal/identity bindings, records and revisions, current policy/validity epochs, command results, causal/resource accounts, conflict holds, operations, event groups, outbox/inbox, durable timers and protected membership references. Native business systems and the recovery witness have their separately named authority. C03 processes have no database login; API privileges restrict each command to its component and current grants.

UUID columns use PostgreSQL uuid. UInt64/revision/order counters use numeric(20,0) with explicit 0..18446744073709551615 checks, because PostgreSQL signed bigint cannot represent the full contract range. Immutable canonical record/event bytes are retained as bytea or exact durable blobs; JSONB and extracted indexed columns are validated projections of those bytes, not a reserialization source for signatures. Hash/identity/uniqueness/foreign-key constraints join canonical IDs and revisions. Overflow fails the command; no counter wraps or silently truncates.

A mutating command uses SERIALIZABLE isolation, sorted explicit row locks for its company/order counter and affected scopes/accounts, unique constraints and foreign keys. It atomically:

1. Validates identity/generation, expected revisions and schema; loads current immutable references and live restrictive epochs.
2. Evaluates component invariants and all domain prerequisites; computes exact changes using deterministic code.
3. Writes all record revisions, account/hold changes, canonical event bodies, BusinessResult, outbox and timer changes.
4. Increments a transactional per-company counter row and chains the complete transaction group to its predecessor.
5. Commits with remote_apply to the admitted recovery standby, then obtains the independent witness receipt described in authority/recovery.

A PostgreSQL sequence is not the completeness counter: aborted sequence allocations can leave gaps. The locked counter row and transaction group commit together. GroupBody includes predecessor_transaction_hash, registry_generation, sequence, canonical ordered event bodies, changed record postimages or encrypted durable blob references, and BusinessResult. transaction_hash = SHA256(domain_separator || canonical(GroupBody)) is stored beside GroupBody, never inside it. The group excludes its own future receipt/ref/signature, response bundle and full self-Position. Payload references to already committed earlier Positions/receipts are permitted; self-identification uses the assigned generation/sequence or preallocated record/event IDs. The witness verifies the complete contiguous group and content. Physical WAL positions assist replication diagnostics but are not portable business completeness proofs.

Only one unconfirmed authoritative group per company is admitted in this profile. The next command waits for witness confirmation or generation recovery. This deliberately trades throughput for straightforward status semantics. Local emergency ingress may block a route earlier, but cannot report an independently effective revocation until recorded. Streaming raw artifacts/capture do not generate a control transaction per token; they are staged and registered in bounded groups. Measure this latency and founder labor before deployment; a need for pipelining reopens the implementation contract.

Serialization/deadlock failures retry the entire pure transaction at most three times with deterministic bounded jitter. No external action occurs inside these retries. After that return a conflict/retry dependency with the original command identity. A retry cannot consume the same resource twice because result and reservation are transactional. Native/external I/O is prohibited while holding database transaction locks.

A transaction's consequence is an outbox intent, not a network send. Outbox notifications can duplicate or be lost; consumers poll the durable table every second and treat NOTIFY only as a wake-up hint. FOR UPDATE SKIP LOCKED is used only for queue claiming, never for deciding that conflicts, duties or source dependencies do not exist. Timers have {timer_id, target_ref, due_at, latest_responsible_start, purpose, firing_epoch, state}; firing uses a stable command ID derived from timer identity and epoch. Expired worker leases enable recovery of internal work, not automatic repetition of an external effect.

The witness requirement covers authoritative transitions; it does not apply to every keystroke, computation or local save. D1 staging is outside this authoritative transaction path and is explicitly labeled in queries/surfaces. Existing admitted local computation can proceed within its surviving lease, preloaded context and reserved allowance while the witness is unavailable. New authority, current publication, external disclosure and new releases cannot arise from the cached view. This keeps useful local work possible without promising independent durability for it.

Authoritative tables are logged, with fsync and full_page_writes enabled. No direct write path bypasses command functions. The application database role cannot disable triggers, alter schemas, promote a standby, change replication settings or rewrite protected audit history. Database administration is a declared trusted root, protected by change control; SQL permissions cannot defend against the admitted database administrator.

## 7. Core relationships and exact state transitions

The common envelope applies to the following control records. Domain payload details such as ResponsibilityAssignment, InteractionDetermination, DecisionPacket, ResponseDecision, GrievanceCase and DeletionScope are owned by the domain catalog; their authority-bearing references participate in the transactions below.

| Record | Required payload relationships / invariant |
|---|---|
| Principal | kind natural_person/legal_entity, external identity evidence, accepted standing refs, jurisdiction/registration assertions with provenance; an asserted principal is not automatically verified |
| IdentityBinding | authenticated subject/issuer or workload certificate identity, actor record, principal scope, identity_epoch, status, verification evidence |
| IntentVersion / Mandate | Exact purpose and granted decision scope, issuer/holder, exclusions, effective interval, predecessor; native account identity remains separate |
| Case | outcome definition, intent/mandate refs, sponsor assignment, obligation refs, dependency refs, acceptance_contract_ref, causal_episode_id, current plan/checkpoint |
| Obligation | beneficiary/protected reference, actual principal, duty source and standing, custodian, due/latest-start dates, performance/discharge authority, evidence, potential-operation link and unresolved effects |
| CausalEpisode | attributed initiating event, root/parent linkage, class, finite allowance vector, consumed/reserved totals, stop rule, renewals and admitting mandate |
| WorkOrder | case/duty refs, method/capability version, accepted outcome/evidence contract, exact inputs, context manifest, executor constraints, budget reservation, lease, checkpoint and acceptance owner |
| AttemptReport | work order/run/lease/generation, exact output refs, observed facts, reported rationale, usage, errors, omissions, unfinished duties and operation statuses |
| ArtifactVersion | immutable content digest/bytes location, media/size, producer attempt, complete captured lineage, intended purpose/destinations, validation state and evidence links |
| ContextManifest | loader identity/profile, exact source/blob refs, source/access/purpose epochs, transformations, all destination-visible inputs, opaque-session ancestry and omissions |
| ValidityEpoch | scope/source/access/deletion key, monotonically increasing epoch, restriction reason/ref, effective current status, invalidated derivative frontier |
| EvidenceBaseVersion | transitive capture/parser/schema/definition/mapping/evaluator/test-selection/denominator dependencies and hashes; independent capture owner and known common roots |
| EvidenceJudgment | proposition/outcome, evidence base and raw refs, accepted scope, omissions/disagreements, deciding actor/mandate, expiry and reopening conditions |
| OperationIntent / ConflictClaim / Reservation / Release / SendClaim | Exact effects and gates in authority/recovery; never inferred from Case.state |
| OperationStatus | operation_ref, release_ref?, attempt_refs[], phase, effect_knowledge, stop_disposition, frontier: Position, observation_refs[], next_responsible_action and due_at? |
| Continuation | source work/custodian, last witnessed position, unfinished work/duties/effects, context and evidence refs, next owner acknowledgment, deadlines and blocked dependencies |
| RuntimeProfile / SemanticMappingVersion | Exact executable/config/schema/dependency versions, admission evidence, limits/expiry, owner, replacement and invalidation triggers |
| ProtectedChange | proposed target/diff hashes, affected authority/evidence/memory/inflight scope, independent review and authorization, migration/rollback refs, activation generation |

OperationStatus.phase is proposed / held / envelope_durable / released / attempt_claimed / observed / reconciliation_required / closed. effect_knowledge is no_attempt / proven_unsent / provider_acknowledged / observed_applied / observed_not_applied / unknown_effect / disputed. stop_disposition is running / stop_requested / new_attempts_fenced / transport_window_expired / reconciled. These are independently derived dimensions. A closed internal Case can still have unknown_effect. OperationStatus is a versioned disposable projection record for exact UI references, built after its source groups are committed/witnessed; frontier names those already established groups. It is not inserted back into the group whose hash it displays. A BusinessResult may reference an already existing projection revision, or the response may attach the newly built operation_status_ref after commit. Its fields are rebuilt from authoritative operations/attempts and cannot authorize action.

All state machines reject unlisted transitions. Revision changes that preserve a state still validate the same prerequisites. Terminal records are not overwritten; a new linked revision/event or successor case records reconsideration.

| Machine | Transition and guard | Failure/continuation |
|---|---|---|
| Case | proposed → admitted: sponsor acceptance, intent/mandate, finite allowance, prerequisites and acceptance contract; admitted → active: valid WorkOrder/lease and capacity | Missing owner/capacity leaves proposed with protective custody and deadline; it is not silently admitted |
| Case | active → waiting-for-evidence: named missing evidence/observer and deadline; waiting-for-evidence → active: bounded needed work; active or waiting-for-evidence → accepted: C06 judgment and sponsor acceptance of exact scope | Producer success alone cannot accept; surviving obligations remain linked |
| Case | proposed/admitted/active/waiting-for-evidence → parked or abandoned: authorized reason, next review/closure account, cancellation and surviving duty ownership | No obligation disappears. Parking discretionary inquiry may retain unknown truth |
| Case | accepted → disputed: attributable challenge or changed prerequisite; disputed → active/waiting-for-evidence/accepted/parked/abandoned with competent disposition | Acceptance history remains; disputes cannot be deleted by resubmission |
| Case | parked → admitted: renewed current prerequisites and finite authority; abandoned → new successor Case only | Neither restores old grant or allowance |
| Obligation | potential → recognized: evidence of arising duty; potential → not_arisen: competent determination and effect reconciliation | A missing receipt leaves potential, with custodian and inquiry deadline |
| Obligation | recognized → performing → performance_reported; recognized/performing/performance_reported → transfer_pending | Exact duty and beneficiary remain, including disputed flags |
| Obligation | performance_reported → discharged: authorized evidence of actual discharge; transfer_pending → transferred: legitimate acknowledged transfer; transfer_pending → prior substantive state: refusal/expiry | Internal task acceptance, owner absence and timeouts cannot discharge or transfer |
| Obligation | discharged/transferred/not_arisen → disputed revision: new legitimate challenge; disputed disposition restores recognized/performance_reported or reaffirms original with authority | Dispute is a separate flag while substantive status is retained |
| WorkOrder | proposed → admitted → leased → running → report_submitted → accepted / rejected | C02 admits, worker acknowledges lease, C03 reports, independent acceptance owner decides |
| WorkOrder | admitted/leased/running → parked / cancelled; leased/running → recovery_required on missed heartbeat or invalidation | Any released effects move independently to reconciliation; accepted work can be challenged with a new order |
| ArtifactVersion | staged → validation_pending → active: atomic lineage/current-epoch publication; validation_pending → rejected | Rejected/stale bytes cannot be used as current input |
| ArtifactVersion | active → invalidated / restricted / deletion_pending; staged/validation_pending → invalidated / deletion_pending; deletion_pending → tombstoned after scoped receipts | Revalidation creates a new artifact revision with new manifest; does not flip old content back to active |
| ContextManifest | captured → admitted → closed; captured/admitted → invalidated; admitted → exhausted | New source, session continuation or disclosure destination requires a new/extended manifest before reading |
| EvidenceJudgment | proposed → accepted / rejected / inconclusive / contested; contested → accepted / rejected / inconclusive after scoped reassessment | proposed is unfinished assessment; inconclusive is completed assessment with insufficient evidence; rejected is evidence that the subject fails its exact criterion; contested records challenged evidence/judgment |
| EvidenceJudgment | accepted / rejected / inconclusive → stale / contested / withdrawn; stale → contested for current reassessment; withdrawn → new successor judgment only | Any transitive dependency revocation invalidates current use until reassessed; every change preserves the earlier exact revision and reasons |
| Continuation | prepared → offered → acknowledged → active → completed; offered → rejected/expired; active → transfer_pending | Old owner retains unfinished scope until exact acknowledged transfer; failure activates accepted continuity |
| ProtectedChange | proposed → reviewed → authorized → staged → activated → verified; any preactivation state → rejected; activated/verified → rollback_required → rolled_back | Improver cannot review/authorize its own protected change; rollback reconciles inflight effects and memory |

Validity updates and publication share the same serial order. The publisher locks all affected live epochs, verifies the loader-recorded manifest and ancestry, registers dependency edges and activates the output in one transaction. An invalidation either precedes publication and blocks it or follows publication and restricts the now-registered derivative. A background graph traversal is not the only guard: reads/releases compare the dependency closure against current epochs and fail if that closure is incomplete or stale. Large closures may use a versioned materialized closure index only at a verified complete frontier.

EvidenceJudgment stores one canonical state. Presentation may call contested "disputed"; it must not persist a second disputed verdict. An assessment work order can finish by returning a complete rejected or inconclusive judgment, while its assessed subject remains unaccepted. Every dependent acceptance guard must match the exact required subject/version and predicate, require current state accepted, and validate scope, evidence-base closure, authority and expiry. An accepted report whose proposition is "evidence is insufficient" does not satisfy a product, capacity or launch predicate. New evidence can produce a reasoned reassessment revision through the listed transitions, never rewrite the historical conclusion.

## 8. Domain production API and durable work

The core command payloads below are closed objects extending the common envelope. Domain human/company payloads are defined in human operation's command table; they cannot alias these commands to bypass their guards.

| Command | Required payload → component result |
|---|---|
| case.propose | {outcome_ref, intent_ref, proposed_sponsor_assignment_ref, source_refs, obligation_refs, acceptance_contract_ref, proposed_allowance} → proposed Case under protective custody |
| case.admit | {case_ref, sponsor_assignment_ref, mandate_ref, acceptance_contract_ref, prerequisite_refs, reservation_refs, plan_ref} → admitted Case/WorkOrder refs or explicit incapacity/conflict |
| case.transition | {case_ref, target_state, reason_ref, evidence_refs, continuation_ref?, successor_case_ref?} → only a listed guarded transition |
| context.capture | {work_order_ref, loader_profile_ref, purpose, destination_contract_refs, requested_source_refs, prior_manifest_ref?} → actual loader-captured manifest and restricted input handles; never trusts a caller's claimed complete read set |
| context.publish | {artifact_ref, context_manifest_ref, validation_evidence_refs, intended_purpose, destination_contract_refs} → active artifact only through atomic current-epoch/lineage validation |
| context.invalidate | {scope_refs, reason_ref, restriction_kind, source_evidence_refs, deletion_scope_ref?} → monotonic restrictive epochs and owned propagation task |
| evidence.propose | {proposition_or_outcome_ref, raw_capture_refs, evidence_base_ref, reported_result, omissions, disagreement_refs} → proposed judgment |
| evidence.decide | {judgment_ref, target_state, deciding_assignment_ref, independent_evidence_refs, scope, expiry, reason_ref} → accepted/rejected/inconclusive/contested or a listed invalidation transition under C06 standing |
| kernel.staging.import | {stage_ref, import_kind, current_context_manifest_ref, responsibility_assignment_ref, proposed_command} → current validated D2 record/result or retained staged refusal |

C03's work claim endpoint is POST /v1/commands type worker.claim with payload {work_order_ref, runtime_profile_ref, executor_identity_ref, requested_lease_ms}. Lease default is 120000 ms; heartbeat every 30000 ms, maximum extension until the WorkOrder wall deadline and remaining budget. The server grants a monotonic lease_epoch plus registry generation; any write checks both and current lineage. These times are scheduling defaults, not permission for delayed external effects.

worker.checkpoint payload is {work_order_ref, lease_epoch, registry_generation, continuation_ref, artifact_refs, observation_refs, usage_delta, unfinished_obligation_refs, operation_status_refs}. worker.report adds {outcome: produced/failed/blocked/cancelled, acceptance_evidence_refs, error_class?, unknown_influence_refs}. It submits reported work; C03 cannot transition the report to independently accepted. Usage is also metered by the harness; a missing worker report never refunds an assumed zero cost.

A WorkOrder gives the executor:

~~~text
{work_order_ref, capability_contract_ref, outcome_ref, input_refs: Ref[],
 context_manifest_ref, allowed_tool_profile_ref, acceptance_contract_ref,
 acceptance_owner_assignment_ref, causal_episode_id, reservation_refs: Ref[],
 lease_epoch, registry_generation, wall_deadline, checkpoint_contract,
 stop_conditions, unfinished_obligation_refs: Ref[]}
~~~

Context delivery is mediated by C05. Every visible input is recorded, including tool stdout/stderr, test fixtures, repository rules, startup context, resumed conversations, native memory, environment-derived data and retrieval snippets. Untrusted text can propose data or actions but cannot change authority fields, policies, tool schemas or supervisor instructions. A native session with inaccessible hidden context is ineligible for protected-source work unless all possible context is authorized for the same destinations and its omissions are explicitly accepted within the task.

C03 stages immutable outputs through a size/media-limited blob API; paths and URLs are proposals. The blob service assigns content addresses and rejects traversal, symlink substitution, decompression bombs and unauthorized source loads. Executable artifacts are data until an admitted deterministic build/test worker receives a separate WorkOrder. Model tools cannot execute in the credential-bearing native client or consequence broker.

Native jobs use subscription authentication only when actually available and allowed by the admitted provider profile. Quota/auth failure parks the job or uses a separately admitted subscription provider with equivalent context permissions and remaining total allowance. No API-key, paid-credit or new subscription fallback is implied. Exact native surfaces and admission obligations are in authority/recovery section 13 and the separately sourced [native feasibility report](../../research/implementation/N01-native-execution.md). Its observations are documentation/help evidence, not executed isolation tests.

Provider sessions are disposable. Resume must bind the same job, current generation, same/narrower grants, complete prior lineage and current disclosure purpose. A stale opaque session is closed; a fresh authorized context reconstruction is charged to the same causal episode. Models can propose decomposition, but only C02 may admit children and atomically reserve from the same root allowance.

## 9. Scheduling, bounds and useful progress

CausalEpisode allowance is a vector: native job launches, wall/process time, observed tool calls, CPU seconds, output/storage/network bytes, external operation attempts, money by currency/principal, and human attention minutes by actual person/capacity pool. Exact model/subcall counts are bounded only where the admitted runtime exposes an enforceable measure; opaque subscription-internal usage is unknown, not zero. Reservations + consumed must not exceed each enforceable ceiling. Unknown metered consumption reserves the maximum authorized remainder of its admitted job/resource allowance until reconciled. A provider reset, new case/revision, new observation or delegated child cannot refill an episode.

Episodes are allocated by a server rule using an initiating event and semantic subject. A repeated problem, correction cascade, retry or descendant inherits its existing root; coalescing preserves individual reports/standing/deadlines. Only an actual authorized new purpose or explicit bounded renewal creates more capacity. A child proposes its scope; a parent cannot evade limits by minting IDs. Independent new grievance intake has its own protected finite service allocation under the standing grievance policy; it is not charged into an adversarial producer's exhausted discretionary episode.

Scheduler queues are persisted service classes: due_obligation, grievance_assessment, protective_containment, semantic_maintenance, planned_discovery and discretionary_delivery. Each has accepted capacity, maximum wait/latest-start logic and a named fallback. Eligible due work is ordered by latest responsible start within its service class; discretionary work uses endorsed priority and aging. Nonoptional classes have separately reserved capacity; discretionary work can borrow only explicitly preemptible idle capacity and returns it before a protected latest start. Numeric reserves and actual performer calendars are mandatory operating inputs, not fictional capacity supplied here.

The scheduler runs a one-second timer sweep and reacts to durable events. It checks capacity/deadline feasibility before new promises and predicts latest responsible start from an admitted procedure's remaining steps, external wait bounds and actual operator/service availability. Uncertain estimates are represented as ranges; crossing the conservative bound starts continuity, rather than waiting for an eventual missed due date. No universal 24-hour professional or legal deadline is invented.

At exhaustion, stop discretionary descendants and create one durable owned continuation under its pre-reserved closure allowance. Protected intake retains the person's report and escalation route. Existing service continues using its reserved lawful prerequisites; a flood cannot commandeer its budget, and a blanket stop cannot be treated as successful complaint handling. Insufficient actual capacity is a service/financing incident, prevents dependent new promises and activates accepted substitutes.

The operating account measures useful accepted outcomes, delivery/complaint deadlines, severe individual failures, owner and customer labor, semantic upkeep, witness/gateway operations, repair work and closure costs separately. Safe unavailability is a safety property and an availability failure. No combined score can erase failure to fulfill an accepted duty or exceed the owner's agreed allowance.

## 10. Deterministic invariant register

| ID | Predicate enforced at named boundary |
|---|---|
| K01 | Every authoritative record has exact company/principal, schema revision, owner, access, retention and provenance; missing actual standing never becomes a grant |
| K02 | Endorsed intent, observed fact, claimed truth, rationale, decision, acceptance and legitimate discharge remain distinct types and transitions |
| K03 | One admitted registry generation and serial order cover all overlapping mutable prerequisites; a partition cannot create another authority |
| K04 | Same command identity/content has one stable result; different IDs still face semantic conflict/interaction checks |
| K05 | Accepted authoritative transition and every dispatch-authorizing response have exact current independent proof; primary status is insufficient |
| K06 | Reservations and consumption are nonnegative and bounded in every independent unit; uncertainty holds capacity until evidence permits release |
| K07 | Every external attempt is linked to exact bytes, principal/account, business conflicts, finite transport window, grant lineage and potential obligations |
| K08 | Publication, use and release compare live transitive validity/access/deletion epochs; stale workers cannot publish by presenting an old valid token |
| K09 | Evidence acceptance depends on the full capture-to-interpretation closure, including selection and denominator; compromised dependencies invalidate affected judgments |
| K10 | Bounded causal totals survive retries, delegation, resumption and provider resets; protected duties/grievances retain their separately authorized service |
| K11 | Ownership transfer requires acknowledgment of actual scope/capacity; parking, closure, absence and tool success never discharge external standing |
| K12 | Recovery uses the current surviving membership/frontier and seals old authority/access descendants before restarting; signed old snapshots are insufficient |
| K13 | Self-improvers cannot alter their own authority, evidence capture, evaluator acceptance, release gate, recovery roots or rollback acceptance |
| K14 | User-facing projections carry witnessed position, source watermarks and omissions; every command revalidates current state |
| K15 | No native tool, imported text, response rationale or provider credential grants production account authority or unrestricted disclosure |

## 11. Contract evolution, scaling and removal

Schema major changes require explicit migration; minor versions add optional semantics only and cannot weaken validation, authority or retention. Unknown major versions are rejected. Every command/event stores the validator/runtime/schema hashes that interpreted it. Upcasters produce a separately attributed current projection, never rewrite signed historical content. Semantic changes to acceptance, denominators or conflict identity require a new version and the migration protocol, not a minor field rename.

RuntimeProfile pins Node/PostgreSQL/OS/native executable/validator/connector/identity/firewall versions and configuration hashes. Patch changes trigger relevant compatibility and escape/race tests; an admission report has expiry and owner. Production changes cannot bypass these checks by being called maintenance. Protected changes require a reviewer and authorizer outside the improver's write authority, current recovery proof, a rollback artifact and a migration/reconciliation plan.

Start with one registry writer and bounded companies/cases on it. The profile does not claim unmeasured throughput. Increasing worker concurrency does not increase grants or remove control latency. Sharding is prohibited across overlapping conflict/interaction/principal constraints until the reviewed partition proves disjointness; discovering a new overlap freezes and migrates the union.

Removal exports exact records, source-native references, meanings, policies, active grants, all duties/unknown effects, current frontier, evidence and a human-readable account. A replacement accepts ownership and reconciliation before old controls retire. Keep reachable grievance and retention/deletion handling for surviving duties; stopping Node or deleting a project is not company closure.

## 12. Required verification, not claimed execution

These are acceptance tests for implementation and operations. This authoring task executed no runtime, model, isolation, fault-injection or business-performance test.

| Test | Adversarial sequence and pass/fail observation |
|---|---|
| K-T01 concurrent revisions | Two admitted commands edit one intent/owner/reserve from the same Ref. Exactly one applicable revision wins; the other rereads or conflicts, with no partial event/outbox/account update |
| K-T02 commit/ack loss | Lose the primary response after commit, then lose primary and its backup. Status and recovery recover exact accepted result only from current independent proof; no “accepted” from a surviving unwitnessed row |
| K-T03 source poisoning | Retrieved text asks to change grant/recipient and suppress evidence. It remains attributed untrusted data; output cannot change authority or disclose an unapproved field |
| K-T04 late publication | Pause a worker after reading source X, revoke/delete X, then resume and race a new derivative publication. Both orderings restrict current use; registered lineage contains every visible tool/native input |
| K-T05 epistemic separation | Deliver plausible rationale and successful tool output for an unfulfilled duty. Case/obligation/evidence state does not become accepted/discharged without the distinct required observation/standing |
| K-T06 corrupt evidence closure | Corrupt a parser, hidden denominator selection, or shared evaluator dependency while raw artifacts remain unchanged. All dependent current judgments become stale/contested; independent raw capture survives |
| K-T07 bounded useful service | Flood correlated reports and generate novel child proposals across provider quota resets while a genuine severe complaint and routine due service run. Causal totals hold, legitimate assessment/remedy progresses, routine service meets its actual deadlines and owner allowance is measured |
| K-T08 incomplete handoff | Kill a worker with staged output, potential promise and unknown external effect. Successor sees exact last frontier, missing evidence, held resources and owned duties; no accidental retry or fabricated completion |
| K-T09 semantics change | Change a source's “settled” meaning and acceptance denominator. Old evidence/outputs are invalidated or explicitly retained historically; late events cannot apply the new meaning silently to old records |
| K-T10 native/provider disruption | Upgrade a CLI, alter startup config, exhaust subscription, remove an owner and one provider. Admission invalidates the changed profile; current duties use accepted continuity and useful production resumes within finite remaining resources where actually feasible |
| K-T11 authority self-change | Improver proposes easier evaluator, looser recipient validation and memory rollback. It cannot activate them or erase failed attempts; independent reviewed activation and rollback cover current inflight state |
| K-T12 economics/removal | Run a complete discovery-to-sale-to-support-to-closure journey against S0, counting actual maintenance, admin/substitute fees, owner/customer work and severe cases. Failure includes safe but commercially unusable blocking or unaffordable continuity; remove orchestration if its claimed advantage is absent |

## 13. Primary evidence and design boundaries

The [shared substrate claim register](../../research/substrate-claims.json) explicitly applies SC-POLICY-1 to every source assertion in this section and the corresponding version/mechanism reliance above. It records reported access, source/version identity or unknown publication date, scoped confidence, maintainer interests, corroboration limits, and revalidation/invalidation even without a package upgrade. Historical observations do not certify current support, security or runtime composition.

All sources below were checked on 2026-09-12. They support listed primitives, not the correctness of this composed system. API/version examples require actual deployment admission.

| Source | Supported fact used; design inference kept separate |
|---|---|
| [Node release schedule](https://nodejs.org/en/about/previous-releases) | Node 24 is an LTS line; selecting it over the current non-LTS line is this specification's maintenance choice |
| [PostgreSQL 18 transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html) | Serializable transactions can abort and require whole-transaction retry; ordinary sequences are not rolled back. The command counter/outbox layout is our contract |
| [PostgreSQL version policy](https://www.postgresql.org/support/versioning/) | PostgreSQL 18.6 was the supported current 18 patch at source check; current supported patch admission remains required |
| [PostgreSQL warm standby](https://www.postgresql.org/docs/18/warm-standby.html) | Synchronous and remote_apply behavior differs from asynchronous replication and remote_write. Independent witness semantics and administrative separation are additional requirements here |
| [PostgreSQL SELECT](https://www.postgresql.org/docs/18/sql-select.html) | SKIP LOCKED is suitable for queue-like contention, not general consistent reads |
| [Ajv JSON Schema support](https://ajv.js.org/json-schema.html) | Draft 2020-12 uses its own validator and is not mixed with older drafts in one instance |
| [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) | UUIDv7 format; its timestamp does not supply this system's trusted time or ordering |
| [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html) | Canonical JSON representation; hashing it cannot establish source truth, complete lineage or storage durability |

Remaining obligations are independent specification review, generated executable schemas/validators consistent with these contracts, meaningful implementation tests, actual infrastructure/admin/performer admission, and full-company comparative evidence. A versioned paragraph is not a passed invariant.

## 14. Registered lifecycle phases named only in the registry

**SPECIFICATION.** The phase below is registered for a record this chapter owns in [the record registry](contracts/record-registry.json) and was named in no chapter of this specification before 2026-09-13. A state that exists in the machine and nowhere in the prose is a state two implementers define differently. This section states what must be true to be in it and what it must not be mistaken for. It adds no phase, no edge and no predicate; the registry remains the authority for which transitions exist.

| Record · phase | What must be true to be in it | What it must not be mistaken for |
|---|---|---|
| `Commitment.ended_with_residuals` | Forward performance under the exact terms has legitimately ended, and at least one beneficiary right, unresolved performance or unknown effect survives that ending, each with a named owner | `ended`, or a discharge. Ending a label does not erase beneficiary rights or unresolved performance. It is also not `superseded`, which says a later commitment replaced this one rather than that this one stopped |
