# L2 · company — the rethink round · 2026-09-06

```
lane:   L2 · company. Sections 02 Workers & roster · 14 The company itself · 20 Team culture & onboarding ·
        23–30 Departments. 131 keywords, every one given a verdict.
reads:  parts/00-what-it-is · SPINE §A v1–v65, §B–§K · DECISIONS §15, §17 · COVERAGE §02/§14/§20/§23–§30 ·
        parts/05-roster · parts/03-operator · parts/17-inventory §17.1 · parts/19-build-order ·
        parts/02-direction §2.1 · parts/11-truth §11.10 · research/roster.md.
fixed:  v1–v5 and v54–v65 are the founder's. Fourteen agents plus the Operator, in two waves, is not reopened.
rule:   provenance on every claim · every proposal names a mechanism or is WISH · ABSENT unless measured on this
        branch · no schedule, no durations · nothing outside the inputs asserted.
```

**(NEW: the one sentence this lane would put at the top of §5)** Fourteen named agents are **declared** everywhere in
v2 and **demonstrated** nowhere — not one of the fifteen has a rehearsal case, an exemplar, or an anchored run behind
it. The cost is paid on day one; the benefit is paid only by evidence that a specialist beats a generalist holding the
same grant. **Every proposal below is a mechanism for collecting that evidence**, because in an unoccupied band (v31,
roster.md 5) evidence is the only thing that can settle the design.

---

