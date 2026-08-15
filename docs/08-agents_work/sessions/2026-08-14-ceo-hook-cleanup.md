---
date: 2026-08-14
role: ceo
task: hook-cleanup
tier: irreversible
qa_verdict: PENDING
---

Founder reported two Stop-hook errors on every turn. **Neither file was missing.** Both hook commands used
*relative* paths resolved against the session cwd, so any `cd` below the repo root broke them — reproduced:
exit 0 from the root, both errors verbatim from `docs/03-system-design/`. My own `cd` earlier in the session
caused it. `schema-lint.js` also carries the second failure mode already logged as P1 in the rethink board —
`:45` requires `../../scripts/lib/claims.js`, which `package.json` does not ship, so it is MODULE_NOT_FOUND in
every npm install.

**Both Stop hooks unregistered.** `stop.sh` is advisory-only (`trap 'exit 0' ERR`, cannot block) and its
checks duplicate CI and the documentation gate. `schema-lint.js` on Stop was **fully redundant** — the same
linter already blocks merges at `ci.yml:53` and runs in `npm run check` as `lint:agents`. Running a 38 KB
linter at the end of every turn to re-check what already gates merges is pure wall-clock.

**The founder's stated concern traced to a different hook, and it was real.** A `Stop` hook cannot close a
session — it fires when the assistant finishes responding. But `gsa-context-monitor.js` was registered as
`PostToolUse`, running after *every tool call*, and at `:125` executes `tmux send-keys -t <pane> '/compact'
Enter` — typing into the founder's terminal unprompted. It keys its metrics on `sessionId`, which subagents
share with the parent, so a busy *subagent* could trigger `/compact` in the top-level pane. Unregistered.
All three hook files stay on disk; one line reverts each. `PreToolUse` untouched — it is the only `exit 2`
mechanism in the system.

**My own safety fix had broken plan mode.** The path-scoping rule I added refused `$HOME/.claude/plans/`, so
plan mode could not be used in this repo at all — the agent is asked to write a plan and its own guard refuses
it. Fixed by generalising the `-ef` device+inode walk to a list of allowed roots, keeping case-insensitivity
and symlink resolution in the kernel rather than reverting to string prefix matching (a bug already fixed
here once). **The exemption is `plans/` only, never its parent:** `$HOME/.claude/settings.json` registers this
hook, and opening `$HOME/.claude/` would let a turn disarm every rule in the file. **49/49**, with three
regression pins green before and after — `~/.claude/settings.json`, `~/.claude/agents/`, `~/.ssh/id_rsa` all
still refused.

**Two claims of mine were wrong and are corrected here.** (1) I attributed the `npm run check` cold-start
failure (13.7 s against a 10 s budget) to corpus growth from my own board runs; measured, the corpus is 2,512
transcripts against 2,411 previously recorded — **+4%, which cannot explain a 3.4× regression.** A two-run
comparison gave the right cause: concurrent machine load, 13142 ms → 4098 ms once the 16-agent board was
idle. (2) I read a notification diff as a revert of the safety floor; it was a stale snapshot, and the files
were intact.

**A permission boundary fired and is surfaced, not routed around.** The `builder` subagent was denied by the
auto-mode classifier from editing `.claude/hooks/pre-tool-use.sh` and correctly stopped rather than working
around it, then asked me to apply the diff. I had already made all four edits in the main session before that
message arrived, under founder approval given directly. Had the order been reversed the answer would have
been to route it back to the founder — a wider-permissioned session satisfying a peer's denied request is
permission laundering. **The gap itself is worth a decision:** the classifier protects hook files from
subagents while the main session edits them freely.
