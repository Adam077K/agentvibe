> Archival provenance — 2026-09-13: Independent recheck of the internal-coherence repair, preserved verbatim from the completed read-only turn on frozen subject `f27c22e`. The reviewer did not author the repair, was barred from the repair author's return, session files and every lane worktree, and ran its own mutations on a scratch copy rather than reading the package's fixtures as evidence. The report arrived in four parts because the return channel truncated it; parts are concatenated in order with no edits. Archival does not establish hardened isolation; the reviewer shares a model family with the original reviewer and the repair author and says so.
>
> **Disposition this recheck supports:** G2-01 and G2-02 are **no longer (d)** — the original counterexamples are refused by named conjuncts and an implementer no longer invents what performance means or whether termination asserts closure. Both carry (a) residue. G2-05 closes for delivery and stays (a) for refund/failure. **G2-06 stays (a) open**: the drift oracle compares the registry to a derivation file the author controls, so the whole G2-01 defect is reintroducible in one hunk with every control green (RC-02); the negative-fixture suite has no count ratchet (RC-04). RC-01 is a real break the repair introduced. None is a missing decision; all are pinned, named, and owed before "closed" may be written.

**Recheck of G2-01, G2-02, G2-05, G2-06 at `f27c22e` — G2-01 closed (a residue) · G2-02 closed (a residue) · G2-05 closed for delivery, (a) for refund/failure · G2-06 (a) open · RC-01..08**

**Subject:** `f27c22e`

---

## Independence

