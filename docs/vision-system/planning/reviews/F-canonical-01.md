> Archival provenance — 2026-09-13: The review below is preserved verbatim from the completed independent read-only turn on frozen subject `cb4bf52`. The reviewer had shell access for computation and no write access; it was told not to read any lane worktree or author self-assessment, and it was NOT told the orchestrator's own inspection result. The report arrived in four parts because the return channel truncated it; the parts are concatenated in order with no edits. This orchestrator scribe turn archives only this report.
>
> **This review supersedes the orchestrator's inspection recorded in commit `cb4bf52` and in `state.json`.** That inspection computed 1295 distinct predicate *bytes* and concluded FI-11's shared-guard defect "does not reproduce." The reviewer computed 19 distinct body *skeletons* — the bodies differ only by the state names they restate — which is the original defect at 1295 edges instead of 373. Distinctness of bytes is not distinctness of guard. The orchestrator's error is kept visible rather than edited out, because it is exactly the class of false closure this package exists to refuse.

**Canonical contracts review — FI-10 closed at specification level; FI-11 OPEN; FI-12 OPEN; seven new findings, two of them (d)-class missing decisions**

**Subject:** `cb4bf52`

---

## Independent conformance review — canonical contracts at `cb4bf52`

**Independence disclosure.** I share a model family with the author. My independence is procedural (no write tools, separate context, own computation), not statistical. I am most likely predisposed to agree with (i) the "composite aliases now expand" story of FI-10, which I did verify mechanically, and (ii) the framing that a large registry equals progress. I weighted against the second deliberately.

**Author's validator, run by me** (`/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-2-1789160976/docs/vision-system/planning/specification/contracts/`): `{"status":"passed","checks":207205,...}`, 16.1s, exit 0. It is a genuine closed-schema/`$ref`/AST/coverage check. It is also a **negative-control candidate that fails that role**: the entire FI-12 evidence block (`validate_contracts.py:213–325`) exercises a 33-line Python `FocalStore` the author wrote in the same file, reading **zero** bytes of any registry. Those checks cannot fail for any edit to the contracts.

---

### FI-11 — **OPEN. Not closed by this artifact.**

Computed, not read:

