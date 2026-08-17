---
role: builder
task: claim-unchecked-exit
date: 2026-08-17
qa_verdict: PASS
tier: irreversible
issues: [81]
---

- Issue #81: `command()` resolver had no way to distinguish "I could not check" from "the claim is broken" — any such exit code landed as `fail`, violating the Rule 10 corollary.
- Added opt-in `evidence.unchecked_exit: N` field to `claim-command`: that exit code maps to `unresolved` with stderr as the reason. Opt-in by design — reserving a code globally would silently reinterpret existing claims.
- Wired the fix to the one real case: `c-mission-control-cold-start` now declares `unchecked_exit: 2`, so a CI runner with no corpus or a machine under heavy load is recorded as unmeasured rather than broken.
- Three required tests constructed before believing the fix: (1) WITH field, exit 2 → `unresolved`; (2) WITHOUT field, exit 2 → `fail`; (3) `unresolved` ≠ `pass`. Schema validation adds four tests: valid case, non-integer, collision with explicit expect_exit, collision with default expect_exit:0.
- Baseline 80 pass · 8 would_block; after change 80 pass · 8 would_block — no shift. All 104 ledger tests and 55 claims tests pass. `npm run check:ledger` clean.
- Tier: irreversible (`scripts/lib/**` floor). CODEBASE-MAP rebuilt.
