# Final plan v2 · the decisions of this session, as they were made · 2026-09-05

*Side file, same convention as `final/DECISIONS.md`: `.claude/memory/DECISIONS.md` sits within 500 bytes of its
40,000-byte cap. Fold in when the merge lands. Each entry: the question, the founder's answer in their words, what
it changes.*

## 1 · Go — "go. no builing yet."
Four research lanes (sourcer), a framer spine, builders per section, a designer page, a census lane, two challenge
lanes, a fix round, a session file. Nothing built, installed, authenticated, spent, published or pushed. Widened the
same minute by the founder's next message: *"You can take it a couple of steps forward and add more to the research
or more to the thinking so we will get the best system that we can ever plan"* — read as licence for more lanes than
the handoff named; the founder's 35-section list was re-sent verbatim with it and is identical to
`round-5/FOUNDER-LIST.md` §01–§35.

## 2 · Round-6 input — "Keel only, again"
Asked with the recommendation to read THE-PLAN.md, mind-2, fable and what-to-buy on ceo-2. **The founder chose Keel
only, again.** Those four files stay unread by this session. Consequence: any answer they hold to the founder's
2026-09-05 direction is not in v2, and v2 says so where it would have mattered.

## 3 · Landing — "Beside PR #131"
Commit on this branch (`ceo-1-1788609834`, at `b2cabad` = local main) as the session goes; at close, compose a
branch `docs/final-v2` on top of `origin/docs/final-plan` (PR #131's head, `7fe8ede`) so `final-v2/` sits beside
`final/` on origin/main's history. Landing order of the four branches stays §19.14, the founder's. Nothing pushed.

## 4 · Second family — "Proceed single-family"
`codex` absent (measured `command -v`), `gemini` 0.38.2 present with auth state unreadable from the sandbox
(`~/.gemini` is `denyRead`). Every challenge lane runs on Anthropic with sealed contexts and different briefs; v2
states it plainly. §19.10 stays open.

## Measured at session start, 2026-09-05
- `claude` 2.1.261 (the final plan measured 2.1.259). `codex` ABSENT. `gemini` present.
- PR #131 `docs/final-plan` → `main` is open (`gh pr list`, sandbox lifted for the one read).
- Branch topology: `origin/main 4770d39` · `docs/final-plan` = origin/main + 15 (final docs, handoff, LONG-TERM
  compress) · `ceo-3-1788468144 7286420` = `b2cabad` + 12 (same final docs, no origin/main) ·
  `ceo-1-1788468144 280b5e7` ⊇ origin/main ∪ b2cabad + round-5 corpus, no `final/` · this branch = `b2cabad`.
- The handoff file is byte-identical on `docs/final-plan` (52fa1f1) and `ceo-3` (7286420).

## 5 · Seven research lanes, direct `Agent` dispatch, not a `Workflow`
The handoff named four lanes; the founder's widening ("add more to the research or more to the thinking") added
three: cognition and tickets (§21–§22), memory and knowledge (§04–§05), models and quotas. All seven ran as
`sourcer` engines in parallel by direct dispatch. Fan-out wider than three is supposed to go through a committed
workflow script, but the `Workflow` tool needs the founder's explicit words and the founder's standing preference
is direct agents for anything short of a main change (LONG-TERM.md). Cost of the choice: no enforced return
schema; the return format was carried in each brief instead and checked by reading.

## 6 · Lane returns are delivered in 3,500-character parts
The idle-notification drain that delivers a subagent's result truncates near 4,000 characters per message and
16,000 per drain, and `sourcer` has no `Write`. Every report came back in numbered parts, requested one at a time,
and was recorded verbatim under `final-v2/research/` by the orchestrator — recording, not authoring. Seven lanes,
fifty-one parts, one commit per round. A lane engine with `Write` would remove this ceremony; noted for the plan.

## 7 · The spine lane runs on Opus, not the framer's default Sonnet
`framer.md` declares `claude-sonnet-5`. The decision spine is the highest-leverage document of the session — every
builder writes from it — so the dispatch overrode the model to `opus`. Cost: roughly 2.5× the token price for
one lane. Recorded so the override is a choice and not drift.

## 8 · v36 — a tainted read is held by `scout` and the world's door, never by an agent with a pen
Builder 2 returned BLOCKED on section 8: SPINE §F says tainted READ-ONLY (Gmail, Calendar, Drive, Notion read, the
open web) is `scout` only; SPINE §B.2 row 12 granted `steward` those reads while it also holds `Write`. One grant,
two §A rules. Resolved by the orchestrator without the founder, because FINAL §9.4 already decides it and v33 says
the trifecta split survives intact: any run that reads outside content is born without the tools that act, and a
maker never reads a raw inbound row. So the world's door (a program) writes one inbound row per mail or calendar
event, `scout` reads rows and returns facts, and `steward` writes obligations from that handover. SPINE §B.2 row 12
and a new row v36 carry it; every builder was told. Cost: one more hop between a mail arriving and an obligation
existing — the same hop FINAL §9.5 already required.

## 9 · v37 — the brief gains a tenth field, `agent:`
Builder 1 returned BLOCKED on §6: fourteen named agents mean the brief must carry which agent runs it, and SPINE §A
decided neither a tenth field nor a widened `window+model:`. Decided by the orchestrator: a tenth field `agent:`,
because it leaves FINAL's nine untouched and the launcher can refuse a name that is not a roster file. Row v37.

## 10 · v38–v41 — four placements builder 4 found undecided, decided by the orchestrator
Builder 4 returned six BLOCKED rows. A was v36; B was the namespace miscount (§E.4 now reads thirteen). The other
four were absent from §A and are decided here because each follows from a measured fact or an existing setting,
not from a preference the founder holds: **v38** the read-back is the intent-creation form on pages 4 and 7 and
stays a phone page, the briefing is page 5's top strip and a phone page; **v39** the website is served on the
Mac by the existing `mission-control/` server because a terminal pop needs tmux on the same machine — the phone
keeps the published pages for reading and deciding (cost: two renderers over one state, accepted); **v40**
`maxTurns` 30 for producing agents, 25 for read-only ones, copying the measured seeds; **v41** `isolation:
worktree` for the four that touch venture source, `none` elsewhere. Each is reopenable by name in §20.

## 11 · Section 13a — self-improvement had no home in the section plan
The coverage lane, placing "Improvement backlog", found that SPINE §K's twenty-four sections carry no
self-improvement section: FINAL §12 (three loops at three speeds, horizons on everything durable, corrections
logged as defects in the brief, the refusal line, the rethink trigger) inherited nowhere. Added as §13a between
memory and mission control rather than renumbering fourteen cross-referenced sections. A hole found by a
mechanical placement pass, not by reading — the pattern this repo keeps recording.

## 12 · v42–v52 — eleven decisions the review round forced, decided by the orchestrator for the fix round
Census, challenge A and challenge B returned 4 + 32 + 23 findings. Eleven needed a decision §A did not carry; each
is decided from a rule already on the page or a measured fact, and each is reopenable by name: v42 agent files in
`.claude/agents/`, argv in `keel/shared/argv/`; v43 a grant carrier per dispatch mechanism, night work on `-p` only;
v44 the Watch is the sole writer of obligations, steward proposes; v45 eleven brief fields (`anchor:` added); v46
the Operator is the interactive session started as `claude --agent operator` (one measurement UNVERIFIED); v47
`bin/reconcile` computes, analyst interprets; v48 skills at the house root only; v49 `bin/skill` does not dispatch;
v50 ABSENT vs WISH defined; v51 the curator's five questions are the second admitted step list; v52 the founder's
door writes the card. Every other finding is applied as written, or re-attributed: challenge B's six P1s are facts
inherited from FINAL's measured seam (§7.5, §9.7, §14.6, §14.7, §13.8) mis-tagged as this session's research.

## §14 — Close: reassembly, the page, the landing branch

The fix round landed in `aac18d8` (24 parts); its second pass — P3-31, P3-32 and v53 across seven parts — was swept into `b0be50a` by the reassembly commit, confirmed afterwards against the lane's reported byte counts and by a reassembly that changed nothing. Reassembled to 6,337 lines · 35 flowcharts · 53 rows in §1 · zero
`round-6/` references. Two things the orchestrator did by hand rather than through a lane, both recorded so they can
be judged: §1's preamble still read "v6–v41" after the fix round and now names v42–v53 as the review round; the
page's six stale figures (line count, row count and grouping, "ten of the fourteen carry no shell", seven `?`, the
companion byte count) were substituted in place — figures only, no prose or layout touched, because a designer round
for six substitutions costs more than it checks. `docs/final-v2` is composed by plumbing onto `origin/docs/final-plan`
(7fe8ede, the head of PR #131): the whole of `final-v2/` plus the session file, 42 files. The LONG-TERM note is NOT
on that branch — PR #131's LONG-TERM.md stands at 99 of its 100-line cap and the note is three lines; it lives on
`ceo-1-1788609834` only, for the founder to place. Nothing pushed.

## §15 — The founder's interview on the open decisions · 2026-09-05

Asked through AskUserQuestion in five rounds, every row of SPINE §I plus FINAL §19's five open rows. Answers verbatim
where the founder typed; the chosen option's label where they picked one. Each becomes a row v54+ or a §20 status.

| Row | Answer |
|---|---|
| §I 1 terms | *"When my Mac is not on, and then we need to use not the regular Claude code or codex in terminal, then you can use codex or Gemini I think they don't bun those. But still keep it open"* — **stays open**; clarified next round as **"Yes — a cloud lane for when the Mac is off"**, research on **Codex cloud tasks (OpenAI hosted)** only |
| §I 8 managed file | **Yes — I will write it when building starts** |
| §I 5 Codex | *"I will install it when the building starts, no need to think about now"* |
| §I 6 gemini | **Authenticate with a personal Google account** |
| §I 7 agent teams | **Turn it on, no model constraint** — teammates use their agent file's model |
| §I 9 card → team | **Both: the card carries a 'solo or team' toggle**, default from the intent's kind |
| §I 10 3D graph | **Build it, but last in the page order** |
| §I 12 the room | *"use pixel-agents code or Star-Office-UI or AgentOffice"* — three candidates not in any research lane; a sourcer lane reads their licences from the file |
| §I 2 Fable | **Fable as builder's and architect's default** (overrules v21's escalation-only) |
| §I 3 Haiku | **Set ANTHROPIC_DEFAULT_HAIKU_MODEL to Sonnet 5 now** |
| §I 4 LICENSE-CONTENT | **Fetch it at build time** — row stays open, library plan as written |
| §I 11 second human | **Me only, for now** |
| §I 13 first venture | **The harness itself** |
| §I 14 roster size | **Start with the eight that have seeds or code paths** — Operator, builder, reviewer, architect, tester, guard, scout, designer; the six business agents and challenger come online when a venture needs them. *"and also plan the agents that will run on hermes agents - jobs or tasks that is fit for that."* Then: *"skip hermes for now. but think about agents like: customer support, marketing agents: leads, reacherch, security, competers, data anslisis and more that can run every set time or evant or something else. it to build the company like working."* |
| FINAL §19.12 overnight | **Run the comparison; let the measurement decide** |
| FINAL §19.13 sliders | **Keep 30% and 3/day; evidence moves them** |
| FINAL §19.6 + 19.7 hook rewrite · pmset | **Neither yet — decide at build time** |
| FINAL §19.8 disclosure · entity | **Disclose by default; entity per venture decided at intake** |
| standing jobs | **Standing intents with a cadence or trigger, run by the Watch** |
| next step | **Fold them into v2 now: new rows, §20 updated, research lanes for the new items.** Still nothing built |
| push | **Do not push yet** |

## §16 — The interview round, applied · 2026-09-05

Every answer of §15 became a SPINE row (v54–v65), a §I status, or a §J losing image (43–54). Two rows the founder
answered with a thing to research rather than a thing to do were decided the same day from two sourcer lanes recorded
verbatim: **v62** from research/room.md — pixel-agents (MIT, licence read from the file, alive, reads Claude Code) over
Star-Office-UI (assets non-commercial, stale) and the ambiguous "AgentOffice" (the likeliest match needs an LLM to
render); **v56** from research/cloud.md — Codex cloud admitted as a PR reviewer through `@codex review`, Codex cloud as
a maker UNVERIFIED because no vendor page prints a command or endpoint, and the only fully documented off-Mac drivers
are Anthropic's (`claude --cloud`, Routines with an API fire endpoint) and Jules (alpha). That opened **§I row 15**
(which hosted lane may make when the Mac is off), the founder's, beside row 1 (the terms), which the founder kept open
by their word. Five builders folded the rows into the sections in parallel by file ownership (A: §1–§5, §9, §16, §19,
§20, §22; B: §10, §14, §15, §17.6–7, §18; C: the v56/v62 sync into §1, §19, §20, §22; D: §15.6's cloud rows; E:
COVERAGE re-placement); a designer lane re-renders the page. One correction to FINAL falls out: §13.8's *"no Claude
Code fleet surface is spatial"* is overturned by three live projects. What no lane could do: register the durable
facts as ledger claims — the claim-append server is in no lane's tool set — so that is a build-time task, named in the
session file. Nothing built, nothing pushed.

## §17 — The rethink round · 2026-09-06

**The founder, verbatim:** *"So now I wanted to adjust the research and the thinking according to my answers. I wanted
to run back a couple of agents, a couple of thinking agents to think about ways to improve and to scale, change, do
differently rethink parts of the system because we were looking for the best system that we can ever have in all of
those fields. So doing a rerun on the current system will help us achieve that. Remember that that list is keyword
only, so you need to reason to understand more first to haven't talked about."* — and the 35-section list re-sent.

**What runs.** Eight thinking lanes (`framer`, model overridden to Opus as for the spine — DECISIONS §7) and one
sourcer lane, each by reference to SPINE v1–v65, the sections, COVERAGE and the research, with the founder's list
copied to `final-v2/rethink/FOUNDER-LIST.md`. The founder's rows (v1–v5, v54–v65) are fixed: a lane improves inside
them and does not reverse them. Every other row may be challenged with a reason. For every keyword a lane first writes
what it means for a one-founder company of agents, then where v2 has it, then a verdict — KEEP · IMPROVE · RETHINK ·
ADD · REFUSE-STANDS — and for anything but KEEP a proposal with its mechanism, its cost once, what would settle it, and
the SPINE row it moves. Outputs land as files under `final-v2/rethink/`, committed as they land; a synthesis follows;
the founder decides through AskUserQuestion, as in the interview. Nothing built, nothing pushed. Fan-out is nine by
direct dispatch, the founder's standing preference (DECISIONS §5).

## §18 — The founder's decisions on the rethink synthesis · 2026-09-06

Asked in four AskUserQuestion rounds from rethink/SYNTHESIS.md §1, sixteen decisions D1–D16. **The founder chose the
recommended option on all sixteen.** Recorded by label; each becomes a SPINE row v66–v81.

| D | Decision | Founder's choice |
|---|---|---|
| D1 | Mission control's identity and the phone | Loopback bind + a keychain-held token on every write route + an authenticated tunnel for the phone |
| D2 | What the cord stops | Both: the launcher records each child's process group and the cord signals it; `bin/run` refuses unattended work on a carrier whose stop path is UNKNOWN |
| D3 | One egress program | Build `bin/egress`; `--strict-mcp-config` names only the proxy; the MCP policy file becomes its configuration |
| D4 | Erasable data path and consent | Both now: hash in log and memory, one erasable per-subject store, a consent register with one writer read by the Sender before any contact |
| D5 | Wave one | Curator and challenger both join wave one |
| D6 | Onboarding pack | Yes, every agent, wave one included — not routable without it |
| D7 | Agent expiry | Yes, all fifteen carry `valid_until` with a forced disposition (Refresh · Merge · Retire) |
| D8 | Rate the anchors | Every anchor carries a mutation case or is marked unrated; §21's rung-1 share splits rated/unrated |
| D9 | Currency | Ceilings in window share (tokens against an observed high-water mark), USD as a shadow price; exploration routed off the Claude seat past a founder-set fraction |
| D10 | Desk ranking | Lexicographic: obligations · unblocking work · weight band · cheapest; `Decay` split and defined for standing intents |
| D11 | Away mode | The last founder event as a derived value: release the reserve when away, execute a which's default at expiry, build one option not two, a since-you-left view |
| D12 | Skill budget | Per-agent startup metadata budget, enforced; one generated directory per namespace |
| D13 | Fallback | Three-deep `fallback:` per agent ending in stop-and-stage; cross-family reroute is a rung demotion unless rehearsed; a frozen `class: calibration` set; one provider-outage drill |
| D14 | Hosted lane | Measure hours-off first; add the charter field `cloud: allow \| deny`, default deny, now |
| D15 | Agent-to-agent messaging | A message is a handover or an objection on the handover schema, one append-only file each; asks carry a deadline and a fallback; the vendor transport's ids are attributes, never a join key |
| D16 | Rethink triggers | `source:` and `valid_until` on every fact-based SPINE row; a scout standing intent re-fetches them; one `wins_if:` line per losing image |

## §19 — One deletion decided, one measurement taken · 2026-09-06

**Deletion 27 (SYNTHESIS §7, marked the founder's):** *"Delete the row from the plan"* — §11.3's three-family review
panel row goes. The repo's three live `verified_by: judge` claims and the founder waiver to 2026-11-17 are untouched;
D13's fallback chains and calibration set are what stands in its place, and the two-family route runs through the
no-model launcher, outside any Claude session.

**R5, hours the Mac is off (prices D14), measured from `pmset -g log` on this Mac, 2026-09-06, read-only:** **span 2026-08-30 21:44 → 2026-09-06 09:39 (156 h, all the log retains) · asleep 40.7 h (26%) in 487 episodes · zero episodes of one hour or longer · longest single sleep 0.3 h (about 20 minutes).** The Mac was never off long enough for a cloud lane to have bought anything back this week; the tail it would buy is measured at zero over 156 hours. Caveat: the
log covers only the span it retains; DarkWake power-naps are counted as wakes, so "asleep" here means the machine could
not have run a process. This is the measurement D14 asked for before deciding the hosted lane; the decision itself
stays the founder's.

## §20 — Two names decided while the rethink round was applied · 2026-09-06

**The work-item store (O1) is `keel/ventures/<v>/items/i-*.yml`, drafts in `items-draft/`.** Builder B2 found the
collision: O1 said `work/`, and §17.8's tree already gives `work/` to the venture's own source repository. Renamed by the
orchestrator; the fields are unchanged. **v69's two stores take B2's coined paths:** `keel/consent.yml` (the consent
register) and `keel/subjects/<hash>.yml` (the erasable per-subject body). **`cacheTtl` ships `unset`** in every agent
row: W6 gives the column, no row decides a value, and the test that would decide one is written beside the column.

## §21 — Challenge C's findings, decided for the fix round · 2026-09-06

Thirteen findings (4 P1 · 5 P2 · 4 P3), review/challenge-c.md. Decided by the orchestrator from rules already on the
page; none reopens a founder row.
- **P1-1** v18's row now reads "two places" as v51 decided; §13.8, §13a.10 and §17.2 follow. — **P1-2** §19 takes v70:
  wave one ten, wave two five. — **P1-3** §12.7 takes §5.2's corrected count (eleven of the fourteen carry no shell) and
  cites the generated roster (O2), not "§B.2's summary". — **P1-4** `.gemini/agents/` in §17.8 is a **generated view of
  `roster.yml` (O2)** for the agents Gemini may stand, not a third home: v42 stands (one home), the generator is O2's
  mechanism, and §10.8's "gap recorded" sentence is replaced by that. Recorded as the orchestrator's reading of W25 under
  v42, reopenable by name.
- **P2-1** v76 gets a path: `bin/log` writes `keel/logbook/founder.last` on every founder-authored event and `bin/watch`
  reads it — ABSENT, not WISH. — **P2-2** §5.1 rule 4 gets a mechanism: `bin/check-stores` refuses an agent file whose
  name is on `roster.yml`'s `kind: program` list, and refuses a `model:` on any program entry — ABSENT. — **P2-4** §15.4's
  two cadences become the founder's numbers on two obligations (`recurs:` set in the charter, like `undo_window`), never
  a schedule in the plan; the escrow half is marked WISH with its three items named. — **P2-5** §4.5: the spinning slot is
  one slot inside the reserve, accounted in §4.2's arithmetic, ABSENT in `bin/watch`; "re-ranks on a cadence" becomes
  "re-ranks on every tick" — the tick is the Watch's own setting, the founder's number, not a schedule.
- **P3-1** R20 exists in SPINE §N (the roster-size ablation); the plan simply never cites it — §21 cites it beside v31.
  **P3-2** R26 marked OPEN where it is named. **P3-3** §20 gains §20.8, the R-list (SPINE §N reproduced, with status).
  **P3-4** the CODEXTEST node and §17.7 take W19's wording.

## §21b — Census C's findings, decided for the same fix round · 2026-09-06

The census lane (reviewer, measurement only; `review/census-c.md`, six parts) returned **FAIL on three P1, PASS on
everything measurable**: 29 of 31 re-measured figures match, R5's power-log span reproduces to the second, all 82 vNN
rows and every §-reference resolve, zero ABSENT-and-unmarked paths. Twenty of SYNTHESIS §5's twenty-two contradictions
closed. Every failure is the same class — the rethink round was applied to the early sections and not carried into the
late ones. Dispositions, all orchestrator-class (rules already on the page decide them):

- **A (P1) §19 builds the pre-v70 roster** — already challenge P1-2; wave one ten, wave two five, in §19.1's nodes,
  §19.2's rows and §19.3's prose. **B (P1) "ten agents plus the Operator" sums to sixteen** — reworded *"ten
  including the Operator, not eight"* at SPINE v70 (orchestrator, `f0b9d72`) and its three copies (v70 row, §3.5,
  §20.7 D5). **C (P1) §15.8 carries the 4x-ceiling check-in W14 superseded** — struck, corrected reading as v12's
  row, since §15.8's preamble promises nothing above contradicts it. **D (P1) shell count three ways** — §12.7 eleven
  and §8.7's CLI row drops `analyst` (already in the fix brief; contradiction 1). **E (P2) two owners of the hands
  table** — §8.7's thirteen-row copy reduced to a binding column, §17.3 the owner (already in the fix brief;
  contradiction 19). **F (P3) §15.5 "§16 carries the arithmetic"** → §9.6 owns it, §16.3 restates. **G (P3) eight or
  nine lanes** — no edit: the header's own sentence reconciles them (eight thinking lanes plus the sourcer lane); the
  header's "nine lane files under rethink/" is corrected to eight plus `research/world.md` (already in the fix
  brief). **H (P3) §20.6's v54 row states the old composition in the present tense** — composition struck and pointed
  at v70; the two-waves decision itself stands.
- **Two claims the lane could not settle under its seal:** W16/W28/W29 and R20 do exist in SPINE §M/§N (the lane was
  sealed from SPINE by brief); the fix round carries them into the plan's §1 preamble and cites R20 beside v31.
  COVERAGE §14's charter-field count is re-checked at reassembly.
- **Not re-litigated:** the census's finding that the fix round itself is single-family, single-agent. Accepted risk,
  same as every review in this repository since 2026-08-23.
