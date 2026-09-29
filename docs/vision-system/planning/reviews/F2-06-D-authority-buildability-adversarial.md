> Archival provenance — 2026-09-14: Step 6 independent review of the F2 re-specified layer, dimensions **W6 authority as boundary · W8 buildability · W10 adversarial robustness**, against the frozen F2 protocol (`26af5d5` + AM-01), on frozen subject `8f6c2c2` (git archive). Preserved verbatim from the reviewer engine's report file; its mutation evidence (`sweep-results.txt`, `sweep/`) stayed in the reviewer's scratch. The reviewer wrote nothing in Steps 1–5 and read no selection record or self-assessment; it ran the full validator (exit 0, 40m44s, 299,177 checks, 53/53 adverse, 17/17 benign) and then detached each of the 30 new guards from its edges and deleted three whole edges. Same model family as every author; independence is procedural only. Archival is not acceptance.
>
> **Judgments:** W6 **insufficient** · W8 **insufficient** · W10 **insufficient**. **Headline (measured):** 30 of 30 new guards can be detached from every edge that calls them with the validator exiting 0, and three load-bearing edges can be deleted silently — pins hold bodies and `Fulfillment`/`SalesAgreement` edge existence, nothing pins attachment. Two guards are wrong as written (`subset` + equal counts is not set equality: `readset.delivered_equals_declared` and `derivation.recompute_matches` both pass a defeating input). **Three (d)**: `declared_grants` is free strings read by nothing against a grant policy that does not exist; six C5 control objects are prose with no `ProtectedChange` edge; `EffectIdentity`'s join-don't-race is an optional field nobody reads.

# Step 6 independent review — W6 (authority as boundary) · W8 (buildability) · W10 (adversarial robustness of the work layer)

## Provenance

Subject: commit `8f6c2c2` of the `ceo-4-1789314685` worktree, read from a frozen archive extraction at
`subject/docs/vision-system` (the working tree's `contracts/` is under repair by another lane and was not
read). Protocol applied: `planning/F2/00-acceptance-protocol.md`, frozen 2026-09-13 at `26af5d5`, plus
amendment AM-01 (F-4 gains a paired clean case).

I wrote nothing in Steps 1-5. Independence here is **procedural only**: I share one model family with every
author of the subject. I did not read `docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`,
`PLANNING-REPORT.md`, `planning/F2/05-selection-record.*`, any candidate's section 11 or 12, other Step 6
reviewers' scratch, or the `status` fields of `registers/review-findings.json`. Where the subject says "the
launcher closes this" or "the guard refuses", I found the guard, mutated it, and ran the validator.

Standing caveat, which nothing below discharges: **no runtime exists.** Every judgment here is about
specified behaviour checked offline. Nothing in this review establishes runtime conformance, deployment
readiness, or that any of this works.

## Instrument: what I measured with

Mutation harness: `mutate.py`, which imports `tools/run_negative_fixtures.py` and calls its own
`execute_fixture()`, so my mutations get byte-identical scratch-tree construction to the suite's. Each run is
about 28 s (`CONTRACTS_FIXTURE_RUN=1`, so the nested fixture suites are skipped; that is the right unit for
"does the validator notice this mutation").

**Baseline, full run on the frozen archive: exit 0, `status: passed`, 40 min 44 s wall clock.**

| | |
|---|---|
| checks | 299,177 |
| records | 188 |
| values | 185 |
| commands | 105 |
| predicates | 2,387 (30 of them `guard.*`) |
| edges | 1,346 |
| source work edges | 373 |
| required subjects | 46 |
| **negative fixtures rejected** | **53 of 53** |
| **positive (benign) fixtures passed** | **17 of 17** |
| conjunct walk: slots classified / refused | 10,923 / **0** |

The suite is in good order on its own terms: every adverse fixture is rejected, every benign one passes, and
the positive floor of 17 is met exactly. Read the 53 narrowly. **15 of the 17 r16 fixtures - the ones for this
amendment - mutate a guard's *body*, and none mutates a guard's *attachment*.** That is the gap F6D-01
measures.

---

## F6D-01 - (a), with a (d)-class consequence - Every one of the thirty new guards can be DETACHED from the edge it guards and the validator stays green. 30 of 30.

