---
playbook: ship-feature
enter_at: review
---

# /ship — take work through the gate to production

Runs the **`ship-feature`** playbook from its `review` stage:
[.claude/playbooks/ship-feature.yml](../playbooks/ship-feature.yml).

## Usage

```
/ship [branch or feature name]
```

## What happens

The `review` and `ship` stages: independent review under the `correctness`, `security` and
`scope` lenses, then the QA verdict gate, then merge on founder approval.

## Two things this command cannot do

**Override the gate.** The QA verdict is not advisory and not overridable by whoever
requested the ship. That is enforced in `.github/workflows/qa-lead-pass.yml`, which blocks,
with `main` under branch protection.

**Deploy without confirmation.** The `ship` stage carries `gate: founder-approval`.

> **Repaired 2026-08-11.** This file previously assigned its steps to `Scout`, `Atlas`,
> `Guardian` and `Nexus` — four agents that do not exist in this repository. They are names
> from a different system that survived into this one. Phase 1 declared "fabrications = 0"
> and missed them, because `check-registration.mjs` verified paths and not agent names. It
> now verifies both.
