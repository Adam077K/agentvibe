---
name: design-orchestration
description: 
  Orchestrates design workflows by routing work through
  brainstorming, multi-agent review, and execution readiness
  in the correct order. Prevents premature implementation,
  skipped validation, and unreviewed high-risk designs.
risk: unknown
source: community
---

# Design Orchestration (Meta-Skill)

## Purpose

Ensure that **ideas become designs**, **designs are reviewed**, and
**only validated designs reach implementation**.

This skill does not generate designs.
It **controls the flow between other skills**.

---

## Operating Model

This is a **routing and enforcement skill**, not a creative one.

It decides:
- which skill must run next
- whether escalation is required
- whether execution is permitted

---

## Controlled Skills

This meta-skill coordinates the following:

- `brainstorming` — design generation
- `multi-agent-patterns` — design validation, via its adversarial debate protocol
- downstream implementation or planning skills

> **Where the validation step actually goes, and why the name changed.** This section named
> `multi-agent-brainstorming` at five sites. That skill DOES NOT EXIST: it was cut during curation as a
> near-duplicate, and `.claude/skills/CURATION.yml` records the cut with its replacement —
> `multi-agent-brainstorming  # → multi-agent-patterns`. Every reference here is repointed to
> `multi-agent-patterns` accordingly.
>
> **The substitution is not exact, so do not read it as a drop-in.** `multi-agent-patterns` describes
> architectures — orchestrator, peer-to-peer, hierarchical — and carries the mechanism this step needs
> (its debate protocol: agents critique each other over multiple rounds, which it reports as more accurate
> on hard reasoning than collaborative consensus). It is not a packaged design-validation run.
>
> **In this repository the concrete way to validate a design is the `reviewer` engine against
> [.claude/review-lenses.yml](../../review-lenses.yml)**, which is where the review dimensions live and
> what the binding QA gate consults. Use `multi-agent-patterns` for the shape of the panel; use the
> review lenses for what the panel is asked to judge.

---

## Entry Conditions

Invoke this skill when:
- a user proposes a new feature, system, or change
- a design decision carries meaningful risk
- correctness matters more than speed

---

## Routing Logic

### Step 1 — Brainstorming (Mandatory)

If no validated design exists:

- Invoke `brainstorming`
- Require:
  - Understanding Lock
  - Initial Design
  - Decision Log started

You may NOT proceed without these artifacts.

---

### Step 2 — Risk Assessment

After brainstorming completes, classify the design as:

- **Low risk**
- **Moderate risk**
- **High risk**

Use factors such as:
- user impact
- irreversibility
- operational cost
- complexity
- uncertainty
- novelty

---

### Step 3 — Conditional Escalation

- **Low risk**  
  → Proceed to implementation planning

- **Moderate risk**  
  → Recommend `multi-agent-patterns`

- **High risk**  
  → REQUIRE `multi-agent-patterns`

Skipping escalation when required is prohibited.

---

### Step 4 — Multi-Agent Review (If Invoked)

If `multi-agent-patterns` is run:

Require:
- completed Understanding Lock
- current Design
- Decision Log

Do NOT allow:
- new ideation
- scope expansion
- reopening problem definition

Only critique, revision, and decision resolution are allowed.

---

### Step 5 — Execution Readiness Check

Before allowing implementation:

Confirm:
- design is approved (single-agent or multi-agent)
- Decision Log is complete
- major assumptions are documented
- known risks are acknowledged

If any condition fails:
- block execution
- return to the appropriate skill

---

## Enforcement Rules

- Do NOT allow implementation without a validated design
- Do NOT allow skipping required review
- Do NOT allow silent escalation or de-escalation
- Do NOT merge design and implementation phases

---

## Exit Conditions

This meta-skill exits ONLY when:
- the next step is explicitly identified, AND
- all required prior steps are complete

Possible exits:
- “Proceed to implementation planning”
- “Run multi-agent-patterns”
- “Return to brainstorming for clarification”
- "If a reviewed design reports a final disposition of APPROVED, REVISE, or REJECT, you MUST route the workflow accordingly and state the chosen next step explicitly."
---

## Design Philosophy

This skill exists to:
- slow down the right decisions
- speed up the right execution
- prevent costly mistakes

Good systems fail early.
Bad systems fail in production.

This meta-skill exists to enforce the former.

## When to Use
This skill is applicable to execute the workflow or actions described in the overview.
