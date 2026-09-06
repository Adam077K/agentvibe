# L6 · surfaces and runtime — the rethink round · 2026-09-06

*Sections **10 Surfaces · 11 Runtime · 17 Deployment & DevOps · 19 Growth & external comms · 31 Multi-venture
portfolio · 32 Mac environment**. Read from `parts/00`, `SPINE.md` §A–§K, `DECISIONS.md` §15 and §17, `COVERAGE.md`,
`parts/{14,15,18}`, `parts/10 §10.2a`, `research/{surfaces,room,cloud}.md`. Rows v1–v5 and v54–v65 are the
founder's and fixed; this lane improves inside them and reverses none.*

**Provenance codes, used in tables to save bytes.** **(F)** the founder · **(FIN)** FINAL, carried into v2 ·
**(N)** this lane's reasoning · **(X)** a fact with its source — research facts accessed 2026-09-05, repository
measurements on branch `ceo-1-1788609834`, unless dated otherwise.

**The lane's one sentence.** Surfaces and runtime are where the plan stops being a design and becomes a machine that
either is or is not running at three in the morning; elsewhere a weak rule costs an artifact, here it costs a night.
So the recurring verdict is not that an idea is wrong — almost none are — but that **a rule about a machine is
written in prose while the machine is governed by files**.

---

## 10 Surfaces

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Terminal interface | Where work is actually done. | IN §14.2, §15 — the Floor, sterile while the founder is in it **(FIN)**. | **KEEP** — destination, not a peer. | — |
| Mission control dashboard | A website that changes what happens next. | IN §14 **(F, v4)**, served on the Mac (v39). | **KEEP** — founder's row, built properly. | — |
| Dashboard view count | Is seven a number or a ceiling. | IN §14.3; v53 admits an eighth through the door. | **KEEP** — a door, not a ceiling. | — |
| Actionable dashboard views | Nothing on screen that cannot be acted on. | IN §14.6, v14 — and **§14.4 admits its own prohibitions are WISH** (v50). | **IMPROVE** — the section's best rule, enforced by nothing. | Each page declares its elements in `keel/surfaces/pages/<n>.yml`: every element is `fact:` (a store path) or `tap:` (a `bin/` verb with argv); the renderer builds only from the manifest. **Mech:** a lint in the check suite failing an element with neither. **Cost:** one schema, one lint, one render path. **Settles:** run it over the seven page specs, count elements resolving to neither. **Row:** v14 gains a mechanism (new). |
| Inbox surface | The queue only the founder can clear. | IN — `Decide` on page 4, briefing on page 5 (v38). | **IMPROVE** — one queue on two pages; a decision with no card has no home. | One `keel/logbook/decide.jsonl` carrying the six-field item, rendered by both pages; a row with no intent id is refused and `bin/intend` mints its card. **Mech:** `bin/check-stores` (ABSENT). **Cost:** one store, one refusal. **Settles:** count Decide items with no card. **Row:** v38 gains the store (new). |
| Empty-inbox problem | Boring when things go well. | IN §14 — empty is normal and a good sign. | **KEEP** — right, and rare. | — |
| Office floor visualization | A room showing real runs, never deciding. | IN §14.4 — **pixel-agents**, MIT read from the file, pushed 2026-09-05, 9,190 stars **(X: room.md)**, v62. | **IMPROVE** — substrate settled; guard rails unenforced and the page also carries the venture toggle. | Page 1 declares **zero elements of kind `tap: decide`**; the toggle and the portfolio move to page 3 (§31). **Mech:** the page manifest lint. **Cost:** placement only. **Settles:** the lint over page 1's spec. **Row:** §D placement (new). |
| Phone notifications | The only thing allowed to take attention unasked. | IN §14 — three interruptions a day **(FIN)**. | **IMPROVE** — the budget is designed; **the transport is named nowhere**. | `bin/bell`, a no-model program, is the only thing that may ring: it reads the `wake-me` classes, the budget and the per-channel acted-on rate. Sibling of the Sender in shape. **Mech:** `bin/bell` (ABSENT); Remote Control push is one candidate carrier **(X: §14.13)**. **Cost:** one program, one channel choice. **Settles:** acted-on rate per channel over the first thirty wakes. **Row:** new. |
| Approval-via-phone | Deciding from the pocket with no approve verb. | RENAMED — a *which*, both options built; a silent run cannot ask (v9). | **KEEP** — structural, not stylistic. | — |
| Voice output tool | The briefing heard, not read. | IN §14 — read aloud; voice binds nothing (v29). | **IMPROVE** — no mechanism, and it is among the cheapest things here. | The briefing renders to text and a macOS binary speaks it: no model, no network. **Mech:** `say` behind `bin/brief --speak` (ABSENT) — the *macOS binary tools* class §03 already admits. **Cost:** one flag. **Settles:** whether the founder plays it twice. **Row:** none. |
| Audio playback tool | The raw work played. | IN §14 — raw work, biggest first. | **KEEP** — same rule as showing the render. | — |
| Redirect verb | Steering without killing, and learning from it. | IN §14 — logged as a defect **in the brief**, never against the run. | **KEEP** — the attribution is the idea. | — |
| Edit-arguments verb | Changing what a run may do, from a surface. | IN §14 — a typed verb on the desk strip. | **IMPROVE** — editing arguments is editing a grant, and v34 says one thing composes argv. | The verb writes **a new brief**, never argv; `bin/run` recomposes and may narrow, never widen beyond the band. **Mech:** `bin/run` (ABSENT) refuses surface-supplied argv; `bin/probe` asserts the result. **Cost:** one refusal path. **Settles:** attempt a widening edit and read the probe row. **Row:** v34 tightened (new). |
| Morning briefing surface | Opened, so never an interruption. | IN — page 5's strip plus a published phone page (v38). | **KEEP** — *what I could not check* is the field to defend. | — |
| Walkthrough surface | The system explaining itself from its state. | IN §14.8 — engines, gates, stores, live rather than drawn. | **KEEP** — cheap because one state. | — |
| Q&A surface | Ask anything, and check the answer. | IN §14.8 — four ways in, four depths. | **IMPROVE** — the one element a model writes, so the one that can invent. | An answer renders only with the log row or memory item ids it rests on; zero citations renders as *I cannot answer that from the log*. **Mech:** a resolver of the shape `check-citations.mjs` already has (846 lines, exists), pointed at log ids. **Cost:** one resolver, one render rule. **Settles:** sample twenty answers, count uncited assertions. **Row:** new. |
| Interrupt policy | When the machine may speak. | IN §15 — sterile on the Floor, detected by phase. | **KEEP** — detected, not declared. | — |
| Do-not-interrupt window | The same rule as a period. | IN §15 — the same sterile state. | **KEEP** — one mechanism, not two. | — |
| Mobile app surface | Does the phone need a build pipeline. | RENAMED — the website on the phone. | **KEEP** — an app is a pipeline for a page. | — |
| Slack/chat surface | A second inbox for one person. | REFUSED §14 — adds a place to miss things. | **REFUSE-STANDS** — right as a surface. **Caveat:** Slack and a PR comment are the **only two human-free Codex cloud triggers with vendor documentation** **(X: cloud.md)**, so this must not be read as refusing a dispatch seam if §I row 15 lands there. | — |
| Email digest surface | A digest away from the decisions. | REFUSED §14 — the briefing is the digest. | **REFUSE-STANDS** — a digest away from taps is a report. | — |
| API surface | What another program reads. | RENAMED — *the event log is a file anything can read*. | **RETHINK** — asserted as the contract, **with no declared schema**. Four consumers already depend on its shape: page 3's join to the price table by `gen_ai.*` names, the writer into pixel-agents' `AgentEvent` model (**schema UNVERIFIED**, §14.4), the phone pages, the meter. Four readers will infer four contracts. | One `keel/shared/schemas/event.yml`, a `schema_version` on every row, and `bin/log` — already the single writer — refusing a row that fails it. **Mech:** `bin/log` with `F_FULLFSYNC` (ABSENT). **Cost:** one schema, one validation in one writer. **Settles:** replay `~/.agentvibe/events.jsonl` (3,843 rows, 1.1 MB **(X: §14.6)**) and count failures. **Row:** new, under §D. |
| Webhook surface | How the world reaches in. | RENAMED — one inbound row from the world's door (v36). | **IMPROVE** — the door's shape is decided, its **transport** is not, and **nothing lifts an inbound `bind`** under the armed sandbox **(X: §15.8)**. | The door is a launchd program like the Watch and the Sender, and **prefers polling wherever a vendor offers it**; an inbound endpoint on a laptop needs a tunnel and a public name — a second attack surface for one founder. **Mech:** `bin/door` (ABSENT) under its own LaunchAgent. **Cost:** naming it, plus one plist. **Settles:** research question 3. **Row:** v36 gains its transport (new). |
| Public status page | A surface for an audience we lack. | OUTSIDE — a venture may build one. | **REFUSE-STANDS** — the harness has no audience. | — |
| *(lane-added)* **Surface authentication** | Who may open the page that dispatches. | **ABSENT.** v39 puts mission control on *"the local server, over the founder's own network"*, and **no line in §14, §15 or §D says how it authenticates a caller.** Page 4's drag launches a session; page 7 launches one with a chosen agent and model; every tap opens a terminal. | **ADD** — the only surface that dispatches is the one with no identity check. | Bind `mission-control/` to loopback only; one keychain-held token on every route that writes; the phone reaches it through an authenticated tunnel, never a LAN bind. **Mech:** listen address plus a write-route check; `bin/probe` asserts the bind address. **Cost:** one config line, one middleware, one tunnel decision. **Settles:** `lsof -nP -iTCP -sTCP:LISTEN` — `127.0.0.1` or `0.0.0.0`. **Row:** new under §D; escalate to the founder. |

