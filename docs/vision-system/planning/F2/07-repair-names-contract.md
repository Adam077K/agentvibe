# F2 · r7-contracts — the names contract

**What this file is.** Every name this repair lane registered — field, enum member, lifecycle phase,
guard id, validator check, fixture id, JSON key — keyed by the finding that asked for it, with the
branch taken wherever the required contract offered an "or" and the reason, plus any residue left
**owed**. The follow-up prose lane and the independent recheck cite from here: a name not in this file
was not registered by this lane.

**Standing caveat, and it governs every row below.** These repairs are **author-recorded** and await
independent recheck. One model family. **No runtime of any kind exists** — every "check" named here is
specified behaviour checked offline by `validate_contracts.py` against the committed registries, and
every "guard" or "conjunct" is a statement the specification now makes, not a behaviour anything has
executed.

**Base:** `38a3421` · **Branch:** `builder/f2-r7-contracts`

---

## Infrastructure this lane added first (F6R-01's structural half)

`pinned-conjuncts.json` gained three keys, because the findings below need somewhere to record
*where* they are answered when the answer is a check rather than a conjunct:

| name | kind | meaning |
|---|---|---|
| `unanswered_split_why` | JSON key (string) | why `unanswered` is a partition and not one count |
| `answered_elsewhere` | JSON key (object) | finding id → `{file, check}`; **the file must exist** |
| `not_answered` | JSON key (object) | finding id → why nothing here answers it |

`validate_contracts.py` gained `ANSWERED_ELSEWHERE` / `NOT_ANSWERED`, the partition check
**THE UNANSWERED SET IS NOT PARTITIONED**, and two literals, `ANSWERED_ELSEWHERE_CEILING` and
`NOT_ANSWERED_CEILING`. Full reasoning under **F6R-01** below.

---

## F6A-10 — `custody_tie_break_reason = admitter_excluded`

*Required contract (A:417–436): add `admitter_excluded` to BOTH declarations of the enum, **or** drop
the clause and cite the guard.*

**Branch taken: add it to both declarations.** The clause is not decorative — `05` §7 (R-X06) and
`11-schemas-state-contracts.md` both instruct the resolver to record it, and
`guard.custody.admitter_excluded` enforces the *behaviour* while the enum is what lets the record
*say* so. Dropping the clause would delete the only place the reason is written down; the guard
refuses the admitter's presence in the custody order and says nothing about which reason was recorded.

| name | kind | where |
|---|---|---|
| `admitter_excluded` | enum member | `record-registry.json` → `ResponsibilityAssignment.fields.payload.type_fields.custody_tie_break_reason` (now `Enum<narrowest_sufficient_scope,alternate_available,earliest_acceptance,no_overlap,admitter_excluded>`) **and** `records.schema.json` → the same field's closed `enum` |
| `ENUM_PAIRS` | validator counter | `validate_contracts.py` |
| `CUSTODY_TIE_BREAK_REASONS` | hand-written literal (5 members) | `validate_contracts.py` |
| `REGISTRY AND SCHEMA DISAGREE ABOUT A CLOSED ENUM'S MEMBERS` | check | `validate_contracts.py` — runs over **57** `Enum<>` payload fields, with a floor of 57 under the walk |
| `THE ORDERED CUSTODY RESOLVER CANNOT RECORD A REASON THE CHAPTERS INSTRUCT` | check | `validate_contracts.py` — the literal, by name |
| `r20-custody-tie-break-enum-omits-the-admitter-exclusion` | negative fixture | `fixtures/negative/` |
| `r20-custody-tie-break-enum-reordered-benign` | positive fixture | `fixtures/positive/` |

**Why the new check is general rather than one assertion about one enum.** The existing payload rule
(F6A-07) compares registry and schema as **sets of field names**, so two declarations of one field that
admit *different values* satisfied it. 57 payload fields carry a closed enum; all 57 pairs agreed
before this check existed, which is the argument for it — the invariant was true and unguarded, and one
of the 57 had already drifted from the **chapters** in the direction no field-name comparison can see.

**Membership, not order.** The comparison is over sets. `in` does not read order and no predicate in
the registry does, so a byte comparison would refuse an edit that changes no admissible value. The
positive fixture reorders the five members and must pass — it fails the moment someone "strengthens"
the check into a sequence comparison.

**Chapters.** No chapter edit was needed: `05` §7 and `11` already name the reason, and they are
consistent with the registry now rather than against it. That direction — chapters right, contracts
behind — is worth recording, because the repair was to the contracts.

**Floors moved.** `NEGATIVE_FIXTURE_FLOOR` 95 → 96, `POSITIVE_FIXTURE_FLOOR` 56 → 57, with the reason
written into the constant's comment and into both `MANIFEST.json` `floor_why` strings.

**Recorded under F6R-01 as:** `answered_elsewhere["F6A-10"]`, leaving `not_answered` (37 → 36).

**Owed: nothing.**

---

## F6D-12 — `reason_kind` / `reason_unit` as closed enums, and the pairing

*Required contract (D:491–520): `reason_kind` an enum of exactly the six, `reason_unit` an enum of the
six units, a conjunct pairing them; adverse fixture a seventh reason; paired benign each of the six.*

**No "or" in this one.** All three clauses landed. The one judgement taken is on the benign column —
see below.

**The six pairs, derived from `05` §4's two-column table (lines 113–120), snake-cased:**

| `reason_kind` | `reason_unit` | chapter row |
|---|---|---|
| `permission_scope` | `permission_scope` | Permission scope / a permission scope |
| `input_provenance` | `input_set` | Input provenance / an input set |
| `consequence_class` | `effect_class` | Consequence class / an effect class |
| `confidentiality_boundary` | `context_boundary` | Confidentiality boundary / a context boundary |
| `named_partition` | `partition` | Named partition / a partition |
| `verification_relation` | `attempt_relation` | Verification relation / a relation between two attempts |

| name | kind | where |
|---|---|---|
| `Enum<permission_scope,…,verification_relation>` | payload type | `record-registry.json` → `ExistenceJustification` `type_fields.reason_kind` **and** `fields.reason_kind.type` (both halves — the registry states a payload in two places and F6A-07 compares them) |
| `Enum<permission_scope,…,attempt_relation>` | payload type | the same two halves for `reason_unit` |
| closed `enum` on both fields | schema | `records.schema.json` → `ExistenceJustification.payload.properties` (was `$ref: values.schema.json#/$defs/string` on each) |
| `EXISTENCE_REASON_PAIRS` | hand-written literal (6 pairs) | `validate_contracts.py` |
| `A SEVENTH ADMITTED REASON IS WRITABLE, or one of the six is not` | check | `validate_contracts.py` |
| `THE UNIT AN ADMITTED REASON PREDICATES ON IS NOT ONE OF THE SIX` | check | `validate_contracts.py` |
| `AN ADMITTED REASON IS NOT PAIRED WITH ITS UNIT IN THE CRITERION` | check ×6 | `validate_contracts.py` — reads the criterion **body**, not the derivation |
| the pairing conjunct | criterion conjunct | `criterion.ExistenceJustification.admitted.v1`, authored through `tools/phase_content.py` as `('either', [('every', [('eqF', reason_kind, k), ('eqF', reason_unit, u)]) × 6])` |
| pin on `criterion.ExistenceJustification.admitted.v1` | pin (2 require rows) | `pinned-conjuncts.json#/pins` |
| `r21-existence-justification-admits-a-seventh-reason` | negative fixture | `fixtures/negative/` |
| `r21-existence-justification-six-reasons-reordered-benign` | positive fixture | `fixtures/positive/` |

**Why a pairing conjunct and not two independent enums.** `05` §4 is a two-column table, so the
contract is six **pairs**. Two independent enums admit `consequence_class` predicating on `a
partition` — a criterion applied to a unit where it returns undecidable, which is the failure R2 F-20
names and which **reads as satisfied**. Neither enum can say this alone.

**The conjunct was NOT hand-written into the registry.** Criterion bodies are authored by
`tools/phase_content.py` and an oracle fails on drift between the two, so the derivation was edited and
`tools/author_phase_content.py` re-ran. The `requires` sentence was extended in the same edit, because
RC-03 requires a criterion's sentence and its conjuncts to agree.

**Benign column — the judgement taken, stated plainly.** The review asked for "paired benign: each of
the six". **All six are asserted on every run**, by `EXISTENCE_REASON_PAIRS` and by six checks that read
the criterion body — which is stronger than six fixtures and does not cost six validator invocations.
The single positive fixture therefore does the thing six fixtures could not: it **reorders** the six and
must pass, which pins the control to membership-and-pairing rather than to the order the six happen to
be written in. If a recheck wants six literal fixtures, that is a cost decision, not a coverage gap —
and it is recorded here as the branch taken rather than left to be discovered.

