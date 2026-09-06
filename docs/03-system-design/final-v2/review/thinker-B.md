*Recorded verbatim by the orchestrator from the lane's return file (scratchpad/returns/thinker-B.md, 40583 bytes). Sealed lane: reviewer engine on Fable, no review/, round-6/, returns/ or session files read. Findings, never fixes. Nothing in the plan changed by this record.*

# Thinker B · the outsider · Keel (THE PLAN v2) · 2026-09-06

Posture: control-systems and organisational economics. I distrust prose plans, and this is 958,966 bytes of one.
Findings are severity-first. FOUNDER ROW findings are labelled and state what evidence would move them.

## Findings

### B1 · P1 · The plan is a rung-4 artifact by its own ladder, and its process optimises the document, not the system
**where** §11.2: *"4 · SAME-FAMILY REVIEW usable to RANK and to FLAG. Never sufficient to certify."* Header: *"Nothing here was built, installed, authenticated, spent, published or pushed."*
**the problem** Measured on this tree: 584 `ABSENT` marks, 170 `Mechanism:` lines, 28 distinct `bin/` programs named of which 26 do not exist, 38 named `keel/` stores and no `keel/` directory. Every reviewer of this plan (challenge, census, the rethink lanes, me) is a single Anthropic model reading prose. By the plan's own ladder that is rung 4: it may rank and flag, never certify. Yet the plan's rows are marked DECIDED and "never re-litigated." The rethink round produced 80 mechanisms and 17 rows and zero lines of code; the loop's feedback signal is reviewers' agreement with the text. A control loop whose sensor is the plant's own description converges on a consistent description, not a working plant.
**why it matters** Every decision in §A was taken at maximum uncertainty: before the first run, the first window, the first which. The document's growth (v1 to v82, O1 to O80, 218 strikethroughs, 54 "moved" notes) is the visible output of optimising the wrong objective. Each additional mechanism specified before contact with reality is specification debt: it will be re-decided when the first night falsifies its premise, and the "never re-litigated" rule raises the price of that.
**what would change** Label the whole plan LOW-CONFIDENCE in its own header, as §11.2 requires of any rung-4 claim. Freeze §A. Build the three-first (log, mining, one driven venture) and treat every §L mechanism as a hypothesis with a `wins_if:` of its own. FOUNDER ROW on the standing "go, no building yet" (DECISIONS §1): what would move it is the plan's own §19.3 sentence, *"everything in this design is a claim about what happens when that runs."*
**how we would know** Count rows whose text changed after the first measured overnight. If it is a third or more, the pre-build decisions were noise and the round should have been a build.

### B2 · P1 · One unbuilt program is the enforcement point for the whole control plane, and it will be written by the thing it constrains
**where** §3.5: *"The Operator never composes argv itself ... `bin/run` (ABSENT) composes the argv."* §12.1 never-list: *"any edit to the system's own judging machinery."*
**the problem** `bin/run` is named as the mechanism behind at least fifteen rules (v34, v37, v45, v67, O21, O22, O26, O27, O28, O32, O39, O53, O61, O71, O73, O77). `bin/watch`, `bin/send`, `bin/probe`, `bin/check-stores` carry most of the rest. There is no defence in depth: one defect in one program voids every interlock at once. Worse, v64 makes the harness the first venture, so `builder` on Fable writes the launcher that narrows `builder`. The plan forbids agents editing judging machinery, but the judging machinery is 100% ABSENT and will be authored by agents. The only reviewer of that code is the founder (irreversible tier) or a same-family reviewer (rung 4).
**why it matters** The bootstrap has the founder reading and certifying roughly 26 programs of security-critical code, which is precisely the bottleneck role the plan promises they will not hold. Or the founder waves it through, and the cage is built by the prisoner. Either outcome falsifies a headline claim.
**what would change** Two things a control engineer would insist on. First, independence of enforcement layers: the argv narrowing (`--restricted`, `--tools`) and the managed deny file are vendor-enforced today and need no code; make those the floor and let `bin/run` be a convenience above them, so a defect in `bin/run` cannot widen a grant. Second, a written-by-hand rule for the four programs that touch the world (Sender, Watch, door, launcher): founder-authored or founder-line-reviewed, tiny by design, with `keel/fixtures/` (O78) as their only admission test.
**how we would know** Diff authorship of `bin/run`, `bin/send`, `bin/watch`, `bin/door` by actor. If any is agent-authored and merged on a single-family verdict, B2 has happened.

