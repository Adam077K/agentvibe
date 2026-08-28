---
date: 2026-08-26
role: builder
task: wave-decision-recorded
qa_verdict: PASS
tier: lite
risk: lite
branch: docs/wave-decision
---
# The wave's defining decision, recorded

One entry appended to `.claude/memory/DECISIONS.md` — *"Done is 'the loop runs itself'; nine PRs wired the
circulation and did not start the heart."* **33,413 → 37,261 bytes** of 40,000, 29 → 30 entries, budget
check passing, **2,739 bytes of headroom left**. Nothing else under `.claude/memory/**` was touched.

**Every checkable figure was re-derived here at `d1294a4` rather than copied from the brief:** 127 commits
in `47dbbd6..d1294a4`, 50 verdict records, `framer` at **5** dispatch sites, **6 of 6** playbooks carrying
`triggers:`, and `sourcer` at `mcpServers: [claim-append]` with `tools: [Read, Glob, Grep, WebSearch,
WebFetch]` — no `Write`, confirming the grant is narrow. Main's 57/57 CI figure is attributed to the team
lead in the entry, not claimed: this sandbox has no network.

**A branch switch to main left a silent partial checkout** — 158 half-updated paths while HEAD never moved,
because the sandbox denies `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`. Recovered by
escalating that one command, the remedy CLAUDE.md documents. Nothing was lost: the prior work was committed
and merged first.

**Two safety-hook false positives, both documented, neither bypassed.** The hook flattens the whole command
and matches the destructive-`git`-subcommand rule at any distance, so a harmless `echo "(...)"` beside a
`git status` was refused; reworded. It also scans heredoc *bodies*, so this file's own description of that
rule was refused while being written — resolved with the Write tool, which checks `file_path` only. Both
behaviours are recorded in `pre-tool-use.sh` and the 2026-08-23 handoff §0.

**Verification:** `npm run check` → **48 of 48 passed · 0 failed · 209.8s** at `d1294a4`; the local suite
is 48 steps here, which is neither the 43 of the integration branch nor CI's 57.
