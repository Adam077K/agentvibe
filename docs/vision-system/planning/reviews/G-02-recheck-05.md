> Archival provenance — 2026-09-14: Fifth independent narrow recheck of the pin-machinery lineage (RC-02 → RC2-02 → RC3-01/02 → RC4-01/02), preserved verbatim from the reviewer engine's report file, run on a frozen `git archive` of subject `bcfd658`; eighteen mutations, each run through the subject's own `execute_fixture` with a fixture the reviewer wrote. The reviewer authored nothing and was barred from session files, worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, the register's `status` fields and the prior rechecks' reports. Same model family as the authors and the four prior reviewers; independence is procedural only. Archival is not acceptance.
>
> **Disposition this recheck supports:** RC4-01, RC4-03, RC4-04, RC4-05, RC4-06 **CLOSED at specification level**; RC4-07 closed for the measured move (a hand-written census literal still passes, at 24 checks' cost, and the file admits the class); **RC4-02 closed against the registry author and open one layer out.** The structural claim — the pin no longer consults anything a registry author controls — **holds under every probe.** New: **RC5-01 (high)** one hunk that registers a demanding primitive, adds it to `admissible_ancestors` and re-pins the digest restores G2-01 at exit 0 (299,409 checks); the allowlist has no ceiling, no pinned membership and no verdict line. **RC5-02 (high)** deleting 32 of 57 pins and 72 of 119 rows exits 0: the coverage sweep reads only `G#-##`/`RC-##` ids, so pins citing `A*-M*` ids are guarded only by the 25/44 floor set when the table was 25/44. **RC5-03 (medium)** `admissible_ancestors_not_admitted` is read by nothing.

# G-02-recheck-05 — fifth narrow recheck of the pin-machinery defect lineage

## Provenance
- Subject: commit `bcfd658`, path `docs/vision-system`, extracted with
  `git archive bcfd658 docs/vision-system | tar -x -C $S/subject`.
- Lineage: RC-02 -> RC2-02 -> RC3-01/02 -> RC4-01/02.
- Reviewer authored none of the subject. **Same model family as the authors and as the four
  prior reviewers; independence here is PROCEDURAL, not adversarial-by-construction.**
- Did not read: `docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`,
  `PLANNING-REPORT.md`, the register `status` fields, prior recheck reports beyond the
  finding text quoted in the brief.
- Every disposition below rests on a mutation this reviewer ran, or is marked NOT CHECKED.

## Method
Mutations were run through `$S/probe.py`, which imports the subject's own
`tools/run_negative_fixtures.py` and calls `execute_fixture()` on a fixture object THIS
reviewer wrote. Same scratch layout, same symlinks, same `author_phase_content.py`
regeneration the committed suite uses, one mutation at a time. The inner validator runs
with `CONTRACTS_FIXTURE_RUN=1`, so each probe costs ~18 s instead of ~29 min; every pin,
digest, allowlist, floor and census check sits above the fixture stage and is reached.
Three probes needed a different rig and say so.

## Probe 1 -- baseline, unmodified subject
`python3 validate_contracts.py`, no environment override.
`exit 0 · 299,379 checks · real 1734.24 s`.
Verdict fields that matter here:

| field | value |
|---|---|
| negative_fixtures rejected / declared / floor | 56 / 56 / 56 |
| positive_fixtures passed / declared / floor | 17 / 17 / 17 |
| conjunct_walk.slots_classified | 10,923 |
| conjunct_walk.predicate_positions / value_positions | 4,638 / 238 |
| conjunct_walk.refused / under_quantifier | 0 / 0 |
| conjunct_walk.operators | 39 names, `forall` ABSENT |
| argument_positions_digest recomputed | `2d908704...` -- matches the pinned value |

`tools/run_negative_fixtures.py --self-test`: exit 0, `refused_symlinked: true`,
`accepted_real: true`, 0.4 s. `tools/guard_distinctness.py`: exit 0;
`primitives_used_by_no_predicate` still lists `forall`.
The repair's headline numbers (299,379 / 56 / 17) reproduce exactly.

## Probe 2 -- replay of RC4-01 and RC4-02

| probe | mutation | exit | s | refused by |
|---|---|---|---|---|
| p2a | register `every_linked_obligation` (`predicate: demanded`), wrap the three pins of `criterion.SalesAgreement.performed.v1`, regenerate | 1 | 18.0 | `PINNED CONJUNCT UNDER AN OPERATOR THE PIN TABLE DOES NOT ADMIT`, naming `ancestor_operator: ['every_linked_obligation']` and `ancestor_chains: [('all','every_linked_obligation','all')]` |
| p2b | ONE string: `/forall/argument_positions/predicate` `quantified` -> `demanded` | 1 | 18.1 | `THE DEMAND TABLE MOVED`, printing both digests and `primitives: 57` |
| p2c | p2b composed with the r15 vacuous-`forall` body | 1 | 20.0 | the ALLOWLIST fires first -- `...DOES NOT ADMIT`, `ancestor_operator: ['forall']` -- not the digest |

p2c confirms the ordering the file argues for: on a mutation that moves the table AND uses
it, the reader is told which conjunct is now satisfied through which operator, not merely
that a table moved.

## Probe 3 -- the allowlist is now the attack surface

### 3(a) + 3(d) together: ONE hunk, exit 0
`p3a-allowlist-self-admit` does three things in one patch and nothing else:
1. `primitive-registry.json`: add `every_linked_obligation`, `argument_types.predicate:
   "boolean"`, `argument_positions.predicate: "demanded"`.
2. `pinned-conjuncts.json#/admissible_ancestors/every_linked_obligation`:
   `{registry_role: "demanded", admits: "always", why: "<one plausible sentence>"}`.
3. `pinned-conjuncts.json#/argument_positions_digest`: re-pinned to
   `358f8d36c3b8d3964e252dbf0729819c6c4e6c61f9a884209c38b0679bebd55a`.

Then the same regeneration p2a uses, moving the three pinned conjuncts of
`criterion.SalesAgreement.performed.v1` inside the new quantifier over
`/payload/obligation_refs` -- a field `records.schema.json` gives no `minItems`.

**Result: exit 0, 299,409 checks, 19.4 s.** THIRTY MORE checks than the baseline's
299,379. Every pin satisfied, `under_quantifier: 0`, `refused: 0`. G2-01's counterexample
-- a sale reaching `performed` naming no Fulfillment, nothing `delivered`, no Obligation
discharged -- restored at a passing verdict.

Nothing refuses it, and the design says so: the entry is hand-written, the digest is
hand-written, the argument is that both are lines in a diff a reviewer sees.

**The bargain, stated plainly.** RC4-02 cost ONE edit to a file the derivation tools write
and regenerate wholesale. It now costs THREE edits, two of them in the hand-written pin
file. That is a real escalation and the structural claim is sound as far as it goes: the
pin no longer consults anything only a REGISTRY author controls. It is not a closure. The
separation is by FILE, not by principal, and one agent with write access to
`docs/vision-system` performs all three edits in one commit.

What the design already does everywhere else and does NOT do here is the actionable part.
Every other hand-written budget in this file carries a literal a reviewer can diff against:
`disjoined` rows `<= 4` ("Raising this is a decision and should read like one"), pins
`>= 25`, rows `>= 44`, transitions `>= 6`, fixtures `>= 56`/`>= 17` with the floor stated
twice and compared. `admissible_ancestors` -- now the single most load-bearing hand-written
set in the package -- has **no ceiling, no pinned membership, and no line in the verdict**.
`grep -c 'len(ADMISSIBLE)' validate_contracts.py` -> 0. The baseline verdict carries
`conjunct_walk` because RC4-07 required the verdict to carry its own instrument; it does not
carry the allowlist.

### 3(b) disjunction -- REFUSED, ceiling holds
`p3b-disjoined-ceiling`: apply r14's tautology disjunction AND opt the three affected rows
in with `disjoined: true` + `disjoined_why`. Exit 1, 20.2 s:
`more pinned rows are excused from DEMANDING their conjunct than when this ceiling was set`,
`{'disjoined': 7, 'ceiling': 4}`, listing all seven `(predicate_id, op)` pairs. The ceiling
is exactly tight -- 4 rows today, ceiling 4.

### 3(c) polarity -- correct in both directions
- `p3c-double-negation`: each pinned conjunct wrapped in `not(not(...))`. **Exit 0**,
  299,406 checks, `under_negation` 147 -> 153. This is the RIGHT answer: parity restores
  `entry.negated` to False, and `not(not(X))` demands X under Kleene negation. Not a leak.
- `p3c2-row-claims-negated`: set `negated: true` on the `native_correlated` row over an
  un-negated body. Exit 1, 17.8 s, `PINNED CONJUNCT MISSING`. The containment filter
  compares polarity before the ancestor rule runs, which is what the `row_polarity`
  entry's own `why` says it is a backstop over.

### 3(e) the sibling key that restricts nothing
`p3e`: add `forall` to `admissible_ancestors` (`registry_role: "quantified"`,
`admits: "always"`) while `#/admissible_ancestors_not_admitted/forall` still reads
*"`quantified` is unconditionally non-demanding here ... Deliberately NOT given a
conditional entry"*. **Exit 0, 299,363 checks, 18.7 s.** Nothing compares the two sibling
keys. `grep -c not_admitted validate_contracts.py` -> **0**: the block is read by nothing.
It is the key that names this exact attack -- *"including one registered tomorrow that
declares its own `boolean` child `demanded`"* -- and it is inert prose sitting inside a JSON
file whose entire premise is that prose rots and data does not. The file applies
"declare what is read and REFUSE the rest" to `admits` strings and to pin row keys, by name,
and does not apply it one key over.
(The live defence against the vacuous `forall` is the `quantifiers` filter, which runs
before the ancestor rule and is unaffected -- so p3e passes without restoring a defect. The
finding is the unchecked contradiction, not a restored counterexample.)

## Probe 4 -- "a registry may classify; only the pin may say what satisfies one"

Tested as a pair, because the single deletion does not separate the two authorities.

- `p4-forall-positions-deleted` (registry says NOTHING about `forall`'s slots): exit 1,
  17.8 s, refused at line 695 -- `a primitive declares no argument_positions ... this
  walker refuses to guess (RC3-01)`. Driven by the REGISTRY SHAPE check, which is correct:
  an unclassified slot is refused before any pin question is asked.
- `p3d-repin-only` (registry MISDECLARES `forall` as `demanded`, digest re-pinned in the
  same hunk, no body moved): exit 1, 17.8 s --
  `A PRIMITIVE DECLARES ITS OWN CHILD DEMANDING AND THE PIN TABLE DOES NOT ADMIT IT`,
  `{'admissible_ancestors': ['all','any','not']}`. Driven by the ALLOWLIST, at the
  DECLARATION, before any body uses it. The digest was satisfied and did not save it.
- `p2c` (misdeclared AND used): allowlist again, naming the conjunct.

The closure is real and it is enforced by a cross-check I verified in the source and by
mutation: `argument_types[arg] in ("boolean","boolean[]")` iff `role in {demanded,
disjoined, negated, quantified}` (line 715). A `boolean` child cannot be declared `value`
to dodge the rule, and the only demand role that escapes the allowlist requirement is
`quantified`, which is unconditionally non-demanding. Measured over the committed registry:
57 primitives, 111 argument positions, roles `{value: 107, demanded: 1, disjoined: 1,
negated: 1, quantified: 1}` -- exactly `all`, `any`, `not`, `forall`.

**Answer:** for anything the registry calls demanding, the refusal is allowlist-driven, and
the registry cannot widen it. For `quantified` and `value` the registry still classifies,
which is the half the design says must stay derived. The structural rule holds as stated.

**One bounded blind spot, measured, not speculative.** `ancestors` deliberately does not
grow through a `value` slot, and `positioned` does not filter value ops, so a pinned
VALUE-op row can be satisfied through ancestry the allowlist never sees. Live exposure is
one row: `edge.GrievanceCase.received.triaged.v1 / path`, which is already `disjoined: true`
and conditional. No pin has value-op rows only (0 of 57). Recorded, not raised.

## Probe 5 -- floors, headlines, exception capture, census

| claim | probe | exit | s | message |
|---|---|---|---|---|
| RC4-03 negative manifest below floor | committed `r17-manifest-shrunk-below-floor`, run in probe 6's rig | 1 | -- | `THE FIXTURE SUITE HAS SHRUNK BELOW ITS FLOOR` |
| RC4-03 positive manifest below floor | `p5a` (benign suite cut to 3) | 1 | 17.8 | same headline, `{'declared': 3, 'floor': 17}` -- the rule covers BOTH suites |
| RC4-03 manifest AND its own floor lowered together | `p5a2` | 1 | 18.0 | `a fixture manifest's declared floor differs from the literal in validate_contracts.py`, `{'manifest_floor': 3, 'validator_floor': 56}` -- the two-place literal does its job |
| RC4-05 wrong-reason leak | stub runner, `kind=wrong_reason` | 1 | 17 | `A NEGATIVE FIXTURE WAS REJECTED BY A DIFFERENT CHECK ... so THAT CHECK IS UNPROVEN` |
| RC4-05 passed leak | stub, `kind=passed` | 1 | 18 | `A NEGATIVE FIXTURE WAS NOT REJECTED ... the check ... is GONE` |
| RC4-05 never_ran leak | stub, `kind=never_ran` | 1 | 17 | `A NEGATIVE FIXTURE COULD NOT BE RUN ... Other fixtures in the same run may have reported [ok]` |
| RC4-05 unknown kind | stub, `kind=banana_kind` | 1 | 17 | `the runner reported a leak kind this file has no sentence for` -- refused, not folded into another headline |
| RC4-06 exception mid-suite | 3-fixture tree, fixture 2 given a missing `tools_patch` anchor | 1 | 36 | see below |

RC4-05 rig: `tools/run_negative_fixtures.py` replaced by a stub that runs no fixture and
prints a crafted report; the validator's real branch executes. Four kinds, four distinct
sentences, and the unknown kind refused. The repair claimed "three leak headlines";
`LEAK_HEADLINES` holds **four** (`id_mismatch` is the fourth). Understated, not wrong.

RC4-06 rig: a copy of the tree with `fixtures/negative` reduced to three fixtures and the
manifest floor lowered to match, runner invoked directly. Output:
```
  [FAIL] probe 5 (RC4-06) p5b-raises-mid-suite: the fixture could not be RUN, so it judged
         nothing: ValueError: tools_patch anchor not found: '___RECHECK05_ANCHOR...___' in
         tools/phase_content.py (raised at run_negative_fixtures.py:185 in apply_tools_patch)
  [ok] R1 r1-edge-does-not-call-its-criterion: rejected as required
  [ok] R3 r3-lifecycle-status-as-judgment-subject: rejected as required
--- negative fixture report (JSON follows) ---
{"fixtures": 3, "declared": 3, "passed_as_required": 2, "leaked": [{... "kind": "never_ran" ...}]}
```
The raise is that fixture's own failure, carries file:line:function, the suite completes,
and the report marker is printed. The blind-tail arm is not reached.

### RC4-07 -- the census, four variants of the recheck-04 probe-5b move
The `CONJUNCT_WALK` block and its three floors were replaced in a copy of
`validate_contracts.py`:

| variant | exit | checks | outcome |
|---|---|---|---|
| `{"DELETED": ...}` -- recheck-04's exact move | 1 | -- | `THE VERDICT DOES NOT CARRY THE DEMAND WALK'S CENSUS` |
| right keys, `slots_classified: 0` | 1 | -- | `THE DEMAND WALK CLASSIFIED NO ARGUMENT SLOT AT ALL` |
| right keys, `operators: []` | 1 | -- | `THE DEMAND WALK MET NO OPERATOR` |
| right keys, plausible numbers, 20 plausible operator names | **0** | **299,355** | **PASSES** |

The measured move is closed. The class is not, and the file says so itself: *"This does not
make the file self-verifying and does not pretend to."* The cost of a hand-written literal
went from 3 checks (recheck-04) to 24. Nothing in the tree reads or hashes
`validate_contracts.py` -- confirmed, `grep` for a read or digest of it across `tools/`
returns nothing -- while that file asserts four constants inside
`run_negative_fixtures.py` for exactly the symmetric reason.

## Probe 6 -- regressions and floors

Every regression replayed through this reviewer's own rig, not read off the suite's tally.

| fixture | exit | s | headline |
|---|---|---|---|
| r13 derivation weakened then regenerated | 1 | 17.8 | `PINNED CONJUNCT MISSING` |
| r14 disjoined with a tautology | 1 | 18.0 | `PINNED CONJUNCT ONLY UNDER A DISJUNCTION` |
| r15 buried in a value slot | 1 | 18.0 | `PINNED CONJUNCT IN A NON-PREDICATE POSITION` |
| r15 inside a vacuous forall | 1 | 18.2 | `PINNED CONJUNCT ONLY UNDER A QUANTIFIER` |
| r15 unregistered operator (= p4) | 1 | 17.8 | `a primitive declares no argument_positions` |
| r17 registry flips forall (= p2b) | 1 | 18.1 | `THE DEMAND TABLE MOVED` |
| r17 self-declared primitive (= p2a) | 1 | 18.0 | `...DOES NOT ADMIT` |

Four distinct sentences for the four distinct positions. No wrong-reason leak in any of them.

### RC4-04 -- the advised remedy was tested, both halves
- `p7-accepted-remedy`: the demanded copies restored BESIDE the `forall` copy, exactly what
  the refusal's `accepted` field advertises. **Exit 0, 299,439 checks, `under_quantifier: 8`**
  -- the quantified copy stayed and the walker counted it. The advertised remedy works.
- `p7-not-accepted-sibling`: bound the collection with `nonempty(/payload/obligation_refs)`
  outside the quantifier, the remedy the message says it does NOT accept.
  **Exit 1, refused with the same `ONLY UNDER A QUANTIFIER` message**, whose `not_accepted`
  field states that outcome in advance.
RC4-04's defect -- a message advising a fix that is itself refused -- is gone in both
directions: the advertised remedy passes, the disclaimed one is refused as disclaimed.

### The pin floors, which are the one thing that did NOT move
`p6a-pins-cut-to-floor`: delete 32 of the 57 pins, keeping 25 -- exactly the literal floor.
**Exit 0, 297,520 checks, 17.8 s.** 1,859 checks below the baseline, 0.6%.
`p6b` (24 pins) and `p6c` (5 transitions) both refuse with `the pinned table has shrunk`.
`p6d`, the positive control: delete the one pin carrying `G2-01` and the COVERAGE check
fires -- `a registered finding is neither pinned nor declared unpinnable: ['G2-01']`.

So both controls work, and between them is a gap neither covers:

| | value |
|---|---|
| pins in the committed table | 57 |
| pin floor (literal) | 25 |
| require-rows | 119 |
| row floor (literal) | 44 |
| findings the coverage check reads from `registers/review-findings.json` | 10 |
| deleted pins carrying NO finding the coverage regex matches | 32 |
| require-rows deletable at exit 0 | 72 |

The coverage check derives its finding set from
`re.compile(r"\b(?:G\d-\d{2}[a-z]?|RC-\d{2})\b")` over `review-findings.json`. Every one of
the 32 deletable pins carries only `A*-M*-NN` / `A*-X-NN` ids -- `AC-M4-05`, `AT-M2-03`,
`AS-M5-01`, `AX-M1-02` and so on, the whole selection-record body of work -- which that
regex does not match and the coverage check therefore has no opinion about. Those 32 pins
and 72 rows are held by the floor alone, and the floor is 25/44.

The floors' own comment still reads *"an author could satisfy [the coverage check] by
moving all **25** pins into `unpinnable` one reason at a time"*, and the walker's comment
still reads *"the walk covers the **25** pinned bodies"*. Both were true when written. The
table is 57 and 119 now. `NEGATIVE_FIXTURE_FLOOR`'s comment states the rule this violates
-- *"RAISE THESE WHENEVER FIXTURES ARE ADDED. Never lower one without writing the reason
... a floor that drifts down with the suite is the denominator again"* -- and it was applied
to the fixture manifests and not to the pin table in the same file.

## Dispositions -- RC4-01 .. RC4-07

| id | disposition | evidence |
|---|---|---|
| RC4-01 demand table unasserted | **CLOSED at specification level** | p2b exit 1 `THE DEMAND TABLE MOVED`; digest recomputed from the committed registry matches the pinned `2d908704...`; p3d shows a re-pin alone does not buy the edit |
| RC4-02 self-declared demanding primitive | **CLOSED at specification level for the registry author** / **OPEN one layer out** | p2a and p2c refused naming the ancestor; p3d refused at the declaration; p3a passes at exit 0 once the allowlist itself is edited |
| RC4-03 fixture denominator with no floor | **CLOSED** | p5a, p5a2, and the committed negative-manifest fixture; floors 56/17 printed in the verdict beside the counts |
| RC4-04 refusal advised a refused fix | **CLOSED** | p7-accepted-remedy exit 0; p7-not-accepted-sibling exit 1 with the disclaimed outcome |
| RC4-05 wrong-reason leak under the wrong headline | **CLOSED** | four kinds, four sentences, unknown kind refused |
| RC4-06 exception kills the suite | **CLOSED** | per-fixture `never_ran` with file:line:function; the other two fixtures still reported `[ok]` |
| RC4-07 census deletable for 3 checks | **CLOSED for the measured move** / **class OPEN and acknowledged in the file** | three of four deletion variants refused; a plausible literal still passes, now at 24 checks rather than 3 |

## New findings

### RC5-01 (high) -- the allowlist has no budget and is absent from the verdict
**Class:** a hand-written control with no ratchet, in a file where every other hand-written
budget has one.
`pinned-conjuncts.json#/admissible_ancestors` holds 3 entries. Nothing checks the count,
nothing pins the membership, and the verdict does not report it. p3a adds a fourth entry
plus a re-pinned digest and restores G2-01's counterexample at **exit 0, 299,409 checks**;
p3e adds a fourth entry contradicting the file's own sibling key at **exit 0, 299,363
checks**. The design's answer is "a reviewer sees the diff" -- which is the answer this
lineage rejected for `disjoined` (ceiling 4), for the pins (floor 25), for the fixture
manifests (floor stated twice and compared) and for the census (required in the verdict).
**Required contract:** a literal ceiling on `len(ADMISSIBLE)` with the same "raising this is
a decision and should read like one" comment the `disjoined` ceiling carries; and
`admissible_ancestors` (sorted names plus count) as a field of `VERDICT`, by RC4-07's own
rule that the verdict must carry its own instrument.

### RC5-02 (high) -- 32 of 57 pins and 72 of 119 rows are deletable at exit 0
**Class:** a floor that stopped tracking the table it budgets; a coverage check whose
finding regex does not reach the family that grew.
p6a: exit 0 at 297,520 checks with more than half the pin table gone. The coverage check
reads only `G#-##` / `RC-##` ids (10 findings); the 32 deletable pins carry only
`A*-M*-NN` / `A*-X-NN` ids. p6b and p6d prove both controls work -- the gap is between them.
**Required contract:** raise the literals to the committed counts (57 / 119 / 6) with the
reason written in the comment, as `NEGATIVE_FIXTURE_FLOOR`'s own comment instructs; and
either widen `FINDING_ID` to the `A*` families or state in `pinned-conjuncts.json` that the
coverage check does not reach them and the floor is their only guard.

### RC5-03 (medium) -- `admissible_ancestors_not_admitted` is read by nothing
**Class:** exactly the one this file names one key over -- *"a condition this file does not
evaluate would be a condition that reads as a restriction and restricts nothing, which is
the RC4 class one layer up."*
`grep -c not_admitted validate_contracts.py` -> **0**. The block names the attack in
p3a/p3e verbatim and restricts nothing; p3e adds `forall` to the admitting key while the
not-admitting key still forbids it, at exit 0, with nothing comparing them.
**Required contract:** assert `set(admissible_ancestors) & set(admissible_ancestors_not_admitted) == set()`,
and that every key of `not_admitted` other than the literal `"anything else"` names a real
primitive. Two lines, and the block becomes data.

### RC5-04 (low) -- stale counts inside the pin machinery's own comments
The floor comment says "all 25 pins" (57), the walker comment says "the 25 pinned bodies"
(57) and "0 of 44 rows match under a quantifier" (119 rows). The census comment quotes
"4,282 predicate positions, 48 value positions, 9,882 slots classified, 34 distinct
operators" against a measured 4,638 / 238 / 10,923 / 39. Every number is a frozen
measurement in prose beside a checker that recomputes it. Harmless individually; RC5-02 is
what this class costs when the number is also a floor.

## Is the lineage closed at the structural level?

**Closed for the authority it was written about; open one layer out, and the layer is
named rather than hidden.**

The claim under test was "the pin no longer consults anything an author of the REGISTRY
controls." That claim survives every probe I ran. `primitive-registry.json` is written by
`author_phase_content.py` and two repair tools; none of them can read or write
`pinned-conjuncts.json`; the type/role cross-check forbids dodging via `value`; the only
demand role that escapes the allowlist is `quantified`, which demands nothing; and the
digest makes a table edit a failing build until someone re-pins by hand. p3d is the
cleanest demonstration -- a re-pinned digest does not buy the misdeclaration, because the
allowlist refuses at the DECLARATION.

What is open is the layer the repair moved the authority INTO. `pinned-conjuncts.json` is
now the trust anchor for the whole package and it is unbudgeted in the two places that
matter: the allowlist has no ceiling (RC5-01) and more than half the pin table is below no
floor the coverage check reaches (RC5-02). Neither is the same defect as RC4-02 -- both
require editing the hand-written file, which the design intends to be the expensive act --
but both are the same SHAPE the file diagnosed four times: a control that reads as
enforcement while nothing counts it. The file already knows the cure and applies it to four
other tables.

## Not checked
- `check-citations` / the wider repository suite, the review documents, the register
  `status` fields, `state.json`, `history.jsonl` -- out of scope by the brief.
- Whether `admissible_ancestors`' three `why` strings are TRUE of the operators they
  describe; I checked they are non-empty and that `registry_role` agrees with the registry.
- The positive (benign) suite's 17 cases individually. The baseline ran them 17/17 and
  `p5a` exercised their floor; I did not mutate an individual benign case.
- Any runtime behaviour. No handler, no source truth, no crypto custody, no gateway exists;
  the verdict's own `limits` string says so and it is accurate.
- `not(any(...))` polarity-through-disjunction: written correctly in the walker, exercised
  by no body in the corpus (13 `any`, none beneath a `not`), and I did not construct one.

## Standing caveat
This is one reviewer, one model family, one procedural pass. It is not a multi-judge panel
and does not discharge the `irreversible`-tier requirement of 2-of-3 judges across >=2
distinct model families. Four prior rechecks of this same lineage were also single-family.
The one thing that changes across the five is that each found what it found by RUNNING a
mutation; nothing in this report was found by reading, and the two exit-0 results (p3a,
p6a) were both surprises.
