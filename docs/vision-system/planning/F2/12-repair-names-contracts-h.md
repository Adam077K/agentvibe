# F2 · r8-contracts-h — the names contract

**What this file is.** Every name lane `r8-contracts-h` registered, and — the part a recheck should read
first — every briefed item it did **not** land, with the reason and the cure named. A name not in this
file was not registered by this lane.

**Standing caveat, and it governs every row.** Author-recorded, one model family, awaiting independent
recheck. **No runtime of any kind exists.** Every check below is specified behaviour checked offline by
`validate_contracts.py` against the committed registries.

**Base:** `f560f8d` · **Branch:** `docs/vision-r8-contracts-h`

**The light validator was GREEN at the base commit** — checks 305,309 · negative declared 117 · positive
declared 78, exit 0. Unlike lane G, this lane had nothing to repair before it could start.

---

## Names registered

| name | kind | item / finding |
|---|---|---|
| `natural_key_resolution` (`applies_to` · `on_conflict` · `creates_second_record` · `why`) | key in `command-registry.json#/kernel.record.register/transaction_contract` | item 1 (F6V-02) |
| `resolve_to_existing_head` | the constant `on_conflict` is compared to | item 1 |
| `natural_key_create_paths` · `natural_key_create_paths_why` | JSON keys in `pinned-conjuncts.json`, 4 rows; row keys `record` · `natural_key` · `create_path` · `on_conflict` · `why` | item 1 |
| `NATURAL_KEY_PATHS` · `NATURAL_KEY_PATH_FLOOR` (4) · `NATURAL_KEY_PATH_KEYS` · `RESOLVE_OR_CREATE` | validator names | item 1 |
| `A NATURAL-KEY RECORD NAMES NO CREATE PATH` | check | item 1 |
| `THE CREATE PATH FOR A NATURAL-KEY RECORD DOES NOT RESOLVE TO THE EXISTING HEAD` | check ×2 | item 1 |
| `natural_key_create_paths` | `HAND_WRITTEN_CONTROLS` row | item 1 |
| `R42` · `r42-a-natural-key-record-is-created-twice` + `r42-the-natural-key-create-path-rows-reordered-benign` | fixture pair | item 1 |
| `capability_refs` on `StandingHolder.payload` | `record-registry.json` (`type_fields` `string[]`, `fields.required: true`, `required_fields`) + `records.schema.json` (`type: array`, `minItems: 1`, items `$ref` string, in `required`) | item 2 (F6W-01) |
| `capability_publishing_structures` · `capability_publishing_structures_why` | JSON keys in `pinned-conjuncts.json`, 1 row; row keys `record` · `field` · `minimum` · `why` | item 2 |
| `CAPABILITY_PUBLISHERS` · `CAPABILITY_PUBLISHER_FLOOR` (1) · `CAPABILITY_PUBLISHER_KEYS` | validator names | item 2 |
| `A STANDING STRUCTURE THAT OWNS A CAPABILITY ACCEPTANCE PUBLISHES NO capability_refs` | check ×2, one per declaration | item 2 |
| `A CAPABILITY BINDING MAY BE PUBLISHED EMPTY` | check | item 2 |
| `capability_publishing_structures` | `HAND_WRITTEN_CONTROLS` row | item 2 |
| `R43` · `r43-a-standing-holder-may-publish-an-empty-capability-binding` + `r43-the-capability-publishing-row-reason-edited-benign` | fixture pair | item 2 |

**Constants moved, each comment stating the value its constant holds.**
`NEGATIVE_FIXTURE_FLOOR` 117 → 118 (R42) → 119 (R43), committed 119 ·
`POSITIVE_FIXTURE_FLOOR` 78 → 79 (R42) → 80 (R43), committed 80 ·
new `NATURAL_KEY_PATH_FLOOR` = 4 · new `CAPABILITY_PUBLISHER_FLOOR` = 1.
No ceiling moved; no floor took headroom.

**Light validator after every commit:** `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` → exit 0.
Final: **checks 305,359 · negative declared 119 (floor 119) · positive declared 80 (floor 80)**.

