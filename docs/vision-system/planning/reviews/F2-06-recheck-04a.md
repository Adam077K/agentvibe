<!-- PROVENANCE (orchestrator, ceo-4-1789314685, 2026-09-14). Reviewer: `reviewer` engine, lane `f2-06-recheck-04a`; authored nothing in this package; brief carried subject + criteria only (register fields limited to id/issue/required_contract/proposed_repair of four entries). Subject: `3e51a9e`; root HEAD advanced to `4bc2a9f` during the review (history.jsonl, state.json, registers, and the recheck-04b archive — none read; `git diff 3e51a9e 4bc2a9f -- planning/specification/` is EMPTY, so every contracts measurement holds at both). Validator and fixture runners not run by the reviewer; the orchestrator's split run (305,223 checks; 111/111; 72/72) was cited as the orchestrator's measurement. Return channel: not truncated; this file is the reviewer's final transcript message verbatim (55,914 chars, 355 lines, cmp-verified). Verdicts on 17 contracts-side items: 10 CLOSED at specification level, 7 PARTIAL (F6C-06, F6C-10, F6C-11, F6D-05, F6D-08, F6D-12, F6R-03), 0 OPEN, 0 REGRESSED. Flagged judgements: S1-C04 defensible but its chapter citation wrong (F6Y-05); F6D-09's returned decision honest, not an evasion. New findings F6Y-01..08, none (d); F6Y-01 is live at the subject (the F6R-03 sweep pattern omits the F6W family). One model family; procedural independence only; no runtime exists. -->

HEAD moved under me during the review; the contracts layer is byte-identical at both commits, so every measurement holds. Full report follows.

---

## Précis

Subject `3e51a9e`, re-measured at `4bc2a9f` (HEAD moved under me mid-review; `git diff 3e51a9e 4bc2a9f -- docs/vision-system/planning/specification/` is **empty**, so every contracts measurement below holds at both).

**10 of 17 CLOSED at specification level, 7 PARTIAL, 0 OPEN, 0 REGRESSED.** Eight new findings, `F6Y-01…08`.

The repairs are, on the whole, better than the required contracts asked for. Every one of the sixteen carries a matched adverse and benign fixture pair, all thirty-two are declared in manifests sitting exactly at their floors, and every adverse fixture's `expect_failure_contains` string resolves to a real message in `validate_contracts.py`. Three repairs went past their contract: `longest_plausible_outage` was retyped from `string` to `Duration` so the comparison is between comparable operands; `precondition_evaluator_kind` was closed to the guard's own two comparands; and the closed-enum comparison was generalised to all 61 registry/schema enum pairs rather than the one the finding named. Two clauses were returned as decisions rather than faked, each with a tripwire that fires when the premise stops holding, which is the right disposition and rare.

**The two flagged judgements.** (a) **S1-C04 is defensible but its citation is wrong.** `02-authority-recovery.md` §4 contains zero `S1-C0*` ids and mentions `IdentityBinding` once, in an authentication sentence naming no owner; the ownership fact is in `record-registry.json`, not in the chapter cited. The constraint the finding actually imposes is "not the producer", which C04, C05 and C06 all satisfy, and `03-company-capabilities.md` gives C05 a competing claim on at least `content_hash_rechecked_at_use`. The lane's own disclosure that this is a reading rather than a decision is accurate and is the right disposition. `F6Y-05`. (b) **F6D-09's determinism conjunct is the honest reading, not an evasion.** Measured: `implementation_status` holds one identical value across all **2,398** predicates, and that value does not contain the word "deterministic", so the conjunct would be true of every predicate including a model-invoking one. The tripwire is an equality against a named literal rather than a count, with the fixture sentinel excluded by value and both directions held by a fixture pair.

**The sharpest new finding is `F6Y-01`, and it is live at the frozen subject.** F6R-03's repair sweeps `F6[A-DRVX]-\d\d` over `planning/reviews/F2-06-*.md` and asserts every hit has a `finding_sources` row. At `3e51a9e` that corpus raises **72** `F6?-NN` ids across **eight** families; the character class excludes `F6W`, so **F6W-01…08, all raised in `F2-06-recheck-03.md` (31 mentions) and none holding a source row**, are invisible to the assertion and to its floor. Two of them have already amended `05` §5 by name. The lane recorded a residue about the *shared* pattern while writing "the sweep here is its own pattern over its own corpus, asserting the one thing the finding asks for"; that sentence is false of F6W, so the residue is narrower than what is unmet.

`F6Y-02` is a computed counterexample: the F6D-12 pairing check tests each of the twelve strings for presence independently, so swapping two units between branches leaves it, its pin and the derivation oracle all satisfied.

---

## Provenance

| | |
|---|---|
| Subject named in brief | `3e51a9e` |
| `git rev-parse --short HEAD` at start | `3e51a9e`, working tree clean |
| `git rev-parse --short HEAD` at end | `4bc2a9f`, working tree clean |
| Commits that landed mid-review | `35f0710`, `4bc2a9f` |
| Files they touched | `history.jsonl`, `planning/reviews/F2-06-recheck-04b.md`, `registers/open-questions.json`, `registers/review-findings.json`, `state.json` |
| Contracts diff `3e51a9e..4bc2a9f` | **empty** |

The subject was supposed to be frozen and it was not. Nothing under `planning/specification/` moved, so the contracts verdicts are unaffected. The four register entries were read with `git show 3e51a9e:` and are therefore at the frozen subject despite `review-findings.json` having changed since. One measurement was re-taken at both SHAs because a new review document entered the swept corpus: `F6Y-01`'s counterexample is stated at `3e51a9e` and reproduces, larger, at HEAD.

I did not run `validate_contracts.py` or the fixture runners, per the brief. Everything below was computed by direct Python queries over the registries and schemas, by reading check bodies, and by one run of `node scripts/classify.mjs`. I cite the orchestrator's measurement, not mine, for the green full run: 305,223 checks, 111/111 adverse refused for their own reason, 72/72 benign passed.

**Independence limits, in my own words.** I wrote nothing in this package and read no producer's account of it: no session file, no lane worktree, no self-assessment, and none of `planning/F2/07-repair-names-contract.md`, `08-repair-names-prose-b.md`, `PLANNING-REPORT.md`, `state.json`, `history.jsonl` or `F2-06-findings-index.json`. From `registers/review-findings.json` I read only `id`, `issue`, `required_contract` and `proposed_repair` for the four named entries and nothing else. I did not read the commit messages of the repair lanes; the two in my starting context arrived there unbidden and I relied on neither. What remains is not independence of judgement: I share one model family with the authors, I was pointed at their findings by a brief they influenced, and a defect whose shape all of us are blind to in the same way would survive this pass exactly as it survived theirs. My independence is procedural, and procedural only.

