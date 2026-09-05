# Coverage v2 — every item of the founder's list, placed against the v2 plan

*What this is: the founder's checklist (35 sections · 9 wings · 2 closing blocks · **671 items**) placed, item by item, against the v2 plan. It applies decisions already taken in SPINE.md; it makes none of its own. Where SPINE §A moved the ground under a FINAL disposition, the row is re-decided and the rule column says which row moved it.*

*Inputs, in binding order: **SPINE.md** (this branch, `final-v2/`) — §A decides, §B.4 places the departments §23–§30, §D the surfaces, §E skills, §F tools, §G models, §H the runtimes, §K the section numbers · the founder's list verbatim, `round-5/FOUNDER-LIST.md` (branch `ceo-1-1788468144`) · the previous placement, `final/COVERAGE.md` (branch `ceo-3-1788468144`), **read as a floor and not as a frame** · the research coverage tables in `final-v2/research/{cognition,memory,roster}.md`.*

*2026-09-05.*

**Dispositions.** `IN` the plan has it · `RENAMED` it exists as a different concept · `REFUSED` deliberately absent · `FOUNDER'S` only the founder can do it · `OUTSIDE` a venture's own work, not the harness's.

**Rule column.** `agree` FINAL and SPINE agree, so FINAL stands · `SPINE vN` a v2 decisions row settles it; where the settling text is a lettered section rather than a numbered row it is written `SPINE §B.4`, `SPINE §F` and so on · `founder` the founder's direction itself decides it · `fact` a research fact decides it · **`?` a placement this file could not settle from its inputs — the reviewer reads those first.**

**The `v2 §` column is SPINE §K's numbering, 0–23, not FINAL's.** The crosswalk, stated once so no row has to argue it: FINAL §2 → 2 · §3 → 4 (ranking) or 2 (intent structure) · §4 → 2 (charter, tempo), 4 (cross-venture ranking) or 14 (the portfolio view) · §5 → 9 (models) or 10 (Codex and Claude Code) · §6 → 6 · §7 → 5 (the roster) or 6 (the run) · §8 → 11 · §9 → 12 (envelope, permissions, the Sender) or 8 (the tool door) · §10 → 13 · §11 → 7 (skills) or 13 (knowledge) · §13 → 14 (mission control) or 15 (the Floor and the Mac) · §14 → 15 · §15 → 16 · §16 → 17 · §17 → 18 · §18 → 19 · §19 → 20 · §20 → 21.

**One structural note, because it costs the reviewer time otherwise: §K names no self-improvement section.** FINAL §12's items are placed by mechanism — the curator's nightly pass at 13, the rehearsal and eval loops at 11, forced expiry at 7 — and the two that fit none of those are marked `?`.

---

## 01 Missions & drive

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Mission statement format | RENAMED | RENAMED | 2 | the Charter, read by every run, not a document nobody re-reads | agree |
| North-star metric | REFUSED | REFUSED | 11 | one metric per venture invites optimising the proxy; done-tests measure | agree |
| Goal tree | RENAMED | RENAMED | 2 | intent then candidate work, two levels; an unpruned goal tree rots | agree |
| Sub-goal chain | RENAMED | RENAMED | 4 | candidate work under one intent, ranked by the Desk | agree |
| Move-level task | IN | IN | 6 | the Run is the move: one outcome, a ceiling, a handover, death | agree |
| Done-test criteria | IN | IN | 2 | written before work starts, and it is now also the `/goal` condition | SPINE v12 |
| Binding vs proposed goal | IN | IN | 2 | only the founder's door binds, and the read-back is what binds it | SPINE v29 |
| Priority queue | IN | IN | 4 | the Desk ranks; ties reach the founder as a which | agree |
| Goal window cap | IN | IN | 4 | a ceiling per intent, a WIP limit per venture, 20 concurrent subagents | SPINE v13 |
| Competing mechanisms | REFUSED | REFUSED | 1 | two mechanisms for one job is how two risk classifiers happened | agree |
| Opportunity detection | IN | IN | 2 | the watch door produces proposals, never work | agree |
| Unsolicited work policy | IN | IN | 2 | unsolicited work cannot become an intent; idle capacity buys knowledge | agree |
| Abandonment criteria | IN | IN | 2 | expiry on every intent, and the ceiling stops the run | agree |
| Wrong-goal detection | IN | IN | 6 | Impossible is one of `/goal`'s three verdicts and it terminates the loop | SPINE v12 |
| Blocked state | IN | IN | 6 | handover outcome blocked, naming what would clear it | agree |
| Stalled state | IN | IN | 4 | decay in the ranking; repeated blocks wake the founder | agree |
| Retry ladder | IN | IN | 6 | one rung: the same failure twice stops, and then the model escalates | SPINE v21 |
| Escalation ladder | IN | IN | 11 | the anchor ladder for truth, the door class for permission | agree |
| Pivot trigger | FOUNDER'S | FOUNDER'S | 2 | the system reports; changing an intent's purpose is the founder's | agree |
| Parking lot | IN | IN | 4 | the parked tempo, surfaced at the briefing | agree |
| Out-of-scope folder | RENAMED | RENAMED | 13 | the negatives store records the reason, which a folder does not | agree |
| Mission loop | IN | IN | 4 | the Watch, ticking and mostly sleeping; `/loop` is refused in production | SPINE v12 |
| Idle-time trigger | IN | IN | 4 | idle capacity buys knowledge, not work | agree |
| Recurring mission cadence | IN | IN | 2 | an intent that renews at its expiry | agree |
| Mission owner | IN | IN | 2 | the owner field on the intent | agree |
| Mission expiry date | IN | IN | 2 | expiry is mandatory, and one disposition is recorded when it comes due | agree |
| Mission dependency graph | RENAMED | RENAMED | 4 | a readiness boolean; a graph is more machinery than one founder needs | agree |
| Sunk-cost check | IN | IN | 16 | the stop rule excludes sunk cost explicitly | agree |
| Success probability estimate | REFUSED | REFUSED | 4 | the estimator is the interested party; measured cost replaces predicted value | agree |
| Goal conflict resolver | IN | IN | 4 | the Desk's ranking is the resolver | agree |

## 02 Workers & roster

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Agent registry | REFUSED | IN | 5 | fourteen agent files plus the Operator, each naming its model, tools, MCPs and skills | founder |
| Agent file | RENAMED | IN | 5 | one file per agent, in the frontmatter format the runtime already reads | founder |
| Engine count | RENAMED | RENAMED | 5 | fifteen named roles, not a count of shapes | SPINE v1 |
| maxTurns cap | IN | IN | 5 | `maxTurns` is per-agent frontmatter and binds when a dispatch names an agentType | fact |
| Fresh context window | IN | IN | 6 | every run starts from files, never from the last run's summary | agree |
| Agent naming scheme | RENAMED | IN | 5 | real names, one file each — zero of seven shipped rosters use unnamed shapes | SPINE v2 |
| Agent color tag | REFUSED | REFUSED | 14 | a terminal convenience; the office page identifies an agent by name and avatar | ? |
| Capability grant | IN | IN | 8 | the exact argv, composed by one no-model launcher and by nothing else | SPINE v34 |
| Capability revoke | IN | IN | 8 | automatic at horizon; the managed file is the tier a running process cannot clear | SPINE v11 |
| Persona council | REFUSED | REFUSED | 11 | a panel of personas is same-family review in costume | agree |
| Council quorum | REFUSED | REFUSED | 11 | no vote among models; the deterministic anchor wins | agree |
| Parallelism limit | IN | IN | 3 | 20 concurrent subagents, one team per session, and never two builders on one artifact | SPINE v6 |
| Pod assembly | RENAMED | RENAMED | 3 | an agent team: a lead plus named teammates, each a full independent session | SPINE v13 |
| Mission-scoped pod | RENAMED | RENAMED | 3 | the same team, formed per intent, and `/resume` does not restore it | SPINE v13 |
| Apprenticeship pattern | IN | IN | 11 | a move that fails rehearsal goes to the Floor, and that session becomes a case | agree |
| Planner-executor split | RENAMED | IN | 3 | the Operator dispatches and cannot build: no Write, no Edit, no Bash | founder |
| Cheap-tier executor | IN | RENAMED | 9 | no Haiku tier; Gemini's own window and local models on electricity carry it | SPINE v20 |
| Trust score | IN | IN | 11 | measured from anchored outcomes, never self-reported | agree |
| Worker retirement | IN | IN | 6 | the run dies at handover; the agent file persists and changes through the roster | SPINE v1 |
| Garbage-output handler | IN | IN | 11 | the anchor catches it and the run stops on defect | agree |
| Output validation gate | IN | IN | 11 | §B.2's anchor column is the gate, and it is per agent | SPINE v1 |
| Model-per-move policy | IN | IN | 9 | the agent's default, plus the named rules that change it for one move | founder |
| Model selector | RENAMED | RENAMED | 9 | a table of triggers, not a service | agree |
| Worker heartbeat | IN | IN | 4 | the Watch sees run state on each tick | agree |
| Worker health check | RENAMED | RENAMED | 4 | the same tick; there is no second check to disagree with it | agree |
| Worker spawn limit | IN | IN | 3 | depth 3, 20 concurrent, one team per session, no nested teams | fact |
| Worker cost cap | IN | IN | 16 | the per-run ceiling; `--max-budget-usd` is a stall fuse, not a billing control | SPINE v23 |
| Role definition | REFUSED | IN | 5 | fourteen jobs, each with the reason it exists and what proves its work | founder |
| Skill-to-role mapping | REFUSED | IN | 7 | each agent's row names the skill namespaces it carries | SPINE v3 |
| Onboarding checklist per agent | REFUSED | RENAMED | 5 | the agent file is the onboarding: job, lens, model, tools, skills, anchor | SPINE v2 |

