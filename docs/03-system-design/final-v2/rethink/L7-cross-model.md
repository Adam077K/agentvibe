# L7 · cross-model — the rethink round · 2026-09-06

*Lane: sections **33** cross-model orchestration & review · **34** perspective diversity & bias mitigation ·
**35** open-mindedness & rethink triggers · plus the **contrarian pass on the whole architecture**.*

*Inputs: `parts/00-what-it-is.md` · `SPINE.md` §A–§K · `DECISIONS.md` §15, §17 · `rethink/FOUNDER-LIST.md` ·
`COVERAGE.md` §33–§35 · `parts/{05-roster §5.6–5.8, 09-models, 10-codex-and-claude-code, 11-truth, 13a-self-improvement}.md` ·
`research/runtimes.md` whole, the rest by grep. Founder rows v1–v5 and v54–v65 fixed. Nothing built, nothing committed.*

**Verdict count — 38 keywords.** KEEP **13** · IMPROVE **16** · RETHINK **4** · ADD **2** · REFUSE-STANDS **3**.

**The lane's finding, and it is the same shape in all three sections. (NEW)** v2's cross-model design is almost
entirely *correct and unmechanised*: *"a second family whenever one is reachable"* appears in six places and is
enforced in none, nothing on a handover or a log row records **which family made or checked a thing**, and so the
anchor ladder's central claim — rung 2 outranks rung 4 — is **unfalsifiable in this system as designed**. Four fields
fix that, and every other proposal here depends on them.

---

## 33 · Cross-model orchestration & review

