# L8 · scale — what breaks first, and the smallest change that prevents it

*The rethink round, 2026-09-06. Cross-cutting lane: no sections of its own, keyed by scale scenario.*
*Inputs read: parts/00-what-it-is · SPINE §A v1–v65, §B–§K · DECISIONS §15, §17 · rethink/FOUNDER-LIST.md ·
COVERAGE §05, §06, §07, §09, §11, §12, §13, §14, §15, §16, §31, §32 · parts/02, 04, 12, 13, 14, 15, 16, 17, 19, 21.*
*Rows v1–v5 and v54–v65 are the founder's and are not reversed here. Nothing below is built.*

---

## The one sentence this lane found

**Every bound in v2 is a bound on ambition, and none is a bound on what accumulates.** The driven-venture cap, the
WIP limit, the reserve, the interruption budget and the per-run ceiling all limit what the system *starts*.
Obligations, standing intents, whiches, staged artifacts, log rows and expiries all *arrive* — and at ten ventures, a
year of logs, or a month away, the arriving side is the one that breaks. **(NEW: reasoning)** The failures below are
almost all queue-growth failures wearing six different costumes.

---

## A · Ten ventures

**Where the cap actually sits (FACT: FINAL row 14, carried in SPINE §D.2 and §14.12):** at most **two driven**
ventures, plus a WIP limit per venture, plus the vendor's 20 concurrent subagents. **(NEW: reasoning)** All three
bound goal work. None bounds what ten ventures *owe*.

| Failure at scale | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **The obligation tide** — owed work scales linearly with venture count, goal work is capped at two | Obligations come from the world; the world does not read the driven cap | §4.1 gate 1: obligations before any goal. §14 (COVERAGE: Cross-mission scheduling `IN`, §4) | **RETHINK** | Obligations are gated *ahead of* goal work but never ranked *against each other*, so at ten ventures the tick can be spent before any goal is reached. Rank inside the obligation set by consequence and by the world's own deadline. **Mechanism:** `bin/watch`'s Desk comparator; the obligation already carries *"to whom, by when, with what consequence"* (§0.7). **Cost once:** one comparator, no new field. **Settles:** replay the Desk against ten synthetic charters; count ticks in which zero goal work dispatches. **Row:** new, obeys FINAL row 14 |
| **A standing intent has no Decay** | v55 intents never expire; the Desk ranks `Weight × Decay ÷ Cost` and Decay is *"closeness to expiry, and time since it last moved"* (§4.5) | §2.8 + §4.5 | **RETHINK** — a defect, not a preference | Decay is undefined on the majority of a ten-venture queue. Define it for a never-expiring intent as time-since-last-move alone, normalised against its own cadence so a daily and a monthly intent compare. **Mechanism:** the comparator; `bin/check-stores` refuses `every:` with no cadence unit. **Cost once:** one branch. **Settles:** 50 standing intents against 4 goal intents — are the goal intents ever dispatched. **Row:** moves **v55** |
| **The staged-output tide** — five standing kinds × ten ventures, all staging, nobody reading | Standing outputs *"stage; they never send"* (v55), which bounds risk and not volume | §2.8 | **ADD** | Reuse the mechanism the plan already has for interruptions — *"a channel whose acted-on rate falls is demoted below its threshold"* (§0.5) — applied to standing intents instead of channels. **Mechanism:** an acted-on counter on the standing intent's row, read by the Desk's Weight term. **Cost once:** reuse, no new concept. **Settles:** measure the read rate of staged standing output. **Row:** moves **v55** |
| **The curator is one process for ten ventures' stores** | v25's rule is *one writer*; at ten ventures it is being read as *one process* | §13.1, §17.4 | **IMPROVE** (narrows v25, reverses nothing) | "One writer" is a property of a store, not of a process. `bin/curate` takes a venture argument; serialised per store, concurrent across ventures; the grant assertion is unchanged. **Mechanism:** an argument and a loop; `bin/probe` still asserts the curator's is the only writable scope over memory. **Cost once:** one argument. **Settles:** nightly wall-clock at ten ventures against one. **Row:** narrows **v25** |
| **Ten `open.md` queues, one founder** | `open.md` is per venture, written by the Watch alone (§17.4); the founder answers from one place | §17.4, §13.2 | **RETHINK / delete** | One house-level open queue with a venture field. Ten stores become one; ten writer-contention points become one; the founder's queue is where the founder is. **Mechanism:** the store table. **Cost once:** one store definition changed before anything writes it. **Settles:** taps to clear ten queues against one. **Row:** moves §17.4 |
| **Portfolio health has no ordering** | COVERAGE §31 rightly refuses a composite — *"a composite hides which broke"* | §14 pages 1 and 3 | **IMPROVE** | Keep the refusal, add an ordering: ventures sorted by their single **worst** raw number, with that number named on the row. An ordering is not a composite. **Mechanism:** a sort key over the three fields both pages already read. **Cost once:** a sort key. **Settles:** can the founder name the venture in trouble in one look at ten areas. **Row:** new, obeys **v14** |
| **Cross-venture read isolation is asserted, not probed** | COVERAGE §15 places it at §12 with the mechanism *"not handing the credential to the run"* — which is a **credential** boundary, not a **read** boundary | §12, v34 | **IMPROVE** | At ten ventures the only thing keeping venture A's memory out of venture B's context is a per-run `--add-dir`, and v34's probe already asserts *what a run can touch*. Add the negative per venture pair. **Mechanism:** generated probe cases in `bin/probe`. **Cost once:** one generated case class. **Settles:** run it. **Row:** extends **v34** |
| **The room at ten areas** | v62 admits pixel-agents with its `AgentEvent` schema marked **UNVERIFIED** | §14.4, v62 | **ADD** (a bounded question, not a claim) | Read the schema and any documented limit before the writer is built. **Mechanism:** a sourcer lane. **Cost once:** one fetch. **Settles:** research question 3 below. **Row:** obeys **v62** |

