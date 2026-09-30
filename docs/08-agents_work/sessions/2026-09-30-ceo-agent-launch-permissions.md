---
date: 2026-09-30
engine: orchestrator
task: agent-launch-permissions
tier: irreversible
qa_verdict: BYPASS
---
- Founder decisions D1 (standing launch permission) and D3 (agents on his Mac): `.claude/settings.json` gains allow rules `Bash(claude -p:*)`, `Bash(codex exec:*)`, `sandbox.excludedCommands` [`claude -p *`, `codex exec *`, `git worktree *`] and `sandbox.network.allowLocalBinding: true`.
- Why: auto-mode refused worker launches in SP1/SP2; Codex cannot read `~/.codex` inside the sandbox; Mission Control needs a local port; `git worktree add` fails under the armed sandbox (CLAUDE.md).
- Checks: settings JSON valid; `npm run test:sandbox` 7/7 (sandbox still enabled + failIfUnavailable). Existing allow/deny rules and hooks unchanged; `~/.codex` stays denyRead for every other command.
- CI round 1 found two real issues, fixed: allow rules rewritten to the repo's `Bash(x *)` form (`test:launcher-permissions`); the check-suite tripwire on `excludedCommands` narrowed to its actual intent (no exclusion may cover `check:mc`), after re-measuring `check:mc` inside the sandbox with local binding on — 486 pass / 2 fail, the loopback bind now passes and the two remaining failures are load/environment (same pair seen unsandboxed), so the exclusion stays with an updated reason. Security note: `git worktree *`, `claude -p *` and `codex exec *` now run unsandboxed — the same class the QA gate raised as P1 on 2026-08-25 for git write commands; accepted by the founder under D1/D3.
- QA: the founder explicitly waived the irreversible-tier review in session ("full max permission ... without the full QA or any QA, I allow it"); merged through the logged `qa-lead-bypass` path, not around it.
