> Archival provenance — 2026-09-14: Step 6 independent review of the F2 re-specified layer, dimensions **W4 cost and capacity · W7 reliability and durable work state · W9 changeability · W13 alternative depth and comparator honesty**, against the frozen F2 protocol (`26af5d5` + AM-01), on frozen subject `8f6c2c2` (git archive). Preserved verbatim from the reviewer engine's report file. The reviewer wrote nothing in Steps 1–5, read the selection record only at §8 and §11 (part of the W13 subject), no candidate self-audit, no session file, no worktree, no other reviewer's scratch; counts computed from the frozen JSON. Same model family as every author; independence is procedural only. Archival is not acceptance.
>
> **Judgments:** W4 **insufficient** · W7 **insufficient** · W9 sufficient · W13 sufficient. Nineteen findings F6C-01..19, **none (d)**.

# Step 6 independent review — W4, W7, W9, W13

## Provenance

**Subject.** Commit `8f6c2c2` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`, read from a
frozen `git archive` extraction at `$S/subject/docs/vision-system`. No file was read from the live worktree.

**Protocol applied.** `planning/F2/00-acceptance-protocol.md`, frozen 2026-09-13 at `26af5d5`, plus
amendment **AM-01** (2026-09-13, F-4 gains a paired clean case). Both read whole.

**Read.** `00-acceptance-protocol.md`; `00-acceptance-protocol-amendments.md`;
`specification/05-work-agents-skills.md` (whole); `specification/07-integrations-capacity.md` §5–§8;
`specification/11-schemas-state-contracts.md` (guard and record paragraphs);
`planning/02-architecture-selection.md` §8–§10; `registers/decisions.json` AD-019…AD-022;
`registers/open-questions.json` Q-020, Q-021; `research/F2/R8-contrarian.md` §2–§3 (B-6, W-5, W-6),
`R2-agent-existence.md` F-18/F-19, `R3-frameworks.md` §2.13 durable-workflow blocks (F28–F44);
`planning/F2/04-attack-consolidation.md` §A, §B.1, §B.3, §G; and the contract registry
(`record-registry.json`, `records.schema.json`, `predicate-registry.json`, `pinned-conjuncts.json`,
`aliases.json`, `coverage-inventory.json`, all 72 fixture files).

**Of `planning/F2/05-selection-record.md` I read §8 and §11 only**, which the brief names as subject matter
for W13. I did not open §1–§7, §9, §10, §12 or §13, and did not read any candidate's §11 or §12.

**Independence — procedural only, and disclosed.** I wrote nothing in Steps 1–5. I share one model family
with every author of the subject, so independence of error is not available and is not claimed. I did not
read `docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, any
producer self-assessment, or any other Step 6 reviewer's scratch. Where a register asserts a count or a
join, I resolved it against the frozen JSON rather than quoting it; every number below is computed.

**One boundary crossing, disclosed.** To verify a zero-occurrence count I ran `grep -rno` across the whole
`docs/vision-system` tree. That printed matching file names and line numbers from documents outside my read
set — two candidates, three attack reviews, and the selection record's §12. I did not open any of them, and
nothing from them enters a finding; the only thing carried out is the count itself, in F6C-12. Recorded
because the check, not my restraint, is what a reader can verify.

**Return channel.** No truncation. The ≤3,000-character summary returned to the team lead is a précis of
this file, not a different judgement.

---

## Verdicts

| Dimension | Verdict |
|---|---|
| **W4** — cost and capacity under subscription | **insufficient** |
| **W7** — reliability and durable work state | **insufficient** |
| **W9** — changeability | **sufficient** |
| **W13** — alternative depth and comparator honesty | **sufficient** |

No aggregate score. No recommendation. Per protocol §8, a (d)-class finding blocks; **I raise none.**
Nineteen findings follow, classed (a), (b) or (c) as protocol §5 defines them.

---

## W4 — Cost and capacity under subscription · **insufficient**

### The probe, walked

The weekly bucket empties Wednesday; a refund is due Thursday; a supplier reply is due Friday.

**Who performs.** `05` §7 and `07` §6 (R-G01) both say the **named non-model production mode** performs it,
"named explicitly on the obligation rather than chosen in the moment". **Who is told.** "A named recipient
is alerted with the exhausted dimension, the due duty and the route taken." **What is recorded.** "The
breach-or-perform decision leaves a record naming which was chosen and why." The rule shape is right and it
is the correct distinction — the exhaustion rule is deliberately separated from the pressure rule, and
*fifty percent of an empty bucket is zero* is exactly why. Three of its three operative nouns resolve to
nothing in the contracts. See F6C-01 and F6C-02.

### What landed, and it should survive the next iteration

- **Money and capacity are separate units, enforced in the schema, not asserted in prose.** `ResourceAccount`
  and `Reservation` are kernel records with `Budget` as their composite; `07` §6 states "Money cannot be
  inferred from token estimates, and an included subscription call still uses scarce capacity"; `05` §7 makes
  `CapacityState` record **remaining-or-unknown** rather than assuming an allowance; AD-022 fixes shares as
  fractions of the **observed** allowance and refuses absolute quantities, which is the only honest response
  to R8 W-6's finding that no absolute weekly denominator is published.
- **The lapse rule is the round's sharpest economic correction and it is registered.** `Reservation` carries
  `holder_ref`, `stated_minimum`, `lapse_point`, `lapse_requires_holder_consent` and
  `lapsed_unconsumed_quantity`; `guard.reservation.lapse_independent_of_consent` demands
  `lapse_requires_holder_consent == false`; the guard is pinned in `pinned-conjuncts.json` and exercised by
  the paired fixtures `r16-10`. A reserve under a non-rolling allowance priced as waste rather than thrift is
  a genuinely counter-intuitive result and it is carried all the way into a predicate.
- **`guard.holder.no_veto` closes AE-M4-01 completely.** Bound to
  `edge.StandingHolder.staffed.suspended.v1`, both conjuncts pinned (`veto_right == false`,
  `stated_minimum_status == "evidence"`), both fixtures present. `ShedDecision.payload.required` carries all
  eleven fields AD-022 names, including `lapsed_unconsumed_quantity`, `minimum_breached`, `overflow_count`
  and `holder_concurred`. "The holder's stated minimum is evidence, not consent" is a demand, not a sentence.