---

## B · Fifty concurrent sessions

**(NEW: reasoning)** Fifty concurrent sessions is a property of **the Mac**, not of the seat. The seat's ceiling is
the reserve; the machine's ceiling is unstated anywhere in v2. Those are two different limits with two different
failure shapes, and the plan currently names only the first.

| Failure at scale | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Nothing caps concurrent `-p` children** | §14.12 names exactly three bounds — 20 concurrent subagents (vendor), the WIP limit, at most two driven ventures. **None is a session count** | §14.12, §D.2 | **ADD** | A `sessions` ceiling in `settings.yml`; `bin/run` refuses to mint a session id past N live rows in `sessions.jsonl`. The board already *"refuses a drag that would breach"* a bound — this gives it a fourth bound to refuse on. **Mechanism:** one read and one refusal in `bin/run`. **Cost once:** one refusal. **Settles:** research question 2. **Row:** new, obeys **v13**, **v34** |
| **Fifty processes appending to one JSONL** | §15.3 pins `F_FULLFSYNC` for **durability** and is silent on **interleaving**; `bin/log` and `bin/run` are single writers by design, invoked concurrently by fifty callers | §15.3, §17.4 | **ADD** — and it is the row that matters most here, because the log is the truth | One appender process, or `O_APPEND` with a bounded line length plus an advisory lock; a row that would exceed the bound is written as a hash pointer, which the design already has (§15.3 blobs by sha256). **Mechanism:** one write path in `bin/log`. **Cost once:** one write path. **Settles:** fifty concurrent appends, count malformed lines — a measurement, not research. **Row:** new, obeys FINAL §16.4 |
| **The reserve is a percentage of an unmeasured quantity** | FOUNDER, DECISIONS §15: *"Keep 30% and 3/day; evidence moves them."* §G.2: **no numeric subscription quota is published anywhere fetched** | §4.4, §G.2, §21.1 | **IMPROVE** — explicitly inside the founder's own "evidence moves them" | Express the reserve additionally in **measured founder-minutes-to-first-token**, so the 30% has a unit the founder feels while dispatch is heavy. **Mechanism:** one derived number per window from the log; §21.1 already measures *time from spoken intent to first artifact*. **Cost once:** one query. **Settles:** ten Floor sessions taken during heavy dispatch. **Row:** new |
| **Fifty independent stall fuses and no aggregate** | v23: `--max-budget-usd` counts subagent spend and fails a spawn at the cap; it *"does not bind the account"* | §16.5, v23 | **REFUSE-STANDS** | Making it aggregate is impossible — it is print-mode arithmetic at list price. Five words: *a false spend control is worse*. Say once, in §16, which control is the aggregate: **the reserve**, and it is the only one. **Cost:** a sentence. **Row:** **v23** stands |
| **Page 2's substrate rewrites under it** | §17.4.1: `config.json` is *"overwritten on the next state update"* and read-only to us | §14.5, §17.4.1 | **IMPROVE** | Page 2 takes `sessions.jsonl` — ours, append-only, one writer — as its spine and reads the vendor's config **only** for pane ids. At fifty sessions a page polling fifty rewriting files is a page that shows a different fleet every render. **Mechanism:** one join. **Cost once:** one join. **Settles:** render page 2 against fifty synthetic rows. **Row:** new, obeys §D |
| **`bin/supervise` restarts into a full table** | §19.1 gives it *"restart ceiling · heartbeat · process-group kill"* — three controls, none of them admission | §19.1 | **ADD** | Supervise refuses to restart into a session table already at the ceiling, so a crash loop cannot become the concurrency event. **Mechanism:** one check against the same ceiling as row 1. **Cost once:** one check. **Settles:** kill sessions at the ceiling and watch what restarts. **Row:** new |
| **Session concurrency and window concurrency are conflated** | Two limits, two failure shapes: the machine thrashes, the seat stops | §16, §4.2 | **ADD** (a paragraph, not a mechanism) | Say once that the machine bounds sessions and the reserve bounds the window, and that a seat limit is a **stop** while a full session table is **backpressure** — the same distinction §16.2 already draws between a seat limit and a family limit. **Cost:** a paragraph. **Row:** new |

