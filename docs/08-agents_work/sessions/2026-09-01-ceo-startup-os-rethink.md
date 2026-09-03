---
date: 2026-09-01
role: ceo
session: ceo-1-1788261466
task: startup-os-rethink
color: gold
tier: lite
qa_verdict: PASS
branch: ceo-1-1788261466
---

# CEO — StartupOS rethink, session 1 of several

**Ask:** stop building, go back to planning. Rethink the whole agent system with the founder — agents,
layers, skills, MCPs, tools, memory, context, quality, token cost, monitoring, workflows, second
opinions, a thinking board, how the founder talks to it, and the fields a company needs beyond code.
Research first, then converse. Multi-session by design. Nothing is taken for granted.

## Done

1. Read the internal record: `CLAUDE.md`, `AGENTS.md`, `STATUS.md`, `DECISIONS.md`, `LONG-TERM.md`,
   `AGENT-SYSTEM-REBUILD.md`, the 2026-08-13 rethink board, and **beeond** — the only project where the
   harness met real work.
2. Read five outside systems: **GSD**, **Auto-Co**, **Omnigent**, **Metaswarm**, **CAST**, plus the
   Ralph-loop primitive. One transferable idea recorded per system.
3. Three parallel inventories — harness · surfaces · knowledge. Findings folded into `STARTUP-OS.md`.
4. Nine founder decisions taken (§2 of that file).
5. Wrote `docs/03-system-design/STARTUP-OS.md` — v0, a shared understanding, explicitly **not a plan**.
   Published a visual companion as an artifact.

## The finding

**Six of ten things the founder asked for already exist and are wired to nothing; three are genuinely
absent; one works.** The first diagnosis — *a truth machine where a company was wanted* — is true and
shallow. The load-bearing version: **nothing important is missing and almost nothing is connected.**
That explains 171 session files each of which added a mechanism, in a repo whose most frequent
self-diagnosis is *"a mechanism nothing invokes."*

## Measured this session (commands and controls in `STARTUP-OS.md` §1b)

- 28 thinking skills referenced by **0 of 18** agents, **0 of 6** playbooks, **0 of 17** commands.
  Control: `brainstorming` → 9 files.
- `/board-meeting` — a fully specified 4-round board with de-anchored framings and traceable synthesis.
  **0 of 8 personas have agent files; `board-meetings/` does not exist.** Never convened.
- `design.js` — blind variations, blind judges, synthesis grafting the runner-up. **Zero invocations
  ever**, including during the beeond design round it would have answered exactly.
- `budget-guard.js` — **not rotted; verified by execution.** Window and stall ceilings, a safelist so
  landing work is never blocked, reasoned overrides, announced fail-open. **Registered nowhere.**
  This is Decision 8 already built.
- **Hook bypass:** `npx --version` is BLOCKED; `( npx --version )` runs. A blocking control defeated by
  one pair of parentheses.
- **`gemini` is installed** at `~/.npm-global/bin/gemini`. The repo asserts in four places that no
  non-Anthropic model is reachable and carries the multi-family gap as accepted risk to 2026-11-17.
- **Sight works** — PNG read into context, chromium cached, `designer` holds `mcpServers: [playwright]`.
  The beeond blindness was that project's wiring, not a capability limit.

## Two open items that need the founder, not an agent

- Registering `budget-guard.js` edits `.claude/settings.json` — `irreversible` tier, denied to the write
  tools by the sandbox.
- Testing `gemini` spends the founder's Google quota. Not run without consent.

## Notable

- The knowledge layer is far stronger than the capability layer: 134 skills, 13 business-growth skills of
  which every one is non-engineering, 28 mental models with stop rules. **Not missing knowledge —
  missing hands.**
- `bin/warroom` dies under Decision 1, but already implements cost-per-worker, a typed event log, typed
  messaging, cross-worker file-overlap detection and session snapshots. **Six features to reborn as data.**
- The founder pushed back on detailed capability packs and was right. A pack is now **a grant and a stop**
  — `tools`, `done`, `budget` — and the agent proposes its own done-test after researching the field.

## Next

Wire, then delete, then build the three absent things. Agenda in `STARTUP-OS.md` §8.
No work authorised; this session produced understanding and one document.
