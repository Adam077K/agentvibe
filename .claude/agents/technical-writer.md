---
name: technical-writer
description: |
  Shim. This agent was collapsed into the `builder` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `technical-writer` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: builder
lenses: [growth, evidence]
retired: 2026-08-11
retires_at: phase-9
---

# technical-writer — shim

Collapsed into **`builder`** in Phase 4b. Docs are an artifact produced in isolation, like any other.

**Why this file still exists.** A copy of `technical-writer.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `technical-writer` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `builder` instead**, with lenses `[growth, evidence]` from [.claude/lenses.yml](../lenses.yml).