---

## C · A second human

**v65 is the founder's and is FIXED: the founder only, for now.** Every row below improves inside it. **(NEW:
reasoning)** The purpose paragraph itself, verbatim, says *"I, as a founder **or any other person**"* — so a second
human is named in §0.1 and refused in v65 at the same time. That is coherent: the person is in scope, the second
*operator* is not. What the plan lacks is the **seam**, and every item here is a field that costs one line now and a
backfill later.

| Failure at scale | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **No row records who acted** | `people.yml` names humans for the Sender's consent check; **no event row and no read-back confirmation carries an actor** | §17.4, §C.3 | **ADD** — the cheapest item in this whole lane | An `actor:` field on every event row and on the read-back confirmation row, with **exactly one legal value today**. **Mechanism:** `bin/log`; `bin/check-stores` refuses a confirmation with no actor. **Cost once:** one field, written before the first row exists. **Settles:** nothing to settle — §I row 11's own words are *"cheap now, impossible in the moment it is needed"*, and this is that item. **Row:** new, **inside v65** |
| **The read-back binds by a tap with no author** | §C.3: *"the founder confirms by tap or typed word"* — the confirmation is what makes an intent live | §C.3, v29 | **ADD** | Same field, same cost. An intent whose binding act has no author cannot be audited by anyone who was not in the room. **Row:** new, inside **v65** |
| **Taste has no owner** | §13.2: TASTE and CRAFT are *"the founder's and cross every venture"* — scope by assumption, not by field | §13.2 | **ADD** | An owner on every taste item, one legal value today. A second human's taste silently merging into the founder's is the failure that cannot be unwound, because the store is delta-only and never rewritten (v24). **Cost once:** one field. **Row:** new, inside **v65** |
| **A statutory clock has one target and a budget that can suppress it** | v65 makes the founder the only wake-me target; the interruption budget is **three a day** (FOUNDER, DECISIONS §15) | §C.2, v65 | **ADD** | A `statutory` wake-me class **exempt from the interruption budget**, declared on the obligation rather than judged in the moment. The founder's own words admit it: *"Keep 30% and 3/day; **evidence moves them**."* **Mechanism:** one field on the obligation, one branch in the Watch. **Cost once:** one field. **Settles:** replay and count statutory obligations suppressed by the budget. **Row:** new, obeys **v65** |
| **Decision rights are per venture, not per person** | The envelope is per venture in the founder's words; §C.1 maps it to modes and axes | §12, §C.1 | **REFUSE-STANDS** | COVERAGE §14 refuses a multi-operator template, and it is right: rights for an operator who does not exist is machinery nobody uses. Five words: **the actor field is the seam.** **Row:** stands |
| **One keychain, one Mac** | §15.4: the credential plan is the disaster plan; hardware keys in pairs, one off-site; a k-of-n split | §15.4 | **REFUSE-STANDS** | The k-of-n split **is** the second-human mechanism already in the plan, and it is there for recovery rather than for delegation. Naming that is enough. **Row:** stands |

