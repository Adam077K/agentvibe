## 18 · What exists today, and its fate

*obeys: v1 (the eighteen agent files become fifteen, not three), v3, v4, v6, v13, v25, v26, v35, **v62** (18.5's
room substrate and the finding it overturns) · **and, from the rethink round of 2026-09-06, SPINE §L O46, O37,
O50 and O47, SYNTHESIS §7 deletion 19, and §J 72 as the full list of what leaves · and, from the fixer round of
2026-09-06, O91, O105's `refuse` class, O115, §J 73–88** · inherits: FINAL §17*

**(NEW: three of FINAL §17's rows are re-decided, and one of them inverts)** FINAL wrote this table against three
shapes, a holding directory and one Balcony. v1 replaces the shapes with fifteen named files, v3 replaces the holding
directory with an admitted library, and v4 turns `mission-control/` from a thing that is **ABSORBED and whose views
go** into **the seed of the website the founder asked for**. Everything else stands as FINAL decided it, and where it
stands it is marked (FINAL).

**(FINAL)** Four fates only. **SURVIVES** — unchanged in role. **RENAMED** — the artifact continues under a new role
and name. **ABSORBED** — the artifact goes, the idea lives inside another part. **RETIRED** — it goes.

**(NEW: measured on this branch)** Sizes are `ceo-1-1788609834`, which is TREE A of `final/CENSUS.md` plus this
session's own documentation commits. Where TREE A is behind TREE B (`ceo-1-1788468144`), FINAL §17's closing note
still applies: `verdict.mjs` +52 lines, `.qa/verdicts/` +12 records, the memory files, the round-5 corpus and the
rethink docs.

---

### 18.1 The enforcement machinery

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| `scripts/ledger.mjs` — the claim ledger with forced expiry and resolvers | 1,531 lines; `.claude/ledger/index.json` 661 lines, 42 claims | **RENAMED** | the expiry mechanism of every fact, every measured fact **and every skill** (v19): `valid_until`, one forced disposition, `unresolved ≠ pass`. It is the reason skill retirement has a mechanism when nobody in the world ships one |
| `scripts/verdict.mjs` and `.qa/verdicts/` — sha256 binding | 534 lines / 68 records on this branch | **RENAMED** | the binding of a handover's evidence to the exact artifact its anchor checked. **Its bounded guarantee carries over:** hash-binding stops an *inherited* verdict, not a *forged* one |
| The 48-step check suite — `scripts/run-checks.mjs`, `scripts/lib/check-suite.js` | 312 and 1,978 lines; 48 steps, 10 exclusions | **SURVIVES** | the harness venture's founding rung-1 anchors. A partial run cannot wear a passing verdict, an interrupted run prints INCOMPLETE, a zero-step run is REFUSED |
| `scripts/check-citations.mjs` | 846 lines | **SURVIVES** | **scout's anchor**, named in 17.1: a research handover with a dead path fails |
| `scripts/lib/classifier.js`, `.claude/qa-tier-floor.yml` — risk by file path | 187 and 468 lines | ~~**RETIRED**~~ **SURVIVES through Keel's own build; RETIRED for venture work** (amended 2026-09-06: E4 / v88 / O103) | for a venture, the class lives on the **hand** (§F) and the door test on the **act**, never on a file path. **For Keel's own PRs it is the trusted base's mechanism**: `keel/**` `lite`; `send` · `inbound` · `watch` · `run` and `keel/host/**` `full`; agent files from `roster.yml` signed off per wave. §J 78 keeps *every Keel PR irreversible* by name |
| `.claude/workflows/qa.js`, `.github/workflows/qa-lead-pass.yml` — the gate | 1,182 and 692 lines | **ABSORBED** | oracle-first becomes the anchor ladder; the blind reviewers become **reviewer** and **guard** from another family when one is reachable; the shell-less judge's argv is reviewer's argv in 17.1; the gate blocks the **done-test**, not the merge |
| `.claude/gates.yml` and `scripts/check-gates.mjs` | 221 lines; four gates, one `kind: command`, three `kind: human` | **ABSORBED** | the `command` gate becomes the anchor check; the three `human` gates become the envelope's `never` class and the *which* the founder is handed. **The distinction it exists to preserve survives**: "a person must decide" and "nothing implements this" must not be the same string |
| `scripts/prompt-standard.test.mjs` and the `PS-*` rules in `.claude/hooks/schema-lint.js` | 1,947 lines in the linter | **ABSORBED** | the standard that governs **fifteen** files instead of eighteen. **It must move in the same change that writes builder's file** — it pins a model set that does not contain `claude-fable-5-1` (17.1) |

### 18.2 The agents — eighteen files become fifteen, and not three

**(FOUNDER, v1 and v2, overruling FINAL row 6 and row 8)** FINAL retired all eighteen into three standing prompts.
v2 retires eleven and re-seeds six.

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| `.claude/agents/builder.md` | 134 lines, `claude-opus-5`, worktree, `worktree add` in body ×2 | **RENAMED** | **builder** — the same job, a named file, the argv moved out to `builder.claude-code.argv` |
| `.claude/agents/reviewer-readonly.md` | 169 lines, `tools: [Read, Glob, Grep]` | **RENAMED** | **reviewer** — the no-shell body becomes the only reviewer |
| `.claude/agents/reviewer.md` | 149 lines, `tools: [Read, Glob, Grep, Bash]` | **RETIRED** | gone. **A checker has no shell**; an agent that can run what it judges will run what it can judge |
| `.claude/agents/sourcer.md` | 147 lines, `mcpServers: [claim-append]` | **RENAMED** | **scout** — and it keeps the narrow-server pattern: a capability through one audited server, with no `Write` |
| `.claude/agents/designer.md` | 151 lines, `mcpServers: [playwright]`, `worktree add` ×1 | **RENAMED** | **designer** — the perception loop unchanged (v4 gives it seven pages to render against) |
| `.claude/agents/orchestrator.md` | 154 lines, declares `Task` | **RENAMED** | **the Operator** — with `Write`, `Edit` and `Bash` removed: it dispatches and it does not build |
| `.claude/agents/framer.md` | 121 lines, `claude-sonnet-5` | **RENAMED** | **product** — fuzzy into a falsifiable done-test, which is what it already did |
| The eleven 23-line shims | 23 lines each; none declares `model:`, `tools:`, `mcpServers:`, `maxTurns:` or `isolation:` | **RETIRED** | gone. They shadow drifted global copies and grant nothing; nine of the fifteen new files take names from the same vocabulary and are written from the standard, not from a shim |
| `AGENTS.md` | 126 lines | **RETIRED** | goes. The routing table is the Operator's own file and §17.1's roster |
| `.claude/commands/` — sixteen slash commands, `/color`, `/name`, `/board-meeting` | 16 files, 791 lines | **RETIRED** | `keel` verbs (17.5) and mission-control taps; **the cord's verb is `bin/stop --night \| --all`** (O85). **No prompts to write** |

**(NEW: nine files have no ancestor)** `architect`, `tester`, `guard`, `analyst`, `writer`, `growth`, `steward`,
`curator`, `challenger` are new work. Two of them — `growth` and `steward` — have **no shipped precedent anywhere**
(roster.md), which is why their anchors in 17.1 are the most external of the fifteen.

**(FOUNDER, fixer round 2026-09-06: E4 — v88, O103.)** **The fifteen files are generated from `keel/shared/roster.yml`**,
signed off per wave: a seed is a generator input, and a hand edit to the emitted file fails lint (O106).

### 18.3 Skills, lenses, playbooks and workflows

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| 134 curated skills, `CURATION.yml`, 7 routers + INDEX, `MANIFEST.json` | 135 entries under `.claude/skills/`; 462 and 870 lines | **RENAMED** | **the library** (17.2). Not held: each of the 134 re-enters through the eval or expires at its `valid_until`. **~~`check:curation` retires with the old shape~~; `check:manifest` is RE-POINTED, not retired (§7.7)** — it becomes the drift check between the one Markdown source and the two generated directories; their rule survives as *a skill names its body class and its expiry or it does not load*. **(NEW: O47, moved 2026-09-06)** `CURATION.yml` and its check **SURVIVE**: a failed skill candidate is written *there*, house scope, beside every cut this repository has already recorded with the test that made it — not into a per-venture negatives store, where a house-scope fact would be relearned once per venture. The admission record gains the **body hash**, and a changed hash voids admission until re-eval (§7). **(NEW: O114, 2026-09-06)** re-entry is **provisional**: the §7.3 eval is a smoke test, `registry.yml` carries `evidence:` from anchored outcomes with and without the skill, decided at a threshold after a quarter of activations — DEPENDS-ON-R14 (§J 81). `check:manifest` gains one check (O111): **a known answer in any loaded directory fails it** |
| `.claude/skills/routers/INDEX.md` and the seven namespace routers | 8 entries | **SURVIVES** | the two-tier discovery shape, which is now also the vendor's default for memory (v27). It is the reason a lookup costs ~1,070 tokens instead of ~15,000 |
| Six playbooks — `.claude/playbooks/` | 6 files, 284 lines | **ABSORBED into the Operator** | a playbook declared the stages a category of work passes and the claims required to exit each, and never the method. **Under v1 the Operator holds exactly that**: which agent a stage routes to (17.1's last column in §B.2), and what anchor exits it. The rule that made playbooks work — *a stage may not state method* — becomes the Operator's own constraint, enforced today by `schema-lint.js` refusing `steps:`, `how:`, `method:`, `implementation:`. **(v97, 2026-09-06)** The pre-flight read is **the constitution** (O107); a stage's exit claims become `rules.yml` rows — *never the method*, as data |
| `.claude/lenses.yml` | 201 lines | **ABSORBED** | domain procedure becomes **the agent's own file**. v2's whole premise is that expertise is a named agent rather than a lens applied to a shape, so the lens file's content moves into fifteen bodies and the file goes |
| `.claude/review-lenses.yml` | 230 lines | **ABSORBED** | a review lens becomes a **named dimension** reviewer and guard are dispatched against. **The `independent: true` predicate survives** — ≥2 distinct model families — and it is still unmet, which §21 counts |
| `.claude/workflows/design.js` | 143 lines, named by no command | **RENAMED** | one *both options built* round for design. Its score-averaging is removed: checkers find, they never score |
| `.claude/workflows/coding.js`, `research.js` | 170 and 187 lines, **named by no command** | **RETIRED** | a run's own method. The done-test judges the result. They were invoked by nothing on the day they were retired |
| `.claude/workflows/qa.js` | 1,182 lines, named by 2 commands, referenced by 41 files | see 18.1 | **ABSORBED** |

### 18.4 Hooks, physics and memory

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| `.claude/hooks/pre-tool-use.sh`, the armed sandbox, the worktree protocol | 676 lines; `sandbox.enabled: true`, `failIfUnavailable: true`; no `network` key | **SURVIVES** | run physics. `git worktree add` stays the one escalated command, run by `bin/worktree` (O14). **The `network` and `credentials` blocks are added** as two of `bin/egress`'s three transports (O94; W36); **`denyRead` is generated from `keel/host/denyread.yml`**, nine entries (O92 · W37); the string matcher becoming structured-input matching is a founder decision (§20) |
| `.claude/hooks/session-start.js` | 259 lines; emits 2,941 bytes under a 4,096 ceiling | **RENAMED** | the Floor's loader: charter, envelope, slice. **The 9.2x cut is the reason it works** — at 27KB the runtime truncated it and the payload never reached agent context. **(v97 / O107, 2026-09-06)** Its 4,096-byte ceiling is **the constitution's size**: it injects `keel/constitution.md` whole, byte-identical |
| `.claude/hooks/schema-lint.js` | 1,947 lines | **ABSORBED** | see 18.1. **`PS-WORKFLOW-CONTAINMENT` survives verbatim** (v35): `Workflow` absent from every agent file, deliberately, because the gate may not be invocable by the thing it gates. `grep -c '^tools:.*Workflow' .claude/agents/*.md` → 0, and the zero is the guarantee |
| `.claude/hooks/budget-guard.js` | 204 lines; **zero references in `settings.json`** | **RENAMED** | the stall detector in the Watch. ~~Registering it is a founder act and is a §20 row~~ **(NEW: O50)** its fate is **register**: a fuse that is not wired is a memory of a fuse, and this one has been unwired on every branch it has existed on. **Mechanism:** one entry in `.claude/settings.json` — the hook exists, so nothing is written but the registration. What the founder deferred (FINAL §19 row 6, DECISIONS §15) is the **act at build time**, not the fate; the same split O38 makes for the hook rewrite (§12). **(NEW: O115, 2026-09-06 — a second job; the file is READ.)** Its baseline — **(THINKER: A12 · W39)** 1,961,285 output tokens peak in any rolling five hours — **seeds `keel/logbook/window-highwater.yml`** until the first observed week replaces it (§16.2a) |
| `.claude/hooks/gsa-check-update.js`, `gsa-context-monitor.js`, `gsa-statusline.js`, `stop.sh` | part of 8 files / 3,579 lines; `stop.sh` exists with **no `Stop` event registered** | **RETIRED** | gone. **And `stop.sh` is the caution v2 inherits**: v11 keeps `disableAllHooks` and `allowManagedHooksOnly` out of the managed file so `/goal` survives, which means **a run can register its own Stop hook**. The cost is stated once and the probe checks it nightly |
| `CLAUDE.md` | 886 lines | **RENAMED** | the Floor's standing context, stripped of archaeology. The archaeology moves to the logbook. **Byte-identical and carrying no timestamp**, because the subscription cache TTL is one hour |
| `.claude/memory/DECISIONS.md`, `evict-memory.mjs`, the archive volumes | 424 lines / ~39,543 bytes; 1,125 lines; two volumes | **RENAMED** | the curator's rules: nothing deleted to meet a cap, irreversible entries pinned, a stub under every heading, capped rotating volumes. **v25 gives the "one writer" an agent with a name** |
| `.claude/memory/LONG-TERM.md`, `USER-INSIGHTS.md`, `CODEBASE-MAP.md` | 84, 18, 202 lines | **ABSORBED** | taste is derived and never authored; customer language becomes facts with provenance; the map becomes already-built, seeded by `keel adopt` |
| `docs/08-agents_work/sessions/` and `handoffs/`, the documentation gate | 171 sessions, 16 handoffs | **RETIRED** | a run's handover, the logbook and the briefing. **The gate's rule survives** — no task completes with no record — and it stops being a Markdown file with frontmatter |
| `~/.claude/projects/` transcripts | 60 project directories, 3,060 `.jsonl` files | **RENAMED** | the transcript pass: episodes, never retrieval memory. **A batch pass over a snapshot, never a live parser in the critical path** (v26) — *"the entry format is internal to Claude Code and changes between versions"*. **(FOUNDER, fixer round 2026-09-06: E10 — *"Keep them for mining"*; v93, O88.)** **(THINKER: A4)** 3,116 transcripts, 3.1 GB, 56 a day, every stranger's body verbatim, outside v69's erasure grep. So: **kept**; **every night child passes `--no-session-persistence`** (R30 is the canary); **`bin/mine --since` reads only the Floor's, refuses taint ids**; the erasure grep covers this tree; vendor retention named out of reach |

### 18.5 Mission control — the row that inverts

**(FOUNDER, v4, overruling FINAL row 15)** FINAL marked `mission-control/` **ABSORBED** and wrote *"the views go"*.
The founder asked for it back as a first-class website, so it is **RENAMED**: the artifact continues, under a bigger
job than it had.

**(v39: and it is the host, not only the seed)** The Bun and Hono server and the React client **serve the seven pages
on the Mac**, because a terminal pop needs `tmux` on the same machine. The published artifact pages survive beside it
as the phone's read-and-decide surface, and they cannot pop a terminal. **Two renderers over one state — which FINAL
§13.1 refused — accepted once, for that reason**, and both read the same logbook.

**(NEW, v62: a second server joins it on the Mac, and it is not ours.)** Page 1's substrate is **pixel-agents** (MIT,
LICENSE read from the file), and it **requires a Fastify server** for both its VS Code extension and its standalone
CLI — *"the CLI chooses a free local port and prints the URL"*. That process **runs beside `mission-control/` on this
Mac**, not inside it: `mission-control/` keeps serving the seven pages, and the room renders within page 1 against a
writer that is ours (§14.4, ABSENT, `AgentEvent` schema UNVERIFIED). Two processes, still one state — neither holds
anything the logbook does not.

**(NEW: the FINAL finding this section inherited is OVERTURNED, and it is recorded here because a fate table is where
an inherited belief goes unexamined.)** FINAL §13.8, from round-5 `surfaces.md` §4A.11, held that **no Claude Code
fleet surface is spatial** — every spatial project a display, every control surface a table — and that was the
argument for `mission-control/` being a table and the room being someone else's problem. **research/room.md part 5
refutes it**: pixel-agents (9,190 stars), **clawd-on-desk** (AGPL-3.0, refused for the copyleft) and **pixtuoid**
(MIT, Rust, terminal) all watch Claude Code, and all three were pushed on 2026-09-05. pixel-agents already binds a
click to an agent's terminal in VS Code (open issue #251). **The fate of `mission-control/` does not change** — it is
still RENAMED and still the host — but the reason FINAL gave for keeping the room out of it is gone, and §14.1 is
where that is argued. FINAL §13.8 is kept by name as a losing image (§J.51).

**(FOUNDER, fixer round 2026-09-06: E12 — v95.)** Built **4 → 5 → 3 → 2 → 7 → 1 → 6**; pages 1, 2, 3, 7 are adapters
(v96); page 2's tap becomes `attach:` and `message:` (O121; W34). No fate below changes.

| Of the 60 files | Measured on this branch | Fate | In v2 it is |
|---|---|---|---|
| `server/` — `app.ts`, `collectors/`, `config.ts`, `index-cache.ts`, `index-store.ts`, `index.ts`, `lib/`, `projects.ts`, `routes/`, `state.ts`, `trust.ts` | 11 top-level entries | **SURVIVES as the website's server** (v39) | the seven pages are routes on it. `collectors/` and `index-store.ts` are what already read the event log; `projects.ts` is what already knows there is more than one venture |
| `client/` | present; **there is no `web/`** | **SURVIVES as the website's client** | seven pages replace the views. FINAL's *"the views go"* is what v4 overrules, and this is where the overrule lands |
| `scripts/consume-dispatch.ts` | 685 lines | **RENAMED** | **the seed of `keel/bin/run`.** It already reads a queue file and births a run; v34 makes it the only thing that composes argv — **since O91, bare `claude -p` in a detached tmux session, never `--bg`** (W38) |
| `scripts/check-cold-start.ts` | present | **SURVIVES** | the cold-start anchor. It is a **wall-clock** check (9.5s against a 10s budget) and flakes when several lanes build at once — re-run before believing it |
| `scripts/trust-store.ts`, `trust.ts`, `server/trust.ts` | 3 files | **ABSORBED** | trust scores move onto the rehearsal scores store: a score with n below the floor is printed as a number, never as a verdict — **with a carrier dimension** (O120) and `trust: probation` at cold start (O112) |
| `test/` and `check.mjs` | `test/stream.test.ts` among them | **SURVIVES** | **and `stream.test.ts` is not to be edited to make anything green.** It is a regression test for a real shipped bug; its single failure under the armed sandbox is a denied loopback `bind()` surfaced as `EADDRINUSE` with `errno: 0`, where a genuine macOS `EADDRINUSE` is errno 48 |
| `~/.agentvibe/events.jsonl` | 3,843 lines, outside both trees | **RENAMED** | the logbook's spine, and page 3's only source. Every number on the cost page joins it to the price table by id |

### 18.6 Launchers, configuration and the record

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| `bin/warroom` | 3,429 lines | **ABSORBED** | per-worker cost pricing → the meter and page 3; typed events → the logbook; snapshots → verified checkpoints |
| `bin/fleet-install.mjs` | 1,053 lines | **RENAMED** | `keel adopt`: stamps a repository with the templates and **verifies** the port rather than assuming it |
| `bin/install.js`, `install-war-room.sh`, `init-from-template.sh` | 308, 149, 147 lines | **RETIRED** | three installers for one act. `keel adopt` is the one |
| `war-room/` | 4 entries, 62 files; does **not** contain `fleet-install.mjs` | **ABSORBED** | the tmux layer is the five documented commands of 17.5, not a vendored dashboard |
| `.mcp.json`, `.claude/mcp-policy.json` | 12 and 65 lines | **RENAMED** | designer's one server and scout's read-only servers; the per-server allow/deny shape is the tool file's seed. **(FOUNDER, rethink 2026-09-06: D3 · v68)** and `mcp-policy.json`'s fate narrows in the same move: it becomes **`bin/egress`'s configuration file**, not an independent control. It was a policy whose calls no hook could see; `--strict-mcp-config` names only the proxy, and the rules in this file are what the proxy reads. §8 carries the door and the program. **(O94, 2026-09-06)** `bin/egress` is three transports; this file configures the stdio MCP one; the loopback proxy is §J 86 |
| `docs/02-competitive/` — the catalogue and five reference studies | TREE B only for `expansion/` and `reference-systems/` — `open-source.md` 1,083 · `hands.md` 901 · `concepts.md` 2,157 lines, 5 studies. `LANDSCAPE.md`, `MOAT.md`, `POSITIONING.md` and `competitors/` (237 lines) are on both trees | **SURVIVES** | the door's catalogue. **Every entry re-verified against its LICENSE before admission** — v15 is what that rule caught: n8n's own LICENSE.md, read raw, says internal or non-commercial only |
| The design record — v2, WAKE, WATCH, the minds, v3, Keel, round-5, round-6, `final/` | 86 design docs on TREE B; Keel 2,682 lines | **SURVIVES** | as record: the priors of this plan. Every decision against them is a row of §1-v2, with the losing image kept by name |
| `final/CENSUS.md` | the measurements this section rests on | **SURVIVES** | the census of TREE A and TREE B. §17 and §18 are re-measured against it rather than re-derived |

**(NEW: two things this table does not say)** It does not say when any of this happens — §19 gives dependency and no
schedule. And it does not say that a RETIRED artifact was wrong: `coding.js` and `research.js` are retired because
**nothing invoked them**, and `reviewer.md` is retired because it carries a shell, not because it reviewed badly.

---

### 18.7 What the rethink round takes out before it is built

**(NEW: the rethink round of 2026-09-06 — SYNTHESIS §7, and SPINE §J 72 is the same list kept by name)** The four
fates above are fates of things that **exist**. This table is the other half of a fate table and it did not exist
before this round: eighteen things v2 had **designed and not built**, withdrawn now, plus two that exist on this
branch today. The mark for a designed thing withdrawn before anything is written is **WITHDRAWN** — it is not
RETIRED, because nothing was ever built to retire, and the distinction matters when a builder later looks for it.

**(NEW: the rule that makes a withdrawal safe)** **Every row names what holds its job instead.** A deletion with no
successor is a capability loss wearing the word *simplify*; a deletion whose job something else already does is free.
That predicate is also this list's own falsifier, and SPINE §J 72 states it: *a builder who reaches for one of these
and can name no replacement is the observation that brings it back*.

| What goes | Exists? | Why it goes | What holds its job |
|---|---|---|---|
| **`keel/logbook/backlog.jsonl`** — the improvement backlog as its own store | designed, ABSENT | **O46.** COVERAGE says twice that an improvement **is an intent**; a second store for the same object is a second place it can be true | a filter over the intent store where `kind: improvement`. §13a keeps the loop; it loses the file |
| **The project-`settings.json` tier of tool grants** | **YES** — `.claude/settings.json` on this branch carries 39 allow/deny rules | **O37**, with **W7** as independent support: `--restricted` *"ignores user, project and local settings files"*, so on the `-p` carrier this tier is already ignored outright. A third tier neither the argv nor the managed file owns is a grant nobody reviews | grants live in exactly **two** places: the argv `bin/run` composes, and the managed file a running process cannot clear (§12) |
| **The dependency on `skills-ref validate`** | designed, ABSENT | **Deletion 19.** Its licence is **UNKNOWN and was never fetched** — the same defect v17 caught in the skills upstream, one level down in the toolchain | **its four checks are kept** and re-implemented from the spec text. This is a dropped *dependency*, not a dropped check, and §7 carries the checks |
| **`logbook/desk/<tick>.json` as a file per tick** | designed, ABSENT | **O20.** The highest-volume artifact in the design, holding an answer whose value decays in hours, read by nothing | the Desk's ranking becomes **event-log rows**, and `bin/replay-desk` reads them. §4 |
| **The per-venture `open.md` store** | designed, ABSENT | **O9.** Ten queues, one founder, nine writer-contention points | one house-level `keel/logbook/decide.jsonl`, rendered by pages 4 and 5. §14 |
| **`analyst`'s `Bash`** · **`writer`'s split model default** | designed, ABSENT | **O57** (contradiction 4). The only read-class agent holding a shell, contradicting §C.1's own placement of it; and a routing decision living in the one copy no table reviews | `bin/reconcile` does the arithmetic (v47); `writer`'s split becomes a **§G.1 row with a named trigger**. §5, §9 |
| **The rank formula's two companions** — *the intent's own urgency as a second scale*, and the sentence *"the Desk decomposes"* | designed, ABSENT | **Deletions 3 and 4**, riding with the founder's **v75**. One person and two dials for one decision, the second derivable; and a sentence assigning a model's job to a no-model program | the founder's weight band is the one dial (§4.5); decomposition is the work-item store's, **O1** |
| **The menu-bar glyph** | designed, ABSENT | **Deletion 23.** No substrate was ever named, it is a new dependency if built, and **a status living in two places is one that disagrees** | page 5's top strip and `bin/bell` (**O18**), which is the only thing that may ring. §14 |
| **Page 1's second job** — the portfolio and the venture toggle | designed, ABSENT | **Deletion 24** (contradiction 9). §14.4's own guard rails say page 1 is *never where a decision is made*, and the toggle is a decision | the portfolio moves to **page 3's strip**; the page manifest (**O12**) is what makes the rule checkable rather than stated |
| **The four-class hands table, three of its four copies** · its **`Night?`** column | designed, ABSENT | **Deletions 12 and 14** (contradiction 19). Four renderings of one table drift; the admitted-tool file already carries a horizon and the door's is the enforced one | **§F is the decision** and **§17.3 is the inventory copy**. §8 points at §F rather than restating it |
| **Two of the three department tables** | designed, ABSENT | **Deletion 8** (contradiction 20) — three renderings of eight rows, already drifted on customer service | generated from `roster.yml` (**O2**). §5 |
| **The duplicate cost formula (§16.3's copy)** | designed, ABSENT | **Deletion 20** (contradiction 15). Two implementations of one check disagree, which this repository has already paid for | **§9.6 owns the formula**; §16.3 keeps only its tenfold-divergence argument and cites it |
| **`--max-budget-usd` from the control section, and its three other restatements** | designed, ABSENT | **Deletion 13.** A stall fuse explained four times invites a fifth misreading | **§16.5 owns it**, as one thing with one job |
| **Dollar ceilings *as ceilings*** | designed, ABSENT | **Deletion 21**, and the founder's **v74**: on a subscription the dollar is a locally computed shadow of a bill nobody sends, and **an absent ceiling is visible while a wrong one is not** | a **window gauge** — tokens against an observed high-water mark — with wall clock beside it and USD kept as a shadow price. §16 |
| **The message priority tag** | designed, ABSENT | **Deletion 22.** A second ranking that will disagree with the Desk's, deleted **before** it is built rather than after | the Desk's lexicographic order (**v75**). §4 |
| **The name *venture health score*** | designed, ABSENT | **Deletion 33.** It survives on two pages and invites the composite the plan refuses | the three raw numbers, ordered by the worst one. §14, §21 |
| ***"Unread transcript count"*** as a surfaced number | designed, ABSENT | **Deletion 17.** A progress bar for a backlog that clears once | **watermark lag** (**O42**), which stays meaningful in year two. §13 |
| **The *Pareto prompt archive*** as a distinct artifact | designed, ABSENT | **Deletion 18.** Git history is already the archive | two numbers on `scores.jsonl` are the frontier. §13 |
| **The renamed *model specialization map***, and *"on a cadence"* in the model-drift row | designed, ABSENT | **Deletion 29.** A renamed thing gets rebuilt; a cadence is a schedule the SPINE forbids | one routing table (**O5**); the drift trigger is an **event**, not a clock. §9 |
| **Codex `/goal`'s four sentences** | designed, ABSENT | **Deletion 28.** `C`/medium confidence, two 308-redirected sources, used by no row — **and a feature described at length reads as one relied upon** | one line in §10.6's gap list |
| **The blanket OUTSIDE on §17 for the house** | designed, ABSENT | **Deletion 25.** v64 makes the harness the venture, and it deploys by editing the programs that dispatch and send | §17 carries the house's own deployment as inventory, not as an exclusion |
| **The *reason* under COVERAGE §11's refusal** — *"one founder, one Mac"* | designed, ABSENT | **Deletion 32.** The refusal stands; its reason is falsified by §15.4's **own restore drill**, which produces a second machine | cite the **lease** (**O16**) instead: the Watch refuses to tick and the Sender refuses to act without it, so the drill's clone can do neither |
| **`bin/supervise`** — a supervisor beside the vendor's daemon *(2026-09-06)* | designed, ABSENT — **REFUSED** (O105's mark) | **O91.** **(THINKER: A7 · W38)** the daemon ships control, dispatch, a roster; *"idle 5s with no clients — exiting … leases=0"*. Two supervisors argue over the first orphan | the Watch's crash-only tick (§15.2); O15 reads the daemon read-only; bare `-p` in tmux (§J 85). **R31** reopens it — `vendor_wins_if:` a service mode that does not idle-exit, with readable leases |
| **The run-side reversibility question** — §12.2's flowchart *(2026-09-06)* | designed, ABSENT | **O109 / v101** (THINKER: B13): a launcher predicate taking model output | a **verb**'s property in the admitted-tool file (§17.3). §J 79 |
| **The loopback proxy as `bin/egress`** *(2026-09-06)* | designed, ABSENT | **O94.** **(THINKER: A5 · W36)** loopback `connect()` is denied for sandboxed Bash | three transports, one log (§8, §17.5). §J 86 |
| **The pack's rehearsal case as a body in the pack** *(2026-09-06)* | designed, ABSENT | **O111** (THINKER: B17, C14): readable by the run it judges; contaminates R19 | a reference into `keel/golden/` (§17.1) |

**(NEW: what this table is not)** It is not a claim that any of these was wrong to design. Three of them —
`backlog.jsonl`, `open.md` and the per-tick Desk file — are ordinary shapes that lost to a **cheaper shape with the
same job**, and one, the project-settings tier, lost to a **vendor fact published after it was written**. And two
rows point the other way: `CURATION.yml` and its check (§18.3) and `budget-guard.js` (§18.4) both **exist and gain**
work in this round rather than losing it — `budget-guard.js` a second time in the fixer round, its baseline read into the
window gauge's seed (O115) — which is the same round's evidence that the list is not a tidy-up.

**(NEW: one deletion of the round is the founder's and is not on this list)** §11.3's three-family review panel row
is deleted by **v82**, in the founder's words — *"Delete the row from the plan"*. It is a row of the plan rather than
an artifact with a fate, so §11 states it in place and §20.7 records the decision. **The repository's three live
`verified_by: judge` claims and the founder waiver running to 2026-11-17 are untouched by it.**

#### 18.7a What the fixer round takes out — three founder overrules and the shapes the fold did not take (§J 73–88)

**(FOUNDER, fixer round 2026-09-06: E1, E7, E14 — final; and §J 76–88, the lane shapes kept by name.)** Two marks:
**WITHDRAWN** where the plan had designed the thing, **NOT TAKEN** where a lane proposed it and the fold chose otherwise.
Every `wins_if:` lives in §J and is cited, not copied.

| What goes | In the plan, or a lane's? | The founder's word, or the fold's reason | What holds its job | §J |
|---|---|---|---|---|
| **The always-on box** | **YES** — §15.1's FINAL split; every lane's first node | **E1**: *"dont need for now. use this mac and when cant use cloude"*. WITHDRAWN; identity and autonomy share the Mac, an accepted risk (§15.4) | this Mac + `night_capable` (v84, O81) + the cloud lane (§15.1b); the keychain drill (O83) | **73** |
| **A checker-family API key**, the metered design | **YES** — §I row 17, §16.4's batch row | **E7**: *"no keys, codex and gemini cli use."* WITHDRAWN; §I 17 CLOSED | the two CLIs as `bin/run` children from launchd (v90, O92); the subsidy line (O116) | **74** |
| **The vanilla-runtime week** | C | **E14**: *"No, compare Keel's modes only"*. NOT TAKEN | §20.2 row 12 | **75** |
| A Linux box | — | folded into 73 | — | **76** |
| One Operator enforced by a lease | **YES** — v46 | **E8**: N Operators (v91, O84; THINKER: A6 · W41). WITHDRAWN | `sessions.jsonl` operator rows | **77** |
| Every Keel PR at irreversible | **YES** — the classifier as it stood | **E4**: the trusted base (v88, O103). WITHDRAWN as the build tier | §18.1's re-derived row | **78** |
| The run-side reversibility flowchart | **YES** — §12.2 | O109 / v101. WITHDRAWN (above) | the verb table | **79** |
| Weighted fair queueing now | B | v75 **replayed before replaced** (R38). NOT TAKEN | `bin/replay-desk` | **80** |
| Sequential skill testing now | B | provisional admission joined to O41 (O114). NOT TAKEN | `registry.yml`'s `evidence:` | **81** |
| Two curators on two families | B | O113 grades the one curator. NOT TAKEN | the held-out test, seed, canary | **82** |
| A fourth bell channel | A | O122 wraps the vendor's push. NOT TAKEN | `bin/bell` | **83** |
| The ladder stopping below `first-contact` | C, B | **E11**: *"Yes, after N recall-free sends per venture"*. NOT TAKEN | the ladder (O100, v94) | **84** |
| `--bg` as the night's carrier | A | O91: bare `-p` in tmux. NOT TAKEN | `bin/run`'s tmux mint | **85** |
| A loopback proxy as `bin/egress` | **YES** — v68's obvious shape | O94; W36. WITHDRAWN (above) | three transports | **86** |
| The world's vote — a Desk share moved by the market | B | v98's tie-break, v99's record. NOT TAKEN | `market.jsonl` inside a weight band | **87** |
| Gemini on every diff now | C | v78 governs; R11 measures. NOT TAKEN | v90's routing rule | **88** |

**(NEW: the fifth mark.)** O105's `class: refuse` — not RETIRED (nothing built), not WITHDRAWN (not wrong): a job a
vendor surface already does, held out until its `vendor_wins_if:` matches or its R answers.
