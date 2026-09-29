<!-- PROVENANCE (orchestrator, ceo-4-1789314685, 2026-09-14). Reviewer: `reviewer` engine, lane `f2-06-recheck-02`; authored nothing in this package; brief carried subject + criteria only (no producer accounts, no index, no recheck-01, no register status fields). Subject: `38a3421`. During the review the root HEAD advanced to `de14a70` (state.json and history.jsonl only; neither read by the reviewer; every path under planning/specification/** and planning/reviews/** unchanged — reviewer confirmed). The validator and both fixture runners were NOT run by instruction (the contracts lane held the validator): no control was observed failing; each verdict rests on the guard body, the pin entry and the fixture pair. Return channel: not truncated; this file is the reviewer's final transcript message, verbatim (58,175 chars, 498 lines, cmp-verified). Verdicts: 13 CLOSED at specification level, 5 PARTIAL (F6B-02, F6B-03, F6C-04, F6C-07, F6C-14), 0 OPEN, 0 REGRESSED; F6C-08 closed by substitution (natural key, not exclusive factory). New findings F6V-01..04, none (d). One model family; procedural independence only; no runtime exists. -->

I have all the evidence. Writing the report.

## Précis

Subject `38a3421`; frozen paths verified unchanged at end (HEAD advanced to `de14a70`, touching only `state.json` and `history.jsonl`, neither read). Single model family, shared with the authors; procedural independence only. I read no producer self-assessment, no session file, no findings index, no recheck-01, no state or history, and none of the `status`/`resolution`/`implementation_evidence` fields of the findings register.

Of eighteen findings: **13 CLOSED at specification level, 5 PARTIAL, 0 OPEN, 0 REGRESSED.**

The repair is substantial and mostly real. Fifteen records that had declared another record's payload now declare their own, and a new validator check compares registry against schema for all 188 records with a property set (union rule holds, 0 failures). Eight guards were created or extended, every one bound to real edges, every one pinned field-by-field in `pinned-conjuncts.json`, and every one carrying an adverse fixture that removes a pinned conjunct plus a benign fixture that hardens it. The negative suite went 56 → 95 and the positive 17 → 56; declared and present sets match exactly in both directions.

Five are partial:

- **F6B-02** — `constraint_set_ref` is now required on all four transfer records, but `boundary_kind` is still `type: string` with no enum, and no contested-refs field exists on any operator-facing record, so DELTA 1's second limb still has no carrier.
- **F6B-03** — the conjunct and the eighteenth fixture landed, but nothing binds the calibration to *the checker that produced the verdict*; `AcceptanceInterval` carries no checker identity, so any calibration in `run` satisfies it.
- **F6C-04 / F6C-14** — both counts are required at run close, but no conjunct compares them and no field records the divergence. The pin refuses to store it, with a stated reason. `07` §6 nonetheless says the conjunct "records the divergence", which the pin contradicts.
- **F6C-07** — the inspection has an owner and a latest responsible time as Q-022, but Q-020 and Q-021 still defer to the act, not to Q-022.

**F6C-08** I record as closed by substitution rather than by the letter: `exclusive_factory` is still `null`, but a checked `identity.natural_key` over the exact triple with a stated resolve-or-create rule does the work, and there is no entry transition for the asked-for conjunct to sit on.

Four new findings, F6V-01 through F6V-04: the `07` §6 over-claim about divergence; `kernel.record.register` saying nothing about natural keys while the identity declares resolve-or-create; the layer-4 removal criterion still reading "a small stable set" in two places while the reopen condition it feeds is now quantified; and `04` §107's encounter strata sitting in a DESIGN PROPOSAL paragraph that `04` §117 adopts as specification.

Standing caveat: no runtime exists. Every "closed" here is specified behaviour checked offline by reading and by direct queries over the files. I did not run `validate_contracts.py` or either fixture runner, so no control was observed failing; I verified instead that each has a failing case, a pinned conjunct, and a paired benign case.

---

## 1. Per-finding verdicts

| id | class | verdict | one line |
|---|---|---|---|
| F6A-03 | (a) | **CLOSED** | Resolved by a third disposition: `refusal-sample` is scoped into an existing encounter stratum, stated in both `04` and `05` with a falsifiable three-part test, so it is not a delta. |
| F6A-07 | (a) | **CLOSED** | All fifteen records declare their own payload; a union-rule check now compares registry to schema for 188 records, with a fixture pair. |
| F6B-02 | (a) | **PARTIAL** | Three of five clauses met. `boundary_kind` is still an unconstrained string and no contested-refs field exists. |
| F6B-03 | (a) | **PARTIAL** | Conjunct and eighteenth fixture landed. Nothing binds the calibration to the checker that produced the verdict. |
| F6B-06 | (a) | **CLOSED** | Header states six packets, not five findings, and lists the ten consolidation ids each subsumes; §349 and §370 agree. |
| F6B-07 | (b) | **CLOSED** | The continuity row names the day-five arm, marks itself partially exercised, and names MD-03. Both branches taken. |
| F6B-09 | (a) | **CLOSED** | Interval corrected to the two dates themselves; AX-ROUND-01's drift check recorded as owed with a named owner and a due trigger. |
| F6B-10 | (b) | **CLOSED** | ChatDev half cited with its numbers *and* F-10's "INFERENCE, not a measured decomposition" label carried on the sentence. |
| F6B-11 | (b) | **CLOSED** | Both chapters now carry a SOURCE CLAIM with the numbers, the study, the year and the primary-read label. |
| F6C-01 | (a) | **CLOSED** | `production_mode` required, performer ref conditionally required, `none` refused for an exhaustible class, guard on both admission edges. |
| F6C-03 | (a) | **CLOSED** | Guard on all three `* → released` edges; lapse bound to a `ScheduleOccurrence` that must have left `planned`. |
| F6C-04 | (a) | **PARTIAL** | Both fields required at close. No conjunct compares them; divergence deliberately not stored; `07` §6 says otherwise. |
| F6C-07 | (a) | **PARTIAL** | Inspection owned by the founder as Q-022 with a latest responsible time. Q-020 and Q-021 still defer to the act, not to Q-022. |
| F6C-08 | (a) | **CLOSED** | By substitution: a checked `identity.natural_key` over the triple with a resolve-or-create rule, rather than an exclusive factory. |
| F6C-09 | (a) | **CLOSED** | Schema conditional requires the recipient when the class is `no_progress`; guard on all three edges into the terminal phase. |
| F6C-14 | (a) | **PARTIAL** | Shares F6C-04's unmet sub-clause. Its own consequence is discharged: the instrument now exists. |
| F6C-15 | (a) | **CLOSED** | `accepted_closure_member_refs` required, and the containment now runs the other way; the adverse case as worded fails. |
| F6C-17 | (a) | **CLOSED** | Both reopen conditions quantified with windows, and additionally labelled DESIGN PROPOSAL placeholders owned by the founder. |

---

## 2. Detail per finding

Common evidence paths, absolute, all read at `38a3421`:

```
/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685/docs/vision-system/planning/specification/
  04-human-operation.md · 05-work-agents-skills.md · 06-knowledge-evidence-evaluation.md · 07-integrations-capacity.md
  contracts/record-registry.json · contracts/records.schema.json · contracts/predicate-registry.json
  contracts/pinned-conjuncts.json · contracts/validate_contracts.py
  contracts/fixtures/negative/MANIFEST.json · contracts/fixtures/positive/MANIFEST.json
/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685/docs/vision-system/planning/02-architecture-selection.md
/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685/docs/vision-system/registers/open-questions.json
```

### Suite-level evidence, computed once

Negative manifest declares 95 fixtures, floor 95; 95 present on disk; declared-not-present and present-not-declared are both empty. Positive declares 56, floor 56; 56 present; both difference sets empty. The manifest's `floor_why` records the raises: negative 56 → 91 by R18, then 91 → 95 by RC5; positive 17 → 52 by R18, then to 56.

---

### F6A-03 · class (a) · CLOSED

**Clauses.** (1) Declare `refusal-sample` as DELTA 3 in `04` with a row in §119's attention admission, **or** (2) route a decision packet under DIRECTIVE §3.

**What satisfies them.** Neither branch as written. A third disposition was taken and is stated in both chapters.

`05` §192 now reads that the sample is returned "**as the adverse stratum of the first of `04-human-operation.md`'s four encounter kinds — original customer material, which already alternates ordinary with adverse, abandoned and underserved cases**", on that chapter's existing cycle, inside its declared batch minutes, by its existing sampling rule. It states the test in falsifiable form: "if `refusal-sample` required a slot of its own, a cadence of its own, or an attention line of its own, it would be a delta and would need a decision packet under DIRECTIVE §3; it requires none of the three." It carries a superseded note recording the prior wording.

`04` §117 carries the matching sentence: the construction "rides an existing kind rather than adding one … takes places in that stratum rather than adding places, sets no cadence, and adds no row to the attention admission below. **It is therefore not a third delta: the two deltas above remain the whole of what the F2 round changes here** (F6A-03)."

**Counterexample checks re-run.** The finding's computed basis was that `refusal-sample` occurs once in the whole specification and zero times in `04`. It now occurs in both chapters, at `04:117` and `05:192`. `04` §119's attention admission is unchanged and carries no new row, which is consistent with the claim made about it. `04` §107 does declare the stratum the sample rides: "Customer material alternates ordinary and adverse/abandoned/underserved cases", with "a recorded reproducible random seed within strata, outside the account producer's write authority" and "Empty strata and unavailable originals are recorded, not replaced by flattering examples."

**Why this is acceptable as a disposition.** The finding itself declined to pick between its two readings and said "the discriminating act is the founder's, not a reviewer's." The repair removes the ambiguity by establishing that no boundary moved, in both chapters, consistently, with a stated test a reader can apply. That is a legitimate answer to a coherence finding.

**Residual, raised as F6V-04.** `04` §107 is a **DESIGN PROPOSAL** paragraph. The four encounter kinds and their strata are pulled into specification only by §117's "All four encounter kinds are adopted."

**Fixture pair.** None; this is a prose coherence finding with no contract surface.

---

### F6A-07 · class (a) · CLOSED

**Clauses.** (1) Delete `type_fields`/`required_fields` from the fifteen new records, or set them to each record's own payload. (2) Add a check that `record-registry.json` and `records.schema.json` agree on every record's payload.

**Clause 1, computed.** None of the fifteen carries `ContextManifest`'s fifteen fields. Field counts per record, registry side:

| record | type_fields | required_fields |
|---|---|---|
| AcceptanceInterval | 14 | 12 |
| AdmissionRecord | 18 | 12 |
| ArmedSet | 5 | 5 |
| ConsequenceDerivation | 15 | 11 |
| ConstraintSet | 7 | 6 |
| EffectIdentity | 9 | 7 |
| ExistenceJustification | 12 | 12 |
| FieldAuthority | 9 | 8 |
| GrantDeliveryReceipt | 6 | 6 |
| InstrumentCalibration | 10 | 6 |
| ProjectionGrant | 11 | 9 |
| ShedDecision | 11 | 11 |
| StandingHolder | 18 | 16 |
| StandingInterest | 18 | 14 |
| UnmatchedPoolEntry | 10 | 7 |

The three consequences the finding named are reversed. `ConsequenceDerivation`'s `required_fields` now includes `declared_floor_ref`, `reached_class_ids`, `frozen_payload_digest` and `release_path_component_id`. `StandingHolder` no longer requires `work_order_ref` or `expires_at`. `AdmissionRecord` requires `origin` and `arrival_seq`.

**Clause 2, and this is the load-bearing half.** `validate_contracts.py` carries a block headed "F6A-07: THE REGISTRY AND THE SCHEMA MUST AGREE ABOUT A RECORD'S PAYLOAD." It states the rule over the three registry shapes and reads the union:

```python
declared = set(payload.get("type_fields") or {}) | set(added)
declared_required = set(payload.get("required_fields") or []) | {
    field for field, body in added.items() if body.get("required")}
checked(declared == set(schema_payload["properties"]), (...))
checked(declared_required == set(schema_payload.get("required", [])), (...))
```

It skips only records whose schema payload declares no `properties`, and states why: `LifecycleStatus` is `kind: lifecycle-decision`. Narrowing by `kind` instead "would have excused a record by a field its own author writes."

**I re-derived the rule independently.** Over all 189 records, applying the union rule: **0 failures**, 1 skipped (`LifecycleStatus`), matching the validator's own stated denominator of 187 of 188 (the registry now holds 189 records; `ExhaustionDecision` is the new one, added for F6C-02).

A third check compares the two halves where they overlap: a field declared in both must carry the same type.

**Failing case.** `fixtures/negative/r18-registry-payload-copied-from-another-record.json` replaces `ConsequenceDerivation.fields.payload.required_fields` with `ContextManifest`'s fifteen — the measured defect restored on one record. Expected failure text: `REGISTRY AND SCHEMA DISAGREE ABOUT WHICH PAYLOAD FIELDS ARE REQUIRED`.

**Benign pair.** `fixtures/positive/r18-registry-payload-copied-from-another-record-benign.json` removes `declared_floor_ref` from `type_fields` alone. I verified this genuinely passes: `ConsequenceDerivation` declares that field in both `type_fields` and `fields`, so the union is unchanged. The pair therefore exercises the union path rather than a `type_fields`-only read, which is what the benign fixture's own `why` says it is for.

---

### F6B-02 · class (a) · PARTIAL

**Clauses.** (1) `constraint_set_ref` required on `Continuation`. (2) Required on the operator record carrying the re-entry brief. (3) Required, not optional, on `Delegation`. (4) `boundary_kind` as an enum covering the transfers the six fixtures name. (5) A contested-refs field beside `omission_manifest_ref`.

**Clauses 1–3, met.** Exactly four records carry `constraint_set_ref` and all four require it: `Continuation`, `DecisionPacket`, `Delegation`, `OperatorProjection`. The finding measured two occurrences in the schema on one record, not required even there.

A new guard binds it at the transfer itself. `guard.constraint.set_bound_at_transfer` has two conjuncts — `nonempty_fields` on `/payload/constraint_set_ref`, and `related_phases` requiring the referenced set to stand at `issued`, `optional: false`. It is called by five edges: `Continuation prepared→offered`, `DecisionPacket ready→presented`, and `OperatorProjection` from each of `stale`, `incomplete` and `unknown` into `current`.

**Clause 4, UNMET.** `ConstraintSet.payload.boundary_kind` is `{"$ref": "values.schema.json#/$defs/string"}`. No enum. `value-registry.json` holds no key matching "boundary". Only one predicate mentions the field, `criterion.ConstraintSet.issued.v1`, and it requires the field non-empty and nothing more. The finding's counterexample stands verbatim: nothing can assert that a founder-brief boundary kind exists, and any string satisfies the rule.

**Clause 5, UNMET.** `OperatorProjection.payload` carries `actor_scope_ref, constraint_set_ref, freshness, included_refs, next_refresh_at, omission_manifest_ref, projection, selection_version_ref, view_id`. No contested field. Across the whole registry and schema, only two payload fields match "contest": `DomainAssessment.owner_contestation_ref` and `ResponsibilityAssignment.contesting_mandate_refs`. Neither is an operator-facing brief record and neither sits beside `omission_manifest_ref`. `04` §127's DELTA 1 still reads "what was omitted **and what was contested**", so its second limb remains without a carrier — which is exactly what the finding said.

**Failing case.** `fixtures/negative/r18-founder-brief-crosses-an-untyped-boundary.json` flips the `related_phases` binding to `optional: true`. Expected failure: `'guard.constraint.set_bound_at_transfer', 'related_phases'`. The pin for that guard requires both ops, so the mutation is caught.

**Benign pair.** `...-benign.json` adds a third conjunct requiring `constraint_set_ref` present — a hardening in the same shape that must pass.

**Note on scope.** `HandoffAcceptance`, `WorkMessage`, `AttemptReport` and `ParticipationEncounter` still carry no `constraint_set_ref`. The finding listed them in its counterexample but did not name them in its contract, so I record this rather than counting it as an unmet clause.

---

### F6B-03 · class (a) · PARTIAL

**Clauses.** (1) A conjunct on the acceptance edge requiring a current `InstrumentCalibration` in phase `run` **for the checker that produced the verdict**. (2) An eighteenth adverse fixture pairing it.

**Clause 2, met.** `fixtures/negative/r18-acceptance-on-an-uncalibrated-checker.json` with its benign pair. The seventeen r16 rows are unchanged and this is a new row.

**Clause 1, met in its operative half.** `AcceptanceInterval.payload.calibration_ref` is `Ref<InstrumentCalibration>`, required in the schema. `guard.calibration.current_for_checker` is called by `edge.AcceptanceInterval.in_acceptance.accepted.v1` and demands the ref be non-empty and its related phase be exactly `run`. `InstrumentCalibration`'s phases are `scheduled · run · superseded`, so `scheduled` (no refusal rate yet) and `superseded` (not current) are both refused. The finding's counterexample — "no record in `record-registry.json` relates to `InstrumentCalibration`" — is closed.

**Clause 1, unmet in its qualifier.** Nothing binds the calibration to the checker that produced *this* verdict. `AcceptanceInterval` carries no checker identity field at all; its payload is `acceptance_owner_ref, calibration_ref, criteria_author_component_id, criteria_frozen_at, criteria_ref, declared_done_at, effect_class_id, escalation_holder_ref, holder_ref, latest_responsible_at, producing_path_component_ids, producing_started_at, resolution_reason, submission_seq, work_order_ref`. `InstrumentCalibration` does carry `checker_id`, required, so the other end of the join exists and nothing joins to it. `criterion.AcceptanceInterval.accepted.v1` adds nothing on this point, and the record's three invariants are silent on it.

**The consequence.** An acceptance may name any instrument's calibration standing at `run`. That is a weaker guarantee than the clause asked for, and it is the same shape as the original defect: a clause naming an attachment point, attached one level short.

**Failing case.** The negative fixture flips the `related_phases` binding to `optional: true`; expected failure `'guard.calibration.current_for_checker', 'related_phases'`. **Benign pair** adds a conjunct requiring `acceptance_owner_ref`.

---

### F6B-06 · class (a) · CLOSED

**Clauses.** (1) State whether the five are findings or packets. (2) List the consolidation finding ids each packet subsumes.

**Clause 1.** `05` header: "**Six founder packets carry the (d)-class findings open against this layer; the count is of packets, not of findings, and they subsume ten consolidation findings between them.**"

**Clause 2.** The mapping is written out: MD-01 (AC-M1-02 · AC-M5-02), MD-02 (AC-M3-02 · AC-M4-01 · AC-M4-02), MD-03 (AC-M1-01), MD-04 (AC-M4-03), MD-07 (AT-M3-03 · AE-M4-01), MD-08 (AE-M2-01). Summing: 2+3+1+1+2+1 = **10**, which is the number the header claims.

**The finding's specific charge, re-run.** AC-M3-02, AC-M4-01 and AC-M4-03 were absent from the old list. AC-M3-02 and AC-M4-01 are now in MD-02; AC-M4-03 is in MD-04, and MD-04's "carries no open (d)" claim is withdrawn in the superseded note. The header carries that note, naming what was wrong and in which direction: "The ambiguity ran in the flattering direction, which is why the mapping is written out rather than counted (F6B-06)."

**Internal consistency, checked at three sites.** `05` §349 repeats MD-01, MD-02, MD-04, MD-07, MD-08 with identical id sets, and adds of MD-02 "three findings, one packet, and the first two are what this line's own words state verbatim" — the precise charge the finding made about MD-02's text. `05` §370 repeats "six founder packets open, subsuming ten (d)-class consolidation findings". MD-03 is absent from §349 because it is a §7/§184 dependency, not a §12 one, and §184 carries it.

---

### F6B-07 · class (b) · CLOSED

**Clause.** Either mark the continuity row partially exercised with MD-03 named, **or** state which of F-6's two arms the row covers.

**Both branches taken in one row.** `05` §341: "Continuity and on-call | **F-6, its day-five arm** — the incident and the terminus of the escalation ladder | **exercised on that arm only.** F-6's other arm — the decision needing only the founder that arrives on day one with a deadline on day four — turns on MD-03's unanswered third clause, what happens during a founder absence (§7). **Recorded as partially exercised with MD-03 named**, in the discipline the row below already uses (F6B-07)."

The finding's own observation was that the row below applied the right honesty and this row did not. The repair names that asymmetry as its reason.

---

### F6B-09 · class (a) · CLOSED

**Clauses.** (1) Correct the interval to one day. (2) Record AX-ROUND-01's drift check as run with its result, or as owed with an owner and a date.

**Clause 1, and it is done better than asked.** `05` §128 now reads "an identical grant delivered **twenty-four tools on 2026-08-16 and zero across three independent dispatches on 2026-08-17, configuration unchanged**". The interval word is replaced by the two dates, so the restatement cannot drift from its source again. A superseded note records the error and its provenance: "R3's own unknowns list says 'two days later' while F59's body carries the dates, so the restatement copied the summary line and not the finding — which is AX-M1-03, the named instance of AX-ROUND-01, committed in the synthesis after being found in a candidate (F6B-09)."

The finding grepped for `2026-08-16` and `2026-08-17` and found neither anywhere in the specification tree or registers. Both now appear at `05:128`.

**Clause 2.** "**AX-ROUND-01's own required contract is recorded here as owed, not as done:** the repository's existence-and-drift check exists, and its **existence** half runs over this tree and blocks in CI (`npm run check:citations-exist`, exit 0 on this commit); its **drift** half is WARN, is not a step of `npm run check`, and **this round has recorded no run of it over `research/F2/**` or `planning/F2/candidates/**`**. Owner: the instrument custodian of `06-knowledge-evidence-evaluation.md` §5, excluded from every producing path. Due before the next amendment of this chapter."

**Deviation, named.** The clause asked for "an owner and a date." An owner is named. The due trigger is a condition, not a calendar date. I record this as met rather than partial: the trigger is checkable by anyone amending the chapter, which is the work the clause was written to do, and the split posture it describes for the existence and drift halves matches what the repository's own citation decision records.

---

### F6B-10 · class (b) · CLOSED

**Clause.** Cite the ChatDev half beside it, **or** carry F-10's "INFERENCE, not a measured decomposition" label on the sentence.

**Both branches taken.** `05` §122: "**The disagreement R2 preserved is preserved here, on both halves** (F6B-10): ChatDev's ablation runs the other way — *'the most substantial impact on performance occurs when the roles of all agents are removed from their system prompts'*, Quality falling **0.3953 → 0.2212** — and F-10's reconciliation, that procedural content carries the benefit while the job title carries none, is **an INFERENCE and not a measured decomposition**, because neither study isolates the two. F-10 calls it *'the cleanest experiment nobody has run'*, and the F2 acceptance protocol §7 requires the disagreement to be carried rather than resolved by the half that suits the design."

The counter-result, its numbers, the epistemic downgrade and the protocol rule that demands them are all on the sentence.

---

### F6B-11 · class (b) · CLOSED

**Clause.** The finding carries no explicit "Required contract" line. Its operative demand is that the chapters state the measurement rather than invoke it by adjective, per protocol §7.

**Both sites repaired.** `05` §333: "**SOURCE CLAIM — the measurement, because 'a measured X' with no X is the shape the protocol §7 calls folklore (F6B-11):** any two evaluators of one system by one method agree on **5–65%** of the problems found, and on which problems are *severe* they agree **28%** (cognitive walkthrough) and **20%** (thinking-aloud), with severity rank correlations near 0.25 — Hertzum and Jacobsen 2003, *IJHCI* 15(1) 183–204, primary PDF read (R7 F15)."

`06` §90 carries the same claim in the same form, labelled "**SOURCE CLAIM — the rate, stated rather than invoked by adjective (F6B-11)**".

The figures match R7 F15 as the finding reported them, and are more precise: the finding said "20–28% on severity", the chapters split it by method.

**Deviation, named.** Protocol §7's full nine-field apparatus — confidence, conflicts of interest, corroboration, expiry, invalidator — is not on the chapter sentence; source, date, type and primary/secondary are. The finding itself located the failure in the chapters and not in the evidence, noting the register does it correctly at Q-019, so the split is the package's convention rather than a gap introduced here.

---

### F6C-01 · class (a) · CLOSED

**Clauses.** (1) A required field on `Obligation` (or its capability contract) naming the non-model production mode and its performer assignment ref. (2) A conjunct on the admission edge for any duty class that can exhaust.

**Clause 1.** `Obligation` gains three fields:

| field | type | required |
|---|---|---|
| `production_mode` | `Enum<manual_founder,contracted_professional,other_provider,none>` | yes |
| `production_performer_ref` | `Ref<ResponsibilityAssignment>` | conditional |
| `duty_class_can_exhaust` | `boolean` | yes |

The performer ref is conditional rather than flat-required, via a schema `allOf`:

```json
{"if": {"properties": {"duty_class_can_exhaust": {"const": true}},
        "required": ["duty_class_can_exhaust"]},
 "then": {"properties": {"production_mode": {"not": {"const": "none"}}},
          "required": ["production_performer_ref"]}}
```

This is stronger than the clause asked: for an exhaustible class the mode may not be `none` **and** a performer must be named; for a non-exhaustible class neither is forced, which avoids inventing a performer for a duty that cannot exhaust. The finding's computed counterexample — `production_mode` and every equivalent occurring zero times across the four contract files — is closed.

**Clause 2.** `guard.obligation.production_mode_named` requires `production_mode` non-empty and `duty_class_can_exhaust` present, and is called by `Obligation potential→recognized` and `not_arisen→recognized`. Those are the two admission edges. I checked the other four edges into `recognized` — from `transfer_pending`, `discharged` and `transferred` — and they carry no guard, but this is not a bypass: both fields are in the schema's base `required` and the exhaustibility conditional is a payload constraint that applies to every revision on every path.

**Failing case.** `fixtures/negative/r18-obligation-admitted-with-no-mode-named.json` removes conjunct 0. Expected failure `'guard.obligation.production_mode_named', 'nonempty_fields'`; the pin lists both ops. Its `why` records the coverage motive: F6C-16 measured 14 of 30 guards exercised by a paired fixture, and this was one of the sixteen without.

**Benign pair** adds a `custodian_ref` demand — an obligation admitted with `manual_founder` and its exhaustibility recorded must pass.

---

### F6C-03 · class (a) · CLOSED

**Clauses.** (1) The guard on every `* → released` edge. (2) Either a `lapsed` phase entered by the durable timer sweep, or an explicit statement that the lapse is a `ScheduleOccurrence`.

**Clause 1, computed.** `Reservation` has nine transitions. Three end in `released`, and all three now call `guard.reservation.lapse_independent_of_consent`:

| from | to | guard |
|---|---|---|
| held | released | present |
| partly_consumed | released | present |
| uncertain | released | present |

The finding measured it on `held → released` and no other.

**Clause 2, second branch taken.** No `lapsed` phase was added; the phases are still `held · partly_consumed · consumed · released · uncertain`. Instead the lapse is bound to a `ScheduleOccurrence`. `Reservation.payload.lapse_occurrence_ref` is `Ref<ScheduleOccurrence>`, required, and the guard's fifth conjunct is a `related_phases` binding accepting `due, admitted, running, completed, missed, disposed` with `optional: false` — so `planned` is the one state refused. The guard's own `meaning` states the point: "**PASSING THAT POINT IS AN EVENT**: the reservation names a ScheduleOccurrence that has left `planned`, so the lapse is something that fired rather than a field nobody read."

All five fields the finding said were absent from `required` are now required in the schema: `lapse_occurrence_ref, lapse_point, lapse_requires_holder_consent, lapsed_unconsumed_quantity`, alongside the pre-existing quantity fields.

**Failing case.** `fixtures/negative/r18-reservation-released-on-a-route-with-no-lapse-event.json` removes conjunct 3, the `nonempty_fields` on `lapse_occurrence_ref`. The pin for this guard lists that conjunct with `field_paths_include: ["/payload/lapse_occurrence_ref"]`, so the removal is caught at field level rather than by op alone.

**Benign pair** adds a sixth conjunct on `account_ref`. Its `why` states the discrimination the pair is for: "a scheduled lapse nobody woke for is not a lapse" — which is why `planned` is excluded and the other six states are not.

---

### F6C-04 · class (a) · PARTIAL — and F6C-14 · class (a) · PARTIAL

F6C-14's contract is "As F6C-04", so they share evidence and share a verdict.

**Clauses.** (1) `expected_native_launch_count` required on `WorkflowDefinition`. (2) `actual_native_launch_count` on `WorkflowRun`. (3) A conjunct on the run's `* → accepted` edge **comparing them and recording the divergence**.

**Clauses 1 and 2, met.** `WorkflowDefinition.expected_native_launch_count` is `UInt64` and in the schema's `required`. `WorkflowRun` carries both `expected_native_launch_count` (required) and `actual_native_launch_count` (optional at registration). The finding measured zero occurrences of these strings anywhere under `contracts/`.

**Clause 3, partly met.** `guard.launch.actual_compared_to_expected` is called by `edge.WorkflowRun.acceptance_pending.accepted.v1`. That is the only edge into `accepted`, so edge coverage is complete. The guard demands `actual_native_launch_count`, `expected_native_launch_count` and `workflow_ref` all non-empty, and requires the referenced definition to stand at `admitted` or `restricted` — so the expected count cannot come from a draft edited after the run started. Demanding the actual count *here* is what makes it "required at close" despite being optional at registration.

**What is unmet.** No conjunct compares the two values. No field records a divergence: I searched every payload field name in the registry for "diverg" and found none, and `guard.launch.actual_compared_to_expected` is the only predicate in 2,397 that names `actual_native_launch_count`.

**This is a reasoned refusal, not an omission.** The pin's `why` states it: "**The divergence is NOT stored as a third number: a stored difference can disagree with the two values it is derived from, and this package has paid for that class of mistake more than once.**" The benign fixture's `case` agrees — "A run that closes with both counts recorded **and a divergence**, which must be accepted rather than refused."

**But the chapter says otherwise, and that is a defect.** `07` §6 line 113 reads: "actual is compared against it at run close … **by a conjunct on the run's `* → accepted` edge that records the divergence** (F6C-04)." No conjunct compares, and nothing records a divergence. `02` line 188 repeats "checked against actual at run close". Raised as **F6V-01**.

**On F6C-14 specifically.** Its own stated consequence — "reopen condition 4 names an instrument that does not exist, so the condition cannot fire" — is discharged: both counts are now required on every accepted run, so the instrument exists and a reader can compute the divergence. `02` line 188 is candid that "its measurement is **owed, not done**." I hold it at PARTIAL rather than CLOSED only because its contract is by reference to F6C-04's third clause, which is not fully met.

**Failing case.** `fixtures/negative/r18-run-closes-without-comparing-its-launches.json` removes conjunct 0; expected failure `'guard.launch.actual_compared_to_expected', 'nonempty_fields'`; the pin names all three field paths. **Benign pair** adds a `causal_episode_ref` demand.

---

### F6C-07 · class (a) · PARTIAL

**Clauses.** (1) Assign the inspection to `07` §5's authenticated custodian as an admitted `WorkOrder` with a latest responsible time. (2) Have Q-020 and Q-021 reference that work order rather than the act.

**Clause 1, met by reasoned substitution.** The inspection is now owned and registered, but as a founder packet rather than a custodian work order. `07` §99: "**The read is the founder's, because only he holds the account, and it is registered as Q-022**" (F6C-07). `05` §345: "**The inspection has an owner and a packet now, and both were missing: it is the founder's, because only he holds the account, and it is Q-022 in the open-questions register.**"

Q-022 exists in `registers/open-questions.json` — 22 entries, Q-022 is the last. Its `owner` is `founder`. Its `why_this_owner`: "Only the founder holds the provider account, so the read is an act on a credential nobody else has. DIRECTIVE §3: information only he holds. It is not a design decision and no agent can perform it." Its `latest_responsible_time`: "Before any CapacityPlan revision that raises the concurrency pin, and before F-2 is claimed as exercised. It is the first of the three capacity packets to answer, because Q-020 and Q-021 both defer to it by name."

The custodian route is not ignored — it is carried as option (b) with its consequence: "07 section 5's authenticated custodian covers billing-UI observations and no party hold[s]…". The finding's own text conceded that §5's custodian "does not extend to the entitlement read", so reassigning to the account holder is a substantive answer rather than an evasion. The defect as stated — "No register entry, open question, work record or capability owns the inspection" — is closed.

**Clause 2, UNMET.** Neither Q-020 nor Q-021 contains the string `Q-022`. Both still defer to the act:

- Q-020 `latest_responsible_time`: "… this decision sits behind a cheaper prerequisite — **reading the account entitlement (R-G04), which costs one inspection**."
- Q-021 `latest_responsible_time`: "… the cheaper prerequisite is **reading the account entitlement (R-G04)**."

The reference runs one way only: Q-022's `evidence` asserts "Q-020 and Q-021 each defer to this prerequisite by name in their latest_responsible_time", which is true of the *act* and not of the *packet*. A reader arriving at Q-020 still cannot follow a pointer to the thing that must happen first, which is the specific silent-drop shape the finding invoked — an escalation ladder ending assigned-and-silent.

---

### F6C-08 · class (a) · CLOSED by substitution

**Clauses.** (1) An exclusive factory command that resolves-or-creates on `(effect_class_id, counterparty_id, payload_digest)` and returns the existing allocation to a second caller. (2) A conjunct refusing a second `allocated` record for a live triple.

**Neither clause is met in the construct it names, and the defect is nonetheless closed.** I record both halves.

**What did not land.** `EffectIdentity.registration.exclusive_factory` is still `null`, and `permitted_commands` is still the generic `kernel.record.register / revise / transition`. Nine records declare a non-null exclusive factory — `DomainEvent, DurabilityReceipt, ExternalAttempt, GenerationSeal, HumanResponse, LifecycleStatus, Release, SendClaim, ValidityEpoch` — the same nine the finding counted, and `EffectIdentity` is not among them. There is no conjunct refusing a second `allocated` record, and there is no edge for one to sit on: `EffectIdentity`'s only transitions are `allocated → claimed` and `claimed → observed`, so `allocated` is an entry phase reached by registration rather than by a transition.

**What landed instead.** A structured, checked uniqueness declaration:

```json
"natural_key": ["effect_class_id", "counterparty_id", "payload_digest"],
"natural_key_rule": "RESOLVE-OR-CREATE on the triple, and it is the mechanism that makes
 the stated winner reachable … An allocation whose triple is already allocated RESOLVES to
 the existing record; it does not create a second one."
```

The finding's sharpest computed evidence was that "the strings `natural_key`, `unique` and `uniqueness` occur **nowhere** in `record-registry.json`." Four records now declare a natural key: `AdmissionRecord` `(origin, arrival_seq)`, `EffectIdentity` the triple, `ExhaustionDecision` `(obligation_ref, window)`, `FieldAuthority` `(field_path, epoch)`.

`validate_contracts.py` backs it with four checks, headed "F6D-11 / F6C-08: A BUSINESS IDENTITY THAT IS A NATURAL KEY SAYS SO, AND IS CHECKED": a rule without a key fails; a key without a rule fails ("'resolve-or-create' and 'conflict' are different systems and the rule is where the choice is recorded"); every named field must be a schema property **and** in `required` ("A NATURAL KEY OVER AN OPTIONAL FIELD IS NOT A KEY"); and the surrogate `key` must survive, so a natural key constrains rather than replaces. A fifth check pins `EffectIdentity`'s key to that exact triple.

**Why I accept the substitution.** The clause's operative demand was that the resolve-or-create choice be recorded in the contract rather than left to an implementer choosing between "a unique-index conflict, a read-then-join and two rows." That is now recorded, structured and checked. The conjunct half has no edge to attach to, so the declaration is the only place the constraint can live.

`05` §168 states it consistently: "the business triple `(effect_class, counterparty, payload_digest)` carries a uniqueness constraint, so two allocations of one triple are one allocation; `first_claimant_ref` is `required` rather than optional; and a conjunct on `allocated → claimed` asserts that a claim whose triple already carries a `first_claimant_ref` inherits that outcome rather than re-releasing." All three are true: `first_claimant_ref` is required, and `guard.effect.second_claimant_inherits` is on that edge demanding the triple plus a `first_claimant_ref` standing at `released` or `observed`.

**Residual, raised as F6V-02.** `kernel.record.register` says nothing about natural keys and contains no "resolve" language, while `EffectIdentity`'s rule says a register on an allocated triple resolves rather than creates.

**Failing case.** `fixtures/negative/r18-effect-identity-triple-unconstrained.json` removes both `natural_key` and `natural_key_rule`; expected failure `DOES NOT CONSTRAIN ITS BUSINESS TRIPLE`. **Benign pair** declares a natural key on `AcceptanceInterval` over `(submission_seq, acceptance_owner_ref)` — both required fields — and must pass, which is what shows the check reads a declaration rather than demanding one of every record. A second pair, `r18-second-claimant-re-releases`, flips the inheritance binding to optional.

---

### F6C-09 · class (a) · CLOSED

**Clauses.** (1) `no_progress_recipient_ref` conditionally required when `error_class == "no_progress"`. (2) A conjunct on the transition into the terminal phase.

**Clause 1.** `FailureRecord`'s schema payload carries:

```json
{"if": {"properties": {"error_class": {"const": "no_progress"}},
        "required": ["error_class"]},
 "then": {"required": ["no_progress_recipient_ref", "no_progress_terminal"]}}
```

Both fields are optional at base and demanded exactly when the class is `no_progress`. The finding's counterexample — a record with `error_class: "no_progress"` and no recipient passing schema validation — no longer holds.

**Clause 2.** `guard.failure.no_progress_names_recipient` requires `error_class` non-empty and `no_progress_terminal` present, and is called by all three edges into `blocked`: from `observed`, `investigating` and `retry_admitted`. The finding measured all eleven `FailureRecord` transitions calling no guard. `blocked` is the terminal phase among `observed · investigating · retry_admitted · blocked · resolved`, which answers the finding's separate point that "terminal" had no registered meaning.

**Failing case.** `fixtures/negative/r18-no-progress-with-no-named-recipient.json` removes the entire `allOf` from the schema payload. Expected failure: `A TERMINAL ERROR CLASS MAY BE RECORDED WITH NO RECIPIENT`. Note this fixture mutates the schema, not the predicate — it exercises the conditional rather than the guard, which is where the recipient demand actually lives.

**Benign pair** replaces the `then.required` list with one that adds `next_discriminator`, and the case is a record blocked for a reason that is not `no_progress`, which owes no recipient and must not be refused. The pair therefore discriminates the conditional's antecedent, which is the half that could have been over-applied.

---

### F6C-15 · class (a) · CLOSED

**Clauses.** (1) A field distinguishing which closure members are accepted outcomes. (2) A conjunct `subset(accepted_members_of_closure, reopened_acceptance_refs)`. (3) Keep `present` rather than `nonempty`.

**Clause 1.** `FieldAuthority.payload.accepted_closure_member_refs` is `Ref<AcceptanceInterval>[]`, required.

**Clause 2.** `guard.supersession.walks_derived_closure` now has six conjuncts, in order: `present(derived_closure_refs)`, `present(reopened_acceptance_refs)`, `eq(closure_walk_completed, true)`, `subset(reopened_acceptance_refs, derived_closure_refs)`, **`subset(accepted_closure_member_refs, reopened_acceptance_refs)`**, `subset(accepted_closure_member_refs, derived_closure_refs)`. The fifth is the containment the finding asked for, running the other way. The sixth keeps the accepted set inside the closure, which the finding did not ask for and which closes the obvious flanking move.

**Clause 3.** Conjuncts 1 and 2 are still `present`, not `nonempty_fields`. The finding insisted on this and gave the reason; it is honoured.

**I re-ran the finding's counterexample.** Take `derived_closure_refs = [x]` where x is an accepted outcome, `reopened_acceptance_refs = []`, `closure_walk_completed = true`, `accepted_closure_member_refs = [x]`. Conjunct 5 is `subset([x], [])`, which is false. **The guard now fails the adverse case as worded.** The paired benign row — empty closure, reopen nothing — still passes: every subset over empty sets holds, both `present` checks hold on empty arrays, and the `eq` holds.

**Residual worth naming, and it is inherent rather than a defect of this repair.** `accepted_closure_member_refs` is self-declared. An author who sets it to `[]` while the closure does contain an accepted outcome passes all six conjuncts. Nothing in the contract layer can resolve the refs and check the claim. The same limitation applies to `closure_walk_completed`, and the finding's contract asked for the field and the conjunct, which is what landed.

**Failing case.** `fixtures/negative/r18-supersession-leaves-an-accepted-outcome-standing.json` removes conjunct index 4 — precisely the new containment — and expects `'guard.supersession.walks_derived_closure', 'subset'`. The pin lists all six conjuncts with their pointer pairs, so the removal is caught. **Benign pair** adds a seventh conjunct and its case is the empty closure that must pass.

---

### F6C-17 · class (a) · CLOSED

**Clause.** A count or fraction with a window, in the form the sibling criteria already use, **or** the value marked UNKNOWN — founder parameter, no default with a packet id.

**First branch taken, with the second's provenance discipline added.**

`02` §9 foundation 2 now reads: "**More than two holders declared as founder exceptions standing at one time, or more than three capabilities whose class floor was narrowed for throughput within one quarter**, means the class rule is being routed around rather than applied. Both are readings of the holder register and the capability catalogue and are computable on any day." It then states why the old phrasing failed, in the finding's own terms: "that phrasing gave the condition a problem and no measurable worsening, so no reading of the register could settle whether it had fired, and a criterion nothing can settle is a preference wearing the form of an observation."

Foundation 6: "If **at most five distinct worker shapes account for 90% or more of admitted work orders over one month** — the same window and the same 90% the layer-1 removal criterion above already uses."

Both carry the label "**DESIGN PROPOSAL placeholder (F6C-17)**" with the founder named as owner, and foundation 2 explains the classing: "a tolerance for exceptions is a risk tolerance (DIRECTIVE §3), the same kind of parameter as MD-08's lane sizes and R-X25's threshold."

An amendment note at `02` line 216 records the change, its scope and its justification, and cites the sibling criteria the finding listed — ">90% of admitted actions over a fixed window, one month, two consecutive quarterly runs, five attributable trials chance-corrected."

**Deviation, named.** The second branch would have required a packet id. The numbers are labelled as proposals owned by the founder but carry no MD or Q id, and a value is proposed rather than left absent — so the block's own sentence "value absent, shape fixed" is not literally true of itself. Since the contract is disjunctive and the first branch is satisfied, this does not hold the verdict open.

**Residual, raised as F6V-03.** The layer-4 removal criterion that foundation 6 inherits from is still unquantified in two places, and the repair says so about itself.

---

## 3. New findings

### F6V-01 · class (a) · `07` §6 states that a conjunct records the divergence; the pin states that it deliberately does not

**Passage.** `07-integrations-capacity.md` §6, line 113: "actual is compared against it at run close against **`WorkflowRun.actual_native_launch_count`**, **by a conjunct on the run's `* → accepted` edge that records the divergence** (F6C-04)." `02-architecture-selection.md` line 188 repeats "checked against actual at run close."

**Counterexample, computed.** `guard.launch.actual_compared_to_expected` contains two conjuncts: `nonempty_fields` over three pointers, and `related_phases` on `workflow_ref`. No comparison operator appears in it. No payload field name in the entire registry matches "diverg". Only one of 2,397 predicates names `actual_native_launch_count`, and it is this guard. `pinned-conjuncts.json` states the opposite of the chapter, and gives a reason: "**The divergence is NOT stored as a third number: a stored difference can disagree with the two values it is derived from, and this package has paid for that class of mistake more than once.**"

**Why it matters.** The pin's reasoning is sound and the design decision is defensible. The defect is that two artifacts in the package describe one conjunct and disagree about what it does. A reader of `07` §6 is told the divergence is recorded and would not go looking. This is the same class as F6A-07 — a declared authority and an enforced mechanism disagreeing — committed in the repair that closed F6A-07.

**Required contract.** Amend `07` §6 to say that both counts are demanded at run close and the divergence is **readable from the record rather than stored**, carrying the pin's reason; or add the comparison conjunct and the divergence field the chapter currently promises. `02` line 188's "checked against actual" moves with it.

---

### F6V-02 · class (b) · The command that creates records says nothing about the natural key that governs one

**Passage.** `record-registry.json`, `/EffectIdentity/identity/natural_key_rule`: "**RESOLVE-OR-CREATE on the triple** … An allocation whose triple is already allocated RESOLVES to the existing record; it does not create a second one." `/EffectIdentity/registration`: `exclusive_factory: null`, `permitted_commands: ["kernel.record.register", "kernel.record.revise", "kernel.record.transition"]`.

**Counterexample, computed.** `command-registry.json`'s `kernel.record.register` entry contains neither the string `natural_key` nor `resolve`. It declares a payload of `RegistrationCandidate`, `source_refs` and `responsibility_assignment_ref`, and a `target_types` list that includes `EffectIdentity` alongside every other record. So the command an implementer would call to create an `EffectIdentity` is specified identically to the one that creates a `Campaign`, and the resolve-or-create behaviour lives only in the record's identity block.

**Why it is (b) and not worse.** The constraint is declared, structured and checked, so the design choice is recorded and an implementer who reads the registry finds it. What is unverified is that the create path honours it: the register command's contract does not mention the obligation, and F6C-08's finding observed that the registry has an `exclusive_factory` construct precisely for binding a record to the one command that may make it.

**Required contract.** Either set `EffectIdentity.registration.exclusive_factory` to a command that performs resolve-or-create, or state in `kernel.record.register`'s contract that a registration against a record declaring `identity.natural_key` resolves to the existing head rather than creating a second — and add a check that every record with a natural key names a create path that honours it.

---

### F6V-03 · class (a) · One observable, two thresholds: the reopen condition is quantified and the removal criterion it inherits from is not

**Passage.** `02-architecture-selection.md` §9 foundation 6: "at most **five** distinct worker shapes account for **90% or more** of admitted work orders over **one month**." `02` §8 row: "Removed when **the distinct profile count converges to a small stable set over a month**." `05-work-agents-skills.md` §124: "It is removed when **the distinct worker-profile count converges to a small stable set over a month**."

**Counterexample.** Both statements turn on the same probe — count distinct worker profiles for one month — and only one carries a threshold. The repair notes this about itself at `02` line 235: "The phrase they replace, *'a small stable set'*, is inherited from the layer-4 removal criterion where it is equally unquantified — **and that one is load-bearing, because it is the pre-declared control against this design's own thesis.**"

**Why it matters more than the condition that was fixed.** `05` §124 calls the profile-convergence probe "a **pre-declared negative control against this design's own thesis**." An unquantified control against one's own thesis is the one most likely to be read charitably by the party it judges — the repair's own words. An implementer running the probe now has a quantified reopen trigger and an unquantified removal trigger for the same reading.

**Required contract.** Carry foundation 6's five-shapes-at-90%-over-one-month into the layer-4 removal criterion at `02` §8 and `05` §124, with the same DESIGN PROPOSAL placeholder label and owner; or mark the removal criterion UNKNOWN — founder parameter with a packet id and state that the reopen condition's numbers do not govern it.

---

### F6V-04 · class (b) · The encounter strata that F6A-03's disposition rests on are a DESIGN PROPOSAL

**Passage.** `04-human-operation.md` §107 is labelled **DESIGN PROPOSAL** and is where the four encounter kinds, the alternation "ordinary and adverse/abandoned/underserved cases", the recorded reproducible random seed within strata and the empty-strata rule are declared. It closes "**UNKNOWN:** This is a proposed schedule to test, not a proven human-learning dose." `04` §117, a SPECIFICATION paragraph, adopts them: "**All four encounter kinds are adopted.**"

**Counterexample.** F6A-03's disposition turns on the sample riding "the adverse stratum of the original-customer-material encounter, **which already alternates ordinary with adverse, abandoned and underserved cases**", and `05` §192 cites the stratum's sampling rule — seed, write-authority exclusion, empty-strata recording — in support. Every one of those properties is stated only in the DESIGN PROPOSAL paragraph. §117 adopts the four *kinds*; it does not restate the strata, the alternation or the sampling rule.

**Why it is (b).** The mechanism is documented and the adoption is explicit, so this is not a missing decision. What is unverified is whether the properties the disposition leans on are specified or proposed. If §107's schedule is later revised as a proposal may be, the argument that `refusal-sample` is not a third delta loses the stratum it rides.

**Required contract.** Restate in `04` §117, as SPECIFICATION, the two properties F6A-03's disposition depends on — that the customer-material encounter carries an adverse/abandoned/underserved stratum, and that selection within strata uses the recorded seed outside the producing path — or have §192 cite §117 rather than the proposal.

---

## 4. Not checked

**Instructed exclusions, honoured in full.** I did not open any `.worktrees/` or `.claude/worktrees/` directory, `docs/08-agents_work/**`, `docs/vision-system/state.json`, `history.jsonl`, `planning/PLANNING-REPORT.md`, `planning/site/**`, `planning/F2/06-repair-names-contract.md`, `planning/reviews/F2-06-findings-index.json`, `planning/reviews/F2-06-recheck-01.md`, or `.claude/memory/**`. I did not open `registers/review-findings.json` at all, which is stricter than the instruction, which barred only three of its fields — I had no need of the rest and reading the file to avoid three fields is a risk with no benefit.

`state.json` and `history.jsonl` are the two files that changed under me between `38a3421` and `de14a70`. I detected that through `git diff --name-only`, which reports paths and not contents.

**Not run, by instruction.** `validate_contracts.py`, `tools/run_negative_fixtures.py`, `tools/run_positive_fixtures.py`. **Consequence, stated plainly: I did not observe any control fail.** Every "the control can fail" judgment above is read from three sources — the guard body, the pin entry that demands each conjunct by op and field path, and the negative fixture's patch and `expect_failure_contains`. Where a fixture's expected failure text is a validator message rather than a pin tuple, I located that message in `validate_contracts.py` and read the check that emits it. A mutation could still fail for a reason other than the one intended, and only a run would settle that.

**Not verified.** The negative and positive suites as wholes. I confirmed declared-versus-present in both directions and read eleven pairs in full; the other forty-odd negative fixtures I did not open. The manifest's derived claim that every registered guard now has a paired fixture rests on a `comm -12` command I did not execute.

**Out of scope and noted once.** Four records the F6B-02 finding listed in its counterexample but not in its contract still carry no `constraint_set_ref`: `HandoffAcceptance`, `WorkMessage`, `AttemptReport`, `ParticipationEncounter`. `guard.obligation.production_mode_named` covers two of six edges into `recognized`; I established this is not a bypass and did not pursue it. The eight findings in review D and the ten findings in A, B and C outside my list were not examined; several — F6D-11, F6D-02, F6D-03, F6D-06, F6D-07, F6C-02, F6C-16, F6B-01, F6B-05, F6A-06, F6A-08 — appear in pins and fixtures I read in passing, and nothing I saw about them should be read as a verdict.

**Return channel.** Not truncated. This report is my final message in full.

---

## 5. Standing caveat

No runtime exists. Every "CLOSED" above is **specified behaviour checked offline**, by reading the contract files and querying them directly at a frozen commit. Nothing here establishes runtime conformance, deployment readiness, actual fulfilment, or the business value of the intended system. A guard that a pin demands and a fixture mutates is a guard that a validator *would* catch a change to; it is not a guard that has ever refused anything, because nothing has ever run.

**Independence, in my own words.** I authored nothing in this package and read no producer's account of their own work — no session file, no self-assessment, no findings index, no prior recheck, and none of the resolution fields of the findings register. My evidence is the subject: chapter passages, registry entries, schema definitions, predicate bodies, pin entries, fixture files and the validator's source. Where the finding gave a count, I recomputed it rather than accepting it, and in one case — F6C-08's claim that `natural_key` occurs nowhere — my first query reproduced the finding's result and my second contradicted it, because I had read the wrong level of the identity block. The corrected reading is what I report.

But I share one model family with the authors of both the findings and the repairs. My independence is **procedural, not statistical**: separate context, no access to their reasoning, and recomputation instead of trust. It is not independence of error. If the repair authors and I are wrong in the same direction about what a conjunct guarantees, or about whether a declared natural key does the work an exclusive factory would, nothing in this recheck detects it. Three of my five PARTIAL verdicts turn on a distinction a differently-trained reader might draw elsewhere: whether "for the checker that produced the verdict" is a clause or a qualifier, whether "comparing them" is satisfied by demanding both numbers, and whether a register packet is a work order. I have named each of those readings rather than assumed mine.

The protocol's own words apply to this document: a review that calls itself independent without saying this is void.