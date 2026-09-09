# The company, built from what this Mac can already do
### Whole-system design · angle: RUNTIME-FIRST · 2026-09-02

**Written by the engineer who gets paged at 3am.** Every mechanism below names the runtime primitive it
stands on and the file it lives in. Where the company needs something this runtime cannot do, the section
says so in bold and designs the smallest bridge instead of a subsystem. Anything I could not measure from
this dispatch — I have no shell — is marked `MEASURE:` and collected in §11.

Citations: catalogue ids (`C2`, `P7`, `X1`, `S4`, `B1`, `R3`, `W1`…) resolve to
`docs/02-competitive/expansion/concepts.md`; repo names resolve to files in this tree; `INVENTED` claims no
precedent. Board decisions `D1`–`D15` resolve to
`docs/08-agents_work/board-meetings/2026-09-01-startup-os-r01.md`.

---

## 0 · THESIS

**The company is one durable file, one supervised process that turns it, and a narrow argv that decides what
that process may touch.** The center is `scripts/loop/tick.mjs` — a program that reads the goal tree, mints a
task id, compiles one capability pack into a `claude -p` command line, spawns exactly one move, records what
came back, and *exits*. Everything else in this design serves that one function: the missions file is its
input, the balcony is its output, the packs are its argv, the ledger is its conscience, launchd is its
heartbeat, and the founder is its only irreversible authority.

The design principle is narrow and it does all the work: **the enforcement seam in this runtime is the
dispatch path, not the reasoning.** Claude Code gives you exactly one place where a capability can be made
*absent* rather than *forbidden* — the flags on the process you spawn. A hook has two verbs and fires after
the model has already decided to act; a prompt is advice; a policy file is an ordinary file. But a tool that
was never in the roster of the process cannot be called by any amount of clever reasoning, prompt injection
or model error. So every control that must hold at 3am is expressed as **something missing from an argv**,
and everything expressed any other way is labelled telemetry and not trusted.

The second principle follows from the first: **the harness is outside the sandbox and the worker is inside
it.** `tick.mjs` runs under launchd, in the founder's own shell context, with no Claude Code sandbox over it.
That single fact unlocks three capabilities this repo has recorded as impossible — the second model family
(`gemini`, blocked only because `~/.gemini` is in the sandbox's `denyRead`), the third (`ollama`, blocked
only because the sandbox denies loopback), and privileged writes to global state at `~/.agentvibe`. Put every
privileged act in the harness; give the worker the smallest roster that can produce the artifact.

What is *not* the center: the truth layer. L1 — the claim ledger, `scripts/lib/classifier.js`,
`scripts/verdict.mjs`, the 48-step suite — is kept whole (D1 of `STARTUP-OS.md` §2) and demoted from
protagonist to instrument. It answers *is this true*. The tick answers *what next*, and the packs answer
*with what hands*. Those two are the company; the first is its accounting.

---

## 1 · Missions & drive

### What it IS

Three files and one program.

**`company/MISSIONS.yml`** — the goal tree. One venture per top-level key, missions under it, goals under
those, in a shape a pure function can read:

```yaml
version: 1
constraint: g-landing-copy          # P2 — exactly one pointer, repo-wide
ventures:
  fakeco:
    state: active
    missions:
      m-launch:
        state: in_flight            # P5 — exactly one in_flight per venture
        intent:                     # P7 — commander's intent, four fields, no method
          task:      "a landing page a stranger understands"
          purpose:   "produce the first artifact that leaves this machine"
          end_state: "a live URL with analytics, unedited for 7 days"
          constraints: ["no paid traffic", "no outbound send"]
        goals:
          g-landing-copy:
            state: open
            pack: content-copy
            done_test: dt-copy-v1   # → company/done-tests/dt-copy-v1.yml
            blocks: [g-landing-build]
            deadline: 2026-09-12
            reversibility: reversible
            cost_estimate_usd: 4
            evidence_of_demand: c-fakeco-demand   # a ledger claim id, not a number
```