## 03 Hands (tools & access)

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Read tool | IN | IN | 5 | all fifteen carry it; it is the only tool every agent has | SPINE v1 |
| Write tool | IN | IN | 5 | five of the fourteen carry no write of any kind | SPINE v1 |
| Edit tool | IN | IN | 5 | the same grant; reviewer, guard and challenger carry neither | SPINE v1 |
| Bash tool | IN | IN | 5 | eight of the fourteen carry no shell, and only four can touch source | SPINE v1 |
| Glob tool | IN | IN | 5 | part of the read-and-search grant every agent carries | agree |
| Grep tool | IN | IN | 5 | the same read-and-search grant | agree |
| Browser automation tool | IN | IN | 8 | Playwright headless is class READ-ONLY, held by the designer per run | agree |
| Authenticated browser session | IN | IN | 8 | a credentialled browser never runs on a path that reads untrusted content | agree |
| Publish tool | IN | IN | 12 | REACHES THE WORLD: no agent holds it, and the Sender holds no model | SPINE v33 |
| Sandbox exec | IN | IN | 12 | worktrees plus the armed OS sandbox — a guardrail against accident, not containment | agree |
| Virality predictor | REFUSED | REFUSED | 11 | a prediction with no anchor that would be believed anyway | agree |
| Email tool | IN | IN | 12 | the world's door reads the mail and `scout` handles it; `writer` drafts and only the Sender sends | SPINE v36 |
| Design tool integration | IN | IN | 8 | class WRITES-reversible: the designer, after the undo is drilled | agree |
| Prototype tool integration | IN | IN | 8 | the perception loop is a job, not a product; the tool passes the same door | agree |
| Review tool integration | IN | IN | 8 | admitted through the door as a read-only instrument | agree |
| Drawing tool integration | IN | IN | 8 | the same door, with a named intent behind it | agree |
| Two-scope auth | IN | IN | 8 | grants are scoped and expire; a stale scope surfaces in the briefing | agree |
| OAuth gap | IN | IN | 8 | Gemini has sat unauthenticated since it was installed, and it is open decision 6 | fact |
| Compute rental tool | IN | REFUSED | 8 | RunPod is refused as it stands: it spends money at a rate under an uncapped key | ? |
| Connection-closed error | IN | IN | 6 | handover outcome blocked; the Desk stops ranking work needing that tool | agree |
| Re-authentication queue | IN | IN | 8 | expired grants surface in the briefing rather than as a silent failure | agree |
| Pending grant approval | IN | IN | 8 | grants carry state and a horizon, and page 5 taps a store to its schema | SPINE v4 |
| Live grant status | IN | IN | 8 | the nightly probe asserts what a run can actually touch | SPINE v34 |
| Unconnected server count | REFUSED | REFUSED | 14 | a count of things not connected is not information, and every number must tap | SPINE v14 |
| Registry unreachable | IN | IN | 6 | it surfaces as blocked, which is the honest terminal value | agree |
| Non-MCP hands | IN | IN | 8 | one door admits CLIs, binaries and servers alike | agree |
| macOS binary tools | IN | IN | 15 | the same door; tmux's own CLI is the terminal-pop mechanism | SPINE §D.1 |
| Ad platform read access | IN | IN | 8 | an ads read is on the wish list, and a read comes before any write | SPINE §F |
| Ad platform write access | IN | IN | 12 | spending money outward REACHES THE WORLD | agree |
| Spend rate limit | IN | IN | 12 | ceilings enforced pre-action, in rate as well as amount | agree |
| Deploy tool | IN | IN | 12 | deploy blocks from day one, because `git revert` does not undo it | agree |
| Database tool | IN | IN | 8 | a read replica per venture is on the wish list; a migration is the architect's anchor | SPINE §F |
| Payments tool | IN | IN | 8 | a payments read API is the wish list's first entry: §16 has no source of truth without one | SPINE §F |
| Missing payments MCP | REFUSED | RENAMED | 8 | not having it is a safety property and a named gap at the same time | SPINE §F |
| Tool allowlist | IN | IN | 8 | `--restricted` plus an explicit `--tools`, composed by the launcher | SPINE v34 |
| Tool denylist | IN | IN | 12 | `permissions.deny` in the managed file, which binds in every mode including bypass | SPINE v10 |
| Tool discovery protocol | REFUSED | REFUSED | 8 | automatic discovery is how fifteen servers got connected by clicking | agree |
| Tool version pinning | IN | IN | 8 | pinned, with description hashes checked every session | agree |
| Tool audit log | IN | IN | 14 | the event log with `gen_ai.*` attribute names and an id on every row | agree |
| Tool sandbox isolation | IN | IN | 12 | worktrees, the OS sandbox, and the trifecta split | agree |
| Tool timeout policy | IN | IN | 6 | the wall-clock half of the run's ceiling | agree |

## 04 Knowledge

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Skill count | RENAMED | IN | 7 | a library in the open standard; the count is an output of admission, not a target | founder |
| Two-tier skill router | REFUSED | IN | 7 | the standard's own progressive disclosure: description at startup, body on relevance | SPINE v3 |
| Skill lookup cost | REFUSED | IN | 7 | ~100 tokens of metadata per installed skill at startup is a published limit and a real budget | fact |
| Domain lens | RENAMED | IN | 5 | the expertise lens is a column of the roster, one per agent | SPINE v1 |
| Review lens | RENAMED | RENAMED | 11 | the named dimension a reviewer judges against | agree |
| Content linting | IN | IN | 11 | links resolve and facts trace to a fetched source | agree |
| Curation manifest | REFUSED | IN | 7 | admission by eval writes the record, and a drift check already fails on it | SPINE v3 |
| Cut list | REFUSED | IN | 7 | a candidate that does not beat baseline goes to the negatives store, not the bin | SPINE §E.3 |
| Mental model library | REFUSED | REFUSED | 7 | none of the four admissible bodies fits unanchored knowledge | SPINE v18 |
| Stop-rule per model | RENAMED | RENAMED | 6 | the ceiling, plus `or stop after N turns` on the goal | SPINE v12 |
| Model citation rate | RENAMED | RENAMED | 11 | the rung-1 fraction: whether beliefs are anchored at all | agree |
| Uncovered-field detection | IN | IN | 7 | the skill creator's first move: scout answers how the field does this, with sources | founder |
| Ad-hoc field learning | IN | IN | 7 | `bin/skill`, four moves, ending in an eval against baseline | founder |
| Taste profile | IN | IN | 13 | mined from transcripts and from the founder's own discards | agree |
| Brand voice profile | IN | IN | 13 | per venture; no CLI ships a first-class store for it | fact |
| Customer voice profile | IN | IN | 13 | sourced from real customer text, with provenance | agree |
| Per-project knowledge | IN | IN | 13 | the venture's own memory directory | agree |
| Negative knowledge log | IN | IN | 13 | ACE stores a failure mode as a unit with a counter; no CLI ships one | fact |
| Already-built registry | IN | IN | 13 | seeded by the transcript pass over a snapshot | SPINE v26 |
| Examples library | IN | IN | 7 | exemplar, with provenance, is one of the four admissible skill bodies | SPINE v18 |
| Golden output archive | IN | IN | 11 | held-out real outcomes; nothing shipped anywhere has one | fact |
| Pattern promotion | IN | IN | 13 | three sightings promotes, on the curator's nightly pass | agree |
| Skill retirement | RENAMED | IN | 7 | forced expiry: Refresh, Deprecate or Waive with a new date | SPINE v19 |
| Skill versioning | RENAMED | IN | 7 | the same `valid_until`, which forces the renewal decision | SPINE v19 |
| Skill deprecation policy | RENAMED | IN | 7 | Deprecate is one of the three dispositions at expiry | SPINE v19 |
| Skill ownership | RENAMED | IN | 7 | the curator writes every skill and proposes its expiry | SPINE v25 |
| Skill test coverage | RENAMED | IN | 7 | `evals.json`: 2–3 realistic prompts, with-skill against baseline, graded | SPINE §E.2 |
| Knowledge freshness check | IN | IN | 13 | an expiry on every memory item | agree |
| Cross-project knowledge sharing | IN | IN | 13 | craft and taste cross ventures; facts do not, without promotion | agree |
| Tacit knowledge capture | IN | IN | 13 | the transcript pass, over a snapshot and never live | SPINE v26 |

## 05 Memory

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Decisions log | IN | IN | 13 | the logbook; a decision is a handover with its brief | agree |
| Log eviction policy | IN | IN | 13 | evict memory, never the logbook; archive, never delete | agree |
| Log archive tool | IN | IN | 13 | the tool refuses what the rules forbid, and a hand-edit does neither | agree |
| Long-term memory file | IN | IN | 13 | an index loaded at start, topic files on demand — the vendor's own default | SPINE v27 |
| Session memory file | IN | IN | 6 | the run's own context, which dies with it | agree |
| Memory budget checker | IN | IN | 13 | a byte cap per store, bounding what one reader must load | agree |
| Global facts store | IN | IN | 13 | dated, sourced and expiring; model ids live here with their retirement dates | SPINE §G.4 |
| Project taste store | IN | IN | 13 | taste is shared fleet-wide because there is one founder | agree |
| Learned-field expiry | IN | IN | 7 | nothing shipped retires by expiry; this is ahead of every system surveyed | fact |
| Memory ledger | RENAMED | RENAMED | 13 | provenance on every item: source, date, expiry, falsifier | agree |
| Retrieval mechanism | IN | IN | 13 | the two-tier index: names at start, the topic file on demand | SPINE v27 |
| Transcript archive | IN | IN | 13 | mined locally at no API cost, and the entry format changes between versions | SPINE v26 |
| Unread transcript count | IN | IN | 13 | the count goes to zero once, and that is the point | agree |
| Verified project count | REFUSED | REFUSED | 16 | a vanity count; interventions per artifact is measured instead | agree |
| Episodic memory store | RENAMED | RENAMED | 13 | the event log, one row per event, joined by ids | agree |
| Semantic memory store | RENAMED | RENAMED | 13 | the facts and craft stores, small on purpose | agree |
| Procedural memory store | RENAMED | RENAMED | 7 | procedure is admitted in exactly one place: a checklist the Sender reads | SPINE v18 |
| Memory conflict resolution | IN | IN | 13 | conflicts are kept and marked, never silently resolved | agree |
| Intentional forgetting | IN | IN | 13 | expiry and eviction, so a drop is a known absence | agree |
| Memory service auth | REFUSED | REFUSED | 8 | Mem0 is refused as it stands: memory would leave the machine | SPINE §F |
| Memory access control | IN | IN | 13 | the curator's grant is the only one whose writable scope includes memory | SPINE v25 |
| Memory provenance tag | IN | IN | 13 | no shipped CLI records where a memory came from; Claude Code records write time only | fact |
| Memory redaction rule | IN | IN | 13 | redact before anything leaves the machine | agree |
| Memory sync interval | RENAMED | RENAMED | 13 | the nightly curator, which did not do the work it summarises | SPINE v25 |
| Cross-agent memory sharing | IN | RENAMED | 13 | agents read the same files; main-session auto memory is not loaded into subagents | fact |
| Memory search index | IN | IN | 13 | a local index, rebuildable and deletable; Claude Code ships none | fact |
| Memory decay function | IN | IN | 13 | expiry plus eviction; none of the three CLIs has one | fact |
| Memory dedup logic | IN | IN | 13 | an add that finds a near-duplicate becomes an update, never a rewrite | SPINE v24 |

## 06 Communication

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Orchestrator brief | IN | IN | 3 | the Operator emits a brief with an intent id, and never composes argv itself | SPINE v34 |
| Structured return format | IN | IN | 6 | the handover, fixed-field and evidence-backed | agree |
| Dispatch by reference | IN | IN | 3 | briefs name intent ids and paths, never inline payloads | agree |
| Shared board | RENAMED | IN | 14 | page 4 is a real board: stages, a timeline, a kanban, PRs beside tickets | founder |
| Baton handoff | IN | IN | 6 | the handover is the baton, and it is fixed-field | agree |
| Board rewrite cycle | RENAMED | RENAMED | 13 | delta-only: ACE measured 18,282 tokens collapsing to 122 on one rewrite | SPINE v24 |
| Board cap size | IN | IN | 13 | a byte cap per store | agree |
| Worker-to-worker request | REFUSED | RENAMED | 3 | teammates are messageable by name inside one team; a builder still files an objection | ? |
| Peer help request | REFUSED | RENAMED | 3 | the same channel and the same doubt: no nested teams, one team per session | ? |
| Stuck-worker escalation | IN | IN | 12 | the cord, and wake-me on repeated blocks | agree |
| File lease | IN | IN | 6 | one worktree and one branch per run makes a lease unnecessary | SPINE v6 |
| File lock alternative | IN | IN | 6 | the same worktree; one artifact is never split across two builders | SPINE v6 |
| Pair-work protocol | IN | IN | 15 | the Floor: the founder and one agent, same memory, same envelope | SPINE v4 |
| Broadcast channel | REFUSED | REFUSED | 3 | one team, one level; there is nothing to broadcast to | SPINE v13 |
| Blackboard pattern | RENAMED | RENAMED | 13 | the event log is a blackboard with provenance and a cap | agree |
| Production-scale messaging | REFUSED | REFUSED | 3 | inboxes are JSON files on disk; a bus with no load is infrastructure for its own sake | fact |
| Handoff token limit | IN | IN | 6 | the handover is capped; a summary never travels as evidence | agree |
| Handoff required fields | IN | IN | 6 | fixed fields, and nothing is an allowed value in each | agree |
| Message priority tag | RENAMED | RENAMED | 4 | the Desk's ranking, which is where prioritisation actually happens | agree |
| Message retry policy | IN | IN | 6 | resume, not restart; a goal stays active after transient failures including rate limits | SPINE v12 |
| Dead-letter queue | IN | IN | 6 | the same resume path, with idempotency keys for external effects | agree |
| Inter-agent protocol | REFUSED | RENAMED | 3 | the team's inbox files and the event log; no protocol of our own | SPINE v13 |
| Communication audit trail | IN | IN | 14 | the event log, joined by intent id and run id | agree |
| Silent failure detection | IN | IN | 11 | a run must hand over; the nightly done-test re-run catches the rest | agree |
| Notification throttling | IN | IN | 14 | the interruption budget of three a day, and the briefing is never an interruption | SPINE §C.2 |

