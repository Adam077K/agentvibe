> Archival provenance — 2026-09-13: Phase G review, preserved verbatim from the completed independent read-only turn on frozen subject `7ddc066`, following the frozen protocol at [G-acceptance-protocol.md](G-acceptance-protocol.md). The reviewer held three of the twelve dimensions (internal coherence, buildability, changeability) and two of the eight portfolio scenarios, and was asked to judge the canonical contract set and FI-11's residue by its own computation. It had shell access and no write access; it was barred from producers' self-assessments, session files and `state.json` `completed[]`. The report arrived in six parts because the return channel truncated it; parts are concatenated in order with no edits. Archival does not establish hardened isolation; the reviewer shares a model family with every author and says so.
>
> **This is the one Phase G report with (d)-class findings.** G2-01 and G2-02 are missing decisions, both on `SalesAgreement`. Buildability is judged sufficient for B01–B03 and insufficient for the money/fulfillment vertical (B04/B05) until they, G2-05 and G2-06 land. The report also supersedes the FI-11 residue figure: the harsh "210 collisions / 92 skeletons" measure erases the `event_kind` discriminator it is looking for; the reviewer's decomposition finds **6** sibling pairs that differ only by `predicate_id` and `to_state`, and — the substantive point — that the validator does not guard criterion content at all (3 of 3 mutations leaked).

**Phase G — internal coherence INSUFFICIENT (G2-01, G2-02 (d)); buildability SUFFICIENT for B01–B03, INSUFFICIENT for the money/fulfillment vertical; changeability SUFFICIENT**

**Subject:** `7ddc066`

---

Reviewed read-only at `7ddc066`. I wrote no file. Same model family as every author; procedural independence only — this is not an independent panel. **Where I am predisposed to agree:** the package's self-critical register (superseded blocks, "a validator that cannot fail is the defect") is the style I am inclined to credit, and `guard_distinctness.py` reports its own worst number unprompted. I therefore computed against it rather than reading it, and three of my own mutations leaked.

## Computed numbers (mine, this tree)

| Instrument | Result |
|---|---|
| `validate_contracts.py` | `status: passed`, **252,513 checks**, 173 records · 184 values · 105 commands · 2,255 predicates · 1,295 edges · 373 source-work edges · 46 required subjects · 13 fixtures rejected. Exit 0. ~5 min wall. **Positive control: live registry NOT rejected.** |
| `run_negative_fixtures.py` | **13 of 13 rejected, 0 leaked**, each matching its own `expect_failure_contains` string (runner asserts the reason, not just non-zero exit — I read that path). |
| `guard_distinctness.py` | 1295/1295 edges call their own criterion; 680 effective skeletons; **0 sibling collisions** (`erase`); 92 all-strings-erased skeletons, largest share 567, **210 harsh sibling collisions**; 0 declared-but-unread args; 166 predicates unreachable from any guard; 15 unused primitives. |
| **My decomposition of the 210** | Sibling collisions with **nothing** erased: **0**. Of the 210: **199 differ by `event_kind`/`target_state`/`result`** — real discrimination that `erase()` masks and `erase_all_strings` destroys. **Only 6 differ solely by `predicate_id` + `to_state`.** |
| **My criterion census** | **646 of 837 criteria** have `field_paths: []` and a body naming only their own id — i.e. "an attestation and an acceptance exist for *me*". |
| **My edge census** | 175 of 1295 edges carry no evidence op beyond status/owner/subject + criterion. **Only 2** are that *and* have an empty criterion. 27 of 173 records have control contracts. |
| **My mutations (3, run through the fixture harness)** | **3 of 3 leaked.** Erasing `criterion.SalesAgreement.performed.v1`'s `field_paths` → passes. Repointing them at an unrelated field → passes. Making `performed` demand strictly less than `accepted` → passes. |

**On FI-11's "210 and 92": the register's own measure overstates the residue and the right number is 6.** `erase_all_strings` erases the `event_kind` that `transition_basis` requires an authenticated event to match — it deletes the discriminator and then reports its absence. My disposition: **(a) concrete authoring work with a clear oracle**, not (d). The oracle is stateable today: *no two edges leaving one state may have effective guards differing only in `predicate_id` and `to_state`*, and it names six pairs. What would convince me it is closed: those six authored, plus that predicate wired as an exit-nonzero check. **What is genuinely missing is not content but a ratchet** — `guard_distinctness.py` `return 0`s unconditionally, so the residue cannot regress a build, and my three mutations prove the validator does not guard criterion content at all. That is (a) with an oracle, and it is owed.

