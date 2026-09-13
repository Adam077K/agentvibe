> Archival provenance — 2026-09-13: Independent narrow recheck of the RC3-01..03 repair, preserved verbatim from the reviewer engine's report file, run on a frozen `git archive` copy of subject `a41bf73` (whole `docs/vision-system` tree). The reviewer authored nothing and was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, the register's `status` fields and the prior rechecks' reports. Same model family as the authors and the three prior reviewers; independence is procedural only. Archival is not acceptance.
>
> **Disposition this recheck supports:** RC3-01, RC3-02 **CLOSED at specification level**; RC3-03 **CLOSED**. **The defect class is open one layer further out.** RC4-02 (high): a newly registered primitive that declares its own boolean child `demanded`, wrapping the three pinned conjuncts, validates at exit 0 (288,665 checks, 36/36 fixtures) — the table is closed against the undeclared and open to the misdeclared. RC4-01 (high): one string in `primitive-registry.json` (`forall` → `demanded`) makes the RC3-01 body pass every pin; only one fixture catches it and the message names the fixture, not the table; nothing pins the table. RC4-03 (medium-high): the fixture suite has a denominator and no floor — 34 of 36 removed from tree and manifest together gives a byte-identical verdict with `negative_fixtures_rejected: 2`. RC4-04..07 medium/low.

# G-02-recheck-04 — independent recheck of the RC3 contracts repair

## Provenance