## 07 Context & cost

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Session-start injection size | IN | IN | 3 | measured: 27,069 bytes against a 4,096 budget, cut to 2,941 | fact |
| Context reduction ratio | REFUSED | REFUSED | 16 | optimising a ratio invites gaming it; cost per finished intent is measured | agree |
| Skill discovery cost | REFUSED | IN | 7 | ~1,070 tokens a lookup through the routers, against ~15,000 for the whole manifest | fact |
| Budget guard script | IN | IN | 12 | pre-action ceilings, which reject rather than warn | agree |
| Stall ceiling | IN | IN | 16 | `--max-budget-usd` is exactly this, and it is kept for it | SPINE v23 |
| Context monitor tool | IN | IN | 4 | part of the Watch's cheap pass | agree |
| Batch API discount | RENAMED | RENAMED | 16 | 50% both directions, stacking with caching, and still needing a metered key | fact |
| Overnight non-interactive work | IN | IN | 10 | `claude -p` children through the launcher; Codex is not a night lane yet | SPINE v32 |
| Cache read discount | RENAMED | IN | 16 | 0.1x base input everywhere, 0.025x for Fable 5.1 | fact |
| Cache hit measurement | RENAMED | IN | 14 | page 3 carries the cache hit rate, and every number on it taps | SPINE v14 |
| Cost per mission | IN | IN | 16 | per intent, measured rather than estimated | agree |
| Cost per session | IN | IN | 16 | per run, from the runner's own reported cost | agree |
| Task id tagging | IN | IN | 14 | an intent id and a run id on every event row | agree |
| Actual burn tracking | IN | IN | 16 | measured; the only vendor anchor is $13 per active developer-day | fact |
| Token budget per agent | RENAMED | IN | 16 | the per-run ceiling, and a budget inherited from a Sonnet-4.6 measurement understates by ~30% | fact |
| Context window trimming | IN | IN | 6 | resume from files; Fable's 0.025x read is what makes a large standing context affordable | SPINE v21 |
| Context compression | IN | IN | 6 | the same mechanism; memory itself is never summarised | SPINE v24 |
| Prompt caching strategy | IN | IN | 16 | byte-identical standing prompts with no timestamp, because the TTL is one hour | fact |
| Cost anomaly alert | IN | IN | 14 | an anomaly on page 3 taps straight to the cord | SPINE v14 |
| Spend dashboard | RENAMED | IN | 14 | page 3 is the dashboard the founder asked for, and every number on it is a control | SPINE v14 |
| Per-model cost table | IN | IN | 9 | §G's price table, joined to the event log by model id | agree |
| Rate-limit cost impact | IN | IN | 16 | two windows, five-hour and weekly; a seat limit cannot be escaped with `/model` | SPINE v22 |

## 08 Quality & truth

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Claim ledger | RENAMED | IN | 11 | it exists, blocks in CI, and `sourcer` appends through one audited server with no Write | fact |
| Forced claim expiry | IN | IN | 11 | a durable claim carries `valid_until` or it is not a claim | agree |
| Claim disposition | IN | IN | 11 | Refresh, Deprecate or Waive with a new deadline; a lapsed waiver fails harder than none | agree |
| Verdict-diff binding | IN | IN | 11 | `subject = sha256(diff)`; hash-binding stops an inherited verdict, not a forged one | fact |
| Sha256 verification | IN | IN | 12 | the Sender acts on a staged, hashed artifact or on nothing | agree |
| Risk tier classifier | RENAMED | RENAMED | 12 | the reversibility class on the act — and neither shipped runtime keys on reversibility | SPINE v28 |
| Multi-step check suite | IN | IN | 11 | one runner, every step run whatever the ones before it did, and a tally a partial run cannot wear | fact |
| QA gate | IN | IN | 11 | it blocks; and a command gate verifies a recorded verdict rather than producing one | fact |
| Oracle-first review | IN | IN | 11 | the deterministic anchor runs before any panel agent is dispatched | agree |
| Blind reviewer pool | REFUSED | RENAMED | 11 | blindness is kept where it is structural: the tester's grant excludes the implementation | SPINE v8 |
| Weighted score spec | REFUSED | REFUSED | 11 | a weighted score of model opinions is a number with no anchor | agree |
| Council review | REFUSED | REFUSED | 11 | a vote among models has no anchor | agree |
| Persona convening | REFUSED | REFUSED | 11 | assigned dissent is same-family review in costume | agree |
| Self-attack review | IN | IN | 11 | the builder tests its own work before handover, and that proves nothing on its own | SPINE v8 |
| Taste review panel | RENAMED | RENAMED | 11 | the taste store check, with the residue going to the founder | agree |
| Correctness review panel | RENAMED | RENAMED | 11 | the anchor first, then `reviewer` on a second family when one is reachable | agree |
| Regression detection | IN | IN | 11 | it falls out of the nightly done-test re-run for free | agree |
| Statistical quality method | IN | IN | 11 | pass rates on the rehearsal set, and on 2–3 eval cases per skill | SPINE §E.2 |
| External-world verdict | IN | IN | 11 | rung 1: a record the company does not write | agree |
| Ground-truth comparison | IN | IN | 11 | known-answer cases — which is also the test that widens Codex | SPINE v32 |
| False-positive rate | IN | IN | 11 | measured on known-answer cases, never typed by the run that wants to pass | agree |
| False-negative rate | IN | IN | 11 | the same set, and it is what makes a trust score mean anything | agree |
| Reviewer disagreement resolution | IN | IN | 11 | the anchor wins; a checker disputing the test goes to the founder | agree |
| Confidence scoring | RENAMED | RENAMED | 11 | the anchor rung, which is auditable where a self-report is not | agree |
| Hallucination detection | IN | IN | 11 | the URL is fetched and the quoted line checked; a dead path blocks | fact |

## 09 Control & safety

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Pre-tool-use hook | IN | IN | 12 | the door test at the tool boundary; an MCP call reaches it only if the matcher names that tool | fact |
| MCP policy file | IN | IN | 12 | `.mcp.json` backs every declaration, and a declaration nothing backs fails the lint | fact |
| Allow list policy | IN | IN | 12 | `--tools` composed by the launcher — and allow rules have no effect in bypass mode | SPINE v10 |
| Deny list policy | IN | IN | 12 | `permissions.deny` in the managed file binds in every mode, including bypass | SPINE v10 |
| Unlisted-denied default | IN | IN | 12 | the grant is a closed set: `--restricted` plus an explicit `--tools` | SPINE §C.1 |
| Sandbox isolation | IN | IN | 12 | armed, and honestly described: a guardrail against accident, not containment | fact |
| Credential read denial | IN | IN | 12 | `denyRead` over the credential stores, and scout holds no credential at all | SPINE v33 |
| Permission rule count | REFUSED | REFUSED | 12 | a count of rules is not a measure of safety | agree |
| Hook event coverage | IN | IN | 12 | and the managed file deliberately does not disable hooks, because that would kill `/goal` | SPINE v11 |
| Blocking gate | IN | IN | 11 | four gates declared, any exit other than 0 or 1 is unresolved — and the gate may not be invocable by the thing it gates | SPINE v35 |
| Blocking-human gate | IN | IN | 12 | a `human` gate has no `run:`, and writing one is refused | fact |
| Live worldly risk | IN | IN | 12 | REACHES THE WORLD is a class on the act, and no agent holds it | SPINE v33 |
| Publish-action risk | IN | IN | 12 | anything delivered to a person is one-way | agree |
| Spend-rate policy | IN | IN | 12 | pre-action ceilings, in rate as well as amount | agree |
| Daily spend cap | IN | IN | 12 | the Sender recomputes the ceiling before it acts; `--max-budget-usd` cannot do this | SPINE v23 |
| Kill switch | IN | IN | 14 | the cord, and it is a control present on every page | SPINE v4 |
| Remote kill access | IN | IN | 14 | the same cord from the phone; a kill in two places is a kill that disagrees | agree |
| Prompt injection defense | IN | IN | 12 | structural: scout reads the untrusted world holding no key and no send | SPINE v33 |
| Fetched-content taint tracking | IN | IN | 8 | READ-ONLY tainted is its own class, held by `scout` and the world's door and by nothing else | SPINE v36 |
| Research reach exemption | IN | IN | 8 | scout reaches the world precisely because it holds nothing | SPINE v33 |
| Structured-input matching | IN | IN | 12 | declare what is read and refuse the rest, at the line rather than the value | fact |
| String-matching bypass fix | IN | IN | 12 | the same rewrite; eight chained-step bypasses were closed by it | fact |
| Least-privilege default | IN | IN | 5 | eight of fourteen carry no shell, five no write, four can touch source | SPINE v1 |
| Privilege escalation audit | IN | IN | 12 | a subagent's own `permissionMode` is ignored, so a child cannot widen its grant | fact |
| Incident response plan | IN | IN | 12 | cord, freeze, the log says what happened, then a deliberate undo | agree |
| Rollback mechanism | IN | IN | 12 | git for artifacts, idempotency keys outward; undo is deliberate | agree |
| Approval workflow | RENAMED | RENAMED | 3 | a which with both options built — and `dontAsk` denies the question outright | SPINE v9 |
| Human override path | IN | IN | 15 | the founder overrides from either surface, and every tap opens a terminal on the Mac | founder |
| Compliance policy mapping | IN | IN | 12 | the chain of direction is the audit trail; legal reaches the founder | agree |
| Data retention policy | IN | IN | 15 | prompt and response bodies are a separate opt-in stream with its own retention | agree |

