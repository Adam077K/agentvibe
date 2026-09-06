## 19 · Build order, by dependency

*obeys: every ABSENT path named in SPINE §B–§H, **and, since 2026-09-06, every ABSENT path named in SPINE §L — O1–O80
from the rethink round and O81–O127 from the fixer round (SPINE §K row 19, sixth column)** · inherits: FINAL §18*

**(FINAL)** No durations, no schedule, no first month. Each arrow reads **needs**. ~~The three-first rule stands — the
logbook, transcript mining, one real venture driven~~ **The three-first rule is amended, not reversed: the data files
and the logbook, one venture with a stranger, and the reconciler with its instruments — mining moves to fourth,
because it is the founder's past and not the market's present, and O88's exclusions must land before it runs**
(amended 2026-09-06: NEW: O101, O106 / FIXER: C) — and the seam nodes sit where the measured facts put them:
**nothing unattended runs before the managed settings file exists, and nothing is trusted before the probe has run.**

**(NEW: O125 — the preamble names each node's builder, by class, so the runbook can count founder acts against it)**
Every node below is built by exactly one of four hands, and the class is derivable from `roster.yml` and
`rules.yml` rather than from this paragraph: **the founder** — the stadium-shaped `FOUNDER ACT` nodes, each one
act counted by `bin/log` against `keel/host/RUNBOOK.md` (O125, ABSENT); **the trusted base** — `send`, `inbound`,
`watch`, `run`, founder-line-reviewed at a line budget with `keel/fixtures/` as their only admission and a sign-off
per wave (FOUNDER, fixer round 2026-09-06: E4 · v88 · NEW: O103); **a generator** — every agent file, §1's tables,
the constitution and the runbook are rendered from `roster.yml` and `rules.yml`, and a hand-edited rendered artifact
fails lint (NEW: O106, O107 · v97); **a builder run, `keel/**` at `lite`** — everything else, which is most of the
graph (v88). The commodity line sorts before the dependency order sorts (v96, O105): a node marked *adapter* is the
thinnest reader of the vendor surface drawn behind it, and a matched `vendor_wins_if:` deletes the node rather than
re-implementing the surface.

**(NEW: three stages, and the night is behind a measurement)** **Stage 1 — the bounded day, on this Mac, founder
present:** the data files, the logbook, `bin/run`, the reconciler with its read-only instruments, the Sender staged
behind a tap, and two ventures — the harness and the stranger. The Watch dispatches only while `founder.lease` is
fresh (NEW: O86). **Stage 2 — the night, on this Mac, behind §20.2 row 12:** `bin/watch` with the `night_capable`
predicate, and row 12's comparison read only after three scoreboard rows exist (FOUNDER, fixer round 2026-09-06: E1,
E13 · v83, v84, v106 · NEW: O81, O124). **The fallback, not a stage — the cloud lane:** when `night_capable` is false
an unattended brief is refused with its reason and routed to the cloud carrier where the charter says `cloud: allow`
(v56, v79, O81). **The images not taken are named here so no reader draws them back:** there is **no `BOX` root** —
the always-on box the three fixer lanes drew was overruled, *"dont need for now. use this mac and when cant use
cloude"* (FOUNDER, fixer round 2026-09-06: E1 · §J 73); there is **no `NULLWEEK`** — the vanilla-runtime week was
overruled, *"No, compare Keel's modes only"* (E14 · §J 75); there is **no `CHECKERKEY`** — *"no keys, codex and
gemini cli use."* (E7 · §J 74), so the second family enters through the `GEMINI` and `CODEX` acts that were already
drawn, as `bin/run` children from launchd (NEW: O92). (THINKER: A1, C9, C13 for the reasoning each image carried;
FIXER: A, B, C each drew the box.)

