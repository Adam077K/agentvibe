---
date: 2026-08-17
agent: builder
task: settle-mcp-grant-claim-issue-90
branch: fix/mcp-grant-claim
qa_verdict: PASS
tier: irreversible
---

# Session Log: builder — settle mcp-grant claim (issue #90)

**Date:** 2026-08-17
**Lead:** builder (lane-grant)
**Task:** Settle `c-mcp-grant-binds-through-agent-dispatch` — claim green while assertion false
**Status:** Complete

---

## What Was Done

- Recorded a `refresh` disposition on `c-mcp-grant-binds-through-agent-dispatch` with a narrowed assert: NARROWS still holds (builder held zero in all observations), ARRIVES is now uncertain (observed 24 tools 2026-08-16; observed zero across three dispatches 2026-08-17, configuration intact). Confidence lowered from 0.9 to 0.6.
- Added `evidence.configuration_only: true` field to mark the claim as checking configuration only, not live behaviour — the command still passes (grep is green), but `verify` output now shows `(configuration-only: verified configuration, not live behaviour)`.
- Implemented `configuration_only` as an opt-in field in `scripts/lib/claims.js` and `scripts/lib/resolvers.js`, with schema validation and tests (58 + 107 = passing, 0 fail).
- Updated `CLAIM-LEDGER.md` field table to document `evidence.configuration_only` alongside `evidence.unchecked_exit`.
- Added Playwright workaround to `designer.md` operating procedure: import local package directly, use `domcontentloaded`, never use macOS `screencapture`.

## Files Changed

| File | Change |
|------|--------|
| `scripts/lib/claims.js` | Added `configuration_only` validation in `validateEvidence` for command claims |
| `scripts/lib/resolvers.js` | Annotated pass reason with `(configuration-only: ...)` when field is set |
| `scripts/claims.test.mjs` | Three tests for `configuration_only` schema validation |
| `scripts/ledger.test.mjs` | Three tests for resolver behaviour with `configuration_only` |
| `docs/03-system-design/CLAIM-LEDGER.md` | Refresh disposition + corrected assert + field table entry |
| `.claude/agents/designer.md` | Playwright workaround in Step 4, with domcontentloaded and screencapture warnings |
| `.claude/ledger/index.json` | Rebuilt after claim update |
| `.claude/memory/CODEBASE-MAP.md` | Rebuilt via `npm run build:map` |

## Decisions Made

- `configuration_only` status remains `pass` (not `unresolved`) — the configuration check passed; the field annotates the reason, not the status. This is the correct distinction: `unchecked_exit` means the check could not run; `configuration_only` means it ran and passed a proxy.
- Disposition is `refresh` (not `deprecate`) because NARROWS still holds and ARRIVES is uncertain, not disproved. A deprecation would retire a claim that is still partially true.
- Tier is `irreversible` because `.claude/agents/designer.md` and `scripts/lib/claims.js`/`resolvers.js` all match irreversible paths.

## Blockers / Open Questions

- Root cause of the MCP grant not arriving on 2026-08-17 is unknown. The claim records this honestly. The perception loop is unblocked via the local package workaround.

---

_Session by: builder (lane-grant) | Date: 2026-08-17_