## 10 Surfaces

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Terminal interface | IN | IN | 15 | the Floor, unchanged, and it is what every tap on every page opens | founder |
| Mission control dashboard | REFUSED | IN | 14 | a first-class website with seven pages, and every page is a control | founder |
| Dashboard view count | REFUSED | IN | 14 | seven pages, each named, each with its own taps and its own substrate | founder |
| Actionable dashboard views | IN | IN | 14 | every element is a fact or a tap, extended to the dashboard itself | SPINE v14 |
| Inbox surface | IN | IN | 14 | the desk strip of page 5: a queue of decisions, not a display of activity | SPINE v4 |
| Empty-inbox problem | IN | IN | 14 | empty is the normal state and a good sign | agree |
| Office floor visualization | IN | IN | 14 | page 1, on Generative Agents `demo` mode, fed by a writer over the event log | founder |
| Phone notifications | IN | IN | 14 | capped by the interruption budget of three a day | agree |
| Approval-via-phone | IN | RENAMED | 14 | a which, not an approval; a fully autonomous run cannot ask at all | SPINE v9 |
| Voice output tool | IN | IN | 14 | the briefing read aloud; voice is input only and binds nothing | SPINE v29 |
| Audio playback tool | IN | IN | 14 | the raw work played, not a summary of it | agree |
| Redirect verb | IN | IN | 14 | a redirect is logged as a defect in the brief, never against the run | agree |
| Edit-arguments verb | IN | IN | 14 | a typed verb on the desk strip | agree |
| Morning briefing surface | IN | IN | 14 | "Last night" on page 5; the founder opens it, so it is never an interruption | SPINE v4 |
| Walkthrough surface | IN | IN | 14 | page 5 shows every engine, gate and store live rather than drawn | SPINE v4 |
| Q&A surface | IN | IN | 14 | ask-anything over the same store, with the rows it cites | agree |
| Interrupt policy | IN | IN | 15 | sterile while the founder is on the Floor, detected by phase | agree |
| Do-not-interrupt window | IN | IN | 15 | the same sterile state | agree |
| Mobile app surface | RENAMED | RENAMED | 14 | the website rendered on the phone; an app is a build pipeline for a page | agree |
| Slack/chat surface | REFUSED | REFUSED | 14 | one founder; a chat surface adds a place to miss things | agree |
| Email digest surface | REFUSED | REFUSED | 14 | the briefing is the digest and it lives where the decisions are | agree |
| API surface | RENAMED | RENAMED | 14 | the event log is a file anything can read, and the seven pages read it | agree |
| Webhook surface | RENAMED | RENAMED | 14 | inbound arrives through the world's door as one event row | agree |
| Public status page | OUTSIDE | OUTSIDE | 14 | a venture may build one as its own work; the harness has no audience | agree |

## 11 Runtime

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Host environment | IN | IN | 15 | the Mac, with its wall named rather than assumed | agree |
| Version-control substrate | IN | IN | 15 | git, for everything the system knows | agree |
| Process scheduler daemon | IN | IN | 15 | a LaunchAgent, because the Watch must run as the founder's user | agree |
| Sleep-prevention daemon | IN | IN | 15 | caffeinate, time-bounded, and it does not survive a closed lid | agree |
| Power-management daemon | FOUNDER'S | FOUNDER'S | 15 | disabling sleep is a real change to the founder's own machine | agree |
| Active workflow count | IN | IN | 14 | page 2 shows who is working and who is sleeping | SPINE v4 |
| Idle workflow count | IN | IN | 14 | the same page; an idle system names its constraint | SPINE v4 |
| Session-only cron | IN | RENAMED | 15 | `/loop` is refused in production: session-scoped, 7-day expiry, fires only while idle | SPINE v12 |
| Cron expiry policy | IN | IN | 15 | horizons on everything durable, and `/loop`'s own is seven days | fact |
| Scheduler gap | IN | IN | 15 | missed firings coalesce on wake | agree |
| Model access denial | IN | IN | 9 | a denied model surfaces as blocked, never as a silent downgrade | agree |
| Loopback-only model | IN | IN | 9 | MiniLM and Qwen3-0.6B run on electricity, with no window at all | SPINE v20 |
| Model pin retirement | IN | IN | 9 | model ids carry an expiry in the facts store; Haiku 4.5's is 2026-10-15 | SPINE §G.4 |
| Uninstalled runtime candidate | IN | IN | 10 | Codex is in the system from day one, in the foreground checker slot | founder |
| TTY bug test | IN | IN | 10 | `codex exec --json`, no controlling TTY, a non-trivial prompt, version ≥ 0.124.0 | SPINE v32 |
| Model family count | IN | IN | 9 | three families, and only Codex publishes numeric per-window quotas | fact |
| Job-to-model table | RENAMED | IN | 9 | §G.1 is that table, per move, and each row names its trigger | founder |
| Shutdown behavior | IN | IN | 6 | resume, not restart; the cord for a deliberate stop | agree |
| Always-on tier | IN | IN | 15 | the Watch on launchd; `/loop` cannot be it | SPINE v12 |
| Low-power tier | IN | IN | 9 | local models on electricity are the bottom of the ladder | SPINE v20 |
| Cost-ascending home tiers | IN | IN | 9 | local, then Gemini's window, then Sonnet, then Opus, then Fable by one named rule | SPINE v21 |
| Container isolation | RENAMED | RENAMED | 6 | git worktrees — and `git worktree add` needs the sandbox lifted for that one command | fact |
| Multi-host failover | REFUSED | REFUSED | 15 | one founder, one Mac; recovery is a git clone | agree |
| Runtime health monitor | IN | IN | 4 | the Watch's cheap pass every tick | agree |

## 12 Self-improvement

*§K names no self-improvement section. These are placed by mechanism: the curator's nightly pass at 13, rehearsal and the eval loop at 11, forced expiry at 7.*

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Correction learning | IN | IN | 13 | the curator's nightly pass over corrections that already exist | SPINE v25 |
| Regex classifier | RENAMED | RENAMED | 9 | a local model does it: Qwen3-0.6B, Apache 2.0, on electricity | SPINE v20 |
| Post-mortem log | IN | IN | 6 | handovers are the post-mortem, written at the moment | agree |
| Post-mortem mechanism | IN | IN | 13 | fixed questions, read by the curator, never by the actor | SPINE v25 |
| Pattern promotion threshold | IN | IN | 13 | three independent sightings promotes | agree |
| Sighting count trigger | IN | IN | 13 | the same counter, run nightly | agree |
| Blocked improvement metric | IN | IN | 14 | repeated blocks are a wake-me condition with a number on it | agree |
| Prompt A/B testing | IN | IN | 11 | with-skill against baseline is the shipped shape, and it applies to a prompt too | SPINE §E.2 |
| Pareto prompt archive | IN | IN | 11 | old versions archived and revertible | agree |
| Self-editing prompts | IN | IN | 11 | gated on measured improvement over known answers; nothing judges its own homework | SPINE v8 |
| Prompt-edit gate | IN | IN | 11 | the eval loop is the gate, and an agent file is irreversible tier besides | fact |
| Interventions-per-artifact metric | IN | IN | 16 | it cannot be gamed by producing more | agree |
| Field-note ledger | RENAMED | IN | 7 | a skill is the field note now, in one of four admissible bodies | SPINE v3 |
| Field-note expiry | RENAMED | IN | 7 | `valid_until` on every skill, with a forced disposition | SPINE v19 |
| Continuous fine-tuning | REFUSED | REFUSED | 9 | it turns reversible artifacts into irreversible weights | agree |
| Feedback loop closure | IN | IN | 11 | a challenger's finding names the mechanism that would have caught it, or it is an opinion | SPINE v30 |
| Improvement backlog | IN | IN | 2 | improvements are intents; there is no separate backlog and no section for one | ? |
| Improvement ownership | IN | IN | 2 | the intent's owner field | agree |

## 13 Economics

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Per-worker cost | RENAMED | IN | 16 | per agent is meaningful now: page 3 breaks spend down per agent | SPINE v14 |
| Per-mission cost | IN | IN | 16 | per intent, measured rather than predicted | agree |
| Cost-vs-value comparison | IN | IN | 16 | cost is measured; value is the done-test passing | agree |
| Investment stop criteria | IN | IN | 16 | the ceiling stop, with sunk cost explicitly excluded | agree |
| Mission budget cap | IN | IN | 16 | ceilings in tokens and wall-clock; the dollar one is a stall fuse | SPINE v23 |
| Budget in money | IN | RENAMED | 16 | no per-run dollar ceiling binds the account — the window is the real budget | SPINE v23 |
| Budget in hours | IN | IN | 16 | wall-clock, and the rolling window is measured in it | SPINE v22 |
| Exploration spend | IN | IN | 16 | idle capacity is the exploration budget, bounded by being free | agree |
| Exploitation spend | IN | IN | 16 | the driven ventures' ceilings, at most two at a time | agree |
| Cheap-tier bulk usage | IN | RENAMED | 9 | local models and Gemini's own window; there is no Haiku tier | SPINE v20 |
| Cache-hit cost rate | RENAMED | IN | 16 | 0.1x read, 1.25x write at five minutes, 2x at one hour, 0.025x read for Fable | fact |
| Company P&L | OUTSIDE | OUTSIDE | 16 | a venture's own numbers; the harness holds the nightly reconciliation | agree |
| Revenue tracking tool | OUTSIDE | OUTSIDE | 16 | the processor is the outside record the reconciliation reads | agree |
| Payment analytics tool | OUTSIDE | OUTSIDE | 16 | venture work, anchored by tying to the bank line | agree |
| Burn rate dashboard | OUTSIDE | OUTSIDE | 16 | venture work; the harness's own burn is page 3 | SPINE v14 |
| Runway calculation | OUTSIDE | OUTSIDE | 16 | the balance against the model, which is the venture's to keep | agree |
| ROI per mission | RENAMED | RENAMED | 16 | cost per finished intent; revenue attribution cannot be made honestly yet | agree |
| Cost attribution model | IN | IN | 14 | venture, intent, run and agent id on every event, minted at dispatch | SPINE v14 |
| Unit economics per agent | REFUSED | IN | 16 | there are standing agents now, and page 3 attributes spend to them | SPINE v14 |

## 14 The company itself

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Founder role | IN | IN | 2 | the complete list of what the founder does, and it is short | agree |
| Single-operator model | IN | IN | 3 | one Operator, and it is the contact point with the founder | founder |
| Multi-operator template | REFUSED | REFUSED | 3 | designing for a second operator before one exists adds machinery nobody uses | agree |
| Real-work validation project | IN | IN | 21 | one real venture driven, with a rung-1 anchor; open decision 13 names which | agree |
| Synthetic first mission | REFUSED | REFUSED | 21 | the prior system was built and never ran a venture; this would repeat that | agree |
| Fake-company test case | REFUSED | REFUSED | 21 | a fixture world is not a first night of evidence | agree |
| Venture intake protocol | IN | IN | 2 | the Charter is the intake, and it is five fields | agree |
| Bounded intake artifacts | IN | IN | 2 | five fields is the whole intake; anything more is a plan nobody reads | agree |
| Cross-mission scheduling | IN | IN | 4 | the Desk ranks across ventures, bounded by the WIP limit | agree |
| Second human role | IN | IN | 20 | open decision 11: cheap now, impossible in the moment it is needed | ? |
| Declared decision rights | IN | IN | 12 | the envelope, plus the band table that maps it to modes and axes | SPINE §C.1 |
| Wind-down protocol | IN | IN | 2 | parked, then harvested for parts; archive, never delete | agree |
| Archive-not-delete policy | IN | IN | 13 | a cap on a decision log's lifetime total is a mechanism for losing decisions | agree |
| Venture-owned domain | IN | IN | 2 | a domain and DNS read is on the wish list; the asset stays the founder's | SPINE §F |
| Venture-owned phone number | FOUNDER'S | FOUNDER'S | 2 | a real-world asset the founder holds; the system records it as a fact | agree |
| Venture-owned bank account | FOUNDER'S | FOUNDER'S | 2 | the system reconciles to it and never holds its credential | agree |
| Legal entity structure | FOUNDER'S | FOUNDER'S | 2 | a one-way door; it reaches the founder as a which, with both options prepared | SPINE §B.4 |
| IP ownership policy | FOUNDER'S | FOUNDER'S | 2 | the system may draft and may not sign | SPINE §B.4 |
| Multi-venture portfolio view | IN | IN | 14 | page 1: one venture per area, every live run a light | founder |
| Venture health score | RENAMED | RENAMED | 14 | tempo, spend against ceiling, and whether intents advance; a composite hides which broke | agree |