---

## 11 Runtime

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Host environment | One Mac, lid open, on power. | IN §15.1 **(F)**, with v56's one exception. | **KEEP** — the wall is named, not assumed. | — |
| Version-control substrate | What survives a dead machine. | IN §15.3 — git for everything known. | **KEEP** — plain files, a push per run. | — |
| Process scheduler daemon | What runs when nobody watches. | IN §15.2 — a LaunchAgent, `StartInterval` never `KeepAlive`, crash-only ticks **(FIN)**. | **KEEP** — six facts that change the code. | — |
| Sleep-prevention daemon | Staying awake for work that must finish. | IN §15.2 — `caffeinate -i` time-bounded; **only `pmset -a disablesleep 1` prevents lid sleep**; `pmset` deferred to build **(F)**. | **IMPROVE** — the night is undefended and starts anyway. | The Watch **refuses a night lane it cannot keep awake**: it reads live power assertions at the tick and writes the refusal to the briefing instead of starting work that will die. **Mech:** `pmset -g assertions` read by `bin/watch` (ABSENT). **Cost:** one read, one branch. **Settles:** close the lid mid-lane, count runs ending with no handover. **Row:** new under §D.2. |
| Power-management daemon | Changing the founder's own machine. | FOUNDER'S §15 — deferred to build. | **KEEP** — correctly the founder's. | — |
| Active workflow count | What is running, truthfully. | IN §14.5 — page 2, from agent teams' `config.json` **(X: surfaces.md)**. | **IMPROVE** — **one team per session, no nested teams** **(X: surfaces.md)**, so the count is structurally partial. | The census is `claude agents --json --all` joined to `keel/logbook/sessions.jsonl`; `config.json` only enriches with tmux pane ids. **Mech:** page 2's collector reads the two in that order. **Cost:** one collector change. **Settles:** one team plus two `-p` children, compare the page to `ps`. **Row:** v13's carrier table gains a census source (new). |
| Idle workflow count | Who sleeps, and whether that is a problem. | IN §14.5 — the vendor's panel already orders it this way **(X: surfaces.md)**. | **KEEP** — the ordering already ships. | — |
| Session-only cron | A loop needing an open session. | RENAMED — `/loop` refused (v12): session-scoped, 7-day expiry, fires only while idle **(X: runtimes.md)**. | **REFUSE-STANDS** — not a supervisor. | — |
| Cron expiry policy | Nothing recurring without a stop date. | IN §15 — horizons on everything durable. | **KEEP** — same rule as claims and skills. | — |
| Scheduler gap | The ticks a sleeping Mac missed. | IN §15.2 — `StartInterval` **coalesces**, so a slept Mac fires once. | **IMPROVE** — right for a tick, **wrong for a standing intent**: v55's `every:` cadences vanish silently and nothing says so. | A standing intent carries `catch_up: yes\|no`; the Watch compares the last tick against each cadence and either runs the missed one or names it skipped in the briefing. **Mech:** one optional field on the intent schema, read by `bin/watch` (ABSENT). **Cost:** one field, one comparison. **Settles:** sleep across two cadences, read the briefing. **Row:** v55 gains a third optional field. |
| Model access denial | Unreachable must look like a stop. | IN §9 — blocked, never a silent downgrade; a model with no price row is refused, not scored zero. | **KEEP** — refusal beats a zero. | — |
| Loopback-only model | A model on this machine, reached over a socket. | IN §9, v20 — MiniLM and Qwen3-0.6B, Apache 2.0, *"no window at all"*. | **RETHINK** — **the tier has no reachable carrier, for two independent reasons.** (1) Every local runner is an HTTP server on loopback, and the armed sandbox **denies a loopback `bind()`** — `EADDRINUSE` with `errno: 0` where the real macOS error is 48 — with **no setting for inbound or loopback** in its network model **(X: CLAUDE.md, measured 2026-08-24)**. (2) The tier's consumer, `curator`, carries **no `Bash` and no MCPs** (§B.2 row 13), so it could not call one if it were listening. | The local tier is **a no-model program, not a service an agent calls**: `bin/embed` and `bin/classify` run in the Watch's launchd context, outside the Bash sandbox, and hand the curator a file — v47's shape, where `bin/reconcile` computes and `analyst` reads. **Cost:** two small programs; no grant changes. **Settles:** research question 1. **Row:** v20 gains its carrier (new). |
| Model pin retirement | A model id with an expiry. | IN §9 — Haiku 4.5 retires from 2026-10-15; `ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-sonnet-5` now (v58). | **KEEP** — nearest dated wall, already handled. | — |
| Uninstalled runtime candidate | A runtime designed for and absent. | IN §10 — Codex day one **(F, v5)**; installed at build **(F)**. | **KEEP** — stated absent, not assumed present. | — |
| TTY bug test | What widens Codex past one slot. | IN §10.2, v32 — `codex exec --json`, no TTY, non-trivial prompt, ≥ 0.124.0; #19945 open 130 days, no maintainer reply **(X: runtimes.md)**. | **KEEP** — the test is the plan. | — |
| Model family count | How many vendors we can lose. | IN §9 — three; only Codex publishes numeric per-window quotas **(X: models.md)**. | **KEEP** — L7 owns the diversity case. | — |
| Job-to-model table | Which model does which move. | IN §G.1 — per move, each row naming its trigger. | **KEEP** — triggers, not preference. | — |
| Shutdown behavior | What sleep does to work in flight. | IN §6 — *"resume, not restart"*. | **RETHINK** — **asserted, and nothing performs it.** No engine, program or page reconciles what was running against what is running, so a run killed by sleep leaves a session id, no handover and no row saying so — byte-identical to a run nobody has read yet. | The Watch's tick reconciles `keel/logbook/sessions.jsonl` against `claude agents --json --all`, the tmux session list and the process table: no handover and no process is written **`orphaned`, never `finished`**, then resumed by id or closed with a stated reason. **Mech:** `bin/watch` (ABSENT) plus documented `--attach` / `--session-id` **(X: surfaces.md)**. **Cost:** one tick pass, one outcome value. **Settles:** sleep mid-run, count runs whose last row is a start. **Row:** new under §D.2. |
| Always-on tier | The thing that must never stop. | IN §15.2 — the Watch on launchd; `/loop` cannot be it. | **KEEP** — and it dies at logout, stated. | — |
| Low-power tier | Work costing electricity, not a window. | IN §9, v20. | **IMPROVE** — designed and uncarried; see *loopback-only model*. | The `bin/embed` / `bin/classify` proposal above. **Row:** v20. |
| Cost-ascending home tiers | Cheapest capable tier first. | IN §9 — local, Gemini, Sonnet, Opus, Fable; **v57 makes Fable the default of `builder` and `architect`** **(F, fixed)**. | **IMPROVE** — inside v57, not against it. The row is cheap **only on a cache-dominated workload**, where Fable reads cache at **0.025x** against 0.1x elsewhere **(X: models.md)**, and nothing measures whether builder's workload is one. | The meter emits **cache-read share per agent** as a line the founder already gets; v57 is re-read against it at the charter's horizon rather than re-argued. **Mech:** §16.1's per-run token fields. **Cost:** one line in an existing report. **Settles:** twenty builder runs — near FINAL's measured 89% context share and v57 is cheap; far from it and it is the most expensive row in the plan. **Row:** none; a measurement attaches to v57. |
| Container isolation | Where a run may write. | RENAMED §6 — worktrees; **`git worktree add` cannot complete under the armed sandbox**, exit 128 across `.claude/agents/**`, `.claude/commands/**`, `.mcp.json`, and `allowWrite` does not lift it **(X: CLAUDE.md, measured 2026-08-24)**. | **RETHINK** — v41 gives four agents `isolation: worktree` and the night cannot make one; interactive escalation is unavailable to an unattended run by construction. | `bin/worktree`, a no-model program in the Watch's launchd context outside the Bash sandbox, creates it; **a run never creates its own** and is handed one in its argv. **Mech:** `bin/worktree` (ABSENT) plus the existing `--add-dir` grant. **Cost:** one program, one plist entry. **Settles:** run from the LaunchAgent, check exit 0 and a full checkout — the unsandboxed control is 809 files **(X: CLAUDE.md)**. **Row:** v41 gains its creator (new). |
| Multi-host failover | When the one machine is not there. | REFUSED §15 — *"one founder, one Mac; recovery is a git clone"*. | **IMPROVE** — refused more broadly than the plan behaves: §15.1 already names **a second host** for Watch, Sender and log, and v56 admits a cloud lane. | Narrow it to what is refused: **no automatic failover, and no second host holding credentials** — the box is bought after the first measured overnight and takes only the three no-model parts, because it **relocates the credential problem rather than solving it (FIN)**. **Cost:** none. **Settles:** the first measured overnight, already the gate. **Row:** none; §15.1 restated. |
| Runtime health monitor | Knowing the machine lives, from outside its own story. | IN §4 — the Watch's cheap pass. | **IMPROVE** — a pass reading only our own log is rung 4 by this plan's ladder. | Fold into the reconciler and give it one external reading: the process table and tmux session list are not written by us. **Cost:** included above. **Settles:** `SIGKILL` a child and see whether the page notices without our log. **Row:** as *shutdown behavior*. |

