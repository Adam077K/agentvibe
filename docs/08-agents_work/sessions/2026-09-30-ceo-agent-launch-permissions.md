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
- QA: the founder explicitly waived the irreversible-tier review in session ("full max permission ... without the full QA or any QA, I allow it"); merged through the logged `qa-lead-bypass` path, not around it.