## 15 Identity & access

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Agent identity token | RENAMED | RENAMED | 6 | the session id is a UUID we mint, and the run and intent ids join everything else | fact |
| Human identity verification | IN | IN | 12 | the founder is whoever holds the machine and the phone | agree |
| Service account management | IN | IN | 15 | the OS keychain, with grants rotating at their horizon | agree |
| API key rotation | IN | IN | 15 | rotation at the horizon, immediate on a leak | agree |
| Secrets vault | IN | IN | 15 | keychain references; `denyRead` covers the credential stores besides | fact |
| Least-privilege role mapping | IN | IN | 5 | there are roles now, and the tools column is the mapping | SPINE v1 |
| Session token expiry | IN | IN | 12 | the grant horizon is the expiry | agree |
| Multi-tenant isolation | IN | IN | 12 | the never-shared list, enforced by not handing the credential to the run | agree |
| Cross-venture data isolation | IN | IN | 12 | customer data, credentials and market beliefs never cross | agree |

## 16 Data & privacy

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| PII detection | IN | IN | 9 | a local model on electricity, run before anything leaves the machine | SPINE v20 |
| Data classification tags | IN | IN | 13 | memory items carry scope; the shared and never lists define the classes | agree |
| Data residency policy | IN | IN | 15 | local-first, which is why Mem0 is refused: memory would leave the machine | SPINE §F |
| GDPR/privacy compliance | FOUNDER'S | FOUNDER'S | 2 | a venture obligation with a statutory clock | agree |
| Data retention schedule | IN | IN | 15 | a separate retention for prompt and response bodies | agree |
| Data deletion request | IN | IN | 13 | the one exception to archive-not-delete, with its own record | agree |
| Consent management | IN | IN | 12 | the people register, read by the Sender before any contact | SPINE v33 |
| Anonymization pipeline | IN | IN | 13 | redaction before mining, not after | agree |
| Third-party data sharing policy | IN | IN | 12 | the never list; client data stays off any path that reaches the world | agree |

## 17 Deployment & DevOps

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| CI/CD pipeline | OUTSIDE | OUTSIDE | 11 | a venture's own work — and its exit code is the first thing in `builder`'s anchor | SPINE §B.2 |
| Staging environment | OUTSIDE | OUTSIDE | 12 | the venture builds it; the harness's rule is staged, never sent | agree |
| Blue-green deploy | OUTSIDE | OUTSIDE | 12 | venture work, and a pointer swap is what makes deploy a two-way door | agree |
| Canary release | OUTSIDE | OUTSIDE | 12 | venture work; the harness only classifies the act's reversibility | agree |
| Rollback automation | IN | IN | 12 | undo is deliberate, never automatic, and that is the choice | agree |
| Infra-as-code | OUTSIDE | OUTSIDE | 12 | venture work, with parity as a rung-1 anchor | agree |
| Feature flag system | OUTSIDE | OUTSIDE | 12 | venture work, and the cheapest way to make a deploy two-way | agree |
| Environment parity check | OUTSIDE | OUTSIDE | 11 | venture work; parity is checked as a rung-1 anchor | agree |
| Dependency vulnerability scan | IN | IN | 11 | a rung-1 anchor for code work, run nightly | agree |

## 18 Legal & compliance

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Terms of service | FOUNDER'S | FOUNDER'S | 2 | drafted by the system, never sent or signed without the founder | agree |
| Data processing agreement | FOUNDER'S | FOUNDER'S | 2 | a signature is always the founder's | agree |
| Model usage license | IN | IN | 20 | open decision 1: the automation clause carves out an API key, and OpenAI's terms are unread | SPINE §G.5 |
| Export-control compliance | IN | IN | 2 | a watching intent producing proposals, never autonomous action | agree |
| Liability policy | FOUNDER'S | FOUNDER'S | 2 | legal reaches the founder, with no tempo that changes it | agree |
| Audit-readiness checklist | IN | IN | 14 | the chain of direction is the audit trail, and it exists whether or not asked | agree |
| Regulatory monitoring | IN | IN | 2 | a watching intent over a handful of pages, opening a proposal on change | agree |
| IP infringement check | IN | IN | 11 | the licence read is the check: n8n, Flowise, Gource and `LICENSE-CONTENT` each moved a decision | SPINE v17 |

## 19 Growth & external comms

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Public changelog | IN | IN | 12 | drafted alone, published never without a tap | agree |
| User feedback channel | IN | IN | 12 | it arrives through the world's door as an event row a scout reads | agree |
| Support escalation path | IN | IN | 5 | the door and `scout` read it; `steward` writes the obligation, `writer` drafts the reply, the Sender sends | SPINE v36 |
| Marketing content pipeline | RENAMED | RENAMED | 2 | intents with content done-tests; `writer` owns the craft, not a pipeline | SPINE §B.4 |
| Community management | IN | IN | 12 | drafted and staged; every send is the founder's tap | agree |
| Partner integration requests | IN | IN | 2 | it arrives through a door and becomes a proposal | agree |
| Press/PR protocol | IN | IN | 12 | drafts everything, stages everything, sends nothing alone | agree |
| Brand guideline enforcement | IN | IN | 11 | a rung-2 check against the profile in venture memory | agree |

## 20 Team culture & onboarding

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| New-hire onboarding doc | FOUNDER'S | FOUNDER'S | 2 | only if a human joins; the succession handover is the nearest thing | agree |
| Agent onboarding doc | REFUSED | IN | 5 | the agent file is that document, and there are fifteen of them | founder |
| Decision-rights matrix | RENAMED | RENAMED | 12 | the envelope's lists plus the band table | SPINE §C.1 |
| Meeting cadence policy | RENAMED | RENAMED | 14 | the briefing and the nightly curator; neither is a meeting | agree |
| Documentation standard | IN | IN | 6 | the fixed-field brief and handover; docs are written by whoever made the thing | SPINE §B.4 |
| Knowledge-transfer protocol | IN | IN | 13 | memory, plus promotion between ventures with provenance | agree |
| Conflict resolution process | IN | IN | 11 | a disagreement is kept and marked rather than resolved silently | agree |
| Team retro cadence | RENAMED | RENAMED | 13 | the nightly curator, which costs the founder no time | agree |

## 21 Agent cognition — how it thinks

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Task intake parsing | IN | IN | 3 | the brief's fixed fields, never prose | agree |
| Intent extraction | IN | IN | 2 | the read-back, mandatory and in text | SPINE v29 |
| Goal restatement | IN | IN | 2 | the same read-back, in the Operator's own words; nothing binds by voice | SPINE v29 |
| Ambiguity flagging | IN | IN | 2 | an intent whose done-test is not falsifiable is refused at the store check | SPINE §C.3 |
| Clarifying question trigger | IN | RENAMED | 3 | `dontAsk` denies `AskUserQuestion`, so the run stages a which instead of asking | SPINE v9 |
| Assumption logging | IN | IN | 6 | the uncertain field in the handover; no shipped handover schema has one | fact |
| Research-before-plan rule | IN | IN | 7 | the skill creator's first move, and `scout` is who makes it | founder |
| Knowledge-gap detection | IN | IN | 7 | no skill for this field is the gate that starts a bounded pass | agree |
| Skill lookup step | REFUSED | IN | 7 | progressive disclosure: descriptions at startup, body on judged relevance | SPINE v3 |
| Local skill matching | REFUSED | IN | 7 | the two-tier routers, then 2–3 skills for a worker and 3–5 for the Operator | SPINE v3 |
| Relevant-skill ranking | REFUSED | RENAMED | 7 | triggering accuracy, tuned by the description and measured against baseline | SPINE §E.2 |
| Plan draft | REFUSED | REFUSED | 6 | method is the run's own; mandating a planning step is what the founder refused | agree |
| Plan critique pass | REFUSED | RENAMED | 11 | `challenger` is an agent, not a step: self-critique without external feedback degrades | SPINE v30 |
| Plan revision loop | REFUSED | REFUSED | 6 | the done-test judges the result, not the route | agree |
| Step sequencing | REFUSED | REFUSED | 6 | no stage states method, and that rule is what keeps a pipeline out | agree |
| Dependency ordering | REFUSED | REFUSED | 6 | ordering inside a run is the run's own | agree |
| Risk pre-check | IN | IN | 12 | the door test at the tool boundary, not a step the run performs on itself | agree |
| Resource estimate | REFUSED | REFUSED | 4 | measured medians instead; the estimator is the least reliable source | agree |
| Time estimate | REFUSED | REFUSED | 4 | the plan states this needs that, never this takes that long | agree |
| Confidence self-rating | REFUSED | REFUSED | 11 | replaced by the anchor rung, which is auditable | agree |
| Multiple-approach generation | IN | IN | 3 | both options built for any which — the only channel a silent run has | SPINE v9 |
| Approach comparison | IN | IN | 3 | the founder compares two built things, not two descriptions | agree |
| Approach selection rationale | IN | IN | 3 | the which carries the cost of each and a recommendation | agree |
| Sub-task decomposition | IN | IN | 4 | the Desk decomposes; a run cannot dispatch its own successor | agree |
| Ticket generation | RENAMED | IN | 14 | page 4 carries real tickets beside PRs, and a card is a control | founder |
| Ticket acceptance criteria | RENAMED | IN | 2 | the done-test, named before work starts, and it is also the goal condition | SPINE v12 |
| Definition of done | RENAMED | IN | 2 | the done-test is the definition, and it is falsifiable by someone who did not do the work | agree |
| Persistence policy | IN | IN | 4 | the Watch is the loop; a goal survives transient failures including rate limits | SPINE v12 |
| Relentless-retry condition | IN | IN | 6 | one retry with the error in context; four unrecoverable errors ends the goal | fact |
| Give-up condition | IN | IN | 6 | Impossible is a `/goal` verdict, and `or stop after N turns` is the other end | SPINE v12 |
| Self-check before submit | IN | IN | 11 | the builder tests its own work before handover, and it is not the anchor | SPINE v8 |
| Explain-your-reasoning step | IN | IN | 14 | the trace, captured rather than performed | agree |
| Chain-of-thought log | IN | IN | 14 | `--output-format stream-json --verbose` emits each message as the loop runs | fact |
| Reflection-after-action | IN | IN | 13 | the curator does it, never the run: the actor is the most biased author | SPINE v25 |
| Lesson extraction | IN | IN | 13 | fixed questions, never what did you learn | agree |
| Next-action proposal | IN | IN | 6 | the next field in the handover, which the Operator may ignore | agree |