| | |
|---|---|
| Subject | commit `a41bf73` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685` |
| Frozen copy | `git archive a41bf73 docs/vision-system` extracted to `$S/subject` (220 files) |
| Contracts root | `subject/docs/vision-system/planning/specification/contracts` |
| Reviewer | read-only; authored none of the subject; **same model family as the authors and the three prior rechecks — independence here is PROCEDURAL, not vendor independence.** Not a multi-family panel. |
| Python | 3.14.2 |
| Machine | loaded — other agents of the same session were building concurrently, so every wall-clock number below is an upper bound and none of them is evidence about anything. |

### What was NOT read, by rule

`docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`,
the register `status` fields, and the reports of recheck-02 / recheck-03. The RC3-01/02/03
finding text quoted in this report is the text supplied in the brief, plus the text the
subject's own fixtures and source comments carry about themselves.

### Method

Probes that do not need the 36-fixture suite were run through a harness
(`$S/harness/probe.py`) that rebuilds the **same scratch tree** `run_negative_fixtures.run_fixture`
builds — two-level `planning/specification/contracts` layout, every untouched file symlinked,
`tools/` copied when a probe patches it — and then runs `validate_contracts.py` with
`CONTRACTS_FIXTURE_RUN=1`. The harness imports the subject's own `apply_patch`,
`apply_tools_patch`, `regenerate` and `rederive_*`, so a probe spec is literally a fixture
document. Probes needing the fixture suite were run as full unsandboxed validator runs.

`run_negative_fixtures.py` and `validate_contracts.py` were never run concurrently.

---

# Headline

**The three RC3 repairs hold against the mutations they were written for, and the defect class
they belong to is open — one layer further out, where the repair put it.**

RC3-01's required contract was *"derive the demanding positions from `primitive-registry.json`
and refuse the undeclared."* That is what was built, and it works: probe 2a rejects the `forall`
body, probe 2b rejects the value-slot body, probe 3c rejects a primitive with no
`argument_positions`, probe 3e rejects a role that contradicts its type. The walker no longer
carries a hard-coded triple.

**It now reads its demand semantics out of four strings in a file that nothing checks.** The
whole demand vocabulary of this package is `{value: 107, demanded: 1, disjoined: 1, negated: 1,
quantified: 1}` across 57 primitives — four strings — and `primitive-registry.json` is written by
the derivation tools and asserted by nothing: the criterion-content drift oracle never compares
it, `pinned-conjuncts.json` says nothing about it, the guard ratchet only budgets sibling
collisions, and there is no hash.

Two measured consequences:

1. **Flip `forall.predicate` from `"quantified"` to `"demanded"` — one JSON string — and the
   vacuous-`forall` body validates**: 288,646 checks, every pin satisfied, RC-03 silent, and the
   census still reports `under_quantifier: 0` because the census reads the same table. The full
   run does catch it, by exactly one negative fixture that names `forall` by hand, and the
   message it gives names the fixture rather than the table: *"a negative fixture was not
   rejected; the check it names is gone"* — and the check is not gone.
2. **Register a NEW primitive that declares its own predicate child `demanded` — the ordinary
   thing an author adding "every linked Obligation satisfies X" would write — and NOTHING catches
   it.** Full run, all 36 fixtures in place: **exit 0, 288,665 checks (45 more than baseline),
   36 of 36 negative fixtures rejecting**, over a registry in which the three conjuncts AD-013
   exists to demand sit inside a quantifier over a collection the record schema permits to be
   `[]`. G2-01's counterexample, restored, with every control in the package green.

The walker's own sentence — *"a hard-coded triple is how the FOURTH boolean-child primitive got
through. The fifth cannot."* — is the claim this recheck falsifies. The table is closed against
the **undeclared** and open to the **misdeclared**, and that distinction is not stated anywhere.

Separately, and by the same argument the pin floors were written from: **the negative-fixture
suite has a declared denominator and no floor.** Moving 34 of 36 fixtures out of the tree AND out
of `MANIFEST.json` in one edit leaves the verdict byte-identical — `checks: 288620`, every
`conjunct_walk` field unchanged — with `negative_fixtures_rejected` reading 2. That matters here
because the one control that catches finding 1 above is a fixture.

**RC3-03 is closed outright.** With all 36 fixtures present and the first-sorting fixture's
expectation made impossible, the structured leak record carries both the id and the real reason.

---

## Probe 1 — baseline on the unmodified subject

`cd <contracts>; python3 validate_contracts.py` → **exit 0**, 679 s wall (11:19.66).

Verdict fields, verbatim:

| field | value |
|---|---|
| `status` | `passed` |
| `checks` | 288,620 |
| `negative_fixtures_rejected` | 36 (manifest declares 36) |
| `conjunct_walk.predicate_positions` | 4,282 |
| `conjunct_walk.value_positions` | 48 |
| `conjunct_walk.slots_classified` | 9,882 |
| `conjunct_walk.refused` | 0 |
| `conjunct_walk.under_quantifier` | 0 |
| `conjunct_walk.under_disjunction` | 108 |
| `conjunct_walk.under_negation` | 137 |
| `conjunct_walk.operators` | 34 distinct — **`forall` absent**, as claimed |

`guard_distinctness.py` and `run_negative_fixtures.py --self-test` are run by the validator
as subprocesses (lines 601-609 and 1272-1278) and are covered by that exit 0; the self-test
prints `refused_symlinked: true, accepted_real: true, failures: []`.

**Every repair claim in the brief reproduces at baseline.** `argument_positions` is present
on all 57 primitives (the loop at `validate_contracts.py:693` would refuse otherwise, and
probe 3c proves it does); the three `r15-*` fixtures exist and are declared; the census is
printed; 36/36; 288,620.

## Probe 2 — replaying RC3-01 and RC3-02

Run through the harness, i.e. the mutation each fixture ships, applied to a scratch tree and
judged by the validator.

| probe | exit | s | message |
|---|---|---|---|
| 2a — RC3-01, the `forall` hunk | **1** | 20.4 | `PINNED CONJUNCT ONLY UNDER A QUANTIFIER … 'criterion.SalesAgreement.performed.v1', 'nonempty_fields'` with `quantifiers: ['forall(/payload/obligation_refs)']` |
| 2b — RC3-02, the value-slot hunk | **1** | 21.2 | `PINNED CONJUNCT IN A NON-PREDICATE POSITION …` with `sits_in: ['present.value']` |

Both name the context rather than reporting the conjunct missing, which is what the fixtures
ask for. Seconds to failure: ~20 s, because the pin block sits early and the fixture suite is
skipped under `CONTRACTS_FIXTURE_RUN=1`.

## Probe 3 — the table is now the attack surface

### 3(a) — flip `forall`'s declared role. **The walker is fooled; the fixture suite is what catches it.**

One JSON string, `/forall/argument_positions/predicate`: `"quantified"` → `"demanded"`,
applied on top of the `r15` forall hunk (the mutation RC3-01 exists to reject).

| run | what it is | exit | s | result |
|---|---|---|---|---|
| **P3a** | everything inside `validate_contracts.py` (`CONTRACTS_FIXTURE_RUN=1`) | **0** | 21.1 | **288,646 checks — 37 MORE than the 288,609 null control.** `forall` now appears in `conjunct_walk.operators`; **`under_quantifier` is still 0**; the three pinned conjuncts of `criterion.SalesAgreement.performed.v1` sit inside `forall(items=path(/payload/obligation_refs))` and are reported DEMANDED. |
| **P8a** | the same tree, FULL run, manifest trimmed to the one fixture that could catch it | 1 | 34.3 | `('a negative fixture was not rejected; the check it names is gone', {'leaked': [{'id': 'r15-pinned-conjunct-inside-a-vacuous-forall', 'reason': 'fixture PASSED validation; the check that should reject it is absent'}], 'fixtures': 1, 'passed_as_required': 0})` |

**So the answer to "does anything refuse the table edit" is: exactly one thing does, and it is
a negative fixture, not a control over the table.** Three consequences, each measured or read:

1. **No control exists at the table layer.** `author_phase_content.py --check` never compares
   `primitive-registry.json`: the file enters `PRODUCED` only inside
   `if "content_unspecified" not in primitives:` (`tools/author_phase_content.py:175-181`), and
   `content_unspecified` IS present, so that branch never runs and `_report_drift` never sees
   the file. `pinned-conjuncts.json` — the one file in this package that exists *because* "a
   checker that compares an artifact to a source the same author controls is not a checker" —
   says nothing about `argument_positions`; its keys are `pins`, `pinned_transitions`,
   `unpinnable`, `requires_waivers`, `finding_sources`, and prose. `guard_distinctness.py`
   reads the registry and reports `primitives_used_by_no_predicate`, but its ratchet fires only
   on the sibling-collision budget. There is no hash of any registry anywhere
   (`grep -n 'sha256\|hashlib\|digest' validate_contracts.py` → nothing).
2. **The type cross-check cannot see it, by construction.** `validate_contracts.py:712-717`
   asserts `(argument_types[arg] in ("boolean","boolean[]")) == (role in DEMAND_ROLES)`, and
   `DEMAND_ROLES` is `{demanded, disjoined, negated, quantified}`. The equivalence holds for all
   four. It separates a predicate position from a value position — which is RC3-02's half, and
   probe 3(e) shows it working — and it cannot separate a demanding role from a non-demanding
   one, which is RC3-01's half.
3. **The census cannot witness it.** `WALK_CENSUS["under_quantifier"]` increments only where
   `role == "quantified"`, read from the same table. Positive control, probe 4(c): an honest
   table with a real `forall` in the body gives `under_quantifier: 8`. So the census is
   sensitive to the BODY and blind to the TABLE, and the one number that would have shown
   RC3-01 as an absence shows nothing when the absence is in the declaration instead.

### 3(b) — a NEW primitive that declares its own predicate child `demanded`

`every_linked_obligation`, registered with `argument_types.predicate = "boolean"` and
`argument_positions.predicate = "demanded"`, wrapping the same three conjuncts.

**P3b: exit 0, 288,654 checks, 20.7 s.** The walker treats the quantified child as demanded
and every pin passes.

The walker's own comment reads: *"a hard-coded triple is how the FOURTH boolean-child primitive
got through. The fifth cannot."* Measured, the fifth **can**, if it declares `demanded`. What
cannot get through is a fifth that declares **nothing** (`r15-unregistered-operator-in-a-
predicate-position`, and probe 3c) or whose role **contradicts its type** (probe 3e). The table
is closed against the UNDECLARED and open to the MISDECLARED.

**No fixture names it.** All 36 `expect_failure_contains` strings were enumerated; the only
table-level fixture is `r15-unregistered-operator-in-a-predicate-position`, whose expectation is
`a primitive declares no argument_positions` — the absent case. Nothing in the suite asserts the
CONTENT of any existing or new primitive's `argument_positions`. (Full-suite confirmation: probe
8d, below.)

### 3(c) / 3(e) — the guards that DO hold

| probe | edit | exit | s | message |
|---|---|---|---|---|
| 3c | remove `argument_positions` from `present` | 1 | 20.1 | ``a primitive declares no `argument_positions`, so nothing can say whether a conjunct written inside it is DEMANDED …`` `('present', ['value'])` |
| 3e | declare `present.value` (a `JsonValue` slot) `demanded` | 1 | 20.7 | `a primitive's argument position contradicts its argument type …` `('present','value','JsonValue','demanded')` |

