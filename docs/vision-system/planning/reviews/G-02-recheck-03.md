> Archival provenance — 2026-09-13: Independent narrow recheck of the RC2-01..04 repair, preserved verbatim from the reviewer engine's report file, run on a frozen `git archive` copy of subject `1bef187` (the reviewer notes the contracts-only archive in its brief was insufficient and used the full `docs/vision-system` tree). The reviewer authored nothing in the package and was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, the register's `status` fields and the previous recheck's report. Same model family as the repair author and prior reviewers; independence is procedural only. Archival is not acceptance.
>
> **Disposition this recheck supports:** RC2-01, RC2-03, RC2-04 **CLOSED at specification level**. **RC2-02 OPEN (a)**: every stated element shipped and the `any` case is refused with the right message, but the contract it serves is not met — **RC3-01 (a)**: `forall` is a non-demanding context the walker does not track; the three pinned conjuncts moved verbatim inside `forall(items=path(/payload/obligation_refs))` validate at exit 0 (269,708 checks, 33/33 fixtures) with the pin file and prose untouched, and `obligation_refs` admits `[]` so the quantifier is vacuous — G2-01 restored. **RC3-02 (a)**: a conjunct buried in a `JsonValue` slot is also counted as demanded. Root cause: three hardcoded operator names instead of demanding positions derived from `primitive-registry.json` with refusal of the unrecognised. **RC3-03 (c)**: blind `stdout[-2000:]` truncation in the leak wrapper.

# G-02-recheck-03 — independent recheck of the RC2-01..04 contracts repair

## Provenance

