---
date: 2026-10-02
engine: builder
task: b1-12-tests-r5
branch: build/b1-12-tests-r5
base: 87059ac
qa_verdict: PENDING
tier: full
---
Added `kernel/internal/outbox/outbox_r5_donetest_test.go` (4 tests) and registered it in `build/done-tests/B0-17b.yml`; rounds 1-4 unchanged. Recorded founder ruling C (dead worker before 15m: one retry after Absent past the lag; a second death goes to Human) in `docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md`. No implementation code touched.
FAIL on 87059ac, by design: DeadWorkerRetriesOnce/second_death_on_the_re-send (3 sends).
Mutants in `/tmp/claude-501/b112mut-r5`, on a retry-once control that turns every package test green twice: answered-not-reset, gate-ignores-sent, and both 15m boundaries (> and 15m-1ns at 433 and 572) killed, each by one test. markSent `s.sent` (447) and fold sent guard (247): equivalent, unreachable from the API.
Race detector: 0 races on round 5. `node build/check-done-tests.mjs` exit 0; `npm run check:citations-exist` exit 0.
