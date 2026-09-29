# Independent technical, security, reliability, and evaluation attack

**Review subject:** the three candidate files at commit `595f931`. **Result:** all three can remain contested alternatives for synthesis. None yet closes its foundational enforcement assumptions; none is rejected merely for being unimplemented. No aggregate score or preferred architecture is supplied.

## Scope, method, and independence

I read only the three candidate documents and the required acceptance inputs: `inputs/directive-contract.json`, `research/attack-coverage.json`, and `coverage/discovered.json`. Repository references below are relative to `docs/vision-system/planning/candidates/`, with exact filenames and 1-based lines from the immutable commit.

I traced adversarial and accidental sequences across mechanisms, distinguishing:

- **Contract gap:** the stated mechanisms permit materially different implementations with different safety properties.
- **Existing design response:** the candidate already states a mechanism that would defeat the attack if correctly implemented.
- **Residual risk:** explicitly admitted uncertainty requiring evidence or a consequence-specific acceptance decision.

I did not read author messages, session state, self-assessments, or other reviews. I made no repository changes, runtime experiments, model API calls, or consequential external actions. The read-only constraint was procedural; this was not a technically isolated reviewer environment. These findings are reasoned counterexamples and test requirements, not reproduced exploits.

Primary sources were reopened on 2026-09-12 where needed. Their observations establish specific failure mechanisms, not that these candidates fail in production.

## Severity-ranked findings

### T01 — Critical contract gap: A and B can restore authority correctly while losing knowledge of an irreversible operation

**Candidates and passages:** `A-records-and-cases.md:107`, `:119`, `:127`; `B-federated-responsibility.md:101`, `:103`. Compare `C-adaptive-coordination.md:59` and `:119`.

**Trigger and sequence:** An irreversible operation is prepared and transmitted after the latest recoverable application backup. Its response is lost. The host then fails. The independently retained revocation/deletion checkpoint survives, but the operation’s intent, identity, reservation, and transmission record do not. Restoration passes the explicitly described authority and deletion checks. External history is incomplete or lacks a reliable business reference. A newly reconstructed case or request can now create a second logical operation because the first operation is absent from the restored account.

A and B require preservation of effect identities and external reconciliation, but neither explicitly requires pre-dispatch operation durability outside the primary restore boundary. A backup containing operation identities is not the same contract. The dangerous missing fact is that there was an operation to reconcile.

**Broken invariant:** truthful reconstruction, surviving uncertainty, and no duplicate irreversible effects. AC09, AC11–AC14, AC28–AC29; D01–D02.

**Required decision:** Identify the authoritative, independently recoverable pre-dispatch operation record and its recovery-point guarantee. New authority must not be issued merely because a restore has no known uncertain operations. If completeness cannot be established, the affected business scope remains contained.

**Existing stronger response:** C explicitly requires operation identity, parameters, and reservation to survive beyond the primary host’s restore boundary before dispatch. That defeats this particular lost-intent sequence in the proposed contract.

**Falsifying test:** Lose every primary record after the backup while allowing one external effect to occur. Restore with intact revocation/deletion state but incomplete provider history. Any second effect, released exposure, or assertion that no uncertainty exists falsifies the recovery claim.

