# The system, as a system design · what the next team must understand, reason about, envision and spec · 2026-09-03

**What this is, in the founder's words.** *The next team and the next session are to talk about and understand
the new system we are planning. That includes the WATCH framework and also the other things we need to understand
in the system. The spec should identify, understand and plan the whole: the surfaces, working with the providers,
Claude Code, Codex, Gemini or whatever. The agents: how do we call them, how do we set up the prompts, what tools
do they get, what MCPs do they get, how do we make sure they will be able to do everything. All the things in
WATCH, and all the things besides it. Be open-minded: think, reason, envision, improve, and plan the whole system:
architecture, design, framework of the full crew, agentic, harnessed team, company, AI, vibe coding. Think about
it from a system-design point of view: different surfaces, different parts, different wings, different branches.
Do not plan the steps of building it. Plan the system and spec it. Do not say it will take seven days. Afterwards
we build, understand, write, challenge, rethink the whole system.*

**What this is not.** Not a build plan, not a schedule, not a first month. WATCH §25 holds a build order and it is
not the subject here. Nothing below carries a date or a duration.

**The frame.** WATCH, `2026-09-02-THE-SYSTEM.md`, decided the frame on 2026-09-03. It is the starting point, not
the ceiling: where the next team sees further, it says so and improves it, with the losing image kept by name.

---

## The wings of the system

A system-design view. Eight wings; each names what WATCH already says, what must still be understood and
decided, and the questions that are open. The fourteen territories further down are the finer grain.

### Wing 1 · The surfaces and the providers
*Where the crew runs and what it runs on.*
- **WATCH says:** cells are `claude -p` processes on this Mac, positions are argv, the founder's surfaces are the
  desk, the bay, the room, the dailies, the terminal and voice; a second model family is a procurement problem.
- **Understand and decide:** the provider layer as a first-class part. Claude Code as a runtime for cells (print
  mode, the measured seam `--restricted --tools --strict-mcp-config --permission-mode dontAsk`, managed settings,
  the inbox socket, the five-hour window or an API key). Codex CLI and Gemini CLI as runtimes for cells and as
  second-family judges (what each can and cannot be narrowed to; Codex exits 0 with empty stdout when detached from
  a TTY; `gemini` is installed and has never run; both local model pins were retired for weeks). The raw APIs
  through a router for batch work off the founder's clock. Which provider stands which position, chosen by
  instrument and price, never by loyalty. What is provider-neutral in the design (the Log, the Book, the bet, the
  mouth, the door) and what is provider-bound (argv, hooks, the window). How a cell's identity, credentials and
  budget survive a provider change.
- **Open:** whether one dispatcher speaks every provider, or each provider is a hand admitted through the door.
  What of Claude Code's own machinery the crew keeps (hooks, skills, agents files, MCP config) and what WATCH
  retires. Cloud runtimes (Routines, managed agents) as a sixth surface or as never-hands.

### Wing 2 · The crew, concretely
*How an agent is called, prompted, equipped, and proven able.*
- **WATCH says:** six positions, cells of twelve minutes, no agent files, no personas; the Compiler assembles
  trunk, inheritance and delta; the door admits hands; a probe every watch tests what a cell can actually touch.
- **Understand and decide, in the founder's four questions:**
  1. **How do we call them.** The dispatcher births a cell: the argv per position, the prompt fed on stdin, the
     worktree, the budget, the death condition, the checkpoint, the return schema. What a cell is named by (the
     bet id), and that it has no other name.
  2. **How do we set up the prompts.** The trunk, byte-identical and cache-warm, and exactly what it holds. The
     standing prompt per position (what a maker, a lookout, a looker, a judge is told, always). The delta keyed on
     the judge. The prompt standard that already exists here (`PROMPT-STANDARD.md`, the `PS-*` lint) and what of
     it survives. Where the founder's voice enters a prompt (the Second's lines, never a preferences file). How a
     prompt is versioned and how a prompt change is a bet that must beat the company's own history.
  3. **What tools and what MCPs they get.** Per position, the built-in tool list and the MCP servers, each admitted
     through the door with a declared exposure, a credential narrower than the hand, a rate ceiling, a dry branch,
     a caller, a probe. The current grant surface inverted: read-only instruments first, acting hands last. The
     browser as a day hand only. What the ~15 connected servers become when each is put through door test 1.
  4. **How do we make sure they will be able to do everything.** Coverage is the field map: every job a company
     has, with its class, its ground truth and its hand. The spec must show, per job, that a position, an
     instrument and a hand exist, or say Blind and route to the founder. Assurance is the probe: a capability
     nobody probes is a memory of one. And the honest limit: a sixth of the jobs are the founder's forever, and
     "everything" means the crew reaches everything it can measure and says so where it cannot.
