# Full-company system discovery

This package responds to the founder's **Autonomous Discovery, System Design, and Full Implementation Directive** of 2026-09-12. The objective is a complete system through which one responsible person or a small founding team can create, operate, grow, govern, improve, pause and close businesses and other complex projects while preserving intent, truthful accounts, competence and control.

**Status: discovery in progress; no architecture selected; no planning acceptance or implementation completion claimed.**

- [Durable state](state.json) is the continuation entry point.
- [Research lane register](research/lanes.json) records independent work and dependencies.
- [Open questions and decision packets](registers/open-questions.json) distinguishes missing inputs from design choices.
- [Repository observations](research/repository-observations.md) separates observed files from historical reports.
- [Change history](history.jsonl) records meaningful checkpoints.

## Current artifacts

Read the [Understand framing](planning/01-understand.md) for the ambition, invariants, tensions, nondelegable responsibilities and unproven hypotheses. It is a framing artifact, not an accepted architecture.

Twelve independent reports are archived: [intent](research/L01-intent.md), [company operations](research/L02-operations.md), [architectures](research/L03-architectures.md), [engineering and terminals](research/L04-engineering.md), [memory](research/L05-memory.md), [evaluation](research/L06-evaluation.md), [security](research/L07-security.md), [reliability](research/L08-reliability.md), [human factors](research/L09-human.md), [economics](research/L10-economics.md), [governance](research/L11-governance.md), and [improvement](research/L12-improvement.md). The contrarian and novel-concept lanes remain independent and in progress. The [lane register](research/lanes.json) records work status. The [source index](research/source-index.json) locates citations; it does not claim their independent verification.

The [structured directive contract](inputs/directive-contract.json) records the minimum package, phase exits, schemas and review dimensions. The [supplemental coverage](coverage/supplemental.json) retains vision, sector and lifecycle concerns outside the 566 questions. [Cross-field failure cases](coverage/discovered.json), [hypotheses and observations](registers/claims.json) and [contradictions](registers/contradictions.json) preserve uncertainty.

The [baseline results](research/baseline-results.json) record 48/48 repository check steps passing and the separate Mission Control result of 427 passing and 2 failing tests. These are measurements of `b2cabad`, not verification of the new system. Raw logs remain in the ignored local evidence directory named by the records.

The existing harness remains evidence and a possible source of reusable mechanisms. Its seven-engine roster, stack template, workflow vocabulary and dashboard do not constrain the new architecture. The new directive supplies the phase sequence and exit criteria where existing playbooks only describe bounded research questions and individual features.

Both source documents are preserved in [inputs](inputs/provenance.json) from commit `331b4c97657c0d4c648633779eff7668503f7c06` on `vision-path-and-warroom-codex`. They have been read in full. The initial path-pattern search missed a nested file; branch-tree inspection resolved the gap. The [question register](coverage/questions.json) currently records all 53 fields and 566 questions as requiring research or design; parsing is not answering.

## Continuation procedure

Read `state.json`, then the exact artifacts named in `next_actions`. Inspect the current branch and working tree before editing. Do not repeat completed source searches or inherit historical measurements as current facts. Research lanes form their first findings independently before comparison. Reviewers receive the subject and acceptance criteria, not a producer's self-assessment.

Planning must cover all 24 deliverable groups, all 14 research lanes, at least three foundational alternatives, independent attacks and the original field map. Only an independently reviewed complete package can authorize the transition into the full build. Preserve that package and decisions in a local git commit first. Repository-local research, planning, tests and implementation are authorized. Additional spending, publication, outbound messages, legal commitments and consequential production deployment are not authorized by this directive.
