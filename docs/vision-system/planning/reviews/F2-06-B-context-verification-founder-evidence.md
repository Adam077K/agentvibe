> Archival provenance — 2026-09-14: Step 6 independent review of the F2 re-specified layer, dimensions **W3 context integrity · W5 independence of verification · W12 founder attention and competence · W14 evidence quality of the round's own claims**, against the frozen F2 protocol (`26af5d5` + AM-01), on frozen subject `8f6c2c2` (git archive). Preserved verbatim from the reviewer engine's report file. The reviewer wrote nothing in Steps 1–5 and read no selection record or self-assessment; 28 citations were resolved by opening them. Same model family as every author; independence is procedural only, and the reviewer notes W14 judged by the family that produced the evidence is the W5 problem one level up. The validator produced no output in ~70 minutes in the reviewer's session, so contract results are structural, not validator runs. Archival is not acceptance.
>
> **Judgments:** W3 **insufficient** · W5 sufficient · W12 **insufficient** · W14 **insufficient**. **One (d)**: F6B-05 (the C3 acceptance-sampling rule or an explicit unsampleable statement with the per-week count is neither answered nor routed; the acceptance load is counted nowhere). AS-X-01 closed limb for limb with two wired guards; AM-01 binds.

# Step 6 independent review — W3, W5, W12, W14

**Subject.** Commit `8f6c2c2`, read from a frozen archive of `docs/vision-system` at
`$S/subject`. Protocol applied: `planning/F2/00-acceptance-protocol.md` as frozen 2026-09-13,
**plus amendment AM-01** (`00-acceptance-protocol-amendments.md`).

**Independence, in my own words.** I wrote nothing in Steps 1–5. I share one model family with
every author and every other reviewer of this round; independence here is **procedural only** —
separate context, and three standing bars I kept. I did not read `docs/08-agents_work/`,
`.worktrees/`, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, any candidate's §11/§12, or
another Step 6 reviewer's scratch. **I did not open `planning/F2/05-selection-record.*`**, which is
the producers' own account of this work; that bar has a cost recorded under "Not checked". I
computed rather than trusted where I could: I resolved joins myself, walked every guard body, and
ran a mutation-shaped control over the fixture suite. **W14 is judged by the same family that
produced the evidence, which is the W5 problem applied to me**; nothing in this review escapes it.

**Standing caveat.** No runtime exists. Every "sufficient" below is about **specified behaviour
checked offline** by a reviewer of one model family with procedural independence only. Nothing here
establishes runtime conformance, deployment readiness, actual fulfilment, or business value.

---

## Verdicts

| Dimension | Verdict |
|---|---|
| **W3** context integrity under summarization and handoff | **insufficient** |
| **W5** independence of verification under one model family | **sufficient** |
| **W12** founder attention and competence | **insufficient** |
| **W14** evidence quality of the round's own claims | **insufficient** |

No aggregate score. No recommendation. Findings class (a)/(b)/(c)/(d) per protocol §5; only (d)
blocks.

---

## W3 — context integrity under summarization and handoff — INSUFFICIENT

### What landed, and it is substantial

Every transfer point named in the brief is answered in prose with a named record: handoff
(`AcceptanceInterval`, `05` §5), consultation (class-keyed, consultation default at
external-disclosure and above, `05` §5), continuation after a capacity reset (`05` §3 migration
rule + `06` §2 native-session rule), compaction (`06` §2 `ContextTransformation` / `SummaryLoss`),
and the founder brief (`04` DELTA 1 + `05` §5). Three answers are better than their inputs:

- **The armed set is recomputed, never carried in a summary** (`05` §7). This is the sharpest
  answer in the chapter to protocol §5 example 4 — a stale pre-reset summary cannot cause an
  activation because the summary is not what activates.
- **`critical_fields` are marked by the capability owner at procedure admission, never by the
  resuming attempt** (`05` §3, R-D18). The party with an interest in the answer is excluded by
  construction.
- **The loader records what it delivered and the caller's claimed read list is not trusted**
  (`05` §3, `06` §2), and this is **not prose**: `guard.readset.delivered_equals_declared` is
  wired to `edge.ContextManifest.captured.admitted.v1` and its body is
  `nonempty_fields + subset + eq(count)`. Deleting the count conjunct — which is exactly what
  fixture `r16-02` does — leaves a guard that passes the declared set **plus** an extra delivered
  item. I confirmed that by reading the body, not by trusting the fixture.

**Guard layer, measured.** Thirty `guard.*` predicates are defined. **All thirty are called by at
least one edge; zero are unwired.** None has a body consisting only of presence checks — every one
carries at least one comparative conjunct (`subset`, `eq`, `neq`, `lt`, `lte`, `not`, `in`,
`unique`, `related_phases`). The decorative-declaration failure class the round documents in its own
repository (R3 F57, F60) is closed at this layer.

### F6B-01 · (a) · Two of the three manifest fields `06` §2 requires are required by nothing

*Passage.* `06` §2: "The manifest carries, for **each delivered item**, its **`trust_level`**; it
carries **`dropped_constraints[]`** — *which typed constraints were dropped*, which is the operative
reading of 'what was omitted' for a boundary crossing; and it carries **`assembled_for_class`**, the
reached class set the manifest was assembled for, so that a manifest built for a low-class action
cannot be silently reused for a higher-class one."