- **Open:** the models per position by instrument; whether positions are five or six or seven once providers vary;
  how a pod is declared; what the crew does when a hand it needs does not exist (forge it, buy it, or ask).

### Wing 3 · The stores
*What the company is, when every process is dead.*
- **WATCH says:** ten stores; the Log is the only truth; the Book by surprise; the graveyard; the Lessons and
  reflexes; the Bench with licences; the Hands; the Second; the World Ledger; the Treasury and the refusal ledger.
  Files in git, one house repo and one per venture, blobs by hash off-machine.
- **Understand and decide:** every store's schema, writer, readers, and the check that fails when it drifts; the
  settle and consolidate write paths; retraction; erasure by hash; the transcripts as episodes; what the
  claim ledger, verdict binding, `DECISIONS.md` and the check suite become inside these stores (WATCH §29).
- **Open:** rent before anything has been loaded; the first fifty resolutions; store sizes, which WATCH gives as
  bounds and not measurements.

### Wing 4 · The drive
*What moves, what waits, and who opens a goal.*
- **WATCH says:** two atoms, bet and debt, never ranked; the keel and the weather; the escapement's four questions
  and the flip test; the lethality order; five postures; four openers; standing orders and night orders; the three
  governors; the ladder of method.
- **Understand and decide:** the bet and debt schemas; the standing-orders template; the escapement as an
  algorithm and where V and L come from; what a non-startup posture's critical path is; how the crew opens bets by
  inheritance and cannot wander; how relentlessness is a slot and not a mood.
- **Open:** the first week runs on the lethality order alone until a funnel instrument exists.

### Wing 5 · The boundary
*What may be done alone, and what never.*
- **WATCH says:** the Line in three classes over four currencies; the complete one-way list; six block from day
  one; the mouth with no model; the broker; the relay; the trifecta broken by positions; taint; the managed
  settings file; the security block, twelve Hard instruments; the sandbox as guardrail, not containment.
- **Understand and decide:** the mouth's instruction schema; the one-way list as data; the twelve instruments and
  their commands; the managed settings file's four lines; the reachability probe; the guard rewritten to match
  structured tool input; the checklists that live at the mouth.
- **Open:** the terms question on unattended operation; the hook rewrite is an irreversible-tier change.

### Wing 6 · The founder
*Their environment, their channel, their protection.*
- **WATCH says:** the desk, the bay, the room, the dailies; the terminal primary; voice as the originating channel,
  read back before it binds, never for approval; four verbs; the bell's five conditions; the emission budget; the
  72-hour heartbeat; the reverse seal; the capture check; the three-line health metric.
- **Understand and decide:** the desk item schema; the strip schema and the bay's geometry; the room's feeds; the
  dailies' order; the STOP file; how the phone surface is delivered; where the voice transcript lands.
- **Open:** whether the room is worth building before the bay is proven; the client's own dailies for Serve.

### Wing 7 · The fleet and the outside
*Many projects, one founder, one window; and how the world enters.*
- **WATCH says:** the house; at most three ventures making; the reserve; weekly arithmetic allocation; shared and
  never shared; one reputation; intake and harvest; succession; the door with seven tests; the first ten of the
  177; taint; ninety-day expiry; take mechanisms, never runtimes.
- **Understand and decide:** the intake template for a new idea **and the adoption intake for a project that
  already exists**, which is the one this founder will use most; `house.yml`; the harvest; the succession
  handover; the catalogue re-verified against licences before any admission; which skills of the 134 re-enter,
  which is a measured output.
- **Open:** a second human; disclosure of machine-made work; the legal entity per venture.

### Wing 8 · The whole, seen from outside
*What it is, and what it is not.*
- **WATCH says:** a crew, not a harness and not an org chart; the inversion in one sentence; twelve laws; why
  nobody has seen it; what it would take, in three buckets; what is genuinely unsolved.