---

## 17 Deployment & DevOps

**(N) The framing, before the rows.** v2 marks seven of nine OUTSIDE because deployment is a venture's work. That
held while the first venture was hypothetical. **v64 makes the harness itself the first venture (F)**, and the
harness deploys by editing the programs that dispatch, send and supervise — the one class this repository already
blocks from day one, *harness self-edit*, because `git revert` does not undo it **(X: CLAUDE.md)**.

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| CI/CD pipeline | The check before anything lands. | OUTSIDE for ventures; the harness's own exists — `run-checks.mjs`, 48 steps, a partial run cannot wear a passing verdict **(X: §18.1)**. | **KEEP** — the venture's exit code is already builder's first anchor. | — |
| Staging environment | Somewhere to exercise a program before it governs real work. | OUTSIDE §12 — the venture builds it. | **ADD** — the Sender, Watch, door and `bin/run` have **no test seam**, and a Sender defect is an outward act that cannot be recalled after its window. | A **scratch house**: `keel/` instantiated into a temp directory with a fake venture, fake obligations and a Sender whose egress is a file, exercised as an obligation with a recorded result — §15.4's restore-drill shape. **Mech:** `bin/drill` (ABSENT) plus `keel/fixtures/`. **Cost:** one fixture tree, one runner. **Settles:** the drill produces a number. **Row:** new under §D.2. |
| Blue-green deploy | Swapping a running thing without dropping its work. | OUTSIDE §12 — a pointer swap makes deploy two-way. | **IMPROVE** — narrow it to the house's long-running programs, where it is nearly free. | The supervisor swaps `bin/watch` and `bin/send` **only at a tick boundary**, which costs nothing because every tick is already crash-only **(FIN, §15.2)**. **Mech:** `bin/supervise` (ABSENT) compares a version stamp at tick start. **Cost:** one comparison. **Settles:** upgrade mid-night, check no tick is half-applied. **Row:** new under §D.2. |
| Canary release | A fraction of traffic on a new version. | OUTSIDE §12. | **REFUSE-STANDS** — no traffic to fraction. | — |
| Rollback automation | Undoing without a person. | IN §12 — *"undo is deliberate, never automatic"*. | **KEEP** — an automatic undo is an unwatched second actor. | — |
| Infra-as-code | The machine's configuration as a checked file. | OUTSIDE §12. | **RETHINK** — **the Mac is infrastructure and is not code.** The plist, the managed settings file the founder writes by hand (§I row 8), `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (v59), `ANTHROPIC_DEFAULT_HAIKU_MODEL` (v58), the sandbox block and `denyRead` list, and the macOS grants are all set once by hand and checked by nothing after. | `keel/host/` holds the plist, the managed-settings template, the env file and the expected grant list; **`bin/probe` asserts the live machine matches**, on the pass that already asserts what a run can touch. **Cost:** one directory, one probe section. **Settles:** flip one setting by hand — does the probe say so before a run does. **Row:** new under §D.2; the lane's first proposal. |
| Feature flag system | Behaviour on without a release. | OUTSIDE §12 — venture work. | **REFUSE-STANDS** for ventures. **(N)** The host's own flags are not features; they belong in `keel/host/`. | — |
| Environment parity check | Is the machine what we think it is. | OUTSIDE §11 — a venture's rung-1 anchor. | **ADD** for the house — the assertion half of `keel/host/`; without it the manifest is a wish. | **Mech:** `bin/probe` (ABSENT) gains a host section and fails loudly, as it does for grants. **Cost:** included above. **Row:** with `keel/host/`. |
| Dependency vulnerability scan | Is what we depend on already broken. | IN §11 — a rung-1 anchor, run nightly. | **KEEP** — external, dated, cheap. | — |

