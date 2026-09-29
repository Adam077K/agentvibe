> Archival provenance — 2026-09-13: Independent narrow recheck of the ratchet-pin repair (RC-01..RC-08), preserved verbatim from the reviewer engine's report file, written incrementally on a frozen `git archive` copy of subject `3579cc2`. The reviewer authored nothing in the package, was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md` and the register's `status` fields, and ran its own mutations rather than reading the package's fixtures as evidence. Sections sit in completion order (see "Reading order" at the end). The reviewer shares a model family with the repair author and the previous reviewer; independence is procedural only. Archival is not acceptance.
>
> **Disposition this recheck supports:** RC-01, RC-03, RC-04, RC-05, RC-06, RC-07, RC-08 **CLOSED at specification level**. **RC-02 OPEN (a)**: the brief's exact attack is refused by name, but a sibling one-hunk edit that disjoins each pinned conjunct with a trivially-true alternative passes the validator at exit 0 with 31/31 fixtures rejecting and the pin file untouched (RC2-02). New: RC2-01 (b) fixture denominator lives inside the directory it measures; RC2-03 (b) RC-03's phase rule is switched off by removing backticks and its path rule has zero live population; RC2-04 (c) count mismatch reported under the wrong headline.

# G-02-recheck-02 — independent narrow recheck of the contracts repair

## Provenance

| | |
|---|---|
| Subject | commit `3579cc2ec147933577ac27a5564164123c1a62a2`, 2026-09-13 18:40:34 +0300 |
| Subject tree | `git archive 3579cc2 docs/vision-system`, extracted to a frozen scratch copy |
| Repository | `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685` (not edited) |
| Reviewer | read-only engine; no `Write`, no `Edit` tool |
| Toolchain | python3, jsonschema 4.26.0, `referencing` present |

**Independence is procedural only.** I authored nothing in this package and read no
author-recorded verdict, but I share a model family with the repair's author and with the
previous reviewer. This is not an independent panel and must not be reported as one.

**What I did not read:** anything under `docs/08-agents_work/`, any `.worktrees/` directory,
`docs/vision-system/state.json`, `history.jsonl`, `PLANNING-REPORT.md`, and the `status`
fields of `registers/review-findings.json`. The RC-01..RC-08 `issue` / `required_contract`
text was taken from the brief, not from the register. I did read
`registers/review-findings.json` indirectly only in the sense that the validator reads it at
check time; I did not open it.

**Method note.** The package's own fixtures are not treated as evidence that a check works.
Every disposition below rests on a mutation I made and ran.

---

## Probe 8 — RC-05, the runner's own root

**Commands and results.**

```
cwd=<p8>/contracts   python3 tools/run_negative_fixtures.py        # tools/ is a symlink
exit 1
refusing to run: <p8>/contracts/tools is a symlink, so this runner would report on the
link target while naming the tree in front of it (RC-05)

cwd=<S>   python3 <S>/subject-link/tools/run_negative_fixtures.py  # symlinked contracts dir
exit 1
refusing to run: <S>/subject-link is a symlink, so this runner would report on the link
target while naming the tree in front of it (RC-05)
```

Both refusals fire. `.resolve()` is gone from the runner and `absolute()` plus the
two-component symlink assertion replaces it.

One measurement that is worth recording because it changes how the guard should be read:
**a cwd-relative invocation through a symlinked directory never diverges in the first
place**, because `os.getcwd()` returns the physical path. Running the runner with
`cwd=<S>/subject-link` reports its cwd as the real `…/subject/docs/…/contracts`. So the
guard's live case is the absolute-path invocation, which is the second command above, and
that one is caught.

**Disposition: RC-05 CLOSED at specification level.**

**But the guard is narrower than its own rationale.** It asserts `tools/` and `tools/..`
are not symlinks. It does not assert anything about `fixtures/negative`, which is where
the count it reports comes from. Measured on a copy whose `fixtures/negative` is a symlink
into another tree:

```
ROOT       : <p8c>/contracts
FIXTURES   : <p8c>/contracts/fixtures/negative
is_symlink : True -> resolves to <subject>/contracts/fixtures/negative
discovered : 31
declared   : 31
```

The module imported without refusing, and it reports 31 fixtures that are not in the tree
it names — the exact sentence in its own refusal message. Because `MANIFEST.json` travels
with the symlink, the declared count and the discovered count agree, so the RC-04 ratchet
agrees too. See **RC2-01** below.

### Probe 8 addendum — the ratchet defeated through the same symlink

The RC-04 denominator lives **inside** the directory it measures
(`fixtures/negative/MANIFEST.json`), and both readers of it resolve that path through
`ROOT`: `run_negative_fixtures.py` line 59 and `validate_contracts.py` lines 901-902. So a
symlinked `fixtures/negative` carries its own denominator with it.

Measured. `fixtures/negative` symlinked to a directory holding one fixture and a manifest
declaring one:

```
cwd=<p8c>/contracts   python3 tools/run_negative_fixtures.py
  [ok] R5 r5-destination-carries-prose: rejected as required
{ "fixtures": 1, "declared": 1, "passed_as_required": 1, "leaked": [] }
RUNNER_EXIT=0
```

One of thirty-one fixtures, exit 0 — RC-04's original reading, reproduced. The validator's
two comparisons read the same symlinked manifest, so `1 == 1` and `1 == 1` both hold; that
half is read off lines 901-909 rather than run, because the surrounding run costs half an
hour and the arithmetic is not in doubt.

