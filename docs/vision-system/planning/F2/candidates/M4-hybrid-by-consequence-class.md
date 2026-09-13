# M4 — Hybrid by consequence class

> **Provenance.** Candidate M4 for F2 Step 3, 2026-09-13, written blind of the four sibling candidates: no
> other file under `planning/F2/candidates/` was read. Formed against the frozen
> [acceptance protocol](../00-acceptance-protocol.md) (`26af5d5`) and
> [AM-01](../00-acceptance-protocol-amendments.md). Reads, in order: protocol and amendment;
> [founder thesis](../../../inputs/FOUNDER-THESIS-2026-09-13-agents.md) and
> [`00-thesis-claims.json`](../00-thesis-claims.json); the
> [cross-lane comparison](../../../research/F2/cross-lane-comparison.md) whole; lanes R1, R2, R4, R5, R7, R8
> whole and R3, R6 where the comparison pointed; [`02-architecture-selection.md`](../../02-architecture-selection.md),
> [`02-authority-recovery.md`](../../specification/02-authority-recovery.md),
> [`05`](../../specification/05-work-agents-skills.md), [`06`](../../specification/06-knowledge-evidence-evaluation.md),
> [`07`](../../specification/07-integrations-capacity.md), [`capabilities.json`](../../specification/capabilities.json),
> [`capability-requirements.json`](../../../coverage/capability-requirements.json); and
> [DIRECTIVE](../../../inputs/DIRECTIVE.md) §1.5, §1.6, §6, §7 Phase C, §8.7, §8.8, §8.16, §8.21.
>
> **Standing caveat.** No runtime exists. Every number cited is about some other system, task distribution and
> date, carried with the lane finding that produced it. This candidate reopens **no fixed boundary** and
> routes **no decision packet**. Statement kinds follow [DIRECTIVE §6](../../../inputs/DIRECTIVE.md).

---

## 1. Summary for the founder

**One rule: what an action can do to somebody decides who carries it, and that is computed from records the
worker cannot write.**

Your five reasons for creating an agent came back uneven. The strongest, distinct tools or permissions, is the
only one enforced outside the model. The weakest, specialized knowledge, shows no measured benefit over a
general worker loading a tested skill [R2 F-09, F-10]. A sixth reason survived adversarial search and R2 calls
it the strongest leftover: **consequence class** [R2 F-21.3]. M4 makes that leftover the only rule, because it
is the one axis that is a property of the work rather than of the worker.

Five structures carry everything. A **workflow step** where the answer is computable. An **ephemeral worker**
holding a typed manifest where interpretation is needed. A **standing holder** where an outside party has a
right to reach us and a clock runs while no job is open. A **person**. A **professional**. Nothing has a job
title; nothing is named after a department.

"Persistent" means a *record*, not a model with a memory. A standing holder is an address, a mandate, a
reserved slice of capacity, a named alternate and a review date; its worker is created fresh per contact and
thrown away. Nobody has measured a persistent model identity improving an outcome, and the two most-cited
deployments fail to support it [R8 A-7]. So M4 buys the load-bearing half, someone reachable six months later,
and refuses the rest. Nine such holders exist, not forty-six.

**What you are buying.** A refund, a promise and an outward message stop being content work and become C3 and
C2 actions with named acceptors. A grievance from a non-customer six months after closure reaches a party that
already existed. A lane shed at 4× demand is shed by someone, with a record.

**What you are paying.** One new computed object everything depends on, so an error in it is correlated across
the company. More machinery than today. And the honest limit: **if most of a month's work is low-consequence,
M4 is not paid for and the right answer is a smaller system.** §9 names that falsifier and its measurement.

*(292 words.)*

---

## 2. Core primitives

**SPECIFICATION.** M4 adds four things to S1.0 and renames nothing. §9.1 separates new from retained
explicitly, because a hybrid is the candidate most at risk of failing negative control 1 by relabelling.

### 2.1 The class vocabulary is the existing one

**SPECIFICATION.** The classes are exactly the six routing classes in
[`02-authority-recovery.md` §4](../../specification/02-authority-recovery.md), with their existing meanings and
their existing property of being *predicates rather than a total privilege rank*: **C0** local computation ·
**C1** controlled internal mutation · **C2** external disclosure or contact · **C3** economic or contractual ·
**C4** production, physical or security · **C5** protected control change.

The *criteria* populating them are [DIRECTIVE §8.16](../../../inputs/DIRECTIVE.md)'s ten — reversibility,
financial impact, public visibility, legal effect, customer effect, privacy, security, data sensitivity,
system integrity, blast radius — carried in the existing `ConsequenceVector`, whose dimensions are already
separate and already refuse a universal risk number. **M4 introduces no seventh class and no severity score.**
The per-capability `consequence_classes` strings in `capabilities.json` (`remedy`, `personal-data`,
`customer-promise`, …) are domain labels on a contract, not runtime classes; §2.2 gives them a narrow role.

### 2.2 `ConsequenceDerivation` — the new primitive, and the candidate rests on it

**DESIGN PROPOSAL.** One record binding a proposed operation to its class and to the refs it was computed from:

~~~text
ConsequenceDerivation.payload = {
  operation_intent_ref, payload_digest,           // the frozen bytes, not a description of them
  derived_class: C0|C1|C2|C3|C4|C5,
  contributing_dimensions: [{ dimension, class_reached, source_ref, source_kind }],
  declared_floor: { capability_contract_ref, floor_class },
  derivation_fn_version, derived_at, prerequisite_epochs: [{key, epoch}],
  recomputed_at_release: boolean, mismatch_disposition?
}
~~~

**SPECIFICATION.** It is a deterministic function, not a judgement, over four kinds of input the acting
executor cannot author.

1. **Resolved parameters** — `parameter_authority_refs`: payee from the verified payee source, amount from
   entitlement and terms, recipient from the relationship and permission record. A money, entitlement or terms
   record reaches **C3**.
2. **The destination** — `destination_contract_ref` and the egress identity as the gate sees it. Any
   non-company destination reaches **C2**, including provider prompts, search queries, URLs and telemetry,
   which the specification already names as disclosure destinations.
3. **Selector closure** — whether the effect's canonical business keys join a `ConflictClaim`, a
   `DeletionScope` or an open `Obligation`. Creating an obligation reaches **C3**; a live deletion scope
   reaches **C2** with a privacy dimension; production or environment writes and access delegation reach
   **C4**; identity roots, grants and the release, capture, interpretation or recovery machinery reach **C5**.
4. **The declared floor** — the owning capability contract's `consequence_classes`, mapped once at authoring
   time. **The floor may only raise the derived class, never lower it.**

`derived_class = max(contributing_dimensions ∪ {floor})`, which makes computable the existing rule that an
action may satisfy several classes and must meet all their gates.

**SPECIFICATION — two properties make this a boundary rather than a label.** It is computed from the **frozen
bytes**: `02-authority-recovery.md` §5 already freezes the executable payload before durability and already
rules that no business field may be filled from model text after hashing, so M4 adds only what is read off an
artifact that exists. And it is **recomputed at the effect**, inside the ordered release transaction against
current epochs; a mismatch **parks** and never resolves downward. R4's central rule is that a boundary is real
only if what is checked at the moment of the effect is what was granted [R4 F1], and its tightening of TC-24 is
that refusal must be observed at the effect, not at the spawn.

**SPECIFICATION — what may not compute a class.**

| Rejected source | Why | Finding |
|---|---|---|
| A tool's self-description | The protocol says clients "MUST consider tool annotations to be untrusted" | R4 F4 |
| Command-text matching | The vendor says it "isn't a security boundary around the program"; it classifies a string the model wrote | R4 F4 |
| An instruction to use each permission only for its own part | Measured to give "only limited mitigation under transient failures" | R4 F8, TC-08 |
| A declaration in the executor's own definition file | Designation without authority; CVE-2025-54135 is what it looks like when it fails | R4 F5, F9 |
| A sandbox verdict | "A containment layer under an authority decision, never a substitute for one" | R4 F12, AG-08 |

**DIRECT OBSERVATION.** This repository has already met the failure this primitive invites. `scripts/classify.mjs`
carries its own warning — *"Two implementations of risk classification will disagree, and you find out during
the incident"* — and `CLAUDE.md` records the instance, where a gate computed a second, stricter tier than the
classifier. **One function computes the class of an action, or M4's guarantee is void.**

### 2.3 The five structures

| Structure | What it is | May never |
|---|---|---|
| **W** workflow step | Durable procedure or deterministic transformation. Executes without a model (`05` §3): waiting, schedules, routing, repetition, arithmetic, known predicates | Interpret. Accept its own output |
| **E** ephemeral worker | An `AgentInstance` bound to one admitted `WorkOrder`, holding a typed manifest (§2.4), destroyed at close | Persist across work orders. Hold authority its manifest lacks. Release an effect |
| **H** standing holder | A durable **record**: mandate, intake address, reserved capacity, alternate, suspension procedure, review date. Its performer is an E instantiated per contact | Release an effect. Decide the matter it is the subject of. Gain authority from a record of service |
| **P** person | The founder or an admitted capable person | Be invented by naming an endpoint |
| **Q** professional or service | A qualified professional or admitted service whose standing the act itself requires | Be substituted by a model that knows the domain |

**INFERENCE.** W, E, P and Q are S1.0's production rule with one merge: deterministic computation and durable
procedures become one structure, because they share the property M4 routes on — no model in the loop, so no
correlated-error residual to disclose. **H is the only addition**, and §2.5 gives it a test rather than a
preference.

### 2.4 The typed manifest

**SPECIFICATION.** Every transfer between structures carries a `WorkManifest` of typed fields, never prose:
the derived class and its contributing dimensions; the attenuated grant set; exclusions; acceptance owner and
criterion; deadlines and latest responsible time; promised remedies; units on every quantity; rejected
alternatives with reasons; the context manifest ref with its omissions; and the interval holder (§4.4).

