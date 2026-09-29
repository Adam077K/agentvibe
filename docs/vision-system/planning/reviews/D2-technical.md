# Independent technical reassessment of foundation repairs

**Immutable subject:** `4182ead431220dc94ce61335170a798815aaf02c`  
**Original candidate subject:** `595f931d84d626cb4deadc03145975726e8db5ab`  
**Decision:** **Suitable to proceed to architecture synthesis only.** The repairs conceptually close T01–T08 and the lost-potential-obligation problem identified as EAS-01. I found no remaining technical foundational choice that must prevent synthesis. Precise specification obligations and substantial empirical and deployment prerequisites remain.

This decision does not accept a complete specification, select a candidate, authorize external operation, or establish runtime safety.

## Scope and independence

I reviewed these immutable files under `docs/vision-system/planning/candidates/`:

- **TF:** `technical-foundation-repairs-v1.md`
- **CF:** `company-foundation-repairs-v1.md`
- **ACD:** `AC-foundational-distinction.md`

References below give the corresponding section and exact 1-based lines. I reassessed the original counterexamples, tested the proposed protocol through reasoned interleavings, and examined ordinary successful progress as well as containment.

I did not read other reviewers’ new conclusions or exchange conclusions before forming this judgment. I made no repository changes, mutation commands, runtime tests, model API calls, purchases, or external operational changes. Read-only conduct remained procedural, not hardened tool isolation. The earlier archival task does not retroactively change either review’s isolation claim.

EAS-01 is assessed here specifically as recovery of obligations and potential promises that would otherwise disappear with lost primary state, as described in TF §2. This is not an independent endorsement of every issue in the original architecture/evidence review.

“Closed conceptually” means the repair supplies an architectural contract that defeats the original sequence when implemented faithfully within its declared fault boundary. It does not mean demonstrated, inexpensive, or suitable for every venture.

## Finding dispositions

### T01 — Closed conceptually: independently durable effects and complete recovery

**Controlling passages:** TF §1, lines 9–13; §2, lines 34–54.

The repair now requires independently recoverable executable parameters, keys, reservations, operation identities, and potential obligations before release. It distinguishes an intact old prefix from a complete current frontier, includes channels enrolled after the backup, seals writer generations, and contains uncertainty when membership or the newest frontier is unavailable.

This defeats the original sequence in which revocation state survived but the existence of a transmitted operation disappeared. The original unsafe interpretation—“the restored database knows of no uncertain operation, therefore capacity is available”—is explicitly excluded.

The fault roots are now named. Primary-host and backup loss are covered only while the independent authorization, recovery, and required observation roots survive. Administrator independence is judged against the particular administrator failure being claimed.

**Remaining obligation:** implement and demonstrate those durability and frontier semantics, including lost acknowledgments and membership changes. R2 below addresses a subtle implementation trap.

**Required falsifier:** release a refund and a zero-immediate-cost service promise after the primary backup; lose the primary and hide destination history. Missing either obligation, admitting an overlapping effect, or releasing its hold falsifies closure.

### EAS-01 — Closed conceptually for recoverability of potential obligations

**Controlling passages:** TF §2, lines 36, 38–42, 47–54; CF §1, lines 11–17.

The recovery envelope now preserves possible future delivery, support, refund, and other duties before transmitting an outward promise. Uncertain acceptance remains a potential duty requiring resolution. Controlled inbound acceptance also requires independent recording before acknowledgment.

This materially repairs effect-only recovery. Preserving a payment transaction while losing the service promise that caused it would no longer satisfy the contract.

Provider-originated acceptance gaps and uninstrumented verbal promises remain explicit observation limits. The repair does not pretend that reconciliation can enumerate duties for which neither a complete feed nor another authoritative record exists.

**Remaining obligation:** classify every admitted commitment and acceptance channel, establish its completeness contract and recoverable terms, and test customer-visible fulfillment after recovery. Unknown channels cannot receive a complete-company-account claim.

