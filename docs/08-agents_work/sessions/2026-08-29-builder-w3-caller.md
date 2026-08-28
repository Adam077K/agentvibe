---
role: builder
task: w3-caller
tier: full
qa_verdict: PASS
date: 2026-08-29
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
---
- Wired `mission-control/scripts/consume-dispatch.ts` to `scripts/produce-verdict.mjs`, which shipped in #125 and was invoked by nothing (re-derived at `4ddc5c6`: 3 referencing files vs 24 for `run-gate.mjs`, 0 for an impossible name).
- Denominator is **diffs that need the gate and have no binding verdict**, not dispatches. The producer runs after the launch returns, because the subject hashes the diff; nothing enforces that order but the call site, and this is stated in the source.
- `classifyVerdictProduction` (pure, `server/index-cache.ts`) takes the state from the producer's `--json` payload and requires the exit code to AGREE. Signal, timeout, unparseable payload, unknown outcome and exit 64 are `unresolved`. No state comes from an exit code alone; there is no `passed` member. `not-asked` is never folded into `unresolved`, and every cell asserts an observed run count rather than inferring one.
- ADDED SCOPE, premise REFUTED then the defect fixed at its real site: `deriveGateReachability(root, agent)` reads an agent file and holds no `ref`/`git`/`rev-parse` token in signature, body, return type or either call site (control: 18 `ref` hits elsewhere in the file). The DEFECT is real in `routeGate` — measured, `--ref origin/main...feat/w3-caller` emits a SYMBOLIC top-level `ref` beside a RESOLVED `invocation.args.ref`, while the default path emits both resolved.
- Fixed by recording the router's `verdictRef` as `refTip`/`refTipReason` and rendering the resolved tip first through one shared `describeRef()`. `verdictRef` is now REQUIRED; a router without it is `decided: false` — never a pass, never a spend. Seven refusal cells plus a control cell that must still decide.
- `GateRouting.ref` is read by no program (client 0; control: client reads `dispatch` in 2 files). It is printed to an operator and recorded durably, so it misled a human, not a consumer.
- VERIFIED-BY-EXECUTION: `bun test test/dispatch.test.ts` 91 (baseline) -> 126 pass, 0 fail; `tsc --noEmit` exit 0, having caught 3 real errors a green `bun test` passed over. Tier re-derived on the final path set: floor `full`, driver `mission-control/scripts/**`; `server/**` also floors `full`, so the floor did not move.
- NAMED RESIDUAL, not closed: a session cut off at `maxTurns` exits 0, and `stdio: 'inherit'` captures nothing, so no consumer-side field can carry `stop_reason`. Contained, not fixed — such a session now records `verdictProduction: unresolved` rather than silence. Routed to the `NO_RETURN` lane.
- Standing caveat: author-recorded against a deterministic floor, one agent, one model family. 2-of-3 multi-judge across >=2 model families is NOT met. Accepted risk, exit 2026-11-17.
