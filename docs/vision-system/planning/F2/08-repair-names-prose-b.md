# Repair names produced by lane r7-prose-b, for the contracts lane to register

**Authored 2026-09-14 · `builder`, lane `f2-r7-prose-b` · branch `builder/f2-r7-prose-b`.**
This file exists because [the review-findings register](../../registers/review-findings.json) records
F6X-02's status as *"the enum members would have been invented rather than derived — needs the chapter to
state them first"*, and [`pinned-conjuncts.json`](../specification/contracts/pinned-conjuncts.json) repeats
it: *"a pin over an enum this package has not been given would be exactly that invention."* The chapter has
now stated them. **These are the exact strings.** The contracts lane registers these and invents none; a
member that is not on this list is a member the chapter did not state.

## F6X-02 · `ConstraintSet.payload.boundary_kind` — closed set, eight members

Stated as SPECIFICATION in
[`05-work-agents-skills.md`](../specification/05-work-agents-skills.md) §5. **The set is closed: a transfer
whose boundary kind is not a member is refused at the boundary, never defaulted.** Each member is derived
from a transfer that §5 or one of the six frozen fixtures names; none is invented.

| Member | Derived from |
|---|---|
| `delegation` | `Delegation`, parent-to-child assignment (§5); fixture 3 |
| `machine_handoff` | A transfer that moves accountability below the external-disclosure class, requiring an `AcceptanceInterval` (§5); fixture 2 |
| `consultation_return` | The model-to-model return on a declared procedure edge, crossing the loader (R-D13) — consultation leaves the parent accountable; §9 adverse case 15 |
| `continuation` | Result transfer on the canonical `Continuation` across a step, run or capacity boundary (§5, §6 stop rule); fixtures 3 and 5 |
| `acceptance_submission` | `AcceptanceInterval` `declared_done → in_acceptance` (§5); fixtures 1, 2, 6 |
| `founder_brief` | The founder-facing brief on `OperatorProjection` / `DecisionPacket` (R-X27, `04` DELTA 1) |
| `custody_transfer` | Accepted responsibility transfer to a successor or custodian — §9's removal export, §12's closure interlock; fixture 6 |
| `stage_import` | Validated import of a locally saved `StageRef`, revalidating current restrictions (§1); fixture 5 |

## F6X-02 · the contested-refs field

| Field | Record | Type | Required | Meaning of the empty case |
|---|---|---|---|---|
| `contested_refs` | `OperatorProjection.payload`, beside `omission_manifest_ref` | `Ref<Record>[]` | **yes** | An **empty array states that nothing was contested**; that is a different fact from an absent field, which is why it is required rather than optional |

It carries the second limb of `04` DELTA 1 — *"what was omitted **and what was contested**"* — whose first
limb `omission_manifest_ref` already carries.

## Noted, not repaired by this lane

- [`05-work-agents-skills.md`](../specification/05-work-agents-skills.md) §13 row 9 still reads that the two
  launch counts are *"compared by a conjunct on the run's `* → accepted` edge"*. F6V-01's brief named the
  `07` half only, and `02-architecture-selection.md` line 188 belongs to another lane. The guard carries no
  comparison operator, so the same wording question applies to that row.
- `HandoffAcceptance`, `WorkMessage`, `AttemptReport` and `ParticipationEncounter` still carry no
  `constraint_set_ref`. The recheck recorded this as outside F6B-02's contract; `machine_handoff` and
  `consultation_return` above are the boundary kinds those transfers would carry if it is ever brought in.
