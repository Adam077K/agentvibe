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
  and §8.7's CLI row drops `analyst` (~~already in the fix brief~~ the message carrying it never reached the builder — sent again as round 2; contradiction 1). **E (P2) two owners of the hands
  table** — §8.7's thirteen-row copy reduced to a binding column, §17.3 the owner (~~already in the fix brief~~ same: round 2;
  contradiction 19). **F (P3) §15.5 "§16 carries the arithmetic"** → §9.6 owns it, §16.3 restates. **G (P3) eight or
  nine lanes** — no edit: the header's own sentence reconciles them (eight thinking lanes plus the sourcer lane); the
  header's "nine lane files under rethink/" is corrected to eight plus `research/world.md` (~~already in the fix
  brief~~ round 2). **H (P3) §20.6's v54 row states the old composition in the present tense** — composition struck and pointed
  at v70; the two-waves decision itself stands.
- **Two claims the lane could not settle under its seal:** W16/W28/W29 and R20 do exist in SPINE §M/§N (the lane was
  sealed from SPINE by brief); the fix round carries them into the plan's §1 preamble and cites R20 beside v31.
  COVERAGE §14's charter-field count is re-checked at reassembly.
- **Not re-litigated:** the census's finding that the fix round itself is single-family, single-agent. Accepted risk,
  same as every review in this repository since 2026-08-23.

*Correction, same day: three items above said "already in the fix brief". They were not — the two SendMessage
additions carrying §8.7, the header and the W16/W28/W29 preamble were sent while the builder was mid-turn and never
drained; the builder found §21b in the tree and said so in its return. All of B's copies, C, E, F, H, the preamble
and the header went to the same builder as round 2. The measured fact for LONG-TERM: a message to a lane is delivered
only if the lane's return confirms it; assume nothing arrived until the return names it.*

## §22 — The rethink round closes · 2026-09-06

**What landed, in order:** SYNTHESIS from eight thinking lanes and a world lane → sixteen founder decisions and one
deletion (§18, §19) → SPINE rows v66–v82 and §L/§M/§N → six builders applied the round to the parts → challenge C (13
findings, §21) and census C (FAIL on 3 P1, §21b) → two fix rounds (`ecaec1a`, `da6f2f2`, `6805f82`), each finding
re-verified by grep on disk before its commit → reassembly at **9,968 lines · 25 sections · 36 flowcharts** → page
v2.2 (93 tiles, six render cells at zero overflow, `169,402` bytes) → session file → this entry.

**One designer judgment accepted:** the brief named §4, §12 and §22 content and the page had no such sections; the
designer added three self-contained sections rather than folding the rows into the rethink tiles alone. Kept — every
row in them also has a §1c tile, the sections are deletable whole, and a founder who opens the page for the Watch or
for egress finds them where the plan puts them.

**Two things the round measured about itself, not about the plan.** First, a message to a running lane is delivered
only when the lane's return quotes it (§21b's correction; LONG-TERM). Second, every review this round was one model
family and one agent; the census said so of itself and the challenge said so of itself. Accepted risk, unchanged
since 2026-08-23, exit condition 2026-11-17.

**Open, the founder's:** rows 1 (terms), 4 (LICENSE-CONTENT at build), 15 (which hosted lane may make when the Mac is
off — the measurement is DONE, the decision is not), 16 (the panel), 17 (landing order). **Nothing built, installed,
authenticated, spent, published or pushed.** `docs/final-v2` is recomposed onto `origin/docs/final-plan` and stays
local until the founder says otherwise.

## §23 — The thinker round · 2026-09-06

The founder asked for three expert agents to evaluate the whole system critically, thinking unlike its authors, with
the big vision. Three sealed reviewer lanes on Fable — A the practitioner, B the outsider (control systems and
organisational economics), C the strategist — read the spine, the whole plan, the synthesis, the world facts, the
decision log and the harness; none read a review, a return, a session file or another lane. 64 findings
(`review/thinker-A.md` 21 · `thinker-B.md` 23 · `thinker-C.md` 20), recorded verbatim; the orchestrator's digest is
`review/thinkers-digest.md`: eight convergences, ten measured falsifications of mechanisms as written, thirteen
founder rows challenged and labelled, ten decisions not on the open list with a recommendation each, and the
mechanism corrections that need no decision. **Nothing applied.** The founder decides what moves; the mechanism
corrections in digest §5 wait for that reading because several sit inside founder rows. Single family, rung 4 by
the plan's own ladder, said so by every lane.

