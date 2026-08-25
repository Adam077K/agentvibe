---
date: 2026-08-25
role: builder
task: one-living-status
qa_verdict: PASS
tier: lite
risk: lite
branch: docs/one-living-status
---
# One living status; the handoff chain retires

Documentation and memory only — no code touched. `docs/STATUS.md` rewritten to today's ground truth, every
figure in it measured in this worktree: `main` = `71fd58d`, **117** session files (it said 105), `npm run
check` **30 of 30 · 0 failed · 82.8s**, `.qa/` absent so the gate has never written a verdict, `ci.yml` at
**30 steps · 1 job · 0 `if:`** with the red step at **#18**, so **12** steps never run — and `framer` at
**0** dispatch entries against builder 4, sourcer 4, designer 2.
**13 handoffs bannered HISTORICAL** (+3/−0 each, 39 insertions, zero deletions — bodies untouched);
`_TEMPLATE.md` now refuses a new per-session handoff and routes to STATUS.md. Four founder decisions
recorded as **one** entry in `DECISIONS.md`: **37,058 → 39,675 bytes** of 40,000, check passing, **325
bytes of headroom left — the next entry breaches the cap.**
**Two brief premises were false and are not implemented as written.** `IMPLEMENTATION-PLAN.md` already
carried a SUPERSEDED banner, so it was left untouched rather than double-bannered; and the two in-flight
branches were still at `71fd58d` with zero commits ahead, so STATUS.md says *in flight, not verified here*.
Branch-protection facts are attributed, not claimed — `gh` is denied by the sandbox's `denyRead`.
**Verification:** `npm run check` → 30 of 30 · 0 failed; `check-memory-budget.mjs` → passed; every relative
link in both new files resolved by script. Measure from the path `git worktree list` prints: a stale path
cost this session a full run that falsely reported 19 of 30.

**Second round — three additions, all verified in-tree.** The floor figure is `30 of 30 · 0 failed` with
the **wall clock deliberately unpinned**: the same suite on the same commit took 79.7s, 82.8s and 125.9s
across three runs. Branch protection's flip is **deferred to Wave 2** on an ordering constraint —
`qa-lead-pass.yml`'s `on:` at `:45` names `pull_request` with **no `push:`**, so `enforce_admins` would make
a required check unsatisfiable on the push route and strand `warroom merge`'s local-only commits; CODEOWNERS
dropped, since no `required_pull_request_reviews` exists and no CODEOWNERS is in the tree. And a **third**
control disagreement: the sandbox denies `~/.claude/plans/` while the hook allows it.
**One inherited citation was dead and was not propagated.** The 2026-08-23 handoff has **no `§0.2`** — its
headings run 0, 1, 1.5, 2, 3, 3.5, 4, 5, 6. Cited `§0`, where the content is, and recorded that the earlier
instance runs the **opposite way**: there the sandbox granted and the hook refused.