This does not violate the manifest's *stated* guarantee, which is that a removal is a
visible line in a diff — turning a directory into a symlink is also visible. It does defeat
the mechanism the file claims: *"a denominator derived from the directory it measures
cannot notice a deletion."* The denominator here is not derived from the directory, it is
**carried by** it, which fails the same way.

---

## Probe 5 — RC-01, the in-flight delivery failure

Read from `record-registry.json` and `predicate-registry.json` in the frozen subject.

`Fulfillment` phases: `proposed, validated, delivering, delivered, failed, refunded,
superseded, restricted`. Its seventeen transitions now include, quoted by `edge_id`:

- `Fulfillment:delivering->failed` — `predicate_id: edge.Fulfillment.delivering.failed.v1`,
  `criterion_id: criterion.Fulfillment.failed.v1`
- `Fulfillment:delivered->failed` — `predicate_id: edge.Fulfillment.delivered.failed.v1`,
  same `criterion_id`
- `Fulfillment:failed->refunded` — `criterion.Fulfillment.refunded.v1`
- `Fulfillment:delivered->refunded` — `criterion.Fulfillment.refunded.v1`

So the in-flight route exists, and `refunded` is reachable from both `failed` and
`delivered`. A refund of an undelivered sale is representable.

**The criterion is now consistent with both inbound edges.**
`criterion.Fulfillment.failed.v1`'s body is exactly three conjuncts:
`nonempty_fields(/payload/remaining_duties, /payload/receipts, /payload/service_window)`,
`related_phases(/payload/performer_assignment states [accepted])`, and
`attested_result`. **There is no `native_correlated` in it, negated or otherwise** — the
conjunct that contradicted its own only inbound edge is gone from the criterion.

The route-specific requirement moved to the guard, which is where a property of a route
belongs. `edge.Fulfillment.delivering.failed.v1` carries
`transition_basis(event_kind: "record.delivery_failed")` and
`not(native_correlated(result: "delivered"))`; `edge.Fulfillment.delivered.failed.v1`
carries `transition_basis(event_kind: "restriction.failed")` and no correlation conjunct at
all. One criterion, two guards, no contradiction.

**Disposition: RC-01 CLOSED at specification level.**

One note on the letter of the required contract, which asked for "a `delivering->failed`
edge **with its own criterion**". The edge has its own *guard predicate*; the *criterion* is
shared with `delivered->failed`. That is a deliberate choice, argued in
`tools/phase_content.py` beside the `("Fulfillment", "failed")` entry: *"One criterion
cannot assert both, and the layer that can tell the two routes apart is the guard."* I agree
with it, and it satisfies the third clause of the contract — consistency with each inbound
edge — which the literal reading would not have.

Three of the four routes are pinned in `pinned-conjuncts.json#/pinned_transitions`:
`delivering->failed`, `failed->refunded`, `delivered->refunded`, all citing RC-01.

---

## Probe 6 — RC-06, the three `*->performed` edges

All three carry both conjuncts, unnegated:

| edge | `transition_basis` | `native_correlated` | pinned |
|---|---|---|---|
| `edge.SalesAgreement.accepted.performed.v1` | `event_kind: record.performed` | `result: delivered` | yes |
| `edge.SalesAgreement.partially-performed.performed.v1` | `event_kind: record.performed` | `result: delivered` | yes |
| `edge.SalesAgreement.disputed.performed.v1` | `event_kind: record.performed` | `result: delivered` | yes |

Each pin carries two `require` rows naming the same two ops with the same values, citing
RC-06 and AD-013.

**Disposition: RC-06 CLOSED at specification level.**

---

## Probe 9 — RC-08 and RC-07

**RC-08.** `Fulfillment:validated->delivering` exists, `predicate_id:
edge.Fulfillment.validated.delivering.v1`, `criterion_id:
criterion.Fulfillment.delivering.v1`. The generic `validated` branch is no longer disjoint
from the delivery branch: `proposed->validated->delivering->delivered` is a path.
The transition is pinned, citing RC-08. **CLOSED at specification level.**

**RC-07.** `grep -n terminated_with_residuals
planning/specification/03-company-capabilities.md` returns line 199, a phase-meaning row:

> `| `SalesAgreement.terminated_with_residuals` | "As `terminated` — forward performance has
> ended — except that the transitive due set is NOT empty. …" | "`terminated`. This phase
> asserts that duties survive; `terminated` asserts that none do, and the difference is the
> whole point of having both" |`

and line 205, a dated supersession note recording AD-014 and naming the new terminal.
Chapter 03 is the only specification chapter that mentions the phase, which is what the
contract asked for. **CLOSED at specification level.**

---

## Probe 4 — live baseline, unmodified subject

```
cd <subject>/contracts && python3 validate_contracts.py
```

| measurement | value |
|---|---|
| exit code | 0 |
| checks | 269,559 |
| `negative_fixtures_rejected` | 31 |
| fixtures declared in `MANIFEST.json` | 31 |
| records / predicates / edges | 173 / 2,276 / 1,311 |
| wall clock | 801.6 s real, 708.9 s user |

The fixtures-rejected count equals the manifest count: **31 and 31.**

```
cd <subject>/contracts && python3 tools/guard_distinctness.py    # exit 0
```