**(NEW: the founder's own acts are nodes, because four of them gate whole subtrees)** The managed settings file, the
`gemini` authentication, the Codex install, the agent-teams flag and one fetch of `LICENSE-CONTENT` are things only
the founder can do. FINAL kept them in §19 as open decisions; v2 also draws them here, because a graph that omits its
blocking inputs reads as if the work could start.

**(FOUNDER, 2026-09-05: all five founder-act nodes are now DECIDED, and they stay nodes anyway)** The interview
settled every one of them — the managed file is written at build start, `gemini` authenticates on a personal Google
account, `codex` is installed when building starts, agent teams are **on** with no model constraint (v59), and
`LICENSE-CONTENT` is fetched at build time. **A decided act is still an act**: none of these has been performed, each
still gates what it gated, and deleting the nodes because the decision is made would hide five things that must
happen before the graph below can move. That is why each node now carries its decision rather than being removed.

---

### 19.1 The graph

```mermaid
flowchart TD
    RULES["0 · keel/shared/rules.yml · v97 O106<br/>the binding content is DATA — id · rule · mechanism · path ·<br/>state · class · wins_if · vendor_wins_if · section — and the<br/>prose tables are RENDERED from it; a hand-edited one fails lint<br/>· the graph's second root, only because all else renders from it"]
    CONSTITUTION["keel/constitution.md · O107<br/>≤ 4,096 bytes from §0.3 and rules.yml · the Operator's<br/>pre-flight read · byte-identical for the cache"]
    RUNBOOK["keel/host/RUNBOOK.md · O125<br/>generated from rules.yml where state: absent plus the<br/>founder-act list · bin/log counts every act against it"]
    SETTINGS["keel/shared/schemas/settings.yml · v104 O118<br/>the dial inventory: default · evidence · label · last_touched<br/>· a dial with no evidence line fails lint"]
    FACTS["keel/shared/facts.yml units table · v104 O117<br/>tokens/run · runs/window · wall-clock/run · intents/week ·<br/>decisions/day, each dated, written by the meter"]
    LOG["1 · The logbook<br/>keel/bin/log · keel/logbook/{events,ledger}.jsonl ·<br/>an id on every row · F_FULLFSYNC · gen_ai.* names ·<br/>~/.agentvibe/events.jsonl adopted as the spine ·<br/>founder.act on every tap, sign-off, terminal open, read-back (O95)"]
    MANAGED(["FOUNDER ACT · the managed settings file<br/>permissions.deny · disableBypassPermissionsMode · and NOTHING<br/>ELSE — disableAutoMode is struck (v92, E9) · NOT the two hook<br/>settings (v11) · DECIDED 2026-09-05: written at build start"])
    GEMINI(["FOUNDER ACT · authenticate gemini<br/>one terminal act; 0.38.2 installed, never authenticated<br/>DECIDED 2026-09-05: a personal Google account · NO KEY (v90, E7):<br/>the CLI, only as a bin/run child from launchd (O92, W37)"])
    CODEX(["FOUNDER ACT · install codex<br/>command -v codex is absent today<br/>DECIDED 2026-09-05: installed when building starts ·<br/>NO KEY (v90, E7): the CLI, as a bin/run child from launchd"])
    TEAMS(["FOUNDER ACT · CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1<br/>experimental, no nested teams<br/>DECIDED 2026-09-05, v59: ON, and no model constraint —<br/>a teammate runs on its own file model"])
    LICENSE(["FOUNDER ACT · fetch and read LICENSE-CONTENT<br/>one fetch; unblocks the 2,111+ (v17)<br/>DECIDED 2026-09-05: fetched at build time; row stays open"])
    HOSTED(["FOUNDER DECISION · which hosted lane may make when the<br/>Mac cannot hold a night (§I row 15) · R5 DONE: 156 h of log,<br/>ZERO gaps of an hour — the tail is zero over the week measured ·<br/>RE-READ under E1/E13: with no box this lane is the night's<br/>FALLBACK, so v56(b)'s UNVERIFIED maker path is on the first<br/>night's critical path · R37 replaces the week (O82) ·<br/>cloud: allow | deny, default deny, decided either way (v79)"])

    AGENTS1["WAVE ONE · ten agent files (v54, widened by v70)<br/>operator · builder · reviewer · architect · tester ·<br/>guard · scout · designer · curator · challenger<br/>.claude/agents/*.md · GENERATED from roster.yml, signed off<br/>per wave (v88, O103) · prompt-standard.test.mjs's model set<br/>moves in the same change: builder and architect declare<br/>claude-fable-5-1 (v57)"]
    AGENTS2["WAVE TWO · five agent files (v54, narrowed by v70)<br/>product · analyst · writer · growth · steward · written when a<br/>venture needs them — the stranger is the venture that will (C1)<br/>· two exercised carriers first (O120) · each brings its own argv"]
    ARGV["keel/shared/argv/&lt;agent&gt;.&lt;provider&gt;.argv<br/>the grant IS these strings · claude, gemini and codex rows"]
    PROBE["keel/bin/probe · nightly, what a run can actually touch<br/>authored APART from the launcher, asserts by attempting (O93) ·<br/>denyread.yml from both contexts (O92) · sleeps a child (O81) ·<br/>a keychain read of a founder item from a night child MUST FAIL,<br/>a pass is a wake-me (O83, the one-machine drill, E1)"]
    RUN["keel/bin/run · the only thing that composes argv<br/>mints the UUID · writes sessions.jsonl · a THIN composer over the<br/>vendor floor, narrows and never widens (O104) · bare claude -p in<br/>a detached tmux session, never --bg (O91) · --no-session-<br/>persistence (O88) · --settings per child (O87, R28) ·<br/>--fallback-model with PreModelSwitch blocking an unrehearsed<br/>family (O89) · --autocompact at full context (O90) ·<br/>--deny-carrier (O120) · the grant from two-way verbs (O109) ·<br/>seed: mission-control/scripts/consume-dispatch.ts"]
    OPREG["Operator registry · v91 O84<br/>kind: operator rows in sessions.jsonl with a heartbeat · N<br/>Operators (W41) · a which answered only by its claimant · gate 2<br/>per venture · WIP counts sessions"]
    STOP["keel/bin/stop · v102 O85 · ONE stop verb<br/>--night signals bin/run's process groups and stops dispatch;<br/>--all also SIGTERMs every Operator · four receivers, one record"]
    TCB["The trusted base · v88 O103<br/>send · inbound · watch · run: world_touching, max_lines,<br/>authored_by in roster.yml · founder-line-reviewed ·<br/>keel/fixtures/ their only admission · keel/** otherwise lite"]
    CARRIERDRILL["The carrier drill · v105 O120<br/>v78's drill once with the Claude carrier denied · a carrier<br/>dimension on trust · stores readable by -p from any provider"]

    STORES["keel/bin/check-stores<br/>charter · intent · obligation · memory schemas · every: and on:<br/>with a per-run ceiling (v55) · refuses driven with no outcome:<br/>(O98) · rung 1 unjudged (O108) · a trusted-base file over budget<br/>(O103) · a memory falsifier that is not executable (O113)"]
    PRICES["keel/shared/prices.yml + the model-expiry rows<br/>of keel/shared/facts.yml · cache 1.25x/2x, read 0.1x/0.025x ·<br/>a context: column per model for --autocompact (O90)"]
    METER["The meter · page 3's numbers · the runner's own cost<br/>joined by id · writes the units table (O117) · the shadow subsidy<br/>line, Σ shadow USD ÷ the seat price (O116, R35) · control charts<br/>over the Watch's own rates (O123, R36)"]

    MINE["2 → 4 · Transcript mining · bin/mine --since<br/>a batch pass over a snapshot, never a live parser · reads only<br/>the Floor's ~/.claude/projects, REFUSES taint ids (O88, E10) ·<br/>taste · negatives · already-built · rehearsal candidates ·<br/>fourth now: the founder's past, not the market's present (FIXER: C)"]
    CURATE["keel/bin/curate + the curator, nightly<br/>the only writer of memory · delta-only · GRADED (O113): the<br/>held-out test before it may judge, a calibration seed it never<br/>edits, a nightly canary · the taste control arm (O97)"]
    REHEARSE["keel/bin/rehearse<br/>known-answer cases · scores.jsonl · the trust floor · every<br/>anchor prints ANCHOR &lt;name&gt; exit=&lt;code&gt; (O110, R17)"]
    ADEQUACY["Two axes on every anchor · v100 O108<br/>verifier: world | other-family | founder | same-family ·<br/>adequacy: pass | fail | unjudged, by a reader who wrote neither ·<br/>rung 1 ONLY when world AND pass · before the first rung-1 claim"]
    R27RUN["R12's runner · O102 (R27) · keel/bin/rehearse --r27<br/>(a) the harness's first thirty · (b) thirty Floor episodes<br/>labelled by one Sonnet -p pass, rated in one sitting, plus thirty<br/>paper done-tests across §23–§30 · (c) the stranger's first thirty ·<br/>§I row 16 is settled by (b) and (c), never (a) alone"]
    BRIEFING["keel/bin/briefing · the briefing generator<br/>the keel briefing verb · first line: decisions taken · deferred ·<br/>defaulted, with the founder-minutes each cost (O95, O96) ·<br/>the agreement rate (O97, v89) · the shadow subsidy line (O116, R35)<br/>· the control charts incl. the Watch's four rates (O74, O123) ·<br/>the restore drill's number (O76) · page 5's strip renders it"]

    SKILL["keel/bin/skill · the library · registry.yml ·<br/>.agents/skills/ generated beside .claude/skills/ · admission<br/>PROVISIONAL, joined to O41 with an evidence block (O114, R14)"]

    DOOR["keel/bin/door + keel/shared/tools/&lt;name&gt;.yml<br/>+ checklist.md · read-only instruments admitted first"]
    VERBS["The verb table · v101 O109<br/>tools/&lt;name&gt;.yml verbs: [{name, effect, reversible, undo,<br/>drilled}] · an unlisted verb is ONE-WAY · bin/run composes the<br/>grant from two-way verbs · §12.2's run-side question is DELETED"]
    DRILL["keel/bin/drill<br/>exercises a tool's undo; writes only a date"]
    INBOUND["keel/bin/inbound · the world's door · trusted base<br/>one row per thing the world sent, as quoted data · with scout,<br/>the only reader of a tainted source (v36) · in keel/fixtures/<br/>before pages 1, 6, 7 (O101)"]
    SENDER["keel/bin/send · the Sender · trusted base<br/>no model; the only thing that sends · reads the ladder step, the<br/>verb table, consent and disclosure at every step (O100, O109)"]
    LADDER["The widening ladder per outward class · v94 O100<br/>keel/shared/tools/&lt;class&gt;.yml: step · n_recall_free ·<br/>recall_count · widened_at · undo_drilled · first-contact<br/>reachable like any class after N recall-free sends (E11) ·<br/>a recall narrows one step"]
    RECON["keel/bin/reconcile · reads a record the company does<br/>not write · the ONLY writer of market.jsonl (O99) · writes<br/>recalls into the ladder (O100)"]
    MARKET["keel/shared/market.jsonl · v99 O99 · house scope<br/>one row per contact-rung movement, read by every Desk and<br/>slice · the ship log becomes a view"]

    READBACK["The read-back page<br/>nothing binds by voice"]
    CLOUD["The cloud lane · THE NIGHT'S FALLBACK (v83, E1)<br/>output lands as a PR or staged artifact · bin/run's cloud carrier<br/>mints and records only · the Watch reads PRs on wake · a brief<br/>refused by night_capable is routed here where cloud: allow (O81)<br/>· STILL SHUT for making by v67 (stop: UNKNOWN) — which is why<br/>v56(b)'s UNVERIFIED is on the first night's critical path"]
    POWER["keel/host/power.yml · v84 O81<br/>night_capable from pmset every tick (AC · sleep 0 or<br/>disablesleep 1 · assertions) · an unattended: true brief is<br/>REFUSED with the reason when false · a predicate, not a habit (W33)"]
    FOUNDERLEASE["keel/logbook/founder.lease · v102 O86<br/>founder.last against a second, longer horizon · the Watch mints<br/>NOTHING unattended while it is stale — absence is the stop"]
    WATCH["3 · keel/bin/watch and the Desk · trusted base<br/>obligations first · a LaunchAgent that exits · night_capable<br/>each tick, a refused brief routed to the cloud carrier (O81) ·<br/>which admission control, six per five-hour window until R34<br/>(v87, O96) · outcome distance as the tie-break (O98) ·<br/>founder_hours: reported at 20, never silent (v86, O95) · the<br/>wake reconciler reads the daemon roster read-only (O15, O91)"]
    SCOREBOARD["keel/logbook/nights.jsonl · v106 O124<br/>one row per attempted night, by programs only: nights_attempted<br/>· night_capable_all_night · runs_minted · handovers_with_<br/>anchor_line · orphaned · founder_taps · founder_minutes ·<br/>shadow_usd · contact_rung_moves"]

    MC["mission-control/ server + client, kept · the website's<br/>runtime · order 4 → 5 → 3 → 2 → 7 → 1 → 6 (v95, E12)"]
    P2["Page 2 · agents and child flows · adapter · TWO verbs<br/>(O121, W34): attach: where sessions.jsonl carries a tmux name;<br/>message: for in-process teammates · terminal: ghostty"]
    P3["Page 3 · cost, tokens, efficiency · adapter · every number<br/>taps · reads rate_limits (W4) · shows night_capable (O81)"]
    P4["Page 4 · tasks, tickets, PRs · FIRST (v95)<br/>a card launches a session; its solo | team toggle<br/>decides which shape (v60)"]
    P5["Page 5 · engines, gates, stores, live · SECOND (v95)"]
    P1["Page 1 · the office · adapter · pixel-agents (MIT, read<br/>from file) through the door · our event-log → AgentEvent writer"]
    P7["Page 7 · canvas / playground · adapter<br/>Langflow idiom · --session-id then attach"]
    GRAPHLANE["A research lane on repository-to-graph tooling<br/>the thinnest-evidenced area; runs BEFORE the extractor (v61)"]
    EXTRACT["The repository-to-graph extractor<br/>ours; 3d-force-graph reads {nodes, links} only"]
    P6["Page 6 · 3D file graph<br/>LAST of the seven pages (v61, v95)"]

    CODEXTEST["The Codex headless rehearsal · R10<br/>codex exec --json · no controlling TTY ·<br/>non-trivial prompt · THE INSTALLED VERSION, RECORDED (W19)<br/>not the retired >= 0.124.0 floor: 0.153.4 ships today, so<br/>that floor is 29 minor versions stale and discriminates nothing"]
    VENTURE["3 · One real venture, driven — the harness (v64)<br/>a real done-test and a rung-1 anchor · its outcome: is the<br/>founder's line (v98)"]
    STRANGER["The second venture · v85 O101 (E2) · in WAVE ONE<br/>customer-facing, from the founder's existing projects, named at<br/>intake · outcome: at contact rung 2, checked by a record the<br/>company does not write (v98) · cloud: on its charter (v79)"]
    OVERNIGHT["The first measured overnight · §20.2 row 12<br/>Keel's two modes compared on the same venture AFTER three<br/>scoreboard rows (v106, O125) · NOT a vanilla week (E14, §J 75) ·<br/>EXITS on a contact-rung movement on the stranger that<br/>bin/reconcile recorded (O101)"]

    ROSTER["keel/shared/roster.yml · O2 · ONE roster file<br/>frontmatter, argv paths, color, wave, valid_until (v72), maxTurns,<br/>isolation, anchor, pack paths and state (O111) · trust: probation<br/>| scored | unroutable per move class (v103, O112) · the trusted<br/>four's budgets (O103) · agent files GENERATED from it"]
    PACKS["The onboarding packs · v71 as amended by v103 O111<br/>state: seed | harvested · a SEED pack needs the rehearsal case<br/>(a reference into keel/golden/, never a body) and namespaces;<br/>its first dispatch IS the demonstration; the exemplar is<br/>harvested after N anchored handovers · WITHOUT A SEED PACK AN<br/>AGENT IS DECLARED AND NOT ROUTABLE · probation runs only on the<br/>Floor or under a founder-authored intent (O112)"]
    ROUTING["keel/shared/routing.yml · O5<br/>which agent, which model, which band — answered ONCE and<br/>generated into §B.2, §C.1 and §9.2, which today answer it<br/>in three places with nothing checking that they agree"]
    SCHEMAS["keel/shared/schemas/ · O3 O4 O6 O7<br/>charter.yml with outcome: (O98), cloud: (v79), founder_hours:<br/>(v86) · brief.yml, eleven fields (v45) · event.yml with<br/>schema_version · the handover's five fields plus verifier: and<br/>adequacy: (O108) · the which's three fields (O96)"]
    WORK["keel/ventures/&lt;v&gt;/items/ · O1<br/>w-*.yml with intent, purpose, ceiling, blocked_on, attempts,<br/>last_failure, card · drafts in items-draft/ · A BOARD CARD IS A<br/>VIEW OF A WORK ROW · a standing intent EXPIRES (O126)"]
    DECIDE["keel/logbook/decide.jsonl · O9 · one house queue<br/>a row with no intent id is refused · the night escalation target,<br/>never the Operator (O49) · claim: (O84) · recommendation_shown:<br/>(O97) · a ratified row reopens here with a falsifier (v89)"]
    GOLDEN["keel/golden/ · O11 · eval-only bodies, so the case that<br/>will judge a run cannot be read by that run · the seed pack's<br/>rehearsal case lives HERE and is referenced (O111)"]
    PAGEMAN["keel/surfaces/pages/&lt;n&gt;.yml · O12<br/>every element resolves to a store path or a bin/ verb · page 1<br/>loses the venture toggle · pages/2.yml declares attach: and<br/>message: (O121)"]
    HOST["keel/host/ · O10 · the one place the machine is declared<br/>plist · managed-settings template · env · sandbox block ·<br/>denyread.yml, the REAL list incl. ~/.gemini ~/.codex<br/>~/.config/openai ~/.claude/{daemon,jobs,routines} (O92, W37) ·<br/>power.yml"]
    CONSENT["keel/consent.yml + keel/subjects/&lt;hash&gt;.yml · v69<br/>ONE writer, read by the Sender BEFORE any contact · log and<br/>memory hold a hash, never a body · the erasure grep covers<br/>~/.claude/projects (v93, E10) · in keel/fixtures/ before pages<br/>1, 6, 7 (O101)"]
    HIGHWATER["keel/logbook/window-highwater.yml · v74 O115<br/>tokens observed, no denominator published · SEEDED from<br/>budget-guard.js (W39), seed: true, replaced by the first observed<br/>week · wall clock beside it, USD as a shadow price"]
    FOUNDERLAST["keel/logbook/founder.last · v76 as amended (E6, O127)<br/>ONE predicate at FOUR call sites — away, the reserve goes ONLY to<br/>effect: none work whose outputs stage · NO one-way default fires<br/>while away, the verb table decides · one option built instead of<br/>two · since you were last here, keyed on the event · the burst<br/>edge pauses Claude-seat autonomy until the window rolls"]
    SKILLBUDGET["The per-agent startup metadata budget · v77<br/>modelled on scripts/check-memory-budget.mjs, which EXISTS ·<br/>measures its own constant, not the spec's 100 (O119, W40) ·<br/>R8 runs BEFORE the import and can retire it outright"]
    FRESH["The scout standing intent · v81 · re-fetches every row<br/>carrying source: and valid_until on the free Gemini window · a<br/>changed fact opens a Decide item NAMING the row · v55's shape ·<br/>expires like every standing intent (O126) · pmset -g log as a<br/>second standing intent → facts.yml mac-off-hours (O82, R37)"]

    EGRESS["keel/bin/egress · v68 as THREE transports (O94, W36)<br/>a stdio MCP server per child named alone in --strict-mcp-config<br/>· the sandbox network block for Bash · credentials.injectHosts<br/>where R2 shows it injects · NOT a loopback proxy (§J 86)"]
    WORKTREE["keel/bin/worktree · O14 · adapter<br/>a run NEVER creates its own — git worktree add cannot<br/>complete under the armed sandbox and escalation is<br/>unavailable to an unattended run · it is handed one"]
    LEASE["logbook/watch.lease · O16<br/>host id and heartbeat · the Watch will not tick and the<br/>Sender will not act without it, so the restore drill's<br/>clone can never send twice"]
    REDACT["keel/bin/redact · O17 O66<br/>ONE redaction where there were two · the PII gate on the<br/>Sender's checklist and the mining pass, its<br/>false-positive rate measured for a week before it blocks"]
    BELL["keel/bin/bell · O18 O122 · adapter · the only thing that<br/>may ring · WRAPS the vendor's push, adding only the classes, the<br/>budget and the acted-on rate"]
    REPLAY["keel/bin/replay-desk · O20 · deterministic, free ·<br/>settles v75 without living a month · R38's tide runs here (§J 80)"]
    HORIZON["keel/bin/horizon · O23 O126 · one pass over every<br/>durable store: forced disposition at expiry plus a LAPSE RECORD ·<br/>a standing intent's Refresh · Deprecate · Waive with a new date"]
    INTEND["keel/bin/intend · O60<br/>bug intake: an anchor that fails twice writes a card<br/>whose done-test IS the reproducing command; with no<br/>reproduction it is a bounded question for scout"]
    LOCAL["keel/bin/embed · keel/bin/classify · O13<br/>the local tier has no reachable carrier — the sandbox<br/>denies a loopback bind and curator holds no Bash ·<br/>no-model programs handing the curator a file<br/>DEPENDS ON R4"]
    FIXTURES["keel/fixtures/ · O78 O79 O103 · a scratch house<br/>the Sender, Watch, door and launcher have no test seam, and a<br/>Sender defect cannot be recalled · blue-green at a tick boundary<br/>· the trusted base's ONLY admission; bin/run passes here before<br/>minting unattended work · the nightly canary (O113) · it widens<br/>the floor and the probe must refuse it (O104)"]

    VS_PMSET>"vendor surface · pmset -g custom / -g log / assertions"]
    VS_FLAGS>"vendor surface · claude -p --restricted --tools --settings<br/>--no-session-persistence --autocompact --fallback-model --tmux (W35)"]
    VS_DAEMON>"vendor surface · the daemon (W38): leases, idle exit, roster.json<br/>· bin/supervise is REFUSED beside it until R31 (O91) — NOT drawn"]
    VS_AGENTS>"vendor surface · claude agents --json --all · SendMessage /<br/>ListAgents · tmux session names and %N pane ids"]
    VS_RATELIMITS>"vendor surface · rate_limits.spend_limit and the /usage fields (W4)"]
    VS_PUSH>"vendor surface · agentPushNotifEnabled, the vendor's push"]
    VS_SANDBOX>"vendor surface · the sandbox network and credentials blocks ·<br/>--strict-mcp-config · stdio MCP"]
    VS_GOAL>"vendor surface · /goal and its evaluator (R17)"]
    VS_WORKTREE>"vendor surface · -w / --worktree"]

    RULES --> CONSTITUTION
    RULES --> RUNBOOK
    RULES --> SETTINGS
    RULES --> SCHEMAS
    RULES --> ROSTER
    RULES --> ROUTING
    RULES --> LOG
    RULES --> STORES
    CONSTITUTION --> RUN
    RUNBOOK --> LOG
    SETTINGS --> WATCH
    SETTINGS --> DECIDE
    SETTINGS --> RUN
    FACTS --> OVERNIGHT
    METER --> FACTS
    LOG --> RUN
    LOG --> MINE
    LOG --> STORES
    LOG --> METER
    LOG --> MC
    LOG --> SCOREBOARD
    LOG --> OPREG
    MANAGED --> HOST
    HOST --> PROBE
    HOST --> POWER
    POWER --> WATCH
    POWER --> P3
    PROBE --> RUN
    ROSTER --> AGENTS1
    ROSTER --> TCB
    TCB --> FIXTURES
    AGENTS1 --> ARGV
    ARGV --> RUN
    ARGV --> PROBE
    ARGV --> CARRIERDRILL
    CARRIERDRILL --> AGENTS2
    RUN --> OPREG
    OPREG --> WATCH
    OPREG --> DECIDE
    OPREG --> P2
    RUN --> STOP
    SENDER --> STOP
    STOP --> WATCH
    STOP --> P2
    RUN --> METER
    RUN --> CLOUD
    HOSTED --> CLOUD
    PRICES --> METER
    PRICES --> RUN
    STORES --> READBACK
    STORES --> PRICES
    MINE --> CURATE
    MINE --> REHEARSE
    MINE --> R27RUN
    STRANGER --> R27RUN
    RUN --> REHEARSE
    REHEARSE --> ADEQUACY
    STORES --> ADEQUACY
    ADEQUACY --> VENTURE
    ADEQUACY --> STRANGER
    LICENSE --> SKILL
    AGENTS1 --> SKILL
    REHEARSE --> SKILL
    PROBE --> DOOR
    DOOR --> VERBS
    VERBS --> RUN
    VERBS --> SENDER
    VERBS --> FOUNDERLAST
    DOOR --> DRILL
    DOOR --> INBOUND
    DOOR --> RECON
    DRILL --> SENDER
    INBOUND --> SENDER
    INBOUND --> WATCH
    READBACK --> WATCH
    CLOUD --> WATCH
    METER --> WATCH
    REHEARSE --> WATCH
    WATCH --> SCOREBOARD
    SCOREBOARD --> OVERNIGHT
    SCOREBOARD --> P5
    RECON --> MARKET
    MARKET --> WATCH
    MARKET --> OVERNIGHT
    CONSENT --> LADDER
    RECON --> LADDER
    LADDER --> SENDER
    MC --> P2
    MC --> P3
    MC --> P4
    MC --> P5
    MC --> P1
    MC --> P7
    TEAMS --> P2
    RUN --> P2
    RUN --> P4
    RUN --> P7
    METER --> P3
    STORES --> P5
    P4 --> P5
    P5 --> P3
    P3 --> P2
    P2 --> P7
    P7 --> P1
    GRAPHLANE --> EXTRACT
    EXTRACT --> P6
    MC --> P6
    P1 --> P6
    GEMINI --> ARGV
    CODEX --> ARGV
    CODEX --> CODEXTEST
    ARGV --> CODEXTEST
    WATCH --> VENTURE
    P4 --> VENTURE
    RECON --> VENTURE
    SKILL --> VENTURE
    VENTURE --> STRANGER
    INBOUND --> STRANGER
    CONSENT --> STRANGER
    SENDER --> STRANGER
    RECON --> STRANGER
    STRANGER -.->|"when a venture needs them (v54)"| AGENTS2
    VENTURE -.->|"when a venture needs them (v54)"| AGENTS2
    STRANGER --> OVERNIGHT
    SENDER --> P1
    SENDER --> P7
    SENDER --> P6

    ROSTER --> PACKS
    PACKS --> ROUTING
    ROUTING --> RUN
    ROSTER --> P2
    SCHEMAS --> LOG
    SCHEMAS --> RUN
    SCHEMAS --> STORES
    STORES --> WORK
    WORK --> P4
    WORK --> WATCH
    INTEND --> WORK
    STORES --> INTEND
    LOG --> DECIDE
    STORES --> DECIDE
    DECIDE --> P4
    DECIDE --> P5
    HORIZON --> DECIDE
    HORIZON --> WORK
    STORES --> HORIZON
    REHEARSE --> GOLDEN
    GOLDEN --> SKILL
    GOLDEN --> CURATE
    PAGEMAN --> MC
    INBOUND --> CONSENT
    STORES --> CONSENT
    CONSENT --> SENDER
    METER --> HIGHWATER
    HIGHWATER --> WATCH
    LOG --> FOUNDERLAST
    FOUNDERLAST --> WATCH
    FOUNDERLAST --> DECIDE
    FOUNDERLAST --> P5
    FOUNDERLAST --> FOUNDERLEASE
    FOUNDERLEASE --> WATCH
    SKILL --> SKILLBUDGET
    GEMINI --> FRESH
    WATCH --> FRESH
    FRESH --> DECIDE
    FRESH --> FACTS
    DOOR --> EGRESS
    EGRESS --> INBOUND
    EGRESS --> SENDER
    EGRESS --> RECON
    WORKTREE --> RUN
    LEASE --> WATCH
    LEASE --> SENDER
    REDACT --> MINE
    REDACT --> SENDER
    WATCH --> BELL
    WATCH --> REPLAY
    METER --> BRIEFING
    DECIDE --> BRIEFING
    MARKET --> BRIEFING
    BRIEFING --> P5
    LOCAL --> CURATE
    FIXTURES --> SENDER
    FIXTURES --> INBOUND
    FIXTURES --> WATCH
    FIXTURES --> RUN
    FIXTURES --> DRILL
    FIXTURES --> CURATE

    VS_PMSET -.-> POWER
    VS_PMSET -.-> FRESH
    VS_FLAGS -.-> RUN
    VS_DAEMON -.-> RUN
    VS_AGENTS -.-> P2
    VS_RATELIMITS -.-> P3
    VS_RATELIMITS -.-> HIGHWATER
    VS_PUSH -.-> BELL
    VS_SANDBOX -.-> EGRESS
    VS_GOAL -.-> REHEARSE
    VS_WORKTREE -.-> WORKTREE
```

---

### 19.2 Every ABSENT path of SPINE §B–§H, and the one node it appears in

**(NEW: the graph claims completeness, so the claim is made checkable)** One row per ABSENT path. If a path appears in
two nodes the graph is wrong, and this table is how that is found. **The rethink round's own paths — SPINE §L — are
in 19.2a below**, in three groups, because they arrived as a set and behave as three kinds.

| ABSENT path or artifact | SPINE | Node |
|---|---|---|
| `.claude/agents/operator.md` and the ~~seven~~ **nine** other wave-one files — including `curator` and `challenger` *(moved 2026-09-06: D5 → v70)* | §B.2, §C, v54, **v70** | `AGENTS1` |
| The ~~seven~~ **five** wave-two agent files — product · analyst · writer · growth · steward ~~· curator · challenger~~ *(moved 2026-09-06: D5 → v70 — the last two are wave one)* | §B.2, v54, **v70** | `AGENTS2` |
| `keel/shared/argv/<agent>.<provider>.argv` | §B.1 rule 1, §H.1 | `ARGV` for wave one; each wave-two file brings its own with it (v54) |
| `keel/bin/run` | §B.1 rule 1, §C.4, v34 | `RUN` |
| `keel/bin/probe` | §B.1 rule 4, v34 | `PROBE` |
| `keel/bin/log` and `keel/logbook/` | §B.1 rule 4 | `LOG` |
| `keel/logbook/sessions.jsonl` | §D.2, §17.4.1 | `RUN` (its one writer) |
| `keel/bin/watch` and the Desk | §B.1 rule 4, §D.2 | `WATCH` |
| `bin/run`'s `cloud` carrier (mints and records only) and the Watch's on-wake read of PRs | §I row 15, v56 | `CLOUD` |
| ~~`keel/bin/supervise`~~ **REFUSE** — the vendor ships a daemon with leases and an idle exit (W38); `bin/supervise` is not built until R31 reads its semantics, and the wake reconciler reads the daemon roster read-only (amended 2026-09-06: NEW: O91 / THINKER: A7) | §B.1 rule 4 · **§L O91** | ~~`SUPERVISE`~~ **no node** — the daemon is `VS_DAEMON`, a vendor surface behind `RUN` |
| `keel/bin/send` — the Sender | §B.1 rules 3 and 4, §C.1, §F | `SENDER` |
| `keel/bin/inbound` — the world's door | §B.1 rule 4, v36 | `INBOUND` |
| `keel/bin/door` and `keel/shared/tools/<name>.yml` + `checklist.md` | §B.1 rule 4, §F | `DOOR` |
| `keel/bin/drill` | §B.1 rule 4, §F | `DRILL` |
| `keel/bin/reconcile` | §B.1 rule 4 | `RECON` |
| `keel/bin/check-stores` | §B.1 rule 4, §B.2 product and curator anchors | `STORES` |
| `keel/bin/rehearse` and the rehearsal cases | §B.1 rule 4 | `REHEARSE` |
| `keel/bin/curate` and the nightly curator | §B.1 rule 4, v25 | `CURATE` |
| `keel/bin/skill` — the skill creator | §E.3 | `SKILL` |
| `.agents/skills/` and the library's `registry.yml` | §E.1, §17.4.1 | `SKILL` |
| The read-back page | §C.3 | `READBACK` |
| Page 1, the office — pixel-agents, through the tool door | §D, v62 | `P1` |
| A writer from our event log into pixel-agents' `AgentEvent` model (schema not read from source — UNVERIFIED) | §D, v62 | `P1` |
| Page 2, agents and child flows | §D | `P2` |
| Page 3, cost, tokens and efficiency | §D, v14 | `P3` |
| Page 4, tasks, tickets and PRs | §D, v16 | `P4` |
| Page 5, engines and how it works | §D | `P5` |
| Page 6, the 3D file graph | §D, v61 | `P6` — last of the seven |
| The repository-to-graph extractor | §D, v15, v61 | `EXTRACT`, preceded by `GRAPHLANE` |
| Page 7, canvas and playground | §D, v15 | `P7` |
| `keel/shared/prices.yml` and the model-expiry facts | §G.1, §G.3, §G.4 | `PRICES` |
| The Codex headless rehearsal | §H.2, v32 | `CODEXTEST` |

### 19.2a Every ABSENT path of SPINE §L, grouped — the rethink round's own additions

**(NEW: the rethink round of 2026-09-06 named eighty mechanisms, and a mechanism with a path is a build node or it is
a wish)** The same completeness claim as 19.2, made against SPINE §L: **one row per ABSENT path, and a path in two
nodes means the graph is wrong.** They group into three kinds, and the kinds behave differently in a build order —
**a store is written once and read forever, a program is a thing somebody writes, and a mechanism is a rule that
lands inside a program that already has a node.** Only the first two are new nodes; the third joins one, which is
why the graph grew by twenty-one nodes and not by eighty. **(NEW: three further nodes, and they are not §L's ·
2026-09-06 · challenge C P2-3)** `FOUNDERLAST`, `SKILLBUDGET` and `FRESH` carry three **founder** rows — v76, v77 and
v81 — that were named ABSENT in their own sections and had no node here at all. They are counted apart from the
twenty-one on purpose: the twenty-one is what the rethink round's *mechanisms* cost, and mixing the two would spoil
the only number in this section anyone can check.

**Stores and schemas — O1–O12, plus the two the founder's rows add**

| ABSENT path | SPINE | Node |
|---|---|---|
| `keel/ventures/<v>/items/` — `w-*.yml`, and `items-draft/` | §L O1 (**R16** decides two objects or three) | `WORK` |
| `keel/shared/roster.yml` | §L O2 · v72's `valid_until` · v71's pack paths | `ROSTER` |
| `keel/shared/schemas/charter.yml` | §L O3 (contradiction 2) · v79's `cloud:` field | `SCHEMAS` |
| `keel/shared/schemas/brief.yml` — eleven fields | §L O4 (contradiction 3) | `SCHEMAS` |
| `keel/shared/routing.yml` | §L O5 (contradiction 17) | `ROUTING` |
| `keel/shared/schemas/event.yml` — `schema_version` on every row | §L O6 | `SCHEMAS`; the logger change joins `LOG` |
| The handover schema's five fields | §L O7 (**R11** is blocked on it) | `SCHEMAS`; the writer joins `RUN` |
| `keel/shared/prices.yml` with `fetched_at` and `valid_until` | §L O8 | `PRICES` — the node exists; the two fields and the stale-row refusal are what is new |
| `keel/logbook/decide.jsonl` | §L O9 · O49 · v76's which-expiry, which is **one of v76's four call sites and not its path** — the path is the row below *(clarified 2026-09-06 · challenge C P2-3)* | `DECIDE` |
| `keel/host/` | §L O10 | `HOST` |
| `keel/golden/` | §L O11 (contradiction 11) | `GOLDEN` |
| `keel/surfaces/pages/<n>.yml` | §L O12 (contradiction 9) | `PAGEMAN` |
| `keel/consent.yml` — the register — and `keel/subjects/<hash>.yml`, the erasable per-subject store | **v69** | `CONSENT` |
| The window high-water file | **v74** | `HIGHWATER` |
| `keel/logbook/founder.last` — the last founder event, written by `bin/log`, read by `bin/watch`, with **one predicate over it at four call sites** *(added 2026-09-06 · challenge C P2-3)* | **v76** (§0.1a, §4.4) | `FOUNDERLAST`; the four call sites join `WATCH`, `DECIDE` and `P5` |

**Programs — O13–O20, O23, O60, O78, O79, plus the founder's one**

| ABSENT path | SPINE | Node |
|---|---|---|
| `keel/bin/egress` | **v68** (D3) | `EGRESS` |
| `keel/bin/embed` and `keel/bin/classify` | §L O13 — **DEPENDS-ON-R4** | `LOCAL` |
| `keel/bin/worktree` | §L O14 | `WORKTREE` |
| The wake reconciler — `run.started` before exec, then reconcile against `claude agents --json --all`, the tmux session list and the process table | §L O15 (contradiction 13) | joins `RUN` and `WATCH`; it is the carrier *"resume, not restart"* never had |
| `logbook/watch.lease` | §L O16 | `LEASE` |
| `keel/bin/redact` | §L O17 (contradiction 14) · O66 | `REDACT` |
| `keel/bin/bell` | §L O18 | `BELL` |
| The same-failure predicate — one shared hash | §L O19 (rests on **O13**) | joins `LOCAL`; its three consumers are `WATCH`, `CURATE` and the fast loop |
| `keel/bin/replay-desk` | §L O20 (**v75** is settled by it) | `REPLAY` |
| `keel/bin/horizon` | §L O23 | `HORIZON` |
| `keel/bin/intend` | §L O60 | `INTEND` |
| `keel/fixtures/` | §L O78 | `FIXTURES`; `bin/drill` gains the scratch house and keeps node `DRILL` |
| Blue-green at a tick boundary | §L O79 | joins `WATCH` and `SENDER` — free, because every tick is already crash-only |
| The per-agent startup metadata checker — modelled on `scripts/check-memory-budget.mjs`, which EXISTS and blocks; **§7.6a names no path for it yet**, and **R8** can retire it outright *(added 2026-09-06 · challenge C P2-3)* | **v77** (§7.6a, §7.8) | `SKILLBUDGET` |
| The `scout` standing intent that re-fetches every row carrying `source:`/`valid_until` on the free Gemini window and opens a Decide item **naming the row it invalidates** — **v55**'s shape, so it is data the Watch ticks *(added 2026-09-06 · challenge C P2-3)* | **v81** (§13a.7, §13a.10) | `FRESH`; the rows it opens land in `DECIDE` |

**Mechanisms — the rules that land inside a program that already has a node**

| Mechanism | SPINE | Node it joins |
|---|---|---|
| `/goal`'s condition composed from `anchor:` — **DEPENDS-ON-R17** · the byte-identical done-test · the edit-arguments verb writing a brief and never argv · the prefix hash and the two shipped flags — **R7** · `tokenizer:` on every ceiling · the trust score's launcher consumer · the cross-venture refusal · the carrier choice for `tester` and `challenger` · brand-voice unroutable while the taste store is empty · the session ceiling — **DEPENDS-ON-R23** | §L O21, O22, O53, O39, O77, O26, O27, O28, O61, O71 | `RUN` |
| The hash chain, the sandbox-escalation row, `skill.miss`, skill activation (**DEPENDS-ON-R14**) | §L O31, O48, O41 | `LOG` |
| `catch_up:` because `StartInterval` coalesces · idle work must serve a live intent · the file lease · the statutory class and the customer's clock | §L O52, O51, O72, O55, O56 | `WATCH` |
| The watermark, the venture argument, the dedup calibration, slice precision, the calibration number per agent, the negatives scope split | §L O42, O68, O44, O45, O80, O43 | `CURATE` and `MINE` |
| `effect:` on every anchor · one sample floor · the held-out discrimination test · the signed verdict's key path · `claim-source` blocking on `scout` | §L O24, O25, O62, O30, O29 | `REHEARSE`, with `O29` and `O30` on machinery that exists today |
| `provider_cap` · bulk personal data with `guard` · `scopes_observed` and a binary's version and hash · refusing `/import` · the taint id and the per-venture canary | §L O32 (**R21**), O33, O35, O36, O65 | `DOOR`, with the canary's refusal in `SENDER` |
| Three data classes and per-store retention · wind-down · rotation as an obligation · the provenance line on the Sender's checklist | §L O34, O63, O67, O64 | `STORES` and `SENDER` |
| One control chart · cost per rung movement · the restore drill's number · log rotation (**DEPENDS-ON-R22**) | §L O74, O75, O76, O40 | `METER` and the briefing |
| A terminal `blocked` state after N failures — **R18** sets N | §L O73 | `RUN`, written to the card store and the negatives store |
| The deterministic accessibility check · the verbatim legal clause | §L O58, O59 | `P5` and `RECON`; both sit on grants and checks that exist |
| The page manifest's readers: the census join, the citing-or-refusing Q&A | §L O70, O54 | `P2` and the page renderers, downstream of `PAGEMAN` |
| **v77**'s one generated directory per namespace — a rule **inside** §7.1's generator, which already owns both output directories, not a second writer *(added 2026-09-06 · challenge C P2-3)* | **v77** (§7.6a), extends **v48** | `SKILL` |
| **v81**'s `source:` and `valid_until` on every row resting on a fetched fact, and one `wins_if:` line per §22 entry — written once, by whoever wrote the row *(added 2026-09-06 · challenge C P2-3)* | **v81** (§1.1, §13a.10, §22) | no node — the fields are written into the plan itself; the program that reads them is `FRESH` |
| Deletions and rules with no program: the project-settings grant tier, the backlog file, the parallelism axis, `analyst`'s shell, `CURATION.yml` as the failed-candidate home, the hook rewrite as spec | §L O37, O46, O69, O57, O47, O38 | no node — §18.7 carries them as fates |

**(NEW: three of these paths are named more narrowly than SPINE §L names them, and the difference is recorded
rather than applied in silence)** §L writes the work-item store as `keel/ventures/<v>/work/` holding `w-*.yml`. **It
is `items/` holding `w-*.yml` here, with drafts in `items-draft/`** — because **`work/` is already the venture's own
source repository**, and a store path that collides with the tree a builder checks out is a defect found by a `git
status` at three in the morning rather than by a review. **v69**'s two stores are named the same way:
`keel/consent.yml` for the register and `keel/subjects/<hash>.yml` for the erasable per-subject bodies, where §L
says only *two stores*. **None of the three is a change of behaviour** — §L's fields, its one-writer rule and
`bin/check-stores`' refusals are untouched, and only directory and file names move. They are written down because a
path that differs between the spine and the build order is precisely the drift the spine exists to stop, and the
cheapest moment to see it is now.

**(NEW: three founder rows were ABSENT with no node, and the completeness claim above is what found them)** This
table and 19.2 both claim *one row per ABSENT path*. **v76**'s last-founder-event predicate reached the graph only as
*which-expiry* folded into `DECIDE` — one of its four call sites, standing in for the path itself. **v77**'s checker
and per-namespace generator and **v81**'s `source:`/`valid_until` fields and `scout` standing intent were named
ABSENT in their own sections and appeared here nowhere. All three are rows above now, with `FOUNDERLAST`,
`SKILLBUDGET` and `FRESH` in the graph. **The lesson is about the claim, not the three rows:** a completeness claim
is worth what it costs to falsify, and this one was falsified by reading it against §A rather than against §L —
the founder rows carry ABSENT mechanisms too, and only §L was swept when the table was written.

**(NEW: two rows are free before the first run and expensive after, and the graph cannot show that)** **O7**'s five
handover fields and **O6**'s `schema_version` cost nothing while no run has written a row, and cost a **full backfill**
the moment one has. They are marked *free now, backfill later* in §L for that reason, and **R11** — does a second
model family reduce escaped defects on our own move classes — is **blocked on O7's four provenance fields**, which
are cheap now and unreconstructable later. A build order that defers them is not deferring work; it is choosing to
pay more for it and to lose one measurement outright.

**(NEW: R10 gates everything cross-model, and it is one node the graph already has)** `CODEXTEST` **is R10** — does
`codex exec --json` return output with no controlling TTY, on a current version, with a non-trivial prompt. Pass and
rung 2 becomes parallel and a second family is a lane; fail and the second family is one foreground slot forever, at
1/N availability. **v5, v32, v78, v82 and §I row 15 all read differently depending on it.** Note **W19** against the
node's own label, **which now carries the corrected floor rather than a note beside a stale one** *(corrected
2026-09-06 · challenge C P3-4)*: the rehearsal floor once written there as `>= 0.124.0` is twenty-nine minor versions
stale against the shipped 0.153.4 and no longer discriminates — the floor is **the installed version, recorded**.
**(R26, OPEN)** *(mark added 2026-09-06 · challenge C P3-2)*, reading the unread Codex June–August changelog window,
is the only cheap route to the same answer and needs no install at all.

