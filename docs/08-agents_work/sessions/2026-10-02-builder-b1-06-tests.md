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
r4 (2026-10-02, after impl review of 22ab9a4, branch build/b1-06-tests-r4): added claude_r4_donetest_test.go (4 tests, no fixtures). On 22ab9a4: R4_ToolListsAreASCII, R4_UnrecognisedCountsAsUnparsed and R4_PermissionModeIsThePinnedOne fail; the rest pass. 10 of 10 r4 mutants killed in $TMPDIR. Item 2 is an assumption (recorded in the DR note). The scratchpad is shared with the implementer, so this file is edited from the repo copy.
r5 (2026-10-02, after re-review of a8ea780, branch build/b1-06-tests-r5): added claude_r5_donetest_test.go (4 tests, no fixtures): nested parentheses, exact JSON keys, later-init mode, nested-agent spelling. On a8ea780 R5_NestedParenthesesRefused and R5_KeysAreMatchedExactly fail. 5 of 5 r5 mutants killed in $TMPDIR.
r6 (2026-10-02, founder ruling F, branch build/b1-06-tests-r6 from a90071b): Task is an alias of Agent; claude_donetest_test.go re-frozen (2 assertions); claude_r6_donetest_test.go (5 tests). On a90071b PinnedArgv, R6_TaskIsAnAliasOfAgent, R6_BackslashRefused fail. 6 of 6 mutants killed.
r7 (2026-10-02, branch build/b1-06-tests-r7 from b3cc99d): claude_r7_donetest_test.go - X(*) is the bare X (CLI parser, read from the 2.1.284/2.1.287 binaries); case-variant nested forbid refused (CLI is case-sensitive). Both r7 tests fail on b3cc99d. 4 of 4 mutants killed, incl. :150 exact-name.
OPEN: the exact rate-limit shape (measure on a real run, then re-freeze); WorkerOutcome is undefined in canon; LaunchSpec lacked the agents/record/session fields; the status of a harness abort is unspecified; five init fields are unpinned; a description change that keeps the tool names is the Kernel's control.
Refusal: a direct Write into the worktree was blocked by pre-tool-use.sh as outside the project root. Files were written in the scratchpad and copied in, per the brief.