---

## D · A year of logs

**(NEW: reasoning)** This is the scenario where a decision that is *correct today* is wrong later, and the plan says
so in its own voice: mission control *"reads files rather than a database"* (§15.3), justified by a WAL checkpoint
argument that is sound at **3,843 rows** (§17.4, this Mac) and unsound at a year.

| Failure at scale | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Page 3 joins the whole log per render** | Page 3 is *"the event log … joined to the price table"* with every number a tap; the surface reads files by deliberate choice | §D page 3, §14.6, §15.3 | **RETHINK** | Rotate into `logbook/events/YYYY-MM.jsonl` and write a **derived, rebuildable rollup** per period — per run, agent, venture, window. Page 3 reads rollups and drills into one period on a tap. **Nothing is deleted**; the rollup stands to the log exactly as memory already does (§13.2). **Mechanism:** rotation in `bin/log`; a rollup writer with no model; `bin/check-stores` refuses a rollup whose period hash does not match. **Cost once:** one rotation rule and one rebuild path. **Settles:** research question 1. **Row:** new |
| **The log's own schema is treated as stable** | v26 pins the **vendor's** transcript format as internal and mines over a snapshot; our own `gen_ai.*` rows carry no version | §13.7, v26, §17.4 | **ADD** | A `v:` on every row, and a reader that **refuses** an unknown version rather than guessing — the same posture v26 takes toward someone else's format, turned on our own. **Mechanism:** one field in `bin/log`; the reader's refusal. **Cost once:** one field, before the first row. **Settles:** nothing — it is insurance whose absence is discovered only at the migration, which is the argument for it. **Row:** new, mirrors **v26** |
| **`desk/<tick>.json` is one file per tick, forever** | It records the ranking and the gate that stopped each candidate — *"what makes 'why did you not do that' answerable"* (§4.5) | §17.4, §4.5 | **RETHINK / delete the file, keep the answer** | The highest-volume store in the design holds an answer whose value decays in hours. Write the same fields as **rows in the event log** instead of a file per tick. The question stays answerable and the file count stops growing. **Mechanism:** one writer changed, before it exists. **Cost once:** none — it is cheaper than what is planned. **Settles:** replay *"why did you not do that"* from the log alone. **Row:** moves §17.4 |
| **The index is *"rebuilt in one pass"*** | `.index/` is deletable and rebuildable (§15.3, §17.8) — and it is on the **recovery** path | §15.3, §17.8 | **IMPROVE** | Partition the index by the same period as the log, so a rebuild is incremental and a corrupt period costs a period rather than a year. **Mechanism:** a partition key. **Cost once:** a key. **Settles:** rebuild wall-clock at a year against a month. **Row:** new |
| **The restore drill produces a number nobody sees** | §15.4: *"the drill produces a number"* — and no surface carries it | §15.4, §16.8 | **IMPROVE** | Put the drill's number beside the two non-numeric briefing lines §16.8 already has (the reconciliation line, the week's most expensive refusal). A year of logs is exactly when replay time stops being theoretical. **Cost once:** one line. **Row:** new, obeys §16.8 |
| **Replay time is already designed for** | §15.3 snapshots memory *"because event sourcing's own failure mode is replay time, and the rebuild-from-scratch path is exercised rather than trusted"* | §15.3 | **KEEP** | Five words: **exercised, not trusted; correctly sourced.** |
| **Bodies expire, rows do not** | COVERAGE §16: *"a separate retention for prompt and response bodies"*; §15.3 makes old traces machine-only and rebuildable | §15, §13 | **KEEP** | Five words: **the asymmetry is the right one.** Page 3 depends on rows, not bodies |
| **A hash with no blob is a known absence** | §15.3, and the blob bucket is the design's only off-machine dependency | §15.3 | **KEEP** | Five words: **known absence beats silent absence.** |

---

## E · A second Mac

**(NEW: reasoning)** This is the least likely scenario in the lane and carries the **highest severity**, because it
is the only one whose failure ends in an outward act. COVERAGE §11 refuses multi-host failover with the reason
*"one founder, one Mac"* — and §15.4 puts a second Mac in the design twice a year, by name, for the restore drill.

