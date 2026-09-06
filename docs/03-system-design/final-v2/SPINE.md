# SPINE · the decision spine of final plan v2 · 2026-09-05 · rethink round 2026-09-06

```
what:       the row set every v2 section-writer writes from, so that twenty sections cannot disagree — carrying,
            since 2026-09-06, the rethink round: the founder's sixteen decisions and one deletion (§A v66–v82),
            the eighty mechanisms the orchestrator decided (§L), the thirty-two world facts that moved a row with
            no decision attached (§M), and the twenty-six questions nothing can be decided without (§N)
binds:      the founder's direction of 2026-09-05 (docs/08-agents_work/handoffs/2026-09-05-THE-PLAN-NEXT-TEAM-PROMPT.md,
            branch ceo-3-1788468144) — where it contradicts FINAL-PLAN.md, the founder wins, the cost is stated once
            in one line, and the chosen thing is then built properly. Never re-litigated
base:       final/FINAL-PLAN.md (branch ceo-3-1788468144) stands wherever the founder did not overrule it and no
            research fact overturns it
inputs:     final-v2/DECISIONS.md · final-v2/research/{roster,surfaces,runtimes,skills,cognition,memory,models}.md
            · final-v2/rethink/SYNTHESIS.md · final-v2/research/world.md (this branch, ceo-1-1788609834)
rule:       every row carries FOUNDER · FINAL · NEW: why. Every rule names the mechanism that enforces it or is
            marked WISH. Every path exists on a named branch or is marked ABSENT. No stage states method. No
            schedule, no durations. Anything not in the inputs is marked UNVERIFIED
not:        a build plan. Nothing here is built, installed, spent, published or pushed
```

---

## A · §1-v2 — the decisions table

Eighty-two rows. Rows **v1–v5** are the founder's overrules of FINAL §1. Rows **v6–v53** are places a research
fact moves a FINAL row, or a place FINAL stands *because* a fact was checked against it. Rows **v54–v65** are the
founder's answers in the interview of 2026-09-05 (DECISIONS §15), each a decision and not an argument. Rows
**v66–v82** are the **rethink round of 2026-09-06**: v66–v81 are the founder's sixteen decisions on
rethink/SYNTHESIS.md §1, asked in four rounds and answered with the recommended option on all sixteen
(DECISIONS §18), and **v82** is the one deletion the founder took (DECISIONS §19). The losing image is kept by
name in every row and collected again in §J.

