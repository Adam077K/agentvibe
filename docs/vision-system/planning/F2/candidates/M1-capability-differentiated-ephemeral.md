# M1 — Capability-differentiated ephemeral agents around shared state

> **What this is.** One of five F2 candidates, formed blind of the other four. It is the founder's thesis
> made concrete, and corrected where the evidence requires. It decides nothing: it is a proposal for the
> Step 6 reviewers to judge against the frozen protocol at
> [`00-acceptance-protocol.md`](../00-acceptance-protocol.md) and amendment AM-01.
>
> **Standing caveat.** No runtime exists. Nothing below was executed. Every external number cited belongs to
> some other system, task distribution and date, and is carried with its lane's finding id. Every author and
> reviewer in this round shares one model family; independence is procedural only.
>
> **Statement kinds** follow [DIRECTIVE §6](../../../inputs/DIRECTIVE.md): **SOURCE CLAIM**, **INFERENCE**,
> **DESIGN PROPOSAL**, **HYPOTHESIS**, **UNKNOWN**. §12 is the ledger binding every design choice to its
> finding.

---

## 1. Summary for the founder

You asked whether agents should exist at all, and if so on what grounds. This candidate says: yes, but far
fewer than a department, and never for the reason you'd hire a person.

**Where you were right.** Splitting work by job title buys nothing. Splitting by permission buys something
measurable, and it is the only one of your five criteria that anything outside the model enforces. Handoffs
really do lose things. And coordination around a shared record beats disconnected workers.

**Where the evidence corrects you, in four places.**

First, **your five reasons are not five reasons about one thing.** Each applies to a different object — a
partition, a permission scope, a context boundary, a procedure package, a relationship between two attempts.
Ask "does this agent have specialized knowledge" and you get an answer that cannot be checked. Ask "does this
*procedure package* encode competence a general worker lacks" and you get an answer that can. So this
candidate applies each reason to its own object, and one of your five — specialized knowledge — turns out to
justify a skill file and never an agent.

Second, **the handoff cost is aimed at the wrong target.** Under compression, ordinary facts survive at about
97%. Rules, exclusions, deadlines and promises survive at about 57%. And when constraints were sent as typed
fields instead of prose, leakage went from 73% to zero out of forty-eight cases. So the answer is not "split
less". It is "type what crosses". You will pay this cost anyway: a native job caps at a six-minute window, so
even a single worker hands off to itself on every long job.

Third, **"one shared source of truth" cannot mean one store everyone reads.** Performance degrades as input
grows, and even one irrelevant item hurts. What works is one *authority per field* with delivery narrowed per
attempt. Those are different designs and your sentence does not distinguish them.

Fourth, **two more reasons belong on your list and one belongs off it.** An executor may exist because it
touched untrusted input, and because the action it takes has a different consequence class — drafting an
internal note and drafting a customer promise can be identical in every other way. Attributable identity is
not a reason to create an executor; it is mandatory for all of them.

**What you get.** Six named reasons, each with a decidable test and a removal criterion. Typed constraints on
every boundary. One writer per canonical field. Authority checked at the moment of effect, not at spawn.
Verification split honestly into what separation buys (it stops the producer influencing the checker) and
what it cannot buy (independent errors, inside one model family).

**What it costs, plainly.** More records than a simple baseline. A real risk that the same six executor shapes
recur every week, at which point you have a roster you discovered instead of declared. This candidate names
the measurement that would catch that and does not pretend it has run.

---

## 2. Core primitives

**DESIGN PROPOSAL** throughout this section unless a sentence carries its own kind. Records named in
`SmallCaps` already exist in [`05-work-agents-skills.md`](../../specification/05-work-agents-skills.md),
[`06-knowledge-evidence-evaluation.md`](../../specification/06-knowledge-evidence-evaluation.md) and
[`02-authority-recovery.md`](../../specification/02-authority-recovery.md); this candidate reuses them and
says what it changes. New records are marked **NEW**.

### 2.1 Reused unchanged

| Record | Role in M1 | Unchanged from |
|---|---|---|
| `Goal`, `Case`, `WorkOrder`, `WorkDependency`, `Blocker` | The durable unit of work and its preconditions. The `WorkOrder` is what an executor is bound to, and the thing that outlives it | `05` §2 |
| `AgentTemplate` | A versioned production recipe, "not an identity with standing" | `05` §4 · CP-74 |
| `AgentInstance` | One recipe bound to one admitted `WorkOrder`, executor identity, runtime profile, lease epoch, generation | `05` §4 · CP-74 |
| `ExecutionSelection` | Candidate runtime/agent/skill versions, eligibility reasons, expected resource ranges, chosen fallback | `05` §4 |
| `Continuation` | The portable carrier across a session or capacity boundary | `05` §5 · `06` §2 |
| `WorkMessage`, `MessageAcknowledgment` | Typed inter-executor traffic with received / understood-scope / accepted-assignment / refused / answered | `05` §5 |
| `ContextManifest`, `ContextTransformation`, `SummaryLoss` | What was delivered, what was dropped, by what transform | `06` §2 · CP-128, CP-132 |
| `Grant`, `ConsequenceVector`, `OperationIntent`, `ParameterAuthority`, the three epochs | Authority, its ceiling, a proposed effect, and where each consequential parameter came from | `02` §4, §8 |
| `SkillVersion`, `InstructionBundle`, `WorkflowDefinition` | Reusable procedure, stable instruction contract, immutable versioned procedure | `05` §3, §8 · CP-106, CP-109 |
| `EvidenceBaseVersion`, `EvidenceJudgment`, `EvaluationPlan`, `Review` | The acceptance apparatus and its transitive closure | `06` §5, §6 |
| `FailureRecord`, `Schedule`, `ScheduleOccurrence`, `ResourceAccount`, `Reservation` | Durability, time and capacity | `05` §6, §7 · `07` §6 |

### 2.2 New records

**NEW · `ExistenceJustification`.** The record that makes the founder's gate mechanical instead of rhetorical.
It is written **before** an executor is created and is refused if it cannot be filled.

| Field | Content |
|---|---|
| `reason` | Exactly one of the six admitted reasons in §4.1. Never a list |
| `unit` | The object the reason predicates on: `partition` · `permission_scope` · `context_boundary` · `input_set` · `effect_class` · `attempt_relation` (R2 F-20) |
| `decidable_test` | The named observation that returns true or false for this unit, per §4.1's table. A test that cannot return false is refused |
| `work_order_ref` | The admitted `WorkOrder` this executor exists for. There is no executor without one |
| `alternative_considered` | What was tried instead — a skill load, a consultation, a deterministic step — and what it failed at |
| `removal_criterion` | The observation under which this executor stops being created. Required by W9 and by [`02` §8](../../02-architecture-selection.md)'s removal discipline |
| `expected_cost` | Native job launches and quota bucket, in `07` §6 units. Never tokens (CP-173) |

*Identity:* one per `AgentInstance`. *Lifecycle:* `proposed → admitted → expired-with-instance`. *Writer:*
C02 at admission. *Reader:* C02, C06 at acceptance, and the profile-convergence probe in §6.5.

*Why it exists:* protocol §4 control 4 hunts for "an agent justified by a capability the fixtures never
exercise". A justification that names its unit and its test is checkable; one that names a capability is not
(R2 F-20, X11).

**NEW · `ConstraintSet`.** The typed boundary-metadata envelope that must accompany every transfer: every
`Delegation`, every `WorkMessage` of kind `assignment` or `result`, every `Continuation`, every subagent
dispatch and every consultation return.

Members are typed, not prose: `exclusion[]` (scope and subject), `deadline[]` (instant, authority, what
lapses), `promise[]` (beneficiary, exact wording ref, remedy), `rejected_alternative[]` (option, reason,
who decided), `unit[]` (quantity, unit, tolerance), `restriction[]` (recipient scope, purpose, epoch),
`surviving_obligation[]` (duty, custodian, expiry).

*Rule, and it is the load-bearing one:* a receiver may act only on members it can restate as typed values.
Prose accompanying a `ConstraintSet` is evidence, never a substitute for a member. A transfer whose
`ConstraintSet` fails schema validation produces a quarantined report and a bounded repair request (`05` §5),
not a best-effort continue.

*Why it exists:* **SOURCE CLAIM.** Operational facts survive a 25-word compression at ~0.97–0.98 and boundary
markers at ~0.57–0.58; vague constraint language leaked protected information in 73% of GPT cases against
under 15% with explicit constraints; a typed allowlist reduced leakage to **0 of 48** (R2 F-04, F-05; X13;
AG-09).

**NEW · `FieldAuthority`.** The concrete meaning of "shared source of truth". For each canonical
cross-boundary field: exactly one writing authority, its epoch, its narrowing rule, and its reconciliation
procedure against the native system that owns the domain meaning.

*Identity:* `(field_path, epoch)`. *Lifecycle:* `declared → current → superseded`. *Writer:* C01 declares the
authority; only the named authority writes the value. *Reader:* the loader, never an executor directly.

*Why it exists:* **SOURCE CLAIM + INFERENCE.** Single-writer keyed state is the only surveyed mechanism that
answers "no writer authority on shared state" structurally rather than by convention (R3 F42, F44); a state
write is an event, so the audit trail and the state are one artifact (R3 F24, F25); one authority over many
native stores is implementable at extreme scale for **one narrow fact class**, at the price of a dedicated
service and a bespoke consistency mechanism (R1 F-23), which is evidence for the reading at fact-class
granularity and **against** it at company granularity. CP-22 already says native meanings stay authoritative
and shared meaning covers only cross-boundary decisions. M1 adopts that reading and refuses the one-store
reading by name.

**NEW · `Projection` and `ProjectionGrant`.** A permission-filtered derivative of another executor's or
another venture's work, with `recipient_scope`, `purpose`, `granted_at`, `expires_at`, `derived_from` and
`revocation_epoch`.

*Rule:* a `Projection` is filtered **at write**, again **at read**, and is invalidated when its
`ProjectionGrant` is revoked — including derivatives already written.

*Why it exists:* CP-84 permits reading authorized peers' work projections and forbids seeing all company
context to coordinate. **SOURCE CLAIM:** a projection is a derivative that may outlive the grant justifying
it, and erasure does not propagate to derivatives by default (R1 §9.5, §9.7). **SOURCE CLAIM:** the memory
component is where disclosure defences work worst — 28–29% reduction in memory against up to 50% in channels
(R1 F-15). So the projection is the highest-risk object in this candidate and carries the tightest rule.

**NEW · `HandoffAcceptance`.** The record that closes the interval nothing in the surveyed field has a name
for. It carries `from_holder`, `to_holder`, `obligation_refs`, `constraint_set_ref`, `accepted_at`, and
`interval_state ∈ {declared_done, in_acceptance, accepted, rejected}`.

*Rule:* between `declared_done` and `accepted`, **the giver remains accountable**. The obligation does not
float. A handoff with no `HandoffAcceptance` is not a handoff; it is an abandonment, and C02 reports it as one.

*Why it exists:* **SOURCE CLAIM.** No system in the field has an acceptance-owner concept; all terminate on
producer-declared completion (AG-18, R3 §9, R5-13, R7 §8 F-1). A shipped tracker lets an item be Done with an
empty resolution field (R5-13), which is (d)-class example 3 already in production somewhere. This is axis
X18 and M1 is required to answer it.

**NEW · `ConsultationRequest`.** The alternative to a handoff: a bounded sub-question answered by a separate
executor while the obligation-holder **stays in the turn**. Carries `question`, `input_set_ref`,
`constraint_set_ref`, `answer_contract`, `budget`. Returns an `AttemptReport`, never ownership.

*Why it exists:* **SOURCE CLAIM + INFERENCE.** A vendor implements both and states they are not
interchangeable: a handoff transfers ownership of the turn through a compressed artifact; agents-as-tools
keeps the obligation-holder in place (R2 F-17, X12). A second vendor's default handoff transfers the **entire**
history and leaves the guardrails behind (R3 F20, F21). **M1's default for obligation-bearing work is
consultation; handoff requires a `HandoffAcceptance` and is the exception.**

**NEW · `NextActionView`.** The "updated view of what should happen next", given the three properties the
thesis's phrasing omits: a named author, a **different** named approver, and an explicit validity window. It
is re-issued per operating period, never edited in place.

