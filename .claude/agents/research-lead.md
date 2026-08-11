---
name: research-lead
description: |
  Shim. This agent was collapsed into the `sourcer` engine in Phase 4b. The file remains only to keep the name occupied, because a drifted copy of `research-lead` also exists in ~/.claude/agents/ and deleting this one would silently hand the name to it.
kind: shim
engine: sourcer
lenses: [research, evidence]
retired: 2026-08-11
retires_at: phase-9
---

# research-lead — shim

Collapsed into **`sourcer`** in Phase 4b. Research-Lead and researcher were the same discipline at two scopes.

**Why this file still exists.** A copy of `research-lead.md` also lives in `~/.claude/agents/`, and it has drifted.
Project agents shadow global ones, so deleting this file would not remove the name — it would un-shadow the
older definition, and `research-lead` would keep working while meaning something else. A failure that keeps working
is worse than one that stops.

Phase 9 reconciles the fleet and removes both.

**Use `sourcer` instead**, with lenses `[research, evidence]` from [.claude/lenses.yml](../lenses.yml).
