---
playbook: design-pass
---

# /design — bring a screen up to standard

Runs the **`design-pass`** playbook: [.claude/playbooks/design-pass.yml](../playbooks/design-pass.yml).

## Usage

```
/design [screen or component]
```

## Where the process lives

In the playbook. Three stages — establish what the screen is measured against, build, then
critique what actually rendered.

The standard itself is `design` in [.claude/lenses.yml](../lenses.yml), and the review
dimensions are `craft` and `accessibility` in
[.claude/review-lenses.yml](../review-lenses.yml).

## The one rule worth repeating here

Judge the **rendered output**, not the source. And a finding is a measured difference
from a stated rule — "the spacing looks off" is not a finding. The lens linter refuses
that phrasing, which is why the lens does not contain it.
