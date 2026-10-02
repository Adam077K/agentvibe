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
r3 (2026-10-02): the Opus review of d0f0fc8 failed. Founder rulings D (profile row ratified) and E (rate limits: measure first; an unrecognised signal never passes) are recorded in the DR note. Now 9 tests and 14 fixtures (long line 1,137,737 bytes, no-init-result, unrecognised-signal-{rejected,allowed}); red 9/9; reference passes; 51 of 52 mutants killed (1 equivalent). The fetch got a 502; HEAD equalled the last known remote.
r4 (2026-10-02, final review nits): pinned plugin list (same-count swap aborts); Agent(x)/Task(x) refused without FundedTeam. 53 of 54 mutants killed.
OPEN: the exact rate-limit shape (measure on a real run, then re-freeze); WorkerOutcome is undefined in canon; LaunchSpec lacked the agents/record/session fields; the status of a harness abort is unspecified; five init fields are unpinned; a description change that keeps the tool names is the Kernel's control.
Refusal: a direct Write into the worktree was blocked by pre-tool-use.sh as outside the project root. Files were written in the scratchpad and copied in, per the brief.