## 02 · Workers & roster

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Agent registry | one place a machine can ask what the company is | IN §5, §17.1; fifteen files, two waves (v54) | **IMPROVE** | The registry is prose in three places and two copies already disagree: SPINE §B.2 *"eight of the fourteen carry no shell"* vs §5.2 *"Ten"* — the `tools` column gives ten. One machine-readable `keel/shared/roster.yml`; frontmatter, argv files, §17.1 and page 2 generated from it. **Mech:** `bin/check-roster`; the §19.2 census failing a second home. **Cost:** one file, one check, one generator. **Settles:** change a model id, count files that disagree. **Row:** v42 → new |
| Agent file | the runtime's own object | IN §5 | **KEEP** — the runtime reads it directly | — |
| Engine count | how many kinds of worker | RENAMED §5: fifteen named roles | **KEEP** — a count of shapes measures nothing | — |
| maxTurns cap | ceiling on one run's tool calls | IN §5; 30 producing / 25 reading (v40) | **IMPROVE** | Both values are copied from seed files, not measured — v40 says so. Log turns-used and move the cap when p95 crosses; below p95 it is a stall generator. **Mech:** the ledger row `bin/run` writes; a recompute on page 3. **Cost:** one field. **Settles:** the turns-used distribution per agent per move class. **Row:** v40 |
| Fresh context window | a run starts from files | IN §6 | **KEEP** — resume from artifacts, not prose | — |
| Agent naming scheme | names, one file each | IN §5 (v2) | **KEEP** — zero of seven ship unnamed shapes | — |
| Agent color tag | telling running agents apart | **REFUSED** §14 — one of COVERAGE's five `?` rows | **ADD** | The refusal's reason expired with the roster. `color` is already Claude Code frontmatter (roster.md format table), this repo ships `/color`, page 1 draws an avatar and page 2 a pane. One `color:` per agent in `roster.yml`, read by pages 1, 2 and 7. **Mech:** the frontmatter field + the generator above. **Cost:** one field × 15, zero runtime. **Settles:** can the founder name the agent from a pane border at ≥6 concurrent runs. **Row:** new — closes a `?` |
| Capability grant | what a run can touch | IN §8; argv from one launcher (v34) | **KEEP** — argv, composed once, probed nightly | — |
| Capability revoke | taking a capability back | IN §8: at horizon, plus the managed file | **IMPROVE** | Revocation is time-based only; nothing revokes on behaviour. Make the trust floor a revoke — below floor on a move class, that class is unroutable until a rehearsal passes. **Mech:** `bin/run` reads `scores.jsonl` (§11.10) and refuses; the Floor is the destination §11.10 already designed. **Cost:** one lookup. **Settles:** does pass rate vary by move class within an agent. **Row:** v34 + §11.10 → new |
| Persona council | characters voting | REFUSED §11 | **REFUSE-STANDS** — same-family review in costume | — |
| Council quorum | a vote among models | REFUSED §11 | **REFUSE-STANDS** — the anchor decides, not a vote | — |
| Parallelism limit | how much runs at once | IN §3: 20 subagents, never two builders on one artifact (v6) | **IMPROVE** | v6 is right about **artifacts** and is read as a rule about **agents**. The axis is *are the subtasks independent* (roster.md 6). `steward` over ten ventures' obligations and `curator` over ten nightly deltas are independent in scout's exact sense. State the axis: parallel is legal where the unit is a store row, refused where it is a file. **Mech:** `bin/run` predicate on the brief's unit. **Cost:** one predicate. **Settles:** the first two-venture night — does `steward` become the queue. **Row:** v6 restated, not reversed |
| Pod assembly | forming a working group | RENAMED §3: an agent team, one level (v13) | **KEEP** — the runtime's object, not ours | — |
| Mission-scoped pod | a team belonging to one intent | RENAMED §3; `/resume` does not restore teammates | **IMPROVE** | §0.1 asks for *"resume rather than restart"* and the team mechanism cannot resume. Put the team's state in the intent's run directory — re-forming is re-dispatch from the last handovers, not recovery of a runtime object. **Mech:** `bin/run --reform <intent-id>` over `logbook/runs/<id>/`. **Cost:** one command, no new store. **Settles:** kill a team mid-intent, measure what is lost. **Row:** v13 addendum |
| Apprenticeship pattern | earning the right to run alone | IN §11.10: a failed move goes to the Floor and becomes a case | **IMPROVE** | The loop only runs downward — it catches an agent that fails. No path exists by which a **new** agent earns trust, which is the wave-two case. Shadow admission: the new agent runs the incumbent's brief, both face the same anchor, it is routable when it survives. **Mech:** the E.2 eval runner (with-skill against baseline) pointed at agents. **Cost:** reuse + 2–3 cases per agent. **Settles:** does the specialist beat the generalist on the same grant. **Row:** new |
| Planner-executor split | the decider cannot do | IN §3: no Write, Edit, Bash on the Operator | **KEEP** — the one that can build, will | — |
| Cheap-tier executor | the bottom of the ladder | RENAMED §9 (v20): Gemini's window, locals on electricity | **KEEP** — Haiku retires 2026-10-15 | — |
| Trust score | observed pass rate of anchored checks | IN §11.10, per agent per move class | **IMPROVE** | **Nothing consumes it.** Routing does not read it, the briefing does not, and §5.6's falsifiability claim names no join. Three named consumers: the launcher (revoke), the briefing (a per-agent column), §5.6's own claim. **Mech:** `scores.jsonl` joined by agent × move class; page 3's tap rule (v14) opens the runs. **Cost:** one join, one column. **Settles:** after 30 anchored runs, between-agent spread against within-agent spread. **Row:** new |
| Worker retirement | an agent leaving the company | IN §6 — it retires the **run**, not the agent | **RETHINK** | Skills expire (v19), claims carry a forced disposition (rule 9), charters carry `horizon` — agents alone are permanent, and they are the costliest of the four. Every agent file carries `valid_until`; at expiry exactly one disposition — Refresh, Merge, Retire — with the anchored evidence. **Mech:** `scripts/ledger.mjs`'s disposition machinery, already blocking on this branch. **Cost:** one field; a few founder answers a year. **Settles:** does any of the fifteen reach expiry with zero dispatches or a below-floor rate. **Row:** v19 extended to agents → new |
| Garbage-output handler | when output is junk | IN §11: the anchor catches it | **KEEP** — a run that stops on a defect succeeded | — |
| Output validation gate | the per-agent gate | IN §11: §5.2's anchor column | **KEEP** — an anchor per agent, never a score | — |
| Model-per-move policy | which model for which move | IN §9: the default plus named triggers | **IMPROVE** | `writer` declares a **split default** (opus for taste, sonnet for routine), putting a per-move routing decision inside a file while §G.1 exists to hold exactly those — and the file's copy is the one no table reviews. One model per file; the escalation becomes a §G.1 row with a trigger. **Mech:** §G.1; `bin/run` reads the trigger. **Cost:** none, it moves a decision. **Settles:** count files whose `model:` is not one id — target 0. **Row:** §G.1 / §B.2 row 10 |
| Model selector | how the model is chosen | RENAMED §9: a table of triggers | **KEEP** — a table, never a service | — |
| Worker heartbeat | is this run alive | IN §4: the Watch sees run state per tick | **IMPROVE** | Liveness and progress differ and only liveness is designed: a run looping on one file looks identical to a run working. Heartbeat is the last **progress** row — an anchored check attempted or a file written — and the supervisor kills on no-progress. **Mech:** `bin/supervise` (ABSENT) reads the log for the run id. **Cost:** one field on the row. **Settles:** the gap-between-progress distribution, measured before a ceiling is chosen. **Row:** new |
| Worker health check | a second opinion | RENAMED §4: the same tick | **KEEP** — two checks would disagree | — |
| Worker spawn limit | how deep and wide | IN §3: depth 3, 20 concurrent, no nested teams | **KEEP** — vendor caps, not our invention | — |
| Worker cost cap | ceiling on one worker's spend | IN §16: per-run ceiling; `--max-budget-usd` is a stall fuse (v23) | **IMPROVE** | The cap is **per run**. A standing intent (v55) dispatching nightly has no aggregate ceiling — ten cheap runs outspend the one expensive run the ceiling was written for. Add a per-agent, per-window ceiling on the Desk. **Mech:** `bin/check-stores` already refuses `every:` without a per-run ceiling; add the window aggregate. **Cost:** one field, one comparison. **Settles:** first week of standing intents, spend per agent per window. **Row:** v55 + v23 |
| Role definition | what each agent is for | IN §5: fourteen jobs, an anchor each | **KEEP** — a job plus what proves it | — |
| Skill-to-role mapping | which knowledge each role carries | IN §7: thirteen namespaces across §5.2 | **IMPROVE** | Nothing checks a declared namespace exists, or that each namespace has an owner — the drift class `check:manifest` already blocks for skills here. **Mech:** a lint over `roster.yml` × the skill directories, failing an orphan either way. **Cost:** one check in `npm run check`. **Settles:** run it once; count today's orphans. **Row:** §E.4 / v48 |
| Onboarding checklist per agent | what a new agent needs first | RENAMED §5: *"the agent file is the onboarding"* | **RETHINK** | The file onboards the **runtime**. A wave-two agent arrives with no rehearsal case, no exemplar, no negatives, no demonstrated anchor — a hire with a contract and no induction. Not routable until the pack exists: ≥1 rehearsal case with a known answer, ≥1 exemplar with provenance, its anchor fired once end to end, namespaces resolving. **Mech:** `bin/run` already refuses a brief naming a missing file (§5.0); extend to a file with no pack. **Cost:** three artifacts per agent, once. **Settles:** pack against no-pack on the same cases. **Row:** new |

