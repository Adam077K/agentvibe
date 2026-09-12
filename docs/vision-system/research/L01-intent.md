# L01 — Preserving intent without freezing the company

Research date: **2026-09-12**. Status: independent research, not an architecture decision. Scope: one owner or a small team, from exploration through operation, succession, and closure. The two vision inputs and the latest dispatch directive were read; no other research lane or architecture plan was opened. Repository engine guidance governed artifact production only.

Labels: **[F]** founder constraint; **[E]** sourced empirical finding; **[T]** formal result or conceptual account; **[I]** inference or proposed mechanism; **[U]** unresolved. Confidence concerns evidential support, not the authority of a founder value.

## What must survive, and what must remain questionable

**[F]** The ambition is responsible work at a scale the owner cannot personally inspect, while preserving intent, truthful reporting, competence, and authority bounded by consequences. The latest directive requires the whole company lifecycle and rejects routine founder approvals. Historical topology, stack, counts, and approval rituals are not requirements. The founder retains authority over desired ends and acceptable exposure; the system must make progress inside the resulting boundaries.

**[U]** The vision also contains empirical and commercial assertions: no vendor will build a truthful account; most ideas fail because discovery costs too much; judgement inevitably decays without direct work; owner drift has no internal signal. These are not established by the supplied text. Neither a durable commercial advantage nor the impossibility of vendor competition follows from wanting independent evidence. This lane performed no market census or longitudinal founder study. Likewise, concentrated answerability is a founder value here, not a finding about legal liability in every jurisdiction. [Vision input](../inputs/THE-VISION-AND-THE-FIELDS.md).

## Findings

### 1. Intent needs distinctions before it needs a representation

