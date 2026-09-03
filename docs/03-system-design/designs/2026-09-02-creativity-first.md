# The whole-system design · creativity-first

**Written 2026-09-02 for the whole-system design round.** One of four parallel designs, from the angle the
founder's complaint names: *the system lost creativity to playbooks, and everything built is a stopping
mechanism.* Shape per `docs/03-system-design/designs/00-BRIEF.md`. Every mechanism cites a catalogue id
(`C*`, `P*`, `W*`, `X*`, `R*`, `T*`, `N*`, `S*`, `B*`, `M*`, `H*`, `K*`, `MEM*`, `CO*`, `CT*`, `RT*`,
`SI*`, `EC*`, `CY*`, `A*` from `docs/02-competitive/expansion/concepts.md`), a repository, or `INVENTED`.
The fifteen board decisions D1–D15 bind; §17 argues against exactly one, with evidence.

---

## 0 · THESIS

**The centre is a producing loop, and the unit of value it accumulates is not the artifact — it is the
archive cell.**

This repository built a truth machine. Every strong mechanism in it answers *is what we just said true?*
— the ledger with forced expiry, the sha256 verdict binding, the classifier, the 48-step suite. That is
rare and none of the five surveyed systems has an equivalent. It is also, structurally, a machine of
refusals: every one of those mechanisms can only ever say *no* or *unresolved*. A company built entirely
out of refusals produces nothing, and that is exactly what happened — 171 session files, essentially all
about the harness itself.

So the design puts a **production machine** beside the truth machine, on the same footing, with the same
discipline. Creativity in a machine is *variation plus selection plus memory of what was already tried*
(`concepts.md` §1). Each of those three has a failure mode with a different smell: weak variation gives
sameness, weak selection gives regression to the mean, weak memory gives circling. This design gives each
one a file, a format and a check.

**The structural move that makes creative range compound: every candidate is kept, in a cell.** Today a
design round makes four variations, scores them 0–10 on four axes, sums the scores, sorts, ships one and
deletes three. That is the worst of both — full cost on every variant and nothing retained. Instead:
generate many and cheap, keep **all** of them in a MAP-Elites archive indexed by declared behaviour
descriptors, finish only the finalist, and treat the archive as the durable asset. The winner is just the
cell you shipped from this time. Two append-only stores with expiry then sit side by side and feed each
other: **the ledger accumulates correctness capital, the archive accumulates creative capital.**

**What serves what.** Missions exist to give the loop something to vary against. Memory exists so the loop
does not re-tread. Hands exist so the loop can make things that are not text. Control exists to bound
exactly one thing — the publish boundary — and nothing else. The balcony exists to put the founder's taste
into the loop once, in a form that compounds. Runtime exists so the loop turns at 3am. Nothing in this
design is a stopping mechanism except at the door.

**The line, stated up front because §9 is where it will be argued.** A 24/7 unattended loop with real
hands is where creativity and safety collide. My answer is that they collide at **one place** — the
publish boundary — and nowhere else. Everything the loop does before that line is undone by `rm -rf`. So:
make the workshop enormous and the door narrow. **At 3am the loop may make anything and publish nothing.**
Overnight output is a morning gallery, not a night of publications.

---

## 1 · Missions & drive

### What it IS

Four files, one state machine.

```
MISSIONS.yml          the goal tree — uncapped depth (D12), one in flight (P5)
BOARD.md              the baton — SBAR shape, per-section byte cap, rewritten each cycle
DEAD-ENDS/<slug>.md   one file per failed approach
.agentvibe/approaches.jsonl   one row per attempted approach hash
```

**The mission format.** A mission is commander's intent (`P7`), four fields, and the schema refuses a
fifth:

```yaml
# MISSIONS.yml
- id: m-landing-fakeco
  task:        "a landing page for FakeCo that a stranger understands"
  purpose:     "prove the machine can hold a mission end to end"     # one level up
  end_state:   "it renders, and a stranger states the offer in 5s"   # testable
  constraints: { pack: web-feature, budget_usd: 12, reach: internal }
  falsifier:   { move: m-landing-fakeco-f1, cost_usd: 0.4 }          # C36
  unlocks:     [m-pricing-fakeco]                                     # C35
  novelty_expected: high                                              # C31
  state: in_flight
```

There is **no `method:`, no `steps:`, no `how:`**. That is the founder's complaint expressed as a schema.

**The goal tree is uncapped and everything else is capped.** D12 puts the ceiling on governed artifacts —
packs, personas, workflows, commands, skills, suite steps — and explicitly not on the goal tree. This
design reads that as licence: *think big lives in the depth of the tree, and in the width of the archive,
never in the count of mechanisms.* Archive cells and dead-end files are **data, not governed artifacts**,
and are therefore outside the ceiling. I state that here so nobody has to re-derive it under pressure.

**What "done" is.** The agent proposes a done-test after ORIENT; the founder approves it once; it binds
(§4 of `STARTUP-OS.md`). Every done-test names a rung on the evidence ladder (`W2`): **0 it renders · 1 a
stranger understands it in five seconds · 2 someone clicked · 3 someone came back · 4 someone paid.** A
rung-0 result may never be phrased as a rung-2 claim, and aggregation *across* rungs is refused (D7).
**No done-test's resolver is the producing model, anywhere** (D7, `A3`).

**Priority.** Deterministic, computed, printed with its arithmetic — `scripts/next.mjs` over declared
fields (`P1`), with `instead_of:` emitted for free on every dispatch (`EC3`). The model fills fields; it
never picks. One field is sourced through `claim-source` so it cannot be asserted without a URL and a
quote: `evidence_of_demand`, which is the field the filling system benefits from inflating.

**Abandonment.** Forced re-justification, not a hard kill (`P6b`): at the trigger the goal must be
re-argued from zero in a brief that may not reference prior investment. A lint fails spend language in
that brief — crude, and the same class of check `schema-lint.js` already runs when it refuses a playbook
stage carrying `steps:`.

**Blocked, stuck, stalled — three states, three sources** (`B1`, `B2`):

| State | Authored by | Detected how | Response |
|---|---|---|---|
| `blocked` | the worker, with `clearable_by:` | declaration | a person |
| `stuck` | nobody | N distinct approach hashes on one goal, none passing | a different method, or the panel |
| `stalled` | nobody | the stall ceiling — output tokens since the last durable artifact | a kill |

A worker cannot author `stalled` and the meter cannot author `blocked`, so they can never be confused and
no classifier is needed. A block with no `until:` is refused at write time; when it comes due exactly one
disposition is recorded — cleared, escalated, or waived with a new deadline (`B3`, Rule 9's shape applied
to a new object). Blocked frees the mission slot (`B5`).

**The loop's cycle.** ORIENT → PROPOSE → MAKE → ATTACK → SEE → ARCHIVE → done-test. §5 of `STARTUP-OS.md`
has the first six words; this design gives ORIENT, ATTACK and ARCHIVE files. They are §2, §8 and §5 below.

### Built from

`P1` `P5` `P6` `P7` `C35` `C36` `B1` `B2` `B3` `B5` `W2` · `gastownhall/beads` for the dependency-graph
shape (`open-source.md` §8) · `MrLesk/Backlog.md` for markdown-tasks-in-git.

### Board decisions binding