---

## 14 · The company itself

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Founder role | what only the founder does | IN §2, a short complete list | **KEEP** — short, complete, enforced | — |
| Single-operator model | one contact point | IN §3 (founder) | **IMPROVE** | The Operator is the only object with no second reader, and §3.8 records two measured cases of a synthesis destroying a worker's correct measurement (*"29 of 30"* → *"29 of 29"*). Check the brief like an artifact: `bin/run` refuses a brief whose done-test is not byte-identical to the intent's. **Mech:** the v45 brief schema + one string compare. **Cost:** one compare. **Settles:** count briefs where the done-test drifted — predicted zero, never measured. **Row:** v45 |
| Multi-operator template | a second Operator | REFUSED §3 | **REFUSE-STANDS** — machinery for a role nobody holds | — |
| Real-work validation project | the first venture is real | IN §21 (v64: the harness) | **KEEP** — its anchors already exist | — |
| Synthetic first mission | a pretend first job | REFUSED §21 | **REFUSE-STANDS** — the prior system did this | — |
| Fake-company test case | a fixture world | REFUSED §21 | **REFUSE-STANDS** — a fixture is not evidence | — |
| Venture intake protocol | what it takes to start | IN §2 — COVERAGE says five fields, §2.1 says **six lines**, v63 requires a **seventh** | **IMPROVE** | Three counts of one object, and the enforcement contradicts a founder row: §2.1 *"a charter missing any of the six lines does not load"* against v63's *"refuses a charter without the entity field"*. A six-line charter with no entity both loads and is refused. One schema file, `keel/shared/schemas/charter.yml`, generating the prose — the cure v45 already chose for the brief. **Cost:** one file. **Settles:** grep for a charter field count; none should remain. **Row:** v63 + §2.1 → new |
| Bounded intake artifacts | intake stays small | IN §2 | **KEEP** — anything longer is unread | — |
| Cross-mission scheduling | ranking across ventures | IN §4: the Desk, bounded by WIP | **KEEP** — one ranker, one reserve line | — |
| Second human role | is anyone else here | IN §20 (v65: the founder only) | **KEEP** — the founder's, fixed, dated | — |
| Declared decision rights | who decides what | IN §12: envelope plus §C.1's bands | **KEEP** — enforced by argv, not by a table | — |
| Wind-down protocol | how a venture ends | IN §2: parked, then harvested for parts | **IMPROVE** | Parking is designed as a tempo change; an ending venture holds obligations owed to people and assets in the founder's name, and nothing checks either at the moment it stops. Wind-down is a program-run checklist: every obligation discharged, transferred or abandoned **with a record**; every asset named with its holder; archive, never delete. **Mech:** `bin/check-stores` refuses `tempo: parked` with an undischarged obligation; the checklist is the Sender's step-list class (v18). **Cost:** one refusal, one file. **Settles:** the first parked venture. **Row:** new |
| Archive-not-delete policy | nothing deleted for a cap | IN §13 | **KEEP** — a lifetime cap loses decisions | — |
| Venture-owned domain | a venture's address | IN §2; DNS read on the wish list | **KEEP** — read before write, as everywhere | — |
| Venture-owned phone number | a real-world asset | FOUNDER'S §2 | **KEEP** — recorded, never held | — |
| Venture-owned bank account | where money really is | FOUNDER'S §2 | **KEEP** — reconcile to it, never hold its key | — |
| Legal entity structure | who signs | FOUNDER'S §2 (v63) | **KEEP** — a one-way door, the founder's | — |
| IP ownership policy | who owns the output, and its inputs | FOUNDER'S §2: *"may draft and may not sign"* | **ADD** | Output ownership is placed; **input provenance is not**, and three unread or restricted licences can already reach an outward artifact: `LICENSE-CONTENT` unfetched (v17), `anthropics/skills` with no root LICENSE and *"source-available, not open source"* documents (§E.2), Higgsfield's asset terms UNVERIFIED here. Every adopted artifact carries a licence read **from the file**, as the §F door does for tools and v62 did for the room; the Sender refuses an outward artifact with an unread or non-commercial source. **Mech:** `licence_read_from` on the door's yml; `bin/send`'s checklist. **Cost:** one field, one checklist line. **Settles:** audit the adopted set — how many licences were read from a file, not a badge. **Row:** v17 / v53 → new |
| Multi-venture portfolio view | all ventures at once | IN §14: page 1 | **KEEP** — L6 owns the surface | — |
| Venture health score | is this venture well | RENAMED §14: tempo, spend, whether intents advance | **KEEP** — a composite hides which broke | — |

---