### 3(d) — is the table pinned to anything hand-written?

**No.** Answered by reading, and the reading is the finding: `primitive-registry.json` is written
by `tools/repair_r2_bootstrap_root.py`, `tools/repair_r3_intrinsic_subjects.py` and
`tools/author_phase_content.py` — the derivation side — and is read as authority by
`validate_contracts.py`. Nothing hand-written constrains it and no oracle regenerates it for
comparison. It is the one input to the demand rule that the author of the derivation also owns.

## Probe 4 — other vacuous and non-vacuous contexts

| probe | body shape | exit | s | outcome |
|---|---|---|---|---|
| 4a | `not(not(X))` over the three pinned conjuncts | **0** | 20.9 | **Correct.** `under_negation` 137 → 139; polarity is tracked by parity, not by a latching flag, so the double negation is DEMANDED. The two-`not` case is genuinely handled, not accidentally. |
| 4b | `any(X, not(present(/payload/agreed_terms)))` — the other branch is a CONTRADICTION over a schema-required field, so `any(X, false) ≡ X` | 1 | 20.9 | `PINNED CONJUNCT ONLY UNDER A DISJUNCTION`. Conservative and in the safe direction: the checker does not attempt branch satisfiability, so a genuinely demanded conjunct inside an `any` is still refused. Not a defect. |
| 4c | `all(X, forall(items, bind, X))` — one demanded copy beside one quantified copy | **0** | 20.7 | **Correct, and it is the census's positive control:** `under_quantifier: 8`, `forall` in `operators`, and the pins pass because `demanded` is non-empty. One demanded copy suffices. |
| 4d | `all(nonempty_fields(/payload/obligation_refs), forall(items=path(/payload/obligation_refs), …X))` — a sibling conjunct demands the collection NON-EMPTY, so the quantifier is not vacuous | 1 | 23.2 | `PINNED CONJUNCT ONLY UNDER A QUANTIFIER`, **with the note `"Demand the collection non-empty on the same path, or state the requirement outside the quantifier."`** — which is exactly what this body does. See RC4-04. |

**Operators taking a predicate child: there are four and only four.** Derived from the registry,
not assumed: of 57 primitives, `all`, `any`, `not` and `forall` are the only ones with a
`boolean`/`boolean[]` argument. `in`, `subset`, `count` and `nonempty_fields` take
`JsonValue[]`/`JsonPointer[]` and are value positions throughout; there is no `implies`, `if`,
`exists`, `some`, `none` or `xor`. So the `argument_positions` histogram over the whole registry
is `{value: 107, demanded: 1, disjoined: 1, negated: 1, quantified: 1}` — **four strings carry
the entire demand semantics of this package**, which is what makes RC4-01 and RC4-02 cheap.

`call` and `assess_predicate` are indirections whose arguments are all `value`; the walker does
not follow a `call` into the called predicate's body, so a pinned conjunct moved behind a `call`
would be reported MISSING — the conservative direction. Not probed further.

## Probe 5 — the census as an instrument

**Does it move when a node goes under a quantifier?** Yes, while the table is honest: probe 4c
puts a real `forall` in one criterion and the census reports `under_quantifier: 8` against a
baseline 0. It does NOT move when the table itself is edited (probe 3a: `under_quantifier` stays
0 while `forall` appears in `operators`). The `operators` set is the field that moved in both
cases and is the informative one.

**`refused` is 0 by construction, not by measurement.** `refuse()` increments the counter and
then calls `checked()`, which raises — so a run that prints a verdict has `refused: 0`
necessarily, and a run with a refusal prints no verdict. The source says this in as many words
(`"refused is 0 on any tree this file passes"`), so it is disclosed rather than hidden, but the
field carries no information about coverage. `slots_classified` (9,882) and `operators` (34) are
the two that do.