- **Understand and decide:** the architecture drawn as surfaces, parts, wings and branches, with every arrow
  named by what travels on it (a condensate, a difficulty, a finding, a strip, a signed instruction, a leaf). The
  boundary of the system: what is inside the crew, what is a provider, what is the world, what is the founder.
  Where the previous harness's truth layer sits inside it. And the places where the next team sees further than
  WATCH: say so, decide, keep the losing image.
- **Open:** the four points under the fourteen that WATCH lacks (below), and anything the next team finds that
  nobody in this building has named.

---

## The fourteen territories, in the Territory page's order

The finer grain. Each row: what WATCH answers · what the spec must pin · what is taken from outside · the open
question. WATCH's section numbers.

### 01 · Missions & drive → WATCH §6, §9
- **Answer.** Two atoms, the bet and the debt, never ranked. The keel and the weather. The escapement: four
  questions in fixed order, the flip test, the lethality order. Five postures. Four openers. Standing orders and
  night orders.
- **Pin.** The bet and debt record schemas. `standing-orders.md` template: posture, appetite, ceiling, reserve,
  the Line's additions, call-me-if, do-not-wake, the stop sentence, the keel's definition of done, emission budget,
  standing refusals with reopen triggers. `night-orders/` format and its dawn scoring. `keel.md`. The escapement
  written as an algorithm with the flip arithmetic. The lethality order as data the founder reorders in a
  sentence. The three governors: stall detector, repetition hash, aberrance halt. The ladder of method.
- **Take.** `beads` for the ready set · `projectmem` for the pre-action gate · `restate` for Walk's
  wait-at-the-assumption · `budget-guard.js` on disk becomes the stall detector.
- **Open.** Before a funnel instrument exists nothing supplies V and L. What is the critical path of a project
  that is not a startup?

### 02 · Workers & roster → WATCH §4, §6, §7 · Wing 2
- **Answer.** No roles, no personas, no agent files. Six positions. Cells of twelve minutes with a death
  condition. The pod. Four engines: the watch, the escapement, the Compiler, the relief.
- **Pin.** The argv per position and per provider. The cell lifecycle. The three upward shapes. **Where
  personality lives:** not in an agent. A persona is a conditioning bought from the divergence budget, a framing,
  an exemplar set, a constraint, a model family, scored by the diversity it buys and how often its candidates
  survive contact, decaying like a licence. The best personalities are a list the machine writes from outcomes.
- **Take.** `container-use` · `claude-code-router` · the board's de-anchored framings as conditioning sets.
- **Open.** Model per position by instrument. How a pod is declared and budgeted.

### 03 · Hands → WATCH §16, §21 · Wing 2
- **Answer.** One door, seven tests, for a repository, a skill, a CLI, an MCP server alike. Day, night, never.
  Taint. The mouth, the broker, the relay. The current grant surface is the wrong shape.
- **Pin.** `hands/<name>.yml`: exposure class, credential scope, rate ceiling, undo or delay, drill date,
  day|night|never, `reconciles_to`. The first hands are read-only instruments: git host, CI runner, analytics,
  error tracking, billing read-only, the mail log. The disconnect list. `claude mcp list` every watch, a failure
  treated as damage. The guard on structured tool input. The browser as a day hand only.
- **Take.** `posthog` + `growthbook` · `trufflehog` · `litellm` · `agentapi` · `humanlayer`'s durable approval ·
  the `ALLOW | DENY | ASK` guardrail signature.
- **Open.** The ~15 connected servers against door test 1.

### 04 · Knowledge → WATCH §11, §8, §19
- **Answer.** Learn to judge the field before producing in it. Borrow instruments first. The apprenticeship:
  200 exemplars, ground truth and its latency, a discriminator, held-out AUC, then generate. Reflexes compiled at
  the third sighting with a test. The 134 skills into a holding directory; re-entry through the door. Method
  forbidden where the judge is strong, mandatory where it is absent and the act is one-way.
- **Pin.** `bench/<licence>/`. The borrowed-instruments table per field. `field-map.yml`. The apprenticeship as a
  runnable procedure with its exemplar store. The reflex format. The dozen checklists at the mouth. **The number
  of skills is an output**, counted.
- **Take.** `promptfoo` · `inspect_ai` · the skills catalogue and the 177 repos mined for exemplar sets and
  instruments, never for procedure · verbalised sampling.
- **Open.** Where 200 exemplars per field come from legally.