**Floors moved.** `PIN_FLOOR` 67 → 68, `PIN_ROW_FLOOR` 148 → 150, `NEGATIVE_FIXTURE_FLOOR` 96 → 97,
`POSITIVE_FIXTURE_FLOOR` 57 → 58, each with the reason in the constant's comment.

**Under F6R-01:** F6D-12 is now **pinned**, so it leaves `not_answered` entirely (36 → 35). The
partition check caught this itself — the first run after the pin landed failed with
`declared but not unanswered: ['F6D-12']`, which is the control doing its job on its own author.

**Owed: nothing for this finding.** Note for the prose lane: `05` §4's table is prose and the ids above
are this lane's snake-casing of it. If the chapter is ever re-worded, `EXISTENCE_REASON_PAIRS` is the
thing to reconcile it against.

---

## F6D-09 — the two predicate-bearing fields are typed

*Required contract (D:391–434): `failed_predicate_id: PredicateId`; `precondition_predicate_ids:
PredicateId[]` (**or** `TypedPredicate[]`); a conjunct asserting each named predicate's registered
`implementation_status` is deterministic; adverse fixture + paired benign.*

**Branch taken on the "or": `PredicateId[]`, not `TypedPredicate[]`.** `TypedPredicate` is a `oneOf`
carrying a `const predicate_id` **and a matching `arguments` schema**, and a standing interest names
preconditions it does not supply arguments for — the arguments arrive with the arriving job, not with
the interest. Typing the field `TypedPredicate[]` would force every interest to commit to argument
values at registration, which is a different contract from the one `05` §7 states. `PredicateId[]` is
the derived, ratcheted enum and carries the whole of what this finding is about.

| name | kind | where |
|---|---|---|
| `PredicateId` | payload type | `record-registry.json` `AdmissionRecord.failed_predicate_id` (both halves) + `records.schema.json` `$ref values.schema.json#/$defs/PredicateId` |
| `PredicateId[]` | payload type | the same two places for `StandingInterest.precondition_predicate_ids` (schema: `array` of `$ref`) |
| `Enum<deterministic,model>` | payload type | `StandingInterest.precondition_evaluator_kind`, both halves + a closed schema `enum` |
| `PREDICATE_BEARING_FIELDS` | hand-written literal (2 rows) | `validate_contracts.py` |
| `A FIELD THAT NAMES A PREDICATE IS A FREE STRING` | check | `validate_contracts.py` |
| `THE EVALUATOR KIND A GUARD COMPARES IS AN OPEN STRING` | check | `validate_contracts.py` |
| `THE PREDICATE REGISTRY NOW CLASSIFIES IMPLEMENTATION STATUS` | check (a tripwire — see below) | `validate_contracts.py` |
| `r22-refusal-names-a-predicate-that-is-only-a-string` | negative fixture | `fixtures/negative/` |
| `r22-precondition-ids-reordered-benign` | positive fixture | `fixtures/positive/` |

**A third field was closed that the finding mentioned only in passing, and it is the same defect one
field over.** `guard.interest.precondition_invokes_no_model` compares `precondition_evaluator_kind` to
`"deterministic"` and to `"model"` — and the field's type admitted **every other string in the world**,
so an interest declaring `"heuristic"` passed a guard whose entire subject is that value. The two
members are read off the guard's own body; nothing was invented.

### OWED — the determinism conjunct, and why it was not written

The third clause asked for a conjunct asserting each named predicate's registered
`implementation_status` is deterministic. **Measured before writing it: `implementation_status` takes
exactly ONE value across all 2,397 registered predicates** — `"specified; conformance interpreter only,
no production binding implemented"`. There is no deterministic/model classification in the registry to
read. A conjunct over it would be **true of every predicate by construction** — "a guard that collects
the evidence for the ceiling and never applies it", which is the anti-shape the package's own fixture
`r16-08` exists to name, and writing it would have let this lane report the clause closed.

So the clause is **owed**, and the absence is instrumented rather than noted: the check
`THE PREDICATE REGISTRY NOW CLASSIFIES IMPLEMENTATION STATUS` **fails the moment a second value
appears**, and its message says what to do — write the conjunct, type `precondition_predicate_ids`
against the deterministic subset, delete the tripwire. A note in a markdown file rots; a check that
fires when its own premise expires does not.

**Whoever picks this up:** the right shape is probably a derived `DeterministicPredicateId` — the same
derive-and-ratchet treatment `PredicateId` already gets — so that a model-invoking precondition is
**unwritable** rather than merely refused. That is stronger than the conjunct the review asked for, and
it needs the classification first.

**Floors moved.** `NEGATIVE_FIXTURE_FLOOR` 97 → 98, `POSITIVE_FIXTURE_FLOOR` 58 → 59.

**Under F6R-01:** `answered_elsewhere["F6D-09"]`, whose `check` row states the owed clause explicitly —
so the partition does not record this finding as wholly answered. `not_answered` 35 → 34.

---

## F6C-11 — the retention ceiling is applied, not just collected

*Required contract (C:325–345): a conjunct `gt(retention_until, landed_at +
longest_plausible_outage)`; make `landed_at` exist and be required if it does not.*

**`landed_at` already existed and was already required** on `UnmatchedPoolEntry` — that half of the
contract was a no-op, and saying so is part of the answer.

**The comparison as literally written is NOT expressible, and the substitute is exact about what it
does and does not carry.** `add` is `DecimalString` only; there is **no instant-plus-duration
primitive** in `primitive-registry.json`, so `landed_at + longest_plausible_outage` cannot be formed.
Both sides are therefore compared **as spans in one unit**:

| name | kind | where |
|---|---|---|
| `retention_span` | **new required payload field**, type `Duration` | `record-registry.json` `UnmatchedPoolEntry` (`type_fields` + `fields`, `required: true`) and `records.schema.json` (`$ref …/Duration`, added to `required`) |
| `longest_plausible_outage` | **retyped** `string` → `Duration` | the same two places |
| `("ltF", path, path)` | **new conjunct DSL code** | `tools/phase_content.py`, documented above `def spec`, composing to `{"op":"lt", left, right}` over two subject paths |
| the `ltF` conjunct | criterion conjunct | `criterion.UnmatchedPoolEntry.landed.v1`, authored and regenerated |
| `THE RETENTION CEILING IS COLLECTED AND NEVER APPLIED` | check (reads the body) | `validate_contracts.py` |
| `AN OPERAND OF THE RETENTION COMPARISON IS NOT A DURATION` | check ×2 | `validate_contracts.py` |
| pin on `criterion.UnmatchedPoolEntry.landed.v1` | pin (2 require rows, one of them `op: lt`) | `pinned-conjuncts.json#/pins` |
| `r23-retention-ceiling-collected-and-never-applied` | negative fixture | `fixtures/negative/` |
| `r23-retention-field-note-edited-benign` | positive fixture | `fixtures/positive/` |

**It refuses the review's own counterexample exactly.** One-day retention, thirty-day stated outage:
`lt(30d, 1d)` is false, so the entry does not reach `landed`. That was the case the criterion admitted.

**`lt` and not `lte`, deliberately** — "exceeds" is the chapter's word, and `lte` would admit an entry
whose retention ends exactly at the outage horizon, which is the boundary the rule is about.

**Why the check reads the criterion body and sits ABOVE the derivation oracle.** This is **F6R-04's
ordering, acted on** (see that section). A hand edit of a criterion trips the drift oracle too, and
drift tells a reader *a table moved*; the concrete message says *which rule stopped being checked*.
The negative fixture's `expect_failure_contains` is the concrete one, which is how the ordering is
pinned rather than merely intended.

### OWED — the span is not tied to the instants

Nothing ties `retention_span` to `retention_until − landed_at`. A producer may state a 30-day outage,
a 31-day `retention_span` and a `retention_until` one hour after `landed_at`, and the criterion passes.
**That is a real, smaller hole, and it is this lane's, not a pre-existing one.** It is strictly better
than the committed state — which admitted the review's counterexample outright — and it is worse than
the contract asked for.

Closing it needs an **instant-offset primitive** (`UTC` + `Duration` → `UTC`), after which the right
form is the review's literal one and `retention_span` should be deleted rather than kept beside it.
Registering a primitive is an architectural decision this lane was not briefed to take, which is why
it is written here instead of taken.

**Under F6R-01:** F6C-11 is **pinned**, so it leaves `not_answered` (34 → 33). Floors: `PIN_FLOOR`
68 → 69, `PIN_ROW_FLOOR` 150 → 152, negative 98 → 99, positive 59 → 60.

---

## F6C-10 — the attempt ceiling, on the right record and compared

*Required contract (C:313–324): `attempt_ceiling` required on `WorkOrder`; a conjunct on
`FailureRecord: * → retry_admitted` refusing the transition at the ceiling; a named phase for the
park; align `05` §6.*