*Computed counterexample.* In `contracts/records.schema.json`, `ContextManifest.payload.required`
is the fifteen pre-existing fields. `item_trust_levels`, `dropped_constraints` and
`assembled_for_class` are all **optional properties**. In `contracts/predicate-registry.json`:

| Field | Guard references | Enforced? |
|---|---|---|
| `item_trust_levels` | 1 — `guard.trust.derived_is_floor_of_inputs` (`nonempty_fields`) | **yes** |
| `dropped_constraints` | **0** | no |
| `assembled_for_class` | **0** in the shipped registry | no |

`assembled_for_class` appears exactly once in the whole contracts tree outside the schema: inside
the **benign** fixture `r16-02-…-benign.json`, as an `add` patch that inserts a presence check and
is discarded when the run ends. A field whose only requirement lives in a fixture that mutates the
registry and throws the mutation away is not required.

Further, the guard that *does* fire on trust checks `derived_trust_level == minimum_input_trust_level`.
It never checks that `item_trust_levels` has one entry per delivered item —
`item_trust_levels` is `array<string>` with no length join to `captured_inputs` and no
`uniqueItems`. **`06` §2 says per-item "is the load-bearing part"**; the contract makes it an
unindexed list of strings.

*Required contract.* `dropped_constraints` and `assembled_for_class` in `payload.required`; a
conjunct on `edge.ContextManifest.captured.admitted.v1` that compares `assembled_for_class` against
the action's reached class set rather than merely asserting presence; and a length-or-key join
between `item_trust_levels` and `captured_inputs`.

*Negative control 5, stated narrowly and honestly.* NC5 says a manifest that lists inputs but not
omissions must fail W3. `omissions` **is** in `payload.required`, so NC5 passes on its letter. It
fails on the substance this round itself identified: `06` §2 declares `dropped_constraints` the
*operative* reading of omission for a boundary crossing, precisely because R2 F-04 measures boundary
metadata surviving at ~0.57 against ~0.97 for facts, so a generic omissions list averages the two
away. **I do not record NC5 as failed.** I record that the field the round added to fix NC5's real
form is unenforced.

### F6B-02 · (a) · `ConstraintSet` binds on one boundary out of the six the rule names, and optionally there

*Passage.* `05` §5 (R-X27): "A constraint set is required on **every transfer the fixtures name —
including the continuation and the founder-facing brief**, not only on machine-to-machine handoffs."
`04` DELTA 1 cites that sentence by name for the founder's re-entry brief.

*Computed counterexample.* `constraint_set_ref` occurs **twice** in `records.schema.json` and on
exactly **one** record in `record-registry.json`: `Delegation`. It is **not** in
`Delegation.payload.required`. These records carry no `constraint_set_ref` at all:

`Continuation` · `HandoffAcceptance` · `WorkMessage` · `AttemptReport` · `DecisionPacket` ·
`OperatorProjection` · `ParticipationEncounter`.

`Continuation` is the carrier for fixture F-5, the capacity-reset handoff. `OperatorProjection` and
`DecisionPacket` are the carriers for the founder-facing transfer. `ConstraintSet.payload.boundary_kind`
is a free `string` with no enum, so nothing can even assert that a founder-brief boundary kind
exists.

This is the round's own uniform gap **G-05** — "*No candidate types the founder-facing transfer
except M3*" — and **AX-M1-01**. The amendment answers it **in prose in two chapters and in no
record**. The one reader whose errors are uncorrelated with the model family's is still on the
untyped side of the boundary.

*Partial credit, precisely.* `OperatorProjection.payload.required` **does** include
`omission_manifest_ref`, so DELTA 1's "what was omitted … rendered from the record rather than
narrated" has a required carrier. Its target type is `ArtifactVersion` — a produced artifact, not a
typed structure — so "rendered" is backed at the reference and not at the content. DELTA 1's second
limb, **"and what was contested"**, has **no field on any operator-facing record**.

*Required contract.* `constraint_set_ref` required on `Continuation` and on the operator record that
carries the re-entry brief; required (not optional) on `Delegation`; `boundary_kind` as an enum
covering the transfers the six fixtures name; a contested-refs field beside `omission_manifest_ref`.

### Fixture F-5, walked

The pieces are present and they connect: the step boundary is the checkpoint (`05` §3, R-D19);
resumption requires an exact accepted checkpoint with compatible code and current restrictions
(`05` §3); a session may be resumed only when every retained input is still permitted, else the
opaque route closes and a fresh context is built from the portable `Continuation` (`06` §2); an
already-released effect is detected through `EffectIdentity` and `OperationStatus` reconciliation
before any business action repeats (`05` §6, §6 stop rule); and the resumed work's acceptance owner
is the `AcceptanceInterval`'s (`05` §5). **The adverse arm's third element — "the pre-reset summary
omits a decision" — is genuinely defused** by the recomputed armed set. What the walk does not
survive is F6B-02: the object the resumed attempt reads is the `Continuation`, and the
`Continuation` carries no typed constraint set, so the 0.57 survival rate applies to exactly the
material the fixture plants.

**W3: insufficient.** Two (a)-class findings, both on the mechanism the dimension is named for.
Neither blocks.

---

## W5 — independence of verification under one model family — SUFFICIENT

### Fixture F-4 with AM-01, arm by arm

