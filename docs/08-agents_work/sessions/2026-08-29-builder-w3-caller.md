---
role: builder
task: w3-caller
tier: full
qa_verdict: PASS
date: 2026-08-29
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
---
- Wired `mission-control/scripts/consume-dispatch.ts` to `scripts/produce-verdict.mjs`, which shipped in #125 and was invoked by nothing (re-derived at `4ddc5c6`: 3 referencing files vs 24 for `run-gate.mjs`, 0 for an impossible name).
- Denominator is **diffs that need the gate and have no binding verdict**, not dispatches. Order is load-bearing: the producer runs after the launch returns, because the subject hashes the diff.
- `classifyVerdictProduction` (pure, `server/index-cache.ts`) takes the state from the producer's `--json` payload and requires the exit code to AGREE. Signal, timeout, unparseable payload, unknown outcome and exit 64 are `unresolved`. No state comes from an exit code alone; there is no `passed` member.
- ADDED SCOPE: the brief attributed a symbolic-ref defect to `deriveGateReachability`. That symbol reads an agent file and holds no `ref`/`git`/`rev-parse` token (control: 18 `ref` hits elsewhere in the file). The DEFECT is real one function over, in `routeGate`: measured, `--ref origin/main...feat/w3-caller` emits a SYMBOLIC top-level `ref` beside a RESOLVED `invocation.args.ref`; the default path emits both resolved.
- Fixed by recording the router's `verdictRef` as `refTip`/`refTipReason` and rendering the resolved tip first through one shared `describeRef()`. `verdictRef` is now REQUIRED; a router without it is `decided: false`, which is never a pass and never a spend.
- VERIFIED-BY-EXECUTION: `bun test test/dispatch.test.ts` 91 (baseline) -> 126 pass, 0 fail; `tsc --noEmit` exit 0, having caught 3 real errors a green `bun test` passed over. Tier re-derived on the final path set: floor stays `full`, driver `mission-control/scripts/**`.
- Standing caveat: author-recorded against a deterministic floor, one agent, one model family. 2-of-3 multi-judge across >=2 model families is NOT met. Accepted risk, exit 2026-11-17.