**No runtime exists.** Nothing here is a statement about behaviour. Every "closed" below means the specification now says a thing, in a place that is typed and demanded, such that deleting the saying fails a build. That is what closing a missing decision looks like offline, and it is less than enforcement. There is no interpreter of predicate bodies against record instances anywhere in this package, so a criterion that "refuses" refuses in the sense that a document refuses.

---

## 1. Per-item verdicts

| id | class | verdict | one line |
|---|---|---|---|
| F6A-09 | (a) | **CLOSED** | Wrong row deleted to `not_aliases`, refusal widened to value-registry names, false gloss repaired; second option declined with a checkable reason. |
| F6A-10 | (a) | **CLOSED** | `admitter_excluded` in both declarations, a general 61-pair enum comparison with a floor, plus a hand literal for the member itself. |
| F6C-06 | (b) | **PARTIAL** | A `CapacityMeasure` vocabulary now names `cache_lifetime` and is held to the chapters, but no field or predicate uses it. |
| F6C-10 | (a) | **PARTIAL** | Ceiling required on `WorkOrder` and genuinely compared at `* → retry_admitted`; the park clause is owed, with a tripwire and a stated reason. |
| F6C-11 | (a) | **PARTIAL** | A real `lt` over two typed `Duration` operands, pinned; nothing ties `retention_span` to `retention_until` minus `landed_at`, and the note says so. |
| F6C-13 | (b) | **CLOSED** | Both fields required on `WorkOrder`, a guard refusing equality with the order's own owner, attached to the admission edge, pinned twice. |
| F6D-05 | (b) | **PARTIAL** | Field-level owners fixed and cross-pinned, but the annotation is read by no predicate and the record still grants the producer write. |
| F6D-08 | (a) | **PARTIAL** | Containment and the custodial reading are both closed and checked; the evaluator binding resolves to the record's own module. |
| F6D-09 | (a) | **CLOSED** | Both fields typed `PredicateId`, evaluator kind closed to two members, third clause returned as a decision with an equality tripwire. |
| F6D-12 | (a) | **PARTIAL** | The six pairs are exactly right in the data; the check that guards them cannot tell them from a shuffle. |
| F6X-01 | (a)* | **CLOSED** | Neither offered option taken; a closed three-path kernel surface declared instead, disjoint from the 105 commands, floor 9, two adverse fixtures. |
| F6X-02 | (a)* | **CLOSED** | Exactly the eight strings `05` §5 states, no ninth, `contested_refs` required and typed in both declarations. |
| RC4-07 | (a)* | **CLOSED** | Census keys pinned and compared across two files; a one-sided narrowing is refused by fixture. |
| F6R-01 | (a)* | **CLOSED** | Both options taken: the partition landed with two ceilings, and the causal clause is gone from the comment. |
| F6R-02 | (b)* | **CLOSED** | The measurement, its date, the matched pattern and the fact that the oracle does not block are all in the RC5-01 block; I reproduced it. |
| F6R-03 | (a) | **PARTIAL** | The assertion exists with a floor, and its pattern does not reach one of the eight families in the corpus it sweeps. |
| F6R-04 | (a)* | **CLOSED** | The note is there, the cure is named, and F6C-11 applied the cure. More than "none required" asked for. |

`*` the source review or register entry assigns no §5 class; the class shown is mine, from the required contract.

---

## 2. Detail per item

### F6A-09 · CLOSED at specification level

**Clauses.** (i) remove both colliding keys, **or** (ii) extend the check to value-registry names **and** to backticked identifiers in the specification prose.

**What satisfies what.** `ConsequenceVector` is absent from `aliases.json#/aliases` (25 rows, floor 20) and present in `not_aliases` with a reason naming `Grant.payload.consequence_bounds` and `02` §96. The declared check is widened: `ALIAS_VALUE_NAMES = set(FILES["value-registry.json"])` and a per-key `checked(candidate_name not in ALIAS_VALUE_NAMES, …)`. Adverse fixture `r30-alias-key-is-a-registered-value-type` restores the exact row F6A-09 found and expects `A CANDIDATE-ERA NAME IS A REGISTERED VALUE TYPE`; the paired benign `r30-alias-table-gains-a-candidate-only-name-benign` adds `CapabilityLedger → StandingHolder`, a name neither registry holds, and must pass. The pairing is right: the refusal keys on "this name is one the package HAS", not on "this row is new", so the table stays addable.

**`CapacityState` stays, and the prose moves instead.** `how_to_read` now reads "a name a candidate wrote and this registry does not have **AS A RECORD**", which is true of all 25 keys and is mechanically checked in both directions. The declined half is argued rather than omitted: extending to backticked prose identifiers would refuse `CapacityState`, and deleting the row would reopen F6D-10, which withdrew half a finding on the ground that the row exists. Both limbs of that argument check out. The finding's own text classes counterexample 2 as "the naming and not the mechanism", so repairing the naming is answering it.

**Residue.** No control binds alias keys against normative prose identifiers. A third path existed and was not weighed: extend the check with a named exemption for `CapacityState`. Minor.

### F6A-10 · CLOSED at specification level

**Clauses.** (i) add `admitter_excluded` to both declarations of the enum, or (ii) drop the clause and cite the guard.

Option (i), in both places. `record-registry.json` gives `ResponsibilityAssignment.payload.custody_tie_break_reason` as `Enum<narrowest_sufficient_scope,alternate_available,earliest_acceptance,no_overlap,admitter_excluded>`; `records.schema.json` declares the same five as a closed `enum`. `guard.custody.admitter_excluded` still exists.

**Two controls, and the second is the load-bearing one.** I recomputed the enum-pair walk with the validator's own logic: **61 pairs, zero mismatches**, against a declared floor of 57. That walk proves the two declarations agree; it cannot prove they agree with the chapters, which the block says in as many words, so a hand-written `CUSTODY_TIE_BREAK_REASONS` literal pins the five members by name. Adverse `r20-custody-tie-break-enum-omits-the-admitter-exclusion` removes a member and expects `DISAGREE ABOUT A CLOSED ENUM'S MEMBERS`; benign `r20-custody-tie-break-enum-reordered-benign` reorders all five and must pass, which is correct because members are a set and no registry predicate reads order.

Generalising the one finding into a walk over every enum pair, then keeping a literal for the case the walk cannot see, is the right shape and is what I would want copied.

### F6C-06 · PARTIAL

The review states no explicit required contract for this one; the finding is that G-07's close "is an instruction to a future implementer rather than a registered row".

**Met.** `value-registry.json#/CapacityMeasure` exists as a closed vocabulary with `schema_ref` resolving to `values.schema.json#/$defs/CapacityMeasure`, whose enum is `["cache_lifetime"]`. Three checks: `cache_lifetime` must be a member; **every** member must occur in the chapter text, read off `sorted(ROOT.parent.glob("*.md"))`, which is the opposite failure and is the better half of the repair; and the vocabulary must be non-empty with a resolving `schema_ref`. Adverse `r31-capacity-measure-invented-in-the-registry` adds `allowance_headroom_ratio`, a name no chapter carries, and expects `A REGISTERED CAPACITY MEASURE IS NAMED BY NO CHAPTER`; benign `r31` rewrites `members_why` and must pass. One member is argued as the honest count, and refusing to invent names for §6's allowance observations is consistent with how F6X-02 was handled through two lanes.