**The checker's delivered inputs, recorded by the loader and not claimed.** Backed, and backed
mechanically. `guard.readset.delivered_equals_declared` fires on manifest admission and its
`eq(count)` conjunct is what refuses an extra field. Fixture `r16-02` removes that conjunct and
expects rejection; I verified the pointer resolves and that the removal is semantically
load-bearing — with `subset` alone, delivered ⊇ declared passes with the rationale attached.

**Who authors the criteria, and whether the producing path may amend them.** This is **AS-X-01**,
the round's only (d) that lands on W5, raised by the lane that does not own the dimension while
**AX returned W5 sufficient for all five candidates**. `06` §7 (R-D11) answers it in the exact
terms AS-X-01's required contract demanded: the capability owner authors, versioned and frozen
before the producing step starts, the producing path may neither author nor amend, and an amendment
between admission and submission is refused by a guard naming the failed predicate. It is **not
prose**: `guard.criteria.author_not_in_producing_path` (`not in`) and
`guard.criteria.frozen_before_producing_step` (`lt` on `criteria_frozen_at` vs
`producing_started_at`) are both wired to `edge.AcceptanceInterval.declared_done.in_acceptance.v1`,
and `AcceptanceInterval.payload.required` carries `criteria_author_component_id`,
`producing_path_component_ids`, `criteria_frozen_at` and `producing_started_at`. **This is the
clearest close in the whole amendment.** `05` §3 adds the necessary companion — a producing run may
not select its own checker, and a model-authored typed value may not select between acceptance
strengths (R-X19, `guard.branch.no_model_selected_acceptance_strength`).

**The paired clean case and the refusal rate (AM-01).** Bound. `criterion.InstrumentCalibration.run.v1`
requires `planted_defect_detection_rate` **and** `clean_case_refusal_rate` **and**
`session_observation_refs` **and** `protected_change_ref` all non-empty, requires
`custodian_excluded_from_producing == true`, and requires the protected change to be in
`authorized|activated|verified`. A calibration cannot reach `run` with a detection rate alone.

**The `unresolved` rule.** Stated in three places (`05` §10 `InstrumentCalibration.run`, `06` §7,
`04` DELTA 2) and **bound at the calibration record only** — see F6B-03.

**The one-family residual, disclosed.** Yes, and better than R7 asked. `06` §7 records the
disposition as "**sufficient on the three tested channels and unestablished on the fourth**", which
is narrower than either review said on its own; `05` §13(4) says "independence of influence is
claimed and measured, and **independence of error is disclaimed**"; AD-018's `epistemic_basis` says
independence of error "is unreachable inside one model family and is disclaimed in every acceptance
that rests on a same-family checker". R7's §8 test — "*A candidate that writes this sentence and
names the residual is compliant*" — is met.

### Negative controls

**Control 3, a checker that passes without checking — PASSES, and I tested it two ways.** At the
instrument layer, the calibration criterion above cannot record a pass without a clean-case rate. At
the guard layer, I walked all thirty guard bodies looking for one whose conjuncts are only presence
checks: **none**. Every guard compares something. The paired benign case control 3 requires — a
correct artifact that must still pass — exists as seventeen positive fixtures with a hand-maintained
floor of 17 in `fixtures/positive/MANIFEST.json`, and all seventeen pointers resolve.

**Control 6, an "independent" reviewer fed the producer's rationale — PASSES.** Detected by the
loader's record through `guard.readset.delivered_equals_declared`, with the benign pair
(`r16-02-…-benign`) requiring that the clean delivery not be flagged.

### F6B-03 · (a) · Nothing binds a verdict to a calibration, so "unresolved, never pass" is unenforced

*Passage.* `06` §7: "A verdict from an instrument whose refusal rate on clean cases is unrecorded is
… `unresolved`, and **it may not satisfy an acceptance gate**." `04` DELTA 2 repeats it for the
founder return.

*Computed counterexample.* **No record in `record-registry.json` relates to `InstrumentCalibration`**
— I searched all 193 record definitions; the only matches are the record's own three criteria and two
edges, plus two generic predicates that enumerate every record type. `AcceptanceInterval.payload`
has no calibration reference, and `criterion.AcceptanceInterval.accepted.v1` requires only
`resolution_reason`, `acceptance_owner_ref` and `criteria_ref`. An acceptance can therefore commit
on a checker with no calibration in `run` at all, which is the state every checker is in before the
first calibration session. The clause naming the attachment point is the one clause with no
attachment.

*Required contract.* A conjunct on the acceptance edge requiring a current `InstrumentCalibration`
in phase `run` for the checker that produced the verdict, and an eighteenth adverse fixture pairing
it — the seventeen r16 rows contain no row for an acceptance gated on an uncalibrated checker.

### F6B-04 · (c) · R7's third amendment — the control that excludes "more compute" — is not adopted

*Passage.* W5's failure condition: "Fails if 'independent' means only a second prompt, a second
name, or **a second copy of the same context**." R7 §8 amendment 3: "'a measurable difference
between arms' needs a stated floor … separate context beat context-carrying subagent at p=0.004, and
repeated same-context review did not beat single review at p=0.11. **The second result is the
control that makes the first mean something**, and a candidate should be required to show it,
because a candidate that reports only an improvement has not excluded 'more compute' as the
explanation."

*Counterexample.* Amendment 1 became AM-01 and is bound. Amendment 2 (more than two channels) is
reflected as three closed plus a fourth added. **Amendment 3 is adopted nowhere.** The strings
`same-context`, `same context`, `more compute`, `second prompt` and `second copy` do not occur in
`05`, `06` or `04`. F-4 as amended has four arms and **no repeated-same-context arm**, and no floor
is stated for what counts as a difference. `06` §7's pre-existing "measure joint false acceptance on
controlled defects before treating panel agreement as extra assurance" is adjacent and is about
panels, not arms.