| Failure at scale | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Two Watches, one remote, double dispatch — then two Senders** | §15.3 draws recovery as *"clone on a new machine → the Watch restarts"*. **Nothing refuses a second clone that is not a recovery**, and git does not lock | COVERAGE §11 (`REFUSED`), §15.3 | **RETHINK** — the highest-severity row in this lane | A **lease**. `logbook/watch.lease` holds a host id and a heartbeat; `bin/watch` refuses to tick without it and **`bin/send` refuses to act unless this host holds it**. **Mechanism:** one file, two refusals. **Cost once:** one file and two guards. **Settles:** run two clones, check the second refuses — a measurement, not research. **Row:** new; it narrows COVERAGE §11's *reason* while keeping its refusal |
| **The drill machine is already a second Mac** | §15.4: *"Twice a year, on a machine that is not this one, the company is rebuilt from the log and the escrow"* | §15.4 | **ADD** (no extra cost) | The restore drill runs with the lease **absent by construction**, so a drilled clone can never tick and never send. Without this, the safest routine in the plan is also the most dangerous one. **Cost once:** none beyond the row above. **Row:** same |
| **Idempotency keys are named once, in the wrong place** | COVERAGE §06 places them on the dead-letter/resume path: *"idempotency keys for external effects"* | §6, COVERAGE §06 | **IMPROVE** | Make the idempotency key a **required field of the Sender's staged artifact**, not a resume detail — so a duplicate outward act is refused by the world's own endpoint even if the lease fails. Defence in depth on the one boundary that cannot be undone. **Mechanism:** one field on the staged artifact and one line in the Sender's checklist, which v18 already admits as the one legitimate step list. **Cost once:** one field. **Settles:** stage one act, send twice, check the second is refused. **Row:** new, obeys **v33** |
| **"One founder, one Mac" is the wrong reason for a right refusal** | The refusal of failover is correct; the reason is falsified by the plan's own drill | COVERAGE §11 | **IMPROVE** | Keep the refusal, replace the reason with the lease. A refusal resting on a false premise is the kind that gets reversed by whoever notices the premise. **Cost:** a sentence. **Row:** COVERAGE §11 |
| **A lease over a git remote is advisory** | It stops the accident and not a determined operator | §15.3 | **ADD** (honesty, not mechanism) | Say so, in the same voice CLAUDE.md uses about the sandbox — *a guardrail against accident, not containment*. **Cost:** a sentence. **Row:** new |
| **Multi-host failover itself** | One founder cannot operate two companies in parallel | COVERAGE §11 | **REFUSE-STANDS** | Five words: **recovery is a clone, correctly.** |

---

## F · The founder away for a month