**Delete the census: nothing notices.** P5b replaced the whole `CONJUNCT_WALK` block and its
three floors with a literal, in the copy of `validate_contracts.py` the scratch tree runs.
**Exit 0, 288,606 checks** — 3 fewer than the null control's 288,609, which is exactly the three
floors, and the verdict printed `"conjunct_walk": {"DELETED": …}`. Nothing in the package asserts
the validator's own source text. Note the asymmetry: `validate_contracts.py` asserts THREE
strings in `run_negative_fixtures.py` (`FIXTURE_RATCHET`, `LEAK_RECORD_KEYS`, `REPORT_MARKER`,
lines 1298-1321) precisely so that a rename on the other side cannot silently disarm a branch.
No assertion runs in the other direction.

## Probe 6 — RC3-03, the leak detail

All 36 fixtures present; the FIRST-SORTING fixture, `r1-edge-declares-an-argument-nothing-reads`,
had its `expect_failure_contains` replaced with a string nothing emits. Full run, **exit 1,
630 s (10:30.69)**. The detail attached:

```
('a negative fixture was not rejected; the check it names is gone',
 {'leaked': [{'id': 'r1-edge-declares-an-argument-nothing-reads',
              'reason': "failed for the wrong reason; expected 'RECHECK04 IMPOSSIBLE
                         EXPECTATION NO CHECK EMITS THIS' in: … AssertionError:
                         ('FI-11: declared arguments that nothing reads',
                          'Goal:proposed->endorsed', ['continuation_ref'])"}],
  'fixtures': 36, 'passed_as_required': 35})
```

**RC3-03 is closed.** The fixture id and the real reason both survive, from the fixture that
sorts first — the exact position whose line fell outside the old 2,000-character tail. The
`REPORT_MARKER` repair of `a41bf73` is load-bearing here: the reason contains an
`AssertionError` carrying a tuple and a dict, so `stdout.rindex("{")` would have decoded
garbage. It resolved.

**But the headline sentence is false for this leak** — see RC4-05.

## Probe 7 — regressions

Every earlier defect class still fails, and every floor still binds. All run as my own
mutations, not read off the baseline's 36/36.

| probe | mutation | exit | s | message |
|---|---|---|---|---|
| recheck-02 probe 1 — conjuncts REMOVED | `r13-derivation-weakened-then-regenerated`, regenerated from the weakened derivation | 1 | 16.9 | `PINNED CONJUNCT MISSING` |
| recheck-02 probe 9 — `any` | `r14-pinned-conjunct-disjoined-with-a-tautology` | 1 | 16.9 | `PINNED CONJUNCT ONLY UNDER A DISJUNCTION` |
| recheck-03 — `forall` | probe 2a above | 1 | 20.4 | `PINNED CONJUNCT ONLY UNDER A QUANTIFIER` |
| recheck-03 — value slot | probe 2b above | 1 | 21.2 | `PINNED CONJUNCT IN A NON-PREDICATE POSITION` |
| floor 25 pins | remove `/pins/0` | 1 | 22.7 | `the pinned table has shrunk …` `{'pins': 24, 'floor': 25}` |
| floor 44 rows | remove `/pins/0/require/0` | 1 | 24.4 | `the pinned table kept its pins and lost its requirements`, `43` |
| floor 6 transitions | remove `/pinned_transitions/0` | 1 | 22.3 | `… {'pinned_transitions': 5, 'transition_floor': 6}` |
| ceiling 4 disjoined | add `disjoined: true` + `disjoined_why` to a fifth row | 1 | 22.5 | `more pinned rows are excused from DEMANDING their conjunct …` `{'disjoined': 5, 'ceiling': 4}` and it names all five rows |

## Probe 8 — what the fixture suite is, and is not, floored by

### 8(b) — the fixture suite has a declared denominator and NO floor

Untouched registries. 34 of the 36 fixtures moved out of `fixtures/negative/` and removed from
`MANIFEST.json` in the same edit, leaving `r1-edge-does-not-call-its-criterion` and
`r2-acceptance-chain-loses-its-root`. Full run: **exit 0, 50.6 s.**

| | baseline | 2-fixture tree |
|---|---|---|
| `status` | `passed` | `passed` |
| `checks` | 288,620 | **288,620** |
| every `conjunct_walk` field | — | identical |
| `negative_fixtures_rejected` | 36 | **2** |

**The verdict is byte-identical except for one integer that nothing compares to anything.** The
count checks at `validate_contracts.py:1372-1378` compare the runner's tally to `MANIFEST.json`
and `MANIFEST.json` is hand-edited in the same commit, so the pair agrees with itself — which is
RC-04's original defect, walked back in through the denominator instead of through the count.
This is the exact argument the pin floors were written for, applied to the other table and not
made: `pinned-conjuncts.json` gets literal floors of 25/44/6 because *"an author could satisfy
[the coverage check] by moving all 25 pins into `unpinnable` one reason at a time"*.
`fixtures/negative/MANIFEST.json` gets none.

### 8(d)/8(e) — the new primitive, against the whole committed suite. **THIS IS THE HEADLINE.**

Two runs, because the first was inconclusive through my own fault and that is itself a finding.

**8(d)** — the mutation applied with a hunk that rewrote
`RECORD_SPECIFIC_KINDS = ("nfp", "rpp", "neF", "prF", "eqF")`, which three fixtures use as a
`tools_patch` anchor. **Exit 1 at 383 s, but no control judged the mutation**:
`apply_tools_patch` raised `ValueError: tools_patch anchor not found`, the runner died after 17
fixtures had reported `[ok]`, and the validator attached
`{'leaked': None, 'why_no_leak_list': 'the runner reported no per-fixture result; it refused
before running a fixture, or died', 'runner_tail': …}`. Inconclusive for the question, and
recorded as **RC4-06**.