### 05 · Memory → WATCH §8 · Wing 3
- **Answer.** Ten stores. The Log is the only truth. The Book by surprise, bi-temporal, deltas, rent into
  compost. The graveyard. Lessons by five fixed questions. The Second with two scoreboards and the audit of
  silence. The World Ledger. The Treasury. Erasure by hash.
- **Pin.** The Log row. The belief, obituary, lesson and disposition schemas. The reconciliation table with a
  tolerance band per instrument. The settle and consolidate write paths. Retraction. A snapshot per watch. The
  transcripts as episodes.
- **Take.** `graphiti` · `mem0`'s add/update/delete/no-op · the transcript parsers · `sqlite-vec` · `letta`'s
  sleep-time result.
- **Open.** Rent before anything has been loaded; the first fifty resolutions.

### 06 · Communication → WATCH §6, §14
- **Answer.** A star, never a mesh. Three shapes upward: condensate, difficulty, finding. Read back before it
  binds. The relief: preview, brief, read-back, sign-off. No channel between ventures. One voice to the founder.
- **Pin.** The three shapes as schemas. The relief brief's four sections and byte cap. The read-back check. The
  probe that asserts the messaging token is absent from a maker's environment.
- **Take.** A2A's `input-required` state · I-PASS.
- **Open.** A dispatched child binds an inbox socket unless `--bare`; `--bare` loses OAuth; an API key answers it.

### 07 · Context & cost → WATCH §10, §22
- **Answer.** Context compiled: trunk, inheritance, delta keyed on the judge. The Compiler scored. Condensates.
  Tick 240 seconds. Positions closed because tool definitions are in the cached prefix. The cost formula's
  dominant term. Ten measured moves before any estimate. Batch off the founder's clock. The rope.
- **Pin.** The trunk's contents and the rule that it never carries a timestamp. The delta recipe. The counter per
  item. The meter joined by the id. The rope's thresholds and the routing table.
- **Take.** `ccusage` · OpenHands' condenser · Generative Agents' retrieval formula.
- **Open.** The cache-hit rate is the number nobody has.

### 08 · Quality & truth → WATCH §20, §11, §19
- **Answer.** Contact first. Every gate deterministic or not a gate. Judges find, never score: pairwise, blind,
  order-swapped, a different family. The evidence ladder generated from the instrument. Red bets. Seventeen
  checks. The three-line health metric. Calibration suppressed below fifty.
- **Pin.** The rung to record mapping. The judge protocol. The selection function over findings; all fatal
  resolves `unresolved`. `design.js` corrected. The monthly resolved-or-redefined report.
- **Take.** `inspect_ai` · `promptfoo` · `ShinkaEvolve`'s novelty filter.
- **Open.** No second family reachable yet; the router's first job is to prove the route changed family.

### 09 · Control & safety → WATCH §7, §21, §18 · Wing 5
- **Answer.** The Line in three classes over four currencies. The complete one-way list. Six block from day one.
  The mouth holds no model. The trifecta broken by positions. Taint. The managed settings file. Twelve security
  instruments.
- **Pin.** The one-way list as data. The mouth's instruction schema. The broker. The managed settings file. The
  reachability probe. The twelve instruments and their commands. The checklists.
- **Take.** `cerbos`' policy tests · `garak` · `trufflehog` · `sandbox-runtime`'s source.
- **Open.** The terms question. The hook rewrite is irreversible-tier.

### 10 · Surfaces → WATCH §13 · Wing 6
- **Answer.** The desk, the bay, the room, the dailies. The terminal primary. Voice as the originating channel.
  Four verbs. Five bell conditions.
- **Pin.** The desk item schema. The strip schema and the bay's geometry. The room's feeds. The dailies' order.
  The STOP file. The emission budget. The phone as a thin mirror.
- **Take.** Mission control's typed event log and SSE as the bay's feed · the strip board · `agentapi`.
- **Open.** How the phone surface is delivered; where the voice transcript lands.

### 11 · Runtime → WATCH §14, §17 · Wing 1
- **Answer.** The watch: five hours, five a day, odd. Crash-only. A LaunchDaemon supervisor with a restart ceiling
  and a process-group kill. Files in git, blobs by hash off-machine, `F_FULLFSYNC` on the Log. The disaster plan is
  a credential plan, drilled. The Mac now; the mouth and the Log on an always-on box as the target.
