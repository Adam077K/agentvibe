# StartupOS — v1: the frame

**Status: v1 — the merged frame. On 2026-09-02 the founder accepted the fifteen board decisions as the floor, with the six amendments and three choices recorded in Part IV.** Part I (§1 · §1b · §2) is v0's
record, kept verbatim. Part II replaces v0 §3–§9. No work is authorised by this document; the build order's
step 1 is the founder's hand, and nothing in Part II exists on disk yet.

```
version: 1 · date: 2026-09-02 · supersedes: v0 §3–§9 of this file
sources:
  docs/03-system-design/designs/2026-09-02-company-first.md    ┐
  docs/03-system-design/designs/2026-09-02-runtime-first.md    │ the four whole-system designs — the record
  docs/03-system-design/designs/2026-09-02-creativity-first.md │
  docs/03-system-design/designs/2026-09-02-minimal.md          ┘
  docs/03-system-design/designs/00-BRIEF.md                        the fixed 18-section shape
  docs/08-agents_work/board-meetings/2026-09-01-startup-os-r01.md  15 decisions D1–D15, 17 dissents — the floor
  docs/03-system-design/vision/2026-09-02-THE-PICTURE.md          the full-scale picture, three sealed visions merged — Part IV
how it was made: four sealed designers → one fresh-context synthesizer (271 lines) → CEO review against an
  independent reading of the same four. Every section carries `grafted_from:`; every rule names the mechanism
  that enforces it or says WISH. Checked at assembly: 14 of 14 territories carry `enforced_by:`, one mechanism
  is INVENTED and justified, every D1–D15 is bound by at least one section.
```

---

# Part I — why, the census, the founder's decisions (v0, verbatim)

## 1 · Why we are here

The founder used the system on a real project (beeond) and it did not feel like the thing they wanted.
Not incomplete — pointed at the wrong thing.

**What was built is a truth machine. What was asked for is a company.**

Every strong mechanism in this repo answers *is what we just said true?* — the claim ledger with expiry,
the verdict binding, the risk classifier, the 48 checks, the supersession blocks. This is rare and good.
No surveyed system has an equivalent.

Nothing in it answers *is this good?*, *what should we do next?*, or *make me a video*.

Four facts, all from the repo's own record:

| Fact | Where |
|---|---|
| 171 session files. Essentially all about the harness itself | `ls docs/08-agents_work/sessions` |
| The `design` lens — a file whose job is "how to PRODUCE work" — has five steps, all of them judging actions | DECISIONS 2026-08-29 |
| *"The circulation is wired; the heart has not started… the loop still begins where a person types"* | DECISIONS 2026-08-26 |
| beeond made 11 mockups and could not look at one of them | beeond session 2026-08-26 |

The layers, and where the effort went:

```
 L5  GOALS     what we're chasing, outliving one session      ✗  nothing
 L4  LOOP      what happens when nobody is typing             ✗  nothing
 L3  BALCONY   where the founder watches and steers           ~  half
 L2  WORKERS   who does the work, holding which tools         ~  7 engines · 2 of 18 hold any MCP tool
 L1  TRUTH     is what we claimed actually true               ✓✓ excellent
```

**And the roster axis was wrong.** Collapsing 26 agents to 7 engines was right reasoning — agents
differed only by domain knowledge, and domain knowledge belongs in data. But the axis kept was *shape of
work*. What actually separates a marketer from a backend engineer is **capability**: which tools they
hold, what artifact comes out, what proves it finished. Which is why sixteen of eighteen agent files hold
no tools while hundreds of MCP tools sit unused.

---

## 1b · The census — asked for, against what is on disk

Three parallel inventories (harness · surfaces · knowledge) ran 2026-09-01. **The first diagnosis above is
true and shallow.** The real finding is that most of what was asked for was already written and connected
to nothing.

| Asked for, in the founder's words | What already exists | State |
|---|---|---|
| *"maybe we should add a thinking board"* | `/board-meeting` — 6 personas, 4 rounds, de-anchored framings, cross-critique, `source_persona_round` traceability, `preserved_dissents`, $3 cap, founder veto | **Never run** |
| *"second opinion or another opinions"* | `multi-agent-patterns/SKILL.md` — debate protocols, weighted voting, **sycophancy triggers**. Declared by `orchestrator` | **Never dispatched** |
| *"we lose the creativity… not a playbook that just follows"* | `design.js` — blind variations from distinct angles → blind judges → synthesise the winner **grafting the runner-up's ideas** | **Zero invocations ever** |
| *"make sure we're not burning tokens"* | `budget-guard.js` — rolling-window ceiling + stall ceiling | **Registered nowhere** |
| *"how can we use workflows"* | `qa.js` · `coding.js` · `design.js` · `research.js` | **1 of 4 runs** |
| *"monitor and see everything"* | mission-control 7 views · `warroom cost` · typed `events.jsonl` | **1 of 7 views acts** |
| *"how do we make sure quality stays up"* | `qa.js` — oracle first, blind reviewers, adversarial verifiers, shell-less judge | **Works. 8 runs; blocked its own author on PR #47** |
| *"walk relentlessly until they achieve the goal"* | — | **Absent** |
| *"run automatically, 24/7"* | — | **Absent** |
| *"set tasks, set goals, milestones"* | — | **Absent** |

**Six exist unwired · three genuinely absent · one works.**

> **The illustration, and it is the whole argument.** In beeond the founder asked for design help, was
> offered *"pick one of three directions"*, rejected it, and asked for a language **assembled from parts**.
> `design.js` does exactly that and had never been invoked. It was not a creativity problem. It was a
> wiring problem, and it cost a design round.

### Evidence — re-derived in this worktree, 2026-09-01

```
THE THINKING LIBRARY IS ORPHANED
  grep -rl 'thinking-' .claude/agents      0 of 18
  grep -rl 'thinking-' .claude/playbooks   0 of  6
  grep -rl 'thinking-' .claude/commands    0 of 17
  control: brainstorming → 9 files · worktree-isolation-pattern → 5 files

THE THINKING BOARD HAS NEVER CONVENED
  8 personas named by /board-meeting   →  0 have agent files
  docs/08-agents_work/board-meetings/  →  directory does not exist
  control: .claude/agents/reviewer.md  →  exists

THE BUDGET GUARD WORKS AND IS UNREGISTERED
  grep -c budget-guard .claude/settings.json   0      (control: pre-tool-use.sh → 1)
  live windowUsage()      588,652 output tokens / 5h  (2,927 transcript files)
  live sinceLastArtifact  199,103 output tokens       (session file, 145m ago)
  hook latency, warm      0.08s

A LIVE BYPASS IN A BLOCKING HOOK
    npx --version     BLOCKED by .claude/hooks/pre-tool-use.sh
  ( npx --version )   ran — returned 11.10.0

A SECOND MODEL FAMILY IS REACHABLE AFTER ALL
  ~/.npm-global/bin/gemini   installed        codex   not installed
  (the repo states in four places that no non-Anthropic model is reachable)
```

**`budget-guard.js`, verified by execution, is Decision 8 already built.** Two ceilings in output tokens:
a rolling 5-hour **window** ceiling, account-wide across every project; and a **stall** ceiling counted
since the last *durable artifact on disk* — a commit, a claim event, or a session file — and **never the
agent's own claim to be done**. At the ceiling it applies a safelist (`git commit/push`, `npm run check`,
`gh pr create`, the ledger, and writes to session files and `DECISIONS.md`) so **landing work is never
blocked**; an override demands a written reason and logs it with the numbers; and it announces its own
fail-open rather than pretending. Registering it edits `.claude/settings.json` — `irreversible` tier,
denied to the write tools — so it needs the founder. It has no test of its own; its measurement library
does, and that is already a blocking CI step.

**Sight is not a blocker.** A PNG read directly into context, chromium binaries cached, `playwright` a
configured MCP server, and `designer` already carrying `mcpServers: [playwright]`. The beeond failure was
that project's wiring, not a missing capability.

**Also inventoried, and worth keeping:** `bin/warroom` is not only a launcher — it already implements cost
pricing per worker, a typed `events.jsonl`, typed messaging into a running session, cross-worker file
overlap detection, and ten-deep session snapshots. The bash program goes; **six of its features must be
reborn as data.** And the knowledge layer is much stronger than the capability layer: 134 skills including
**28 mental models with stop rules**, 13 business-growth skills of which every one is non-engineering, and
a `CURATION.yml` recording 55 cuts with the test that justified each — and more than ten reversals.