**Unmet.** `CapacityObservation.payload.measure` is `values.schema.json#/$defs/string` in the schema and `string` in the registry. `CapacityMeasure` occurs **0** times in `records.schema.json`, **0** in `commands.schema.json`, **0** in `record-registry.json` and **0** in `predicate-registry.json`. A capacity row may still name any measure it likes. The class the review assigned, (b) "the mechanism documented, its binding unverified", is unchanged by the repair: what is now registered is a name, not a binding. See `F6Y-03`.

### F6C-10 · PARTIAL, residue exact and instrumented

**Clauses.** (i) `attempt_ceiling` required on `WorkOrder`; (ii) a conjunct on `FailureRecord: * → retry_admitted` refusing the transition at the ceiling; (iii) a named phase for the park.

**(i) met.** `required: true` in the registry and `attempt_ceiling` in `records.schema.json#/$defs/WorkOrder/properties/payload/required`, with a dedicated check, `THE WORK ORDER CARRIES NO ATTEMPT CEILING`, not only the generic pair comparison.

**(ii) met, substantively.** `criterion.FailureRecord.retry_admitted.v1` carries `lt(count(/payload/attempt_refs), /payload/attempt_ceiling)` alongside a `nonempty_fields` over `work_order_ref`, `attempt_refs`, `attempt_ceiling` and `next_discriminator`. Both edges into `retry_admitted`, from `observed` and from `investigating`, use that criterion. Pinned, with the `lt`-not-`lte` choice argued ("`lte` would admit the attempt that reaches it"). This is a real comparison, not a collection.

**(iii) owed, and owed well.** `FailureRecord.lifecycle.phases` is still `observed · investigating · retry_admitted · blocked · resolved`. The residue is not merely noted: `checked("parked" not in RECORDS["FailureRecord"]["lifecycle"]["phases"], "FAILURERECORD NOW HAS A PARK PHASE and F6C-10's third clause can be finished…")` fires the moment the phase arrives, and the reason for withdrawal is stated and checkable: each `* → parked` needs its own edge predicate, `tools/author_phase_content.py` authors criteria and not edge predicates, and hand-authoring an edge predicate is the move this package's oracles exist to catch. A tripwire that fails on the arrival of the thing you owe is a better record than a sentence. The residue is exactly what is unmet.

**One observation.** The adverse fixture `r24` removes `attempt_ceiling` from the schema only, so it trips `REGISTRY AND SCHEMA DISAGREE ABOUT WHICH PAYLOAD FIELDS ARE REQUIRED` before reaching the concrete message eleven lines below. That is F6R-04's ordering class, in a repair by the lane that recorded F6R-04's cure. A two-place fixture would reach the concrete message. Not required, per F6R-04's own disposition.

### F6C-11 · PARTIAL, residue exact

**Clause.** A conjunct `gt(retention_until, landed_at + longest_plausible_outage)`.

**What landed instead.** A new required `retention_span: Duration`, `longest_plausible_outage` retyped from `string` to `Duration`, and the conjunct `lt(/payload/longest_plausible_outage, /payload/retention_span)` inside `criterion.UnmatchedPoolEntry.landed.v1`, pinned with the `lt`-not-`lte` reasoning and read off the criterion body **above** the derivation oracle, which is F6R-04's cure applied. A second check requires both operands to `$ref` `/Duration`, so it is a comparison of spans in one unit rather than of two free strings.

**The stated reason for the substitution is verifiable.** `add` takes `DecimalString` and returns `DecimalString`; `UTC` is an ISO-8601 pattern string; `Duration` is a millisecond integer string. `landed_at + longest_plausible_outage` is not expressible in the 57 registered primitives. The retype is a genuine improvement the contract did not ask for: the original field was a `string`, so even the requested comparison would have been between free text.

**Unmet, and declared.** The registry note on `retention_span` reads: *"OWED: nothing yet ties this span to `retention_until` minus `landed_at`."* An entry with `retention_until = landed_at + 1 day` and `retention_span = 30 days` satisfies the criterion. The authoritative retention bound remains `retention_until`, and the comparison is over a self-declared sibling. The residue as written is exactly that, no more and no less.

### F6C-13 · CLOSED at specification level

**Clauses**, from AT-M1-02 as the review restates it: the marking recorded on the `WorkOrder` or the `FieldAuthority`, and R-D18's authorship rule in a predicate rather than in prose.

`critical_fields` and `critical_fields_authority_ref` are both in `WorkOrder`'s schema `required` list. `guard.workorder.critical_fields_authority_excludes_the_resuming_attempt` has three conjuncts: both fields nonempty; `not(eq(/payload/critical_fields_authority_ref, /owner_assignment_ref))`; and `related_phases` requiring the authority assignment be in `accepted`. `edge.WorkOrder.proposed.admitted.v1` calls it, which I confirmed by reading the edge body. It is pinned twice, as a conjunct with `{"op":"eq","negated":true}` and as an attachment to that one edge, and the pin machinery tracks polarity structurally through `polarised_nodes`, so the negation is not a string match. Adverse `r33` strips the `not` wrapper; benign `r33` reverses the three conjuncts.

Pinning on the admission edge rather than anywhere the field is written is the right call and the `why` gives the reason: after the attempt resumes, the party with an interest in the answer is the one still able to write the marking.

### F6D-05 · PARTIAL, and the residue is narrower than what is unmet

**Clause.** Bind the guard to a record the producer cannot author, through `02` §4's `IdentityBinding` or the `current_owner` operator. The review classes it (b), "recorded with its verification owed".

**Met.** `pinned-conjuncts.json#/producer_unauthorable_fields` declares five rows, floor 5, each with record, field, owner, guard and reason. Four checks per row: the registry's field-level `owner` equals the pinned one; that owner differs from the record's `owner_component`; the named guard exists; and the guard body actually contains `/payload/<field>`, so a row cannot pin an ownership nothing evaluates. Adverse `r35` hands `grant_stripping_probe_result` back to S1-C03 in both places and expects `A POSITIVE CONTROL IS OWNED BY THE PARTY IT CONTROLS`; benign `r35` reverses the table.