| measurement | value |
|---|---|
| `sibling_guard_collisions` | 0 |
| `sibling_guard_collisions_all_strings_erased` | 5 |
| `distinct_effective_edge_skeletons` | 687 of 1,311 edges |
| `distinct_effective_edge_skeletons_all_strings_erased` | 336 |
| `largest_edge_skeleton_share_all_strings_erased` | 126 |
| `edges_not_calling_own_criterion` | 0 |
| `declared_but_unread_arguments` | none |

The five all-strings-erased collisions are the five declared in
`phase-content-gaps.json#/residual_sibling_collisions` (two `DecisionRecord` pairs, two
`ExternalAttempt` pairs, one `FormationReadiness` pair). None involves `SalesAgreement` or
`Fulfillment`.

---

## Probe 1 — the RC-02 attack, replayed

**Mutation.** In a copy of the subject, the `("SalesAgreement", "performed")` entry of
`tools/phase_content.py` had its conjunct list replaced. Diff, verbatim:

```
-        [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
-                  "/payload/acceptance_evidence", "/payload/agreed_terms"]),
-         ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
-                  ("/payload/obligation_refs", ["discharged", "transferred"], False)]),
-         ("nc", "delivered"), AF, AR],
-        hard=["nfp", "rpp", "nc"]),
+        [("nfp", ["/payload/acceptance_evidence", "/payload/agreed_terms"]),
+         ("nc", "performed"), AF, AR],
+        hard=["nfp", "nc"]),
```

No fulfillment_ref, no `delivered` binding, no obligation states, correlation back on
`performed`. The `requires` sentence was left exactly as it was.

**Commands.**

```
python3 tools/author_phase_content.py .     # REGEN_EXIT=0
python3 validate_contracts.py               # VALIDATE_EXIT=1, 18 seconds
```

**Observed failure**, verbatim from stderr:

```
AssertionError: ('PINNED CONJUNCT MISSING: the registry no longer says what this finding
required', 'criterion.SalesAgreement.performed.v1', 'nonempty_fields', 'the agreement must
NAME its own Fulfillment and its obligations; without these two paths the phases below bind
to nothing', {'findings': ['G2-01', 'RC-02'], 'decisions': ['AD-013'], 'note':
'pinned-conjuncts.json is hand-written and is NOT derived from tools/phase_content.py;
regenerating the registry cannot satisfy this check, only stating the requirement can'})
```

Raised at `validate_contracts.py:735`, the pin containment check.

**The attack that opened this recheck now fails the validator, and the message names the
predicate, the missing op, and the finding it belongs to.**

**Check count on this run: none.** `checked()` raises on the first failure, so no count is
printed and the run stops at the pin block. The count is a property of a passing run only;
the baseline's 269,559 is the figure, and a failing run cannot be compared to it.

**Disposition: RC-02 CLOSED at specification level** for the exact attack in the brief.
Probes 2 and 9 below test how much of that closure is the pin and how much is reachable
around it.

---

## Probe 7 — RC-03, `requires` prose against conjuncts

**A check exists.** `validate_contracts.py` lines 796-872 compare each criterion's
`requires` sentence to its body, in two rules:

- **PATHS** — every field path the sentence names must be named by some conjunct.
  `PROSE_PATH = r"`(/[A-Za-z0-9_./\-]+)`|(?<![`\w])(/payload/[a-z_]+)"`.
- **PHASES** — every backticked token that is a phase of a **related** record, is not a
  phase of the subject's own lifecycle, and is not bound by any `related_phases` state,
  must be waived by name. `PROSE_TOKEN = r"`([a-z][a-z_\-]*)`"`.

It reports its denominator before its verdict (`requires_examined >= 700`), which is the
right shape for an instrument.

**Measured coverage on the committed corpus** — my own sweep, re-implementing neither rule
but applying the two regexes the validator uses:

| | criteria | tokens |
|---|---|---|
| examined by RC-03 | 774 | |
| **carrying at least one prose field path** | **0** (0.0%) | **0** |
| carrying at least one related-record phase token | 19 (2.5%) | 22 |
| of those 19, waived in `requires_waivers` | 17 | |

**The PATHS rule — the half the required contract actually named — fires on zero of 774
criteria, because no `requires` sentence in this corpus names a field path at all.** It is
not wrong, and it is not vacuous by construction: the package's own mutation fixture adds a
path and the rule catches it. But on the committed tree it has an applicable population of
zero, so it contributes no live assertion. The whole of RC-03's live force is the PHASES
rule, on 22 tokens across 19 criteria, 17 of which are waived.

**The 17 waivers are not a hole.** Every one is the same shape: the sentence names the
phase-kind the content was authored from (`proposed`, `repaired`, `verified`, `reported`,
`unknown_effect`) while the record spells that same phase differently (`draft`,
`verified_repaired`, `verified_with_limits`, `report_submitted`, `effect_unknown`). Each
waiver names the exact token it excuses, so an unrelated phase appearing on a waived
criterion still fails. **No waiver touches `criterion.SalesAgreement.performed.v1` or any
`Fulfillment` criterion.** Seventeen waivers of this kind is not large enough to walk the
original defect through; the defect would need a waiver naming `delivered`, and adding one
is a line in a diff that says what it excuses.

**Where the rule can be switched off, though, is formatting.** PHASES only sees *backticked*
tokens. The sentence "that Fulfillment is currently `delivered`" is checked; the same
sentence without the backticks promises a reader exactly the same thing and is invisible to
the rule. That is probe 10 below.

---

## Probe 3 — RC-04, the fixture count ratchet