- **Subject (frozen):** commit `1bef187` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`.
  Nothing in that tree was read for judgement and nothing in it was edited.
- **Working copy:** `$S/full` — `git archive 1bef187 | tar -x`. **The brief's archive command was
  insufficient and is corrected here:** archiving only `planning/specification/contracts` +
  `registers/review-findings.json` produces a tree the validator cannot run in. It aborts in 16 s with
  `FileNotFoundError: .../planning/specification/capabilities.json` — the criterion derivation reads the
  sibling source documents beside `contracts/`, and negative fixtures symlink two and three directories
  further out. Every measurement below is on the full-tree extraction.
- **Independence: PROCEDURAL ONLY.** One agent, one model family — the same family as the repair's author
  and as the previous reviewers. This is not a multi-family panel and must not be reported as one.
- **Not read:** `docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`,
  `PLANNING-REPORT.md`, the `status` fields of `registers/review-findings.json`, and
  `planning/reviews/G-02-recheck-02.md` (the previous reviewer's report) beyond what the brief quoted.
  Every number below is from a command run here.
- **Tooling:** python 3 at `/usr/local/bin/python3`, `jsonschema` 4.26.0.

## Probe 1 — live baseline on the unmodified subject

| Instrument | Command | Exit | Result |
|---|---|---|---|
| validator | `python3 validate_contracts.py` | **0** | `checks: 269697`, `negative_fixtures_rejected: 33`, `predicates: 2276`, `edges: 1311`. **688.85 s wall.** |
| manifest | `len(MANIFEST.json["fixtures"])` | — | **33**; directory holds **33** entries. `rejected == declared == present`. |
| guard | `python3 tools/guard_distinctness.py` | **0** | 1311 edges, 1311 calling their own criterion, 0 sibling collisions, 687 distinct edge skeletons, 166 predicates unreachable from any guard, and `primitives_used_by_no_predicate` includes **`forall`**. 0.51 s. |
| self-test | `python3 tools/run_negative_fixtures.py --self-test` | **0** | `refused_symlinked: true`, `accepted_real: true`, `failures: []`. 0.12 s. |

Every number the repair claimed is reproduced: `disjoined` ceiling of 4, manifest 33, 269,697 checks,
33/33 rejected. The runner's `--self-test` exists and passes, and it asserts BOTH halves — the refusal and
the positive control — which is the part that keeps it from degrading into a constant.

## Probe 2 — probe 9 replayed (the `any` disjunction). REFUSED.

Hunk: the r14 fixture's own `disjoined-spec.py`, spliced into `tools/phase_content.py` between the
anchors the fixture uses, then `python3 tools/author_phase_content.py .` (exit 0), then the validator.

- **Exit 1 in 17.1 s** (`real 17.149`), at `validate_contracts.py:793`.
- Exact first line:
  `AssertionError: ('PINNED CONJUNCT ONLY UNDER A DISJUNCTION: the registry still MENTIONS what this
  finding required, inside one branch of an `any`, and so no longer DEMANDS it',
  'criterion.SalesAgreement.performed.v1', 'nonempty_fields', ...)`
- The message names the predicate, the op, the finding's own `why`, `findings: [G2-01, RC-02]`,
  `decisions: [AD-013]`, and the remedy. It does **not** say "missing", which would have sent a reader
  looking for a conjunct that is right there. RC2-02's stated contract is met for this shape.

## Probe 3 — positive control for the `disjoined` key, and the ceiling

**3a — the ceiling binds.** Same hunk, plus `disjoined: true` + `disjoined_why` on the three rows of
`criterion.SalesAgreement.performed.v1`. **Exit 1 in 17.7 s at line 731**, before the pin rows are even
reached: `'more pinned rows are excused from DEMANDING their conjunct than when this ceiling was set'`,
`{'disjoined': 7, 'ceiling': 4}`, listing all seven rows by predicate and op. So the ceiling is not
decorative — three opt-ins is all it takes to trip it, and the brief's "set a fifth row" test is subsumed:
**the ceiling fires at 5 and the file sits at 4.**

**3b — the key works, and a SECOND control stands behind it.** Same tree with the ceiling literal raised
4 → 7 *in the probe tree only*, to isolate the key. The pin check now **passes** on all three rows, and
the run reaches `validate_contracts.py:972` and fails there in 17.1 s:
`("RC-03: `requires` names a related record's phase that no conjunct binds",
'criterion.SalesAgreement.performed.v1', 'delivered', ...)`.

That is the honest reading of the repair: for the `any` shape there are **two independent refusals** —
the pin's demand rule, and RC-03's prose/conjunct comparison — and defeating the first still leaves the
second. Probe 4 is what happens when one blind spot disables both.

## Probe 4 — a second non-demanding context. **LEAK. THIS IS THE HEADLINE.**

### RC3-01 — `forall` is a non-demanding context that `polarised_nodes` does not track, and the whole RC2-02 repair passes over it at exit 0

**Class:** (a) — the required contract is stated and implemented, and the implementation does not cover the
class of context the contract is about. Not a documentation gap.

**How I looked.** I enumerated the primitives whose `argument_types` contain a `boolean` — the only places
a conjunct can be nested as a child at all. There are exactly four:

| primitive | args | handled by `polarised_nodes`? |
|---|---|---|
| `all` | `predicates` | yes (`branching` when negated) |
| `any` | `predicates` | yes |
| `not` | `predicate` | yes (`inner` flips polarity) |
| **`forall`** | `items`, `bind`, **`predicate`** | **no** |

`forall`'s registered semantics are *"Evaluate the finite child for every typed item with lexical
binding"*, and the registry says **nothing about the empty case** — unlike `all`, which explicitly says
*"empty array only where calling schema explicitly allows vacuous truth."* A conjunct under a `forall`
over an empty list is contained, is not negated, is not under a disjunction, and is demanded by nothing.

**The mutation** (`$S/hunks/forall-spec.py` + `$S/add_fa.py`): one new DSL kind `fa` in
`tools/phase_content.py` (a dispatch branch, two recursion arms, one entry in `RECORD_SPECIFIC_KINDS`),
and the `("SalesAgreement","performed")` spec rewritten so all three pinned conjuncts survive **character
for character** inside `forall(items=path(/payload/obligation_refs), bind="item", predicate=all(...))`.
Nothing is removed, nothing is disjoined, `pinned-conjuncts.json` is untouched, and the `requires`
sentence is untouched.

**Result — `python3 tools/author_phase_content.py .` exit 0, then:**

```
{"status": "passed", "checks": 269708, ..., "negative_fixtures_rejected": 33}
python3 validate_contracts.py  565.16s user  9:32.03 total
exit=0
```

**Exit 0. 269,708 checks. 33 of 33 negative fixtures still rejecting.** Eleven checks more than the
baseline's 269,697, so the suite grew and still said nothing.

**The mechanism, run against the mutated body:** every one of the three pinned conjuncts reports
`negated=False, disjoined=False` — the walker classifies them as DEMANDED.

```
op=forall             negated=False disjoined=False
op=nonempty_fields    negated=False disjoined=False
op=related_phases     negated=False disjoined=False
op=native_correlated  negated=False disjoined=False
```

**The vacuity is reachable on a schema-valid record, which is what makes this a defect and not a
curiosity.** `records.schema.json#/$defs/SalesAgreement` lists `obligation_refs` in `payload.required`
with `"type": "array"` and **no `minItems`**, so `[]` is valid. On such an agreement the `forall` is
vacuously true and the criterion demands nothing about `/payload/fulfillment_ref`, nothing about that
Fulfillment being `delivered`, and no native correlation — **G2-01's original counterexample, restored:
the buyer pays, the Fulfillment stays `proposed`, every Obligation stays `recognized`, and the sale
reaches `performed` with nothing in the machine objecting.** This is the same sentence RC2-02 wrote about
`any`, one operator over.

