# 04 — Keep / cut ledger vs S1.1

Refs: S1-Cxx = `explorer/data/components.json`; AD-xxx = `decisions.json`; Bxx = `stages.json`; CAP-xx = `capabilities.json`. Panel numbers in brackets.

## The nine S1.1 components
| S1.1 | Verdict | What survives in v2 | Trigger for the rest |
|---|---|---|---|
| **C01** Direction and responsibility register | **Simplified** | `venture.yml`/`project.yml` (purpose, stage, riskiest assumption, kill line, hours budget) + `DECISIONS.md` per venture; pivot/kill entries carry the predeclared criterion and observed number [1] | Full ResponsibilityAssignment/Mandate records: first employee or outside investor |
| **C02** Case admission and scheduler | **Kept, rebuilt small** | The runner: SQLite queue, envelope, `why_separate`, per-provider semaphores, capacity rules [2] | 5-lane capacity-share scheduler: >3 concurrent lanes in production |
| **C03** Domain production interfaces | **Kept** | 7 engines + lenses + playbooks; no department roster (AD-002) [2] | — |
| **C04** Consequence authority and release | **Simplified** | "Never without the founder" list, `kind: human` gates, DecisionPacket, three-flag rule [7] | Consequence grants, restriction epochs, egress identities: first money movement the system can release, or first employee with credentials |
| **C05** Context and validity | **Simplified** | Context pack ≤40 KB with hashes; ledger + `supersedes`/`valid_from`; write quarantine; 4 record types (claim, source, context pack, outcome row) instead of 18 [4] | Lineage, purpose restriction, deletion propagation: first stored customer PII beyond name/email, first EU customer or first GDPR request |
| **C06** Evidence and acceptance | **Kept** | Frozen done-tests (AD-018), runner-computed status, Rule 10, QA gate, Codex second family [2, 4] | Evaluator calibration: a judge gates money, publishing or customer-facing output |
| **C07** Human and external responsibility interface | **Simplified** | Founder always reachable for complaints; AI disclosure + human escape hatch on support replies; consent script for calls [7b] | GrievanceCase state machine: first chargeback or grievance not closed in a day |
| **C08** Recovery and continuity | **Simplified** | `runner stop --all`, nightly backup of runner DB and transcripts, RUNBOOK, monthly 15-min restore check [7] | Witness durability, recovery envelopes, DR drills: first paying customer (tested prod restore) / first employee |
| **C09** Operator surfaces | **Simplified** | Monday page, `runner inbox`, Mission Control read-only, ntfy; six operator jobs as the design brief [5] | Typed operator schemas, `/people`, grievance surfaces: first hire or first customer with an SLA. Pixel office: dropped |

## Decisions AD-001 … AD-022
| Decision | Verdict | Note |
|---|---|---|
| AD-002 no department roster · AD-017 declared read set · AD-018 frozen criteria · AD-021 standing role is a record | **Kept** | Core of the runner and envelope |
| AD-020 worker justification | **Simplified** | One field, `why_separate` |
| AD-008 controlled improvement | **Simplified** | Candidate cannot control evaluator/cases/logs; dormant loop with trigger |
| AD-007 separate money, capacity, compute, attention | **Kept** | Runner capacity, hledger (at trigger), 10-decision cap |
| AD-013 performance ≠ payment; AD-014 termination residuals | **Deferred** | First paying customer; Stripe objects are ground truth |
| AD-006 contestable participation / external redress | **Simplified** | See C07 |
| AD-001, 003, 015, 016, 019, 022 authority kernel, ordered release, consequence class | **Deferred** | First money movement the system can release |
| AD-004, 005 native meaning, protected interpretation | **Simplified** | Verbatim quotes with source; write quarantine |
| AD-009 full capability lifecycle | **Dropped** | Capabilities switch on by stage ladder instead |
| AD-010 selective repository reuse | **Kept** | NN6 |
| AD-011, 012 value schema, derived criteria | **Dropped** | Artefacts of the 815 KB spec |

## Build stages B00 … B11
All **dropped as a sequence**. Replaced by 05-BUILD-PLAN. Mined: B01 envelope schema idea (J02), B04 context (J15), B07 backups (J08), B08 improvement boundary (dormant loop), B09 rehearsal → one integrated test (J29). B02/B03 authority witness, identity gate, native containment: deferred to first payment / first employee / first customer data.

## Capabilities CAP-01 … CAP-46 (notable)
| Kept now (M1) | Simplified | Deferred (trigger) | Dropped |
|---|---|---|---|
| CAP-03 discovery happy path (template verbatim) · CAP-04 behaviour vs stated interest vs interpretation · CAP-29 predeclared question/stop rules · CAP-28 original denominators · CAP-02 portfolio allocation · CAP-36 pause with review date · CAP-10/11/12 build, QA, launch · CAP-45 capacity | CAP-38 pivot (lite) · CAP-39 closure (10-line archive checklist) · CAP-09 brand (voice file) · CAP-13/14 content, marketing (growth lens, outbound batch) · CAP-18 pricing (`price-a-product`, provisional vs demand-supported) · CAP-32/34 knowledge, lessons as hypotheses · CAP-31 incident (RUNBOOK) · CAP-23 security (sandbox, secrets, three-flag) · CAP-44 truthful account (runner tallies) | CAP-16/17 communication, support: first payment · CAP-19/20 finance, books: first payment · CAP-21 legal, CAP-22 privacy: first external user / first PII · CAP-30 fulfilment: first paying customer · CAP-40 formation: first invoice · CAP-15 sales machinery: first negotiated deal · CAP-24/25/26 procurement, partnerships, hiring: $1k MRR or >5 h/wk on one function · CAP-35 scaling: PMF signal (≥40% "very disappointed", n≥30) · CAP-41 succession, CAP-42 grievance: first paying customer · CAP-46 automated improvement: loop trigger · CAP-27 collaboration: second person | CAP-43 owner-competence apparatus (doing your own calls is the competence) · CAP-01/06/33 as separate systems (folded into `venture.yml` + decisions) |

## Other things cut from the old plan and the panels
| Item | Verdict | Trigger / reason |
|---|---|---|
| War-room bash launcher as dispatch path | Dropped | Hostile surface (six QA rounds); runner replaces it |
| 11 shim agents, `vision-round-*` workflows | Dropped | J14, after the fleet census shows no stale copies |
| 2-of-3 multi-family judging for strategy work | Dropped | Pivots are the founder's; multi-family stays for irreversible code |
| `--safe-mode --restricted` default launch [7] | Dropped | Switches the harness off (red team C4) |
| Mission Control write path [5] | Dropped | Runner CLI writes; view stays read-only (C5) |
| Auto-send support, sub-$X refunds [7b] | Deferred | First payment, then trust ladder; refunds always approved until then (C7) |
| Cron/GitHub Actions with subscription tokens [5, 7b] | Dropped | launchd; cloud routines once billing terms are confirmed (C8) |
| 46-capability matrix, 566 answers, 305K fixture checks as gates | Dropped as gates | Mined as backlog only |
