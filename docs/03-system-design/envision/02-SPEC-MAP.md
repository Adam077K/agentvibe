# The spec map · how WATCH becomes a spec, in the Territory's order · 2026-09-03

**What this is.** The founder asked: in which steps do we spec and understand the actual system: the memory, the
files, the projects taken from outside, the agents, the tools and MCPs, the engines and mechanisms, the
personalities, the skills and their number, the learning of a field; ordered by the Territory page's fourteen
sections; the points under them that were missed; and new ideas. This file is that plan. It is read by session 5
before the spec is written. WATCH (`2026-09-02-THE-SYSTEM.md`) is the frame; the section numbers below are WATCH's.

## The steps

| Step | What lands | Method | Founder |
|---|---|---|---|
| **A · The parts list** | One table: every organ of WATCH → the file(s) it lives in → the one writer → the readers → the check that fails when it drifts. From §4, §17, §29. This is the skeleton every territory hangs on | one Fable lane, ~1 hour; a read-only census subagent verifies every path it names exists or is marked absent | reads one page; decides nothing yet |
| **B · Territories 1–7, the inside** | Missions & drive · Workers & roster · Hands · Knowledge · Memory · Communication · Context & cost — each pinned as below: schemas, algorithms, the outside parts taken, the open question | one Fable lane per group of territories; each territory keeps v2's discipline (at full scale · components · enforced by · year one · growth path · would have to be true · grafted from) and WATCH's rule that no stage states method | reads the page; answers the open questions with a tap |
| **C · Territories 8–14, the edges, and the missed points** | Quality & truth · Control & safety · Surfaces · Runtime · Self-improvement · Economics · The company itself — plus the four points under the fourteen that WATCH does not yet have (below) and adoption of an existing project | same | same |
| **D · The build order** | §25 as a checklist: weeks one to four (a hundred-line loop and six files), then each stage gated on one real mission having run through the thing before it; the ten measured moves first | Fable, short | the four founder-only items: the API key and the terms question · the managed settings file · the credential plan · a second human |
| **E · The review** | Two sealed Opus reviewers and one Fable judge over the spec: every named path exists or says it does not; no stage states method; every part names its caller; every rule names what fails | the Fable review method of 2026-09-02 | reads the verdict |

Each step ends with a page and a commit on the branch. A step that runs into the five-hour limit resumes by name.

## The fourteen, in the Territory's order

Each row: what WATCH answers · what the spec must pin · what is taken from outside · the open question.

### 01 · Missions & drive → WATCH §6, §9
- **Answer.** Two atoms, the bet and the debt, never ranked. The keel (one thing under construction, never
  forked) and the weather (everything else, forked wide, selected by contact). The escapement: four questions in
  fixed order, the flip test, the lethality order. Five postures. Four openers: founder, crew by inheritance,
  world, clock. Standing orders and night orders.
