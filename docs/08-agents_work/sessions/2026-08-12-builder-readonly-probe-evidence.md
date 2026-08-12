---
role: builder
task: readonly-probe-evidence
date: 2026-08-12
branch: fix/readonly-probe-evidence
tier: lite
qa_verdict: PASS-WITH-FINDINGS
---

Round 1 (BLOCKed): `--verify` PASS'd from a self-reported, forgeable attempt record with no write ever attempted. Round 2 removed the PASS path entirely — `--report` is FAIL (probe file exists, dispositive) or UNRESOLVED (everything else, self-report shown as labeled-unverified evidence); no exit code from this script can mean "the restriction binds" — that verdict belongs to judged claim `c-read-only-binding-unverified`. **The probe cannot self-verify by design.** Round 2 review: PASS-WITH-FINDINGS — the round-1 CRITICAL did not reproduce, but `reject_multiline` caught only literal `\n`; a bare CR or U+2028/U+2029 passed through and could make `--report`'s stdout match a `/^PASS/m` heuristic even though the exit code and the script's own printed verdict never changed. Now fixed: all four ECMAScript line terminators rejected at `--record` time. Also fixed: the test file's own header claimed CI enforcement that does not exist — corrected to state plainly it runs in `npm run check` only. 20/20 tests pass; `npm run check` exit 0. `qa_verdict` reflects the last rendered review, not a self-grant; round-3 re-review is pending. **Not covered:** still not wired into CI.
