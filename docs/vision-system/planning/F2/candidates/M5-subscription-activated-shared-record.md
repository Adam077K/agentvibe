# Candidate M5 — Subscription-activated capabilities around a shared record, with an explicit admission authority

**Date:** 2026-09-13. **Status:** one of five F2 candidates formed blind of each other. Nothing here is
selected, implemented, or measured. No runtime exists. Every mechanism is a **DESIGN PROPOSAL** unless its
label says otherwise, and the evidence ledger in §12 says which is which.

**Protocol applied:** [`00-acceptance-protocol.md`](../00-acceptance-protocol.md) frozen at `26af5d5`, plus
amendment **AM-01** ([`00-acceptance-protocol-amendments.md`](../00-acceptance-protocol-amendments.md)),
which gives fixture F-4 a paired clean case. Fixed boundaries are preserved; **this candidate reopens none
and routes no decision packet against one.**

**Kind labels** follow [DIRECTIVE §6](../../inputs/DIRECTIVE.md): fact · direct observation · source claim ·
inference · hypothesis · design proposal · decision · founder constraint · assumption · unknown ·
disagreement · refusal · deferred question · implementation discovery.

**A terminology collision, resolved once.** This candidate is named for coordination *by subscription* in
the publish-and-extract sense [R3 F33]. The word also names the provider plans that bind capacity
[DIRECTIVE §8.21]. Throughout, the coordination mechanism is a **standing interest**, its firing is
**arming**, and the plans are the **provider allowance**. The two never share a word again.

---

## 1. Summary for the founder

**Reversibility first.** Reversible while this is a document. Moderate once the declarations exist. **Hard
once authority over each record field is assigned** — that part is not undone by deleting code.

Your phrase "coordinated capabilities around a shared source of truth" is a named 1970s architecture whose
author wrote that it deliberately omits the one thing you need: who decides what happens next [R5-01]. M5
fills that hole with two halves that must never be one component.

**Nothing is dispatched.** Capabilities declare in advance the exact typed conditions that make them
relevant — a duty accepted, a deadline near, a payment unexplained, work declared finished. When the record
changes, a deterministic check says which are now **armed**. No agenda-holder can stop a capability arming.
That is what keeps the opportunism a shared record exists for, and what the source warns a monitor destroys
[R5-02].

**Running is scarce and owned.** Your two concurrent slots mean at most two armed capabilities run. One
**Admission Authority** decides which, in what order, and what is shed at four ventures' demand. It has five
verbs and five prohibitions: it cannot stop anything arming, cannot create a permission, cannot rule an idea
bad, cannot retire a duty, cannot accept work it admitted.

**What it buys.** Work matching nothing is neither dropped nor silently mistyped; it lands in a named pool
with an owner, an alarm and a long retention. Anything that fired had to read the record to fire, so the
file everyone is supposed to trust cannot be the file nobody read.

**What it costs.** One rule may disqualify it: **no arming condition may call a model.** If your conditions
cannot be written as deterministic checks over typed fields, every record change costs a launch and M5
becomes the most expensive candidate here. M5 also cannot create a new *outward-acting* capability without
your approval — it proposes one with tests; read-only ones it creates on a trial. And the shared record is
exactly how a producer can leak its preferred conclusion to its own checker; my fix is untested.

---

## 2. Core primitives

**DESIGN PROPOSAL.** Seven primitives. Everything else is composed from them.

### 2.1 The Record

The Record is **not one store that everyone reads**, and three findings forbid that reading. A larger
authoritative view delivered to every reader makes every reader measurably worse [R8 W-3]; the package
already prohibits query-all-then-filter and already narrows peer projections [06 §3, 05 §4]; and the one
production existence proof for "a single authority over many native stores" is a dedicated global service
built for **one fact class** at enormous cost [R1 F-23]. **DECISION.** The Record is *one authority per
field, with delivery narrowed per attempt*. Native accounting, CRM, support, code and professional meanings
stay authoritative in their own systems [02 §5].

An **entry** is an immutable, typed, versioned, owned unit. **DECISION, from R3 F24/F25:** a write is an
appended event, never an in-place mutation, so what is true and how it became true are one artifact rather
than two that can disagree. **DECISION, from R3 F42:** every entry has one **writer key** with single-writer
concurrency, making last-writer-wins structurally impossible rather than merely discouraged. That is
protocol §5 item 8 answered by construction.

Entry kinds, and who may write each:

| Kind | Carries | Sole writer |
|---|---|---|
| `Fact` | An observation: entity, value, observed-at, valid-from/until, provenance, trust class | The capture identity of the adapter or person who observed it |
| `Constraint` | A **typed** exclusion, deadline, promised remedy, unit, or recipient scope — never prose | C01 for endorsed constraints; `constraint-discrimination` for document-derived ones, only after its discriminator resolves |
| `Decision` | Endorsed choice, reasons, rejected alternatives, effective time, amendment route | C01 (founder authority) or the named deciding domain |
| `Obligation` | Principal, counterparty, promised performance, deadline, discharge authority — and it **survives the case carrying it** | The obligation's discharge authority |
| `Assignment` | Custody: owner, `custody_basis`, `custody_tie_break_reason`, `contesting_mandate_refs`, alternate, expiry | The `unowned-duty` interest, deterministically |
| `AuthorizationRef` | A *pointer* to a live grant epoch and recipient scope — never the grant itself | C04, write-only from C04's side |
| `Contradiction` | A ContradictionSet over one key, with both claims retained and no winner | The `contradiction` interest |
| `Question` | An unknown, why it matters, search attempted, resolution predicate, custodian, stopping rule | Any activation; closed only by its custodian |
| `NextAction` | The current view of what should happen: author, **different** approver, validity window, re-issued not edited | The `next-action` interest; approved by a different function |
| `CapacityState` | Allowance observations: source, observed-at, valid-until, bucket, remaining-or-unknown, confidence | The capacity observer identity |
| `AcceptanceState` | `submitted` · `accepted` · `rejected` · `contested`, with the **acceptance owner named at submission** | The acceptance owner; producers may write `submitted` and nothing else |

**INFERENCE, and it is the reason the table has eleven rows rather than five.** The founder's five
constituents — goals, current decisions, canonical files, verified knowledge, an updated view of what should
happen next — are refuted as *sufficient* by the lane that owns them. The dominant measured failure is
**authorization and recipient scope**, which is none of the five [R1 TC-14, from violation rates of
15.8–50.9% on frontier models]. Temporal validity, explicit contradiction state and surviving obligations
are three more, each with evidence rather than preference behind it [R1 TC-14; 02 §3].

**Trust class**, on every `Fact`: `endorsed` (authenticated human authority) · `attested-external`
(authenticated capture of a counterparty document) · `derived` (produced by an activation from named
inputs) · `untrusted-external` (anything a tool returned, any inbound channel, any model-read web page).
**DECISION.** Trust class is a **gate on what an entry may activate**, never a weight on a ranking. §5.3
gives the reason and the price.

### 2.2 Standing interest

A **standing interest** is a versioned, owned declaration with these fields, all mandatory:

`id` · `version` · `owner` (a maintenance custodian) · `capability_refs` (which of the 46 CAP ids it serves)
· `precondition` (a conjunction of typed predicates over entry fields) · `effect_class` · `production_mode`
· `requires_grant` (named, not held) · `writer_keys` (what it will write) · `budget` (launches, wall clock,
allowance class) · `tests` (six, including a **paired clean case it must not fire on**) · `latest_responsible_time`
rule · `removal_criterion` · `review_by` · `expiry`.

**DECISION — the hard rule.** A precondition is evaluated by deterministic code over typed fields. **No
precondition may invoke a model.** Two reasons, and they are independent. Determinism is the only lever that
reduces provider consumption without reducing work [R8 B-7]; and a model-evaluated gate is a model-placed
boundary, which three lanes independently say cannot hold [R1 F-14…F-16, R4 F4/F6, R3 §9, AG-08]. A model
may *propose* an entry that later satisfies a precondition. It may never *be* the precondition.

**DECISION — activation is dependency-gated, not triggered.** An interest arms only when **every** declared
prerequisite holds simultaneously, each unexpired, none contradicted, and each at or above the required
trust class. This is the shape MetaGPT ships and reports scores against: *"an agent activates its action
only after receiving all its prerequisite dependencies"* [R3 F33]. A single-prerequisite trigger is a
different and weaker object, and M5 does not use one.

