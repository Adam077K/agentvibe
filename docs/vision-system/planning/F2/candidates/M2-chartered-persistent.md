# Candidate M2 — Chartered persistent agents

> **What this is.** One of five F2 candidates, formed blind of the other four. It is the strongest honest
> version of a chartered-persistence design, not an advocacy document. It selects nothing and approves
> nothing. Statement kinds follow [DIRECTIVE §6](../../../inputs/DIRECTIVE.md): **SPECIFICATION** ·
> **DESIGN PROPOSAL** · **SOURCE CLAIM** · **INFERENCE** · **DIRECT OBSERVATION** · **UNKNOWN** ·
> **DEFERRED** · **DISAGREEMENT**.
>
> **Formation.** Read in order: `planning/F2/00-acceptance-protocol.md` (whole) and its amendments (AM-01);
> `inputs/FOUNDER-THESIS-2026-09-13-agents.md`; `planning/F2/00-thesis-claims.json`;
> `research/F2/cross-lane-comparison.md` (whole); `research/F2/R8-contrarian.md` (whole); `R2` §2 and §8;
> `R1` §2 and §7; `R7` F1–F20 and §8; `R4` F1–F9; `R5` §2; `R3` F24/F42/F55/F62; `R6` F6/F7/F9;
> `planning/02-architecture-selection.md` §3, §4, §8, §9; `planning/candidates/B-federated-responsibility.md`;
> `planning/reviews/D-company-human.md`; `planning/specification/05-work-agents-skills.md` (whole);
> `06` §1–§4, §6–§7; `07` §5–§6; `coverage/capability-requirements.json`; `inputs/DIRECTIVE.md` §1.5, §1.6,
> §7 Phase C, §8.7, §8.8, §8.12, §8.16, §8.21. **No other F2 candidate was read.**
>
> **Standing caveat.** No runtime exists. Every mechanism below is specified behavior, unbuilt and
> unmeasured. Every number cited is a measurement of some other system, on some other task distribution,
> at some other date. This candidate shares one model family with every lane and reviewer in the round.

---

## 1. Summary for the founder

You asked whether the company needs different agents, and how to do that without a department of thirty
digital employees. This candidate says almost nothing should be permanent, and a very short list of things
must be.

What is permanent is not a worker but a **desk**. A charter is a standing duty with a named desk that
outlives any particular job, the way a company has a complaints desk or a records office, neither of which
is the person sitting there. The work is still done by temporary workers picked for the job.

What a desk buys that the current position cannot. **A party already there when someone comes back:**
a customer disputing a remedy six months after closure, or a person whose data you hold who was never a
customer, today reaches a rule that names a custodian on the spot. A rule produces a name; it cannot hold a
relationship. **And a party that can be asked to give something up:** when demand hits four times normal and
a lane must be shed, reservations held by category have nobody to ask.

Everything else people mean by persistent agents — identity, instruction scope, tests, an owner, evaluation,
retirement — the current position already has.

**The honest weakness, first.** No source found in this round measures whether persistent identity improves
any outcome, and the two most-cited deployments refuse to support it. So this candidate carries its own
falsifier: each quarter, run a fresh desk against the incumbent's fixed cases, and cut the carried memory if
the fresh desk matches.

**Reversibility first.** A desk is cheap to add and expensive to remove, because a published contact route
is a promise. Start with one desk, not five. Two decisions are yours and both block — whether a model may
hold a desk carrying external standing, and how large each reserved lane is.

---

## 2. Core primitives

**DESIGN PROPOSAL.** M2 adds exactly three records to S1.0 and changes none. Everything else in
`05-work-agents-skills.md` stands unaltered.

### 2.1 `Charter`

A charter is a **record of a standing duty with a named holder of record**. It is not an agent, not a
template, not a performer, and it produces nothing.

| Field | Meaning | Who may write it |
|---|---|---|
| `charter_id`, `version` | Stable identity; every revision is a new version | Capability owner, on an approved change |
| `duty_scope` | The continuing duties this desk holds, by CAP id and by predicate. Not a job description | Capability owner (C01-endorsed) |
| `eligibility_ceiling` | The **maximum** set of consequence classes any instance acting under this charter may reach. Grants nothing | Capability owner, by amended grant only |
| `memory_scope` | Which of the four carried-memory classes this desk holds, and the cap on each | Capability owner |
| `reserved_lane` | The named share of `07` §6 capacity bound to this holder, with a stated minimum and a lapse point | Founder, by decision packet |
| `evaluation_subject` | The fixed case pool this desk is measured against, held by another desk | `CT-INSTRUMENT`; never the subject itself |
| `review_cadence` | Re-run interval, which must be shorter than the provider's model release cadence | `CT-INSTRUMENT` |
| `holder_binding` | The current `AgentTemplate` version plus carried-memory generation filling the desk; or a named human or engaged professional | Capability owner |
| `suspension_rule`, `retirement_rule` | The evidence that narrows, suspends, replaces or retires, and the named interim holder for each | Capability owner |
| `reachability` | How an outside party contacts this desk **without knowing the company's internal topology** | Capability owner |

**SPECIFICATION (inherited, unchanged).** A charter cannot acquire any C01–C09 authority by containing
instructions to do so (`05` §1).

### 2.2 `CarriedRecord`

**DESIGN PROPOSAL.** The append-only, typed, capped store a charter carries across work orders. It has no
free-text field. Every entry is a `Ref` to a canonical record plus a typed field set plus a `valid_until`.
Four classes, in §5.

### 2.3 `ShedNegotiation`

**DESIGN PROPOSAL.** The bounded exchange in which the capacity authority asks each holder what it will
yield, the holder answers with its stated minimum and the deadline that moves, and the authority decides.
It has a fixed window, a recorded outcome and no veto.

### 2.4 How a charter differs from `AgentTemplate`

**SOURCE CLAIM · R8 A-1.** `AgentTemplate` is "a versioned production recipe — not an identity with
standing" (CP-74), and it already carries a stable identity (its version), an instruction scope (CP-106),
tests and a maintenance owner (CP-109), evaluation as a named subject (CP-144) and a retirement procedure
requiring reassignment and revocation (CP-78). **Charter, evaluation, suspension and retirement are already
there.**

**INFERENCE.** The delta is therefore small and nameable, and naming it is the whole argument:

| Property | `AgentTemplate` (S1.0) | `Charter` (M2) |
|---|---|---|
| Stable identity | Yes, the version | Yes, the desk |
| Bound to | One admitted `WorkOrder` | A continuing duty, with no work order required |
| Produces work | Yes, through `AgentInstance` | **No, ever** |
| Memory across work orders | None | Four typed classes, capped, append-only |
| Capacity reservation | By class (`07` §6) | By class **and bound to this holder** |
| Reachable by an outsider | No | Yes, by name, and that is a required field |
| Evaluation subject | The template | The desk, so **holder drift** becomes measurable |
| Replaceable | By a new version | By a new holder, with the duty unmoved |

**Read the eight rows precisely, because the honest delta is smaller than the table looks.** **Three** are new
capability: carried memory, holder-bound reservation, and reachability by an outsider. **One** is the enabler
that makes those three possible — being bound to a continuing duty rather than to one work order. **One** is
a restriction, not a capability: a charter produces nothing. The remaining **three** — stable identity,
evaluation subject, replaceability — either restate `AgentTemplate` or follow from persistence rather than
being bought by it.

R8 A-1 counts the delta as **two** properties, carried memory and holder-bound reservation, because it treats
reachability under a separate argument (A-5). **This candidate counts three and says why**, rather than
quietly adopting the smaller number: a party an outsider can reach by name is not a consequence of memory or
of reservation, and CAP-42 is carried by that row alone.

### 2.5 Which duties earn a charter — the three-part test

**DESIGN PROPOSAL.** A duty earns a charter only if **all three** hold. Each part names the failure that
occurs without it, so the test is refutable rather than rhetorical.

1. **Standing-duty test.** The duty exists *between* work orders, with no open `WorkOrder` to attach it to.
   *Failure without a charter:* the duty lives as a field on a closed record and nothing wakes it.
2. **Carried-record test.** Performing it next time needs state that is **(a)** not itself a canonical
   business record, **(b)** not re-derivable inside the duty's own deadline, and **(c)** demonstrably
   load-bearing under a decision probe. *Failure:* re-derivation is paid every time, or the answer is wrong.
3. **Named-party test.** Someone outside the duty's own production path must reach it **by name** — an
   affected non-customer, the founder on return, or the capacity authority at shedding time. *Failure:* the
   reacher must know the company's internal topology, which is review D's CH-03 discriminating test verbatim.

**The refusal that matters.** A duty that passes only a fourth, unwritten test — *we do a lot of this* — gets
an `AgentTemplate` and a `SkillVersion`, **never a charter**. Volume is not standing. This is the rule that
stops the set drifting into departments, and DIRECTIVE §8.8 forbids the drift independently: "Do not create
agents merely to imitate human departments."

**What the test yields, and what it refuses.** Five duties pass: external standing and remedy
(`CT-STANDING`); surviving obligations and closure (`CT-DUTY`); absence, recovery and re-entry
(`CT-CONTINUITY`); the evidence base and its instruments (`CT-INSTRUMENT`); knowledge validity and
correction propagation (`CT-MEANING`). §8 binds each to CAP ids.

**Everything else stays ephemeral**, including every capability that looks most like a job. Three refusals
are worth naming because each is tempting:

- **A standing reviewer is refused** (§7, F-4). It fails part 2 in the wrong direction — its carried record
  is a contamination channel rather than an asset — and R7's measurement says a fresh context beats a
  context-carrying one.
- **A standing admitter is refused.** C02's case-admission authority is a component of the fixed
  architecture, and chartering it would create a party that can defend its own mandate against the admission
  narrowing CP-13 requires.
- **A standing builder, seller or marketer is refused.** CAP-10, CAP-15, CAP-14 and CAP-13 fail part 1
  outright: their duties end with their work orders. That they are the most department-shaped capabilities in
  the catalogue is exactly why their blankness in §8 is the test of this design.

---

## 3. Control structure

**DESIGN PROPOSAL.** Three rules govern what a charter may and may not do. They are stated as prohibitions
because a prohibition is checkable and an aspiration is not.

