---
date: 2026-08-16
role: ceo
task: docs-verification-rules
tier: trivial
qa_verdict: PASS
---

Documentation only. Six rules added to the handoff, each with an execution behind it, all earned during PR #48 (incremental index) and PR #49 (tier floor).

**The strongest arrived last and is the defect class one level further out than this phase had it.** *A mutation that does not apply is indistinguishable from a guard that works.* A builder proving its own fix injected a multi-line import into a file that had none — nothing was inserted, the suite went green, and one of three styles was reported caught having never been tested. Green means "the injection did not break anything", and an injection that never happened cannot. Not a check that cannot fail: a **proof** that cannot fail.

**A declared blind spot with a vacuous mitigation is worse than an undeclared one.** A guard honestly documented a gap, then bounded it with an unsatisfiable condition so the residual was always empty — and the CEO's one-line repair *also* passed the mutation that motivated it, because a file with code on no line takes the "was all comment" exit. The repair was caught by the builder re-running the CEO's own second proof against the CEO's own fix.

**A reason that does not describe the thing it covers is how a gap survives a reading** — twice in one day, in unrelated PRs. `client/**` floored `lite` for *"no filesystem access, no process spawn"*, false for `client/vite.config.ts` which pins a loopback binding. A scanner exclusion justified by *"imports in this codebase are one per line"*, while the neighbouring test file had six multi-line imports. Both sentences were checkable, wrong, and read past repeatedly because they sounded like reasons.

Also recorded: **attack the premise, not the pattern**; **a fix can create the self-match it then has to exclude**, and the exclusion becomes the weakest point; and **do not mix measurements taken across a code change and attribute the spread to the environment** — a warm range quoted a figure from before the fix that removed a 13 ms write from that path, blaming on load part of a spread the PR's own defect caused.

**A CEO pattern worth naming, since four of the day's errors share it: every one was a fact repeated rather than checked.** A local `main` ref 41 commits stale, which a builder had flagged hours earlier and which then produced a wrong instruction to a reviewer. A figure taken from a commit message and inflated 4,876× while praising the finding it came from. A SHA carried from a previous message into two mis-anchored review briefs. A rebase status inferred rather than read. **None needed a new instrument; all four were caught by builders and reviewers rather than by the CEO.**

Verification: `npm run check` exit 0 on `85a9eb9`. Classifier floor `trivial`. No independent review — documentation of findings each already executed and independently reviewed in their own PRs.
