---
role: builder
task: readonly-probe-evidence
date: 2026-08-12
branch: fix/readonly-probe-evidence
tier: lite
qa_verdict: PASS
---

`--verify` used to conclude "the restriction binds at runtime" from probe-file absence alone; the reviewer engine reported Bash was bound and fully capable of the write, and the file was absent only because it declined, not because the runtime blocked it. Absence now yields UNRESOLVED (exit 2), never PASS, unless a structured attempt record (`--record --attempted/--outcome/--result`) shows a write was tried and refused by the runtime; PROBE_FILE existing still overrides everything as FAIL. 6/6 new tests pass (`scripts/probe-readonly.test.mjs`), wired into `npm run check` (exit 0) as `test:probe-readonly`. **Not covered:** the test runs in `npm run check` but not in CI — no aggregate `npm run check` step exists there; team-lead is handling that separately.