- **The metered path — X20 and G-07 — has all four elements and its observation point is backed by required
  fields.** `07` §5 names the point (`AuthAttestation` billing-and-credit fields), the cadence (before every
  launch, ≤5 min while active, 24 h expiry or immediately on a relevant event), the reader (the capacity
  owner and alternate) and the response (halt new launches in that class, plus `07` §6's existing
  quarantine). `BillingProfile` requires `charge_mode` (an enum including `metered`),
  `credit_observation_refs`, `auto_reload_observation_ref`, `custodian_assignment_ref`, `freshness_duration`
  and `valid_until`; `RuntimeProfile` carries `paid_fallback_allowed: Const<false>`. And it is disclosed as
  **observation, not prevention** — the package refuses to claim a boundary it does not hold.
- **F-2 is stated honestly as blocked.** `05` §12's holder table marks the reserved-lane row "**exercised
  only at 4× demand, which is not executable at the current concurrency pin. Recorded as owed, not as
  passed**", and §13 names it again as something the (d)-frame cannot see. That is control 10 honoured
  rather than routed around.

### Findings

**F6C-01 · (a) · No record field carries the named non-model production mode; uniform gap G-01 is answered
in prose only.**
*Passage.* `05` §7: "the **named non-model production mode** of `07` §6 performs it". `07` §6 R-G01: "the
manual and other-provider paths this section already admits, **named explicitly on the obligation**".
*Counterexample, computed.* `production_mode`, `non_model_production_mode` and every equivalent occur **zero
times** across `record-registry.json`, `records.schema.json`, `predicate-registry.json` and
`invariants.json`. `Obligation` declares no such field. "Named explicitly on the obligation" names nothing,
and no predicate can refuse the admission of a due obligation in an exhaustible class that has no performer.
*Required contract.* A required field on `Obligation` (or its capability contract) naming the non-model
production mode and its performer assignment ref, plus a conjunct on the admission edge for any duty class
that can exhaust.
*Confidence.* High. *Note.* Who that person is remains MD-02, an open (d) already registered. This finding
is about the field, not the staffing.

**F6C-02 · (a) · The breach-or-perform record is required and no record type is it.**
*Passage.* `07` §6 R-G01 and `05` §7: "the breach-or-perform decision leaves a record naming which was
chosen and why".
*Counterexample.* `ShedDecision` is written when C02 proposes and C01 authorises a **shed**; its
`minimum_breached` is a fact about a shed lane, not about an empty bucket meeting a due obligation. The
exhaustion rule is explicitly *not* the pressure rule, and the pressure rule's records do not carry it. No
record, phase or criterion in the registry is the breach-or-perform record.
*Required contract.* Name the record — an exhaustion variant of `ShedDecision`, or a new single-phase record
— carrying the branch chosen, the route taken, the alerted recipient and the due duty, and bind it to a
criterion.
*Confidence.* High.

**F6C-03 · (a) · The lapse guard sits on one of three release edges, and no transition fires on the lapse
point passing.**
*Passage.* `07` §6 R-X24; `05` §9 adverse row 10, "A reservation unconsumed at the lapse point, **held past
it**", which must fail.
*Counterexample, computed.* `Reservation` has phases `held · partly_consumed · consumed · released ·
uncertain` and nine transitions. `guard.reservation.lapse_independent_of_consent` is called by
`edge.Reservation.held.released.v1` **and by no other**. `partly_consumed → released` and `uncertain →
released` carry no guard, so a partly-consumed reservation can be released without recording
`lapsed_unconsumed_quantity` — the very quantity R-X24 says makes a never-consumed lane visible. Worse, the
adverse case as worded is a reservation that takes **no transition at all**: nothing fires on `lapse_point`
passing, there is no `lapsed` phase, and none of the five fields is in `Reservation.payload.required`.
*Required contract.* The guard on every `* → released` edge; and either a `lapsed` phase entered by the
durable timer sweep, or an explicit statement that the lapse is a `ScheduleOccurrence` — so that passing the
point is an event rather than a field nobody reads.
*Confidence.* High.

**F6C-04 · (a) · The expected-launch count — named as this design's dominant unpriced cost and as the
instrument for reopen condition 4 — exists in no contract.**
*Passage.* `07` §6 R-X12: "**This is the dominant unpriced cost of the step model and it is not softened**
… The comparison is also the instrument that notices a **changed provider property**". `02` §8 and `02` §9
reopen 4 repeat it.
*Counterexample, computed.* `expected_launch`, `launch_count` and `expected native-launch` occur **zero
times** in every file under `planning/specification/contracts/`. `WorkflowDefinition` declares no
launch-budget field. No criterion compares actual to expected at run close.
*Required contract.* `expected_native_launch_count` required on `WorkflowDefinition`,
`actual_native_launch_count` on `WorkflowRun`, and a conjunct on the run's `* → accepted` edge comparing them
and recording the divergence.
*Confidence.* High. *Consequence.* Reopen condition 4 names an instrument that does not exist, so the
condition cannot fire — see F6C-14.

**F6C-05 · (a) · The evaluation-capacity row is required against a table that does not exist, and the only
enumerated shares bundle evaluation into maintenance.**
*Passage.* `07` §6 R-X11: "Evaluation … carries **its own row** in the reservation table above; it is not
funded out of whatever is left."
*Counterexample.* `07` §6 contains no table. Its only enumerated shares are in the DESIGN PROPOSAL
paragraph — 50% due service, 20% ordinary creation, 15% continuity/security/grievance, **10%
maintenance/evaluation**, 5% discretionary — which is the bundling R-X11 forbids; and `05` §7 then says
evaluation "sheds at the maintenance tier", consistent with the bundle and not with the row.
`evaluation_capacity` occurs zero times in the contracts. This was AE-M2-03's required contract verbatim.
*Required contract.* Split the 10% row and register evaluation's own share in `07` §6 units, or withdraw
"its own row" and say evaluation is funded from the maintenance row.
*Confidence.* High.

**F6C-06 · (b) · The cache-lifetime collapse is priced as a capacity event in prose and binds to no capacity
measure.**
*Passage.* `07` §5 R-G07: the drop from an hour to five minutes "is carried in the **capacity row that the
metered observation writes**".
*Counterexample.* `CapacityObservation.payload` requires `measure`, `unit`, `measurement` and
`freshness_until` — expressive enough to hold it — but `cache_lifetime` occurs zero times in the registry
and no value-registry enum names it as a measure. G-07's close is an instruction to a future implementer
rather than a registered row.
*Class.* (b): the mechanism is documented, its binding unverified. *Confidence.* High.

