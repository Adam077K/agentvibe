---
role: builder
task: b1-03-tests-r4
branch: build/b1-03-tests-r4
tier: lite
qa_verdict: PASS
---
Base ec1a2a0 (local only). Added kernel/internal/socket/socket_r4_donetest_test.go (3 tests, each kept only because it killed a mutant when run) and registered it with the dated r4 re-freeze reason. Rounds 1-3 unchanged; no implementation code touched.
Mutants were run in /tmp/claude-501 copies, and every pre-existing test let all four through. Killed: M1 (Fchmodat flags 0, 5/5 runs), M2 forced-false (UserlandGID -1 leaves the socket behind), M4 (0o644 intermediate, 5/5 runs).
Not killed: M2 forced-true (needs a race between link and remove; no deterministic hook) and M3 (equivalent: EPERM as non-root, branch unreachable as root).
All done-tests pass on ec1a2a0, the r4 tests 3 of 3 runs.
RATIFY: the files.go:117 low (an Lstat error treated as success) cannot be reached through Serve, because createJournal fails first. No test was added.
Verified: go test -tags donetest (sandboxed); node build/check-done-tests.mjs.
