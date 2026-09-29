> Archival provenance — 2026-09-13: Step 4 attack review, **technical and architectural** perspective (W2, W7, W8, W9), on the five F2 candidates at frozen subject `c6d62a3`. Preserved verbatim from the reviewer engine's report file. The reviewer authored nothing in the round, was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, other reviewers' scratch and every prior F2 review, read each candidate's §11/§12 only after forming its own missing-decision list, and resolved every claimed record against `contracts/record-registry.json` (173 records). Same model family as every author; independence is procedural only. Archival is not acceptance.

# Technical / architectural attack on M1–M5 — F2 Step 4

## Provenance

**Subject SHA:** `c6d62a395849f27cbfa227c1248823f0fe9dbe4d`, worktree
`/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`. Read-only; the root was not edited.

**Dimensions:** W2 (coherence with the fixed boundaries and the existing machine contracts), W7 (reliability
and durable work state), W8 (buildability), W9 (changeability), plus internal consistency. Protocol applied:
`planning/F2/00-acceptance-protocol.md` frozen at `26af5d5`, plus AM-01. (d)-class per protocol §5; only (d)
blocks.

**Read:** the protocol whole and its amendments; all five candidates in full, §§1–10 first and §11–§12 last
per the brief; `planning/02-architecture-selection.md` §3–§4; `planning/specification/02-authority-recovery.md`
§4–§5; `05-work-agents-skills.md` §3 and §10; `07-integrations-capacity.md` §5–§6;
`planning/specification/contracts/record-registry.json` (queried, not read whole — 3.2 MB, 173 records);
`planning/F2/00-position-ledger.md` (bounded existence check on CP-nn citations only).

**Not read:** `docs/08-agents_work/`, `.worktrees/`, `docs/vision-system/state.json`, `history.jsonl`,
`PLANNING-REPORT.md`, anything under `planning/F2/reviews/`, any other reviewer's scratch directory,
`00-thesis-claims.*`, and any research lane report. No candidate's §11 or §12 was read until my own (d) list
for that candidate was written.

**Independence — disclosed, not laundered.** I authored nothing in this round and share one model family with
every author and every other reviewer. Independence here is **procedural only**: separate context, no
producer self-assessment read ahead of my own list, no lane worktree, no session file. This is not an
independent panel and nothing below should be read as one. Where a candidate's register says something is
reused or already exists, I resolved it against the registry rather than trusting it; those computations are
shown.

**Standing caveat.** No runtime exists. Every judgment below is about **specified behaviour checked offline**.
Nothing here establishes runtime conformance, deployment readiness or business value.

---
## 0. Computations performed (T3 method)

All run against `planning/specification/contracts/record-registry.json`, 173 records.

| Check | Result |
|---|---|
| M1's 13 "NEW" records | 12 absent (correct). **`HandoffAcceptance` PRESENT** — M1 declares as new a record that exists |
| M1's "reused unchanged" list | all present except `ConsequenceVector`, which is a **type** on `Grant.consequence_bounds` (`02-auth` §4), not a record. Harmless imprecision |
| M2's 3 new records | all absent (correct). No collisions |
| M3's 11 primitives | 9 absent; 4 of the 9 are existing records under new names (below) |
| M4's 3 new records | all absent (correct). M4's "renames nothing" holds |
| M5's 11 entry kinds | `Constraint` and `Obligation` PRESENT; 6 more are existing records renamed (below) |
| Records referencing `AgentTemplate` | **52** others |
| Records referencing `AgentInstance` | **50** others |
| M2 §8 counts: 26 no-charter / 5 bold primary / 15 remainder | **all three confirmed** against M2's own table |
| M4 §8: nine holders H1–H9 | **all nine appear** in the table |
| CP-nn citations (24 sampled) | **zero resolve in `specification/`**; all resolve in `planning/F2/00-position-ledger.md`. The 10 I opened carry the meanings the candidates attribute |
| Spec citations sampled | `SkillSelection.no_match`/`budget_exhausted`, `Project.acceptance-pending`, `Mission.retired-with-residuals`, run/step lifecycles, "only C02 advances the cursor", the C0–C5 table, one-child-layer depth, CP1 shares — **all resolve exactly** |

**Renamed-record map, computed:**

| M3 primitive | Existing registry record | M5 entry kind | Existing registry record |
|---|---|---|---|
| `WorkRecord` | `WorkOrder` | `Fact` | `Observation` |
| `Procedure` | `WorkflowDefinition` | `Decision` | `DecisionRecord` |
| `Step` | `StepExecution` | `Question` | `KnowledgeQuestion` |
| `Journal` | `DomainEvent` | `Contradiction` | `ContradictionSet` |
| | | `Assignment` | `ResponsibilityAssignment` |
| | | `CapacityState` | `CapacityObservation` |

---

## 1. M1 — capability-differentiated ephemeral

**W2 sufficient · W7 sufficient · W8 sufficient with reservations · W9 sufficient**

M1 is the only candidate that uses registry vocabulary throughout and tables what it reuses against what it
changes. That is why its one collision is worth naming precisely.

