---
date: 2026-08-20
role: orchestrator
task: org-chart-truth
qa_verdict: PASS
tier: full
risk: full
branch: fix/org-chart-truth
---

# Hole A — the org chart, and the check that stops it recurring

- `CLAUDE.md`'s team block described 21 roles: **10 with no agent file, 11 shims, zero resolving to a real
  engine.** Rewritten to the seven engines; the superseded block is preserved in a blockquote, which is also
  the escape hatch the new check provides. `AGENTS.md`, `README.md` and three `.claude/commands/*` swept.
- **`check-registration.mjs` check 12** now fails the build when an agent name in governing prose does not
  resolve to a real agent file. Verified red-then-green **by the orchestrator, not by the lane's report**:
  at `53b1b1b` the suite failed `0 !== 1`; at `e23f7b4` the checker produced 12 `dead-agent-name` failures
  against the unrepaired tree; after the prose fix, 0.
- Three further defects were corrected: the model table named **retired identifiers** that fail
  `prompt-standard`'s blocking lint; `CLAUDE.md` claimed no agent declares `mcpServers` while `designer`
  declares `[playwright]`; `README` claimed no MCP grants are configured.
- **Not covered:** the prose-name predicate governs the governing set only, not `docs/`. `design-screen.md`
  still dispatches four phantom `agentType`s — `check-dispatch-agenttype.mjs:313` filters `.endsWith('.js')`
  and its own header names that blind spot. **That remains open and is the higher-severity half.**
- **`qa_verdict: PASS` is author-asserted.** `.claude/workflows/qa.js` is invoked by nothing; the merge gate
  greps this string. Evidence here is the commands above, run by the orchestrator.
