---
role: builder
task: w3-caller
tier: full
qa_verdict: PASS
date: 2026-08-29
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
---
- Wired `consume-dispatch.ts` to `scripts/produce-verdict.mjs`, which shipped in #125 and was invoked by nothing. Denominator: **diffs that need the gate and have no binding verdict**, not dispatches.
- `classifyVerdictProduction` takes the state from the producer's `--json` payload and requires the exit code to AGREE; signal, timeout, unparseable payload, unknown outcome and exit 64 are `unresolved`. No state comes from an exit code alone; no `passed` member.
- ADDED SCOPE, premise refuted then fixed at its real site: `deriveGateReachability` holds no ref (control: 18 `ref` hits elsewhere in the file). The defect is in `routeGate` — measured, a symbolic `--ref` emits a symbolic top-level `ref` beside a resolved `invocation.args.ref`. Fixed via `refTip`/`refTipReason` from the router's `verdictRef`.
- #127 FIX ROUND. **A1 (high)**: 5 entries against one diff bought 5 panels because every filter was per-entry; deduped by subject per run via `verdict.mjs subject`, with its own `already-launched` state. **E1 (p1)**: `describeRef` was reached 14 times with nothing asserting its output — 3 cells now kill the reviewer's mutation (136 pass / 3 fail under it, restored byte-identical).
- **F3**: the terminal record is written BEFORE the producer and updated after, so an interrupted run cannot leave the entry `running` for `inFlight()` to reclaim and re-dispatch — observed from inside the producer (`saw=exited-clean`).
- **F2**: unknown flags exit 64; a typo cost a 3.8M-token panel before. **F1**: launch order asserted off one shared log. **A2**: `verdictRef.ref` must be 40-hex. **A3**: own-property lookup, so a prototype key is diagnosed as an unknown word not a disagreement. **E2**: the 7 rows now separate refusal from acceptance by `why`. **E3**: the bare `24` replaced by its command. **p3s**: timeout precedence corrected (Node sets signal AND code), `refTipReason` invariant established by construction, spawn bounds pinned.
- VERIFIED-BY-EXECUTION: `bun test test/dispatch.test.ts` 91 (baseline) -> 146 pass, 0 fail; crosscheck/index-cache/units/write-barrier 93 pass, 0 fail (shell ban holds); `tsc --noEmit` exit 0 throughout, having caught 3 real errors a green `bun test` passed over.
- NAMED RESIDUAL: a session cut off at `maxTurns` exits 0 and `stdio: 'inherit'` captures nothing, so no consumer-side field can carry `stop_reason`. Contained (such a run records `unresolved`), not fixed. Routed to the `NO_RETURN` lane.
- Standing caveat: author-recorded, deterministic floor, one agent, one model family. 2-of-3 multi-judge across >=2 model families NOT met. Accepted risk, exit 2026-11-17.