**8(e)** — the same mutation with the anchor preserved (`"fa"` appended on its own line), so all
36 fixtures apply cleanly. Full run, **exit 0, 860 s (14:20.36)**:

```json
{"status": "passed", "checks": 288665, "predicates": 2276,
 "conjunct_walk": {"predicate_positions": 4286, "value_positions": 52,
                   "slots_classified": 9896, "refused": 0, "under_quantifier": 0,
                   "under_disjunction": 108, "under_negation": 137,
                   "operators": [… "every_linked_obligation" …]},
 "negative_fixtures_rejected": 36}
```

and `criterion.SalesAgreement.performed.v1`'s body is:

```json
{"op": "all", "predicates": [
  {"op": "every_linked_obligation",
   "items": {"op": "path", "value": {"op": "resolve", "ref": {"arg": "subject_ref"}},
             "pointer": "/payload/obligation_refs"},
   "bind": "item",
   "predicate": {"op": "all", "predicates": [
      {"op": "nonempty_fields", …, "field_paths": ["/payload/fulfillment_ref",
         "/payload/obligation_refs", "/payload/acceptance_evidence", "/payload/agreed_terms"]},
      {"op": "related_phases", …, "bindings": [
         {"field_path": "/payload/fulfillment_ref", "states": ["delivered"], "optional": false},
         {"field_path": "/payload/obligation_refs",
          "states": ["discharged", "transferred"], "optional": false}]},
      {"op": "native_correlated", …, "result": "delivered"}]}},
  {"op": "accepted_for", …}, {"op": "attested_result", …}]}
```

