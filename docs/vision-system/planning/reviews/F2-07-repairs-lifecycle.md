# F2-07 outside review — lifecycle repairs (DeletionScope)

Branch `vision/f7-r-lifecycle`, based on `51fc662` (review/outside-2026-09-19). These are repairs to
named contracts only. No phase, edge, field, record or primitive was added, so the S1.1 design freeze
holds. All three repairs are `RECORD_OVERRIDES` entries in `contracts/tools/phase_content.py`, each
citing new prose that the validator checks quote by quote. The criteria were re-derived with
`tools/author_phase_content.py`; none was hand-edited.

| Finding | Severity | Disposition | Where |
|---|---|---|---|
| F7-database-01 | BLOCKER | **REPAIRED** | 02 §8.3 (determined binding paragraph and the `determined` row of the phase table); `criterion.DeletionScope.determined.v1`; `gap-DeletionScope-determined` retired by the derivation |
| F7-database-02 | HIGH | **REPAIRED, with a stated proof limit** | 02 §8.3 (receipt applicability and inventory partition); 11 §Registration and transition routing (revision rule); `criterion.DeletionScope.verified.v1` and `criterion.DeletionScope.verified_with_residuals.v1` |
| F7-privacy-01 | MEDIUM | **REPAIRED** (paired with database-02) | 02 §8.3 (partition paragraph and the `verified` row); both verified criteria |

## F7-database-01

`determined` now binds these fields: `subject_refs`, `material_selector`, `purpose_ids`,
`restrictions`, `inventory_cutoff`, `inventory_refs`, `restriction_epoch_ref`, `response_due_at`,
`reconcile_at`, `proof_limits` and the envelope `owner_assignment_ref`, through `nonempty_fields`.
Related phases are also checked: the owner must be `accepted` and the restriction epoch `current`.
`exception_refs` must be `active` and `determination_ref` must be `validated`; both of these are
optional, and a present ref must still be in the stated phase. `lt` requires the inventory cutoff to
fall before the response deadline. Finally, the criterion requires `accepted_for` and
`attested_result`. Every one of these fails or resolves unresolved on a missing path, so a missing
binding still leaves the scope in `requested`. The existing `determination_ref` field carries the
determination, so no field was added. Purpose is bound through `purpose_ids`.

## F7-database-02 and F7-privacy-01

The old defect had two parts. The two phases differed only by the `uncertainty` role, and on
DeletionScope that role matches both residual arrays. So `verified_with_residuals` required unknown
copies **and** retention, while `verified` excluded neither.

The repair makes the two criteria disjoint:

- `verified` requires `not nonempty(unknown_copies)`, `not nonempty(residual_retention_refs)`, every
  `inventory_refs` item `contained|expired|retired`, and every `receipt_refs` item `recorded`.
- `verified_with_residuals` requires `any(nonempty(unknown_copies), nonempty(residual_retention_refs))`,
  which accepts retention-only, unknown-only and mixed results. Inventory items may also be
  `residual_unknown`, and any residual retention policy present must be `active`.

Both criteria also keep the restriction epoch `current`, the owner `accepted`, `native_correlated`,
`accepted_for` and `attested_result`. When evidence is absent, both resolve unresolved and the scope
stays in `propagating`.

Revisions: 11 now says that prior-revision evidence counts only under the record's own contract, and
that a revision lifts no restriction. 02 §8.3 is that contract for DeletionScope. A receipt applies to
revision N only if it names the same record at a revision no later than N, is `recorded`, and N does
not widen its scope. It covers only items discovered by its `checked_at`. The prior epoch and
retention stay binding until the successor reaches `restricted`.

**Proof limit.** The derivation DSL cannot join over the fields of each receipt: its
`deletion_scope_ref` revision, `covered_scope`, `method` and `checked_at`. The receipt-applicability
rule and the method-to-partition mapping are therefore not checked field by field by the machine.
They are stated in each criterion's `requires`, and the accepted judgment on that exact criterion
(`accepted_for`) carries them. Machine enforcement would need a new DSL form or primitive. That is an
architectural decision this repair does not make.

## Closure tests owed (not run: build hold)

- requested→determined→restricted→propagating succeeds with full bindings.
- A missing or stale epoch, or an unaccepted owner, is denied through both `kernel.record.transition`
  and `knowledge.forget.request`.
- Receipt after propagation, then revision, then re-verification.
- A receipt with the wrong scope, or one that is contested, is denied.
- Clean, retention-only, unknown-only and mixed cases each reach their own distinct phase.