*Required contract.* A fifth F-4 arm — the same checker run twice over the same context — reported
beside the other four, with a stated floor, a unit, a repetition count, a stopping rule and an owner.

**W5: sufficient.** The dimension's own blocking finding is closed with executable guards and the
residual is disclosed more narrowly than any single review stated it. F6B-03 is (a), F6B-04 is (c);
neither blocks, and neither reopens the verdict.

---

## W12 — founder attention and competence — INSUFFICIENT

### What landed

**AC-ALL-01 is genuinely closed, and it was the round's most uniform finding.** Every candidate
re-derived its own founder return; none cited the fixed mechanism. `04` now carries a paragraph
whose own heading is "the inheritance, **stated because no F2 candidate cited it**", naming
`ParticipationPlan`, `ParticipationEncounter`, `DomainAssessment`, `AuthorityMatrix`,
`DecisionPacket` and `GrievanceCase`, adopting **all four** encounter kinds, and pinning them to
this chapter's fixed cycle "not only after an absence" — which also closes AC-M2-04 (three of four
kinds dropped) and AC-M4-04 (fires only after absence). `05` §13(4) then inherits it *by name*. The
competence return is a **designed mechanism inherited by name**, which is what W12 asks for.

**Two deltas, declared and additive, with no third.** `04`'s header states exactly two deltas and
that any further one is a decision packet. Both are additive: the re-entry brief carries what was
omitted and what was contested (DELTA 1); every founder return reporting a detection rate reports
the clean-case refusal rate beside it (DELTA 2).

**The non-permissive posture is real and it is mechanical.** Admission in a duty class stops while
its acceptance role is unfilled — `05` §2 (R-D09) and §12 (R-X09), enforced by
`guard.admission.acceptance_role_staffed` on `edge.AdmissionRecord.opened.admitted.v1`, with
fixture `r16-12` and its benign pair. `05` §7: until MD-03 is answered, outward classes have no
approver and do not proceed. `04`: no-answer never means approval, and deferred decisions trigger
substitute or continuity, "never automatic approval". **Nothing makes the founder the router of last
resort by default** — the design's failure mode under his absence is to stop, not to queue on him.
`05` §6's fourth silent-drop shape ("an escalation ladder ending assigned-and-silent") is countered
by requiring an explicit awaiting-principal state with a deadline and a standing owner, and `05`
§12 forbids a holder to veto, to refuse admission narrowing, or to defend its own mandate.

**The six packets are complete against DIRECTIVE §3.** I checked Q-016…Q-021 element by element
against the eleven §3 requirements. All six carry `decision_required`, `why_this_owner`,
`latest_responsible_time`, `options`, `consequences`, `uncertainty`, `reversibility`,
`recommendation`, `if_no_answer`, `unrelated_work_continues` in `packet`, plus record-level
`evidence` and `source_refs`. **Nothing is missing.** Q-019's `if_no_answer` — "the assessment is
recorded as unperformed, never as passed" — is the correct non-permissive branch.

### F6B-05 · (d) · The acceptance load is still counted nowhere, and the second limb of AC-M4-01's required contract is neither answered nor routed

*Passage.* `05` §12: "Holder review is **priced**: a review-period length and an estimated
holder-hours-per-period figure **with its denominator**." `04`: "Attention admission counts planned
decisions, observed handling duration, interrupts, direct relationships, practice, recovery and
duty-review time."

*Counterexample.* Both are **requirements to produce a figure**. No figure exists, and neither is
the figure asked for. AC-M4-01's required contract has two limbs joined by "plus": *(i)* a staffing
precondition per holder with a stated behaviour when unfilled — **delivered**, and delivered with a
real guard; *(ii)* "**either a sampling rule at C3 equivalent to the one §6.3 applies at C2, or an
explicit statement that C3 acceptance is unsampleable and the resulting per-week count**" —
**absent**. Grepped across `05`, `06` and `04`: no C3 sampling rule, no per-week count, and the
string "full-time reviewer" does not occur in any of the three, though DIRECTIVE §8.18 requires the
design to define how the founder is kept from becoming one and W12's failure condition is that he
becomes one. AC-M3-02 states the same defect in W12's own words: "*W12's probe is 'Run a month of the
candidate's normal operation. **Count** what reaches the founder and why.' The count is derivable
from the candidate and the candidate does not derive it.*" It still is not derived.

*Missing decision.* Whether acceptance at the economic/contractual class is sampled or exhaustive.
An implementer must choose, and the choice decides whether the founder reviews every sale, every
support remedy, every launch, every fulfilment and every purchase, or a sample of them. None of the
six founder packets covers it — MD-01 is terminal ownership, MD-02 staffing, MD-03 the capability
approver, MD-04 the competence acceptor, MD-07 shed halt, MD-08 lane size. **It is neither answered
nor routed.**

*Why the chapter does not catch it.* `05` §13(2) is admirably honest that the (d) frame "cannot see
a missing *measurement*" and names three that are "unrun and cheap" — the unfamiliar-work rate, the
deterministic-predicate fraction, and the account entitlement. **The founder acceptance load is not
among the three**, and it is the one the consolidation called the design's central cost.