**Declared residue.** The `not_answered` row is candid: "A row moves to answered_elsewhere when the check answers the finding, not when it answers part of it," with the guard-body rebinding recorded owed.

**What the residue does not name.** Field-level `owner` appears on **8** payload fields across **3** records, and **no predicate in the registry reads it**; the `current_owner` primitive operates on a subject record, not on a field annotation. Meanwhile `SkillVersion.owner_component` is still `S1-C03` and `authorization.write` still reads "only named owner through admitted command/edge", with `permitted_commands` including `skill.admit`, `skill.propose` and `kernel.record.revise`. So the producer retains the write path to the five fields, and the pinned owner constrains the registry's own JSON rather than the record contract. `FieldAuthority` exists, is owned by S1-C01, and carries exactly `field_path`, `authority_assignment_ref` and `declaring_component_id`; AT-M1-02 named it; nothing uses it here. See `F6Y-04`.

### F6D-08 · PARTIAL

**Clauses.** (i) a registry-level assertion that `permitted_commands` is empty for computed projections, pinned by hand; (ii) an `owner_component` that is not the admission authority, **or** an explicit statement that on a derived projection the field means custodian; (iii) a named evaluator binding.

**(i) met, and better than asked.** `computed_projections` holds five rows and `computed_projections_with_writers` holds two. Checks: empty `permitted_commands` per row; `transition_count` compared rather than asserted zero, because `AccessGraph` has 8 edges and a rule false about its own tree is one someone deletes; the writer-exception set compared against the registry, so widening it is a two-place edit; and a completeness assertion that the set of records with `lifecycle.projection: true` equals the union of the two halves. I recomputed: **7** records carry the flag, 5 with `permitted_commands == []` and 2 (`DependencyClosure`, `IndexSnapshot`) with kernel commands, and all seven are declared. Adverse `r34` is mutation m4 verbatim.

**(ii) met by the second option, twice.** `ArmedSet.owner_assignment` in `record-registry.json` now states the custodial reading in the record itself, and `computed_projections_why` repeats it. Putting it on the record matters, since a reader of the record does not come to the pin file first.

**(iii) partially met.** The pin declares `evaluator_modules: ["system/packages/work/armed-set"]` and each member must be some record's registered `planned_module`. It is **`ArmedSet`'s own** `planned_module`, and no other record carries that value, so the binding resolves back to the record it is about. The record's `evaluator_module` field is a required free `string`, demanded nonempty by `criterion.ArmedSet.current.v1` and compared to the pin by nothing. `ArmedSet` still has no `exclusive_factory`, no permitted command and no transition, so the W8 half the block itself raises, "nothing creates an `ArmedSet` either", stands. The `05` §7 sentence is recorded owed.

### F6D-09 · CLOSED at specification level

**Clauses.** (i) `failed_predicate_id: PredicateId`; (ii) `precondition_predicate_ids: PredicateId[]` or `TypedPredicate[]`; (iii) a conjunct asserting each named predicate's `implementation_status` is deterministic, with an adverse fixture.

**(i) and (ii) met in both declarations.** `AdmissionRecord.failed_predicate_id` is `{"$ref": "values.schema.json#/$defs/PredicateId"}` and `PredicateId` in the registry; `StandingInterest.precondition_predicate_ids` is an array of the same, `PredicateId[]` in the registry, required. I confirmed the enum is exactly the registry: **2,398 keys, 2,398 enum members, set-equal**. A `PREDICATE_BEARING_FIELDS` literal holds both. Beyond the contract, `precondition_evaluator_kind` was closed to `{deterministic, model}`, read off the guard's own two comparands, so `"heuristic"` is no longer admissible on the field whose whole subject is that value.

**(iii) returned as a decision, correctly.** See §3 below.

### F6D-12 · PARTIAL

**Clauses.** (i) `reason_kind` an enum of exactly the six; (ii) `reason_unit` an enum of the six units; (iii) a conjunct pairing them; adverse fixture a seventh reason, paired benign each of the six.

**(i) and (ii) met.** Against `05` §4's two-column table read directly: the six kinds and six units are registered, set-equal, in both the schema enums and the registry `Enum<…>` types, both required. Checks compare each against a hand-written `EXISTENCE_REASON_PAIRS` literal. Adverse `r21` adds `specialized_knowledge`, the reason `05` §4 refuses by name, and expects `A SEVENTH ADMITTED REASON IS WRITABLE`.

**(iii) the data is right and the control is not.** `criterion.ExistenceJustification.admitted.v1` genuinely carries `any(all(eq(reason_kind,K), eq(reason_unit,U)) × 6)`, and I extracted all six pairs: they match `05` §4 exactly. But the check guarding it is `'"%s"' % _kind in _ej_body and '"%s"' % _unit in _ej_body`, evaluated per string, over the serialised body. I swapped `input_set` and `effect_class` between branches, producing `input_provenance` predicating on `effect_class` and `consequence_class` on `input_set`, and the check still passes, as does the pin, whose `require` row asks only for an `any` op containing both pointers. The derivation in `tools/phase_content.py` would carry the same swap into the criterion, so the drift oracle agrees too. The comment above the check claims it verifies "every one of the six pairs is stated somewhere under the criterion's disjunction"; it verifies that twelve strings occur. See `F6Y-02`.

### F6X-01 · CLOSED at specification level

**Clauses.** Register the commands or retire the declarations; add a validator check that every `exclusive_factory` resolves.

Neither offered option; a third, declared and argued. Registering three command contracts for unspecified paths is inventing contract; deleting "only the kernel may create a `DomainEvent`" deletes a true containment. Instead `KERNEL_FACTORY_PATHS` is a closed literal of exactly three, membership is **exact and not a `kernel.` prefix**, and a check asserts the surface is disjoint from the command registry. I recomputed: **9** declarations, 6 resolving to registered commands out of 105, 3 to the literal, zero overlap between the two surfaces, floor 9. Two adverse fixtures, `r28` naming an unregistered command and `r29` inventing `kernel.commit_events` to hold the prefix rule shut, each with a benign twin repointing `ArmedSet` at a legal target.

Reading the contract as "make every declaration resolve to something a reader can find, without inventing contract" is the right reading. The residue, that the three paths are still unspecified, is stated in the block.

### F6X-02, contracts half · CLOSED at specification level

