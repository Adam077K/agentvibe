# /audit — sweep the whole repository, not a diff

## Usage

```
/audit
/audit [focus: security | quality | architecture]
```

## This command names no playbook, and that is deliberate

Every other command here carries a `playbook:` in its frontmatter and stops. This one cannot,
because there is no audit playbook and inventing one would be worse than the gap: an audit has no
diff. The binding gate is diff-scoped from end to end — `scripts/run-gate.mjs` classifies
*changed files*, `.claude/workflows/qa.js` reviews a *ref range*, and
`scripts/verdict.mjs` binds a verdict to the sha256 of a *diff*. Point `/audit` at that and you
get a verdict about nothing, or a verdict about whatever happened to be uncommitted.

So `/audit` is the sweep the gate cannot do, and `/review` is the gate. Read
[.claude/commands/review.md](review.md) if the question is "should this change merge".

## Run the deterministic sweep first

These are the checks that already exist and already have an answer. An audit that reports what
they would have reported is an audit that burned a budget re-deriving a known fact.

```
npm run check                 # the whole suite; the runner prints Tally: N of M passed
npm run gates                 # every playbook gate resolves, every trigger reaches a command
npm run check:registration    # dead paths and phantom agents in the governing docs
npm run ledger:verify         # claims that would block, and claims that expired
npm run check:map             # is .claude/memory/CODEBASE-MAP.md still true of the tree
node scripts/check-memory-budget.mjs
```

## Then, and only then, dispatch judgement

What is left after the deterministic sweep is what needs reading: whether a boundary is in the
right place, whether a rule that passes is the rule anyone wanted. That is the `reviewer` engine
under the dimensions in [.claude/review-lenses.yml](../review-lenses.yml), scoped to a subtree —
one focused review per session, not the whole tree at once.

`reviewer` carries no `Write` or `Edit`. An agent that can edit what it reviews will review what
it can edit.

## What an audit produces

Findings, each a measured difference from a stated rule, with the file and the line. No verdict:
a verdict belongs to a diff, and this command does not have one.

> **Superseded 2026-08-26.** This file used to describe four numbered steps, dispatch three named
> agents in parallel, and end in a PASS / NEEDS ATTENTION verdict with a report template. The
> verdict was the defect — it wore the vocabulary of the binding gate while being computed by
> nothing, over a subject the gate cannot take. The `CODEBASE-MAP.md` refresh it described is real
> and is now `npm run check:map` above, which is a step of `npm run check`.
