---
role: builder
task: b1-07-tests
date: 2026-10-02
branch: build/b1-07-tests
qa_verdict: PENDING
tier: irreversible
---
# B1-07 codex WorkerAdapter done-tests (frozen, red)
- 16 Go done-tests (`codex_donetest_test.go`, tag donetest) and 12 fixtures under `testdata/codex/`, hashed in `build/done-tests/B1-07.yml`. Stub `codex.go` and `ErrUndecided`. `LaunchSpec` gains `CodexProfile` and `ResultPath`.
- Red 16 of 16 on the stub. A throwaway reference passes the package (-race -count=3). Mutants: 44 of 45 killed, and the 1 survivor is equivalent.
- codex-cli 0.154.0 is installed. Flags come from `codex exec --help`; event names come from the binary strings and recorded runs. No model turn was run.
- OPEN 1-9 are in the register: lease, funded team, harness check, approval mode, -p, -o, rate limits, budget, pty.
- `node build/check-done-tests.mjs` exits 0. `npm run check:citations-exist` exits 0.