**What the rethink round did NOT do.** No founder row was reversed. v66–v81 move the *implementation* of a
founder row where they touch one and say so. The round's other three products are not §A rows and are kept
apart on purpose: **§L** the eighty mechanisms the orchestrator decided, each following from a rule already on
this page or from a measured fact; **§M** the thirty-two world facts that moved a row with no decision
attached, applied in place to the rows they move; **§N** the twenty-six questions that must be answered before
the thing they gate can be built.

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
| **v10** | The widest permission mode | **`bypassPermissions` is refused, by a mechanism** — `permissions.disableBypassPermissionsMode: "disable"` in managed settings, where a running process cannot clear it | **NEW:** cognition.md — deny rules bind in every mode including bypass; allow rules have no effect in it. **(moved 2026-09-06: W7)** the managed setting is **no longer the only thing standing there**: `--restricted` *"refuses `bypassPermissions`"* by itself (world.md 7), so the refusal has two carriers, one in argv and one in a file a running process cannot clear | `--dangerously-skip-permissions` and its successors as a night default |
| **v11** | The managed settings file, now that `/goal` exists | **The managed file carries `permissions.deny`, `disableBypassPermissionsMode` and `disableAutoMode`, and does NOT set `disableAllHooks` or `allowManagedHooksOnly`** | **NEW:** runtimes.md — *"`/goal` is a wrapper around a session-scoped prompt-based Stop hook"*, and it is unavailable under either of those two settings. **The cost, once:** a run can therefore register its own Stop hook. That is a smaller hole than losing the goal loop the founder asked for, and the probe checks it nightly. **(moved 2026-09-06: W7)** on the `-p` carrier the managed file has **less to carry than this row assumed**: `--restricted` *"ignores user, project and local settings files"* (world.md 7), so argv alone decides more there — independent support for §L **O37**, which deletes the project-`settings.json` tier of grants outright | a managed file that locks hooks; FINAL §7.5's premise that the managed file is where every narrowing goes |
| **v12** | Where loops and goals sit | **`/goal` sits on the run: the done-test IS the goal condition**, with a turn clause. **`/loop` is refused in production** and stays a Floor convenience | **NEW:** runtimes.md — `/goal` runs headless in one invocation (`claude -p "/goal …"`), condition limit 4,000 chars, bounded by *"or stop after 20 turns"*. `/loop` is *"session-scoped"*, has a 7-day expiry, and *"Tasks only fire while Claude Code is running and idle"* — the Watch is the loop. **(moved 2026-09-06: W14, W31, W13, W15 — and this is the sharpest fact of the round.)** ~~Check-ins start at 30 minutes and double to a 4x ceiling~~ is superseded: they back off **30 min → 1 h → every 2 h**, and *"idle sessions … start at most three check-ins on long-running background work per goal; your next message allows three more"* (world.md 14). **Under `-p`, check-ins are the only way the runtime delivers anything, and nobody is there to message it** — so a night goal loop delivers three times and then goes quiet. Beside it, the vendor's own measurement: the **99.9th-percentile turn duration is over 45 minutes** (world.md 30b, W31). **Those two are the measured unattended ceiling that fully autonomous mode (§C.2) is designed above, and the row states it rather than discovering it. The answer this row now carries is §L O21 + O15:** O21 makes the goal condition an **exit code** (`<anchor>` exits 0, and the done-test) so the three deliveries are judged by a program rather than by prose, and **O15**'s wake reconciler is what notices a run that went quiet — writing `orphaned`, never `finished`, then resuming by id or closing with a reason. **W13:** `/schedule` is a **fourth** scheduling surface inside the CLI and its semantics are UNKNOWN (the doc page returned HTTP 404) → **R25**. **W15:** `/loop` gained a self-paced dynamic mode and an autonomous default — the **losing image got stronger, not the decision**; it is still session-scoped and still refused | `/loop` as the Watch; a cron inside a session as the always-on tier |
| **v13** | How the Operator dispatches | **Three mechanisms, each for what it is documented to do:** agent teams for the *visible* fleet the founder watches; subagents for depth inside one agent; `claude -p` children through the launcher for unattended night work | **NEW:** surfaces.md (teams are a lead plus named teammates, each a full session, with tmux pane ids on disk) and runtimes.md (subagents: depth 3, 20 concurrent, `Workflow` removed from all of them; `-p` never forms a team). **The constraint, stated once:** teams are experimental and off by default, **no nested teams**, one team per session, `/resume` does not restore them — so the child-flow page shows one level of teammates and the deeper tree is subagents. **(moved 2026-09-06: W11, W20)** three dispatch mechanisms are no longer the whole picture: **a channel between sessions that are already running now ships on both providers** — `SendMessage`/`ListAgents` across sessions on one machine, with an inbox socket that closes a connection sending no complete line within 30 seconds (world.md 11), and Codex `@` task mentions (world.md 20). **§C.4 gains a fourth row, and what a message may be is v80** | a single dispatch mechanism; a hierarchy of teams of teams |
| **v14** | The cost dashboard against *"nothing is only informational"* | **The dashboard is admitted, and every number on it names the tap that acts on it** — a cost row taps to its run, a window row taps to retempo, an anomaly taps to the cord | **FOUNDER** (*"cost and tokens, efficiency, monitoring, and a dashboard"*) + **NEW:** surfaces.md 6 states the collision as two positions, not a resolved question. This resolves it by keeping both | FINAL §13.2's Balcony table with no dashboard row |
| **v15** | Which canvas and graph substrates are admissible | **Admitted: Langflow (MIT, alive 2026-09-05) as the canvas idiom; `3d-force-graph` (MIT) as the renderer. Refused: n8n (Sustainable Use — *"only for your own internal business purposes or for non-commercial"*), Flowise (ARCHIVED, licence NOASSERTION), Gource (GPL-3.0)** | **NEW:** surfaces.md licence table, n8n's LICENSE.md read raw | n8n as the workflow surface; Flowise as the canvas |
| **v16** | The board→session prior art | **OpenAI Symphony (Apache-2.0, last push 2026-08-19) replaces vibe-kanban as the reference.** vibe-kanban's own README now reads *"Vibe Kanban is sunsetting"* | **NEW:** surfaces.md 4, 5. **The gap that is ours to build:** *"Nothing found gives a card a team"* — every board-to-session project maps one task to one agent | FINAL §13.8's refusal of vibe-kanban as an unmaintained runtime — right conclusion, weaker reason |
| **v17** | Bulk import of the 2,111-skill upstream | **Blocked until `LICENSE-CONTENT` is read.** The code is MIT; a **separate `LICENSE-CONTENT` file exists and was not fetched**, and it may carry different terms for skill *content* than MIT does for code | **NEW:** skills.md licence table and gap 3. Cheap to clear, one fetch; until then no bulk vendoring | importing 2,111 skills on the strength of the repository's MIT badge |
| **v18** | The SKILL.md procedure collision | **The container is the open standard; the content rule is ours.** Four admissible bodies — anchor · exemplar · rehearsal case · reference. A **step list is admitted in exactly two places** (v51 widened v18 from one): a checklist the Sender reads aloud, where the judge is absent and the act cannot be taken back, and the curator's five fixed questions | **NEW:** skills.md — the published spec recommends *"Step-by-step instructions"*, and FINAL §11 forbids procedure, so *"different artifacts wearing the same filename"*. FINAL §9.4's quadrant already decided where procedure is legitimate. **The cost, once:** an imported skill written to the spec's recommendation fails our admission and needs a pass | FINAL §11's flat refusal of the library; the spec's recommended body as written |
| **v19** | Skill retirement | **By forced expiry.** Every skill carries `valid_until`; at expiry exactly one disposition is recorded — Refresh, Deprecate, or Waive with a new date | **NEW:** skills.md 20 — *"Nobody found retires a skill by non-use"*; the nearest shipped thing is dead-link and drift detection. **Mechanism:** `scripts/ledger.mjs` already forces this disposition and `check-citations.mjs` already blocks on a dead path — both on this branch | *"Ninety days uncalled and it leaves"* — a usage counter nobody in the world has shipped |
| **v20** | The cheap tier | **No agent's default model is Haiku.** Haiku 4.5 appears only where the vendor sets it (the `/goal` evaluator, the auto-mode classifier). The genuinely cheap work goes to **local models on electricity** | **NEW:** models.md 5 — Haiku 4.5 retirement *"Not sooner than October 15, 2026"*, six weeks out, and it is the only Haiku in the published table. Locals: MiniLM 384-dim and Qwen3-0.6B, both Apache 2.0 | a Haiku executor tier; FINAL §16.7's *"local models: no shape"* read as *no work* |
| **v21** | Where Fable 5.1 sits | **An escalation, not a default.** One named rule: an intent whose done-test has failed twice under Opus 5 and whose horizon exceeds one window. **Its availability on a subscription seat is UNVERIFIED** — models.md publishes its API price and no plan table names it; fallback is Opus 5 | **NEW:** models.md — Fable 5.1 cache reads at **0.025x** base input against 0.1x everywhere else, which is what makes a large standing context cheap to re-read; the SWE-bench Pro ranking is third-party, confidence L, and is **not** used to route | Fable as the builder's default; wshobson's tier 0 adopted as-is |
| **v22** | The window | **Two windows, not one: a rolling five-hour AND a weekly, per seat, shared with Claude chat and Cowork.** And two limit shapes that behave differently — a seat limit cannot be escaped with `/model`; a model-family limit can | Moves **FINAL row 19**, which knew only the five-hour fuse. models.md, quoted from the vendor's costs page. **Consequence:** the reserve is per window *and* per week, and a weekly exhaustion is a different event from a five-hour one. **(moved 2026-09-06: W4, W26)** part of the window is machine-readable now — a `rate_limits.spend_limit` status-line field, a Spend limit bar in `/usage`, a per-loop breakdown and a `prompt_cache` object (world.md 4) — so **v74**'s gauge reads vendor fields where they exist and computes only the rest; and Google states a **second reason** for v6 that lands on this row: *"parallel subagents … consume the rate limit faster"* (world.md 26), which makes fan-out a window decision and not only a correctness one | one rolling five-hour window as the whole physical fact |
| **v23** | `--max-budget-usd` | **Not a billing control.** Print mode only, computed locally from token counts at list price, and *"the session cost figure isn't relevant for billing purposes"* for subscribers. It is a **stall fuse**, and it is kept for that | Moves **FINAL §7.5** and closes half of **§19.11**. models.md. Still true and still useful: subagent spend counts toward it, and overflow fails a spawn with `Budget limit reached` (v2.1.217+). **(moved 2026-09-06: W5)** the arithmetic changed — cost estimates *"now include the 1.1× US-only-inference premium for data-residency workspaces"* (world.md 5): still a local estimate, now with a residency multiplier, which is one more reason **v74** denominates a ceiling in window share and keeps USD as a shadow price | a per-run dollar ceiling that binds the account |
| **v24** | Memory writes | **Delta-only, never a rewrite** — FINAL row 11 stands and is now sourced | **FINAL, now cited:** memory.md 1 — the paper is **ACE, arXiv 2510.04618**: context held 18,282 tokens at 66.7% accuracy, collapsed at the next step to **122 tokens and 57.1%**, below a 63.7% baseline | a nightly full rewrite of the memory files |
| **v25** | Who writes memory | **The curator, and only the curator** — the thing that acts never edits memory. FINAL stands, **with its counter-example named** | **FINAL**, against memory.md 3: Claude Code's own auto memory *is* written by the acting agent, in-session. That is one shipped counter-example, and it is accepted as a counter-example rather than hidden. **Mechanism:** the curator's grant is the only one whose writable scope includes the memory paths | shared memory writes by every agent; FINAL §10.1's Letta attribution, which memory.md 2 shows the current vendor page no longer supports |
| **v26** | Transcript mining | **Stands.** No tool was found that mines a transcript archive into taste, negatives or already-built; three tools read the corpus and render it for humans | **FINAL**, confirmed by memory.md 4. **The caveat that binds the build:** *"The entry format is internal to Claude Code and changes between versions"* — so mining is a batch pass over a snapshot, never a live parser in the critical path | a live transcript reader as a system dependency |
| **v27** | The shape of the memory index | **Two tier: an index loaded at start, topic files on demand** — and it is now the vendor's own default, not a local invention | **NEW:** memory.md 6 — Claude Code loads *"the first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first"* and topic files on demand. Same shape this repo already built for skills discovery | a single flat memory file loaded whole |
| **v28** | The permission axis | **Reversibility. FINAL row 12 stands, and it stands alone in the world** | **FINAL**, against cognition.md — *"neither shipped scheme does"*: Claude Code keys on a fixed path list plus an action class, Codex on workspace scope plus network. The nearest shipped analog is the classifier special-casing `rm`/`rmdir` on critical paths | keying `may-alone` on file path, as both shipped runtimes do |
| **v29** | The read-back | **Stays.** No shipped system mandates a restatement before work binds; Linear's 10-second `thought` acknowledges rather than confirms | **FINAL**, cognition.md 10 — unsupported *and uncontradicted*. Closed-loop readback is regulation in aviation and medicine | voice or a chat message binding an instruction directly |
| **v30** | Why `challenger` is an agent and not a step | **Because self-critique without external feedback is measured as harmful** — *"at times, their performance even degrades after self-correction"* (arXiv 2310.01798). Reflexion's 91% is not a counterexample: its feedback is external | **NEW:** cognition.md 5, 6. **Mechanism:** the challenger never reads the artifact's author's reasoning, only the artifact and its done-test; a second model family whenever one is reachable | a plan-critique pass the same run performs on itself |
| **v31** | The roster size, and its cost | **Fourteen plus the Operator.** The cost, stated once and not re-litigated: **every shipped running roster verified is 5–6 agents; every roster of 150+ is a catalogue you pick from. Ten to fifteen sits in a band nobody publishes evidence for, in either direction** | **FOUNDER**, cost from roster.md 5. It is an unoccupied band, not a refuted one — no source was found for a measured point at which adding specialists stops paying | Magentic-One's five; ChatDev's six; Anthropic's 3–5 concurrent subagents |
| **v32** | Codex's position on day one | **Checker on a prepared diff, in the foreground, stdout redirected to a file while inheriting the parent shell's TTY.** The **headless rehearsal is what widens it**: `codex exec --json`, no controlling TTY, non-trivial prompt, ~~version ≥ 0.124.0~~ **(moved 2026-09-06: W19)** — **the installed version, recorded**: Codex is at **0.153.4 (2026-09-04)**, so the old floor is 29 minor versions stale and is satisfied by anything installed, which means it no longer discriminates | **FOUNDER** (day one) + **NEW:** runtimes.md — #19945 open **130 days with no maintainer reply**, and its `script -qfc` cure is *"incompatible with normal background / parallel job execution"*. **The cost, once:** one foreground slot is not parallel, so Codex is not a night lane until the rehearsal passes detached. **(moved 2026-09-06: W24)** four weeks of Codex release notes (2026-08-26 → 2026-09-04) mention no `codex cloud exec`, no cloud API, no cancel or poll, no goal mode and **no #19945** — so **this row stands, and so does v56(b)**. Record it as what it is: **absence is not denial**, the June–August window is unread (three fetch failures), and reading it is **R26**, the only cheap route to **R10**. One correction that cuts the other way: 0.152.0 adds credential-refresh progress to `codex exec`, which **adds output to the stream this row depends on being clean** | Codex as a full maker on night one; `script -qfc` wrapped around every child |
| **v33** | The trifecta split, inside a roster | **Survives intact.** The agent that reads the untrusted world (`scout`) holds no credential and cannot send. The agent that drafts an outward act (`writer`, `growth`) never holds the key. The thing that sends is **the Sender, a program with no model** | **FINAL** row 7, and cognition.md finds *no shipped analog* for staged-not-sent or a recall window anywhere | a research agent with a send verb; one agent that reads mail, decides and replies |
| **v34** | What makes a grant real | **The exact argv, emitted by one no-model launcher**, plus the managed file of v11, plus a nightly probe that asserts what a run can actually touch | **FINAL** §7.5 and row 13, unchanged. **Mechanism:** `bin/run` is the only thing that composes argv (ABSENT); `bin/probe` asserts it nightly (ABSENT). **(moved 2026-09-06: W9)** one narrowing arrives free: `--add-dir`, `/add-dir` and `additionalDirectories` now *"refuse network paths (UNC shares, `/net/<host>` automounts) … before touching them"* (world.md 9), so a grant composed here cannot point at a share | `--allowedTools` as a narrowing; a prose rule describing a grant |
| **v35** | `Workflow` in an agent's tool line | **Absent from every agent, deliberately.** The gate may not be invocable by the thing it gates | **FINAL / this repo**, now **independently cited**: runtimes.md quotes the vendor — *"The `Workflow` tool is removed from all subagents via the first filter applied to subagent tool sets"* | granting a dispatched engine the ability to run its own gate |
| **v36** | Who may hold a tainted read | **`scout` only, and the world's door program.** Gmail, Calendar, Drive and Notion reads are tainted READ-ONLY (§F); no agent that holds `Write`, `Edit` or `Bash` reads them raw. `steward` writes obligations from `scout`'s handover; the world's door writes one inbound row per event and holds no model | **FINAL** §9.4–9.5 and v33, applied to a collision builder 2 found between §F and §B.2 row 12 — one grant, two rules. Decided by the orchestrator 2026-09-05, DECISIONS.md §8 | a steward that reads mail with a pen in its hand |
| **v37** | The brief, now that agents have names | **Ten fields: FINAL's nine plus `agent:` — the roster name the launcher composes argv for.** `window+model:` stays as it is; the agent's row in §B.2 supplies its defaults and §G.1 overrides per move | **NEW:** fourteen named agents make "which agent" a fact the brief must carry, and neither reading was in §A until builder 1 asked (BLOCKED, §6). Chosen because it leaves FINAL's nine fields untouched. **Mechanism:** `bin/run` refuses a brief whose `agent:` is not a roster file (ABSENT) | `agent+window+model:` as one widened field; a brief that names no agent and lets the launcher guess |
| **v38** | Where the read-back and the briefing live among the seven pages | **The read-back is the intent-creation form wherever an intent is born** — page 4's "new card" and page 7's "add session" — **and stays a published phone page** for voice. **The briefing is the top strip of page 5 (engines · how it works) and stays a published phone page.** `Decide` items appear on page 4 as cards in a "waiting on you" column and on the phone | **NEW:** builder 4 found FINAL §2.4's read-back page and §13.4's briefing unplaced in §D. Placement, not a new mechanism: both were already published pages (FINAL §13.10, the artifact runtime), and the founder's pages absorb rather than delete them (v4). **Mechanism:** the store check refuses an intent with no read-back confirmation row (ABSENT) | a read-back page as an eighth page; a briefing nobody can reach from mission control |
| **v39** | What hosts the website | **Mission control is served on the Mac by `mission-control/` — the Bun + Hono server and React client that exist on this branch (60 files) — because a terminal pop needs `tmux` on the same machine.** The phone reaches it two ways: the published artifact pages (Balcony views, briefing, read-back) for reading and deciding, which cannot pop a terminal; and the local server over the founder's own network for everything else | **NEW:** builder 4 — the artifact runtime *"cannot reach tmux"*. FOUNDER: *"everything is run on it"* [the Mac]. FINAL §17 marked `mission-control/` ABSORBED; v4 un-absorbs it as the seed. **Cost, once:** two renderers over one state, which FINAL §13.1 refused — accepted because a tap that opens a terminal cannot come from a hosted page, and both read the same logbook | the website hosted as a published artifact; a cloud host that reaches into the Mac |
| **v40** | `maxTurns` for the roster files that have no seed | **30 for the nine that produce** (builder, architect, tester, designer, product, writer, growth, steward, curator) **and 25 for the five that only read** (reviewer, guard, scout, analyst, challenger); **the Operator 30**. Tuned per agent by measurement afterwards | **NEW:** the seven existing engine files use exactly these two values (30 producing, 25 framer and sourcer), `maxTurns` binds when an `agentType` is named, and the lint ceiling is 120 — CLAUDE.md, this branch. A default that copies the measured seeds is a starting point, not a design | one cap for every agent; no cap |
| **v41** | `isolation` for the agents that write | **`worktree` for the four that touch venture source** (builder, architect, tester, designer); **`none` for the five that write only into the house's stores** (product, writer, growth, steward, curator) — their grant is a narrowed `--add-dir`, not a checkout; **`none` for the six that do not write** | **NEW:** builder 4 asked. FINAL §6.1: a worktree is for a run that writes code or files of the venture; a store write is narrowed by argv (v34). **Cost, once:** `git worktree add` still cannot complete under the armed sandbox without escalation (CLAUDE.md, measured 2026-08-24) | a worktree for every agent; no isolation for the four that edit source |
| **v42** | Where the fifteen agent files and their argv live | **Agent files in `.claude/agents/<name>.md` — the path the runtime reads and the `PS-*` lint globs. The per-provider argv files live in `keel/shared/argv/<agent>.<provider>.argv`.** `keel/agents/` does not exist | **NEW:** challenge A P1-1 — two homes, one unread by the runtime. **Mechanism:** the census of §19.2 fails a second path for one artifact | `keel/agents/<name>.md` beside its argv |
| **v43** | What carries the grant on each dispatch mechanism | **Three carriers, one per mechanism, and a claim is made only where its carrier can hold it:** `claude -p` children — the exact argv (`--restricted --tools … --add-dir …`); subagents — the agent file's `tools:`/`disallowedTools:` plus managed-settings `permissions.deny` rules, and nothing path-scoped that those cannot express; agent teams — the teammate's agent file plus the same managed denies. **Unattended night work runs only on the `-p` carrier.** The tester's blindness (v8) and the builder's exclusion from the architect's paths (v7) are argv facts on the `-p` path and are `permissions.deny` `Edit(<path>)` rules on the other two, **UNVERIFIED** until the probe asserts them | **NEW:** challenge A P1-2 — the plan asserted argv for mechanisms that have none. **Mechanism:** a grant matrix (mechanism × narrowing) in §12, asserted per row by `bin/probe` (ABSENT). **(moved 2026-09-06: W8)** the carrier this row said it could not name **now exists for reads**: `permissions.blockReadsOutsideWorkingDirectories` (world.md 8) is a *read* narrowing expressible in settings, which is exactly what the tester's blindness (v8) and the builder's exclusion from the architect's paths (v7) need on the subagent and team mechanisms. It stays **UNVERIFIED** until `bin/probe` asserts it, and until then §L **O28** routes `tester` and `challenger` on the `-p` carrier only | "the grant is the argv" said of a teammate |
| **v44** | Who writes `obligations.yml` | **The Watch, alone** (FINAL §2.3, §16.4). `steward` writes **proposals** into `keel/ventures/<v>/obligations-draft/` from `scout`'s handover; the Watch materialises a proposal into a row after the store check | **NEW:** challenge A P1-3 — two writers under "one writer each". **Mechanism:** `bin/check-stores` refuses a store whose declared writer is not the only grant carrying `Write` on that path (ABSENT) | steward writing the store directly |
| **v45** | The brief's field count | **Eleven: FINAL's nine, `agent:` (v37) and `anchor:`** — the rung-1 check the done-test names, required, and `bin/run` refuses a brief without it | **NEW:** challenge A P1-4 — ten in §6, eleven in §3 and §11. **Mechanism:** one schema file `keel/shared/schemas/brief.yml` (ABSENT) that the prose tables are generated from | ten fields with the anchor implied |
| **v46** | The Operator's runtime position | **The Operator is the founder's interactive session, started as `claude --agent operator`, so one agent file governs it AND it can form the agent team page 2 draws.** It is inventoried as a file and runs as the main session; whether `--agent` binds the file's `tools:` at top level is **one measurement, UNVERIFIED**, and until it passes the no-`Write` guarantee is held by managed `permissions.deny` | **NEW:** challenge A P1-5 — a dispatched file cannot form a team; a bare main session is not the inventoried object. **Mechanism:** `scripts/probe-workflow-reach.mjs`'s pattern pointed at team formation (ABSENT) | an Operator dispatched as a subagent; an Operator with no file |
| **v47** | Who runs the reconciliation | **`bin/reconcile`, a program with no model, computes every comparison and writes the result rows; `analyst` reads the mismatches and drafts the Decide item.** The rung is the program's | **NEW:** challenge A P2-12. **Mechanism:** a lint failing a job named both in the no-model list and in an agent's routing line | an analyst that does the arithmetic |
| **v48** | Where the skill directories live | **At the house's repository root only** — `.claude/skills/` and `.agents/skills/`, generated from one Markdown source. Ventures carry no skill directory; skills are not per venture | **NEW:** challenge A P2-13 | skills under `ventures/<name>/` |
| **v49** | Whether `bin/skill` dispatches | **It does not.** The skill creator is a routing rule the Operator follows (scout → product → curator) plus one program, the eval runner `bin/skill-eval` (ABSENT). Only the Operator dispatches | **NEW:** challenge A P2-14. **Mechanism:** the ledger refuses a run id not minted by `bin/run` on the Operator's behalf | a program that dispatches four agents |
| **v50** | ABSENT versus WISH | **ABSENT: the mechanism is designed and its path is named; it is not built. WISH: no mechanism is designed.** A rule whose only mechanism is ABSENT is written in the present tense and is not a WISH | **NEW:** challenge A P2-19 — the two marks were used for one state. **Mechanism:** a lint over the document's marks (ABSENT) | ABSENT and WISH interchangeable |
| **v51** | The curator's five fixed questions | **Admitted as the second legitimate step list**, beside the Sender's checklist, on the evidence FINAL §10.7 cites (0 of 121 free reflections named the cause). v18 now reads "two places" | **NEW:** challenge A P2-20 | one place, with the five questions smuggled in |
| **v52** | Who writes a card | **The founder's door writes the card** — the read-back form (`bin/intend`, ABSENT) creates the card with its intent id; `bin/run` writes only the session id when a card is dragged | **NEW:** challenge A P2-21. **Mechanism:** `bin/check-stores` fails a card store row with no creating writer | a card with no writer |
| **v53** | How an eighth page is admitted | **Through a door, like a tool.** A new mission-control page is proposed against an intent, declares what it reads (the logbook and nothing else unless the door admits more), what each tap launches, and its licence read from the file; the same §9.3 door, with "every element is a fact or a tap" as its extra test | **NEW:** challenge A opinion O-1 — the founder said *"and a lot more cool and important things"* and the plan built a door for tools and none for surfaces. **Mechanism:** `bin/door` accepts `kind: page` (ABSENT) | seven pages as a ceiling |
| **v54** | The roster's first wave | **Eight agents first — the Operator, builder, reviewer, architect, tester, guard, scout, designer — the ones with a seed file or a code path today. The six business agents (product, analyst, writer, growth, steward, curator) and the challenger come online when a venture needs them.** All fifteen files stay in the inventory; §19 draws two waves | **FOUNDER** (interview 2026-09-05, DECISIONS §15): *"Start with the eight that have seeds or code paths"*. **The cost, once:** wave one has no `challenger`, so a plan about to bind is attacked by `guard`'s adversarial review and the founder's own read until wave two; and wave one has no `product`, so done-tests are written by the founder through the read-back | fifteen files on day one |
| **v55** | Standing jobs — the company working on a cadence or an event | **A standing intent: an intent that never expires, carrying `every:` (a cadence) or `on:` (an inbound event class), dispatched by the Watch's tick to the agent its kind routes to; outputs stage, never send.** Customer support → steward from inbound rows · leads → growth · research and competitor watch → scout · security → guard · data analysis → analyst. **No new agents** | **FOUNDER**: *"agents like: customer support, marketing agents: leads, research, security, competitors, data analysis and more that can run every set time or event … to build the company like working"*; chose *"Standing intents with a cadence or trigger, run by the Watch"*. **Mechanism:** the intent schema gains two optional fields; `bin/watch` reads them (ABSENT); `bin/check-stores` refuses `every:` without a ceiling per run (ABSENT) | per-agent cron in each agent file; a schedules page; a scheduler beside the Watch |
| **v56** | Work when the Mac is off | **A cloud lane exists, and FINAL's *"everything runs on the Mac"* gets one stated exception. Its position today, from research/cloud.md:** (a) **Codex cloud is admitted as a PR reviewer** — `@codex review` on a pull request, or automatic review on PR open, is vendor-documented, needs no local Codex, runs in OpenAI's sandbox, and so **sidesteps #19945 entirely**; (b) **Codex cloud as a maker is UNVERIFIED** — no vendor page prints a non-interactive command or an endpoint to create a cloud task; `codex cloud exec --env <id>` appears only in an open feature-request issue (#24777) as the author's claim about the binary; (c) **the documented off-Mac maker paths are Anthropic's** — `claude --cloud "<task>"` (argv, an isolated VM, clones the GitHub remote, `--teleport` pulls the session back) and Routines with an API fire endpoint and a one-hour floor — **and Google's Jules API (alpha)**. Which of these the crew may use for making is **§I row 15, the founder's**, because it is the terms question again (§I row 1, open by the founder's word). **Mechanism, orchestrator's, reopenable:** a hosted run's output lands as a pull request or a staged artifact the Mac reconciles on wake — never into the house directly; `bin/run` gains a `cloud` carrier that only mints a task and records its id (ABSENT); the Watch on wake reads the PRs (ABSENT) | **FOUNDER**: *"When my Mac is not on … you can use codex or Gemini … But still keep it open"* → *"Yes — a cloud lane for when the Mac is off"*, research on **Codex cloud tasks** only. research/cloud.md, five parts. **The cost, once:** the lane the founder named has no documented driver today, and the lanes with a documented driver run on the Claude seat whose terms clause is the open question | the Mac as the only runtime; Routines refused wholesale; Codex cloud as a full night maker on issue-only evidence |
| **v57** | Fable's position | **`claude-fable-5-1` is the default model of `builder` and `architect`.** v21's escalation rule is the losing image. Reachability on the subscription seat is still one measurement, UNVERIFIED; until it passes, the fallback is `claude-opus-5` | **FOUNDER** (overrules v21): *"Fable as builder's and architect's default"*. **The cost, once:** the two heaviest producers on the top tier burn the window fastest — offset by cache reads at 0.025x on a cache-dominated workload (§G.3) — and `scripts/prompt-standard.test.mjs` must admit `claude-fable-5-1` in the same change that writes the first agent file. **(moved 2026-09-06: W1, W2, W6, W17)** **W1** — the model shipped and the two numbers this row rests on are confirmed: *"Claude Fable 5.1 (`claude-fable-5-1`) … 1M context, $10/$50 per Mtok with $0.25/Mtok cache reads"* (world.md 1); **the subscription-seat UNVERIFIED stands**, because no vendor statement about a seat was found. **W2 — an alias trap against this row:** *"`fable` and `best` … keep resolving to Fable 5 for now … pick Fable 5.1 in `/model` to use it"* (world.md 2), so an agent file naming `fable` and one naming `claude-fable-5-1` are **not the same routing** — write the full id. **W6** — `experimental.cacheTtl` (`5m`/`1h`) is per-agent frontmatter, and TTL is what decides whether the 0.025x cache this row is justified on is warm (§B.2, §G.3). **W17** — `PreModelSwitch` can **block** a model switch (world.md 17), which is the gate that could enforce this default or v21's escalation, and no row used it | Fable as an escalation only; Fable as nobody's default |
| **v58** | The small fast model | **`ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-sonnet-5`, set now**, so `/goal`'s evaluator and the auto-mode classifier stop depending on Haiku 4.5 before its 2026-10-15 retirement | **FOUNDER**: *"Set ANTHROPIC_DEFAULT_HAIKU_MODEL to Sonnet 5 now"*. **The cost, once:** every goal check costs Sonnet, not Haiku. **Mechanism:** the env var in the launcher's environment (`bin/run`, ABSENT) and in the managed file's `env` if it carries one | vendor defaults with an expiry row; a local model (unsupported) |
| **v59** | Agent teams | **On (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), and a teammate runs on its own agent file's model** — no Sonnet constraint | **FOUNDER**: *"Turn it on, no model constraint"*. **The cost, once:** the vendor's *"approximately 7x more tokens … in plan mode"* now applies at Opus and Fable prices for five of the fourteen; §G.1's teammate row is struck. **(moved 2026-09-06: W10, W12)** **W10 is what makes this row bind:** `CLAUDE_CODE_SUBAGENT_MODEL` now *"set[s] the default subagent model rather than override everything: an agent definition's `model:` and an explicit per-spawn model now take precedence"* (world.md 10) — before it, one env var silently flattened fourteen per-agent model choices. **W12 names the risk the founder took:** agent teams were repaired four times in the window (lost final answers, blanked transcripts, cache-missing announcements, panes surviving shutdown) and **were never promoted out of experimental**; the failure class is **lost teammate output**, which is exactly what §D page 2 renders — so page 2's census is §L **O70**'s join, not a poll of the vendor's mutable `config.json` | Sonnet teammates; teams off, subagent trees only |
| **v60** | What a card launches | **The card carries a `solo \| team` toggle, defaulted from the intent's kind** — source code defaults to the solo chain (architect → tester → builder → reviewer); anything cross-department defaults to a team led by the Operator | **FOUNDER**: *"Both: the card carries a 'solo or team' toggle"*. **Mechanism:** one field on the card store; `bin/run` reads it (ABSENT) | a card always launches a team; a card always launches one agent |
| **v61** | Page 6's place in the build order | **Last of the seven pages.** One research lane on repository-to-graph tooling before the extractor is written | **FOUNDER**: *"Build it, but last in the page order"* | page 6 beside page 2; a 2D graph first |
| **v62** | The room's renderer | **pixel-agents** (github.com/pixel-agents-hq/pixel-agents — MIT, LICENSE read from the file, pushed 2026-09-05, 9,190 stars) **is the substrate of page 1, admitted through the tool door.** It is display-only, needs no model, and already reads Claude Code — hook events (`SessionStart`, `PreToolUse`, `PermissionRequest`, `Stop`) and the JSONL transcripts under `~/.claude/projects/` — into an `AgentEvent` model; a click on an agent already opens its terminal in the VS Code surface (issue #251). **What is ours:** a writer from the event log into its `AgentEvent` model (schema not read from source — UNVERIFIED), and the browser-side terminal pop, which upstream has only as an open PR (#347). Its Fastify server runs on the Mac beside `mission-control/`. **Refused:** Star-Office-UI — code MIT but the art assets are *"禁止商用"* (commercial use prohibited), six months without a push, OpenClaw-only, no terminal; **"AgentOffice"** — the name resolves to eleven repositories, and the likeliest (harishkotra/agent-office, MIT) **needs an LLM to render**: it is a simulation the model drives and reads no agent runtime, which fails the rule that the room displays real runs. **The founder can settle the name by saying where they saw it.** Generative Agents `demo` and AI Town stay as fallbacks, licences already read | **FOUNDER**: *"use pixel-agents code or Star-Office-UI or AgentOffice"* — the *or* hands the pick to evidence; research/room.md (five parts, licences read from the file for all three). **NEW, and it corrects FINAL §13.8:** *"no Claude Code fleet surface is spatial"* is no longer true — pixel-agents, clawd-on-desk (AGPL-3.0, refused) and pixtuoid (MIT, Rust, terminal) all watch Claude Code, and pixel-agents is a control, not only a display | Generative Agents demo mode as rank 1; Star-Office-UI; an LLM-driven office simulation |
| **v63** | Disclosure and the legal entity | **Every outward artifact carries a disclosure line unless the venture's charter turns it off; the legal entity and jurisdiction are a charter field answered at intake** | **FOUNDER**: *"Disclose by default; entity per venture decided at intake"*. **Mechanism:** the Sender's checklist reads the disclosure flag (ABSENT); `bin/check-stores` refuses a charter without the entity field (ABSENT) | no default disclosure; both deferred |
| **v64** | The first venture | **The harness itself.** Intents are the build order; anchors are `npm run check` and the probe | **FOUNDER**: *"The harness itself"*. **The cost, once, and LONG-TERM.md's standing note applies:** the machine tests itself again; no customer-facing work has ever run through it | adopting an existing project; a greenfield charter |
| **v65** | The second human | **The founder only, for now.** Statutory clocks wake the founder; revisit when a venture has a legal entity | **FOUNDER**: *"Me only, for now"* | a named accountant or lawyer as a wake-me target |
| **v66** | Who may call the one surface that dispatches, and how the phone reaches it | **Loopback bind; one keychain-held token checked on every write route; the phone through an authenticated tunnel** | **FOUNDER** (rethink 2026-09-06, DECISIONS §18 · D1) · L6 P2 (*surface authentication*, the lane's only ADD) · L3 P10 · L8 F. **Mechanism:** the seed already pins `127.0.0.1`; the token check is one middleware and the token is held in the macOS keychain (ABSENT); the tunnel is named at build time (ABSENT). **The cost, once:** one config line, one middleware, and a tunnel that has to keep working. **Settled by:** `lsof -nP -iTCP -sTCP:LISTEN` showing a non-loopback bind, or a tap accepted from a device that presented no token. Moves **v39**'s implementation; resolves contradiction 16 | loopback only, the phone reading through the published pages and writing requests the Watch picks up; **v39 as written** — bind to the founder's own network, which is an unauthenticated dispatch plane on any network the Mac joins |
| **v67** | What the cord actually stops | **Both: the launcher records each child's process group and the cord signals it; `bin/run` refuses to mint unattended work on a carrier whose `stop:` reads UNKNOWN** | **FOUNDER** (rethink 2026-09-06 · D2) · L3 P4, P5 · L7 P5 · L8 F · (FACT: world.md 22 — Codex shipped `Interrupt` hooks, the natural Codex-side receiver, and no row named it). **Mechanism:** one `pgid` field written by `bin/run` before exec, one signal path, a `stop:` column on §C.4's carrier table (ABSENT); `SIGTERM` is measured to give exit 143 and a resumable turn, so it stops without destroying. **The cost, once:** the Codex-cloud *maker* lane stays shut until cancellation is documented — which is §I row 15's state anyway. **Settled by:** pulling the cord mid-run, measuring time to quiescence, and whether the run resumes. Moves **v13**'s carrier table and **v56**; resolves contradiction 6 | signal only, minting unattended work on every carrier; the cord as designed — it stops the next dispatch, not the child in flight |
| **v68** | Whether everything leaving a run passes one program | **Yes — `bin/egress`. One no-model program logs every call, filters by domain AND HTTP method, and injects credentials the agent never sees; `--strict-mcp-config` names only the proxy, and `.claude/mcp-policy.json` becomes its configuration rather than an independent control** | **FOUNDER** (rethink 2026-09-06 · D3) · L3 P1 (*tool audit log*, *credential read denial*, *prompt injection defense*, *fetched-content taint*). **Mechanism:** `bin/egress` (ABSENT); `--strict-mcp-config` ships today. It is the only proposal of the round that survives an agent being *fully* persuaded: the trifecta guarantees a leg is missing at dispatch, this keeps it missing at the syscall. **The cost, once:** one program, one hop of latency, and each server declared twice. **Settled by:** a deliberate exfiltration attempt failing at the proxy rather than at the prompt, and the proxy's call count matching the runtime's for one night. **v33** gains a mechanism; new row in §F; **R2** may still turn half of it into configuration | configuration only — measure the sandbox's documented, unused `credentials` and `network` blocks first (kept as **R2**); structural prevention with no detection, where *"every call logged"* stays unenforceable |
| **v69** | Whether the data path is erasable by construction | **Both, now. No personal datum enters the event log or memory — both hold a hash; one erasable per-subject store holds the body; erasure deletes that row and the hash becomes *a known absence*. The consent register is a store with one writer, read by the Sender before any contact** — paths (orchestrator, DECISIONS §20): `keel/consent.yml` and `keel/subjects/<hash>.yml` | **FOUNDER** (rethink 2026-09-06 · D4) · L3 P2 (*data deletion request*, *data classification tags*, *data retention schedule*, *consent management* — the field's single ADD, and the one keyword of ~640 absent from v2's own text). **Mechanism:** one indirection in `bin/log` and the memory writer; two stores whose single writer `bin/check-stores` enforces (ABSENT); one line on the Sender's checklist. **The cost, once:** one indirection per inbound row, one store, one checklist line. **Settled by:** run one erasure end to end, then grep the whole tree for the subject and find nothing but hashes. Resolves contradiction 7 — *the log is never edited* (§15.3), *eviction never deletes* (§13) and *a deletion request is honoured* (§16) could not all hold | the consent register now and the erasable path when a venture has customers; as designed, where a person's data inside the log is structurally unerasable |
| **v70** | Whether the curator and the challenger wait for wave two | **No — both join wave one, which is ten agents plus the Operator, not eight** | **FOUNDER** (rethink 2026-09-06 · D5) · L4 P2 · L7 (§35 *contrarian-review agent*) · L5 (*taste review panel*) · L6 (§19 — the support chain names three agents, none in wave one). **Moves v54's implementation and reverses nothing:** v54's own test is *"a seed file or a code path today"*, and the curator has four verified code paths on this branch — `evict-memory.mjs`, `ledger.mjs`, `check-citations.mjs`, `check-memory-budget.mjs`. **Mechanism:** two agent files (ABSENT); the challenger is one read-only file, the cheapest in the roster, and wave one's only gap with a *measured* harm behind it (v30). **The cost, once:** the challenger runs single-family until Codex or Gemini lands, and its findings are labelled rung 4 rather than hidden. **Settled by:** the harness venture producing handovers nobody reads, and a count of memory proposals with no writer | curator only, the knowledge loop first; wave one as decided, promoting when founder-minutes per finished intent crosses a line the founder sets (§21.1 already measures it) |
| **v71** | What makes an agent routable | **An onboarding pack, for every agent, wave one included: at least one rehearsal case with a known answer, one exemplar of its own good output with provenance, one end-to-end demonstration that its anchor actually fires, and namespaces that resolve. Without them the agent is declared and not routable** | **FOUNDER** (rethink 2026-09-06 · D6) · L2 P1 (*onboarding checklist per agent*, *agent onboarding doc*, *apprenticeship pattern*). **Mechanism:** the pack paths are declared in `keel/shared/roster.yml` (§L O2, ABSENT) and `bin/run` already refuses a brief naming a file that does not exist (v37, v45). **The cost, once:** three artifacts per agent — thirty for a ten-agent wave one. **Why it is not ceremony:** the pack is what distinguishes `writer` from *builder with a different prompt*, and in a band nobody publishes evidence for (v31) evidence is the only thing that can settle the design. **Settled by: R19** — packed against unpacked on the same known-answer cases with §E.2's runner; if the packed agent does not win, the pack is ceremony and this row is refuted by its own test | wave two only, wave one demonstrated by the harness's own work; no pack at all — *"the agent file is the onboarding"*, true about the runtime and false about the company |
| **v72** | Whether an agent, alone among durable things, is permanent | **No. All fifteen agent files carry `valid_until`, and at expiry exactly one disposition is recorded — Refresh · Merge · Retire — with the anchored evidence attached** | **FOUNDER** (rethink 2026-09-06 · D7) · L2 P3 (*worker retirement*) · L7 (§35 *sunset-candidate review*, which extends the same idiom to a **provider position**: nothing retires Codex's foreground slot if it returns rung 4 on most checks). **Mechanism:** one frontmatter field; the forced disposition is `scripts/ledger.mjs`, already blocking on this branch. **Extends v19's idiom to §B.2 and reopens neither v1's count nor v54's waves.** **The cost, once:** a small number of founder answers a year. **Settled by:** the first expiry producing a Merge or a Retire — or a cycle where every agent Refreshes on real evidence, which is the strongest defence of fourteen available | the six wave-two business agents only, they being the roster entries with the least outside evidence; no expiry, leaving the roster the one object in the system that can only grow |
| **v73** | Whether an anchor is itself anchored | **Every anchor carries a mutation case — a known-bad input it must fail — or is marked `unrated`; §21's rung-1 share splits into rated and unrated** | **FOUNDER** (rethink 2026-09-06 · D8) · L5 P1 (*false-positive rate*, *false-negative rate*) · L4 (*golden output archive*, whose same-set-must-not-ship half is §L **O11**). **Why:** §11.11 lists fifteen anchors and **none has ever been shown to fail when it should**; an uncalibrated anchor is a rung-4 belief wearing a rung-1 label, which is the error §11.7 built the reconciliation to catch, one level up. This repository has already shipped a change that removed a control while every test stayed green. **Mechanism:** the case is written by whoever writes the anchor, as a **rehearsal-case body under v18**, so it inherits admission and forced expiry free. **The cost, once:** one case per anchor. **Settled by:** an anchor that passes its known-bad input is unrated by definition; the first rung-1 share that falls is the system telling the truth for the first time | only the anchors that gate irreversible work; no rating, where a green check keeps meaning *nothing complained* and the plan's central claim stays an assumption |
| **v74** | What a ceiling is denominated in | **A window gauge — tokens against an observed high-water mark, since no denominator is published — with wall clock beside it and USD kept as a shadow price. Exploration-class intents route to Gemini, local models or the Codex seat, and the Desk refuses an exploratory dispatch onto the Claude seat past a fraction the founder sets** | **FOUNDER** (rethink 2026-09-06 · D9) · L5 P3 (*budget in money*, *exploration spend*, *rate-limit cost impact*) · L6 (§31 *cross-venture resource pool* — per-venture ceilings do not compose) · L8 B · L2 (*worker cost cap* — the cap is per run and a standing intent has no aggregate). **Why:** on a subscription the dollar is a locally computed shadow of a bill nobody sends (v23), and **v22 falsified *"idle capacity is bounded by being free"*** — the weekly window is per seat and shared with Claude chat and Cowork, so a night of exploration is subtracted from the next day. **Mechanism:** one high-water file, one rule in the Desk, one `class:` on the intent (ABSENT). **The cost, once:** the reserve stops being a percentage of a quantity nobody has counted. **Settled by:** split one weekly window between driven and exploratory work — if exploration is invisible there, the old sentence was right and this is over-built. Beside **v22** and **v23**; resolves contradictions 18 and 21 | the gauge alone, with exploration left where it is; as designed, with dollar ceilings kept as ceilings — an absent ceiling is visible and a wrong one is not |
| **v75** | How the Desk ranks | **Lexicographically: obligations first (ranked among themselves by consequence and the world's own deadline) · then work that unblocks other work · then the founder's weight band · then cheapest inside the band. `Decay` is split into its two facts, and for a standing intent it is time since last move normalised by its own cadence** | **FOUNDER** (rethink 2026-09-06 · D10) · L1 P4 (*priority queue*, *goal conflict resolver*, *ticket aging*) · L8 A (the obligation tide, standing-intent decay, the staged-output tide) · L2. **Why:** `Weight × Decay ÷ Cost` divides by measured cost, so cheap work permanently outranks expensive work, and **v55's standing intents supply an endless stream of cheap work**; `Decay` was also undefined for an intent that never expires, which is most of a ten-venture queue. **Mechanism:** one comparator and one branch — *less* code than the formula it replaces, explainable on the board, and it cannot invert the founder's weight. **The cost, once:** none beyond the comparator. **Settled by:** replay `logbook/desk/<tick>.json` over a simulated month under both orders and count dispatches of the top-weight intent — the replayer (§L **O20**) is deterministic, free, and reads a file nothing reads today. Moves §4.5 and **v55**'s implementation; resolves contradictions 21 and 22 | the formula kept with `Decay` fixed and a standing-work share cap per window; the formula as designed, where an expensive high-weight intent can starve at any weight the founder sets |
| **v76** | What the system does while the founder is away | **It reads one derived value — the last founder event — at four call sites: release the reserve to autonomous work when the last event is older than the reserve's own horizon and snap it back on the first tap; execute a *which*'s stated default at its intent's expiry, archiving both built options; build one option instead of two while away; and give page 5 a *since you were last here* view keyed on the event, never on a date** | **FOUNDER** (rethink 2026-09-06 · D11) · L8 P1, F · L1 (*clarifying question trigger*; the which queue is unbounded at fifty sessions) · L5. **Inside the founder's own *"Keep 30% and 3/day; evidence moves them"*** (DECISIONS §15) — it changes what reads those numbers, not the numbers. **It does not reintroduce an approve verb and does not reverse v9:** a silent run still cannot ask. **Mechanism:** one predicate and one field, shared by four call sites (ABSENT). **The cost, once:** none beyond the predicate. **Settled by:** the reserve hit rate §21.1 already measures moving off *expired-unused*, and the count of second options built and never chosen falling. New row under §4.4 | the which expiry and the return view only; as designed, where a month away reads as a fault and costs a third of every window |
| **v77** | How big the skill library may get | **As big as a measured budget allows: a per-agent startup metadata budget enforced by a checker, plus one generated directory per namespace so an agent loads only what its file declares. The import stops when the budget binds** | **FOUNDER** (rethink 2026-09-06 · D12) · L4 P3 (*skill count*, *skill lookup cost*) · L5 (*skill discovery cost*). **Why:** the published standard loads roughly **100 tokens of metadata at startup for every installed skill**, so each admitted skill taxes every unrelated run — the same shape as the manifest defect this repo already paid for at ~15,000 tokens a lookup — and the upstream advertises 2,111. **Mechanism:** one checker modelled on `scripts/check-memory-budget.mjs` (which exists and blocks), one generator pass (ABSENT); extends **v48** and §E.4. **The cost, once:** the library stops being open-ended, which is what v3's ambition needs to stay affordable. **Settled by: R8** — two trees, one with the full house library installed and one carrying only one agent's namespaces, identical prompt, comparing input tokens; if the tax scales with declared namespaces rather than the installed library, the budget is unnecessary. **v3** gains one clause | namespace directories with no number — most of the saving, none of the argument; count as an output of admission with expiry doing the rest, where a good new skill makes every unrelated task dearer forever |
| **v78** | What happens when a model family is limited, unreachable or wrong | **A three-deep `fallback:` per agent ending in *stop and stage*; a cross-family reroute recorded as a **rung demotion** unless that family passed the rehearsal for that move class; a `class: calibration` rehearsal set that is never edited; and one provider-outage drill with the primary family denied at the launcher** | **FOUNDER** (rethink 2026-09-06 · D13) · L7 P3 (*model fallback chain*, *model-drift detection*, *vendor-lock-in avoidance*, *multiple-model second opinion*) · (FACT: world.md 19 — Codex is at 0.153.4, so **v32**'s *"version ≥ 0.124.0"* floor is 29 minor versions stale and no longer discriminates; restate it as *the installed version, recorded*). **Why:** v22 says a family limit is a reroute and never says **where a reroute goes**, and because Codex is one foreground slot and Gemini is scout-only, a seat-limit stop stops the whole company; a fallback without the demotion clause silently trades correctness for availability, and an instrument refreshed by the rule that refreshes its subject cannot detect drift. **Mechanism:** one frontmatter field × fifteen files, one `class:` field, one deny switch in `bin/run`, one drilled night (all ABSENT). **The cost, once:** one drilled night, and a reroute that says out loud it bought availability with rung. **Settled by:** the drill's completion count against a normal night, and calibration results moving when a model id changes. Moves **v22** and §11.10 | fallback chains only, vendor independence left as an architecture claim with no anchor; as designed, where the first seat limit is a company-wide stop nobody has rehearsed |
| **v79** | Which hosted lane may MAKE when the Mac is off, and whether a venture may say no | **Decide the lane after the measurement, and add the charter field `cloud: allow \| deny`, default `deny`, now — whichever lane wins.** **R5 IS DONE (DECISIONS §19), and it prices the lane at zero for the week measured:** *"span 2026-08-30 21:44 → 2026-09-06 09:39 (156 h, all the log retains) · asleep 40.7 h (26%) in 487 episodes · zero episodes of one hour or longer · longest single sleep 0.3 h (about 20 minutes). The Mac was never off long enough for a cloud lane to have bought anything back this week."* **The caveat travels with the number:** the log covers only the span it retains, and DarkWake power-naps are counted as wakes, so *asleep* here means the machine could not have run a process | **FOUNDER** (rethink 2026-09-06 · D14; the lane decision itself stays the founder's, §I row 15) · L6 (*local-first privacy mode*, RQ2) · L7 (*interrupt-hook handling* — cancelling a hosted task is UNKNOWN, which is **v67**'s refusal) · L3 (§18) · (FACT: world.md 24 — four weeks of Codex release notes mention no cloud exec, no cancel and no #19945; **absence is not denial**, and the June–August window is unread). **Mechanism:** one charter field, refused when absent by `bin/check-stores` (ABSENT); a hosted run's output still lands as a pull request or a staged artifact the Mac reconciles on wake, never into the house directly (v56). **The cost, once:** one field. **Settled by:** the hours-off measurement — **taken**, and it says a lane buying back a small tail is not worth §I row 1 | Codex cloud as a PR reviewer only, with no maker lane and no local Codex; Anthropic's documented drivers (`claude --cloud`, Routines) as the maker lane, on the same seat as the Floor and under the same open terms clause |
| **v80** | What a message between two running agents is | **A handover or an objection, on the handover schema, one append-only file per message. An ask carries a deadline and the asker's stated fallback if unanswered. Page 2's message control posts through the shipped transport, whose ids are recorded as attributes and never as a join key** | **FOUNDER** (rethink 2026-09-06 · D15) · L5 (*worker-to-worker request*, *peer help request*) · L2 (§20 *conflict resolution* — fourteen agents make ninety-one pairs and v7 designs one of them) · (FACT: world.md 11 — Claude Code shipped `SendMessage`/`ListAgents` between sessions on one machine, with a 30-second inbox-socket rule; **FACT: world.md 20** — Codex shipped `@` task mentions, so two providers shipped this in one window and the plan modelled neither). **Why:** free-form agent chat is evidence with no provenance and no ledger row, and the teams mailbox is a mutable document *"overwritten on the next state update"* — a lost-update surface where a vanished message looks exactly like one never sent. **Mechanism:** no new schema; three required fields on the handover (§L **O7**). **The cost, once:** three fields. **Settled by:** a run whose only input was a peer message still reconstructing from files alone, and killing the responder mid-run — the asker must still hand over. New row under §C.4; resolves a COVERAGE `?` | the vendor transport adopted directly for teammates and files for `-p` children — two shapes for one thing, with the lost-update surface kept; no agent-to-agent messaging at all, everything routed through the Operator |
| **v81** | How the plan notices that the world moved under it | **Every SPINE row resting on a fetched fact carries `source:` and `valid_until`; a `scout` standing intent re-fetches them on the free Gemini window; a changed fact opens a Decide item **naming the row it invalidates**. And every §J entry gains one `wins_if:` line** | **FOUNDER** (rethink 2026-09-06 · D16) · L7 P4 (*periodic architecture rethink*, *alternative-architecture proposal*, *assumption-challenge prompt*) · L4 (*knowledge freshness check* — for a vendor fact the falsifier beats the date, and the `claim-source` resolver already fetches a URL and asserts the quote). **Why:** 13a.7's four rethink conditions are internal, lagging and all blocked on the same absent briefing generator, while the facts most likely to invalidate this plan are external and already written down; **this round is what the alternative looks like** — nothing in the system reads the plan cold, so eight lanes had to be dispatched by hand. **Mechanism:** one field per load-bearing row; one standing intent in **v55**'s already-decided shape; `wins_if:` written by whoever wrote the reason. **The cost, once:** fifty-four lines, written once. **Settled by:** re-fetch this plan's external facts once and count how many moved; and after the next change, whether any `wins_if:` matched — if none ever does, the losing images are decoration and should be argued down rather than stored. Moves 13a.7 and §J's format | the `source:` / `valid_until` half only, leaving the graveyard as decoration; as designed, where the plan cannot notice its own premises expiring |
| **v82** | §11.3's three-family review panel row | **Deleted.** The row goes out of the plan. **The repo's three live `verified_by: judge` claims and the founder waiver running to 2026-11-17 are untouched** — this deletes a sentence in the plan, not a claim in the ledger. **v78**'s fallback chains and its frozen calibration set are what stands in its place, and the two-family route runs through the no-model launcher, **outside any Claude session** | **FOUNDER** (rethink 2026-09-06, DECISIONS §19, verbatim: *"Delete the row from the plan"*) · L7 delete 2, which the synthesis **refused as a synthesis fix** (X6) and referred to the founder precisely because the live judge claims reason about that panel. **Mechanism:** the deletion is the mechanism; nothing else moves, and §11.3 keeps the one honest sentence about a second family (deletion 26 removes its five other copies). **The cost, once:** §11.3 no longer describes a three-family panel anywhere, so a reader wanting to know why not is sent to v78 and to **R10**. **Settled by:** a deletion carries no falsifier; what would reopen it is a reachable non-Anthropic model, which is **R10**, the hinge of §N | **the row itself** — *"a three-family review panel"*, which read as capability while it needed Gemini authenticated **and** Codex detached-capable **and** panel machinery, none of which exists |

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

**Where the roster is thinner than it looks, and deliberately:** ~~eight~~ **ten** of the fourteen carry no shell, five carry
no write of any kind, and only four can touch source. That is the trifecta split (v33) expressed as a table
rather than as a rule.

**(moved 2026-09-06: contradiction 1, W6, W10, W25.)** The count above was wrong against the `Tools` column
beside it — four agents carry `Bash` (builder, tester, designer, analyst), so **ten** carry none, and §L **O57**
takes `analyst`'s shell away, which makes it eleven. Neither number is written by hand again: §L **O2** generates
this table from `keel/shared/roster.yml`, which is also where **D6**'s onboarding pack (v71) and **D7**'s
`valid_until` (v72) live. **The table gains one column, `cacheTtl` (W6):** `experimental.cacheTtl` is per-agent
frontmatter, `5m` or `1h`, and it is what decides whether the cache v57 justifies Fable on is warm. **The `Model`
column binds now (W10):** an agent definition's `model:` takes precedence over `CLAUDE_CODE_SUBAGENT_MODEL`,
which until this window silently flattened all fourteen choices. **And roster.md fact 1 gains an eighth
system (W25):** Gemini CLI ships named subagents with their own tools, MCP servers and context windows, defined
in `.gemini/agents` — which strengthens v2 and hands **v42** a case it did not contemplate, a **third**
agent-file location, per provider.

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

**(moved 2026-09-06: W21, and contradiction 4.)** ~~Codex is two axes~~ — **`approval_policy` × `sandbox_mode`
understates what governs a Codex run**. **Guardian** is a third, a background scoring layer whose behaviour
changes with the approval mode: *"Full Access skips Guardian reviews for confirmation-only actions. User
approval mode skips background Guardian scoring and prewarming, while sensitive-action checks and requests for
user input retain their existing handling"*, and its review history *"survives compaction, restarts, and
user-created forks … isolating subagent history"* (world.md 21). The Codex cell of every band is three axes
now, and Codex subagents carry their own review history, which §H does not describe. **Separately:** `analyst`
sits in *read and report* in this table and holds `Bash` in §B.2 — one agent, two answers. §L **O57** strikes
the shell, and v47 already gave every comparison to `bin/reconcile`, so nothing is lost with it.

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
- **The measured ceiling this mode is designed above (moved 2026-09-06: W31, W14).** The vendor's own
  measurement of its own users: *"the 99.9th percentile turn duration nearly doubled, from under 25 minutes in
  late September to over 45 minutes in early January"*, and *"roughly 20% of sessions use full auto-approve,
  which increases to over 40% as users gain experience"* (world.md 30b). **Forty-five minutes is the outer
  measured unattended stretch; this mode is designed for a night.** The mechanism that produces the gap is
  W14's three-check-in cap (v12). It is stated here as the cost of the mode, and the two things that answer it
  are §L **O21** — the goal condition becomes an exit code rather than prose — and §L **O15**, the wake
  reconciler that writes `orphaned` rather than `finished` when a run goes quiet.

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
| **A channel between sessions already running** — *(added 2026-09-06: W11, W20, v80)*. **Not a fourth dispatch mechanism:** nothing here starts a session | one agent asking another for a handover or filing an objection, and page 2's message control | `SendMessage`/`ListAgents` across sessions on one machine, *"on Bedrock, Vertex, and Foundry, and when telemetry is disabled"*; the **inbox socket closes a connection that sends no complete line within 30 seconds**, so a poster connects once its data is ready (world.md 11). Codex ships the same idea as `@` task mentions (world.md 20). **v80 decides the shape:** the message is a handover or an objection on the handover schema, one append-only file each; the transport's ids are recorded as attributes and **never as a join key**, because the teams mailbox is *"overwritten on the next state update"* |
| **`stop:` per carrier** — *(added 2026-09-06: v67)*. Every row above declares one | knowing what the cord reaches | `-p` children: the recorded process group, signalled — `SIGTERM` gives exit 143 and a resumable turn. Subagents and teammates: through their session. **A hosted lane's is UNKNOWN, and `bin/run` refuses to mint unattended work on a carrier whose `stop:` reads UNKNOWN** |

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

**(moved 2026-09-06: W2, W10, W17.)** **W2 sharpens the fix above into a rule:** write the **full id** in every
agent file and every argv, because *"`fable` and `best` … keep resolving to Fable 5 for now"* (world.md 2) —
an agent naming `fable` and one naming `claude-fable-5-1` are not the same routing, and the lint admission and
the first agent file move in one change. **W10:** an agent definition's `model:` now takes precedence over
`CLAUDE_CODE_SUBAGENT_MODEL`, which is what makes this whole table bind rather than describe — and it is also
what makes v59's strike of the teammate row (~~`claude-sonnet-5` for any teammate~~) actually take effect: a
teammate runs on its own file's model. **W17:** `PreModelSwitch` and `PostModelSwitch` are hook events that can
**block** a model switch (world.md 17). That is the gate this table has never had — it could enforce v57's
default or v21's escalation — and no row uses it, so it is named here and left to §12 rather than claimed.
Every rule in this table is still routing by declaration until §L **O5** generates the three copies of it from
`keel/shared/routing.yml` (contradiction 17).

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
- **(moved 2026-09-06: W6.)** **TTL is a per-agent field now, not only an account property:**
  `experimental.cacheTtl` (`"5m"` or `"1h"`) is agent frontmatter *"used when no subagent TTL setting is
  configured"*, and `promptCacheTtl` / `subagentPromptCacheTtl` are settings that let the main conversation hold
  a one-hour cache while subagents stay at five minutes (world.md 6). **This is the row v57 rests on:** the
  0.025x read only pays on a warm cache, and warmth is now a declared field per agent — §B.2 carries the
  column. Pairs with §L **O39**, which hashes the standing prefix at dispatch, because a hit rate is a lagging
  indicator on a bill and a prefix hash is a leading indicator on a dispatch. **R7** measures the share.
- **(moved 2026-09-06: W1, W3, W4.)** **W1** confirms Fable 5.1's `$10/$50` with `$0.25/Mtok` cache reads.
  **W3:** Sonnet 5's `$2/$10` is *"its standard list price rather than a limited-time promo"* — any promo
  caveat on the Sonnet row is stale. **W4:** four numbers this section computes are now vendor-emitted
  structured fields — a per-session `prompt_cache` object (hit ratio, misses, tokens re-cached, warm/cold), a
  `rate_limits.spend_limit` status-line field, a per-loop `/usage` breakdown, and a `modelPricing` managed
  setting. **Read them rather than compute them**, and keep `keel/shared/prices.yml` (§L **O8**) for what they
  do not publish, with `fetched_at` and `valid_until` per row so a stale row refuses routing.

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

### H.5 What moved under this section on 2026-09-06 (W19–W25, W27)

Nothing above is deleted. Six facts and one absence land here, and one of them is a whole missing row.

- **W19 · the rehearsal floor no longer discriminates.** Codex is at **0.153.4 (2026-09-04)**; H.2's
  ~~*"version ≥ 0.124.0"*~~ is 29 minor versions stale and is satisfied by anything installed. Restate it as
  **the installed version, recorded** (v32, and §L **O35** records a binary's version string and sha256 at
  admission).
- **W24 · the finding on the two questions this section most needs answered is *absence*.** Nothing in the
  Codex entries readable for 2026-08-26 → 2026-09-04 mentions `codex cloud exec`, a cloud API, cancel, poll,
  goal mode or **#19945**. **H.2 stands and v56(b) stands.** Absence is not denial; the June–August window is
  unread after three fetch failures, and reading it is **R26** — the only cheap route to **R10**, the hinge.
  One correction inward: 0.152.0 adds credential-refresh progress to `codex exec`, **adding output to the
  stream H.2 depends on being clean**.
- **W21 · Codex has a third control axis, Guardian** — see §C.1. The two-axis cell in the band table
  understates a Codex run, and Codex subagents keep their own review history.
- **W22 · Codex shipped `Interrupt` hooks** — *"run commands or MCP handlers when an active top-level turn is
  interrupted"*. **That is the cord's natural Codex-side receiver** (v67), and no row named it before this one.
- **W20 · Codex ships `@` mentions between tasks**, so agents can *"read, create, or message tasks from
  terminal"* — the second provider to ship agent-to-agent messaging in one window. Shape decided in **v80**.
- **W23 · a Codex extension can *"inspect or replace MCP tool results before reaching the model"*.** An
  admitted tool's **output** can be rewritten before the model sees it, which is a taint path §F's door does
  not test for. Pairs with §L **O65**'s taint id and canary string.
- **W25, W27 · §H has no Gemini row of any kind, and that is now a hole with a name.** Gemini CLI ships named
  subagents with their own tools, MCP servers and context windows, delegated by `@agent` and defined in
  `~/.gemini/agents` or `.gemini/agents` — **a third agent-file location beside `.claude/agents/` and Codex
  TOML**, which v42 did not contemplate. Its releases since 0.30 are dominated by security hardening, including
  *"enforce fail-closed workspace trust and filter mcpServers in restricted mode"* — **the nearest analogue to
  `--restricted` in any third runtime**, and the thing a Gemini row would be written against.

---

## I · Open decisions, with both sides

| # | Decision | One side | The other | Whose | **Status after the founder's interview, 2026-09-05** |
|---|---|---|---|---|---|
| 1 | **The terms** — automated access on a subscription | the vendor ships and documents the unattended features; the subscription is paid for | the clause names an API key as the carve-out; the downside of being wrong is the account, which takes the company. **OpenAI's terms are unread (403), Google's unfetched** | the founder, after one reading | **OPEN by the founder's word** (interview: *"still keep it open"*); a cloud lane is researched, v56 |
| 2 | **Is Fable 5.1 reachable on the subscription seat** | it is in the API catalogue and `fable` is a valid frontmatter value | no plan table names it; the repo's own lint does not carry `claude-fable-5-1` | one measurement, then the founder | **DECIDED v57**: builder and architect default; reachability still one measurement |
| 3 | **Haiku 4.5 retires from 2026-10-15** | nothing of ours defaults to it | `/goal`'s evaluator and the classifier do, by vendor default | the founder, on a dated review | **DECIDED v58**: `ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-sonnet-5` now |
| 4 | **`LICENSE-CONTENT` in the skills upstream** | one fetch clears it and unlocks 2,111 skills | until read, no bulk import; MIT covers the code, not necessarily the content | one fetch, then a decision | **OPEN**: fetch at build time (founder) |
| 5 | **Install Codex and run the headless rehearsal** | day one is the founder's instruction; three families is the strongest vendor independence | #19945 is open with no maintainer reply; the rehearsal may fail | the founder, then the measurement | **AT BUILD**: *"I will install it when the building starts"* |
| 6 | **Authenticate `gemini`** | a second family at zero marginal cost; 60 rpm / 1,000 rpd free | it has sat unauthenticated since it was installed | the founder, one terminal act | **DECIDED**: personal Google account |
| 7 | **Turn on agent teams** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | it is the substrate for mission control page 2, and it ships | experimental, off by default, no nested teams, ~7x tokens in plan mode | the founder | **DECIDED v59**: on, no model constraint |
| 8 | **The managed settings file** | the only tier a running process cannot clear | a founder act on a machine-wide file, and v11's hook trade rides on it | the founder, then the probe | **DECIDED**: the founder writes it when building starts |
| 9 | **Does a card launch a team** | it is the founder's page 4, verbatim | **no prior art anywhere**; every board-to-session project maps one task to one agent | decided by the founder; built by us either way | **DECIDED v60**: a solo/team toggle on the card |
| 10 | **The 3D graph extractor** — build it, since nothing found reads a repository into a graph | the renderer is MIT and free | the extractor is entirely ours and the least-researched area | the founder, on appetite | **DECIDED v61**: built last |
| 11 | **The second human** on statutory obligations | cheap now, impossible in the moment it is needed | a trust and credential decision | the founder | **DECIDED v65**: the founder only, for now |
| 12 | **Which room** — Generative Agents `demo` (Apache 2.0, cold) or AI Town (MIT, alive, needs Convex) | the cheapest read-only display | a living project if the founder wants it maintained | the founder | **DECIDED v62**: pixel-agents (MIT, alive, reads Claude Code); Star-Office-UI and "AgentOffice" refused with reasons; the founder may still name where they saw "AgentOffice" |
| 13 | **The first venture** and its rung-1 anchor | adoption is the intake this founder uses most | the harness is the only venture whose anchors already exist | the founder | **DECIDED v64**: the harness itself |
| 14 | **Fourteen agents is inside an unoccupied band** | the founder's decision, taken with the evidence | running rosters are 5–6 everywhere it was measured | **decided; reopened only by name** | **DECIDED v54**: two waves, eight first |
| 15 | **Which hosted lane may MAKE when the Mac is off** — Codex cloud (`codex cloud exec`, issue-only, UNVERIFIED) · Claude Code `--cloud` and Routines (documented argv and API; shares the Claude seat) · Jules (alpha API, third family) | Anthropic's is the only fully documented driver today and costs no extra compute | it is the same seat as the Floor and the same terms clause as row 1; Codex cloud is the founder's named preference and has no driver yet | the founder, with row 1 | **MEASURED (R5), decision pending the founder** — see **v79**. The measurement D14 asked for is taken (DECISIONS §19): **156 h of log · 40.7 h asleep in 487 episodes · zero episodes of an hour or more · longest single sleep about 20 minutes.** The tail a hosted maker lane would buy back is **zero over the week measured**, so the row is now a decision with a number under it rather than one without. The charter field `cloud: allow \| deny`, default `deny`, is decided either way |
| 16 | **Contrarian assumption 1 — that a deterministic anchor exists for most company work** (FINAL §11.2). Rung 1, the trust score, regression-for-free, unattended night work, the refusal of consensus voting and the promise that the founder is not the bottleneck all hang here | the harness venture's anchors are real and deterministic today — `npm run check` and the probe — and every part of the architecture that rests on them works | **the evidence comes from the most anchorable venture that could have been chosen.** What a real venture is made of — positioning, a price, copy that converts, a design someone likes, whether to pivot — is what §11.2's own table answers with *taste* or *the founder*. **If false the architecture inverts:** the night's product becomes built options with their costs, the morning becomes an adjudication queue, the taste store becomes the primary asset, mission control's centre of gravity moves off pages 3 and 5 onto a decision queue, and **the roster shrinks** | **the measurement first, then the founder** | **OPEN — raised by the rethink round (SYNTHESIS §6, L7).** **Settled by R12:** what fraction of the harness venture's **first thirty** real done-tests reach rung 1 *without inventing an anchor*. It is the cheapest measurement named anywhere in the round and nothing should be built against the inverted architecture before it |
| 17 | **If row 1 answers *no*, does the architecture move to a metered API key** | a key buys the carve-out the terms name explicitly, and with it batch at 50% both directions stacking with caching; v22's two windows stop mattering and **the reserve is redesigned** | it is a different economics and a different plan — money per token instead of a seat, and the founder has not been asked for it. It is downstream of row 1 and cannot be answered before it | the founder, after row 1 | **OPEN — raised by the rethink round (SYNTHESIS §6, the fourth assumption).** Listed rather than argued, and deliberately carries **no expiry**: attaching one would decide row 1, which the founder kept open by their own word — that is why the synthesis refused **X2**. Its useful half is already discharged for free by **v64**, which confines automated seat access to the harness venture |

---

## J · Losing-images ledger — additions

Kept by name so each can be argued for later. Five are the founder's overrules; the rest are moved by research, 25–30 by the orchestrator's build-round decisions (DECISIONS.md §8–§10), 31–42 by the review round, 43–54 by the founder's interview (DECISIONS §15), and **55–72 by the rethink round of 2026-09-06**.

**The format changed at 55 (v81 · D16).** Every entry from 55 on carries a **`wins_if:`** line — the observation
that would make the losing image the better answer. Entries **1–54 are untouched here on purpose**: they get
their `wins_if:` in §22 from the builders, written by the people who wrote the reasons. An entry with no
`wins_if:` is a graveyard plot; an entry with one is a live alternative waiting for a fact.

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
25. **A steward that reads mail with a pen in its hand** (→ v36; the world's door and `scout` read, steward writes).
26. **A brief that names no agent and lets the launcher guess; `agent+window+model:` as one widened field** (→ v37).
27. **A read-back page as an eighth page; a briefing nobody can reach from mission control** (→ v38).
28. **The website hosted as a published artifact; a cloud host reaching into the Mac** (→ v39).
29. **One `maxTurns` for every agent; no cap** (→ v40).
30. **A worktree for every agent; no isolation for the four that edit source** (→ v41).
31–42. **See parts/22-losing-images.md §22.2** — the review round's twelve (v42–v53).
43. **Fifteen agent files on day one** (→ v54; two waves).
44. **Per-agent cron; a schedules page; a second scheduler beside the Watch** (→ v55; standing intents).
45. **The Mac as the only runtime; Routines refused wholesale; Codex cloud as a full night maker on issue-only evidence** (→ v56; a cloud lane, with Codex as PR reviewer today).
46. **Fable as an escalation only** (→ v57; v21 is the losing image now).
47. **Haiku left as the vendor's small fast model until it retires** (→ v58).
48. **Sonnet teammates** (→ v59; each teammate on its own file's model).
49. **A card that always launches a team; a card that always launches one agent** (→ v60; a toggle).
50. **Page 6 beside page 2** (→ v61; last).
51. **Generative Agents demo mode as rank 1; Star-Office-UI; an LLM-driven office simulation** (→ v62; pixel-agents).
52. **No default disclosure** (→ v63).
53. **Adopting an existing project as the first venture** (→ v64; the harness).
54. **A named accountant or lawyer as a wake-me target** (→ v65; the founder only).
55. **Loopback only, the phone reading published pages and writing requests the Watch picks up; and v39 as written — an unauthenticated dispatch plane on any network the Mac joins** (→ v66).
    `wins_if:` a year of use where the token and the tunnel are what break a tap the founder wanted, while `lsof -nP -iTCP -sTCP:LISTEN` never once shows a non-loopback bind.
56. **A cord that signals but mints unattended work on every carrier; and the cord as designed, stopping the next dispatch and nothing in flight** (→ v67).
    `wins_if:` a measured cord pull reaches quiescence inside one tick period on every carrier without a signal — then the tick *is* the stop and the `pgid` field buys nothing.
57. **Configuration instead of a program — the sandbox's own `credentials` and `network` blocks; and structural prevention with no detection** (→ v68).
    `wins_if:` **R2** shows the `credentials` block injects a secret the child cannot read *and* `network` supports an HTTP-method allowlist. Then B was right and `bin/egress` is ours not to write.
58. **The consent register now, the erasable path only when a venture has customers; and the data path as designed** (→ v69).
    `wins_if:` a year passes in which no venture holds a named person's data, so the indirection is paid on every row and redeemed on none.
59. **Curator only; and wave one as decided, with promotion when founder-minutes per finished intent crosses a line** (→ v70).
    `wins_if:` a quarter of wave-one work produces no memory proposal worth writing and no plan the challenger would have changed — the two files are then idle capacity, not cover.
60. **The onboarding pack in wave two only; and no pack — *"the agent file is the onboarding"*** (→ v71).
    `wins_if:` **R19** shows a packed agent does not beat an unpacked one on the same known-answer cases. The proposal is then refuted by its own test, which is how it was written.
61. **`valid_until` on the six wave-two business agents only; and no agent expiry at all** (→ v72).
    `wins_if:` the first full cycle returns Refresh on all fifteen with no anchored evidence attached to any of them — the field is then a date nobody reads.
62. **Mutation cases only on the anchors that gate irreversible work; and no rating, where a green check keeps meaning *nothing complained*** (→ v73).
    `wins_if:` a year of real work in which no anchor is ever demoted to `unrated` and no mutation case ever fails — the rating cost bought a number that never moved.
63. **The window gauge with exploration left where it is; and dollar ceilings kept as ceilings** (→ v74).
    `wins_if:` one weekly window split between driven and exploratory work shows exploration invisible in the gauge — then *"idle capacity is bounded by being free"* was right and this is over-built.
64. **`Weight × Decay ÷ Cost` kept, with `Decay` fixed and a standing-work share cap; and the formula exactly as designed** (→ v75).
    `wins_if:` the deterministic replay over a simulated month dispatches the top-weight intent no less often under the formula than under the lexicographic order.
65. **The which-expiry and the *since you were last here* view only; and the reserve and the budget as designed** (→ v76).
    `wins_if:` the founder is never away longer than the reserve's own horizon, so the predicate never fires and four call sites read a value that never changes.
66. **Namespace directories with no number; and skill count as an output of admission, with expiry doing the rest** (→ v77).
    `wins_if:` **R8** shows the metadata tax scales with an agent's *declared namespaces* rather than with the installed library — the generator is then the whole fix and the budget is unnecessary.
67. **Fallback chains with no rung demotion and no frozen calibration set; and no fallback at all** (→ v78).
    `wins_if:` the outage drill shows a three-deep chain never reaches its second link because a seat limit and a family limit resolve the same way, and calibration never moves when a model id changes.
68. **Codex cloud as a PR reviewer only, no maker lane; and Anthropic's documented drivers as the maker lane** (→ v79).
    `wins_if:` a longer `pmset -g log` span finds a real tail — whole days off, not twenty-minute naps — **or** Codex documents a cloud driver with a cancel path, which also clears v67's refusal.
69. **The vendor transport adopted directly for teammates and files for `-p` children; and no agent-to-agent messaging, everything through the Operator** (→ v80).
    `wins_if:` a quarter of team use records no lost teammate output, and a run whose only input was a peer message cannot be reconstructed from files alone — then the transport is the evidence and the file is ceremony.
70. **`source:` and `valid_until` without the `wins_if:` register** (→ v81).
    `wins_if:` a year in which no entry's `wins_if:` ever matches while external facts do move — the register is then decoration and every entry should be argued down and deleted rather than stored.
71. **The three-family review panel row itself** (→ v82; deleted by the founder, DECISIONS §19).
    `wins_if:` **R10** passes *and* Gemini is authenticated — a three-family panel becomes a capability rather than a sentence, and the row comes back with machinery under it. Note what does **not** depend on this: the repo's three live `verified_by: judge` claims and the waiver to 2026-11-17 are untouched either way.
72. **The orchestrator's deletions of the rethink round, kept by name** (SYNTHESIS §7, the rows that are not a founder decision).
    The rank formula's two companions — *the intent's own urgency as a second scale* and *"the Desk decomposes"* — the **menu-bar glyph** (no substrate, and a status living in two places is one that disagrees), the per-venture **`open.md`** store (ten queues, one founder, nine writer-contention points → O9), **`logbook/desk/<tick>.json` as a file per tick** (the highest-volume artifact holding an answer whose value decays in hours → O20), the dependency on **`skills-ref validate`** (licence UNKNOWN and never fetched; its four checks are re-implementable from the spec text → keep the checks), **`keel/logbook/backlog.jsonl`** (an improvement is an intent, said twice in COVERAGE → O46), the duplicate cost formula in §16.3, `analyst`'s `Bash`, `writer`'s split model default, the `Night?` column of the four-class table, three of the four copies of that table, page 1's second job, *"unread transcript count"*, the *Pareto prompt archive*, the message priority tag, and the name *venture health score*.
    `wins_if:` any one of them is reached for by a builder who finds no replacement — each was deleted because something else already holds its job, so a builder unable to name that something is the observation that brings it back.

---

## K · The section plan for the builders

Twenty-five sections (13a added in the build round). Each names the SPINE rows it must obey and the FINAL sections it inherits. **A section may
not decide anything not in §A; if it needs a decision that is not there, it returns BLOCKED to the Operator.**

**The fifth column is the rethink round's brief, by file.** It names the D rows (§A v66–v82), the O ids (§L), the
W ids (§M) and the R ids (§N) that touch each section, plus **the contradictions of SYNTHESIS §5 named in the
section that carries the wrong sentence** — a contradiction spanning three sections is named in all three,
because the section that must change is the one holding the sentence, not the one holding the fix.

| § | Section | SPINE rows it obeys | Inherits from FINAL | **rethink 2026-09-06: what changes here** |
|---|---|---|---|---|
| 0 | **What it is** | v1, v4, and the founder's purpose paragraph verbatim | §0 | Nothing is decided here and one thing is admitted: §0.1 asks for a *"self-adjusting"* system and **v76** is the one adjustment it could not make. State that the whole section rests on **contrarian assumption 1** (§I row 16), settled by **R12** |
| 1 | **The decisions** | §A entire, reproduced, plus FINAL §1's carry-forward numbers | §1 | **v66–v82** reproduced whole; the count sentence reads eighty-two. **v81** adds `source:` and `valid_until` to every row resting on a fetched fact — which is most of v6–v53 and all of §M's targets |
| 2 | **Direction** — intents, obligations, done-tests | v29; §B.2 `product` | §2, §3 | **O1** the work-item store · **O3** the charter schema (**contradiction 2** — six lines vs five fields vs v63's seventh, and the founder's row is the one that loses) · **O22** a brief's done-test byte-identical to the intent's · **O23** forced disposition and a lapse record · **O63** wind-down · **O51** idle work must serve a live intent · **O60** bug intake · **v79**'s charter field `cloud: allow \| deny` · **v74**'s exploration `class:` on the intent |
| 3 | **The Operator** | §C entire; v9, v10, v13 | §6, §7.5 | **v66** identity on the dispatch surface · **v67** the cord's reach and the `stop:` column · **v80** the message shape · **O5** routing generated from one table (**contradiction 17** — three homes) · **O49** night escalation is a queue row, never the Operator (**contradiction 5**) · **O53** the edit-arguments verb writes a brief, never argv · **O80** a calibration number per agent · **W21** Guardian as a third Codex axis (**contradiction 4** lands in §C.1) · **W11/W20** the fourth row of §C.4 · **W14/W31** the measured ceiling in §C.2 |
| 4 | **The Watch and the Desk** | v12 (`/loop` refused), v22 (two windows), v23 | §3, §5 | **v75** the lexicographic order and `Decay` redefined (**contradictions 21, 22**) · **v74** ceilings in window share · **v76** the last-founder-event predicate · **O20** a replayable Desk, and its rows become log rows · **O50** register `budget-guard.js`, which exists and is wired nowhere · **O52** `catch_up:` because `StartInterval` coalesces · **O55/O56** a statutory class and a customer's clock against the interruption budget · **O23** `bin/horizon` · **W13** `/schedule` is a fourth scheduling surface, semantics UNKNOWN → **R25** |
| 5 | **The roster** | §B entire; v1, v2, v6, v7, v8, v31, v33 | §7 (as the losing image and as the surviving four rules) | **v70** wave one is ten · **v71** no pack, not routable · **v72** `valid_until` on all fifteen · **O2** generate the table from `roster.yml` (**contradiction 1** — eight vs ten carry no shell, and the column says ten) · **O57** strike `analyst`'s `Bash` (**contradiction 4**) and make `writer`'s split a §G.1 row · **O69** the parallelism axis: a store row may parallelise, a file may not · **O26** three named consumers for the trust score · **W10** per-agent `model:` outranks the env var · **W6** the `cacheTtl` column · **W25** an eighth named-roster system · **contradiction 20** — three department tables, generate two of them |
| 6 | **A Run, end to end** | v12, v13, v34; §C.1 bands | §6.2, §6.3, §7.8 | **O15** the wake reconciler, which is what *"resume, not restart"* never had (**contradiction 13**) · **O7** five fields on the handover, free now and a backfill later · **O22** brief and handover as adjacent hashed rows · **O14** `bin/worktree`, because a run cannot create its own under the armed sandbox · **O72** the file lease · **O73** a terminal state for a run that cannot resume · **O71** a session ceiling → **R23** · **v67**'s `stop:` per carrier · **W14** three check-ins and then silence → **R9**, **R17** |
| 7 | **Skills** | §E entire; v3, v17, v18, v19 | §11, §16.2 | **v77** a per-agent startup metadata budget and one directory per namespace → **R8** · **O11** `keel/golden/` and eval-only bodies, so the case that judges a run cannot be read by it (**contradiction 11**) · **O47** the body hash voids admission, and a failed candidate goes to `CURATION.yml`, not a venture store (**contradiction 10**) · **O41** log skill activation → **R14** · **O48** a `skill.miss` event · **O25** one sample floor (**contradiction 12**) · **R13** `LICENSE-CONTENT` and *derivative* bodies · **R15** selection accuracy as count rises |
| 8 | **Tools and MCPs** | §F entire; v15, v33 | §9.3, §16.3 | **v68** `bin/egress` and the MCP policy file demoted to its configuration · **O32** a `provider_cap` at the door (**contradiction 8** — RunPod refused, Higgsfield admitted) → **R21** · **O33** bulk personal data through the door with `guard` · **O35** `scopes_observed` and a binary's version and hash at admission · **O36** refuse `/import` · **O65** a taint id and a per-venture canary · **W23** an extension can rewrite an MCP result before the model sees it · **W16** the bundled `workflow-authoring` skill is in no namespace · **contradiction 19** — keep §F as the decision, delete three of four copies of the hands table |
| 9 | **Models** | §G entire; v20, v21, v22, v23 | §5, §14.5, §15.3 (**with §15.3's coefficients corrected**) | **v78** three-deep `fallback:`, rung demotion, a frozen calibration set, one outage drill · **O5** one routing table (**contradiction 17**) · **O8** `prices.yml` with `fetched_at`/`valid_until`, a stale row refusing routing · **O39** hash the standing prefix → **R7** · **O77** `tokenizer:` on every ceiling · **W1–W6** the price, the alias trap, Sonnet's list price, the four machine-readable fields, the residency multiplier, per-agent `cacheTtl` · **W10**, **W17** `PreModelSwitch` as an unused blocking gate · **contradiction 15** — one cost formula, cited not copied |
| 10 | **Codex and Claude Code** | §H entire; v5, v11, v12, v32 | §1 row 30 (losing image), §16.7 | **§H.5 is new** and carries **W19** (the version floor is stale — record the installed version), **W20**, **W21**, **W22** the `Interrupt` hook as the cord's Codex-side receiver, **W23**, **W24** the absence and what it is not, **W25/W27** the missing Gemini row · **v78**'s fallback · **v67**'s `stop:` · **R10 is the hinge of the whole cross-model design** and **R26** is the cheap route to it · deletion 28: Codex `/goal` falls to one line in the gap list |
| 11 | **Truth** — anchors, the ladder, rehearsal | v8, v30; §B.2 anchor column | §8, §7.6 | **v73** every anchor carries a mutation case or is marked `unrated`, and the rung-1 share splits · **v82 deletes §11.3's three-family panel row** and deletion 26 removes five of the six *"a second family whenever one is reachable"* copies, keeping the one in §11.3 whose state is honest · **O24** `effect:` on every anchor, so the regression suite cannot become a Sender · **O25** one sample floor (**contradiction 12**) · **O28** route `tester` and `challenger` on `-p` until probed · **O29** `claim-source` blocking on `scout` handovers · **O30** sign the verdict · **O62** a held-out discrimination test before any taste check may judge · **O19** the same-failure predicate · **R11**, **R12** |
| 12 | **Control** — envelope, permissions, the Sender | §C.1; v9, v10, v28, v33 | §9 | **v68** one egress program · **v69** the erasable path and the consent register (**contradiction 7**, with §13 and §15) · **v67** what the cord stops (**contradiction 6**) · **O31** hash-chain the log and record every sandbox escalation · **O34** three data classes and per-store retention · **O37** delete the project-`settings.json` tier (**W7** supports it) · **O38** the hook rewrite, **ADOPTED-AS-SPEC** — the founder deferred the act to build time · **O66** PII as a gate, measured for a week before it blocks · **O67** rotation as an obligation · **O64** a provenance line on the Sender's checklist · **W8** a read narrowing that is a settings field |
| 13 | **Memory and knowledge** | v24, v25, v26, v27; §E | §10, §11 | **v69** memory holds a hash, never a body (**contradiction 7**) · **O17** one `bin/redact` (**contradiction 14**) · **O42** a watermark, so the backlog pass and the steady pass are one program · **O44** calibrate the dedup threshold on labelled pairs; a conflict gets an owner and an expiry · **O45** slice precision derived by the curator, never self-reported · **O43** house scope for a negative that names no venture path · **O11** eval-only bodies · **R9** does an unattended `-p` run auto-compact where v24 cannot see |
| 13a | **How the system improves itself** — three loops, horizons, corrections that learn, the rethink trigger | v19 (skill expiry), v30 (the challenger), §E.3 (a failed candidate becomes a negative), §B.2 `curator` and `challenger` | §12 entire (**added in the build round: §K omitted FINAL §12 and the coverage lane found the gap**) | **v81 replaces 13a.7's four internal, lagging rethink conditions** with an external trigger: a re-fetched fact that moved opens a Decide item naming the row it invalidates · **O4** the brief schema, because 13a.5 says ten fields and v45 decided eleven and the correction-attribution table is built on the wrong count (**contradiction 3**) · **O49** *"the Operator is the escalation"* goes (**contradiction 5**) · **O23** one pass over every durable store, which 13a.6 marks a WISH · **O41**, **O80** · **R18** |
| 14 | **Mission control** | §D entire; v4, v14, v15, v16 | §13 (Floor and Balcony absorbed, not deleted) | **v66** the token, the loopback bind and the tunnel (**contradiction 16** — v39 vs §14.13 vs the seed's `127.0.0.1` pin) · **O12** every element resolves to a store path or a `bin/` verb, and page 1 loses the venture toggle (**contradiction 9**) · **O9** one decide queue replacing ten `open.md` stores · **O70** page 2's census is `claude agents --json --all` joined to our own `sessions.jsonl` · **O54** the Q&A cites or refuses · **O18** `bin/bell` as the only thing that may ring · **W4** page 3 reads vendor fields instead of computing four numbers · **W12** the failure class page 2 renders is lost teammate output · **R22**, **R24** |
| 15 | **Runtime and the Mac** | §D.1, §D.2; v13's constraints | §14, §16.7 | **O10** `keel/host/` — plist, managed settings, env, sandbox block, `denyRead`, and `bin/probe` asserting the live machine **by attempting the operation** · **O13** `bin/embed`/`bin/classify`, because the local tier has no reachable carrier → **R4** · **O14**, **O15**, **O16** the Watch/Sender lease, the round's only failure ending in a duplicated outward act · **O78** a scratch house, **O79** blue-green at a tick boundary · **v79** carries **R5, DONE**: 156 h of log, 40.7 h asleep, zero gaps of an hour · **R1**, **R3**, **R6** · *the log is never edited* is now **contradiction 7**'s job to reconcile |
| 16 | **Economics** | §G.2, §G.3; v22, v23 | §15 | **v74** the currency changes: a window gauge, wall clock beside it, USD as a shadow price (**contradiction 18** — *"bounded by being free"* against a weekly seat window) · **O40** rotate the log and derive rollups → **R22** · **O74** one control chart instead of three invented thresholds · **O75** cost per rung movement · **O76** the restore drill's number on the briefing · **O77**, **O8** · **W4**, **W5** · **W18** `bashOutputMaxChars`/`taskOutputMaxChars` up to 128K is a vendor ceiling on the largest source of unplanned context, against a ≤500-token convention · deletions 13, 20, 21 (**contradiction 15**) |
| 17 | **The inventory** | §B.2 (fifteen files), §D (seven pages), §E, §F, §G.1 | §16 — every table re-decided against the roster | Every new store, schema and program of §L is inventoried with its path and its ABSENT mark: **O1, O2, O3, O4, O5, O6, O8, O9, O10, O11, O12** and the programs **O13–O20, O78, O79** · **v71**'s three pack artifacts per agent · **v72**'s `valid_until` · **W25**'s third agent-file location · **contradiction 19** keeps §17.3 as the inventory copy of the hands table and deletes the rest |
| 18 | **What exists and its fate** | v1 (the eighteen agent files become fifteen, not three), v3 | §17 | **O46** delete `keel/logbook/backlog.jsonl` — an improvement is an intent, said twice in COVERAGE · **O37** delete the project-`settings.json` grant tier · **O50** register `.claude/hooks/budget-guard.js`, a fuse that exists and is wired nowhere · deletion 19: drop the `skills-ref validate` dependency, keep its four checks · §J 72 is the full list of what leaves and why |
| 19 | **Build order** | every ABSENT path named in §B–§H | §18 | Now also **every ABSENT path in §L**, and the ordering constraint the round adds: **v71** makes an agent unroutable without its pack, so packs precede routing; **O7**'s five handover fields and **O6**'s `schema_version` are **free before the first run and a full backfill afterwards**; **R10** gates everything cross-model and **R5 is already answered** |
| 20 | **Open decisions** | §I entire | §19 | §I is **seventeen rows**: row 15 is **MEASURED (R5), pending the founder** (v79); row 16 is contrarian assumption 1, settled by **R12**; row 17 is the metered key, downstream of row 1. Row 1 stays **open by the founder's word**, and **X2** records why it carries no expiry — attaching one would decide it |
| 21 | **How we would know it worked** | §B.2 anchor column; v6, v31 — the roster's own claim is falsifiable | §8, §12 | **v73** splits the rung-1 share into **rated and unrated**, which is the first number here that can fall for a good reason · **W30** gives the section its only outside comparator: TheAgentCompany's *"The most competitive agent can complete **30%** of tasks autonomously"*, over six job functions · **O75** cost per rung movement · **O26** the trust score's three consumers · **O45**, **O80** · **R11**, **R12** |
| 22 | **Losing images** | §J entire | §1 | §J is **seventy-two entries**. **v81 changes the format:** entries 55–72 carry `wins_if:` already, and **the builders write `wins_if:` onto 1–54 here** — that work belongs to this section and was deliberately not done in §J |
| 23 | **Coverage** — every founder-list item placed or refused | §B.4 for §23–§30; the rest against §A | COVERAGE.md as a floor, not a frame | **The round found exactly one absent keyword across ~640: *consent*** — may we contact this person at all — and **v69** closes it with a register that has one writer and is read by the Sender before any contact. **v80** resolves the *worker-to-worker request* / *peer help request* `?`; **O2**'s `color:` closes another. **Contradictions 19 and 20** are settled by generating the department and hands tables from one source. SYNTHESIS §8's lane ledger is the traceability map for every keyword |

**Discipline every section carries:** provenance on every paragraph (FOUNDER · FINAL · NEW: why) · every rule
names its mechanism or is marked WISH · every path exists on a named branch or is marked ABSENT · no stage
states method · no schedule and no durations · the founder's words quoted wherever they decide something ·
anything not in the inputs marked UNVERIFIED.

---

## L · Mechanisms decided by the orchestrator in the rethink round (O1–O80)

**These are not founder decisions and they are not §A rows.** Each follows from a rule already on this page, a
measured fact, or a contradiction inside v2 — the class DECISIONS §10 and §12 settled without the founder.
Copied from rethink/SYNTHESIS.md §2.1–2.3 and **not re-argued here**: the reason each is a fix rather than a
question lives there.

**Status has three values.** **ADOPTED** — it follows from a rule on the page or a fact, and a builder may
proceed. **ADOPTED-AS-SPEC** — the decision is taken and the *act* is deferred; one entry, O38, because the
founder deferred the hook rewrite to build time (DECISIONS §15). **DEPENDS-ON-R** — a named research answer
decides whether or in what shape the thing exists; the R is named and §N carries it. Where an R sharpens a fix
without gating it, the R is named in the sentence and the status stays ADOPTED. **`Path`** follows v50: ABSENT
means designed and named but not built; WISH means no mechanism is designed; anything else names what exists on
this branch today.

### L.1 Stores and schemas the one-writer rule already implies (O1–O12)

| id | The fix | Path | Moves | Status |
|---|---|---|---|---|
| **O1** | The **work-item store**: `w-*.yml` with `intent`, `purpose`, `ceiling`, `blocked_on`, `attempts`, `last_failure`, `card`; proposals land in `items-draft/` and the Watch materialises them after the store check — v44's obligation pattern reused. **A board card becomes a view of a work row, not a second object** | `keel/ventures/<v>/items/` · `bin/check-stores` refuses a live intent with zero work rows — ABSENT | §2 · §4 · §14 (page 4) | ADOPTED (**R16** decides two objects or three) |
| **O2** | **One roster file**, with frontmatter, argv files, §17.1 and page 2 generated or checked against it; carries `color:`, `wave`, `valid_until` (v72), `maxTurns`, `isolation`, anchor and the v71 pack paths | `keel/shared/roster.yml` — ABSENT | §5 · §17 · §14 | ADOPTED |
| **O3** | **The charter schema** — §2.1 enforces six lines, COVERAGE §14 says five, v63 requires a seventh, so a six-line charter with no entity both loads and is refused, **and the founder's row is the one that loses**. The schema generates the prose | `keel/shared/schemas/charter.yml` — ABSENT | §2 · §17 | ADOPTED |
| **O4** | **The brief schema** — §13a.5 says ten fields, **v45 decided eleven**, and the correction-attribution table is built on the wrong count | `keel/shared/schemas/brief.yml` — ABSENT | §13a · §6 | ADOPTED |
| **O5** | **One routing table.** *Which agent, which model, which band* is answered in three places with nothing checking that they agree; generate all three from it | `keel/shared/routing.yml` — ABSENT | §3 · §5 · §9 | ADOPTED |
| **O6** | **The event schema**, a `schema_version` on every row, and the logger refusing a row that fails it; **a reader refuses an unknown version rather than guessing** — v26's posture toward the vendor's format, turned on our own | `keel/shared/schemas/event.yml` · `bin/log` — ABSENT | §15 · §16 · §14 | ADOPTED |
| **O7** | **Five fields on the handover:** `objection:` (v7 generalised to all ninety-one pairs), `brief_sha`, `maker_family`/`maker_model`/`checker_family`/`checker_model`, `actor:` with one legal value today, and **an idempotency key on the staged artifact** rather than only on the resume path. **All free before the first run and a full backfill afterwards** | the handover schema — ABSENT | §6 · §11 · §21 | ADOPTED (**R11** is blocked on it) |
| **O8** | **A price file** with `fetched_at` and `valid_until` per row; a stale row **refuses routing** rather than mis-pricing. Gemini's quota is carried as a count (60/min, 1,000/day), not a price | `keel/shared/prices.yml` — ABSENT | §9 · §16 | ADOPTED |
| **O9** | **One house-level decide queue** replacing ten per-venture `open.md` stores, rendered by pages 4 and 5; a row with no intent id is refused | `keel/logbook/decide.jsonl` — ABSENT | §14 · §4 | ADOPTED |
| **O10** | **The host directory** — plist, managed-settings template, env file (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`), sandbox block, `denyRead` list, expected macOS grants — with the probe asserting the live machine matches **by attempting the operation**, not by reading a database | `keel/host/` · `bin/probe` — ABSENT | §15 | ADOPTED |
| **O11** | **Eval-only bodies.** v18 makes *exemplar* and *rehearsal case* two of four admissible SKILL.md bodies and §7.1 generates every admitted skill into the two directories an agent loads from — **so the case that will judge a run can be read by that run**. One frontmatter field, one generator rule, the manifest check re-pointed | `keel/golden/` — ABSENT; `check:manifest` exists | §7 · §11 · §13 | ADOPTED |
| **O12** | **A page manifest** — every element resolves to a store path (`fact:`) or a `bin/` verb (`tap:`), and the renderer builds only from it. Page 1 loses the venture toggle and the portfolio moves to page 3's strip: §14.4 forbids page 1 being where a decision is made | `keel/surfaces/pages/<n>.yml` — ABSENT | §14 | ADOPTED |

### L.2 Programs the design needs and does not name (O13–O20, O78, O79)

| id | The fix | Path | Moves | Status |
|---|---|---|---|---|
| **O13** | **A local-tier carrier.** The local tier has **no reachable one**: the armed sandbox denies a loopback `bind()` and its consumer `curator` carries no `Bash` and no MCP. Make it no-model programs in the Watch's launchd context, handing the curator a file — v47's shape | `bin/embed` · `bin/classify` — ABSENT | §15 · §13 | **DEPENDS-ON-R4** |
| **O14** | **A worktree program.** v41 gives four agents `isolation: worktree`, `git worktree add` cannot complete under the armed sandbox, and interactive escalation is unavailable to an unattended run by construction. **A run never creates its own and is handed one in its argv** | `bin/worktree` — ABSENT | §6 · §15 | ADOPTED |
| **O15** | **The wake reconciler.** The launcher writes `run.started` before exec; the Watch reconciles our session log against `claude agents --json --all`, the tmux session list and the process table, **writing `orphaned`, never `finished`**, then resuming by id or closing with a reason; and it refuses a night lane the power assertions cannot promise to keep awake. *"Resume, not restart"* is asserted and nothing performs it | `bin/run` · `bin/watch` — ABSENT | §6 · §15 | ADOPTED |
| **O16** | **The Watch/Sender lease.** A lease file holds a host id and a heartbeat; the Watch refuses to tick without it and the Sender refuses to act without it, so the restore drill's clone can never tick and never send. **The only failure in the round that ends in a duplicated outward act** | `logbook/watch.lease` — ABSENT | §15 | ADOPTED |
| **O17** | **One redaction program.** Redaction is implemented twice — in the mining pass and as a `gitleaks`-class scan — and two implementations of one check disagree | `bin/redact` — ABSENT | §13 | ADOPTED |
| **O18** | **One bell.** The interruption budget is designed and its transport is named nowhere. One no-model program is the only thing that may ring, reading the wake-me classes, the budget and the per-channel acted-on rate | `bin/bell` — ABSENT | §14 · §4 | ADOPTED |
| **O19** | **The same-failure predicate** — the anchor's exit signature where there is one, cosine over local embeddings of normalised failure text where there is not, calibrated on labelled pairs. **Three named mechanisms sit on top of this gap:** the fast loop's stop on a second identical failure, the sighting counter, and memory dedup | one shared hash, with §4.5's repetition tripwire — ABSENT | §11 · §13 · §4 | ADOPTED (rests on **O13**) |
| **O20** | **A replayable Desk.** It already writes its ranking and the gate that stopped each candidate, and nothing reads it; a no-model replayer is the only way to tune scheduling without living a month. In the same move those fields become **event-log rows** rather than a file per tick | `bin/replay-desk` — ABSENT | §4 · §16 | ADOPTED (**v75** is settled by it) |
| **O78** | **A scratch house.** The Sender, Watch, door and launcher have **no test seam**, and a Sender defect is an outward act that cannot be recalled | `keel/fixtures/` · `bin/drill` — ABSENT | §15 | ADOPTED |
| **O79** | **Blue-green at a tick boundary** for the Watch and the Sender — free, because every tick is already crash-only | `bin/watch` · `bin/send` — ABSENT | §15 | ADOPTED |

### L.3 Rules already written that acquire a mechanism (O21–O77, O80)

| id | The fix | Path | Moves | Status |
|---|---|---|---|---|
| **O21** | `/goal`'s condition is composed from v45's `anchor:` field — *"`<anchor>` exits 0, and `<done-test>`"* — turning **the most frequently executed judgement in the system** from a small model reading prose into an exit code. It is also the mid-run external critique wave one otherwise lacks | `bin/run` composes it — ABSENT | §6 · §3 · §4 | **DEPENDS-ON-R17** |
| **O22** | The launcher refuses a brief whose `done-test:` is not **byte-identical** to the intent's; brief and handover are logged as adjacent hashed rows. §6.2 mandates a verbatim copy and nothing checks it, and this repo has lost a measurement in synthesis **twice** | `bin/run` — ABSENT | §2 · §6 | ADOPTED |
| **O23** | **Forced disposition at expiry for intents and charters**, plus a **lapse record** — one row per thing that expired unactioned, ordered by what it stopped. One pass over every durable store, which 13a.6 marks a WISH | `bin/horizon` — ABSENT | §2 · §4 · §13a | ADOPTED |
| **O24** | Every anchor declares `effect: none \| metered \| reaches-the-world`; the unattended re-run executes only `none`. **An anchor with a side effect turns the regression suite into a Sender** — a v33 breach arriving through the one mechanism the plan calls free | the anchor declaration — ABSENT | §11 | ADOPTED |
| **O25** | One shared **sample-floor predicate** for the trust score, skill admission and the error rates — §11.10 prints `insufficient` below a floor while §E.2 admits a skill on 2–3 cases | one predicate, two call sites — ABSENT | §11 · §7 | ADOPTED |
| **O26** | The trust score gets **three named consumers** and a **model dimension**: the launcher (below floor on a move class, that class is unroutable until a rehearsal passes), the briefing, and §5.6's falsifiability claim. **Today nothing reads it** | `bin/run` · the briefing — ABSENT | §5 · §21 | ADOPTED |
| **O27** | Cross-venture isolation is **probed, not asserted**: the launcher refuses a brief naming two ventures, the probe attempts the cross-venture read nightly, and the store check refuses a memory write whose venture scope differs from the writing run's | `bin/run` · `bin/probe` · `bin/check-stores` — ABSENT | §12 · §15 | ADOPTED |
| **O28** | Route `tester` and `challenger` on the **`-p` carrier only** until the probe asserts read-denial on subagents and teams — blindness is argv there and UNVERIFIED elsewhere | the launcher's carrier choice — ABSENT; **W8** names the settings field that could lift it | §11 | ADOPTED |
| **O29** | Promote the `claim-source` resolver from SHADOW to **blocking on `scout` handovers only**, so the friction lands on the one agent whose entire anchor is that check | `scripts/ledger.mjs` — exists, in SHADOW | §11 | ADOPTED |
| **O30** | The verdict is **signed** with a key under a path every agent's grant excludes and `denyRead` covers, **stated honestly**: this raises forging from a file write to defeating a checked deny rule — a guardrail, not containment | `scripts/verdict.mjs` exists; the key path — ABSENT | §11 | ADOPTED |
| **O31** | **Hash-chain the event log** (each row carries the sha256 of the previous), and **every sandbox escalation writes an event row** that appears in the briefing. Both escape hatches are used and recorded nowhere, in a log editable without trace | `bin/log` — ABSENT | §12 | ADOPTED |
| **O32** | A **`provider_cap`** is required on any credit-spending tool at the door, and the launcher refuses a grant whose recorded cap is null. §F refuses RunPod for uncapped spend and admits Higgsfield, which spends credits, under a cap no named program enforces — **one rule, two answers** | `bin/door` · `bin/run` — ABSENT | §8 | ADOPTED (**R21** decides whether Higgsfield stays in WRITES) |
| **O33** | Bulk collection of personal data passes the §F door with `guard` and a data-classification row **before** it runs. Lead scraping is the only item in the departments both unprecedented in every fetched roster **and** legally exposed | the door's checklist — ABSENT | §8 · §12 | ADOPTED |
| **O34** | Three **data classes** on every store row — ours · a third party's · a named person's — assigned by the writing program, with the never-list keying on the class rather than on paths; and **retention declared per store**, where a store declaring *forever* may not hold a body | the writing programs · `bin/check-stores` — ABSENT | §12 · §13 | ADOPTED |
| **O35** | Record `scopes_observed` read back from the provider beside `scopes_requested`; record a binary's version string and sha256 at admission, since version pinning is defined for MCP descriptions and **undefined for the binaries that actually run at night** | the admitted-tool file — ABSENT | §8 | ADOPTED |
| **O36** | Refuse `/import` and `claude import` inside the house. §9.3's door governs tools and v53 governs pages; **nothing governs a config import that carries over MCP servers, commands, subagents and skills** | a `UserPromptSubmit` hook — ABSENT | §8 · §12 | ADOPTED |
| **O37** | **Delete the project-`settings.json` tier of tool grants** — grants live in exactly two places, the argv the launcher composes and the managed file a running process cannot clear | a deletion; **W7** is independent support | §12 · §18 | ADOPTED |
| **O38** | Deny through the `decision` object on non-blocking hook events and keep `exit 2` for the documented blocking ones | the hooks — ABSENT | §12 | **ADOPTED-AS-SPEC** — the founder deferred the hook rewrite to build time (DECISIONS §15), so this is the specification, not the act |
| **O39** | **Hash the standing prefix** (system prompt, tool definitions, skill metadata) at dispatch, record it, treat a change as an event, and turn on `--exclude-dynamic-system-prompt-sections` and `--system-prompt-snapshot on`, which §9.5 names shipped and unused. **A hit rate is a lagging indicator on a bill; a prefix hash is a leading indicator on a dispatch** | `bin/run` — ABSENT; both flags ship | §9 · §16 | ADOPTED (**R7** measures the share) |
| **O40** | **Rotate** the log into a file per period with a rebuildable rollup; no surface reads the raw file; the index partitions by the same period, so a corrupt period costs a period. Nothing is deleted, and the rollup stands to the log exactly as memory already does | `logbook/events/YYYY-MM.jsonl` — ABSENT | §16 · §14 | **DEPENDS-ON-R22** |
| **O41** | Log **skill activation** and join it to outcomes; a skill that never fired defaults to **Deprecate** at expiry and a founder waiver is what keeps it. **v19 stays whole** — retirement is still date-forced; only what the disposition *reads* changes | `bin/log` — ABSENT | §7 | **DEPENDS-ON-R14** |
| **O42** | A **watermark** on the mining pass, so the backlog pass and the steady pass are one program; *"unread transcript count"* becomes **watermark lag**, which stays meaningful in year two | `bin/mine --since` — ABSENT | §13 | ADOPTED |
| **O43** | **Negatives scope split** — a negative whose reproducing command names no venture path is a fact about the world and is **house scope**. Today a tooling dead end is relearned once per venture | the negatives store's scope field — ABSENT | §13 · §7 | ADOPTED |
| **O44** | Memory dedup's *near-duplicate* threshold is **calibrated on labelled mined pairs**, not guessed; a conflict pair becomes an item with its own **owner and expiry** and reaches the founder as a *which* at expiry | the curator's pass — ABSENT | §13 | ADOPTED |
| **O45** | **Slice precision**, derived by the curator from the artifact and the handover and **never self-reported**, incrementing ACE's helpfulness counters. §13.5 says *"the Desk is itself measured"* and names no measurement, so the ranker cannot be wrong | the curator's pass — ABSENT | §13 · §21 | ADOPTED |
| **O46** | The improvement backlog is a **filter over the intent store** where `kind: improvement`; **delete `keel/logbook/backlog.jsonl`** — COVERAGE says twice that improvements are intents | a deletion plus a filter | §18 · §13a | ADOPTED |
| **O47** | The skill admission record carries the **body hash**; a changed hash voids admission until re-eval. A failed candidate is written to `CURATION.yml` — house scope, exists, already checked — **not** to a per-venture negatives store | `.claude/skills/CURATION.yml` — exists and is checked | §7 | ADOPTED |
| **O48** | A **`skill.miss` event** when a brief's namespace resolves to zero unexpired skills — uncovered-field detection today has no trigger and is something the Operator notices | `bin/log` — ABSENT | §7 | ADOPTED |
| **O49** | Night escalation is **a queue row plus the wake-me test, never the Operator**. 13a.1 says *"the Operator is the escalation"* and §4.4 says the Operator is not always on, so a run that stops at 03:00 escalates to something that is not running | the decide queue (**O9**) — ABSENT | §4 · §13a | ADOPTED |
| **O50** | **Register the stall fuse.** `.claude/hooks/budget-guard.js` **exists on this branch and is registered nowhere** — a fuse that is not wired is a memory of a fuse | `.claude/settings.json` · the hook exists | §4 · §18 | ADOPTED |
| **O51** | Idle work must serve a live intent, a standing intent, or the negatives/knowledge stores, **or it is a leak with a cheap price tag** — gate 4 reads the same provenance test as gate 5 | the Desk's gates — ABSENT | §4 | ADOPTED |
| **O52** | `catch_up: yes \| no` on a standing intent — `StartInterval` **coalesces**, which is right for a tick and wrong for a cadence: v55's `every:` intents vanish silently across a sleep and nothing says so | `bin/watch` — ABSENT | §4 | ADOPTED |
| **O53** | The *edit-arguments* verb writes **a new brief, never argv**; the launcher recomposes and may narrow, never widen beyond the band, and refuses surface-supplied argv | `bin/run` — ABSENT | §3 · §14 | ADOPTED |
| **O54** | A Q&A answer renders **only** with the log-row or memory-item ids it rests on; zero citations renders as *I cannot answer that from the log*. **It is the one element a model writes** | the page's renderer — ABSENT | §14 | ADOPTED |
| **O55** | A **`statutory` wake-me class exempt from the interruption budget**, declared on the obligation rather than judged in the moment | the obligation schema — ABSENT | §4 · §2 | ADOPTED |
| **O56** | A support obligation whose promised response time falls inside the next window **promotes past the interruption budget**, and demotion never applies to obligations — the budget is founder-shaped and **a waiting customer has a clock it does not know about** | the Desk's comparator (**v75**) — ABSENT | §4 · §2 | ADOPTED |
| **O57** | `writer`'s **split model default** becomes a §G.1 row with a named trigger — one file declaring two models puts a routing decision in the copy no table reviews — and **`analyst` loses `Bash`**, which contradicts §C.1's placement of it in *read and report* and was overtaken by v47 giving every comparison to `bin/reconcile` | §B.2, §G.1 and `roster.yml` (**O2**) | §5 · §9 | ADOPTED |
| **O58** | A **deterministic accessibility check** through the designer's existing `playwright` grant is the rung-1 anchor; the designer's judgement is rung 2. §5 claims accessibility is *"computable rather than judged"* and names no program | the designer's grant — exists; the check — ABSENT | §14 · §5 | ADOPTED |
| **O59** | A legal flag carries **the clause quoted verbatim** with its source and location, never a summary, and its anchor is that the quote resolves — `scout`'s own rule, checked the way `check-citations.mjs` checks a quote | `scripts/check-citations.mjs` — exists | §2 · §5 | ADOPTED |
| **O60** | **Bug intake:** an anchor that fails twice writes a card whose done-test **is the reproducing command**; with no reproduction it is a bounded question for `scout`, not a ticket | `bin/intend` — ABSENT | §2 | ADOPTED |
| **O61** | Brand-voice work is **unroutable while the taste store is empty** — the anchor names a file that does not exist until the mining pass runs; until it fills, the anchor is the founder's pick between two staged drafts | `bin/run` refuses — ABSENT | §5 · §13 | ADOPTED |
| **O62** | Any taste or brand check must first pass a **held-out discrimination test** — rank labelled approved artifacts above rejected ones — and its measured rate prints beside every verdict; **below chance the check is deleted rather than tuned** | the §E.2 eval runner — exists upstream | §11 · §13 | ADOPTED |
| **O63** | **Wind-down:** at a charter's horizon exactly one disposition — continue · park · wind down; the store check refuses `tempo: parked` with an undischarged obligation, and refuses promotion to `driven` while any relied-on date has passed | `bin/check-stores` — ABSENT | §2 | ADOPTED |
| **O64** | A **provenance line on the Sender's checklist** beside v63's disclosure — source, licence, date read. Inbound licences are read exceptionally well and **outbound is unchecked**: nothing records the licence of a third-party asset embedded in a published artifact | the Sender's checklist — ABSENT | §12 · §17 | ADOPTED |
| **O65** | A **taint id** on every inbound row, carried by any handover derived from it, with the Sender refusing a staged artifact whose lineage names an uncleared id — plus a per-venture **canary string** in every inbound row's provenance that the Sender refuses, **making an injection attempt a `wake-me`** | the world's door · `bin/send` — ABSENT | §8 · §12 | ADOPTED |
| **O66** | PII detection becomes a **gate on two paths** — the Sender's checklist and the mining pass — where a positive blocks and an override is a *which*; **its false-positive rate is measured for a week before it blocks** | `bin/redact` (**O17**) — ABSENT | §12 · §13 | ADOPTED |
| **O67** | **Rotation is an obligation** — one row per credential in the obligations store, surfaced by the briefing. Rotation *"at the horizon"* is a promise with no clock, and this needs no new mechanism | `obligations.yml` — decided (v44); the rows — ABSENT | §12 | ADOPTED |
| **O68** | The curator pass takes a **venture argument**: *one writer* is a property of a **store**, not of a process, and the two readings are identical at one venture and diverge at ten | `bin/curate` — ABSENT | §13 | ADOPTED |
| **O69** | State the parallelism axis: **parallel is legal where the unit is a store row and refused where it is a file.** v6 is right about artifacts and is being read as a rule about agents — `steward` over ten ventures' obligations is independent in `scout`'s exact sense. **This restates v6 and never widens it** | a rule beside v6; no program | §5 | ADOPTED |
| **O70** | Page 2's census is `claude agents --json --all` joined to **our** session log; the vendor's `config.json` enriches with tmux pane ids only, because it is *"overwritten on the next state update"* and **a page polling fifty rewriting files shows a different fleet every render** | the page's reader — ABSENT | §14 | ADOPTED |
| **O71** | A **session ceiling** in settings: the launcher refuses to mint past N live rows and the supervisor refuses to restart into a full table, **so a crash loop cannot become the concurrency event**. §14.12 names three bounds and none is a session count | `bin/run` · `bin/supervise` — ABSENT | §6 · §14 | **DEPENDS-ON-R23** |
| **O72** | **The file lease** — the Desk refuses a run whose declared scope intersects a live run's worktree scope. v6 removes the intra-artifact case and is silent on two intents, one file, **conflict found at landing** | the Desk — ABSENT | §6 | ADOPTED |
| **O73** | **A terminal state for a run that cannot resume:** after N failures it becomes a `blocked` card in *waiting on you* carrying the exact failure text, written to negatives so the next brief carries it | the card store · the negatives store — ABSENT | §6 | ADOPTED (**R18** sets N) |
| **O74** | **One control chart** over each shape's own history for cache-read share, tokens per run and trust pass rate, **replacing three thresholds someone would otherwise invent at 3am** | the briefing — ABSENT | §16 | ADOPTED |
| **O75** | **Cost per rung movement, per venture**, on the briefing beside cost per finished intent — the only ROI computable honestly, because the numerator is measured and the denominator is set by the world | the briefing — ABSENT | §16 · §21 | ADOPTED |
| **O76** | The restore drill's number goes on the briefing beside the two non-numeric lines §16.8 already has | the briefing — ABSENT | §16 | ADOPTED |
| **O77** | Every ceiling carries `tokenizer:` and the launcher refuses to enforce a legacy cap on a current-tokenizer model — Opus 5 and Fable 5.x produce *"approximately 30% more tokens for the same text"*, and **a ceiling that fires early is indistinguishable from a stuck run** | `bin/run` — ABSENT | §16 · §9 | ADOPTED |
| **O80** | A **calibration number per agent** — how often an empty `uncertain:` preceded a defect found later. `uncertain` is written by the run about itself and nothing ever checks it, **so a confidently wrong run pays nothing** | derived by the curator — ABSENT | §3 · §21 | ADOPTED |

---

## M · Facts that moved a row without a decision attached (W1–W32)

All from research/world.md, accessed 2026-09-06, and copied from SYNTHESIS §2.4. **Each names the exact row and
the exact change, and each has been applied in place** — the moved rows carry a bracketed
*(moved 2026-09-06: W-n)* note and nothing was deleted to make room for one. Where a W falsified a clause, the
clause is struck and the new sentence sits beside it.

| id | The fact (world.md item) | Row · change | Applied |
|---|---|---|---|
| **W1** | Fable 5.1 shipped: `claude-fable-5-1`, 1M context, $10/$50 per Mtok, **$0.25/Mtok cache reads** (1) | **v57** — the id and the 0.025x read are confirmed; **the subscription-seat UNVERIFIED stands** | v57 · §G.3 |
| **W2** | *"`fable` and `best` … keep resolving to Fable 5 for now … pick Fable 5.1 in `/model`"* (2) | **v57 · §G.1** — an agent file naming `fable` and one naming `claude-fable-5-1` are **not the same routing**. Write the full id, and admit it in `scripts/prompt-standard.test.mjs` in the same change | v57 · §G.1 |
| **W3** | Sonnet 5 is **$2/$10 as standard list price**, not a promo (3) | **§G / O8** — drop any promo caveat on the Sonnet row | §G.3 |
| **W4** | The vendor emits `prompt_cache` (hit ratio, misses, re-cached, warm/cold), `rate_limits.spend_limit`, a per-loop `/usage` breakdown and a `modelPricing` managed setting (4) | **§D page 3 · v14** — page 3 is specified over a hand-kept price table; **four of its numbers are structured vendor fields it can read instead of compute** | §G.3 · v22 · §K 14 |
| **W5** | `--max-budget-usd` now includes a **1.1× US-only-inference premium** for data-residency workspaces (5) | **v23** — still a local estimate, now with a residency multiplier | v23 |
| **W6** | `experimental.cacheTtl` (`5m`/`1h`) is **per-agent frontmatter**; `promptCacheTtl` and `subagentPromptCacheTtl` are settings (6) | **§B.2 gains a column · §G.3 gains a row** — v57 justifies Fable on the 0.025x read, and TTL decides whether that cache is warm. Pairs with **O39** | §B.2 · §G.3 · v57 |
| **W7** | `--restricted` *"refuses `bypassPermissions`, and ignores user, project and local settings files"* (7) | **v10 gains a second mechanism** and **v11 narrows** — on the `-p` carrier the project tier is ignored outright, which is independent support for **O37** | v10 · v11 |
| **W8** | `permissions.blockReadsOutsideWorkingDirectories` (8) | **v43** — a **read** narrowing expressible in settings: exactly the carrier v43 could not name for the subagent and team mechanisms, and the thing **O28** is waiting on | v43 |
| **W9** | `--add-dir` refuses network paths (9) | **v34, minor** — a grant composed by the launcher cannot point at a share | v34 |
| **W10** | `CLAUDE_CODE_SUBAGENT_MODEL` no longer overrides an agent's own `model:` (10) | **§B.2 · v59** — before it, one env var silently flattened fourteen per-agent model choices | v59 · §B.2 · §G.1 |
| **W11** | Cross-session `SendMessage`/`ListAgents` shipped, with a 30-second inbox-socket rule (11) | **v13 · §C.4 need a fourth row** — the shape is **v80** | v13 · §C.4 |
| **W12** | Agent teams repaired four times in the window and never promoted out of experimental; the failure class is **lost teammate output** (12) | **v59** — the risk of the founder's *teams on* decision is exactly what page 2 renders. Pairs with **O70** | v59 |
| **W13** | `/schedule` exists and drives routines; its doc page returned **HTTP 404** (13) | **v12 · v55** — a fourth scheduling surface inside the CLI. Semantics UNKNOWN → **R25** | v12 |
| **W14** | `/goal` check-ins back off 30 min → 1 h → every 2 h, and **an idle session gets at most three check-ins per goal** until someone messages it (14) | **v12 — the sharpest fact of the round.** Under `-p`, check-ins are the only way the runtime delivers anything and nobody is there to message it, so a night goal loop delivers three times and goes quiet. **v12's mechanism is re-specified against it**, and it strengthens **O21** and **O15** | v12 · §C.2 |
| **W15** | `/loop` gained a self-paced dynamic mode and an autonomous default (15) | **v12 unchanged** — still session-scoped, still refused in production; **the losing image got stronger, not the decision** | v12 |
| **W16** | The `Workflow` tool's prompt footprint fell from ~5.7k to ~1k tokens, with a bundled `workflow-authoring` skill (16) | **v35 unchanged and cheaper**; §E's thirteen namespaces do not list the bundled skill | §K 8 (not applied to v35 — nothing in it moves) |
| **W17** | `PreModelSwitch` / `PostModelSwitch` hook events, both able to **block** (17) | **§12 · v57** — a blocking gate that could enforce v57's default or v21's escalation, and **no row uses it**. The *"34 events, 10 blocking"* count is at least 36 | v57 · §G.1 |
| **W18** | `bashOutputMaxChars` and `taskOutputMaxChars`, up to 128K (18) | **§16's context budget gains a row** — a vendor-enforced ceiling on the largest single source of unplanned context, against a ≤500-token handoff convention | §K 16 |
| **W19** | Codex is at **0.153.4 (2026-09-04)** (19) | **v32** — its rehearsal floor of *"≥ 0.124.0"* is 29 minor versions stale and no longer discriminates. Restate the floor as *the installed version, recorded* | v32 · §H.5 |
| **W20** | Codex ships `@` mentions between tasks (20) | **§H · v13** — the second vendor to ship agent-to-agent messaging in one window; feeds **v80** | v13 · §C.4 · §H.5 |
| **W21** | **Guardian** is a third Codex control axis, background-scoring, whose behaviour changes with the approval mode; review history *"isolat[es] subagent history"* (21) | **§C.1** — the band table models Codex as two axes and **the cell understates what governs a Codex run** | §C.1 · §H.5 |
| **W22** | Codex `Interrupt` hooks (22) | **§H · v67** — the cord's natural Codex-side receiver, named by no row | §H.5 · v67 |
| **W23** | Codex extensions can *"inspect or replace MCP tool results before reaching the model"* (23) | **§F · v53** — an admitted tool's **output** can be rewritten before the model sees it: a taint path the door does not test for. Pairs with **O65** | §H.5 · §K 8 |
| **W24** | No Codex entry read mentions `codex cloud exec`, a cloud API, cancel, poll, goal mode or #19945; the June–August window is **unread** (24) | **v32 and v56(b) stand. Absence is not denial — record it as such** | v32 · §H.5 · v79 |
| **W25** | Gemini CLI ships **named subagents** with their own tools, MCP servers and context windows, delegated by `@agent`, defined in `.gemini/agents` (25) | **roster.md fact 1 gains an eighth system** (v2's evidence strengthens); **v42 gains a case it did not contemplate** — a third agent-file location, per provider | §B.2 · §H.5 |
| **W26** | Google states v6's rule in its own words and adds a second reason: **parallel subagents consume the rate limit faster** (26) | **v6 strengthened** — three independent vendors now, and the second reason is v22's window | v22 (the second reason) · v6 unchanged |
| **W27** | Gemini CLI's releases are dominated by security hardening, including *"enforce fail-closed workspace trust and filter mcpServers in restricted mode"* (27) | **§H lacks a Gemini row of any kind** — this is the nearest third-runtime analogue to `--restricted` | §H.5 |
| **W28** | Devin's automations ship a **max-concurrent-runs cap per automation** and **per-automation cost attribution** (28) | **v55** — Devin ships v55's exact shape plus two ceilings v55 has no mechanism for; the store check refuses `every:` without a ceiling **per run**, which is a different cut. Feeds **v75** and **O32** | §K 4 (v55 unchanged; the ceilings are v74/v75's) |
| **W29** | Factory's named droid taxonomy is **NOT FOUND** on a second, different page (29) | roster.md's UNVERIFIED becomes NOT FOUND; **v1 and v2 unaffected** | — (no row moves) |
| **W30** | TheAgentCompany: *"The most competitive agent can complete **30%** of tasks autonomously"*, over six job functions (30a) | **roster.md's open gap CLOSES**, and **§21 gains an outside floor** — the only external comparator a fourteen-agent design has | §K 21 |
| **W31** | Anthropic's own measurement: the **99.9th-percentile turn duration is over 45 minutes**; ~20% of sessions use full auto-approve, rising above 40% with experience (30b) | **§C.2** — fully autonomous mode is designed above a measured unattended ceiling of forty-five minutes, not a night. **State it as the cost of the mode, beside W14** | §C.2 · v12 |
| **W32** | *"Claude tended to mark a feature as complete without proper testing"*; testing tools *"dramatically improved performance"* (30c) | **v8 gains vendor support** for splitting the self-check from the blind anchor test | v8 (unchanged; now independently cited) |

---

## N · Research first (R1–R26)

Copied from SYNTHESIS §3. **Each is a bounded question with a source class, and nothing that rests on it can be
decided without it.** Status is **DONE** where the answer is recorded, **OPEN** otherwise.

**R10 is the hinge.** It is the one question whose answer changes the shape of the cross-model architecture
rather than one of its rows: pass, and rung 2 becomes parallel and a second family is a lane; fail, and the
second family is one foreground slot forever, at 1/N availability. **v5, v32, v78, v82 and §I row 15 all read
differently depending on it**, and **R26** — reading the unread Codex June–August window — is the only cheap
route to it.

| id | The question | Source class | What it decides | Status |
|---|---|---|---|---|
| **R1** | Is the Bash sandbox's `filesystem.allowWrite` settable **per `claude -p` invocation**, or project-scoped only? | Vendor sandboxing/settings reference, then one measured cell | Whether the shell can be narrowed to a run's worktree, making `isolation: worktree` **enforced** rather than declared | OPEN |
| **R2** | Does the sandbox `credentials` block inject a secret at egress without the child being able to read it, and does `network` support an HTTP-method allowlist and TLS inspection? | Same reference, then one cell | Whether **v68** is one config change or a program we write | OPEN |
| **R3** | Can a non-interactive background process read a macOS keychain item without an interactive unlock, and under what ACL? | Apple platform documentation, then one detached measurement | Whether §15.4's credential plan works at 3 a.m. at all — **the unattended half rests on it and nothing has tested it**. Also prices **v66**'s keychain-held token | OPEN |
| **R4** | Can a sandboxed run reach a local model, and in which shape — server inside, server outside, or in-process? | Measurement on this Mac, plus the vendor's network model | Whether the local tier is a service or a program (**O13**). Inbound `bind()` is measured denied; **outbound connect to loopback is unmeasured** | OPEN |
| **R5** | How many hours is the Mac actually off, when, and what is the longest single gap? | `pmset -g log` on this machine | Prices **v79** — a cloud lane buying back a small tail is not worth §I row 1 | **DONE 2026-09-06** (DECISIONS §19): span 2026-08-30 21:44 → 2026-09-06 09:39, **156 h · asleep 40.7 h (26%) in 487 episodes · zero episodes of an hour or more · longest single sleep 0.3 h**. The tail is **zero** over the week measured. Caveat: only the span the log retains, and DarkWake naps count as wakes |
| **R6** | Which inbound sources document a **polling** read with a cursor, and which need a listening socket? | Vendor API docs, one page per source | Whether the world's door wakes and reads or must be reachable from the internet — **nothing lifts an inbound `bind` under the armed sandbox** | OPEN |
| **R7** | What is the cache-read share per dispatch shape, and do `--exclude-dynamic-system-prompt-sections` and `--system-prompt-snapshot on` move it? | Ten real moves per shape, read from each run's own token fields, not `/usage` | The premise under **v57**, under §16.3's formula, and under the tenfold reviewer divergence §16.3 records | OPEN |
| **R8** | Does the skill metadata tax scale with the **installed library** or with the agent's **declared namespaces**? | Two trees, identical prompt, input tokens from `--output-format json` | **v77** — and if it scales with namespaces, the budget is unnecessary | OPEN |
| **R9** | Does an unattended `-p` run **auto-compact**, and does it emit anything the log can see? | One long `-p` run with `stream-json --verbose`, plus vendor docs | Whether **v24**, the strongest memory rule, is being broken where it cannot see. If unobservable, the answer is to bound run length | OPEN |
| **R10** | Does `codex exec --json` return output with **no controlling TTY**, on a current version, with a non-trivial prompt? | Five known-answer cases on an installed binary | **The single hinge of the cross-model architecture.** Pass and rung 2 becomes parallel; fail and the second family is one foreground slot forever. Note **W19**: the version floor must be restated | OPEN |
| **R11** | Does a second model family reduce escaped defects on **our** move classes, and by how much? | Twenty-five paired checks from our own event log | Whether rung 2 outranks rung 4 on any given class, and contrarian assumption 2. **Blocked on O7's four provenance fields — cheap now, unreconstructable later** | OPEN |
| **R12** | What fraction of a venture's real done-tests reach rung 1 **without inventing an anchor**? | The harness venture's first thirty intents | **Contrarian assumption 1 (§I row 16), and with it the shape of the whole architecture.** The cheapest measurement named anywhere in the round | OPEN |
| **R13** | Does `LICENSE-CONTENT` permit **derivative** skill bodies, not merely redistribution? | The licence file, read raw | Narrower than §I row 4 and decisive: under v18 we would **rewrite** imported bodies, which is a derivative work MIT-on-the-code says nothing about | OPEN |
| **R14** | Do any of the three CLIs emit a **skill-activation event** we can read? | The three vendors' hook and telemetry docs | Whether **O41** is instrumentation or a field lookup | OPEN |
| **R15** | Is there any published measurement of **selection accuracy as installed-skill count rises**? | Spec authors, vendor engineering posts, the harness showcase | The real risk of importing thousands. If nobody has measured it, **v77**'s budget is what bounds the exposure | OPEN |
| **R16** | Does any shipped agent system carry a **scheduling object between the goal and the run** — two objects or three? | Symphony, Linear's agent session model, Copilot's task object; source read | **O1**'s shape; cognition.md's ticket table is explicitly incomplete here | OPEN |
| **R17** | What does `/goal`'s evaluator accept as a condition, and does an **exit-code** condition behave differently from a prose one? | Vendor doc plus one measured pair of runs | **O21**, which is otherwise a design argument. Now also bounded by **W14**'s three-check-in cap | OPEN |
| **R18** | Is there measured evidence for a **re-attempt ceiling across sessions**? | Vendor docs and any measured paper on repeated-attempt yield | The N in the attempt counter (**O73**), which is otherwise taste | OPEN |
| **R19** | Does an **onboarding pack** change an agent's anchored pass rate? | Our own with-against-baseline runner, run locally | **v71**, and whether wave two should be gated on evidence at all | OPEN |
| **R20** | Has anyone published a **roster-size ablation between six and one hundred and fifty**? | Google ADK, LangGraph templates, Sakana, Cognition's and Factory's rosters, TheAgentCompany's leaderboard | The only fact that could responsibly move **v31** in either direction. **W30** closed the headline; the leaderboard remains unobtained | OPEN |
| **R21** | Does any **credit-spending server expose a spend or balance read**? | Vendor API docs, one fetch each | **O32**: with a balance read a program can hold an absolute ceiling and Higgsfield stays in WRITES; without one it belongs in REACHES-THE-WORLD | OPEN |
| **R22** | What does **page 3 cost to render at a year of rows**, and where is the knee? | Synthesised event log at this Mac's own emission rate, measured against the real server | Whether **O40** is a day-one shape or a later migration touching the one store the design says is never edited | OPEN |
| **R23** | Is there a **concurrency ceiling on `claude -p` children**, and does the N+1th fail loudly, queue, or degrade silently? | Vendor docs first, then one measurement | **O71** — the board refuses a drag that would breach a bound, and no bound is a session count | OPEN |
| **R24** | Does **pixel-agents** render ten venture areas and fifty live agents, and what is its `AgentEvent` schema and ingest rate? | The project's own source and tracker, then one local run | **v62**'s UNVERIFIED, and the writer §14.4 says is ours to build | OPEN |
| **R25** | What are **`/schedule`**'s semantics — interval floor, storage, headless status? | The vendor doc page, which returned **HTTP 404** on 2026-09-06 | Whether **v55**'s Watch-dispatched standing intents should route through it or ignore it | OPEN |
| **R26** | Was **#19945** fixed between Codex 0.125 and 0.153? | The unread June–August changelog window; three fetch failures recorded | It would settle **R10** without a local install, and **it is the only cheap route to it** | OPEN |

---

*§A v66–v82, §L, §M and §N were written into this file by the framer engine on 2026-09-06 from
rethink/SYNTHESIS.md, DECISIONS.md §17–§19 and research/world.md. Founder rows v1–v5, v54–v65 and v66–v82 are
fixed. Nothing here was built, installed, run, spent, published, committed or pushed, and no file outside this
one was edited.*