## 22 Task & ticket breakdown

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Ticket template | RENAMED | IN | 14 | page 4's card fields, drawn from Linear and from Copilot's one branch, one PR | SPINE v16 |
| Ticket priority field | RENAMED | RENAMED | 4 | the Desk's ranking, shown on the board rather than typed into it | agree |
| Ticket owner field | RENAMED | IN | 14 | Linear's field is delegate rather than assignee, and that is the one copied | fact |
| Ticket dependency field | RENAMED | RENAMED | 4 | the readiness boolean | agree |
| Ticket status field | RENAMED | IN | 14 | the board's stages — and dragging a card into working-on-it is the dispatch | ? |
| Ticket size estimate | RENAMED | RENAMED | 6 | the ceiling, and measured medians rather than an estimate | agree |
| Epic-to-ticket mapping | RENAMED | RENAMED | 4 | intent to candidate work, two levels | agree |
| Backlog grooming | REFUSED | REFUSED | 4 | the Desk re-ranks on a cadence; grooming is a ceremony for a team | agree |
| Sprint-equivalent cycle | REFUSED | REFUSED | 2 | tempo replaces the sprint, and there is no demo to hold | agree |
| Ticket acceptance test | IN | IN | 2 | the done-test, checkable by someone who did not do the work | agree |
| Ticket blocked reason | IN | IN | 6 | outcome blocked, with the reason and what would clear it | agree |
| Ticket reassignment rule | REFUSED | RENAMED | 14 | a card moves stage or team; nothing is assigned to a standing worker | SPINE v16 |
| Ticket audit trail | IN | IN | 14 | the event log, joined by the ids | agree |
| Cross-ticket linking | IN | IN | 14 | intent ids on every row; one isolated workspace per issue is the Symphony shape | fact |
| Duplicate-ticket detection | IN | IN | 13 | the already-built registry and the negatives store answer it together | agree |
| Ticket aging alert | IN | IN | 4 | decay in the ranking, plus expiry on the intent | agree |
| Definition-of-ready check | REFUSED | REFUSED | 4 | readiness is a boolean, not a meeting, and nothing shipped has one either | fact |

## 23 Departments — design & product

*From here to §30 the placement is SPINE §B.4's, which names the agent that covers each department and the items it refuses with the reason. A department is a job on the roster, not a folder.*

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| UI design agent | RENAMED | IN | 5 | `designer`, with Playwright and the perception loop | founder |
| UX research agent | RENAMED | IN | 5 | `scout` answers the bounded question; the founder does the talking | SPINE §B.4 |
| Branding agent | RENAMED | IN | 5 | `designer` owns brand and visual identity | SPINE §B.4 |
| Logo/visual identity agent | RENAMED | IN | 5 | the same agent; it produces many and the founder picks | SPINE §B.4 |
| Design system maintenance | RENAMED | IN | 5 | `designer`, and a design-token bridge is on the tool wish list | SPINE §F |
| Prototype generation | RENAMED | IN | 5 | render, look, iterate, judged against a named anchor and never a description | SPINE §B.4 |
| User testing simulation | REFUSED | REFUSED | 11 | a simulated user is the machine grading its own homework | SPINE §B.4 |
| Accessibility review | IN | IN | 5 | `designer`; contrast, focus order and labels are computable rather than judged | SPINE §B.4 |
| Product spec writing | RENAMED | IN | 5 | `product` turns fuzzy into a falsifiable done-test | SPINE §B.4 |
| Roadmap prioritization | RENAMED | IN | 5 | `product` drafts the roadmap; the weight stays the founder's field | SPINE §B.4 |
| Feature flag rollout | RENAMED | RENAMED | 12 | a flag is what upgrades a deploy from a one-way door to a two-way one | agree |
| User feedback triage | RENAMED | IN | 5 | `product` triages it; it arrives through the world's door | SPINE §B.4 |

## 24 Departments — engineering

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Code writing agent | RENAMED | IN | 5 | `builder`: one artifact, one worktree, continuous context | founder |
| Code review agent | RENAMED | IN | 5 | `reviewer`, carrying no Write, no Edit and no Bash | founder |
| Database schema agent | RENAMED | IN | 5 | `architect`; the anchor is a migration that applies and rolls back in a scratch database | SPINE v7 |
| API design agent | RENAMED | IN | 5 | `architect` again: the contract is a separate artifact with its own done-test | SPINE v7 |
| Test writing agent | RENAMED | IN | 5 | `tester`, blind to the implementation because its `--add-dir` excludes it | SPINE v8 |
| Bug triage agent | RENAMED | RENAMED | 5 | `reviewer` or `builder` by intent; a reproducing command is the anchor | SPINE §B.4 |
| Refactor agent | RENAMED | RENAMED | 5 | `builder`; reversible, which makes it the freest work on the roster | agree |
| Documentation agent | RENAMED | REFUSED | 5 | docs are written by whoever made the thing; split from the artifact they drift | SPINE §B.4 |
| Infra provisioning agent | RENAMED | RENAMED | 12 | preview alone; production is a one-way door until the undo is drilled | agree |
| Performance profiling agent | RENAMED | RENAMED | 5 | `analyst` or `builder` by intent; the profile shows the number | SPINE §B.4 |

## 25 Departments — data & analytics

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Data pipeline agent | RENAMED | IN | 5 | `analyst` owns pipelines | SPINE §B.4 |
| Analytics tracking setup | RENAMED | IN | 5 | `analyst`; the read-only instruments are admitted first for exactly this | SPINE §F |
| Dashboard generation agent | RENAMED | IN | 14 | `analyst` builds a venture's; the harness's own is page 3 | SPINE v14 |
| KPI definition agent | RENAMED | IN | 5 | `analyst` defines KPIs; the done-test stays per intent | SPINE §B.4 |
| Cohort analysis agent | RENAMED | IN | 5 | `analyst`; a slow anchor, started early and resolved late | SPINE §B.4 |
| A/B test analysis | RENAMED | IN | 5 | `analyst`; the stopping criterion is fixed before the test starts | SPINE §B.4 |
| Data cleaning agent | RENAMED | IN | 5 | `analyst`; every number reconciles to its raw source | SPINE §B.4 |
| Data labeling agent | RENAMED | REFUSED | 13 | a founder-taste task: the discards are the labels, and they arrive through the Floor | SPINE §B.4 |
| Anomaly detection agent | RENAMED | IN | 5 | `analyst` runs the nightly reconciliation against records the company does not write | SPINE §B.4 |

## 26 Departments — marketing & content

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Content calendar agent | RENAMED | IN | 5 | `writer` owns the calendar; the Sender holds to the recipient's hours | SPINE §B.4 |
| Blog writing agent | RENAMED | IN | 5 | `writer`: writes many, stages many, sends none | SPINE §B.4 |
| Video generation agent | RENAMED | IN | 5 | `writer`, holding Higgsfield rate-capped because it spends credits | SPINE §B.4 |
| Asset generation agent | RENAMED | IN | 5 | the same grant; set consistency is the anchor and the founder picks | SPINE §B.4 |
| SEO optimization agent | RENAMED | IN | 5 | `writer`; schema and canonical are rung 1, ranking is a months-long anchor | SPINE §B.4 |
| Ad copy agent | RENAMED | IN | 5 | `writer` drafts, and an ads read is admitted before any ads write | SPINE §F |
| Social media agent | RENAMED | IN | 5 | `writer` drafts and stages; nothing posts alone | SPINE §B.4 |
| Email campaign agent | RENAMED | IN | 5 | `writer` drafts; the Sender performs it once the founder widens that class | SPINE v33 |
| Brand voice enforcement | RENAMED | IN | 5 | `writer`'s lens is growth and craft, anchored on the founder's taste store | SPINE §B.4 |
| Influencer outreach agent | RENAMED | REFUSED | 12 | first contact with a stranger is on the default never list | SPINE §B.4 |

## 27 Departments — sales & growth

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Lead scraping agent | RENAMED | IN | 5 | `growth` scrapes — and no fetched roster anywhere ships a sales function at all | fact |
| Lead scoring agent | RENAMED | IN | 5 | `growth` scores; the anchor is a reply from a real person, not the score | SPINE §B.4 |
| Cold outreach agent | RENAMED | RENAMED | 12 | `growth` drafts and never sends | SPINE §B.4 |
| CRM update agent | RENAMED | IN | 5 | `growth`, on a read-only CRM server; the outside record owns the truth | SPINE §F |
| Client contact agent | RENAMED | RENAMED | 12 | drafted with the recipient filled in and staged unsent; the tap is the founder's | agree |
| Follow-up sequencing | RENAMED | IN | 5 | `growth` sequences; the Sender holds it to the recipient's local hours | SPINE §B.4 |
| Deal-stage tracking | RENAMED | IN | 5 | `growth`; the processor generates the rung, never a status report | SPINE §B.4 |
| Churn prediction agent | RENAMED | REFUSED | 5 | no venture has the data; it is a wish until one does | SPINE §B.4 |
| Referral tracking agent | RENAMED | IN | 5 | `growth`; they paid again and named you is the top rung | SPINE §B.4 |

## 28 Departments — customer service

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Support ticket triage | RENAMED | IN | 5 | the door delivers the ticket and `scout` reads it; `steward` writes the obligation and its due date | SPINE v36 |
| Chatbot response agent | RENAMED | REFUSED | 12 | an autonomous reply bot is refused; a person is on the other side | SPINE §B.4 |
| Escalation-to-human rule | IN | IN | 14 | the wake-me list, against the interruption budget | agree |
| Customer sentiment tracking | RENAMED | IN | 5 | `scout` reads and reports, and structurally cannot act | SPINE v33 |
| FAQ auto-update | RENAMED | IN | 5 | `writer` drafts; the ticket rate is the anchor and it resolves in weeks | SPINE §B.4 |
| Refund/policy enforcement | REFUSED | REFUSED | 12 | money that reaches a person is a one-way door with no exception | agree |
| Customer satisfaction survey | RENAMED | IN | 5 | `analyst` reads it; a stranger's reaction exists independently of us | SPINE §B.4 |

## 29 Departments — finance & legal

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Invoice generation agent | RENAMED | IN | 5 | `steward`; it ties to the bank line or the difference is shown | SPINE §B.4 |
| Expense tracking agent | RENAMED | IN | 5 | `steward`; the vendor's own billing endpoint is the outside record | SPINE §B.4 |
| Budget-vs-actual agent | RENAMED | IN | 5 | `steward` states it and `analyst` reconciles it | SPINE §B.4 |
| Contract drafting agent | RENAMED | REFUSED | 12 | drafting that binds is a one-way door; it reaches the founder as a which | SPINE §B.4 |
| Contract review agent | RENAMED | IN | 5 | `scout` reads the counterparty's document; `steward` writes the review, and a rubric here would manufacture a number | SPINE v36 |
| Compliance check agent | RENAMED | IN | 5 | `steward` flags; deterministic rows, wired before there is a product | SPINE §B.4 |
| Tax-prep support agent | RENAMED | REFUSED | 12 | tax filing is a one-way door and reaches the founder with both options prepared | SPINE §B.4 |
| Cap-table tracking | RENAMED | REFUSED | 12 | a cap-table edit is one-way; the same which | SPINE §B.4 |
| Legal risk flagging | RENAMED | IN | 5 | `steward` flags and stops — and no fetched roster ships a legal agent at all | fact |

## 30 Departments — operations & HR

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Vendor management agent | RENAMED | IN | 5 | `steward` owns vendors; every adopted part gets an exit note on arrival | SPINE §B.4 |
| Hiring-pipeline agent | OUTSIDE | REFUSED | 5 | there are no employees; revisit when there are | SPINE §B.4 |
| Onboarding-doc agent | RENAMED | RENAMED | 5 | `steward` writes process docs; a venture is onboarded by its Charter | SPINE §B.4 |
| Meeting-notes agent | RENAMED | IN | 5 | the door and `scout` hold the Gmail, Calendar, Drive and Notion reads; `steward` writes the note | SPINE v36 |
| Calendar-scheduling agent | RENAMED | RENAMED | 12 | `scout` reads the calendar, `steward` writes the obligation, and an invite to a person is the Sender's | SPINE v36 |
| Process-documentation agent | IN | IN | 5 | `steward` writes process docs and internal tooling requests | SPINE §B.4 |
| Internal-tool provisioning | RENAMED | RENAMED | 8 | nothing is admitted without naming the intent and what it replaces | agree |