---

## 19 Growth & external comms

**(N) One fact governs the section and is not stated in it.** v54's wave one is eight agents and contains **neither
`writer` nor `growth` nor `steward`**. Every row below is unowned on day one, and inbound contact still arrives.

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Public changelog | Saying what changed to people who are not the founder. | IN §12 — drafted alone, published never without a tap. | **IMPROVE** — for the first venture it is nearly free and currently unwritten. | Generate the harness's changelog from the ledger's dispositions and the run handovers, staged like any outward artifact; nothing new is authored. **Mech:** `scripts/ledger.mjs` (exists, 1,531 lines) plus the logbook. **Cost:** one generator. **Settles:** can a cold reader say what changed from it alone. **Row:** none. |
| User feedback channel | A stranger's words reaching us safely. | IN §12 — an event row from the world's door, read by `scout` (v36). | **KEEP** — the trifecta applied to inbound text. | — |
| Support escalation path | Who answers when something is owed to a person. | IN §5 — door and `scout` read, `steward` writes the obligation, `writer` drafts, the Sender sends (v36). | **IMPROVE** — the chain names three agents and **none exists in wave one** (v54). | Name the wave-one fallback: inbound rows become **obligations owned by the founder**, materialised by the Watch (v44), and the reply is written on the Floor. Nothing autonomous answers a person until `steward` and `writer` are online. **Mech:** `bin/check-stores` refuses an obligation whose named owner has no agent file. **Cost:** one refusal. **Settles:** send one message to the door in wave one and see where it lands. **Row:** v54 gains a stated consequence (new). |
| Marketing content pipeline | Content as work with a done-test. | RENAMED §2 — `writer` owns craft, not a pipeline. | **KEEP** — a pipeline is a playbook with a schedule. | — |
| Community management | Present somewhere without being autonomous there. | IN §12 — drafted and staged; every send is a tap. | **KEEP** — first contact with a stranger is `never`. | — |
| Partner integration requests | An inbound request becoming work. | IN §2 — arrives through a door, becomes a proposal. | **KEEP** — proposals, never work. | — |
| Press/PR protocol | The highest blast radius outward act. | IN §12 — drafts and stages everything, sends nothing alone. | **KEEP** — recall window sized to blast radius. | — |
| Brand guideline enforcement | Does this sound like us. | IN §11 — *"a rung-2 check against the profile in venture memory"*. | **RETHINK** — a model judging a model's output against a document it also drew from: the closest thing in the plan to grading its own homework, which §11 refuses everywhere else. | Make it a **discrimination test**: the founder labels a small held-out set of approved and rejected artifacts once; the check must rank held-out approved above rejected before it may judge anything new, and its measured rate prints beside every verdict. **Mech:** §E.2's with-skill-against-baseline runner (`bin/skill-eval`, ABSENT), pointed at taste. **Cost:** one labelling pass, one runner reuse. **Settles:** the discrimination rate — below chance, the check is deleted rather than tuned. **Row:** new under §E.2. |