**Mutation A: delete one fixture, leave `MANIFEST.json` alone.** The deleted fixture is the
directory `fixtures/negative/r13-derivation-weakened-then-regenerated` — chosen because it
is the control for RC-02 itself, and because a directory-shaped fixture also exercises the
second discovery rule.

```
cd <p3>/contracts && python3 tools/run_negative_fixtures.py     # RUNNER_EXIT=1
{
  "check": "negative fixture count ratchet (RC-04)",
  "declared": 31, "present": 30,
  "declared_but_absent": ["r13-derivation-weakened-then-regenerated"],
  "present_but_undeclared": []
}
```

**Mutation B: the other direction — remove the manifest line, keep the fixture.**

```
cd <p3c>/contracts && python3 tools/run_negative_fixtures.py    # RUNNER_EXIT=1
{
  "check": "negative fixture count ratchet (RC-04)",
  "declared": 30, "present": 31,
  "declared_but_absent": [],
  "present_but_undeclared": ["r13-derivation-weakened-then-regenerated"]
}
```

Both directions refuse, by name, before any fixture runs. **The runner itself enforces the
ratchet**, which is the clause the brief asked me to confirm.

**Mutation C: delete the fixture AND its manifest line.** Reported under probe 3 results
below once the queued validator run completes. The design intent is that this is *allowed*
and is a visible diff line. Whether the design holds is answered there, and the caveat is
probe 8's addendum: the manifest lives inside the directory it measures, so it can be
substituted wholesale without any line in it changing.

### Probe 5 addendum — what the refund routes actually demand

Worth stating plainly, because "reachable" and "guarded" are different claims.
`criterion.Fulfillment.refunded.v1` is a **declared content gap**: its body is
`content_unspecified` with `gap_id: gap-Fulfillment-refunded`, registered in
`phase-content-gaps.json` with `kind: prose_silent` and the note *"the corpus names
`refunded` in a state list and never says what entering it demands."* Its `requires` reads
"NOT STATED."

So both refund edges — `failed->refunded` and `delivered->refunded` — are guarded by
`subject_unchanged`, `status_edge`, `transition_basis(event_kind: "record.refunded")`,
`current_owner`, and a call into a criterion that asserts only `attested_result` and
`accepted_for`.

That is the package's declared policy for a silent corpus, and the gap is visible rather
than filled with plausible text, which I take to be correct. But RC-01's closure should be
read as **the route now exists and is attributable**, not as **the refund of an undelivered
sale is now evidenced**. Nothing in this recheck contradicts that; it is a scope statement,
not a finding.

---

## Probe 9 (added by this recheck) — the pin is containment, not demand. IT LEAKS.

This probe is not in the brief. I added it after reading the matching semantics at
`validate_contracts.py:645-685`, and **it is the headline of this recheck.**

`polarised_nodes` collects every `op` node anywhere in a body and records one contextual
fact about each: whether it sits beneath a `not`. `pin_row_matches` then asks whether SOME
node carries the pinned op with the pinned values. Polarity is handled. **Disjunction is
not.** A node inside an `any` is "contained" by the body exactly as a node in the top-level
`all` is, so a pin cannot tell *the guard demands this* from *the guard mentions this in one
branch of an or*.

**Mutation.** Same file, same entry, same one hunk. Each of the three pinned conjuncts is
kept verbatim and disjoined with a trivially-true alternative:

```
-        [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
-                  "/payload/acceptance_evidence", "/payload/agreed_terms"]),
-         ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
-                  ("/payload/obligation_refs", ["discharged", "transferred"], False)]),
-         ("nc", "delivered"), AF, AR],
-        hard=["nfp", "rpp", "nc"]),
+        [("either", [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
+                              "/payload/acceptance_evidence", "/payload/agreed_terms"]),
+                     ("prF", "/payload/agreed_terms")]),
+         ("either", [("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
+                              ("/payload/obligation_refs", ["discharged", "transferred"], False)]),
+                     ("prF", "/payload/agreed_terms")]),
+         ("either", [("nc", "delivered"),
+                     ("prF", "/payload/agreed_terms")]),
+         AF, AR],
+        hard=["either"]),
```

`agreed_terms` is in `records.schema.json#/$defs/SalesAgreement`'s `payload.required`
list, so `present(/payload/agreed_terms)` holds for **every schema-valid SalesAgreement**.
Each disjunction is therefore satisfied unconditionally and the criterion demands nothing
about delivery. The `requires` prose was left exactly as it is.

**Commands and result.**

```
python3 tools/author_phase_content.py .     # REGEN_EXIT=0
python3 validate_contracts.py               # VALIDATE_EXIT=0, 625 seconds
{ "status": "passed", "checks": 269592, ..., "negative_fixtures_rejected": 31 }
```

**Exit 0. 269,592 checks. 31 of 31 negative fixtures still rejecting.** Nothing objected:
not the drift oracle (the tree was regenerated), not the distinctness ratchet, not the
residual-collision check, not RC-03, not the pins, not the fixture suite.

The regenerated body, from `predicate-registry.json` in that tree:

