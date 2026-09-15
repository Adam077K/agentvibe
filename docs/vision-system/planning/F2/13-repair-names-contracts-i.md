# F2 · r8-contracts-i — the names contract

**What this file is.** Every name lane `r8-contracts-i` registered, and every briefed item it did **not**
land, with the reason and the cure named. A name not in this file was not registered by this lane.

**Standing caveat, and it governs every row.** Author-recorded, one model family, awaiting independent
recheck. **No runtime of any kind exists.** Every check below is specified behaviour checked offline by
`validate_contracts.py` against the committed registries.

**Base:** `259a26b` · **Branch:** `docs/vision-r8-contracts-i`

**The light validator was GREEN at the base commit** — checks 305,359 · negative declared 120 · positive
declared 81, exit 0 (lane H final, plus item 3 / R44).

---

## Names registered

| name | kind | item / finding |
|---|---|---|
| `checker_id` on `AcceptanceInterval.payload` | `record-registry.json` (`fields`, `required: true`, with `added_by` + note) + `records.schema.json` (`$ref` string, in `required`) | item 1 (F6B-03) |
| the third conjunct of `guard.calibration.current_for_checker` | `predicate-registry.json` — `eq(path(resolve(subject), /payload/checker_id), path(resolve(path(resolve(subject), /payload/calibration_ref)), /payload/checker_id))` | item 1 |
| `/payload/checker_id` added to that guard`s `nonempty_fields` conjunct | `predicate-registry.json` | item 1 |
| two new `require` rows on the existing pin (the `nonempty_fields` row extended, an `eq` row added) | `pinned-conjuncts.json#/pins` | item 1 |
| `CHECKER_IDENTITY_GUARD` · `CHECKER_ID` · `CALIBRATION_REF` · `_subject_field` · `CHECKER_IDENTITY_CONJUNCT` | validator names | item 1 |
| `A VERDICT MAY BE ACCEPTED ON A CALIBRATION BOUND TO ANOTHER CHECKER` | check | item 1 |
| `AN ACCEPTANCE MAY NAME NO CHECKER AT ALL` | check | item 1 |
| `THE ACCEPTANCE CHECKER IDENTITY IS OPTIONAL` | check ×2, one per declaration | item 1 |
| `R45` · `r45-a-calibration-bound-to-another-checker-satisfies-the-gate` + `r45-the-calibration-guard-conjuncts-reordered-benign` | fixture pair | item 1 |

**Constants moved, each comment stating the value its constant holds.**
`NEGATIVE_FIXTURE_FLOOR` 120 → 121 (R45), committed 121 · `POSITIVE_FIXTURE_FLOOR` 81 → 82 (R45),
committed 82. No ceiling moved; no floor took headroom. No new floor constant was needed: the control is
a structural comparison against one literal conjunct, not a table with a count.

**Light validator after the commit:** `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` → exit 0,
**checks 305,513 · negative declared 121 (floor 121) · positive declared 82 (floor 82)**.

**Fixtures executed, singly, by this lane** — through `run_negative_fixtures.run_fixture` /
`run_positive_fixtures.run_fixture` on its own discovered document, the same `execute_fixture` the suite
uses. The full suites are the orchestrator run on the merged head.

| fixture | verdict |
|---|---|
| `r45-a-calibration-bound-to-another-checker-satisfies-the-gate` | **rejected as required** |
| `r45-the-calibration-guard-conjuncts-reordered-benign` | **accepted as required** |

---

## Item 1 — F6B-03 · LANDED

`calibration_ref` bound an acceptance to **A** calibration standing at `run`. Nothing bound it to the
calibration **of the instrument that produced the verdict**, so the current calibration of any checker
satisfied the gate, and `r18-acceptance-on-an-uncalibrated-checker` does not reach that — it is about a
calibration being ABSENT, not about it belonging to someone else. `InstrumentCalibration.checker_id` was
already required; the acceptance end of the join did not exist, so there was nothing to compare it to.

**The comparison is read STRUCTURALLY, operand by operand.** F6Y-02 is why: a check that asks whether two
pointers occur in a serialised body passes on a body whose sides were swapped or repointed. The pin row
beside it can say no more than that, **and says so about itself** — which is what makes the pair honest
rather than decorative. R45 is that counterexample made concrete: it leaves both pointers in place,
repoints the right operand at the subject, satisfies the pin, and is refused by the structural check alone.

**Two new structural facts, stated rather than assumed.** (i) The equality is a **nested `resolve`** —
`resolve(path(resolve(subject), /payload/calibration_ref))` — and **no predicate in the registry had one
before this commit** (0 of 2,398; 64 bodies compose `resolve` with `path`, none nests). It validates: the
`ref` position of `resolve` is a `value` position in `primitive-registry.json`, and the conjunct walk
classified it without refusal (`refused: 0`). (ii) `checker_id` is registered in `fields` only, not in
`type_fields`/`required_fields` — the shape `calibration_ref` itself already has on this record, and the
F6A-07 union rule is what makes that legal.

**What this does NOT close, stated rather than left.** The equality is between the interval and the
calibration; **nothing yet ties either to the checker that actually emitted the verdict record**, because no
verdict record names its checker. That is the third leg of the join and it needs a record shape, not a
conjunct. And `checker_id` is a free `string` on both records: there is no `CheckerId` vocabulary, so the
two sides can be equal and both meaningless. Registering one is the same owed step lane H recorded for
`capability_refs`, and for the same reason it was not taken here: a value type reaches the inventory
derivation and the source-field mappings.

---

## NOT LANDED — item 2, with the reason and the cure named

- **Item 2 — F6D-05 / F6Y-04, a predicate reading `producer_unauthorable_fields` through `FieldAuthority`.
  NOT STARTED.** Turn budget, not a blocker; `R46` is free and nothing is half-done in the tree. The shape
  is settled by lane H and by F6Y-04: `FieldAuthority` carries `field_path`, `authority_assignment_ref`,
  `declaring_component_id` and `epoch`, its `(field_path, epoch)` natural key has a resolve-or-create path
  as of R42, twelve predicates mention it and none binds it to any of the five control fields. The guard
  admitting a write to a control field must resolve the writer IdentityBinding and refuse when the writer
  component is the producing `owner_component` of the record; pinned with admissible ancestors; adverse
  R46 = S1-C03 writing `grant_stripping_probe_result` on `SkillVersion` and the guard admitting it.

## Chapter sentences owed by this lane

**One.** `06` §7 states the calibration rule as a property of the instrument; it does not say that an
acceptance names the checker whose verdict it accepts. The field `checker_id` on `AcceptanceInterval` is
the contract half of a sentence the chapter has not written. Either `06` §7 states it, or the field is
recorded as a contracts-lane strengthening beyond the chapter.

The chapter sentences owed by lanes E, F and H are unchanged and are not restated here.

## Decisions returned to the orchestrator

1. **Whether `checker_id` gets a `CheckerId` vocabulary** — the same decision lane H returned for
   `capability_refs`, now asked of a second field. Two free strings compared for equality is a join that
   cannot be wrong and cannot be checked.
2. **Whether the verdict record end of the join is in scope for a contracts lane at all**, given it needs a
   record shape that does not exist.