**R-1 · A charter holds, it does not produce.** Production remains the existing five-way rule of
`02` §3 — deterministic computation, durable procedure, bounded model work, capable people, qualified
professionals. A charter never appears in that rule. When a chartered duty needs work done, C02 admits a
`WorkOrder` and instantiates an ephemeral `AgentInstance` under whatever `AgentTemplate` fits, exactly as
today. **The charter is the acceptance owner for the duty, not the performer of it.**

**R-2 · A charter holds no grant.** Its `eligibility_ceiling` is a **permissions boundary in the AWS sense**:
it defines the maximum an instance under it may reach and grants nothing by itself.

> **SOURCE CLAIM · R4 F2.** AWS session policies: "The permissions for a session are the intersection of the
> identity-based policies for the IAM entity ... and the session policies"; "Session policies limit
> permissions for a created session, but do not grant permissions." Macaroons and Biscuit reach the same
> invariant by different means. Three unrelated production designs, one rule: the derived thing is never
> broader than the parent, and the check is mechanical.

The `WorkOrder` supplies the grant. The effective authority is `eligibility_ceiling ∩ WorkOrder.grant`,
computed at the enforcement point, never in a file the agent can read to itself.

**R-3 · A charter may negotiate, never veto.** It may state a minimum; it may propose an order of shedding
within its own lane; it may propose a deadline-preserving substitution. It may not refuse admission
narrowing, and it may not defend its own mandate.

> **SOURCE CLAIM · R8 §8.** The failure R8 names for chartered persistence is precisely this: "a charter
> defends its mandate against admission narrowing, which CP-13 requires and no charter is obliged to
> accept." R-3 is the obligation R8 says is missing, written down.

**Who owns each decision:**

| Decision | Owner | A charter's part |
|---|---|---|
| Admit a job of any kind | C02 | None. Charters cannot admit |
| Type an admitted job | C02, through the bounded discriminator of `05` §2 | None |
| Staff it | C02, through `ExecutionSelection` | None |
| Accept the outcome | The named acceptance owner | Yes, **for a duty in its own `duty_scope`** |
| Release an external effect | C04, with a live re-read | None, ever |
| Shed a lane under pressure | C02 | Answer the `ShedNegotiation` |
| Change a charter | Capability owner, C01-endorsed | Propose only |
| Accept the instrument readings | Founder | Subject, never judge |

**INFERENCE, and it is the load-bearing structural claim.** Every path by which a persistent identity could
accumulate power is cut by one of these three rules. R-1 stops it becoming the work. R-2 stops it becoming
the authority. R-3 stops it becoming a constituency. What is left is the thing that was actually wanted: a
party that is there tomorrow.

---

## 4. Execution structure

**DESIGN PROPOSAL.** The lifecycle of a chartered duty, end to end.

1. **Wake.** A duty becomes actionable — a deadline, an inbound Observation, a lapsed `valid_until`, a
   correction. The charter's **wake right** lets it cause a `WorkOrder` to be *proposed* under its standing
   mandate. C02 admits or refuses it. The wake right is bounded by the `reserved_lane` and can never reach a
   consequential effect.
2. **Admit.** C02 applies the existing admission rule. A charter's proposal gets no priority for being
   chartered; it competes on the existing ordering (earliest real obligation deadline within class, then
   age).
3. **Staff.** `ExecutionSelection` picks a runtime and template on the existing criteria. **The holder's
   own template is not preferred.** A chartered duty is often best performed by a template that has nothing
   to do with the desk — a deletion procedure is executed by whatever does deletions.
4. **Carry.** The `WorkOrder`'s `ContextManifest` may include the charter's carried entries **as Refs**, and
   the loader resolves them under current permission and validity. The charter does not hand context to the
   worker; the loader does, and it records what it actually delivered (`06` §2).
5. **Accept.** The charter is the acceptance owner for the duty's disposition. C06 independently accepts the
   artifact. These are different acts and the design keeps them different.
6. **Land.** The surviving remainder — the part of the duty that outlives the `WorkOrder` — becomes or
   updates a carried entry, as a typed append.
7. **Close or roll.** A duty roll entry closes only on an accepted disposition **with the reason field
   populated**.

> **SOURCE CLAIM · R5-13.** The most widely deployed issue tracker separates the state from the reason and
> makes the reason optional: "Done work items don't have to have a resolution", and its own open-items filter
> shows items without one. A Done item with an empty resolution is finished and open in the same product.
> §5's (d)-class example 3 is not hypothetical; it ships. M2 makes the reason mandatory on a roll entry.

**Delegation depth is unchanged.** One child layer by default, a second by explicit admission rationale,
deeper only by reviewed template change (`05` §5). **A charter cannot raise the ceiling**, and raising it is
a change to a template, which is reviewed. This answers D-10's open question narrowly for this design: here,
depth is a policy with C02 as owner, and changing it is a reviewed self-modification.

**Concurrency.** Unchanged. Only C02 advances a workflow cursor, in the same protected transaction that
records the step result. Between two concurrent attempts on one work order, the one that reaches the release
transaction first wins and the second is refused by the idempotency record on the effect — **decided by the
record, not by timing.**

---

## 5. Information flows and the memory model

This section is the largest attack surface in the candidate and is written accordingly.

### 5.1 What the evidence says before any design

**SOURCE CLAIM · R1 F-10, F-11, F-04, F-15.** A poisoning attack injecting only false statements in ordinary
conversational form, with "no instruction, no override, no role manipulation", **passed a four-stage
write-path screen completely: 0 of 360 poisoned memories refused**, while the same screen caught indirect
prompt injection at 0.832 recall; at 1.2% of the corpus it took accuracy from 0.850 to 0.300. The read-path
provenance-ranking defence at its shipped weight was "statistically indistinguishable from no defense
(p=0.80)", and at the weight that worked, evidence recall fell **to exactly 0.00%** [F-10]. Models adopt
incorrect retrieved content, "overriding their own correct prior knowledge over 60% of the time" [F-11].
Replacing full context with a bounded self-managed memory cost 19 and 15 accuracy points on knowledge update,
"a bigger model does not close it", and the failure "tracks conversation length, not the compression ratio"
— expanding the budget recovered nothing [F-04]. And shared memory is where defences work **worst**:
prompt-level defences cut violations by up to 50% in channels and only 28–29% in memory [F-15].

**INFERENCE.** A standing memory of free-text recollections is the single worst artifact this evidence
permits anyone to build. Any candidate proposing one has proposed the measured failure. So M2's carried
memory is designed to be **small, typed, referential and expiring**, and its design target is not usefulness
but *containment*.

### 5.2 The four classes

**DESIGN PROPOSAL.** A carried entry is `(class, Ref, typed fields, valid_until, provenance, writer)`. There
is **no free-text field in any class.**

| Class | Contents | Single writer | Read scope |
|---|---|---|---|
| **Duty roll** | What is open, to whom, by when. A projection, rebuildable from canonical records, carrying a watermark and known gaps | A deterministic projection job. **No model writes here** | The holder; the founder unfiltered |
| **Counterparty standing** | Who has contested what, as a Ref to the original Observation with its `SourceRecord`. The original words are preserved and are not in this store | The admitted intake path only. A model may *attach* an Observation; it may not *author* a standing entry | The holder; C07; the founder |
| **Disposition precedent** | What this desk decided before, as a Ref to a `DecisionRecord`, with its scope and expiry | The acceptance owner of that decision — never the charter's own producer | The holder; any checker is **excluded** (§7, F-4) |
| **Instrument state** | `CT-INSTRUMENT` only: pool versions, evaluator versions, drift readings, denominators | `CT-INSTRUMENT`, outside every evaluated producer's write authority (`06` §5) | Every desk, read-only; the founder |

**INFERENCE, and it is the containment argument.** Because every entry is a Ref, **there is nowhere for a
plausible false statement to land.** To poison a carried record you must first create a false canonical
record, which has its own write authority, its own `SourceRecord` and its own admission path. The residual is
honest and must be stated: an attacker who can file a real complaint creates a real standing entry. That is
not poisoning. That is a false complaint, and the grievance route has to survive complaints that resemble
abuse — which is review D's CH-02 requirement, arriving here from a different direction.

**SOURCE CLAIM · R2 F-04, and this is why typing rather than prose.** Under a 25-word compression budget,
operational-fact survival stayed near 0.97–0.98 while boundary-marker survival fell to ~0.57. Vague
constraint language leaked protected information in 73% of cases; **a typed allowlist reduced leakage to 0
of 48.** The authors' conclusion is the design rule: boundary information "should therefore travel as typed,
machine-actionable constraints rather than natural-language sentiment."

### 5.3 Freshness, correction and the probe

**DESIGN PROPOSAL.** Three mechanisms, each answering a measured failure.

- **Every entry expires.** `valid_until` is mandatory. An expired entry loses current eligibility for
  dependent use and stays readable as history. Time passing never renews it (`06` §4).
- **Correction is supersession plus an understanding check, never a store.** CP-142 requires "a new bounded
  case or a direct critical-field check" because "storing the correction alone is insufficient". R1 F-13
  records this as the one specified mechanism the evidence does not refute — and as untested anywhere.
