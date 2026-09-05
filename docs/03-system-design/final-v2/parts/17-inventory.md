## 17 · The inventory, concretely

*obeys: v1, v2, v3, v4, v5, v13, v15, v17, v18, v19, v20, v21, v33, v34, v35 · SPINE §B.2 (fifteen files), §D (seven
pages), §E, §F, §G.1 · inherits: FINAL §16 — every table re-decided against the roster of fifteen and the seven pages*

**(NEW: the roster and the website change what an inventory has to list)** FINAL §16 inventoried three shapes, two
loadouts and thirteen no-model programs. v1 replaces the shapes with fourteen named agents plus the Operator, and v4
replaces one Balcony with seven pages, so every table below is re-decided rather than copied. A path is marked
**ABSENT** unless it was measured on a named branch. Measured on **`ceo-1-1788609834`** (this branch, TREE A of
`final/CENSUS.md` plus this session's own documentation commits): 18 files in `.claude/agents/`, 135 entries under
`.claude/skills/` (134 skills + `routers/`), 6 playbooks, 16 commands, 60 files in `mission-control/`, 5 files in
`bin/`, 8 files in `.claude/hooks/`, and `~/.agentvibe/events.jsonl` at 3,843 lines.

---

### 17.1 The fifteen agent files

**(FOUNDER, v1 and v2)** *"between ten and fifteen agents"*, each *"with its own expertise, knowledge, tools and way
of working"*. One file per agent in the frontmatter format the runtime already reads. **All fifteen files are
ABSENT.** The format, the `PS-*` lint (`.claude/hooks/schema-lint.js`, 1,947 lines, this branch) and six existing
engine files are the seed.

**(NEW: the seed column is what makes this a migration rather than a greenfield)** Six of the fifteen inherit a body
that already passes the lint; nine have no seed and are written from the standard.

| # | Name | File | Seed on `ceo-1-1788609834` | Model | Tools (the argv grant) | MCPs | Skill namespaces | maxTurns | Isolation | Anchor — what proves it |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | **Operator** | `.claude/agents/operator.md` — ABSENT | `orchestrator.md` (154 lines) | `claude-opus-5` | Read Glob Grep Agent | none | — | 30 (v40) | none (v41) | it dispatched, and it did not build: a diff authored by the Operator is a defect |
| 1 | **builder** | `.claude/agents/builder.md` — ABSENT as v2's file | `builder.md` (134 lines) | `claude-opus-5`, escalating to `claude-fable-5-1` under v21 | Read Write Edit Bash Glob Grep | none by default | engineering · testing | 30 (v40) | worktree (v41) | the venture's own CI, plus the done-test, plus the tester's blind test |
| 2 | **reviewer** | `.claude/agents/reviewer.md` — ABSENT as v2's file | `reviewer-readonly.md` (169 lines) — **not** `reviewer.md`, which carries Bash | `claude-sonnet-5`; a second family when reachable | Read Glob Grep | none | engineering · quality | 25 (v40) | none (v41) | findings reproduce from the diff alone |
| 3 | **architect** | `.claude/agents/architect.md` — ABSENT | none | `claude-opus-5` | Read Glob Grep Write (design paths only) | none | engineering · data | 30 (v40) | worktree (v41) | a migration that applies and rolls back in a scratch database |
| 4 | **tester** | `.claude/agents/tester.md` — ABSENT | none | `claude-sonnet-5` | Read Write Edit Bash Glob Grep, `--add-dir` excluding the implementation | none | testing · quality | 30 (v40) | worktree (v41) | the test fails before the change and passes after |
| 5 | **guard** | `.claude/agents/guard.md` — ABSENT | none | `claude-opus-5` | Read Glob Grep | none | security | 25 (v40) | none (v41) | a proof of concept that reproduces |
| 6 | **scout** | `.claude/agents/scout.md` — ABSENT | `sourcer.md` (147 lines, `mcpServers: [claim-append]`) | `claude-sonnet-5`; Gemini once authenticated | Read Glob Grep WebSearch WebFetch — no Write, no credential, no send | read-only servers, admitted per run | research | 25 (v40) | none (v41) | every claim carries URL, quote and access date; `scripts/check-citations.mjs` (846 lines) blocks on a dead one |
| 7 | **designer** | `.claude/agents/designer.md` — ABSENT as v2's file | `designer.md` (151 lines, `mcpServers: [playwright]`) | `claude-opus-5` | Read Write Edit Bash Glob Grep | `playwright`, per-run inline | design · frontend | 30 (v40) | worktree (v41) | a rendered screenshot judged against a named anchor |
| 8 | **product** | `.claude/agents/product.md` — ABSENT | `framer.md` (121 lines) | `claude-sonnet-5` | Read Glob Grep Write (spec paths) | none | product | 30 (v40) | none (v41) | the store check refuses a done-test not falsifiable by someone who did not do the work |
| 9 | **analyst** | `.claude/agents/analyst.md` — ABSENT | none | `claude-sonnet-5` | Read Glob Grep Bash | read-only analytics · error tracking · billing-read | data | 25 (v40) | none (v41) | the reconciliation reads a record the company does not write |
| 10 | **writer** | `.claude/agents/writer.md` — ABSENT | none | split: `claude-opus-5` for taste work, `claude-sonnet-5` for routine | Read Write Edit Glob Grep | Higgsfield, rate-capped | growth · craft | 30 (v40) | none (v41) | staged, never sent; the founder's taste store and a rung-2 external reaction |
| 11 | **growth** | `.claude/agents/growth.md` — ABSENT | none | `claude-sonnet-5` | Read Glob Grep Write | CRM read-only | growth | 30 (v40) | none (v41) | a reply from a real person, recorded by the world's door |
| 12 | **steward** | `.claude/agents/steward.md` — ABSENT | none | `claude-sonnet-5` | Read Glob Grep Write (obligations and operations paths) | **none** (v36) — it writes from scout's handover and the world's door's rows, never from a raw mailbox | operations | 30 (v40) | none (v41) | an obligation is discharged only by a record the company does not write |
| 13 | **curator** | `.claude/agents/curator.md` — ABSENT | none | `claude-sonnet-5`; the summarising half on Gemini or a local model | Read Write Edit Glob Grep — no Bash | none | knowledge | 30 (v40) | none (v41) | a memory item with no source, date, expiry and falsifier is refused at the store check |
| 14 | **challenger** | `.claude/agents/challenger.md` — ABSENT | none | `claude-opus-5`; a second family when reachable | Read Glob Grep | none | quality · research | 25 (v40) | none (v41) | every finding names the mechanism that would have caught it |

**(NEW: what leaves, and it is thirteen files of eighteen)** `reviewer.md` (149 lines, `tools: [Read, Glob, Grep,
Bash]`) is **gone**: a checker has no shell, so the v2 `reviewer` is seeded from `reviewer-readonly.md` instead. The
**eleven 23-line shims** (`ai-engineer`, `database-engineer`, `technical-writer`, `test-engineer`, `ceo`,
`design-lead`, `code-reviewer`, `qa-lead`, `security-engineer`, `research-lead`, `researcher`) are **gone**; none
declares `model:`, `tools:`, `mcpServers:`, `maxTurns:` or `isolation:`, so nothing is lost with them. Fates are §18.

**(NEW: the model set is not the founder's whim, it is §G.1's instruction made countable)** Of the fourteen, **five
run `claude-opus-5`** (builder, architect, guard, designer, challenger), **eight run `claude-sonnet-5`**, and **one is
split** (writer). The Operator is a sixth `claude-opus-5` seat and is counted separately because it dispatches rather
than produces.

**(NEW: a blocking lint stands between this table and a file that loads)** `scripts/prompt-standard.test.mjs` on this
branch pins the valid model set to `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`, `claude-haiku-4-5`.
**`claude-fable-5-1` is not in it**, and `claude-fable-5` is now listed by the vendor under *"Legacy models (still
available)"*. **Mechanism:** the pinned set must move in the same change that writes builder's file, or the file
fails `npm run check`. Not a preference — a red test.