**Required falsifier:** lose a promise whose immediate monetary effect is zero, and lose an inbound acceptance interval separately. The first must reconstruct its potential duties; the second must remain explicitly incomplete until supported reconciliation resolves it.

### T02 — Closed conceptually: B now has one explicit authorization cutoff

**Controlling passages:** TF §3, lines 58–76.

B now deliberately adds a common, linearizable release registry for overlapping constraints. It identifies:

- A fixed participant set derived from protected policy and interaction determinations.
- Independently recoverable issuer preparations.
- Frozen slices that issuers cannot reclaim from a timeout.
- A single release transaction ordered against revocation.
- Conservative expiry based on trusted-time uncertainty.
- Blocking behavior during partitions and uncertain recovery.

The original race is resolved conceptually: a revocation committed first prevents release; a release committed first leaves an in-flight obligation and exposure. Independent issuer replies are no longer mistaken for a simultaneous authorization decision.

The price is real blocking coordination. B’s native scheduling and administrative autonomy survive, but its simplicity and availability advantages cannot be assumed. TF acknowledges this rather than hiding the registry inside the exchange.

**Remaining obligations:** formal state transitions, terminal-decision idempotence, participant/version changes, prepared-resource reconciliation, clock behavior, and gateway invocation semantics. R1–R3 below belong in that specification.

**Required falsifier:** interleave preparation, expiry, revocation, lost responses, partitions, and issuer recovery. Two terminal decisions, unilateral reclamation, or release after the governing revocation wins the registry order falsifies the protocol.

### T03 — Closed conceptually: conflict identity now follows the business consequence

**Controlling passages:** TF §4, lines 80–86; CF §5, lines 74–80.

`ConflictClaim` is explicitly independent of request, task, award, and transport identity. It includes entitlement, aliases, scope, mapping version, and consumption semantics. Unknown released effects continue holding overlapping consequences. Compensation cannot silently erase the original hold.

The repair also gives interacting consequences an accountable determination and preserves separate quantitative bounds and qualitative prohibitions. It does not turn privacy or reputation into money.

This closes the original two-valid-requests/one-entitlement attack, subject to correct mappings and enforcement at the actual write boundary.

**Remaining obligations:** mapping completeness, interaction discovery, and safe migration when aliases or conflict domains change. Those are significant; R1 supplies a required concurrent-change case.

**Required falsifier:** two domains use distinct IDs and native aliases for one entitlement while funds are sufficient. They must not consume it twice. A genuinely independent second entitlement must still progress.

### T04 — Closed conceptually within the declared disclosure modes

**Controlling passages:** TF §5, lines 90–98.

The repair no longer relies on a model respecting an instruction to ignore sensitive material. Consequential parameters have authoritative selectors, and outward disclosure includes intermediate destinations such as model providers, search queries, URLs, and telemetry.

The two autonomous modes provide an implementable boundary:

1. A context restricted to information authorized for the exact destination and purpose, with approved output forms.
2. Trusted deterministic construction from enumerated authorized fields, without arbitrary content or field selection from a model that saw broader sensitive context.

Mixed-context free generation requires an explicit competent disclosure decision. Scanners and model judges are not credited with complete noninterference.

**Remaining obligations:** define executable output grammars, all field and metadata channels, conservative treatment of combined inference, and the trusted context/rendering implementation. Utility and disclosure-review labor remain empirical constraints.

**Required falsifier:** use a noncompliant producer, confidential canary, malicious retrieval, authorized destination, and valid ordinary grants. A leak through content, encoded data, field selection, attachment, URL, or metadata falsifies the admitted disclosure mode.

### T05 — Closed conceptually: late output cannot escape invalidation through missing citations

**Controlling passages:** TF §6, lines 102–112; CF §9, lines 118–124.

