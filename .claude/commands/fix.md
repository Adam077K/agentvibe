---
playbook: ship-feature
enter_at: frame
---

# /fix — repair something broken

Runs the **`ship-feature`** playbook: [.claude/playbooks/ship-feature.yml](../playbooks/ship-feature.yml).

## Usage

```
/fix [what is broken — symptom, not diagnosis]
```

## Why this is the same playbook as /build

A fix and a feature pass through the same stages and exit on the same criteria. The only
difference is how much of the framing stage is already done for you. Giving a fix its own
pipeline description would mean maintaining two copies that drift.

Report the **symptom**. Diagnosis happens in the framing stage — a request that arrives
pre-diagnosed usually skips the step that would have found the real cause.