*Rule:* an executor may act against the current view by recording an `objection` (`05` §5), which does not
suspend the view. The view is advisory over method and binding over sequence only where a `WorkDependency`
makes it so. Waiting for better information before issuing one is forbidden.

*Why it exists:* **SOURCE CLAIM.** In the one system designed for genuinely unforeseen work, the plan has an
author, an approver who is a different role, an operational period, a mandatory transfer briefing, and an
explicit prohibition on delaying planning in anticipation of information that has not arrived (R5-23). The
thesis's phrase names an artifact with no author, no approver and no expiry, which R5 classes as the (d)-class
shape (TC-34).

**NEW · `AdmissionRecord`.** Admission as a first-class state with an owner, not a folder. Carries `origin`,
`provenance_class`, `proposed_type`, `typing_confidence`, `disposition ∈ {admitted, refused, parked,
escalated}`, `reason`, `owner`, `next_check`.

*Rule:* **refusal is a terminal state of the same record**, with a reason and an owner who accepts that the
refusal was correct. Silence is not refusal.

*Why it exists:* **SOURCE CLAIM.** Triage is a first-class status category with a named rotating responsible
owner, and declining updates the item to a cancelled status type rather than deleting it (R5-14); a catch-all
must name what it cannot catch (R5-09, AG-12); nothing in the surveyed field refuses a job with a reason
(R3 §9 F-1), so this cannot be imported and must be built.

**NEW · `EffectIdentity`.** A centrally allocated idempotency key and reserved name range for any external
effect, issued by C04 before release and required at the effect.

*Why it exists:* **SOURCE CLAIM, and it is the counter-mechanism the thesis does not predict.** In one
vendor's experiment, **18 of 30 agents chose the identical git branch name**; a job-queue experiment saw 2.4
million requests and 117 acceptances; and in hidden-profile tasks agents failed to surface private information
contradicting group consensus (R1 F-17, AG-17). The cause is correlated behaviour between identical models,
not divergent context. **A shared authoritative view does not fix this and may amplify it.** Deliberate
decorrelation must be designed alongside the shared record, not after it (R1 useful mechanism 8).

**NEW · `GrantDeliveryReceipt`.** An attestation, recorded at the first effect of an executor, that the
authority it was granted actually **arrived**.

*Why it exists:* **SOURCE CLAIM.** An identical grant delivered 24 tools on one day and zero across three
dispatches two days later with configuration unchanged; the verifying command checks configuration only
(R3 F59, MG-13, X16). Attenuation held; delivery did not. **A system may safely assume a child holds no more
than it was granted, and may not assume it holds what it was granted.**

**NEW · `ShedDecision`.** For F-2: what was shed, by whose authority, which obligations moved with it, what
the founder was shown, and the re-admission condition.

*Why it exists:* **INFERENCE.** `07` §6 reserves capacity by *class*, and a class has no representative to
ask; the fixture requires a named authority to shed a lane (R8 A-4). This is the single place in the six
fixtures where a chartered persistent roster does work the current position has no mechanism for, and M1
closes it with a record rather than a roster.

**NEW · `InstrumentCalibration`.** For every checker: its planted-defect result, its **paired clean-case**
result in the same session, its chance-corrected agreement figure, the rubric version it ran, and the date of
next re-run.

*Why it exists:* AM-01, plus **SOURCE CLAIM**: false-positive rates of 68.4–96.8% on already-patched files
under neutral framing (R7 F8), exact-match agreement overstating discrimination by 33.8–41.2 points (R7 F3),
judges flipping 8.5–61.3% under semantically equivalent rephrasing (R7 F6), and 84% → 51% drift on an
unchanged named service in three months (R7 F7).

---

## 3. Control structure

### 3.1 Who decides the next move

**DESIGN PROPOSAL.** C02, the case admission authority, and nothing else. It is the sole advancer of the
workflow cursor, in the same protected transaction that records the step result and creates the next work
intent (CP-68). It issues the `NextActionView`; C01 approves it. No executor advances its own cursor and no
executor admits its own larger mandate (`02` §4).

**INFERENCE, and the cost is stated rather than hidden.** The founder's phrase "coordinated capabilities
around a shared source of truth" is, structurally, the blackboard model, whose own author wrote that **no
control component is specified** and that the locus of control may sit in the knowledge sources, on the
blackboard, in a separate module, or in any combination (R5-01, TC-41). M1 chooses the separate module, and
inherits the documented cost: a monitor has broad executive power and can violate the opportunism the shared
record existed to enable (R5-02). `02` §2 names the same cost independently as concentrated agenda authority.
**Removal criterion:** if C02's concentration measurably misses important work, raises founder labour, or
obstructs independently capable domains, this choice reopens (`02` §9).

A fourth locus exists and M1 borrows one mechanism from it without adopting it: coordination by
**subscription**, where structured messages are published to a shared pool, extracted by role-specific
interests, and an action activates only when all prerequisite dependencies have arrived (R3 F33, D-15). M1
takes the dependency gate — a `WorkOrder` is dispatchable only when every `WorkDependency` predicate is
satisfied — and refuses the interest-based extraction, because interests are a role profile by another name.

### 3.2 Admission of work of an unknown kind

**DESIGN PROPOSAL.** F-1's question decomposes into four with different answers, and M1 answers them
separately (R5 TC-19).

1. **Admitted** with no human edit. Any authenticated channel, native observation, scheduled occurrence or
   complaint may open an `AdmissionRecord`. Admission bias is deliberately low **for reporting** and there is
   an explicit prohibition on self-dispatch: opening a record grants no authority to act (R5-04, R5-05).
2. **Typed** with no human edit, and measured. The typer returns one of three dispositions —
   `matches_existing_kind`, `no_match` (a searched answer), `typing_budget_exhausted` (an unfinished search).
   **A fourth outcome, `typed_into_nearest_existing_kind`, is the failure to hunt and is never scored as
   success.** The instrument is a three-class confusion matrix; the discriminating quantity is out-of-scope
   recall, which lags in-scope accuracy badly — 96%+ in-scope against 66% best out-of-scope recall, falling to
   40.3% when novel training material is scarce (R5-15, R5-16). `05` §10 already has the right shape one level
   down in `SkillSelection.no_match` versus `budget_exhausted`; M1 lifts it.
3. **Staffed** — and **this is where the thesis fails as written, and M1 says so.** Nothing in the surveyed
   field staffs a genuinely novel work *kind* without a pre-declared envelope, a pre-registered handler, or a
   human redeploy (R5-06, R5-08, R5-14). The standard most cited for unanticipated work admits an unscheduled
   item, not an unanticipated kind (FAL-12). M1's position: **ownership of unknown work needs no edit; the
   capability to perform it does.** A `CapabilityProposal` is raised by the maintenance custodian and approved
   by the legitimate capability owner (CP-77), and the first outcome of a new capability has a named acceptance
   owner before the capability is admitted. Zero-edit staffing is not claimed.
4. **Accepted** by an ordered deterministic resolver, which is not a human editing the system: promise sponsor
   → service mandate → designated maintenance/discovery custodian → the founder's standing delegate, with
   least-authority-sufficient as the overlap tie-break and `custody_tie_break_reason` recorded so two
   implementations are comparable (`03`, R5 §8).

**Refusal path.** The genuinely spurious job is refused with a reason, recorded as a terminal state of the
same `AdmissionRecord`, with an owner who accepts that the refusal was correct. A refusal communicated
outward is itself an outward effect and goes through C04 (R5 §9 Q3).

**UNKNOWN, and it is the cheapest missing measurement in the round.** Nobody has measured the arrival rate of
genuinely novel work (R5-24, MG-06). A recogniser with those error rates behaves completely differently at one
novel job in five than at one in two hundred. M1 requires the founder to count admitted items over a past
window against the existing capability list **before** any typing mechanism is evaluated. It needs no software.

### 3.3 The ownership resolver, and a tension M1 decides rather than hides

**DESIGN PROPOSAL.** Two reasoned rules point opposite ways. The national incident system defaults
responsibility **upward** to the next supervisory position until delegated (R5-03) — toward *more* authority.
The current position defaults to the **narrowest sufficient mandate** — toward less. M1 keeps the narrowest
sufficient mandate for the *work*, and adds the missing terminal element the upward rule supplies: **when no
mandate covers the harm at all, custody terminates at a standing human role with actual authority to act, not
at a queue.** Universal ownership and no ownership are one state (R5-11).

Two provisions are load-bearing rather than bookkeeping, because they prevent the harmful reassignment shape:
the losing-mandate record, and "a contested provisional custody is still custody" (`03`). **SOURCE CLAIM:**
reassignment is often how the right owner is found, and the harmful pattern is *cycles at the end of a
sequence*, not reassignment count (R5-20, D-12). M1 therefore measures end-of-sequence cycles separately and
**does not** score re-routing as a defect, because a design that minimises re-routing may be suppressing
diagnosis.

### 3.4 Where authority is enforced

**DESIGN PROPOSAL, and it is the single most important sentence in this candidate.** *A boundary is real only
if the thing checked at the moment of the effect is the same thing that was granted* (R4 F1). Therefore:

- Authority is computed as an **intersection at the delegating call** — standing `Grant` and
  `ConsequenceVector` on one side, the attempt's `OperationIntent.grant_refs` and
  `parameter_authority_refs` on the other — and the intersection is computed **at release, not at
  assignment** (R4 §8.1, the AWS session-policy shape at R4 F2).
- The predicate `derived ⊆ parent` is decidable, deterministic, and checked by the enforcement point rather
  than asserted by the delegator (R4 §8.1; the IETF draft supplying it has **no standing** and M1 adopts the
  predicate, not the document).
- Revocation is not purchasable from an attenuating credential. It requires a **live epoch re-read at the
  effect** — `identity_epoch`, `grant_epoch`, `scope_epoch` — which `02` §4 and §6.2 P3 already specify
  (R4 F3).
- Consequence class is computed from something the acting party cannot author. Tool self-descriptions are
  normatively untrusted; command-text matching is not a security boundary (R4 F4). M1 keys permission rules
  on structured parameters and on the `WorkOrder`'s declared effect class, never on model-authored prose.
- **Delegation is itself an authority operation and costs a check.** In the runtime this system plans to
  launch, spawning costs no permission check at all (R4 §9 Q3), so the ceiling needs an owner *and* a
  checkpoint. M1's ceiling: one child layer by default, a second only with explicit admission rationale and
  reserved coordination capacity, deeper only by a reviewed template change (`05` §5). The **owner** of that
  ceiling is C01, and raising it is a self-modification requiring review, which settles D-10 for this system
  without claiming the field has settled it.
- **Approvals expire.** An approval with no lifetime is a grant, and grants expire (R4 §9 Q5). The
  anti-pattern M1 refuses by name: a permanent repository-wide allow rule written by answering "don't ask
  again", which is a monotone ratchet driven by prompt fatigue (R4 F4 failure case 8, TC-25).

---

## 4. Execution structure

### 4.1 When an executor is created — the six reasons and their units

**DESIGN PROPOSAL.** An `AgentInstance` is created only when exactly one `ExistenceJustification` passes.
Each reason applies to its own unit, and each carries a test that can return false.