- **Pin.** The plists and the supervisor. The storage tree. The mirror and the snapshot. The drill programme. The
  one escalated command.
- **Take.** `dbos-transact` for the Continuo only · the launchd and macOS facts.
- **Open.** API key or subscription; when the always-on box arrives; every provider's own runtime facts.

### 12 · Self-improvement → WATCH §19, §20, §11
- **Answer.** Forge one instrument per watch. A change to WATCH must beat its own history. Lessons compile into
  reflexes. The fifth, debited first. Divergence purchased with conditioning. The map. The refusal ledger. The
  boredom detector.
- **Pin.** The forge's selection rule. The held-out history set. The fifth's accounting. The divergence budget as
  a line item. The map's axes. The refusal ledger and the weekly top ten.
- **Take.** `pyribs` · `gepa` · `openevolve`'s islands · verbalised sampling.
- **Open.** Who writes an instrument's fooling-mode sentence; how the founder forks a new instrument before it is
  trusted.

### 13 · Economics → WATCH §12, §22
- **Answer.** The window is the scarce thing. A reserve. At most three ventures making. Weekly arithmetic
  allocation. The harness's share capped. Cost per surviving artifact undefined when it is undefined.
- **Pin.** `house.yml`. The weekly printout. The rope. The founder's hour, priced.
- **Take.** `ccusage` · `litellm`.
- **Open.** The API key decision and the terms question, the founder's.

### 14 · The company itself → WATCH §12, §18, §23 · Wing 7
- **Answer.** Intake is a figure, one goal and the stop sentence. The offer is a signed file. Wind-down by harvest.
  Shared and never shared. Succession. The field map.
- **Pin.** The intake template and the adoption intake. `offer.md`. The `continuo.yml` seed. `people.yml`. The
  harvest. The succession handover. `field-map.yml` with every job.
- **Take.** The venture-studio structure · `openevolve`'s islands for quarantine.
- **Open.** A second human. Disclosure of machine-made work. The legal entity per venture.

---

## Under the fourteen: what the Territory page added, checked against WATCH

The twelve things never named are all answered. Of the six additions, attention as a budget, provenance from day
one and continuity when away are in. **Four are missing and belong in the spec:**

1. **Rehearsal, a dress run of a whole mission.** WATCH dry-runs each hand and drills each undo; nothing runs a
   whole mission end to end against fixtures before spending the hours. **The shadow venture:** a synthetic venture
   with fixtures that every change to the system must run through before it lands, which is also the test bed Law
   10 needs, and a rehearsal mode before a Serve engagement.
2. **The world's clock.** WATCH has a do-not-wake list for the founder and none for the world. **A world clock on
   the mouth:** the delay queue holds every outbound act until the recipient's local working hours.
3. **The company's own changelog.** Nothing answers *what did this company produce this month*. **The ship log:**
   one line per rung movement and per keel finished, in the founder's currency.
4. **Regression detection on the machine's own quality.** The aberrance halt is rate-based. **Control charts** over
   every instrument's pass rate per position and model.

Of the nine "nobody has built these": the transcript server, capability registry, cost-and-worth join,
negative-knowledge store and cross-mission scheduling are organs of WATCH; worker trust and the blackboard are
refused; regression detection is item 4. The six recorded refusals hold.

## New, open-minded, for the founder to keep or drop

- **Adopting an existing project**: the intake this founder will actually use most (Wing 7).
- **Exemplars, not skills, as the unit of imported knowledge.**
- **Personality as purchased conditioning**, measured by survival on contact.
- **The client's own dailies** for a Serve venture.
- **The founder's own weekly seal** against the machine's, both curves shown.
- **The provider layer as a wing of its own** (Wing 1), which no prior round designed.

## Files

```
docs/03-system-design/envision/02-SPEC-MAP.md            this file
docs/03-system-design/envision/2026-09-02-THE-SYSTEM.md    WATCH, the frame · §29 the fates · §25 what it would take (not a schedule here)
docs/03-system-design/envision/00-BRIEF.md                 the founder's words, the method
docs/02-competitive/expansion/                            the catalogue: open-source.md (177) · hands.md · concepts.md · 00-TERRITORY.md
docs/03-system-design/review/2026-09-02-FABLE-REPORT.md    the measurements of this runtime
page: The Spec Map c1839105… · The Territory 9c8caa91… · WATCH 512afcce…
```