---

**(NEW: two nodes are not ABSENT paths and are drawn anyway)** `MC` is `mission-control/` on
`ceo-1-1788609834` — 60 files that already exist and are kept (§18.5). `MINE` reads
`~/.claude/projects/` — 3,060 transcripts that already exist. Both are drawn because everything downstream needs
them, not because anything must be created first.

---

### 19.2b Every ABSENT path of SPINE §L O81–O127 — the fixer round's own additions

**(NEW: the same completeness claim, made a third time, against the fixer round · 2026-09-06)** One row per ABSENT
path, and a path in two nodes means the graph is wrong. The round's stores and programs are **eighteen new nodes and
nine vendor surfaces**; its mechanisms join nodes that exist. Count the nodes, never quote them: the graph declares
**~~91 nodes and 195 edges~~ 92 nodes and 199 edges** (was 65 and 115), checked by a parser that fails on an
undefined id, an unresolved edge endpoint, an unbalanced quote or a cycle on a solid edge. *(Amended 2026-09-06:
challenge D P2-11 adds `BRIEFING`, the briefing generator, which the plan named ABSENT in §14.8 and §16.8 with no
path anywhere, and four edges into it — `METER`, `DECIDE`, `MARKET` in, `P5` out.)* Provenance per row is the SPINE
row's own.

