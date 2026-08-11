---
name: ai-engineer
description: |
  Shim. This agent was collapsed into the `builder` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `ai-engineer` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: builder
lenses: [engineering]
retired: 2026-08-11
retires_at: phase-9
---

# ai-engineer — shim

Collapsed into **`builder`** in Phase 4b. One of nine build agents that split by technology and shared one procedure.

**Why this file still exists.** A copy of `ai-engineer.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `ai-engineer` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `builder` instead**, with lenses `[engineering]` from [.claude/lenses.yml](../lenses.yml).