## 20 · Team culture & onboarding

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| New-hire onboarding doc | a human joining | FOUNDER'S §2 | **REFUSE-STANDS** — no human is joining (v65) | — |
| Agent onboarding doc | what a new agent needs | IN §5: *"the agent file is that document"* | **RETHINK** | Same finding as §02's *Onboarding checklist per agent*, and this lane's first proposal: the file onboards the runtime, the pack onboards the agent. Not restated. **Row:** new (P1) |
| Decision-rights matrix | who decides what | RENAMED §12 | **KEEP** — enforced by argv, not by a matrix | — |
| Meeting cadence policy | when the company talks to itself | RENAMED §14: briefing and nightly curator | **KEEP** — neither costs a meeting | — |
| Documentation standard | the fixed shape of what is written | IN §6: brief and handover fields | **KEEP** — eleven fields, refused if short | — |
| Knowledge-transfer protocol | moving what one venture learned | IN §13: promotion with provenance | **IMPROVE** | Promotion is asserted with no admission test and no named promoter. The company-shaped half only, since L4 owns the design: the **curator is the only writer either way** (v25), and a fact promotes when it holds in a **second** venture — the with-baseline shape of E.2. **Mech:** `bin/skill-eval`'s shape; the curator's grant. **Cost:** reuse. **Settles:** unreachable until two ventures exist — blocked, not designed. **Row:** v25 / §E.2, defer to L4 |
| Conflict resolution process | two agents disagreeing | IN §11: a disagreement is kept and marked | **IMPROVE** | Exactly one pair has a designed path — builder → architect files an objection (v7). Fourteen agents make ninety-one pairs. One objection shape for all: the artifact, the rule broken, the mechanism that would settle it, returned on the handover and routed by the Operator, never resolved by its preference. **Mech:** `objection:` beside `uncertain:` on the handover schema; `bin/run` records it as a **success**, the cord on itself. **Cost:** one field. **Settles:** objections that reached the founder against those absorbed silently — the second is currently unmeasurable. **Row:** v7 generalised → new |
| Team retro cadence | learning from the week | RENAMED §13: the nightly curator | **KEEP** — costs the founder no time | — |

---

## 23 · Departments — design & product

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| UI design agent | who makes the interface | IN §5: `designer` | **KEEP** — render, look, iterate, anchored | — |
| UX research agent | where real user knowledge comes from | IN §5: `scout` answers bounded questions; the founder talks | **IMPROVE** | Refusing simulated users is right and leaves a hole: **no path exists for a real reaction to reach a design artifact.** It exists elsewhere — the world's door writes one inbound row per event (v36). Name inbound rows as the rung-1 anchor for reception, read by `analyst`; the screenshot anchor covers rendering only. **Mech:** `bin/inbound` + the anchor ladder. **Cost:** a placement, not a build. **Settles:** the first inbound reaction row on a design intent. **Row:** v36 placement |
| Branding agent | who owns the brand | IN §5: `designer` | **KEEP** — one owner, one taste store | — |
| Logo/visual identity agent | marks and identity | IN §5: many made, founder picks | **KEEP** — the founder's pick is the anchor | — |
| Design system maintenance | keeping it coherent | IN §5: `designer`; token bridge on the wish list | **IMPROVE** | A design system is a **contract**, and v7 already decided a contract is a separate artifact with its own done-test that a builder may not edit; tokens are being treated as ordinary source. The token file becomes architect-class — designer proposes, it carries a computable done-test (contrast, a spacing scale), a builder needing a token **files an objection**. **Mech:** v7's `--add-dir` exclusion on the token path. **Cost:** one path in two argv files. **Settles:** count ad-hoc colour and spacing literals in a month of diffs. **Row:** v7 extended to design |
| Prototype generation | something to look at first | IN §5 | **KEEP** — judged against a named target | — |
| User testing simulation | a model pretending to be a user | REFUSED §11 | **REFUSE-STANDS** — grading its own homework | — |
| Accessibility review | can everyone use it | IN §5: *"computable rather than judged"* | **IMPROVE** | The claim is right and **no program is named**, so the anchor is the designer's own eye — forbidden for every other design output. A deterministic accessibility check through the `playwright` grant the designer already holds is rung 1; its judgement is rung 2. **Mech:** one READ-ONLY door row; the check exits non-zero. **Cost:** one dependency, one door pass. **Settles:** it fails a known-bad page or it does not. **Row:** §B.2 designer anchor |
| Product spec writing | fuzzy into falsifiable | IN §5: `product`, wave two (v54) | **KEEP** — the founder writes it meanwhile | — |
| Roadmap prioritization | what comes next | IN §5: drafts; weight stays the founder's | **KEEP** — priority is a charter field | — |
| Feature flag rollout | releasing safely | RENAMED §12 | **KEEP** — a flag makes a one-way door two-way | — |
| User feedback triage | sorting what people say | IN §5: `product`, through the world's door | **KEEP** — arrives as data, not instruction | — |

---

## 24 · Departments — engineering

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Code writing agent | who writes code | IN §5: `builder` | **KEEP** — continuous context, never split | — |
| Code review agent | who judges it | IN §5: `reviewer`, no Write, Edit, Bash | **KEEP** — it cannot edit what it judges | — |
| Database schema agent | who owns stored shape | IN §5: `architect` | **KEEP** — apply and roll back is the anchor | — |
| API design agent | who owns the interface | IN §5: `architect` (v7) | **KEEP** — the contract is its own artifact | — |
| Test writing agent | who writes the judging test | IN §5: `tester`, blind by `--add-dir` (v8) | **KEEP** — blindness is a grant, not a promise | — |
| Bug triage agent | how a defect enters the company | RENAMED §5: *"reviewer or builder by intent"* | **IMPROVE** | The routing is a shrug and there is **no intake** — nothing says where a bug becomes work. A bug is an inbound row or a failed anchor, and it becomes a card whose done-test is the **reproducing command**; with no reproduction it is a bounded question for `scout`, not a ticket. **Mech:** the card store's writer (v52) gains one program-written kind — `bin/run` writes a card when an anchor fails twice. **Cost:** one writer path. **Settles:** proportion of bug cards carrying a command that reproduces. **Row:** v52 extended |
| Refactor agent | shape without behaviour | RENAMED §5: `builder`, reversible | **KEEP** — the freest work on the roster | — |
| Documentation agent | who writes the docs | **REFUSED** §5 | **REFUSE-STANDS** — split docs drift on first move | — |
| Infra provisioning agent | who makes environments | RENAMED §12: preview only | **KEEP** — production is a one-way door | — |
| Performance profiling agent | who finds the slow part | RENAMED §5: `analyst` or `builder` | **KEEP** — the profile is the number | — |