---

## 31 Multi-venture portfolio

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Non-24/7 venture mode | Most ventures asleep most of the time. | IN §2.1 — `tempo: driven \| attended \| watching \| parked` **(FIN)**. | **KEEP** — the founder's distinction made structural. | — |
| Venture activity toggle | Changing tempo in one act. | IN §14 — *page 1 gives each venture an area, and the toggle is a tap on it*. | **IMPROVE** — collides with §14.4's own rule that page 1 is **never where a decision is made**. Two rules, one page, disagreeing. | The toggle lives on page 3's portfolio strip; page 1 keeps venture areas as a **display** and taps only to a terminal. **Mech:** the §10 page-manifest lint. **Cost:** placement. **Settles:** the lint. **Row:** §D placement (new). |
| Idle-venture hibernation | Stopping without losing. | IN §2 — parked, with the date and what would bring it back. | **KEEP** — the return condition is the useful half. | — |
| Venture wake trigger | What may restart a sleeping venture. | IN §2 — watching produces proposals; promotion is a tap. | **KEEP** — no self-promotion. | — |
| Cross-venture resource pool | One seat, many ventures. | IN §16 — one seat, two windows, shared with Claude chat and Cowork (v22). | **RETHINK** — **per-venture ceilings do not compose.** Two ventures can each sit inside their ceiling and jointly exhaust the seat; the founder's reserve is what disappears. A ceiling is being used as an allocation. | The Desk holds the **reserve first, at portfolio level**, then allocates remaining window share by the charter's `weight` (1–5); a ceiling is **a cap, not an entitlement**, and the last increment before the reserve line is refused whoever asks. **Mech:** one term in `bin/watch`'s ranking (ABSENT); §16.6's rope already refuses per venture. **Cost:** one ranking term. **Settles:** run two driven ventures to their ceilings — did the reserve survive. **Row:** v22 gains a portfolio term (new). |
| Shared-agent time-slicing | Agents are files; the window is scarce. | RENAMED §16 — the reserve per window and the WIP limit. | **KEEP** — the right correction to the metaphor. | — |
| Per-venture budget isolation | One venture cannot spend another's. | IN §16 — a ceiling per venture, recomputed before each act. | **IMPROVE** — true for money, **not for the window**, per the row above. | Say which is isolated: money genuinely is, because the Sender rejects at the ceiling; window share is contended and arbitrated by weight. **Cost:** none beyond the row above. **Row:** v22. |
| Per-venture priority weight | The founder's ranking, machine-read. | IN §4 — the charter's `weight` feeds the Desk. | **KEEP** — and it becomes load-bearing above. | — |
| Portfolio dashboard | Every venture at once, acting on one. | IN §14 — *"page 1 is the portfolio, and page 3 carries per-venture spend"*. | **RETHINK** — page 1 cannot be both. It is a **room governed by prohibitions** — no notifications, no badges, never where a decision is made **(FIN, kept by §14.4)** — and simultaneously the portfolio with a toggle. **(FIN)** *A beautiful surface will always win the argument against a useful one*, which is §14.4's own reason for the prohibitions, and this is how it wins. | The portfolio is **page 3's top strip**: one row per venture — tempo, spend against both windows, whether intents advanced, and the taps that retempo or park. Page 1 stays a room. **Mech:** the §10 page manifest makes the split checkable rather than remembered. **Cost:** placement plus one strip. **Settles:** the lint, plus whether the founder retempos from page 3 or page 1. **Row:** §D placement (new). |
| Venture health snapshot | Is a venture moving. | RENAMED §14 — tempo, spend, whether intents advance; **not a composite**. | **KEEP** — refusing one health number is right. | — |
| Venture comparison view | Ventures side by side. | IN §14 — page 3 per venture, each number a tap (v14). | **KEEP** — and the row above gives it a home. | — |
| Dormant-venture archive | Nothing deleted to tidy up. | IN §2 — parked and archived, never deleted. | **KEEP** — same rule as the decisions archive. | — |
| Venture reactivation checklist | Waking a venture safely. | IN §2 — a tap, plus a `scout` pass on adoption. | **IMPROVE** — a long-parked venture carries expired dates and promotion walks past them. | `bin/check-stores` **refuses promotion to `driven`** while the charter is past `horizon`, an obligation is past its date, or a relied-on memory item is past `valid_until`; each needs one recorded disposition first. **Mech:** `bin/check-stores` (ABSENT) reusing the ledger's forced-disposition shape (`scripts/ledger.mjs`, exists). **Cost:** one refusal path. **Settles:** park a venture, let a date pass, attempt promotion. **Row:** new under §D.2. |
| Shared skill library across ventures | One library, not one per venture. | IN §7 — the house root only; ventures carry no skill directory (v48). | **KEEP** — one source, two generated directories. | — |
| Cross-venture learning transfer | What one venture learns, another uses. | IN §13 — promotion with provenance and reversibility. | **KEEP** — provenance makes it reversible. | — |
| *(lane-added)* **Venture wind-down** | How a venture ends, rather than sleeps. | The charter's `horizon` forces a re-read **(FIN)** and **nothing says what the re-read must produce**. A portfolio with no ending accumulates parked ventures, and the Desk ranks a longer list every tick. | **ADD** — the portfolio layer has a pause and no stop. | At the horizon exactly one disposition is recorded — **continue · park · wind down** — mirroring the ledger's Refresh · Deprecate · Waive; a wind-down archives, never deletes. **Mech:** `bin/check-stores` refuses a charter past horizon with no disposition; §14's founder-facing wind-down protocol is L2's. **Cost:** one field, one refusal. **Settles:** count charters past horizon with no disposition. **Row:** new under §D.2. |

