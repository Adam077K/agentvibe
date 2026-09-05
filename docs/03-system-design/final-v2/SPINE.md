# SPINE · the decision spine of final plan v2 · 2026-09-05

```
what:       the row set every v2 section-writer writes from, so that twenty sections cannot disagree
binds:      the founder's direction of 2026-09-05 (docs/08-agents_work/handoffs/2026-09-05-THE-PLAN-NEXT-TEAM-PROMPT.md,
            branch ceo-3-1788468144) — where it contradicts FINAL-PLAN.md, the founder wins, the cost is stated once
            in one line, and the chosen thing is then built properly. Never re-litigated
base:       final/FINAL-PLAN.md (branch ceo-3-1788468144) stands wherever the founder did not overrule it and no
            research fact overturns it
inputs:     final-v2/DECISIONS.md · final-v2/research/{roster,surfaces,runtimes,skills,cognition,memory,models}.md
            (this branch, ceo-1-1788609834)
rule:       every row carries FOUNDER · FINAL · NEW: why. Every rule names the mechanism that enforces it or is
            marked WISH. Every path exists on a named branch or is marked ABSENT. No stage states method. No
            schedule, no durations. Anything not in the inputs is marked UNVERIFIED
not:        a build plan. Nothing here is built, installed, spent, published or pushed
```

---

## A · §1-v2 — the decisions table

Forty-one rows. Rows **v1–v5** are the founder's overrules of FINAL §1. Rows **v6–v41** are places a research
fact moves a FINAL row, or a place FINAL stands *because* a fact was checked against it. The losing image is kept by
name in every row and collected again in §J.