---

## 25 · Departments — data & analytics

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Data pipeline agent | moving data | IN §5: `analyst` | **KEEP** — one owner, external anchors | — |
| Analytics tracking setup | instrumenting a venture | IN §5; read-only instruments first | **KEEP** — the reconciliation needs them | — |
| Dashboard generation agent | a venture's numbers | IN §14: `analyst`; page 3 is the harness's | **KEEP** — every number names its tap | — |
| KPI definition agent | what counts as good | IN §5: `analyst` | **KEEP** — the done-test stays per intent | — |
| Cohort analysis agent | groups over time | IN §5 | **KEEP** — a slow anchor, started early | — |
| A/B test analysis | did the change work | IN §5: *"the stopping criterion is fixed before the test starts"* | **IMPROVE** | A rule with **no mechanism**, and the agent that would break it is the one reading the result. The stopping rule becomes a field on the intent, like the done-test; the store check refuses an A/B intent without one and a change to it is a new intent. **Mech:** `bin/check-stores` + the intent schema. **Cost:** one field. **Settles:** count tests whose rule changed after the first data. **Row:** v45 / store-check |
| Data cleaning agent | making numbers trustworthy | IN §5 | **KEEP** — every number reconciles to raw | — |
| Data labeling agent | teaching taste by hand | **REFUSED** §13 | **REFUSE-STANDS** — the founder's discards are the labels | — |
| Anomaly detection agent | noticing something is wrong | IN §5: nightly reconciliation, a standing intent (v55) | **KEEP** — reads a record we do not write | — |

---

## 26 · Departments — marketing & content

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Content calendar agent | what goes out when | IN §5: `writer`; the Sender holds the hours | **KEEP** — staged by one, timed by another | — |
| Blog writing agent | long-form | IN §5 | **KEEP** — writes many, sends none | — |
| Video generation agent | moving pictures | IN §5: `writer` holds Higgsfield, *"rate-capped, spends credits"* | **IMPROVE** | **§F refuses RunPod for *"spending money at a rate under an uncapped key"* and admits Higgsfield, which spends credits, on a rate cap no named program enforces.** One rule, two answers. A credit-spending server is admitted only behind an absolute per-window ceiling held **in a program**, or it moves to REACHES-THE-WORLD and the Sender performs it. **Mech:** `spend_ceiling` on the door's tool yml; `bin/run` refuses the grant past it. **Cost:** one field, one check. **Settles:** does Higgsfield expose a credit-balance read — one fetch; without one, no program can cap it. **Row:** §F consistency → new |
| Asset generation agent | images and sets | IN §5: set consistency is the anchor | **KEEP** — the founder picks from many | — |
| SEO optimization agent | being found | IN §5: schema and canonical rung 1 | **KEEP** — ranking is a months-long anchor | — |
| Ad copy agent | paid words | IN §5: ads read before ads write | **KEEP** — read access first, always | — |
| Social media agent | short public words | IN §5: drafts and stages | **KEEP** — nothing posts alone | — |
| Email campaign agent | mail to many | IN §5: `writer` drafts, the Sender performs | **KEEP** — the drafter never holds the key | — |
| Brand voice enforcement | sounding like the company | IN §5: anchored on *"the founder's taste store"* | **IMPROVE** | **The taste store does not exist until the mining pass has run**, so the anchor names an empty file. Brand-voice work is unroutable while the store is empty; until it fills, the anchor is the founder's pick between two staged drafts — the *which* the system already has, and a real rung-2 signal. **Mech:** the P1 routing refusal, reading the store's count. **Cost:** none beyond P1. **Settles:** count exemplars; the mining pass moves it. **Row:** P1 / v26 |
| Influencer outreach agent | approaching strangers | **REFUSED** §12 | **REFUSE-STANDS** — first contact is on the `never` list | — |

---

