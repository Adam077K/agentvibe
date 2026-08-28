---
playbook: launch-landing-page
---

# /launch — ship a customer-facing page

Runs the **`launch-landing-page`** playbook: [.claude/playbooks/launch-landing-page.yml](../playbooks/launch-landing-page.yml).

## Usage

```
/launch [what the page is for, and who it is for]
```

## Where the pipeline lives

In the playbook, and nowhere else. The standards each stage is held to are the `growth`,
`customer` and `design` lenses in [.claude/lenses.yml](../lenses.yml); the review dimensions are
`voice`, `craft` and `accessibility` in [.claude/review-lenses.yml](../review-lenses.yml).

## What this command adds

Nothing. It is an invocation.

One consequence worth knowing before you type it: the final stage carries
`gate: outbound-approval`, which [.claude/gates.yml](../gates.yml) declares as `kind: human`.
Nothing resolves it by exiting 0 — `node scripts/check-gates.mjs resolve outbound-approval`
returns `unresolved`, on purpose. Publishing is not undone by a revert, so a person looks at the
staged page first.