The loader captures lineage, and every output inherits the union of loaded inputs rather than the model’s chosen citations. Publication atomically checks validity, registers derivative edges, and activates the usable reference.

Consequently, invalidation either precedes publication and denies it or follows publication and reaches the registered descendant. Current validity gates native reads; opaque resumptions cannot silently restore consequential usability. Restriction changes affecting release enter its authoritative order.

Continuing deletion scopes cover later-discovered copies and released exports without converting first-inventory receipts into universal completion.

**Remaining obligations:** the exact publication/restriction ordering, conservative lineage compression, native-store mediation, and provider-specific retention evidence. Excessive invalidation and loss of useful native resume are costs to measure.

**Required falsifier:** revoke a loaded source while an output is staged, then resume the worker, publish a handoff, reconnect an offline custodian, and discover a late export. None may become usable merely because it was created or rediscovered after the initial invalidation pass.

### T06 — Closed conceptually: protection follows the transitive evidence dependency

**Controlling passages:** TF §7, lines 116–122; CF §6, lines 84–92.

`EvidenceBaseVersion` now includes parsers, mappings, denominators, exclusions, source selection, runtime/build dependencies, configuration, identities, keys, and administrative recovery. A producer cannot modify a shared dependency consumed by a protected evaluator through a less restricted route.

Acceptance claims identify the failure they intend to survive. Shared administrators, source suppliers, libraries, and model contexts remain common roots. Unknown semantics cannot silently become success or exclusion.

This closes the original “unchanged judge and log files, corrupted interpretation” sequence at the contract level. It does not establish that two independently governed interpretations will never agree incorrectly.

**Remaining obligations:** dependency discovery, deployment attestation, change authorization, independent expected meanings, and detection of silent provider semantic changes. Actual evidence independence must be shown claim by claim.

**Required falsifier:** alter a shared decoder, denominator, or source-selection dependency without changing evaluator files. Acceptance must lose validity or detect the changed interpretation; an apparently independent green result falsifies protection.

### T07 — Closed conceptually; useful-progress superiority remains an empirical obligation

**Controlling passages:** TF §8, lines 126–134; CF §3, lines 35–54; ACD §§2–3, lines 25–44.

The repair supplies the missing company-level bounds. Descendants, revisions, retries, and model replacements consume a durable causal episode; provider resets do not replenish it. New identities remain subject to company-level caps.

It also separates receipt, contestation, investigation, containment, suspension, and direction change. Raw allegations no longer automatically suspend service. Due obligations, complaint assessment, and urgent containment receive protected capacity.

C2’s inquiry rights do not reopen the original loophole: a charter can require bounded investigation but does not confer stop authority or unlimited resources. Inquiry capacity is reserved after service floors; legitimate preemption requires the charter’s established authority.

**Remaining obligation:** prove useful progress under declared workloads, realistic arrivals, provider loss, and correlated false reports containing genuine grievances. The texts correctly reject universal throughput under unlimited adversarial input.

**Required falsifier:** across several allowance resets, mix fresh false observations, a severe true complaint, routine due service, and protected C2 inquiries. Unbounded descendants, discarded standing, blanket suspension, or persistent starvation falsifies the operating hypothesis.

### T08 — Closed conceptually as an explicit containment and residual-risk contract

**Controlling passages:** TF §1, lines 9–13; §9, lines 138–148; CF §7, lines 96–102.

The repair inventories effective authority rather than just secrets. It includes token issuance, role assumptions, resource policies, executable deployments, forwarding, schedules, and persistent automation. Recovery uses a separate reachable authority and checks descendants before restoring ordinary execution.

The stated guarantee is appropriately limited: a stolen adapter credential can exercise its actual native permissions until provider containment succeeds. Internal grants do not magically constrain that credential. Unenumerable access, unavailable recovery administrators, and compromised ultimate roots invalidate the corresponding claim rather than receiving a false recovery success.

