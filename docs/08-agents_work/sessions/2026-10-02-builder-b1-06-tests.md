---
role: builder
task: b1-06-tests
branch: build/b1-06-tests
tier: lite
qa_verdict: PENDING
---
B1-06 done-tests frozen: kernel/internal/adapter/{adapter.go,claude.go} are the unregistered stub (WorkerAdapter, LaunchSpec, WorkerOutcome, Claude); claude_donetest_test.go plus 10 stream-json fixtures under testdata/claude/ are registered in build/done-tests/B1-06.yml.
Red: `go -C kernel test -count=1 -tags donetest -run B1_06 ./internal/adapter/` gives 8 of 8 FAIL. avk-boundary ok (6100/8000 lines). check-done-tests exit 0.
Reachable: a throwaway reference in $TMPDIR passes 8/8 under -race -count=3; 29 of 29 mutants killed (list in the register). Two survived round one and were fixed: an equivalent empty-expect mutant, and ModelID-from-assistant (test strengthened).
B1-08 fit: Template() equals the frozen launcher test's tokens; Argv(spec) equals its rendered argv. The adapter returns argv; only the launcher execs.
OPEN canon gaps (register header): tool-description wire field, WorkerOutcome undefined, LaunchSpec missing agents/record/session, profile→setting-sources, Agent/Task always-forbidden vs §8.4, harness-abort status, rate-limit signal, resume line.
`git fetch` got 403/502 from the proxy; branched from local origin/main = c8f6974.
