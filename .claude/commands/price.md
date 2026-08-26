---
playbook: price-a-product
---

# /price — set or change a price

Runs the **`price-a-product`** playbook: [.claude/playbooks/price-a-product.yml](../playbooks/price-a-product.yml).

## Usage

```
/price [what is being priced, and what decision the answer unlocks]
```

## Where the method lives

In the playbook and in the `business` lens in [.claude/lenses.yml](../lenses.yml). The playbook
declares five stages and what it takes to leave each; it does not declare how, and the linter
refuses a stage that tries to.

## What will be refused

A request with no decision attached. The first stage exists to name the decision in one sentence
and to stop if a prior decision already locked it — analysis that unlocks nothing is analysis
nobody reads.

## Two gates, and they are different kinds

`review` carries `gate: qa-verdict`, which [.claude/gates.yml](../gates.yml) declares as
`kind: command`: `node scripts/verdict.mjs check` decides it, and its exit code is the answer.
`commit` carries `gate: founder-approval`, which is `kind: human` — a price change is not
something a process approves.
