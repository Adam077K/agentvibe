---
role: builder
task: gate-ref-shape
date: 2026-08-28
tier: full
qa_verdict: PASS
branch: fix/gate-ref-shape
---

# builder — the range, the tip, and the one value that is safe to hand onward

**Original defect.** `run-gate.mjs --json` emitted a top-level `ref` that is a RANGE;
`verdict.mjs --ref` takes a SINGLE revision and derives its own base. Reproduced: range -> exit 2;
control `--ref HEAD` -> exit 0.

**Root cause, found while building.** The `empty diff` emit site omitted `invocation`, `drivers`
and `gateSelfReview` entirely while its sibling emitted `invocation: null` for the same condition,
under a comment promising a consumer can always read the key rather than probe for it. A consumer
reads `invocation`, gets `undefined`, falls back to the range.

**My first fix was worse, and review caught it.** Adding bare `base`/`tip` fields created two
silent failures: the `tip` was SYMBOLIC on an explicit `--ref` while the invocation beside it was
sha-pinned (a guarantee varying by code path), and `verdict.mjs` hardcodes `origin/main` as its
base, so a tip alone reproduces the router's classification only at that base — at any other base
the router floors irreversible while verdict.mjs floors full, with nothing reporting it.

**What shipped instead.** `base`/`tip` are gone. `verdictRef` carries its own guarantee:
`{ref: <sha>, reason: null}` when the base is `origin/main` AND the tip resolves, else
`{ref: null, reason: <why>}`. All three decision sites emit an identical 9-key set, pinned by
key-set equality. `refuseTree` states that it carries none of them and why. One `splitRange`
replaces three copies of the load-bearing separator precedence.

**Mutation matrix — the evidence that matters.**

| | result |
|---|---|
| C0 comment reword (must not fire) | 112 pass, 0 fail |
| M1 delete `verdictRef` from empty site | 2 fail |
| M2 delete `drivers` (was GREEN before) | 1 fail |
| M3 delete `gateSelfReview` (was GREEN before) | 1 fail |
| M4 swap separator precedence | 32 fail |
| M5 disable the range refusal | 1 fail |
| M6 emit the symbolic tip again (A1) | 1 fail |
| M7 accept any base (A2) | 1 fail |
| M8 gut the gates.yml instruction (E5) | 1 fail |

**Two mutations did not fire on the first matrix run, and both were mine.** M5 was unpinned because
I deleted its test while rewriting the block — a deletion removing a control with every test green,
inside the change closing an instance of that class. M8 passed because the test matched the bare
token `verdictRef`, which survived a gutted instruction. Both closed and re-measured.

**Standing caveat.** Author-recorded against a deterministic floor: one agent, one model family.
The checks ran and are green; that is not the tier being satisfied.
