---
date: 2026-10-02
engine: builder
task: b1-12-tests-r2
branch: build/b1-12-tests-r2
base: 78d5ac2
qa_verdict: PENDING
tier: full
---
Added `kernel/internal/outbox/outbox_r2_donetest_test.go` (4 tests, 9 subtests, canon cited per test: 09a §7.1, §7.2, §7 diagram, outbox.go contract) and registered it in `build/done-tests/B0-17b.yml`; round-1 file unchanged. No implementation code touched.
Mutant proof, store.go mutated in `/tmp/claude-501/b112mut` copies only, round-1 tests green on every one: F1 (78d5ac2 itself, late Receipt refused after Absent) -> LateReceiptAfterAbsentIsOneEffect; M2a Confirmed re-sent -> ConfirmedIsNeverDispatchedAgain; M2b lookup error -> Failed -> LookupErrorIsNotProofOfAbsence; M2c keyStream drops Target -> TargetIsPartOfTheBusinessKey. Control: Failed added to legalFrom[Confirmed] -> 10/10 green.
Against 78d5ac2: LateReceiptAfterAbsentIsOneEffect FAILS (2 effects, state failed), by design; the other three pass. `-race -count=3`: no races. `node build/check-done-tests.mjs` exit 0 (20 hashes).
Not asserted, a design decision for the dispatcher: a re-Dispatch that runs before the late Receipt lands needs fencing of the in-flight attempt.
Refusals: `git fetch` 403 (sandbox proxy; used local origin/build/b1-12 = 78d5ac2). Edit/Write into the worktree refused by pre-tool-use.sh (root is ceo-4); used scratchpad + cp as the brief prescribes. A go command with `$TMPDIR` was refused by the worktree guard; re-run with the literal path.