The brief asks whether exactly the strings `05` §5 states are registered. Read from `05` §5 directly: eight `boundary_kind` members and one field name, with the chapter's own amendment note correcting an earlier "ten strings" to nine.

Registered `ConstraintSet.payload.boundary_kind` enum: `delegation, machine_handoff, consultation_return, continuation, acceptance_submission, founder_brief, custody_transfer, stage_import`. **Set-equal to the chapter's eight. Eight, not nine, not seven.** The registry `Enum<…>` carries the same eight, the field is `required: true` in both declarations, and `criterion.ConstraintSet.issued.v1` reads it. `contested_refs` is `Ref<Record>[]` in the registry and a typed array of record references in the schema, required in both `required` lists, with a check refusing optionality and a second refusing a non-ref type. Adverse `r26` adds a ninth; adverse `r27` strikes `contested_refs` from both `required` lists; both have reorder-only benign twins.

Nothing was invented. The two lanes that refused to derive these strings before the chapter stated them were right to refuse, and this lane registered exactly what the chapter then stated.

### RC4-07 · CLOSED at specification level

**Clause.** Floor the census presence the way pins are floored, or pin the census keys in `pinned-conjuncts.json`.

Second option. `census_keys` holds the eight, and `CENSUS_KEYS_PINNED == CENSUS_KEYS` is compared against the literal in `validate_contracts.py`, so narrowing the census is a two-place edit whose diff names what left. Set equality is stronger than the floor that was offered, catching widening as well as narrowing. Adverse `r32` drops `under_negation` from the pin alone and expects `THE CENSUS KEY SET IS DECLARED TWICE AND THE TWO DISAGREE`; benign `r32` reorders all eight. The reasoning, that the census is the only thing in the verdict saying how far the demand walk reached, so a quietly narrowed census is a quietly narrowed coverage claim, is correct and is why this was worth doing.

### F6R-01 · CLOSED at specification level

**Clause.** Split `unanswered` into two declared sets each with its own bound, **or** drop the causal clause from the comment.

Both. The comment now records what it used to claim and why that was false, and the causal clause is gone. `answered_elsewhere` holds 4 rows, each naming a `file` that must exist and a `check`, and `not_answered` holds 37, each with a reason. Four checks: the union equals `unanswered` exactly; the halves are disjoint; every `answered_elsewhere` row has a non-blank file and check and the file resolves; every `not_answered` row has a reason. Two ceilings, 4 and 37, against a raised `UNANSWERED_CEILING = 41`, with the growth from 37 to 41 explained by newly declared findings rather than by slippage.

The reasoning for two bounds rather than one, that a single ceiling lets an entry cross from "answered" to "not answered" for free and that crossing is exactly what the finding is about, is right.

**Two observations, carried to `F6Y-08`.** The comment's one-line gloss, "`not_answered` is nothing here answers it", is contradicted by its own rows for `F6A-09` and `F6C-06`, which say only that no file-and-check pair is recorded, and both of those demonstrably have one. And `ANSWERED_ELSEWHERE_CEILING = 4` equals the current size, so recording a verified repair costs an edit to `validate_contracts.py`, which the row's own text calls cheap.

### F6R-02 · CLOSED at specification level

**Clause.** One sentence in the RC5-01 block recording the tier and that the expense is a review convention, **or** a tier-floor entry.

First option, with the measurement rather than an assertion: the block names the exact command, its date, the result, the matched pattern and the floor, then draws the conclusion that the cost of editing the file is a review convention and not an enforced tier, and says so without using that as an argument for weakening it. I reproduced the measurement independently:

```
node scripts/classify.mjs docs/vision-system/planning/specification/contracts/validate_contracts.py
    tier=trivial · enforcement=shadow
    matched: docs/**
floor=trivial
```

The lane declines to record a `check` for this in `answered_elsewhere`, on the ground that claiming one would commit the error the finding is about. That refusal is the most disciplined single act in the package.

### F6R-03 · PARTIAL

**Clause.** Assert that every Step 6 finding id appearing in the swept F2-06 review documents is a key of `finding_sources`, so the `unanswered` denominator cannot silently shrink.

**Met, over the pattern's own output.** A separate `STEP6_ID = F6[A-DRVX]-\d\d` over `planning/reviews/F2-06-*.md`, a floor of 60 under the sweep so a sweep that finds nothing cannot pass vacuously, and a per-id membership assertion. I reran it: 7 documents at the subject, 64 ids, all present in the 116-row `finding_sources`, zero missing. The decision not to widen the shared `FINDING_ID` pattern is argued and the argument holds, since widening would demand a pin or an `unpinnable` row for every F6V id in the same edit.

**Unmet.** The sweep's own pattern is not the corpus. At `3e51a9e` the same seven documents raise **72** `F6?-NN` ids across eight families; `F6W-01…08` fall outside `[A-DRVX]`, are raised 31 times in `F2-06-recheck-03.md`, and hold **no `finding_sources` row**. The floor of 60 is over the narrow output and cannot see them. This is precisely the disappearance the block describes: "not refused, not deferred, absent." See `F6Y-01`.

### F6R-04 · CLOSED at specification level

**Clause.** None required; if acted on, note in the F6D-07 block that a hand edit surfaces as drift and that the named message is reachable only after re-derivation.

The note is in the F6D-07 block, says exactly that, names the cure, and states why the cure is not applied here: moving the two checks means moving the schema lookups they depend on, which is a reordering with no fixture behind it. Separately, F6C-11's check was **placed above the derivation oracle** for this reason, with the reason written at the placement. The `not_answered` row calls it "ANSWERED BY A NOTE, NOT BY A CHECK", which is accurate. More was delivered than "none required" asked for.

---

## 3. The two flagged judgements

### (a) S1-C04 as owner of the five producer-unauthorable control fields

**The claim under test**, from `producer_unauthorable_fields_why`: *"S1-C04 is chosen because it owns IdentityBinding (`02` section 4), which is the binding the finding names; it is a reading of the chapters, not a decision the chapters state, and a recheck should look at it as such."*

**What `02` §4 says.** Lines 67 to 113 of `02-authority-recovery.md` contain **zero** `S1-C0*` component ids and mention `IdentityBinding` **once**, inside the mutual-TLS paragraph: "Authentication checks certificate chain plus the current IdentityBinding epoch and admitted runtime/instance." The section assigns no owner to anything. The fact that S1-C04 owns `IdentityBinding` is true, and it comes from `record-registry.json#/IdentityBinding/owner_component`, not from the chapter cited. A reader who follows the citation to adjudicate the choice finds nothing to adjudicate it with.

**Does the chapter support the choice on the merits?** Partly, and unevenly across the five.