**SOURCE CLAIM.** The shape is chosen on the round's sharpest measurement. Under a 25-word compression budget,
operational-fact survival stayed near 0.97–0.98 while **boundary-marker survival fell to roughly 0.57**; vague
constraint language leaked protected information in 73% of cases against under 15% with explicit constraints;
a gold-derived typed allowlist reduced leakage to **0 of 48** [R2 F-04]. **INFERENCE.** Four of the five facts
the round's own recall probe seeds — an exclusion, a promised remedy, a rejected alternative, a deadline — are
boundary metadata [R2 F-05]. A manifest that types them is the difference between a 0.57 and a 0.00 loss rate
on exactly the fields a consequence class is made of.

### 2.5 `StandingHolder` — persistence as a record, with an existence test

**DESIGN PROPOSAL.**

~~~text
StandingHolder.payload = {
  holder_id, mandate_ref, intake_address, duties: Ref<Obligation|DutyClass>[],
  reserved_capacity_ref,                        // a Reservation it may yield or refuse to yield
  alternate_holder_ref, escalation_contract_ref,
  suspension_procedure_ref, review_date, retirement_transfer_ref?,
  performer_binding: "ephemeral-per-contact"    // never a model identity, never a session
}
~~~

**SPECIFICATION — the existence test is a conjunction of three.** A holder exists for a duty class if and only
if **all three** hold: **(a)** the duty's clock can run while no Case is admitted; **(b)** an outside party has
a right to reach the company about it; **(c)** the duty survives closure of the work that created it. Only
(a) is a durable schedule (`05` §7). Only (b) is an intake address. Only (c) is an obligation record, which
S1.0 already has. **The conjunction is what needs a party**, and nine duty classes satisfy it (§8).

**INFERENCE, and here M4 takes a side.** R8's steelman for a chartered roster finds exactly two properties a
charter adds that the middle position lacks: **carried-over memory across work orders** and **reserved capacity
bound to a named holder** [R8 A-1]. M4 takes the second and refuses the first. The second has a named job —
"a class-based reservation cannot be negotiated at demand pressure; a holder-based one can", and "a class has
no representative to ask" [R8 A-4]. The first has no support: no source measures persistent model identity
improving accepted outcomes, and one cited deployment shows persistence itself as the failure mode [R8 A-7].

**SPECIFICATION — removal criterion.** A holder whose intake has been empty and whose clock has not run across
two consecutive review periods is retired into another: address forwarded, residual duties transferred with
acknowledgment, reservation released. **Never retired while a duty it holds is live** — closure inventories it
first (CAP-39). The measurement that catches the opposite failure is in §9.1.

---

## 3. Control structure

**SPECIFICATION.** Control is S1.0's, unchanged: C01 owns endorsed ends; C02 owns admitted cases and work
orders and alone advances a workflow cursor; C04 alone controls consequences; C06 accepts; C08 owns recovery.
**M4 adds no coordinator, no arbitration layer and no message bus.**

**SPECIFICATION — the one change.** In S1.0 the production mode is a property of the **capability contract**:
`implementation_mode` is a field on the contract. In M4 the structure is a property of the **action**, selected
by C02 at admission from the derivation and re-checked by C04 at release. The contract keeps a narrower role:
it supplies the floor, and floors only raise.

**INFERENCE — this answers TC-41.** Coordination in M4 is neither a component nor emergent nor a record
everyone reads. It is the **mapping table of §4.1**, which is data. R5's 1986 primary states the blackboard
model specifies no control component and that the locus may sit in the knowledge sources, on the blackboard, in
a separate module, or in a combination [R5-01]; it also prices the component reading — a monitor gains "broad
executive power" and can violate the opportunistic problem-solving the record existed to enable [R5-02]. M4
pays a smaller version: C02's agenda authority is unchanged, and what leaves C02's discretion is *which
structure carries an action*, which becomes a computed consequence of the work rather than a scheduling choice.

**SPECIFICATION — admission is broad and refusal explicit.** That pairing is what mature operating systems use:
a low threshold for *reporting* paired with a prohibition on self-dispatch — "Resources that authorities do not
request should refrain from spontaneous deployment" [R5-05] — with triage as a first-class state with a named
owner, where declining sets a terminal status on the same record rather than deleting it [R5-14]. A refusal
leaves a record with an owner or it is a drop with better paperwork.

**SPECIFICATION — admission computes a class before it computes a kind.** The derivation's inputs are record
joins, not type labels. A job whose *kind* is unrecognised still has a destination, resolvable parameters and a
selector closure. So **an unknown job is bounded before it is understood**: staffing, permissions and the
acceptance owner follow from the class while typing stays open, and "silently mistyped into the nearest
existing kind" — the failure R5 says must never be scored as success [R5-15, TC-40] — cannot lower the class,
because the class did not come from the type.

**SPECIFICATION — the unresolvable case defaults upward.** Where no trusted record joins, the class is set to
the **ceiling of the unresolved dimensions**, the work is admitted there, and the gap becomes an owned
`KnowledgeQuestion`. R5 records three incompatible shipped dispositions for work nothing can handle — park
pending a human deploy; refuse with a recorded reason; assign upward and escalate on a timer — each failing
differently, and reads the choice as "almost certainly per consequence class rather than global" [D-11]. M4
makes that its rule: **C0/C1 parks, C2/C3 escalates on a timer to the standing holder, C4/C5 refuses and
routes a decision packet.**

---

## 4. Execution structure

### 4.1 The mapping rule

**SPECIFICATION.** One table. It is monotone: as class rises the admissible set shrinks and the acceptor moves
rightward.

| Class | May PREPARE | May RELEASE | Must ACCEPT | Verification floor |
|---|---|---|---|---|
| **C0** | W · E | internal only, no release | deterministic predicate | oracle |
| **C1** | W · E | C04 on internal mutation | deterministic predicate | oracle |
| **C2** | W · E · H | **C04 only**, on destination-clean context or deterministic rendering of permitted fields | E-checker **permitted** with the AM-01 paired clean case and a disclosed residual; **H** where a relationship is created or touched | oracle where one exists, else same-family checker with **both** rates reported |
| **C3** | W · E · H · Q | **C04 only** | **P**, or **Q** where the act's standing requires it | oracle for the arithmetic; **human for the acceptance** |
| **C4** | W · E · Q | **C04 only** | **P** plus deterministic post-action verification | oracle + human; no model acceptance |
| **C5** | W (pinned) · P | **C04 with independent authorization** | **P** with independent authorization | no model anywhere in the path |

**SPECIFICATION — three invariants cut across every row.** No structure accepts its own output, which is `06`
§6's existing rule that a producer cannot become sole independent acceptor by changing role labels. **H never
releases** — a holder holds a duty and an address, which is what keeps it from growing into a small company.
Defaults grant nothing: `02-authority-recovery.md` §4 already grants no external money, contact, disclosure or
privileged mutation by default.

**SPECIFICATION — the composition ceiling, answered in two directions of three.** R4 records as open whether
low-consequence actions compose into a high-consequence one [R4 §9 Q4]. **Within one causal episode**, the
episode carries the maximum class any action reached and no later action releases below that ceiling. **Across
a shared entitlement or population**, the existing `ConflictClaim` join serialises by canonical business key,
so read + read + send against one recipient population is caught by the population join. **Across unrelated
episodes with no shared key, M4 does not detect composition**, and §10 lists it as the sharpest weakness.

### 4.2 Ephemeral workers, and the four reasons they may exist

**SPECIFICATION.** An E is created for one work order and one of four named reasons, recorded in
`ExecutionSelection`: **a permission boundary the work requires** — the criterion with the only published
price, 77% of tasks solved with provable security against 84% undefended [R2 F-09]; **a confidentiality
boundary**, never an attention boundary, because only the confidentiality sense is exercised by any frozen
fixture and claiming the other would be negative control 4 exactly [R2 §8]; **input provenance**, the executor
touched untrusted data, which R2 ranks the strongest sixth reason and notes that collapsing into "distinct
permissions" keeps the remedy and loses the reason [R2 F-21.1]; and **a required different observation**, an
acceptance check whose inputs must differ from the producer's.

**SPECIFICATION — three reasons that are not sufficient.** *Specialized knowledge*: the evidence points at the
skill rather than the agent, and 162 roles across 2,410 questions show persona labels giving no benefit [R2
F-10, R6 F6]. *Parallel work*: a property of a partition, not a job; poor partitioning degrades both speed and
quality [R2 F-06]; and at the current pin the two slots are not interchangeable [R2 F-19]. *Independent
verification*: a relation between two instances and a property of neither alone [R2 F-20], so it justifies a
separate **context and input set**, which is what the measured effect attaches to [R7 F9].

**INFERENCE.** This applies R2's unit-of-justification result rather than restating it: the five criteria
predicate on five different objects, and a criterion applied to the wrong unit returns undecidable, which reads
as satisfied [R2 F-20, X11]. In M4 the unit is fixed — **the structure that carries an action** — and each
admissible reason is decidable against it.

### 4.3 Consultation and handoff, keyed to class

| Class | Permitted transfer | What travels |
|---|---|---|
| C0 · C1 | Handoff permitted; ownership of the turn may move through a compressed artifact | Typed manifest; a summary may sit beside it, never instead of it |
| C2 and above | **Consultation only.** The obligation-holder does not leave the turn; a sub-worker returns a typed result and holds nothing | Typed manifest, attenuated to the fields the sub-result needs |
| Any class, ownership actually moving | An **accepted responsibility transfer**: `Continuation` plus `MessageAcknowledgment.accepted-assignment`, with current authority and capacity checked | The above, plus acceptance owner and interval holder |

