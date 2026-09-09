# L5 · truth-and-cost · the rethink round · 2026-09-06

*Sections 06 Communication · 07 Context & cost · 08 Quality & truth · 13 Economics. Read against SPINE v1–v65 (v1–v5
and v54–v65 fixed), COVERAGE, parts 06 · 09 · 11 · 16, research/models.md and research/cognition.md.*

**Ninety-one keywords. 47 KEEP · 21 IMPROVE · 11 RETHINK · 0 ADD · 12 REFUSE-STANDS.**

**(NEW: the zero ADD is this lane's first finding.)** Not one keyword in these four sections is absent from COVERAGE —
each is placed, refused with a reason, or renamed. The gap here is not coverage but **calibration**: rows name a number
nothing produces (false-negative rate), a currency that does not bind (dollars on a subscription), and a premise
nothing measures (the cache hit rate v57's economics rest on). What would be an ADD elsewhere is a RETHINK here,
because the row exists and the mechanism under it does not.

**The sentence this lane would put at the top of the plan:** *everything is anchored to something outside a model, and
no anchor has ever been shown to fail when it should.*

---

## 06 · Communication

| Keyword | Reading | v2 | Verdict | Proposal / mech / cost / settles / row |
|---|---|---|---|---|
| **Orchestrator brief** | The artifact that binds a run, reviewed by nobody | IN · §3, §6.2 (v34, v37, v45) | **IMPROVE** | Hash the brief at dispatch; the handover carries `brief_sha`; `bin/run` refuses a brief whose `done-test:` is not **byte-identical** to the intent's — §6.2 mandates verbatim copy and nothing checks it. **Mech:** `bin/run` + `keel/shared/schemas/brief.yml` (ABSENT). **Cost:** two comparisons. **Settles:** a mutation case that paraphrases a done-test and expects a refusal. **Row:** extends v45; new row |
| **Structured return format** | Fixed fields, always, even on failure | IN · §6.3 | **KEEP** | `uncertain` is unmatched anywhere shipped |
| **Dispatch by reference** | Ids and paths, never inline payloads | IN · §3 | **KEEP** | A summary cannot lose what it never carried |
| **Shared board** | Page 4, with one writer per row | IN · §14 (FOUNDER, v52) | **KEEP** | The founder's page; a card has a writer |
| **Baton handoff** | The handover is the baton | IN · §6.3 | **KEEP** | I-PASS fixed fields, sourced, measured |
| **Board rewrite cycle** | Append deltas, never rewrite | RENAMED · §13 (v24) | **KEEP** | ACE measured the collapse: 18,282 → 122 tokens |
| **Board cap size** | A byte cap per store | IN · §13 | **KEEP** | The byte cap binds; a checker enforces it |
| **Worker-to-worker request** | May a teammate ask another, and in what shape | RENAMED · §3 — COVERAGE marks it `?` | **RETHINK** | Free-form agent chat is evidence with no provenance and no ledger row. **A message between agents is a handover or an objection, on the handover schema, or it does not exist.** **Mech:** reuse `keel/shared/schemas/handover.yml` for the team inbox; **one file per message, append-only**, never a mutable JSON document. **Cost:** no new schema. **Settles:** a run whose only input was a peer message still reconstructs from files alone. **Row:** resolves the `?`; new row |
| **Peer help request** | The same channel, and what if nobody answers | RENAMED · §3 — `?` | **RETHINK** | The ask carries a deadline **and the asker's stated fallback if unanswered**, so it never blocks. **Mech:** three required fields on the shape above. **Cost:** three fields. **Settles:** kill the responder mid-run; the asker must still hand over. **Row:** same new row |
| **Stuck-worker escalation** | The cord, and waking on repeated blocks | IN · §12 | **KEEP** | Pulling the cord on itself scores as success |
| **File lease** | Two runs, two intents, one file | IN · §6 (v6) | **IMPROVE** | v6 removes the intra-artifact case and is silent on the inter-intent one: two worktrees, one file, a conflict found at landing. **The Desk refuses a run whose declared scope intersects a live run's worktree scope.** **Mech:** the Desk reads live runs' paths from the logbook (ABSENT). **Cost:** a set intersection at dispatch. **Settles:** two intents on one file; the second queues. **Row:** new row |
| **File lock alternative** | The same, one layer down | IN · §6 | **KEEP** | Subsumed by the lease at the Desk |
| **Pair-work protocol** | The Floor | IN · §15 | **KEEP** | One agent, same memory, same envelope, sterile |
| **Broadcast channel** | Telling everyone at once | REFUSED · §3 | **REFUSE-STANDS** | No nested teams; nothing to broadcast to |
| **Blackboard pattern** | Shared state everyone reads | RENAMED · §13 | **KEEP** | The event log, with provenance and a cap |
| **Production-scale messaging** | A bus | REFUSED · §3 | **REFUSE-STANDS** | Infrastructure for its own sake at this load |
| **Handoff token limit** | The cap on what travels | IN · §6 | **IMPROVE** | The cap is inherited from a Sonnet-4.6-era measurement and the current engines produce *"approximately 30% more tokens for the same text"* (FACT: models.md, vendor, 2026-09-05). **State caps in bytes, or carry the tokenizer they were measured on; `bin/run` refuses to enforce a legacy cap on a current-tokenizer model.** **Cost:** one field. **Settles:** token-count one real handover on both. **Row:** extends §9.7; new row |
| **Handoff required fields** | Nothing is an allowed value | IN · §6.3 | **KEEP** | One schema; the prose tables generated from it |
| **Message priority tag** | A second ranking | RENAMED · §4 | **REFUSE-STANDS** | One ranking, the Desk's; two would disagree |
| **Message retry policy** | Resume, not restart | IN · §6 (v12) | **KEEP** | `/goal` survives transient failures and rate limits |
| **Dead-letter queue** | Where work goes when it cannot resume | IN · §6 | **IMPROVE** | v2 names idempotency and resume and **no terminal state**. **A run that fails to resume N times becomes a `blocked` card in "waiting on you" with the exact failure text, and the failure is written to the negatives store so the next brief carries it.** **Mech:** a resume counter on the run row; the negatives store (ABSENT). **Cost:** a counter and one write. **Settles:** kill a run three times; expect a card, not a silence. **Row:** new row |
| **Inter-agent protocol** | A protocol of our own | RENAMED · §3 | **KEEP** | Inbox files and the log; subsumed above |
| **Communication audit trail** | Reconstructing what was said, and on what basis | IN · §14 | **IMPROVE** | The brief is not logged as a hashed artifact, and §3.8 records this repo losing a measurement in synthesis **twice** — *"the orchestrator's brief is a defect surface nobody reviews."* **Log brief and handover as adjacent hashed rows; the briefing renders them side by side.** **Cost:** two rows. **Settles:** reproduce one run's inputs from the log alone. **Row:** extends v34 |
| **Silent failure detection** | A run that dies without handing over | IN · §11 | **RETHINK** | *"A run must hand over"* is not a mechanism: a killed process hands over nothing, and the nightly re-run catches a regressed done-test, not a vanished run. **`bin/run` writes `run.started` before exec; the Watch reaps any run with a start and no terminal row past its wall-clock ceiling and marks it `lost`, which is an event.** **Mech:** the event log, the Watch tick, the `SessionEnd` hook writing the partial handover (ABSENT). **Cost:** one reaper. **Settles:** `SIGKILL` a run; expect a `lost` row next tick. **Row:** new row |
| **Notification throttling** | Three a day; a channel demoted on evidence | IN · §14 (§C.2) | **KEEP** | ICU alarms; it demotes itself on acted-on rate |

---

## 07 · Context & cost

| Keyword | Reading | v2 | Verdict | Proposal / mech / cost / settles / row |
|---|---|---|---|---|
| **Session-start injection size** | What a session pays before doing anything | IN · §3 | **KEEP** | Measured 27,069 → 2,941 bytes; byte-denominated |
| **Context reduction ratio** | A ratio to optimise | REFUSED · §16 | **REFUSE-STANDS** | A ratio invites gaming; cost per intent is the number |
| **Skill discovery cost** | What it costs to find and load knowledge | IN · §7 | **RETHINK** | **The lookup is solved; the startup tax is not.** The standard loads ~100 tokens of metadata per *installed* skill at startup **for every skill**, deferring only the body (FACT: SPINE §E.1). A house library of a hundred-plus therefore taxes every session of every agent at the same order as the `MANIFEST.json` defect this repo already fixed — same shape, different filename. **Generate one directory per namespace and point each agent at only the namespaces its file declares.** **Mech:** v48's generator writes N directories from the one Markdown source; `bin/run` sets the path. **Cost:** one generator pass. **Settles:** research question 2. **Row:** extends v48, §E.4; new row |
| **Budget guard script** | Ceilings that reject, not warn | IN · §12.9 | **KEEP** | Pre-action, three scopes, tightest binds |
| **Stall ceiling** | A fuse against calls without progress | IN · §16.5 (v23) | **KEEP** | Correctly named; subagent spend counts |
| **Context monitor tool** | Something watching while nobody is awake | IN · §4 | **IMPROVE** | What it watches is unnamed, and an unnamed alert is a threshold someone invents at 3am. **One instrument, three series: a control chart over each shape's own history for cache-read share, tokens per run, and trust pass rate** — §11.10 already asks for a control chart on trust. **Mech:** one chart function over the ledger (ABSENT). **Cost:** one implementation instead of three thresholds. **Settles:** a seeded excursion trips it. **Row:** extends v14 |
| **Batch API discount** | 50% both ways, stacking with caching | RENAMED · §16 | **KEEP** | Priced and ready; it waits on the terms row |
| **Overnight non-interactive work** | Work while the founder sleeps | IN · §10 (v56) | **KEEP** | `-p` on the Mac; the cloud lane is the founder's |
| **Cache read discount** | 0.1x, and 0.025x for Fable | IN · §16 | **KEEP** | Quoted from the vendor's own page |
| **Cache hit measurement** | Whether reads hit — the dominant term of the bill | IN · §14 | **RETHINK** | v2 measures the rate **after** the fact and watches nothing that causes it. v57 puts the two heaviest producers on the model whose whole justification **is** the 0.025x read and whose one-hour write is 2x on a $10/MTok base, the most expensive miss in the table (FACT: models.md 2026-09-05). **Hash the standing prefix — system prompt, tool definitions, skill metadata — at dispatch, record it on the run row, treat a change as an event; turn on `--exclude-dynamic-system-prompt-sections` and `--system-prompt-snapshot on`, which §9.5 names shipped and unused.** **Mech:** `bin/run`; page 3 draws distinct prefixes per shape. **Cost:** one hash. **Settles:** research question 1. **Row:** new row under v57 |
| **Cost per mission** | Per intent, measured | IN · §16 | **KEEP** | Measured, never estimated; medians rank |
| **Cost per session** | Per run, from the runner's record | IN · §16 | **IMPROVE** | The teams carrier may be unjoinable: a teammate is a full session whose id the launcher may not mint, and `config.json` is *"overwritten on the next state update"* (FACT: §D, §14.5). v59 turned on the priciest mechanism and the id rule may not reach it. **Snapshot `config.json` into the logbook on each state update; a mechanism whose cost cannot be joined is refused for unattended work.** **Cost:** one snapshot writer page 2 needs anyway. **Settles:** dispatch a team, join every teammate's cost to the parent intent. **Row:** extends v43, v59 |
| **Task id tagging** | An id on every row | IN · §14 | **KEEP** | A UUID minted by us, not the vendor's handle |
| **Actual burn tracking** | What it really cost | IN · §16 | **KEEP** | Measured; per-task third-party figures refused |
| **Token budget per agent** | A ceiling in tokens | RENAMED · §16 | **IMPROVE** | An inherited ceiling understates by ~30% on the current tokenizer, **and a ceiling that fires early is indistinguishable from a stuck run** — the plan would read its own budget error as a stall. **Every ceiling carries `tokenizer:`; `bin/run` refuses to enforce a legacy one on a current-tokenizer model.** **Cost:** one field. **Settles:** token-count one real brief on both. **Row:** extends §9.7; new row |
| **Context window trimming** | Getting back to work after a window closes | IN · §6.4 | **KEEP** | Resume from files, never from a summary |
| **Context compression** | Squeezing without losing the number that mattered | IN · §6 (v24) | **RETHINK** | v24 forbids **us** from rewriting context; the runtime's own auto-compaction does exactly that inside an unattended `-p` run, unobserved — and ACE measured that shape falling from 18,282 tokens at 66.7% to 122 at 57.1%, below baseline (FACT: memory.md, arXiv 2510.04618). **Establish whether `-p` compacts and whether it emits anything observable; if so, log it and mark every handover written after one; if not, bound run length so it is not reached.** **Mech:** the run row, plus `maxTurns`, which marks output partial and resumable rather than truncating. **Cost:** one measurement, then a field. **Settles:** research question 3. **Row:** extends v24; new row |
| **Prompt caching strategy** | Byte-identical standing prompts | IN · §16 | **KEEP** | Right rule; the prefix hash proves it is kept |
| **Cost anomaly alert** | Noticing a blow-up before the window does | IN · §14 | **IMPROVE** | Same control chart as the context monitor; "anomaly" is otherwise undefined. **Cost:** shared. **Settles:** a seeded excursion. **Row:** v14 |
| **Spend dashboard** | Page 3 | IN · §14 (v14) | **KEEP** | Every number names the tap that acts on it |
| **Per-model cost table** | Prices joined by model id | IN · §9.6 | **IMPROVE** | Prose with a fetch date; rows already UNVERIFIED, one price rendered identically for two tiers (FACT: models.md 2026-09-05). **`keel/shared/prices.yml` carries `fetched_at` and `valid_until` per row, and a stale row refuses routing rather than mis-pricing** — the disposition the ledger already forces on every other durable fact. **Cost:** two fields. **Settles:** expire a row, expect a refusal. **Row:** extends v19's idiom; new row |
| **Rate-limit cost impact** | Two windows, two limit shapes | IN · §16.2 (v22) | **IMPROVE** | v2 learns a limit **by receiving the message**, which arrives after the stop. **Meter consumption forward against an observed high-water mark per window per seat and let the Desk hold back before the wall; the vendor's message becomes the backstop, not the signal.** **Mech:** the Watch's gauge, from observed consumption, because no denominator is published. **Cost:** a high-water file. **Settles:** does the observed maximum stabilise across two weekly windows. **Row:** extends v22; new row |

---

## 08 · Quality & truth

| Keyword | Reading | v2 | Verdict | Proposal / mech / cost / settles / row |
|---|---|---|---|---|
| **Claim ledger** | Durable facts as rows with resolvers | IN · §11 | **KEEP** | It exists, blocks in CI, appends without `Write` |
| **Forced claim expiry** | A date, or it is not a claim | IN · §11 | **KEEP** | Enforced; the rule that catches fabrication |
| **Claim disposition** | Refresh, Deprecate, or Waive | IN · §11 | **KEEP** | A lapsed waiver fails harder than none |
| **Verdict-diff binding** | A verdict belongs to one diff | IN · §11 | **IMPROVE** | Hash-binding stops an **inherited** verdict, not a **forged** one, and the workflow says so about itself. **`bin/verdict` signs with a key under a path every agent's grant excludes and `denyRead` covers; the probe asserts the exclusion nightly.** Stated honestly: this raises forging from a file write to defeating a checked deny rule — a guardrail, not containment. **Cost:** a keypair and a verify step. **Settles:** an agent writing a passing verdict produces one that fails verification. **Row:** new row |
| **Sha256 verification** | The Sender acts on a hashed artifact or none | IN · §12 | **KEEP** | Bound to bytes, not to a description of them |
| **Risk tier classifier** | Reversibility, not path | RENAMED · §12 (v28) | **KEEP** | It stands alone in the world; nothing ships it |
| **Multi-step check suite** | One runner, an honest tally | IN · §11.8 | **KEEP** | INCOMPLETE, SUBSET, REFUSED are terminal |
| **QA gate** | It blocks, and verifies rather than produces | IN · §11 | **KEEP** | Reading it as the panel is the documented trap |
| **Oracle-first review** | Deterministic before any model | IN · §11 | **KEEP** | It has blocked its own author's work |
| **Blind reviewer pool** | Blindness as a property of the process | RENAMED · §11 (v8) | **IMPROVE** | Blindness is argv on the `-p` carrier and **UNVERIFIED** on teams and subagents, where it must be a `permissions.deny` rule (v43). **Route `tester` and `challenger` onto the `-p` carrier only until `bin/probe` asserts read-denial on the other two** — a routing rule beats an unchecked assertion. **Cost:** one condition in `bin/run`. **Settles:** the probe attempting the excluded read on each carrier. **Row:** extends v43 |
| **Weighted score spec** | Averaging model opinions | REFUSED · §11 | **REFUSE-STANDS** | A score is a finding with the information removed |
| **Council review** | A vote among models | REFUSED · §11 | **REFUSE-STANDS** | A vote has no anchor. **Note for L7, not this lane's proposal:** the plan's own shape dissolves the "no second family inside Claude Code" constraint — `bin/run` is a no-model launcher driving both providers, so a two-family panel need not run inside a Claude session. Unioned findings, never a vote |
| **Persona convening** | Assigned dissent | REFUSED · §11 | **REFUSE-STANDS** | Same-family review in costume |
| **Self-attack review** | The builder testing its own work | IN · §11.4 | **KEEP** | Rung 0, cheap hygiene, labelled as proving nothing |
| **Taste review panel** | Judging what only the founder can judge | RENAMED · §11.6 | **IMPROVE** | The store's only writer is `curator`, which is **wave two** (v54) — so wave one has no taste store and every taste question is rung 3, the founder's. **Name it as a prediction, not a defect: founder-minutes per finished intent is at its maximum in wave one, and crossing a founder-set line on that number is what promotes `curator` into wave one.** **Mech:** §21.1's existing number. **Cost:** none; already measured. **Settles:** the number itself. **Row:** improves inside v54, reverses nothing |
| **Correctness review panel** | The anchor, then a checker | RENAMED · §11.3 | **KEEP** | Rung 4 is labelled rung 4, never rounded up |
| **Regression detection** | Live done-tests as the suite | IN · §11.8 | **RETHINK** | Re-running every anchor unattended makes the suite an **actor**, and **an anchor with a side effect turns the regression suite into a Sender** — a v33 trifecta breach arriving through the one mechanism the plan calls free. **Every anchor declares `effect: none \| metered \| reaches-the-world`; the unattended re-run executes only `none`; anything else goes through the Sender's path or not at all.** **Mech:** a field refused at the store check when absent. **Cost:** one field. **Settles:** a seeded side-effecting anchor must be refused. **Row:** new row under v33 |
| **Statistical quality method** | Pass rates that can carry a decision | IN · §11.10, §E.2 | **IMPROVE** | Two rules for one question: §11.10 prints `insufficient` below a sample floor, §E.2 admits a skill on 2–3 cases. **One shared sample-floor predicate for the trust score, skill admission and the error rates** — this repo already shares the ≥2-family predicate from one module rather than writing it twice. **Cost:** one function. **Settles:** a skill admitted on two cases carries `insufficient` and a short expiry. **Row:** extends v19, §E.2 |
| **External-world verdict** | A record the company does not write | IN · §11.2 | **KEEP** | The sharpest rule in the plan, written twice |
| **Ground-truth comparison** | Known-answer cases | IN · §11.10 | **KEEP** | Also the test that widens Codex (H.2) |
| **False-positive rate** | How often the instrument cries wolf | IN · §11 | **IMPROVE** | Named in COVERAGE with no producer anywhere. **Both rates are computed from the rehearsal set and stored on the anchor; an anchor with neither is `unrated`.** **Mech:** the rehearsal runner records numbers it already has (ABSENT). **Cost:** two fields. **Settles:** one rehearsal pass. **Row:** new row, paired with the next |
| **False-negative rate** | How often it passes a broken thing | IN · §11 | **RETHINK** | **This is the hole under the whole ladder.** Rung 1 assumes a deterministic check checks, and this repo has shipped a change that **removed a control while every test stayed green**. An uncalibrated anchor is a rung-4 belief in a rung-1 label — what §11.7 built the reconciliation to stop, one level up. **Every anchor carries a mutation case, a known-bad input it must fail; `bin/run` records `anchor_rated`; §21.1's rung-1 share splits into rated and unrated.** **Mech:** the mutation case is a rehearsal-case body under v18, inheriting admission and forced expiry. **Cost:** one case per anchor, written when the anchor is. **Settles:** an anchor that passes its known-bad input is unrated by definition. **Row:** new row; extends v45, §11.2 |
| **Reviewer disagreement resolution** | Who wins | IN · §11.3 | **KEEP** | The anchor wins; a dispute is a which |
| **Confidence scoring** | A number for how sure | RENAMED · §11 | **KEEP** | The rung replaces the self-report and is auditable |
| **Hallucination detection** | The quote is present in the fetched text | IN · §11 | **IMPROVE** | The external-source resolver runs in **SHADOW** (`claim.would_block`) while `scout`'s entire anchor is that check. **Promote it to blocking on `scout` handovers only**, leaving the rest in shadow, so the friction lands on the one agent whose job it is. **Cost:** one enforcement scope. **Settles:** a fabricated quote fails one scout handover. **Row:** extends rule 3's SHADOW half |

---

## 13 · Economics

| Keyword | Reading | v2 | Verdict | Proposal / mech / cost / settles / row |
|---|---|---|---|---|
| **Per-worker cost** | What each named agent costs | IN · §16.1 | **KEEP** | Real now that an agent is a file that persists |
| **Per-mission cost** | Per intent | IN · §16.1 | **KEEP** | Measured, never predicted |
| **Cost-vs-value comparison** | Was it worth it | IN · §16 | **RETHINK** | v2's value side is *"the done-test passing"*, which counts **finished work, not value** — while §11.9 already defines a value signal taken from records the company does not write. **Cost per rung movement, per venture: the only ROI computable honestly, because the numerator is measured and the denominator is external.** **Mech:** `bin/reconcile` owns the rung table and ship log, the ledger supplies the cost, one join. **Cost:** one join, no new instrument. **Settles:** the first rung movement with a cost attached. **Row:** new row; makes §16.7's "ROI undefined" partly defined |
| **Investment stop criteria** | Stopping without sunk cost | IN · §16.6 | **KEEP** | No run raises its own ceiling; sunk cost excluded |
| **Mission budget cap** | The cap on one goal | IN · §16 | **IMPROVE** | Denominate it in the resource that binds; see the next row. **Row:** with Budget in money |
| **Budget in money** | A dollar ceiling | RENAMED · §16 (v23) | **RETHINK** | On a subscription the dollar is a locally computed shadow of a bill nobody sends: *"the session cost figure isn't relevant for billing purposes"* (FACT: vendor, models.md 2026-09-05). The scarce thing is the two windows. **Denominate ceilings in window share — tokens attributed to the seat against the observed high-water mark — plus wall-clock; keep USD as the shadow price for the day a metered key exists.** **Mech:** `bin/run`'s three ceilings read the Watch's gauge. **Cost:** the gauge already proposed above. **Settles:** whether the high-water mark stabilises. **Row:** new row beside v23 |
| **Budget in hours** | Wall clock | IN · §16 | **KEEP** | Per five-hour window and per week (v22) |
| **Exploration spend** | What curiosity costs | IN · §16.7 | **RETHINK** | *"Idle capacity … bounded by being free"* was true of one rolling five-hour window and is **false of a weekly one shared with Claude chat and Cowork** (FACT: vendor, via v22). **Night exploration on the Claude seat spends the founder's next day.** **Exploration-class intents run on windows that are not the founder's — Gemini's free tier, local models, the Codex seat — and the Desk refuses an exploratory dispatch onto the Claude seat past a founder-set fraction of the weekly window.** **Mech:** a class on the intent plus the Desk's gauge. **Cost:** one rule. **Settles:** split one weekly window between driven and exploratory work. **Row:** extends v22; new row |
| **Exploitation spend** | The driven ventures | IN · §16 | **KEEP** | Ceilings, and at most two driven at once |
| **Cheap-tier bulk usage** | The bottom of the stack | RENAMED · §9 (v20) | **KEEP** | Local models and Gemini; no Haiku tier to leave |
| **Cache-hit cost rate** | The dominant term | IN · §16.3 | **IMPROVE** | Nothing else moves the bill as much; the prefix hash under Cache hit measurement is the mechanism and this row is where the money lands. **Row:** new row under v57 |
| **Company P&L** | A venture's books | OUTSIDE · §16 | **REFUSE-STANDS** | The harness holds the reconciliation, not the books |
| **Revenue tracking tool** | Where revenue comes from | OUTSIDE · §16 | **REFUSE-STANDS** | Read from the processor as a claim, never typed |
| **Payment analytics tool** | Venture work | OUTSIDE · §16 | **REFUSE-STANDS** | Anchored by tying to the bank line |
| **Burn rate dashboard** | A venture's burn | OUTSIDE · §16 | **REFUSE-STANDS** | The harness's own burn is page 3 |
| **Runway calculation** | Months left | OUTSIDE · §16 | **REFUSE-STANDS** | Unconfirmed by the bank, so it promotes nothing |
| **ROI per mission** | Return on one goal | RENAMED · §16 | **IMPROVE** | Cost per rung movement defines it wherever a rung moved; where none moved it stays **undefined rather than guessed**, which is v2's rule and is right. **Row:** with Cost-vs-value |
| **Cost attribution model** | Whose cost is this | IN · §14 | **IMPROVE** | Ids on every event, minted at dispatch — except possibly on the teams carrier. **A dispatch mechanism whose cost cannot be joined is refused for unattended work.** **Row:** extends v43, v59; the snapshot under Cost per session |
| **Unit economics per agent** | What each of the fourteen returns | IN · §16.1 (v14) | **KEEP** | The number that would falsify v31 either way |

---

## Top 5 proposals of this lane

**1 · Calibrate rung 1: every anchor carries a mutation case, or it is marked unrated.** The plan is built so that
belief traces to something outside a model, and §11.11 lists fifteen anchors — none of which has ever been shown to
fail when it should. An anchor nobody has falsified is a rung-4 belief wearing a rung-1 label, the error §11.7 built
the reconciliation to catch, one level up; this repo has already shipped a change that removed a control while every
test stayed green. **What changes:** each anchor gets a known-bad input it must fail, `bin/run` records `anchor_rated`,
and §21.1's rung-1 share splits into rated and unrated so the quality-of-belief number stops flattering itself. **Why
better:** it turns the plan's central claim from an assumption into a measurement, on a mutation idiom this repository
already runs in CI. **Cost:** one case per anchor, written by whoever writes it, as a rehearsal-case body under v18, so
it inherits admission and forced expiry free. **How we would know:** an anchor that passes its known-bad input is
unrated by definition, and the first rung-1 share that falls is the system telling the truth for the first time.

**2 · Hash the standing prefix, because v57's economics are an unmeasured bet on the cache hit rate.** §16.3 records
two competent reviewers pricing this machine's predecessor **tenfold apart on one assumption, the cache hit rate**, and
v57 then put the two heaviest producers on Fable 5.1 — the model whose whole cost justification is the 0.025x read and
whose one-hour write is 2x on a $10/MTok base, the most expensive miss in the table. **The downside is unbounded in
exactly the case nothing observes.** **What changes:** `bin/run` hashes the standing prefix (system prompt, tool
definitions, skill metadata) at dispatch and records it, a prefix change becomes an event, page 3 draws distinct
prefixes per shape, and the two shipped flags §9.5 names as unused are turned on with the hash proving they work.
**Why better:** the hit rate is a lagging indicator on a bill; the prefix hash is a deterministic leading indicator on
a dispatch. **Cost:** one hash per dispatch, one line on page 3. **How we would know:** ten real moves per shape with
the flags and without, which is §16.3's own instruction to measure before believing an estimate.

**3 · Denominate budgets in window share, and stop night exploration drawing the founder's weekly window.** Two things
in v2 are priced in a currency that does not bind and a resource that is not free. Dollars: the figure is computed
locally at list price and *"isn't relevant for billing purposes"*, so three ceilings are expressed in a unit no vendor
will invoice. Idle capacity: *"bounded by being free"* was true of one rolling five-hour fuse, and **v22 made it
false** — the weekly window is per seat and shared with Claude chat and Cowork, so a night of exploration is subtracted
from the founder's next day. **What changes:** ceilings read a window gauge (tokens against an observed high-water
mark, since no denominator is published) with wall-clock beside them and USD as a shadow price; exploration-class
intents route to Gemini, local models or the Codex seat, and the Desk refuses an exploratory dispatch onto the Claude
seat past a founder-set fraction of the weekly window. **Why better:** the system stops budgeting in play money and
starts budgeting in the thing that runs out. **Cost:** one high-water file, one rule in the Desk. **How we would
know:** split one weekly window between driven and exploratory work; if exploration is invisible there, the old
sentence was right and this is over-built.

**4 · Cost per rung movement — the only honest ROI this company can compute.** §16.7 reports ROI as undefined because
revenue attribution cannot be made honestly. That is right, and it leaves the founder's central question unanswered:
is the machine producing anything. §11.9 already defines a value signal taken from records the company does not write —
a stranger understood it, a stranger did something, they came back, they paid. **What changes:** join the ledger's
measured cost to `bin/reconcile`'s rung movements and put *cost per rung movement, per venture* on the briefing beside
cost per finished intent. **Why better:** cost per finished intent can improve while a venture goes nowhere; cost per
rung movement cannot, because the world sets its denominator. It is also the only number that answers the purpose
paragraph directly, where the rest of §16 measures effort. **Cost:** one join; both sides already exist as designed
artifacts. **How we would know:** the first rung movement with a cost attached, and the first month the two numbers
point opposite ways, which is the month the second earns its place.

**5 · Make the brief binding: verbatim done-test enforcement, and a handover bound to its brief by hash.** §6.2 says
the done-test is *"copied verbatim from the Intent, never paraphrased"* and nothing checks it; §3.8 records this
repository losing a measurement in synthesis **twice** and names the cause — *"the orchestrator's brief is a defect
surface nobody reviews."* The plan binds a verdict to a diff by hash and does not bind a handover to the brief that
produced it. **What changes:** `bin/run` refuses a brief whose `done-test:` is not byte-identical to the intent's, the
brief is hashed at dispatch, the handover carries `brief_sha`, and both are logged as adjacent rows so a run's inputs
reconstruct from the log alone. **Why better:** deterministic, two comparisons, and it closes the one seam where a
model's paraphrase silently becomes the standard the work is judged against. **Cost:** two comparisons, two log rows.
**How we would know:** a mutation case that paraphrases one done-test and expects a refusal.

---

## Top 3 research questions

1. **What is the cache-read share per dispatch shape, and do the two prefix flags move it?** Ten real moves per shape
   on the subscription, read from each run's own reported token fields — not `/usage`, which *"reports the cache hit
   rate for the main conversation only"* — with and without `--exclude-dynamic-system-prompt-sections` and
   `--system-prompt-snapshot on`. **Source class:** local measurement against the runner's own record. It settles the
   premise under v57, under §16.3's formula, and under the tenfold divergence §16.3 records; every other cost number is
   downstream of it.

2. **Does the skill metadata tax scale with the installed library or with the agent's declared namespaces?** Two trees,
   one with the full house library installed and one carrying only one agent's declared namespaces, identical prompt,
   comparing input tokens from `--output-format json`. **Source class:** local measurement plus the vendor's skills
   documentation on what loads at startup. If the published *"every installed skill"* wording is literal, v3's library
   gets more expensive for every agent with every good skill added.

3. **Does an unattended `-p` run auto-compact, and does it emit anything the log can see?** One long run under `-p` with
   `--output-format stream-json --verbose`, watching for a compaction event, plus the vendor's documentation on
   compaction in print mode. **Source class:** local measurement plus vendor docs. v24 forbids rewriting context
   because ACE measured that shape collapsing below baseline; if the runtime does it inside a run, the plan's strongest
   memory rule is being broken where it cannot see. If it is unobservable, the answer is to bound run length.

---

## What the best system in the world would have here that v2 lacks

- **An instrument register.** (NEW: reasoning) Every anchor, gate and resolver with its measured false-positive and
  false-negative rate and the date its mutation case last ran, so a green check reads as *checked by a rated
  instrument* rather than *nothing complained*. (FACT: rule 10 and `scripts/ledger.test.mjs`, this branch, already pin
  `unresolved` distinct from `pass` for every resolver — this is that idea applied to anchors.) **At a year of logs it
  is the artefact that says which green checks still mean anything**, and v2 has nowhere to put the answer.

- **A cost model reporting a range and its driving assumption, not a point.** (FACT: §16.3, two reviewers diverged
  tenfold on the cache hit rate.) (NEW: reasoning) The plan rightly refuses to pick a number and then has nowhere to
  publish the interval, so page 3 shows a single figure whose fragility is invisible.

- **Prices and quotas as expiring data, generated rather than typed.** (FACT: models.md 2026-09-05 — every price
  carries a fetch date, one plan tier is UNVERIFIED because the page rendered the same figure twice, and Haiku 4.5's
  retirement is committed for 2026-10-15.) (NEW: reasoning) A price table in prose is a durable claim with no expiry,
  in a system whose rule 9 is that a durable claim carries one.

- **Forward metering instead of message-reading.** (FACT: §9.4 distinguishes a stop from a reroute by the *text of the
  limit message*.) (NEW: reasoning) The best system knows how much window is left before it dispatches; reading the
  message means learning the boundary by hitting it, every time.

- **An append-only inbox rather than a mutable document.** (FACT: §D — `~/.claude/teams/<team>/config.json` is
  *"overwritten on the next state update"*.) (NEW: reasoning) **At fifty concurrent sessions a mutable JSON inbox is a
  lost-update surface**, and the loss is silent: a message that vanished looks exactly like one never sent.

- **A log with a rebuildable index.** (FACT: `~/.agentvibe/events.jsonl` is 1.1 MB and 3,843 rows today, §14.6.)
  (NEW: reasoning) **This is where my field breaks at ten ventures and a year of logs:** page 3 joins cost rows to
  price rows on every render, and a linear scan of a year of events becomes the page's cost. Keep the append-only log
  as the only source of truth and derive an index that is thrown away and rebuilt, never a second store.

- **A second taste store and a second interruption budget.** (FACT: v65 — the founder only, for now; §21.1 — three
  interruptions a day, one taste corpus.) (NEW: reasoning) Every number in these four sections is denominated on *the
  founder*, so **a second human forks all three** and nothing says whose taste wins. Not a request to reverse v65; it
  is what to expect the day it is revisited.

- **Cost attributed across all three dispatch mechanisms, or the mechanism is not used unattended.** (FACT: v59 turned
  teams on with no model constraint, so the vendor's *"approximately 7x more tokens"* lands at each teammate's own
  price.) (NEW: reasoning) **The most expensive mechanism is the one whose attribution is least certain**, and at ten
  ventures that is where the bill goes with nobody able to say which venture spent it.

---

## What I would delete

1. **The duplicate cost formula.** §9.6 and §16.3 both carry it with the same coefficients. (FACT: this repository has
   already recorded what two implementations of one check cost — the risk classifier, where the second disagreed and a
   PR split found it.) §9.6 owns the formula; §16.3 cites it and keeps only its own argument, the tenfold divergence.

2. **Dollar-denominated ceilings, as ceilings.** Three scopes in a unit no bill uses on a subscription. Keep one USD
   shadow figure per run for the day a metered key exists; denominate the binding ceilings in window share and
   wall-clock.

3. **`--max-budget-usd` explained four times.** §6.5, §9.11, §12.9 and §16.5 each restate it with the same correction
   attached. One owner, §16.5, and three citations.

4. **The message priority tag, before it is built.** There is one ranking function and it is the Desk's; a priority
   field on an inter-agent message is a second ranking that will disagree with the first.

5. **Every token budget inherited from a Sonnet-4.6-era measurement, rather than adjusting it.** §9.7 already says an
   adjusted guess is still a guess. Delete the numbers and keep the ceiling as a field: an absent ceiling is visible
   and a wrong one is not.
