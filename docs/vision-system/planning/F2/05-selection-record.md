# F2 Step 5a-ii — selection and synthesis record

> **What this is.** The Phase E decision for the work / agents / authority / tools / skills / context /
> shared-state / routing / task-state layer, taken under [DIRECTIVE §7 Phase E](../../inputs/DIRECTIVE.md)
> and judged against the frozen [acceptance protocol](00-acceptance-protocol.md) (`26af5d5`) and its
> [amendment AM-01](00-acceptance-protocol-amendments.md). It selects, and it says why.
>
> **Sources read, and the only ones.** The protocol and its amendments; the
> [founder thesis](../../inputs/FOUNDER-THESIS-2026-09-13-agents.md) and
> [`00-thesis-claims.json`](00-thesis-claims.json); [`research/F2/cross-lane-comparison.md`](../../research/F2/cross-lane-comparison.md)
> §I, §C, §D, §E, §F; [`04-attack-consolidation.md`](04-attack-consolidation.md) whole; the five candidates
> in full; [`02-architecture-selection.md`](../02-architecture-selection.md) §1–§3, §8, §9;
> [`05-work-agents-skills.md`](../specification/05-work-agents-skills.md) whole;
> [`02-authority-recovery.md`](../specification/02-authority-recovery.md) §4–§6, §8;
> [`04-human-operation.md`](../specification/04-human-operation.md) §§1–4;
> [`06`](../specification/06-knowledge-evidence-evaluation.md) and
> [`07`](../specification/07-integrations-capacity.md) headings;
> [`coverage/package.json`](../../coverage/package.json), [`coverage/questions.json`](../../coverage/questions.json)
> structure, [`registers/decisions.json`](../../registers/decisions.json); DIRECTIVE §3, §7 Phase E, §12.
> `state.json`, `history.jsonl` and `docs/08-agents_work/` were **not** read.
>
> **Standing caveat, per protocol §8.** No runtime exists. Every "repaired", "closed" and "sufficient" below
> is about **specified behaviour checked offline** by agents of one model family with procedural independence
> only. Nothing here establishes runtime conformance, deployment readiness, actual fulfilment, or business
> value. This record does not lift the founder's hold on building.
>
> **Statement kinds** follow [DIRECTIVE §6](../../inputs/DIRECTIVE.md): **SPECIFICATION** · **SOURCE CLAIM** ·
> **INFERENCE** · **DIRECT OBSERVATION** · **DESIGN PROPOSAL** · **DISAGREEMENT** · **UNKNOWN**. §13 is the
> ledger binding every synthesis choice to the finding behind it.

Machine-readable mirror: [`05-selection-record.json`](05-selection-record.json).

---

## 1. Decision

**SPECIFICATION.** The selected design is a **synthesis of all five candidates, layered by what each layer
decides, with a fixed precedence between the layers**. Named plainly: **consequence class decides who may
act; a declared procedure decides how the work runs and what each step may see; a typed standing interest
decides when work becomes due; an existence record decides whether a worker may be created at all; and
exactly one standing party exists for each duty that outlives the case carrying it.** When two layers
disagree, the lower-numbered layer governs. Its architecture version is **S1.1** — the six fixed boundaries
and the nine logical components of [`02-architecture-selection.md` §3](../02-architecture-selection.md) stand
unchanged, and this layer is re-specified inside them. Cross-lane §E returned **zero falsifiers against a
fixed boundary** out of fourteen candidates examined, so nothing licenses S2.0, and this record opens no
boundary and routes no packet against one.

**Why this and not one candidate.** Every candidate carries blocking findings, and the blockers are not
evenly distributed: they cluster on each candidate's *own routing unit*. M4's blockers are all consequences
of computing one class by `max()` over a rank; M1's two worst are consequences of many ephemeral executors
that must talk to each other and read each other's work; M5's two are consequences of letting an activation
promote what it investigated; M3's are consequences of deleting the records that hold the rest of the
package together; M2 failed a negative control on the one chartered desk no fixture exercises.
[R2 F-20](../../research/F2/cross-lane-comparison.md) already resolved the meta-question: **there is no
single unit of justification** — the founder's five criteria predicate on five different objects, and a
criterion applied to the wrong unit returns undecidable, which reads as satisfied. A synthesis that picks one
unit inherits that unit's blind spot. A synthesis that layers the units, states which governs when two
disagree, and takes from each candidate only the mechanism whose attack it survived, does not. **INFERENCE.**
AT's own closing sentence is the licence for this shape: *"every blocker I raised is repairable in place —
none requires a different architecture."* The blockers do not point at a sixth architecture. They point at
five partial ones.

---

## 2. The thesis, judged

*For the founder. Plain language. Each line names the finding that decided it.*

### 2.1 Your five criteria

| Your criterion | Verdict | What decided it |
|---|---|---|
| **Distinct tools or permissions** | **Confirmed, and it is the strongest of the five.** It is the only one enforced outside the model and the only one with a published price — 77% of benchmark tasks solved with provable security against 84% undefended. But it does not hold for free: in the runtime you would use, a helper inherits every tool by default, and a skill file can grant tools for the turn that loads it. **It works, and it has to be built.** | R2 F-09 · R4 F5 · R2 F-08 · R6 F7 · FAL-03 |
| **Isolated context** | **Refined, and split in two.** Isolation *for attention* moves with the model generation and is shrinking. Isolation *for confidentiality* is structural. Only the confidentiality sense is exercised by any of your six test cases, so only it may justify creating a worker. Even then, separated arrangements cut disclosure violations by 20–50 points and still leave over 75%. | R2 §8 · R1 F-14, F-15 · D-02 |
| **Independent verification** | **Refined, and half of it is unreachable.** You can stop the producer influencing the checker, and that is measurable. You cannot make their *errors* independent inside one model family, and no blinding reaches it. The best independent reviewer anyone has measured found under a third of planted defects. **A model checker finds; a deterministic test or a person accepts.** | R7 F9, F12, F13 · TC-37 · FAL-08 |
| **Parallel work** | **Refined to near-inert here.** Whether splitting pays is a property of the *partition*, not of the job, and your current concurrency admits two slots that are not interchangeable. Good partitioning gained 11–14 points; poor partitioning degraded both speed and quality. At today's pin this criterion buys nothing. | R2 F-06, F-07, F-19 |
| **Specialized knowledge** | **Overturned as a reason to create a worker.** Across 4 model families, 162 roles and 2,410 questions, adding a persona gave no benefit and picking the best one was no better than random. Specialization belongs to a versioned, tested procedure that a general worker loads. | R2 F-10 · R6 F6 · TC-33 |

**The list is not closed, and that is your decision, not ours.** Five candidate sixth reasons survived
adversarial search: input provenance, provider or account separation, **consequence class**, attributable
identity, and — for people only — being a differently-correlated error source [R2 F-21, R4 F4, R7 §8 F-6].
The synthesis uses consequence class as its top layer and input provenance as one of six admitted reasons to
create a worker. **If you decide the list is closed at five, this design is inadmissible on your own gate and
must be rebuilt, and M2 said the same thing about itself.** That is TC-35 and it is a founder question.

### 2.2 Your four costs

| Your cost | Verdict | What decided it |
|---|---|---|
| **Handoffs lose things** | **Confirmed and mis-aimed.** Ordinary facts survive a compressed transfer at about 0.97. Rules, exclusions, deadlines and promises survive at about 0.57. Typed constraints leaked **0 of 48** where prose leaked 73%. So the answer is not "split less"; it is **"type what crosses"**. | R2 F-04, F-05 · X13 · AG-09 |
| **Token cost** | **Real in direction, folklore in magnitude, and in the wrong unit.** The most-circulated multiple is a vendor self-report with no published method, flagged independently by five lanes. Under a subscription, architecture does not change what you spend — it changes the date work stops, and unused allowance is destroyed rather than saved. | AG-14 · R8 §3 · R8 W-6 |
| **Latency** | **Sign indeterminate.** A latency figure without a realised-concurrency count is uninterpretable, and at your pin thirty workers serialise rather than multiply. | R2 F-06, F-19 · R8 W-1 |
| **Context loss** | **Confirmed and mis-assigned.** It is owed by the single-worker arm too, and it is **mandatory**: a native job caps at a ~360-second window, so even one worker hands off to itself on every long job. | R2 F-13, F-18 · FAL-02 |

### 2.3 "Coordinated capabilities around a shared source of truth"

**Refined, in three specific ways, and the refinements are the design.**

1. **It cannot mean one store everyone reads.** A larger authoritative view makes every reader measurably
   worse; even one irrelevant item hurts. What the evidence supports is **one authority per field, with
   delivery narrowed per attempt**. Your sentence does not distinguish those two designs and they build
   different companies. [R8 W-3 · R1 F-06 · R3 F42, F44 · R1 F-23]
2. **Your five constituents are not sufficient.** The dominant measured failure is **authorization and
   recipient scope** — who may see and receive a fact — which is none of the five. Three more are needed on
   evidence rather than preference: temporal validity, explicit contradiction state, and surviving
   obligations that outlive their case. [R1 TC-14]
3. **A shared authoritative view does not fix duplicated action, and may amplify it.** Eighteen of thirty
   workers chose the identical branch name; a job queue took 2.4 million requests to accept 117. The cause is
   **correlated behaviour between identical models**, not divergent context, and it is a counter-mechanism
   the thesis does not predict. Deliberate de-correlation — a centrally allocated effect identity and
   reserved name ranges — must be designed *alongside* the shared record, not after it. [R1 F-17 · AG-17]

**And the part of your sentence that survives untouched, which is the largest part.** Coordinated
capabilities beat disconnected digital employees, decomposition by job title buys nothing, and the shape you
were reaching for — "the file everyone is supposed to trust" made binding — is achievable. The synthesis
makes it structural: an activation's preconditions *are* the record, and a step cannot run without the loader
delivering its declared read set and recording what it delivered. A shared source of truth nobody is forced
to read is not expressible in this design. That is negative control §4.2 answered by construction rather than
by discipline.

### 2.4 The three findings most likely to change what you do

1. **How you cut matters more than whether you cut.** Auto-generated multi-agent systems underperformed a
   single agent at up to ten times the cost — *and in the same paper*, an expert-designed one reached 96.5%
   against 57.0% on the same diagnostic. The discriminator is whether separation is **enforced by
   construction** or only described in prompts. [R2 F-03 · R3 F51, F52 · AG-05]
2. **The defence against a false entry fails against the kind that matters.** A poisoning attack carrying no
   instruction at all passed a four-stage screen **360 times out of 360**, while the same screen caught
   injections at 0.832 recall. So the synthesis does not screen. It gates: an untrusted entry may activate
   only read-only work, a false entry cannot change a consequence class, and discrimination happens out of
   band at the effect. [R1 F-10 · R2 F-09]
3. **The cheapest measurement in the round needs no software and nobody has run it.** Count admitted work
   over a past window against what you already knew how to do. That number decides whether the machinery for
   unknown work is a primary requirement or an edge case, and every design in this round is calibrated
   against a rate nobody knows. [MG-06 · R5-24]

---

## 3. What was kept from each candidate, and why

**SPECIFICATION.** Each row names the mechanism, the problem it solves, and the finding or fixture that
proved it. Rejected mechanisms name the finding that killed them. Every "keep if rejected" mechanism the
five reviews listed (consolidation §E.2) is **either kept or explicitly declined with a reason**; the
declines are marked **DECLINED** and counted at the end of each block.

### 3.1 From M4 — the routing axis (layer 1)

**Kept.**

| Mechanism | The problem it solves | What proved it |
|---|---|---|
| **Consequence class as the routing axis**, reusing C0–C5 unchanged | It is the only axis on the founder's list plus leftovers that is a property of *the work*, so it does not degrade as models improve, and DIRECTIVE §1.5 already sets supervision by it | R2 F-21.3 · TC-17's own discriminating fixture · `02-authority-recovery.md` §4 |
| **Class computed from inputs the acting party cannot author** — resolved parameters, destination, selector closure, declared floor | A boundary is real only if what is checked at the effect is what was granted; tool self-descriptions are normatively untrusted and command-text matching is not a security boundary | R4 F1, F4 |
| **Recomputed inside the ordered release transaction, on the frozen bytes; park on mismatch, never resolve downward** | A pre-gap or pre-drift class is stale the way a pre-gap fact is | R4 F1, F3 · AT §E.2 names this as the mechanism to keep whatever is selected |
| **One implementation of the derivation** | Two implementations of risk classification disagree, and you find out during the incident — observed in this repository | AT-M4's DIRECT OBSERVATION on `scripts/classify.mjs` |
| **Class before kind at admission** | An unknown job is bounded before it is understood, so silent mistyping into the nearest existing kind cannot lower the class | R5-15 · TC-40 |
| **`StandingHolder` as a record with an address, a reservation, an alternate and a review date; performer ephemeral per contact** | A complaint six months after closure needs a party that already existed; a rule produces a custodian only when asked | R8 A-4, A-5 |
| **The closure interlock on CAP-39** — closure cannot complete until the grievance holder's duties are transferred to an accepted custodian | Closure with an unowned redress route is a broken promise recorded as a clean end | AC-M4-05, recorded as the strongest standing-accountability mechanism in the round |
| **The §9.1 one-action-two-classes anti-renaming test** | It is the test that distinguishes this design from S1.0-plus-nouns, and M4 offered it against itself | AT §E.2 |
| **Approval expiry, and classing the derivation, the table, the holders and the floors as C5** | The ratchet the accumulated *approval set* creates, which the executor's own record never shows | AS §E.2 · R4 TC-25, failure case 8 |
| **A missing clean-case rate resolves `unresolved`, never `pass`** | The only terminal-value treatment in the five, and it is Rule 10's shape | AX §E.2 · R7 F8 |
| **The manifest field recording the class it was assembled for** | A manifest built for a C1 action cannot be silently reused for a C3 one | AX §E.2 |
| **The `ConflictClaim` double-payment guard keyed on the original charge** | Two independently named "courtesy" and "refund" operations on one entitlement share the liability constraint | AC §E.2 · `02-authority-recovery.md` §5 |
| **The 90%-C0/C1 falsifier** | It is the most executable falsifier in the round and it is aimed at this layer's own foundation | AE §E.2 |

**Rejected.**

| Mechanism | The finding that killed it |
|---|---|
| **`max(contributing_dimensions ∪ {floor})`** — a total rank over the six classes | **AT-M4-02.** `02-authority-recovery.md` §4 heads its table *"Routing classes are predicates, not a total privilege rank"* and says an action may satisfy several classes and must meet all their gates; `max()` returns one class and applies one row, dropping C2's human requirement on a C2∧C3 refund message. Replaced by the **set of reached classes**, every reached row's gates applying |
| **The holder veto over shedding a protected lane** | **AE-M4-01.** Four protected holders can refuse four times while the bucket stays empty and no override exists anywhere. The holder's stated minimum is **evidence, not consent** |
| **Consent-conditional return-to-pool** | **AE-M4-03.** The return is conditional on a decline, which the veto lets a holder withhold. Replaced by a time-triggered lapse point independent of the holder |
| **A bare `P` acceptor on CAP-43** | **AC-M4-03.** It makes the owner the acceptor of the assessment of himself, which M4's own §2.3 forbids and `04-human-operation.md` already fixes the other way |

### 3.2 From M3 — the execution structure (layer 2)

**Kept.**

| Mechanism | The problem it solves | What proved it |
|---|---|---|
| **The declared read set, delivered and recorded by the loader** | It converts *"the checker did not read the producer's rationale"* from an assertion into a manifest fact. A design where a worker assembles its own context cannot make that claim at all | AT §E.2, which calls this the single mechanism most worth lifting · `06` §2 · R7 §7 |
| **Step kinds** — `compute` · `model` · `human` · `professional` · `effect` — as declared fields on the existing execution records | A model call that holds no credentials and cannot select what runs next is a workflow step, and it is the only native profile this package currently admits | `07` §5 · R4 F5 |
| **Guards are pure functions over typed outputs and journal state; a model's output is an input to a guard, never a jump** | Control flow trusted, model output data — the CaMeL separation, whose seven-point utility price is published and is paid deliberately | R2 F-09 |
| **The step boundary is the checkpoint** | It closes the capacity-cut close-out predicate **without needing a denominator that does not exist** | AT-M1-03 could not be closed in M1's form for exactly that reason |
| **One effect per effect step, and the step is the idempotency unit** | On resume after an interrupt the entire node restarts, so a human approval step can duplicate the payment it was approving | R3 F29, F30 |
| **The zero-allowance step kind, and maximising its share** | Determinism is the only lever that cuts subscription consumption without cutting work, and it belongs to every position | R8 B-7 · AE §E.2 |
| **Bounded retry by error class, with a `Blocker` on two failures with the same cause** | **AE: "E4 is closed, and M3 is the only candidate that closes it."** Runaway retry is otherwise unbounded in every other candidate | AE §E.2 |
| **The removal criterion declared per model step** — the validator whose failure would justify the step | A mechanism with no removal criterion is a permanent tax, and the exemplar runs against its own authors' interest | R3 F38, F39 · X10 |
| **The founder brief as a deterministic projection plus one model step validated field-by-field against it** | **The only mechanism in the five candidates that makes omission structurally visible**, and G-05 says every other candidate relies on prose at the one boundary whose reader has uncorrelated errors | AX §E.2 · G-05 |
| **A producing run may not select its own checker** — the checker's procedure comes from committed configuration | A design whose routing component can choose who checks its own work has not achieved procedural independence | AX §E.2 · R5 §8 |
| **`unclassified-work/v1` with a declared maximum age whose breach is itself admitted work** | Unknown work is neither dropped nor parked forever, and the parking has a clock somebody owns | AC §E.2 · R5-14 |
| **Non-composition rather than attenuation** | Three permissions become three effect steps and the union never exists anywhere. This answers protocol §5 item 6 with *refused, not minted* | AS §E.2 · R4 F5 |
| **Admission-time resolution of a declared grant against the grant policy** | The decorative-declaration loophole: 44 capability declarations that no configuration backed, in this repository | AS §E.2 · R3 F57, F60 |
| **A drafted procedure is executable only after a passing test suite and a human capability owner's acceptance** | A control-flow structure authored by a model from untrusted input is the thing the trust boundary exists to prevent | AS §E.2 · R3 F11 |
| **Refusal as a terminal state of the same record, with its own acceptance owner** | Nothing in the entire framework survey refuses a job with a reason; this cannot be imported and must be built | R3 §9 F-1 · R5-14 · AG-12 |

**Rejected.**

| Mechanism | The finding that killed it |
|---|---|
| **Deleting `AgentTemplate` and `AgentInstance`** | **AT-M3-01.** ~52 and ~50 dangling registry references with no migration, and the deletion is irreversible-tier. The synthesis retains both and adds the existence record beside them |
| **Renaming four registry records to `WorkRecord`/`Procedure`/`Step`/`Journal`** | **AT-M3-02**, *"a partial false closure on negative control §4.1"*. Nothing is renamed. The new content lands as **fields on the existing records** |
| **A branch set in which a model-authored typed value selects between acceptance strengths** | **AS-M3-01.** Checker *selection* becomes a producer choice even when checker *inputs* are a record |
| **"The only one available" as the metered-path response** | **AE-M3-04.** `07` §6 supplies a stronger response — quarantine — which M3 declines |
| **A pre-endorsed shed that nothing can halt** | **AT-M3-03.** The mitigation is same-day notification, which lands in an empty inbox under F-6. The pre-endorsed *order* is kept; the absence of a halt authority is routed as **MD-07** |

### 3.3 From M5 — when work becomes due (layer 3)

**Kept.**

| Mechanism | The problem it solves | What proved it |
|---|---|---|
| **Arming as a computed, unstoppable set** | **The only mechanism in the round that makes a deferral a visible state with a deadline rather than an absence indistinguishable from an oversight.** Under S1.0 nothing exists until the case authority admits it, so a deferral and an oversight look identical | AT §E.2 · R5-01, R5-02 |
| **No precondition may invoke a model** | A model-evaluated gate is a model-placed boundary, which three lanes independently say cannot hold; and determinism is the only free lever | AG-08 · R4 F4, F6 · R8 B-7 |
| **Dependency-gated activation** — every prerequisite simultaneously, unexpired, uncontradicted, at or above its required trust class | A single-prerequisite trigger is a weaker object; the all-prerequisites shape is the one with published scores | R3 F33 · D-15 |
| **Trust class as a gate on what an entry may activate, never a weight on a ranking** | Provenance-weighted ranking was indistinguishable from no defence at its shipped weight and took evidence recall to exactly zero at the weight that worked | AX §E.2 · R1 F-10 |
| **The armed set recomputed rather than carried in a summary** | A pre-reset summary that omits a decision cannot cause the wrong activation, because the summary is not what activates | AX §E.2 · R1 F-01 |
| **The unmatched pool as the computable complement, with its residue named** | A catch-all that does not name what it cannot catch is decoration; the pool cannot catch an entry that armed the *wrong* interest, and M5 says so | AC §E.2 · R5-09 |
| **The graduated trial** — read-only and internal-artifact capabilities admitted on an expiring bounded trial; outward classes require a human approver | **AC: "the tightest concession in the round and should survive into any synthesis."** It is the only mechanism that says what may proceed *while* approval is pending | AC §E.2 · R5 TC-19 |
| **`budget` as a mandatory schema field on the object that consumes capacity; `CapacityState` with `remaining-or-unknown`** | An invisible capacity cost is attached to the decision that incurs it, and an unknown allowance is recorded as unknown rather than assumed | AE §E.2 · R8 W-6 |
| **The `credit-setting` interest** — observes the metered affordance and halts new launches in that class, correctly disclosed as observation and not prevention | **AE: "the round's only real answer to X20."** The metered path is one setting away at both providers and nothing observes it | AS-M5-05 · AE §E.2 · R8 W-5 · FAL-10 |
| **`refusal-sample`** — a sample of what the system declined is returned to the founder | A refusal nobody reviews is a decision nobody made | AX §E.2 |
| **The unretirable `grievance` interest** | It composes with M4's closure interlock, and AC names the composition explicitly | AC §7.2 |
| **The effect allocator: the second claimant joins the first and inherits its outcome** | Correlated behaviour between identical models, which a shared view does not fix | R1 F-17 |