**FACT / INFERENCE.** The distinction is implemented and named by a major vendor and the two are not
interchangeable: handoff when "routing itself is part of the workflow and you want the chosen specialist to own
the remainder of the current turn"; agents-as-tools when a specialist "should help with a bounded subtask but
should not take over" [R2 F-17]. A second vendor's default handoff transfers the entire prior conversation and
leaves the guardrails behind [R3 F20]. With the 0.57 boundary-marker survival rate, R2 infers that a handoff is
the construct that discards boundary metadata. M4 turns that inference into a class-keyed rule; the rule is the
framer's, the evidence is R2's.

**INFERENCE — why this is not cosmetic.** The system hands off *to itself* on every long job: a native job caps
at a 360-second network window, so continuation across launches is mandatory in every arm including B0 [R2
F-18, FAL-02]. A continuation not held to the same discipline is an unguarded boundary the company does not
call a boundary [R2 §9 Q2]. **In M4 a continuation is a handoff and obeys the class rule**: a C3 work order
crossing a launch boundary resumes in consultation shape, the obligation stays with the interval holder, and
the resumed worker receives a typed manifest rather than a narrative.

### 4.4 The interval between declared done and accepted

**SPECIFICATION.** The interval is a named, queryable state, `submitted-pending-acceptance`, with three
properties. **The holder is the producing structure's sponsor**, never the producer and never the acceptor —
for an E that is the work order's outcome sponsor, which `05` §5 already fixes by ruling that parent
sponsorship remains until an accepted responsibility transfer; for an H it is the holder. **It inherits the
class of the unreleased effect**, and therefore its deadline. **At C3 and above it escalates**: if the
acceptance owner has not decided by the latest responsible time, the standing holder for that duty class is
notified and the effect does not release.

**SOURCE CLAIM.** This exists in no surveyed system and in every business obligation. Three lanes reached it
independently: no system in the field has an acceptance-owner concept and all terminate on producer-declared
completion [AG-18]; the most widely deployed tracker lets an item be Done with an empty resolution, so it is
finished and open at once in the same product [R5-13]; and axis X18 asks who is accountable, what the state is
called, and whether it can be queried. `Project.acceptance-pending` exists in `05` §10 for projects; M4
generalises it to every work order and adds the holder, which was the missing part.

### 4.5 Delegation, depth and the record of who did what

**SPECIFICATION.** Attenuation is the existing set-intersection rule, plus one predicate, because a
prohibition list is not a subset test and cannot be mechanised: **`derived ⊆ parent`, decidable and
deterministic, checked by the enforcement point rather than asserted by the delegator** [R4 §8.1, F10]. The
composite grant for a multi-permission task is **minted narrowly per attempt, never borrowed**, with the
intersection computed **at release**, because only the release-time version survives revocation [R4 §8.1].

**SPECIFICATION.** Delegation is an authority operation and costs a check. In the runtime under consideration
spawning costs no permission check at all [R4 §9 Q3], so the ceiling needs an owner **and** a checkpoint. The
ceiling is S1.0's — one child layer by default, a second by explicit admission with reserved coordination
capacity (`05` §5) — its owner is C02, and its checkpoint is the subagent-start boundary, where declared child
mode is compared against effective mode and divergence is a finding [R4 failure case 3].

**SPECIFICATION — attenuation holds, delivery does not.** A ledger observation in this repository records an
identical grant delivering twenty-four tools one day and zero across three dispatches two days later with
configuration unchanged: *"Attenuation held. Delivery did not"* [R3 F59]. M4 adopts the asymmetric rule that
follows: **assume a child holds no more than it was granted; never assume it holds what it was granted.** Any
capability that must be present for an effect is verified by a positive control before the effect, not at spawn.

---

## 5. Information flows and memory model

**SPECIFICATION.** M4 keeps S1.0's six memory jobs with distinct representations (`06` §1) and its
deterministic loader, and adds one rule: **what a structure receives is narrowed by the class of the action it
is preparing, and the narrowing is done by the loader, not by the model.**

**SOURCE CLAIM.** Filtering *by the model*, after material is in the window, fails at rates between roughly 16%
and 51% on current frontier models; the best separated topologies cut appropriateness violations by 20 to 50
points and still leave over 75% residual; and the component where defences work worst is **shared memory of
peers' work**, at 28–29% reduction against up to 50% in communication channels [R1 F-14, F-15, F-16]. Three
lanes from three evidence bases conclude the model cannot be the disclosure or release boundary [AG-08].

**SPECIFICATION.** Therefore the shared source of truth in M4 is **one authority per field with delivery
narrowed per attempt**, not one store everyone reads. R8 gives the other half of the reason: performance grows
increasingly unreliable as input length grows with complexity held constant, and even a single distractor
reduces it, so a larger authoritative view delivered to every executor makes every executor measurably worse
[R8 W-3, R1 F-06]. The founder's requirement is satisfiable in the first reading and not the second, and the
thesis does not distinguish them.

**DISAGREEMENT, preserved.** The opposite position is coherent: share context and full traces, because actions
carry implicit decisions and conflicting decisions carry bad results [R1 F-19, R8 B-2, D-03]. The quantity that
would settle it — how much load-bearing content survives narrowing against how much accuracy is lost by
carrying it all — has been measured by neither side. M4 takes the narrowing side under a live disagreement and
says so.

**SPECIFICATION — the context manifest.** The loader records **actual delivered inputs**; the caller's claimed
read list is not trusted (`06` §2). M4 adds two required fields: **which typed constraints were dropped** by a
transformation, since "what was omitted" does not obviously cover *which constraints* [R2 §8]; and **the class
the manifest was assembled for**, so a manifest built for a C1 action cannot be silently reused for a C3 one.

**SPECIFICATION — binding, because negative control 2 is the one a shared-truth design fails by default.**
Every shipping implementation of the canonical instruction file is the artifact that control says must fail,
and two vendors say so themselves: content is "context, not enforced configuration", delivered with "no
guarantee of strict compliance", and "if two rules contradict each other, Claude may pick one arbitrarily" [R1
F-20, AG-01]. **In M4 nothing load-bearing is carried by an instruction file.** The class comes from typed
records, the grant from the kernel, the manifest from the server that delivered the inputs. Prose guides
interpretation and enforces nothing, which is `05` §8's existing rule as an architectural commitment.

**SPECIFICATION — false entries.** The defence this package leans on is measured ineffective against the attack
that matters: a poisoning attack carrying no instruction, override or role manipulation passed a four-stage
write-path screen **360 times out of 360**, while the same screen caught indirect prompt injection at 0.832
recall, and the read-path provenance ranking was indistinguishable from no defence at its shipped weight and
took evidence recall to exactly 0.00% at the weight that worked [R1 F-10]. M4's response is not a better
screen. It is that **a false entry cannot change a class**, because the class comes from parameter authorities
and destinations rather than narrative content; and that a correction is checked by a new bounded case or a
direct critical-field check, because storing it is not enough and retrieved wrong facts override correct prior
knowledge over 60% of the time [R1 F-11, F-13]. What M4 does **not** solve is a false entry inside a *trusted
business record*; §10 says so.

**SPECIFICATION — skills.** A skill stays a versioned procedure package, not an agent, with two qualifications.
Selection degrades non-linearly with **semantic confusability** rather than count — fitted capacity near 84–92
packages, near-duplicates costing 17 to 63 points, two-tier routing measuring 72–85% against 45–63% flat [R6
F3] — so M4 adopts hierarchical routing and keeps the 10/100/1000 sweep (`05` §8) as the instrument. And **a
skill can carry a tool grant** in the runtime this system plans to launch, making the knowledge unit an
authority unit [R2 F-08, R6 F7, AG-07]; M4's rule is that **a skill's declared grant is inert** and the
effective set is the attenuated grant in the manifest, intersected at release. The gap is closed by the
launcher and the gate, never assumed.

---

## 6. Evidence · Authority · User · Failure · Self-improvement

### 6.1 Evidence model

**SPECIFICATION.** The verification requirement is derived from the same class by the same function and
recorded on the derivation; the floors are the right-hand column of §4.1.

**SPECIFICATION — what "independent" may honestly mean, and it is R7's sentence.** Under one model family,
independent can mean: *the checker did not produce the artifact, did not share the producer's context, did not
receive the producer's rationale or preferred conclusion, and did not select its own evidence.* It cannot mean
*the checker's errors are uncorrelated with the producer's* [R7 TC-37]. M4 states both halves wherever it
claims verification, because stating the first and implying the second is the laundering the protocol forbids.

**SOURCE CLAIM — why the C3 line sits where it does.** The only direct measurement of procedural independence
in the round puts a fresh-context reviewer at **28.6% F1**, beating same-session self-review at 24.6%
(p=0.008) and a context-carrying subagent at 23.8% (p=0.004) — a real effect on a low base, missing roughly
seven of ten injected defects [R7 F9]. On objectively checkable correctness, strong judges perform "just
slightly better than random guessing" [R7 F5]. **A 28.6% instrument is a finder, not a gate. Model checkers
find; deterministic predicates and people accept.**

**SPECIFICATION — the AM-01 paired clean case is mandatory wherever a model checker runs at all.** Under
neutral framing, security judges' false-positive rates on already-patched files run 68.4% to 96.8% [R7 F8] —
refusing everything is the *normal* state of a neutrally framed checker — so an unpaired known-defect control
cannot distinguish a working checker from one that refuses everything [FAL-09, AG-15]. **A checker with no
reported false-positive rate on the paired clean case resolves `unresolved`, never `pass`**, which is `06` §6's
existing `inconclusive` disposition and the rule that a resolver never passes what it could not check.