- `declared_tool_grant_effect`, `grant_stripping_probe_result` and `grant_stripping_probe_ref` are grant facts. `05` §4 says `GrantDeliveryReceipt` is "written once, **by the enforcement point**", and `GrantDeliveryReceipt`, `Grant` and `ProjectionGrant` are all S1-C04-owned; `03` §27 gives C04 "grants, reservations, release". **Supported.**
- `content_hash_rechecked_at_use` is a provenance recheck, and `03` §27 gives **C05** "validity/lineage". C05 satisfies the finding's constraint equally well. **Contested.**
- `StandingInterest.precondition_evaluator_kind` is a classification of whether an evaluator invokes a model. The row's `why` argues only that C02 is wrong, not that C04 is right; C06, which `03` §27 gives "evidence/acceptance", has at least as good a claim. **Unsupported by anything I can find.**

**Judgement.** The chapter does not support it, in the sense that it does not state it and the cited section names no owner at all. The constraint the finding actually imposes is *not the producer*, which is satisfied by three components; choosing among them is a decision the chapters have not made, and the lane made it. That is not an abuse: a specific, checked owner is better than a free field, and the lane disclosed the move in the data rather than in a session file. But the disclosure understates it by calling it "a reading of the chapters" while citing a section that reads no way at all on the question. Recorded as `F6Y-05`, class (b), with the required contract being that the owner of each control field be stated in a chapter or the choice registered as an open question, and that the citation be corrected to the registry.

### (b) F6D-09's determinism conjunct returned as a decision

**The claim under test:** the conjunct was declined because `implementation_status` is single-valued across all predicates.

**Measured, by me, independently.** `collections.Counter` over the 2,398 entries of `predicate-registry.json` returns exactly one distinct value, with count 2,398: `"specified; conformance interpreter only, no production binding implemented"`.

**Judgement: honest reading, not evasion**, and for a stronger reason than the one given. Two things are true. First, a conjunct over a single-valued field is vacuous, which the block says. Second, and sharper: the one value **does not contain the word "deterministic" at all**, so "assert this predicate's registered `implementation_status` is deterministic" has no comparand in the registry. The conjunct could not be written to mean what it says; it could only be written to look like it. Writing it would have produced "a guard that collects the evidence for the ceiling and never applies it", which is fixture `r16-08`'s own anti-shape, in the repair for a finding about exactly that.

**And the decline is instrumented, which is what makes it a decision rather than a skip.** The tripwire is an **equality against a named literal**, `_statuses == {CONTRACT_PREDICATE_STATUS}`, not `len(_statuses) == 1`; the block gives the reason, that a registry-wide rewrite to some other single string would pass a count and defeat the whole point. The fixture-only sentinel is excluded **by value**, not by provenance, so a fixture introducing a genuine second classification still trips it, which adverse `r25-predicate-status-gains-a-second-classification` holds open and benign `r25-predicate-status-fixture-sentinel-ignored-benign` holds the exclusion itself to. The failure message tells the next reader what to do: write the conjunct, type the field against the deterministic subset, delete the check.

The one thing I would want said out loud and is not: the residue is **not** "the conjunct is owed", it is "**the classification is owed, and the conjunct after it**". The `answered_elsewhere` row for F6D-09 gets this right; the chapter does not carry it.

---

## 4. New findings

### F6Y-01 · (a) · high · The F6R-03 sweep's own pattern does not reach one of the eight Step 6 families in the corpus it sweeps

**Passage.** `validate_contracts.py`: `STEP6_ID = re.compile(r"\b(F6[A-DRVX]-[0-9][0-9])\b")`, over `STEP6_CORPUS = sorted((ROOT.parents[2] / "planning" / "reviews").glob("F2-06-*.md"))`, with `checked(len(_step6) >= 60, …)` and a per-id `checked(_finding in FINDING_SOURCES, …)`.

**Counterexample, computed at the frozen subject `3e51a9e`.** Widening only the family letter to `F6[A-Z]-\d\d` over the identical seven documents returns **72** ids in eight families: `F6A F6B F6C F6D F6R F6V F6W F6X`. `F6W` is not in `[A-DRVX]`. The eight excluded ids are `F6W-01` through `F6W-08`; all eight are raised in `planning/reviews/F2-06-recheck-03.md`, which occurs 31 times in that document; and **none of the eight is a key of `finding_sources`**. The floor of 60 is computed over the narrow pattern's output, 64, so it does not catch the exclusion either. At HEAD `4bc2a9f` the same query returns 81 ids in nine families and 17 outside the pattern, none with a source row.

**Why this is the finding's own subject and not an adjacent nitpick.** The block's argument for the check is that a finding missing from `finding_sources` "is not counted as unanswered, it is not counted at all, which is the quietest way for a review finding to disappear." F6W findings are not hypothetical disappearances: `05` §5 carries two amendments attributed by name to `F6W-07` and `F6W-08`, so this family has already changed the specification while being invisible to both coverage tables. The lane's recorded residue concerns the **shared** `FINDING_ID` pattern and expressly claims of its own sweep that it asserts "the one thing the finding asks for: source-row coverage". That claim is false for one family in eight.

**Required contract.** Derive the family set rather than writing it, or assert the pattern's own coverage: sweep `F6[A-Z]-\d\d` over the corpus and refuse any family letter not in a declared, hand-written literal, so adding a family is an edit a reviewer sees. Add `finding_sources` rows for `F6W-01…08` and place each in exactly one half of the partition. Adverse fixture: a review document raising a finding in an undeclared family. Paired benign: a review document raising a finding in a declared family that already has a row.

### F6Y-02 · (a) · medium-high · The F6D-12 pairing control cannot distinguish the six correct pairs from a shuffle, and its comment says it can

**Passage.** `validate_contracts.py`, the F6D-12 block: `_ej_body = json.dumps(PREDICATES["criterion.ExistenceJustification.admitted.v1"]["body"])` then, per pair, `checked('"%s"' % _kind in _ej_body and '"%s"' % _unit in _ej_body, …)`. The comment above it reads: *"every one of the six pairs is stated somewhere under the criterion's disjunction, and a pair that is not is a reason admitted with no unit it can predicate on."*

**Counterexample, computed.** Swapping the `reason_unit` constants of the `input_provenance` and `consequence_class` branches yields a criterion admitting `input_provenance` predicating on `effect_class` and `consequence_class` on `input_set`. All twelve strings remain present, so every one of the six checks passes. The pin's `require` row asks for `{"op": "any", "contains_pointers": ["/payload/reason_kind", "/payload/reason_unit"]}`, which is also satisfied. Made in `tools/phase_content.py` instead, the criterion regenerates with the swap and the derivation oracle agrees with it. No control in the package refuses it.

