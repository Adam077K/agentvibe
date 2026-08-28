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

## Round 3 — CI was RED on one test, and it was an environment assumption

`Gate routing` (CI run 33168590818, step 39) failed on **exactly one** test of 112 while the same
suite was 112/112 locally. Cause, from the log rather than the step name:

```
not ok 105 - A1 — verdictRef is ALWAYS a resolved sha, never the symbolic name it was given
  Command failed: git rev-parse fix/gate-ref-shape
  fatal: ambiguous argument 'fix/gate-ref-shape': unknown revision or path not in the working tree.
```

The test named a literal branch that exists in the author's worktree and nowhere else.
`actions/checkout` for a `pull_request` event checks out the merge commit in **detached HEAD** and
creates no local branch. The test needs *a symbolic ref resolving to a known sha*, not *that
branch*, so it now **constructs one**: a per-pid branch at HEAD, asserted before use, deleted in
`t.after`. Same cure as PR 99 and PR 101.

**Proven on an environment that reproduces the defect** — a shared clone, detached, with the branch
deleted:

| arm | result |
|---|---|
| old test in the probe | **FAIL**, identical `fatal: ambiguous argument` |
| fixed test, same probe | **PASS** |

**The dispatching hypothesis was right about the environment and wrong about the mechanism.** It
proposed `git rev-parse --abbrev-ref HEAD` returning the literal `HEAD`. Detached HEAD is real and
the probe confirms `--abbrev-ref` does return `HEAD` there — but **no test calls it**: the single
occurrence in the suite is a comment describing PR 99's historical defect (control: 14 live
`rev-parse` uses in the same file). The cure it prescribed was correct anyway.

**Found and NOT fixed here (READ-ONLY, out of scope, fails safe):** `scripts/verdict.mjs`'s `git()`
helper sets no `maxBuffer`, so a sufficiently large diff throws `spawnSync git ENOBUFS` and
surfaces as a Refusal — exit 2, unresolved, never a false pass. Observed in the probe, whose base
was artificially distant. Pre-existing; `run-gate.mjs` has the same gap. Reported, not patched.