---

## 2 · Decisions taken (2026-09-01, founder)

| # | Decision | Consequence |
|---|---|---|
| 1 | **Keep L1. Rebuild everything above it.** | Ledger, classifier, verdict binding and check suite survive. Roster, playbooks-as-pipelines and the 3,429-line launcher do not. |
| 2 | **Resting state: work a goal tree, escalate when stuck.** | The system does something when nobody is typing. Needs missions, a loop, and a way to reach the founder. |
| 3 | **Workers = thin capability packs. Personas exist, separately.** | A pack is a grant and a stop. A persona argues and never builds. |
| 4 | **Built for this Mac, for the founder.** | Template extraction is a later question. Deliberately not designed for now. |
| 5 | **Escalation is balcony-only, Claude-native.** | No Telegram, no bot, no third-party plumbing. The balcony plus Claude Code's own notifications and scheduled tasks. |
| 6 | **Four pack families first; agents learn new fields themselves.** | web/feature · design/brand · content/video · customer/market. Anything else, the agent researches its way into. |
| 7 | **First mission is a synthetic one — a landing page for a fake company.** | An end-to-end acceptance test of the whole system. Not yet; when the machine can hold a mission. |
| 8 | **The rope: reserve headroom in the rolling window.** | The loop stops itself at a set fraction of the 5-hour window. It never competes with the founder for their own quota. |
| 9 | **Global facts, project taste.** | How a field works is learned once and shared. Brand, voice, customer and stack stay with the project. |

---

---

# Part II — THE FRAME (§0–§17), merged from four designs

## 0 THESIS
StartupOS is a machine that makes and a founder who ships. Its center is `ventures/<slug>/EXPOSURES.yml`: what left this Mac with the company's name on it, and what came back. Everything else serves that record. A goal tree is turned one move per process by `scripts/loop/tick.mjs` under launchd, and the process exits, so fresh context costs nothing. A pack is an argv, never an agent file: a tool absent from a `claude -p` process cannot be called by any reasoning, injection or error, and `--strict-mcp-config` was measured on 2026-09-02 to make the founder's user-scope servers absent rather than denied. That argv is the policy seam. An archive keeps every candidate a variation round makes, so creative range compounds instead of being deleted three-to-one. The truth layer (ledger, classifier, verdict binding, check suite) is kept whole and demoted from protagonist to instrument. Year one is small on purpose: one venture, one mission in flight, one pack, no outbound hand, the founder publishes by hand. Every refusal carries a countable reopen trigger that a monthly report reads, so a refusal is a mechanism and not a wish. Position 1 is not a mechanism: it is one page the founder posts by hand, with the pass threshold written down first.
grafted_from: company (exposure center, four books) · runtime (tick, argv seam, harness outside sandbox) · creativity (archive, ORIENT) · minimal (WIP 1, reopen triggers, founder publishes) · Decision 1, D10

## 1 Missions & drive
IS:
- `ventures/<slug>/MISSIONS.yml`: a tree, uncapped depth. Exactly one mission `in_flight`. A mission = `intent:` {task, purpose, end_state, constraints}, `falsifier:` (cheapest move that would prove it wrong), `done:` {rung, resolver: command|world|human, test, approved_by: founder, approved_on}, `goals:` nested, each leaf with its own `end_state` and `done`. `constraint:` is one pointer with an expiry and does not gate dispatch.
- Task id `M-0007.3.1#2` = mission · path · attempt, regex `^M-\d{4}(\.\d+)*#\d+(v\d+)?$` (`v` = variant inside a round). Minted by `tick.mjs` before spawn. Prefix sums give cost per mission and per branch. Attempt ≥ 3 on one leaf with no pass is `stuck`, free.
- Priority: `scripts/loop/next.mjs` returns the leftmost open leaf of the single in-flight mission. Pure, deterministic, no field a model benefits from filling.
- `blocked` is authored by the worker (`because`, `clearable_by` resolving to `founder`, `until` required). `stalled` is computed by the clock brake (§13). `stuck` is computed from the attempt number. Blocked frees the slot. A founder-clearable block also carries `default_if_unanswered:` — always the reversible branch — and an expired `until` forces one of **four** dispositions: cleared, escalated, waived with a new date, or `fused`, meaning the default fired and the founder's silence is recorded as a decision rather than as an unread item. Blocks whose class is irreversible, financial or first-contact carry no default and cannot fuse (D6, by type). *Founder's choice 2, 2026-09-02.* Three waivers on one block surface on the balcony as "decision avoided".
- Cycle: STOP file → STEER.md → brakes → next leaf → mint id → compile pack → spawn one `claude -p` → oracle → record rows → rewrite BOARD.md → exit.
grafted_from: company (id format) · runtime (tick shape, resolver kinds) · minimal (leftmost leaf, P6 refused) · creativity (C36 falsifier) · P5 P7 B1 B3 B5 W2 C36 · tree-as-priority INVENTED by minimal
binds: D1 D7 D12
enforced_by: `schema-lint.js`'s existing steps/how/method/implementation predicate pointed at `intent:` · `scripts/missions.test.mjs` (transition table; second `in_flight` refused; block without `until` refused; a fusable block without `default_if_unanswered:` refused; a default on an irreversible, financial or first-contact class refused) · `next.test.mjs` determinism · `check-donetests.mjs` fails `resolver: judge`, no `rung`, no `approved_by`
decided: priority is the tree, not WSJF over declared fields. Reopen when a second mission is in flight.