| Keyword | Reading — for one founder, unattended at night, walking by day | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Model-per-task routing** | which vendor and which model does this move, decided **before** the run and never by the run | `IN` §9 — §G.1 / 9.2, per move, each row naming its trigger (`founder`) | **IMPROVE** | **One decision, three homes.** §B.2's *"The Operator routes here when"*, §C.1's band table and §9.2's per-move rows each answer *which agent, which model, which band* — and this repo has already paid for two implementations of one classification (**FACT:** CLAUDE.md, `scripts/classify.mjs` header, *"Two implementations of risk classification will disagree, and you find out during the incident"*). Generate all three from one machine-readable file. **Mechanism:** `keel/shared/routing.yml` (ABSENT) as the only source; `bin/run` reads only it; the prose tables are generated — the cure v45 already applied to the brief schema. **Cost:** one file, one generator, three tables become derived. **Settles:** a lint that fails when a prose table diverges, same shape as `check:manifest` (EXISTS, this branch). **Row:** new row; cites v45's precedent |
| **Cross-model review pass** | the family that made a thing does not certify it | `IN` §11 — §11.3, *"whichever family made the artifact does not check it"* | **IMPROVE** | **The rule has no mechanism and cannot acquire one, because nothing records the family.** No handover field, no log attribute. Add `maker_family`, `maker_model`, `checker_family`, `checker_model` to the handover schema and to every event-log row; `bin/run` refuses to route a check to the maker's family when another is reachable, and stamps **rung 4** when it cannot. **Mechanism:** four fields on `keel/shared/schemas/brief.yml`/handover (ABSENT, v45) + one refusal in the launcher. **Cost:** four fields, one refusal. **Settles:** grep the log for a check where `checker_family == maker_family` and the row is not stamped rung 4 — **zero** is the passing answer. **Row:** moves v30 and §11.3; new fields on v45 |
| **Generator-critic pairing** | the critic is a different process with different inputs, not a second pass by the same one | `IN` §11 — v30, `challenger` | **KEEP** | Self-critique measured harmful; externality mechanised (**FACT:** arXiv 2310.01798 via cognition.md 5, accessed 2026-09-05) |
| **Claude-reviews-Codex** | Codex output is a prepared diff a Claude reviewer reads | `IN` §10 (`founder`) | **KEEP** | Needs no new mechanism; unreachable until Codex is installed (§I row 5, the founder's, at build) |
| **Codex-reviews-Claude** | the **only** rung-2 route the plan actually has on day one | `IN` §10 — v32, foreground, stdout to a file inheriting the parent shell's TTY | **IMPROVE** | **It is a singleton and v2 never prices it as one.** One foreground slot serves every venture and every artifact, so rung-2 availability falls as 1/N in concurrent runs — the second family is scarcest exactly when there is most to check. Make it an explicit lease: take it, or stamp the check **rung 4** and continue; never queue a night behind it. **Mechanism:** `keel/shared/leases/codex.foreground` (ABSENT), taken and released by `bin/run`. **Cost:** one lease file, one stamp. **Settles:** count checks stamped rung 4 for want of the slot over the first nights — if that is most of them, H.2's rehearsal is the priority and not an option. **Row:** moves v32 |
| **Gemini-as-third-opinion** | whether a third vendor judges, or only carries routine load | `RENAMED` §9 — the routine window, not a third judge; unauthenticated today (`fact`) | **IMPROVE** | **Keep the rename; add one narrow judging use.** Gemini is the cheapest **reachable** second family for checks that are not code — factual claims resolving to a fetched source, links returning 200, citation presence, PII flags — all of which §11.2 already lists as rung-1-adjacent work. Routing all of rung 2 through Codex's one slot starves it for no reason. **Mechanism:** one row in the routing table above; `gemini -p --approval-mode plan` is already the composed argv (§10.1). **Cost:** one routing row; the founder act is already decided (§I row 6, personal Google account). Free tier **60 rpm / 1,000 rpd** (**FACT:** models.md, 2026-09-05). **Settles:** run ten known-answer copy checks through Gemini and Claude and compare against the deterministic outcome. **Row:** moves §G.1's Gemini row |
| **Model disagreement resolution** | what happens when two checkers say opposite things | `IN` §11 — the deterministic anchor wins; disagreement with a *passing* rung-1 anchor reaches the founder as a *which* | **KEEP** | Deterministic anchor outranks every model — and *"a model contradicting a test is usually the model — not always"* (§11.3) is the right residue to send up |
| **Consensus-required threshold** | a majority vote among models | `REFUSED` §11 — a vote has no anchor, so there is no threshold to set | **REFUSE-STANDS** | Correct. The replacement — union of findings, **fatal from any family eliminates, scores never averaged** — is bounded against noise by §B.2's reproduction anchors on `reviewer` and `guard`, so union does not become an opinion firehose |
| **Model specialization map** | a durable table of what each model is good at | `RENAMED` §9 — moves not capabilities, *"capabilities move faster than a map"* | **IMPROVE** | The refusal is right and the **rename is the risk**: a renamed thing gets rebuilt. Delete the concept and let a *measured* map replace it — the trust score keyed on `(agent, move class, **model**)` is a specialization map that is generated and therefore cannot rot. **Mechanism:** the trust store (§11.10, ABSENT) gains a model dimension; the rehearsal runner writes it; below the sample floor it prints `insufficient`, which is FINAL §11.10's own rule. **Cost:** one dimension on an already-ABSENT store. **Settles:** its own denominator. **Row:** moves §11.10; new row |
| **Model cost-tier routing** | not everyone on the top tier | `IN` §9 — 2 Fable · 3+1 Opus · 8 Sonnet · 1 split (`SPINE v57`) | **KEEP** | A frontmatter field, not advice; the founder's instruction answered as a table. Standing caveat unchanged: Fable 5.1's subscription reachability is UNVERIFIED and both files carry `claude-opus-5` as the written fallback |
| **Model fallback chain** | where a move goes when its model is limited, unreachable or retired | `IN` §9 — v22: a family limit is a **reroute**, a seat limit is a **stop** | **RETHINK** | **v2 names the distinction and never names the destination.** *Reroute* has no target table, and a seat-limit stop stops the **whole company**, because Codex is a foreground checker and Gemini is scout-only — there is no cross-vendor lane for making. Declare a three-deep fallback per agent whose last rung is *stop and stage*, and record a cross-family reroute as a **rung demotion** unless that family has passed that move class's rehearsal. That last clause is what stops a fallback from silently degrading quality. **Mechanism:** `fallback:` in the agent frontmatter, read by `bin/run` (ABSENT); per-family pass rates come from the rehearsal set (§11.10). **Cost:** one field × 15 files, plus rehearsal cases per family per move class. **Settles:** the provider-outage drill (§34 row 6) — run one night with the primary family denied and count what completed. **Row:** moves v22; new field on the agent schema |
| **Sandbox mode per CLI** | what a run may touch, per vendor, per band | `IN` §12 — §C.1 names Claude Code's mode and Codex's two axes for every band (`SPINE §C.1`) | **ADD** | **The band table is complete on filesystem and silent on network, and the two vendors' network defaults are opposite.** Codex cloud *"blocks internet access during the agent phase"* by default, with three allowlist presets and a `GET/HEAD/OPTIONS`-only option (**FACT:** learn.chatgpt.com/docs/cloud/internet-access via cloud.md, 2026-09-05, H). Claude Code's sandbox is **Bash-only** with an outbound domain proxy and **no inbound or loopback setting** (**FACT:** CLAUDE.md / SANDBOX.md, code.claude.com/docs/en/sandboxing, 2026-08-24). So the *same* `scout` task has a different exposure per provider, and v33/v36's trifecta split is written per **agent** and says nothing per **provider**. Give the taint class a provider axis: a tainted read is routed only to a provider whose network posture for that class is documented. **Mechanism:** `taint_ok:` per provider in the routing table; `bin/run` refuses to route a tainted read to a provider with no documented posture. **Cost:** one field, one refusal. **Settles:** one fetched network-posture page per provider — Codex cloud's is already fetched, Claude Code's is in SANDBOX.md, Gemini's is UNVERIFIED. **Row:** moves v33, v36, §F |
| **Approval-mode per CLI** | who may say yes to an act | `IN` §12 — `never` in every band; no agent performs an outward act (`SPINE §C.1`) | **KEEP** | The Sender is the only outward act and it holds no model; there is no approve verb to configure |
| **Subagent support per CLI** | the depth and concurrency the fleet is bounded by | `IN` §3 — depth 3, 20 concurrent, `Workflow` removed from all (`fact`) | **IMPROVE** | **Those are Claude Code's numbers, and the WIP arithmetic in §D.2 is computed from them alone.** Codex's TOML subagents carry their own sandbox mode and **no published depth or concurrency cap** (**FACT:** runtimes.md, *"not re-read this session"*, prior lane's marks; gap 8). A Codex lane would therefore be unbounded by the same arithmetic that bounds the Claude lane. State the bound per provider and refuse unattended work on a provider with no published cap. **Mechanism:** `concurrency:` per provider in the routing table; `bin/run` refuses to mint above it. **Cost:** one field, one refusal. **Settles:** the Codex config reference and `codex exec --help` on an installed binary (§I row 5). **Row:** moves v13 |
| **MCP-server sharing across CLIs** | one admitted server, two runtimes, **two policy tiers** | `RENAMED` §8 — declarable in both, nothing shared implicitly (`SPINE §F`) | **IMPROVE** | v43 already established that *a claim is made only where its carrier can hold it*. The same is true across **providers**: a narrowing asserted under Anthropic's managed settings is not asserted under Codex's `requirements.toml`, which **outranks every flag** (**FACT:** FINAL §14.6 via runtimes.md, not re-read this session). So "one server, declared in both" is two grants wearing one name. Give v43's grant matrix a **provider axis** and assert each cell per provider. **Mechanism:** the matrix in §12 gains a dimension; `bin/probe` (ABSENT) runs once per provider. **Cost:** the matrix triples; the probe gains an arm. **Settles:** the probe's own output on an installed Codex. **Row:** moves v43 |
| **AGENTS.md shared config** | one instruction file every runtime reads | `IN` §7 — `.claude/skills/` + `.agents/skills/`, one Markdown source, generated artifacts (`SPINE §E.1`) | **ADD** | **The convenience commands that bridge configs are an unreviewed grant change.** `/import` *"appends a one-time copy of instruction files such as AGENTS.md to the matching CLAUDE.md and carries over MCP servers, commands, subagents, and skills"* (**FACT:** code.claude.com/docs/en/memory via memory.md 4, 2026-09-05, H); `claude import codex` / `claude import gemini` read the other vendors' config (**FACT:** runtimes.md, M). Carrying over **MCP servers and subagents** is a capability transfer, and nothing reviews it: §9.3's door governs tools, v53 governs pages, no door governs an import. Refuse both inside the house. **Mechanism:** a `UserPromptSubmit` hook — one of the ten documented **blocking** hook events (**FACT:** runtimes.md, D/medium) — refusing a prompt that begins `/import` or `claude import`. **Cost:** one hook rule. **Settles:** run `/import` in a scratch tree and diff `.mcp.json` and `.claude/agents/`. **Row:** new row; §F's door gains a third kind beside `tool` and `page` |
| **Skills-folder shared config** | one skill artifact, three runtimes | `IN` §7 — `.agents/skills` read by **both** Codex and Gemini CLI; Codex does **not** read `.codex/skills` (`fact`) | **KEEP** | Sourced, one Markdown source, generated artifacts — wshobson's shipped shape (**FACT:** skills.md 11, H) |
| **Session-resume across tools** | a run interrupted on one runtime picked up on another | `IN` §6 — *"`--session-id` is a UUID we mint, and the event log is the shared state"* (`fact`) | **IMPROVE** | **The COVERAGE row overstates a shared id space that does not exist.** Claude Code's `--session-id` *"must be a valid UUID"* and we mint it (**FACT:** runtimes.md, D); Codex's `codex exec resume` takes a `SESSION_ID` **Codex** minted, and no page documents minting one (**FACT:** runtimes.md). Say it plainly: **a run does not resume across providers.** It restarts on the other provider from the same brief, and the handover carries the state. Our `run_id` is the only join key; a provider's own session id is a recorded attribute, never a join. **Mechanism:** the event-log schema; `bin/run` writes both ids. **Cost:** one attribute. **Settles:** `codex exec resume --help` on an installed binary. **Row:** moves the §33 COVERAGE row and §C.4's carrier table |
| **Cross-CLI task references** | one id ties a Codex check to the Claude build it checked | `IN` §14 — one intent id and one run id on every row | **KEEP** | One logbook, no second source of truth — with the row above folded in: our id joins, theirs is recorded |
| **Interrupt-hook handling** | the founder can stop anything, on any runtime, at any hour | `IN` §12 — *"the cord is read first, every tick"* (`SPINE §C.2`) | **RETHINK** | **The cord's guarantee is not uniform across carriers, and v2 already knows it.** Cancelling a Codex cloud task is **UNKNOWN** — it appears in neither the commands #24777 says exist nor the ones it requests, and no vendor page mentions it (**FACT:** §10.6 gap 14 / cloud.md). `-p` children, teammates and subagents each stop by a different mechanism, and §10.6 names the hole and leaves it named. Turn it into a refusal: state the stop path per carrier, and make `bin/run` **refuse to mint unattended work on a carrier whose stop path is UNKNOWN**. **Mechanism:** a `stop:` column on §C.4's carrier table, read by `bin/run` (ABSENT). **Cost:** one refusal — and its price is that the Codex cloud **maker** lane stays shut until cancel is documented, which is §I row 15's state anyway. **Settles:** a vendor page documenting cloud-task cancellation, or `codex cloud --help` on an installed binary. **Row:** moves v56 and v13 |
| **Worktree isolation per agent** | two agents on two families never write one tree | `IN` §6 — one worktree per run; v41 assigns isolation per agent (`fact`) | **KEEP** | One artifact, one tree, argv-scoped. Standing measured caveat unchanged: `git worktree add` cannot complete under the armed sandbox and needs that one command escalated (**FACT:** CLAUDE.md, measured 2026-08-24, exit 128) |
| **Parallel CLI sessions** | how many runs, across how many vendors, at once | `IN` §3 — the WIP limit, one team per session, one foreground Codex slot (`SPINE v32`) | **IMPROVE** | The bound is real and **scattered across five sources** — the vendor's 20 concurrent subagents, the WIP limit per venture, at most two driven ventures, one Codex foreground slot, and teams' *"approximately 7x more tokens … in plan mode"* (**FACT:** surfaces.md via v13). No single number a scheduler can read, and no refusal that says which limit bound. Compute one concurrency budget in the Desk and **name the binding constraint on every refusal**. **Mechanism:** the Desk reads the routing table's per-provider `concurrency:` plus the WIP limits; page 4 refuses a drag and names the limit. **Cost:** one function, one message. **Settles:** drag N+1 cards and read which limit the refusal names. **Row:** moves v13 and §D.2 |

---

## 34 · Perspective diversity & bias mitigation

| Keyword | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Multiple-model second opinion** | a check by a vendor that did not make the thing | `IN` §11 — a second family whenever reachable; single-family an accepted risk today (`fact`) | **RETHINK** | **The plan asserts that a second family buys error-independence and never measures it.** *"A second family when reachable"* fires in six sections as a rule with no mechanism, which this repo's own rules table classes as a wish. The evidence behind it is real but **directional, not local**: a model prefers its own generations and its own family (FINAL §8.1) says the effect exists, not that it is worth a foreground slot on *our* move classes. Instrument it: every paired check records both families and whether the later deterministic outcome confirmed which side was right; if cross-family disagreement on a move class is inside noise of same-family disagreement, **stop paying for the second family on that class and say so out loud**. **Mechanism:** the four provenance fields of §33 row 2, plus one counter over the event log (ABSENT). **Cost:** no new fields beyond those four; one query. **Settles:** 25 paired checks on one move class. **Row:** moves v30 and §11.3's rung-2 premise |
| **Devil's-advocate pass** | criticism from outside the run | `RENAMED` §5 — `challenger` is an agent, not a self-pass (`SPINE v30`) | **KEEP** | Externality is the entire finding; a pass is the shape measured harmful |
| **Blind-spot check** | naming what was **not** checked, so unchecked never reads as checked | `RENAMED` §6 — the uncertain field, and *"what I could not check"* in the briefing | **KEEP** | Unchecked is stated, never implied. (System-level uncovered-field detection is §04 and L4's lane, not this one) |
| **Style/tone diversity check** | whether everything the company ships sounds the same | `IN` §3 — both options built for a *which* | **KEEP** | Diversity bought where it is adjudicated, not as standing spend; `writer`'s anchor is the taste store plus a rung-2 external reaction, which is where tone is actually judged |
| **Independent verification agent** | a checker that cannot edit what it judges | `IN` §5 — `reviewer`, `guard`, `challenger`, none carrying Write/Edit/Bash (`SPINE v1`) | **KEEP** | Argv-enforced, not promised — FINAL row 6's irreducible property, kept through the roster change |
| **Vendor-lock-in avoidance** | no vendor's outage, price change or terms change stops the company | `IN` §10 — one launcher emits both providers' argv (`SPINE v5`) | **IMPROVE** | One launcher makes an outage a **routing change**, and **nothing ever exercises the route** — so "lock-in avoided" is an architecture claim with no anchor, the exact class §11 refuses. Two things close it and one is nearly free: a **provider-outage drill** (the no-model `drill` program §B.1 rule 4 already names, run with the primary family denied at the launcher) and §33's fallback chain. **Cost:** one drill arm plus a deny switch in `bin/run`. **Settles:** the drill's own completion count against a normal night. **Row:** new row, consequence of v5. **And state the present position honestly:** today the lock-in is total — Anthropic is the only reachable family, and the clause governing automated access on a subscription is that same vendor's (§G.5, §I row 1, open by the founder's word) |
| **Model-drift detection** | a provider silently changes a model under a stable id, and nothing of ours changed | `IN` §11 — the rehearsal set re-run on a cadence; model ids carry an expiry (`SPINE §G.4`) | **RETHINK** | **The instrument expires on the same clock as the thing it measures.** v18 makes a rehearsal case one of four admissible SKILL.md bodies and v19 puts every skill under forced expiry — so the drift baseline is refreshed by the rule that refreshes the working set, and **a ruler that is re-cut cannot measure a change in length**. Split the set: `class: calibration` cases that are never edited and whose only expiry disposition is Deprecate, and `class: working` under v19 as written. Second half: key the trust score on the **model**, not only the agent, or a model swap resets nothing and the control chart §11.10 promises is measuring the wrong subject. Third: *"on a cadence"* is a schedule, which the SPINE forbids — make the trigger an **event**: a model id changes, a version string changes, or a calibration case's result changes. **Mechanism:** a `class:` field in the rehearsal body; `bin/skill-eval` (ABSENT) refuses an edit to a calibration case; the trust store gains a model dimension. **Cost:** one field, one refusal, one dimension. **Settles:** change a model id and check the chart moves. **Row:** moves v19 and §11.10 |
| **Output-diversity sampling** | a standing share of budget aimed at the founder's blind spots | `REFUSED` §11 — multiplies cost with no anchor to pick between outputs | **REFUSE-STANDS** | Correct and well-reasoned in §13a.9: the adversarial pressure comes from a second agent, a second family where reachable, and a test. A sample with no selector is spend, not diversity |

---

## 35 · Open-mindedness & rethink triggers

| Keyword | Reading | Where v2 has it | Verdict | Proposal · mechanism · cost once · what settles it · row |
|---|---|---|---|---|
| **Assumption-challenge prompt** | every durable belief names what would prove it wrong | `IN` §11 — every durable decision names its falsifier; `challenger` asks (`SPINE v30`) | **IMPROVE** | The mechanism is real **for memory items and claims** — §13.2's schema requires source, date, expiry and falsifier, and `scripts/ledger.mjs` fails a durable claim with no expiry (**EXISTS**, this branch). It does **not** exist for the plan's own load-bearing assumptions: the three named in the contrarian pass below carry no falsifier anywhere in v2. Register them as claims like everything else. **Mechanism:** `scripts/ledger.mjs` at `lint` — already blocking. **Cost:** three claim registrations with a `valid_until`. **Settles:** `npm run check:ledger`. **Row:** new row |
| **Periodic architecture rethink** | the design is re-examined because something fired, not because someone remembered | `IN` §7 — refused as periodic, kept as triggered; 13a.7's four numeric conditions (`SPINE v19`) | **IMPROVE** | **All four conditions are internal, lagging, and blocked on the same ABSENT briefing generator.** The changes most likely to invalidate v2 are **external and observable now**: Haiku 4.5 retires *"Not sooner than October 15, 2026"* (**FACT:** models.md, 2026-09-05), `--full-auto` is already deprecated (**FACT:** runtimes.md, D), a vendored substrate's licence can change (pixel-agents is MIT **today**), #19945 can close. Add a fifth condition: **a load-bearing external fact changed.** **Mechanism:** each SPINE row resting on a fetched fact carries `source:` and `valid_until`; a `scout` **standing intent** (v55's shape, already decided) re-fetches them on the Gemini window; a changed fact opens a Decide item **naming the row it invalidates**. `scripts/check-citations.mjs` already blocks on a dead path (**EXISTS**, wired as `check:citations-exist`), so the existence half is built. **Cost:** one `source:` field per load-bearing row, one standing intent. **Settles:** re-fetch v2's external facts once and count how many moved. **Row:** moves 13a.7; uses v55 |
| **"Why does this exist" audit** | nothing survives because it is already there | `IN` §7 — 13a.6, a passed horizon justifies renewal in one sentence or it stops; **no agent argues for its own existence** (`SPINE v19`) | **KEEP** | Expiry forces it; nobody self-advocates. Standing gap, stated by 13a.6 itself and not re-proposed here: **forced disposition is ENFORCED, finding the thing that expired is a WISH** |
| **Sunset-candidate review** | the retirement path for a thing that stopped paying | `IN` §7 — Deprecate is one of three dispositions at expiry (`SPINE v19`) | **IMPROVE** | **Skills retire, claims retire, memory items retire, and vendors never do.** No horizon attaches to a **provider** or a **model position**: if Codex's foreground slot returns rung 4 on most checks (§33 row 5's measurement), nothing in v2 removes it — it stays because it is in the architecture. Make a provider a durable item like the rest: a `valid_until` and a renewal sentence that must **cite its own measured contribution** — the disagreement rate of §34 row 1, or the slot-starvation count. **Mechanism:** the facts store already holds model ids with an expiry and the store check already fails a stale one (§G.4); extend the same store to provider positions. **Cost:** one row class in an already-ABSENT store. **Settles:** the renewal sentence must cite a number that exists, or the position lapses. **Row:** widens v19's scope; moves §G.4 |
| **Alternative-architecture proposal** | a different design, on the table, ready to argue for | `FOUNDER'S` §20 — commissioning another design is the founder's call | **IMPROVE** | Right that commissioning is the founder's — this round **is** the founder doing it. But v2 already holds an alternative-architecture register and does not know it: **§J, fifty-four losing images**, each kept by name *"so each can be argued for later."* It keeps the name and the reason; it does not keep the **trigger**. Add one line per entry — `wins_if:` — and the graveyard becomes fifty-four standing proposals the numbers can fire. **Mechanism:** one line per §J entry; §35's rethink trigger reads them and a matched `wins_if:` opens a Decide item. **Cost:** fifty-four lines, written once, by the people who already wrote the reasons. **Settles:** after the next external-fact change, check whether any `wins_if:` matched — if none ever does, the losing images are decoration and should be argued down rather than stored. **Row:** moves §J's format |
| **Contrarian-review agent** | a mind whose job is to attack the thing before it binds | `IN` §5 — `challenger`, Opus, read-only, routed before anything irreversible (`SPINE v30`) | **IMPROVE** | **Wave one has no challenger at all** (§5.7, v54), and the substitute is `guard`'s adversarial review plus *the founder's own read* — the founder being the single mind whose blind spots a contrarian exists to cover. **This is not a reversal of v54.** v54 says the challenger comes online *"when a venture needs them"*; v64 makes **the harness the first venture**, and the harness's own work is plan-binding and irreversible-tier by this repo's own classifier. v54's trigger is already met by v64. **Mechanism:** one agent file — `Read Glob Grep`, no Write, no Edit, no Bash, `claude-opus-5`, `maxTurns` 25 — the cheapest file in the roster and the only wave-one gap with a **measured** harm behind it. **Cost:** one file; it runs single-family until §I rows 5/6 land, which §11.3 already labels rung 4 rather than hiding. **Settles:** the founder's word on whether the harness is a venture that needs it. **Row:** none moves — it *applies* v54 and v64 |
| **Fresh-eyes onboarding review** | someone who did not build it reads the whole thing cold | `IN` §6 — *"every run starts from files, so it is fresh eyes by construction"* | **IMPROVE** | True of a **run** and false of the **architecture** — and this round is the proof: nothing in the system reads the plan cold, so eight lanes had to be dispatched by hand. The durable version is cheap and half-built: the cold-reader test the plan already applies to documentation (§B.4 §24, *"a cold reader can run it"*) applied to the plan itself, run by `challenger` **with the losing images hidden**, which is v30's exclusion pointed at a plan instead of an artifact. **Mechanism:** a routing rule the Operator follows before binding anything irreversible; the challenger's `--add-dir` excludes §J. **Cost:** one routing rule, one path exclusion. **Settles:** how many of the cold read's findings are already §J entries — many means the exclusion works and the round is cheap; **none means the plan is not being re-derived, only re-read**. **Row:** new row |
| **Session-scoped rethink checklist** | a checklist a run walks before finishing | `REFUSED` §7 — refused twice over (`SPINE v19`) | **REFUSE-STANDS** | Correct on both counts: v18 admits a step list in one place only, the Sender's checklist; and a rethink checklist inside a session is a plan-critique the run performs on itself, which v30 measures as harmful |

---

## Top 5 proposals of this lane

**1 · Routing becomes one generated table with a rehearsal set behind it.** *Which agent, which model, which band* is
answered by three prose tables — §B.2's routing column, §C.1's bands, §9.2's per-move rows — and nothing checks that
they agree. **(NEW: a mis-route is the one failure invisible to every anchor in the plan.)** An artifact that answers
the wrong question passes its done-test, its blind test and CI; §11's ladder measures whether the work is true and
never whether it was the right work. Make `keel/shared/routing.yml` the only source and generate the three tables
from it, as v45 made one schema file the source of the brief's eleven fields, then add ten to fifteen **routing
rehearsal cases** — an intent in, the correct agent, model and band as the known answer. **Cost:** one file, one
generator, fifteen cases. **How we would know:** a lint fails when a prose table diverges (the `check:manifest`
shape, already in this suite), and *"the Operator routes well"* becomes a pass rate with a denominator.

**2 · Four fields — `maker_family`, `maker_model`, `checker_family`, `checker_model` — on every handover and every
event-log row.** **(NEW: the precondition for everything else here, and it cannot be retrofitted.)** v2's central
quality claim is that rung 2 outranks rung 4. Nothing records which family did either, so the claim can never be
checked against this system's own history; at a year of logs it is still unanswerable. With the fields: `bin/run`
can **refuse** a same-family check and stamp rung 4 when it must, §34's instrument can ask whether the second family
reduces escaped defects per move class, and a provider's contribution becomes a number its renewal must cite.
**Cost:** four fields on an ABSENT schema, one refusal in an ABSENT launcher — free before the first run, impossible
after. **How we would know:** grep for `checker_family == maker_family` on a row not stamped rung 4; expect zero.

**3 · Fallback chains, per-model trust, a frozen calibration set, one provider-outage drill.** v2 distinguishes a
seat limit (stop) from a family limit (reroute) and never says **where a reroute goes** — and because Codex is a
foreground checker and Gemini is scout-only, a seat-limit stop stops the whole company. Declare a three-deep
`fallback:` per agent ending in *stop and stage*, and record a cross-family reroute as a **rung demotion** unless
that family passed the rehearsal for that move class, or the fallback quietly trades correctness for availability.
Two supports: split the rehearsal set into never-edited `calibration` cases and expiring `working` cases, because an
instrument refreshed by the rule that refreshes its subject cannot detect drift; and key the trust score on the
model, so a silent model swap moves the control chart §11.10 already promises. Then run the drill: one night with the
primary family denied at the launcher. **Cost:** one frontmatter field × fifteen files, one `class:` field, one
dimension, one deny switch. **How we would know:** the drill completes a night, and calibration results move when a
model id changes.

**4 · Rethink fires on the world, and it has fifty-four places to go.** 13a.7's four conditions are internal,
lagging, and all blocked on the same ABSENT briefing generator, while the facts most likely to invalidate v2 are
external and already written down — a retirement date, a deprecated flag, a substrate's licence, an issue that could
close. Give each SPINE row resting on a fetched fact a `source:` and a `valid_until`, let a `scout` standing intent
(v55, decided) re-fetch them on the free Gemini window, and let a changed fact open a Decide item **naming the row it
invalidates**. Pair it with `wins_if:` on each §J entry, so that when a fact moves the alternative it favours is
already argued. **(NEW: v2 holds fifty-four alternative architectures and cannot notice when one starts winning.)**
**Cost:** one field per load-bearing row, one standing intent, fifty-four lines. **How we would know:** the first
Decide item naming a SPINE row nobody was thinking about.

**5 · The cord's stop path is stated per carrier, and nothing unattended is minted where stop is UNKNOWN.** *"The
cord is read first, every tick"* is a property of the Watch, not of the carriers: §10.6 gap 14 records that
**cancelling a Codex cloud task is UNKNOWN**, and the plan names the hole and leaves it named. Add a `stop:` column
to §C.4's carrier table and have `bin/run` refuse unattended work where it reads UNKNOWN. **(NEW: the difference
between a documented risk and an accepted one is a refusal.)** **Cost:** one column, one refusal — whose price is
that the Codex cloud *maker* lane stays shut until cancellation is documented, which is §I row 15's state anyway, so
nothing is lost that the plan has. **How we would know:** the founder pulls the cord on any running thing and it
stops, on every carrier, without their knowing which carrier it was.