**Two of three clauses landed. The third was written, run, refused, and withdrawn — see OWED.**

| name | kind | where |
|---|---|---|
| `attempt_ceiling` | **now required** payload field, `UInt64` | `record-registry.json` `WorkOrder` (`type_fields` + `fields`, `required: true`, owner `S1-C02`) and `records.schema.json` (`$ref …/UInt64`, added to `required`) |
| `("ltCount", array_path, bound_path)` | **new conjunct DSL code** | `tools/phase_content.py`, composing to `lt(count(array), bound)` |
| `("FailureRecord", "retry_admitted")` | **new RECORD_OVERRIDE** | `tools/phase_content.py` — the generic `retry_admitted` spec is shared by many records and was **not** edited |
| `THE WORK ORDER CARRIES NO ATTEMPT CEILING` | check | `validate_contracts.py` |
| `A RETRY IS ADMITTED WITHOUT COMPARING ATTEMPTS AGAINST THE CEILING` | check (reads the body) | `validate_contracts.py` |
| `FAILURERECORD NOW HAS A PARK PHASE` | check (a tripwire) | `validate_contracts.py` |
| pin on `criterion.FailureRecord.retry_admitted.v1` | pin (2 rows, one `op: lt`) | `pinned-conjuncts.json#/pins` |
| `r24-work-order-carries-no-attempt-ceiling` | negative fixture | `fixtures/negative/` |
| `r24-attempt-ceiling-required-benign` | positive fixture | `fixtures/positive/` |

**`attempt_ceiling` stays OPTIONAL on `FailureRecord`, deliberately.** Its own note says making it
required "would rewrite every criterion of this record through `tools/phase_content.py`'s role
resolution". The override demands it through `nfp`, which names the exact path and disturbs no role.

**`lt` and not `lte`** — the ceiling exists to refuse the attempt that reaches it.

### OWED — the named park phase

`parked` was added to `FailureRecord.lifecycle.phases` with three transitions, the criterion spec was
written, and `author_phase_content.py` generated `criterion.FailureRecord.parked.v1` correctly. The
validator then **refused all three transitions at `edge predicate`**: each `* → parked` edge needs its
own `edge.FailureRecord.*.parked.v1` in `predicate-registry.json`, and the authoring tool writes
**criteria, not edge predicates**. Authoring an edge predicate by hand is precisely the move this
package's oracles exist to catch, so the phase was **withdrawn rather than half-added**.

The full spec that carries it is written out, commented, in `tools/phase_content.py` beside the
`FailureRecord` overrides, so the next lane restores rather than re-derives it. The check
`FAILURERECORD NOW HAS A PARK PHASE` fails the moment the phase appears, which is what stops the owed
clause landing silently incomplete.

**`05` §6 alignment: not done.** The chapter sentence is already correct — it is the contracts that
were behind it — so no prose edit was owed for the two clauses that landed. If the park phase lands,
§6's "stated behaviour at the ceiling: park" should then name the registered phase.

**Under F6R-01:** F6C-10 is **pinned**, so it leaves `not_answered` (33 → 32).

---

## r7-contracts-b, step 0 --- the two wrong_reason leaks, and what the repair NAMED

The previous lane never ran the full validator, so the ten fixtures it added had never been
executed. Two of the hundred were refused by a check other than the one they exist to exercise.
`tools/run_negative_fixtures.py` reports that as a wrong_reason leak and it is right to: a
negative fixture rejected for the wrong reason proves nothing about the control it names, and
the suite that reports it as a rejection is counting a pass it did not earn.

### `r21-existence-justification-admits-a-seventh-reason` --- the declaration moved, not the checks

