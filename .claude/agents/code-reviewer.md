---
name: code-reviewer
description: |
  Shim. This agent was collapsed into the `reviewer` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `code-reviewer` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: reviewer
lenses: [engineering]
retired: 2026-08-11
retires_at: phase-9
---

# code-reviewer — shim

Collapsed into **`reviewer`** in Phase 4b. One of five agents that differed only by which review lens they carried.

**Why this file still exists.** A copy of `code-reviewer.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `code-reviewer` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `reviewer` instead**, with lenses `[engineering]` from [.claude/lenses.yml](../lenses.yml).
