---
role: builder
task: mcp-hook-policy
date: 2026-08-16
qa_verdict: PASS
tier: irreversible
---

- Matcher `mcp__playwright__browser_navigate` → `mcp__`: 22 of playwright's 24 tools reached no safety control, `browser_run_code_unsafe` among them.
- New `.claude/mcp-policy.json` + `mcp_policy_check()` in `pre-tool-use.sh` decide by SCOPE, not server name — a server absent from both the policy and `.mcp.json` is user scope, allowed untouched and unlogged.
- Ships `mode: shadow` per ADR-001:123-125; `credentialed: true` blocks regardless of mode, hard-coded in the hook rather than left to a review process.
- Fails closed: unparseable policy, unknown mode, undeclared `credentialed`, a server in `.mcp.json` with no policy entry, and an unreadable `.mcp.json` all BLOCK. Absent policy = mechanism off = today's behaviour.
- One `events.jsonl` line per governed call (`event: mcp.call`), closing GRANT-HOLDERS.md §4.14/§5.14 "no per-call record of an MCP invocation". stderr only for would_block/block.
- Tests 134 → 149; 13 of the 15 new ones verified RED against the unpatched hook. `scripts/launcher-permissions.test.mjs` pinned the old narrow matcher and was rewritten — outside declared ownership, flagged to the lead.
- All 20 `npm run check` steps PASS. `check:mc`'s "claim counts by verdict" (`test/crosscheck.test.ts`) is a LOAD-dependent pre-existing flake, not this change: run concurrently under identical load, pristine `origin/main` FAILED it 68≠69 while this branch passed 320/320; `ledger verify --offline` prints `69 pass · 5 would_block · 0 block` byte-identically on both trees.
- Latency (n=40 interleaved, medians, box at load 8-17): Bash/Edit/Write +18.6 ms; MCP calls 0 → ~190 ms, because the matcher never routed them to the hook before. NOT re-measured by the landing session.
- Deleting `.claude/mcp-policy.json` turned governance off and failed nothing, while deleting the hook fails check 1. Check 11 of `check-registration.mjs` now guards the DATA a hook reads, derived from the hook so there is one source of truth; 3 of its 5 tests verified RED without it.