---

## 32 Mac environment and local runtime

| Keyword | Reading | v2 | Verdict | Proposal · mechanism · cost · settles · row |
|---|---|---|---|---|
| Claude Code host | The runtime the Operator and Floor live in. | IN §15 — installed, 2.1.261 measured **(X: §15.6)**. | **KEEP** — the one runtime present. | — |
| Codex CLI integration | A second family on this machine. | IN §10 — day one **(F, v5)**, foreground checker (v32); not installed yet. | **KEEP** — position and admission test stated. | — |
| Gemini CLI integration | A third family burning a different window. | IN §9 — routine scouting and the summarising half; installed 0.38.2, **never authenticated** **(X: §15.6)**. | **IMPROVE** — the free tier's **60 requests/min and 1,000/day** **(X: models.md)** is a hard published bound nothing routes against. | The price table carries Gemini's quota as a **count**, not a price; the Desk stops routing routine work there once the day's count is spent rather than failing mid-run. **Mech:** the meter counts requests per family; `bin/watch` reads it. **Cost:** one counter. **Settles:** one day of routine scouting against 1,000. **Row:** §G.2 gains a countable quota (new). |
| Local model runner | Where the free tier runs. | IN §9, v20 — MiniLM and Qwen3-0.6B, Apache 2.0. | **RETHINK** — as *loopback-only model*: the sandbox denies a loopback `bind()` and `curator` has no `Bash`. | `bin/embed` and `bin/classify` as no-model programs in the Watch's context, handing the curator files. **Settles:** research question 1. **Row:** v20. |
| macOS permission grants | The OS's own consent, revoked silently. | IN §15 — *"measured, and stated as measured"*. | **IMPROVE** — measured once is not asserted since. | The expected grant list lives in `keel/host/`; `bin/probe` asserts each by attempting the operation, not by reading a database. **Cost:** one probe section. **Settles:** revoke one grant — does the probe fail before a run does. **Row:** with `keel/host/`. |
| launchd scheduling | The supervisor that is ours. | IN §15.2 — a LaunchAgent, run as the founder's user. | **KEEP** — and it dies at logout, stated. | — |
| Menu-bar agent status | A glyph in the corner. | IN §15 — *"a glyph: running, waiting on you, or stopped"*. | **RETHINK** — **no substrate is named**, so it is either a new dependency through the tool door with a licence to read, or a wish; and it duplicates the cord and the phone, which this plan says is how two statuses come to disagree. | Delete it, or admit a substrate through the door like any tool. **Recommended: delete** — a browser tab and the phone already carry it. **Cost:** negative. **Settles:** whether the founder asks again once pages 2 and 3 exist. **Row:** none. |
| Local file system access | What a run may touch. | IN §12 — scoped per grant; the write boundary is the session project root **(X: measured)**. | **KEEP** — L3 owns it; correctly stated. | — |
| Keychain credential storage | Secrets never in a file a run reads. | IN §15.4 — references not values; `denyRead` over the credential stores, pinned by `npm run test:sandbox`. | **KEEP** — one of the few controls that exists today. | — |
| Background process management | Killing what is hung, not only what exited. | IN §15 — `tmux kill-session` plus a **process-group kill**, because a timeout that kills a child while its grandchild runs does nothing **(FIN)**. | **KEEP** — the grandchild sentence is the row. | — |
| Battery/power-aware scheduling | Not starting work the machine cannot finish. | IN §15 — *"the wall is named rather than worked around"*. | **IMPROVE** — naming a wall is not refusing to walk into it. | As *sleep-prevention daemon*: the Watch reads power assertions and refuses a night lane it cannot keep awake, saying so in the briefing. **Row:** as §11. |
| Sleep/wake handling | Surviving a sleep rather than being ended by one. | IN §15 — *"resume makes a sleep survivable rather than fatal"*. | **IMPROVE** — asserted, uncarried; see *shutdown behavior*. | The wake reconciler. **Row:** as §11. |
| Multi-terminal session management | Many terminals, addressable by name. | IN §14.11, §D.1 — five tmux commands do pop, watch, type, kill; **split panes unsupported in VS Code's integrated terminal, Windows Terminal and Ghostty**; `iterm2` needs the `it2` CLI **and** the iTerm2 Python API **(X: surfaces.md)**. | **IMPROVE** — the page must **name which terminal it opens into**, and one flag question is open. | Two cheap closures: the page declares its target terminal and degrades loudly; someone runs `claude --help` once to settle `-w` / `--worktree` / `--tmux`, recorded **UNRESOLVED** in §14.11 and §15.6. **Cost:** one command. **Settles:** its output. **Row:** none — an UNRESOLVED closes. |
| Local-first privacy mode | Nothing leaves unless a person said so. | IN §13 — *"a default, not a mode: mining and indexing never leave the machine"*. | **IMPROVE** — **v56 contradicts it, and the contradiction is written nowhere the founder chooses per venture.** A hosted run clones the repository into someone else's VM **(X: cloud.md — Anthropic's *"the cloud VM clones your current directory's GitHub remote"*; Jules *"clones your code"*)**. | The charter gains one line: `cloud: allow \| deny`, default `deny`; `bin/run`'s `cloud` carrier refuses a venture set to `deny` whatever §I row 15 decides. **Mech:** one charter field checked by `bin/check-stores` and `bin/run` (both ABSENT). **Cost:** one field. **Settles:** it is the founder's per venture — the mechanism makes the decision available rather than making it. **Row:** v56 gains a per-venture switch (new). |