**Why it matters.** The failure the check's own message names is "a criterion applied to a unit where it returns undecidable, which R2 F-20 names and which reads as SATISFIED". A shuffle produces exactly that for two of the six reasons, and is the likeliest hand-edit error in a six-row table.

**Required contract.** Compare structurally: walk the `any` node's branches and assert the set of `(reason_kind, reason_unit)` constant pairs equals `EXISTENCE_REASON_PAIRS`, rather than testing string presence over the serialised body. Adverse fixture: two units swapped between branches. Paired benign: the six branches in a different order, which must pass.

### F6Y-03 · (a) · medium · `CapacityMeasure` is the package's only closed vocabulary and no field, command or predicate uses it

**Passage.** `value-registry.json#/CapacityMeasure`, `values.schema.json#/$defs/CapacityMeasure` = `{"type":"string","enum":["cache_lifetime"]}`, against `records.schema.json#/$defs/CapacityObservation/properties/payload/properties/measure` = `{"$ref":"values.schema.json#/$defs/string"}` and `record-registry.json#/CapacityObservation` `measure: "string"`.

**Measured.** `CapacityMeasure` occurs 0 times in `records.schema.json`, 0 in `commands.schema.json`, 0 in `record-registry.json` and 0 in `predicate-registry.json`. `cache_lifetime` occurs in 0 predicate bodies. Of the value-registry entries carrying a `members` key there is exactly **one**, and it is this one, referenced by no schema field.

**Why this is F6D-09's shape one registry over.** F6D-09's title is "`PredicateId` is a 2,387-entry enum that zero record fields use", and the fix was to type the two fields against it. The repair for F6C-06 created a new enum that zero record fields use, in the same commit family, and the check that guards it guards the vocabulary's membership rather than any field's conformance to it. A capacity row may still record `measure: "whatever"`, so R-G07's close remains an instruction to a future implementer, which is what F6C-06 said.

**Required contract.** Type `CapacityObservation.payload.measure` as `CapacityMeasure` in both declarations, with the registry/schema enum-pair walk then covering it automatically. Adverse fixture: a capacity observation whose measure is a free string outside the vocabulary. Paired benign: the vocabulary reordered, or a second member added that a chapter names.

### F6Y-04 · (a) · medium · Field-level `owner` is read by no predicate, the record still grants the producer write, and `FieldAuthority` is the mechanism that exists and is unused

**Passage.** `record-registry.json`, the `owner` key on `SkillVersion.payload.{declared_tool_grant_effect, grant_stripping_probe_result, grant_stripping_probe_ref, content_hash_rechecked_at_use}` and `StandingInterest.payload.precondition_evaluator_kind`; `SkillVersion.authorization.write`; `record-registry.json#/FieldAuthority`.

**Measured.** Exactly **8** payload fields across **3** records carry a field-level `owner`. No predicate in the 2,398 reads it; the `current_owner` primitive takes a `subject_ref` and resolves record ownership, not a field annotation. `SkillVersion.owner_component` is `S1-C03`, `authorization.write` is "only named owner through admitted command/edge", and `registration.permitted_commands` includes `skill.admit`, `skill.propose` and `kernel.record.revise`. `FieldAuthority` exists, owned by S1-C01, with `field_path`, `authority_assignment_ref`, `declaring_component_id`, `epoch` and a three-phase lifecycle, and 12 predicates mention it; none binds it to any of the five control fields.

**Path to harm.** A producing executor writes `grant_stripping_probe_result: "absent_at_enforcement_point"` through `skill.admit`. `guard.launcher.stripping_positive_control` reads that field and passes. The positive control on grant removal is still the controlled party's assertion about itself, which is F6D-05's sentence verbatim. What the repair changed is a line of registry JSON that two checks compare to a pin.

**Why the declared residue does not cover it.** The `not_answered` row scopes the owed work to "the rebinding of three guard BODIES to a record the producer cannot author, through IdentityBinding or `current_owner`". That is one route. It omits the nearer one: the field annotation itself has no enforcement path at record-contract level, and AT-M1-02 named `FieldAuthority`, which exists with the right shape.

**Required contract.** Either state in `record-registry.json` that a field-level `owner` is documentation and not authority, so no reader mistakes it, or bind it: require a current `FieldAuthority` whose `field_path` names the control field and whose `authority_assignment_ref` resolves to an accepted assignment outside the record's `owner_component`, as a conjunct on the edges that write those fields. Adverse fixture: the producing executor writing a control field with no current `FieldAuthority` naming it. Paired benign: a non-producer writing it with one.

### F6Y-05 · (b) · medium · The S1-C04 designation cites a section that names no component owner

**Passage.** `pinned-conjuncts.json#/producer_unauthorable_fields_why`: *"S1-C04 is chosen because it owns IdentityBinding (`02` section 4)."*

**Counterexample.** `02-authority-recovery.md` §4, lines 67 to 113, contains zero `S1-C0*` ids and one mention of `IdentityBinding`, in the mutual-TLS paragraph, assigning no owner. The ownership is declared in `record-registry.json#/IdentityBinding/owner_component`. Two of the five rows have a competing chapter claim: `03-company-capabilities.md` §27 gives C05 "validity/lineage", which reaches `content_hash_rechecked_at_use`, and C06 "evidence/acceptance", which reaches `precondition_evaluator_kind`; neither row's `why` argues against those, only against the producer.

**Class.** (b). The mechanism is documented and checked; its grounding in the chapters is what is unverified. Not (d): an implementer is not left to invent policy, because a specific owner is registered and cross-pinned.

**Required contract.** Correct the citation to the registry. Then either have `05` §1 or `02` §4 state the owner of each control field, or register the choice as an open question with the chapter owner, so that a later lane reading "it is a reading of the chapters" can find the chapter text it is a reading of.

### F6Y-06 · (a) · low · Eight of the sixteen repair fixtures cite review documents that do not exist, and nothing checks a fixture's citations

**Passage.** The `finding` field of `fixtures/negative/r26`, `r27`, `r30`, `r31` and their four benign twins.

**Measured.** Three cited paths do not resolve: `reviews/F2-06-A-authority-boundaries-adversarial.md` (2 fixtures, r30 pair), `reviews/F2-06-C-capacity-integration-adversarial.md` (2 fixtures, r31 pair), `reviews/F2-06-X-cross-cutting.md` (4 fixtures, r26 and r27 pairs). The real names are `F2-06-A-completeness-coherence-vision-binding.md` and `F2-06-C-capacity-reliability-changeability-alternatives.md`; there is no cross-cutting review document at all, the F6X findings living in `registers/review-findings.json`, which `r28` and `r29` cite correctly. Separately, `fixtures/positive/r18-breach-or-perform-record-names-no-branch-benign.json` names `paired_adverse_fixture: fixtures/negative/r18-breach-or-perform-record-names-no-branch.json`, which does not exist; the adverse twin is a directory. Nothing in `validate_contracts.py`, `tools/run_negative_fixtures.py` or `tools/run_positive_fixtures.py` reads `finding`, `paired_benign_fixture` or `paired_adverse_fixture`.

