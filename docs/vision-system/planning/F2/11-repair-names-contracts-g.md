# F2 · r8-contracts-g — the names contract

**What this file is.** Every name lane `r8-contracts-g` registered, and — the part a recheck should read
first — every briefed item it did **not** land, with the reason and the cure named. A name not in this
file was not registered by this lane.

**Standing caveat, and it governs every row.** Author-recorded, one model family, awaiting independent
recheck. **No runtime of any kind exists.** Every "check" below is specified behaviour checked offline by
`validate_contracts.py` against the committed registries.

**Base:** `caceb7c` · **Branch:** `docs/vision-r8-contracts-g`

---

## THE LIGHT VALIDATOR WAS RED AT THE BASE COMMIT, AND THE BASE COMMIT IS WHY

Read this first; it is not this lane's item and it blocked every item.

`caceb7c` — whose entire content is *"register, state and history record the r8-contracts-f merge"* —
rewrote a `status` **string** in `registers/review-findings.json` so that the sentence narrates two other
findings by id: *"F6A-09 and F6C-06 crossed to answered_elsewhere with file, check and fixture pair R39"*.
`register_findings` is a **raw-text sweep** (`FINDING_ID.findall(REGISTER.read_text())`), so a sentence
**about** two findings registered them, and `register_findings <= covered | unpinnable` failed:

```
a registered finding is neither pinned nor declared unpinnable  ['F6A-09', 'F6C-06']
```

Both were **already** in `pinned-conjuncts.json#/answered_elsewhere`, each with the file and the check that
answers it. So one file said, three keys apart, *"answered by this file and this check"* and *"nothing here
says whether it is answered."* The comparison knew two of the three arms that same file maintains.

**Repaired in `5d305a8` by adding the third arm**, `_accounted = covered | set(unpinnable) |
set(ANSWERED_ELSEWHERE)`. Not a widening: `unpinnable` is the weak arm — a sentence asserting no conjunct
can carry it — and is untouched; `answered_elsewhere` is the arm whose members must name a file and a
check, both verified to exist.

**The first attempt WAS a widening and the package refused it by name.** Two `unpinnable` rows for
`F6A-09` and `F6C-06` made the light validator fail at `THE UNANSWERED SET IS NOT PARTITIONED` —
*"declared but not unanswered: ['F6A-09', 'F6C-06']"*. The partition check caught an excuse being written
for two findings the same file already declared answered. Recorded because the control working is the
evidence that the arm added instead is the right one.

**Owed to the orchestrator, who owns `registers/**` (this lane does not).** A register `status` string
that narrates a finding id is indistinguishable, to every sweep in this package, from a registration of
it. Either the sweep must stop reading `status` prose as data, or record-keeping commits must stop naming
other findings' ids in it. That is a decision about the register, not about the contracts.

---

## Names registered

| name | kind | item / finding |
|---|---|---|
| `_reason_pair_constant` · `_reason_pairs` | validator walkers over the criterion AST | item 1 (F6Y-02) |
| `THE ADMITTED-REASON DISJUNCTION NO LONGER WALKS AS SIX PAIRED BRANCHES` | check | item 1 |
| `AN ADMITTED REASON IS PAIRED WITH THE WRONG UNIT` | check | item 1 |
| `R40` · `r40-two-admitted-reasons-swap-the-units-they-predicate-on` + `r40-the-six-admitted-reason-branches-reordered-benign` | fixture pair (both directory-form, both `tools_patch` + `regenerate_from_derivation`) | item 1 |
| `_accounted` | validator name — the three arms of register coverage | the base-break repair above |
| `A CAPACITY ROW MAY NAME ANY MEASURE IT LIKES` | check | item 6 (F6Y-03) |
| `CapacityMeasure` as the type of `CapacityObservation.payload.measure` | `record-registry.json` `type_fields` + `records.schema.json` `$ref` | item 6 |
| `R41` · `r41-the-capacity-measure-field-is-handed-back-to-free-string` + `r41-capacity-payload-type-fields-reordered-benign` | fixture pair | item 6 |

**Constants moved, each comment stating the value its constant holds.**
`NEGATIVE_FIXTURE_FLOOR` 115 → 116 (R40) → 117 (R41), committed 117 ·
`POSITIVE_FIXTURE_FLOOR` 76 → 77 (R40) → 78 (R41), committed 78.
No ceiling moved; no floor took headroom.

**Light validator after every commit:** `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` → exit 0.
Final: **checks 305,309 · negative declared 117 (floor 117) · positive declared 78 (floor 78)**.

