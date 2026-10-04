---
date: 2026-10-03
role: builder
task: b1-08-tests-r6
branch: build/b1-08-tests-r6
qa_verdict: PENDING
tier: irreversible
---
B1-08 r6 done-tests are on `build/b1-08-tests-r6`, branched from f9f54d6 and merged with b2d33a4 (B1-07 r5). The reason is "2026-10-03 re-freeze r6 after review", and the register is `build/done-tests/B0-17b.yml`.
New file: `kernel/internal/launcher/launcher_r6_donetest_test.go`. The authoritative Consume, the pinned State, the pinned-genesis receipt log with a founder reset, job-scoped paths, and the review survivors are pinned. So is the B1-07 r5 env allowlist.
The B1-07 r5 sync is done: the launcher codex line carries the 103 feature pins, AV_JOB is dropped, and 09a §8.2 is updated.
The journal import is allowed (internal package), but the pinned-genesis log was chosen.
On f9f54d6 plus the stubs, 7 tests fail. 23 mutants are killed and 1 is equivalent (the final newline at receiptlog.go:108).
`launcher_test.go` (the implementer's) needs a Consume on okLease and the new receipt-log signatures before it compiles.
