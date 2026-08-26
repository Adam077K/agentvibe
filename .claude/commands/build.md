---
playbook: ship-feature
enter_at: frame
---

# /build — ship a feature

Runs the **`ship-feature`** playbook: [.claude/playbooks/ship-feature.yml](../playbooks/ship-feature.yml).

## Usage

```
/build [what you want built]
```

## Where the pipeline lives

**Here, and nowhere else:** the stages, their exit criteria, the risk tiering and the
dispatch are all in the playbook. This file used to restate all of it in fifty lines of
prose, which meant two descriptions of one pipeline — and two descriptions of one thing
disagree, silently, in the direction nobody is looking.

Read the playbook to know what happens. Read `.claude/lenses.yml` to know the standard
each stage is held to.

## What this command adds

Nothing. It is an invocation. If you find yourself editing this file to change how a
build works, the change belongs in the playbook.