**Fixtures executed, singly, by this lane** — the runner has no single-fixture CLI, so each was run through
`run_negative_fixtures.run_fixture` / `run_positive_fixtures.run_fixture` on its own discovered document,
which is the same `execute_fixture` the suite uses:

| fixture | verdict |
|---|---|
| `r42-a-natural-key-record-is-created-twice` | **rejected as required** |
| `r42-the-natural-key-create-path-rows-reordered-benign` | **accepted as required** |
| `r43-a-standing-holder-may-publish-an-empty-capability-binding` | **rejected as required** |
| `r43-the-capability-publishing-row-reason-edited-benign` | **accepted as required** |

No other fixture was executed. The full adverse and benign suites are the orchestrator run on the merged head.

---

## Item 1 — F6V-02 · LANDED

`record-registry.json` asserted RESOLVE-OR-CREATE on the `EffectIdentity` triple — the mechanism `05` §6
needs for *a second claimant joins the first and inherits its outcome* — and a one-per-key rule on
`AdmissionRecord`, `ExhaustionDecision` and `FieldAuthority`. `kernel.record.register` is the only create
path any of the four names, and it said nothing about natural keys at all. One file asserted a uniqueness
semantics no create path carried.

**The statement is STRUCTURED, not prose, and that is the design.** `on_conflict` is compared to a
constant and `creates_second_record` must be exactly `False` — not merely falsy — so the check cannot be
satisfied by a sentence containing the word resolve. F6Y-02 is the precedent: a check that reads strings
out of a serialised body passes on a body whose meaning was inverted.

**The row set is compared to the registry IN BOTH DIRECTIONS.** A floor alone would let the next record
declaring `identity.natural_key` arrive with no create-path row and nothing would say so. Four declare one
today; the equality is the binding control and `NATURAL_KEY_PATH_FLOOR` is the backstop under it.

**What this does NOT close, stated rather than left.** None of the four records declares a
`registration.exclusive_factory`, so every row names the generic command. The check asserts the row agrees
with whatever factory the record declares, so a record that later gets one must move its row with it — but
nothing here forces a natural-key record to HAVE an exclusive factory, which was F6V-02 first option.
Taking it would mean authoring create-command contracts for four records, the fabrication F6X-01 was
refused for through two lanes.

## Item 2 — F6W-01 · LANDED, with one substitution and one absence, both stated

`05` §12 specifies R-X07 and says of itself: *registering `capability_refs` on the record shapes under
`contracts/**` is the contracts lane work and has not landed, so this rule is specified and unregistered,
which is its honest status.* That is now false in the direction the chapter wanted.

**`minItems: 1` carries the non-empty half, and it is a keyword this schema had never used** — 0
occurrences before this commit. `required` alone admits `[]` in every JSON Schema implementation there is,
and `05` §12 counts coverage over the 46 capability ids individually with *a capability no structure names
is uncovered, not covered by default*. A standing office publishing an empty binding is one no capability
id can be counted against, which is the state R-X07 exists to end.

**TYPE SUBSTITUTION, stated rather than made silently.** `05` §12 words the field `Ref<Capability>[]`.
There is **no `Capability` record** in `record-registry.json` and no `CapabilityId` value type, so
`Ref<Capability>[]` resolves to nothing and the ref-target check refuses it. Shipped: `string[]` with
`minItems: 1`. **The vocabulary typing is OWED and is the obvious next step** — a `CapabilityId` closed
vocabulary over the 46 ids in `planning/specification/capabilities.json#/capabilities`, declared in
`value-registry.json` + `values.schema.json` the way `CapacityMeasure` is, after which the items `$ref`
moves to it. Not taken here because adding a value type reaches the inventory derivation and the
source-field mappings, and a half-landed value type is worse than a named one.

