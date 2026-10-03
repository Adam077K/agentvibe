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
- RE-FREEZE r2 (2026-10-02 founder rulings B1-07): DR-B1-07-CODEX-RULINGS-2026-10-02.md. 18 tests, all red on the stub; 55 of 56 mutants killed, including all 14 new ones. The 1 survivor is equivalent. Both checks exit 0.
- Follow-up: 09a §8.2 and the frozen B1-08 codexTokens still lack --ignore-user-config.
- RE-FREEZE r3 (2026-10-03, founder superseded ruling 4): no --ignore-user-config; --ignore-rules; profile with 17 required keys; -C, -o and CODEX_HOME bounds; review survivors pinned. 8 tests fail on 2592de6; 27 of 28 mutants killed (1 equivalent).
- RE-FREEZE r4 (2026-10-03 re-freeze r3 after re-review): TOML parse, resolved paths, HOME pinned (XDG measured unused), Lstat errors refuse. 3 tests fail on b0f1e27; 11 of 12 mutants killed (1 equivalent). No Go TOML library offline.
