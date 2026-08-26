---
playbook: ship-feature
enter_at: review
---

# /review — judge a diff independently of whoever produced it

Runs the **`ship-feature`** playbook from its `review` stage:
[.claude/playbooks/ship-feature.yml](../playbooks/ship-feature.yml). It stops there. `/ship`
continues through the `ship` stage and its founder gate.

## Usage

```
/review
/review [branch or PR]
```

## Where the pipeline lives

In the playbook and in the gate — not here.

```
node scripts/run-gate.mjs --json          # what tier this diff is, and the exact qa.js invocation
node scripts/check-gates.mjs resolve qa-verdict   # is a PASS bound to this diff yet
```

**Pass `invocation.args` through unmodified.** `run-gate.mjs` resolves `tree` from its own
location and exits 2 rather than emitting an invocation it could not verify. Args rebuilt by hand
are refused by the gate: `tree` must be absolute (a relative `.` is refused) and `ref` must be
sha-tipped (`origin/main...HEAD` is refused by name).

**Before you record anything from a gate run, check that it ran.** A refused entry and a real
BLOCK return the same verdict — five of six plausible arg shapes are refused and every one of them
returns BLOCK having dispatched **zero** agents (measured 2026-08-26). The two distinguishers are
`agents dispatched == 0` and the literal word `REFUSED` in the summary. A gate that reviewed
nothing looks exactly like a gate that reviewed everything and found defects.

And the gate is invoked by the **session**, never by a dispatched engine: `Workflow` is a
main-session tool, so an engine simply does not have it, and a missing tool is a silent no-op
rather than an error.

The dimensions the diff is judged on are the `review(lens=…)` exits of the `review` stage,
resolved against [.claude/review-lenses.yml](../review-lenses.yml). The verdict logic —
what blocks, what is advisory, how a finding is adversarially verified before it can block — is
in [.claude/workflows/qa.js](../workflows/qa.js) and tested by `npm run test:gate`.

> **Superseded 2026-08-26.** This file used to restate all of that: five numbered steps, two named
> reviewer agents, and a four-row table defining PASS / PASS-with-notes / BLOCK. That table was a
> second implementation of a verdict rule that `qa.js` and `.claude/workflows/lib/gate-logic.mjs`
> already own, written in prose, checked by nothing, and free to drift from the mechanism it
> described. CLAUDE.md's house rule is the fix: a slash command names a playbook and stops.

## What this command cannot do

**Produce the verdict record.** Review returns findings; `node scripts/verdict.mjs record` binds a
PASS to the sha256 of the diff, and it has to be committed to count. A verdict cannot be moved to
a different diff and cannot survive an edit to the one it approved.

**Pass the gate on its own say-so.** The `review` stage carries `gate: qa-verdict`, declared
`kind: command` in [.claude/gates.yml](../gates.yml). Its resolver is
`node scripts/verdict.mjs check`, and the exit code is the answer.
