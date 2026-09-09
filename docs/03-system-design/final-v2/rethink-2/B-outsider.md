# Fixer B · the outsider · the control plane and the economics · 2026-09-06

```
posture:  B, control systems and organisational economics. Primary input review/thinker-B.md (B1–B23); the
          digest's eight convergences taken from this angle; thinker-A and thinker-C as cross-checks.
rule:     doctrine stands unless argued; founder rows (v1–v5, v54–v82) are proposed as FOUNDER ROW changes and
          never decided here; every fix names its mechanism, its path and its state (EXISTS · ABSENT · WISH);
          every recommendation carries a losing image with wins_if:. No schedule. Nothing built.
codes:    (THINKER: B3) a finding · (FACT: world.md n) a world fact · (MEASURED: A1) a measurement lane A took
          on this Mac · (NEW: On) a mechanism proposed here · (FOUNDER, proposed) a row only the founder moves
```

---

## 1 · The big idea as I read it

Keel is a company of agents wrapped around one person's judgement, and the durable thing it makes is not the fleet
but the record: what this founder decided, what was tried, what the world said back, and which checks predicted
which outcomes. Everything the vendors are shipping (dispatch, teams, messaging, scheduling, fleet pages, cost
fields) is the plant; what Keel owns is the controller and the ledger. Read as a control system, the plan has an
excellent actuator design (argv grants, a Sender with no model, staged-not-sent) and almost no sensor design: the
loop's inputs are the founder's taps and the runs' own reports, the founder's decision rate is unmeasured and
unbudgeted, and the only external sensor (the reconciliation) has nothing to read because no venture has a
stranger. What it must never lose is the four invariants of §0.3 and the asset of provenance on every decision with
a losing image beside it. What the thinkers' findings threaten is subtler than a defect: a controller tuned on its
own description converges on a consistent description, and a company whose scarcest input is uncounted will spend
it first and notice last. The fixes below add the sensors, budget the scarce input, make the enforcement layers
independent of the programs that will be written by the thing they constrain, and put the economics beside the
seat so the size of the bet is a number the founder sees.

---

## 2 · Fixes, one per finding

Each entry: **what changes** · **why this shape** · **cost, once** · **losing image · wins_if** · **how we would
know** · **founder?**

### B1 · The plan is a rung-4 artifact and its loop optimises the document

- **What changes.** A doctrine amendment, stated as one: *every rule names its mechanism, and every mechanism names
  its falsifier*. Every §L row gains `wins_if:` (the observation under which the mechanism is wrong) and
  `vendor_wins_if:` (the vendor surface that makes it redundant), the same two lines §J carries (NEW: O93). The plan
  header carries `confidence: LOW, rung 4 by §11.2` until one measured overnight exists. §21 gains one line: **rows
  whose text changed after the first measured overnight**, as a count against eighty-two (NEW: O93). The doctrine
  keeps "never re-litigated" for founder-originated rows and drops it for mechanism rows: a §L row is a hypothesis
  with a stated revision cost, and reopening one costs a `wins_if:` match, not an argument.
- **Why this shape.** A mechanism decided before contact with reality is specification debt; the doctrine currently
  prices its revision at the same level as the founder's words. The measurements lane A took falsify ten §L
  mechanisms as written (A1–A10) and the round found no way to say so except in prose. A `wins_if:` on a mechanism
  is what lets the first overnight change eighty rows without a rethink round.
- **Cost, once.** Eighty lines, written by whoever wrote the mechanism; one header line; one §21 line.
- **Losing image.** The plan as it stands, with mechanisms carrying founder-row status. `wins_if:` the first measured
  overnight changes fewer than one row in ten: the pre-build decisions were signal, and the falsifier lines were
  ceremony.
- **How we would know.** The §21 count. A third or more is what B1 predicts.
- **Founder?** No. Doctrine change, costed here; DECISIONS §1's "go, no building yet" is untouched.

### B2 · One unbuilt program is the whole enforcement point, and its author is what it constrains

- **What changes.** Two layers, made independent. **The floor is the vendor's:** `--restricted`, an explicit
  `--tools`, managed `permissions.deny`, `disableBypassPermissionsMode`, `blockReadsOutsideWorkingDirectories`
  (FACT: world.md 7, 8). `bin/run` composes above that floor and **cannot widen it**: a defect in `bin/run` produces
  a narrower run or a refused run, never a wider one, because the denies are in a file no process clears. **The four
  programs that touch the world** (`bin/send`, `bin/watch`, `bin/inbound`, `bin/run`) become a named trusted base
  (NEW: O97): `roster.yml`'s `kind: program` rows gain `world_touching: true`, `max_lines:`, `authored_by:`;
  `bin/check-stores` refuses a world-touching program over its line budget; their only admission test is
  `keel/fixtures/` (O78); their diffs are founder-line-reviewed. **The probe is authored apart from the launcher**
  (NEW: O82): `bin/probe` never imports `bin/run`, and asserts by attempting the operation, so a shared defect
  cannot pass itself.
- **Why this shape.** Defence in depth is a shape, not a review. The vendor already enforces the floor for free and
  B2's failure only exists if `bin/run` is the floor. A trusted base small enough to read is the one thing that makes
  founder line review a real act rather than a rubber stamp on twenty-six programs.
- **Cost, once.** Three fields on four roster rows; one lint; the probe written by a different lane than the
  launcher; the founder's reading time on four small programs (Q7).
- **Losing image.** `bin/run` as the enforcement point, reviewed single-family. `wins_if:` a year of probes in which
  every argv `bin/run` composed was inside the floor anyway, and no world-touching program grew past its budget.
- **How we would know.** Diff authorship by actor on the four programs; a probe that fails when `bin/run` is
  deliberately widened in the scratch house.
- **Founder?** Q7 (their hours).

### B3 · The founder's adjudication rate is the throughput bound and is unmodelled

- **What changes.** Founder decisions become a **metered capacity beside the window** (systemic redesign S1).
  `settings.yml` gains `decisions_per_window` seeded from a measurement (R27), and the decide queue gains admission
  control (NEW: O81): the Desk refuses to open a *which* when `backlog > decisions_per_window × intent.horizon`, and
  the refusal is a row, not a silence. A *which* carries `kind: fact | preference`, `cost_to_answer_bytes` (the byte
  size of what the founder must read, a measurement not an estimate), and `recommendation_shown:` (B16). **Build
  one option and a written second** becomes the default; both are built only when the *which* is `preference` and
  the two ten-word summaries cannot be separated, which is a founder-visible flag on the card. The briefing's first
  line is **decisions taken · deferred · defaulted, with the bytes each cost** (NEW: O102). A *which* is **claimed**
  by an Operator session before it renders an answer (NEW: O98), so five Floors cannot answer one question (MEASURED:
  A6).
- **Why this shape.** Queueing: arrivals above service rate grow without bound, and v55 guarantees arrivals. The
  plan bounds what the system *starts* and never what it *asks*. Building both options is a 50% waste rate on the
  decisions that matter most, and v76 already concedes the point while away; the concession should be the default.
- **Cost, once.** One dial, one gate in the Desk, three fields on the which schema, one briefing line.
- **Losing image.** Whiches unbounded, both options always built. `wins_if:` a quarter in which the backlog never
  exceeds one window's throughput and the second option is chosen more than a third of the time.
- **How we would know.** Whiches opened vs answered per week; the backlog trend; the second-option pick rate.
- **Founder?** Q1 (the number).

### B4 · R12 on the harness cannot falsify assumption 1

- **What changes.** R12 splits into three (NEW: R28): **R12a** the harness's first thirty, as written; **R12b** a
  random sample of episodes from the founder's own transcripts, classified by domain (code · marketing · finance ·
  ops · design), each asked *could a check outside a model have judged this*; **R12c** the second venture's real
  thirty. **"Inventing an anchor" is defined operationally:** an anchor tests a property the done-test did not
  state; the judge is a second reader who wrote neither, and the verdict is a field (B8). Row 16 is settled only by
  R12b and R12c together; R12a on its own may not close it.
