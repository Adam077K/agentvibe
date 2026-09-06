# L4 · knowledge — the rethink round · 2026-09-06

```
lane:       L4 · knowledge — founder's sections 04 Knowledge · 05 Memory · 12 Self-improvement
read:       parts/00-what-it-is, SPINE §A v1–v65 and §B–§J, DECISIONS §15 and §17, rethink/FOUNDER-LIST.md,
            COVERAGE §04/§05/§12, parts/07-skills, parts/13-memory-and-knowledge, parts/13a-self-improvement,
            parts/11-truth §11.5–§11.11, parts/19-build-order, parts/21-how-we-would-know,
            research/skills.md, research/memory.md
fixed:      v1–v5 and v54–v65 are the founder's. Nothing below reverses one; three proposals improve inside
            one, and each says which row it sits under and why the row's own test admits it
counts:     76 keywords — 35 KEEP · 29 IMPROVE · 4 RETHINK · 1 ADD · 7 REFUSE-STANDS
            (04 Knowledge 30: 9 · 18 · 2 · 0 · 1 — 05 Memory 28: 17 · 6 · 1 · 0 · 4 —
             12 Self-improvement 18: 9 · 5 · 1 · 1 · 2)
```

**Why there is only one ADD, and it is a finding rather than a shortfall.** COVERAGE places every one of these
seventy-six keywords already, so almost nothing in this field is *missing* — what is missing is the mechanism under
a placed item, which is what IMPROVE means here. The single genuine absence is the predicate that decides two
failures are the same one, and three of v2's own rules are written as though it exists.

**The one sentence this lane would keep if it kept one.** v2's knowledge design is measured at the door and
unmeasured afterwards: a skill is admitted on 2–3 cases and never observed firing, a memory slice is assembled
and never scored, and a rehearsal case is shipped into the same directory the agent reads while doing the work
that case will judge. **(NEW: three separate findings below, one shape — the instruments exist at admission and
stop at the threshold.)**

---

## 04 · Knowledge

