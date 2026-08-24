---
date: 2026-08-24
role: builder
task: worktree-and-gate-isolation
branch: fix/worktree-protocol-and-gate-isolation
tier: full
qa_verdict: PENDING
---

**(1) Worktree protocol.** `CLAUDE.md` anchored child worktrees at `$MAIN_REPO/.worktrees/`, a sibling of the
session project root — the only root `.claude/hooks/pre-tool-use.sh` lets `Write`/`Edit` reach. Corrected to
`$(git rev-parse --show-toplevel)/.worktrees/`, at or below that root from every position an agent can occupy.
Verified by driving the hook per case and by real `Write` calls: the old path is refused *by name*, the new one
allowed, and an end-to-end `git worktree add` gave 25 entries with clean `git status` — not the ~800-phantom-
deletion tree. Superseded text kept at the point of citation; the three consequences recorded, plus why the #96.3
"widen the hook" template is the wrong resolution here. **(2) Gate self-review.** `run-gate.mjs` now flags any
changed path under `.claude/workflows/` in both channels (`gateSelfReview`, null when clean). It reports rather
than resolves, and says so: reviewing copy from `main` vs oracle in the PR tree pull one cwd two ways. Emitted
`scriptPath` deliberately unchanged. 7 tests added, 6 RED first. All seven verification commands exit 0.