## 1. Internal coherence — **INSUFFICIENT** (2 × (d))

**G2-01 (d) — a local "performed" that is a *payment*, and establishes delivery without it.**
Requirement: protocol §Internal coherence, "a local 'accepted,' 'paid' or 'closed' must not silently establish another domain's satisfaction."
`contracts/record-registry.json` → `SalesAgreement`, edge `accepted->performed`; `contracts/predicate-registry.json` → `edge.SalesAgreement.accepted.performed.v1`, `criterion.SalesAgreement.performed.v1`.
Computed: `criterion.SalesAgreement.performed.v1` and `criterion.SalesAgreement.accepted.v1` have **byte-identical `field_paths`** (`/payload/original_exchange, /payload/agreed_terms, /payload/acceptance_evidence, /payload/obligation_refs`). `SalesAgreement.relations` contains **no `Fulfillment` target**. The full list is: `/payload/offer_ref`→`Offer`, `/payload/buyer_ref`→`Principal`, `/payload/original_exchange`→`Conversation`, `/payload/agreed_terms`→`ArtifactVersion`, `/payload/payment_operation`→`OperationIntent` (optional_one), `/payload/obligation_refs`→`Obligation` (many). The link runs only upward: `Fulfillment` points at `SalesAgreement` via `/payload/agreement_ref`, and `SalesAgreement.output_lifecycle_links` is `{}`. So the agreement cannot name its own delivery record, and its `performed` criterion cannot require one.

The guard `edge.SalesAgreement.accepted.performed.v1` carries exactly four ops plus the criterion call: `subject_unchanged`, `status_edge`, `native_correlated`, `current_owner`. It carries **no `transition_basis` and no `due_preserved`**. Its only evidence op is `native_correlated(result: "performed")`, whose semantics require binding "exact adapter/account/business key/request digest and native object identity" — and the only native object reachable from this record is the Stripe payment behind `payment_operation`.

Counterexample: buyer pays; `Fulfillment` remains `proposed`; every linked `Obligation` remains `recognized`; a `CriterionResult` observation naming `criterion.SalesAgreement.performed.v1` is captured. The agreement transitions to **`performed`**. Nothing in the machine set objects, and the criterion demanded nothing that `accepted` had not already demanded.

Expected behavior: the record's own invariant string says *"performance is shown by substantive fulfillment"*. That sentence is enforced by nothing. Evidence needed to close: a `/payload/fulfillment_ref` relation, and a `performed` criterion whose `field_paths` require it, with `Fulfillment` in `validated` and each `Obligation` in `discharged`/`transferred`. Missing decision: **what evidence constitutes performance of a sale** — an implementer must invent it, and the two available inventions (payment settled / delivery accepted) are not the same company.

**G2-02 (d) — `SalesAgreement:*->terminated` is a closure edge that computes no surviving duties**

Governing requirement: protocol §Internal coherence — what remains owed after failure — and §Changeability, "old effects or duties cannot disappear."

File and path: `contracts/record-registry.json` → `SalesAgreement.lifecycle.transitions`, the four edges `proposed->terminated`, `accepted->terminated`, `partially-performed->terminated`, `disputed->terminated`; guards `edge.SalesAgreement.*.terminated.v1` in `contracts/predicate-registry.json`.

Computed: all four carry `transition_basis` only. Every comparable closure edge in the registry carries `due_preserved`, whose semantics are *"compute transitive due obligations, claims, reservations, descendants and pending operations from the current indexed graph at witnessed frontier; closing requires each discharged/not_arisen/transferred with accepted custodian"* — `Commitment:made->ended`, `Commitment:made->ended_with_residuals`, `Offer:*->withdrawn`, `Offer:withdrawn->retired`, `Case:*->abandoned`, `GrievanceCase:disposition_issued->closed`, `Obligation:performance_reported->discharged`, `Obligation:transfer_pending->transferred`, `Fulfillment:*->superseded`, `ClosurePlan:*->superseded`, `Venture:*->superseded`. It is the consistency of that set that makes the omission a defect rather than a modelling choice.

Counterexample: terminate an agreement in `disputed` with three `Obligation` records in `recognized` and an open `SupportCase`. The transition succeeds; no transitive due set is computed; the obligations remain `recognized` with no custodian disposition and no residual state on the agreement — there is no `terminated_with_residuals`. The duties do not disappear from the graph, but nothing requires anyone to have looked, and the terminal state asserts closure.