| Keyword | Reading — for a one-founder company of agents | v2 | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Skill count** | how many exist is never the goal; each one taxes every unrelated run at startup | IN §7 — "an output of admission, not a target" (COVERAGE) | **IMPROVE** | Count is not the control; **the startup metadata budget per agent is**. Cap the summed `name`+`description` bytes over an agent's namespaces. **Mech:** `scripts/check-memory-budget.mjs` (EXISTS, this branch) re-pointed at the two generated skill dirs; the budget check itself ABSENT. **Cost:** one script, one number in the generator. **Settles:** measure loaded metadata per agent at 134 skills and at 500. **Row:** v3, one clause |
| **Two-tier skill router** | find the right skill without reading the library | IN §7.6 — the standard's own progressive disclosure | **KEEP** | Vendor ships the mechanism; three levels, published |
| **Skill lookup cost** | the price of *having* a library, paid by tasks that do not use it | IN §7 — *"~100 tokens"* per installed skill at startup **(FACT: agentskills.io/specification, skills.md 2, 2026-09-05)** | **IMPROVE** | v2 quotes the per-skill number and never multiplies it. Same mechanism as row 1 — the budget is the multiplication, made blocking |
| **Domain lens** | expertise as data an agent carries, not a procedure it follows | IN §5 — the roster's expertise column (v1) | **KEEP** | One lens per agent; it is a column, not a file to drift |
| **Review lens** | the named dimension a judgement is made against | RENAMED §11 — prose | **IMPROVE** | Lenses are **a linted data file, not prose** — `.claude/review-lenses.yml` and `.claude/lenses.yml` EXIST on this branch with `schema-lint.js` behind them, and §11 names neither. **Mech:** re-point §11 at the two files. **Cost:** none, they exist. **Settles:** does every reviewer dispatch name a lens id that resolves? **Row:** new row |
| **Content linting** | links resolve and facts trace to a fetched source | IN §11 | **KEEP** | `scripts/check-citations.mjs` EXISTS and blocks on a dead path |
| **Curation manifest** | the record of what was admitted and on what test | IN §7.7 — `CURATION.yml` inverted into an admission record | **IMPROVE** | **Two records of one fact, and they are in different scopes.** §7.5 step 4 writes a failed skill candidate to the **negatives store**, which §13.2 scopes **per venture**; skills are house-scope (v48). **Mech:** the failed candidate is written to `CURATION.yml` and `check:curation` (both EXIST); the venture store is not touched. **Cost:** one sentence in §7.5, one field. **Settles:** read §13.2's scope rule against §7.5 step 4 — they disagree today. **Row:** §E.3 |
| **Cut list** | what was refused, kept so it can be argued for | IN §7 | **IMPROVE** | Same object as the curation manifest; see the row above |
| **Mental model library** | reusable ways of thinking, held as a corpus | REFUSED §7 | **REFUSE-STANDS** | *Unanchored heuristics cannot be falsified.* And the placement is already there: a mental model that earns its keep **is** a review lens or an expertise lens, both linted data |
| **Stop-rule per model** | when to stop trying, per model | RENAMED §6 — the ceiling plus `or stop after N turns` (v12) | **KEEP** | The done-test is the goal condition; the turn clause bounds it |
| **Model citation rate** | how much of what is believed is anchored at all | RENAMED §11 — the rung-1 fraction | **KEEP** | Already one of §21's six numbers |
| **Uncovered-field detection** | noticing the system does not know a field *before* it guesses | IN §7 — the skill creator's first move | **IMPROVE** | Detection has no **trigger** — it is something the Operator notices. Make it an event: a brief whose namespace resolves to **zero unexpired skills** emits `skill.miss`, and that is what raises a `bin/skill` candidate. **Mech:** `bin/run` (ABSENT) emits the row; the log carries it. **Cost:** one event type. **Settles:** count `skill.miss` per venture over the first month of real work. **Row:** §E.3 |
| **Ad-hoc field learning** | going and getting knowledge nobody stocked | IN §7.5 — `bin/skill`, four moves | **KEEP** | scout → product → curator → eval; only the Operator dispatches (v49). Depends on the trigger above |
| **Taste profile** | what this founder accepts and rejects, derived from decisions | IN §13, §11.6 | **IMPROVE** | §11.6 designs a **held-out fraction** and produces **no number**. Publish one: predict-the-rejection accuracy on held-out founder rejections, beside §21's six. **Mech:** `bin/check-stores` field (ABSENT) fed by the mining pass's labels. **Cost:** one metric, one split. **Settles:** does the store beat "accept everything" on held-out rejections? If not, the taste check is rung 4 wearing a rung-2 label. **Row:** §11.6 |
| **Brand voice profile** | a venture's voice, which no CLI stores **(FACT: memory.md coverage table — none found)** | IN §13 — `writer`'s CRAFT row, exemplar body | **IMPROVE** | A new venture has **no decisions to derive voice from**, so §11.6's derived-only rule cannot seed it. Seed from the charter at intake, correct only by recorded rejections after, and the seed carries an expiry like any other unearned item. **Mech:** one charter field; curator deltas. **Cost:** one field. **Settles:** first venture with an outward artifact. **Row:** new row |
| **Customer voice profile** | real customer language, with provenance | IN §13 | **IMPROVE** | There is no corpus until a venture has customers, and the only inbound path is the world's door. **An empty store must read `empty` rather than being synthesised** — this is the cheapest hallucination surface in the design. **Mech:** the store check refuses an item whose source is not an inbound-row id (ABSENT). **Cost:** one rule. **Row:** §13.2 |
| **Per-project knowledge** | what is true of this venture and travels nowhere | IN §13 — the venture's memory directory | **KEEP** | Scope is stated and enforced by the curator's `--add-dir` |
| **Negative knowledge log** | dead ends, so capacity is not burned relearning them | IN §13.6 — the highest-value store; **no CLI ships one (FACT: memory.md)** | **IMPROVE** | **Split the scope.** A negative whose reproducing command names **no venture path** is a fact about the world — a tool, a model, a runtime — and is **house scope**, shipping in every venture's briefs. Today all negatives are per-venture, so a tooling dead end is relearned once per venture. **Mech:** the store check computes scope from the command; the Watch's tripwire reads both. **Cost:** one predicate. **Settles:** over the mined transcripts, what fraction of negatives are venture-independent? **Row:** §13.2's scope line |
| **Already-built registry** | what exists, so nothing is built twice | IN §13 — seeded by the transcript pass (v26) | **IMPROVE** | Make it **derived, not curated**: every handover carrying an artifact path writes the row, and the mining pass only seeds the pre-history. A derived view needs no expiry and cannot rot. **Mech:** `bin/curate` computes it from the log instead of proposing deltas. **Cost:** negative — less curation, not more. **Settles:** rebuild from the log alone; does it match the curated one? **Row:** §13.2 |
| **Examples library** | what good looks like, with provenance | IN §7 — the **exemplar** body (v18) | **RETHINK** | **The exemplar body and the rehearsal case are both SKILL.md bodies (v18, §7.2) generated into the same two directories an agent reads.** So an agent can load the case that will later judge it. That is train-on-test through a second door, and it silently voids every measurement §11.10 and §13a.4 rest on. **Proposal:** only exemplars ship into a runtime skill directory; a `rehearsal` body is `eval-only` and the generator excludes it. **Mech:** one frontmatter field plus a generator rule; `check:manifest` re-pointed (EXISTS) fails a leak. **Cost:** one field, one rule. **Settles:** grep both generated dirs for rehearsal bodies — as designed today, they are there. **Row:** **v18** |
| **Golden output archive** | held-out real outcomes to score against | IN §11 — mapped to the exemplar body | **RETHINK** | Same leak, sharper: a golden output is a **test set**, and mapping it onto a body that ships into context destroys its independence. **Proposal:** the archive is a store outside both skill directories — `keel/golden/` — readable only by the rehearsal runner's grant. **Cost:** one path, one grant line. **Settles:** can any agent's `--add-dir` reach it? **Row:** v18 |
| **Pattern promotion** | a repeated shape becomes a check | IN §13 — three sightings, on the curator's pass | **KEEP** | Second promotion is founder-reviewed, "three is a signal and not a proof". Depends on the same-failure predicate (§12 row 2) |
| **Skill retirement** | nothing leaves by itself | IN §7.4 — forced expiry (v19) | **IMPROVE** | v19 is kept, not reopened: retirement stays **date-forced**, not usage-triggered, because nobody ships usage retirement **(FACT: skills.md 20)**. What changes is the **evidence the disposition reads**: observed fire-and-pass rows from real runs rather than a re-run of the 2–3 admission cases. A skill that never fired defaults to Deprecate and a founder waiver is what keeps it. **Mech:** a `skill.activated` event joined to run outcomes (ABSENT) + `scripts/ledger.mjs` (EXISTS). **Cost:** one event type, one join. **Settles:** instrument one month; how many admitted skills ever fire? **Row:** v19, evidence clause |
| **Skill versioning** | knowing which artifact the evidence describes | IN §7 — folded into `valid_until` | **IMPROVE** | **A version and an expiry are different facts.** A body edited after admission has not been re-evaled and its date has not moved, so the admission record no longer describes the artifact. **Checked:** `CURATION.yml` EXISTS on this branch and carries **no hash and no `valid_until`**. **Mech:** the admission record carries the body hash; a changed hash voids admission until re-eval; `check:curation` compares. **Cost:** one field. **Settles:** hash the 134 today and diff against their entries. **Row:** §E.2 |
| **Skill deprecation policy** | one of the three dispositions, recorded | IN §7.4 | **KEEP** | Refresh · Deprecate · Waive-with-a-date, and no fourth outcome |
| **Skill ownership** | one writer, so the library has an author | IN §7 — the curator (v25) | **IMPROVE** | **v54 puts `curator` in wave two, and §7 and §13 make it the only writer of skills and memory — so wave one has no knowledge loop at all.** Not a reversal of v54: by **v54's own test** — *"the ones with a seed file or a code path today"* — the curator qualifies, and its code paths are on this branch now: `scripts/evict-memory.mjs`, `scripts/ledger.mjs`, `scripts/check-citations.mjs`, `scripts/check-memory-budget.mjs`, all verified present. **Cost:** one agent file in wave one. **Settles:** does the harness venture (v64) produce handovers nobody reads? **Row:** v54, inside it |
| **Skill test coverage** | proof a skill helps before it is trusted | IN §7.3 — `evals.json`, 2–3 prompts, with-skill vs baseline **(FACT: skills.md 7)** | **IMPROVE** | 2–3 cases is the **admission floor**, not the coverage. Real traffic is the running eval (see Skill retirement). Monte Carlo stays refused, and it now has a better reason than "the expiry does that work" |
| **Knowledge freshness check** | facts rot on a date, or on an event | IN §13 — an expiry on every item | **IMPROVE** | For a **reference** body — a vendor fact — the **falsifier beats the date**: a URL plus the quote whose disappearance *is* the expiry. The `claim-source` resolver already fetches a URL and asserts the quote (SHADOW, this branch). **Cost:** re-point an existing resolver. **Settles:** run it over the 22 INFRA-class skills; how many quotes still resolve? **Row:** v19 |
| **Cross-project knowledge sharing** | what travels between ventures and what must not | IN §13 — craft and taste cross; facts do not | **IMPROVE** | Two corrections, both above: world-facts negatives are house scope, and skills are already house scope (v48) while being evaluated in one venture's context |
| **Tacit knowledge capture** | the founder's judgement, already recorded, unread | IN §13.7 — a batch pass over a snapshot (v26) | **IMPROVE** | The pass needs a **watermark**, not one shot. §13.7 treats 3,060 transcripts as a backlog that clears once; new transcripts arrive forever. **Mech:** `bin/mine --since <session-id>` writing a watermark, so the backlog pass and the steady pass are one program. **Cost:** one field. **Settles:** the count is non-zero the day after the first pass. **Row:** v26 |

