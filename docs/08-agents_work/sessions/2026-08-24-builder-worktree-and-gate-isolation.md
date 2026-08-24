---
date: 2026-08-24
role: builder
task: worktree-and-gate-isolation
branch: fix/worktree-protocol-and-gate-isolation
tier: full
qa_verdict: PENDING
---

**(1) Worktree protocol — location corrected, DELIBERATELY HALF DONE.** `CLAUDE.md` anchored children at
`$MAIN_REPO/.worktrees/`, a sibling of the session project root — the only root `pre-tool-use.sh` lets `Write`
reach. Now `$(git rev-parse --show-toplevel)/.worktrees/`, correct from any cwd inside that root (narrowed after
review; false from the main repo). Not presented as working: under the armed sandbox `git worktree add` fails
everywhere (exit 128 on `.claude/agents/**`, `.claude/commands/**`, `.mcp.json`), and `allowWrite`'s
`**/.worktrees/**` does not lift it — re-measured. Remedy is escalation. **Other half:** `schema-lint.js`
still requires the superseded `MAIN_REPO=` block (warns, not fails), as do `builder.md`/`designer.md` —
irreversible tier, deferred to one follow-up PR; only SKILL.md is marked here and CLAUDE.md says so outright.
**(2) Gate self-review.** `run-gate.mjs` flags any changed `.claude/workflows/` path in both channels
(`gateSelfReview`, null when clean), reporting rather than resolving; `scriptPath` and exit logic unchanged.
