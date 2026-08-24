---
role: ceo
task: continue-the-build
date: 2026-08-24
branch: ceo-1-1787566829
tier: irreversible
qa_verdict: REVIEWED-PASS-GATE-NOT-RUN
gate_run: false
gate_blocked_by: "npm run check does not pass on main — check:mc fails on mission-control/test/stream.test.ts:249 (EADDRINUSE), deterministic across two runs. No branch in this series touches mission-control."
deviation_authorised_by: founder, 2026-08-24
founder_signoff: "2026-08-24 — irreversible tier (PR-3) signed off explicitly"
---

# Session — continue the build

Five PRs split by TIER, so irreversible files paid the expensive gate once rather than four times.
Four merged: `c0e52dc` docs+memory · `17bba08` citation checker · `60d64b0` linter/gate/CI ·
`181f153` worktree protocol + gate self-review. PR-4 (test seam) held for its review.

Six blinded reviews, **four FAIL verdicts, ten P1s**. Not one was found by a deterministic check —
every suite was green on every branch when each review began. The 79-agent panel was never dispatched:
three gate runs, three oracle blocks, zero reviewers.

## The gate, measured for the first time
`.qa/verdicts/` was empty — **no gate run had ever completed in this repo.** Two blockers, in layers.
(1) `test:skill-clamp` and `test:registration` built fixtures inside `.claude/agents/` and `.claude/hooks/`,
which the armed sandbox denies, so the oracle blocked every diff before dispatching a reviewer. Fixed by
PR-4; `npm run check` went 26→29 of 29 locally. (2) `check:mc` fails on a pre-existing mission-control SSE
test. Still blocking. **Neither change that caused (1) was wrong**: arming the sandbox (#94) and oracle-first
ordering each landed correctly, collided, and nothing watched the seam. PR-4 adds a preloaded tripwire that
turns the next collision into a red test in CI.

## Eight defects of mine, every one caught by an agent
1. `check:mc` "exits 0 while skipping" — read `$?` through a pipe, got `tail`'s status.
2. Attributed a pre-existing rotted citation to PR-1.
3. Substituted a **guess** for a dead citation instead of marking it unresolved — the exact class the PR fixed.
4. Led the witness on `--anchor-slack`; the mechanism runs the opposite way.
5. Referenced findings F9–F11 without sending their content.
6. Enumerated "the eight changes" on a nine-file diff; the session's worst P1 lived in the unnamed file.
7. Two-dot diff after main moved — rendered main's work as the branch's deletions. Caught by two reviewers independently.
8. F2 instruction self-contradictory: ruled `.claude/agents/**` out of scope AND asked for call sites in it to be marked.
Plus: told PR-4 to narrow scope on a correct measurement and a wrong inference. **It refused, showed the probe, and was right.**

## Findings that outlive these PRs
- **5 of 5 subagents went idle without reporting.** Every verdict came from chasing. Any design needing N
  reviewers to self-report is unreliable at N=1; the 79-agent panel presumes it works at N=79.
- **`allowWrite`'s `**/.worktrees` entries do not do what they were added for.** `git worktree add` still exits
  128 there. Answers SANDBOX.md:229-240's "someone must actually run this" and :250's "STILL UNVERIFIED".
- **`--json` truncated at exactly 65536 bytes** — `process.exit()` does not flush an async pipe write.
  `check-dispatch-agenttype.mjs` and `check-dispatch-prompt-size.mjs` share the pattern, under the cap today.
- **The push route accepts commits having run 0 of 2 required checks.** Confirmed four times this session.
- **`c-read-only-binding-unverified` is unresolvable twice over** — empty judge panel, and its probe protocol
  has only FAIL and UNRESOLVED outcomes. It can never resolve, only expire.
- **Shell cwd silently resets across worktrees.** Three agents hit it; one nearly reviewed the wrong branch.
- **The citation checker closed its first loop in the wild**: it flagged `CONTROL-PLANE.md:985`, PR-1 fixed
  that pointer, the checker now agrees. It also caught its own author's session file.

## Carried, not closed
`builder.md:64-72` and `designer.md:65-67` still teach the worktree command that exits 128, and
`schema-lint.js:1068` still REQUIRES it — `lint:agents` is green only because they do. Both irreversible tier.
Founder decision: next session, REQUIRED not optional, exit criterion = a builder reading only its own file
gets the correction. Bundle with the lint predicate as one irreversible PR.