## 31 Multi-venture portfolio layer

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Non-24/7 venture mode | IN | IN | 2 | tempo, four values, one field and one tap | agree |
| Venture activity toggle | IN | IN | 14 | page 1 gives each venture an area, and the toggle is a tap on it | SPINE v4 |
| Idle-venture hibernation | IN | IN | 2 | parked, with the date it stopped and what would bring it back | agree |
| Venture wake trigger | IN | IN | 2 | watching produces proposals; promotion is the founder's tap | agree |
| Cross-venture resource pool | IN | IN | 16 | one seat, two windows, shared with Claude chat and Cowork | SPINE v22 |
| Shared-agent time-slicing | RENAMED | RENAMED | 16 | the reserve per window and the WIP limit; agents are files, not capacity | SPINE v22 |
| Per-venture budget isolation | IN | IN | 16 | a ceiling per venture, recomputed before each act | agree |
| Per-venture priority weight | IN | IN | 4 | the charter's weight feeds the Desk's ranking | agree |
| Portfolio dashboard | RENAMED | IN | 14 | page 1 is the portfolio, and page 3 carries per-venture spend | founder |
| Venture health snapshot | RENAMED | RENAMED | 14 | tempo, spend and whether intents advance; not a composite | agree |
| Venture comparison view | RENAMED | IN | 14 | page 3 breaks every number down per venture, and each one taps | SPINE v14 |
| Dormant-venture archive | IN | IN | 2 | parked and archived, never deleted | agree |
| Venture reactivation checklist | IN | IN | 2 | promotion is a tap, and adoption adds a scout pass | agree |
| Shared skill library across ventures | RENAMED | IN | 7 | one library, two directories, one markdown source of truth | SPINE v3 |
| Cross-venture learning transfer | IN | IN | 13 | promotion, with provenance and reversibility | agree |

## 32 Mac environment & local runtime

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Claude Code host | IN | IN | 15 | the Operator runs inside it, and the Floor is it | founder |
| Codex CLI integration | IN | IN | 10 | day one, as a checker on a prepared diff in the foreground slot | founder |
| Gemini CLI integration | IN | IN | 9 | routine scouting and the summarising half of the transcript pass, once authenticated | SPINE §G.1 |
| Local model runner | IN | IN | 9 | MiniLM at 384 dims and Qwen3-0.6B, both Apache 2.0, no window at all | SPINE v20 |
| macOS permission grants | IN | IN | 15 | measured, and stated as measured | agree |
| launchd scheduling | IN | IN | 15 | a LaunchAgent, because the Watch must run as the founder's user | agree |
| Menu-bar agent status | IN | IN | 15 | a glyph: running, waiting on you, or stopped | agree |
| Local file system access | IN | IN | 12 | scoped per grant, and the write boundary is the session project root | fact |
| Keychain credential storage | IN | IN | 15 | references, never values in a file a run can read | agree |
| Background process management | IN | IN | 15 | `tmux kill-session`, plus a process-group kill because a hang is alive | SPINE §D.1 |
| Battery/power-aware scheduling | IN | IN | 15 | lid open on power, and the wall is named rather than worked around | agree |
| Sleep/wake handling | IN | IN | 15 | resume makes a sleep survivable rather than fatal | agree |
| Multi-terminal session management | IN | IN | 15 | tmux by name; split panes are unsupported in VS Code, Windows Terminal and Ghostty | fact |
| Local-first privacy mode | IN | IN | 13 | a default, not a mode: mining and indexing never leave the machine | agree |

## 33 Cross-model orchestration & review

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Model-per-task routing | IN | IN | 9 | the §G.1 table, per move, each row naming its trigger | founder |
| Cross-model review pass | IN | IN | 11 | whichever family made the artifact does not check it | agree |
| Generator-critic pairing | IN | IN | 11 | `challenger` never reads the author's reasoning, only the artifact and its done-test | SPINE v30 |
| Claude-reviews-Codex pattern | IN | IN | 10 | available now: Codex's output is a prepared diff a reviewer reads | founder |
| Codex-reviews-Claude pattern | IN | IN | 10 | day one, foreground, stdout to a file while inheriting the parent shell's TTY | SPINE v32 |
| Gemini-as-third-opinion | RENAMED | RENAMED | 9 | Gemini is the routine window rather than a third judge, and it is unauthenticated today | fact |
| Model disagreement resolution | IN | IN | 11 | the deterministic anchor wins | agree |
| Consensus-required threshold | REFUSED | REFUSED | 11 | a vote among models has no anchor, so there is no threshold to set | agree |
| Model specialization map | REFUSED | RENAMED | 9 | §G.1 maps moves, not capabilities, because capabilities move faster than a map | agree |
| Model cost-tier routing | IN | IN | 9 | five on Opus, eight on Sonnet, one split, and Fable only by one named rule | SPINE v21 |
| Model fallback chain | IN | IN | 9 | a family limit is a reroute and a seat limit is a stop; they are different events | SPINE v22 |
| Sandbox mode per CLI | IN | IN | 12 | the band table names Claude Code's mode and Codex's two axes for every band | SPINE §C.1 |
| Approval-mode per CLI | IN | IN | 12 | `never` in every band, because no agent performs an outward act | SPINE §C.1 |
| Subagent support per CLI | IN | IN | 3 | depth 3, 20 concurrent, and `Workflow` removed from all of them | fact |
| MCP-server sharing across CLIs | REFUSED | RENAMED | 8 | one admitted server is declarable in both, per agent; nothing is shared implicitly | SPINE §F |
| AGENTS.md shared config | RENAMED | IN | 7 | `.claude/skills/` and `.agents/skills/`, one markdown source, generated artifacts | SPINE §E.1 |
| Skills-folder shared config | RENAMED | IN | 7 | the same two directories — and Codex does not read `.codex/skills` | fact |
| Session-resume across tools | IN | IN | 6 | `--session-id` is a UUID we mint, and the event log is the shared state | fact |
| Cross-CLI task references | IN | IN | 14 | one intent id and one run id on every row | agree |
| Interrupt-hook handling | IN | IN | 12 | the cord is read first, every tick | SPINE §C.2 |
| Worktree isolation per agent | IN | IN | 6 | one worktree per run — and `git worktree add` needs the sandbox lifted | fact |
| Parallel CLI sessions | IN | IN | 3 | bounded by the WIP limit, one team per session, and one foreground Codex slot | SPINE v32 |

## 34 Perspective diversity & bias mitigation

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Multiple-model second opinion | IN | IN | 11 | a second family whenever one is reachable; single-family is an accepted risk today | fact |
| Devil's-advocate pass | REFUSED | RENAMED | 5 | `challenger` is an agent with an external anchor, not a pass a run performs on itself | SPINE v30 |
| Blind-spot check | RENAMED | RENAMED | 6 | the uncertain field, and what I could not check in the briefing | agree |
| Style/tone diversity check | IN | IN | 3 | both options built for a which, where diversity actually pays | agree |
| Independent verification agent | IN | IN | 5 | `reviewer`, `guard` and `challenger`, none of which can edit what it judges | SPINE v1 |
| Vendor-lock-in avoidance | IN | IN | 10 | one launcher emits both providers' argv, so an outage is a routing change | SPINE v5 |
| Model-drift detection | IN | IN | 11 | the rehearsal set re-run on a cadence, and model ids carry an expiry besides | SPINE §G.4 |
| Output-diversity sampling | REFUSED | REFUSED | 11 | as a standing policy it multiplies cost with no anchor to pick between outputs | agree |

## 35 Open-mindedness & rethink triggers

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Assumption-challenge prompt | IN | IN | 11 | every durable decision names what would falsify it, and `challenger` is who asks | SPINE v30 |
| Periodic architecture rethink | IN | IN | 7 | forced by expiry rather than remembered | SPINE v19 |
| "Why does this exist" audit | IN | IN | 7 | the same expiry, applied to every skill, grant and memory item | SPINE v19 |
| Sunset-candidate review | IN | IN | 7 | Deprecate is one of the three dispositions at expiry | SPINE v19 |
| Alternative-architecture proposal | FOUNDER'S | FOUNDER'S | 20 | commissioning another design is the founder's call | agree |
| Contrarian-review agent | REFUSED | IN | 5 | `challenger` is exactly this, and it is an agent because self-critique is measured harmful | SPINE v30 |
| Fresh-eyes onboarding review | IN | IN | 6 | every run starts from files, so it is fresh eyes by construction | agree |
| Session-scoped rethink checklist | REFUSED | REFUSED | 7 | expiry does it on the right clock; a per-session checklist is a procedure | SPINE v19 |

## The nine wings

### Wing 1 — Model layer

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Primary + secondary LLM selection | IN | IN | 9 | §G.1 chooses per move; §G.2 says what each window publishes and what it does not | founder |
| Abstraction layer to swap models | IN | IN | 10 | one no-model launcher emits every provider's argv | SPINE v5 |
| Prompt engineering, versioning, registry | IN | IN | 5 | fifteen agent files, versioned in git and byte-identical for the cache | SPINE v2 |
| Fallback policy on failure/rate-limit | IN | IN | 9 | a family limit reroutes with `/model`; a seat limit cannot be escaped that way | SPINE v22 |
| Cost control per call, daily/monthly budget | IN | RENAMED | 16 | pre-action ceilings; `--max-budget-usd` is a stall fuse and binds no account | SPINE v23 |

### Wing 2 — Planning & cognitive layer

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Planner engine converting intent into sub-tasks | RENAMED | RENAMED | 3 | the Operator dispatches; the Desk ranks and is mostly not a model call | founder |
| Cognitive layer evaluating outcomes before acting | RENAMED | RENAMED | 12 | the reversibility class at the tool boundary — which nothing shipped keys on | SPINE v28 |
| Self-reflection / self-critique before critical actions | RENAMED | RENAMED | 5 | `challenger` before anything irreversible; self-critique alone degrades performance | SPINE v30 |
| Task decomposition logic across agents | IN | IN | 4 | done by the Desk, never by the run, and never splitting one artifact | SPINE v6 |
| Prioritization mechanism for parallel tasks | IN | IN | 4 | the ranking, bounded by the WIP limit and 20 concurrent subagents | fact |

### Wing 3 — Multi-agent orchestration

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Orchestration model (graphs / crews / trees / loops) | RENAMED | RENAMED | 3 | one Operator and three dispatch mechanisms, each used for what it is documented to do | SPINE v13 |
| Agent registry with a profile per agent | REFUSED | IN | 5 | fifteen files, each with model, tools, MCPs, skills and an anchor | founder |
| Task routing | IN | IN | 3 | the Operator routes, and §B.2's last column says when each agent is chosen | SPINE v1 |
| Agent-to-agent protocol (A2A) | REFUSED | RENAMED | 3 | teammate inboxes are JSON files on disk; there is no protocol of our own | SPINE v13 |
| MCP / external tools | IN | IN | 8 | one door, four classes, and a declaration no configuration backs fails the lint | founder |
| Guardrails | RENAMED | RENAMED | 12 | the envelope and the trifecta split: structural, not advisory | SPINE v33 |
| Human-in-the-loop | IN | RENAMED | 3 | a which with both options built; there is no approve verb and, in the night, no question | SPINE v9 |