**ONE row is the honest count.** `05` §12 closes the publishing set to two members: `StandingHolder` and
*the acceptance-owner role record*. The second has **no record in `record-registry.json`** — the nearest
names are `AcceptanceInterval`, `HandoffAcceptance` and `StandingInterest`, and `05` §12 puts
`StandingInterest` explicitly out of scope. Inventing a record to carry the row would be specification by
side effect. **Owed to the chapter owner or a later contracts lane:** either name the acceptance-owner role
record in `record-registry.json`, or amend `05` §12 to say the closed set has one registered member and one
specified without a record shape.

---

## NOT LANDED — items 3, 4 and 5, with the reason and the cure named

The lane worked items **1 and 2** and stopped on turn budget, not on a blocker. Items were taken in the
briefed order, smallest first. `R44`, `R45` and `R46` are free; nothing below is started and nothing below
is half-done in the tree.

- **Item 3 — F6C-11 instant-offset primitive. NOT STARTED.** Turn budget. The shape is settled in `07`:
  register `UTC` + `Duration` → `UTC` in `primitive-registry.json` with its type contract, add the DSL code
  to `tools/phase_content.py`, regenerate `criterion.UnmatchedPoolEntry.landed.v1`, re-pin, bind
  `retention_span` to `retention_until − landed_at`, and then `retention_span` should be **deleted** rather
  than kept beside the literal form. The adverse half must be made **in the derivation** and regenerated —
  the R40 mechanism — because a hand edit of a criterion is refused as drift before any new rule is reached.
- **Item 4 — F6B-03 checker identity on `AcceptanceInterval`. NOT STARTED.** Turn budget. The other end of
  the join already exists, which is why the work is small: `InstrumentCalibration.checker_id` is required,
  and `AcceptanceInterval.payload` carries **no checker identity field at all**, so an acceptance may name
  any instrument calibration standing at `run`. `r18-acceptance-on-an-uncalibrated-checker` does not reach
  it — that fixture is about a calibration being absent, not about it belonging to someone else. The
  verdict must be `unresolved` and never pass when the binding is missing.
- **Item 5 — F6D-05 / F6Y-04, a predicate reading `producer_unauthorable_fields` through `IdentityBinding`
  / `FieldAuthority`. NOT STARTED.** Turn budget. The nearer route the residue omits is named by the
  recheck and re-confirmed by this lane in passing: `FieldAuthority` exists, is owned by S1-C01, carries
  `field_path`, `authority_assignment_ref`, `declaring_component_id` and `epoch`, and declares
  `identity.natural_key = (field_path, epoch)` — which **item 1 of this lane has now given a
  resolve-or-create create path**, so *who may write this field* has exactly one answer per epoch and the
  join item 5 needs is one a guard can rely on. Twelve predicates mention `FieldAuthority` and none binds
  it to any of the five control fields.
- **F6C-10 — NOT ATTEMPTED, as briefed.** Blocked on the orchestrator decision lane G returned: whether
  edge predicates become a derived artifact.

## Chapter sentences owed by this lane

**One, and it is small.** `05` §12 words `capability_refs` as `Ref<Capability>[]` while the registered
field is `string[]` with `minItems: 1`, because no `Capability` record exists. Either the chapter states
the field as a capability-id array, or a `CapabilityId` vocabulary is registered over the 46 ids and the
chapter keeps its wording. Item 1 owes no chapter sentence: it states in the command contract what the
record registry already stated about identity.

The chapter sentences still owed by this package are lane E and lane F ones and are unchanged — `05` §1
and `05` §7 (F6D-05, F6D-08) and the F6Y-05 owner statement.

## Decisions returned to the orchestrator

1. **Whether `capability_refs` gets a `CapabilityId` vocabulary**, derived from
   `capabilities.json#/capabilities` — and therefore whether a findings lane may add a value type at all,
   given it reaches the inventory derivation.
2. **The acceptance-owner role record.** `05` §12 closes a two-member set whose second member has no record
   shape. Registering one decides what that record is; amending the chapter decides the set is one.
3. **Still open from lane G and untouched here:** the register `status` prose that registers findings, the
   F6Y-06 check half (options A/B), and whether edge predicates become a derived artifact.