**Fixtures executed, singly, by this lane** — the runner has no single-fixture CLI, so each was run through
`run_negative_fixtures.run_fixture` / `run_positive_fixtures.run_fixture` on its own discovered document,
which is the same `execute_fixture` the suite uses:

| fixture | verdict |
|---|---|
| `r40-two-admitted-reasons-swap-the-units-they-predicate-on` | **rejected as required** |
| `r40-the-six-admitted-reason-branches-reordered-benign` | **accepted as required** |
| `r41-the-capacity-measure-field-is-handed-back-to-free-string` | **rejected as required** |
| `r41-capacity-payload-type-fields-reordered-benign` | **accepted as required** |

No other fixture was executed. The full adverse and benign suites are the orchestrator's run on the merged
head.

---

## Item 1 — F6Y-02 · LANDED, and lane F's "not expressible" is corrected

The swap is refused by name now. The check walks the `any` node's branches, collects the set of
`(reason_kind, reason_unit)` **constant pairs** structurally — `op`, `left.op`, `left.pointer`, never a
substring — and compares it to `EXISTENCE_REASON_PAIRS`. Two checks, not one: the **branch count** is
asserted first, because a walk that finds nothing compares the empty set to the empty set and passes.

**The benign twin the review worded IS expressible, and lane F's note that it is not should not be
carried forward.** That note is true of `patch`, which writes JSON only, and false of `tools_patch`, which
ships a hunk of `tools/phase_content.py` and regenerates — the same mechanism the adverse half needs for
the same reason. Both halves of R40 are directory-form fixtures carrying one replacement hunk each:
the adverse swaps the two `reason_unit` constants in the derivation; the benign writes the six branches in
**reverse order** and must pass. The nearer substitute lane F proposed (reordering the two
`records.schema.json` enums) was **not** needed and is not shipped.

## Item 6 — F6Y-03 · LANDED

`measure` is typed `CapacityMeasure` in both declarations. The named check reads **each** declaration
against the vocabulary rather than against the other one, because the generic registry-versus-schema pair
walk is satisfied by the two-place edit — which is the edit an author actually makes, and which R41's
adverse half performs.

**Benign substitution, stated in the fixture rather than made silently.** The review's benign column asks
for *"the vocabulary reordered"*; the vocabulary has **one** member, so that edit is the identity and
proves nothing. Shipped instead: the payload's nine `type_fields` in reverse order, same nine types — a
type is not a position.

---

## Item 9 — F6Y-06, the check half · DECISION PACKET FOR THE ORCHESTRATOR (no code, as briefed)

**The gap.** 191 fixture declarations carry a `finding` citation and `paired_benign_fixture` /
`paired_adverse_fixture` cross-references. Lane F fixed nine dead citations by hand (`5523cfd`) and
measured zero unresolved afterwards. **Nothing enforces it**, so the tenth will be as silent as the first
nine.

**Why it is not simply added.** `run_negative_fixtures.execute_fixture` symlinks the two fixture
**MANIFESTs** into each scratch tree and **not the fixture bodies**. So: outside the
`CONTRACTS_FIXTURE_RUN` guard the check fails on every fixture in the suite (there are no fixture bodies
to read); inside the guard it runs on the real tree only and **cannot itself be fixtured**, because the
adverse case — a fixture citing a review that does not exist — is not expressible in a tree that carries
no fixtures.

**Option A — carry the fixture bodies into the scratch tree as COPIES.**
*Change:* `execute_fixture` gains a `shutil.copytree` of `fixtures/negative` and `fixtures/positive` in
place of the two MANIFEST symlinks, guarded so a fixture's own patch cannot write back through a symlink
into the real tree. The precedent exists in the same function: `tools/` is **already** copied rather than
symlinked whenever a fixture declares `tools_patch`, for exactly this reason.
*Cost:* every fixture run copies ~190 documents instead of linking two files; the suite runs 117 + 78
validator subprocesses, so this is a real wall-clock cost on a suite already measured in minutes. It also
changes the tree construction **every** fixture is judged in, so a regression here is a regression in all
195 controls at once — which is why the lane brief for `r8-contracts-g` forbade this lane from making it.
*What it buys:* the citation check becomes fixturable in the ordinary way — an adverse fixture that
rewrites one `finding` to name a review that is not there, and a benign twin that rewrites a `finding`
string to a different **real** review. That is a control with a control behind it.

