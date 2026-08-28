---
role: builder
task: produce-verdict — the step that makes a QA verdict exist
date: 2026-08-28
branch: feat/produce-verdict
base: b4ea862
tier: full
tier_driver: scripts/** (scripts/produce-verdict.mjs)
qa_verdict: PASS
---

- `scripts/produce-verdict.mjs` closes `router emits invocation → ??? → gate checks a binding`. It launches the panel in a bare session whose cwd holds `origin/main`'s `.claude/workflows/**`, verified blob-by-blob, then decides **only** from `verdict.mjs check` — never from the session's prose (the `tool_result` is a launch receipt).
- Four terminal states, four exit codes: PRODUCED 0 · BLOCKED 1 · REFUSED 2 · NOT_REQUIRED 3; `established = outcome !== REFUSED`, the shape `.claude/gates.yml`'s `recording_hazard` asks for.
- Reads `invocation.args` and the router's **exit code** only. Refinement on the brief: keying "not required" on `invocation === null` alone is fail-OPEN, because `refuseTree()` emits `invocation: null` with `gateRequired: true` at exit 2. Both arms pinned.
- No `Workflow` grant, no `mcpServers`, no agent definition touched — `PS-WORKFLOW-CONTAINMENT` satisfied by design, not argued with.
- **Wired through an existing step name** (`test:merge-gate` gains a second file, precedent `test:warroom`/`test:playbooks`), so `STEPS.length` stays 48 and no figure moves. A first attempt added a new `test:*` name: it cost a `STEPS` entry, a `ci.yml` step, 20 `check:figures` findings across `CLAUDE.md`/`STATUS.md`/`ci.yml` and a stale `CODEBASE-MAP.md`, and floored the PR at `irreversible`. Reverted.
- Evidence: `test:merge-gate` 85 pass · 0 fail (61 + 24); `npm run check` 48 of 48 · 0 failed; 8-cell mutation table, 7 FIRED and 1 SILENT, all as predicted.
- Two instrument failures caught mid-run: the first mutation table's redirect target was sandbox-denied so every cell read FIRED; and the exit-2 discriminator test asserted only the outcome, so deleting the check was SILENT.
- **Standing caveat:** author-recorded against a deterministic floor, one agent, one model family. `full` asks for an independent reviewer; not met here. *The checks ran and are green* is not *the tier was satisfied*.