- **Why this shape.** Selection on the dependent variable: the harness is the one domain where assumption 1 is known
  to hold. The transcript corpus (MEASURED: A4, 3,116 files) is a free sample of company work across domains and
  needs no build.
- **Cost, once.** A sampling script over a snapshot and one agent-day of classification; zero runtime.
- **Losing image.** R12 as the harness's thirty. `wins_if:` R12b returns a per-domain fraction within the sample
  floor of R12a's: the harness was representative after all.
- **How we would know.** A per-domain fraction. Code at 80% and everything else under 30% inverts the architecture
  for every venture that is not the harness, and §20.1 row 16 says so before wave two.
- **Founder?** No.

### B5 · Sixteen of sixteen ratifications filed as founder decisions

- **What changes.** **FOUNDER ROW, proposed (v83):** §A gains `class: originated | ratified` per founder row.
  Originated (v1–v5, v54–v65, v82): the decision text is the founder's words, never re-litigated. Ratified
  (v66–v81): the founder picked A from a list an agent wrote; reopenable by any engine with a reason and a
  `wins_if:` match, through a Decide item, never silently. **Option-set discipline** (NEW: O93's companion): every
  future option set carries at least two options each with a genuine argument and its own `wins_if:`; `schema-lint`
  refuses an option whose only reason is "cheaper" or "no work". **The founder's agreement rate** with the
  recommendation is a number on the round's record and on the briefing (O90).
- **Why this shape.** Governance: the rule that protects the founder's real decisions is protecting the
  orchestrator's designs. B1's revision cost is highest exactly on the rows decided at maximum uncertainty. What
  the founder gains: sixteen rows that can be corrected by a fact without an interview. What they lose: the
  guarantee that a ratified row cannot drift without them; the Decide item is what keeps them in the loop.
- **Cost, once.** One field on sixteen rows; one lint rule; one number.
- **Losing image.** One class of founder row. `wins_if:` a year of ratified rows in which no engine ever files a
  reopen, so the class bought nothing.
- **How we would know.** Reopens filed per quarter, and the agreement rate on the next round; above 90% with the
  recommendation shown, the founder is not deciding.
- **Founder?** Q2.

### B6 · The plan cannot bind because nothing that acts can read it

- **What changes.** Systemic redesign S3, the data-first inversion: the binding 2% becomes files the prose is
  rendered from (NEW: O92) and a **constitution** the Operator pre-flight reads.
- **Founder?** No. Convergence 7, detailed in S3.

### B7 · The economics rest on a supplier resource the supplier says not to use this way

- **What changes.** Systemic redesign S5. The **shadow subsidy line** (NEW: O94): cumulative shadow USD of
  unattended runs (the meter's per-run figure, list price) against the seat price, on the briefing. The metered
  design (batch at 50%, 5-minute TTL, no weekly window, reserve redesigned) is written as a §J losing image with
  `wins_if:` **the subsidy exceeds N× the seat price, or the vendor narrows the terms** (NEW: v100). A
  **checker-family key** (Gemini or OpenAI API, scoped to checking, capped at the provider) is decoupled from §I row
  1: it is not the Anthropic clause (Q4).
- **Why this shape.** Row 17 chained behind row 1 is backwards; the metered economics are computable today from
  §9.6 and knowing them is what lets the founder decide row 1 with a number. A key on a different vendor for
  checking only is a few dollars and touches no open terms question.
- **Cost, once.** One briefing line; one §J entry; one purchase.
- **Losing image.** Row 17 downstream of row 1, no subsidy line. `wins_if:` the subsidy is small: row 1 is then cheap
  to close either way and the line told the founder nothing they needed.
- **How we would know.** The subsidy line exists and moves.
- **Founder?** Q4 (money).

### B8 · The ladder conflates verifier independence with property adequacy

- **What changes.** Two axes on every anchor (NEW: v85, O83): `verifier: world | other-family | founder |
  same-family` and `adequacy: pass | fail | unjudged`. Adequacy is written by a reader who wrote neither the
  done-test nor the anchor (`reviewer` on the `-p` carrier, or `challenger`), into its own handover; **rung 1 is
  counted only when verifier is world and adequacy is pass**; `bin/check-stores` refuses a rung-1 claim with
  adequacy unjudged. §21 reports beside the rung-1 share **the share of done-tests rewritten after their anchor was
  chosen** and **founder rejections of passed work** (the Goodhart pair).
- **Why this shape.** A deterministic check of the wrong property is deterministic. "Fails before, passes after"
  proves sensitivity to the change, not that the property was the stated one. A share that must not fall will be
  met by writing checkable done-tests; the second reader is the cheapest counter-incentive, and the two §21 lines
  are the instrument that sees Goodhart running.
- **Cost, once.** Two fields; one reader per anchor, on the cheapest model that passes the routing rehearsal.
- **Losing image.** One axis. `wins_if:` a quarter in which adequacy never fails on an anchor the world passed: the
  second axis was redundant with the first.
- **How we would know.** Done-tests shortening while founder rejections of passed work rise.
- **Founder?** No.

### B9 · The lexicographic Desk moves starvation rather than solving it

- **What changes.** **FOUNDER ROW, proposed (v98, amending v75):** weighted fair queueing across ventures with the
  founder's weight as the share; obligations pre-empt only inside their own `lead_time` and are ordered among
  themselves by slack (due minus now minus expected duration from the plant model, O86); inside a venture's share
  the lexicographic order stands. Decided **by replay, not by argument** (NEW: O100): O20's replayer runs a synthetic
  month with an obligation tide on one venture under both comparators and counts the other venture's top-weight
  dispatches; the founder reads the two numbers. **The world's vote** (NEW: O103): a venture's share moves within a
  bounded band on contact-rung movement recorded by `bin/reconcile`, so the record the company does not write has a
  hand on allocation; the founder's weight is the prior.
- **Why this shape.** Strict priority starves the lower tiers whenever the upper saturates; a venture with customers
  is an obligation tide. Fair queueing is the solved shape for a shared resource. v75's own settled-by is the
  replay, so this amendment costs the founder one reading of one table.
- **Cost, once.** A second comparator in the replayer; one band in settings; one field the reconciler writes.
- **Losing image.** v75 as decided. `wins_if:` the replay dispatches the top-weight intent no less often under the
  lexicographic order with the obligation tide present.
- **How we would know.** Zero top-weight dispatches on the second venture during the tide, under either comparator.
- **Founder?** FOUNDER ROW v98; decided on the replay's number, no question slot spent.

### B10 · Trust-gated routability deadlocks at cold start

- **What changes.** `roster.yml` gains `trust: probation | scored | unroutable` per move class (NEW: O89, v92). In
  probation an agent is routable **only on the Floor or under a founder-authored intent** with adequacy-judged
  anchors, and each anchored run counts toward the floor; the floor is a number in `settings.yml` (O25's predicate
  gets its constant, which is a dial with an evidence line, B18). The pack's demonstration artifact (v71) is
  satisfied by the **first anchored run** in probation (`seed:` state, THINKER: C14), so the bootstrap does not
  require a run that cannot happen.
- **Why this shape.** Wave one has ten agents and zero anchored history; a floor above one makes every agent
  unroutable until it has what it cannot get. Probation is the standard shape: narrow authority, counted evidence,
  promotion by number.
- **Cost, once.** One state, one number, one rule in `bin/run`.
- **Losing image.** The floor as written with a hand-waiver. `wins_if:` the floor is one, in which case the score is
  decorative and probation is unnecessary.
- **How we would know.** Dispatch counts per agent in the first week; zero for any wave-one agent is the deadlock.
- **Founder?** No.

### B11 · Skill admission at n=2–3 over 2,111 candidates

- **What changes.** Admission becomes **sequential testing on real work** (NEW: O88, v91). The §7.3 eval is a
  **trigger smoke test** (does the description fire on the right prompt), never a quality verdict. A skill is
  admitted `provisional`; `registry.yml` carries `evidence: {n_present, pass_present, n_absent, pass_absent}` from
  anchored outcomes of runs where the skill was and was not in the loaded directory (the per-namespace directories
  of v77 give the natural experiment); a decision is recorded when the evidence crosses a threshold in either
  direction, with O25's floor as the minimum n. Activation, if R14 yields an event, sharpens *present* to *fired*;
  without it, presence is the unit and the row says so.
- **Why this shape.** Two prompts cannot separate a skill from noise; expiry re-runs the same underpowered test. Real
  work is the only sample large enough, and it is free because the anchors already run.
- **Cost, once.** Four counters per registry row; one join in the curator's pass.
- **Losing image.** Admission on 2–3 cases with expiry doing the work. `wins_if:` R15 finds a published measurement
  that a small-n eval predicts real-work benefit, or the sequential test never overturns an admission in a year.
- **How we would know.** Among admitted skills, the share whose present-runs pass anchors no better than absent-runs
  after a quarter.
- **Founder?** No. Inside v3.

### B12 · The curator grades everyone and nothing grades the curator

- **What changes.** Three mechanisms (NEW: O91, v94). **Every case set** the curator writes (rehearsal, memory,
  negatives, taste) passes O62's held-out discrimination test before it may judge, and the rate prints beside it.
  A **founder-labelled `class: calibration` seed for memory** (v78's frozen set, extended): items no curator may
  edit, against which the curator's dedup and conflict decisions are scored. **A memory item's `falsifier:` must be
  executable**: a command with an exit code or a URL plus quote that `check-citations.mjs` can resolve, never
  prose; `bin/check-stores` refuses the rest. And a **standing canary** in the scratch house (O78): a well-formed
  false item is injected nightly and the drill asserts something downstream refuses it.
- **Why this shape.** A format check admits a well-formed false item. The plan's own cure for a self-grading run
  (a held-out test, an executable anchor) applied to the one agent with write authority over what the company
  believes. Two curators on two families is unreachable today (R10).
- **Cost, once.** One rule on the item schema; one seed set the founder labels once; one fixture row.
- **Losing image.** A format-checked curator. `wins_if:` a year of canaries in which the false item is always
  refused by the format check alone.
- **How we would know.** The canary's refusal record; the calibration seed's score per pass.
- **Founder?** No (labelling the seed is a taste act the plan already assigns to the Floor).

### B13 · Reversibility is judged per act by the run

- **What changes.** Reversibility becomes a **property of a verb in the admitted-tool file** and never of an act
  (NEW: v86, O84). `keel/shared/tools/<name>.yml` gains `verbs: [{name, effect: none | metered | reaches-the-world,
  reversible: bool, undo: <cmd>, drilled: <date>}]`. An unlisted verb is one-way. `bin/run` composes the grant from
  listed two-way verbs; the Sender and the door read the table; §12.2's run-side flowchart question is deleted and
  the flowchart becomes a lookup. O24's `effect:` on anchors is the same field, so one table serves both.
- **Why this shape.** The one-way/two-way decision is where a mistake is unrecoverable and it was the one decision
  the plan let a model make about itself. Data can be probed; a question cannot. v28 (reversibility as the axis)
  stands and gets its mechanism.
- **Cost, once.** One table per admitted tool, filled at the door where the undo is drilled anyway.
- **Losing image.** The flowchart. `wins_if:` grepping the launcher finds no predicate that takes model output and
  the flowchart was already a lookup in practice.
- **How we would know.** The grep.
- **Founder?** No.

### B14 · Away mode widens autonomy exactly when nobody can pull the cord

- **What changes.** **FOUNDER ROW, proposed (v87, amending v76).** While the last founder event is older than the
  reserve's horizon: the reserve is released **only to work whose anchors and verbs are `effect: none` and whose
  outputs stage**; a *which* default fires at expiry **only if it touches no one-way verb** (B13's table decides,
  not a judgement); one option is built, as decided; the *since you were last here* view stands. Beyond a second,
  longer horizon the dead-man lease (B19) stops unattended dispatch entirely.
- **Why this shape.** Dead-man principle: absence narrows. v76's economic argument (idle capacity is waste) is
  right about the reserve and wrong about the defaults, and it ignores that away is also the period with no recall.
  What the founder gains: the reserve still works while away. What they lose: a one-way default that would have
  fired now waits, which is the price of a control that cannot be recalled.
- **Cost, once.** One predicate change at two of v76's four call sites; one horizon in settings.
- **Losing image.** v76 as decided. `wins_if:` one drilled week away with the defaults firing and nothing
  regretted, or the count of away-fired defaults later reversed stays at zero for a year.
- **How we would know.** That count.
- **Founder?** Q3.

### B15 · R5 is one week from the busiest week the machine has had

- **What changes.** R5 is restated as a **floor**, and the measurement becomes standing (NEW: O95): a v55-shape
  standing intent runs `pmset -g log` on the routine window and appends span, asleep-hours and longest gap to
  `keel/shared/facts.yml` row `mac-off-hours` with `valid_until`; §I row 15 reads the thirty-day figure, not the
  week's (NEW: R31). Lane A's reading (MEASURED: A1, one sleep every nineteen minutes) travels with the number as
  the operational half: the same log that prices the cloud lane at zero says the machine is never awake unattended.
- **Why this shape.** One sample from a non-representative period is false precision; a decision is being nudged on
  it. A standing measurement is the plan's own idiom (v81) applied to its own hardware.
- **Cost, once.** One standing intent; one facts row.
- **Losing image.** R5 as one week. `wins_if:` thirty days show no gap over an hour either.
- **How we would know.** The longest gap over thirty days including a weekend away.
- **Founder?** No.

### B16 · The taste loop trains on ratifications of model recommendations

- **What changes.** A **control arm** (NEW: O90, v93): on a founder-set fraction of whiches the recommendation is
  hidden or its order randomised (`recommendation_shown: false` on the which row). The taste store's held-out test
  (O62) runs on **control-arm whiches and Floor rejections only**; agreement with the shown recommendation prints
  beside the taste score on the briefing.
- **Why this shape.** A founder answering with one tap mostly takes the recommendation (16/16 is the evidence); a
  store derived from those taps learns the model with the founder's signature on it, and O62 cannot see it because
  accepted equals recommended. A control arm is the only instrument that separates the two.
- **Cost, once.** One boolean, one dial, harder whiches on a fraction of the queue.
- **Losing image.** Every which shows its recommendation. `wins_if:` the control arm's choices match the shown-arm's
  distribution: the founder was deciding, and the arm costs attention for nothing.
- **How we would know.** Agreement above 90% with the recommendation shown and materially different choices without
  it.
- **Founder?** No (the fraction is a dial, Q1's sheet).

### B17 · The pack's rehearsal case contradicts O11

- **What changes.** Inside v71's implementation: the pack's `rehearsal.md` is a **reference into `keel/golden/`**,
  never a body the agent's namespace resolves to; R19 runs on cases the packed agent never saw; the exemplar and the
  demonstration stay the agent's. `check:manifest` (re-pointed by O11) fails a known-answer body in any loaded
  directory, which is the mechanism, and the pack table in §17.1 changes one path.
- **Why this shape.** A rehearsal case the run can read is an answer key filed with the exam; R19 is a founder row's
  falsifier and cannot be allowed to measure memorisation.
- **Cost, once.** One path in one table.
- **Losing image.** The case carried in the pack. `wins_if:` none; a contaminated falsifier has no winning state.
- **How we would know.** Grep a running agent's loaded context for any known answer and find none.
- **Founder?** No; implementation of v71, the row's text stands.

### B18 · "Two kinds of thing" is false; forty dials are uninventoried

- **What changes.** `keel/shared/schemas/settings.yml` (NEW: O87, v90) inventories every founder-set value with
  `default:`, `evidence:` (the briefing line that is its feedback), `label: measured | assumed | founder`, and
  `last_touched:`. `schema-lint` fails a dial with no evidence line. The briefing counts dials and dials untouched
  for a quarter. The inventory as it stands from my read: reserve share (per window, per week) · interruptions per
  day · tick · WIP per venture · driven limit · sessions ceiling · undo window · exploration fraction · weight per
  venture · ceiling per venture and per intent · horizon per charter and per intent · `recurs:` on two drills ·
  `cacheTtl`, `valid_until`, `fallback:` and `maxTurns` per agent · `valid_until` per skill and per memory item ·
  numeric wake-me thresholds per venture · the sample floor · N in O73 · the per-run ceiling on standing intents ·
  the high-water fraction · and, from this document, decisions per window, the control-arm fraction, the dead-man
  horizon, the WFQ band, the trust floor, the line budgets. Each is "the founder's number, not a rule's", which is
  the plan's way of not deciding; the sheet is what makes that honest.
- **Why this shape.** A control system with forty setpoints and no setpoint table is tuned by folklore, and every
  uninventoried dial is a place the founder is the bottleneck without knowing it.
- **Cost, once.** One schema; a lint; the founder reads one sheet once.
- **Losing image.** Dials scattered through prose. `wins_if:` after a quarter every dial still carries its default
  and no evidence line ever moved one: the sheet was a list, not a control.
- **How we would know.** The count, and the untouched count.
- **Founder?** No; the numbers on it are Q1 and Q3.

### B19 · The emergency stop has four upstream dependencies

- **What changes.** A stop that needs nothing (NEW: O85, v88): `keel/logbook/founder.lease` holds a `valid_until`
  the founder renews by any founder-authored event (it is `founder.last` read against a second, longer horizon); the
  Watch **refuses to mint unattended work** while the lease is stale. Absence of the heartbeat is itself the stop,
  reachable with the Mac's network off, the tunnel down and the keychain locked. The tap stays the fast path.
  **One stop verb** (NEW: O101): `bin/stop` with four receivers (the cord file, the recorded process groups, the
  Sender's recall window, the hosted lane's UNKNOWN), writing one record of what stopped and what did not, so the
  four semantics stop being four controls. The cord control on every page reads *stops the night, not the Floor*
  (MEASURED: A21). Drill: pull the cord from the phone with the Mac's network off and count what stops.
- **Why this shape.** An e-stop with dependencies is a normal control. The dead-man lease is the one stop whose
  reachability does not depend on anything being up.
- **Cost, once.** One file, one predicate in the Watch, one verb, one drill.
- **Losing image.** The tap as the e-stop. `wins_if:` a year of drills in which the tap reached quiescence from the
  phone every time, including with the tunnel down.
- **How we would know.** The drill's count.
- **Founder?** No; the horizon is a dial.

### B20 · Standing intents never expire

- **What changes.** **FOUNDER ROW, proposed (v97, amending v55):** a standing intent *never finishes* but it
  *expires*: it carries `valid_until` like everything durable, and `bin/horizon` forces Refresh · Deprecate · Waive
  with a new date (NEW: O99). Nothing else in v55 moves.
- **Why this shape.** Two rules, one object; a standing intent that has fired uselessly for a year is what expiry
  exists to catch.
- **Cost, once.** One field; one founder answer per standing intent per horizon.
- **Losing image.** v55's "never expires". `wins_if:` every standing intent Refreshes on real evidence at every
  horizon for a year.
- **How we would know.** The lapse record naming a standing intent.
- **Founder?** FOUNDER ROW v97, minor; no question slot spent.

### B21 · "No durations" over-applied into "no plant model"

- **What changes.** A **units table** in `keel/shared/facts.yml` (NEW: O86, v89): per shape, tokens per run, runs
  per window, wall-clock per run, finished intents per week, decisions per day, each with `measured_at`,
  `valid_until` and the command that re-measures it, written by the meter nightly. `settings.yml` refuses a number
  that is neither derived from a units row nor labelled `assumed` (the business lens's own label rule, turned on the
  system). The reserve, the WIP limit and "two driven ventures" are derived, and the derivation prints on the
  briefing.
- **Why this shape.** Refusing schedules is right; refusing measured rates left the reserve unsizeable. The plan
  already names "ten real moves" as the first measurement; a facts row is what that sentence looks like as data.
- **Cost, once.** One table; one rule.
- **Losing image.** Rates as sentences. `wins_if:` a quarter in which no settings number moves after the rates land.
- **How we would know.** The reserve and WIP numbers derived rather than typed.
- **Founder?** No.

### B22 · Fourteen agents are fourteen loadouts once O2 and O5 generate the files

- **What changes.** No row. §5.6 notes that the founder's decision and the losing image **converged**: the cost of a
  name is a generated file, and v31's own falsifier (routing counts) decides the count. The briefing carries the
  **per-agent artifact count** beside routing counts (THINKER: C15), so what each name costs to keep is a number.
- **Founder?** No.

### B23 · The Watch is an open-loop controller with static setpoints

- **What changes.** One sentence in §4 stating it: static gains on a non-stationary plant, retuned by hand through
  the founder, with O20's replayer as the only offline tuning path. O74's control charts extend to the Watch's own
  outputs (NEW: O96): ring rate, dispatch rate, refusal rate, which-open rate, each against its own history.
- **Cost, once.** Four series on a chart that exists.
- **Losing image.** The Watch described as a cheap pass. `wins_if:` a year in which none of the four series drifts.
- **How we would know.** A control chart on the Watch's outputs exists.
- **Founder?** No.

### K1–K8 · The eight convergences, from this angle

- **K1 · Founder attention is the scarcest input and nothing budgets it.** S1. Beyond B3: the harness charter gets a
  ceiling in founder-hours per week (THINKER: C4), read by the Desk like a token ceiling, and founder-minutes split
  harness / venture on the briefing. Founder? Q1.
- **K2 · No stranger in the build graph.** From the control angle the plant has no external sensor: the
  reconciliation reads records the company does not write, and none exist. The cheapest stranger that stays inside
  v64 is the harness's own outward act: publish one artifact of the harness through the Sender and count a
  stranger's reply as contact rung 1 (§11.9), read by `bin/inbound`. The world's vote (O103) then has one row to
  read. A second, customer-facing venture is the stronger answer and is C's design; my angle is that either way the
  first stranger is the sensor the loop lacks. Founder? Q8.
- **K3 · R12 on the harness cannot test assumption 1.** B4.
- **K4 · Vendors are shipping the bottom half.** `vendor_wins_if:` on every §L row (O93) and an economics test in
  §19: a mechanism is built only where no vendor surface exists or is announced, or where it is one of the kernel
  four (direction · record · truth · taste). From this posture the reason is maintenance cost: every commodity
  mechanism is a second implementation of a vendor's check, which this repository names as its recurring defect, and
  it is paid in founder attention (K1). The moat inventory is what §19 orders first (§7 below). Founder? No.
- **K5 · The night is designed before the machine that could run it exists.** From economics: the night is a
  capacity claim with no plant model (B21) and no rate; the bounded-day comparison (§20.2 row 12) is the cheaper
  experiment and the plant model is what makes its result readable. The box is a money question stated with its
  shadow price: a night of orphans on a fanless Air on battery (MEASURED: A1) costs a window and a morning; the box
  costs a small monthly figure. Founder? Q5.
- **K6 · Sixteen of sixteen is a warning.** B5 and B16.
- **K7 · The plan cannot bind.** B6 and S3.
- **K8 · The capacity model is economics carried as a legal footnote.** B7, B21, S5.

---

## 3 · Systemic redesigns

### S1 · Founder attention as a metered capacity

- **Shape.** Three gauges, not one: the window (v22, v74), the founder's decisions (B3), the founder's hours (K1).
  All three read by the Desk before dispatch; all three on page 3 and the briefing; all three carry a reserve. The
  decide queue is a bounded buffer with admission control (O81), claims (O98), a control arm (O90), and a
  first-line accounting (O102). Every which carries its cost in bytes to read. The founder's hour gets a price in
  window share (THINKER: C20) as a dial on the sheet, read when the Desk chooses between staging a which and
  taking the default.
- **Why.** The plan prices tokens exhaustively and never the input that is three orders of magnitude scarcer. A
  controller that does not sense its binding constraint saturates it first.
- **Cost, once.** Two dials, one gate, four fields, three briefing lines.
- **Losing image · wins_if.** One gauge. `wins_if:` a quarter in which the which backlog never exceeds one window's
  throughput and founder-minutes per finished intent fall without the gauges.
- **How we would know.** Whiches opened vs answered; founder-minutes split harness / venture; backlog trend.
- **Sections rewritten.** §2.7 (a third kind of thing the founder does: decides, and it is counted), §3.8, §4.1 (a
  gate between 2 and 3: is the decision budget spent), §4.5, §12.5, §14.6, §16.8, §21.1.
- **Founder?** Q1.

### S2 · The loop closes on the world, not on the document

- **Shape.** Four instruments the plan lacks, one per rung of its own ladder. **Direction:** `outcome:` on the
  charter (THINKER: C5), one contact-rung target by the horizon, checkable by a record the company does not write;
  O63 reads it at the horizon. **Allocation:** the world's vote (O103): a bounded share adjustment on contact-rung
  movement, so replies and payments have a hand on dispatch and the founder's weight is a prior. **Truth:** the
  adequacy axis (B8) and R12 split three ways (B4). **Record:** a house-scope market record, one row per rung
  movement per venture, written by `bin/reconcile` (THINKER: C8), so the second venture starts where the first
  ended. Each is a sensor reading something outside the model.
- **Why.** Every one of §21's six numbers is about the machine's own activity; the controller has no external
  reference. A company optimising its own epistemics compounds provenance, not revenue.
- **Cost, once.** One charter field, one band, two fields, one store.
- **Losing image · wins_if.** §21 as written. `wins_if:` the first two contact-rung movements arrive from ventures
  the founder's weight already ranked first: the world and the founder agreed and the vote bought nothing.
- **How we would know.** The first horizon disposition that cites `outcome:`; the first share change the founder did
  not type.
- **Sections rewritten.** §2.1, §4.5, §11.2, §11.9, §13.2 (a seventh store), §16.8, §21.
- **Founder?** Q8 for the stranger; the rest no.

### S3 · Data first, and a constitution

- **Shape.** Seven files are the plan's binding 2% (NEW: O92, v95): `roster.yml` (O2), `routing.yml` (O5), the
  four schemas (O3, O4, O6, handover), `prices.yml` (O8), `facts.yml` (O86, the plant model and the world facts
  with `source:` and `valid_until`, v81), `settings.yml` (O87), and **`rules.yml`**: one row per rule with
  `mechanism:`, `path:`, `state: exists | absent | wish`, `wins_if:`, `vendor_wins_if:`. The prose is **rendered**
  from them: a generator writes §1.1, §5.2, §9.2, §12.10a, §17 and every "what enforces this section" table, and
  `schema-lint` fails a rendered table that was hand-edited. Every superseded paragraph moves to
  `final-v2/ARCHIVE.md` so the live plan carries only live sentences; the 218 strikethroughs and 54 "moved" notes
  become archive rows with a date. **The constitution** is one file under the session-start ceiling of 4,096 bytes
  (the plan's own measured limit): the four invariants of §0.3, the doctrine in six lines, the envelope's three
  lists, the open §I rows by id, and the paths of the seven files. It is the Operator's pre-flight read and is
  byte-identical for the cache.
- **Why.** No engine loads 240K tokens; the session-start payload is capped at 4,096 bytes precisely because a 27KB
  one was truncated (CLAUDE.md, measured). The census found the failure that predicts: a round applied to early
  sections and not late ones. A builder brief for any §L program must fit in 8K tokens with nothing missing, and
  today it cannot.
- **Cost, once.** The seven files, written once from the rows that exist; one generator; one archive move.
- **Losing image · wins_if.** The prose as source. `wins_if:` a year in which no rendered table would have differed
  from its hand-kept copy.
- **How we would know.** A fresh agent given the constitution alone writes a brief that passes the store check; the
  count of "corrected in place" notes stops growing.
- **Sections rewritten.** §0.3 (the constitution is the artifact), §1, §5.2, §9.2, §17, §19 (a `DATA` root), §22
  (rendered from `rules.yml`'s losing-image column).
- **Founder?** No.

### S4 · Independent enforcement layers and a small trusted base

- **Shape.** The vendor floor below `bin/run` (B2); the verb table (B13) as the one place reversibility lives; the
  probe authored apart (O82); the four world-touching programs under a line budget with fixture-only admission
  (O97); the dead-man lease and one stop verb (B19); the curator's canary (B12); the hash-chained log (O31) as the
  audit the founder reads. The predicate the whole shape serves: **no single program can widen a grant, send twice,
  or believe a false item, because a second, independently authored thing refuses it.**
- **Why.** The judging machinery is 100% ABSENT and will be authored by the agents it constrains; a review of it is
  rung 4. Independence of layers is the only property that survives that.
- **Cost, once.** Three roster fields, two lints, one file, one verb, one drill; the founder's reading of four small
  programs.
- **Losing image · wins_if.** One launcher as the floor. `wins_if:` a year of probes and drills in which the second
  layer never refused what the first allowed.
- **How we would know.** The scratch house: widen `bin/run` deliberately, inject a false memory item, pull the cord
  with the network off; count what refuses.
- **Sections rewritten.** §3.1, §5.1 rule 4, §12.2, §12.4, §12.9, §12.10, §13.1, §15.2a, §15.4a.
- **Founder?** Q7.

### S5 · The economics beside the seat

- **Shape.** The plant model (B21) supplies rates; the meter supplies the shadow USD per run it already computes;
  the **shadow subsidy line** (O94) is the two multiplied and set against the seat price; the **metered design** is
  a §J entry with `wins_if:` (v100); a **checker-family key** (Q4) buys rung 2 for checking without touching row 1;
  the **capacity decision** (seat for the Floor, metered or gateway for the night and the checkers) is decided from
  R7 and the first overnight with those numbers in hand (THINKER: C7). Row 17 is unchained from row 1: its economics
  are computed now, its adoption still waits on the founder.
- **Why.** If the seat is withdrawn the company stops the same night and has no second economics; if it is kept the
  founder is running on an arbitrage whose size they have never seen. A number on the briefing turns that into a
  bet the founder is making on purpose.
- **Cost, once.** One line, one §J entry, one key.
- **Losing image · wins_if.** Row 17 downstream of row 1. `wins_if:` the subsidy line is small for a quarter.
- **How we would know.** The line exists; finished intents per window beside it.
- **Sections rewritten.** §9.3, §9.10, §16.2a, §16.4, §16.8, §20.1 row 17.
- **Founder?** Q4, Q5.

### S6 · Admission by evidence, one ladder for agents, skills and packs

- **Shape.** One idiom for every thing the company admits: **provisional on a smoke test, promoted by anchored
  outcomes, retired by forced disposition.** Agents: probation (B10). Skills: sequential testing (B11). Packs: the
  first anchored run is the demonstration (C14). Curator case sets: held-out before judging (B12). Routing shares:
  learned from trust score and cost per rung movement within a bounded band, the roster fixed by v1 and the shares
  not (O26, O75 as price signals). O25's sample floor is the one constant, on the dial sheet.
- **Why.** The plan built the price signals (trust score, cost per rung movement, activation) and then hard-coded
  every allocation. One ladder is less code than four admission gates and it is the shape that lets fourteen names
  earn their keep without re-litigating v1.
- **Cost, once.** Three states, four counters, one band.
- **Losing image · wins_if.** Four separate gates. `wins_if:` a year in which no admission is overturned by evidence
  on any of the four.
- **How we would know.** The first Retire, Deprecate or share change that a number produced and nobody argued for.
- **Sections rewritten.** §5.0a, §5.6, §7.3, §7.4a, §9.2, §11.10, §13a.4.
- **Founder?** No; inside v1, v3, v71.

---

## 4 · What I would not fix, and why

- **B22 (v1 as converged).** Nothing to fix; a note in §5.6 and a number on the briefing. The count is v31's
  falsifier's to move.
- **C10, the widening ladder on recall-free sends.** A class widened by the absence of recalls is widened by a
  self-referential sensor: no recall is not no harm. Widen on a stranger's reply rate read by `bin/inbound` instead,
  which is the same ladder with an external sensor; that is S2's world's vote, not a new mechanism.
- **C6, route reviewer and challenger to Gemini for every diff now.** Premature twice over: Gemini cannot start from
  a Claude-hosted shell (MEASURED: A9), and R11 has not measured whether a second family buys anything on our move
  classes. Q4 buys the key; O7's four fields are the prerequisite; routing waits on the first twenty-five pairs.
- **A11's build-time tier for harness PRs.** Wrong direction: the irreversible tier is right for judging machinery.
  The cost it names, twenty sign-offs, is cured by making the trusted base small (O97), not the tier lower.
- **C4's "one founder act per week as the intake rate".** Founder acts are gates in §19, not a flow; a rate on them
  is a schedule the SPINE refuses. The founder-hours ceiling (K1) is the right instrument.
- **C17, page 4 first.** Page order is downstream of S3; the decide queue is a file, and page 4 is one renderer of
  it. Build the queue's data and its admission control; which page draws it first is a designer's call.
- **C12, a second provider's argv exercised before R10.** The launcher is thin over the vendor floor (B2); a second
  provider's argv is composed from `routing.yml` when a checker-family key exists (Q4). Specifying it before the
  floor is measured is another mechanism ahead of contact.
- **A19, the bell.** Right, and A's; wrap the vendor push. Nothing from this posture to add beyond O96's ring-rate
  chart.
- **C19, the cloud lane.** No fix; B15's thirty-day floor is the only thing that could move it.

---

## 5 · Questions for the founder

Each carries the default this document was designed on. At most eight.

1. **How many founder-hours per week may the harness venture spend, and what is the decision budget per window?**
   Only the founder knows their hours and their tolerance for being asked. Options: **(a) 5 hours per week on the
   harness and 6 decisions per five-hour window, seeded, revised by the R27 measurement (recommended)**; (b) 10
   hours and 12 decisions; (c) no ceiling on hours, a decision budget only; (d) other. *Default proceeded on: (a).*
2. **Reclassify v66–v81 as `ratified` (reopenable by any engine with a reason and a `wins_if:` match)?** Only the
   founder can say which of the sixteen were their words. Options: **(a) all sixteen (recommended)**; (b) only the
   five the thinkers challenged (v71, v74, v76, v78, v79); (c) none, keep one class; (d) other. *Default: (a).*
3. **Amend v76 so that away narrows: the reserve is released only to `effect: none` work, and no one-way default
   fires while away?** Their risk appetite. Options: **(a) yes, both halves (recommended)**; (b) narrow the defaults
   only, release the reserve as decided; (c) as decided, run the drilled week and revisit; (d) other. *Default: (a).*
4. **Buy a checker-family API key, scoped to checking, capped at the provider, decoupled from §I row 1?** Their
   money and their reading of the terms. Options: **(a) a paid Gemini key with a provider-side cap (recommended:
   Gemini is already installed and its restricted mode is the nearest third-runtime analogue to `--restricted`)**;
   (b) an OpenAI key; (c) both; (d) no key until row 1 is read; (e) other. *Default: (a).*
5. **Buy the always-on box before the first night?** Their money and their hardware. Options: **(a) a small Linux
   box holding the Watch, the Sender and the log, the Mac as the Floor and client (recommended; it also separates
   identity from autonomy, THINKER: C13)**; (b) a second Mac so the keychain and `claude` run there; (c) no box,
   bounded-day only until row 12 is measured; (d) other. *Default: bounded-day design first; the box is priced by
   its shadow (a night of orphans) and awaits this answer.*
6. **Model N Operators, or enforce one?** Their working shape (MEASURED: A6, five parallel orchestrators). Options:
   **(a) model N: a which is claimed before it is answered, `founder.last` per venture, the WIP limit counts
   interactive sessions (recommended)**; (b) one Operator enforced by a lease, a behaviour change stated as such;
   (c) other. *Default: (a).*
7. **Will you line-review the four world-touching programs, at a line budget?** Their hours. Options: **(a) all four
   (`send`, `inbound`, `watch`, `run`) at 400 lines each (recommended)**; (b) `send` and `inbound` only, the two
   that can act on a person; (c) none, single-family review, accepted risk to 2026-11-17; (d) other. *Default: (b) as
   the floor, (a) designed for.*
8. **Who is the first stranger?** Their business. Options: **(a) the harness's own outward act: publish one Keel
   artifact through the Sender and count a stranger's reply as contact rung 1, inside v64 as decided
   (recommended as the cheapest, C's second venture as the stronger)**; (b) a customer-facing venture you name, with
   a rung-2 target as `OVERNIGHT`'s exit; (c) no stranger until the harness is built; (d) other. *Default: (a).*

---

## 6 · Proposed SPINE changes, as rows

### 6.1 §A rows, new and amended

| # | The question | Decided or proposed | From | Losing image · wins_if |
|---|---|---|---|---|
| **v83** | Founder rows have two classes | **FOUNDER, proposed:** `class: originated \| ratified`; ratified rows reopenable by any engine with a reason and a `wins_if:` match, through a Decide item | (THINKER: B5) · Q2 | one class · `wins_if:` no reopen is ever filed in a year |
| **v84** | Founder decisions are a capacity | **NEW:** `decisions_per_window` in settings; the Desk refuses to open a which past `backlog > budget × horizon`; one option built by default; the briefing's first line is decisions taken · deferred · defaulted with their byte cost | (THINKER: B3) · (NEW: O81, O102) · Q1 for the number | unbounded whiches · `wins_if:` the backlog never exceeds one window's throughput in a quarter |
| **v85** | An anchor has two axes | **NEW:** `verifier:` and `adequacy:`; rung 1 requires world **and** pass; adequacy written by a reader who wrote neither | (THINKER: B8) · (NEW: O83) | one axis · `wins_if:` adequacy never fails on a world-passed anchor in a quarter |
| **v86** | Where reversibility lives | **NEW:** a property of a verb in the admitted-tool file; an unlisted verb is one-way; the run-side question is deleted | (THINKER: B13) · (NEW: O84) · v28 stands | the flowchart · `wins_if:` no launcher predicate ever took model output |
| **v87** | Away narrows | **FOUNDER, proposed (amends v76):** the released reserve goes only to `effect: none` work whose outputs stage; no which default touching a one-way verb fires while away | (THINKER: B14) · Q3 | v76 as decided · `wins_if:` a drilled week away regrets nothing |
| **v88** | A stop that needs nothing | **NEW:** `founder.lease`; the Watch mints no unattended work while it is stale; one stop verb with four receivers | (THINKER: B19) · (NEW: O85, O101) | the tap as e-stop · `wins_if:` the tap reaches quiescence from the phone with the tunnel down, every drill |
| **v89** | The plant model | **NEW:** a units table in `facts.yml`; a settings number is derived or labelled `assumed` | (THINKER: B21) · (NEW: O86) | rates as sentences · `wins_if:` no settings number moves once rates land |
| **v90** | The dial inventory | **NEW:** `schemas/settings.yml`, an evidence line per dial, a lint | (THINKER: B18) · (NEW: O87) | dials in prose · `wins_if:` no dial ever moves off its default |
| **v91** | Skill admission is sequential | **NEW:** provisional on a trigger smoke test; decided by anchored outcomes present vs absent | (THINKER: B11) · (NEW: O88) · inside v3 | admission on 2–3 cases · `wins_if:` R15 finds small-n evals predict real benefit |
| **v92** | Trust has a probation state | **NEW:** `probation \| scored \| unroutable`; probation routable on the Floor or under a founder-authored intent; the first anchored run is the pack's demonstration | (THINKER: B10, C14) · (NEW: O89) | the floor with a hand-waiver · `wins_if:` the floor is one |
| **v93** | The taste store has a control arm | **NEW:** a founder-set fraction of whiches hide the recommendation; O62 scores on those and Floor rejections only | (THINKER: B16) · (NEW: O90) | every which recommends · `wins_if:` control and shown arms choose alike |
| **v94** | Nothing grades the curator | **NEW:** held-out test on every case set; a founder-labelled calibration seed for memory; an executable falsifier on every item; a nightly canary | (THINKER: B12) · (NEW: O91) | a format check · `wins_if:` the format check alone refuses every canary for a year |
| **v95** | The plan is data first | **NEW:** seven binding files; prose rendered; an archive; a constitution under 4,096 bytes as the Operator's pre-flight read | (THINKER: B6, C18) · (NEW: O92) | prose as source · `wins_if:` no rendered table ever differs from its hand-kept copy |
| **v96** | Mechanisms name their falsifiers | **NEW (doctrine):** every §L row carries `wins_if:` and `vendor_wins_if:`; a mechanism is built only where no vendor surface exists or is announced, or it is one of the kernel four | (THINKER: B1, C3) · (NEW: O93) | §L as decisions · `wins_if:` fewer than one row in ten changes after the first overnight |
| **v97** | Standing intents expire | **FOUNDER, proposed (amends v55):** never finishes, but carries `valid_until` with a forced disposition | (THINKER: B20) · (NEW: O99) | "never expires" · `wins_if:` every standing intent Refreshes on evidence at every horizon |
| **v98** | How the Desk ranks across ventures | **FOUNDER, proposed (amends v75):** weighted fair queueing by the founder's weight as share; obligations pre-empt inside `lead_time`, slack-ordered; decided on O20's replay with an obligation tide | (THINKER: B9) · (NEW: O100, O103) | v75 as decided · `wins_if:` the replay shows no starvation under the tide |
| **v99** | The first stranger | **FOUNDER, proposed (inside v64 or beside it):** the harness's own outward act counted at contact rung 1, or a customer-facing venture in wave one | (THINKER: B4, C1) · Q8 | no stranger · `wins_if:` R12b shows company work is as anchorable as the harness |
| **v100** | The metered economics beside the seat | **NEW:** the shadow subsidy line; the metered design as a §J entry with `wins_if:`; a checker-family key decoupled from row 1 | (THINKER: B7, C7) · (NEW: O94) · Q4 | row 17 behind row 1 · `wins_if:` the subsidy is small for a quarter |

### 6.2 §L mechanisms, new (O81+)

| id | The fix | Path | State | Status |
|---|---|---|---|---|
| **O81** | Which admission control: the Desk refuses to open a which past `backlog > decisions_per_window × horizon`; the which carries `kind:`, `cost_to_answer_bytes:`, `recommendation_shown:` | `bin/watch` · `keel/logbook/decide.jsonl` schema | ABSENT | ADOPTED (number: Q1) |
| **O82** | Probe independence: `bin/probe` never imports `bin/run`, is authored by a different lane, asserts by attempting | `bin/probe` | ABSENT | ADOPTED |
| **O83** | `anchor_adequacy:` on the handover, written by a reader who wrote neither done-test nor anchor; `check-stores` refuses rung 1 without pass | handover schema · `bin/check-stores` | ABSENT | ADOPTED |
| **O84** | The verb table: `verbs: [{name, effect, reversible, undo, drilled}]` per admitted tool; unlisted is one-way; `bin/run`, `bin/send`, `bin/door` read it | `keel/shared/tools/<name>.yml` | ABSENT | ADOPTED |
| **O85** | The dead-man lease: `founder.lease` with a second horizon over `founder.last`; the Watch mints nothing unattended while stale | `keel/logbook/founder.lease` · `bin/watch` | ABSENT | ADOPTED (horizon: a dial) |
| **O86** | The units table: per shape tokens/run, runs/window, wall-clock/run, intents/week, decisions/day, with `valid_until` and a re-measure command; written by the meter | `keel/shared/facts.yml` | ABSENT | ADOPTED |
| **O87** | The dial inventory: a settings schema with `default:`, `evidence:`, `label:`, `last_touched:`; lint fails a dial with no evidence line | `keel/shared/schemas/settings.yml` · `schema-lint` | ABSENT (`schema-lint` EXISTS) | ADOPTED |
| **O88** | Sequential skill testing: `evidence: {n_present, pass_present, n_absent, pass_absent}` on the registry row; decision at threshold; the §7.3 eval is a trigger smoke test | `keel/shared/skills/registry.yml` · the curator's pass | ABSENT | ADOPTED (R14 sharpens present to fired) |
| **O89** | Trust probation: `trust:` per move class in `roster.yml`; the floor as a number in settings; the first anchored run is the pack's demonstration | `keel/shared/roster.yml` · `bin/run` | ABSENT | ADOPTED |
| **O90** | The which control arm: a fraction with the recommendation hidden; agreement rate on the briefing; O62 scores on control-arm taps and Floor rejections | the which schema · the curator's pass | ABSENT | ADOPTED |
| **O91** | Curator held-out on every case set; a founder-labelled `class: calibration` memory seed; executable `falsifier:`; a nightly canary in the scratch house | `bin/check-stores` · `keel/golden/` · `keel/fixtures/` | ABSENT (`check-citations.mjs` EXISTS) | ADOPTED |
| **O92** | Data first: `rules.yml` with `mechanism: · path: · state: · wins_if: · vendor_wins_if:`; a renderer for the binding tables; `schema-lint` fails a hand-edited rendered table; `ARCHIVE.md` for superseded prose; a constitution ≤ 4,096 bytes | `keel/shared/rules.yml` · `final-v2/CONSTITUTION.md` · `final-v2/ARCHIVE.md` | ABSENT | ADOPTED |
| **O93** | `wins_if:` and `vendor_wins_if:` on every §L row; the header `confidence: LOW` until one measured overnight; §21 counts rows changed after it; option sets carry two argued options or fail lint | SPINE §L · `schema-lint` | ABSENT | ADOPTED (doctrine, B1) |
| **O94** | The shadow subsidy line: Σ shadow USD of unattended runs vs the seat price, on the briefing | the briefing | ABSENT | ADOPTED |
| **O95** | The power log as a standing measurement: `pmset -g log` span, asleep hours, longest gap → a `facts.yml` row with `valid_until` | a v55 standing intent · `keel/shared/facts.yml` | ABSENT | ADOPTED |
| **O96** | Control charts on the Watch's own outputs: ring, dispatch, refusal, which-open rates | the briefing (extends O74) | ABSENT | ADOPTED |
| **O97** | The trusted base: `world_touching: true`, `max_lines:`, `authored_by:` on four `kind: program` rows; `check-stores` refuses over-budget; fixtures are the only admission | `keel/shared/roster.yml` · `bin/check-stores` · `keel/fixtures/` | ABSENT | ADOPTED (review hours: Q7) |
| **O98** | A which is claimed by an Operator session before it renders; `founder.last` per venture; the WIP limit counts interactive sessions | `decide.jsonl` · `sessions.jsonl` | ABSENT | ADOPTED (Q6) |
| **O99** | `valid_until` on standing intents; `bin/horizon` walks them | the intent schema · `bin/horizon` | ABSENT | with v97 |
| **O100** | A second comparator (WFQ, slack-ordered obligations) in O20's replayer; a synthetic month with an obligation tide as a fixture | `bin/replay-desk` · `keel/fixtures/` | ABSENT | with v98 |
| **O101** | One stop verb: `bin/stop` with four receivers and one record of what stopped; the page control reads *stops the night, not the Floor* | `bin/stop` | ABSENT | ADOPTED |
| **O102** | The briefing's first line: decisions taken · deferred · defaulted, with bytes read | the briefing | ABSENT | ADOPTED |
| **O103** | The world's vote: a venture's Desk share moves within a bounded band on contact-rung movement written by `bin/reconcile`; a house-scope market record, one row per movement | `bin/reconcile` · `keel/shared/market.jsonl` · the Desk | ABSENT | ADOPTED (with v98) |

### 6.3 §N research questions, new (R27+)

| id | The question | Source class | What it decides | Status |
|---|---|---|---|---|
| **R27** | What is the founder's measured decision throughput: whiches and `AskUserQuestion` rounds answered per day, from the transcript corpus? | `~/.claude/projects/` snapshot, counted | The seed for `decisions_per_window` (v84, Q1) | OPEN, zero build |
| **R28** | R12b: what fraction of a random sample of the founder's own past tasks, per domain, could a check outside a model have judged, with "inventing an anchor" defined as testing an unstated property? | the same snapshot, one agent-day of classification | §20.1 row 16 with R12a and R12c together | OPEN, zero build |
| **R29** | What is the cumulative shadow USD of unattended work on this seat against the seat price, from `~/.agentvibe/events.jsonl` today? | the existing event log, priced by §9.6 | The first reading of O94 before the meter exists; the size of the bet on §I row 1 | OPEN, zero build |
| **R30** | Baseline the Watch's ring, dispatch, refusal and which-open rates over the first month | the event log | O96's charts have no history without it | OPEN |
| **R31** | The Mac's off-hours over thirty days including a weekend away, stated as a floor | O95's standing intent | §I row 15 re-read on a month, not a week | OPEN |
| **R32** | Under a synthetic obligation tide, how often does the top-weight intent of a second venture dispatch under lexicographic order versus WFQ? | O20's replayer over a fixture month | v98 | OPEN |
| **R33** | Does the taste store's held-out discrimination rate differ when scored on control-arm whiches only versus all whiches? | O62 on two slices | Whether the store is the founder's (v93) | OPEN |

No new §M facts: nothing here is sourced from outside the inputs; every world fact cited is world.md's.

---

## 7 · Build-order consequences

**§19 gains a root and loses a question.** The graph today has one root, `LOG`. It gains **`DATA`**: the seven
binding files of S3 (`rules.yml`, `roster.yml`, `routing.yml`, the schemas, `prices.yml`, `facts.yml`,
`settings.yml`) plus the constitution, with edges `DATA → LOG`, `DATA → AGENTS1`, `DATA → STORES`, `DATA → RUN`.
It loses the run-side reversibility question, which was never a node but was a hidden dependency of `SENDER`;
`VERBS` (O84) joins `DOOR` and `DOOR → SENDER` now carries the table.

**New nodes and where they hang.** `DECIDE` gains admission control and the claim (O81, O98) and a new edge from
`SETTINGS`. `SETTINGS` (O87) hangs off `DATA` and feeds `WATCH`, `DECIDE`, `RUN`. `UNITS` (O86) joins `METER` and
feeds `WATCH` (the reserve and WIP derived) and `HIGHWATER`. `LEASE2` (O85, the founder's lease) hangs off
`FOUNDERLAST` and feeds `WATCH`; `STOP` (O101) hangs off `RUN` and `SENDER`. `ADEQUACY` (O83) joins `REHEARSE` and
gates `RUN`'s rung-1 claim. `TCB` (O97) joins `ROSTER` and gates `SENDER`, `INBOUND`, `WATCH`, `RUN` through
`FIXTURES`. `PROBE` gains the constraint that its author is not `RUN`'s. `CANARY` (O91) joins `FIXTURES` and
`CURATE`. `SUBSIDY` (O94) and `WATCHCHART` (O96) join the briefing under `METER`. `MARKET` (O103) joins `RECON` and
feeds `WATCH`. `CONTROLARM` (O90) joins `DECIDE` and `CURATE`. `PMSET` (O95) is a standing intent under `FRESH`'s
shape. **No new root beyond `DATA`**, and `DATA` is a root only because it is what everything else is rendered
from.

**Reorders.** `DATA` precedes `AGENTS1` (a roster row is written before an agent file is generated from it).
`UNITS` precedes the first `settings.yml` number that is not labelled `assumed`. `TCB` and `FIXTURES` precede
`SENDER` and `INBOUND`, which they already did through O78; what changes is that `RUN` also passes through
`FIXTURES` before it may mint unattended work. `ADEQUACY` precedes the first rung-1 claim, so it sits before
`VENTURE`. The vendor floor precedes `RUN`: `MANAGED → HOST → PROBE → RUN` stands, and `RUN` is thinner.
`OVERNIGHT` stays last and gains a precondition: `UNITS` has thirty rows, so row 12's comparison is readable.

**Under K4, §19 is sorted by the commodity line before it is ordered by dependency.** Kernel-four nodes first
(direction: `DATA`, `STORES`, `READBACK`; record: `LOG`, `MARKET`, the hash chain; truth: `ADEQUACY`, `REHEARSE`,
`RECON`, `PROBE`; taste: `MINE`, `CURATE`, `CONTROLARM`); vendor-surfaced nodes last and each with its
`vendor_wins_if:` on the node (`P1`, `P2`, `P6`, `P7`, `BELL`, `SUPERVISE`, most of `RUN`'s argv composition).

**The first three things built.**
1. **`DATA` and the constitution.** Seven files written from rows that already exist, one renderer, one lint, the
   archive move. Zero runtime, and it is the only step that makes every later brief fit in 8K tokens.
2. **`LOG` with the decision meter and the two leases.** `bin/log` with the hash chain, `founder.last`,
   `founder.lease`, `decide.jsonl` with admission control and the claim, and the units table's first rows written
   from `~/.agentvibe/events.jsonl` (R27, R29 are readable the same day). This is the sensor the whole controller
   lacks, and it is cheaper than any page.
3. **`RUN` as a thin composer over the vendor floor, `PROBE` authored apart, one bounded-day intent with a
   stranger anchor.** `--restricted --tools --add-dir --no-session-persistence --autocompact <full>` (MEASURED: A4,
   A10) under the managed denies; the probe attempts what the launcher composed; one intent of the harness venture
   whose done-test names a stranger's reply through `bin/inbound` (Q8's default). Read the log in the morning, and
   count the rows in §A that changed.

---

## 8 · Scope notes

**Read, whole, in the brief's order:** `review/thinkers-digest.md`; `review/thinker-B.md` (primary),
`thinker-A.md`, `thinker-C.md`; `SPINE.md` §A–§N entire; `FINAL-PLAN-v2.md` §0–§23 entire (9,968 lines, in
chunks); `rethink/SYNTHESIS.md` entire; `research/world.md`; `DECISIONS.md` §15–§23; `CLAUDE.md` (as loaded),
`AGENTS.md`, the seven engine files under `.claude/agents/`, `.claude/lenses.yml`, all six playbooks. Not opened,
per the brief: `round-6/`, the scratchpad `returns/`, any session file. No existing file was edited; this is the
one file written.

**Decided alone (orchestrator-class, from rules already on the page or from a measurement):** O81–O103 as
mechanisms; the doctrine amendment in B1 and v96 (costed, not hidden); the R12 split; the adequacy axis; the verb
table; the dead-man lease and the stop verb; the plant model and the dial inventory; sequential skill testing;
probation; the curator's held-out, seed and canary; the data-first inversion and the constitution; the shadow
subsidy line. Each is inside an existing founder row or touches none.

**Sent to the founder:** eight questions (§5), each with the default this document proceeded on; five FOUNDER ROW
proposals (v83, v87, v97, v98, v99), none decided here, each with what the founder gains and loses and the
evidence the thinkers gave. Reversibility of every proposal: all are data and program shapes, reversible by a diff,
except the checker-family key and the box, which are purchases, and the founder-hours ceiling, which is the
founder's own time.

**Not re-litigated:** what the thinkers settled by measurement (A1–A10); R5's arithmetic; the census's figures.
Where a fix starts from a measurement it says which.

**Single family, single agent.** This is one Anthropic model reading prose after three lanes of the same family.
By the plan's own ladder it is rung 4: it ranks and flags, and certifies nothing. The two findings it leans on most
for its own shape (B1, B5) are findings about documents like this one, and the honest reading of a design round
that produced twenty-three mechanisms is the count in O93: how many of them change after the first measured
overnight.