---

## Top 3 research questions

1. **Does a second model family reduce escaped defects on this system's move classes, and by how much?** Bounded:
   twenty-five paired checks — one artifact, one review dimension, once by the maker's family and once by another —
   scored against the deterministic outcome that arrives later. **Source class: our own event log**, not the
   literature, which gives the direction and nothing about our move classes. If the two disagreement rates are within
   noise on a class, rung 2 collapses into rung 4 there. **Blocked on:** the four provenance fields.
2. **Does `codex exec --json` return output with no controlling TTY, on ≥ 0.124.0, with a non-trivial prompt?**
   H.2's rehearsal, already specified from primary text (**FACT:** runtimes.md / §10.2, 2026-09-05), and the
   **single hinge of the cross-model architecture**: pass and rung 2 becomes parallel and a night lane; fail and the
   second family is one foreground slot forever, at 1/N availability. **Source class: a measurement on an installed
   binary**, five known-answer cases. The same install closes gap 13 with `codex cloud exec --help`.
3. **What fraction of a venture's real done-tests reach rung 1 without inventing an anchor?** Count the harness
   venture's first thirty intents. **Source class: our own store.** §11.2 asserts *"for most company work there is a
   deterministic anchor"* and nobody has counted, while autonomy, trust scores, regression-for-free and the refusal
   of consensus voting all rest on that fraction being high. Cheapest measurement here; settles assumption 1 below.