**Stores, schemas and programs — the new nodes**

| ABSENT path | SPINE | Node |
|---|---|---|
| `keel/shared/rules.yml` and the renderer; `final-v2/ARCHIVE.md` | **v97** · §L O106 | `RULES` — the second root |
| `keel/constitution.md` and its byte check | **v97** · §L O107 | `CONSTITUTION` |
| `keel/host/RUNBOOK.md` | **v106** · §L O125 | `RUNBOOK` |
| `keel/shared/schemas/settings.yml` — the dial inventory | **v104** · §L O118 | `SETTINGS` |
| `keel/shared/facts.yml`'s units table, written by the meter | **v104** · §L O117 | `FACTS`; the meter's write joins `METER` |
| `keel/logbook/nights.jsonl` — the cold-start scoreboard | **v106** · §L O124 | `SCOREBOARD` |
| `ventures/<v2>/charter.md` — the second venture, `outcome:` at rung 2 | **v85** · §L O101 (E2) | `STRANGER` |
| `keel/shared/market.jsonl` | **v99** · §L O99 | `MARKET`; its one writer joins `RECON` |
| `keel/shared/tools/<class>.yml` — the ladder files | **v94** · §L O100 (E11) | `LADDER` |
| `kind: operator` rows in `sessions.jsonl`; `claim:` on the which | **v91** · §L O84 (E8) | `OPREG`; the claim joins `DECIDE` |
| `keel/bin/stop` | **v102** · §L O85 (E8) | `STOP` |
| `verbs:` on `keel/shared/tools/<name>.yml` | **v101** · §L O109 | `VERBS` |
| `keel/logbook/founder.lease` | **v102** · §L O86 | `FOUNDERLEASE` |
| `keel/host/power.yml` and the `night_capable` predicate | **v84** · §L O81 (E13) | `POWER`; the tick-time read joins `WATCH`, the fact joins `P3` |
| `verifier:` and `adequacy:` on the handover; the rung-1 refusal | **v100** · §L O108 | `ADEQUACY`; the refusal joins `STORES` |
| The trusted base's roster rows and tier floors | **v88** · §L O103 (E4) | `TCB`; admission joins `FIXTURES` |
| The carrier drill and `--deny-carrier` | **v105** · §L O120 | `CARRIERDRILL`; the switch joins `RUN` |
| R12's runner — **`keel/bin/rehearse --r27`**: one `-p` pass, one founder sitting, thirty paper done-tests *(the program named 2026-09-06: challenge D P2-11)* | §L O102 · **R27** | `R27RUN` |
| **`keel/bin/briefing`** — the briefing generator behind the `keel briefing` verb, ABSENT in §14.8 and §16.8 with no path until now *(added 2026-09-06: challenge D P2-11)* | §L O95, O96, O116 · O74–O76, O123 | `BRIEFING` |
| `bin/mine --since` | **v93** · §L O88 (E10) | joins `MINE` — the node exists; the taint refusal and the `~/.claude/projects` scope are new |
| `keel/host/denyread.yml` | **v90** · §L O92 (E7) | joins `HOST`; asserted by `PROBE` |
| The `pmset -g log` standing intent → `facts.yml` `mac-off-hours` | §L O82 · **R37** | joins `FRESH` (v55's shape); the row lands in `FACTS` |
| ~~`keel/bin/supervise`~~ | §L O91 · **R31** | **REFUSE** — `VS_DAEMON` is drawn instead |

**Mechanisms — the rules that land inside a node that exists**

| Mechanism | SPINE | Node it joins |
|---|---|---|
| The one-machine drill: a keychain read from a night child must fail · the probe authored apart from the launcher · the vendor floor the launcher cannot widen · the scratch house widens it and the probe must refuse | §L O83, O93, O104 | `PROBE`, `RUN`, `FIXTURES` |
| `--settings` per child (**DEPENDS-ON-R28**) · `--no-session-persistence` · `--fallback-model` with `PreModelSwitch` blocking · `--autocompact` at full context (R32) · bare `-p` in tmux, never `--bg` · `--deny-carrier` · the grant from two-way verbs | §L O87, O88, O89, O90, O91, O120, O109 | `RUN` — every one an *adapter* over `VS_FLAGS` or `VS_DAEMON` |
| `founder_hours:` read by the Desk; `founder.act` on every tap · which admission control (R34) · outcome distance as the tie-break · v76 as amended, the burst edge · the Watch's own control charts (R36) | §L O95, O96, O98, O127, O123 | `WATCH`, `LOG`, `SCHEMAS`, `FOUNDERLAST`, `METER` |
| The taste control arm (R39) · the curator graded: held-out test, calibration seed, executable falsifiers, the nightly canary | §L O97, O113 | `DECIDE`, `CURATE`, `STORES`, `FIXTURES` |
| The canonical anchor line (**DEPENDS-ON-R17**) · seed packs referencing `golden/` · trust probation per move class · provisional skill admission (**DEPENDS-ON-R14**) · the checker's measured constant | §L O110, O111, O112, O114, O119 | `REHEARSE`, `PACKS`, `GOLDEN`, `ROSTER`, `SKILL`, `SKILLBUDGET` |
| The high-water seed from `budget-guard.js` · the shadow subsidy line (R35) · `attach:`/`message:` on `pages/2.yml` · the bell as a wrapper · a standing intent that expires | §L O115, O116, O121, O122, O126 | `HIGHWATER`, `METER`, `PAGEMAN`, `P2`, `BELL`, `WORK`, `HORIZON` |
| Egress as three transports (R2) | §L O94 | `EGRESS`, behind `VS_SANDBOX` |
| The commodity line: `class:`, `vendor_wins_if:`, `wins_if:` on every §L row and `bin/` program; a matched `vendor_wins_if:` forces Delete; §L sorted by class before this section orders it | **v96** · §L O105 | no node — it is a column of `RULES` and the reason nine vendor surfaces are drawn; §17.5 holds the adapter table |

**(NEW: the adapter nodes are drawn behind their vendor surface, and the shape is the rule)** Nine flag-shaped nodes
(`VS_*`) carry a dashed edge into the node that reads them — `pmset` behind `POWER`, the `-p` flags and the daemon
behind `RUN`, `claude agents` and `SendMessage` behind `P2`, `rate_limits` behind `P3` and `HIGHWATER`, the vendor's
push behind `BELL`, the sandbox blocks behind `EGRESS`, `/goal` behind `REHEARSE`, `-w` behind `WORKTREE`. A dashed
edge reads *is the thinnest reader of*, not *needs*: the surface exists today, the adapter is ours, and the
adapter's `vendor_wins_if:` is the surface growing until the adapter is a no-op. **`bin/supervise` is the first
node the rule deleted before it was built** (O91): the daemon it would sit beside already has leases and an idle exit
(W38), so it is drawn as the surface and not as the program. (NEW: O105 · v96 / THINKER: A7, C3 / FIXER: A, C.)

**(NEW: the page chain is v95's order drawn as needs, and it is the one place an arrow means *decided after* rather
than *cannot exist before*)** `P4 → P5 → P3 → P2 → P7 → P1 → P6` replaces the fan of edges into `P6`, because the
founder fixed the whole order and not only its last element (FOUNDER, fixer round 2026-09-06: E12 · v95). `P6` is
still last and still needs `EXTRACT` and `GRAPHLANE`; what is new is that `P1` and `P7` also sit behind the Sender
in `keel/fixtures/` — the door, the consent register and the Sender exist before pages 1, 6 and 7 (NEW: O101), so the
company can reach a stranger before it can watch itself in an office.

---

### 19.3 What the shape of the graph says

**(FINAL, ~~and it survives v2 intact~~ amended once by the fixer round · 2026-09-06)** Three things unlock everything else and one of them is unusual. **The
logbook**, because nothing can be measured, learned from, explained or resumed without a typed append-only record —
and it is the cheapest thing here — **and now the data files beside it (`RULES`), because the logbook's own schema is
rendered from them** (NEW: O106 · v97). ~~**Transcript mining**, the only component that makes every other component better
on the day it lands, which most designs would build last.~~ **One venture with a stranger** (`STRANGER`, FOUNDER, fixer
round 2026-09-06: E2 · v85), because *worked* is a stranger acting and no node reached one (THINKER: conv. 2) — mining
is fourth, behind O88's exclusions. **One real venture, driven**, with a real done-test and a
rung-1 anchor, because everything in this design is a claim about what happens when that runs — **and the reconciler
with its instruments, because the stranger's `outcome:` is checked by a record the company does not write** (NEW: O98,
O99 / FIXER: C).