| Failure at scale | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **The cord may be unreachable from a phone that is not on the founder's network** | COVERAGE §09 asserts *"Remote kill access … the same cord from the phone"*. **v39** says the phone reaches two things: published artifact pages, which *"cannot pop a terminal"*, and the local server **over the founder's own network**. **§14.13's enforcement clause says every page writes *"nothing but the inbox file and the intent log"*** — and the cord is neither | §12.9, §14.13, v39, COVERAGE §09 | **RETHINK** — two documents in the plan disagree, and the disagreement only bites in this scenario | The cord is the one control whose absence at a distance is unacceptable, and it is also the one a hosted page can legitimately perform: **it writes a file, needs no terminal, and reads nothing.** Admit exactly one write from the published surface into the house — the cord — through the door v53 already provides for a surface. **Mechanism:** one named write path; `bin/watch` reads the file first every tick as it already does. **Cost once:** one write path and the door review that admits it. **Settles:** with the Mac's terminal unreachable, can the founder stop the company from a phone. **Row:** narrows **v39**; new row |
| **The which queue is unbounded, and every which cost twice** | v9: a fully autonomous run **cannot ask**, so everything becomes a which *with both options built* (§C.2, §12.6). A which already carries *"what happens if the founder says nothing"* — a **per-which** default | §C.2, §12.6, v9 | **IMPROVE** — without reversing v9 and without reintroducing an approve verb | The per-which default exists; **nothing bounds the number of whiches and nothing executes that default at a date.** Give a which its intent's expiry; at expiry the stated default executes or the intent parks, and both built artifacts are archived, never deleted. Where the founder's last event is old, the Desk builds **one** option and states the assumption. **Mechanism:** `bin/check-stores` refuses a which with no expiry; the Desk reads the last-founder-event predicate. **Cost once:** one field and one predicate. **Settles:** replay a month with no founder tap; count second options built and never chosen. **Row:** extends **v9** |
| **The reserve expires unused for a month** | 30% of every window held for someone who is not there. §21.1 already measures *reserve hit rate*, direction *"neither extreme"* | §4.4, §21.1, DECISIONS §15 | **IMPROVE** — inside the founder's *"evidence moves them"* | Release the reserve to autonomous work when the last founder event is older than the reserve's own horizon; snap it back on the first tap. **Mechanism:** the same last-founder-event predicate as the row above. **Cost once:** one predicate, shared three ways. **Settles:** the reserve hit rate the plan already measures. **Row:** new |
| **Everything expires at once, and stops silently** | Intents `expires:`, charters `horizon:`, skills `valid_until` with a forced disposition (v19), memory items, price rows, model-expiry rows (§G.4) | §2.1, §2.2, §7, §13, §G.4 | **KEEP the stopping · ADD the return** | Stopping is the safe direction and is the plan's best property. What is missing is the **return path**: a lapse record, one row per thing that expired unactioned, written by the Watch, ordered by what it stopped. **Mechanism:** one writer, reading the same expiries the store check already enforces. **Cost once:** one writer. **Settles:** return after a synthetic month; time how long it takes to know what stopped. **Row:** new |
| **There is no "since you were last here"** | The briefing is a morning page (§0.5); the Floor's return is *"one paragraph"* — for a session | §0.5, §14.8, v38 | **ADD** | A month is not a paragraph. Page 5's desk strip gains a since-your-last-tap mode **keyed on the last founder event row, never on a date** — which keeps the SPINE's no-schedule rule intact. **Mechanism:** one query, the same predicate again. **Cost once:** one query. **Settles:** does the return page order what changed by what it blocked. **Row:** new, obeys **v38** |
| **A statutory clock can be suppressed by the interruption budget** | Three a day, and v65 makes the founder the only target | §C.2, v65 | **ADD** | The `statutory` wake-me class of §C above, exempt from the budget, declared on the obligation. **Row:** new, obeys **v65** |
| **Standing intents run for a month with nobody reading them** | Same object as scenario A, different consequence: here the whole company is standing work | §2.8 | **ADD** | The acted-on demotion of A's third row is the cure in both scenarios. **Row:** moves **v55** |
| **Obligations still come first, and that is what should happen** | Gate 1 of the Watch; obligations outrank every goal | §4.1 | **KEEP** | Five words: **owed work outranks wanted work.** A month away is exactly the case this gate was written for |

---

## The top five proposals of this lane

**1 · One derived value — the last founder event — and four things stop being broken.** Today the Desk, the reserve,
the which queue and the briefing all reason about the founder's presence and none of them can compute it. Add one
predicate over the event log: the timestamp of the last founder-authored row. **What changes:** the reserve is
released to autonomous work while the founder is away and snaps back on the first tap; the Desk stops building two
options for a decision nobody is present to make; a which's stated default becomes something that executes at the
intent's expiry rather than a sentence in a queue; and page 5 gains a *since you were last here* view keyed on an
event rather than on a calendar, which keeps the SPINE's no-schedule discipline. **Why better:** the purpose
paragraph asks for a system that is *"self-moving, self-adjusting"*; adjusting to the absence of the founder is the
one adjustment the plan currently cannot make, and it is holding 30% of every window in reserve for a person who is
on a plane. **Cost:** one predicate and one field, shared by four call sites. **How we would know:** the reserve hit
rate §21.1 already measures moves off *expired-unused*, and the count of second options built and never chosen falls.

**2 · Rotate the log and derive a rollup per period.** Mission control reads files, deliberately, on a WAL-checkpoint
argument that is correct at 3,843 rows and wrong at a year. **What changes:** `logbook/events/YYYY-MM.jsonl` plus a
rebuildable rollup per period that page 3 reads, drilling into a period on a tap. Nothing is deleted, nothing is
summarised in place, and the rollup stands to the log exactly as memory already does — a derived view that can be
thrown away and recomputed. **Why better:** the first thing the founder's purpose paragraph names is *"a place you
open a project"*, and a surface that degrades to a full scan is not that place. **Cost:** one rotation rule, one
rollup writer with no model, one hash check. **How we would know:** page 3's render time against a synthetic year
stays flat as periods are added.

