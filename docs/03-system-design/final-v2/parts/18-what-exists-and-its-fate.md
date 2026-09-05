## 18 · What exists today, and its fate

*obeys: v1 (the eighteen agent files become fifteen, not three), v3, v4, v6, v13, v25, v26, v35 · inherits: FINAL §17*

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
| `scripts/lib/classifier.js`, `.claude/qa-tier-floor.yml` — risk by file path | 187 and 468 lines | **RETIRED** | the class lives on the **hand** (§F) and the door test on the **act**, never on a file path |
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
| `.claude/commands/` — sixteen slash commands, `/color`, `/name`, `/board-meeting` | 16 files, 791 lines | **RETIRED** | `keel` verbs (17.5) and mission-control taps. **No prompts to write** |

**(NEW: nine files have no ancestor)** `architect`, `tester`, `guard`, `analyst`, `writer`, `growth`, `steward`,
`curator`, `challenger` are new work. Two of them — `growth` and `steward` — have **no shipped precedent anywhere**
(roster.md), which is why their anchors in 17.1 are the most external of the fifteen.

### 18.3 Skills, lenses, playbooks and workflows

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| 134 curated skills, `CURATION.yml`, 7 routers + INDEX, `MANIFEST.json` | 135 entries under `.claude/skills/`; 462 and 870 lines | **RENAMED** | **the library** (17.2). Not held: each of the 134 re-enters through the eval or expires at its `valid_until`. **`check:manifest` and `check:curation` retire with the old shape**; their rule survives as *a skill names its body class and its expiry or it does not load* |
| `.claude/skills/routers/INDEX.md` and the seven namespace routers | 8 entries | **SURVIVES** | the two-tier discovery shape, which is now also the vendor's default for memory (v27). It is the reason a lookup costs ~1,070 tokens instead of ~15,000 |
| Six playbooks — `.claude/playbooks/` | 6 files, 284 lines | **ABSORBED into the Operator** | a playbook declared the stages a category of work passes and the claims required to exit each, and never the method. **Under v1 the Operator holds exactly that**: which agent a stage routes to (17.1's last column in §B.2), and what anchor exits it. The rule that made playbooks work — *a stage may not state method* — becomes the Operator's own constraint, enforced today by `schema-lint.js` refusing `steps:`, `how:`, `method:`, `implementation:` |
| `.claude/lenses.yml` | 201 lines | **ABSORBED** | domain procedure becomes **the agent's own file**. v2's whole premise is that expertise is a named agent rather than a lens applied to a shape, so the lens file's content moves into fifteen bodies and the file goes |
| `.claude/review-lenses.yml` | 230 lines | **ABSORBED** | a review lens becomes a **named dimension** reviewer and guard are dispatched against. **The `independent: true` predicate survives** — ≥2 distinct model families — and it is still unmet, which §21 counts |
| `.claude/workflows/design.js` | 143 lines, named by no command | **RENAMED** | one *both options built* round for design. Its score-averaging is removed: checkers find, they never score |
| `.claude/workflows/coding.js`, `research.js` | 170 and 187 lines, **named by no command** | **RETIRED** | a run's own method. The done-test judges the result. They were invoked by nothing on the day they were retired |
| `.claude/workflows/qa.js` | 1,182 lines, named by 2 commands, referenced by 41 files | see 18.1 | **ABSORBED** |

### 18.4 Hooks, physics and memory

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| `.claude/hooks/pre-tool-use.sh`, the armed sandbox, the worktree protocol | 676 lines; `sandbox.enabled: true`, `failIfUnavailable: true`; no `network` key | **SURVIVES** | run physics. `git worktree add` stays the one escalated command. **The `network` and `credentials` blocks are added**; the string matcher becoming structured-input matching is a founder decision (§20) |
| `.claude/hooks/session-start.js` | 259 lines; emits 2,941 bytes under a 4,096 ceiling | **RENAMED** | the Floor's loader: charter, envelope, slice. **The 9.2x cut is the reason it works** — at 27KB the runtime truncated it and the payload never reached agent context |
| `.claude/hooks/schema-lint.js` | 1,947 lines | **ABSORBED** | see 18.1. **`PS-WORKFLOW-CONTAINMENT` survives verbatim** (v35): `Workflow` absent from every agent file, deliberately, because the gate may not be invocable by the thing it gates. `grep -c '^tools:.*Workflow' .claude/agents/*.md` → 0, and the zero is the guarantee |
| `.claude/hooks/budget-guard.js` | 204 lines; **zero references in `settings.json`** | **RENAMED** | the stall detector in the Watch. Registering it is a founder act and is a §20 row |
| `.claude/hooks/gsa-check-update.js`, `gsa-context-monitor.js`, `gsa-statusline.js`, `stop.sh` | part of 8 files / 3,579 lines; `stop.sh` exists with **no `Stop` event registered** | **RETIRED** | gone. **And `stop.sh` is the caution v2 inherits**: v11 keeps `disableAllHooks` and `allowManagedHooksOnly` out of the managed file so `/goal` survives, which means **a run can register its own Stop hook**. The cost is stated once and the probe checks it nightly |
| `CLAUDE.md` | 886 lines | **RENAMED** | the Floor's standing context, stripped of archaeology. The archaeology moves to the logbook. **Byte-identical and carrying no timestamp**, because the subscription cache TTL is one hour |
| `.claude/memory/DECISIONS.md`, `evict-memory.mjs`, the archive volumes | 424 lines / ~39,543 bytes; 1,125 lines; two volumes | **RENAMED** | the curator's rules: nothing deleted to meet a cap, irreversible entries pinned, a stub under every heading, capped rotating volumes. **v25 gives the "one writer" an agent with a name** |
| `.claude/memory/LONG-TERM.md`, `USER-INSIGHTS.md`, `CODEBASE-MAP.md` | 84, 18, 202 lines | **ABSORBED** | taste is derived and never authored; customer language becomes facts with provenance; the map becomes already-built, seeded by `keel adopt` |
| `docs/08-agents_work/sessions/` and `handoffs/`, the documentation gate | 171 sessions, 16 handoffs | **RETIRED** | a run's handover, the logbook and the briefing. **The gate's rule survives** — no task completes with no record — and it stops being a Markdown file with frontmatter |
| `~/.claude/projects/` transcripts | 60 project directories, 3,060 `.jsonl` files | **RENAMED** | the transcript pass: episodes, never retrieval memory. **A batch pass over a snapshot, never a live parser in the critical path** (v26) — *"the entry format is internal to Claude Code and changes between versions"* |

### 18.5 Mission control — the row that inverts

**(FOUNDER, v4, overruling FINAL row 15)** FINAL marked `mission-control/` **ABSORBED** and wrote *"the views go"*.
The founder asked for it back as a first-class website, so it is **RENAMED**: the artifact continues, under a bigger
job than it had.

**(v39: and it is the host, not only the seed)** The Bun and Hono server and the React client **serve the seven pages
on the Mac**, because a terminal pop needs `tmux` on the same machine. The published artifact pages survive beside it
as the phone's read-and-decide surface, and they cannot pop a terminal. **Two renderers over one state — which FINAL
§13.1 refused — accepted once, for that reason**, and both read the same logbook.

| Of the 60 files | Measured on this branch | Fate | In v2 it is |
|---|---|---|---|
| `server/` — `app.ts`, `collectors/`, `config.ts`, `index-cache.ts`, `index-store.ts`, `index.ts`, `lib/`, `projects.ts`, `routes/`, `state.ts`, `trust.ts` | 11 top-level entries | **SURVIVES as the website's server** (v39) | the seven pages are routes on it. `collectors/` and `index-store.ts` are what already read the event log; `projects.ts` is what already knows there is more than one venture |
| `client/` | present; **there is no `web/`** | **SURVIVES as the website's client** | seven pages replace the views. FINAL's *"the views go"* is what v4 overrules, and this is where the overrule lands |
| `scripts/consume-dispatch.ts` | 685 lines | **RENAMED** | **the seed of `keel/bin/run`.** It already reads a queue file and births a run; v34 makes it the only thing that composes argv |
| `scripts/check-cold-start.ts` | present | **SURVIVES** | the cold-start anchor. It is a **wall-clock** check (9.5s against a 10s budget) and flakes when several lanes build at once — re-run before believing it |
| `scripts/trust-store.ts`, `trust.ts`, `server/trust.ts` | 3 files | **ABSORBED** | trust scores move onto the rehearsal scores store: a score with n below the floor is printed as a number, never as a verdict |
| `test/` and `check.mjs` | `test/stream.test.ts` among them | **SURVIVES** | **and `stream.test.ts` is not to be edited to make anything green.** It is a regression test for a real shipped bug; its single failure under the armed sandbox is a denied loopback `bind()` surfaced as `EADDRINUSE` with `errno: 0`, where a genuine macOS `EADDRINUSE` is errno 48 |
| `~/.agentvibe/events.jsonl` | 3,843 lines, outside both trees | **RENAMED** | the logbook's spine, and page 3's only source. Every number on the cost page joins it to the price table by id |

### 18.6 Launchers, configuration and the record

| Exists today | Measured | Fate | In v2 it is |
|---|---|---|---|
| `bin/warroom` | 3,429 lines | **ABSORBED** | per-worker cost pricing → the meter and page 3; typed events → the logbook; snapshots → verified checkpoints |
| `bin/fleet-install.mjs` | 1,053 lines | **RENAMED** | `keel adopt`: stamps a repository with the templates and **verifies** the port rather than assuming it |
| `bin/install.js`, `install-war-room.sh`, `init-from-template.sh` | 308, 149, 147 lines | **RETIRED** | three installers for one act. `keel adopt` is the one |
| `war-room/` | 4 entries, 62 files; does **not** contain `fleet-install.mjs` | **ABSORBED** | the tmux layer is the five documented commands of 17.5, not a vendored dashboard |
| `.mcp.json`, `.claude/mcp-policy.json` | 12 and 65 lines | **RENAMED** | designer's one server and scout's read-only servers; the per-server allow/deny shape is the tool file's seed |
| `docs/02-competitive/` — the catalogue and five reference studies | TREE B only: 1,083 · 901 · 2,157 lines, 5 studies | **SURVIVES** | the door's catalogue. **Every entry re-verified against its LICENSE before admission** — v15 is what that rule caught: n8n's own LICENSE.md, read raw, says internal or non-commercial only |
| The design record — v2, WAKE, WATCH, the minds, v3, Keel, round-5, round-6, `final/` | 86 design docs on TREE B; Keel 2,682 lines | **SURVIVES** | as record: the priors of this plan. Every decision against them is a row of §1-v2, with the losing image kept by name |
| `final/CENSUS.md` | the measurements this section rests on | **SURVIVES** | the census of TREE A and TREE B. §17 and §18 are re-measured against it rather than re-derived |

**(NEW: two things this table does not say)** It does not say when any of this happens — §19 gives dependency and no
schedule. And it does not say that a RETIRED artifact was wrong: `coding.js` and `research.js` are retired because
**nothing invoked them**, and `reviewer.md` is retired because it carries a shell, not because it reviewed badly.