*Disposition.* (d). It blocks, and the chapter already records the layer as not accepted, so the
practical effect is on the register of what is open rather than on the verdict.

### F6B-06 · (a) · "Five (d)s remain open" is an undefined count, and on this dimension it maps three findings onto one cited id

*Passage.* `05` header: "**Five (d)-class findings remain open** … AT-M3-03 (MD-07), AC-M1-01
(MD-03), AC-M1-02 (MD-01), AC-M4-02 (MD-02), AE-M2-01 (MD-08)."

*Counterexample.* The consolidation classes **AC-M3-02, AC-M4-01 and AC-M4-03 as (d)** on W12, and
all three are absent from the list. MD-02's own text in `05` §12 — "which standing roles are staffed
by a person other than the founder before work is admitted in that class, and what happens in a
class where none is" — is **AC-M3-02's and AC-M4-01's Missing-decision line verbatim**, while the id
cited beside it, AC-M4-02, is the narrower finding about H9's unnamed alternate. So the chapter
appears to have merged three W12 (d)s into one packet and cited the last id, without saying so. A
reader cannot tell whether "five" counts findings or packets, and the ambiguity runs in the
flattering direction.

*Required contract.* State whether the five are findings or packets, and list the consolidation
finding ids each packet subsumes.

### F6B-07 · (b) · The fixture table marks F-6 "exercised" while the chapter's own open (d) says F-6's staffing question is unanswered

*Passage.* `05` §12 holders table: "Continuity and on-call | **F-6** — the day-five incident and the
terminus of the escalation ladder | **exercised**".

*Counterexample.* The chapter's own open (d) **AC-M1-01 / MD-03** is "*a novel job that needs a new
capability cannot be staffed while the founder is absent*", and `05` §7 records that MD-03's third
clause — "what happens during a founder absence" — is unanswered with no default. F-6 *is* the
founder-absent fixture. The same table applies exactly the right honesty one row above, marking the
reserved-lane holder "**exercised only at 4× demand … Recorded as owed, not as passed**". That
discipline is not applied to F-6.

*Required contract.* Either mark the continuity row partially exercised with MD-03 named, or state
which of F-6's two arms the row covers.

### F6B-08 · (c) · X19 — the founder's own error rate — is named, routed into a packet's uncertainty field, and left off the owed-measurement list

*Passage.* `05` §13(4): `04`'s competence mechanism "is the instrument that reads him, **with an
unmeasured error rate of its own**." Cross-lane X19 asks: "What is the expected error rate of the
human acceptance step, who measures it, and with what uncertainty is it reported beside the model
instruments it anchors?" and records that "nothing in the package states or requires a human error
rate".

*Counterexample.* `04` supplies most of a protocol — unaided recognition, intervention quality,
false-positive assessments, owner time and reported burden measured separately; delayed transfer
tested after a predeclared interval; consented longitudinal comparison required before claiming
preservation. It supplies **no stopping rule and no owner**, and the owner is itself the open packet
MD-04 / Q-019, whose `uncertainty` field says the measuring test "is blocked behind this decision".
The measurement is therefore circularly blocked, and it does not appear on `05` §13(2)'s list of
owed measurements.

*Required contract.* Add the human-anchor error rate to the owed-measurement list with a stopping
rule, and state the interim reporting rule while MD-04 is open.

### A week of ordinary operation

What reaches the founder, and why: `DecisionPacket`s generated only when a current mandate cannot
resolve a decision without that person, deduplicated against prior answers in the same purpose,
scope, consequence and validity interval, and batched into the participation window unless the
latest responsible time forces earlier (`04`). Plus the four fixed encounters on the fixed cycle.
Plus `05` §7's **`refusal-sample`** — a bounded sample of declined work, on the same cycle, because
"a refusal nobody reviews is a decision nobody made". That is a good addition and it is the only one
that shows him what the system chose *not* to do. Plus, per DELTA 2, both numbers or neither on any
checker reading. The **load** of that week is the thing nobody has computed — F6B-05.

**W12: insufficient**, on one (d).

---

## W14 — evidence quality of the round's own claims — INSUFFICIENT

### Citation audit

I sampled 28 citations from the amended sections of `05`, `06`, `04` and the eight AD entries, and
resolved each by opening the cited source and comparing the sentence that cites it. `AD` entries
whose `evidence_and_reasoning` points into `planning/F2/05-selection-record.md` are recorded as
**not resolved** rather than as absent — I am barred from that file.