```
{"op":"all","predicates":[
  {"op":"any","predicates":[ {"op":"nonempty_fields", "field_paths":[
        "/payload/fulfillment_ref","/payload/obligation_refs",
        "/payload/acceptance_evidence","/payload/agreed_terms"]},
      {"op":"present","value":{"op":"path", ... "pointer":"/payload/agreed_terms"}} ]},
  {"op":"any","predicates":[ {"op":"related_phases","bindings":[
        {"field_path":"/payload/fulfillment_ref","states":["delivered"],"optional":false},
        {"field_path":"/payload/obligation_refs","states":["discharged","transferred"],
         "optional":false}]},
      {"op":"present", ... "pointer":"/payload/agreed_terms"} ]},
  {"op":"any","predicates":[ {"op":"native_correlated","result":"delivered"},
      {"op":"present", ... "pointer":"/payload/agreed_terms"} ]},
  {"op":"accepted_for", ...}, {"op":"attested_result", ...} ]}
```

Every pinned row still matches. The criterion requires none of it.

**What is actually reintroduced, stated precisely.** Under this tree
`criterion.SalesAgreement.performed.v1` no longer requires the agreement to NAME its
Fulfillment, no longer requires that Fulfillment to be `delivered`, and no longer requires
any Obligation to be `discharged` or `transferred`. That is the record-linkage half and the
whole obligations half of AD-013 — most of G2-01.

**What still holds, and it is not the pin that holds it.** The three `*->performed` edge
guards carry `native_correlated(result: "delivered")` unconditionally, so a sale still
cannot reach `performed` without an observation correlating a delivery. That conjunct
survives because **RC-06's repair put the same requirement at the guard layer**, where this
mutation did not reach. Defence in depth worked; the control that was supposed to work did
not.

**This is not a hypothetical shape.** Eleven of 842 criteria already contain an `any` node,
and **four of the 44 live `require` rows are, today, satisfied only by a node inside a
disjunction**:

| pinned predicate | row op |
|---|---|
| `edge.GrievanceCase.received.triaged.v1` | `path` |
| `edge.GrievanceCase.received.triaged.v1` | `neq` |
| `edge.ResponsibilityAssignment.proposed.accepted.v1` | `eq` |
| `edge.ResponsibilityAssignment.proposed.accepted.v1` | `neq` |

In both of those the disjunction is the **intended** semantics — G4-01's comparison is
required only where `disputed_custodian` is true, G4-04's enum comparison only where a
contesting mandate exists — so the fix is not "refuse a match under `any`". It is to make
each row say which it means.

**Disposition: RC-02 OPEN (class a).** The specific attack in the brief is closed; the
mechanism it was closed with is bypassable by a sibling of the same one-hunk edit, at exit
0, with every control in the package green. Recorded as **RC2-02** below.

---

## Probe 2 — positive control for the pin

The brief anticipated the floor. Both floors bind exactly at the committed value:
`len(pins) >= 25` with **25** pins, and `sum(len(require)) >= 44` with **44** rows. So
deleting the one pin trips the floor rather than the pin, and so does deleting its three
rows. The control was therefore run **the second way the brief describes**: the pin entry
for `criterion.SalesAgreement.performed.v1` is kept, with its three `require` rows replaced
by three rows that the weakened body satisfies trivially —
`nonempty_fields{field_paths_include:[/payload/agreed_terms]}`, `accepted_for`, and
`attested_result`. Counts held at **25 pins / 44 rows**. The derivation weakening is probe
1's, unchanged, and the `requires` prose is unchanged.

```
python3 tools/author_phase_content.py .     # REGEN_EXIT=0
python3 validate_contracts.py               # VALIDATE_EXIT=1, 19 seconds
```

**Observed failure**, verbatim:

```
AssertionError: ("RC-03: `requires` names a related record's phase that no conjunct binds",
'criterion.SalesAgreement.performed.v1', 'delivered', 'bind it in `related_phases`, or
waive it by name in pinned-conjuncts.json#/requires_waivers')
```

**The pin is not the only control. RC-03 is a real second one**, and it catches this attack
independently, at `validate_contracts.py:863`, naming the same criterion and the exact token
whose promise the body dropped. That is a materially better answer than "the pin, or
nothing."

The floor behaviour is worth one line of its own: with the pin **deleted** the failure would
be the floor message (`the pinned table has shrunk; a pin table with no pins passes
vacuously`), which names the table rather than the requirement. That is the correct design —
a shrinking table should read as a decision — but it means the floors cannot distinguish 25
real pins from 25 pins of which one is inert. Probe 9 is the consequence.

### Probe 2b — the same control with RC-03 also switched off

To isolate what the pin alone carries, the vacuous-pin tree was re-run with the `requires`
sentence rewritten so it no longer promises delivery — which is what an author weakening the
requirement would write anyway. Pin counts still 25 / 44.

```
python3 validate_contracts.py               # VALIDATE_EXIT=1, 651 seconds
AssertionError: ('a negative fixture was not rejected; the check it names is gone', ...
  "leaked": ["r13-derivation-weakened-then-regenerated"] ... )
```

**Nothing in the main validator objected to the live registry.** The pins passed (vacuous),
RC-03 passed (nothing left to promise), the oracles passed, the ratchet passed. The build
failed at the very last stage, and for a different reason: the **fixture suite noticed its
own RC-02 control had stopped working.** Inside the fixture's scratch tree the attack was
refused by RC-03 rather than by the pin, and the runner treats "rejected for the wrong
reason" as a leak — exactly as `fixture.json`'s note says it should.

That is a good result and worth saying clearly: **the third control is the fixture's
`expect_failure_contains`**, and it fired when the first two were removed. Two of the three
had to be defeated before the tree went quiet, and defeating them takes edits to
`pinned-conjuncts.json` and to the prose that a reviewer reads as such.

