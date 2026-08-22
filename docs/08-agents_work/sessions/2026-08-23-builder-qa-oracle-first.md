---
date: 2026-08-23
agent: builder
task: qa-oracle-first-and-model-diversity-corrections
branch: fix/qa-oracle-first
qa_verdict: PENDING
tier: irreversible
---

# Session Log: builder — oracle-first qa.js + MODEL-DIVERSITY.md corrections

**Date:** 2026-08-23
**Lead:** builder (lane2)
**Task:** P0.2 (oracle-first ordering in `.claude/workflows/qa.js`) + P0.5 (stale claims in `MODEL-DIVERSITY.md`)
**Status:** Complete, unreviewed (qa_verdict PENDING — this is an irreversible-tier path, `.claude/workflows/**`)

## What Was Done

- Added a `Phase 0: Oracle` to `qa.js`: one `agent()` dispatch (`reviewer` container, `haiku`) runs
  `npm run check` + diff-scoped typecheck/semgrep and returns structured `{pass, checks}`. On red
  or on dropout (4 attempts, fail-safe to BLOCK, same posture as the judge) the script returns
  BLOCK immediately, in the harness/oracle shape (not a review verdict), before `phase('Review')`
  ever runs — no dimension reviewer, verifier, or judge is dispatched.
- The runtime injects only `agent/parallel/phase/log/args/budget` (no shell) — the oracle's own
  single dispatch is therefore the floor for "run npm run check" at all, not a loophole in "zero
  agents dispatched." That property is about the review/verify/judge panel.
- Corrected `MODEL-DIVERSITY.md` §0 and §1.3: the "two of three verifiers assume the finding is
  false" claim was fixed in #42 and was stale; re-derived the `model: '` line table from the edited
  file rather than copying anyone else's numbers.

## Files Changed

| File | Change |
|------|--------|
| `.claude/workflows/qa.js` | New Oracle phase (schema, prompt, `runOracle()`, short-circuit block), phases metadata, container-split comment |
| `docs/03-system-design/MODEL-DIVERSITY.md` | §0 + §1.3 rewritten to match current qa.js; sourced research untouched |

## Verification

- `npm run check`: every sub-check run individually (aggregate stops at first failure). Only
  failures: `lint:agents` and `test:skill-clamp` both fail on the same known artifact — this clone
  excludes `.mcp.json` (sparse-checkout), so `designer.md`'s `mcpServers: [playwright]` reads as
  unconfigured. `git diff --stat origin/main..HEAD -- .claude/agents/designer.md` is empty —
  confirmed not touched by this branch. `check:dispatch` passed at 13 sites (up from 12), confirming
  the new oracle dispatch resolves cleanly. `check:mc` exits 0; its own `bun test` has 2 known
  in-session failures (SSE socket bind, ledger-crosscheck timeout), both pre-existing.
- `npm run test:tier-gate`: 17/17 pass.
- Short-circuit demonstrated by execution: a harness (`vm`-free, via `new Function` with mock
  `agent/parallel/phase/log/budget/args`) ran the actual edited `qa.js` body. Red oracle → 1 total
  dispatch (the oracle itself), 0 panel dispatches, `phases_entered: ["Oracle"]`, verdict BLOCK.
  Dropout → 4 dispatches (all oracle retries), 0 panel dispatches, BLOCK. Green → panel runs in
  full (7 dispatches: oracle + 5 reviewers + judge), verdict PASS — proving the gate is not
  permanently short-circuited.

## Blockers / Open Questions

- None. Diff-scoped typecheck/semgrep are best-effort inside the oracle prompt (semgrep is not
  installed in this repo; typecheck runs only if a changed file is covered by a tsconfig.json) —
  this was a judgement call within the brief's instruction, not an architectural decision beyond it.

---

_Session by: builder (lane2) | Date: 2026-08-23_
