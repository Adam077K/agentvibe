# Ship protocol — build round 3 (orchestrator ceo-1, 2026-10-03)

You are shipping a job whose code has an Opus SHIP verdict. You do not change behaviour.

1. **Worktree.** Use the existing worktree named in your brief, with the sandbox ON. Run `git status`: it must be clean. If it isn't, STOP and report.
2. **Update.** `git fetch origin main <your-branch>`, allowing github.com in allowed_domains. Merge origin/main into your branch.
   - If the merge conflicts outside the job's own files, or changes behaviour, STOP and report.
   - A trivial conflict inside the job's files, where both sides are kept, is OK. List it.
3. **Re-verify.**
   - Go runs offline only: `GOPROXY=off GOCACHE=$TMPDIR/gocache GOMODCACHE=$HOME/.agentvibe/gomod`.
   - Run the touched packages with and without `-tags donetest`, plus `-race`.
   - Run `node build/check-done-tests.mjs`.
   - Run the Kernel size check (avk-boundary). The budget is 11,000 until PR #167 merges, then 15,000. Report the number, but don't block on budget alone.
   - Unix-socket tests fail under the sandbox. If running them unsandboxed is refused, note it and move on.
4. **Never record a verdict yourself** (founder ruling, 2026-10-03: the REVIEWER records, never the builder). Leave any `.qa/verdicts/` file alone.
5. **Session file.** Update `docs/08-agents_work/sessions/2026-10-03-builder-<job>.md`: `qa_verdict: PENDING`, `tier: full`, and the single-family caveat ("one Opus 5.5 reviewer; the cross-family review is owed"). The reviewer flips it to PASS.
6. **Push and open the PR.**
   - `git push origin <your-branch>`, always naming the branch. Never force.
   - Open a PR to main with `gh`. Run gh unsandboxed, because the sandbox denies `~/.config/gh`.
   - Body: summary, tests, kernel lines, review history, follow-ups and merge-order notes, all from your brief. End the body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
   - Label `risk:full`. Do NOT enable auto-merge.
7. **Commits** end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
8. A hook or classifier refusal means stop and report. Never route around it: not with another command, not in another directory, not with a copy.

Return ≤60 words: the PR URL, `verdict check` output, kernel lines, and any deviation.