**Remaining obligations:** demonstrate each adapter’s effective permission graph, independently reachable containment, propagation behavior, and exposure during detection and recovery. Actual residual exposure requires legitimate acceptance before operation.

**Required falsifier:** create permitted persistent or delegated access through one compromised adapter; revoke its original credential and restore. Every descendant must be disabled or the affected scope must remain explicitly contained. A fulfilled duty still requires performance or legitimate disposition, not merely a disabled adapter.

## Additional protocol cases required in Phase F

These are specification gaps and newly sharpened counterexamples. They do not require another organizing architecture: the repaired invariants already imply the necessary constraints. They must not disappear when the prose becomes implementation.

### R1 — High-consequence specification obligation: reclassifying scope must migrate existing holds and required participants

**Exact passages:** TF §3, lines 58–66; §4, lines 80–84; CF §5, lines 74–78.

Two scopes can initially appear disjoint. A later alias correction reveals one entitlement, or a new interaction determination introduces an additional required issuer. An existing bundle may already be prepared or released.

Checking only new requests against the new mapping is insufficient. Old holds could remain under obsolete keys, or a bundle could release with the formerly complete participant set.

**Required specification:** a fenced transition for mapping, participant-set, and release-scope changes. It must preserve uncertain holds, invalidate affected unreleased preparations, account for already released operations, and ensure overlapping constraints acquire one authoritative order before either side resumes. The implementation may conservatively contain the combined scope during transition.

**Falsifying tests:**

- Merge two aliases while one side has an unknown released effect.
- Add a required issuer after the final preparation but before release.
- Reveal a cross-scope constraint during recovery or partition.

A duplicate consequence, omitted issuer, or simultaneously usable conflicting scope falsifies the transition contract. After reconciliation, legitimately disjoint work must resume.

### R2 — High-consequence specification obligation: a locally committed row is not proof of independent release durability

**Exact passages:** TF §2, lines 38–42, 47–50; §3, lines 66–67.

A release transaction can become visible locally while its independent durability acknowledgment is still uncertain. If the response is lost, a subsequent status lookup must not interpret an ordinary local “committed” row as sufficient permission to transmit.

The repaired contract requires independently durable release; the database implementation must preserve that distinction on status queries, recovery, and retries.

**Required specification:** identify the evidence that a status lookup must obtain before reporting a dispatch-authorizing release, including its scope, generation, record identity, and authoritative durability frontier. Neither primary restart nor a successful local read may upgrade an uncertain release.

**Falsifying test:** interrupt replication or continuity acknowledgment at each commit boundary, lose the original response, and query release status from each reachable node. Then lose the primary. Any authorized transmission whose release record does not survive within the declared fault boundary falsifies durability.