**Rejected.**

| Mechanism | The finding that killed it |
|---|---|
| **Promotion of `untrusted-external` to attested by the investigating activation** | **AS-M5-01.** Either untrusted material is inert and unhandled, or an activation promotes untrusted to attested on a model's judgement of the attacker's own text. That is the laundering route |
| **`writer_keys` declared by a trial interest** | **AS-M5-02.** A model-authored object reaches the permission boundary over the record with no human in the loop |
| **A second writer on `Constraint`** | **AT-M5-01.** The kernel reserves it to C01; a standing interest may write only a `proposed` revision |
| **The merge interest as specified** | **AT-M5-03.** Its only named detector is forbidden by M5's own no-model-in-a-precondition rule. Replaced by a typed proxy, with the residue recorded as undetected |
| **The narrowest-sufficient tie-break applied to check interests** | **AS-M5-04.** For a check, narrowest sufficient means the weakest check. It inverts to strongest sufficient |

### 3.4 From M1 — whether a worker may exist at all (layer 4)

**Kept.**

| Mechanism | The problem it solves | What proved it |
|---|---|---|
| **`ExistenceJustification`** — one reason, its unit, a test that can return false, the alternative considered, a removal criterion and an expected cost in `07` §6 units | **AT: "what makes negative control 4 mechanical instead of rhetorical", portable into any candidate that creates workers.** A justification naming a *capability* is uncheckable; one naming a unit and a test is checkable | AT §E.2 · R2 F-20 · X11 |
| **Six admitted reasons, each on its own unit** — permission scope, input provenance, consequence class, confidentiality boundary, named partition, verification relation; and **specialized knowledge refused**, **attributable identity mandatory rather than justifying** | Applies R2's unit result rather than restating it, and stops an unlimited number of workers being licensed by a property every worker must have | R2 F-09, F-10, F-20, F-21 |
| **`ExistenceJustification.expected_cost`** | **AE: "the only place in the five candidates where an invisible capacity cost is attached to the decision that incurs it."** | AE §E.2 |
| **`GrantDeliveryReceipt`** — arrival attested at the first effect | **The only answer to a measured delivery asymmetry:** an identical grant delivered 24 tools one day and zero on three dispatches two days later. Assume a child holds no more than it was granted; never assume it holds what it was granted | AT and AS §E.2 · R3 F59 · X16 |
| **Per-item trust level in the manifest, and reading "what was omitted" as *which typed constraints were dropped*** | Boundary metadata is the class that dies in transfer; DIRECTIVE §8.12 requires trust level by name | AX §E.2 · R2 F-04, F-05 |
| **The re-entry brief carrying what was omitted and what was contested**, and the founder described as an instrument with an unmeasured error rate whose errors are uncorrelated with the family's | A brief reporting only decisions reproduces, for the human, the hidden-profile failure in which agents do not surface information contradicting consensus | AC §E.2 · R1 F-17 · R7 F15, §8 F-6 |
| **The profile-convergence probe** — run for a month and count distinct worker profiles | It is a pre-declared negative control against the design's own thesis, with the remedy named in advance | AC-M1-06 · R8 W-4 · MG-11 |
| **The `FieldAuthority` reading of shared truth** — one writer per canonical cross-boundary field, with an epoch and a reconciliation procedure | (d)-class example 8: without it, "shared source of truth" means last-writer-wins in practice | R3 F42, F44 · CP-22 |
| **`EffectIdentity` and deliberate de-correlation** | The counter-mechanism the thesis does not predict | R1 F-17 |
| **Skill tool-granting frontmatter stripped at the launcher** | `05` §8's rule that a prose package cannot spend by being loaded is correct as intent and **false of the named runtime** | R2 F-08 · R6 F7 · AG-07 |
| **The R4 F1 sentence** — a boundary is real only if what is checked at the effect is what was granted | AS names it as the sentence to keep | AS §E.2 |

**Rejected.**

| Mechanism | The finding that killed it |
|---|---|
| **The unfiltered model-to-model consultation return** | **AS-M1-01.** It is a channel into the identity holding the effect grants, defended by a rule M1's own text proves cannot be model-enforced. Kept only on a declared procedure edge, crossing the loader, typed outputs only, prose stored at a Ref and **not delivered** |
| **The issuer-less `ProjectionGrant`** | **AS-M1-02.** A worker could issue one over its own work and choose the recipient scope, in the object M1 itself calls its highest-risk one |
| **The `HandoffAcceptance` name** | **AT-M1-01.** The registry already has that record, owned by S1-C07, with a different state set and a human-only command |
| **The cost figure in a forbidden unit** | **AE-M1-01.** Relabelled with its unit and its non-conformance, or dropped |

### 3.5 From M2 — standing accountability (layer 5)

**Kept.**

| Mechanism | The problem it solves | What proved it |
|---|---|---|
| **The lapse rule** — reserved-but-unconsumed allowance is destroyed at the reset, so a reservation is priced as **waste, not thrift** | **AT and AE: "the only correct costing of a reservation under a non-rolling allowance anywhere in the round."** | AE and AT §E.2 · R8 §3 |
| **Separable reachability** — a party an outsider can reach *by name*, without knowing the company's internal topology | It is not a consequence of memory or of reservation, and CAP-42 is carried by that property alone. **AC: "M2 is right that reachability is separable; M4 is right that carried memory is unsupported. Those are compatible."** | AC §7.4 · review D CH-03 |
| **The monotonic-exposure check** | **"The only concrete mechanism against the autonomy ratchet in any candidate."** Extended per AS-M2-02 to diff *effects releasable without a human*, not the declared ceiling | AT §E.2 · AS-M2-02 · R8 §8 |
| **The fresh-holder arm** — incumbent holder against a freshly bound one, same pool, five attributable trials, chance-corrected, two-consecutive-quarter stopping rule, owner not the subject | **AT: "the best-specified removal test in the round… should be lifted whatever is selected."** It becomes the removal test for layer 5 | AT §E.2 |
| **The three-act refund separation** — decision, release, **discharge**, with discharge the customer's | An internal status never discharges an external standing, and this is the mechanism that keeps the founder-acceptance load to the *acceptance* act alone | AC §E.2 · `02-architecture-selection.md` §6 |
| **The pre-declared shed minimum** — a level declared in advance, never invented under pressure | It is what makes a holder's answer evidence rather than negotiation | AC §E.2 |
| **Typed Ref-only carried memory with no free-text field** | Where any state crosses work orders, there is nowhere for a plausible false statement to land; poisoning requires first creating a false canonical record | AS §E.2 · R2 F-04 · R1 F-10 |
| **M2's two refusals — no standing reviewer, no standing admitter** | A standing reviewer's carried record is a contamination channel rather than an asset, and a standing admitter could defend its own mandate against the admission narrowing the package requires | AS §E.2 · R7 F9 · R8 §8 |
| **A charter never vetoes** — "may negotiate, never veto; may not refuse admission narrowing; may not defend its own mandate" | **AE cites this as proof the obligation "was available to be written and is not an artifact of hindsight"**, against M4's veto | AE's closing · R8 §8 |

**Rejected.**

| Mechanism | The finding that killed it |
|---|---|
| **`CT-MEANING` as a chartered desk** | **AC-M2-01 — negative control §4 item 4 FAILED, which blocks on its own footing.** It is exercised by none of the six frozen fixtures, and §2.5 asserts "five duties pass" without applying its own three-part test to any of them individually. Knowledge validity and correction propagation bind instead to ephemeral production under C05 and C03, carried by the `freshness`, `correction` and `contradiction` interests |
| **Carried model memory as a property of a standing party** | **The central claim with zero supporting evidence**, and the two most-cited deployments refuse to support it — 14 failures, 3 inconclusive and 3 successes over 20 tasks in one, a reversal and rehiring in the other. M4 is right to refuse it and M2 carries the falsifier itself | R8 A-7 · AC §7.4 (dissent F-3) |
| **The chartered-capability table** | **AT-M2-01.** The narrowing claim is false for 6 of its 15 rows, four of which read "all five" — the opposite of a narrowing |
| **"Zero coordination cost per work order"** | **AE-M2-02.** Contradicted by M2's own decision probe, which runs inside the work order before every consequential action |

### 3.6 The "keep if rejected" mechanisms this synthesis DECLINES, with reasons

**SPECIFICATION.** Consolidation §E.2 lists mechanisms each review said to keep. Three are declined, and
each decline names the reason. Everything else on that list is kept above.

| Declined | Review that listed it | Why declined |
|---|---|---|
| **M2's `CT-INSTRUMENT` as a chartered desk holding the evaluation pools** | Implied by AT's and AX's instrument arguments | The *function* is kept — pool custody separated from every evaluated producer, with the calibration writer excluded from every producing path — but not as a **charter**. AX-M2-02 is the reason: a chartered instrument desk evaluated by nobody and accepted by the founder alone is a one-instrument chain with a measured human error rate and no second reading. Keeping it as a charter reproduces the shape AC-M2-01 failed. Kept as a role with a writer and a protected-change class instead |
| **M1's six existence reasons applied to *people and professionals*** | Implied by M1 §4.1's transfer analysis | Two of the six transfer, one changes meaning and two do not; and two reasons apply **only** to people — professional standing the act itself requires, and being a differently-correlated error source. Rather than extend the six, the synthesis keeps the existing five-way production rule of `02` §3 as the performer-type decision and uses the six reasons only for *model* workers. Extending them would apply a criterion to a unit where it returns undecidable, which is the failure R2 F-20 names [R2 TC-38 · R7 §8 F-6] |
| **M5's `next-action` interest as a distinct primitive** | M5 §2.1 | The *properties* are kept — named author, a **different** named approver, an explicit validity window, re-issued rather than edited, and planning not delayed for information that has not arrived — and they attach to the existing scheduler and `NextActionView` rather than to a new interest kind. R5-23 evidences the properties; nothing evidences a separate primitive, and layer 3 already computes relevance [R5-23 · TC-34] |

---

## 4. Why the alternatives lost

**SPECIFICATION.** No candidate lost on preference. Each row names the decisive evidence and what would have
to be true for that candidate to win outright.

### M1 — capability-differentiated ephemeral agents

**Decisive evidence.** M1 carries **nine blocking (d)s, the most in the round**, and two of them are
structural to its own shape rather than repairable details: the model-to-model consultation return is an
unfiltered channel into the identity holding the effect grants (**AS-M1-01**), and `ProjectionGrant` — the
object M1 itself calls its highest-risk one — has no issuing authority, so a worker can issue one over its
own work and choose the recipient scope (**AS-M1-02**). Both are consequences of M1's answer to the thesis:
many ephemeral workers that must consult each other and read each other's work. **AS-M1-04** states the
multiplier directly — six existence reasons multiply the channels the first finding travels on, and M1
concedes the direction. Separately, M1's own capacity finding defeats its own checkpoint rule: the
close-out predicate needs a denominator M1 says does not exist (**AT-M1-03**).

**What would have to be true for M1 to win.** That the consultation channel can be closed without a declared
procedure edge to close it on — that is, that a model-to-model return can be filtered by something other
than a loader delivering a declared read set. Nothing in the round supplies that mechanism, and the two
candidates with **no model-to-model channel at all** (M3, M5) carry zero propagation findings, which AS
records as the one divide in the round that is *not* inherited and therefore carries independent
information.

### M2 — chartered persistent agents

**Decisive evidence.** **AC-M2-01 is a negative-control failure and it blocks on its own footing** under
protocol §8, with no aggregate score to absorb it: `CT-MEANING` is a chartered desk exercised by none of the
six frozen fixtures, and §2.5 asserts that all five duties pass its three-part test without applying the test
to any of them individually. Underneath that, **the candidate's central claim carries no evidence at all**:
no source in the round measures whether persistent identity improves any outcome, and the two most-cited
deployments refuse to support it [R8 A-7]. M2 says so itself and supplies the falsifier. And M2's own §11
records that **if the founder's five criteria are a closed list, M2 is inadmissible on the founder's own
gate and should be withdrawn rather than argued**, because it rests on attributable identity and on a party
that outlives the work, neither of which is among the five.

**What would have to be true for M2 to win.** The fresh-holder arm would have to show a holder with a carried
record beating a freshly bound one on the same fixed pool, over two consecutive quarters, chance-corrected.
That experiment **runs at CP1 and is not blocked** — which is the strongest procedural thing M2 says about
its own weakest claim, and it is why the fresh-holder arm is kept as layer 5's removal test even though the
candidate lost.

### M3 — workflow-first, no agents

**Decisive evidence.** M3 returns **insufficient on W2 and W8**, and the causes are concrete rather than
philosophical. Deleting `AgentTemplate` and `AgentInstance` leaves **52 and 50 dangling registry references
with no migration**, and the deletion is irreversible-tier (**AT-M3-01**). Four of eleven primitives are
existing registry records renamed with no mapping, which AT calls **"a partial false closure on negative
control §4.1"** (**AT-M3-02**) — the one split control result in the round. And M3's founder-attention load is
the design's central cost and is **counted nowhere**: 19 of 46 capabilities name the founder, 13 more an
unspecified human, and every outward artifact needs a human acceptance (**AC-M3-02**, a (d)). Beyond that,
S1.0 absorbs unanticipated substructure cheaply inside a performer and M3 must declare it or route it to a
person — which M3 names as **its own largest real loss**.

**What would have to be true for M3 to win.** That declaring substructure in advance is affordable for
whole-company work. M3 states this as a **HYPOTHESIS, not established**, and notes nobody has measured either
side. Its structural properties are so strong that the synthesis takes its execution model whole; what it
could not carry is the rest of the package.

### M4 — hybrid by consequence class

**Decisive evidence.** M4 returns **insufficient on W1, W2, W4, W6, W10 and W12 — six, the most in the
round** — and its central primitive is the cause of three of its (d)s. `max()` over contributing dimensions
converts six predicates into a total rank, which `02-authority-recovery.md` §4 forbids by name, and it drops
C2's human requirement on a C2∧C3 refund message (**AT-M4-02**). M4's own derivation makes **every provider
prompt a C2 effect and therefore a C04 release**, so every worker's every turn is a C04 transaction
(**AS-M4-01**). Whether an outward artifact "carries a promise" is **not computable from any of the four
permitted derivation inputs**, and the whole outward-communication column depends on it (**AT-M4-01**). On
top of that, a person is the acceptor on **37 of 46 capabilities** and M4 does not say who that person is
(**AC-M4-01**), and H9's alternate is unnamed and, in a one-person company, unfillable (**AC-M4-02**).

**What would have to be true for M4 to win.** The §4.1 table would have to be **proved monotone in both the
ACCEPT and the May-PREPARE columns**; AT supplies a counterexample in each, so the proof as stated fails, and
whether a repaired table exists is open. The synthesis does not need that proof, because it takes the **set**
and never computes a rank.

### M5 — subscription-activated capabilities around a shared record

**Decisive evidence.** M5 returns **insufficient on W1, W2, W6, W8 and W10**, and its two security (d)s are
both promotion paths: an activation may promote an entry's trust class on a model's judgement of the
attacker's own text (**AS-M5-01**), and a trial interest may declare `writer_keys`, so a model-authored
object reaches the permission boundary over the record with no human in the loop (**AS-M5-02**). M5's own
sharpest falsifier — **the fraction of the company's conditions expressible as deterministic typed
predicates** — carries no evaluation protocol while six less consequential questions do (**AE-M5-01**), and
M5 states plainly that if that rule were relaxed for even one precondition class it would become the most
expensive candidate in the round. W8 is insufficient because the merge interest, the only named detector for
M5's acknowledged semantic-conflict gap, is forbidden by M5's own hard rule (**AT-M5-03**).

**What would have to be true for M5 to win.** The deterministic-predicate fraction would have to be measured
and be high. That measurement is cheap and unrun. The synthesis takes arming as layer 3 *and carries M5's
falsifier as its own*, with the withdrawal threshold routed as a founder parameter — because taking the
mechanism without taking the falsifier would be the failure AE-M5-01 names.

---

## 5. Disposition of every finding

**SPECIFICATION.** All **111** ids from [`04-attack-consolidation.md`](04-attack-consolidation.md) §B. No
finding is silently dropped. Dispositions:

- **`inherited → repaired-by R-nn`** — the synthesis keeps the targeted mechanism, and the named rule closes
  the finding. The rule is stated in §5.1 below.
- **`inherited → open`** — the synthesis keeps the mechanism and the finding is **not** closed; owner,
  deadline and class are given.
- **`inherited (strength)`** — kept as recorded; no repair is owed.
- **`rejected-with-candidate`** — the targeted mechanism is not kept, so the finding does not transfer.
- **`not-applicable`** — the finding cannot arise in the synthesis; the reason is stated.

Where a rule closes the *mechanism* but its *occupant* is a founder decision, the row reads
**`repaired-by R-nn; occupant open under MD-nn`** and is counted under repaired, with the open dependency
named. A rule that depends on a founder answer is not a closed finding until the answer arrives, and §6 says
which answers those are.

### 5.1 The synthesized rules

**SPECIFICATION.** Layer rules `R-L1`…`R-L5`. Missing-decision rules `R-D01`…`R-D24` (§6). Uniform-gap rules
`R-G01`…`R-G15`. Additional repairs `R-X01`…`R-X27`.

**Layer rules.**

- **R-L1 · Consequence class governs, as a set.** Every action carries the **set of routing classes it
  reaches**, computed by one deterministic function from resolved parameters, the destination and egress
  identity, the selector closure over conflict claims / deletion scopes / open obligations, and the owning
  capability contract's declared floor. **Every reached class's gates apply.** No total rank exists, no
  seventh class is added, and no severity score is computed. The class is recomputed inside the ordered
  release transaction on the frozen bytes; a mismatch **parks** and never resolves downward. The
  `ConsequenceDerivation` record is append-only, written only inside the release path.
- **R-L2 · A declared procedure governs how, and what each step may see.** Work runs as steps of an
  immutable versioned procedure. Each step declares its kind, its **read set**, its grants, its validator and
  its branch set; the loader delivers the read set and records what it actually delivered, and the caller's
  claimed read list is not trusted. A guard is a pure function over typed outputs and journal state; a
  model's output is an input to a guard and never a jump. The step boundary is the checkpoint. One effect per
  effect step.
- **R-L3 · Typed standing interests govern when.** Relevance is a computed, unstoppable armed set, evaluated
  by deterministic code over typed fields after every committed transition. **No precondition may invoke a
  model.** An interest arms only when every declared prerequisite holds simultaneously, unexpired,
  uncontradicted, and at or above its required trust class. Admission is bounded to five verbs — admit,
  defer, shed, refuse, rank — and five prohibitions, one of which is that the admitter may not accept work it
  admitted.
- **R-L4 · An `ExistenceJustification` governs whether a worker may exist.** A model worker is created only
  against a record naming **exactly one** of six admitted reasons, the unit that reason predicates on, a test
  that can return false, the alternative considered, a removal criterion and an expected cost in `07` §6
  units. Specialized knowledge is refused as a reason. Attributable identity is mandatory for every worker
  and is never a reason.
- **R-L5 · Standing accountability is a record, not a memory.** A standing holder exists for a duty class if
  and only if all three hold: the duty's clock can run while no case is admitted; an outside party has a
  right to reach the company about it; and the duty survives closure of the work that created it. A holder is
  an address, a mandate, a reservation, an alternate, a suspension procedure and a review date. **It never
  produces, never releases, never decides the matter it is the subject of, and carries no model memory.**
- **Precedence.** Lower-numbered layers govern. Class may raise what a procedure permits and never lower it;
  an interest may arm but never admit above its effect class; an existence record may refuse a worker the
  class would permit but never create one the class forbids; a holder may hold but never act.

**Uniform-gap rules (G-01…G-15).**