**Contrast this with probe 9.** Probe 9 needed none of it — one hunk in the derivation, the
pin file untouched, the fixtures untouched, the prose untouched, **exit 0**.

### Probe 2 — the two remaining controls, measured

| tree | mutation | exit | what fired |
|---|---|---|---|
| p2a | probe 1's weakening + the pin **deleted** | 1, 20 s | the floor: `('the pinned table has shrunk; a pin table with no pins passes vacuously', {'pins': 24, 'floor': 25, 'pinned_transitions': 6, 'transition_floor': 6})` |
| p1b | probe 1's weakening + the **prose** weakened, pin intact | 1, 20 s | the pin: `PINNED CONJUNCT MISSING … criterion.SalesAgreement.performed.v1 … nonempty_fields` |

p1b settles one thing the brief did not ask but which matters for reading probe 2: **the pin
is independent of the prose.** Rewriting `requires` does not help an attacker while the pin
is intact.

### Probe 7 result — the mutation

**Mutation.** One sentence added to the `("Fulfillment", "failed")` entry's `requires`
prose in the derivation, promising a field no conjunct reads, then regenerated so the drift
oracle is satisfied:

```
+        "required exactly that correlation. The settled charge behind "
+        "`/payload/payment_operation` is recorded and reconciled against the failure.",
```

```
python3 tools/author_phase_content.py .     # REGEN_EXIT=0
python3 validate_contracts.py               # VALIDATE_EXIT=1, 20 seconds
AssertionError: ('RC-03: `requires` names a field path no conjunct demands',
'criterion.Fulfillment.failed.v1', '/payload/payment_operation',
['/payload/performer_assignment', '/payload/receipts', '/payload/remaining_duties',
'/payload/service_window'])
```

**Refused, naming the criterion, the promised path, and every path the body does demand.**
The rule is correct where it applies. Its limit is applicability, not correctness, and the
numbers are in the coverage table above.

**Disposition: RC-03 CLOSED at specification level, with a stated limit.** A check exists,
it compares the two fields, it refuses an over-promise, and the waivers are narrow and
individually justified. What it does not do is compare English nouns to conjuncts, which is
most of what these sentences are made of — see **RC2-03**.

### Probe 3 results — the two validator runs

| tree | mutation | exit | observed |
|---|---|---|---|
| p3 | fixture directory deleted, `MANIFEST.json` untouched | **1**, 19 s | `AssertionError: ('a negative fixture was not rejected; the check it names is gone', '{ "check": "negative fixture count ratchet (RC-04)", "declared": 31, "present": 30, "declared_but_absent": ["r13-derivation-weakened-then-regenerated"], "present_but_undeclared": [] }')` |
| p3b | fixture **and** its manifest line deleted | **0**, 607 s | `{"status":"passed","checks":269559, … "negative_fixtures_rejected":30}` |

**The design holds as designed.** A deletion that is not declared is refused by name. A
deletion that is declared passes, and the only trace is a diff line in `MANIFEST.json` plus
the verdict's own `negative_fixtures_rejected` dropping from 31 to 30. That is the stated
bargain and I think it is the right one; a machine cannot tell a removed fixture from a
retired one.

Two observations, both small:

- **The `checks` figure is not a coverage signal for fixtures.** p3b reports the identical
  269,559 checks as the baseline while running one fewer fixture. Only
  `negative_fixtures_rejected` moves. A reviewer comparing verdicts should compare that
  field, not the check count.
- **p3's headline message is the wrong one.** A count mismatch surfaces under *"a negative
  fixture was not rejected; the check it names is gone"*, because the runner exits 1 and the
  generic wrapper at line 891 fires before the dedicated count comparison at line 903 is
  ever reached. The correct detail is attached, so nothing is lost, but the first line a
  reader sees names the wrong failure. **RC2-04.**

**Disposition: RC-04 CLOSED at specification level**, with **RC2-01** (probe 8 addendum)
open against the denominator's location.

---

## Probe 10 (added by this recheck) — RC-03 switched off by three pairs of backticks

Probe 2 showed RC-03 catching the RC-02 attack via the token `delivered`. This probe asks
what that catch depends on.

**Mutation.** Probe 1's weakening, the pin made vacuous (25 pins / 44 rows preserved), and
the `requires` sentence changed **only** by removing three pairs of backticks. The sentence
still promises delivery to a human reader:

```
-        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
-        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
+        "record, that Fulfillment is currently delivered, and every linked Obligation "
+        "is discharged or transferred. The correlated native object is the DELIVERY, "
```

```
python3 validate_contracts.py               # VALIDATE_EXIT=1, 662 seconds
```

**RC-03 did not fire on the live tree.** The run went all the way through the pins, the
oracles, the ratchet and RC-03 into the fixture suite — 662 seconds versus the 19 seconds at
which probe 2 stopped. It failed at the last stage, with the fixture transcript showing the
RC-03 message raised **inside the fixture's scratch tree**, where `weakened-spec.py` restores
the backticked sentence:

```
AssertionError: ('a negative fixture was not rejected; the check it names is gone',
  … AssertionError: ("RC-03: `requires` names a related record's phase that no conjunct
  binds", 'criterion.SalesAgreement.performed.v1', 'delivered', …)
  … "leaked": ["r13-derivation-weakened-then-regenerated"] )
```

So the same sentence, with and without backticks, over the same weakened body: **checked in
one tree, invisible in the other.** `PROSE_TOKEN = r"`([a-z][a-z_\-]*)`"` requires the
backticks, and a criterion's `requires` prose is written by the same author as its conjuncts.