PostgreSQL’s documentation supports this distinction: synchronous acknowledgment provides a particular durability guarantee, while recovery can show locally committed transactions for which standby receipt was uncertain. Replication mode and acknowledgment semantics must therefore be verified for the actual implementation. [PostgreSQL 18 synchronous replication](https://www.postgresql.org/docs/18/warm-standby.html#SYNCHRONOUS-REPLICATION).

### R3 — Material specification/deployment obligation: delayed first transmission is distinct from an ambiguous retry

**Exact passages:** TF §3, lines 67–72.

The repair explicitly makes registry release the authorization cutoff. A released operation may therefore become in flight before any bytes reach the provider. Consider a gateway paused immediately after release, followed by revocation, expiry, and eventual resumption.

Calling this an existing attempt rather than a retry does not determine how long its first transmission remains permissible. The document requires acceptance of the release-to-effect window, but the operational bounds remain unspecified.

**Required specification:** distinguish the allowed delay before first transport invocation from delayed provider acceptance after transmission. Define gateway-generation fencing, cancellation behavior, first-transmission deadlines where required, and the exposure contract for providers that cannot enforce a final deadline or suppression rule. No promise of immediate revocation should be inferred from the registry cutoff.

**Falsifying test:** pause before first transmission across expiry and revocation; then deliver duplicated release responses and restart or resume the gateway. A second invocation, an unauthorized late first invocation under the declared contract, or a false claim that revocation stopped a prior release falsifies the implementation.

This does not reopen T02: the cutoff is now explicit. Its precise temporal consequences must be retained in action grants and user-visible stopping semantics.

## Useful successful progress must be demonstrated

The repairs are not inherently “safe only by refusing everything.” They permit ordinary paths:

| Path | Why progress remains possible | What would falsify useful operation |
|---|---|---|
| Authorized routine customer response | Current relationship data, an admitted disclosure mode, intact lineage, and valid release prerequisites permit output without fresh founder review. | Routine work consistently requires broad-context manual disclosure review despite a claimed autonomous capability. |
| B’s ordinary multi-issuer action | Available issuers freeze valid slices; the registry releases one complete bundle; independent outcome evidence permits settlement and capacity reuse. | Normal completed operations leave capacity permanently stranded, or routine bundles require unrecorded founder arbitration. |
| Legitimate second entitlement | Business conflict identity distinguishes a genuinely separate entitlement from a duplicate request. | Conservative mapping freezes every interaction with the same person or account. |
| C2 inquiry alongside due service | A finite charter reservation grants discriminating work without suspending unrelated service or obtaining a production-priority exception. | Inquiry protection consumes service floors, or ordinary scheduling can silently cancel the protected inquiry. |
| Recovery and continuity | Complete frontiers reconstruct duties; accepted capable substitutes perform or legitimately dispose of them under intact authority. | Records recover, but customers receive no fulfillment, remedy, or competent disposition within declared obligations. |

CF §§6–7 correctly count semantic maintenance, coordination, recovery administration, and real continuity as labor and capacity. Their kill tests may defeat any candidate. They remain unexecuted.

A deployment must define which disruptions its service commitments tolerate, how long prerequisites may be unavailable, and which intact alternatives can actually fulfill duties. Read-only preparation during an outage is useful, but cannot be counted as a completed refund, filing, or service.

## Primary-source checking and limits

I reopened the PostgreSQL replication documentation and GitHub’s installation authentication and token-revocation documentation. They support the repairs’ narrow claims about conditional replication durability, installation-token expiry/regeneration, and token-specific revocation. They do not establish an independently durable release registry or complete descendant containment.

GitHub documents both token regeneration and a revocation endpoint applying to the token used for that request; this supports treating the minting route and persistent repository changes separately. [Installation authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation), [installation-token revocation](https://docs.github.com/en/rest/apps/installations#revoke-an-installation-access-token).

No current model’s injection resistance, provider account entitlement, available professional arrangement, lawful continuity authority, or acceptable business exposure was certified. I did not independently adjudicate EAS-02’s required number of foundationally distinct alternatives or the human reviewers’ competence findings. C2 was examined here for its interaction with technical authority, capacity, and grievance protections.

## Synthesis disposition

**Proceed to architecture synthesis only**, retaining the repairs as explicit candidate amendments and retaining R1–R3 as mandatory specification and test obligations.

The original technical foundation blockers are conceptually resolved within the declared fault roots. No runtime guarantee, comparative advantage, or complete lifecycle implementation follows.

Synthesis must still account for the actual trade-offs:

- A and C require independent release durability and protected enforcement beyond a simple local record store.
- B now includes blocking common release and validity coordination in addition to native custodians.
- C2 commits capacity and separate inquiry jurisdiction whose useful discovery benefit remains unproved.
- All candidates incur disclosure constraints, semantic maintenance, independent evidence, recovery administration, and real continuity costs.

The technical evidence does not choose among them. A later specification or deployment must reopen the relevant finding if its implementation weakens these contracts, cannot sustain useful service, or cannot obtain the required independent roots and competent continuity within legitimate constraints.