### B3 · P1 · The founder's adjudication rate is the system's throughput bound, and it is unmodelled
**where** §3.3: *"Staged as a which, with both options built and left for the founder, who answers with one tap."* §2.7: *"If the system needs more than this, the design has failed."*
**the problem** Every question outside the envelope becomes a which; every which builds two options and waits on one human. Queueing theory is unforgiving here: if whiches arrive faster than one founder resolves them, the queue grows without bound, and v55's standing intents plus ten ventures guarantee the arrival rate. The plan budgets rings (three a day) and budgets tokens (the reserve), but it never budgets whiches, and "one tap" is not the cost; reading two built options and choosing is the cost. Building both options also burns capacity on the unchosen half by construction, a 50% waste rate on exactly the decisions that matter most. v76 handles the founder's absence by executing defaults, which is not a throughput fix but a way to drain the queue without a decision.
**why it matters** The scarcest resource in this company is founder decisions per day. The plan measures founder-minutes per finished intent after the fact and controls nothing before it. At scale the morning is an adjudication queue, which is exactly the "inverted architecture" §0.1a fears, arriving by a route nobody named.
**what would change** Treat founder decisions as a capacity like the window: measure decisions per day, hold a which budget per window, and have the Desk refuse to open a which when the backlog exceeds measured throughput times the intent's horizon. Build one option and a written second unless the two differ in a way a ten-word summary cannot state.
**how we would know** Whiches opened versus whiches answered per week. A growing backlog is the founder as bottleneck; a shrinking one with rising founder-minutes is the same thing paid in time.

### B4 · P1 · R12 on the harness cannot falsify assumption 1, so row 16 is open and the "cheapest measurement" is uninformative
**where** §0.1a: *"what fraction of the harness venture's first thirty real done-tests reach rung 1 without inventing an anchor. It is the cheapest measurement named anywhere in the round."*
**the problem** Assumption 1 is that most company work has a deterministic anchor. The harness is software, and software is the one domain where that is known to be true. Sampling thirty done-tests from it measures the anchorability of software. The plan itself says the evidence "comes from the most anchorable venture that could have been chosen" and then names that venture as the test. This is selection on the dependent variable. "Without inventing an anchor" is also undefined, so the fraction is whatever the writer of the done-tests wants it to be.
**why it matters** Row 16 has "the largest blast radius on this page." A measurement that cannot return a low value will return a high one, and the founder will read it as settling the roster, the night, and the trust score.
**what would change** Run R12 on the founder's own past work: classify a random sample of tasks from the 3,060 transcripts by domain (marketing, finance, ops, design, code) and ask, for each, whether a check outside a model could have judged it. That sample exists, costs nothing, and covers company work rather than harness work. Define "inventing an anchor" operationally: an anchor that tests a property the done-test did not state.
**how we would know** A per-domain fraction. If code is 80% and everything else is under 30%, the architecture inverts for the ventures that are not the harness, and the plan should say so before wave two.