**(NEW: v4 adds a fourth trunk, and it hangs off the same root)** The website's six built pages all descend from
`LOG` and `RUN`. Page 3 cannot exist before the meter, page 2 cannot exist before the agent-teams flag, and page 4
cannot exist before `bin/run` can hand a card to a team. **None of them is a new source of truth** — that is what
`MC --> P*` means and it is why every page reads the same store.

**(NEW: the founder-act nodes are not evenly placed, and the asymmetry is the useful part)** `MANAGED` gates the
entire unattended half of the system through `PROBE`. `LICENSE` gates only the bulk import. `TEAMS` gates one page.
`CODEX` gates one measurement whose failure leaves Codex in the foreground slot it already has. **Only one founder act
is on the critical path of everything**, and it is ~~four lines of JSON~~ **two keys** in a directory no run can reach —
`disableAutoMode` is struck, so the file no longer costs the founder auto mode on the Floor (FOUNDER, fixer round
2026-09-06: E9 · v92 / THINKER: A3), and night children get their denies per child on `--settings` instead (NEW: O87,
**DEPENDS-ON-R28**).

**(NEW, v56: `HOSTED` is the narrowest node in the graph, and it is a decision rather than an act)** It gates only
`CLOUD` — the off-Mac maker lane — and nothing else downstream of `RUN` needs it: a run dispatched while the Mac is
on never touches this node. Unlike `MANAGED`, `GEMINI`, `CODEX`, `TEAMS` and `LICENSE`, which the founder's interview
of 2026-09-05 settled, `HOSTED` is still **OPEN** (§I row 15) — it names a choice among lanes with no documented
driver today (Codex cloud) against lanes that share the Claude seat whose terms clause is §I row 1, also open. ~~Two
open decisions gate one narrow lane, and nothing else in the graph waits on either of them.~~ **Re-read under E1 and
E13 (amended 2026-09-06): with no box, `CLOUD` is the night's fallback — `POWER`'s `night_capable` refuses an
unattended brief on a sleeping Mac and routes it here where the charter says `cloud: allow` — so the lane is no longer
narrow. The maker path's UNVERIFIED (v56 b) is on the critical path of the first night that this Mac cannot hold,
and R37's thirty days (O82) replace R5's week as the number under the decision** (FOUNDER, fixer round 2026-09-06:
E1, E13 · v83, v84 · NEW: O81, O82 / THINKER: A1, C19).

