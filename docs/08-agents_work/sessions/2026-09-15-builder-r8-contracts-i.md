---
engine: builder
lane: r8-contracts-i
date: 2026-09-15
qa_verdict: PASS
tier: trivial
---

Item 1 (F6B-03 / R45) landed: `AcceptanceInterval.payload.checker_id` required in both declarations, a third
conjunct on `guard.calibration.current_for_checker` equating it to the checker_id of the calibration it names,
pinned, with a structural check in `validate_contracts.py` refusing by name.
Light validator: `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` exit 0 — checks 305,513 · negative
declared 121 (floor 121) · positive declared 82 (floor 82).
Fixtures executed singly: adverse rejected as required, benign accepted as required.
Item 2 (F6D-05 / F6Y-04 / R46) NOT STARTED — turn budget; nothing half-done in the tree.
Author-recorded, one model family, no runtime exists.