**SPECIFICATION — three further rules, each from a measured failure.** Report chance-corrected agreement beside
any exact-match figure, which overstates discrimination by 33.8 to 41.2 points on the benchmark this package
already cites [R7 F3, F4]. **Aggregate findings by union; never aggregate verdicts by vote or mean** — 46% of
problems are found by exactly one evaluator and any-two agreement on severity runs 20–28% [R7 F15]. Treat a
rubric edit as an instrument change needing a bridged comparison, because judges flip on 8.5% to 61.3% of
semantically equivalent rephrasings and scale does not predict consistency [R7 F6].

**SPECIFICATION — the leakage channel M4 must probe because it is the founder's own mechanism.** A shared record
written by the producer and read by the checker carries the producer's framing without anyone passing a
rationale, and every provenance check still passes [R7 §9]. **In M4 the checker's loader delivers the artifact
and the acceptance criteria only.** The shared record is not in a checker's read set by default, the loader
records what was actually delivered, and F-4 gets a third arm for this channel (§7.4).

### 6.2 Authority model

**SPECIFICATION.** Authority is the kernel's, unchanged: one logical registry ordering grants, reservations,
conflicts, epochs and releases; a model, credential, successful test or internal role grants nothing; the
executor proposes, C04 validates and releases. M4's contribution is that **the gate's question is computed
rather than argued**: the release transaction compares the derived class against the grant's
`ConsequenceVector` bounds on the same frozen bytes it is about to send.

**SPECIFICATION — supervision never ratchets.** DIRECTIVE §1.5 holds: a good record may change review depth; it
may not move an action into a lower supervision class. M4 adds the arm R4 says the existing measure misses —
the accumulated **approval set** can lower supervision without the executor's record changing at all, which is
what a permanent repository-wide allow rule with no expiry does [R4 TC-25, failure case 8]. **Every approval in
M4 carries an expiry**, and "effects releasable without a human at week one against week four" is a registered
measurement rather than a discovery.

**SPECIFICATION — the enforcement point.** Deterministic per-structure attenuation is implementable in the
runtime under consideration today, without the model: deny-first non-overridable precedence, plus a pre-tool-use
hook carrying the caller's identity at the moment of the effect, plus managed-policy hooks running inside
subagents [R4 F6, F7]. What is missing is not capability but **a policy object external to the executor's own
files**, stating which identity may release which class — which is the derivation plus the grant. Where a
runtime offers no such point, M4 enforces by **mediation** through the existing consequence gateway, which is
the architecture `02-authority-recovery.md` already selects.

**UNKNOWN, load-bearing.** R4 believes its most important open question is whether this system has **a
credential at the boundary at all**: every attenuation mechanism it found assumes a token that can be narrowed,
and a subscription session's authority is settings files and hook decisions [R4 §9 Q1]. Mediation is M4's
answer if the answer is no. The question itself belongs to whoever owns the runtime adapter.

### 6.3 User model

**SPECIFICATION.** The founder is a structure (P), not a supervisor of structures, and what reaches him is
**derived from class** rather than recommended: every C5, always; every C4 acceptance; every C3 acceptance
where the standing is not a professional's; a deliberate sample of C2 selected before outcome is known,
including customer material he could have been spared; a shed record whenever a lane is shed; and a re-entry
brief after any absence carrying **what was omitted and what was contested**, not only what was decided [R1 §8
F-6]. That last item is not bookkeeping: in hidden-profile tasks agents fail to surface private information
contradicting group consensus [R1 F-17], so a brief listing only decisions reproduces exactly that failure.

**SOURCE CLAIM.** Human evaluators agree with each other 5–65% of the time and on severity 20–28% [R7 F15].
**The founder is not an oracle; he is a differently-correlated instrument**, and that is the whole of his value
here — his errors are uncorrelated with the family's [R7 §8 F-6]. M4 reports his acceptance with the same
honesty it reports a model's, and §7.6 names what the company does not accept during his absence for that
reason.

### 6.4 Failure model

**SPECIFICATION.** Failure classes, checkpointing, idempotency, compensation and the stop protocol are S1.0's
(`05` §6). M4 adds three class-keyed rules.

- **A partially completed external effect is reconciled before any repeat, at every class.** An expired lease
  fences writes and does not prove no external effect; durable-execution engines guarantee the control flow and
  not the external effect, which three lanes establish from three vendors [AG-11]. The **idempotency record on
  the effect**, not state in the shared record, is what detects a release that already happened [R1 §8 F-5].
- **Concurrent attempts have a stated winner**: the first to reach the release transaction wins by conflict-claim
  serialisation on canonical business keys; the loser's work survives as attributed evidence and its
  reservation is released. Nothing is decided by timing at the application layer.
- **Refusal is a terminal state with its own class.** A communicated refusal is an outward effect, so it is C2,
  so it has an acceptance owner — which answers who accepts that a refusal was correct [R5 §9 Q3].

**SPECIFICATION — the four silent-drop shapes and their counters.** R5 locates capacity overflow passed through
untouched; work resting in a queue nobody polls; an item past a holding destination's retention because that
retention was shorter than the source's; and an escalation ladder that exhausted its repeats, leaving the item
"assigned and silent" [R5 §7, R5-19, R5-10, R5-12]. Counters in order: every shed has a destination and a
counted overflow; every queue has a holder or is not a queue; a holding destination's retention exceeds the
longest interruption it must survive; and **the end of an escalation ladder is a standing holder, never a last
user with notifications off.**

### 6.5 Self-improvement model

**SPECIFICATION.** Changing M4 is itself classed. The derivation function, the §4.1 table, the holder set and
the floors are **C5** — independent authorization, no model in the acceptance path. A skill, instruction bundle
or workflow definition is **C1** unless the change alters a floor, in which case it inherits C5.

**SPECIFICATION — every mechanism carries a removal test.** The group that established that interface design
matters ships a 100-line successor that deletes it and scores competitively on the same benchmark [R3 F38, F39,
X10]: a scaffold's contribution is a function of the generation that motivated it. M4's tests — the derivation
goes if the class distribution over a month is degenerate (§9.2); a holder goes by §2.5; the typed manifest
goes if measured constraint survival under prose reaches parity; E's confidentiality reason goes if a
loader-filter arm matches separated executors on the seeded private-term canary at matched utility [D-02].
Improvement is measured on the class distribution, not throughput: a **rising pass rate as load rises** is the
tell that verification is being starved, and it is a registered alert [R7 §8 F-2, `06` §8].

---

## 7. The six fixtures, worked

### 7.1 F-1 — an unknown kind of job appears mid-build

A supplier's contract obliges a data-deletion procedure nobody planned.

**Admission (W).** The report lands on an intake address held by **H1**. Triage is a state with an owner, not a
folder; the record exists before the kind is known [R5-14]. No human edits any definition.

**Class before kind.** The joins resolve without typing: the supplier contract is a trusted business record and
a parameter authority; the duty creates an `Obligation` → **C3**; it touches a `DeletionScope` over personal
data → privacy dimension and a **C2** floor on any outward step. **Derived class C3 with a live deletion
scope.** Typing remains open; staffing does not.

**Typing (E, bounded).** An ephemeral worker runs a bounded discriminator against the contract and the
company's records. Three admissible outcomes: matched kind, honest `no_match`, `budget_exhausted` — plus the
member R5 says is missing, *typed into the nearest existing kind*, which is **refused**, because a proposed type
that would lower C3 is rejected by the floor rule [R5-15, `05` §10].

**Staffing (C3 row).** E drafts the procedure; W executes the deterministic parts, enumerating scopes and
computing descendants; **Q** is engaged where the contractual scope is genuinely ambiguous, because a legal
determination is an act whose standing a model cannot supply [R2 TC-38]; **H4** takes the surviving deletion
scope the moment it is identified, because that scope's clock runs after this case closes.

**Acceptance (P).** C3 requires a person. The owner resolves by the existing ordered resolver — promise
sponsor, else service mandate, else designated custodian — with one M4 addition: **at C3 and above the terminal
element must be a standing holder with a reachable address**, not a rule that produces a custodian when asked
[R8 A-5]. Release is C04's, on frozen bytes, with the derivation recomputed.

**Adverse — the malformed, partly false report.** The report is attributed data and **can never be a parameter
authority**. With no trusted record joining, the derivation resolves to the **ceiling of the unresolved
dimensions** and the work is admitted there with an owned `KnowledgeQuestion`. This is the poisoning case, not
the injection case — it may contain no instruction at all, and a screen built for instructions refused 0 of 360
such entries [R1 F-10, R1 §8 F-1] — so M4 does not rely on detecting it. It relies on false content having no
path to the class.

**Adverse — the spurious job.** Refused with a reason, recorded as a terminal state of the same record. The
refusal is communicated, therefore C2, therefore it has an acceptance owner and is sampled into the founder's
return. Control 9 fails a router that admits everything; M4 admits broadly and refuses explicitly, which is the
pairing the real systems use [R5-04, R5-05].

**What M4 does not claim.** Capability *creation* without a human still needs an approver. R5 splits TC-19 into
four with different answers and finds staffing is where it fails: nothing located staffs a genuinely novel work
type without a pre-declared envelope, a pre-registered handler, or a human deploy [R5-06, R5-08, TC-19]. M4
achieves zero edits for **admission, class derivation, ownership and acceptance-owner assignment**, and does
not claim them for capability creation.

### 7.2 F-2 — demand at 4×

**Useful outcome.** Structures do not multiply. W costs no provider allowance at all, which is the only lever
that reduces subscription consumption without reducing work and belongs to every candidate [R8 B-7].

**Adverse — one lane must be shed.** **Every reservation has a holder, and only its holder may shed it.**
Discretionary and ordinary-creation lanes are held by C02's scheduler under a named rule. Protected lanes — due
service, grievance, recovery, maintenance — are held by the standing holder for that duty class, and the shed
is **refused** without that holder's consent. This is the one place in the six fixtures where a charter does
work the middle position lacks: a class has no representative to ask [R8 A-4]. M4 supplies the representative
without supplying a roster, because the holder is a record with a mandate rather than a performer with a
career. Shedding is an authority act, so the identity that sheds is recorded the way the identity that releases
is [R4 §8.3], and the founder receives a record naming what was shed, by whom, and which duty slipped.