Evidence needed to close: `due_preserved` added to all four `SalesAgreement:*->terminated` guards, or an explicit reasoned statement that terminating a sales agreement is not a closure event. The second option would then have to explain why `Commitment:made->ended`, `Offer:*->withdrawn` and `Case:*->abandoned` all carry it, since those are the same act at a different record. Missing decision: **whether `terminated` asserts closure** — there is no `terminated_with_residuals` state to hold the alternative, so implementation would settle the question silently, in one direction, by writing the guard.

## 2. Buildability — **SUFFICIENT TO BEGIN at B01–B03; INSUFFICIENT for the money/fulfillment vertical**

The infrastructure layer is genuinely selected, not deferred. `07-integrations-capacity.md` §3 names products, endpoints and limits: Brave; Fastmail JMAP with a 60 s poll, an `Email/changes` cursor and bounded paginated rescan on `CannotCalculateChanges`; Postmark, which §9 states plainly publishes **no webhook signatures**, so "verified ingress" means a weaker named contract; Cloudflare Workers + D1 free under an admitted envelope stricter than provider maxima; Stripe Checkout/Refunds/BalanceTransactions with idempotency keys bound to the immutable request, event-ID inbox dedup, and refund as its own `OperationIntent` linked to the original payment; hledger 1.52 with `--strict` over generated journals. `implementation-graph.json` B00–B11 gives dependency order and per-stage completion evidence; `08` §3 plus `record-registry.planned_module` give an 8-package module map; Postgres with hot standby, Keycloak/step-ca, nftables and systemd are named. An implementer does not invent topology, storage or adapters. They must invent what performance means (G2-01) and what a terminated sale owes (G2-02), and both sit on the vertical journey immediately after the charge — so B01–B03 can start and B04/B05 cannot.

**G2-05 (a) — no record represents the entitlement or the refund, and the delivery record cannot represent a delivery.** Of 173 records there is no `Payment`, `Refund`, `Invoice` or `Entitlement`; routing refund through `OperationIntent` + `ConflictClaim` + `Obligation` is defensible. `Fulfillment` is not: it carries the generic `proposed→validated→restricted→superseded` shape shared by 33 records — byte-identical in shape to `CashPosition`, `Venture` and `ClosurePlan` — with no `delivered`, `failed` or `refunded`, and `proposed->validated` is one of the 175 base-only edges, so "the service was delivered" requires no authenticated attributable event and no native correlation. Concrete authoring work with a clear oracle: a domain lifecycle and an evidence op on the entry edge.

**G2-06 (a) — the validator cannot fail on criterion content.** Three mutations I ran through the package's own fixture harness all leaked: erasing `criterion.SalesAgreement.performed.v1`'s `field_paths`, repointing them at an unrelated field, and making `performed` demand strictly less than `accepted` each passed all 252,513 checks. `guard_distinctness.py` `return 0`s unconditionally, so the 646 content-free criteria and the 6 colliding sibling pairs cannot regress a build. Fix: a fourteenth negative fixture plus an exit-nonzero distinctness threshold stating *no two edges leaving one state may have effective guards differing only in `predicate_id` and `to_state`*.

## 3. Changeability — **SUFFICIENT**

`02-authority-recovery.md` §10 (T-R1) refuses the failure mode the dimension names: freeze the **union** of old and new scopes in one ordered transaction, fence unconsumed preparations, treat any possibly-sent operation as unresolved rather than cancelled by the new schema, and *"unmapped/ambiguous keys retain a union-wide hold for the affected consequence; they cannot be dropped as obsolete."* Prior approval is historical only unless its exact scope is valid under the migration; §10.7 makes rollback another forward migration carrying all intervening effects, restrictions and unknown holds, and `08` §1 freezes selection, denominators and thresholds before candidate outcomes are inspected while forbidding a candidate evaluator from choosing its own tests or signing its acceptance. `10-components-authority-traceability.md` gives all nine components substantive Version / Replacement / Removal rows — C03's Version row names shape-preserving provider drift, C04's Removal row refuses to drop the consequence boundary while claiming the same contract — and `SummaryLoss` exists as a record type, which is the rewritten-summary control.

**Changeability findings:** G2-07 (b) only — component removal is not linked to record custody. All 173 records carry `owner_component` (S1-C03 owns 35), the Removal rows are prose, and no predicate among the 2,255 reads `owner_component`.