The fixture adds `specialized_knowledge` to `records.schema.json`'s `reason_kind` enum and left
`record-registry.json` alone, so TWO checks see it: F6D-12's six-reason literal (**A SEVENTH
ADMITTED REASON IS WRITABLE**) and F6A-10's registry-versus-schema membership comparison
(**DISAGREE ABOUT A CLOSED ENUM'S MEMBERS**). F6D-12's runs earlier in the file. The fixture
declared F6A-10's message.

**Fixed by moving the declaration to the check the fixture is FOR, not by reordering the checks.**
The fixture's own `finding` field says F6D-12 and its `why` argues the six-reason literal; the
expectation was simply written against the wrong one of two true failures. Reordering would have
made F6A-10's comparison unreachable for this shape and bought nothing. `expect_failure_contains`
is now `A SEVENTH ADMITTED REASON IS WRITABLE`, and the `why` records what it used to say and why
that was wrong, so a reader who greps the old string finds the correction rather than nothing.

### `r3-lifecycle-status-as-judgment-subject` --- the F6D-09 tripwire measured a scratch tree

The tripwire counted DISTINCT `implementation_status` values over the whole predicate registry and
fired when more than one existed. `r3` patches a predicate INTO the registry, and a patched-in
predicate must carry a status; `r3`'s says `negative fixture; never part of the contract`. So the
tripwire fired inside `r3`'s own scratch tree, on an entry `r3` introduced, and refused `r3` for a
finding that has nothing to do with what `r3` proves.

Two names are registered in `validate_contracts.py`, both string literals beside the tripwire:

| name | value | meaning |
|---|---|---|
| `FIXTURE_ONLY_PREDICATE_STATUS` | `negative fixture; never part of the contract` | the status a fixture-introduced predicate carries; **excluded** from the tripwire's set |
| `CONTRACT_PREDICATE_STATUS` | `specified; conformance interpreter only, no production binding implemented` | the one status every one of the 2,397 real predicates carries |

The exclusion is keyed on the **status value**, never on where the predicate came from, so a
fixture that introduces a genuine second classification still trips the tripwire. That is the
difference between narrowing a control and disabling it, and it is held to a pair rather than
asserted:

- `fixtures/negative/r25-predicate-status-gains-a-second-classification` --- gives one REAL
  predicate a real second classification; the tripwire must still fire.
- `fixtures/positive/r25-predicate-status-fixture-sentinel-ignored-benign` --- gives one predicate
  the sentinel; it must not. **If someone widens the exclusion, this pair is what fails.**

Floors moved with them: negative 100 -> 101, positive 61 -> 62, in `MANIFEST.json` and in
`NEGATIVE_FIXTURE_FLOOR` / `POSITIVE_FIXTURE_FLOOR`, with the reason written at both literals.

**The tripwire also got STRONGER in the same edit, and this is the part worth reading.** It was
`len(_statuses) == 1` --- satisfied by ANY single value. A registry-wide rewrite of the status to
some other single string would have passed a tripwire whose entire subject is what that string
says. It is now an equality against `CONTRACT_PREDICATE_STATUS` by name. That is the same defect
shape F6A-10 is about two hundred lines below: **counting a set instead of comparing its members.**

### What is STILL OWED, and it is the same clause the previous lane declined

F6D-09's third clause --- a conjunct asserting each named precondition predicate's registered
`implementation_status` is deterministic --- **is still not written, and the measurement that
declined it is unchanged**: `implementation_status` takes exactly ONE value across all 2,397
predicates. There is no deterministic subset to type `precondition_predicate_ids` against, because
there is no classification in the registry at all. Writing the conjunct now would make it true of
every predicate by construction --- the anti-shape `r16-08` exists to name --- and typing the field
against a subset that is the whole set constrains nothing. **Classifying 2,397 predicates is an
architectural decision about what the registry means, not a repair**, so it is recorded owed rather
than faked. The tripwire is what makes the absence loud, and it survives this step narrowed and
strengthened rather than deleted.

---
## F6X-02 --- the eight boundary kinds, and `contested_refs`

**Registered, not invented.** F6X-02 went unrepaired through two lanes with the same reason each
time, and it was a good reason: the register records its status as *"the enum members would have
been invented rather than derived --- needs the chapter to state them first"*, and
`pinned-conjuncts.json` repeats it, *"a pin over an enum this package has not been given would be
exactly that invention"*. `05` section 5 states them now. This lane registered **exactly the ten
strings** in [`08-repair-names-prose-b.md`](08-repair-names-prose-b.md) and derived none of its own.
**No chapter edit was needed** --- `05` section 5 already names all ten, including the field name,
its type, its requiredness and the meaning of the empty case.

### `ConstraintSet.payload.boundary_kind` --- closed, eight members, refused not defaulted

| where | what changed |
|---|---|
| `record-registry.json` | `string` -> `Enum<delegation,machine_handoff,consultation_return,continuation,acceptance_submission,founder_brief,custody_transfer,stage_import>`, in `type_fields` **and** in `fields` |
| `records.schema.json` | free `$ref` to `string` -> a closed `enum` of the same eight |
| `validate_contracts.py` | `BOUNDARY_KINDS`, a hand-written literal, plus three checks |

The three checks are separate on purpose, because they fail for three different reasons:

1. **A BOUNDARY KIND OUTSIDE THE EIGHT** --- the schema's members compared **as a set** against
   the literal. Membership, not order: an enum's members are a set, `in` does not read order, and
   a control that refuses a harmless reordering is one contributors route around.
2. **THE CLOSED BOUNDARY-KIND SET HAS A DEFAULT** --- the one way to reopen a closed set without
   adding a member to it. A default admits every unrecognised transfer as one of the eight instead
   of refusing it, **on a field that now reads as constrained**, which is worse than the free
   string it replaces. `05` section 5 says refused, never defaulted; the absence is asserted.
3. **THE REGISTRY STILL DECLARES `boundary_kind` AS A FREE STRING** --- and this one is the
   subtle one. F6A-10's member-by-member walk only visits fields the **registry** declares as
   `Enum<...>`. A registry left as `string` does not FAIL that walk; it silently leaves it, and
   the schema's closed enum then stands alone against a registry that admits anything.

### `OperatorProjection.payload.contested_refs` --- `Ref<Record>[]`, required

Required, never optional, and that is the whole design rather than a strictness preference:
**an empty array states that nothing was contested; an absent field states that nobody looked.**
Optional collapses those two into one absence and the operator --- who is the person the record
exists for --- cannot tell them apart. It carries the second limb of `04` DELTA 1, *"what was
omitted **and what was contested**"*, whose first limb `omission_manifest_ref` already carried and
whose second limb had no field on any operator-facing record.

Asserted in **both** declarations, because F6A-10 is precisely the finding about a field that is
right in one of them. A second check asserts the field is a **list of record references** and not
a scalar: the field names *which* refs were contested, and a count answers a different question.

### The four fixtures, and why each adverse case has a reordering beside it

| fixture | proves |
|---|---|
| `negative/r26-boundary-kind-admits-a-ninth-transfer` | a ninth member, added in a diff that reads as a feature |
| `positive/r26-boundary-kind-eight-reordered-benign` | the same eight reordered must PASS |
| `negative/r27-contested-refs-made-optional` | one string struck from `required` |
| `positive/r27-operator-projection-required-reordered-benign` | the same required set reordered must PASS |

Both adverse cases are **one-line edits to a JSON list** --- the smallest possible diff for the
largest possible change in what a passing record promises. That is exactly why each is paired with
a reordering: a check that pins the bytes of a list cannot tell a widening from a reordering, fails
on every unrelated field anyone ever adds, and gets deleted for it.

Floors moved with them --- negative 101 -> 103, positive 62 -> 64, in both `MANIFEST.json` files
and at `NEGATIVE_FIXTURE_FLOOR` / `POSITIVE_FIXTURE_FLOOR`, with the reason written at each.

**Stated narrowly:** the four new fixtures were **not executed** in this commit. The light
validator (`CONTRACTS_FIXTURE_RUN=1`) passes, which proves the checks are green on the real tree
and says nothing about whether each adverse case is refused *for its stated reason*. The full run
at the close of this lane is what settles that, and step 0 above is what a lane that never ran it
costs.

---
## F6X-01 --- `KERNEL_FACTORY_PATHS`, and why neither option the review offered was taken

`registration.exclusive_factory` says: **this record has exactly one creation path and nothing else
may make one.** Nine records declare it. Measured before touching anything: `exclusive_factory`
appeared in `validate_contracts.py` **zero times**. Not once. So the string was never resolved
against anything, and three of the nine name a path that does not exist --- `kernel.commit_group`
(`DomainEvent`), `witness.store_group` (`DurabilityReceipt`), `kernel.apply_transition`
(`LifecycleStatus`) --- against a `command-registry.json` of 105 commands carrying none of them.

**Both options in the finding's `required_contract` are wrong, which is why this took three lanes.**

| option | what it actually costs |
|---|---|
| *Register the commands* | authoring three command contracts --- argument schema, guard, authority, destination --- for paths nobody has specified. That is **inventing contract**, the thing every refusal in this package exists to prevent |
| *Retire the declarations* | deleting the sentence *only the kernel may create a `DomainEvent`*. That is a **real containment**, and a load-bearing one: a domain event a record-level command can forge is not an audit trail |

Either would have traded a true statement for a green run. **The third option is the narrow one:**
the kernel and witness surfaces are declared in `validate_contracts.py` as `KERNEL_FACTORY_PATHS`,
a closed literal of exactly three paths, each annotated with the record it creates. An exclusive
factory resolves if it is a registered command **or** a member of that literal. The declarations go
on saying what is true, no command contract is invented, and all nine now resolve to something a
reader can find.

**What keeps this from being an escape hatch is that membership is EXACT and not a `kernel.`
prefix.** A prefix rule would let any record exempt itself from the command registry by choosing a
name. Four checks, each failing for its own reason:

1. **AN EXCLUSIVE FACTORY RESOLVES TO NOTHING** --- per declaration, against commands and the literal.
2. **THE EXCLUSIVE-FACTORY WALK MET ALMOST NO DECLARATIONS** --- floor of 9, because the loop has a
   `continue` a narrowing edit could widen into a skip of everything.
3. **A DECLARED KERNEL PATH IS ALSO A REGISTERED COMMAND** --- the two surfaces are disjoint by
   construction; an overlap means the exemption is hiding a path that HAS a contract to be held to.
4. **THE KERNEL FACTORY SURFACE WAS WIDENED** --- exactly three, by name.

Fixtures: `negative/r28-exclusive-factory-names-an-unregistered-command` (a well-formed command name
that resolves to nothing --- well-formed on purpose, so it fails the resolution and not a spelling
rule) with `positive/r28-…-repointed-to-a-registered-command-benign`; and the pair that holds the
exemption's edge, `negative/r29-exclusive-factory-invents-a-kernel-path` against
`positive/r29-…-uses-a-declared-kernel-path-benign`. **An exemption whose edge no fixture holds is
the hole it was meant to close.** Floors: negative 103 -> 105, positive 64 -> 66.

**Still open, and stated rather than closed:** this makes the three paths *resolvable*, not
*specified*. What the kernel commit group and the witness store group actually guarantee is
unwritten, and no check in this package can supply it. See below.

---

## F6A-09 --- one row deleted, one row defended, and the check widened to values

**The required contract says "remove both keys, or extend the check". The answer is neither, and
it is different for each key** --- which is why the previous lane recorded the analysis as settled
and explicitly *not* "remove both keys".

| key | disposition | why |
|---|---|---|
| `ConsequenceVector` | **deleted from the table**, moved to `not_aliases` with the reasoning | It is a **live registered value type**. `Grant.payload.consequence_bounds` declares it; `02` section 96 defines it. The table mapped it to `ConsequenceDerivation`, a per-operation derivation record --- **a different object**. This was a wrong mapping, not a missing caveat |
| `CapacityState` | **kept** | Its mapping is substantively correct --- `CapacityObservation.measurement` is a `MeasuredQuantity`, a `oneOf` with an `observed` variant, which is the observed-or-unknown shape `05` section 7 asks for --- and **F6D-10 withdrew half a finding on the ground that this row exists.** Deleting it to satisfy a sentence would reopen that |

**What was false was the prose, and that is what is repaired for the second key.** `how_to_read`
claimed *"every key is a name a candidate wrote **and this registry does not have**"*, full stop.
That was untrue of two keys in two different ways: one name this package **does** have (as a value),
one name no registry has and the **specification prose** does. The sentence now says which registry
and records both exceptions by name.

### The check is extended to the value registry --- and NOT to prose identifiers

`ALIAS_VALUE_NAMES`, and the new refusal **A CANDIDATE-ERA NAME IS A REGISTERED VALUE TYPE**. The
declared check compared alias keys against **record** names only, which is exactly why
`ConsequenceVector` passed for the whole of its life.

**The prose half of the required contract is declined, and this is a judgement rather than an
omission.** Extending the refusal to backticked identifiers in the chapters would refuse
`CapacityState` --- and `CapacityState`'s row must stay. **The two halves of that required contract
point in opposite directions on the only two keys it was raised about.** A lane that implemented
both would have had to delete the row F6D-10 depends on in order to satisfy a check it had just
written.

Fixtures: `negative/r30-alias-key-is-a-registered-value-type` **restores the real row**, because it
passed every check in this package for its whole life and a fixture built from an invented case
would not prove that; and `positive/r30-alias-table-gains-a-candidate-only-name-benign`, which keeps
the table addable --- the refusal must key on *this name is one the package HAS*, never on *this row
is new*. Floors: negative 105 -> 106, positive 66 -> 67. Alias floor stays **20**; the table is 25.

---
## F6C-06 --- `CapacityMeasure`, and why it has exactly one member

| name | where | what it is |
|---|---|---|
| `CapacityMeasure` | `value-registry.json`, `values.schema.json#/$defs/CapacityMeasure` | the capacity measures the specification NAMES |
| `cache_lifetime` | its one member | the measure `07` section 5 R-G07's capacity row carries |

**What made this gap invisible is worth stating.** `CapacityObservation.payload` already required
`measure`, `unit`, `measurement` and `freshness_until` --- it was **expressive enough all along**.
So the chapter's close read like a settled contract while `cache_lifetime` occurred **zero times**
in every registry in this package. A record that *could* carry the fact is not a fact anything
carries. Class (b): mechanism documented, binding unverified.

**One member is the honest count, not an oversight.** It is the only capacity measure the
specification names *as a measure*; `07` section 6's allowance observations are written about
without ever naming what they measure. Inventing names for those is precisely the fabrication
F6X-02 was refused for through two lanes. The vocabulary grows when a chapter names something, and
**the check enforces that direction too** --- **A REGISTERED CAPACITY MEASURE IS NAMED BY NO
CHAPTER** scans the chapters for every member, because a name invented in a registry and then cited
as though the specification asked for it is the more dangerous failure: a registered row *looks*
like evidence.

`07` section 5 gains **one sentence** naming the registered measure --- which is the whole of the
prose change, and the reason the finding needed one: the passage bound to no measure at all.

Fixtures: `negative/r31-capacity-measure-invented-in-the-registry` and
`positive/r31-capacity-measure-documentation-edited-benign`. **The benign one is deliberately
modest and says so in its own `why`:** it proves the check reads the member list and not the
entry's bytes. It does **not** prove a chapter-named member is accepted --- there is only one real
measure today, and adding a fake one to demonstrate acceptance would be the fabrication its adverse
twin exists to refuse. When a chapter names a second measure, that is the benign case to write.
Floors: negative 106 -> 107, positive 67 -> 68.

`coverage-inventory.json` was re-derived (`tools/repair_r7_derive_inventory.py`); `canonical_values`
moved 185 -> 186. **A new value type is not a hand edit** --- the inventory is derived and the
validator recomputes it, so adding one without re-deriving fails the run, which is how this was
caught rather than noticed.

---
## F6R-02 --- the cost of editing `validate_contracts.py` is a convention, and now says so

No new name. One note in the RC5-01 comment block, and it is about **this file** rather than
about the contracts.

Several comments in `validate_contracts.py` treat editing it as a heavyweight act --- *two edits a
reviewer sees*, *a decision that should read like one*. **Measured 2026-09-14 rather than
asserted:**

```
node scripts/classify.mjs docs/vision-system/planning/specification/contracts/validate_contracts.py
  -> tier=trivial - enforcement=shadow, matched docs/**, floor=trivial
```

Every path in this package is `docs/**`, so the risk tier this file's own edits attract is
**trivial**, and the oracle that computes it **does not block**. The expense is a **review
convention, not an enforced tier.**

That is not an argument for weakening it --- the convention is why the literals in this file are
worth writing. It is an argument against **citing** it as though something outside the file
guaranteed it. **A rule enforced only by the sentence asserting it is a wish**, and a package whose
whole subject is the difference between those two should not confuse them in its own margin.
Raising the tier is a `.claude/qa-tier-floor.yml` change, outside this package's scope; that file
was **not** touched.

---
## RC4-07 --- `census_keys`, declared twice on purpose

| name | kind | where |
|---|---|---|
| `census_keys` | JSON key (string array, 8 members) | `pinned-conjuncts.json` |
| `census_keys_why` | JSON key (string) | `pinned-conjuncts.json` |
| `CENSUS_KEYS_PINNED` | derived set | `validate_contracts.py` |
| `census_keys` | `HAND_WRITTEN_CONTROLS` row, `literal` form | reported in the verdict |

**The "or" branch the previous lane identified, taken.** `CENSUS_KEYS` was a literal in
`validate_contracts.py` and nowhere else --- the set of fields the demand walk's census must carry,
declared exactly once, **in the file that also decides whether it carries them.** Dropping
`under_negation` from the literal and from the check is a single hunk, after which the verdict goes
on printing a census that looks complete.

**Why this one matters more than its size suggests:** every `demanded` in this package means
whatever the demand walk decided, and the census is **the only thing in the verdict that says how
far that walk reached**. A quietly narrowed census is a quietly narrowed coverage claim, wearing a
pass. Same shape as `ADMISSIBLE_LITERAL` against `#/admissible_ancestors`: two files, two edits, and
a diff that names what was dropped.

It also joins `HAND_WRITTEN_CONTROLS` --- **RC5-01's whole point is that the two unbudgeted tables
were found by reading, and what made them findable-only-by-reading is that neither appeared in the
verdict.** A control that prints no count is one a reviewer has to know to go looking for.
`HAND_WRITTEN_CONTROL_KEYS` gains `census_keys`, so a future deletion of the row **fails** rather
than going quiet.

Fixtures: `negative/r32-census-key-set-narrowed-in-the-pin` narrows one side only, which is exactly
what was invisible before; `positive/r32-census-key-set-reordered-benign` keeps the comparison a
**set** comparison. Floors: negative 107 -> 108, positive 68 -> 69.

---
## F6R-04 --- the F6D-07 note: a hand edit surfaces as drift first

No new name. One note at the end of the F6D-07 block, recording **what a reader actually sees**
when either of those two enums is edited by hand.

Both are reachable from a derived artifact, so a hand edit trips the **derivation oracle before it
reaches the concrete checks**. The first failure a contributor reads says *the committed file
differs from its derivation* --- true, and silent about control objects. They re-run the authoring
tool, the drift clears, and the rule that actually matters fires second. **If they get that far.**

The cure is known and already applied once: **F6C-11 placed its check physically above the
derivation oracle**, so a mutation reports the rule it broke rather than that something moved. The
note names that pattern at the site where the next reader will need it.

**Not applied to F6D-07 in this pass, and the reason is a rule rather than fatigue:** moving those
two checks means moving the `_configuration` and `ProtectedChange` schema lookups they depend on,
which is a **reordering of the file rather than an addition to it**, and a reordering with no
fixture behind it is a change nobody can review. Recorded as owed with the cure named --- which is
strictly better than leaving the next reader to rediscover it from a confusing failure message.

---
## F6R-03 --- `STEP6_ID`, and the ten findings that were in no table at all

| name | where |
|---|---|
| `STEP6_ID` · `STEP6_CORPUS` | `validate_contracts.py` |
| **A STEP 6 FINDING IS RAISED IN A REVIEW AND HELD BY NO SOURCE ROW** | the per-finding check |
| **THE STEP 6 SWEEP OF THE F2-06 REVIEWS RETURNED ALMOST NOTHING** | the floor under it (60; 64 found) |

**Measured before writing the check: of the 64 Step 6 ids stated across the F2-06 review documents,
TEN had no `finding_sources` row** --- `F6R-01`..`04`, `F6V-01`..`04`, `F6X-01`, `F6X-02`.

**Why that is worse than being unanswered.** `finding_sources` is what a pin's citation resolves
against *and* what the unanswered partition is computed from. A finding missing from it is **not
counted as unanswered --- it is not counted at all.** Not refused, not deferred, absent. And two of
the ten are findings **this lane repaired two commits earlier**: the repair could have landed, the
verdict stayed green, and no coverage table would have mentioned the finding in either direction.

### The shared `FINDING_ID` pattern is deliberately NOT widened

`FINDING_ID` drives pin-citation resolution and the `unpinnable` machinery, so adding `F6R-` and
`F6V-` to it demands a pin or an `unpinnable` row for each in the same edit. This lane has not
established that for the **F6V** family, which is raised against the *prose* layer. The comment
above `FINDING_ID` already says why this matters --- *a required set that is wrong is abandoned
rather than fixed* --- so the sweep here is **its own pattern over its own corpus**, asserting the
one thing F6R-03 asks for. **The gap in the shared pattern is recorded, not closed**, because
closing it has consequences this lane cannot verify.

### Where the ten landed, and one correction worth reading

`F6X-01` and `F6X-02` were first put in `answered_elsewhere` --- and **the partition check refused
them**, reporting them *declared but not unanswered*. They are carried by pins, so they are not in
the unanswered set at all, and the partition is over exactly that set. **The instrument caught a
wrong classification by its author in the same session.** They keep their source rows and hold no
partition row.

| bucket | added | total |
|---|---|---|
| `answered_elsewhere` | `F6R-03` | 3 |
| `not_answered` | `F6R-01`, `F6R-02`, `F6R-04`, `F6V-01`..`04` | 39 |

**`F6R-02` and `F6R-04` are in `not_answered` although this lane answered both.** Each is answered
by a **note, not by a check**, and writing a `check` value for a comment would commit F6R-02's own
error --- treating a convention as an enforced thing. The reason string says so.

Ceilings moved with the set: `FINDING_SOURCE_FLOOR` 106 -> 116, `UNANSWERED_CEILING` 37 -> 42,
`NOT_ANSWERED_CEILING` 32 -> 39, `ANSWERED_ELSEWHERE_CEILING` 2 -> 3. **The unanswered count going
UP is the honest result here:** ten findings that were invisible are now counted, and most of them
are counted as not answered.

---
## Decisions returned to the orchestrator --- not taken by this lane

Each of these is a choice about what the system IS, not a repair. A builder that takes one of them
to turn a check green has written specification by side effect, and the check will then be cited as
evidence for it.

### 1. F6D-09's determinism conjunct --- needs a classification that does not exist

The review asks for *"a conjunct asserting each named precondition predicate's registered
`implementation_status` is deterministic"*, and for `precondition_predicate_ids` to be typed against
the deterministic subset. **Measured, twice, by two lanes: `implementation_status` takes exactly ONE
value across all 2,397 predicates** --- `specified; conformance interpreter only, no production
binding implemented`. There is no deterministic subset because there is no classification at all.
Writing the conjunct now makes it true of every predicate by construction (the `r16-08` anti-shape:
a guard that collects the evidence and never applies it), and typing a field against a subset that
is the whole set constrains nothing.

**The decision required:** whether every registered predicate is to be classified
deterministic-or-model, and by whom. That is 2,397 judgements about what the registry means.
**Until it is taken, the F6D-09 tripwire is the right artifact** --- it fires the moment a second
value appears, which is the moment the conjunct becomes writable, and step 0 above narrowed it at
the value and strengthened it rather than deleting it.

### 3. F6C-06 --- whether `CapacityObservation.payload.measure` gets typed

The field is still `string`. Retyping it to `CapacityMeasure` would assert that `cache_lifetime` is
the **only** capacity measure, which is false --- `07` section 6 observes allowances too, it simply
never names what they measure. **The decision required:** whether the chapters state the full set of
capacity measures, at which point the field is typed against it and the vocabulary becomes a closed
enum like `boundary_kind`. Until then a registered, chapter-checked vocabulary that the field is not
yet typed against is the most that can be said without inventing the rest.
### 2. F6X-01's three kernel paths --- resolvable is not specified

`KERNEL_FACTORY_PATHS` makes the three declarations resolve and deliberately does not say what they
guarantee. **The decision required:** whether the kernel and witness surfaces get specified as
contracts of their own, or stay a named boundary this package points at. Registering them as
commands to close the finding would invent three contracts; the literal is the smallest honest
placeholder, and it is loud rather than silent.

---
## What this lane did NOT land, and exactly where it stopped

Dispatched against **18** findings. Landed **five** — F6A-10, F6D-12, F6D-09, F6C-11, F6C-10 — plus
**F6R-01's structural half**, which the other thirteen also need. It stopped on turn budget, not on a
blocker. Every finding below is **not-done** and every one is still in
`pinned-conjuncts.json#/not_answered` (32 entries), which is where a resumer starts.

**Verification actually performed, stated narrowly.** `CONTRACTS_FIXTURE_RUN=1 python3
validate_contracts.py` — the full deterministic suite with the **fixture runs skipped** — was run after
every step above and passed every time. **The ten new fixtures have never been executed.** Whether each
adverse one is refused *for its stated reason*, and whether each benign one passes, is **unverified**.
The full `python3 validate_contracts.py` was not run.

### Three facts a resumer needs, none of them in any README, each of which cost this lane turns

1. **`Write`/`Edit` are refused in this worktree.** The hook scopes them to
   `…/.worktrees/ceo-4-1789314685`; this tree is `…/.claude/worktrees/agent-…`. **Bash writes are not
   scoped.** Every repo edit here was made by a Python script invoked from Bash. This is the
   `Bash`-vs-`Write` divergence the root `CLAUDE.md` documents, hit for real.
2. **A `criterion.*` body may not be hand-edited.** Criteria are authored by `tools/phase_content.py`
   behind a drift oracle; a conjunct lands by editing the derivation and re-running
   `tools/author_phase_content.py .`. The DSL is documented above `def spec`. This lane added two codes
   to it — `ltF` (F6C-11) and `ltCount` (F6C-10) — because **it had no comparison operator at all**,
   which is most of why 33 of the 46 criteria on the fifteen new records compare nothing.
   **`guard.*` bodies are NOT derived** and may be patched directly.
3. **`author_phase_content.py` authors CRITERIA, not EDGE PREDICATES.** Adding a lifecycle phase
   therefore needs `edge.<Record>.<from>.<to>.v1` written by hand, which the oracles are built to
   refuse. This is what stopped F6C-10's park phase, and it will stop any other new phase.

### The thirteen, with the analysis already done

- **F6C-13** — take `WorkOrder` (the review's first branch). `critical_fields` is optional on
  `WorkflowDefinition`/`StepExecution` and in zero predicates. The two fields to add are
  `critical_fields: JsonPointer[]` and `critical_fields_authority_ref: Ref<ResponsibilityAssignment>`,
  both required. The authorship rule — *"the capability owner at procedure admission, never the
  resuming attempt"* — is expressible today as `neq(critical_fields_authority_ref,
  owner_assignment_ref)` plus `related_phases(critical_fields_authority_ref → accepted)`; the envelope
  `owner_assignment_ref` is the work order's own current owner, i.e. the party resuming it. That needs
  a `neqF` DSL code, a two-line mirror of `eqF`.
- **F6X-01** — the three unresolvable values are `kernel.commit_group` (`DomainEvent`),
  `witness.store_group` (`DurabilityReceipt`), `kernel.apply_transition` (`LifecycleStatus`).
  `command-registry.json` has six `kernel.*` commands and **zero** `witness.*`. These are kernel paths,
  not record-level commands: "register them" invents command contracts, "retire them" deletes a real
  containment. **A recheck should see that tension stated**, which is why it is written here undone.
- **F6X-02** — blocked on the chapter. `05` §5 must state the closed `boundary_kind` set first;
  `ConstraintSet.boundary_kind` is a free string and `OperatorProjection` has no contested-refs field.
- **F6A-09** — the analysis is settled and **is not "remove both keys"**. `ConsequenceVector` is a live
  **value-registry** type and its alias row is a genuinely **wrong mapping** → remove that key.
  `CapacityState` is prose-only, its mapping is correct, and **F6D-10 withdrew half a finding because
  that row exists** → keep it and fix `how_to_read`, which is the thing that is actually false. Then
  extend the declared check to value-registry names. Alias floor is 20, the table has 26.
- **F6C-06** — `cache_lifetime` as a registered `CapacityObservation` measure in `value-registry.json`,
  plus the `07` §5 pointer.
- **F6C-12** — naming only. `AdmissionRecord` **already declares** the `escalated` phase, so this is
  one sentence in `05` §6 plus a check that "awaiting-principal" appears nowhere in the chapters.
- **F6D-08** — the genuine half is real and should be credited: `ArmedSet.registration.
  permitted_commands` is `[]` and **zero of 105 commands name `ArmedSet`**. The other half stands:
  `owner_component` is `S1-C02`, the admission authority its own invariant excludes.
- **F6D-05** — the two load-bearing guards and `guard.interest.precondition_invokes_no_model`. Note
  that F6D-09 has already closed part of the third one: `precondition_evaluator_kind` is now a closed
  enum, so the guard's comparand is constrained even though the rebinding to `current_owner` is not
  done. **The `05` §1 vs `SkillVersion.owner_component` contradiction is untouched.**
- **RC4-07** — `CENSUS_KEYS` is a literal in `validate_contracts.py`. The "or" branch worth taking is
  pinning the key set in `pinned-conjuncts.json` and comparing the two, exactly the shape
  `ADMISSIBLE_LITERAL` already uses, and adding a `census_keys` row to `HAND_WRITTEN_CONTROLS`.
- **F6R-03** — assert every Step 6 id swept out of the `F2-06-*` review documents is a key of
  `finding_sources`. The sweep machinery already exists (`swept_findings`, `FINDING_ID`,
  `FINDING_CORPUS`); the regex covers `F6[A-D]-\d{2}` and `F6X-\d{2}` and **not** `F6R-\d{2}`.
- **F6R-01** — the structural half **is done**. What remains is reclassification: 32 findings sit in
  `not_answered` conservatively, because this lane would only write `answered_elsewhere` rows whose
  file and check it had actually verified. Each one a later lane verifies moves across and lowers
  `NOT_ANSWERED_CEILING`.
- **F6R-02** — one sentence in the RC5-01 comment block recording that
  `validate_contracts.py` is `trivial` under `.claude/qa-tier-floor.yml` and that the expense of
  editing it is a **review convention, not an enforced tier**. Do not edit the tier floor.
- **F6R-04** — **already acted on, in F6C-11.** That finding's check reads the criterion body and is
  placed ABOVE the derivation oracle precisely so a mutation reports the concrete rule rather than the
  drift. What remains is the note in the F6D-07 block saying a hand edit surfaces as drift first.

### Owed beyond the eighteen, recorded on request and NOT acted on

- **F6B-03 (owed).** The independent recheck found that **nothing binds an acceptance's calibration to
  the checker that produced the verdict** — `AcceptanceInterval` carries no checker identity. So an
  acceptance can be written against a calibration belonging to a different checker, and
  `r18-acceptance-on-an-uncalibrated-checker` does not reach it: that fixture is about a calibration
  being absent, not about it belonging to someone else. Recorded here so it is a known gap rather than
  a future discovery; no change was made for it.


---
# Lane r7-contracts-c — resumed at `41c51c7` on `builder/f2-r7-contracts-c`

Same standing caveat as the head of this file: author-recorded, one model family, no runtime, every
"check" is offline over the committed registries. The light validator
(`CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py`) was run after every finding below and
exited 0; **the full validator, which executes the fixtures, was NOT run by this lane** — so each new
fixture is declared and unexecuted, exactly as the previous lane recorded of its ten.

## F6C-13 — `critical_fields` and the authority that marked them

*Required contract (C:359–366): record the marking on the `WorkOrder` **or** the `FieldAuthority`, with
the authorship rule — capability owner at procedure admission, never the resuming attempt — as a
predicate rather than prose.*

**Branch taken: `WorkOrder`.** `FieldAuthority` is not a registered record kind; `WorkOrder` is, it is
the subject AT-M1-02 names first, and admission is the moment R-D18 fixes the authority at. Putting it
on a new record would have invented a kind to hold one field.

| name | kind | where |
|---|---|---|
| `critical_fields` | payload field, `JsonPointer[]`, **required** | `record-registry.json` → `WorkOrder.fields.payload` (`type_fields`, `required_fields` and `fields`) **and** `records.schema.json#/$defs/WorkOrder/properties/payload` |
| `critical_fields_authority_ref` | payload field, `Ref<ResponsibilityAssignment>`, **required** | the same two halves |
| `guard.workorder.critical_fields_authority_excludes_the_resuming_attempt` | guard predicate (3 conjuncts) | `predicate-registry.json`, and in `values.schema.json#/$defs/PredicateId` (2,397 → 2,398) |
| the `call` on the admission edge | edge conjunct | `edge.WorkOrder.proposed.admitted.v1`, demanded, beside the criterion call |
| pin on the guard body (3 require rows) | pin | `pinned-conjuncts.json#/pins` |
| the attachment row | pinned attachment | `pinned-conjuncts.json#/pinned_attachments` — guard → `[edge.WorkOrder.proposed.admitted.v1]` |
| `r33-critical-fields-authority-may-be-the-resuming-attempt` | negative fixture | `fixtures/negative/` |
| `r33-critical-fields-guard-conjuncts-reordered-benign` | positive fixture | `fixtures/positive/` |

**The rule, as three conjuncts rather than one sentence.** `nonempty_fields` on both new pointers (the
marking and its author are named at all); `not(eq(critical_fields_authority_ref,
owner_assignment_ref))` — the envelope owner is the party resuming the work, so equality here IS
"marked by the resuming attempt"; and `related_phases(critical_fields_authority_ref → accepted)` — a
ref to a `proposed` or `expired` assignment names an authority that does not hold. The middle one is
the finding's whole content and is the one the adverse fixture removes.

**Pinned on the GUARD BODY, attached on the EDGE — two pins, deliberately.** The first draft pinned the
three conjuncts on `edge.WorkOrder.proposed.admitted.v1` and the validator refused it with
`PINNED CONJUNCT MISSING`: pin rows are matched against the named predicate's **own** body and calls
are not inlined. That refusal is the instrument being right — F6D-01 already measured that a conjunct
pin says nothing about whether any edge calls the guard (thirty detachments, thirty undetected), which
is why `pinned_attachments` exists and why this repair uses both halves.

**Fixture pair, and why the adverse one unwraps a `not`.** Removing the call would be caught by the
attachment table, which is F6D-01's control and not this finding's. The adverse fixture instead
replaces `not(eq(…))` with `eq(…)`: the guard still reads both fields, still looks like enforcement,
and admits exactly the party R-D18 excludes. The benign fixture reverses the three conjuncts and must
pass — the pin is containment, not byte order.

**Derived surfaces re-run, not hand-edited:** `tools/repair_r7_derive_inventory.py` (the new guard
enters `coverage-inventory.json`) and `tools/author_phase_content.py .` — two WorkOrder criteria
(`admitted`, `accepted`) drift the moment a required payload field is added, and the drift oracle
caught it before this lane thought to.

**Floors moved.** `PIN_FLOOR` 70 → 71 · `PIN_ROW_FLOOR` 154 → 157 · `PIN_ATTACHMENT_FLOOR` 39 → 40 ·
`NEGATIVE_FIXTURE_FLOOR` 108 → 109 · `POSITIVE_FIXTURE_FLOOR` 69 → 70 (both also in the two
`MANIFEST.json` files, with the reason in `floor_why`) · `UNANSWERED_CEILING` 42 → 41 ·
`NOT_ANSWERED_CEILING` 39 → 38, because F6C-13 is now pin-carried and the partition check refuses a
pinned id in `not_answered`.

**Chapters: nothing owed.** `05` §3 R-D18 already states the rule in the words the guard now encodes;
the contracts were behind the chapter, and this closes that direction.

**Owed: nothing for this finding.** Stated narrowly: the two fixtures are declared and **have never
been executed** — whether the adverse one fails for its stated reason is unverified by this lane.

---
## F6D-08 — a computed projection's emptiness, pinned; `owner_component` read as custodian

*Required contract (D:354–390): a registry-level assertion that `permitted_commands` is empty for
computed projections, pinned by hand like `pinned_transitions`; an `owner_component` for `ArmedSet`
that is not the admission authority **or** an explicit statement that on a derived projection
`owner_component` means custodian rather than writer; and a named evaluator binding.*

**Branch taken on clause 2: the custodial statement, not a new owner.** Reassigning
`ArmedSet.owner_component` away from S1-C02 decides which component owns the armed set — that is a
choice about what the system IS, and the kind of decision this file's last section returns to the
orchestrator rather than taking to green a check. The custodial reading is stated in two places: the
record's own `owner_assignment` prose in `record-registry.json`, and `computed_projections_why`.

| name | kind | where |
|---|---|---|
| `computed_projections_why` · `computed_projections` | JSON keys | `pinned-conjuncts.json` — 5 rows: `ArmedSet`, `AccessGraph`, `DomainEvent`, `OperationStatus`, `OperatorProjection` |
| `computed_projections_with_writers` | JSON key | the same file — the **two** exceptions, `DependencyClosure` and `IndexSnapshot`, each with its command list mirrored from the registry |
| `record` · `evaluator_modules` · `transition_count` · `why` | row keys (refused if others appear) | `computed_projections` |
| `COMPUTED_PROJECTIONS` · `PROJECTIONS_WITH_WRITERS` · `COMPUTED_PROJECTION_FLOOR` (5) · `COMPUTED_PROJECTION_KEYS` · `PROJECTION_WRITER_KEYS` · `REGISTERED_MODULES` | validator names | `validate_contracts.py` |
| `A COMPUTED PROJECTION HAS A PERMITTED COMMAND` | check (m4's refusal) | `validate_contracts.py` |
| `A COMPUTED PROJECTION GAINED A LIFECYCLE TRANSITION` | check | the second write path |
| `A PROJECTION'S EVALUATOR IS NOT A REGISTERED MODULE` | check | binds `evaluator_module` to a `planned_module` that exists |
| `A DECLARED PROJECTION WRITER SET CHANGED IN ONE PLACE` | check | the two exceptions are a two-place edit |
| `A PROJECTION RECORD IS IN NEITHER HALF OF THE PARTITION` | check | completeness over `lifecycle.projection` |
| `computed_projections` | `HAND_WRITTEN_CONTROLS` row | so the count and floor appear in the verdict |
| `r34-armed-set-gains-the-three-kernel-record-commands` | negative fixture (**m4 verbatim**) | `fixtures/negative/` |
| `r34-computed-projection-table-reordered-benign` | positive fixture | `fixtures/positive/` |

**Why a hand-written partition and not a rule over the flag.** Seven records declare
`lifecycle.projection: true`. **Five carry no permitted command; two — `DependencyClosure` and
`IndexSnapshot` — carry the three kernel record commands.** A blanket "projections are empty" rule
would have been false about its own tree on the day it was written, which is how a control gets
deleted rather than fixed. The two exceptions are therefore *declared*, with their command lists
mirrored so widening one takes two edits. Completeness runs the other way too: a record that declares
the flag and appears in neither list fails.

**The no-transition clause was WRONG in this lane's first draft, and the validator said so.** It
asserted `transitions == []` for all five; `AccessGraph` has **8**, `OperationStatus` **6**,
`OperatorProjection` **12**. The clause now pins each count (`transition_count`) and refuses a
*change* — an edge added to a projection is the second write path the finding names, and the three
that already have edges are recorded rather than pretended away. `ArmedSet` and `DomainEvent` are at
0 and the pin holds them there.

**Clause 3, the evaluator binding, stated narrowly.** `evaluator_modules` for `ArmedSet` is the
one-member closed set `["system/packages/work/armed-set"]`, and every member must be a
`planned_module` registered on some record (23 distinct ids in the registry). That answers *"a named
evaluator binding"* in the "state its closed set" direction. It does **not** make the creation path
executable — no runtime exists — and the W8 observation that nothing *creates* an `ArmedSet` remains
true of the specification.

**Floors moved.** `NEGATIVE_FIXTURE_FLOOR` 109 → 110 · `POSITIVE_FIXTURE_FLOOR` 70 → 71 (both
manifests too) · new `COMPUTED_PROJECTION_FLOOR` = 5.

**Chapter sentences owed**
- **`05` §7 (F6D-08).** One sentence stating that on a derived projection `owner_component` names the
  **custodian** and not a writer, so that the section's own invariant — "the admission authority holds
  no write access to any precondition-bearing kind" — and `ArmedSet.owner_component: S1-C02` are read
  as consistent. The contracts now say this in `record-registry.json` and `pinned-conjuncts.json`; the
  chapter does not. **This lane owns no chapter file** (04/05/07 are another lane's), so it is recorded
  here rather than written.

**Owed: nothing else for this finding.** The two fixtures are declared and were **not executed** by
this lane.

---
## F6D-05 — a positive control may not be owned by the party it controls (PARTIAL, and the remainder is named)

*Required contract (D:230–272): rebind `guard.skill.declared_grant_inert`,
`guard.launcher.stripping_positive_control` and `guard.interest.precondition_invokes_no_model` so the
field each reads is written by a party the producer cannot author — IdentityBinding / `current_owner`;
and resolve the `05` §1 vs `SkillVersion.owner_component` contradiction.*

**What landed: the field-level ownership half.** Each control field now declares an `owner` that is
**not** the record's producer, in the registry and in a pinned table, and a check refuses the edit that
hands it back.

| name | kind | where |
|---|---|---|
| `owner: "S1-C04"` on `declared_tool_grant_effect`, `grant_stripping_probe_result`, `grant_stripping_probe_ref`, `content_hash_rechecked_at_use` | per-field owner (was absent) | `record-registry.json` → `SkillVersion.fields.payload.fields` (record owner `S1-C03`) |
| `owner: "S1-C04"` on `precondition_evaluator_kind` | per-field owner | `StandingInterest` (record owner `S1-C02`) |
| `producer_unauthorable_fields_why` · `producer_unauthorable_fields` (5 rows) | JSON keys | `pinned-conjuncts.json` |
| `record` · `field` · `owner` · `guard` · `why` | row keys, others refused | the same table |
| `UNAUTHORABLE_FIELDS` · `UNAUTHORABLE_FIELD_FLOOR` (5) · `UNAUTHORABLE_FIELD_KEYS` | validator names | `validate_contracts.py` |
| `A POSITIVE CONTROL IS OWNED BY THE PARTY IT CONTROLS` | check | the finding's sentence, as a refusal |
| `A DECLARED CONTROL FIELD IS NOT READ BY THE GUARD THAT DECLARES IT` | check | so a row cannot pin an ownership nothing evaluates |
| `producer_unauthorable_fields` | `HAND_WRITTEN_CONTROLS` row | count and floor in the verdict |
| `r35-grant-stripping-probe-owned-by-the-skill-it-probes` | negative fixture | `fixtures/negative/` |
| `r35-control-ownership-table-reordered-benign` | positive fixture | `fixtures/positive/` |

**Why S1-C04, and it is a reading rather than a chapter statement.** `02` §4's IdentityBinding is what
the finding names as the expressible binding, and `IdentityBinding.owner_component` is **S1-C04** — so
the enforcement point that runs the probe is C04 and the skill that is probed is C03. A recheck should
treat the component choice as this lane's inference, not as something the chapters say.

**The registry side of the contradiction is resolved; the record-level owner is untouched.** `05` §1
says C03 executors remain outside writable registry state while `SkillVersion.owner_component` is
`S1-C03` with `authorization.write: "only named owner"`. The **probe-result fields are no longer
C03's**, which is the half a field-level owner can carry. Changing the record's owner would decide who
owns skill records — a decision this lane does not own.

**OWED, and stated as owed rather than faked.**
1. **The guard-body rebinding itself.** The three guards still read scalars on their own subject
   record; what changed is who the registry says writes those scalars. Expressing *"this field was
   written by C04"* as a **predicate** needs an `IdentityBinding` ref on `SkillVersion` /
   `StandingInterest` and a phase to bind it in, and neither the ref nor the phase is fixed by any
   chapter. Inventing them is specification by side effect. The finding classifies itself **(b) —
   "recorded with its verification owed"** — and this is exactly that residue.
2. **`current_owner` in these three guards.** The operator exists and is used on edges; using it here
   asserts the *acting party* is the current owner, which is a different claim from non-authorability
   of a field. Not added rather than added decoratively.

**Chapter sentences owed** (this lane owns no chapter file — 04/05/07 are another lane's):
- **`05` §1.** State that the grant-stripping probe result and the grant-inertness flag are written by
  the **enforcement point**, not by the skill record's producer, so that "C03 executors remain outside
  writable registry state" and `SkillVersion.owner_component: S1-C03` stop contradicting each other.
  One sentence; the contracts now hold the other end of it.
- **`05` §7.** The `ArmedSet` custodial sentence from F6D-08 above.

**Floors moved.** `NEGATIVE_FIXTURE_FLOOR` 110 → 111 · `POSITIVE_FIXTURE_FLOOR` 71 → 72 (both
manifests) · new `UNAUTHORABLE_FIELD_FLOOR` = 5.

---
## Decisions returned to the orchestrator by lane r7-contracts-c

- **F6D-09's determinism conjunct — untouched, as briefed.** It stays where the previous lane left it.
- **Which component owns `SkillVersion`.** F6D-05's contradiction has a second resolution — move the
  record's `owner_component` off S1-C03 — which this lane did not take. That is a decision about who
  owns skill records.
- **`ArmedSet.owner_component`.** Same shape: the custodial reading was taken because the alternative
  assigns the record to a different component.

## What lane r7-contracts-c did NOT land

**F6R-01's remainder (the 32 `not_answered` rows), F6C-10's park phase, F6C-11's `retention_span`
primitive and F6B-03's `checker_identity_ref` were NOT started.** The lane spent its budget on the
three findings above. `not_answered` stands at **38** (F6C-13 left it by being pinned); every other
row a resumer finds there is untouched and is still the right place to start.

**Verification, stated narrowly.** `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` — the
deterministic suite with the **fixture runs skipped** — exited 0 after each of the three commits.
**The six new fixtures have never been executed.** The full `python3 validate_contracts.py` was not
run by this lane, and neither were the node verifiers.

---
## F6R-01 remainder — TWO rows moved, THIRTY left, and the thirty are left deliberately

*Asked of this lane: for each of the 32 pre-existing `not_answered` rows, either move it to
`answered_elsewhere` with the file and the check that answers it — **only where you can point at the
check** — or leave it and say so.*

**Moved: one.** `F6D-08` → `answered_elsewhere`, citing
`planning/specification/contracts/validate_contracts.py` and the five checks this lane wrote for it by
name, plus the r34 fixture pair. The row is honest about what is NOT in it: the `05` §7 custodial
sentence is owed.

**Annotated and deliberately NOT moved: one.** `F6D-05` keeps its `not_answered` row, rewritten to say
that the ownership half is checked and the guard-body rebinding the review actually asked for is not.
**A row moves when the check answers the finding, not when it answers part of it** — the alternative is
a coverage table that reads as closed over work that stopped halfway, which is the failure mode this
whole partition exists to prevent.

**F6C-13 left the set earlier, by being pinned** — the partition refuses a pin-carried id, so pinning
it was the move.

**Left, with the reason: the other thirty.** This lane verified no check for them. The rule the previous
lane set — *write `answered_elsewhere` only for a file and a check you have actually verified* — is the
right rule, and the honest report is that thirty rows did not get that verification rather than that
thirty findings are unanswered. A resumer starts there.

**Ceilings moved to match, in the direction the work went:** `ANSWERED_ELSEWHERE_CEILING` 3 → 4,
`NOT_ANSWERED_CEILING` 39 → 38 → **37**. `UNANSWERED_CEILING` stays at 41: `unanswered` is computed
from pin coverage, and moving a row between the two halves of the partition does not change it.
