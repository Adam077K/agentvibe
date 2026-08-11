---
name: test-engineer
description: |
  Shim. This agent was collapsed into the `builder` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `test-engineer` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: builder
lenses: [engineering, evidence]
retired: 2026-08-11
retires_at: phase-9
---

# test-engineer — shim

Collapsed into **`builder`** in Phase 4b. Tests are an artifact; the verification lens is what made this look separate.

**Why this file still exists.** A copy of `test-engineer.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `test-engineer` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `builder` instead**, with lenses `[engineering, evidence]` from [.claude/lenses.yml](../lenses.yml).