The build still failed — again only because the fixture suite noticed its RC-02 control had
degraded. **RC2-03.**

---

## Dispositions

| finding | class in brief | disposition |
|---|---|---|
| RC-01 in-flight delivery failure | a | **CLOSED at specification level.** Edge, criterion consistency and both refund routes verified and pinned. Scope note: the refund criterion is a declared content gap. |
| RC-02 criterion-content oracle pinned to an author-controlled file | a | **OPEN (class a).** The brief's exact attack is refused by name in 18 s. A sibling of the same one-hunk edit passes at exit 0 — see RC2-02. |
| RC-03 `requires` never compared to conjuncts | b | **CLOSED at specification level, with a stated limit.** The check exists, refuses a real over-promise, and its 17 waivers are narrow. Its live applicability is small and it is switchable by formatting — RC2-03. |
| RC-04 no fixture count ratchet | b | **CLOSED at specification level.** Both directions refuse by name, in the runner and in the validator. The denominator's location is RC2-01. |
| RC-05 `ROOT.resolve()` through a symlinked `tools/` | b | **CLOSED at specification level.** Both symlink forms refuse. `fixtures/` is outside the guard — RC2-01. |
| RC-06 three `*->performed` edges | b | **CLOSED at specification level.** All three carry `transition_basis` and `native_correlated(result: "delivered")`, all pinned. |
| RC-07 `terminated_with_residuals` in no chapter | b | **CLOSED at specification level.** Prose row at `03-company-capabilities.md:199`. |
| RC-08 `validated` branch disjoint | b | **CLOSED at specification level.** `Fulfillment:validated->delivering` exists and is pinned. |

---

## New findings

### RC2-02 — a pinned conjunct is satisfied from inside a disjunction, so a pin can be emptied without being removed · class (a)

**Where.** `validate_contracts.py:645-663` (`polarised_nodes`), `671-685`
(`pin_row_matches`), `735-744` (the containment assertion).

**Issue.** The pin machinery tracks one contextual fact about a matching node — whether it
sits beneath a `not` — and no other. A node inside an `any` satisfies a pin exactly as a
node in the top-level `all` does. So a pin asserts *the body mentions this*, while every
`why` string in `pinned-conjuncts.json` is written as *the body demands this*.

**Measured.** Probe 9: one hunk in `tools/phase_content.py` disjoins each of the three
pinned conjuncts of `criterion.SalesAgreement.performed.v1` with
`present(/payload/agreed_terms)`, a field the record's schema already requires.
`author_phase_content.py` regenerates; `validate_contracts.py` exits **0** with **269,592
checks** and **31 of 31** negative fixtures still rejecting. The criterion no longer requires
the agreement to name its Fulfillment, that Fulfillment to be `delivered`, or any Obligation
to be `discharged`/`transferred`. `pinned-conjuncts.json` is untouched, the fixtures are
untouched, the prose is untouched.

**Not hypothetical.** 11 of 842 criteria already carry an `any`, and **4 of the 44 live
`require` rows are today satisfied only by a node inside one** — two on
`edge.GrievanceCase.received.triaged.v1`, two on
`edge.ResponsibilityAssignment.proposed.accepted.v1`. In both of those the disjunction is the
intended semantics, so a blanket refusal is the wrong fix.

**Required contract.** Make each `require` row state whether the conjunct must be demanded
**unconditionally** or may sit under a disjunction, defaulting to unconditional, in the same
shape and for the same reason as the existing `negated` key — *"Polarity is the half a
containment check forgets"* applies verbatim one operator over. Track the `any` ancestry in
`polarised_nodes` alongside the `not` ancestry, refuse a match under `any` unless the row
opts in, and give the four rows above an opt-in with its reason. Ship a negative fixture
carrying probe 9's hunk, expecting a message that names disjunction — the existing r13
fixture cannot catch this, because it removes the conjuncts rather than weakening them.

**Same blind spot, second site.** RC-03's `stated_paths_and_states` (lines 822-833) also
walks the whole body and collects paths and states without regard to disjunction, which is
why RC-03 was silent in probe 9 too. Whatever fixes one should be applied to both, or the
second should say in writing that it is containment-only by choice.

### RC2-01 — the fixture denominator lives inside the directory it measures · class (b)

**Where.** `tools/run_negative_fixtures.py:48-59` (the symlink guard covers `_TOOLS` and
`_TOOLS.parent`, and `MANIFEST = FIXTURES / "MANIFEST.json"`), and
`validate_contracts.py:901-902`, which reads the same path.

**Issue.** RC-05's guard asserts `tools/` and the contracts directory are not symlinks. It
says nothing about `fixtures/negative`, and `MANIFEST.json` lives inside it. So the
denominator travels with the directory it is supposed to bound.

**Measured.** Probe 8 addendum: `fixtures/negative` symlinked to a directory holding one
fixture and a manifest declaring one. The runner does not refuse; it reports
`{"fixtures": 1, "declared": 1, "passed_as_required": 1, "leaked": []}` and **exits 0** —
one of thirty-one, which is RC-04's original reading. Pointed at the real fixture directory
of another tree it reports `discovered: 31, declared: 31` for a tree that holds none of its
own, which is the exact sentence in the runner's own refusal message.

**Required contract.** Extend the existing RC-05 guard to `FIXTURES` — assert
`fixtures/negative` is a real directory, not a symlink — in the same loop, so one guard
covers every path the runner derives a count from.