**Both halves of the repair go blind together, and that is by design.** `stated_paths_and_states` was
deliberately rewired onto `polarised_nodes` so "the two halves of RC-03 and the pin table answer to one
definition of *demanded* rather than to two that can drift". The consistency is right; the consequence is
that **one gap in that one definition disables both controls at once.** Probe 3b showed RC-03 catching
what the pin let through — under `forall`, RC-03 also passes, because the buried `related_phases` binding
is not marked disjoined and its `delivered`/`discharged`/`transferred` states still count as bound.

**Required contract for RC3-01.** `polarised_nodes` must classify a conjunct by whether the body's truth
depends on it, not by which of three operator names sits above it:
1. Track **non-demanding context generally**, not disjunction specifically. Every primitive with a
   `boolean`-typed argument is either a demanding position or it is not, and the set must be **derived
   from `primitive-registry.json` at check time** and **closed** — an unrecognised boolean-child operator
   must be refused, not walked through as if it were `all`. A hard-coded triple of `any`/`all`/`not` is
   how this one got through, and the next primitive with a boolean child will get through the same way.
2. `forall` specifically is non-demanding unless something outside it forces its `items` to be non-empty.
   Treating it as non-demanding unconditionally is the safe reading and costs nothing today — the corpus
   contains **zero** `forall` nodes (`guard_distinctness.py` reports `forall` under
   `primitives_used_by_no_predicate`).
3. A negative fixture carrying this hunk. It **is** expressible: `tools_patch` takes a list of steps, so
   the DSL addition and the spec replacement ship as one fixture in the r14 shape.
4. Either the same treatment in `stated_paths_and_states`, or — since it already shares the walker — a
   note that fixing the walker fixes both, and the fixture asserts both.

**Sibling contexts checked and NOT leaking:** `not(not(X))` (polarity flips twice, correctly demanded);
`any` with a single branch (marked disjoined, refused — conservative and correct); a nested `all` inside
an `any` (`disjoined` propagates through); `optional: true` on a `related_phases` binding (the pin row
pins `optional: false` explicitly and `pin_row_matches` compares it, so this is refused as MISSING);
an extra unread key on an operator node (refused by `validate_contracts.py:290`,
`set(node) == {"op", *PRIMITIVES[operator]["args"]}`, which is a genuinely tight structural check).
`implies`/`if`/`when`/`unless` and a `count >= 0` comparison **do not exist** in this primitive set, so
those lines of attack have no population here.

## Probe 5 — RC2-01, the symlink guard. CLOSED.

`fixtures/negative` replaced by a symlink to a scratch directory holding one real fixture and a
`MANIFEST.json` declaring one — the exact shape that previously printed
`{"fixtures": 1, "declared": 1, "passed_as_required": 1}` at exit 0.

| Arm | Exit | First line |
|---|---|---|
| `tools/run_negative_fixtures.py` | **1** | `refusing to run: …/fixtures/negative is a symlink, so this runner would report on the link target while naming the tree in front of it (RC-05, extended to fixtures/ by RC2-01)` |
| `validate_contracts.py` (its own mirror, line 1010) | **1**, 17.1 s | `RC2-01: a fixture directory is a symlink, so the negative-control count and the MANIFEST.json declaring it both describe a tree other than this one` |

