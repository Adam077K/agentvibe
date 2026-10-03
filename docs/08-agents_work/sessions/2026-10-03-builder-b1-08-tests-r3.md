---
role: builder
task: b1-08-tests-r3
date: 2026-10-03
branch: build/b1-08-tests-r3
qa_verdict: PENDING
tier: irreversible
---
# B1-08 launcher r3 done-tests (frozen, red)
- Base 29abadd. Interface plumbing in launcher.go is declarations only. The implementer's launcher_test.go follows the new signatures. launcher_donetest_test.go is re-frozen with its fakes on the new interfaces and provider mode "sub".
- Added launcher_r3_donetest_test.go, with 11 tests covering items 1-9. Registered in build/done-tests/B0-17b.yml (RE-FREEZE r8, "2026-10-03 re-freeze r3 after review").
- On 29abadd plus the plumbing, 10 r3 tests fail; the frozen 3 and R3_ReviewMutants pass. A reference passes (-race -count=3). Mutants: 28 of 28 killed.
- No canon conflict. 09a §9 defines I1-I4 (the >4 bound holds), §8.5 requires a headless launch to run at I2 or above, and §10 spells provider mode 'sub'|'api'.
- **Codex line r4 (2026-10-03, branch build/b1-08-tests-codex-r4):** B1-07 round 4 removes the profile. codexTokens and 09a §8.2 now carry the locked line: --ignore-user-config, --ignore-rules and 17 -c settings, with no -p. In the r3 slot rules, a changed -c, an extra -c or an added -p is ErrArgvNotPinned. B0-17b is re-frozen as r9. Mutants: 2/2 killed. qa_verdict PENDING.
