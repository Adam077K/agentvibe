---
date: 2026-10-02
engine: builder
task: b1-12-tests-r3
branch: build/b1-12-tests-r3
base: f38dc0d
qa_verdict: PENDING
tier: full
---
Added `kernel/internal/outbox/outbox_r3_donetest_test.go` (5 tests; canon 09a §7.2 visibility_lag_s, §7 diagram, X05 risk row) and registered it in `build/done-tests/B0-17b.yml`; rounds 1-2 unchanged. No implementation code touched.
On f38dc0d: T1 TimeoutBeforeLanding, T2 KilledBeforeLanding (real SIGKILL child), T3 HungCallReachesHuman FAIL by design; T4 OperationsDoNotBlockEachOther, T5 NoSecondSendWhileInFlight pass.
Mutants/controls in `/tmp/claude-501/b112mut-r3`: global lock killed by T4 (alone, on a both-controls base); lock removed killed by T5 on f38dc0d and by T3+T4 on a lag-guard base (there the lag window is an equivalent guard). Controls C-lag + C-hung turn all 18 package tests green.
OPEN: no canon number for visibility_lag_s nor who applies it (outbox.go Presence doc assigns it to the Provider; T1/T2 require the outbox); no canon number for the uncertain deadline (T3 uses store.go's UncertainDeadline).
Observed, not ours: with the lock removed, store_test.go TestRedispatchBeforeLateReceiptIsRefused hangs to the package timeout.
`node build/check-done-tests.mjs` exit 0.