**D7** (no self-scored done-test, no summed scores; the first mission's done-test is rung 0 and 1 only) ·
**D12** (ceiling on governed artifacts, none on the goal tree) · **D1** (task id on every row).

### Enforced by

`scripts/missions.test.mjs` — a state machine in data, transitions enumerated, a transition not in the
table refused. `schema-lint.js` extended with the `P7` predicate it already owns: a mission or move brief
carrying `steps:`, `how:`, `method:` or `implementation:` fails. `scripts/next.mjs` has a determinism test
— the same `MISSIONS.yml` always yields the same pick. `claim-freshness` resolves block expiry, unchanged.

---

## 2 · Workers & roster

### What it IS

**Seven engines survive. A worker is `engine + pack`, and the pack is a grant and a stop.** No new engine
is created by this design.

**ORIENT is the phase this section exists to make real.** In `STARTUP-OS.md` §5 it is two lines of prose
in a diagram — *"do I know this field? no → who does this best? pull references"* — and nothing checks it
happened. Prose in a prompt is exactly what the founder is complaining about. So:

**ORIENT is computed by the harness, before the worker exists, and injected. The worker cannot skip it
because it is not the worker's job.** `scripts/orient.mjs` emits one block; the dispatch wrapper prepends
it. This is the pattern that made the QA oracle trustworthy — the harness does it, not the agent.

The block has five parts, each with a file behind it:

| Part | Source | Catalogue |
|---|---|---|
| Dead ends for this (field, tool) | `DEAD-ENDS/`, grep by field and tool, actual entries capped by byte budget — never a summary | `C25` |
| Approaches already tried on this goal | `.agentvibe/approaches.jsonl`, the hash list | `C24` |
| Archive coverage | `archive/<field>/INDEX.jsonl` — which cells are occupied and with what | `C2` |
| Three exemplars — good, bad, near-miss | `FIELDS/<field>.md`, each with a source resolved by `claim-source` | `C16` |
| One or two thinking models with their stop rules | `.claude/skills/routers/`, selected by move shape, injected by the harness not chosen by the agent | `K2` |

**When the field file does not exist, ORIENT becomes a field-learning move** (`K1`), bounded by its
outputs and not by a step list: **five practitioners named · three canonical artifacts sourced · seven
rules extracted · one proposed done-test.** Then stop. `sourced: partial` is allowed with the gaps named.
This is Decision 6 — *agents learn new fields themselves* — given a shape that cannot become a playbook,
because it constrains only the exit.

**The first four packs** (Decision 6): `web-feature` · `design-brand` · `content-video` · `customer-market`.

```yaml
# packs/design-brand.yml
tools:       [Read, Write, Edit, Bash, Glob, Grep]
mcpServers:  [playwright, figma]
reach:       internal                      # D3 — declared on the GRANT
reversible:  yes                           # R2
blast_radius: self                         # R2
done:        <proposed by the agent, approved once by the founder, then binding>
budget:      { stop_after_failed: 3, sketch_budget_turns: 6, finish_budget_turns: 30 }
variation:                                 # the block that makes this a producing pack
  n: 8
  descriptors:                             # C2 — refused if absent when variation: is present
    - { name: density,   bins: [sparse, medium, dense] }
    - { name: metaphor,  bins: [editorial, product, poster] }
  novelty_slots: 2                         # C3 — judged only on distance, quality ignored
  anti_inbreeding: true                    # C7 — ≥1 candidate never sees the leader
  constraints_deck: decks/constraints-visual.yml     # C9
  transfer_deck:    decks/transfer-far.yml           # C13
  diversity_floor:  0.34                             # C8
retire_on: 2027-03-01                      # X3
```

**How many at once.** WIP limit of **one mission** (`P5`); parallelism lives **inside** a mission, across
variants, which is where it is cheap and where it is the whole point. Eight makers in parallel on one
brief is the shape; two missions in parallel is not.

**Fresh context per unit of work**, always. That is a quality rule as much as a cost rule (`C29`).

**Maker and editor are never the same context** (`C29`). The editor's brief is *subtractive* — what would
you remove — because the measurable failure mode of language-model revision is length growth. The editor's
return schema requires `removed:` non-empty and `added:` empty or justified, and the length delta is
reported both directions, never optimised.

**No worker trust, and the subject is dissolved rather than deferred** (D11). Fresh context per move plus
a pack that is a grant and a stop leaves no persistent worker for trust to accrue to. `T1`–`T5` are
refused for year one. One narrowing, stated so it is not smuggled: **D11 is about workers, and this design
does calibrate judges** (§8) — the judge's prompt persists across every dispatch and is a different
subject. I read D11 as leaving that untouched; if the board disagrees, the mechanism at issue is
`taste/PAIRS.jsonl` and it should be named directly.

### Built from

`K1` `K2` `C16` `C24` `C25` `C29` `P5` `H1` · `STARTUP-OS.md` §4 (a pack is a grant and a stop) ·
`sourcer`'s live precedent — `tools: [Read, Glob, Grep, WebSearch, WebFetch]`, `mcpServers:
[claim-append]`, **no `Write` and no `Edit`**.

### Board decisions binding

**D11** (worker trust dissolved) · **D12** (four packs, and adding a fifth above the ceiling retires one) ·
**D3** (reach declared on the grant).

### Enforced by

`scripts/orient.test.mjs` — with a matching dead-end on disk, the constructed prompt **contains it**;
with an occupied archive cell, the prompt names it; the injected thinking model resolves to a real
directory under `.claude/skills/` (the dead-path check `check-registration.mjs` already performs). Every
extractor carries a **positive control** — a known-present pattern it must still find — so an extractor
silently going to zero is a red test, not a quiet pass (`M2`'s rule, and the repo's own grep-control
idiom). `schema-lint.js` refuses a pack carrying `variation:` with no `descriptors:` — the identical shape
to its existing "declares `mcpServers` that no configuration backs" rule.

---

## 3 · Hands

### What it IS

**The hands are already bought and mostly unreachable: ~15 MCP servers connected, 2 of 18 agent files
declare any.** This design does not buy more before it uses those.

**Granted to whom.** The grant is a property of the **dispatch path**, not of the agent file (D14 measured
this: five personas dispatched with no agent file held the full 15-server roster including `tiktok_publish`,
`sandbox_exec` and Gmail `send_message`). So the first hands work is a **census, not a connection**:

`scripts/probe-grants.mjs` — dispatch a worker whose only job is to call each granted tool once, read-only
or dry-run, and report (`H2`). The output is a matrix of what is *actually reachable from inside a
dispatch*, which is a different question from what is configured. `scripts/probe-workflow-reach.mjs` is
the working precedent: it measured 0 of 55 `Workflow` calls from a sidechain against 57,590 subagent
`Bash` calls, and that measurement turned a believed gap into a deliberate containment. A tool with no
read-only invocation is recorded **unprobed**, never assumed to work.

**Narrowed how.** Reach, reversibility and blast radius are declared on the **grant**, once, at the moment
a capability enters the system (`R2`) — not per call site, where they would be declared hundreds of times
and wrong somewhere. An action's reach is then *derived* from the tools it used.

**The five servers to build.** Ranked by what they unlock for the producing loop:

| # | Server | Why it is the producing loop's | From |
|---|---|---|---|
| 1 | **`archive-append`** | The archive must be written by the harness, not by an agent's discretion. One audited append path, the same shape as `claim-append`, which is one file. Without it, "keep every candidate" is a wish. | `INVENTED` on `claim-append` |
| 2 | **`outbound`** | The **single** wrapper for every worldly act: publish, send, spend, contact. Dry-run by default; the send call takes the artifact's **hash** so the artifact exists on disk and is inspectable (`R4`, and #116's lesson — an unknown flag must refuse, not perform the non-dry action). | `R4` `R5` `R6` |
| 3 | **`transcripts`** | 2,936 files on disk, nothing reads them. `usage.js` already walks every one. Exposed as a server, it is the measurement base for `M1`–`M4` and it is one file. | `M2`, `hands.md` §6 item 9 |
| 4 | **`world`** | The `verified_by: world` resolver's hand — PostHog first (analytics + flags + replay + errors + SQL in one free hosted endpoint). **Deterministic parse into a data file, never a fetched body into a producing context** — the risk-modeler's concession, honoured literally. | `W1`, `PostHog/posthog` |
| 5 | **`distance`** | Trigram Jaccard and, where an embedder exists, embedding distance. Every creativity mechanism in this design depends on it: the diversity floor, novelty slots, the boredom detector, recombination-versus-averaging, the selector's tie-break. It is `scripts/lib/distance.js` exposed once. | `C8` `C3` `C23` `C31` |

**What is refused, and the reason each refusal protects something:**

- **`sandbox_exec`** — remote code execution through a media server, live today. Never granted to any pack.
  It is the widest capability in the connected set and it is attached to the server everyone thinks of as
  "the video one".
- **`tiktok_publish`, Gmail `send_message`, any ad-platform write** — refused **on the grant** until the
  `outbound` wrapper exists and D2's rate ceiling has a number the founder supplied. A missed send costs
  nothing; a wrong send cannot be recalled.
- **`n8n` while unauthenticated stays unauthenticated for now.** Once authorised it can reach anything its
  credentials reach, and an agent driving it inherits all of it. It is the strongest argument in the whole
  catalogue for per-worker grants, and it is also inbound (D9).
- **Worker-to-worker messaging tools** — nobody holds one (§6).
- **Any new vendor before the census.** The measured base rate is six of nine surveyed things unwired; five
  new connections on that base rate produce five new unwired capabilities and a false sense of reach.

**What is connected, cheap and serves the loop directly:** `higgsfield`'s `_batch` + `jobs_wait` is
literally the shape of overnight work — twenty variants queued at 2am, in the gallery at 6am — and
`virality_predictor` is a **pre-publication oracle that is not a code test**, the first non-code oracle
this company owns without building anything. Both sit entirely inside the workshop; neither crosses the
door.

### Built from

`H1` `H2` `H3` `R2` `R4` `R5` `R6` `W1` · `hands.md` §0.1 (roster health), §1.1 (higgsfield's 84 tools),
§6 (the ranked list), §8 (*"the riskiest capabilities are already granted and the cheapest safe ones are
not"*).

### Board decisions binding

**D2** (no outbound money before an enforced rate ceiling) · **D3** (reach on the grant, one classifier) ·
**D9** (inbound last — see §17, where I argue for a narrowing) · **D14** (the dispatch-path grant census as
a day-one measurement).

### Enforced by

`schema-lint.js` already fails an `mcpServers` declaration that no configuration backs; extend it to fail
a grant carrying no `reach`/`reversible`/`blast_radius` declaration. `scripts/probe-grants.mjs` writes a
matrix and a suite step fails when a granted tool is `unprobed` and not explicitly waived.

---

## 4 · Knowledge

### What it IS

**Exemplars over rules.** `FIELDS/<field>.md` is global (Decision 9) and its core is **three annotated
exemplars — a good one, a bad one, and a near-miss** — each with a source and each with what makes it what
it is (`C16`). Rules are derived from and subordinate to the exemplars. Klein's recognition-primed
decision model is the claim underneath: experts do not run rules, they recognise cases. A field file with
rules and no exemplars fails lint.

**Taste is a rubric, not a reference pile** (`C15`). References go into an extraction step; a written
rubric comes out — *"type scale is 1.25 not 1.333; every section has exactly one accent; motion is
120–180ms and only on enter"* — and **the rubric is what the founder approves**. The maker then works from
the rubric and never sees the references, so it produces rather than copies. A test asserts the maker
prompt contains no reference URL. Rubric items that are numeric are mechanically checkable against the
artifact.

This is how "taste enters once" (§7 of `STARTUP-OS.md`) becomes "taste enters once **as rules the system
now owns**". It is also the honest limit: the extractable part of taste is the measurable part, and the
measurable part is not the interesting part. Rubric extraction gets you correct proportions and not a
point of view — which is why it is paired with the far-transfer deck (`C13`), where the point of view
comes from.

**Global facts, project taste — enforced by scope, not convention** (`K3`, Decision 9). A `global` field
file containing a project's proper noun fails a lint; examples live in a marked block excluded from the
check. The ledger already carries `scope: global|project` on every claim, so the concept is live.

**How a worker finds what it needs: it does not look. The harness hands it over.** The two-tier router
stays for interactive sessions; for a dispatched worker, `scripts/orient.mjs` selects and injects. This
is the cure for the measured disease — **134 skills including 28 mental models with stop rules, cited by
0 of 18 agents** (`grep -rl 'thinking-' .claude/agents` → 0 of 18, against a control of 9 files for
`brainstorming`). A library nobody loads is not a knowledge layer; injection at the chokepoint is what
makes it one, and the return must name which model it used and what the model's stop rule said.

**The decks are knowledge too, and they are the cheapest creativity intervention available.**

```yaml
# decks/constraints-visual.yml        C9 — Oblique Strategies, mechanised
- { id: k1, text: "no images at all",              checkable: "artifact contains no <img" }
- { id: k2, text: "one colour besides black/white", checkable: "≤2 hex values in the stylesheet" }
- { id: k3, text: "works at 320px",                checkable: "playwright render at 320 has no overflow" }
- { id: k4, text: "explain the whole offer in nine words" }
- { id: k5, text: "no hero section" }
- { id: k6, text: "it must be legible with JavaScript off" }
```

```yaml
# decks/transfer-far.yml              C13 — forced-far analogy
- "a Japanese railway signage system"
- "a hospital triage board"
- "a chef's mise en place"
- "a 1970s hi-fi faceplate"
- "a submarine control room"
```

A constraint is **binding, not advisory**, drawn without replacement, recorded with the artifact, and
where it is mechanically checkable it is checked and the variant fails if violated. A transfer variant
must name **what it took and what it dropped**, and `what_transferred` must name a *principle* — a railway
information hierarchy, not a railway aesthetic.

### Built from

`C9` `C13` `C15` `C16` `K1` `K2` `K3` · Klein, *Sources of Power* · Eno & Schmidt, *Oblique Strategies*
(1975) · `stanford-oval/storm` and `assafelovic/gpt-researcher` as the shape of the field-learning move.

### Board decisions binding

**D12** (decks and field files are data, not governed artifacts, and sit outside the ceiling — stated
explicitly so nobody argues it later) · **D7** (a rubric is not a score; nothing in it is summed).

### Enforced by

`FIELDS/` schema requires `exemplars: [3]` with a source per exemplar resolved through `claim-source`,
which fetches the URL and asserts the quote is present — so invented references fail. Same expiry as any
other claim, so exemplars rot on schedule, which is the mitigation for three being a small sample.
`scripts/orient.test.mjs` asserts a thinking model is present in the constructed prompt and that the
maker prompt contains no reference URL.

---

## 5 · Memory

### What it IS

**Six stores. One rule each. The two that are new are the point of this design.**

| Store | Holds | Authored by | Scope | Expires |
|---|---|---|---|---|
| `MISSIONS.yml` | the goal tree and done-tests | orchestrator | project | when the goal closes |
| `BOARD.md` | the baton: SBAR, per-section cap | each cycle's worker | project | rewritten every cycle |
| `FIELDS/` | how a field works, exemplar-first, sourced | any worker, via `K1` | **global** | **yes — through the ledger** |
| `taste/<project>/` | rubric, no-gos, and `PAIRS.jsonl` | founder, via the balcony only | **project** | pairs expire; rubric on founder change |
| **`archive/`** | **every candidate ever made, in a cell** | the harness, never an agent | project | **never — it rotates by volume** |
| **`DEAD-ENDS/`** | **what failed, and what would make it worth retrying** | the worker at close | project | reviewed on `retry_if` |

**The archive is the store this whole design is organised around.**

```
archive/<project>/<field>/<d1>-<d2>/<task-id>/
    artifact.*            what was made
    card.yml              the cell's record
archive/<project>/<field>/INDEX.jsonl
```

```yaml
# card.yml
task_id:        t-2026-09-02-0031
cell:           [dense, poster]
round:          r3
pitch:          "One long scroll, one accent, the offer in nine words above the fold."   # C26, ≤60 words
constraint:     k4                       # which card was drawn
transfer:       "a hospital triage board"
what_transferred: "severity-ordered reading, not colour"
complete:       true                     # C10 — fragments are archived, never ranked
novelty:        0.41                     # distance from this project's corpus, C31
shipped:        false
```

**Three rules that make it an asset rather than a pile:**

1. **The harness writes it, not the agent.** The archive write is a workflow step. An agent that decided
   what was worth keeping would keep the safe things.
2. **A round that fills no new cell records `filled: 0` and is not a success.** Coverage is the metric,
   not the peak (`C2`, `C3`).
3. **Nothing is deleted to meet a cap.** Volume rotation — `INDEX.jsonl`, `INDEX_002.jsonl` — bounds what
   one reader must load, never the lifetime total. That is this repo's own rule about `DECISIONS_ARCHIVE`,
   applied to a new object, and it is right for the same reason: a cap on the lifetime total of an
   append-only creative log is a mechanism for losing the good idea you had in March.

**Retrieval.** By cell, by field, by descriptor, by novelty. Retrieval into ORIENT is done by the harness
(`C25`) so it cannot be skipped, and it injects **the actual entries capped by byte budget, not a
summary** — a summary of a dead end is how a dead end gets re-attempted.

**Conflict.** Newer wins, older superseded **in place with the evidence that moved it** (`MEM2`) — the
practice `CLAUDE.md` already follows by hand and the single best thing in that document. Anything cited by
a live claim is **pinned** and cannot be silently dropped.

**Forgetting is a tool, not a judgement call** (`MEM3`). `scripts/evict-memory.mjs` already mechanises four
rules for `DECISIONS.md`, prints the **net** bytes each eviction frees, refuses what the rules forbid, and
checks that no byte was lost. Point it at `FIELDS/` and `DEAD-ENDS/`, re-deriving the four rules for the
new object type rather than assuming they transfer. **Never hand-edit an entry out of a store.**

**The episodic/semantic split, named** (`MEM1`): `events.jsonl` records what happened; the ledger records
what is true. **An event is never evidence for a belief without a claim.** A check asserts no resolver
reads `events.jsonl` as a truth source.

**What transcripts are for: instrumentation, never memory** (`A4`, `M2`). RAG over 2,936 transcripts
resurrects superseded beliefs stated confidently — retrieval cannot tell a corrected belief from a current
one, which is exactly what the supersession discipline exists to prevent. Take them as measurement:
`M1` the regex correction classifier (~50 lines, and mechanical beats asking a model to notice), `M3`
promises that never landed, `M4` where sessions die.

### Built from

`C2` `C25` `C26` `C31` `M1`–`M4` `MEM1`–`MEM3` `N1` `A4` · `icaros-usc/pyribs` (the archive abstraction,
applied to work products rather than genomes) · `riponcm/projectmem` (an append-only typed log with a gate
that warns before repeating a failed fix) · this repo's `evict-memory.mjs` and archive-rotation discipline.

### Board decisions binding

**D12** (archive cells and dead-end files are data and uncapped; the *mechanisms* that read them are
governed and capped) · **D1** (every archive card carries the task id, and this is the retrofit that
cannot be done later).

### Enforced by

`scripts/archive.test.mjs` — a round with N candidates writes N cards; a card with no task id is refused;
`filled: 0` is a distinct recorded outcome from a successful round. `scripts/check-archive.mjs` as a suite
step: every `INDEX.jsonl` row resolves to a file on disk (the dead-path check, pointed at a new corpus).
The loop refuses to close a move with `outcome: abandoned|failed` and no dead-end file, the same way the
documentation gate already refuses a task with no session file.

---

## 6 · Communication

### What it IS

**Orchestrator ↔ worker: a brief in, a structured return out, nothing in between.** The brief is
commander's intent (`P7`). The return is validated against the pack's schema and a return missing a
required field is a failure, not a warning — *never trust a subagent's silence or its report*.

**Worker ↔ worker: never** (`CO3`). A worker's only outputs are its artifact and its rows. To reach
another worker it writes a row the dispatcher reads. Every inter-worker communication is therefore
auditable, replayable, and passes through something that can refuse it. This is enforceable **today** —
16 of 18 agent files hold no MCP tool at all, so the restrictive default already exists and only needs to
become deliberate rather than accidental.

The named exception is a **pod**: two workers sharing one dispatch, for genuine pair work (maker and
editor iterating). It is declared, not discovered.

**The baton is `BOARD.md` in SBAR shape** (`CO1`): **Situation · Background · Assessment · Recommendation**,
four sections, always present, "nothing" allowed, **per-section byte cap** so one section cannot eat the
budget. Recommendation must name a specific next move id, checkable against `MISSIONS.yml`. Hospitals
adopted SBAR because free-form handoff kills people; the structural argument transfers even though the
stakes do not.

**Read-back on the baton** (`CO2`): the receiver restates it in its own words in a required
`understood_as:` field, and the distance function flags a large divergence as a **finding, not a block** —
the receiver may be right and the baton wrong.

**Collisions: leases on path prefixes, not file locks** (`CO4`). A worker declares the prefixes it will
write and takes a time-limited lease; overlap with a live lease is refused **at dispatch**, not discovered
at merge. Leases expire, so a dead worker does not hold ground forever. `bin/warroom` already implements
cross-worker file overlap detection and this is that feature reborn as data. Worktree isolation is the
complement, not the substitute — this repo has measured that isolation between agents inside a session is
*a convention they keep, not a rule anything enforces*.

**Help requests carry what was tried** (`N3`), and this is the design's cleverest piece of thrift:
recording a failure as a separate act is a tax, and taxed acts are skipped. The moment a worker most wants
to write down what failed is the moment it asks for help. So a help request is a typed event with a
required `tried:` list — approach and outcome per entry — refused without it. The list is simultaneously
the help request's context **and** a dead-end record.

**The escalation ladder has maximum dwell times** (`B4`): L1 the worker tries another approach (max: the
stall ceiling) · L2 the panel convenes (max: one cycle) · L3 the founder is woken (no max — their call).
Exceeding a dwell **auto-promotes**, mechanically. The empty-Inbox failure is what happens when promotion
requires a judgement.

### Built from

`CO1`–`CO4` `N3` `B4` `P7` · SBAR (clinical handoff) · FAA AC 120-51E, challenge-and-response.

### Board decisions binding

**D11** (no worker trust — and star topology is part of why trust has no subject) · **D1** (a redirect with
no task id is refused).

### Enforced by

Tool grants: no pack grants a messaging tool, and `schema-lint.js` fails one that does. `BOARD.md` schema
lint: four sections, per-section byte cap, `Recommendation` resolving to a real move id. The event schema
refuses a `help` event with no `tried:`; `scripts/lib/events.js` already writes typed events and a typed
event with a required field is a solved problem here.

---

## 7 · Context & cost

### What it IS

**What is injected into whom.** Only the harness injects. The ORIENT block (§2), the pack's decks, the
taste rubric, the relevant preference pairs, `STEER.md` if non-empty. Nothing is "available if the agent
chooses to look".

**The byte-budget ratchet** (`CT1`): a declared cap per injected surface that only ever ratchets **down**.
Exceeding it does not raise the cap; it forces a two-tier split — ids and one-line summaries, full content
on demand. The precedent is measured twice in this repo: skills discovery ~15,000 → ~1,070 tokens, and
`session-start.js` 27,069 → 2,941 bytes (#76), a 9.2× cut with no content lost. At 27KB the runtime
*truncated* the payload, so the lenses never reached agent context at all — the failure mode is not
expense, it is silent absence.

**The task id** (`CT2`, D1). One id, minted at dispatch, carried by every event, cost record, artifact,
verdict, archive card and balcony row. Parent/child from the start, because adding a hierarchy later has
the same retrofit problem as adding the id. The dispatch wrapper **refuses to dispatch without it**. CAST
is the cautionary evidence: it needs a heuristic 60-second time-window join because there is no foreign
key, and that is not retrofittable. Measured during the board meeting: 3,813 rows at
`~/.agentvibe/events.jsonl` and the only id-shaped keys ever written are `id` and `dry_run`.

**Caching.** Keep engine prompts and pack grants stable — they cache at 10% of input cost. The variable
part of a maker's prompt is the constraint card, the transfer source and the ORIENT block, which is
exactly the part that *should* vary. Cache discipline and variation discipline point the same way here,
which is unusual and worth exploiting: **the stable prefix is the grant, the varying suffix is the idea.**

**Batch is the shape of overnight work.** `higgsfield`'s `_batch` variants plus `jobs_wait` let twenty
variants be queued at 2am and collected at 6am, at one dispatch's context cost rather than twenty.

**Compaction declares what it dropped** (`CT3`). A manifest — what was summarised, what was dropped, where
the full record lives — stays in context while the content does not, so the agent can *ask* for what it
lost. `WISH` on native compaction, which the runtime performs and this repo does not control. Enforceable
for what the system owns: the baton, injected surfaces, harness-side summarisation.

**Cost per mission** is a query given the task id, and the metric that matters is **cost per *surviving*
artifact** (`EC2`) — spend divided by artifacts that passed a world-verdict rung ≥ 2. A month of cheap
runs producing nothing has an **undefined** cost per surviving artifact, and Rule 10 says report undefined
as undefined, never as zero and never as excellent.

### Built from

`CT1` `CT2` `CT3` `EC2` · CAST's missing foreign key as the cautionary case · `ccusage/ccusage` (cost from
transcripts, zero instrumentation).

### Board decisions binding

**D1** — the only decision on the board whose omission cost is unbounded. Every row this design writes
carries it from the first row.

### Enforced by

The dispatch wrapper refuses without an id; the row schema requires it; a suite step asserts no row lacks
one. `scripts/check-budgets.mjs` compares emitted bytes to the declared cap per injected surface and fails
above it. Measure the on-demand load rate: if it is near 100%, the tiering failed and the cap moved cost
rather than removing it.

---

## 8 · Quality & truth

### What it IS — and this is where ATTACK stops being a word

**ATTACK is three mechanisms and a deterministic function, in four files:**

```
.claude/attack-lenses.yml     the dimensions, same shape as review-lenses.yml
scripts/attack.mjs            the panel dispatcher — blinding, twins, the dissenter, the second seat
scripts/lib/select.js         the selector — pure, deterministic, no scores
scripts/select.test.mjs       the blocking assertion that keeps all of the above honest
```

**1 · The panel returns findings, never a score.** Each judge returns findings with a severity. That is
the union rule this repo already holds and its own `design.js` violates: line 55 declares `total: { type:
'number', description: 'sum of the four (0-40)' }` and line 111 sorts by it. **That single field is the
live instance D7 names, and deleting it is the smallest diff with the largest correction in this design.**

**2 · Selection is arithmetic over findings** (`C17`), in `scripts/lib/select.js`:

```
eliminate every candidate carrying a P1 finding
among survivors, prefer the fewest DISTINCT P2s
tie-break on ARCHIVE DISTANCE — the candidate furthest from the occupied cells — never on preference
if every candidate carries a P1, the round is `unresolved`, never "least bad"
```

The judges are finders; the selector is a function. Determinism is the whole property and it is testable:
the same findings always yield the same pick.

**3 · Blind pairwise, with swapped twins** (`C1`, `C19`). Judges compare two candidates and say which is
better *and why*, with identities stripped — `design.js` currently passes the judge the variation's
`angle` label, and "bold / brand-forward" is not a neutral string — presentation order shuffled per
comparison, lengths noted so a length-correlated verdict is visible. Every pair runs twice with the order
swapped, and **a pair where the judge flips resolves `unresolved`**: a flip means the judge could not
tell, which is information rather than a tie. Swiss-style pairing rather than round robin keeps it at
log N rounds instead of O(N²).

**4 · The rotating designated dissenter** (`C28`). One worker per cycle is dispatched with the explicit and
sole job of arguing the work should not ship. The role rotates **by task id parity**, deterministically, so
it is never the same seat and dissenting is never costly. Its findings enter the union like any other's.
Janis's remedy, and the key word is *assigned*.

**5 · The Braintrust rule — feedback has no authority** (`C20`). The panel returns findings; the **maker**
decides which to act on and records `findings_declined: [{finding_id, reason}]`. The workflow refuses a
return that neither addresses nor declines a P1. A finding silently dropped is the failure this catches,
and set difference catches it mechanically. This is the same wall as *a persona may never be dispatched to
produce*, seen from the other side: when a reviewer can mandate a fix, the maker optimises for the
reviewer and the work becomes a compromise.

**6 · Deferred judgement, enforced in capability** (`C18`). During MAKE, the maker's prompt carries **no
rubric, no scoring axes, no quality-bar language**, and the dispatch cannot reach a judging tool. Osborn's
rule, mechanised: evaluation during generation kills generation. A test asserts the maker prompt contains
none of the rubric strings.

**The oracles.** Deterministic first, always, before any panel agent is dispatched — `qa.js` already does
this and it is the reason the gate is trustworthy. Two new deterministic oracles for non-code work:

- **`scripts/embarrass.mjs`** (`C38`) — placeholder strings, TODOs, `#` hrefs, unreplaced template
  variables, duplicate headings, alt text equal to the filename, a colour outside the project palette.
  This converts `CLAUDE.md` Rule 6 from `ADVISORY — no mechanism` into `ENFORCED`. **Named precisely: it
  is a placeholder detector, not a taste judge, and it must never be reported as the latter.**
- **`scripts/diversity.mjs`** (`C8`) — pairwise distinctness across the candidate set, computed **before**
  any judging. Below the pack's declared floor the round **fails and regenerates with an explicit
  diversity instruction** rather than picking a winner from clones. Six variations that are the same
  variation is the failure that produces *"pick one of three directions"*, which the founder already
  rejected once on beeond, and nothing currently notices it. Rule 10: uncomputable distinctness returns
  `unresolved` and asks a human.

**The second family** (`C22`). `gemini` is installed at `~/.npm-global/bin/gemini` and has never been
executed, while this repo states in four places that no non-Anthropic model is reachable. GSD ships the
answer: shell out to an installed competitor CLI as a real subprocess for **one seat** on the panel. It
returns findings, never a score, like every other seat — union, not average, and a second family is
valuable precisely because it finds *different* things. `claim-judge-external` is already a registered,
dispatchable resolver. **Rule 10 is the load-bearing half: exit 0 with empty stdout — the exact shape of
Codex bug #19945, which is exactly how a resolver runs — must resolve `unresolved`, never pass.** Treat the
second family as a seat that can be empty, not a dependency; GSD's own abandoned list includes a
vendor-retired Gemini runtime.

**The council, and when it convenes.** Not per artifact. The panel above is per artifact; the council is
`/board-meeting` and it convenes on a **fork** — a decision the loop cannot compute. Metaswarm's
convergence rule is better than one I would invent: **fresh instances every round with zero visibility
into prior findings** (named as anchoring-bias avoidance), a **3-iteration cap**, then human escalation
carrying an iteration-history table. Under D13 it does not convene again without an agent file per persona
that narrows its roster and a cost cap something reads.

**The world's verdict** (`W1`). A fifth verifier, `verified_by: world`, whose evidence names an instrument
and a threshold. The resolver queries the instrument and **an unreachable instrument returns `unresolved`,
never `pass`.** Say the consequence in advance so it is not read as failure: this will report `unresolved`
far more often than `pass`, for a long time. Paired with the shipped register (`W3`) — anything that
leaves creates an entry with a `check_on` date, and **"no data" is an allowed outcome distinct from "not
checked"**, because conflating those two is how this kind of register dies.

**Taste versus correctness — the split, stated as a rule.** Correctness is checkable and is checked. Taste
is not, and every attempt to check it in this repo produced a critic's checklist in the maker's slot.
So: **taste never appears in a gate. It appears in the rubric that goes into the maker, and in the pair
the founder writes when they pick.** The panel judges correctness and craft failures — things with a
name — and the selector breaks ties on *distance*, not on preference, precisely so that no judge's taste
becomes the system's taste by accident.

### Built from

`C1` `C8` `C17`–`C22` `C28` `C38` `W1`–`W5` `A1`–`A3` · Zheng et al. 2023 (position, verbosity and
self-enhancement bias; pairwise with order-swapping as the mitigation) · Catmull, *Creativity, Inc.* ·
Janis, *Groupthink* · Osborn, *Applied Imagination* · GSD's subprocess panel · Metaswarm's fresh-instance
review gate · `UKGovernmentBEIS/inspect_ai` for multi-model grader scaffolding.

### Board decisions binding

**D7** — no done-test resolved by the producing model, no summed or averaged score anywhere, no
aggregation across evidence rungs. `scripts/select.test.mjs` is the mechanism that makes D7 real rather
than stated.

### Enforced by

`scripts/select.test.mjs`, blocking, asserting four things: **(a)** no schema under `.claude/workflows/`
or `packs/` contains a numeric field named `total`; **(b)** `select()` is deterministic — same findings,
same pick, over a fixture corpus; **(c)** every judged comparison has a swapped twin and a flipped pair
returns `unresolved`; **(d)** the dissenter seat rotates by task id parity. Plus `test:playbooks` gains the
graft contract (`C5`): `grafted_ideas: [{from_angle, idea, quote}]` where `quote` must appear **verbatim**
in the named variation's serialised output, checked by substring — the same mechanical anti-fabrication
guard `check-citations` already performs on prose. A synthesiser returning `grafted_ideas: []` is currently
byte-identical to one that grafted three.

---

## 9 · Control & safety

### What it IS

**The whole safety posture in one sentence: the workshop is unbounded and the door is narrow.**

Everything MAKE and ATTACK do is undone by `rm -rf`. Publishing, sending, spending and contacting a human
are not. So control concentrates entirely at the boundary, and this is what lets the producing loop be
genuinely unconstrained everywhere else.

**The policy seam** — one shape, replacing five planned subsystems (Omnigent, `open-source.md` §11 and
`STARTUP-OS.md` §8b). A typed callable `PolicyEvent → PolicyResponse | None`, registered by name, fired at
phases; declared at pack level and session level; **first DENY short-circuits, ASK accumulates, a later
DENY still wins, side effects apply only on final ALLOW or a human-approved ASK.** Built on the eight
currently-unused hook events, with `pre-tool-use.sh` untouched (the founder's session-2 constraint). The
budget guard, the tool grants, the approval gates, the steer channel and the loop's stopping rules are all
one shape after this, and every future guardrail is a small function rather than a new subsystem.

Cap the handler count and require each handler to name what it enforces, or the seam becomes the place
everything is dumped.

**Grants.** Declared on the pack, resolved in the **one** classifier: `effective_tier = max(path_tier,
reach_tier)` (D3, `R1`). A second implementation of risk classification is refused outright, **including a
small helper answering "is this outbound?"** — `scripts/classify.mjs`'s own header says why, and this repo
has already paid for the lesson once. The measurement that forces it: `node scripts/classify.mjs
assets/promo.mp4 posts/launch.txt` returns `tier=lite · enforcement=shadow` for both — a video and a
caption about to be published under the company's name, unattended — because the classifier's only input
is a normalised path string and worldly actions have none.

**Gates, two classes, and the second is impossible by type** (D6, `R3`). `.claude/gates.yml` already
declares `kind: command` and `kind: human`; a `human` gate has no `run:` and `scripts/check-gates.mjs`
**refuses one written with a `run:`**. What it lacks is a caller in any executing path, and giving it one
is additive and revertible. Anything with `blast_radius: stranger|public` or `reversible: no` is
`blocking-human` **by type, not by policy** — so no configuration, mode, or reasoning chain can clear it.

The board's composition that no single persona stated, and it is the load-bearing sentence of this
section: **`scripts/verdict.mjs` binds `subject = sha256(git diff)`, so a published video, a sent email, a
live landing page and a price change have no diff, therefore no subject, therefore no verdict record — and
for three of the four pack families the human gate is not one control among several, it is the entire
enforcement spine.**

**Money** (D2). No tool grant that spends outside model tokens connects until an absolute rate ceiling
exists that something enforces. Money is the one risk axis with a **rate** and no tier in this repository
can express one — every tier it has is about reversibility or blast radius. The counter lives at the
`outbound` wrapper, counting from the event log, with `budget-guard.js` as the working precedent for a
ceiling with a safelist and a logged, reasoned override. **The number is the founder's** and nothing else
on this board is blocked on a number only they hold.

**Reach and inbound** (D9). Inbound comes after the outbound wrapper, and inbound is last. Injection plus
outbound with nothing between them is injection-to-irreversible-action in one hop. §17 argues for one
narrow amendment to this, with evidence, and accepts the ordering half without qualification.

**Taint** (`H3`). Every piece of context carries provenance — **authored** (founder), **derived** (the
system's own work), **foreign** (fetched from the world). While foreign content is in context, the
effective grant narrows automatically: outbound tools become `blocking-human` regardless of anything else.
The taint is a property of the *context*, not a judgement about the *content*, which is what makes it
mechanical. `WISH` on detecting foreign content arriving by a path the wrapper does not mediate — that
hole is real and is stated rather than papered over.

**Dry-run by default** (`R4`) on every outbound tool: the wrapper produces the artifact by default — the
draft email, the unpublished post, the unsigned invoice — and a **separate explicit send call carrying the
artifact's hash** is required. #116's lesson applies exactly: an unknown flag must **refuse**, not perform
the non-dry action.

**A named-human register** (`R6`). No action addressing a human proceeds unless the recipient is on an
approved-contacts file with a note on the relationship. Deterministic string matching, fail-closed by
construction — an unparseable recipient is not on the list. Reply-in-thread is a distinct, narrower
permission, never a general send.

**The kill switch is a file** (`RT3`), checked at the top of every dispatch by the wrapper, before anything
else. The founder creates it with `touch`. No service, no API, no auth, nothing that can be down. It stops
*new* dispatch only; stopping a running worker is the andon cord (`S3`, §10), and the two must be described
as different switches so nobody believes the file stops the world. If the check itself errors, refuse.

**What runs at 3am, and what never does:**

| Runs unattended | Never runs unattended |
|---|---|
| MAKE — variation, sketches, batch media generation | anything with `reach: outbound-public` |
| ATTACK — panels, dissenter, second-family seat | anything with `reach: financial` or `human-contact` |
| ARCHIVE — cell writes, index, novelty computation | `sandbox_exec`, ever, by anyone |
| ORIENT and field learning (read-only, tainted) | a migration, a deploy, a harness self-edit |
| Falsifiers (`C36`) and the explore budget (`C33`) | anything a `git revert` does not undo |
| Deterministic oracles, the check suite, staging to preview | clearing its own `blocking-human` gate |

**The residual, named rather than implied** (`risk-modeler:R2:P14`, and the persona predicted in writing
that this is the item synthesis drops because nobody objects to it): the sandbox is a guardrail against
accident and **not containment**; `Bash` is a general capability; no reasoning-layer control survives
prompt injection; a verdict is hash-bound and **not signed**, so anyone with repo-write can author one;
the panel is single-family until a second family is reachable; a policy file is an ordinary file; a
`blocking-human` gate stops overnight work when the founder is asleep; and **the founder is a single point
of failure for every human gate while watching two to four rows a day.** This design does not close any of
those. It names them.

### Built from

`R1`–`R6` `H3` `RT3` `S3` `A5` · Omnigent's policy seam and its cost gate's fail-closed-on-unpriced-model
rule · GSD's `blocking` vs `blocking-human` · this repo's `gates.yml`, `classifier.js`, `verdict.mjs`,
`budget-guard.js`.

### Board decisions binding

**D2** · **D3** · **D6** · **D9** · **D10** (the kill switch lives in the supervisor, not in the prompt).

### Enforced by

`scripts/check-gates.mjs` (already refuses a `human` gate with a `run:`); `scripts/gates.test.mjs`
(blocking, and pins `unresolved` apart from `fail` for spawn failure, signal, and every exit code other
than 0 and 1); the extended `classifier.js` with rows in `.claude/qa-tier-floor.yml`; the `outbound`
wrapper's register check and rate counter; a suite step asserting that no pack with `shadow: true` or
`reach: outbound-*` is reachable from the unattended dispatch path.

---

## 10 · Surfaces

### What it IS

**The balcony's primary verb is `promote`, and that is the design decision in this section.**

Everything else about the balcony follows from one measurement: it has seven views, **one of which acts**,
and the escalation Inbox has been empty on every project ever. It is a mirror. The cheapest way to make it
a console is to give the founder something worth doing on it every single day, and the highest-value thing
they can do is **pick**.

**So the balcony shows the round, not the pick** (`C37`). A row carries the winner **plus up to three
archive cells**, ordered by distance from each other so the three are genuinely different, each with its
≤60-word pitch (`C26`). One tap promotes a loser. **That promotion is the single most informative event
this system can receive**, and it writes a preference pair to `taste/<project>/PAIRS.jsonl` (`C21`).

This is my answer to the board's unresolved item 7 — *does the founder-preference corpus have an input?*
The board measured correctly that it does not today. The honest position is: **the input does not exist,
and creating it is what this surface is for.** A promote action is the only place in the whole system where
a founder choice between two things happens, so it is the only place a pair can be written, so it is the
verb the surface is built around rather than a feature bolted to it.

**Goal-sized rows, 2–4 a day.** A row is a *round*, not a dispatch. Dispatches are the auditor's view (`E5`),
not the founder's. This is the founder's binding instruction and it is what stops the balcony becoming a log.

**Every row carries `say:`** (`V1`) — one sentence, ≤15 words, no paths, no hashes, no identifiers, written
**at emission by the thing that knew what happened**, not generated at render time by a model that was not
there. Voice then reads a field rather than summarising a record. A lint fails a `say:` containing `/`, a
7-plus hex run, or more than 15 words. It improves the written surface too: a row that cannot be said in
15 words usually bundles two events.

**The briefing is a generated tree with a fixed shape** (`V2`, `V3`): **what changed · what is blocked ·
what needs you · what I would do next**, always in that order, each may be "nothing" and "nothing" is
spoken. Headline layer alone must be a complete if shallow briefing; detail on demand. Same two-tier
pattern that took skills lookup from ~15,000 to ~1,070 tokens. `say`+`afplay` are already on the machine,
so a spoken morning briefing is free and offline. **"What I would do next" is labelled an opinion until
`scripts/next.mjs` exists** — without a priority function it is a model's opinion wearing a system's voice.

**Redirect and annotate are different acts, and merging them is why steering feels impossible** (`S1`). A
**redirect** targets a task id, must be acknowledged, and changes the current move. An **annotation**
targets a field or project, needs no acknowledgement, and lands in the taste rubric for the next artifact.
The founder says which; the system never guesses. A redirect with no task id is refused.

**The steer file, polled at phase boundaries** (`S2`). `STEER.md` per task id, read by the *harness* at
every boundary — ORIENT → PROPOSE → MAKE → ATTACK → SEE → ARCHIVE — and injected, so the worker cannot skip
it. Latency is bounded by the phase, which is why the andon cord (`S3`) exists for the case that matters:
a pull sets a flag and the worker halts at its **next durable artifact**, reporting where it stopped so
state is resumable. `lastArtifactAt()` already defines "durable artifact on disk" and never the agent's own
claim to be done, which is exactly the right halt point and is already built.

**The phone has exactly three verbs** (`V5`): **approve · redirect · stop**. Anything richer queues for a
keyboard. Three verbs is what fits under a thumb at a traffic light, and the promote action makes redirect
a *choice among candidates* rather than typing — which is the only way redirect works on a phone at all.

**Confirm-back on voice** (`V4`): any voice-originated instruction is restated **in the system's own
words**, not the transcript, and requires confirmation before it binds. Echoing the transcript confirms the
transcription, not the intent. Scoped by reach: required above `internal`, skipped below it. A voice move
without `confirmed: true` is refused at dispatch.

**When it may interrupt.** L3 of the escalation ladder only, or a `blocking-human` gate on the critical
path of the in-flight mission. Everything else waits for the morning gallery. Count human-gate stops per
night: if the number is high, the answer is to change **what the loop attempts overnight**, not to weaken
the gate.

**Explaining itself.** Explanation is a **replay from the event log, never a generation** (`E1`), and **an
explanation with a hole must say so** (`E2`) — *"I cannot explain step 3: no row was written between the
dispatch and the artifact."* The gap is the finding. That turns the explanation surface into an
instrumentation audit that runs every time anyone asks a question. Early on most explanations will be
mostly holes; that is not broken, it is reporting that the instrumentation is thin, which is what you want
to know before trusting it. Q&A answers cite an event id, a file path or a claim id, or the answer is *"I
don't have a record of that"* (`E4`). Three renderers over one log, never three logs (`E5`).

### Built from

`C21` `C26` `C37` `S1`–`S3` `V1`–`V5` `E1`–`E5` · Omnigent's **MCP elicitation** as the approval wire
format — strict `action == "accept"` parsing, side effects withheld until acceptance — *do not invent a
protocol* · macOS `say`, `afplay`, `shortcuts run` as the zero-cost voice half.

### Board decisions binding

**D1** (a redirect with no task id is refused; a row without one is unattributable forever) · the founder's
binding instruction that rows are **goal-sized, 2–4 a day**.

### Enforced by

Row schema lint: `task_id`, `say:` within its constraints, and **≥2 candidates on any row produced by a
round with `variation:`** — that last one is the check that makes `C37` real rather than aspirational. The
balcony's promote handler is the **only** writer to `PAIRS.jsonl`, and a test asserts no other path writes
it. `scripts/briefing.test.mjs` asserts all four sections present with explicit "nothing" allowed — a
briefing missing a section **fails rather than silently shortening**.

---

## 11 · Runtime

### What it IS

**The loop body is `claude -p` with a narrow `--allowedTools` roster, under a `launchd` supervisor** (D10).
Not because it is elegant, but because a wrapper is a control only if it is the sole path to the
capability, and **nothing in this runtime interposes one**: the `PreToolUse` hook has exactly two verbs,
allow and deny, and cannot rewrite `mcp__higgsfield__tiktok_publish` into `wrapper.publish(hash)`. The
tool list is the control. Strike the direct outbound tools from the roster and the wrapper becomes the
only path; leave them on and every other outbound control on this board is advisory.

```
launchd  (KeepAlive · WatchPaths · StartCalendarInterval)      ← the outer daemon, S4
   └── loop.sh
         ├── kill-switch file check                            ← RT3, first statement
         ├── rope check: windowUsage() < reserved fraction     ← EC4 / Decision 8
         └── claude -p --allowedTools "<pack roster>" --bare   ← the worker, per-run grant
               └── inner watchdog: SIGTERM a hung call         ← S4 inner layer
```

**Two different failures, two different mechanisms, and this system currently has neither** (`S4`,
Auto-Co): an inner watchdog that SIGTERMs a hung call, and an outer daemon that restarts the *script* if
the script dies. Neither supervises the other's failure, which is the point. The outer daemon needs its own
circuit breaker — Auto-Co's `.gitignore` names one that **exists nowhere in its code**, so the reference
implementation has exactly this hole.

**Why not the control plane.** `mission-control/test/crosscheck.test.ts` bans a shell call under `server/`
at **zero exceptions**, deliberately — it closed three RCEs on 2026-08-14. The loop lives beside the
server and writes rows the balcony reads. Containment kept, autonomy gained, nothing weakened. That
blocking test is the mechanism; the loop's home is a design decision made to respect it.

**Why not `CronCreate`.** Read its own schema: *"Jobs live only in this Claude session — nothing is written
to disk, and the job is gone when Claude exits"*, `durable` has no effect, jobs fire only while the REPL is
idle, and recurring tasks auto-expire after 7 days. It is a within-session heartbeat, not a scheduler.

**`Monitor` is the most under-considered primitive on the machine** and it belongs to §12's inbound work,
not to the loop: it takes a `ws:` source, so a server can *push* an event into a session that is already
thinking. That is the difference between polling and being woken — and it is inbound, so D9 puts it last.

**Recovery.** Every move is either idempotent or declares `idempotent: false` and takes a lease that
survives its death (`RT1`). **The schema field has no default — the author must choose** — because a
default would be silently wrong for the dangerous half. The dispatcher refuses to auto-restart a
non-idempotent move and escalates instead. Non-idempotent moves are also, by definition, the ones needing
`blocking-human` treatment; the two properties correlate and that is not a coincidence.

**Models per job.** The valid identifiers are `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5`,
`claude-haiku-4-5`, pinned by `scripts/prompt-standard.test.mjs`.

| Job | Model | Why |
|---|---|---|
| Makers, the many | `claude-sonnet-5` | volume is the point; eight in parallel |
| The cheap variant (`C10`) | `claude-haiku-4-5` | a tenth of the budget forces one decisive idea, and it is often the sharpest |
| The generous variant (`C10`) | `claude-opus-5` | triple budget permits a structure nobody attempts at normal cost |
| Panel seats | `claude-sonnet-5` | weak judges are excellent finders; spend on seats, not on depth |
| The second family seat | `gemini` subprocess | different family, different findings |
| Synthesis and selection | none — `select()` is a pure function | the selector is arithmetic, not a judgement |
| ORIENT construction | none — `scripts/orient.mjs` | deterministic assembly, no model in the path |

**Asymmetric budgets bind because `maxTurns` binds when a dispatch names an `agentType`** — a registered
claim in this repo (`c-maxturns-binds-when-agenttype-named`), with the lint ceiling at 120. So `C10` is a
real mechanism and not a preference. A timed-out variant returns `complete: false`, is **archived** and is
**not ranked** — a fragment is an unfinished idea, not a bad one.

**What runs with the lid shut: nothing.** `launchd` is bounded by the laptop being awake; pair with
`caffeinate` and `pmset` to wake on a schedule. This is Decision 4 — built for this Mac — and the honest
consequence is that the 24/7 claim is really "24/7 while the lid is open and the machine is plugged in".
Say it rather than discover it. `n8n`'s cloud schedules are the only lid-shut option in the connected set,
and they are inbound-adjacent, so D9 orders them last.

### Built from

`RT1`–`RT3` `S4` `EC4` · `hands.md` §3.1 (four scheduling mechanisms, one survives a reboot) · Auto-Co's
dual-layer supervision · `temporalio/temporal` as the mature answer this design deliberately declines
(enterprise weight for one founder on one Mac; the lease plus the idempotency field is the 5% we need).

### Board decisions binding

**D10** — and note its stated confidence is *med*, because the workflow-reachability half is an
**inference**: nobody has run `claude -p` under `launchd` and recorded the result. That is founder action
item 9 and it sits at step 7 of §15, before anything depends on it.

### Enforced by

`scripts/loop.test.mjs` — the kill-switch check is the first statement and dispatch refuses when the file
exists; the rope check precedes every dispatch; a non-idempotent move is never auto-restarted. `npm run
test:sandbox` already fails if `sandbox.enabled` is flipped. `crosscheck.test.ts`'s zero-exception shell
ban stays at zero exceptions.

---

## 12 · Self-improvement

### What it IS

**Corrections become mechanism through a mechanical detector, not a model noticing.** `M1`: a ~50-line
regex classifier over the 2,936 transcripts scanning founder turns for correction markers (*no, · actually
· that's wrong · I said · don't · stop · not what I meant*), extracting the surrounding exchange and
emitting a **candidate**. Candidates are reviewed once by the founder at the balcony; confirmed ones enter
the taste rubric and bind. Mechanical beats asking a model to notice, because a mechanical detector cannot
decide it was not important. **Take Metaswarm's classifier; refuse the loop around it** — their own
self-improvement loop is a `MANDATORY` instruction inside a skill file that nothing checks ran, and their
canonical command no longer calls the working classifier.

Measure the confirm rate: below ~30% the markers need narrowing.

**Post-mortems end in a mechanism or a counted `none`** (`SI1`). Every post-mortem's deliverable is a table
row with a **Mechanism** column. `none` is permitted — most incidents do not warrant machinery — but `none`
is **counted**, and a failure class with three of them is escalated by the count rather than by anyone's
memory. `CLAUDE.md`'s own Rules table is the working model: every rule names its mechanism and `ADVISORY`
is an honest label rather than a hidden gap. A named mechanism gets an owner and a date, or it is `none` —
otherwise it reads as closed and is worse than `none`.

**Failures are tagged from a closed enum** (`N4`): *wrong target · missing capability · unclear brief ·
hallucinated fact · budget exhausted · external block · tooling defect*. The **closedness is the
mechanism** — an open tag field produces 40 singleton categories and no signal. Monthly counts decide where
mechanism gets built, not where the last incident was. Watch the `other` rate: above ~15% the taxonomy
needs a dated revision.

**Promotion at three sightings** (`SI2`). Three independent sightings of the same approach — countable from
the approach hashes already stored for `C24` — make it a **candidate** skill. Candidacy triggers a review,
not an automatic write. `CURATION.yml` already records 55 cuts with the test that justified each and more
than ten reversals; that is the right standard for entering the library, and `check:curation` already fails
when the directory drifts from the recorded decision.

**Retirement is computed, not proposed.** Three mechanisms, and the first two must land together:

- **`X1` the birth certificate** — a new pack, skill, workflow, persona or command may not merge unless the
  same diff contains a **caller**. Not a plan to wire it; the wire. D8 unifies the **four** existing
  implementations (`build-skill-routers.mjs`, `check-suite.test.mjs`, `check-gates.mjs`, `EXCLUDED`) into
  one `hasCaller` predicate — four conventions with no shared code, and a fifth instance is the disease it
  treats.
- **`X2` last-use telemetry** — because the predicate proves **callability, not calledness**, and is
  therefore satisfiable by a trivial caller written to satisfy it. Every skill load, pack dispatch, persona
  convening and archive read writes an event **at the dispatch harness chokepoint**, not per artifact.
  Monthly report: everything with zero events in 90 days. That list is the retirement queue, computed.
- **`X3` sunset by default** — every governed artifact carries `retire_on`; when due, exactly one
  disposition: renew with evidence of use, retire, or waive with a new date. `retire_on: never` is allowed
  (Lindy is real) with a written reason reviewed on the same cadence. Stagger dates at creation or a quiet
  month produces fifty simultaneous decisions and a batch waiver.

**Retirement is archival, never deletion** (`X5`): a stub remains where the artifact was so references
still resolve, and `evict-memory.mjs` already implements exactly this, checking that no byte was lost.

**Measuring "better": one company metric, with both components visible** (`SI4`). **Founder interventions
per surviving artifact.** It should fall. It captures autonomy, quality and taste alignment in one number,
and it cannot be gamed by producing more, because the denominator is *surviving* artifacts. Paired with an
engagement count, because a fall caused by the founder disengaging is not a win, and a metric with one
number is a metric that will be gamed, including by accident.

**Two creativity metrics beside it, and neither is summed with anything:**

- **Archive coverage** — occupied cells per field, per month. Not peak quality; coverage.
- **Promotion rate** — how often the founder promotes a non-nominated cell. **This is the falsification
  test for the entire archive thesis** (§17).

**On A/B testing the system's own prompts** (`SI3`): stated plainly, at one-founder volume this is probably
not achievable. Detecting a modest effect needs dozens of observations per arm and this company will
produce a handful of comparable moves a month. Its realistic value is catching *large* regressions, not
tuning, and reporting a direction below the minimum detectable effect is worse than no comparison at all.

**D15 stands, monthly, forever**: harness work against venture work, counted over session-file frontmatter
and classified through `scripts/lib/classifier.js` rather than a second implementation of it. A **finding**,
never an automatic action. It is the only proposal on the board that would have fired during the last three
weeks, while every mechanism was being built correctly and nothing was being pointed at anybody.

### Built from

`M1` `N4` `SI1`–`SI4` `X1`–`X5` `C24` · Metaswarm's regex classifier (take) and its prose loop (refuse) ·
this repo's `CURATION.yml` and `evict-memory.mjs`.

### Board decisions binding

**D8** (one `hasCaller` predicate, landing **with** last-use telemetry keyed on the task id, and the word
"prevents" withdrawn) · **D15** (measured monthly, a finding, never an action) · **D12** (the ratchet).

### Enforced by

The birth-certificate check on the diff; the last-use report as a monthly suite artifact; `claim-freshness`
resolving `retire_on` unchanged; `check:curation` unchanged. `SI4`'s two components are event queries given
D1's task id and `W1`'s world verifier — neither exists yet, and the metric is `unresolved` rather than
zero until both do.

---

## 13 · Economics

### What it IS

**The rope, and it is Decision 8 already built** (`EC4`). `budget-guard.js` computes two ceilings in output
tokens: a rolling **5-hour window** ceiling, account-wide across every project, and a **stall** ceiling
counted since the last *durable artifact on disk* — a commit, a claim event, or a session file — and
**never the agent's own claim to be done**. At the ceiling a safelist still permits `git commit/push`,
`npm run check`, `gh pr create`, ledger writes and session-file writes, so **landing work is never
blocked**; only starting new work is. An override demands a written reason and logs it with the numbers,
and the guard announces its own fail-open rather than pretending. Warm hook latency 0.08s.

**It is registered nowhere, and D4 says repair before registering.** Measured live 2026-09-02 with the last
durable artifact 19.1 hours old, `sinceLastArtifact().output_tokens` and `windowUsage().output_tokens`
returned **the same number, 193,027**. Past `RETAIN_HOURS = 6` the stall counter degenerates into the
window counter, so the detector is inoperative for exactly the regime it governs — a 24/7 loop crosses six
hours on night one by construction. Registering it in that state does not give the loop a brake; **it gives
the founder a reason to believe there is one.** Two small repairs, both named in founder action item 1:
trigger on elapsed time since the last durable artifact (unbounded, correct at 19.1h, already computed and
discarded into a warning string), or return `unresolved` past the retention horizon; and scope the
account-wide numerator to the repo-local denominator, which needs D1's task id.

**The stall ceiling is the loop's primary circling brake, not merely a spend brake** — and it is the
field's open problem. Auto-Co's anti-circling rule is one line of prose enforced by nothing; Ralph's is a
hardcoded nudge string; neither detects repetition. This repo has the detector and has not pointed it at
the loop.

**And it is only half of what the loop needs.** Stall = *no artifact*. **Boredom = no NEW artifact** (`C23`),
which reads as healthy progress: commits land, artifacts appear, tokens are spent, and the output is a
monoculture. `scripts/boredom.mjs` computes the rolling mean distance of each new artifact from the last N
in the same field; below a floor the loop forces a novelty round before continuing. **Two different
failures, two different detectors**, and the second is gated on whether the field's done-test has been met,
so converging toward a met done-test is good and converging without one is circling.

**The explore budget is not justified by outcome** (`C33`). A pre-committed fraction — 10% — of the rolling
window is reserved for moves with **no requested outcome**: try a tool nobody has used, make something
nobody asked for, read a field nobody needs yet. Output goes to the archive and to `FIELDS/`. It is never
asked to pay off, and the reservation is spent or lost, never banked. `windowUsage()` is already exactly the
meter this needs: exploit work stops at 90%, explore work may use the last 10%. **Pre-commit to the fraction
so the decision is not re-litigated each time it produces nothing**, which it often will.

This is the single line item in the whole design that a cost-conscious review will cut first, and cutting it
is how a producing system becomes a maintenance system.

**A hard ceiling downgrades the model rather than stopping the work** (`EC1`, Omnigent): soft ASK
thresholds, and the hard maximum acts as a model-downgrade gate. Above the ceiling, work continues on a
cheaper model. And it **fails closed when a model has no catalogue price** — asking rather than silently
scoring the spend at zero, which is Rule 10 applied to money. Two systems reaching that rule from opposite
directions is the strongest evidence in the catalogue that it is right. Record the model on the artifact: a
done-test passed on a downgraded model is a different fact.

**The rate ceiling is D2 and it is blocked on a number only the founder holds** — dollars per day, per
venture. Nothing else on the board is blocked on a number only they hold. The mechanism is trivial once the
number exists: a counter at the `outbound` wrapper, the same shape as the rope's ceiling with a safelist and
a logged override.

**Cost versus worth.** `EC2`: cost per **surviving** artifact, not cost per run — cost per run rewards cheap
runs that produce nothing, which is every existing cost view in this repo and in CAST. `EC3`: `instead_of:`
on every dispatch, free when priority is computed, revealing over time what the system systematically never
gets to.

**The company's P&L, and the honest version of it.** Three lines, monthly: model spend (from
`ccusage`-style transcript accounting, zero instrumentation), vendor spend (higgsfield credits are queryable
in-band via `balance` and `transactions` — an agent can check its own budget before spending, which is rare
and useful), and the founder's hours. Revenue is a fourth line and it is **zero, stated as zero**, until the
demand test (D5) or a world-verdict rung ≥ 4 says otherwise. A P&L that hides a zero is not a P&L.

**Portfolio allocation with a floor and a ceiling** (`CY2`) once there is more than one venture: a declared
share of the window per venture, with a floor so a quiet venture is not starved and a ceiling so a loud one
cannot take everything, reviewed on a **cadence** rather than continuously — continuous reallocation is how
the loudest wins. `windowUsage()` already meters account-wide across every project, which is exactly the
meter this needs.

### Built from

`EC1`–`EC4` `C23` `C33` `CY2` `W1` · Omnigent's cost policy · Ralph's `costIs()` cache-aware price table
behind OR-composable stop conditions, and its two-tier stop composition · `ccusage/ccusage`.

### Board decisions binding

**D2** (the founder's number, and no outbound money before the ceiling enforces) · **D4** (repair the stall
counter, **then** register — registration-before-repair produces a believed brake, which is the failure
class this repo has already cured four times elsewhere).

### Enforced by

`.claude/hooks/budget-guard.js` once registered, whose measurement library is already a blocking CI step.
`scripts/boredom.test.mjs` pins the stall/boredom distinction with fixtures where one fires and the other
does not. `scripts/check-explore.mjs` asserts the explore reservation was spent or expired, never banked.
Rule 10 throughout: an unpriced model asks, an uncomputable distance is `unresolved`, an undefined
cost-per-surviving-artifact is reported undefined and never as excellent.

---

## 14 · The company itself

### What it IS

**Venture intake produces exactly three artifacts, then stops** (`CY1`):

1. **`taste/<project>/RUBRIC.md`** — references in, extracted rules out, founder-approved (`C15`).
2. **One mission with a falsifier** (`C36`) — *what is the cheapest artifact that would tell us this is
   wrong?*, and that is done first. The loop refuses to dispatch any move costing more than N× the
   falsifier's cost until the falsifier has an outcome. `falsifier: none` is allowed with a written reason
   **and counted** — a project where every mission declares `none` has found a loophole, and the count is
   what makes that visible.
3. **One approved done-test** at a declared rung.

**No move dispatches until all three exist.** This makes the founder's one unavoidable contribution happen
at the only time it is cheap. Cap it — three artifacts, one sitting — and let the system propose drafts the
founder edits rather than asking open questions, or intake becomes a questionnaire the founder abandons.

**Several at once.** `CY2`'s floor and ceiling, reviewed on a cadence. But **P5's WIP limit of one mission
is per venture, not global**, and the global constraint is the rolling window, so two ventures is really
"two missions in flight and one 5-hour window", which is the honest framing. Pair the floor with `X3`'s
`retire_on` applied at the **venture** level — a venture is a governed artifact too — or a floor keeps a
dead venture on life support.

**A second human is a role with declared decision rights** (`CY3`), RACI-style, per decision *type*:
exactly one Accountable, plus Consulted and Informed. **A `blocking-human` gate names which human, and a
gate naming no human is invalid.** For a one-founder company the founder is Accountable for everything and
the field is ceremony — which is fine and honest; its value is that it makes the exception visible the day
it arrives. `.claude/gates.yml` already distinguishes `kind: human` from `kind: command`, so adding a
required `who:` is a small schema change with a large clarifying effect.

**Wind-down is a protocol and it archives** (`CY4`): stop dispatch · resolve every open claim to a
disposition (bulk `deprecate` with one shared reason is allowed, because resolving each is real work at
exactly the moment nobody wants to do it) · write a dead-end record for the venture as a whole · archive
with a stub. **The global facts learned stay global.** A dead venture still contributes to `FIELDS/`, and
that is the strongest single argument for Decision 9's split.

**And the archive survives wind-down too.** A cell filled while working on a venture that died is still a
cell. This is the difference between a company that has failed once and a company that has learned once.

**The first mission is Decision 7's synthetic landing page for a fake company** — an end-to-end acceptance
test of the whole machine. Its done-test carries **no quality judgement at all**: rung 0 and rung 1 only —
it renders, and a stranger understands it in five seconds (D7). That is deliberate and it is what let the
Adversary withdraw its Round-1 objection: a rung-0/rung-1 done-test carries no taste and therefore needs no
per-pack taste approval on the critical path of a system premised on the founder's absence.

**Is the harness the product or scaffolding?** Founder action item 7, unresolved in both rounds, and it
changes which of the fifteen decisions are worth taking. This design assumes **scaffolding**, per Decision
4 (*built for this Mac, for the founder*), and says so, because a design that stays neutral on it is a
design that quietly assumes the other answer. If the founder answers "product", D15's ratio inverts in
meaning and §15's order changes.

### Built from

`CY1`–`CY4` `C15` `C36` `X3` `P5` · `STARTUP-OS.md` Decisions 4, 6, 7 and 9.

### Board decisions binding

**D7** (the first mission's done-test is rung 0 and 1, no quality judgement) · **D5** (the demand test runs
by the founder's hand, in parallel, needing none of this) · **D12** (a venture is a governed artifact and
carries a `retire_on`).

### Enforced by

The loop refuses to dispatch against a project missing any of the three intake artifacts. A check asserts a
project marked `wound_down` has no unresolved claims. `evict-memory.mjs`'s stub discipline supplies the
archival half.

---

## 15 · THE FIRST 30 DAYS

Continuous cadence, no phase numbers (the founder's session-2 instruction). Each step is a small landing,
useful alone. Ordering is forced by dependency, and **position 1 is justified against the Adversary's
dissent below rather than around it.**

### Position 1, and the dissent it must answer

`adversary:R2:P13`, measured and unrebutted: **position 1 is a mechanism in four of four peer build
orders, and an artifact that reaches a person outside this system appears at no position in any of them.**
Three of four wrote that objection down against themselves and put a mechanism first anyway.

**Two things sit at position 1 here, and only one of them is mine.**

**1a — the demand test (D5), founder-executed, starting day 1.** One real page to a real URL with analytics
on it, posted once to one place a real audience reads, hands off for seven days, three numbers recorded:
sessions, one conversion event, one unsolicited human response. **With both conditions the board attached:**
declare in writing *before* it runs what number is a pass and what number is an uninformative sample, and
the result is a **finding, not a gate**. It requires none of the controls on this board because no agent
publishes, sends or spends. It is not blocked by anything in this list and nothing in this list waits for
it.

**1b — the first archive, and it is an artifact.** Days 1–3: delete `design.js`'s summed `total`, write
`scripts/lib/distance.js` and `scripts/lib/select.js`, add `archive/INDEX.jsonl`, and **run one real design
round by hand** with eight variants, two constraint cards, one far-transfer variant and two novelty slots.
Output: **an archive with cells filled, and a founder who looks at it.**

**Why this genuinely answers the dissent, and where it falls short — stated fairly.** It answers the
*shape* of the objection: the deliverable at position 1 is something a person looks at, not a mechanism
nobody sees. It **does not** answer the objection's strongest form, because the person who looks is the
founder, who is inside the system. Only 1a reaches a stranger, and 1a is not mine to run. So the honest
statement is: **the strongest artifact-first item on this list is the founder's, it runs on day 1, and my
position 1 is the cheapest thing that tests this design's own central thesis in three days.** If the
gallery is boring, this entire design is wrong and it cost three days to find out — which is the
falsification the Adversary has always been asking for, applied to me instead of to them.

### The order

| # | Landing | Forced by | Unlocks |
|---|---|---|---|
| **1** | **The score dies; the first archive exists.** `distance.js` · `select.js` · `select.test.mjs` · `archive/INDEX.jsonl` · `design.js`'s `total` deleted. One round run by hand, founder looks. | Nothing. It is the cheapest test of the thesis and the only step whose failure kills the design. | Every selection in the system. Falsifies or confirms the archive thesis in 3 days. |
| **2** | **The task id (D1)**, threaded through `logEvent`, parent/child from the start. | Nothing — and the Adversary's own R2 exemption covers it by name. Its omission cost is unbounded; every row already written is unattributable. | The stall counter's per-lane fix · cost per mission · `X2` telemetry · `E1` replay · every join in §12 and §13. |
| **3** | **The dispatch-path grant census (D14).** `scripts/probe-grants.mjs`, read-only and dry-run only. | Costs an agent's minutes, writes nothing, competes with the founder for nothing. | Makes every later control **smaller**: a census finding one leaky launcher turns "build a wrapper, a register, a rate ceiling and a reach axis" into "stop launching workers on that path". |
| **4** | **The stall-counter repair (D4)**, then founder registration of `budget-guard.js`. | Needs 2 for the repo-local denominator. Registration is a founder act — `.claude/settings.json` is irreversible tier. | The loop's brake. Nothing unattended may run before this. |
| **5** | **ORIENT becomes a mechanism.** `scripts/orient.mjs` · `DEAD-ENDS/` · `approaches.jsonl` · `orient.test.mjs` with positive controls. | Needs 2 (approach hashes keyed on goal + task id). | ORIENT and the anti-repetition family. The loop stops re-treading. |
| **6** | **The first pack: `design-brand`.** Grant + stop + `variation:` + `descriptors:` + decks. Under the D12 ceiling. | Needs 1 (selection) and 5 (orient). | The first worker that is a capability rather than a shape of work. |
| **7** | **Measure `claude -p` under `launchd` once** and record whether a `Workflow` invocation succeeds. Founder action item 9. | Needs the founder's say-so — it is the first unattended process on the machine. | D10's loop shape, which is currently an **inference** nobody has run. If it fails, the producing workflows are reachable only while the founder is typing and the 24/7 premise needs re-examining. |
| **8** | **Reach on the grant, in the one classifier (D3).** `effective_tier = max(path, reach)`. Rows in `qa-tier-floor.yml`. | Needs 6 — a pack holding an outbound tool. The Architect held the substance and demoted the timing for exactly this reason. | Everything in §9. |
| **9** | **`blocking-human` gets a caller (D6).** The gate class exists with a resolver and a test; giving it a caller is additive and revertible. | Needs 8. | The door. Nothing unattended may touch an outbound tool before this. |
| **10** | **The loop turns.** `loop.sh` under `launchd` — kill switch first, rope second, `claude -p --allowedTools` third. Inner watchdog and outer daemon (`S4`). | Needs 4, 7, 9. | Decision 2's resting state. The first night. |
| **11** | **The balcony's promote verb.** Rows carry the round; three cells with pitches; one tap writes a pair to `PAIRS.jsonl`. | Needs 1 (an archive to promote from) and 2 (a task id on the row). | Taste compounds. The board's unresolved item 7 gets an input. |
| **12** | **The boredom detector** (`C23`) and the explore reservation (`C33`). | Needs 4 (the meter) and 1 (distance). | The loop can circle productively instead of circling. |
| **13** | **The second family seat** (`C22`) — `gemini` as one subprocess seat, fail-closed on empty stdout. | Needs the founder's consent; it spends their Google quota. | Retires an accepted risk this repo has carried in four places, or proves it real. |
| **14** | **`MISSIONS.yml` + `scripts/next.mjs`** (`P1`), deterministic priority with printed arithmetic. | Needs 2. | *"What I would do next"* stops being an opinion wearing a system's voice. `E3` counterfactual explanation falls out free. |
| **15** | **`verified_by: world`** (`W1`) + the shipped register (`W3`) + PostHog. **Deterministic parse into a data file, never a fetched body into a producing context.** | Needs 9 (outbound before inbound, D9). | The first answer to *did it work* rather than *is it right*. `EC2`, `SI4` and `T3` all wait here. |

**Not in the first 30 days, deliberately:** worker trust (D11 dissolves it) · the council convening again
(D13 — needs agent files per persona and a cost cap something reads) · general inbound (D9 — last) · any
money-spending grant (D2 — needs the founder's number) · `n8n` authentication · a fifth pack.

---

## 16 · WHAT THIS DESIGN REFUSES

Each refusal names what it protects. Recorded in `.out-of-scope/` with its reasoning **before** code exists,
which is GSD's practice and the same instinct as this repo's supersession blocks, applied earlier in the
cycle.

| # | Refused | Protects |
|---|---|---|
| 1 | **Any schema with a numeric field summed from judge outputs** (`A1`, D7). | The spikiness that makes one variation interesting. A variant that is 10/2/2/2 loses to four 5s, every time, and the four 5s is the median of the training distribution. |
| 2 | **Weighted voting among personas** (`A2`). | Honesty. It looks like rigour and is an average wearing a costume; it needs weights, which need a trust model for opinions, which cannot be validated at this volume. Auto-Co's Munger veto is prose in `CLAUDE.md` with all 14 personas at `model: inherit`. |
| 3 | **Any done-test whose resolver is the producing model** (`A3`, D7). | The system's ability to know it finished. A design PASS/BLOCK judge measured **0.543 against a panel only 0.741 self-consistent**. |
| 4 | **RAG over the 2,936 transcripts as memory** (`A4`). | The supersession discipline. Retrieval cannot tell a corrected belief from a current one, so it resurrects exactly the errors that discipline exists to bury. Take them as instrumentation. |
| 5 | **A second implementation of risk classification** (`A5`, D3) — including a small helper answering "is this outbound?". | The incident you find out during. `qa-lead-pass.yml` already computed a stricter second answer once and it cost a PR split. |
| 6 | **Any rule stated without its mechanism** (`A6`). | The difference between a rule and a wish. Every rule in this document names a mechanism or is labelled `WISH`. |
| 7 | **A persona dispatched to produce.** | The wall that stops the org chart returning. A persona argues and never builds; that is the whole of the distinction. |
| 8 | **Worker-to-worker messaging** (`CO3`). | The same wall, socially. Informal channels become dependencies, dependencies become roles. Enforced by grant: no pack holds a messaging tool. |
| 9 | **Worker trust, apprenticeship, promotion, demotion and retirement, for year one** (D11). | Attention. Nothing across 177 surveyed repositories implements it — highest cost, least precedent in the entire catalogue — and fresh context per move removes the subject entirely. |
| 10 | **`sandbox_exec`, on every pack, permanently.** | The blast radius nobody is thinking about. It is remote code execution attached to the server everyone thinks of as "the video one". |
| 11 | **A new vendor connection before the grant census (D14).** | The measured base rate. Six of nine surveyed things unwired; five new connections on that base rate produce five new unwired capabilities plus a false sense of reach, which is strictly worse than none. |
| 12 | **A pack that declares a method.** | The founder's complaint, in schema form. `schema-lint.js` already refuses a stage carrying `steps:`, `how:`, `method:` or `implementation:`; the same predicate points at packs and move briefs. |
| 13 | **A 14-runtime abstraction layer, an 8-provider sandbox matrix, a 17-table multi-tenant schema, 21 harnesses, durable-execution servers.** | One founder, one Mac. GSD's own history shows the tax — one runtime forcibly retired, two declined; Omnigent is 420,836 lines. Take the seam, refuse the breadth. |
| 14 | **Editing `mission-control/test/crosscheck.test.ts` to let the control plane spawn.** | Three RCEs closed on 2026-08-14. The loop lives beside the server, not inside it. |
| 15 | **Editing a regression test to make a suite green** — `stream.test.ts` is the named instance. | The value of every test in the suite. Taking away its real socket would leave it vacuous, which is precisely the defect class this repo found and fixed. |
| 16 | **The archive becoming a gallery nobody selects from.** | Itself. See §17 — this refusal carries a falsification date, because a refusal with no test is the thirteenth unwired mechanism. |

---

## 17 · WHERE THIS DESIGN IS WEAKEST

### My own strongest counter, stated as fairly as I can

**The archive is inventory until something reads it, and this design's central asset has exactly the shape
of every built-and-never-wired thing in this repository.**

The argument in full, because a weak version of it is not worth answering. `strategist:R2:P2` measured that
*cheap to reverse is not cheap to carry*: reversibility is a property of one change, carrying cost is a
property of the accumulated set, and every artifact in the supersession record was in the cheap reversible
half — the session-file count superseded five times, the suite denominator four, the `main` sha four times
in one day. Each individually trivial, each fixed repeatedly, the aggregate a 637-line document whose main
content is corrections to itself. `adversary:R2:P6` adds the cost curve: **a repository whose only output
is statements about itself corrects itself faster than it produces**, and nobody costed that in either
round.

An archive is a store with a writer and, initially, one reader — the loop that wrote it. `C25`'s retrieval
into ORIENT is the system reading itself, which is precisely the pattern the adversary is attacking. The
founder reading a gallery is the only reader that makes the archive an asset rather than inventory, and
**that reader has never once existed in this system**: seven balcony views, one that acts, an escalation
inbox empty on every project ever. This design's answer — make promote the primary verb — is a *proposal
that the reader will exist*, not evidence that it will.

`icaros-usc/pyribs` names the same risk from the other side: MAP-Elites is only as good as its behaviour
descriptors, and **a bad descriptor produces an archive of things that differ in ways nobody cares about.**
Choosing descriptors orthogonal to quality is a design judgement someone must make per artifact type, and
nobody in this system has ever made one. `C8`'s own stated failure compounds it: trigram distance measures
the **description**, not the design, and two designs described in different words may be the same design.

**So the honest reading is that this design bets a large new store on a reader that does not exist and a
descriptor set nobody has chosen.**

**The falsification, dated.** By **2026-10-02**, one month after step 1 lands: if the founder has promoted
a non-nominated cell **zero times**, and no artifact has shipped from a cell other than the one its round
nominated, then the archive is inventory. The correct response is **deletion, not curation** — remove
`archive/`, keep `select.js` and `distance.js` (which earn their place from the diversity floor alone),
and record the deletion in `.out-of-scope/` with this paragraph attached. Two counters make that decision
without a meeting: promotion rate and ship-from-non-nominated-cell count, both queries given D1's task id.

**Two smaller weaknesses, named rather than buried.** First, `C22`'s second family is a seat that can be
empty and this design leans on it for the panel's independence; GSD's own abandoned list includes a
vendor-retired Gemini runtime, so the seat's supply is outside anyone's control here. Second, the design
assumes the founder answers item 7 with *scaffolding*; if the harness is the product, §15's order changes
and D15's ratio inverts in meaning.

---

### The one board decision I would overturn — **D9, narrowed, not rejected**

**What I accept without qualification.** Inbound comes after the outbound wrapper. The risk-modeler named
this the single thing they would not trade across two rounds, and they are right: inbound plus outbound
with nothing between them is injection-to-irreversible-action in one hop, and the measurement stands —
`WebFetch` returns exit 0 from the only blocking hook in the repository, so there is no point at which a
fetched body is marked as foreign. Steps 9 and 15 of §15 honour that ordering literally.

**What I would overturn: the clause forbidding a fetched body from ever entering a producing context.**
The risk-modeler's concession reads *"a deterministic parse into a data file, never a fetched body into a
producing context."* As a rule about the **world resolver**, that is exactly right and I adopt it in §3 and
step 15. As a general rule about inbound, it forbids the two highest-leverage creativity mechanisms in the
entire catalogue, and it collides with a founder decision.

**The evidence, four items:**

1. **It contradicts Decision 6, which is the founder's and binding.** *"Four pack families first; agents
   learn new fields themselves. Anything else, the agent researches its way into."* Researching into a
   field **is** fetching bodies into a producing context — `K1`'s bounded protocol requires five
   practitioners named and three canonical artifacts **sourced**, and `C16` requires three exemplars each
   with a resolvable source. Under the general reading of D9, `FIELDS/` can only ever be populated by the
   founder, which makes Decision 6 unimplementable. Two binding constraints, pointing opposite ways, and
   the collision is discovered by whoever tries to build the first field file.

2. **The fetch-to-producing path already exists in the roster today, and it is narrowly safe.** `sourcer`
   declares `tools: [Read, Glob, Grep, WebSearch, WebFetch]` and `mcpServers: [claim-append]` — **no
   `Write`, no `Edit`**, and no outbound reach of any kind. So there is already an agent that fetches the
   world and produces exactly one thing: a claim, through one audited server. The general form of D9 would
   forbid the shape of an engine this repository shipped deliberately and cited as its model of a narrow
   grant.

3. **The hop D9 names is closed by narrowing the grant, not by refusing the fetch.** `H3`'s taint rule is
   mechanical and cheap: while foreign content is in context, outbound tools become `blocking-human`
   regardless of anything else, because the taint is a property of the context rather than a judgement
   about the content. Combined with D6's by-type impossibility, **the one hop does not exist** — a tainted
   worker cannot reach an outbound tool at all, in any mode, by any reasoning chain. D9's danger is real
   and its cure is over-broad for it.

4. **Refusing the fetch does not remove the injection surface; it moves it somewhere less visible.** A
   founder pasting a competitor's landing page into the balcony is foreign content in a producing context
   with **no taint flag at all**, because the wrapper did not mediate it. The refusal makes the safe path
   illegal and leaves the unmediated path open, which is the worst combination available.

**The amendment, in one sentence:** *inbound stays last and the world resolver stays a deterministic parse
into a data file; a fetched body may enter a producing context only through a mediated fetch that sets the
taint flag, and a tainted context holds no outbound grant.*

**What would change my mind.** A measurement that `H3`'s taint flag cannot be set reliably at the fetch
boundary — that foreign content routinely arrives by paths the wrapper does not mediate. That hole is real
and I named it as a `WISH` in §9. If the census at step 3 finds more than one unmediated fetch path into a
producing context, the general form of D9 is right and my amendment is wrong. **That is a measurement, it
is scheduled at step 3, and it comes before anything in this design depends on the amendment.**

---

*Design 4 of the whole-system round, creativity-first angle. Companion designs and the synthesis:
`docs/03-system-design/designs/`.*