### RC2-03 — RC-03's phase rule is switched off by removing backticks · class (b)

**Where.** `validate_contracts.py:818-819`, the two prose regexes; effect measured across
the corpus and in probe 10.

**Issue.** The PHASES rule only sees backticked tokens, and both the sentence and the
conjuncts are written by one author in one file. Removing three pairs of backticks leaves a
sentence that reads identically to a human and is invisible to the check. Separately, the
PATHS rule — the half the RC-03 contract named — has an applicable population of **zero**:
of 774 criteria examined, **0** carry a field path in their `requires` prose.

**Measured.** Probe 10: identical weakening and identical prose except for the backticks;
the run went from stopping at RC-03 in 19 s to passing RC-03 and reaching the fixture stage
at 662 s. Corpus sweep: 0 of 774 with a prose field path; 19 of 774 with a related-record
phase token, 17 of those waived.

**Required contract.** State in `pinned-conjuncts.json#/requires_waivers_why` — where the
measurement already lives — that the rule's scope is backticked tokens and literal
`/payload/…` paths, and that its live population is 2 unwaived criteria. Then either widen
it (match the phase vocabulary unbackticked, with a waiver list for the false positives that
produces) or record the narrow scope as the accepted limit with its number. The present
text reads as though `requires` and the conjuncts are compared; what is compared is a
formatting-dependent subset of them.

### RC2-04 — a fixture count mismatch is reported under the wrong headline · class (c)

**Where.** `validate_contracts.py:891-893` versus `903-905`.

**Issue.** When the runner exits non-zero the generic wrapper fires first, so a manifest
count mismatch surfaces as *"a negative fixture was not rejected; the check it names is
gone"*. The dedicated comparison at line 903 is reachable only when the runner exits 0.
Probe 3 shows the correct ratchet JSON attached as detail, so nothing is lost — but the
first line a reader sees names a different failure, and this is the file that argues
elsewhere that a message should name the control actually doing the refusing.

**Required contract.** Branch on the runner's output before asserting: if the payload
carries `"check": "negative fixture count ratchet (RC-04)"`, raise the ratchet message.

---

## Not checked

- **Whether the register records these findings as closed.** The `status` fields of
  `registers/review-findings.json` were not read, per the brief. Every disposition above is
  "at specification level" — it says the artifact now states the thing, not that anyone has
  accepted it.
- **`planning/reviews/G-02-recheck-01.md`**, the review that states RC-01..RC-08. Not
  opened. The issue and required-contract text used here is the brief's quotation of it.
  The validator itself reads that file at check time to verify `finding_sources` citations;
  that is the tool reading it, not me.
- **Everything outside `planning/specification/contracts/`**, except
  `03-company-capabilities.md` for RC-07 and the sibling prose files the validator resolves
  citations against.
- **The nine primitives no predicate uses** (`acyclic`, `add`, `count`, `digest`, `forall`,
  `in`, `lte`, `scope_covers`, `subset`) and the **166 predicates unreachable from any
  guard**, both reported by the distinctness instrument on the baseline run. Outside the
  eight findings under recheck; noted once and not pursued.
- **Whether `validate_contracts.py` runs in CI.** Out of scope for this package review.
- **Any judgement about runtime behaviour.** This is a specification; the validator says so
  itself in its `limits` string, and nothing here was executed against a runtime because
  none exists.
- **A second model family.** See the provenance header.

---

## Reproduction

Every mutation is a single edit on a frozen copy. In each case:

```
S=<scratch>
cd $S/<tree>/docs/vision-system/planning/specification/contracts
python3 tools/author_phase_content.py .      # where the derivation was edited
python3 validate_contracts.py
```

| tree | mutation | exit | seconds |
|---|---|---|---|
| `subject` | none | 0 | 802 |
| `p1` | derivation weakened, prose and pin intact | 1 | 18 |
| `p9` | **each pinned conjunct disjoined with a trivially-true alternative** | **0** | 625 |
| `p2` | p1 + pin rows made vacuous (25/44 held) | 1 | 19 |
| `p2b` | p2 + prose rewritten | 1 | 651 |
| `p2a` | p1 + pin deleted | 1 | 20 |
| `p1b` | p1 + prose rewritten, pin intact | 1 | 20 |
| `p7` | one over-promising sentence added to `Fulfillment.failed` | 1 | 20 |
| `p3` | one fixture deleted, manifest untouched | 1 | 19 |
| `p3b` | that fixture and its manifest line deleted | 0 | 607 |
| `p10` | p2 + three pairs of backticks removed from the prose | 1 | 662 |
| `p8` / `p8c` | `tools/` symlinked · contracts dir symlinked · `fixtures/negative` symlinked | 1 / 1 / **0** | <1 |

---

## Reading order

This file was appended to as each probe finished, per the brief, so sections sit in the
order they completed rather than in the brief's numbering. To read it in the brief's order:

probe 1 (line 228) · probe 2 (495, with 2b at 531 and the table at 558) · probe 3 (329,
results at 598) · probe 4 (190) · probe 5 (105, addendum at 367) · probe 6 (151) ·
probe 7 (281, result at 569) · probe 8 (29, addendum at 75) · probe 9 in the brief's
sense, RC-07 and RC-08 (168).

Two probes were added by this recheck and are not in the brief: the disjunction attack
(389) and the backtick probe (628). The first is the finding that matters.