**F6C-07 · (a) · X14 has no owner, and both founder packets that depend on it defer to it by name.**
*Passage.* `05` §12: the reserved-lane holder's "prerequisite is an **account inspection** — reading the
account entitlement to settle whether the pin is a provider constraint or self-imposed policy — not an
experiment." Q-020 and Q-021 each set `latest_responsible_time` to "NOT URGENT … the cheaper prerequisite is
reading the account entitlement (R-G04), which costs one inspection." AD-021 lists as an accepted cost "an
account inspection nobody has done."
*Counterexample.* No register entry, open question, work record or capability owns the inspection. `07` §5
names "an authenticated custodian" for billing-UI observations and does not extend to the entitlement read.
The consolidation's G-04 recorded this as "the round's highest-leverage open question, gating four claim
verdicts … and no owner"; the amendment reproduces it unchanged.
*Sharpening.* `05` §6's own silent-drop shape (4) is "an escalation ladder ending assigned-and-silent". Two
founder packets deferring to an unowned prerequisite is that shape, applied to the package's
highest-leverage measurement, inside the chapter that names the shape.
*Required contract.* Assign the inspection to `07` §5's authenticated custodian as an admitted WorkOrder
with a latest responsible time, and have Q-020 and Q-021 reference that work order rather than the act.
*Confidence.* High.

### Negative control

**Control 7 — a cost comparison that counts tokens but not scarce capacity — passes, and discriminates.**
No capacity figure in the package is denominated in tokens. The only token measure is "tokens/bytes loaded"
in `05` §8's skill-selection sweep, reported beside selection time, candidates inspected, wrong selections,
ignored steps, accepted outcomes and maintenance cost, and it is not offered as a capacity model. The
control's paired benign case requires exactly that this not be caught.

### Why insufficient

W4's three named failure conditions are **not** triggered: there is no silent fallback to a metered API
(`paid_fallback_allowed: Const<false>`, plus an observer), no token count offered as a capacity model, and
no design defensible only at per-token prices. The insufficiency is in the required evidence. W4 asks for
"queued work and **explicit fallback policy**". The fallback at exhaustion is "the named non-model
production mode", and F6C-01, F6C-02 and F6C-05 show there is nowhere to write the name, nowhere to record
the decision and no row to fund the instrument that would watch it; F6C-04 removes the one instrument the
package itself calls its dominant unpriced cost. The capacity model is honest about what it cannot know and
incomplete about what it has decided.

---

## W7 — Reliability and durable work state · **insufficient**

### The probe, walked

**A launch dies mid-effect inside the 360 s window.** `05` §3: one effect per effect step, the step is the
idempotency unit, "on resume after an interrupt the whole step restarts". `07` §5: "Capture interruption and
possible remote work; never assert that provider-side computation stopped." `05` §6: expired leases fence
writes and do not prove no external effect; recovery reconciles actual `OperationStatus` before repeating
any business action. The restarted step re-derives the same `EffectIdentity` triple and is meant to join the
existing allocation. That last step is where it fails — F6C-08.

**A lease expires.** `AgentInstance.awaiting_input` is registered with its own row: the lease clock keeps
running, so expiry checkpoints the duties rather than silently retrying the step, and the waiting worker
holds no authority it did not already hold. Answered.

**Two attempts race on one entitlement.** `EffectIdentity`, and the same gap — F6C-08.

**A continuation resumes with a stale manifest.** Answered, and this is the strongest part of the chapter:
the armed set is **recomputed, never carried in a summary**, so a pre-reset summary that omits a decision
cannot cause the wrong activation; resumption requires an exact accepted checkpoint; `ConstraintSet` is
required on the continuation and typed members are what a receiver may act on. Protocol §5 item 4 is met.

### What landed

- **The step boundary as the checkpoint is a decision taken, with its cost owned** (R-D19). AT-M1-03's
  required contract offered two options — a named close-out predicate, or an explicit statement that the
  system checkpoints every step boundary and carries the cost. The amendment takes the second by name and
  says why the first needed a denominator the round establishes does not exist. That is a (d) genuinely
  closed.
- **`guard.effect.one_per_step`** is bound to `edge.StepExecution.running.reported.v1` and demands
  `idempotency_unit == "step"` and `count(effect_refs) ≤ 1`, making both fields non-optional at that
  transition even though the schema leaves them optional. R3's F29/F30 — the approval step that duplicates
  the payment it approved, documented, not a bug, invisible in the node's source — is closed structurally.
- **Three of the four silent-drop counters are registered, and better than the prose implies.**
  `criterion.AdmissionRecord.parked.v1` demands the overflow destination, its named reader, both sub-caps
  and that intake was not refused. `criterion.AdmissionRecord.escalated.v1` demands a **named and staffed**
  standing holder and a recorded escalation deadline. `criterion.UnmatchedPoolEntry.escalated.v1` demands
  the escalation holder, the alarm reader, the retention and the residue note.
- **The residue is named rather than covered.** "The pool cannot catch an entry that armed the *wrong*
  interest" is written into the record's own phase row and into `residue_note`, a required field. A
  catch-all that names what it cannot catch is the rare honest kind.

### Findings

