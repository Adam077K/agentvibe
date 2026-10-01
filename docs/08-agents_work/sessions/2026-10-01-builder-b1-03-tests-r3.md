---
role: builder
task: b1-03-tests-r3
branch: build/b1-03-tests-r3
tier: lite
qa_verdict: PASS
---
Base b3ffff3. Added kernel/internal/socket/socket_r3_donetest_test.go (4 tests) and registered it in build/done-tests/B1-03.yml with the dated r3 re-freeze reason. Rounds 1-2 and the fixture are unchanged; no implementation code was touched.
Mutants R3-M1 to M4 (M4 in two variants, wrong reason and wrong digest) were applied in /tmp/claude-501 copies only. All were killed, and M1, M2, M3 and M4a stayed green on every other done-test.
Against b3ffff3: every done-test passes except KernelOwnedSidecarNarrowedRatify (a 0o066 Kernel-owned Journal or sidecar is refused with EACCES).
RATIFY: 0o066 narrowing (files.go O_RDONLY open vs socket.go "narrowed, not refused"). Recorded and untested: files.go removes the socket path without an ownership check; the ~1-2 GiB buffering bound.
`git fetch` got a proxy 502; the local origin/build/b1-03 ref was already at b3ffff3.
Verified: go test -tags donetest (sandboxed, 71s); node build/check-done-tests.mjs.
