# Step 0, artifact 2 — the current-position ledger for the work / agents layer

**Written:** 2026-09-13 · framer engine · round F2.
**Purpose:** every statement this package currently makes about work, agents, routing, layers, authority,
tools, skills, context engineering, shared state, tasks and task states, in one place, so that a later lane
cannot overturn one of them silently.
**Companion:** [`00-thesis-claims.md`](00-thesis-claims.md) — the `TC-` ids in the last column point there.
**Status:** frozen input to Step 1. **This ledger does not evaluate whether any statement is right.** That is
Steps 1 to 4.

---

## How to read it

**`tag`** is what the package itself asserts about the statement's standing, not what this ledger thinks of
it.

| Tag | Meaning |
|---|---|
| **decided** | Stated as normative (`SPECIFICATION`) or recorded as an adopted decision. Changing it is an amendment. |
| **assumed** | Stated as an initial default, an engineering guess or a `DESIGN PROPOSAL`, often carrying its own `UNKNOWN` label. Changing it is a parameter change. |
| **deferred** | Explicitly left open with a named reopen condition. |
| **hypothesis** | Asserted as a testable expectation the package does not claim to have established. |

**Citation shorthand.** Every path below is real and every section cited exists. All paths are relative to
`docs/vision-system/` except the last.

| Shorthand | File |
|---|---|
| `02` | [`planning/02-architecture-selection.md`](../02-architecture-selection.md) |
| `03-company-capabilities.md` | [`planning/specification/03-company-capabilities.md`](../specification/03-company-capabilities.md) |
| `04-human-operation.md` | [`planning/specification/04-human-operation.md`](../specification/04-human-operation.md) |
| `05` | [`planning/specification/05-work-agents-skills.md`](../specification/05-work-agents-skills.md) |
| `06` | [`planning/specification/06-knowledge-evidence-evaluation.md`](../specification/06-knowledge-evidence-evaluation.md) |
| `07` | [`planning/specification/07-integrations-capacity.md`](../specification/07-integrations-capacity.md) |
| `AD-nnn` | an entry in [`registers/decisions.json`](../../registers/decisions.json) |
| `research/Lnn-*.md` | [`research/`](../../research/) lane reports L01 to L14 |
| repository `CLAUDE.md` | [the repository root file](../../../../CLAUDE.md), outside `docs/vision-system/` |

**`binds_to`** names the fixed boundary the statement touches, from the six the
[handoff §0](../HANDOFF-F2-agents-work-layer.md) item 5 lists as fixed unless a lane returns a specific
falsifier — **consequence/release**, **evidence and acceptance**, **recovery**, **human responsibility**,
**founder competence**, **whole-company scope** — or the capability set in
[`coverage/capability-requirements.json`](../../coverage/capability-requirements.json).

**`reopen_trigger`** is quoted or paraphrased from the package where the package states one, and reads
`none stated` where it does not. A decided statement with no reopen trigger is itself a finding.

**`thesis_relation`** is relative to the founder's thesis, not to the package: *supports* means the package
already says something the thesis wants; *contradicts* means the package currently says the opposite;
*refines* means the package answers a narrower or sharper version of the same question; *orthogonal* means
the thesis does not reach it, and it is listed because a candidate model must not break it.

**Size.** 176 rows — well above the 40 to 80 the brief suggested. That was deliberate, and it is the one place
this artifact departs from its instructions: the brief also said to be exhaustive rather than elegant, and
each row here is a statement a Step 3 candidate could contradict without anyone noticing. Cutting to 80
would have meant choosing which statements a later lane is allowed to overturn silently.

**Counts by tag:** decided 160 · assumed 9 · deferred 5 · hypothesis 2. The shape of that distribution is
itself worth noticing before Step 1 reads a source: **this layer is recorded as almost entirely decided**,
and only 16 of 176 statements carry a tag that invites revision.

---

## A. Handoff §2 — what the package says about this layer, as summarized for this round

Source: [`planning/HANDOFF-F2-agents-work-layer.md`](../HANDOFF-F2-agents-work-layer.md) §2. These seven rows
duplicate statements that also appear in their own chapters below; they are kept because §2 is what a fresh
lane reads first, and a paraphrase that drifts from its source is its own defect.

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-01 | "Persistent model identities require demonstrated benefit over portable work records and temporary sessions. Existing roster names do not supply that justification." | decided | `02-architecture-selection.md` §3 | whole-company scope | §8: persistent identities deferred, each needs "its own comparator and removal trigger" | supports TC-12, TC-30 · refines TC-36 |
| CP-02 | Agents exist per **work order**, not as standing roles. | decided | `02-architecture-selection.md` §3, §4 | whole-company scope | none stated | supports TC-06 · refines TC-36 |
| CP-03 | The 46 capabilities are "required capabilities, not future departments". | decided | `02-architecture-selection.md` §6 | all 46 capability requirements | none stated | supports TC-30 |
| CP-04 | The production rule allocates work five ways: deterministic computation, durable procedures, bounded model work, capable people, qualified professionals. | decided | `02-architecture-selection.md` §3; `AD-002` | whole-company scope | `AD-002`: "Reopen an allocation when measured outcomes, cost or continuity favor another mode" | refines TC-17, TC-23 |
| CP-05 | Sponsors, not departments: each customer journey has one accepted outcome sponsor, and sub-work feeds evidence to it. | decided | `02-architecture-selection.md` §3; `03-company-capabilities.md` §"Outcome sponsorship is assigned before an offer becomes available" | evidence and acceptance | none stated | orthogonal to TC-06 · refines TC-41 |
| CP-06 | Unsponsored necessary work gets a custodian by rule and "cannot remain an unowned queue". | decided | `02-architecture-selection.md` §3; `03-company-capabilities.md` (ownership resolver paragraph) | human responsibility | none stated | supports TC-19 · refines TC-41 |
| CP-07 | What the existing harness taught — 21 named roles collapsed to seven generic engines — is "evidence about one harness, not a law". | hypothesis | `HANDOFF-F2-agents-work-layer.md` §2; repository `CLAUDE.md` | whole-company scope | none stated | supports TC-16 · bounds TC-10 |

---

