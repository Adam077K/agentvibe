---
playbook: validate-a-market
---

# /validate — decide whether a market is real

Runs the **`validate-a-market`** playbook: [.claude/playbooks/validate-a-market.yml](../playbooks/validate-a-market.yml).

## Usage

```
/validate [the market or segment you are considering entering]
```

## Where the method lives

In the playbook, and in the `research`, `customer`, `business` and `evidence` lenses in
[.claude/lenses.yml](../lenses.yml).

## The one rule worth repeating here

The conditions come **first**. The framing stage exits on
`criterion(falsifiable-conditions-stated)` — what would have to be true — and the judging stage
decides against those conditions rather than against how the evidence feels. Deciding after
looking is how enthusiasm gets recorded as validation.

The final stage carries `gate: founder-approval`, `kind: human` in
[.claude/gates.yml](../gates.yml). No exit code approves entering a market.