## 2 Workers & roster
IS:
- Seven engines stay as files. Zero new agent files. The loop never dispatches through `Agent`.
- `packs/<id>.yml`: `id, engine, model, tools, mcp, reach, warrant_kind, reversible, blast_radius, timeout_s, attempts: 3, skills, done{proposed_by: agent, approved_by: founder, rung}`, optional `variation:{n, descriptors, novelty_slots, diversity_floor, constraints_deck}`. `tools` must be a subset of the engine's own `tools:` line. `steps/how/method/implementation` refused by schema. `warrant_kind:` is a name from a declared enum (`none | standing | morning`), read by nothing in year one and refused if not in the enum — the tested home for `artifact_sha256`, `not_before` and an attenuation chain on the day the first outbound pack is proposed. *Founder's choice 4.*
- `scripts/loop/pack.mjs` compiles to `claude -p --model … --allowedTools … --disallowedTools … --mcp-config $TMPDIR/pack-<id>.json --strict-mcp-config --output-format json --max-turns N --append-system-prompt "$(node scripts/loop/prompt.mjs <task>)"`. Never `--bare` (measured: no auth).
- One pack in the first 30 days: `web-feature` (Read Write Edit Glob Grep Bash, mcp: [playwright], reach: local). `design-brand`, `content-video`, `customer-market`, `content-copy` are named and unbuilt.
- Concurrency: one mission, one move per tick. Parallelism only inside a move, as harness-side fan-out: `tick.mjs` spawns `variation.n` processes under one grant with different constraint cards. Workers never hold `Task`.
- Field learning is a separate move under the `orient` grant: `[Read, Glob, Grep, WebSearch, WebFetch]`, no Write. It returns exemplars and rules as JSON; the harness writes the note (§4).
grafted_from: runtime (compiler, engine ceiling, orient grant) · company (`check-packs` rules) · creativity (`variation:` block) · minimal (one pack, reopen trigger) · hands.md §5.1 patterns 2–3 · C4 C16 K1 P5
binds: D3 D10 D11 D12 D14
enforced_by: `scripts/loop/pack.test.mjs`: every argv contains `--strict-mcp-config`; tools ⊆ engine; any denied name (`tiktok_publish`, `sandbox_exec`, `send_message`, `share_file`, `claude-in-chrome`) fails; `variation:` without `descriptors:` fails; an `mcp` entry `.mcp.json` does not back fails; `reach ≠ local` with no human gate id fails · `check-registration.mjs` sweeps packs
decided: 1 mission, fan-out inside a move (runtime, minimal, creativity over company's two lanes). Reopen when one cycle's wall clock exceeds 4h AND the stall counter is clean. Second pack: reopen when a mission's approved done-test cannot be met by the granted tools, which arrives as a blocked row with `clearable_by: founder`.
Worker trust stays dissolved (D11). **Pack-field trust** — the durable subject, a file whose outcomes join on the task id — reopens when a second pack ships. *Founder's choice 1.*
founder: which unbuilt pack comes second is set by the first such blocked row, not by a plan.

## 3 Hands
IS:
- Three tiers, decided by which process holds the hand. H = harness, outside the sandbox: `git gh ffmpeg sips say afplay osascript caffeinate gemini ollama`, and `git worktree add`. W = the pack's argv; `Bash` only in `web-feature`. F = founder: everything that leaves the machine.
- Year one builds zero MCP servers. The five servers the designs name become five harness scripts, because their only caller is the harness: `scripts/expose.mjs` (register, founder's tap), `scripts/world.mjs` (deterministic parse → a reading), `scripts/mine-corrections.mjs` (transcripts, regex), the archive write and the field write (both inside `tick.mjs`).
- No pack holds publish, send, spend or contact. Staging = `tick.mjs` copies the artifact to `ventures/<slug>/staged/<task>/` and records its sha256 on the row. Publishing is the founder's hand. Every staged act that would leave the machine carries `not_before:` on its row, default `08:00` the next morning — one field, so the hour is a property of the row and not a policy someone remembers (*founder's choice 8*). `expose.mjs <task> --url <u> --check-on <date>` records it.
- Refused on every argv: `mcp__higgsfield__tiktok_publish`, `sandbox_exec`, Gmail `send_message`, Drive `share_file`, `claude-in-chrome`, n8n, any ad, registrar, postage or GPU-rental hand. `higgsfield generate_*` and `virality_predictor` are workshop hands for `content-video` when it reopens.
- Daily `claude mcp list` → `~/.agentvibe/hands.json` from the briefing plist. It is a report, not a check (exits 0 unhealthy, measured). An unhealthy server the current pack grants is a balcony row. `playwright` is measured failing across two scopes and rung 0 for pages depends on it.
grafted_from: runtime (tiers, harness outside sandbox) · minimal (zero servers, reopen-by-hand rule) · company (stage-only matrix, `no send on any pack`) · creativity (refusal list, higgsfield as workshop) · H1 H2 R2 R4 · hands.md §0.1 §3.3 §8
binds: D2 D3 D9 D13 D14
enforced_by: argv absence (`pack.test.mjs`) · `--strict-mcp-config` (measured) · `pre-tool-use.sh` untouched as the second layer
decided: stage only; the founder publishes by hand. The `send` verb reopens when `EXPOSURES.yml` shows the founder performing the same outbound act by hand three times. Servers reopen when a worker's JSON return cannot express a state change it needs mid-move.
founder: how a coarse server (higgsfield, 84 tools) is narrowed when `content-video` reopens (board item 4). The frame's answer is per-tool names in `--allowedTools`, pending M3.

## 4 Knowledge
IS:
- Skills are injected, not discovered. `prompt.mjs` inlines `.claude/skills/routers/INDEX.md` plus the pack's one namespace (~1,070 tokens) under the 4,096-byte prompt cap. Metered: after each move the harness scans the session transcript (`session_id` from the JSON result, measured) for Reads under `.claude/skills/**` and writes `skill.read` rows keyed on the task id.
- Fields: `~/.agentvibe/fields/<slug>.md`, global by sandbox geometry (`~/.agentvibe` is the one `allowWrite` path outside the root). Shape: three exemplars (good, bad, near-miss), each with a source, rules subordinate, every fact a claim with `valid_until`. Written only by the harness from an `orient` move's return.
- Taste: `ventures/<slug>/TASTE.md`, founder-only, ≤ 20 lines: WHAT IT IS · WHO FOR · IN THEIR WORDS · ONE LINE · REFERENCES · ADJECTIVES · NO-GOS. Tiered `irreversible` in `qa-tier-floor.yml`. Injected whole into MAKE.
- Dead ends: `ventures/<slug>/dead-ends/<goal>-<n>.md` with `retry_if:`. Never expires. `tick.mjs` refuses to close `failed|abandoned` without one.
- ORIENT is computed by `scripts/loop/orient.mjs` and prepended: matching dead-ends (actual entries, byte-capped), attempts already made on this leaf, archive cells occupied, the field's exemplars, one thinking model's stop rule from the routers. The maker prompt never carries a rubric, scoring axis or reference URL (C18).
- Decks: `decks/constraints-visual.yml`, `decks/transfer-far.yml`, one card per variant, drawn without replacement, checked mechanically where the card declares a check.
grafted_from: runtime (injection, fields path, X2 scan) · creativity (ORIENT block, exemplar triad, decks, C18) · company (TASTE shape, dead-ends before ORIENT) · minimal (meter the library) · C9 C13 C16 C25 K1 K2 K3 X2
binds: D7 D8 (telemetry half) D12 · Decision 9
enforced_by: `prompt.test.mjs` (bytes, router present, no rubric strings, no reference URL) · `check-fields.mjs` (no exemplar or no expiry fails) · `orient.test.mjs` with positive controls (a known dead-end must appear) · `claim-source` resolves every exemplar source
decided: inject AND meter (CEO). `FIELDS/` is built with its own falsifier: by 2026-12-02, if X2 shows no field note read by a task outside the mission that wrote it, `FIELDS/` freezes. Reopen on minimal's trigger: two missions ORIENT the same field.

## 5 Memory
IS:
| Store | One rule | Sole writer | Reader |
|---|---|---|---|
| `MISSIONS.yml` | transitions from a table | `tick.mjs` (state), founder (intent) | `next.mjs` |
| `BOARD.md` | rewritten whole, ≤ 4,000 bytes | `tick.mjs` | next prompt |
| `STEER.md` | read at tick top; `stop:` is the andon cord | founder | `tick.mjs` |
| `TASTE.md` | founder only, ≤ 20 lines | founder | MAKE prompt |
| `EXPOSURES.yml` | append-only; `check_on` required; `no_data` ≠ `not_checked` | `expose.mjs` | `claim-world`, briefing |
| `~/.agentvibe/fields/` | every fact a claim with `valid_until` | harness | `orient.mjs` |
| `dead-ends/` | never expires | `tick.mjs` | `orient.mjs` |
| `archive/<slug>/<field>/<cells>/<task>/card.yml` + `INDEX.jsonl` | every candidate kept; rotates by volume; never deleted | `tick.mjs` | `orient.mjs`, balcony |
| `taste/PAIRS.jsonl` | only the promote handler writes | `promote.mjs` | archive falsifier counter |
| `~/.agentvibe/events.jsonl`, `tasks.jsonl` | no row without `task` | `logEvent`, `tick.mjs` | balcony, monthly, brake |
| `DECISIONS.md` + ledger | unchanged | as today | `evict-memory.mjs` |
- Retrieval by construction (the harness injects) and by `Grep`/`mdfind`. No vector store.
- Conflict: newer wins, older superseded in place with the reason and a `superseded_by:` header.
- Forgetting is `evict-memory.mjs`, pointed at each new store with its four rules re-derived. Nothing is deleted to meet a cap.
- Transcripts are instrumentation, read monthly in the harness (corrections, dead sessions, cost), never into a producing context.
grafted_from: runtime (one writer each) · company (four books, EXPOSURES rules) · creativity (archive, `card.yml`, PAIRS, MEM1) · minimal (reader column) · MEM1 MEM2 MEM3 A4 W3 C2 C21
binds: D1 D8 D12 (archive cells and dead-ends are data, outside the ceiling) · Decision 1
enforced_by: `check-memory-budget.mjs` rows for `BOARD.md` and `BRIEFING.md` · `check-exposures.mjs` (past `check_on`, no disposition → fail) · `check-archive.mjs` (every INDEX row resolves; a card without a task id refused) · a test that no path but `promote.mjs` writes `PAIRS.jsonl` · `ledger lint` on field claims
decided: the archive is built (CEO), with creativity's falsifier: 30 days after the first `card.yml` exists, zero founder promotions of a non-nominated cell AND zero ships from a non-nominated cell → delete `archive/`, keep `distance.js` and `select.js`. If no round has run by 2026-10-02, that is the finding and the archive is not built. Reopen: founder re-decision only.

## 6 Communication
IS:
- Star, and it is physics: a `claude -p` child has no address. Down = the compiled prompt. Up = JSON on stdout parsed by `tick.mjs` into a fixed return: `outcome ∈ {done, blocked, stuck, failed, truncated}`, `artifacts[]`, `tried[]`, `learned`, `blocked{because, clearable_by, until}`, optional `proposed_done_test`. `stop_reason` (measured field) marks `truncated`; a truncated move is never `done`. No sideways channel in year one.
- `BOARD.md` in SBAR: Situation · Background · Assessment · Next (a real leaf id) · Blocked. A missing heading fails.
- Help = the return's `tried:`. A `blocked|stuck|failed` return with no `tried:` is recorded `failed` with a finding.
- Escalation: L1 retry up to `attempts: 3`, counted by `tick.mjs` from event rows, never by the worker. L2 = blocked with `clearable_by: founder`, next leaf. No L3 wake, no council.
- Interrupts: one `osascript -e 'display notification'` per new founder-clearable block, 08:00–22:00, at most `notify_per_day`, from the harness. Everything else waits for the 08:00 briefing.
grafted_from: runtime (return shape, `stop_reason`, notification window) · company (SBAR baton) · creativity (`tried:` doubles as the dead-end) · minimal (two-rung ladder, no council) · CO1 CO3 N3 B4 P7
binds: D1 D11 D13
enforced_by: `return.test.mjs` (missing field → `failed`; `done` with a truncating `stop_reason` → `truncated`) · BOARD schema lint · `tick.test.mjs` (two concurrent ticks produce one move, via `tick.lock`)
decided: read-back (CO2) and path leases (CO4) refused; reopen with the second worker. The board does not reconvene in year one (D13's preconditions unmet by choice); reopen when a mission is reversed after an artifact reached a stranger.

## 7 Context & cost
IS:
- Into a worker: `prompt.mjs` output ≤ 4,096 bytes, in cache order: (1) pack preamble, (2) router index + namespace, (3) `TASTE.md`, (4) `BOARD.md`, (5) `STEER.md`, (6) ORIENT block, (7) task id + intent + done-test. Stable prefix is the grant; the varying suffix is the idea.
- Batch: none on the CLI. Compaction: designed out. The process exits; a move that would need it is recorded `truncated` and the founder splits the leaf.
- The join: `logEvent(task, obj)` (arity change, five call sites), and `say:` lands in the same change as a column on the row — a row emitted without it can never be spoken, and backfilling rewrites every emitter (*founder's choice 7*). `~/.agentvibe/tasks.jsonl` maps task → `session_id`, `total_cost_usd`, `num_turns`, `stop_reason` (all measured in the JSON result).
- Cost per mission = prefix sum over `tasks.jsonl`. Cost per surviving exposure = spend ÷ exposures at rung ≥ 2, printed `undefined` while the denominator is zero.
grafted_from: runtime (ordering, `tasks.jsonl`, arity) · company (prefix aggregation) · creativity (CT1 ratchet) · minimal (`undefined` never zero) · CT1 CT2 EC2
binds: D1 D4
enforced_by: `prompt.test.mjs` (bytes and order) · `events.test.mjs` pins the two-argument arity · `check:taskid` fails any row after the cutover date lacking `task` · `pl.mjs` prints `undefined`

## 8 Quality & truth
IS:
- Oracle first, deterministic, per artifact type, in `scripts/loop/oracle.mjs`: code = `npm run check`; page = playwright screenshot non-blank at 1280×800 and 390×844, every internal link resolves, zero console errors; image = `sips -g pixelHeight`; video = `ffprobe` duration and streams; copy = non-empty, links resolve. Plus `scripts/embarrass.mjs`: placeholders, TODOs, `#` hrefs, template variables, alt text equal to filename, off-palette colour. Rung 0 = oracle pass. This makes Rule 6 ENFORCED.
- Done-test resolvers: `command | world | human`. Rung 1 (a stranger understands it in five seconds) is `human` in year one: the founder or one stranger, at the tap. No judge ever resolves a done-test.
- Selection inside a variation round: `scripts/lib/select.js`, pure: eliminate any candidate with a P1 (oracle, embarrass, constraint-card failure), prefer fewest distinct P2s, tie-break on archive distance (`scripts/lib/distance.js`, trigram Jaccard). All candidates archived; the winner is nominated; the founder sees the winner plus three cells. No model judge in year one. `design.js`'s `total` is deleted.
- World: `claim-world` registered in `scripts/lib/resolvers.js`. Evidence names an instrument and a threshold; it reads a reading `world.mjs` wrote by deterministic parse into `EXPOSURES.yml`. Unreachable → `unresolved`. It will say `unresolved` far more than `pass`, and that is honest.
- Ladder: `LADDERS.yml` declares rungs 0–4 per artifact type (page, video, newsletter, feature, price). The claim's `assert` is generated from the rung. No aggregation across rungs.
- Verdict subject: `verdict.mjs --subject-kind diff|artifact`, `sha256(artifact bytes)` for non-code, unknown value refused. Not in the first 30 days (the first artifact is a diff). Lands with the second pack family, with a test pinning the two kinds apart.
- Taste is never a gate field and never a score: it enters through `TASTE.md` before MAKE and through the founder's tap after.
grafted_from: runtime (oracle table, resolver kinds, harness-side gemini) · creativity (embarrass, select, distance, C18, nomination) · company (ladder per medium, subject generalisation, `no_data`) · minimal (rung 1 human, no judge year one) · C8 C17 C38 W1 W2 W3 A1 A3
binds: D6 D7 · Decision 1
enforced_by: `select.test.mjs` (no numeric `total` under `.claude/workflows/` or `packs/`; same findings → same pick) · `ledger.test.mjs` pins `unresolved` for `claim-world` · `check-donetests.mjs` · lint fails a `rung:` above what the resolver kind can establish · `verdict.test.mjs` when it lands
decided: the model judge panel (blind pairwise, swapped twins, second-family seat) is refused in year one; reopen when the founder's promotion disagrees with the nominated cell in three rounds, or a rung ≥ 2 done-test needs a judgement no command can make. When it reopens, the second family runs from the harness (outside the sandbox), findings only, empty stdout → `unresolved`.
founder: authorise one `gemini -p` run from the harness. It tests the "no non-Anthropic model reachable" claim carried as accepted risk to 2026-11-17. A measurement, not a mechanism.

## 9 Control & safety
IS:
- The seam is argv absence plus `pre-tool-use.sh` exit 2, untouched. Every other hook is telemetry: Stop, SubagentStop, SessionEnd registered for rows only, in the same founder settings edit as budget-guard. No `policies.yml`.
- Reach: `classifyGrant({paths, reach})` in `scripts/lib/classifier.js`, floors as data in `qa-tier-floor.yml`: `local: lite · outbound-read: lite · outbound-write | spends | speaks-as: irreversible`. Effective tier = `max(path, reach)`. One function.
- Gates: `outbound-approval` (`kind: human`, exists, no `run:`) gets its caller. `tick.mjs` step 7 refuses to compile a pack whose effective tier is `irreversible` unless the goal names a human gate id with a recorded founder disposition. In year one every pack is `reach: local`, so the caller exists before the hand does. The founder's `expose.mjs` tap is the disposition record.
- Kill, three ways, none in a prompt: `launchctl bootout gui/501/ai.agentvibe.tick` · `touch ~/.agentvibe/STOP` (tick step 2; reachable from an iPhone Shortcut) · `STEER.md` `stop:` halts at the next durable artifact (`lastArtifactAt()`). If the STOP check itself errors, refuse.
- 3am: runs = make, stage, oracle, ORIENT under the no-Write grant, archive, rows, commit to a branch, open a PR. Never = publish, send, spend, contact, merge, edit `TASTE.md`, `MISSIONS.yml` intent, `settings.json`, workflows or the plist, register a grant, `dangerouslyDisableSandbox`.
- Inbound: none into a producing context. A fetch enters only the `orient` argv (no Write, Edit, Bash, outbound). The H3 taint flag is WISH.
- The residual eight are accepted in writing (founder item 6): sandbox is not containment · Bash is general · no reasoning control survives injection · verdict hash-bound not signed · single family · a policy file is a file · a human gate stops overnight work · the founder is a single point of failure.
- `pre-tool-use.sh` matches command strings (measured): a hand-run of `tick.mjs` from a Claude session's Bash tool whose argv names a banned tool is blocked. Under launchd it runs outside the hook.
grafted_from: runtime (seam verdict, reach floors, gate caller, three switches) · company (3am table, residual list) · creativity (RT3 file, andon) · minimal (harness self-edit already `block`) · R1 R2 R3 RT3 S3 A5 A6
binds: D2 D3 D6 D9 D10
enforced_by: `pack.test.mjs` · `classifier.test.mjs` reach cases · `gates.test.mjs` (an `irreversible` pack with no human gate fails) · `loop.test.mjs` (STOP checked first; refuse on error) · `test:sandbox` · `qa-tier-floor.yml` `enforcement: block` rows
decided: seam = argv + PreToolUse; hooks are instrumentation; no handler registry (runtime and minimal over company and creativity). Reopen when a fourth distinct refusal is needed at `tool_call`. D9 is narrowed as runtime states it, not as creativity's taint.

## 10 Surfaces
IS:
- Terminal: `npm run balcony` → `scripts/balcony.mjs` reads `events.jsonl` grouped by task id and prints goal-sized rows: task · `say` · pack · outcome · rung · cost · the one verb. Each invocation writes a `balcony.open` row.
- Four verbs, four CLI acts: approve = `expose.mjs <task> --url --check-on` after the founder publishes by hand · redirect = `steer.mjs <task> "…"`, refused without a task id · annotate = the founder edits `TASTE.md` · promote = `promote.mjs <task> <cell>` → `PAIRS.jsonl`. A row from a variation round carries the winner plus up to three cells with ≤ 60-word pitches.
- `say:` on every row: ≤ 15 words, no `/`, no 7+ hex run.
- Briefing: the 08:00 plist writes `ventures/<slug>/BRIEFING.md`: money line first, then WHAT CHANGED · BLOCKED · NEEDS YOU · WOULD DO NEXT (the leftmost leaf, so not an opinion). Each may say "nothing"; a missing section fails. `say` speaks the first 200 words.
- Phone: `touch STOP` via Shortcut only. Voice input, a web UI and further notifications are refused in year one.
- `explain.mjs <task>` replays rows; a hole prints `[no record]`.
- The balcony's own done-test: opened twice unprompted more than 48h apart. If it fails in month one, the approve tap moves to a surface the founder already opens (a `gh pr` comment or the terminal prompt) before month two.
grafted_from: company (briefing shape, money line, `say` lint) · creativity (promote, C37 round rows, E1 E2) · runtime (`say`/`afplay`/`osascript`, edit verb folded into steer) · minimal (terminal only, W5 on the balcony, no phone or voice) · S1 S2 V1 V2 E1 E2 W5 C21 C37
binds: D1 · Decision 5 · goal-sized rows
enforced_by: `balcony.test.mjs` (no row without `task`) · `briefing.test.mjs` (five sections) · `say` lint · PAIRS single-writer test · `explain.test.mjs` (`[no record]`, never narrative)
decided: `say:` and the spoken briefing are in (three of four, and free); voice input is out. Reopen when the founder gives the same instruction twice in a form the terminal could not take.

## 11 Runtime
IS:
- `~/Library/LaunchAgents/ai.agentvibe.{tick,watch,briefing}.plist`. tick = `/usr/bin/caffeinate -i /opt/homebrew/bin/node <abs>/scripts/loop/tick.mjs`, `StartInterval 300`, no `KeepAlive`, absolute paths, `StandardOutPath`/`StandardErrorPath` under `~/.agentvibe/`. watch = `WatchPaths [STEER.md, ~/.agentvibe/STOP]` fires a tick. briefing = `StartCalendarInterval 08:00`, also runs `claude mcp list`.
- Lock `~/.agentvibe/tick.lock` (`openSync 'wx'`, pid inside, stale after 30 min). Inner watchdog: a node spawn timer sends SIGTERM at `timeout_s` (macOS has no `timeout` binary, measured). Outcome `timeout` recorded.
- `tick.mjs` creates the move's worktree itself, unsandboxed (measured: the armed sandbox cannot complete `git worktree add`).
- Recovery is the next tick. State is on disk; every write is last-writer-wins on a whole file.
- Models, ids pinned by `prompt-standard.test.mjs`: `claude-haiku-4-5` for probes and oracles · `claude-sonnet-5` default for MAKE (a pack may name opus; recorded on the row) · `claude-opus-5` for a genuinely novel field · `gemini` from the harness only.
- Lid shut: nothing runs, and the frame says so. The sentence is "wakes on a schedule, works, sleeps". `pmset -g` and one overnight are measured before the phrase 24/7 appears in any artifact. An always-on host that is not the laptop is the picture's shape and a purchase rather than a redesign — same `tick.mjs`, same plists, same paths — and **the founder deferred it on 2026-09-02** until the first measured overnight on the Mac (*founder's choice 6*).
- Not the control plane (`crosscheck.test.ts` shell ban at zero exceptions). Not `CronCreate` (session-only by its own schema).
grafted_from: runtime (three plists, lock, watchdog, worktree, models) · minimal (foreground first, crash-only semantics) · company (`caffeinate`, lid-shut named) · creativity (crosscheck) · S4 RT1 RT2 RT3
binds: D10 (KeepAlive clause amended) · Decision 4
enforced_by: `plist.test.mjs` (absolute paths, log paths, no `KeepAlive` key) · `tick.test.mjs` (lock; one move) · `test:sandbox` · `crosscheck.test.ts` · `probe-headless.mjs` as a suite step, so a flag that changes meaning fails a build rather than a night
decided: `StartInterval` + `WatchPaths`, no `KeepAlive` (runtime over company, creativity and minimal's `SuccessfulExit: false`). The body exits; a crash on line 1 under `KeepAlive` relaunches until a breaker Auto-Co never wrote. Reopen if the probe shows process startup dominating a five-minute cycle.
founder: authorise the first unattended process on the machine (board item 9).

## 12 Self-improvement
IS:
- `scripts/monthly.mjs` runs on day 30 and monthly. It prints: D15 ratio (harness vs venture session files through `classifier.js`) · X2 last-use per governed artifact (skills read, packs dispatched, check steps run) keyed on task id, zero calls in 90 days → retirement candidate, archival with a stub · SI4 founder interventions per surviving exposure (`undefined` until one exists) paired with the balcony-open count · archive coverage and promotion rate · corrections mined from transcripts (`mine-corrections.mjs`, regex, no model) as candidates the founder confirms into `TASTE.md` or counts `none` · every `.out-of-scope/*.md` trigger with its current reading.
- `.out-of-scope/<date>-<slug>.md` frontmatter: `refused`, `protects`, `reopen_when` (a countable predicate), `reading` (the command). A trigger whose command fails prints `unresolved`. This file is the reader that makes a refusal a mechanism.
- Post-mortem = one row with a Mechanism column; tags from a closed enum (wrong target · missing capability · unclear brief · hallucinated fact · budget exhausted · external block · tooling defect); `none` is counted.
grafted_from: minimal (triggers on the report, meter-not-delete) · runtime (N4 enum, corrections table, retirement telemetry) · company (interventions metric) · creativity (coverage, promotion rate, counted `none`) · SI1 SI4 X2 X5 M1 N4
binds: D8 (telemetry half) D15
enforced_by: `monthly.mjs` is a suite step that always exits 0 and always prints · `check-registration.mjs` extended with last-use · the run fails if any `.out-of-scope` file lacks `reading:`
decided: SI2 promotion at three sightings refused (reopen: one approach appears in three missions' rows); SI3 A/B refused (under-powered at this volume; no reopen); D8's unification refused (§17).

## 13 Economics
IS:
- `LIMITS.yml` at the repo root, founder-only, `irreversible` tier: `rope_fraction: 0.6 · stall_hours: 4 · usd_per_day: null · notify_per_day: 3 · attempts_default: 3`.
- Rope: `tick.mjs` refuses to dispatch above `rope_fraction` of the rolling 5h window (`windowUsage()`, account-wide on purpose). At the ceiling the safelist still permits commit, push, `npm run check`, PR, ledger and session writes.
- Circling brake is a clock: hours since `lastArtifactAt()` > `stall_hours` → brake and a row. `sinceLastArtifact()` returns `unresolved` past `RETAIN_HOURS`. Per-lane scoping via `tasks.jsonl`. Then, and only then, the founder registers `budget-guard.js`.
- Rate ceiling (D2): `pack.mjs` refuses `reach: spends` while `usd_per_day` is null. Nothing spends in year one; the refusal is the mechanism.
- `ventures/<slug>/PL.md` monthly via `scripts/pl.mjs`: model spend (from `tasks.jsonl`) · outbound spend (0) · revenue read from Stripe as a claim with a `valid_until`, landing with the first dollar; an unreachable instrument reads `unresolved` and `unresolved` months are counted — never typed by a human (*founder's choice 5*) · exposures made · exposures at rung ≥ 2 · cost per surviving exposure (`undefined` at zero) · founder interventions per surviving exposure.
grafted_from: runtime (clock brake, limits file, `spends` refusal) · company (P&L shape, rates at zero) · creativity (EC2 `undefined`) · minimal (repair-before-register, EC1 refused) · EC2 EC4 R5
binds: D2 D4 D8 · Decision 8
enforced_by: `usage.test.mjs` (a 19h stall and a 6h stall return different values; past-horizon → `unresolved`) · `pack.test.mjs` `spends` refusal · `budget-guard.js` once registered (founder edit) · `pl.mjs` prints `undefined`, never zero
decided: EC1 downgrade-not-stop refused (reopen: a mission killed by the ceiling twice) · C33 explore reservation and C23 boredom detector refused (reopen: the archive passes its falsifier) · CY2 venture shares refused (reopen with venture two).
founder: register `budget-guard.js` after the repair lands. `usd_per_day` is not needed in year one.

## 14 The company itself
IS:
- Intake (CY1) produces three artifacts and stops: `TASTE.md` · one mission with a `falsifier:` · one approved done-test at a declared rung. `tick.mjs` refuses to dispatch against a venture missing any of the three. One sitting; the machine proposes drafts, the founder edits.
- One venture in year one. Second human: none; every human gate carries `decided_by: founder`.
- Wind-down (CY4): stop dispatch · resolve every open claim (bulk `deprecate` with one reason allowed) · one dead-end for the venture · archive with a stub. Field notes and archive cells survive.
- Two first missions, answering two questions. Outside: the founder's demand test (D5), day 1, thresholds written first, a finding not a gate. Inside: the synthetic landing page (Decision 7), rungs 0–1, staged, never published. Then mission 2 is real, made by the machine and published by the founder's hand inside the 30 days, or the machine has only tested itself.
grafted_from: company (intake refusal, wind-down) · minimal (one venture, mission 2 must be real) · runtime (people file deferred) · creativity (counted `falsifier: none`) · CY1 CY3 CY4 C36
binds: D5 D7 D12 D15 · Decisions 4, 6, 7, 9
enforced_by: `tick.mjs` intake refusal · a suite check that a `wound_down` venture has no unresolved claim and no exposure past `check_on`
decided: second venture reopens when the first has a rung ≥ 2 reading; second human reopens when someone else holds a credential this system uses.
founder: item 7, harness as product or scaffolding. The frame assumes scaffolding (Decision 4). If product, D15's ratio inverts in meaning and §15 reorders.

## 15 FIRST 30 DAYS
Continuous cadence, no phase numbers. Order is forced by dependency. **Bold** = founder act.

| # | Day | Lands | Unlocks | From |
|---|---|---|---|---|
| 1 | 1 | **Demand test posted by hand: one real page, real URL, analytics, posted once, thresholds for pass and for uninformative written first. Day 8: the three numbers recorded.** | The only reading from outside the system. Row 1 of `EXPOSURES.yml`. | all four (D5) |
| 2 | 1–2 | `scripts/probe-headless.mjs` on haiku: M1, M3, M6, M7, M10, M11, `pmset -g`, `--allowedTools` narrowing (H2). **Founder say-so for the one launchd invocation.** | Go/no-go on packs-as-argv and the loop shape. M3 was MEASURED TRUE on 2026-09-02 (see MEASURE BEFORE BUILD); the remaining go/no-go items are M1, M6 and M7. If any of those fails, the fallback is one generated agent file for `web-feature`, recorded as a fallback. | runtime, minimal |
| 3 | 2–5 | Task id **and `say:` in one landing**: `logEvent(task, obj)`, `M-####.path#attempt` format, `tasks.jsonl`, `check:taskid`, the `say:` column — plus a first `BRIEFING.md` writer over whatever rows exist. **Day 5: the founder is handed something to look at.** | Cost per mission, `stuck`, X2, every join; and the looking test runs before days 6–19 are spent on it. Unbounded omission cost, cannot be retrofitted. | all four; company's format; founder's choice 7 |
| 4 | 3–5 | Grant census (D14): `probe-grants.mjs` read-only, `claude mcp list` → `hands.json`. Fix `playwright`'s two-scope failure. | May make the safety list shorter. Rung 0 for pages needs playwright. | creativity, minimal |
| 5 | 4–5 | Stall repair in `usage.js` (`unresolved` past horizon; clock brake; per-lane) with the 19h ≠ 6h test. **Then the founder registers `budget-guard.js` and the telemetry hooks in one settings edit.** | The loop's only real brake. Registration before repair is a believed brake. | all four (D4); runtime's clock |
| 6 | 6–7 | `MISSIONS.yml` schema and state table · `next.mjs` (leftmost leaf, determinism test) · `BOARD.md` cap · `STEER.md` · `LIMITS.yml` · `default_if_unanswered:` and the `fused` disposition in the block schema (*choice 2*). | A deterministic next move and a baton; founder silence becomes a recorded decision. | minimal, runtime |
| 7 | 7–9 | `packs/web-feature.yml` · `pack.mjs` · `pack.test.mjs` · `prompt.mjs` with the byte cap and cache order · the return schema · `warrant_kind:` as a declared-enum label, unused (*choice 4*). | The first compiled argv, and a tested home for authority before it is needed. | runtime, company, minimal |
| 8 | 8–10 | `tick.mjs` (11 steps, with the `fused` branch and `not_before:` on staged rows) · `oracle.mjs` rung 0 · `embarrass.mjs` · `orient.mjs`. Run once in the foreground, by hand. | The loop exists and has been watched working. | runtime, creativity |
| 9 | 10 | **Intake for the synthetic venture: `TASTE.md`, one mission with a falsifier, one done-test approved (rung 0 command, rung 1 human).** | The founder's one unavoidable contribution, at the only moment it is cheap. | company, creativity, minimal |
| 10 | 11–12 | Reach axis (`classifyGrant`, `reach_floors:`) · `outbound-approval` gets its caller in tick step 7 · `expose.mjs`. | The gate exists before any hand does. | all four (D3, D6); minimal's ordering |
| 11 | 12–13 | Three plists, `caffeinate`, `tick.lock`, `plist.test.mjs`. **First unattended run, daytime, founder present, `reach: local`.** | 24/7 with training wheels. | runtime (D10 amended) |
| 12 | 13–19 | Synthetic mission runs unattended and is staged, never published. `design.js`'s `total` deleted · `distance.js` · `select.js` · `select.test.mjs` · `archive/INDEX.jsonl` · one variation round (n ≤ 8) on the page; **the founder looks at the cells.** | Acceptance test of the machine; the archive's falsifier clock starts. | minimal (mission), creativity (archive) |
| 13 | 17–19 | `balcony.mjs` with four verbs · `promote.mjs` → `PAIRS.jsonl` · briefing plist output and `say` · `explain.mjs`. | 2–4 rows a day; the first preference pair has an input. | company, creativity, runtime |
| 14 | 20–30 | **An owned address a stranger can subscribe to, on the company's own domain, by the founder's hand, before mission 2 publishes** (*choice 3 — yes, later in the month*). **Intake for a real venture.** Mission 2 made by the machine, **published by the founder's hand**, `EXPOSURES.yml` row with `check_on`. `claim-world` registered and returns its first `unresolved`. **One `gemini -p` run from the harness, outside the sandbox, fail-closed on empty stdout (founder authorises)** — a measurement of the single-family risk carried to 2026-11-17, not a mechanism. Day 30: `monthly.mjs` runs (D15, X2, triggers, corrections). | The whole company, at minimum. The company measuring itself. | minimal, company, runtime |

Not in the 30 days, on purpose: any outbound hand · any money hand · inbound into a producing context · a second pack · a second venture · the council · the judge panel · the second family as a mechanism (one measurement run sits in step 14) · voice input · a web UI · the verdict subject generalisation · a phase number.

## 16 REFUSES
1. Any publish, send, spend or contact tool in any argv · protects the act `git revert` cannot undo · reopen: `EXPOSURES.yml` shows the founder performing the same outbound act by hand 3×.
2. Money hands (D2) · protects the unrefundable bill · reopen: the founder writes `usd_per_day` in `LIMITS.yml`.
3. A fetched body in a producing context (D9) · protects against injection-to-action in one hop · reopen: never; a fetch enters only a no-Write argv.
4. A policy handler registry (`policies.yml`, six phases) · protects against enforcement that reads as such while only PreToolUse refuses · reopen: a fourth distinct refusal is needed at `tool_call`.
5. A priority function over declared fields (P1, P3, WSJF) · protects against fields gamed by the thing that fills them · reopen: a second mission in flight.
6. A second worker, path leases, read-back · protects the 2–4 rows and the single-writer stores · reopen: one cycle > 4h AND the stall counter clean.
7. The council reconvening · D13's preconditions, and a third session of the system reasoning about itself · reopen: a mission reversed after an artifact reached a stranger.
8. A judge as any done-test resolver; any summed or averaged score; `total` (D7) · protects the findings · reopen: never.
9. **Worker** trust, apprenticeship, promotion, retirement (D11) · dissolved: fresh context per move leaves no subject · reopen: never. **Narrowed 2026-09-02 (founder's choice 1):** the subject that does exist is the pack-field pair, a durable file whose outcomes join on the task id; **pack-field trust reopens when a second pack ships.**
10. A second implementation of risk classification, including "is this outbound?" (A5) · protects the incident you would otherwise find it in · reopen: never.
11. New MCP servers · protects against five unwired servers on a six-of-nine base rate · reopen: a worker's JSON return cannot express a state change it needs mid-move.
12. A web UI, phone verbs beyond `stop`, voice input · protects attention (seven views, one acts, an Inbox empty on every project) · reopen: the balcony passes W5 on itself; the founder repeats an instruction the terminal could not take.
13. A second venture · protects against the 92-to-1 ratio in a new costume · reopen: the first venture has a rung ≥ 2 reading.
14. `KeepAlive` on the tick; editing `stream.test.ts`; touching `mission-control/server/`; `dangerouslyDisableSandbox` in the loop; deleting skills, engines or workflows instead of metering them · protects a real regression test, three closed RCEs, the one honest sandbox claim, and the X2 reading · reopen: the probe shows startup dominates the cycle (KeepAlive only); the others never.

## 17 WEAKEST
The frame routes every artifact through the founder's eye and calls it a safety property. For non-code work the human gate is the entire enforcement spine, and the measured base rate of this founder looking is zero: an escalation Inbox empty on every project ever, seven balcony views with one that acts, eleven beeond mockups unlooked at. Every instrument the frame builds to detect that (the balcony's W5 self-test, runs of `no_data` on the register, the ten-stageable-per-week trigger) delivers its finding to the founder who by hypothesis is not looking. If landing 1's seven-day numbers are not recorded on day 8 without chasing, no mechanism here will make the machine's twelfth artifact get read, and the frame should shrink to a machine that stages with no register and no rungs. A second counter: the frame rests on four unmeasured runtime facts (M1, M3, M6, M7), and if `--allowedTools` does not narrow, the argv is a policy and the whole safety argument is denial, not absence. A third: a merge of four designs carries more mechanism than any one designer would ship, and the monthly report that reads its refusals has never run.

| decision | current text | proposed change | evidence | recommendation |
|---|---|---|---|---|
| D12 (company) | a count ceiling on packs, personas, workflows, commands, skills, suite steps | replace with a ceiling on bytes a reader must load | the measured cost (637-line STATUS.md, stale shas) sits in two documents D12 does not govern; the byte cap is proven 3× here | Narrow: add the byte ceiling; keep the count. Both are one check each. |
| D8 first half (minimal) | unify four birth-certificate checks into one `hasCaller`, land with telemetry | keep the telemetry, refuse the unification | D8 withdrew "prevents"; the refactor yields zero artifacts and lands in D15's harness column; a fifth instance is prevented by not writing one | Accept: telemetry on day 3; unify when a fifth is wanted. |
| D9 clause (creativity) | never a fetched body into a producing context | a mediated fetch under taint may enter; a tainted context holds no outbound grant | Decision 6 needs sourced exemplars; `sourcer` already fetches with no Write; taint on unmediated paths is WISH | Narrow: fetch only into a no-Write argv. Taint not built. |
| D10 clause (runtime) | `KeepAlive` plus `WatchPaths` | `StartInterval` plus `WatchPaths`, no `KeepAlive` | the body exits; `KeepAlive` relaunches a line-1 crash forever; Auto-Co's breaker exists nowhere in its code | Accept. |

CEO position 2026-09-02: concur with all four recommendations. The CEO's own reading had proposed accepting the D12 and D9 changes in full; both were narrowed on the synthesizer's argument (a count and a byte ceiling govern different failures; an argv is physics where a taint flag is a WISH). They go to the founder as choices, not as decisions.

## CONFLICTS RESOLVED
| conflict | CEO's resolution | decision | why | reopen trigger |
|---|---|---|---|---|
| Policy seam | argv + PreToolUse; hooks instrumentation; `policies.yml` ok if handlers declare `can_refuse` | same, minus `policies.yml` | a registry with no refusing handler is A6 at subsystem scale; four controls need no fifth thing | a fourth distinct refusal at `tool_call` |
| Priority | minimal's leftmost leaf for year one | agree | WIP=1 leaves nothing to rank; every field is gameable by its filler | a second mission in flight |
| Outbound | `stage` only, founder publishes; `send` reopens on 3× by hand | agree, and no server: staging is a harness copy plus hash | the only caller is the harness; a server would be unwired inventory | 3× by hand, or a worker needs to stage mid-move |
| Concurrency | 1 mission; parallelism inside a move | agree; fan-out is harness-side, workers never hold `Task` | keeps one grant, one lock, one writer per store | cycle > 4h with a clean stall counter |
| Skills injection | inject under the cap AND meter | agree; `FIELDS/` built with a 90-day falsifier | injection is the measured cure; the meter decides the library | two missions ORIENT the same field (unfreeze) |
| Archive | build; zero promotions by 2026-10-02 → delete | build; falsifier 30 days after the first card; no round by 2026-10-02 is itself the finding | a date must follow the landing or it tests the calendar | founder re-decision only |
| KeepAlive | runtime is right; amend D10 | agree | a body that exits has nothing to keep alive; no breaker needed | startup dominates the cycle |
| 24/7 honesty | say it as runtime; lid-shut unmeasured | agree; the phrase 24/7 appears in no artifact until `pmset -g` and one overnight | an unmeasured claim in the thesis rots the thesis | none; it is a measurement |

## MEASURE BEFORE BUILD
- M1 · do PreToolUse and Stop hooks fire under `claude -p`? · §9: if false the argv is the only control and the second layer is absent; frame stands, wording changes. **MEASURED TRUE for `Write`, 2026-09-02**: a `claude-haiku-4-5` child run with `--allowedTools Write` and asked to write `/Users/adamks/m1probe-agentvibe.txt` returned `BLOCKED: write outside the project root is refused: …` — the string is in `pre-tool-use.sh` and nowhere in Claude Code — exit 0, `permission_denials` names the Write, no file created, $0.084. So PreToolUse fires under `claude -p`. **The Bash path is UNMEASURED from inside a session**: a child spawned inside a sandboxed session cannot start its own sandbox (`EPERM: operation not permitted, listen …/srt-mux-….sock`) and `failIfUnavailable: true` blocks the command before any hook sees it — measured, $0.096, and it is exactly the fail-closed behaviour SANDBOX.md claims. A built-in dotenv guard also fires ahead of the hook on `.env` paths ($0.091). M1 for Bash, M6, and the Stop hooks are measured from a terminal or from launchd, never from inside a session.
- M3 · **MEASURED TRUE 2026-09-02**: `claude -p --model claude-haiku-4-5 --disallowedTools Bash --output-format json --max-turns 3` with the prompt on stdin → the child reports `BASH_UNAVAILABLE: Bash is disabled for this session`, exit 0, `is_error: false`, 2 turns, $0.088. The argv narrows built-in tools. Packs-as-argv stands. *Note for anyone re-running it: `--allowedTools`/`--disallowedTools` are variadic; a prompt placed after them is swallowed as a tool name and the CLI reports "Input must be provided" — which is what last session's "inconclusive M3" was.*
- M6 · does the `sandbox` block apply to a launchd child? · §11: if false, `Bash` is struck from `web-feature` until it does.
- M7 · does a `Workflow` call succeed inside `claude -p` under launchd? · §8: if false, `qa.js` is invoked through `node` from the harness, a bridge not a redesign.
- M10 · what `stop_reason` does `--max-turns` exhaustion produce? · §6: `truncated` cannot be told from `done` without it.
- M11 · does `WatchPaths` fire on in-place modification of `STEER.md`? · §10: steer latency is seconds or five minutes.
- Lid shut · `pmset -g` and one overnight on AC · §11: the sentence the frame is allowed to say about 24/7.
- Notification · does `osascript display notification` render from a `gui/501` launchd job? · §6: the only interrupt in year one.
- Playwright · is it reachable from a `claude -p --mcp-config` child after the two-scope fix? · §8: rung 0 for pages, the first mission's oracle.
- Prompt · is `--append-system-prompt` at 4 KB accepted and cache-stable across ticks? · §7: the byte cap and the cost argument.
- H2 census · which tools a dispatched `web-feature` process can actually touch · §3: the load-bearing half of D14; a leaky path shortens the safety list.
- M8, M9 · the exact hook event names and the two write exemptions in `pre-tool-use.sh` · §9: the telemetry registration must not invent an event.


---

# Part III — reconciliation and provenance

## Where the synthesizer overrode the CEO's reading, and what the CEO decided

| Topic | CEO's reading proposed | Synthesizer | CEO decision |
|---|---|---|---|
| Policy seam | `policies.yml` allowed as an organising file if every handler declares `can_refuse` | no registry at all — a registry with no refusing handler is A6 at subsystem scale | **accept** — fewer files, same physics |
| Outbound | an `outbound` server with a `stage` verb only | no server; staging is a harness copy plus sha256; all five named servers become harness scripts | **accept** — the only caller is the harness; a server would be unwired inventory |
| Archive falsifier | zero promotions by 2026-10-02 → delete | 30 days after the first `card.yml`; no round by 2026-10-02 is itself the finding | **accept** — a date must follow the landing or it tests the calendar |
| `FIELDS/` | inject and meter | the same, plus its own freeze date (2026-12-02 if no cross-mission read) | **accept** |
| Model judge / second family | a second family as a judge seat in year one | no model judge anywhere in year one; deterministic selection plus the founder's promote; `gemini` only as a measurement | **accept, with the one-run measurement kept inside the 30 days** (step 14) |
| D9 | accept creativity's taint narrowing | narrow in runtime's form: a fetch enters only a no-Write argv | **accept** — argv over flag |
| D12 | accept the replacement of the count by bytes | narrow: add the byte ceiling, keep the count | **accept** |

Two CEO edits to the synthesizer's build order, both visible in §15: the `gemini` measurement run inside step 14;
and the register is one file, `EXPOSURES.yml` — the minimal design's `SHIPPED.yml` is the same file under
another name.

## v0 §8 — where each open question went

| # | v0 asked | answered in |
|---|---|---|
| 1 | Wire, then delete | §12: meter, never delete — last-use per governed artifact on the monthly report; `budget-guard.js` registered at §15 step 5 after the repair; `design.js`'s `total` deleted (§8); personas: no board in year one (§6) |
| 2 | Where the loop lives | §11: beside the server, under launchd, never inside `mission-control/server/` (`crosscheck.test.ts` stays at zero exceptions) |
| 3 | Second model family | §8 founder line and §15 step 14: one `gemini -p` run from the harness, outside the sandbox, fail-closed; a measurement of the risk carried to 2026-11-17 |
| 4 | What a "move" is | §1 cycle: one `claude -p` process per leaf attempt, one task id, exits; §6 return shape |
| 5 | What the balcony shows and does | §10: goal-sized rows and four verbs — approve, redirect (needs a task id), annotate, promote |
| 6 | The personas | §6: the board does not reconvene in year one; D13's preconditions unmet by choice; reopen trigger named |
| 7 | The hook bypass | §9: the hook is layer two and is untouched; the seam is the argv; the parenthesis fix stays board item 8, the founder's |
| 8 | Eyes — closed | §8 oracle: playwright screenshot at two viewports is rung 0 for a page; its two-scope failure is fixed at §15 step 4 |

## Reference studies (v0 §8b and §9, collapsed)

Five systems were studied in full before the catalogue and the board; the studies stand at
`docs/02-competitive/reference-systems/{cast,gsd,loops,metaswarm,omnigent}.md`. What they contributed is
recorded where it landed: CAST's task-id-on-every-row and "PostToolUse cannot block" (§1, §9) · GSD's
two-tier blocking-human gate and subprocess competitor CLIs (§9, §8) · Metaswarm's regex transcript
classifier and fresh-instance review gate (§12, §8) · Omnigent's policy seam, studied and refused (§9, §16) ·
the loop primitives (§11). The meta-finding — built-and-never-wired in four of four studied systems — became
D8, D14, D15 and the reopen-trigger discipline of §12 and §16. The catalogue those studies fed is
`docs/02-competitive/expansion/`.

---

# Part IV — the picture, and the founder's decisions of 2026-09-02

The board built a floor, not a vision — fifteen decisions of which nine are stops, four are measurements, one is
a shape and one is an artifact. So a vision round ran with no floor: three sealed envisioners (the flywheel, the
founder's chair, the machine's night), the CEO's position sealed before any returned, and one fresh synthesizer.
The result is `docs/03-system-design/vision/2026-09-02-THE-PICTURE.md` (680 lines, provenance on every
paragraph), presented at <https://claude.ai/code/artifact/90440be9-ab88-43a2-8e6a-45f1fae1b35b>.

**Verdict on Part II:** a SLICE of the full-scale picture on ten of fourteen territories — the same shape,
smaller, growing into the picture through its own reopen triggers — and merely SMALL on four: refusal 9's scope,
authority as a compile-time label, the absent fuse, and revenue's provenance. Every SMALL is cheap now and
expensive later, and each is now folded into Part II above, marked *founder's choice N*.

## The founder's decisions (AskUserQuestion, 2026-09-02)

| # | Choice | Decision | Where it landed |
|---|---|---|---|
| 1 | Narrow refusal 9: pack-field trust may reopen | **accepted** | §2 decided · §16 item 9 |
| 2 | The fuse: `default_if_unanswered:` and a `fused` disposition | **accepted** | §1 · §15 steps 6, 8 |
| 3 | An owned address a stranger can subscribe to, inside month one | **accepted — later in the month**, after the loop has run once | §15 step 14 |
| 4 | `warrant_kind:` reserved on the pack schema, unused | **accepted** | §2 · §15 step 7 |
| 5 | Revenue read from Stripe as a claim, never typed | **accepted** | §13 |
| 6 | The night's host: a box instead of the Mac | **deferred — stay on the Mac** until the first measured overnight | §11 |
| 7 | The briefing and `say:` on day 5, not day 19 | **accepted** | §7 · §15 step 3 |
| 8 | `not_before:` on every act that leaves, default morning | **accepted** | §3 · §15 step 8 |
| 9–12 | Rate table · the founder's day file · the machine's daily question · second family as a seat that may be empty | designed-in shapes, **no change in year one** | picture §7 |
| F | The fifteen board decisions as the floor | **all fifteen stand**, amended as above; four narrowed (D8 first half, D9 form, D10 `KeepAlive`, D12 to add a byte ceiling) | Part III |

## Eight territories the fourteen do not contain

| # | Territory | Disposition in year one |
|---|---|---|
| 15 | Distribution & audience — an exposure can only reach the rung its audience allows | the owned address, §15 step 14; `AUDIENCE.yml` follows the first subscriber |
| 16 | Authority — granting, delegating, auditing, revoking | `warrant_kind:` reserved; the rest with the first outbound pack |
| 17 | Attention — the founder's day as a budget with an account | the fuse now; `notify_per_day` becomes a meter in `monthly.mjs` |
| 18 | Obligation and the people it is owed to | follows the first customer |
| 19 | Identity & standing — including disclosure of machine-made work | follows the first entity; disclosure dated to the first machine-published artifact |
| 20 | The calendar and the clock | `not_before:` now; the rest with the second lane |
| 21 | Silence — the right to do nothing, measured | follows the explore reservation |
| 22 | Succession | a written acceptance with a review date |

**What would have to be true, ranked** (picture §6): the founder looks, and looking is cheap enough to keep
doing — measured base rate zero, tested on day 5 and day 8 · a missing hand is absence, not denial — half
measured true · the world answers. Everything else follows those three.