**AT-M1-01 · (d) · `HandoffAcceptance` is declared NEW and already exists, with a different owner, a
different state set and a human-only command.**
*Passage:* M1 §2.2, "**NEW · `HandoffAcceptance`** … `interval_state ∈ {declared_done, in_acceptance,
accepted, rejected}` … C02 reports it as one."
*Counterexample, computed from the registry:* `HandoffAcceptance` exists with `owner_component: "S1-C07"`,
`lifecycle.phases: [proposed, accepted, contested, superseded]`,
`allowed_command_ids: ["human.handoff.accept", "kernel.record.transition"]`, and an `external_fact_rule`
reading *"The actual incoming person independently accepts exact duties after access, competence and
continuity checks."* It is a **human succession** record owned by C07. M1's is a **machine-to-machine** work
handoff written by C02. Four of M1's four states differ from the registry's except `accepted`.
*Failure:* an implementer holding M1 and the registry must decide which definition governs. Under the
registry's, every executor handoff requires `human.handoff.accept` — i.e. a person per handoff, which
destroys M1's F-5 continuation story, since M1 holds the continuation boundary to handoff discipline.
*Required contract:* either a distinct record name, or an explicit registry amendment naming the owner, the
state set and which command families may drive it.
*Confidence:* high. *Not caught by M1 §11*, which lists item 2 as "**Decided.** `HandoffAcceptance`."

**AT-M1-02 · (d) · The set of "critical fields" a resumed attempt must re-derive is never defined and has no
author.**
*Passage:* §4.5 "What it must re-derive: **every critical field**, by direct probe"; §7 F-5 step 4 repeats it.
*Counterexample:* two implementers resolve "critical" differently — all `ConstraintSet` members, all fields
with a `FieldAuthority`, or only those the acceptance criteria reference. Both cost and safety turn entirely
on that set, and after a multi-day gap the difference is between a cheap resume and a full re-derivation.
*Required contract:* a named authority that marks a field critical, and the marking recorded on the
`WorkOrder` or the `FieldAuthority` rather than decided at resume time.
*§11 item 4 claims this "Decided".* It decides the **trust** half (Continuation + manifest; never a
provider-resumed session, a pre-gap verdict, or a summary) and leaves the **re-derive** half open. **False
closure, partial.**

**AT-M1-03 · (d) · The checkpoint trigger is unspecified, and M1's own capacity finding says it cannot be
computed.**
*Passage:* §7 F-5 step 2, "C02 prepares a `Continuation` under its **reserved closing allowance**"; against
§7 F-2 step 2, "**The denominator does not exist and M1 says so** … every capacity figure available to this
round is a ratio between arms and never a fraction of the week."
*Counterexample:* reserving a closing allowance requires either a remaining-allowance figure or an observable
approach signal. M1 asserts neither exists. So the implementer invents the trigger — elapsed fraction of the
360 s window, a provider throttle response, a fixed step count — and that choice decides whether a
continuation is ever written before the cut.
*Required contract:* a named, observable close-out predicate, or an explicit statement that the system
checkpoints on every step boundary and carries the cost.
*Not addressed in §11.*

**AT-M1-04 · (a) · The release locus for F-3's outward effect is stated two ways.**
*Passage:* §7 F-3 step 2 creates a third executor holding the outbound-send scope; §8 CAP-17 states "**C04
alone releases the money**", and §3.4 puts the intersection check at release.
*Counterexample:* if C04 releases, the third executor needs no send grant and reason R3 does not create it;
if the executor releases, C04 is not the sole consequence authority. §2.2 is also silent on whether a
`ConsultationRequest` may carry an effect release — it says only that it "Returns an `AttemptReport`, never
ownership."
*Required contract:* one sentence stating that an executor's "scope" is a proposal right and C04 performs
every release, or the converse. *Repairable in place.*

**AT-M1-05 · (b) · W9's in-flight provider/model change is answered, by inheritance.** §11 item 9 routes to
`05` §3's migration rule; I confirmed that rule exists and covers pinning, step mapping, invalidated
acceptance and rollback. M1 adds that a model change invalidates `InstrumentCalibration`. **Agreement — the
finding I had drafted is withdrawn.**

**W8 reservation, computed.** M1 adds 13 records. Only `ExistenceJustification` and `FieldAuthority` carry
the full identity / lifecycle / writer / reader set. `ConstraintSet`, `ProjectionGrant`,
`ConsultationRequest`, `GrantDeliveryReceipt`, `ShedDecision` and `InstrumentCalibration` carry fields and a
rule but no lifecycle, no owner and no transitions. `HandoffAcceptance` carries transitions but no writer.
Against the registry's own schema — every entry there declares identity, owner_component, lifecycle,
transitions, authorization, retention — these are field lists, not contracts. That is a real authoring debt,
and M1 names the direction of it in §10 ("The record count is high and every record is a maintenance
obligation") without naming the gap.

**What landed.** The `ExistenceJustification` is the only mechanism in the round that makes negative control
4 checkable rather than arguable: a reason, the unit it predicates on, a test that can return false, the
alternative tried, and a removal criterion, refused if unfillable. `GrantDeliveryReceipt` is the only
response anywhere to R3 F59's measured asymmetry. Keep both whatever is selected.

---
## 2. M2 — chartered persistent

**W2 sufficient · W7 sufficient (inherited, and it says so) · W8 sufficient · W9 sufficient**

M2 has the smallest contract surface in the round — three records, none colliding — and the most complete
lifecycle table (§6.6's seven operations, each with authority, required evidence and a "may never" column).
It is also the only candidate that declares blocking (d)s against itself.

**AT-M2-01 · (a) · §8's narrowing claim is false for 6 of its 15 rows.**
*Passage:* §8, "The remaining **15** name a charter only for a narrowed remainder, **and the narrowing is
written in the cell**."
*Counterexample, computed from M2's own table:* CAP-35 (`ShedNegotiation` participant, all five), CAP-36
(`CT-DUTY`), CAP-41 (`CT-CONTINUITY`), CAP-43 (all five, through the charter sheet), CAP-44
(`CT-INSTRUMENT`) and CAP-45 (`reserved_lane`, all five) carry no narrowing. Four of those six say "all
five", which is the opposite of a narrowing.
*Required contract:* write the narrowing in those six cells or restate the claim as "9 of 15". The counts
themselves (26 / 5 / 15) are **correct** — I recomputed all three.
*Repairable in place. Low severity, but it is the sentence W11 leans on.*

**AT-M2-02 · (c), not (d) · Charter persistence is adopted against a spec clause requiring demonstrated
benefit, and M2 supplies the demonstration protocol rather than the demonstration.**
*Fixed text:* `02-architecture-selection.md` §3 — *"Persistent model identities require demonstrated benefit
over portable work records and temporary sessions. Existing roster names do not supply that justification."*
*M2's position:* §1 concedes "No source found in this round measures whether persistent identity improves any
outcome, and the two most-cited deployments refuse to support it."
*Why (c) and not a W2 breach:* a `Charter` is a record of a standing duty, not a model identity — its
`performer_binding` is ephemeral and R-1 forbids it producing anything. And §9.1's **fresh-holder arm** is a
complete (c)-class protocol: subject, two arms, `CT-INSTRUMENT`'s fixed pool neither arm may write, unit = a
duty case, five attributable trials, chance-corrected reporting, a two-consecutive-quarter stopping rule, and
an owner who is not the subject. That is protocol §5's (c) definition met in full.
*This is the best-specified removal test in the round and should be lifted whatever is selected.*

**AT-M2-03 · (d) · Suspension's "admissions narrow" has no quantum and no computing party.**
*Passage:* §6.6 Suspension row — "where none is reachable, **admissions in that duty class narrow** rather
than the duty going silently unheld."
*Counterexample:* narrow by what, decided by whom? Stop all admissions in the class, stop discretionary ones,
raise the deadline bar? Under F-6 (founder absent) this fires exactly when nobody can decide it, and the
implementer's default becomes the company's degradation policy.
*Required contract:* a named narrowing predicate and its owner, in the same table row as the suspension
trigger.
*§12 row 49 marks the whole seven-operation lifecycle — naming this clause explicitly — as "DESIGN PROPOSAL,
no evidence", which is honest about the evidence and silent about the missing decision. §11 does not list
it.*

**AT-M2-04 · (a) · The two-desk tie-break is undefined for incomparable predicates.**
*Passage:* §7 F-1 step 2 — "Where two desks match, the narrower scope holds and the other is a reader; the
tie is broken by **predicate specificity**, recorded, not by seniority."
*Counterexample:* `CT-DUTY` (a commitment outliving its case) and `CT-STANDING` (a data-rights duty) are not
ordered by specificity; a supplier deletion duty is squarely both, which is M2's own worked example. M2
records `custody_tie_break_reason` elsewhere and does not here.
*Required contract:* a terminal ordering, as `03`'s custody resolver already supplies for ownership.
*§12 row 46 marks this unevidenced; §11 does not carry it as open.*

**Agreement with M2's own §11.** Both self-declared blockers are real and I reached them independently in
weaker form. **(d-M2-1)** — whether a model may hold a desk carrying external standing — is correctly routed;
`02-architecture-selection.md` §3's "cannot create a professional by naming an endpoint" is the fixed text
behind it. **(d-M2-2)** — reserved lane size and lapse point — is correctly identified as undecidable here
given no published denominator. M2's refusal to pick a number rather than inventing one is the right call.

**False closures: none found.** M2's §11 is the most conservative of the five.

**What landed.** The **lapse rule** — reserved-but-unconsumed allowance is destroyed rather than banked, so a
reserve is priced as waste — is the only place in the round where a reservation is costed correctly for a
non-rolling window. The **monotonic-exposure check** (the `Charter` has no field a performance result can
write; diff the effective action set month 1 against month 12) is the only concrete mechanism against the
autonomy ratchet in any candidate. Both survive rejection of M2.

---

## 3. M3 — workflow-first, no agents

**W2 insufficient · W7 sufficient (strongest in the round) · W8 insufficient · W9 sufficient**

M3 is the strongest candidate on durable work state and on verification-as-a-record, and the weakest on
coherence with the existing contract registry — which it never queries.

**AT-M3-01 · (d) · Deleting `AgentTemplate` and `AgentInstance` leaves ~50 dangling registry references with
no migration.**
*Passage:* §9.1 table — "`AgentTemplate` as a versioned production recipe | **Deleted.** … | `AgentInstance`
bound to one WorkOrder | **Deleted.** The run is the binding", under the heading "**M3 is not a different
philosophy from S1.0; it is S1.0 with four mechanisms deleted.**"
*Counterexample, computed:* `AgentTemplate` is referenced by **52** other registry records and
`AgentInstance` by **50**, including `Case`, `ContextManifest`, `DecisionRecord`, `ConflictClaim`,
`AccountReconstruction`, `Claim`, `Defect`, `CausalEpisode` and `CapacityStudy`. §9.1's consequence column
names two losses (a per-template maintenance owner, instance-level evaluation) and no reference migration.
*Failure:* an implementer deleting two records must decide, ~50 times, whether each reference becomes a
`WorkflowRun` ref, a `Procedure` version ref, or is dropped. Each choice changes what a later reader of that
record can reconstruct — and CAP-44 ("the journal is the account … reproducible from the journal or it is a
defect") depends on exactly those reconstructions.
*Required contract:* a reference-migration table, or a statement that the two records are retained as
tombstones with their refs preserved.
*W9 note:* M3 supplies a migration rule for **procedures** with runs in flight (§6.4, R3 F40) and none for
the contract registry. The probe W9 asks and the migration M3 supplies are different objects.
*Not addressed in §11 or §12. Confidence: high — computed, not argued.*

**AT-M3-02 · (a) · Four of M3's eleven primitives are existing registry records under new names, with no
mapping.**
*Passage:* §2's primitive table introduces `WorkRecord`, `Procedure`, `Step` and `Journal` as if new.
*Counterexample, computed:* `WorkOrder`, `WorkflowDefinition`, `StepExecution` and `DomainEvent` already
exist, and M3 cites the very sections that define them (`05` §3 for the run/step lifecycles, R3 F24/F25 for
state-write-as-event). `WorkRecord`'s stated fields — outcome, acceptance owner, budget, deadlines — are
`WorkOrder`'s.
*Failure:* an implementer gets two names per record and no rule for which is canonical, in a package whose
whole enforcement story is that names resolve.
*§11's negative-control walk answers the renaming control at the **mechanism** layer ("M3 deletes mechanisms
rather than renaming them, and the deletion list in §9.1 is the test") and does not reach the **record**
layer, where renaming is exactly what happened. Partial false closure on control §4.1.*
*Required contract:* a four-row alias table, or adopt the registry names.

**AT-M3-03 · (d) · No authority can stop a pre-endorsed shed in the moment.**
*Passage:* §7 F-2 — "the scheduler sheds, executing a **capacity policy the founder endorsed in advance** …
**Nobody negotiates**", and M3's own concession, "M3's residual cost is real: a pre-endorsed order cannot
notice that this particular shed is catastrophic."
*Counterexample:* the stated mitigation is that "any shed of a record carrying a due obligation raises a
founder-return item **the same day**". That is notification, not authority — and under F-6 the founder is
absent for a week, so the notification lands in an empty inbox while the shed has already executed. M3's
comparison against M2 on this fixture ("a pre-endorsed, auditable order is faster and reviewable") answers
speed and auditability, not authority.
*Required contract:* a named party who may halt or reverse a shed inside the window, with its own reserved
capacity — or an explicit statement that no such party exists and shedding is irreversible within the period.
*Not addressed in §11. This is the fixture where M2's A-4 objection bites hardest, and M3 answers the
objection it was given rather than this one.*

**AT-M3-04 · (a) · The adaptive step's envelope has no named author and no default.**
*Passage:* §3 — "The engine validates the proposal against a declared envelope: allowed step kinds, allowed
read sets, allowed effect classes (default: none), allowed budget."
*Counterexample:* who authors an envelope, and what is `unclassified-work/v1`'s? That procedure is M3's whole
answer to F-1, and its envelope decides how much of unknown work proceeds without a person.
*Required contract:* envelope authorship assigned to the capability owner at procedure admission, and
`unclassified-work/v1`'s envelope written out. *Repairable in place.*

**AT-M3-05 · (a) · The collapse rule's N is unnamed and unowned.**
*Passage:* §6.5 — "A procedure executed **N times** with zero branch variation and zero validator failures is
a candidate for collapse."
*§11 item 5 names the procedure-**retirement** window as unset and lists it among the open items; the
collapse N is a different number and is not carried.* *Repairable in place.*

**W7 — why this is the strongest.** One effect per `effect` step, so there is no "before the interrupt"
inside it; the three-phase journalled intend/release/observe protocol; `unknown_effect` as a first-class
terminal value with a named custodian and never an assumption either way; single-writer keyed journal with
the lease generation as the stated winner and the loser retained as evidence, never as result; and the honest
headline that **every** durable-execution engine guarantees control flow and not the external effect, so the
recovery story must be about effects. No other candidate states that limit that cleanly.

**What landed.** The **declared read set delivered and recorded by the loader** is the single strongest
verification property in the round: it makes "the checker did not read the producer's rationale" a manifest
fact instead of an assertion, and M3 is right that a design where an agent assembles its own context cannot
say it at all. That mechanism survives rejection of M3 and should be lifted into whatever is selected.

---
## 4. M4 — hybrid by consequence class

**W2 insufficient · W7 sufficient · W8 sufficient with reservations · W9 sufficient**

M4 binds to existing mechanisms more tightly than any other candidate and adds no parallel stack. Its two
defects are both in the one primitive everything else depends on, which M4 itself identifies as its
correlated single point of failure.

**AT-M4-01 · (d) · Whether an outward artifact "carries a promise" is not computable from any of the four
permitted inputs, and the whole outward-communication column depends on it.**
*Passage:* §7.3 — "the read is C0/C1, the record write C1, the send **C2** — and **C3** if it carries a
promise or moves money."
*Counterexample:* §2.2 admits exactly four input kinds, and forbids five sources by name, including "a tool's
self-description" and "command-text matching … it classifies a string the model wrote". A promise expressed
in drafted prose is model-authored text. The only join that could reach C3 is §2.2 item 3, "Creating an
obligation reaches C3" — but that fires on the effect's business keys joining an **open `Obligation`**, and
nothing in M4 is named that creates an `Obligation` record from drafted prose. §8 gives CAP-16 (customer
communication) a floor of **C2**, so the floor does not rescue it either; the acceptance cell says "H1 for
inbound; **P for any promise**", which presupposes the very detection that has no mechanism.
*Failure:* an outbound message whose text binds the company derives C2, is preparable by an E, and is
acceptable by an E-checker with a paired clean case. The person who was supposed to accept any promise never
sees it. This is the exact draft-versus-release distinction M4 was built around, failing on the side that
matters.
*Required contract:* either every outward artifact at CAP-13/14/15/16 floors at C3 (which M4 can do — floors
only raise, and it costs throughput), or a named non-model step that recognises an obligation in a draft and
writes the `Obligation` the join needs.
*Not addressed in §11 or §12. Confidence: high.*

**AT-M4-02 · (d), with W2 exposure · `max()` converts the six routing classes from predicates into a total
rank, which the fixed text forbids by name.**
*Passage:* §2.2 — "`derived_class = max(contributing_dimensions ∪ {floor})`, which makes computable the
existing rule that an action may satisfy several classes and must meet all their gates." §12 row 2 records
this as "Reuse C0–C5; add no seventh class | `02-auth` §4 · control 1 | **Specification**."
*Fixed text, quoted:* `02-authority-recovery.md` §4 — "**Routing classes are predicates, not a total
privilege rank**" (heading the C0–C5 table), and "An action may satisfy multiple classes and **must meet all
their gates**."
*Counterexample:* an action that is both C2 (it touches a customer relationship) and C3 (it moves money
against an entitlement) — a refund message, which is M4's own CAP-17 worked example. `max()` returns C3, and
§4.1's C3 row is applied. C3's "Must ACCEPT" cell reads "**P**, or **Q** where the act's standing requires
it". C2's cell reads "E-checker permitted … ; **H** where a relationship is created or touched". The H
requirement is in C2's row and **not** in C3's, so `max()` drops it. A conjunction over gates would keep both;
a maximum over a rank cannot.
*Why this is not merely cosmetic:* §4.1 asserts "It is monotone: as class rises the admissible set shrinks
and the acceptor moves rightward." That is asserted, not demonstrated, and the C2→C3 pair above is a
counterexample to it in the ACCEPT column. The May-PREPARE column is also non-monotone: C3 admits `Q` where
C2 does not.
*Required contract:* keep the derivation as a **set** of reached classes and apply every reached row's gates,
or prove the table monotone and state the proof. The record already has the field —
`contributing_dimensions` carries `class_reached` per dimension — so the set is computed and then discarded.
*Dissent preserved:* whether this rises to "a fixed boundary changed without a decision packet", which
protocol §8 makes blocking on W2, is genuinely arguable. The classes are reused verbatim and no seventh is
added, which is what M4 claims; what changed is how an action satisfying several of them is gated. I record
the passage conflict as established and the severity as contested, and do not resolve it.

**AT-M4-03 · (a) · `H` appears as a preparing structure while §2.3 says H's performer is an E.**
*Passage:* §4.1 gives "May PREPARE: W · E · **H**" at C2 and C3; §2.3 says of H, "Its performer is an **E**
instantiated per contact", and "May never … Release an effect."
*Counterexample:* if H acts only through an E, listing H beside E in the same column is a category error, and
the open question is whether an E instantiated under H inherits H's `reserved_capacity_ref` and
`intake_address`. That inheritance is exactly what F-2 turns on — "only its holder may shed it" — so an
implementer must invent it.
*Required contract:* one sentence stating that "H prepares" means "an E instantiated under H's mandate
prepares, carrying H's reservation ref and address, and nothing else of H's". *Repairable in place.*

**AT-M4-04 · (a) · No terminal holder for a C3 duty class that maps to none of the nine.**
*Passage:* §7.1 — "at C3 and above **the terminal element must be a standing holder with a reachable
address**, not a rule that produces a custodian when asked."
*Counterexample:* the nine holders are derived by applying §2.5's conjunction to the 46 contracts (§12 row 19
marks the specific nine as resting on no evidence). A C3 duty arising outside all nine — F-1's own case
before H4 is identified — has no terminal element, and the ordered resolver's fallback is a rule, which this
sentence forbids. *Repairable in place.*

**Agreement with M4's §11.** M4's second open item is correct and correctly classed: "composition across
unjoined records … **an implementer meeting an uncaught composition would be inventing policy**" is the (d)
definition, stated by the candidate against itself. §10 repeats it as "M4's sharpest weakness and it is
stated rather than mitigated". I reached the same place and have nothing to add.

**W8 reservation.** `ConsequenceDerivation` and `StandingHolder` both carry explicit payload schemas, which
is more than most new records in this round get. The buildability gap is not the schema; it is AT-M4-01,
which leaves the derivation function's hardest input undefined.

**What landed.** **Recomputing the class inside the ordered release transaction, on the frozen bytes, with a
mismatch that parks and never resolves downward** is the cleanest application of R4 F1 in the round, and it
binds to machinery `02-authority-recovery.md` §5 already specifies rather than adding any. Keep it. The
§9.1 one-action-two-classes anti-renaming test is also the sharpest negative-control test any candidate
offers against itself, and M4 correctly marks it (§12 row 65) as resting on no evidence.

---

## 5. M5 — subscription-activated capabilities around a shared record

**W2 insufficient · W7 sufficient · W8 insufficient · W9 sufficient**

M5's split of control into unstoppable arming plus a five-verb admission authority is a genuinely different
observable, and its answer to negative control §4.2 is the best in the round. Its contract layer is where it
falls down, and it contains one self-contradiction in a load-bearing rule.

**AT-M5-01 · (d) · M5 adds a second writer to the existing `Constraint` record and does not say it is
changing anything.**
*Passage:* §2.1's entry-kind table — "| `Constraint` | … | **C01 for endorsed constraints;
`constraint-discrimination` for document-derived ones**, only after its discriminator resolves |", under a
preamble reading "Fixed boundaries are preserved; **this candidate reopens none**."
*Counterexample, computed:* the registry's `Constraint` carries `owner_component: "S1-C01"` and
`authorization.write: "only named owner through admitted command/edge; actor authenticated from transport"`,
with lifecycle `proposed → endorsed → superseded → withdrawn → restricted`. `constraint-discrimination` is a
standing interest — a machine activation — and M5 grants it write access to a record the kernel reserves to
C01.
*Failure:* an implementer must decide whether the interest writes `Constraint` directly or writes a
`proposed` revision that C01 endorses. The first makes a model-derived reading of a counterparty document
into an endorsed company constraint without a C01 act; the second is compatible with the registry and is
probably what M5 means, since §7 F-1 step 4 says "**Only then is the Constraint accepted**". The text does
not say it.
*Required contract:* state that the interest may only write a `proposed` revision, and that the
`proposed → endorsed` transition stays C01's. That is a one-line repair and it removes the finding.
*Not addressed in §11 or §12.*

**AT-M5-02 · (a) · Six of the eleven entry kinds are existing registry records renamed, with no mapping
table.** Computed: `Fact`/`Observation`, `Decision`/`DecisionRecord`, `Question`/`KnowledgeQuestion`,
`Contradiction`/`ContradictionSet`, `Assignment`/`ResponsibilityAssignment`,
`CapacityState`/`CapacityObservation`. M5 cites `06` §3 and `02` §3 — the documents defining them. Same
failure shape as AT-M3-02: two names per record and no canonical rule. *Repairable in place with an alias
table.*

**AT-M5-03 · (d) · The only named detector for M5's acknowledged semantic-conflict gap is forbidden by M5's
own load-bearing rule.**
*Passage:* §3.3 rule 4 — "Semantic conflict with no shared key — two accepted artifacts that together promise
something neither promised alone — is **not detectable at activation time**. It is detected by a **merge
interest that arms on exactly that pattern.**" Against §2.2's hard rule — "A precondition is evaluated by
deterministic code over typed fields. **No precondition may invoke a model.**"
*Counterexample:* "two artifacts that together promise something neither promised alone" is a semantic
predicate over artifact content. It is not expressible as a conjunction of typed predicates over entry
fields, which is what §2.2 requires of every precondition without exception. So either the merge interest
cannot exist, or the hard rule has an unstated exception — and the hard rule is the one M5's §1 names as the
thing that could disqualify the candidate ("**no arming condition may call a model**"), and §12 row 11 records
as a decision on source claim.
*Failure:* an implementer builds a merge interest with a model in its precondition, which is the single
prohibition M5's capacity argument rests on (arming is free **because** preconditions are deterministic; §7
F-2 states that relaxing it for one precondition class makes M5 "the most expensive candidate here").
*Required contract:* either name the typed proxy the merge interest actually arms on — e.g. two accepted
artifacts sharing a counterparty within a window, which **is** typed and is a coarse over-approximation — or
withdraw the merge interest and record the gap as undetected.
*Not addressed in §11, which lists the semantic-conflict gap nowhere, or §12.*

**AT-M5-04 · (a) · No rule for custody landing on the Admission Authority's own identity.**
*Passage:* §3.2's prohibition table — "| Accept work it admitted | The `AcceptanceState` writer is the named
acceptance owner; **an activation's admitter is excluded from that role** |" — against §7 F-1 step 5, where
`unowned-duty` runs the ordered resolver deterministically and "**can never be retired**".
*Counterexample:* the resolver's terminal element is a standing custodian, and M5's §11 open item 1 concedes
that custodian is unnamed. If the resolver's output is the Authority's identity, the prohibition and the
resolver contradict, and nothing says which yields. *Repairable in place.*

**Agreement with M5's §11.** Both declared open items are real. Item 1 (the terminal standing custodian is
unnamed, and an implementer choosing between "refuse the class" and "default to the founder" is choosing the
system's meaning) is correctly classed (d) and correctly routed. Item 2 (whether a read-only trial renews
automatically) is a genuine fork and M5 is right that both branches are defensible.

**§12's self-count is accurate.** M5 declares eight evidence-free design choices (#12, #14, #17, #19, #45,
#55, #56, #57); I confirmed that count and that each row is marked. M2 declares ten (rows 44–53); confirmed.
M4 declares six; confirmed against its own rows 6, 18, 19, 30, 65, 66 — a `grep` for "no evidence" returns 8
hits, of which 2 are the ledger header and the summary sentence.

**What landed.** **Arming as a computed, unstoppable set** is the only mechanism in the round that makes a
deferral a *visible state with a deadline* rather than an absence — under every other candidate, "deferred"
and "never noticed" are the same observable. M5 is also correct and unusually clear that this is what
distinguishes it from S1.0 rather than a new noun. Keep the mechanism.

---
## 6. My (d) list against each candidate's §11 — agreements, misses, false closures

My list per candidate was written before opening that candidate's §11, per the brief.

| Candidate | My (d) | Their §11 says | Verdict |
|---|---|---|---|
| M1 | AT-M1-01 `HandoffAcceptance` collision | item 2 "**Decided.** `HandoffAcceptance`" | **Miss.** They do not know the record exists |
| M1 | AT-M1-02 "critical field" set undefined | item 4 "**Decided** … Re-derive every critical field" | **False closure, partial.** Trust half decided; re-derive half open |
| M1 | AT-M1-03 checkpoint trigger vs no denominator | absent | **Miss** |
| M1 | AT-M1-04 release locus stated two ways | item 6 answers composition only | **Partial miss** |
| M1 | *(drafted)* skill retirement authority | item 5 "Decided … **Deferred, with an owner:** the capability maintainer, before the first skill retirement" | **Agreement — my draft finding withdrawn** |
| M1 | *(drafted)* W9 in-flight provider change | item 9 routes to `05` §3; I verified that rule exists | **Agreement — withdrawn** |
| M2 | AT-M2-01 narrowing claim false for 6 of 15 | absent | **Miss** (low severity) |
| M2 | AT-M2-03 suspension narrowing quantum | §12 row 49 marks unevidenced; §11 silent | **Partial miss** |
| M2 | AT-M2-04 two-desk tie-break | §12 row 46 marks unevidenced; §11 silent | **Partial miss** |
| M2 | *(drafted)* carried entries at a model change | item 9 "re-attested by decision probe before reuse under a new profile" | **Agreement — withdrawn** |
| M2 | — | **(d-M2-1)** model holding external standing · **(d-M2-2)** reserved lane size — both declared blocking | **Agreement.** Both real; I reached them in weaker form |
| M3 | AT-M3-01 ~50 dangling registry refs | absent from §11 and §12 | **Miss.** Computed, high confidence |
| M3 | AT-M3-02 four records renamed | negative-control walk answers renaming at the mechanism layer only | **Partial false closure** on control §4.1 |
| M3 | AT-M3-03 no authority halts a shed | §7 F-2 concedes the residual; §11 does not carry it | **Miss** |
| M3 | AT-M3-04 adaptive envelope authorship | absent | **Miss** (repairable) |
| M3 | AT-M3-05 collapse N | §11 names the retirement **window**, not N | **Partial miss** |
| M4 | AT-M4-01 promise-detection not computable | absent | **Miss.** Sharpest finding against M4 |
| M4 | AT-M4-02 `max()` vs "predicates, not a rank" | §12 row 2 asserts conformance as "Specification" | **False closure** |
| M4 | AT-M4-03 H as a preparing structure | absent | **Miss** (repairable) |
| M4 | AT-M4-04 terminal holder outside the nine | absent | **Miss** (repairable) |
| M4 | *(drafted, softened)* composition across unjoined records | declared open: "an implementer … would be inventing policy" | **Agreement.** M4 classes it correctly against itself |
| M5 | AT-M5-01 second writer on `Constraint` | absent | **Miss** (one-line repair available) |
| M5 | AT-M5-02 six records renamed | absent | **Miss** |
| M5 | AT-M5-03 merge interest forbidden by the hard rule | absent | **Miss.** Sharpest finding against M5 |
| M5 | AT-M5-04 custody landing on the Authority | absent | **Miss** (repairable) |
| M5 | — | item 1 terminal custodian unnamed · item 2 trial auto-renewal | **Agreement.** Both real and routed |

**Pattern.** Every candidate's §11 is strong on the ten examples protocol §5 enumerates and blind in the same
place: **none of the five queried the contract registry.** Four of my nine (d)-class findings
(AT-M1-01, AT-M3-01, AT-M5-01, and AT-M3-02/AT-M5-02 as their (a)-class companions) exist only because the
registry was resolved rather than trusted. That is the "compute rather than trust" instruction earning its
place, and it is a finding about the round's method rather than about any one author.

**Blocking count, by my reading** — mine plus the candidate's own, counted separately:

| Candidate | (d) I raised | (d) the candidate declares against itself | Total |
|---|---|---|---|
| M1 | 3 — AT-M1-01/02/03 | 0 (its two open items, O-1 and O-2, it argues are not (d), and I agree) | **3** |
| M2 | 1 — AT-M2-03 | 2 — model holding external standing; reserved lane size | **3** |
| M3 | 2 — AT-M3-01, AT-M3-03 | 1 — may a model step accept a reversible internal class ("an implementer would invent it, which is the (d) shape") | **3** |
| M4 | 2 — AT-M4-01, AT-M4-02 (severity contested) | 1 — composition across unjoined records | **3** |
| M5 | 2 — AT-M5-01, AT-M5-03 | 2 — terminal standing custodian unnamed; trial auto-renewal | **4** |

No candidate is free of blockers, and every blocker I raised is repairable in place — none requires a
different architecture.

---

## 7. T6 — the renaming control (negative control §4.1), per candidate

For each: the concrete test that distinguishes the candidate from "S1.0 plus labels", whether it exists, and
whether it passes.

| Candidate | The distinguishing test | Exists? | Passes? |
|---|---|---|---|
| **M1** | Create an executor with no `ExistenceJustification` naming a unit and a test that can return false. The system must refuse | Yes, §4.1's six-reason table with per-reason units and tests | **Cannot be run — no runtime.** Specified well enough to run. The declared self-check (profile-convergence over a month) is the honest second half |
| **M2** | The **fresh-holder arm**: incumbent desk with its carried record against a freshly bound holder with an empty one, same template version, same window, on a pool neither may write | Yes, §9.1, with owner, unit, repetition and stopping rule | **Cannot be run.** Best-specified of the five |
| **M3** | §9.1's deletion list — four named S1.0 mechanisms must be absent | Yes, checkable by inspection | **Passes at the mechanism layer; fails at the record layer.** Four primitives are existing records renamed (AT-M3-02), which is the control's own failure shape |
| **M4** | §9.1's one-action-two-classes test: hold work, tools, skills and context fixed and change only the consequence class; four things must change and each must be observable in a record | Yes, and offered against itself | **Cannot be run.** §12 row 65 marks the test itself as resting on no evidence. Weakened by AT-M4-02, since the derivation discards the class set it computes |
| **M5** | The armed set exists whether or not anything is admitted, so a deferral and an absence are different observables (§3.1) | Yes | **Cannot be run.** Checkable in principle from the armed set alone |

**None of the five tests has been run, because no runtime exists.** Four of five are specified precisely
enough that running them would settle something. M3's is the only one I could evaluate by inspection, and it
returns a split result.

---

## 8. T7 — cross-candidate

### Mechanisms shared by three or more — load-bearing regardless of which candidate is selected

All nine below appear in **five of five**, in near-identical terms, usually citing one finding id in common.
That convergence is the most useful output of Step 3 and it is independent of the selection.

1. **One authority per field, with delivery narrowed per attempt — never one store everyone reads.**
   M1 §5.1 (`FieldAuthority`), M3 §5, M4 §5, M5 §2.1; M2 reaches it as single-writer-per-class (§5.5). All
   five reject the founder's sentence in its one-store reading and keep it in its one-authority reading.
2. **A typed constraint envelope on every boundary crossing, prose never substituting for a member.**
   M1 `ConstraintSet`, M2 typed `CarriedRecord` entries, M3 `ConstraintSet`, M4 `WorkManifest`, M5 typed
   `Constraint` entries. All five cite one measurement (R2 F-04). This is the single most concentrated
   dependency in the round: **one finding carries a primitive in all five candidates.**
3. **Deterministic oracle before any model checker; AM-01's paired clean case in the same session; union of
   findings never a vote or a mean; chance-corrected agreement beside any exact-match figure.** Five of five,
   almost verbatim.
4. **Authority re-checked at the moment of the effect — live epoch re-read for revocation, composite grant
   computed at release rather than at assignment, `derived ⊆ parent` checked by the enforcement point.**
   Five of five. M3 and M5 reach it by non-composition and per-call minting respectively; the invariant is
   identical.
5. **The idempotency record on the effect — never state in the shared record — is what detects an already
   released effect; an expired lease fences writes and does not prove no external effect.** Five of five.
6. **Refusal is a terminal state of the same record, with a reason and an owner who accepts the refusal was
   correct.** Five of five, all citing R5-14 and negative control 9.
7. **An escalation ladder may not end assigned-and-silent.** Five of five, all citing R5-12, with five
   different names for the same terminal state (`parked_awaiting_principal`, a named interim holder, a
   standing human alternate, a holder, `awaiting-principal`).
8. **The continuation across a launch boundary is held to the same discipline as a handoff.** Five of five,
   all from the 360-second window — see the caveat in §9 below.
9. **F-2 at 4× is not executable at CP1 and is reported as owed rather than passed.** Five of five in
   substance; M1, M2 and M4 say so explicitly and name negative control 10.

**Implication.** Whatever Step 5 selects, these nine are the specification. A synthesis that re-derives them
per candidate is doing work already done five times.

### What survives if the candidate is rejected — one mechanism each

- **M1 → `ExistenceJustification`.** A refusable record carrying a reason, the unit it predicates on, a test
  that can return false, the alternative tried, and a removal criterion. It is what makes negative control 4
  mechanical instead of rhetorical, and it is portable into any candidate that creates workers at all.
  (Second: `GrantDeliveryReceipt`, the only answer to a measured delivery asymmetry.)
- **M2 → the lapse rule.** Reserved-but-unconsumed allowance is destroyed at the window reset, not banked, so
  a reserve is priced as waste rather than as thrift. The only correct costing of a reservation under a
  non-rolling allowance anywhere in the round. (Second: the monotonic-exposure check.)
- **M3 → the declared read set, delivered and recorded by the loader.** It converts "the checker did not read
  the producer's rationale" from an assertion into a manifest fact. M3 is right that a design where a worker
  assembles its own context cannot make that claim at all.
- **M4 → recomputation of the consequence class inside the ordered release transaction, on the frozen bytes,
  parking on mismatch and never resolving downward.** Binds to machinery `02-authority-recovery.md` §5 already
  specifies and adds none.
- **M5 → arming as a computed, unstoppable set.** The only mechanism that makes a deferral a visible state
  with a deadline rather than an absence indistinguishable from an oversight.

---

## 9. Round-level notes

**FAL-02 is weaker than all five candidates state it.** Every candidate presents "B0's one long-context
session is **not purchasable**" as settled, and M3 converts it into a structural advantage ("M3 is the only
arrangement for which this costs nothing"). The cited source is `07-integrations-capacity.md` §5, and it
reads: "**DESIGN PROPOSAL.** Native job **default**: one launch, ≤360 s network window …". The same section,
two paragraphs earlier, states: "An independently admitted **persistent native profile** may use
`claude --resume [exact session ID]`". So the 360-second cap is a **default of one profile** with an admitted
persistent alternative, carried as a design proposal rather than a specification — not a contract ceiling.
This does not overturn any candidate's design, all of which are defensible under either reading, but the
strength of the claim should be reduced wherever Step 5 restates it. **Class (b): a documented mechanism
whose status is weaker than represented.** Five of five.

**Citation integrity.** The `CP-nn` identifiers all five candidates use as though they were specification
anchors resolve in `planning/F2/00-position-ledger.md`, a Step 0 artifact, and not in `specification/`. Of
the ten I opened, all ten carry the meaning the citing candidate attributes. Every direct specification
citation I sampled resolves exactly. So the citation layer is sound; the namespace is just not where a reader
would look. M3's §12 records the sharper version of this against the whole round: no lane registered a claim
through the ledger, seven of eight report the registration tool absent, and **not one quotation any candidate
relies on has been machine-verified against its source by a resolver.** I did not verify external quotations
either — they are outside the subject — and I flag that my own check covered only repo-internal resolution.

**One method observation.** The five §11 self-audits are uniformly strong against the ten examples protocol
§5 enumerates and uniformly blind to the contract registry. That is a predictable consequence of auditing
against a checklist: the checklist is the coverage. It is an argument for keeping the "compute rather than
trust" instruction in every future review brief, not an argument against any author here.

---

*Reviewer artifact. No aggregate score, no ranking, no recommendation. Nothing here selects, approves or
accepts a candidate. Single model family; procedural independence only.*