**`effect_class`** is a closed ordered enum: `read_only` · `internal_artifact` · `outward_draft` ·
`outward_release`. **INFERENCE.** Consequence class is the strongest of the four candidate sixth reasons
that survived adversarial search against the founder's five [R2 F-21], and it is what DIRECTIVE §1.5 sets
supervision by. Drafting an internal note and drafting an outward customer promise can be identical in
work, tools, skills and context and still require different performers.

**`production_mode`** is the five-way rule of 02 §3 — deterministic computation, durable procedure, bounded
model work, capable people, qualified professionals and services — and the interest must name the **property
of the work** that put it in that mode [TC-23, DIRECTIVE §1.2].

### 2.3 Arming, activation, the Admission Authority, the effect allocator, the unmatched pool

**Arming** is a computed set, visible to anyone authorized to read it, produced by deterministic evaluation
after every committed record transition. **Activation** is an admitted, budgeted, leased run of one armed
interest. The **Admission Authority** turns the first into the second. The **effect allocator** issues
idempotency keys over `(effect_class, counterparty, payload digest)` so that two activations cannot produce
one external effect twice. The **unmatched pool** is the named destination for an owned, accepted, due entry
that armed no interest of sufficient effect class.

---

## 3. Control structure

**DESIGN PROPOSAL.** Control is split in two, because the 1986 source prices each resolution of the split
and declines to choose [R5-01, R5-02]. Splitting is M5's actual answer to TC-41, and it is not one of the
three loci the claim names.

### 3.1 Arming is decentralized, unprivileged and unstoppable

**DECISION.** No component may prevent an interest from arming. The Admission Authority holds no write
access to `Fact`, `Constraint` or `Obligation` entries, so it cannot make a precondition false. This is the
clause that keeps opportunism, and it is written against a named cost at the source: a monitor introduced to
serialize access acquires *"broad executive power ... the power to violate one essential characteristic of
the original blackboard model, that of opportunistic problem solving"* [R5-02].

**INFERENCE, and it is M5's answer to negative control §4.1 (rename-only).** The behavioural difference from
today's position is observable: under S1.0 nothing exists until the case authority admits it, so a deferral
and an absence look identical. Under M5 the armed set exists whether or not anything is admitted, so a
deferral is a visible state with a latest responsible time attached. That is a different observable, not a
different noun.

### 3.2 Admission is centralized, and its powers are a closed list

The Admission Authority may do exactly five things, each producing a record: **admit** (with budget and
lease), **defer** (with a latest responsible time; deferral past it is a refusal and must be recorded as
one), **shed** (a whole class, with an overflow count), **refuse** (naming the failed predicate), **rank**
(by the endorsed class shares of 07 §6).

It may not, and each prohibition has a different mechanism:

| It may not | Enforced by |
|---|---|
| Prevent an interest arming | No write access to precondition-bearing entry kinds |
| Author or widen a grant | Its identity holds no outward permission at all; grants come from C04 at the effect |
| Decide an interest is *wrong* | Refusal is by closed predicate set; a refusal with no named failed predicate is invalid |
| Retire an `Obligation` or close a `Question` | Sole writer is the discharge authority / the question's custodian |
| Accept work it admitted | The `AcceptanceState` writer is the named acceptance owner; an activation's admitter is excluded from that role |

**INFERENCE.** This half-answers C2's named problem for free — *"an organization can validly finish support
and bookkeeping while indefinitely deferring an inconvenient cross-function question"* [AC §1] — because the
question arms, cannot be un-armed, and its deferral carries a deadline. §9.3 states how much of C2 that
leaves unbought.

### 3.3 Contention between two armed interests

**DECISION.** Deterministic, in order, with the deciding step recorded as `contention_tie_break_reason` so
that two implementations are comparable — the same device 03 already uses for custody.

1. Disjoint writer keys and disjoint effect scopes → both may run, subject to capacity.
2. Same writer key → one runs; the other is `deferred-on-key` and re-arms on release.
3. Same allocator idempotency key → the second **joins** the first and inherits its outcome; it does not
   race and does not re-release. **SOURCE CLAIM, and this is why the rule exists:** eighteen of thirty
   agents chose the same git branch name, and a job queue took 2.4 million requests to accept 117 [R1 F-17].
   The cause is correlated behaviour between identical models, not divergent context, and a shared
   authoritative view does not fix it — R1 records it as the counter-mechanism the thesis does not predict.
4. Semantic conflict with no shared key — two accepted artifacts that together promise something neither
   promised alone [05 §6] — is **not detectable at activation time**. It is detected by a merge interest
   that arms on exactly that pattern. **M5 says plainly: this is after-the-fact detection.**
5. Ties: narrowest sufficient effect class, then earliest latest-responsible-time, then earliest arming
   instant, then entry id.

### 3.4 Bounding the disturbance loop

**DESIGN PROPOSAL, written against a named defect in the deferred candidate C.** The technical review found
that in C, bounded reactions can compose into an unbounded company-level loop: each observation produces a
fresh trigger identity, contradictions change eligibility immediately, and every individual proposal
respects its own limits while the aggregate consumes the allowance [D-technical T07]. M5 inherits the exact
shape and answers it with three mechanisms: **re-arming on the same semantic cause consumes a per-cause
allowance**, fingerprinted by stable cause and scope rather than by wording or by a new identity [05 §6];
the protected due-service share is never borrowable by a cascade [07 §6]; and the unmatched pool counts
overflows, because shedding without a count is indistinguishable from a silent drop [R5-19].

**UNKNOWN, and I decline to claim otherwise.** T07's own assessment of C's equivalent bounds is that they
*"defeat simple infinite recursion. They do not yet establish useful progress under sustained novel
disturbance."* That is true of M5's bounds too. The falsifying test is T07's, unchanged.

---

## 4. Execution structure

**DESIGN PROPOSAL.** An activation is: lease + budget + pinned interest version + pinned input versions +
a permission-filtered projection + an identity that holds no outward permission.

**DECISION — activation is not authorization.** An interest that arms and is admitted holds exactly the
authority its identity already held, which for a fresh activation is none outward. `requires_grant` *names*
what the effect will need; C04 issues it, attenuated and expiring, at the moment of release, after
re-reading current grants, identity epoch, grant epoch, scope epoch and restrictions in one serial
transaction [02 §4, §6.2 step P3]. **SOURCE CLAIM:** the entire confused-deputy literature is the study of
what goes wrong when the name travels with the request and the power comes from somewhere else [R4 F1], and
a self-activating subscriber is that shape exactly unless the check at the effect is the same object as the
grant.

**DECISION — a procedure package never carries authority.** The launcher computes an activation's tool set
from the grant, not from any file the activation loads. **FACT, and this is a conformance obligation rather
than an assumption:** in the runtime this system plans to launch, a skill's `allowed-tools` frontmatter
*"grants permission for the listed tools during the turn that invokes the skill"*, *"does not restrict which
tools are available"*, and *"a skill can grant itself broad tool access"* [R2 F-08, R6 F7, quoting the same
vendor page independently; 80% attack success through skill files, R6 FC-6]. 05 §8's rule that a prose
package cannot spend is correct as design intent and false as a description of that runtime. M5 must close
it at the launcher.

**DECISION — delegation depth is a safety property, not configuration.** Two vendors ship opposite defaults
deliberately [R3 F18, D-10], and the answer decides who may change the ceiling. M5 sets the default at one
child layer, assigns the ceiling to the capability owner, and classes a change to it as a self-modification
requiring review. A child's grant is `intersection(parent's held grant, child interest's declared need)`
computed by C04 **at the call**, not read from the child's own definition — which inverts the measured
default of the runtime, where tool inheritance is total unless a file says otherwise and the delegator
cannot attenuate at the call [R4 F5].

**Production mode discipline.** Preconditions, arithmetic, permission checks, schedules and transitions are
deterministic. Interpretation, drafting and synthesis are bounded model work. Relationships, taste and
consequential judgement are people; professional determinations are professionals; physical fulfilment is a
real service [02 §3]. **INFERENCE:** a candidate that adds executors while leaving deterministic work in
model calls has not paid for its executors, it has paid for the wrong thing twice [R8 B-7].

**Capacity shape.** Under CP1 — one native job plus one external job [07 §6] — **arming is free and
activation is scarce**. Many interests may be armed; at most two run. **SOURCE CLAIM:** thirty executors at
CP1 do not multiply concurrent context windows, they serialise, so the founder's token-multiplication cost
describes a system this specification does not permit [R8 W-1]. What M5 pays at scale is deferral and
crossed deadlines, not concurrent context. **UNKNOWN:** four thesis cost claims cannot be measured at this
pin, and raising it to measure them is circular [MG-02, AG-13].