---

## 05 · Memory

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Decisions log** | why a choice was made, retrievable later | IN §13 — the logbook; a decision is a handover with its brief | **KEEP** | Append-only and never summarised in place |
| **Log eviction policy** | bound what one reader must load, lose nothing | IN §13 | **KEEP** | Evict memory, never the logbook; `scripts/evict-memory.mjs` EXISTS |
| **Log archive tool** | archiving is a tool's job, not a judgement call | IN §13 | **KEEP** | The tool refuses what the rules forbid and checks no byte was lost; a hand-edit does neither |
| **Long-term memory file** | what survives every session | IN §13.4 — index at start, topics on demand (v27) | **KEEP** | Now the vendor's own default **(FACT: memory.md — 200 lines / 25 KB)**, not a local invention |
| **Session memory file** | the run's own context, which dies with it | IN §6 | **KEEP** | Disposability is the point; the handover is what survives |
| **Memory budget checker** | a cap that binds, checked by a program | IN §13 | **IMPROVE** | `scripts/check-memory-budget.mjs` EXISTS and governs `DECISIONS.md` and its archives only. Extend it to the six stores **and** to the skill metadata budget (§04 row 1) — one checker, three subjects. **Cost:** one config list. **Settles:** run it against the six store paths on the day they exist. **Row:** §13.2 |
| **Global facts store** | dated, sourced, expiring facts about the world | IN §13 | **KEEP** | Model ids live here with their retirement dates (§G.4) |
| **Project taste store** | the founder's judgement as a corpus | IN §13, §11.6 | **IMPROVE** | See §04 Taste profile — it needs a number, not a new store |
| **Learned-field expiry** | knowledge that rots on a date with a forced decision | IN §7, §13 | **KEEP** | *"Ahead of every system surveyed"* **(FACT: memory.md — none found shipped)** |
| **Memory ledger** | provenance on every item | RENAMED §13 — source, date, expiry, falsifier | **KEEP** | Four required fields; no shipped CLI records source **(FACT: memory.md)** |
| **Retrieval mechanism** | the slice a run actually gets | IN §13.5 — ranked by recency, importance, relevance; three items forced | **RETHINK** | **The slice is assembled and never scored.** §13.5 says *"the Desk is itself measured"* and names no measurement, so the ranker cannot be wrong. **Proposal:** slice precision — of the items carried, how many were load-bearing — **derived by the curator from the artifact and handover, never self-reported by the run**, and it increments ACE's helpfulness counters, which are the paper's own cure **(FACT: memory.md 1, arXiv 2510.04618)**. **Mech:** `bin/curate` computes it; the item schema carries the counter (both ABSENT). **Cost:** one counter, one derivation. **Settles:** measure precision over one month; below ~0.5 the slice is noise and forced items are doing all the work. **Row:** v24 |
| **Transcript archive** | years of the founder's judgement, free | IN §13.7 (v26) | **KEEP** | Batch over a snapshot, never a live parser — the format is internal and changes between versions **(FACT: memory.md)**. Add the watermark of §04's last row |
| **Unread transcript count** | how much of the past is still unread | IN §13 — *"the count goes to zero once, and that is the point"* | **IMPROVE** | True of the backlog, false at steady state. Replace the number with **watermark lag** — sessions recorded since the last mining pass — which is the same fact and stays meaningful in year two. **Cost:** none, it is the watermark. **Row:** v26 |
| **Verified project count** | a count of things called verified | REFUSED §16 | **REFUSE-STANDS** | *A vanity count; survivorship is measured instead* — §21's interventions-per-artifact cannot be gamed by producing more |
| **Episodic memory store** | what happened, in order, joinable | RENAMED §13 — the event log | **KEEP** | One row per event, ids on every row |
| **Semantic memory store** | what is true, small on purpose | RENAMED §13 — facts and craft | **KEEP** | Small because every item is carried into runs |
| **Procedural memory store** | how to do a thing, stored | RENAMED §7 | **REFUSE-STANDS** | Procedure is admitted in **two** places only (v18, v51): the Sender's checklist, where the judge is absent, and the curator's five fixed questions, where free reflection is **measured** to fail — *0 of 121 named the cause* |
| **Memory conflict resolution** | two items disagree, which is information | IN §13.3 — keep both, mark both | **IMPROVE** | Right rule, **no bound**. Conflicts are the one class that only grows, and at a year every slice carries both sides of every unresolved pair. **Proposal:** a conflict is an item with its own **owner and expiry**; at expiry it reaches the founder as a *which*, which is the channel that already exists. **Mech:** the store check requires both fields on a conflict pair. **Cost:** one item kind. **Settles:** count conflict pairs produced by the first mining pass over 3,060 transcripts. **Row:** §13.3 |
| **Intentional forgetting** | a drop is a known absence | IN §13 — expiry plus eviction | **KEEP** | Archived, never deleted; a stub keeps every citation resolving |
| **Memory service auth** | a hosted memory needs credentials and takes the data | REFUSED §8 | **REFUSE-STANDS** | *Memory would leave the machine* — Mem0 refused as it stands (§F) |
| **Memory access control** | who may write | IN §13.1 — the curator's grant alone (v25) | **KEEP** | One caveat stated plainly: the guarantee is argv, and `bin/probe` is **ABSENT**, so until it runs the control is designed and unasserted |
| **Memory provenance tag** | where an item came from | IN §13 — required field | **KEEP** | Claude Code records **write time only, not source** **(FACT: memory.md)**; this is ahead of the field |
| **Memory redaction rule** | nothing private leaves the machine | IN §13 — redact before anything leaves | **IMPROVE** | Named as a rule, implemented **twice** — once in the mining pass (§13.7 REDACT FIRST) and once as a `gitleaks`-class scan (§13.2). **Two implementations of one check disagree, and this repository has already paid for that.** **Proposal:** one program, `bin/redact` (ABSENT), called by the mining pass and by the Sender. **Cost:** one program instead of two. **Settles:** run it over a transcript sample; count credential and third-party PII hits. **Row:** §13.2 |
| **Memory sync interval** | when memory is written | RENAMED §13 — the nightly curator (v25) | **KEEP** | No schedule stated; it is the Watch's tick, which is what the SPINE requires |
| **Cross-agent memory sharing** | what one agent knows that another sees | RENAMED §13 — the slice is the only sharing | **KEEP** | The vendor explicitly does **not** share into subagents except a fork **(FACT: memory.md)**, so any sharing is ours and is visible |
| **Memory search index** | finding an item without loading the store | IN §13 — a local index, rebuildable, deletable | **KEEP** | MiniLM 384-dim, Apache 2.0, 256-word-piece truncation sets the chunk **(FACT: §G.1)**; no window burned |
| **Memory decay function** | old knowledge fading automatically | REFUSED §13 | **REFUSE-STANDS**, sharpened | Refused as **automatic removal**; the outcome counter is decay-adjacent and is kept. State it once: **counters may rank, never remove.** Only evidence or expiry removes an item |
| **Memory dedup logic** | an add that is really an update | IN §13.3 — near-duplicate becomes an update (v24) | **IMPROVE** | *Near-duplicate* names no model and no threshold, so it is a wish in the middle of an enforced rule. **Mech:** cosine over the local MiniLM embeddings already in the design; the threshold **calibrated on mined pairs, not guessed**. **Cost:** one calibration run, no window. **Settles:** label 100 mined pairs; pick the threshold that maximises F1 and record it as the falsifier. **Row:** v24 |