- 1295 edges, 1295 distinct predicate IDs — but only **19 distinct body skeletons** (string leaves erased); the top one covers **583** edges. All 104 command guards share **one identical body**: `{"op":"command_dispatch","command":{"arg":"command"}}`.
- The only per-edge varying literals are `from_state`/`to_state` (which restate the edge's own `from`/`to` — tautological w.r.t. the transition they guard) and `event_kind`, which is literally `<prefix>.<to_state>` in **991 of 1028** occurrences.
- Record-specific substance lives in the non-executable `meaning` string, and **167 of 167** records have *one* meaning tail shared by every one of their edges (`record-registry.json` → `lifecycle.transitions[*].predicate_id` → `predicate-registry.json[*].meaning`). E.g. `edge.Goal.proposed.endorsed.v1`, `…endorsed.achieved.v1`, `…endorsed.abandoned.v1` carry byte-identical tails. That is FI-11's original defect — one guard plus short record-level prose — reproduced at 1295 edges instead of 373.
- Edge guards call **zero** predicates (`op:"call"` count = 0) and contain **zero** `attested_result` nodes. **853 of 2252** predicates are unreachable from any edge or command guard — including the whole `criterion.*` family, which is where state-specific content sits.
- Declared-but-unconsulted arguments: `judgment_refs` appears in `argument_types` of **1077** edge predicates and in **none** of their bodies; `continuation_ref` 963, `decision_refs` 295, `observation_refs` 253. Registered argument shapes exist; the guard never reads them.
- **18 of 55** primitives are used by no predicate — including `not`, `any`, `forall`, `in`, `subset`, `unique`, `same_business_bytes`, `acyclic`, `bootstrap_roots`. The corpus is conjunction-only: no guard anywhere expresses negation, disjunction or quantification.

Disposition (a) concrete: to close FI-11 an edge guard must evaluate something that differs between two edges of the same record beyond their own state names.

### FI-12 — **OPEN.** Constraints 2 and 6 are unmet in the machine contract.

- **Constraint 2 (no recursively self-accepted LifecycleStatus).** `invariants.json#/LifecycleStatus[0]` states "subject is neither LifecycleStatus nor intrinsic/derived record" as prose. Every subject-taking primitive's `argument_schema` `record_type` enum (`primitive-registry.json#/{subject_unchanged,status_edge,current_owner,accepted_for,judgment_matches,attested_result,due_preserved,transition_basis}/argument_schema/properties/subject_ref/…/enum`) lists **all 173 records including `LifecycleStatus`** and all six intrinsics. The exclusion is unenforceable as written. Counterexample: a `judgment_matches(subject_ref = Ref<LifecycleStatus>)` instance validates. *Credit where due: `LifecycleStatus` itself has `transitions: []` and `intrinsic: true`, so it has no lifecycle of its own — the structural half is right.* The unenforced half: `invariants.json#/LifecycleStatus[0]` says "subject is neither LifecycleStatus nor intrinsic/derived record" in prose, while the `record_type` enum under `primitive-registry.json#/{subject_unchanged,status_edge,current_owner,accepted_for,judgment_matches,attested_result,due_preserved,transition_basis}/argument_schema/properties/subject_ref/properties/record_type/enum` lists **all 173 records, including `LifecycleStatus`** and all six intrinsics (`ReasonRecord`, `SendClaim`, `GenerationSeal`, `DurabilityReceipt`, `DomainEvent`, `LifecycleStatus`). Counterexample that validates today: an `accepted_for` or `judgment_matches` node with `subject_ref.record_type = "LifecycleStatus"` — a status accepted by a judgment about that status. Evidence needed to close: the enum restricted to non-intrinsic business records, plus a fixture asserting the intrinsic case fails.

- **Constraint 6 — human bootstrap without recursive self-certification. Unmet.** Trace: `record-registry.json#/EvidenceJudgment/lifecycle/transitions` `proposed→accepted` → `criterion.EvidenceJudgment.accepted.v1`, whose `related_phases` requires `/payload/deciding_mandate_ref` in phase `accepted`. `Mandate` `proposed→accepted` → `criterion.Mandate.accepted.v1`, which requires `attested_result`; `primitive-registry.json#/attested_result/semantics` requires "accepted assessor mandate" evidenced in an Observation. Mandate acceptance therefore requires an accepted mandate. The only named terminator, `primitive-registry.json#/bootstrap_roots`, is referenced by **zero** of the 2252 predicates (`"bootstrap_roots"` occurs in no predicate body). Nothing grounds the chain; an implementer must invent the root of trust. The author's own FI-12 `proposal.remaining` lists "finite actual human bootstrap" as outstanding, which agrees.

### FI-10 — **closed at specification level.**

Resolved by reference, not prose: `subject-bindings.json#/Budget/canonical_types` = `[ResourceAccount, Reservation]`; `#/Handoff/canonical_types` = `[Continuation, ResponsibilityAssignment, HandoffAcceptance]` — accepted assignment transfer preserved alongside Continuation; `#/Evaluation/canonical_types` = `[EvaluationPlan, EvaluationRun, EvaluationTrial, EvidenceJudgment]`. Each `value_type` pins roles to single-member enums: `values.schema.json#/$defs/EvaluationBinding` gives `plan_ref`→`enum:["EvaluationPlan"]`, `run_refs[]`→`["EvaluationRun"]`, `judgment_refs[]`→`["EvidenceJudgment"]`; `HandoffBinding` gives `continuation_ref`/`assignment_ref`/`acceptance_ref` the same treatment. `Ref<Evaluation|Budget|Handoff|Attempt|RawCapture|RecoveryFrontier>` occurs **0** times in `record-registry.json`. The 46 `source-field-mappings.json#/additional_discoveries` entries are substantive per-field resolutions with reasons (e.g. `SecurityCase/containment_checks`: `Ref<Evaluation>[]` → `Ref<EvidenceJudgment>[]`), not chapter-link counts. Caveat: CCR-05.

### invariants.json / control-contracts.json bind nothing.

Both are loaded by `validate_contracts.py:38` and referenced by **no** check in it; `grep` shows no schema, record, predicate or command references either file. Their contents are prose strings (`invariants.json#/LifecycleStatus` = 4 sentences; `control-contracts.json#/Grant` = 4 sentences). `endpoints.json` is the same. They describe intent; nothing fails if they are contradicted — as constraint 2 above demonstrates concretely.

### New findings

- **CCR-01 (d)** — edge `criterion_id` is named on all 1295 edges but evaluated by no edge guard; `11-schemas-state-contracts.md:111` claims otherwise. Missing decision.
- **CCR-02 (d)** — `bootstrap_roots` defined, invoked nowhere; attestation regress has no ground. Missing decision.
- **CCR-03 (a)** — intrinsic/`LifecycleStatus` subject exclusion is prose-only in `invariants.json`; all eight subject-taking primitives' `record_type` enums admit all 173 records.
- **CCR-04 (a)** — 26 edges list `kernel.projection.recompute` in `allowed_command_ids`; it is absent from the 104-entry `command-registry.json`. `validate_contracts.py:113` checks only non-emptiness, never membership.
- **CCR-05 (a)** — `source-field-mappings.json` `destination` checked only for truthiness (`validate_contracts.py:179`); ~56 do not resolve against `records.schema.json`, one is a sentence: `"payload.chosen_option_id via explicit option identity map"`.
- **CCR-06 (b)** — `invariants.json`, `control-contracts.json` and `endpoints.json` are loaded but referenced by no check and no schema; `values.schema.json#/$defs/string` is unconstrained `{"type":"string"}`.
- **CCR-07 (a)** — coverage checks compare registry to inventory, both authored in the same run; the inventory is never re-derived from `capabilities.json` / `work-knowledge-contracts.json`.

### Not checked

- Any runtime behaviour — no handler, storage, crypto, gateway or provider path executed.
- `records.schema.json`, `commands.schema.json`, `values.schema.json` internals beyond `$ref` target resolution and the bindings named in FI-10.
- Field semantics of the ~170 records outside the acceptance chain I traced.
- Whether `coverage-inventory.json#/source_fields` equals the 864 fields of `capabilities.json` — my derivation errored on the source's shape and I did not retry.
- Every finding in `specification-findings.json` other than FI-10, FI-11, FI-12.
- Git provenance of `component_source_commit 133c57d`.
- `11-schemas-state-contracts.md` — read only by targeted grep, and treated as claims, not facts.