**Option B — ship the check inside the `CONTRACTS_FIXTURE_RUN` guard, unfixtured, and say so.**
*Change:* ~20 lines in `validate_contracts.py` reading both fixture trees on the real tree only, plus a
`HAND_WRITTEN_CONTROLS` row so the count is in the verdict.
*Cost:* nothing structural. The check has **no negative control**, so nobody knows whether it would fire;
this package's own standing objection to that is recorded in four places and lane F declined to ship it on
exactly that ground.
*What it buys:* the tenth dead citation fails a build instead of being found by the next reviewer. It
does not buy evidence that the check works.

**What each makes checkable, stated as the difference:** A buys *"a dead citation is refused, and here is
the fixture proving the refusal fires"*; B buys *"a dead citation is refused"*, unproven. The third
option — do neither — buys the status quo, in which the citation corpus is correct today because one lane
checked it by hand once.

**This is the orchestrator's call, not a builder's**, because Option A is a change to the tree
construction that judges every fixture in the package and its failure mode is silent breadth.
**This lane's reading, offered and not acted on:** A, and not in a lane that is also landing findings —
it wants its own PR with the 195 fixtures re-run before and after, and the two counts compared.

---

## NOT LANDED — items 2, 3, 4, 5, 7, 8, with the reason and the cure named

The lane worked items **1, 6 and 9** and stopped on turn budget, not on a blocker, except where stated.
**Items were not taken in the briefed order, deliberately, and that is a deviation worth naming:** item 2
is the largest by a wide margin and taking it first risked spending the whole budget on one item and
landing nothing. Items are independent — nothing in 3–8 depends on 2 — so the order is a convenience and
not a dependency chain.

- **Item 2 — F6C-10's park phase. NOT STARTED, and it is the one with a structural blocker.** The brief
  says the edge predicates must be **tool-authored**. Measured here: `tools/author_phase_content.py`
  authors **criteria only** — no edge writer exists anywhere in `tools/` (`skeletons.py` reads edges, it
  does not write them), so "author them with the existing tool" is not available and the work is
  *building that authoring surface*, not using it. `FailureRecord` has 11 `edge.FailureRecord.*.v1`
  predicates and they are highly formulaic (`subject_unchanged` · `status_edge` · `transition_basis` ·
  `current_owner` · `call criterion.*`), so a generator is tractable; deciding that edge predicates
  become a derived artifact is an **architectural decision** this lane was not briefed to take alone.
  The `parked` spec lane E wrote is still commented in `tools/phase_content.py` beside the `FailureRecord`
  overrides, and the tripwire `FAILURERECORD NOW HAS A PARK PHASE` still fires the moment the phase
  arrives.
- **Item 3 — F6C-11's instant-offset primitive. NOT STARTED.** Turn budget. The shape is settled in
  `07`: register `UTC` + `Duration` → `UTC` in `primitive-registry.json` with its type contract, add the
  DSL code to `tools/phase_content.py`, regenerate `criterion.UnmatchedPoolEntry.landed.v1`, re-pin, and
  then `retention_span` should be **deleted** rather than kept beside the literal form.
- **Item 4 — F6B-03's `checker_identity_ref`. NOT STARTED.** Turn budget.
- **Item 5 — F6D-05 / F6Y-04's guard-body rebinding. NOT STARTED.** Turn budget. Note the review named
  the nearer route the residue omits: `FieldAuthority` exists, owned by S1-C01, carries `field_path`,
  `authority_assignment_ref`, `declaring_component_id` and `epoch`, 12 predicates mention it, and none
  binds it to any of the five control fields.
- **Item 7 — F6V-02's resolve-or-create. NOT STARTED.** Turn budget.
- **Item 8 — F6W-01's `capability_refs`. NOT STARTED.** Turn budget.

## Chapter sentences owed by this lane

**None.** Neither item 1 nor item 6 changes what a chapter must say: item 1 makes a check read the
criterion the way `05` §4 already states it, and item 6 types a field against a vocabulary whose members
are already required to be named by a chapter. The chapter sentences still owed by this package are lane
E's and lane F's and are unchanged — `05` §1 and `05` §7 (F6D-05, F6D-08) and F6Y-05's owner statement.

## Decisions returned to the orchestrator

1. **The register `status` prose that registers findings** — the base-break section above. Register-side,
   not contracts-side.
2. **F6Y-06's check half** — the two-option packet above.
3. **Whether edge predicates become a derived artifact** — item 2's blocker. Until that is answered,
   F6C-10's third clause cannot land without hand-authoring an edge predicate, which is the move this
   package's oracles exist to catch.