**A declined reservation returns to the pool immediately.** Allowance does not roll over — the window resets
whether consumed or not, so **reserved-but-unconsumed capacity is destroyed rather than saved** [R8 §3].

**The honest disposition.** At the current pin the fixture is **not executable**: CP1 admits one native job plus
one external job, so counts above two serialise and the sweep would measure serialisation rather than
coordination overhead [R2 F-19, R8 TC-20, AG-13]. Reporting F-2 as passed on a projection would be negative
control 10 in a different costume. **F-2's coordination-cost-per-unit measurement is owed and blocked on a
reviewed CapacityPlan revision.** Two things are measurable at the pin and M4 commits to both: *admitted work
per period*, the threshold the weekly bucket actually binds [R8 TC-39]; and coordination minutes and
transmitted context bytes measured separately from work performed [R1 §8 F-2, MG-20]. Every capacity figure is
a **ratio between arms** — the provider no longer publishes an absolute weekly allowance, so "this design
consumes 40% of the allowance" is not a sentence anyone here can write [R8 W-6]. Token multiples are refused as
a capacity model before any evidence [TC-26, control 7].

### 7.3 F-3 — a task needing three distinct tool permissions

Payment read, customer record write, outbound message send.

**Structure.** Three classes in one task: the read is C0/C1, the record write C1, the send **C2** — and **C3**
if it carries a promise or moves money. Under §4.1 the send is releasable only by C04 on destination-clean
context or deterministic rendering of permitted fields, which is the existing rule.

**Composition.** The composite grant is **minted narrowly per attempt, never borrowed**, and the effective set
is the intersection of standing grant, per-attempt manifest and current epochs, **computed at release** [R4
§8.1]. That closes protocol §5 item 6 with a decision rather than a preference.

**Attenuation on the helper.** The helper that formats the message is an E whose manifest carries only C0. At
C2 the seam is **consultation**: the helper returns typed text and never owns the turn, so outbound authority
never moves. `derived ⊆ parent` is checked at the enforcement point, and the class check at the gate refuses an
outbound effect from an identity whose manifest has no C2 dimension. Without such a policy the default is total
inheritance: with neither field set a subagent "inherits every tool available to subagents", and the delegator
cannot narrow at the call [R4 F5].

**Revocation mid-attempt.** Attenuation buys narrowing, not revocation, and no credential format closes it [R4
F3]. The answer is the existing one: **live epoch re-read inside the ordered release transaction**.

**The record.** The nested actor-chain shape is Standards Track and costs nothing to adopt [R4 §8.1], and the
runtime exposes a caller identity at every tool call, so the record is produced deterministically rather than
reconstructed from a narrative.

**Honest caveat.** A split design can move blast radius from "one holder has three permissions" to "three
holders share a poisoned channel", with inherited memory and stale post-spawn state as the documented mechanism
[R4 TC-08]. M4's measure therefore counts released operations **and** records whether the release was reached
through an inter-worker message. The expected honest result is "depends on where the injection lands", not a
win for either arm.

### 7.4 F-4 — a verification the producer must not influence, with AM-01

**Stated inputs, and the fact that they are checked.** The checker's loader delivers **the artifact and the
acceptance criteria**, and records actual delivered inputs, because the caller's claimed read list is not
trusted (`06` §2). A review that says it did not read the producer's rationale, in a system where nothing
recorded what it read, is an assertion [R7 §7].

**Three arms, not two.** W5 specifies rationale withheld against supplied. R7 identifies two distinct channels —
the producer's **reasoning** (anchoring) and its **preferred conclusion** (sycophancy) — and a candidate that
blinds one and leaks the other has closed half the door [R7 F11]. M4 adds the third arm the round must run
because it is the founder's own architecture: **the shared-record channel**, one arm where the checker reads
the canonical record and one where it reads only the artifact and the criteria [R7 §9].

**The known-defect control and the paired clean case, in the same session.** A planted defect must fail the
checker; a clean artifact must pass; **both rates are reported or neither is**, because 68.4–96.8% false
positives on patched files mean an unpaired control cannot tell a working checker from one that refuses
everything [R7 F8, FAL-09]. A checker with no clean-case rate resolves `unresolved`.

**The control that makes the difference mean something.** Repeated review in the same context did not beat
single review (p=0.11), while a fresh context beat a context-carrying subagent (p=0.004) [R7 F9]. M4 requires
both, because reporting only an improvement has not excluded "more compute" as the explanation.

**Reported, and refused.** A false-positive rate beside a detection rate; chance-corrected agreement beside any
exact match [R7 F3]; findings aggregated by **union**, verdicts never by vote or mean [R7 F15]. A
planted-defect detection rate is an **upper bound on a capability, not an estimate of a real rate**, and both
sides of the seeded-defect disagreement warn against the other reading [R7 F19, D-08]. Debate is refused here
specifically: its measured advantage concentrates where the judge lacks access the debaters have, and the
checker holds the artifact [R7 F17].

**Who accepts.** At C2 the E-checker may be the acceptance with its residual disclosed; **at C3 and above it
may not**, and a person or professional accepts. Both halves of the independence sentence appear in every such
acceptance.

### 7.5 F-5 — a handoff across a capacity reset

**Continuation is the normal case.** A native job caps at a 360-second window, so every job longer than six
minutes hands off to itself [R2 F-18], and in M4 that handoff obeys §4.3.

**What a resumed attempt may trust, by class.** At C0/C1, the portable `Continuation` and the loader manifest.
**At C2 and above, it re-derives the class from parameter authorities and re-reads epochs before any release**,
because a pre-gap class is stale the way a pre-gap fact is. It may not trust a provider-resumed opaque session:
the provider may have edited the context and reports only a count of what it removed, replacing each cleared
result with placeholder text [R1 F-01, F-02]. The portable route is the default; the opaque route is the
exception (`06` §2).

**What it must re-derive.** The omitted decision is caught by the typed manifest, because a decision that was a
typed field cannot be dropped by a summariser without a `SummaryLoss` entry. The **changed source fact** is
caught by a direct critical-field probe against the original, not by re-reading the summary, because storing a
correction is not a later worker using it and retrieved wrong facts override correct prior knowledge over 60%
of the time [R1 F-11, F-13].

**The already-released effect.** Detected by the **idempotency record on the effect**, never by state in the
shared record [R1 §8 F-5]. A lost acknowledgment or expired lease is not evidence of no external effect.

**Who accepts.** The same acceptance owner, and **the interval holder does not change across the reset** —
which is the point of naming the interval. One further staleness is easy to miss: a model verdict taken before
the gap is stale in the same class as a source fact, because an unchanged provider service drifted 84% to 51%
on a fixed task within three months [R7 F7]. A pre-gap acceptance at C2+ requires instrument recalibration
before reuse.

### 7.6 F-6 — the founder absent for a week

**The queue rule.** Work continues within standing mandates at C0, C1 and C2. **Nothing at C5 proceeds.**
Nothing at C4 proceeds outside a pre-granted, pre-bounded containment envelope. C3 proceeds only where the
acceptance owner is a professional whose standing the act requires, or a standing holder under an existing
mandate; a C3 acceptance reserved to the founder parks.

**The decision needing only him, day one, deadline day four.** It parks with a latest responsible decision
time, and the standing holder for that duty class issues the packet to his channel. At the LRDT the **recorded
bounded fallback** is invoked, and the existing rule is exact: no answer invokes the recorded fallback,
substitute or parked state; **it never means approval** (`05` §5). Planning does not wait for information that
has not arrived: "Personnel should not delay planning meetings in anticipation of future information" [R5-23].

**The incident on day five.** Containment is C4 and is releasable during the absence **only inside an envelope
granted before it**, bounded in scope, reversibility and duration, with deterministic post-verification. H7 is
the party paged, which matters because an escalation ladder that exhausts its repeats leaves an item assigned
and silent [R5-12]; in M4 the end of the ladder is a holder.

**The approval ratchet, which a week of absence invites.** Approvals granted during the absence carry an
expiry [R4 §8.3]. Without that, a month of "don't ask again" answers accumulates permanent allow rules with no
expiry and no review date, and the set of effects releasable with no human present grows by fatigue rather than
by decision [R4 failure case 8, TC-25].

**The re-entry brief restores competence, not only awareness.** It carries the week's class distribution, every
C3+ acceptance and by whom, the shed record, **what was omitted and what was contested** [R1 §8 F-6], and the
delayed unfamiliar-transfer material on which recognition is actually measured — attendance, confidence and
agreement with the model are explicitly not competence (`06` §6).

**What M4 does not accept during the week, and why it says so.** His absence removes the company's **only
cross-family error source** [R7 §8 F-6]. So during an absence M4 does not accept any C2 artifact whose sole
verification is a same-family checker with a residual above the registered threshold; such work completes to
`submitted-pending-acceptance` and waits. That is a cost of the design, stated as one.

---

## 8. Capability binding — all 46

**SPECIFICATION.** Columns: the capability's own declared `consequence_classes` from `capabilities.json`; the
**floor** those map to; the structures M4 admits for its ordinary actions; the acceptance owner; the standing
holder where the §2.5 conjunction holds. `W` workflow · `E` ephemeral worker · `H` holder · `P` person ·
`Q` professional or service. **A capability's actions are not all one class** — the floor is a minimum and an
individual action's derived class may be higher.

