---
role: builder
task: produce-verdict — the step that makes a QA verdict exist
date: 2026-08-28
branch: feat/produce-verdict
base: b4ea862
tier: irreversible
tier_driver: scripts/lib/check-suite.js (scripts/lib/**)
qa_verdict: PASS
---

- `scripts/produce-verdict.mjs` closes `router emits invocation → ??? → gate checks a binding`. It launches the panel in a bare session whose cwd holds `origin/main`'s `.claude/workflows/**`, verified blob-by-blob, then decides **only** from `verdict.mjs check` — never from the session's prose (the `tool_result` is a launch receipt).
- Four terminal states, four exit codes, no collapse: PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3; `established = outcome !== REFUSED`, the shape `.claude/gates.yml`'s `recording_hazard` asks for.
- Reads `invocation.args` and the router's **exit code** only. Refinement on the brief: keying "not required" on `invocation === null` alone is fail-OPEN, because `refuseTree()` emits `invocation: null` with `gateRequired: true` at exit 2. Both arms pinned.
- No `Workflow` grant, no `mcpServers`, no agent definition touched — `PS-WORKFLOW-CONTAINMENT` satisfied by design, not argued with.
- Cost: a bound verdict short-circuits before any launch (a panel run measures 2.5–3.8M tokens / 40–50 min).
- Evidence: `node --test scripts/produce-verdict.test.mjs` 24 pass · 0 fail; `npm run check` 49 of 49 · 0 failed; 8-cell mutation table, 6 FIRED as predicted and 2 SILENT as predicted.
- Two instrument failures caught and corrected mid-run: the first mutation table wrote to `/tmp` (sandbox-denied), so the redirect failed and every cell read FIRED; and the exit-2 discriminator test asserted only the outcome, so deleting the check was SILENT.
- **Standing caveat:** author-recorded against a deterministic floor, one agent, one model family. `irreversible` asks 2-of-3 multi-judge and ≥2 model families; neither is met. *The checks ran and are green* is not *the tier was satisfied*.