| # | Citation | Citing passage | Verdict |
|---|---|---|---|
| 1 | R1 F-17 | `05` §6 — "eighteen of thirty workers chose the identical branch name, and a job queue took 2.4 million requests to accept 117" | **exact** |
| 2 | R1 F-10 | `05` §7 — "indistinguishable from no defence at its shipped weight and took evidence recall to exactly zero at the weight that worked" | **exact** |
| 3 | R1 F-10 | AD-019 — "a no-instruction poisoning attack passed a four-stage screen 360 of 360" (source: "refused 0 of 360") | **exact** |
| 4 | R2 F-04 | `05` §5 — "ordinary facts survive … at about 0.97 while rules, exclusions, deadlines and promises survive at about 0.57" | **exact** |
| 5 | R2 F-04 | `05` §5 — "typed constraints leaked **0 of 48** where prose leaked 73%" | **exact** |
| 6 | R2 F-05 | `05` §5 — stratification of the measure | **exact** |
| 7 | R2 F-08 | `05` §8 — a skill file can grant tools for the turn that loads it | **exact** |
| 8 | R2 F-09 | `05` §3 — control flow trusted, model output data, "published utility price … paid deliberately" | **exact** |
| 9 | **R2 F-10** | `05` §4 — "across four model families, 162 roles and 2,410 questions, adding a persona gave no benefit and picking the best persona was no better than random" | **stretched** — see F6B-10 |
| 10 | R2 F-20 | `05` §4 — "Applying a criterion to a unit where it returns undecidable … and undecidable reads as satisfied" | **exact** |
| 11 | R3 F11 | `05` §3 — "A control-flow structure authored by a model from untrusted input" | **paraphrase** — F11 establishes model-authored control flow; "from untrusted input" is the chapter's own inference, unlabelled |
| 12 | R3 F29 | `05` §3 — "on resume after an interrupt the whole step restarts" | **exact** |
| 13 | R3 F30 | `05` §3 — "a human approval step that shared its node with the payment it approved could duplicate that payment" | **exact** |
| 14 | R3 F33 | `05` §7 — "every declared prerequisite holds simultaneously … the all-prerequisites shape" | **exact** |
| 15 | R3 F57, F60 | `05` §3 — "44 capability declarations that nothing backed" | **exact** (F60 carries the 44; F57 the declaration-versus-binding limit) |
| 16 | **R3 F59** | `05` §4 — "an identical grant delivered 24 tools one day and zero on three dispatches **two days later**" | **stretched — factually wrong**; see F6B-09 |
| 17 | R6 F6 | `05` §4 — the evidence separates skill from agent on context, tools and model, not on knowledge | **exact** |
| 18 | R6 F7 | `05` §8 — a skill's declared tool grant, in the named runtime | **exact** |
| 19 | R8 A-7 | `05` §12 — "14 failures, 3 inconclusive and 3 successes over 20 tasks in one, a reversal and a rehiring in the other" | **exact**, and it keeps R8's "refuse to support" rather than upgrading to "refute" |
| 20 | R8 B-7 | `05` §7 — determinism is the only free lever on capacity | **exact** |
| 21 | R5-01, R5-02 | `05` §7 — the blackboard specifies no control flow; adding a coordinator costs | **exact** |
| 22 | R5-09 | `05` §7 — "A catch-all that does not name what it cannot catch is decoration" | **exact** |
| 23 | R5-15 | `05` §2 — typing unfamiliar work, out-of-scope recall | **exact** |
| 24 | AG-07 / AG-08 / AG-09 / AG-17 | `05` §§3,5,6,7,8 | **exact** on all four |
| 25 | X13 / X16 | `05` §§4,5; `06` §2 | **exact** on both |
| 26 | AS-X-01 | `06` §7 | **exact**, and the required contract is implemented limb for limb |
| 27 | AT-M1-03 | `05` §3 — "the alternative needed a denominator the round establishes does not exist" | **exact** — the second limb of AT-M1-03's required contract taken whole |
| 28 | **AT-M3-05** | `05` §3 — "Two numbers for one concept is what produced the finding" | **stretched** — AT-M3-05 is that the collapse N is a *distinct* number that is *not carried*; the remedy is sound, the attribution inverts the finding |
| 29 | AT-M4-02, AE-M4-01, AS-M3-01, AS-M2-02, AX-M2-02, AX-M1-01 | `05` §§1,3,4,11,12; `06` §5 | **exact** on all six |
| 30 | R7 F15 | Q-019 — "human evaluators agree with each other 5-65%" | **exact** |
| 31 | "a measured human error rate" | `05` §12 and `06` §5 | **absent** — see F6B-11 |

**Tally of the 28 sampled inline citations: 24 exact, 1 paraphrase, 3 stretched (one of them
factually wrong), 0 absent.** Plus one **absent** citation for a measurement invoked by adjective
(row 31), which was found by reading rather than by sampling and is reported separately.

All **111** review-finding ids I checked resolve in `planning/F2/reviews/findings-index.json` —
zero dead ids. That is a real improvement on AX-M5-03's dead-link finding.

### F6B-09 · (a) · The round's own documented citation drift propagated into the specification, unrepaired

*Passage.* `05` §4, `GrantDeliveryReceipt`: "It exists because a delivery asymmetry was measured — an
identical grant delivered 24 tools one day and zero on three dispatches **two days later**, cause
unknown (R3 F59, X16)."

*Counterexample.* R3 F59 reads: "`designer` held twenty-four `mcp__playwright__*` tools on
**2026-08-16** and zero across three independent dispatches on **2026-08-17**". That is **one day**.
This exact error was found in the round, in a candidate, and written up as **AX-M1-03 · (b)**:
"*Passage:* §2.2 `GrantDeliveryReceipt`, 'zero across three dispatches two days later'.
*Counterexample:* R3 F59 reads 2026-08-16 and 2026-08-17." AX-M1-03 is the named instance of
**AX-ROUND-01**, whose whole point is that "the round has no mechanism that catches a restatement
drifting from its own source". The synthesis reproduced it, in the same record, in the same words.

I grepped the entire `planning/specification/` tree and `registers/`: the strings "one day later",
"2026-08-16" and "2026-08-17" do not appear anywhere. The error is not corrected anywhere and the
correct interval is stated nowhere.

