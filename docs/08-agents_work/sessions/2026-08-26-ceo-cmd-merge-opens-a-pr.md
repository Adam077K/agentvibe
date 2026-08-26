---
date: 2026-08-26
role: ceo
task: cmd-merge-opens-a-pr
qa_verdict: PASS
tier: full
engines: [builder, reviewer]
claims_touched: []
---

# `warroom merge` merged where nothing could see it, and would push an arbitrary ref to get there

**Decision.** Reviewed at the lean weight — blinded panel plus a blind adversarial delta, against the
deterministic floor — not the full `qa.js` gate. `bin/**` tiers `full`, but the founder's standing rule
puts the binding gate on the surfaces `git revert` does not undo: workflows, agent definitions, hooks,
the gate itself, credentials. This is none of them. Recorded so the weight is a choice, not an omission.

**Prerequisite discharged.** Wave 2.7 — flipping `enforce_admins` — was blocked on this. With the only
merge route bypassing origin, requiring status checks on `main` would have made that route permanently
unusable rather than merely wrong.

**Evidence.** One blind adversarial delta reviewer, `independence: provenance`, own fixtures under
`$TMPDIR`, no session file or self-assessment read: PASS, 0 P1, 0 P2, 3 P3. 29 hostile `$n` inputs and
10 hostile push destinations, each driven for real with the upstream refs diffed before and after —
all refused with no state change, under four locales. `_open_pull_request` has one caller and the guard
is its first statement, so no path reaches a push with the destination unvalidated. `test:merge-gate`
39 pass (was 33), `check:warroom` 14 pass, `npm run check` 30 of 30.

**Correction, and it is the important line.** A prior round recorded that the injection
`merge 'x$|main$|y'` *"only failed because the fixture upstream was non-bare."* Re-run against an
upstream configured the way GitHub behaves (`receive.denyCurrentBranch=ignore`), the pre-fix build
**succeeds**: exit 0, `origin/main` moved to the local SHA, `gh pr create --base main --head main`
invoked, `merge_pr_opened` logged. The refusal was the fixture's, not the program's. The defect was
live, not attempted. **"It failed" is not "it refused"** — when a hostile input is recorded as blocked,
the question is which layer blocked it, and if the answer is the test environment then nothing was.

**Correction, second.** The lane argued the nine `grep "^ceo-${n}:"` sites are safe because `|` is
literal in BRE. The premise is right and the conclusion does not follow: `.`, `*`, `[` and `\{` are BRE
metacharacters, and `warroom done '.'` selects a different CEO than the one named and then wipes every
line of the registry. Bounded — the worktree path is a literal quoted string, so a metacharacter `$n`
matches no worktree and the push / `branch -d` block is skipped entirely, and `$branch` there never
derives from `$n`. Local corruption, operator-typed, no remote reach. Recorded as backlog, not fixed
here. Checking the one metacharacter that was reported is not checking the input.

**One P3 fixed in-branch, and it was ours.** Three sites claimed `_open_pull_request` is the only route
from this program to origin. It is not: `cmd_done:889` pushes to origin ungated. Verified independently
before acting. Narrowed the claim rather than widening the control — the guard is byte-for-byte
unchanged. The third site was inside the heredoc `gh pr create` posts, so the false claim was being
published into real PR descriptions, where it misleads a reviewer who never opens the file. No check
added: a grep over comment text is defeated by rewording, which is the `check:mc` defeat pattern this
session already shipped and caught, and an execution-based check would need `tmux` scaffolding the size
of `merge-gate.test.mjs` for a comment fix. Said so rather than adding a check that reports green.

**Residuals, deliberately out of scope.** `war-room/bin/PROJECT_NAME.tmpl:1988` carries the identical
unfixed defect with no digit guard and no destination guard — the template is what every generated
project gets, so fixing `bin/warroom` alone fixes this repo and ships the hole to the fleet. Belongs
with P1 portability. `merge 1 --brief --local` silently loses `--local`; harmless by luck, since a
swallow can only strand the operator on the gated route.

**Not an independent panel:** single model family throughout.