- **The decision probe runs before a consequential action.** The holder must restate the load-bearing
  entries, and a probe entry is flipped to confirm the output changes. Recall without the decision probe is
  not evidence of use (R1 useful mechanism 5; LongMemEval's original finding).

### 5.4 The cap, and why it is a write-time oracle

**SOURCE CLAIM · R1 F-03.** A shipping harness loads "the first 200 lines of `MEMORY.md`, or the first 25KB,
whichever comes first", and an over-limit write still succeeds "because everything past the limit is dropped
on the next load". The remedy the vendor implements is a **size check at write time**, not at read time.

**DESIGN PROPOSAL.** Each class has a hard entry and byte cap checked **at write**. A write that would
exceed it is refused, and the holder must dispose of an entry explicitly — close it, transfer it, or archive
it with a stub that preserves resolution by date and by subject. An index trimmed on read is an index whose
omissions nobody observes; that failure mode is designed out rather than monitored.

**INFERENCE.** The cap is also the containment for R1 F-04's scale finding. If the failure tracks length and
expanding the budget recovers nothing, then the only usable memory is a small one, and the cap is what makes
it small on purpose rather than by luck.

### 5.5 Who can read, write, correct and delete

- **Read.** Retrieval order is unchanged (`06` §3): compute the allowed principal/purpose/recipient/validity
  set first, resolve explicit refs, search only the eligible scope, recheck restrictions at delivery. A
  charter reads its own carried record plus authorized peer projections. It does **not** get all company
  context to coordinate (CP-84).
- **Write.** Single writer per class, named above. Append only. No last-writer-wins anywhere.

  > **SOURCE CLAIM · R3 F42/F44.** Single-writer keyed state is the only surveyed mechanism that answers the
  > conflicting-write question structurally rather than by convention.
- **Correct.** §5.3.
- **Delete.** A charter's carried record is a **named derivative in every `DeletionScope`**. `ForgetRequest`
  enumerates it by construction rather than by discovery. This closes, for the chartered case only, R1's
  open question about a peer projection outliving the grant that justified it.
- **The founder reads everything, unfiltered.** Five small stores he can read end to end. This is
  deliberately B0's granted strength, imported.

---

## 6. The five models

### 6.1 Evidence model

**DESIGN PROPOSAL.** Unchanged from `06` in every respect, with three additions that exist because a
persistent holder creates three new ways to cheat.

1. **The evaluation subject is separated from the instrument.** `CT-INSTRUMENT` holds the four pools of
   `06` §7 — fixed regression, fresh eligible production samples, withheld challenge, adversarial sequences —
   and no evaluated desk may write to them. This is `06` §5 applied to desks: "A producer cannot choose all
   adverse samples, delete failed attempts, alter expected answers or activate its new evaluator."
2. **Every agreement figure is chance-corrected.**

   > **SOURCE CLAIM · R7 F3.** Across ~541,000 judgments, 118 runs and 21 judge models, "every judge's
   > exact-match score exceeds its chance-corrected agreement (Cohen's κ) on MT-Bench by between 33.8 and
   > 41.2 percentage points." Eighty percent exact-match corresponds to κ in roughly the 0.39–0.46 band.
3. **Findings aggregate by union; verdicts never aggregate by vote or mean.**

   > **SOURCE CLAIM · R7 F15.** Human evaluators agree 5–65% pairwise; 46% of problems are found by exactly
   > one evaluator; marginal gains run +42%, +20%, +13% for evaluators two, three and four; any-two agreement
   > on *severity* is 20–28% and "not a single problem was unanimously judged as severe."

### 6.2 Authority model

**DESIGN PROPOSAL.**

- **Ceiling, not grant** (R-2). Effective authority is the intersection, computed at the call.
- **Attenuation is enforced outside the model, by a policy object keyed on agent identity.**

  > **SOURCE CLAIM · R4 F7.** `PreToolUse` hooks fire inside subagents and carry `agent_id` and `agent_type`
  > at the enforcement point; a hook can deny; hooks cannot override a deny; precedence is deny, then ask,
  > then allow. "What is missing is not capability. What is missing is a *policy object*, external to the
  > agent files, that states which agent identity may release which effect."
- **The default must be overridden, not assumed.**

  > **SOURCE CLAIM · R4 F5 (FAL-03).** In the runtime this system plans to launch, tool inheritance is total
  > unless a file says otherwise; the delegator cannot attenuate at the call; an escalated permission mode
  > propagates downward and the child's stricter setting is discarded; sandboxed shell inherits the parent
  > environment including credentials. **This must be built. It does not hold for free.**
- **A knowledge artifact must not carry a grant.**

  > **SOURCE CLAIM · R2 F-08 · R6 F7.** A skill's `allowed-tools` "grants permission for the listed tools
  > during the turn that invokes the skill", "does not restrict which tools are available", and "a skill can
  > grant itself broad tool access." The same policy object refuses this path, or `05` §8's rule that a prose
  > package cannot spend by being loaded is false of the runtime.
- **Revocation is a live re-read, not an attenuation.**

  > **SOURCE CLAIM · R4 F3.** Attenuation buys narrowing and does not buy revocation. "One permission is
  > revoked mid-attempt" requires a live re-read at the enforcement point at the moment of the effect, which
  > `02` §4 already specifies through `identity_epoch`, `grant_epoch` and `scope_epoch`.
- **Success never raises the ceiling.** DIRECTIVE §1.5 and CP-83. The mechanism, not the promise: **the
  `Charter` record has no field that a performance result can write.** `eligibility_ceiling` is writable only
  by the capability owner through an amended grant. The monotonic-exposure check is a standing test — the set
  of actions instances under a charter may take without approval in month 12 must be identical to month 1
  unless an amended grant with a named approver exists.

  > **SOURCE CLAIM · R8 §8.** R8 names this as the specific temptation chartered persistence creates: "an
  > accumulated good record silently moves an action into a lower supervision class ... which a persistent
  > evaluated identity makes tempting." Naming a mechanism against it is not optional for this candidate.
- **The holder holds no credential.** Credentials are per-`WorkOrder` and per-release. A long-lived identity
  with a long-lived credential is the thing this design most obviously risks and most explicitly refuses.

### 6.3 User model

**DESIGN PROPOSAL.** Two users, and they are not the same user.

**The founder.** Sees five **charter sheets**, one page each: the open duty roll with owner and deadline; the
reserved lane and what it actually consumed; the last instrument reading with its paired clean-case refusal
rate beside its detection rate; the open disputes; and what the desk decided since he last looked, with the
reasons. Nothing is a recommendation. Per DIRECTIVE §1.6, the return of work is designed, not offered: once
a month he is handed **one open duty from a roll he did not watch being created** and asked to act on it.

> **SOURCE CLAIM · R1 TC-29 · R7 §9 · R3 §9 (AG-10).** Three lanes independently report that **nothing in
> any of their source sets measures whether a system's human operator remains competent.** The delayed
> unfamiliar-transfer test is the right instrument and is unexecuted in the literature. This is a
> (c)-class hypothesis with a protocol, not a claim.

**The outside party.** A customer, a contractor, a person whose data the company holds who was never a
customer. `reachability` is a required charter field, and its acceptance test is review D's own: the person
"must receive an intelligible disposition or properly escalated unresolved case **without discovering the
company's internal topology**."

### 6.4 Failure model

**DESIGN PROPOSAL.** Six failures specific to charters, each with the observation that discriminates it.

| Failure | What it looks like from inside | Discriminator |
|---|---|---|
| **The desk that became a department** | New charters appear; each has a plausible duty | Count charters. Any charter whose `duty_scope` maps 1:1 onto a CAP concern that is ordinary production fails on sight |
| **The idle reserve** | Lanes held, work queued, allowance unspent | Reserved-but-unconsumed capacity at the reset window. **Allowance does not roll over, so this is destroyed, not saved** (R8) |
| **The ratchet** | A clean record and quietly wider autonomy | The monotonic-exposure check. A diff of the effective action set, month 1 against month 12 |
| **The stale desk** | Confident restatement of a lapsed entry | Decision probe before a consequential action, plus `valid_until` at read |
| **The leaky desk** | Checker bias with no rationale anywhere in its prompt | The checker's *stated inputs* against its *actual delivered inputs*, recorded by the loader, not claimed by the caller |
| **Retirement with residuals** | A desk closed, duties quietly unheld | Retirement is refused while any roll entry lacks an accepted custodian |

### 6.5 Self-improvement model

**DESIGN PROPOSAL.** A charter is a subject of improvement and never an author of it. Changing a charter is a
reviewed change by the capability owner with C06 evaluation, exactly as `05` §4 requires for a template. Three
additions:

- **Removal criterion, stated now rather than later.** Each charter carries the measurement that would
  retire it. For all five, the same measurement applies: **the fresh-holder arm** (§9.1). If a fresh desk
  matches the incumbent on the same pool in the same window, the carried memory is cut first and the charter
  second.
- **Instrument drift is re-checked on a schedule shorter than provider release cadence.**

  > **SOURCE CLAIM · R7 F7.** Between two releases of the same named service three months apart, accuracy on
  > one task moved from 84% to 51%. A known-defect control is a continuously re-run instrument check, and the
  > interval the buyer needs is one the buyer does not control and is not told.
- **A rubric edit is an instrument change requiring a bridge.**

  > **SOURCE CLAIM · R7 F6.** Judges flip verdicts under semantically equivalent rephrasings at rates from
  > 8.5% to 61.3%, and "model scale is not a reliable proxy for consistency".

### 6.6 Evaluation, and the full lifecycle DIRECTIVE §8.8 requires

**Against what fixed cases.** `CT-INSTRUMENT`'s four pools of `06` §7 — fixed regression, fresh eligible
production samples, withheld challenge, adversarial sequences — restricted to the duty classes in that
charter's `duty_scope`. **The subject may not write to its own pool** (`06` §5), and a pool revision creates
a new baseline that preserves overlapping old cases for a bridge comparison.

**By whom, and with the disclosure R7 requires.** A fresh-context checker of the same model family, holding
the artifact and the criteria and nothing else. **Same family means independence of influence only.**
Independence of error is not achievable for the self-consistent class (R7 F13), and every reading carries
that sentence. Every adverse case is paired with a clean one in the same session; agreement figures are
chance-corrected; findings union, verdicts never average; abstention is a verdict.

**What is measured, reported separately and never summed.** Duty performance on the pool; late-discovered
duties on the roll; refusal rate on the paired clean cases; **holder drift against the holder's own first-
month reading on the same pool**; and the fresh-holder arm of §9.1. Heartbeat and output volume are not
progress (CP-144).

**The seven lifecycle operations, each with its authority and its evidence.**

| Operation | Who | Evidence required | What it may never do |
|---|---|---|---|
| **Creation** | Capability owner, C01-endorsed, on a founder decision packet | The three-part test of §2 passes: a duty that exists between work orders; a carried record that is not re-derivable within the duty's deadline and is load-bearing under a decision probe; a party an outsider must reach by name. **"We do a lot of this" produces a template and a skill, never a charter** | Mirror a department. Any `duty_scope` that maps onto an ordinary production concern is refused on sight |
| **Modification** | Capability owner; C06 evaluates | A named problem, the alternatives including removal, the affected contracts, and a rollback | Widen `eligibility_ceiling` as a side effect of any other change |
| **Promotion** | Capability owner, by **an actual amended grant**, never automatically | Observed conformance **in the specific consequence and data domain**, plus independent acceptance (CP-83). DIRECTIVE §1.5: a good record may change review depth or frequency and "must not silently increase the maximum consequence to which the owner is exposed" | Follow from a clean record. The `Charter` has no field a performance result can write, and the monotonic-exposure check fails if the effective action set has widened without an amended grant |
| **Demotion (narrow)** | Capability owner, or C02 on an immediate trigger | A missed duty on the desk's own roll; an expired prerequisite; a changed model, tool or skill; drift outside the predeclared band | Be reversed by a later good quarter without a new amended grant |
| **Suspension** | C02 immediately; capability owner confirms | A released effect outside `eligibility_ceiling`; a failed understanding check after a correction; a poisoned or unresolvable carried entry | Delete the carried record. **It becomes read-only**, because the duties survive the holder. A named interim holder is required, and where none is reachable, **admissions in that duty class narrow** rather than the duty going silently unheld |
| **Replacement** | Capability owner | Drift beyond the band, or the fresh-holder arm matching the incumbent | Trust the transferred carried record before a fresh-holder control run on the same pool |
| **Deletion (retirement)** | Capability owner, C01-endorsed | Every open roll entry has an accepted custodian; tools and sessions revoked, not just the name removed (CP-78); carried record archived under its retention and deletion scope; **`reachability` route either re-pointed to a named successor or formally withdrawn to every party told about it** | Complete while any roll entry lacks a custodian. A retirement carrying residuals may not be reported as a clean end |

**INFERENCE.** Six of these seven already exist for `AgentTemplate` in `05` §4 and are restatements. The one
that is genuinely new is **suspension**, because only a persistent holder can be suspended while its duties
continue — and suspension is where the design either keeps its promise to an outside party or breaks it.

---

## 7. The six fixtures

### F-1 · An unknown kind of job appears mid-build

**Useful outcome — a supplier's contract obliges a data-deletion procedure nobody planned.**

1. **Admission.** The contract arrives as an `Observation` on an admitted integration with its
   `SourceRecord`. C02 applies the existing admission rule. No capability contract matches, so `05` §2's
   **bounded discriminator** runs as a small `WorkOrder` before any large commitment.
2. **Typing.** The discriminator returns: a duty under an existing contract, carrying a deletion scope and a
   deadline. Typing produces a match against two `duty_scope` predicates — `CT-DUTY` (a commitment that
   outlives its case) and `CT-STANDING` (a data-rights duty). Where two desks match, **the narrower scope
   holds and the other is a reader**; the tie is broken by predicate specificity, recorded, not by seniority.
3. **Staffing.** C02 instantiates an ephemeral worker under whatever template does contract-obligation
   extraction. **The desk does not perform it.**
4. **Acceptance.** C06 accepts the artifact. `CT-DUTY`'s holder accepts the *duty disposition* and the
   surviving remainder lands as a duty-roll entry with a deadline, an owner and a `valid_until`.
5. **Human edits to system definitions: zero for admission, typing and acceptance.** The charter set does
   not change. No routing table changes.

**DIRECT OBSERVATION, and it is against this candidate's interest.** Step 3 can fail. If no template fits,
`05` §4's route is that the maintenance custodian proposes and the capability owner approves — **a human in
the loop.** R5's verdict on TC-19 is that the claim "splits into four with different answers and staffing is
where it fails." M2 does not repair that and does not claim to. **M2's honest position: admission, typing and
acceptance need no human edit; staffing may.** Charters arguably make F-1 *harder*, because a genuinely new
kind of work has no chartered holder — R8's own reading of this fixture, and it is correct.

**Adverse variation.**

- **The malformed, partly false report from an untrusted channel.** It becomes an `Observation` whose
  `SourceRecord` marks the channel untrusted. **It cannot become a carried entry**, because there is no
  free-text slot and no model may author a standing entry. It cannot supply a consequential parameter,
  because those come from authoritative selectors (`02` §4). Critically, per R1 F-10, **this report may
  contain no instruction at all** — the injection screen is the wrong instrument and the design does not rely
  on it.
- **The genuinely spurious job must be refused with a reason.** Refusal is a **recorded terminal state of the
  same object**, not a deletion.

  > **SOURCE CLAIM · R5-14 · AG-12.** Triage is a first-class status with a named owner in shipping tools;
  > declining updates the item to a cancelled status type. Refusal must be a recorded terminal state, and a
  > catch-all must name what it cannot catch.

  The refusal has its own acceptance owner — `CT-DUTY`'s holder — because a refusal that turns out to be
  wrong is a surviving duty.
- **Negative control 9 is failed deliberately, and its pair is measured.** Admission without refusal is not
  admission. The refusal rate on the paired clean case is reported beside the catch rate on the spurious one.

  > **SOURCE CLAIM · R5-15.** Out-of-scope recall is the weak axis: 96%+ in-scope accuracy against a best
  > out-of-scope recall of 66%, dropping to 40.3% when out-of-scope training examples were cut. **UNKNOWN:**
  > these are 2019 classifiers; the structure transfers, the numbers do not.

### F-2 · Demand at 4×

**Useful outcome — four ventures' ordinary work at matched scope, with 1× and 2× measured under the same
controls.**

**DIRECT OBSERVATION, stated before any claim.** At CP1 — one native job plus one external job — M2 is
**indistinguishable from S1.0 on every concurrency-dependent unit at 1× and 2×.** Charters buy no allowance.
R8's economics table says so in three cells and this candidate does not dispute it. Added coordination cost
per unit of delivered work at 1× and 2×: **zero per work order**, because charters do not participate in
production; the cost is per duty at wake time and per quarter at evaluation time.

**UNKNOWN.** The 4× measurement cannot be run at CP1 at all (R2 F-19), and raising CP1 is circular (R8
TC-39). Reporting F-2 as passed on a projection would be the §4 control-10 failure in a different costume.
What follows is therefore the **mechanism**, tabletop-executable at CP1, not a result.

**Adverse variation — two providers' allowances consumed at 3×; one lane must be shed.**

1. **Detection.** Pressure is the maximum of independently observed saturation dimensions, never a blended
   score (`07` §6). At 85% of a period allowance, new discretionary admission stops.
2. **The ask.** C02 opens a `ShedNegotiation` with a fixed window. Each holder returns two things: its
   **stated minimum** — the level below which its duty fails, declared in advance, not invented under
   pressure — and the **deadline that moves** if it yields.
3. **The decision.** C02 decides. Protected due-service minimums bind first. A charter's minimum is evidence,
   not a veto (R-3).
4. **What the founder sees.** One shed record per lane: lane, holder, duty at risk, deadline moved, stated
   minimum, and **whether the minimum was breached**. A breached minimum is an alert with a named recipient,
   not a log line.
5. **The lapse rule, which is this candidate's own contribution and follows from R8.**

   > **SOURCE CLAIM · R8 §3.** "The five-hour session window resets on schedule whether consumed or not." A
   > conservative scheduler that holds capacity back does not bank it. **Reserved-but-unconsumed capacity is
   > destroyed, not saved**, which is the opposite of how a reserve behaves under per-token pricing.

   **DESIGN PROPOSAL.** Every reserved lane carries a **lapse point** before its reset window. At the lapse
   point, unconsumed reservation releases to the general pool automatically and the holder is *notified*, not
   asked. A reservation that is never spent is priced as waste in the charter's own economics row.

**The falsifier for M2 on its strongest fixture.** Run the shed decision twice on the same tabletop: once
asking named holders, once applying the class reservations of `07` §6 with no holder. Count (a) shed
decisions the founder later reverses and (b) duty minimums breached. **If the two arms agree, the holder
binding bought nothing and A-4 — the single place in the six fixtures where R8 says a charter does work the
middle position has no mechanism for — is refuted.** This runs at CP1 because it is a decision procedure,
not a capacity experiment.

### F-3 · A task needing three distinct tool permissions

**Useful outcome — payment read, customer record write, outbound message send, at least privilege.**

1. The `WorkOrder` names the three permissions and their scopes.
2. The instance under charter X receives `X.eligibility_ceiling ∩ WorkOrder.grant`. The ceiling grants
   nothing.
3. Each release goes through C04 in the ordered release transaction with a live re-read of current
   grants, identity, validity, scope, participant, time, profile and prerequisites.
4. **The record of which identity performed which effect** is the tuple
   `(charter_id, template_version, instance_id, work_order_id, attempt_id)`.

**INFERENCE, and it is one of M2's two reasons for existing at all.** R2 F-21.4 lists **attributable
identity for the record** as a surviving candidate sixth reason to separate identities, derived from this
fixture's own requirement. A charter is an attributable identity that persists across the attempts that
touched one counterparty. That is not a capability difference; it is a record property, and the fixture asks
for it explicitly.

**Adverse variation.**

- **A permission is revoked mid-attempt.** The relevant epoch bumps. The next release transaction re-reads
  and refuses. An effect already released is **in flight, not retroactively stopped**, and cancellation or
  reconciliation starts where available (`02` §4). Attenuation could not have done this (R4 F3).
- **A helper is spawned that must not receive all three.** The helper's grant is supplied **at the call** as
  a subset. Since the runtime's default is total inheritance in four documented ways, the subset is enforced
  by the external policy object keyed on `agent_id`/`agent_type`, with deny-first precedence that a hook
  cannot override (R4 F5, F7). The skill-carried `allowed-tools` path is refused by the same object (R2 F-08,
  R6 F7).
- **The charter-specific hazard.** A long-lived identity invites a long-lived credential. M2 forbids it:
  the desk holds none, and the policy object keys on identity while the credential keys on the release.

**What this fixture costs, published.**

> **SOURCE CLAIM · R2 F-09.** Separating trusted control flow from untrusted data so that retrieved data
> "can never impact the program flow", with capability-based policies enforced at tool-call time, solved
> **77% of AgentDojo tasks with provable security against 84% undefended.** That 7-point gap is the measured
> price of the boundary, and it is the only one of the founder's five criteria with a published price.

### F-4 · A verification the producer must not influence — with AM-01's paired clean case

**This is the fixture where M2 refuses a charter, and the refusal is the finding.**

**DESIGN PROPOSAL.** There is **no standing reviewer** in M2, and no checker may read any charter's carried
record.

> **SOURCE CLAIM · R7 F9.** Cross-context review (fresh session, artifact only) reached 28.6% F1; a
> context-carrying subagent reached 23.8% (p=0.004); same-session self-review 24.6% (p=0.008). The control
> that carries the argument: reviewing **twice** in the same session did not beat reviewing once (p=0.11).
> Extra compute in the producer's context buys nothing; **context separation is what moves the number.**
>
> **SOURCE CLAIM · R7 F2 · R7's own failure table.** Preference leakage: "a systematic bias of judge LLMs
> towards their related student models", "subtler and more challenging to detect" than length or egocentric
> bias. R7 names the precise instance for this architecture: *a canonical record written by the producer and
> read by the checker carries the producer's framing without carrying the producer's rationale*, and every
> provenance check still passes.

**INFERENCE.** A persistent desk with a carried record is exactly that channel. So the carried record is
excluded from checker inputs by construction, and a standing reviewer — the most obvious charter anyone would
propose — is the one M2 refuses outright. What *is* chartered is `CT-INSTRUMENT`, which holds the pools and
never judges.

**Useful outcome, worked.**

1. An ephemeral instance under charter X's acceptance scope produces the artifact.
2. **Deterministic oracle first.** Any part of the acceptance predicate that a deterministic check can decide
   is decided before a model is dispatched (R7 M1). It is the only source of independence with zero model
   correlation. It cannot see a skipped authorisation, so it does not close the fixture alone.
3. **The checker's stated inputs are the artifact plus the acceptance criteria, and nothing else** — no
   producer rationale (anchoring), no producer preferred conclusion (sycophancy), no carried record
   (preference leakage). Three channels, blinded separately; blinding one and leaking another closes half the
   door.
4. **The loader records actual delivered inputs.** `06` §2: "The caller's claimed read list is not trusted."
   A review that *says* it did not read the rationale, in a system where nothing recorded what it read, is an
   assertion.
5. C06 accepts. The charter is not in this path.

**Adverse variation, both halves.**

- **The producer's rationale and preferred conclusion are made available.** Measured effect to expect:
  detection under a strong "bug-free" framing fell from 97.2% to 3.6% for one model and from 68.4% to 8.5%
  for another (R7 F8). The two-arm comparison of W5 is what detects it, and the floor is R7's: a candidate
  reporting only an improvement has not excluded "more compute" as the explanation, so **the repeated
  same-context control (p=0.11) must be shown beside it.**
- **A known defect is planted.** The checker must fail it. Scope: **always-pass detection only.**

  > **DISAGREEMENT, preserved · R7 F19.** One study finds mutants correlate with real fault detection while
  > hand-seeded faults do not; a later, larger study finds all such correlations weak once test-suite size is
  > controlled. The operative consequence is identical under both readings: the control detects an always-pass
  > checker and **does not license a published detection rate.**

**AM-01's paired clean case, run in the same session.** An artifact with **no** defect is judged by the same
checker under the same procedure, and **the refusal rate on the clean case is reported beside the detection
rate on the defective one.**

> **SOURCE CLAIM · R7 F8, the qualification.** "All models exhibit high false positive rates even under
> neutral conditions, ranging from 68.4% ... to 96.8% ... on patched code." **Detection of 97.2% alongside a
> 96.8% false-positive rate is not detection; it is a constant.** What the framing manipulation moved was the
> decision *threshold*, not the *discrimination*. An unpaired control cannot distinguish a working checker
> from one that refuses everything, and refusing everything is the measured default of a neutrally framed
> security judge.

**Reporting rules for both cases.** Chance-corrected agreement beside any exact-match figure (R7 F3); union
of findings, never a vote or a mean (R7 F15); abstention as a first-class verdict (R7 M9); no debate round,
because debate's measured advantage is concentrated where the judge lacks access the debaters have and the
checker here holds the artifact (R7 F17).

**The honest account of "independent" under one model family — the third thing the fixture asks for.**
Independence of **influence** is achievable and measurable by procedure: the checker did not produce the
artifact, did not share the producer's context, did not receive the rationale or preferred conclusion, did
not read any carried record, and did not select its own evidence. Independence of **error** is not
achievable, and no procedure converts one into the other.

> **SOURCE CLAIM · R7 F13 · F12.** Self-consistent errors are those models "repeatedly generate ... across
> multiple stochastic samples"; their frequency "remains stable or even increases" with scale; "all four
> types of detection methods significantly struggle" with them; the only intervention that worked was a
> cross-model probe. And across 350+ models, error correlation persists "even with distinct architectures and
> providers" and **rises with capability** — so the strongest second opinion is the most correlated one.

**M2 states the residual and does not launder it.** Three same-family checkers on a family-shaped blind spot
return unanimous agreement every time, and the unanimity is the failure rather than the assurance.

### F-5 · A handoff across a capacity reset

**DIRECT OBSERVATION · R2 F-18 (FAL-02).** This fixture is not peripheral. A native job caps at a
**360-second network window**, so continuation across launches is **mandatory in every arm, including one
with exactly one agent.** The founder's handoff cost is real here and is not avoidable by refusing to split
work; it is avoidable only by typing what crosses the boundary.

**Useful outcome.** Work stops at a weekly limit and resumes days later in a new session with no
conversational memory.

- **What the resumed attempt may trust:** the portable `Continuation` and the loader's `ContextManifest`.
- **What it may not trust:** a provider-resumed session.

  > **SOURCE CLAIM · R1 F-02.** The provider's context-editing surface returns `cleared_tool_uses` and
  > `cleared_input_tokens` and "replaces each cleared result with placeholder text". It reports **how much**
  > left and that something left. It does not report **which facts** left, and the edit happens server-side
  > after any loader has recorded its inputs. The narrow remedy is available today at one field read per
  > response: reconcile applied edits against the manifest and treat an unaccounted edit as a defect.
- **What it must re-derive:** any load-bearing fact whose `valid_until` lapsed in the gap; anything named in
  `SummaryLoss`; and any pre-gap *model verdict*, which is stale in the same class as a pre-gap source fact
  (R7 F7).

**Adverse variation, three parts.**

- **The pre-reset summary omits a decision.** A summary is an additional derivative beside the canonical
  `Continuation`, never its replacement (`05` §5). The omission is caught by the **decision probe** on the
  carried entries before the next consequential action — not by re-reading the summary. R1 F-05 is why: no
  LLM rater the authors built correlated strongly with human faithfulness annotation, "especially with regard
  to detecting unfaithful claims", and omission is systematic and positional.
- **A source fact changed during the gap.** The carried entry is a `Ref`; it resolves to the canonical record
  whose validity is checked at read; the lapsed `valid_until` removes current eligibility; the critical-field
  probe of CP-142 confirms the corrected value is the one used.
- **One external effect was already released.** Detected by the **idempotency record on the effect**, and
  reconciled against actual `OperationStatus` before any business action repeats. Not detected by state in
  the shared record. An expired lease fences writes and does not prove no external effect.

**Where the charter helps, and where it hurts — both, because both are true.** It helps because the duty roll
survives the reset by construction and the resumed attempt has a named party to ask what was open. It hurts
because a carried entry is exactly the artifact that can be stale and confidently restated: R1 F-04 measures a
19-point and a 15-point loss on knowledge update for bounded self-managed memory, and F-11 measures wrong
retrieved content overriding correct prior knowledge **over 60% of the time.** The Ref-plus-expiry design is
the mitigation and it is unmeasured.

### F-6 · The founder absent for a week

**Useful outcome.** Authorized work continues under standing mandates within reserved lanes. Nothing
irreversible happens in his name: **no charter may release an effect, on any day, absent or not.**

**Adverse variation.**

- **A decision needing only him arrives on day one, deadline day four.** A decision packet is raised with
  the exact decision, why this person, the latest responsible time, options, consequences, reversibility, the
  no-answer behavior and the independent work continuing. At the latest responsible time the **recorded
  bounded fallback** executes. For a founder-only decision the fallback is **park, with the deadline
  consequence recorded** — no answer never means approval (`05` §5). `CT-DUTY`'s holder owns the resulting
  surviving duty, and its roll entry carries the missed deadline as a disposition with a reason.
- **An incident on day five.** `CT-CONTINUITY`'s arrangement activates. **Its limit is stated rather than
  designed around:** review D's CH-06 residual says "a lawful, adequately resourced person or institution
  must remain reachable" and "software cannot supply standing or adjudicative authority by naming a role."
  So the chartered holder **prepares and reaches**; it does not decide. The holder of record for anything
  carrying standing is a human or an engaged professional, and if neither is reachable, **admissions in that
  class narrow** rather than the duty being silently unheld.
- **The re-entry brief restores competence, not awareness.** It carries what was **omitted** and what was
  **contested**, not only what was decided.

  > **SOURCE CLAIM · R1 F-17.** In hidden-profile tasks, agents fail to surface private information
  > contradicting group consensus. A next-action view that everyone trusts suppresses the dissenting fact
  > rather than surfacing it. This is a counter-mechanism to the shared-truth thesis and it is measured.
- **What M2 does not accept during the absence, and why.**

  > **SOURCE CLAIM · R7 §8 F-6.** The founder's value here is that his errors are **uncorrelated with the
  > family's**, so his absence removes the system's only cross-family error source.

  **DESIGN PROPOSAL.** During a declared absence, three classes are not accepted by anyone: a taste
  judgment; an acceptance resting on a model's judgment of objective correctness (near chance, R7 F5); and any
  first entry into a consequence class the company has not entered before. They park with their deadlines
  visible.

---

## 8. Capability binding — all 46

**SPECIFICATION (inherited).** Production modes are `02` §3's five: **D** deterministic computation ·
**P** durable procedure · **M** bounded model work · **H** capable people · **X** qualified professionals and
services. Acceptance owners are the S1 components C01–C09. **Chartered** names the desk holding the
*surviving* part of that capability, if any.

**Count the column rather than trusting this sentence, and the counts are the W11 evidence.** **26 of 46
carry no charter at all.** **Five** name a charter as primary holder — CAP-22, CAP-32, CAP-37, CAP-39,
CAP-42, shown in bold. The remaining **15** name a charter only for a narrowed remainder, and the narrowing
is written in the cell.

| CAP | Concern | Mode | Acceptance owner | Chartered |
|---|---|---|---|---|
| 01 | Intent and commitments | H | C01 | — |
| 02 | Portfolio direction | H | C01 | — |
| 03 | Opportunity discovery | M | C03 | — |
| 04 | Customer research | M+H | C03 | — |
| 05 | Market research | M | C03 | — |
| 06 | Company and product strategy | H | C01 | — |
| 07 | Product management | M+H | C03 | — |
| 08 | Experience and product design | M+H | C03 | — |
| 09 | Brand and identity | H | C03 | — |
| 10 | Software and technical construction | M+D | C03 | **— (deliberately)** |
| 11 | Quality assurance | D+M | C06 | `CT-INSTRUMENT` (pools only) |
| 12 | Launch and release | P+D | C02 | — |
| 13 | Content production | M | C03 | — |
| 14 | Marketing and distribution | M+P | C03 | — |
| 15 | Sales | M+H | C03 | — |
| 16 | Customer communication | M+H | C07 | — |
| 17 | Support and customer success | M+P | C03 | `CT-STANDING` (post-closure only) |
| 18 | Pricing and commercial economics | D+H | C03 | — |
| 19 | Finance and treasury | D | C04 | — |
| 20 | Bookkeeping and financial close | D+X | C03 | — |
| 21 | Legal and regulatory coordination | X | C07 | `CT-STANDING` (intake and deadlines only) |
| 22 | Privacy and data rights | P+X | C07 | **`CT-STANDING`** |
| 23 | Security operations | D+P | C08 | — |
| 24 | Procurement and suppliers | P+H | C03 | `CT-DUTY` (post-award commitments) |
| 25 | Partnerships | H | C07 | — |
| 26 | Hiring and external capacity | H | C07 | — |
| 27 | Human collaboration | H | C07 | — |
| 28 | Analytics | D | C06 | `CT-INSTRUMENT` (denominators only) |
| 29 | Experimentation | D+M | C03 | — |
| 30 | Operations and fulfillment | P+X | C03 | — |
| 31 | Incident response | P+H | C08 | `CT-CONTINUITY` (reachability only) |
| 32 | Knowledge management | P+M | C05 | **`CT-MEANING`** |
| 33 | Governance | H | C01 | — |
| 34 | Organizational learning | M | C03 | `CT-MEANING` (validity of retained lessons) |
| 35 | Scaling | D | C02 | `ShedNegotiation` participant, all five |
| 36 | Pause | P | C02 | `CT-DUTY` |
| 37 | Recovery and resumption | P+D | C08 | **`CT-CONTINUITY`** |
| 38 | Pivot and changed direction | H | C01 | `CT-DUTY` (surviving promises) |
| 39 | Closure and wind-down | P+H+X | C07 | **`CT-DUTY`** |
| 40 | Institutional formation and readiness | X | C07 | — |
| 41 | Succession and transfer | H+X | C07 | `CT-CONTINUITY` |
| 42 | External grievance and remedy | P+H+X | C07 | **`CT-STANDING`** |
| 43 | Owner attention and competence | P+H | C07 | all five, through the charter sheet |
| 44 | Truthful account and reproducibility | D | C09 | `CT-INSTRUMENT` |
| 45 | Compute, subscription and infrastructure capacity | D | C02 | `reserved_lane`, all five |
| 46 | Controlled system improvement | D+H | C06 | `CT-INSTRUMENT` (instrument half only) |

**The three answers the protocol asks for explicitly.**

**Who accepts a refund (CAP-17).** The *decision* to remedy is accepted by the venture's outcome sponsor
under C01-endorsed authority; the *release of money* is C04's, in the ordered release transaction; the
*discharge* is the customer's and nobody else's — an internal status never discharges an external standing.
**If the customer contests after the case closed, `CT-STANDING`'s holder owns it**, has the prior standing
entry, and can reach a funded remedy without the customer re-explaining.

**Who owns a non-customer grievance six months after closure (CAP-42, CAP-22).** `CT-STANDING`'s holder, by
name, reachable through the published route in its `reachability` field, with intake that does not require
product access, identity checks proportionate to the request, acknowledgment, a deadline, reasons, escalation
to a named human or professional, remedy authority routed to C04, continuity through `CT-CONTINUITY`, and
preserved disagreement. **This is the single capability that most justifies M2's existence**, and review D's
CH-03 is the finding that asked for it: an assignment rule produces a custodian at the moment it is asked; a
complaint six months after closure needs a party that already existed.

**Who sheds a lane at 4× (CAP-45, CAP-35).** C02 decides. Every holder is asked and returns a stated
minimum; the founder sees the shed record including any breached minimum. **A charter never vetoes.**

---

## 9. Comparators

### 9.1 Against S1.0

**INFERENCE, and it is the most honest thing in this document.** Remove the three new rows of §2.4 — carried
memory, holder-bound reservation and the reachable named holder — and **M2 is S1.0 exactly.** Not similar to
it; identical. The comparator is therefore unusually clean, and W13's "remove the defining mechanism" probe
is answerable by subtraction rather than by argument. Each row is removed separately below, because removing
them together would hide which one was carrying the weight.

| Removed | What becomes materially worse | Measurable worsening | Falsifier |
|---|---|---|---|
| The named holder | Review D's CH-03 discriminating test: a legitimate complaint against the custodian, from an affected non-customer, after closure | Count: times the complainant must re-supply facts the company already holds; times the disposition requires knowing internal topology; elapsed time to a named responder | Run CH-03's test under both arms. If the ownership resolver's custodian performs identically, the holder bought nothing |
| Holder-bound reservation | F-2's adverse variation: a class has no representative to ask | Count: shed decisions the founder reverses; duty minimums breached | §7 F-2's two-arm tabletop. Agreement refutes R8 A-4 |
| Carried memory | The resumed attempt and the returning founder must re-derive what was open and why | Minutes to re-derive; duties discovered late | **The fresh-holder arm**, below |

**The fresh-holder arm — M2's own removal test, stated as a (c)-class protocol.**

- **Subject:** one charter's carried memory scope.
- **Arms:** the incumbent holder with its carried record; a freshly bound holder with an empty record, same
  template version, same window.
- **Cases:** `CT-INSTRUMENT`'s fixed pool for that duty class, which neither arm may write to.
- **Unit:** a duty case. **Repetition:** five attributable trials per case (`06` §7). **Reporting:**
  detection and refusal rates separately, chance-corrected, union not vote.
- **Stopping rule:** if the fresh arm is within a predeclared band on two consecutive quarterly runs, cut the
  memory scope; if it stays within the band after the cut, retire the charter.
- **Owner:** `CT-INSTRUMENT`, which is not the subject. Founder accepts the reading.

**UNKNOWN, and it is this candidate's load-bearing hole.** See §12.

**What M2 does not claim over S1.0.** Nothing on F-1 (charters make it harder if anything). Nothing on F-3
beyond the attributable-identity record. **Nothing at all on F-4** — independence comes from separate
evidence, method or grounding, not from standing, and R8's fixture reading says a charter adds nothing over
the middle position here. Nothing on cost at 1× or 2×.

### 9.2 Against B0

**B0 given its full legitimate strengths, per §6:** one long-context session plus deterministic scripts plus
one shared record in version control, with its own retrieval scripts, checklists and human review; no
handoff loss because no handoff; no routing error because no router; one context a person can read; trivially
buildable; trivially changeable; a record the founder reads end to end, which serves W12 better than any
projection.

**Two of those granted strengths were falsified by lanes in this round, and this candidate reports rather
than amends.**

> **FAL-01 · R8 B-6.** Protocol §6 grants B0 "the lowest plausible consumption of scarce subscription
> capacity". Vendor documentation gives four mechanisms by which one long session consumes *more* plan
> allowance than its activity suggests: the full conversation is resent with every request and again with
> every batch of tool results; the first message after a break longer than the cache lifetime reprocesses
> the full context, and that lifetime is an hour on a subscription; compaction reads the conversation it
> summarizes, so compacting a large context is itself a large request; and scheduled tasks and idle
> check-ins each send the full context. **B0 minimises launches. It does not minimise the weekly bucket,
> and the weekly bucket is what binds.**
>
> **FAL-02 · R2 F-18.** B0's "one long-context session" is **not purchasable** under this system's own
> launch contract: a native job caps at a 360-second network window.

**The protocol is frozen and this candidate does not amend it.** Both falsifiers are recorded as findings
against premises, and the comparison below is run as §6 requires, with the premises flagged.

| Fixture | B0 | M2 | Honest verdict |
|---|---|---|---|
| F-1 | Admits and types in one context; refusal by checklist; no human edit for staffing because there is one worker | Same admission, plus a named landing place for the surviving duty | **Close. B0 is arguably better at F-1**, because it never has to decide which desk holds a new kind of duty |
| F-2 | No unit to shed, because there are no units. Elapsed time is the only lever at 2× | Named holders, stated minimums, lapse rule | **M2**, and it is the one fixture where the advantage is structural |
| F-3 | Cannot exhibit attenuation at all; there is nothing to attenuate from | Ceiling ∩ grant, policy object at the enforcement point | **M2, decisively** — and S1.0 equally |
| F-4 | No verification independence of any kind, by construction | Fresh-context checker, paired clean case, carried record excluded | **M2 over B0 — but see the next paragraph, which is against M2** |
| F-5 | Bites hardest here: continuation is mandatory and the reset is routine, not exceptional | Duty roll survives by construction; carried entries can go stale | **M2**, narrowly, and the staleness cost is unmeasured |
| F-6 | The founder is the system; absence is total | Standing mandates within lanes; nothing irreversible | **M2**, with `CT-CONTINUITY`'s standing limit stated |

**The finding most adverse to M2 on this comparison, quoted rather than paraphrased.**

> **SOURCE CLAIM · R7 §8.** "A candidate whose advantage over B0 is 'it adds a checker' is claiming an
> advantage worth roughly four F1 points on a 28.6% base, against B0's legitimate strength of a record one
> person can read end to end. **B0 plus deterministic scripts plus human acceptance is, on this lane's
> evidence, not obviously worse than B0 plus deterministic scripts plus a same-family checker.**"

**M2 accepts that and adjusts its claim.** Its advantage over B0 is not verification. It is three things: the
permission boundary of F-3, which B0 cannot exhibit at any demand level; the reachable named party of CAP-42,
which B0 supplies only by making the founder that party; and the shed unit of F-2. **And M2 imports B0's best
property rather than competing with it:** the charter sheet is five small records a person reads end to end,
which is B0's W12 strength rebuilt inside a larger system.

**When B0 wins outright, by the protocol's own four conditions.** If F-2 at 1× and 2× shows no material
difference — which §7 F-2 concedes it will — and the founder is willing to be the reachable party himself for
CAP-42 and CAP-22, and the four ventures never reach 4×, then **B0 wins and the correct output of this round
is a smaller system.** M2's advantage is concentrated at demand pressure and in obligations that outlive
cases, and if neither materialises it has bought nothing.

### 9.3 On the criterion tension, recorded not argued

> **SOURCE CLAIM · R8 A-6 (FAL-11).** W11 fails a candidate if a business-literate reader describes "a
> roster of digital employees"; W12 fails it if the founder becomes a full-time reviewer or has no competence
> mechanism; and "the structure that is easiest for a founder to hold in his head is precisely the one W11
> rejects by name." R8 records this as **"a criterion tension, not a defect"** and declines to advance it as a
> counterexample. The cross-lane comparison classes it the same way: the closest thing in the round to an
> argument against a frozen criterion, and not one.

**This candidate does not advance it either.** W11 is applied as written, and §10 states the plain-language
description a reader should produce and the five properties that make "digital employees" the wrong summary.

---

## 10. Strengths · Weaknesses · Limits · Complexity · Security · Provider dependence · Migration · When this is wrong

**Strengths.**

1. **A reachable party that survives the work.** The only mechanism in this round that answers review D's
   CH-03 on its own discriminating test.
2. **A shed unit with a holder.** A class cannot be asked to yield; a desk can. R8 names this as the single
   place in the six fixtures where a charter does work the middle position lacks a mechanism for.
3. **A subject for longitudinal evaluation.** Drift of a *performer* is unmeasurable without a performer that
   persists. S1.0 can measure template drift, which is narrower, and should say so.
4. **Attributable identity across attempts**, which F-3 asks for by name.
5. **Priced reservation.** The lapse rule is the only place in the round where a reserve is costed as waste
   rather than as thrift, which is what a non-rolling allowance makes it.
6. **It refuses the tempting charter.** No standing reviewer. The design's own strongest instinct is
   overruled by R7's measurements.

**Weaknesses.**

1. **The central benefit is unmeasured, and the two most-cited deployments refuse to support it** (§12).
2. **Carried memory is the largest attack surface in any candidate**, and the two defences the specification
   currently leans on are measured as ineffective against the attack that matters (R1 F-10).
3. **Charters make F-1 harder, not easier.** New kinds of work have no holder.
4. **The test is stated; the set is still a judgement.** §2.5 gives a refutable three-part gate, but nobody
   has run it against a real duty inventory, so "these five" remains a proposal and not a derivation.
5. **The reserved lane's size is undecidable here** and blocks (§11).
6. **Founder attention rises**, not falls: five sheets and one transfer test a month is a real cost charged
   against W12's own criterion.

**Scalability limits.** The binding constraint is not desk count; it is **reachability**. Each charter
promises an outside party a named route, and a route that is not answered is worse than one never published.
Two ventures can share five desks; ten ventures probably cannot, because the duty roll's cap binds per desk
and splitting a desk splits a published route. The honest statement: **M2 scales with obligations that
outlive cases, not with work volume**, and nobody has measured that rate.

**Operational complexity.** Three new records, one new negotiation, one new instrument. Against S1.0 the
added machinery is small. Against B0 it is large, and B0's simplicity is real.

**Security implications.** Two, both named above and neither closed: a long-lived identity invites a
long-lived credential (refused by design, must be enforced by the policy object); and a persistent evaluated
record makes the autonomy ratchet tempting (refused by the monotonic-exposure check, which is a test somebody
must run). Add a third: **a charter's published reachability route is an inbound attack surface** — it is,
deliberately, a channel an untrusted party can reach. Its intake path is where R1 F-10's poisoning case
actually arrives, and it is why no model may author a standing entry.

**Provider dependence.** Identical to S1.0. Charters buy no allowance, change no provider relationship, and
pin no model. The `holder_binding` names a template version; the runtime profile is pinned per `WorkOrder`,
so a provider change does not move a desk.

**Migration difficulty.** Adding a charter is a reversible software change and an **irreversible relational
one**: once an outside party has been told who to contact, retiring the desk without a named successor is a
broken promise. Removing carried memory is easy — it is a derived, capped, expiring store. Removing the
reserved lane is easy. **Removing `reachability` is not**, and that asymmetry is why the recommended
posture is to start with `CT-STANDING` alone and add the other four only on evidence.

**When this is the wrong design.**

- If obligations rarely outlive their cases. The whole design is built on the survivor, and if there are few
  survivors it is machinery for nothing.
- If the fresh-holder arm matches the incumbent. Then the memory bought nothing, and what is left is a
  routing label.
- If demand never reaches the level where shedding is real. At 1× and 2× M2 is S1.0 with extra records.
- If the founder is willing and able to be the reachable party himself for CAP-22 and CAP-42. Then B0 wins on
  §6's first condition.
- If a charter's duty scope starts tracking a department name. Then negative control 8 should catch it and
  the design has failed on its own terms.
- If anyone proposes a sixth charter without running §2.5's three-part test on it. The count is not the
  safeguard; the test is, and a count with no test is a roster waiting to happen.

**The W11 answer, stated plainly.** A business-literate reader given this design should say: *"a company
where a handful of standing responsibilities have a named desk that outlives any particular job, and
everything else is done by whoever is fit for it."* Five properties make "a roster of digital employees" the
wrong summary, and each is checkable: **(i)** no charter produces work; **(ii)** charters are duties, not
jobs, and their scope is written as predicates over obligations rather than as activities; **(iii)** the
holder is replaceable by design and the design measures quarterly whether replacing it changes anything;
**(iv)** no charter exists for any department-shaped capability — CAP-10 software construction, CAP-15 sales,
CAP-14 marketing and CAP-13 content are all deliberately blank; **(v)** 26 of 46 capabilities carry no
charter at all, and only five name one as primary holder.

---

## 11. (d)-class self-audit

Against protocol §5's ten examples, plus what this candidate raises against itself.

| § | (d)-class example | Disposition |
|---|---|---|
| 1 | No rule for who admits a job of an unknown kind | **Closed.** C02 admits, through `05` §2's bounded discriminator, and refuses with a recorded reason. Charters cannot admit and the rule says so |
| 2 | No authority named for a handoff's acceptance | **Closed.** Parent sponsorship persists until an accepted responsibility transfer (`05` §5). A charter may be the receiving custodian only for a surviving duty inside its `duty_scope`, recorded as an `accepted-assignment` acknowledgment |
| 3 | Incompatible meanings of "done" | **Closed.** A duty roll entry closes only on an accepted disposition **with the reason populated**. R5-13's shipping failure — Done with an empty resolution — is refused by making the field mandatory |
| 4 | No rule for what context a resumed attempt may trust | **Closed.** Portable `Continuation` plus loader manifest; no provider-resumed session; carried entries are Refs with `valid_until` checked at read; applied provider edits reconciled against the manifest |
| 5 | Skill selection with no removal criterion | **Closed (inherited).** `05` §8 unchanged. One addition: a skill pinned by an accepted run that is still open on a duty roll cannot be retired until that entry is disposed |
| 6 | Permission composition undefined | **Closed. Refused, not minted.** The charter is a ceiling that grants nothing; the `WorkOrder` supplies the grant; the intersection is computed at the enforcement point. Where no composite is admissible the work splits or a person performs it |
| 7 | No delegation ceiling with an owner | **Closed (inherited).** One child layer by default, owner C02. A charter cannot raise it; raising it is a reviewed template change |
| 8 | No writer authority on shared state | **Closed.** One named writer per carried-memory class, append-only. No last-writer-wins anywhere in the design |
| 9 | No rule for in-flight work at a provider or model change | **Closed.** The runtime profile is pinned per `WorkOrder`, not per charter, so a desk does not move. In-flight runs park under `05` §3's migration rule. Carried entries are re-attested by decision probe before reuse under a new profile, because a pre-gap model verdict is stale (R7 F7) |
| 10 | No stated winner between concurrent attempts | **Closed.** Only C02 advances the cursor in one protected transaction. The attempt reaching the release transaction first wins; the second is refused by the idempotency record on the effect — decided by the record, not by timing |

**Two (d)-class items this candidate raises against itself and cannot close. Both block.**

**(d-M2-1) · May a model hold a desk that carries external standing?** `CT-STANDING` and `CT-CONTINUITY`
carry duties whose correct performance may require legal or professional standing. Review D's CH-03 residual:
"A lawful, adequately resourced person or institution must remain reachable. Software cannot supply standing
or adjudicative authority by naming a role." R2's TC-38 finding adds a human-only sixth reason for a separate
performer: **professional standing that the act itself requires**, which no capability difference supplies.
Without this decision an implementer decides by default whether a model may acknowledge a rights request in
the company's name. **Trigger:** the first non-customer rights request. **Failure:** an acknowledgment with
no standing behind it, which is worse than a delay. **Missing decision:** the holder of record for
`CT-STANDING` and `CT-CONTINUITY` — the founder, an engaged professional, or a model with named human
escalation. **Routed as a decision packet.** M2 is designed so the third option is subordinate by default,
but the design cannot make the choice.

**(d-M2-2) · The size of each reserved lane and its lapse point.** These decide what the company sheds at
demand pressure, which is the system's meaning and not an engineering parameter. They cannot be derived:
there is **no published denominator** for Claude-side weekly allowance, so every capacity figure in this round
is a ratio between arms and "this design consumes 40% of the allowance" is not a sentence anyone here can
write (R8 W-6). **Trigger:** the first `ShedNegotiation`. **Failure:** the first implementer's default becomes
the company's shedding policy. **Missing decision:** per-lane share, per-lane stated minimum, and the lapse
point. **Routed as a decision packet**, with §7 F-2's mechanism attached so the decision is about numbers
rather than about design.

**One item closed by decision, with its cost recorded rather than hidden.** Who accepts `CT-INSTRUMENT`'s own
instrument readings, given that it holds the pools that evaluate every other desk including itself? **Decided:
the founder**, and `CT-INSTRUMENT` may not change a pool without a recorded founder disposition. That is a
real charge against W12's attention budget and it is stated as a cost, not as governance.

**One further founder decision that is not (d)-class but gates admissibility.** TC-35: whether the founder's
five criteria are a closed list. M2 rests partly on **attributable identity for the record** (R2 F-21.4) and
on **a party that outlives the work**, neither of which is among the five. If the list is closed, **M2 is
inadmissible on the founder's own gate** and should be withdrawn rather than argued. R2 returned four
sixth-reason candidates and routed closure to a decision packet; this candidate notes that it depends on the
answer.

---

## 12. Evidence ledger

Every design choice, the finding it rests on, and the kind of that support. **A choice with no finding id is
a DESIGN PROPOSAL with no evidence, marked `—`.**

| # | Design choice | Finding | Kind |
|---|---|---|---|
| 1 | Charter delta is exactly two properties, not six | R8 A-1 | INFERENCE |
| 2 | A charter holds and never produces (R-1) | R8 §8; DIRECTIVE §8.8 | INFERENCE + founder constraint |
| 3 | Ceiling-not-grant (R-2) | R4 F2 (AWS/macaroons/Biscuit) | SOURCE CLAIM |
| 4 | Attenuation enforced by a policy object keyed on agent identity | R4 F7 | SOURCE CLAIM |
| 5 | Runtime default inherits and must be overridden | R4 F5 (FAL-03) | SOURCE CLAIM |
| 6 | Knowledge artifacts may not carry grants | R2 F-08; R6 F7 | SOURCE CLAIM (two lanes, same page, independently) |
| 7 | Revocation is a live re-read, not attenuation | R4 F3 | SOURCE CLAIM |
| 8 | Negotiate-never-veto (R-3) | R8 §8 | SOURCE CLAIM |
| 9 | No field a performance result can write; monotonic-exposure check | DIRECTIVE §1.5; CP-83; R8 §8 | founder constraint + SOURCE CLAIM |
| 10 | Carried memory is typed and referential, never prose | R2 F-04 (0 of 48 vs 73%) | SOURCE CLAIM |
| 11 | No model may author a standing entry | R1 F-10 (0 of 360) | SOURCE CLAIM |
| 12 | Mandatory `valid_until` on every entry | R1 F-04; `06` §4 | SOURCE CLAIM + SPECIFICATION |
| 13 | Correction is supersession plus an understanding check | R1 F-13; CP-142 | SOURCE CLAIM |
| 14 | Decision probe before a consequential action | R1 useful mechanism 5; LongMemEval | SOURCE CLAIM |
| 15 | Write-time size oracle on the cap | R1 F-03 | SOURCE CLAIM |
| 16 | Single writer per class, append-only | R3 F42/F44 | SOURCE CLAIM |
| 17 | Carried record is a named derivative in every `DeletionScope` | R1 §9 Q7 (an open question, answered here) | INFERENCE |
| 18 | No standing reviewer; checker gets a fresh context | R7 F9 (28.6 vs 23.8, p=0.004; 2× same-context p=0.11) | SOURCE CLAIM |
| 19 | Checker may not read any carried record | R7 F2; R7 failure table | SOURCE CLAIM |
| 20 | Paired clean case mandatory, reported beside detection | AM-01; R7 F8 (68.4–96.8% FP) | SPECIFICATION + SOURCE CLAIM |
| 21 | Known-defect control scoped to always-pass detection only | R7 F19 (disagreement preserved) | DISAGREEMENT |
| 22 | Deterministic oracle before any model checker | R7 M1; R7 F5 | SOURCE CLAIM |
| 23 | Chance-corrected agreement; union not vote | R7 F3; R7 F15 | SOURCE CLAIM |
| 24 | No debate round in F-4 | R7 F17 (asymmetry regime) | SOURCE CLAIM |
| 25 | Independence of influence stated, independence of error disclaimed | R7 F13; F12; TC-37 | SOURCE CLAIM |
| 26 | Re-check interval shorter than provider release cadence | R7 F7 (84%→51% in 3 months) | SOURCE CLAIM |
| 27 | Rubric edit is an instrument change needing a bridge | R7 F6 | SOURCE CLAIM |
| 28 | Refusal is a recorded terminal state with an owner | R5-14; AG-12 | SOURCE CLAIM |
| 29 | Refusal rate on the paired clean case reported for admission too | R5-15; X17 | SOURCE CLAIM |
| 30 | Staffing may need a human edit; admission/typing/acceptance do not | R5's TC-19 split; R5-08 | SOURCE CLAIM |
| 31 | Lapse rule: unconsumed reservation releases before the reset | R8 §3 (registrable) | SOURCE CLAIM |
| 32 | Capacity reported as ratios between arms, never as a fraction of the week | R8 W-6 | DIRECT OBSERVATION |
| 33 | F-5 is central because continuation is mandatory at 360s | R2 F-18 (FAL-02) | SOURCE CLAIM |
| 34 | No provider-resumed session; reconcile applied edits | R1 F-02; `06` §2 | SOURCE CLAIM |
| 35 | Re-entry brief carries omissions and contested items | R1 F-17 (hidden profile) | SOURCE CLAIM |
| 36 | Three classes not accepted during founder absence | R7 §8 F-6; R7 F5 | SOURCE CLAIM |
| 37 | Attributable identity as a reason to separate | R2 F-21.4 | INFERENCE |
| 38 | Reachable named party as the charter's core justification | R8 A-5; review D CH-03, CH-06 | INFERENCE + review finding |
| 39 | Holder-bound reservation at demand pressure | R8 A-4 | INFERENCE |
| 40 | Holder drift as a measurable subject | R8 §7.3 | INFERENCE |
| 41 | Charter sheets as the founder's surface | protocol §6's B0 strength, imported | INFERENCE |
| 42 | Delayed unfamiliar-transfer test monthly | TC-29; R1 TC-29; AG-10 | SOURCE CLAIM |
| 43 | Standing for external duties must be human or professional | review D CH-03 residual; R2 TC-38 | SOURCE CLAIM |
| **44** | **Five charters, and this specific five** | — | **DESIGN PROPOSAL, no evidence** |
| **45** | **The three-part charter test (standing duty · carried record · named party)** | — | **DESIGN PROPOSAL, no evidence** |
| **46** | **Tie-break between two matching desks by predicate specificity** | — | **DESIGN PROPOSAL, no evidence** |
| **47** | **The four memory classes, and exactly four** | — | **DESIGN PROPOSAL, no evidence** |
| **48** | **`ShedNegotiation` as a bounded window with a stated minimum** | — | **DESIGN PROPOSAL, no evidence** |
| **49** | **The seven-operation lifecycle as structured in §6.6, in particular that suspension freezes the record read-only and narrows admissions when no interim holder is reachable** | — | **DESIGN PROPOSAL, no evidence** |
| **50** | **Quarterly cadence for the fresh-holder arm** | — | **DESIGN PROPOSAL, no evidence** |
| **51** | **Wake right bounded by the reserved lane** | — | **DESIGN PROPOSAL, no evidence** |
| **52** | **Start with `CT-STANDING` alone and add the rest on evidence** | — | **DESIGN PROPOSAL, no evidence** |
| **53** | **Mandatory reason field on a duty roll entry** *(the failure is evidenced by R5-13; making the field mandatory is not)* | partial | **DESIGN PROPOSAL, no evidence for the remedy** |

**DIRECT OBSERVATION. Ten design choices carry no evidence** — rows 44–53. Nine of the ten are structure
(how many desks, how many classes, which ladder, what cadence); one is a remedy whose problem is evidenced
and whose fix is not. **None of the ten is the candidate's central claim**, and that is the point of counting
them: the central claim is row 38 and its evidence is a review finding and an inference, not a measurement.

### The load-bearing hypothesis, and the experiment that tests it

**UNKNOWN · R8 A-7, adopted here as M2's own.** *No source found in this round measures whether persistent
model identity improves accepted outcomes.*

> **SOURCE CLAIM · R8 A-7 [S19].** An independent one-month review of a persistent autonomous agent: "Out of
> 20 tasks we attempted, we saw 14 failures, 3 inconclusive results, and just 3 successes", attributing the
> failures to persistence itself — "The autonomous nature that seemed promising became a liability — Devin
> would spend days pursuing impossible solutions rather than recognizing fundamental blockers."
>
> **SOURCE CLAIM · R8 A-7 [S20, S21].** A company press release claimed its assistant "is doing the
> equivalent work of 700 full-time agents" and "$40 million USD in profit improvement"; fifteen months later
> the company reversed and rehired, its chief executive quoted saying cost-driven automation produces "lower
> quality". The press release is strongly conflicted and R8 records no confidence in its claim.
>
> **SOURCE CLAIM · R8 A-3, the only support, and it is weak.** Team familiarity has "a significant positive
> effect on performance" in a large services setting while conventional individual experience does not.
> **Secondary as reached** — the publisher page returned HTTP 403 and the finding arrived through a search
> summary of the abstract. Transfer from human teams to model executors is unvalidated.

**INFERENCE.** Neither deployment refutes chartered persistence. Both **refuse to support it**, and M2 must
carry that rather than explain it away. The distinction M2 relies on — and which neither source tests — is
that its persistence is a **duty and a typed record**, not an autonomous agent left running. Devin's failure
mode was an agent that kept going; M2's desks do not produce at all. **That distinction is an argument, not
a measurement, and a reader is entitled to reject it.**

**The experiment.** The fresh-holder arm of §9.1, restated as its protocol:

- **Hypothesis.** A holder with a carried record achieves a higher accepted-outcome rate, or fewer late-
  discovered duties, than a freshly bound holder of the same template on the same fixed cases in the same
  window.
- **Baseline.** The fresh holder. **Not** the incumbent's own past performance, which would confound drift
  with learning.
- **Unit.** One duty case from `CT-INSTRUMENT`'s fixed pool. **Repetition.** Five attributable trials per
  case. **Reported separately.** Accepted outcomes; late-discovered duties; refusal rate on the paired clean
  cases; minutes of founder re-derivation. Never summed.
- **Stopping rule.** Two consecutive quarterly runs inside a predeclared band ⇒ cut the memory scope. Two
  more inside the band after the cut ⇒ retire the charter.
- **Owner.** `CT-INSTRUMENT`, which is not the subject. The founder accepts the reading.
- **It runs at CP1.** Two sequential holders, one pool, no concurrency. Unlike F-2's demand sweep, **this
  experiment is not blocked**, and that is the strongest procedural thing this candidate can say about its
  own weakest claim.

**Finally, a limitation of this round that bears on every row above.**

> **DIRECT OBSERVATION · cross-lane comparison §H.** No lane registered a claim; seven of eight report the
> registration tool absent while the roster declares the grant. **Not one quotation in this round has been
> machine-verified against its source by the resolver.** Every quoted figure in this document inherits that
> gap, and anyone intending to rely on one should re-fetch and verify it first.

---

*M2 candidate artifact. Nothing here is a decision, a selection, or a result. Two (d)-class items block and
are routed as decision packets; one further founder decision (TC-35 closure) gates admissibility.*
