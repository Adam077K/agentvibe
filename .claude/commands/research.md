---
playbook: research-question
---

# /research — answer one bounded question

Runs the **`research-question`** playbook: [.claude/playbooks/research-question.yml](../playbooks/research-question.yml).

## Usage

```
/research [one specific question]
```

## Where the method lives

In the playbook and in the `research` lens. Three stages: bound the question, gather from
primary sources before general search, then synthesise with confidence levels and the gaps
named.

## What will be refused

An unbounded question. "Research the market" produces an unfalsifiable answer and burns
the budget getting there — it comes back with a proposed narrower scope instead.

Every finding carries a source, an access date and a confidence level, and what could not
be found is reported as a gap rather than omitted. Omitted gaps read as coverage.