---

## The contrarian pass — the three assumptions the plan rests on most heavily

*The brief asks for the assumptions and for the architecture that would follow if each were false. All three are
treated as settled everywhere in v2 and none carries a falsifier, which is what §35 row 1 proposes to fix.*

### Assumption 1 — a deterministic anchor exists for most company work

**(FINAL, §11.2:** *"for most company work there is a deterministic anchor, and finding it is the intellectual task
of writing the done-test."*) Everything hangs here: rung 1, the trust score, regression-for-free, unattended night
work, the refusal of consensus voting, and the promise that the founder is not the bottleneck.

**(NEW: the evidence for it comes from the harness, the most anchorable venture that could have been chosen.)** v64
makes the harness the first venture and its anchors are `npm run check` and the probe — code, where rung 1 is nearly
free. What a real venture is made of — positioning, a price, copy that converts, a design someone likes, whether to
pivot — is exactly the work §11.2's own table answers with *taste* or *the founder*. The assumption may be **true of
the venture it was tested on and false of every other**.

**If false, the architecture inverts: it optimises for cheap founder adjudication, not for autonomy.** The night's
product stops being finished work and becomes **built options with their costs**; the morning becomes an adjudication
queue with a throughput target. The **taste store becomes the primary asset**, and the trust score measures
*agreement with the founder's past taps* rather than anchor pass rate — which §11.6 already designed, held-out
fraction and all, and then never let decide anything. Mission control's centre of gravity moves off pages 3 and 5
onto a **decision queue**, and the roster shrinks, because judgement work cannot be delegated to fourteen specialists
however well anchored. **What settles it: research question 3.**

### Assumption 2 — a different vendor's model is a different failure mode

Rung 2, the challenger's second family, the vendor-lock-in answer, the price of Codex's foreground slot and the
accepted single-family risk all rest on this. **(NEW: the cited evidence establishes the direction, never the
magnitude, and never for our move classes.)** *A model prefers its own generations and its own family* (FINAL §8.1)
is a real bias; it does not follow that three vendors trained on overlapping public corpora fail **independently** on
the errors that matter here — a shared wrong belief about a library's API is shared by all three, and a cross-family
check on it buys correlated noise at twice the price.

**If false, diversity is bought on inputs, not on vendors — and v2 already contains the proof of concept. v8's blind
tester is an input-diversity mechanism, not a vendor one:** it is rung 1 *because the tester never read the
implementation*, its blindness is a property of `--add-dir` rather than of whose weights it runs on, and its own
anchor is deterministic — the test fails before the change and passes after. That is the **best-anchored idea in
§11**, and it costs no second subscription, no foreground slot and no #19945. The alternative spends on that axis
instead — more grant-level exclusions, blind reconstruction of a spec from an artifact, adversarial known-answer
cases — and stops paying the foreground-slot tax and the seven-times-tokens team tax the family axis charges.
**What settles it: research question 1.**

### Assumption 3 — routing is correct by construction

Nothing anchors the Operator's dispatch. §11.11 anchors its **read-back** and its **store check** and nothing about
*which of the fourteen, on which model, in which band*. **(NEW: and the decision has three homes, which is a failure
this repository has already had and named.)** §B.2's routing column, §C.1's band table and §9.2's per-move rows each
answer it, and `scripts/classify.mjs`'s own header says why that ends badly: *"Two implementations of risk
classification will disagree, and you find out during the incident"* (**FACT:** CLAUDE.md, this branch). A mis-route
produces an artifact that passes every check in the plan and answers the wrong question — the one defect class the
anchor ladder is structurally blind to.

**If false, routing becomes an artifact with a done-test like everything else:** one machine-readable table, three
generated views, a rehearsal set with known answers, and a trust score for the Operator on routing the way every
other agent has one for its move class. **(NEW: not a new mechanism — v45's cure and §11.10's cure, applied to the
one decision that received neither.)** **What settles it:** fifteen routing rehearsal cases; below the sample floor
it prints `insufficient`, and the founder learns the fleet's dispatcher is the least-measured thing in the fleet.

**A fourth, named because the plan already knows it is making it.** Whether Anthropic's shipped headless features
constitute the *"where we otherwise explicitly permit it"* carve-out on a subscription (§G.5, §I row 1, **open by the
founder's word**). If the answer is no, the architecture moves to a metered key and the economics change shape —
batch discounts arrive, v22's two windows stop mattering, the reserve is redesigned. Listed rather than argued,
because an open decision with both sides written is the correct state for it.

---

## What the best system in the world would have here that v2 lacks

- **A disagreement matrix, per move class, per family pair, from its own history.** (NEW: reasoning — the only way
  *"a second family when reachable"* stops being a slogan and becomes a price. It needs the four fields and a query.)
- **A routing rehearsal set and a single routing table.** (NEW: reasoning — the dispatcher is the only role with no
  anchor on its primary output.)
- **Trust scores keyed on `(agent, move class, model)`, charted against a calibration set that never changes.**
  (NEW: reasoning — a control chart whose ruler is re-cut measures nothing, and §11.10 already promises the chart.)
- **A provider-outage drill that has actually run.** (NEW: reasoning — every other guarantee here is asserted by a
  program that runs; vendor independence is asserted by a paragraph.)
- **A per-provider taint and network posture.** (FACT: Codex cloud *"blocks internet access during the agent phase"*
  by default — learn.chatgpt.com/docs/cloud/internet-access via cloud.md, 2026-09-05.) (FACT: Claude Code's sandbox
  is Bash-only, an outbound domain proxy with no inbound or loopback setting — code.claude.com/docs/en/sandboxing via
  CLAUDE.md, 2026-08-24.) (NEW: reasoning — one untrusted read, two exposures, and v33/v36 are written per agent.)
- **A door for config imports.** (FACT: `/import` *"carries over MCP servers, commands, subagents, and skills"* —
  code.claude.com/docs/en/memory via memory.md 4, 2026-09-05.) (NEW: reasoning — a capability transfer with a door
  for tools, a door for pages, and none for this.)
- **`wins_if:` on every losing image.** (NEW: reasoning — fifty-four alternatives written down and no way to notice
  when one starts winning.)

**Where this field breaks, by scale.**

- **At 10 ventures.** (NEW: reasoning) The second family is a **global singleton** — one Codex foreground slot serves
  every venture, so rung-2 availability falls as 1/N and collapses when checkable volume is highest. v2 prices it as
  *"one foreground slot is not parallel"*, never as a resource ten ventures contend for. **Owned by:** §10.2 / v32.
  **Smallest change:** the lease plus the rung-4 stamp, so starvation appears in the log instead of as latency.
- **At 50 concurrent sessions.** (FACT: 20 concurrent subagents, depth 3, one team per session, no nested teams —
  runtimes.md, 2026-09-05.) (FACT: teams use *"approximately 7x more tokens … in plan mode"* — surfaces.md via v13.)
  (FACT: the Anthropic allowance is per seat and *"shared with Claude chat and Cowork"* — models.md, 2026-09-05.)
  (NEW: reasoning — a review policy firing on every artifact multiplies sessions by families and spends the founder's
  own Floor window on review traffic; nothing bounds review spend as a share of the window.) **Owned by:** §9.3 /
  v22. **Smallest change:** a review budget as a share of the window, refused at the Desk, not discovered at the limit.
- **With a second human.** (NEW: reasoning) Rung 3 is one tap by one person, the *which* has no tie-break, and the
  refusal of consensus thresholds was decided about **models**; importing it to people leaves nothing. v65 fixes the
  human roster at one and is the founder's, so this is an unpriced consequence, not a proposal. **Owned by:** v65.
- **At a year of logs.** (NEW: reasoning) Without the family and model fields on every row from the first run, a year
  of logs cannot answer the question this lane exists to ask, and it cannot be reconstructed. The only item here that
  is **cheap now and impossible later**.

---

## What I would delete

1. **Five of the six occurrences of *"a second family whenever one is reachable."*** (NEW: reasoning — a rule stated
   in six sections and enforced in none reads as six mechanisms and is zero, which this repo's own rules table calls
   a wish.) Keep it once, in §11.3, where its honest state is already written.
2. **The three-family panel** (§11.3 row 3). (NEW: reasoning — it needs Gemini authenticated *and* Codex
   detached-capable *and* panel machinery, and it exists for one-way doors with no rung-1 anchor, which §11.2 already
   routes to **rung 3, the founder**, who is reachable today. It is a row that reads as capability.) The *plan's*
   panel row only; the repository's three `verified_by: judge` claims are a live founder decision and are untouched.
3. **Codex `/goal`** (§10.3's four sentences). (FACT: `C`/medium only, two primary URLs 308-redirected, tracker items
   #20536 and #34215 against it, and whether it runs under `codex exec` unestablished — runtimes.md, 2026-09-05.)
   (NEW: reasoning — the plan does not use it, and a feature described at length reads as one relied upon.) Delete to
   one line in §10.6's gap list.
4. **The renamed *model specialization map*.** (NEW: reasoning — the refusal is right and a renamed thing gets
   rebuilt; delete the name and let the measured trust table be the only map.)
5. **The phrase *"on a cadence"* in the model-drift row.** (NEW: reasoning — a cadence is a schedule, which the SPINE
   forbids; the trigger is an event — a changed model id, version string, or calibration result.)

---

## Claims this lane asserts

*Per rule 9 and §35 row 1. Each carries a falsifier; all `verified_by: command`, because a `judge` claim with an
empty panel resolves `unresolved` forever in this runtime.*

| id | The claim | Falsified by | Expiry |
|---|---|---|---|
| `c-l7-family-provenance-absent` | No field in v2's handover, brief or event-log schema records which model family made or checked an artifact | any schema in `final-v2/parts/` naming `maker_family` or an equivalent | 2026-12-06 |
| `c-l7-routing-has-three-homes` | The routing decision is stated in §B.2, §C.1 and §9.2, with no generator and no lint between them | a `keel/shared/routing.yml` the three tables are generated from | 2026-12-06 |
| `c-l7-rung2-unmeasured` | v2 contains no measurement of whether a cross-family check outperforms a same-family one on any move class | a recorded paired-check comparison in the event log | 2026-12-06 |
| `c-l7-calibration-set-expires` | Under v18 + v19 the drift baseline is refreshed by the same forced-expiry rule as the working set | a `class: calibration` field, or any rehearsal case exempted from v19 | 2026-12-06 |
| `c-l7-cloud-cancel-unknown` | Cancelling a Codex cloud task is documented nowhere the cloud lane reached, so the cord's stop guarantee is not uniform across carriers | a vendor page documenting cancellation, or `codex cloud --help` on an installed binary | 2026-12-06 |

---

*Lane L7 · framer · 38 keywords · KEEP 13 · IMPROVE 16 · RETHINK 4 · ADD 2 · REFUSE-STANDS 3. No file outside this
one was edited; nothing was built, installed, spent, published or committed.*
