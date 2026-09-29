> Archival provenance — 2026-09-14: Narrow independent recheck of the Step 6 repairs (six (d)s, detachment headline, set-equality guards), the terminal pin-machinery repair (RC5-01..03) and the `hand_written_controls` verdict block, preserved verbatim from the reviewer engine's report file (`scratchpad/f2-06-recheck-01/REPORT.md`, 671 lines), run on a frozen `git archive` of subject `0ea10c1`. The reviewer authored nothing in the subject and was barred from the producers' self-assessments, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, the selection record and the register `status` fields. One model family; procedural independence only. Nothing below has been edited by the orchestrator.
>
> **Disposition this recheck supports:** the six Step 6 (d)s — F6A-01, F6A-06, F6B-05, F6D-06, F6D-07, F6D-11 — **CLOSED at specification level**; F6D-01/F6D-04 (detachment, edge deletion) and F6D-02/F6D-03 (set equality) **CLOSED**; RC5-01, RC5-02, RC5-03 and the verdict block **CLOSED**; the terminal control's review tier **OPEN** as F6R-02; F6A-10, F6D-09, F6D-12 found **OPEN with no repair anywhere**; four new findings F6R-01..04 (none blocking). Its answer to the question the disposition needs (§15): no (d) among the six remains open, none is enforced by anything that runs, and W1–W15 were not re-swept for (d)s outside the six.
>
> **One inconsistency inside the archive, noted rather than repaired:** §4 says the key-deletion probe `m-rc5-verdict-key` is "RESULT PENDING, recorded in §7 below", and §7 does not record it. The full-validator copy of that probe timed out (exit 124 at 2,454 s, in the reviewer's scratch `mut/m-rc5-verdict-key.res`). The reviewer re-ran the probe in fixture mode: its transcript at 07:17:12Z records `EXIT=1` with `'missing': ['admissible_ancestors']`, and that is the result §14 and the reviewer's return message carry. The orchestrator verified the transcript entry; the result stands on that evidence.

# F2-06-recheck-01 — narrow recheck of the Step 6 repairs and the terminal pin-machinery repair

## Provenance

- **Subject:** commit `0ea10c1` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`,
  read from a frozen archive produced by `git archive 0ea10c1 docs/vision-system`. Every measurement
  below was taken against that archive or a scratch copy of it. Nothing in the working tree was read
  or written.
- **Authorship:** I authored none of the subject. I am the same model family as every author and every
  prior reviewer of this lineage. **Independence here is procedural only** — it is not a second model
  family and does not discharge the `irreversible`-tier requirement of 2-of-3 judges across >= 2
  distinct model families.
- **Read for findings text and required contracts:** `planning/reviews/F2-06-A..D-*.md`,
  `planning/reviews/F2-06-findings-index.json`, `planning/reviews/G-02-recheck-05.md`.
- **Not read, by the brief:** `docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`,
  `PLANNING-REPORT.md`, `planning/F2/05-selection-record.*`, and the `status` fields of
  `registers/review-findings.json`. I read `id` and `required_contract` from that register (needed to
  reproduce the RC5-02 coverage rule's own denominator) and no `status` field.
- **Method:** every disposition below rests on a mutation I wrote and ran myself against a scratch copy,
  or on a direct read of the contract file named. Where a disposition rests on reading alone I say so.

## 1. The six (d)s from Step 6

### F6A-01 (W1) — the middle consequence band's terminus

**Required contract (quoted).** *"Either (i) name the default recipient for that band — `04`'s
`AuthorityMatrix`, as the high band already uses, or `03`'s ordered custody resolver, which already has
a terminal `maintenance_custodian` tier — or (ii) state an admission criterion for a new holder that
does not require membership in a set frozen on 2026-09-13, and say which party applies it."*

**Where the repair lives.** Both limbs are delivered, not one.
- Limb (i): `05-work-agents-skills.md` §2, the SPECIFICATION paragraph, now reads *"where that duty
  class has no admitted standing holder the escalation goes to the ordered custody resolver of
  `03-company-capabilities.md`, whose last tier is the designated maintenance/discovery custodian"*,
  with a DESIGN PROPOSAL paragraph beneath it naming supplier insolvency as the case.
- Limb (ii): `05` §12 adds a five-condition admission path for a holder of a duty class no frozen
  fixture exercises, explicitly *"does not require membership in a set frozen on 2026-09-13"*.

**Walking the supplier-insolvency case.** Reached set {C2 external contact, C3 economic} -> middle band
-> escalates on a timer to the standing holder for that duty class -> **none admitted** -> `03`'s
ordered custody resolver: promise sponsor, else service mandate, else designated maintenance/discovery
custodian. `03` §73 carries that resolver in those words. The terminal tier has no further branch, so
the recipient exists unconditionally. The resulting `ResponsibilityAssignment` records
`custody_basis = maintenance_custodian` — and that value is real: `custody_basis` is a required payload
field with the closed enum `{promise_sponsor, service_mandate, maintenance_custodian,
provisional_overlap_resolution}` in both `record-registry.json` and `records.schema.json`. Custody is
ownership, not authority, so a custodian needing authority it lacks routes a `DecisionPacket` to `04`'s
`AuthorityMatrix`. Deadline behaviour reuses `03`'s existing `alternate_assignment_ref` / `deadlines` /
`expires_at`; if custody is still unaccepted after the alternate expires, admission in that duty class
stops and the escalation is refused with a named failed predicate.

**Is anything still silent?** No step of that walk terminates at a party that does not exist, and the
one enum value the walk writes is declared and closed. Two things are worth stating rather than leaving
implied: the holder-growth path of §12 is prose plus one already-required field
(`StandingHolder.exercising_fixture_id`), and **no guard or record check enforces the five conditions**;
and F6A-01 is not cited by any pin, pinned transition or `unpinnable` row (see §5 below).

**Disposition: CLOSED at specification level.** Prose-carried; no executable control.

### F6A-06 (W15) — the declared floor

**Required contract (quoted).** *"Either (i) a `declared_floor` field holding a C0–C5 value on every row
of `capabilities.json`, with a stated behaviour when absent; or (ii) the mapping table from
`consequence_classes` to C0–C5, with a named writer and its C5 protected-change registration. Either
way, the floor must be reachable from the capability contract the derivation names."*

**Where the repair lives.** Both, again. `contracts/class-mapping-table.json` is new: 53 mapped terms,
each `{class, reason}`, six classes C0–C5, `writer: "S1-C01, through a ProtectedChange whose
protected_subject_kind is class_mapping_table"`. `capabilities.json` gains `declared_floor` and
`declared_floor_source` on all 46 capabilities. The checks are `validate_contracts.py` lines 1611–1665.

| mutation | exit | message |
|---|---|---|
| remove `financial` from `#/mappings` | **1** (30 s) | `A CAPABILITY DECLARES A CONSEQUENCE TERM THE MAPPING TABLE DOES NOT MAP ... {'declared, unmapped': ['financial'], 'mapped, undeclared': []}` |
| CAP-13 `declared_floor` C3 -> C1 | **1** (69 s) | `A CAPABILITY'S DECLARED FLOOR IS NOT WHAT ITS OWN TERMS MAP TO ... 'CAP-13', {'declared': 'C1', 'from the table': 'C3', 'terms': ['internal-artifact','public-claims','disclosure']}` |

`ConsequenceDerivation.declared_floor_ref` resolves: it is typed `Ref<ConsequenceClassDefinition>` and
that record's `class_id` enum is asserted equal to the same six, so floor and target are drawn from one
vocabulary. Both facts are checked, not merely true.

**Disposition: CLOSED.** Both mutations refused, each naming the finding.

### F6B-05 (W12) — the C3 acceptance-sampling rule

**Required contract (quoted).** *"either a sampling rule at C3 equivalent to the one §6.3 applies at C2,
or an explicit statement that C3 acceptance is unsampleable and the resulting per-week count"*, with the
"full-time reviewer" failure condition named.

**Where the repair lives.** `05` §2, three new paragraphs, plus `04-human-operation.md` §3 and `05` §13.
The answer separates two acts: **release authorisation is unsampleable by construction** (*"sampling a
release means releasing the unsampled ones with no approver, which is not a lighter version of the rule
but its absence"*), and **outcome acceptance is sampled** by `04`'s existing seeded within-strata rule,
adverse stratum exhaustive, ordinary stratum drawn to fill the declared batch minutes. DIRECTIVE §8.18's
failure condition is named in the chapter's own words — *"the founder becomes a full-time reviewer"* —
and given a declared occurrence test: the unsampleable half exceeding declared batch minutes for two
consecutive participation cycles, with the response being admission narrowing computed by R-D09's
predicate. The per-week count is registered as an **owed measurement** in `05` §13 item (2) with a named
instrument (a query over `AdmissionRecord` and `AcceptanceInterval`), baseline, unit, repetition,
stopping rule and owner (C02). `04` §3 was amended so this sets no cadence, encounter or attention row
there.

**Is it prose only?** **Prose only.** No record field, guard or predicate carries the batch-minutes
comparison, the narrowing trigger or the count: `batch_minutes`, `per_week` and `founder_acceptance_load`
occur zero times in `predicate-registry.json`; `05` §13 lists the count among four measurements that are
*"unrun and cheap"*. The chapter says so itself.

**Disposition: CLOSED at specification level.** Both limbs answered in prose; the measurement is owed
and named as owed, which is what the finding asked for. Nothing executes it.

### F6D-06 (W6) — `declared_grants`

**Required contract (quoted).** *"`declared_grants: Ref<Grant>[]`, in `required` on both records; a
grant-policy record or an explicit statement that the `Grant` registry *is* the policy; and a predicate
on the admission edge that resolves each declared grant and refuses the step when one does not resolve."*

**Where the repair lives.** `records.schema.json`: on both `StepExecution` and `WorkflowDefinition`,
`declared_grants` is now an array of typed `{record_id, record_type: ["Grant"], revision}` objects and
is in `required`. `record-registry.json` types it `Ref<Grant>[]` with `required: true`.
`guard.grant.declared_resolves_to_live_grant` is new, demands `nonempty_fields` on the list plus
`related_phases` binding every ref to state `active` with `optional: false`, and is attached to
`edge.StepExecution.dispatched.running.v1` and `edge.WorkflowDefinition.draft.admitted.v1`. The
"is the Grant registry the policy" question is answered explicitly in the pin's `why`: *"every ref in it
currently stands at `active` in the Grant registry — which IS the grant policy, because a second
grant-policy record would be a second authority over one question."*

| mutation | exit | message |
|---|---|---|
| drop `declared_grants` from `required` on both records | **1** (66 s) | `REGISTRY AND SCHEMA DISAGREE ABOUT WHICH PAYLOAD FIELDS ARE REQUIRED ... 'StepExecution', {'required by registry only': ['declared_grants']}` |
| detach the guard from both its edges | **1** (69 s) | `GUARD DETACHED FROM ITS EDGE ... {'guard': 'guard.grant.declared_resolves_to_live_grant', 'edge': 'edge.StepExecution.dispatched.running.v1', 'calls_found': 0, 'demanded': 0, 'note': 'no call at all'}` |

**On "an unresolvable grant ref".** There is no instance evaluator in this package — no interpreter of
predicate bodies against records exists anywhere in the tree, and the verdict's own `limits` string says
so. The specification-level equivalent is the guard's `optional: false` binding, and the committed
adverse fixture `r18-declared-grant-resolves-to-nothing` flips exactly that bit. A ref that resolves to
nothing is refused *by the specification*; nothing runs.

**Disposition: CLOSED at specification level.**

### F6D-07 (W10) — control objects

**Required contract (quoted).** *"A record per named control object with a `ProtectedChange`-gated
lifecycle, or an explicit `protected_subject_kind` enum on `ProtectedChange` plus a predicate on each
control object's edges requiring a current authorized `ProtectedChange` naming it. Adverse fixture: a
floor changed without one."*

**Where the repair lives.** The second branch, split across three places and deliberately so.
`ProtectedChange.protected_subject_kind` is a closed enum of exactly six, asserted by count.
`guard.protected.control_object_change_authorized` carries the **phase** half (`authorized`, `staged`,
`activated`, `verified` — `proposed` and `reviewed` excluded) and is attached to **nine** edges across
`ConfigurationVersion`, `ConsequenceClassDefinition`, `FieldAuthority` and `StandingHolder`. The
**presence** half lives in the schema, because the guard must stay `optional: true` for the benign
`ConfigurationVersion` case: `protected_change_ref` is in `required` on the three control-object
records, and `ConfigurationVersion` carries `dependentRequired: {control_object_kind:
["protected_change_ref"]}`.

| mutation | exit | message |
|---|---|---|
| drop `protected_change_ref` from `ConsequenceClassDefinition`'s schema `required` | **1** (66 s) | `REGISTRY AND SCHEMA DISAGREE ABOUT WHICH PAYLOAD FIELDS ARE REQUIRED ... {'required by registry only': ['protected_change_ref']}` |
| drop it from schema **and** registry (the committed fixture's own patch, applied by hand) | **1** (294 s) | `criterion content drifts from its derivation` — an **earlier** control, because a hand edit to `required_fields` drifts the derived criteria. The committed fixture reaches the F6D-07 headline instead because it declares `regenerate_from_derivation` and `rederive_from_registries`; my hand variant does not. Refused either way, by a different control. |
| delete `dependentRequired` on `ConfigurationVersion` | **1** (295 s) | `THE CONDITIONAL THAT MAKES A DECLARED CONTROL OBJECT NEED AN AUTHORIZATION IS GONE ...` |
| detach the guard from `edge.ConsequenceClassDefinition.proposed.admitted.v1` | **1** (295 s) | `GUARD DETACHED FROM ITS EDGE ... 'guard.protected.control_object_change_authorized'` |

**What the repair does not do.** Three of the six named control objects — the class mapping table, the
derivation function, the external policy object — are still not records. They are reached through
`ConfigurationVersion.control_object_kind`, whose enum is exactly those three and is asserted. That is a
different answer from the finding's first branch and it is a coherent one, but a reader should not read
"six control objects are now bound" as "six records now exist".

**Disposition: CLOSED at specification level.**

### F6D-11 (W7) — `EffectIdentity`

**Required contract (quoted).** *"A uniqueness constraint on the triple, `first_claimant_ref` in
`required`, and a conjunct on `allocated -> claimed` asserting that a claim whose triple already has a
`first_claimant_ref` inherits rather than re-releases."*

**Where the repair lives.** All three. `record-registry.json` gives `EffectIdentity.identity` a
`natural_key` of `["effect_class_id","counterparty_id","payload_digest"]` **and** a `natural_key_rule`
that names the choice: *"RESOLVE-OR-CREATE on the triple ... An allocation whose triple is already
allocated RESOLVES to the existing record; it does not create a second one."* `first_claimant_ref` is in
the schema's `required`. `guard.effect.second_claimant_inherits` demands all four fields non-empty and
binds `first_claimant_ref` to `released` or `observed` with `optional: false`, attached to
`edge.EffectIdentity.allocated.claimed.v1`. The validator adds a general rule over all 188 records: a
natural key must name payload properties that are all `required`, must carry a rule, and must not
replace the surrogate key.

| mutation | exit | message |
|---|---|---|
| remove `natural_key` only | **1** (69 s) | `a record states a natural-key RULE and declares no natural key, which is an identity constraint that reads as one and constrains nothing` |
| remove `natural_key` **and** `natural_key_rule` | **1** (295 s) | `` `EffectIdentity` DOES NOT CONSTRAIN ITS BUSINESS TRIPLE ...`` |
| detach the guard from its edge | **1** (294 s) | `GUARD DETACHED FROM ITS EDGE ... 'guard.effect.second_claimant_inherits'` |

**On "two allocations with one triple".** Same limit as F6D-06: there are no record instances and no
evaluator, so the constraint is a **declaration that is checked for well-formedness**, not a constraint
that is enforced against data. What changed is that the choice among "unique-index conflict,
read-then-join, two rows" is now recorded (resolve-or-create) instead of left to the implementer, which
is what the (d) asked for.

**Disposition: CLOSED at specification level.**

## 2. The detachment headline (F6D-01 / F6D-04)

The repair is `pinned-conjuncts.json#/pinned_attachments`: **39 hand-written `(guard, edges, findings,
why)` rows**, floor `PIN_ATTACHMENT_FLOOR = 39` as a literal in the checker, plus a completeness rule
that `{guard.* in the registry} == {guards with an attachment row}` — so deleting the guard instead of
the call is refused too. The call must be **demanded**: the same `polarised_nodes` walk decides it, so a
call in a value slot, under `not`, under a disjunction or under a quantifier does not count.
`pinned_transitions` went from 6 to 50 rows, floor 50.

**Five detachments I chose, each its own run, each the complete removal of the call from the edge body:**

| guard | edge | exit | named in message |
|---|---|---|---|
| `guard.criteria.author_not_in_producing_path` | `edge.AcceptanceInterval.declared_done.in_acceptance.v1` | **1** | guard + edge |
| `guard.skill.declared_grant_inert` | `edge.SkillVersion.trial.admitted.v1` | **1** | guard + edge |
| `guard.class.reached_set_gates_all` | `edge.ConsequenceDerivation.computed.recomputed_at_release.v1` | **1** | guard + edge |
| `guard.launcher.stripping_positive_control` | `edge.SkillVersion.trial.admitted.v1` | **1** | guard + edge |
| `guard.custody.admitter_excluded` | `edge.AdmissionRecord.opened.admitted.v1` | **1** | guard + edge |

Plus the three detachments run under §1 above (`grant`, `protected`, `effect`) — **eight of eight
caught**, against 30 of 30 undetected when the finding was written. Every message is
`GUARD DETACHED FROM ITS EDGE`, carries `{'guard': ..., 'edge': ..., 'calls_found': 0, 'demanded': 0}`
and quotes that row's `why`.

**Two load-bearing edge deletions:**

| deletion | exit | message |
|---|---|---|
| `AcceptanceInterval: in_acceptance -> rejected` | **1** | `PINNED TRANSITION MISSING: a route a finding required no longer exists`, `AcceptanceInterval:in_acceptance->rejected`, with the row's reason |
| `StandingHolder: staffed -> suspended` | **1** | `PINNED TRANSITION MISSING ...`, `StandingHolder:staffed->suspended` |

**Disposition: CLOSED.** Detachment and edge deletion are now distinct, named refusals.

## 3. The two set-equality guards (F6D-02 / F6D-03)

Both guards now carry `unique` on **both** arrays, so review D's exact defeating inputs no longer
satisfy them: `declared=["/a","/a"]` fails `unique(declared_read_set)`, and
`recomputed=[C3,C3]` fails `unique(recomputed_class_ids)`. The inputs defeat the *old* body, and the old
body cannot be restored quietly:

| mutation | exit | message |
|---|---|---|
| delete both `unique` conjuncts from `guard.readset.delivered_equals_declared` | **1** (33 s) | `PINNED CONJUNCT MISSING ... 'guard.readset.delivered_equals_declared', 'unique'`, whose reason quotes the counterexample verbatim: *"declared=["/artifact","/artifact"] against delivered=["/artifact","/producer_rationale"] satisfies both rows above"* |
| delete both `unique` conjuncts from `guard.derivation.recompute_matches` | **1** (33 s) | `PINNED CONJUNCT MISSING ... 'unique'`, reason: *"reached=[C2,C3] against recomputed=[C3,C3] satisfies the containment and the count equality above, so the record reaches `matched`"* |

**Disposition: CLOSED at specification level.** The bodies now demand set semantics and the demand is
pinned. As everywhere else here, no evaluator runs the guard against data.

## 4. RC5-01 .. RC5-03 and the verdict block

### RC5-01 — the allowlist is now a closed literal in the checker

`ADMISSIBLE_LITERAL` is a three-entry dict in `validate_contracts.py`; `ADMISSIBLE = ADMISSIBLE_LITERAL`
and the comment states *"the walker reads THIS. `PINNED["admissible_ancestors"]` is never consulted for
a verdict."* The JSON block is documentation compared against it in **both** directions.

**Replay of RC5-01's exact hunk** (`m-rc5-01-hunk`): register `every_linked_obligation` in
`primitive-registry.json` with `argument_types.predicate: "boolean"` and
`argument_positions.predicate: "demanded"`; add the matching row to
`pinned-conjuncts.json#/admissible_ancestors` with a plausible `why`; recompute and re-pin
`argument_positions_digest`. First run **exit 1 at 25 s** on `coverage inventory differs from its
derivation` — an earlier control, because adding a primitive drifts the derived inventory. I re-derived
`coverage-inventory.json` and the `PredicateId` enum the way the fixture runner does, and re-ran:

> **exit 1, 26 s** — `THE ADMISSIBLE-ANCESTOR TABLE IS NOT THE LITERAL IN validate_contracts.py ...
> {'literal in validate_contracts.py': {'all': 'always', 'not': 'row_polarity', 'any': 'row_disjoined'},
> 'declared in pinned-conjuncts.json': {..., 'every_linked_obligation': 'always'},
> 'widened by': ['every_linked_obligation'], 'narrowed by': []}`

The message names the literal and names the file the widening must be made in.

**Disposition: CLOSED.** The p3a hunk that ran at exit 0 now exits 1, naming the literal.

### RC5-02 — the floors and the coverage denominator

Floors raised to the committed counts as literals: `PIN_FLOOR = 67` (was 25), `PIN_ROW_FLOOR = 148`
(was 44), `PIN_TRANSITION_FLOOR = 50` (was 32), `PIN_ATTACHMENT_FLOOR = 39` (new), `FINDING_SOURCE_FLOOR
= 106` (new). `FINDING_ID` is widened to every family a pin may cite, the corpus now includes the F2
reviews and the `G-02-recheck-0*` documents, and a new check above the floors names **which finding lost
its last pin**.

**Bulk pin deletion** (`m-rc5-02-bulk-pins`, 67 pins -> 30, i.e. more than half):

> **exit 1, 26 s** — `A PINNED FINDING LOST ITS LAST PIN: a finding declared in
> `pinned-conjuncts.json#/finding_sources` is cited by no pin, no pinned transition and no `unpinnable`
> row ... {'unanswered': ['AC-M1-05', ...]}`

Refused **by name**, and before any count — which is what the finding asked for.

### RC5-03 — the sibling key

`admissible_ancestors_not_admitted` is now read two ways: nothing may be in both tables, and every key
other than the literal `"anything else"` must be a registered primitive.

**Both-tables mutation** (`m-rc5-03-both-tables`): add `forall` to `#/admissible_ancestors` **and** to
`ADMISSIBLE_LITERAL` in the checker (so the RC5-01 comparison passes), leaving `forall` in the
not-admitted key.

> **exit 1, 26 s** — `AN OPERATOR IS BOTH ADMITTED AND NOT ADMITTED ... {'in both': ['forall'],
> 'admitted': ['all','any','forall','not']}`

**Disposition: CLOSED.** Even the expensive checker edit is refused by the sibling key.

### The `hand_written_controls` verdict block

Present, with a required key set of thirteen: `pins`, `require_rows`, `pinned_transitions`,
`pinned_attachments`, `finding_sources`, `unanswered_findings`, `out_of_reach_findings`,
`disjoined_rows`, `admissible_ancestors`, `argument_positions_digest`, `negative_fixtures`,
`positive_fixtures`, `demand_walk_census`. Every row must carry `count`, `file` and one of
`floor`/`ceiling`/`literal`, and a count outside its own bound fails.

**Key-deletion mutation** (`m-rc5-verdict-key`: remove the `admissible_ancestors` row from
`HAND_WRITTEN_CONTROLS` while leaving `HAND_WRITTEN_CONTROL_KEYS` intact) — RESULT PENDING, recorded in
§7 below. The check is `set(_controls) == HAND_WRITTEN_CONTROL_KEYS` with a `missing` list in the
message, immediately before the verdict is printed.

### The terminal control's review tier — stated plainly

RC5-01's whole argument is that widening the allowlist *"is an edit to validate_contracts.py, which is
the expensive act by construction"*, and its message tells the reader to *"expect the checker edit to be
reviewed as one."*

**Measured, from the repository root:**

```
node scripts/classify.mjs docs/vision-system/planning/specification/contracts/validate_contracts.py
  -> tier=trivial · enforcement=shadow · matched: docs/**
```

So the terminal control of this lineage sits at the **lowest** tier the repository has. `risk:lite`,
`risk:full` and `risk:irreversible` are not required of a change to it; the binding gate
(`qa-lead-pass.yml`) asks for a session file with `qa_verdict: PASS` and no tier. **"Reviewed as one" is
a review convention, not an enforced tier.**

**Does anything in the package say so?** Yes, once, and not where the argument is made:
`planning/HANDOFF-F2-agents-work-layer.md` line 141 — *"everything under `docs/**` is `trivial` and
skips the binding QA gate; CI still runs."* The RC5-01 comment block in `validate_contracts.py` does not
carry that qualification, and it is the block whose security argument depends on it.

## 5. A sample of six (a)/(b) findings across A–D

Checked by reading the named contract file at the frozen commit.

| finding | class | required contract | state at `0ea10c1` |
|---|---|---|---|
| **F6A-08 / F6D-10** — `budget` mandatory and declared by nothing | a | remove or back the claim | **repaired.** `05` §11 carries a dated supersession note deleting the sentence and restating the `CapacityState` half on the fields that exist |
| **F6C-02** — breach-or-perform record required, no record is it | a | a record for it | **repaired.** `ExhaustionDecision` exists, natural key `(obligation_ref, window)` |
| **F6C-16** — `11` states a rule about the 30 guards false of all 30 | a | correct the claim | **repaired.** `11` §135 carries a dated supersession recording `op: "call"` in 0 of 30 guard bodies and pairing at 14 of 30, with the sixteen unpaired named as owed |
| **F6B-01** — two of three manifest fields required by nothing | a | bind them | **repaired.** `guard.manifest.omission_and_class_declared` exists, is pinned, and is attached to `edge.ContextManifest.captured.admitted.v1` |
| **F6A-10** — `custody_tie_break_reason = admitter_excluded` outside a closed enum | a | *"Add `admitter_excluded` to both declarations of the enum, or drop the clause and cite the guard"* | **OPEN.** `05` §7 still instructs *"recording `custody_tie_break_reason = admitter_excluded`"*; the enum in `record-registry.json` and `records.schema.json` is still the same four values, `admitter_excluded` absent from both. Neither branch taken |
| **F6D-12** — `ExistenceJustification.reason_kind` is a free string | a | *"`reason_kind` as an enum of exactly the six, `reason_unit` as an enum of the six units, and a conjunct pairing them"* | **OPEN.** Both fields are still `$ref: values.schema.json#/$defs/string` |
| **F6D-09** — `PredicateId` is an enum zero record fields use | a | *"`failed_predicate_id: PredicateId`; `precondition_predicate_ids: PredicateId[]` ... and a conjunct"* | **OPEN.** `PredicateId` occurs 0 times in `records.schema.json`; both fields are still bounded strings |

Three of seven sampled (a)s are untouched. That is not by itself a defect of this round — nothing said
every (a) would be repaired — and the package's own instrument records it, which is the next item.

## 6. What the package says about what it did not repair

`finding_sources` declares 106 findings with the review that states each. All **54** Step 6 findings are
in it. 18 are cited by a pin or a pinned transition; the other 36, plus `G2-06`, are in `unanswered`,
budgeted by `UNANSWERED_CEILING = 37` — a ceiling, so the number can only fall without a checker edit.
That is an honest instrument and the bulk-deletion probe above shows it names what goes dark.

**One qualification, and it is a new finding (F6R-01 below).** The comment above the ceiling glosses the
37 as *"Step 6 findings whose repair landed as a check rather than as a conjunct."* That is true of
F6A-06 (hand-written checks at lines 1611–1665) and F6A-01 (prose). It is **not** true of F6A-10, F6D-09
and F6D-12, whose repair landed as nothing at all. The list conflates "answered outside the pin
machinery" with "not answered", and a reader taking the gloss at face value would count three repairs
that do not exist.

Separately: the RC5-02 coverage rule that demands every finding be pinned or excused iterates
`registers/review-findings.json`, and **only 2 of the 54 Step 6 findings are in that register**
(`F6X-01`, `F6X-02`). The rule therefore says nothing about the other 52. The `unanswered` ceiling is
what covers them, and it covers them only because `finding_sources` happens to declare all 54 — a
property no check asserts.

## 7. Supporting measurements on the unmodified subject

**Guard distinctness ratchet** (`tools/guard_distinctness.py .`) — **exit 0**:

```
edges 1346 · edge_predicates 1346 · edges_calling_own_criterion 1346 · edges_not_calling_own_criterion 0
distinct_effective_edge_skeletons 726 · largest_edge_skeleton_share 7 · sibling_guard_collisions 0
declared_but_unread_arguments {} · edge_guards_reaching_attested_result 1346
predicates_unreachable_from_any_guard 182
primitives_used_by_no_predicate ["acyclic","add","digest","forall","scope_covers"]
```

`forall` appearing in `primitives_used_by_no_predicate` is consistent with the RC lineage: it is the
registered operator the pin machinery refuses as an ancestor, and no body uses it.

**Fixture manifests, read directly.** Negative 95 declared, positive 56 declared, against the literals
`NEGATIVE_FIXTURE_FLOOR = 95` and `POSITIVE_FIXTURE_FLOOR = 56`. Negative families:
r1 2 · r2 1 · r3 1 · r4 1 · r5 2 · r6 3 · r7 2 · r8 1 · r9 5 · r10 4 · r11 5 · r12 1 · r13 3 · r14 2 ·
r15 3 · r16 17 · r17 3 · r18 36 · r19 3.

**Paired benign coverage for the ten adverse cases this round added** — all ten declare a
`paired_benign_fixture` and all ten files exist: `r18-declared-grant-resolves-to-nothing`,
`r18-control-object-changed-without-authorization`, `r18-control-object-change-on-a-proposal-nobody-decided`,
`r18-effect-identity-triple-unconstrained`, `r18-second-claimant-re-releases`,
`r18-guard-detached-from-its-edge`, `r18-load-bearing-edge-deleted`,
`r18-readset-equality-fooled-by-a-duplicate`, `r18-recompute-matches-having-lost-a-reached-class`,
`r18-capability-floor-has-no-source`.

**The five transitions F6D-04 named as a minimum are all pinned:** `ConsequenceDerivation:
recomputed_at_release -> parked_on_mismatch`, `AcceptanceInterval: in_acceptance -> rejected`,
`StandingHolder: staffed -> suspended`, `AdmissionRecord: opened -> refused`, `EffectIdentity: allocated
-> claimed`. `pinned_transitions` is 50 rows across 25 records, against 6 rows on two records when the
finding was written.

**`node scripts/vision-record-registry.mjs verify` — NOT RUN, and it cannot be run against the frozen
archive.** Its `ROOT` is `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')` and every
read is `path.join(ROOT, 'docs/vision-system/...')`. It takes a command, not a tree, so invoking it from
the repository root would verify the **working tree**, not the subject I froze. Skipped by the brief and
recorded here as skipped.

## 8. No evaluator exists, and every "CLOSED" above inherits that limit

There is no interpreter of predicate bodies against record instances anywhere in this package.
`polarised_nodes` is a structural AST walk; `subset`, `count` and `unique` have registered *semantics*
in `primitive-registry.json` and no implementation. The validator's own `limits` string says it:
*"Offline schema/ref/AST/source-inventory/registry checks plus paired negative and positive fixtures. No
production handler, source truth, crypto custody, native gateway, recovery, provider or business-effect
test executed; no runtime of any kind exists yet."*

So "two allocations with one triple -> refused" and "an unresolvable grant ref -> refused" are **not**
statements about behaviour. They are statements that the specification now *says* what happens, that the
saying is typed and required rather than prose, and that removing the saying fails a build. That is what
a (d) asks for — a missing decision is now taken — and it is less than enforcement. Every disposition
above is written as **CLOSED at specification level** for that reason.

## 9. New findings

### F6R-01 (medium) — `unanswered`'s gloss claims repairs that do not exist
**Class.** A control that is honest about its count and wrong about its meaning.
`validate_contracts.py`'s comment above `UNANSWERED_CEILING = 37` reads *"37 today, all F6A/F6B/F6C/F6D
and G2-06: Step 6 findings whose repair landed as a check rather than as a conjunct."* Measured: of the
37, **F6A-10, F6D-09 and F6D-12 have no repair anywhere** — not a pin, not a check, not a chapter
amendment. `custody_tie_break_reason` still lacks `admitter_excluded` while `05` §7 still instructs that
it be written; `ExistenceJustification.reason_kind` and `reason_unit` are still free strings;
`PredicateId` is still referenced by zero record fields. The ceiling correctly stops the list growing;
the sentence beside it tells a reader the list is a list of repairs delivered elsewhere.
**Required contract.** Split `unanswered` into two declared sets in `pinned-conjuncts.json` — answered
outside the pin machinery (with the file and the check that answers it) and not answered — each with its
own bound, or drop the causal clause from the comment and say only what the count is.

### F6R-02 (medium) — the terminal control sits at the repository's lowest review tier, and the block that argues from that fact does not name it
**Class.** A security argument resting on a review convention presented as a property of the system.
RC5-01's repair moves the allowlist into `ADMISSIBLE_LITERAL` in `validate_contracts.py` and argues the
move is a closure because editing the checker *"is the expensive act by construction"*, telling the
reader to *"expect the checker edit to be reviewed as one."* Measured: `node scripts/classify.mjs` tiers
that file `tier=trivial · enforcement=shadow`, matched by `docs/**`. No risk label is required and the
binding gate asks for a session file, not a tier. The package states the tier fact once, in
`planning/HANDOFF-F2-agents-work-layer.md` line 141, and not in the block that depends on it.
**Required contract.** One sentence in the RC5-01 comment block recording that the file is `trivial`
under `.claude/qa-tier-floor.yml` and that the expense is a review convention rather than an enforced
tier — or a tier-floor entry naming
`docs/vision-system/planning/specification/contracts/validate_contracts.py`.

### F6R-03 (low) — the coverage rule's register denominator holds 2 of 54 Step 6 findings
**Class.** A widened regex over a corpus that is not the set the rule iterates.
RC5-02 widened `FINDING_ID` to `F6[A-D]-\d{2}` and widened `FINDING_CORPUS` to include the F2-06
reviews. Both changes serve pin-citation resolution. The rule that *demands* a finding be pinned or
excused iterates `registers/review-findings.json`, which carries **2** of the 54 Step 6 findings
(`F6X-01`, `F6X-02`). The other 52 are reached only because `finding_sources` happens to declare all 54,
and no check asserts that it does.
**Required contract.** Assert that every Step 6 finding id appearing in the swept F2-06 review documents
is a key of `finding_sources`, so the `unanswered` ceiling's denominator cannot silently shrink; or
register the Step 6 findings.

### F6R-04 (low) — a hand mutation of a control-object `required` list is caught by the drift oracle, not by the rule written for it
**Class.** Ordering, not a hole. Removing `protected_change_ref` from
`ConsequenceClassDefinition`'s `required_fields` and schema `required` by hand exits 1 at *"criterion
content drifts from its derivation"* (line ~660), never reaching `A CONTROL OBJECT MAY CHANGE WITH NO
PROTECTED CHANGE NAMED` (line ~1729). The committed fixture reaches the intended message only because it
declares `regenerate_from_derivation` and `rederive_from_registries`. The mutation is refused either
way, so this is a message-quality finding, not a bypass. It is recorded because the file argues
elsewhere — RC4-01's and the oracle block's own ordering comments — that on a mutation tripping two
controls the reader should be told the concrete thing.
**Required contract.** None required. If acted on, note in the F6D-07 block that a hand edit surfaces as
drift and that the named message is reachable only after re-derivation.

## 10. Baseline on the unmodified subject

**Full run, fixtures included** — `python3 validate_contracts.py` at the frozen archive, **exit 0**,
**304,168 checks**, stderr empty. Wall clock 3 h 38 m at **27 % CPU**, which measures my own parallel
mutation runs competing for the machine and says nothing about the suite; a quiet run with the fixture
suite skipped took **22 s**.

| verdict field | value |
|---|---|
| status | passed |
| checks | 304,168 |
| records | 189 |
| values | 185 |
| commands | 105 |
| predicates | 2,397 |
| edges | 1,346 |
| source_work_edges | 373 |
| required_subjects | 46 |
| negative_fixtures_rejected / declared / floor | 95 / 95 / 95 |
| positive_fixtures_passed / declared / floor | 56 / 56 / 56 |

**`hand_written_controls`, all thirteen keys present:**

| control | count | bound | file |
|---|---|---|---|
| pins | 67 | floor 67 | `pinned-conjuncts.json#/pins` |
| require_rows | 148 | floor 148 | `#/pins/*/require` |
| pinned_transitions | 50 | floor 50 | `#/pinned_transitions` |
| pinned_attachments | 39 | floor 39 | `#/pinned_attachments` |
| finding_sources | 106 | floor 106 | `#/finding_sources` |
| unanswered_findings | 37 | ceiling 37 | `#/finding_sources` minus the pins |
| out_of_reach_findings | 13 | ceiling 13 | `registers/review-findings.json` |
| disjoined_rows | 4 | ceiling 4 | `#/pins/*/require/*/disjoined` |
| admissible_ancestors | 3 | literal `{all: always, any: row_disjoined, not: row_polarity}` | `validate_contracts.py#ADMISSIBLE_LITERAL` |
| argument_positions_digest | 57 | literal `2d9087044d096206eeda54f1c1d4c9843c325acfa273f2a3c46fed465ebeab8e` | `#/argument_positions_digest` |
| negative_fixtures | 95 | floor 95 | `fixtures/negative/MANIFEST.json` |
| positive_fixtures | 56 | floor 56 | `fixtures/positive/MANIFEST.json` |
| demand_walk_census | 11,986 | floor 8,000 | `validate_contracts.py#WALK_CENSUS` |

**Every floor sits exactly at its committed count** (67/67, 148/148, 50/50, 39/39, 106/106) and every
ceiling exactly at its count (37/37, 13/13, 4/4). That is the design — each is a ratchet, so the table
can only move by a checker edit — and it means there is **zero headroom anywhere**: any deletion from
any of these tables fails, and any addition to `unanswered`, `out_of_reach` or `disjoined_rows` fails.

**`conjunct_walk` census:** `predicate_positions` 5,131 · `value_positions` 268 · `slots_classified`
11,986 · `refused` 0 · `under_quantifier` 0 · `under_disjunction` 108 · `under_negation` 147 ·
`operators` a non-empty list of 39 names. All four census invariants the verdict asserts hold.

**`tools/run_negative_fixtures.py --self-test`** — **exit 0**. `{"check": "symlink guard covers
fixtures/negative (RC2-01)", "refused_symlinked": true, "accepted_real": true, "failures": []}`. The
symlinked case is refused with *"this runner would report on the link target while naming the tree in
front of it"*; the real case is accepted.

**`tools/guard_distinctness.py`** — exit 0, reported in §7.

## 11. Regressions

The baseline's own numbers are the aggregate answer: **95 of 95 negative fixtures rejected** and **56 of
56 positive fixtures passed**. `run_fixture` returns success only when the validator exited non-zero
**and** the fixture's own `expect_failure_contains` string is in the output, so 95 of 95 means every
fixture failed for **its own** stated reason; a fixture rejected by a different check is reported as
`wrong_reason`, and none was.

Per-fixture, run individually against the frozen archive:

| fixture | expected reason | result |
|---|---|---|
| r13-delivery-fails-in-flight-with-no-transition | `PINNED TRANSITION MISSING` | rejected |
| r13-derivation-weakened-then-regenerated | `PINNED CONJUNCT MISSING` | rejected |
| r13-requires-promises-what-the-body-does-not-demand | `RC-03: requires names a field path no conjunct demands` | rejected |
| r14-pinned-conjunct-disjoined-with-a-tautology | `PINNED CONJUNCT ONLY UNDER A DISJUNCTION` | rejected |
| r14-requires-names-a-related-phase-no-conjunct-binds | `RC-03: requires names a related record's phase ...` | rejected |
| r15-pinned-conjunct-buried-in-a-value-slot | `PINNED CONJUNCT IN A NON-PREDICATE POSITION` | rejected |
| r15-pinned-conjunct-inside-a-vacuous-forall | `PINNED CONJUNCT ONLY UNDER A QUANTIFIER` | rejected |
| r15-unregistered-operator-in-a-predicate-position | `a primitive declares no argument_positions` | rejected |
| r17-manifest-shrunk-below-floor | `THE FIXTURE SUITE HAS SHRUNK BELOW ITS FLOOR` | rejected |
| r17-registry-flips-forall-to-demanded | `THE DEMAND TABLE MOVED` | rejected |
| r17-self-declared-demanding-primitive-wraps-a-pin | `PINNED CONJUNCT UNDER AN OPERATOR THE PIN TABLE DOES NOT ADMIT` | rejected |
| r19-allowlist-widened-in-json | `THE ADMISSIBLE-ANCESTOR TABLE IS NOT THE LITERAL` | rejected |
| r19-not-admitted-operator-is-also-admitted | `AN OPERATOR IS BOTH ADMITTED AND NOT ADMITTED` | rejected |
| r19-pin-citing-a-review-finding-deleted | `'AT-M5-04'` | rejected |

**14 of 14.** r18 is the 36-fixture family this round created; its aggregate result is inside the 95 of
95, and ten of its members were additionally reproduced by hand in §1–§3 above. The r18 per-fixture run
is reported in §13.

**r16 was not in the brief's list and I did not run it separately;** its 17 members are inside the 95.

## 12. A three-layer result worth recording: deleting a guard is not cheaper than attaching it

`pinned_attachments`' own comment says a table derived from what it measures *"could be satisfied by
deleting guards rather than by attaching them."* I ran that attack to its end on
`guard.holder.no_veto`, adding one deletion at a time and re-deriving where the tree demanded it:

| state | exit | refused by |
|---|---|---|
| guard + its attachment row + its pin deleted | 1 (29 s) | `coverage inventory differs from its derivation` — `canonical_predicates committed_only: ['guard.holder.no_veto']` |
| ... plus inventory and `PredicateId` re-derived | 1 (28 s) | `undefined predicate call: guard.holder.no_veto` — the edge still calls it |
| ... plus the call detached from `edge.StandingHolder.staffed.suspended.v1` | 1 (31 s) | `A PINNED FINDING LOST ITS LAST PIN ... count 38, ceiling 37`, **naming `AT-M3-03`** as the finding that went dark |

Three independent controls in series, and the last one names the finding rather than the table.

## 13. r18 per-fixture

**36 of 36 rejected as required**, run individually against the frozen archive, each matching its own
`expect_failure_contains`. The ten this round added for the Step 6 (d)s and the detachment headline:

| fixture | expected reason |
|---|---|
| r18-capability-floor-has-no-source | F6A-06's floor derivation |
| r18-declared-grant-resolves-to-nothing | `'guard.grant.declared_resolves_to_live_grant', 'related_phases'` |
| r18-control-object-changed-without-authorization | `A CONTROL OBJECT MAY CHANGE WITH NO PROTECTED CHANGE NAMED` |
| r18-control-object-change-on-a-proposal-nobody-decided | `'guard.protected.control_object_change_authorized', 'related_phases'` |
| r18-effect-identity-triple-unconstrained | `DOES NOT CONSTRAIN ITS BUSINESS TRIPLE` |
| r18-second-claimant-re-releases | `'guard.effect.second_claimant_inherits', 'related_phases'` |
| r18-guard-detached-from-its-edge | `GUARD DETACHED FROM ITS EDGE` |
| r18-load-bearing-edge-deleted | `PINNED TRANSITION MISSING` |
| r18-readset-equality-fooled-by-a-duplicate | `'guard.readset.delivered_equals_declared', 'unique'` |
| r18-recompute-matches-having-lost-a-reached-class | `'guard.derivation.recompute_matches', 'unique'` |

Zero `wrong_reason` and zero `never_ran` across all 50 fixtures I ran individually (14 + 36).

## 14. Dispositions

| item | disposition |
|---|---|
| **F6A-01** (W1) — middle band terminus + holder admission | **CLOSED at specification level** (prose; no executable control) |
| **F6A-06** (W15) — declared floor | **CLOSED** (two mutations refused, each naming the finding) |
| **F6B-05** (W12) — C3 acceptance sampling | **CLOSED at specification level** (prose; count registered as owed) |
| **F6D-06** (W6) — `declared_grants` | **CLOSED at specification level** (typed, required, guarded, attached, pinned) |
| **F6D-07** (W10) — control objects | **CLOSED at specification level** (enum + 9 attached edges + schema presence half) |
| **F6D-11** (W7) — `EffectIdentity` | **CLOSED at specification level** (natural key + rule + guard + attachment) |
| **F6D-01 / F6D-04** — detachment and edge deletion | **CLOSED** (8 of 8 detachments and 2 of 2 edge deletions refused by name) |
| **F6D-02 / F6D-03** — set equality | **CLOSED at specification level** (`unique` on both arrays of both guards, pinned) |
| **RC5-01** — allowlist budget and verdict line | **CLOSED** (p3a's exact hunk now exits 1 naming the literal) |
| **RC5-02** — floors and coverage denominator | **CLOSED** (bulk deletion refused by name; floors at committed counts) |
| **RC5-03** — sibling key | **CLOSED** (both-tables operator refused even with the checker literal edited) |
| **`hand_written_controls` verdict block** | **CLOSED** (13 keys required; deleting one exits 1 naming `missing: ['admissible_ancestors']`) |
| **The terminal control's review tier** | **OPEN (class b)** — `trivial`, stated once in a different file; see F6R-02 |
| **F6A-10, F6D-09, F6D-12** (sampled (a)s) | **OPEN** — no repair anywhere; see §5 and F6R-01 |
| **Regressions r13, r14, r15, r17, r18, r19** | **CLOSED** — 50 of 50 individually, 95 of 95 in the baseline, every one for its own reason |

## 15. The question the dispositions need

**Does any (d)-class finding remain open on any of W1–W15 after these repairs?**

**No (d) among the six I was asked to recheck remains open, and none of them is enforced by anything
that runs.** All six required a *decision* an implementer would otherwise invent, and all six now carry
that decision in a typed, required, mutation-refusing form — but the package holds no evaluator, so
every closure is a closure of the specification and not of behaviour. I did not sweep W1–W15 for (d)s
outside the six named in the brief, so this answer is narrow by construction: it is about those six.

## 16. Not checked

- **W1–W15 generally.** I rechecked the six (d)s the brief named. I did not re-derive the (d) frame over
  all fifteen work-layer questions, so a (d) nobody has yet stated would not appear here.
- **The (c)-class findings** (F6A-02, F6A-12, F6B-04, F6B-08) and the remaining 40-odd (a)/(b)s beyond my
  seven-finding sample.
- **r16's 17 fixtures individually.** Inside the 95 of 95; not run one by one.
- **The 56 positive fixtures individually.** The baseline ran them 56 of 56; I mutated none.
- **`node scripts/vision-record-registry.mjs verify`** and the other repository verifiers — cannot be
  pointed at the frozen archive (§7), and out of scope by the brief.
- **Whether the 53 mapping-table reasons are TRUE of the terms they map.** I checked every term is
  mapped, every mapping is used, every entry has a class in C0–C5 and a non-empty reason, and that the
  46 declared floors equal the maxima. Whether `publication -> C4` is the right call is a judgement I did
  not make.
- **Whether `05` §12's five-condition holder-admission path is sound.** I checked it exists, is stated
  operatively, and that `StandingHolder.exercising_fixture_id` is required. No check enforces the five.
- **Any runtime behaviour, of anything.** No handler, no source truth, no gateway, no evaluator exists.
- **The producer's own account of this work.** I did not open `docs/08-agents_work/`, `state.json`,
  `history.jsonl`, `PLANNING-REPORT.md`, `planning/F2/05-selection-record.*`, or the `status` fields of
  `registers/review-findings.json`. I read `id` and `required_contract` from that register only, because
  the RC5-02 coverage rule's denominator cannot be reproduced without them.

## 17. Standing caveat

One reviewer, one model family, one procedural pass. **It is not a multi-judge panel and does not
discharge the `irreversible`-tier requirement of 2-of-3 judges across >= 2 distinct model families.**
Every author of the subject, every Step 6 reviewer and every prior recheck of this lineage is the same
family as me; independence here is procedural only.

Two things are worth saying about that. First, every disposition above rests on a mutation I wrote and
ran, not on reading the repairs and agreeing with them — and the one result that surprised me
(F6A-10, F6D-09 and F6D-12 having no repair at all, inside a list whose comment says otherwise) came
from reading the contract files against the required contracts, which is the mode this lineage's own
reports keep saying finds the least. Second, the terminal control of the whole pin machinery is now a
Python literal in a file the repository classifies `trivial`, so the last line of defence is a human
reading a diff at the lowest review tier the repository has. That is a real reduction in attack surface
against every mechanism below it, and it is not a closure.