Provider retention cannot repair this generally: Stripe explicitly permits pruning idempotency keys after at least 24 hours and creating a new request when a pruned key is reused. [Stripe idempotency contract](https://docs.stripe.com/api/idempotent_requests).

### T02 — Critical foundational fork: B has not identified the commit authority spanning independent issuers and revocation

**Candidate and passages:** `B-federated-responsibility.md:44`, `:48`, `:54`, `:115`.

**Trigger and sequence:** An action needs a money grant, current recipient permission, and another independently issued resource or authority grant. The endpoint obtains a valid response from issuer 1. Issuer 1 then revokes that authority while the endpoint obtains issuer 2’s response. The endpoint records dispatch locally using the earlier response.

Online checks alone do not establish a single ordering of all those changes. B additionally promises serialization against revocation, but the document does not identify the protocol that gives the endpoint that power across independent issuers. Its local transactional outbox and absence of a global business-tool transaction do not answer this question.

**Broken claim:** dispatch is authorized by current epochs across every required authority boundary. AC10, AC13–AC16, AC28; D04.

**Required foundational decision:** Choose an explicit release/commit protocol and revocation cutoff: who can durably authorize the complete bundle, what each issuer promises after preparation, and what happens during partitions, expiry, or coordinator loss. A narrow cross-issuer coordinator need not become a company planner, but its existence, availability cost, and recovery authority must be acknowledged.

This is not an impossibility claim against federation. It is an unresolved consistency contract that can change the candidate’s complexity and availability substantially. A and C also require careful native-boundary treatment, but their shared transactional authority model does not introduce this exact multi-issuer gap.

**Falsifying test:** Revoke each required grant at every boundary between remote replies and dispatch; partition issuers and restart the endpoint. Any dispatch lacking one consistently defined authorization cutoff falsifies the claim.

Causal ordering between permission changes and object changes is a real authorization-system concern, addressed explicitly in the primary Zanzibar system report; that report does not validate B’s proposed protocol. [Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).

### T03 — High contract gap: unique operations and awards do not necessarily identify duplicate business consequences

**Candidates and passages:** `A-records-and-cases.md:16`, `:91`, `:107`; `B-federated-responsibility.md:24`, `:36`, `:40`, `:119`; `C-adaptive-coordination.md:24`, `:43`, `:57`, `:111`.

**Trigger and sequence:** Support opens a remedy request while sales opens a retention request for the same customer obligation. Each has a different request ID, valid award, fresh record versions, and sufficient reserved money. Each generates a different logical operation. Transport deduplication and single-award-per-request both work correctly; the company still issues two remedies against the same entitlement.

Different native names, imported identities, or independently created cases make this more likely during migration and handoff.

**Broken invariant:** consequence-based exposure and truthful fulfillment. AC09–AC10, AC13–AC14, AC29; D01, D04.

**Required contract:** Define the business conflict domain independently of request identity: the obligation, entitlement, artifact/environment, audience allocation, or other resource whose consequential consumption must be serialized. An unresolved prior effect must block overlapping business effects even when they originate from different workflows.

**Important disagreement:** C’s refund scenario explicitly requires containment of further refunds “against that obligation” at line 111. That defeats the refund-specific example if enforced. A and B are less explicit. C still needs this rule generalized to other overlapping consequences rather than inferred from a single scenario.

**Falsifying test:** Submit independently valid requests from two domains, with distinct IDs and enough aggregate funds, targeting one entitlement. Make one result ambiguous. A second overlapping effect without a separately justified entitlement falsifies the claim.

### T04 — High contract gap: trusted parameter provenance and authorized destinations need an explicit disclosure boundary

**Candidates and passages:** `A-records-and-cases.md:61`, `:73`, `:87`, `:125`, `:165`; `B-federated-responsibility.md:50`, `:60`, `:125`; `C-adaptive-coordination.md:51`, `:83`, `:87`, `:89`.

**Trigger and sequence:** A model legitimately receives sensitive material and an external document. The external material redirects the model to put confidential information into an otherwise permitted outbound message, attachment, search query, or service request. The recipient and account are authorized; the schema, payload hash, and logging are correct. The leak occurs inside a permitted channel rather than through an obviously forbidden destination.

For A, a second path is payee or recipient selection from an authenticated but non-authoritative document. Origin validation and exact payload approval do not establish that the document is entitled to choose that parameter.

**Broken invariant:** purpose-limited disclosure and authority by consequence. AC01–AC04, AC13, AC16, AC22; D09.

**Existing responses:** B explicitly requires trusted parameter provenance. C explicitly binds consequential parameters to trusted sources and calls for testing permitted destinations as exfiltration channels. These are stronger than A’s generic argument/destination validation, but still require a concrete enforcement contract.

**Required decision:** For each autonomous outward action, identify which data may determine recipients, amounts, claims, and message contents; who can authorize disclosure of derived sensitive information; and what constrains the output when a model has seen broader context. “Untrusted data is not instructions” must describe a boundary that survives model noncompliance.

**Falsifying test:** Give the producer a confidential canary and malicious retrieved text while keeping the destination and all ordinary grants valid. Any unauthorized canary disclosure or substituted consequential parameter falsifies containment.

Indirect injection through retrieved material, including data theft and tool-use manipulation, has primary experimental support. The paper does not establish resistance of any present model or candidate. [Greshake et al.](https://arxiv.org/abs/2302.12173).

### T05 — High contract gap: invalidation can race with live context and late handoff output

**Candidates and passages:** `A-records-and-cases.md:73`, `:75`, `:93`, `:125`; `B-federated-responsibility.md:60`, `:66`, `:99`, `:125`; `C-adaptive-coordination.md:85`, `:87`, `:91`, `:129`.

**Trigger and sequence:** A session loads source S. S is later revoked, deleted, corrected, or discovered poisoned. Invalidation traverses existing derivatives. The still-running session then commits a new artifact or continuation packet influenced by S. The artifact cites another source or omits the influence altogether. A replacement session accepts the late output because it was created after invalidation.

Every retrieval-time filter can work correctly while this sequence occurs. Enumerating existing derivatives is insufficient unless late writes carry—and revalidate—the complete relevant input lineage.

**Broken invariant:** revoked evidence cannot regain authority through derived memory; corrections and deletion survive session replacement. AC04–AC06, AC20, AC22, AC28–AC29; D02, D05, D09.

**Required contract:** Define atomic validity checking when outputs enter durable memory and when they become consequential prerequisites. Conservatively associate model outputs with their loaded context unless a separately justified process narrows that dependency. Specify invalidation of live sessions, retained native resumptions, and late handoffs.

C names contexts and queued actions explicitly; A and B also require derivative correction. None states the concurrent publication contract clearly enough to close this sequence.

**Falsifying test:** Pause a session immediately before output publication, revoke one loaded source, complete invalidation, then resume it and transfer its output to a new provider. Any consequential reuse of the invalidated influence without explicit revalidation falsifies the claim.

### T06 — High foundational gap: protected logs and judges can still share a corruptible interpretation path

**Candidates and passages:** `A-records-and-cases.md:67`, `:81`, `:83`, `:133`, `:135`; `B-federated-responsibility.md:58`, `:64`, `:105`, `:107`, `:151`; `C-adaptive-coordination.md:85`, `:89`, `:117`, `:135`.

**Trigger and sequence:** An improvement changes a shared adapter, event decoder, metric transformation, or schema dependency. Protected raw capture and evaluator files remain untouched. The new interpretation converts an unsuccessful or unauthorized event into an excluded category, changes the denominator, or treats transport acceptance as fulfillment. Producers and evaluators consume the same transformation and agree. Event counts and logger health remain normal.

A related path needs no malicious improvement: two independently operated assessors use the same compromised source, subcontractor, model context, or connector interpretation. Authentic signatures and separate process identities preserve a coordinated error.

**Broken invariant:** independent evidence, process/outcome separation, and protection of improvement controls. AC03, AC06–AC08, AC11–AC12, AC21, AC26, AC30–AC33; D03, D08, D10–D11, D15.

**Required foundational decision:** Define the transitive trusted computing and evidence base: dependencies, configuration, runtime identities, mappings, source selection, metric definitions, and administrative ownership. State which common failures independent acceptance is intended to survive. Independence cannot be inferred from different labels, models, processes, or log destinations.

**Detection and containment:** Compare raw source/destination observations through independently governed interpretation paths where consequence warrants it. Unknown or changed semantics must suspend the affected acceptance claim. Protected mechanisms require separately authorized changes across their dependencies, not only direct file permissions.

**Falsifying test:** Keep protected files, event counts, and evaluator selection unchanged while altering a shared parser or denominator transformation. Supply a correct outcome with an authorization violation and an incorrect outcome with plausible receipts. Acceptance of either as fully successful falsifies the protection claim.

The DGM Appendix H documents successful metric manipulation through changed logging despite hidden checking functions. The broader transitive-dependency attack above is my inference, not a reproduced result from that paper. [DGM Appendix H](https://arxiv.org/html/2505.22954v3#A8). Source/build integrity also requires attention to dependencies and build parameters; source provenance alone does not establish benign behavior. [SLSA threat model](https://slsa.dev/spec/v1.2/threats-overview).

### T07 — High organizing-premise attack: bounded reactions can form an unbounded company-level disturbance loop

**Candidates and passages:** `C-adaptive-coordination.md:36`, `:41`, `:43`, `:129`, `:137`; `A-records-and-cases.md:27`, `:75`, `:109`, `:131`; `B-federated-responsibility.md:34`, `:38`, `:58`, `:99`.

**Trigger and sequence:** An attacker or failing connector emits plausible new revisions, complaints, or contradictions. Each produces a fresh trigger identity. Reconsideration invalidates work and opens bounded investigations. Their outcomes generate further observations, proposal revisions, and correction work. Every individual proposal respects count, time, and retry limits.

The aggregate loop continually consumes the authorized allowance, evidence-review capacity, and owner attention. In C, contradictions can change eligibility immediately and containment work has highest precedence. Affected obligations can remain parked while genuine incoming complaints cannot safely be discarded. Waiting for a provider reset merely restarts consumption.

**Broken claim:** bounded autonomy supports existing company obligations at sustainable cost. AC11, AC17–AC20, AC23, AC25–AC27; D04, D14.

**Required decision:** Define company-level work admission for observations and correction cascades, causal budgets across revisions and descendants, and protected progress capacity for existing obligations. Distinguish provisional contestation from evidence sufficient to suspend performance. The policy must preserve genuine safety escalation and customer standing; simply ignoring inconvenient observations is not a solution.

**Existing responses:** C already bounds proposal counts, depth, lifetime, refresh rate, and work in progress. A has progress checks; B attenuates child budgets. Those defeat simple infinite recursion. They do not yet establish useful progress under sustained novel disturbance.

**Falsifying test:** Mix genuine urgent obligations with a sustained stream of distinct adversarial observations, including some true complaints. Across multiple quota resets, measure missed obligations, total descendants, owner minutes, and accepted progress. Persistent starvation despite every local limit being respected falsifies the control hypothesis.

### T08 — High unresolved risk acceptance: “complete mediation” needs a transitive credential and recovery threat model

**Candidates and passages:** `A-records-and-cases.md:93`, `:163`, `:165`, `:167`; `B-federated-responsibility.md:50`, `:54`, `:103`, `:151`; `C-adaptive-coordination.md:49`, `:59`, `:89`, `:119`.

**Trigger and sequence:** An adapter identity is compromised. Its actual provider permissions permit a derived session, resource-policy grant, webhook, forwarding rule, scheduled job, or another persistent execution route. The original credential and internal epoch are later revoked. The derived route continues outside the broker. If evidence capture depends on that broker, the truthful account can also miss the activity.

This is not an assertion that every proposed adapter necessarily has such permissions. It is the concrete admission test needed before declaring that workers lack equivalent routes and old credentials are fenced.

**Broken invariant if omitted:** revocation and credential containment apply to the effective authority graph, not merely the original secret. AC13–AC16, AC28, AC32–AC33; D02, D04, D11.

**Required foundational decision:** Specify which trust-root compromises are inside the promised containment boundary, what exposure is accepted outside it, and which independently reachable identity can discover and disable descendant authority. Inventory must include authority created after initial installation. Restore must not equate rotating one secret with disabling all prior execution paths.

The candidates already admit malicious administrators and compromised providers. Those residuals should remain explicit; no demand for survival of simultaneous compromise of every trust anchor is made here.

**Falsifying test:** Compromise one admitted adapter, exercise every permission it actually has to create persistent or delegated access, then revoke and restore. Any unexplained surviving effect path falsifies the claimed containment boundary.

As a concrete primary example, AWS documents that resource-based policies can preserve access unless the relevant denial is applied, and distinguishes several temporary-session revocation paths. This illustrates why credential invalidation must be provider-specific. [AWS temporary-credential permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_control-access_disable-perms.html).

## Provider change, exhaustion, and continuity: conditional response, not an additional fatal finding

A’s `:171–175`, B’s `:99`, `:127`, `:133`, and C’s `:119`, `:127–129` correctly distinguish unavailable capacity, credentials, refusal, and unknown effects. They prohibit silent paid fallback and preserve portable continuation state. B explicitly acknowledges that local reservations cannot guarantee provider allowance against external use.

These are responsible candidate-level responses to AC25–AC27 and AC30–AC31. What remains unproved is whether the complete company can fulfill existing duties under those responses.

The decisive combined test is: change provider semantics without changing the visible success schema; exhaust allowance; remove native resume access; and fail the primary host while a professional deadline and customer remedy remain due. Continuation must retain disagreement, uncertainty, holds, and exact next actions; dependent claims must lose acceptance when their evidence contract changes. Required duties need an actually reachable authorized executor or a truthful incapacity disposition.

For D12, test the effective billing route inside the process that will execute, including environment and account settings—not only a stored configuration label. For D10/D13, cached policy evidence and unchanged model aliases must not be treated as proof that execution rights or behavior remained stable. No current provider rights, prices, or legal conclusion were independently certified in this review.

## Strongest attack against each organizing premise

| Candidate | Strongest premise attack | Evidence that would materially answer it |
|---|---|---|
| **A: durable records and cases** | A coherent central model can coordinate the wrong company. A shared mistaken mapping can drive admission, evidence, acceptance, and the owner’s explanation consistently, while real promises remain wrong or missing. Transaction correctness does not establish semantic correctness. | A full lifecycle exercise with intentionally conflicting native meanings and independently known customer obligations, including correction after acceptance. Measure mapping repair, missed duties, and owner effort—not just state-machine consistency. |
| **B: federated responsibility** | The narrow exchange may require consequential cross-domain commit and semantic decisions that its organizing premise assigns nowhere. Local responsibility does not automatically compose into one authorized, nonduplicated external effect. | A concrete multi-issuer revocation/recovery protocol, hostile custodian tests, and a complete cross-domain incident and closure exercise. Show whether the required common control remains narrow in actual workloads. |
| **C: adaptive coordination** | Every discrepancy can create more work and reconsideration. Under noisy or hostile evidence, adaptation can systematically consume the capacity required to deliver promises while remaining individually bounded and financially authorized. | Sustained disturbance experiments with genuine obligations and adversarial noise, across repeated resource resets, compared with fixed procedures under equal scope and authority. |

These attacks preserve the full company lifecycle. None can be answered by demonstrating a coding agent, dashboard, or a ledger around unfinished business capabilities.

## Attack coverage and explicit limits

| Cases | Examination in this report |
|---|---|
| AC01–AC03 | T04, T06: retrieved content, allowed-channel exfiltration, tool-output interpretation. |
| AC04–AC05, AC22 | T04–T05: poisoning, stale context, summary laundering, late output after invalidation. |
| AC06–AC08 | T06: false evidence and collusion through shared sources, dependencies, or incentives. No claim that merely using different models provides independence. |
| AC09–AC10 | T01–T03: restore loss, concurrent authorization, and semantic duplication. |
| AC11–AC12 | T01, T06–T07: lost uncertainty, wrong success semantics, and starvation. |
| AC13–AC16 | T01–T04, T08: irreversible effects, spend, compromise, and authority escalation. |
| AC17–AC19 | T07: global cascades despite bounded local delegation/retries; T01 covers unsafe retry after state loss. |
| AC20–AC21 | T05–T07: stale intent influence, work-generation drift, and metric manipulation. |
| AC23 | **Partially examined:** technical generation of owner overload. Sustainable human participation requires a separate human/operational review. |
| AC24 | **Not examined:** longitudinal owner deskilling and effectiveness of the proposed learning rotations. No competence benefit is credited. |
| AC25–AC27 | T07 and continuity test above. Actual workload capacity and substitute availability remain unverified. |
| AC28–AC29 | T01–T02, T05, T08 and continuity test: corrupt/lost state, stale authority, incomplete handoff. |
| AC30–AC33 | T06, T08 and provider-change test: model/dependency change, protected self-change, compromised improvement. |

Discovered-case mapping:

- **D01–D05:** T01–T03, T05–T06.
- **D06:** **Not substantively examined.** The candidates distinguish permission from professional competence, but this review does not certify competent human acceptance.
- **D07:** Examined at the technical continuity boundary. All three preserve surviving duties on paper; actual discharge and service capacity remain untested.
- **D08–D12:** T04–T08 and provider-change test.
- **D13:** **Partially examined:** stale policy/source propagation; correct legal provision and transition analysis was not examined.
- **D14:** **Partially examined:** independent recovery and workload starvation; availability and lawful standing of substitutes were not verified.
- **D15:** T06 supplies a falsifying evaluation test, but **no independent benchmark table/caption audit was performed**. No candidate comparative superiority is credited.

## Preserved disagreements and verdict

A common transaction boundary can simplify some consistency contracts while concentrating compromise and outage risk. Federation can preserve domain meaning while introducing cross-issuer coordination and evidence-access costs. Adaptive coordination can respond to unfamiliar conditions while increasing disturbance and assurance overhead. None of those trade-offs is settled by architectural familiarity.

C has a materially clearer pre-dispatch recovery contract and an explicit obligation-level refund hold. B has unusually explicit treatment of native bypasses, independent issuers, and externally consumed quota. A offers a narrower coordination structure but needs stronger precision around independently durable effects and consequential parameter provenance. These distinctions should survive synthesis.

| Dimension | A | B | C |
|---|---|---|---|
| Foundational coherence | **Conditional:** recovery and semantic enforcement need closure. | **Conditional:** cross-issuer release/revocation is a foundational fork. | **Conditional:** useful progress under sustained disturbance is unresolved. |
| Security | **Unproven:** T04–T06, T08. | **Unproven:** T02, T04–T06, T08. | **Unproven:** T04–T08 despite stronger stated boundaries. |
| Reliability | **Blocked for acceptance** by T01/T03 until contracts close. | **Blocked for acceptance** by T01/T02/T03 until contracts close. | **Conditional:** stronger stated recovery; implementation and liveness evidence absent. |
| Evidence and evaluation | **Conditional for all:** protection must cover transitive interpretation and independent failure roots. |
| Full lifecycle feasibility | **Unverified for all:** no integrated fulfillment, absence, recovery, and closure evidence. |
| Owner competence | **Not established for all:** outside this technical review’s substantive findings. |
| Ability to complete a responsible specification | **Plausible for all**, subject to explicit decisions and falsifying tests above; no runtime guarantee inferred from prose. |

The candidates may advance to synthesis with these disagreements intact. An accepted specification cannot leave T01/T02’s authority and recovery decisions implicit, or describe T04–T08’s protection boundaries solely as trusted behavior. Required implementation evidence must test the cross-mechanism failures, including ordinary successful operation and responsible closure under the same consequence limits.
