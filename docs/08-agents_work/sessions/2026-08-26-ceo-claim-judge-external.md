---
date: 2026-08-26
role: ceo
task: claim-judge-external
qa_verdict: PASS
tier: irreversible
engines: [builder, reviewer]
claims_touched: []
---

# An external judge that can BLOCK — not a satisfied family requirement

**Decision.** Reviewed at the lean weight — one blind reviewer under `independence: provenance` carrying both
`adversarial` and `security`, three rounds, against the deterministic floor. `scripts/lib/**` tiers
`irreversible`; the binding `qa.js` gate is reserved for surfaces `git revert` does not undo. Recorded so the
weight is a choice, not an omission.

**What this is.** P0 item 6, deferred since 2026-08-23 because of a specific trap: Codex bug #19945 returns
**exit 0 with empty stdout** when detached from a TTY, which is exactly how a resolver runs it. A resolver
reading exit 0 as a pass would manufacture judgments nobody made, on the highest-risk claims in the ledger.

**Correction to the record, carried here because it propagated.** An earlier header called this *"the only
route this repo has to the `risk: high` requirement of ≥2 distinct model families"*, and the orchestrator
repeated it upward. Measured refutation, now in the source:

```
claim-judge          -> fail | risk:high needs >=2 model families, got 1 (anthropic)
claim-judge-external -> pass | second-family judge completed its turn and returned pass
```

Nothing writes the judgment back into `evidence.judged_by`, so the family count is unmoved and the aggregate
still blocks. **P0 item 6's objective is not reached by this branch.** What shipped is an independent second
opinion that can BLOCK, recorded with an attestation. The builder took the narrow option deliberately rather
than writing back, because a resolver mutating the ledger's own source of truth is a founder decision.

**Evidence.** Round 1 FAIL, one HIGH: the claim steered its own judge — `assert` and `lenses` interpolated
into the judge prompt unfenced, with the nonce that authenticates the verdict in the same message. Round 2
PASS with two pre-merge items. Round 3 PASS, no blocking findings. `ledger.test.mjs` 107 → **149 pass, 0
fail**, zero pre-existing test titles lost. `npm run check` 30 of 30. `ledger verify` 80 · 8 · 0, unchanged
across all three rounds and identical to a pristine `origin/main` export.

**The injection is bounded by a property that already existed, and this is the important line.**
`resolvers.js:443-446` returns `fail` **before any spawn** when the recorded panel already dissents: a second
family may turn PASS into BLOCK, never BLOCK into PASS. Measured under seven attack routes — always-pass
binary, `deprecate`, a live waiver to 2099, `refresh`, `--offline`, hostile claim text, 1-of-3 dissent — **all
`fail`, zero spawns.** Disguising a dissent is closed by the schema: `'FAIL'` and `'fail '` are rejected by
`validateClaim`. Aggregate measured against every panel shape: **an injected external `pass` cannot move any
aggregate from BLOCK to pass.** Severity fell from HIGH to low. Residual, stated precisely: injection can
*cancel* the external judge's ability to block, reducing it to a no-op on that claim. It cannot manufacture a
pass.

**Three defences on the injection, and the load-bearing one is not the one first claimed.** INGEST refuses a
claim carrying the reserved token; FENCE bounds claim text with a per-run tag; FINAL LINE makes a planted
mid-message verdict worthless. The original comment credited INGEST. That was wrong twice over: the working
attack carries no reserved token — the harness itself instructs the judge to emit that line — and a
pre-formed verdict could never have matched anyway, because the nonce does not exist when a claim is
authored. **Against the attack that works, FENCE plus data-framing is the only defence, and it is the
unverified half.** The comment now says so and names the invalid inference it previously made.

**Every `pass` and `fail` in this branch came from a stub.** `codex` is absent; `gemini` is present at 0.38.2
and unauthenticated. Run against the real binary: sandbox armed → exit 52, 0 bytes, because `denyRead` over
`~/.gemini` blocks its own settings; sandbox off → exit 1, `IneligibleTierError`. Both correctly `unresolved`.
**No callable second model family exists on this machine, measured 2026-08-26** — confirming
`MODEL-DIVERSITY.md §1.4` rather than inheriting it. Both profiles declare `verified_against_binary: false`,
and that field is now consumed rather than decorative. **The credential guard from one P0 item is what makes
the only second-family binary unusable for another — two correct decisions colliding.**

**Corrections the review forced, recorded rather than absorbed.** The attestation was written to the event log
for `fail` and `unresolved` and **never for `pass`** — absent for the one verdict anyone would forge — because
the caller returned before logging. Correct evidence, wrong channel. The output scanner capped at the **first**
500 string leaves when a judge's answer is the last thing it says, so a verbose run discarded its own verdict
and resolved `unresolved`: safe, invisible, permanent. The orchestrator graded that "low, adds inertness"; the
defect was the **direction** of the cap, not its size.

**Finding a class is not the same as sweeping it.** The builder found one vacuous fixture, wrote the comment
explaining why vacuous fixtures are worse than missing tests, and did not audit the neighbour four lines away.
Consequence: `extractVerdicts`' deduplication was exercised by **no test at all** — deleting it failed nothing.
After the sweep, deleting it fails 2 of 149, verified independently by the reviewer.

**Owed at merge: nothing.** The tests live in `ledger.test.mjs`, which `check:ledger` already runs as both a
`STEPS` entry and a CI step. No new npm script.

**Two founder decisions deliberately not taken.** Whether `claim-judge` should reject unattested `judged_by`
entries — `claims.js` counts `model_family` *strings*, so the independence predicate is satisfiable by typing;
the attestation now exists but is not required, and both `risk: high` judge claims have empty panels so it is
inert today. And whether judgments get written back into the panel.

**Backlog, all latent and none blocking:** the tail cap can suppress a contradiction and now errs toward
`pass` where it erred toward block; `MAX_LEAVES` bounds the tail fix at 20,000 leaves; emphasis around the
verdict *word* rather than the line is still uncounted; gemini's text extraction is uncapped where codex's is
not.

**Not an independent panel:** single model family throughout — which is precisely the gap this branch was
built to close and cannot, for want of a callable second vendor.
