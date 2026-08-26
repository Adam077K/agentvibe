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
Docs and memory only, no code. `docs/STATUS.md` rewritten to ground truth, every figure measured in this worktree: `main` = `71fd58d`; **117** session files (it said 105); `npm run check` **30 of 30 · 0 failed**, wall clock deliberately unpinned (79.7s / 82.8s / 125.9s on one commit); `.qa/` absent, so the gate has never written a verdict; `ci.yml` at **30 steps · 1 job · 0 `if:`** with the red step at **#18**, so **12** never run; `framer` at **0** dispatches against builder 4, sourcer 4, designer 2.
**13 handoffs bannered HISTORICAL** (+3/−0 each, bodies untouched); `_TEMPLATE.md` now refuses a new per-session handoff and routes to `STATUS.md`. Four founder decisions recorded as **one** `DECISIONS.md` entry: **37,058 → 39,675** of 40,000 bytes — **325 bytes of headroom, so the next entry breaches the cap.**
**Two brief premises were false and are NOT implemented as written.** `IMPLEMENTATION-PLAN.md` already carried a SUPERSEDED banner, so it was left alone rather than double-bannered; both in-flight branches were still at `71fd58d`, zero commits ahead, so `STATUS.md` says *in flight, not verified here*. Branch-protection facts are attributed, not claimed — `gh` is denied by the sandbox's `denyRead`.
**Branch protection's flip is deferred to Wave 2 on an ordering constraint:** `qa-lead-pass.yml`'s `on:` names `pull_request` with no `push:`, so `enforce_admins` would make a required check unsatisfiable on the push route and strand `warroom merge`'s local-only commits. CODEOWNERS dropped — no `required_pull_request_reviews` exists and no CODEOWNERS is in the tree.
**A third control disagreement, and one dead inherited citation.** The sandbox denies `~/.claude/plans/` while the hook allows it — and the earlier instance runs the *opposite* way, sandbox granting where the hook refused. The 2026-08-23 handoff has no `§0.2` (its headings run 0, 1, 1.5, 2, 3, 3.5, 4, 5, 6), so `§0` is cited instead and the dead reference was not propagated.
**Verification:** `npm run check` → 30 of 30 · 0 failed; `check-memory-budget.mjs` → passed; every relative link in both new files resolved by script. Measure from the path `git worktree list` prints — a stale path cost this session a run that falsely reported 19 of 30.