**G2-03 (a)** — 41 of 837 states are named in no `.md` and in none of the five machine registries; worst is `GrievanceCase`, 6 of 10 (`triaged`, `awaiting_evidence`, `remedy_authorized`, `remedy_performing`, `disposition_issued`, `closed_with_residuals`), whose `source_contract` points at `planning/candidates/company-foundation-repairs-v1.md` — a candidate, not a chapter.

**G2-04 (b)** — 3 of every record's 4 `invariants` are identical boilerplate across all 173, and `implementation_status` is the same string on all 173; only `invariants[0]` is record-specific, so the count is not coverage.

## Scenario — Take money and fulfill the offer

| Step | Governing contract | Adverse variation caught? |
|---|---|---|
| Establish principal | `Principal` asserted→verified; `FormationReadiness` | partial — `verified` base-only; `preparing`/`conditionally-ready` is one of the 6 collisions |
| Accept exact terms | `SalesAgreement:proposed->accepted` + `native_correlated` | yes |
| Collect payment | IC-PAY; `OperationIntent` control contract; idempotency bound to immutable request | yes — strongest point in the package |
| Ambiguous charge | `OperationIntent` `unknown_effect` retains claims/holds; `ExternalAttempt` `proven_unsent` needs positive gateway evidence | yes |
| Deliver | `Fulfillment:proposed->validated` | **no** — base-only, generic 33-record shape, no `delivered` state (G2-05) |
| Mark performed | `SalesAgreement:accepted->performed` | **NO — G2-01**; identical evidence to `accepted`, no fulfillment link |
| Support | `SupportCase received→…→resolved` | partial — `assessing`, `remedy-pending` prose-unnamed (G2-03) |
| Two IDs, one entitlement | `ConflictClaim`: alias-normalized keys, atomic exclusion in complete scope | yes |
| Separate entitlement proceeds | scope overlap under current interaction classes; `02`§10.6 affirmative disjointness | yes, conservatively — defaults to block |
| Refund | Refund as own `OperationIntent`; "refund acknowledgement is not settled refund" | yes |
| Reconcile books | IC-BOOKS; `JournalBatch draft→balanced→reviewed→posted` | partial — all four edges `transition_basis` only, no `due_preserved` on `posted` |
| Terminate | `SalesAgreement:*->terminated` | **NO — G2-02** |

## Scenario — Protect meaning through change

| Step | Governing contract | Adverse variation caught? |
|---|---|---|
| Provider drift, same output shape | `10` C03 Version row; `ChangeWatch`; `08` §2 | yes (b — unverified) |
| Poisoned handoff | `HandoffAcceptance`; `subject_unchanged` on all 1295 edges | yes |
| Altered source selection / denominator | `08` §1 `ChangeEvaluationPlan` frozen pre-outcome; "missing attempts remain missing" | yes |
| Changed dependency | `EvidenceBaseVersion`, `DependencyClosure`, `accepted_for` closure clause | yes |
| Data revoked mid-publication | `02` §8.3 atomic validity + continuing `DeletionScope`; `AccessDescendant` | yes, but `AccessDescendant`'s 3 states are prose-unnamed and its 4 sibling groups sit in the 210 |
| Old copy reconnected | `02` §10.7 and §11 fencing/restore | yes |
| Acceptance responds to changed meaning | `subject_unchanged` on all 1295 edges — content edits invalidate old acceptance; `SalesAgreement.versioning`: "no automatic acceptance upgrade" | yes |

## Not checked

- Dimensions 1, 2, 4–11 — other reviewers'.
- `01`, `03`–`06`, `09`, `11`, `12` read only where cited.
- `capabilities.json`, `work-knowledge-contracts.json`, `scope-lifecycle-contracts.json`, `integrations-capacity-build.json` — searched by string, not read.
- The 46 schema subjects — checked only as the validator's `required_subjects: 46`.
- `command-registry.json`, `endpoints.json`, `source-field-mappings.json`, `subject-bindings.json`, `coverage-inventory.json` — not inspected.
- The prose↔registry state comparison is word-boundary matching and can over-credit an incidental "accepted"; **41 unnamed states is a floor, not a count**.
- Per the brief: no `docs/08-agents_work/`, no producer self-reviews, no `state.json.completed`. I read `state.json` `constraints` and `active_risks` only.
- No runtime exists; every verdict concerns specified behavior. Same model family as every author — procedural independence only, not an independent panel.