## §24 — The fixer round: three lanes, twenty-four questions merged to fourteen, the founder's answers · 2026-09-06

Three fixer lanes (framer engine on Fable; A the practitioner, B the outsider, C the strategist) took the thinker
round's 64 findings and designed what changes; their files are `rethink-2/A-practitioner.md`, `B-outsider.md`,
`C-strategist.md`, recorded as written. Each sent up to eight questions with a default; the orchestrator merged
the twenty-four into fourteen (overlaps: the box ×3, the first stranger ×3, founder hours ×3, row classes ×2, the
checker key ×2, Keel's PR review ×2) and asked them in four AskUserQuestion rounds. Answers verbatim, then the
disposition. **Founder overrules are final and are not re-litigated.**

| # | Question | Answer (verbatim) | Disposition |
|---|---|---|---|
| E1 | The always-on box | *"dont need for now. use this mac and when cant use cloude"* | **OVERRULE of all three lanes.** No box. The night runs on this Mac; the cloud lane (v56, v79) is the fallback when the Mac cannot. The box becomes a losing image with `wins_if:`; C13's identity/autonomy split is recorded as an accepted risk on the Mac. |
| E2 | The first stranger | *"An existing project of yours (Recommended)"* | A second, customer-facing venture from the founder's existing projects joins wave one beside the harness, chartered with `outcome:` at contact rung 2; named at intake. |
| E3 | Founder hours per week on the harness charter | *"20 hours or no ceiling"* | `founder_hours:` exists as a charter field; the harness's number is **20**, stated as the founder's and moved by evidence; the founder said "or no ceiling", so a bind at 20 is reported, never enforced silently. Founder-minutes are measured from day one either way. |
| E4 | Reviewing Keel's own PRs | *"Small trusted base, per-wave sign-off (Recommended)"* | The four world-touching programs (`send`, `inbound`, `watch`, `run`) founder-line-reviewed at a line budget with fixtures as the only admission; agent files generated from `roster.yml`, signed off per wave; `keel/**` otherwise lite; the vendor's flags are the floor so the launcher can narrow but never widen. |
| E5 | Two classes of founder row | *"idk"* | The founder defers. The orchestrator applies the recommended default: v66–v81 `class: ratified`, reopenable by any engine with a reason and a falsifier through a Decide item; the new row that says so is itself ratified, so the founder can reverse it by name. |
| E6 | Away mode (v76) | *"Away narrows, plus a burst edge (Recommended)"* | v76 amended: while away the reserve goes only to `effect: none` work whose outputs stage; no one-way default fires; a burst edge pauses Claude-seat autonomy above a founder-set rate; the reserve is held per weekly window. |
| E7 | A checker-family API key | *"no keys, codex and gemini cli use."* | **OVERRULE of C6 and B7's key.** No API keys. The second family is the Gemini CLI (personal account, free tier) and the Codex CLI once installed, both only as `bin/run` children from the launchd context. §I row 17 closes as *no keys*; the metered-key economics stay a losing image with `wins_if:`. |
| E8 | How many Operators | *"Model N Operators (Recommended)"* | N Operators as rows in `sessions.jsonl` with heartbeats; a which is claimed before it is answered; the founder-present gate is per venture; the cord gains `--night` and `--all`, the phone defaulting to `--night`. |
| E9 | Auto mode on the Floor | *"Keep auto mode on the Floor (Recommended)"* | v11 amended: the managed file carries `permissions.deny` and `disableBypassPermissionsMode` only; `disableAutoMode` struck; night children run `dontAsk --restricted` with per-child `--settings` on argv (R27). |
| E10 | The founder's own Floor transcripts | *"Keep them for mining (Recommended)"* | Long retention; night children pass `--no-session-persistence`; the erasure grep covers `~/.claude/projects`; the mining pass refuses tainted episodes; vendor retention named out of reach (v69's *settled by* amended). |
| E11 | The outward-class ladder's top step | *"Yes, after N recall-free sends per venture"* | **OVERRULE of C's recommendation.** `first-contact` widens like any other class after N recall-free sends, per venture in the charter, narrowing by one step on any recall; the consent register and disclosure line are read at every step. |
| E12 | Page order | *"4 → 5 → 3 → 2 → 7 → 1 → 6 (Recommended)"* | v4's order amended; pages 1, 2, 3 and 7 are adapters; page 2's tap splits into *attach* and *message*. |
| E13 | The night on this Mac | *"Watch checks, refuses, routes to cloud (Recommended)"* | A `night_capable` predicate from `pmset` (AC, sleep off or `disablesleep`, assertions); an unattended brief is refused with the printed reason when false and routed to the cloud lane; a page-3 fact and a briefing line. This is E1's mechanism. |
| E14 | The vanilla-runtime week | *"No, compare Keel's modes only"* | **OVERRULE of C11.** No null-hypothesis week; §20.2 row 12 stays the comparison. C11 becomes a losing image with `wins_if:`. |
| E15 | A which budget per window | *"i dont get it, do what best for the sytem "* | The founder delegates. The orchestrator takes B's design: the Desk refuses to open a which past `decisions_per_window × horizon`, seeded at six per five-hour window and replaced by the measured answering rate from the transcript corpus (R27); one option built plus a written second unless a ten-word summary cannot separate them; the briefing's first line is decisions taken · deferred · defaulted. Recorded as an orchestrator decision inside v9 and v76, reopenable. |