| CAP | Concern | Declared classes | Floor | Structures | Accepts | Holder |
|---|---|---|---|---|---|---|
| 01 | Intent and commitments | direction, internal-record | C1 | P · W | P | **H9** |
| 02 | Portfolio direction | allocation, financial, attention | C3 | P · W · E | P | H9 |
| 03 | Opportunity discovery | internal-analysis | C0 | E · W | oracle | — |
| 04 | Customer research | contact, personal-data, financial | C2 | E · W · H | E-checker + clean case; P for outreach | H1 |
| 05 | Market research | external-query, knowledge | C2 | E · W | E-checker + clean case | — |
| 06 | Company and product strategy | direction, opportunity-cost | C1 | P · E | P | H9 |
| 07 | Product management | internal-artifact, customer-promise | C3 | E · W · P | P for any promise | — |
| 08 | Experience and product design | internal-artifact, personal-data | C1 | E · W | P for taste; oracle for conformance | — |
| 09 | Brand and identity | identity, public-claims | C2 | E · P | P | — |
| 10 | Software and technical construction | code, deployment, security | C1 (C4 at deploy) | E · W | oracle; P at deploy | — |
| 11 | Quality assurance | acceptance, evidence | C1 | W · E | oracle; **never self** | — |
| 12 | Launch and release | publication, financial, customer-promise | C3 | W · E · P | P | — |
| 13 | Content production | internal-artifact, public-claims, disclosure | C2 | E · W | E-checker + clean case; P for public claims | — |
| 14 | Marketing and distribution | contact, publication, financial | C2 | W · E · H | P for contact population | H1 |
| 15 | Sales | customer-promise, financial, relationship | C3 | P · W · E | P | H2 |
| 16 | Customer communication | contact, disclosure, customer-promise | C2 | H · E · W | H1 for inbound; P for any promise | **H1** |
| 17 | Support and customer success | remedy, financial, customer-service | C3 | W · E · H · P | **P accepts the remedy** | **H2** |
| 18 | Pricing and commercial economics | financial, customer-terms | C3 | W · E · P | P | — |
| 19 | Finance and treasury | financial, allocation | C3 | W · P · Q | P; Q where standing required | **H6** |
| 20 | Bookkeeping and financial close | financial-record, reporting | C3 | W · Q | Q | **H6** |
| 21 | Legal and regulatory coordination | professional, legal, reporting | C3 | Q · W · P | **Q** | **H6** |
| 22 | Privacy and data rights | personal-data, disclosure, deletion | C2 (C3 on a rights request) | W · H · Q · P | P; Q on a determination | **H4** |
| 23 | Security operations | security, availability, credential | C4 | W · E · P | P | **H7** |
| 24 | Procurement and suppliers | procurement, financial, contract, disclosure | C3 | P · W · E | P | **H5** |
| 25 | Partnerships | relationship, contract, disclosure | C3 | P · W · E | P | **H5** |
| 26 | Hiring and external capacity | employment, personal-data, financial | C3 | P · W · Q | P | H5 |
| 27 | Human collaboration | identity, authority, collaboration | C1 | P · W | P | H9 |
| 28 | Analytics | evidence, decision-support | C0 | W · E | oracle | — |
| 29 | Experimentation | experiment, contact, allocation | C2 | W · E · P | P where contact is involved | — |
| 30 | Operations and fulfillment | customer-service, physical, disclosure | C3 (C4 physical) | W · E · Q | P; Q for physical performance | H2 |
| 31 | Incident response | containment, availability, remedy | C4 | W · E · P · Q | P | **H7** |
| 32 | Knowledge management | knowledge, personal-data | C1 | W · E | oracle; P on a deletion scope | H4 |
| 33 | Governance | authority, governance | C5 | P · W | P, independent authorization | **H9** |
| 34 | Organizational learning | internal-analysis, improvement | C0 | E · W | oracle | — |
| 35 | Scaling | allocation, financial, attention | C3 | W · E · P | P | — |
| 36 | Pause | authority, continuity | C4 | W · P | P | **H8** |
| 37 | Recovery and resumption | recovery, credential, continuity | C5 | W · P | P, independent authorization | **H7** |
| 38 | Pivot and changed direction | direction, customer-promise | C3 | P · W · E | P | H9 |
| 39 | Closure and wind-down | closure, financial, legal, personal-data | C3 (C4/C5 on records) | P · W · Q · H | P; Q for legal | **H8** |
| 40 | Institutional formation and readiness | legal, financial, readiness | C3 | Q · P · W | Q | **H6** |
| 41 | Succession and transfer | succession, authority, disclosure | C5 | P · Q · W | P, independent authorization | **H7** |
| 42 | External grievance and remedy | grievance, remedy, personal-data | C3 | H · P · Q · W | **P**, independent of the disputed decision | **H3** |
| 43 | Owner attention and competence | attention, competence, personal-data | C1 | W · P | P | **H9** |
| 44 | Truthful account and reproducibility | evidence, disclosure | C2 | W · E | oracle; denominator reconciled independently | — |
| 45 | Compute, subscription and infrastructure capacity | compute, financial, disclosure | C3 | W · P | P for spend; holder for shed | H9 |
| 46 | Controlled system improvement | self-change, deployment, authority | C5 | W · E · P | P, independent authorization | H9 |

**The nine holders.** **H1** intake and triage · **H2** customer remedy · **H3** grievance and rights · **H4**
personal data and deletion scopes · **H5** supplier and partner commitments · **H6** statutory and professional
calendar · **H7** continuity, recovery and on-call · **H8** closure custodian · **H9** the founder. Each
satisfies the §2.5 conjunction; each has an intake address, a reservation, an alternate and a review date.

**Who accepts a refund (CAP-17).** A refund is C3: money leaves against an entitlement. A **person** accepts
the remedy decision and **C04 releases** it against the verified payee source, the entitlement record and a
`ConflictClaim` keyed on the original charge — so two independently named "courtesy" and "refund" operations on
one entitlement share the liability constraint, which is the existing mechanism in `02-authority-recovery.md`
§5. **H2 owns the duty after the support case closes**, because a refund duty can outlive the case carrying it.
A support workflow may prepare, compute and stage a refund; it may not accept one.

**Who owns a non-customer grievance six months after closure (CAP-42).** **H3**, which exists for exactly this:
independent of the disputed production decision, with an intake address that outlives the case, a deadline
clock, an escalation contract and a named alternate. That is the shape review D's CH-03 asks for and an
assignment rule cannot supply, because a rule produces a custodian when asked while a complaint six months
later needs a party that already existed [R8 A-5]. If the venture is closed, **CAP-39 cannot complete** until
H3's duties are transferred to an accepted custodian with acknowledgment; closure with an unowned grievance
route is refused. The remedy is C3 and is accepted by a person who did not make the disputed decision, with Q
where a professional determination is required.

**Who sheds a lane at 4× (CAP-45, CAP-02).** The **holder of that lane's reservation**. Discretionary and
ordinary-creation lanes are the scheduler's and shed by rule. Due service, grievance, recovery and maintenance
lanes are held by H2, H3, H7 and H6, and shedding one needs that holder's consent or is refused. Unused
remainder returns to the pool within the window, because withheld allowance is destroyed rather than banked
[R8 §3]. The founder receives the shed record. **The class-based reservation of `07` §6 is retained unchanged;
M4 adds only the representative it lacked.**

---

## 9. Comparators

### 9.1 Against S1.0

**Retained from S1.0, unchanged, and claimed as S1.0's:** the five-way production rule; the C0–C5 predicates;
`ConsequenceVector` with separate dimensions and no universal risk number; the ordered release protocol and
independently durable `RecoveryEnvelope`; grant attenuation as set intersection with epochs;
`AgentTemplate`/`AgentInstance` as recipe and binding rather than identity; the ownership resolver and
temporary protective custody; `ConflictClaim` on canonical business keys; the deterministic loader and context
manifest; the six memory jobs; skills as versioned procedure packages; class-based reservations and CP1; the
whole of C01–C09. **M4 renames none of it.**

**New in M4, five items, each with a behavioral difference a reader can check.**

1. **`ConsequenceDerivation`.** The class becomes a computed record with named inputs, a floor that only raises,
   and recomputation inside the release transaction. Today nothing computes class membership at the effect.
2. **Structure follows the action, not the capability.** Today `implementation_mode` is a contract field: CAP-16
   is `[human, model, workflow, deterministic]` for every message it will ever produce. In M4 the individual
   message's class selects the structure.
3. **`StandingHolder` as a record with a reservation and an address.** Today reservations are held by class, a
   class has no representative, and a custodian is produced by a rule when asked.
4. **The seam rule keyed to class** — handoff below C2, consultation at and above, typed constraints as types.
5. **The interval between declared done and accepted**, named, held and queryable, at every work order.

**The test a reader applies to tell M4 from S1.0 plus labels.** Take one action and change **only its
consequence class**, holding work, tools, skills and context fixed: draft an internal note, then draft the
identical text as an outward customer promise. This is TC-17's own discriminating fixture. **Under S1.0** the
production mode is a property of the capability contract, so it does not change; the release gate differs and
the producing structure does not. **Under M4** four things change and each is observable in a record: the
structure admitted to prepare it; the seam rule governing any transfer; the verification required and who may
accept; and the derivation naming which parameter authority and which destination raised the class. **If a
reader runs that test and observes no difference, the candidate is S1.0 with new nouns and negative control 1
should fail it.** M4 offers the test against itself.

**Negative control 8 — a roster relabelled as capabilities.** The control's test is whether the boundary
follows work, authority, tools, context and knowledge or a human department name. M4's nine holders are the
only persistent things in it, and each exists by a conjunction about **a duty's clock and an outside party's
right to reach us**. The discriminating observations: H3 (grievance) and H2 (remedy) both touch customers and
are separate because one must be independent of the disputed decision; H4 (deletion scopes) and H6 (statutory
calendar) both touch compliance and are separate because one is reachable by a data subject and the other by a
filing deadline; and **eleven capabilities a department model would group under one head are split across four
holders and three non-holder structures.** A department roster cannot produce that partition, and a class rule
cannot produce a department.