---

## 5. Information flows and memory model

### 5.1 Delivery is narrowed, and the manifest records what left

**DECISION.** An activation receives a **projection**, assembled by the loader, never the Record. The loader
records actual delivered inputs and does not trust the caller's claimed read list [06 §2]. The manifest
carries version, age, trust level, **what was omitted, what was summarized and what may have been lost**
[DIRECTIVE §8.12].

**FACT, and it constrains what the manifest can promise.** No standard in the path carries those fields:
MCP resources define uri, name, title, description, mimeType, size and three annotations, none of which is
omission or loss; the OpenTelemetry GenAI registry defines no omitted-or-truncated attribute at all [R1
F-21]. And the provider edits context server-side *after* the loader has handed off, reporting only
`cleared_tool_uses` and `cleared_input_tokens` [R1 F-02]. **DECISION:** M5 reconciles the provider's reported
edits against the manifest on every response and treats an unaccounted edit as a defect, not as
housekeeping. That is the available remedy, it costs one field read, and it does not make the manifest
complete.

### 5.2 Freshness, expiry and contradiction

Every entry carries `valid_from`, `valid_until` or `stable`, and `review_by`. **DECISION.** An expired
precondition does not fire its interest; it fires the `freshness` interest instead. Time passing alone
cannot renew a claim [06 §4]. A contradiction on a precondition field **suspends** the interests that depend
on that field and arms `contradiction`, which retains both claims in a ContradictionSet rather than picking
a winner [06 §3]. Protected due service proceeds on unaffected valid facts.

### 5.3 Contamination — the defence, and its price

**SOURCE CLAIM, and it is the finding most adverse to any shared-record design.** A poisoning attack that
injects only false statements in ordinary conversational form, *"no instruction, no override, no role
manipulation"*, passed a four-stage write-path screen **360 times out of 360**, while the same screen caught
indirect prompt injection at 0.832 recall. At 1.2% of the corpus it took accuracy from 0.850 to 0.300.
Read-path provenance ranking at its shipped weight was statistically indistinguishable from no defence
(p=0.80); at the weight that worked it took evidence recall to **exactly zero** [R1 F-10]. Separately, models
override their own correct prior knowledge with incorrect retrieved content more than 60% of the time [R1
F-11].

**DECISION — M5's defence is structural gating, not screening and not ranking.**

1. **Trust class gates activation.** An `untrusted-external` Fact may be a precondition only for interests
   of `effect_class: read_only`. It can never gate an outward effect and can never serve as a discriminator.
   **SOURCE CLAIM for the mechanism and its price:** separating trusted control flow from untrusted data so
   that *"the untrusted data retrieved by the LLM can never impact the program flow"* solved 77% of
   benchmark tasks with provable security against 84% undefended — a measured seven-point utility cost, the
   only published price among the founder's five criteria [R2 F-09].
2. **Consequential preconditions carry a discriminator.** An entry that gates an activation above
   `internal_artifact` must name the cheapest out-of-band check that would falsify it — destination state, a
   deterministic counterexample, original customer evidence, or a scoped professional assessment [06 §7] —
   and that check runs **at the effect**, not at write time. A plausible false entry carrying no attack
   signature is detectable only out of band [R1 failure case 5].
3. **A correction must bite.** Superseding an entry arms an understanding check — a new bounded case or a
   direct critical-field probe — because storing the correction alone is insufficient [06 §4, CP-142]. **It
   is the one mechanism in this area the evidence does not refute, and it is untested anywhere** [R1 TC-42].
4. **False exclusion is measured in the same session or neither number is reported.** Every filtering, trust
   and refusal mechanism in M5 runs its paired clean case alongside its adverse case [AG-15, X17, MG-14].
   Every filtering source in the round measures leakage and none measures correct work refused.

### 5.4 What is *not* claimed

**REFUSAL of two credits this candidate could have taken.** M5 does not claim the attention sense of
isolated context: that sense moves with the model generation and no frozen fixture exercises it [R2 §8]. And
M5 does not claim parallel work as a reason any interest exists: whether splitting pays is a property of the
partition, not of the job [R2 F-06], and CP1's two slots are not interchangeable [R2 F-19]. Negative control
§4.4 exists to catch exactly those two claims.

---

## 6. Evidence · Authority · User · Failure · Self-improvement

**Evidence model.** Producer self-checks are preparation, never acceptance [05 §4]. `submitted` and
`accepted` are different states with different writers, and the interval between them has a named owner —
the acceptance owner, from the moment of submission. **SOURCE CLAIM:** that interval exists in no surveyed
system and in every business obligation; every framework terminates on producer-declared completion [R3 §9,
X18], and the most widely deployed tracker permits a Done item with an empty resolution [R5-13]. M5 refuses
that state: an `accepted` transition without a resolution reason is rejected by the writer guard.

**Authority model.** C04 alone releases consequences. Grants are named by interests, issued by C04,
attenuated at the call, expiring, and re-read live at release. **SOURCE CLAIM:** attenuation is solved and
shipped in three independent production families, all of which put it in the credential or the call rather
than in the holder [R4 F2]; and attenuation buys narrowing but not revocation, so live re-read at the
enforcement point is the half that credentials do not cover [R4 F3]. **DIRECT OBSERVATION carried forward:**
a grant in this repository's own harness was observed to **narrow reliably and arrive unreliably** — 24
tools one day, zero on three dispatches two days later, configuration unchanged [R3 F59]. M5 may assume a
child holds no more than it was granted; it may not assume it holds what it was granted, so an activation
verifies its own grant at first use and refuses rather than silently doing less.

**User model.** The founder receives a **designed return**, not a recommendation [DIRECTIVE §1.6]. Three
standing interests carry it: `founder-return` (a fixed rotation of original customer evidence, taste
choices, unfamiliar financial interpretation and recovery practice, inside his chosen attention budget),
`refusal-sample` (a sample of what the system declined, because a refusal nobody reviews is a decision
nobody made), and `reentry-brief`. **SOURCE CLAIM, and it changes what the brief must contain:** in
hidden-profile tasks agents fail to surface private information that contradicts group consensus [R1 F-17].
A next-action view everyone trusts suppresses dissent. The brief therefore carries **what was omitted and
what was contested**, not only what was decided. **UNKNOWN:** the dose is not established, the delayed
unfamiliar-transfer test is unexecuted in the literature [R1 TC-29], and nothing in the surveyed field
measures whether a system's operator remains competent [AG-10].

**Failure model.** Six named failures, each with a detector: mis-routing (detected by out-of-scope recall,
not overall accuracy [R5-15]); silent drop in four shapes (overflow pass-through, unpolled queue, retention
shorter than the outage, exhausted escalation ladder [R5-19, R5-13, R5-10, R5-12]); duplicate admission
(allocator key collision); unowned work (the ordered resolver, with a terminal standing custodian);
ping-pong, whose harmful shape is cycles at the end of a sequence rather than reassignment count [R5-20];
and refusal as a disguised drop, which is two tests — the refusal must happen *and* leave a record with an
owner [R5-14]. **DECISION, against D-12:** M5 does not score re-routing as a defect. It counts
end-of-sequence cycles separately, because a design that minimises re-routing may be suppressing diagnosis.

**Self-improvement model.** Improvement is a bounded case with problem evidence, alternatives **including
removal**, affected contracts, benefit/harm hypothesis, test budget, rollout, independent observation and
rollback [02 §5]. Every interest carries a removal criterion, which is W9's failure condition answered per
mechanism. **SOURCE CLAIM:** the group that established that interface design measurably changes agent
behaviour now ships a hundred-line successor that deletes it and scores competitively, so a scaffold's
contribution is a function of the generation that motivated it and must be re-ablated when the model changes
[R3 F38/F39]. The `improvement` interest cannot write protected capture, evaluator selection, or its own
assessor.

---

## 7. The six fixtures, worked as record transitions

### F-1 · An unknown kind of job appears mid-build

**Useful outcome.** A supplier's contract obliges a data-deletion procedure nobody planned.

1. **Entry.** The adapter's capture identity writes a `Fact` of kind `counterparty_document`, trust class
   `attested-external`, writer key `(supplier_id, document_id)`. Authenticated capture proves origin within
   its boundary, not truth.
2. **Arming.** `contract-clause-extraction` arms: new counterparty document, class ≥ attested-external,
   unexpired, uncontradicted. Effect class `internal_artifact`, production mode bounded model work.