**Every control in the package is green over a registry that requires none of AD-013.**
288,665 checks (45 MORE than the baseline's 288,620), 36 of 36 negative fixtures rejecting,
the guard-distinctness ratchet green, the criterion-content drift oracle green, all 25 pins and
44 rows satisfied, RC-03 silent, and `records.schema.json` gives `/payload/obligation_refs` no
`minItems` — so a SalesAgreement with `obligation_refs: []` reaches `performed` naming no
Fulfillment, with nothing `delivered` and no Obligation discharged. **That is G2-01's
counterexample, restored by a registered primitive and a regeneration, exactly as RC3-01 did it
with `forall` — and this time nothing in the tree objects.**

The cost of the attack is one primitive entry in `primitive-registry.json` whose
`argument_positions.predicate` reads `"demanded"`, plus the DSL work any author adding a
quantifier would do anyway. The `r15-pinned-conjunct-inside-a-vacuous-forall` fixture does not
fire, because it names `forall`.

---

# Dispositions

| finding | disposition | basis |
|---|---|---|
| **RC3-01 (a)** — `forall` as a non-demanding context the pin walker did not track | **CLOSED at specification level** | Probe 2a rejects it naming the quantifier and the collection. The demanding positions ARE derived from `primitive-registry.json`; every primitive declares `argument_positions` (probe 3c proves removal is refused); an operator or slot the table does not declare is refused (`validate_contracts.py:818, 850`, and fixture `r15-unregistered-operator-in-a-predicate-position`); the same walker serves RC-03 (`stated_paths_and_states` calls `polarised_nodes`, line 1151); fixtures and census exist and reproduce. **The class it belongs to is NOT closed — see RC4-01 and RC4-02: the repair moved the hard-coded triple out of the walker and into a data file that nothing checks.** |
| **RC3-02 (a)** — a pinned op in a `JsonValue` slot counted as demanded | **CLOSED at specification level** | Probe 2b rejects it saying `NON-PREDICATE POSITION` and naming `present.value`. `in_value` is sticky and the type cross-check refuses a `JsonValue` slot declared demanding (probe 3e). Same RC4-01 caveat: the slot's role is a string in the same unoracled file. |
| **RC3-03 (c)** — blind `stdout[-2000:]` in the leak wrapper | **CLOSED** | Probe 6: with all 36 fixtures present and the FIRST-SORTING fixture's expectation made impossible, the structured leak record survives with both the id and the real reason. The `REPORT_MARKER` fix of `a41bf73` is load-bearing and was exercised — the reason contains an `AssertionError` carrying a tuple and a dict, which is precisely what broke `rindex("{")`. **Two residual message defects: RC4-05 and RC4-06.** |

# New findings

## RC4-01 — HIGH — `primitive-registry.json` is unoracled authority: one string re-opens RC3-01, and the census cannot witness it

**Class.** Trusted input with no independent assertion — the same class as RC-02 (*"a checker that
compares an artifact to a source the same author controls is not a checker"*), one layer further
out. RC-02 moved the ASSERTIONS about criterion content into a hand-written file because the
derivation's author controlled the artifact. RC3-01's repair moved the DEFINITION of "demanded"
into `primitive-registry.json`, which the derivation's author also controls, and gave it no
hand-written counterpart.

**Evidence.** `/forall/argument_positions/predicate`: `"quantified"` → `"demanded"`, with the
r15 forall body. Probe 3a: **exit 0, 288,646 checks, 37 more than the null control's 288,609**,
`forall` in `conjunct_walk.operators`, `under_quantifier: 0`, all 44 pin rows satisfied, RC-03
silent. The three conjuncts AD-013 exists to demand sit inside a `forall` over
`/payload/obligation_refs`, which `records.schema.json` gives no `minItems`, so a SalesAgreement
with `obligation_refs: []` reaches `performed` naming no Fulfillment. That is G2-01's
counterexample, restored, and the verdict grew by 37 checks while saying so.

**What refuses it.** One negative fixture, and only because it names `forall` by hand
(probe 8a). Nothing at the table layer: the drift oracle never compares the file (its `PRODUCED`
entry is inside a branch that cannot run while `content_unspecified` is registered),
`pinned-conjuncts.json` says nothing about it, the ratchet only budgets sibling collisions, no
hash exists. The failure the fixture produces names the FIXTURE, not the table:
*"a negative fixture was not rejected; the check it names is gone"* — and the check is not gone.

**Required contract.** The role of every predicate position must be asserted by something whose
author is not the author of `primitive-registry.json`. Concretely: a `pinned_argument_positions`
block in `pinned-conjuncts.json` naming the four roles literally — `all.predicates=demanded`,
`any.predicates=disjoined`, `not.predicate=negated`, `forall.predicate=quantified` — checked
against the live registry the way the conjunct pins are, **plus a rule that any OTHER primitive
declaring a demanding role for a `boolean`/`boolean[]` argument must carry a pin row of its own**.
That second half is what makes it a closed table rather than a fifth hard-coded list, and it is
what turns RC4-02 into a refusal. Ship it with two fixtures: one flipping a role, one adding a
new demanding primitive.

## RC4-02 — HIGH — a new boolean-child primitive may declare its own predicate child `demanded`, and the whole suite stays green over it

**This is the finding of this recheck.** RC4-01 is caught, narrowly, by one fixture that names
`forall`. RC4-02 is caught by nothing.

**Evidence, full run, all 36 fixtures in place (probe 8e): exit 0, 288,665 checks — 45 MORE than
the baseline's 288,620 — and `negative_fixtures_rejected: 36`.** The registry it passed over has
the three pinned conjuncts of `criterion.SalesAgreement.performed.v1` inside
`every_linked_obligation(items = path(resolve(subject), /payload/obligation_refs), bind, …)`,
a primitive registered with `argument_types.predicate: "boolean"` and
`argument_positions.predicate: "demanded"`. `records.schema.json` gives that field no `minItems`,
so `obligation_refs: []` is schema-valid and the quantifier is vacuous. The sale reaches
`performed` naming no Fulfillment, with nothing `delivered` and no Obligation discharged.
G2-01, restored, with every control in the package green.

Fixture-mode confirmation (probe 3b): exit 0, 288,654 checks, 20.7 s. Census: the operator
appears in `conjunct_walk.operators`, `under_quantifier` stays 0.

**Why nothing catches it.** The walker's comment reads *"a hard-coded triple is how the FOURTH
boolean-child primitive got through. The fifth cannot."* Measured, the fifth gets through when it
DECLARES `demanded`. What is refused is a fifth that declares nothing (probe 3c, fixture
`r15-unregistered-operator-in-a-predicate-position`) or whose role contradicts its type (probe
3e). All 36 `expect_failure_contains` strings were enumerated: the only table-level fixture is the
absent-declaration case, and `r15-pinned-conjunct-inside-a-vacuous-forall` does not fire because
it names `forall` by hand.

**Required contract.** As RC4-01, and the second half is the operative one here: a primitive
declaring a demanding role for a `boolean`/`boolean[]` argument must be named in a hand-written
table that the derivation's author does not also write. Absent that, every future quantifier,
`implies`, `exists` or `unless` primitive re-opens this by declaring itself demanding — which is
the ordinary thing to write, not an adversarial one.

## RC4-03 — MEDIUM-HIGH — the negative-fixture suite has a declared denominator and no floor

**Evidence.** Probe 8b: 34 of 36 fixtures moved out of `fixtures/negative/` and removed from
`MANIFEST.json` in the same edit. Full run, **exit 0, 50.6 s, `checks: 288620` — byte-identical
to the baseline's `checks` and to every `conjunct_walk` field.** The only number that moves is
`negative_fixtures_rejected: 36 → 2`, and nothing compares it to anything.

**Why it is not covered by RC-04's fix.** RC-04 gave the suite a DECLARED denominator so that a
fixture deleted from the tree alone fails. It did not give it a FLOOR, so a fixture deleted from
the tree AND the manifest passes — the two agree with each other because one hand writes both.
`pinned-conjuncts.json` has exactly this protection and the file says why: literal floors of
25/44/6 exist because *"an author could satisfy [the coverage check] by moving all 25 pins into
`unpinnable` one reason at a time"*. Replace "pins" with "fixtures" and "unpinnable" with
"MANIFEST.json" and the sentence is unchanged.

**Required contract.** A literal floor beside the manifest, checked in `validate_contracts.py`
the way the pin floors are: `len(declared_fixtures) >= 36`, raised deliberately, lowered only as
a reviewed decision. One fixture is not expressible for this (it is a property of the tree the
runner is invoked in), so it belongs next to the RC2-01 self-test.

## RC4-04 — MEDIUM — the quantifier refusal names a remedy the rule does not accept

**Evidence.** Probe 4d. The body demands `nonempty_fields(subject_ref, ["/payload/obligation_refs"])`
as a sibling conjunct OUTSIDE the quantifier and then quantifies over the same pointer, so the
collection cannot be empty and the conjuncts under the `forall` really are required. The
validator refuses with:

> `PINNED CONJUNCT ONLY UNDER A QUANTIFIER … inside a quantifier over a collection nothing forces
> to be non-empty` … `quantifiers: ['forall(/payload/obligation_refs)']` … `note: "… Demand the
> collection non-empty on the same path, or state the requirement outside the quantifier."`

The body did the first of the two things the note asks for, and on the same pointer the message
itself prints. **The refusal is right** — `quantified` is documented as unconditionally
non-demanding and that is the conservative reading — **but two sentences of the message are
false about the tree in front of them**, and the remedy they offer does not exist. An author who
follows it writes the sibling conjunct, is refused again with the same words, and learns to route
around the checker. This package names that outcome as the reason it REJECTED widening the RC-03
phase rule; it is the same cost here.

**Required contract.** Either implement the sibling-demand case — the walker already knows the
pointer, since `quantifier_note` prints it — or change the note to state the single remedy that
works and say plainly that a non-empty sibling does not lift the rule. The cheap half is the
message; nothing forces the choice today because the population is zero.

## RC4-05 — MEDIUM — the leak headline is false for the commonest kind of leak

**Evidence.** Two measured leaks, two different truths, one sentence:

| probe | leak kind | headline printed | true? |
|---|---|---|---|
| 8a | `fixture PASSED validation; the check that should reject it is absent` | `a negative fixture was not rejected; the check it names is gone` | yes |
| 6 | `failed for the wrong reason; expected … in: … AssertionError: ('FI-11: declared arguments that nothing reads', …)` | same sentence | **no — it WAS rejected, and the check it names is not gone** |

RC2-04 split the COUNT MISMATCH out of this headline for exactly this reason and added a
dedicated `ratchet` branch (`validate_contracts.py:1331-1337`). The leak arm still carries two
kinds under one sentence. The structured detail corrects it — that is RC3-03 working — so this
is a message defect, not a missed defect. It is the third instance of the class this file argues
about in four places: *"a message should name the control that actually did the refusing."*

**Required contract.** Branch the leak arm on the reason the runner already distinguishes:
`fixture PASSED validation` → "the check it names is gone"; `failed for the wrong reason` → "a
negative fixture was rejected by a DIFFERENT check than the one it exists to exercise, so that
check is unproven". The runner knows which; only the caller's sentence does not.

## RC4-06 — MEDIUM — an exception inside `run_fixture` loses the whole suite's structured reporting and re-enters the blind-tail path

**Evidence.** Probe 8d, found by accident and reproduced. A derivation edit rewrote
`RECORD_SPECIFIC_KINDS = ("nfp", "rpp", "neF", "prF", "eqF")`, which three fixtures use as a
`tools_patch` anchor. `apply_tools_patch` raises `ValueError` out of `run_fixture` and out of
`main()`; the runner dies without printing `REPORT_MARKER`; `validate_contracts.py` takes the
no-report arm and attaches

> `{'leaked': None, 'why_no_leak_list': 'the runner reported no per-fixture result; it refused
> before running a fixture, or died', 'runner_tail': …}`

**Seventeen fixtures had already run and reported `[ok]`.** The sentence says the opposite, and
the 2,000-character `runner_tail` is the blind tail RC3-03 exists to replace — so one malformed
or stale fixture puts the suite back on the path RC3-03 removed, for every fixture, not just
itself. The `ValueError` text IS inside the tail here, so nothing was lost this time; that is
luck about length, which is the defect RC3-03 names.

**Required contract.** Catch the exception per fixture in `run_fixture`'s caller and record it as
a leak with `id` and `reason` like any other — an unrunnable fixture is a control that is not
working, which is what the leak list is for. The anchors are a second, smaller point: a
`tools_patch` anchor is a literal string in a file the derivation's author edits, and three
fixtures share this one.

## RC4-07 — LOW — nothing asserts `validate_contracts.py`'s own source, and the census costs 3 checks to remove

**Evidence.** Probe 5b: the `CONJUNCT_WALK` block and its three floors replaced by a literal in
the copy the scratch tree runs. **Exit 0, 288,606 checks** — exactly 3 below the null control —
and the verdict printed `"conjunct_walk": {"DELETED": …}`. Nothing in the package reads the
validator's own text. The asymmetry is the point: `validate_contracts.py` asserts three strings
in `run_negative_fixtures.py` so a rename cannot silently disarm a branch it takes; no assertion
runs the other way. Low, because anyone editing the validator is editing the checker itself and
that is a reviewed diff by construction — recorded because the census is offered as evidence that
the closed table did its work, and it is evidence only while it is there.

**Observation, not a finding.** `conjunct_walk.refused` is 0 on any run that prints a verdict, by
construction: `refuse()` increments the counter and then raises. The source says so. The two
census fields that carry information about coverage are `slots_classified` (9,882) and the
`operators` set (34).

---

# Not checked

- **Anything a runtime would decide.** The validator says so itself in `limits`, and this recheck
  adds nothing to it: no handler, no source truth, no custody, no gateway, no business effect.
- **Whether `forall`'s semantics are what the registry says.** `quantified` is treated as
  unconditionally non-demanding on the stated ground that nothing in the corpus forces any
  quantified collection non-empty. I confirmed the corpus has zero `forall` nodes and did not
  audit `records.schema.json` for collections that ARE bounded below elsewhere.
- **Re-subjecting a pinned conjunct.** `PIN_ROW_KEYS` carries no key for `subject_ref`, so a pin
  row matches on `op`, `field_paths_include`, `bindings`, `contains_pointers` and the five value
  keys, and never on WHOSE record the conjunct is about. The record-type cross-check at
  `validate_contracts.py:305` applies only when the argument is literally `{"arg": …}`, so an
  expression in that slot skips it. I did not find a re-subjecting that is vacuously TRUE rather
  than `unresolved`, and I did not run it. Flagged as an unprobed surface, not as a finding.
- **`call` / `assess_predicate` indirection.** The walker does not follow a `call`, so a pinned
  conjunct moved into a called predicate reads as MISSING — the conservative direction. Not
  probed further.
- **The other 33 fixtures against a mutated demand table.** Probe 8a trimmed the manifest to the
  one fixture that can catch the `forall` flip, which answers the question asked; it does not
  establish what the other 33 would do on that tree.
- **Anything outside `docs/vision-system`.** The subject is a frozen archive of that tree only.
- **Vendor independence.** One model family, one reviewer. Procedural independence only.

---

# Reproduction

```bash
S=<a scratch dir>
mkdir -p "$S/subject" && cd <the worktree> \
  && git archive a41bf73 docs/vision-system | tar -x -C "$S/subject"
C="$S/subject/docs/vision-system/planning/specification/contracts"
```

`$S/harness/probe.py` (written by this recheck) takes a fixture-shaped JSON document, rebuilds
`run_negative_fixtures.run_fixture`'s scratch tree, and runs the validator with
`CONTRACTS_FIXTURE_RUN=1`. A FULL run is `cd <tree>/…/contracts && python3 validate_contracts.py`.

| id | what it does | how | exit | s | result |
|---|---|---|---|---|---|
| baseline | nothing | FULL, on `$C` | 0 | 679 | 288,620 checks · 36/36 · census as claimed |
| P1 | nothing | harness, `probes/P1.json` | 0 | 18.7 | 288,609 checks — the null control for every number below |
| P2a | RC3-01 forall hunk | harness, `probes/P2a.json` | 1 | 20.4 | `PINNED CONJUNCT ONLY UNDER A QUANTIFIER` |
| P2b | RC3-02 value-slot hunk | harness, `probes/P2b.json` | 1 | 21.2 | `PINNED CONJUNCT IN A NON-PREDICATE POSITION` |
| **P3a** | **forall hunk + `/forall/argument_positions/predicate` → `"demanded"`** | harness, `probes/P3a.json` | **0** | 21.1 | **288,646 checks · `under_quantifier: 0` · every pin satisfied** |
| **P3b** | **new primitive `every_linked_obligation`, `predicate: demanded`** | harness, `probes/P3b.json` | **0** | 20.7 | **288,654 checks · every pin satisfied** |
| P3c | remove `present.argument_positions` | harness, `probes/P3c.json` | 1 | 20.1 | ``a primitive declares no `argument_positions` `` |
| P3e | `present.value` → `"demanded"` | harness, `probes/P3e.json` | 1 | 20.7 | `argument position contradicts its argument type` |
| P4a | `not(not(X))` | harness, `probes/P4a.json` | 0 | 20.9 | correct — `under_negation` 137→139, demanded |
| P4b | `any(X, contradiction)` | harness, `probes/P4b.json` | 1 | 20.9 | `ONLY UNDER A DISJUNCTION` — conservative, correct |
| P4c | demanded copy + quantified copy | harness, `probes/P4c.json` | 0 | 20.7 | correct — `under_quantifier: 8`, the census's positive control |
| P4d | sibling demands the collection non-empty | harness, `probes/P4d.json` | 1 | 23.2 | `ONLY UNDER A QUANTIFIER` — RC4-04 |
| P5b | census + its 3 floors deleted from the validator | harness, `probes/P5b.json` | 0 | 17.6 | 288,606 checks — RC4-07 |
| P7f1-f4 | pins 24 / rows 43 / transitions 5 / disjoined 5 | harness, `probes/P7f*.json` | 1 | 22-25 | all four floors/ceiling bind, each naming its number |
| P7r13 | recheck-02 probe 1 (conjuncts removed) | harness, `probes/P7r13.json` | 1 | 16.9 | `PINNED CONJUNCT MISSING` |
| P7r14 | recheck-02 probe 9 (`any`) | harness, `probes/P7r14.json` | 1 | 16.9 | `ONLY UNDER A DISJUNCTION` |
| **P8a** | P3a's tree, manifest trimmed to the r15 forall fixture | FULL, `trees/p8a` | 1 | 34.3 | the fixture LEAKS — the only thing that refuses the table edit |
| **P8b** | 34 fixtures moved out of the tree AND the manifest | FULL, `trees/p8b` | **0** | 50.6 | 288,620 checks — identical verdict, `negative_fixtures_rejected: 2` — RC4-03 |
| P8d | P3b's tree, all 36 fixtures, anchor broken by my own edit | FULL, `trees/p8d` | 1 | 383 | runner died mid-suite — RC4-06, and inconclusive for RC4-02 |
| P6 | first-sorting fixture's expectation made impossible, 36 present | FULL, `trees/p8c` | 1 | 630 | structured leak with id AND reason — RC3-03 closed |
| **P8e** | **P3b's tree, all 36 fixtures, anchor preserved** | FULL, `trees/p8e` | **0** | 860 | **288,665 checks · 36/36 · G2-01 restored — RC4-02** |

Standalone baseline instruments, run on `$C` after every other run had finished:

```
python3 tools/guard_distinctness.py "$C"           exit 0, 0.32 s
   sibling_guard_collisions: 0 · ..._all_strings_erased: 5 (budget 5)
   declared_but_unread_arguments: {} · edges_not_calling_own_criterion: 0
   primitives_used_by_no_predicate: [acyclic, add, count, digest, forall, in, lte, scope_covers]
python3 tools/run_negative_fixtures.py --self-test  exit 0, 0.11 s
   {"refused_symlinked": true, "accepted_real": true, "failures": []}
```

`forall` appearing under `primitives_used_by_no_predicate` confirms the walker's stated ground
for treating `quantified` as unconditionally non-demanding: the corpus contains zero `forall`
nodes.