## B. `02-architecture-selection.md` §3 — selected logical and responsibility model

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-08 | The nine components are "logical components and authority boundaries. They are not nine mandatory services or agents." Co-location is permitted only where it preserves fault and privilege separation. | decided | `02` §3 | consequence/release | none stated | supports TC-12 · refines TC-36 |
| CP-09 | A case coordinates work toward an outcome; an obligation survives that case; an operation can remain uncertain after both a worker and a plan stop. | decided | `02` §3 | consequence/release | none stated | refines TC-14 (a surviving obligation is not one of the thesis's five constituents) |
| CP-10 | Accepted work cannot discharge external standing through an internal status. | decided | `02` §3 | evidence and acceptance | none stated | orthogonal |
| CP-11 | The authority owning each transition verifies its prerequisites; "a convenient common 'done' flag cannot replace these distinctions." | decided | `02` §3 | evidence and acceptance | none stated | orthogonal |
| CP-12 | Transfer of responsibility requires acknowledged scope, access, competence and unfinished effects. | decided | `02` §3 | human responsibility | none stated | supports TC-01 |
| CP-13 | When capacity is absent, admissions narrow and accepted continuity activates; "the founder is not the routine reconstruction service." | decided | `02` §3 | founder competence | none stated | supports TC-29 · bears on TC-19 |
| CP-14 | The ownership resolver "assigns ownership, not new grants" and cannot become a second planner. | decided | `02` §3; `03-company-capabilities.md` | consequence/release | none stated | refines TC-41 |

---

## C. `02-architecture-selection.md` §4 — control, admission and external effects

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-15 | A work order names outcome, input versions, permitted read set, expected evidence, executor/method constraints, budgets, checkpoint, stop rule and acceptance owner. | decided | `02` §4 | evidence and acceptance | none stated | supports TC-13 (this record *is* most of the shared truth an executor sees) |
| CP-16 | Native performers may decompose a work order privately, with attenuated authority and total budgets. | decided | `02` §4 | consequence/release | none stated | supports TC-24 |
| CP-17 | "A model can propose another step but cannot admit its own larger mandate." | decided | `02` §4 | consequence/release | none stated | supports TC-24 |
| CP-18 | Bidding and negotiation are omitted initially; deterministic capability/availability routing plus bounded comparative assessment suffices "unless evidence shows otherwise". | assumed | `02` §4 | whole-company scope | the clause itself: evidence that it does not suffice | refines TC-41 |
| CP-19 | The scheduler reserves capacity for due obligations, complaint assessment, authorized containment, semantic maintenance and planned discovery before applying endorsed priorities. | decided | `02` §4 | human responsibility | none stated | orthogonal |
| CP-20 | "New revisions, descendants, model replacements and provider resets do not renew a spent work allowance." | decided | `02` §4 | consequence/release | none stated | supports TC-26 |
| CP-21 | One transactional logical authority per overlapping consequence scope; a partition cannot create another copy of usable authority. | decided | `02` §4; `AD-003` | consequence/release | `AD-003`: "a lost released operation, conflicting hold, unsafe status lookup, late invocation outside contract" | orthogonal — and it is a hard constraint on any parallel-executor design (TC-07) |

---

## D. `02-architecture-selection.md` §5 — native meaning, context, memory and improvement

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-22 | Native accounting, CRM, support, code, design and professional meanings remain authoritative in their domains; shared meaning covers only actual cross-boundary decisions. | decided | `02` §5; `AD-004` | whole-company scope | `AD-004`: "if a restricted derivative becomes usable or permitted work is persistently blocked without acceptable value" | **contradicts the simplest reading of** TC-31 — there is no single store |
| CP-23 | Mappings have owners, versions, examples, counterexamples, consumer dependencies and maintenance costs. | decided | `02` §5 | whole-company scope | §8: "remove common mappings with no consequential consumer" | refines TC-31 |
| CP-24 | Working context is attempt-local. | decided | `02` §5 | whole-company scope | none stated | refines TC-09 |
| CP-25 | Episodes preserve attributable attempts; semantic claims are scoped derivatives of evidence. | decided | `02` §5 | evidence and acceptance | none stated | refines TC-14 |
| CP-26 | Procedures and skills are versioned instructions with applicability, exclusions, provenance, test and retirement rules. | decided | `02` §5 | whole-company scope | none stated | supports TC-33 (the package's answer is "skill") |
| CP-27 | Start with record queries and permission-filtered lexical retrieval; graph or vector memory only for a named retrieval problem with measured benefit, and neither is the organizational source of truth. | decided | `02` §5, §8; `AD-004` | whole-company scope | §8: "Each needs its own comparator and removal trigger; no benefit inherited from selecting S1" | refines TC-31 |
| CP-28 | "Raw transcripts are evidence of captured interaction, not validated company knowledge." | decided | `02` §5 | evidence and acceptance | none stated | refines TC-13 |
| CP-29 | The loader captures all effective input lineage, including earlier context and tool metadata. | decided | `02` §5 | evidence and acceptance | none stated | supports TC-27 |
| CP-30 | Outputs stage immutably and become usable only through atomic validity checking and derivative registration. | decided | `02` §5 | consequence/release | none stated | orthogonal |
| CP-31 | Conservative lineage may overrestrict useful work and impose rebuilding cost; "that is measured, not waived by a model's assertion that it ignored a source." | decided (accepted cost) | `02` §5 | evidence and acceptance | none stated | orthogonal |
| CP-32 | Acceptance protects the transitive evidence base; "two models consuming the same bad parser do not supply that independence." | decided | `02` §5; `AD-005` | evidence and acceptance | `AD-005`: "false acceptance from a shared dependency, concealed exclusion or causal explanation stronger than its evidence" | **refines TC-11 and bounds TC-37** |
| CP-33 | Rationale is testimony about reasoning; it "cannot establish cause merely because a transcript and receipt are authentic." | decided | `02` §5 | evidence and acceptance | none stated | orthogonal |
| CP-34 | Improvement is another bounded case, and "no reward or demonstrated quality expands authority." | decided | `02` §5; `AD-008` | consequence/release | `AD-008`: "if cumulative accepted changes drift protected meaning, compromise evaluation or cannot be rolled back" | supports TC-25 |

---

## E. `02-architecture-selection.md` §8 — retained, deferred and removable mechanisms

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-35 | Retain adaptive cases and native meanings for unfamiliar work and domain-specific acceptance. | decided | `02` §8 | whole-company scope | "remove common mappings with no consequential consumer" | supports TC-18, TC-19 |
| CP-36 | Retain independently durable release and conflict holds; synchronous waiting, unavailable release, lineage and recovery administration are "accepted architectural costs, not yet priced". | decided | `02` §8 | consequence/release · recovery | none stated | orthogonal — and it is an unpriced cost any economics claim (TC-02, TC-20) must carry |
| CP-37 | Retain consequence-specific interaction and closure checks; no universal risk score and no company digital twin. | decided | `02` §8 | consequence/release | none stated | orthogonal |
| CP-38 | Retain independent evidence and fixed participation; "benefit must survive delayed tests". | decided | `02` §8 | founder competence · evidence and acceptance | the clause itself | supports TC-11, TC-29 |
| CP-39 | **Defer** independent internal issuers and negotiation; "never simulate independence with more services". | deferred | `02` §8 | consequence/release | "Add only for a real administrative boundary or demonstrated allocation gain" | supports TC-20 |
| CP-40 | **Defer** C2 general charter jurisdiction and the blackboard representation. | deferred | `02` §8, §2 | whole-company scope | "adopt only after useful discovery/continuity justifies reserved effort"; §9 "If C2 reveals valuable neglected work that scheduled review systematically misses" | orthogonal — the shared-representation question is TC-31's nearest prior art |
| CP-41 | **Defer** adaptive competence modeling, graph memory and persistent identities; "no benefit inherited from selecting S1". | deferred | `02` §8 | founder competence | "Each needs its own comparator and removal trigger" | supports TC-12 · this is the row a persistent-agent candidate (M2) must reopen |
| CP-42 | Measure money, observed provider allowance, local execution concurrency and owner attention separately. | decided | `02` §8; `AD-007` | whole-company scope | `AD-007`: "changed provider terms, observed billing-path ambiguity, capability drift" | supports TC-26 |
| CP-43 | Provider execution uses a versioned adapter; "portable continuation reduces dependence without claiming equivalent providers". | decided | `02` §8 | recovery | "Revalidate before reliance or change" | orthogonal |
| CP-44 | Repository reuse is selective; a five-hour parser is not remaining allowance and transcript projections are not obligation truth. | decided | `02` §8; `AD-010` | whole-company scope | `AD-010`: "incompatible meanings, hidden native writes, regression, lost obligations/restrictions" | orthogonal |

---

## F. `02-architecture-selection.md` §9 — what would reopen the selection

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-45 | Comparisons must hold external obligations, information, total resources, service requirements and owner allowance identical across arms (EAS-R1). | decided | `02` §9; `06` §8 | evidence and acceptance | none stated | **binds the method of** TC-02, TC-03, TC-07, TC-12, TC-16, TC-20, TC-22 |
| CP-46 | The maintenance comparison runs matched scope at 1×, 2× and 4× demand, counting founder translation, work discovery, connector/mapping repair, competent review and total coordination. | decided | `02` §9 | founder competence | "Material omitted duties, declining permitted completions or proportional recurring owner effort reopen S1" | **is fixture F2** for TC-02, TC-03, TC-20, TC-39 |
| CP-47 | If S0 delivers equivalent outcomes at lower full cost with sustainable attention, reduce the system. | decided | `02` §9; `05` §9 | whole-company scope | the clause itself | supports TC-21's negative control |
| CP-48 | Safety, service, customer value, economics, owner competence and attention are reported separately; "no aggregate score selects a winner". | decided | `02` §9 | evidence and acceptance | none stated | binds every measurement in the claims file |
| CP-49 | Reopen the foundation when repairs repeatedly require hidden manual coordination, broad multi-domain negotiation, permanent exceptions, speculative containment or unaffordable independent roots. | decided | `02` §9 | whole-company scope | the clause itself | orthogonal |

---

## G. `05-work-agents-skills.md` §1 — boundary, identity and responsibilities

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-50 | C01 owns endorsed ends; C02 owns admitted Cases, WorkOrders, scheduling, cursors, delegated scope and total causal allowance; C03 produces; C04 alone controls consequences; C05 supplies context and validity; C06 independently accepts; C07 supplies human performance; C08 owns recovery; C09 presents. | decided | `05` §1 | consequence/release · evidence and acceptance · recovery · human responsibility | none stated | refines TC-17 — this is the package's authority axis, and it is finer than the thesis's word "authority" |
| CP-51 | "A workflow, skill, model or temporary worker cannot acquire any of these authorities by containing instructions to do so." | decided | `05` §1 | consequence/release | none stated | supports TC-24 |
| CP-52 | Task is canonical `WorkOrder`; agent output is `AttemptReport`; Handoff is `Continuation` plus accepted responsibility transfer. | decided | `05` §1 | evidence and acceptance | none stated | supports TC-01 (the handoff has a named record, so its losses are measurable) |
| CP-53 | "No writable aggregate flag may override its underlying judgments or surviving obligations." | decided | `05` §1 | evidence and acceptance | none stated | refines TC-13 |
| CP-54 | Implementation is planned as a modular Node/TypeScript application with protected PostgreSQL command/timer/inbox/outbox transactions; "there is no roster of permanent domain personas". | assumed (`DESIGN PROPOSAL`) | `05` §1 | whole-company scope | none stated | supports TC-12 |
| CP-55 | C03 executors remain outside protected credentials and writable registry state. | decided | `05` §1 | consequence/release | none stated | supports TC-08 |

---

## H. `05` §2 — intent, scopes, dependencies and admission

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-56 | The smallest useful WorkOrder is one independently inspectable result or discriminating observation with a finite budget and an acceptance owner; "a token, arbitrary hour or persona conversation is not inherently useful work". | decided | `05` §2 | evidence and acceptance | none stated | supports TC-06 · this is the package's unit of work granularity |
| CP-57 | Mission, Project and Workstream parent links are optional; there is no mandatory four-level hierarchy. | decided | `05` §2 | whole-company scope | none stated | supports TC-30 |
| CP-58 | Decomposition starts from the outcome and surviving obligations; planning effort itself consumes a bounded WorkOrder, and "another plan with renamed subtasks is not progress". | decided | `05` §2 | whole-company scope | none stated | supports TC-02 |
| CP-59 | Stable known procedures can be admitted directly; unfamiliar work starts with a bounded discriminator before a large commitment. | decided | `05` §2 | whole-company scope | none stated | supports TC-18, TC-19 |
| CP-60 | `WorkDependency` carries kind, typed predicate, evidence freshness, custodian and latest responsible resolution time; C02 validates the actual execution graph at admission and cycles yield a named blocker plus a proposed cut. | decided | `05` §2 | whole-company scope | none stated | refines TC-34 |
| CP-61 | `Blocker` distinguishes unknown cause from known impossibility; "silence, a new timer, or a new worker name cannot resolve it". | decided | `05` §2 | evidence and acceptance | none stated | supports TC-19's honest-refusal requirement |
| CP-62 | The outcome sponsor notices combined drift and incompatible local successes through milestone review, "not by relying on workers to volunteer failure". | decided | `05` §2 | evidence and acceptance | none stated | refines TC-07 |
| CP-63 | WIP defaults to one running WorkOrder per temporary executor and one native producer per newly admitted execution profile until a bounded capacity trial establishes a higher limit. | assumed — labelled `UNKNOWN`, "an initial engineering default, not a founder attention preference or performance fact" | `05` §2 | whole-company scope | "until a bounded capacity trial establishes a higher limit" | **materially constrains** TC-07, TC-20, TC-39 |
| CP-64 | Global admission takes the minimum of executor slots, resource reservations, independent review capacity and human/service availability; "more backlog does not create more capable people or provider allowance". | decided | `05` §2 | whole-company scope | none stated | supports TC-26 |

---

## I. `05` §3 — workflow, run and step execution

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-65 | `WorkflowDefinition` is an immutable versioned procedure with typed ports, deterministic guards, allowed adaptive branches, time limits, retry/compensation contracts and acceptance roles. | decided | `05` §3 | whole-company scope | none stated | orthogonal |
| CP-66 | The admission owner chooses fixed versus adaptive mode "using uncertainty and cost evidence, not whether the producer prefers more freedom". | decided | `05` §3 | whole-company scope | none stated | supports TC-23 |
| CP-67 | Unknown cases leave the fixed path through an owned exception; they do not silently bypass gates. | decided | `05` §3 | consequence/release | none stated | supports TC-19, TC-40 |
| CP-68 | Only C02 advances the workflow cursor, in the same protected transaction that records the step result and creates the next work intent. | decided | `05` §3 | consequence/release | none stated | **is the package's answer to** TC-34 |
| CP-69 | Deterministic transformations execute without a model; a live regeneration is a new attempt, "never 'replay'". | decided | `05` §3 | evidence and acceptance | none stated | supports TC-23 |
| CP-70 | Stage is an epistemic or business position; status is whether execution is running, blocked or finished. Definitions "do not impose a coding pipeline on finance or support". | decided | `05` §3 | all 46 capability requirements | none stated | supports TC-30 |
| CP-71 | New contrary evidence can move the current projection backward through a recorded invalidation or review decision, preserving earlier acceptance history. | decided | `05` §3 | evidence and acceptance | none stated | refines TC-42 |
| CP-72 | Changing a definition creates a new revision with a migration plan; "the system does not replay a payment or customer contact to reconstruct a cursor". | decided | `05` §3 | consequence/release · recovery | none stated | orthogonal |
| CP-73 | Compensation is its own typed work with authority and acceptance; "cancelling the workflow never makes those results true". | decided | `05` §3 | consequence/release | none stated | orthogonal |

---

## J. `05` §4 — temporary workers, model choice and bounded reasoning

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-74 | `AgentTemplate` is a versioned production recipe — "not an identity with standing". `AgentInstance` binds it to one admitted WorkOrder, executor identity, runtime profile, lease epoch and generation. | decided | `05` §4 | whole-company scope | none stated | **is the package's answer to** TC-36 |
| CP-75 | Instantiating a worker "does not add a new role to company governance". | decided | `05` §4 | human responsibility | none stated | supports TC-12, TC-30 |
| CP-76 | "A general model can use a domain skill when the needed competence has passed relevant tests." A specialist is selected only for a demonstrated task distinction, confidentiality boundary, real professional requirement or measured cost/quality benefit. | decided | `05` §4 | all 46 capability requirements | none stated | **contradicts** TC-10 as the founder states it · refines TC-06 (four reasons, not five) |
| CP-77 | A role gap appears as an unowned required outcome, repeated unsupported handoff, missing competence or unacceptable wait. The maintenance custodian proposes; the legitimate capability owner approves; C06 evaluates. | decided | `05` §4 | human responsibility | none stated | **contradicts** TC-19 as stated — a human approves the change |
| CP-78 | Retirement requires reassignment of remaining work and revocation of effective tools and sessions, "not deletion of a name alone". | decided | `05` §4 | consequence/release | none stated | orthogonal |
| CP-79 | `ExecutionSelection` checks eligibility first — purpose and data destinations, actual auth and billing, required tool boundary, output contract, task evidence — then picks the least total expected cost meeting the acceptance constraints. "Provider/model names and leaderboard ranks alone cannot qualify a profile." | decided | `05` §4 | consequence/release | none stated | supports TC-23, TC-26 |
| CP-80 | Reasoning carries a visible `ReasoningPlan`; more reasoning is justified only when another bounded observation can change an important decision within its latest time. | decided | `05` §4 | evidence and acceptance | none stated | supports TC-02 |
| CP-81 | Conflicting instructions are resolved by authenticated authority, effective scope and current restrictions; "retrieved content cannot outrank them". | decided | `05` §4 | consequence/release | none stated | supports TC-08 |
| CP-82 | Producer self-checks "do not become independent acceptance". | decided | `05` §4; `06` §6 | evidence and acceptance | none stated | supports TC-11 |
| CP-83 | Trust is scoped eligibility, not a general score; increased autonomy requires observed conformance in the specific consequence/data domain, independent acceptance and an actual amended grant. "Success never expands authority automatically." | decided | `05` §4 | consequence/release | none stated | supports TC-25 |
| CP-84 | "Workers can read authorized peers' work projections; they cannot see all company context merely to coordinate." | decided | `05` §4 | consequence/release | none stated | **narrows** TC-13 — the shared source of truth is permission-filtered, not shared |

---

## K. `05` §5 — delegation, messages and accountable handoffs

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-85 | C02 owns assignment. An executor may propose a child only with a concrete independent result, exact inputs, acceptance role, scope exclusions, deadline, allowance and expected coordination benefit. | decided | `05` §5 | consequence/release | none stated | supports TC-06 |
| CP-86 | "Splitting is useful when independent bounded work can reduce elapsed time or provide a required different observation more than it adds transfer, review and integration cost." Unknown benefit gets a finite comparison, not permanent fan-out. | decided | `05` §5 | whole-company scope | the comparison itself | **is the package's version of** TC-07, stated without measurement |
| CP-87 | Default maximum delegation depth is one child layer (the depth number is an initial default); a second layer requires explicit admission rationale and reserved coordination capacity; deeper trees require a reviewed template change. | decided | `05` §5 | consequence/release | "a reviewed template change" | supports TC-20 |
| CP-88 | A child cannot further delegate founder values, professional standing, independent acceptance, untransferable access, or the parent's responsibility. Parent sponsorship survives until an actual accepted transfer. | decided | `05` §5 | human responsibility | none stated | supports TC-24 |
| CP-89 | `WorkMessage` kinds are assignment/question/observation/objection/correction/progress/result/stop_notice; `MessageAcknowledgment` separates received, understood-scope, accepted-assignment, refused and answered. "A receipt, model paraphrase or emoji cannot transfer duties." | decided | `05` §5 | human responsibility | none stated | supports TC-01 |
| CP-90 | Duplicate message identity returns its recorded result; retries reuse the identity and consume the original causal allowance; expiry prevents a stale assignment from starting. | decided | `05` §5 | consequence/release | none stated | supports TC-01 under F5 |
| CP-91 | Result transfer carries typed outputs, partial-state flags, criteria, warnings, amounts and units, unknowns, contradictions, source and omission refs, remaining duties, pending effects and next action. "A summary is an additional derivative beside the canonical Continuation, never its replacement." | decided | `05` §5 | evidence and acceptance | none stated | **supports** TC-01 and is the instrument that measures it |
| CP-92 | The receiver checks critical predicates against originals before acting; free-form prose "cannot fill missing required evidence". Each transformation records losses, and the next step can demand the original or stop the affected inference. | decided | `05` §5 | evidence and acceptance | none stated | supports TC-04, TC-32 |
| CP-93 | Questions name the exact missing fact, why it matters, needed-by time, default behavior and the independent work that can continue. No answer invokes a recorded bounded fallback; "it never means approval". | decided | `05` §5 | human responsibility | none stated | supports TC-29 under F6 |

---

## L. `05` §6 — concurrency, failure, retry and stop

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-94 | `WorkspaceAssignment` pins repository root, base revision, permitted paths, task identity and write lease. Separate standalone checkouts are the protected-source default; worktrees are a concurrency convenience only within a verified compatible trust scope. | decided | `05` §6 | consequence/release | none stated | constrains TC-07 |
| CP-95 | Worktrees do not isolate processes, ports, databases or network effects. | decided (`SOURCE CLAIM`, L04) | `05` §6; `research/L04-engineering.md` | consequence/release | none stated | **bounds TC-09** — isolation by workspace is not isolation |
| CP-96 | Two branches can propose changes to the same product meaning without touching the same file; semantic-conflict refs supplement path leases, and "a clean textual merge is not behavioral compatibility". | decided | `05` §6 | evidence and acceptance | none stated | **is the cost side of** TC-07 |
| CP-97 | A `FailureRecord` fingerprint uses stable semantic cause and scope; "cosmetic wording or a new agent ID cannot create fresh allowance". | decided | `05` §6 | consequence/release | none stated | supports TC-26 |
| CP-98 | For semantic production, one retry is allowed after a changed input, environment or method is identified within the existing allowance; two failed attempts with the same cause open a Blocker. | assumed (`DESIGN PROPOSAL`) | `05` §6 | whole-company scope | "A template may justify another finite policy using actual conformance evidence" | orthogonal |
| CP-99 | C02 checks heartbeat separately from meaningful progress; rework time, rejected attempts and abandoned outputs stay in the denominator. | decided | `05` §6 | evidence and acceptance | none stated | **binds the denominator for** TC-02, TC-03 |
| CP-100 | Stop preserves five facts: request, release fence, worker cessation, external-effect reconciliation and completed remedy. Expired leases fence writes; "they do not prove no external effect". | decided | `05` §6; `04-human-operation.md` | consequence/release · recovery | none stated | orthogonal |

---

## M. `05` §7 — durable schedules and capacity gaps

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-101 | The initial scheduler is a durable SQL timer sweep plus event-triggered wakeups; "no model runs merely to notice time". | decided | `05` §7 | whole-company scope | none stated | supports TC-23, TC-26 |
| CP-102 | Every schedule chooses one missed-occurrence policy from individual reconciliation, coalesce, skip-expired or escalate; "the software does not invent statutory deadlines or customer agreement terms". | decided | `05` §7 | all 46 capability requirements | none stated | orthogonal |
| CP-103 | Occurrence states are planned/due/admitted/running/completed/missed/disposed; missing work is not automatically marked completed when the next occurrence starts. | decided | `05` §7 | evidence and acceptance | none stated | orthogonal |
| CP-104 | Unattended work needs all prerequisites in standing mandates, available context and tools, finite budgets, acceptance and no-answer/continuity behavior **before starting**. | decided | `05` §7 | human responsibility | none stated | **constrains TC-19** under F6 |
| CP-105 | When the company has no due or authorized useful work, executors idle; planned discovery runs only within its adopted mandate. | decided | `05` §7 | whole-company scope | none stated | orthogonal |

---

## N. `05` §8 — instructions and reusable skills

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-106 | `InstructionBundle` holds a stable purpose/constraints contract, authority references, typed procedure, response requirements, examples and change history. Task-specific facts and current rights arrive through the WorkOrder and ContextManifest. | decided | `05` §8 | whole-company scope | none stated | refines TC-17 |
| CP-107 | No secret, reusable credential, private cross-purpose profile or supposed hidden authority belongs in an instruction; "a prompt can guide interpretation; deterministic boundaries enforce permissions". | decided | `05` §8 | consequence/release | none stated | supports TC-08, TC-24 |
| CP-108 | Repeated instruction noncompliance on a critical rule is evidence to change the mechanism or eligibility, "not just add more emphatic text". | decided | `05` §8 | consequence/release | none stated | orthogonal |
| CP-109 | `SkillVersion` is a reusable procedure package, "not a new agent", carrying applicability and nonapplicability predicates, typed ports, dependencies, consequence boundaries, evidence criteria, counterexamples, provenance and licence, tests, maintenance owner, review date and removal rule. | decided | `05` §8 | whole-company scope | "review date/invalidation triggers; replacement/removal rule" per the record itself | **is the package's answer to** TC-33 |
| CP-110 | "A prose package cannot install, contact, spend or execute by being loaded." Executable helpers are separately hashed artifacts with admitted worker privileges. | decided | `05` §8 | consequence/release | none stated | supports TC-08 |
| CP-111 | Write a skill when repeated work, hard-to-reconstruct constraints or shared failure shows expected reuse exceeds authoring, selection and maintenance cost; "a one-off procedure can remain a WorkOrder". | decided | `05` §8 | whole-company scope | none stated | supports TC-28 |
| CP-112 | Required skill tests include a valid case, malformed input, an out-of-scope case, a stale example or dependency, an injected instruction and an unavailable real performer. Test output and procedure-following are measured separately: "a skill can be loaded but ignored, or followed while producing a bad result." | decided | `05` §8 | evidence and acceptance | none stated | **is the instrument for** TC-10 |
| CP-113 | Selection starts with deterministic eligibility, searches only eligible metadata, then loads at most five candidates and two full skill bodies per selection, charged to the WorkOrder (both numbers are initial budgets). | decided | `05` §8 | whole-company scope | "When the admitted selection budget is exceeded, narrow by exact capability/type, use a known adequate baseline or open bounded catalog repair" | supports TC-28 |
| CP-114 | A composed plan pins a finite dependency DAG with compatible ports and unioned constraints; "a conflict cannot be resolved by concatenating prompts". | decided | `05` §8 | whole-company scope | none stated | supports TC-28 |
| CP-115 | Selection is measured at 10, 100 and 1000-package synthetic libraries with a stable relevant subset and adversarial near-duplicates. "These are test sizes, not proven capacity." | assumed — explicitly `UNKNOWN` | `05` §8 | whole-company scope | none stated | **is the fixture for** TC-28 |
| CP-116 | An unused emergency skill can remain necessary; an unused redundant skill can retire after dependency and obligation checks; access popularity is not a freshness signal. | decided | `05` §8 | whole-company scope | "Periodic review uses use/failure evidence and changed dependencies" | orthogonal |

---

## O. `05` §9 and §10 — conformance cases and registered phases

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-117 | The six conformance cases "are specified tests, not executed outcomes". | hypothesis | `05` §9 | evidence and acceptance | none stated | supplies fixtures for TC-07 (case 2), TC-01 (case 3), TC-19 (case 4), TC-10 (case 6) |
| CP-118 | Added coordination, deep delegation or large skill libraries "must be removed when equivalent useful outcomes require less total burden without them". | decided | `05` §9 | whole-company scope | the clause itself | **supports TC-20 and is the removal rule any candidate must accept** |
| CP-119 | Full-schema consolidation is deferred: materially distinct edge predicates, typed arguments and composite Evaluation references are later specification obligations. | deferred | `05` §9 | evidence and acceptance | "no runtime or conformance freeze is claimed here" | orthogonal |
| CP-120 | `AgentInstance.awaiting_input` is distinct from running and stopped; its lease clock keeps running, and expiry checkpoints the duties rather than silently retrying. | decided | `05` §10 | recovery | none stated | supports TC-01 under F5 |
| CP-121 | `FailureRecord.retry_admitted` requires new discriminating evidence or a changed condition; repetition with no new evidence is `blocked`. | decided | `05` §10 | consequence/release | none stated | supports TC-26 |
| CP-122 | `SkillSelection.no_match` (a searched answer) is distinct from `budget_exhausted` (an unfinished search), and neither is a selection. | decided | `05` §10 | evidence and acceptance | none stated | **is the right shape for** TC-40 one level up |
| CP-123 | `WorkDependency.waived-inapplicable` requires a competent scoped decision; scheduling preference, an unavailable source or an inconvenient deadline "can never produce this phase". | decided | `05` §10 | evidence and acceptance | none stated | orthogonal |

---

## P. `06-knowledge-evidence-evaluation.md` §1 to §4 — context, memory, retrieval, corrections

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-124 | Six memory jobs get distinct representations and write responsibilities: working, episodic, semantic, procedural, intent and preferences, and search projections. "Indexes are never authority." | decided | `06` §1 | whole-company scope | none stated | **refines TC-14** — six jobs where the thesis names five constituents |
| CP-125 | C03 proposes scratch and "cannot promote scratch to company knowledge". | decided | `06` §1 | evidence and acceptance | none stated | supports TC-42 |
| CP-126 | "Not found," "not searched," "inaccessible," "withheld by policy" and "insufficient evidence" are distinct dispositions. | decided | `06` §1 | evidence and acceptance | none stated | supports TC-40 |
| CP-127 | Intent and preference memory preserves original scope and effective time and "does not infer personality, health, general intelligence or unrelated habits". | decided | `06` §1 | founder competence | none stated | supports TC-29 |
| CP-128 | C05 implements a deterministic loader: the request names the WorkOrder, purpose, destination contracts and requested sources, and "the server discovers and records actual delivered inputs. The caller's claimed read list is not trusted." | decided | `06` §2 | evidence and acceptance | none stated | **is the instrument for TC-01, TC-04, TC-27, TC-32** |
| CP-129 | Model-provider traffic is itself disclosure, including tool stdout, error messages, fixtures and resumed history. | decided | `06` §2 | consequence/release | none stated | **binds the measure of** TC-09 |
| CP-130 | Mandatory context is the task purpose, acceptance criteria, applicable exclusions and procedure, scoped authority refs, known contradictions, partial outputs, unresolved effects and duties, and the next action. "Nothing quietly truncates a required promise, warning or permission boundary." | decided | `06` §2 | evidence and acceptance | none stated | **is the package's minimal shared truth**, refining TC-13 and TC-14 |
| CP-131 | At capacity: drop irrelevant background first, then attributed excerpts or a validated summary; if necessary material still cannot fit, split the work or select another runtime — never broader disclosure and never silently dropped conditions. | decided | `06` §2 | consequence/release | none stated | supports TC-04 |
| CP-132 | `ContextTransformation` and `SummaryLoss` record omitted alternatives, qualifiers, temporal relations, source uncertainty and unsupported reconstruction; critical preservation uses deterministic exact-field comparison plus an independent semantic challenge. | decided | `06` §2 | evidence and acceptance | none stated | **is the instrument for** TC-32 |
| CP-133 | "Longer accepted context is not proof of utilization." | decided (`SOURCE CLAIM`, L05) | `06` §2; `research/L05-memory.md` | evidence and acceptance | none stated | **bounds TC-05** — the single-context arm does not win by default |
| CP-134 | A native session may be resumed only when every retained input is allowed for current recipients and purpose; otherwise close the opaque route and rebuild from the portable Continuation. "Narrowing today's tools cannot remove yesterday's data." | decided | `06` §2 | consequence/release · recovery | none stated | supports TC-09 |
| CP-135 | Retrieval order is: authenticate and compute the allowed set, resolve explicit IDs, search only the eligible scope, rank, load permitted spans, recheck restrictions at delivery. "A query against all records followed by client-side filtering is prohibited." | decided | `06` §3 | consequence/release | none stated | supports TC-09 |
| CP-136 | Ranking includes linked corrections and material contrary claims even at low lexical rank; freshness is a use predicate or explicit warning, "not a popularity bonus", and repeated retrieval never renews verification. | decided | `06` §3 | evidence and acceptance | none stated | supports TC-42 |
| CP-137 | The initial retrieval budget inspects at most 20 candidate metadata records and loads at most eight source chunks per step. "These are bounded starting policies to test, not measured recall limits." | assumed (`DESIGN PROPOSAL`, `UNKNOWN`) | `06` §3 | whole-company scope | "a further search requires a named expected information gain within the same causal allowance" | orthogonal |
| CP-138 | Contradictions are compared on entity, time, conditions, units, source authority and interpretation; different scopes may both be valid, and otherwise a `ContradictionSet` is retained rather than forcing a winner. | decided | `06` §3 | evidence and acceptance | none stated | **is the package's answer to** TC-42 |
| CP-139 | Storage follows sensitivity and deletion scope, never field size; all unrestricted human, model and source text is protected by default. "An automated classifier cannot grant an exception." | decided | `06` §4 | consequence/release | none stated | orthogonal |
| CP-140 | The knowledge custodian refreshes by consequence, volatility and dependency use, not on a fixed timer; "time passing alone cannot renew a claim". | decided | `06` §4 | evidence and acceptance | "A material active prerequisite receives a review deadline"; overdue unverified evidence loses current eligibility | supports TC-42 |
| CP-141 | Forgetting has distinct operations — exclude from retrieval, supersede, archive, redact, erase — and `ForgetRequest` carries the legitimate instruction, sources, derivative closure, cutoff, owner and verification. | decided | `06` §4 | consequence/release | none stated | orthogonal |
| CP-142 | A correction requires an understanding check — a new bounded case or a direct critical-field check — because "storing the correction alone is insufficient". Test that a later worker uses the corrected value and rejects an obsolete permissive snapshot. | decided | `06` §4 | founder competence | none stated | **is the instrument for** TC-42 |

---

## Q. `06` §6 and §7 — evaluation contracts and independence

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-143 | `EvaluationPlan` is registered before treatment results are seen; `EvaluationRun` and `Review` have no independent release authority, and canonical `EvidenceJudgment` owns accepted scope. | decided | `06` §6 | evidence and acceptance | none stated | binds the method of every TC measurement |
| CP-144 | Evaluation is defined at fourteen subjects including agent instance/template — where "heartbeat and output volume are not progress" — handoff, skill, decision and evaluator. | decided | `06` §6 | evidence and acceptance | none stated | supplies the measures for TC-01, TC-10, TC-11 |
| CP-145 | The skill evaluation row requires comparing "a direct procedure with the same outcome criteria". | decided | `06` §6 | evidence and acceptance | none stated | **is the comparison for** TC-10 and TC-33 |
| CP-146 | The handoff evaluation row requires that a new worker performs unfamiliar next work using exact constraints, partials and unknowns, testing lost and duplicate acknowledgment and a harmful omitted qualifier. | decided | `06` §6 | evidence and acceptance | none stated | **is the fixture for** TC-01 |
| CP-147 | The producer may supply self-checks and answer factual questions but "cannot become sole independent acceptor by changing role labels". | decided | `06` §6 | evidence and acceptance | none stated | supports TC-11 |
| CP-148 | "An always-pass reviewer must fail the known-defect control." Review findings are not silently overridden; a residual defect requires an explicit scoped disposition preserving dissent and expiry. | decided | `06` §6 | evidence and acceptance | none stated | **is the negative control for** TC-11 |
| CP-149 | Four versioned case pools are maintained: fixed regression, fresh eligible production samples, withheld challenge, and adversarial sequences. | decided | `06` §7 | evidence and acceptance | none stated | orthogonal |
| CP-150 | Initial stochastic diagnostics use five attributable trials per selected case when budget permits. "This is a defect-discovery default, not a reliability certificate." | assumed — labelled `UNKNOWN` | `06` §7 | evidence and acceptance | "a budget too small for the claim leaves it unresolved" | binds every TC measurement's trial count |
| CP-151 | Retain all trials, not best-of-many; distinguish any-success, all-success, per-attempt, per-request and per-fulfilled-duty rates. | decided | `06` §7 | evidence and acceptance | none stated | binds TC-02, TC-03, TC-07 |
| CP-152 | Negative controls include a sham change expected not to improve the endpoint; positive detection controls inject a known defect, fake citation, skipped authorization, omitted failed attempt, changed denominator, poisoned skill or dropped promise. | decided | `06` §7 | evidence and acceptance | none stated | **is the planted-defect set for** TC-11, TC-32, TC-42 |
| CP-153 | "Independent perspective means different relevant evidence, method, measurement or competent human grounding under separate protected authority." A different model family adds a tested viewpoint but is not proof of independent error. | decided | `06` §7 | evidence and acceptance | none stated | **contradicts the simplest reading of** TC-11 · **is the package's answer to** TC-37 |
| CP-154 | Prefer the cheapest observation that can discriminate: actual destination state, a deterministic counterexample, original customer evidence or a scoped professional assessment. | decided | `06` §7 | evidence and acceptance | none stated | supports TC-37 |
| CP-155 | "Measure joint false acceptance on controlled defects before treating panel agreement as extra assurance." | decided | `06` §7 | evidence and acceptance | none stated | **is the measure for** TC-11, TC-37 |
| CP-156 | On disagreement, preserve each finding, identify whether scope, evidence, method or uncertainty differs, and obtain the cheapest discriminating test. Difficult taste or forecast questions may remain unresolved. | decided | `06` §7 | evidence and acceptance | none stated | orthogonal |
| CP-157 | A checker drifting toward agreement is challenged with independently held defects, swapped identities and order, original-source review and false-positive controls. | decided | `06` §7 | evidence and acceptance | "invalidated evaluator dependencies withdraw affected acceptance until reassessed" | supports TC-37 |

---

## R. `07-integrations-capacity.md` §6 — capacity, money and scheduling

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-158 | Subscription entitlement, provider quota buckets, native-job launches, compute, disk, network, paid calls, customer delivery capacity and human attention are separate units. "Money cannot be inferred from token estimates, and an included subscription call still uses scarce capacity." | decided | `07` §6; `AD-007` | whole-company scope | `AD-007` reopen trigger | **is the unit system for** TC-02, TC-26 |
| CP-159 | Capacity policy **CP1** initializes at one native job and one external job concurrently, with separate reserved service, grievance and recovery work. | assumed (`DESIGN PROPOSAL`) | `07` §6 | whole-company scope | "Increasing concurrency is a reviewed CapacityPlan revision after measured resource and provider allowance evidence" | **makes several thesis costs untestable at current capacity** — TC-07, TC-20, TC-39 |
| CP-160 | Proposed planning shares are 50% due service and commitments, 20% ordinary creation and research, 15% continuity/security/grievance, 10% maintenance and evaluation, 5% discretionary exploration. "The actual mandate must endorse shares and minimum absolute service capacity before use." | deferred (awaiting mandate endorsement) | `07` §6 | human responsibility | the endorsement itself | orthogonal |
| CP-161 | Dispatch uses earliest real obligation deadline within class, then age; reservations stop speculative improvement consuming the protected due-service share, and "borrowing never removes a due-service minimum or creates authority". | decided | `07` §6 | human responsibility | none stated | **is the package's routing rule**, refining TC-34 |
| CP-162 | Pressure is the maximum of independently observed saturation dimensions, "not a blended score that hides exhausted money or attention". | decided | `07` §6 | whole-company scope | none stated | supports TC-26 |
| CP-163 | Allowance observations carry source, observed_at, valid_until, account, bucket, reset and remaining-or-unknown, refreshed before launch and at most every five minutes while active; custodian billing observations expire after 24 hours. | decided | `07` §6 | consequence/release | none stated | orthogonal |
| CP-164 | If a provider has no reliable remaining value, schedule conservatively at one launch and use actual throttling plus finite episode reservations, "not invented task capacity". | decided | `07` §6 | whole-company scope | none stated | constrains TC-07 |
| CP-165 | Start with the least expensive qualified profile and increase effort only after a specific deficiency and remaining reservation. "Neither preference nor model branding establishes quality." | decided | `07` §6 | consequence/release | none stated | supports TC-23 |
| CP-166 | The $400 subscription baseline "is an assumption from L10, not an infrastructure budget or permission to spend"; actual owner cap, operating hours and authorized spend are required setup data. | assumed | `07` §6; `AD-007` | whole-company scope | `AD-007`: changed provider terms | bounds TC-02, TC-20, TC-39 |
| CP-167 | Native execution profiles are N-CLAUDE-SUPPLIED, N-CLAUDE-MEDIATED and N-CODEX-SUPPLIED; the Codex profile is admitted only after an exact installed-capability inventory, and until then the Claude supplied-input profile is the selected native route. | decided | `07` §5 | consequence/release | "Admit only after the exact installed capability inventory and all-channel tests" | **bounds TC-37** — cross-family verification is not currently reachable |

---

## S. Decision register entries touching this layer

| id | statement | tag | citation | binds_to | reopen_trigger | thesis_relation |
|---|---|---|---|---|---|---|
| CP-168 | One logical admission authority, native production, and protected consequence/evidence/recovery boundaries (S1.0), chosen on structural inference with "no measured superiority". | decided | `AD-001` | whole-company scope | "Reopen if omitted duties or proportional owner coordination persist; prefer S0 if equivalent outcomes cost less, B for beneficial real administrative autonomy, C2 for useful neglected inquiry" | **is the coordinator TC-41 asks about** |
| CP-169 | Specialized production without a department-agent roster; "persistent identity benefit remains unproved". | decided | `AD-002` | whole-company scope | "Reopen an allocation when measured outcomes, cost or continuity favor another mode" | supports TC-12, TC-30 · contested against TC-10 |
| CP-170 | Native meaning with conservative context validity: full input lineage, atomically validated derivatives, restrictions serialized with release. Accepted costs include over-invalidation and rework. | decided | `AD-004` | evidence and acceptance | "if a restricted derivative becomes usable or permitted work is persistently blocked without acceptable value" | refines TC-31 |
| CP-171 | Protect interpretation as well as evidence capture; "two model judges as independence" is a named rejected alternative. | decided | `AD-005` | evidence and acceptance | "false acceptance from a shared dependency, concealed exclusion or causal explanation stronger than its evidence" | **contradicts a naive reading of** TC-11 |
| CP-172 | Fixed contestable owner participation and meaningful external redress; "longitudinal benefit and affordable institutional capacity unproved". | decided | `AD-006` | founder competence · human responsibility | "if unfamiliar material misunderstanding escapes, user disagreement is treated as incapacity, complaints strand, or required burden defeats viable operation" | supports TC-29 |
| CP-173 | Separate money, provider capacity, compute and attention; no automatic paid fallback, no shared customer use of personal subscription credentials. | decided | `AD-007` | whole-company scope | "changed provider terms, observed billing-path ambiguity, capability drift" | **is** TC-26 |
| CP-174 | Controlled improvement with a protected acceptance boundary; protected intent, authority, identity, evidence and evaluator dependencies require separately authorized changes. | decided | `AD-008` | consequence/release | "if cumulative accepted changes drift protected meaning, compromise evaluation or cannot be rolled back with dependent state" | supports TC-25 · constrains any self-modifying answer to TC-19 |
| CP-175 | Full capability lifecycle with actual fulfillment; a catalog, plan or truthful blocked packet is not completed company work. | decided | `AD-009` | all 46 capability requirements | "Reopen any completion claim that lacks performance or legitimate disposition" | **is the completeness bar** every candidate model must meet |
| CP-176 | Per-phase criterion content is authored by derivation from the prose contracts with a citation, never invented; where the prose is silent the criterion is marked `content_unspecified` and the gap is registered. | decided | `AD-012` | evidence and acceptance | "if a prose contract is amended to state a per-phase requirement that an existing criterion contradicts" | orthogonal — but it governs how Step 5 may amend the contracts |

---

## What this ledger deliberately leaves out

**It does not judge.** Eleven rows are marked as contradicting, narrowing, bounding or constraining the
thesis — CP-22, CP-63, CP-76, CP-77, CP-84, CP-95, CP-133, CP-153, CP-159, CP-167, CP-171 — and none of them
is scored here as right or wrong. Two pairs are worth a lane's attention on sight, because they are places
where the package's current answer and the founder's thesis cannot both stand:

- **CP-76 and CP-77 against TC-10 and TC-19.** The package says a general model plus a tested skill covers
  domain competence, and that a role gap is closed by a human approving a changed contract. The thesis says
  specialized knowledge earns an agent, and that the system must absorb jobs nobody anticipated. Those are
  different designs, not different wordings.
- **CP-84 and CP-159 against TC-13 and the whole cost argument.** The package narrows shared state to
  permission-filtered peer projections, and holds concurrency at one native job plus one external job. At
  that concurrency several of the costs the thesis names cannot arise at all, which means the thesis's own
  premises are currently unmeasurable in this system as specified.

**It does not rank.** Importance is a Step 2 output.

**It does not cover** chapters `01`, `02`, `04`, `08` and `11` except where they were cited by the sections
in scope. If Step 1 finds that a candidate model touches the kernel, authority/recovery or human-operation
contracts, those chapters need their own ledger rows before Step 3 writes against them.