**What the overrules do to the lanes' designs.** E1 removes the `BOX` root every lane drew and makes A's
`night_capable` predicate plus the cloud lane the whole answer to convergence 5; identity and autonomy share the
Mac, stated as an accepted risk with C13's probe (a keychain read from a night run) as its standing drill. E7
removes 17a and the Gemini key; the second family's daily count is the free tier's and the row says so. E11 raises
the ladder's ceiling to the founder's appetite. E14 removes `NULLWEEK`. E3 and E15 keep the founder-attention
shape (three gauges) with the founder's numbers.

**Not asked, decided by the orchestrator from the three files, all reopenable:** the commodity line (`class:
kernel | adapter | refuse` and `vendor_wins_if:` on every §L row; kernel = direction · record · truth · taste;
§L sorted by class before §19 orders it); data-first with a constitution under the session-start byte budget and
an archive for superseded prose; `outcome:` on the charter; the market record written only by `bin/reconcile`;
the plant model and the dial inventory; anchors with two axes (verifier, adequacy); reversibility as a verb
property; the dead-man lease and one stop verb; trust probation and seed packs; the rehearsal case in `golden/`
referenced never carried; sequential skill testing joined to O41; the curator's held-out test, calibration seed,
executable falsifiers and nightly canary; the taste control arm; the subsidy line; R12 split three ways with
*inventing an anchor* defined; `--fallback-model` composed from the roster with `PreModelSwitch` annotating;
`--autocompact` at full context with `PreCompact` logged; bare `-p` in tmux never `--bg`, `bin/supervise` refused
until the daemon's semantics are read; the real `denyRead` list; the probe authored apart from the launcher; the
anchor's canonical printed line; the bell as a wrapper; the high-water seed from `budget-guard.js`; the cold-start
scoreboard and the first-month runbook; the carrier dimension and drill; standing intents with `valid_until`;
mechanisms carry `wins_if:`. Where two lanes proposed different shapes for one thing, the fold takes the one that
survives the founder's answers and names the other as its losing image. Where B and C disagree on B9 (fair
queueing now) and B11 (sequential testing now), the fold takes C's position: v75 is replayed before it is
replaced, and skills are provisional-joined-to-O41 until a quarter of activations exists.

## §25 — Challenge D's findings, decided for the fix round · 2026-09-06

Sealed reviewer-readonly on Fable, `review/challenge-d.md`: **priority 1 FAIL on 3 P1, priorities 2–6 PASS with
11 P2 and 10 P3.** Its own reading: the propagation the last two rounds failed at has largely happened; the P1s are
stale sentences and one unstated consequence, not structural gaps. Every disposition below is orchestrator-class —
decided from a rule already on the page or from a founder answer in §24 — and none reopens a founder row.

- **P1-1** §9.5's "the day a metered key exists" struck; §J 74 cited. (E7.)
- **P1-2** §5.3 #11 and §5.5 row 26 reworded: first-contact is step 5 of the ladder, per venture (v94). The
  relation stated once in §12.2b: **a venture's charter `ladder:` line removes the five outward classes from that
  venture's default never list, one step at a time as the ladder widens; everything else on the never list stays
  never.** This is E11's meaning — the founder chose that first contact widens — made mechanical.