**3 · A lease on the Watch and the Sender.** Nothing in v2 prevents a second clone from ticking, and the plan itself
puts a second Mac in the design twice a year for the restore drill. **What changes:** one file holding a host id and
a heartbeat; the Watch refuses to tick without it, the Sender refuses to act without it, and the drill clone never
holds it by construction. **Why better:** it is the only failure in this lane that ends in a duplicated outward act
— two emails to one person, two payments against one invoice — and it is the only one that cannot be undone by
`git revert`. It costs one file now and is impossible to add credibly after the first incident. **Cost:** one file,
two refusals. **How we would know:** run two clones of the house; the second refuses to tick and refuses to send.

**4 · Resolve "one writer" into one *process*, and make the log safe at concurrency.** The plan's single-writer
discipline is its best structural idea and it has two readings — one writer per store, or one process for all stores
— which have identical behaviour at one venture and diverge at ten. **What changes:** `bin/curate` takes a venture
argument and runs per store; `bin/log` and `bin/run` get an append discipline that survives fifty concurrent callers
(one appender, or `O_APPEND` with a bounded line and an advisory lock, with over-long rows written as a hash
pointer the design already supports). **Why better:** the log is the truth, memory is a derived view of it, and
retraction works *because* of that (§13.2). A log with interleaved half-rows breaks every other claim in the plan at
once. **Cost:** one argument, one write path, both before the first row exists. **How we would know:** fifty
concurrent appends produce zero malformed lines; the nightly curator's wall-clock at ten ventures is not ten times
its wall-clock at one.

**5 · Give the portfolio a ranking it does not have — inside obligations, and over standing intents.** At ten
ventures the Desk's inputs stop being well-defined: obligations are gated ahead of goal work but never ordered
against each other, and `Decay` is computed from an expiry that a standing intent does not have. **What changes:** a
comparator inside the obligation set keyed on consequence and the world's own deadline, using a field the obligation
already carries; and `Decay` defined for a never-expiring intent as time-since-last-move normalised by its own
cadence. **Why better:** *"walk with agents relentlessly until the perfect result"* requires the machine to still be
reaching goals when ten ventures are each owing the world something. Today, at ten, it may never reach one. **Cost:**
one comparator and one branch, no new store. **How we would know:** replay the Desk against ten synthetic charters
and fifty standing intents; goal work is dispatched in a majority of ticks, and no standing intent starves.

**Runner-up, and the cheapest item in the lane:** an `actor:` field on every event and every read-back confirmation,
with one legal value today. The purpose paragraph says *"I, as a founder or any other person"*; v65 says the founder
only, for now; both are true, and the field is the seam between them. It costs one line before the first row exists
and a backfill of the entire log afterwards.

---

## The top three research questions

**1 · What does page 3 cost to render at a year of rows, and where is the knee?** *Bounded:* synthesise
`events.jsonl` at the emission rate this Mac already shows — 3,843 rows recorded in §17.4 — across 1, 3, 6 and 12
months, and measure the join to the price table on the actual mission-control server. *Source class:* **our own
measurement on this machine**, not a vendor fact; the plan has no comparable figure and none exists to fetch.
*Why it is worth running before building:* it decides whether rotation and rollups are a day-one shape or a later
migration, and a later migration touches the one store the design says is never edited.

**2 · Is there a concurrency ceiling on `claude -p` children, and what shape does the failure take at it?** *Bounded:*
the vendor documents 20 concurrent **subagents** with *"Concurrent subagent limit reached"* on overflow (§15, D
confidence) and documents **nothing** about concurrent `-p` children. Two questions only — does a documented ceiling
exist, and does the N+1th child fail loudly, queue, or degrade silently. *Source class:* **vendor documentation
first** (a `sourcer` lane, quote and access date), then **one measurement** on the Mac if the documentation is
silent. *Why:* §14.12's rule that *"the board refuses a drag that would breach"* a bound needs the bound to exist,
and today the plan's three bounds do not include a session count.