**(v40 and v41: the two cells this section could not fill are filled by class, not by guess)** `maxTurns` is **30 for
the nine that produce** and **25 for the five that only read**, with the Operator at 30 — exactly the two values the
seven existing engine files already use, against a lint ceiling that stays 120. `isolation` is **`worktree` for the
four that touch venture source** and **`none` for the other eleven**, whose grant is a narrowed `--add-dir` and needs
no working tree of its own. **Both override a seed where the class and the seed disagree:** `reviewer` inherits 30
from `reviewer-readonly.md` and takes **25** because it only reads, and `product` inherits 25 from `framer.md` and
takes **30** because it produces. Tuning per agent is a later measurement, not a design decision.

**(NEW: one measured cost rides on `isolation`)** Creating a worktree still cannot complete under the armed sandbox
without escalation — exit 128, 32 denials across `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`. Four
agents declare `worktree`, so **four** need that escalation for exactly one command, and the eleven that never touch
venture source never meet it.

---

### 17.2 Skills — the library, its two directories, its two programs, and the 134

**(FOUNDER, v3)** *"take all the skills that the biggest systems use … we need a skill creator of skill"*. The
library is in the open SKILL.md standard so one artifact loads in Claude Code, Codex and Gemini CLI unchanged.

**(FINAL, re-decided under v3)** Two directories, both real, one source of truth: **`.claude/skills/`** (exists on
`ceo-1-1788609834`, 135 entries) for Claude Code, and **`.agents/skills/` — ABSENT** for Codex and Gemini CLI. Codex
does **not** read `.codex/skills`. Markdown is the single source; harness-native artifacts are generated.