**`company/BOARD.md`** — the baton (Auto-Co's consensus file, `STARTUP-OS.md` §9). Rewritten whole by
`tick.mjs` every cycle, never appended. Hard cap **4,000 bytes**, enforced by
`scripts/check-memory-budget.mjs` extended with one path (it already enforces byte caps on
`.claude/memory/*`, so this is a new row, not a new checker). It holds: the task id just finished, its
outcome, the next move and why, and every open block. Nothing else. A baton that grows is a context leak
with a friendly name.

**`company/STEER.md`** — the founder's channel into a running loop. Read at the top of every tick and
injected into the worker prompt by the harness (S2). Also the andon cord (S3): a line reading `stop:` halts
after the current move, at its next durable artifact, never mid-token.

**`scripts/loop/tick.mjs`** — one cycle, one move, then `process.exit`. In order:

```
1  acquire ~/.agentvibe/tick.lock  (fs.openSync 'wx', pid inside, stale after 30 min)
2  if company/STOP exists            → exit 0, log loop.stopped
3  read STEER.md; if stop:           → exit 0, log loop.halted
4  brakes: rope + stall + spend      → §13. any trip: exit 0, log loop.braked
5  pick the move                     → scripts/loop/next.mjs, a pure function (P1)
6  mint task id  t-YYYYMMDD-xxxxxx   → D1
7  compile the pack to argv          → scripts/loop/pack.mjs (§2)
8  spawn claude -p, inner watchdog   → SIGTERM at pack.timeout_s (S4 inner)
9  read the JSON result; run the oracle; resolve the done-test
10 write BOARD.md, the balcony row, the field note, the dead-end file
11 release the lock, exit 0
```

**Done** is `company/done-tests/<id>.yml`: a `rung:` from the evidence ladder (W2), a `resolver:` of exactly
`command | world | human`, and `approved_by: founder` with a date. The producing model is never the resolver
(D7). The agent *proposes* the file after ORIENT; the founder approves once; then it binds
(`STARTUP-OS.md` §4).

**Priority** is `scripts/loop/next.mjs` — a pure function over declared fields that prints its arithmetic
(P1), constrained first by the single `constraint:` pointer (P2). It never asks a model what to do next. A
model choosing the next goal is an unauditable judgement in the control path, and this repo has already
decided it does not want those.

**Abandonment** is P6(b), forced re-justification: when a goal passes `cost_estimate_usd × 3`, `next.mjs`
refuses to schedule it until a re-justification file exists that names no prior spend. Not a kill — a
mandatory re-argument from zero.

**Blocked vs stalled** is B1 and it is free: **blocked is authored, stalled is computed.** A worker declares
`blocked` through the board MCP server (§3) with a `clearable_by:` that must resolve to an entry in
`company/people.yml` or a named credential, or the declaration is refused by the server. Stalled is
`tick.mjs` observing that `lastArtifactAt()` has not moved across N ticks. A worker cannot author "stalled"
and the meter cannot author "blocked", so the two can never be confused and no classifier is needed. B2's
third state, **stuck** — N approaches tried, all failed — is derived from the count of dead-end files under
one goal id. Blocked frees the mission slot (B5); the state machine lives in the board server, and a
transition not in its table is refused.

### Built from · Binds · Enforced by

- **Built from** P1, P2, P5, P6, P7, B1, B2, B5, S2, S3 (`concepts.md`); Auto-Co's baton and GSD's
  `STATE.md` spine (`STARTUP-OS.md` §9); the tick shape is `INVENTED` for this runtime.
- **Binds** D1 (task id minted at step 6, before anything is spawned) · D12 (the goal tree is uncapped;
  packs and gates are not) · D7 (done-test resolver kinds).
- **Enforced by** `scripts/loop/next.test.mjs` — the same `MISSIONS.yml` yields the same pick, byte for
  byte, or the test fails; determinism is the whole property. `scripts/check-donetests.mjs` in the check
  suite fails a done-test with `resolver: judge`, with no `rung:`, or with no `approved_by`.
  `scripts/check-memory-budget.mjs` fails `BOARD.md` over 4,000 bytes.

---

## 2 · Workers & roster

### What it IS

**Seven engines stay. Zero new agent files. A pack is an argv.**

This is the design's first real departure. D12 records the trap precisely: the `Agent` dispatch tool has no
`tools` parameter and the agent frontmatter schema is a closed key allowlist, so *"the only pack shape the
runtime supports today is one generated agent file per engine × pack"* — roster growth by multiplication,
the pressure that produced 26 agents. That is true **of the `Agent` path**. It is false of the `claude -p`
path, where the grant lives on the invocation (hands.md §5.1 pattern 3) and composes with the agent
definition's ceiling.

So the loop never dispatches through `Agent`. A pack is a small YAML file that compiles to a command line:

```yaml
# .claude/packs/content-copy.yml
id:        content-copy
engine:    builder                    # the ceiling: .claude/agents/builder.md
model:     claude-sonnet-5            # ids pinned by scripts/prompt-standard.test.mjs
tools:     [Read, Write, Edit, Glob, Grep, WebSearch]
mcp:       []                         # compiled into an explicit --mcp-config file
reach:     local                      # §9. one of: local | outbound-read | outbound-write | spends | speaks-as
timeout_s: 900
attempts:  3                          # then escalate — never loop (STARTUP-OS §5)
skills:    [routers/INDEX.md]         # injected by the harness, not left to the worker
```

`scripts/loop/pack.mjs` compiles it to:

```
claude -p --model claude-sonnet-5 \
  --allowedTools "Read,Write,Edit,Glob,Grep,WebSearch" \
  --disallowedTools "Bash,WebFetch,Task" \
  --mcp-config /tmp/agentvibe/pack-content-copy.json --strict-mcp-config \
  --output-format json \
  --append-system-prompt "$(node scripts/loop/prompt.mjs t-20260902-a1b2c3)"
```

**`--strict-mcp-config` is the load-bearing flag in this entire design.** It is what makes the founder's
fifteen user-scope servers — `higgsfield` with `tiktok_publish`, Gmail `send_message`, `sandbox_exec` — not
merely denied but *absent from the process*. D13 measured what happens without it: five Opus personas ran a
governance meeting holding the full roster. `MEASURE: M2` — that the flag exists and that it excludes
user-scope servers is the one thing I cannot verify from here and the thing everything rests on. If it does
not hold, §16's refusal list grows by one line and the loop never runs unattended.

**How many at once: one.** P5's WIP limit, and the runtime agrees for a reason that has nothing to do with
kanban — a five-hour rolling token window shared with the founder cannot support parallel lanes, and
CLAUDE.md already records that the check suite's own wall clock swings from 90s to 480s purely on how many
lanes are building. Parallelism lives *inside* a move where it is cheap: a pack may fan out to blind
variations (C4 islands) within its single `claude -p`, because that is subagent parallelism inside one
process and one grant.

**Fresh context is free.** Each move is a new `claude -p`, which starts at zero by construction. This is
where the field gets it wrong: `STARTUP-OS.md` §8b records that the Ralph loop's fresh-context claim is
**false in its implementation** — conversation accumulates and is compacted past 70%. Here it cannot
accumulate, because the process ends. Nothing to compact means no compaction defect.

**How a worker learns a field it lacks** is K1, and the runtime makes it cheap: ORIENT runs with
`WebSearch`/`WebFetch` granted and `Write` absent, produces a field note, and the *harness* writes it to
`~/.agentvibe/fields/`. The learning is real, the write is privileged, and the two are separated by the
process boundary. Exemplars beat rules (C16): a field note that names three examples of good work and what
makes them good outranks one that states principles.

### Built from · Binds · Enforced by

- **Built from** hands.md §5.1 patterns 2 and 3 (the definition sets the ceiling, the dispatch sets the
  actual); `STARTUP-OS.md` §4 (a pack is a grant and a stop, never a procedure); C4, C16, K1, P5.
- **Binds** D12 (the ceiling counts packs; the tree is free) · D11 (no worker persists, so trust has no
  subject — the runtime dissolves it rather than deferring it) · D3.
- **Enforced by** `scripts/loop/pack.test.mjs`: every pack compiles to an argv containing
  `--strict-mcp-config`; a pack whose `reach` is not `local` and whose id appears in no `.claude/gates.yml`
  human gate fails to compile; `tools:` must be a subset of the named engine's own `tools:` line, read from
  `.claude/agents/<engine>.md`. `scripts/check-registration.mjs` gains packs to its dead-path sweep, so a
  pack no mission names is a finding (X1, and honestly labelled per D8 — it proves callability, not
  calledness).

---

## 3 · Hands

### What it IS

Three tiers, and the tier is decided by *which process holds the hand*, not by a rule someone remembers.

**Tier H — harness hands.** Held by `tick.mjs`, which is outside the sandbox and outside Claude Code. No
worker ever calls these; the harness calls them on the worker's structured request. `git`, `gh`, `ffmpeg`,
`sips`, `mdfind`, `say`, `afplay`, `osascript`, `screencapture`, `shortcuts run`, `caffeinate`, `gemini`,
`ollama`. All measured present (hands.md §0.2, §3.3). **This tier is why the second model family works
here**: `gemini` fails inside a session because `~/.gemini` is in `denyRead` in `.claude/settings.json`, and
`ollama` fails because the sandbox denies loopback — neither restriction applies to a launchd child. No
sandbox edit, no `dangerouslyDisableSandbox`, no founder permission except consent to spend their Google
quota.

**Tier W — worker hands.** Whatever the pack's argv grants. Default `[Read, Write, Edit, Glob, Grep]`.
`Bash` is granted to exactly one pack family (`web-feature`) because `Bash` is a general capability and
granting it is granting everything the sandbox permits.

**Tier F — founder hands.** Everything that leaves the machine. Never in any argv. Published by a founder-run
command over a staged artifact.

**The five servers to build.** Each is one file, modelled on `scripts/mcp/claim-append-server.mjs`, which is
the template this repo already proved: one server, one tool, one fixed path, the target not a parameter, and
the real refusal in a library (`scripts/lib/claim-append.js`) rather than in the policy file.

| # | File | Tool(s) | Why a server and not a file write |
|---|---|---|---|
| 1 | `scripts/mcp/board-server.mjs` | `read_board`, `propose_move`, `declare_blocked`, `ask_help` | The mission state machine lives in the server, so an illegal transition is *refused at the call*, not caught by a lint afterwards. Lets a worker change state while holding no `Write`. |
| 2 | `scripts/mcp/fields-server.mjs` | `append_field` | Global writes to `~/.agentvibe/fields/` without granting a global write tool. Registers each note as a claim with `valid_until`, so field knowledge expires like every other claim (`STARTUP-OS.md` §6). |
| 3 | `scripts/mcp/shipped-server.mjs` | `register_shipped`, `read_verdict` | W3's register with a mandatory `check_on`; W1's world readings come back through it. Read-only against instruments. |
| 4 | `scripts/mcp/transcripts-server.mjs` | `search_transcripts` | `mdfind -onlyin ~/.claude/projects` behind one read-only tool. No index, no embedding, no server process to babysit (hands.md §3.3). Instrumentation only — never memory (A4). |
| 5 | `scripts/mcp/outbound-server.mjs` | `stage` | **The outbound wrapper, and the reason it is real here.** It stages an artifact and returns an id. It never publishes. |

**On the outbound wrapper, which the board could not resolve** (could_not_resolve #6: *"a wrapper is a
control only if it is the sole path to the capability and nothing in this runtime interposes it"*). The
Architect is right that a hook cannot rewrite `mcp__higgsfield__tiktok_publish` into `wrapper.publish(hash)`
— `pre-tool-use.sh` has two verbs. But *interposition is the wrong frame*. The wrapper becomes the sole path
when every other path is **absent from the process**, and `--strict-mcp-config` plus an explicit
`--mcp-config` naming only our five servers is exactly that absence. Not a policy. A roster. Conditional on
`MEASURE: M2`.

**What is refused.** No direct grant, in any pack, ever, to: `mcp__higgsfield__*` publish or `sandbox_exec`,
Gmail `send_message`, Drive `share_file`, `claude-in-chrome` (the founder's authenticated browser — the
widest hand documented anywhere, `risk:irreversible` by any honest reading, hands.md §3.5), Meta Ads,
DocuSign, Lob, or any domain registrar. `playwright` is granted to the design packs only, and only through
the project-scope definition, with `.claude/mcp-policy.json`'s existing deny list intact.

**One free daily oracle nobody runs:** `claude mcp list` reports health per server. Three servers are
unauthenticated, two fail, and nothing looks (hands.md §8). It becomes a launchd job writing
`~/.agentvibe/hands.json`, and a red row on the balcony.

### Built from · Binds · Enforced by

- **Built from** hands.md §0.1, §0.2, §0.3, §3.1, §3.3, §3.5, §5.1, §8; the `claim-append` server as
  template; R4 (dry-run by default, from this repo's PR #116).
- **Binds** D2 (no money-spending hand is connected at all — the refusal is the mechanism until a number
  exists) · D3 · D9 (nothing inbound from the internet) · D13.
- **Enforced by** `scripts/loop/pack.test.mjs` (a compiled argv containing any denied tool name fails);
  `.claude/mcp-policy.json`'s existing `credentialed: true` rule, which `pre-tool-use.sh` honours
  **regardless of `mode`** — the one asymmetry already hard-coded in the hook, and the right place to mark
  the outbound server if it ever gains a real credential.

---

## 4 · Knowledge

### What it IS

**Skills: injected, not discovered.** The measured failure is that 134 curated skills exist, with a
two-tier router at `.claude/skills/routers/INDEX.md`, and **0 of 18 agents cite one**
(`00-TERRITORY.md`). Discovery left to the worker is discovery that does not happen. So
`scripts/loop/prompt.mjs` — which runs in the harness — reads the pack's `skills:` list and inlines the
router index (~370 tokens) plus the one matching namespace (~700 tokens) into `--append-system-prompt`. The
worker does not have to remember to look; it arrives with the map. Same cure that took
`session-start.js` from 27,069 bytes (truncated, so the lenses never reached context at all) to 2,941.

**Mental models: attached to packs, not to agents.** 28 thinking skills carry stop rules and nothing cites
them. A pack names at most two (`thinking-theory-of-constraints`, `thinking-inversion`), the harness inlines
their stop rules, and `scripts/check-registration.mjs`'s dead-path sweep covers the reference.

**Fields: `~/.agentvibe/fields/<slug>.md`, global, expiring.** Decision 9's *global facts, project taste*
gets a mechanism from the sandbox itself: `~/.agentvibe` is the only path outside the project root on the
Bash sandbox's `allowWrite` list in `.claude/settings.json`. Global knowledge therefore has exactly one legal
home, and a project-scoped fact physically cannot be written there by a worker — only by the harness, on an
explicit `append_field` call. Each note is registered as a claim with `valid_until`, so *how short-form video
works* expires on a schedule and forces a disposition, exactly as `STARTUP-OS.md` §6 intends.

**Exemplars over rules** (C16). A field note's required shape is: three named examples, what makes each
good, and one thing that would be wrong here. A note that is only principles fails
`scripts/check-fields.mjs`. Recognition beats rule-application at the volumes a one-founder company works
at, and rules written today about a field that moves are the playbook the founder is complaining about.

**Taste: `company/taste.yml`, project scope, founder-authored.** References, adjectives, no-gos, and one
`one_line:` — the sentence a stranger should be able to say back after five seconds. It is tiered
`irreversible` in `.claude/qa-tier-floor.yml`, so an agent editing it trips the binding gate. Taste enters
once, at the top (`STARTUP-OS.md` §7); everything below derives.

**Negative knowledge: `company/dead-ends/<goal>-<n>.md`** (N1), one file per failed approach, with the field
that matters — *what would make this worth retrying*. Where a failure is reproducible by a command it is
instead a **negative claim** (N2): `assert`, `verified_by: command`, and `valid_until`, so expiry asks *does
this still fail?* on a schedule. The split between the two stores is *whether a command exists*, not
importance.

**How a worker finds what it needs:** router index (injected) → `Grep`/`Glob` in-repo → `search_transcripts`
→ `WebSearch`. In that order, and the first three cost nothing.

### Built from · Binds · Enforced by

- **Built from** C16, C25, K1, K3, N1, N2 (`concepts.md`); the skills-router two-tier pattern already in
  `CLAUDE.md`; `session-start.js`'s byte-budget lesson.
- **Binds** Decision 9 (`STARTUP-OS.md` §2) · D7 (taste never becomes a self-score).
- **Enforced by** `scripts/loop/prompt.test.mjs` — the constructed prompt contains the router index and the
  pack's named stop rules, and is under 4,096 bytes (the same budget and the same test shape as
  `scripts/session-start.test.mjs`). `scripts/check-fields.mjs` fails a note with no exemplar and no
  `valid_until`. `tick.mjs` refuses to close a move with `outcome: failed` and no dead-end file.

---

## 5 · Memory

### What it IS

Six stores. **One rule each, and one writer each** — a store with two writers is a store with no rule.

| Store | Path | The one rule | Sole writer | Expires |
|---|---|---|---|---|
| Goal tree | `company/MISSIONS.yml` | State transitions come from a table; anything else is refused | `board-server.mjs` | when the goal closes |
| Baton | `company/BOARD.md` | Rewritten whole, ≤4,000 bytes, never appended | `tick.mjs` | every cycle |
| Fields | `~/.agentvibe/fields/` | Global only; every note is a claim with `valid_until` | `fields-server.mjs` | via the ledger |
| Taste | `company/taste.yml` | Project only; founder-authored | the founder | on founder change |
| Dead ends | `company/dead-ends/` | Append-only; one file per failed approach | `tick.mjs` at close | never (N5 supersession) |
| Decisions | `.claude/memory/DECISIONS.md` | Unchanged, including its 40,000-byte cap | any agent | via `evict-memory.mjs` |

**Retrieval** is `Grep` and `mdfind`. No vector store, no embedding service, no index to rebuild at 3am. The
transcript search is `mdfind -onlyin ~/.claude/projects <phrase>` behind the transcripts MCP server — the
five-minute version of the thing that would otherwise be a subsystem, and the thing that settles whether the
subsystem is worth building (hands.md §6 item 4).

**Conflict** is MEM2, which this repo already practises in prose and will now do in data: newer wins, older
superseded **in place with its reason**. A superseded field note keeps its file and gains a
`superseded_by:` header. Deleting the old note deletes the evidence of the correction, which is the part
worth keeping.

**Forgetting is a tool, not a judgement call** (MEM3). `scripts/evict-memory.mjs` already implements the
four rules and refuses what they forbid; a second eviction path is `company/dead-ends/` reaching a byte cap,
handled by the same tool pointed at a second directory.

**What transcripts are for: instrumentation, never memory** (A4). 2,936 files, mostly noise, full of
*superseded beliefs stated confidently* — retrieval cannot tell a corrected belief from a current one, so
RAG over them resurrects exactly the errors the supersession discipline buries. They are read for four
things only, all monthly, all in the harness: where the founder corrected us (M1, a regex classifier),
where sessions die (M4), promises that never landed (M3), and the token accounting `scripts/lib/usage.js`
already does.

### Built from · Binds · Enforced by

- **Built from** MEM1–MEM3, N1, N5, M1–M4, A4 (`concepts.md`); `evict-memory.mjs` and the supersession
  discipline (this repo).
- **Binds** Decision 9 · D8 (last-use telemetry over stores, keyed on the task id).
- **Enforced by** `scripts/check-memory-budget.mjs` extended to `BOARD.md` and `company/dead-ends/`;
  `scripts/ledger.mjs lint` fails a field note claim with no `valid_until`; `claim-freshness` fails it once
  the date passes. The sole-writer rule is enforced by tool absence: no pack grants `Write` to a path
  outside the project's work directory, and the global path is unreachable from a sandboxed Bash except
  through the fields server.

---

## 6 · Communication

### What it IS

**Star topology, and it is physics here rather than policy** (CO3). A `claude -p` child has no address:
nothing can send it a message, and it cannot enumerate its siblings. Worker↔worker communication is not
forbidden, it is *unimplementable*, which is the strongest form of a rule. Everything goes through the
harness.

**Orchestrator↔worker** is three artifacts and nothing else:

1. **Down:** the compiled prompt — commander's intent (P7: task, purpose, end state, constraints), the task
   id, `BOARD.md`, `STEER.md`, the pack's skills, and the done-test. No method, no steps.
   `.claude/hooks/schema-lint.js` already refuses a playbook stage carrying `steps:`, `how:`, `method:` or
   `implementation:`; point the same predicate at the move brief and the enforcement is written.
2. **Up:** the JSON on stdout from `--output-format json`, parsed by `tick.mjs` into a fixed return: the
   artifact paths, the done-test result, `learned:`, `tried:`, and one of
   `done | blocked | stuck | failed | truncated`.
3. **Sideways:** the board MCP server, for a state change the worker must make mid-move.

**Never trust the return** (`STARTUP-OS.md` §7 — nine of nine reviewers once completed and never sent). Two
independent checks, both mechanical: the oracle runs over the *files on disk*, not the report; and the
final turn's `stop_reason` — which `scripts/lib/usage.js`'s `turnsFrom()` already extracts and stores as
`stop` — distinguishes a move that finished from one that was cut off. A truncated move is never `done`.

**Collisions.** launchd will not start a second copy of the same job, but this design has three jobs running
the same script (tick, watch, briefing), so the lock at step 1 is required, not decorative:
`fs.openSync('~/.agentvibe/tick.lock', 'wx')` with the pid inside, released in a `finally`, treated as stale
after 30 minutes. File-level collisions between a worker and the founder are handled by leases on path
prefixes (CO4), which `bin/warroom` already implemented as cross-worker file overlap detection and which is
one of the six features `STARTUP-OS.md` §1b says must be reborn as data.

**Help** is N3: a typed event with a **required `tried:` list**, refused by the board server without it. The
help request and the dead-end record are the same act, written at the one moment the worker wants to write
it. Escalation follows B4's ladder with maximum dwell times — L1 another approach (max: the stall ceiling),
L2 the council (max: one cycle), L3 the founder (no max) — and promotion is mechanical, because an
escalation ladder whose promotion requires a judgement is the empty Inbox again.

### Built from · Binds · Enforced by

- **Built from** CO1–CO4, N3, B4, P7 (`concepts.md`); Metaswarm's fresh-instance rule; `bin/warroom`'s
  overlap detection.
- **Binds** D1 (a help request with no task id is refused) · D11.
- **Enforced by** `scripts/loop/return.test.mjs` — a return missing any required field, or carrying
  `done` with a truncating `stop_reason`, is recorded `truncated`; the board server refuses `ask_help`
  without `tried:`; `scripts/loop/tick.test.mjs` pins that two concurrent ticks produce exactly one move.

---

## 7 · Context & cost

### What it IS

**What is injected into whom.** Into the *session* (the founder's own terminal): `session-start.js`, already
at 2,941 bytes against a 4,096 budget. Into a *worker*: `scripts/loop/prompt.mjs`'s output, under the same
4,096-byte budget and pinned by the same test shape. Into a *persona*: the framing only, sealed — no peer
text, which is Metaswarm's anchoring-bias rule and is asserted by a test that the constructed prompt
contains no string from another persona's output.

**Ordering for the cache, and it is worth doing deliberately.** Prompt caching reuses a stable prefix at a
fraction of input cost. So `prompt.mjs` emits, strictly in this order: (1) the pack's fixed preamble, (2)
the router index, (3) the skill bodies, (4) the taste file, (5) `BOARD.md`, (6) `STEER.md`, (7) the task id
and this move's intent. Everything volatile is last. Rebuilding the prompt in any other order costs real
money on every move and nothing tells you.

**Batch: not available.** `claude -p` is one interactive-shaped request per invocation; there is no batch
endpoint on the CLI. Say it rather than designing around a facility that does not exist. The cost lever
that *does* exist is model tiering (§13).

**Compaction: designed out.** A move runs in a fresh process with a bounded turn budget, so compaction never
fires. A move large enough to need it is a move that was scoped wrong; `tick.mjs` records it as `truncated`
and `next.mjs` splits the goal. This is the correction to the Ralph loop's measured behaviour
(`STARTUP-OS.md` §8b: conversation accumulates, compacted past 70% of a 150k window).

**The task id is the join, and it must be there from the first row** (D1, and CAST's unrepairable failure —
cost attribution there needs a heuristic 60-second time-window join because there is no foreign key). Two
changes:

```js
// scripts/lib/events.js — signature change, five call sites today
function logEvent(task, obj, repoRoot = REPO_ROOT) { … }   // was logEvent(obj, repoRoot)
```

A missing task id becomes an authoring-time error, not a silent null. And `tick.mjs` writes
`~/.agentvibe/tasks.jsonl` mapping the task id to the `session_id` that `--output-format json` returns
(`MEASURE: M4`), which is what makes cost and stall *per-lane* rather than account-wide.

**Cost per mission** is then a real query, not a heuristic: sum `total_cost_usd` over the tasks belonging to
the mission. Cost per *surviving* artifact (EC2) divides that by the count of register entries still live at
their `check_on` date — the number that actually matters and that nobody computes.

### Built from · Binds · Enforced by

- **Built from** CT-family and EC2, EC3 (`concepts.md` §14d, §14g); CAST's task-id failure
  (`STARTUP-OS.md` §8b); `session-start.js`'s byte budget; `ccusage`-style transcript accounting
  (`open-source.md` §6).
- **Binds** D1, and this is where it is actually paid for.
- **Enforced by** `scripts/loop/prompt.test.mjs` (budget + ordering); `scripts/events.test.mjs` pins the
  two-argument arity of `logEvent`, so a one-argument call fails the suite; a new check-suite step
  `check:taskid` scans `~/.agentvibe/events.jsonl` and fails when any row written after the cutover date
  lacks `task`.

---

## 8 · Quality & truth

### What it IS

**The oracle runs first, always, and it is deterministic.** `.claude/workflows/qa.js` already establishes
this — a deterministic oracle before any panel agent is dispatched — and it is the single most valuable
pattern in the repo. Generalised per artifact type, in `scripts/loop/oracle.mjs`:

| Artifact | Rung-0 oracle, no model involved |
|---|---|
| code | `npm run check` exit code |
| a page | `playwright` screenshot is non-blank; every internal link resolves; `< 1` console error |
| an image | `sips -g pixelHeight` returns a size; file is not zero bytes |
| a video | `ffprobe` returns a duration and a stream; audio track present if the pack declares one |
| copy | non-empty; passes a link check; contains `taste.yml`'s `one_line` concepts |

Rung 0 is *it renders*. **Nothing above rung 0 is claimed unless an instrument said so** (W2, the evidence
ladder, and the anti-inflation job is its real job: it stops a rung-0 result being reported as a rung-2
claim, which is how a machine spends two years learning to lie to itself).

**The done-test never resolves through the producing model** (D7, A3). Rung 1 — *a stranger understands it
in five seconds* — is a fresh `claude -p` with **no project context, no taste file, no board**, given only
the artifact and asked one question: *what is this offering?* Its free-text answer is matched
deterministically against `taste.yml`'s `one_line` concepts by `scripts/loop/rung1.mjs`. A different model,
a different context, a mechanical comparison, and no score anywhere.

**No summed scores, anywhere** (D7, A1). The live instance is named: `.claude/workflows/design.js` sums four
0–10 axes into a `total` and sorts. It is replaced with C1's blind pairwise comparison — identities
stripped, order randomised, each pair run twice with the order swapped, and **a pair that flips resolves
`unresolved`, never to a winner** (Rule 10). Aggregation is a Copeland count, which is arithmetic.

**The second family, and this is where the runtime pays out.** `gemini` 0.38.2 is installed and has never
executed, because the sandbox denies it its own config directory. `ollama` is authenticated with two model
pins six months retired. Neither is a capability problem; both are sandbox problems, and **the harness is
not sandboxed**. So `scripts/loop/judge2.mjs` shells `gemini -p` from `tick.mjs`, with the same TTY-detach
caution CLAUDE.md already records against Codex bug #19945 — exit 0 with empty stdout is exactly how a
resolver runs, so `judge2.mjs` treats empty stdout as `unresolved`, never as pass. This retires an accepted
risk carried in four places and running to 2026-11-17, and it needs no settings change and no new install.
It needs the founder's consent to spend their Google quota (`STARTUP-OS.md` §8 item 3), which is a policy
question, not a runtime one.

**The council** is personas as packs, not as agent files: `.claude/packs/persona-adversary.yml` with
`--allowedTools Read,Grep,Glob`, `--strict-mcp-config` and an empty MCP config. That satisfies D13(a) —
something narrows the roster — without five new agent files, and D13(b)'s cost cap becomes real because
`--output-format json` returns the run's cost, so the tick can stop the meeting at a number. **Findings
only, never scores** (C17). Convergence is Metaswarm's: fresh instances every round with zero visibility
into prior findings, a 3-round cap, then escalation carrying an iteration-history table.

**The world's verdict** is a fifth ledger resolver, `claim-world` (W1), registered alongside the five in
`scripts/lib/resolvers.js`. Its evidence names an instrument and a threshold; the resolver queries the
instrument; an unreachable instrument returns `unresolved`, never `pass`. It will say `unresolved` far more
often than `pass` at one-founder volumes, and that is honest and should be said in advance rather than
discovered as disappointment.

**The verdict-binding seam, which nobody engaged with and which the first non-code mission discovers by
shipping** (`architect:R2:P1`). `scripts/verdict.mjs` binds `subject = sha256(git diff)`. A published video,
a sent email, a live page and a price change have no diff, therefore no subject, therefore no verdict
record. So for three of the four pack families the human gate is not one control among several — **it is the
entire enforcement spine** (D6). The narrow fix, and it must not become a second implementation: extend
`verdict.mjs` with one additional subject mode, `sha256` over the *staged artifact bytes* returned by the
outbound server, in the same file, behind the same binding rules. One subject function, two input kinds.

**Taste vs correctness.** Correctness is the oracle and it blocks. Taste is the founder and it blocks
differently: it enters once through `taste.yml`, and where a move's output contradicts a no-go the tick
records a finding and escalates rather than deciding. No judge is ever asked whether something is *good*.

### Built from · Binds · Enforced by

- **Built from** C1, C17, C19, C22, W1, W2, A1, A3 (`concepts.md`); GSD's subprocess competitor panel and
  Metaswarm's fresh-instance convergence rule (`STARTUP-OS.md` §8b); `qa.js`'s oracle-first ordering.
- **Binds** D7 (both halves) · D6 · D3.
- **Enforced by** `scripts/ledger.test.mjs` pins `unresolved` as distinct from `pass` for `claim-world`, as
  it already does for every resolver; a new suite step `check:no-scores` fails any schema under
  `.claude/workflows/` or `.claude/packs/` carrying a numeric field named `total`; `scripts/check-donetests.mjs`
  fails a done-test whose resolver is the producing model.

---

## 9 · Control & safety

### What it IS

**Be honest about where the seam is.** The Omnigent policy seam — typed handlers at six phases, first DENY
short-circuits — is the best architecture in the reference set and **it cannot be built here**, because it
requires owning the agent loop and we do not own it. What this runtime offers:

| Phase | Primitive | Can it stop an action? |
|---|---|---|
| before a tool call | `PreToolUse` hook → `pre-tool-use.sh`, `exit 2` | **Yes.** The only blocking mechanism in the repo. |
| after a tool call | `PostToolUse` hook | **No.** Its stdout becomes context — a nudge the model may ignore. CAST shipped this believing otherwise. |
| worker start | the argv | **Yes, and absolutely.** An absent tool cannot be called. |
| worker end | `Stop` / `SubagentStop` hooks | No — but they can *record*, and `.claude/hooks/stop.sh` already exists and is **registered nowhere** in `.claude/settings.json`. |
| session end, compact, notify | `SessionEnd`, `PreCompact`, `Notification` | No. Telemetry. |

So: **the policy seam is the argv, and the hooks are instrumentation.** Anything designed as a policy
handler that must *stop* something and is not expressed as an absent tool is labelled `WISH` in this design.
This is the one place where I decline to port the best idea in the catalogue, and the reason is that a seam
that reads like enforcement while nothing behind it refuses is the exact defect this repo's rules table was
rewritten to remove (A6).

**Grants** are §2's packs. **Reach** is D3, resolved in the one classifier:

```js
// scripts/lib/classifier.js — one new exported function, same rules object, no parallel implementation
function classifyGrant({ paths, reach }) {
  return maxTier(classifyFiles(paths, rules).tier, REACH_FLOOR[reach]);
}
```

with the floors declared as data in `.claude/qa-tier-floor.yml` beside the path rules:

```yaml
reach_floors:
  local:          lite
  outbound-read:  lite
  outbound-write: irreversible     # publish, post, send
  spends:         irreversible
  speaks-as:      irreversible     # as the founder, to a named person
```

This is exactly what D3 forces and A5 forbids doing twice. The measurement that makes it urgent is in D3:
`node scripts/classify.mjs assets/promo.mp4 posts/launch.txt` returns `tier=lite · enforcement=shadow` for
both — a video and a caption about to be published under the company's name, unattended — because the
classifier's only input today is a normalised path string, and a worldly action has none.

**Gates.** `.claude/gates.yml` already declares `kind: human`, `scripts/check-gates.mjs` already refuses one
written with a `run:`, and resolving one returns `unresolved` with reason `human-stop`, **always, on
purpose**. That is GSD's `blocking-human` class, by type, already built. What it lacks is a caller (D6). The
caller is `tick.mjs` step 7: a pack whose effective tier is `irreversible` compiles only if its goal names a
`kind: human` gate id, and the tick refuses to dispatch until that gate has a recorded founder disposition.
Two new gate ids: `done-test-approval` and `publish-approval`.

**The kill switch, three ways, none of them in a prompt** (D10 is right about this and it is the sentence I
would keep above all others):

1. `launchctl bootout gui/501/ai.agentvibe.tick` — the supervisor stops. Nothing restarts it.
2. `touch company/STOP` — the next tick exits at step 2. Works from the founder's phone through a Shortcut.
3. `company/STEER.md` with `stop:` — the andon cord. Halts after the current move at its next durable
   artifact, so nothing is lost (S3).

**What runs at 3am:** `reach: local` packs only. Code, copy, design, research, analysis, staging. Every
artifact that would leave the machine is *staged* and waits.
**What never runs unattended, at any hour:** anything at `outbound-write`, `spends` or `speaks-as`. There is
no autonomy level, no full-auto flag, and no override that changes this, because the mechanism is that the
tools are not in the process.

**Prompt injection.** No reasoning-layer control survives it (`risk-modeler:R2:P14`, and I adopt this
verbatim). The structural answer is D9: **inbound is last and the loop has no inbound.** `WatchPaths` on a
local directory the founder writes is not foreign content. `WebFetch` is granted only to research packs
whose grant contains no write tool and no outbound server — so a fetched body reaches a context that
physically cannot act on it, which is the whole of D9's concession: *a deterministic parse into a data file,
never a fetched body into a producing context.*

### Built from · Binds · Enforced by

- **Built from** R1–R6, S3, S4, A5, A6 (`concepts.md`); GSD's two-tier gates; hands.md §5.1 patterns 3 and
  8; Omnigent's seam, **explicitly not ported**, with the reason stated.
- **Binds** D3, D6, D9, D10, D2.
- **Enforced by** `scripts/classifier.test.mjs` extended with reach cases; `scripts/gates.test.mjs`
  (already blocking, run by `npm run test:playbooks`) extended so a pack at `irreversible` with no human
  gate id fails; `scripts/loop/pack.test.mjs` for the tool-absence assertions; `scripts/sandbox-config.test.mjs`
  already fails if `sandbox.enabled` is flipped.

---

## 10 · Surfaces

### What it IS

**Terminal — `npm run balcony`.** `scripts/balcony.mjs` reads `~/.agentvibe/events.jsonl`, filters to
`move.*` rows, and prints **goal-sized rows, 2–4 a day**, never dispatch-sized. One row is one goal reaching
a terminal state. Every row carries: task id, goal, pack, outcome, rung, cost, and the one verb available.

```
t-20260902-a1b2c3  g-landing-copy   content-copy   done      rung 1   $0.42   [see]
t-20260902-7f9e01  g-landing-build  web-feature    blocked   —        $1.18   [clear: needs a domain]
t-20260902-c4d5e6  g-hero-image     design-brand   staged    rung 0   $0.71   [approve · reject · edit]
```

**Three verbs, and the third is the one that matters.** LangGraph's human-in-the-loop offers approve /
reject / **edit the arguments**, and edit is a strictly better founder verb than yes-or-no — it is the
answer to *you cannot steer something already running* (hands.md §5.1 pattern 9). `[edit]` opens
`company/STEER.md` prefilled with the task id.

**Two channels, never merged** (S1). A **redirect** targets a task id, must be acknowledged, and changes the
current move. An **annotation** targets a field or the project, needs no acknowledgement, and lands in
`taste.yml` for the next artifact. The founder says which; the system never guesses. A redirect with no task
id is refused — CAST's lesson, one layer up.

**Phone and voice, out of parts already installed.** `say` writes a spoken briefing to an audio file for
free and offline; `afplay` plays it; `shortcuts run <name>` reaches the founder's iPhone through iCloud
sync, which is the escape hatch for every service that refuses to be automated; `osascript -e 'display
notification'` is the interrupt. All measured present (hands.md §3.3). Gap #9 — *the founder talks to this
system by voice and nothing is designed for it* — has a zero-cost half-answer already on the machine, and I
would ship that half before considering a voice vendor.

**Briefing.** A launchd `StartCalendarInterval` job at 08:00 writes `company/briefing-YYYY-MM-DD.md` with a
fixed shape (V2) — what landed, what is blocked and who clears it, what is queued, yesterday's spend, and
one decision requested — then speaks the first 200 words. A tree, not a wall (V3): the spoken form is the
top level; the file has the rest.

**Walkthrough and Q&A: a replay, not a generation** (E1, E4). `scripts/explain.mjs <task-id>` reconstructs
what happened from event rows and the artifact diff. It never asks a model to remember. **An explanation
with a hole says so** (E2) — a step with no event row is printed as `[no record]`, which is Rule 10 applied
to self-explanation.

**When it may interrupt.** Only for a block whose `clearable_by` is the founder, only between 08:00 and
22:00 by the tick's own clock, and at most three per day. Everything else queues to the morning briefing.
B4's dwell ladder is what stops a queue becoming an empty Inbox: nothing waits at a rung indefinitely, and
promotion is mechanical.

### Built from · Binds · Enforced by

- **Built from** S1, V1–V5, E1–E5, B4 (`concepts.md`); hands.md §3.3; LangGraph's edit verb.
- **Binds** the founder decision that rows are goal-sized and 2–4 a day (board R0) · D1 (every row carries
  the id) · Decision 5, balcony-only, Claude-native — no Telegram, no bot.
- **Enforced by** `scripts/balcony.test.mjs` fails when a row has no `task`; `scripts/explain.test.mjs`
  fails when a reconstructed step with no event row is rendered as narrative rather than `[no record]`.

---

## 11 · Runtime

### What it IS

**Where the loop lives: three launchd plists in `~/Library/LaunchAgents/`, and the loop body is a process
that is *supposed to exit*.**

```xml
<!-- ai.agentvibe.tick.plist -->
<key>ProgramArguments</key>
<array>
  <string>/usr/bin/caffeinate</string><string>-i</string>
  <string>/opt/homebrew/bin/node</string>
  <string>/Users/adamks/VibeCoding/agentvibe/scripts/loop/tick.mjs</string>
</array>
<key>StartInterval</key><integer>300</integer>
<key>StandardOutPath</key><string>/Users/adamks/.agentvibe/tick.log</string>
<key>StandardErrorPath</key><string>/Users/adamks/.agentvibe/tick.err</string>
```

| Plist | Trigger | Job |
|---|---|---|
| `ai.agentvibe.tick.plist` | `StartInterval 300` | one move, then exit |
| `ai.agentvibe.watch.plist` | `WatchPaths: [company/STEER.md, company/inbox/]` | fire a tick now, so steering has seconds of latency instead of five minutes |
| `ai.agentvibe.briefing.plist` | `StartCalendarInterval 08:00` | write and speak the briefing; run `claude mcp list` as the hands oracle |

**Supervision is two layers and they supervise different failures** (S4). Inner: `tick.mjs` spawns
`claude -p` with a timer and SIGTERMs at `pack.timeout_s`, recording `outcome: timeout`. Outer: launchd
restarts nothing — it simply fires again in five minutes. **There is no restart storm to guard against,
because there is no long-lived process to restart.** Auto-Co's `.gitignore` names a circuit breaker that
exists nowhere in its code; this design does not need one, which is a better answer than implementing it.

**Recovery is the next tick.** A crashed, killed, sleeping or SIGKILLed tick leaves: a stale lock (aged out
at 30 minutes), a `BOARD.md` from the previous cycle, and a possibly half-written artifact in a git worktree.
There is no in-memory state to reconstruct because the only state is on disk and every write is
last-writer-wins on a whole file. That is the entire recovery design and it is why I chose this shape.

**What runs with the lid shut:** nothing, and I would not pretend otherwise. `caffeinate -i` prevents idle
sleep while a tick runs; it does not defeat a closed lid. `pmset` can schedule a wake. The honest statement
for the founder is: **this company works while the Mac is awake, and the overnight story is "wakes on a
schedule, works, sleeps"**, not "runs continuously in a data centre". Designing for the second is designing
for a machine we do not have.

**Models per job** — the ids pinned by `scripts/prompt-standard.test.mjs`, so a brief naming a retired one
fails a blocking lint:

| Job | Model | Why |
|---|---|---|
| oracles, classification, log parsing, rung-1 stranger test | `claude-haiku-4-5` | deterministic-adjacent, high volume |
| making — code, copy, design, video assembly | `claude-sonnet-5` | the default; 80% of moves |
| the council, synthesis, a genuinely novel field | `claude-opus-5` | escalate, never default |
| the second-family check | `gemini` in the harness | the only non-Anthropic path that exists on this machine |

**What this runtime cannot do, stated plainly:**

- **A `Workflow` is main-session only.** Measured: 0 of 55 calls from a sidechain against 57,590 subagent
  `Bash` calls. `PS-WORKFLOW-CONTAINMENT` in `.claude/hooks/schema-lint.js` enforces that no engine declares
  it, and `scripts/probe-workflow-reach.mjs` probes it. D10 infers that `claude -p` under launchd is not a
  sidechain and therefore *can* invoke a Workflow. **That inference is unmeasured and it is board action
  item 9.** `MEASURE: M7`. If it is false, `.claude/workflows/qa.js`, `coding.js`, `design.js` and
  `research.js` are reachable only while the founder is typing, and the loop calls their logic through
  `node` instead — which is a bridge, not a redesign, because they are ordinary JavaScript files.
- **`CronCreate` is session-only.** Its own schema says jobs live only in the session, `durable` has no
  effect, jobs fire only while the REPL is idle, and recurring tasks expire after 7 days. It is a
  within-session heartbeat and this design uses it for nothing.
- **The sandbox denies loopback and inbound binding.** There is no network setting that changes it; the
  model is an outbound domain proxy. That is why `check:mc` fails, why `ollama` is invisible, and why
  anything needing a local port lives in the harness.
- **`git worktree add` cannot complete under the armed sandbox.** Measured: exit 128, 32 denials.
  `tick.mjs` creates the worktree itself, unsandboxed, before spawning the worker — which is the correct
  division anyway.

### `MEASURE:` — the probe that must run before anything else

`scripts/probe-headless.mjs`, following the repo's existing probe convention
(`probe-readonly`, `probe-stop-reason`, `probe-agent-tool-inheritance`, `probe-workflow-reach`):

| id | Question | Why the design breaks without it |
|---|---|---|
| M1 | Do `SessionStart` and `PreToolUse` hooks fire under `claude -p`? | If not, `pre-tool-use.sh` never runs in the loop and the argv is the *only* control. |
| M2 | Does `--strict-mcp-config` exist and exclude user-scope servers? | **The load-bearing flag.** Without it the 3am loop holds `tiktok_publish` and Gmail send. |
| M3 | Does `--disallowedTools` override an `allow` rule in `settings.json`? | Decides whether the argv is a ceiling or a suggestion. |
| M4 | Does `--output-format json` return `session_id`, `total_cost_usd`, `num_turns`, `is_error`? | The task↔session join (D1), the cost ledger, and D13's cost cap all read these. |
| M5 | Do transcript JSONL lines carry `sessionId` and `cwd`? | Per-lane stall scoping (D4's second repair) needs one of them. |
| M6 | Does the `sandbox` block in `settings.json` apply to a `claude -p` child of launchd? | Decides whether the worker is contained at 3am. |
| M7 | Does a `Workflow` call succeed inside `claude -p` under launchd? | Board action item 9. Decides whether `qa.js` is reachable unattended. |
| M8 | Which two write exemptions does `pre-tool-use.sh` allow outside the project root? | Decides whether the fields server is needed or whether a worker could write globally. |
| M9 | The ten hook event names, exactly. | This design registers on six by name and must not invent one. |
| M10 | Does `--max-turns` exist, and what `stop_reason` does exhausting it produce? | The `truncated` outcome depends on telling it from `done`. |
| M11 | Does `WatchPaths` fire on in-place modification as well as replacement? | Steering latency. Editors that write-and-rename behave differently from `>>`. |
| M12 | `claude mcp list` exit-code semantics on an unhealthy server. | Whether the daily hands oracle can be a check or only a report. |

### Built from · Binds · Enforced by

- **Built from** hands.md §3.1 (launchd, `claude -p`, `CronCreate`'s fine print), §0.3 (the sandbox hiding
  two model families); S4; CLAUDE.md's sandbox and worktree measurements.
- **Binds** D10 — in substance, with one clause disputed in §17.
- **Enforced by** `scripts/probe-headless.test.mjs` pins each probe's `unresolved` value as distinct from
  `pass` (Rule 10); `scripts/loop/plist.test.mjs` asserts every generated plist names an absolute
  interpreter path and a log path, because a launchd job with a relative path fails silently and that is a
  3am hour spent on nothing.

---

## 12 · Self-improvement

### What it IS

**A correction becomes a mechanism or it is counted as not having become one** (SI1). Monthly, in the
harness, `scripts/mine-corrections.mjs` runs Metaswarm's regex classifier over the transcripts — ~50 lines,
`mdfind` for the shortlist, regex for the classification, no model in the loop. It looks for the shapes a
founder correction actually takes (*"no, I meant"*, *"that's wrong"*, *"stop"*, *"I said"*, *"don't"*) and
emits a table: the correction, the session, the task id where one exists. Each row gets exactly one
disposition — **a mechanism, or an explicit `none` that is counted**. A month of all-`none` is itself the
finding.

**Post-mortems produce a taxonomy entry, not a narrative** (N4). Seven tags, fixed: wrong target · missing
capability · unclear brief · hallucinated fact · budget exhausted · external block · tooling defect.
Narratives do not aggregate; counts decide where mechanism gets built.

**Promotion at three sightings** (SI2). A pattern seen in three dead-end files or three field notes becomes
a candidate skill. It does not become a skill automatically — `.claude/skills/CURATION.yml` already records
55 cuts *with the test that justified each*, and more than ten reversals, and that discipline is the reason
the skill library is the strongest layer in the repo.

**Retirement is telemetry, not opinion** (X2, X3). Every governed artifact — pack, gate, skill, check step,
MCP server — is keyed in the event log by the task ids that used it. **Zero calls in 90 days is the
retirement trigger.** This is D8's honest half: the birth certificate proves *callability*, and callability
is satisfiable by a trivial caller written to satisfy it; last-use telemetry proves *calledness*, and it is
only computable because D1 put the task id on the row. The two land together or the check measures the fix
and not the disease.

**Measuring "better": one company metric** (SI4) — **founder interventions per shipped artifact.** Both
terms are already countable: interventions are redirect and annotate events (§10), shipped artifacts are
register entries (§8). It is the only number that goes down when the system genuinely improves and cannot be
gamed by producing more.

**And D15, monthly, forever:** harness work against venture work, counted over session-file frontmatter and
classified through `scripts/lib/classifier.js` rather than a second implementation. **A finding, never an
automatic action.** It is the only instrument on the board that would have fired during the three weeks in
which every mechanism was built correctly and nothing was pointed at anybody.

### Built from · Binds · Enforced by

- **Built from** SI1–SI4, M1–M4, N4, X2, X3 (`concepts.md`); Metaswarm's regex classifier
  (`STARTUP-OS.md` §8b); `CURATION.yml`'s cut-with-a-test discipline.
- **Binds** D8 (the predicate lands with last-use telemetry or not at all) · D15 · D12 (the ratchet: above
  the artifact ceiling, adding one requires retiring one).
- **Enforced by** `scripts/ratio.mjs` as a monthly check-suite step that always exits 0 and always prints —
  a finding, never a gate; `scripts/check-registration.mjs` extended with last-use, so a governed artifact
  with zero calls in 90 days is a finding with its own line.

---

## 13 · Economics

### What it IS

**Three ceilings, three different jobs, and the repo currently conflates two of them.**

**1 · The rope — the rolling-window ceiling** (EC4, Decision 8). `windowUsage()` in
`scripts/lib/usage.js` returns account-wide output tokens over five hours. `tick.mjs` refuses to dispatch
above `ROPE = 0.6` of the founder's window. **Account-wide is correct here** — the whole point is that the
loop never competes with the founder for their own quota. This is the half of D4's repair that should *not*
change.

**2 · The circling brake — and it should be a clock, not a counter.** D4 measured the defect: past
`RETAIN_HOURS = 6`, `sinceLastArtifact()` degenerates into `windowUsage()` — a 19-hour stall and a 6-hour
one both returned 193,027 — so the detector is inoperative for exactly the regime it governs, since a 24/7
loop crosses six hours on night one by construction. Two repairs, both small, both in
`scripts/lib/usage.js`:

```js
// (a) Rule 10 on the counter: past the horizon it must not answer.
function sinceLastArtifact(opts = {}) {
  const artifact = lastArtifactAt(opts);
  if (!artifact) return null;
  const now = opts.now || Date.now();
  if (artifact.t < now - RETAIN_HOURS * HOUR) {
    return { unresolved: true, reason: 'artifact older than the retention horizon',
             age_hours: (now - artifact.t) / HOUR, since: artifact.t, kind: artifact.kind };
  }
  …
}
```

```js
// (b) The brake the loop actually uses is elapsed time, which is unbounded and needs no transcript scan.
const age = Date.now() - lastArtifactAt({ repoRoot }).t;      // already computed, currently discarded
if (age > STALL_HOURS * HOUR) → brake, escalate, do not dispatch
```

**The distinction is the point and the repo lost it:** the token counter answers *how much did we spend*;
the clock answers *are we going in circles*. Only the second is the anti-circling detector, and it was
already computed inside `budget-guard.js` and thrown into a warning string. Per-lane scoping — D4's second
repair — comes from the task↔session map (§7) and applies to the stall counter only.

**3 · The rate ceiling — money outside model tokens** (D2, R5). It does not exist and **the correct state is
that no such hand is connected at all.** Money is the only risk axis with a *rate*, and no tier in this
repository can express one. `scripts/loop/pack.mjs` refuses to compile any pack declaring `reach: spends`
while `company/limits.yml` has no `usd_per_day`. The refusal *is* the mechanism, and it costs nothing to
hold. Only the founder can supply the number (board action item 2).

**Cost per mission, and the company's P&L.** `company/pnl.yml`, written monthly by `scripts/pnl.mjs`:

```yaml
2026-09:
  model_spend_usd:    ""   # sum of total_cost_usd over tasks, from ~/.agentvibe/tasks.jsonl
  outbound_spend_usd: 0    # from ~/.agentvibe/spend.jsonl — zero while D2 holds
  revenue_usd:        ""   # founder-entered; nothing else may write it
  shipped:            ""   # register entries created
  surviving:          ""   # register entries still live at their check_on  → EC2
```

**Model tiering as spend** is §11's table, applied by the pack compiler. **A hard ceiling downgrades the
model rather than stopping the work** (EC1, and Omnigent reached the same rule independently): at the
ceiling, `pack.mjs` recompiles with `--model claude-haiku-4-5` and records the downgrade on the row, rather
than failing the move. And where a model has no catalogue price, it **asks** rather than scoring the spend
at zero — Rule 10, applied to money.

### Built from · Binds · Enforced by

- **Built from** EC1–EC4, R5 (`concepts.md`); Ralph's cache-aware `costIs()` and two-tier stop composition
  (`STARTUP-OS.md` §8b); Omnigent's cost gate.
- **Binds** D2 (absolutely — nothing spends until a number exists that something reads) · D4 (both repairs,
  in the stated order: repair, then register) · D13(b).
- **Enforced by** `scripts/usage.test.mjs` extended with a case pinning that a 19-hour-old artifact returns
  `unresolved` and not a number — the exact defect measured on 2026-09-02, as a red test;
  `scripts/loop/pack.test.mjs` for the `spends` refusal; `budget-guard.js` registered in
  `.claude/settings.json` **after** the repair lands, which is a founder edit (D4).

---

## 14 · The company itself

### What it IS

**Venture intake** is a directory and one entry: `company/ventures/<slug>/` holding `MISSIONS.yml`'s
subtree, `taste.yml`, `done-tests/`, `dead-ends/`, and `register.yml`; plus one row in
`company/ventures.yml` with `state: active | parked | wound-down`. Fields stay global at
`~/.agentvibe/fields/` (Decision 9). Onboarding a venture is: write the taste file, write one mission, name
the constraint. No code.

**Several at once, honestly bounded.** One tick, one lock, one move at a time. `next.mjs` considers every
active venture but dispatches only against the venture holding the current `constraint:` (P2), and at most
one mission per venture is `in_flight` (P5). Three active ventures on a five-hour shared window is not three
times the throughput; it is the same throughput, fragmented. The mechanism that keeps this honest is the
balcony: three ventures produce the same 2–4 rows a day, and the founder sees immediately that the second
and third are not moving.

**A second human** is one row in `company/people.yml` and nothing else, because approval is recorded in a
file rather than in a session:

```yaml
people:
  - id: founder      # can clear any block, approve any gate
  - id: contractor-1 # can clear blocks tagged design; cannot approve a human gate
```

A `clearable_by:` that names nobody in this file is refused by the board server. Gate approval remains the
founder's alone until the founder says otherwise, and that sentence is a row in a file, not a code change.

**Wind-down** is `state: wound-down`: `next.mjs` stops scheduling it, the register entries stay and keep
resolving (a page that is still live is still a claim about the world), the taste file is kept, and the
global field notes stay global — which is the entire argument for Decision 9. Nothing is deleted. X5:
retirement is archival.

**The first mission** is Decision 7's synthetic one — a landing page for a fake company — with one change I
argue for in §15: **it runs by hand on day 1, before any mechanism exists**, and it doubles as the founder's
demand test (D5). Two things the board wanted, from one afternoon.

### Built from · Binds · Enforced by

- **Built from** §14h of `concepts.md`; Decision 7 and Decision 9 (`STARTUP-OS.md` §2); P2, P5, X5.
- **Binds** D5 (the first artifact is also the instrument) · D12 (ventures are not governed artifacts and
  are not capped; packs are).
- **Enforced by** the board server's `clearable_by` resolution; `scripts/loop/next.test.mjs` pins that a
  `wound-down` venture is never scheduled.

---

## 15 · THE FIRST 30 DAYS

**Position 1 is an artifact, and the Adversary is right.** `adversary:R2:P13` measured that across four peer
build orders a mechanism sits at position 1 in four of four, and an artifact reaching a person outside this
system appears at *no position in any of them*. Three of four wrote that objection against themselves and
then put a mechanism first anyway. I am not going to do that, and my angle gives me a second, independent
reason to agree: **every mechanism in this design rests on twelve unmeasured runtime facts (§11), and the
cheapest way to measure eight of them is to produce one real artifact through the exact path the loop will
use.** Day 1 is therefore both the Adversary's artifact and the runtime-first probe, and it costs an
afternoon.

| Day | Step | Why it is forced here | Unlocks |
|---|---|---|---|
| **1** | **The artifact, by hand.** The founder runs one `claude -p` invocation with a hand-typed narrow roster and produces a landing page for a real thing. Publish it by hand, analytics on it, post it once, hands off for seven days. Write the pass/uninformative thresholds down **before** it runs. | It needs nothing that does not exist. It is D5's demand test and Decision 7's first mission at the same time. No agent publishes, sends or spends, so it requires none of the safety controls on this board. | The only signal from outside the system; the first real reading on cost and turns |
| **2** | **`scripts/probe-headless.mjs`** — M1–M7, M10. | Eight of the twelve unmeasured facts are measured by the same invocation shape day 1 already used. Everything after this either stands or is redesigned; discovering M2 is false on day 20 wastes eighteen days. | The go/no-go on the entire loop shape |
| **3** | **The task id.** `logEvent(task, obj)`, the `~/.agentvibe/tasks.jsonl` map, `check:taskid`. | D1: the only decision whose *omission* cost is unbounded. Every row written without it is permanently unattributable and the corpus grows daily. Nothing else depends on it, so it is never cheaper than now. | Per-lane cost, per-lane stall, last-use telemetry, every balcony row |
| **4** | **The stall repair.** `sinceLastArtifact` returns `unresolved` past the horizon; the clock brake; per-lane scoping. Then the founder registers `budget-guard.js`. | D4, in that order. Registering first produces a *believed* brake, which is the failure class this repo has cured four times elsewhere. | The loop's only real brake |
| **5–7** | **`tick.mjs` + `next.mjs` + `pack.mjs`, run by hand.** One move end to end, `MISSIONS.yml` written, `BOARD.md` written, one row on the balcony. No plist yet. | The loop must be correct while a human is watching before it is correct while nobody is. | The first machine-picked move |
| **8** | **`.claude/packs/` — the first four**: `web-feature`, `design-brand`, `content-copy`, `customer-market` (Decision 6). All `reach: local`. | Packs are argv, so this is four small files, not four agent files. | The four families |
| **9** | **`ai.agentvibe.tick.plist` — the first unattended run.** Daytime, founder present, `reach: local` only, one venture. | Everything above must exist; nothing below is safe without a measured, watched unattended run. **Founder authorisation required** — it is the first unattended process on the machine (board action item 9). | 24/7, with training wheels |
| **10–12** | **Reach in the classifier** (`classifyGrant`, `reach_floors:`) **and the human gate's caller.** | D3 and D6. Forced *before* any non-local pack exists, because after is retrofitting. | The tier that can tell a test run from a published video |
| **13–15** | **`outbound-server.mjs`** — staging only, never publishing — and `publish-approval` as a `kind: human` gate. | The first artifact that wants to leave arrives around here. Staging is the only shape that lets it wait safely. | Work that can be approved rather than blocked |
| **16–18** | **Blocked / stuck / stalled** (B1, B2), dead-ends (N1), help with `tried:` (N3), the B4 dwell ladder. | The first overnight run produces blocks, and a block indistinguishable from a stall is an escalation nobody can act on. | Overnight becomes legible |
| **19–21** | **The balcony and the briefing.** `balcony.mjs`, `explain.mjs`, the 08:00 plist, `say`. | The founder cannot steer what they cannot see, and by now there is something to see. | 2–4 rows a day; the andon cord has a handle |
| **22–24** | **The world verifier** (`claim-world`), the shipped register (W3), the evidence ladder (W2), and the day-1 page's seven-day numbers recorded against it. | This is the deterministic-parse-into-a-data-file shape D9 permits at position 3 — and it is the only rung-2 reading that will exist. | *Did it work*, for the first time |
| **25–27** | **The second family in the harness.** `judge2.mjs` over `gemini`, empty stdout → `unresolved`. `ollama pull` a current model. | Needs founder consent for the quota, needs nothing else. Retires an accepted risk running to 2026-11-17. | Two model families, at last |
| **28–29** | **The first overnight run.** `reach: local`, one venture, three moves maximum, the founder reads the briefing at 08:00. | Everything above. | The thing that was asked for |
| **30** | **The first D15 ratio, the first retirement sweep, the first post-mortem.** | Nothing depends on them, which is exactly why they must be scheduled or they never happen. | The company measuring itself |

**What is deliberately absent from all thirty days:** inbound from the internet (D9), any money-spending
hand (D2), worker trust (D11), a second classifier (A5), and any new agent file.

---

## 16 · WHAT THIS DESIGN REFUSES

| # | Refused | What the refusal protects |
|---|---|---|
| 1 | **The Omnigent policy seam, ported.** Six phases, typed handlers, first-DENY-wins. | It is the best architecture in the reference set and it needs ownership of the agent loop, which we do not have. `PostToolUse` cannot block — its stdout is context. Building it here produces a control plane that reads as enforcement while only `PreToolUse` refuses anything. That is A6, committed at the scale of a subsystem. |
| 2 | **Any outbound capability in a worker's argv, at any autonomy level.** | It is the one control that survives prompt injection, model error and a bad prompt, because it is absence rather than denial. Every other outbound control on this board is advisory once the tool is on the roster (D10's own load-bearing half). |
| 3 | **Money hands, entirely, until a number exists** (D2). | A missed spend costs nothing; a wrong spend is a bill `git revert` cannot refund. The asymmetry is the whole argument, and the refusal costs zero to hold. |
| 4 | **Inbound from the internet in year one** (D9). | Inbound plus outbound with nothing between them is injection-to-irreversible-action in one hop. `WebFetch` returns exit 0 from the only blocking hook, so there is no point at which a fetched body is marked foreign. Free to honour now, expensive to retrofit after the path is open. |
| 5 | **One agent file per engine × pack.** | Roster growth by multiplication is exactly the pressure that produced 26 agents, and D12 names it. The argv makes it unnecessary. |
| 6 | **Worker trust, apprenticeship, promotion, demotion, retirement** (D11). | Fresh context per move plus a pack that is a grant and a stop leaves no persistent worker for trust to accrue to. The subject is dissolved, not deferred — and an answered gap should leave the list rather than sit at the bottom where a quiet month promotes it. |
| 7 | **A second implementation of risk classification, including a small "is this outbound?" helper** (A5, D3). | This repo has already paid once, when `qa-lead-pass.yml` computed a stricter second tier. Two implementations disagree, and you find out during the incident. |
| 8 | **Any summed or averaged score from judge outputs** (A1, D7). | Weak judges are excellent finders and useless scorers. `design.js`'s `total` field is the named live instance and it is deleted, not tuned. |
| 9 | **RAG over the 2,936 transcripts as memory** (A4). | They are full of superseded beliefs stated confidently, and retrieval cannot tell a corrected belief from a current one. Taken as instrumentation, refused as memory. |
| 10 | **Any change to `mission-control/server/`.** | `crosscheck.test.ts` bans a shell call there at zero exceptions and it closed three RCEs on 2026-08-14. The loop lives *beside* the server, not in it. Containment kept, autonomy gained. |
| 11 | **Editing `stream.test.ts` to make `check:mc` green.** | It is a regression test for a real shipped bug and its real socket is the test. The failure is the sandbox denying loopback with a synthesized `EADDRINUSE` at `errno: 0`, not a mission-control defect. |
| 12 | **`dangerouslyDisableSandbox` anywhere in the loop.** | The escape hatch exists, which is why the sandbox is a guardrail against accident and not containment. Using it in an unattended path converts the one honest thing about the sandbox into a false one. |
| 13 | **Telegram, a bot, a hosted dashboard, Temporal, Docker, a cloud runtime** (Decision 5, Decision 4). | Every one is a second system to operate at 3am, and none of them is the bottleneck. launchd is on the machine, has survived twenty years, and has no dependencies. |
| 14 | **A phase number, ever again.** | Nine phases produced one venture task. Omnigent shipped fifteen releases in ten weeks and the phrase "Phase N" appears nowhere in its changelog. Continuous cadence, small landings, each useful alone — which is a founder decision already taken. |

Each refusal lands as a dated entry in `.out-of-scope/`, with its reasoning, *before* the code that would
have implemented it — GSD's practice, and the same instinct as this repo's supersession blocks applied one
stage earlier.

---

## 17 · WHERE THIS DESIGN IS WEAKEST

### The strongest counter, stated fairly

**The whole thing rests on `claude -p` behaving, under launchd, the way it behaves in a terminal — and I
could not test one line of it.** Twelve facts are unmeasured; four are load-bearing enough to break the
design outright:

- **If `--strict-mcp-config` does not exclude user-scope servers (M2)**, then the 3am loop inherits the
  founder's fifteen connected servers — `tiktok_publish`, Gmail `send_message`, `sandbox_exec` — which is
  precisely what D13 measured happening to five Opus personas in a governance meeting. My entire safety
  argument is "absence, not denial", and absence would be false. The fallback is `--disallowedTools` plus
  `mcp-policy.json` scope widening, which is *denial* — weaker, and it is the inverted `#96.3` resolution
  CLAUDE.md warns about.
- **If hooks do not fire under `claude -p` (M1)**, the loop has no `pre-tool-use.sh` at all: no dangerous-
  command block, no MCP policy, no defence in depth behind the argv.
- **If the sandbox does not apply to a launchd child (M6)**, then the worker at 3am is *less* contained than
  the founder's own session, which inverts the intended risk gradient.
- **If `--output-format json` omits `session_id` or `total_cost_usd` (M4)**, the task↔session join fails and
  D1's payoff — per-lane cost, per-lane stall, last-use telemetry — is unavailable by a different route than
  CAST's, but just as unavailable.

**A second, sharper counter, and it is the Adversary's:** this design is thirteen mechanisms and one
artifact, and the artifact is on day 1 because I put it there, not because the design needs it. A reader who
believes built-and-never-wired is a *demand signal misread as an engineering defect* (could_not_resolve #1)
should read my thirty days as the tenth phase wearing better clothes. My honest answer is that days 1 and 2
are the falsifier: if day 1's page gets no signal in seven days and day 2's probe says M2 is false, the
correct action is to stop, not to proceed to day 3 — and I would rather write that sentence now than
discover I could not write it on day 20.

**A third, and it is structural to my angle:** runtime-first design goes stale on someone else's release
schedule. Every flag I have built on belongs to a binary that updates without asking. `claude mcp list` is
the daily hands oracle for the servers; there is no equivalent oracle for the *flags*, and a flag that
silently changes meaning turns a control into a comment. The mitigation is that `probe-headless.mjs` is a
check-suite step, not a one-time script, so a flag that changes behaviour fails a build instead of failing
at 3am — but that is a mitigation, not a cure, and the cure would be not depending on flags at all, which
would mean not having a loop.

### The one board decision I would overturn: D10, in one clause

**I accept D10 entirely except its supervision primitive.** D10 says the loop body runs *"as `claude -p`
with a narrow allowedTools list under a launchd supervisor (**KeepAlive** plus WatchPaths), with the direct
outbound tools struck from the roster, and the kill switch in the SUPERVISOR, not in the prompt."* Every
clause of that is right except `KeepAlive`, and the disagreement is not cosmetic.

**The evidence.** `KeepAlive` means *restart this process whenever it is not running*. It is correct for a
long-lived daemon and it is actively harmful for a body that is *supposed to exit* — which a one-move tick
is. Under `KeepAlive`, a tick that finishes its move in ninety seconds is relaunched immediately, and a tick
that crashes on line 1 is relaunched forever. That is the restart storm S4 names as the failure mode of the
outer daemon, and it is the exact hole the reference implementation has: **Auto-Co's `.gitignore` names a
circuit breaker that exists nowhere in its code.** D10 would import that hole, and then this design would
have to build the circuit breaker Auto-Co never did.

`StartInterval` plus `WatchPaths` with `KeepAlive` absent gets everything D10 wants and none of that:
launchd fires the tick every five minutes whatever happened last time, refuses to start a second copy of the
same job, restarts nothing, and needs no circuit breaker because there is no restart to break. The kill
switch still lives in the supervisor — `launchctl bootout` — which is D10's load-bearing sentence and I keep
it word for word.

**Why this is worth one of my fifteen.** D10's own confidence is `med`, and its stated reason is that the
workflow-reachability half is an inference nobody ran. The `KeepAlive` half has the same status and nobody
flagged it: it was chosen as the name of "launchd supervises this", not as a considered restart policy. The
cost of being wrong is a plist edit; the cost of shipping it is a laptop spending its five-hour window
relaunching a script that dies on a missing file.

**What would change my mind:** if the loop body turns out to need to be long-lived — because `Monitor` with a
`ws:` source is the right inbound primitive after all, or because process startup dominates a five-minute
cycle — then `KeepAlive` is correct and my one-shot shape is wrong. That is measurable on day 2 from the
`num_turns` and wall-clock figures the probe already collects, and I would take the correction.

---

*Written for `docs/03-system-design/designs/`, angle: runtime-first, 2026-09-02. Twelve `MEASURE:` items in
§11 are the design's own falsifiers and none of them was run from this dispatch.*