3. **Proposal.** It writes **proposed** typed `Constraint` entries:
   `{kind: deletion_duty, scope: supplier_contact_personal_data, trigger: contract_termination,
   deadline: T+30d, remedy: written_confirmation}`. **SOURCE CLAIM for why typed rather than prose:** under a
   25-word compression budget operational facts survived at ~0.97 and boundary markers at ~0.57, vague
   constraint language leaked protected information in 73% of cases, and a typed allowlist leaked **0 of 48**
   [R2 F-04].
4. **Discrimination.** `constraint-discrimination` arms on a proposed constraint with no discriminator
   result, resolves the exact clause span by deterministic exact-field comparison [06 §2] and, the duty being
   legal in kind, routes a scoped professional determination. Only then is the Constraint accepted.
5. **Ownership, by rule, at arrival — no human edit.** Acceptance arms `unowned-duty`, which can never be
   retired. It runs the ordered resolver deterministically — promise sponsor → service mandate → maintenance
   custodian, narrowest sufficient, then alternate available, then earliest acceptance — recording
   `custody_basis`, `custody_tie_break_reason` and `contesting_mandate_refs` [03]. Custody exists in the same
   transaction as the duty, and **a disputed assignment does not suspend it.**
6. **Typing and the pool.** Does an interest exist to *perform* a counterparty data-deletion? Suppose not.
   Then the due transition arms nothing of sufficient effect class, and the entry lands in the **unmatched
   pool** — whose precondition is the computable complement "accepted, owned, due, armed nothing at or above
   its required class". **REFUSAL of a common shortcut:** this is not a catch-all branch offered as a
   completeness argument, and I name its residue as the source requires [R5-09]. **The pool cannot catch an
   entry that armed the *wrong* interest.** Mistyping is invisible to it, and only out-of-scope recall
   measurement finds that class.
7. **Triage.** `triage` is read-only, unretirable, alarmed on arrival, with retention longer than the
   longest plausible outage [R5-10]. It emits an `InterestProposal` carrying preconditions, effect class
   (`outward_release`: it writes to a supplier and deletes data), production mode, six tests **including the
   paired clean case**, budget, latest-responsible-time rule, removal criterion and expiry.
8. **Staffing — and M5 states the limit rather than claiming past it.** Because the effect class is
   `outward_release`, the proposal goes to the legitimate capability owner as a decision packet with a
   latest responsible decision time of `T+30d` minus the procedure's own duration. **DECISION, graduated:**
   proposals at `read_only` and `internal_artifact` are admitted under a standing mandate as an expiring
   bounded trial with mandatory review; proposals at `outward_draft` and `outward_release` require a human
   approval. **SOURCE CLAIM for why no candidate should claim otherwise:** no located system staffs a
   genuinely novel work type without a pre-declared envelope, a pre-registered handler, or a human redeploy
   [R5-06 CMMN, R5-08/R5-13 Temporal, R5-14]; the one counterexample writes a new *skill* and depends on an
   automatic success oracle a business case does not supply [R5-21 Voyager]. TC-19 splits into four
   sub-claims with different answers, and **staffing is where it fails** [R5, TC-19 verdict].
9. **Acceptance.** The obligation's discharge authority owns it. The acceptance predicate is **written
   confirmation from the supplier** — an external observation, not an internal status. A successful dispatch
   does not satisfy that guard [05 §3].

**Adverse A — malformed, partly false, untrusted channel.** The entry is written with trust class
`untrusted-external`. It arms `investigate-untrusted-report` and **nothing else**, because §5.3's gate
forbids an untrusted entry from gating anything above `read_only`. The investigation seeks an out-of-band
corroborant; on success a *new* attested Fact is written and the untrusted entry is linked as
`prompted_by`, never promoted. On failure the report terminates as `unresolved-unattested` with a custodian
and a review date. **Price, stated:** seven points of task utility [R2 F-09] plus an unmeasured
false-exclusion rate, which M5 requires be measured in the same session.

**Adverse B — a genuinely spurious job, refused with a reason.** Admission bias is toward accepting the
*report* and is paired with an explicit prohibition on self-dispatch [R5-04, R5-05]. Typing returns
`no_match`; the pool receives it; triage applies its closed refusal predicates — no principal or venture in
scope, no obligation, no counterparty standing, no mandate covers the harm, no reachable consequence class —
and refuses, **naming the failed predicate**, as a terminal state of the same record [R5-14]. It is sampled
back to the founder. Negative control §4.9 fails a router that admits everything; M5's refusal is by
predicate rather than by judgement, and its matched clean case is a genuine job in unfamiliar wording that
must **not** be refused. **UNKNOWN:** out-of-scope recall is the weak axis — 96%+ in-scope against a best 66%
out-of-scope, falling to 40.3% with fewer novel training examples [R5-15] — and the benchmark base rate is
the inverse of a company's [R5-16].

**DECISION on typing, which closes a would-be (d).** The typing interest has **no confidence threshold**.
Typing is deterministic predicate match; anything else is `no_match` and goes to the pool. A model may
propose a type and may never assign one above `read_only`. The cost is real and I name it: more items reach
the pool, and the pool's throughput becomes the bottleneck.

### F-2 · Demand at 4×

At 1× and 2×, the armed set is small and both slots are usually free; the measurable is coordination minutes
and transmitted context bytes **reported separately from work performed** [R1 F-2 implication, MG-20]. At 4×
the armed set grows roughly fourfold and the admitted set stays at two. **The observable is queue depth and
crossed latest-responsible-times, not a token multiple** [R8 W-1].

**What is shed, and by whose authority.** The Admission Authority sheds by class, in the fixed order
discretionary exploration (5%) → maintenance and evaluation (10%) → ordinary creation and research (20%). It
may never shed the 50% due-service floor or the 15% continuity, security and grievance reserve; a grievance
does not compete on a commercial score [07 §6]. **Shed work stays owned** — that single property is what
distinguishes shedding from dropping. Each shed writes the lane, the reason, the overflow count, the
retained owner and the latest responsible time. **Authority to change the shares is the founder's**, not the
Authority's [07 §6].

**Two providers at 3× allowance consumption.** The `credit-setting` interest arms on a changed or
stale-beyond-24h observation of the provider's credit configuration and **halts new launches in that
class**. **SOURCE CLAIM:** the subscription-to-metered path is one setting away at both providers and is
surfaced at exactly the moment of exhaustion, and the package's no-silent-fallback rule currently has no
mechanism [R8 W-5, FAL-10]. M5 converts the policy into a precondition. **It observes; it does not prevent a
person from flipping the setting.**

**What the founder sees.** A capacity packet: which lane was shed, what it defers, each crossed latest
responsible time with its owner, the overflow count, and what raising the concurrency pin would restore —
with the note that raising it is an unmeasured change [X14]. **UNKNOWN, and it bounds every number in this
fixture:** the provider no longer publishes an absolute allowance, so every capacity figure M5 can produce
is a ratio between arms and never a fraction of the week [R8 W-6, MG-03]. *"This design consumes 40% of the
allowance"* is not a sentence anyone in this round can write.

**M5's own capacity cost, named.** Arming re-evaluates on every transition. Because preconditions are
deterministic code, that costs zero provider allowance. **If that rule were relaxed for even one precondition
class, M5 would become the most expensive candidate here.** That is the design's sharpest falsifier.

### F-3 · A task needing three distinct tool permissions