**(NEW: thirteen namespaces)** `engineering` · `testing` · `quality` · `security` · `design` · `product` · `data` ·
`growth` · `craft` · `operations` · `knowledge` · `research` · `frontend`. Each agent's row in 17.1 names the ones it
carries. §E.4 read *"Seven namespaces"* over this same list of thirteen when this section was first written; **the
word was corrected and the list was not**, because every row of 17.1 draws from the thirteen. Today's
`.claude/skills/routers/` holds INDEX + **7** namespace routers, which is the likeliest origin of the number that was
there.

**(NEW: the two programs the library needs, both ABSENT)**

| Program | Path | Does | State |
|---|---|---|---|
| the skill creator | `keel/bin/skill` | scout answers the bounded question · product states the done-test the skill makes reachable · curator writes it into one of the four admissible bodies with a `valid_until` · the eval loop runs with-skill against baseline | ABSENT (v3, §E.3) |
| the admission eval | inside `keel/bin/skill` | 2–3 realistic prompts in `evals/evals.json`, with-skill and baseline **in parallel**, graded assertions, description tuned for triggering accuracy, plus `plugin-eval`'s deterministic static layer | ABSENT. The **mechanism** is imported from `anthropics/skills`, **not the corpus**: that repository has no root LICENSE and its README calls the document skills *"source-available, not open source"* |

**(NEW: the four admissible bodies are the content rule, and they are ours)** **anchor** (a check with an exit code) ·
**exemplar** (examples of good, with provenance) · **rehearsal case** (input plus known answer) · **reference** (a
vendor fact with an expiry). A step list is admitted in exactly one place: a checklist the Sender reads aloud, where
the judge is absent and the act cannot be taken back. **The cost, once (v18):** an imported skill written to the
published spec's recommended *"Step-by-step instructions"* body fails our admission and needs a pass.

**(FINAL §16.2, re-decided under v3 and v19)** The 134 no longer move into a holding directory read by nothing. Each
re-enters through the eval or expires; the fate class is now a **queue position**, not a verdict.

| Fate class (FINAL §16.2) | Count | v2 re-decision — how it re-enters |
|---|---|---|
| PROCEDURE | 73 | **not as procedure.** It may be rewritten into an exemplar or a rehearsal case and must then beat baseline in the eval. All 28 `thinking-*` are here. Un-rewritten, it expires at its `valid_until` and leaves by disposition, never by silence |
| ANCHOR-CANDIDATE | 22 | admitted as an anchor once a test fails without it. First in the queue, because an anchor is what makes a done-test rung 1 |
| EXEMPLAR-CANDIDATE | 16 | admitted as an exemplar with provenance on each example |
| REHEARSAL-CANDIDATE | 1 | `react19-test-patterns`, the only one in the corpus carrying before/after pairs with known answers |
| INFRA | 22 | a vendor fact with an expiry in the facts store, or a tool's admission notes at the door; never loaded into a run as a skill |

**(NEW: the bulk import is blocked on one fetch, v17)** The upstream advertises **2,111+ skills**; the code is MIT and
a **separate `LICENSE-CONTENT` file exists and was not fetched**. No bulk vendoring until it is read. It is §20's row
and it costs one fetch.

**(NEW: retirement has a mechanism because nobody in the world ships one, v19)** Every skill carries `valid_until`; at
expiry exactly one disposition is recorded — Refresh, Deprecate, or Waive with a new date. **Mechanism:**
`scripts/ledger.mjs` (1,531 lines, this branch) already forces exactly this disposition, and `check-citations.mjs`
already blocks on a dead path. Neither is written for this; both are reused.

**(FINAL)** **Never preloaded.** The standard's own progressive disclosure is the mechanism: name and description at
startup, body on judged relevance, bundled files below that. Its published limits are the file's limits: `name` ≤ 64
characters matching the directory, `description` ≤ 1024, ~100 tokens of metadata loaded at startup for *every*
installed skill, instructions under 5,000 tokens, body under 500 lines.

---

### 17.3 Hands — every tool on this Mac, its class, and who in the roster may hold it

