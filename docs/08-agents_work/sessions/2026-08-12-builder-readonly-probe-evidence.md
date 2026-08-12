---
role: builder
task: readonly-probe-evidence
date: 2026-08-12
branch: fix/readonly-probe-evidence
tier: lite
qa_verdict: BLOCK
---

Round 1 fix (BLOCKed on review) let `--verify` PASS from a `--record`'d attempt claiming refusal — forgeable through the public interface alone, by the same Bash-capable actor the probe tests, with no write ever attempted. Round 2 removes the PASS path entirely: `--report` has exactly two outcomes, FAIL (probe file exists, dispositive) or UNRESOLVED (everything else, self-report shown as unverified evidence). **The probe cannot self-verify by design** — the actor able to write the probe file is equally able to write the attempt record, so no exit code from this script can mean "the restriction binds"; that verdict belongs to judged claim `c-read-only-binding-unverified`, not to this script. Also fixed: newline injection into `--attempted`/`--result` (rejected at record time) and whitespace-only `--attempted`. 14/14 tests pass (`scripts/probe-readonly.test.mjs`), including the fabricated-record and injection cases; `npm run check` exit 0. `qa_verdict` above reflects the last actual review (BLOCK) — a builder does not self-grant PASS; re-review is pending. **Not covered:** still not wired into CI (no aggregate `npm run check` step exists there).