**F6C-08 · (a) · `EffectIdentity` declares no exclusive factory and no uniqueness on its triple, so two
concurrent allocations both validate and both release.**
*Passage.* `05` §6: "Identity `(effect_class, counterparty, payload_digest)` … **A second claimant joins the
first and inherits its outcome — it does not race and does not re-release.**" `05` §13 row 10: "Timing
decides nothing. **Residual: none identified.**"
*Counterexample, computed.* `EffectIdentity.identity.key` is `["company_id","record_id","revision"]` — a
UUID, not the triple. `registration.exclusive_factory` is `null` and `permitted_commands` are the generic
`kernel.record.register / revise / transition`. The strings `natural_key`, `unique` and `uniqueness` occur
**nowhere** in `record-registry.json`. `guard.effect.identity_allocated_before_release` asserts
`allocated_at < claimed_at` and `allocating_component_id == "S1-C04"` — both true of each racer
independently. `criterion.EffectIdentity.claimed.v1` requires `first_claimant_ref` nonempty and in
`released|observed` — true of each racer naming itself. The triple survives only as a prose string in the
record's `invariants` array.
*Discriminating evidence.* The registry **has** the construct and uses it on the immediate neighbours.
**Nine of 188** records declare an `exclusive_factory`; `SendClaim` declares `authority.attempt.claim` with
the invariant "One-use claim … **it cannot authorize a second dispatch**", and `Release` declares
`authority.operation.release`. **None of the fifteen new WORK-1.1 records declares one.** For fourteen that
is harmless. For the one record whose entire purpose is convergence under concurrency it is the mechanism.
*Required contract.* An exclusive factory command that resolves-or-creates on `(effect_class_id,
counterparty_id, payload_digest)` and returns the existing allocation to a second caller, plus a conjunct
refusing a second `allocated` record for a live triple.
*Class.* **(a), not (d), and the distinction is worth stating.** Protocol §5 item 10's trigger is "**no
stated winner** between concurrent attempts". A winner is stated plainly and an implementer need invent no
policy about who wins. What is absent is the registered constraint that makes the stated winner reachable. A
reviewer could read `exclusive_factory: null` plus three generic commands as leaving the allocation
procedure to the implementer and class it (d); I record that reading and do not adopt it.
*Confidence.* High.

**F6C-09 · (a) · `no_progress` is an enum value with an optional recipient that nothing demands, and no
`FailureRecord` transition carries a guard.**
*Passage.* `05` §6 R-X10: "`FailureRecord` names **`no_progress` as a terminal error class with a named
recipient**; a terminal class with no recipient is a silent drop."
*Counterexample, computed.* `no_progress` is a member of the `error_class` enum.
`FailureRecord.payload.required` is `["work_order_ref","attempt_refs","error_class","fingerprint",
"cause_refs","unknowns","changed_condition_refs","next_discriminator"]` — it includes neither
`no_progress_terminal` nor `no_progress_recipient_ref`, both of which exist as optional properties. Both
strings occur **zero times** in `predicate-registry.json`. All **eleven** `FailureRecord` transitions call
**no guard**. And `no_progress` is not a lifecycle phase — the phases are `observed · investigating ·
retry_admitted · blocked · resolved` — so "terminal" has no registered meaning either.
*Consequence.* A `FailureRecord` with `error_class: "no_progress"` and no recipient passes schema validation
and every registered edge. That is the silent drop the rule names, reachable through the rule's own record.
*Required contract.* `no_progress_recipient_ref` conditionally required when `error_class == "no_progress"`,
and a conjunct on the transition into the terminal phase.
*Confidence.* High.

**F6C-10 · (a) · The attempt ceiling is on the wrong record, optional, and demanded by nothing.**
*Passage.* `05` §6 R-X10: "**A work order carries a maximum attempt count with a named owner, C02, and a
stated behaviour at the ceiling: park.**" AE-M1-04, AE-M2-06 and AE-M4-04 asked for this in near-identical
words against three different candidates.
*Counterexample, computed.* `attempt_ceiling` exists on **`FailureRecord`** alone, optional, and appears in
zero predicates. `WorkOrder.payload.required` has sixteen entries and none is an attempt ceiling — so a work
order carries no ceiling until it has already failed. `observed → retry_admitted` carries no guard comparing
attempts against it, and `FailureRecord` has no `park` phase in which the stated behaviour could be recorded.
*Required contract.* `attempt_ceiling` required on `WorkOrder`; a conjunct on `FailureRecord: * →
retry_admitted` refusing the transition at the ceiling; and a named phase for the park.
*Confidence.* High.