**(FINAL §16.3, re-classed in §F's four classes, with the holder column re-decided against the roster)** Today
**none is admitted**; each row is its disposition when it reaches the door. Anything may be proposed — §F's door is
material, not a ceiling.

| Hand | Class (§F) | Credential | Who may hold it | Day · night · never | Disposition at the door |
|---|---|---|---|---|---|
| the founder's signed-in Chrome (`claude-in-chrome`) | REACHES THE WORLD + private data | the founder's own sessions | **nobody but the founder, on the Floor** | day, Floor only, forever | the widest hand in the building; never a night grant, never shared |
| Playwright headless `--isolated` | READ-ONLY | none | **designer** | night | the design anchor; three verbs `.claude/mcp-policy.json` (65 lines) names for denial are in shadow today; the door flips them to block |
| Gmail · Calendar · Drive · Notion **read** | READ-ONLY, **tainted** | OAuth, the founder's | **the world's door** (`keel/bin/inbound`, a program with no model) and **scout**. No agent holding `Write`, `Edit` or `Bash` reads them raw (v36) | night | admitted first: instruments buy freedom |
| analytics · error tracking · billing **read** · the CI API · the git host read API | READ-ONLY | none today | **analyst** · scout · the reconciler | night | **admitted before any other hand**, because the nightly reconciliation cannot exist without them |
| CRM read | READ-ONLY | API key | **growth** | night | scored leads are worthless if the record they score is ours |
| Gmail send | REACHES THE WORLD, one-way | OAuth | **the Sender only** | never unattended until the founder widens the class | anything delivered to a person |
| Drive share · Calendar create · Notion write | REACHES THE WORLD | OAuth | **the Sender**, after a recall window | night only once widened and the undo drilled | a share link is one-way by any honest reading |
| Figma · Pencil · Stitch · Refero (Refero READ-ONLY) | WRITES, reversible | OAuth / local files / API key | **designer**, on a dry branch | night after the undo is drilled | a design file reverts; a published prototype link does not |
| Higgsfield (image · video · audio) | WRITES, reversible, **SPENDS credits** | API key | **writer**, rate-capped | night, under a daily ceiling | publish and social verbs are one-way and never |
| RunPod | **SPENDS MONEY at a rate** | API key, uncapped | nobody | never until a capped key exists | **REFUSED as it stands** (§F) |
| Mem0 | REACHES THE WORLD | unauthenticated | nobody | never | **REFUSED**: memory leaves the machine (§F) |
| n8n | REACHES THE WORLD | unauthenticated | nobody | never | **REFUSED on licence** (v15): Sustainable Use — *"only for your own internal business purposes or for non-commercial"* |
| Miro | REACHES THE WORLD | unauthenticated | nobody until an Intent names one | never today | through the door individually, naming the Intent that needs it |
| `claim-append` (`scripts/mcp/claim-append-server.mjs`, this branch) | WRITES LOCALLY | none | today `sourcer`; in v2 **curator**, as the memory-item append | night | the narrow-capability-through-one-audited-server pattern is the door's model |
| `gh` · `git` · `node` · `bun` · `gemini` | CLIs | `gh` reads `~/.config/gh`, which the sandbox denies; `gemini` 0.38.2 present and never authenticated | **builder** (git, node, bun) · a provider (gemini) | night | each CLI is rehearsed with a known call and a known answer, headless — the test that catches a detached-TTY failure |

**(NEW: a collision this section raised, decided as v36 rather than left open)** §F put the tainted read class at
**scout only** — *"the trifecta agent, which holds no key and cannot send"* — while §B.2 row 12 granted **steward**
the same reads, and steward carries `Write`. Both were in §A and they could not both hold. **Decided 2026-09-05:** a
tainted read is held by `scout` and by **the world's door**, a program with no model, and by nothing else. **No agent
holding `Write`, `Edit` or `Bash` reads mail, calendar, drive or Notion raw.** The world's door writes one inbound row
per event; `steward` writes obligations from `scout`'s handover and from those rows. The losing image is kept by name
in §22: *a steward that reads mail with a pen in its hand*.

**(NEW: the wish list is by need, not by vendor, and every row is WISH until it passes the door)** a payments read API
· a domain and DNS read · an ads platform **read** before any write · a design-token bridge · a database read replica
per venture · an e-signature read for obligations · a second search provider so `scout` is not single-sourced.

**(FINAL)** **Enforced by:** `keel/shared/tools/<name>.yml` per admitted hand with class, credential scope, rate, undo
drill date, description hash and horizon, plus `checklist.md` beside it (**ABSENT**) · `keel/bin/door` (**ABSENT**) ·
`.claude/mcp-policy.json` (exists, 65 lines, the seed of the per-server allow/deny shape). **One MCP shape serves both
runtimes:** Claude Code takes per-subagent `mcpServers`, Codex takes per-agent `mcp_servers` in TOML.

---

### 17.4 Stores — one writer each

**(FINAL §16.4, inherited whole)** Every store keeps its schema, its **one** writer, its readers and the rule that
fails it. Compressed here to what v2 changes; the schemas stand as FINAL §16.4 wrote them.

| Store | Path | The one writer | What v2 changes |
|---|---|---|---|
| Charter | `keel/ventures/<v>/charter.md` | the founder, through the read-back | unchanged |
| Intent | `keel/ventures/<v>/intents/<id>.md` | the founder's door, through the read-back | unchanged; page 4's cards point at intent ids |
| Obligation | `keel/ventures/<v>/obligations.yml` | the Watch | read by **steward** as well as the Watch |
| Facts | `keel/ventures/<v>/memory/facts.md` | **the curator** | v25 makes the single writer an agent with a name and a grant |
| Measured facts | `keel/shared/facts.yml` | the probe | gains the model-expiry rows of 17.4.1 |
| Negatives | `keel/ventures/<v>/memory/negatives.md` | the curator | a skill candidate that does not beat baseline is written here, not discarded (§E.3) |
| Already-built · Open · Taste | `keel/ventures/<v>/memory/*.md` · `keel/shared/taste.md` | the curator; the Watch writes `open.md` | delta-only, never a rewrite (v24, sourced to ACE, arXiv 2510.04618) |
| Craft kits | `keel/shared/craft/<field>/kit.md` | the curator | absorbed into the skill library's exemplar body (v3) |
| Rehearsal cases · scores | `keel/shared/rehearsals/` | the curator · the rehearsal runner | unchanged |
| Shapes | `keel/shared/shapes/` | the founder, through an A/B | **replaced** by the fifteen agent files plus `<agent>.<provider>.argv` |
| Tools | `keel/shared/tools/<name>.yml` | the door | holder column is a roster name (17.3) |
| Defaults | `keel/shared/never-default.yml` · `wake-me-default.yml` | the founder | unchanged |
| Anchors | `keel/shared/anchors/<name>/` | the door | first admissions come from the 22 anchor candidates (17.2) |
| People | `keel/people.yml` | the founder; the world's door on a reply | read by the Sender before any contact |
| Settings | `keel/settings.yml` | the founder | the price rows move out to 17.4.1 |
| The logbook | `keel/logbook/events.jsonl` · `ledger.jsonl` · `runs/<id>/` · `desk/<tick>.json` | everything, through `keel/bin/log` | `~/.agentvibe/events.jsonl` (3,843 lines, this Mac) is its spine; page 3 joins it to the price table |
| Inbound | `keel/logbook/inbound/` | the world's door | unchanged |
| The venture's work · Secrets · the cord · the index · ship log | as FINAL §16.4 | as FINAL §16.4 | the cord is a control on **every** page (§D), not one Balcony view |
| Holding directory | `keel/holding/skills/` | — | **RETIRED as a concept** (v3): there is no directory read by nothing |

#### 17.4.1 The stores mission control needs, which FINAL had no page to need

**(NEW: seven pages that are controls need state that a display did not)**

| Store | Path | Schema | The one writer | Readers | Fails when |
|---|---|---|---|---|---|
| Teams config | `~/.claude/teams/<team>/config.json` · `inboxes/<agent>.json` · `~/.claude/tasks/<team>/` | the vendor's; session ids **and tmux pane ids**; team name is `session-` + the first eight characters of the session id | **Claude Code itself — READ-ONLY to us** | page 2 | anything of ours writes it. The file is *"overwritten on the next state update"*, so a write is lost and looks like a bug in the page |
| Cards | `keel/ventures/<v>/cards/<id>.yml` | card id · intent id · stage · venture · the team it launched · the PR · the execution cap | `keel/bin/run` — the founder's drag is an input to it, never a second writer (v34) | page 4; the Watch | a card in "working on it" with no session id; a stage change with no logbook row |
| Sessions registry | `keel/logbook/sessions.jsonl` | session id (a UUID we mint) · provider · agent · venture · tmux session name · pane id · state · started · ended | `keel/bin/run` | pages 2, 3, 7; `claude --attach`; `tmux attach-session` | a session id that is not a valid UUID (`--session-id` refuses it); a row with no provider |
| Price table | `keel/shared/prices.yml` | model id · input · output · cache write at **1.25x for 5 minutes and 2x for 1 hour** · cache read at 0.1x, **0.025x for Fable 5.1 and Mythos 5.1** · batch at 50% both directions · source URL · date · expiry | the founder, from the vendor page; the probe stamps the date | page 3; the meter | a model id used anywhere with no price row — **refused, not scored at zero**; a row past its expiry |
| Skills registry | `keel/shared/skills/registry.yml` | name · namespace · body class (anchor · exemplar · rehearsal · reference) · with-skill and baseline scores · n · `valid_until` · both directory paths | `keel/bin/skill` | agents at load; the store check | a skill in either directory with no registry row; an expiry passed with no disposition |
| Model-expiry facts | rows in `keel/shared/facts.yml` | model id · retirement date · source URL · date read | the probe | the store check; §20's dated review | a model id in any agent file with no fact row, or a retirement date in the past. **This is G.4's mechanism**: Haiku 4.5 is committed *"not sooner than October 15, 2026"* |

**(FINAL, and it is what these six inherit)** **Enforced by** `keel/bin/check-stores` (**ABSENT**), and by four
mechanisms that already exist on this branch: `scripts/ledger.mjs` (expiry, resolvers, `unresolved ≠ pass`),
`scripts/evict-memory.mjs` (1,125 lines, archive rules), `scripts/check-memory-budget.mjs` (size caps) and
`scripts/verdict.mjs` (sha256 binding of evidence to the exact artifact).

---

### 17.5 Every command, tap and verb

**(FINAL §16.5, inherited)** Every `keel` verb is **ABSENT**: `keel charter <venture>` · `keel intend <venture>` ·
`keel tempo <venture> driven|attended|watching|parked` · `keel floor <venture>` · `keel adopt <path>` · `keel stop` ·
`keel briefing` · `keel why <run-id|intent-id>` · `keel status` · `keel watch start|stop` · `keel door <tool>` ·
`keel drill <tool>` · `keel rehearse <move-class>` · `keel probe` · `keel restore --scratch`.

**(NEW: the programs v2 adds, and every one is ABSENT)**

| Program | Does | Why it is a program and not an agent |
|---|---|---|
| `keel/bin/run` | composes the argv for any provider, mints the session UUID, refuses a malformed brief or a trifecta grant, writes the sessions registry and the card's stage | **v34**: the grant is argv, and exactly one thing may emit it. The Operator never composes argv itself |
| `keel/bin/skill` | the skill creator of §E.3 and 17.2 | it orchestrates four agents; a fifteenth agent orchestrating agents is the Operator, and there is one |
| `keel/bin/probe` | asserts nightly what a run can actually touch | a prompt injection that reaches it finds a program |
| `keel/bin/send` · `inbound` · `watch` · `reconcile` · `log` · `check-stores` · `door` · `drill` · `rehearse` · `curate` · `supervise` | FINAL §16.1's no-model programs, unchanged | **§B.1 rule 4**: the twelve stay programs |

**(FOUNDER, v4)** **Mission-control taps, by page** — page 1 tap an avatar → that agent's terminal · page 2 tap →
`tmux attach-session -t <name>` or `claude --attach <id>`, message → write the agent's inbox file · page 3 a cost row
→ its run, a window row → retempo, an anomaly → the cord · page 4 **drag a card into "working on it" → launch a
session with a team and hand it the task** · page 5 tap a gate → its last ten resolutions, tap a store → its schema
and its one writer · page 6 tap a node → open it on the Floor · page 7 add a session → choose worktree, project,
provider, model, task and agent. **The cord is on every page.**

**(NEW: the Claude Code verbs that ship, and this list is what page 2 and page 7 are built out of)** `claude --bg` ·
`claude --attach <id>` · `--session-id <uuid>` (must be a valid UUID, minted by us) · `--teammate-mode tmux|iterm2` ·
`/goal <condition> or stop after N turns` · `claude agents --json` · `--restricted` (needs v2.1.248+) · `--tools` ·
`--max-budget-usd` (a stall fuse, not a billing control, v23) · `--output-format stream-json --verbose` · `/voice` ·
`/model` · `/effort` · `Esc` · `Esc Esc` · `/btw`. **`/loop` is refused in production** and stays a Floor
convenience (v12). Measured this session: `claude` **2.1.261**.

**(NEW: five tmux commands are the whole terminal-pop mechanism, §D.1)** `tmux new-session -d -s <name> -c <dir>
<program>` · `attach-session -t` · `capture-pane -p -e -J -t` · `kill-session -t` · `has-session -t`. **claude-squad
is AGPL-3.0 and is not vendored**; what is used is the documented tmux CLI those commands call. `iterm2` mode
additionally needs the `it2` CLI **and** iTerm2's Python API enabled. **Split panes are unsupported in VS Code's
integrated terminal, Windows Terminal and Ghostty**, so a page must say which terminal it opens into. AppleScript and
`open -a Terminal` are **UNVERIFIED**.

---

### 17.6 Surfaces

**(FOUNDER, v4)** *"the mission control surface. I want to add it, bring it back"*, and *"when I click on it, the
terminal which runs the agent on my Mac is popping up."* Seven pages, each its own, every one a control.

| # | Surface | Substrate | State |
|---|---|---|---|
| 1 | **The office** | Generative Agents `demo` mode (Apache 2.0), fed by a JSON writer over the event log | ABSENT; through the tool door. §20 keeps the AI Town alternative open |
| 2 | **Agents / child flows** | Claude Code **agent teams**; `~/.claude/teams/<team>/config.json` read-only | the substrate ships; the page is ABSENT |
| 3 | **Cost · tokens · efficiency** | the event log with `gen_ai.*` attribute names, joined to the price table (17.4.1) | ABSENT; `~/.agentvibe/events.jsonl` is the spine |
| 4 | **Tasks · tickets · PRs** | ours. Prior art: OpenAI **Symphony** (Apache-2.0, alive 2026-08-19); card fields from Linear (**delegate**, not assignee) and Copilot (one branch, exactly one PR, a hard execution cap) | ABSENT. **Nothing in the world gives a card a team** (v16) |
| 5 | **Engines · how it works** | the same store as every other page; no second source of truth | ABSENT. Absorbs the Balcony's *Decide* and *Last night* as its desk strip |
| 6 | **3D file graph** | `3d-force-graph` (MIT). **Its input is a `{nodes, links}` object; it does not read a repository** — the extractor is ours. Gource refused (GPL-3.0) | ABSENT; the thinnest researched area |
| 7 | **Canvas / playground** | **Langflow** (MIT, alive 2026-09-05) as the idiom. **n8n refused** (licence) · **Flowise refused** (archived, licence NOASSERTION) | ABSENT |
| — | **The Floor** | Claude Code, interactive, `keel floor <venture>` | the runtime exists; the loader is `.claude/hooks/session-start.js` (259 lines, emits 2,941 bytes under a 4,096 ceiling). **Unchanged, and it is what every tap opens** |
| — | **The read-back** | the intent-creation form on **page 4's *new card* and page 7's *add session***, and a published phone page for voice (v38); the confirm tap is what binds | ABSENT |
| — | **The briefing** | the **top strip of page 5**, and a published phone page; margin comments addressed to an intent id (v38) | ABSENT |
| — | **The menu bar** | a glyph reading the logbook: running / waiting on you / stopped | ABSENT |

**(v38: the read-back and the briefing are placed, and neither becomes an eighth page)** The **read-back is the
intent-creation form wherever an intent is born** — page 4's *new card* and page 7's *add session* — and it **stays a
published phone page** for voice. The **briefing is the top strip of page 5** and also stays a published phone page.
`Decide` items appear on page 4 as cards in a *waiting on you* column, and on the phone. This is placement and not a
new mechanism: both were already published pages, and the founder's pages absorb rather than delete them (v4).
**Mechanism:** the store check refuses an intent with no read-back confirmation row (ABSENT).

**(FINAL, and it survives the placement)** The Balcony is absorbed, not deleted — `Now` → page 2, `Decide` → page 4's
waiting column, `Last night` → page 5, `Ventures` → page 1, `Cord` → a control on every page — and FINAL §13.2's rule
*every element is either a fact or a tap* survives, extended by v14 to the dashboard the founder asked for.

**(v39: the website is served on the Mac, by the server that already exists)** `mission-control/` — the Bun and Hono
server and the React client, **60 files on this branch** — serves the seven pages, **because a terminal pop needs
`tmux` on the same machine**. The phone reaches the system two ways: the **published artifact pages** (Balcony views,
the briefing, the read-back) for reading and deciding, which **cannot pop a terminal**; and the local server over the
founder's own network for everything else. **The cost, stated once:** two renderers over one state, which FINAL §13.1
refused. It is accepted because a tap that opens a terminal cannot come from a hosted page, and because both
renderers read the same logbook.

---

### 17.7 Providers, and what position each may stand

**(FINAL §16.7, re-decided under v5, v20 and §H)**

| Provider | May stand | Window | argv file | State, measured 2026-09-05 |
|---|---|---|---|---|
| **Claude Code** (subscription) | every agent of 17.1; **the Floor, always**; the Operator | **two windows: a rolling five-hour AND a weekly, per seat, shared with Claude chat and Cowork** (v22); one-hour cache | `<agent>.claude-code.argv` — ABSENT | installed, **2.1.261** |
| **Codex CLI** (subscription) | **day one (v5), in one position:** checker on a prepared diff, foreground, stdout to a file while inheriting the parent shell's TTY | its own window; **the only vendor publishing numeric per-window quotas** | `<agent>.codex.argv` — ABSENT | **not installed** (`command -v codex` → absent). #19945 open **130 days with no maintainer reply** |
| **Gemini CLI** (subscription) | scout on routine work; the summarising half of the curator | free tier 60 requests/min, 1,000/day on a personal account; paid tiers UNVERIFIED | `<agent>.gemini.argv` — ABSENT | installed **0.38.2**, never authenticated; auth state unreadable (`~/.gemini` is `denyRead`) |
| **Local models** | **real work, not no work** (v20): embeddings, classification, dedup, PII detection | none — electricity | — | ABSENT. MiniLM (384 dims, Apache 2.0, 256-word-piece truncation) · Qwen3-0.6B (32,768 context, Apache 2.0); on-disk size not published |
| **The artifact runtime** | the published phone pages: Balcony views, the briefing, the read-back. **It cannot pop a terminal**, which is why it is not the website's host (v39) | free | — | exists; measured: database, user identity, comments that wake the session |
| **Routines** (cloud) | **refused for the Watch**: cloud-only, cannot reach local files | daily cap | — | exists |
| **A gateway key** (LiteLLM · OpenRouter) | the only portable credential and the only budget surviving a provider change | per key per period | — | deferred with the metered key (§20 row 1) |

**(FOUNDER, v5)** *"I run from day one of the system to include codex and Claude code."* **A third program drives
both** (§H.1): the Operator is the founder's contact point and runs inside Claude Code; every dispatch to any provider
goes through `keel/bin/run`. **The cost, stated once:** one foreground slot is not parallel, so **Codex is not a night
lane** until the headless rehearsal passes — `codex exec --json`, no controlling TTY, a non-trivial prompt, version
≥ 0.124.0, against known-answer cases.

**(NEW: no agent's default is Haiku, v20)** Haiku 4.5 appears only where the vendor sets it: `/goal`'s evaluator and
the auto-mode classifier. Its retirement is committed *"not sooner than October 15, 2026"* — the nearest retirement
date of any model this system names.

---

### 17.8 The file tree of the house, and of a venture

**(FINAL §16.8, with the fifteen agent files, the two skill directories, the website and the new bins added)**

```
keel/                                   one private repository · the house
  settings.yml                          windows{reserve, models} · tick · driven_limit (2) · wip · interruptions/day
  STOP                                  the cord: a file, read first every tick; a control on every mission-control page
  people.yml                            named humans: consent per relationship; first contact narrower than reply
  agents/                               THE FIFTEEN — one file per agent, frontmatter the runtime reads
    operator.md builder.md reviewer.md architect.md tester.md guard.md scout.md designer.md
    product.md analyst.md writer.md growth.md steward.md curator.md challenger.md
    <agent>.<provider>.argv             the exact argv per agent per provider — the grant IS these strings
  bin/
    run · skill · probe · watch · send · inbound · reconcile · log · check-stores · door · drill · rehearse ·
    curate · supervise
  shared/
    skills/                             THE LIBRARY, one source of truth, thirteen namespaces
      <name>/SKILL.md                   one of four bodies: anchor · exemplar · rehearsal case · reference
      registry.yml                      name · namespace · body class · eval scores · n · valid_until
    prices.yml                          model id · in · out · cache write (1.25x 5-min, 2x 1-hour) · cache read
                                        (0.1x; 0.025x Fable) · batch 50% · source · date · expiry
    facts.yml                           measured facts, each with its re-measurement command and its expiry,
                                        including one model-expiry row per model id in use
    tools/<name>.yml · checklist.md     every admitted hand: class · credential scope · rate · drill date · hash
    anchors/<name>/                     rung-1 checks: a script with an exit code and the record it reads
    never-default.yml · wake-me-default.yml
    taste.md                            the founder's, mined and confirmed; a held-out fraction
    rehearsals/<move-class>/            known-answer cases; scores.jsonl per agent
  ventures/<name>/
    charter.md · intents/<id>.md · obligations.yml
    cards/<id>.yml                      the board's cards: intent id · stage · the team it launched · the PR
    memory/{facts,negatives,already-built,open}.md
    ship-log.md
    work/                               the venture's own repository: ordinary source, branches, CI
    .agents/skills/                     GENERATED from shared/skills — read by Codex and Gemini CLI, not .codex/skills
    .claude/skills/                     GENERATED from shared/skills — read by Claude Code
  mission-control/                      the website: seven pages, each a control, every tap opening a terminal here
    server/ client/ scripts/            seeded from mission-control/ on ceo-1-1788609834 (60 files) — §18
  logbook/
    events.jsonl · ledger.jsonl         typed, append-only, gen_ai.* names, an id on every row, F_FULLFSYNC
    sessions.jsonl                      session id (UUID) · provider · agent · venture · tmux name · pane id · state
    runs/<id>/                          brief · trace · handover · evidence
    desk/<tick>.json · inbound/
  .index/                               SQLite, WAL; vectors; deletable; rebuilt in one pass
  .secrets/                             NOT in git. Keychain references only.
```

**(FINAL)** In git: the fifteen agent files and their argv, charters, intents, obligations, memory, the skill library
and its registry, prices, tools, handovers, the ledger. On the machine only, rebuildable: the index, old traces,
worktrees in flight, the generated skill directories. Never in git and never in a file: credentials, customer PII.
Off the machine by hash: renders, screenshots, video, audio.