**[T]** Goal-oriented requirements research separates desired outcomes, assumptions about the environment, alternative refinements, and conflicts. A goal allocated to the environment is not something the software can itself enforce. That distinction prevents “customers want this” from becoming a requirement that passes when code ships. [S1](https://webperso.info.ucl.ac.be/~avl/files/RE01.pdf).

**[I]** Preserve at least the difference between a value, a chosen objective, a hypothesis, a preference, a delegated decision, and an external commitment. These are semantic distinctions, not prescribed database entities. “Explore a subscription” does not mean “sell a subscription”; “prefer inexpensive tools” does not authorize purchases. Requirements should retain the beneficiary, intended change, prohibitions, rationale, unresolved tradeoffs, and evidence that would demonstrate success or invalidate the approach.

**[E]** Gotel and Finkelstein's study involved over 100 practitioners and located much traceability difficulty before requirements entered a specification. **[I]** Therefore linking outputs to task identifiers is insufficient: the origin, interpretation, and revision of the task itself must remain discoverable. The 1994 study does not establish the effectiveness of any current agent implementation. [S2](https://discovery.ucl.ac.uk/id/eprint/749/1/2.2_rtprob.pdf).

### 2. Preserve the decision's lineage without mistaking it for truth

**[T]** W3C PROV distinguishes entities, activities, attribution, derivation, revision, and invalidation. It supplies useful vocabulary for recording origins and changes. **[I]** A provenance record can accurately show who asserted a false claim; attribution alone cannot establish validity, completeness, authorization, or faithful interpretation. [S3](https://www.w3.org/TR/2013/REC-prov-dm-20130430/).

**[I]** Retain original wording alongside the current interpretation, its scope, author, effective period, rationale, dependencies, and correction history. Record an interpretation made before action separately from an explanation reconstructed afterwards. For omissions, preserve what coverage was attempted and what could not be observed. No mechanism can enumerate every unknown omission, so an honest account must expose its observation boundary.

**[I]** Test reconstruction with someone who did not perform the work: can they distinguish what was requested, assumed, authorized, done, and still owed? A persuasive narrative is not sufficient evidence that those distinctions survived.

### 3. Learning a preference must not manufacture authority

**[T]** Armstrong and Mindermann show that behavior alone cannot uniquely identify both a person's preferences and their planning process; a simplicity prior does not remove the ambiguity. This is a formal limitation under their model, not proof that useful personalization is impossible. [S4](https://arxiv.org/html/1712.05812v6).

**[T]** Cooperative inverse reinforcement learning models instruction and learning as interaction under uncertainty about the human's reward. Its shared-reward assumptions are useful to examine, not a demonstrated description of a company with multiple stakeholders. [S5](https://arxiv.org/html/1606.03137v4).

**[E]** Amershi and colleagues evaluated interaction guidelines with 49 design practitioners across 20 products. The guidelines include correction, cautious adaptation, granular feedback, and communicating future effects. Their study does not validate autonomous corporate governance. [S6](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf).

**[I]** A correction should identify what changes and where: this output, this project, this class of work, or a standing boundary. An explicit stop or narrowed permission takes effect immediately; ambiguous generalization remains a hypothesis. Repeated acceptance can inform presentation preferences, but cannot silently increase spending, publication, or data authority. Silence and exhausted assent are poor evidence of endorsement. With several people, retain whose preference it is and their decision rights rather than averaging them into a fictional founder.

### 4. Preserving intent includes preserving the right to revise it

**[I]** Three interpretations compete:

- Literal preservation protects wording but can perpetuate an obsolete or mistaken objective.
- Outcome preservation supports adaptation but invites the system to substitute its own interpretation of success.
- Reason-preserving revision keeps changes explainable while accepting that ends, facts, and tradeoffs evolve.

The third is a promising direction, not a selected architecture. Distinguish execution error, changed world assumptions, a clarified interpretation, an authorized change of ends, and unauthorized goal substitution. Each needs a different response. A strategy can be faithfully executed and still be wrong.

**[I]** Observe drift using concrete cases: original success and refusal examples, fresh customer evidence, and cases where an authorized correction should change behavior. Keep the earlier examples with their validity periods; replacing every inconvenient example conceals deterioration, while treating all historical examples as permanent conceals legitimate learning. No drift threshold or review cadence is established here.

### 5. Promises survive the task that created them

**[T]** Yolum and Singh distinguish creating, discharging, canceling, releasing, assigning, and delegating commitments. Their formal protocol treats creditor release differently from debtor cancellation and allows compensation obligations. These semantics are not a substitute for applicable contracts or law. [S7](https://www.csc2.ncsu.edu/faculty/mpsingh/papers/mas/aamas-02-protocols.pdf).

**[I]** Track the difference between an internal intention and what another person can reasonably expect. Abandoning an experiment may still leave refunds, service promises, deletion requests, and correction duties. Delegating fulfillment does not by itself establish that the counterparty accepted a new responsible party. Sale, succession, and closure require continuity of commitments, not just transfer or deletion of task history. “Done” needs evidence of the relevant outcome, and sometimes the other party's acknowledgement.

### 6. Human involvement should buy understanding or settle values

**[T]** Santoni de Sio and van den Hoven propose meaningful control through responsiveness to relevant reasons and facts, plus traceability to humans who understand the system and their role. This is a philosophical account; it does not prescribe a person approving each action or establish legal compliance. [S8](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2018.00015/full).

**[E]** Bıyık and colleagues found benefits from choosing informative, answerable preference questions in simulations and user studies: 15 simulation participants and 12 robot participants. Corporate decisions remain an untested transfer. [S9](https://iliad.stanford.edu/pdfs/publications/biyik2019asking.pdf).

**[I]** Ask for a human decision when an unresolved value or authority boundary matters to the next consequence. Resolve facts through research and implementation choices within existing authority. Competence contact has a separate purpose: periodically explain a live customer problem, predict an outcome before seeing the summary, or inspect a consequential disagreement. Whether these exercises preserve competence without excessive burden needs measurement. Minimize interruptions without optimizing for an owner who never disagrees.

## Useful and rejected mechanisms

All entries below are **[I]**, candidates for investigation rather than adopted components.

| Worth testing | Reject as sufficient | Failure addressed |
|---|---|---|
| Original statement plus scoped interpretation | One endlessly rewritten company prompt | Corrections erase the original reason |
| Concrete success, refusal, and change examples | Text similarity to the vision | Similar wording hides contrary behavior |
| Correction with explicit applicability | Every approval becomes a global preference | One emergency exception becomes policy |
| Decision and commitment reconstruction | Exhaustive logs as proof of accountability | The record omits why or what remains owed |
| Consequence boundaries independent of confidence | More access earned through past success | Good history licenses a new kind of harm |
| Small, consequential human interactions | Repeated approval of routine work | Attention exhaustion resembles consent |

**[I] Failure fixtures:** a cheap experiment becomes public marketing; a local tone correction changes every customer's support; a partner issues a conflicting instruction; a stale rationale is copied into a fresh summary; several permitted actions aggregate beyond the owner's exposure limit; a canceled venture retains a service promise; an owner changes values and the system treats it as noise. A candidate should show what it detects, what continues, what stops, and what remains uncertain in each case.

## Confidence, freshness, and invalidation

| Claim family | Confidence and freshness | What would invalidate or restrict its use |
|---|---|---|
| Founder constraints | High confidence in supplied wording; current through 2026-09-12 directive | A later explicit correction; unresolved scope remains visible |
| Traceability and formal preference distinctions | High confidence in cited distinctions; historical research | Misapplication beyond stated assumptions; counterexamples to implementation claims |
| Interaction and elicitation transfer | Moderate; studies predate current corporate agents | Poor results in representative owner tasks; burden exceeding benefit |
| Proposed controls and competence contact | Low to moderate; untested here | Reconstruction failures, hidden scope expansion, declining owner understanding |
| Commercial exclusivity and affordability | Unestablished | Needs market evidence and measured total costs, including closure and attention |

**[U] Assumptions and questions other lanes may miss:** The owner can revise a preference without rewriting what was promised. A second human may legitimately constrain the founder. What information would customers insist remain undisclosed even when it would improve the account? Who may correct the record after the owner becomes unavailable? Which values must remain contested instead of being collapsed into one score? Can the owner correct the company's understanding without reopening every dependent task? Can the system distinguish learning what the owner wants from steering them toward what is easiest to execute?

This lane establishes research grounds and testable distinctions. It does not establish deployable autonomy, complete intent capture, market differentiation, jurisdictional obligations, or final architecture.

## Dated source index

All sources opened **2026-09-12**; dates below describe publication or inspected version, not search-engine crawl dates. Partial dates are retained where the source supplies no exact day.

| ID | Primary source and date | Evidence used |
|---|---|---|
| S1 | van Lamsweerde, *Goal-Oriented Requirements Engineering: A Guided Tour*, **2001-08**; author-hosted PDF | §§2–5: goals, assumptions, refinement, conflicts |
| S2 | Gotel and Finkelstein, *An Analysis of the Requirements Traceability Problem*, **1994**, day unavailable in inspected record | §§2, 5–8: study and pre-specification origins |
| S3 | W3C, *PROV-DM*, Recommendation **2013-04-30** | §§2.1, 5.2–5.3: derivation and responsibility |
| S4 | Armstrong and Mindermann, *Occam's Razor Is Insufficient…*, v1 **2017-12-15**, inspected v6 **2019-01-11** | Abstract, formal ambiguity, normative assumptions |
| S5 | Hadfield-Menell et al., *Cooperative Inverse Reinforcement Learning*, v1 **2016-06-09**, inspected v4 **2024-02-17** | §§1–3: interaction and shared reward assumptions |
| S6 | Amershi et al., *Guidelines for Human-AI Interaction*, CHI **2019-05-04–09** | Table 1 and practitioner evaluation |
| S7 | Yolum and Singh, *Flexible Protocol Specification and Execution*, AAMAS **2002-07-15–19** | §4: commitment operations and domain limits |
| S8 | Santoni de Sio and van den Hoven, *Meaningful Human Control…*, **2018-02-28** | Tracking and tracing conditions |
| S9 | Bıyık et al., *Asking Easy Questions*, arXiv v1 **2019-10-10** | §§7.3–8: user studies and limitations |

Local inputs: [vision](../inputs/THE-VISION-AND-THE-FIELDS.md), written **2026-09-07**, rewritten **2026-09-09**; [path](../inputs/THE-PATH-TO-THE-VISION.md), **2026-09-09**. Latest directive supplied through the lane brief on **2026-09-12** overrides historical process choices.