| # | The question | Decided | From | The losing image, kept as |
|---|---|---|---|---|
| **v1** | How many kinds of worker | **Fourteen named agents plus the Operator** — a company, each with its own expertise, knowledge, tools and way of working | **FOUNDER** (overrules FINAL row 6): *"I want us to recreate the whole startup company … between ten and fifteen agents"* | three shapes — maker · scout · checker — with loadouts assembled per run, and no file per role |
| **v2** | Names | **Real names, one file per agent**, each carrying its own model, tools, MCPs, skills and anchor | **FOUNDER** (overrules FINAL row 8), and roster.md fact 1 — MetaGPT, ChatDev, Magentic-One, CrewAI, the OpenAI SDK, wshobson and VoltAgent all ship named persistent roles; **zero of seven** ship unnamed-shape-plus-loadout | labels, not names; a run labelled only by what it makes and which window it burns |
| **v3** | The skill library | **A library in the open SKILL.md standard**, admitted by eval, retired by expiry, plus a **skill creator** | **FOUNDER** (overrules FINAL row 10): *"take all the skills that the biggest systems use … we need a skill creator of skill"*; skills.md 1, 7, 12, 16 | `keel/holding/skills/` — 134 skills moved whole into a directory read by nothing |
| **v4** | The surfaces | **Mission control is a first-class website with seven pages, and every page is a control.** The Balcony's five views are not deleted; they become pages of it. The Floor stays a terminal on the Mac and is what every tap opens | **FOUNDER** (overrules FINAL row 15): *"the mission control surface. I want to add it, bring it back"*, and *"when I click on it, the terminal which runs the agent on my Mac is popping up"* | five Balcony views over one state; the room as a display that is never a control; *"no project is both"* |
| **v5** | Which provider stands which position | **Codex and Claude Code are both in the system from day one**, in one shape decided in §H | **FOUNDER** (overrules FINAL row 30): *"I run from day one of the system to include codex and Claude code"* | Codex admitted only after a headless rehearsal passes; Gemini proving the second-family route first |
| **v6** | Whether the named roster parallelises one artifact | **No.** One artifact, one agent, continuous context. The roster names *who* does a kind of work; it never splits one build across two builders | FINAL §7.1, **reinforced** by roster.md 4 (Anthropic: coding is *"not a good fit for multi-agent systems today"*), 6 and 7 (Cognition: *"Actions carry implicit decisions, and conflicting decisions carry bad results"*) | a pod of builders on one feature; MetaGPT's waterfall of four roles over one repo |
| **v7** | The seam between `architect` and `builder` | **The architect's output is a separate artifact with its own done-test, handed over whole.** A builder that needs to change a schema or an interface **files an objection; it does not edit it** | **NEW:** roster.md 6 names the exact failure — two agents acting on assumptions *"not prescribed upfront"*. Making the contract an artifact with a done-test is what prescribes them. **Mechanism:** the builder's grant excludes the architect's output path (argv `--add-dir`); the objection is the cord on itself (FINAL §7.3) | one agent that designs and implements; two agents that share one artifact |
| **v8** | Who writes the test that judges a build | **Both, and they are different tests.** The builder tests its own work before handing over (self-check). The **tester writes the anchor test blind** — it reads the done-test and the interface, never the implementation | **NEW:** cognition.md 8 (Devin: *"Tell Devin to test its own work before opening a PR"*) is the self-check; a test written by the author of the code is a machine grading its own homework, which FINAL §0 refuses. **Mechanism:** the tester's `--add-dir` excludes the implementation path | one testing agent that reads the diff; the builder's own tests as the only anchor |
| **v9** | What "fully autonomous" costs | **A fully autonomous run cannot ask.** `dontAsk` mode denies `AskUserQuestion` even when allowed. So everything the run would have asked must be pre-decided in the envelope or **staged as a which** | **NEW:** cognition.md 2 — *"`AskUserQuestion` … are denied even if you've allowed them"*. This makes FINAL's staged-not-sent rule load-bearing rather than stylistic: it is the only channel a silent run has | a fully autonomous run that pauses for a question nobody will answer |
| **v10** | The widest permission mode | **`bypassPermissions` is refused, by a mechanism** — `permissions.disableBypassPermissionsMode: "disable"` in managed settings, where a running process cannot clear it | **NEW:** cognition.md — deny rules bind in every mode including bypass; allow rules have no effect in it | `--dangerously-skip-permissions` and its successors as a night default |
| **v11** | The managed settings file, now that `/goal` exists | **The managed file carries `permissions.deny`, `disableBypassPermissionsMode` and `disableAutoMode`, and does NOT set `disableAllHooks` or `allowManagedHooksOnly`** | **NEW:** runtimes.md — *"`/goal` is a wrapper around a session-scoped prompt-based Stop hook"*, and it is unavailable under either of those two settings. **The cost, once:** a run can therefore register its own Stop hook. That is a smaller hole than losing the goal loop the founder asked for, and the probe checks it nightly | a managed file that locks hooks; FINAL §7.5's premise that the managed file is where every narrowing goes |
| **v12** | Where loops and goals sit | **`/goal` sits on the run: the done-test IS the goal condition**, with a turn clause. **`/loop` is refused in production** and stays a Floor convenience | **NEW:** runtimes.md — `/goal` runs headless in one invocation (`claude -p "/goal …"`), condition limit 4,000 chars, bounded by *"or stop after 20 turns"*. `/loop` is *"session-scoped"*, has a 7-day expiry, and *"Tasks only fire while Claude Code is running and idle"* — the Watch is the loop | `/loop` as the Watch; a cron inside a session as the always-on tier |
| **v13** | How the Operator dispatches | **Three mechanisms, each for what it is documented to do:** agent teams for the *visible* fleet the founder watches; subagents for depth inside one agent; `claude -p` children through the launcher for unattended night work | **NEW:** surfaces.md (teams are a lead plus named teammates, each a full session, with tmux pane ids on disk) and runtimes.md (subagents: depth 3, 20 concurrent, `Workflow` removed from all of them; `-p` never forms a team). **The constraint, stated once:** teams are experimental and off by default, **no nested teams**, one team per session, `/resume` does not restore them — so the child-flow page shows one level of teammates and the deeper tree is subagents | a single dispatch mechanism; a hierarchy of teams of teams |
| **v14** | The cost dashboard against *"nothing is only informational"* | **The dashboard is admitted, and every number on it names the tap that acts on it** — a cost row taps to its run, a window row taps to retempo, an anomaly taps to the cord | **FOUNDER** (*"cost and tokens, efficiency, monitoring, and a dashboard"*) + **NEW:** surfaces.md 6 states the collision as two positions, not a resolved question. This resolves it by keeping both | FINAL §13.2's Balcony table with no dashboard row |
| **v15** | Which canvas and graph substrates are admissible | **Admitted: Langflow (MIT, alive 2026-09-05) as the canvas idiom; `3d-force-graph` (MIT) as the renderer. Refused: n8n (Sustainable Use — *"only for your own internal business purposes or for non-commercial"*), Flowise (ARCHIVED, licence NOASSERTION), Gource (GPL-3.0)** | **NEW:** surfaces.md licence table, n8n's LICENSE.md read raw | n8n as the workflow surface; Flowise as the canvas |
| **v16** | The board→session prior art | **OpenAI Symphony (Apache-2.0, last push 2026-08-19) replaces vibe-kanban as the reference.** vibe-kanban's own README now reads *"Vibe Kanban is sunsetting"* | **NEW:** surfaces.md 4, 5. **The gap that is ours to build:** *"Nothing found gives a card a team"* — every board-to-session project maps one task to one agent | FINAL §13.8's refusal of vibe-kanban as an unmaintained runtime — right conclusion, weaker reason |
| **v17** | Bulk import of the 2,111-skill upstream | **Blocked until `LICENSE-CONTENT` is read.** The code is MIT; a **separate `LICENSE-CONTENT` file exists and was not fetched**, and it may carry different terms for skill *content* than MIT does for code | **NEW:** skills.md licence table and gap 3. Cheap to clear, one fetch; until then no bulk vendoring | importing 2,111 skills on the strength of the repository's MIT badge |
| **v18** | The SKILL.md procedure collision | **The container is the open standard; the content rule is ours.** Four admissible bodies — anchor · exemplar · rehearsal case · reference. A **step list is admitted in exactly one place**: a checklist the Sender reads aloud, where the judge is absent and the act cannot be taken back | **NEW:** skills.md — the published spec recommends *"Step-by-step instructions"*, and FINAL §11 forbids procedure, so *"different artifacts wearing the same filename"*. FINAL §9.4's quadrant already decided where procedure is legitimate. **The cost, once:** an imported skill written to the spec's recommendation fails our admission and needs a pass | FINAL §11's flat refusal of the library; the spec's recommended body as written |
| **v19** | Skill retirement | **By forced expiry.** Every skill carries `valid_until`; at expiry exactly one disposition is recorded — Refresh, Deprecate, or Waive with a new date | **NEW:** skills.md 20 — *"Nobody found retires a skill by non-use"*; the nearest shipped thing is dead-link and drift detection. **Mechanism:** `scripts/ledger.mjs` already forces this disposition and `check-citations.mjs` already blocks on a dead path — both on this branch | *"Ninety days uncalled and it leaves"* — a usage counter nobody in the world has shipped |
| **v20** | The cheap tier | **No agent's default model is Haiku.** Haiku 4.5 appears only where the vendor sets it (the `/goal` evaluator, the auto-mode classifier). The genuinely cheap work goes to **local models on electricity** | **NEW:** models.md 5 — Haiku 4.5 retirement *"Not sooner than October 15, 2026"*, six weeks out, and it is the only Haiku in the published table. Locals: MiniLM 384-dim and Qwen3-0.6B, both Apache 2.0 | a Haiku executor tier; FINAL §16.7's *"local models: no shape"* read as *no work* |
| **v21** | Where Fable 5.1 sits | **An escalation, not a default.** One named rule: an intent whose done-test has failed twice under Opus 5 and whose horizon exceeds one window. **Its availability on a subscription seat is UNVERIFIED** — models.md publishes its API price and no plan table names it; fallback is Opus 5 | **NEW:** models.md — Fable 5.1 cache reads at **0.025x** base input against 0.1x everywhere else, which is what makes a large standing context cheap to re-read; the SWE-bench Pro ranking is third-party, confidence L, and is **not** used to route | Fable as the builder's default; wshobson's tier 0 adopted as-is |
| **v22** | The window | **Two windows, not one: a rolling five-hour AND a weekly, per seat, shared with Claude chat and Cowork.** And two limit shapes that behave differently — a seat limit cannot be escaped with `/model`; a model-family limit can | Moves **FINAL row 19**, which knew only the five-hour fuse. models.md, quoted from the vendor's costs page. **Consequence:** the reserve is per window *and* per week, and a weekly exhaustion is a different event from a five-hour one | one rolling five-hour window as the whole physical fact |
| **v23** | `--max-budget-usd` | **Not a billing control.** Print mode only, computed locally from token counts at list price, and *"the session cost figure isn't relevant for billing purposes"* for subscribers. It is a **stall fuse**, and it is kept for that | Moves **FINAL §7.5** and closes half of **§19.11**. models.md. Still true and still useful: subagent spend counts toward it, and overflow fails a spawn with `Budget limit reached` (v2.1.217+) | a per-run dollar ceiling that binds the account |
| **v24** | Memory writes | **Delta-only, never a rewrite** — FINAL row 11 stands and is now sourced | **FINAL, now cited:** memory.md 1 — the paper is **ACE, arXiv 2510.04618**: context held 18,282 tokens at 66.7% accuracy, collapsed at the next step to **122 tokens and 57.1%**, below a 63.7% baseline | a nightly full rewrite of the memory files |
| **v25** | Who writes memory | **The curator, and only the curator** — the thing that acts never edits memory. FINAL stands, **with its counter-example named** | **FINAL**, against memory.md 3: Claude Code's own auto memory *is* written by the acting agent, in-session. That is one shipped counter-example, and it is accepted as a counter-example rather than hidden. **Mechanism:** the curator's grant is the only one whose writable scope includes the memory paths | shared memory writes by every agent; FINAL §10.1's Letta attribution, which memory.md 2 shows the current vendor page no longer supports |
| **v26** | Transcript mining | **Stands.** No tool was found that mines a transcript archive into taste, negatives or already-built; three tools read the corpus and render it for humans | **FINAL**, confirmed by memory.md 4. **The caveat that binds the build:** *"The entry format is internal to Claude Code and changes between versions"* — so mining is a batch pass over a snapshot, never a live parser in the critical path | a live transcript reader as a system dependency |
| **v27** | The shape of the memory index | **Two tier: an index loaded at start, topic files on demand** — and it is now the vendor's own default, not a local invention | **NEW:** memory.md 6 — Claude Code loads *"the first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first"* and topic files on demand. Same shape this repo already built for skills discovery | a single flat memory file loaded whole |
| **v28** | The permission axis | **Reversibility. FINAL row 12 stands, and it stands alone in the world** | **FINAL**, against cognition.md — *"neither shipped scheme does"*: Claude Code keys on a fixed path list plus an action class, Codex on workspace scope plus network. The nearest shipped analog is the classifier special-casing `rm`/`rmdir` on critical paths | keying `may-alone` on file path, as both shipped runtimes do |
| **v29** | The read-back | **Stays.** No shipped system mandates a restatement before work binds; Linear's 10-second `thought` acknowledges rather than confirms | **FINAL**, cognition.md 10 — unsupported *and uncontradicted*. Closed-loop readback is regulation in aviation and medicine | voice or a chat message binding an instruction directly |
| **v30** | Why `challenger` is an agent and not a step | **Because self-critique without external feedback is measured as harmful** — *"at times, their performance even degrades after self-correction"* (arXiv 2310.01798). Reflexion's 91% is not a counterexample: its feedback is external | **NEW:** cognition.md 5, 6. **Mechanism:** the challenger never reads the artifact's author's reasoning, only the artifact and its done-test; a second model family whenever one is reachable | a plan-critique pass the same run performs on itself |
| **v31** | The roster size, and its cost | **Fourteen plus the Operator.** The cost, stated once and not re-litigated: **every shipped running roster verified is 5–6 agents; every roster of 150+ is a catalogue you pick from. Ten to fifteen sits in a band nobody publishes evidence for, in either direction** | **FOUNDER**, cost from roster.md 5. It is an unoccupied band, not a refuted one — no source was found for a measured point at which adding specialists stops paying | Magentic-One's five; ChatDev's six; Anthropic's 3–5 concurrent subagents |
| **v32** | Codex's position on day one | **Checker on a prepared diff, in the foreground, stdout redirected to a file while inheriting the parent shell's TTY.** The **headless rehearsal is what widens it**: `codex exec --json`, no controlling TTY, non-trivial prompt, version ≥ 0.124.0 | **FOUNDER** (day one) + **NEW:** runtimes.md — #19945 open **130 days with no maintainer reply**, and its `script -qfc` cure is *"incompatible with normal background / parallel job execution"*. **The cost, once:** one foreground slot is not parallel, so Codex is not a night lane until the rehearsal passes detached | Codex as a full maker on night one; `script -qfc` wrapped around every child |
| **v33** | The trifecta split, inside a roster | **Survives intact.** The agent that reads the untrusted world (`scout`) holds no credential and cannot send. The agent that drafts an outward act (`writer`, `growth`) never holds the key. The thing that sends is **the Sender, a program with no model** | **FINAL** row 7, and cognition.md finds *no shipped analog* for staged-not-sent or a recall window anywhere | a research agent with a send verb; one agent that reads mail, decides and replies |
| **v34** | What makes a grant real | **The exact argv, emitted by one no-model launcher**, plus the managed file of v11, plus a nightly probe that asserts what a run can actually touch | **FINAL** §7.5 and row 13, unchanged. **Mechanism:** `bin/run` is the only thing that composes argv (ABSENT); `bin/probe` asserts it nightly (ABSENT) | `--allowedTools` as a narrowing; a prose rule describing a grant |
| **v35** | `Workflow` in an agent's tool line | **Absent from every agent, deliberately.** The gate may not be invocable by the thing it gates | **FINAL / this repo**, now **independently cited**: runtimes.md quotes the vendor — *"The `Workflow` tool is removed from all subagents via the first filter applied to subagent tool sets"* | granting a dispatched engine the ability to run its own gate |
| **v36** | Who may hold a tainted read | **`scout` only, and the world's door program.** Gmail, Calendar, Drive and Notion reads are tainted READ-ONLY (§F); no agent that holds `Write`, `Edit` or `Bash` reads them raw. `steward` writes obligations from `scout`'s handover; the world's door writes one inbound row per event and holds no model | **FINAL** §9.4–9.5 and v33, applied to a collision builder 2 found between §F and §B.2 row 12 — one grant, two rules. Decided by the orchestrator 2026-09-05, DECISIONS.md §8 | a steward that reads mail with a pen in its hand |
| **v37** | The brief, now that agents have names | **Ten fields: FINAL's nine plus `agent:` — the roster name the launcher composes argv for.** `window+model:` stays as it is; the agent's row in §B.2 supplies its defaults and §G.1 overrides per move | **NEW:** fourteen named agents make "which agent" a fact the brief must carry, and neither reading was in §A until builder 1 asked (BLOCKED, §6). Chosen because it leaves FINAL's nine fields untouched. **Mechanism:** `bin/run` refuses a brief whose `agent:` is not a roster file (ABSENT) | `agent+window+model:` as one widened field; a brief that names no agent and lets the launcher guess |
| **v38** | Where the read-back and the briefing live among the seven pages | **The read-back is the intent-creation form wherever an intent is born** — page 4's "new card" and page 7's "add session" — **and stays a published phone page** for voice. **The briefing is the top strip of page 5 (engines · how it works) and stays a published phone page.** `Decide` items appear on page 4 as cards in a "waiting on you" column and on the phone | **NEW:** builder 4 found FINAL §2.4's read-back page and §13.4's briefing unplaced in §D. Placement, not a new mechanism: both were already published pages (FINAL §13.10, the artifact runtime), and the founder's pages absorb rather than delete them (v4). **Mechanism:** the store check refuses an intent with no read-back confirmation row (ABSENT) | a read-back page as an eighth page; a briefing nobody can reach from mission control |
| **v39** | What hosts the website | **Mission control is served on the Mac by `mission-control/` — the Bun + Hono server and React client that exist on this branch (60 files) — because a terminal pop needs `tmux` on the same machine.** The phone reaches it two ways: the published artifact pages (Balcony views, briefing, read-back) for reading and deciding, which cannot pop a terminal; and the local server over the founder's own network for everything else | **NEW:** builder 4 — the artifact runtime *"cannot reach tmux"*. FOUNDER: *"everything is run on it"* [the Mac]. FINAL §17 marked `mission-control/` ABSORBED; v4 un-absorbs it as the seed. **Cost, once:** two renderers over one state, which FINAL §13.1 refused — accepted because a tap that opens a terminal cannot come from a hosted page, and both read the same logbook | the website hosted as a published artifact; a cloud host that reaches into the Mac |
| **v40** | `maxTurns` for the roster files that have no seed | **30 for the nine that produce** (builder, architect, tester, designer, product, writer, growth, steward, curator) **and 25 for the five that only read** (reviewer, guard, scout, analyst, challenger); **the Operator 30**. Tuned per agent by measurement afterwards | **NEW:** the seven existing engine files use exactly these two values (30 producing, 25 framer and sourcer), `maxTurns` binds when an `agentType` is named, and the lint ceiling is 120 — CLAUDE.md, this branch. A default that copies the measured seeds is a starting point, not a design | one cap for every agent; no cap |
| **v41** | `isolation` for the agents that write | **`worktree` for the four that touch venture source** (builder, architect, tester, designer); **`none` for the five that write only into the house's stores** (product, writer, growth, steward, curator) — their grant is a narrowed `--add-dir`, not a checkout; **`none` for the six that do not write** | **NEW:** builder 4 asked. FINAL §6.1: a worktree is for a run that writes code or files of the venture; a store write is narrowed by argv (v34). **Cost, once:** `git worktree add` still cannot complete under the armed sandbox without escalation (CLAUDE.md, measured 2026-08-24) | a worktree for every agent; no isolation for the four that edit source |

