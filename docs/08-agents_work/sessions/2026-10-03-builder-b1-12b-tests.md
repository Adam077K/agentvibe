---
date: 2026-10-03
role: builder
task: b1-12b-tests
branch: build/b1-12b-tests
qa_verdict: PENDING
tier: irreversible
---
B1-12b done-tests frozen: `kernel/internal/effector/effector_donetest_test.go`, registered in `build/done-tests/B1-12b.yml`; contract `kernel/internal/effector/effector.go` (unregistered stub).
14 tests: 13 red against the stub, and 1 import guard that passes on the stub by design. All 14 are green against a $TMPDIR reference implementation that was never committed. They run sandboxed, because the socket binds under $TMPDIR.
24 mutants applied in $TMPDIR copies, all killed; the register lists each one and its killer.
OPEN O1–O7 (venture source, no-lease, Target shape, TokenSet form, request id, mid-dispatch lease loss, effector sandbox rules) are recorded in the register for founder ruling.
Not covered: the gateway epoch (§15), and raw syscall sockets.
RE-FREEZE 2026-10-03, "2026-10-03 rulings B1-12b" (`docs/vision-v3/_process/DR-B1-12B-RULINGS-2026-10-03.md`). Q6 is changed: a lease lost mid-dispatch is uncertain. There are now 15 tests, 14 of them red on the stub, and 28 of 28 mutants are killed.
RE-FREEZE r2 2026-10-03, "2026-10-03 re-freeze r2 after review", on `build/b1-12b-tests-r2` from d75c5c5. It adds 7 tests (22 in all) and changes the contract: `DeployHost.Deploy` now takes the environment, and the deploy config gains a Projects allow-list. On d75c5c5 the package no longer compiles. With only a compile shim, just R2DeployTargetIsPinned fails. 20 mutants are killed, and the equivalent ones are listed in the register.
Round 1: `git fetch` was denied by the network sandbox, so the branch is from the local origin/main at 5f33c75.
A worktree-isolation guard refused two compound shell commands. Following its own instruction, I split them into plain commands and script files.