| # | Reason | Unit it predicates on | Decidable test | Status against the thesis |
|---|---|---|---|---|
| **R1** | **Distinct permission scope** | a permission scope | The task's required effect classes are a strict superset of what one scope may hold under least privilege, and the split reduces the set any single identity holds | **Kept and strengthened.** The strongest of the five; the only one enforced outside the model; the only one with a published price — 77% of tasks solved with provable security against 84% undefended (R2 F-09) |
| **R2** | **Input provenance** | an input set | This executor will read input from an untrusted origin, and a downstream effect must be unreachable from that input | **NEW, admitted.** Collapsing it into "distinct permissions" keeps the remedy and loses the reason (R2 F-21.1). It is the shape of the measured defence in R2 F-09 |
| **R3** | **Consequence class** | an effect class | Two parts of the work differ in reversibility, blast radius or outward visibility, holding work, tools, skills and context identical | **NEW, admitted.** DIRECTIVE §1.5 sets supervision by consequence; drafting an internal note and drafting an outward customer promise can be identical in every other respect (R2 F-21.3, R4 F4). The strongest leftover in the adversarial search |
| **R4** | **Isolated context, confidentiality sense only** | a context boundary | A seeded private term reachable by part A must not be reachable by part B, and the seeded-canary probe across every disclosure destination can fail | **Kept, narrowed.** The word covers two things. Isolation for *attention* moves with the model generation and is shrinking; isolation for *confidentiality* is structural (R2 §8, D-02). **Only the confidentiality sense is exercised by any frozen fixture**, so only it may justify an executor (protocol §4 control 4) |
| **R5** | **Parallel work against a named partition** | a partition | The proposed partition is cohesion-checked: tightly coupled units are assigned to the same executor, and the integration cost is charged to the parallel arm | **Kept, and dormant.** Not a property of a job; a property of a partition, and the same job admits good and bad ones (R2 F-06). Cohesion-aware partitioning gained 11.3 and 14.0 points with 1.81×–2.10× speedup; poor partitioning degraded both speed and quality. **At CP1 the two slots are not interchangeable** (R2 F-19), so this reason is admissible at most once per work order and is effectively inert until a reviewed `CapacityPlan` revision |
| **R6** | **Independent verification** | a relation between two attempts | The checker's *delivered* inputs are the artifact plus the acceptance criteria and nothing else, verified by the loader rather than asserted (CP-128) | **Kept, split.** It justifies a separate **context and input set**, which is what the measured effect attaches to; it does not by itself justify a separate template (R7 F9, R7 §9) |

**Refused as reasons, each with why.**

- **Specialized knowledge.** **DESIGN PROPOSAL, correcting the thesis.** It predicates on a `SkillVersion`,
  not on an executor, and may never create one. **SOURCE CLAIM:** across 4 model families, 162 roles and
  2,410 factual questions, adding personas did not improve performance, and selecting the best persona was no
  better than random (R2 F-10, R6 F6). The competing result removes a label *plus its procedural content*,
  and the reconciliation — procedure carries the benefit, the title carries none — is an **INFERENCE** that
  nobody has measured directly (R2 F-10, MG-10, G-4). M1 takes the conservative branch: put the procedure in
  a versioned, tested, owned package (CP-109) and let a general executor load it.
  **One exception, and it is an authority exception rather than a knowledge one:** in the harness this system
  plans to launch, a skill file's `allowed-tools` **grants** and does not restrict, and a skill can grant
  itself broad access (R2 F-08, R6 F7, AG-07). So `05` §8's rule that "a prose package cannot install,
  contact, spend or execute by being loaded" is correct as design intent and **false as a description of that
  runtime**. M1 closes it at the launcher: skills are loaded with their tool-granting frontmatter stripped,
  and any tool a procedure needs is granted through R1, through a `Grant`, checked at the effect.
- **Provider or account separation.** Real, and not an existence reason. It is a property of
  `ExecutionSelection` and `ResourceAccount` (`07` §6). Folding it in would double-count: at CP1 the two
  concurrent slots already differ in provider, so R5 and provider separation are the same event.
- **Attributable identity.** **Not a reason. A mandatory property of every executor.** F-3 requires the record
  of which identity performed which effect regardless of why the executor exists (R2 F-21.4). Treating it as
  a justification would license an unlimited number of executors.

**Human and professional performers.** **SOURCE CLAIM.** Two of the six transfer intact to people
(specialized knowledge as professional competence, independent verification), one changes meaning (permissions
become authorization and liability, enforced by institutions rather than an allowlist), and two do not
transfer (parallel work becomes scheduling and payment; isolated context is not constructible for a person who
has already read something) (R2 TC-38). **Two reasons apply only to people:** professional standing that the
act itself requires, which no capability difference can supply (R2 TC-38); and being a differently-correlated
error source, which is the founder's actual value in the verification loop (R7 §8 F-6).

### 4.2 What an executor receives

**DESIGN PROPOSAL.** A dispatch payload is exactly four things, assembled by the C05 loader, which **discovers
and records actual delivered inputs — the caller's claimed read list is not trusted** (CP-128).

1. The `WorkOrder`: outcome, acceptance owner, acceptance criteria, budget, stop rule, latest responsible time.
2. The `ConstraintSet`, typed.
3. The `ContextManifest`: source/capture/artifact versions, permission and validity epochs, transformations,
   selection reasons, byte allocations, actual source spans, **omissions**, and complete known native ancestry
   — with each item's **trust level** named (DIRECTIVE §8.12).
4. Its `Grant` refs and effect classes, to be re-checked at the effect.

**Three things it does not receive:** all company context (CP-84); the producer's rationale, if it is a
checker (§6.1); and any authority derived from a file it or a peer could write (R4 F5, CVE-2025-54135 shape at
R4 F9).

**The manifest's most important field is the one DIRECTIVE §8.12 does not obviously name.** "What was omitted"
must be read as **which typed constraints were dropped**, because that is the class that dies in transfer
(R2 F-04, §8). M1 makes `ConstraintSet` membership a required, separately-reported section of every manifest.

**A limit M1 states rather than discovers.** **SOURCE CLAIM:** the rule that the server records actual
delivered inputs is satisfiable for the loader's own server and **is not satisfiable across the provider
boundary**, because provider-side context editing happens after the loader has handed off and reports only
aggregate counts (R1 TC-27, F-02). No standard in the path carries version, trust level, omission,
summarization or possible loss (R1 F-21, AG-02). The available remedy is narrow and costs one field read per
response: reconcile the provider's reported edits against the manifest and treat any unaccounted edit as a
**manifest defect**, not as housekeeping (R1 useful mechanism 2, MG-07). M1 adopts it and records the residual.

### 4.3 What an executor returns

An `AttemptReport` carrying typed outputs, partial-state flags, exact intent and criteria, warnings, amounts
with units, unknowns, contradictions, source and omission refs, remaining duties, pending effects, resources
used and next action (`05` §5). A summary is an additional derivative beside the canonical `Continuation`,
never its replacement. The receiver checks critical predicates against originals before acting.

**Progress is not heartbeat.** C02 checks meaningful progress separately: accepted output, a resolved
predicate, or a tested hypothesis with an honest negative result (CP-99). Rework, rejected attempts and
abandoned outputs stay in the denominator — which is the only denominator rule in this package and has never
been run.

### 4.4 Consultation versus handoff

**DESIGN PROPOSAL.** Default: **consultation**. The obligation-holder stays in the turn, sends a
`ConsultationRequest`, receives an `AttemptReport`, and remains accountable throughout. There is no compressed
artifact for a duty to fall out of.

**Handoff** is permitted only when the receiver must own the remainder — a different mandate, a different
professional standing, a different consequence authority — and requires a `HandoffAcceptance` with the
`ConstraintSet` restated by the receiver in typed form before the giver's accountability ends.

**INFERENCE:** combining the vendor's own distinction (R2 F-17) with the measured loss profile (R2 F-04), a
handoff is precisely the construct that discards boundary metadata. For work carrying obligations the evidence
points at consultation. The choice is this candidate's; the evidence is the lane's.

### 4.5 Continuation across a capacity reset — mandatory, not exceptional

**SOURCE CLAIM + INFERENCE, and this reframes the whole fixture set.** A native job caps at one launch and a
≤360-second network window (`07` §5, CP-167). **A six-hour single context cannot run.** Therefore continuation
across launches is mandatory in *every* arm, including a single-executor arm and including B0, and the
boundary-metadata loss measured in R2 F-04 is a cost this system pays even with exactly one agent (R2 F-18,
FAL-02).

M1's consequence: **the continuation boundary is held to the same discipline as an inter-agent handoff.** Same
`ConstraintSet` schema, same manifest, same critical-field recheck. Otherwise the system has one unguarded
boundary it does not call a boundary (R2 §9 Q2).

What a resumed attempt may trust: the portable `Continuation` and the loader's manifest. What it may **not**
trust: a provider-resumed opaque session, because the provider may have edited it and reports only a count
(R1 §8, F-02); and any pre-gap model verdict, which is stale in the same class as a pre-gap source fact
(R7 §8, F7). What it must re-derive: every critical field, by direct probe, never by re-reading the summary
(CP-142). How an already-released effect is detected: by the `EffectIdentity` record on the effect, not by
state in the shared record (R1 §8).

---

## 5. Information flows and memory model

### 5.1 The shared record, precisely

**DESIGN PROPOSAL.** "One shared source of truth" is implemented as **one authority per field, with delivery
narrowed per attempt**. Not one store. Not one schema. Concretely, the five constituents the founder names —
goals, current decisions, canonical files, verified knowledge, next actions — map to
`Goal`/`IntentVersion`, `DecisionRecord`, `ArtifactVersion`, `KnowledgeEntry`, and `NextActionView`, each with
a declared `FieldAuthority`.

**They are not sufficient, and the missing constituent is the dominant measured failure.** **SOURCE CLAIM:**
authorization and recipient scope — who may see and receive a given fact — is outside the five and is where
this fails worst (R1 TC-14, F-14, F-15, F-16). Three further constituents are supported by evidence rather
than preference: temporal validity separating when a fact entered the record from when it applies; explicit
contradiction state rather than a resolved winner (`ContradictionSet`, corroborated by a >60% override rate
when a wrong retrieved fact meets correct prior knowledge, R1 F-11); and surviving obligations that outlive the
case carrying them. CP-124 already assigns **six** memory jobs where the thesis names five constituents, so the
package is ahead of the thesis here and M1 does not revise toward it.

### 5.2 Permission-filtered projections versus a company-wide view

**DESIGN PROPOSAL.** There is no company-wide view for executors. Each attempt receives a narrowed delivery.
Peers are visible only through `Projection`s under a `ProjectionGrant`.

**Two measured reasons, pulling the same way.** A larger authoritative view makes every reader measurably
worse: performance grows increasingly unreliable as input length grows with complexity held constant, and even
a single distractor reduces it (R8 W-3, R1 F-06). And filtering **by the model, after material is in the
window**, fails at 15.8–50.9% on current frontier models, with the source stating explicitly that scaling does
not fix it (R1 F-14). **Therefore the filter is in the loader, never in an instruction.**

**One measured reason pulling the other way, retained rather than resolved.** The share-everything position
holds that actions carry implicit decisions and conflicting decisions carry bad results (R1 F-19, R8 B-2,
D-03). It is folklore by this round's rules — widely propagated, no published measurement — but its mechanism
is real. M1's reconciliation is not a compromise: **narrow the delivery, and type the constraints**, so the
decisions that would otherwise conflict travel as `ConstraintSet` members rather than as ambient context. The
quantity neither side has measured — how much load-bearing content survives narrowing, against how much
accuracy is lost carrying it all — is named as the discriminator and is not claimed to be answered (D-03).

### 5.3 Contamination and freshness

**DESIGN PROPOSAL, and the two obvious defences are rejected on measurement.**

- **Rejected: write-path content screening as the defence against false facts.** It detects instructions, not
  falsehoods. A poisoning attack carrying no instruction, no override and no role manipulation **passed a
  four-stage screen 360 times out of 360**, while the same screen caught indirect prompt injection at 0.832
  recall. At 1.2% of the corpus it took accuracy from 0.850 to 0.300 (R1 F-10, X04).
- **Rejected: provenance or trust-weighted ranking as the primary defence.** At its shipped weight it was
  statistically indistinguishable from no defence (p=0.80); at the weight that made it effective it took
  accuracy from 0.8583 to 0.0417 and evidence recall to **exactly zero** (R1 F-10).

**What M1 uses instead.** The cheapest observation that can discriminate, out of band: actual destination
state, a deterministic counterexample, original customer evidence, or a scoped professional assessment
(`06` §7). Plus the correction discipline: supersession as an operation rather than an append, followed by an
**understanding check** — a new bounded case or a direct critical-field check — because storing the correction
alone is insufficient (CP-142). **SOURCE CLAIM:** it is the one specified mechanism in this area that the
evidence does not undermine, and it is untested anywhere (R1 TC-42).

