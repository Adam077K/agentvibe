---
name: ceo
description: |
  Shim. This agent was collapsed into the `orchestrator` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `ceo` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: orchestrator
lenses: [engineering, evidence]
retired: 2026-08-11
retires_at: phase-9
---

# ceo — shim

Collapsed into **`orchestrator`** in Phase 4b. The entry point. Everything that was CEO is now the orchestrator engine.

**Why this file still exists.** A copy of `ceo.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `ceo` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `orchestrator` instead**, with lenses `[engineering, evidence]` from [.claude/lenses.yml](../lenses.yml).
