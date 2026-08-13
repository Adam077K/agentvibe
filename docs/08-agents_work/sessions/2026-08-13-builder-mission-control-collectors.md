---
date: 2026-08-13
role: builder
task: mission-control-collectors
tier: lite
qa_verdict: PASS
---

`server/projects.ts` (discovery, 8 registry-active incl. `finfun`), `server/index-store.ts` (disk-write-free, mtime-skip refresh), 7 collectors, `server/routes/api.ts`, `mission-control/scripts/check-cold-start.ts`. No UI. 47 bun tests pass, incl. the mutation gate and a shell-injection regression suite; the fleet cross-check now skips loudly (never silently) when `~/bin` is absent, fixing a real CI failure. `npm run check` exit 0.
PASS rests on four single-model review rounds (round 1: BLOCK — an RCE in `projectEmptyState`, fixed; rounds 2-4: PASS-WITH-FINDINGS, final: no CRITICAL) — not the ≥2-model-family independent panel the `adversarial` lens calls for. Two findings logged, not fixed: #27 (the guard's collapsed-whitespace scan can false-positive on prose mentioning `exec(`) and #26 (the guard is regex-over-source-text, inherently gameable; an AST-based check is the durable fix).
