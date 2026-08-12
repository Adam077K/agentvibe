---
role: builder
task: readonly-probe-evidence
date: 2026-08-12
branch: fix/readonly-probe-evidence
tier: lite
qa_verdict: PASS
---

Three rounds. Round 1 (BLOCK): `--verify` PASS'd from a self-reported, forgeable attempt record with no write ever attempted. Round 2 (PASS-WITH-FINDINGS): removed the PASS path entirely — `--report` is FAIL (probe file exists, dispositive) or UNRESOLVED (everything else, self-report shown as labeled-unverified evidence); the finding was that `reject_multiline` caught only literal LF, so a bare CR or U+2028/U+2029 could make `--report`'s stdout match a `/^PASS/m` heuristic although the script's own exit code and printed verdict never changed. Round 3 (PASS-WITH-FINDINGS): that four-character set closed the only consumer that existed; a bare FS (0x1C) still split into a bare "PASS" element under Python's `str.splitlines()`, a differently-implemented downstream reader. Now widened to the full eleven-form union — LF, CR, VT, FF, FS, GS, RS, NEL, U+2028, U+2029, plus CRLF (implied by CR) — built with `printf` byte literals throughout, independent of shell Unicode-escape support. **The probe cannot self-verify by design**; that verdict belongs to judged claim `c-read-only-binding-unverified`. 32/32 tests pass; `npm run check` exit 0. **This PASS rests on three review rounds, all single-model — not the ≥2-model-family panel the `adversarial` and `evidence` lenses call for.** **Not covered:** still not wired into CI (tracked separately, outside this branch's scope).