**(FOUNDER, v54: the roster is two nodes now, and the second one is downstream of a running venture · sizes moved
2026-09-06: D5 → v70)** `AGENTS1` is ~~eight~~ **ten** files and sits where `AGENTS` did — everything that needs a
grant needs it. `AGENTS2` is the other ~~seven~~ **five**, and
the only edge into it comes **from** `VENTURE`: they are written when a venture needs them. **No edge is drawn from
`AGENTS2` to `ARGV`, and the omission is deliberate rather than an oversight** — that edge would close a cycle
(`AGENTS2 → ARGV → RUN → … → VENTURE → AGENTS2`), and the cycle would be real rather than a drawing artifact, because
wave two is written after the machine is already running. Each wave-two file therefore brings its own argv file with
it, the same way wave one's arrives with `AGENTS1`. **What the split does not change:** all fifteen rows stay in the
§17.1 inventory, and §5.0 states once what wave one does without. **(FOUNDER, rethink 2026-09-06: D5 → v70 — what
v70 moved, and the graph moves with it)** `curator` and `challenger` are **wave one**, so both are inside `AGENTS1`
and neither is reached through `VENTURE`: memory has a writer from the first night, and a plan about to bind is
attacked by something that is not its author. v70 moves v54's implementation and reverses nothing — v54's own test is
*"a seed file or a code path today"*, and `curator` has four verified code paths on this branch while `challenger` is
one read-only file. §5.0's two tables are the same split stated once.

