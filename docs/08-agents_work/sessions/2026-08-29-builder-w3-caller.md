---
role: builder
task: w3-caller
tier: full
qa_verdict: PASS
date: 2026-08-29
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
---
- Wired `consume-dispatch.ts` to `scripts/produce-verdict.mjs`, which shipped in #125 and was invoked by nothing. Denominator: **diffs that need the gate and have no binding verdict**, not dispatches. The producer runs after the launch returns, because the subject hashes the diff.
- `classifyVerdictProduction` takes the state from the producer's `--json` payload and requires the exit code to AGREE; signal, timeout, unparseable payload, unknown outcome and exit 64 are `unresolved`. No state comes from an exit code alone; no `passed` member.
- The symbolic-ref item was misattributed to `deriveGateReachability` (holds no ref; control 18 `ref` hits elsewhere in the file). Fixed at its real site, `routeGate`, via `refTip` from the router's `verdictRef`.
- #127 round: A1 (5 entries bought 5 panels; deduped by subject per run, own `already-launched` state) and E1 (`describeRef` reached 14x with nothing asserting its output; 3 cells now kill the mutation).
- FINAL ROUND. **Q1 collapse**: `refTip` is `string`, never null; `refTipReason` deleted; `describeRef` single-branch; the `<unpinned>` key form gone, which closed a delta finding that it failed toward SKIPPING. Both cells CONVERTED not deleted, and the router's own reason is relayed into every refusal that has one (measured: `verdictRefFor` 5 of 5 null-ref returns carry a reason; the two structurally reasonless paths say so).
- **Q4**: the first terminal line carries an explicit `unresolved` instead of silence, closing an ambiguity the F3 reorder itself introduced.
- Delta fixes: **F1** the skip record said three things it could not know (now reports the earlier attempt's state); **F2** fixtures never wrote `scripts/verdict.mjs`, so no test reached the subject branch — a tripwire there went from byte-identical green to 134/14; **F3** two assertions survived mutation, now named; **F4** the new spawn was unbounded, given `subjectTimeoutMs`, with `routeGate`'s unbounded spawn NAMED as pre-existing and not closed; **F5** half of A3 is inert and now says so; **F6** two comments described readers that do not exist. `subjectCache` deleted — it widened the origin/main-moves-mid-run edge toward skipping.
- CORRECTED A FALSE COMMENT OF MY OWN: the "interrupted run can pay twice" claim was inherited from a review synthesis and is false in the tree — neither cell re-dispatches.
- VERIFIED-BY-EXECUTION: `dispatch.test.ts` 91 (baseline) -> 148 pass, 0 fail, 597 expect() calls; `tsc --noEmit` exit 0; 4 mutations run, 3 kill, 1 control does not fire, restored byte-identical. `crosscheck` 18/0, `index-cache` 32/0, `units` 36/0, `write-barrier` 7/0 individually. Combined they are 92/1: `MC's ledger summary equals ledger.mjs verify` times out at its documented 120s wall-clock budget under load — pre-existing, runs `scripts/ledger.mjs` which this diff does not touch, and NOT greened by raising the timeout.
- NAMED RESIDUALS: `maxTurns` truncation (routed to the `NO_RETURN` lane); `routeGate`'s unbounded spawn; `origin/main` moving mid-run; the A2 regex refuses a 64-hex tip, so a sha-256 repo gets `decided: false` loudly with no panel.
- Standing caveat: author-recorded, deterministic floor, one agent, one model family. 2-of-3 multi-judge across >=2 model families NOT met. Accepted risk, exit 2026-11-17.
