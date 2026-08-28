---
role: builder
task: w3-caller
tier: full
qa_verdict: PASS
date: 2026-08-29
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
---
- Wired `mission-control/scripts/consume-dispatch.ts` to `scripts/produce-verdict.mjs`, which shipped in #125 and was invoked by nothing (measured at `4ddc5c6`: 3 referencing files vs 24 for `run-gate.mjs`, 0 for an impossible name).
- Denominator is **diffs that need the gate and have no binding verdict**, not dispatches: `run-gate.mjs` must decide `required: true`, then the producer's own pre-check short-circuits on a binding verdict.
- Order is load-bearing: the producer runs AFTER the launch returns and after `routeGate`, because the subject hashes the diff.
- `classifyVerdictProduction` (pure, in `server/index-cache.ts`) takes the state from the producer's `--json` payload and requires the exit code to AGREE; signal, timeout, unparseable payload, unknown outcome and exit 64 are all `unresolved`. No state is derived from an exit code alone, and there is no `passed` member.
- `--no-verdict` declines the spend (2.5-3.8M tokens, 40-50 min). `not-asked` is never folded into `unresolved`.
- VERIFIED-BY-EXECUTION: `bun test test/dispatch.test.ts` 91 -> 116 pass, 0 fail; `tsc --noEmit` exit 0 (it caught 3 real errors `bun test` passed over).
- Standing caveat: author-recorded against a deterministic floor, one agent, one model family. 2-of-3 multi-judge across >=2 model families is NOT met. Accepted risk, exit 2026-11-17.
