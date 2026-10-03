# Reviewer records the verdict (founder ruling, 2026-10-03)

Only the reviewer who judged the work records its verdict. The builder never does.

Do this only after your own review returns **SHIP**, and only on the exact head you reviewed. If the head has moved since you reviewed it, review the delta first.

1. **Worktree.** Use the worktree named in your brief. Run `git status`. Delete any stale untracked `.qa/verdicts/*.json` the builder left; it is not yours. If you find anything else unexpected, STOP.
2. **Session file.** In `docs/08-agents_work/sessions/2026-10-03-builder-<job>.md`, set `qa_verdict: PASS` with a one-line sed edit, and add the line `verdict recorded by: <your name>, Opus 5.5, single family`. Commit it as `docs(session): <job> qa_verdict PASS (reviewer)`.
3. **Record.** Run:
   `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.abbrev GIT_CONFIG_VALUE_0=8 node scripts/verdict.mjs record --verdict PASS --by "<your name> (opus-5.5)"`
   CI hashes the diff with 8-char abbreviations until PR #168 merges, which is why the setting is there.
4. **Check.** Run `verdict.mjs check` with the same env. It must say `ok:true`. Commit as `qa(verdict): PASS`.
5. **Push.** `git push origin <branch>`, naming the branch, with github.com allowed. Never force.
6. **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
7. **Refusals.** If the classifier or a hook refuses any step, STOP and report. Don't route around it.

Return the sha and the `check` output.