### Wing 4 — Memory & state

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Short-term memory per task run | IN | IN | 6 | the run's own fresh context, which dies with it | agree |
| Long-term memory persisting across sessions | IN | IN | 13 | an index at start, topic files on demand, delta-only writes | SPINE v27 |
| Episodic memory for debugging and learning | IN | IN | 13 | the event log, one row per event | agree |
| Per-agent/team/global memory permission separation | RENAMED | IN | 13 | the curator is the only writer, and subagent memory is separate by default | SPINE v25 |
| Provenance tags: source, owner, ACL on every item | IN | IN | 13 | source, date, expiry and falsifier — no shipped CLI records source at all | fact |
| Redaction/sanitization before sharing between agents | IN | IN | 13 | redaction before anything leaves the machine, not before it crosses an agent | agree |
| State persistence surviving failures (resume, not restart) | IN | IN | 6 | resume from files, and a goal stays active after transient failures | SPINE v12 |

### Wing 5 — Tool & integration layer

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Tool layer for API calls, file access, code, databases | IN | IN | 8 | four classes, decided by what it costs to undo | founder |
| Vector database + embeddings for semantic search/RAG | IN | IN | 9 | MiniLM locally at 384 dims, with its 256 word-piece truncation stated | SPINE v20 |
| GitHub/CI-CD integration | IN | IN | 8 | the git host read API is admitted first; the venture's own CI is its work | SPINE §F |
| CRM, project management, payments integrations | IN | IN | 8 | CRM read-only for `growth`, and a payments read is the wish list's first entry | SPINE §F |
| Infra layer: hosting, edge functions, serverless | IN | IN | 15 | venture work; the harness's own hosting is the Mac and the lid | ? |

### Wing 6 — Security & governance

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| RBAC for every agent and human on the team | RENAMED | RENAMED | 5 | fourteen grants, one per agent, composed as argv; RBAC assumes many principals | SPINE v34 |
| Full audit logging of every action, decision, tool call | IN | IN | 14 | the event log in OpenTelemetry attribute names, with ids on every row | agree |
| Escalation paths for human intervention on anomalies | IN | IN | 14 | wake-me thresholds, the cord on every page, three interruptions a day | SPINE v4 |
| Secrets management and API key security | IN | IN | 15 | keychain references, and `denyRead` over the credential stores | agree |
| Governance framework defining ownership per layer | RENAMED | RENAMED | 12 | the envelope's lists plus the band table; two lists beat a framework | SPINE §C.1 |

### Wing 7 — Observability & evaluation

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Real-time dashboards tracking agent runs | RENAMED | IN | 14 | pages 1, 2 and 3 — and every number on page 3 taps to something that acts | founder |
| Alerting for failures, infinite loops, cost overruns | IN | IN | 14 | an anomaly taps to the cord, and four unrecoverable errors ends a goal | SPINE v14 |
| Evaluation system checking output against standards | IN | IN | 11 | the anchor per agent, the rehearsal set, and the skill eval loop | SPINE §E.2 |
| Structured logs of full decision chains | IN | IN | 14 | one store read by every page, plus `stream-json` while a run is live | fact |
| KPIs: efficiency, quality, business impact | IN | IN | 21 | the roster's own claim is falsifiable, agent by agent, through its anchor | SPINE v31 |

### Wing 8 — Interface layer

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Streaming chat/UI for real-time interaction | IN | IN | 14 | page 2 messages an agent by writing its inbox file; the Floor is the chat | SPINE v13 |
| Internal dashboard for the dev team | REFUSED | REFUSED | 14 | there is no dev team; the founder is the reader | agree |
| Public/private API for external product integration | RENAMED | RENAMED | 14 | the event log is a file anything can read | agree |
| User and developer documentation | IN | IN | 14 | page 5 shows every engine, gate and store live rather than drawn | SPINE v4 |

### Wing 9 — Human org layer

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Product/Founder owner — strategy, KPIs, prioritization | FOUNDER'S | FOUNDER'S | 2 | the short list of what only the founder does | agree |
| Tech lead/Architect — cross-layer compatibility | REFUSED | IN | 5 | `architect`: the contract before the code, handed over whole | SPINE v7 |
| Agent engineer — builds/tunes agents and prompts | REFUSED | RENAMED | 7 | the skill creator is a program, and the curator writes the artifact | SPINE §E.3 |
| Security/compliance owner — guardrails and audit | REFUSED | IN | 5 | `guard`: security and adversarial review, and every tool admission | SPINE v1 |
| Ops/growth owner — CRM, sales, operational tools | REFUSED | IN | 5 | `growth` and `steward` — the two roster entries with the least outside evidence | SPINE §B.4 |
| QA/evaluation owner — quality metrics and testing | REFUSED | IN | 5 | `tester` writes the anchor test blind; `reviewer` judges what it did not write | SPINE v8 |

## Ensuring all parts work together

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| Define clear contracts between layers (fixed I/O formats) | IN | IN | 6 | the brief and the handover, both fixed-field — and the architect's output is a third | SPINE v7 |
| Build layer by layer, not everything at once | IN | IN | 19 | every ABSENT path in dependency order, and deliberately no schedule | agree |
| Run a 2–3 week assessment mapping existing workflows | RENAMED | RENAMED | 13 | the transcript pass over a snapshot: the assessment already exists and costs no API money | SPINE v26 |
| Pilot on one team/process, measure against baseline, then expand | IN | IN | 21 | one real venture — and with-skill against baseline is the same shape one level down | SPINE §E.2 |
| Avoid tool sprawl: every new tool replaces an old one | IN | IN | 8 | admission names the intent and what it replaces; three substrates were refused on licence alone | SPINE v15 |

## Handoff prompt template for the next team

| Item | FINAL | v2 | v2 § | Why | Rule |
|---|---|---|---|---|---|
| System purpose (one sentence) | IN | IN | 0 | §0 carries the founder's purpose paragraph verbatim | founder |
| Wing map (all 9 wings, what exists vs missing) | IN | IN | 23 | this file is the map, and §17 names what exists and its fate | agree |
| Relevant contacts (owner of each wing) | REFUSED | RENAMED | 5 | fourteen named agents own the work; the founder is still the only human | founder |
| Current state (built, in progress, or only on paper) | IN | IN | 18 | every path is marked ABSENT or named on the branch it exists on | agree |
| Open decisions (unresolved, with both sides' reasoning) | IN | IN | 20 | fourteen, each with both sides and whose decision it is | agree |
| Open-mindedness instruction (rethink, envision, improve) | IN | IN | 22 | the losing image is kept by name in every decisions row | agree |
| Success criteria (measurable KPIs for worked vs didn't) | IN | IN | 21 | the anchor column, and the roster's own claim of fourteen is falsifiable | SPINE v31 |

---

## The tally

**671 rows — every item of FOUNDER-LIST.md at its own granularity, each appearing exactly once.** 35 sections, 9 wings, 2 closing blocks. Counted from this file's own columns, never from memory; re-derive with

```
awk -F'|' 'NF==8 && $2 !~ /^ *(Item|-+) *$/ {gsub(/^[ \t]+|[ \t]+$/,"",$3); gsub(/^[ \t]+|[ \t]+$/,"",$4);
  if($3=="") next; f[$3]++; v[$4]++; if($3!=$4) ch++; n++}
  END{print n, ch; for(k in f) print "FINAL", k, f[k]; for(k in v) print "v2", k, v[k]}' COVERAGE.md
```

| Disposition | v2 | FINAL | Move |
|---|---|---|---|
| IN | **503** | 410 | +93 |
| RENAMED | **90** | 157 | −67 |
| REFUSED | **52** | 77 | −25 |
| OUTSIDE | **13** | 14 | −1 |
| FOUNDER'S | **13** | 13 | 0 |
| **Total** | **671** | **671** | |

**137 rows changed disposition.** The direction is one-way and it is the shape of the founder's five overrules: a plan that refused a roster, a library, a dashboard and a second provider had to call those items REFUSED or RENAMED, and a plan that has all four calls them IN. The largest blocks are §02 (a registry, agent files, names, role definitions, a planner-executor split), §04 (the whole skill library, its router, its manifest, its cut list, its retirement), §10 (mission control and its seven pages), §23–§30 (every department becomes a named agent rather than an assembled loadout), and Wing 9 (four human owner roles become four agents).

**The one row that moved the other way** is `Hiring-pipeline agent`, OUTSIDE → REFUSED: §B.4 refuses it by name because there are no employees, which is a stronger statement than *someone else's problem*.

**A correction to the previous file's own arithmetic, carried here so the two can be reconciled.** Its FINAL column is copied verbatim into this file's second column, and the rows re-derive to **IN 410 · RENAMED 157 · REFUSED 77 · OUTSIDE 14 · FOUNDER'S 13**. Its published tally printed `IN 411` and `OUTSIDE 13`. The row set is the same; its tally was one row out in two cells. Three values in an earlier draft of this file were also mis-transcribed from that table — `maxTurns cap`, `Worker health check` and `Cache read discount` — and were corrected against the source before this tally was computed.

### The eight `?` rows

Placements this file could not settle from its inputs. Every one is a disposition question, not a section question, except where noted.

| Row | Section | The doubt |
|---|---|---|
| Agent color tag | 02 | SPINE is silent. FINAL refused colour as a terminal convenience, and that reason survives; but agents are named and persistent now and page 1 renders each as an avatar, which is the case for an identity marker. Left REFUSED on FINAL's reason |
| Compute rental tool | 03 | §F refuses **RunPod as it stands** — it spends money at a rate under an uncapped key — which is not the same as refusing rented compute as a class. Read as REFUSED for the named vendor only |
| Worker-to-worker request | 06 | v13 admits agent teams whose teammates are messageable by name, so peer messaging exists; v6's reasoning is that implicit conflicting decisions are exactly how two agents on one artifact fail. Both are in the spine |
| Peer help request | 06 | the same doubt, and it should be answered the same way in both places |
| Improvement backlog | 12 | a **section** question, not a disposition one: §K names no self-improvement section, so this is placed at §2 as an intent. Whoever writes §2 should confirm it wants the row |
| Second human role | 14 | FINAL has it IN with a 72-hour freeze; SPINE §I row 11 lists it as an open founder decision. Placed IN at §20, which reads as both and settles neither |
| Ticket status field | 22 | the board is the founder's page 4 and its stages are certain; whether dragging a card launches a **team** is open decision 9, and nothing in the world has done it |
| Infra layer (Wing 5) | wing 5 | IN here, while every venture-facing DevOps row of §17 is OUTSIDE. The two readings disagree about who owns hosting, and FINAL had the same split |

**How the 671 were decided.** `agree` where SPINE moved nothing and FINAL stands. `SPINE vN` or `SPINE §X` where a v2 row or a lettered section settles it — v1, v2, v3 and v4 between them account for most of the 137 moves, and every one of §A's thirty-six rows is cited by at least one item. Verify with `grep -oE 'SPINE v[0-9]+' COVERAGE.md | sort -u`. `founder` where the direction itself decides, quoted in SPINE §B, §C, §D, §E, §F or §G. `fact` where a research fact from `roster.md`, `memory.md`, `cognition.md`, `skills.md`, `models.md`, `surfaces.md` or `runtimes.md` decides the row rather than a preference.

**No row is placed on a mechanism that does not exist.** Where the plan wants a thing and has no mechanism for it, the row says so in its Why — the wish-list tools of §F, the ABSENT paths of §B–§H, and `Improvement backlog`'s missing section are the honest cases, and they are marked rather than dressed.