**F6C-11 · (a) · Silent-drop counter (3) states a comparison that its criterion does not make, although both
operands are required fields.**
*Passage.* `05` §6: "(3) A holding destination whose retention is shorter than the interruption — counter:
retention on any holding destination **exceeds the longest plausible outage**, and the outage figure is
stated, not assumed."
*Counterexample, computed.* `criterion.UnmatchedPoolEntry.landed.v1` demands `work_record_ref`,
`retention_until`, `longest_plausible_outage`, `alarm_reader_ref`, `alarm_raised_at` and `residue_note` all
nonempty, and contains **no comparison operator at all** — its only other ops are `attested_result` and
`accepted_for`. An entry with a one-day retention and a thirty-day stated outage satisfies it. The package
names this exact anti-shape in its own fixture `r16-08`: "a guard that collects the evidence for the ceiling
and never applies it."
*Required contract.* A conjunct `gt(retention_until, landed_at + longest_plausible_outage)`.
*Confidence.* High. *Credit where due:* requiring `longest_plausible_outage` as a per-entry field is the
right answer to "stated, not assumed", and is more than the prose promised.
*Context, not a separate finding.* **33 of the 46** criteria on the fifteen new records contain no
comparison operator; the substantive comparisons live in the 30 guards. `11-schemas-state-contracts.md`
names this limitation about the pre-existing corpus itself ("for 167 of 173 records the source corpus states
no per-phase evidence requirement") and ships `contracts/tools/guard_distinctness.py` to measure it. It is
disclosed, not hidden. F6C-11 is the one case where a rule's own words state a comparison and the criterion
carrying it makes none.

**F6C-12 · (a), low severity · Counter (4) names a state the registry does not have.**
`05` §6: "the terminus of every ladder is an explicit **awaiting-principal state** with a deadline and a
standing owner (§12)". Computed: the string occurs **once in the specification chapters**, in that very
sentence, and **zero times** anywhere in the contract registry; §12 defines no such state and no record
declares an `awaiting_principal` phase. (It does occur eleven times in the F2 round documents — two
candidates, three reviews and the selection record — which is where it came from and is not where an
implementer looks.) The substance is present under a different
name — `AdmissionRecord.escalated`, whose criterion demands a named, staffed holder and a recorded
escalation deadline — so this is a naming mismatch, not a missing mechanism. It is worth a line because `05`
§10 exists for the converse case and states the governing principle: "A state that exists in the machine and
nowhere in the prose is a state two implementers define differently."
*Required contract.* Say `escalated`, or register the phase. *Confidence.* High.

**F6C-13 · (b) · `critical_fields` carries its authorship rule in prose and in no predicate.**
`05` §3 R-D18: "The marking authority is the **capability owner at procedure admission** — never the
resuming attempt, which is the party with an interest in the answer." This is the amendment's claimed close
of AT-M1-02, a (d)-class finding. Computed: `critical_fields` is an **optional** property on
`WorkflowDefinition` and `StepExecution` and occurs in **zero** predicates. AT-M1-02's required contract
asked for it "recorded on the `WorkOrder` or the `FieldAuthority`"; it is on neither. The rule is documented;
its enforcement is unverified. *Class.* (b). *Confidence.* High.

### Why insufficient

W7's failure condition is stated flatly: "Fails if resumption can duplicate an external effect or if task
state can report success for work that stopped." F6C-08 is the first clause exactly — two attempts on one
entitlement, each internally consistent, each passing every registered predicate, each releasing. F6C-09 is
adjacent to the second: a work order whose failure record says `no_progress` with no recipient is work that
stopped and told nobody, through the record written to prevent it. The verdict is not a judgement on the
chapter's reliability thinking, which is good — the step-as-idempotency-unit decision, the one-effect-per-step
guard, the recomputed armed set and the escalation criteria are all real. It is that the two guarantees the
dimension names are the two the registry does not demand.

---

## W9 — Changeability · **sufficient**

### The probe, walked

**Swap the model provider with work in flight.** `05` §3's migration rule governs: named in-flight states,
old/new step mapping, preserved outputs and unknown effects, invalidated acceptance, current grants and
rollback, with C02 parking incompatible runs and C04/C08 fencing affected authority. `05` §4 adds that
"provider/model switching requires equivalent task evaluation and compatible disclosure", and `07` §5 that
"Provider endpoint changes require profile review". AT drafted a finding against this inheritance and
**withdrew it** after verifying the rule (AT-M1-05, recorded as agreement rather than as a defect). The
in-flight half is answered, and the detector half is not — F6C-14.

**Retire a skill version pinned by a live run.** `criterion.SkillVersion.retired.v1` demands a
`replacement_rule` in `accepted|active`, an accepted owner assignment, and `complete_capture` of dependent
descendants, with the stated requirement "Remaining work is reassigned to a named accepted successor, the
dependent descendants are enumerated completely, and the replacement's own readiness is evidenced. **Deleting
a name is not retirement, and removal discharges no duty.**" Answered.

**Change a source's meaning with work in flight.** `FieldAuthority.superseded` plus
`guard.supersession.walks_derived_closure`. The guard does not fail the case §9 states — F6C-15.

**Remove a new record, and is the removal criterion falsifiable.** Answered, comprehensively — see below.

### What landed

- **15 of 15** new records carry a `removal_criterion` in the registry, each in falsifier form, verified
  individually: `AcceptanceInterval`, `AdmissionRecord`, `ArmedSet`, `ConsequenceDerivation`,
  `ConstraintSet`, `EffectIdentity`, `ExistenceJustification`, `FieldAuthority`, `GrantDeliveryReceipt`,
  `InstrumentCalibration`, `ProjectionGrant`, `ShedDecision`, `StandingHolder`, `StandingInterest`,
  `UnmatchedPoolEntry`. W9's failure condition "a mechanism has no removal criterion" is met by every record
  the amendment adds. AE-M1-05 found 7 of 17 standing mechanisms without one in the ancestor candidate; that
  is closed and can be checked in one command.
- **The criteria aim at the design's own foundations.** Layer 1 goes when >90% of admitted actions derive to
  the two lowest classes, or when the derivation and the declared floor agree on every action — "the most
  executable falsifier this chapter carries, and it is aimed at this layer's own foundation". Layer 4's
  profile-convergence probe is run "deliberately as a **pre-declared negative control against this design's
  own thesis**". Layer 2's is an ablation that "runs against its own authors' interest". These are not
  ornamental.
- **`aliases.json` is the strongest single artifact for this dimension.** 26 candidate-era names mapped to
  registry names; a **literal** floor of 20 with an explicit argument for why a derived floor would be
  satisfied by an empty table; a `not_aliases` exclusion list distinguishing a type constructor and a
  runtime hook from records; a stated refusal — "a candidate-era name is never admitted AS a record name …
  an alias resolves to its registry name FOR READING ONLY"; and a validator checking that no alias is a
  record name, every target is one, and none maps to itself. This closes AT-M3-01, AT-M3-02 and AT-M5-02,
  and turns reopen condition 7 into a lint failure rather than a review finding.
- **Nothing is renamed, and the version bump says so.** `05` §1: "No fixed boundary … is reopened, no seventh
  routing class is added and no record is renamed — that is why the architecture version moves S1.0 → S1.1
  rather than S2.0." The candidate-era proposal to rename `WorkflowDefinition`/`StepExecution`/`DomainEvent`
  is refused by name (R-X02).

### Findings

**F6C-14 · (a) · Reopen condition 4's named instrument does not exist.**
Same computed evidence as F6C-04, recorded here because the condition it disables is a changeability trigger.
`02` §9 reopen 4 and selection record §11.1.4: "The launch window, the concurrency pin, the cache lifetime,
the metered affordance and the context-editing surface are all provider properties … and the
**expected-launch count is the instrument that notices**." Computed: zero occurrences anywhere in
`planning/specification/contracts/`. Under W9's own probe — swap the model provider — the package's stated
detector is absent, so a changed provider property is noticed only by whatever else happens to break.
*Required contract.* As F6C-04. *Confidence.* High.

**F6C-15 · (a) · `guard.supersession.walks_derived_closure` cannot fail the adverse case its own §9 row
states.**
*Passage.* `05` §9 adverse row 11: "A supersession whose derived closure includes an accepted outcome,
**left unreopened**" — must fail. Paired benign: "A supersession with an empty closure, which must not
reopen anything" — must pass.
*Counterexample, computed.* The guard's four conjuncts are `present(/payload/derived_closure_refs)`,
`present(/payload/reopened_acceptance_refs)`, `eq(/payload/closure_walk_completed, true)` and
`subset(/payload/reopened_acceptance_refs, /payload/derived_closure_refs)`. Take `derived_closure_refs = [an
accepted outcome]`, `reopened_acceptance_refs = []`, `closure_walk_completed = true`. `subset([], [x])`
holds; all four conjuncts hold; **the guard passes the adverse case.** The containment runs the wrong way for
the case as worded. `pinned-conjuncts.json` confirms the intent is one-directional in its own `why`: "every
acceptance reopened came from the closure, so the reopen set cannot be authored beside the walk" — a real
guarantee, and a different one.
*Scope.* This is the package's answer to uniform gap G-06, "No candidate enumerates what a false entry
already influenced", and to W9's third probe.
*Required contract.* A field distinguishing which closure members are accepted outcomes, plus a conjunct
`subset(accepted_members_of_closure, reopened_acceptance_refs)` — containment in the other direction. The
`present`-rather-than-`nonempty` choice must be kept: it is deliberate, reasoned in the pin, and correct for
the benign row.
*Confidence.* High.

**F6C-16 · (a) · `11-schemas-state-contracts.md` states a rule about the 30 guards that is false of all 30
on one half and of 16 of 30 on the other.**
*Passage.* "Each is a `TypedPredicate` with an exact registered ID, version and closed argument object …
**Each must call its own criterion and each must be exercised by a paired adverse and benign fixture** …
a guard registered with no adverse fixture is a guard nobody has seen fail."
*Counterexample, computed at `8f6c2c2`.* (i) `op: "call"` occurs in **0 of 30** guard bodies, and **0 of
888** `criterion.*` ids is named after a guard. The criterion-call rule is an **edge** property — the same
chapter records it as an IMPLEMENTATION DISCOVERY three paragraphs later, and `validate_contracts.py`
enforces it there — so the sentence attributes an edge property to guards. (ii) **14 of 30** guards are
exercised by a paired adverse+benign fixture, computed over all **72** fixture files recursively. The 16
without one include **both** effect guards (`guard.effect.one_per_step`,
`guard.effect.identity_allocated_before_release`), both derivation guards,
`guard.interest.precondition_invokes_no_model` — the hard rule of layer 3, whose violation is that layer's
stated withdrawal condition — and `guard.class.no_total_rank`, which closes the contested (d) AT-M4-02.
*Mitigating, and it matters.* All 30 **are** pinned in `pinned-conjuncts.json` with hand-written `require`
rows, a `negated` and a `disjoined` discipline whose rationale was itself established by mutation, and a
validator that reads the registry directly without importing the generator. The guards are not unchecked;
they are unmutated. The standard being missed is the chapter's own sentence.
*Required contract.* Correct the sentence to what is true and checked, and add the 16 missing fixture pairs
— or state which guards are deliberately pin-only, and why.
*Confidence.* High.

### Negative control

**Control 1 — a rename-only candidate — passes, and with a mechanism rather than an assurance.** The
amendment adds 15 records, 30 guards and six declared fields on two existing records; the rename path is
refused by name in `aliases.json` and checked by the validator. The control's paired benign case — a genuine
change that reuses existing vocabulary — is exactly what those six fields on `WorkflowDefinition` and
`StepExecution` are, and they pass.

### Why sufficient, and how close it was

W9's two failure conditions are "a mechanism has no removal criterion" and "in-flight work must be abandoned
or silently re-run". Neither is triggered: 15 of 15 records carry falsifiable removal criteria, and the
migration rule is inherited intact and was independently re-verified by the reviewer who set out to fault it.
F6C-14, F6C-15 and F6C-16 are real and specific, and none reaches a failure condition — the first disables a
reopen trigger, the second is a guard that under-catches one named case, the third is a self-description
defect with the substantive check present elsewhere. **The closest call is F6C-15**, because leaving an
accepted outcome standing on a superseded source is a cousin of "silently re-run" and W9's evidence list
includes "retained uncertainty". A reviewer weighting that clause more heavily could reach insufficient here;
I record the margin rather than hide it.

---

## W13 — Alternative depth and comparator honesty · **sufficient**

### The probe, walked

**Is S1.0 → S1.1 genuinely different or renamed?** Different, and the difference is checkable. §8.1 lists
twelve changes, each with "the behavioural difference a reader can check" and each against a named S1.0
position — for instance change 1's test: "draft an internal note, then draft the identical text as an
outward promise. Under S1.0 the release gate differs and the producing structure does not." The "what stays"
list is longer than the "what changes" list and cites its provenance (CP-74, CP-109, CP-128, CP-132, CP-99,
CP-142, CP-153, CP-171, CP-173, CP-84, CP-159, CP-77). Control 1's test is met structurally, and
`aliases.json` is the mechanism that keeps it met.

**Does the package state when B0 wins, per §6?** Yes, and without hedging: "If these ventures never reach a
demand level where a lane must be shed; **and** the founder is willing and able to be the reachable party
himself for privacy requests and grievances; **and** the coordination cost per unit of delivered work exceeds
the loss it prevents; **then B0 wins and the correct output of this round is a smaller system**. The first
and second of those three are live today." `02` §9 foundation reopen 5 carries it into the specification
with "**This condition is live at 1× demand today.**"

**Are FAL-01 and FAL-02 treated as findings against a premise?** Yes, explicitly and with the protocol left
unamended: "this record does not amend the frozen protocol"; "They narrow the comparison; they do not defeat
B0"; "**The synthesis claims no credit for either falsifier.** Neither was found by a candidate and neither
is an argument for more machinery". FAL-02 is restated at **reduced** strength per R-G13 — the source reads
"DESIGN PROPOSAL. Native job **default**: one launch, ≤360 s" and the same section admits a persistent
profile using `--resume`, so it is a default carried as a proposal, not a contract ceiling, and "all five
candidates stated it more strongly than the source supports."

**Are `02` §9's reopen conditions observations, not preferences?** Eleven of thirteen are. Two are not —
F6C-17.

### What landed

- **B0 is given its fixtures and takes them.** Of six, §8.2 hands B0 **F-1 outright** ("**B0 is arguably
  better.** It admits and types in one context, refuses by checklist, and never has to decide which standing
  structure holds a new kind of duty"), calls **F-2** not executable in either arm, and calls **F-6**
  "close, and B0's weakness is real … **But the synthesis is worse on founder legibility**". A comparator
  section that concedes the incumbent loses a fixture is not a strawman.
- **An entailed win is refused scoring, by name.** F-3: "**This is entailed by the frozen boundaries and
  must not be scored as an empirical result** [FAL-13]." This is the protocol's "nothing gets credit for
  existing" applied against the winner, in the winner's own record.
- **A claimed win is discounted in the sentence that claims it.** F-4: "The synthesis wins, structurally —
  **and the win is worth less than it looks** … a same-family checker's measured ceiling is 28.6% F1", with
  R7's own sentence quoted against the result.
- **The synthesis states its own minimum against itself.** "The smallest thing that is not B0 is **(a)** a
  record a step is *forced* to read … and **(b)** a credential the model side never holds. Those are layers 2
  and 1. **Layers 3, 4 and 5 owe their own separate justification**, and each carries its own falsifier."
  Three of the five layers are told to earn their place.
- **The specification carries the reduction commitment rather than leaving it in the record.** `05` §9: "S0
  and simpler deterministic/manual paths remain comparison baselines; added coordination, deep delegation or
  large skill libraries **must be removed** when equivalent useful outcomes require less total burden without
  them." `07` §7 on the S0 comparator: "Compare actual outcomes and labor, and **allow S0 to win**", and a
  cheaper human-only route "is reported as a differing trust/guarantee profile rather than silently equated."

### Findings

**F6C-17 · (a) · Two reopen conditions turn on "a small number", and nothing says what that is.**
*Passage.* `02` §9 foundation 2: "**More than a small number** of holders declared as founder exceptions, or
**more than a small number** of capabilities whose class floor was narrowed for throughput, means the class
rule is being routed around rather than applied." Foundation 6: "a **small stable set** of worker shapes
recurs over a month".
*Counterexample.* Every other criterion in the same document is quantified: >90% of admitted actions over a
fixed window; one month; two consecutive quarterly runs; five attributable trials, chance-corrected. W13
requires "a named problem, a measurable worsening, and a falsifier". Foundation 2 has the problem and no
measurable worsening — no reading of the holder register can settle whether it fired — so the condition is a
preference wearing the form of an observation. Foundation 6 inherits the phrase from the layer-4 removal
criterion, where it is equally unquantified, and that one is load-bearing: it is the pre-declared control
against this design's own thesis.
*Required contract.* A count or fraction with a window, in the form the sibling criteria already use, or the
value marked **UNKNOWN — founder parameter, no default** with a packet id, exactly as MD-08 and R-X25 are.
*Confidence.* High.

**F6C-18 · (b) · FAL-01 does not reach the chapter that carries the comparator.**
*Passage.* Selection record §8.3: B0 "does **not** have the lowest plausible consumption of scarce capacity",
on four documented provider mechanisms — full conversation resent per request and per tool batch, cache miss
after a break longer than the lifetime, compaction being itself a large request, idle check-ins each sending
full context. "B0 minimises launches; it does not minimise the weekly bucket, and the weekly bucket binds."
*Counterexample, computed.* "FAL-01", "FAL-02", "full conversation" and "idle check-in" occur **zero times**
in any `planning/specification/*.md` chapter. `07` §7, which holds the S1 / S1-VPS / S0 comparator, prices
money only and makes no capacity comparison in either direction.
*Why this is (b) and not worse.* `07` §7 claims no capacity advantage for S1, so the comparator is not made
dishonest by the omission; it closes with "allow S0 to win". What is unverified is propagation: a reader
comparing S0 on capacity inside the specification has no warning that the intuitive answer is falsified by a
primary source the round already holds.
*Confidence.* High.

**F6C-19 · (b) · W13 was judged once, by the lane that also judged W4, and returned sufficient for all
five.**
*Computed from the consolidation's own matrix.* W13 carries **0 insufficient** across M1–M5, as do W3, W5,
W7, W9, W11, W14 and W15. Coverage was disjoint by design — AE took W4 and W13 — and §A records against
itself, as a DIRECT OBSERVATION, that "**No dimension received a second, independent judgment.** Each of
W1…W15 rests on one reviewer of one model family."
*Related, and recorded because W13's question is whether the comparison can be trusted.* The matrix reads
`S` for M1 on W7 while **two (d)-class findings**, AT-M1-02 and AT-M1-03, are recorded against M1 on W7; and
`S²` — "sufficient (strongest in the round)" — for M3 on W7 while AT-M3-03, a (d), is recorded against M3 on
W2/W7. A dimension verdict of sufficient on a candidate carrying a (d) on that dimension is a reporting
inconsistency in the consolidation. It is **not** a defect in the subject, and it does not change the
amendment's disposition, which lists AT-M3-03 among its five open (d)s.
*Confidence.* High for the counts; the inconsistency reading is mine.

### On "at least four materially different models"

I do **not** judge this clause met or unmet: the candidates' texts are outside my permitted read set. What I
can see supports material spread without settling it. The insufficient counts differ — M1 4 · M2 3 · M3 4 ·
M4 6 · M5 5. M3 is recorded as "**exempt structurally**" from uniform gap G-02 and as having no
model-to-model delegation at all, and §8.1 notes that "the two candidates in the round with **no
model-to-model channel at all** carried **zero** propagation findings, which is the one divide in that round
carrying independent information." Against that, §G records **fifteen** gaps landing on all five, with AC's
own reading: "Uniformity across five blind-formed candidates is evidence about the specification's
visibility at this layer, not about five authors." Recorded in *not checked*.

### Why sufficient

W13 fails "if the comparator was deprived of its legitimate strengths, or if at least four materially
different models were not genuinely carried." The first is clearly not triggered — B0 keeps every strength
§6 grants it, takes one fixture outright, draws a second, and is declared the live winner on two of three
conjuncts today; an entailed win is refused scoring by name and a claimed win is discounted in its own
sentence. The second I cannot judge, and say so rather than resolve it in the subject's favour. F6C-17 is the
one place a stated trigger is not an observation; F6C-18 and F6C-19 are propagation and round-method notes.

---

## Consolidation findings on my dimensions: answered, or left silent

| Finding | Disposition in the subject |
|---|---|
| **AE-M4-01** holder veto | **Answered and enforced.** `guard.holder.no_veto`, bound, pinned on both conjuncts, fixtured both ways |
| **AE-M4-03 / AE-M3-01** return-to-pool conditional on a decline; cross-class release | **Answered, partially enforced.** R-X24 and `guard.reservation.lapse_independent_of_consent` — on one of three release edges, and nothing fires on the lapse point (F6C-03) |
| **AE-M1-03 / M2-04 / M3-04 / M4-02 · X20** metered path | **Answered.** All four elements in `07` §5, observation point backed by required `BillingProfile` fields, disclosed as observation not prevention |
| **G-07** cache-lifetime collapse | **Answered in prose, unbound** (F6C-06) |
| **G-01 / AE-M1-02 / AE-M5-03** non-model performer past exhaustion | **Answered in prose, no field, no record, no predicate** (F6C-01, F6C-02) |
| **AE-M2-03** evaluation-capacity row | **Answered against a table that does not exist** (F6C-05) |
| **AE-M3-03** per-step cacheless launch charged to nothing | **Answered in prose; the instrument is absent from the contracts** (F6C-04) |
| **AE-M1-04 / M2-06 / M4-04** attempt ceiling | **Answered in prose; field on the wrong record, optional, in no predicate** (F6C-10) |
| **AE-M2-05** progress predicate on the lane | **Silent in the contracts.** `progress_predicate` occurs zero times; the rule is in `05` §6 prose only |
| **G-04** X14 owner | **Not closed, and acknowledged as not closed** (F6C-07) |
| **G-08 / AS-X-04** fan-out bounded only by budget | **Answered and enforced.** `guard.delegation.width_ceiling_over_distinct_read_sets` over distinct read sets, bound, pinned, fixtured |
| **G-06 / AX-M1-02** what a false entry already influenced | **Answered in the wrong direction** (F6C-15) |
| **AT-M1-02** critical fields | **Claimed closed; prose rule, optional field, no predicate** (F6C-13) |
| **AT-M1-03** checkpoint trigger | **Genuinely closed**, by taking the required contract's second option explicitly and naming its cost |
| **AT-M1-04** release locus stated two ways | **Genuinely closed.** R-X01, one sentence, `05` §1 |
| **AT-M3-01 / M3-02 / M5-02** renames and dangling refs | **Genuinely closed.** `aliases.json`, a literal floor, a validator, a stated refusal |
| **AT-M3-03** halt or reverse a shed | **Open (d), correctly routed** to MD-07 / Q-020 |
| **AE-M2-01** lane sizes and lapse point | **Open (d), correctly routed** to MD-08 / Q-021 |
| **AT-M3-04 / M3-05** adaptive envelope author; one collapse parameter | **Answered in prose** (R-X04, R-X05); no registry field found for either |
| **AT-M4-02** total rank over routing classes | **Answered.** `guard.class.no_total_rank` and `guard.class.reached_set_gates_all`, bound — but **unfixtured** (F6C-16) |
| **AT-M1-05** W9 in-flight provider change | **Recorded as agreement**, and I reach the same conclusion independently |
| **G-13** FAL-02 overstated by all five | **Answered.** Restated at reduced strength in §8.3 per R-G13 |
| **G-15** every self-audit blind outside protocol §5's frame | **Answered, unusually well.** `05` §13 walks the ten individually and then names four things the frame excludes, including "a decision that is taken but wrong" and "an error the whole round shares" |

---

## Negative-control results

| Control | Result |
|---|---|
| **§4.7** tokens counted, capacity not | **Passes, and discriminates.** No capacity figure is token-denominated; the one token measure is a skill-selection instrument reported beside accepted outcomes, which the paired benign case requires not be caught |
| **§4.1** rename-only candidate | **Passes, with a mechanism.** `aliases.json` refuses a candidate-era name as a record name; the paired benign case — a genuine change reusing existing vocabulary — is the six new fields on two existing records, which pass |
| **§4.10** a fixture authored after a candidate's result | **Not violated on my dimensions.** The six fixtures are frozen in the protocol at `26af5d5`; AM-01 is dated, states the round state ("no candidate exists"), and adds a measurement without changing what passes; the 17 r16 pairs carry `05` §9's own adverse rows, which are the amendment's specified tests rather than the protocol's frozen six |
| **A control on my own instrument** | **My first computation was wrong and I caught it by mutation.** I initially reported all 30 guards as referenced by nothing. That was a false positive of my own making: a regex built as `g.replace(/\./g,"\\\\.")` inside a double-quoted shell heredoc compiled to a pattern matching a literal backslash, so every count was 0. Recomputed through the `op: "call"` graph, **all 30 guards are bound to at least one edge**, and four are bound to two. The protocol tells reviewers to mutate an input and confirm a green result can fail; the same obligation runs on the reviewer's own tooling, and mine failed first. Every other count in this report was re-derived after that correction |

---

## Not checked

- **The candidates' §11 and §12**, the selection record outside §8 and §11, other Step 6 reviewers' scratch,
  `docs/08-agents_work/`, `.worktrees/`, `state.json`, `history.jsonl`, `PLANNING-REPORT.md` — barred by the
  brief, and none opened.
- **Whether four materially different models were genuinely carried** (W13's second failure clause). The
  candidates are outside my read set; I report what the consolidation's matrix and uniform gaps show and
  leave the clause unjudged.
- **No tool was executed.** `validate_contracts.py`, `run_negative_fixtures.py` and `guard_distinctness.py`
  were not run, and I make no claim about whether they pass. Every count here is computed by me directly from
  the frozen JSON.
- **`07` §7's money arithmetic.** The tariffs are dated direct observations and the quantities are labelled
  ASSUMPTION; I did not re-derive $435.70, €215.84 or €129.84.
- **The 33-of-46 presence-only criteria** as a set. I judged one instance — the one where a rule's own words
  state a comparison (F6C-11) — and did not evaluate the other 32.
- **W1, W2, W3, W5, W6, W8, W10, W11, W12, W14, W15.** Outside this brief and not assessed, including where
  a finding above touches them (F6C-15 also bears on W3 and W10).

---

## Standing caveat

No runtime exists. Every "sufficient", "closed", "answered" and "landed" above is about **specified behaviour
checked offline**, by a reviewer of the **same model family as every author**, with **procedural
independence only**: separate context, nothing written in Steps 1–5, and no producer self-assessment,
session file or lane worktree read. Independence of influence is what I can claim; **independence of error is
disclaimed**, and that is the same disclaimer the subject makes about itself in `05` §13 item (4). Nothing
here establishes runtime conformance, deployment readiness, actual fulfilment or business value, and nothing
here lifts the founder's hold on building. I record no aggregate score and no recommendation.