**3 · Does pixel-agents render ten venture areas and fifty live agents, and what is its ingest rate?** *Bounded:*
v62 admits it as page 1's substrate with the `AgentEvent` schema explicitly marked **UNVERIFIED — "schema not read
from source"**. Read the schema and any documented limit from the repository, then one local run against synthetic
events at ten areas. *Source class:* **the project's own source and issue tracker** (MIT, licence already read from
the file, 2026-09-05). *Why:* page 1 is the portfolio view for the multi-venture layer (§31), and it is the only
page whose substrate is a third party's renderer rather than our own.

---

## What the best system in the world would have here that v2 lacks

**(NEW: reasoning)** **Backpressure as a named concept.** v2 has fuses (stall, repetition, aberrance), gates
(reserve, WIP, driven cap) and ceilings (run, intent, venture), and every one of them acts on a **level**. None acts
on a **rate**. The best system watches drain rate against arrival rate on the four queues that grow — obligations,
whiches, staged artifacts, lapsed expiries — and treats a queue that is growing as a different event from a queue
that is deep, because the cures are different. **(NEW: reasoning)** Every scenario in this lane except the second Mac
is a rate problem that v2 can only see as a level.

**(FACT: SPINE §G.2, models.md fetched 2026-09-05)** No numeric Anthropic subscription quota is published anywhere
fetched, and a Max window's real capacity *"is measurable only from an account."* **(NEW: reasoning)** The best system
therefore measures its own seat and publishes the number **to itself**, because a reserve expressed as 30% of an
unknown is not a control at fifty sessions — it is a ratio between two things nobody has counted.

**(NEW: reasoning)** **A cost for the surface itself.** Seven pages poll, join and ingest, and not one of them has a
budget. At a year of logs and fifty sessions the watching can cost more than the work, and the plan's own weekly
line *cost per finished intent* would not show it, because a page render is not an intent.

**(FACT: COVERAGE §06, 2026-09-05)** Idempotency keys appear exactly once in v2, on the dead-letter and resume path.
**(NEW: reasoning)** The best system makes the key a required field of the staged outward artifact, so that the
guarantee holds against a second host, a resumed run and a retried send with one mechanism instead of three.

**(NEW: reasoning)** **A versioned log format.** v2 is careful that the *vendor's* transcript format is internal and
changes between releases (**FACT: v26, memory.md, 2026-09-05**) and treats its own `gen_ai.*` rows as permanent. At a
year, the first schema change to our own log is the migration nobody planned, on the one store the design promises
never to edit.

**(NEW: reasoning)** **Tenancy that is probed rather than asserted.** Cross-venture isolation is placed at §12 with a
credential argument, which is correct and incomplete: a run's read scope is a per-run `--add-dir`, and v34's probe
already asserts what a run can touch. At ten ventures the negative — *this run could not read that venture* — is the
assertion that matters, and it is generated, not written.

**Where it breaks, said plainly:** ten ventures breaks the **Desk's inputs**; fifty sessions breaks the **log's
write path**; a year of logs breaks the **surface tier**; a second Mac breaks the **Sender**; a month away breaks
the **cord's reachability** and wastes 30% of every window. A second human breaks nothing today and costs one field
to keep that true.

---

## What I would delete

**`logbook/desk/<tick>.json` as a file per tick.** It is the highest-volume artifact in the design and it holds an
answer — the ranking and the gate that stopped each candidate — whose value decays within hours. Delete the file
shape; keep every field as rows in the event log. *Why did you not do that* stays answerable, and the file count
stops being a function of uptime. **(NEW: reasoning)** Deleting it now is free; deleting it after a year of ticks is
an archive migration.

**The per-venture `open.md` store.** Ten ventures produce ten queues of *questions waiting on the founder*, written
by the Watch alone, answered by one person from one place. Replace ten stores with one house-level queue carrying a
venture field. It removes nine writer-contention points and one whole class of *which queue am I looking at*.

**The reason under COVERAGE §11's refusal, not the refusal.** *"One founder, one Mac"* is falsified by §15.4's own
restore drill, which puts a second Mac in the design by name. Keep the refusal of multi-host failover; delete the
premise and cite the lease instead. **(NEW: reasoning)** A correct refusal resting on a false premise is the kind
that gets reversed by the first person who checks the premise.

**The name *venture health score*.** COVERAGE §31 already renames it to three raw numbers and says *"a composite
hides which broke."* The name survives on two pages and is an open invitation to compute the composite the plan
refuses. Delete the name; keep the three numbers and add the ordering proposed in scenario A.