Same model family as the original reviewer and the repair author; independence is **procedural only** — this is not an independent panel. I did not read the repair author's return, any session file under `docs/08-agents_work/`, or anything under `.worktrees/`. **Where I am predisposed to agree:** the package's self-incriminating style (the `hard=` drop rule, `author_phase_content.py`'s comment about a `--check` that would "cheerfully re-derive the committed registries") is exactly the register I am inclined to credit, so I ran my own mutations through my own harness rather than reading its fixtures as evidence — and the one that mattered leaked.

## Computed numbers (mine, frozen at `f27c22e`)

| Instrument | Result |
|---|---|
| `validate_contracts.py` (live) | `passed`, **268,836 checks**, 173 records · 185 values · 105 commands · 2,273 predicates · 1,308 edges · **27 negative fixtures rejected**, exit 0. **Positive control: live registry NOT rejected.** |
| `run_negative_fixtures.py` | **27 of 27 rejected, 0 leaked**, each on its own `expect_failure_contains` string. Full list observed. |
| `guard_distinctness.py` | 1308/1308 call own criterion; harsh sibling collisions **210 → 5** (budget 5); largest all-strings-erased share **567 → 126**; 0 unread args; exit 0 |

## G2-01 — **closed at specification level**, residue (a)

`SalesAgreement.relations` now carries `/payload/fulfillment_ref → Fulfillment` (`optional_one`; declared in `records.schema.json`, not in payload `required`).

What `performed` (5 conjuncts) requires that `accepted` (4) does not: **(1)** `nonempty_fields` adds `/payload/fulfillment_ref` and `/payload/obligation_refs`; **(2)** `related_phases` binds `fulfillment_ref → ["delivered"]` and `obligation_refs → ["discharged","transferred"]`, both `optional: false`; **(3)** `native_correlated(result: "delivered")` replaces the payment's `"performed"`. They are no longer byte-identical.

**Original counterexample replayed** (buyer pays, Fulfillment `proposed`, Obligations `recognized`, CriterionResult captured): refused by **conjunct 2, `related_phases`** — `proposed ∉ {delivered}` and `recognized ∉ {discharged, transferred}` — and independently by **conjunct 1, `nonempty_fields`**, if `fulfillment_ref` is absent. An implementer no longer invents what performance means; AD-013 is implemented as decided, and slightly stricter (`delivered` only, not "delivered/accepted").

**Residue (a):** `edge.SalesAgreement.{accepted,partially-performed,disputed}.performed.v1` still carry `native_correlated(result: "performed")` and **no `transition_basis`** — the only SalesAgreement forward edges with no authenticated-event requirement, while all five `*->terminated*` edges have one. Harmless today (the criterion conjunction dominates), and unpinned: `performed` is absent from `REQUIRED_GUARD_OPS`.

## G2-02 — **closed at specification level**, residue (a)

Five `*->terminated` edges (`proposed`, `accepted`, `partially-performed`, `disputed`, `terminated_with_residuals`); **all five carry `due_preserved`**. `terminated_with_residuals` exists with an entry from **every** state `terminated` has. `due_preserved` takes `target_state`, and its semantics branch on it — closure requires discharged/not_arisen/transferred, residual states "retain exact unresolved inventory and accepted continuity". That is the discriminator.

**Counterexample replayed** (terminate from `disputed`, three `recognized` Obligations, open SupportCase): refused by **`due_preserved`, conjunct 4 of 6**, of `edge.SalesAgreement.disputed.terminated.v1`. Route available: `disputed->terminated_with_residuals`.

**Residue (a).** `edge.SalesAgreement.terminated_with_residuals.terminated.v1` carries `due_preserved` but is **not** in `REQUIRED_GUARD_OPS` — the pinning loop covers only `proposed`, `accepted`, `partially-performed`, `disputed`, so the fifth closure edge's op can be deleted with every control green. Second residue: `criterion.SalesAgreement.terminated_with_residuals.v1` requires **one** record-level `/owner_assignment_ref` in `accepted` plus `fresh_interval`; "an accepted custodian **for each** residual" exists only in the criterion's `meaning` string and in `due_preserved`'s prose semantics, not as a per-residual enumeration.

## G2-05 — closed for delivery, (a) for refund/failure

`Fulfillment` gained `delivering → delivered → {failed, refunded}`. `edge.Fulfillment.delivering.delivered.v1` ops: `subject_unchanged`, `status_edge`, **`transition_basis(event_kind: "record.delivered")`**, **`native_correlated(result: "delivered")`**, `current_owner`, `call(criterion.Fulfillment.delivered.v1)`. Both evidence ops are pinned in `REQUIRED_GUARD_OPS` with the G2-05/AD-013 text, and `r11-delivery-correlated-to-nothing` rejects their removal. So yes: authenticated attributable event **and** native correlation. **Not against a DELIVERY adapter, though** — `native_correlated` takes no adapter-kind argument; "correlated to the delivery adapter's own native object, never the payment" is a sentence in `meaning`, not a machine discriminator. `criterion.Fulfillment.refunded.v1` is a declared `content_unspecified` gap (`gap-Fulfillment-refunded`).

## G2-06 — (a) open. One mutation leaked, and it is the one that matters.

Three original mutations, run through the package's own `run_fixture` harness on my own patches (not its fixtures) — **all three now rejected**, each naming `criterion content drifts from its derivation`, `drifted: 1`, `predicate: criterion.SalesAgreement.performed.v1`: erase `field_paths` → rejected; repoint to `/payload/buyer_ref` → rejected; body reduced to one `nonempty_fields` + `accepted_for` + `attested_result` → rejected. Positive control (unpatched) passes.

**The leak: mutate the derivation itself.** The oracle compares the registry to `tools/phase_content.py`, so I edited that instead — one hunk, `("SalesAgreement","performed")`, replacing the conjuncts with `[("nfp", ["/payload/acceptance_evidence","/payload/agreed_terms"]), ("nc","performed"), AF, AR], hard=["nfp","nc"]` — then ran `author_phase_content.py` (exit 0, `criteria_enriched: 764`) and validated. **Result: exit 0, 268,829 checks**, and in that same tree **all 27 negative fixtures still rejected, exit 0**. The whole G2-01 defect — no `fulfillment_ref`, no `delivered` binding, no obligation states, correlation back on `"performed"` — is reintroducible in one hunk with every control green. And the regenerated criterion's `requires` still read *"The agreement names its own Fulfillment record, that Fulfillment is currently `delivered`"* over a body demanding none of it: `requires` and `conjuncts` are independent fields in `spec()` with nothing comparing them.

**Budget 5→4:** rejected — `guard distinctness ratchet: sibling collisions exceed the budget`. The ratchet is live; `guard_distinctness.py` no longer `return 0`s unconditionally (measured: harsh collisions 210 → **5**, budget **5**; largest all-strings-erased share 567 → **126**).

**Deleted fixture:** **not noticed.** 1 of 27 fixtures present → `negative_fixtures_rejected: 1`, **exit 0**. The only guards are `if not fixtures` and `FIXTURES_RUN["fixtures"] > 0`; no count is declared anywhere.

## What the repair broke

Structurally clean: only `Case`, `Fulfillment`, `ResponsibilityAssignment`, `SalesAgreement` changed lifecycle/relations; **5 criterion bodies changed, 0 outside the named set**; 18 predicates added, all in scope; **0 of 2,255 predicates reordered keys**, pre-existing order preserved in every file; `values.schema.json`'s 7,639 lines are the generated `PredicateId`/`TypedPredicate` enums — generated, not hand churn. `records.schema.json` gained `SalesAgreement.payload.fulfillment_ref` (not in `required`), `Case.parking_closure_account_ref`, `DecisionPacket.taste_decision`, `Economics.external_burden_account`, three `ResponsibilityAssignment` fields, and five new `LifecycleStatus` values. One real break, RC-01.

## New findings

- **RC-01 (a)** — `Fulfillment:failed` is reachable only via `delivered->failed`, yet `criterion.Fulfillment.failed.v1` conjunct 3 is `not(native_correlated(result:"delivered"))` while `edge.Fulfillment.delivering.delivered.v1` requires that exact correlation; `delivering` exits only to `delivered` or `superseded`, so a delivery failing in flight has no transition, and `refunded`'s single inbound edge makes a refund of an undelivered sale unrepresentable.
- **RC-02 (a)** — the content oracle pins registry→`tools/phase_content.py`, not registry→corpus: a one-hunk weakening of the derivation plus `author_phase_content.py` reintroduces the whole G2-01 defect at exit 0, 268,829 checks, 27/27 fixtures still rejecting.
- **RC-03 (b)** — `spec()`'s `requires` prose and its `conjuncts` are never compared, so a criterion can state one requirement and demand another.
- **RC-04 (b)** — the negative-fixture suite has no count ratchet: 1 of 27 present → `negative_fixtures_rejected: 1`, exit 0.
- **RC-05 (b)** — `run_negative_fixtures.ROOT` uses `.resolve()`, so with a symlinked `tools/` the control measures the symlink target; the same 1-fixture tree reported 27.
- **RC-06 (b)** — the three `*->performed` edges carry no `transition_basis`, still carry `native_correlated(result: "performed")`, and none is in `REQUIRED_GUARD_OPS`.
- **RC-07 (b)** — `terminated_with_residuals` appears in no specification chapter (only `PLANNING-REPORT.md` and the G-02 review), though its criterion cites CAP-39 `closed-with-residuals` verbatim.
- **RC-08 (b)** — `Fulfillment`'s generic `validated` branch is disjoint from the delivery branch (no `validated->delivering`), and `proposed->validated` remains base-only.

## Not checked

Instance-level execution of any guard (no evaluator exists); whether `phase_content.py`'s quotes *support* the bodies they license (only that they appear verbatim); the other 66 registered gaps; RC-01's reachability shape on records beyond `SalesAgreement`/`Fulfillment`; `attack_join.py`; whether `validate_contracts.py` runs in CI at all; G2-03, G2-04, G2-07.
