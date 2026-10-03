---
date: 2026-10-03
role: builder
task: b1-08-tests-r4
branch: build/b1-08-tests-r4
qa_verdict: PENDING
tier: irreversible
---
B1-08 r4 done-tests are on `build/b1-08-tests-r4`, branched from 75980d5. The reason is "2026-10-03 re-freeze r4 after review". The register is `build/done-tests/B0-17b.yml`.
The new file is `kernel/internal/launcher/launcher_r4_donetest_test.go`, with six tests covering items 1–6.
The contract in `launcher.go` changed by declarations and fail-closed stubs only.
r1 and r3 were edited only where the rulings contradict them, and the register records why.
On 75980d5 plus the stubs, 6 tests fail: R3_UnattendedIsHeadless and 5 of the r4 tests. R4_BudgetGuards only pins guards afed458 already has.
26 of 26 mutants are killed against a $TMPDIR reference that was never committed.
Codex is held for B1-07 r4, with a TODO in the register.
GAP: deleting state.json by hand reads as no history.
