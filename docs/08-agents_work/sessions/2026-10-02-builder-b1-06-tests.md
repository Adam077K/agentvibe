---
role: builder
task: b1-06-tests
branch: build/b1-06-tests
tier: lite
qa_verdict: PENDING
---
B1-06 done-tests, re-frozen r2 (2026-10-02) after the Opus review FAIL at 8ec0bd4 and founder rulings A-C, recorded in docs/vision-v3/_process/DR-B1-06-ADAPTER-RULINGS-2026-10-02.md with a pointer in 09a §8.2. check:citations-exist exits 0.
Stub kernel/internal/adapter/{adapter.go,claude.go} (unregistered). The registered files are claude_donetest_test.go and 12 stream-json fixtures, including mcp-tools-changed, rate-limit and long-line (110,737-byte line); mcp-description-changed was dropped per ruling A.
Red: 8 of 8 FAIL against the stub. avk-boundary ok (6111/8000). check-done-tests exit 0.
Proof: throwaway reference in $TMPDIR passes 8/8 under -race -count=3. Mutants: 44 of 45 killed; the one survivor is equivalent (empty forbidden slot, already refused by the slot rule).
OPEN: the profile table row launch-pack→project awaits ratification; the rate-limit wire shape is unmeasured; WorkerOutcome is undefined in canon; LaunchSpec lacked the agents/record/session fields; the status of a harness abort is unspecified; five init fields are unpinned; a description change that keeps the tool names is the Kernel's control.
Refusal: a direct Write into the worktree was blocked by pre-tool-use.sh as outside the project root. Files were written in the scratchpad and copied in, per the brief.