---

## 12 · Self-improvement

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Correction learning** | a redirect teaches the brief, not the run | IN §13a.5 — a defect attributable to one field | **IMPROVE** | **A live contradiction, and it is cheap:** §13a.5 says *"the brief has ten named fields"*; **v45 decided eleven** (nine + `agent:` + `anchor:`). One of the two is wrong and the attribution table is built on it. **Mech:** one schema file, `keel/shared/schemas/brief.yml` (v45, ABSENT), which the prose is generated from. **Cost:** an edit. **Settles:** read v45 against §13a.5. **Row:** v45 |
| **Regex classifier** | deciding two failures are the same failure | RENAMED §9 — a local model; §13a.2 marks it **WISH** | **ADD** | Nothing compares two failure texts, and **three named mechanisms sit on top of that gap**: the fast loop's stop on a second identical failure, the sighting counter, and negatives dedup. **Proposal:** the same-failure predicate is the anchor's exit signature **or** cosine over MiniLM embeddings of the normalised failure text — local, no window, models already in the plan. **Cost:** one predicate, one calibration. **Settles:** label 50 mined failure pairs; measure agreement against the predicate. **Row:** new row |
| **Post-mortem log** | failures kept where they will be read | IN §13.2 — the NEGATIVES store | **KEEP** | A memory store rather than a second file |
| **Post-mortem mechanism** | how a lesson is produced | IN §13.6 — five fixed questions | **KEEP** | *Never "what did you learn"* — **0 of 121 free reflections named the cause**, and confident wrong diagnoses were written into memory |
| **Pattern promotion threshold** | when a repetition becomes a rule | IN §13a.3 — three sightings | **KEEP** | Second promotion founder-reviewed; blocked on the predicate above |
| **Sighting count trigger** | counting the same shape | IN §13a.3 — the curator's counter | **IMPROVE** | Cannot count "one shape" without the same-failure predicate. Cite it rather than restate it |
| **Blocked improvement metric** | improvements that cannot even be tried | IN §14 — proposals blocked for want of a rehearsal case | **IMPROVE** | **Make it live from day one**, because §13a.4 admits the slow loop is a WISH until the rehearsal runner exists — this is the number that says so out loud instead of the loop looking healthy and empty. **Mech:** a state on the backlog item. **Cost:** one field. **Settles:** it is non-zero on the first proposal. **Row:** §13a.8 |
| **Prompt A/B testing** | a prompt change earns its way in | IN §11.10, §13a.4 — both versions against known answers | **KEEP** | The only self-editing permitted anywhere, bounded by known answers |
| **Pareto prompt archive** | keeping versions that win on different axes | IN §11 — narrowed to git history; *"a frontier needs a score nothing here produces"* | **IMPROVE** | **The score exists the day the rehearsal runner lands**: pass rate and cost per case are two axes, which is a frontier. Keep git history as the archive; write both numbers per version into `scores.jsonl` (already named in §19's build order). **Cost:** two fields. **Settles:** the first prompt change that is better and dearer — today it is adopted or reverted with no way to say so. **Row:** §11.10 |
| **Self-editing prompts** | an agent rewriting itself | REFUSED §11 beyond the A/B'd change | **REFUSE-STANDS** | The documented case **hallucinated a test log to fake passing, then removed the detection markers when they were added** — exactly what v30's measurement predicts |
| **Prompt-edit gate** | what stops a bad edit | IN §11.10 | **KEEP** | Not measurably better means reverted and kept as a negative; an agent file is irreversible tier besides |
| **Interventions-per-artifact metric** | the number that measures being walked *for* | IN §16, §21 | **KEEP** | The denominator is survivorship, so it **cannot be gamed by producing more** |
| **Field-note ledger** | a learned fact with provenance | IN §7, §13.2 | **KEEP** | A field note is a memory item with source, date, expiry and falsifier |
| **Field-note expiry** | it rots on a date, and a decision is forced | IN §7, v19 | **KEEP** | `scripts/ledger.mjs` forces one of three dispositions and refuses an open-ended waiver (EXISTS) |
| **Continuous fine-tuning** | learning into weights | REFUSED §9 | **REFUSE-STANDS** | It turns reversible artifacts into irreversible weights, and **no measured skills-vs-RAG-vs-fine-tune comparison exists in anything fetched (FACT: memory.md gaps)** — the trade would be made blind |
| **Feedback loop closure** | a lesson that cannot be forgotten | IN §11, §13a.1 | **IMPROVE** | Closure is asserted and not counted. **Name the ratio:** promoted negatives that became rung-1 anchors, over promoted negatives. It is the one number that separates a system that learns from one that accumulates prose. **Cost:** a query over the log. **Settles:** it is computable the month after the first promotion. **Row:** §13a.1 |
| **Improvement backlog** | one queue of what to improve | IN §13a.8 — `keel/logbook/backlog.jsonl` (ABSENT) | **RETHINK** | **A second store for a thing the system already has.** COVERAGE says *"improvements are intents"* and *"improvement ownership → the intent's owner field"*, and then §13a.8 creates a separate append-only file with its own writer to police. **Proposal:** the backlog is a **filter over the intent store** where `kind: improvement`; the negatives store is the other end and already exists. **Cost:** negative — one fewer store, one fewer writer. **Settles:** name one backlog field the intent schema cannot carry — owner, expiry, evidence and ceiling are all there. **Row:** §13a.8 |
| **Improvement ownership** | who owns an improvement | IN §2 — the intent's owner field | **KEEP** | And it is the argument for the row above: the field is already on the intent |

---

## Top 5 proposals of this lane

**1 · Break the exemplar/rehearsal leak — the test set must not ship into the runtime.** v18 makes *exemplar* and
*rehearsal case* two of four admissible SKILL.md bodies, and §7.1 generates every admitted skill into
`.claude/skills/` and `.agents/skills/`, which are exactly the directories an agent loads from by judged relevance.
So the case that will judge a run can be read by that run. **(NEW: reasoning — this is not a hypothetical; it
follows from two rules the plan already holds together.)** It is better because everything downstream is scored
against that set: §11.10's trust scores, §13a.4's prompt gate, §7.3's admission, and §21's claim that the roster is
falsifiable. A leaked oracle does not make those measurements wrong loudly; it makes them optimistic quietly, which
is the failure mode this plan exists to refuse. **Cost:** one frontmatter field, one generator rule, one re-pointed
check — `check:manifest` EXISTS on this branch. **How we would know it worked:** grep both generated directories
for `rehearsal` bodies and get zero, and check that no agent's `--add-dir` reaches `keel/golden/`.

**2 · Move `curator` into wave one, by v54's own test.** v54 is the founder's and is not reopened; its stated
criterion is *"the ones with a seed file or a code path today"*. The curator's code paths are on this branch and
were verified for this report: `evict-memory.mjs` implements the eviction branch of §13.3, `ledger.mjs` implements
the forced disposition of v19, `check-citations.mjs` blocks a dead path, `check-memory-budget.mjs` enforces the
caps. **(NEW: reasoning — as drawn, wave one has no writer of memory or skills, so the nightly loop, the negatives
store, the taste store and the sighting counter are all offline in the only wave that exists.)** It is better
because build order already puts transcript mining second of three, *"the only component that makes every other
component better on the day it lands"* — and mining with no curator produces candidates nobody may write. **Cost:**
one agent file in wave one, and the six business agents stay in wave two untouched. **How we would know it
worked:** the harness venture (v64) produces handovers and something reads them; the count of unwritten memory
proposals is zero rather than everything.

**3 · A skill budget per agent, enforced by the checker that already exists.** The spec publishes *"~100 tokens"*
of metadata loaded at startup **for every installed skill** **(FACT: agentskills.io/specification via skills.md 2,
2026-09-05)**, and §7.6 states the consequence — every admitted skill taxes every unrelated task — then names no
number and no mechanism. **(NEW: this repository has already paid for exactly this defect once, when reading the
whole manifest cost ~15,000 tokens per lookup and a good new skill made every unrelated task dearer.)** It is
better because it converts an open-ended library into a budgeted one: with 2,111 candidates upstream, the binding
constraint should be a measured budget, not taste. **Cost:** one script modelled on `check-memory-budget.mjs`, one
number per agent in the generator. **How we would know it worked:** measure loaded metadata bytes per agent at 134
skills and at 500, and the second number is under the cap or the import stops.

**4 · Log skill activation and join it to outcomes.** Admission measures 2–3 cases and the instrument then stops, so
whether the right skill fired on real work is unobserved. **(NEW: §7.3 concedes the small sample and hands the job
to expiry, but expiry is a date, not evidence.)** v19 stays whole — retirement remains date-forced, because
**nobody in the world retires by non-use (FACT: skills.md 20)** — and only what the disposition *reads* changes:
fire counts, and the pass rate of runs where a skill fired against runs where it did not. It is the only way the
library gets *more* trustworthy as it grows. **Cost:** one event type and a join; whether the runtimes already emit
it is research question 2. **How we would know it worked:** after a month of real runs every expiring skill has a
fire count, and the ones that never fired are visible rather than renewed by default.

**5 · Ship the same-failure predicate, because three mechanisms are waiting on it.** §13a.2 marks it WISH and
§13a.10 marks the regex row UNVERIFIED, and meanwhile the fast loop's stop condition (*"the same failure twice"*),
the sighting counter (*"three sightings of one shape"*) and memory dedup all assume the comparison exists.
**(NEW: reasoning — a rule whose predicate is undefined is not a rule, and these three are load-bearing.)** The
mechanism needs no new dependency: the anchor's exit signature where there is one, and cosine over local MiniLM
embeddings of the normalised failure text where there is not — both already in §G.1, both on electricity. **Cost:**
one predicate and one calibration run. **How we would know it worked:** label 50 failure pairs from the mined
transcripts and measure agreement; a night that retries the same wall three times is the failure it prevents.

---

## Top 3 research questions

1. **Does `LICENSE-CONTENT` at `sickn33/antigravity-awesome-skills` permit *derivative* skill bodies, not merely
   redistribution?** Bounded to one fetch of one file. This is narrower than §I row 4: under v18 we would **rewrite**
   imported bodies out of procedure into one of four admissible forms, which is a derivative work, and MIT-on-the-code
   says nothing about it. **Source class:** the licence file itself, read raw, not a badge or a README.
2. **Does any of the three CLIs emit a skill-activation event we can read, rather than one we must build?**
   Gemini CLI activates through an `activate_skill` tool *"requiring user consent before injection"* **(FACT:
   skills.md 10)**, Codex loads full instructions *"when they decide to use that skill"* **(FACT: skills.md 8)**, and
   Claude Code exposes hook events. **Source class:** the three vendors' hook and telemetry documentation. It decides
   whether proposal 4 is instrumentation or a field lookup.
3. **Is there any published measurement of selection accuracy as installed-skill count rises?** The ~100-token cost is
   published per skill; the effect of a large library on *picking the right skill* is not, and it is the real risk of
   importing thousands. **Source class:** the spec authors, Anthropic's engineering posts, and the ~47-harness client
   showcase. **(FACT: memory.md — Anthropic's skills post publishes no numbers at all; no measured
   skills-vs-RAG-vs-fine-tune comparison exists in anything fetched.)** If nobody has measured it, the honest
   position is a house measurement, and proposal 3's budget is what bounds the exposure until then.

---

## What the best system in the world would have here that v2 lacks

**Instruments that continue past the door.** (NEW) Every measurement in v2's knowledge design fires once, at
admission: the eval, the licence read, the description tuning, the `valid_until`. A best-in-world system measures the
same objects **in flight** — which skill fired, which memory item was load-bearing, which negative was hit before the
tool call — because the admission sample is 2–3 cases and the flight sample is everything the company does.

**A slice that can be wrong out loud.** (NEW) §13.5 forces three items in regardless of score, the right hedge
against a heuristic, and never asks whether the heuristic was needed. Slice precision, derived rather than
self-reported, is the smallest instrument that makes the Desk falsifiable, and ACE's helpfulness counter is the same
mechanism reached from the other direction **(FACT: arXiv 2510.04618, memory.md 1)**.

**An oracle with an expiry of its own.** (NEW) A rehearsal case whose right answer has changed is worse than no case:
it fails good work and passes bad. v18 and v19 expire *skills*, and §11.10 never says who re-validates a case or when
one is retired. At a year of logs this is the first thing that goes quietly wrong in the improvement loop, and it goes
wrong in the direction that looks like rigour.

**Where this field breaks, by scale.**

- **10 ventures.** (NEW) Negatives are per-venture (§13.2) while most dead ends are facts about a tool, a model or a
  runtime, so one tooling failure is relearned nine times — the fix is the scope predicate in §04's negatives row.
  Skills are house-scope by v48 but admitted on 2–3 cases from one context, so a skill that helps venture A can hurt
  venture B and nothing looks.
- **50 concurrent sessions.** (NEW) Writes are safe — one curator, nightly, batch. The hot path is **slice assembly**,
  which runs per dispatch against a local index on one Mac; MiniLM on CPU at fifty concurrent builds is this field's
  first contention point, and the skill metadata tax is paid fifty times over, which is what makes proposal 3 a
  throughput matter and not only a cost one.
- **A second human.** (NEW) v65 fixes this at the founder alone, and COVERAGE justifies the singular taste store with
  *"taste is shared fleet-wide because there is one founder."* The cheapest thing that keeps v65 intact and makes the
  future possible: taste items carry `owner: founder` **from the first write**, so a second human is a filter later
  rather than a migration.
- **A year of logs.** (NEW) Three monotonic growers, only one of which is bounded today: the archive rotates in capped
  volumes **(FACT: CLAUDE.md, `scripts/evict-memory.mjs`, exists)**; unresolved **conflicts** have no owner and no
  expiry and so only accumulate; and transcripts outrun a one-shot mining pass, which the watermark fixes.

---

## What I would delete

1. **`keel/logbook/backlog.jsonl`** (§13a.8). An improvement is an intent — COVERAGE says so twice — so this is a
   second store, with a second writer to police, for a thing the intent store already carries with owner, expiry and
   evidence.
2. **The venture-side write of a failed skill candidate** (§7.5 step 4). Skills are house-scope (v48) and the
   negatives store is per-venture (§13.2); `CURATION.yml` already exists, already records every cut with the test
   that made it, and is already checked. One record, not two.
3. **"Unread transcript count" as a surfaced number.** It is a progress bar for a backlog that clears once. Watermark
   lag is the same fact and stays true in year two.
4. **The "Pareto prompt archive" as a distinct artifact** (§13a.10). Git history is the archive and is reversible in
   one command; two numbers on `scores.jsonl` are the frontier. Nothing else is needed and nothing else should be
   built.
5. **The dependency on `skills-ref validate`** (§7.8). Its licence is **UNKNOWN** and was never fetched **(FACT:
   skills.md 3, gap 8)**, and the checks it performs — name length, directory match, description length, body length
   — are four assertions re-implementable from the spec text in an afternoon. Keep the checks; drop the dependency.

---

**Provenance.** (FOUNDER) rows v1–v5, v54–v65 and the quoted direction, untouched. (FINAL) the delta rule, the
one-writer rule, the five fixed questions, the negatives store, the rehearsal set. (FACT) every source named inline
with its research file and its 2026-09-05 access date. (NEW) every proposal above, with its mechanism named or marked
ABSENT, and no mechanism asserted that this lane did not verify on the branch. **Nothing here is built, and this file
edits nothing else.**