### B5 · P1 · Sixteen of sixteen ratifications are being filed as founder decisions, which launders the orchestrator's design into "never re-litigated"
**where** §20.7: *"The founder chose the recommended option on all sixteen."* and *"Sixteen for sixteen is the shape of a synthesis whose options were well separated — or of one whose alternatives were not written strongly enough to win."*
**the problem** Read the option tables in SYNTHESIS §1. Option A is argued; B is "cheaper" and C is "no work" in nearly every row. That is a choice architecture, not a decision. Rows v66–v81 are then labelled FOUNDER, fixed, reopenable only by name, with the same status as v1 (fourteen agents), which the founder actually originated in their own words. The plan notices the tally is ambiguous and keeps the label anyway.
**why it matters** Governance. The rule that protects the founder's real decisions from erosion is being used to protect the orchestrator's designs from revision. The most expensive consequence is B1: mechanism decisions taken before contact with reality now carry the highest revision cost the document has.
**what would change** Two classes of founder row: founder-originated (the decision text is the founder's words) and founder-ratified (the founder picked A from a list an agent wrote). Ratified rows are reopenable by any engine with a reason and a falsifier. Every future option set carries a genuine second option with a real argument, and the synthesis records the founder's agreement rate as a number the founder sees.
**how we would know** Count FOUNDER rows by class. My count from DECISIONS §15 and §18: roughly 14 originated (v1–v5, most of v54–v65) and 16 ratified. If future rounds run above 90% agreement, the founder is not deciding.

### B6 · P1 · A plan this long cannot bind, because nothing that acts can read it; it is the un-generated prose it refuses
**where** §4.1: *"a number written into prose stops being re-derived and starts being quoted, and then it is wrong and nobody notices."* §5.2a: *"one file with several renderings is the only fix that does not depend on somebody remembering."*
**the problem** 155,990 words, roughly 240K tokens. No engine loads it: the session-start payload is capped at 4,096 bytes precisely because the runtime truncated a 27KB one. So every builder reads a slice, and the census found the exact failure that predicts: the rethink round "was applied to the early sections and not carried into the late ones." The plan's cure for drift is generators from single-source YAML (O2, O3, O4, O5, O8), all ABSENT, so today the plan is four hand-kept copies of the department table with three of them struck through. The 218 strikethroughs and 54 in-place "moved" notes make the current state a diff the reader computes in their head.
**why it matters** The binding artifacts for a builder are the roster, the routing table, the schemas, the price file and the facts store. Those are the 2% of this document that would fit in a brief. The other 98% is argument and archaeology, valuable as record and worthless as instruction.
**what would change** Invert now, before build: write `roster.yml`, `routing.yml`, the four schemas, `prices.yml`, `facts.yml`, and a `rules.yml` with one row per rule carrying `mechanism:`, `path:`, `state: exists|absent|wish`. Render the prose from them. Move every superseded paragraph to an archive file so the live plan carries only live sentences.
**how we would know** A builder brief for any §L program that fits in under 8K tokens with nothing missing, and a count of "corrected in place" notes that stops growing.

### B7 · P1 · The economics rest on a supplier-controlled resource the supplier says not to use this way, and the plan refuses to price the alternative
**where** §9.10: *"the thing at risk is the account, and the account is the company's whole capacity."* §20.1 row 17: *"deliberately carrying no expiry: attaching one would decide row 1."*
**the problem** Every ceiling, reserve, gauge and cost line is denominated in a consumer seat whose quota is unpublished, whose window shape changed once already (the weekly window arrived after FINAL), whose cache TTL collapses twelvefold on overage, and whose terms name automated access as prohibited except by API key. That is supplier risk with no hedge. Row 17 (the metered key) is "downstream of row 1 and cannot be answered before it," which is backwards: the metered-key economics are computable today from the very price table §9.6 carries, and knowing them is what would let the founder decide row 1 with a number.
**why it matters** If the seat is withdrawn or throttled, the company stops the same night, and the plan has no second economics. If the seat is kept, the founder is running a business on an arbitrage whose size they have never seen.
**what would change** Keep USD as the shadow price, as v74 does, and add one line: cumulative shadow API cost of unattended work versus the seat's price. That number is the implied subsidy and the size of the bet on row 1. Pre-compute the metered design (batch at 50%, five-minute TTL, no weekly window, no reserve) as a losing image with a `wins_if:` that reads: the subsidy exceeds N times the seat price, or the vendor narrows the terms.
**how we would know** The subsidy line on the briefing. If it is small, row 1 is cheap to close by buying a key. If it is large, the founder knows what they are betting.

### B8 · P2 · The rung ladder conflates verifier independence with property adequacy, and the rung-1 share invites Goodhart
**where** §11.2: *"for most company work there is a deterministic anchor, and finding it is the intellectual task of writing the done-test."* §21.1: rung-1 fraction *"↑ on rated."*
**the problem** Rung 1 is "the world," but the row includes "a test passes," and the test is written by `tester`, a model. What the ladder measures is who executed the check, not whether the check tests the claim. A deterministic check of the wrong property is deterministic. The blind tester's anchor ("fails before, passes after") proves sensitivity to the change, not correctness of the property. v73's mutation case is a known-bad input, not a known-bad artifact. And a metric that "must not fall" on a share of checkable work will be met by writing done-tests that are checkable: the incentive runs toward trivially anchorable outcomes.
**why it matters** The system's central quality number becomes a measure of how testable the founder's goals were made, not of whether the work is good. That is the exact self-report failure §11.7 exists to catch, one abstraction up.
**what would change** Two axes on every anchor: verifier (world, other family, founder, same family) and adequacy (does the anchor test the done-test's stated property, judged by a second reader who did not write either). Count rung 1 only when both hold. Report rung-1 share beside the share of intents whose done-test was rewritten after the anchor was chosen.
**how we would know** If done-tests get shorter and more mechanical over a quarter while founder rejections of passed work rise, Goodhart is running.

### B9 · P2 · The lexicographic Desk moves the starvation problem rather than solving it, and its replay cannot measure value
**where** §4.5: *"The Desk ranks lexicographically: obligations first ... then the founder's weight band, then cheapest inside the band."*
**the problem** Any strict priority order starves the lower tiers whenever the upper tier saturates capacity. A venture with customers produces an obligation tide (every support thread is an obligation with a due date); under this comparator the founder's weight-5 intent never runs while obligations exist, which is the formula's cheap-work starvation with a new perpetrator. "Cheapest inside the band" reintroduces the cost bias within a band. Nothing shares capacity across ventures: two driven ventures compete by whichever has more obligations. And O20's replay over the Desk's own rows measures dispatch counts under two orders, not outcomes, because intents that were not dispatched produced no outcome to compare.
**why it matters** Scheduling under a shared resource is a solved problem with known failure modes; a bespoke comparator will rediscover them one night at a time.
**what would change** Weighted fair queueing across ventures with the founder's weight as the share, obligations pre-empting only inside their own `lead_time`, and slack-based ordering among obligations. Keep the comparator small; the shape is the point.
**how we would know** Replay a synthetic month with an obligation tide on one venture and count the other venture's top-weight dispatches. Zero is starvation.

### B10 · P2 · Trust-gated routability deadlocks at cold start
**where** §5.6/O26: *"below the floor on a move class, that class is unroutable for that agent until a rehearsal passes."* v71: *"at least one rehearsal case with a known answer."*
**the problem** The trust score prints `insufficient` below a sample floor (O25), the floor is shared with skill admission which the plan says 2–3 cases is below, and a pack requires one rehearsal case. One is below the floor. So a new agent's every move class is unroutable until it has enough anchored runs, which it cannot accumulate because it is unroutable. Either the floor is one, which makes it decorative, or every agent starts deadlocked and someone hand-waives it, which is the un-mechanised path the plan refuses.
**why it matters** Wave one has ten agents and zero anchored history. Day one is ten agents and no dispatch.
**what would change** A probation state: below the floor an agent is routable only on the Floor or under a founder-authored intent, and each anchored run counts. State the floor as a number and the probation as a status in `roster.yml`.
**how we would know** Dispatch counts per agent in the first week. Zero for any wave-one agent is the deadlock.

### B11 · P2 · Skill admission at n=2–3 over 2,111 candidates is a false-positive factory, and expiry does not cure it
**where** §7.3: *"an admission on 2–3 cases is admission below the floor, so it is recorded as `insufficient` and is exactly why v19's expiry is what does the work here."*
**the problem** With-skill versus baseline on two or three prompts has a false-positive rate near a coin toss; across two thousand candidates that admits hundreds of skills that do nothing, each taxing every run's startup metadata (v77). Expiry then re-runs the same underpowered test. The plan's own statistics rule (O25) says this sample supports no decision, and the mechanism decides anyway with a label attached.
**why it matters** The library's cost is paid on every run and its benefit is unmeasured. R15 says nobody has measured selection accuracy at scale; this is how it degrades.
**what would change** Sequential testing on real work: provisional admission, activation joined to anchor outcome (O41), and a decision when the evidence crosses a threshold, in either direction. The admission eval becomes a smoke test for triggering, not a quality verdict.
**how we would know** Among admitted skills, the share whose activated runs pass their anchors no better than baseline after a quarter.

### B12 · P2 · The curator grades every agent and nothing grades the curator; rung 1 rests on model-written cases
**where** §13.1: *"the curator's grant is the only one whose writable scope includes the memory paths."* §11.10: *"The cases come from the founder's own past."*
**the problem** The curator writes memory, the taste store, the negatives, slice precision (O45), the calibration number (O80), and the rehearsal cases the trust score is computed from. Its own anchor is a format check: source, date, expiry, falsifier present. A well-formed false item passes. The rehearsal runner is a no-model program, but the cases it runs are produced by a Sonnet curator over a Qwen classifier's segmentation of transcripts. The foundation of rung 1 is a model-authored exam. O62's held-out test applies only to taste.
**why it matters** A single agent with unchecked authority over what the company believes and how every other agent is scored is the org-chart failure the plan otherwise designs against.
**what would change** Two curators on two families would be the plan's own answer and is unreachable today; the reachable one is a held-out discrimination test (O62's shape) on every case set, not only taste, and a founder-labelled seed of cases that no curator may edit, the `class: calibration` set of v78 extended to memory.
**how we would know** Inject a deliberately false but well-formed memory item in the scratch house and see whether anything downstream refuses it.

### B13 · P2 · Reversibility is judged per act by the run, which puts a rung-4 judgement at the most consequential gate
**where** §12.2 flowchart: *"Can the system itself undo this within the undo window, with nobody else noticing — and has that undo been DRILLED?"*
**the problem** The envelope is keyed on reversibility, and the plan is proud that this stands alone in the world. But the question in the flowchart is answered by the run, a model, about its own intended action. The default `never` list and the door's classes are data; the flowchart is not. A persuaded run answers yes.
**why it matters** The one-way/two-way decision is where a mistake is unrecoverable, and it is the one decision the plan lets a model make about itself.
**what would change** Reversibility is a property of a verb in the admitted-tool file (O24's `effect:` is already this) and never of an act. A run chooses verbs; an unlisted verb is one-way by default. Delete the run-side question.
**how we would know** Grep the launcher: if any reversibility predicate takes model output as input, B13 stands.

### B14 · P2 · FOUNDER ROW · v76 widens autonomy exactly when nobody can pull the cord
**where** §4.4: *"the reserve is released to autonomous work when the last event is older than the reserve's own horizon."*
**the problem** Safety engineering uses dead-man principles: absence of the operator narrows what the machine may do. v76 inverts it: absence releases the reserve and executes which defaults. The reasoning (idle capacity is waste) is an economic argument that ignores that the founder's absence is also the period with no recall, no cord (B19), and no wake-me that anyone will act on.
**why it matters** The worst night to run at full capacity is the one where a wrong default fires and nobody sees the briefing for a week.
**what would change** Release the reserve only to work whose anchors are `effect: none` and whose outputs stage; never execute a which default that touches a one-way verb while away. What would move this row: one drilled week away with the defaults firing and nothing regretted, or an incident.
**how we would know** The count of which-defaults executed while away that the founder later reversed.

### B15 · P2 · R5 is one week from the busiest week the machine has had, and a decision is being priced on it
**where** §15.1a: *"span 2026-08-30 21:44 → 2026-09-06 09:39 (156 h, all the log retains)."*
**the problem** The week measured is the week this plan was written, with the founder running lanes day and night. Sleep in that week is a floor on sleep, not an estimate. The plan carries a caveat and then writes "prices the lane at zero" three times. One sample from a non-representative period, presented with three decimal places, is false precision.
**why it matters** v79's charter field is fine either way; §I row 15 is being nudged closed by a number that cannot bear it.
**what would change** Log `pmset` continuously from now and re-read R5 after a month that includes a weekend away. State the number as a floor.
**how we would know** The longest gap over thirty days. If it stays under an hour, the lane is cheap to skip; if a weekend appears, the week measured was the outlier.

### B16 · P2 · The taste loop trains on ratifications of model recommendations
**where** §12.5 which fields: *"the recommendation and its one reason."* §11.6: *"a fraction of rejections is held out, so it is scored on predicting what the founder wants rather than what they approve."*
**the problem** Every which carries the run's recommendation. A founder answering with one tap will mostly take it (the plan's own 16/16 is the evidence). The taste store is derived from those taps. So the store learns the model's preferences with the founder's signature on them. O62's held-out test checks whether the store separates accepted from rejected; it cannot detect that "accepted" is "recommended."
**why it matters** The one asset the plan calls the founder's alone becomes a mirror of the model, and every later taste check certifies the model against itself at rung 2.
**what would change** A control arm: on a random fraction of whiches, omit or randomise the recommendation. Record agreement with the recommendation as a number beside the taste score.
**how we would know** Agreement above 90% with the recommendation present and materially different choices without it means the store is not the founder's.

### B17 · P2 · The onboarding pack's rehearsal case contradicts O11, and R19 is contaminated as written
**where** §17.1: *"Rehearsal case, known answer | `keel/shared/packs/<agent>/rehearsal.md` | the curator, as a v18 rehearsal body."* §7.2a: *"The generator writes eval-only bodies into `keel/golden/` (ABSENT) and never into `.claude/skills/`."*
**the problem** O11 says a rehearsal case must not be readable by the run it judges. v71 puts a rehearsal case in the agent's pack, and R19 tests packed versus unpacked on the same known-answer cases. Either the pack's case is readable by the agent (contamination, and R19 measures memorisation) or it is not (then it is not part of what the agent carries, and "pack" means "a file in golden"). This is a twenty-third contradiction the census's twenty-two did not list.
**why it matters** R19 is the falsifier for a founder row. A contaminated falsifier cannot fail.
**what would change** Split the pack: the exemplar and the demonstration are the agent's; the rehearsal case is golden's and is referenced, never carried. R19 runs on a case the packed agent never saw.
**how we would know** Grep a running agent's loaded context for any known answer.

### B18 · P2 · "Two kinds of thing and nothing else" is false; the founder owns roughly forty dials the plan never inventories
**where** §2: *"The founder writes two kinds of thing and nothing else is required of them."*
**the problem** From my read: reserve share, interruptions per day, tick, WIP per venture, driven limit, sessions ceiling, undo window, exploration fraction, weight per venture, ceiling per venture and per intent, horizon per charter and intent, `recurs:` on two drills, `cacheTtl` and `valid_until` and `fallback:` and `maxTurns` on fifteen agents, `valid_until` on every skill and memory item, numeric wake-me thresholds per venture, the sample floor, N in O73, the per-run ceiling on standing intents, the high-water fraction. Each is "the founder's number, not a rule's," which is the plan's way of not deciding. Every uninventoried dial is a place the founder is the bottleneck without knowing it.
**why it matters** A control system with forty setpoints and no setpoint table is tuned by folklore.
**what would change** A `settings.yml` schema listing every founder-set value, its default, and the briefing line that is its evidence. Count them. Delete the ones with no evidence line.
**how we would know** The count, and how many carry a default the founder has never touched after a quarter.

### B19 · P2 · The emergency stop has four upstream dependencies
**where** §12.9: *"One tap from mission control ... one word on the Floor, one command in a terminal, and tested on purpose."* §14.11: *"Every route in the diagram above that writes ... checks the keychain-held token."*
**the problem** From the phone, the cord is a write route: it needs the tunnel up, the token check passing, the keychain readable by a non-interactive process (R3, open), and the Mac awake and logged in. From the Mac, it needs `bin/run` to have recorded a pgid. There are also at least four stop semantics now (STOP file at next tick, pgid signal, Sender recall window, cloud UNKNOWN). An e-stop with dependencies is a normal control, not an e-stop.
**why it matters** The one control the founder is told stops everything is the one most likely to be unreachable on the night it is needed.
**what would change** A stop that needs nothing: the Watch refuses to dispatch unless a founder-renewed lease is fresh (the dead-man of B14), so the absence of the founder's heartbeat is itself the stop. Keep the tap as the fast path.
**how we would know** Drill the cord from the phone with the Mac's network off and count what stops.

### B20 · P3 · Standing intents never expire; everything durable carries a horizon
**where** §2.8: *"An intent that never expires."* §13a.6: *"Everything durable carries a horizon."*
**the problem** Two rules, one object. `bin/horizon` walks intents; a standing intent has no horizon to walk. A standing intent that has fired uselessly for a year is exactly what expiry exists to catch.
**what would change** A standing intent carries `valid_until` like everything else; the disposition is Refresh, Deprecate, Waive.
**how we would know** The lapse record naming a standing intent.

### B21 · P3 · "No durations" is over-applied into "no plant model"
**where** §4.1: *"the SPINE forbids durations in this plan."*
**the problem** Refusing schedules is right. Refusing measured rates is a different thing, and the plan has no capacity model at all: runs per window per shape, tokens per run, intents per week. Without it the reserve cannot be sized, the WIP limit cannot be derived, and "two driven ventures" is a guess. The plan names "ten real moves" as the first measurement, which is the right instinct; it should be a `facts.yml` row set, not a sentence.
**what would change** A units table in `facts.yml`: per shape, measured tokens per run and runs per window, with `valid_until`.
**how we would know** The reserve and WIP numbers derived from it rather than typed.

### B22 · P3 · FOUNDER ROW · Once O2 and O5 generate the files, fourteen agents are fourteen loadouts, and v1's stated cost is nominal
**where** §5.2a: *"`keel/shared/roster.yml` (ABSENT) is the single declaration of the fifteen."*
**the problem** An agent file is a model, a grant, a namespace set, an anchor and a prompt, generated from one YAML row. FINAL's three shapes with loadouts assembled per run are the same object with a different name. The overrule's cost ("an unoccupied band") is real only if the names carry coordination cost, and v6 forbids the coordination. What v1 actually buys is the per-agent trust denominator and the packs, which are orthogonal to the count. This is not a mistake by the authors; it is a case where the founder's decision and the losing image converged, and the plan should say so rather than keep paying rhetorical cost for a difference that has become a file format.
**what would move it** Nothing needs to. Note it as converged, and let v31's routing-count falsifier decide the count.

### B23 · P3 · The Watch is an open-loop controller with static setpoints, and the plan should say that plainly
**where** §4: *"it must be almost free to run, and it must usually decide to do nothing."*
**the problem** The Watch ranks, materialises obligations, decides to ring, releases the reserve and fires which defaults. It is the controller, and the cheap-pass argument is about cost, not authority. Its setpoints are fixed numbers with no feedback except "evidence moves them," through the founder. That is defensible (automatic tuning is how systems drift), but it should be named as a choice: static gains on a non-stationary plant, retuned by hand, with O20's replayer as the only offline tuning path.
**what would change** One sentence in §4, and O74's control charts pointed at the Watch's own decisions (ring rate, dispatch rate, refusal rate) so drift in the controller is visible.
**how we would know** A control chart on the Watch's own outputs exists.

## What is right

- **Provenance on every paragraph and a losing image with a `wins_if:` for every decision.** No plan I have read keeps its rejected alternatives live with a revival condition; this one does, and it is the one part of the doctrine that survives contact with B1.
- **Staged-not-sent with a no-model Sender.** Separating the decision from the act, and putting the act in a program a prompt injection cannot persuade, is the correct control-plane shape and has no shipped analogue.
- **The trifecta split as argv, not policy.** Removing a leg at dispatch time is structural; most systems remove it with a sentence.
- **Refusing self-report everywhere it could be measured instead.** Slice precision, calibration per agent, the reconciliation against records the company does not write: every one aims at the failure the corpus actually shows.
- **The document knows its own failure modes.** The 29-of-29 story, the four copies of one table, the count that drifted from the column beside it: the plan diagnoses prose rot precisely and prescribes generators. It is the right prescription; it has only not been taken yet.

## The big vision

**What this system should become.** Not a company of fourteen agents and not seven pages. A measurement instrument wrapped around one person's judgement. The durable asset here is not the roster, not the surfaces, and not the launcher; those are commodity within a year, and two vendors shipped half of them during the fortnight this plan was written. The asset is the ledger: a growing, world-anchored record of what this founder decided, what was tried, what failed and why, and which checks predicted which outcomes. Every serious agent runtime will ship dispatch, worktrees, teams, messaging, scheduling and a fleet page; none will ship a decade of one founder's labelled judgement with provenance. Build for the asset, and let the vendors build the rest.

**What it is optimising for versus what it says.** It says founder leverage. It is optimising for consistency of a document and for the founder's window. Founder leverage means decisions per day at a given quality, and the plan never measures decision throughput, never budgets whiches, and executes defaults when the founder is away. Read as an economist: the plan prices tokens exhaustively and never prices the founder's attention, which is the scarcer input by three orders of magnitude. The first line on the briefing should be founder decisions taken, deferred, and defaulted, with the cost of each.

**What is entirely missing.**
- A revenue and customer feedback loop into dispatch. Contact rungs exist as a ladder; nothing routes capacity toward the venture whose rung moved. The Desk ranks by the founder's weight, which is an opinion, when the world is already voting with replies and payments.
- A plant model (B21). No rates, so no sizing.
- An internal market. Fourteen fixed roles is an org chart. The alternative a different discipline builds is a market: agents, models and skills compete for routing on measured anchored outcomes per unit of window, and the roster is whatever survives. O26's trust score and O75's cost per rung movement are the price signals; the plan builds the signals and then hard-codes the allocation.
- Cross-venture learning as a first-class store. Negatives are per venture with a house exception; the compounding asset is what generalises across ventures, and the plan treats it as an edge case.
- A metered-key economics beside the seat economics (B7).

**What will be commodity within a year and should not be built.** Page 2 (teams ship it), page 7 (Langflow-class canvases exist), the terminal pop (pixel-agents has it), agent messaging (both vendors ship it), the graph page, most of `bin/run`'s argv composition once vendors expose per-agent policy as files. Every one of these is a routing change away from a vendor feature, and the plan half-knows it: "take the mechanism, not the dependency." Apply the sentence to the pages.

**What is the actual moat.** The claim ledger with resolvers, the negatives store with reproducing commands, the taste store if B16 is fixed, the anchor library with mutation cases, and the reconciliation against outside records. These compound; nothing else here does.

**What the best system in each of the founder's fields would require that this plan does not yet ask for.** In engineering: a done-test written before the work is standard practice, and this plan has it; what is missing is the property-adequacy check (B8) that makes it more than testability. In growth and marketing: the anchor is a stranger's action, and the plan is honest that this is rung 2 or 3; the best system would treat every outward artifact as an experiment with a pre-registered metric and route the next dispatch on the result, which is the feedback loop above. In finance and operations: the reconciliation is the right idea; the best system would make the bank line the source of the venture's weight, not the founder's opinion. In design: the perception loop is right; the best system would have the founder's taps as the training signal only when the recommendation was hidden (B16). In research: the citation resolver blocking on `scout` is already ahead of anything shipped.

**What would make it merely adequate.** Building the pages and the roster on the seat, running the harness as the only venture for a year, and reading a green rung-1 share as success. That is the path of least resistance and the plan's own build order leans toward it.

**The three decisions that matter most and are not on the open list.** First, whether the founder's attention is budgeted as a resource (B3); nothing else scales if it is not. Second, whether allocation is a fixed roster or a market on measured outcomes; the plan has built the signals for a market and chosen an org chart. Third, whether the first venture after the harness is one where the anchor is a stranger's action, because that is the only test of assumption 1 that means anything (B4).

## Scope notes

**Read, whole, in the brief's order:** SPINE.md (997 lines, §A–§N), FINAL-PLAN-v2.md (all 9,968 lines, §0–§23), rethink/SYNTHESIS.md, research/world.md, DECISIONS.md §15–§22, CLAUDE.md (as loaded), AGENTS.md, the seven engine agent files in `.claude/agents/`, `.claude/lenses.yml`, all six playbooks.

**Measured on this machine, 2026-09-06:** plan size 958,966 bytes, 155,990 words, 9,968 lines; marker counts in the plan: `ABSENT` 584, `WISH` 32, `EXISTS` 30, `UNVERIFIED` 59, `Mechanism:` 170, `The cost, once` 54, strikethroughs 218, "moved 2026-09-06" 54, `wins_if` 92, `bin/` 438; 28 distinct `bin/` programs named, 5 files in `bin/` today, no `keel/` directory; `scripts/prompt-standard.test.mjs` pins `['claude-opus-5','claude-sonnet-5','claude-fable-5','claude-haiku-4-5']` (confirms §9.9); `budget-guard` has 0 references in `.claude/settings.json` (confirms O50); 135 entries under `.claude/skills/`; 60 files in `mission-control/`; `.claude/mcp-policy.json` is 65 lines; `~/.agentvibe/events.jsonl` is 3,843 lines; `claude` 2.1.263; `codex` absent; `tmux` 3.6a present; 68 verdicts in `.qa/verdicts/`, 42 ledger claims, 172 session files. Every figure the plan states about this tree that I checked matched.

**Could not settle from here:** all 25 OPEN R-questions; R3 (keychain from a detached process) and R23 (concurrency ceiling) would need a run I was told not to make. The `pmset` re-measurement in B15 needs time, not permission. Nothing was run, installed, authenticated, spent or pushed; no file in the repository was edited.

**The seal:** I did not open `review/`, `round-6/`, the scratchpad `returns/` directory, or any session file. Where the plan quotes challenge C or census C, I read only the plan's own account of them.

**Single family, single agent.** This report is one Anthropic model reading prose. By the plan's own ladder it is rung 4: it may rank and flag, and it certifies nothing. Three of the findings above (B1, B4, B5) are also findings about reviews like this one.
