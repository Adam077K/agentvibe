---
role: ceo
task: codex-fleet-rollout
date: 2026-09-10
tier: irreversible
qa_verdict: NOT_RUN
branch: vision-path-and-warroom-codex
head: 683328b
---

Codex runs beside Claude in the war room, on ten projects. `<session> --engine codex`, `--engine N:codex`
to mix, `--grid` works with both. Verified live, not inferred: 10/10 projects resolve the launch line, a
real pane comes up, and `codex debug prompt-input` shows the preamble reaching the model (42,113 bytes,
five sentinels, negative control clean). Per-project identity is real — agentvibe's brief names
`reviewer-readonly reviewer sourcer`, ghostb's names `adversary-engineer qa-lead`.

Two defects that only surfaced by launching it. A Codex pane opened on an update chooser whose default
action was `npm install -g` (fixed). Behind it a directory-trust prompt, deliberately left — one keypress
per project, and a launcher answering it for you is the wrong instinct.

The acknowledgment left git. It was `codex_unsandboxed_ack:` in a tracked `.warroom.yml`, so a PR could
flip the control gating an unsandboxed pane, and it existed on this branch but not `main` — `git checkout`
moved the machine's security posture. It is `~/.warroom/codex_ack` now, which also made a ten-project
rollout one file instead of ten commits.

**The launcher bugs this work uncovered are worth more than the feature.** `restore` destroyed a running
war room and then refused — twice over, by two different doors. An unreadable snapshot (`b7c6d72`) and a
readable one recording zero CEOs (`db5406f`). Both predate Codex. The second ate a live `ceo` session on
2026-09-11 before anyone knew it existed. Four window-name sites were also reading `sed 's/CEO-//'`
unguarded into arithmetic, a path, a `python3` argv and a grep pattern.

**`qa_verdict` is NOT_RUN, and that is the honest field value.** The binding multi-judge gate BLOCKed this
branch (three findings, all since closed) and was then stopped at the founder's direction — "don't run a
full QA, use a couple of subagents." What ran instead: two independent reviewers, both PASS. `rev-correct`
measured the restore path across 22 snapshot shapes and 30 hostile window names, all driven through the
real launch path. `rev-tests` independently re-applied all nine of the author's mutation claims and
confirmed each killed exactly the test and assertion claimed. A third agent, `wr-tests`, cold-confirmed the
zero-CEO defect against HEAD without being told the answer. That is real review and it is not the tier's
2-of-3 multi-family panel, so the field says NOT_RUN rather than borrowing a word it did not earn.

Oracle: `npm run check` 48/48 exit 0 on a clean tree at pinned sha `683328b`. `check:warroom` **122 pass ·
0 fail**, re-measured at HEAD after this file first claimed `121→124`. That figure was invented in
synthesis and caught by the builder who had measured it: baseline 118, plus three restore tests, plus one
broadcast test, is 122, and there is no route from 118 to 124 with four tests. It is the same defect as the
`29 of 30` → `29 of 29` incident CLAUDE.md records — the worker measured correctly and the orchestrator's
summary lost it. Derive this number, never quote it: `npm run check:warroom`.

Known and unfixed, recorded rather than buried: `bin/warroom:3298` still prints `✗ No CEOs could be
restored` after the kill — reachable only on the documented missing-branch arm, so not a third instance,
but still a case where a live session is lost and the founder is told afterwards. `ml2` is unmigrated (its
preamble is inlined). `cmd_files`' `declare -A` is broken on bash 3.2, pre-existing.

Process note, because it cost more than the feature did. Three agents wrote into one worktree; the only
reason nothing was destroyed is that a builder declined to write over a hunk it could not attribute. No
instrument in this repo would have caught the loss — `git log -S` is silent either way for an uncommitted
edit killed by a `cp`. The reviewer's own verdict on its method is the durable fix: mutate a scratch clone,
never the live tree.