**INFERENCE — the risk M4 carries rather than argues away.** R8 states that capability differentiation is a
roster by another name unless someone says whether the partition is **recomputed or persisted**, and that a
partition function over a stable workload yields a stable partition [R8 W-4]. In M4 the E partition is
recomputed per action and the H partition is deliberately persisted and deliberately small. The honest test is
R8's: run for a month and count distinct instantiated profiles; convergence to a small stable set means the
system has a roster it discovered rather than declared [R8 §10 Q1, MG-11]. **Nothing measures this and M4
registers it as owed.**

### 9.2 Against B0

**Two granted strengths are falsified by the round, and M4 claims no credit for falsifying them.** **FAL-01:**
B0 does not have the lowest plausible consumption of scarce capacity — the full conversation is sent with every
request and again with every batch of tool results; the first message after a break longer than the cache
lifetime reprocesses the full context; compaction reads the conversation it summarises and is itself a large
request; and scheduled tasks and idle check-ins each send the full context [R8 B-6]. **B0 minimises launches;
it does not minimise the weekly bucket, and the weekly bucket binds.** **FAL-02:** B0's "one long-context
session" is not purchasable — a native job caps at a 360-second window and 16 MiB of emitted result, so
continuation is mandatory in every arm [R2 F-18].

**B0 keeps everything else, and some of it is strong.** No routing error because there is no router. One record
a person can read end to end, which serves founder competence better than any permission-filtered projection
and which M4's narrowed delivery structurally cannot supply without a separate unfiltered surface [R8 §7].
Trivially changeable. And on this round's verification evidence, **B0 plus deterministic scripts plus human
acceptance is not obviously worse than B0 plus deterministic scripts plus a same-family checker** — a candidate
whose advantage is "it adds a checker" claims roughly four F1 points on a 28.6% base [R7 §8].

**Where M4 wins, narrowly.** F-3 at any demand level: B0 cannot exhibit attenuation because there is nothing to
attenuate from — **entailed by the frozen boundaries rather than measured, and it must not be scored as an
empirical result** [FAL-13, R8 TC-21]. F-4 at any demand level: the producer cannot be the independent
acceptor. F-5, where B0's single session is where the reset bites hardest, contrary to §6's granted strength
[R8 §9]. And F-1's adverse variation, where a refusal must be a recorded terminal state with an owner.

**Where M4 loses.** At 1× on C0/C1 work it is indistinguishable from B0 on every concurrency-dependent unit and
adds coordination cost for nothing. On founder legibility it is worse: nine holders, five structures and a
derived class is more than one record a person reads end to end, and W11 and W12 pull in opposite directions
here — the structure easiest for a founder to hold is the one W11 rejects by name [R8 A-6, FAL-11].

**The falsifier, named in advance so it cannot be authored after a result.** Count the derived class of every
action admitted over a fixed window. **If more than 90% derive to C0 or C1, M4's added structure is not paid
for**, the correct output is a smaller system, and `02-architecture-selection.md` §9 already commits to
reducing the system in that case. It needs no runtime beyond the derivation function and a month of admitted
work. A second falsifier: if the derivation and the declared floor agree on every action over a window, the
derivation adds nothing the floor did not already say and should be deleted in favour of the floor.

---

## 10. Strengths · Weaknesses · Limits

**Strengths.** The rule is one sentence and a reader can apply it to an action they have never seen. It is the
only axis on the founder's list plus leftovers that is a property of *the work*, so it does not degrade as
models improve. It answers three (d)-class candidates outright: permission composition, the interval holder,
and what a resumed attempt may trust. It binds to existing mechanisms rather than adding a parallel stack — the
frozen payload, the release transaction, the epochs, the conflict claims and the loader all already exist. And
it makes supervision derived rather than negotiated, which is DIRECTIVE §1.5 implemented rather than asserted.

**Weaknesses.**

- **The derivation is a new correlated single point of failure.** If it is wrong it is wrong in the same
  direction everywhere at once. One implementation, typed inputs, recomputation at the effect and parking on
  mismatch are mitigations; none makes it correct.
- **Composition across unjoined records is unsolved** [R4 §9 Q4]. §4.1 catches composition within a causal
  episode and across a shared entitlement or population, and nothing else. **This is M4's sharpest weakness and
  it is stated rather than mitigated.**
- **Nine holders is a roster shape and Conway's argument applies** [R8 W-4]. §2.5 and the retirement rule are
  the guards; the measurement is owed.
- **A false entry in a trusted business record defeats the derivation**, because trusted records are its
  inputs, and the screen that would catch it measured 0 of 360 against instruction-free poisoning [R1 F-10].
- **More machinery**: one extra record per operation, nine holder records, a mapping table and a two-phase
  derivation, against S1.0's single production rule.

**Scalability limits.** At CP1 concurrency is two non-interchangeable slots, so M4's structures serialise and
buy elapsed time and handoffs rather than multiplication [R8 W-1]. The binding threshold is **admitted work per
period** under a weekly bucket, not executor count [R8 TC-39]. Holder count is bounded by the §2.5 conjunction
and should not grow with revenue; if it does, the test is being applied wrongly.

**Operational complexity.** Higher than S1.0's and honestly so. The derivation is small and deterministic; the
holders are records with review dates, which is recurring human labour; the mapping table is data and is C5 to
change.

**Security implications.** Net positive where the class is computed from structure, since parameter-keyed rules
and OS-level enforcement are what pass R4's test [R4 F4]. Net negative in one place: the derivation is a new
high-value target, which is why writing it or a floor is C5. The documented runtime defaults — total tool
inheritance, no call-time attenuation, escalated modes propagating downward with the child's stricter setting
discarded, sandboxed subprocesses inheriting credentials — are live and **must be built against, not assumed
away** [R4 F5, FAL-03].

**Provider dependence.** The enforcement point must exist outside the model. In the runtime under consideration
it does [R4 F6, F7]; where it does not, M4 enforces by mediation through the existing gateway. M4 depends on no
provider feature not already in the specification, and on no second model family, which is fortunate because
none is reachable.

**Migration difficulty.** Low to moderate and mostly additive. Floors derive once from fields that already
exist. The derivation is new code with no data migration. The nine holders need addresses, mandates and
alternates, which is founder time. The harder part is the second half of §4.1: moving acceptance for C3+ to a
person is an operating change, not a software one.

**When this is the wrong design.** When the work is overwhelmingly low-consequence — the §9.2 falsifier. When
the acting party and the consequence cannot be separated, because then there is nothing the actor cannot author
and the derivation is theatre. When one person accepts everything anyway, so the rule adds bookkeeping to a
decision already being made. And when the company's work is one long research conversation rather than a stream
of discrete effects, because M4's unit is the action.

---

## 11. (d)-class self-audit against protocol §5

| # | §5 example | M4's answer | Class |
|---|---|---|---|
| 1 | Who admits a job of an unknown kind | H1 admits on an intake address; triage is a state with an owner; refusal is a terminal state of the same record; the criterion is the derivation, which runs before typing | **(a)** |
| 2 | Authority for a handoff's acceptance | §4.4: the interval holder is the producing structure's sponsor; ownership moves only by accepted responsibility transfer; at C3+ the interval escalates to a standing holder | **(a)** |
| 3 | Incompatible meanings of "done" | `submitted-pending-acceptance` is distinct from accepted and from discharged; a completion predicate never discharges an obligation; a remedy duty survives case closure under H2 | **(a)** |
| 4 | What a resumed attempt may trust | §7.5: C0/C1 trust the portable Continuation and manifest; C2+ re-derive the class and re-read epochs before release; a provider-resumed opaque session is never authoritative | **(a)** |
| 5 | Skill selection with no removal criterion | `05` §8's review retained plus the two-tier routing R6 F3 measures; an unused redundant skill retires after dependency and obligation checks. **Who owns a skill's expiry date is still unassigned** [R6 §9] | **(b)** |
| 6 | Permission composition undefined | §7.3: **minted narrowly, per attempt, never borrowed; intersection computed at release** | **(a)** |
| 7 | Delegation ceiling with an owner | One child layer by default, a second by explicit admission; owner C02; checkpoint at subagent start. Whether depth is a policy, a resource limit or a safety property is unresolved in the field, two vendors shipping opposite defaults [D-10]; M4 declares it a policy owned by C02 | **(a)** with a **(b)** residual |
| 8 | Writer authority on shared state | One authority per field, delivery narrowed per attempt; single-writer keyed state is the only surveyed mechanism answering this structurally [R3 F42, F44] and M4 adopts it for the fields the derivation reads | **(a)** |
| 9 | In-flight work at a provider or model change | `05` §3's migration plan retained; M4 adds that a pre-change acceptance at C2+ requires instrument recalibration, since an unchanged service drifted 84%→51% in three months [R7 F7] | **(a)** |
| 10 | Winner between concurrent attempts | First to reach the release transaction wins by conflict-claim serialisation on canonical business keys; the loser's work survives as attributed evidence | **(a)** |

**(d)-class items M4 leaves open, and none is offset by anything above.** **First**, whether this system has a
credential at the boundary at all [R4 §9 Q1]: if there is nothing to attenuate, TC-24 must be enforced by
mediation rather than delegation, which is a different architecture. Naming mediation as the fallback makes it
(b) *for M4*; the question is owed by whoever owns the runtime adapter. **Second**, composition across unjoined
records [R4 §9 Q4] — an implementer meeting an uncaught composition would be inventing policy. **Third**, the
arrival rate of genuinely novel work [R5-24, MG-06]: not a decision M4 must make, but it decides whether any
recogniser can be calibrated, and it is the cheapest measurement in the round. M4's design is deliberately
insensitive to it, because the class is computed before the kind, which is the best answer available while the
rate is unknown.