**(FOUNDER, v61: page 6 is the only page with edges from every other page, and that is what "last" means here)**
~~`P2`, `P3`, `P4`, `P5` and `P7` all point into `P6`~~ **the chain `P4 → P5 → P3 → P2 → P7 → P1 → P6` ends at `P6`**
(amended 2026-09-06: E12 · v95 — the founder fixed the whole order, and pages 1, 2, 3 and 7 are adapters over a vendor
surface, v96), so the graph refuses to build it early rather than a sentence
asking nobody to. `GRAPHLANE` — one research lane on repository-to-graph tooling — points into `EXTRACT`, because
the extractor is the one substrate in this plan with no verified prior art and §14.9 says so. Read the two together:
the page waits on the other six for appetite, and the extractor waits on evidence.

**(NEW: one edge exists so that another one does not have to, v36)** `INBOUND --> WATCH` is drawn because the Watch
materialises an obligation from a row the world's door already wrote down, and **`steward` writes its obligations
from those rows and from `scout`'s handover**. **No edge runs from a tainted hand to `steward`**, and none may: no agent holding `Write`, `Edit` or `Bash` reads mail, calendar, drive or Notion raw. That
is why the world's door is a node in its own right rather than a detail inside the tool door.

**(NEW: one edge is deliberately missing, and its absence is the design)** Nothing points from any agent node to
`WATCH` or to a gate. **The gate may not be invocable by the thing it gates** (v35), and the same argument keeps
`Write` off reviewer. A build order that wired an engine to its own gate would be drawing the failure in.

