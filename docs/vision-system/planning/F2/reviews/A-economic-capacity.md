> Archival provenance — 2026-09-13: Step 4 attack review, **economic and capacity** perspective (W4, W13; DIRECTIVE §8.21 and the Phase D cost attacks), on the five F2 candidates at frozen subject `c6d62a3`. Preserved verbatim from the reviewer engine's report file. The reviewer authored nothing in the round, was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, other reviewers' scratch and every prior F2 review, and read each candidate's §11/§12 last. Same model family as every author; independence is procedural only. The capacity ordering in E8 is ordinal, every step labelled INFERENCE, because no arm is expressible as a fraction of the weekly allowance. Archival is not acceptance.

# Step 4 adversarial review — economic and capacity attack on M1..M5

## Provenance

**Subject.** Commit `c6d62a3` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`, read at the
repository root, read-only. This reviewer holds no `Write` or `Edit` over the subject.

**Role.** Independent adversarial reviewer for DIRECTIVE §7 Phase D, economic perspective. I authored nothing
in Steps 1–5 of this round: no research lane, no candidate, no repair, no recheck.

**Independence is procedural only and I say so in my own words.** I am the same model family as every author
of every candidate I judge here. That is not independence of error; it is independence of context and of
stake. What I actually hold: a separate context window; no part in producing any candidate; and three
standing bars I kept — I did not read `docs/08-agents_work/`, any `.worktrees/` path, `state.json`,
`history.jsonl`, `PLANNING-REPORT.md`, `planning/F2/reviews/`, or any other reviewer's scratch directory.
Within each candidate I read §11 (the author's own (d)-class self-audit) and §12 (its evidence ledger) **last**,
after forming my judgment from §1–§10, so that the author's self-assessment could not seed my findings. Where
my finding and the author's self-audit agree, I say which one I reached first.

**Dimensions assigned.** W4 (cost and capacity under subscription) and W13 (alternative depth and comparator
honesty), plus the DIRECTIVE §7 Phase D economic attacks: runaway cost, infinite retry loops, subscription
exhaustion, provider outages, provider behavior changes, unauthorized spending.

**Standing caveat, per protocol §8.** No runtime exists. Every judgment here is about **specified behavior
checked offline**. Nothing in this report establishes runtime conformance, capacity conformance, or that any
number in any candidate would survive contact with an invoice or an allowance page.

**Protocol version applied.** `00-acceptance-protocol.md` frozen 2026-09-13 at `26af5d5`, plus amendment
AM-01. I applied both.

**A note on protocol §6 and the two falsifiers.** The frozen protocol grants B0 "the lowest plausible
consumption of scarce subscription capacity" and "one long-context session". Research later falsified both
clauses — FAL-01 (R8 B-6: four documented provider mechanisms by which a long session draws *more* weekly
allowance) and FAL-02 (R2 F-18: a native job caps at a 360-second window, so a six-hour single context is not
purchasable under this system's own launch contract). **A candidate may cite either. Neither excuses it from
the comparison.** B0 retains every other granted strength — no handoff, no router, one window a person can
read, trivially buildable, trivially changeable, a record the founder reads end to end. A candidate that uses
FAL-01/02 to shorten or skip the B0 comparison is committing the §6 strawman with a citation attached, and I
score that harder than an uncited strawman, not softer.

**Prior art I read before the candidates, and therefore hold as the background any candidate must beat.**
Protocol §§1–8 and amendments; DIRECTIVE §8.21 and §7 Phase D; `planning/specification/07-integrations-capacity.md`
§5–§7; `research/F2/R8-contrarian.md` §3 and B-6, W-5, W-6; `research/F2/R2-agent-existence.md` F-01, F-18, F-19;
`research/F2/cross-lane-comparison.md` §E and axes X14, X20. The four facts from that background that do most
of the work below:

1. **W-6 — there is no denominator on the Claude side.** No absolute weekly figure appears on any current
   vendor page. Every capacity statement any candidate can truthfully make is a **ratio between arms**, never
   a fraction of the week. "This design uses 40% of the allowance" is a sentence no author here may write.
2. **F-01 — the 15× figure is a vendor source claim with no published method.** Protocol §7 forbids citing it
   as a measurement. Any candidate that arithmetically operates on it is a finding by construction.
3. **W-5 / FAL-10 / X20 — the no-silent-metered-fallback rule has no mechanism.** The metered path is one
   in-product setting away at both providers and is surfaced *at the moment of exhaustion*. A candidate that
   restates the policy has restated the gap.
4. **F-19 / FAL-02 / X14 — F-2 (4× demand) is not executable at CP1.** Two non-interchangeable slots, one of
   which (Codex) is not yet admitted. Honest disposition is "owed and blocked on a CapacityPlan revision".
   Reporting F-2 as passed on projection is negative control §4.10 in a different costume.

Probes applied in the same order to every candidate: **E1** units and denominators · **E2** mid-week
exhaustion with a refund and a supplier reply due · **E3** silent metered fallback observation point ·
**E4** runaway cost, retry loops, re-arming capabilities, non-terminating validators · **E5** F-2 honesty ·
**E6** comparator honesty against S1.0 and B0 · **E7** operational complexity and removal criteria ·
**E8** cross-candidate capacity ordering.

Finding ids are `AE-<M>-NN`, classed (a)/(b)/(c)/(d) per protocol §5. Only (d) blocks.

---
# M1 — Capability-differentiated ephemeral agents

**W4 (cost and capacity under subscription): SUFFICIENT.**
**W13 (alternative depth and comparator honesty): SUFFICIENT.**

Both judgments carry findings. Neither is (d)-class; nothing in M1's economics blocks.

## What landed, named so the next iteration keeps it

M1 is the only candidate that puts the **units** rule, the **missing denominator** and the **inversion**
(architecture moves the date work stops, not the monthly bill) in the same fixture answer, in that order,
before saying anything about its own design (§7 F-2, items 1–3). It states F-2 is **not executable at CP1**
and names the unblocking act, in its own first sentence on the fixture rather than in a footnote. It charges
the five-minute parallel-executor cache expiry to the parallel arm in a **record field**
(`ExistenceJustification.expected_cost`), which is the only place in the five candidates where an invisible
capacity cost is attached to the decision that incurs it. Its B0 section states the two falsifiers and then
says in its own words that they "narrow the comparison rather than settling it" — the correct handling of
FAL-01/02 and the standard I hold the other four to.

## Findings

**AE-M1-01 · (b) · E1 · A cost figure in a forbidden unit, cited without its non-conformance label.**
*Passage:* §9.2, "Auto-generated multi-agent systems consistently underperformed a single-agent baseline at
**up to ten times the cost** (R2 F-02)"; and "at matched reasoning-token budget…" in the same list.
*Counterexample:* M1's own §7 F-2 item 1 forbids a token count as a capacity model, and R2's own TC-02
verdict says all published figures including this one are "in tokens or dollars and are therefore
**non-conforming under TC-26**." M1 imports the figure across that line without carrying the label. The
figure also has no denominator: "ten times the cost" of what, per what accepted outcome, is not stated.
*Mitigating, and I record it because it is the honest direction:* the figure is cited **in B0's favour**,
against M1's own thesis. This is a unit error, not a flattery error.
*Required contract:* any external cost multiple carried into a capacity argument is labelled with its unit
and marked non-conforming under TC-26, or is re-expressed in `07` §6 units, or is dropped.

**AE-M1-02 · (b) · E2 · The shed ladder answers pressure and does not answer exhaustion.**
*Passage:* §7 F-2 item 5 — "What is shed, in order: discretionary exploration, then ordinary creation and
research, then maintenance and evaluation. **Never the due-service minimum, the grievance share, or the
protected checks.**"
*Counterexample — the probe as put:* the weekly bucket empties Wednesday; a refund is due Thursday; a
supplier reply is due Friday; the reset is Sunday. M1's ladder has nothing left to shed, because everything
sheddable is already shed and the remainder is the protected class. A reservation of 50% of the due-service
share is 50% **of zero**. CAP-17's production mode in §8 is "Model + durable procedure", so the refund
proposal itself needs a launch that cannot be bought. M1 never states what happens at that point. Three
materially different company behaviours are available to an implementer — breach the obligation, wake the
founder, or take the metered path the policy forbids — and M1 picks none.
*Why this is (b) and not (d):* M1 reuses `ResourceAccount` and `Reservation` "unchanged from `07` §6" (§2.1),
and `07` §6 does carry the rule — "Alert current owner and alternate with exact exhausted dimension, due
duties and **available manual/other-provider paths**." The decision exists upstream; M1 neither restates nor
exercises it. An implementer holding both documents finds it. One holding M1 alone does not.
*Required contract:* the F-2 answer names the exhaustion case distinctly from the pressure case, and states
for a due obligation past exhaustion: the non-model production mode that performs it (`02` §3's capable
people or qualified professionals), who is alerted, and what record the breach-or-perform decision leaves.

**AE-M1-03 · (b) · E3 · The metered-path observation point is named; its cadence, owner and response are
not.**
*Passage:* §10, "M1 requires the account setting to be read and recorded — observable today, costs nothing
(MG-18)"; and §11 O-1, which classes the affordance as a conformance gap it cannot claim to prevent.
*Credit where due, and I reached this before reading §11:* naming a **read of the account setting** is a
mechanism, not a restatement of the policy, and it is what X20 asks for. M1 is one of three candidates that
gets that far.
*Counterexample:* the affordance fires **at the moment of exhaustion**, inside the CLI, to whoever is at the
terminal. A setting that is "read and recorded" at unspecified intervals detects the flip after an unbounded
number of metered calls. M1 specifies no cadence, no reader, and no response — and the response is the part
that decides whether the company keeps working on a metered path or stops.
*Second half M1 drops:* R8 W-5 records that enabling credits also **drops the prompt-cache lifetime from an
hour to five minutes**. M1 carries the five-minute figure for the parallel-executor case (§7 F-2) and not for
this one, so the capacity cost of the metered flip to the *subscription* path is unpriced in M1.
*Required contract:* a refresh cadence bound to `07` §6's existing "before launch and at most every five
minutes while active"; a named reader; and a stated response on change — which by `07` §6's own
uncertain-billing rule should be a launch quarantine, not a journal entry.

**AE-M1-04 · (b) · E4 · No attempt ceiling behind the non-terminating validator.**
*Passage:* §4.2 item 1 gives the `WorkOrder` a "budget, stop rule, latest responsible time"; §4.3 defines
meaningful progress as "accepted output, a resolved predicate, or a tested hypothesis with an honest negative
result (CP-99)".
*Counterexample:* C06 rejects; the producer re-attempts; C06 rejects again. Each attempt is a fresh launch
drawing the weekly bucket. M1 defines what progress **is** and never states the consequence of its absence:
no attempt ceiling, no rejection-count trigger, no named party told. The denominator rule (CP-99) keeps
rejected attempts in the denominator, which **measures** the loop and does not stop it.
*What M1 does close:* delegation depth and fan-out, with a named owner (C01), a default of one child layer,
and a permission check at spawn. The loop M1 closes is the spawning one; the loop it leaves open is the
retry one.
*Required contract:* an attempt ceiling per work order with a named owner and a stated behaviour at the
ceiling — park with a reason, escalate, or refuse — plus the same for an executor's internal retry against
one tool.

**AE-M1-05 · (c) · E7 · "Every mechanism carries a removal criterion" is asserted more broadly than the
text supports.**
*Passage:* §6.5 — "Every mechanism carries a removal criterion, recorded in
`ExistenceJustification.removal_criterion` for executors and **in the mechanism's own contract otherwise**."
*Counterexample:* the second clause delegates to contracts this candidate does not write. Of eleven new
records in §2.2, §9.2's falsifier table supplies a removal criterion for five (`ConstraintSet`,
`FieldAuthority` by way of D-03, the executor-existence gate, the separated-context checker, the
profile count). `EffectIdentity`, `GrantDeliveryReceipt`, `HandoffAcceptance`, `ShedDecision`,
`AdmissionRecord`, `InstrumentCalibration` and `Projection` have none. §10 concedes the record count is high
and every record is a maintenance obligation; the removal discipline is what would bound that, and it is
asserted rather than written.
*Required contract:* a removal criterion per new record, in the same table that introduces it, in the
falsifier form §9.2 already uses — "if X is not observed, this record is ceremony."

## E7 — operational mechanisms M1 requires standing

Seventeen distinct standing mechanisms, counted from §2.2, §3, §6.5 and §8: admission triage with a rotating
owner · the three-class typing matrix as a measured instrument · `ExistenceJustification` per executor ·
`ConstraintSet` schema authoring per capability · `FieldAuthority` declaration and native reconciliation ·
`Projection`/`ProjectionGrant` with revocation cascade into derivatives · `HandoffAcceptance` ·
`NextActionView` re-issued per operating period with an author and a different approver · `EffectIdentity`
allocation plus reserved name ranges plus a rate-anomaly monitor · `GrantDeliveryReceipt` · `ShedDecision` ·
`InstrumentCalibration` re-runs on a cadence shorter than the provider's release cadence · the monthly
profile-convergence probe · skill-library review · the C01-owned delegation ceiling · `07` §6's
daily/weekly/monthly reconciliation, inherited · the metered-path account-setting read.

M1 names this cost itself (§10: "The record count is high and every record is a maintenance obligation",
concentrating in `ConstraintSet` authoring, `FieldAuthority` reconciliation and `InstrumentCalibration`
re-runs). **Seven of the seventeen have no removal criterion** — AE-M1-05. This is the highest standing
mechanism count of the five candidates and M1 does not hide it.

## E5 — F-2 honesty

**Honest, and it is the reference standard for the other four.** §7 F-2 opens "M1's honest disposition first.
**This fixture is not executable as specified at CP1**", cites CP-159 and R2 F-19, classes the
coordination-cost measurement as "owed and blocked on a reviewed `CapacityPlan` revision", and names the act
that unblocks it. It states that reporting it as passed on a projection "would be negative control 10 in a
different costume." It does not argue the pin away and does not claim X14's answer. The one thing it does not
do is say who owns the CapacityPlan revision decision; X14 asks whether the pin is a provider constraint or
policy, and M1 leaves that with the fixture rather than routing it. Minor, and it is inside AE-M1-02's
required contract.

## E6 — comparator honesty

**Against S1.0:** eleven changes, each with the CP number it argues against and why (§9.1). These are
behavioural, not lexical: `FieldAuthority` against CP-22 changes who may write a field; skill frontmatter
stripping at load changes what a loaded package can do; `HandoffAcceptance` changes when accountability
ends. Negative control 1 (rename-only) does not catch M1. The strongest evidence that the section is honest
is §9.1's last paragraph: M1 keeps CP-77's human in the loop for capability creation and therefore
**declines to claim TC-19 in its strong form**, calling that "a refusal to overclaim, not a gap."

**Against B0:** four wins granted to B0 including two that cut directly against M1's thesis — matched-budget
single-agent parity or better across three families and five multi-agent arrangements, and the 100-line
linear agent scoring competitively. Then FAL-01 and FAL-02 are reported **as findings against a granted
strength, explicitly not as a defeat of B0**, with the sentence "B0 keeps every other legitimate strength."
Then §9.2 closes with three named conditions under which B0 should win outright, drawn from protocol §6, and
§10 closes with a fourth: if the profile-convergence probe shows six recurring shapes, "a different candidate
is the right one." **M1 says when a smaller system wins, and says when a rival candidate wins.** That is the
bar.

---
# M2 — Chartered persistent agents

**W4 (cost and capacity under subscription): INSUFFICIENT.**
**W13 (alternative depth and comparator honesty): SUFFICIENT.**

W13 is the strongest of the five. W4 fails on a different axis from the one this candidate is usually
attacked on: not that charters cost allowance — they demonstrably do not — but that M2's two genuinely new
recurring consumers of the weekly bucket are never entered in any capacity row, while a headline of **zero**
is entered in their place.

## What landed

**The lapse rule is the single best economic mechanism in the round and no other candidate has it.** §7 F-2
item 5: every reserved lane carries a lapse point before its reset window; unconsumed reservation releases to
the general pool automatically and the holder is notified rather than asked; a never-spent reservation is
priced as waste in the charter's own economics row. This operationalises R8 §3's finding that unused
allowance is destroyed rather than banked, which inverts how a reserve behaves under per-token pricing. Four
candidates read that finding. One built a mechanism from it.

**The F-2 falsifier is executable at CP1, which nothing else in the round manages.** Run the shed decision
twice on one tabletop — once asking named holders, once applying `07` §6's class reservations with no holder
— and count shed decisions the founder later reverses and duty minimums breached. "This runs at CP1 because
it is a decision procedure, not a capacity experiment." That converts a fixture blocked by X14 into a
sub-experiment that is not blocked by it, and it is aimed at M2's own strongest claim.

**§9.1 is comparator honesty at its limit.** "Remove the three new rows of §2.4 and M2 is S1.0 exactly. Not
similar to it; identical." Each row is then removed **separately**, "because removing them together would
hide which one was carrying the weight." M2 claims nothing over S1.0 on F-1, F-3 or F-4, states B0 is
"arguably better at F-1", and quotes verbatim the R7 passage most adverse to itself — that B0 plus scripts
plus human acceptance is not obviously worse than B0 plus scripts plus a same-family checker — then
**adjusts its own claim in response**. §10 names six conditions under which this is the wrong design.

## Findings

**AE-M2-01 · (d) · E2/E1 · The size of each reserved lane and its lapse point is undecided, and it decides
what the company sheds.**
*Passage:* §11 (d-M2-2), which M2 raises against itself: "per-lane share, per-lane stated minimum, and the
lapse point … **Trigger:** the first `ShedNegotiation`. **Failure:** the first implementer's default becomes
the company's shedding policy."
*I record this as confirmed rather than discovered.* I reached the same hole from E2 — a protected minimum
is a share of an allowance, and no share size is named anywhere in §2.1's `reserved_lane` field, §7 F-2, or
§8 — before reading §11. M2 states it more precisely than I did and routes it as a decision packet with §7
F-2's mechanism attached, which is the correct disposition under protocol §5.
*Why it is genuinely (d) and not a parameter:* there is no published denominator (R8 W-6), so the number
cannot be derived from the allowance; and the lanes are what the company gives up under pressure, which is
its meaning rather than its tuning. Two implementers given M2 produce two different companies at the first
capacity event.
*Required contract:* per-lane share, stated minimum and lapse point, decided by the founder, recorded with
the observation that would revise them — and, because no absolute denominator exists, expressed as shares of
whatever the observed weekly allowance turns out to be rather than as absolute figures.

**AE-M2-02 · (b) · E1 · "Zero per work order" is contradicted by M2's own decision probe.**
*Passage:* §7 F-2 — "Added coordination cost per unit of delivered work at 1× and 2×: **zero per work
order**, because charters do not participate in production; the cost is per duty at wake time and per quarter
at evaluation time."
*Counterexample from M2's own text:* §5.3 requires that "**the decision probe runs before a consequential
action**. The holder must restate the load-bearing entries, and a probe entry is flipped to confirm the
output changes." That restatement and flip happen inside the work order, before the action, and consume the
same scarce units the fixture is counting. Every work order under a chartered duty carries at least one
probe. The number is not zero; it is one probe per consequential action, times the count of consequential
actions.
*The denominator is present and correct — "per work order" — which is why this is a wrong number rather than
an unfalsifiable one.*
*Required contract:* the F-2 row reads "one decision probe per consequential action under a chartered duty,
plus wake-time and evaluation-time cost", in `07` §6 units, with the probe charged to the arm that requires
it. If the true figure is believed to be negligible, say negligible and name the measurement, do not say zero.

**AE-M2-03 · (c) · E1/E7 · The evaluation cadence is M2's largest new recurring draw on the weekly bucket
and appears in no capacity row.**
*Passage:* §2.1 `review_cadence` — "Re-run interval, which **must be shorter than the provider's model
release cadence**"; §9.1's fresh-holder arm — "five attributable trials per case" over `CT-INSTRUMENT`'s
fixed pool, per charter, per quarter; §6.1's instrument drift re-check on the same short schedule.
*Counterexample:* with five charters, a fixed pool per duty class, five trials per case, and a cadence bound
to a provider release rhythm that has run at roughly quarterly, this is a recurring, scheduled, non-deferrable
consumption of the same weekly bucket that binds every other arm. It is the cost of M2's own falsifier, which
is the right thing to buy — but it is bought on the same allowance and never entered. §10 prices the
**founder-attention** half ("five sheets and one transfer test a month is a real cost charged against W12's
own criterion") and leaves the **provider-quota** half at zero by omission. DIRECTIVE §8.21 requires both
tracked separately; M2 tracks one.
*Aggravating:* §12 marks the quarterly cadence as "**DESIGN PROPOSAL, no evidence**" (ledger row 50), so the
interval driving the cost is itself unevidenced.
*Required contract:* an evaluation-capacity row in `07` §6 units — launches and quota bucket per charter per
cycle — and a stated behaviour when the evaluation cycle collides with a capacity-pressure window, since an
instrument re-run is exactly the discretionary-looking work the shed ladder eats first and is exactly the
work that must not be eaten if drift is to stay measurable.

**AE-M2-04 · (b) · E3 · Silent on the metered path.**
*Passage:* none. The words metered, credits, paid usage and spend limit do not occur in this candidate in
any capacity sense.
*Counterexample:* DIRECTIVE §8.21 states two requirements M2 does not touch — "**Prevent silent fallback from
a subscription path to a metered API path**" and "**Require explicit policy for any additional paid usage**"
— and R8 W-5 / FAL-10 / axis X20 establish that the path is one in-product setting away at both providers and
is surfaced **at the moment of exhaustion**, which is precisely the moment M2's `ShedNegotiation` fires. M2
is the candidate whose central fixture is capacity pressure, and the affordance that defeats the capacity
policy appears at the peak of that pressure, unmentioned.
*Why (b) and not (d):* M2 inherits `07` §5–§6 unchanged, and `07` §5's pre-launch `AuthAttestation` carries
"API-key override absence and **approved credit settings**" as required observation, with custodian billing
observations expiring "immediately on a relevant auth/plan/credit event". The observation point exists
upstream. M2 neither names it nor binds a response to it.
*Required contract:* name `AuthAttestation`'s credit-settings field as the observation point, state the
response on change — `07` §6's own uncertain-billing rule says quarantine the affected launch, not log it —
and add a row to the shed record for whether the metered affordance was offered during the pressure window.

**AE-M2-05 · (c) · E4 · The wake right can re-arm itself, and the only thing stopping it is a budget nobody
reads.**
*Passage:* §4 item 1 — "A duty becomes actionable — a deadline, an inbound Observation, **a lapsed
`valid_until`**, a correction. The charter's wake right lets it cause a `WorkOrder` to be *proposed* … The
wake right is bounded by the `reserved_lane` and can never reach a consequential effect."
*Counterexample:* a lapsed `valid_until` wakes the duty; the work order refreshes the carried entry with a
new `valid_until` (§4 item 6, "becomes or updates a carried entry, as a typed append"); that lapses; the duty
wakes again. This is the self-re-arming capability of DIRECTIVE §7 Phase D, built from two mechanisms M2
introduces for good reasons. **The budget bound is real and I credit it** — the lane caps the loop, which is
more than three other candidates do for any loop. What is missing is detection and notification: a lane
consumed entirely by wake-and-refresh with no accepted outcome is not a breached minimum, so it does not
trigger §7 F-2 item 4's alert; and the lapse rule does not fire, because the lane *was* consumed. The failure
is invisible in exactly the instrument built to watch it.
*Required contract:* a progress predicate on the lane — S1.0's CP-99 already defines meaningful progress and
keeps rejected and abandoned attempts in the denominator — with a named recipient told when a lane's
consumption carries no accepted outcome across a reset window.

**AE-M2-06 · (b) · E4 · No retry ceiling anywhere.**
*Passage:* none. The words retry and loop do not occur in this candidate in an execution-control sense; §11
item 7 closes delegation depth by inheritance and says nothing about attempt count.
*Counterexample:* the non-terminating validator. `CT-INSTRUMENT` holds the evaluation pools; a desk's output
fails its fixed case pool; the duty re-wakes on the same unmet deadline; each cycle is a launch. M2's answer
to runaway delegation is inherited and adequate; its answer to runaway *iteration* does not exist.
*Required contract:* as for M1 — an attempt ceiling per duty with a named owner and a stated behaviour at the
ceiling.

## E7 — operational mechanisms M2 requires standing

**Lowest of the five, and M2's claim to that is accurate.** Three new records (`Charter`, `CarriedRecord`,
`ShedNegotiation`), one new negotiation procedure, one new instrument (`CT-INSTRUMENT` with four pools), five
desks each with a published reachability route that must be answered, per-class write-time caps, quarterly
fresh-holder runs, and the founder's acceptance of `CT-INSTRUMENT`'s readings. Against S1.0 that is small,
and §10 says so plainly: "Against S1.0 the added machinery is small. Against B0 it is large, and B0's
simplicity is real."

**Removal criteria are the best in the round.** Each of the three new rows has its own removal test in §9.1's
table; the fresh-holder arm is a full (c)-class protocol with subject, arms, cases, unit, repetition,
reporting, **stopping rule** and an owner who is not the subject. §10 names the asymmetry that matters
operationally: carried memory and the reserved lane are cheap to remove, **`reachability` is not**, because a
published contact route is a promise — so the recommended posture is one desk, not five. That is a removal
criterion that changes the rollout, which is what a removal criterion is for.

## E5 — F-2 honesty

**Honest.** "The 4× measurement cannot be run at CP1 at all (R2 F-19), and raising CP1 is circular (R8
TC-39). Reporting F-2 as passed on a projection would be the §4 control-10 failure in a different costume.
What follows is therefore the **mechanism**, tabletop-executable at CP1, not a result." It then concedes the
1× and 2× comparison to S1.0 before making any claim, citing R8's economics table as agreeing against itself
in three cells. It does not argue the pin away and does not attempt X14. It goes one step further than every
other candidate by finding the part of the fixture that **is** executable under the pin. The unowned residue
is the same as everyone's: who decides whether the pin is a constraint or a policy.

## E6 — comparator honesty

**Against S1.0: sufficient, by subtraction.** The three-row delta is stated, and M2 argues **against** R8's
own smaller count of two by adding reachability and saying why rather than "quietly adopting the smaller
number". Negative control 1 cannot catch this — remove the rows and the candidate is admittedly identical to
the incumbent, which is the opposite of a rename.

**Against B0: sufficient.** B0 is granted its full §6 strengths verbatim, wins F-1 outright in M2's own
table, and the four protocol §6 win conditions are restated with the concession that §7 F-2 "concedes it
will" show no material difference at 1× and 2×. FAL-01 and FAL-02 are quoted in full as findings against
premises, with "the protocol is frozen and this candidate does not amend it", and the comparison is then run
anyway with the premises flagged — the correct handling. M2 also imports B0's best property instead of
competing with it: five small sheets a person reads end to end.

**One further disclosure I credit under W13:** §11's last paragraph states that if the founder's five
criteria are a closed list, **M2 is inadmissible on the founder's own gate and should be withdrawn rather
than argued.** A candidate that names the condition under which it should be withdrawn is not flattering
itself.

---
# M3 — Workflow-first, no agents

**W4 (cost and capacity under subscription): SUFFICIENT.**
**W13 (alternative depth and comparator honesty): SUFFICIENT.**

The strongest candidate on unit discipline and on loop control. Its findings are about mechanisms it named
correctly and then under-built.

## What landed

**The zero-allowance step kind is the only structural capacity claim in the round that does not depend on
the concurrency pin.** §2's step-kind table has a column "Consumes provider allowance" with `compute` at
**None**, `human` and `professional` at **No**, `model` at Yes. §4 then draws the consequence: "every
`compute` step costs zero provider allowance, and determinism is the only lever that reduces subscription
consumption without reducing work [R8 B-7]. M3 maximises the zero-allowance share by construction." Then,
immediately and without being asked: "Whether that outweighs the per-step cache cost is **UNKNOWN** and must
be reported as a ratio between arms, because no absolute weekly denominator is published [R8 W-6]." Claim,
counter-cost and denominator caveat in three consecutive sentences is the correct shape and no other
candidate produces it.

**M3 names the only capacity unit in the round that is measurable today.** §10: "The binding resource under
a subscription is **admitted work per period, which is measurable today**, rather than executor count, which
is not." Against W-6's missing denominator, that is a usable substitute and it is the round's most practical
economic sentence.

**E4 is closed, and M3 is the only candidate that closes it.** §6.4 gives bounded retry **by error class**,
and the class list includes `provider capacity`, `no progress`, `stale context` and `competence gap`. Then:
"Model step fails semantically — **one retry** after a changed input, environment or method. **Two failures
with the same cause open a `Blocker`**; they do not prove impossibility." A named ceiling, a named trigger, a
named terminal state, and an explicit refusal to read exhaustion as proof of impossibility. §6.4 also names
the four silent-drop shapes and requires a destination, a retention longer than the source's, an alarm with a
reader, and a **count** for each — shedding without a count being "indistinguishable from a silent drop after
the fact."

**Removal criteria are structural rather than promised.** §6.5: "Every model step declares the validator that
would have to fail for the step to be necessary. When a newer model passes the validator with the step merged
into its neighbour or removed, the step is removed." Plus collapse-on-no-variation, plus procedure
retirement with a window. §10 says the default direction of travel is toward less machinery. Compare M1's
delegated "in the mechanism's own contract otherwise."

## Findings

**AE-M3-01 · (b) · E1/E2 · The reserve-fill rule is narrower than the waste it was written to prevent.**
*Passage:* §7 F-2 — "M3's scheduler therefore fills reserved-but-idle capacity with the highest-value
admitted work **in the reserving class** rather than protecting the reserve as thrift."
*Counterexample:* the mechanism this answers is R8 §3's finding that the reset window fires whether consumed
or not, so a reservation is waste rather than thrift. Filling within the class does not discharge it. If the
continuity/security/grievance class holds 15% and has no admitted work this week, that 15% is destroyed at
the reset exactly as if the rule did not exist. M2's equivalent releases unconsumed reservation **to the
general pool** at a declared lapse point, which is the mechanism that actually prevents the loss; M3 stops
one step short and states the stronger principle it does not implement.
*Required contract:* a cross-class release at a declared lapse point before the reset, plus a stated
precedence for which class receives released capacity, plus a record of how much lapsed unconsumed — the
last being the only way anyone learns the reserve shares are wrong.

**AE-M3-02 · (b) · E5 · The F-2 answer never states the fixture's disposition, and never names the
unblocking act.**
*Passage:* §7 F-2 opens at 1× and 2×, concedes indistinguishability, then proceeds directly to "**At 4×**,
what is shed and by whose authority. The scheduler sheds…"
*Counterexample:* R2 F-19 establishes that "F-2's 4× demand fixture cannot be run at all without a reviewed
`CapacityPlan` revision", and raising CP1 is circular (X14, R8 TC-39). M3 cites neither F-19 nor the
CapacityPlan revision anywhere in the document. §4 does say "four claim verdicts in this round are
unmeasurable" at the pin, and the F-2 answer does mark the coordination-cost figure UNKNOWN — so M3 does not
claim a pass. But a reader of the fixture answer alone gets a mechanism described at a demand level the
system cannot reach, with no disposition attached. M1 and M2 both state it in their first sentence on the
fixture.
*This is a presentation failure of an honest position, not a dishonest position* — which is exactly the
shape negative control 10 exists to catch, and M3 passes the control's substance while failing its form.
*Required contract:* the disposition in the fixture answer — not executable at CP1, measurement owed, blocked
on a reviewed `CapacityPlan` revision — and the named owner of that revision decision, which X14 leaves open.

**AE-M3-03 · (c) · E1 · The per-step cacheless launch is named as M3's own counter-cost and is then charged
to nothing.**
*Passage:* §9.2 — "M3 does not convert this into an advantage for itself, because the four mechanisms are
replaced in M3 by a different cost — **a fresh, cacheless launch per step**. **UNKNOWN**… B0's weekly draw
against a step-based arm at matched accepted outcomes, reported as a ratio [D-06]."
*Counterexample, and it is the structural risk of this candidate:* M3's stated scaling story is "more
deterministic steps per accepted outcome", and §10 Provider dependence confirms "**no session resumption**".
So every `model` step is a cache miss by construction — R8 B-6's second mechanism, in which a request after
the cache lifetime "reprocesses your full context", applies to every step rather than to occasional breaks.
The design's growth direction and its dominant unpriced cost point the same way. Yet no `Procedure` field
budgets launches per procedure version, no step carries an expected-cost field, and nothing requires a
procedure author to justify a step split on capacity grounds. Compare M1, which puts `expected_cost` in
launches and quota bucket on the record that authorises the split.
*The (c) classing is generous and I say why:* D-06 names the discriminator, which is more than an assertion.
It is missing the rest of protocol §5's (c) requirements — no baseline, no unit, no repetition count, no
stopping rule, no owner.
*Required contract:* an expected-launch count declared per procedure version and checked against actual at
run close; and D-06 written out as a full protocol with baseline, unit, repetition, stopping rule and owner.

**AE-M3-04 · (b) · E3 · The metered answer is the round's best and is described as the only one available,
which its own inherited specification contradicts.**
*Passage:* §10 Provider dependence — "the metered path is one in-product setting away at both providers with
nothing observing it [R8 W-5, FAL-10]. **M3's answer to the second is the only one available: the account
setting is an observed fact with a named observer and a journal entry when it changes** [X20]."
*Credit first:* a named observer plus a journal entry on change is the strongest E3 answer of the five. It
converts a policy into an observation with an owner, which is what X20 asks for, and §8's binding row 41
records it as "FOUNDER CONSTRAINT, mechanised".
*Counterexample to "the only one available":* `07` §6, which M3 inherits, supplies a stronger response than a
journal entry — "uncertain billing **quarantines** affected launch/release", and custodian billing
observations "expire… immediately on a relevant auth/plan/credit event". A quarantine is a response; a
journal entry is a record. M3 has the observation and declines the response that its own substrate already
specifies, while calling the record the only option.
*Also unpriced, as in every candidate:* enabling credits drops the prompt-cache lifetime from an hour to five
minutes (R8 W-5). In a design that is already cacheless per step this matters least of the five, but it is
the mechanism by which the metered flip raises the **subscription** draw too, and no candidate prices it.
*Required contract:* bind the observation to `07` §6's quarantine response and to `07` §5's `AuthAttestation`
refresh cadence, and drop "the only one available".

## E7 — operational mechanisms M3 requires standing

**Second-lowest count, highest per-item authoring burden, and M3 says so.** The standing machinery is small
and enumerated by the candidate itself: "The engine, the loader, the gate and three policy objects are the
whole of it" — plus the Journal, the RouteTable, `unclassified-work/v1` with its triage custodian and maximum
age, the fixed control pool re-run on a cadence shorter than provider release cadence, the catalog
eligibility filter, and the metered-path observer. Roughly ten.

**The cost is displaced rather than removed, and §10 is explicit:** "The real complexity is **authoring**:
every procedure must declare read sets, grants, validators, branch sets and compensation. **UNKNOWN:**
authoring and maintenance effort in any unit, for any arrangement — the maintenance half of every
specialist-versus-procedure comparison is unevaluable because nobody has measured it [MG-15]." So M3's
dominant operational cost is unquantified, and it is the only one of the five whose dominant cost is
**human authoring time** rather than provider capacity — which under DIRECTIVE §8.21's requirement to model
"the opportunity cost of founder attention" is the row that should carry it, and does not.

**Two items with no removal criterion despite §6.5's general rule:** the three policy objects and the
`unclassified-work/v1` triage path. Everything else has one.

## E5 — F-2 honesty

**Honest in substance, deficient in form** — AE-M3-02. M3 concedes 1× and 2× indistinguishability from both
S1.0 **and** B0 before making any claim, states "Any candidate claiming a difference here is claiming
something the pin forbids", refuses to offer a token comparison by name against negative control 7, and
reports launches, quota buckets, wall-clock occupancy and owner attention separately. It does not pretend to
pass and it does not argue the pin away. It also never says the fixture cannot be run.

## E6 — comparator honesty

**Against S1.0: sufficient, and unusual in direction.** "M3 is not a different philosophy from S1.0; it is
S1.0 with **four mechanisms deleted**", with a table naming each deletion and its consequence — including
"**This is M3's largest real loss**" against private decomposition by a native performer. A candidate that
labels its own largest loss inside the comparator table is not flattering itself. It then states what it owes
that S1.0 does not, and classes its own answer as "**HYPOTHESIS, not established** … Nobody has measured
either side."

**Against B0: sufficient, and the round's cleanest handling of FAL-01.** §9.2 grants B0 its scripts,
checklists, human review and readable record, then says M3 **keeps** the readable-record strength in full
rather than competing with it. On FAL-01: "**M3 claims nothing from it** … because the four mechanisms are
replaced in M3 by a different cost — a fresh, cacheless launch per step." Refusing to convert a falsifier of
a rival's granted strength into an advantage for yourself is the exact discipline protocol §6 is asking for,
and M3 is the only candidate that states the refusal as a rule.

**When a smaller system wins, stated as a condition rather than a caveat:** "B0 loses only F-3 and F-4, and
it loses both structurally rather than by degree. So: if these ventures never need a task composing three
permissions and never need an acceptance the producer could not influence, **B0 is the correct design and M3
is over-built**. That is M3's removal criterion as a whole system." And §9.2 closes with "**Read M3 as the
smallest thing that is not B0**", with every mechanism beyond two named additions owing its own separate
justification. That is the clearest statement in the round of the condition under which the round should
output a smaller system.

---
# M4 — Hybrid by consequence class

**W4 (cost and capacity under subscription): INSUFFICIENT.**
**W13 (alternative depth and comparator honesty): SUFFICIENT.**

W13 is strong and carries the round's most executable self-falsifier. W4 fails on one mechanism: M4 gives a
standing holder a **veto** over shedding its own reserved lane, with no override named anywhere, and that is
the exact failure mode R8 names for chartered persistence.

## What landed

**The §9.2 falsifier is the most executable in the round and it is aimed at M4's own foundation.** "Count the
derived class of every action admitted over a fixed window. **If more than 90% derive to C0 or C1, M4's added
structure is not paid for**, the correct output is a smaller system … It needs no runtime beyond the
derivation function and a month of admitted work." A second one follows immediately: if the derivation and
the declared floor agree on every action over a window, "the derivation adds nothing the floor did not
already say and **should be deleted in favour of the floor**." Both run at CP1. Both would retire the
candidate's central primitive.

**The discriminating test against negative control 1 is offered by M4 against itself.** §9.1: take one
action, change **only** its consequence class — draft an internal note, then the identical text as an outward
customer promise — and name the four records that must differ. "If a reader runs that test and observes no
difference, the candidate is S1.0 with new nouns and negative control 1 should fail it."

**F-2's disposition is stated in full and the two things measurable at the pin are committed to** — admitted
work per period, and coordination minutes and transmitted context bytes counted separately from work
performed. Token multiples are refused by name against negative control 7, and the ratio-only rule is stated.

## Findings

**AE-M4-01 · (d) · E2 · A standing holder can veto the shedding of its own reserved lane, and no override
exists.**
*Passage:* §7.2 — "**Every reservation has a holder, and only its holder may shed it.** … Protected lanes —
due service, grievance, recovery, maintenance — are held by the standing holder for that duty class, and the
shed is **refused** without that holder's consent." Restated in §8: "shedding one needs that holder's consent
**or is refused**."
*Counterexample — the probe as put:* the weekly bucket empties Wednesday, a refund is due Thursday and a
supplier reply Friday. Four protected lanes are held by H2, H3, H6 and H7. Each holder's mandate says its
duty must not slip, so each refuses. The shed is refused four times. Capacity does not appear because a
reservation was defended; the bucket is still empty; work stops undirected, wherever each run happens to be,
which is the one outcome the whole shedding apparatus exists to prevent. Nothing in M4 names who resolves
this. C01, C02 and the founder are all absent from the sentence, and §11's (d) list does not contain it.
*Why this is (d) and not a tuning question:* two implementers will invent two different companies. One makes
the scheduler override a refusing holder, which deletes the mechanism M4 says is its whole contribution at
F-2. The other holds the refusal and lets the founder arbitrate, which puts a capacity deadlock on the
founder's desk at every pressure event and fails W12. There is no default to fall back on, because `07` §6
has no holder concept for its class reservations.
*And this is the named failure of the design family, not a new discovery:* R8 §8 states the failure of
chartered persistence as "**a charter defends its mandate against admission narrowing, which CP-13 requires
and no charter is obliged to accept**." M4 cites R8 A-4 for the representative and does not carry A-4's
companion warning. The sibling candidate that takes the same steelman writes the prohibition explicitly — a
holder "may negotiate, never veto", "may not refuse admission narrowing, and may not defend its own mandate"
— which establishes that the obligation was available to be written and is not an artifact of hindsight.
*Required contract:* a stated decider when a protected-lane holder refuses, with the holder's minimum as
**evidence rather than consent**; a bound on how long a refusal may stand; and a record of refusals that
outlived their deadline, so a holder that always refuses is visible.

**AE-M4-02 · (b) · E3 · Silent on the metered path.**
*Passage:* none. Metered, credits, paid usage, spend limit and API fallback do not occur in this candidate in
any capacity sense.
*Counterexample:* DIRECTIVE §8.21 requires preventing silent fallback to a metered API path and explicit
policy for any additional paid usage. §10 Provider dependence discusses the enforcement point and says "M4
depends on no provider feature not already in the specification", which is the paragraph where the
affordance belongs and where its absence is most visible. The affordance surfaces at the moment of
exhaustion — the same moment M4's veto (AE-M4-01) can deadlock the shed — so the two findings compound: a
deadlocked shed leaves whoever is at the terminal facing a one-click offer to buy capacity, with no observer
and no rule.
*Why (b) and not (d):* as for M2, `07` §5's pre-launch `AuthAttestation` carries "API-key override absence
and approved credit settings", and M4 retains `07` unchanged. The observation exists upstream, unnamed here.
*Required contract:* name the observation point and its response, and add the metered-offer event to the shed
record, since that is where it will actually appear.

**AE-M4-03 · (b) · E1/E2 · The return-to-pool rule requires an act that the veto lets a holder withhold.**
*Passage:* §7.2 — "**A declined reservation returns to the pool immediately.** Allowance does not roll over —
the window resets whether consumed or not, so reserved-but-unconsumed capacity is destroyed rather than
saved [R8 §3]." §8 restates it: "Unused remainder returns to the pool within the window."
*Counterexample:* the principle is quoted correctly and the mechanism is conditional on a **decline**. A
holder that neither uses nor declines its reservation destroys it at the reset, and under AE-M4-01 that
holder cannot be compelled. M2's equivalent is unconditional and time-triggered — a declared lapse point
before the reset, after which unconsumed reservation releases automatically and the holder is *notified, not
asked*. M4 states the same finding and builds the version that a defending holder can defeat.
*Required contract:* a time-triggered lapse point per lane, independent of the holder's consent, plus a
recorded quantity of allowance that lapsed unconsumed per lane per window — which is also the only
instrument that would reveal that the nine holders' reservations are mis-sized.

**AE-M4-04 · (b) · E4 · No retry ceiling and no no-progress class.**
*Passage:* none for iteration. §11 item 7 closes delegation depth with an owner (C02) and a checkpoint at
subagent start; `budget_exhausted` exists as a **typing** outcome only (§7.1).
*Counterexample:* the non-terminating validator. At C2 and above M4 requires re-derivation and re-read of
epochs before every release; a run that fails its acceptance criterion re-prepares, re-derives and
re-attempts, each cycle a launch. Nothing caps the cycles, nothing classes "no progress" as an error, and
nobody is told. M4's answer to runaway **delegation** is adequate and inherited; its answer to runaway
**iteration** does not exist. The sibling workflow candidate closes this with one sentence — one retry, then
a `Blocker` on two failures with the same cause — so the gap is not inherent to the design family.
*Required contract:* an attempt ceiling per work order with a named owner, a `no progress` error class, and a
recipient told when a lane's consumption produces no accepted outcome across a reset window.

**AE-M4-05 · (c) · E7 · Nine holder records are recurring human labour that is never priced in any unit.**
*Passage:* §10 — "the holders are records with review dates, **which is recurring human labour**"; §2.5 gives
each holder a `review_date` and a retirement test over "two consecutive review periods"; §9.2 concedes "nine
holders, five structures and a derived class is more than one record a person reads end to end".
*Counterexample:* DIRECTIVE §8.21 requires modelling "the opportunity cost of founder attention" as an
economic category. M4 names the labour in prose and gives it no unit, no period length, no holder-hours
estimate and no ceiling. Nine addresses must be answered, nine mandates kept current, nine alternates kept
real, nine suspension procedures kept executable, on a review cadence whose length is never stated. §9.2's
own admission that M4 is worse than B0 on founder legibility is the qualitative half of a quantity that is
never given.
*Required contract:* review-period length, an estimated holder-hours-per-period figure with the denominator
that produced it, and a stated behaviour when holder review collides with a capacity-pressure window.

## E7 — operational mechanisms M4 requires standing

Five new items on top of retained S1.0: the `ConsequenceDerivation` function (one implementation, C5 to
change, explicitly a single correlated point of failure), nine `StandingHolder` records with addresses,
mandates, alternates, suspension procedures and review dates, the class-keyed mapping table (data, C5 to
change), the class-keyed seam rule, and the named interval between declared-done and accepted. Plus nine
intake addresses that must be answered and nine review cycles.

**Removal criteria: two of five.** `StandingHolder` has a real one — empty intake and an unrun clock across
two consecutive review periods, never while a duty is live. The derivation has one, and it is unusually good:
delete it if it never disagrees with the floor. The mapping table, the seam rule and the interval holder have
none.

**M4's honesty about its own complexity is above average and its arithmetic is absent.** §10 lists "more
machinery: one extra record per operation, nine holder records, a mapping table and a two-phase derivation,
against S1.0's single production rule", and §9.2 concedes the legibility loss. What is missing is any unit —
AE-M4-05.

## E5 — F-2 honesty

**Honest, and tied with M1 and M2 for the best handling.** "**At the current pin the fixture is not
executable**: CP1 admits one native job plus one external job, so counts above two serialise and the sweep
would measure serialisation rather than coordination overhead [R2 F-19, R8 TC-20, AG-13]. Reporting F-2 as
passed on a projection would be negative control 10 in a different costume. **F-2's coordination-cost-per-unit
measurement is owed and blocked on a reviewed CapacityPlan revision.**" It then commits to the two quantities
that are measurable at the pin rather than stopping at the refusal, which is better than a bare disposition.
It does not argue the pin away. X14's ownership question is left open here as everywhere.

## E6 — comparator honesty

**Against S1.0: sufficient, and it takes the hardest available form.** M4 lists what it retains **and claims
as S1.0's** before listing what is new, states "M4 renames none of it", and then hands the reader the
discriminating test that would fail it under negative control 1. It carries R8 W-4's roster objection against
its own nine holders rather than answering it, and registers the one-month profile count as owed: "Nothing
measures this and M4 registers it as owed."

**Against B0: sufficient.** FAL-01 and FAL-02 are stated in full with "**M4 claims no credit for falsifying
them**". B0 is then granted its remaining strengths including the one that costs M4 most — the single record
a person reads end to end, "which M4's narrowed delivery **structurally cannot supply** without a separate
unfiltered surface". M4 quotes the R7 verification finding against itself, restricts its own wins to F-3, F-4,
F-5 and F-1's adverse variation, and explicitly refuses to score the F-3 win as an empirical result because
it is entailed by the frozen boundaries (FAL-13). **Where M4 loses is a titled paragraph**, naming
indistinguishability from B0 at 1× on C0/C1 work and inferior founder legibility. And the 90%-C0/C1 falsifier
names the condition under which the round should output a smaller system, with the measurement attached.

---
# M5 — Subscription-activated capabilities around a shared record

**W4 (cost and capacity under subscription): SUFFICIENT.**
**W13 (alternative depth and comparator honesty): SUFFICIENT.**

The most capacity-aware candidate of the five, and the only one that converts the subscription constraint
into a schema field and an enforcement rule rather than into prose. Its economic risk is binary, named by
the candidate itself in its founder summary, and left without an evaluation protocol — which is the finding.

## What landed

**The terminology collision is resolved in the first paragraph and that is not cosmetic.** §0: coordination
by subscription is "a standing interest", its firing is "arming", and the provider plans are "the provider
allowance". "The two never share a word again." A candidate named for subscription that is also judged on
subscription capacity could have equivocated for eighty thousand characters. It does not.

**`budget` is a mandatory field on every standing interest, and its unit is launches, wall clock and
allowance class — not tokens.** No other candidate makes the capacity unit a required schema field on the
object that consumes capacity. `CapacityState` is a first-class entry kind carrying "source, observed-at,
valid-until, bucket, **remaining-or-unknown**, confidence" with a named capacity observer identity —
`remaining-or-unknown` being the field that respects W-6's missing denominator instead of forcing a number.

**The `credit-setting` interest is the round's only real answer to X20.** §7 F-2: it "arms on a changed or
stale-beyond-24h observation of the provider's credit configuration and **halts new launches in that
class**." That is an observation point, a staleness cadence inherited from `07` §6, **and a response** — the
third element every other candidate omits. And it is stated with its exact limit: "**It observes; it does
not prevent a person from flipping the setting.**" Three candidates name the affordance; only this one
attaches a consequence to noticing it.

**The re-arming loop is bounded by a mechanism written against a named prior defect, and the bound is not
oversold.** §3.4 answers the composed-disturbance loop with a per-cause allowance "fingerprinted by stable
cause and scope rather than by wording or by a new identity", a non-borrowable due-service floor, and an
overflow count. Then: "T07's own assessment of C's equivalent bounds is that they 'defeat simple infinite
recursion. They do not yet establish useful progress under sustained novel disturbance.' **That is true of
M5's bounds too.**" A candidate quoting a prior review's verdict against its own copy of the mechanism is
doing the reviewer's work honestly.

**M5 states its own worst case in the founder summary, unprompted.** §1: "If your conditions cannot be
written as deterministic checks over typed fields, every record change costs a launch and **M5 becomes the
most expensive candidate here**."

## Findings

**AE-M5-01 · (c) · E1 · The design's own sharpest economic falsifier carries no evaluation protocol, while
six less consequential questions do.**
*Passage:* §1 — "no arming condition may call a model … every record change costs a launch and M5 becomes the
most expensive candidate here"; §7 F-2 — "**If that rule were relaxed for even one precondition class, M5
would become the most expensive candidate here.** That is the design's sharpest falsifier"; §10 — "the whole
design rests on the company's work being expressible as deterministic predicates over typed fields, **which
nobody has tried**."
*Counterexample:* §11's (c)-class list carries named protocols for the novel-work arrival rate, duplicated
external effects, joint false acceptance, founder-competence transfer, selection degradation over the
interest catalogue, and authoring effort. **The fraction of the company's conditions that are expressible as
deterministic predicates over typed fields is not on that list**, and it is the quantity on which every
capacity claim in the candidate depends. Between "all conditions are expressible" and "most are not", M5 is
either the cheapest candidate in the round or the most expensive, and nothing here narrows the range.
*Aggravating:* the measurement is cheap and needs no runtime, in the same class as the novel-work count M5
itself calls "the cheapest item in the round": take a month of admitted work, attempt to write each
relevance condition as a typed predicate, and report the fraction that requires interpretation.
*Required contract:* that count, with a baseline, a unit (conditions), a stopping rule, and an owner — and a
stated threshold below which the candidate is withdrawn rather than relaxed, because relaxing the rule is
what turns it into the most expensive design.

**AE-M5-02 · (c) · E4 · The per-cause allowance bounds the re-arming loop and its size is set by nobody.**
*Passage:* §3.4 — "re-arming on the same semantic cause consumes a **per-cause allowance**, fingerprinted by
stable cause and scope"; §12 ledger, which flags "#19 (the size of the per-cause allowance)" as a design
proposal resting on **no finding**.
*Counterexample — the probe as put:* a standing interest re-arms on a condition that keeps re-satisfying.
The allowance caps it. Set generously, a cascade consumes the discretionary and ordinary-creation shares
before anyone notices; set tightly, legitimate re-arming on a genuinely recurring cause is suppressed and
the suppression looks like quiet correctness. Two implementers produce two different companies under
disturbance.
*Why (c) and not (d):* the blast radius is bounded — the due-service floor is non-borrowable by a cascade,
and the overflow count is required — so the invented policy cannot reach the protected class. And M5 flags
the parameter itself rather than burying it. That is the difference between an open parameter and a missing
decision.
*Required contract:* the allowance expressed in `07` §6 units per cause class, an owner, and a recorded
count of causes that exhausted their allowance in a window — the last being what tells the founder the
number is wrong.

**AE-M5-03 · (b) · E2 · The protected floors are shares of an allowance that may be zero, and no non-model
performer is named for a due obligation past exhaustion.**
*Passage:* §7 F-2 — the Authority "may never shed the 50% due-service floor or the 15% continuity, security
and grievance reserve".
*Counterexample — the probe as put:* the weekly bucket empties Wednesday, the refund is due Thursday, the
supplier reply Friday, the reset is Sunday. Fifty per cent of an exhausted bucket is nothing. M5's capacity
packet does show the founder "each crossed latest responsible time with its owner", which is the most
visible failure of the five — a crossed deadline surfaces with a named owner rather than as a silence — but
visibility is not performance, and nobody is named to perform the refund.
*M5 is closer to the answer than M1, M2 or M4 and does not take the last step:* `production_mode` is a
mandatory field carrying `02` §3's five-way rule including capable people and qualified professionals, and
`budget` carries an `allowance class`, so an interest whose production mode is a person is structurally
capable of activating at zero provider allowance. M5 never says this is the exhaustion path. The most
explicit statement of the same structural fact in the round is M3's step-kind table, which gives `human` and
`professional` an explicit "no" in a column headed "consumes provider allowance".
*Required contract:* an exhaustion rule distinct from the pressure rule, naming the non-model production
mode that carries a due obligation past exhaustion, who is alerted, and what record the perform-or-breach
decision leaves.

**AE-M5-04 · (b) · E5 · The F-2 disposition is correct and is stated two sections away from the fixture.**
*Passage:* §11 — "**F-2 cannot be run against M5 until it is settled**, and settling it is an account
inspection, not an experiment." The §7 F-2 answer itself proceeds from "At 4× the armed set grows roughly
fourfold and the admitted set stays at two" without that disposition, noting only that raising the pin "is
an unmeasured change [X14]".
*Credit, and it is substantial:* "**settling it is an account inspection, not an experiment**" is the
sharpest sentence in the round on X14. Axis X14 asks whether the concurrency pin is a provider constraint or
a self-imposed policy and leaves the question unowned; M5 is the only candidate that says what would settle
it and that it is not an experiment at all. M1 and M4 name the unblocking act as a reviewed `CapacityPlan`
revision, which is the step *after* this one.
*Counterexample:* a reader of the fixture answer alone sees 4× behaviour described with no disposition
attached, which is the form negative control 10 guards against even when the substance is honest. Same
finding as AE-M3-02, and milder.
*Required contract:* the disposition in the fixture answer, with §11's account-inspection sentence attached
to it.

## E7 — operational mechanisms M5 requires standing

**Highest coupling of the five, and the count is not the right measure of it.** The standing machinery: the
interest catalogue, where each interest carries an owner, a precondition, a budget, **six tests including a
paired clean case it must not fire on**, a latest-responsible-time rule, a removal criterion, a review date
and an expiry; the Admission Authority with five verbs and five prohibitions; the effect allocator; the
unmatched pool with its retention and alarm; the capacity observer; the `credit-setting` interest; eleven
entry kinds each with a sole writer; per-entry-class projection rules **for every reader**; and the standing
`contradiction`, `unowned-duty`, `next-action` and merge interests.

**Removal criteria are the best-enforced in the round, because `removal_criterion` is a mandatory schema
field** on every standing interest rather than a promise in prose (§2.2). §10's claim that "every mechanism
carries a removal criterion" is therefore true of the object that proliferates. It is **not** demonstrated
for the fixed core — the Admission Authority, the effect allocator and the unmatched pool have none — so the
claim is broader than the mechanism, the same overreach as M1's but over a much smaller residue.

**The dominant cost is authoring and is marked unknown:** §10 lists "Authorship and maintenance of interests,
drift in what a precondition means, missing-event detection, clock and fencing behaviour, retention on the
unmatched pool, restoration rehearsals, and per-entry-class projection rules for every reader. **UNKNOWN:**
authoring and maintenance effort in any unit is unmeasured anywhere [MG-15], so the maintenance half of this
design is unevaluable today." That is the same unmeasured quantity M3 names, over a larger surface.

## E5 — F-2 honesty

**Honest, with the disposition misplaced** — AE-M5-04. M5 does not pretend to pass, does not argue the pin
away, names the observable at 4× as "queue depth and crossed latest-responsible-times, **not a token
multiple**", states the W-6 denominator rule in the fixture, and shows the founder "what raising the
concurrency pin would restore — with the note that raising it is an unmeasured change". It is the only
candidate to say what settling X14 requires.

## E6 — comparator honesty

**Against S1.0: sufficient.** "Delete standing interests and keep the rest: you have S1.0." The problem that
returns is named concretely — work whose relevance nobody currently holds in mind — and given a falsifier
that costs nothing and needs no software: if scheduled review already surfaces every such item within its
latest responsible time over one month, "M5's central mechanism buys nothing and should be removed." M5 then
lists what it costs against S1.0 including a failure S1.0 does not have, the stale interest.

**Against B0: sufficient, and the refusal is unusually direct.** "**M5's honest claim against B0 is narrow.
It is not quality, not cost, and not latency.**" B0 is granted its full strengths, then granted three
specific wins with citations — the 28.6% F1 checker ceiling, single-agent parity at matched reasoning
budget, and the founder-competence advantage of a readable record, on which M5 declines to advance FAL-11
as a defect "and neither do I". FAL-01 and FAL-02 are attributed to sources "not by me". The B0-wins
condition is stated as a rule the round must apply: "If the founder's attention is in fact sufficient at
these ventures' demand level, the protocol's §6 rule applies and **the correct output of this round is a
smaller system**."

**A third comparator nobody required, run against itself.** §9.3 compares M5 to a deferred candidate C and
to C2, states which of C's reviewed defects M5 inherits — "**T08 … is inherited in full and is not made
better by M5**" — and names exactly what M5 declines to buy from C2 and what breaks if the cheap half turns
out to be insufficient. §10 then closes with six concrete conditions under which M5 is the wrong design,
including the one that would retire it outright: if the interest set converges to a handful of recurring
profiles, "M5 has a roster it discovered rather than declared."

---
# E8 — Cross-candidate

## E8.1 A capacity-consumption ordering, with every step labelled

**Read this as ordinal and conditional. It is not a measurement and it cannot become one in this round.**
W-6 establishes that the provider publishes no absolute weekly allowance, so no arm can be expressed as a
fraction of the week; every statement below is a comparison between arms. No runtime exists and nothing
below was executed.

### Assumptions, listed before the argument

| # | Assumption | If it is wrong |
|---|---|---|
| **A1** | CP1 holds: one native job plus one external job, and the Codex profile is **not yet admitted** (`07` §5), so the effective native concurrency is one | Every "they all serialise" step collapses and the ordering must be recomputed |
| **A2** | Each candidate's specified behaviour is what would be built. This is the same assumption R2 F-18 and F-19 rest on | The ordering describes documents, not systems |
| **A3** | No absolute weekly denominator exists (W-6) | An ordering could become a magnitude |
| **A4** | A model launch draws the weekly bucket; deterministic computation, a person and a professional draw none (R8 B-7, `07` §6) | Step 2 fails entirely |
| **A5** | R8 B-6's four mechanisms hold: full conversation resent per request and per tool batch; cache miss after the lifetime, an hour on subscription and five minutes with credits enabled; compaction is itself a large request; idle check-ins send full context | Step 4 fails, and the top of the ordering is unsettled |
| **A6** | The work mix is unknown — the share that is low-consequence, and the share whose relevance conditions are expressible as typed predicates | Steps 5 and 6 both move. This is the dominant uncertainty |

### The argument

**Step 1 · INFERENCE.** At 1× and 2× demand, CP1 binds all five candidates identically, and all five are
indistinguishable from S1.0 and from each other on every concurrency-dependent unit. Four of the five state
this in their own words (M1 §9.2 item 1, M2 §7 F-2, M3 §7 F-2, M4 §9.2). **So this ordering can only be
about non-concurrency units** — launches per accepted outcome and quota bucket per accepted outcome — and it
carries no information at all at 1×.

**Step 2 · INFERENCE.** At fixed delivered work, the only architectural lever that changes provider
consumption is the **fraction of work carried by non-model production modes** (R8 B-7, cited by all five).
Ordering the five therefore reduces to ordering their structural zero-allowance shares.

**Step 3 · INFERENCE, on structural zero-allowance share.**
- **M3 highest by construction.** Three of five step kinds consume no allowance; the stated scaling story is
  "more deterministic steps per accepted outcome"; §6.5's collapse rule actively converts model steps into
  `compute` steps when a validator still passes; and no model may select a branch at all.
- **M5 high and bimodal.** The most frequently evaluated thing in the system — arming, re-run after every
  committed record transition — is deterministic by a hard rule. If the rule holds, M5 sits beside M3. If it
  does not, M5 is by its own statement the most expensive candidate here (AE-M5-01).
- **M4 middle, and tracking the work mix rather than the design.** W costs no allowance and the derivation
  is deterministic, but structure is selected per action, so the zero-allowance share follows the C0/C1
  fraction. The design does not push it up.
- **M1 middle-to-high consumption.** The consequence-class reason fires on the commonest shape in the
  company — draft versus release — and M1 states that it "will create more executors than the founder's five
  would" and "accepts that cost deliberately". At CP1 more executors are more serialised launches, each a
  fresh context.
- **M2 highest consumption.** Its production path is S1.0's, unchanged, **plus** two additions: one decision
  probe per consequential action under a chartered duty (AE-M2-02) and a recurring evaluation cadence over
  five charters (AE-M2-03). Both are pure additions to the same bucket. M2 cannot be cheaper than the
  incumbent on the same work, and says as much — "charters buy no allowance".

**Step 4 · INFERENCE, and it is the step most likely to be wrong.** The bucket draw is the product of launch
count and context per launch, not launch count alone (A5). A design that splits work into more, smaller
launches pays the cache-miss mechanism more often — M3 pays it on every step, by its own admission — but
carries the narrowest read set per launch. **Nobody in this round has the data to compute that product**, and
none of the five claims to. This uncertainty can invert positions 1 and 2 against 3, and it is the substance
of AE-M3-03.

**Step 5 · INFERENCE, the ordering.** Least to most scarce capacity consumed per accepted outcome, at a work
mix with a substantial deterministic share:

| Rank | Candidate | The one sentence that puts it there |
|---|---|---|
| 1 (least) | **M3** | Three of five step kinds draw nothing and the design's direction of travel is toward more of them |
| 2 | **M5** | The highest-frequency evaluation in the system is deterministic by rule — **conditional on that rule surviving contact with real conditions** |
| 3 | **M4** | Zero-allowance share follows the work's consequence mix rather than the design |
| 4 | **M1** | Its own strongest new existence reason fires on the commonest shape and creates more executors |
| 5 (most) | **M2** | S1.0's production path plus a per-action probe plus a scheduled evaluation cadence |

**Step 6 · INFERENCE, the inversions, stated because a single ordering here would be false confidence.**
- If most relevance conditions are **not** expressible as typed predicates, M5 moves from 2 to 5 by its own
  account. This is the single largest swing in the table and the measurement that would settle it is cheap
  and unrun.
- If step counts are high without correspondingly narrow contexts, M3 moves from 1 toward the middle (Step 4).
- If more than 90% of actions derive to C0/C1, M4's position **does not move** — its own falsifier is about
  whether the structure is paid for, not about what it consumes. Cost stable, justification refuted.
- **M2's position is the most robust of the five**, because its two additions sit structurally on top of the
  incumbent rather than replacing anything. Being last here is not a defect of M2's honesty; it is what M2's
  own comparator section says.

## E8.2 Exposure to a provider changing its allowance

**INFERENCE throughout.** "Exposed" means: how much of the design must be re-decided, and by what mechanism,
if the provider changes the size or structure of the allowance.

**Most exposed — M4.** Nine holders hold reservations that are shares of an allowance nobody can observe
absolutely. An allowance cut requires resizing all nine. Under AE-M4-01 a protected-lane holder's consent is
required to shed and there is no override, so the resize has **no mechanism**: nine consents or refusal. The
design's response to the thing most likely to change is a negotiation with a veto at every seat.

**Second — M2.** Lane sizes and lapse points are already an open (d) routed to the founder (AE-M2-01), and an
allowance change invalidates whatever he decides, with no derivation to recompute from. Its `review_cadence`
is additionally defined *relative to the provider's model release cadence*, so a provider change moves the
schedule and the budget at once. M2 at least has the right shape — the shed is a decision with a recorded
authority and a holder's minimum is evidence rather than consent — so the re-decision is possible where M4's
is blocked.

**Third — M1.** `ShedDecision` makes shedding an authority act with a recorded order and a named authoriser
(C02 proposes, C01 authorises), and the shares come from `07` §6 unchanged. An allowance change resizes the
shares through the existing route. Moderate, and unremarkable.

**Second-least — M3.** The capacity policy is one of three **versioned policy objects external to every
procedure**. An allowance change is a new version of one data object with a named owner, and no procedure
changes. That is the cleanest re-decision surface of the five.

**Least exposed — M5, and by construction rather than by luck.** `CapacityState` is a first-class entry kind
carrying source, observed-at, valid-until, bucket, **remaining-or-unknown** and confidence, written by a
named capacity observer. A provider allowance change is, to M5, a record transition — the same event class
everything else in the design already reacts to. The `credit-setting` interest already demonstrates the
pattern for the adjacent case: arm on a changed or stale-beyond-24h observation and halt new launches. The
`remaining-or-unknown` field is the specific design decision that makes this hold, because it accepts W-6's
missing denominator into the schema instead of requiring a number the provider will not supply.

## E8.3 Three things all five get right, and three none of them close

**All five, without exception.** (i) Not one uses the 15× figure, or any token multiple, as a capacity model
— negative control 7 catches nobody. (ii) All five state that no absolute denominator exists and that every
figure is a ratio between arms; four quote W-6's "40% of the allowance" sentence as the thing that cannot be
written. (iii) All five refuse to report F-2 as passed, and all five cite R8 §3's finding that unused
allowance is destroyed rather than banked.

**None of the five closes these.**

1. **No candidate names a non-model performer for a due obligation past exhaustion.** Five independently
   formed candidates, one uniform gap. M1 forbids shedding the due-service minimum, M5 forbids shedding the
   floors, M4 lets a holder refuse, M2 alerts on a breached minimum, M3 parks the run with its owner — and
   none says who performs the refund on Thursday when the bucket emptied on Wednesday. The rule exists
   upstream in `07` §6 ("available manual/other-provider paths") and reached none of them. **Uniformity
   across five blind-formed candidates is evidence about the specification's visibility at this layer, not
   about five authors.**
2. **No candidate prices the cache-lifetime collapse that the metered flip causes.** R8 W-5 records that
   enabling credits drops the prompt-cache lifetime from an hour to five minutes. Only M1 carries the
   five-minute figure at all, and only for the parallel-executor case. So in every candidate, the metered
   affordance is modelled as a money and policy event and never as the **capacity** event it also is: taking
   it raises the draw on the subscription path too.
3. **No candidate owns X14.** All five state that the concurrency pin blocks F-2. M1 and M4 name the
   unblocking act as a reviewed `CapacityPlan` revision; M5 names what would settle the prior question
   — "an account inspection, not an experiment". **Nobody names who does it.** The round's highest-leverage
   open question, gating four claim verdicts, ends this step with five agreements that it is open and no
   owner.

---

## Reviewer's closing statement of limits

This review is one model, one family, one pass, reading five documents of 77k–108k characters each against
two dimensions. It is procedurally independent and not independent of error. I did not execute anything; no
runtime exists. I applied the bars named in my provenance header and did not read the excluded paths. Where
a candidate's §11 self-audit reached a finding before or better than I did, I have said so and said which of
us got there first. No aggregate score, no ranking beyond the labelled ordinal capacity ordering in E8.1, and
no recommendation is offered or implied. Dissent is preserved: M4's veto and M2's prohibition on veto are two
defensible readings of the same R8 finding, and I have recorded both positions rather than merging them.
