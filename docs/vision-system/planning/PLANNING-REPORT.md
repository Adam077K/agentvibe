# Planning report to the founder

**Prepared:** 2026-09-13 · **Phase:** G (complete-plan review) · **Planning disposition: PENDING** · **Implementation: not started.**

This is the report required by [DIRECTIVE.md §15](../inputs/DIRECTIVE.md). The directive says *"Do not compress the final planning package into a short summary"* and *"Make it navigable."* This document is therefore an index with judgments attached, not a précis. Every number in it names the file it was read from. Where two artifacts in the package disagree, both are cited and the disagreement is stated rather than resolved silently; those are collected in [§10](#10-where-artifacts-disagree).

§15 asks for nine items. They are sections [1](#1-what-the-system-is) through [9](#9-where-the-durable-artifacts-are). Two sections the directive does not ask for come first, because they change how everything after them should be read: the [Phase G verdict](#phase-g-verdict) and [what this package does not claim](#what-this-package-does-not-claim).

| §15 item | Section |
|---|---|
| 1. Executive explanation of what the system is | [§1](#1-what-the-system-is) |
| 2. The complete planning package | [§2](#2-the-complete-planning-package) |
| 3. The selected architecture and its alternatives | [§3](#3-the-selected-architecture-and-its-alternatives) |
| 4. The evidence and decision maps | [§4](#4-evidence-and-decision-maps) |
| 5. The risks and unresolved decisions | [§5](#5-risks-and-unresolved-decisions) |
| 6. The full implementation plan | [§6](#6-the-full-implementation-plan) |
| 7. The coverage matrix | [§7](#7-the-coverage-matrix) |
| 8. A clear statement about implementation | [§8](#8-statement-about-implementation) |
| 9. The location of all durable planning artifacts | [§9](#9-where-the-durable-artifacts-are) |

---

## Phase G verdict

Four independent reviewers read a frozen subject, commit `7ddc066`, under the protocol at [G-acceptance-protocol.md](reviews/G-acceptance-protocol.md) — a protocol written and frozen *before* the reviewers saw the drafts. Each held a disjoint set of dimensions and two of eight portfolio scenarios. Each had shell access for computation and no write access, and each was barred from producers' self-assessments, session files and `state.json`'s `completed` array. The four reports are archived verbatim and are the only source for the table below.

| # | Dimension | Reviewer | Judgment | (d)-class findings |
|---|---|---|---|---|
| 1 | Completeness | [G-01](reviews/G-01-completeness-vision-coverage.md) | Sufficient for implementation to begin | none |
| 2 | Traceability | [G-04](reviews/G-04-traceability-alternatives-feasibility-responsibility.md) | Sufficient for implementation to begin | none |
| 3 | Internal coherence | [G-02](reviews/G-02-coherence-buildability-changeability.md) | **INSUFFICIENT** | **G2-01, G2-02** |
| 4 | Evidence quality | [G-03](reviews/G-03-evidence-unknowns-adversarial.md) | Sufficient for implementation to begin | none |
| 5 | Alternative depth | [G-04](reviews/G-04-traceability-alternatives-feasibility-responsibility.md) | Sufficient, with G4-05 named | none |
| 6 | Vision preservation | [G-01](reviews/G-01-completeness-vision-coverage.md) | Sufficient for implementation to begin | none |
| 7 | Unknown integrity | [G-03](reviews/G-03-evidence-unknowns-adversarial.md) | Sufficient for implementation to begin | none |
| 8 | Adversarial robustness | [G-03](reviews/G-03-evidence-unknowns-adversarial.md) | Sufficient, with G3-01 severe enough that the package "may not be *called* a threat model" until it lands | none |
| 9 | Operational feasibility | [G-04](reviews/G-04-traceability-alternatives-feasibility-responsibility.md) | Sufficient, with G4-07 named | none |
| 10 | Buildability | [G-02](reviews/G-02-coherence-buildability-changeability.md) | **Split** — sufficient to begin at B01–B03; **insufficient for the money/fulfillment vertical** (B04/B05) until G2-01, G2-02, G2-05 and G2-06 land | none |
| 11 | Responsibility | [G-04](reviews/G-04-traceability-alternatives-feasibility-responsibility.md) | Sufficient, with G4-01/02 — "fix before B06, not before B00" | none |
| 12 | Changeability | [G-02](reviews/G-02-coherence-buildability-changeability.md) | Sufficient | none |

**Eleven of twelve sufficient; one insufficient.** The two (d)-class findings are both on one record, `SalesAgreement`, and both are *missing decisions* — the protocol's class (d), "a missing decision without which implementation would choose the system's meaning":

- **G2-01** — what evidence constitutes **performance of a sale**. Computed by the reviewer: `criterion.SalesAgreement.performed.v1` and `criterion.SalesAgreement.accepted.v1` have byte-identical `field_paths`, and `SalesAgreement.relations` names no `Fulfillment` target. A buyer pays, the delivery record stays `proposed`, every obligation stays `recognized`, and the agreement reaches `performed` with nothing objecting.
- **G2-02** — whether **`terminated` asserts closure**. All four `SalesAgreement:*->terminated` edges carry `transition_basis` only, where eleven comparable closure edges elsewhere in the registry carry `due_preserved`. There is no `terminated_with_residuals` state to hold the alternative, so writing the guard would settle the question silently in one direction.

Both were decided as [AD-013 and AD-014](../registers/decisions.json) and a repair lane is in flight. **An independent recheck of that repair, by a reviewer who did not author it, is required before any planning disposition is recorded.** See [§8](#8-statement-about-implementation).

**Findings that are not (d) and are still owed.** G-01 raised seven (a)-class (G1-01…G1-07) and withdrew three of its own candidates under tighter tests. G-03 raised six. G-04 raised eight (b)/(c). G-02 raised G2-03…G2-07. Repair lanes have landed for most of the (a)/(b) set; [registers/review-findings.json](../registers/review-findings.json) carries dispositions, and **G1-06b is recorded Open** — eight record types still named nowhere outside `contracts/`.

**Every reviewer disclosed the same limit in its own words.** All four share a model family with every author of the package. Independence here is **procedural** — no reading of producer self-assessments, session files or `state.json.completed` — not statistical. G-02: *"this is not an independent panel."* G-01 names three places it is predisposed to agree and says it mitigated by computing joins the registers do not advertise. Treat the eleven "sufficient" judgments as one family's careful reading, not as a multi-family panel.

---

## What this package does not claim

Each row names the artifact that says so, in that artifact's own voice.

| Not claimed | Where the package says so |
|---|---|
| **No runtime.** Nothing is built. All twelve construction stages are `not-started`. | [implementation-graph.json](implementation-graph.json) — `status: "planned; B00 full-plan gate not yet passed"`; every stage `"status": "not-started"` with `completed_evidence: []`. [state.json](../state.json) — `"implementation_started": false`. |
| **No deployment.** No infrastructure exists or has been purchased. | [02-architecture-selection.md §10](02-architecture-selection.md) — *"A local emulator is temporary test infrastructure; it proves no external durability or professional availability."* B07 and B10 are unstarted. |
| **No provider admission.** No account, allowance, eligibility or billing path has been verified with any provider. | [07-integrations-capacity.md §3](specification/07-integrations-capacity.md) — every adapter row carries admission inputs; Q-007, Q-009 and Q-013 in [open-questions.json](../registers/open-questions.json) are the unresolved account, mail and spend prerequisites. G-04: *"Any runtime, provider, account, isolation, restore or cost measurement — none exists and the package says so."* |
| **No professional engagement.** No accountant, lawyer, assessor, custodian or successor has been engaged. | Q-005, Q-006, Q-008, Q-012 in [open-questions.json](../registers/open-questions.json). [00-executive-guide.md](00-executive-guide.md) — *"Preparation of a professional packet is preparatory work, not the professional determination or filing."* |
| **No business validation.** No customer, no sale, no demand evidence, no market test. | [00-executive-guide.md](00-executive-guide.md) closing paragraph — the largest residual uncertainty is whether the system can perform its duties within available human and financial resources, and *"Accurate records and disciplined refusals cannot establish that."* |
| **Single model family throughout.** Authors and reviewers are the same family; agreement is not independent confirmation. | All four Phase G reports, in their own independence disclosures. [state.json](../state.json) `active_risks` — *"Available subagents share a model family; context independence is not statistical independence."* [cross-lane-comparison.json](../research/cross-lane-comparison.json) `limitations`. |
| **No executed test of the specified behavior.** Every verdict in this package concerns specified behavior, not observed behavior. | G-02: *"No runtime exists; every verdict concerns specified behavior."* [attack-coverage.json](../research/attack-coverage.json) — `implementation_test` is `null` on all 33 cases (G3-01). |

---

## 1. What the system is

*The first part of this section deliberately uses no component, product or architecture names.*

A person who decides to run a business takes on a set of duties that do not switch off. Someone has to answer a customer who is unhappy nine months after buying. Someone has to notice that a promise was made in March that nobody has kept. Someone has to close the thing down properly if it fails — refunds finished, records handed over, the people who are owed something still able to reach a human being. Those duties survive every tool, every plan and every change of mind, and they are what makes running several ventures at once hard for one person in a way that "having more hands" does not fix.

This is a plan for a system that carries that work on the owner's behalf while keeping the owner genuinely in charge of it — able to understand what was done, able to disagree with it, and able to stand behind it to a customer or a regulator without guessing.

**What it does.** It helps investigate whether an opportunity is real, using actual observations of actual people rather than invented ones. It helps design, make and offer things. It sells, takes money, delivers, and supports what was sold. It keeps the books, meets institutional duties, and prepares the material a qualified professional then acts on. It learns from what happened, changes direction when the founder changes direction, pauses, and closes down responsibly. It keeps a record of what was attempted, what failed, what was skipped, what is stale and what nobody knows — because an account that only contains successes is not an account.

**What it refuses to do.** It refuses to let a report about work stand in for the work. A generated summary of a delivery is not a delivery, and no internal status can mark an outside obligation as discharged. It refuses to invent the owner's values, appetite for loss, or consent. It refuses to treat a good track record as a reason to allow bigger consequences: doing something safely a hundred times can shorten review, but it cannot raise the ceiling on what may be done. It refuses to quietly spend money — no silent switch from a subscription to a metered bill. It refuses to fabricate people: a professional is not created by naming an endpoint, and a customer reaction is not created by simulating one. And it refuses to close an unresolved thing by relabelling it.

**What the owner's day looks like.** Not supervision. The system is designed against the failure mode where every uncertainty becomes an approval request and the owner becomes a full-time reviewer. Instead the owner gets a bounded, deliberate set: decisions only they can make, contested or changed promises, evidence that contradicts what was believed, effects nobody can confirm happened, and deadlines coming due. Alongside that is a deliberately preserved minimum of real contact — some actual customer evidence read first-hand, one taste decision that is genuinely theirs, one piece of unfamiliar financial interpretation, and practice at intervening and recovering — inside availability limits the owner sets. That practice is not a test with a score. Its purpose is that the owner remains able to explain their own business.

**What it costs, and what is unknown about the cost.** The priced reference deployment is **$435.70/month** of infrastructure ([07 §7](specification/07-integrations-capacity.md), recorded in [state.json](../state.json)), against a cheaper single-server comparator that the plan requires to be priced alongside it before operating feasibility can be accepted. Metered services on top are small and bounded but uncapped at the provider: search at $5/1,000 queries, transactional mail overage at $1.80/1,000 above 10,000 — and **nothing at the provider caps that spend**, so a misconfigured limit is detected at the next daily reconciliation rather than prevented (G4-07). A reference professional retainer of $399/$599 per month is recorded as eligibility-limited, explicitly not a quote. **The honest part is what is not priced:** the founder's own hours, the labour of keeping cross-domain meanings correct as things change, professional fees in a jurisdiction not yet chosen, and the cost of handling grievances and closing things down. [02 §8](02-architecture-selection.md) states directly that the cost of the selected design — waiting on durable confirmation, unavailable release, lineage tracking, recovery administration — is *"accepted architectural costs, not yet priced."* The single largest unknown in the entire package is whether one person can afford to run this, in money and in attention. Nothing in the package answers that, and the package says so.

**Now with the names.** The selected architecture is **S1.0** ([02-architecture-selection.md](02-architecture-selection.md)): a common authority for admitted work and surviving obligations, specialized native production, and separately protected consequence, evidence and recovery boundaries. It decomposes into **nine logical components** (C01 direction and responsibility · C02 cases and scheduling · C03 production · C04 authority and release · C05 context and validity · C06 evidence and acceptance · C07 human and external responsibility · C08 recovery and continuity · C09 operator surfaces). Those are responsibilities, not agents, services or machines — [00-executive-guide.md](00-executive-guide.md) states *"this does not require nine agents, people, services or computers."* **46 capability contracts** cover the business lifecycle; coding is one of them, CAP-10 of 46. There is deliberately **no permanent roster of named agent personas**: [AD-002](../registers/decisions.json) allocates known predicates to deterministic code, waits and repetition to durable procedures, interpretation and generation to bounded model work, and real human, professional or physical work to accepted capable performers.

Fuller version: [00-executive-guide.md](00-executive-guide.md). The invariants, tensions, nondelegable responsibilities and unproven hypotheses this all has to satisfy: [01-understand.md](01-understand.md).

---

## 2. The complete planning package

Directive §8 requires 24 deliverable families. All 24 are present with substantive locations; the checklist is [coverage/package.json](../coverage/package.json), which carries this warning on every row and it is repeated here rather than paraphrased away: *"This is a navigation/completeness checklist, not a reviewer verdict or assurance that all listed subrequirements are substantively satisfied."*

G-01 computed **0 unresolvable locations** across every `locations` entry in that file.

| § | Family | Where it lives | What a reader finds there |
|---|---|---|---|
| 8.1 | Vision | [01-understand.md](01-understand.md) · [12-scope-lifecycle-traceability.md](specification/12-scope-lifecycle-traceability.md) | Eight invariants with an observable contradiction each; the tensions that must stay visible; what may not be silently delegated; non-goals |
| 8.2 | Problem framing | [01-understand.md](01-understand.md) · [02-architecture-selection.md](02-architecture-selection.md) · [open-questions.json](../registers/open-questions.json) | Stakeholders, jobs, alternative work arrangements, and the owner inputs no design can supply; no assumed jurisdiction |
| 8.3 | Evidence map | [source-index.json](../research/source-index.json) · [cross-lane-comparison.json](../research/cross-lane-comparison.json) · [substrate-claims.json](../research/substrate-claims.json) · [claims.json](../registers/claims.json) · [contradictions.json](../registers/contradictions.json) · [decisions.json](../registers/decisions.json) | 305 source locators, ten unresolved cross-lane axes, disagreements kept rather than merged |
| 8.4 | Capability map | [03-company-capabilities.md](specification/03-company-capabilities.md) · [capabilities.json](specification/capabilities.json) · [scope-lifecycle-contracts.json](specification/scope-lifecycle-contracts.json) | 46 capability contracts, each with the eleven §8.4 fields; F25-Q01 decomposed into 15 separately routed named jobs |
| 8.5 | Architecture alternatives | [candidates/](candidates/) · [02-architecture-selection.md](02-architecture-selection.md) | Three materially different foundations, a C2 amendment, a simple comparator, and what would make each win |
| 8.6 | Selected architecture | [02-architecture-selection.md](02-architecture-selection.md) · [01-contract-kernel.md](specification/01-contract-kernel.md) · [02-authority-recovery.md](specification/02-authority-recovery.md) · [08-improvement-implementation.md](specification/08-improvement-implementation.md) · [10-components-authority-traceability.md](specification/10-components-authority-traceability.md) | Nine components × nineteen attributes = 171 populated entries, plus the authority trace |
| 8.7 | Agent operating model | [05-work-agents-skills.md](specification/05-work-agents-skills.md) · [work-knowledge-contracts.json](specification/work-knowledge-contracts.json) | Temporary qualified procedures choosing among deterministic, workflow, model, human and professional execution by consequence |
| 8.8 | Agent organization | [05-work-agents-skills.md](specification/05-work-agents-skills.md) · [10-components-authority-traceability.md](specification/10-components-authority-traceability.md) | Why a persistent department roster is *not* justified; versioned templates, scoped creation and termination; success does not raise authority |
| 8.9 | Skills | [05-work-agents-skills.md](specification/05-work-agents-skills.md) · [work-knowledge-contracts.json](specification/work-knowledge-contracts.json) | Typed, licensed, provenanced units with tests, composition bounds and library-scale selection degradation controls |
| 8.10 | Tools and connections | [07-integrations-capacity.md](specification/07-integrations-capacity.md) · [N01-native-execution.md](../research/implementation/N01-native-execution.md) | Seven concrete adapters with endpoints, limits, failure behaviour, a simpler alternative each, and admission checks |
| 8.11 | Schemas and contracts | [01-contract-kernel.md](specification/01-contract-kernel.md) · [11-schemas-state-contracts.md](specification/11-schemas-state-contracts.md) · [contracts/](specification/contracts/) · [specification-findings.json](../registers/specification-findings.json) | The canonical machine registries: 173 record types, 1,295 lifecycle edges, ~2,255 predicates, 46 required subjects, negative fixtures and a validator. **This is the one family whose status reads `foundational-consolidation-active` rather than review-pending** |
| 8.12 | Memory and context | [06-knowledge-evidence-evaluation.md](specification/06-knowledge-evidence-evaluation.md) · [work-knowledge-contracts.json](specification/work-knowledge-contracts.json) | Working/session/episodic/semantic/procedural stores, provenance, contradictions, selective forgetting, context manifests |
| 8.13 | Evidence and truth | [06-knowledge-evidence-evaluation.md](specification/06-knowledge-evidence-evaluation.md) · [substrate-claims.json](../research/substrate-claims.json) | Observation / claim / inference / decision / unknown kept distinct; transitive evidence closure; negative and missing evidence |
| 8.14 | Evaluation | [06-knowledge-evidence-evaluation.md](specification/06-knowledge-evidence-evaluation.md) · [08-improvement-implementation.md](specification/08-improvement-implementation.md) · [G-acceptance-protocol.md](reviews/G-acceptance-protocol.md) | Every evaluation level, adversarial and negative controls, complete denominators, evaluator evaluation, and no aggregate success score |
| 8.15 | Threat model and risk register | [risks.json](../registers/risks.json) · [attack-coverage.json](../research/attack-coverage.json) · [02-authority-recovery.md](specification/02-authority-recovery.md) · [10-components-authority-traceability.md](specification/10-components-authority-traceability.md) | 17 risk groups × 19 fields, 33 attack cases. **Read with G3-01: the registers are bound to a pre-specification commit** |
| 8.16 | Permissions and consequences | [02-authority-recovery.md](specification/02-authority-recovery.md) · [04-human-operation.md](specification/04-human-operation.md) · [10-components-authority-traceability.md](specification/10-components-authority-traceability.md) | C0–C5 consequence classes, scoped grants checked at use, witnessed release, no self-grant and no ambient inheritance |
| 8.17 | Reliability | [02-authority-recovery.md](specification/02-authority-recovery.md) · [05-work-agents-skills.md](specification/05-work-agents-skills.md) · [08-improvement-implementation.md](specification/08-improvement-implementation.md) | SQL scheduling, leases, exact deduplication, unknown-effect reconciliation, frontier restore, recovery verification |
| 8.18 | Human operation | [04-human-operation.md](specification/04-human-operation.md) · [09-company-human-traceability.md](specification/09-company-human-traceability.md) | Intent, decisions, interruption, correction, taste, finite attention, absence and succession performance |
| 8.19 | Mission Control and surfaces | [04-human-operation.md](specification/04-human-operation.md) · [10-components-authority-traceability.md](specification/10-components-authority-traceability.md) | Ten job-derived surfaces with source, state, uncertainty, latency, failure, accessibility and mobile behaviour; no fictional activity |
| 8.20 | Terminal and coding surface | [04-human-operation.md](specification/04-human-operation.md) · [05-work-agents-skills.md](specification/05-work-agents-skills.md) | Conversation plus typed commands over live work, diffs, tests, approvals, parallel workers and recoverable task switching |
| 8.21 | Economics and capacity | [07-integrations-capacity.md](specification/07-integrations-capacity.md) · [integrations-capacity-build.json](specification/integrations-capacity-build.json) · [2026-09-12-integration-economics-inspection.md](../research/reviews/2026-09-12-integration-economics-inspection.md) | Money and provider allowance kept separate; priced deployment and comparators; no silent metered fallback. G-04 checked all 17 §8.21 items — 16 specified by mechanism, 1 partial |
| 8.22 | Self-improvement | [08-improvement-implementation.md](specification/08-improvement-implementation.md) · [06-knowledge-evidence-evaluation.md](specification/06-knowledge-evidence-evaluation.md) | Versioned evidence-led proposals, frozen comparisons, staged rollout, live rollback; protection roots that cannot self-modify |
| 8.23 | Full implementation plan | [08-improvement-implementation.md](specification/08-improvement-implementation.md) · [implementation-graph.json](implementation-graph.json) | Repository and module map, four-VM topology, environments, secrets, tests, observability, and twelve dependency-ordered stages |
| 8.24 | Coverage matrix | [questions.json](../coverage/questions.json) · [supplemental.json](../coverage/supplemental.json) · [discovered.json](../coverage/discovered.json) · [09](specification/09-company-human-traceability.md) · [10](specification/10-components-authority-traceability.md) · [12](specification/12-scope-lifecycle-traceability.md) | 566 + 62 + 15 rows joined to answer, component, evidence, decision, uncertainty, owner and planned module |

**Status across the 24.** Twenty-three read `substance-authored-independent-complete-plan-review-pending`; 8.11 reads `foundational-consolidation-active`. All twenty-four read `implementation_status: not-started`.

---

## 3. The selected architecture and its alternatives

### S1.0 in one paragraph

S1.0 puts **one logical authority in charge of admitting work and of the obligations that outlive it**, lets each business domain keep its own records, tools and meanings for its own work, and protects three things behind separate boundaries that no ordinary producer can reach: what may actually happen in the outside world, what counts as evidence that something happened, and how the company recovers when a machine, a provider or a person is lost. Its organizing choice is derived from candidate A. It deliberately does **not** make a shared blackboard, independently issued internal spending authorities, permanent agent identities, or compulsory independent inquiry rights foundational. [02-architecture-selection.md](02-architecture-selection.md) is explicit that this is *"a design inference under uncertainty"* — the evidence establishes available mechanisms and important failure modes; **it does not establish which candidate runs a business most effectively.**

### The alternatives, compared on the same requirements

Reproduced from [02-architecture-selection.md §2](02-architecture-selection.md#2-alternatives-compared-on-the-same-requirements). The baseline for comparison covers full business delivery, evidence, consequences, competence and closure — removing those would make an artificially cheap competitor.

| Alternative | Nonoptional control choice | Credible reason to choose it | Principal cost or falsifier |
|---|---|---|---|
| **Simple comparator S0** | Native business tools, shared obligation/decision register, fixed grants, calendar, scheduled reconciliation, temporary assistance and accountable manual releases | Existing tools and a competent owner/service network may coordinate the required scale with less software and upkeep | Manual commissioning, recovery or evidence assembly scales with output; missed duties or owner overload defeat it |
| **Repaired A** *(selected, as S1.0)* | Common admitted-case authority and deterministic scheduling; bounded adaptive planning handles unfamiliar work | One accepted work state makes cross-domain ownership, change and recovery explicit without negotiating internal administration | Central interpretation can be consistently wrong; mapping and case creation become hidden founder labor |
| **Repaired B** | Native domains own administration and scheduling; sponsors commission complete outcomes; independent issuers prepare a commonly ordered release | Real autonomous suppliers or domain operators can preserve expertise and replacement options without migrating internal methods | Sponsorship disputes, prepared resource holds, shared validity and cross-issuer ordering can dominate coordination; native autonomy is unavailable where bypasses cannot be fenced |
| **C2** | Standing inquiry charters entitle eligible observers to a bounded first discriminator and separately governed disposition despite ordinary production priorities | Protects investigation from convenient local closure or indefinite discretionary deferral | Reserved analysis and assessor capacity can be consumed by false or low-value inquiries; continuity and appeal add permanent institutional labor |

Originals: [A — records and cases](candidates/A-records-and-cases.md) · [B — federated responsibility](candidates/B-federated-responsibility.md) · [C1 — adaptive coordination](candidates/C-adaptive-coordination.md) · [the C2 amendment](candidates/AC-foundational-distinction.md). Repairs: [technical](candidates/technical-foundation-repairs-v1.md) · [company](candidates/company-foundation-repairs-v1.md).

**Independent attacks, before selection.** Three reviewers attacked the candidates architecture-neutrally and found 21 tracked issues: [D — technical](reviews/D-technical.md) · [D — company/human](reviews/D-company-human.md) · [D — architecture/evidence](reviews/D-architecture-evidence.md). Reassessments after repair: [D2 — technical](reviews/D2-technical.md) · [D2 — architecture/evidence plus a fresh company assessment](reviews/D2-architecture-evidence-company.md). Dispositions are in [review-findings.json](../registers/review-findings.json): T01–T08, CH-01…CH-09 and EAS-01…04 are *"closed conceptually; specification, conformance and deployment obligations remain"*; EAS-R1 and T-R1/R2/R3 remain mandatory specification obligations. **Note the procedural gap and do not read past it:** the original company reviewer could not be resumed within the tool thread limit, so the company reassessment is the architecture reviewer's separately labelled fresh assessment, not the original reviewer's sign-off.

### What would reopen the choice

From [§9 of the selection record](02-architecture-selection.md#9-evidence-needed-to-retain-or-reopen-s1), condensed. All of these are **required future evidence, not results.**

- **S0 wins if** matched manual/native coordination delivers equivalent useful outcomes and recovery within the same owner attention allowance at lower full cost. Then remove the orchestration.
- **B wins if** actual independently administered domains reduce real native replacement and coordination cost without losing authority or outcome ownership.
- **C2 wins if** deferred inquiry causes persistent missed opportunities, missed duties or owner blind spots that scheduled cross-domain review systematically misses, at acceptable total burden.
- **Any single contract reopens immediately on** a successful falsifier, an unavailable enforcement or continuity prerequisite, changed provider terms or semantics, a misleading acceptance, a missed material duty, or an inability to perform authorized closure.
- **The foundation reopens when** repairs repeatedly require hidden manual coordination, broad multi-domain negotiation, permanent exceptions, speculative containment or unaffordable independent roots.
- **EAS-R1** requires four distinct comparisons, and each candidate's own rights conformance must be tested before business effectiveness is compared. **Two of the four are currently unreachable** — see G4-05 in [§5](#5-risks-and-unresolved-decisions).
- **The CF1 maintenance protocol** compares matched scope at 1×, 2× and 4× demand, counting founder translation, work discovery, connector and mapping repair, competent review and total coordination.

Measurement rules and fixtures must be frozen before results are inspected, failed attempts and manual interventions must be counted, and safety, service, customer value, economics, owner competence and attention are reported separately. **No aggregate score selects a winner.**

---

## 4. Evidence and decision maps

### The fourteen research lanes

Each formed its first findings independently, before any comparison. Register: [research/lanes.json](../research/lanes.json).

| Lane | Topic | Report | Independent evidence audit |
|---|---|---|---|
| L01 | Vision and founder-intent preservation | [L01-intent.md](../research/L01-intent.md) | not yet independently evidence-audited |
| L02 | Company and organizational operations | [L02-operations.md](../research/L02-operations.md) | not yet independently evidence-audited |
| L03 | Agent and workflow architectures | [L03-architectures.md](../research/L03-architectures.md) | not yet independently evidence-audited |
| L04 | Coding, terminal and software engineering | [L04-engineering.md](../research/L04-engineering.md) | not yet independently evidence-audited |
| L05 | Memory, knowledge, context and grounding | [L05-memory.md](../research/L05-memory.md) | not yet independently evidence-audited |
| L06 | Evaluation, evidence, truth and reproducibility | [L06-evaluation.md](../research/L06-evaluation.md) | not yet independently evidence-audited |
| L07 | Security, permissions, identity and adversarial threats | [L07-security.md](../research/L07-security.md) | not yet independently evidence-audited |
| L08 | Reliability, durable execution and incident recovery | [L08-reliability.md](../research/L08-reliability.md) | not yet independently evidence-audited |
| L09 | Human factors, founder attention, competence and interfaces | [L09-human.md](../research/L09-human.md) | not yet independently evidence-audited |
| L10 | Economics, subscriptions, capacity and infrastructure | [L10-economics.md](../research/L10-economics.md) | selected assertions audited ([current-claims](../research/reviews/2026-09-12-current-claims.md)); not an audit of every assertion |
| L11 | Legal, privacy, governance and ethical consequences | [L11-governance.md](../research/L11-governance.md) | selected assertions audited; not an audit of every assertion |
| L12 | Self-improvement and controlled system change | [L12-improvement.md](../research/L12-improvement.md) | selected assertions audited; **L12 was corrected** as a result |
| L13 | Contrarian and architecture-breaking alternatives | [L13-contrarian.md](../research/L13-contrarian.md) | not independently source-audited |
| L14 | Novel concepts beyond current frameworks | [L14-novel.md](../research/L14-novel.md) | not independently source-audited |

[cross-lane-comparison.json](../research/cross-lane-comparison.json) preserves **ten axes (X01–X10)** where the lanes agreed on a need and disagreed or left the trade-off open, each with its discriminating question and `"decision": null`. It selects no architecture and it does not pretend the empirical questions are resolved. Its own limitations note: *"Independent contexts share a model family; agreement is not statistically independent confirmation"* and *"no whole-company outcome has been established."*

Further independent source work: [selected current-policy and benchmark claims](../research/reviews/2026-09-12-current-claims.md) · [native control claims](../research/reviews/2026-09-12-native-controls.md) · [substrate controls](../research/reviews/2026-09-12-substrate-controls.md) · [Postmark admission inspection](../research/reviews/2026-09-12-postmark-admission-inspection.md) · [integration economics](../research/reviews/2026-09-12-integration-economics-inspection.md) · [epistemic traceability](../research/reviews/2026-09-12-epistemic-traceability.md) and its [recheck](../research/reviews/2026-09-12-epistemic-recheck.md).

### The decision ledger — AD-001…AD-014

[registers/decisions.json](../registers/decisions.json). Every entry carries problem, decision, alternatives, evidence and reasoning, epistemic basis, accepted design costs, external exposure authorized, reversibility, reopen trigger and implementation evidence.

**A caution about the `kind` column below.** The file's own `kind` field reads `"Decision"` on all fourteen entries. The three-way classification here is **derived by this report from each entry's `epistemic_basis` string**, which is quoted so you can check the derivation. It is not read from a field.

| ID | Title | Kind (derived from `epistemic_basis`) |
|---|---|---|
| AD-001 | Common authority for admitted work and surviving obligations | **Design inference** — *"Structural inference … no measured superiority."* |
| AD-002 | Specialized production without a department-agent roster | **Design inference** — *"Design allocation by work/authority; persistent identity benefit remains unproved."* |
| AD-003 | One ordered consequential release boundary | **Mechanism decision** — *"Conceptually reviewed contract within surviving roots; implementation proof required."* |
| AD-004 | Native meaning with conservative context validity | **Design inference** — *"Selective integration is a design choice; utility under conservative lineage remains empirical."* |
| AD-005 | Protect interpretation as well as evidence capture | **Mechanism decision** — *"Independent conceptual review closes specified attacks, not all false evidence or shared-model error."* |
| AD-006 | Fixed contestable owner participation and meaningful external redress | **Founder constraint** — *"Mechanisms required by the founder; longitudinal benefit and affordable institutional capacity unproved."* |
| AD-007 | Separate money, provider capacity, compute and attention | **Founder constraint** — *"Founder constraint plus dated provider evidence; remaining allowance and future throughput unknown."* |
| AD-008 | Controlled improvement with a protected acceptance boundary | **Design inference** — *"Design contract motivated by observed benchmark failure modes; company improvement benefit remains a hypothesis."* |
| AD-009 | Full capability lifecycle with actual fulfillment | **Founder constraint** — *"Founder scope constraint; specific ventures and real operating dependencies remain unset."* |
| AD-010 | Selective repository reuse and reversible migration | **Design inference** — *"Direct scoped repository observations plus migration design; two existing Mission Control failures unresolved."* |
| AD-011 | Bounded string ceiling for the canonical value schema (8192 chars; C0/C7 controls forbidden except tab/newline/CR) | **Mechanism decision** — *"Design decision under an absent bound. No field-length distribution was measured and none is claimed."* |
| AD-012 | Per-phase criterion content is authored by derivation from the prose contracts, never invented | **Mechanism decision** — *"Design decision about how to close a content gap, not a measurement."* |
| AD-013 | Performance of a sale is accepted delivery plus discharged or transferred obligations — never payment alone | **Mechanism decision** — *"Derived from the adopted S1.0 selection … not from new evidence and not from a founder"* input |
| AD-014 | Terminating a sales agreement is a closure event; surviving duties live in `terminated_with_residuals` | **Mechanism decision** — same basis as AD-013 |

AD-013 and AD-014 are the decisions taken in answer to the two Phase G (d)-class findings. Their status differs from the other twelve: *"adopted; mechanism decision derived from the selected architecture; revisable by a reviewed ChangeProposal."* **They are decided and under repair; they are not independently rechecked.**

### The source index, honestly measured

[research/source-index.json](../research/source-index.json) holds **305 unique locators**. It describes itself as a *"locator index only"* and explicitly does not claim independent verification of what it points at. Per-source §6 metadata, recomputed for this report over all 305 entries:

| Metadata state | Count | Meaning |
|---|---|---|
| Derived and present in the index | **222** | A date, type or explicit "Unknown: …" was resolved into the entry. Note that many of the 222 are honest *"Unknown: original publication/update date"* values (48 of them), which is coverage of the field, not knowledge of the date |
| Lane-recorded but not URL-resolvable | **40** | The citing lane's source table keys its rows by author/title rather than URL, so binding this locator to a row needs a human read that was not performed |
| Not recorded | **43** | No metadata |

Only **52 of 305** carry `claim_maintenance_refs`. G3-05 measured the same corpus a different way — *"154/305 covered, 151 not"* by resolving reference-style links into per-lane source tables — and found `L03-architectures.md` has zero table lines and 19 uncovered sources. **Both measurements are in the package and they count different things; neither is wrong.** What they agree on: roughly half the corpus has no usable per-source metadata, and **no URL in this package has been independently fetched and verified** (G-03: *"no URL was fetched, so every reported source access date is unverified"*).

Other evidence registers: [claims.json](../registers/claims.json) (8 hypotheses and observations) · [contradictions.json](../registers/contradictions.json) (6) · [substrate-claims.json](../research/substrate-claims.json) (26 groups) · [integration-claims.json](../research/integration-claims.json) (29 groups) · [repository-observations.md](../research/repository-observations.md) (observed files, separated from historical reports) · [baseline-results.json](../research/baseline-results.json).

---

## 5. Risks and unresolved decisions

### The founder-decision queue — this is the part that needs you

**Thirteen decisions are open and waiting.** They are Q-002 through Q-014 in [registers/open-questions.json](../registers/open-questions.json). Q-001 (the location of the source vision document) is Answered and closed.

Twelve of the thirteen exist because of Phase G finding **G3-06**, which observed that the register held one entry while the specification carried many human dependencies in prose — *"a founder reading the register concludes nothing is owed."* They were promoted into the register with an owner and a latest responsible time. **They have been queued; they have not been asked.**

Read the last column first. **Every one of the thirteen says unrelated work continues.** None of them blocks the package, and none of them blocks construction starting. Each blocks a specific later thing, and the middle column says exactly which.

| ID | The decision | Latest responsible time | Unrelated work continues? |
|---|---|---|---|
| **Q-002** | Who is the administrator and custodian of fault domain R, and by what independent route do they authenticate? | Before B10 operational admission and before any operating promise that depends on recovery. B01/B02 can build and test the witness protocol against local fixtures without it | **Yes** — B01–B09 proceed; B10 cannot complete, so no recovery-dependent promise may be made |
| **Q-003** | Who is the competent grievance recipient, and what makes them outside the disputed dependency? | Before B10 admission **and before the first offer is made available**, whichever comes first | **Yes** — but no offer may be made available |
| **Q-004** | When a complaint names the custodian, who is the alternate recipient, who appoints them, and by when? | With Q-003. The G-03 scenario reached this step and found every other contract held; this is the single unfilled role on that path | **Yes** — the grievance route is admitted only for complaints that do not name the custodian, and that limitation is stated to the person, not hidden |
| **Q-005** | Who is the independent assessor with write authority over protected-change acceptance, and what is their competence evidence? | Before the first ProtectedChange is authorized, which is B08 | **Yes** — B01–B07 and B09 proceed. Protected changes accumulate as proposed and reviewed but never authorized: the system runs and does not improve |
| **Q-006** | Who are the primary continuity custodian and the accepted alternate for IC-HUMAN, and what are their compensation, availability window and response capacity? | Before the route is declared live — the people must exist before B06's continuity tests can mean anything | **Yes** — the continuity route is not declared live and every promise depending on continuity stays unmakeable |
| **Q-007** | What is the actual principal — legal form, jurisdiction, signatory and registrations — under which this company transacts? | **Before the first payment.** In build terms, before B10 | **Yes** — all internal construction and research proceed; no sale, no payment, no filing, no contract |
| **Q-008** | Which named professionals will supply scoped determinations, and who holds the fee authority for each? | Before the latest responsible start of the first determination that depends on one — a filing deadline, a contract review, a regulatory question | **Yes** — any capability whose acceptance requires one stays unaccepted; the dependent duty is recorded as a readiness failure, never as completed |
| **Q-009** | Does an actual mail-provider account exist for this principal, is it approved for a custom API client, and what are its allowance, eligible streams and terms? | Before the mail profile can be admitted (B05) and before any message reaches a real recipient | **Yes** — IC-MAIL-OUT stays unadmitted; inbound intake, the human send route and every other adapter proceed |
| **Q-010** | Will the founder adopt a ParticipationPlan — availability windows, maximum decision-batch minutes, interrupt limit, practice allocation, incident reserve, permitted assessment data, sampling policy — and consent to the competence assessment? | Before the first promise whose feasibility depends on the founder's attention, i.e. the first offer, so before B10 | **Yes** — internal construction unaffected; an empty plan does not force a questionnaire now. No dependent promise may assert attention or competence capacity |
| **Q-011** | What funded capacity is reserved for remedy, grievance handling and responsible closure, and from what account? | Before the first offer, with Q-003 — an offer creates the exposure this reserve exists to meet | **Yes** — no offer may be made available; everything else proceeds |
| **Q-012** | Who is the accepted successor if the founder and a material provider are lost together, and how are they appointed and paid without the founder? | Before B10 admission and before any continuing customer duty exists | **Yes** — joint-loss continuity is declared unavailable, which is a real limitation on what may be promised |
| **Q-013** | What continuing infrastructure and operating spend is authorized, and is the priced OP-AWS-LINUX-1 deployment approved against its simpler comparator? | Before B10 and before any infrastructure is purchased. **The comparison is owed before the decision** — [02 §2](02-architecture-selection.md) requires both bills of materials before operating feasibility can be accepted | **Yes** — B01–B09 run against local fixtures; nothing is purchased and no operating promise is made |
| **Q-014** | Who is the actual founder, and who is the root custodian for BootstrapAuthorization — their identity assertions, keys and signatures? | Before B02's recovery substrate can be exercised end to end | **Yes** — contracts, registries and validators are complete without it; B01 builds against fixtures |

**Reading the queue as a whole.** Four of the thirteen (Q-003, Q-004, Q-011, and with them Q-007 and Q-010) gate *making an offer to anyone*. Six gate *admitting the system to operation* (B10). One gates *improvement* (Q-005/B08). One gates *exercising recovery for real* (Q-014/B02). None gates writing code. Q-002, Q-003, Q-004, Q-005, Q-006, Q-008 and Q-012 all ask the same underlying thing in different clothes: **which actual, named, competent humans exist, and on what terms** — and that is the question this plan cannot answer for itself.

### The seventeen risk groups

[registers/risks.json](../registers/risks.json). Seventeen material groups covering all 33 directive attack cases plus company, institutional and human failure. Each group carries nineteen fields including cause, likelihood-or-uncertainty, consequence, prevention, detection, containment, rollback-or-compensation, residual risk, accountable owner and escalation requirement.

| ID | Title | Attack cases |
|---|---|---|
| RISK-01 | Untrusted content becomes authority | AC01–03, AC07, AC16 |
| RISK-02 | Credential and descendant authority compromise | AC13–16, AC28 |
| RISK-03 | Disclosure through permitted destinations | AC01–04, AC13, AC16 |
| RISK-04 | Stale or poisoned knowledge becomes usable again | AC04–06, AC22, AC29 |
| RISK-05 | False success through shared evidence interpretation | AC06, AC08, AC11–12, AC21–22, AC30–31 |
| RISK-06 | Lost or duplicated effects and promises | AC09–14, AC28–29 |
| RISK-07 | Revocation, time or scope migration race | AC10, AC13–14, AC16, AC28 |
| RISK-08 | Runaway delegated work, retries and capacity use | AC17–20, AC23, AC27 |
| RISK-09 | Provider outage, policy or semantic drift | AC25–27, AC30–31 |
| RISK-10 | Owner overload or loss of competence | AC21–24 |
| RISK-11 | Intent and governing meaning drift | AC20–22, AC29, AC32 |
| RISK-12 | Institutional, professional or continuity incapacity | AC11–13, AC23, AC25, AC27–29 |
| RISK-13 | Ineffective redress and irresponsible closure | AC05, AC11–12, AC23, AC28–29 |
| RISK-14 | Business failure and shifted human burden | AC12, AC20–21, AC23 |
| RISK-15 | Compromised improvement and cumulative change | AC06, AC08, AC21, AC30–33 |
| RISK-16 | Isolation and software supply-chain failure | AC01–03, AC15–16, AC26, AC31, AC33 |
| RISK-17 | Cross-venture interaction and migration error | AC09–10, AC13–14, AC20, AC28–29, AC31 |

**Three qualifications that change how to read that table.**

1. **Every control described is unimplemented.** RISK-01's status is representative: *"Controls specified at 02 section 8.1, 01 section 8 and K15; no runtime test executed."*
2. **G3-01 (a).** The threat registers are bound to `review_subject_commit: "595f931"` — 105 commits before the frozen Phase G subject, and before `planning/specification/` existed. `grep -c 'planning/specification'` over `risks.json` and `attack-coverage.json` returns **0 and 0**; `implementation_test` is `null` on **33 of 33** cases. The reviewer's counterexample: *"delete `02 §7.2`'s default-deny forward chain and both registers stay green, because neither refers to it."* The reviewer judged adversarial robustness sufficient **and** said the package *"may not be called a threat model"* until this join exists. Both halves are its verdict.
3. **G3-03 (a).** Six of the nineteen risk fields have exactly **one distinct value across all seventeen rows**, including `design_evidence` — the same five-file list for *"Untrusted content becomes authority"* and *"Owner overload."* The per-risk cause, consequence, prevention, detection, containment, rollback and residual fields **are** substantive and per-risk.

Of the 33 attack cases, G-03 tallied **29 with an enforcement point named** and **4 rule-only**: AC07 (model collusion — a measurement obligation with no refusal predicate when trust roots are unknown), AC20 (goal drift), AC23 (owner overload), AC24 (owner deskilling).

### Standing accepted risk: single model family

Recorded in [state.json](../state.json) `active_risks` and disclosed independently by all four Phase G reviewers: **available reviewers share a model family with every author; context independence is not statistical independence.** The directive's own irreversible-tier expectation of a multi-judge panel across ≥2 distinct model families is **not met anywhere in this package**, because no non-Anthropic model is reachable from inside the tooling. Two further limits are recorded beside it: *"This session has unrestricted tools; a read-only brief is not enforced tool isolation"* — the Phase G reviewers' read-only status was procedural — and the collaboration tool refused the original company reviewer's resumption at the agent thread limit, so one reassessment is a differently-labelled fresh assessment rather than the original reviewer's sign-off.

This is an **accepted limitation of the method, not a discharged requirement.** It does not make the eleven "sufficient" judgments wrong. It means they are eleven careful readings by one family, and should be weighted as such.

### Other unresolved decisions, not in the founder queue

- **G4-05 (c) — two of EAS-R1's four comparisons are unreachable inside the plan.** Comparisons 3 and 4 both require building what [02 §8](02-architecture-selection.md) explicitly defers (C2 machinery and a shared-hypothesis representation). B00–B11 budgets only *"matched S0 comparison"* at B09. No entry in [claims.json](../registers/claims.json) owns the comparison, and all 8 claim owners are `orchestrator`, a planning role that will not exist at B11. The reviewer's sharpest point: C2's stated reopening trigger depends on evidence only a built C2 can produce, so **that falsifier is circular**. What is needed is an owner, a stage and a budget — or a recorded decision that comparisons 3–4 are deferred indefinitely, with that consequence stated. *That second option is a founder-level call and is not currently in the queue.*
- **FI-11 and FI-12** are recorded in [specification-findings.json](../registers/specification-findings.json) as *"MECHANISM CLOSED; CONTENT AUTHORED IN PART, NOT CLOSED"* and *"CONSTRAINTS 2 AND 6 REPAIRED, NOT CLOSED"* — both pending independent confirmation. **CCR-01…CCR-07** are all *"Repaired … pending independent review."*
- **XSR-R-04** is open and deliberately untouched: seven declared assertions bound by nothing (`WK-V04-A3`, `WK-V09-A3`, `WK-V20-A3`, `WK-V23-A3`, `WK-V26-A2`, `WK-V33-A3`, `WK-V43-A1`). G-01 computed the same seven independently before reading the register that names them.
- **G1-06b** is open: eight record types (`EvaluationCase`, `IndexSnapshot`, `ExperienceArtifact`, `BuildArtifact`, `Partnership`, `ContinuityArrangement`, `Constraint`, `AccessGraph`) are named nowhere outside `contracts/`.

---

## 6. The full implementation plan

### The twelve stages

[planning/implementation-graph.json](implementation-graph.json), derived from [08-improvement-implementation.md §7](specification/08-improvement-implementation.md#7-complete-dependency-ordered-construction-graph). Graph status: **`"planned; B00 full-plan gate not yet passed"`**. Every stage is `not-started` with `completed_evidence: []`.

| Stage | Depends on | What it builds | Required completion evidence | Phase G buildability |
|---|---|---|---|---|
| **B00** | — | The gate itself: consolidate all 566 answers, 46 subjects and the component matrix; reconcile 01–08, adapter routes and operating prerequisites; independent review before any runtime work | Schema/reference/state/meaning consistency, independent adversarial *and* successful-lifecycle review, preserved dissent, unresolved operating inputs. *"Complete only with a reviewable accepted plan scope."* | Gate — not yet passed |
| **B01** | B00 | Workspace, schemas/clients, canonical identities, pure command reducers, SERIALIZABLE storage, D0/D1/D2 distinctions, immutable group hashing, query/proof values, SQL outbox. C01/C02/C04/C05/C06 foundations | Property and model tests for revisions, duplicate commands, crossed updates, alias bindings, hash/proof acyclicity, imported stale staging, failed commit; a useful draft→witnessed command fixture | **Judged buildable now** |
| **B02** | B01 | Real Postgres primary + hot standby plus R writable receipt ledger, blobs/keys, release/send claim, revocation and conflict migration, backup/WAL/restore/frontier membership. C04/C08 | Crash at every local/witness/sign/ack boundary, sync-wait cancellation, empty standby, incomplete blobs, primary loss, restored old frontiers, unknown effects, missing custodians; successful release after exact witness | **Judged buildable now** (needs Q-014 to exercise end to end) |
| **B03** | B02 | Keycloak/step-ca, service epochs, trusted parameter and disclosure gates, nftables/time/readback gateway, N/X isolation. C04/C05/C08 runtime | Actual Linux sk_buff-hook tests with partial requests, established sockets, GSO, clock boot/TZ/epoch compiler, tunnel escape, credential/env/IPC and revocation races; successful bounded transport under valid time | **Judged buildable now** |
| **B04** | B01 | All company CAP procedures, responsibility and competence, work/workflow/delegation/skills, context/knowledge/forgetting, protected capture and qualified judgments. C01/C02/C03/C05/C06/C07 | Complete company fixtures from intent and research through offer, pre-sale capacity, delivery, support, finance, governance, people, incident and closure; stale lineage and transitive evaluator corruption; successful expert and human routes | **Waits** — the money/fulfillment vertical is insufficient until G2-01/02/05/06 land |
| **B05** | B03, B04 | The IC adapters — native, search, mail, public, payment, books, human — plus account/billing/capacity and provider migration and removal. C03/C04/C05/C06/C08 | IC-T01…12; contract mocks, then separately authorized real-account benign tests; quota and credit refusal alongside useful completion; actual native startup and config inventory | **Waits** (also gated by Q-009, Q-007) |
| **B06** | B04, B05 | Full human flows, permission-filtered UI, independent grievance and continuity, public form/product and service ownership. C07/C09 | Keyboard and screen-reader tests, concrete owner decisions with evidence and uncertainty, limited competence, absent founder, outsider complaint, **actual alternate acknowledgement**; no optimistic acceptance | G4-01/02 to be fixed before this stage |
| **B07** | B02, B05 | IaC/systemd topology, secrets and keys, inventory and cost, observability, release and migration, backup/deletion/restore, actual provider descendants | Disposable deployment, exact config readback, complete restore and rotation, leaked-key containment, stuck paid resources, lost account/MFA/billing recovery, load. **Record measured RPO/RTO and labor** | — |
| **B08** | B04 | ProtectedChange, trial, evaluator, rollout, watch, migration; stochastic baseline and cumulative drift. C06/C04/C01 | A candidate that alters the gate, denominator or evaluator tests; a successful useful improvement with independent assessment; rollback with irreversible effects and changed meanings | Gated by Q-005 |
| **B09** | B06, B07, B08 | Full integrated company simulator and rehearsals with **matched S0 comparison**, admitted account fixtures, representative workloads. All C01…C09 | All G dimensions, all source cases and attacks, honest missing and unknown results, actual capacity and attention, lawful competent native routes, cross-mechanism failures, independent assessor outcomes | — |
| **B10** | B09 | Actual operational principals, accounts, caps, mandates, professionals; independent A/R custody; native billing attestation; domain and terms; scoped transition | Independent admission checks on the exact deployment, clock/root/time boundaries, provider effect/recovery/continuity, measured costs; owner approves the concrete deployment | Gated by Q-002/003/006/007/010/012/013 |
| **B11** | B10 | Continuing delivery, settlement, grievances, obligation accounting, improvement watch, old-system retirement | **At least one complete due-date/outcome cycle for each live offer** and its support/refund/finance route; independent customer, evidence and rights review; actual budgets; surviving descendants resolved | — |

Each stage also carries a `risk_and_full_system_relationship` field that states what the stage does **not** prove. Three worth quoting: B02 — *"Local tests show protocol behavior only; operational independent roots remain B10 evidence."* B07 — *"Purchasing infrastructure alone cannot establish independent actual custodians or affordable useful operation."* B11 — *"Complete system capability construction is not proven commercial success. Failure may select S0 or a replacement."*

### The module map

From [08 §3](specification/08-improvement-implementation.md#3-repository-and-process-implementation-target). The brief describes this as an eight-package map; the file as it stands lists **ten `system/packages/*` entries** plus six applications and four supporting trees. Every row states a prohibited responsibility as well as an owned one, which is the load-bearing half.

| Path | Owns | May not |
|---|---|---|
| `system/packages/contracts` | Canonical RecordEnvelope/Ref, commands, events, signed response/value distinctions, schemas, generated clients | hold runtime authority or coerce aliases implicitly |
| `system/packages/kernel` | SERIALIZABLE commands, version and conflict checks, immutable GroupBody/BusinessResult, SQL inbox/outbox/timers, D1 staging and import, query watermarks | perform external I/O inside transactions |
| `system/packages/authority` | Identity, standing, grant attenuation, reservations, preparation/release/send claims, conflict and participant migration, protected policy | issue a model-based final grant |
| `system/packages/company` | Domain direction, CAP procedures, native duties, finance, customer, people, governance | define competing effect or evidence-acceptance semantics |
| `system/packages/work` | Scope links, workflow cursors, scheduling, agent selection, delegation, messages, workspace leases, skills | derive acceptance from a workflow cursor |
| `system/packages/context` | Sources, knowledge, indexes, manifest loading, lexical retrieval, freshness, validity closure, forgetting | self-certify truth |
| `system/packages/evidence` | Protected captures, dependency closure, judgments, evaluation plans, accounts, the independent assessor interface | let a producer prove its own effect |
| `system/packages/runtime` | Native launcher, X executor, job lifecycle, continuation, output framing | hold production credentials in X or run a hidden paid fallback |
| `system/packages/integrations` | Adapter registry, account and billing observations, parameter schemas, parsers, provider reconciliation, removal | promote a provider response directly to acceptance |
| `system/packages/improvement` | Proposal, trial, release, migration, watch contracts; protected change orchestration | self-authorize an evaluator |
| `system/apps/control` · `witness` · `gateway` · `worker` · `operator` · `public` | The A control backend; R's independent validation and writable receipt ledger; G's nftables compiler, clock attestation and per-attempt tunnel; separate N and X service modes; permission-filtered operator views; bounded public assets and intake | — the witness may not invent missing authoritative history; the operator app may not do offline approval, optimistic completion or cached-authority execution; the public app holds no company core credentials |
| `system/infra` · `tests` · `evals` · `fixtures` · `ops` | OpenTofu resources with separate A/R state roots; unit/property/protocol/integration/provider/UI/whole-company fixtures with independent expected outcomes; versioned runbooks | — no candidate-writable hidden evaluator root; **no claim that a runbook has already been exercised** |

The logical flow and the trust/fault placement are both given as diagrams in [08 §3](specification/08-improvement-implementation.md#3-repository-and-process-implementation-target). Deployment is **four VM placements across two accounts** — A (control, primary Postgres, Keycloak; plus ephemeral N and X VMs) in one account, R (hot standby, writable witness, gateway, encrypted backup) in an independent account. The file states the containment honestly: *"R/G share a host/admin/load fault, and all AWS resources share provider-level failure … This is a declared containment design, not proof of host/admin independence."*

### Selected technologies

Not deferred. From [08 §3](specification/08-improvement-implementation.md#3-repository-and-process-implementation-target) and [07 §3](specification/07-integrations-capacity.md#3-selected-fulfillment-adapters):

**Runtime and build:** Node 24.21.0, TypeScript, JSON Schema 2020-12 with Ajv 8, PostgreSQL 18.6, Hono 4 (Node adapter), React 19 with Vite, Node's built-in test runner, Playwright for accessibility and interaction. Bun is explicitly **not** introduced into the new authority runtime. **Infrastructure:** Ubuntu 24.04 / Linux 6.8, nftables 1.1.3, chrony 4.6, Keycloak 26.7.3, step-ca, Caddy 2, OpenTofu plus Ansible/systemd — chosen over Kubernetes and containers for a small final deployment. Versions are pinned at construction; a dependency update is a ProtectedChange, not a floating install.

**Adapters** (each with a named simpler alternative and a recorded decision): **IC-SEARCH** Brave Search API plus authorized HTTPS fetch through the gateway with pinned resolved IPs · **IC-MAIL-IN** Fastmail JMAP, 60 s poll with an `Email/changes` cursor and bounded paginated rescan on `CannotCalculateChanges` · **IC-MAIL-OUT** Postmark Basic, which [07 §9](specification/07-integrations-capacity.md) records **publishes no webhook signatures**, so "verified ingress" here means a named weaker contract and nothing stronger · **IC-PUBLIC** Cloudflare Workers Static Assets + Workers Free + D1 Free, under an admitted envelope stricter than the provider maxima, fail-closed, no token that can upgrade the plan · **IC-PAY** Stripe Checkout, Refunds and BalanceTransactions with idempotency keys bound to the immutable request, signed webhooks over exact raw bytes, event-ID inbox dedup, and refund modelled as its own operation · **IC-BOOKS** original bank statements (camt.053 or immutable native export) into a generated hledger 1.52 journal validated `--strict`, never executing user-supplied rules · **IC-HUMAN** an authenticated service portal plus actual performance by an identified person with fee reservation and competence evidence.

G-02 judged this layer *"genuinely selected, not deferred … An implementer does not invent topology, storage or adapters."* What they must invent is what performance means and what a terminated sale owes — which is exactly G2-01 and G2-02.

---

## 7. The coverage matrix

### The denominators

| Register | Rows | What it holds |
|---|---|---|
| [coverage/questions.json](../coverage/questions.json) | **566** | Every exact question in the original source field map, with its original text preserved verbatim |
| [coverage/supplemental.json](../coverage/supplemental.json) | **62** | Vision, sector and lifecycle concerns that fall outside the 566 |
| [coverage/discovered.json](../coverage/discovered.json) | **15** | Cross-field failure cases discovered during planning that no source question asked |
| [coverage/capability-requirements.json](../coverage/capability-requirements.json) | **46** | Decomposed company and system outcome requirements, including the compound jobs inside F25-Q01 |

Each of the 566 rows joins its source question to an answer location, a component, evidence, a decision, an uncertainty, an accountable owner and a planned module.

### Status distribution

From [coverage/status-rule.json](../coverage/status-rule.json), which is the **rule** that assigns every status, not a status itself. It is computed by `scripts/vision-coverage-registers.mjs`; hand-editing is refused and `verify` fails on drift. Allowed statuses are parsed from directive §8.24 at run time.

| Status | questions (566) | supplemental (62) | discovered (15) |
|---|---|---|---|
| Answered | **326** | 27 | 15 |
| Requires further evidence | **142** | — | — |
| Requires founder decision | **77** | — | — |
| Requires external professional | **21** | — | — |
| Superseded by a better framing | — | **35** | — |

By rule: R9 (specified with planned verification) 326 · R3 (future empirical result) 88 · R2 (founder or owner input) 77 · R4 (open prerequisite) 54 · R1 (external professional) 21. The rule file states the four statuses a classifier **cannot** produce — *Intentionally refused*, *Not applicable*, *Unresolved but non-blocking*, *Superseded by a better framing* — because *"a classifier that emitted one would be inventing a refusal or an acceptance nobody made."* The 35 superseded supplemental rows keep an authored judgment under rule R0 rather than being relabelled by the classifier.

**"Answered" is narrower than it sounds.** [G-acceptance-protocol.md](reviews/G-acceptance-protocol.md) defines it, and status-rule.json quotes the definition: *"'Answered' means specified at this gate; 'implemented' requires later implementation evidence."* Every row independently keeps `implementation_status: "planned-not-existing"` and an `answer_status` recording that independent review is pending. **326 Answered means 326 specified. It does not mean 326 built, and it does not mean 326 accepted.**

**This distribution contradicts the archived Phase G report and the contradiction is deliberate** — see [§10](#10-where-artifacts-disagree), item 1.

### The three-direction check

The protocol requires coverage to be checked in three directions, not one. G-01 ran them and reported computed results:

1. **Source concern → answer.** 566/566 `answer_location` JSON pointers resolve, to **566 distinct targets, maximum reuse 1** — so no row points at a shared chapter. 2,636/2,636 `evidence` paths exist. 566/566 `decision` files exist. Of 354 distinct `verification_refs`, all 172 ID-style refs are defined in the specification and all 182 path-style refs resolve. G-04 independently recomputed the first of these and added that **the target carries the original question bytes verbatim**, plus 3,938 `file.md#anchor` references from JSON with **0 dead files and 0 dead anchors**.
2. **Answer → the meaning of the question**, not a chapter. G-01 sampled **64 rows stratified across all 53 fields** and followed source concern → answer → contract → verification for each. Its examples: F27-Q06 returns protected-slot resolution from currently accepted facts with named non-inventable claims; F51-Q08 requires exercised unfamiliar duty handling and explicitly rejects *"a successor packet or spare login."*
3. **Mechanism → the requirement and problem justifying it.** **This is the weakest leg and the package says so.**

### The weakest leg: G1-06 and G1-06b

**G1-06 (a).** Eleven of 173 canonical record types were named nowhere outside `contracts/`: `ExternalAttempt`, `GenerationSeal`, `RollbackPlan`, `DecisionChallenge`, `Principle`, `AccessPolicy`, `RetentionPolicy`, `DeletionReceipt`, `DependencyClosure`, `ConfigurationVersion`, `ConsequenceClassDefinition`. Each carries a `source_contract` that resolves to a real specification section — so each is justified by a *contract* — but **by no source concern**: none appears in any of the 566 answers, the 62 supplemental concerns, the 15 discovered concerns, or the twelve specification prose documents. The reviewer named this precisely: *"that is the protocol's direction 2 failing … and it is the package's weakest coverage leg."*

**G1-06b (a), and it is Open.** A stricter census after the repair lanes finds **eight** further contract-only records: `EvaluationCase`, `IndexSnapshot`, `ExperienceArtifact`, `BuildArtifact`, `Partnership`, `ContinuityArrangement`, `Constraint`, `AccessGraph`. It was eleven; the prose lane named three of them while writing phase meanings. The required contract is a justification object on each — either a source concern whose meaning requires it, or `derived_control_machinery` naming the owning record and obligation. `independent_recheck: null`. Source: [review-findings.json](../registers/review-findings.json).

**Why this matters more than its (a) class suggests.** Direction 2 is the direction that catches machinery built because it was architecturally satisfying rather than because anything needed it. A package can score perfectly on directions 1 and 3 and still carry mechanisms nobody asked for. Nineteen record types have failed this test across two censuses. The failure is bounded, named, and has a stated closing condition — but it is the leg to watch.

### Related coverage findings

**G1-01** reported `contract_location`, `implementation_location` and `evaluation_evidence` null on all 46 capabilities in `capability-requirements.json`, so *"a reviewer navigating §8.4 through the register concludes zero capabilities have contracts."* **Recomputed for this report at the current head: 0 of 46 null.** The register was regenerated, which is what the finding asked for. **G1-02 and G1-03** (two incompatible answer-node schemas behind one column; three status columns each carrying a single value) are marked repaired in status-rule.json, `"pending independent recheck"`. **G1-04** (verification dilution — 268 work-knowledge answers binding 156 distinct subcase/assertion pairs) is bounded and its sharpest instance repaired. **G1-05/XSR-R-04** (seven assertions bound by nothing) remains open by decision. **G1-07** (one of 173 `source_contract` refs failing to resolve on an anchor slug) is a single-character defect.

---

## 8. Statement about implementation

> **Disposition: PENDING.** Phase G judged eleven of twelve dimensions sufficient; internal coherence was judged insufficient on two (d)-class findings (G2-01, G2-02), decided as AD-013/AD-014 and under repair; an independent recheck of that repair is required before any disposition is recorded. **Implementation has NOT begun.**

Nothing in this report should be read as acceptance of the plan. The B00 gate has not been passed. [state.json](../state.json) records `"planning_accepted": false` and `"implementation_started": false`, and [implementation-graph.json](implementation-graph.json) records every one of the twelve stages as `not-started` with empty completion evidence.

<!-- ============================================================
     DISPOSITION BLOCK — RESERVED
     The orchestrator replaces the block below, and only the block
     below, once the independent recheck of the G2-01/G2-02 repair
     has returned. Do not edit it to record a disposition that has
     not been independently rechecked. Do not delete the markers.
     ============================================================ -->

<!-- BEGIN DISPOSITION -->

**Recorded disposition:** *none.* No planning disposition exists at the time this report was written.

**What must happen before one can be recorded, in order:**

1. The guard-repair lane lands the G2-01/G2-02 repair per AD-013 and AD-014, together with G2-05 (a Fulfillment domain lifecycle with `delivered`/`failed`/`refunded` and an evidence op on entry), G2-06 (a fourteenth negative fixture plus an exit-nonzero distinctness ratchet), G4-01/02, G4-03, G4-08 and G2-07.
2. **A reviewer who did not author that repair** rechecks it independently, against the same protocol.
3. The scoped disposition is recorded here and in `state.json`: eleven dimensions sufficient, internal coherence re-judged on the recheck's own finding.

**Two things that recheck cannot do,** and they should be stated now rather than discovered later. It cannot supply a second model family — the accepted risk in [§5](#5-risks-and-unresolved-decisions) survives it. And it cannot turn *specified* into *works*: every judgment in Phase G concerns specified behaviour, because no runtime exists.

<!-- END DISPOSITION -->

**What begins first if a disposition is recorded.** B00 is the gate, not a build stage. Phase G judged B01, B02 and B03 buildable now — the kernel, the durable recovery substrate and the isolation/gateway layer. B04 and B05, the company procedures and the adapters, wait on the coherence re-judgment, because the two missing decisions sit on the money-and-fulfillment path immediately after the charge. That is the reviewer's split judgment, not a scheduling preference.

---

## 9. Where the durable artifacts are

Everything lives under `docs/vision-system/`. Nothing durable lives in a conversation.

```
docs/vision-system/
├── README.md                  Package index — start here or at state.json
├── state.json                 DURABLE STATE. The continuation entry point
├── history.jsonl              Meaningful checkpoints, append-only
│
├── inputs/                    The founder's directive, verbatim, plus the two source
│                              vision documents and their exact git provenance.
│                              DIRECTIVE.md is authoritative; directive-contract.json
│                              is a structured extraction and defers to it
│
├── planning/
│   ├── PLANNING-REPORT.md     This document
│   ├── 00-executive-guide.md  What the system is, in plain language
│   ├── 01-understand.md       Ambition, invariants, tensions, nondelegable
│   │                          responsibilities, unproven hypotheses
│   ├── 02-architecture-selection.md   S1.0: selection, alternatives, trade-offs,
│   │                                  retained mechanisms, reopen conditions
│   ├── implementation-graph.json      B00–B11 with dependencies and completion evidence
│   ├── package-work-map.json          All 53 source fields and 24 groups → authoring tracks
│   ├── candidates/            A, B, C1, the C2 amendment, and the two repair addenda
│   ├── reviews/               EVERY independent review, archived verbatim:
│   │                          D/D2 candidate attacks · F-integration-01…04 ·
│   │                          F-cross-scope-01…03 · F-coverage-components-01 ·
│   │                          F-canonical-01 · G-acceptance-protocol (frozen before
│   │                          the reviewers read anything) · G-01…G-04
│   └── specification/         The twelve numbered contracts (01 kernel … 12 scope/
│                              lifecycle trace), their machine registries
│                              (capabilities · work-knowledge · integrations-build ·
│                              components-authority · scope-lifecycle), and
│                              contracts/ — the canonical registries, schemas,
│                              validate_contracts.py, negative fixtures and tools
│
├── coverage/                  package.json (24 families) · questions.json (566) ·
│                              supplemental.json (62) · discovered.json (15) ·
│                              capability-requirements.json (46) · status-rule.json
│                              (the rule that assigns every status)
│
├── registers/                 decisions.json (AD-001…014) · open-questions.json
│                              (Q-001…014 — THE FOUNDER QUEUE) · risks.json (17) ·
│                              review-findings.json (39) · specification-findings.json
│                              (FI-01…12, CCR-01…07) · claims.json · contradictions.json
│
└── research/                  L01–L14 (fourteen independent lanes) · lanes.json ·
                               cross-lane-comparison.json (ten unresolved axes) ·
                               source-index.json (305 locators) · substrate-claims.json ·
                               integration-claims.json · attack-coverage.json (33 cases) ·
                               baseline-results.json · repository-observations.md ·
                               implementation/N01-native-execution.md ·
                               reviews/ (six independent source audits)
```

### How to resume — the procedure, not a narrative

1. **Read [state.json](../state.json) first.** It carries `phase`, `base_commit`, `planning_accepted`, `implementation_started`, the full `completed` list, `active_work`, `next_actions`, `dependencies`, `registers`, `constraints` and `active_risks`.
2. **Read the exact artifacts named in `next_actions`** — not a summary of them, and not this report in place of them.
3. **Inspect the current branch and working tree before editing.** [state.json](../state.json) `active_risks` records why, from an incident: a lost session left 38 MB of uncommitted canonical contracts in one lane worktree, and `state.json` did not know. **Scan every lane worktree with `git status --porcelain` before assuming state.json is the complete record.**
4. **Do not repeat completed source searches, and do not inherit historical measurements as current facts.** Re-run the instrument.
5. **Reviewers receive the subject and the acceptance criteria — never a producer's self-assessment.** That rule is what makes the Phase G archive worth anything.
6. `history.jsonl` holds the checkpoint trail if you need to reconstruct how a state was reached.

Authorization boundary, unchanged and restated because it is easy to drift past: repository-local research, planning, tests and implementation are authorized. **Additional spending, publication, outbound messages, legal commitments and consequential production deployment are not authorized by this directive.**

---

## 10. Where artifacts disagree

Collected rather than resolved. Each names both sides.

**1. The 566-row status distribution.** [G-01](reviews/G-01-completeness-vision-coverage.md) computed at frozen subject `7ddc066`: *"`status`: **566 of 566 = 'Requires further evidence'**. Zero rows in Answered … Requires founder decision …"* and raised G1-03 because the column carried zero discriminating bits. [coverage/status-rule.json](../coverage/status-rule.json) now records 326 Answered / 142 Requires further evidence / 77 Requires founder decision / 21 Requires external professional. **Both are correct about different trees.** The g1-coverage repair lane landed between them and status-rule.json marks itself `"repair_state": "G1-02 and G1-03 repaired, pending independent recheck"`. The frozen archive is not edited to match, deliberately.

**2. The validator's own numbers, across four readings.** [G-02](reviews/G-02-coherence-buildability-changeability.md): 252,513 checks · 173 records · 184 values · **105** commands · 2,255 predicates · 1,295 edges · 13 fixtures rejected. [G-04](reviews/G-04-traceability-alternatives-feasibility-responsibility.md), same frozen subject, same run: **252,511** checks — a two-check difference neither report explains. [state.json](../state.json) records 207,205 checks and **104** commands and 2,252 predicates at the recovered commit `cb4bf52`, then 252,513 checks and 13/13 fixtures after the canonical repair, then **267,079** checks and **18** negative fixtures after the phase-content merge. Most of the spread is genuine tree movement. The G-02/G-04 two-check gap on one subject is not, and is unexplained.

**3. FI-11's residue, measured three ways.** The register's own oracle reported **210 harsh sibling collisions and 92 all-strings-erased skeletons**. [G-02](reviews/G-02-coherence-buildability-changeability.md) decomposed the 210 and found **199 differ by `event_kind`/`target_state`/`result`** — real discrimination that the harsh measure destroys by erasing the very discriminator it looks for — leaving **6** pairs differing solely by `predicate_id` and `to_state`. [state.json](../state.json) records, after the phase-content merge: 0 sibling collisions with state literals erased, 5 all-strings-erased pairs all declared as gaps, 327 skeletons. **The reviewer's point survives all three numbers and is the one to keep:** *"What is genuinely missing is not content but a ratchet"* — `guard_distinctness.py` returns 0 unconditionally, and 3 of 3 criterion-content mutations leaked through the package's own fixture harness. G2-06 is that finding.

**4. Is "coverage" one of the twelve dimensions?** [G-01](reviews/G-01-completeness-vision-coverage.md) says it held *"three of the twelve dimensions (completeness, vision preservation, coverage)."* The twelve-dimension table in [G-acceptance-protocol.md](reviews/G-acceptance-protocol.md) does **not** list coverage; it lists traceability, which G-04 held, and treats coverage as a separate three-direction check under its own heading. This report's [twelve-row table](#phase-g-verdict) follows the protocol. It matters arithmetically: "eleven of twelve sufficient" is only true on the protocol's list — on G-01's reading there are thirteen judged items.

**5. G-01's own dimension arithmetic.** Its "Not checked" section opens *"**Nine of the twelve dimensions**, judged by no one in my pass"* and then lists ten. A small slip in a verbatim archive; recorded because the archive is not edited.

**6. G1-01 against the current register.** [G-01](reviews/G-01-completeness-vision-coverage.md) found `contract_location` null on all 46 capabilities in [capability-requirements.json](../coverage/capability-requirements.json). Recomputed at the current head for this report: **0 of 46 null**, and the file's `status` now reads *"Contract authored for every capability … implementation not started."* Repaired, not independently rechecked.

**7. Stale consolidation claims (G4-06).** [07 §8](specification/07-integrations-capacity.md) and [08 §8](specification/08-improvement-implementation.md) both state that the nine-component nineteen-attribute matrix *"remains a separate consolidation obligation."* [components-authority.json](specification/components-authority.json) holds 9 × 19 = 171 entries, none empty, matching [10](specification/10-components-authority-traceability.md). Both 07 and 08 were authored before 10, so the claim was true when written and is false now. A reader following 08 §8 would redo finished work.

**8. Whether the threat registers cover the specification.** [risks.json](../registers/risks.json) and [attack-coverage.json](../research/attack-coverage.json) present themselves as covering the design; G3-01 computed that they contain **zero** references into `planning/specification/` and are bound to a commit that predates its existence. The registers' content is substantive; their binding is to the wrong subject. Both facts hold at once.

---

*Prepared against the package at branch `docs/vision-planning-report`, based on `c5aac4a`. Every count in this document was either read from the cited file or recomputed against it on 2026-09-13. Where a count came from an archived review rather than a live file, the review is named and the archive is not edited to agree with the present tree.*
