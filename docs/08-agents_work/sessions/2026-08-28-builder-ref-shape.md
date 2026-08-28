---
role: builder
task: gate-ref-shape
date: 2026-08-28
tier: full
qa_verdict: PASS
branch: fix/gate-ref-shape
---

# builder — the range and the tip wore one field name

**Defect, reproduced before building.** `scripts/run-gate.mjs --json` emitted a top-level `ref`
that is a two-dot-three RANGE; `scripts/verdict.mjs --ref` takes a SINGLE revision and derives its
own base as `merge-base(origin/main, ref)`. Measured: range -> exit 2, `fatal: Not a valid object
name`; CONTROL `--ref HEAD` -> exit 0. It fails safe and costs a round trip. It bites because
`.claude/gates.yml` says to pass `invocation.args` through unmodified and `invocation` is null
whenever the gate is not required, so the only ref-shaped field left is the one that does not work.

**Fix: naming, not conversion.** `ref` is unchanged; `base` and `tip` name its two halves at every
emit site. `verdict.mjs` REFUSES a range by name (exit 2, unresolved) rather than learning to parse
one — a second way to compute the range is the defect being closed, and single-ref reproducibility
is what lets a recorded verdict survive a base move.

**Found while building, fixed here:** the `empty diff` emit site omitted `invocation`, `drivers`
and `gateSelfReview` entirely while its sibling emitted `invocation: null` under a comment
promising "a consumer can always read the key rather than probe for it". It carries the same keys
now — and still emits no invocation where the gate is not required.

**Evidence.** RED first: 105 tests, 101 pass, 4 fail against the unmodified tree. GREEN after:
105/105. Control A (drop `tip` from one emit site) -> 2 failures, exit 1, so the test is not
vacuous. Control B (reword a comment) -> 105/105, so it is not merely reacting to any edit.
`npm run check`: **48 of 48 passed, 0 failed, exit 0, every step ran.**

**Standing caveat.** This PASS is author-recorded against a deterministic floor: one agent, one
model family. `full` tier asks for a second opinion that no non-Anthropic model inside Claude Code
can supply. The checks ran and are green; that is not the tier being satisfied.
