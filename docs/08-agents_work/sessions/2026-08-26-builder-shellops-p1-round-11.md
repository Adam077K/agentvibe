---
date: 2026-08-26
role: builder
task: shellops-p1-round-11
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/shellops-comment-procsub-yaml
commits: 3
---
# Round 11: one line, and it was a regression I introduced in round 10
**Round 10 tested `/\d/` against the whole value, header and trailing comment together.** So `run: | # step 2 of 3` was REFUSED with a message saying it carries an indentation indicator — which it does not. Reproduced across four real comment shapes: `# step 2 of 3`, `# 44 sequential checks`, `# bun 1.3.10`, `# see #106`. This repo's own `ci.yml` comments are dense with numbers, so it is live rather than theoretical.
**Provenance judged against both earlier trees, and it moved the severity.** `main` fails those rows too but for an unrelated reason — no comment arm at all, so it misreads `| # note` as a plain scalar and reports a phantom `` `|` `` even with no digit. **Round 9 read all four correctly.** So this is a regression against round 9, not against `main`, and the reviewer says it would have been called P1 without that check.
**Fixed by CAPTURING the header and testing only it**, which collapses two regexes into one. Two patterns for one question is how they came to disagree here; there is now one place that decides whether a value is a block header.
**Pinned BOTH WAYS, because one way passes under the bug.** `| # step 2 of 3` reads and reports its body's chain; `|2 # step 2 of 3` is refused. A case asserting only the refusal is green against the code that produced the defect.
**The coupling `unguardedSteps()` rests on now has a test.** Its JSDoc says the exclusion is not fail-open because a refused `if:` blocks via `ciChainFindings()` — true, but discharged by a *different function*, with nothing testing the join. The new case goes red if that unparsed loop gains a **scope** or an **exemption**, and asserts end to end on the real `ci.yml` that a quoted weakened guard still blocks — naming which check goes red, because the assertion named for the guard *passes* and on `main` it is the other way round.
**Item 3, my call:** the `guard is not a parameter` assertion compared two numbers with `deepEqual` and was silently coupled to "no `ci.yml` step has a refused `if:`" — which is exactly how it went red during this round's injection run, for a reason unrelated to what it tests. Moved to a fixture the case owns, with `assert.equal`.
**The four structure holes are untouched**, as instructed.
Verified: `npm run check` → **43 of 43 · 0 failed · exit 0** · `test:check-suite` **59 pass · 0 fail** · **ten mutations, all ten bite** · defeater hunt over 86 shapes: 34 agree · 41 refused · 1 pre-existing over-report · **0 bypasses** · impact **0 of 114**.