**(NEW: what the rethink round of 2026-09-06 did to this graph, and the shape of the change is the finding)** It
added **twenty-one nodes — eleven stores and schemas, ten programs — and not one new root.** *(The fixer round then
added one root on purpose, `RULES`, and it is a root only because everything else is rendered from it — see the last
paragraph of this section; the sentence above stays true of the rethink round.)* Every one of them hangs
off `LOG`, `RUN`, `STORES`, `DOOR` or `WATCH`, which is what a round of *mechanism* fixes looks like when it is
drawn: eighty decisions (§L), and the trunk did not move. **(NEW: three founder-row nodes joined on 2026-09-06 —
`FOUNDERLAST`, `SKILLBUDGET`, `FRESH`, challenge C P2-3 — and they do not disturb this reading:** they hang off
`LOG`, `SKILL` and `WATCH`/`GEMINI`, so the count of new roots is **still zero**, and they are counted separately
from the twenty-one because they are founder rows and not §L mechanisms.**)** Had the round found a second architecture, this graph
would have a second source. It has none. **Four of the twenty-one change an ordering rather than adding work.**
`PACKS` is the sharpest — **v71 makes an agent unroutable without its onboarding pack**, so `AGENTS1 → ROSTER →
PACKS → ROUTING → RUN` is the order, and the pack is not paperwork filed after the fact: it is what distinguishes
`writer` from *builder with a different prompt*, in a band nobody publishes evidence for. **The enforcement is not
the arrow.** `bin/run` already refuses a brief naming a file that does not exist (v37, v45) and the pack paths are
declared in `roster.yml`, so an unpacked agent fails at dispatch rather than at review — which is why the graph may
also be read the wrong way round and must not be: `AGENTS1 → ARGV → RUN` still exists, and it is the refusal, not the
drawing, that keeps an unpacked agent off it. `WORKTREE` is the second: **a run never creates its own**, because
`git worktree add` cannot complete under the armed sandbox and interactive escalation is unavailable to an
unattended run by construction, so the tree is composed into its argv like every other grant. `HOST` is the third —
`MANAGED → HOST → PROBE` replaces `MANAGED → PROBE`, because the founder's act now writes into a directory that
declares the whole machine and the probe asserts it **by attempting the operation**. `LEASE` is the fourth, and it
is the only node in the round that exists to prevent a **duplicated outward act**: without it the restore drill's
own clone can tick and can send.

**(NEW: one node was measured and one was shut, and they are the two that concern the world outside this Mac)**
`HOSTED` is answered by measurement for the first time — **R5 is DONE**: 156 hours of log, 40.7 asleep in 487
episodes, **zero episodes of an hour or more**, longest single sleep about twenty minutes. The tail a hosted maker
lane would buy back is **zero over the week measured**, so the node stays a founder decision (§I row 15) but it is
now a decision with a number under it. `CLOUD` is shut from the other end by **v67**: `bin/run` refuses to mint
unattended work on a carrier whose `stop:` reads UNKNOWN, and cancelling a hosted Codex task is exactly that. **The
two facts point the same way from opposite directions** — the lane buys back nothing measurable, and it cannot be
stopped — which is the strongest state an open decision can be in without being closed. **(amended 2026-09-06: E1)
The two facts still point the same way for *making*; what changed is that `CLOUD` is now also the night's fallback
for the Mac that cannot hold a night, so the lane the founder named has to be driven before it can be relied on, and
`STRANGER`'s charter carries the `cloud:` field that admits or refuses it per venture (v79, v85).**

**(NEW: what the fixer round of 2026-09-06 did to this graph, and this time the trunk did move — by one root)** It
added **eighteen nodes and nine vendor surfaces, and one new root, `RULES`** — the seven binding data files and the
constitution (v97, O106, O107), from which the agent files, §1's tables, the runbook and every *what enforces this*
table are rendered. It is a root because it is what everything else is generated from, not because it is a second
architecture (FIXER: B, C; THINKER: conv. 7). **Three edges reversed direction:** `AGENTS1 → ROSTER` became `ROSTER →
AGENTS1` — an agent file is generated from a roster row, never written first (O103); `RUN → SUPERVISE` and `SUPERVISE
→ WATCH` are gone, the daemon drawn as a vendor surface instead (O91); and `VENTURE → OVERNIGHT` gained `STRANGER`
between them, so the first measured overnight exits on a market row and not on a week (O101, E14). **Three images
were not drawn** — `BOX`, `NULLWEEK`, `CHECKERKEY` — and the preamble names them so nobody draws them back (E1, E14,
E7 · §J 73–75). **Four ordering constraints the round adds, none of them work:** `ADEQUACY` before the first rung-1
claim (O108), so a rung-1 share can be *unrated* rather than false; `TCB → FIXTURES → RUN`, so the launcher passes
through the scratch house before it may mint unattended work (O103); `CARRIERDRILL → AGENTS2`, two exercised carriers
before wave two (O120); and `SCOREBOARD → OVERNIGHT` with `FACTS → OVERNIGHT`, so row 12's comparison is read only
after three bounded-day rows and a units table exist (O124, O125, v106). **The stages are the reading order:** a
bounded day on this Mac (`RULES`, `LOG`, `RUN`, `RECON`, the Sender behind a tap, two ventures), then the night behind
§20.2 row 12 (`POWER`, `WATCH`, `SCOREBOARD`), with `CLOUD` as the fallback whenever `night_capable` is false. The
graph cannot draw a stage; the preamble and this paragraph are where it is said.

**(NEW: the round's one node that is not work but an answer)** `CODEXTEST` **is R10**, and R10 is the hinge of the
cross-model design rather than one of its rows: pass, and rung 2 becomes parallel and a second family is a lane;
fail, and the second family is one foreground slot forever. Nothing downstream of it changes size — the *shape* of
§9, §10, §11 and §I row 15 changes. It is drawn as one small node because a graph cannot show that, and this
paragraph is where it is said instead.
