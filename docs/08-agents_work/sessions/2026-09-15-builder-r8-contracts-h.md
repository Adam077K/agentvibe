---
date: 2026-09-15
engine: builder
lane: r8-contracts-h
branch: docs/vision-r8-contracts-h
base: f560f8d
qa_verdict: PASS
tier: full
---

Contracts repair lane h. Landed items 1 (F6V-02, natural-key create paths resolve-or-create) and 2
(F6W-01, `capability_refs` registered on `StandingHolder`, required and non-empty), one commit each.
Light validator green after every commit: `CONTRACTS_FIXTURE_RUN=1 python3 validate_contracts.py` exit 0,
checks 305,359 · negative declared 119 (floor 119) · positive declared 80 (floor 80).
Fixture pairs R42 and R43 executed singly via `run_fixture`: both adverse rejected as required, both benign
accepted as required. No other fixture run.
Items 3 (F6C-11), 4 (F6B-03), 5 (F6D-05/F6Y-04) NOT STARTED — turn budget, no blocker; R44-R46 free.
Names contract: `docs/vision-system/planning/F2/12-repair-names-contracts-h.md`.
Author-recorded, one model family, no runtime exists; independent recheck owed.
