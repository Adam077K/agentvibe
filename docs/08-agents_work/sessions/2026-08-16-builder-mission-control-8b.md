---
date: 2026-08-16
role: builder
task: mission-control-8b-dispatch
branch: feat/mission-control-8b-dispatch
worktree: .worktrees/lane-mc8b
qa_verdict: PASS
tier: full
---

Phase 8b — Mission Control Dispatch view. The only Mission Control view that writes.

## What was built

**Write half (server + queue):**
- `mission-control/server/index-cache.ts` — `appendDispatch`, `readDispatch`, `DispatchEntry` type, `dispatchQueuePath` added. Index-cache.ts is the only server file crosscheck.test.ts permits write APIs; the queue lives here to stay within that constraint.
- `mission-control/server/routes/api.ts` — `POST /api/dispatch` (validate + enqueue) and `GET /api/dispatch` (list queue). No write tokens in this file; writes are delegated to index-cache.ts.

**Client (UI):**
- `mission-control/client/src/views/DispatchView.tsx` — form with project selector + goal textarea; queue listing showing all entries newest-first. `stream: false` — fetches on demand, not pushed via SSE.
- `mission-control/client/src/App.tsx` — Dispatch view registered as nav: true, stream: false.
- `mission-control/client/src/api.ts` — Dispatch types re-exported.

**Consume half (founder-run, outside server):**
- `mission-control/scripts/consume-dispatch.ts` — reads `~/.agentvibe/dispatch-queue.jsonl`, for each pending entry targeting `agentvibe` spawns `claude --print <goal>` in the project root, marks entry consumed. `--dry-run` and `--list` flags included.

**Tests:**
- `mission-control/test/dispatch.test.ts` — 25 tests: queue read/write contract, route validation, success path, path-injection guard, write-isolation assertion (POST /api/dispatch leaves fixture fleet and REPO_ROOT byte-identical).

## Undischarged gate — explicit

Phase 8b's original gate (AGENT-SYSTEM-REBUILD.md §4): *"claims land in that repo's ledger"* after dispatching into a second project. **This remains undischarged.** Measured 2026-08-12: no sibling project has a ledger. The gate depends on Phase 9 (fleet rollout), which the 2026-08-16 founder decision defers.

This PR delivers the loop end-to-end against `agentvibe` only. The form allows selecting any discovered project; the consume-dispatch script currently dispatches only to `agentvibe` and skips others with a named warning. Phase 9 extends the consumer to the full fleet.

## Security measures taken

- Queue path derived from `os.homedir()` + hardcoded segment, never from user input.
- Project ID validated against live `discoverFleet()` output — root in the queue entry is always the one the server discovered, never caller-supplied.
- Goal capped at 2000 characters after trim; empty goals rejected.
- No shell invocations in server/** — consumer script lives in `scripts/` (outside server/), where the crosscheck ban does not apply.
- Write call (`appendFileSync`) lives only in `index-cache.ts` — the one file crosscheck.test.ts's `WRITE_OWNER` exempts.
- Queue written to `~/.agentvibe/dispatch-queue.jsonl` — outside REPO_ROOT, so write-barrier.test.ts's unchanged-repo assertion holds.

## Verification

- `bun tsc --noEmit` — exit 0
- `bun test test/dispatch.test.ts` — 25 pass / 0 fail
- `bun test test/crosscheck.test.ts` — 17 pass / 0 fail (shell ban + write ban tests pass)
- `npm run check:mc` — exit 0 (345 pass / 0 fail across 12 files including new dispatch.test.ts)
- `node scripts/classify.mjs <changed paths>` — tier: full, floor: full (server files touched)
- Known flake `crosscheck.test.ts "claim counts by verdict"` failed in full parallel run (79 vs 78, concurrent ledger state); passes in isolation. Listed as known flake in the build brief.