**Carried forward from FINAL §1, unchanged, by number:** rows **1, 2, 3, 4, 5, 7, 9, 14, 16, 17, 18, 20, 21, 22,
23, 24, 25, 26, 27, 28, 29**. Rows **11, 12, 13, 19** are carried forward *and* moved, by v24/v25, v28, v34 and
v22 respectively. Rows **6, 8, 10, 15, 30** are overruled by v1, v2, v3, v4 and v5 and appear only in §J.

---

## B · The roster, decided

**Fourteen agents plus the Operator — fifteen named roles.** (FOUNDER: *"as much as you will need, but not too
much. So, like, between ten and fifteen agents"* plus *"We need an operator"*.) One file per agent, in the
frontmatter format the runtime already reads: `name`, `description`, `tools`, `model`, `mcpServers`, `skills`,
`maxTurns`, `isolation` (roster.md, per-agent format table). All fifteen files are **ABSENT**; the format, the
`PS-*` lint and eighteen existing agent files on this branch are the seed.

### B.1 What survives from FINAL, inside the roster

Four rules survive the move from three shapes to fourteen names, and each names its mechanism:

1. **The grant is argv, not prose.** One no-model launcher composes it; nothing else may. (v34; `bin/run`, ABSENT)
2. **The checker cannot edit what it judges.** `reviewer`, `guard` and `challenger` carry no `Write`, no `Edit`,
   no `Bash`. (FINAL row 6's irreducible property; enforced by the argv and by the nightly probe)
3. **The trifecta split.** No agent holds untrusted input, private credentials and an outward channel at once.
   (v33; the Sender is the only thing that sends, and it holds no model)
4. **The no-model programs stay programs.** Watch · Sender · door · probe · reconciler · log · launcher · curator
   launcher · drill · rehearsal runner · store check · supervisor. A prompt injection that reaches one finds a
   program. (FINAL §7.4, §16.1)

### B.2 The fourteen

Model ids are from models.md. `tools` are the argv-level grant. "Anchor" is what proves the work — never the
agent's own report.

| # | Name | The job it exists for | Expertise lens | Model | Tools | MCPs | Skill namespaces | Anchor — what proves it | The Operator routes here when |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **builder** | Writes the code. One artifact, one worktree, continuous context | engineering | `claude-opus-5` · escalates to `claude-fable-5-1` under v21 | Read Write Edit Bash Glob Grep | none by default | engineering · testing | the venture's own CI, plus the done-test, plus the tester's blind test | the intent's outcome is source code |
| 2 | **reviewer** | Judges code it did not write, against a named dimension | engineering · correctness | `claude-sonnet-5`; a second family when reachable | Read Glob Grep | none | engineering · quality | findings reproduce from the diff alone; a finding with no reproduction is a hypothesis | any builder handover, before merge |
| 3 | **architect** | The contract before the code: schema, API, data model, migration | engineering · systems | `claude-opus-5` | Read Glob Grep Write (design paths only) | none | engineering · data | a migration that applies and rolls back in a scratch database | the work changes a schema, an interface or a stored shape |
| 4 | **tester** | Writes the test that judges a build, **blind to the implementation** | quality | `claude-sonnet-5` | Read Write Edit Bash Glob Grep, `--add-dir` excluding the implementation | none | testing · quality | the test fails before the change and passes after | any intent whose done-test needs a new anchor (v8) |
| 5 | **guard** | Security and adversarial review; every tool admission | security | `claude-opus-5` | Read Glob Grep | none | security | a proof of concept that reproduces, or the finding is a hypothesis | auth, credentials, network, outward acts, migrations, or a new tool at the door |
| 6 | **scout** | Finds things out. Stateless, parallel legal here and only here. **Reads the untrusted world** | research | `claude-sonnet-5`; Gemini once authenticated | Read Glob Grep WebSearch WebFetch — **no Write, no credential, no send** | read-only servers, per run | research | every claim carries URL, quote and access date; `check-citations.mjs` blocks on a dead one | a bounded question of fact is cheaper to answer than to assume |
| 7 | **designer** | UI, UX, brand, visual identity, prototypes. The perception loop: render, look, iterate | design | `claude-opus-5` | Read Write Edit Bash Glob Grep | `playwright` (per-run inline) | design · frontend | a rendered screenshot judged against a named anchor; never the agent's description of it | the artifact is seen by a person |
| 8 | **product** | Turns fuzzy into a falsifiable done-test; specs, tickets, acceptance criteria, roadmap | product | `claude-sonnet-5` | Read Glob Grep Write (spec paths) | none | product | the store check refuses an intent whose done-test is not falsifiable by someone who did not do the work | the request cannot yet be dispatched |
| 9 | **analyst** | Pipelines, KPIs, cohorts, A/B, anomalies, and the nightly reconciliation | data | `claude-sonnet-5` | Read Glob Grep Bash | read-only analytics, error tracking, billing-read | data | the reconciliation reads a record the company does not write; a number that reconciles to our own log is rung 4, not rung 1 | a question is about what actually happened |
| 10 | **writer** | Content, brand voice, SEO, ad copy, campaign drafts, video and asset briefs | growth · craft | `claude-opus-5` for taste work; `claude-sonnet-5` for routine | Read Write Edit Glob Grep | Higgsfield (rate-capped, spends credits) | growth · craft | staged, never sent; the anchor is the founder's taste store and a rung-2 external reaction | words or assets are the artifact |
| 11 | **growth** | Leads, scoring, outreach *drafts*, CRM hygiene, funnel work. **Never sends** | growth | `claude-sonnet-5` | Read Glob Grep Write | CRM read-only | growth | a reply from a real person, recorded by the world's door; never a count of messages sent | the intent is about reaching people who are not yet customers |
| 12 | **steward** | Obligations, invoices, expenses, contract *review*, compliance flags, vendors, support triage | operations · finance | `claude-sonnet-5` | Read Glob Grep Write (obligations and operations paths) | **none** — mail, calendar, drive and Notion are read by the world's door (a program) into inbound rows, and by `scout`; steward writes from scout's handover, never from a raw row (v36) | operations | an obligation is discharged only by a record the company does not write | something is owed to someone by a date |
| 13 | **curator** | What the company knows: memory, the transcript pass, and skill admission. **The only writer of memory** | knowledge | `claude-sonnet-5`; the summarising half on Gemini or a local model | Read Write Edit Glob Grep — **no Bash** | none | knowledge | a memory item with no source, date, expiry and falsifier is refused at the store check | nightly, and whenever a run's handover proposes a durable fact |
| 14 | **challenger** | Attacks a finished plan or artifact for holes, contradictions, and rules with no mechanism | adversarial reasoning | `claude-opus-5`; a second family when reachable | Read Glob Grep | none | quality · research | every finding names the mechanism that would have caught it, or it is an opinion | before anything irreversible, and on every plan the Operator is about to bind |

**Where the roster is thinner than it looks, and deliberately:** eight of the fourteen carry no shell, five carry
no write of any kind, and only four can touch source. That is the trifecta split (v33) expressed as a table
rather than as a rule.

### B.3 Reconciliation with roster.md facts 1–6

| Fact | What it says | What the roster does with it |
|---|---|---|
| 1 | Every shipped roster names its roles; zero ship unnamed shapes | Adopted. It is the founder's decision and the world agrees with it |
| 2 | Magentic-One splits by **grant** (browser, file-read, code, shell), not by domain | Adopted as the *second* axis: the table above splits by job, and the `tools` column splits by grant. Both cuts are present and they are not the same cut |
| 3 | Per-agent model is first-class frontmatter | Adopted; it is what makes §G's per-agent routing a file field and not a wish |
| 4 | Coding is single-threaded (Anthropic's own post) | Adopted as v6: one artifact, one builder, never parallelised |
| 5 | Running rosters are 5–6; catalogues are 150+; 10–15 is unoccupied | Stated once as the cost of v1 and not re-litigated. **Fourteen is a founder decision taken with the evidence in hand, not in ignorance of it** |
| 6 | Anthropic's +90.2% is on *research* with independent subtasks; Cognition's failure is on *one artifact* | Adopted as the dispatch rule: `scout` is the only agent that runs parallel, and it is the only one whose subtasks are independent |

### B.4 The founder's departments (§23–§30): covered, or refused with a reason

| § | Department | Covered by | Refused, and why |
|---|---|---|---|
| 23 | design & product | designer (UI, UX, branding, visual identity, prototype, accessibility) · product (spec, roadmap, feedback triage) | **User-testing simulation** — a simulated user is the machine grading its own homework; the rung-1 anchor is a real reaction |
| 24 | engineering | builder · reviewer · architect · tester · guard. Documentation is written by whoever made the thing, and its anchor is that a cold reader can run it | **A separate documentation agent** — docs split from the artifact drift the moment the artifact moves (v7's reasoning, applied) |
| 25 | data & analytics | analyst (pipelines, tracking, dashboards, KPIs, cohorts, A/B, cleaning, anomalies) | **Data labelling** as an agent — it is a founder-taste task and feeds the taste store through the Floor |
| 26 | marketing & content | writer (calendar, blog, video and asset briefs, SEO, ad copy, social, email, brand voice) | **Influencer outreach** — first contact with a stranger is on the default `never` list |
| 27 | sales & growth | growth (scraping, scoring, outreach drafts, CRM, follow-up, deal stage, referral) | **Churn prediction** — no venture has the data; it is a wish until one does |
| 28 | customer service | steward triages (a support ticket is an obligation with a due date); writer drafts the reply; **the Sender sends** | **An autonomous reply bot** — a person is on the other side, so it is REACHES-THE-WORLD and never unattended until the founder widens the class |
| 29 | finance & legal | steward (invoices, expenses, budget-vs-actual, contract *review*, compliance flags) · analyst (the reconciliation) | **Contract drafting that binds, tax filing, cap-table edits** — one-way doors; they reach the founder as a *which*, with both options prepared |
| 30 | operations & HR | steward (vendors, meeting notes, calendar, process docs, internal tooling requests) | **Hiring pipeline** — there are no employees; revisit when there are |

**Two departments have no shipped precedent anywhere** (roster.md): sales and growth as a function, and legal
and contracts. `growth` and `steward` are therefore the two roster entries with the least outside evidence
behind them, and their anchors are correspondingly external: a reply from a real person, and a record the
company does not write.

---

## C · The Operator

**(FOUNDER)** *"We need an operator, which is, like, the orchestrator of the agents, which is also the contact
point with me. … depends on the type of tasks because you also need to be able to run it fully autonomous."*

Model `claude-opus-5`. Tools: `Read Glob Grep` plus `Agent(...)` — **it dispatches and it does not build.** No
`Write`, no `Edit`, no `Bash`: the Operator that can edit will edit instead of dispatching, which is the same
argument that keeps `Write` off `reviewer`. **Mechanism:** its argv, and the nightly probe. **ABSENT.**

### C.1 Graded autonomy, mapped onto three things at once

The founder's *"how much it asks me depends on the type of task"* becomes one band table, and every band names
its envelope terms, its Claude Code permission mode, and its Codex axes. This is the row every section about
control must obey.

| Band | Task types | Envelope | Claude Code mode | Codex `approval_policy` × `sandbox_mode` | Who runs in it |
|---|---|---|---|---|---|
| **Read and report** | research, review, audit, analysis, challenge | `may-alone` | `plan` | `never` × `read-only` | scout · reviewer · guard · challenger · analyst |
| **Build in a worktree** | code, design, copy, spec, schema, memory | `may-alone`, inside one venture's worktree | `dontAsk` with `--restricted` and an explicit `--tools` | `never` × `workspace-write` | builder · architect · tester · designer · product · writer · growth · steward · curator |
| **Stage an outward act** | send, publish, pay, deploy, share, delete | **`never` for every agent** | no mode — no agent performs it | — | nobody. The **Sender** performs it, and it holds no model |
| **Wake the founder** | anything on the venture's `wake-me` list | `wake-me` | — | — | the Watch, before it rings, against the interruption budget |

**Two shipped facts make the table binding rather than descriptive** (cognition.md): `bypassPermissions` is
disabled in managed settings and **deny rules bind in every mode including it**; and a subagent's own
`permissionMode` frontmatter **is ignored**, so a child cannot widen its own grant. **`auto` mode's classifier is
a cheap guardrail against accident and is NOT the envelope** — it is a second model reviewing actions, it can be
switched off with `disableAutoMode`, and nothing in it keys on reversibility (v28).

### C.2 Fully autonomous mode

**(FOUNDER: *"you also need to be able to run it fully autonomous"*.)** It is the "build in a worktree" band with
three additions and one consequence.

- **Additions:** the managed settings file of v11 · `/goal <the done-test> or stop after N turns` on every
  dispatched run (v12) · the cord read first, every tick.
- **The consequence, and it is the whole design of the mode:** `dontAsk` **denies `AskUserQuestion`** (v9). A
  fully autonomous run **cannot ask**. So every question it would have asked is either pre-decided in the
  envelope, or **staged as a which with both options built** and left for the founder. There is no third
  outcome, and no approve verb.
- **What still reaches the founder while it runs:** the `wake-me` list, the interruption budget of three a day,
  and the briefing, which is never an interruption because the founder opens it.

### C.3 The read-back stays

**(FINAL row 17, v29.)** Voice is input only. The Operator writes back what it understood — as an intent with a
done-test, in its own words, on screen — and the founder confirms by tap or typed word. **Nothing binds by
voice.** No shipped system does this (cognition.md 10); Linear's 10-second `thought` acknowledges rather than
confirms. **Mechanism:** the read-back page (ABSENT); the store check refuses an intent with no falsifiable
done-test.

### C.4 How it dispatches

Three mechanisms, each used for what it is documented to do (v13):

| Mechanism | Used for | Sourced constraint that shapes the design |
|---|---|---|
| **Agent teams** | the fleet the founder watches on the agents page — a lead plus named teammates, each a full independent session, messageable by name | experimental, off by default (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`); **no nested teams**; one team per session; `/resume` does not restore in-process teammates; spawning needs an interactive session, so `-p` never forms a team. Tokens: *"approximately 7x more … when teammates run in plan mode"*, and the vendor's own advice is *"Use Sonnet for teammates"* |
| **Subagents** | depth inside one agent — a builder's own exploration, a scout fan-out | depth 3 default, 20 concurrent, `Workflow` removed from all of them (v35); a subagent's `permissionMode` frontmatter is ignored; main-conversation auto memory is not loaded into subagents except a fork |
| **`claude -p` children through the launcher** | unattended night work, and every non-Claude provider | `--session-id` must be a valid UUID, minted by us; `--restricted` needs v2.1.248+; `--max-budget-usd` is a stall fuse, not a billing control (v23); `-p` disables tools needing terminal input, so a session never stalls waiting |

**The Operator never composes argv itself.** It emits a brief with an intent id; `bin/run` (ABSENT) composes the
argv. That is what keeps v34 true when the roster grows.

---

## D · Mission control, decided

**(FOUNDER, overruling FINAL row 15.)** A **website**. Seven pages, each its own. Everything it opens **runs on
the founder's Mac** and opens in a terminal there: *"remember each agent or each session that we are opening in
the mission control or any other surface, it's directly opening it in the terminal in my Mac because everything
is run on it."*

**Where the Floor and the Balcony now live.** The **Floor is unchanged and is what every tap opens** — a
terminal, one agent, same memory, same envelope, sterile while the founder is in it. The **Balcony is not
deleted; it is absorbed as pages of mission control**: `Now` → page 2, `Decide` and `Last night` → page 5's desk
strip, `Ventures` → page 1, `Cord` → a control present on every page. FINAL §13.2's rule *"every element is
either a fact or a tap"* survives and is extended by v14 to the dashboard the founder asked for.

| # | Page | What it shows | What each tap launches | Substrate | State |
|---|---|---|---|---|---|
| 1 | **The office** | the room: every live run a light; one venture per area; the night replayed at speed in the morning | tap an avatar → that agent's terminal | Generative Agents `demo` mode (Apache 2.0), fed by a JSON writer over the event log | ABSENT; through the tool door |
| 2 | **Agents / child flows** | the Operator and its children; who is working, who is sleeping, what each is doing on the current task | tap → `tmux attach-session -t <name>` or `claude --attach <id>`; message → write the agent's inbox file | Claude Code **agent teams**: `~/.claude/teams/<team>/config.json` (session ids **and tmux pane ids**), `inboxes/<agent>.json`, `~/.claude/tasks/<team>/`; team name is `session-` + the first eight chars of the session id. `claude agents --json` for background sessions | the substrate ships; the page is ABSENT. **Read-only against config.json — it is *"overwritten on the next state update"*** |
| 3 | **Cost · tokens · efficiency** | spend and tokens per run, per agent, per venture, per window; cache hit rate; the reserve; the weekly window as well as the five-hour one (v22) | every number taps: a cost row → its run · a window row → retempo · an anomaly → the cord (v14) | the event log with `gen_ai.*` attribute names and an id on every row, joined to the price table in §G | ABSENT; `~/.agentvibe/events.jsonl` on this branch is the spine |
| 4 | **Tasks · tickets · PRs** | a board with stages, a timeline, and a kanban; PRs beside tickets | **dragging a card into "working on it" launches a session with a team of agents and hands it the task** | ours. Prior art: OpenAI **Symphony** (Apache-2.0, alive) — one isolated workspace per issue; card fields from Linear (**delegate, not assignee**) and Copilot (one branch, exactly one PR, a hard execution cap) | ABSENT. **Nothing in the world gives a card a *team*** (v16) — that part is genuinely new work |
| 5 | **Engines · how it works** | every engine, every gate, every store, the flowcharts, live rather than drawn | tap a gate → its last ten resolutions; tap a store → its schema and its one writer | the same store as every other page; no second source of truth | ABSENT |
| 6 | **3D file graph** | the files of one project as a wired brain; edges are imports and co-change | tap a node → open it on the Floor | **`3d-force-graph`** (MIT) as the renderer. **Its input is a `{nodes, links}` object; it does not read a repository** — the extractor is ours. Gource refused (GPL-3.0) | ABSENT; thinnest researched area (surfaces.md gap 3) |
| 7 | **Canvas / playground** | every agent in every session, and their connections | add a session: choose worktree, project, provider, model, task and agent → `claude --session-id <uuid> --bg`, then `--attach` | **Langflow** (MIT, alive 2026-09-05) as the canvas idiom. **n8n refused** (Sustainable Use: internal or non-commercial only) · **Flowise refused** (archived, licence NOASSERTION) | ABSENT |

### D.1 The terminal-pop mechanism, decided

**tmux, through its own CLI.** Five commands do the whole of pop, watch, type and kill: `tmux new-session -d -s
<name> -c <dir> <program>` · `attach-session -t` · `capture-pane -p -e -J -t` · `kill-session -t` ·
`has-session -t`. **claude-squad is AGPL-3.0**, so its source is not vendored; what is used is the documented
tmux CLI those commands call. For the founder's own sessions, `claude --teammate-mode tmux` gives a pane per
teammate; `iterm2` mode additionally needs the `it2` CLI **and** iTerm2's Python API enabled. **Split panes are
unsupported in VS Code's integrated terminal, Windows Terminal and Ghostty** — the page must say which terminal
it is opening into. AppleScript and `open -a Terminal` are **UNVERIFIED** — no primary source was fetched.

### D.2 Session history, count and memory efficiency

**(FOUNDER: *"we also need to manage, you know, the history and number of sessions and, like, to understand how
do we save memory and to be efficient."*)**

- **History** is the event log, not the transcripts. Transcripts are read by the mining pass over a snapshot,
  never parsed live: *"The entry format is internal to Claude Code and changes between versions"* (v26).
- **Count** is bounded three ways, and the board refuses a drag that would breach any of them: 20 concurrent
  subagents (vendor cap), the WIP limit per venture, and at most two driven ventures (FINAL row 14).
- **Memory efficiency** is the two-tier index (v27), delta-only writes (v24), one writer (v25), and the
  one-hour subscription cache TTL, which is why standing prompts are byte-identical and carry no timestamp.

---

## E · Skills, decided

**(FOUNDER, overruling FINAL row 10.)** *"take all the skills that the biggest systems use … to give the agents
the tools the knowledge they will need in order to achieve tasks without limiting their point of view."*

### E.1 The library plan

- **Format: the open SKILL.md standard**, so one artifact loads in Claude Code, Codex and Gemini CLI unchanged.
  Its published limits are the file's limits: `name` ≤ 64 chars matching the directory, `description` ≤ 1024,
  metadata ~100 tokens loaded at startup for *every* installed skill, instructions < 5,000 tokens, body under
  500 lines.
- **Two directories, both real, one source of truth.** `.claude/skills/` for Claude Code; **`.agents/skills/`
  for Codex and Gemini CLI** — sourced, and note that **Codex does not read `.codex/skills`**. Markdown is the
  single source and the harness-native artifacts are generated, which is wshobson's shipped shape.
- **The content rule is ours** (v18): four admissible bodies — **anchor** (a check with an exit code),
  **exemplar** (examples of good, with provenance), **rehearsal case** (input plus known answer), **reference**
  (a vendor fact with an expiry). A step list is admitted only as a Sender checklist.
- **Import:** the upstream now advertises **2,111+ skills**, MIT on the code, **and a separate `LICENSE-CONTENT`
  that was not fetched.** No bulk vendoring until it is read (v17). One fetch clears it.
- **Retirement by forced expiry** (v19), because no project in the world retires by non-use.

### E.2 Admission by eval

**Mechanism, and it starts from shipped code, not from a design.** `skill-creator` (anthropics/skills) already
implements exactly what FINAL §11.3 asked for as *"admission by test, not excision by argument"*: draft 2–3
realistic prompts into `evals/evals.json`, run **with-skill and baseline in parallel**, grade the assertions,
tune the description for triggering accuracy, package. Added to it: `plugin-eval`'s **static layer** —
deterministic structural analysis, seconds, free. **Refused for now:** `plugin-eval`'s Monte Carlo layer, 50–100
simulated runs per candidate. **The cost, once:** without it, a skill's reliability is measured on 2–3 cases, so
a skill's expiry does the work a larger sample would have done.

**Caveat that must be carried:** `anthropics/skills` has **no root LICENSE file**; its README says *"Many skills
in this repo are open source (Apache 2.0)"* and that the document skills are *"source-available, not open
source"*, and *"provided for demonstration and educational purposes only."* The **mechanism** is imported, not
the corpus.

### E.3 The skill creator

**(FOUNDER: *"we need a skill creator of skill, which, you know, we will research a task or a mission and, like,
to break it down two steps and to give it to the agents."*)**

It is a **program, not a fifteenth agent** — `bin/skill` (ABSENT) — and it names which agents it uses at each
move, which is why it is not a stage stating method:

1. **scout** answers the bounded question of how the field does this, with sources.
2. **product** states the done-test the skill is supposed to make reachable.
3. **curator** writes the artifact into the admissible body of E.1 and proposes its `valid_until`.
4. The **eval loop of E.2** runs with-skill against baseline. A candidate that does not beat baseline is not
   admitted, and the negative is written to the negatives store rather than discarded.

### E.4 Namespaces per agent

Thirteen namespaces: `engineering` · `testing` · `quality` · `security` · `design` · `product` · `data` ·
`growth` · `craft` · `operations` · `knowledge` · `research` · `frontend`. Each agent's row in §B.2 names the
ones it carries. **Never preloaded** — the standard's own progressive disclosure is the mechanism: name and
description at startup, body on judged relevance, bundled files below that.

---

## F · Tools and MCPs

**(FOUNDER: *"there is no limitations of adding new MCPs or new tools to fill our needs … endless
possibilities … we need to think about it outside of what we have right now."*)**

**FINAL §9.3's door is material, not a ceiling** — it is what a tool must pass, never a list of what may be
proposed. Anything may be proposed. Four classes decide what a tool may then do:

| Class | Example | Who may hold it | Night? |
|---|---|---|---|
| READ-ONLY | Playwright headless, a render, a repo read API | any agent | yes |
| READ-ONLY, **tainted** | Gmail read, Drive read, Notion read, the open web | **scout only** — the trifecta agent, which holds no key and cannot send | yes |
| WRITES, reversible | Figma, Pencil, a design file on a dry branch | designer, after the undo is drilled | yes |
| **REACHES THE WORLD** | send, publish, pay, deploy, share, delete | **no agent. The Sender.** | only after the founder widens the class |

**Admitted first, and the reason is not caution:** the read-only instruments — analytics, error tracking, a
read-only billing key, the CI API, the git host read API. The nightly reconciliation cannot exist without them,
and the reconciliation is what makes every other number rung 1 instead of rung 4.

**The wish list, by need rather than by vendor** (WISH until each passes the door): a payments read API (§13
economics has no source of truth without one) · a domain and DNS read (§14 venture-owned assets) · an ads
platform **read** before any write (§03) · a design-token bridge (§23) · a database read replica per venture
(§25) · an e-signature read for obligations (§29) · a second search provider so `scout` is not single-sourced
(§34). **Refused as they stand:** Mem0 (memory leaves the machine), RunPod (spends money at a rate under an
uncapped key), n8n (licence, v15).

**One MCP shape serves both runtimes**: Claude Code takes per-subagent `mcpServers`, Codex takes per-agent
`mcp_servers` in TOML. A server admitted once is declarable in both.

---

## G · Models

**(FOUNDER: *"we need to understand what models each agent gets because we don't need everyone running on Opus
or Fable or Astra or Terra ChatGPT models."*)** Every figure below is from models.md, fetched 2026-09-05.

### G.1 Model per agent per move

The default is the agent's row in §B.2. This table is what changes it, per move, and each rule names its trigger.

| Move | Model | Why this one |
|---|---|---|
| Any agent's default | as §B.2 — **five on `claude-opus-5`, eight on `claude-sonnet-5`, one split** | not everyone on the top tier, which is the founder's instruction |
| A build whose done-test has failed twice, horizon beyond one window | escalate to `claude-fable-5-1` | 1M context and **cache reads at 0.025x** against 0.1x everywhere else, so a large standing context is cheap to re-read. **Availability on a subscription seat is UNVERIFIED** — no plan table names Fable; fallback is `claude-opus-5` |
| A teammate inside an agent team | `claude-sonnet-5` | the vendor's own line: *"Use Sonnet for teammates"*, and teams use **~7x more tokens** when teammates run in plan mode |
| Routine scouting, mail sorting, link checks, the summarising half of the transcript pass | Gemini, once authenticated | it burns a different window and never touches the founder's |
| Embeddings, classification, dedup, PII detection | **local, on electricity** — MiniLM (384 dims, Apache 2.0, 256-word-piece truncation) and Qwen3-0.6B (32,768 context, Apache 2.0) | no window at all |
| A checker on a prepared diff | Codex `gpt-5.3-codex`, in the one position of §H | a second family, which is what the anchor ladder pays for |
| `/goal`'s evaluator and the auto-mode classifier | Haiku, **set by the vendor, not by us** | see G.4 |

**A blocking mechanism problem, and it must be fixed in the same change that writes an agent file:** this repo's
`scripts/prompt-standard.test.mjs` pins the valid model set to `claude-opus-5`, `claude-sonnet-5`,
`claude-fable-5`, `claude-haiku-4-5`. **`claude-fable-5-1` is not in it**, and `claude-fable-5` is now listed by
the vendor under *"Legacy models (still available)"*. An agent file written to G.1 fails a blocking lint today.

### G.2 The three windows and what each publishes

| Window | Published quota | Confidence |
|---|---|---|
| **Anthropic subscription** | **No numeric quota is published anywhere fetched.** Two windows exist — a rolling five-hour **and a weekly** — per seat, *"shared with Claude chat and Cowork"*. Magnitudes are relative only: Pro *"at least 5x more usage per 5-hour session than Free"*, Max *"5x"* / *"20x more usage than Pro"*. A Max window's real capacity is measurable only from an account. **The Max 20x price is UNVERIFIED** — the pricing page rendered *"From $100 per month"* for both Max tiers | H on the windows, and the absence of numbers is itself the finding |
| **OpenAI Codex** | **The only vendor publishing numeric per-window quotas.** Per 5-hour rolling window: GPT-6 Astra 5–45 (Plus) / 25–225 (Pro 5x) / 100–900 (Pro 20x); GPT-5.6 Sol 10–100 / 50–500 / 200–2,000; GPT-5.6 Luna 250–2,000 / 1,250–10,000 / 5,000–40,000. *"GPT-5.6 usage averages 5-30 credits per message"* | H. **Caveat:** `gpt-5.3-codex` appears in the API price list and in **no** plan quota row |
| **Gemini CLI** | Free tier: **60 requests/min, 1,000 requests/day** with a personal Google account. Paid AI Pro / Ultra / Code Assist per-tier CLI quotas **UNVERIFIED** — not fetched | H free, unverified paid |

**Two limit shapes, and they behave differently.** A **seat** limit (*"session limit"*, *"weekly limit"*) is
shared across all models and **cannot be escaped with `/model`**. A **model-family** limit (*"your Opus limit"*)
can — switching family keeps the crew working. The Watch must distinguish them: one is a stop, the other is a
reroute.

### G.3 Cache facts that bind

- **Fable 5.1 and Mythos 5.1 read cache at 0.025x base input**; every other model is the standard 0.1x.
- **The write coefficient depends on the TTL you are buying:** 1.25x base input for a **5-minute** write, **2x
  for a 1-hour** write. FINAL §15.3's formula multiplies by 1.25 while assuming the one-hour TTL — **wrong
  coefficient for the TTL it assumes**, and its 0.10 sibling-read figure is **wrong by 4x for Fable**.
- **TTL is one hour on a subscription**, and drops to five minutes once usage credits are drawn, on an API key,
  or on a cloud provider. This is why standing prompts are byte-identical and carry no timestamp.
- **A tokenizer discontinuity crosses our own model list:** Opus 5 and Fable 5.x produce *"approximately 30%
  more tokens for the same text"* than Sonnet 4.6 and earlier. **Any token budget inherited from a
  Sonnet-4.6-era measurement understates by about that much.**
- **On a cache-dominated workload the model spread collapses, and this is the quantitative backing for v21.**
  List price runs 10x in and 10x out from Haiku 4.5 ($1/$5) to Fable 5.1 ($10/$50) — but Fable's cache reads
  ($0.25) are only **2.5x** Haiku's ($0.10). FINAL §14.5 measures context at 89% of the load, which is exactly
  the regime where the 0.025x read rate does the work. A long-horizon build with a large standing context is
  the one move where the top model is not priced like the top model.
- **Batch still needs a metered key** (FINAL §5.2 holds): 50% off both directions, and it **stacks with
  caching**. Batch prices are now published for every model, so the row is ready for the day a key exists.
- The one **vendor** cost anchor that exists is per developer-day, not per task: **$13 per active day, $150–250
  per month, under $30 per active day for 90% of users.** Every cost-per-task figure in circulation is
  third-party, confidence L, and is not used to route.

### G.4 Haiku 4.5's retirement

**Committed *"Not sooner than October 15, 2026"* — the nearest retirement date of any model this system names**,
and it is the only Haiku in the published table. Consequence, already taken as v20: **no agent's default is
Haiku.** It remains where the vendor sets it — `/goal`'s evaluator (changeable with
`ANTHROPIC_DEFAULT_HAIKU_MODEL`, which changes it *everywhere the small fast model is used*) and the auto-mode
classifier. **Owner:** the founder, on a dated review; **mechanism:** the model ids carry an expiry in the facts
store and the store check fails a stale one.

### G.5 The terms question, stated once

*"Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit
it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."*
The carve-out is an API key, and the escape hatch is *"where we otherwise explicitly permit it"* — which
Anthropic's own shipped features (`-p`, `--max-budget-usd`, `/loop`, Routines, Remote Control, agent teams)
exercise. **Where a third-party program drives a subscription seat, that clause is the governing text and
nothing narrowing it was found.** The no-metered-key choice and the automation question are therefore **one
question, not two**. **OpenAI's terms returned HTTP 403 and are unread. Google's are unfetched.** It is a
founder decision after one reading, and it is §I row 1.

---

## H · Codex and Claude Code from day one

**(FOUNDER, overruling FINAL row 30: *"I run from day one of the system to include codex and Claude code in the
system."*)**

### H.1 The shape, decided

**A third program drives both.** The Operator is the founder's contact point and runs inside Claude Code; every
dispatch, to any provider, goes through one no-model launcher that emits that provider's argv.

| Option | Verdict | Why |
|---|---|---|
| Claude Code drives Codex from Bash | **rejected as the primary shape** | it is exactly the shape #19945 breaks — no controlling TTY plus a non-trivial prompt — and the `script -qfc` cure is *"incompatible with normal background / parallel job execution"*, which is what a crew is |
| Codex drives Claude | **rejected** | no documented mechanism in either direction; Codex is not installed |
| **A third program drives both** | **CHOSEN** | each vendor documents a headless invocation, a session id, resume, an instructions file, a SKILL.md bundle and MCP. A provider outage or a defect becomes a routing change, not a rewrite. It is also the only shape that keeps v34 true — one thing composes argv |
| Hybrid | folded in | the Floor is interactive Claude Code and always was; the founder may run Codex by hand there. That is the hybrid, and it needs no mechanism |

### H.2 Codex's position on day one, and the test that widens it

**Day one:** `codex exec` as a **checker on a prepared diff**, run in the foreground with stdout redirected to a
file while inheriting the parent shell's TTY — the second documented workaround, which does not need
`script -qfc`. **The cost, stated once: one foreground slot is not parallel, so Codex is not a night lane yet.**

**The admission test that widens it** — and it is specifiable from primary text now, which it was not when FINAL
was written: `codex exec --json`, **no controlling TTY**, a **non-trivial prompt**, on a version **≥ 0.124.0**,
against known-answer cases. Pass and Codex becomes a night checker and a maker on mid-hard work; fail and it
stays in the foreground slot. **#19945 has been open 130 days with no maintainer reply**, so the test is the
plan, not the issue closing.

### H.3 Where `/goal` and `/loop` sit

- **`/goal` is on the run, and the done-test is the goal condition** (v12). `claude -p "/goal <done-test> or
  stop after N turns"`; `--output-format stream-json --verbose` emits each message as the loop runs; the
  condition limit is 4,000 characters; the three verdicts are Not yet met, Met, Impossible. It terminates on
  Met, Impossible, `/goal clear`, or four unrecoverable errors, and **leaves the goal active after transient
  failures including rate limits** — which is the behaviour a night wants.
- **A goal defers evaluation while a subagent or background shell is running**; check-ins start at 30 minutes
  and double to a 4x ceiling, and under `-p` **check-ins are the only way the runtime delivers anything**.
- **`/loop` is refused in production** and stays a Floor convenience: session-scoped, 7-day expiry, and it fires
  *"only while Claude Code is running and idle"*. The Watch is the loop.
- **Codex `/goal` is not used.** It exists (0.128.0, 2026-04-30) with states including `budget_limited`, but
  **whether it runs under `codex exec` is not established**, and its own tracker carries an open issue that a
  budget-limited goal cannot resume. Revisit when H.2's test passes.

### H.4 The managed-settings collision, resolved

Written once in v11 and repeated here because it is where a section-writer will trip: the managed settings file
gives the grant a tier a running process cannot clear, **and setting `disableAllHooks` or `allowManagedHooksOnly`
in it kills `/goal`**, because `/goal` is a session-scoped prompt-based Stop hook. The file therefore carries
deny rules, `disableBypassPermissionsMode` and `disableAutoMode`, and **not** the two hook settings. Narrowing is
carried by `--restricted` plus an explicit `--tools` list, which does not touch hooks.

---

## I · Open decisions, with both sides

| # | Decision | One side | The other | Whose |
|---|---|---|---|---|
| 1 | **The terms** — automated access on a subscription | the vendor ships and documents the unattended features; the subscription is paid for | the clause names an API key as the carve-out; the downside of being wrong is the account, which takes the company. **OpenAI's terms are unread (403), Google's unfetched** | the founder, after one reading |
| 2 | **Is Fable 5.1 reachable on the subscription seat** | it is in the API catalogue and `fable` is a valid frontmatter value | no plan table names it; the repo's own lint does not carry `claude-fable-5-1` | one measurement, then the founder |
| 3 | **Haiku 4.5 retires from 2026-10-15** | nothing of ours defaults to it | `/goal`'s evaluator and the classifier do, by vendor default | the founder, on a dated review |
| 4 | **`LICENSE-CONTENT` in the skills upstream** | one fetch clears it and unlocks 2,111 skills | until read, no bulk import; MIT covers the code, not necessarily the content | one fetch, then a decision |
| 5 | **Install Codex and run the headless rehearsal** | day one is the founder's instruction; three families is the strongest vendor independence | #19945 is open with no maintainer reply; the rehearsal may fail | the founder, then the measurement |
| 6 | **Authenticate `gemini`** | a second family at zero marginal cost; 60 rpm / 1,000 rpd free | it has sat unauthenticated since it was installed | the founder, one terminal act |
| 7 | **Turn on agent teams** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | it is the substrate for mission control page 2, and it ships | experimental, off by default, no nested teams, ~7x tokens in plan mode | the founder |
| 8 | **The managed settings file** | the only tier a running process cannot clear | a founder act on a machine-wide file, and v11's hook trade rides on it | the founder, then the probe |
| 9 | **Does a card launch a team** | it is the founder's page 4, verbatim | **no prior art anywhere**; every board-to-session project maps one task to one agent | decided by the founder; built by us either way |
| 10 | **The 3D graph extractor** — build it, since nothing found reads a repository into a graph | the renderer is MIT and free | the extractor is entirely ours and the least-researched area | the founder, on appetite |
| 11 | **The second human** on statutory obligations | cheap now, impossible in the moment it is needed | a trust and credential decision | the founder |
| 12 | **Which room** — Generative Agents `demo` (Apache 2.0, cold) or AI Town (MIT, alive, needs Convex) | the cheapest read-only display | a living project if the founder wants it maintained | the founder |
| 13 | **The first venture** and its rung-1 anchor | adoption is the intake this founder uses most | the harness is the only venture whose anchors already exist | the founder |
| 14 | **Fourteen agents is inside an unoccupied band** | the founder's decision, taken with the evidence | running rosters are 5–6 everywhere it was measured | **decided; reopened only by name** |

---

## J · Losing-images ledger — additions

Kept by name so each can be argued for later. Five are the founder's overrules; the rest are moved by research.

1. **Three shapes — maker · scout · checker — with loadouts per run** (FINAL row 6 → v1).
2. **Labels, not names; no registry of personalities; a run labelled by what it makes and which window it
   burns** (row 8 → v2).
3. **`keel/holding/skills/` — the 134 moved whole into a directory read by nothing** (row 10 → v3).
4. **Five Balcony views over one state, and the room that is never a control** (row 15 → v4).
5. **Codex admitted only after a headless rehearsal passes** (row 30 → v5).
6. **One artifact designed and built by one agent** (→ v7's contract-as-artifact seam).
7. **The builder's own tests as the only anchor** (→ v8's blind tester).
8. **A fully autonomous run that pauses to ask** (→ v9; the mode denies the ask).
9. **A managed settings file that locks hooks** (→ v11; it would kill `/goal`).
10. **`/loop` as the always-on tier** (→ v12; the Watch is the loop).
11. **One dispatch mechanism for everything** (→ v13; three, each for what it is documented to do).
12. **"Nothing is only informational" read as refusing a dashboard** (→ v14; admitted, every number taps).
13. **n8n and Flowise as canvas substrates** (→ v15; licence and archival).
14. **vibe-kanban as the board reference** (→ v16; sunsetting, Symphony replaces it).
15. **Importing 2,111 skills on an MIT badge** (→ v17).
16. **The SKILL.md spec's recommended step-by-step body** (→ v18).
17. **"Ninety days uncalled and it leaves"** (→ v19; nobody ships usage-based retirement).
18. **A Haiku executor tier** (→ v20; retirement 2026-10-15).
19. **Fable as anyone's default** (→ v21).
20. **One rolling five-hour window as the whole physical fact** (→ v22; there is a weekly one too).
21. **`--max-budget-usd` as a spend control** (→ v23; it is a stall fuse).
22. **FINAL §10.1's Letta attribution** (→ v25; the vendor page no longer supports it).
23. **A plan-critique pass the same run performs on itself** (→ v30; measured as harmful).
24. **`script -qfc` around every Codex child** (→ v32; incompatible with parallel jobs).

---

## K · The section plan for the builders

Twenty-four sections. Each names the SPINE rows it must obey and the FINAL sections it inherits. **A section may
not decide anything not in §A; if it needs a decision that is not there, it returns BLOCKED to the Operator.**

| § | Section | SPINE rows it obeys | Inherits from FINAL |
|---|---|---|---|
| 0 | **What it is** | v1, v4, and the founder's purpose paragraph verbatim | §0 |
| 1 | **The decisions** | §A entire, reproduced, plus FINAL §1's carry-forward numbers | §1 |
| 2 | **Direction** — intents, obligations, done-tests | v29; §B.2 `product` | §2, §3 |
| 3 | **The Operator** | §C entire; v9, v10, v13 | §6, §7.5 |
| 4 | **The Watch and the Desk** | v12 (`/loop` refused), v22 (two windows), v23 | §3, §5 |
| 5 | **The roster** | §B entire; v1, v2, v6, v7, v8, v31, v33 | §7 (as the losing image and as the surviving four rules) |
| 6 | **A Run, end to end** | v12, v13, v34; §C.1 bands | §6.2, §6.3, §7.8 |
| 7 | **Skills** | §E entire; v3, v17, v18, v19 | §11, §16.2 |
| 8 | **Tools and MCPs** | §F entire; v15, v33 | §9.3, §16.3 |
| 9 | **Models** | §G entire; v20, v21, v22, v23 | §5, §14.5, §15.3 (**with §15.3's coefficients corrected**) |
| 10 | **Codex and Claude Code** | §H entire; v5, v11, v12, v32 | §1 row 30 (losing image), §16.7 |
| 11 | **Truth** — anchors, the ladder, rehearsal | v8, v30; §B.2 anchor column | §8, §7.6 |
| 12 | **Control** — envelope, permissions, the Sender | §C.1; v9, v10, v28, v33 | §9 |
| 13 | **Memory and knowledge** | v24, v25, v26, v27; §E | §10, §11 |
| 14 | **Mission control** | §D entire; v4, v14, v15, v16 | §13 (Floor and Balcony absorbed, not deleted) |
| 15 | **Runtime and the Mac** | §D.1, §D.2; v13's constraints | §14, §16.7 |
| 16 | **Economics** | §G.2, §G.3; v22, v23 | §15 |
| 17 | **The inventory** | §B.2 (fifteen files), §D (seven pages), §E, §F, §G.1 | §16 — every table re-decided against the roster |
| 18 | **What exists and its fate** | v1 (the eighteen agent files become fifteen, not three), v3 | §17 |
| 19 | **Build order** | every ABSENT path named in §B–§H | §18 |
| 20 | **Open decisions** | §I entire | §19 |
| 21 | **How we would know it worked** | §B.2 anchor column; v6, v31 — the roster's own claim is falsifiable | §8, §12 |
| 22 | **Losing images** | §J entire | §1 |
| 23 | **Coverage** — every founder-list item placed or refused | §B.4 for §23–§30; the rest against §A | COVERAGE.md as a floor, not a frame |

**Discipline every section carries:** provenance on every paragraph (FOUNDER · FINAL · NEW: why) · every rule
names its mechanism or is marked WISH · every path exists on a named branch or is marked ABSENT · no stage
states method · no schedule and no durations · the founder's words quoted wherever they decide something ·
anything not in the inputs marked UNVERIFIED.
