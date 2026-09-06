# L1 · drive — missions, cognition, tickets · rethink round · 2026-09-06

```
lane:     L1 · drive
sections: 01 Missions & drive (30) · 21 Agent cognition (36) · 22 Task & ticket breakdown (17) = 83 keywords
read:     parts/00, 02-direction, 03-operator §3.1-3.5, 04-watch-and-desk, 06-a-run, 13a-self-improvement,
          14-mission-control §14.7, 21-how-we-would-know · SPINE §A v1-v65, §B-§D, §I · DECISIONS §15, §17 ·
          COVERAGE 01/21/22 · research/cognition.md
fixed:    v1-v5 and v54-v65 are the founder's. Every proposal below improves INSIDE them. Nothing reverses one
rule:     (FOUNDER) (FINAL) (NEW: why) (FACT: source, date) on every claim · every rule names its mechanism or is WISH
```

**The one finding this lane would keep if it could keep only one.** (NEW: reasoning, from the plan's own rules) The
plan ranks, schedules, counts and re-attempts a thing it never defines. **Candidate work** appears in §2.4's door
flowchart, in §4.1 gate 5, and in §4.5 as *"each candidate carries four numbers"* — and it has **no store, no id, no
schema and no declared writer**, while the intent beside it has six fields (§2.2), the brief has eleven (v45) and the
handover has ten (§6.3). v44 established that every store declares exactly one writer and `bin/check-stores` refuses
one whose declared writer is not the only grant holding `Write` there. Candidate work fails that rule by being
absent from it. Nine of the eighty-three keywords below — sub-task decomposition, dependency ordering, ticket
dependency, blocked reason, aging, duplicate detection, cross-ticket linking, epic-to-ticket, retry — resolve to
*"the Desk handles it"*, and the Desk is a **no-model program that ranks a list nobody writes**.

---

## §01 · Missions & drive

| Keyword | Reading — for one founder, unattended at night | v2 | Verdict · proposal · mechanism · cost · settles · row |
|---|---|---|---|
| **Mission statement format** | standing orders a program re-reads, not a document a human re-reads | RENAMED · §2.1 the Charter, six lines | **KEEP** — six lines, phone-sized, load-refused if incomplete |
| **North-star metric** | one number the whole company chases | REFUSED · §11 | **REFUSE-STANDS** — a single proxy gets optimised instead of the goal; §21's six numbers with directions do the job without a target to game |
| **Goal tree** | how a goal becomes something dispatchable | RENAMED · §2, "intent then candidate work, two levels" | **RETHINK.** Give candidate work a store, an id and one writer. **Mechanism:** `keel/ventures/<v>/work/w-YYYY-MM-DD-NNNN.yml` — fields `intent`, `purpose`, `ceiling`, `blocked_on`, `attempts`, `last_failure`, `card`; proposals land in `work-draft/` and **the Watch materialises them after the store check**, which is v44's obligation pattern reused rather than a new idea; `bin/check-stores` refuses a live intent with zero work rows. **Cost, once:** one schema file, one directory, one branch in `bin/watch`. **Settles:** try to answer *"how many runs has this goal cost me"* from the logbook as designed — the join has no key. **Row: new** |
| **Sub-goal chain** | the same, one level down | RENAMED · §4 | **RETHINK** — same row as above; the chain is `intent → work → run`, and the middle link is the one with no schema |
| **Move-level task** | the unit that is born, works and dies | IN · §6 the Run | **KEEP** — disposable, one artifact, fresh context |
| **Done-test criteria** | the falsifiable statement written before work | IN · §2.2, also the `/goal` condition (v12) | **IMPROVE.** The `/goal` condition should be **the anchor command's exit code**, not the done-test's prose. **Mechanism:** `bin/run` composes `/goal "<anchor> exits 0, and <done-test>" or stop after N turns` from v45's `anchor:` field, which already exists and is already refused when missing. **Cost:** one line in the launcher; the 4,000-char limit binds the pair, not the prose alone. **Settles:** on ten finished intents, compare the evaluator's verdict against the anchor's exit code — every disagreement is a run that thought it was done. **Row: v12 amended by v45** |
| **Binding vs proposed goal** | who may create a goal | IN · §2.4, only the founder's door | **KEEP** — provenance beats opportunity, mechanically |
| **Priority queue** | what runs next when capacity frees | IN · §4.5, `Weight × Decay ÷ Cost` | **RETHINK.** A ratio over three crude numbers is the false precision §4.5 says it is avoiding, and dividing by measured cost means **cheap work permanently outranks expensive work**. With v55's standing intents firing forever and cheaply, the queue never drains, so an expensive one-off intent can starve indefinitely at any weight. **Proposal:** lexicographic order — obligations · work that unblocks other work · founder weight band · cheapest inside the band. **Mechanism:** `bin/watch`'s Desk; the tie-break stays cheapest-first. **Cost:** less code than the formula. **Settles:** replay `logbook/desk/<tick>.json` over one simulated month under both orders and count how often the top-weight intent was dispatched. **Row: §4.5, new row** |
| **Goal window cap** | the bound on how much one goal may eat | IN · §4, ceiling + WIP + 20 subagents | **IMPROVE.** v55 bounds a standing intent **per run** and nothing bounds it **per window**, so six standing intents across ten ventures are an unbounded aggregate of individually-bounded runs. **Mechanism:** `settings.yml` gains `standing_share_max` (a fraction of each window); `bin/watch` counts dispatches by intent kind and stops standing work at the line, never obligations. **Cost:** one counter. **Settles:** measure the standing share of a week's dispatches once the Watch runs. **Row: improves inside v55, does not reverse it** |
| **Competing mechanisms** | two implementations of one job | REFUSED · §1 | **REFUSE-STANDS** — and it is about to be violated: 13a.2's failure-sameness test and §4.5's repetition tripwire are one job. See *Retry ladder* |
| **Opportunity detection** | noticing work nobody asked for | IN · §2, standing intents to `scout` (v55) | **KEEP** — proposals only, never work |
| **Unsolicited work policy** | what happens to it | IN · §2 — cannot become an intent | **KEEP** — idle capacity buys knowledge, not goals |
| **Abandonment criteria** | how a goal dies without a founder | IN · §2, expiry + ceiling | **ADD.** Expiry stops an intent and **records nothing**, so the Watch will re-propose the same dead direction and the negatives store never learns. **Proposal:** an expired intent forces exactly one disposition — **Renew · Abandon (reason written to negatives) · Split** — the same three-way shape v19 already forces on skills. **Mechanism:** `scripts/ledger.mjs`'s disposition logic pointed at the intent store, plus `bin/horizon` (ABSENT), the single pass 13a.6 names as a WISH, which walks every durable store for a passed horizon. **Cost:** one pass, reusing shipped code. **Settles:** count intents that expired in a month with no disposition row. **Row: 13a.6, new row** |
| **Wrong-goal detection** | realising the goal itself is wrong | IN · §6, `/goal`'s *Impossible* verdict | **IMPROVE.** *Impossible* is judged by a small model reading the run's own context — self-assessment on the most consequential judgement in the system. **Proposal:** *Impossible* terminates **the run, never the intent**; retiring an intent needs the founder's tap or a `challenger` read. **Mechanism:** one rule in `bin/run`'s exit handling; the intent store's writer is unchanged. **Cost:** nothing; it is a refusal to widen. **Settles:** count *Impossible* verdicts on intents a human later completed. **Row: v12 amended** |
| **Blocked state** | stopped waiting on something outside | IN · §6, `outcome: blocked` naming what clears it | **IMPROVE** — the reason is prose, so nothing can *notice* the blocker clearing. `blocked_on:` as an id on the work row (see *Goal tree*) makes clearing an event the cheap pass reads. **Row: new** |
| **Stalled state** | alive, spending, producing nothing | IN · §4.5 decay + the stall detector | **IMPROVE.** The stall detector is `.claude/hooks/budget-guard.js`, which exists on this branch and is **registered nowhere** (FINAL/§4.6). A fuse that is not wired is a memory of a fuse. **Mechanism:** the founder registers it in settings, once. **Cost:** one settings line. **Settles:** the nightly probe asserts the hook fires. **Row: §4.6** |
| **Retry ladder** | how hard to try again before stopping | IN · §6, 13a.2 — "the same failure twice stops" | **IMPROVE.** 13a.2 marks its own WISH: *nothing compares two failure texts to decide they are the same*, so the rule is prose today. **Proposal:** sameness is a hash of `(anchor argv, exit code, normalised first N bytes of stderr)` — **the same hash §4.5's repetition tripwire already specifies**, one implementation for one job, obeying the competing-mechanisms refusal. **Cost:** one function, shared. **Settles:** replay a week of failed runs and count false pairings. **Row: closes 13a.2's WISH; new row** |
| **Escalation ladder** | who hears about it when a run stops | IN · §11 anchor ladder; 13a.1 *"the Operator is the escalation"* | **RETHINK — two v2 sections contradict.** §4.4 states the Operator is **not always on**; it exists inside a session. So a run that stops on defect at 03:00 escalates to something that is not running, and the escalation is silence until the founder opens a session. **Proposal:** the night's escalation target is a **row in the proposal queue plus the `wake-me` test**, never an agent; the Operator drains the queue at the next session. **Mechanism:** `bin/watch` owns the queue it already reads. **Cost:** one word in 13a.1 and one branch in the Watch. **Settles:** stop a run at night and see what, if anything, records it. **Row: 13a.1 corrected; new row** |
| **Pivot trigger** | changing what a goal is for | FOUNDER'S · §2 | **KEEP** — the system reports, the founder pivots |
| **Parking lot** | cheap ideas that are not now | IN · §4, parked tempo, surfaced at the briefing | **KEEP** — one tap promotes, nothing rots silently |
| **Out-of-scope folder** | rejected work, remembered | RENAMED · §13 negatives store | **KEEP** — a reason beats a folder |
| **Mission loop** | the thing that makes it move at all | IN · §4, the Watch; `/loop` refused (v12) | **KEEP** — sourced, free on its default branch |
| **Idle-time trigger** | what to do with capacity nobody claimed | IN · §4 gate 4, the routine window | **IMPROVE** — bound it: idle work must serve a live intent, a standing intent, or the negatives/knowledge stores, or it is a leak with a cheap price tag. **Mechanism:** gate 4 reads the same provenance test as gate 5. **Cost:** one condition. **Row: §4.1** |
| **Recurring mission cadence** | the company working on a rhythm | IN · §2.8 standing intents (**v55, FOUNDER, FIXED**) | **KEEP** — no second scheduler, no cron in an agent file. Improved, not reversed, by the share cap above and the card collapse in §22 |
| **Mission owner** | who answers for it | IN · §2.2 `owner:` | **KEEP** — founder or a standing intent |
| **Mission expiry date** | nothing durable without a date | IN · §2.2 `expires:` | **KEEP** — mandatory; see *Abandonment* for what expiry must then force |
| **Mission dependency graph** | what waits on what | RENAMED · §4, a readiness boolean | **IMPROVE** — a boolean cannot name what it waits on, so nothing can wake it. One `blocked_on:` id, not a graph. **Cost:** one field. **Row: new, shared with §22 *Ticket dependency field*** |
| **Sunk-cost check** | stopping without counting what was spent | IN · §16 | **KEEP** — the stop rule excludes sunk cost explicitly |
| **Success probability estimate** | predicting whether work will pay | REFUSED · §4 | **REFUSE-STANDS** — the estimator is the interested party; measured medians replace predicted value |
| **Goal conflict resolver** | two goals want the same window | IN · §4.5 the Desk's ranking | **IMPROVE** — the ranking has no term for **the cost of delay**, though obligations already carry `consequence:` and the founder already writes it in that voice. One optional line on the intent, read as a tie-break band. **Cost:** one field, written once per intent. **Settles:** replay desk logs with and without it. **Row: §4.5** |

---

## §21 · Agent cognition — how it thinks

| Keyword | Reading | v2 | Verdict · proposal · mechanism · cost · settles · row |
|---|---|---|---|
| **Task intake parsing** | turning a sentence into a dispatchable thing | IN · §3, the brief's eleven fixed fields | **KEEP** — fixed fields, never prose |
| **Intent extraction** | what the founder actually meant | IN · §2.5 read-back (v29) | **KEEP** — text, confirmed, nothing binds by voice |
| **Goal restatement** | saying it back before acting | IN · §2.5 | **KEEP** — unsupported and uncontradicted (FACT: cognition.md 10, 2026-09-05); aviation and medicine hold it |
| **Ambiguity flagging** | naming what is unclear before spending | IN · §2, the store check on falsifiability | **KEEP** — refusal at the store, not a habit |
| **Clarifying question trigger** | asking mid-run | RENAMED · §3.3 — `dontAsk` denies `AskUserQuestion` (v9) | **IMPROVE.** *"Build both options"* has no cost bound and the plan says only *"if cheap"*. At ten ventures a night of two-option builds doubles the bill. **Proposal:** building both is bounded by a share of the intent's ceiling; over it, one option is built and the other is written as a costed description in the *which*. **Mechanism:** `settings.yml` share; `bin/run` refuses the second build over the line. **Cost:** one field. **Settles:** measure the share of night spend that went to unchosen options. **Row: v9 bounded, not reversed** |
| **Assumption logging** | what the run took for granted | IN · §6.3 `uncertain:` | **IMPROVE.** `uncertain` is written by the run about itself and **nothing ever checks it**, so a confidently wrong run writes an empty field and pays nothing. **Proposal:** the curator computes a **calibration number per agent** — how often an empty `uncertain` preceded a defect found later. Measured, never self-reported, which is what §21 requires of trust. **Mechanism:** `bin/curate` (ABSENT) over the logbook join. **Cost:** one query. **Settles:** it is itself the measurement. **Row: new; feeds §5's trust score** |
| **Research-before-plan rule** | find out before deciding | IN · §7, `scout` first in `bin/skill` | **KEEP** — a routing rule, not a mandated step |
| **Knowledge-gap detection** | noticing you do not know | IN · §7 | **KEEP** — *no skill for this field* starts a bounded pass |
| **Skill lookup step** | finding the right knowledge cheaply | IN · §7, progressive disclosure (v3) | **KEEP** — the standard's own mechanism, not ours |
| **Local skill matching** | which of many applies here | IN · §7, two-tier routers | **KEEP** — measured 15,000 → ~1,070 tokens in this repo |
| **Relevant-skill ranking** | ordering the matches | RENAMED · §E.2 triggering accuracy | **KEEP** — tuned by description against baseline |
| **Plan draft** | a mandated planning step | REFUSED · §6 | **REFUSE-STANDS** — but sharpen the reason: `plan` is a shipped **permission mode the human selects** and the plan already uses it as a band (FACT: cognition.md 1, 2026-09-05), while Plan-and-Solve measures planning as *helpful* (FACT: cognition.md 7). v2 refuses **mandating method**, not planning. Say that, or a reader will think the plan believes planning is harmful |
| **Plan critique pass** | the run critiquing itself | RENAMED · §11, `challenger` is an agent (v30) | **IMPROVE.** v30 is right and **wave one has no `challenger`** (v54, FIXED), so from day one a run's only external signal arrives at handover. **Proposal:** the cheapest external critique is the anchor, run **early and repeatedly** — which is exactly what *Done-test criteria* above makes possible by putting the anchor command in the `/goal` condition. External feedback is why Reflexion's number holds (FACT: cognition.md 6). **Cost:** none beyond the launcher line. **Row: v12/v45, shared** |
| **Plan revision loop** | iterating the plan, not the work | REFUSED · §6 | **REFUSE-STANDS** — the done-test judges the result, not the route |
| **Step sequencing** | ordering the work inside a run | REFUSED · §6 | **REFUSE-STANDS** — no stage states method; this rule is what keeps a pipeline out |
| **Dependency ordering** | what must precede what | REFUSED inside a run · §6 | **REFUSE-STANDS inside a run · ADD between runs** — ordering across work items is not method, it is scheduling, and it is the `blocked_on:` field. **Row: shared with §01** |
| **Risk pre-check** | is this action dangerous | IN · §12, the door at the tool boundary | **KEEP** — a boundary, not a self-assessment |
| **Resource estimate** | how much will this cost | REFUSED · §4 | **REFUSE-STANDS** — measured medians beat estimates by the interested party |
| **Time estimate** | how long will this take | REFUSED · §4 | **REFUSE-STANDS** — *this needs that*, never *this takes that long* |
| **Confidence self-rating** | the model scoring its own certainty | REFUSED · §11 | **REFUSE-STANDS** — replaced by the anchor rung. The admissible version is **measured** calibration, above, and it is not a self-rating |
| **Multiple-approach generation** | two real options, not two descriptions | IN · §3, both built | **KEEP** — the only channel a silent run has (v9) |
| **Approach comparison** | choosing between them | IN · §3 | **KEEP** — the founder compares built things |
| **Approach selection rationale** | why this one | IN · §3, cost of each plus a recommendation | **KEEP** — a which carries costs, not adjectives |
| **Sub-task decomposition** | intent → dispatchable work | IN · §4 — *"the Desk decomposes"* | **RETHINK.** The Desk is a **no-model program**; it cannot decompose anything. Nothing in v2 names what produces the first candidate work item under a newly bound intent, so the store the Desk ranks starts empty and never fills except from `next:` proposals by runs that have not happened yet. **Proposal:** decomposition is `product`'s job when the intent is fuzzy and the **Operator's at bind** otherwise; the Watch materialises the rows (v44 pattern). **Mechanism:** `bin/check-stores` refuses a live intent with zero work rows and no pending `product` run. **Cost:** one check, one routing line. **Settles:** bind an intent by hand and see what the Desk finds to rank. **Row: new — the same row as §01 *Goal tree*** |
| **Ticket generation** | work items a human can see | IN · §14 page 4 | **IMPROVE** — a card should be a **view of a work row**, not a second object with its own truth. One store, two renderings. **Row: new, shared with §22** |
| **Ticket acceptance criteria** | what makes it done | IN · §2.2 the done-test | **KEEP** — written before the work, checkable by a stranger |
| **Definition of done** | the same, named again | IN · §2.2 | **KEEP** — one field does both jobs |
| **Persistence policy** | how long the system keeps going | IN · §4, the Watch is the loop | **IMPROVE.** The founder's word is *relentlessly*; the retry ladder is one retry. Both are right and v2 never says where relentlessness lives: **at the intent, in a fresh run tomorrow, never inside a rotten context.** Say it, and give it a bound — see *Relentless-retry* |
| **Relentless-retry condition** | trying again tomorrow | IN · §6, `/goal` survives transient failures | **ADD.** Nothing counts re-attempts across runs, so a work item can be re-dispatched nightly forever at full cost while `negatives:` grows and nothing escalates. **Proposal:** `attempts:` on the work row; at attempt N the Desk stops dispatching and stages a **which** — *keep trying · abandon to negatives · change the done-test*. This is the founder's *relentlessly* with a bound instead of a loop. **Mechanism:** the work store; `bin/watch` reads the counter. **Cost:** one integer. **Settles:** count nightly re-dispatches of one work item today — nothing prevents it. **Row: new** |
| **Give-up condition** | when to stop for good | IN · §6, *Impossible* and the turn clause | **IMPROVE** — *Impossible* must not retire an intent (see §01 *Wrong-goal detection*); the give-up decision belongs to the attempt counter and the founder |
| **Self-check before submit** | testing your own work first | IN · §11, v8 | **KEEP** — self-check, and it is never the anchor |
| **Explain-your-reasoning step** | why it did what it did | IN · §14, the trace captured not performed | **KEEP** — captured beats performed |
| **Chain-of-thought log** | the full decision chain | IN · §14, `--output-format stream-json --verbose` | **IMPROVE** — this is the one artifact that grows without bound. See *scale*: a retention rule is needed before a year of logs, not after |
| **Reflection-after-action** | learning from what happened | IN · §13, the curator (v25) | **KEEP** — the actor is the most biased author |
| **Lesson extraction** | what specifically to learn | IN · §13.6, five fixed questions | **KEEP** — zero of 121 free reflections named the cause |
| **Next-action proposal** | what should happen next | IN · §6.3 `next:` | **KEEP** — a proposal the Desk may ignore |

---

## §22 · Task & ticket breakdown

| Keyword | Reading | v2 | Verdict · proposal · mechanism · cost · settles · row |
|---|---|---|---|
| **Ticket template** | the fields a card must carry | IN · §14.7, Linear + Copilot fields, `solo\|team` (v60) | **IMPROVE** — the template should be the **work row's schema**, rendered; today the card's fields are described in §14.7 prose and exist in no schema file, which is how §6.2's field count was ten in one section and eleven in another. **Mechanism:** `keel/shared/schemas/work.yml`, the same fix v45 applied to the brief. **Cost:** one file. **Row: new** |
| **Ticket priority field** | ordering, visible | RENAMED · §4, the Desk's ranking | **IMPROVE** — show **the gate that stopped this card last tick**. The data is already written to `logbook/desk/<tick>.json` and read by nobody, and it turns *"why did you not do that"* into a tap. **Cost:** a read. **Row: §4.5, §14.7** |
| **Ticket owner field** | who is accountable | IN · §14.7, Linear's `delegate` not assignee | **KEEP** — humans keep ownership while agents act (FACT: cognition.md, Linear, 2026-09-05) |
| **Ticket dependency field** | what it waits on | RENAMED · §4, readiness boolean | **ADD** — `blocked_on:` id. No shipped system reached has a dependency field an agent consumes (FACT: cognition.md, 2026-09-05), so this is ours either way. **Row: shared with §01** |
| **Ticket status field** | where it is on the board | IN · §14.7, stages; the drag launches (v60) | **KEEP** — state moves on the anchor, never on a report |
| **Ticket size estimate** | how big | RENAMED · §6, the ceiling and measured medians | **KEEP** — a ceiling is a control; an estimate is a guess |
| **Epic-to-ticket mapping** | two levels, not five | RENAMED · §4 | **IMPROVE** — the middle level needs the id it does not have. **Row: shared** |
| **Backlog grooming** | keeping the list honest | REFUSED · §4 | **REFUSE-STANDS as ceremony · ADD as a mechanism** — v55's standing intents will mint work forever, so the honest list needs the **attempt counter and forced disposition at expiry** rather than a meeting. Both are proposed above |
| **Sprint-equivalent cycle** | a rhythm imposed on the work | REFUSED · §2, tempo | **REFUSE-STANDS** — there is no demo to hold and no team to sync |
| **Ticket acceptance test** | the check that closes it | IN · §2.2 the done-test | **KEEP** — one artifact does acceptance, readiness and the goal condition |
| **Ticket blocked reason** | why it is stuck | IN · §6, `outcome: blocked` | **IMPROVE** — an enum plus `blocked_on:`, so a clearing blocker is an event and not a re-read of prose. No shipped system has this either (FACT: cognition.md, 2026-09-05) |
| **Ticket reassignment rule** | moving work between agents | RENAMED · §14.7 | **KEEP** — a card moves stage or shape; nothing is assigned to a standing worker |
| **Ticket audit trail** | what happened to it | IN · §14, the event log joined by ids | **KEEP** — the log is the trail; the board is a view |
| **Cross-ticket linking** | this relates to that | IN · §14, intent ids | **IMPROVE** — intent ids alone cannot link two work items under one intent; work ids can. **Row: shared** |
| **Duplicate-ticket detection** | we already did this | IN · §13, already-built registry + negatives | **IMPROVE** — with a work store and the failure hash of §01 *Retry ladder*, duplicate detection is a join rather than a judgement. **Cost:** none new |
| **Ticket aging alert** | it has sat too long | IN · §4, decay + expiry | **IMPROVE** — split decay into its two facts (closeness to expiry · time since it moved). They point to **opposite dispositions** — one raises priority, the other triggers the attempt counter — and collapsing them into one 0–1 number loses which. **Row: §4.5** |
| **Definition-of-ready check** | is it allowed to start | REFUSED · §4 | **REFUSE-STANDS** — readiness is the done-test plus the readiness boolean, and nothing shipped anywhere has a ready gate either (FACT: cognition.md, 2026-09-05) |

**Verdict counts**, counted per row and summed per section, not from memory.

| Section | KEEP | IMPROVE | RETHINK | ADD | REFUSE-STANDS | Total |
|---|---|---|---|---|---|---|
| 01 Missions & drive | 13 | 9 | 4 | 1 | 3 | 30 |
| 21 Agent cognition | 20 | 7 | 1 | 2 | 6 | 36 |
| 22 Task & ticket | 6 | 7 | 0 | 1 | 3 | 17 |
| **All three** | **39** | **23** | **5** | **4** | **12** | **83** |

Two rows carry a split verdict and are counted once each: §21 *Dependency ordering* (REFUSE-STANDS inside a run,
counted as ADD for the scheduling half) and §22 *Backlog grooming* (counted as REFUSE-STANDS, with its mechanism
half already proposed elsewhere).

---

## Top 5 proposals of this lane

**1 · The work item — give the thing the Desk ranks a store, an id and one writer.** (NEW: reasoning, from the
plan's own store rule) Candidate work is scheduled, ranked, counted and re-attempted, and it is the only object in
the plan with no schema and no declared writer, which v44 forbids for every other store. Add
`keel/ventures/<v>/work/w-*.yml` carrying `intent`, `purpose`, `ceiling`, `blocked_on`, `attempts`,
`last_failure`, `card`; proposals land in `work-draft/` and the Watch materialises them after the store check —
the obligation pattern reused, not a new mechanism. It is better because nine keywords across three sections
currently resolve to *"the Desk handles it"* and the Desk is a no-model program ranking a list nobody writes; it
also makes a board card a **view** rather than a second source of truth. **Cost, once:** one schema, one directory,
one branch in `bin/watch`, one refusal in `bin/check-stores`. **How we would know it worked:** *"how many runs has
this intent cost"* and *"what is this card waiting on"* become one query each; today both need a join with no key.

**2 · The `/goal` condition is the anchor command, not the done-test's prose.** (FACT: cognition.md 1–2,
2026-09-05; NEW: reasoning) v12 makes the done-test the goal condition and a small model judges it after every turn
— the most frequently executed judgement in the whole system, and it is rung 4. v45 already added `anchor:` to the
brief and `bin/run` already refuses a brief without one. Compose the condition from both: *"`<anchor>` exits 0, and
`<done-test>`"*. It is better because it converts the loop's own feedback from a model's reading of prose into an
exit code, which is precisely the external feedback that makes Reflexion's result hold and whose absence makes
self-correction harmful (FACT: cognition.md 5–6, 2026-09-05). It also gives wave one the mid-run critique it
otherwise lacks entirely, since v54 leaves `challenger` for wave two. **Cost:** one line in the launcher; the
4,000-character limit now bounds the pair. **How we would know:** on ten finished intents, every disagreement
between the evaluator's verdict and the anchor's exit code is a run that believed it was finished.

**3 · The attempt counter, and the which at attempt N.** (FOUNDER: *"walk with agent relentlessly until we get the
perfect trade"*; NEW: reasoning) Nothing in v2 counts re-attempts **across** runs. A work item can be re-dispatched
every night forever, at full cost, with `negatives:` growing and no escalation, because the retry ladder lives
inside one run and the Watch's gate 5 only asks whether work is unfinished. Put `attempts:` on the work row; at N
the Desk stops dispatching it and stages a which — *keep trying · abandon to negatives · change the done-test*.
This is the founder's word implemented with a bound instead of a loop, and it is the abandonment criterion §01 asks
for. **Cost:** one integer and one branch. **How we would know:** the count of nightly re-dispatches of a single
work item, which today has no ceiling of any kind.

**4 · Lexicographic dispatch order, replacing `Weight × Decay ÷ Cost`.** (NEW: reasoning) Dividing by measured cost
means cheap work outranks expensive work permanently, and v55's standing intents supply an endless stream of cheap
work, so the queue never drains and an expensive high-weight intent can starve at any weight the founder sets.
Replace the ratio with an order: obligations · work that unblocks other work · founder weight band · cheapest
inside the band. It is better because it is explainable on the board with no tuning, it cannot invert the founder's
weight, and it is *less* code than the formula it replaces. It is also honest about the crudeness §4.5 claims: a
sort is crude, a ratio over three approximate numbers is false precision wearing crude clothing. **Cost:** a
rewrite of one function. **How we would know:** replay `logbook/desk/<tick>.json` over a simulated month under both
orders and count dispatches of the top-weight intent.

**5 · Forced disposition at expiry, for intents as well as skills.** (NEW: reasoning) v19 forces Refresh ·
Deprecate · Waive on a skill because nothing in the world retires one by non-use, and 13a.6 extends horizons to
everything durable while admitting that **the pass which finds a passed horizon is a WISH**. An intent that expires
today stops and records nothing, so the negatives store never learns the direction was abandoned and the Watch's
door will admit the same proposal again. Point `scripts/ledger.mjs`'s disposition logic at the intent store and
build `bin/horizon` as the one pass over every durable store. **Cost:** one pass, reusing shipped code, and it
discharges a named WISH rather than adding a rule. **How we would know:** the count of intents that expired in a
month with no disposition row — expected to be all of them today.

---

## Top 3 research questions

1. **Does any shipped agent system carry a scheduling object between the goal and the run?** Bounded: read the data
   models of OpenAI Symphony (Apache-2.0, alive), Linear's agent session model, and GitHub Copilot's coding-agent
   task object, and record for each whether *goal → work item → run* is two objects or three, with the field list.
   Source class: vendor documentation and repository source, licence read from the file. It settles proposal 1's
   shape, and cognition.md's ticket table is explicitly incomplete here — Jira, Codex cloud, Cursor and Symphony
   were not fetched at the 25-call ceiling (FACT: cognition.md, 2026-09-05).
2. **What does `/goal`'s evaluator actually accept as a condition, and does an exit-code condition behave
   differently from a prose one?** Bounded: the vendor's goal documentation plus one measured pair of runs on the
   same task, one condition worded as prose and one naming a command's exit code, comparing verdict accuracy
   against the anchor. Source class: vendor doc plus a local measurement on this Mac. It settles proposal 2, which
   is otherwise a design argument.
3. **Is there measured evidence for a re-attempt ceiling in autonomous coding agents?** Bounded: does any published
   system bound retries *across sessions* rather than within one, and at what number — Copilot's 59-minute cap and
   `--max-turns` are within-session and are already sourced. Source class: vendor documentation and any measured
   paper on repeated-attempt yield. It settles the N in proposal 3, which is otherwise the founder's taste.

---

## What the best system in the world would have here that v2 lacks

**A replayable Desk.** (NEW: reasoning) The Desk already writes its ranking and the gate that stopped each
candidate to `logbook/desk/<tick>.json`, and nothing ever reads it. A no-model replayer that re-runs a month of
recorded ticks under a changed order is the only way to tune scheduling without living a month, and it is
deterministic, free, and exactly the kind of program §B.1 rule 4 says stays a program. Every ranking proposal in
this lane is settled by it. (NEW: this is the cheapest instrument named anywhere in the lane.)

**A cost of delay, in the founder's own voice.** (NEW: reasoning) Obligations carry `consequence:` — *"the domain
lapses; weeks to recover"* — and intents carry nothing like it, so the Desk knows how much the founder wants
something and never what it costs to wait. One optional line, written once, read as a tie-break band.

**An intent-level post-mortem.** (NEW: reasoning) v2 post-mortems **runs** — five fixed questions over failed
handovers — and never post-mortems an **intent**. An intent that took nine runs and succeeded teaches more than any
one of those runs, and nothing in the design reads across the runs of one goal, because there is no key that joins
them. Proposal 1 supplies the key; the curator's five questions then work at both levels for no new mechanism.

**Where it breaks, by scale.** (NEW: reasoning throughout.) **At ten ventures:** the interruption budget is *three
a day* and is **global**, and no section says whether it is global or per venture. Ten ventures share three
interruptions, so a venture can go a month without reaching the founder while the acted-on rate looks healthy. Keep
it global — the founder's attention is one pool, which is the same argument as the window's reserve — but allocate
by venture weight and report which venture was starved in the briefing. **At fifty concurrent sessions:** the WIP
limit, the 20-subagent cap and the two-driven-venture rule bound the *runs*, and **nothing bounds the whiches**. A
night that stages forty two-option decisions is an unusable morning and, worse, it doubles the build cost of forty
work items. Cap staged whiches per window; over the cap the Desk stops dispatching work that would produce one.
**At a year of logs:** the chain-of-thought log (`--output-format stream-json --verbose`) is the only artifact here
that grows without bound and the only one with no retention rule, and the transcript-mining pass is already a batch
over a snapshot because the format is vendor-internal (v26). Give the stream a retention horizon like every other
durable thing, or it becomes the store nobody can afford to read. **With a second human:** v65 says founder only,
and my lane's version of that question is narrow — **who may bind an intent** — and the answer must stay one
person, because the read-back is what binds and two binders make provenance unanswerable. **With the founder away
for a month:** every intent expires, nothing renews them, and the system correctly goes quiet — but only if
proposal 5 exists to record why; without it, the month reads as a fault.

---

## What I would delete

- **The rank formula `Weight × Decay ÷ Cost`.** Three crude numbers combined into a fourth with no dimensional
  meaning, defended in §4.5 as avoiding false precision while being the false precision. Replaced by an order, not
  by a better formula. (Proposal 4.)
- **`Decay` as a single 0–1 number.** It fuses closeness to expiry with time since it moved, and those point at
  opposite dispositions. Keep both facts, delete the number that hides which one fired.
- **The Intent's *own urgency* as a second priority scale.** §4.5 multiplies the venture's `weight` by it. The
  founder already sets weight per venture and expiry per intent; a second scale gives one person two dials for one
  decision, and the second is derivable from the first plus the date.
- **The sentence *"the Desk decomposes"* (COVERAGE §21, Sub-task decomposition).** It assigns a model's job to a
  no-model program. Delete the claim; name `product` and the Operator at bind, which is where it actually belongs.
- **The phrase *"the Operator is the escalation"* in 13a.1** for night runs, which §4.4 contradicts in the same
  plan. One of the two is wrong, and the Watch is the one that is running.