**Why it is worth a line.** `finding_sources` resolves 15 of 15 documents, and `answered_elsewhere` rows have their `file` existence checked, so the package already holds this standard for its other citations. The fixture is where a later reader goes to find out why a control exists.

**Required contract.** Assert that a fixture's `finding` citation, where it names a repository path, resolves, and that `paired_benign_fixture` / `paired_adverse_fixture` resolve to a declared fixture in the other manifest. Adverse fixture: a fixture citing a nonexistent review. Paired benign: a fixture citing a review by a path that exists under a new name.

### F6Y-07 · (b) · low · Three frozen counts in validator comments have drifted from the data beside them

**Measured.** The F6A-10 block says "FIFTY-SEVEN payload fields carry a closed enum"; the walk meets **61**. The F6D-09 block says "exactly ONE value across all 2,397 registered predicates"; the registry holds **2,398**, and the `PredicateId` enum is set-equal to it at 2,398. The F6X-01 block's "nine records declare it" is correct at 9.

Neither drifted number is load-bearing: the enum count is guarded by a floor of 57 and the status claim by a set equality, so both checks are correct. The cost is to a reader who recounts and finds a different number in a file whose entire subject is the difference between a claim and what checks it.

**Required contract.** State the counts as floors with the current value derived, or move them into the failure payload where they are computed, as the `ENUM_PAIRS` and `UNANSWERED_CEILING` messages already do.

### F6Y-08 · (a) · low · `not_answered` holds findings this package answers with a named check and a fixture pair, and its ceiling makes correcting that an edit to the validator

**Passage.** `validate_contracts.py`, the F6R-01 block: *"`not_answered` -- nothing here answers it, and the row says why not"*, then `ANSWERED_ELSEWHERE_CEILING = 4` with `len(ANSWERED_ELSEWHERE) == 4`.

**Counterexample.** `F6A-09` sits in `not_answered`, and a file-and-check pair is nameable for it: `validate_contracts.py`, the check `A CANDIDATE-ERA NAME IS A REGISTERED VALUE TYPE`, fixtures `negative/r30-alias-key-is-a-registered-value-type` and `positive/r30-alias-table-gains-a-candidate-only-name-benign`. Same for `F6C-06`: `A REGISTERED CAPACITY MEASURE IS NAMED BY NO CHAPTER`, fixtures `r31`. Both rows carry the boilerplate "No file-and-check pair is recorded here for it," which is true of the record and not of the tree. The row for `F6R-01` says "Moving one across is cheap"; with `answered_elsewhere` at its ceiling, moving one across requires raising a literal in `validate_contracts.py`, which the same file calls the expensive act.

**Why it is worth a line rather than nothing.** The direction of error is safe, and the block argues for exactly that pessimism, which I credit. But `not_answered`'s count is the number a later reader will quote as "still unrepaired", and it currently overstates by at least two; and the one control that would let a lane correct it charges the price the package reserves for weakening things.

**Required contract.** Align the gloss with the rows, which already say the narrower thing, and set `ANSWERED_ELSEWHERE_CEILING` above its current size so that recording a verified repair is a data edit and only the total, `UNANSWERED_CEILING`, stays a validator edit. Adverse fixture: a row moved to `answered_elsewhere` with a file that does not exist. Paired benign: a row moved across with a file and check that resolve.

---

## 5. Not checked

- **The validator was not executed**, per the brief. The green full run of 305,223 checks, 111/111 adverse refused for their own reason and 72/72 benign passed is the orchestrator's measurement, not mine. I verified that each of the sixteen adverse fixtures names a message string that exists in `validate_contracts.py`, that all 111 negative and 72 positive fixtures are declared and on disk with no drift in either direction, and that both manifests sit exactly at their floors. **I did not confirm that any adverse fixture actually fails, nor that it fails for its own reason rather than a neighbour's.** For `r24` I have positive reason to think it reaches the generic required-fields message before the concrete one, which is a `wrong_reason` risk of the kind `tools/run_negative_fixtures.py` exists to measure and I could not measure.
- **No runtime, no interpreter.** `subset`, `count`, `unique`, `lt` and `related_phases` have registered semantics and no implementation. Every "compares", "refuses" and "demands" above is about what a document says.
- **The prose layer.** I read `05` §4 and §5 and `02` §4 only, and only for the strings and the ownership question the brief named. I did not judge the chapters against the findings; `F6V-01…04` are prose-side and are correctly outside this pass.
- **Excluded by the brief and not read:** `.worktrees/`, `.claude/worktrees/`, `docs/08-agents_work/**`, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, `planning/site/**`, `planning/F2/07-repair-names-contract.md`, `planning/F2/08-repair-names-prose-b.md`, `planning/reviews/F2-06-findings-index.json`, `.claude/memory/**`. Consequence: where a lane records a residue "in `F2/07-repair-names-contract.md`" I verified that a residue is declared in the contracts layer and could not verify that its content matches. That applies to F6D-05, F6D-08, F6X-01 and F6R-03.
- **`registers/review-findings.json`:** only `id`, `issue`, `required_contract` and `proposed_repair` for `F6X-01`, `F6X-02`, `RC4-07` and `F6V-02`. **`RC4-07`'s `issue` field is empty** at `3e51a9e`, so that item was verified against its `required_contract` alone.
- **`F2-06-recheck-04b.md`**, which landed mid-review, was not read beyond counting finding ids for `F6Y-01`.
- **Findings outside the seventeen** were not reviewed. The other 35 `not_answered` rows, the 30 guards F6D-05 measures beyond the five now pinned, and the 33 of 46 criteria with no comparison operator that F6C-11 notes as context are all untouched here.

---

## 6. Standing caveat

No runtime exists. Every "closed", "repaired" and "sufficient" in this report is about **specified behavior checked offline**, by a reviewer of one model family with procedural independence only, against a protocol frozen before the work it judges. Nothing here establishes runtime conformance, deployment readiness, actual fulfillment, or the business value of the intended system. The `irreversible`-tier requirement of a 2-of-3 multi-judge panel across two distinct model families is unmet for this review as it is for every other in this round, because no non-Anthropic model is reachable from inside this harness; that is an accepted risk with an exit condition, not a satisfied requirement, and this review does not discharge it.