**AX-ROUND-01's required contract — "run the repository's existence-and-drift check over
`research/F2/**` and `planning/F2/candidates/**` … existence blocking, drift warning" — does not
appear in the specification or in either register.** Neither as done nor as owed. This is the
finding that most directly answers W14's probe, because it is a claim about the round's instrument
that the round itself made and that the round's own output then falsified.

*Required contract.* Correct the interval to one day; record AX-ROUND-01's drift check as run with
its result, or as owed with an owner and a date.

### F6B-10 · (b) · A preserved disagreement is cited on its favourable half only

*Passage.* `05` §4: "**Specialized knowledge is refused as a reason**, because it predicates on a
**skill version** and not on a worker: across four model families, 162 roles and 2,410 questions,
adding a persona gave no benefit and picking the best persona was no better than random (R2 F-10,
R6 F6, TC-33)."

*Counterexample.* R2 F-10 is labelled "**SOURCE CLAIM (primary, independent) + DISAGREEMENT
PRESERVED**" and carries a "For" side: ChatDev's ablation, where "the most substantial impact on
performance occurs when the roles of all agents are removed from their system prompts", Quality
falling 0.3953 → 0.2212. F-10's own reconciliation — "procedural content carries the benefit, the
job title carries none" — is exactly the chapter's design, so **the conclusion is well founded**.
But F-10 closes: "Neither study isolates the two, so this reconciliation is an **INFERENCE, not a
measured decomposition**, and it is the cleanest experiment nobody has run." The chapter carries the
numbers and drops both the counter-result and F-10's own epistemic downgrade, and AD-020's
`epistemic_basis` does not restore either. Protocol §7: "Disagreements are preserved … Forced
consensus is a finding against the round." This is AX-M5-02's shape, recurring in the synthesis
after being found in a candidate.

*Required contract.* Cite the ChatDev half beside it, or carry F-10's "INFERENCE, not a measured
decomposition" label on the sentence.

### F6B-11 · (b) · A measurement is invoked by adjective, twice, with no source and no number

*Passage.* `05` §12: "a chartered instrument desk evaluated by nobody and accepted by the founder
alone is a one-instrument chain with **a measured human error rate** and no second reading." `06`
§5 repeats the phrase almost verbatim.

*Counterexample.* The measurement is real — R7 F15, primary PDF read, Hertzum and Jacobsen 2003,
5–65% any-two agreement and 20–28% on severity. Neither chapter cites it, states it, or dates it.
Protocol §7 requires source, source date, source type, primary or secondary, confidence, conflicts,
corroboration, expiry and invalidator on every consequential claim, and the phrase "a measured X" with
no X is the exact shape §7 calls folklore. The register does it correctly — Q-019 cites "[R7 F15]"
with the number — so the failure is in the chapters, not in the evidence.

### Denominators, and DESIGN PROPOSALs

**Denominators are carried well where numbers appear.** "0 of 48", "360 of 360", "18 of 30", "2.4
million … 117", "14 / 3 / 3 over 20 tasks", "4 families / 162 roles / 2,410 questions" — every one
of these carries its denominator, and `05` §6's `EffectIdentity` and §9's pairing rule both state
the "both numbers or neither" rule explicitly. `05` §9's adverse table is paired row for row, the
positive MANIFEST carries a hand-maintained floor of 17 with a written argument for why the floor is
a literal, and I verified 17 negative and 17 positive r16 fixtures present, all 34 patch pointers
resolving.

**No DESIGN PROPOSAL is presented as evidenced.** I checked every `DESIGN PROPOSAL` label in `05`
(§§1, 3, 6) and `06` (§§3, 9) and `04`. Each is a construction, not a citation, and each that
carries a number carries an `UNKNOWN` beside it — `05` §3's WIP default says "This is an initial
engineering default, not a founder attention preference or performance fact"; `06` §3's retrieval
budget says "These are bounded starting policies to test, not measured recall limits". The
`epistemic_basis` fields of the eight ADs go further and name the *unevidenced* part of each
decision by row: AD-015 "the layer precedence ORDER is the selection record's own marked design
proposal with no finding behind it … it is the load-bearing unevidenced choice here"; AD-017 "the
five step kinds as an EXHAUSTIVE set is a marked design proposal with no finding behind it"; AD-019
"the prohibitions are evidenced, the choice of five is not"; AD-021 "the three-part conjunction AS a
conjunction is marked unevidenced". **This is the best-executed part of the round's evidence work
and it should survive into the next one.**

**The eight ADs' evidence fields resolve, except where I am barred.** Every `evidence_and_reasoning`
entry pointing at `research/F2/*`, `planning/F2/reviews/*`, `planning/F2/04-attack-consolidation.md`
or `planning/specification/*` resolves to a real file, and the finding ids inside the parentheses
resolve to real findings. Every entry pointing at `planning/F2/05-selection-record.md#…` is
**unresolved by me, by the independence rule**, and that is between a third and a half of the
citations on each AD.

**W14: insufficient.** One (a) that the round predicted about itself and then committed, and two
(b)s. None blocks.

---

## Consolidation findings on these dimensions: answered and silent

**Answered, and answered mechanically:**