- **Pin.** The bet and debt record schemas (WATCH's field table). `standing-orders.md` template: posture, appetite,
  ceiling, reserve, the Line's additions, call-me-if, do-not-wake, the stop sentence, the keel's definition of
  done, emission budget, standing refusals with reopen triggers. `night-orders/` format and its dawn scoring.
  `keel.md`. The escapement written as an algorithm with the flip arithmetic and where V and L come from. The
  lethality order as data the founder can reorder in a sentence. The three governors: stall detector, repetition
  hash, aberrance halt. The blocked / stalled / stuck ladder of method.
- **Take.** `beads` for the ready set · `projectmem` for the pre-action gate against dead ends · `restate` for
  Walk's wait-at-the-assumption · `budget-guard.js` on disk becomes the stall detector.
- **Open.** On day one nothing supplies V and L; a crude funnel instrument must exist before the flip test can run,
  so what runs the first week is the lethality order alone. And what is the critical path of a project that is not
  a startup (Serve, research)?

### 02 · Workers & roster → WATCH §4, §6, §7
- **Answer.** No roles, no personas, no agent files. Six positions: maker, lookout, looker, judge, mouth,
  broker-and-relay. Cells of about twelve minutes with a death condition and a checkpoint. The pod as the one
  named exception. Four engines: the watch, the escapement, the Compiler, the relief.
- **Pin.** The argv per position, measured: `--restricted --tools <list> --strict-mcp-config --permission-mode
  dontAsk` under a managed settings file, and what each position's list is. The cell lifecycle. The three upward
  shapes (condensate, difficulty, finding). **Where personality lives:** not in an agent. A persona is a
  *conditioning* bought from the divergence budget (§19): a framing, an exemplar set, a constraint, a model
  family. Each is scored by the diversity it buys and by how often its candidates survive contact, per field, and
  it decays like a licence. The best personalities are the ones whose candidates keep surviving, and the list is
  measured, never written.
- **Take.** `container-use` for the isolation the worktree protocol only assumes · `claude-code-router` for a
  judge from a second family · the board's de-anchored framings as conditioning sets, not personas.
- **Open.** Model per position by instrument (the cheapest model that ever passes a Hard judge); how a pod is
  declared and budgeted.

### 03 · Hands → WATCH §16, §21
- **Answer.** One door, seven tests, for a repository, a skill, a CLI, an MCP server alike. Day hand, night
  hand, never. The Hands store. Taint: a cell that read outside content loses the hands that act. The mouth, the
  broker, the relay. The current grant surface is the wrong shape: publish, send, share, remote exec and the
  authenticated browser are connected; analytics, error tracking and a read-only billing key are not.
- **Pin.** `hands/<name>.yml`: exposure class, credential scope, rate ceiling, undo or delay, drill date,
  day|night|never, `reconciles_to`. The first hands, all read-only instruments: the git host, the CI runner,
  analytics, error tracking, billing read-only, the mail delivery log. The disconnect list until each passes the
  door. `claude mcp list` every watch, a failure treated as damage. The guard rewritten to match structured tool
  input, never a command string. The browser as a day hand only, never sharing a grant.
- **Take.** `posthog` + `growthbook` · `trufflehog` · `litellm` per-key budgets · `agentapi` to steer a running
  thing · `humanlayer`'s approval as a durable object · the `ALLOW | DENY | ASK` guardrail signature, the one to
  copy most carefully.
- **Open.** A census of the ~15 connected servers against door test 1: expect most to fail on "declare a rate".

### 04 · Knowledge → WATCH §11, §8, §19
- **Answer.** Learn to judge the field before producing in it. Borrow instruments first: the world gives away
  broken-detectors in every field and almost no good-detectors. The apprenticeship: 200 exemplars, the ground
  truth and its latency, a discriminator, held-out AUC, only then generate. Licences public. Reflexes compiled
  from lessons at the third sighting, each with a test, re-run monthly, the one store that shrinks. The 134
  skills go to a holding directory nothing reads and re-enter one at a time through the door. Method is
  forbidden where the judge is strong and mandatory where it is absent and the act is one-way.
- **Pin.** `bench/<licence>/` schema. The borrowed-instruments table per field, as data. `field-map.yml`. The
  apprenticeship as a runnable procedure with its exemplar store. The reflex format: trigger, test, expiry. The
  dozen checklists at the mouth. **The number of skills is an output**: whatever paid rent this month, counted;
  M1's bet is fewer than fifteen of the 134.
- **Take.** `promptfoo`'s assertion taxonomy · `inspect_ai`'s scorers · **the skills catalogue and the 177 repos
  mined for exemplar sets and instruments, never for procedure** · verbalised sampling.
- **Open.** Where 200 exemplars per field come from legally (licence, terms of the source).

### 05 · Memory → WATCH §8
- **Answer.** Ten stores. The Log is the only truth; everything else is a rebuildable cache of it. The Book,
  written only by surprise, bi-temporal, deltas never rewrites, rent into compost. The graveyard with reproducing
  commands and reopen triggers, read before any bet opens. Lessons by five fixed questions over a failed trace,
  never "what did you learn". The Second: a readable document, two scoreboards, the audit of silence. The World
  Ledger against records the house does not write. The Treasury with estimate beside actual. Erasure by hash.
- **Pin.** The Log row: id minted at dispatch, venture, bet or debt, cell, position, cost, blob hashes. The
  belief, obituary, lesson and disposition schemas. The reconciliation table with a tolerance band per
  instrument. The settle and consolidate write paths and who may run them. Retraction as a procedure. A snapshot
  per watch and the scheduled rebuild. Ingestion of the 2,936 transcripts as episodes.
- **Take.** `graphiti` for bi-temporal facts · `mem0`'s add/update/delete/no-op as the shape of a belief write ·
  the transcript parsers · `sqlite-vec` for the one place embeddings are needed · `letta`'s sleep-time result as
  the consolidate phase's justification.
- **Open.** What rent counts before anything has been loaded; the first fifty resolutions before any calibration
  is shown.

### 06 · Communication → WATCH §6, §14
- **Answer.** A star, never a mesh. Cells do not talk. Three shapes travel upward: condensate, difficulty,
  finding. Everything is read back in the receiver's words before it binds. The relief: preview, brief,
  read-back, sign-off, with the outgoing watch auditing the incoming one. No channel between ventures. One voice
  to the founder.
- **Pin.** The three shapes as schemas. The relief brief's four sections and its byte cap. The read-back check
  and what a divergence writes. The probe that asserts the messaging token is absent from a maker's environment.
- **Take.** A2A's `input-required` state, which alone is blocked versus stalled · I-PASS.
- **Open.** A dispatched child binds an inbox socket unless `--bare`, and `--bare` loses OAuth; an API key
  answers it.

### 07 · Context & cost → WATCH §10, §22
- **Answer.** Context is compiled: the trunk (byte-identical, cache-warm), the inheritance (copy-on-write from the
  parent), the delta keyed on the judge. The Compiler says what it left out and is scored. Condensates, never
  transcripts. The tick is 240 seconds. Positions are a closed set because tool definitions are part of the
  cached prefix. The cost formula's dominant term is whether siblings hit the cache. Ten measured moves before any
  estimate. Batch for everything off the founder's clock. The rope stops starting, never landing.
- **Pin.** What the trunk holds and the rule that it never carries a timestamp. The delta recipe in order. The
  counter per item. The meter: the runner's reported cost joined by the id. The rope's thresholds and the
  model-by-instrument routing table. The Treasury schema.
- **Take.** `ccusage` · OpenHands' condenser · Generative Agents' retrieval formula.
- **Open.** The cache-hit rate is the number nobody has. Week one measures it.

### 08 · Quality & truth → WATCH §20, §11, §19
- **Answer.** Contact first. Every gate deterministic or it is not a gate. Judges find, never score: pairwise,
  blind, order-swapped, a different model family. The evidence ladder generated from the instrument, never typed.
  Red bets. Seventeen checks. Three-line health metric with the capture floor. Calibration suppressed below fifty
  resolutions; resolved-on-time-without-redefinition reported monthly.
- **Pin.** The rung → record mapping. The judge protocol. The selection function over findings (a fatal finding
  eliminates; fewer serious; then map distance; all fatal resolves `unresolved`, never least-bad). `design.js`
  corrected to stop summing scores. The monthly resolved/redefined report.
- **Take.** `inspect_ai` · `promptfoo` · `ShinkaEvolve`'s novelty filter.
- **Open.** No second family is reachable today; the router's first job is to prove the route changed family.

### 09 · Control & safety → WATCH §7, §21, §18
- **Answer.** The Line: three classes over four currencies; reversible drills the undo, compensable drills the
  delay, one-way is the founder's at any score. The complete one-way list, ending with a kill decision. Six block
  from day one. The mouth holds no model. The trifecta broken by positions. Taint. The managed settings file is
  the only tier a running process cannot clear, and it does not exist yet. The security block, twelve Hard
  instruments, wired on Monday before there is a product.
- **Pin.** The one-way list as data. The mouth's instruction schema: one act, one recipient, one payload hash,
  the ceiling checked independently. The broker. The managed settings file text, four lines. The reachability
  probe. The twelve security instruments and their commands. The checklists.
- **Take.** `cerbos`' policy test format · `garak`'s probe and detector separation · `trufflehog` ·
  `sandbox-runtime`'s source for the two unexplained failures.
- **Open.** The terms question, the founder's. The hook rewrite to structured input is an irreversible-tier change
  to `.claude/hooks`.

### 10 · Surfaces → WATCH §13
- **Answer.** The desk (phone, decisions only, six fields per item, defaults only for reversible drilled items,
  the 72-hour heartbeat). The bay (Mac, a strip board, geometry carries state, a strip needing you is cocked
  out). The room (second monitor, the honest office simulation, never a control surface). The dailies (the raw
  work at your hour). The terminal stays primary input. Voice is the originating channel, read back before it
  binds, never for approval. Four verbs: look, say, choose, stop. Five conditions ring the bell.
- **Pin.** The desk item schema. The strip schema and the bay's geometry. The room's feeds: cells as lights,
  the map, the river, the replay. The dailies' fixed order. The STOP file. The emission budget. The phone as a
  thin mirror: a rendered page, which is the founder's measured channel.
- **Take.** Mission control's typed event log and SSE as the bay's feed · the strip board · `agentapi`.
- **Open.** How the phone surface is delivered (a page opened from a message is the honest default); the voice
  transcription path and where the verbatim lands.

### 11 · Runtime → WATCH §14, §17
- **Answer.** The watch: five hours, five a day, the count odd. Crash-only. A LaunchDaemon supervisor with a
  restart ceiling and a process-group kill. Tick 240 seconds. Files in git, one house repo, one per venture, the
  Log as truth, blobs by hash off-machine, `F_FULLFSYNC` on the Log. What no backup restores is credentials, so the
  disaster plan is a credential plan. Drills monthly and half-yearly. Day one on this Mac; the target is the
  mouth and the Log on an always-on box with the Mac as a client.
- **Pin.** The plists and the supervisor. The storage tree as written in §17. The mirror and the encrypted
  snapshot. The drill programme with its two cadences. The one escalated command (`git worktree add`), named and
  logged.
- **Take.** `dbos-transact` for the Continuo only · the launchd and macOS durability facts.
- **Open.** API key or subscription decides which constraint binds. When the always-on box arrives.

### 12 · Self-improvement → WATCH §19, §20, §11
- **Answer.** Forge one instrument per watch, the one blocking the most founder-minutes. A change to WATCH must
  beat its own history. Lessons compile into reflexes. The fifth, debited before the allocator sees it. Divergence
  is purchased with conditioning, not sampled. The map, not a leaderboard. The refusal ledger gives every stop a
  price. The boredom detector.
- **Pin.** The forge's selection rule. The held-out history set and how a change is scored against it. The
  fifth's accounting line. The divergence budget as a line item. The map's axes per venture. The refusal ledger
  schema and the weekly top ten.
- **Take.** `pyribs` · `gepa`'s Pareto archive · `openevolve`'s islands · verbalised sampling.
- **Open.** Who writes an instrument's fooling-mode sentence; how the founder forks a new instrument before it is
  trusted.

### 13 · Economics → WATCH §12, §22
- **Answer.** The window is the scarce thing, not the money. A reserve nothing may spend into. At most three
  ventures in a making posture. Weekly arithmetic allocation: a floor, then rung movement, money at half-Kelly.
  The harness's own share is capped. Two weekly numbers that must fall, and cost per surviving artifact reported
  as undefined when it is undefined.
- **Pin.** `house.yml` allocation fields. The weekly allocation printout. The rope. The founder's hour, priced
  from the drop list.
- **Take.** `ccusage` · `litellm` budgets.
- **Open.** The API key decision and the terms question, both the founder's.

### 14 · The company itself → WATCH §12, §18, §23, §24
- **Answer.** Intake is a figure, one goal and the stop sentence; the graveyard read first. The offer is a signed
  file. Wind-down by harvest, never deletion. Shared: the Bench, the Second, the reflexes, world beliefs. Never
  shared: customer data, credentials, market beliefs, identity and voice, anything a client owns. The reputation
  is one thing. Succession. The field map: half the jobs already checkable, a third slow, a sixth the founder's.
- **Pin.** The intake template (the fleet installer repurposed). `offer.md`. The `continuo.yml` seed with the
  statutory debts. `people.yml`. The harvest procedure. The succession handover. `field-map.yml` with every job,
  its class, its ground truth, its exposure, its grade today.
- **Take.** The venture-studio structure · `openevolve`'s islands for quarantine.
- **Open.** A second human. Disclosure of machine-made work, a founder decision with a date. The legal entity per
  venture.

## The points under the fourteen that WATCH does not have yet

The Territory page carried six additions beneath the fourteen, twelve things never named, and nine things nobody
has built. Checked against WATCH: the twelve are all answered (the door and the connected-server check, the Log
ingesting the transcripts, the escapement, tapping a strip to steer, the Reactive class and the World Ledger,
blocked versus stalled, the graveyard, exposure on the hand, voice, licences instead of worker trust, the
ninety-day expiry, the wake as lineage). Of the six additions, attention as a budget, provenance from day one and
continuity when away are in. **Four are missing, and go into step C:**

1. **Rehearsal: a dress run of a whole mission.** WATCH dry-runs each hand and drills each undo; nothing runs a
   whole mission end to end against fixtures before spending the four hours. Add **the shadow venture**: a
   synthetic venture with fixtures that every change to WATCH must run through before it lands, which is also the
   test bed Law 10 needs, and a rehearsal mode for a Serve engagement before real work starts.
2. **The world's clock.** WATCH has a do-not-wake list for the founder and none for the world: publishing, emailing
   a customer or messaging a stranger at 03:14 is technically fine and none of it is fine. Add a **world clock on
   the mouth**: the delay queue holds every outbound act until the recipient's local working hours, per hand, per
   region.
3. **The company's own changelog.** WATCH has changelog coverage as a Hard instrument and the dailies, and no
   artifact that answers *what did this company produce this month*. Add **the ship log**: one line per rung
   movement and per keel finished, in the founder's currency, monthly, distinct from decisions and from work.
4. **Regression detection on the machine's own quality.** WATCH's aberrance halt is rate-based. Add **control
   charts** over every instrument's pass rate per position and model, so a quiet degradation from a model update
   or prompt drift shows as a signal rather than as a feeling.

Of the nine "nobody has built these": the transcript server, capability registry, cost-and-worth join,
negative-knowledge store and cross-mission scheduling are organs of WATCH now; worker trust and the blackboard are
refused by design; statistical regression detection is item 4 above. The six refusals recorded on the Territory
page all hold in WATCH.

## New ideas, open-minded, for the founder to keep or drop

- **Adopting an existing project.** WATCH's first week is for a founder with only an idea. Most of this founder's
  projects already exist. Add an **adoption intake**: read the repository, derive the Book from its history and
  its commits, mine its dead ends into the graveyard, list its debts, set its posture, and only then open the first
  bet. This is the intake the fleet will actually use most.
- **Exemplars, not skills, as the unit of imported knowledge.** The 134 skills and the 177 repositories are mined
  for exemplar sets and instruments. A procedure is never imported; a reflex is compiled here, with a test.
- **Personality as purchased conditioning**, measured by survival on contact and decaying like a licence, as in
  territory 02 above. This is where the "best personalities" question lands: there is a list, and the machine
  writes it from outcomes.
- **The client's own dailies** for a Serve venture: the raw work, at the client's hour, read-only, so showing your
  work is an artifact and not a meeting.
- **A weekly one-line forecast the founder can bet against**: WATCH already seals its predictions; let the founder
  seal theirs on the same forks once a week, and show both curves. The reverse seal made scoreable.

## Files

```
docs/03-system-design/envision/02-SPEC-MAP.md          this file
docs/03-system-design/envision/2026-09-02-THE-SYSTEM.md  WATCH, the frame; §29 the migration table, §25 the build order
docs/02-competitive/expansion/                          the catalogue: open-source.md (177) · hands.md · concepts.md · 00-TERRITORY.md
page: The Spec Map c1839105… · The Territory 9c8caa91… · WATCH 512afcce…
```
