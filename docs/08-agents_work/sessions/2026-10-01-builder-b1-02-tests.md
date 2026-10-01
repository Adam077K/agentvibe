---
role: builder
task: b1-02-tests
branch: build/b1-02-tests
tier: lite
qa_verdict: PENDING
---
B1-02 done-tests frozen for the Go half only: kernel/internal/nouns/nouns.go is the unregistered stub contract; nouns_donetest_test.go plus testdata/nouns/{valid,invalid,decisions}.json are registered in build/done-tests/B1-02.yml. `node build/check-done-tests.mjs` gives 10 hashes in 3 registers, exit 0; avk-boundary exit 0.
Red: `go -C kernel test -count=1 -tags donetest ./internal/nouns/` gives 6 of 6 top-level FAIL, every one on ErrNotImplemented and none on a fixture error.
Reachable: a throwaway reference impl (overlay, not committed) passes all 6. A mutant that skips the meaning check fails 6 of 7 tamper cases, and plain json.Unmarshal fails 35 of 35 malformed cases.
BLOCKED, the TS half: Zod is in no package.json or node_modules, and adding it was forbidden. The fixtures are language-neutral for that half.
Choices made here for the reviewer: bigints are decimal strings, unknown keys are refused, Hex is 64 lowercase characters, decision.compiled v1 is the canon §3 layout, and Outcome is {operation_id, disposition, effect_class, door}.