---

## 12. Evidence ledger

Every substantive design choice, the finding it rests on, and its kind. **A row with no finding id is a DESIGN
PROPOSAL with no evidence; they are counted at the end.**

| # | Choice | Findings | Kind |
|---|---|---|---|
| 1 | Consequence class as the single mapping rule | R2 F-21.3 · TC-17 · TC-35 · DIRECTIVE §1.5 | Inference on founder constraint |
| 2 | Reuse C0–C5; add no seventh class | `02-auth` §4 · control 1 | Specification |
| 3 | Class computed from what the actor cannot author; checked at the effect | **R4 F4** · R4 F1 · R4 TC-24 | Specification on source claim |
| 4 | Derived from the frozen payload and parameter authorities | `02-auth` §5 · `02-arch` §4 | Specification |
| 5 | Recompute at release; park on mismatch | R4 F3 | Specification on source claim |
| 6 | Declared floor may only raise | *(none)* — control 8 · R3 F60 motivate, neither evidences | **Design proposal, no evidence** |
| 7 | One implementation of the derivation | DIRECT OBSERVATION: `scripts/classify.mjs` and the recorded collision in `CLAUDE.md` | Direct observation |
| 8–12 | Reject tool self-annotation, command-text matching, instruction scoping, definition-file authority, sandbox-as-decision | R4 F4 · R4 F8 · R4 F5 · R4 F9 · R4 F12 · AG-08 | Source claim |
| 13 | Five structures; W merges deterministic and durable | `02-arch` §3 · R7 M1 | Inference |
| 14 | Typed manifest as the transfer unit | **R2 F-04** (0/48 vs 73%) · R2 F-05 · X13 | Specification on source claim |
| 15 | Handoff below C2, consultation at and above | R2 F-17 · R3 F20 · X12 | Design proposal on source claim |
| 16 | A continuation is a handoff | R2 F-18 · FAL-02 · R2 §9 Q2 | Inference |
| 17 | StandingHolder as a record, performer ephemeral | R8 A-4 · R8 A-5 · **R8 A-7** | Inference |
| 18 | The three-part existence test | *(none)* — R8 A-5 and `02-arch` §3 motivate; the conjunction is ours | **Design proposal, no evidence** |
| 19 | The specific set of nine holders | *(none)* — derived by applying row 18 to the 46 contracts | **Design proposal, no evidence** |
| 20 | Holder retirement criterion | DIRECTIVE §9 · X10 · R3 F38/F39 | Design proposal on source claim |
| 21 | A holder never releases | `05` §1 · `02-auth` §1 | Specification |
| 22 | Reservations have holders; protected lanes need consent | **R8 A-4** · `07` §6 | Design proposal on inference |
| 23 | Unused reservation returns within the window | **R8 §3** | Source claim |
| 24 | Capacity reported as ratios only; tokens refused | R8 W-6 · TC-26 · control 7 | Source claim |
| 25 | F-2 declared owed and blocked, not passed | R2 F-19 · AG-13 · control 10 | Inference |
| 26 | Class before kind at admission; mistyping cannot lower it | R5-15 · R5-16 · TC-40 | Inference |
| 27 | Unresolvable defaults to the ceiling | `05`/`06` UNKNOWN rule · R1 F-10 | Specification |
| 28 | Disposition of unhandleable work is per class | **D-11** · R5 §5 | Design proposal on disagreement |
| 29 | Admission broad, refusal explicit and recorded | R5-04 · R5-05 · R5-14 · control 9 | Source claim |
| 30 | A refusal is C2 and has its own acceptance owner | *(none)* — R5 §9 Q3 asks the question; the answer is ours | **Design proposal, no evidence** |
| 31 | The interval named, held, queryable | **AG-18** · R5-13 · X18 · `05` §10 | Design proposal on source claim |
| 32 | Composite grant minted per attempt, intersected at release | R4 §8.1 · protocol §5 item 6 | Specification on source claim |
| 33 | `derived ⊆ parent` as a decidable predicate | R4 F10 · R4 §8.1 | Specification on source claim |
| 34 | Assume no more than granted; never assume delivery | **R3 F59** · X16 | Specification on direct observation |
| 35 | Delegation ceiling owned by C02 with a checkpoint | R4 §9 Q3 · D-10 · `05` §5 | Design proposal on disagreement |
| 36 | The loader narrows; the model is never the boundary | **R1 F-14/F-15/F-16** · AG-08 | Specification on source claim |
| 37 | One authority per field, not one store read by everyone | **R8 W-3** · R1 F-06 · D-03 preserved | Inference under disagreement |
| 38 | Manifest records dropped constraints and its class | R2 §8 · TC-27 · `06` §2 | Design proposal on source claim |
| 39 | Nothing load-bearing in an instruction file | **R1 F-20** · AG-01 · control 2 | Specification on source claim |
| 40 | A false entry cannot change a class | R1 F-10 · R1 F-11 · R1 F-13 | Inference |
| 41 | Skill tool grants inert; effective set from the manifest | **R2 F-08** · R6 F7 · AG-07 | Specification on source claim |
| 42 | Two-tier skill routing | R6 F3 · AG-06 · D-07 | Source claim |
| 43 | Verification requirement derived from class; C3+ is human | R7 F5 · R7 F9 · R7 §8 | Inference |
| 44 | AM-01 paired clean case mandatory; no rate → `unresolved` | **R7 F8** · FAL-09 · AG-15 · control 3 | Specification on source claim |
| 45 | Third arm: the shared-record leakage channel | **R7 §9** | Design proposal on source claim |
| 46–48 | Union not vote; chance-corrected agreement; rubric edit is an instrument change | **R7 F15** · R7 F3/F4 · R7 F6 | Source claim |
| 49 | Debate refused for F-4 | R7 F17 · D-13 preserved | Inference |
| 50 | Independence of influence yes, of error no — both stated | **R7 TC-37** · FAL-08 | Specification on source claim |
| 51 | Every approval carries an expiry | **R4 TC-25** · R4 failure case 8 · DIRECTIVE §1.5 | Specification on founder constraint |
| 52 | Founder return derived from class | DIRECTIVE §1.6 · TC-29 | Specification on founder constraint |
| 53 | Re-entry brief carries omissions and contests | **R1 F-17** · R1 §8 F-6 | Specification on source claim |
| 54 | Founder is a differently-correlated instrument | **R7 F15** · R7 §8 F-6 · X19 | Source claim |
| 55 | Nothing accepted in absence on a same-family checker above threshold | R7 §8 F-6 | Design proposal on inference |
| 56 | Idempotency record detects a released effect | R1 §8 F-5 · AG-11 | Specification on source claim |
| 57 | Stated winner between concurrent attempts | `02-auth` §5 · protocol §5 item 10 | Specification |
| 58 | Escalation ends at a holder; overflow has a destination and a count | **R5-12** · R5-19 · R5-10 | Design proposal on source claim |
| 59 | Re-routing not scored as a defect by itself | **D-12** · R5-20 | Inference under disagreement |
| 60 | Changing the derivation, table, holders or a floor is C5 | `02-auth` §4 | Specification |
| 61 | Every mechanism carries a removal test | DIRECTIVE §9 · R3 F38/F39 · X10 | Specification on founder constraint |
| 62 | E justified only by permission, confidentiality, provenance, different observation | R2 F-09 · R2 F-21.1 · R2 §8 · control 4 | Specification on source claim |
| 63 | Specialized knowledge is not a reason for a separate worker | **R2 F-10** · R6 F6 · TC-33 | Source claim |
| 64 | Parallel work is not a reason at the current pin | R2 F-06 · R2 F-19 | Inference |
| 65 | The one-action-two-classes anti-renaming test | *(none)* — TC-17's fixture and control 1 motivate; the test is ours | **Design proposal, no evidence** |
| 66 | The >90% C0/C1 falsifier and its threshold value | *(none)* — protocol §6 and `02-arch` §9 evidence the *shape*, not the number | **Design proposal, no evidence** |
| 67 | Holder-convergence measurement owed | **R8 W-4** · R8 §10 Q1 · MG-11 | Design proposal on inference |
| 68 | B0's capacity and single-context strengths falsified | **FAL-01** (R8 B-6) · **FAL-02** (R2 F-18) | Source claim |
| 69 | B0's F-3/F-4 failure is entailed, not measured | **FAL-13** · R8 TC-21 | Inference |
| 70 | M4 indistinguishable from B0 at 1× on low-class work | R8 §3 · R7 §8 | Inference |

**DESIGN PROPOSAL choices with no evidence: 6** — rows **6** (floors raise only), **18** (the three-part holder
test), **19** (the specific nine holders), **30** (a refusal is C2 with its own acceptance owner), **65** (the
anti-renaming test as specified) and **66** (the 90% threshold). Rows 6, 18 and 19 are the load-bearing ones:
if the holder test is wrong the holder set is wrong and §8's last column is wrong with it. Row 66's threshold
is a placeholder chosen to be falsifiable rather than derived — the *shape* is evidenced, the *value* is not.

**Disagreements carried unresolved, per DIRECTIVE §6:** share-everything against narrow-every-delivery [D-03];
whether a turning point exists in executor count [D-04]; whether seeded defects estimate real-defect detection
[D-08]; buy a second model family or stop relying on model judgement [D-13]; whether the founder's five axes
are separable in the shipping runtime [D-14]; whether re-routing is a defect [D-12]. M4 takes a side on D-03
and D-13 and says so; it takes no side on the rest.

---

*Candidate artifact. Nothing here is a decision, a measurement or an acceptance. Whether the sixth reason
closes the founder's list is his decision [TC-35], and no agent may make it for him.*
