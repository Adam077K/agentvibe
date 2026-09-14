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