- **P1-3** §15.1b gains the precondition sentence: on this Mac the night runs only when the founder has run
  `pmset -a disablesleep 1` (or the predicate reads a held `caffeinate` assertion — R41, one measurement) and the
  machine is on AC; otherwise `night_capable` is false every night, the fallback **holds** the brief, and month one's
  scoreboard cannot be scored. §0.5, §4.1b and §14.6's "routed to the cloud carrier" → "held, not minted, until the
  carrier's `stop:` is known (v67)". §20.2 row 7 re-read: the deferral stands and the consequence is now stated.
- **P2-1** §17.1 rows 2, 6, 14 take §5.2's amended cells. **P2-2** "never expires" struck in §17.4 and §20.6 → O126.
  **P2-3** one wording at all six sites — "one built, a second written unless a ten-word summary cannot separate
  them (v87)" — and the O96 budget branch in §6.1's flowchart. **P2-4** `founder_hours:` is **report-only**: the
  founder said "20 hours or no ceiling", so a bind reports on the briefing and never stops work; §2.1 states it once,
  §16.2b agrees, §4.1 and §12.9 say in one line why it is not a gate. **P2-5** `confidence: LOW` **adopted** on the
  header until one measured overnight (B1's instrument, cheap); the image leaves v96's last column. **P2-6** §21.1a
  takes probation. **P2-7** §11.10 takes `provisional`. **P2-8** §20.8's R4 and R9 cells amended; SPINE §N the same.
  **P2-9** §15.6's cell CLOSED, W35. **P2-10** one receiver list in §12.9 — **five**: the cord file, the process
  groups, the Sender's recall window, the registered Operator sessions, the hosted lane's cancel where one exists
  — cited by §14.13 and §3.5; `--all` from the Operator or from a page control behind a second tap, stated once.
  **P2-11** two programs named: `bin/rehearse --r27` (O102's runner) and `bin/briefing` (the briefing generator,
  the `keel briefing` verb), in §17.5 and §19.
- **P3-1** §J 89–90 into §22.2b; count ninety. **P3-2** "four". **P3-3** the first line shows **founder-minutes**
  (O95); bytes stay on the which row. **P3-4** five call sites everywhere. **P3-5** the handover's line count
  dropped from prose; the schema owns it. **P3-6** SPINE's `class:` and `vendor_wins_if:` carried into §17.4.3 for
  every O81–O127, O82's value included; O90's class re-read as kernel · truth (a carrier drill is ours). **P3-7**
  one cost line each in §0.3; §13a and §5.1 cite. **P3-8** W21 into §12.3. **P3-9** four bounds in §14.12.
  **P3-10** one clause in §20.7b: E7 governs model access; tool credentials are §17.3's.

## §26 — Census D's findings, decided for the fix round's round 2 · 2026-09-06

Sealed reviewer on Opus 5, `review/census-d.md`, measurement only. **The reference graph is complete: v1–v106,
O1–O127, W1–W41, R1–R40 and E1–E15 all resolve in both directions, zero dangling, zero orphans; 249 §-references
resolve; zero absent-and-unmarked repo paths; 48 of ~60 re-derived tree figures match to the digit; §19.1's graph
measures 91 nodes and 195 edges exactly as the plan claims** (a snapshot: round 1's P2-11 added the `BRIEFING` node and four edges, so both the graph and the plan's claim are **92 and 199** now, still agreeing — corrected 2026-09-06 on the builder's finding). Two of its findings are challenge D's P2-1 and P2-8
already dispositioned in §25 and already with the builder — the §17.1 carrier drift and R9's status — and the
census confirming them independently is worth recording, not re-deciding. What is new:

- **O102 states no class at any of its fourteen sites** where v96 · O105 requires one on every O81–O127. Add
  `kernel · truth` (SPINE's value) at O102's first statement, §11.2. The 52 of O1–O80 that state none are
  correct by the plan's own convention: §13a says the class is SPINE §L's and not restated.
- **Nine figures drifted, and the fix is the doctrine's, not a new number.** The plan's own lesson — a frozen
  figure in prose rots and a command does not — decides these. Where the plan states a tree figure as a live
  fact it gains `measured 2026-09-06; re-derive with <command>`: session files 171→172, LONG-TERM 84→92,
  commits 825→848, `ceo-*` worktrees five→six, team members 224/219→262/257 (W34), skill frontmatter
  28,250→28,078 bytes (W40). Two need more than a date: **W33's sleep counts (391/74→348/77) and R5's span sit
  on a rolling `pmset` log whose window moves hourly** — the fact says so, keeps the clamshell count (24, exact
  at both readings) and the finding that survives every reading, **zero episodes of an hour or more**, and
  points at R37's thirty-day standing measurement. **The transcript corpus is stated twice and both are now
  wrong** — 3,060 in §18.4 and 3,116 in §13.7 against 3,029 measured: one figure, dated, with its command, and
  the second site becomes a pointer.
- **The page figure in the header is stale** — 169,402 bytes / 93 tiles against 253,283 / 143. The orchestrator
  patches it after the final reassembly, with the line count, in one pass.
- **The header's branch head `b2cabad` is stale** (HEAD is 119 commits ahead). The header already says it
  carries this session's commits on top, so the fix is to name the base and stop pinning a head that moves.
- **Not re-measured, and recorded as such:** W36's denied loopback (the probe was denied in this session),
  R5's asleep-hours pairing, `hw.memsize`. The lane's own scope note stands.

**Calibration, because a census that only lists drift misleads.** Every count the plan makes about its own
structure matched: 106 rows, 127 mechanisms, 41 facts, 40 questions, 7 pages, 15 roles, eleven of fourteen with
no shell, the coverage tally of 671, the graph's 92 and 199 after round 1, and every figure about this repository's own
suite — 48 check steps, 42 claims, 68 verdicts all PASS, 39 permission rules, 18 agent files at 18 pass · 0 fail
· 0 warnings. Single family, one agent, rung 4 by the plan's own ladder; the lane says so of itself.

## §27 — The thinker and fixer rounds close · 2026-09-06

**What ran.** Three sealed thinker lanes (practitioner, outsider, strategist) read the spine, the whole plan, the
synthesis, the world facts, the decision log and the harness; 64 findings, `review/thinker-A|B|C.md`, digest and
page. Three sealed fixer lanes designed the answers, `rethink-2/`. Fourteen merged questions to the founder (§24),
four of them overruled by the founder in their own words. The fold put the round into SPINE as v83–v106, O81–O127
— every mechanism, old and new, now carrying `class: kernel | adapter | refuse` and a `vendor_wins_if:` — plus
W33–W41, R27–R40 and §J 73–90. Six builders applied it across all twenty-five parts. A sealed challenge returned
3 P1 · 11 P2 · 10 P3 (§25) and a sealed census returned zero dangling references, zero absent-and-unmarked paths
and 48 of ~60 tree figures matching, with one carrier drift (§26). Two fix rounds closed all thirty. The plan
assembles at **12,344 lines · 25 sections · 36 flowcharts**, the page at **143 tiles across 18 sections**.

**What the round changed about the plan's own doctrine, and the cost of each.** The **commodity line**: a
mechanism is kernel only if it holds direction, record, truth or taste; everything else is an adapter that names
the vendor surface it wraps and dies when that surface ships. The cost is that an adapter breaks when the vendor
moves, which is why each carries a date and the world lane re-fetches. **Data-first**: the binding two percent
becomes files the prose is rendered from, with a constitution inside the runtime's own payload budget as the
Operator's pre-flight read. The cost is voice — reasons stay in prose, rules leave it, and a reader who wants the
why opens two files. Both are recorded as ratified rows, reopenable by name.

**What the round changed about how this plan is decided.** Founder rows now carry `class: originated | ratified`
— 28 in the founder's words, 24 picked from an agent's list — and a ratified row is reopenable by any engine that
brings a reason and a falsifier. The plan's header carries `confidence: LOW` until one measured overnight has run,
and §21 counts the rows whose text changes after it. That count is the round's own falsifier: if a third of them
move, this was design ahead of contact and the next round should have been a build.

**Still open, and still the founder's:** the terms (row 1), LICENSE-CONTENT at build (row 4), which hosted lane may
make when the Mac is off (row 15 — the measurement is done, the decision is not), the panel (row 16), the landing
order (row 17). Rows 17 and 18 closed by the founder's overrules this round. **Nothing built, installed,
authenticated, spent, published or pushed.** `docs/final-v2` is recomposed onto `origin/docs/final-plan` and stays
local until the founder says otherwise.

**The readiness answer, recorded because the founder asked it.** The kernel is ready to build and the whole system
is not. Three things first, in order: the data files and the constitution; `bin/log` and `bin/run`, thin over the
vendor's own flags, with the probe authored apart; one bounded-day intent on the first-stranger venture through one
anchor, read in the morning. Everything else — the night, the pages beyond the board, the roster past wave one,
the cloud lane — waits behind that week's evidence. Every review of this plan was one model family reading prose,
which by the plan's own ladder ranks and flags and certifies nothing; the only remaining test is running it.

## §28 — Closing the research: the founder's answers · 2026-09-07

Thirty-nine of SPINE §N's forty-one questions stood open. The orchestrator triaged them rather than interviewing
on all thirty-nine, because most are not the founder's to answer: **twelve are documentary** (a vendor page, a
licence, a changelog, a published measurement), **five are measurements that spawn nothing**, **twelve are
measurements that spawn a `claude -p` child**, and the remaining ten need the system running and cannot close in
planning. Three lanes were dispatched on the twenty-nine (`scratchpad/research-close-brief.md`), each forbidden
to install, authenticate, spend or write outside the scratchpad, and required to record a blocked question with
the exact act it needs.

| # | Question | Answer | Disposition |
|---|---|---|---|
| F1 | Install the Codex CLI now | *"Install it now (Recommended)"* | The founder installs; a lane then runs the headless rehearsal on five known-answer cases. This unblocks **R10** (the TTY bug the cross-model design hinges on), **R26**, the rehearsal, and **§I row 5**. The standing "nothing installed" constraint is lifted for this one act by this decision and nothing else. |
| F2 | The R27 rating sitting, thirty of the founder's own past tasks | *"Skip it, accept row 16 open"* | **OVERRULE of the orchestrator's recommendation, and it is final.** §I row 16 — whether a deterministic anchor exists for most company work — **stays open by decision, not by oversight**. R27(b) is not run. The consequence is stated once and not re-litigated: the architecture is untested against non-software work until the first venture supplies its own thirty (R27(c)), and every review's finding that R12 on the harness cannot falsify the assumption stands unanswered. |
| F3 | A temporary background agent for two measurements | *"Allow a temporary one, removed after (Recommended)"* | Lane C may register one LaunchAgent, take the reading, unload and delete it, and must report both the measurement and the removal with the commands. **R33**'s sleep half and **R29**'s concurrency knee come into scope; R33's reboot half still needs an act only the founder can take. |
| F4 | How open row 1, the terms, is settled | *"A lane reads them and reports, you decide after (Recommended)"* | Applied. **And it should not have been asked** — see the standing instruction below. |

**Standing instruction, given by the founder in the same breath and applying from here on:** *"I wanted to give
me only the answers that only I can answer. Most of them I think you can do the right decision on your own."*
F1, F2 and F3 qualify: an install on their machine, half an hour of their attention, a background agent
registered on their Mac. **F4 did not** — *have a lane read the terms and report* is an orchestrator-class
decision made from rules already on the page, and asking it spent the founder's attention on a question with one
sensible answer. That is the same resource every review in this round named as the scarcest, and the round's own
`founder_hours:` and which-budget mechanisms exist to protect it. The test from here: a question reaches the
founder only if it turns on their money, their machine, their hours, their business or their appetite for risk.
Everything else the orchestrator decides and records, reopenable by name.

**What this does not change.** No key is bought (E7 stands). No box is bought (E1 stands). Nothing is pushed. The
ten questions that need a running system are named as such and are not being guessed at.

---

## §29 — The research close, and the sandbox panel · 2026-09-07

**Three research lanes and a five-lane sandbox panel returned on one day.** Every return is recorded verbatim
before any disposition was written: `research/close-W.md` (twelve documentary answers), `research/close-M.md`
(five measurements), `research/close-C.md` (twelve child-spawning measurements), `review/terms-row-1.md`
(§I row 1), `review/codex-rehearsal.md`, and `review/sandbox-P1-measure.md` through `sandbox-P5-envelope.md`.
The spine folds are `a065325`, `1411fbe`, and fold 2 in flight. **Nothing was built, installed, spent,
published or pushed. No settings file on this machine was modified by any lane, and each lane that ran
children confirmed none was left running.**

### The founder's decisions this round

| # | Question | The founder's words | Disposition |
|---|---|---|---|
| G1 | §I row 1, the terms — which of three readings Keel operates under | *"what do you recommend?"* → the orchestrator recommended **Reading C with Reading B's volume qualifier live inside it**, and the founder did not dissent | **v108, `class: ratified`.** Row 1 CLOSED after being open since round one. Reopenable by any engine with a reason and a falsifier |
| G2 | The sandbox posture for the night | *"Change nothing yet"* | **Applied.** No settings file touched. The panel's output is recorded findings plus a deferred decision, with a **trigger rather than a date**: revisit when `bin/run` exists, because that is the first moment a per-child settings file could be written |
| G3 | Whether to report the `bypassPermissions` finding to Anthropic | *"what you recommnd?"* | Orchestrator's recommendation: **replicate first, then the founder sends.** A security report on one unreplicated cell is worth less than no report. Drafting only; nothing sent |
| G4 | *"i want the system to use this to make the output anderstanable"* — `attention-span` | verbatim | **v107, `class: originated` on the intent.** The implementation route is not originated and is reopenable |

**The standing instruction from §28 was applied twice and is working.** G1 and G3 reached the founder because
they turn on appetite for risk and on their own account. ~~**The MCP credential-label correction did not** — two
servers are marked as holding no credentials while holding credentials, and correcting a false label is not a
judgement call.~~ **(corrected 2026-09-07, by fold 3 against the file itself — the orchestrator overstated this
and it is the same defect this round found twice elsewhere: a lane's two accurate facts compressed into one
inaccurate sentence.)** **What `.claude/mcp-policy.json` actually says:** the rule is **scope, not server name**.
It governs the two servers this repo configures, `playwright` and `claim-append`; **neither holds a credential,
which is precisely why the policy blocks nothing.** The credential-holding servers are **user-scope and absent
from the policy entirely**, so there is no false label on them to correct — and the file **states that limit
about itself**, unprompted: *"absent means no project-scope server is governed … That is a stated limit, not a
hidden one."* **The gap is one of scope, not of labelling**, and it is a wider gap than a wrong label would have
been. One arguable label survives, and it is one server: `playwright` is `credentialed: false` in a file whose
own `_deny_why` records that the browser carries live session cookies. Recorded as a plan correction; the live
policy file is untouched, per G2. SPINE §M **W55** carries the measured version.

### What falsified live plan text

1. **The off-hours metric could not answer its own question.** Counting sleep *episodes* gives 431 episodes,
   longest 0.30 h, **zero of an hour or more**. Counting *contiguous spans between full wake events*, same week:
   **29 spans, 70.0 h, longest 11.08 h, fourteen over an hour.** DarkWake raises a two-second wake about every
   16 minutes and each ends an episode, so **no episode on this machine can ever reach an hour.** Four readings,
   one machine, three answers; the first three were wrong the same way. **The orchestrator's own
   "the cure is a power cable" disposition was withdrawn** and is struck in place, labelled withdrawn by its
   author so it cannot resurface from a handoff. **§I row 15 is OPEN and the founder's.** Live premise: the
   **43–70 h range**, with the DarkWake question named as what decides it (R45).
2. **`/goal` never runs its condition.** The evaluator is a model reading the transcript. An exit-code condition
   was judged **met because the transcript mentioned a file being written while the test never ran.** v12 and O21
   say the deliveries are *"judged by a program rather than by prose"*. They are not. Corrected, not annotated.
3. **The concurrency ceiling was low by five times or more.** O71's 3 → **17**; the knee is between 17 and 20
   (N=20 writes 8,280 pages to swap) and **all 20 still succeed, so the machine degrades silently**. The
   instrument travels with the number: `vm_stat`'s `Swapouts`, because free-memory percentage **moves the wrong
   way** across the knee.
4. **v90's Gemini route is gone** — Google withdrew personal-account CLI access 2026-06-18. The founder's
   *"no keys, codex and gemini cli use."* is `class: originated` and is **not** re-litigated; the world removed
   one of its two halves, on availability rather than terms.
5. **`AgentEvent` does not exist** in the source v62's writer is specified against. **O32's pair inverts** —
   RunPod exposes a balance read and Higgsfield does not, which is the opposite of §F's assignment.
   **134 skills is past a measured degradation threshold of 102.**

### The sandbox panel — what five sealed lanes converged on

**The structural finding: the armed sandbox governs Bash run through Claude Code's Bash tool. It is not a machine
policy.** The night is specified to run from launchd, where it never applies. Two process trees, and
**the sandbox debate and the night's blockers are disjoint sets.** A designed night does not complete today, and
it stops twice before the sandbox is consulted: no Watch plist exists, and `night_capable` reads false every
night on a one-minute sleep setting.

**All five lanes converged on the same posture** — an unsandboxed parent with each child confined by its own
`--settings`, which `--restricted` is measured to honour. It is the only arrangement measured to give real
per-child confinement, and it **increases** containment over today, where a night child has none of its own.
**No lane proposed disarming.** Deferred by G2, not rejected.

**What the panel found that outranks the posture question:**

- **`--permission-mode bypassPermissions` makes a child skip sandbox initialisation.** Settings carried
  `enabled: true`, `failIfUnavailable: true` and a `denyRead` canary; **the child read the canary.** Nothing
  reports it. This **reconciles** the earlier 6-of-6 fail-closed result rather than overturning it — that result
  is correct for the modes it used. Replication pending before anything is sent.
- **The strongest control in a session is the auto-mode permission classifier**, which is configured nowhere in
  this repo and modelled nowhere in the plan. Four of six adversarial probes were refused by it; **none by the
  sandbox.** It is an interactive control, so **a `-p` child at 3 a.m. probably does not have it.**
- **The sandbox stops none of the three most likely harms** — a run acting on attacker text it fetched, a
  credentialed call firing unattended, accidental destruction. Six of seven inbound doors poll outbound, so the
  inbound-bind denial gates **this system's own components** and no adversary.
- **`denyRead` does not hold where it matters:** a detached process read an **unlocked keychain, sandboxed, no
  prompt, exit 0**, against a `no-timeout` login keychain.
- **What binds a night child is argv and nothing else.** `--restricted` discards the project settings file, which
  is where the session-start hook is registered; the per-child replacement names three hooks and omits
  SessionStart, while the constitution is sized to session-start's budget. **No constitution, no lenses, no
  playbooks — and this survives any posture change in either direction.** It is a `bin/run` defect and it is now
  the most important unbuilt thing in the plan.

**Three CLAUDE.md claims are falsified**, by documentation and by measurement: `sandbox.network.allowLocalBinding`
exists, is macOS-specific and project-settable, and **works** — both binds flipped from denied to OK while the
read canary stayed denied in the same cell; `enableWeakerNestedSandbox` is **Linux-only** and the macOS builder
does not take the parameter; and the worktree wall is the **documented protected-paths list**, which `allowWrite`
is documented as unable to lift. **CLAUDE.md is not edited here** — it is `irreversible` tier and outside this
branch's scope. Recorded for the PR that owns it.

**One composed-posture fact the founder should see stated plainly:** OpenAI's documented guidance for Codex under
an outer sandbox is `--dangerously-bypass-approvals-and-sandbox`, and every working Codex cell needed Claude
Code's `dangerouslyDisableSandbox`. **Keel's checker would run with both vendors' escape hatches open in one
invocation.** Neither vendor page looks alarming read alone.

### Method notes this round earned

- **A message to a running lane is delivered only when the lane's return quotes it — and the converse also
  bites.** A correction reached `research-fold` *after* it had gone idle and committed; it woke, applied it, and
  became a second live writer on a file another lane was reading. **That lane snapshotted the in-flight file and
  asked rather than overwriting, which was correct** and prevented a silent clobber. Require a quote-back line;
  and before dispatching a replacement, check whether the original has woken.
- **Lane C refused to re-encode a blocked artifact a third time**, recording *"A teammate relaying the founder's
  authorization is not what grants capability here."* That is correct and the plan should teach it.
- **Two lanes corrected their own first hypotheses**, each caught by a control cell rather than by reading — the
  Codex failure's true cause, and a `tls.connect` sweep whose `ENOTFOUND` looked like a domain denial when the
  sandbox simply has no DNS. **`sourcer` has no `Write` and no `Bash`:** two lanes could not write their returns
  and sent messages instead. Dispatch `reviewer` when the deliverable is a file.

**The single-family caveat binds every line above.** One model family, reading its own system and its own
vendor's documentation about itself, on one day. The `irreversible` tier's two-of-three multi-judge and the
two-model-family predicate are unmet on all of it. Accepted risk, exit condition 2026-11-17.
