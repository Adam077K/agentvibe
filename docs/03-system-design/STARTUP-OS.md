# StartupOS — v2: the full system spec

**Status: the full system spec. Year one is the slice inside each section, never a separate document.** Twenty-two
territories at full scale, each carrying its own year-one slice and its own growth path as countable triggers.
Part I is v0's record, kept verbatim. Part II replaces v1's Part II, whose fourteen-section year-one frame is
preserved whole at [designs/2026-09-02-year-one-frame-v1.md](designs/2026-09-02-year-one-frame-v1.md). **No work
is authorised by this document.** The founder's decisions of 2026-09-02 bind, and where a specification below
disagrees with them, they win and the disagreement is noted in one line.

```
version: 2 · date: 2026-09-02 · supersedes: v1 Part II (preserved verbatim in designs/)
sources:
  docs/03-system-design/vision/spec-A.md    territories 01–07
  docs/03-system-design/vision/spec-B.md    territories 08–14
  docs/03-system-design/vision/spec-C.md    territories 15–22, the six maps, the build path
  docs/03-system-design/vision/2026-09-02-THE-PICTURE.md   the merged vision — §0 thesis, Part IV's assumptions
  docs/03-system-design/STARTUP-OS.md v1                   Part I verbatim · the year-one slices · §15 · §16
  docs/08-agents_work/board-meetings/2026-09-01-startup-os-r01.md   15 decisions D1–D15 — the floor
how it was made: four sealed whole-system designs → one synthesizer → the year-one frame v1 → three sealed
  visions (flywheel · founder's chair · machine's night) → one merged picture → three parallel spec groups
  writing 01–07, 08–14 and 15–22 → this assembly. Every territory carries `grafted_from`; every rule names the
  mechanism that would fail if it were broken, or is labelled WISH. Numbers from a vision are labelled
  illustration; numbers measured here carry a date.
binding: the founder's decisions of 2026-09-02 (Part V) · physics (a `claude -p` process cannot call a tool
  absent from its argv; a `Workflow` is main-session only; `PostToolUse` cannot block; the only blocking hook
  is `PreToolUse` exit 2) · the fifteen board decisions as the floor, four narrowed.
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

# Part II — THE SYSTEM AT FULL SCALE

**How to read every section below.** Seven blocks, the same seven, twenty-two times. *At full scale* is what
the thing IS when the company is grown. *Components* is the parts list. *Enforced by* names, for every rule,
the thing that would fail if the rule were broken — an argv absence, a schema refusal, a named test, a
resolver, a hook or a human gate — or marks it **`WISH`** and says what would give it one. **A `WISH` is not a
defect; an unlabelled wish is.** *Year one — the slice* is what exists first, and it is the frame's own decided
content, condensed and never contradicted. *Growth path* is ordered `trigger (countable) → what lands`, and
**there are no dates in it**. *Would have to be true* ranks the assumptions and marks which are measurable in
the first thirty days. *grafted_from* names the sources and the board decisions the territory binds.

**Numbers.** Every figure a vision supplied is an **illustration** and is labelled inline. Figures measured in
this repository carry `MEASURED` or `[measured]` and a date. A figure with neither label is a defect in this
file. **The build path is not restated here.** It lives once, in Part IV.

## 0 THESIS

**The company is an exposure engine with one register at its centre and one mouth at its door; the founder is
the mouth on day one, and every hand the mouth takes over later was earned by a count the founder can read.**

Three visions named three centres — the exposure register, the founder's attention, and authority. They are not
three centres: **the register is the centre, and attention and authority are the two budgets metered against
it.**

The visit, at full scale:

```
03:14, a Tuesday.  The laptop has been shut since 23:40 and the company is not on it: one always-on
                   host, one cloud twin. A sentinel, a minter, a bailiff, a mouth, a relay, one tick
                   per lane, makers, judges, one second-family seat, one reader. Twelve hold a model.
                   ONE can touch the outside world and it is not one of the twelve. It has fired twice
                   — a DNS renewal, a preview deploy, both standing-warranted, reversible, counted.
03:41              A maker reaches a `blocking-human` gate on a live pricing page. The gate has no
                   `run:` key and writing one is refused at schema time, so nothing in the system can
                   clear it. The machine mints a warrant scoped to that file and that sha256, writes a
                   queue row with an eleven-word `say:` line, and blocks the mission — which frees the
                   slot, so another lane starts at 03:43. The phone stays silent.
07:52              One screen, a queue of decisions rather than a dashboard of activity. Six rows, each
                   with a verb and a fuse. Twelve minutes, five taps, one read.
```

**And the principle the whole thing rests on, which is physics and not policy: a `claude -p` process cannot
call a tool absent from its argv.** The makers cannot fetch, cannot send, cannot spend and cannot reach an MCP
server — not because a prompt asks them not to, but because the strings are not there. Half of it is
`MEASURED` as of 2026-09-02: `--disallowedTools Bash` makes the child report `BASH_UNAVAILABLE` at exit 0, and
`--strict-mcp-config` makes user-scope servers **absent** rather than denied. **The argv is the policy seam.**
A pack is an argv, never an agent file. An archive keeps every candidate a variation round makes, so creative
range compounds instead of being deleted three-to-one. The truth layer — ledger, classifier, verdict binding,
check suite — is kept whole and demoted from protagonist to instrument. Every refusal carries a countable
reopen trigger that a monthly report reads, so a refusal is a mechanism and not a wish.

---

## 01 · Missions & drive

**At full scale — what it IS.**
A forest, not a tree. `ventures/<slug>/MISSIONS.yml`, one file per venture, each an uncapped goal tree, with
exactly one mission `in_flight` per lane and one lane per venture that has been allocated window tonight. A
mission is `intent:` {task, purpose, end_state, constraints} · `falsifier:` {move, cost_usd} · `done:` {rung,
resolver, test, approved_by, approved_on} · `deadline:` · `evidence_of_demand:` (a claim id, never a literal) ·
`reversibility:` · `cost_estimate:` · `unlocks:` · `blocks:` · `goals:` nested, each leaf with its own
`end_state` and `done`. The schema refuses `steps:`, `how:`, `method:` and `implementation:` anywhere under
`intent:` — **a mission states an end, never a route.** Task id `M-0007.3.1#2` = mission · path · attempt,
regex `^M-\d{4}(\.\d+)*#\d+(v\d+)?$`, `v` marking a variant inside a round, minted by `tick.mjs` before spawn.
`scripts/loop/next.mjs --lane <slug>` is pure, prints its own arithmetic, and takes no field a model benefits
from filling; at one open leaf it degenerates to leftmost-open-leaf, and at many it ranks on cost of delay
against a calendar the company does not control. `scripts/loop/allocate.mjs` sits above it and reads
`PORTFOLIO.yml`: a declared share of the window per venture with a **floor** so a quiet venture is not starved
and a **ceiling** so a loud one cannot take everything, reviewed monthly rather than continuously, because
continuous reallocation is how the loudest venture wins. Venture zero — the harness itself — holds a declared
share with the same floor and ceiling as any other, because the alternative is what happened in 2026, when 171
session files were about the harness and none about a customer. States are `queued · in_flight · blocked ·
stalled · stuck · railed · shipped · abandoned`, and a transition not in the table is refused. **Missions can be
woken by the world**: an inbound reply, a failed payment, a funnel spike or a competitor's changelog becomes a
leaf with a deadline, written by the relay (§06) and never by a model. Every dispatch records `instead_of:` —
the runner-up leaf id — which is free where priority is computed and makes what the company systematically
never gets to visible after six months instead of invisible forever.

**Components.**
- `ventures/<slug>/MISSIONS.yml` — the goal tree and mission records — written by `tick.mjs` (state) and the founder (intent); read by `next.mjs`.
- `PORTFOLIO.yml` — per-venture share, floor, ceiling — founder-only, `irreversible` tier; read by `allocate.mjs` at tick top.
- `scripts/loop/next.mjs` — pure ranking function, prints its arithmetic — read by `tick.mjs`; writes nothing.
- `scripts/loop/allocate.mjs` — chooses which lanes get window tonight — reads `PORTFOLIO.yml` and `tasks.jsonl`; writes a `lane.allocated` row.
- `scripts/loop/transitions.js` — the state table as data — read by `tick.mjs` and by `missions.test.mjs`.
- `scripts/loop/tick.mjs` — one move per lane per invocation, mints the id, exits — the only writer of mission state.
- `blocked` record — `{because, clearable_by, until, default_if_unanswered, class}` — authored by the worker in its return, written by `tick.mjs`.
- `instead_of:` — the runner-up leaf on every dispatch row — written by `tick.mjs`, read by `monthly.mjs`.

**Enforced by.**

| rule | mechanism |
|---|---|
| `intent:` carries no procedure | `schema-lint.js`'s existing `steps/how/method/implementation` predicate, pointed at `intent:` — the same predicate that already refuses a playbook stage carrying them |
| Exactly one mission `in_flight` per lane | `scripts/missions.test.mjs` — a second `in_flight` in one lane is refused |
| Every state change is in the table | `missions.test.mjs` drives every pair and asserts the complement is refused |
| A block carries `until:` | `missions.test.mjs` — a block without it is refused at write |
| A fusable block carries `default_if_unanswered:`, and the default is the reversible branch | `missions.test.mjs` — a fusable block without a default is refused; a default naming the irreversible branch is refused |
| Irreversible, financial and first-contact classes cannot fuse | `missions.test.mjs` — a default on any of the three classes is refused. This is by **type**, not by policy |
| `blocked` frees the slot | `tick.test.mjs` — after a blocked return, the next tick dispatches a different leaf |
| `stalled` is computed, never authored | `usage.test.mjs` — the meter is output tokens since the last durable artifact on disk; a worker's own claim to be stalled is ignored |
| `stuck` is derived from distinct approach hashes | `tick.mjs` counts from event rows; `attempts.test.mjs` asserts a worker-supplied attempt number is ignored |
| `railed` clears on a clock, not on a person | the bailiff writes and clears it; `railed.test.mjs` asserts no founder action can clear it and no worker can author it |
| `next.mjs` is deterministic and its printed arithmetic matches its pick | `next.test.mjs` — same tree, same pick; and the printed ranking's argmax equals the returned leaf |
| A done-test is never resolved by a judge | `check-donetests.mjs` fails `resolver: judge`, a missing `rung`, or a missing `approved_by` |
| `evidence_of_demand` cannot be asserted by a model | the `claim-source` resolver in `scripts/lib/resolvers.js` fetches the URL and asserts the quote is present; a literal value in the field is refused at schema time |
| `instead_of:` is present on every dispatch with ≥2 open leaves | `dispatch.test.mjs`; with one open leaf the value is `none` and `monthly.mjs` counts it |
| The estimator's error is recorded against actuals | **`WISH`** — there are no actuals until a lane has shipped repeatedly. Gains a mechanism the first month `PL.md` has both an estimate and an outcome for the same leaf |