**Governing requirement.** Protocol section 1 ("when a validator reports green, mutate an input and confirm
it can fail"); section 5 items 6, 7, 8; W8 ("no foundational choice left to construction"); W10.

**Passage.** `contracts/predicate-registry.json` - the 30 `guard.*` predicates. Each is invoked from one or
two edge predicates through an inline `{"op":"call","predicate_id":"guard...."}` conjunct.

**The attack.** Delete the `call` conjunct from the edge body. Leave the guard definition itself untouched,
byte for byte.

**Measured.** One detachment fixture per guard, every call site of that guard removed, thirty runs:
**30 undetected (exit 0), 0 caught.** Table at `sweep-results.txt`, per-run output under `sweep/`.

**Why the suite misses it.** `pinned-conjuncts.json` holds 57 pins: 47 `kind: guard`, 8 `criterion`, 2
`edge`. A guard pin asserts what the guard's *body* must demand. The file says so itself, in
`pinned_transitions_why`: *"A conjunct pin holds a guard to what it must DEMAND. It says nothing about
whether the edge exists at all."* The authors saw the adjacent case (edge deletion, RC-01) and pinned six
transitions for it - **all six are on `Fulfillment` and `SalesAgreement`; not one of the fifteen WORK-1.1
records has a pinned transition, and no pin of any kind asserts that edge X calls guard Y.**

The seventeen r16 adverse fixtures do not reach it either: **15 of 17 mutate a guard body** and are caught by
the corresponding conjunct pin; the other two (`r16-07`, `r16-15`) mutate an *inline* conjunct on an edge that
carries its own `kind: edge` pin. **Zero of seventeen mutate an attachment.**

**Path to harm.** Every W6 and W10 defence this amendment adds is reached only through that conjunct.
Detaching `guard.class.no_total_rank` and `guard.class.reached_set_gates_all` restores AT-M4-02: the
reached-set gate collapses and C2's human requirement becomes droppable on an action that is both C2 and C3.
Detaching `guard.criteria.author_not_in_producing_path` restores AS-X-01, the criteria channel. Detaching
`guard.skill.declared_grant_inert` with `guard.launcher.stripping_positive_control` restores the skill-grant
path (R2 F-08, R6 F7). Each is a one-line JSON deletion that the whole apparatus reports as passing.

**Detection.** None today. **Containment.** None today.

**Required contract.** A hand-written attachment table, in the same file and for the same stated reason as
`pinned_transitions`: `(predicate_id, guard_id)` pairs asserted to exist, never derived from the registry it
checks. Thirty rows minimum. Plus at least one adverse fixture whose patch is a detachment, so the class has
a counterexample in the suite rather than only a rule.

**Class.** **(a)** as a contract defect: the repair is mechanical and the specification is otherwise concrete
enough to implement. Its *consequence* for W6 and W10 is (d)-shaped, because with no attachment check whether
any named boundary is enforced is decided by whoever edits the registry next. I record it as (a) and name the
consequence rather than claiming a blocking (d) for a defect whose repair is one table.

---

## F6D-02 - (a) - "subset + equal counts" does not mean set equality, and no array in either schema is a set. The loader's read-set guard is bypassable by a duplicate.

**Governing requirement.** W5/W10 negative control 6 ("an *independent* reviewer fed the producer's rationale");
`05` section 3 ("the loader delivers the step's `declared_read_set` and records what it actually delivered;
the caller's claimed read list is not trusted"); section 9 adverse case 2.

**Passage.** `predicate-registry.json`, `guard.readset.delivered_equals_declared`, called from
`edge.ContextManifest.captured.admitted.v1`. Three conjuncts:

1. `nonempty_fields` on `/payload/declared_read_set` and `/payload/delivered_read_set`
2. `subset(declared, delivered)`
3. `eq(count(declared), count(delivered))`

**The counterexample.** The operator semantics are registered, so this is derived rather than guessed.
`primitive-registry.json`: `subset` is *"Every exact typed member of left is in right; both finite arrays,
no coercion"* - element-wise, not multiset-wise. `count` is *"Exact finite array cardinality"* - it counts
duplicates.

```
declared_read_set  = ["/artifact", "/artifact"]
delivered_read_set = ["/artifact", "/producer_rationale"]
```

`subset` holds: the only distinct member of `declared` is `/artifact`, and it is in `delivered`. The counts
are 2 and 2. **The guard returns true, and the producer's rationale was delivered to the checker while the
loader's own record certifies that it was not.**

`records.schema.json` permits it: `declared_read_set` and `delivered_read_set` are
`{"type":"array","items":{"$ref":".../JsonPointer"}}` with no `uniqueItems`. **`uniqueItems` occurs 0 times
in `records.schema.json` (6.6 MB) and 0 times in `values.schema.json` (16 MB).** No array anywhere in this
contract is a set.

Note also the direction. The security property needed is `delivered subset-of declared` - nothing extra was
delivered. The guard asserts the converse, `declared subset-of delivered`, and relies on the count equality
to supply the other half. That is the load the duplicate defeats.

**Why this is the sharpest form of the finding.** The authors found this exact failure mode once. Pin 34, on
`guard.class.no_total_rank`, requires `unique` on `/payload/reached_class_ids` with the reason written out:
*"a set, not a list: a repeated class id is how a count-based gate check gets fooled."* They then did not
sweep the idiom. Six guards use `subset`; two pair it with a count-equality to mean set equality; neither of
those two carries `unique`.

**Path to harm.** Negative control 6 is defeated at the one place the design says it is detected - *"the
loader's record, not the checker's claim"* (section 9 adverse case 2). W5's two-arm comparison then measures
nothing, because both arms report the same manifest.

**Detection.** None. **Containment.** None.

**Required contract.** Either `uniqueItems: true` on both arrays plus `unique` conjuncts, or replace conjuncts
2 and 3 with a single symmetric equality over canonicalised sorted sets. Add an adverse fixture whose patch
plants the duplicate, and the paired benign case of a legitimate repeated pointer.

---

## F6D-03 - (a) - The same idiom in `guard.derivation.recompute_matches` lets a release proceed as `matched` having lost a reached class. This is AT-M4-02's harm through the recompute path.

**Governing requirement.** `05` section 11 (*"The class is recomputed inside the ordered release transaction,
on the frozen bytes, and a mismatch parks and never resolves downward"*); `02` section 4's restatement;
AT-M4-02.

**Passage.** `guard.derivation.recompute_matches`, called only from
`edge.ConsequenceDerivation.recomputed_at_release.matched.v1`. Conjuncts: `nonempty_fields`;
`subset(recomputed_class_ids, reached_class_ids)`; `eq(count(recomputed), count(reached))`.

**The counterexample.**

```
reached_class_ids    = ["C2", "C3"]     (admission-time derivation)
recomputed_class_ids = ["C3", "C3"]     (recomputed at release, on the frozen bytes)
```

`subset` holds - C3 is in reached. Counts are 2 and 2. The guard returns true, the record reaches `matched`,
and the release proceeds. **C2 has been dropped, so C2's human requirement on an outward disclosure is gone**
- which is exactly the harm AT-M4-02 names for a refund message that is both C2 and C3. The design refused a
total rank to prevent it and left an arithmetic route to the same place.

`parked_on_mismatch` - the state whose phase row says *"It never resolves downward"* - is simply not entered.

**Why the sibling guard is safe and this one is not.** `guard.class.reached_set_gates_all` uses the identical
idiom on `reached`/`gated`, but it is called from `edge.ConsequenceDerivation.computed.recomputed_at_release.v1`,
the *same edge* as `guard.class.no_total_rank`, which asserts `unique` on `/payload/reached_class_ids`. That
`unique` is what closes it. `guard.derivation.recompute_matches` is on the *next* edge, no guard on that edge
asserts `unique` on anything, and `recomputed_class_ids` is not `unique`-checked anywhere in the registry and
is not even in the payload's `required` list.

**Path to harm.** An outward economic effect releases without the gates of a class the admission-time
derivation reached. Detection: none - the record reads `matched`. Containment: none.

**Required contract.** `unique` on `recomputed_class_ids` and on `reached_class_ids` at this edge, or
symmetric set equality. Plus an adverse fixture planting the duplicate, paired with a benign recompute that
legitimately matches.

**Note on F6D-01 interaction.** F6D-02 and F6D-03 are defects in guards that are currently attached. F6D-01
says any of them can be detached without detection. The two classes compound: a repair that fixes the guard
bodies leaves the attachment unchecked, and a repair that pins attachments leaves these bodies wrong.

---

## F6D-04 - (a) - Whole lifecycle edges can be deleted from the new records with no detection, including the only park-on-mismatch route.

**Passage.** `record-registry.json`, `lifecycle.transitions` on the fifteen WORK-1.1 records.

**Measured.** Three edge deletions, one per fixture, validator run on each:

| mutation | edge removed | result |
|---|---|---|
| m5 | `ConsequenceDerivation: recomputed_at_release -> parked_on_mismatch` | exit 0, undetected |
| m6 | `AcceptanceInterval: in_acceptance -> rejected` | exit 0, undetected |
| m7 | `StandingHolder: staffed -> suspended` | exit 0, undetected |

**m5 is the consequential one.** With it removed, `recomputed_at_release` has exactly one outbound edge,
`-> matched`. The phase `parked_on_mismatch` - whose row in `05` section 10 reads *"It never resolves
downward"* - becomes unreachable, and a recompute that disagrees with the admitted class set has nowhere to
go but release. m6 makes acceptance a one-way door: `in_acceptance` exits only to `accepted`. m7 deletes the
state that section 12 says *"stops admission in that duty class"*.

**Why it is missed.** `pinned-conjuncts.json` has exactly 6 `pinned_transitions`, and all six are on
`Fulfillment` and `SalesAgreement` (findings RC-01, RC-08, G2-05, G2-02). **None of the fifteen WORK-1.1
records has a pinned transition.** The file's own preamble states the reason such pins are needed:
*"Deleting a transition is a one-line edit to record-registry.json that no check in this package noticed -
phase reachability is not checked."* That remains true; the earlier repair pinned the instances it found and
the new layer arrived without any.

**Required contract.** A `pinned_transitions` row for every edge whose absence changes a safety property -
at minimum the park-on-mismatch route, `in_acceptance -> rejected`, `staffed -> suspended`,
`AdmissionRecord: opened -> refused`, and `EffectIdentity: allocated -> claimed`. Better: a general
reachability check, since every phase documented in `05` section 10 is a claim that the phase is reachable.

---

## F6D-05 - (b) - Twenty-nine of the thirty guards read only fields on their own subject record, and in twenty-six the guard's owning component is the component that writes that record.

**Governing requirement.** `05` section 1: *"The consequence class of an action is computed from records the
acting party cannot author."* W6 (a component may not grant itself greater authority).

**Measured.** Classifying each guard by the operators in its body:

| property | count |
|---|---|
| guards using a cross-record operator (`related_phases`) | 1 of 30 |
| guards reading only scalars and arrays on their own subject record | 29 of 30 |
| guards whose `owner_component` equals the subject record's `owner_component` | 26 of 30 |

The single cross-record guard is `guard.admission.acceptance_role_staffed`, which uses `related_phases` to
require the referenced `StandingHolder` actually be in `staffed`. That one is right, and it shows the
operator set can express the stronger form.

**Two guards where the shape is load-bearing.** `guard.skill.declared_grant_inert` and
`guard.launcher.stripping_positive_control` both take `Ref<SkillVersion>` as their subject, and
`SkillVersion.owner_component` is `S1-C03` - the producing executor. The first checks that the skill record
says `declared_tool_grant_effect: "inert"`; the second checks that the skill record says
`grant_stripping_probe_result: "absent_at_enforcement_point"`. **The positive control on grant removal is a
field on the record whose grants are being removed.** R-X15's own argument is that the rule must be
"structural rather than asserted"; what the contract holds is an assertion in a field.

`guard.interest.precondition_invokes_no_model` has the same shape: it checks
`precondition_evaluator_kind == "deterministic"`, a string on the interest, and never checks the
`precondition_predicate_ids` the interest actually declares (see F6D-10).

**Why (b) and not (a).** In an offline record contract with no interpreter, a predicate can only read
records; a "field written by the enforcement point" and a "field written by the producer" are
indistinguishable to a schema. The design is not wrong to use records. What is owed is the binding that makes
the writer real - which `02` section 4's IdentityBinding and the `current_owner` operator can express, and
these guards do not use. Recorded with its verification owed.

**Internal contradiction worth naming separately.** `05` section 1 (DESIGN PROPOSAL) states *"C03 executors
remain outside protected credentials and writable registry state."* `record-registry.json` gives
`SkillVersion.owner_component = "S1-C03"` with `authorization.write = "only named owner through admitted
command/edge"`. Either C03 writes registry state or `SkillVersion` has no writer. Two implementers resolve
that differently, and the skill path is the W6 probe's.

---

## F6D-06 - (d) - `declared_grants` is optional, untyped and read by nothing. The decorative-declaration loophole the rule was written to close is reproduced by the rule.

**Governing requirement.** `05` section 3: *"**A declared grant is resolved against the grant policy at
admission**, so a declaration no configuration backs is refused rather than carried - the
decorative-declaration loophole, observed in this repository as 44 capability declarations that nothing
backed (R3 F57, F60)."* W6 probe (three permissions the worker does not hold). Protocol section 5 item 6.

**Passage.** `records.schema.json`, `StepExecution.payload.declared_grants` and
`WorkflowDefinition.payload.declared_grants`.

**Measured, three ways.**

1. **Optional.** `StepExecution.payload.required` is `['run_ref','step_id','work_order_ref','input_refs','attempt_refs','output_refs','exit_evidence_refs']` - seven of eighteen properties. All six of the R-L2 declared fields that section 3 says the record *"additionally carries"* are absent from `required`. Same for `WorkflowDefinition`: eleven required, the six not among them.
2. **Untyped.** `declared_grants` is `{"type":"array","items":{"$ref":".../string"}}` - an array of bounded text, **not** `Ref<Grant>[]`. `validator_ref` on the same record *is* a typed ref (`Ref<ConfigurationVersion>`), so the typed form was available and not used here.
3. **Unread.** The string `declared_grants` occurs in **0** predicate bodies in the registry. So do `critical_fields`, `validator_ref` and `step_kind`. Of the six R-L2 fields only `declared_read_set` and `branch_set` are demanded by any predicate, and `declared_read_set` is demanded on `ContextManifest`, a different record.

**There is no grant policy object.** Nothing in the 188 records is a grant policy, and no predicate mentions
`grant_policy`. So "resolved against the grant policy at admission" names a resolution against an object that
does not exist, over a field that is optional free text.

**Path to harm.** A step declares the three permissions of fixture F-3 as strings. Nothing ties those strings
to a `Grant`, nothing checks the strings are backed, and nothing refuses the step when they are not. The
executor then reaches the enforcement point with whatever the enforcement point gives it. The one thing that
does bind on that path is `edge.AgentInstance.leased.running.v1`'s `grant_arrival_attested == true`
(pinned, fixture r16-07), which is genuine and is credited below - **but it attests arrival, not scope**,
which the spec says in as many words.

**Why (d).** Two implementers building fixture F-3 from the amended chapter plus these contracts must invent:
what a grant policy is, what a declared grant is a reference to, and what "resolved at admission" does when
resolution fails. The chapter states the rule's shape and the contract supplies neither the object nor the
resolution. This is protocol section 5's own category - *"a missing decision without which an implementer
would choose the system's meaning by inventing policy"* - on the layer's authority path.

**Required contract.** `declared_grants: Ref<Grant>[]`, in `required` on both records; a grant-policy record
or an explicit statement that the `Grant` registry *is* the policy; and a predicate on the admission edge
that resolves each declared grant and refuses the step when one does not resolve. The paired benign case is a
step whose declared grants all resolve, which must not be refused.

---

## F6D-07 - (d) - Six named control objects are C5-protected in prose and bound by nothing. Three of them do not exist as records at all.

**Governing requirement.** `08` section 1: *"A change to **the consequence-class derivation function**, **the
class mapping table**, **the standing-holder set**, **a declared class floor**, **the external policy
object**, or **a writer-key assignment** is a **protected control change** requiring **independent
authorization**, and **no model may sit in its acceptance path**."* `05` section 11 restates it. W10
(self-modification of the boundary).

**Measured.**

| control object | representation in the contracts |
|---|---|
| consequence-class derivation function | `derivation_fn_version`, a free string on `ConsequenceDerivation`. No record. |
| class mapping table | **nothing** |
| standing-holder set | **nothing** (individual `StandingHolder` records exist; the *set* is not an object) |
| declared class floor | `declared_floor_ref -> ConsequenceClassDefinition`. A record exists. |
| external policy object | **nothing** - and `05` section 8 says *"The external policy object is a record with a named writer (C04) and a protected-change class (C5)"*, naming a record that is not among the 188 |
| writer-key assignment | `writer_key_authority_kind`, a free string on `StandingInterest`. No record. |

And for the objects that *do* exist, **no edge requires a `ProtectedChange`.** I checked every edge on
`ConsequenceClassDefinition` (4), `FieldAuthority` (2), `StandingHolder` (5) and `SkillVersion` (14): none
references `ProtectedChange` in its body, and none of the criteria it calls does either. `ProtectedChange`
itself is well built - `baseline_subject_refs` is enum-typed over all 188 record types, so a change *can*
name what it touches - but nothing makes the reverse direction mandatory.

**Path to harm.** This is the W10 self-modification probe and it resolves the wrong way: the objects that
decide who may act, who is reachable for a duty, and who may write a record are changed by ordinary
transitions owned by ordinary components. `05` section 11's claim *"There is exactly one implementation of
the derivation"* is about source code and is outside what any contract here can hold; the claim that changing
it is C5 is inside, and is unheld.

**Why (d).** An implementer must invent what the mapping table is, what the external policy object is, and
by what mechanism a change to either is routed through `ProtectedChange`. Section 8's sentence describes a
record that would have to be designed from scratch.

**Required contract.** A record per named control object with a `ProtectedChange`-gated lifecycle, or an
explicit `protected_subject_kind` enum on `ProtectedChange` plus a predicate on each control object's edges
requiring a current authorized `ProtectedChange` naming it. Adverse fixture: a floor changed without one.

---

## F6D-08 - (a) - The `ArmedSet` is unstoppable by prose only. Its stated invariant names the admission authority as the party that must not write it, and the registry names that same party as its owner.

**Governing requirement.** `05` section 7: *"`ArmedSet` ... is a computed projection with no lifecycle, and
nobody writes it ... no component may prevent membership - in particular, the admission authority holds no
write access to any precondition-bearing kind."* W10 (shared state writable by anything that can read it).

**What is actually there, and one half of it is real.** `ArmedSet.registration.permitted_commands` is `[]`,
it has zero lifecycle transitions, and **zero of the 105 commands in `command-registry.json` mention
`ArmedSet`.** That is a genuine structural containment and I credit it.

**The other half.** `ArmedSet.owner_component` is **`S1-C02`**, and `authorization.write` reads *"only named
owner through admitted command/edge"*. C02 is the admission authority - `05` section 2 gives it the admission
derivation, section 7 gives it the per-origin arming rate, R-D09 gives it the narrowing. So the record's own
invariant list, verbatim, says *"The admission authority holds no write access to any precondition-bearing
kind"*, and the record's own owner field names the admission authority.

`StandingInterest` is the precondition-bearing kind - it carries `precondition_predicate_ids` - and its
`owner_component` is also `S1-C02`, with `permitted_commands: ["kernel.record.register",
"kernel.record.revise", "kernel.record.transition"]` and all six of its lifecycle edges owned by S1-C02,
including `admitted -> suspended`. Suspending an admitted interest removes it from the armed set, which is
preventing membership, by the party the invariant excludes.

**Mutation (m4).** Replacing `ArmedSet.registration.permitted_commands` with the three kernel record
commands: **exit 0, undetected.** The one structural guarantee is one JSON line from gone and nothing checks
it.

**A W8 gap on the same record.** With no permitted command, no transition and no command in the registry
naming it, **nothing creates an `ArmedSet` either.** `evaluator_module` is a free string with no binding to
anything. How the projection comes into existence is left to construction.

**Required contract.** A registry-level assertion that `permitted_commands` is empty for computed
projections, pinned by hand like `pinned_transitions`; an `owner_component` for `ArmedSet` that is not the
admission authority, or an explicit statement that `owner_component` on a derived projection means custodian
rather than writer; and a named evaluator binding.

---

## F6D-09 - (a) - `PredicateId` is a 2,387-entry enum that zero record fields use. The two predicate-bearing fields this amendment adds are free strings, where thirty-two pre-existing fields are typed.

**Governing requirement.** `05` section 2 (*"`AdmissionRecord -> refused` requires a **named failed
predicate**"*); section 7 (*"No precondition may invoke a model"*); section 9 adverse cases 13 and 17.

**Measured.** `values.schema.json` defines `PredicateId` as an enum of all 2,387 registry keys. It is derived
and ratcheted - `tools/run_negative_fixtures.py` re-derives it inside every scratch tree, and the validator
fails on drift, which fixture `r12-predicate-id-enum-drifts-from-the-registry` exists to prove. And:

```
grep -c PredicateId records.schema.json   -> 0
grep -c PredicateId commands.schema.json  -> 0
```

**Zero fields in either schema are typed `PredicateId`.**

Thirty-two record fields carry predicates and are typed `TypedPredicate`, which is a `oneOf` over every
registered predicate with a `const` `predicate_id` and a matching `arguments` schema - a strong type that
does the job `PredicateId` would. **The two predicate-bearing fields WORK-1.1 adds are not:**

| field | type |
|---|---|
| `AdmissionRecord.failed_predicate_id` | `values.schema.json#/$defs/string` |
| `StandingInterest.precondition_predicate_ids` | array of `values.schema.json#/$defs/string` |

**Consequences.** `guard.admission.refusal_names_failed_predicate` asserts the field is nonempty and `!= ""`.
So a refusal whose `failed_predicate_id` is the text `unfamiliar wording` satisfies the guard - and the
guard's own `meaning` says *"unfamiliar wording is not a predicate."* Adverse case 13 and its paired benign
case 17 both turn on that distinction, and the type does not carry it. The design deliberately accepted a
higher `no_match` rate to get deterministic refusal (section 2, F-7's narrowing); the determinism is not in
the contract.

For `StandingInterest`, the preconditions are free text that need not name a registered predicate at all,
while `precondition_evaluator_kind: "deterministic"` - an adjacent free string - is what
`guard.interest.precondition_invokes_no_model` reads. Layer 3's foundational rule is held by a declaration
beside the thing it describes.

**Required contract.** `failed_predicate_id: PredicateId`; `precondition_predicate_ids: PredicateId[]` (or
`TypedPredicate[]`); and a conjunct asserting each named predicate's registered `implementation_status` is
deterministic. Adverse fixture: an interest naming a model-invoking predicate while declaring itself
deterministic - which no current fixture expresses.

---

## F6D-10 - (a), reduced on re-check - `budget` is on zero records. The `CapacityState` half of this finding is WITHDRAWN.

**I got this wrong first and am recording the correction rather than the conclusion.** My first pass read
`CapacityState` as a record named in `05` section 7 and absent from the 188, and called it a dangling
reference. It is not. `aliases.json` maps **`CapacityState -> CapacityObservation`**, one of 26 alias rows,
and the record exists.

**And what it carries is better than the chapter's sentence.** Section 7 says *"`CapacityState` records
**remaining-or-unknown** rather than assuming an allowance."* `CapacityObservation.measurement` is typed
`MeasuredQuantity`, which is a `oneOf`:

```
{knowledge: "observed", quantity, evidence_refs}   XOR   {knowledge: "unknown", reason, held_maximum}
```

An unknown allowance cannot be written as a number, and writing it unknown forces a reason and a held
maximum. That is remaining-or-unknown done structurally, and it is one of the strongest constructions I found
in the package. **Credited, not faulted.**

**What survives.** Section 7 also says *"**`budget` is a mandatory schema field on every object that consumes
capacity**."* Across all 193 payload definitions, records with a `budget` field: **0**. Required: **0**. The
machinery to carry a budget exists (`ExecutionCapacity.allowance_observations`, `CausalEpisode.allowance`,
`MeasuredQuantity`), so this is a naming and completeness gap rather than a missing mechanism: an implementer
looking for the field the chapter calls mandatory does not find it, and has to decide which of three existing
constructions the chapter meant. Minor (a).

---

## F6D-11 - (d) - `EffectIdentity`'s "a second claimant joins the first" is carried by an optional field nobody reads, and the business identity triple has no uniqueness constraint.

**Governing requirement.** Protocol section 5 item 10 (*"No stated winner between concurrent attempts on one
work order, so duplicate external effects are decided by timing"*); `05` section 6 and section 13 row 10,
which answers it with *"a second claimant joins the first and inherits its outcome. Timing decides nothing."*

**Measured.** `EffectIdentity.payload.required` is `['effect_class_id','counterparty_id','payload_digest',
'allocated_at','reserved_name_range','allocating_component_id']`. **`first_claimant_ref` is not required**,
and `first_claimant_ref` appears in **0** predicate bodies. The record's registry `identity.key` is
`["company_id","record_id","revision"]` - the *business* triple `(effect_class, counterparty,
payload_digest)` that section 6 declares as the identity is three ordinary payload fields with no uniqueness
constraint anywhere, and `uniqueItems` occurs zero times in the schema.

`guard.effect.identity_allocated_before_release` is sound as far as it goes - `allocated_at < claimed_at`
and `allocating_component_id == "S1-C04"` - and I credit it. But it constrains one record's internal
consistency. Nothing expresses that two allocations with the same triple are the same allocation, and
nothing expresses the join.

**Why (d).** An implementer must decide what happens when a second attempt allocates the same triple: a
unique-index conflict, a read-then-join, or two rows. Those are three different systems and the protocol's
item 10 is exactly the question. The chapter answers it; the contract does not carry the answer.

**Required contract.** A uniqueness constraint on the triple, `first_claimant_ref` in `required`, and a
conjunct on `allocated -> claimed` asserting that a claim whose triple already has a `first_claimant_ref`
inherits rather than re-releases. Adverse fixture: a second claimant that re-releases.

---

## F6D-12 - (a) - `ExistenceJustification.reason_kind` is a free string. The six admitted reasons are a prose table, so the refused seventh is admissible.

**Governing requirement.** `05` section 4: six admitted reasons, *"**Specialized knowledge is refused as a
reason**"*, *"**Attributable identity ... is never a reason**"*, *"**Provider or account separation is not a
seventh reason**"*. Protocol negative controls 4 and 8.

**Passage.** `records.schema.json`, `ExistenceJustification.payload.reason_kind`:
`{"$ref":"values.schema.json#/$defs/string"}`. `reason_unit` likewise. `decidable_test` likewise.

**Measured.** `criterion.ExistenceJustification.admitted.v1` has five conjuncts. It demands `decidable_test`
nonempty, `test_can_return_false == true`, the admitting mandate be in `accepted` (`related_phases`), plus
`accepted_for` and `attested_result`. **It never constrains `reason_kind`.** No predicate in the registry
does.

So `reason_kind: "specialized marketing knowledge"`, `reason_unit: "the marketing function"`,
`decidable_test: "does the worker know marketing"`, `test_can_return_false: true` is admissible. Negative
control 8 - a job-title roster relabelled as capabilities - passes the record built to catch it. Negative
control 4 - an agent justified by a capability no fixture exercises - is caught only in `05` section 12, for
*holders*, and by a prose table rather than a predicate.

**What is right here and is worth keeping.** The load-bearing transition really is mechanical:
`test_can_return_false == true` is checked, which is what the chapter says makes the gate mechanical rather
than rhetorical, and the three structural conjuncts are the strongest in the amendment. The defect is the
one typed field the six-reason table needs.

**Required contract.** `reason_kind` as an enum of exactly the six, `reason_unit` as an enum of the six
units, and a conjunct pairing them. Adverse fixture: a seventh reason. Paired benign: each of the six.

---

## The measurement that frames all of the above

The amendment adds 30 `guard.*` predicates to a registry that already held 888 `criterion.*` predicates.
Classifying every one of them by whether its body uses an operator that reads a *different* record
(`related_phases`, `accepted_for`, `attested_result`, `status_edge`, `current_owner`, `lease_current`,
`transition_basis`, `acceptance_chain`):

| predicate kind | uses a cross-record operator | reads only its own subject record |
|---|---|---|
| `criterion.*` (pre-existing, 888) | **888** | 0 |
| `guard.*` (added by WORK-1.1, 30) | **1** | **29** |

This is the shape of the whole finding set. The package it was added to checks facts about the world by
resolving other records; the layer added on top checks fields the subject record declares about itself. Every
finding above except F6D-01 and F6D-04 is a consequence of that one difference, and the operator set already
supports the stronger form - `criterion.ExistenceJustification.admitted.v1`,
`criterion.ProjectionGrant.active.v1` and `guard.admission.acceptance_role_staffed` all demonstrate it inside
this same amendment.

---

## What landed, and should survive the repairs

Naming these because a repair pass that reads only the findings will damage them.

- **The conjunct pins bind.** My mutation m3 flipped `guard.skill.declared_grant_inert` from demanding
  `"inert"` to demanding `"active"`: **exit 1**, with the message *"PINNED CONJUNCT MISSING: the registry no
  longer says what this finding required."* Hand-written, not derived from `phase_content.py`, and it
  works. The 15 of 17 r16 fixtures that mutate guard bodies are all caught by this.
- **`guard.delegation.width_ceiling_over_distinct_read_sets` genuinely discriminates.** It counts *distinct*
  read-set digests against a declared ceiling and asserts uniqueness. Fifty cheap consultations trip it;
  two consultations over one read set do not. The adverse case and its paired benign case are both
  expressible in the same predicate, which is what negative-control pairing asks for and is rare in this set.
- **`ConsequenceDerivation.derivation_input_refs` is enum-restricted to `ConflictClaim`, `DeletionScope`,
  `IdentityBinding`, `Obligation`, `ParameterAuthority`.** This is section 1's *"computed from records the
  acting party cannot author"* done structurally rather than declared. It is the best single piece of the
  amendment.
- **`criterion.ProjectionGrant.active.v1`** requires the `ParameterAuthority` to be in `verified` via
  `related_phases`, plus `reread_at_every_read == true`, plus acceptance and attestation. The
  `ProjectionGrant` issuer question in my brief resolves cleanly: issued by C04, scope from a verified
  `ParameterAuthority`, not asserted by the recipient.
- **`lifecycle_head_key` includes `revision`.** So revising a `StandingInterest` produces a new revision with
  its own lifecycle head, which must re-traverse `proposed -> trial -> admitted` and re-run the writer-key and
  no-model guards. The "checked at install, altered afterwards" attack on interests does not work. This is
  not stated in the chapter and I found it only in the identity block; it deserves to be stated.
- **`ArmedSet` really is command-unreachable today**: `permitted_commands: []`, zero transitions, and zero of
  105 commands name it. (F6D-08 is that nothing holds it there.)
- **`DisclosureContract.construction` is an enum of exactly the two admissible constructions**
  (`destination_clean`, `deterministic_rendering`), so `02` section 8.2's "choose and enforce one of two" is
  typed rather than described. No third can be written.
- **`guard.effect.one_per_step`** (`count(effect_refs) <= 1` and `idempotency_unit == "step"`) and
  **`guard.effect.identity_allocated_before_release`** (`allocated_at < claimed_at`,
  `allocating_component_id == "S1-C04"`) are both sound as written.
- **The fixture harness refuses to lie about its own denominator.** `MANIFEST.json` is hand-maintained,
  declared-but-absent and present-but-undeclared both fail, the runner refuses to run through a symlinked
  `tools/` or `fixtures/`, and the positive suite's floor of 17 is a literal in two places that are compared.
  My harness reused `execute_fixture()` unchanged and it behaved exactly as documented.
- **Section 12's fixture table and section 13's closing paragraph are honest in the way the protocol asks
  for.** The reserved-lane holder is marked *"exercised only at 4x demand, which is not executable at the
  current concurrency pin. Recorded as owed, not as passed."* Section 13 then names four things the (d)
  checklist cannot see, including *"an error the whole round shares."* Nothing in my findings contradicts
  either, and both are the reason I could scope this review quickly.

---

## Negative controls 4, 6, 7, 8, as applied

**Control 4 - an agent justified by a capability the fixtures never exercise.** *Partly caught, and not by a
mechanism.* For **holders**, section 12 states the mechanical form - *"A holder exercised by no frozen fixture
is unjustified and is refused on sight"* - and the fixture table names the exercising fixture per holder, with
the reserved-lane holder honestly marked as owed. That is the control working, in prose. For **workers**,
`ExistenceJustification` is the record meant to carry it and `reason_kind` is unconstrained (F6D-12), so an
unexercised justification is admissible. No predicate anywhere links a justification to a fixture.

**Control 6 - an "independent" reviewer fed the producer's rationale.** *Not caught.* The design's detection
point is explicit and correct in intent - section 9 adverse case 2, detected by *"the loader's record, not the
checker's claim"* - and `guard.readset.delivered_equals_declared` is bypassable by a duplicate (F6D-02).
`guard.criteria.author_not_in_producing_path` is the other half and can be detached without detection
(F6D-01). Both halves of control 6 fail, for different reasons.

**Control 7 - a cost comparison that counts tokens but not scarce subscription capacity.** *Partly carried: the unknown-allowance construction is real, the named field is not.* The chapter reasons about capacity
separately from money throughout section 7 and prices the metered-affordance flip as a capacity event, which
is the control's substance. The contract carries the harder half of it: `CapacityObservation.measurement` is
a `MeasuredQuantity`, an observed-or-unknown union in which an unknown allowance cannot be written as a number
(F6D-10). The `budget` field the chapter calls mandatory is on zero records. I did not evaluate W4 and do not
judge it; I report only what the contract does and does not carry.

**Control 8 - a job-title roster relabelled as capabilities.** *Not caught mechanically; the prose refuses
it.* Section 4 refuses specialized knowledge by name, with the R2 F-10 / R6 F6 / TC-33 evidence (162 roles,
2,410 questions, no persona benefit), and refuses provider separation as a seventh reason. The six reasons are
genuinely capability-shaped, not department-shaped, and the boundary follows permission, provenance,
consequence, confidentiality, partition and verification relation. But `reason_kind` is a free string
(F6D-12), so the refusal is not enforced. Section 12's holder set is four rows plus *"Any other proposed
holder - refused on sight"*, which is the right shape and is also prose.

---

## Protocol section 5 - the ten (d)-class examples, walked on my three dimensions

Section 13 of the subject walks these itself. I am checking the contracts behind the claims, not re-reading
its self-assessment.

| # | Chapter's answer | What the contracts carry |
|---|---|---|
| 1 admits unknown work | C02, class before kind, three typing outcomes | `AdmissionRecord` with four edges and `guard.admission.refusal_names_failed_predicate`. **Weakened** by `failed_predicate_id` being free text (F6D-09) |
| 2 handoff acceptance authority | `AcceptanceInterval` | Record, three edges, two criteria guards. **Weakened** by F6D-01 (detachable) and F6D-04 (`-> rejected` deletable) |
| 6 permission composition | refused, not minted - three effect steps | **Not carried.** `guard.effect.one_per_step` bounds effects per step and is sound; `declared_grants` is optional free text read by nothing and there is no grant policy object (F6D-06). This is my one clear (d) on W6 |
| 7 delegation ceiling with an owner | depth 1 plus width over distinct read sets | **Carried well** by `guard.delegation.width_ceiling_over_distinct_read_sets`, subject to F6D-01. The owner is stated as C01 in the chapter and `width_ceiling` lives on `StepExecution`, owned by S1-C02 - a discrepancy an implementer must resolve |
| 8 writer authority on shared state | `FieldAuthority`, `(field_path, epoch)`, no last-writer-wins | Record with two edges and `guard.supersession.walks_derived_closure`. **Not protected as C5** (F6D-07); writer-key assignment has no record |
| 10 concurrent-attempt winner | `EffectIdentity`, second claimant joins | **Not carried** (F6D-11). This is my second clear (d) |

Examples 3, 4, 5 and 9 are outside W6/W8/W10 as briefed and I did not check them.

---

**Counterexamples checked against the whole edge, not just the guard.** A conjunct elsewhere on the same
edge could have closed either hole, so I expanded both edges and every criterion they call.
`edge.ContextManifest.captured.admitted.v1` carries `subject_unchanged`, `status_edge`, `current_owner`,
the three guards and `criterion.ContextManifest.admitted.v1`; **no `unique` operator appears anywhere on that
edge.** `edge.ConsequenceDerivation.recomputed_at_release.matched.v1` carries `subject_unchanged`,
`status_edge`, `current_owner`, `guard.derivation.recompute_matches` and
`criterion.ConsequenceDerivation.matched.v1`, and that criterion's three conjuncts are `nonempty_fields`,
`accepted_for` and `attested_result` - **no equality over the two class arrays and no `unique`.** Both
counterexamples survive the full edge.

---

## Verdicts

**W6 - authority as boundary: INSUFFICIENT.**

The F-3 trace does not complete in the contracts. Permission decomposition is answered in the chapter and
unbacked in the registry (F6D-06, (d)): `declared_grants` is optional, is an array of free strings rather
than grant references, is read by zero predicates, and the "grant policy" it is resolved against does not
exist. Attenuation on delegation - the helper half of the probe - is prose in `02` section 4 plus a
`command_dispatch` predicate body and an `attenuation_proof_ref: Ref<Observation>` whose content nothing
checks; no predicate asserts the child's selectors are subsets, that ceilings do not rise, or that depth
decreases. The self-modification boundary is unbound (F6D-07, (d)): six named C5 control objects, three of
which have no representation at all, and no edge on any of them requires a `ProtectedChange`.

What does hold on this dimension: the grant-arrival attestation
(`edge.AgentInstance.leased.running.v1`, `grant_arrival_attested == true`, pinned, fixture r16-07), and it
attests arrival rather than scope, which the chapter says plainly. `ProjectionGrant`'s issuer chain is sound.
`derivation_input_refs` is enum-restricted to records the acting party cannot author, which is the principle
done right once.

**W8 - buildability: INSUFFICIENT.**

An implementer building fixture F-3 or F-5 from the amended chapter plus these contracts must invent: what a
grant policy is and what happens when a declared grant does not resolve (F6D-06); what the class mapping
table and the external policy object are, both named as records and neither existing (F6D-07); where
`budget` lives, given three existing constructions and no field of that name (F6D-10); and what happens when
two attempts allocate the same effect identity (F6D-11). Each is a decision that changes the system's
meaning, which is protocol section 5's own definition.

Below that: the six R-L2 fields the chapter says `StepExecution` and `WorkflowDefinition` *carry* are all
optional in the schema and four of the six are read by no predicate; `ArmedSet` has no creation path; the
width-ceiling owner differs between chapter (C01) and registry (S1-C02); and `05` section 1's "C03 stays out
of writable registry state" contradicts `SkillVersion.owner_component = S1-C03`.

**W10 - adversarial robustness of the work layer: INSUFFICIENT.**

The named defences exist and the apparatus that is supposed to hold them does not bind them. Thirty of thirty
guards detach silently (F6D-01); whole safety edges including the only park-on-mismatch route delete silently
(F6D-04); the read-set guard and the recompute-match guard are both defeated by a duplicate in an array no
schema makes a set (F6D-02, F6D-03), and the second of those releases an effect having dropped a reached
class, which is AT-M4-02's exact harm arriving by a route the no-rank rule does not cover. Shared-state
write authority is the prose kind: `ArmedSet`'s own invariant excludes the admission authority and the
registry names the admission authority as its owner (F6D-08). Layer 3's no-model rule is a self-declared
string beside free-text precondition ids (F6D-09).

Two of the Phase D attacks I could not reach at all from the contracts, and say so below.

---

## Which consolidation findings the contracts actually close

"Closed by a guard I found and mutated" means: the guard exists, its body demands the right thing, its
conjunct pin holds it there (verified by mutation for one, by reading the pin for the rest), and it is
attached to an edge. Every row in the first table is still subject to F6D-01 - the attachment is unpinned -
so "closed" here means *closed as far as this package's own instruments reach*.

**Closed by a guard whose body is pinned and correct:**

| finding | guard | note |
|---|---|---|
| AS-X-04 / R-X16 (runaway consultation) | `guard.delegation.width_ceiling_over_distinct_read_sets` | distinct read sets, `unique`, benign case passes |
| AT-M4-02 (max() rank), admission half | `guard.class.no_total_rank` + `guard.class.reached_set_gates_all` | `class_ordering == "none"` plus `unique` on `reached_class_ids`. The `unique` is what makes the sibling sound |
| AS-M5-02 (writer keys) | `guard.interest.writer_keys_not_self_declared` | `self_declared_writer_keys == []`, authority `external` |
| AS-M5-01 (trust promotion) | `guard.trust.promotion_is_an_effect_with_a_non_model_discriminator` | discriminator `!= "model"`, rule `out_of_band_corroborant` |
| AX-M2-04 / R-X13 (trust floor) | `guard.trust.derived_is_floor_of_inputs` | derived level equals minimum input level |
| R-D17 (acceptance reason) | `guard.acceptance.resolution_reason_present` | empty reason rejected |
| R-X06 (admitter excluded from custody) | `guard.custody.admitter_excluded` | membership test, correct polarity |
| R-X09 / R-D09 (unfilled acceptance role) | `guard.admission.acceptance_role_staffed` | the one cross-record guard; `related_phases` on `staffed` |
| R-D19 / R3 F29-F30 (one effect per step) | `guard.effect.one_per_step` | `count <= 1`, idempotency unit is the step |
| AE-M4-01 (holder refuses a shed) | `guard.holder.no_veto`, `guard.reservation.lapse_independent_of_consent` | shed recorded whether or not the holder concurred |

**Closed in prose, not by anything I could mutate:**

| finding | where it is claimed | what the contract carries |
|---|---|---|
| AT-M4-02, release half | `05` section 11, park-on-mismatch | `guard.derivation.recompute_matches` is defeated by a duplicate (F6D-03) and the park edge is deletable (F6D-04) |
| AS-X-01 (criteria channel) | `05` section 5 + section 9 case 3 | guard correct, detachable, and its partner `guard.readset.delivered_equals_declared` is defeated by a duplicate (F6D-02) |
| AS-X-02 / R2 F-08, R6 F7 (skill grant) | `05` section 8 | both guards read fields on the `SkillVersion` record, owned by the producing component (F6D-05) |
| R3 F57, F60 (decorative declarations) | `05` section 3 | `declared_grants` optional, untyped, unread; no grant policy object (F6D-06) |
| AS-M1-01 (model-to-model return) | `05` section 5 | `edge.Delegation.offered.accepted.v1` conjunct `return_payload_kind == "typed_outputs"`, pinned as a `kind: edge` pin, fixture r16-15. **This one does hold** - correcting my own table: it is closed, by an inline conjunct rather than a guard |
| AS-M4-01 (provider as C2 destination) | `02` section 8.2, `05` section 11 | `DisclosureContract` exists with a two-value `construction` enum, which is real. But no standing contract for the provider is expressed, and `projection_conformance` appears nowhere in either schema. Closed in prose |
| AT-M1-01 (HandoffAcceptance collision) | `05` section 5 | Avoided by naming, not by a guard: `AcceptanceInterval` and `HandoffAcceptance` are distinct records with different state sets. I confirmed both exist separately in the 188. This is the right resolution and needs no guard |
| AT-M3-01 (dangling references) | `11` alias table | **Closed, and this is the cleanest result in the review.** I extracted every backticked CamelCase token from `05` (50) and `11` (48) and resolved each. All fifteen new records resolve. Of the rest, every unresolved token is either an alias row (`Procedure -> WorkflowDefinition`, `Step -> StepExecution`, `Journal -> JournalBatch`, `WorkRecord -> WorkOrder`, `CapacityState -> CapacityObservation`) or a registered value type (`Position`, `StageRef`, `TypedPredicate`, `AuthorityMatrix`, `GroupBody`, `SendAuthorizationBundle`, `RecoveryFrontier`, `BusinessResult`, `CommittedEventBody`, `BootstrapAuthorization`, `BootstrapCandidate`). **Exactly one token, `RecordEnvelope`, is neither** - it is used in `05` section 1 as the canonical envelope and is not a record type or a value type. That is the whole dangling-reference residue. The 26-row alias table does what R-X02 says it does |
| AT-M5-01 (Constraint writer) | `05` section 7, R-D23 | `guard.constraint.standing_interest_writes_proposed_only` asserts `write_target_phases subset-of ["proposed"]`. Body is correct and pinned. Detachable |

---

## Not checked

- **The full validator baseline did not complete inside this review.** I started it at 00:10 against the
  frozen archive; at 00:39 it had produced no output. It nests 54 negative and 18 positive fixture runs, each
  a full validator invocation at ~28 s, so ~35-40 min is expected and it was still inside that window when I
  finished. **I therefore report no `negative_fixtures_rejected` or `positive_fixtures_passed` count of my
  own.** Every number above comes from runs I did complete: one unmutated control (exit 0, `status: passed`,
  `source_work_edges: 373`, `required_subjects: 46`) and 34 mutation runs, all with `CONTRACTS_FIXTURE_RUN=1`.
  This does not affect any finding - a green baseline is what every finding assumes.
- **W7 (durability), W4 (cost), W5 (verification independence) as dimensions.** Not my brief. I touched
  protocol section 5 item 10 because duplicate effects are a W10 attack, and negative control 7 because it was
  named in my brief, and I judge neither dimension.
- **Injection via a fetched page reaching a consequential action, end to end.** I could not trace this from
  the contracts. The pieces are there - tool output as untrusted data, `trust_class` gating activation, the
  loader's manifest - but there is no record for a fetched page, no `trust_class` enum I could find, and no
  path I could follow from an untrusted input to an effect release. Reported as unreached rather than as
  absent.
- **Skill corruption after a passing test.** `content_hash_rechecked_at_use` is a boolean checked at the
  `trial -> admitted` edge, which is install time. That is "checked at install that it is checked at use",
  which is the best an offline record contract can do; whether the recheck happens is a runtime fact. Class
  (b), verification owed, not a finding.
- **`tools/phase_content.py`'s 46 new criteria and their citations.** My brief asked for a sample; I spent
  the budget on the guard sweep instead and say so rather than implying coverage. The citation-resolution
  machinery is exercised by the validator's own checks, which my control run passed.
- **The producing lanes' self-assessments, session files and worktrees, and `05-selection-record.*`.** Not
  read, per the independence rules. Where the chapter cites the selection record for a decision's rationale
  I took the chapter's own statement of the rule and checked the contract against that.

---

## Standing caveat

No runtime exists. Every "closed", "sound" and "insufficient" above is about specified behaviour checked
offline, by one reviewer of the same model family as every author, with procedural independence only.
Independence of influence is what I can claim; independence of error is not. Nothing here establishes runtime
conformance, deployment readiness, actual fulfillment, or business value.

No aggregate score, and no recommendation - neither is mine to give.