---

## Top 5 proposals of this lane

**1 · `keel/host/` — the machine's configuration becomes a file, and the probe asserts it.** The design rests on host
state set once by hand and checked by nothing: the LaunchAgent plist, the managed settings file the founder writes at
build time (§I row 8), the teams flag (v59), `ANTHROPIC_DEFAULT_HAIKU_MODEL` (v58), the sandbox block and its
`denyRead` list, and the macOS grants. Every unattended night is a bet that all of it is still true. One directory
holds the expected state; one section of `bin/probe` asserts it on the pass that already asserts what a run can
touch. Better because the alternative to a file is the founder's memory of a setting made once. **We would know it
worked** by flipping one setting by hand and seeing the probe name it before a run does.

**2 · Mission control binds to loopback and authenticates.** v39 puts the website on *"the local server, over the
founder's own network"*, and no line in §14, §15 or §D says who may call it. That page drags a card into *working on
it* and launches a session with a team; page 7 launches one with a chosen worktree, provider, model and agent; every
tap opens a terminal on the Mac. Bind to `127.0.0.1`, require one keychain-held token on every write route, and reach
the phone through an authenticated tunnel rather than a LAN bind. Better because this is the only surface that
dispatches, and the permission system that governs agents governs nothing about a browser. **We would know it
worked** from a loopback bind in `lsof`, and from the probe carrying the bind address as a row.

**3 · The wake reconciler: `orphaned` is not `finished`, and a night lane does not start on a machine that will
sleep.** §6 says *resume, not restart*, and nothing performs the resume; a run killed by sleep leaves a session id,
no handover and no row saying so, which is byte-identical to a run nobody has read yet. One pass in the Watch's tick
reconciles our session log against `claude agents --json --all`, the tmux session list and the process table, writing
`orphaned` where there is no handover and resuming by id where it can — plus a refusal to start a night lane when the
power assertions cannot promise wake. Better because it is the difference between a system that reports what happened
and one that reports what it started. **We would know it worked** by sleeping the Mac mid-run and counting runs whose
last row is a start.

**4 · The local tier gets a carrier, because the one it has does not exist.** v20 sends embeddings, classification,
dedup, PII detection and the first transcript pass to local models *"on electricity"*, and two measured facts sit
between that decision and any execution: the armed sandbox **denies a loopback `bind()`** with no setting anywhere in
its network model for inbound or loopback, and the tier's designated consumer, `curator`, carries **no `Bash` and no
MCP server**. Make the tier no-model programs — `bin/embed`, `bin/classify` — running in the Watch's launchd context
and handing the curator a file, which is exactly v47's shape where `bin/reconcile` computes and `analyst` reads. Two
small programs, no agent's grant changes. **We would know it worked** from research question 1, and from the
transcript pass completing with the window untouched.

**5 · One contract under the surfaces: a versioned event schema and a fact-or-tap page manifest.** The event log is
described as the API surface and has no schema, while four consumers already depend on its shape — page 3's join to
the price table, the writer into pixel-agents' `AgentEvent` model whose schema is **UNVERIFIED**, the phone pages, and
the meter. In the same move, v14's *every element is a fact or a tap* is prose and §14.4 admits its own prohibitions
are WISH. Two files and one lint: `keel/shared/schemas/event.yml` with a `schema_version` enforced by `bin/log`, the
single writer; and `keel/surfaces/pages/<n>.yml` where every element resolves to a store path or a `bin/` verb.
Better because a contract four readers infer separately is four contracts. **We would know it worked** by replaying
the existing 3,843 rows through the validator, and by the lint finding page elements that are neither.

---

## Top 3 research questions

**1 · Can a sandboxed run reach a local model at all, and in which shape?** Answerable on this Mac in one session with
no vendor involved: run the embedder three ways — as a server started **inside** a sandboxed Bash child, as a server
started **outside** with a sandboxed child connecting to it, and **in process** as a library — each with the sandbox
armed and disarmed, recording exit codes and errno. We already hold the measured fact that an inbound `bind()` is
denied and surfaces as `EADDRINUSE` with `errno: 0`; **whether an outbound connect to loopback is permitted is
unmeasured**, and that one cell decides whether the local tier is a service or a program. *Source class: measurement
on this machine, plus the vendor's sandboxing page for the network model.*

**2 · How many hours is the Mac actually off, and when?** §I row 15 asks the founder which hosted lane may make when
the Mac is off, and nobody has measured what that is worth. Read the sleep and wake log over a representative period
and produce three numbers: hours unavailable, the longest single gap, and how many of those hours fall where a night
lane would otherwise run. A cloud lane buying back a small tail is not worth the terms question of §I row 1; one
buying back most of the week is. *Source class: local measurement (`pmset -g log`); no vendor claim involved.*