Payment read, customer record write, outbound message send. The interest declares all three in
`requires_grant`. C04 mints a per-activation grant equal to `intersection(mandate, declared need, current
epochs)`, bound to the activation identity, expiring. A composite exceeding the mandate is **refused, not
minted** [R3 §7]. Least privilege is assembled by progressive elevation from a minimal baseline [R3 F46,
MCP's normative scope model], not held from the start.

**Revocation mid-attempt.** The release transaction re-reads the epochs; the revoked permission's effect is
denied at the release step [02 §6.2 P3]. **SOURCE CLAIM, and it is the hazard arriving from the direction
nobody looks:** on resume after an interrupt, *"the entire node restarts from the beginning"*, so side
effects before the interrupt must be idempotent — which is the precise mechanism by which a human approval
step can duplicate the effect it was approving [R3 F29/F30]. M5's answer: effects happen only at release,
releases are keyed by the allocator, and re-entry replays the **record** of a release and never the release
[R3 F41, DBOS's never-re-executed rule].

**The helper that must not get all three.** The child interest declares its own narrower need; C04 computes
the intersection **at the call**. The child's own definition file is never consulted for authority. Depth is
one layer by default and the ceiling is a safety property with a named owner. Which identity performed which
effect is recorded per release with the activation identity and the pinned interest version — attributable
identity being the fourth candidate sixth reason [R2 F-21].

**Revocation is the gap in the field.** It appears in no surveyed system [R3 §9], so this is a build
obligation, not an import.

### F-4 · A verification the producer must not influence — with AM-01

The producer writes `submitted`. That transition arms `check`. The checker's inputs are declared and
**server-recorded by a loader instance the producer cannot write to** [06 §2].

**Two arms, per W5.** Rationale withheld; rationale supplied. **Three channels, per R7 §8 amendment 2:**
blinding the producer's *reasoning* is not enough, because the producer's *preferred conclusion* leaks
through sycophancy on a separate channel [R7 F8, F11].

**The channel this candidate creates, and it is the sharpest question asked against the thesis.** *"Does the
shared source of truth become the preference-leakage channel that defeats provenance separation?"* [R7 §9].
If a producer writes its framing into the Record and the checker reads the Record, the checker has the
framing and every provenance check passes. **DESIGN PROPOSAL:** the checker's projection is restricted **by
entry class** to what the producer could not author — externally provenanced `Fact` entries, `Constraint`
entries written by C01 or C07, the original acceptance criteria, and the artifact. Producer-authored
rationale is a separate class, excluded by the loader by default and included only in the adverse arm.
**UNKNOWN:** nobody has tested this. It is class (b) — a documented mechanism whose deployment is unverified.

**AM-01, the paired clean case.** A planted-defect artifact and a clean artifact are judged by the same
checker under the same procedure **in the same session**, and the checker's **refusal rate on the clean
case** is reported beside its **detection rate on the defective one**. **SOURCE CLAIM for why the pairing is
load-bearing:** false-positive rates of 68.4–96.8% on patched files mean an unpaired control cannot
distinguish a working checker from one that refuses everything [FAL-09].

**The residual, disclosed rather than laundered.** Independence of *influence* is achievable by procedure and
measurable: a fresh context beat a context-carrying subagent at 28.6% versus 23.8% F1, p=0.004, while
reviewing twice in the same session did not beat reviewing once at p=0.11 — the second result being the
control that makes the first mean something [R7 F9]. Independence of *error* is **not** achievable within one
family for the self-consistent class, and no blinding reaches it [R7 F13]. **DECISION:** a same-family
checker is never the acceptance owner for an `outward_release`. It is a defect finder at a measured ceiling
of roughly three defects in ten; acceptance for consequential classes routes to the cheapest discriminator
that can actually decide — destination state, a deterministic counterexample, original customer evidence, a
scoped professional, or the founder [06 §7].

### F-5 · A handoff across a capacity reset

**What the resumed attempt may trust.** The portable Continuation and the loader's manifest. Not a
provider-resumed session, unless its ancestry account is sufficient and every retained input is still
allowed for current recipients [06 §2] — and even then, the provider may have edited it and reports only a
count [R1 F-02].

**What it must re-derive: everything that decides what happens next.** This is M5's structural advantage on
this fixture. **The armed set is recomputed from typed entries, never carried in a summary.** A pre-reset
summary that omits a decision therefore cannot cause the wrong activation, because the summary is not what
activates. **SOURCE CLAIM for why that matters here:** compaction has documented deterministic loss rules
and the model is not told what was lost; the skill index is not re-injected at all; detailed early
instructions may be lost [R1 F-01, F-03]. And continuation is mandatory in every arm, including a
single-agent one, because a native job caps at a 360-second window [R2 F-18, FAL-02].

**The changed source fact** is detected by the entry's version and a critical-field probe, never by
re-reading the summary [R1 failure case 4]. If the precondition no longer holds, the activation is
invalidated and the work re-arms or refuses.

**The already-released effect** is detected by the allocator's idempotency record on the effect, not by state
in the Record [R1 failure case 7]. **The reset-specific hazard:** a holding destination whose retention is
shorter than the interruption converts parked work into lost work, so the unmatched pool's retention exceeds
the longest plausible outage [R5-10].

**Who accepts the resumed work.** The same acceptance owner; acceptance ownership is durable across resets.
**One extra rule from R7:** a model verdict taken before the gap is **stale**, in the same class as a pre-gap
source fact, because the provider may have silently updated the model behind a pinned version [R7 §8].

### F-6 · The founder absent for a week

**What continues.** Interests at `effect_class ≤ outward_draft` with live grants under standing mandates.
Authorized work proceeds and useful outcomes are delivered.

**What parks, visibly.** Interests whose grant requires his identity arm and sit in the armed set with their
latest responsible times attached. **INFERENCE:** "waiting for a person" is a queryable state rather than a
stalled process — the only surveyed mechanism with that property is a typed request node [R3 F27], and M5
gets it from the armed set for free.

**The decision arriving day one with a day-four deadline.** A decision packet with a latest responsible
decision time of day four minus execution duration, carrying the exact choice, options, consequences,
reversibility, and **no-answer behaviour** [04]. At that time with no answer the recorded bounded fallback
fires — never "proceed". Either a substitute acts under their own mandate, or the work parks with the
obligation live. **Nothing irreversible happens in his name.**

**The incident on day five.** The 15% continuity, security and grievance reserve cannot have been shed, so
capacity exists. The incident arms containment interests whose authority is separately established, scoped
and expiring, with continuing-duty arrangements [AC §3]. **Containment is not release.**

**The escalation ladder must not end in silence.** An ordered policy with a timeout, repeated up to nine
times, ends with the incident *"assigned to the last user"* and no further notification [R5-12] — assigned
and silent, which is the unowned queue with an owner's name on it. **DECISION:** M5's terminal state is
`awaiting-principal`: the obligation stays live, the alarm stays lit, the count is visible, and the terminal
standing custodian holds it.

**The re-entry brief** follows the pattern from the one system designed for genuinely unforeseen work: a
named author, a **different** named approver, an explicit validity window, re-issued rather than edited, and
the instruction not to delay it in anticipation of information that has not arrived [R5-23]. Contents: what
was decided, **what was omitted and what was contested**, refused-item sample, shed lanes, crossed latest
responsible times, unmatched-pool contents, and the checker's clean-case refusal rate — so he can see
whether his instruments got tighter while he was away. That restores competence rather than awareness, which
is the distinction W12 tests.

---

## 8. Capability binding — all 46, and three named answers

**DESIGN PROPOSAL.** Standing interests, all of which serve many CAP ids: `intake` · `typing` ·
`unowned-duty` · `triage` · `constraint-discrimination` · `contradiction` · `freshness` · `deadline` ·
`check` · `acceptance-timeout` · `capacity` · `credit-setting` · `effect-reconciliation` · `correction` ·
`grievance` · `refusal-sample` · `founder-return` · `reentry-brief` · `next-action` · `merge` ·
`improvement` · `closure`. Marked ∞ where they can never be retired: `intake`, `typing`, `unowned-duty`,
`triage`, `grievance`.

**INFERENCE, and it is M5's answer to negative control §4.8.** One interest serves many capabilities and one
capability is served by many. `deadline` alone carries CAP-19, CAP-20, CAP-21, CAP-24 and CAP-39. That is
the test the control asks for: the boundary follows a record transition, an effect class and a grant, not a
department name.

| CAP | Concern | Interest(s) beyond the standing set | Mode | Acceptance owner |
|---|---|---|---|---|
| 01 | Intent and commitments | `intent-amendment` | person | Founder (C01) |
| 02 | Portfolio direction | `portfolio-review` | person + bounded model | Founder |
| 03 | Opportunity discovery | `discovery-sample` | bounded model | Outcome sponsor |
| 04 | Customer research | `research-discriminator` | model + real people | Outcome sponsor |
| 05 | Market research | `research-discriminator` | bounded model | Outcome sponsor |
| 06 | Company and product strategy | `strategy-review` | person | Founder |
| 07 | Product management | `scope-conflict` | bounded model | Outcome sponsor |
| 08 | Experience and product design | `design-render` | model + founder taste | Founder (taste) |
| 09 | Brand and identity | `brand-guard` | person | Founder |
| 10 | Software and technical construction | `build`, `merge` | model + deterministic tests | Outcome sponsor + `check` |
| 11 | Quality assurance | `check`, `regression-pool` | deterministic + model | Acceptance owner of the artifact |
| 12 | Launch and release | `launch-readiness` | deterministic gate | Outcome sponsor; release by C04 |
| 13 | Content production | `content-draft` | bounded model | Outcome sponsor |
| 14 | Marketing and distribution | `claim-freshness`, `send-eligibility` | deterministic | Outcome sponsor |
| 15 | Sales | `agreement-terms` | person | Relationship owner |
| 16 | Customer communication | `outbound-release` | deterministic render + C04 | Relationship owner |
| 17 | Support and customer success | `remedy-release` | procedure + C04 | **See below** |
| 18 | Pricing and commercial economics | `price-proposal` | model + person | Founder |
| 19 | Finance and treasury | `deadline`, `reserve-pressure` | deterministic | Finance custodian |
| 20 | Bookkeeping and financial close | `variance`, `reconciliation` | deterministic + professional | Professional |
| 21 | Legal and regulatory coordination | `determination-required` | professional | Qualified professional |
| 22 | Privacy and data rights | `rights-request`, `deletion-scope` | procedure + professional | Privacy custodian |
| 23 | Security operations | `access-anomaly`, `containment` | deterministic | Security custodian |
| 24 | Procurement and suppliers | `supplier-commitment` | person | **Founder or delegate; a model never signs** |
| 25 | Partnerships | `partner-terms` | person | Relationship owner |
| 26 | Hiring and external capacity | `capacity-gap` | person | Founder |
| 27 | Human collaboration | `participation-window` | person | Founder |
| 28 | Analytics | `denominator-guard` | deterministic | Metric owner |
| 29 | Experimentation | `plan-registration` | deterministic | Evaluation owner |
| 30 | Operations and fulfillment | `fulfilment-observation` | real service | Outcome sponsor |
| 31 | Incident response | `containment`, `incident-account` | deterministic + person | Incident custodian |
| 32 | Knowledge management | `freshness`, `correction` | deterministic | Knowledge custodian |
| 33 | Governance | `mandate-review` | person | Founder |
| 34 | Organizational learning | `learning-proposal` | bounded model | Knowledge custodian |
| 35 | Scaling | `capacity`, `share-review` | deterministic | Founder (shares) |
| 36 | Pause | `pause-disposition` | deterministic | Founder |
| 37 | Recovery and resumption | `effect-reconciliation`, `restore-verify` | deterministic | Recovery administrator (C08) |
| 38 | Pivot and changed direction | `intent-amendment` cascade | person | Founder |
| 39 | Closure and wind-down | `closure`, `residual-custody` | procedure + professional | **See below** |
| 40 | Institutional formation and readiness | `readiness-gate` | professional | Qualified professional |
| 41 | Succession and transfer | `succession-arrangement` | person | Founder |
| 42 | External grievance and remedy | `grievance` ∞ | person + procedure | **See below** |
| 43 | Owner attention and competence | `founder-return`, `reentry-brief`, `refusal-sample` | designed mechanism | Founder |
| 44 | Truthful account and reproducibility | `account-reconstruction` | deterministic | Independent investigator |
| 45 | Compute, subscription and infrastructure capacity | `capacity`, `credit-setting` | deterministic | **See below** |
| 46 | Controlled system improvement | `improvement`, `interest-review` | bounded case | Capability owner |

**Who accepts a refund (CAP-17).** The refund is an `outward_release` of money. `remedy-release` arms on an
accepted remedy obligation whose amount comes from an authoritative selector — entitlement and terms, never a
document a model read [02 §4]. Within a standing remedy mandate and a bounded amount it releases without
founder approval; above the bound it is a decision packet. **The acceptance owner is the customer-outcome
sponsor for that offer**, and the acceptance predicate is the **observed destination state** at the payment
processor plus counterparty acknowledgment where the promise requires it. Never the producer's report.

**Who owns a non-customer grievance six months after closure (CAP-42 with CAP-39).** `grievance` is ∞ and
its precondition does not reference an active venture, so a wound-down venture still arms it. **Closure
cannot be recorded as complete while a surviving duty has no accepted custodian** — the state is
`retired-with-residuals`, not `retired` [05 §10], and the custodian named in the closure disposition holds
it. If that custodian is unavailable, the terminal standing custodian does. The grievance route is
independent of product accounts, and non-customers and complaints against the custodian retain standing
through closure [02 §7].

**Who sheds a lane at 4× (CAP-45).** The Admission Authority, by class, in the fixed order, never below the
protected due-service minimum or the grievance reserve, with an overflow count and a founder alarm. The
authority to change the shares themselves is the founder's.

---

## 9. Comparators

### 9.1 Against S1.0

S1.0's case admission authority both maintains the agenda and selects the work, which concentrates
interpretation in one place — a cost 02 §2 names in its own words as concentrated agenda authority, and
which the blackboard source prices independently [R5-02]. M5 splits that: arming is computed and
unstoppable; admission is bounded to five verbs.

**Remove M5's defining mechanism and what gets worse.** Delete standing interests and keep the rest: you
have S1.0. The problem that returns is **work whose relevance nobody currently holds in mind** — the
supplier clause that matters only at termination, the claim that goes stale three weeks after it was
written, the duty that survives a closed case. Under S1.0 those surface when the case authority looks;
under M5 they surface when the record transitions. **HYPOTHESIS, with a falsifier:** if over one month every
such item is surfaced within its latest responsible time by the existing scheduled review, M5's central
mechanism buys nothing and should be removed. That test costs nothing and needs no software.

**What M5 costs against S1.0.** A standing declaration set that must be authored, tested, reviewed and
retired; near-duplicate interests degrading activation the way near-duplicate skills degrade selection
[AG-06]; and one new failure S1.0 does not have — a **stale interest**, armed on a condition that no longer
means what it meant.

### 9.2 Against B0, the deliberately simple baseline

B0 gets its legitimate strengths in full: no handoff loss because there is no handoff, no routing error
because there is no router, one context a person can read end to end, trivially buildable, trivially
changeable, plus its own deterministic scripts, checklists and human review.

**Two of B0's granted strengths are falsified by sources, not by me.** **FAL-01:** B0 does not have the
lowest plausible consumption of scarce capacity — the full conversation is resent with every request, the
cache expires hourly on a subscription, compaction is itself a large request, and idle check-ins send the
full context [R8 B-6]. B0 minimises *launches*; it does not minimise the weekly bucket, and the weekly
bucket binds. **FAL-02:** B0's "one long-context session" is **not purchasable** under this package's own
launch contract, because a native job caps at a 360-second window, so continuation is mandatory in every arm
[R2 F-18].

**Where B0 genuinely wins, and the round should say so.** On verification, B0 plus deterministic scripts
plus human acceptance is *not obviously worse* than B0 plus a same-family checker, because the checker's
published ceiling is roughly 28.6% F1 [R7 §8]. At matched reasoning budget, a single agent matched or beat
every multi-agent arrangement tested [R1 F-08]. On the founder-competence dimension, a record he can read
end to end serves W12 better than any projection [FAL-11's criterion tension, which R8 declines to advance
as a defect and neither do I].

**M5's honest claim against B0 is narrow.** It is not quality, not cost, and not latency. It is that **B0's
admission rule is the founder's attention**, and a design whose admission rule is a person's attention has
no answer for F-6 beyond "it waits". If the founder's attention is in fact sufficient at these ventures'
demand level, the protocol's §6 rule applies and the correct output of this round is a smaller system.

### 9.3 Against the deferred candidate C, and against C2

C organizes around observed conditions, competing explanations and bounded interventions, with four loops,
optional bounded negotiation, and a transactional allocator explicitly forbidden from becoming a case
manager [C §3]. Four differences, each with a reason:

1. **Preconditions are typed and deterministic.** C's "deterministic subscriptions" sit beside bounded model
   sessions that interpret ambiguity and post rival hypotheses; M5 forbids a model anywhere in the
   activation gate. The reason is B-7 and AG-08 together.
2. **No negotiation, no bidding.** C's own §10 says to subtract negotiation unless it beats its comparator,
   and delegation by short natural-language description is published as producing misinterpretation and
   duplicated work [R5-22]. M5 deletes it rather than bounding it.
3. **An explicit, bounded admission authority.** C deliberately weakens its allocator; M5 gives the
   Authority five verbs and five prohibitions. This is the TC-41 trichotomy answered by *splitting* the
   locus rather than choosing among the three the source names.
4. **Contamination is handled by activation gating**, not by quarantine-plus-promotion alone, because the
   entry that matters carries no instruction and passes every screen [R1 F-10].

**Does M5 inherit C's reviewed defects?** Partly, and I say which. **T07 — bounded reactions forming an
unbounded loop — is inherited in shape**, and §3.4 answers it with a per-cause allowance, a non-borrowable
progress floor and an overflow count, while conceding that T07's own verdict on C's equivalent bounds
applies unchanged. **T08 — transitive credential and recovery threat model** — is inherited in full and is
not made better by M5; the effective authority graph must include tokens, sessions, hooks, forwarding and
scheduled execution created after installation, and rotating one secret is not recovery evidence.

**Against C2.** M5 does not adopt compulsory independent inquiry jurisdiction. It takes the cheap half —
a question cannot be un-armed and a deferral past its latest responsible time is recorded as a refusal — and
declines the expensive half: no reserved inquiry capacity, no charter-appointed assessor, no retirement
jurisdiction separate from production. **The gap is exactly this:** under C2 an admissible discriminator
must receive its reserved slot within its deadline even when production prefers otherwise; under M5 it can
be deferred indefinitely as long as each deferral is recorded. If deferral-with-a-record turns out to be
deferral in practice, C2's rights are the repair, and 02 §9's fourth EAS-R1 comparison is where that is
tested.

---

## 10. Strengths · Weaknesses · Limits · Complexity · Security · Provider dependence · Migration · When wrong

**Strengths.** Negative control §4.2 is answered structurally: an activation's preconditions **are** the
record, so a shared source of truth nobody is forced to read is not expressible here. Unowned work is
impossible at admission, custody resolving by rule in the same transaction as acceptance. Deferral is a
visible state with a deadline rather than an absence. Determinism sits in the one place that fires most
often, which is the only lever that cuts provider consumption without cutting work. What parks is queryable
rather than blocked. Every mechanism carries a removal criterion, answering W9 per mechanism.

**Weaknesses.** The stale interest — armed on a condition whose meaning drifted — is a failure S1.0 and B0
do not have. Semantic conflict without a shared key is detected after the fact, not prevented. The
preference-leakage projection rule is unverified. The contamination gate costs a measured seven points of
utility and an unmeasured amount of false exclusion. And **the whole design rests on the company's work
being expressible as deterministic predicates over typed fields**, which nobody has tried.

**Scalability limits.** Armed-set evaluation is proportional to transitions times interests unless indexed
by entry kind. More importantly, the interest catalogue inherits the skill-library degradation result:
selection is reliable in a small pool, degrades non-linearly, and **confusability rather than count drives
it** [AG-06, R6 F2/F3]. TC-28's constraint therefore binds the interest catalogue and the 10/100/1000 sweep
with adversarial near-duplicates must be run against it. **One genuine advantage:** near-duplicate typed
predicates are statically detectable, which near-duplicate prose descriptions are not.

**Operational complexity.** Authorship and maintenance of interests, drift in what a precondition means,
missing-event detection, clock and fencing behaviour, retention on the unmatched pool, restoration
rehearsals, and per-entry-class projection rules for every reader. **UNKNOWN:** authoring and maintenance
effort in any unit is unmeasured anywhere [MG-15], so the maintenance half of this design is unevaluable
today.

**Security implications.** The Record is the attack surface [W10], and M5's posture is: not writable by
anything that can read it (single-writer keys, per-kind write authority); tool output and inbound channels
enter as untrusted by default; trust class gates activation; skill-carried grants ignored at the launcher;
content-hash pinning of any procedure package or tool description, re-checked at use, which is the only
mitigation in the surveyed set that survives a rug pull [R3 F48]; delegation depth as a safety property with
an owner; the release boundary outside the model, because a boundary inside a component with a 16–51%
failure rate is in the wrong place [FAL-04].

**Provider dependence.** The delivered-inputs rule is only partly satisfiable across the provider boundary
[R1 TC-27]; a 360-second job window forces continuation in every arm; there is no absolute allowance
denominator; and the metered path is one setting away at both providers. M5 observes all four and removes
none.

**Migration difficulty.** Moderate for the interest catalogue, which is data. **High for the assignment of
authority over each record field**, and that assignment is the irreversible part. Old and new systems must
never both hold uncoordinated spend rights, and a new mapping version cannot make yesterday's uncertain
entitlement disappear [02 R1].

**When M5 is the wrong design — six concrete conditions.**
1. Most of the company's conditions cannot be written as deterministic predicates, so arming needs a model.
2. Genuinely novel work arrives rarely enough that the founder's attention is a sufficient admission rule.
3. The interest set converges to a handful of recurring profiles over a month, in which case M5 has a roster
   it discovered rather than declared and should be compared against a declared one at matched executor
   count [R8 W-4, MG-11].
4. Two legitimate authorities genuinely both own one field, so single-writer keying is unavailable and
   last-writer-wins returns.
5. The work is dominated by one long sequential construction task, where partition quality rather than
   partition existence decides everything [R2 F-06].
6. The founder's priority is reading the whole system end to end, which permission-filtered projections make
   strictly worse than B0's single record.

---

## 11. (d)-class self-audit against protocol §5

| §5 example | M5's answer | Class |
|---|---|---|
| 1 · Who admits an unknown job | `intake` ∞ admits; `typing` types deterministically; the pool receives the complement; `triage` refuses by named predicate | (a) |
| 2 · Authority for a handoff's acceptance | Acceptance owner named at `submitted`; parent sponsorship survives until an accepted transfer; the interval has an owner | (a) |
| 3 · Incompatible meanings of "done" | `submitted` ≠ `accepted`; an acceptance with no resolution reason is rejected by the writer guard; external predicates cannot be discharged by internal status | (a) |
| 4 · Context a resumed attempt may trust | Portable Continuation plus manifest; provider-resumed route closed unless ancestry suffices; applied-edits reconciled; the armed set is recomputed, not inherited | (a) |
| 5 · Skill selection with no removal criterion | Every interest and every procedure package carries `removal_criterion` and `review_by`; `interest-review` retires unused ones and re-tests pinned ones | (a) |
| 6 · Permission composition undefined | Intersection computed by C04 at the call; a composite exceeding the mandate is refused, not minted | (a) |
| 7 · No delegation ceiling with an owner | One child layer by default; owner is the capability owner; raising it is a self-modification requiring review | (a) |
| 8 · No writer authority on shared state | Single-writer keyed entries; state write as appended event | (a) |
| 9 · In-flight work at a provider or model change | Activations pin the interest version and input versions; incompatible runs park with a named migration; no silent re-run | (a) |
| 10 · No stated winner between concurrent attempts | The effect allocator's idempotency key; the second claimant joins the first and inherits its outcome | (a) |

**Open (d)-class items, and they are genuinely open.**

1. **The terminal standing custodian is unnamed.** M5's rule is that each consequence class has a terminal
   custodian who is a person or an accepted service, and that the company may not admit work of a class with
   no such custodian. Until the founder names them, an implementer choosing between "refuse the class" and
   "default to the founder" is choosing the system's meaning. R5's question 7 asks exactly this and no lane
   answers it. **Routed as a founder decision packet.**
2. **Whether a read-only interest admitted on a bounded trial may renew automatically.** If yes, the trial
   envelope is decorative. If no, every trial expires into a human approval and the zero-edit region shrinks
   as the catalogue grows. Both are defensible and the choice decides whether capability can grow without
   attention. **Routed as a founder decision packet.**

**Blocking the evaluation rather than the specification.** Whether the concurrency pin is a provider
constraint or a self-imposed policy is the highest-leverage open question in the round, it gates four claim
verdicts, and raising it to find out is circular [X14, MG-02, R8]. F-2 cannot be run against M5 until it is
settled, and settling it is an account inspection, not an experiment.

**(c)-class, with protocols named.** The arrival rate of genuinely novel work [MG-06 — the cheapest item in
the round, needing no software: count admitted items over a past window against the existing capability
list]. Whether a shared authoritative view raises or lowers duplicated external effects [MG-09 — R1's single
most valuable unrun experiment]. Joint false acceptance for a same-family producer and checker [MG-04]. The
founder-competence transfer test [MG-19]. Selection degradation over the interest catalogue [MG-08's sweep,
re-aimed]. Authoring and maintenance effort in any unit [MG-15].

---

## 12. Evidence ledger

Kinds per DIRECTIVE §6. "None" in the evidence column means a **design proposal resting on no finding** —
these are the choices a reviewer should attack first.

| # | Design choice | Finding(s) | Kind |
|---|---|---|---|
| 1 | One authority per field, not one store everyone reads | R8 W-3 · R1 F-23 · 06 §3 | decision on source claim |
| 2 | State write as appended event | R3 F24, F25 | decision on source claim |
| 3 | Single-writer keyed entries | R3 F42 | decision on source claim |
| 4 | Eleven entry kinds, not the founder's five | R1 TC-14 · 02 §3 | decision on source claim |
| 5 | Authorization and recipient scope as a first-class kind | R1 F-14, F-15, F-16 | decision on source claim |
| 6 | Typed constraints, never prose | R2 F-04 (0 of 48 vs 73%) | decision on source claim |
| 7 | Contradiction retained, no winner | 06 §3 · R1 F-11 | decision on source claim |
| 8 | Trust class gates activation; no provenance-weighted ranking | R1 F-10 · R2 F-09 | decision on source claim |
| 9 | The seven-point utility price of that gate, stated | R2 F-09 | source claim |
| 10 | Dependency-gated activation (all prerequisites) | R3 F33 | decision on source claim |
| 11 | **No precondition may invoke a model** | R8 B-7 · AG-08 · R4 F4 | decision on source claim |
| 12 | Four-level `effect_class` enum | R2 F-21 · DIRECTIVE §1.5 | design proposal — the *four levels and their names* rest on no finding |
| 13 | Arming decentralized and unstoppable | R5-01, R5-02 | decision on source claim |
| 14 | Admission Authority's five verbs | R5-02 · 02 §2 | design proposal — **the specific five rest on no finding** |
| 15 | Admission Authority's five prohibitions | R4 F1 · R5-02 · 06 §6 | decision on source claim |
| 16 | Contention order (five rules) | R3 F42 · R1 F-17 · 05 §6 | decision on source claim |
| 17 | `contention_tie_break_reason` recorded | 03 (custody analogue) | design proposal — **no finding; borrowed by analogy** |
| 18 | Effect allocator; second claimant joins | R1 F-17 · R3 F41 | decision on source claim |
| 19 | Per-cause re-arming allowance | D-technical T07 · 05 §6 | design proposal — **the allowance's size rests on no finding** |
| 20 | Non-borrowable due-service floor | 07 §6 | decision on package specification |
| 21 | Overflow counted on every shed | R5-19 | decision on source claim |
| 22 | Activation is not authorization | R4 F1, F4 | decision on source claim |
| 23 | Grant issued by C04 at the call, intersection computed there | R4 F2, F5 · R3 §7 | decision on source claim |
| 24 | Live re-read at release for revocation | R4 F3 · 02 §6.2 | decision on source claim |
| 25 | Launcher computes tools from the grant, ignoring package frontmatter | R2 F-08 · R6 F7, FC-6 · AG-07 | decision on fact |
| 26 | Activation verifies its own grant at first use | R3 F59 | decision on direct observation |
| 27 | Delegation depth as a safety property, one layer default | R3 F18 · D-10 · R4 §9 Q3 | decision on disagreement |
| 28 | Loader-narrowed projection per activation | 06 §2 · R8 W-3 | decision on package specification |
| 29 | Reconcile provider applied-edits against the manifest | R1 F-02, F-21 | decision on fact |
| 30 | Expired precondition disarms; time cannot renew | 06 §4 | decision on package specification |
| 31 | Understanding check after correction | 06 §4 · R1 TC-42 | decision on source claim |
| 32 | Paired clean case on every filter, same session | AG-15 · X17 · MG-14 | decision on source claim |
| 33 | Refusal to claim attention-isolation and parallel work | R2 §8 · R2 F-06, F-19 | refusal on source claim |
| 34 | `submitted` state with an owner (the X18 interval) | R3 §9 · R5-13 · X18 | decision on source claim |
| 35 | Acceptance with no resolution reason rejected | R5-13 | decision on source claim |
| 36 | Checker projection restricted by entry class | R7 §9 | design proposal — **untested; class (b)** |
| 37 | Two arms plus the preferred-conclusion channel | R7 F8, F11 | decision on source claim |
| 38 | AM-01 paired clean case, both rates reported | FAL-09 · AM-01 | decision on amendment |
| 39 | Same-family checker never accepts an outward release | R7 F9, F13 · 06 §7 | decision on source claim |
| 40 | Ordered custody resolver reused unchanged | 03 · R5-03 | decision on package specification |
| 41 | Narrowest-sufficient custody, against ICS's default-upward | R5-03 · R5 unknown 3 · 03 | decision on a preserved disagreement |
| 42 | Terminal standing custodian must be a person or service | R5 §9 Q7 · R5-11 | decision; **its occupant is open (d)** |
| 43 | Unmatched pool as computable complement, residue named | R5-09, R5-10 | decision on source claim |
| 44 | Pool retention exceeds the longest outage | R5-10 | decision on source claim |
| 45 | Typing has no confidence threshold | R5-15, R5-16 · 05 §10 | design proposal — **the abstain-always default rests on no finding** |
| 46 | Graduated staffing: trial below outward, approval at and above | R5 TC-19 · R5-06, R5-08, R5-21 · 05 §4 | decision on source claim |
| 47 | Re-routing not scored as a defect; cycles counted separately | R5-20 · D-12 | decision on a preserved disagreement |
| 48 | `awaiting-principal` terminal state, never assigned-and-silent | R5-12 · R3 F27 | decision on source claim |
| 49 | Re-entry brief carries omissions and contests | R5-23 · R1 F-17 | decision on source claim |
| 50 | `credit-setting` interest halts launches on a changed setting | R8 W-5 · FAL-10 | decision on source claim |
| 51 | Capacity reported as ratios, never as a fraction of the week | R8 W-6 · MG-03 | decision on direct observation |
| 52 | Class shares adopted from 07 §6 unchanged | 07 §6 | decision on package specification |
| 53 | Content-hash pinning re-checked at use | R3 F47, F48 | decision on source claim |
| 54 | Interest catalogue inherits TC-28's sweep | AG-06 · R6 F2, F3 | inference on source claim |
| 55 | Standing-interest field list (fifteen fields) | composed from 05 §8 and R3 F33 | design proposal — **the exact field set rests on no finding** |
| 56 | `read_only`/`internal_artifact` trial envelope and its expiry | — | design proposal — **no finding; the duration is invented** |
| 57 | Five ∞ (unretirable) interests, and exactly those five | R5-14 · R5-10 · 02 §7 | design proposal — **which five rest on no finding** |
| 58 | Six mandatory tests per interest | 05 §8 · AM-01 | decision on package specification |

**Count.** Fifty-eight design choices. **Eight are DESIGN PROPOSAL choices resting on no finding:** #12 (the
four effect-class levels and their names), #14 (the specific five admission verbs), #17 (the tie-break
recording device, borrowed by analogy), #19 (the size of the per-cause allowance), #45 (abstain-always as
the typing default), #55 (the fifteen-field interest schema), #56 (the trial envelope and its expiry), and
#57 (which five interests are unretirable). Two further items are class (b) — documented mechanisms whose
deployment is unverified: #36 (the checker projection rule) and #25 (the launcher closing the
skill-grant hole, which is a conformance obligation against a measured runtime default).