## 27 · Departments — sales & growth

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Lead scraping agent | collecting people who did not ask | IN §5: `growth` scrapes on a standing intent's cadence (v55) | **RETHINK** | The only item in these sections both unprecedented in every fetched roster (roster.md: *"NONE of the rosters I fetched names a sales, lead-scraping, lead-scoring, CRM or churn agent"*) **and** legally exposed — and §5.5 refuses only churn prediction beside it. Bulk collection of personal data is a privacy act, not a research act. Leads are inbound-first by default; any bulk scrape passes the §F door with `guard` and a data-classification row **before** it runs. **Mech:** the tool door; §16's classification tags (L3's lane). **Cost:** one door pass per source. **Settles:** read the first source's terms — a bounded read that decides the class. **Row:** §F / §B.4 refusals extended |
| Lead scoring agent | ranking them | IN §5: `growth` | **KEEP** — the reply is the anchor, not the score | — |
| Cold outreach agent | writing to them | RENAMED §12: drafts, never sends | **KEEP** — the Sender is the only sender | — |
| CRM update agent | keeping the record | IN §5: read-only CRM | **KEEP** — the outside record owns the truth | — |
| Client contact agent | talking to a customer | RENAMED §12: staged with the recipient filled in | **KEEP** — the tap is the founder's | — |
| Follow-up sequencing | when to write again | IN §5; the Sender holds local hours | **KEEP** — timing lives in the program | — |
| Deal-stage tracking | where a deal is | IN §5: the processor generates the rung | **KEEP** — never a status report | — |
| Churn prediction agent | who will leave | **REFUSED** §5 | **REFUSE-STANDS** — no venture has the data | — |
| Referral tracking agent | who brought whom | IN §5 | **KEEP** — *they paid again and named you* | — |

---

## 28 · Departments — customer service

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Support ticket triage | a person needs something | IN §5: a standing intent's `on:` — door → `scout` → `steward` (v36, v55) | **KEEP** — no pen touches a stranger's text | — |
| Chatbot response agent | answering automatically | **REFUSED** §12 | **REFUSE-STANDS** — a person is on the other side | — |
| Escalation-to-human rule | when the founder must see it | IN §14: the wake-me list against the interruption budget | **IMPROVE** | The budget is **founder-shaped**; a waiting customer has a clock it does not know about, and a channel demoted for a low acted-on rate can demote a promise made to a person. A support obligation whose promised response time falls inside the next window promotes past the budget, and demotion does not apply to obligations — the Watch already ranks obligations before goals. **Mech:** the Desk's ranking; the due field `obligations.yml` carries. **Cost:** one rule. **Settles:** the first response-time obligation that goes past due while the budget was spent elsewhere. **Row:** v55 / §4 |
| Customer sentiment tracking | how people feel | IN §5: `scout` reads and cannot act | **KEEP** — structurally unable to reply | — |
| FAQ auto-update | answering once, not often | IN §5: `writer` drafts | **KEEP** — the ticket rate is the anchor | — |
| Refund/policy enforcement | money going back | **REFUSED** §12 | **REFUSE-STANDS** — money to a person is one-way | — |
| Customer satisfaction survey | asking | IN §5: `analyst` reads it | **KEEP** — a stranger's reaction is rung 1 | — |

---

## 29 · Departments — finance & legal

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Invoice generation agent | billing | IN §5: `steward` | **KEEP** — it ties to the bank line or shows the gap | — |
| Expense tracking agent | what we spent | IN §5: the vendor's billing endpoint | **KEEP** — an outside record, not our log | — |
| Budget-vs-actual agent | were we right | IN §5: `steward` states, `analyst` reconciles | **KEEP** — two agents, one number | — |
| Contract drafting agent | writing something binding | **REFUSED** §12 | **REFUSE-STANDS** — one-way, both options prepared | — |
| Contract review agent | reading someone else's | IN §5: `scout` reads, `steward` writes (v36) | **KEEP** — a rubric here manufactures a number | — |
| Compliance check agent | are we allowed | IN §5: deterministic rows | **KEEP** — wired before there is a product | — |
| Tax-prep support agent | filings | **REFUSED** §12 | **REFUSE-STANDS** — one-way, reaches the founder | — |
| Cap-table tracking | who owns the company | **REFUSED** §12 | **REFUSE-STANDS** — an edit here cannot be undone | — |
| Legal risk flagging | this could hurt us | IN §5: *"`steward` flags and stops"* — and **no fetched roster ships a legal agent at all** | **IMPROVE** | The least-evidenced work in the company runs on one model family with a **prose anchor**: *flags and stops* names no artifact a program can check. A legal flag is a *which* carrying the **clause quoted verbatim** with its source and location, never a summary; its anchor is that the quote resolves in the source — `scout`'s own rule. **Mech:** the handover evidence field plus a `check-citations`-shaped quote check (846 lines of that checker exist here). **Cost:** reuse. **Settles:** proportion of flags whose quote resolves. **Row:** §B.2 `steward` anchor |

---

## 30 · Departments — operations & HR

| Keyword | Reading | v2 | Verdict | Proposal · mech · cost · settles · row |
|---|---|---|---|---|
| Vendor management agent | who we depend on | IN §5: *"every adopted part gets an exit note on arrival"* | **KEEP** — the exit written at entry | — |
| Hiring-pipeline agent | hiring humans | **REFUSED** §5 | **REFUSE-STANDS** — there are no employees | — |
| Onboarding-doc agent | inducting a venture | RENAMED §5: the Charter is the induction | **KEEP** — six lines, refused if short | — |
| Meeting-notes agent | what was said | IN §5: door and `scout` read, `steward` writes (v36) | **KEEP** — never a mailbox it opens | — |
| Calendar-scheduling agent | when things happen | RENAMED §12 | **KEEP** — an invite to a person is the Sender's | — |
| Process-documentation agent | how we do things | IN §5: `steward` | **KEEP** — a description, never a playbook | — |
| Internal-tool provisioning | new tools for ourselves | RENAMED §8: through the door | **KEEP** — nothing enters without replacing something | — |

---

## Tally — 131 keywords

| KEEP | IMPROVE | RETHINK | ADD | REFUSE-STANDS |
|---|---|---|---|---|
| 83 | 25 | 4 | 2 | 17 |

**(NEW: what the shape says)** The departments (§23–§30, 73 keywords) are **placements**, decided twice already in
§B.4 and §5.5, and a placement is right or wrong rather than improvable. The improvable mass is in §02 and §14 —
eleven of thirty and three of twenty — where the object is the roster and the company rather than a routing answer.
Every proposal below sits there.

---

## Top 5 proposals of this lane

**1 · An agent is not routable until its onboarding pack exists.** §5 calls the agent file *"the onboarding"*; it
onboards the runtime, not the agent. **What changes:** an agent becomes routable only when it carries at least one
rehearsal case with a known answer, one exemplar of its own good output with provenance, one end-to-end demonstration
that its anchor actually fires, and namespaces that resolve. **Why it is better:** the pack is what distinguishes
`writer` from `builder-with-a-different-prompt`, and without it the roster's benefit is a belief. It also turns wave
two (v54) from a date into a bar — the business agents arrive when a venture needs them **and** when they can show they
work, which strengthens the founder's rule without contradicting it. **Mechanism:** `bin/run` already refuses a brief
naming an agent whose file does not exist (§5.0); the refusal extends to a file with no pack. **Cost:** three artifacts
per agent, once. **How we would know:** pack against no-pack on the same known-answer cases with the E.2 runner. If the
packed agent does not win, the pack is ceremony and the proposal is refuted by its own test.

**2 · The roster becomes one machine-readable file, and every table is generated from it.** **What changes:**
`keel/shared/roster.yml` holds the fifteen rows — name, wave, model, tools, MCPs, namespaces, `maxTurns`, `isolation`,
anchor, colour, `valid_until` — and the frontmatter, the argv files, §17.1 and page 2 are generated or checked against
it. **Why it is better, measured rather than argued:** the same fact is written three times and two copies already
disagree — SPINE §B.2 says *"eight of the fourteen carry no shell"*, §5.2 says *"Ten"*, and counting the `tools`
column gives ten. That is the frozen-arithmetic failure this repository names in four other places, committed inside
the roster's own definition before a single agent file exists. Fifteen agents × eleven fields is 165 facts and prose
cannot hold them. **Mechanism:** the §19.2 census already fails a second home for one artifact (v42); one generator,
one check. **Cost:** one file, one script. **How we would know:** change one model id and count the files that
disagree — target zero, today at least two.

**3 · Agents expire, with a forced disposition, exactly as skills and claims do.** **What changes:** each agent file
carries `valid_until`; at expiry exactly one disposition is recorded — Refresh, Merge, or Retire — with the anchored
evidence attached. **Why it is better:** v31 puts the roster in a band nobody has evidence for and §5.6 calls the claim
falsifiable because *"the Desk measures cost per agent"* — but nothing schedules the moment anyone looks. Skills expire
because *"nothing in the world retires a skill by non-use"* (v19); the identical argument applies with more force to an
agent, which is costlier and harder to notice. **Mechanism:** `scripts/ledger.mjs`'s disposition machinery, already
built and blocking on this branch. **Cost:** one frontmatter field; a small number of founder answers a year. **How we
would know:** the first expiry producing a Merge or a Retire proves fourteen was a starting point; a cycle where every
agent Refreshes on real evidence is the strongest defence of v1 available.

**4 · The trust score gets three named consumers.** **What changes:** §11.10's per-agent, per-move-class pass rate is
read by the launcher (below floor, the class is unroutable and goes to the Floor), by the briefing (a per-agent
column), and by §5.6's falsifiability claim. **Why it is better:** the score exists and nothing reads it — the defect
class this repository records as *"a rule enforced only by this sentence"*. Consumers are also what make proposals 1
and 3 decidable, since the pack's value and an expiry disposition are read off the same number. **Mechanism:**
`scores.jsonl` joined by agent and move class; page 3's tap rule (v14) opens the runs behind each cell. **Cost:** one
join, one column, one lookup. **How we would know:** after thirty anchored runs, compare between-agent spread with
within-agent spread. If within-agent dominates, the score measures the task and not the agent, and the routing consumer
must be withdrawn — a real falsifier, not a formality.

**5 · One charter schema file, because the plan already counts its own charter three ways.** **What changes:**
`keel/shared/schemas/charter.yml` becomes the single definition and §2.1's prose and COVERAGE's row are generated from
it. **Why it is better:** §2.1 says six lines and enforces *"a charter missing any of the six lines does not load"*;
COVERAGE §14 says five fields, twice; v63 requires a seventh, entity and jurisdiction, refused by `bin/check-stores` if
missing. A six-line charter with no entity both loads and is refused today, and the founder's row is the one that
loses. v45 already resolved the identical collision for the brief by generating prose from a schema, so the cure is
precedent. **Cost:** one file; the prose stops carrying an integer. **How we would know:** grep the plan for a charter
field count — afterwards there is none left to be wrong. The same schema is what lets the wind-down checklist refuse a
`parked` venture holding undischarged obligations.

---

## Top 3 research questions

**1 · Does an onboarding pack change an agent's anchored pass rate?** Take two wave-one agents, write the pack for one,
run both against the same three known-answer cases, compare anchored pass rate and turns used. **Source class:** our
own eval runner — the shipped `skill-creator` with-skill-against-baseline loop of §E.2, run locally on the cheapest
window. No vendor, no fetch, answerable before any agent file is final. It decides proposal 1 and whether wave two
should be gated on evidence at all.

**2 · Has anyone published a roster-size ablation between six and one hundred and fifty?** roster.md establishes the
band is unoccupied and names the unread sources: Google ADK, LangGraph's multi-agent templates, Sakana's AI Scientist,
Cognition's and Factory's own rosters, plus TheAgentCompany's leaderboard, which that lane could not obtain. **Source
class:** primary repositories and papers plus that leaderboard. One question — does any of them vary the number of
roles and report an outcome. A single ablation moves v31 from *unoccupied* to *occupied* in either direction, and it is
the only fact that could responsibly change the founder's fourteen.

**3 · Does any credit-spending server expose a spend or balance read?** Higgsfield is the live case (`writer`'s MCP,
*"spends credits"*), RunPod the refused one, refused for spending under an uncapped key. **Source class:** vendor API
documentation, one fetch each. It decides a rule, not a preference: with a balance read a program can hold an absolute
ceiling and the server stays in the WRITES class; without one, nothing can cap it and it belongs in REACHES-THE-WORLD,
where the Sender performs it. §F answers the same question two ways today, which is how a class boundary rots.

---

## What the best system in the world would have here that v2 lacks

**(NEW: reasoning)** It would treat the roster as **data with a lifecycle** — declared, onboarded, measured, expired,
merged or retired — and v2 has only the first stage. Every other durable object already has the whole of it: skills
admitted by eval and retired by expiry (v3, v19), claims with a forced disposition (rule 9), charters with a
`horizon`, memory items refused without a falsifier. Agents alone are declared and then permanent, and they are the
most expensive object of the five.

**(NEW: reasoning)** It would carry a **per-agent unit economic that is not cost**: cost *per anchored pass*, by agent,
by move class. Page 3 shows spend per run, per agent, per venture and per window (v14) — all inputs, no denominator.
*"Is fourteen too many"* is unanswerable from spend and trivially answerable from cost per anchored pass, because an
agent costing twice as much per success as the agent that would otherwise take the work is one visible row.
**(FACT: SPINE §G.3, models.md 2026-09-05)** The denominator must survive a tokenizer discontinuity — Opus 5 and Fable
5.x produce *"approximately 30% more tokens for the same text"* than Sonnet 4.6 and earlier — so per-agent economics
inherited from an older measurement understate the two Fable seats by about that much.

**(NEW: reasoning)** It would have a **department load number**, and that is where my field breaks first at scale.
**At ten ventures** the roster saturates unevenly: `steward` and `curator` are singletons doing per-venture work whose
subtasks are independent, so they queue while `builder` idles — and v6's *never parallelise* rule, written about one
artifact, will be read as forbidding the fan-out that fixes it. The smallest change is §02's *Parallelism limit* row.
**(FACT: SPINE v13, vendor constraints)** **At fifty concurrent sessions** the visible fleet stops being visible before
the runtime stops working — one team per session, no nesting, one level of teammates on page 2, subagents capped at
twenty and depth three. Page 2 cannot draw fifty, and the identity problem arrives at six, which is why the colour
field is an ADD rather than a nicety. **(NEW: reasoning)** **With a second human**, `wake-me` has no recipient field
because v65 fixed the company at one person; the smallest future-proofing is that a `wake-me` line names *who* — not
that a second Operator is designed, which stays refused. **(NEW: reasoning)** **After a year of logs**, agent expiry,
trust and per-agent economics all need a year of anchored outcomes, so a retirement decision must read an aggregate
rather than the raw log — which means the curator writes that aggregate nightly, when the evidence exists, or it is
not reconstructable when the question is finally asked.

**(NEW: reasoning)** It would have **one conflict shape for all pairs**. Fourteen agents make ninety-one pairs and v7
designs one of them. An objection as a first-class handover kind — artifact, rule broken, mechanism that would settle
it — costs one schema field and is the difference between surfacing disagreement and resolving it by whoever wrote
last. **(NEW: reasoning)** And it would treat **the Operator's brief as reviewed work**: the one artifact produced by
an agent, consumed by an agent and read by no reviewer, with two measured cases in §3.8 of a synthesis destroying a
worker's correct measurement. The cure is not care. It is a string comparison in the launcher.

---

## What I would delete

**`analyst`'s `Bash`.** The only read-class agent holding a shell, contradicting its own band — §C.1 places `analyst`
in *read and report*, `plan` mode, Codex `never × read-only`. The justification, *"the shell is for deterministic
queries, not for writing"*, was overtaken by v47, which gives every comparison to `bin/reconcile` and leaves `analyst`
reading the mismatches. **What would change my mind:** one named analyst move needing a shell that is not arithmetic
`bin/reconcile` already owns.

**`writer`'s split model default.** One file declaring two models puts a per-move routing decision inside the one copy
no table reviews. Delete the split; keep the escalation as a §G.1 row with a named trigger.

**Two of the three department tables.** SPINE §B.4, §5.5 and COVERAGE §23–§30 render the same eight rows three times
and have already drifted: §5.5's customer-service row carries the v36 door-and-scout path that §B.4's does not. One
source, two generated views — the same delete as proposal 2, landing with it.

**The phrase *"the agent file is the onboarding"*.** True about the runtime, false about the company, and currently the
plan's whole answer to two founder keywords. Replace it with the pack, or the question has been answered by renaming
it.

---

## Claims this lane emits

| Claim | Kind | Verified by | Expiry |
|---|---|---|---|
| `c-roster-shell-count-drifted` — SPINE §B.2 and §5.2 give different counts of the agents with no shell; the `tools` column gives ten | project | command — a check over `roster.yml`; today, a read of both files | at the change landing `roster.yml` |
| `c-charter-field-count-three-ways` — §2.1 enforces six lines, COVERAGE §14 says five, v63 requires a seventh | project | command — `bin/check-stores` against `charter.yml` | at the charter schema |
| `c-agents-have-no-expiry` — every other durable object carries a forced disposition at expiry; the fifteen agent files do not | project | command — a lint for `valid_until` in agent frontmatter | 2026-12-06, or the change that adds it |
| `c-trust-score-has-no-consumer` — §11.10 computes a trust score and no section reads it | project | command — grep the plan for a reader of `scores.jsonl` | at the launcher change |
| `c-analyst-band-contradiction` — `analyst` holds `Bash` while §C.1 places it in the read-and-report band | project | command — a lint comparing the band table with the `tools` column | at the roster file |