| Finding | Class | Where answered |
|---|---|---|
| AS-X-01 | (d) | `06` §7 + `guard.criteria.*` on the acceptance edge — limb for limb |
| AX-M3-01 / AX-M4-01 / AX-M2-04 (per-item trust level) | (b) | `06` §2 + `guard.trust.derived_is_floor_of_inputs`; **the per-item join is not made** (F6B-01) |
| AX-M2-02 (one-instrument chain) | (c) | `06` §5 `InstrumentCalibration`, deterministic reproduction path, C5 write |
| AX-M5-01 / AX-M1-02 (supersession blast radius) | (c) | `06` §4 + `guard.supersession.walks_derived_closure`, with closure size marked UNKNOWN and owed |
| AS-M5-04 (producer's write arms its checker; weakest tie-break) | (b) | `06` §7 + `guard.check.*` on `edge.StandingInterest.trial.admitted.v1` |
| AC-ALL-01 (competence mechanism cited by nobody) | (b) | `04`'s inheritance paragraph, all four encounters, fixed cycle |
| AC-M2-04, AC-M4-04 | (b) | same paragraph |
| AC-M3-02 limb 1, AC-M4-01 limb 1 (staffing precondition) | (d) | `05` §2/§12 + `guard.admission.acceptance_role_staffed` + fixture `r16-12` |
| AX-M1-01 / G-05 (founder brief untyped) | (b) | in **prose only** — no record carries it (F6B-02) |

**Left silent:**

- **AC-M4-01 limb 2** — the C3 sampling rule or the explicit unsampleable statement with a per-week
  count. Neither answered nor routed (**F6B-05**).
- **AC-M3-02's headline** — the count W12 asks for. Still not derived, and absent from `05` §13(2)'s
  own list of owed measurements.
- **AX-ROUND-01's required contract** — the existence-and-drift check. Not recorded as run or owed,
  and the drift it names recurred (**F6B-09**).
- **R7 §8 amendment 3** — the compute control on F-4's arms (**F6B-04**).
- **X19** — the human anchor's error rate, named but not owed (**F6B-08**).
- **`04` DELTA 1's "contested" limb** — no field on any operator-facing record (**F6B-02**).

---

## Negative controls I ran

| Control | Result |
|---|---|
| §4.3 · a checker that passes without checking | **passes.** `criterion.InstrumentCalibration.run.v1` requires both rates; and across all 30 guard bodies, none is presence-only — every one carries a comparative conjunct |
| §4.3 · its benign pair, a correct artifact that must still pass | **present** — 17 positive fixtures, floor 17, all pointers resolve |
| §4.5 · a manifest listing inputs but not omissions | **passes on the letter** — `omissions` is in `payload.required`. **Fails on the round's own operative reading** — `dropped_constraints` is required by nothing (F6B-01). Recorded as a finding, not as a control failure |
| §4.6 · an "independent" reviewer fed the producer's rationale | **passes** — `guard.readset.delivered_equals_declared`, with the `eq(count)` conjunct doing the work |
| §4.10 · a fixture authored after a candidate's result was known | **no violation found.** AM-01 is dated 2026-09-13 at "Steps 0–2 complete (`ddd7c22`); no candidate exists", cites R7 §8 amendment 1 as its source requirement, and states "The amendment adds a measurement; it does not change what passes" |
| my own · every guard defined is called by an edge | **30 of 30 wired, 0 unwired** |
| my own · every r16 fixture pointer resolves against the shipped registry | **34 of 34 resolve, 0 dead controls** |
| my own · the removed conjunct in each adverse fixture I examined is load-bearing | **confirmed by reading the body** for `r16-02`, `r16-03`, `r16-14`, `r16-15`, `r16-17`, `r16-12` |

---

## Not checked

1. **`planning/F2/05-selection-record.*` — barred, and it costs this review something specific.**
   Between a third and a half of every AD entry's `evidence_and_reasoning` points into it, and the
   dispositions of AC-M3-02, AC-M4-01, AC-M4-03 and every finding the chapter treats as closed live
   in its §5.2/§5.3. I cannot distinguish "closed with reasons I would accept" from "dropped". F6B-06
   is stated as a finding about the *chapter's* account, which is what I can see, not about the
   selection record's, which I cannot.
2. **`validate_contracts.py` did not complete.** I started it on the frozen tree at the contracts
   directory and it produced **0 bytes of output after ~70 minutes**, so I could not execute the
   negative or positive fixture suites, which invoke it once per fixture in a scratch tree. Every
   contract result above is **structural** — I resolved pointers, walked bodies, and checked wiring
   and schema requirements directly — and **none of it is a validator run**. The suite's own claim
   that it can fail is therefore unverified by me.
3. **The four unread lanes' internal consistency.** I opened R1, R2, R3, R4, R5, R6, R7 and R8 only
   at the passages cited. I did not audit any lane's sources against their originals; every
   "**exact**" above means *the citing sentence matches the cited finding's text*, not *the finding
   matches its own source*.
4. **W3's summarization probe was not executed.** No runtime exists; I judged the specified
   behaviour of compaction, not a compaction.
5. **`06` §§1, 3, 8–10 and `05` §§1–2, 6, 8 were read for the probes only**, not audited line by
   line.

---

## Standing caveat, restated

Specified behaviour, checked offline, by one reviewer of the same model family as every author,
with procedural independence only. **W14 in particular is a claim about evidence quality made by
the family that produced the evidence, which is the W5 problem one level up**, and the chapter's own
`05` §13(4) says the right thing about it: independence of influence is claimed and measured;
independence of error is disclaimed. Nothing in this review establishes runtime conformance,
deployment readiness, actual fulfilment, or the business value of the intended system.
