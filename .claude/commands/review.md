---
playbook: ship-feature
enter_at: review
stop_after: review
---

# /review — judge a diff independently of whoever produced it

Runs the **`ship-feature`** playbook from its `review` stage and **stops there**:
[.claude/playbooks/ship-feature.yml](../playbooks/ship-feature.yml). `/ship` enters at the same
stage and continues through `ship` and its founder gate.

That difference is the `stop_after` key above, not this paragraph. It used to be only this
paragraph: `/review` and `/ship` carried byte-identical frontmatter, so the one command that must
not merge and the one that does were indistinguishable to everything except a reader.

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

**Before you record anything from a gate run, read two fields — `verdict` and `established`.** A
refusal is its own terminal value: `REFUSED`, distinct from `BLOCK` and from `PASS`. `established`
is `verdict !== REFUSED`, derived on the same line that sets the verdict, so *"did this run tell me
anything"* is one field rather than an enumeration you can fall behind.

**Do not fold `REFUSED` back into `BLOCK`.** [.claude/workflows/qa.js](../workflows/qa.js) says so
about itself: doing that moves the lie from the gate to the caller and buys nothing.

> **Superseded 2026-08-26, and kept because it is why the value exists.** Until PR 115 landed, a
> refusal returned `BLOCK` — so a gate that reviewed nothing was indistinguishable from one that
> reviewed everything and found defects, and this file told you to read the summary for the literal
> `REFUSED` and for its claim that nothing had been established. That inference is no longer needed.
> **Never a count of dispatched agents**, which was never the discriminator: an entry refusal
> dispatches none, an oracle dropout can dispatch four and establish nothing, and a real failing
> check can establish something with one.

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