| Rule | Closes | The rule |
|---|---|---|
| **R-G01** | G-01 | **The exhaustion rule is distinct from the pressure rule.** When the allowance is empty and a due obligation falls due, the named non-model production mode in `07` §6 (manual and other-provider paths) performs it; a named recipient is alerted; and the breach-or-perform decision leaves a record naming which was chosen and why. "Fifty percent of an empty bucket is zero" is the case this rule exists for |
| **R-G02** | G-02 | = **R-D11** (acceptance-criteria authorship) |
| **R-G03** | G-03 | **`04-human-operation.md` is the inherited founder-competence mechanism, named by file and by record** — `ParticipationPlan`, `ParticipationEncounter`, `DomainAssessment`, `AuthorityMatrix`, `DecisionPacket`, `GrievanceCase` — with all four encounter kinds adopted (customer, taste, financial, intervention) on `04`'s fixed cycle rather than only after an absence. **Exactly two deltas** are declared: the re-entry brief's omissions-and-contests section, and the adverse-sample refusal-rate row. Any further delta is a decision packet |
| **R-G04** | G-04 | **X14 has an owner and it is the founder**, because it is an account inspection and not an experiment: whether the concurrency pin is a provider constraint or self-imposed policy is settled by reading the account entitlement. Until it is read, four claim verdicts stay unmeasurable and the round says so rather than raising the pin to find out, which is circular |
| **R-G05** | G-05 | **The founder-facing transfer is typed.** The re-entry brief and every founder return are a deterministic projection plus one model step validated field-by-field against that projection, **and** carry a `ConstraintSet` in the same schema as every machine transfer, with the omissions section rendered rather than narrated |
| **R-G06** | G-06 | **A supersession walks the closure.** Superseding an entry arms an interest over the transitive closure of `derived` entries naming the superseded value; each reopened `AcceptanceState` is re-decided or flagged. The *sizing* measurement remains owed (see §5.2, AS-M3-03) |
| **R-G07** | G-07 | **The metered flip is priced as a capacity event, not only a money and policy event.** Enabling credits drops the prompt-cache lifetime from an hour to five minutes; that drop is carried in the capacity row that the `credit-setting` observation writes |
| **R-G08** | G-08 | = **R-X16** (width ceiling over distinct read sets) |
| **R-G09** | G-09 | = **R-X15** (the policy object as a record; positive control on grant removal) |
| **R-G10** | G-10 | **Every record name in the amendment resolves against `contracts/record-registry.json` before the amendment is authored.** A name collision is a lint failure, not a review finding. Four of AT's nine (d)s existed only because the registry was resolved rather than trusted |
| **R-G11** | G-11 | **What proceeds while capability approval is pending is graduated by effect class** (M5's rule): read-only and internal-artifact capabilities on an expiring bounded trial under a standing mandate; outward-draft and outward-release require a human approver. Who that approver is, and its ceiling, is **MD-03** |
| **R-G12** | G-12 | = **R-X23** (F-2's disposition sits in the fixture answer) |
| **R-G13** | G-13 | **FAL-02 is restated at reduced strength wherever it appears.** The cited source reads *"DESIGN PROPOSAL. Native job **default**: one launch, ≤360 s"*, and the same section admits a persistent native profile using `--resume`. It is a default carried as a design proposal, not a contract ceiling |
| **R-G14** | G-14 | **The repository's existence-and-drift citation check runs over `research/F2/**` and `planning/F2/**` before the builder consumes this record** — existence blocking, drift warning, which is the repository's own decided posture |
| **R-G15** | G-15 | **A self-audit walks protocol §5's ten examples and then names what that frame excludes.** The checklist is the coverage, and a §11 that reports only against the checklist has reported its own frame |

**Additional repairs (X-rules).**

| Rule | Closes | The rule |
|---|---|---|
| **R-X01** | AT-M1-04 | An executor's grant scope is a **proposal right**; C04 performs every release. One sentence, and layer 1's release column is the only statement of it |
| **R-X02** | AT-M3-02, AT-M5-02 | **No record is renamed.** New content lands as fields on existing registry records, and an **alias table** publishes every candidate name against its registry name |
| **R-X03** | AT-M4-03 | "A holder prepares" means **an ephemeral worker instantiated under the holder's mandate, carrying the holder's reservation ref and intake address and nothing else of the holder's** |
| **R-X04** | AT-M3-04 | The adaptive envelope's author is the **capability owner at procedure admission**, and `unclassified-work/v1`'s envelope is written out: step kinds `{compute, model, human}`; read set = the work record plus its cited sources; effect classes = **none**; one launch per step; a declared maximum step count |
| **R-X05** | AT-M3-05 | The collapse threshold and the retirement window are **one parameter**, owned by the capability owner, declared per procedure at admission. Two numbers for one concept is what produced the finding |
| **R-X06** | AT-M5-04 | The prohibition yields: the ordered custody resolver **skips the admitting identity** and continues to the next tier, recording `custody_tie_break_reason = admitter_excluded` |
| **R-X07** | AC-M1-04, AC-M5-01 | The capability binding is **per capability, never grouped**, and every standing structure publishes its `capability_refs`. No column rule excludes a row from coverage |
| **R-X08** | AC-M1-05 | Closure inventories a **funded remedy reserve** alongside the custodian, or records `closed_with_residuals` with the funding gap named as a surviving duty |
| **R-X09** | AC-M3-02, AC-M4-01, AC-M5-02, AE-M4-05 | **Every acceptance-owner role is a record** with a reachability route, a capacity reservation, an alternate and a review date; **admission in that duty class stops while it is unfilled.** Holder review is priced: a review-period length and an estimated holder-hours-per-period figure with its denominator, plus a stated behaviour when holder review collides with a pressure window. This is M3's own rule applied where M3 did not apply it |
| **R-X10** | AE-M1-04, AE-M2-05, AE-M2-06, AE-M4-04 | **An attempt ceiling per work order with a named owner (C02) and a stated behaviour at the ceiling** (park with owner and deadline); bounded retry by error class with a `Blocker` on two failures with the same cause; `no_progress` as a terminal error class with a named recipient; and a **progress predicate on a reserved lane** — a named recipient is told when a lane's consumption carries no accepted outcome across a reset window |
| **R-X11** | AE-M2-03 | An **evaluation-capacity row** in `07` §6 units, and a stated behaviour when the evaluation cycle collides with a capacity-pressure window: evaluation sheds at the maintenance tier, and a shed evaluation cycle is a **recorded instrument gap**, never a silent skip |
| **R-X12** | AE-M3-03 | **An expected-launch count per procedure version, checked against actual at run close**, and D-06 written out with baseline, unit, repetition, stopping rule and owner. This is the synthesis's dominant unpriced cost because it takes the step model, and it is not softened |
| **R-X13** | AX-M2-04, AX-M3-01, AX-M4-01 | **Per-item trust level is a required manifest field**, not a per-record one, as DIRECTIVE §8.12 names |
| **R-X14** | AS-M1-03, AX-M2-02 | The calibration writer is **C06 or a dedicated instrument custodian excluded from every producing path**; a calibration write is a protected change (C5); instrument readings carry their own paired clean case and a deterministic reproduction path, so founder acceptance of a reading is a check of a computation |
| **R-X15** | AS-X-02, G-09 | The external policy object is a **record with a named writer (C04) and a protected-change class (C5)**, and the launcher's tool-grant stripping carries a **positive control**: a probe skill declaring a tool grant whose arrival at the enforcement point is a failure. This closes the asymmetry AS names — three candidates gave delivery a positive control and none gave removal one |
| **R-X16** | AS-X-04, G-08 | **A width ceiling per attempt, owned by C01 with the same checkpoint as the depth ceiling, expressed over distinct read sets rather than over cost.** Fifty sequential consultations each individually cheap sit inside one budget and are a fan-out incident |
| **R-X17** | AS-M2-01, AS-M4-05 | **A per-counterparty and per-origin-channel sub-cap on every published intake**, and a cap-exhaustion behaviour that **preserves intake**: overflow to a named destination with an alarm and a reader. A full cap at the one object whose purpose is guaranteed reachability refuses the next legitimate complainant |
| **R-X18** | AS-M2-02 | **Every approval carries an expiry**, and the monotonic-exposure diff is over **effects releasable without a human**, not over the declared ceiling |
| **R-X19** | AS-M3-01 | Procedure admission **refuses a branch set in which a model-authored value selects between acceptance strengths** for one artifact. Acceptance-strength selection is a guard over journal state and consequence class |
| **R-X20** | AS-M5-04 | A `check` interest's precondition reads **only fields the producer could not author**, and the tie-break for check interests **inverts to strongest sufficient** |
| **R-X21** | AS-M5-03 | The admission authority gains one refusal predicate it lacks — **a per-origin arming rate** — and T07's evaluation protocol is restated inside the specification rather than cited |
| **R-X22** | AE-M1-01 | Any external cost multiple carries **its unit and its TC-26 non-conformance label**, is re-expressed in `07` §6 units, or is dropped |
| **R-X23** | AE-M3-02, AE-M5-04, G-12 | **F-2's disposition sits in the fixture answer**, not two sections away: not executable at CP1, measurement owed, blocked on a reviewed `CapacityPlan` revision, with the named owner of that revision decision |
| **R-X24** | AE-M3-01, AE-M4-03 | **A cross-class release at a declared lapse point**, with a stated precedence for which class receives released capacity — due service, then continuity/security/grievance, then maintenance and evaluation, then ordinary creation, then discretionary — and a recorded quantity of allowance that lapsed unconsumed per lane per window. **Independent of any holder's consent** |
| **R-X25** | AE-M5-01 | The **deterministic-predicate fraction** is measured with a baseline, a unit, a stopping rule and an owner, **and a stated threshold below which layer 3 is withdrawn rather than relaxed.** The threshold's value is a founder parameter and is open |
| **R-X26** | AE-M1-05 | **A removal criterion for every new record, in the table that introduces it**, in §9.2's falsifier form. "Every mechanism carries a removal criterion" is asserted nowhere; it is discharged row by row |
| **R-X27** | AX-M2-01 | The typed-member rule extends from any carried record to **every transfer the fixtures name**, including the work-order dispatch and the founder-facing brief |

### 5.2 The table — all 111

**AT · A-technical · 22**

| id | class | disposition |
|---|---|---|
| AT-M1-01 | d | **inherited → repaired-by R-D17.** The interval mechanism is kept in M4's shape; the record is named `AcceptanceInterval`; the registry's `HandoffAcceptance` stays S1-C07's. No registry amendment, no irreversible-tier change |
| AT-M1-02 | d | **inherited → repaired-by R-D18.** A field is critical if a `ParameterAuthority` governs it, if it is a `ConstraintSet` member, or if the procedure declares it in `critical_fields` at admission by the capability owner |
| AT-M1-03 | d | **inherited → repaired-by R-D19.** The step boundary is the checkpoint (R-L2). The denominator M1 needed does not exist and is not needed |
| AT-M1-04 | a | **inherited → repaired-by R-X01** |
| AT-M1-05 | b | **not-applicable.** The reviewer verified the inherited `05` §3 migration rule and withdrew its own drafted finding. There is no defect to inherit; the rule is retained unchanged |
| AT-M2-01 | a | **rejected-with-candidate.** The chartered-capability table is not kept; the synthesis has no charter column |
| AT-M2-02 | c | **rejected-with-candidate** for charter persistence. The §9.1 fresh-holder arm is **kept** as layer 5's removal test, per AT's own "lift it whatever is selected" |
| AT-M2-03 | d | **inherited → repaired-by R-D09.** Admission-narrowing is the behaviour when a standing acceptance role is unfilled, and R-D09 gives it a predicate and a computing party |
| AT-M2-04 | a | **not-applicable.** There are no desks. One standing holder exists per duty class by R-L5's conjunction; overlap resolves through `03`'s custody resolver, which already supplies a terminal ordering |
| AT-M3-01 | d | **rejected-with-candidate.** `AgentTemplate` and `AgentInstance` are retained; the deletion is not kept, so ~50 dangling references never arise |
| AT-M3-02 | a | **rejected-with-candidate → R-X02.** Nothing is renamed. **This also disposes of the split control-1 result**: the record layer cannot fail a rename control when no record is renamed |
| AT-M3-03 | d | **inherited → open.** The pre-endorsed shed order is kept and nothing may currently halt it. Owner **founder**, routed as **MD-07**; class **(d)**; deadline: before any `CapacityPlan` revision that raises CP1. *Not urgent — the fixture that needs it cannot run at CP1* |
| AT-M3-04 | a | **inherited → repaired-by R-X04** |
| AT-M3-05 | a | **inherited → repaired-by R-X05** |
| AT-M4-01 | d | **inherited → repaired-by R-D21.** CAP-13/14/15/16 floor at C3; a promise is floored by the capability, never computed from a draft |
| AT-M4-02 | d, severity contested | **inherited → repaired-by R-D22.** The **set** of reached classes governs. **The severity dispute is moot for the synthesis** because nothing computes a total rank; it is not settled as a general question about M4 (dissent F-2) |
| AT-M4-03 | a | **inherited → repaired-by R-X03** |
| AT-M4-04 | a | **inherited → repaired-by R-D01T; occupant open under MD-01.** The terminal standing custodian is the out-of-set terminal for every class, and **until it is named the class is unadmittable** |
| AT-M5-01 | d | **inherited → repaired-by R-D23** |
| AT-M5-02 | a | **inherited → repaired-by R-X02** |
| AT-M5-03 | d | **inherited → repaired-by R-D24** |
| AT-M5-04 | a | **inherited → repaired-by R-X06** |

**AC · A-company-human · 26**

| id | class | disposition |
|---|---|---|
| AC-ALL-01 | b | **inherited → repaired-by R-G03.** `04-human-operation.md` is named as the inherited mechanism; all four encounter kinds adopted; exactly two deltas declared |
| AC-M1-01 | d | **inherited → open. MD-03**, founder packet; class (d); deadline: before the first declared founder absence |
| AC-M1-02 | d | **inherited → open. MD-01**, founder packet; class (d); deadline: before the first admitted work order in a class whose harm no mandate covers |
| AC-M1-03 | d | **inherited → repaired-by R-D05.** The acceptance rule is a property of the evidence; presence is deleted from it |
| AC-M1-04 | b | **inherited → repaired-by R-X07.** CAP-22 and CAP-41 name an internal standing acceptance owner with the professional as a consulted determination |
| AC-M1-05 | b | **inherited → repaired-by R-X08** |
| AC-M1-06 | a (strength) | **inherited (strength).** The profile-convergence probe is kept and is the synthesis's own negative control against layer 4 |
| AC-M2-01 | control failure, blocks | **rejected-with-candidate.** `CT-MEANING` is not chartered. CAP-32 and CAP-34 bind to ephemeral production under C05 and C03, which is the contract AC required. **The control failure does not transfer, because the mechanism does not** |
| AC-M2-02 | b | **not-applicable.** There are no charter predicates; every duty's acceptance owner resolves through `03`'s ordered resolver, which is the contract AC asked for |
| AC-M2-03 | d | **inherited → repaired-by R-D06** |
| AC-M2-04 | b | **inherited → repaired-by R-G03** |
| AC-M2-05 | b | **inherited → repaired-by R-D05** |
| AC-M2-06 | a (strength) | **inherited (strength) as method.** Its substance is carried: §2.1 states that if the founder's five criteria are a closed list, layer 5 and layer 4's reason list are inadmissible on his own gate |
| AC-M3-01 | d | **inherited → repaired-by R-D10** |
| AC-M3-02 | d | **inherited → repaired-by R-X09; occupant open under MD-02.** The mechanism — a staffing precondition with admission stopping — is closed; who is staffed is the founder's |
| AC-M3-03 | b | **inherited → repaired-by R-D06** |
| AC-M3-04 | a (strength) | **inherited (strength) as method.** §11 of the amended chapter walks all ten controls individually and then names what the frame excludes (R-G15) |
| AC-M4-01 | d | **inherited → repaired-by R-X09; occupant open under MD-02.** And the honest branch is taken explicitly: **C3 acceptance is unsampleable**, so the per-week count is what MD-02's packet carries rather than a sampling rule |
| AC-M4-02 | d | **inherited → open. MD-02**, founder packet; class (d). Design half decided: the founder's own holder is a **declared exception** with the parking behaviour stated as the consequence, rather than a role with fictional funding |
| AC-M4-03 | d | **inherited → repaired-by R-D04M; assessor open under MD-04.** `04`'s fixed mechanism governs — a competent assessor states the proposition and the owner contests it. The owner is not the acceptor |
| AC-M4-04 | b | **inherited → repaired-by R-G03** |
| AC-M4-05 | a (strength) | **inherited (strength).** The CAP-39 closure interlock is kept and composed with the unretirable grievance interest, exactly as AC §7.2 names |
| AC-M5-01 | b | **inherited → repaired-by R-X07** |
| AC-M5-02 | d | **inherited → repaired-by R-X09; occupant open under MD-02** |
| AC-M5-03 | b | **inherited → repaired-by R-D06** |
| AC-M5-04 | a (strength) | **inherited (strength) as method.** MD-01 is routed as a packet, not carried silently |

**AE · A-economic-capacity · 24**

| id | class | disposition |
|---|---|---|
| AE-M1-01 | b | **inherited → repaired-by R-X22.** Applied to this artifact's own §8 |
| AE-M1-02 | b | **inherited → repaired-by R-G01** |
| AE-M1-03 | b | **inherited → repaired-by R-D20 + R-G07** |
| AE-M1-04 | b | **inherited → repaired-by R-X10** |
| AE-M1-05 | c | **inherited → repaired-by R-X26** |
| AE-M2-01 | d | **inherited → open. MD-08**, founder packet; class (d); deadline: before the first `ShedNegotiation`. *Not urgent — it cannot run at CP1* |
| AE-M2-02 | b | **not-applicable.** The synthesis makes no zero-coordination-cost claim. §8's F-2 row reads one decision probe per consequential action, in `07` §6 units, charged to the arm that requires it |
| AE-M2-03 | c | **inherited → repaired-by R-X11** |
| AE-M2-04 | b | **inherited → repaired-by R-D20** |
| AE-M2-05 | c | **inherited → repaired-by R-X10.** Layer 3 is exactly the mechanism that can loop, so the progress predicate is load-bearing rather than defensive |
| AE-M2-06 | b | **inherited → repaired-by R-X10** |
| AE-M3-01 | b | **inherited → repaired-by R-X24** |
| AE-M3-02 | b | **inherited → repaired-by R-X23** |
| AE-M3-03 | c | **inherited → repaired-by R-X12.** *The synthesis takes the step model and therefore takes its dominant unpriced cost. This row is not softened* |
| AE-M3-04 | b | **inherited → repaired-by R-D20.** Quarantine is the response; "the only one available" is dropped |
| AE-M4-01 | d | **rejected-with-candidate.** The veto is not kept: a holder's stated minimum is evidence, never consent. **Who may halt or reverse a shed in the moment remains open under MD-07** |
| AE-M4-02 | b | **inherited → repaired-by R-D20** (metered half). The veto half is **not-applicable**, the veto being rejected |
| AE-M4-03 | b | **rejected-with-candidate → R-X24.** Consent-conditional return is replaced by a time-triggered lapse independent of the holder |
| AE-M4-04 | b | **inherited → repaired-by R-X10** |
| AE-M4-05 | c | **inherited → repaired-by R-X09; the hours figure is owed and is part of MD-02's packet** |
| AE-M5-01 | c | **inherited → repaired-by R-X25; the withdrawal threshold's value is open as a founder parameter** |
| AE-M5-02 | c | **inherited → repaired-by R-X10 + R-X21.** The per-cause allowance is expressed in `07` §6 units per cause class, owner C02, with a recorded count of causes that exhausted it in a window |
| AE-M5-03 | b | **inherited → repaired-by R-G01** |
| AE-M5-04 | b | **inherited → repaired-by R-X23** |

**AX · A-context-evidence · 14**

| id | class | disposition |
|---|---|---|
| AX-M1-01 | b | **inherited → repaired-by R-G05** |
| AX-M1-02 | c | **inherited → repaired-by R-G06 (mechanism); measurement open.** Owner **C06**; class (c); deadline: before the first accepted outward release whose evidence closure includes a superseded value |
| AX-M1-03 | b | **not-applicable to the design; inherited by the instrument → repaired-by R-G14** |
| AX-M2-01 | b | **inherited → repaired-by R-X27** |
| AX-M2-02 | c | **inherited → repaired-by R-X14** |
| AX-M2-03 | a | **not-applicable.** No charter-delta count exists in the synthesis |
| AX-M2-04 | b | **inherited → repaired-by R-X13** |
| AX-M3-01 | b | **inherited → repaired-by R-X13** |
| AX-M4-01 | b | **inherited → repaired-by R-X13** |
| AX-M4-02 | b | **not-applicable to the design.** This artifact's provenance header names every file it observed. Preserved as dissent F-8(i), which AX itself declines to settle |
| AX-M5-01 | c | **inherited → repaired-by R-G06** |
| AX-M5-02 | b | **not-applicable to the design.** R4 F11 is cited beside R3 F46 wherever progressive scope is claimed, and MCP's request-every-scope fallback is refused for this system, because the defence for it assumes away exactly what a typed work order supplies |
| AX-M5-03 | a | **not-applicable to the design.** Link paths in this artifact resolve; R-G14 is the mechanism, not a one-time fix |
| AX-ROUND-01 | b | **inherited by the round → repaired-by R-G14.** Owner: the agent authoring the amendment; deadline: before the builder starts |

**AS · A-security-adversarial · 25**

| id | class | disposition |
|---|---|---|
| AS-X-01 | d | **inherited → repaired-by R-D11.** The capability owner authors the acceptance criteria at procedure admission; they are versioned and frozen before the producing step starts; the producing path may neither author nor amend them; F-4 gains a **fourth arm** in which they are authored by the producing path. **This is the resolution of dissent F-5** |
| AS-X-02 | b | **inherited → repaired-by R-X15** |
| AS-X-03 | b | **inherited → repaired-by R-D12** |
| AS-X-04 | b | **inherited → repaired-by R-X16** |
| AS-M1-01 | d | **inherited (narrowed) → repaired-by R-D13.** A model-to-model channel exists only on a declared procedure edge; the return crosses the loader; typed outputs only; prose stored at a Ref and **not delivered** |
| AS-M1-02 | d | **inherited → repaired-by R-D14** |
| AS-M1-03 | b | **inherited → repaired-by R-X14** |
| AS-M1-04 | b | **inherited → repaired-by R-D13 + R-X16, read together.** The fix scales with worker count because the channel rule is per-edge and the width ceiling is per-attempt |
| AS-M2-01 | b | **inherited → repaired-by R-X17** |
| AS-M2-02 | b | **inherited → repaired-by R-X18** |
| AS-M2-03 | b | **inherited → repaired-by R-D20** |
| AS-M3-01 | b | **inherited → repaired-by R-X19** |
| AS-M3-02 | b | **inherited → repaired-by R-D10.** A per-class ceiling; at C4/C5-equivalent effects the founder or a professional, never the unclassified custodian alone |
| AS-M3-03 | b | **inherited → open.** The blast radius of a false entry in a trusted record is unmeasured and the containment is a person measured at 5–65% agreement. Owner **C06**; class **(c)** with its protocol named; deadline: before the first accepted outward release derived from a `derived` entry. **This is the residual that survives the synthesis's strongest mechanism and it is recorded as surviving** |
| AS-M3-04 | b | **inherited (reversed) → repaired-by R-D12.** The synthesis *claims* the discharging construction rather than denying the claim: a model call is a pre-authorised C2 release gated by projection conformance |
| AS-M4-01 | d | **inherited → repaired-by R-D12** |
| AS-M4-02 | b | **inherited → repaired-by R-DER** *(= R-L1's writer clause: the derivation record is written only inside the release path, `mismatch_disposition` is writable only by the party owning the park, and the record is append-only)* |
| AS-M4-03 | b | **inherited → open.** Composition across unjoined records is unsolved. Owner **C04**; class **(b)**; exit condition: a cross-episode composition detector specified before the first C3 release arising from a multi-episode campaign. **AS calls this the one an adversary uses, and it is not softened** |
| AS-M4-04 | b | **inherited → repaired-by R-D20** |
| AS-M4-05 | b | **inherited → repaired-by R-X17** |
| AS-M5-01 | d | **inherited → repaired-by R-D15** |
| AS-M5-02 | d | **inherited → repaired-by R-D16** |
| AS-M5-03 | c | **inherited → repaired-by R-X21 + R-X10** |
| AS-M5-04 | b | **inherited → repaired-by R-X20** |
| AS-M5-05 | b (strength) | **inherited (strength).** The `credit-setting` interest is kept, correctly disclosed as observation and not prevention, and it is R-D20's mechanism |

### 5.3 Counts

| Disposition | Count |
|---|---|
| **inherited → repaired-by a named rule** | **81** |
| …of which carry an **open founder dependency** (occupant or parameter) | 6 — AT-M4-04, AC-M3-02, AC-M4-01, AC-M4-03, AC-M5-02, AE-M4-05 (+ AE-M5-01's threshold) |
| **inherited (strength), no repair owed** | **6** — AC-M1-06, AC-M2-06, AC-M3-04, AC-M4-05, AC-M5-04, AS-M5-05 |
| **inherited → open** | **8** — AT-M3-03, AC-M1-01, AC-M1-02, AC-M4-02, AE-M2-01, AX-M1-02, AS-M3-03, AS-M4-03 |
| **rejected-with-candidate** | **7** — AT-M2-01, AT-M2-02, AT-M3-01, AT-M3-02, AC-M2-01, AE-M4-01, AE-M4-03 |
| **not-applicable** | **9** — AT-M1-05, AT-M2-04, AC-M2-02, AE-M2-02, AX-M2-03, AX-M4-02, AX-M5-02, plus **AX-M1-03 and AX-M5-03**, which are inapplicable to the design and are carried by the instrument repair R-G14 |
| **Total** | **111** |

*Reconciliation: 81 + 6 + 8 + 7 + 9 = 111. The per-review totals also reconcile against the consolidation's
own counts: 22 technical, 26 company, 24 economic, 14 context, 25 security.*

**What still blocks.** Protocol §8 makes any (d) block the layer, with no aggregate score to absorb it. Of
the **28** (d)-class findings:

| | Count | Which |
|---|---|---|
| Closed by a named design rule | **21** | Four of them carry an open founder occupant — AC-M3-02, AC-M4-01, AC-M4-03, AC-M5-02 |
| Disposed by rejecting the targeted mechanism | **2** | AT-M3-01 (the deletion is not kept), AE-M4-01 (the veto is not kept) |
| **Still open, awaiting a founder answer** | **5** | AT-M3-03 (MD-07) · AC-M1-01 (MD-03) · AC-M1-02 (MD-01) · AC-M4-02 (MD-02) · AE-M2-01 (MD-08) |

Plus two (b)s escalated to named residuals with owners and exit conditions (**AS-M3-03**, **AS-M4-03**) and
one (c) whose mechanism is closed and whose measurement is owed (**AX-M1-02**). And the negative-control
failure **AC-M2-01** is disposed by not keeping the mechanism it lands on.

**The layer is therefore not accepted.** It is a scoped planning disposition: specified behaviour checked
offline against the frozen protocol, five (d)s open on founder decisions, two residuals with owners, the
fixed boundaries preserved and none reopened. That is the most protocol §8 permits a disposition to say, and
this record says no more.

---

## 6. The 24 missing decisions

**SPECIFICATION.** Every merged missing decision from consolidation §C, disposed as **`decided`** (the rule
is stated and what supports it is cited), **`design-decided-with-founder-parameter`** (the rule is stated,
the parameter is named and its default given), or **`founder-packet`** (the full DIRECTIVE §3 packet is
written). **Eighteen are decided here; six are packets.** Plus the two items the consolidation says the
synthesis must answer and no review does.

### 6.1 Decided by design — 18

| # | Rule | What supports it |
|---|---|---|
| **MD-05** · **R-D05** | **Acceptance is a property of the evidence, and the founder's presence is deleted from the rule.** What changes during an absence is one named thing: his absence removes the company's only error source uncorrelated with the model family's, so any acceptance resting **solely** on a same-family model judgement above the reversible-internal class completes to `submitted-pending-acceptance` and waits. That is a property of the evidence's residual, not of his calendar | AC's own contract, verbatim: *"state the acceptance rule as a property of the evidence and drop presence from it entirely."* The residual is R7 §8 F-6 |
| **MD-06** · **R-D06** | **Carry `03`'s existing fixed mechanism across, unchanged**: a `disputed_custodian` predicate read at `received → triaged`, with **absent-value-denies** semantics; plus a required independent-escalation route on every standing structure carrying external standing, with the two assignments **guarded to differ**. No candidate carried it across and one stated the requirement with no mechanism | `03`'s guard already exists and is already checked. This is transport, not invention |
| **MD-11** · **R-D11** | **The capability owner authors the acceptance criteria at procedure admission.** They are versioned and frozen **before** the producing step starts. The producing path may neither author nor amend them, and an amendment between admission and submission is refused by a guard. Fixture F-4 gains a **fourth arm** in which the criteria are authored by the producing path, reported beside the existing three | M3 decided this by construction and did not argue for it; AS raised it as the fourth unblinded channel that no lane named. §6.3 below resolves the AS/AX tension |
| **MD-12** · **R-D12** | **The model provider is a named C2 disclosure destination.** It carries a standing `DisclosureContract`; the loader's class-narrowed projection **is** the destination-clean construction that `02-authority-recovery.md` §8.2 already admits, and it discharges the contract; a model call is therefore a **pre-authorised C2 release gated by projection conformance**, not a C04 transaction per turn; and amending the contract is C5. **The "model calls are exempt" branch is refused**, so no founder packet is needed | `02` §8.2 already names destination-clean generation as one of two admissible constructions. The exempt branch would have relaxed a fixed boundary; taking the discharging construction does not. M3 has the mechanism and denied the claim; the synthesis claims it |
| **MD-13** · **R-D13** | **A model-to-model return exists only on a declared procedure edge, and it crosses the loader.** The receiving obligation-holder's delivered inputs are typed `ConstraintSet` members and typed outputs only. **Prose is stored at a Ref and is not delivered** | AS's required contract, verbatim. Two candidates have no such channel at all and carry zero propagation findings |
| **MD-14** · **R-D14** | **Issuing a projection grant is a C2 act released by C04.** `recipient_scope` and `purpose` resolve from a `ParameterAuthority`, never from the granting worker's text, and the grant is **re-read at every read of the derived projection**, including derivatives already written | AS's required contract. CP-84 says what a worker may read and names no issuer, which is the gap |
| **MD-15** · **R-D15** | **An activation may not promote an entry's trust class.** Promotion is an effect carrying its own consequence class, a **named non-model discriminator** runs before the write, and the writer is **not** the investigating activation. Plus the missing floor rule: **a derived entry's trust class is the floor of its inputs'** | AS's required contract. The two halves of M5's own text cannot both hold, and the contradiction is the laundering route |
| **MD-16** · **R-D16** | **A trial may not declare a writer key.** Writer keys are assigned only by the record authority and are **refused to any proposal**; a trial may write only into kinds whose writer is already "any activation"; the admission check is deterministic and **names the failed predicate** | AS's required contract; it reaches DIRECTIVE §8.22's protected set |
| **MD-17** · **R-D17** | **The registry's `HandoffAcceptance` governs, unchanged, owned by S1-C07.** The work-layer record is a distinct name — `AcceptanceInterval` — with its own state set `{declared_done, in_acceptance, accepted, rejected}`, an interval holder who is the producing structure's sponsor, inheritance of the reached class set and its deadline, and escalation to the standing holder at C3 and above. **No registry amendment; no irreversible-tier change** | AT's required contract offered two branches; the rename is the one that does not raise the change's tier |
| **MD-18** · **R-D18** | **A field is critical if a `ParameterAuthority` governs it, if it is a `ConstraintSet` member, or if the procedure declares it in `critical_fields`.** The marking authority is the **capability owner at procedure admission** — never the resuming attempt | AT's required contract: a named authority marking a field critical, recorded on the record, not decided at resume time |
| **MD-19** · **R-D19** | **The step boundary is the checkpoint, and the cost is carried.** Every step boundary is a close-out point; there is no separate reserved-closing-allowance predicate | AT's own second branch: *"an explicit statement that the system checkpoints every step boundary and carries the cost."* The first branch needed a denominator the round establishes does not exist |
| **MD-20** | **not-applicable.** `AgentTemplate` and `AgentInstance` are retained, so no registry reference dangles and no migration is owed | The deletion is `rejected-with-candidate` (AT-M3-01) |
| **MD-22** · **R-D22** | **An action satisfying several classes is gated by every reached class's gates.** The derivation returns a **set**, not a rank. No monotonicity proof is required because no ordering is used | This is `02-authority-recovery.md` §4 restated, not changed: *"An action may satisfy multiple classes and must meet all their gates."* Taking the set is what makes dissent F-2's severity question moot for the synthesis |
| **MD-23** · **R-D23** | **A standing interest may write only a `proposed` revision of a constraint.** `proposed → endorsed` stays C01's | AT's required contract; a one-line repair that removes the finding |
| **MD-24** · **R-D24** | **The semantic-conflict detector arms on a typed proxy, and the residue is recorded as undetected.** It arms when two accepted artifacts' `ConflictClaim` canonical business keys intersect, **or** when their declared promise members name one beneficiary. Where neither holds, **the gap is recorded as undetected** with the measurement owed to C06 | AT offered exactly two branches — name the typed proxy, or withdraw and record the gap. The synthesis takes **both**, because the proxy covers the shared-key cases and the residue is real |
| **AC-M2-01** | **Disposed by not chartering the desk.** Knowledge validity and correction propagation bind to **ephemeral production under C05 and C03**, carried by the freshness, correction and contradiction interests plus the existing knowledge custodian | AC's required contract offered exactly this second branch, and the first branch — exercise the desk in a frozen fixture — is unavailable, because writing a fixture now would be negative control §4.10 |
| **AS-X-01 / AX-W5** | **Resolved at §6.3 below** | — |
| **Control-cell questions** | **Resolved at §6.4 below** | — |

### 6.2 Design-decided with a founder-owned parameter — 4

| # | Rule | The parameter, and its default |
|---|---|---|
| **MD-09** · **R-D09** | **"Admissions narrow" is computed, not judged.** When a standing acceptance role is unfilled or suspended, **admission of new work in that duty class stops**, computed by the same predicate that resolves the acceptance owner. The computing party is C02, in the same protected transaction that would have admitted the work | **Parameter: the narrowing shape.** Default **class-stop** — admission in the affected duty class halts entirely. Alternative: a graded share. The founder owns this because narrowing policy is what the company stops taking on |
| **MD-10** · **R-D10** | **Work of an unknown kind gets a named `unclassified-effect` grant class** — per-authorisation, expiring, with a value ceiling and a human authoriser per effect, and a **per-class ceiling on what one unclassified-path custodian may authorise without a second party**. At the equivalent of the two highest classes, the founder or a professional. The omnibus standing grant is refused | **Parameters: the consequence ceiling and the value ceiling.** No default is invented; **until both are set, the class admits no effect steps at all** and unknown work terminates in a decision packet |
| **MD-21** · **R-D21** | **"Carries a promise" is not computed from a draft; it is floored by the capability.** CAP-13, CAP-14, CAP-15 and CAP-16 floor at the economic/contractual class. The alternative branch — a non-model step recognising an obligation inside a draft — is refused, because it puts a judgement inside the class derivation that layer 1's own rule forbids | **Parameter: which capabilities carry the floor.** Default: all four. Narrowing the set is a throughput trade and it is the founder's, because it decides how much outward drafting needs a person |
| **MD-14** (partial) | As above | **Parameter: the cross-venture disclosure ceiling** on a projection grant's recipient scope. No default; until set, a projection may not cross a venture boundary |

### 6.3 The AS-X-01 / AX-W5 tension, resolved

**DIRECT OBSERVATION.** AX judged W5 **sufficient for all five** and recorded **no (d) on W3, W5 or W14**.
AS raised **AS-X-01 as a (d)** against four of five, and it lands on the checker's delivered inputs, which is
W5's subject. The consolidation records that *"the dispositions are in conflict and no review owns the
reconciliation."*

**INFERENCE, and the resolution.** The two are **not in factual conflict**. AX tested the three channels R7
named — the producer's rationale, the producer's preferred conclusion, and the shared record — and found them
closed in all five. AS found a **fourth** channel that no lane named, and AS says so in its own words:
*"That is what a single shared source set costs."* Both findings are true, and the question is only which
disposition governs.

**It is the class, not the lane.** A finding's class under protocol §5 is a property of **the finding** — its
trigger, its resulting failure, its affected requirement, its missing decision — and not of whether the lane
that raised it owned the dimension. A (d) raised outside its dimension is still a (d), because an implementer
who meets an unauthored acceptance criterion will invent policy regardless of which reviewer noticed. So
**AS-X-01 blocks, and the synthesis closes it with R-D11.**

**And AX's five sufficients stand as to what they tested.** The synthesis therefore records W5 as
**sufficient on the three tested channels and unestablished on the fourth until the fourth F-4 arm runs**.
It does not record W5 as sufficient, and it does not overturn AX's judgement. **The discriminating test is
AS's own**: add a fourth arm in which the acceptance criteria are authored by the producing path, reported
beside the existing three. Owner: **C06**. Deadline: with the first F-4 execution, whenever a runtime exists.

**Why the synthesis is structurally better placed than four of the five candidates.** M3 was exempt because
its criteria sit in an immutable procedure accepted by a human capability owner. The synthesis takes that
construction as layer 2 and therefore inherits the exemption — **but not for free**, because it also admits
adaptive steps and unclassified work, where criteria are set by a person rather than pinned in an immutable
procedure. R-D11 covers both paths, and that is the part M3 did not have to write.

### 6.4 The two control-cell questions the consolidation says the synthesis must answer

**1 · Is a control that fails at one layer and passes at another a §4 failure?**

**DESIGN PROPOSAL, taken as a protocol reading rather than a fixture change, so control §4.10 is not
violated.** **Yes — it is a failure at the layer at which it fails, and the layer must be named.** A control
reported as "passed" without naming the layer it was applied at is exactly the shape §4 exists to catch: it
is an assurance whose scope is unstated. AT's split result on M3 is therefore a **real failure at the record
layer**, correctly identified, and its (a) classification understates it.

**The synthesis is not exposed to it**, because nothing is renamed: R-X02 keeps every registry record name
and lands new content as fields. Control 1 is applied to the synthesis at **both** layers below.

**2 · Control 4 was never applied to M3 or M4. Those cells are UNKNOWN.**

**DIRECT OBSERVATION.** Protocol §4's opening sentence — *"A candidate is not accepted until the round has
run these"* — is therefore **not satisfied for every candidate-control pair**, whatever the verdict matrix
says, and this record does not pretend otherwise. Two of fifty cells were never run.

**What the synthesis does instead of pretending.** It applies control 4 **to itself**, mechanically, and
states the result:

| Persistent or standing structure in the synthesis | The fixture that exercises it | Verdict |
|---|---|---|
| Standing holder for personal data and deletion scopes | **F-1** — the surviving deletion scope whose clock runs after the case closes | exercised |
| Standing holder for grievance and rights | **the responsibility probe** — a non-customer contests a harmful decision six months after closure, custodian implicated, founder absent | exercised |
| Standing holder for continuity and on-call | **F-6** — the day-five incident and the terminal of the escalation ladder | exercised |
| Standing holder for a reserved lane | **F-2** — the lane that must be shed, which a class has no representative to yield | **exercised only at 4×, which is not executable at CP1.** Recorded as **owed**, not as passed |
| Every other proposed standing holder | — | **Refused on sight.** A holder exercised by no frozen fixture is unjustified, which is the mechanical form of control 4 and is what M2 failed |
| Each admitted worker | its own `ExistenceJustification` unit and test | the test must be able to return false, or the worker is refused |

**The honest residual:** the reserved-lane holder is justified by a fixture that cannot be run at the current
concurrency pin. That is one structure resting on an unexecutable fixture, it is the same blockage that makes
four claim verdicts unmeasurable, and it is named rather than hidden. Its prerequisite is **R-G04**, an
account inspection.

### 6.5 Founder packets — 6

**SPECIFICATION.** Each packet carries every element DIRECTIVE §3 requires. **Two of the six are not urgent,
and saying so is more useful than manufacturing urgency:** MD-07 and MD-08 both gate a fixture that cannot
run at the current concurrency pin, so they are blocked behind a cheaper prerequisite — reading the account
entitlement (R-G04). **The real near-term ask is four decisions, and two of those are the same decision seen
twice.**

---

#### **MD-01 · Who is the terminal owner of an unowned duty or harm, and does that party exist as a record?**

- **Exact decision.** Name the standing human role that holds custody of a harm or duty when no mandate
  covers it, and state its consequence ceiling, its alternate and its expiry. Or decide that no fourth tier
  exists and that the designated maintenance/discovery custodian is terminal.
- **Why the founder.** It is a staffing decision and a delegation of authority. AC's own words: *"the
  resolution is a staffing decision and belongs to the founder."* DIRECTIVE §3: risk tolerance and
  information only the founder holds.
- **Latest responsible time.** Before the first admitted work order in a class whose harm no existing mandate
  covers. **It does not block the amendment or the builder** — the resolver is specified with a terminal slot
  marked unfilled.
- **Options.** (a) Name a person with a ceiling, an alternate and an expiry. (b) Engage a professional or
  service as the terminal element. (c) Delete the fourth tier and make the maintenance custodian terminal.
  (d) Declare the founder the terminal element, as an explicit exception.
- **Consequences.** (a) and (b) cost money and a real acceptance act. (c) puts legal-class harm on a custodian
  whose mandate does not cover it, which is the gap M1 carried silently. (d) is honest and makes every unowned
  harm an interrupt on one person.
- **Evidence.** Universal ownership and no ownership are one state [R5-11]. The national incident system
  defaults responsibility *upward* until delegated [R5-03]; this package defaults to the narrowest sufficient
  mandate. M5 declared this gap against itself and routed it; M1 carried the same hole silently.
- **Uncertainty.** Whether a harm class with no covering mandate actually arises at these ventures' scale is
  unmeasured, and it is downstream of the novel-work arrival rate, which nobody has counted.
- **Reversibility.** **High as software, low as a relationship.** Naming a party is reversible; telling an
  outside party who to contact is not.
- **Recommendation.** **(d) now, (a) or (b) before the first venture carries an outward obligation.** The
  exception is honest, costs nothing, and makes the load visible. Pretending a role exists is the failure
  mode this packet exists to prevent.
- **No answer.** **Admission stops in every class whose harm no existing mandate covers.** That is a visible,
  recorded narrowing — not a silent gap.
- **Unrelated work.** Continues. Only classes whose harm is uncovered stop.

---

#### **MD-02 · Which standing roles are staffed by a person other than the founder before work is admitted in that class, and what happens in a class where none is?**

- **Exact decision.** For each acceptance-owner role the capability binding names, state whether it is filled
  by a non-founder, by the founder as a declared exception, or by nobody — and confirm the consequence of
  "nobody", which the design sets as **admission in that class stops**.
- **Why the founder.** Staffing and money. DIRECTIVE §3: irreversible commitment and information only he
  holds.
- **Latest responsible time.** Before work is admitted in any affected class. **It does not block the
  builder** — the precondition is specified and the slots are declared unfilled.
- **Options.** (a) Fill named roles with real people or engaged services. (b) Declare the founder the holder
  of record for all of them, as a stated exception with the parking behaviour named. (c) Fill a subset and
  let the rest stop admission. (d) Reduce the number of roles by re-running the conjunction test more
  strictly.
- **Consequences.** The figure the company review computed is the whole of this packet's weight, and it is
  carried here rather than summarised: **in the consequence-class candidate a person is the acceptor on 37 of
  46 capabilities** and on **every** action in the 26 that floor at the economic/contractual class or above;
  in the workflow-first candidate **19 of 46 name the founder** and **13 more an unspecified human**, with
  every outward artifact needing a human acceptance. **The synthesis does not reduce that load** — it makes
  it visible before work is admitted rather than after it is owed. And one branch is taken explicitly:
  **acceptance at the economic/contractual class and above is unsampleable**, so there is no sampling rule
  that thins it; the per-week count is what this packet carries once the capability binding is rebuilt.
- **Evidence.** AC-M3-02, AC-M4-01, AC-M4-02, AC-M5-02 and AE-M4-05 — four reviews, four candidates, one
  gap. The staffing-precondition mechanism exists in one candidate and was not applied to its own acceptance
  table.
- **Uncertainty.** The per-week decision count cannot be computed until the capability binding is rebuilt
  per capability, which is work the amendment does. The **holder-hours-per-period** figure is owed (R-X09)
  and has no denominator today.
- **Reversibility.** High as software. Low once an outside party has been told who to contact.
- **Recommendation.** **(b) plus (c):** declare the founder the holder of record with the parking behaviour
  stated, and fill **one** role — the grievance and rights holder — with a real party first, because it is
  the only one an outsider reaches by name and the only one whose route is a published promise.
- **No answer.** Admission stops in every duty class whose acceptance role is unfilled. In a one-person
  company that is most of the economic/contractual classes, and the company runs at the reversible-internal
  classes only.
- **Unrelated work.** Continues at every class whose role is filled.

---

#### **MD-03 · Who may approve creation of a new capability, and what happens during a founder absence?**

- **Exact decision.** Name a standing approver for capability creation, with a consequence ceiling and an
  expiry — or confirm that outward-acting capability creation parks during an absence.
- **Why the founder.** Delegation of authority with a consequence ceiling; risk tolerance.
- **Latest responsible time.** Before the first declared absence.
- **Options.** (a) A named standing approver with a ceiling and an expiry. (b) Outward-acting capability
  creation parks; read-only and internal-artifact capabilities proceed on the expiring bounded trial the
  design already admits. (c) A professional or service holds the approval for a named class.
- **Consequences.** (b) is what the design does with no answer, and it is not a failure state: **every
  candidate in the round conceded that creating a capability for genuinely novel work requires a human
  approver**, and the differences were only in what can proceed while approval is pending. (a) buys
  throughput and creates a party who can grow a mandate.
- **Evidence.** Nothing located staffs a genuinely novel work *kind* without a pre-declared envelope, a
  pre-registered handler, or a human redeploy [R5-06, R5-08, R5-14]. The one counterexample writes a new
  *skill* and depends on an automatic success oracle a business case does not supply [R5-21].
- **Uncertainty.** The **arrival rate of genuinely novel work** is unmeasured and it is the cheapest
  measurement in the round [MG-06]. At one novel job in two hundred this decision barely matters; at one in
  five it is the throughput ceiling.
- **Reversibility.** High. An approver's mandate is a record with an expiry.
- **Recommendation.** **(b), and run the arrival-rate count first.** It needs no software and it is the
  input this decision actually turns on.
- **No answer.** Outward-acting capability creation parks during absences; read-only and internal-artifact
  trials continue.
- **Unrelated work.** Continues.

---

#### **MD-04 · Who accepts the assessment of the founder's own competence?**

- **Exact decision.** Name the competent assessor, outside the founder, for the owner-attention-and-competence
  capability.
- **Why the founder.** Naming an assessor is staffing and it is personal. The **mechanism** is already fixed
  and inherited from `04-human-operation.md` — a competent assessor states the exact factual proposition and
  its limits, the owner may contest it or request a second assessment — so only the occupant is open.
- **Latest responsible time.** Before the first competence cycle runs.
- **Options.** (a) A named person. (b) An engaged professional. (c) A deterministic instrument plus a named
  contestation route, with no human assessor. (d) Declare the capability unperformed and record it as such.
- **Consequences.** (d) is honest and leaves the fixed mechanism unexercised. (c) narrows what can be
  assessed to what a computation can decide, which for domain competence is little.
- **Evidence.** `04` already fixes the opposite arrangement to the bare-founder-accepts reading, and one
  candidate's own prohibition — *a holder may never decide the matter it is the subject of* — forbids it.
  **Nothing in any lane's source set measures whether a system's operator remains competent** [AG-10], and
  human evaluators agree with each other 5–65% [R7 F15].
- **Uncertainty.** The assessor's own error rate is unmeasured, as is every human anchor's [X19].
- **Reversibility.** High.
- **Recommendation.** **(d) until a venture carries an outward obligation, then (b).** Recording the
  capability as unperformed is truthful; recording it as passed because the founder accepted his own
  assessment is the failure `04` already refuses.
- **No answer.** The competence cycle runs; the assessment is recorded as **unperformed**, never as passed.
- **Unrelated work.** Continues.

---

#### **MD-07 · May anything halt or reverse a shed in the moment, and who decides when a protected-lane holder refuses?**

- **Exact decision.** Name the party who may halt or reverse a capacity shed inside the shedding window, and
  state how long a protected-lane holder's refusal may stand. The design already decides the second half:
  **a holder's stated minimum is evidence, never consent** — no veto.
- **Why the founder.** Who holds authority under pressure is a delegation of authority.
- **Latest responsible time.** Before any `CapacityPlan` revision that raises the concurrency pin. **Not
  urgent:** shedding at 4× cannot occur at the current pin, so this decision is blocked behind the account
  inspection (R-G04), which costs nothing.
- **Options.** (a) Nobody may halt; the pre-endorsed order executes and is reviewed after. (b) A named party
  may halt inside the window, with its own reserved capacity. (c) The founder may halt, and during an absence
  nobody may.
- **Consequences.** (a) is fast and auditable and **cannot notice that this particular shed is catastrophic**,
  which the workflow-first candidate concedes in its own words. (b) costs reserved capacity that the lapse
  rule then prices as waste when unused. (c) makes the founder a single point of availability at exactly the
  moment of pressure.
- **Evidence.** **This is an unresolved disagreement in the round and the evidence does not settle it**
  (dissent F-1). Two candidates ask the holder; two apply a pre-endorsed order. AC: *"opposite and
  individually correct positions, and neither is refuted."* Two live (d)s fail in **opposite directions**
  from this one question: nothing can halt a shed, and nothing can override a refusal.
- **Uncertainty.** **Whether a shed at 4× has time for a negotiation round has never been measured.** That is
  the discriminating test and it is unrun.
- **Reversibility.** High as software. A shed that strands a due obligation is not reversible.
- **Recommendation.** **(a) with a named after-the-fact reverser, until the negotiation-time question is
  measured.** The nearest instrument is cheap: run the shed decision twice on one tabletop, once asking named
  holders and once applying the class reservations with no holder, and count founder reversals and breached
  minimums. It runs at the current pin because it is a decision procedure, not a capacity experiment.
- **No answer.** No shed can be halted. Since no shed can occur at the current pin, **nothing happens**.
- **Unrelated work.** Continues entirely.

---

#### **MD-08 · The size of each reserved lane, its stated minimum and its lapse point**

- **Exact decision.** Per lane: its share of the observed allowance, its stated minimum, and the point before
  the reset window at which unconsumed reservation releases to the pool.
- **Why the founder.** These decide what the company gives up under pressure, which is its meaning rather
  than an engineering parameter. DIRECTIVE §3: risk tolerance.
- **Latest responsible time.** Before the first shed negotiation. **Not urgent, for the same reason as
  MD-07.**
- **Options.** Any set of shares. The design fixes only the structure: shares are expressed **as fractions of
  the observed allowance, never as absolute quantities**, because no published denominator exists; the
  protected due-service and grievance reserves may never be shed; the lapse point is time-triggered and
  independent of any holder's consent.
- **Consequences.** Generous reserves are destroyed unconsumed at the reset — a reserve under a non-rolling
  allowance is **waste, not thrift**, and this is the one correct costing of a reservation anywhere in the
  round. Tight reserves breach minimums under pressure and the breach is what the founder is alerted to.
- **Evidence.** *"The session window resets on schedule whether consumed or not"* [R8 §3]. **No published
  denominator exists**, so every figure this round can produce is a ratio between arms and *"this design
  consumes 40% of the allowance"* is not a sentence anyone here can write [R8 W-6, MG-03].
- **Uncertainty.** Total; the quantity that would make this arithmetic is the one the provider stopped
  publishing.
- **Reversibility.** High. Shares are data.
- **Recommendation.** **Adopt `07` §6's existing class shares unchanged as the starting values, set the lapse
  point at 20% of the window remaining, and treat both as measurements to revise rather than as decisions.**
  The structure is what matters; the numbers are placeholders that must be labelled as such.
- **No answer.** No shed negotiation can run. Since none can occur at the current pin, **nothing happens**.
- **Unrelated work.** Continues entirely.

---

**Totals.** **18 decided** (16 outright, plus MD-20 not-applicable and the AC-M2-01 disposition) ·
**4 carrying a founder-owned parameter** (MD-09, MD-10, MD-21, MD-14's ceiling) · **6 founder packets**
(MD-01, MD-02, MD-03, MD-04, MD-07, MD-08), of which **two are not urgent** and **two are the same staffing
question seen from two capabilities**.

---

## 7. Binding to the fixed boundaries and the 46 capabilities

**SPECIFICATION. None of the six fixed boundaries is reopened.** Cross-lane §E examined fourteen falsifier
candidates and returned **zero** against a fixed boundary: two falsify a strength the frozen protocol grants
the simple baseline, five are conformance counterexamples against the runtime, one is a preference its own
lane declines to advance, and the rest are evidence gaps or measurement-integrity findings. **Every lane that
touched a fixed boundary said in its own words that it reopened none.** This record routes no decision packet
against a boundary and changes none. That is why the version is S1.1.

### 7.1 How the synthesis joins each boundary

| Fixed boundary | The join |
|---|---|
| **Consequence and release** (`02-architecture-selection.md` §4; `02-authority-recovery.md` §4–§6) | Layer 1 **computes what the existing boundary already requires** and changes nothing in it. The six routing classes, their gates, the `ConsequenceVector`'s separate dimensions, the refusal of a universal risk number, the ordered release transaction with live epoch re-read, the independently durable envelope, and the parameter authorities — all retained verbatim. What the synthesis adds is a **record of the derivation**, recomputed at the effect on the frozen bytes, parking on mismatch. And it restates rather than changes the one sentence a candidate broke: *"An action may satisfy multiple classes and must meet all their gates"* [`02-authority-recovery.md` §4]. **C04 alone releases; an executor's scope is a proposal right (R-X01).** The model-provider channel is named as a C2 destination and discharged through §8.2's **existing** destination-clean construction (R-D12) — a construction the boundary already admits, so naming it relaxes nothing |
| **Evidence and acceptance** (`06`) | Retained whole. The deterministic oracle runs before any model checker; the checker's **delivered** inputs are recorded by the loader, not claimed by the caller; findings aggregate by union and verdicts never by vote or mean; agreement figures are chance-corrected; abstention is a first-class verdict; AM-01's paired clean case runs in the same session and both rates are reported or neither is; and a checker with no clean-case rate resolves **`unresolved`, never `pass`**. The synthesis adds R-D11 (who authors the criteria), R-X14 (the calibration writer, excluded from every producing path, a C5 write) and R-X20 (a check reads only fields the producer could not author). **Independence of influence is claimed and measured; independence of error is disclaimed in every acceptance that rests on a same-family checker** |
| **Recovery** (`02-authority-recovery.md` §9–§12) | Retained whole. An expired lease fences writes and **does not prove no external effect**; a released effect is detected by the idempotency record **on the effect**, never by state in the shared record; the three terminal observation values stand with `unknown_effect` as a first-class state carrying a named custodian; compensation is new authorized work with its own acceptance. The synthesis adds one effect per effect step (R-L2), so there is no "before the interrupt" inside an effect step — which closes the documented path by which a human approval step duplicates the payment it approved |
| **Human responsibility** (`02-architecture-selection.md` §7; `03`) | Retained whole. The ordered custody resolver, temporary protective custody, a contested provisional custody still being custody, the losing-mandate record, the `disputed_custodian` guard with absent-value-denies semantics, accessible grievance intake independent of product accounts, and non-customers retaining standing through closure. The synthesis adds R-D06 (the guard carried across, which no candidate did), R-X06 (the admitter excluded from custody), R-X08 (a funded remedy reserve or a recorded funding gap) and R-X17 (intake sub-caps that preserve intake rather than refusing the next legitimate complainant) |
| **The FIXED founder-competence mechanism** (`04-human-operation.md`) | **This is the boundary all five candidates missed, and the synthesis names it by file and by record.** `ParticipationPlan` is the owner-endorsed attention setup; `ParticipationEncounter` carries the four encounter kinds — original customer material, an independent taste decision before advice, an unfamiliar financial or obligation interpretation, and an intervention or recovery rehearsal — on `04`'s fixed cycle, **not only after an absence**; `DomainAssessment` is how a material misunderstanding produces a competent assessor's statement that the owner may contest; `AuthorityMatrix` records each decision domain and its absence behaviour; `DecisionPacket` and `HumanResponse` are the decision contract; `GrievanceCase` is the external route. **Exactly two deltas are declared** (R-G03): the re-entry brief carries *what was omitted and what was contested* as well as what was decided, and the founder return reports the checker's **clean-case refusal rate** beside its detection rate. Any further delta is a decision packet. `04`'s own sentence governs the rest: **attendance, confidence and agreement with the model are explicitly not competence** |
| **Whole-company scope** | Retained. The capability binding covers all 46 ids individually (R-X07), with no grouped rows and no capability left to a chapter link in place of an operative answer |

### 7.2 The three named answers

**Who accepts a refund (CAP-17).** **Three acts, kept apart, and the separation is what keeps the load
bounded.** The *decision* to remedy is accepted by the offer's outcome sponsor under C01-endorsed authority.
The *release of money* is C04's, in the ordered release transaction, with the amount drawn from the
entitlement and terms record and the payee from the verified payee source — **never from a model-authored
string**. The *discharge* is the customer's and nobody else's; an internal status never discharges an
external standing. The action reaches the economic/contractual class, so **a person accepts the remedy
decision**; a support procedure may prepare, compute and stage a refund and may not accept one. A
`ConflictClaim` keyed on the original charge makes two independently named "courtesy" and "refund" operations
share one liability constraint. If the refund fails it **remains an owned duty** — cancelling the workflow
never makes the result true. And the duty outlives the case: a **standing holder for customer remedy** owns
it after the support case closes, which is what makes a contest six months later reach a party rather than a
rule.

**Who owns a grievance from a non-customer six months after closure (CAP-42, with CAP-39 and CAP-22).** A
**standing holder for grievance and rights**, independent of the disputed production decision, with an intake
address that outlives the case, a deadline clock, an escalation contract, a named alternate, a **funded**
remedy reserve (R-X08) and a per-origin intake sub-cap whose exhaustion overflows to a named destination with
a reader rather than refusing the next complainant (R-X17). Its route requires no product account and
proportionate verification only. **If the venture is closed, closure cannot complete until that holder's
duties are transferred to an accepted custodian** — the CAP-39 interlock, which AC calls the strongest
standing-accountability mechanism in the round — and the grievance interest is **unretirable**, so a
wound-down venture still arms it. **The residual nothing removes:** the person has to exist and be paid, and
no architecture creates them. That is MD-01 and MD-02.

**Who sheds a lane at 4× (CAP-45, CAP-35).** The scheduler executes a capacity policy **the founder endorsed
in advance**, in a fixed order — discretionary exploration, then maintenance and evaluation, then ordinary
creation and research — and **may never shed the protected due-service minimum or the continuity, security
and grievance reserve**. Each lane's holder returns a **stated minimum declared in advance**, which is
**evidence and not consent**: a holder may state, may propose an order within its own lane, and **may not
veto**. Every shed writes the lane, the authority, the obligations that moved with named custodians, the
overflow count, the stated minimum and whether it was breached; a breached minimum is an alert with a named
recipient. **Shed work stays owned** — that single property is the whole of what distinguishes shedding from
dropping. Unconsumed reservation lapses at a time-triggered point **independent of any holder's consent**,
releasing across classes in a declared precedence, with the lapsed quantity recorded (R-X24), because
allowance does not roll over and a withheld reserve is destroyed rather than saved. **Honest disposition:
this fixture is not executable at the current concurrency pin and is reported as owed, not as passed**
(R-X23), and whether anything may halt a shed in the moment is **MD-07**, open.

### 7.3 The founder acceptance load, and what the synthesis does about it

**DIRECT OBSERVATION, carried from the company review rather than summarised.** In the
consequence-class candidate **a person is the acceptor on 37 of 46 capabilities**, and on **every** action in
the 26 that floor at the economic/contractual class or above. In the workflow-first candidate **19 of 46 name
the founder** and **13 more an unspecified human**, and every outward artifact needs a human acceptance.

**INFERENCE. The synthesis does not reduce that load, and claiming otherwise would be the flattery this
protocol exists to catch.** Layer 1 is a consequence-class design, so its acceptor column is the
consequence-class candidate's, not the lighter one. What the synthesis does instead is four things, each
mechanical:

1. **It separates accept from release from discharge** (from M2), so only the *acceptance* act reaches a
   person. A person accepting a refund decision is one act; the release and the discharge are not his.
2. **It makes the load a precondition rather than a discovery** (R-X09): every acceptance-owner role is a
   record with a reachability route, a reservation, an alternate and a review date, and **admission in that
   duty class stops while it is unfilled.** The company does not accumulate an acceptance debt it then
   discovers.
3. **It prices holder review** (R-X09, R-X11): a review-period length and an estimated holder-hours-per-period
   figure with its denominator, plus a stated behaviour when holder review collides with a capacity-pressure
   window.
4. **It takes the unflattering branch explicitly:** acceptance at the economic/contractual class and above is
   **unsampleable**. There is no sampling rule that thins it. The per-week count is what MD-02's packet
   carries once the binding is rebuilt per capability.

**And it states the criterion tension rather than resolving it.** W11 fails a design a business-literate
reader describes as a roster of digital employees; W12 needs the structure a founder can most easily hold in
his head; and R8 records that these pull in opposite directions and **declines to advance it as a defect**.
This record declines too. The plain-language description a reader should produce is: *a company that has
written down how it does each of its jobs, runs each one the same way every time, decides who may act from
what the action can do to somebody, brings a person in where judgement or standing is required, and keeps one
named party reachable for each duty that outlives the job that created it.* Whether a reader hears a company
or a workflow product is an empirical question about people and it is untested here.

---

## 8. Comparators

### 8.1 Against S1.0 — what changes and what stays

**What stays, unchanged and deliberately.** The production rule of `02` §3 — deterministic computation,
durable procedures, bounded model work, capable people, qualified professionals. C04 as the sole consequence
authority and C06 as independent acceptance. `AgentTemplate` as a versioned recipe with no standing and
`AgentInstance` bound to one admitted work order (**CP-74**). Sponsors rather than departments. Attempt-local
context with skills as versioned instructions (**CP-109**). CP1 concurrency (**CP-159**). The loader's
delivered-inputs rule (**CP-128**). The `SummaryLoss` and `ContextTransformation` instruments (**CP-132**).
The denominator rule, with rework, rejected attempts and abandoned outputs in it (**CP-99**). The correction
understanding-check (**CP-142**). The bounded discriminator before a large commitment. Independence as
different evidence, method, measurement or human grounding rather than a second model (**CP-153, CP-171**).
Capacity in `07` §6 units and never tokens (**CP-173**). Peer visibility through authorized work projections
and never all company context (**CP-84**). The ordered custody resolver of `03`. The delegation ceiling of
one child layer by default (**CP-77**'s human approver for capability creation is also kept, so **TC-19 is
not claimed in its strong form**).

**What changes — twelve items, each with the behavioural difference a reader can check.**

| # | Change | Against | Why |
|---|---|---|---|
| 1 | **The reached set of consequence classes is computed per action and recomputed at release**, and the structure that carries an action follows from it rather than from the capability contract's `implementation_mode` | S1.0 fixes the production mode on the contract, so one capability's every message is one mode | The one action at two classes test: draft an internal note, then draft the identical text as an outward promise. Under S1.0 the release gate differs and the producing structure does not |
| 2 | **A step declares its read set, and the loader delivers and records it** | `05` §3 declares a read/write resource scope without making the delivered set a manifest fact | It converts *"the checker did not read the rationale"* from an assertion into a record. Nothing else in the round can make that claim |
| 3 | **Relevance is a computed, unstoppable armed set** | S1.0: nothing exists until the case authority admits it, so a deferral and an oversight are the same observable | A deferral becomes a visible state with a latest responsible time, which is what F-6 actually tests |
| 4 | **`ExistenceJustification` with one reason, its unit and a falsifiable test** | CP-76 states four reasons, dropping parallel work and isolated context; the thesis states five | CP-76 and the thesis already disagree, unremarked. This reconciles them and makes negative control 4 mechanical |
| 5 | **Typed `ConstraintSet` on every boundary, including the continuation and the founder brief** | `05` §5 requires typed outputs and records losses without typing the constraints | Constraints survive transfer at ~0.57 against ~0.97 for facts; typing took leakage to 0 of 48 |
| 6 | **Consultation is the default at the external-disclosure class and above; handoff below; every transfer carries an `AcceptanceInterval` with a named holder** | `05` §5 treats delegation plus continuation as the primary shape and names no interval | No surveyed system has an acceptance-owner concept; the most deployed tracker lets an item be Done with an empty resolution |
| 7 | **`FieldAuthority`: one writer per canonical cross-boundary field** | CP-22 is compatible and names no writer per field | Without it, "shared source of truth" means last-writer-wins |
| 8 | **`EffectIdentity` allocation and deliberate de-correlation designed alongside the shared record** | Not present | 18 of 30 workers collided on one name through correlated reasoning, not divergent context |
| 9 | **`GrantDeliveryReceipt`: arrival attested at the first effect** | `02` §4 checks grants; nothing observes arrival | A grant narrowed reliably and arrived unreliably, cause unknown |
| 10 | **Skill tool-granting frontmatter stripped at the launcher, with a positive control on the stripping** | `05` §8's rule that a prose package cannot spend by being loaded | That rule is correct as intent and **false of the named runtime** |
| 11 | **Standing holders as records with an address, a reservation, an alternate and a review date; no carried model memory** | `07` §6 reserves capacity by *class*, and a class has no representative to ask | The single place in the six fixtures where standing does work S1.0 has no mechanism for |
| 12 | **A removal criterion on every new record, in the table that introduces it** | `02` §8 states the discipline; `05` does not discharge it row by row | W9 makes a mechanism with no removal criterion a failure condition |

### 8.2 Against B0 — per fixture, honestly

**B0 with its full granted strengths**: one long-context session, plus deterministic scripts, plus one shared
record in version control, plus its own retrieval scripts, checklists and human review; no handoff loss
because there is no handoff; no routing error because there is no router; one window a person can read;
trivially buildable; trivially changeable; and a record the founder reads end to end, which serves founder
competence better than any permission-filtered projection.

| Fixture | Honest verdict |
|---|---|
| **F-1 unknown job** | **B0 is arguably better.** It admits and types in one context, refuses by checklist, and never has to decide which standing structure holds a new kind of duty. The synthesis's advantage is narrow: refusal is a recorded terminal state with a named failed predicate and its own acceptance owner, which B0 gets only by a person remembering |
| **F-2 demand at 4×** | **Not executable at the current pin, in either arm.** At 1× and 2× the two are indistinguishable on every concurrency-dependent unit, because the pin binds both. The synthesis's structural advantage — a lane with a holder who can be asked to yield — appears only at a demand level these ventures may never reach, which is exactly protocol §6's second B0-wins condition |
| **F-3 three permissions** | **The synthesis wins, structurally and at any demand level.** B0 cannot exhibit attenuation because there is nothing to attenuate from. **This is entailed by the frozen boundaries and must not be scored as an empirical result** [FAL-13] |
| **F-4 independent verification** | **The synthesis wins, structurally — and the win is worth less than it looks.** B0 has no verification independence of any kind by construction. But a same-family checker's measured ceiling is 28.6% F1, and R7's own sentence stands: *"B0 plus deterministic scripts plus human acceptance is not obviously worse than B0 plus deterministic scripts plus a same-family checker."* The synthesis's real advantage here is the **deterministic oracle first** and the **declared read set**, not the checker |
| **F-5 capacity reset** | **The synthesis wins, narrowly.** Continuation is mandatory in both arms; the synthesis is the arrangement for which it costs least, because it never assumed a session long enough to lose and the armed set is recomputed rather than carried. B0's single session is where the reset bites hardest, contrary to a strength §6 grants it |
| **F-6 founder absent** | **Close, and B0's weakness is real.** B0's admission rule *is* the founder's attention, so its answer to an absence is "it waits". The synthesis's answer is that authorized work continues within standing mandates and everything else parks visibly with a deadline. But the synthesis is worse on founder legibility: five layers and a set of standing holders is more than one record a person reads end to end |

**When B0 wins outright, per protocol §6, stated without hedging.** If these ventures never reach a demand
level where a lane must be shed; **and** the founder is willing and able to be the reachable party himself for
privacy requests and grievances; **and** the coordination cost per unit of delivered work exceeds the loss it
prevents; **then B0 wins and the correct output of this round is a smaller system**, which
[`02-architecture-selection.md` §9](../02-architecture-selection.md) already commits to. The first and second
of those three are live today. **The synthesis's own minimum answer** is the workflow-first candidate's: the
smallest thing that is not B0 is **(a)** a record a step is *forced* to read, delivered and recorded by a
loader, and **(b)** a credential the model side never holds. Those are layers 2 and 1. **Layers 3, 4 and 5
owe their own separate justification**, and each carries its own falsifier in §11.

### 8.3 FAL-01 and FAL-02 — findings against a premise, not against B0

**SOURCE CLAIM, and this record does not amend the frozen protocol.** Protocol §6 grants B0 two strengths
that lanes falsified:

- **FAL-01.** B0 does **not** have the lowest plausible consumption of scarce capacity. Four documented
  provider mechanisms contradict it: the full conversation is sent with every request and again with every
  tool batch; the first message after a break longer than the cache lifetime reprocesses the full context;
  compaction reads the conversation it summarises and is itself a large request; and idle check-ins each send
  the full context. **B0 minimises launches; it does not minimise the weekly bucket, and the weekly bucket
  binds** [R8 B-6].
- **FAL-02.** B0's "one long-context session" is **not purchasable** under this package's own launch
  contract, because a native job caps at a ~360-second window [R2 F-18]. **Restated at reduced strength per
  R-G13**: the source reads *"DESIGN PROPOSAL. Native job **default**: one launch, ≤360 s"*, and the same
  section admits a persistent native profile using `--resume`. It is a default carried as a design proposal,
  **not a contract ceiling**, and all five candidates stated it more strongly than the source supports.

**What they establish, and what they do not.** They narrow the comparison; they do not defeat B0. B0 keeps
no-handoff-loss, no-routing-error, one readable window, trivial buildability, trivial changeability and the
founder-competence advantage — and the last of those is the one the synthesis is structurally worst on.
**The synthesis claims no credit for either falsifier.** Neither was found by a candidate and neither is an
argument for more machinery; one replaces B0's cost with a different cost (a fresh, cacheless launch per
step, which is R-X12's owed measurement), and the other is weaker than everyone said.

---

## 9. Dissent preserved

**SPECIFICATION.** Every disagreement the consolidation lists that the evidence does not settle, with the
discriminating test and who owns running it. **None is resolved by preference here, and where the synthesis
sidesteps a dissent by rejecting a mechanism, it says so rather than claiming to have settled it.**

| # | The disagreement | Status in the synthesis | Discriminating test · owner |
|---|---|---|---|
| **F-1** | **Shedding: ask the holder, or execute a pre-endorsed order?** Both positions are individually correct and neither is refuted; the two live (d)s fail in opposite directions from one unsettled question | **Unresolved and retained as a design input.** The synthesis takes the pre-endorsed order *and* the no-veto prohibition, which is the combination neither pair proposed — but that is a choice under uncertainty, not a resolution | **Whether a shed at 4× has time for a negotiation round.** Never measured. Nearest instrument: run the shed decision twice on one tabletop, once asking named holders and once applying class reservations with no holder, and count founder reversals and breached minimums. Runs at the current pin. **Owner: founder, under MD-07** |
| **F-2** | **Does a total rank over routing classes rise to a fixed-boundary change?** The passage conflict is established; the severity is contested by the reviewer who raised it | **Moot for the synthesis, unsettled in general.** Nothing here computes a rank, so the question does not arise. This record does **not** settle whether the candidate's version was a boundary change | Prove the class table monotone in both the accept and the may-prepare columns. One counterexample exists in each, so the proof as stated fails; whether a repaired table exists is open. **Owner: whoever revisits the candidate, if anyone does** |
| **F-3** | **What the persistence delta actually is** — three separable properties or one | **Partly settled by the evidence, and the synthesis follows AC's reading.** Reachability *is* separable, and carried model memory *is* unsupported; those two positions are compatible and the synthesis takes both. What stays unsettled is whether carried memory would help if anyone measured it | **The fresh-holder arm**: incumbent holder with its carried record against a freshly bound holder with an empty one, same template version, same window, on a pool neither may write; five attributable trials per case, chance-corrected, two-consecutive-quarter stopping rule. **Runs at the current pin.** **Owner: the instrument custodian, who is not the subject** |
| **F-4** | **Does the subagent boundary attenuate authority, or inherit it?** The sharpest lane-vs-lane conflict in the round | **Unresolved, and the synthesis builds for the pessimistic reading.** It assumes total inheritance is the default and enforces narrowing at the enforcement point, so it is correct under either answer at the cost of building something one reading says is already there | Two cheap probes: **(1)** dispatch a worker whose definition declares a grant the main conversation lacks and observe whether the tool is present **at the effect**; **(2)** dispatch the read-only reviewer, whose tool list omits the shell, and attempt one shell call. Plus **AS-X-02's positive control on grant removal** — a probe skill whose arrival at the enforcement point is a failure. **Owner: whoever owns the runtime adapter.** Untestable in this round: no runtime |
| **F-5** | **Whether the fourth unblinded channel changes the verification verdicts** | **Resolved at §6.3**: the class is a property of the finding, not of the lane, so the (d) blocks and is closed by R-D11; and the three tested channels remain closed. **W5 is recorded as sufficient on three channels and unestablished on the fourth** | **A fourth F-4 arm** in which the acceptance criteria are authored by the producing path, reported beside the existing three. **Owner: C06** |
| **F-6** | **The severity of the provider-as-disclosure-destination gap** — one substantive gap carrying three dispositions in one review, by design | **Resolved by taking the discharging construction** (R-D12). The synthesis neither inherits the blocking form nor keeps anyone's silence: it names the destination, carries the standing contract, and declares the loader's narrowed projection as the discharge | None needed for the design. What remains testable is whether the projection is in fact clean for that destination, which is the seeded private-term canary in F-4/F-1's adverse variations. **Owner: C05** |
| **F-7** | **Is a classifier's abstain threshold (c) or (d)?** Recorded as resolved-by-deferral rather than agreed, because the two reviews reached it by different routes and neither read the other | **Retained as (c) with its protocol**, and the synthesis narrows the question by removing the confidence threshold entirely: typing is deterministic predicate match, anything else is `no_match`, and a model may propose a type and never assign one above the read-only class. **The cost is named**: more items reach the unmatched pool, and the pool's throughput becomes the bottleneck | **The arrival rate of genuinely novel work** — count admitted items over a past window against the existing capability list. **The cheapest item in the round; it needs no software. Owner: founder** |
| **F-8** | **Two of the context lane's own preserved dissents** — (i) whether a provenance-header omission for harness-loaded ambient context is a defect at all; (ii) whether the restatement-drift finding is (b) or (a) | **Both retained unresolved.** On (ii) the synthesis takes the (b) reading explicitly: *"a reviewer who classes it (a) and edits the five files has fixed the instance and not the instrument"*, which is why R-G14 wires a check rather than correcting five documents | (i) needs a convention decision, not a measurement. (ii) is settled by whether the check catches the next instance. **Owner: the agent authoring the amendment** |
| **F-9** | **A dimension judged sufficient while carrying a blocking finding** — one candidate's completeness dimension is sufficient *subject to* a (d); another's reliability dimension is the strongest in the round while two other dimensions are insufficient | **Not a contradiction under §8, which has no aggregate score — but a synthesis reading the verdict matrix alone would not see it.** This record does not read the matrix alone: §4's decisive evidence is finding ids, never dimension counts, and §5 disposes findings rather than verdicts | None. It is a reading discipline, and the discipline is that **a verdict matrix is a navigation aid and the findings are the subject** |
| **D-03** | **Share everything, or narrow every delivery?** Two coherent positions optimising against different failure modes | **The synthesis takes the narrowing side under a live disagreement and says so.** Its specific ground is that conflicting implicit decisions arise between *concurrent independent* workers, and concurrency here is declared in the procedure graph or serialised by a single writer key — so the failure mode is removed rather than defended against. **That reasoning is an inference, not a measurement** | **The quantity neither side has measured**: how much load-bearing content survives narrowing against how much accuracy is lost by carrying it all. **Owner: C05** |
| **D-04** | **Is there a turning point in worker count?** Two primary sources disagree inside one lane | **Untouched.** The sweep the claim specifies is forbidden by the concurrency pin | Blocked. Prerequisite is **R-G04**, the account inspection. **Owner: founder** |
| **D-13** | **Buy a second model family, or stop relying on model judgement?** A panel of disjoint smaller judges beats a single large judge at far lower cost; error correlation persists across providers and **rises with capability** | **Not decided here, and the synthesis provides the seam rather than the answer**: a checker step's runtime profile is a field, so a second family is a configuration change and not a redesign. **Routed to the founder as a standing decision, not a packet**, because no non-Anthropic model is reachable from inside the harness today | Joint false acceptance for a same-family producer/checker pair on planted defects, against the cheapest non-model discriminators. **Owner: C06** |
| **D-12** | **Is re-routing a defect?** | **Decided against scoring it as one**, following the larger study: the harmful shape is **cycles at the end of a sequence**, not reassignment count, and a design that minimises re-routing may be suppressing diagnosis. Counted separately | Measure end-of-sequence cycles separately from reassignment count. **Owner: C02** |
| **D-07 · D-08 · D-14 · D-15** | Metadata-only skill discovery; whether seeded defects estimate real detection; whether the five axes are separable in the shipping runtime; whether coordination is a trichotomy or a quadrichotomy | **All retained unresolved.** D-08's operative consequence is identical under both readings — the control detects an always-pass checker and **does not license a published detection rate** — and the synthesis uses it only that way. D-14 is why the launcher strips skill-carried grants: separability fails in the *implementation* whatever the taxonomy says | D-07: the 10/100/1000 sweep with adversarial near-duplicates authored by a different process. D-14: build a skill carrying no tool grant and a tool grant carrying no procedure. **Owner: the capability maintainer** |

**One dissent about the round itself, which the synthesis inherits and cannot escape.** Five candidates
formed blind of each other agreed on ten to twelve mechanisms, and the security review's caveat is the one to
carry: *"Every one traces to one of three sources. Five authors of one model family read one lane set and
agreed… **The correct reading of the convergence is one source with five copies**, and a defect in those
sources propagates into all five candidates with nothing in this round positioned to catch it. I am the same
family."* **This synthesis is a sixth copy.** Its convergent mechanisms — the deterministic oracle first, the
loader-recorded inputs, the paired clean case, union aggregation, the idempotency record at the effect, the
live epoch re-read, `derived ⊆ parent` checked by the enforcement point — are **not seven independent
confirmations**. They are one upstream corpus, read seven times.

---

## 10. Uncertainty and experiments

**SPECIFICATION.** What remains unmeasured, the cheapest experiment for each, and the order to run them in.
**The order is by cost and by how many other questions each unblocks, not by importance.**

### 10.1 What remains unmeasured

| # | Unmeasured | Why it matters here |
|---|---|---|
| **U-1** | **The arrival rate of genuinely novel work** | Every design in this round is calibrated against a rate nobody knows. A recogniser with the measured error profile behaves completely differently at one novel job in five than at one in two hundred, and it decides whether layer 3's unmatched pool and layer 2's unclassified path are primary machinery or edge cases |
| **U-2** | **Whether the concurrency pin is a provider constraint or self-imposed policy** | It gates **four claim verdicts wholly or in part** — higher elapsed time, a turning point in worker count, the scale at which the costs bind, and the parallelism half of whether any multi-worker arrangement wins at matched capacity. **Raising the pin to find out is circular.** All five candidates state it is open and **none names who settles it** |
| **U-3** | **Joint false acceptance for a same-family producer/checker pair on planted defects** | It is the quantity that decides whether separating the checker buys anything, and it is the one both the specification and the thesis demand. Nobody has measured it |
| **U-4** | **What one compaction event loses in load-bearing facts rather than tokens** | The provider reports how much left, not which facts left, and the edit happens after any loader has recorded its inputs. Every claim about handoff loss in this system rests on a number measured elsewhere |
| **U-5** | **Whether a shared authoritative view raises or lowers duplicated external effects** | The single most valuable unrun experiment named in the round, and it is adverse to the founder's central mechanism |
| **U-6** | **The deterministic-predicate fraction** — how much of the company's work is expressible as typed predicates | **Layer 3's own sharpest falsifier.** If it is low, arming needs a model, and the design becomes the most expensive arrangement here |
| **U-7** | **Authoring and maintenance effort in any unit** | The maintenance half of every specialist-versus-procedure comparison is unevaluable today, and layer 2's real cost is authoring |
| **U-8** | **Whether worker profiles converge over a month** | The only honest test of whether capability differentiation is a roster discovered rather than declared |
| **U-9** | **The founder-competence transfer test, or any human error rate anywhere** | Human evaluators agree 5–65% and on severity 20–28%; **the human anchor is an instrument with an unmeasured error rate**, and the synthesis leans on it more than any agent-based candidate would |
| **U-10** | **The blast radius of a false entry in a trusted business record** | The residual that survives the synthesis's strongest mechanism, conceded rather than closed (AS-M3-03) |
| **U-11** | **The per-step cacheless launch cost against a long-session arm at matched accepted outcomes** | The synthesis takes the step model and therefore takes its dominant unpriced cost (R-X12) |
| **U-12** | **False exclusion — correct work refused because a filter was too tight** | Every filtering source in the corpus measures leakage and none measures correct work refused; the extreme case took evidence recall to exactly zero |

### 10.2 The order, and why

| Order | Experiment | Cost | What it unblocks |
|---|---|---|---|
| **1** | **U-1 · Count admitted work over a past operating window against the existing capability list.** Record the disposition of each — absorbed, escalated, dropped | **None. No software, no runtime.** The cheapest item in the round | MD-03's recommendation turns on it; layer 2's unclassified path and layer 3's pool are sized by it; and it is an input to every design in this round that nobody has |
| **2** | **U-2 · Read the account entitlement.** Is the concurrency pin a provider constraint or a policy? | **One inspection.** Not an experiment | **Four claim verdicts**, the F-2 fixture, the shed-authority packet MD-07, the lane-sizing packet MD-08, and D-04's turning-point sweep. **Highest leverage per unit of effort in the round, and nobody owns it — R-G04 assigns it to the founder** |
| **3** | **Read the metered-path account setting**, and record it | **One read.** Observable today | Turns a stated rule with no mechanism into an observed fact with a named reader. It is the only part of the no-silent-fallback constraint that is enforceable today |
| **4** | **The shed tabletop.** Run one shed decision twice — once asking named holders, once applying class reservations with no holder — and count founder reversals and breached minimums | **A tabletop. Runs at the current pin** because it is a decision procedure, not a capacity experiment | Dissent F-1, and therefore MD-07. It is the only instrument that exists for the round's sharpest unresolved disagreement |
| **5** | **U-4 · Reconcile the provider's reported context edits against the manifest on every response**, and treat any unaccounted edit as a manifest defect | **One field read per response** | The only part of the delivered-inputs rule that is achievable across the provider boundary. It converts an unknown into a measured defect rate |
| **6** | **U-3 · The seeded-defect corpus**: producer self-check against separate-context checker on planted defects, **with the paired clean case in the same session**, reporting a false-positive rate beside a detection rate | **Buildable cheaply; repeatedly deferred by every round so far** | U-3 and U-12 together; layer 1's verification floors; and whether the checker is worth its capacity at all |
| **7** | **U-6 · Count the company's conditions and classify each as expressible or not as a deterministic typed predicate**, with a baseline, a unit, a stopping rule and **a threshold below which layer 3 is withdrawn rather than relaxed** (R-X25) | **A census, not a runtime measurement** | Layer 3's admissibility. This is the measurement that decides whether the third layer exists |
| **8** | **U-11 · An expected-launch count per procedure version, checked against actual at run close**, reported as a ratio between arms | **Needs the first procedures to exist** | Layer 2's dominant cost, and D-06's open comparison against a long-session arm |
| **9** | **U-5 · Two workers, one shared view, an idempotency-key collision counter and a rate-anomaly monitor** | Needs a runtime | Whether the founder's central mechanism raises or lowers duplicated effects — the question most adverse to the thesis |
| **10** | **U-8 · Run for a month and count distinct instantiated worker profiles** | Needs a month of operation | Negative control 8 applied to layer 4, and the profile-convergence probe's own declared remedy |
| **11** | **U-10 · Plant a false entry in a trusted record; measure how many actions took it, time to detection, whether the correction reached dependent work, and whether the older decision is still reconstructable** | Needs a runtime | The residual AS-M3-03 records as surviving |
| **12** | **U-7 · The domain that changes**: change one rule and count what must be edited, retested and revalidated under each unit | Needs a corpus of procedures | The maintenance half of layer 2 |
| **13** | **U-9 · The delayed unfamiliar-transfer test**, with recognition and intervention measured separately from attendance, confidence and agreement | Needs an operating founder cycle, and is blocked behind **MD-04** | The one capability nothing in any surveyed field measures |
| **14** | **The four pin-blocked claims** — elapsed time, the turning point, the binding scale, the parallelism half | **Blocked behind order 2.** If the pin is policy, a staged revision with its own stopping rule; if a constraint, the round records those claims as permanently unmeasurable here | Layer 4's parallel-work reason, which is inert until then |

**DIRECT OBSERVATION about this list.** The first four cost approximately nothing and none of them has been
run. Two of them — the account entitlement and the metered setting — are **reads**, not experiments, and they
gate more of this round's open questions than any experiment on the list.

---

## 11. Reopen conditions

**SPECIFICATION, in the form of [`02-architecture-selection.md` §9](../02-architecture-selection.md).** The
first block reopens a **specific contract**; the second reopens **the layer's foundation**; the third is a
**removal criterion per layer**, because W9 makes a mechanism with no removal criterion a failure condition
and R-X26 discharges it row by row.

### 11.1 Reopen a specific contract immediately, on

1. **A successful falsifier against any layer's own test** (§11.3), reported with its measurement rather than
   argued.
2. **An unavailable enforcement prerequisite.** Specifically: if the runtime turns out to hold **no credential
   at the boundary that can be narrowed**, then attenuation is unavailable and the constraint must be enforced
   by **mediation**, which is a different architecture for layer 1's release path. The synthesis assumes
   mediation and names attenuation as the optimisation available if a credential exists; **if neither is
   available, layer 1 reopens.**
3. **An unavailable continuity prerequisite.** If no party other than the founder can be reached within a
   duty's actual deadline, layer 5's conjunction produces holders that cannot be staffed, and **MD-02's "no
   answer" branch becomes the permanent operating state** rather than a temporary one. That is a reopen, not
   a configuration.
4. **Changed provider terms or semantics.** The launch window, the concurrency pin, the cache lifetime, the
   metered affordance and the context-editing surface are all provider properties. A change to any of them
   moves layers 2 and 3's cost model, and the expected-launch count (R-X12) is the instrument that notices.
5. **A misleading acceptance.** A **rising pass rate as load rises** is the registered tell that verification
   is being starved, and it is an alert rather than a discovery. So is any acceptance recorded as passed where
   the checker reported no clean-case rate — that must resolve `unresolved`.
6. **A missed material duty**, or an inability to perform authorized closure — in particular, a closure that
   completed while a grievance route was unowned, which the CAP-39 interlock exists to make impossible.
7. **A record-name collision or a dangling registry reference discovered after the amendment.** R-G10 makes
   this a lint failure rather than a review finding; if it recurs as a review finding, the amendment's method
   reopens.

### 11.2 Reopen the layer's foundation when

1. **Repairs repeatedly require hidden manual coordination** — specifically, when the founder is performing
   work that the capability binding assigns to a standing role, without that role being declared unfilled and
   admission having stopped. That is the load becoming invisible again, which R-X09 exists to prevent.
2. **Permanent exceptions accumulate.** More than a small number of holders declared as founder exceptions,
   or more than a small number of capabilities whose floor was narrowed for throughput under MD-21's
   parameter, means the class rule is being routed around rather than applied.
3. **Speculative containment.** If a layer's defence rests on a mechanism nobody can test — as the trust gate
   would if the deterministic-predicate fraction turns out to be low — the layer is a story rather than a
   boundary.
4. **The concentration cost appears.** `02-architecture-selection.md` §9's existing trigger stands unchanged:
   if the admission authority's concentration **measurably misses important work, raises founder labour, or
   obstructs independently capable domains**, the organizing choice reopens — and layer 3's armed set is
   precisely the instrument that would show it, because an item that armed and was never admitted is visible.
5. **The simple baseline matches on all six fixtures at equal or lower founder attention and capacity.** Then
   the correct output is a smaller system, and `02` §9 already commits to reducing it. **This condition is
   live at 1× demand today.**
6. **The profile count converges.** If a small stable set of worker shapes recurs over a month, this design
   has **a roster it discovered rather than declared**, and the honest response is to stop calling them
   ephemeral and design the standing form properly — at which point the chartered candidate, repaired, is the
   right comparator.

### 11.3 Removal criterion per layer

| Layer | It is removed when |
|---|---|
| **L1 · consequence class** | **More than 90% of admitted actions derive to the two lowest classes over a fixed window.** Then the added structure is not paid for. **Or**: the derivation and the declared floor agree on every action over a window, in which case the derivation adds nothing the floor already said and the floor alone survives. Both need only the derivation function and a month of admitted work |
| **L2 · declared procedures and read sets** | **A newer model passes every step's declared validator with the step merged into its neighbour or removed.** The precedent is exact and runs against its own authors' interest: the group that established that interface design matters ships a hundred-line successor that deletes it and scores competitively. A scaffold's contribution is a function of the generation that motivated it and must be re-ablated when the model changes |
| **L3 · standing interests and arming** | **Over one month, every item whose relevance nobody currently holds in mind is surfaced within its latest responsible time by the existing scheduled review.** Then arming buys nothing. **Or**: the deterministic-predicate fraction falls below the threshold set under R-X25, in which case layer 3 is **withdrawn rather than relaxed** |
| **L4 · `ExistenceJustification`** | **The profile count converges to a small stable set over a month** (U-8), **or** no admitted worker in a window names a reason other than permission scope — in which case the six reasons are one reason with five unused branches and the record can be a grant check |
| **L5 · standing holders** | **The fresh-holder arm**: if a freshly bound holder matches the incumbent on the same fixed pool across two consecutive quarterly runs, the carried state is cut; if it still matches after the cut, the holder is retired into another. **Plus** the per-holder criterion: an intake empty and a clock unrun across two consecutive review periods retires the holder into another, with the address forwarded and residual duties transferred — **never while a duty it holds is live** |
| **Every new record** | Its own removal criterion, stated in the table that introduces it, in falsifier form (R-X26). A record admitted without one fails the amendment's own lint |

---

## 12. Amendment brief for the builder

**SPECIFICATION.** This is exact enough to implement without inventing a design. Where a value is a founder
parameter it is named as one and **no default is invented**; where a number is a placeholder it says so.

**Before anything else, two method preconditions.** **(1)** Resolve every record name in the amendment
against [`contracts/record-registry.json`](../specification/contracts/record-registry.json). A collision is a
lint failure, not a review finding — four of the technical review's nine blocking findings existed only
because the registry was resolved rather than trusted (R-G10). **(2)** Run the repository's
existence-and-drift citation check over `research/F2/**` and `planning/F2/**` — existence blocking, drift
warning, which is the repository's decided posture (R-G14). **Do not begin authoring before both pass.**

### 12.1 `05-work-agents-skills.md`, section by section

| § | Action | The new content's substance |
|---|---|---|
| **Header** | **Amend** | Contract `WORK-1.0` → **`WORK-1.1`**; architecture `S1.0` → **`S1.1`**; new authoring base; status line records that this amendment answers F2 and that five (d)s remain open on founder decisions |
| **§1 Boundary, identity, responsibilities** | **Amend** | Add the **layer precedence sentence** (R-L1…R-L5 and "lower-numbered governs"). Add: the consequence class of an action is **computed from records the acting party cannot author**, the derivation returns **the set of reached classes**, and **every reached class's gates apply** — restating `02-authority-recovery.md` §4, not changing it. Add R-X01: an executor's grant scope is a proposal right; C04 performs every release |
| **§2 Intent, scopes, dependencies, admission** | **Amend** | Admission **computes the class before the kind**. Refusal is a terminal state of the same record with a **named failed predicate** and its own acceptance owner; a communicated refusal is itself an outward effect. Typing has **three admissible outcomes** — matched, `no_match`, `budget_exhausted` — and a fourth, *typed into the nearest existing kind*, is a **recorded failure never scored as success**. Typing carries **no confidence threshold**: anything that is not a deterministic predicate match is `no_match` (F-7's narrowing, with its named cost). The unresolvable case resolves to the **ceiling of the unresolved dimensions**. Disposition of work nothing can handle is **per class**: the two lowest park, the middle two escalate on a timer to the standing holder, the two highest refuse and route a decision packet. Add R-D09's narrowing predicate |
| **§3 Workflow, run, step execution** | **Rewrite** | Add to `WorkflowDefinition`/`StepExecution` (**not new records**): `step_kind ∈ {compute, model, human, professional, effect}`; `declared_read_set`; `declared_grants`; `validator_ref`; `branch_set`; `critical_fields`. State: the loader delivers the declared read set and **records what it actually delivered**, and the caller's claimed read list is not trusted. A guard is a **pure function** over typed outputs and journal state; a model's output is an input to a guard and never a jump. **The step boundary is the checkpoint** (R-D19). **One effect per effect step** and the step is the idempotency unit. Add R-X19: procedure admission **refuses a branch set in which a model-authored value selects between acceptance strengths**. Add R-X04: the adaptive envelope's author is the capability owner at admission, and the unclassified envelope is written out. Add R-X05: the collapse threshold and the retirement window are **one parameter** with one owner |
| **§4 Temporary workers, model choice, bounded reasoning** | **Amend** | Add **`ExistenceJustification`** (§12.3) with the **six reasons and their units**: permission scope → a permission scope; input provenance → an input set; consequence class → an effect class; confidentiality boundary → a context boundary; named partition → a partition; verification relation → a relation between two attempts. **Specialized knowledge is refused as a reason** and predicates on a skill version. **Attributable identity is mandatory for every worker and is never a reason.** Provider or account separation folds into `ExecutionSelection`. Keep §4's existing trust-is-scoped-eligibility paragraph unchanged and add R-X18: **every approval carries an expiry**, and the monotonic-exposure diff is over **effects releasable without a human** |
| **§5 Delegation, messages, accountable handoffs** | **Amend** | **`ConstraintSet`** typed on every boundary crossing, **including the continuation and the founder-facing brief** (R-X27). A receiver may act only on members it can restate as typed values; prose accompanying a constraint set is evidence and never a substitute. **Consultation is the default at the external-disclosure class and above**; handoff is permitted below and requires an **`AcceptanceInterval`**. Add R-D13: a model-to-model return exists only on a declared procedure edge, **crosses the loader**, delivers typed outputs only, and stores prose at a Ref **undelivered**. Add R-X16: a **width ceiling per attempt over distinct read sets**, same owner and checkpoint as the depth ceiling. Keep the existing depth ceiling unchanged |
| **§6 Concurrency, failure, retry, stop** | **Amend** | Add R-X10: an **attempt ceiling per work order** with owner C02 and a stated behaviour at the ceiling; bounded retry by error class with a blocker on two failures with the same cause; **`no_progress` as a terminal class with a named recipient**; and a **progress predicate on a reserved lane** — a named recipient is told when a lane's consumption carries no accepted outcome across a reset window. Add **`EffectIdentity`** allocation before release and de-correlation by reserved name ranges plus a rate-anomaly monitor. Name the **four silent-drop shapes** and their counters: overflow passed through untouched; a queue nobody polls; a holding destination whose retention is shorter than the interruption; and an escalation ladder ending assigned-and-silent, whose terminus becomes an explicit awaiting-principal state with a deadline and a standing owner |
| **§7 Durable schedules and capacity gaps** | **Amend** | Add **`StandingInterest`** and the **armed set** (§12.3), with R-L3's rules: deterministic preconditions, **no model in a precondition**, all-prerequisites gating, five admission verbs and five prohibitions. Add the **unmatched pool** as the computable complement, with retention exceeding the longest plausible outage, an alarm with a named reader, and **its residue named** — it cannot catch an entry that armed the *wrong* interest. Add R-X24 (cross-class lapse with a declared precedence and a lapsed-unconsumed record), R-G01 (the **exhaustion** rule, distinct from the pressure rule, naming the non-model performer), R-X11 (an evaluation-capacity row and its collision behaviour), R-X21 (a **per-origin arming rate** as a refusal predicate, plus the disturbance-loop protocol restated inside the chapter) |
| **§8 Instructions and reusable skills** | **Amend** | Keep §8 whole and add: **a skill's declared tool grant is inert**; the launcher computes the tool set from the grant and **strips tool-granting frontmatter**; **a positive control on the stripping** — a probe skill whose arrival at the enforcement point is a failure (R-X15). **Content-hash pinning re-checked at use**, not at install. Keep the 10/100/1000 sweep and note that the **interest catalogue inherits it**, with one genuine advantage: near-duplicate typed predicates are statically detectable where near-duplicate prose descriptions are not |
| **§9 Conformance cases** | **Amend** | Add the negative fixtures of §12.5, each with its **paired benign case** |
| **§10 Registered lifecycle phases** | **Amend** | Add the phases of the new records in §12.3, each with "what must be true to be in it" and "what it must not be mistaken for" |
| **New §11 · Consequence class and the layer contract** | **Add** | The chapter has no home for layer 1 today. The new section states R-L1 and the precedence rule, defines **`ConsequenceDerivation`**, names the **one implementation** rule, and states that changing the derivation function, the mapping table, the holder set or a declared floor is a protected control change |
| **New §12 · Standing accountability** | **Add** | R-L5: the three-part conjunction, **`StandingHolder`** as a record, the prohibition set (never produces, never releases, never decides the matter it is the subject of, carries no model memory), R-X03's "a holder prepares" rule, R-X17's intake sub-caps, the retirement criterion and the **fresh-holder arm** as the removal test |
| **New §13 · Self-audit** | **Add** | Walk protocol §5's ten examples individually **and then name what that frame excludes** (R-G15) |

### 12.2 Joins into the other chapters

| File | What changes, and why |
|---|---|
| **`01-contract-kernel.md`** | One sentence. The `accepted` paragraph already distinguishes acceptance from output acceptance, effect observation, customer acceptance and duty discharge; add that **the interval between producer-declared completion and acceptance is a named, queryable state with a holder**, and point to `05`'s `AcceptanceInterval`. **Nothing else changes**, and in particular the existing rule that presentation may call contested "disputed" but must not persist a second disputed verdict stands untouched |
| **`02-authority-recovery.md`** | Two additions, both restatements rather than changes. **§4:** after *"An action may satisfy multiple classes and must meet all their gates"*, add that the gate evaluator consumes **the set of reached classes** and that **no total rank or severity score is computed from them** — so a future implementer cannot reintroduce the collapse. **§8.2:** name the **model provider as a standing disclosure destination** carrying a `DisclosureContract`, state that the loader's class-narrowed projection **is** the destination-clean construction discharging it, that a model call is a **pre-authorised release gated by projection conformance** rather than a per-turn transaction, and that amending that contract is a protected control change (R-D12) |
| **`04-human-operation.md`** | **No mechanism changes.** Two declared deltas only (R-G03): the re-entry brief carries **what was omitted and what was contested**, and the founder return reports the **checker's clean-case refusal rate** beside its detection rate. The four encounter kinds run on the existing fixed cycle rather than only after an absence. State explicitly that **`05` inherits `04`'s competence mechanism by name** — the participation plan, the encounter, the domain assessment, the authority matrix, the decision packet and the grievance case — because no F2 candidate cited it and the amendment must close that gap in writing |
| **`06-knowledge-evidence-evaluation.md`** | Four additions. **§2:** per-item **trust level** as a required manifest field, plus **which typed constraints were dropped** and **the class the manifest was assembled for** (R-X13). **§4:** a supersession **walks the transitive closure of derived entries** naming the superseded value and re-decides or flags each reopened acceptance (R-G06). **§6–§7:** who authors the acceptance criteria and that the producing path may not amend them (R-D11); a **check reads only fields the producer could not author** and its tie-break is strongest-sufficient (R-X20); a checker with no clean-case rate resolves **`unresolved`, never `pass`**. **§5:** the **calibration writer** is excluded from every producing path and a calibration write is a protected change (R-X14) |
| **`07-integrations-capacity.md`** | **§6:** the **lapse point** and cross-class release precedence with a lapsed-unconsumed record (R-X24); the **exhaustion rule** naming the non-model performer, the alerted party and the record (R-G01); the **evaluation-capacity row** and its pressure-window collision behaviour (R-X11); the **expected-launch count per procedure version** checked at run close (R-X12). **§5:** the metered-path **observation point, cadence, named reader and response** — halt new launches in that class and apply the existing quarantine — plus the **cache-lifetime collapse priced as a capacity event** (R-D20, R-G07) |
| **`08-improvement-implementation.md`** | Two additions. **A removal criterion for every new record, in the table that introduces it**, in falsifier form (R-X26). And: a change to the derivation function, the mapping table, the holder set, a declared floor, the policy object or a writer-key assignment is a **protected control change** requiring independent authorization, with no model in the acceptance path |
| **`11-schemas-state-contracts.md`** | Register the new records, phases and transitions of §12.3; register the new guards of §12.4 under the predicate runtime boundary; extend the amendment-and-migration contract to cover the alias table (R-X02) so that no candidate-era name is ever admitted as a record name |

### 12.3 Contracts — records to add and change

**New records.** Each row gives name · identity · lifecycle · writer/owner · the transition that matters.

| Record | Identity | Lifecycle | Sole writer | The load-bearing transition |
|---|---|---|---|---|
| **`ConsequenceDerivation`** | `(operation_intent_ref, derivation_fn_version, derived_at)` | `computed → recomputed_at_release → matched \| parked_on_mismatch` | **The release path only**; append-only; `mismatch_disposition` writable only by the party owning the park | `recomputed_at_release → parked_on_mismatch` **never resolves downward** |
| **`ExistenceJustification`** | one per `AgentInstance` | `proposed → admitted → expired_with_instance` | C02 at admission | `proposed → admitted` is **refused if the decidable test cannot return false** |
| **`StandingHolder`** | `holder_id` | `proposed → staffed → suspended → retired_into(holder_id)` | Capability owner, C01-endorsed | `staffed → retired_into` is **refused while any duty it holds is live**; `* → suspended` **stops admission in that duty class** rather than leaving work assigned and silent |
| **`StandingInterest`** | `(id, version)` | `proposed → trial → admitted → suspended → retired` | Maintenance custodian proposes; capability owner admits | `proposed → trial` is admissible **only at the two lowest effect classes**; a proposal declaring a writer key is **refused, naming the predicate** |
| **`ArmedSet`** | `(journal_position)` | computed projection; no lifecycle | **Nobody.** It is derived | **No component may prevent membership.** The admission authority holds no write access to precondition-bearing kinds |
| **`AcceptanceInterval`** | `(work_order_ref, submission_seq)` | `declared_done → in_acceptance → accepted \| rejected` | Holder = the producing structure's sponsor; the acceptance owner writes the terminal edge | `* → accepted` is **rejected by the writer guard when the resolution reason is empty**; at the economic class and above, an undecided interval **escalates to the standing holder at the latest responsible time and the effect does not release** |
| **`ConstraintSet`** | content digest | immutable | The producing structure, validated at the boundary | A transfer whose constraint set **fails schema validation** produces a quarantined report and a bounded repair request, **not a best-effort continue** |
| **`FieldAuthority`** | `(field_path, epoch)` | `declared → current → superseded` | C01 declares the authority; **only the named authority writes the value** | No last-writer-wins path exists anywhere |
| **`EffectIdentity`** | `(effect_class, counterparty, payload_digest)` | allocated → claimed → observed | C04, before release | A second claimant **joins the first and inherits its outcome**; it does not race and does not re-release |
| **`GrantDeliveryReceipt`** | `(agent_instance_id, first_effect_seq)` | written once | The enforcement point | An executor whose grant did not arrive **fails loudly**, never completing with less |
| **`InstrumentCalibration`** | `(checker_id, rubric_version, run_date)` | `scheduled → run → superseded` | C06 or a dedicated instrument custodian **excluded from every producing path**; a write is a protected change | Stores the planted-defect result **and** the paired clean-case refusal rate from the same session; **a missing clean-case rate makes the checker's verdict `unresolved`** |
| **`AdmissionRecord`** | `(origin, arrival_seq)` | `opened → {admitted, refused, parked, escalated}` | C02 | `→ refused` requires a **named failed predicate** and an acceptance owner; **silence is not refusal** |
| **`ShedDecision`** | `(lane_ref, window)` | written once per shed | C02 proposes, C01 authorises | Records the lane, the authority, the obligations that moved with named custodians, the stated minimum, whether it was breached, the overflow count and the lapsed-unconsumed quantity |
| **`ProjectionGrant`** | `(grantor, recipient_scope, purpose, granted_at)` | `issued → active → revoked/expired` | **Issued as a C2 act released by C04**; scope and purpose from a `ParameterAuthority` | Re-read **at every read** of the derived projection, and revocation invalidates derivatives already written |
| **`UnmatchedPoolEntry`** | `(work_record_ref)` | `landed → claimed \| refused \| escalated` | The pool interest, deterministically | Retention **exceeds the longest plausible outage**; an alarm on arrival has a **named reader** |

**Changed records.** `WorkflowDefinition` and `StepExecution` gain `step_kind`, `declared_read_set`,
`declared_grants`, `validator_ref`, `branch_set`, `critical_fields`. `ContextManifest` gains per-item
`trust_level`, `dropped_constraints[]` and `assembled_for_class`. `AgentInstance` gains
`existence_justification_ref`. `Reservation` gains `holder_ref`, `stated_minimum` and `lapse_point`.
`SkillVersion` marks its declared tool grant **inert** and requires a content hash re-checked at use.
`FailureRecord` names `no_progress` as a terminal class with a recipient. **No record is renamed**, and an
alias table maps every candidate-era name to its registry name (R-X02).

### 12.4 Predicates and guards to add

`guard.class.reached_set_gates_all` · `guard.class.no_total_rank` · `guard.derivation.recompute_matches`
(park, never resolve downward) · `guard.derivation.writer_is_release_path` ·
`guard.readset.delivered_equals_declared` · `guard.criteria.frozen_before_producing_step` ·
`guard.criteria.author_not_in_producing_path` · `guard.branch.no_model_selected_acceptance_strength` ·
`guard.trust.derived_is_floor_of_inputs` · `guard.trust.promotion_is_an_effect_with_a_non_model_discriminator`
· `guard.interest.precondition_invokes_no_model` · `guard.interest.writer_keys_not_self_declared` ·
`guard.constraint.standing_interest_writes_proposed_only` · `guard.admission.acceptance_role_staffed` ·
`guard.admission.refusal_names_failed_predicate` · `guard.custody.admitter_excluded` ·
`guard.holder.no_veto` · `guard.holder.not_retired_while_duty_live` ·
`guard.reservation.lapse_independent_of_consent` · `guard.delegation.width_ceiling_over_distinct_read_sets` ·
`guard.effect.one_per_step` · `guard.effect.identity_allocated_before_release` ·
`guard.check.reads_only_non_authorable_fields` · `guard.check.tie_break_strongest_sufficient` ·
`guard.intake.per_origin_subcap_preserves_intake` · `guard.approval.expiry_present` ·
`guard.supersession.walks_derived_closure` · `guard.acceptance.resolution_reason_present` ·
`guard.skill.declared_grant_inert` · `guard.launcher.stripping_positive_control`.

### 12.5 Negative fixtures — one per new guarantee, each with its paired benign case

**SPECIFICATION.** Protocol §4's pairing rule and X17's false-exclusion requirement apply to every row:
**both numbers are reported or neither is.**

| # | Adverse case, which must fail | Paired benign case, which must pass |
|---|---|---|
| 1 | A derivation that reaches two classes and applies only the higher one's gates | An action reaching one class, gated by that row |
| 2 | A checker whose delivered inputs include the producer's rationale field — detected by the **loader's record**, not the checker's claim | A checker whose delivered inputs are the artifact and the criteria, which must **not** be flagged |
| 3 | Acceptance criteria amended by the producing path between admission and submission | Criteria amended by the capability owner through a versioned revision before the producing step starts |
| 4 | A trial interest declaring a writer key over an existing sole-writer kind | A trial interest writing into a kind whose writer is already any activation |
| 5 | An untrusted entry promoted to attested by the investigating activation | A **new** attested fact written from an out-of-band corroborant, with the untrusted entry linked as prompting it |
| 6 | **A probe skill declaring a tool grant, whose arrival at the enforcement point is a failure** (the positive control on grant *removal*) | A legitimate skill whose procedure loads and whose grants come from the work order, which must not be blocked |
| 7 | A grant that did not arrive, where the effect proceeds with less | A grant that arrived, attested at first use, proceeding normally |
| 8 | Fifty sequential consultations inside one budget, each individually cheap | Two consultations over one read set, which must not trip the width ceiling |
| 9 | A protected-lane holder refusing a shed | A holder returning a stated minimum, which must be recorded as evidence and must not block |
| 10 | A reservation unconsumed at the lapse point, held past it | A reservation consumed within the window, which must not be released early |
| 11 | A supersession whose derived closure includes an accepted outcome, left unreopened | A supersession with an empty closure, which must not reopen anything |
| 12 | Work admitted in a duty class whose acceptance role is unfilled | Work admitted in a class whose role is filled |
| 13 | A refusal with no named failed predicate | A refusal naming its predicate, which must be accepted as a terminal state |
| 14 | An acceptance transition with an empty resolution reason | An acceptance with a reason, which must commit |
| 15 | A model-to-model return delivering prose | The same return delivering typed outputs with the prose at a Ref |
| 16 | A model step selecting between acceptance strengths through a declared branch | A model step supplying a typed value into a declared field of declared type and domain |
| 17 | A genuine job in unfamiliar wording refused by triage | **This is the false-exclusion control for the whole refusal path** and it must pass |

### 12.6 `coverage/questions.json` fields affected

**The layer owns fields F02–F06 and joins four others.** In directive terms: families **8.7** (agent
operating model), **8.8** (agent organization), **8.9** (skills) and **8.12** (memory and context) are
rewritten; **8.6** (selected architecture), **8.11** (schemas and contracts), **8.14** (evaluation system) and
**8.21** (economics and capacity) gain joins.

| Field | Title | What changes |
|---|---|---|
| **F02** | Work and tasks — how an intention becomes moves | Admission computes the class before the kind; refusal as a terminal state with a named predicate; the per-class disposition of unhandleable work; the acceptance interval and its holder |
| **F03** | Agents and the roster — who does the work | `ExistenceJustification` and the six reasons with their units; specialized knowledge refused; attributable identity mandatory; standing holders as records with the conjunction test; **no persistent roster, and the profile-convergence probe as the control against one appearing** |
| **F04** | How a worker thinks — the reasoning itself | Unchanged in substance; add that a producer's self-check is preparation and the **acceptance criteria are authored elsewhere and frozen** |
| **F05** | Getting work to the right worker — orchestration | Arming as a computed unstoppable set; five admission verbs and five prohibitions; contention resolved deterministically with a recorded tie-break reason; re-routing **not** scored as a defect, with end-of-sequence cycles counted separately |
| **F06** | Memory and context — what is remembered and what is carried | One authority per field with delivery narrowed per attempt; per-item trust level; dropped constraints; the class the manifest was assembled for; the supersession closure walk; the provider-edit reconciliation |
| **F12** *(join)* | Communication — between workers and with the owner | Typed constraint sets on every boundary including the founder brief; consultation versus handoff keyed to class |
| **F14** *(join)* | Judging the work — quality and review | Who authors the criteria; the fourth F-4 arm; the clean-case rate making a verdict `unresolved`; the calibration writer |
| **F16** *(join)* | Permission and identity — who may do what | The reached-set gating; grant arrival attested; the policy object as a record with a protected-change class |
| **F19 · F20** *(join)* | When work happens · money, cost and value | The lapse point and cross-class release; the exhaustion rule; the evaluation-capacity row; the expected-launch count; the metered observer with cadence and response |

Every touched entry keeps its existing `status`, `owner`, `verification_refs` shape and gains the new
`decision` and `evidence` refs. **No entry's `status_rule` changes**, and the four entries that turn on a
founder packet keep `R2-founder-or-owner-input` and name the packet.

### 12.7 New `AD-` decision entries

**Eight, continuing from AD-014.** Each carries the existing schema — problem, decision, alternatives,
evidence, epistemic basis, accepted design costs, external exposure authorized (`false` for all eight),
reversibility, reopen trigger, implementation evidence (`null`).

| id | Title | One-line rationale |
|---|---|---|
| **AD-015** | Consequence class is the routing axis, and the reached set governs — never a rank | It is the only axis on the founder's list plus leftovers that is a property of the work rather than of the worker, and a rank drops gates the boundary already requires |
| **AD-016** | The class is computed from records the acting party cannot author, and recomputed at the effect | A boundary is real only if what is checked at the moment of the effect is what was granted |
| **AD-017** | A step declares its read set, and the loader delivers and records it | It converts "the checker did not read the producer's rationale" from an assertion into a manifest fact, which no other arrangement in the round can claim |
| **AD-018** | Acceptance criteria are authored by the capability owner, frozen before the producing step, and unamendable by the producing path | It closes the fourth unblinded channel into the checker, which no research lane named and one review found |
| **AD-019** | Relevance is computed by deterministic arming, and no component may prevent an interest arming | It makes a deferral a visible state with a deadline rather than an absence indistinguishable from an oversight, and it keeps the opportunism a shared record exists for |
| **AD-020** | A worker exists only against a justification naming one reason, its unit and a test that can return false | It makes the existence gate mechanical rather than rhetorical, which is what negative control 4 requires |
| **AD-021** | Standing accountability is a record with an address and a reservation; carried model memory is refused | Reachability is separable and is what a grievance needs; carried model identity has no supporting evidence and two deployments refusing to support it |
| **AD-022** | A reservation's minimum is evidence, not consent, and unconsumed allowance lapses independently of its holder | A holder that can veto can hold an empty bucket hostage; a reserve under a non-rolling allowance is waste, not thrift |

### 12.8 `coverage/package.json` rows

Rows **8.7**, **8.8**, **8.9** and **8.12**: rewrite `answer_scope` to the new substance, add
`planning/F2/05-selection-record.md` and the amended `05` to `locations`, and keep `status`,
`implementation_status` and the `validation_note` unchanged — **the note stands and must not be softened: it
is a navigation checklist, not a reviewer verdict.** Rows **8.6**, **8.11**, **8.14** and **8.21**: add the
amended chapter to `locations` and extend `answer_scope` with the join named in §12.6. Row **8.16**
(permissions, approvals, consequence model) gains the reached-set sentence. **No row's `status` advances**:
nothing here is independently reviewed.

### 12.9 Version bump

`05-work-agents-skills.md`: **`WORK-1.0` → `WORK-1.1`**, architecture **`S1.0` → `S1.1`**.
`02-architecture-selection.md`: **`E1.1` → `E1.2`**, with §3 and §8 amended and §9 gaining §11's reopen
conditions. Chapters `01`, `02-authority-recovery`, `04`, `06`, `07`, `08` and `11`: patch-level bumps
recording the join. `registers/decisions.json`: AD-015…AD-022, all `architecture_version: "S1.1"`.
**`coverage/questions.json` and `coverage/package.json` keep their schema versions**; only entry content
moves.

---

## 13. Evidence ledger

**SPECIFICATION.** Every synthesis choice, the finding ids behind it, and its DIRECTIVE §6 kind. A choice
with no finding is marked **†** and counted at the end.

| # | Synthesis choice | Finding ids | Kind |
|---|---|---|---|
| 1 | Consequence class as layer 1's routing axis | R2 F-21.3 · TC-17 · DIRECTIVE §1.5 | INFERENCE on a founder constraint |
| 2 | The **reached set**, never a rank; every reached row's gates apply | AT-M4-02 · `02-authority-recovery.md` §4 | SPECIFICATION restated |
| 3 | Class computed from non-authorable inputs; tool self-description, command-text matching, instruction scoping, definition-file authority and sandbox verdicts all refused | R4 F1, F4, F5, F8, F9, F12 · AG-08 | SOURCE CLAIM |
| 4 | Recomputed at release on the frozen bytes; park on mismatch, never resolve downward; append-only, writer inside the release path | R4 F1, F3 · AS-M4-02 | SOURCE CLAIM + SPECIFICATION |
| 5 | One implementation of the derivation | AT-M4's direct observation on this repository's own classifier | DIRECT OBSERVATION |
| 6 | Declared floor may only raise | AT-M4-01's contract · control 8 motivates | **DESIGN PROPOSAL †** |
| 7 | The declared read set, delivered and recorded by the loader | AT §E.2 · `06` §2 · R7 §7, F9 | SOURCE CLAIM + INFERENCE |
| 8 | Five step kinds; a model step holds no credentials and selects nothing | `07` §5 · R4 F5 · R2 F-09 | SOURCE CLAIM |
| 9 | The five step kinds as an **exhaustive** set | — (its falsifier is one real work item fitting none) | **DESIGN PROPOSAL †** |
| 10 | Guards are pure functions; model output is an input, never a jump | R2 F-09 | SOURCE CLAIM + DECISION |
| 11 | The step boundary is the checkpoint | AT-M1-03's second branch · R2 F-18 | INFERENCE |
| 12 | One effect per effect step | R3 F29, F30, F41, F44 | INFERENCE from source claims |
| 13 | Arming computed, unstoppable, deterministic; all prerequisites gating | R5-01, R5-02 · R3 F33 · R8 B-7 · AG-08 | SOURCE CLAIM + DECISION |
| 14 | Five admission verbs and five prohibitions | R5-02 · `02` §2 · `06` §6 | **DESIGN PROPOSAL †** for the specific five; the prohibitions are evidenced |
| 15 | Trust class gates activation; no provenance-weighted ranking, no write-path screening | R1 F-10, F-11 · R2 F-09 | SOURCE CLAIM |
| 16 | The derived-entry trust floor; promotion is an effect with a non-model discriminator | AS-M5-01 | SOURCE CLAIM (as the gap) + SPECIFICATION (as the rule) |
| 17 | `ExistenceJustification` with one reason, its unit and a falsifiable test | R2 F-20 · X11 · control 4 · AT §E.2 | INFERENCE |
| 18 | The six admitted reasons; specialized knowledge refused; attributable identity mandatory | R2 F-09, F-10, F-21 · R6 F6 | SOURCE CLAIM |
| 19 | The exact field list of the existence record | R2 F-20 supplies unit-and-test; the field list is this record's | **DESIGN PROPOSAL †** |
| 20 | Standing holder by the three-part conjunction | R8 A-4, A-5 · AC §7.4 | INFERENCE |
| 21 | The conjunction itself, as a conjunction | — (M4's own ledger marks it unevidenced; this record inherits the mark) | **DESIGN PROPOSAL †** |
| 22 | Carried model memory refused | R8 A-7 · AC §7.4 | SOURCE CLAIM (two deployments refusing to support it) |
| 23 | Reachability kept as separable | AC §7.4 · review D CH-03 · R8 A-5 | INFERENCE on a review finding |
| 24 | The lapse rule: unconsumed reservation destroyed, priced as waste | R8 §3 · AT and AE §E.2 | SOURCE CLAIM |
| 25 | Cross-class lapse precedence order | `07` §6's class list supplies the classes; the **order** is this record's | **DESIGN PROPOSAL †** |
| 26 | No veto: a stated minimum is evidence, not consent | AE-M4-01 · R8 §8 · M2's R-3 | SOURCE CLAIM + DECISION under a preserved disagreement |
| 27 | Typed constraint sets on every boundary including the continuation and the founder brief | R2 F-04, F-05 · X13 · AG-09 · AX-M2-01 | SOURCE CLAIM |
| 28 | Consultation default at C2+, handoff below | R2 F-17 · R3 F20, F21 · X12 | DESIGN PROPOSAL on source claims |
| 29 | The acceptance interval's four-state set | AG-18 · R5-13 · X18 supply the requirement; the state set is this record's | **DESIGN PROPOSAL †** |
| 30 | The founder-facing transfer is typed: deterministic projection plus a validated narrative | AX §E.2 · G-05 · R2 F-04 | SOURCE CLAIM + INFERENCE |
| 31 | Deterministic oracle before any model checker; union not vote; chance-corrected; abstention first-class | R7 M1, M5, F3, F5, F15 | SOURCE CLAIM |
| 32 | AM-01's paired clean case, both rates or neither; no clean rate ⇒ `unresolved` | AM-01 · R7 F8 · FAL-09 · AG-15 | SPECIFICATION on a source claim |
| 33 | Who authors the acceptance criteria; the fourth F-4 arm | AS-X-01 · G-02 | SPECIFICATION closing a (d) |
| 34 | Independence of influence claimed; independence of error disclaimed in every acceptance | R7 F1, F2, F12, F13 · TC-37 · FAL-08 | SOURCE CLAIM |
| 35 | The provider as a named disclosure destination, discharged by the loader's narrowed projection | AS-M4-01, AS-X-03, AS-M3-04 · `02` §8.2 | SPECIFICATION on a source claim |
| 36 | Model-to-model returns only on a declared edge, crossing the loader, prose undelivered | AS-M1-01 | SPECIFICATION closing a (d) |
| 37 | Projection grants issued as a released act with scope from a parameter authority | AS-M1-02 · CP-84 · R1 §9.5, §9.7 | SPECIFICATION closing a (d) |
| 38 | Grant arrival attested at first use; assume no more than granted, never assume delivery | R3 F59 · X16 | SPECIFICATION on a direct observation |
| 39 | Skill tool-grants inert; stripped at the launcher; positive control on the stripping | R2 F-08 · R6 F7, FC-6 · AG-07 · AS-X-02 | SOURCE CLAIM + SPECIFICATION |
| 40 | Width ceiling per attempt over distinct read sets | AS-X-04 · G-08 | SPECIFICATION on a source claim |
| 41 | The width ceiling's default value | — (the requirement is evidenced; the number is not) | **DESIGN PROPOSAL †** |
| 42 | Per-origin arming rate as a refusal predicate | AS-M5-03 | SPECIFICATION on a source claim |
| 43 | The per-origin rate's default value | — | **DESIGN PROPOSAL †** |
| 44 | Attempt ceiling, bounded retry by error class, `no_progress` terminal, lane progress predicate | AE-M1-04, AE-M2-05, AE-M2-06, AE-M4-04 · `05` §6 | SOURCE CLAIM |
| 45 | Effect identity and deliberate de-correlation designed alongside the shared record | R1 F-17 · AG-17 | SOURCE CLAIM |
| 46 | Refusal as a terminal state with a named failed predicate and its own acceptance owner | R5-14 · AG-12 · R3 §9 F-1 · control 9 | SOURCE CLAIM |
| 47 | Typing with **no** confidence threshold; anything not a predicate match is `no_match` | R5-15, R5-16 · F-7 | **DESIGN PROPOSAL** on evidenced direction; the abstain-always default rests on no finding **†** |
| 48 | Capability creation keeps a human approver; strong-form zero-edit **not** claimed | R5-06, R5-08, R5-21 · TC-19 · CP-77 · G-11 | SOURCE CLAIM |
| 49 | The graduated trial: read-only and internal-artifact admitted on an expiring bounded trial | AC §E.2 · R5 TC-19 | SOURCE CLAIM |
| 50 | Staffing precondition per acceptance role; admission stops while unfilled | AC-M3-02, AC-M4-01, AC-M5-02, AE-M4-05 · M3's own rule | INFERENCE applying a candidate's rule where it was not applied |
| 51 | Acceptance at C3+ is unsampleable; the per-week count is the packet's content | AC-M4-01's second branch | DECISION taking the unflattering branch |
| 52 | Acceptance bound to the evidence, not the founder's presence; the named absence residual | AC-M1-03 · R7 §8 F-6 | SPECIFICATION closing a (d) |
| 53 | The disputed-custodian guard carried across with absent-denies semantics | AC-M2-03, AC-M3-03, AC-M5-03 · `03` | SPECIFICATION transporting an existing mechanism |
| 54 | Funded remedy reserve at closure, else a recorded funding gap | AC-M1-05 · `03` | SPECIFICATION on a review finding |
| 55 | The closure interlock, composed with the unretirable grievance interest | AC-M4-05 · AC §7.2 | INFERENCE on two review findings |
| 56 | Intake sub-caps that preserve intake rather than refusing the next complainant | AS-M2-01, AS-M4-05 | SPECIFICATION on a source claim |
| 57 | Approvals expire; the exposure diff is over effects releasable without a human | AS-M2-02 · R4 TC-25, failure case 8 · DIRECTIVE §1.5 | SPECIFICATION on a founder constraint |
| 58 | The metered observer with cadence, reader and response; the cache collapse priced as capacity | AS-M5-05 · AE-M1-03, AE-M3-04 · G-07 · R8 W-5 · FAL-10 | SOURCE CLAIM + SPECIFICATION |
| 59 | Capacity in `07` §6 units, ratios only, never a token model | R8 W-6 · MG-03 · TC-26 · control 7 | DIRECT OBSERVATION |
| 60 | F-2 reported as owed with the unblocking act and its owner, not as passed | R2 F-19 · AG-13 · control 10 · AE-M3-02, AE-M5-04 | INFERENCE |
| 61 | Expected-launch count per procedure version; D-06 written out | AE-M3-03 | SPECIFICATION on a (c) this record inherits |
| 62 | Deterministic-predicate fraction measured, with a withdrawal threshold | AE-M5-01 | SPECIFICATION; **the threshold's value is a founder parameter and is open** |
| 63 | Supersession walks the derived closure | AX-M1-02, AX-M5-01 · G-06 | SPECIFICATION on a (c) |
| 64 | Per-item trust level, dropped constraints, assembled-for class in the manifest | AX-M2-04, AX-M3-01, AX-M4-01 · DIRECTIVE §8.12 | SPECIFICATION on a founder constraint |
| 65 | Provider-edit reconciliation as the available remedy, with the residual named | R1 F-02, F-21 · AG-02 · MG-07 | SOURCE CLAIM |
| 66 | Calibration writer excluded from every producing path; a write is protected | AS-M1-03 · AX-M2-02 · R7 F6, F7 | SPECIFICATION on a source claim |
| 67 | Removal criterion per new record, in falsifier form | AE-M1-05 · R3 F38, F39 · X10 · W9 | SPECIFICATION on a source claim |
| 68 | Profile-convergence probe as the control against layer 4 | AC-M1-06 · R8 W-4 · MG-11 | DESIGN PROPOSAL on evidence |
| 69 | Re-routing not scored as a defect; end-of-sequence cycles counted separately | R5-20 · D-12 | SOURCE CLAIM |
| 70 | The layer precedence order itself | — | **DESIGN PROPOSAL †** |
| 71 | The unclassified envelope's exact contents | R5-06's direction; the contents are this record's | **DESIGN PROPOSAL †** |
| 72 | The C3 floor applied to all four outward capabilities rather than a named subset | AT-M4-01's branch; **which** capabilities is this record's, and the founder owns the parameter | **DESIGN PROPOSAL †** partial |
| 73 | Alias table, nothing renamed | AT-M3-02, AT-M5-02 · G-10 | SPECIFICATION |
| 74 | `04`'s competence mechanism named, four encounters adopted, exactly two deltas | AC-ALL-01 · G-03 · `04` | SPECIFICATION transporting a fixed mechanism |
| 75 | FAL-02 restated at reduced strength | G-13 · AT §9 | SOURCE CLAIM correcting all five candidates |
| 76 | The citation existence-and-drift check run before authoring | AX-ROUND-01 · G-14 | SPECIFICATION on a round-level finding |
| 77 | A control failing at one layer and passing at another is a failure at that layer, and the layer must be named | AT §7's split result · control §4's own scope | **DESIGN PROPOSAL** as a protocol reading; control §4.10 not violated |

**Count of DESIGN PROPOSAL choices with no evidence behind them: 11** — rows **6, 9, 14, 19, 21, 25, 29,
41, 43, 47, 70**, plus **row 72 partially** and **row 77** as a protocol reading rather than a design choice.
Every one is a **shape, a field list, an exhaustiveness claim or a default value**, and every one is the kind
of choice an implementer would otherwise invent silently — which is why each is named rather than absorbed.
**Row 70 — the layer precedence order — is the load-bearing one:** if the precedence is wrong the whole
decision is wrong, and nothing in this round tests a precedence between routing units because no candidate
had more than one.

**Two things this record deliberately does not assert.** That the synthesis consumes less scarce capacity
than the simple baseline or than the current position — **UNKNOWN**, no absolute denominator exists and only
ratios between arms are computable. And that independent verification is achieved — **it is not**, within one
model family, for the self-consistent error class, and the residual is disclosed in every acceptance that
rests on a same-family checker rather than laundered.

**One measurement-integrity note about this record's own inputs.** No lane, candidate or review in this round
registered a claim through the ledger; seven of eight lanes reported the registration tool absent while the
roster declares the grant. **Not one quotation this record relies on has been machine-verified against its
source by a resolver.** This record therefore reproduces, in its own provenance, the declared-versus-delivered
gap it names as a design risk — and **R-G14 is the repair, scheduled before the builder starts rather than
after.**

---

*Step 5a-ii artifact. It selects; it does not accept. Five (d)-class findings remain open on founder
decisions, two residuals carry owners and exit conditions, and the founder's hold on building stands until he
lifts it in his own words.*