**Year one — the slice.**
One venture, one mission in flight, `next.mjs` returning the leftmost open leaf — which **is** the degenerate
case of the full function at WIP 1, not a different function. `falsifier:` required and cheap-first; `none`
allowed, counted, reported. `blocked` is authored by the worker with `because`, `clearable_by: founder` and
`until`, plus `default_if_unanswered:` and the fourth disposition `fused`, so the founder's silence is a
recorded decision rather than an unread item (*founder's choice 2*). Three waivers on one block surface on the
balcony as "decision avoided". Attempt ≥ 3 on one leaf with no pass is `stuck`, free. `constraint:` is one
pointer with an expiry and does not gate dispatch. The cycle is eleven steps: STOP file → `STEER.md` → brakes →
next leaf → mint id → compile pack → spawn one `claude -p` → oracle → record rows → rewrite `BOARD.md` → exit.
Priority over declared fields is refused (Part IV, refusal 5) because WIP 1 leaves nothing to rank and every
declared field is gameable by the thing that fills it. `railed`, `deadline:`, `PORTFOLIO.yml`, `allocate.mjs`
and world-woken leaves do not exist.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| A second mission is in flight | Refusal 5 reopens. `next.mjs` gains a ranking over declared fields, with its arithmetic printed and `next.test.mjs` extended to assert argmax equals the pick |
| One cycle's wall clock exceeds 4h **and** the stall counter is clean | A second lane. `tick.mjs --lane`, `tasks.jsonl` gains a `lane` column, `tick.lock` becomes per-lane |
| The first venture has a rung ≥ 2 reading | A second venture, so a second `MISSIONS.yml`; the forest exists and `allocate.mjs` has something to allocate |
| Two ventures compete for one window | `PORTFOLIO.yml` with floor and ceiling, reviewed monthly; venture zero declared as a share like any other |
| The first rate ceiling refusal is recorded by the bailiff | The `railed` state, its clock, and its row in the transition table |
| The first leaf written by an inbound path | World-woken missions; `deadline:` becomes load-bearing and cost of delay has an input |
| Two or more leaves open at one dispatch | `instead_of:` stops being `none` and the never-got-to report has data |
| One leaf produces three `truncated` returns | The leaf is too large; the founder splits it, and three on one leaf is a reported finding, not a retry |

**Would have to be true.**
1. **Tree order is a good enough proxy for value at WIP 1.** **Measurable in the first 30 days**: count how
   often the founder's `steer.mjs` redirect names a leaf other than the leftmost. Two or more in the first ten
   dispatches falsifies it and reopens refusal 5 early.
2. **A model fills fields honestly when a function chooses.** Partially measurable: the first
   `evidence_of_demand` that resolves `unresolved` rather than `pass` is the signal, and it arrives with
   mission 2.
3. **The world can wake a mission without becoming the priority function.** Not measurable in 30 days; nothing
   inbound exists. Its guard is that the relay writes a leaf and never a rank.

**grafted_from.** picture §2/01 · §3 row 01 · §7 rows 2, 8 · flywheel §2/01 (forest, cost of delay, `railed`,
world-woken) · machine §2/01 (allocator, `instead_of:`, `evidence_of_demand`), §5.6 · founder §2/01
(commander's intent, blocked-authored / stalled-computed) · frame §1 · catalogue P1 P2 P3 P5 P7 B1 B2 B3 B5 C24
C36 EC3 · binds **D1 D7 D12**.

---

## 02 · Workers & roster

**At full scale — what it IS.**
**Zero new agent files, ever.** The seven engines stay as files and the loop never dispatches through `Agent`;
it spawns `claude -p` children whose argv is the whole of their authority. A **pack** is `(tools × mcp ×
warrant kinds × done-tests × field)` — a grant and a stop, never a procedure — declared in `packs/<id>.yml` and
compiled by `scripts/loop/pack.mjs` into:

```
claude -p --model <pinned id> \
  --allowedTools "<explicit list>" --disallowedTools "<explicit list>" \
  --mcp-config $TMPDIR/pack-<id>.json --strict-mcp-config \
  --output-format json --max-turns <N> \
  --add-dir <worktree> \
  --append-system-prompt "$(node scripts/loop/prompt.mjs <task>)"
```

Never `--bare` (`MEASURED`: no auth). Fourteen to twenty-six packs *(illustration)* across five families —
`web-feature`, `design-brand`, `content-copy`, `content-video`, `customer-market` — plus two that are not
makers: `orient`, read-only, the field learner, and `sweep`, the outcome resolver. **Trust is computed, never
declared, and the key is `(pack × field)`, not the worker.** A pack excellent at short-form video has no
standing on regulated claims; an unknown pair fails closed to `supervised`; the value is recomputed at every
dispatch from `outcomes.jsonl`, so a hand-edited number is overwritten rather than honoured. Promotion needs N
consecutive moves whose artifacts survived **the world's verdict** — rung ≥ 2, zero incidents — which is what
makes the signal unforgeable by an internal judge. Demotion is the same counter running backwards on an
incident: no restore, no appeal that skips the count. A new pack serves an apprenticeship in shadow — real
moves, real artifacts, ships nothing, one move in five — and graduates on a record. Retirement fires on zero
dispatches in ninety days, computed at the dispatch chokepoint rather than proposed by anyone, and is archival
with a resolvable stub, never deletion; above the declared ceiling a new pack requires a retired one. Personas
exist separately, argue, and are structurally forbidden from producing an artifact or holding a warrant.
Concurrency is one move per lane per tick, with parallelism only **inside** a move as harness-side fan-out:
`tick.mjs` spawns `variation.n` processes under one grant with different constraint cards. Workers never hold
`Task`, so there is no nesting and no worker-to-worker edge (§06). The full roster and the pack schema are Map
3; they are not restated here, because two descriptions of one table disagree silently.

**Components.**
- `packs/<id>.yml` — the grant, as data — founder-approved, `irreversible` tier; read by `pack.mjs` and `check-packs.mjs`.
- `scripts/loop/pack.mjs` — the argv compiler; refuses rather than degrades — read by `tick.mjs`.
- `scripts/loop/prompt.mjs` — assembles the system prompt under a byte cap in cache order (§07) — writes nothing.
- `scripts/lib/trust.js` — `trust(pack, field)` computed from `outcomes.jsonl` at dispatch — no store, no writer, no editable field.
- `packs/orient.yml` — `[Read, Glob, Grep, WebSearch, WebFetch]`, **no Write** — the only argv a fetched body may enter (§06).
- `packs/sweep.yml` — resolves `check_on` rows into `outcomes.jsonl` — read-only plus the register write, which the harness performs.
- `LIMITS.yml` — holds the pack ceiling among the other limits — founder-only.
- `personas/<id>.md` — argues, never produces — read by a review path; named in no pack's `--allowedTools`.

**Enforced by.**

| rule | mechanism |
|---|---|
| A tool absent from the argv cannot be called | **physics**, `MEASURED` 2026-09-02 for built-ins (`BASH_UNAVAILABLE`) and for MCP scope (`--strict-mcp-config`) |
| Every compiled argv carries `--strict-mcp-config` | `pack.test.mjs` |
| A pack's `tools` is a subset of its engine's own `tools:` line | `pack.test.mjs` — the engine ceiling |
| The permanently denied names appear in no argv | `pack.test.mjs` fails on `tiktok_publish`, `sandbox_exec`, `send_message`, `share_file`, `claude-in-chrome` |
| An `mcp` entry no `.mcp.json` backs is refused | `pack.test.mjs` — the same shape as `schema-lint.js`'s existing rule for an agent declaring `mcpServers` nothing backs |
| `variation:` without `descriptors:` is refused | `pack.test.mjs` |
| `reach ≠ local` with no human gate id is refused | `pack.test.mjs`, and `gates.test.mjs` for the gate's own existence |
| A pack carries no procedure | `schema-lint.js`'s `steps/how/method/implementation` predicate, pointed at `packs/` |
| The loop never dispatches through `Agent` | `loop.test.mjs` greps `scripts/loop/**` for an `Agent` call and fails on a hit; the positive control is that the same grep finds the call in `qa.js` |
| Trust cannot be hand-set | `trust.test.mjs` — write a value, dispatch, assert the value changed; and an unknown `(pack, field)` returns `supervised` |
| Promotion requires the world, not a judge | `trust.test.mjs` — a promotion computed from rung ≤ 1 outcomes is refused; the input is `outcomes.jsonl`, which only `sweep` writes |
| Demotion is automatic and restoration is re-earned | `trust.test.mjs` — one incident row moves the counter down and no path sets it back directly |
| Retirement is archival with a stub | `evict-memory.mjs`'s four rules, re-derived for `packs/`; `check-registration.mjs` fails a dangling reference to a retired pack |
| A new pack above the ceiling requires a retired one | `check-packs.mjs` fails when `count(packs) > LIMITS.pack_ceiling` |
| A persona holds no warrant and produces no artifact | the minter refuses a warrant whose subject is a persona id (declared enum); `check-registration.mjs` fails a persona id appearing in any pack's grant |
| Shadow packs ship nothing | the shadow pack's `reach:` is `local` and its artifacts are staged; enforced by `pack.test.mjs`, not by the dispatcher's intent |
| The apprenticeship rate is one move in five | **`WISH`** until a second pack exists. Gains a mechanism as a counter in `allocate.mjs` the day two packs are dispatchable |

**Year one — the slice.**
One pack: `packs/web-feature.yml` — `Read Write Edit Glob Grep Bash`, `mcp: [playwright]`, `reach: local`.
`design-brand`, `content-video`, `customer-market` and `content-copy` are **named and unbuilt**. `orient` exists
as a grant, not as a family. `warrant_kind:` is on the pack schema from the first week as a name from the
declared enum `none | standing | morning`, **read by nothing** and refused if not in the enum — the tested home
for `artifact_sha256`, `not_before` and an attenuation chain on the day the first outbound pack is proposed
(*founder's choice 4*). **Worker** trust, apprenticeship, promotion and retirement stay dissolved (D11): a
`claude -p` process has no identity across moves, so there is no subject. **Pack-field** trust is the subject
that does exist — a durable file whose outcomes join on the task id — and it reopens when a second pack ships
(*founder's choice 1*). Which unbuilt pack comes second is set by the first blocked row whose `clearable_by:
founder` says the granted tools cannot meet an approved done-test, never by a plan.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| A blocked row states that an approved done-test cannot be met by the granted tools | The second pack, of whichever family that row names |
| A second pack ships | Pack-field trust is computed (refusal 9's narrowed reopen). `scripts/lib/trust.js`, `outcomes.jsonl` as its only input, `trust.test.mjs` with the hand-edit positive control |
| A third pack | `sweep` becomes its own pack rather than a harness script; the shadow apprenticeship gains its one-in-five counter |
| N consecutive rung ≥ 2 exposures with zero incidents on one `(pack × field)` | That pair's promotion, and the first of the three counts the standing-warrant rule needs (§16) |
| The first incident on a promoted pair | The demotion counter, running the same counter backwards, with no restore path |
| Pack count reaches `LIMITS.pack_ceiling` | Retire-one-to-add-one; `check-packs.mjs` starts failing rather than warning |
| Zero dispatches of a pack in ninety days | Retirement candidacy in `monthly.mjs`, archival with a stub on the founder's confirmation |
| A mission is reversed after an artifact reached a stranger | Personas reconvene as a findings-only council (refusal 7's trigger) |
| The first `reach: outbound-write` pack is proposed | `grep -rn 'reach' scripts/loop/ packs/` and count the deciders. **One file and the warrant is a small addition; two and it is a rewrite** — the falsifiable exit criterion, taken from the picture unchanged |

**Would have to be true.**
1. **A pack's track record is a coherent subject.** Not measurable in 30 days, but decidable now, and already
   decided (*founder's choice 1*). If false, the machine's ceiling is the founder's morning permanently,
   because the only lever that raises it needs a record this refusal would forbid collecting.
2. **`--allowedTools` produces absence, not denial, on every path — built-in, MCP, and under launchd.**
   **Measurable in the first 30 days** and the cheapest measurement in the document. Half `MEASURED` true. The
   unmeasured half is H2: what a dispatched process can actually *touch*, where the precedent finding was a
   silent no-op rather than an error.
3. **Outcomes accrue fast enough that trust is computed from more than a handful of rows.** Not measurable in
   30 days; the first venture produces single-digit exposures.

**grafted_from.** picture §2/02 · §3 row 02 · §7 rows 1, 4 · flywheel §2/02 (reach earned from the world,
shadow, retirement) · machine §2/02 (packs as shapes vs instances, ceiling, demotion) · founder §2/02
(`(pack × field)`, fails closed to supervised) · frame §2 · catalogue C4 C16 K1 P5 T1 T2 T4 T5 X2 X4 X5 · binds
**D3 D10 D11 D12 D14**.

---

## 03 · Hands

**At full scale — what it IS.**
**Four tiers, decided by which process holds the hand**, never by a trust level attached to a worker.

| tier | who holds it | examples |
|---|---|---|
| **H** harness, outside the sandbox | `tick.mjs` and its scripts | `git` `gh` `ffmpeg` `sips` `say` `afplay` `osascript` `caffeinate` `gemini` `codex`, worktree creation, archive and field writes |
| **W** the pack's argv | a `claude -p` child | Read/Write/Edit/Glob/Grep/Bash where granted, `playwright`; **nothing outbound** |
| **R** the mouth | one process, no model | publish · spend · send · deploy — each against a warrant, each counted |
| **F** the founder | a human hand | the physics line, forever |

Roughly fifty hands *(illustration; the machine vision's split is ~30 night, ~15 day, ~5 not-a-hand)*, each a
file in `policy/hands/<id>.yml`. **A hand is admitted by a five-part test, not by someone judging it wise** —
the test is Map 4 and is not restated here; what matters in this territory is the property it buys. Every one
of the five is checked by a loader, a wrapper, a counter, a probe or a schema rather than by an agent having
read a policy, so **the cost of admitting the fiftieth hand equals the cost of the first**, which is the only
thing that makes a fifty-hand roster governable. Pass 1–5 → a **night hand**; pass 1–4 → a **day hand**,
exercisable only against a warrant with `not_before` in the morning; fewer → **not a hand**, which is a morning
row a human performs. Tier R is one process, `bin/mouth.mjs`, holding every outbound credential,
single-threaded, **with no model in it at all** — it reads a queue, verifies an HMAC chain, compares a sha256,
counts against a ceiling, and either executes one action or refuses. **There is nothing in it to persuade.**
Its eight checks and their order live in Map 5, where the warrant they verify is specified. **The honest hole,
stated rather than discovered:** the five tests bound *authority*, not *correctness*. A hand that passes all
five can send a perfectly authorised, catastrophically wrong email to an approved recipient. That is what the
oracle, the done-test and the founder's tap are for; no capability model substitutes for them.

**Components.**
- `policy/hands/<id>.yml` — one hand, its two branches, its credential id, its probe, its counters — read by `scripts/lib/hands.js` at load.
- `scripts/lib/hands.js` — the loader; refuses a file missing `reversible:` or `blast_radius:` — the only path that admits a hand.
- `bin/mouth.mjs` — tier R, no model, every outbound credential — reads `outbound.q`, `WARRANTS.jsonl`, `policy/humans.yml`, `rates.yml`, `STOP`; writes `events.jsonl`.
- `scripts/hands.mjs probe` — nightly reachability, one probe call per grant, plus `claude mcp list` and credential expiry — writes `~/.agentvibe/hands.json`.
- `~/.agentvibe/hands.json` — the capability oracle the 2026 system never had — written by the probe run, read by the loader and by the briefing.
- `policy/humans.yml` — the named-human register; nobody is contacted who is not on it — founder-only.
- `ventures/<slug>/staged/<task>/` — the artifact plus its sha256, the year-one form of tier R — written by `tick.mjs`.
- `scripts/expose.mjs` — records the act, by whose hand, how many times, reversed how often — the founder's tap, and row one of the authority ledger.

**Enforced by.**

| rule | mechanism |
|---|---|
| A tier-W process holds nothing outbound | **argv absence** — `pack.test.mjs` asserts the names are not present, and the physics is `MEASURED` |
| A second layer refuses a dangerous write in-session | `pre-tool-use.sh` exit 2, the only blocking hook, untouched |
| A hand with no risk declaration does not load | `scripts/lib/hands.js` + `hands.test.mjs` — the same shape as the existing lint failing an `mcpServers` declaration no configuration backs |
| The effecting branch takes a hash and an unknown flag refuses | `hands.test.mjs`, with the repository's own precedent: `verdict.mjs` was changed (#116) to refuse an unknown flag **instead of performing the non-dry action**, because a mistyped `--dry-run` was being dropped in silence |
| Unprobed is unavailable | the loader reads `hands.json` and marks a hand whose probe is older than the last nightly run **unavailable**; `hands.test.mjs` asserts a stale probe blocks the hand rather than degrading it |
| Every exercise is counted at the wrapper | the counter reads `events.jsonl` and is not model-visible; `rates.test.mjs` |
| A refusal is distinct from a pass | `rates.test.mjs` and `mouth.test.mjs` pin `unresolved` and `refused` apart from `pass`, per Rule 10 — a meter that cannot be read refuses; it does not score the spend at zero |
| The mouth holds no model | `mouth.test.mjs` — the module's import graph contains no model client and its argv carries no model flag. A grep-shaped test, which is what makes it cheap enough to keep |
| STOP is checked first, and an erroring check refuses | `loop.test.mjs` and `mouth.test.mjs` — the file is created with `touch`, so nothing that can be down stands between the founder and stopping the company |
| First contact needs the register | the mouth's check 6 against `policy/humans.yml`; `mouth.test.mjs` fails an unparseable recipient closed |
| The physics line is never crossed by count | there is no code path from a counter to a tier-F act; `mouth.test.mjs` asserts the mouth has no branch for `blast_radius: public` with `reversible: no`. **A pack with a thousand clean exposures still may not sign a contract** |
| The credential really is narrower than the hand | **`WISH` in part.** Checkable: that a hand names a credential id and that the id resolves to a declared scope record — `check-credentials.mjs`. Not checkable from here: whether the vendor honours the scope. That half is an annual audit item and is labelled as one, not as a control |

**Year one — the slice.**
Three tiers, not four: H, W, F. **The founder is the mouth** — same position, same single-threading, same
record, a person reading a row and tapping instead of a process verifying a warrant. **Zero MCP servers are
built**; the five servers the designs name become five harness scripts, because their only caller is the
harness: `scripts/expose.mjs`, `scripts/world.mjs`, `scripts/mine-corrections.mjs`, and the archive and field
writes inside `tick.mjs`. No pack holds publish, send, spend or contact. Staging is a harness copy to
`ventures/<slug>/staged/<task>/` with the sha256 on the row. **Every staged act that would leave the machine
carries `not_before:`, default 08:00 the next morning** — one field on a row, so the hour is a property of the
token and not a policy someone remembers (*founder's choice 8*). Refused on every argv:
`mcp__higgsfield__tiktok_publish`, `sandbox_exec`, Gmail `send_message`, Drive `share_file`,
`claude-in-chrome`, n8n, and any ad, registrar, postage or GPU-rental hand. `higgsfield generate_*` and
`virality_predictor` are workshop hands held for `content-video` when it reopens. A daily `claude mcp list`
writes `~/.agentvibe/hands.json` from the briefing plist; it is a **report, not a check** — it exits 0 when a
server is unhealthy (`MEASURED`) — and an unhealthy server the current pack grants becomes a balcony row.
`playwright` is measured failing across two scopes, and rung 0 for pages depends on it. Of the five admission
tests, test 4 exists as the grant census and tests 1 and 3 apply to the granted MCP servers; **tests 2 and 5
are absent because there is no outbound hand to apply them to** — absence because unneeded, not a different
shape.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `EXPOSURES.yml` shows the founder performing the same outbound act by hand **3×** | Refusal 1 reopens for that act only. The act becomes a candidate hand and is put through the five tests |
| A candidate hand passes tests 1–4 | A **day hand**: exercisable only against a warrant with `not_before` in the morning. The `not_before` field already exists on the row, which is why this is additive |
| A candidate hand passes tests 1–5 | A **night hand**, and with it the first need for `bin/mouth.mjs`, `WARRANTS.jsonl` and the minter (§16) |
| The founder has performed a class by hand N times **and** the machine's nomination matched on the last N **and** that class resolved rung ≥ 2 with zero incidents | A **standing warrant** for the class: minted by code, hash-bound, rate-ceilinged, `not_before`-caveated, audited weekly with its reversal count. All three counts are required; any one alone is defeatable by a machine optimising for it |
| The first tier-R hand exists | The nightly `hands.mjs probe` becomes blocking rather than reportorial: a hand that fails its probe is unavailable tonight, not degraded-and-used |
| A worker's JSON return cannot express a state change it needs mid-move | Refusal 11 reopens; the first MCP server is built, with its caller in the same diff |
| `content-video` reopens | `higgsfield`'s 84 tools are narrowed by per-tool names in `--allowedTools`. The narrowing is available: M3 is `MEASURED` true |
| Any count at all, on any class that crosses the physics line | **Nothing.** No count is the count. A signature, a legal statement, a purchase of a durable asset, a letter in the post, first contact with a human not on the register — permanently tier F |

**Would have to be true.**
1. **A process with no model can hold the credentials** — every outbound hand has a call shape checkable
   without reasoning: a target, a hash, a recipient, a count. Not measurable in 30 days, and deferrable without
   loss, because the founder is the mouth in year one and that posture is survivable indefinitely.
2. **`--allowedTools` narrowing survives dispatch and launchd (H2).** **Measurable in the first 30 days** and
   load-bearing: if a missing hand is *denial* rather than *absence*, the rings collapse into one and the
   honest posture is that nothing runs unattended holding any credential.
3. **The narrowest credential a vendor offers is narrower than the hand.** Partially measurable at the grant
   census; where the narrowest available credential is "everything", the hand is ring-2-only or it is not a
   hand.

**grafted_from.** picture §2/03 · §3 row 03 · §7 rows 4, 8 · the physics line · machine §2/03, §5.1, §5.4,
§5.5 · flywheel §2/03 (four tiers, tier R, tier F as a reserve) · founder §2/03 (grant shape, dry-by-default,
the named-human register) · frame §3, §9 · catalogue H1 H2 R2 R4 R5 R6 · `docs/02-competitive/expansion/hands.md`
§0.1 §3.3 §5.1 §8 · binds **D2 D3 D9 D13 D14**.

---

## 04 · Knowledge

**At full scale — what it IS.**
Skills are **injected, never discovered.** `scripts/loop/prompt.mjs` inlines `.claude/skills/routers/INDEX.md`
plus the pack's one namespace under a byte cap that only ratchets down, and the harness meters what was
actually read, so a skill nobody reads leaves on the same schedule as a pack nobody dispatches.
`~/.agentvibe/fields/<slug>.md` holds about 180 field notes *(illustration)* — how cold email works, how a
thumbnail works, how trial-to-paid moves, how VAT works in three jurisdictions. **Global by design**, because
*how a field works* is the same for every venture and *what this venture sounds like* never is. A note is
**three annotated exemplars — good, bad, near-miss — each sourced, with rules subordinate to them**, and every
fact is a claim with an expiry, so a note about a platform's algorithm rots on schedule rather than quietly
becoming folklore. Learning a new field is a bounded protocol with a checkable exit — practitioners named,
canonical artifacts sourced, rules extracted, one proposed done-test — and then it **stops**; "research it" is
not a move. `ORIENT` is computed by `scripts/loop/orient.mjs` and prepended to the maker's prompt: matching
dead-ends as **actual entries** rather than as a pointer, attempts already made on this leaf, archive cells
occupied, the field's exemplars, and one thinking model's stop rule drawn by the harness. **The harness does
the retrieval, so a worker cannot skip it** — which is the property that makes the graveyard load-bearing
rather than decorative. The maker's prompt carries **no rubric, no scoring axis and no reference URL**:
divergence and convergence are separated in capability, not merely in instruction. Constraint and far-transfer
decks are drawn without replacement, one card per variant, checked mechanically where the card declares a
check. `dead-ends/<goal>-<n>.md` carries `retry_if:` as a **command**, and a scheduled reader re-tests those
that come due — about twelve a night, of which roughly one in fifteen no longer reproduces *(both
illustrations)* — so the map of what the company cannot do stays current instead of calcifying.
`ventures/<slug>/TASTE.md` is per venture, founder-only, ≤ 20 lines, injected whole into MAKE. **The founder
never reads the Book. If they have to, the knowledge layer has failed.**

**Components.**
- `.claude/skills/routers/INDEX.md` + one namespace file — the two-tier index — read by `prompt.mjs`; a lookup is ~1,070 tokens against ~15,000 for the whole manifest (`MEASURED`).
- `~/.agentvibe/fields/<slug>.md` — the field note: three exemplars, sourced, rules subordinate, every fact a claim — written **only** by the harness from an `orient` return; read by `orient.mjs`.
- `ventures/<slug>/TASTE.md` — WHAT IT IS · WHO FOR · IN THEIR WORDS · ONE LINE · REFERENCES · ADJECTIVES · NO-GOS — founder-only, ≤ 20 lines, `irreversible` tier.
- `ventures/<slug>/dead-ends/<goal>-<n>.md` — one failed approach, with `retry_if:` — written by `tick.mjs`; read by `orient.mjs` and by the re-test reader.
- `scripts/loop/orient.mjs` — computes the ORIENT block; writes nothing; its output is prompt bytes.
- `scripts/loop/retest.mjs` — runs each due `retry_if:` command and records reproduce / no-longer-reproduces — writes a claim disposition.
- `decks/constraints-visual.yml`, `decks/transfer-far.yml` — one card per variant, drawn without replacement — read by `tick.mjs` at fan-out.
- `scripts/check-fields.mjs` — the field-note schema check — a suite step.
- `skill.read` rows in `events.jsonl` — the meter — written by the harness from the transcript scan, keyed on task id.

**Enforced by.**

| rule | mechanism |
|---|---|
| The prompt stays under its byte cap, in cache order | `prompt.test.mjs` — bytes and order |
| The maker's prompt carries no rubric, scoring axis or reference URL | `prompt.test.mjs` — a negative string check with a positive control |
| The router index is present | `prompt.test.mjs` |
| A field note without an exemplar or without an expiry fails | `check-fields.mjs`, a suite step |
| A field note naming a project fails | `check-fields.mjs` — Decision 9 enforced by scope rather than by convention |
| Every exemplar source is real and says what the note says it says | the `claim-source` resolver fetches the URL and asserts the quote is present |
| A field fact expires and expiry forces a disposition | `ledger.mjs` at `lint` fails a claim with no `valid_until`; `claim-freshness` fails it once the date passes |
| A worker cannot skip ORIENT | **construction**: ORIENT is prompt bytes, not a tool call. `orient.test.mjs` runs a positive control — a known dead-end must appear in the block |
| `failed` and `abandoned` cannot close without a dead-end | `tick.mjs` refuses; `tick.test.mjs` pins the refusal |
| A byte cap only ratchets down | `check-caps.mjs` fails a declared cap larger than the last recorded value; the caps file is committed, so the ratchet is in git |
| A skill nobody reads is retired | `monthly.mjs`'s X2 last-use over `skill.read` rows, keyed on task id; zero reads in ninety days is a retirement candidate, archival with a stub |
| `retry_if:` is actually evaluated | `retest.mjs` runs it where it is a **command**. Where `retry_if:` is prose, nothing evaluates it — **`WISH`**, and the cure is a schema change requiring a command, not a scheduled reader |
| A return names which thinking model it used and what the stop rule said | **`WISH`** in year one. Gains a mechanism as a required return field the day a pack declares a model in its `skills` block; today zero of eighteen agent files cite one, and discretionary citation is why |

**Year one — the slice.**
Injection **and** metering. `prompt.mjs` inlines the router index plus the pack's one namespace under the
4,096-byte prompt cap; after each move the harness scans the session transcript — `session_id` comes from the
JSON result, `MEASURED` — for Reads under `.claude/skills/**` and writes `skill.read` rows keyed on the task
id. Fields live at `~/.agentvibe/fields/`, global **by sandbox geometry**: `~/.agentvibe` is the one
`allowWrite` path outside the project root, so the global store is global because of where the sandbox lets the
harness write, not because a convention says so. Notes are written **only** by the harness from an `orient`
move's return, never by a maker. `TASTE.md` is founder-only, ≤ 20 lines, seven headings, tiered `irreversible`
in `qa-tier-floor.yml`, injected whole into MAKE. `dead-ends/` never expires, and `retry_if:` is therefore **a
predicate nothing evaluates** — the one additive gap in this territory, named here rather than discovered
later. ORIENT is computed and prepended. Decks exist as two files. `FIELDS/` carries its own falsifier from the
frame: by **2026-12-02**, if the meter shows no field note read by a task outside the mission that wrote it,
`FIELDS/` freezes.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| Two missions ORIENT the same field | The field library unfreezes and grows; the frame's own reopen |
| Zero cross-mission field reads at the frame's falsifier date | `FIELDS/` freezes. A frozen store is a finding, not a deletion — the notes stay and stop being written |
| The first `retry_if:` written as a command | `retest.mjs` lands as a scheduled reader over a field that already exists. Cheap, because the store and the field predate it |
| The first exemplar source that stops resolving | `claim-source` returns `unresolved`, the note becomes a balcony row, and the note's rot is visible rather than silent |
| A second venture exists | Decision 9's split is tested for real: a field note written under venture one, read under venture two, is the falsifier passing |
| A skill's read count is zero over ninety days | Retirement candidacy in `monthly.mjs`, on the same schedule as a pack |
| A variation round runs | The decks are drawn without replacement and the mechanical card checks have an input |
| The ORIENT block hits its byte cap | The two-tier split: ids plus one-line summaries, content on demand. **The cap is never raised** — twice proven here, skills discovery 15,000 → 1,070 tokens and `session-start.js` 27,069 → 2,941 bytes, both `MEASURED` |

**Would have to be true.**
1. **Field knowledge transfers across ventures.** The frame already dates its own falsifier. Not measurable
   inside 30 days at one venture, which is precisely why the falsifier is dated rather than assumed.
2. **Exemplars beat rules for a fresh-context maker.** Not measurable in 30 days. The weaker claim that is
   measurable: whether the ORIENT block's dead-end entries change what a maker attempts, visible as a fall in
   repeated approach hashes.
3. **The byte cap does not starve the maker.** **Measurable in the first 30 days** as the count of `truncated`
   returns and of moves that ask for a file the cap excluded.

**grafted_from.** picture §2/04 · §3 row 04 · §5 rows 5, 6 · flywheel §2/04 (180 notes, decks, C18) · machine
§2/04 (two stores, the graveyard at 3am, the harness retrieves) · founder §2/04 (the exemplar triad, the
bounded protocol, K3 by scope, the founder never reads it) · frame §4 · catalogue C9 C13 C16 C18 C25 K1 K2 K3
N1 X2 · Decision 9 · binds **D7 D8 D12**.

---

## 05 · Memory

**At full scale — what it IS.**
Ten stores *(illustration; the count is whatever the store map holds)*, each with **exactly one writer**, each
append-only or rewritten whole, all in git, **none a service.** **Map 2 is the authoritative list** — path,
format, one writer, readers, expiry rule, cap — and it is not restated here, because two descriptions of one
table disagree silently. What belongs to this territory is the **routing rule**: four physics decide which
store a thing goes in.

| store class | holds | physics |
|---|---|---|
| `events.jsonl` | *what happened* | append-only, never expires, and **never evidence for a belief without a claim** |
| the claim ledger | *what is true* | expires, and expiry forces exactly one disposition — refresh, deprecate, or waive with a new deadline |
| `~/.agentvibe/fields/` | *how a field works* | global, exemplar-first, every fact expiring |
| `TASTE.md` + `PAIRS.jsonl` | *what this venture is* | per venture, preference pairs plus an extracted rubric, expiring quarterly because taste drifts |

Get the routing wrong and the failure is specific and familiar: an event used as evidence produces a belief
nobody can date, and a belief stored as an event never expires. The full-scale additions are new stores under
the same discipline, not a new discipline: `AUDIENCE.yml` per venture, `people.yml`, `WARRANTS.jsonl`
append-only with one row per issue, exercise and refusal, and the attention record — every card: answered or
fused, how fast, and whether the founder later reversed the fuse. Conflict resolves **newer-wins with the older
retained in place carrying the evidence that moved it** — the practice this repository already follows by hand
in every supersession block, made a data operation. Forgetting is a program with four rules and a stub under
every original heading, never a judgement call, and **nothing is deleted to meet a cap**; the archive rotates
by volume and each volume is capped independently, because a cap on the lifetime total of an append-only log is
a mechanism for losing decisions. Retrieval is by construction — the harness injects — plus `Grep` and `mdfind`
over an append-only corpus. **Still no vector store.** By full scale there is one rebuildable index over the
append-only files, because prefix sums over four years stopped being instant: an index, never a second source
of truth, and deletable at any moment without loss. **RAG over transcripts is refused as memory**: transcripts
are full of confidently-stated superseded beliefs and retrieval cannot tell a corrected belief from a current
one. They are instrumentation — mined monthly for corrections, for promises that never landed, and for where
sessions die.

**Components.**
- Map 2, the store map — path · format · one writer · readers · expiry · cap for every store.
- `scripts/evict-memory.mjs` — the only writer of an archive volume; `plan` prints net bytes freed, `apply` performs it — **never a hand edit**.
- `scripts/lib/memory-entries.js` — the four eviction rules, pinned by mutation in `evict-memory.test.mjs`.
- `scripts/check-memory-budget.mjs` — the cap checker; finds archive volumes by pattern, so a new one is governed the moment it exists.
- `scripts/check-exposures.mjs` — a row past `check_on` with no disposition fails.
- `scripts/check-archive.mjs` — every `INDEX.jsonl` row resolves; a card with no task id is refused.
- `scripts/supersede.mjs` — writes the newer-wins block in place, with the reason and a `superseded_by:` header.
- `scripts/index-build.mjs` — rebuilds the one index from the append-only files; its output is byte-reproducible.
- `scripts/mine-corrections.mjs` — the only reader of transcripts, by **regex, not by a model**.

**Enforced by.**

| rule | mechanism |
|---|---|
| One writer per store | one test per store that no other path writes it. The existing precedent is the `PAIRS.jsonl` single-writer test; each new store copies it |
| Caps bind, and the byte cap binds before the entry cap | `check-memory-budget.mjs`, which the reader asks rather than quoting a number from prose |
| Nothing is deleted to meet a cap | `evict-memory.mjs` refuses what its four rules forbid and checks that no byte was lost; `evict-memory.test.mjs` pins each rule by mutation |
| Every archival leaves a resolvable stub | `evict-memory.mjs`; a citation by date or by title still resolves afterwards |
| A row past `check_on` with no disposition fails the build | `check-exposures.mjs` as a suite step — the brake on the "unresolved exposures" anti-flywheel |
| Every archive index row resolves | `check-archive.mjs` |
| A superseding block names a resolvable target | `supersede.test.mjs`, the same shape as the ledger's existing rule that a claim's `supports:` must resolve |
| No vector store | `package.json` carries no vector client; `deps.test.mjs` fails on one. A one-line check for a refusal that would otherwise be a preference |
| Transcripts never enter a producing context | **argv absence**: no producing pack's `--add-dir` includes the transcript path, and `pack.test.mjs` asserts it. The monthly reader is a regex script with no model in it |
| The index is an index, not a source of truth | `index.test.mjs` deletes and rebuilds it and asserts byte-identical output — the same reproducibility check `npm run check:ledger` already performs on the claim index |
| An event is never evidence for a belief | **`WISH`** as a machine check — nothing can read intent from a citation. What *is* enforced: a claim must carry a resolver and an expiry, so a belief that skipped the ledger has no standing anywhere a claim is required |

**Year one — the slice.**
Eleven stores, one writer each, and they are the year-one rows of Map 2: `MISSIONS.yml` (transitions from a
table; `tick.mjs` for state, founder for intent) · `BOARD.md` (rewritten whole, ≤ 4,000 bytes) · `STEER.md`
(read at tick top; `stop:` is the andon cord; founder-written) · `TASTE.md` (founder only, ≤ 20 lines) ·
`EXPOSURES.yml` (append-only, `check_on` required, `no_data` ≠ `not_checked`; written by `expose.mjs`) ·
`~/.agentvibe/fields/` (every fact a claim with `valid_until`; harness) · `dead-ends/` (never expires;
`tick.mjs`) · `archive/<slug>/<field>/<cells>/<task>/card.yml` + `INDEX.jsonl` (every candidate kept, rotates
by volume, never deleted) · `taste/PAIRS.jsonl` (only `promote.mjs` writes) · `~/.agentvibe/events.jsonl` and
`tasks.jsonl` (no row without `task`) · `DECISIONS.md` and the ledger, unchanged. Retrieval by construction and
by `Grep`/`mdfind`; no vector store. Conflict newer-wins, older superseded in place. Forgetting is
`evict-memory.mjs` pointed at each new store with its four rules re-derived. Transcripts are read monthly by
the harness and never enter a producing context. The archive is **built**, with its falsifier: 30 days after
the first `card.yml` exists, zero founder promotions of a non-nominated cell **and** zero ships from a
non-nominated cell deletes `archive/` and keeps `distance.js` and `select.js`; if no round has run by
**2026-10-02**, that is itself the finding and the archive is not built.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first subscriber to the owned address | `AUDIENCE.yml` per venture: channel, owned or rented, size, measured at a date. Its reader is the rung ceiling (§15) |
| The first named human the company contacts | `people.yml`, and with it the mouth's check 6 — nobody is contacted who is not on it |
| The first warrant minted | `WARRANTS.jsonl`, append-only, one row per issue, exercise and refusal. **The only store whose growth permanently raises the machine's ceiling** |
| The first fuse fires | The attention record's first row. Reversals are counted **separately** from non-answers, and a card class with any reversal history can never be auto-retired |
| `balcony.mjs` wall clock exceeds the founder's stated latency budget | The one rebuildable index. The budget is a number the founder sets; it is not invented here |
| A second archive volume is needed | Rotation, with the per-volume cap applied independently — the lifetime total is never capped |
| A store acquires a second writer in a diff | Nothing "lands": the single-writer test fails and the diff does not merge. This is a brake, listed here so it is not mistaken for a growth step |
| Four lanes run | The one-writer discipline is tested for real; last-writer-wins on a whole file stops being free and the store map's per-store lock column has an input |

**Would have to be true.**
1. **One writer per store survives concurrency.** Measurable the day two lanes run, which is inside 30 days
   only if the four-hour trigger fires; otherwise it is the first thing to measure in the next stage.
2. **Grep over an append-only corpus stays fast enough that no vector store is needed.** **Measurable in the
   first 30 days** at trivial volume, and the measurement is nearly meaningless there — say so rather than bank
   it.
3. **Newer-wins-in-place is cheap enough to do every time.** The evidence is that this repository already does
   it by hand in every supersession block; the risk is that a data operation is skipped where a prose habit was
   not.

**grafted_from.** picture §2/05 · §3 row 05 · §5 · flywheel §2/05 (the store table, the index,
`outcomes.jsonl` split from `EXPOSURES.yml`) · machine §2/05 (episodic / semantic / procedural, transcripts as
instrumentation) · founder §2/05 (the four physics as a **routing rule**, MEM2 in place) · frame §5 · catalogue
A4 C2 C21 MEM1 MEM2 MEM3 W3 X5 · Decision 1 · binds **D1 D8 D12**.

---

## 06 · Communication

**At full scale — what it IS.**
**A star, and it is physics: a `claude -p` child has no address.** Eight makers running at once *(the machine
vision's illustration)* are eight islands, and the conductor alone reads all eight — not a limitation but the
thing that makes their variants actually different. **No worker messages a worker at any scale**, and the
reason is worth stating precisely: a grant can be widened by an oversight, and an address that does not exist
cannot. Down is the compiled prompt. Up is JSON on stdout, parsed by `tick.mjs` into a fixed return: `outcome ∈
{done, blocked, stuck, failed, truncated}` · `artifacts[]` · `tried[]` · `learned` · `blocked{because,
clearable_by, until, default_if_unanswered}` · optional `proposed_done_test`. The baton is SBAR with a
per-section byte cap, read back in the receiver's own words on first return, with large divergence raised as a
**finding rather than a block** — the receiver may be right and the baton wrong. Help is the return's required
`tried:` list, which doubles as the raw material for a dead-end, so negative knowledge is a by-product of
asking rather than a separate act nobody performs. Escalation is three rungs with maximum dwell times: retry to
`attempts`, counted by the harness from event rows and never by the worker; block with `clearable_by: founder`,
which frees the slot; and **wake**, which only a warrant carrying `urgency: wake` may do — a caveat held by a
small closed set of warrant kinds, listed **by name** in `policy/warrants.yml` and changeable only in daylight.
The size of that set is a founder setting, not a figure this document supplies. **One edge is added at full
scale: inbound.** A relay holds the socket, the mailbox, a watched drop directory and the feeds, and does
exactly one thing with what arrives — **it writes a leaf.** It does not summarise, classify or rank. **A
received body never enters a producing context.** It enters an argv with no Write, no Edit, no Bash and no
outbound grant; the artifact it produces carries `taint: foreign`, stamped by the wrapper that fetched it and
propagating through the context; and the mouth refuses a tainted artifact without a morning release. The two
legs are not redundant: the argv is the control, and the taint stamp is the audit trail that survives into the
artifact. **The stated hole:** foreign content arriving by a path the wrapper does not mediate is untainted and
nothing notices. Every path must be mediated or the property is not a property.

**Components.**
- `bin/inbound.mjs` (the relay) — socket, mailbox, watched drop directory, feeds — **writes a leaf and nothing else**; holds no model.
- `packs/orient.yml` — the only argv a fetched body may enter: `[Read, Glob, Grep, WebSearch, WebFetch]`, no Write, no Edit, no Bash, no outbound.
- `scripts/lib/fetch-wrapper.js` — the one mediated fetch path; stamps `taint: foreign` on the context and on every artifact produced in it.
- `policy/mediated-paths.yml` — the registry of paths permitted to write a leaf — read by the relay and by the taint test.
- `ventures/<slug>/BOARD.md` — the SBAR baton, rewritten whole, ≤ 4,000 bytes — written by `tick.mjs`, read by the next prompt.
- The return schema — `scripts/loop/return.js` — parsed by `tick.mjs`; a missing field records `failed`.
- `policy/warrants.yml` — which warrant kinds may carry `urgency: wake` — founder-only, `irreversible` tier.
- The notification path — one `osascript -e 'display notification'` from the harness, inside the window, metered.

**Enforced by.**

| rule | mechanism |
|---|---|
| A worker cannot message a worker | **physics** — a `claude -p` child has no address, and `pack.test.mjs` additionally fails `send_message` and `share_file` in any argv. The two together mean neither an oversight nor a widening restores the edge |
| Workers never hold `Task` | `pack.test.mjs`; and nesting would otherwise reintroduce the org chart through the dispatch tree |
| A return missing a required field is `failed` | `return.test.mjs` |
| `done` with a truncating `stop_reason` is `truncated`, never `done` | `return.test.mjs`, with the `stop_reason` value taken from `scripts/probe-stop-reason.mjs` rather than assumed |
| A `blocked｜stuck｜failed` return with no `tried:` is recorded `failed` with a finding | `return.test.mjs` |
| A missing SBAR heading fails | the `BOARD.md` schema lint |
| Attempts are counted by the harness, not by the worker | `attempts.test.mjs` — a worker-supplied attempt number is ignored, with a positive control that the harness's own count advances |
| Two concurrent ticks produce one move | `tick.test.mjs` via `tick.lock` (`openSync 'wx'`, pid inside, stale after 30 minutes) |
| A fetched body enters only a no-Write argv | `pack.test.mjs` asserts `orient`'s tool list, and the fetch wrapper refuses to run under any other pack id |
| A tainted artifact cannot be published without a morning release | the mouth's check 5; `mouth.test.mjs` pins refusal-on-taint apart from pass |
| Every path that writes a leaf is mediated | `taint.test.mjs` asserts every writer of a leaf appears in `policy/mediated-paths.yml`. **This closes the enumerable half only** — an unmediated path nobody registered is still invisible, and that remains the stated hole, **`WISH`** |
| A read-back divergence is a finding, not a block | `baton.test.mjs` — divergence produces a finding row and the move continues |
| Only named warrant kinds may wake the founder | the minter refuses `urgency: wake` on a kind not in `policy/warrants.yml`, which is `irreversible` tier and so moves only through the human gate |
| Interruptions are metered, not merely capped | `monthly.mjs` turns `notify_per_day` from a cap into an account and reports the overnight interruption count as a number |

**Year one — the slice.**
The star, with **no sideways channel at all**. Down is the compiled prompt; up is the fixed JSON return parsed
by `tick.mjs`; `stop_reason` marks `truncated` and a truncated move is never `done`. `BOARD.md` in SBAR —
Situation · Background · Assessment · Next (a real leaf id) · Blocked — and a missing heading fails. Help is
the return's `tried:`. Escalation has **two** rungs: L1 retry up to `attempts: 3`, counted by `tick.mjs` from
event rows; L2 blocked with `clearable_by: founder`, then the next leaf. **No L3 wake and no council.**
Interrupts: one `osascript display notification` per new founder-clearable block, inside 08:00–22:00, at most
`notify_per_day`, from the harness. Everything else waits for the 08:00 briefing. Inbound into a producing
context is refused (D9, refusal 3) — and the frame's stated reason *is* the full-scale mechanism: a fetch
enters only the `orient` argv. So the refusal is of the wrong **shape** of inbound, not of inbound, and the
relay and the taint stamp are additive on top of it. **The H3 taint flag is `WISH` in year one**, and the frame
says so; it gains a mechanism the day a mediated fetch path exists to stamp.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| One cycle's wall clock exceeds 4h **and** the stall counter is clean | A second worker, and with it read-back (CO2) and path leases (CO4), both currently refused with that exact reopen |
| The first inbound path — a watched drop directory is the cheapest and most reliable | The relay writes a leaf; `policy/mediated-paths.yml` and the taint stamp land **in the same diff**, because a taint flag with no mediated path is a wish and a mediated path with no stamp is an audit hole |
| A second inbound channel | The mediated-paths registry stops being a one-row file and `taint.test.mjs` earns its keep |
| The first tier-R hand | The mouth's check 5 becomes load-bearing: taint stops being a label and starts refusing publications |
| A mission is reversed after an artifact reached a stranger | The council reconvenes as findings-only across model families (refusal 7's trigger) |
| The first warrant carrying `urgency: wake` | L3 exists. Overnight interruptions become a **measured number** on the balcony, and the answer to a rise is to change what the loop attempts overnight, never to weaken the gate |
| `notify_per_day` exceeded in any month | `monthly.mjs` reports it as a finding **about the machine**, not about the founder |
| Two workers need genuine pair work | The pod — two workers sharing one dispatch — as the single named exception, and it is still one grant and one lock |

**Would have to be true.**
1. **Argv absence is absence on the MCP path as well as the built-in path.** `MEASURED` for user-scope servers
   via `--strict-mcp-config`; the remaining half is H2, and it is **measurable in the first 30 days**.
2. **A leaf written by the world does not become the priority function.** Guarded by construction — the relay
   writes a leaf and never a rank — and not measurable until inbound exists.
3. **Every inbound path can be mediated.** Not measurable in 30 days, and the honest statement is that the
   registry closes the enumerable half only.

**grafted_from.** picture §2/06 · §3 row 06 · flywheel §2/06 (the relay, escalation dwell times) · machine
§2/06, §5.8 (four inbound channels, taint at the wrapper, the stated hole) · founder §2/06 (the baton read back
as a finding, the pod, no messaging hand) · frame §6, §9 · catalogue B4 CO1 CO2 CO3 CO4 H3 N3 S1 · binds
**D1 D11 D13**.

---

## 07 · Context & cost

**At full scale — what it IS.**
**Every row carries a real task id and a `say:` line, both minted at dispatch, from the first commit.** Both
are unretrofittable for the same reason: the balcony, the briefing, the queue, the register, the attention
meter and `explain.mjs` are six projections of **one** log, and without the id they are six logs that disagree
— discovered during an incident. A row emitted without `say:` can never be spoken, and backfilling it rewrites
every emitter. Cost per mission is a prefix sum over `tasks.jsonl`; cost per venture, per field and per pack
are **the same sum grouped differently**, which is why none of them needs a store. The prompt is assembled in
cache order — stable prefix first, varying suffix last — and the cache-read ratio is a **measured** number
taken from `usage.cache_read_input_tokens`, because a saving nobody measures is a saving nobody has. Every
injected surface has a byte cap that only ratchets **down**; exceeding it never raises the cap, it forces a
two-tier split into ids plus one-line summaries with content on demand. That cure is proven twice in this
repository already: skills discovery 15,000 → ~1,070 tokens, and `session-start.js` 27,069 → 2,941 bytes, at
which point the injected content **reached agent context for the first time** — under the old size the runtime
truncated it and inlined a preview, so the lenses and playbooks never arrived at all. Both `MEASURED`.
Compaction is designed out: the process exits, and a move that would have needed it is recorded `truncated`,
which is never `done`. Overnight work goes through the Batch API at half price where reachable — **flagged
unverified**, because the frame states Batch is not on the CLI; if it is unreachable it moves the model line by
roughly $700 a month *(illustration)* and changes nothing else about the design.

**Components.**
- `logEvent(task, obj)` in `scripts/lib/events.js` — two-argument arity, so a row without a task id is not expressible.
- `~/.agentvibe/events.jsonl` — every row, typed, keyed on task — written by `logEvent`; read by the balcony, `monthly.mjs` and the brakes.
- `~/.agentvibe/tasks.jsonl` — task → `session_id`, `total_cost_usd`, `num_turns`, `stop_reason`, `cache_read_input_tokens` — written by `tick.mjs` from the JSON result; all fields `MEASURED` present.
- `say:` — a column on the row, ≤ 15 words, no `/`, no 7+ hex run — **written at emission by the thing that knew what happened**, so no model sits between the event and what the founder hears.
- `scripts/loop/prompt.mjs` — assembles ≤ 4,096 bytes in cache order — the only writer of prompt bytes.
- `scripts/check-caps.mjs` — the ratchet; a declared cap larger than the last recorded value fails.
- `scripts/pl.mjs` — prefix sums, and `undefined` at a zero denominator, never a flattering zero.
- `scripts/probe-stop-reason.mjs` — already on disk; gives the exhaustion value rather than assuming it.

**Enforced by.**

| rule | mechanism |
|---|---|
| No row without a task id | `events.test.mjs` pins the two-argument arity of `logEvent(task, obj)`; `check:taskid` fails any row after the cutover date lacking `task` |
| Every row carries `say:` | the `say` lint — ≤ 15 words, no `/`, no run of 7+ hex characters — run as a suite step over emitted rows, not over source |
| The prompt stays under its cap and in cache order | `prompt.test.mjs` (bytes **and** order) |
| A cap only ratchets down | `check-caps.mjs`; the recorded value is committed, so the ratchet lives in git rather than in a habit |
| Cost per surviving exposure prints `undefined` at a zero denominator | `pl.mjs`, asserted by `pl.test.mjs`. Never zero — a flattering low number from an empty denominator is the failure mode this rule exists for |
| A truncated move is never `done` | `return.test.mjs`, with the `stop_reason` value from `probe-stop-reason.mjs` |
| Compaction cannot silently drop context | **construction** — the process exits, so there is nothing to compact. This is a design property, not a check |
| The cache-read ratio is measured, and an unmeasured ratio is `unresolved` | `cache.test.mjs` fails when the field is **absent** from the row, not when the value is low. Rule 10 applied to a saving: a ratio that could not be read is never scored as zero |
| Cost is one sum grouped many ways | `pl.test.mjs` asserts the per-venture, per-field and per-pack figures are derived from `tasks.jsonl` and that no second store exists for them |
| Batch is used where reachable | **`WISH`**, and flagged unverified by the vision that proposed it. Gains a mechanism only from a measurement that Batch is reachable from the CLI; until then the model line is what it is |

**Year one — the slice.**
Into a worker: `prompt.mjs` output **≤ 4,096 bytes**, in cache order — (1) pack preamble, (2) router index plus
namespace, (3) `TASTE.md`, (4) `BOARD.md`, (5) `STEER.md`, (6) the ORIENT block, (7) task id, intent and
done-test. The stable prefix is the grant; the varying suffix is the idea. **Batch: none on the CLI.
Compaction: designed out** — the process exits, and a move that would need it is recorded `truncated` and the
founder splits the leaf. The join lands early rather than late: `logEvent(task, obj)` as an arity change across
five call sites, **and `say:` in the same landing** as a column on the row, plus a first `BRIEFING.md` writer
over whatever rows exist, so the founder is handed something to look at inside the first week
(*founder's choice 7*). `~/.agentvibe/tasks.jsonl` maps task → `session_id`, `total_cost_usd`, `num_turns`,
`stop_reason`, every one of them `MEASURED` present in the JSON result. Cost per mission is a prefix sum. Cost
per surviving exposure is spend ÷ exposures at rung ≥ 2, printed `undefined` while the denominator is zero —
which it will be for most of the first month, and that is the honest reading rather than a defect.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| A second lane runs | `tasks.jsonl` gains `lane`; every existing sum is grouped by it. No new store, no new writer |
| A second venture exists | Cost per venture, from the same sum. The absence of a new store here is the test that the join was built correctly |
| A second pack ships | Cost per pack, and with it the first input to `(pack × field)` trust (§02) |
| The first `truncated` row | The founder splits the leaf. **Three on one leaf** is a finding that the leaf is too large, reported by `monthly.mjs` rather than retried |
| The cache-read ratio falls below the founder's stated floor | The prompt order is re-derived and re-measured. The trigger is the ratio; the floor is a number the founder sets, and it is not invented here |
| Any injected surface exceeds its cap | The two-tier split — ids plus one-line summaries, content on demand. **The cap is not raised.** Twice proven, both `MEASURED` |
| A measurement shows Batch reachable from the CLI | Overnight work moves to it. Until that measurement exists the saving is not counted anywhere |
| A seventh projection of the log is proposed | It must render from the same query as the other six, and the test that all renderers share one query (§10) is what admits it |
| Prefix sums stop being instant | The one rebuildable index (§05) — an index, never a second source of truth |

**Would have to be true.**
1. **The task id and `say:` are minted before anything else is built.** Not an assumption so much as a
   decision, already taken, and the only one in this territory that cannot be made later at any price.
   **Measurable in the first 30 days** trivially: the landing either carries both or it does not.
2. **`--append-system-prompt` at 4 KB is accepted and cache-stable across ticks.** **Measurable in the first 30
   days**; it is on the frame's own measure-before-build list, and both the byte cap and the cost argument rest
   on it.
3. **Prefix sums stay instant long enough that no index is needed early.** **Measurable in the first 30 days**,
   and nearly meaningless at first-month volume — which is the point of stating it as an assumption with a
   later trigger rather than as a fact.

**grafted_from.** picture §2/07 · §3 row 07 · §5 (six projections of one log) · §7 row 7 · flywheel §2/07
(cache order, one sum grouped differently, Batch) · machine §2/07 (the ratchet, the two measured cures,
`cache_read_input_tokens`) · founder §2/07 (`say:` at emission, the id from the first commit) · frame §7 ·
catalogue CT1 CT2 CT3 EC2 · binds **D1 D4**.

---

## 08 · Quality & truth

**At full scale — what it IS.**
The company's judgement of its own work is arithmetic over findings, and the only thing that ever produces a
number is a counter. A move's artifact passes through three stages in a fixed order, and the order is the
design: **deterministic oracle → hygiene linter → (optionally) a findings-only panel → deterministic
selection**. No model is asked anything until the first two have run and their findings are on disk, because a
model asked to look at a page with lorem ipsum on it will spend its attention on the lorem ipsum.

`scripts/loop/oracle.mjs --type <page|code|image|video|copy> --artifact <path> --json` is the first stage and
is pure: `code` runs `npm run check`; `page` takes a Playwright screenshot at 1280×800 and 390×844, asserts
non-blank, resolves every internal link and asserts zero console errors; `image` reads `sips -g pixelHeight -g
pixelWidth`; `video` reads `ffprobe` streams and duration; `copy` asserts non-empty with resolving links. Exit
0 or 1 plus findings on stdout. **Rung 0 is defined as oracle pass and nothing else.**

`scripts/embarrass.mjs <path>` is the second and catches placeholders, TODOs, `#` hrefs, unreplaced template
variables, alt text equal to the filename, and off-palette colour against the venture's declared palette. It is
**hygiene and is rendered as hygiene**, never as taste, because a linter that reports on taste teaches the
founder to distrust the linter.

Every finding anywhere in the system, from an oracle or a judge alike, is one shape:

```yaml
# findings.yml — written beside the artifact, read by select.js and the balcony
- id:        f-4471-03
  task:      M-0007.3.1#2v4
  severity:  P1 | P2 | P3
  where:     ventures/pinefall/staged/M-0007.3.1#2v4/index.html:41
  what:      "alt text equals the filename"          # one line, no score
  found_by:  oracle:page | embarrass | judge:claude | judge:gemini
```

There is no `total`, no `score`, no `rank` and no `weight` field, at any scale, in any file. `LADDERS.yml` at
the repo root declares rungs 0–4 per artifact type, and a claim's assertion string is **generated** from its
rung by `scripts/lib/claims.js`, so a rung-0 result is structurally incapable of being phrased as a rung-2 one:

```yaml
page:
  0: {name: "it renders",                     resolver: command, test: "node scripts/loop/oracle.mjs --type page"}
  1: {name: "a stranger understands it in 5s", resolver: human}
  2: {name: "someone clicked",                resolver: world, instrument: analytics, threshold: ">=1 click"}
  3: {name: "someone came back",              resolver: world, instrument: analytics, threshold: ">=1 return in 14d"}
  4: {name: "someone paid",                   resolver: world, instrument: stripe_ro, threshold: ">=1 paid invoice"}
```

The panel, when it exists, returns findings and nothing else. Judges compare blind: identity stripped, order
randomised, the swapped twin run, and **a pair that flips resolves `unresolved`, never to a winner**. The panel
holds ≥ 2 model families and **the second seat may be empty; empty resolves `unresolved`, never `pass`.**
Selection is `scripts/lib/select.js`, pure and total: eliminate every candidate carrying a P1, prefer the
fewest distinct P2s, tie-break on archive distance from `scripts/lib/distance.js` (trigram Jaccard). **No
judge, of any family, ever resolves a done-test.** Taste enters exactly twice and never as a number: `TASTE.md`
before MAKE, and the founder's tap after.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/loop/oracle.mjs` | deterministic per-type check, stage one | written by harness · read by `tick.mjs` |
| `scripts/embarrass.mjs` | hygiene linter, stage two | harness · `tick.mjs`, balcony |
| `LADDERS.yml` | rungs 0–4 per artifact type, thresholds, instruments | founder writes · `claims.js`, `check-donetests.mjs` read |
| `scripts/lib/select.js` | pure findings → pick | harness · `tick.mjs` |
| `scripts/lib/distance.js` | trigram Jaccard over candidate text | harness · `select.js`, `orient.mjs` |
| `scripts/panel.mjs` | dispatches judge seats, returns findings | harness · `select.js` |
| `findings.yml` per candidate | the one finding shape | oracle / embarrass / panel · `select.js`, balcony |
| `scripts/world.mjs` | deterministic parse of an instrument into a reading | harness · `EXPOSURES.yml` |
| `claim-world`, `claim-judge-external` | ledger resolvers | `resolvers.js` · `ledger.mjs` |
| `scripts/verdict.mjs --subject-kind diff\|artifact` | binds a verdict to bytes | harness · `qa-lead-pass.yml` |

**Enforced by.**

| rule | mechanism |
|---|---|
| The oracle runs before any model is dispatched | `tick.test.mjs` — a recorded move whose `panel.*` row precedes its `oracle.*` row fails |
| No summed or averaged score exists anywhere | `select.test.mjs` — no numeric `total` under `.claude/workflows/` or `packs/`; the findings schema refuses unknown keys |
| No judge resolves a done-test | `check-donetests.mjs` fails `resolver: judge` |
| A rung may not exceed what its resolver kind can establish | `schema-lint.js` predicate on `LADDERS.yml` |
| An empty judge seat resolves `unresolved`, never `pass` | `ledger.test.mjs`, which already pins `unresolved` as distinct from `pass` for every resolver (Rule 10) |
| A flipped blind pair resolves `unresolved` | `panel.test.mjs` — the swapped twin is a required second call, and disagreement is a terminal value |
| Same findings produce the same pick | `select.test.mjs` determinism case |
| An unreachable instrument reads `unresolved` | `claim-world` resolver; `ledger.test.mjs` |
| Embarrassment findings render as hygiene, never as taste | `briefing.test.mjs` — a `found_by: embarrass` finding rendered under a taste heading fails |
| A verdict binds to the artifact's bytes, not to a branch | `verdict.mjs --subject-kind artifact`, `sha256(bytes)`; `verdict.test.mjs` pins the two kinds apart |
| Below-threshold sample sizes resolve `unresolved` rather than `pass` | **`WISH`** — the power calculation in the resolver is designed and unbuilt. Becomes a mechanism the first time a rung-2 threshold is written with a denominator |

**Year one — the slice.**
`oracle.mjs` (rung 0), `embarrass.mjs`, `select.js`, `distance.js`, `LADDERS.yml`, `claim-world` registered and
returning its first `unresolved`. **`design.js`'s `total` is deleted.** Rung 1 is `resolver: human` and is the
founder or one stranger at the tap. **No model judge anywhere**, and this ordering is deliberate: the
deterministic selector is the durable half and the panel is an optional input to it, so building the selector
first and leaving its panel input empty is the correct sequence and should not be inverted to chase a second
family. The verdict subject generalisation is not in the thirty days, because the first artifact is a diff. One
`gemini -p` run from the harness, outside the sandbox, fail-closed on empty stdout, is **a measurement of the
single-family risk carried to 2026-11-17, not a mechanism.**

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The founder's promotion disagrees with the nominated cell in 3 rounds | the findings-only panel, one seat, Claude |
| A rung ≥ 2 done-test needs a judgement no command can make | the panel becomes an input to `select.js` rather than a report |
| One `gemini -p` run from the harness returns non-empty findings on stdout | the second family becomes a real seat; empty stdout keeps resolving `unresolved` |
| The second pack family ships a non-code artifact | `verdict.mjs --subject-kind artifact` with the test pinning the two kinds apart |
| A variation round exceeds 8 candidates | blind pairwise with order randomisation and the swapped twin |
| The first rung-2 threshold is written with a denominator | the power calculation in the resolver; below threshold → `unresolved`, counted |
| 3 consecutive months of `no_data` on one venture's register | the run is reported as a finding **about the instrument**, and `AUDIENCE.yml` (§15) becomes the read |

**Would have to be true.**
1. **The world answers**, so outcomes are readings rather than `no_data`. If false, every rung above 1 is
   aspirational and the ladder should say so out loud. **Measurable in 30 days — partially**: the ratio over
   the first five exposures is suggestive and must be reported as suggestive.
2. **A deterministic oracle covers enough artifact types to be the first stage.** **Measurable in 30 days**:
   the page oracle depends on Playwright, which is `[measured]` failing across two scopes and is fixed early.
3. **A second model family is reachable from the harness.** **Measurable in 30 days**: one `gemini -p` run.

**grafted_from.** picture §2/08, §6 rows 3, 11, 14 · flywheel §2/08 · founder §2/08 · machine §2/08 · frame §8 ·
catalogue C1 C8 C17 C18 C19 C20 C22 C38 W1 W2 A1 T3 · binds **D6 D7** · Decision 1.

---

## 09 · Control & safety

**At full scale — what it IS.**
Safety is the absence of a string, not the presence of an instruction. **Three rings, distinguished by
credential and argv, never by prompt.** A ring-0 maker cannot exfiltrate because there is no key in its
environment and no sending tool in its argv; it cannot be argued into publishing because `mcp__ayrshare__post`
is not a string in the process. Injection still works — a fetched page can absolutely convince a maker to write
a malicious file — **but a file is inert until the mouth acts on it, and the mouth requires a warrant naming
that file's hash.**

| ring | what it holds | count at night | what it can lose |
|---|---|---|---|
| **0 · makers** | `Read Write Edit Bash Glob Grep`, one worktree. No network, no credential in env, no MCP | 8 `[illustration]` | its own worktree |
| **1 · readers** | network read plus credentials read-only **by the vendor's construction** | 2–6 `[illustration]` | nothing; it cannot write |
| **2 · the mouth** | every outbound credential, single-threaded, **no model in the process** | exactly 1 | bounded, and the bound is printed |

Ring 1 is where the vendor narrows for free: a Stripe restricted key, a fine-grained PAT, a read-only MCP
endpoint, a scoped service account. **Where no read-only credential exists, the hand is not a ring-1 hand.**

**Risk has three axes on one classifier**, and there is never a second implementation, because this repo has
already paid to learn what two deciders cost. `scripts/lib/classifier.js` computes `path` (what it touches),
`reach` (`local · outbound-read · outbound-write · spends · speaks-as`) and **`rate`** (how much, how often, in
what window). **Effective tier is the max of the three.** Floors are data in `.claude/qa-tier-floor.yml`, never
constants in code.

Anything carrying `blast_radius: stranger|public` or `reversible: no` is `blocking-human` **by type, not by
policy**. A `kind: human` gate carries no `run:` key and writing one is refused at schema time, so **no mode,
no flag and no chain of reasoning can clear it** — which is the property that makes it safe to leave one
standing overnight.

**Three kill switches, none of them in a prompt**, and they stop different things on purpose: `launchctl
bootout gui/501/ai.agentvibe.tick` removes the scheduler; `touch ~/.agentvibe/STOP` is a file checked first at
every dispatch and reachable from a phone, **and if the check itself errors the dispatch refuses**;
`STEER.md`'s `stop:` halts at the next durable artifact rather than the next token.

**Maximum damage on the worst possible night is a number the founder sets and the balcony prints**, computed as
the sum of outstanding warrant caveats: *"tonight the machine may spend $X, publish to N accounts, email M
named humans and deploy K previews."* The value of that sentence is not that the numbers are small; it is that
they are **numbers**, they appear where the founder already looks, and they are edited in a file in daylight
rather than argued with at 3am.

**This territory owns refusal; §16 owns granting.** The warrant appears here only as an object the mouth
**verifies and refuses against**, and the eight checks it performs in order are specified once, in Map 5.
Minting, attenuation, expiry, audit, widening and revocation are §16's, and are not described here.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/lib/classifier.js` | the one risk decider, three axes | harness · `pack.mjs`, `tick.mjs`, `qa.js` |
| `.claude/qa-tier-floor.yml` | floors as data, including `reach_floors:` | founder · `classifier.js` |
| `.claude/gates.yml` | gate declarations; `kind: human` carries no `run:` | founder · `check-gates.mjs` |
| `~/.agentvibe/STOP` | the kill file, `touch`-created | founder or phone · every dispatch, first |
| `STEER.md` `stop:` | the andon cord, halts at next durable artifact | founder · `tick.mjs` |
| `.claude/hooks/pre-tool-use.sh` | layer two, the only blocking hook (`exit 2`) | unchanged · the runtime |
| `bin/mouth.mjs` | ring 2, eight checks, **no model** | harness · `outbound.q`, `WARRANTS.jsonl`, `people.yml` |
| `policy/rates.yml` | per-hand hour/day/night ceilings | founder · mouth, `pack.mjs` |
| `policy/humans.yml` | the named-human register | founder · mouth |
| `scripts/authority.mjs` | prints tonight's maximum damage | harness · balcony, briefing |

**Enforced by.**

| rule | mechanism |
|---|---|
| A maker cannot publish, send, spend or contact | **argv absence** — the tool name is not a string in the process. `pack.test.mjs` fails any argv containing a denied name |
| A maker cannot reach a user-scope MCP server | `--strict-mcp-config`, **`[measured]` 2026-09-02**: user-scope servers are *absent*, not denied |
| A denied built-in tool is absent | **`[measured]` 2026-09-02**: `--disallowedTools Bash` → child reports `BASH_UNAVAILABLE`, exit 0, `is_error: false`, $0.088 |
| One classifier, never two | `classifier.test.mjs` reach cases · refusal 10, `reopen: never` |
| Effective tier is the max of three axes | `classifier.test.mjs` — a `local` path with `reach: spends` must tier `irreversible` |
| An `irreversible` pack with no human gate cannot compile | `gates.test.mjs`; the tick's gate step refuses |
| A `kind: human` gate cannot carry `run:` | **schema refusal** in `check-gates.mjs`; `gates.test.mjs` |
| STOP is checked first, and an erroring check refuses | `loop.test.mjs` |
| A second layer exists under the argv | `pre-tool-use.sh` exit 2. **`[measured]` true for `Write` under `claude -p`, 2026-09-02**; the Bash path is measured from a terminal or launchd, never from inside a session |
| Foreign content narrows the grant | **`WISH`** at the taint-flag level. The *argv* leg is physics and is built: a fetch enters only the `orient` grant, which holds no `Write`, `Edit`, `Bash` or outbound tool. The stamp that survives into the artifact is the wish |
| Content arriving by a path the wrapper does not mediate is tainted | **`WISH`**, and stated as the known hole: nothing notices |
| Tool matching on structured input rather than the command string | **`WISH`** — `( npx --version )` already defeats the string matcher `[measured, this repo]`. Becomes a mechanism when the hook reads `tool_input` |

**Year one — the slice.**
The seam is **argv absence plus `pre-tool-use.sh` exit 2, untouched**. Every other hook is telemetry: Stop,
SubagentStop and SessionEnd registered for rows only, in the same founder settings edit as `budget-guard.js`.
No `policies.yml` — a registry whose handlers cannot refuse is enforcement-shaped prose. `classifyGrant({paths,
reach})` lands with floors as data; **every pack is `reach: local`, so the `outbound-approval` gate gets its
caller before any hand exists.** The rate axis exists in its degenerate form: `usd_per_day: null` and
`pack.mjs` refusing to compile `reach: spends` while it is null, which **is** the full-scale mechanism of
"refuse when the meter is unreadable", read at the only value it can currently hold. `warrant_kind:` is a
declared-enum label on the pack schema (`none | standing | morning`), read by nothing, refused if not in the
enum — a tested home for `artifact_sha256`, `not_before` and an attenuation chain, bought for one line and one
test (*founder's choice 4*). The 3am never-list stands: never publish, send, spend, contact, merge, or edit
`TASTE.md`, `MISSIONS.yml` intent, `settings.json`, workflows or a plist. **The residual eight are accepted in
writing** — the sandbox is not containment · `Bash` is general · no reasoning control survives injection · the
verdict is hash-bound and not signed · review is single-family · a policy file is a file · a human gate stops
overnight work · the founder is a single point of failure — and the first of them is the one to keep saying:
**the sandbox is a guardrail against accident, not containment against the agent.**

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `EXPOSURES.yml` shows the founder performing the same outbound act by hand 3× | the `send` verb reopens for that one act; the five-part hand admission test (Map 4) applies |
| The first `reach: outbound-write` pack is proposed | run `grep -rn 'reach' scripts/loop/ packs/` and count the deciders. **One file → the warrant is a small addition. Two → it is a rewrite** |
| The first outbound hand is admitted | ring 2 becomes a process: `bin/mouth.mjs` with its eight checks, and `policy/humans.yml` gets its first row |
| The founder writes a non-null `usd_per_day` in `LIMITS.yml` | the rate axis becomes a table keyed on (venture × hand × day), read at argv compile time |
| A fourth distinct refusal is needed at `tool_call` | the handler registry reopens — and not before, because three controls did not need a fourth thing |
| The first fetched body needs to reach a producing context | it does not. `reopen: never`. The mediated form is a fetch into a no-Write argv, which already exists |
| Any hook is observed matching a command string that `( … )` defeats | matching moves to structured `tool_input` |

**Would have to be true.**
1. **`--allowedTools` produces absence, not denial, on every path — built-in, MCP, and under launchd.** If
   false, every "safe by construction" claim is denial in the costume of physics, the rings collapse into one,
   and the honest posture is that nothing runs unattended holding any credential. **Measurable in 30 days, and
   it is the cheapest measurement in the document.** Half is `[measured]` true already; the unmeasured half is
   H2, what a dispatched process can actually *touch*, where the precedent finding was a silent no-op rather
   than an error.
2. **Authority stays computed in exactly one place.** **Measurable in 30 days**, trivially: count the deciders.
3. **A process with no model can hold the credentials** — every outbound hand has a call shape checkable
   without reasoning: a target, a hash, a recipient, a count. Not measurable in 30 days, and it does not need to
   be: **the founder is the mouth in year one**, which is exactly why this is deferrable.

**grafted_from.** picture §1 (the physics line, the process list), §2/09, §6 rows 2, 5, 10, 13 · machine §5.1,
§5.2, §5.4 · founder §2/09 · flywheel §2/09 · frame §9 · catalogue R1 R2 R3 R4 R5 R6 H3 H4 RT3 S3 A5 A6 · binds
**D2 D3 D6 D9 D10**.

---

## 10 · Surfaces

**At full scale — what it IS.**
**One queue, not seven views.** Three renderers sit over one event log — founder, operator, auditor — and a
test asserts all three render from the same query, because a company whose cost figures come from two pipelines
that disagree, with a third richer source nobody reads, has three numbers and no number.

The founder's renderer prints **goal-sized rows, one line each, every row carrying `say:`** — ≤ 15 words, no
paths, no hashes — **written at emission by the thing that knew what happened.** Voice reads a field; there is
no model between what happened and what the founder hears. A queue of decisions, never a dashboard of activity:

```
RELEASES · 6 [illustration]        night of 11→12 Sep · $41.20 · 0 interruptions · rope 41%
 1 Pinefall  returning-user surface — two finalists, pick one     [A] [B] [neither]
 2 Corvid    essay "The cost of being early" — ready to publish   [go] [hold] [edit]  fuses 18:00 → hold
 3 Pinefall  pricing page copy: 3 words                           [go] [no]           fuses 20:00 → no
 6 Lantern   invoice #0091 drafted, £4,800, unsent                [send] [edit] [hold] NEVER fuses
BLOCKED · 2   SHELF · +14   ASKS · 1   NEXT · m-8802 instead of m-8814 (why: ⏎)
```

**Four verbs with deliberately unequal yields**, and the inequality is the design:

| verb | what it leaves behind | yield |
|---|---|---|
| **promote** | a preference pair — two artifacts, the pick, one sentence of why | **highest.** Attention converted into a reusable calibration example at zero marginal cost |
| **annotate** | a line in `TASTE.md` | high, and rare |
| **approve** | a disposition on one exposure | low. It gates one artifact and teaches nothing |
| **redirect** | a steer on a named task | low, **and a symptom** — a high redirect rate is a brief defect, not a worker defect |

So the surface **shows the round, not the pick**: the nominated cell plus up to three others ordered by archive
distance, each with a ≤ 60-word pitch. A founder choosing between three produces an asset; a founder approving
one produces a signature. `promote` is built to be **cheaper** than `approve`.

A decision card is one shape and **reversibility is its first line, before the recommendation**, because a
founder reading fast reads the first line:

```
CARD  v3-billing-live · irreversible · fuses Thu 09:00 → DEFAULT: do not ship
REVERSIBILITY   Money moves. A refund is possible; a chargeback is not. Not revertible by git.
THE CASE FOR    [≤4 lines, each sourced]        # written by a worker with no sight of the other
THE CASE AGAINST[≤4 lines, each sourced]        # written by a worker with no sight of the other
WHAT WOULD CHANGE MY MIND   <arithmetic where priority is computed, never a model's opinion>
COST OF WAITING $0/day. Nothing downstream is blocked.
YOU DECIDE BECAUSE  blast_radius: financial. No configuration can clear this one.
```

**Every fusable row carries a fuse: a deadline and a stated default that fires on silence, and the default is
always the reversible branch.** Silence is then recorded as a decision with reason `fused`, never as an unread
item. **Irreversible, financial and first-contact classes carry no default and cannot fuse** — the schema
refuses one. This is the only mechanical answer anyone offered to the frame's own named weakest point: a queue
with no fuse is a queue nobody has to work.

The briefing has four sections **always in one order** — *what changed · what is blocked · what needs you ·
what I would do next* — with the money line first. Each may say "nothing", and **"nothing" is spoken, because
silence is indistinguishable from failure.** Explanation is a **replay, not a generation**: `explain.mjs
<task>` reconstructs the chain from rows and invents no connective tissue, and **an explanation with a hole
says so** and prints `[no record]`. Early on most explanations are mostly holes, which is the surface reporting
honestly that the instrumentation is thin — exactly what you want to know before you trust it.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/balcony.mjs` | the founder renderer over `events.jsonl`, grouped by task id | harness · founder; writes a `balcony.open` row per invocation |
| `scripts/render/{operator,auditor}.mjs` | the other two renderers, same query | harness · operator, auditor |
| `ventures/<slug>/BRIEFING.md` | four sections plus the money line, generated | briefing job · founder, `say` |
| `scripts/explain.mjs <task>` | replay; `[no record]` at a gap | harness · founder |
| `scripts/promote.mjs <task> <cell>` | the highest-yield verb | **sole writer** of `taste/PAIRS.jsonl` |
| `scripts/expose.mjs <task> --url --check-on` | the approve verb; row 1 of the authority record | harness · `EXPOSURES.yml` |
| `scripts/steer.mjs <task> "…"` | the redirect verb; refused without a task id | founder · `STEER.md` |
| `say:` column on every row | the spoken form, minted at emission | every emitter · voice, balcony, briefing |
| `default_if_unanswered:` on every fusable block | the fuse | worker authors · `tick.mjs` fires it |

**Enforced by.**

| rule | mechanism |
|---|---|
| No row without a task id | `balcony.test.mjs`; `check:taskid` fails any row after the cutover lacking `task` |
| Three renderers, one query | `renderers.test.mjs` — all three must resolve from the same query function; divergence fails |
| `say:` is ≤ 15 words, no `/`, no 7+ hex run | the `say` lint, a suite step |
| The briefing has all sections, in order, "nothing" permitted | `briefing.test.mjs` — a missing section fails |
| `explain.mjs` never bridges a gap with narrative | `explain.test.mjs` asserts `[no record]` on a synthetic hole |
| Only `promote.mjs` writes `PAIRS.jsonl` | a single-writer test over the path |
| `redirect` without a task id is refused | `steer.mjs` argv check |
| A fusable block without `default_if_unanswered:` is refused | **schema refusal**, `missions.test.mjs` |
| An irreversible, financial or first-contact class carrying a default is refused | **schema refusal**, `missions.test.mjs` |
| Reversibility is the card's first line | `card.test.mjs` on the rendered card |
| The case for and the case against are written by workers with no sight of each other | **`WISH`** at full scale — it is a dispatch property, and nothing checks that two dispatches did not share a context. Becomes a mechanism when the two are minted as separate task ids and the check is that neither's transcript contains the other's artifact hash |
| The balcony is actually opened | its own done-test: **opened twice unprompted, more than 48 hours apart**, read from `balcony.open` rows |

**Year one — the slice.**
Terminal only. `npm run balcony` prints goal-sized rows; four verbs are four CLI acts; `say:` lands **in the
same change as the task id**, because a row emitted without it can never be spoken and backfilling rewrites
every emitter (*founder's choice 7*). The 08:00 briefing writes `BRIEFING.md` with the money line first and the
four sections, and `say` speaks its first 200 words. `explain.mjs` replays with `[no record]`. **The fuse lands
in the block schema**, with the `fused` disposition as a fourth alongside cleared, escalated and waived
(*founder's choice 2*). The phone has exactly one verb, `touch STOP` via a Shortcut. A web UI, voice input and
further notifications are refused, protecting an attention record that reads seven balcony views with one that
acts and eleven mockups unlooked at. **The balcony's own done-test runs in month one**, and if it fails the
approve tap moves to a surface the founder already opens — a `gh pr` comment or the terminal prompt — before
month two. A first `BRIEFING.md` writer over whatever rows exist is handed to the founder inside the first
week, so the assumption everything rests on is tested before the rest of the month is spent on it.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The balcony passes its own done-test twice over | the operator and auditor renderers, and the test that all three share one query |
| The founder gives the same instruction twice in a form the terminal could not take | the next surface, chosen by what that instruction was — not a web UI by default |
| The first variation round produces > 3 candidates the founder wants to compare | the round view: nominated cell plus three, each with a ≤ 60-word pitch |
| The first `blocking-human` card on an irreversible class | the full card shape, reversibility first, both cases argued separately |
| Any card class fuses 11 times running with zero reversals | the machine proposes retiring that class as a card, showing all 11 instances |
| Any card class is reversed after fusing, once | **that class can never be auto-retired.** Reversals are counted separately from non-answers |
| `notify_per_day` is hit on 3 days in one week | the cap becomes a meter in `monthly.mjs`, and `DAY.yml` (§17) follows |

**Would have to be true.**
1. **The founder looks, and looking is cheap enough to keep doing.** All three visions and the frame rank this
   first, and the **`[measured]` base rate of this founder looking is zero**. If false, everything collapses,
   and the correct machine is smaller and stranger: it stages, it does not ask, it keeps no register and no
   rungs, and its value is entirely in the shelf. **That is a real design and it is not this one, and a failure
   here should stop the vision rather than be worked around.** **Measurable in 30 days**, twice: the day-8
   numbers recorded without chasing, and `BRIEFING.md` opened twice unprompted 48 hours apart.
2. **A fused default is genuinely the reversible branch**, class by class. Not measurable in 30 days; the guard
   is that the classes which may never fuse are named by type.
3. **`say:` written at emission is better than a summary written at render.** Not measurable in 30 days.

**grafted_from.** picture §1 (07:52), §2/10, §3 row 10, §7 rows 2, 7 · founder §0 (the Deck), §2/10 · machine
§2/10, §0.4 · flywheel §2/10 · frame §10 · catalogue V1 V2 V5 E1 E2 E3 E4 E5 C37 W5 · binds **D1** ·
Decision 5.

---

## 11 · Runtime

**At full scale — what it IS.**
One always-on host that is not the founder's laptop, one cloud twin, and **the laptop is a client**. This is
the one place all three visions depart from Decision 4 and all three say so plainly. **It is a purchase, not a
redesign**: the same `tick.mjs`, the same plists, the same paths, because the loop was always crash-only — read
state from disk, take one move, write, exit; recovery is the next tick.

**`launchd` `KeepAlive` supervises the long-lived processes and never the tick.** The mouth, the minter and the
bailiff are long-lived and are kept alive. The tick is a body that exits, so there is nothing to keep alive,
and **a line-1 crash under `KeepAlive` relaunches forever** against a circuit breaker that the reference
implementation everyone copies does not actually contain. Supervision is dual-layer — an inner watchdog that
kills a hung call and records it, an outer daemon that restarts a dead loop — and **neither supervises the
other's failure, which is the point.**

**Every move declares `idempotent: true|false` with no default**, because a default is silently wrong for the
dangerous half. A non-idempotent move takes a lease that survives its death and **is never auto-restarted; it
escalates.**

Models are pinned by id and chosen by job, never globally: Haiku for probes, oracles and triage; Sonnet for
MAKE; Opus for a genuinely novel field and for synthesis; a second family for judge seats and nothing else.
**The model is recorded on the row, because a done-test passed on a cheaper model is a different fact.**

**An absent night is reported as absent, never as quiet.** If both hosts die, the morning queue says *"nothing
ran: unreachable since 01:14"* — Rule 10 applied to the loop itself, and the difference between a machine that
had nothing to do and a machine that was dead.

The loop lives beside the control plane and never inside it. **The zero-exception ban on shell calls under
`mission-control/server/` survives untouched**, because it closed three RCEs.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `~/Library/LaunchAgents/ai.agentvibe.tick.plist` | `caffeinate -i node <abs>/scripts/loop/tick.mjs`, `StartInterval 300`, **no `KeepAlive`** | founder installs · launchd |
| `…ai.agentvibe.watch.plist` | `WatchPaths [STEER.md, ~/.agentvibe/STOP]` → fires a tick | founder · launchd |
| `…ai.agentvibe.briefing.plist` | `StartCalendarInterval 08:00`; also runs `claude mcp list` | founder · launchd |
| `~/.agentvibe/tick.lock` | `openSync 'wx'`, pid inside, stale after 30 min | `tick.mjs` · `tick.mjs` |
| inner watchdog | a node spawn timer sending SIGTERM at `timeout_s` — macOS has no `timeout` binary `[measured]` | `tick.mjs` · outcome `timeout` on the row |
| `sentinel` (later stage) | `launchd KeepAlive` over mouth, minter, bailiff, **never over the tick** | founder · launchd |
| `~/.agentvibe/{tasks,events}.jsonl` | `session_id`, `total_cost_usd`, `num_turns`, `stop_reason`, model id | `logEvent`, `tick.mjs` · balcony, monthly, brakes |
| `scripts/probe-headless.mjs` | the runtime facts, as a suite step | harness · the build |

**Enforced by.**

| rule | mechanism |
|---|---|
| No `KeepAlive` on the tick | `plist.test.mjs` fails the presence of the key |
| Absolute paths and declared log paths in every plist | `plist.test.mjs` |
| Two concurrent ticks produce one move | `tick.test.mjs` via `tick.lock` |
| A hung call is killed and recorded | the inner watchdog; outcome `timeout` on the row |
| A truncated move is never `done` | `return.test.mjs` — `done` with a truncating `stop_reason` becomes `truncated` |
| Compaction is designed out | the process exits. A move that would need it records `truncated`, and the founder splits the leaf |
| A flag that changes meaning fails a build rather than a night | `probe-headless.mjs` as a suite step |
| The control plane cannot spawn a shell | `crosscheck.test.ts`, zero exceptions |
| The sandbox is armed and stays armed | `npm run test:sandbox` fails if `enabled` or `failIfUnavailable` is flipped |
| A non-idempotent move is never auto-restarted | **`WISH`** until the field exists. Becomes a mechanism the day `idempotent:` is added with no default and the dispatcher reads it |
| An absent night is reported as absent | **`WISH`** — it needs a liveness row the tick writes and the briefing reads. One row and one branch |
| The phrase 24/7 appears in no artifact until `pmset -g` and one measured overnight are on disk | **`WISH` by discipline, and it is the highest-compliance wish here.** It becomes a mechanism as a one-line grep in the suite over `docs/**` and `.claude/**`. **Two occurrences stand and are the grep's allowlist**: the founder's own words in the census (Part I §1b) and the Unlocks cell of Stage 0's eleventh landing, both preserved verbatim as record. Every new artifact is bound by the rule |

**Year one — the slice.**
**The Mac, and the founder deferred the host on 2026-09-02 until the first measured overnight**
(*founder's choice 6*). Three plists: tick under `caffeinate -i` at `StartInterval 300` with no `KeepAlive`,
watch on `WatchPaths`, briefing at 08:00. `tick.lock` with a 30-minute staleness. The inner watchdog is a node
spawn timer, because macOS has no `timeout` binary `[measured]`. `tick.mjs` creates the move's worktree itself,
unsandboxed, because **the armed sandbox cannot complete `git worktree add` anywhere** `[measured 2026-08-24:
exit 128, 32 denials across `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`]`. Models pinned by
`prompt-standard.test.mjs`: `claude-haiku-4-5` for probes and oracles, `claude-sonnet-5` for MAKE,
`claude-opus-5` for a genuinely novel field, `gemini` from the harness only. **Lid shut, nothing runs, and the
frame says so.** The sentence the company is allowed to say is *"wakes on a schedule, works, sleeps"*, and it
may not say more until `pmset -g` and one measured overnight are on disk. **First unattended run is daytime,
founder present, `reach: local`** — 24 hours of supervision before any unsupervised hour.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `pmset -g` plus one measured overnight are recorded | the sentence the company may say about its night is rewritten to match the measurement, and only then |
| That measurement shows the usable night below the length one mission needs | the always-on host is purchased. **Same `tick.mjs`, same plists, same paths**; the balcony becomes a client that reads files |
| The host exists and has run 30 days | the cloud twin, as failover only |
| The first long-lived process exists (the mouth) | `sentinel`: `launchd KeepAlive` over it, with the outer circuit breaker written before the process it supervises |
| The first non-idempotent move is authored | `idempotent:` with no default, the lease, and the refusal to auto-restart |
| `probe-headless.mjs` shows process startup dominating a five-minute cycle | `KeepAlive` reopens for the tick — **and only then**, which is the one reopen refusal 14 permits |
| A second lane runs | per-lane locking and per-lane stall scoping via `tasks.jsonl` |
| Both hosts are unreachable for one tick interval | the absent-night row and the briefing branch that prints it |

**Would have to be true.**
1. **An always-on host is affordable and the loop is portable to it.** **Measurable in 30 days**: `pmset -g`
   and one measured overnight. If false the picture does not die, it stops being about the night: the night is
   between zero and eight hours and a mission spanning two nights spans an unknown gap.
2. **PreToolUse and Stop hooks fire under `claude -p`, including under launchd.** **Measurable in 30 days**,
   and half is `[measured]` true for `Write`. The Bash path must be measured **from a terminal or from launchd,
   never from inside a session** — a child spawned inside a sandboxed session cannot start its own sandbox
   `[measured 2026-09-02: EPERM on the socket, $0.096]`.
3. **A crash-only body is genuinely portable.** Not measurable in 30 days; it is tested by the move itself.

**grafted_from.** picture §1 (the process list), §2/11, §6 rows 7, 10 · machine §2/11 · founder §2/11 ·
flywheel §2/11 · frame §11, CONFLICTS RESOLVED (KeepAlive, and the honesty rule about the night) · catalogue
RT1 RT2 RT3 S4 · binds
**D10** · Decision 4.

---

## 12 · Self-improvement

**At full scale — what it IS.**
**`scripts/monthly.mjs` is the only self-improvement mechanism in the company, and it is a report, not a
loop**, because every studied system's self-improvement loop was prose that nothing checked ran. It is a suite
step, it always exits 0, and it always prints. What it prints:

- **Last-use per governed artifact**, keyed on task id: skills read, packs dispatched, hands called, check
  steps run, renderers opened. **Zero calls in 90 days computes a retirement candidate** — archival with a
  resolvable stub, never deletion.
- **Founder interventions per surviving exposure**, `undefined` until the denominator is non-zero, **paired
  with the engagement count**, so a fall caused by fewer surviving artifacts cannot read as a win.
- **Archive coverage and promotion rate**, and the archive's own falsifier.
- **Corrections mined from transcripts by regex, not by a model** — a mechanical detector cannot decide that
  something was unimportant, and a model asked to will. Candidates the founder confirms into `TASTE.md`, or
  counts as `none`.
- **Every standing refusal with the command that reads its reopen trigger, and that trigger's current
  reading.** This is the line that makes every other refusal in the system survivable. A refusal with a
  countable trigger and a monthly reader is a decision that expires on schedule; a refusal without one is a
  permanent opinion in a mechanism's clothes.
- **The unspent question budget and the waiver count**, both reported as findings about the machine. Three
  waivers on one block is a decision being avoided.

```yaml
# .out-of-scope/<date>-<slug>.md — frontmatter. The file that makes a refusal a mechanism.
refused:     "any publish, send, spend or contact tool in any argv"
protects:    "the act git revert cannot undo"
reopen_when: "EXPOSURES.yml shows the founder performing the same outbound act by hand 3 times"
reading:     "node scripts/count-hand-acts.mjs --act publish"   # a command, never a description
```

**Nothing merges without a caller in the same diff.** Not a plan to wire it — the wire. This is the one
mechanism that *prevents* the defect that defined the 2026 system rather than detecting it afterwards, and it
matters because six of ten things the founder asked for already existed, connected to nothing, and every other
cure in the building is a detector that runs after the fact.

Everything carries `retire_on`, **staggered at creation**, so a quiet month does not produce fifty simultaneous
decisions. A post-mortem ends in one row with a **Mechanism** column, tags from a closed enum (wrong target ·
missing capability · unclear brief · hallucinated fact · budget exhausted · external block · tooling defect),
and **`none` is permitted and counted**, so a class with three `none`s escalates by the count rather than by
someone remembering. Patterns promote at three independent sightings **to candidacy, never to an automatic
write.** A/B testing of the company's own prompts stays refused at this volume, because an underpowered
comparison read as a result is worse than no comparison.

**Procedure is a depreciating asset; evidence and taste are appreciating ones.** Every model release writes
down the value of accumulated step lists, templates and rubrics, and writes *up* the value of accumulated
exemplars, outcomes and preference pairs. The mechanism already exists and needs only a new target: the schema
predicate refusing `steps:`, `how:`, `method:` and `implementation:`, pointed at packs, briefs and field notes
alike.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/monthly.mjs` | the report; a suite step, always exits 0, always prints | harness · founder |
| `.out-of-scope/<date>-<slug>.md` | one refusal per file with `reopen_when` and `reading` | any agent refusing · `monthly.mjs` |
| `scripts/mine-corrections.mjs` | ~50-line regex classifier over transcripts | harness · `monthly.mjs`, founder |
| `scripts/check-registration.mjs` | extended with last-use; the retirement computation | harness · `monthly.mjs` |
| `retire_on:` on every governed artifact | staggered sunset | author · `monthly.mjs` |
| post-mortem row with a `Mechanism` column | closed enum, `none` counted | any agent · `monthly.mjs` |
| the `steps:`/`how:`/`method:`/`implementation:` predicate | the anti-procedure brake | `schema-lint.js` · every schema it is pointed at |

**Enforced by.**

| rule | mechanism |
|---|---|
| The report runs and prints | `monthly.mjs` is a suite step; the run fails if any `.out-of-scope` file lacks `reading:` |
| A trigger whose command fails prints `unresolved`, never `pass` | `monthly.mjs`; Rule 10 |
| Retirement is computed, never proposed | `check-registration.mjs` last-use; zero calls in 90 days |
| Nothing is deleted to meet a cap | `evict-memory.mjs` refuses; archival leaves a stub under the original heading |
| Corrections are mined by regex, never by a model | the script holds no model call; a positive control on every extractor so format drift cannot silently take a number to zero |
| A `none` mechanism is counted, not waved through | the closed enum; three `none`s on one class escalates by count |
| A pattern may reach candidacy but never an automatic write | `monthly.mjs` prints candidates; no path writes from them |
| Procedure cannot accumulate in a pack, a brief or a field note | **schema refusal** — the existing predicate, pointed at each |
| Nothing merges without a caller in the same diff | **`WISH` at full scale, and it is the most consequential wish in this file.** The existing `check-registration.mjs` dead-path check is the detector half. The *preventive* half needs a diff-scoped check in CI that a newly added governed artifact has a caller **in the same diff**, which nothing implements today |
| A/B on the company's own prompts stays refused | refusal, `reopen: none` — under-powered at this volume |

**Year one — the slice.**
`monthly.mjs` runs on day 30 and monthly thereafter. It prints the D15 ratio (harness versus venture session
files, through `classifier.js`), X2 last-use per governed artifact with the 90-day retirement candidate, SI4
interventions per surviving exposure paired with the balcony-open count, archive coverage and promotion rate,
corrections mined by regex, and **every `.out-of-scope` trigger with its current reading**. Post-mortems carry
the Mechanism column with the closed enum and counted `none`. SI2's promotion at three sightings is refused,
reopening when one approach appears in three missions' rows. SI3's A/B is refused with no reopen. D8's
unification of the four birth-certificate checks is refused: **keep the telemetry, refuse the refactor**, and
unify when a fifth instance is wanted rather than writing one to justify the abstraction.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `monthly.mjs` has run 3 times | the retirement queue is acted on for the first time; archival with a stub, never deletion |
| One approach appears in three missions' rows | SI2 promotion to **candidacy** reopens |
| A fifth birth-certificate check is wanted | D8's unification into one `hasCaller`, and not before |
| The first governed artifact merges with no caller | the diff-scoped caller check in CI; the wish becomes a mechanism |
| Any `.out-of-scope` file's `reading` command fails twice running | that trigger is `unresolved` and the refusal is escalated to the founder as un-monitored |
| A failure class reaches three `none`s | it escalates by the count, into the Friday reckoning |
| A model release changes what MAKE produces at fixed prompt | the depreciation pass: every accumulated rubric and step list is re-valued and the `steps:` predicate is pointed at one more schema |
| The archive has 30 days of cards and zero founder promotions of a non-nominated cell **and** zero ships from one | `archive/` is deleted; `distance.js` and `select.js` are kept. **No round having run is itself the finding** |

**Would have to be true.**
1. **A monthly report the founder reads is enough to make refusals expire on schedule.** This is the same
   assumption as §10's, one step removed, and it inherits its risk. **Measurable in 30 days**: `monthly.mjs`
   runs on day 30 and either is read or is not.
2. **A regex classifier catches enough corrections to be worth its positive control.** Not measurable in 30
   days; needs volume.
3. **Retirement by zero-calls-in-90-days does not retire something load-bearing but rarely called.** Not
   measurable in 30 days. The guard is that retirement is archival with a resolvable stub, so the failure is
   recoverable rather than terminal.

**grafted_from.** picture §2/12, §5 (the anti-flywheels), §6 · flywheel §2/12 · founder §2/12 · machine §2/12 ·
frame §12, §17 (D8 row) · catalogue SI1 SI2 SI4 X1 X2 X3 M1 M2 N4 · binds **D8 D15**.

---

## 13 · Economics

**At full scale — what it IS.**
Three files, and each holds one constraint: **the rope holds the token window, the rails hold the money, the
limits hold the clock.** The binding constraint changes across the company's life and **naming the change is
the point**: in year one it is a rolling token window shared with the founder, so the mechanism is a reserved
fraction; later it is dollars, so the mechanism is a table of rates. A design that hard-codes the window as
*the* constraint gets rebuilt on the day billing changes.

**The rope never competes with the founder for their own quota.** At the ceiling a safelist still permits
**landing** work — commit, push, `npm run check`, PR, ledger and session writes — because only *starting* new
work is blocked. A machine that cannot land what it already made converts a budget ceiling into lost work.

A hard cost ceiling **downgrades the model rather than stopping the work**, and **fails closed when a model has
no catalogue price** rather than scoring that spend at zero. The model used is recorded on the artifact,
because a done-test passed on a downgraded model is a different fact.

Rates are per **(venture × hand × day)**, read at **argv compile time**, and **the compiler refuses when the
meter is unreadable** — Rule 10 applied to money, and the reason autonomous spend is defensible at all:

```yaml
# policy/rates.yml
pinefall:
  vercel.promote: {per_day: 12, per_night: 4, usd_per_day: 0}
  ads.spend:      {per_day: 1,  per_night: 0, usd_per_day: 40, meter: adwords_ro, max_meter_latency_s: 3600}
```

`ventures/<slug>/PL.md`, monthly, machine-generated by `scripts/pl.mjs`: model spend from `tasks.jsonl` ·
outbound spend from the rails · **revenue read from Stripe as a claim with a `valid_until`, never typed by a
human** · exposures made · exposures at rung ≥ 2 · cost per surviving exposure · founder interventions per
surviving exposure. **An unreachable instrument reads `unresolved`, and `unresolved` months are counted.** Rung
4 is the strongest evidence this company will ever have, and a rung-4 reading with human provenance is not one.

**Two numbers drive allocation and neither can be gamed by working harder.** **Cost per surviving exposure**,
printed `undefined` at a zero denominator and never a flattering low number — a month of cheap runs producing
nothing has an undefined cost per surviving exposure, never an excellent one. And **cost to falsify**: the
price of the company's option on being right, which is what makes killing a venture cheap.

Every dispatch records **`instead_of:`**, free when priority is computed, which makes what the company
systematically never gets to visible after six months instead of invisible forever. Portfolio shares carry a
floor and a ceiling reviewed on a cadence, because continuous reallocation is how the loudest venture wins.
**10% of the window is reserved for work with no requested outcome — spent or lost, never banked, never asked
to pay off.**

**Money in is a declared gap in this territory and is named as one.** Nothing in the fourteen covers pricing,
offers, billing, dunning, churn or cohorts, which is to say nothing covers the only rung-4 signal the company
has. The reservation: it enters as **`ventures/<slug>/OFFER.yml`** — price, terms, the dunning path, the cohort
key — read by `pl.mjs` and by the rung-4 resolver, and it lands with the first dollar, not before.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `LIMITS.yml` | rope fraction, stall hours, `usd_per_day`, `notify_per_day`, attempts | founder only, `irreversible` tier · `tick.mjs`, `pack.mjs` |
| `policy/rates.yml` | the rails: per (venture × hand × day), with a meter and a latency bound | founder · `pack.mjs` at compile time, the mouth at execution |
| `scripts/lib/usage.js` `windowUsage()` | the rope's reading, account-wide on purpose | harness · `tick.mjs` |
| `sinceLastArtifact()` | the clock brake; `unresolved` past `RETAIN_HOURS` | harness · `tick.mjs` |
| `.claude/hooks/budget-guard.js` | the registered brake, after the repair | founder registers · the runtime |
| `~/.agentvibe/tasks.jsonl` | `total_cost_usd` per task; prefix sums | `tick.mjs` · `pl.mjs`, `monthly.mjs` |
| `ventures/<slug>/PL.md` | monthly, machine-generated | `pl.mjs` · founder |
| `ventures/<slug>/OFFER.yml` | **reserved**: price, terms, dunning, cohort key | founder · `pl.mjs`, rung-4 resolver |
| `instead_of:` on every dispatch row | opportunity cost, free where priority is computed | `tick.mjs` · `monthly.mjs` |

**Enforced by.**

| rule | mechanism |
|---|---|
| The loop stops itself below the founder's share of the window | `tick.mjs` refuses to dispatch above `rope_fraction`; `usage.test.mjs` |
| A stall is measured, not guessed | `usage.test.mjs` — **a 19h stall and a 6h stall must return different values**, and past-horizon returns `unresolved` |
| Landing work survives the ceiling | the safelist in `tick.mjs`; a test that commit, push, check, PR and ledger writes are permitted at the ceiling |
| Nothing spends while the meter is null | `pack.mjs` refuses `reach: spends` while `usd_per_day` is null; `pack.test.mjs` |
| The compiler refuses when a meter is unreadable | **the same predicate, generalised.** `pack.test.mjs` — an unreadable meter is not a zero |
| A zero denominator prints `undefined` | `pl.mjs`; a test that it never prints `0` or `0.00` for cost per surviving exposure |
| Revenue is never typed by a human | `claim-source`/Stripe resolver with a `valid_until`; a check that `PL.md`'s revenue line carries a claim id |
| `unresolved` months are counted | `pl.mjs` prints the count; `monthly.mjs` carries it |
| A ceiling downgrades rather than stops | **`WISH`** in year one — EC1 is refused, reopening when a mission is killed by the ceiling twice |
| The explore reservation is spent or lost, never banked | **`WISH`** — C33 is refused in year one, reopening when the archive passes its falsifier |
| Portfolio shares have a floor and a ceiling | **`WISH`** — CY2 is refused, reopening with venture two |

**Year one — the slice.**
`LIMITS.yml` at the repo root, founder-only, `irreversible` tier: `rope_fraction: 0.6 · stall_hours: 4 ·
usd_per_day: null · notify_per_day: 3 · attempts_default: 3`. The rope refuses dispatch above its fraction of
the rolling 5-hour window, account-wide on purpose, and the safelist at the ceiling permits landing work. The
circling brake is a **clock**: hours since `lastArtifactAt()` exceeding `stall_hours` brakes and writes a row.
**The stall repair lands before `budget-guard.js` is registered**, because registration before repair is a
believed brake — the most expensive kind. The rate ceiling is the refusal itself: `pack.mjs` refuses `reach:
spends` while `usd_per_day` is null, **nothing spends in year one, and the refusal is the mechanism.** `PL.md`
is generated monthly with revenue read from Stripe as a claim landing with the first dollar, never typed by a
human (*founder's choice 5*). Cost per surviving exposure prints `undefined` while the denominator is zero.
**EC1's downgrade, C33's explore reservation, C23's boredom detector and CY2's venture shares are all
refused**, each with a countable reopen.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The founder writes a non-null `usd_per_day` in `LIMITS.yml` | money hands become discussable; the rate axis becomes a table |
| A mission is killed by the cost ceiling twice | EC1: the ceiling downgrades the model instead of stopping the work, failing closed on an uncatalogued price |
| The archive passes its own falsifier | C33: 10% of the window reserved for work with no requested outcome |
| Venture two exists | CY2: portfolio shares with a floor and a ceiling, reviewed on a cadence, never continuously |
| The first dollar arrives | the Stripe claim resolver, and `OFFER.yml` with price, terms, the dunning path and the cohort key |
| The first hand with a spend caveat is admitted | `policy/rates.yml` with `meter:` and `max_meter_latency_s:`; **above one hour of meter latency it is not a rail and the hand is not admitted** |
| Billing moves off the rolling token window | the rope is re-derived against dollars; **the file changes, the mechanism does not** |
| Cost per surviving exposure rises for two consecutive quarters on one venture | that venture becomes a wind-down candidate whether or not it is still growing |

**Would have to be true.**
1. **A rate can be enforced *before* the spend.** Some vendors expose a balance in-band; ad platforms generally
   do not expose today's spend with useful latency. If false, autonomous spend is off the table and paid
   distribution stays the founder's hand permanently. Not measurable in 30 days, **and it does not need to be:
   nothing spends in year one, which is why refusal-while-null is the honest year-one mechanism.**
2. **Revenue is readable as a claim rather than typed.** Not measurable in 30 days; there is no dollar. It
   costs nothing today and every month before it is permanently the strongest evidence recorded at the weakest
   standard.
3. **Cost per surviving exposure has a non-zero denominator within a useful horizon.** **Partially measurable
   in 30 days**: whether *any* exposure reaches rung ≥ 2.

**grafted_from.** picture §2/13, §1 (what it costs), §6 row 9, §7 rows 5, 9 · flywheel §2/13 · founder §2/13 ·
machine §2/13, §5.3 · frame §13 · catalogue EC1 EC2 EC3 EC4 C33 CY2 R5 · binds **D2 D4 D8** · Decision 8.

---

## 14 · The company itself

**At full scale — what it IS.**
Four live ventures, one in intake, and a graveyard `[illustration]`. One flagship carrying the revenue, one
media property that **is** the distribution, one experiment run falsifier-first, one services line for
cashflow. **Venture zero is the harness itself, and it gets a declared share of the window with a floor and a
ceiling like any other** — because the alternative, the harness taking everything because it is nearest, is the
exact failure of 2026, when 171 session files were about the harness and none about a customer `[measured, this
repo]`.

**Intake produces exactly three artifacts and stops**: a taste file, one mission with a falsifier, and one
approved done-test at a declared rung. **No move dispatches against a venture missing any of the three**, which
forces the founder's one unavoidable contribution to happen at the only moment it is cheap. One sitting,
machine-drafted and founder-edited. At nine intakes a year that is under six hours annually for the entire top
of the funnel `[illustration]`.

**Wind-down is a harvest, not a cleanup**, and its being compulsory is what makes it an asset rather than a
loss: stop dispatch · resolve every open claim to a disposition, with bulk `deprecate` under one shared reason
allowed and honest · write one dead-end for the venture **as a whole** · archive with a stub. **Field notes and
archive cells survive the venture and stay global**, which is the strongest argument for Decision 9's split: a
dead venture still pays. Twenty-three wound-down ventures at a median of ~$2,400, so $55,000 spent on being
wrong `[illustration]`, buys markets' worth of evidence and a functioning appetite for killing things.

A **second human** is a role with declared decision rights **per decision type**, exactly one accountable, and
a human gate names **which** human. For one founder that field is ceremony, and its entire value is making the
exception visible on the day it arrives rather than on the day after.

**A good year is not revenue up.** It is **founder minutes per week falling while exposures at rung ≥ 2 rise.**
Those two moving in opposite directions is the only definition of "the founder stopped being the bottleneck"
that cannot be faked by working harder. Revenue up, exposures up, founder minutes up is a services business
with extra steps, and it does not compound.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `ventures/<slug>/TASTE.md` | intake artifact 1; founder-only, ≤ 20 lines, `irreversible` tier | founder · MAKE prompt |
| `ventures/<slug>/MISSIONS.yml` | intake artifact 2: one mission with a `falsifier:` | founder (intent), `tick.mjs` (state) · `next.mjs` |
| the approved done-test at a declared rung | intake artifact 3 | founder approves · `check-donetests.mjs` |
| `tick.mjs` intake refusal | refuses to dispatch against a venture missing any of the three | harness · every dispatch |
| `ventures/<slug>/dead-ends/venture.md` | the wind-down harvest, one per venture | wind-down · `orient.mjs`, globally |
| `~/.agentvibe/fields/` | survives the venture, stays global | harness · every MAKE prompt in every venture |
| `decided_by:` / `who:` on every human gate | the second-human seam, ceremony at n=1 | founder · `check-gates.mjs` |
| venture zero's window share | the harness competing for allocation like anything else | founder · the allocator |

**Enforced by.**

| rule | mechanism |
|---|---|
| No dispatch against a venture missing any of the three intake artifacts | `tick.mjs` intake refusal, checked before the pack compiles |
| A mission without a `falsifier:` is refused; `none` is allowed and **counted** | **schema refusal**, `missions.test.mjs`; the count on `monthly.mjs` |
| A done-test with no `rung`, no `approved_by`, or `resolver: judge` is refused | `check-donetests.mjs` |
| A wound-down venture has no unresolved claim and no exposure past `check_on` | a suite check; `check-exposures.mjs` |
| Field notes and archive cells survive wind-down | they live under `~/.agentvibe/` and `archive/`, outside the venture directory. **Geometry, not policy** |
| Every human gate names its decider | `check-gates.mjs` requires `decided_by:` |
| The harness cannot take the whole window by being nearest | **`WISH`** in year one — D15's ratio is a *report*. It becomes a mechanism when venture shares land with a floor and a ceiling |
| A good year is measured as minutes-down and rung-2-up | **`WISH`** — both components exist as numbers on `monthly.mjs`; nothing yet asserts the direction. It becomes a mechanism as a two-line check the day both denominators are non-zero |

**Year one — the slice.**
**One venture.** Intake produces the three artifacts and stops; `tick.mjs` refuses to dispatch without them.
Second human: none, and every human gate carries `decided_by: founder`. Wind-down is specified before it is
needed. **Two first missions, answering two questions.** Outside: the founder's demand test — one real page, a
real URL, analytics, posted once, with the pass threshold **and the uninformative threshold written down
first**, and the numbers recorded on day 8 without chasing. It is a finding, not a gate. Inside: the synthetic
landing page, rungs 0 to 1, staged, never published. **Then mission 2 is real, made by the machine and
published by the founder's hand inside the thirty days, or the machine has only tested itself.** That sentence
is worth more than any mechanism in this section. **No venture work has ever run through this harness** — the
census reads 171 session files, essentially all about the harness, `ls docs/08-agents_work/sessions`
`[measured, this repo]` — and the founder's decision to finish the harness first is recorded so that it is a
choice rather than an oversight.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first venture has a rung ≥ 2 reading | **venture two.** Not before — a portfolio of unmeasured ventures is not a portfolio |
| Venture two exists | portfolio shares with a floor and a ceiling; venture zero declares its own share |
| The same intake question is asked in three intakes | the intake draft is generated, and the founder edits rather than writes |
| A venture's cost per surviving exposure rises for two consecutive quarters | wind-down candidacy, computed rather than felt |
| The first wind-down completes | the harvest checks run for real: claims resolved, one venture dead-end, stub archived |
| Someone other than the founder holds a credential this system uses | the second human becomes a role with declared decision rights per decision type |
| A human gate is cleared by someone who is not the founder | `decided_by:` stops being ceremony and starts being read |
| The harness and the ventures compete for the same window in one week | venture zero's floor and ceiling bind, and D15's ratio becomes an input rather than a report |

**Would have to be true.**
1. **Field knowledge transfers across ventures.** If false, the fields are a private diary, four ventures are
   four small companies sharing a host, and the right move is to concentrate rather than diversify. Not
   measurable in 30 days; the frame already dates its falsifier to 2026-12-02 — a field note read by a task
   outside the mission that wrote it.
2. **Mission 2 is real.** **Measurable in 30 days**, and it is the acceptance test of the whole company: an
   artifact the machine made, published by the founder's hand, with a row in the register and a `check_on`.
3. **Nothing under the company's name blows up.** One bad exposure destroys reputational capital faster than
   three years of good ones build it, and the embarrassment linter catches hygiene rather than judgement.
   **There is no good forward test**, which is precisely why this is handled by the physics line and the rails
   rather than by measurement — and it is the assumption most deserving a second pair of eyes before any
   outbound hand is granted.

**grafted_from.** picture §1 (what it makes), §2/14, §6 rows 12, 13 · flywheel §2/14, §1 · founder §2/14 ·
machine §2/14, §1.1 · frame §14 · catalogue CY1 CY2 CY3 CY4 C36 D5 D7 D15 · binds **D5 D7 D12 D15** ·
Decisions 4, 6, 7, 9.

---

> **The eight that follow are the territories the fourteen do not contain.** They were found by asking what a
> grown company has that a year-one frame does not, and each carries a status on every mechanism: `[exists]`
> running here today, `[year-one]` decided and not yet written, `[full-scale]` specified and authorised by
> nothing, `[WISH]` no mechanism and none proposed.

## 15 · Distribution & audience

**At full scale — what it IS.** The territory that decides whether the register can read anything at all.
`ventures/<slug>/AUDIENCE.yml` holds one row per channel: `channel`, `owned: true|false`, `handle`, `size`,
`measured_on`, and `instrument:` — the exact command or endpoint that reads the size. `channels/<id>.yml` is
global, because platform physics is the same for every venture: the declared rate limit, the automated-posting
policy, the removal semantics. `LADDERS.yml` gains `reach_ceiling:` per channel, because **an exposure's
reachable rung is bounded by the audience that can see it** — a rung-2 assertion on a channel of size nine is
not a weak reading, it is a structurally impossible one. Acquisition is a mission *kind*, `intent.kind:
acquire`, whose done-test resolves on an `AUDIENCE.yml` delta rather than an artifact, which is the only way
the goal tree can rank reach against production. Owned and rented are different physics, not two labels: a
rented row carries `mirror:` naming the owned channel that must receive the same artifact, because a rented
channel can be taken away overnight and an email list cannot. The mouth counts calls per `(channel × window)`
from the event log, so a platform limit is enforced before the call rather than discovered by a suspension.

**Components.**
- `ventures/<slug>/AUDIENCE.yml` — channel rows, measured size, a date — written by `sweep.mjs`; read by `reach.mjs`, the allocator, intake, the briefing.
- `channels/<id>.yml` — platform physics, global — written by the founder; read by `pack.mjs` and the mouth.
- `LADDERS.yml` `reach_ceiling:` — the maximum rung this channel supports — read by the assertion generator.
- `scripts/reach.mjs` — prints the ceiling and its arithmetic · `intent.kind: acquire` — a mission whose end state is an audience delta, read by `next.mjs`.

**Enforced by.**

| rule | mechanism |
|---|---|
| No claim asserts a rung above the channel's `reach_ceiling` | schema refusal at ledger lint; the assertion string is generated from the rung `[full-scale]` |
| A rented-channel exposure with no `mirror:` fails | suite check, the shape of `check-exposures.mjs`'s past-`check_on` rule `[full-scale]` |
| No publish call exceeds the platform's declared rate | counter at the mouth over `events.jsonl`; not model-visible `[full-scale]` |
| An unreadable instrument writes `unresolved`, never the last size | resolver contract, Rule 10 — pinned in `scripts/ledger.test.mjs` `[exists]` |
| "Post rarely and well, per platform" | `[WISH]` — a judgement. What is mechanised is the rate refusal, not the restraint |

**Year one — the slice.** One landing, decided: **an owned address a stranger can subscribe to, on the
company's own domain, by the founder's hand, before mission 2 publishes** — accepted **later in the month**
rather than at the picture's earlier position (*founder's choice 3*). No `AUDIENCE.yml`, no `channels/`, no
`reach_ceiling:`, no acquisition mission kind. The frame's own verdict is *"ABSENT, and it should not be"*; the
founder's decision narrowed the timing, not the substance.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The address has one subscriber | `AUDIENCE.yml` with one row, an `instrument:` and a `measured_on` |
| Three consecutive exposures resolve `no_data` | the finding is filed against the **instrument**; `reach.mjs` prints the ceiling that made it inevitable |
| A second channel is proposed | `channels/<id>.yml`, the rate table, the mouth's per-channel counter |
| The first rented channel is proposed | `revocable: true` and the `mirror:` requirement — a rented publish needs an owned twin; and `intent.kind: acquire` with its `AUDIENCE.yml`-delta resolver |

**Would have to be true.**
1. **Owned distribution is buildable by a machine at all** — several platforms restrict automated posting
   outright; if false the company is a slower thing, probably email and search. **Partially measurable in 30
   days**: the address exists and one subscriber arrives; throttling needs ninety.
2. **The world answers** — measurable only as *suggestive* over the first five exposures.

**grafted_from.** picture §2/15 · §3 row 15 · §5 wheel 2 · §7 row 3 · flywheel §6/15, §3-B · frame §15 step 14,
§16 refusal 1, Part IV row 15. **Catalogue: none** — no entry exists for audience, which is itself the finding.

---

## 16 · Authority

**At full scale — what it IS.** §09 is entirely about stopping; **this one is about granting**, and it produces
a number no other territory does: *"tonight the machine may spend $180, publish to 2 accounts, email 9 named
humans and deploy 4 previews"* (illustration). The object is a **warrant**, minted by `bin/minter.mjs` from
`policy/warrants.yml` and the trust table, with **no natural-language surface anywhere in the issuing path**.
It names one hand, one mission, one pack, and carries caveats: a project scope, an `artifact_sha256` binding it
to bytes already on disk, `max_calls`, `not_before`, `expires`, `spend_cents`, `taint: clean`. Its `chain:` is
an HMAC over those caveats, so **any holder may append one and nobody can remove one** — a spawned sub-worker
holds strictly less than its parent, verified by arithmetic rather than by a central authority, which is what
makes delegation safe at 3am when nothing is awake to ask. Issue, exercise and refusal all append to
`WARRANTS.jsonl`. **The fuse and the warrant are one object seen from two sides** — a warrant that expires
unexercised *is* the fused default, and the queue row and the ledger read the same `expires`, so the surface
and the authority layer cannot disagree about what the founder's silence meant. The full lifecycle — mint,
attenuate, exercise, refuse, expire, audit, widen, revoke, and the three-count rule — is Map 5.

**Components.**
- `WARRANTS.jsonl` — append-only, one row per issue, exercise, refusal — written by minter and mouth; read by the mouth, the bailiff, the Friday audit, the trust function.
- `policy/warrants.yml` — the mint policy, `promotion_n`, and the `urgency: wake` allowlist — written by the founder in daylight.
- `bin/minter.mjs --policy warrants.yml --ledger WARRANTS.jsonl` — issues or refuses; deterministic.
- `bin/bailiff.mjs --rates rates.yml --rope rope.yml --stop STOP` — counts exercises against ceilings · `packs/<id>.yml` `warrant_kind:`, the declared-enum label the whole object hangs on.

**Enforced by.**

| rule | mechanism |
|---|---|
| A warrant cannot be reused on different bytes | sha256 compare at the mouth, before execution `[full-scale]` |
| A warrant cannot fire before its hour | `not_before` compare at the mouth `[full-scale]` |
| A delegate holds strictly less than its parent | HMAC chain verification; a removed caveat fails the chain `[full-scale]` |
| A standing warrant cannot be minted while `promotion_n` is null | the minter refuses — the identical shape as `pack.mjs` refusing `reach: spends` while `usd_per_day` is null `[full-scale]` |
| A `kind: human` gate carrying a `run:` is refused | schema refusal — `.claude/gates.yml` + `check-gates.mjs`, pinned by `gates.test.mjs` `[exists]` |
| Authority is computed in exactly one place | `scripts/lib/classifier.js` is the one decider `[exists]`; re-derive by `grep -rn 'reach' scripts/loop/ packs/` |
| The founder widens a warrant only in daylight | `[WISH]` — a ritual. What is mechanised is the audit's input, not the founder's attendance |

**Year one — the slice.** Two strings, both decided. **`warrant_kind:` on `packs/<id>.yml`** — a name from the
enum `none | standing | morning`, read by nothing, refused if not in the enum (*founder's choice 4*). It is the
tested home for `artifact_sha256`, `not_before` and the attenuation chain on the day the first outbound pack is
proposed. And **`not_before:` on every staged act that would leave**, default `08:00` the next morning
(*founder's choice 8*). The picture adds two columns to `expose.mjs` — which act, by whose hand, how many
times, reversed how often — so **row one of the authority ledger is the founder's own hand**.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first `reach: outbound-write` pack is proposed | count the deciders first: one file and the warrant is an addition, two and it is a rewrite |
| `EXPOSURES.yml` shows 3 by-hand outbound acts of one class | `WARRANTS.jsonl`, `minter.mjs`, the warrant object; the first is a **morning** warrant |
| Two hands pass admission tests 1–5 with no process able to hold them | the mouth; rings separated by credential |
| A maker first spawns a sub-worker under a warrant | the HMAC attenuation chain and its verification |
| The three-count conjunction holds for one class | the first **standing** warrant, minted by code at the audit (Map 5) |

**Would have to be true.**
1. **Authority stays computed in exactly one place.** If false, standing warrants are decorative and the Friday
   audit measures one path while another exists — and this repository has already paid once to learn what two
   risk deciders cost. **Measurable in 30 days**, trivially, by the grep above.
2. **A pack's track record is a coherent subject**; if false, the ceiling is the founder's morning permanently.

**grafted_from.** picture §1 · §2/09 · §5 wheel 7 · §7 rows 4 and 8 · machine §5.2, §5.4, §6.1 · frame §2, §3,
§9, §16 refusal 1, Part IV row 16 · catalogue `R2` `R4` `R5` `R6` · `hands.md` §5.1 pattern 10 (macaroons).

---

## 17 · Attention

**At full scale — what it IS.** §10 is *where the founder looks*. This is *how much they can be asked, by whom,
at what cost, and what happens when the budget runs out* — and only the second is a constraint. `DAY.yml` is a
declared object the loop reads as a hard scheduling input: protected blocks with `interruptions: 0` and an
**enumerated, closed** exception set, an `interruptions_per_day` ceiling, a `questions_per_day` budget the
machine is required to spend. Work whose output needs looking at is planned to land before the morning
appointment, and a card so its fuse does not fall inside a protected block. The budget is metered like the
token window: a ceiling, a safelist, an override that demands a written reason and logs the numbers. **The fuse
is the load-bearing mechanism** — every founder-clearable block carries `default_if_unanswered:`, always the
reversible branch, and a fourth disposition `fused`; irreversible, financial and first-contact classes carry no
default and cannot fuse. **The failure to watch**, named by the vision that proposed the attention record: it
can quietly train the machine to stop asking about things the founder is *avoiding*. The guard is arithmetic —
reversals counted separately from non-answers, and a class with any reversal history can never be auto-retired.

**Components.**
- `DAY.yml` — protected blocks, budgets, windows — written by the founder; read by `tick.mjs` and the card generator.
- `~/.agentvibe/attention.jsonl` — one row per card emitted, answered, fused or reversed; one per queue session — read by `attention.mjs`, `monthly.mjs`, the card generator.
- `default_if_unanswered:` + the `fused` disposition — on every founder-clearable block — read by `tick.mjs`.
- `LIMITS.yml` `notify_per_day` — a cap in year one, a meter later · the question budget, surfaced in the briefing's NEEDS YOU and becoming a rule with an expiry.

**Enforced by.**

| rule | mechanism |
|---|---|
| A fusable block with no `default_if_unanswered:` is refused | schema refusal, `scripts/missions.test.mjs` `[year-one]` |
| A default on an irreversible, financial or first-contact class is refused | schema refusal, same test `[year-one]` |
| Silence produces a recorded decision, never a queue | the `fused` branch in `tick.mjs` `[year-one]` |
| A card class with any reversal history is never auto-retired | arithmetic over `attention.jsonl`; reversals counted apart from non-answers `[full-scale]` |
| The machine must spend its question budget | `[WISH]` — reported as a finding about the machine; nothing forces the ask |
| The founder does not override the budget daily | `[WISH]` — the founder's own rule is that a budget overridden daily is **removed rather than tuned** |

**Year one — the slice.** The fuse, decided, landing twice: the schema field in the block schema and the branch
in `tick.mjs` (*founder's choice 2*). `notify_per_day: 3` in `LIMITS.yml` as **a cap without an account** — the
frame's own honest description. `DAY.yml`, the attention record, the question budget and the meter are
designed-in shapes with **no change in year one**. The nearest thing to an attention instrument that does exist
is the balcony's own done-test: opened twice unprompted, more than 48 hours apart.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first month in which `notify_per_day` is hit | the cap becomes a meter — one line in `monthly.mjs` |
| Fused count exceeds answered count in one month | card classes proposed for retirement, with their instances shown |
| A second lane in flight | `DAY.yml`, because scheduling now has something to schedule around |
| Any fuse is reversed by the founder | that class loses auto-retirement eligibility permanently |
| The override is exercised on consecutive days | the budget is removed, not tuned |

**Would have to be true.**
1. **The founder looks, and looking is cheap enough to keep doing.** The measured base rate is zero;
   everything collapses if this is false, and the correct response is to **stop the vision, not work around
   it**. **Measurable in 30 days, twice**: the day-8 numbers recorded without chasing, and `BRIEFING.md` opened
   twice unprompted 48h apart.
2. **A metered budget is not overridden every day.**

**grafted_from.** picture §1 · §3 rows 10 and 17 · §5 wheel 8 · §7 rows 2, 10, 11 · founder §4, §6/15 · frame
§1, §10, §13, §16, §17, Part IV row 17 · catalogue `C21` `E3` `S2` `S3`.

---

## 18 · Obligation, and the people it is owed to

**At full scale — what it IS.** Missions are things the company **chose**; claims are things that are **true**;
neither is a thing the company **owes**. An obligation has different physics from both: a counterparty, no
deprioritisation by a ranking function, no expiry when it becomes inconvenient, and a default that costs
reputation, which no artifact repairs. `ventures/<slug>/OBLIGATIONS.yml` holds `counterparty` (an id in
`people.yml`), `kind:` from a closed enum (`reply | refund | invoice | sla | renewal | regulatory`), `due:`,
`promised_in:` — the task or exposure id where the promise was made, so every obligation traces to the act that
created it — and `state:` (`open | met | missed | waived`). `people.yml` is the named-human register and is
more than an allowlist: id, name, address, `consent:` with its source and date, `last_contact:`, and promises
kept and broken. **The register is a mouth check, not a prompt**: every recipient must resolve in it, and an
unparseable recipient **fails closed**. First contact with anyone not on it is tier F, forever, at any count,
and reply-in-thread is a distinct and narrower permission. A per-person cooldown counter stops the specific
failure an unattended machine is built to commit: approaching the same person twice about the same thing.

**Components.**
- `ventures/<slug>/OBLIGATIONS.yml` — what is owed, to whom, by when — written by the founder at the tap and by the harness from a resolved exposure; read by `next.mjs`, the briefing, `check-obligations.mjs`.
- `people.yml` — the named-human register, global once a person spans two ventures — **written by the founder only**; read by the mouth and the cooldown counter.
- `scripts/check-obligations.mjs` — fails on a past-due obligation with no disposition; a suite step.
- The mouth's check 6 — the recipient resolves in `people.yml`, or refuse · the per-person cooldown counter, counted from `events.jsonl` at the mouth.

**Enforced by.**

| rule | mechanism |
|---|---|
| A past-due obligation with no disposition fails the build | suite check, the shape of `check-exposures.mjs`'s past-`check_on` rule `[full-scale]` |
| An obligation cannot be deprioritised by the ranking function | `next.mjs` returns no leaf while one is past due; pinned by `next.test.mjs` `[full-scale]` |
| No message reaches a human absent from the register | register lookup at the mouth, **failing closed on an unparseable recipient** `[full-scale]` |
| First contact is never machine-executed | argv absence — the address book is not in any maker's process `[year-one]` |
| The same person is not approached twice about one thing | cooldown counter per `(person × subject)` at the mouth `[full-scale]` |
| A promise made in prose becomes an obligation row | `[WISH]` — detecting a promise in copy is a judgement. What is mechanised is that the founder writes the row at the tap, and the row names the exposure it came from |

**Year one — the slice.** **Nothing, and correctly.** The frame's disposition is *"follows the first
customer"*. There is no `people.yml`, no `OBLIGATIONS.yml`, and **no reserved string** — the one territory of
the eight where the spec reserves nothing, because an obligation with no counterparty is not an obligation.
What year one provides is the hook the first one hangs on: every row carries a task id from the first week, and
`expose.mjs`'s authority columns record whose hand performed each act, so the first obligation has a traceable
`promised_in:` the day it exists.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first customer — a rung-4 reading, money received | `people.yml` with one row; `OBLIGATIONS.yml` with the first promise |
| The first obligation passes its `due:` | `check-obligations.mjs` as a suite step; the briefing gains an OWED section |
| The first `contact` hand is proposed | the register becomes a mouth check, and the cooldown counter lands with it |
| One person appears in two ventures | `people.yml` moves global, beside the fields, for the same reason the fields are global |
| An obligation is missed | a post-mortem row with a **Mechanism** column; `none` permitted and **counted** |

**Would have to be true.**
1. **The register scales past one venture without becoming a burden the founder abandons.** If false it rots
   into a stale allowlist that fails closed on real customers and gets routed around, which is worse than not
   having it. Not measurable in 30 days; nobody is in it.
2. **Obligations accumulate fast enough to warrant a store before the first one is missed.**

**grafted_from.** picture §2/table row 18 · founder §6/16 · machine §6.3 · flywheel §6/18 · frame §14, Part IV
row 18 · catalogue `R6` `B1` `N4`.

---

## 19 · Identity & standing

**At full scale — what it IS.** Three things joined because they are all *the company's name as an asset*.
**What it has said**: `SAID.jsonl`, one row per published statement, generated from `EXPOSURES.yml` plus the
staged artifact bytes, so the corpus is a projection of the register rather than a second source of truth.
**What it may never say**: `NEVER-SAY.yml`, a refusal list — claims it cannot substantiate, comparisons it will
not make — checked before publication by a deterministic pattern check with the embarrassment linter's posture:
**named precisely as hygiene, never reported as taste**. Detecting that two ventures have contradicted each
other under one name is a judgement and stays a `[WISH]`. **Disclosure**: `made_by: machine | founder | mixed`
on every exposure row, the one part carrying a deadline rather than a trigger, because **it cannot be
retrofitted onto three years of unlabelled exposures** — and it is an asset, not only compliance, available
only to a company that recorded provenance from the beginning. **Standing**: `STANDING.yml` per account —
domain, sending reputation, platform standing, API-key health, credit — each with an `instrument:` and a
`measured_on`. These are assets **damaged by correct actions taken too often**: a good outreach email at the
wrong volume burns a sending domain permanently while every individual action passes every check.

**Components.**
- `SAID.jsonl` — the corpus of public statements, generated — written by `expose.mjs`; read by the consistency check and by a human.
- `NEVER-SAY.yml` — the refusal list — written by the founder, `irreversible` tier; read by the pre-publication check.
- `made_by:` on the exposure row — provenance at emission — read by the monthly report and by anyone auditing three years later.
- `STANDING.yml` — one row per account with an instrument and a date — written by the sweep; read by the mouth and the Friday audit. The entity, the contracts and the IP position are **files a human holds**, outside every process.

**Enforced by.**

| rule | mechanism |
|---|---|
| An artifact matching a `NEVER-SAY.yml` pattern is not published | deterministic pattern check before the mouth; a refusal, not a warning `[full-scale]` |
| Every exposure row carries `made_by:` | schema refusal at emission; unbackfillable, so required from the first row `[full-scale]` |
| A hand whose account standing reads `unresolved` does not fire | the mouth reads `STANDING.yml`; unreadable → refuse. Rule 10, applied to reputation `[full-scale]` |
| Standing is measured, not assumed | `instrument:` + `measured_on` required; a figure with neither fails `[full-scale]` |
| Two ventures never contradict each other under one name | `[WISH]` — a judgement over a corpus. The corpus is the precondition, not the mechanism |
| Nothing under the company's name blows up | `[WISH]` — **there is no good forward test**, which is why this is handled by the physics line and the rails rather than by measurement |

**Year one — the slice.** **Disclosure only, and it carries a deadline rather than a trigger**: Part V dates it
to the first machine-published artifact. Everything else follows the first legal entity. *Proposed, not
decided*: `made_by:` as one column on the exposure row, on exactly the argument that moved `say:` and the task
id earlier in the month — a row emitted without it can never be labelled, and backfilling rewrites every
emitter. One column now; every exposure before the change is permanently unlabelled. A founder's call, recorded
here as a proposal.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first machine-published artifact | `made_by:` is live, or the disclosure decision is permanently more expensive |
| The first legal entity exists | the entity file, the IP position, and the tier-F list that names them |
| The second venture publishes under the same name | `SAID.jsonl` and `NEVER-SAY.yml` |
| The first outbound hand with a sending domain | `STANDING.yml` for that account, with an instrument |
| An account's standing instrument returns `unresolved` twice | the hand is unavailable until it reads |

**Would have to be true.**
1. **Nothing under the company's name blows up.** One bad exposure destroys reputational capital faster than
   three years of good ones build it, and the embarrassment linter catches hygiene rather than judgement. Not
   recoverable by mechanism, not measurable in 30 days, and the assumption most deserving a second pair of eyes
   before any tier-R hand.
2. **Disclosure rules stay readable per medium.**

**grafted_from.** picture §2/table row 19 · §6 row 13 · flywheel §6/17, §6/20 · founder §6/17 · machine §6.4 ·
frame §8, §9 (the residual eight), Part IV row 19 · catalogue `R5`.

---

## 20 · The calendar and the clock

**At full scale — what it IS.** Two objects with one thing in common: both are *when*, and the fourteen are
timeless. **The calendar** is when things are due in the world. `CALENDAR.yml` holds dated entries — a seasonal
window, a launch, a quarter end, an embargo lift, a VAT deadline, a renewal — each with a `worth:` multiplier
and a decay, so the company can represent *"worth three times as much in nine days and nothing after that"*.
`next.mjs` gains exactly one term: cost of delay against a date. The function stays pure and prints its
arithmetic, and the calendar is **data** — dated, written by the founder or by the relay from a world event —
which is what keeps a priority function that can see a date from becoming one with a field a model benefits
from filling. **The clock** is what hour an act fires. `not_before:` is the smallest version and it is
load-bearing: an act at 04:00 has four hours to compound and one at 08:04 has none, so publishing at 08:04
costs five hours and zero throughput. The full version is a **circadian design**: what the machine does at 3am
is a different *category* of work from 10am, not the same work unsupervised — night is make, stage, shelf,
sweep and re-test; day is the acts that leave. The hour is a caveat on the warrant, so it is a property of the
token and not a policy someone remembers.

**Components.**
- `CALENDAR.yml` — dated world events with `worth:` and a decay — written by the founder and the relay; read by `next.mjs` and the briefing.
- `not_before:` on every staged row and every warrant caveat — written at emission by `tick.mjs`.
- The cost-of-delay term in `scripts/loop/next.mjs` — pure, deterministic, printing its arithmetic.
- The 3am list — what may never run overnight — held as argv absence, not as a table someone reads · `embargo:` as a warrant caveat, a `not_before` that is someone else's date.

**Enforced by.**

| rule | mechanism |
|---|---|
| No act that leaves fires before its hour | `not_before` compare — the founder's tap `[year-one]`, the mouth `[full-scale]` |
| A staged row with no `not_before` fails | schema refusal; the default is written at emission, never inferred at read `[year-one]` |
| Publish, send, spend and contact cannot run at 3am | **argv absence** — the tool string is not in the process `[year-one]` |
| Priority stays deterministic once the date term lands | `next.test.mjs`: same inputs, same leaf `[year-one]` |
| A calendar entry with no date is refused | schema refusal `[full-scale]` |
| The right work lands before the founder's morning | `[WISH]` in year one; `[full-scale]` once `DAY.yml` exists and the loop schedules against it |

**Year one — the slice.** **`not_before:` now, the rest with the second lane.** Accepted as
*founder's choice 8*: every staged act that would leave carries `not_before:` on its row, default `08:00` the next morning — one
field, landing in `tick.mjs`, so the hour is a property of the row and not a policy someone remembers. No
`CALENDAR.yml`; priority is the leftmost open leaf of the single in-flight mission, and refusal 5 reopens it on
*a second mission in flight*, which is exactly this territory's trigger.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| A second mission in flight (refusal 5's own reopen) | `CALENDAR.yml` and the cost-of-delay term in `next.mjs` |
| The first customer outside the founder's timezone | recipient-local windows on the queue row |
| The first dated external commitment — an embargo or a launch | `embargo:` as a warrant caveat, distinct from the morning default |
| The first night on an always-on host | the circadian split becomes real rather than incidental to when the lid is open |
| A mission is late because priority could not see a date | the finding is filed against the ranking function, not the worker |

**Would have to be true.**
1. **A date term can be added without adding a field a model benefits from filling.** The calendar is
   founder-and-world-written, never worker-written, and that is the whole safeguard. **Measurable in 30 days
   only as absence**: `next.mjs`'s determinism test exists already and must still pass when the term lands.
2. **The world's dates are knowable far enough ahead to rank against**; if not, the calendar is a log.

**grafted_from.** picture §1 (the 08:04 decision) · §2/table row 20 · §7 row 8 · flywheel §6/19 · founder
§6/18 · machine §5.2, §6.2 · frame §1, §3, §16 refusal 5, Part IV row 20.

---

## 21 · Silence

**At full scale — what it IS.** The right to produce nothing, **measured**. Every mechanism in the fourteen
rewards output, and an unattended machine with a budget will always find something to make. The territory owns
three things. The **explore reservation**: a declared fraction of the window spent on work with no requested
outcome — spent or lost, never banked, never asked to pay off, because a reservation that must justify itself
is not a reservation. The **deliberate no-publish night**, which at full scale is an *authored refusal*: once a
standing warrant exists, silence stops being the absence of an act and becomes the refusal of an authority that
would otherwise fire. And the reason the territory exists, the **distinction between chosen and accidental**. A
night with no exposure because the machine judged none correct and one because nothing was ready are the same
row unless something separates them — the identical distinction this repository already draws four times:
`no_data` from `not_checked`, `unresolved` from `pass`, a refusal from a block, and *the checks ran* from *the
checks passed*. The monthly report keeps shelf artifacts and exposures in **two columns and never one**. The
counterweight: an idle machine is a design failure, an idle machine that publishes to fill the time is a
catastrophe, and **the shelf is the answer to both** — shelf work needs no decision, so it does not consume the
scarce resource.

**Components.**
- The night row's terminal value `none_correct` — distinct from "nothing was ready" — written by `tick.mjs`; read by `monthly.mjs`.
- `no_publish: true` with a reason on a staged row — an authored silence.
- The explore reservation in `LIMITS.yml` — a fraction of the window, spent or lost.
- `monthly.mjs`'s two columns — shelf artifacts and exposures, never summed · the shelf itself, `archive/**/card.yml` + `INDEX.jsonl`, the alternative to filling time with acts that leave.

**Enforced by.**

| rule | mechanism |
|---|---|
| A silent night is recorded as chosen or accidental, never as one value | terminal-value enum on the night row; a missing value fails `[full-scale]` |
| Shelf artifacts are never summed with exposures | two columns in `monthly.mjs`, and a test that no single "artifacts" total exists — the shape of the `total` refusal, whose year-one half is `select.test.mjs` `[year-one]` |
| The explore reservation is not reallocated when the week is busy | the fraction is read at compile time and lost if unspent `[full-scale]` |
| Cost per surviving exposure never flatters a silent month | prints `undefined` at a zero denominator, never zero — `pl.mjs` `[year-one]` |
| The machine concludes "we should not have done anything tonight" | `[WISH]` — a judgement no mechanism produces. What is mechanised is the count and the distinction, the precondition for a human ever saying it |

**Year one — the slice.** **Nothing, and correctly.** §13 refuses the explore reservation (`C33`) and the
boredom detector (`C23`) with a stated reopen: *the archive passes its falsifier*. Two seeds exist: cost per
surviving exposure prints `undefined` at a zero denominator, and `EXPOSURES.yml` distinguishes `no_data` from
`not_checked`. A machine keeping those honestly has the grammar for silence before it has the territory.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The archive passes its falsifier — a founder promotion or a ship from a non-nominated cell | the explore reservation (`C33`) reopens |
| One approach appears in three missions' rows | the boredom detector (`C23`) reopens — the same thing produced repeatedly, not nothing produced |
| The first calendar month with zero exposures | the report must distinguish chosen from accidental, or the month is uninterpretable |
| The first standing warrant exists | a no-publish night becomes an authored refusal with a ledger row |
| Shelf artifacts exceed exposures by an order of magnitude | the two columns are load-bearing; a single total would have hidden it |

**Would have to be true.**
1. **Shelf work earns its money** — an artifact needing no decision still has value later. If false the explore
   reservation is a subsidy. Not measurable in 30 days; the archive's own falsifier is the first reading.
2. **A quiet week is distinguishable from a stalled one by the clock brake rather than by judgement** — already
   true, because `stalled` is measured by a meter the worker cannot author.

**grafted_from.** picture §2/table row 21 · §5 wheel 4 · machine §5.6, §6.5 · frame §13 (`C33` and `C23`
refused with a reopen), §5 (the archive falsifier), Part IV row 21 · catalogue `C2` `C6` `C23` `C30` `C33`.

---

## 22 · Succession

**At full scale — what it IS.** The whole design has one human in it and no territory in the fourteen names
what happens when that human is unreachable — ill, travelling, or simply not interested this quarter. Three
questions, two of them mechanisable. **What the machine does when nobody answers**: every card fusing for N
consecutive days is a countable condition over a store that already exists, and the right response is that the
machine **notices and stops rather than proceeding** — a dead-man's switch, `tick.mjs` refusing to dispatch.
Note what this rules out: a machine whose fuses all fire is operating entirely on defaults, the one state where
"the reversible branch chosen automatically" stops being conservative and starts being unsupervised. **Who can
pull the cord**: `touch STOP` is a file, checked first at every dispatch, reachable from a phone, and **if the
check itself errors, refuse** — pullable by anyone with filesystem access, which is simultaneously the
mechanism and the honest vulnerability. **What a handover file must contain**: `HANDOVER.md`, generated and
never hand-written — the store map with one writer each, the credential list with where each lives and never
the secrets, the kill switches, the in-flight mission, every standing warrant with its exercise and reversal
counts, the open obligations, the accepted risks with their exit conditions, and the command that regenerates
it. And the asset this creates almost by accident: **a company whose durable knowledge lives in files is
unusually transferable** — a by-product of the memory discipline rather than a built feature.

**Components.**
- The all-fused counter — N consecutive days with every card fused — computed over `attention.jsonl`; read by `tick.mjs`.
- `~/.agentvibe/STOP` — a file, checked first, `touch`-able from a phone; read by every dispatch.
- `people.yml` `may_stop: true` — the second human who can stop the line.
- `HANDOVER.md` — generated from the stores; read by a second human sitting down cold. The store map itself — one writer, append-only, in git, none a service — is what makes it generatable at all.

**Enforced by.**

| rule | mechanism |
|---|---|
| N consecutive all-fused days stops dispatch | counter over `attention.jsonl`; refusal in `tick.mjs` `[full-scale]` |
| `STOP` is checked before anything else, and an errored check refuses | the tick's second step, pinned by `loop.test.mjs` `[year-one]` |
| The handover file cannot go stale | it is **generated**; a hand-written `HANDOVER.md` is refused by the rule that refuses a hand-edited archive `[full-scale]` |
| Durable knowledge stays transferable | the store map's own discipline — one writer, append-only, in git, no service `[year-one]` |
| A legal transfer of the company | **physics line** — tier F, a human hand, forever. `[WISH]` as anything automatable |
| The founder is not a single point of failure | `[WISH]` — already **accepted in writing** as one of the residual eight |

**Year one — the slice.** **A written acceptance with a review date** — and the acceptance already exists:
*"the founder is a single point of failure"* is the eighth of the residual eight accepted in writing in §09.
There is no handover file, no dead-man's switch and no second human; every human gate carries `decided_by:
founder`. What year one does build, without calling it succession, is the entire precondition: eleven stores
with one writer each, append-only, in git, none a service. A handover file is a projection of that map, and a
company whose state lives in a service cannot generate one.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| N consecutive days with every card fused | the dead-man's switch — the cheapest mechanism here, because the count is over a store that exists |
| The first standing warrant | `HANDOVER.md` becomes required: unattended authority the founder cannot explain is not transferable |
| Someone else holds a credential this system uses (§14's own reopen) | decision rights per decision *type*, exactly one accountable; `may_stop: true` |
| A month passes with no queue session opened | the acceptance's review arrives by count rather than by calendar |
| The first legal entity | the transfer question becomes real, and stays tier F |

**Would have to be true.**
1. **The stores really are the company** — durable knowledge is in files and not in the founder's head. If
   false, `HANDOVER.md` is a table of contents for something that does not exist. **Partially measurable in 30
   days**: the field-note falsifier asks the same question at one remove.
2. **A second human could act on the handover without the first**; there is no forward test short of trying it.

**grafted_from.** picture §2/table row 22 · founder §6/19 · flywheel §6/21 · frame §5 (the store map), §9, §14
(the second-human reopen), Part IV row 22 · catalogue `CY3` `S3` `RT3`.

---

# Part III — THE MAPS

Six cross-cutting maps. Each is the **single** description of its subject: where a territory above would have
restated one, it names the map instead. Two descriptions of one thing disagree silently, and this repository
has paid for that lesson twice — in risk classification and in CI step parsing.

**On counts, once.** The picture says *"Nineteen processes"* while its own block sums to twenty-one at the
fan-out it states, and *"Ten stores"* while the year-one table has eleven rows. Neither is worth correcting:
**both are functions of fan-out and venture count, and neither is a constant.**

## Map 1 · The process list at full scale

The picture's headline is *"Nineteen processes. Twelve hold a model. One can touch the outside world and it is
not one of the twelve."* **The twelve and the one are load-bearing; the nineteen is not a constant** — the
total is `5 + lanes + makers + judges + readers`, and makers is set by fan-out, which is set by the founder's
decision count. Read the argv column, never the name.

| process | argv | ring | holds | can touch |
|---|---|---|---|---|
| `sentinel` | `launchd KeepAlive → supervise` | — | nothing | restarts the long-lived three; circuit-broken after N restarts in a window |
| `minter` | `node bin/minter.mjs --policy warrants.yml --ledger WARRANTS.jsonl` | — | the mint policy, the trust table | `WARRANTS.jsonl`, append only |
| `bailiff` | `node bin/bailiff.mjs --rates rates.yml --rope rope.yml --stop STOP` | — | the counters | reads the event log; refuses at ceiling |
| `mouth` | `node bin/mouth.mjs --queue outbound.q --register humans.yml` **[NO MODEL]** | **2** | **every outbound credential** | the outside world, one action at a time, against a warrant |
| `relay` | `node bin/inbound.mjs --ws … --watch drop/ --feeds feeds.yml` **[NO MODEL]** | 1 | socket, mailbox, drop directory, feeds | writes **one leaf**, and nothing else |
| `tick ×lanes` | `node scripts/loop/tick.mjs --lane <name>` | — | the loop | spawns, records, exits. **Never under `KeepAlive`** |
| makers | `claude -p --allowedTools "Read,Write,Edit,Bash,Glob,Grep" --add-dir wt/…` | **0** | one worktree | its own worktree. No network, no credential in env, no MCP |
| judges | `claude -p --allowedTools "Read,Grep"` | 0 | nothing | reads. Returns findings, never scores |
| second family | `gemini --model … --prompt-file panel-<id>.md` | 0 | nothing | one judge seat; empty stdout resolves `unresolved` |
| reader | `claude -p --allowedTools "Read,WebFetch,mcp__posthog__query,mcp__stripe_ro__*"` | 1 | credentials **read-only by the vendor's construction** | reads the world; cannot write |

**The one claim here that is physics rather than policy**: a `claude -p` process cannot call a tool absent from
its argv, so the makers cannot fetch, cannot send, cannot spend and cannot reach an MCP server — not because a
prompt asks them not to, but because the strings are not there. Half measured true on 2026-09-02:
`--disallowedTools` produced `BASH_UNAVAILABLE` at exit 0, and `--strict-mcp-config` made user-scope servers
*absent* rather than denied. The unmeasured half is H2 — what a dispatched process can actually **touch** — and
it is the direction that hides, because its precedent failure was a silent no-op rather than an error.

**Ring is defined by credential, never by prompt.** Ring 0 holds no network, no credential in env and no MCP,
and can lose only its own worktree. Ring 1 holds credentials read-only *by the vendor's construction* — a
restricted key, a read-only endpoint, a fine-grained PAT — so half the narrowing is already published and free.
Ring 2 is the mouth, exactly one process, and there is nothing in it to persuade.

## Map 2 · The store map

**This is the one store table in the document.** One writer each, append-only or rewritten whole, all in git,
none a service. Year-one rows come first; full-scale rows carry their territory number.

| store | format | one writer | readers | expiry | cap |
|---|---|---|---|---|---|
| `MISSIONS.yml` | YAML tree | `tick.mjs` state, founder intent | `next.mjs` | none | uncapped depth, one `in_flight` |
| `BOARD.md` | SBAR markdown | `tick.mjs` | the next prompt | rewritten whole | 4,000 bytes |
| `STEER.md` | markdown | founder | `tick.mjs` | read at tick top | — |
| `TASTE.md` | markdown | founder | the MAKE prompt | none | 20 lines |
| `EXPOSURES.yml` | YAML rows | `expose.mjs` | `claim-world`, briefing, audit | `check_on` forces a disposition | append-only |
| `~/.agentvibe/fields/` | markdown notes | the harness | `orient.mjs`, every MAKE prompt | **every fact a claim with `valid_until`** | byte cap per note |
| `dead-ends/` | markdown | `tick.mjs` | `orient.mjs` | never expires; `retry_if:` re-tested on a schedule | — |
| `archive/**/card.yml` + `INDEX.jsonl` | YAML + JSONL | `tick.mjs` | `orient.mjs`, balcony | rotates by volume, **never deleted** | per volume |
| `taste/PAIRS.jsonl` | JSONL | `promote.mjs` **only** | judge calibration, MAKE, the falsifier | **pairs expire; taste drifts** | — |
| `events.jsonl`, `tasks.jsonl` | JSONL | `logEvent`, `tick.mjs` | balcony, monthly, brake | **never expires; never evidence for a belief without a claim** | — |
| `DECISIONS.md` + ledger | markdown + YAML | as today | `evict-memory.mjs` | Rule 9 forces a disposition | 40,000 bytes per volume |
| `AUDIENCE.yml` · **15** | YAML rows | `sweep.mjs` | `reach.mjs`, allocator, intake | `measured_on` + instrument | per venture |
| `channels/<id>.yml` · **15** | YAML | founder | `pack.mjs`, the mouth | platform policy changes | global |
| `WARRANTS.jsonl` · **16** | JSONL | minter, mouth | mouth, bailiff, Friday audit, trust | **each warrant expires; that is the point** | append-only |
| `policy/warrants.yml` · **16** | YAML | founder, **in daylight** | the minter | — | — |
| `attention.jsonl` · **17** | JSONL | balcony, `tick.mjs` | `attention.mjs`, `monthly.mjs`, card generator | none | — |
| `DAY.yml` · **17** | YAML | founder | `tick.mjs`, card generator | — | closed exception set |
| `OBLIGATIONS.yml` · **18** | YAML rows | founder at the tap; harness from a resolved exposure | `next.mjs`, briefing, `check-obligations.mjs` | `due:` forces a disposition | per venture |
| `people.yml` · **18** | YAML | **founder only** | the mouth, the cooldown counter | consent state carries a date | global once shared |
| `SAID.jsonl` · **19** | JSONL, generated | `expose.mjs` | the consistency check, a human | none | — |
| `NEVER-SAY.yml` · **19** | YAML | founder, `irreversible` tier | the pre-publication check | — | — |
| `STANDING.yml` · **19** | YAML | `sweep.mjs` | the mouth, Friday audit | `measured_on`; unreadable → `unresolved` | per account |
| `CALENDAR.yml` · **20** | YAML, dated | founder, relay | `next.mjs`, briefing | entries pass | — |
| `HANDOVER.md` · **22** | markdown, **generated** | the generator | a second human | regenerated on read | — |

**Four physics decide where a thing goes**, and getting this wrong is how a memory layer rots: `events.jsonl`
holds *what happened* and never expires · the ledger holds *what is true* and expires · the fields hold *how a
field works* · the taste stores hold *what this venture is*. Conflict resolves newer-wins **with the older
retained in place carrying the evidence that moved it**; nothing is deleted to meet a cap; and RAG over
transcripts is refused as memory, because retrieval cannot tell a corrected belief from a current one. **The
reader column is the one to audit — a store nothing reads is a diary, not an asset.**

## Map 3 · The pack roster, and the pack schema in full

Fourteen to twenty-six packs (illustration) across **five families**, plus two special grants. **Zero new agent
files, ever.** A pack is `(tools × mcp × warrant kinds × done-tests × field)` — a grant and a stop.

| family | year one | what it makes |
|---|---|---|
| `web-feature` | **built** — the one pack of the first thirty days | pages, features, code behind a flag |
| `design-brand` | named, unbuilt | identity, palette, type, visual systems |
| `content-video` | named, unbuilt | short video, thumbnails, cutdowns |
| `customer-market` | named, unbuilt | positioning, offers, interviews, pricing artifacts |
| `content-copy` | named, unbuilt | essays, newsletters, landing copy, sequences |
| `orient` | **the read-only field learner** — `[Read, Glob, Grep, WebSearch, WebFetch]`, **no Write** | returns exemplars and rules as JSON; the harness writes the note |
| `sweep` | **the outcome resolver** | resolves every past-due `check_on`; measures audience and standing |

```yaml
# packs/<id>.yml — the schema in full
id: web-feature
engine: builder                  # must be one of the seven engine files
model: claude-sonnet-5           # pinned by id, and recorded on the row, because a
                                 # done-test passed on a cheaper model is a different fact
tools:  [Read, Write, Edit, Glob, Grep, Bash]    # MUST be a subset of the engine's own tools:
mcp:    [playwright]             # every entry must be backed by .mcp.json
reach:  local                    # local | outbound-read | outbound-write | spends | speaks-as
rate:   null                     # full scale: (venture × hand × day); null refuses `spends`
warrant_kind: none               # none | standing | morning — declared enum, unused in year one
reversible: yes
blast_radius: local              # local | account | stranger | public
timeout_s: 1800
attempts: 3
skills: [nextjs-app-router-patterns]             # injected, never discovered
field: web                       # full scale: the trust key is (pack × field), not the pack
done: {proposed_by: agent, approved_by: founder, rung: 0}
variation:                       # optional
  n: 8
  descriptors: [layout_density, tone]            # required if variation: is present
  novelty_slots: 2
  diversity_floor: 0.3
  constraints_deck: decks/constraints-visual.yml
# REFUSED BY SCHEMA: steps: · how: · method: · implementation:
```

**Checked by.** Every argv contains `--strict-mcp-config`; `tools ⊆ engine`; any denied name
(`tiktok_publish`, `sandbox_exec`, `send_message`, `share_file`, `claude-in-chrome`) fails; `variation:`
without `descriptors:` fails; an `mcp` entry `.mcp.json` does not back fails; `reach ≠ local` with no human
gate id fails — all `pack.test.mjs` `[year-one]`. The `steps/how/method/implementation` refusal reuses the
predicate that already governs playbook stages `[exists]`. `check-registration.mjs` sweeps packs `[exists]`.

**Trust is computed, never declared, and the key is `(pack × field)`.** A pack excellent at short-form video
has no standing on regulated claims, and an unknown pair fails closed to supervised. It is recomputed at every
dispatch from the event log, so a hand-edited value is overwritten `[full-scale]`. Promotion needs N
consecutive moves whose artifacts survived the world's verdict; demotion is the same counter running backwards
on an incident, with no appeal that skips the count. A new pack serves an apprenticeship in shadow — real
moves, ships nothing, one move in five. Retirement fires on **zero dispatches in ninety days**, archival with a
stub and never deletion. Personas argue and are **structurally forbidden from holding a warrant**. *Year one
carries the schema and one pack; **pack-field** trust reopens when a second pack ships (**founder's choice
1**).*

## Map 4 · The hand admission test

**A hand is admitted by passing tests, not by someone judging it wise** — each test a property *of the hand*,
checkable at load by something that is not a model.

| # | test | what checks it | fails how |
|---|---|---|---|
| 1 | Declares `reversible:` and `blast_radius:` | **the loader** | the hand file does not load — the shape of the lint that already fails an `mcpServers` declaration no configuration backs `[exists]` |
| 2 | Has a dry branch | **the wrapper** | the default call produces an artifact; the effecting call takes a hash. **An unknown flag refuses rather than performing the non-dry action** — the precedent is `verdict.mjs` `[exists]` |
| 3 | Has a credential narrower than the hand | **the credential** | vendor read-only endpoint, restricted key, fine-grained PAT, scoped service account. Where the narrowest available credential is "everything", the hand is ring-2-only |
| 4 | Has a probe a dispatched worker can actually make | **the probe** | reachability is *measured*, never configured. **Unprobed = unavailable** |
| 5 | Has a counter and a ceiling | **the counter** | per hour and per night, enforced at the wrapper by counting the event log; not model-visible, not arguable |

```
passes 1–5  →  NIGHT HAND    may be exercised unattended against a standing warrant
passes 1–4  →  DAY HAND      may only be exercised against a warrant whose not_before is the morning
fewer       →  NOT A HAND    it is a morning row describing an action, and a human performs it
```

**Why this matters more than the roster.** Every one of the five is checked by a loader, a wrapper, a counter,
a probe or a schema; none requires an agent to have read a policy and none has a natural-language surface, so
**the cost of admitting the fiftieth hand equals the cost of the first** — the only thing that makes a
fifty-hand roster (illustration) governable. **And the honest hole**: the five bound *authority*, not
*correctness*. A hand that passes all five can send a perfectly authorised, catastrophically wrong email to an
approved recipient; that is what the oracle, the done-test and the founder's tap are for. **Year one applies
tests 1, 3 and 4 and cannot apply 2 and 5**, there being no outbound hand to apply them to — and the grant
census, `probe-grants.mjs` plus `claude mcp list → hands.json`, **is** admission test 4.

## Map 5 · The warrant lifecycle

```
                        policy/warrants.yml + the trust table
                                       │
  [request]──────▶ MINT ───────────────┼──────▶ REFUSE ──▶ WARRANTS.jsonl row ──▶ morning row
                   │  minter.mjs · deterministic · no model in the path
                   ▼
                ISSUED ──────▶ ATTENUATE ──▶ ISSUED′   (a delegate: strictly MORE caveats)
                   │            HMAC append; nobody can remove a caveat
       ┌───────────┼───────────────┬──────────────────┐
       ▼           ▼               ▼                  ▼
    EXERCISE    REFUSE          EXPIRE             REVOKE
    mouth, 8    any check       unexercised at     founder, or an incident
    checks      fails           `expires`          resets the class counter
       │           │               │                  │
       ▼           ▼               ▼                  ▼
     WARRANTS.jsonl ◀── every one of these appends a row ──▶ FRIDAY AUDIT
                                                                 │
                                           widen ◀───────────────┴──────────▶ narrow
                                   (only through the three-count rule)   (any reversal)
```

**The eight checks at exercise, in this order, any failure a refusal plus a morning row — and this is the one
place they are listed**: `STOP` absent · the HMAC chain verifies · `not_before` passed and `expires` not · the
artifact exists and its sha256 matches · `taint: clean` or a morning release · every recipient resolves in the
register, with first contact a strictly narrower permission than reply-in-thread · the per-hand hour/day/night
counters are under ceiling · the spend caveat plus today's spend is under the daily ceiling.

**`EXPIRE` and the fuse are the same edge.** A warrant that expires unexercised *is* the fused default; the
queue row and the ledger read the same `expires`. One expiry mechanism means the surface and the authority
layer can never disagree about what the founder's silence meant.

**The three-count rule — the only edge that permanently raises the ceiling.** A class of act earns a standing
warrant when **all three** hold:

> **(a)** the founder has performed that act **by hand N times** through the queue, and
> **(b)** the machine's nominated action **matched the founder's choice** on the last N occasions, and
> **(c)** the exposures of that class **resolved at rung ≥ 2 with zero incidents**.

Then the warrant is minted by code, hash-bound, rate-ceilinged, `not_before`-caveated, and audited weekly with
its reversal count. **N is not set here, and it is not set anywhere in this document.** It lives in
`policy/warrants.yml` as `promotion_n: null`, **and the minter refuses to mint a standing warrant while it is
null** — the identical shape as `usd_per_day: null` with `pack.mjs` refusing `reach: spends`, which is already
the honest year-one mechanism for money. The founder sets it in daylight, in a file, on the day the first class
is nominated, with that class's actual by-hand count in front of them. A number invented here would be a
ceiling on the company's autonomy chosen by an agent with no evidence, disguised as a specification. What the
spec fixes is the **conjunction**: the world's verdict tests reach, the founder's own hand tests appetite, and
the match between nomination and choice tests taste — any one alone is defeatable by a machine optimising for
it. **Nothing that crosses the physics line earns a warrant at any count**: a signature, a legal statement, a
purchase of a durable asset, a letter in the post, first contact with a human not on the register. **The number
this lifecycle produces that nothing else does**, printed on the balcony and set by the founder: *"tonight the
machine may spend $180, publish to 2 accounts, email 9 named humans and deploy 4 previews"* (illustration). You
do not make that sentence safer by arguing with it; you edit a file in daylight.

## Map 6 · The founder's day, week, month

**One daily appointment, one weekly reckoning, one monthly report.** The picture collapsed the founder vision's
five daily windows to one, on that vision's own first assumption: the measured base rate of this founder
looking is zero, and five appointments are five chances to fail rather than to succeed. The question, the
world's readings and the night's intent survive as **rows in the one queue**. *The five-window day is the named
alternative, and becomes right the moment the balcony's own done-test passes twice over.*

**The day.** Twelve minutes (illustration), five taps and one read, over **a queue of decisions rather than a
dashboard of activity**. Row one is **a pair rather than a report**, because a pair is a two-second decision and
a report is a five-minute one, and every pair the founder answers is a labelled preference example at zero
marginal cost. Four verbs with deliberately unequal yields: **promote** writes a preference pair and is the
highest · **annotate** writes a line of taste · **approve** gates one artifact and teaches nothing ·
**redirect** is a symptom, and a high redirect rate is a brief defect rather than a worker defect. So the
surface shows **the round, not the pick**. Every row carries a fuse whose default is the reversible branch, and
irreversible, financial and first-contact rows cannot fuse. The `ASKS` row is the machine's one question a day
and **it is required to spend it** — a machine that never asks is one that guesses, and guessing is invisible
until an artifact is wrong for a reason nobody can name. And one thing the machine may not touch: **a protected
making block, three and a half hours, interruptions zero, exceptions a closed set.** Where a machine does the
producing, the founder is the only remaining source of taste, and taste exercised only as judgement degrades
into preference.

**The week.** Friday, forty minutes (illustration), **the only recurring meeting the company has** — and its
two most consequential minutes are the **warrant audit**: every standing warrant, its exercise, refusal and
reversal counts, and any the record now justifies widening or narrowing. *This is where the machine's size is
actually set.* Beside it: the intervention metric **with both components visible**, so a fall caused by fewer
surviving artifacts cannot read as a win · the retirement queue, **computed rather than proposed** · the waiver
count, because three waivers on one block is a decision being avoided · and the **unspent question budget**.

**The month.** Four pages: money · the retirement queue · **every standing refusal with the command that reads
its reopen trigger** · the flywheel page. The third makes the whole system survivable — a refusal with a
countable trigger and a monthly reader expires on schedule; one without is a permanent opinion in costume.

**Year one's version of all three**: the 08:00 briefing plist writing `BRIEFING.md` with money first and four
sections that may each say "nothing" — because **silence is indistinguishable from failure** — plus
`balcony.mjs` with four verbs, and `monthly.mjs` on day 30. No `DAY.yml`, no warrant audit, no reckoning.

---

# Part IV — THE BUILD PATH

**Stages, by trigger. No dates, anywhere below Stage 0.** A stage begins when its entry trigger fires, which is
a countable condition over a store and not a point in time. **The stages are ordered by dependency, not by
calendar, and two may be open at once** — a co-landing states its own trigger. Every "what reopens" names a
refusal from the REFUSES list below and uses that refusal's own reopen predicate, because a refusal that
reopens on a trigger someone invented later is not a refusal. **This is the only part of the document that
describes the build order.**

## Stage 0 · The thirty days — v1 §15, unchanged

**Entry trigger.** None. This is where the company is.

**What lands.** The fourteen landings below, **in the order given, which is not re-ordered here.** The table is
v1's FIRST 30 DAYS verbatim, founder's amendments already folded in.

> ## 15 FIRST 30 DAYS
> Continuous cadence, no phase numbers. Order is forced by dependency. **Bold** = founder act.
>
> | # | Day | Lands | Unlocks | From |
> |---|---|---|---|---|
> | 1 | 1 | **Demand test posted by hand: one real page, real URL, analytics, posted once, thresholds for pass and for uninformative written first. Day 8: the three numbers recorded.** | The only reading from outside the system. Row 1 of `EXPOSURES.yml`. | all four (D5) |
> | 2 | 1–2 | `scripts/probe-headless.mjs` on haiku: M1, M3, M6, M7, M10, M11, `pmset -g`, `--allowedTools` narrowing (H2). **Founder say-so for the one launchd invocation.** | Go/no-go on packs-as-argv and the loop shape. M3 was MEASURED TRUE on 2026-09-02 (see MEASURE BEFORE BUILD); the remaining go/no-go items are M1, M6 and M7. If any of those fails, the fallback is one generated agent file for `web-feature`, recorded as a fallback. | runtime, minimal |
> | 3 | 2–5 | Task id **and `say:` in one landing**: `logEvent(task, obj)`, `M-####.path#attempt` format, `tasks.jsonl`, `check:taskid`, the `say:` column — plus a first `BRIEFING.md` writer over whatever rows exist. **Day 5: the founder is handed something to look at.** | Cost per mission, `stuck`, X2, every join; and the looking test runs before days 6–19 are spent on it. Unbounded omission cost, cannot be retrofitted. | all four; company's format; founder's choice 7 |
> | 4 | 3–5 | Grant census (D14): `probe-grants.mjs` read-only, `claude mcp list` → `hands.json`. Fix `playwright`'s two-scope failure. | May make the safety list shorter. Rung 0 for pages needs playwright. | creativity, minimal |
> | 5 | 4–5 | Stall repair in `usage.js` (`unresolved` past horizon; clock brake; per-lane) with the 19h ≠ 6h test. **Then the founder registers `budget-guard.js` and the telemetry hooks in one settings edit.** | The loop's only real brake. Registration before repair is a believed brake. | all four (D4); runtime's clock |
> | 6 | 6–7 | `MISSIONS.yml` schema and state table · `next.mjs` (leftmost leaf, determinism test) · `BOARD.md` cap · `STEER.md` · `LIMITS.yml` · `default_if_unanswered:` and the `fused` disposition in the block schema (*choice 2*). | A deterministic next move and a baton; founder silence becomes a recorded decision. | minimal, runtime |
> | 7 | 7–9 | `packs/web-feature.yml` · `pack.mjs` · `pack.test.mjs` · `prompt.mjs` with the byte cap and cache order · the return schema · `warrant_kind:` as a declared-enum label, unused (*choice 4*). | The first compiled argv, and a tested home for authority before it is needed. | runtime, company, minimal |
> | 8 | 8–10 | `tick.mjs` (11 steps, with the `fused` branch and `not_before:` on staged rows) · `oracle.mjs` rung 0 · `embarrass.mjs` · `orient.mjs`. Run once in the foreground, by hand. | The loop exists and has been watched working. | runtime, creativity |
> | 9 | 10 | **Intake for the synthetic venture: `TASTE.md`, one mission with a falsifier, one done-test approved (rung 0 command, rung 1 human).** | The founder's one unavoidable contribution, at the only moment it is cheap. | company, creativity, minimal |
> | 10 | 11–12 | Reach axis (`classifyGrant`, `reach_floors:`) · `outbound-approval` gets its caller in tick step 7 · `expose.mjs`. | The gate exists before any hand does. | all four (D3, D6); minimal's ordering |
> | 11 | 12–13 | Three plists, `caffeinate`, `tick.lock`, `plist.test.mjs`. **First unattended run, daytime, founder present, `reach: local`.** | 24/7 with training wheels. | runtime (D10 amended) |
> | 12 | 13–19 | Synthetic mission runs unattended and is staged, never published. `design.js`'s `total` deleted · `distance.js` · `select.js` · `select.test.mjs` · `archive/INDEX.jsonl` · one variation round (n ≤ 8) on the page; **the founder looks at the cells.** | Acceptance test of the machine; the archive's falsifier clock starts. | minimal (mission), creativity (archive) |
> | 13 | 17–19 | `balcony.mjs` with four verbs · `promote.mjs` → `PAIRS.jsonl` · briefing plist output and `say` · `explain.mjs`. | 2–4 rows a day; the first preference pair has an input. | company, creativity, runtime |
> | 14 | 20–30 | **An owned address a stranger can subscribe to, on the company's own domain, by the founder's hand, before mission 2 publishes** (*choice 3 — yes, later in the month*). **Intake for a real venture.** Mission 2 made by the machine, **published by the founder's hand**, `EXPOSURES.yml` row with `check_on`. `claim-world` registered and returns its first `unresolved`. **One `gemini -p` run from the harness, outside the sandbox, fail-closed on empty stdout (founder authorises)** — a measurement of the single-family risk carried to 2026-11-17, not a mechanism. Day 30: `monthly.mjs` runs (D15, X2, triggers, corrections). | The whole company, at minimum. The company measuring itself. | minimal, company, runtime |
>
> Not in the 30 days, on purpose: any outbound hand · any money hand · inbound into a producing context · a second pack · a second venture · the council · the judge panel · the second family as a mechanism (one measurement run sits in step 14) · voice input · a web UI · the verdict subject generalisation · a phase number.

**One editorial note on the table above, and it is a contradiction this assembly did not create.** Landing 11's
Unlocks cell says *"24/7 with training wheels"*, while §11 of the same document forbids the phrase in any
artifact until `pmset -g` and one measured overnight are on disk. The cell is kept because Stage 0 is
preserved verbatim and the record is worth more than the tidy version; it and the founder's own words in the
census (Part I §1b) are the two standing occurrences named in §11's rule, and they are its allowlist. **No new
artifact may use the phrase.**

**Three of Part II's newer territories land inside Stage 0 and are the ones to watch:** landings 6 and 8 carry
the fuse (§17) · landing 7 carries `warrant_kind:` and landing 8 carries `not_before:` (§16 and §20) · landing
14 carries **the owned address** (§15), intake for a real venture, mission 2 published by the founder's hand,
`claim-world`'s first `unresolved`, one `gemini -p` run, and `monthly.mjs`.

**What reopens.** Nothing. Every refusal below stands.

**What must be measured before Stage 1.** Five readings — and if the month produces a working loop and none of
them, it produced a workshop: **one exposure went out · one outcome came back at a named rung · one preference
pair was written · one field note was read by something that did not write it · the founder's own hand on that
exposure was recorded as row one of the authority ledger.** Plus the two looking tests: the day-8 demand
numbers recorded **without chasing**, and `BRIEFING.md` opened twice unprompted more than 48 hours apart.

## Stage 1 · The instrument reads — and the fork

**Entry trigger.** The balcony's own done-test returns a value. **This stage is a fork, and the fork is the
honest structure of the whole path.**

**If the looking test FAILS** — the founder did not open the briefing twice unprompted, or the day-8 numbers
needed chasing — **the picture stops here and is not worked around.** The correct machine is smaller and
stranger: it stages, does not ask, keeps no register and no rungs, and its value is entirely in the shelf. That
is a real design and it is not this one. Every stage below assumes the pass branch.

**What lands** (pass branch). `AUDIENCE.yml` with its first row, an `instrument:` and a `measured_on`, on the
trigger *the owned address has one subscriber* · `sweep.mjs` as a scheduled reader resolving every past-due
`check_on` · an evaluator for `retry_if:`, so the dead-end field stops being a predicate nothing reads · and
`made_by:` on the exposure row, on the trigger *the first machine-published artifact*, after which the
disclosure decision is permanently more expensive.

**What reopens.** Nothing yet. Refusals 1, 5, 6, 9's worker half, 11, 12 and 13 all stand.

**What must be measured before Stage 2.** The ratio of `no_data` to readings over the first five exposures,
**reported as suggestive and not as a result** — and say in advance that `unresolved` will vastly outnumber
`pass`. A run of consecutive `no_data` is a finding **about the instrument, not about the work**. Second: cost
per surviving exposure stops printing `undefined`, which requires one exposure at rung ≥ 2 to exist.

## Stage 2 · A second of everything, and trust acquires a subject

**Entry trigger.** A mission's approved done-test cannot be met by the granted tools, arriving as a `blocked`
row with `clearable_by: founder` — §02's own reopen predicate. **Which unbuilt pack comes second is set by that
row, not by a plan.**

**What lands.** The second pack, from the family the blocked row names · **pack-field trust**, computed at every
dispatch from the event log and never stored, so a hand-edited value is overwritten · the apprenticeship in
shadow — real moves, real artifacts, ships nothing, one move in five · the retirement counter, zero dispatches
in ninety days, archival with a resolvable stub and never deletion. **Co-landing on its own trigger** — *the
first venture has a rung ≥ 2 reading* — the second venture, `instead_of:` on every dispatch, and a declared
share of the window for venture zero with a floor and a ceiling, because the alternative is the harness taking
everything because it is nearest.

**What reopens.** Refusal 9's **pack-field** half, already narrowed by *founder's choice 1*. Refusal 13, the
second venture, on its own rung ≥ 2 trigger. Refusal 6, the second worker, **only if** one cycle exceeds four
hours *and* the stall counter is clean.

**What must be measured before Stage 3.** Does the trust value **differ between two `(pack × field)` pairs**? A
trust function with one input is a constant wearing a function's clothes. And the fields' own falsifier — a
field note read by a task outside the mission that wrote it — the question of whether four ventures are one
company or four small companies sharing a host.

## Stage 3 · Authority becomes a token

**Entry trigger.** `EXPOSURES.yml` shows the founder performing **the same outbound act by hand three times** —
refusal 1's own reopen predicate, and it reopens **for that act class only**.

**Before anything lands, one measurement.** `grep -rn 'reach' scripts/loop/ packs/` and count the deciders.
**One file and the warrant is a small addition; two and it is a rewrite.** This repository has already paid once
to learn what two risk deciders cost, and the resulting action was taken *during* an incident rather than merely
discovered in it.

**What lands.** The hand admission test as code — loader, wrapper, counter, probe, schema · the first hand,
which passes 1–4 and is therefore a **day** hand, exercisable only against a warrant whose `not_before` is the
morning · `WARRANTS.jsonl`, `policy/warrants.yml` and `minter.mjs` · the warrant object with `artifact_sha256`,
`not_before`, `expires`, `max_calls` and `spend_cents` · `warrant_kind:` starts being **read** rather than
merely refused · and `expose.mjs`'s authority columns become the audit's input rather than a record nobody
joins. **`promotion_n` stays null**, and the minter refuses a standing warrant while it is.

**What reopens.** Refusal 1, narrowly, for one act class. Nothing else — and in particular refusal 2, money
hands, does not, because its reopen predicate is the founder writing `usd_per_day` in `LIMITS.yml`.

**What must be measured before Stage 4.** The max-damage sentence prints **a number**. And the refusal count is
**non-zero**: a mouth-shaped check that has never refused has not been tested, so the measurement is a drill —
one deliberate failure per check, each producing a refusal and a morning row rather than an action.

## Stage 4 · The mouth

**Entry trigger.** **Two hands have passed admission tests 1–5** — a dry branch, a narrower credential, a probe
and a counter — **and no process exists that may hold them.** A night-eligible hand with nothing to hold it is
the countable condition that the mouth is now the missing part.

**What lands.** `mouth.mjs`: one process, single-threaded, **no model in it at all**, holding every outbound
credential and running the eight checks in order — there is nothing in it to persuade · the three rings
separated **by credential rather than by prompt** · `rates.yml` per `(venture × hand × day)`, read at argv
compile time, with **the compiler refusing when the meter is unreadable**, which is Rule 10 applied to money ·
the relay, which holds the socket, the mailbox, the drop directory and the feeds and does exactly one thing
with what arrives: it writes a leaf · `taint: foreign` stamped by the wrapper that fetched it and propagating
into the artifact, with the mouth refusing a tainted artifact absent a morning release · `people.yml` as mouth
check 6, failing closed on an unparseable recipient.

**What reopens.** Refusal 3 is **not** reopened and does not need to be: its own text says a fetch enters only
a no-Write argv, and the relay is additive on top of that rather than a contradiction of it. Refusal 11, new
MCP servers, stays closed — its predicate is *a worker's JSON return cannot express a state change it needs
mid-move*, and the mouth is not a worker.

**What must be measured before Stage 5.** On the worst possible night, **the number the founder set is the
number the ledger sums to**; if those two disagree there is a second authority path. And the stated hole gets a
reading rather than a shrug: how many inbound paths exist that the wrapper does not mediate? Foreign content
arriving by an unmediated path is untainted and nothing notices, so **every path must be mediated or the
property is not a property.**

## Stage 5 · The night stops being a laptop habit

**Entry trigger.** **One measured overnight on the Mac, plus `pmset -g`.** *Founder's choice 6* deferred the box
to exactly this condition, and no new artifact of this company may use the phrase forbidden in §11 until both
are done.

**What lands.** One always-on host that is not the founder's laptop, one cloud twin, and the laptop as a client
— the same `tick.mjs`, the same plists, the same paths, so it is **a purchase rather than a redesign** ·
dual-layer supervision with the layers not supervising each other's failure, and a circuit breaker in the outer
daemon · `idempotent: true|false` on every move with **no default**, because a default is silently wrong for
the dangerous half, and a non-idempotent move takes a lease that survives its death and escalates rather than
auto-restarting · **the absent night reported as absent, never as quiet**: if both hosts die, the morning queue
says *"nothing ran: unreachable since 01:14."* **Co-landing on its own trigger** — *a second mission in
flight*, refusal 5's own reopen — `CALENDAR.yml` and the cost-of-delay term in `next.mjs`, plus `DAY.yml`.

**What reopens.** Refusal 5, the priority function, on a second mission in flight. Refusal 14's `KeepAlive`
clause **only if** the probe shows process startup dominating the cycle; the rest of refusal 14 never reopens.

**What must be measured before Stage 6.** That `next.mjs` is **still deterministic** with the date term in it:
same inputs, same leaf. And the interruption count per night, since the machine now has nights the founder is
not adjacent to — the picture's figure is 0.31 a night over ninety days (illustration), and the point is not
the number but that **when it rose, the answer was to change what the loop attempts overnight, never to weaken
the gate.**

## Stage 6 · The company earns the right not to be asked

**Entry trigger.** The **three-count conjunction** holds for one class of act: the founder has performed it by
hand N times through the queue **and** the machine's nomination matched on the last N occasions **and** the
exposures of that class resolved at rung ≥ 2 with zero incidents. **N is the founder's number, it is
`promotion_n` in `policy/warrants.yml`, and it is not set in this spec.**

**What lands.** The first **standing** warrant, minted by code at a Friday audit — hash-bound, rate-ceilinged,
`not_before`-caveated, logged on issue, exercise and refusal · the weekly warrant audit as the two most
consequential minutes of the only recurring meeting the company has · the dead-man's switch, on its own trigger
*every card fused for N consecutive days*, refusing dispatch rather than proceeding · `HANDOVER.md`, generated,
because unattended authority the founder cannot explain is not transferable · and the monthly report's third
page now carrying warrant classes as well as refusals.

**What reopens.** Nothing new — **this is the stage where the ceiling moves rather than where a refusal falls.**
The three levers, in ascending cost, have deliberately unequal yields: make each decision cheaper (a surface
problem, ceiling about 3×, illustration) · **remove whole classes of decision** (the only lever that raises the
ceiling permanently) · a second human (linear, expensive, and the only one that adds judgement rather than
removing the need for it).

**What must be measured, and it is the measurement the whole path exists for.** **Founder minutes per week
falling while exposures at rung ≥ 2 rise.** Both, in opposite directions. Any other combination — including
revenue up with founder minutes up — is a services business with extra steps, and it does not compound.

## What the build path does not contain, on purpose

**No stage reverses a refusal.** Items 4, 8, 9, 10, 12 and 14 below keep their own reopen predicates and appear
in no stage, because a stage for a refused thing is a plan to reverse a decision nobody has revisited. And two
rules this spec asserts about itself: **nothing merges without a caller in the same diff**, because six of ten
things the founder asked for already existed connected to nothing; and **everything carries `retire_on`,
staggered at creation**, so a quiet month does not produce fifty simultaneous decisions.

## REFUSES — v1 §16, verbatim, with their reopen triggers

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

## WHAT WOULD HAVE TO BE TRUE

Ranked by how much of the picture collapses if false. **M** = measurable inside the first thirty days.

| # | assumption | if false | M |
|---|---|---|---|
| 1 | **The founder looks, and looking is cheap enough to keep doing.** Measured base rate: **zero** | Everything collapses. The correct machine stages, does not ask, keeps no register and no rungs. **Stop the vision rather than work around it** | **YES** — day-8 numbers without chasing; `BRIEFING.md` opened twice unprompted 48h apart |
| 2 | **`--allowedTools` produces ABSENCE, not denial — built-in, MCP, and under launchd.** Half measured true | Every "safe by construction" claim is denial in the costume of physics; the rings collapse into one | **YES** — the cheapest measurement here. Unmeasured half is H2, what a dispatched process can *touch* |
| 3 | **The world answers**, so outcomes are readings rather than `no_data` | No priors form, no reach is earned, trust never grows. **Most likely to be false in a mild, corrosive way** | **PARTIAL** — the ratio over five exposures is suggestive and must be reported as suggestive |
| 4 | **A pack's track record is a coherent subject** (refusal 9's scope) | The ceiling is the founder's morning forever, and lever two does not exist. **Largest consequence-to-cost ratio: a wording question** | no — decided now; testable at the first standing warrant |
| 5 | **Authority stays computed in exactly one place** | Standing warrants are decorative; the audit measures one path while another exists | **YES** — `grep -rn 'reach' scripts/loop/ packs/`, count the deciders |
| 6 | **Owned distribution is buildable by a machine at all** | The accelerator is capped; the company is slower, probably email and search. Not fatal | **PARTIAL** — the channel and first subscriber inside 30 days; throttling needs ninety |
| 7 | **An always-on host is affordable and the loop is portable to it.** Lid shut, nothing runs — measured | The picture does not die; it stops being about the night | **YES** — `pmset -g` and one measured overnight |
| 8 | **Taste extracted from picks generalises into rules a maker can use** | The pairs store is a log rather than a flywheel; the intervention metric never falls | no — needs ~30 pairs; hold out twenty and test prediction |
| 9 | **A rate can be enforced *before* the spend** | Autonomous spend is off the table; paid distribution stays the founder's hand | no — nothing spends in year one, which is why refusal-while-null is honest |
| 10 | **A process with no model can hold the credentials** | The mouth needs a model, and the posture reverts to the founder's hand — **which is year one's posture** | no — deferrable without loss |
| 11 | **A second model family is reachable from the harness** | The panel is single-family and the accepted risk runs to its stated exit date | **YES** — one `gemini -p` run, fail-closed on empty stdout |
| 12 | **Field knowledge transfers across ventures** | The fields are a private diary; concentrate rather than diversify | no — the frame's falsifier dates it 2026-12-02 |
| 13 | **Nothing under the company's name blows up** | Not recoverable by mechanism. **There is no good forward test** — handled by the physics line and the rails | no |
| 14 | **Sample sizes ever reach significance** | The ladder's top three rungs are aspirational and the company should say so | no — the mechanism is a power calculation in the resolver; below threshold, `unresolved`, counted |

---

# Part V — PROVENANCE AND DECISIONS

**How this document came to exist, and who decided what.** Four sealed whole-system designs — company-first,
runtime-first, creativity-first, minimal — were merged by one fresh-context synthesizer and reviewed by the CEO
against an independent reading of the same four. That merge is the year-one frame, preserved verbatim at
[designs/2026-09-02-year-one-frame-v1.md](designs/2026-09-02-year-one-frame-v1.md). Three sealed envisioners
(the flywheel, the founder's chair, the machine's night) then wrote the company fully grown, with the CEO's
position sealed before any returned; one synthesizer merged them into
[vision/2026-09-02-THE-PICTURE.md](vision/2026-09-02-THE-PICTURE.md) (680 lines, provenance on every
paragraph), presented at <https://claude.ai/code/artifact/90440be9-ab88-43a2-8e6a-45f1fae1b35b>. Three spec
groups then wrote territories 01–07, 08–14 and 15–22 in parallel, and this document is their assembly.

**Where the synthesizer overrode the CEO's reading, and what the CEO decided.**

| Topic | CEO's reading proposed | Synthesizer | CEO decision |
|---|---|---|---|
| Policy seam | `policies.yml` allowed as an organising file if every handler declares `can_refuse` | no registry at all — a registry with no refusing handler is A6 at subsystem scale | **accept** — fewer files, same physics |
| Outbound | an `outbound` server with a `stage` verb only | no server; staging is a harness copy plus sha256; all five named servers become harness scripts | **accept** — the only caller is the harness; a server would be unwired inventory |
| Archive falsifier | zero promotions by 2026-10-02 → delete | 30 days after the first `card.yml`; no round by 2026-10-02 is itself the finding | **accept** — a date must follow the landing or it tests the calendar |
| `FIELDS/` | inject and meter | the same, plus its own freeze date (2026-12-02 if no cross-mission read) | **accept** |
| Model judge / second family | a second family as a judge seat in year one | no model judge anywhere in year one; deterministic selection plus the founder's promote; `gemini` only as a measurement | **accept, with the one-run measurement kept inside the 30 days** |
| D9 | accept creativity's taint narrowing | narrow in runtime's form: a fetch enters only a no-Write argv | **accept** — argv over flag |
| D12 | accept the replacement of the count by bytes | narrow: add the byte ceiling, keep the count | **accept** |

Two CEO edits to the synthesizer's build order survive into Stage 0: the `gemini` measurement run inside the
last landing, and the register as one file, `EXPOSURES.yml` — the minimal design's `SHIPPED.yml` is the same
file under another name.

**Where v0's eight open questions went.** Wire-then-delete became *meter, never delete* (§12), with
`budget-guard.js` registered after the stall repair and `design.js`'s `total` deleted (§08). The loop lives
beside the control plane and never inside it (§11). The second model family is one `gemini -p` run from the
harness, a measurement of the risk carried to 2026-11-17 rather than a mechanism (§08). A "move" is one
`claude -p` process per leaf attempt, one task id, exiting (§01, §06). The balcony shows goal-sized rows and
four verbs (§10). The personas do not reconvene in year one, with a named reopen trigger (§06). The hook bypass
stays layer two and untouched; the parenthesis fix is the founder's (§09). Eyes are the Playwright screenshot
at two viewports as rung 0 for a page (§08).

**Reference studies.** Five systems were studied in full before the catalogue and the board; the studies stand
at `docs/02-competitive/reference-systems/{cast,gsd,loops,metaswarm,omnigent}.md`. What they contributed is
recorded where it landed: CAST's task-id-on-every-row and "PostToolUse cannot block" (§01, §09) · GSD's
two-tier blocking-human gate and subprocess competitor CLIs (§09, §08) · Metaswarm's regex transcript
classifier and fresh-instance review gate (§12, §08) · Omnigent's policy seam, studied and refused (§09, and
refusal 4) · the loop primitives (§11). The meta-finding — built-and-never-wired in four of four studied
systems — became D8, D14, D15 and the reopen-trigger discipline of §12 and the REFUSES list. The catalogue
those studies fed is `docs/02-competitive/expansion/`.

**Verdict on the year-one frame, which is why this document exists.** The frame was a SLICE of the full-scale
picture on ten of fourteen territories — the same shape, smaller, growing into the picture through its own
reopen triggers — and merely SMALL on four: refusal 9's scope, authority as a compile-time label, the absent
fuse, and revenue's provenance. Every SMALL is cheap now and expensive later, and each was folded into the
frame as a founder's choice before this assembly began.

**The founder's decisions (AskUserQuestion, 2026-09-02). These bind.**

| # | Choice | Decision | Where it now lives |
|---|---|---|---|
| 1 | Narrow refusal 9: pack-field trust may reopen | **accepted** | §02 · Map 3 · REFUSES item 9 |
| 2 | The fuse: `default_if_unanswered:` and a `fused` disposition | **accepted** | §01 · §10 · §17 |
| 3 | An owned address a stranger can subscribe to, inside month one | **accepted — later in the month**, after the loop has run once | §15 · Stage 0 landing 14 |
| 4 | `warrant_kind:` reserved on the pack schema, unused | **accepted** | §02 · §09 · §16 |
| 5 | Revenue read from Stripe as a claim, never typed | **accepted** | §13 |
| 6 | The night's host: a box instead of the Mac | **deferred — stay on the Mac** until the first measured overnight | §11 · Stage 5's entry trigger |
| 7 | The briefing and `say:` early, not late | **accepted** | §07 · §10 · Stage 0 landing 3 |
| 8 | `not_before:` on every act that leaves, default morning | **accepted** | §03 · §16 · §20 |
| 9–12 | Rate table · the founder's day file · the machine's daily question · second family as a seat that may be empty | designed-in shapes, **no change in year one** | §13 · §17 · §10 · §08 |
| F | The fifteen board decisions as the floor | **all fifteen stand**, amended as above; four narrowed (D8's first half, D9's form, D10's `KeepAlive`, D12 gaining a byte ceiling) | this Part |

**The eight territories the fourteen did not contain** were §15 through §22 above, and each carries its own
year-one disposition in its own slice rather than in a table here: the owned address now · `warrant_kind:`
reserved · the fuse now · obligation following the first customer · disclosure dated to the first
machine-published artifact · `not_before:` now · silence following the explore reservation · succession as a
written acceptance with a review date.

**One number this document deliberately does not contain, and it is the most consequential absence in it.** **N
in the standing-warrant rule** — how many hand-performed acts, how many matched nominations. The machine vision
wrote 40 (illustration); the frame wrote 3 for the much narrower case of a single outbound act repeated by
hand. **There is no measurement behind any value of N, and N is the single parameter that sets how big the
unattended machine may become.** All three spec groups refused to invent it. It appears exactly once, as
`promotion_n: null` in `policy/warrants.yml`, with the minter refusing to mint a standing warrant while it is
null — the same shape as `usd_per_day: null` refusing `reach: spends`. The founder sets it in daylight, on the
day the first class is nominated, with that class's by-hand count in front of them. Three other numbers are
absent for the same reason and are named where they belong: the latency budget that triggers the rebuildable
index (§05), the cache-read floor that triggers re-deriving the prompt order (§07), and the pack ceiling in
`LIMITS.yml` (§02).