**Paired clean case, everywhere.** Every filtering, trust and refusal mechanism is accepted only on a paired
adverse **and** benign result measured in the same session. **SOURCE CLAIM:** every filtering source in the
corpus measures leakage and none measures correct work refused; the extreme case took evidence recall to zero
(X17, R1 §9.1, AG-15). A design accepted on leakage alone will be tuned into uselessness after the first
incident.

**Freshness** is a use predicate or an explicit warning, never a popularity bonus; repeated retrieval never
renews verification (`06` §3). Selection over a growing library degrades as a **phase transition** driven by
semantic confusability rather than count — above 90% below roughly 20–30 candidates, ~20% at 200, with the
half-accuracy point fitted at 83.5–91.8 (R6 F3, AG-06). So M1 caps the eligible candidate set by deterministic
eligibility first (`05` §8) and treats near-duplicate authoring as the thing to prevent, not library size.

---

## 6. Evidence · Authority · User · Failure · Self-improvement

### 6.1 Evidence model

**DESIGN PROPOSAL, in a fixed order of preference.**

1. **A deterministic oracle before any model checker.** The only source of independence with zero model
   correlation, because no model is in the loop (R7 M1). Where an objectively checkable ground truth exists,
   model judges are near chance against it (R7 F5).
2. **A separated-context checker**, whose *delivered* inputs are verified by the loader to be the artifact and
   the acceptance criteria — not asserted in a role name (R7 M2, CP-128). **SOURCE CLAIM:** a fresh-context
   reviewer reached 28.6% F1 against 23.8% for a context-carrying subagent (p=0.004) and 24.6% for self-review
   (p=0.008); reviewing twice in the same session did **not** beat once (p=0.11). That last control is what
   makes the first result mean something: separation moves the number, extra compute does not (R7 F9).
3. **Union aggregation of findings. No vote, no mean, no aggregate score.** **SOURCE CLAIM:** across eleven
   evaluator studies, any-two agreement runs 5–65%, 46% of problems are found by exactly one evaluator, one
   evaluator recovers 48 of 93, and marginal gains are +42%/+20%/+13% for evaluators two, three and four; on
   *severity*, any-two agreement is 20–28% and not one problem was unanimously judged severe (R7 F15, M5, R4).
4. **Chance-corrected reporting of every agreement figure** (R7 F3, M7).
5. **Abstention as a first-class verdict** — `inconclusive` is a completed assessment that cannot establish
   its predicate (`06` §6, R7 M9).

**What independence can and cannot mean here, stated in the candidate's own words, because F-4 requires it.**
Independence of *influence* is achievable and measurable by procedure. Independence of *error* is **not**
achievable within one model family for the self-consistent class, and no procedure converts one into the
other: those errors are a property of the family rather than of the draw, so three same-family checkers return
unanimous agreement on a family-shaped blind spot every time, and the unanimity is the failure rather than the
assurance (R7 F13, TC-37, FAL-08). Removing author labels does not reach it either, because self-preference
tracks the familiarity of the text rather than the attribution (R7 F1, R5). Buying a second frontier family
buys the *most correlated* available second opinion, because error correlation rises with capability (R7 F12,
D-13).

**Named residual.** M1 discloses this as an accepted limitation with a published magnitude, not as a
disclaimer, and routes the decision of whether to buy a disjoint-family panel to the founder as a decision
packet (D-13, which R7 explicitly declines to decide).

**Grade the path as well as the product.** **SOURCE CLAIM, contradicting vendor guidance for this system
specifically:** a benchmark that compares final state acknowledges that a passing episode can omit a required
user confirmation, so in a system whose fixed boundaries include who may release an effect, **the path
contains the obligation** (R7 F20, D-09).

### 6.2 Authority model

Specified in §3.4. Three additions.

**Least privilege is computable here, and the protocol's general-purpose fallback does not apply.**
**SOURCE CLAIM:** MCP's security guidance requires a progressive least-privilege scope model and warns against
omnibus scopes, while the authorization specification's fallback is to request **all** supported scopes when no
challenge is present — defended on the grounds that general-purpose clients lack the domain knowledge to
choose (R4 F11). **This system has a typed work order, a declared effect class and an acceptance owner.** The
defence assumes away exactly what M1 has, so M1 refuses the fallback.

**Sandboxing is containment under an authority decision, never a substitute for one.** Every vendor whose
isolation mechanism was read says in its own documentation that the mechanism is not a boundary (R4 F12,
AG-08). Executor separation in the runtime this system plans to launch does **not** by itself separate
credentials, environment, sandbox configuration or process (R4 F5, D-02).

**The load-bearing unknown, carried rather than hidden.** **UNKNOWN:** every attenuation mechanism in the
field assumes a credential at the boundary that can be narrowed, and a subscription coding-agent session's
authority is settings files and hook decisions, not a bearer token. If there is nothing to attenuate, the
constraint must be enforced by **mediation** — a protected connector process holding the broad credential and
issuing the model an invocation capability with exact job, action, account, destination and amount bounds,
which `07` §1 already specifies. M1 assumes mediation and names attenuation as the optimisation available if a
credential turns out to exist (R4 §9 Q1).

### 6.3 User model

**DESIGN PROPOSAL.** The founder is a designed participant, not a fallback.

- **Designed return.** Selected work, evidence, customer material and decisions are returned to him even when
  the system could process them automatically (DIRECTIVE §1.6). **UNKNOWN:** no dose is validated anywhere,
  and the delayed unfamiliar-transfer test that would calibrate it is unexecuted in the literature
  (R1 TC-29, X07, AG-10). M1 records this as a (c)-class empirical hypothesis with a protocol, a baseline, a
  unit, a stopping rule and an owner — not as a claim.
- **The re-entry brief carries what was omitted and what was contested, not only what was decided.**
  **SOURCE CLAIM:** in hidden-profile tasks, agents failed to surface private information contradicting group
  consensus (R1 F-17), so a next-action view everyone trusts suppresses the dissenting fact rather than
  surfacing it. A brief that reports only decisions reproduces that failure for the human.
- **The founder is an instrument with an unmeasured error rate, and M1 says so.** Human evaluators agree
  5–65%, and 20–28% on severity (R7 F15, X19). His value is not accuracy; it is that his errors are
  **uncorrelated with the model family's**, which makes him the only cross-family error source this system
  has (R7 §8 F-6). His absence removes it, which is a design fact with consequences in F-6.
- **Attendance, confidence and agreement are explicitly not competence** (`06` §6).

### 6.4 Failure model

**DESIGN PROPOSAL, mapped to W7's probe.**

| Failure | M1's mechanism |
|---|---|
| Worker killed mid-attempt after a partial external effect | Expired lease fences writes and **does not prove no external effect** (CP-100). Recovery reconciles actual `OperationStatus` before repeating any business action |
| Resumption duplicating an effect | `EffectIdentity` is allocated before release and required at the effect. Duplicate message identity returns its recorded result; changed content under that identity conflicts (`05` §5) |
| Two attempts on one work order | **Stated winner: the attempt holding the current lease epoch.** The loser's output survives as attributable evidence and is never silently discarded; its external effects are reconciled, not assumed absent |
| Correlated duplication by identical models | `EffectIdentity` plus reserved name ranges plus a rate-anomaly monitor. **This is the failure a shared view does not fix** (R1 F-17) |
| A human approval step duplicating the effect it approved | **SOURCE CLAIM:** on resume after an interrupt in one shipped engine, the entire node restarts from the beginning, so side effects before the interrupt re-execute (R3 F29, F30). M1 requires every pre-approval side effect to be idempotent and every approval resume to re-read the effect record first |
| Silent capacity shedding | Any router with bounded per-destination capacity names an overflow destination and **counts** overflows. For tokens a pass-through is benign; for an obligation it is a silent drop (R5-19) |
| Work resting where nobody polls | Named undeliverable destination, retention **longer** than the source's, and an alarm on arrival with a named reader (R5-10). A named destination with no reader is the original failure with better records |
| Escalation exhausting its ladder | The end of the ladder is `assigned and silent`, which is not an end state (R5-12). M1 makes it an explicit `parked_awaiting_principal` state with a deadline and a standing owner |
| Done with no resolution | Forbidden. `HandoffAcceptance.interval_state` must reach `accepted` with a reason; `declared_done` discharges nothing (R5-13, X18) |
| Poisoned skill or corrupted procedure | Provenance re-checked **at use**, not at install: content-hash pinning is the only mitigation in the corpus that survives a rug pull (R3 F47, F48). Required skill tests include a stale example and an injected instruction (`05` §8) |
| Delegation depth or fan-out runaway | Ceiling owned by C01, checkpointed at spawn, and spawning costs a permission check (R4 §9 Q3) |
| A tool result containing an instruction | Tool output is untrusted data by construction; retrieved content cannot outrank authenticated authority (`05` §4). **SOURCE CLAIM:** models resolve instruction-hierarchy conflicts at 48% accuracy in the best open case measured, so this cannot be enforced by the model reading the instructions (R6 F12) |

### 6.5 Self-improvement model

**DESIGN PROPOSAL.** Improvement is another bounded case with problem evidence, alternatives **including
removal**, exact change, affected contracts, benefit/harm hypothesis, test budget, rollout, independent
observation and rollback (`02` §5). Three additions specific to this candidate.

- **Every mechanism carries a removal criterion, recorded in `ExistenceJustification.removal_criterion` for
  executors and in the mechanism's own contract otherwise.** W9 makes a mechanism with no removal criterion a
  failure condition, and the field supplies the exemplar: the group that established that interface design
  matters ships a 100-line successor that deletes it and scores competitively, so a scaffold's contribution is
  a function of the generation that motivated it (R3 F38, F39, X10).
- **The profile-convergence probe, which is M1's own negative control against itself.** Run for a month and
  count distinct instantiated executor profiles. **If the same six shapes recur, this candidate has a roster
  it discovered instead of declared**, and negative control 8 should catch it (R8 W-4, MG-11). M1 declares in
  advance what it will do: convert the recurring shapes into named `AgentTemplate` versions with explicit
  charters and reopen the persistence question honestly, rather than keeping the vocabulary and losing the
  property.
- **Deterministic displacement is the only lever that reduces subscription consumption without reducing work,
  and it belongs to every candidate.** A candidate that adds executors while leaving deterministic work in
  model calls has paid for the wrong thing twice (R8 B-7, CP-69, CP-101).

---

## 7. The six fixtures

Each is worked step by step, naming the records and the authority at every step. **These are specified
behaviours, not executed results.**

### F-1 · An unknown kind of job appears mid-build

**Required useful outcome.** A supplier's contract obliges a data-deletion procedure nobody planned.

1. **Arrival.** The contract text arrives through an admitted integration. `AdmissionRecord` opens with
   `origin`, `provenance_class = counterparty_document`, owner = the triage responsibility holder. Opening it
   grants no authority to act (R5-05).
2. **Typing.** The typer returns `no_match` — a *searched* answer, not an unfinished search. The confusion
   matrix records it. No existing capability contract is stretched to fit, because
   `typed_into_nearest_existing_kind` is a recorded failure, not a success (R5-15, TC-40).
3. **Admission.** C02 admits a **bounded discriminator** first, not a large commitment (`05` §2): one
   `WorkOrder` whose outcome is "state exactly what this clause obliges, by when, and who must perform it",
   budget finite, acceptance owner named.
4. **Staffing.** The discriminator needs no new capability: a general executor plus the deletion-scope
   procedure. `ExistenceJustification` records reason **R3 consequence class** — reading a counterparty
   obligation is `C0`, and any outward acknowledgement to the supplier is `C3` — so the reading executor is
   created with no outward-effect grant at all. Unit = `effect_class`. Test = the effect classes differ.
   Alternative considered = one executor holding both; rejected because the union holder can release the
   acknowledgement.
5. **Capability creation.** The discriminator concludes a recurring deletion duty exists. This is a
   **capability gap**, and M1 does not claim zero edits here: a `CapabilityProposal` is raised by the
   maintenance custodian, approved by the legitimate capability owner, and evaluated by C06 (CP-77, R5 TC-19).
   The acceptance owner of its first outcome is named in the proposal.
6. **Acceptance owner.** Resolved by the ordered resolver: no promise sponsor exists, no service mandate
   covers supplier data obligations, so custody lands on the designated maintenance/discovery custodian with
   `custody_tie_break_reason` recorded. The terminal element is a standing human role, because the harm class
   is legal (§3.3).
