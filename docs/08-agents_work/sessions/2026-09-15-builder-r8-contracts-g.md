---
role: builder
task: r8-contracts-g
date: 2026-09-15
qa_verdict: PASS
tier: full
---
- Lane `r8-contracts-g`, branch `docs/vision-r8-contracts-g`, base `caceb7c`. Items 1, 6 and 9 of nine.
- Base was RED: `caceb7c` narrated `F6A-09`/`F6C-06` in a register `status` string, the raw-text sweep read prose as registration. Fixed by teaching the register-coverage check its own third arm, `answered_elsewhere`.
- Item 1 (F6Y-02): the `(reason_kind, reason_unit)` pairing is compared as a SET OF PAIRS walked from the criterion AST, plus a branch-count check so an empty walk cannot pass. Fixture pair R40, both halves `tools_patch` + regenerate.
- Item 6 (F6Y-03): `CapacityObservation.payload.measure` typed `CapacityMeasure` in both declarations, with a check reading each against the vocabulary. Fixture pair R41.
- Item 9 (F6Y-06 check half): decision packet written, no code, as briefed.
- Light validator green after every commit: exit 0, checks 305,309, negative 117/117, positive 78/78.
- Four fixtures executed singly: R40 and R41, adverse rejected as required, benign accepted as required.
- NOT landed: items 2, 3, 4, 5, 7, 8. Item 2 has a structural blocker (no edge-predicate authoring tool exists); the rest stopped on turn budget.
- Author-recorded, one model family, no runtime. Names contract: `planning/F2/11-repair-names-contracts-g.md`.
