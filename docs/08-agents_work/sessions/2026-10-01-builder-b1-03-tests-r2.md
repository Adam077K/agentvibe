---
role: builder
task: b1-03-tests-r2
branch: build/b1-03-tests-r2
tier: lite
qa_verdict: PENDING
---
Added kernel/internal/socket/socket_r2_donetest_test.go (11 tests) and registered it in build/done-tests/B1-03.yml with a dated re-freeze reason. Round-1 file and fixture unchanged. No implementation code touched.
Mutants M1-M7 applied in /tmp/claude-501 copies only: all 7 killed (M1, M4 5/5 runs); round-1 tests stayed green on every mutant, confirming they survived before.
Against a395043: all 7 contract tests pass; the 4 *Ratify tests fail (oversize not journaled, 1088/1088 served, no deadlines, symlink victim narrowed to 0600).
RATIFY: oversize journaling (conflicts with server.go comment), 1024-connection bound, 30s stall bound, no symlink following.
Not done: Ratify tests not run against a fixed copy to prove they can be satisfied.
Refusals: hook blocked `chmod +x` (not retried); worktree-isolation guard refused compound git/go commands (split up). The first `git checkout -b` updated the index but not HEAD; `git switch` finished it.
Verified: go test -tags donetest (sandboxed, sockets under $TMPDIR); node build/check-done-tests.mjs.