7. **Constraints across every boundary.** The deletion deadline, the scope exclusion ("backups retained under
   a lawful basis"), and the promise to confirm in writing travel as typed `ConstraintSet` members — not as
   prose in a summary, which is where they die (R2 F-04).

**Adverse variation, part one: the same job arrives as a malformed, partly false report from an untrusted
channel.** `provenance_class = untrusted_external`. `ExistenceJustification` reason **R2 input provenance**
creates a reading executor whose input set is the untrusted document and which holds **no** effect-bearing
grant, so no downstream effect is reachable from that input (R2 F-09). **This is the poisoning case, not the
injection case:** the report may contain no instruction at all, and write-path screening refused 0 of 360 such
items (R1 F-10, R1 §8 F-1). Detection is therefore out of band: the clause is checked against the executed
contract of record, which is a `FieldAuthority`-governed artifact, before anything is admitted. No effect is
released on the strength of the report alone — the C04 boundary already forbids it.

**Adverse variation, part two: a genuinely spurious job.** Refused. `AdmissionRecord.disposition = refused`
with a reason, an owner, and a record that persists (R5-14). The refusal is a terminal state of the same
object, so the spurious job leaves a trace. If the refusal is communicated outward it is an outward effect and
goes through C04, and **someone accepts that the refusal was correct** (R5 §9 Q3). Negative control 9 —
a router that admits everything — fails a candidate that skips this, and M1's admission rule is explicitly
paired: low threshold for *reporting*, explicit prohibition on self-dispatch, recorded refusal for *acting*.

**No human edited the system** for admission, typing or acceptance-owner assignment. **A human approved the
new capability**, and M1 states that rather than claiming otherwise.

### F-2 · Demand at 4×

**Required useful outcome.** Four ventures' worth of ordinary work at matched scope, with 1× and 2× measured
under the same controls.

**M1's honest disposition first.** **This fixture is not executable as specified at CP1**, which admits one
native job and one external job concurrently (CP-159, R2 F-19). The coordination-cost-per-unit measurement is
**owed and blocked on a reviewed `CapacityPlan` revision**. Reporting it as passed on a projection would be
negative control 10 in a different costume (R2 §8). M1 records it as blocked and names the unblocking act.

**What M1 can specify now.**

1. **Units, separately, never summed:** native job launches, provider quota buckets, wall-clock occupancy,
   money, and founder attention (`07` §6, DIRECTIVE §8.21). **No token counts as a capacity model** — negative
   control 7.
2. **The denominator does not exist and M1 says so.** **SOURCE CLAIM:** the provider no longer publishes an
   absolute allowance, so every capacity figure available to this round is a ratio between arms and never a
   fraction of the week (R8 W-6, MG-03). "This design consumes 40% of the allowance" is not a sentence anyone
   here can write.
3. **The economics invert the usual reading.** **SOURCE CLAIM + INFERENCE:** under subscription capacity,
   architecture does not change what the company spends. It changes the date on which work stops. And unused
   allowance is **destroyed, not banked** — the reset window fires whether consumed or not — so a conservative
   reservation policy must be priced as waste rather than thrift (R8 §3).
4. **Shedding is an authority act before it is a capacity act.** C02 proposes, C01 authorises, and a
   `ShedDecision` records what was shed, whose obligations moved where, what the founder saw, and the
   re-admission condition. **Shed work remains owned**; an unshedded owner is the only thing that
   distinguishes shedding from dropping (R5 §8).
5. **What is shed, in order:** discretionary exploration, then ordinary creation and research, then
   maintenance and evaluation. **Never the due-service minimum, the grievance share, or the protected checks.**
   `06` §8 already states the rule — protected checks and due service cannot be silently starved to improve
   scores — and the measurable tell is a **rising pass rate as load rises**, which M1 registers as an alert
   rather than leaving as a discovery (R7 §8).

**Adverse variation: two providers' allowances consumed at 3×; one lane must be shed.** The `ShedDecision`
names the lane, the authority, and the obligations that moved. The founder sees the shed lane, the obligations
that moved with it, and the date the allowance resets — not a percentage, because no denominator exists.

**Added coordination cost per unit of work.** **UNKNOWN.** No published measurement of coordination cost at
concurrency 2 exists (R2 G-5, MG-20). M1 specifies the measurement: coordination minutes and transmitted
context bytes counted **separately** from work performed, at the concurrency actually available.

**One mechanism M1 must carry because it is invisible to token arithmetic.** **SOURCE CLAIM:** a parallel
executor's prompt cache expires in five minutes against the main session's hour on a subscription, so
splitting costs more scarce allowance than the token count predicts (R8 W-2). This is charged to the parallel
arm in `ExistenceJustification.expected_cost`.

### F-3 · A task needing three distinct tool permissions

**Required useful outcome.** Payment read, customer record write, outbound message send — completed with least
privilege.

1. **Composition rule: minted, narrowly, per attempt. Never borrowed, and never refused by default.** The
   effective set is the intersection of the standing `Grant` with its `ConsequenceVector` ceiling and the
   attempt's `OperationIntent.grant_refs`, **computed at release rather than at assignment** (R4 §8.1). This
   answers (d)-class example 6 with one of its three options and says which.
2. **Three executors, one reason each.** Payment read and customer write are `C1`/`C2`; outbound send is `C3`.
   `ExistenceJustification` reason **R3 consequence class** for the split between the first two and the third,
   and reason **R1 distinct permission scope** for keeping payment read out of the writer. Each holds one
   scope. `attributable identity` is mandatory for all three and is not counted as a reason.
3. **Enforcement at the effect.** A `PreToolUse`-class deterministic policy check, keyed on the executor's
   identity and the work order's grant set, returns deny for anything outside it, under a deny-first
   non-overridable precedence (R4 F6, F7). **This is buildable today in the named runtime and requires no
   model cooperation** — it is R4's most actionable finding.
4. **Grant arrival is attested, not assumed.** Each executor's first effect writes a
   `GrantDeliveryReceipt`. An executor whose grant did not arrive **fails loudly** rather than silently doing
   less (R3 F59, X16).
5. **The record of which identity performed which effect** is produced deterministically from the enforcement
   point's own identity fields, not reconstructed from a narrative, and the delegation chain is represented as
   a nested actor claim (R4 §8.1, S7).

**Adverse variation, part one: one permission is revoked mid-attempt.** Attenuation alone cannot satisfy this.
No attenuating credential format in the field defines a revocation cascade (R4 F3). M1 uses the **live epoch
re-read at release**: `grant_epoch` is re-read in the same serial transaction that authorises the effect, and
a release that passed a stale epoch is detectable afterwards, which is the difference between an incident and
a mystery.

**Adverse variation, part two: a helper is spawned that must not receive all three.** The runtime's default is
against us and M1 states it. **SOURCE CLAIM:** tool inheritance is total unless a file says otherwise; the
delegator cannot attenuate at the call; an escalated permission mode propagates downward and the child's
stricter setting is discarded; sandboxed subprocesses inherit the parent environment including credentials
(R4 F5, FAL-03, D-01). So M1 does not inherit: the helper is created with an explicit
`ExistenceJustification` naming its one scope, the `derived ⊆ parent` predicate is checked at the
enforcement point, and the child's declared mode is compared to its effective mode at spawn — **any divergence
is a finding** (R4 failure case 3).

**One competing consideration M1 absorbs rather than ignores.** Splitting creates an inter-executor channel,
and one framework study names inherited memory and stale post-spawn state as the mechanism by which one
compromise crosses an agent boundary (R4 F8). A split design can move blast radius from "one holder has three
permissions" to "three holders share a poisoned channel" and score better on the stated metric while being no
safer. **M1's measure therefore counts released operations *and* records whether the release was reached
through a `WorkMessage`**, so the two failure shapes are distinguishable. The honest expected answer is
"depends where the injection lands", not a win for either arm.

### F-4 · A verification the producer must not influence

**Required useful outcome.** An artifact is accepted on evidence, by someone with no stake in it.

1. **Deterministic oracle first.** Any acceptance criterion expressible as a predicate over destination state,
   a schema, a test, or an exact-field comparison runs before any model is dispatched (R7 M1). No model
   judgement is purchased where a deterministic answer exists.
2. **The checker's delivered inputs are verified, not declared.** The loader records actual delivered inputs
   and the caller's claimed read list is not trusted (CP-128). The checker receives the artifact, the
   acceptance criteria, and the `ConstraintSet`. **It does not receive the producer's rationale, the
   producer's preferred conclusion, or any shared-state record the producer wrote.**
3. **The third channel, which W5's two arms do not currently probe.** **SOURCE CLAIM:** family relatedness
   contaminates judgement with no self-authorship at all, and the contamination is subtler than length or
   egocentric bias (R7 F2). **The shared source of truth is itself a preference-leakage channel**: a canonical
   record written by the producer and read by the checker carries the producer's framing without anyone
   passing a rationale, and every provenance check still passes (R7 failure cases, R7 §9). M1 therefore adds a
   third arm — checker reads the shared record versus checker reads only the artifact and criteria — and
   treats it as the probe that decides whether §5's design is safe for §6.1's.
4. **Independence is split in the candidate's own words**, as F-4 demands: influence, yes, by procedure and
   measurably; error, no, within one family for the self-consistent class (R7 F13, TC-37).
5. **Acceptance authority.** The checker produces findings. C06 owns the judgment and the required sponsor
   acceptance permits the accepted state (`05` §3). A union of findings is an input to a decision, never a
   verdict, and never a mean or a vote (R7 M5).

**Adverse variation, part one: the producer's rationale and preferred conclusion are made available.** Two
distinct attack surfaces, and M1 must close both or it has closed half the door: anchoring through the
**reasoning** (framing moved detection by up to 93.5 points, R7 F8) and sycophancy through the **preferred
conclusion** (R7 F11). A candidate that blinds the rationale and leaks the conclusion through a status field
or a verdict draft has done nothing.

**Adverse variation, part two: a known defect is planted.** The checker must fail it. **And the reported
quantity is a false-positive rate, not a verdict** (R2 F-14, R7 M3).

**AM-01's paired clean case, run in the same session.** An artifact with **no** defect is judged by the same
checker under the same procedure, and the **refusal rate on the clean case is reported beside the detection
rate on the defective one**. Both numbers or neither. **SOURCE CLAIM, and this is why the amendment exists:**
under neutral framing, measured false-positive rates on already-patched files run 68.4–96.8%, so an unpaired
control cannot distinguish a working checker from one that refuses everything, and refusing everything is the
*normal* state of the closest published analogue (R7 F8, FAL-09, AG-15). `InstrumentCalibration` stores both.

**What the planted-defect control does and does not license.** It detects an always-pass checker, which is
exactly what protocol §4 control 3 asks. **It does not estimate a real-defect detection rate**, and both sides
of a preserved disagreement about seeded faults caution against that reading (R7 F19, D-08). A candidate
reporting "caught 9 of 10 planted defects" as a real-world rate has committed the error both papers warn about.

**Two properties M1 refuses.** Debate rounds, because debate's measured advantage sits where the judge lacks
access the debaters have, and F-4's checker holds the artifact (R7 R3). And a same-family panel justified by
jury results whose stated mechanism is **disjoint** families (R7 F14, R2).

### F-5 · A handoff across a capacity reset

**Required useful outcome.** Work stops at a weekly limit and resumes days later, in a new session with no
conversational memory, and completes correctly.

1. **This is not an edge case in this system.** Every job longer than six minutes crosses a launch boundary
   (R2 F-18). The continuation protocol is the same protocol as the handoff protocol, and that is deliberate.
2. **At the stop.** C02 prepares a `Continuation` under its reserved closing allowance: typed outputs, partial
   state, the full `ConstraintSet`, unresolved effects, remaining duties, next action, and the manifest with
   its omissions section. Expired leases fence writes and do not prove no external effect (CP-100).
3. **What the resumed attempt may trust:** the portable `Continuation` and the loader's manifest. **What it
   may not:** a provider-resumed opaque session (the provider may have edited it and reports only a count,
   R1 F-02); a pre-gap model verdict (stale by drift, R7 F7); and a summary (a derivative beside the
   canonical record, never its replacement).
4. **What it must re-derive:** every critical field, by direct probe against the `FieldAuthority` value, before
   any consequential action.
5. **Acceptance of the resumed work** belongs to the same acceptance owner as before the gap. The gap changes
   the evidence's freshness, not the ownership. If the acceptance owner's mandate lapsed during the gap, the
   ordered resolver runs again and records why.
6. **Still queued is a normal state.** Work persisting in a queue while nothing can take it is not evidence of
   loss (R5-08). The reset-specific hazard is a holding destination whose retention is **shorter** than the
   interruption, which converts parked work into lost work — hence the retention rule in §6.4 (R5-10).

**Adverse variation, part one: the pre-reset summary omits a decision.** Detected by the manifest's omissions
section and by a recall probe on `ConstraintSet` members before the next consequential action — **not** by
reading the summary. **SOURCE CLAIM:** compaction loss is deterministic and documented, and the model is not
told what was lost; omission in long-form summarization is systematic and positional; and no model rater
correlated strongly with human faithfulness annotation, worst on exactly the errors that matter (R1 F-01,
F-05). So a model judge is disqualified as the instrument for this check, and deterministic exact-field
comparison does it.

**Adverse variation, part two: a source fact changed during the gap.** Detected by the critical-field probe
against the `FieldAuthority` value and its `ValidityEpoch`, never by re-reading the stored context. The
correction's **understanding check** then requires a new bounded case, because storing the correction alone is
insufficient (CP-142) — and the reason it is required is measured: a bounded self-managed memory loses 19 and
15 accuracy points against full context on knowledge-update tasks, and a bigger model does not close the gap
(R1 F-04).

**Adverse variation, part three: one external effect was already released.** Detected by the `EffectIdentity`
record at the effect, reconciled through actual `OperationStatus` before any business action repeats. Not by
state in the shared record, which is exactly the thing that may be stale.

### F-6 · The founder absent for a week

**Required useful outcome.** Authorized work continues; nothing irreversible is done in his name.

1. **The queue rule.** Work whose prerequisites are all inside standing mandates proceeds, with available
   context and tools, finite budgets, a named acceptance owner and a stated no-answer behaviour — **all
   established before starting**, not discovered during the absence (CP-104). Everything else parks.
2. **What parks, explicitly:** anything needing a founder value judgement, anything at a consequence class
   whose supervision requires him, and any capability creation. Parking is a state with a deadline and an
   owner, not a stall — a typed request node rather than a blocked process (R3 F27).
3. **Latest-responsible-decision-time behaviour.** A decision arriving day one with a deadline day four does
   not wait for him. The `NextActionView` is re-issued each operating period by its named author and approved
   by its named approver, with the explicit rule that planning is **not** delayed in anticipation of
   information that has not arrived (R5-23). At the latest responsible time, the recorded bounded fallback
   activates: a substitute route, a narrower action, or a parked state with a reason. **No answer never means
   approval** (`05` §5).
4. **The end of the escalation ladder.** When the only remaining target is the absent founder, the item enters
   `parked_awaiting_principal` with a deadline and a standing owner who holds actual authority to contain but
   not to decide. Assigned-and-silent is refused as an end state (R5-12).
5. **The day-five incident.** Incident response runs under its own mandate with reserved capacity (`07` §6).
   Containment is authorised; new liabilities are not. Nothing irreversible is done in his name: the
   irreversible classes — migration, outward commitment, spend above the standing ceiling — are the ones that
   park by construction.
6. **Approvals granted during the absence carry an expiry**, because a week of absence is a week in which the
   approval ratchet cannot be corrected by the only person who can correct it (R4 §8.3).
7. **The re-entry brief restores competence, not only awareness.** It carries: what was decided and by whom;
   **what was omitted**; **what was contested and by whom**; what was refused and why; what was shed and under
   whose authority; the obligations that moved; and the decisions still waiting with their new deadlines. The
   omissions-and-contests section is load-bearing: a trusted shared view suppresses the dissenting fact
   (R1 F-17), and a brief that reports consensus reproduces that failure for the human.
8. **A design fact M1 states plainly.** His absence removes the system's only cross-family error source
   (R7 §8 F-6). So during the absence, M1 **does not accept** any artifact whose acceptance rests solely on a
   same-family model judgement at a consequence class above `C2`. That work parks rather than passing.

---

## 8. Capability binding

**DESIGN PROPOSAL.** The 46 ids in [`capability-requirements.json`](../../../coverage/capability-requirements.json)
are requirements, not departments (`02` §6). M1's mechanisms bind to them through the production rule of
`02` §3 — deterministic computation, durable procedure, bounded model work, capable people, qualified
professionals — plus the six reasons of §4.1. **Nothing below claims implementation.**

| CAP ids | Planned owner | Production mode in M1 | Which M1 mechanism carries it | Acceptance owner |
|---|---|---|---|---|
| CAP-01, 02, 06, 33, 38 | S1-C01 | Capable people, with bounded model preparation | `FieldAuthority` over intent and decisions; `NextActionView` approval; founder-values packets | Founder |
| CAP-03, 04, 05, 07, 29 | S1-C03 | Bounded model work + `SkillVersion` | `ConstraintSet` carries sampling exclusions; `Projection` governs cross-venture reuse; R5 parallel work is the only reason that can apply here, and is dormant at CP1 | Outcome sponsor, evidence via C06 |
| CAP-08, 09, 13 | S1-C03 | Bounded model work; **taste is the founder's** | Consequence-class split (R3) between drafting and publishing | Founder for taste; sponsor for fit |
| CAP-10, 11 | S1-C03 / S1-C06 | Bounded model work + deterministic oracle | §6.1's oracle-first order; R6 independent verification as a separate context and input set | C06 with sponsor acceptance |
| CAP-12, 35, 45 | S1-C02 | Durable procedure | `ShedDecision`; capacity units of `07` §6; overflow destination and count | C01 for shed; C02 for admission |
| CAP-14, 15, 16, 25 | S1-C03 / S1-C07 | Capable people for relationships; model drafting | Every outward artifact is `C3`; R3 forces a separate releasing identity; `ParameterAuthority` supplies recipient | C07; the sponsor accepts the outcome |
| **CAP-17 Support** | S1-C03 | Model + durable procedure; **remedy release is C04** | See below | **The promise sponsor accepts; C04 releases** |
| CAP-18, 19, 20, 24 | S1-C03 / S1-C04 | Deterministic + qualified professionals | `ConsequenceVector` ceiling; payee from verified payee source; professional determination is not substitutable | C04 for release; professional for determination |
| CAP-21, 22, 40, 41 | S1-C07 | Qualified professionals | Preparation of a packet is preparatory work; sending is not filing (`02` §1) | Qualified professional |
| CAP-23, 31, 37 | S1-C08 | Deterministic + capable people | Live epoch re-read; `EffectIdentity`; recovery fences descendants | C08 |
| CAP-26, 27 | S1-C07 | Capable people | Applicant and contractor burden counted (`02` §6) | C07 |
| CAP-28, 44 | S1-C06 / S1-C09 | Deterministic | Denominator rule CP-99; `AccountReconstruction` | C06 |
| CAP-30 | S1-C03 | Actual performers | Unavailable logistics blocks the dependent promise | Sponsor, on observed delivery |
| CAP-32 | S1-C05 | Durable procedure | `FieldAuthority`, `ContradictionSet`, understanding check | Knowledge custodian; C06 for scope |
| CAP-34, 46 | S1-C03 / S1-C06 | Bounded case with removal as an alternative | Removal criteria; profile-convergence probe | C06 |
| CAP-36, 39 | S1-C02 / S1-C07 | Durable procedure + professionals | `Mission.retired-with-residuals`; surviving duties inventoried with custodians | C07 |
| **CAP-42 Grievance** | S1-C07 | Capable people | See below | **A standing custodian independent of the disputed decision** |
| CAP-43 | S1-C07 | Designed return | §6.3; delayed unfamiliar-transfer test as a (c)-class hypothesis | Founder |

**The three questions the protocol names, answered directly.**

**Who accepts a refund (CAP-17).** The **promise sponsor** of the offer the refund arises from accepts that
the customer outcome was met; **C04 alone releases the money**. These are two acts and M1 keeps them apart: a
support executor may propose the refund with `OperationIntent`, with the amount drawn from entitlement and
terms rather than from any model-authored string, and the payee from the verified payee source (`02` §4). If
the refund fails, it **remains an owned duty** — cancelling the workflow never makes the result true (`05` §6).
A disputed remedy stays owned, and the independent grievance route survives internal ticket closure and
product retirement (`02` §6).

**Who owns a grievance from a non-customer six months after closure (CAP-42).** A **standing custodian
independent of the disputed production decision**, reachable through an intake that does not require a product
account, with proportionate verification, substantive deadlines, reasons, competent escalation and remedy
authority (`02` §7). **This is the one place where the persistent-roster steelman lands a real hit, and M1
concedes the shape of the objection:** an assignment rule produces a custodian at the moment it is asked, and
a complaint six months after closure needs a party that already existed and can be reached (R8 A-5). M1's
answer is that the custodian role is **standing and named in the closure record** — `Mission.retired-with-residuals`
requires every surviving commitment to be inventoried with an accepted custodian before retirement — while the
*executor* that does the work remains ephemeral. Standing accountability, ephemeral execution. If that
separation proves unreachable in practice, this is the finding that should reopen the persistence question.

**Who sheds a lane at 4× demand (CAP-45, fixture F-2).** C02 proposes; **C01 authorises**; a `ShedDecision`
records it; the obligations move with named custodians; the founder sees the lane, the obligations and the
reset date. A class cannot be asked, which is precisely why the decision is recorded against an authority
rather than derived from a reservation table (R8 A-4).

---

## 9. Comparators

### 9.1 Against S1.0, the current position

**What stays, unchanged and deliberately.** The production rule of `02` §3. C04 as the sole consequence
authority and C06 as independent acceptance. `AgentTemplate` as a versioned recipe with no standing and
`AgentInstance` bound to one admitted work order (CP-74). Sponsors rather than departments. Attempt-local
context with skills as versioned instructions (CP-109). CP1 concurrency (CP-159). The loader's
delivered-inputs rule (CP-128). The `SummaryLoss` and `ContextTransformation` instruments (CP-132). The
denominator rule (CP-99). The correction understanding-check (CP-142). Independence as different evidence,
method, measurement or human grounding rather than a second model (CP-153, CP-171).

**What changes.**

| # | Change | Against | Why |
|---|---|---|---|
| 1 | The existence gate becomes a **record with a unit and a decidable test**, and the reason list moves from four to six with specialized knowledge removed | CP-76, which states four reasons and drops parallel work and isolated context | CP-76 and the thesis already disagree, unremarked (R8 W-4). M1 reconciles them explicitly and applies each reason to its own unit (R2 F-20) |
| 2 | **`ConstraintSet` becomes mandatory on every boundary**, including continuation | `05` §5, which requires typed outputs and records losses without typing the constraints | Constraints survive at ~0.57 against ~0.97 for facts, and typing took leakage to 0 of 48 (R2 F-04) |
| 3 | **Consultation is the default; handoff requires `HandoffAcceptance`** | `05` §5, which treats `Delegation` plus `Continuation` as the primary shape | A handoff is the construct that discards boundary metadata (R2 F-17); no surveyed system has an acceptance-owner concept (AG-18) |
| 4 | **`FieldAuthority`** makes single-writer explicit per canonical field | CP-22, which is compatible but does not name a writer per field | (d)-class example 8: without it, "shared source of truth" means last-writer-wins (R3 F42, F44) |
| 5 | **`EffectIdentity` allocation and decorrelation** are designed alongside the shared record | Not present in S1.0 | 18 of 30 agents collided on one branch name through correlated reasoning, not divergent context (R1 F-17) |
| 6 | **`GrantDeliveryReceipt`**: arrival is observed at the effect | `02` §4 checks grants; nothing observes arrival | A grant narrowed reliably and arrived unreliably, cause unknown (R3 F59) |
| 7 | **Skill tool-granting frontmatter is stripped at load** | `05` §8's rule that a prose package cannot spend by being loaded | That rule is correct as intent and false of the named runtime (R2 F-08, R6 F7) |
| 8 | **`InstrumentCalibration` with a mandatory paired clean case** | `06` §7, which requires clean controls but does not bind them to the same session or require both numbers | AM-01; 68.4–96.8% false positives on patched files (R7 F8) |
| 9 | **`ShedDecision`** gives capacity shedding a named authority | `07` §6 reserves by class, and a class has no representative | R8 A-4 |
| 10 | **`AdmissionRecord` with refusal as a terminal state** and a three-class typing matrix | `05` §2's bounded discriminator, which does not name the refusal state | Negative control 9; R5-14, R5-15 |
| 11 | The **profile-convergence probe** is declared in advance as a self-test | Not present | Negative control 8; R8 W-4, MG-11 |

**What M1 does not change, and is asked to notice.** CP-77 keeps a human in the loop for capability creation.
M1 keeps it and therefore **does not claim TC-19** in its strong form. That is a refusal to overclaim, not a
gap.

### 9.2 Against B0, the deliberately simple baseline

**B0 is one long-context session, plus deterministic scripts, plus one shared record in version control, with
its own retrieval scripts, checklists and human review.**

**Where B0 wins, honestly, per protocol §6.**

1. **At 1× demand, plausibly everywhere.** At CP1, M1 and B0 are indistinguishable on every
   concurrency-dependent unit, because CP1 binds both (R8 economics table). §6's first B0-wins condition — B0
   matching on all six fixtures at equal founder attention and equal capacity — is **live at 1×**, and M1's
   advantage is not demonstrated there.
2. **No handoff loss, no routing error, one window a person can read.** These are real and M1 pays for each
   with records.
3. **Matched-budget evidence favours it.** **SOURCE CLAIM:** at matched reasoning-token budget across three
   model families and five multi-agent arrangements, single-agent matched or beat every variant; multi-agent
   became competitive only under heavy deliberate degradation of the single agent's context (R1 F-08, AG-04).
   Auto-generated multi-agent systems consistently underperformed a single-agent baseline at up to ten times
   the cost (R2 F-02). And on the benchmark used to sell memory architectures, the unarchitected full-context
   baseline scored **higher** than the architected system, reported by a party with no interest in saying so
   (R1 F-24).
4. **A 100-line single-tool linear agent scores competitively** on a headline benchmark, from the group that
   established that interface design matters (R3 F38, F39).

**Where the protocol's grant to B0 is falsified, and M1 does not amend the frozen protocol.**

- **FAL-01.** B0 does **not** have the lowest plausible consumption of scarce capacity. Four documented
  provider mechanisms contradict it: the full conversation is sent with every request and again with every
  tool batch; the first message after a break longer than the cache lifetime reprocesses the full context;
  compaction is itself a large request; and idle check-ins each send the full context. **B0 minimises
  launches; it does not minimise the weekly bucket, and the weekly bucket binds** (R8 B-6).
- **FAL-02.** B0's "one long-context session" is **not purchasable** under this system's own launch contract:
  a native job caps at 360 seconds, so continuation is mandatory in every arm (R2 F-18).

**These are reported as findings against a granted strength, not as a defeat of B0.** B0 keeps every other
legitimate strength. What they establish is that two of the four things B0 was granted cannot be bought here,
which narrows the comparison rather than settling it.

**Where M1 claims an advantage, with the falsifier for each.**

| Claim | Falsifier |
|---|---|
| Permission separation prevents releases a single holder would make | The three-permission fixture with the injection placed in the inter-executor channel: if the split arm's propagated releases exceed the union arm's direct releases, M1 loses (R4 TC-08) |
| Separated-context verification detects defects self-review misses | The two-arm probe with the same-session repeat control. If separate context does not beat context-carrying review, M1's R6 reason collapses into "more compute" (R7 F9) |
| Typed constraints survive boundaries that prose does not | The stratified recall probe with facts and constraints counted separately. If constraint survival under typing does not exceed prose survival, `ConstraintSet` is ceremony (R2 F-04, MG-05) |
| Narrowed delivery beats a full shared view | The unmeasured quantity in D-03: load-bearing content surviving narrowing against accuracy lost carrying everything |
| Executor profiles do not converge into a roster | The one-month profile count. If six shapes recur, M1 has a roster (R8 W-4) |

**When B0 should win outright.** If these ventures never reach a demand level where R5 can be exercised, if
the coordination cost per unit of delivered work exceeds the loss it prevents, or if B0 with its deterministic
scripts matches M1 at equal founder attention — then the correct output is a smaller system, which `02` §9
already commits to (protocol §6).

---

## 10. Strengths, weaknesses, limits

**Strengths.** Every executor's existence is a record with a unit, a test and a removal criterion, so
negative controls 4 and 8 have something to bite on. Authority is checked where the effect happens rather than
where the agent is named. Constraints travel as data, which is the one intervention in this corpus with a
measured effect size and a near-zero price. Refusal, parking and shedding are recorded states with owners, so
the three ways work disappears silently are each closed. The continuation boundary is treated as a boundary,
which no surveyed system does. Verification is honest about what one model family can and cannot supply.

**Weaknesses.** The record count is high and every record is a maintenance obligation. Most of the mechanisms
are **(b)-class**: documented and unverified, because no runtime exists. `ConstraintSet` schema authoring is
real labour with no measured payoff yet in *this* system. The consequence-class reason (R3) will create more
executors than the founder's five would, because it fires on a common shape — draft versus release — and M1
accepts that cost deliberately. The profile-convergence risk is real and M1 can only name the test, not its
result.

**Scalability limits.** At CP1, R5 is inert and M1 is indistinguishable from a single-executor design on every
concurrency-dependent unit. Above CP1, the binding limit is not money but the **weekly bucket**, whose absolute
size the provider no longer publishes (R8 W-6). Skill-library growth is limited by semantic confusability, not
by count, with the phase transition somewhere near 80–90 candidates on measured systems (R6 F3) — a number
that is about other systems and other models.

**Operational complexity.** Higher than B0 and moderately higher than S1.0. The added cost concentrates in
three places: `ConstraintSet` authoring per capability, `FieldAuthority` declaration and reconciliation against
native systems, and `InstrumentCalibration` re-runs on a schedule shorter than the provider's release cadence
(R7 F7, M10).

**Security implications.** Positive on the confused-deputy class: R1 and R2 reasons are precisely the
capability-security shape with a published price (R2 F-09). Negative on surface area: more executors means
more inter-executor channels, and the channel is a documented propagation path (R4 F8). The `Projection` is
the highest-risk object here, because memory is where disclosure defences work worst (R1 F-15). Four CVE
records with scope-changed vectors establish the confused deputy as a shipped bug class rather than a
theoretical one (R4 F9).

**Provider dependence.** High and asymmetric. The 360-second launch window, the concurrency pin, the cache
lifetime and the metered-path affordance are all provider properties, and the metered path is **one setting
away** at both providers with nothing observing it (R8 W-5, FAL-10). M1 requires the account setting to be
read and recorded — observable today, costs nothing (MG-18).

**Migration difficulty.** Moderate from S1.0: the eleven changes in §9.1 are additive to existing contracts,
and none reopens a fixed boundary. High from any system holding live promises: migration inventories promises,
credentials, feed gaps and outstanding effects before new commitments, and `ConstraintSet` members must be
reconstructed from prose, which is exactly the transform that loses them.

**When this is the wrong design.** If the arrival rate of genuinely novel work turns out to be negligible,
most of §3.2 is machinery for a case that does not occur. If demand never exceeds 1×, the six reasons buy
nothing that a single careful executor with a checklist does not. If the founder's available attention is
large relative to throughput, B0's readable record serves W12 better than any projection. And if the
profile-convergence probe shows six recurring shapes, the honest response is to stop calling them ephemeral
and to design the charter properly — at which point a different candidate is the right one.

---

## 11. (d)-class self-audit

Walking protocol §5's ten examples. **Decided** means M1 names the rule; **deferred** means M1 names an owner
and a deadline; **open** means M1 does not close it.

| # | (d)-class example | Disposition |
|---|---|---|
| 1 | No rule for who admits a job of an unknown kind | **Decided.** C02 admits; `AdmissionRecord` is the state; the criterion is the three-class typing matrix with `no_match` distinguished from `budget_exhausted`; refusal is terminal with an owner (§3.2) |
| 2 | No authority named for a handoff's acceptance | **Decided.** `HandoffAcceptance`. The giver remains accountable between `declared_done` and `accepted`. Consultation is the default and transfers nothing (§2.2, §4.4) |
| 3 | Incompatible meanings of "done" | **Decided.** `declared_done` discharges nothing. Acceptance requires a committed, independently witnessed transition and is distinct from output acceptance, effect observation, customer acceptance and duty discharge (`05` §1). A resolution reason is mandatory |
| 4 | No rule for what context a resumed attempt may trust | **Decided.** Trust the portable `Continuation` and the loader's manifest. Never a provider-resumed opaque session, a pre-gap model verdict, or a summary. Re-derive every critical field (§4.5, F-5) |
| 5 | Skill selection with no removal criterion | **Decided.** `SkillVersion` carries a review date, invalidation triggers and a replacement/removal rule (CP-109). Periodic review uses use-and-failure evidence, never access popularity. **Deferred, with an owner:** *who owns a skill's expiry date* when a live accepted run pins the retired version — owner: the capability maintainer; deadline: before the first skill retirement (R6 §9 Q5) |
| 6 | Permission composition undefined | **Decided.** Minted, narrowly, per attempt; never borrowed; computed at release, not at assignment (§3.4, F-3) |
| 7 | No delegation ceiling with an owner | **Decided.** One child layer by default; a second by explicit rationale with reserved capacity; deeper by reviewed template change. **Owner: C01.** Raising it is a self-modification requiring review, and spawning costs a permission check (§3.4) |
| 8 | No writer authority on shared state | **Decided.** `FieldAuthority`: exactly one writer per canonical cross-boundary field, with an epoch and a reconciliation procedure against the native system (§5.1) |
| 9 | No rule for in-flight work at a provider or model change | **Decided.** Changing a definition creates a revision; existing runs stay pinned if compatible; a migration plan names in-flight states, step mapping, preserved outputs, invalidated acceptance, current grants and rollback; C02 parks incompatible runs (`05` §3). **Added by M1:** a model change invalidates `InstrumentCalibration` for every checker, so pre-change verdicts are stale rather than valid (R7 F7) |
| 10 | No stated winner between concurrent attempts | **Decided.** The attempt holding the current lease epoch wins. The loser's output survives as attributable evidence; its external effects are reconciled through `EffectIdentity`, not assumed absent (§6.4) |

**Two items M1 leaves open, stated as open rather than dressed as decided.**

- **O-1. Whether the metered-path affordance can be prevented at all, as opposed to observed.** The rule is
  stated and nothing enforces it; the path is a documented in-product affordance at both providers, surfaced
  at the moment of exhaustion (R8 W-5, FAL-10, X20). M1 requires the account setting to be read and recorded
  and **cannot** claim prevention. Owner: the founder, who holds the accounts. This is a conformance gap with
  a named observation point, not a (d)-class missing decision, because the decision is made and the mechanism
  is absent.
- **O-2. Whether the shared record defeats provenance separation.** §6.1's third arm is specified and unrun.
  If a producer's framing reaches the checker through the canonical record, every provenance check passes and
  the independence claim is void (R7 §9, R7-S11). **This is the sharpest adverse question against this
  candidate's own central mechanism**, and M1 raises it against itself rather than waiting for a reviewer to.
  Owner: whoever owns the state model in Step 5. It blocks nothing today because no runtime exists, and it
  must be the first probe run when one does.

---

## 12. Evidence ledger

Every design choice in this candidate, its finding ids, and its kind. **DESIGN PROPOSAL** entries with **no**
finding behind them are marked `†` and counted at the end.

| # | Design choice | Finding ids | Kind |
|---|---|---|---|
| 1 | Each existence reason predicates on its own unit; `ExistenceJustification` records which | R2 F-20, X11, TC-36; R7 §9; R6 F9; R4 F1 | INFERENCE |
| 2 | Specialized knowledge is refused as a reason to create an executor | R2 F-10, R6 F6, CP-76, CP-109; MG-10 names the unrun decomposition | INFERENCE (the reconciliation is unmeasured) |
| 3 | Input provenance admitted as a reason | R2 F-21.1, F-09 | DESIGN PROPOSAL on evidence |
| 4 | Consequence class admitted as a reason | R2 F-21.3, R4 F4, TC-17, DIRECTIVE §1.5 | DESIGN PROPOSAL on evidence |
| 5 | Attributable identity refused as a reason, mandatory as a property | R2 F-21.4; fixture F-3's own requirement | INFERENCE |
| 6 | Provider/account separation folded into `ExecutionSelection` | R2 F-19, F-21.2; CP-159 | INFERENCE |
| 7 | Isolated context narrowed to the confidentiality sense | R2 §8, D-02, R1 F-14/F-15, R4 F5 | SOURCE CLAIM + INFERENCE |
| 8 | Parallel work admitted against a named partition and dormant at CP1 | R2 F-06, F-07, F-19; CP-159 | SOURCE CLAIM + INFERENCE |
| 9 | `ConstraintSet` typed on every boundary | R2 F-04, F-05; X13; AG-09 | SOURCE CLAIM |
| 10 | Continuation held to handoff discipline | R2 F-18, FAL-02; R2 §9 Q2 | INFERENCE from the package's own launch contract |
| 11 | Consultation default, handoff by exception | R2 F-17, X12; R3 F20, F21 | SOURCE CLAIM + INFERENCE |
| 12 | `HandoffAcceptance` and the declared-done interval | AG-18, X18; R3 §9, §10.1; R5-13; R7 §8 F-1 | SOURCE CLAIM (as a gap) + DESIGN PROPOSAL (as a remedy) |
| 13 | `FieldAuthority`, one writer per field; no single store | R3 F42, F44, F24, F25; R1 F-23, TC-31; R8 W-3; CP-22 | SOURCE CLAIM + INFERENCE |
| 14 | Narrowed delivery per attempt, not a company-wide view | R8 W-3; R1 F-06, F-07; CP-84, CP-135 | SOURCE CLAIM |
| 15 | `Projection`/`ProjectionGrant` with revocation propagation | R1 §9.5, §9.7, F-15; CP-84 | SOURCE CLAIM + DESIGN PROPOSAL |
| 16 | Write-path screening and provenance ranking rejected as contamination defences | R1 F-10, F-11, F-12; X04 | SOURCE CLAIM |
| 17 | Out-of-band discrimination plus CP-142 understanding check | R1 TC-42, F-04, F-13; `06` §7 | SOURCE CLAIM |
| 18 | Paired clean case on every filter and every checker | AM-01; R7 F8, M4; R1 F-10; R6 F8; X17; AG-15 | SOURCE CLAIM |
| 19 | Deterministic oracle before any model checker | R7 M1, F5; R7-S24 | SOURCE CLAIM |
| 20 | Checker's delivered inputs verified by the loader | R7 M2, F9; CP-128 | SOURCE CLAIM + INFERENCE |
| 21 | Independence split into influence and error, with the residual named | R7 F13, F1, F2, F12; TC-37; FAL-08 | SOURCE CLAIM |
| 22 | Union aggregation, no vote or mean | R7 F15, M5, R4 | SOURCE CLAIM |
| 23 | Chance-corrected agreement; rubric version as instrument change; re-run shorter than release cadence | R7 F3, F4, F6, F7, M7, M8, M10 | SOURCE CLAIM |
| 24 | Planted defect scoped to always-pass detection only | R7 F19, M3, D-08 | SOURCE CLAIM (disagreement preserved) |
| 25 | Debate refused for F-4; same-family jury refused | R7 R3, R2, F14, F17 | SOURCE CLAIM |
| 26 | Grade the path, not only the product | R7 F20, D-09 | SOURCE CLAIM (contradicting vendor guidance, with reason) |
| 27 | Authority checked at the effect; `derived ⊆ parent` | R4 F1, F2, F10; R4 §8.1 | SOURCE CLAIM + INFERENCE |
| 28 | Live epoch re-read for revocation | R4 F3; `02` §4, §6.2 | SOURCE CLAIM |
| 29 | No default inheritance; child's declared mode compared to effective | R4 F5, FAL-03, D-01; R4 failure case 3 | SOURCE CLAIM |
| 30 | Consequence class computed from non-authorable input | R4 F4 | SOURCE CLAIM |
| 31 | Delegation costs a permission check; ceiling owner is C01 | R4 §9 Q3; R3 F18, D-10 | DESIGN PROPOSAL on evidence (the field disagrees; M1 decides for this system) |
| 32 | Approvals expire | R4 §9 Q5, TC-25, failure case 8 | DESIGN PROPOSAL on evidence |
| 33 | Skill tool-granting frontmatter stripped at load | R2 F-08; R6 F7, FC-6; AG-07 | SOURCE CLAIM + DESIGN PROPOSAL |
| 34 | `GrantDeliveryReceipt`; arrival observed at the effect | R3 F59, X16, MG-13 | SOURCE CLAIM + DESIGN PROPOSAL |
| 35 | Mediation assumed; attenuation as an optimisation if a credential exists | R4 §9 Q1; `07` §1 | UNKNOWN carried forward |
| 36 | `EffectIdentity` and deliberate decorrelation | R1 F-17, useful mechanism 8; AG-17 | SOURCE CLAIM |
| 37 | Idempotency before approval interrupts | R3 F29, F30 | SOURCE CLAIM |
| 38 | Lease-epoch holder wins between concurrent attempts | `05` §5, §6; CP-100 | DESIGN PROPOSAL † |
| 39 | `AdmissionRecord` with refusal terminal and an owner | R5-14, R5-09, AG-12; R3 §9 F-1; negative control 9 | SOURCE CLAIM |
| 40 | Three-class typing matrix; mistyping never scored as success | R5-15, R5-16, TC-40; `05` §10 | SOURCE CLAIM |
| 41 | Capability creation keeps a human approver; TC-19 not claimed in strong form | R5-06, R5-08, R5-21, TC-19; CP-77; FAL-12 | SOURCE CLAIM |
| 42 | Ordered ownership resolver with a standing human terminal element | R5-03, R5-11; `03`; R5 §8 | DESIGN PROPOSAL on evidence (two reasoned rules conflict; M1 decides and records) |
| 43 | Re-routing not scored as a defect; end-of-sequence cycles measured separately | R5-20, D-12 | SOURCE CLAIM |
| 44 | `NextActionView` with author, different approver and expiry | R5-23, R5-01, R5-02, TC-34 | SOURCE CLAIM |
| 45 | C02 as the single control locus, with its documented cost | R5-01, R5-02, TC-41; `02` §2, §9; CP-68 | SOURCE CLAIM + INFERENCE |
| 46 | Dependency-gated dispatch borrowed; interest-based extraction refused | R3 F33, D-15 | INFERENCE |
| 47 | Overflow destination with a count; retention longer than source; alarm with a reader | R5-19, R5-10 | SOURCE CLAIM |
| 48 | Escalation ladder terminus becomes `parked_awaiting_principal` | R5-12 | DESIGN PROPOSAL on evidence |
| 49 | `ShedDecision` with a named authority | R8 A-4; `07` §6 | INFERENCE |
| 50 | Capacity in `07` §6 units; no token model; ratios only | R8 W-6, §3; MG-03; CP-173; negative control 7 | SOURCE CLAIM |
| 51 | Unused allowance is destroyed; reservation priced as waste | R8 §3 | SOURCE CLAIM |
| 52 | Parallel-arm cache-miss cost charged to the split | R8 W-2 | SOURCE CLAIM |
| 53 | Metered-path account setting read and recorded; prevention not claimed | R8 W-5, FAL-10, X20, MG-18 | SOURCE CLAIM |
| 54 | F-2 reported as blocked at CP1, not as passed | R2 F-19, §8; AG-13; MG-02; negative control 10 | INFERENCE |
| 55 | Removal criterion on every mechanism | R3 F38, F39, X10; W9 | SOURCE CLAIM |
| 56 | Profile-convergence probe as a self-test against negative control 8 | R8 W-4, MG-11 | DESIGN PROPOSAL on evidence |
| 57 | Deterministic displacement as the only real capacity lever | R8 B-7; CP-69, CP-101 | INFERENCE |
| 58 | Re-entry brief carries omissions and contests, not only decisions | R1 F-17; R5-23 | INFERENCE |
| 59 | Founder as a differently-correlated instrument with an unmeasured error rate | R7 F15, §8 F-6, X19 | SOURCE CLAIM |
| 60 | Nothing above `C2` accepted on same-family judgement alone during founder absence | R7 §8 F-6; F13 | DESIGN PROPOSAL on evidence |
| 61 | Designed return as a (c)-class hypothesis, dose unknown | R1 TC-29, X07, AG-10; DIRECTIVE §1.6 | UNKNOWN carried forward |
| 62 | Novel-work acceptance routed to a human or deterministic predicate | R7 §8 F-1, F5 | SOURCE CLAIM |
| 63 | Skill library governed by confusability, not count | R6 F3, F2, D-07; AG-06; CP-109 | SOURCE CLAIM |
| 64 | Content-hash pinning re-checked at use | R3 F47, F48 | SOURCE CLAIM |
| 65 | Instruction-hierarchy conflicts not resolvable by the model reading them | R6 F12 | SOURCE CLAIM |
| 66 | Manifest reconciled against provider-reported edits | R1 TC-27, F-02, F-21; AG-02; MG-07 | SOURCE CLAIM |
| 67 | Six memory constituents retained against the thesis's five | R1 TC-14; CP-124 | SOURCE CLAIM |
| 68 | Grievance custodian standing, executor ephemeral | R8 A-5; `02` §7 | DESIGN PROPOSAL on evidence (and M1 concedes this is the steelman's strongest hit) |
| 69 | MCP "request every scope" fallback refused for this system | R4 F11 | INFERENCE |
| 70 | Sandbox treated as containment under an authority decision | R4 F12, AG-08; R1 §8 | SOURCE CLAIM |
| 71 | The `ConstraintSet` schema's member list — seven named member types | R2 F-04's probe list plus `05` §5's result-transfer fields | DESIGN PROPOSAL † |
| 72 | `InstrumentCalibration` as a record with a next-run date | R7 M10, F7 supply the requirement; the record shape is mine | DESIGN PROPOSAL † |
| 73 | `ExistenceJustification`'s exact field list | R2 F-20 supplies unit-and-test; the field list is mine | DESIGN PROPOSAL † |
| 74 | The order of shedding — discretionary, then creation, then maintenance | `07` §6's planning shares; the order is mine | DESIGN PROPOSAL † |
| 75 | One reason per executor, never a list | Follows from R2 F-20 but is not entailed by it | DESIGN PROPOSAL † |

**Count of DESIGN PROPOSAL choices with no finding behind them: 6** (rows 38, 71, 72, 73, 74, 75). Each is a
shape or a field list rather than a mechanism, and each is the kind of choice an implementer would otherwise
invent silently — which is why they are named rather than absorbed.

**Preserved disagreements this candidate inherits and does not resolve.** Whether the subagent boundary
attenuates or inherits (D-01, and M1 builds for the pessimistic reading). Whether executor isolation buys
confidentiality a filtered loader does not (D-02, and M1 requires both). Share-everything versus
narrow-everything (D-03, and M1's reconciliation is a hypothesis). Whether a turning point in executor count
exists (D-04, blocked at CP1). Whether the reported multi-agent gain is architecture or resource (D-05).
Whether to buy a disjoint model family or stop relying on model judgement (D-13, routed to the founder).
Whether seeded defects estimate real-defect detection (D-08, with the operative consequence identical under
both readings).

**One finding against the round itself that M1 carries.** Roughly seven in ten source rows in this round's
evidence base carry a declared vendor, author or commercial interest, and about one in five is the lanes' own
model family reporting on its own products. A candidate that treats this evidence base as neutral is treating
a vendor corpus as neutral. M1 does not.

---

*Step 3 artifact, formed blind of the four sibling candidates. It decides nothing and approves nothing. Every
mechanism above is specified behaviour, unimplemented and unexecuted.*
