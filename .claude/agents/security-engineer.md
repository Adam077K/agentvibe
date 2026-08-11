---
name: security-engineer
description: |
  Shim. This agent was collapsed into the `reviewer` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `security-engineer` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: reviewer
lenses: [engineering, evidence]
retired: 2026-08-11
retires_at: phase-9
---

# security-engineer — shim

Collapsed into **`reviewer`** in Phase 4b. Now the reviewer engine under the security and adversarial lenses.

**Why this file still exists.** A copy of `security-engineer.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `security-engineer` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `reviewer` instead**, with lenses `[engineering, evidence]` from [.claude/lenses.yml](../lenses.yml).