**3 · Which inbound sources support polling, and which need a listening socket?** The world's door is decided (v36)
and its transport is not, and one measured fact rules out half the options: **nothing lifts an inbound `bind`** under
the armed sandbox, and an endpoint on a laptop needs a tunnel and a public name. For each source the plan wants —
mail, calendar, drive, notes, the git host, the payment processor — does the vendor document a polling read with a
cursor or change token, or only a webhook? The answer decides whether the door wakes and reads, or must be reachable
from the internet. *Source class: vendor API documentation, one page per source, quoted with an access date.*

---

## What the best system in the world would have here that v2 lacks

**(N)** It would treat **the machine's own state as a claim with an expiry**, exactly as this repository already
treats a fact, a skill and a citation. Every other durable statement in the plan carries a date and a forced
disposition; *the sandbox is armed, the teams flag is on, the managed file says what it said, the grants are still
granted* carries neither, and it is the statement the whole unattended half rests on. **(N)** It would have **one
written contract for the event log**, because a log with four readers and no schema is a distributed system with no
protocol.

**(N)** It would keep **the room and the console separate** and never let them merge. **(FIN, §14.4)** *A beautiful
surface will always win the argument against a useful one* — and v2 asks page 1 to be both the room and the portfolio
with a venture toggle on it, which is exactly how that argument gets won. **(N)** It would have **one authenticated
entry point**, and a dispatching website with no stated identity check is the largest hole in this field; **(X:
§15.8)** the sandbox is a guardrail against accident and not containment, so nothing else stands behind that page.

**Where my field breaks, by scale.**

- **10 ventures.** *At most two driven* **(FIN, row 14)**, so ten means eight watching or parked, the portfolio
  becomes the primary surface, and the room is unreadable at one area per venture. **(N)** What breaks first is the
  **Desk's ranking**, not a surface: eight ventures producing proposals plus standing intents on cadences (v55) make
  ranking the product. Owned by §4; my field's smallest change is the portfolio strip of §31.
- **50 concurrent sessions.** Not reachable through documented mechanisms: **20 concurrent subagents is a vendor cap**
  with *"Concurrent subagent limit reached"* on overflow, and there is **one team per session with no nested teams**
  **(X: runtimes.md, surfaces.md)**. Fifty would be fifty `-p` children, each a tmux session and a full context.
  **(N)** What breaks first is not the Mac or tmux but the seat — two windows shared with Claude chat and Cowork
  **(X: models.md, v22)**, with no published numeric quota to plan against. Second is page 2, whose join key is a
  per-team `config.json` *"overwritten on the next state update"*.
- **A second human.** **(F, v65)** the founder only, for now — protected by nothing, because the surface has no
  identity at all. **(N)** The moment a second person exists, *every tap opens a terminal on the Mac* becomes *every
  tap opens a terminal on someone else's account*, and proposal 2's token is the cheapest thing that survives it.
- **A year of logs.** `~/.agentvibe/events.jsonl` is 1.1 MB and 3,843 rows **(X: §14.6)**, and page 3 joins it to the
  price table on every render. **(N)** An append-only file read whole per page load is fine now and is the first
  thing to fail after a year of nights. Smallest change: the same no-model logger writes a daily partition and a
  rollup, and **no surface reads the raw file** — which proposal 5's schema enables without a database, and §15.3's
  warning that a page holding a WAL query open starves the checkpoint is the reason not to reach for one.
- **A second Mac, or the founder away.** **(N)** §15.1 already answers it — Watch, Sender and log on an always-on
  box, runs wherever they are cheapest — and the honest limit is that the box **relocates the credential problem
  rather than solving it (FIN)**.

---

## What I would delete

- **The menu-bar glyph** (§32). No substrate named, a new dependency if built, and it duplicates the cord and the
  phone — and this plan's own rule is that a status living in two places is one that disagrees.
- **Page 1's second job.** Not the page: the room is decided (v62) and cheap. Delete its role as the portfolio and
  the venture toggle, which §14.4's own guard rails already forbid.
- **The phrase *"resume, not restart"* as it stands** (§6), unless proposal 3 is built. **(N)** A rule with no
  carrier is worse than an absent one, because a reader budgets for it. Either the reconciler exists, or the plan
  says a run interrupted by sleep is lost and is re-dispatched from its intent.
- **The blanket OUTSIDE on §17.** Keep it for ventures; stop using it as the reason the house needs no staging, no
  parity check and no version discipline for the programs that dispatch, when **v64 makes the harness the venture**.
- **Slack and the email digest stay refused — but re-read one of them once.** *Slack as a surface* and *Slack as one
  of only two documented human-free Codex cloud triggers* **(X: cloud.md)** are different objects; if §I row 15 lands
  on Codex cloud, the second returns as a dispatch seam, never as an inbox.

---

## Verdict count

**94 founder keywords across six sections, plus 2 rows this lane added.**

| Verdict | Count |
|---|---|
| KEEP | 49 |
| IMPROVE | 27 |
| RETHINK | 10 |
| ADD | 4 (2 from keywords · 2 lane-added) |
| REFUSE-STANDS | 6 |

Per section — **10 Surfaces** 12 K · 8 I · 1 R · 3 RS · 1 A · **11 Runtime** 13 K · 7 I · 3 R · 1 RS ·
**17 Deployment** 3 K · 1 I · 1 R · 2 A · 2 RS · **19 Growth** 5 K · 2 I · 1 R · **31 Portfolio** 10 K · 3 I ·
2 R · 1 A · **32 Mac** 6 K · 6 I · 2 R.

**Nothing here was built, installed, run, spent or pushed.** Every proposed path is ABSENT under v50 — the mechanism
is designed and its path is named — except where a program on this branch is cited as a seed, and those carry their
measured size.