**The `--self-test` is a real control, not a control-shaped constant.** With the guard loop reverted to
its pre-RC2-01 form — `for _component in (_TOOLS, _TOOLS.parent):` — the self-test reports
`refused_symlinked: false` and **exits 1**, and the validator that calls it fails at line 1021 in 17.1 s
with `the negative-fixture runner's symlink guard does not refuse a symlinked fixtures/negative, or
refuses a real one too (RC2-01)`. Both halves are asserted; the positive control (`accepted_real: true`)
is what keeps a refuse-everything guard from passing.

**One narrow note, not a finding.** The validator's mirror covers `fixtures` and `fixtures/negative`; the
runner's loop additionally covers `tools/` and `contracts/` itself. So the two are deliberately different
assertions, which the comment says, and the validator side is the narrower of the two.

## Probe 6 — RC2-03, the recorded scope. CONFIRMED by independent sweep.

I re-derived every number with my own walker rather than reading the file's. **Every one matches:**

| Quantity | Recorded | My sweep |
|---|---|---|
| criteria examined | 774 | **774** |
| name a field path in `requires` (the PATHS rule's population) | 0 (0.0%) | **0** |
| name a backticked phase of a RELATED record | 19 (2.5%) | **19** |
| such tokens in all | 22 | **22** |
| of the 19, relying on a waiver | 17 | **17** |
| waivers declared / in use | 17 / 17 | **17 / 17**, none unused |
| tokens bound by a conjunct (the rule's live force) | 5 across 2 criteria | **5**, `criterion.SalesAgreement.performed.v1` and `criterion.GrievanceCase.remedy_authorized.v1` |

**The backtick question.** With the body weakened as in recheck-02's probe 9 (conjuncts **removed**, not
disjoined) *and* `delivered`/`discharged`/`transferred` unbackticked in the same sentence — so RC-03's
PHASES rule is blinded by construction — the tree still fails, **exit 1 in 17.5 s**, at the pin:
`PINNED CONJUNCT MISSING: the registry no longer says what this finding required`. The pin is independent
of prose formatting, as it should be, and it is what catches this.

Two things follow, and the second is the limit worth naming:
- The r13 fixture that exercises the PATHS rule uses a **backticked** path
  (`` `/payload/payment_operation` ``). `PROSE_PATH` has a second alternative for an **unbackticked**
  `/payload/...`, and nothing exercises it — a live regex branch with zero population and zero control.
  Minor; recorded, not raised as a finding, because the population is zero either way.
- **The pin table covers 8 criteria of 774** (25 pins: 8 `criterion.*`, 17 `edge.*`). RC-03's live phase
  force is 5 tokens across 2 criteria. For the other ~766 criteria neither control is in force, so the
  formatting dependency is unmitigated there. That is the accepted scope the file states in
  `requires_waivers_why`, stated accurately, and it is why RC3-01 lands where it does.

## Probe 8 — regression sanity. All three still fail.

| Mutation | Exit | What fires |
|---|---|---|
| recheck-02 probe 1 — r13's weakened spec verbatim, conjuncts removed, prose untouched | **1** | `PINNED CONJUNCT MISSING`, naming `criterion.SalesAgreement.performed.v1` / `nonempty_fields` |
| pin table shrunk to 24 pins | **1** | `the pinned table has shrunk; a pin table with no pins passes vacuously`, `{'pins': 24, 'floor': 25, 'pinned_transitions': 6, 'transition_floor': 6}` |
| 25 pins kept, `require` rows stripped to 43 | **1** | `the pinned table kept its pins and lost its requirements`, `43` |

The 25/44 floors and the 6-transition floor all hold.

### RC3-02 — the same class, second instance: the walker judges position by operator name, not by whether the position is evaluated

**Class:** (a), same root cause as RC3-01, reported separately because the required contract is different
and a fix aimed only at `forall` leaves this one open.

`polarised_nodes` walks **every value of every node** except the `op` key, so a conjunct placed in a slot
that is not a boolean child at all — `present`'s `value`, which the primitive registry types as
`JsonValue` — is still reported `negated=False, disjoined=False`, i.e. DEMANDED.

Mutation: one DSL kind `bury` emitting `{"op": "present", "value": <the pinned conjunct>}`, and the three
pinned conjuncts of `criterion.SalesAgreement.performed.v1` each wrapped in it. Nothing removed, nothing
disjoined, pin file and prose untouched.

```
python3 tools/author_phase_content.py .   -> exit 0
CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py
{"status": "passed", "checks": 269694, ...}   exit=0
```

**Stated narrowly:** this arm was run with `CONTRACTS_FIXTURE_RUN=1`, so it establishes that **every
registry-level check passes** — schema, AST, drift oracle, the pin table and RC-03 — and it does **not**
re-run the 33 negative fixtures. RC3-01 is the arm that was run end to end.

**Required contract for RC3-02.** The pin's notion of "demanded" must be computed over the **evaluated
conjunct positions** of a body, not over every dict value it can reach. Concretely: walk only the
arguments a primitive declares as `boolean`/`boolean[]` in `primitive-registry.json`, and treat a pinned
`op` found anywhere else as **not present** rather than as demanded. The structural check at
`validate_contracts.py:290` already proves the registry is strict enough to make this derivable —
every node's key set is exactly `{"op", *args}` — so the walker has the information it needs and does not
use it.

## Probe 7 — RC2-04, the two exits branched. CLOSED, with one residue.

| Arm | Exit | Wall | First line / result |
|---|---|---|---|
| **7a** fixture moved out, MANIFEST untouched | **1** | 17.1 s | `the tree and fixtures/negative/MANIFEST.json disagree about which negative fixtures exist (RC-04), and NO fixture was run…`, detail `{'declared': 33, 'present': 32, 'declared_but_absent': ['r1-edge-does-not-call-its-criterion'], …}` |
| **7b** fixture deleted **with** its manifest line | **0** | 9:24 | `{"status": "passed", "checks": 269697, "negative_fixtures_rejected": 32}` — the denominator moved with the tree, one lower, exactly as required |
| **7c** one fixture's `expect_failure_contains` made impossible to match | **1** | 9:34 | `a negative fixture was not rejected; the check it names is gone`, detail ends `{"fixtures": 33, "declared": 33, "passed_as_required": 32, "leaked": ["r1-edge-does-not-call-its-criterion"]}` |

The branch is real: a count mismatch gets the ratchet headline and a genuine leak gets the generic
wrapper. The two are no longer the same sentence. The headline the validator branches on is also asserted
to still exist in the runner that prints it (`FIXTURE_RATCHET in run_negative_fixtures.py`), which closes
the rename hole.

### RC3-03 — the leak detail truncates away the reason, for any fixture early in the sort order

**Class:** (c) — reporting, minor, same family as RC2-04 itself.

The generic wrapper attaches `completed.stdout[-2000:]`. The runner prints one line per fixture in sorted
order, so with 33 fixtures the **first** fixture's `[FAIL] … failed for the wrong reason; expected …` line
falls outside the 2,000-character tail. Measured on 7c: **`failed for the wrong reason` occurs 0 times in
the validator's entire output.** The `leaked` array still names *which* fixture, so nothing is unknowable;
but the headline says the fixture *"was not rejected"* when it **was** rejected, by a different check,
and the sentence that would have corrected that is the one truncated away. This is the same defect RC2-04
was written to fix, one layer down.

**Required contract:** attach the runner's per-fixture lines for the ids in `leaked` rather than a blind
tail slice, or branch the headline on `passed_as_required < fixtures` with the leaked ids and their
reasons. The runner already has both.

## Dispositions — RC2-01 … RC2-04

| Item | Disposition | Basis |
|---|---|---|
| **RC2-01** symlinked `fixtures/negative` | **CLOSED at specification level** | Runner refuses and names the directory; the validator mirrors it independently; `--self-test` asserts refusal **and** the positive control, and it fails (exit 1) when the guard is reverted, taking the validator down with it. Probe 5. |
| **RC2-02** pinned conjunct satisfied from inside a disjunction | **OPEN (class a)** — the `any` case is closed, the **class** is not | Every stated element shipped and works: `disjoined` key with both-direction shape checks, `polarised_nodes` ancestry, refusal of an un-opted-in match, exactly 4 intentional opt-ins each naming its branch, a ceiling that fires at 5, and the r14 fixture. The contract it was written to satisfy — *a pinned conjunct must be DEMANDED, not merely contained* — is **not** met: `forall` (RC3-01) and any non-boolean value slot (RC3-02) both defeat it, RC3-01 end to end at exit 0 with all 33 fixtures still rejecting. |
| **RC2-03** RC-03's real scope | **CLOSED at specification level** | The required contract was "record the real scope with numbers, and either widen or record the narrow scope as accepted with a fixture". All seven recorded numbers reproduce exactly under my own independent sweep; the narrow scope is recorded as accepted in `pinned-conjuncts.json#/requires_waivers_why` with the measured cost of widening (425 findings / 266 criteria / 62 tokens); and `r14-requires-names-a-related-phase-no-conjunct-binds` gives the live half the control it lacked. Probe 6. |
| **RC2-04** count mismatch under the wrong headline | **CLOSED at specification level**, with RC3-03 outstanding | The two exits branch correctly and the ratchet string is asserted to exist in the runner. The residue is that the *detail* for a genuine leak truncates the reason away (RC3-03). |

## New findings

| id | class | severity | where | one line |
|---|---|---|---|---|
| **RC3-01** | (a) | **high — this is the headline** | `validate_contracts.py:645` `polarised_nodes`; `:787-809` the pin check | A pinned conjunct moved inside `forall` is classified as DEMANDED. Exit 0, 269,708 checks, 33/33 fixtures rejecting, pin file and prose untouched, and the criterion demands nothing about delivery on any SalesAgreement whose `obligation_refs` is `[]` — which `records.schema.json` permits, no `minItems`. G2-01 restored. |
| **RC3-02** | (a) | medium | same walker | The walker reaches every dict value, so a conjunct buried in a `JsonValue` slot (`present`'s `value`) is also DEMANDED. Registry-level checks all pass at exit 0. A fix aimed only at `forall` leaves this open. |
| **RC3-03** | (c) | low | `validate_contracts.py:1063` | The generic leak wrapper attaches a blind `stdout[-2000:]`, so a fixture early in sort order loses its `failed for the wrong reason` line entirely. Measured: 0 occurrences in the whole output. |

**RC3-01 and RC3-02 are one root cause with two required contracts.** The root cause is that
`polarised_nodes` decides whether a position is demanding by matching three hard-coded operator names
(`any`, `all`, `not`) while walking every other key blindly. The durable fix derives the set of demanding
positions from `primitive-registry.json` — which argument of which primitive is typed `boolean` — and
**refuses** an unrecognised shape instead of walking through it. That is the same rule
`validate_contracts.py:752` already applies to pin row keys (*"Declare what is read and REFUSE the
rest"*) and that `:290` already applies to operator nodes. The walker is the one place in this file that
does not follow it.

## Not checked, and why

- **`run_negative_fixtures.py --self-test` under a symlinked `tools/`** (RC-05's original shape). The RC-05
  repair is outside this recheck's four items and was not re-probed.
- **Whether RC3-01 is expressible as a negative fixture end to end.** I established the mutation and the
  exit-0 result; I did not author the fixture. `tools_patch` accepts a list of steps, so the DSL addition
  and the spec replacement can ship as one fixture in the r14 shape — that is an inference from the
  runner's code, not a measurement.
- **RC3-02 end to end.** Run with `CONTRACTS_FIXTURE_RUN=1`; the 33 negative fixtures were not re-run on
  that arm. Registry-level verdict only.
- **Anything outside `planning/specification/contracts` and `registers/review-findings.json`.** The rest
  of the archive was extracted only because the validator cannot run without it.
- **The `status` fields of the findings register, and the previous reviewer's report.** Per the brief.
  Every number here is from a command run in this session.
- **Multi-family review.** One model family. Not a panel.

## Reproduction

`$S` = `/private/tmp/claude-501/…/scratchpad/recheck-03`. Subject tree: `$S/full` (from
`git archive 1bef187`). Helpers: `$S/mktree.sh` (fresh probe tree), `$S/splice.py` (replace the
`("SalesAgreement","performed")` block between the r14 anchors), `$S/add_fa.py` (the `fa` DSL kind),
`$S/sweep_rc03.py` (the independent RC-03 scope sweep), hunks in `$S/hunks/`, raw output in `$S/out/`.

| Probe | Tree | Command | Exit | Seconds |
|---|---|---|---|---|
| 1 baseline | `$S/full` | `python3 validate_contracts.py` | 0 | 688.9 |
| 1 guard | `$S/full` | `python3 tools/guard_distinctness.py` | 0 | 0.5 |
| 1 self-test | `$S/full` | `python3 tools/run_negative_fixtures.py --self-test` | 0 | 0.1 |
| 2 disjunction | `$S/probes/p2` | splice `disjoined-spec.py` → author → validate | 1 | 17.1 |
| 3a ceiling | `$S/probes/p3` | + `disjoined: true` ×3 | 1 | 17.7 |
| 3b key isolated | `$S/probes/p3b` | + ceiling 4→7 in the probe tree | 1 (at RC-03) | 17.1 |
| **4 forall** | `$S/probes/p4` | `add_fa.py` + splice `forall-spec.py` → author → validate | **0** | **572.0** |
| 4b value slot | `$S/probes/p4b` | `bury` kind, `CONTRACTS_FIXTURE_RUN=1` | **0** | ~17 |
| 5 symlink | `$S/probes/p5` | symlink `fixtures/negative` | 1 / 1 | 0.1 / 17.1 |
| 5b guard reverted | `$S/probes/p5b` | guard loop → `(_TOOLS, _TOOLS.parent)` | 1 / 1 | 0.1 / 17.1 |
| 6 unbackticked | `$S/probes/p6` | weakened body + backticks removed | 1 | 17.5 |
| 7a ratchet | `$S/probes/p7a` | fixture moved out | 1 | 17.1 |
| 7b denominator | `$S/probes/p7b` | fixture + manifest line deleted | 0 (32 rejected) | 564.3 |
| 7c leak | `$S/probes/p7c` | `expect_failure_contains` made impossible | 1 | 573.9 |
| 8a conjuncts removed | `$S/probes/p8a` | r13 weakened spec | 1 | ~17 |
| 8b pins 24 | `$S/probes/p8b` | pins truncated | 1 | ~17 |
| 8c rows 43 | `$S/probes/p8c` | require rows stripped | 1 | ~17 |

Wall clock for probes 4b, 8a, 8b and 8c was contended with a background run and is reported as
approximate. Probes 1, 2, 3, 5, 6, 7 ran with nothing else competing, except 7b and 7c which ran
sequentially with each other.

## One note on how RC3-01 would actually arrive

The mutation needed a `forall` builder in the DSL, because none exists — 4 small edits in
`tools/phase_content.py` plus the spec replacement, against probe 9's single spec hunk. That is a larger
edit, and it is worth being exact that it is not identical in size to the attack it generalises.

It is also not an adversarial edit. `forall` is a **registered primitive with zero uses**
(`guard_distinctness.py` lists it under `primitives_used_by_no_predicate`), and the first author who
needs "every linked Obligation satisfies X" will reach for it and add exactly that builder. Nothing warns
them that doing so disarms three pins, and the pin file states the opposite in terms:

> *"pinned-conjuncts.json is hand-written and is NOT derived from tools/phase_content.py; regenerating
> the registry cannot satisfy this check, only stating the requirement can"*

That sentence is falsified by probe 4. Regenerating the registry did satisfy the check, and nothing
stated the requirement.

## What landed

Worth keeping, because the next iteration should not undo it:

- **The demand/containment split is the right distinction and the message says which one fired.** Probe 2
  gets `ONLY UNDER A DISJUNCTION` and probe 6 gets `MISSING`, and a reader is sent to the right place.
- **The ceiling.** Floors alone cannot tell 44 live rows from 44 inert ones. It fires at 5 and the file
  sits at 4 — checked, not assumed.
- **Both-direction shape checks on `disjoined`/`disjoined_why`.** An orphaned excuse is refused, so an
  excuse nobody had to write cannot sit there reading as though it were in force.
- **`--self-test` asserts its own positive control** and dies when the guard is reverted. Most controls in
  this package could not do that.
- **RC2-03 chose to record an accepted limit rather than widen to a rule nobody could live with, measured
  the alternative first (425 findings / 266 criteria), and shipped the fixture for the half that was
  actually load-bearing.** That is the correct trade and the numbers hold up under an independent sweep.