---

## Claims

`claims_emitted: []`. **DIRECT OBSERVATION.** The claim-ledger append tool is absent from this session's
toolset, so nothing below is registered. This reproduces, in this candidate's own operation, the
declared-versus-delivered gap the round identifies as axis X16, and it is the same absence seven of eight
research lanes reported. Four assertions here are durable enough to warrant registration by whoever holds
the tool, with the expiries proposed:

| Proposed claim | `valid_until` | Invalidator |
|---|---|---|
| A precondition evaluated by deterministic code over typed fields costs no provider allowance, so arming is free and activation is scarce under CP1 | 2026-12-13 | A launch profile in which record-transition evaluation consumes an allowance bucket |
| A trust-class gate on activation, not a content screen and not a provenance weight, is the only defence in this round's evidence that addresses a false entry carrying no instruction | 2027-08-24 | A screening or ranking method that refuses instruction-free poisoning without destroying evidence recall |
| Zero human system edits are achievable for admission, typing, ownership and acceptance-owner assignment, and are **not** achievable for outward-acting capability creation | 2027-09-13 | A located system that staffs a novel outward-acting work type with no pre-declared envelope, pre-registered handler or human approval |
| A same-family checker's published ceiling for procedural independence is ~28.6% F1, so it may find defects and may not accept an outward release | 2027-03-12 | A replication measuring same-family procedural independence materially above that range on planted defects |

**Standing caveat.** No runtime exists and no fixture was executed. Every source cited here reached this
candidate through another agent's lane report, read once, on 2026-09-13, by one model instance of one
family, with procedural independence only. This candidate was formed without reading any sibling candidate.
Nothing above establishes runtime conformance, deployment readiness, or business value.
