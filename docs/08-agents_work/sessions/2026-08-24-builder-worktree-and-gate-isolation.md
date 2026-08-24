---
date: 2026-08-24
role: builder
task: worktree-and-gate-isolation
branch: fix/worktree-protocol-and-gate-isolation
tier: full
qa_verdict: REVIEWED-PASS-GATE-NOT-RUN
gate_run: false
gate_blocked_by: "npm run check does not pass on main — check:mc fails on mission-control/test/stream.test.ts:249 (EADDRINUSE); no branch in this series touches mission-control"
review_rounds: 2
deviation_authorised_by: founder, 2026-08-24
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

**Deliberately half-done, and the other half is named.** The worktree protocol is corrected in
`CLAUDE.md` and marked superseded in `worktree-isolation-pattern/SKILL.md`. It is NOT marked in
`.claude/agents/builder.md:64-72` or `designer.md:65-67`, and `schema-lint.js:1068` still REQUIRES the
superseded `MAIN_REPO=` block — so `lint:agents` is green only because those files still contain what
CLAUDE.md now calls wrong. Those are irreversible tier and would have raised this documentation PR's
floor. Review verdict on legibility: legible from CLAUDE.md and the skill, NOT from the worker's own
highest-authority prompt, where the broken command is Step 1. Founder decision 2026-08-24: carry to
the next session as REQUIRED, not optional, with the exit criterion that a builder reading only its
own file gets the correction; bundle with the lint predicate as one irreversible PR.

**Gate deviation.** The binding gate did not run — its oracle cannot pass while `check:mc` fails on
`main`. Two blinded review rounds instead: round 1 FAIL (2 P1 — the recommended command exits 128
under the armed sandbox; the fix landed only where no mechanism reads it), round 2 PASS.
`qa_verdict` is deliberately not `PASS`: no gate run produced one.
