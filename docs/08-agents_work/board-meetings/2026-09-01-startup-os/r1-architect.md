# Round 1 — Architect · the bill of materials

**Board meeting `startup-os`, 2026-09-01. Persona: Architect. Model: Opus.**
Lens: load-bearing vs leaf · dependency-forced build order · cost to reverse · what cannot be
retrofitted · where the seams are.

Every position below carries evidence pointing at a file and a section, or is labelled `INVENTED`.
Every proposed rule names its mechanism or is labelled `WISH`. **Everything marked `[M]` was measured
in this worktree on 2026-09-02 by a command shown inline** — I re-derived rather than quoting, because
four of the numbers I was handed had already moved.

---

## 0 · Thesis

**The system is not five layers. It is one substrate and four layers, and the substrate is smaller than
anyone has proposed building.**

The bill of materials has exactly **five load-bearing components**. Everything else in the fourteen
territories — packs, personas, the council, the board, missions, the balcony, FIELDS, voice, trust,
retirement — is a **leaf**: wrong-in-a-week, rebuilt-in-a-week, and reversible with `git revert`.

The five, and each is load-bearing for a *structural* reason rather than an important-sounding one:

| # | Component | Load-bearing because |
|---|---|---|
| **D0** | **Identity on every row** — a task id through `logEvent` | Cannot be retrofitted. Every cost, trust, retirement and post-mortem question is a `GROUP BY` on a column that does not exist |
| **D1** | **The capability grant, and the probe that proves it arrived** | It is the only thing separating *able* from *unable*. Measured today: it narrows reliably and **arrives unreliably, cause unknown** |
| **D2** | **The policy seam** — typed handlers, phases, first-DENY-wins | Five planned subsystems are one shape. Building them separately is five chances to disagree silently |
| **D3** | **The claim ledger** — assertion as the unit, forced expiry, three-valued resolvers | The only component in the repo whose unit is not a diff, and the rebuild is about non-diff work |
| **D4** | **The done-test as a resolver kind** | It is the only thing that can stop the loop. Without it, "walk relentlessly" has no terminal state |

**And the headline correction: Decision 1 says "Keep L1" as though L1 were one thing. It is two, with
different reach.** The claim ledger's unit is an assertion — it covers a price, a positioning line, a
video. The verdict binding's unit is `sha256(git diff)` — it covers code and nothing else. The rebuild
exists to do design, video, content, social and marketing. **One half of L1 follows the system into
that work and the other half structurally cannot.** Keeping them under one label is how the machine
ends up believing it has coverage it does not have.

---

## 1 · The dependency graph — what is forced, and by what

Read the arrows as *"cannot be correct before"*, not *"is nicer after"*. Everything here is a
dependency I can name a mechanism for; where the order is preference rather than force, I say so.

```
                    ┌──────────────────────────────────────────────────────────────┐
                    │  D0 · IDENTITY ON THE ROW                                    │
                    │  task_id / mission_id through scripts/lib/events.js          │
                    │  ── 5 callers today. One field, one function. ──             │
                    │  MEASURED: 0 of 3,813 real events carry any task id  [M]     │
                    │  ⛔ THE ONLY TRUE RETROFIT BLOCKER IN THE WHOLE DESIGN        │
                    └───────────────────────────┬──────────────────────────────────┘
                                                │ every question below is a GROUP BY on this column
        ┌───────────────────────────────────────┼───────────────────────────────────────┐
        │                                       │                                       │
┌───────▼──────────────────────┐  ┌─────────────▼───────────────┐  ┌───────────────────▼─────────────┐
│ D1 · THE GRANT               │  │ D2 · THE POLICY SEAM        │  │ D3 · THE CLAIM LEDGER (kept)    │
│  pack = tools + done + stop  │  │  typed handler per phase    │  │  assertion is the unit          │
│  ── AND ──                   │  │  first DENY short-circuits  │  │  forced expiry + disposition    │
│  H2 · THE ARRIVAL PROBE      │  │  8 of 10 hook events unused │  │  pass / fail / UNRESOLVED       │
│  ⚠ grant ARRIVAL is measured │  │  ⚠ PreToolUse cannot see    │  │  ⚠ Rule 10 is ONE-DIRECTIONAL   │
│    UNRELIABLE, cause unknown │  │    Task or WebFetch    [M]  │  │    today — 3 of 8 would_block   │
│    (24 tools → 0)       [M]  │  │                             │  │    are ENVIRONMENT, not defect  │
└───────┬──────────────────────┘  └─────────────┬───────────────┘  └───────────────────┬─────────────┘
        │                                       │                                      │
        │  a pack is a lie until the            │  a handler that cannot               │ tier + resolver
        │  probe says the tools arrive          │  see the call is a WISH              │ vocabulary
        │                                       │                                      │
        │                          ┌────────────▼──────────────────────────────────────▼──────┐
        │                          │ D4a · REACH — a SECOND AXIS ON THE ONE CLASSIFIER (R1)   │
        │                          │  ⚠ classifyFile(file, rules) — the input domain is a     │
        │                          │    PATH. "Publish to TikTok" has no path.           [M]  │
        │                          │  Widening path → action is a SIGNATURE change to the one │
        │                          │  file A5 forbids duplicating. Do it once, or be forced   │
        │                          │  into the second implementation.                         │
        │                          └────────────────────────┬─────────────────────────────────┘
        │                                                   │
┌───────▼───────────────────────────────────────────────────▼─────────────────────────────────┐
│ D4b · THE DONE-TEST AS A RESOLVER KIND                                                      │
│   the ONLY terminal state the loop has. Deterministic, external, or human — never the        │
│   producing model (A3). Reuses claim-command / claim-source / claim-judge unchanged.         │
│   Depends on D3 for the resolver contract and on D4a for "how hard must this one be".        │
└───────┬─────────────────────────────────────────────────────────────────────────────────────┘
        │
        │  ══════════ everything below this line is a LEAF ══════════
        │  wrong-in-a-week · rebuilt-in-a-week · reversible by git revert
        │
┌───────▼────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────────┐
│ L4 · THE LOOP      │──▶│ L5 · MISSIONS      │──▶│ L3 · THE BALCONY   │   │ L2 · PACKS &     │
│  ORIENT..done-test │   │  goal tree         │   │  rows → three verbs│   │      PERSONAS    │
│  brake = the stall │   │  priority function │   │  approve/redirect/ │   │  the council     │
│  counter           │   │  WIP limit         │   │  set taste         │   │  FIELDS/         │
│  ⚠ 6h BLIND SPOT,  │   └────────────────────┘   └────────────────────┘   │  trust, voice    │
│    fails toward    │                                                      └──────────────────┘
│    PASSING    [M]  │
└────────────────────┘
```

**Three edges in that graph are forced by a mechanism, not by taste, and they are the whole of the
build-order argument:**

1. **D0 before everything.** Not because it is important — because `logEvent` has five callers today
   and will have fifty later, and a column added to a schema after the fact has no history behind it.
   CAST could not answer *"what did this task cost?"* and had to heuristically join on a 60-second time
   window because there was no foreign key (`STARTUP-OS.md` §8b, CAST). That is not a mistake CAST made
   late; it is one they could not unmake.
2. **D1's probe before any pack.** A pack that names `higgsfield` and does not receive it produces a
   worker that believes it can make a video and cannot. The failure mode is a **silent absence**, not an
   error — the same shape as the `Workflow` no-op this repo already paid for.
3. **D4a before the loop touches the world.** The moment the loop can publish, the classifier is the
   thing standing between 3am autonomy and a live post. Widening its input domain after the loop exists
   means widening it under load.

**And one edge that is NOT forced, stated so it is not smuggled in:** missions before the loop. A loop
with one hardcoded goal is a complete, testable loop. The goal *tree* is a leaf. `MISSIONS.yml` can be a
single-entry file for a month without any of the above being wrong.

---

## 2 · The positions

### P1 · "Keep L1" is one decision covering two components with different reach — split it

`scripts/verdict.mjs:17` states its own subject:

```
subject = sha256( git diff <merge-base origin/main REF>..REF -- . ':(exclude,glob).qa/verdicts/*.json' )
```

That is a hash of a **diff**. A published video, a sent email, a live landing page, a price change on a
Stripe product — none has a diff, so none has a subject, so none can carry a verdict record. The verdict
binding is a code mechanism and is excellent at being one.

The claim ledger is the opposite by design, and `CLAIM-LEDGER.md` §1 says so in its first paragraph: *"A
pricing model, a market number, a positioning statement and a GTM sequence have no diff to gate, no
compiler to run and no test to fail."* Its unit is the assertion.

**The consequence for the bill of materials.** When the founder asks for a video, the ledger follows and
the verdict binding does not. If "Keep L1" is carried forward as a single item, the first non-code
mission will discover that the gate it thought it had does not apply — and it will discover it by
shipping. The honest version is: **keep the ledger as foundation; keep the verdict binding as the
code-shaped leaf of it, and give non-diff work its own binding or none, deliberately.**

Confidence: **high**. Evidence: `scripts/verdict.mjs:17`, `docs/03-system-design/CLAIM-LEDGER.md` §1.

---

### P2 · The capability grant is load-bearing AND currently unreliable in the arriving direction. The probe is a day-one component, not a leaf

This is the position I would defend hardest, because the entire L2 rebuild — Decisions 3, 6 and the
whole hands territory — sits on one primitive whose behaviour is measured as *uncertain*.

The ledger's own claim, read verbatim from `.claude/ledger/index.json` `[M]`:

> `c-mcp-grant-binds-through-agent-dispatch` — *"An agent file's `mcpServers:` grant NARROWS across an
> Agent dispatch — builder (declares nothing) held zero `mcp__*` tools in all observations. **Whether
> ARRIVES is uncertain**: on 2026-08-16 a designer probe held 24 `mcp__playwright__*` tools; on
> 2026-08-17 three independent designer dispatches held zero, with configuration intact (`.mcp.json` and
> `designer.md` both declare playwright). **Cause unknown.** The command verifies only configuration,
> not live behaviour."*

Its evidence carries `configuration_only: true` — the ledger is explicitly saying *I checked the config,
not the behaviour.* That is the ledger being honest, and it is honest about the exact property the
rebuild needs.

**A second, independent transformation makes it worse, and this one is fully measured.**
`scripts/probe-agent-tool-inheritance.mjs` records, in its own header, that **a declared tool list is an
upper bound rather than the set**: `Glob` and `Grep` are silently dropped whenever `Bash` is declared
beside them. Four of four agents: orchestrator 7 → 5, builder 6 → 4, reviewer 4 → 2, and `sourcer`
(which declares no `Bash`) 5 → 5 as the negative control.

`designer` declares `tools: [Read, Write, Edit, Bash, Glob, Grep]` `[M]` — so the one engine holding the
browser grant receives four of its six declared tools, and nothing anywhere reports that.

**What this means for the bill of materials.** *"Workers = thin capability packs"* is the right idea and
it is currently built on sand. **H2 — the reachability probe — is not a nice-to-have in territory 03. It
is the acceptance test for the entire L2 layer**, and until it runs green on a schedule, every pack in
the system is a hypothesis. The precedent is exact and in-repo: `probe-workflow-reach.mjs` turned a
believed gap into a deliberate containment by measuring it.

**Mechanism:** generalise `scripts/probe-agent-tool-inheritance.mjs` from four agents to every pack, run
it on a schedule, and write its matrix as events. It is already hermetic — it writes a fake CLI into a
temp dir, spends no model turn and needs no credentials, and passes 22 of 22 in 22.4s.

Confidence: **high**. Evidence: `.claude/ledger/index.json` `c-mcp-grant-binds-through-agent-dispatch`,
`scripts/probe-agent-tool-inheritance.mjs` header, `scripts/lib/check-suite.js` `EXCLUDED`.

---

### P3 · Identity on the row is the only true retrofit blocker, and it costs one field in one function

**Measured `[M]`, across the whole real event corpus at `~/.agentvibe/events.jsonl`:**

```
total events: 3,813
types: budget.block 474 · budget.allowed_safelisted 948 · claim.would_block 2,375
       claim.append_refused 4 · claim.append 6 · mcp.call 4 · war_room_kill 2
every key ever seen: artifact at body_sha256 by claim code decision detail details dry_run
       enforcement event file host id kind mode reason resolver rule safelist scope server
       stall_output status tier tool ts url window_output
```

**There is no `task_id`, no `mission_id`, no `run_id` and no `session_id` in that list.** The one `id`
present appears on 10 of 3,813 events and is a claim-append error code.

Every downstream question the fourteen territories ask is a `GROUP BY` on the column that is missing:
cost per mission (13), cost per *surviving* artifact (EC2), trust per pack × field (T1/T2), last-use
telemetry for retirement (X2), the balcony row that a founder taps (10), and the post-mortem (12).

**The cost of building it today is trivial and the cost of building it later is unbounded.**
`scripts/lib/events.js` exposes exactly one writer, `logEvent`, and it has **five callers `[M]`**:
`budget-guard.js`, `ledger.mjs`, `ledger.test.mjs`, `events.js`, `claim-append.js`. One field, one
function, five call sites — today. This is the single cheapest load-bearing decision on the table and it
is the only one that genuinely cannot be added afterwards, because a column added later has no history
under it.

**Mechanism:** a required `task_id` on `logEvent`'s object, refused when absent, plus a schema test.
The precedent for refusing rather than defaulting is `classifier.js:80` — *"Refuse rather than default. A
missing tier map used to mean skip auto-tier."*

Confidence: **high**. Evidence: measured `[M]`; `scripts/lib/events.js:55`; `STARTUP-OS.md` §8b steal #7.

---

### P4 · The stall ceiling — nominated as the loop's primary circling brake — has a measured six-hour blind spot, and it fails toward passing

`STARTUP-OS.md` §8b says this, and it is the strongest claim in the reference studies: *"`budget-guard.js`'s
stall ceiling already is that detector… Keep it, and make it the loop's primary circling brake."* Anti-
repetition is unsolved in the field and we are accidentally ahead of it.

**We are ahead of it for six hours.** Measured in this worktree `[M]`:

```
RETAIN_HOURS = 6                        (scripts/lib/usage.js:40)
now                    2026-09-02T07:48:01Z
retention horizon      2026-09-02T01:48:01Z
last durable artifact  2026-08-31T11:20:00Z   (commit)
=> the artifact predates the horizon by 38.5 hours
=> tokens produced in those 38.5 hours are UNCOUNTED by sinceLastArtifact
```

`sinceLastArtifact` sums `recentTurns`, and `recentTurns` discards everything older than
`RETAIN_HOURS = 6`. So when the last durable artifact is 44.5 hours old, the stall counter reports the
tokens of the most recent 6 hours and **nothing else**.

**The direction of the error is what makes this a defect rather than a limitation.** The longer the
circling goes on, the *smaller* the reported number becomes relative to the truth, so the ceiling fires
*less* the deeper the machine is stuck. A brake that weakens as the skid lengthens is worse than no
brake, because a rope you believe in changes what you attempt.

And it does not return `unresolved`. It returns an integer that looks like a measurement and is a
truncation. **That is Rule 10 violated inside the component nominated to enforce it** — a resolver
passing what it could not check.

The workload this exists for is a 24/7 unattended loop. Six hours is precisely the horizon such a loop
exceeds on its first night.

**Mechanism:** `sinceLastArtifact` must return `unresolved` (or a `truncated: true` flag the caller must
handle) when `artifact.t < now - RETAIN_HOURS`, and the guard must treat that as a stop rather than a
pass. The precedent is in the same repo and the same shape: `evidence.unchecked_exit` exists so a check
can say *I could not measure this* (`CLAIM-LEDGER.md` §2).

Confidence: **high**. Evidence: `scripts/lib/usage.js:40,103,244`; measured `[M]`; `STARTUP-OS.md` §8b.

---

### P5 · The stall counter mixes an account-wide numerator with a repo-local denominator — a seam that opens the moment two missions run at once

Same function, a second and separate defect. From the source `[M]`:

- `recentTurns` — its own comment reads *"Every turn inside the retention horizon, **across every
  project**"*, and it walks `~/.claude/projects`. Measured: **2,944 transcripts across 54 project
  directories.**
- `lastArtifactAt(opts)` — anchored at `opts.repoRoot || process.cwd()`. One repo: one `git log -1`, one
  `docs/08-agents_work/sessions/` scan, one events log.

So `sinceLastArtifact` divides *all of this account's output tokens* by *one repository's sense of
progress*. Demonstrated by running it against two different roots in the same second `[M]`:

| `repoRoot` | last artifact | `output_tokens` |
|---|---|---|
| this worktree | session-file, 2026-09-02T07:12Z | 61,410 |
| the main checkout | commit, 2026-08-31T11:20Z | 61,410 |

Two genuinely different denominators, one identical numerator.

**Why this is load-bearing rather than a curiosity.** Decision 2 is a resting state that works a goal
tree; territory 14 is *several ventures at once*. The first day two missions run concurrently, each
one's stall counter includes the other's tokens, so a productive lane is throttled by a stuck lane, and
a stuck lane is masked by a productive one. The rope stops measuring circling and starts measuring how
busy the machine is overall — which is the *window* ceiling, already built, sitting right beside it.

**And this is precisely why P3 comes first.** The fix is to filter turns by the mission that produced
them, which is impossible until a row carries a mission id. **D0 is not merely convenient for D6; the
loop's only working brake cannot be made correct without it.**

Confidence: **high**. Evidence: `scripts/lib/usage.js:103` (comment and implementation), `:186`,
`:244`; measured `[M]`.

---

### P6 · The classifier's input domain is a path. Worldly risk has no path. Widen the domain once, early, or be forced into the second implementation A5 forbids

`R1` proposes REACH as a second axis on the one classifier, and it is right that a second classifier is
forbidden — `scripts/classify.mjs`'s own header says *"Two implementations of risk classification will
disagree, and you find out during the incident"*, and this repo has already had that incident.

**But the proposal is architecturally harder than its one-line statement, and the difficulty is
measurable.** The classifier's entire public surface `[M]`:

```js
module.exports = { TIERS, RANK, DEFAULT_TIER, globToRegex, loadRules, classifyFile, classifyFiles };
//                                                          ^^^^^^^^^^^^  ^^^^^^^^^^^^^
//   classifyFile(file, rules)   — matches rules[].regex against a normalised PATH STRING
```

Every rule in `.claude/qa-tier-floor.yml` is a `pattern:` glob over a path. The function's whole input
domain is a filename.

**"Send this email", "publish this video", "spend $200 on Meta Ads" and "message this customer" have no
path.** They are tool calls. `hands.md` §8 puts the same finding in its last sentence: *"Money is the
missing axis. Every tier this repo has is about reversibility or blast radius; ad spend, GPU-seconds and
postage need a **rate** limit, and no mechanism here can express one."*

So R1 is not a new axis on an existing input. It is a **widening of the input domain from `path` to
`action`**, in the one file the repo has forbidden itself to duplicate, at `irreversible` tier.

**This forces an order.** If the loop gains outbound hands before the domain is widened, someone under
pressure writes a small separate check for "is this outbound", and that is the second implementation
arriving through the side door. **Widen `classifyFile` into `classifyAction` — with `classifyFile` kept
as the path-shaped special case — before any pack holds an outbound tool.**

Confidence: **high**. Evidence: `scripts/lib/classifier.js:132,179`; `.claude/qa-tier-floor.yml`
`rules[].pattern`; `hands.md` §8; `concepts.md` A5, R1.

---

### P7 · Rule 10 is written one-directional and must become symmetric before the ledger leaves shadow. Measured: 3 of 8 would_block are environment, not defect

The invariant as written in `CLAIM-LEDGER.md` §3: *"**The one invariant: no resolver returns `pass` when
it could not check.**"*

It is silent about `fail`, and that silence has teeth. `node scripts/ledger.mjs verify --offline` in this
worktree `[M]`:

```
ledger verify: 46 claims · 84 pass · 8 would_block (shadow) · 0 block
  ⚠ c-mission-control-rail             [claim-command] fail: exit 1, expected 0
  ⚠ c-mission-control-trusted-roots    [claim-command] fail: exit 1, expected 0
  ⚠ c-mission-control-cross-site-refused [claim-command] fail: exit 1, expected 0
```

**All three are environment, not defect** `[M]`: `mission-control/node_modules` is **absent** in this
worktree, and all three commands run `bun test` inside `mission-control`. CLAUDE.md warns about exactly
this (*"Before you trust any local measurement: `cd mission-control && bun install`"*). And **none of the
three declares `evidence.unchecked_exit`** — the field `CLAIM-LEDGER.md` §2 documents for precisely this
case, *"an integer exit code that means 'I could not measure this' rather than 'the claim is broken'."*

So the ledger reports a *broken claim* where the truth is *an unmeasured one*. In shadow mode that costs
nothing. **On the day the ledger is promoted to blocking, a fresh checkout fails the build for a missing
`bun install`** — and the lesson every contributor draws is that the ledger cries wolf, which is how a
gate becomes a decoration.

**Note also that the count has moved and nobody edited the prose.** CLAUDE.md states *"5 would_block…
and 5 is the number… It stays 5."* It is **8** `[M]`. Three of the five originals remain (the canary
twice, three empty judge panels), and three mission-control commands joined them.

**Mechanism:** add `evidence.unchecked_exit` to the three commands, and make the symmetry explicit in
the invariant — *a resolver returns neither `pass` nor `fail` when it could not check.* The resolver test
harness already pins `unresolved` as distinct from `pass` for every resolver
(`scripts/ledger.test.mjs`); this extends the same pin to the other side.

Confidence: **high**. Evidence: measured `[M]`; `CLAIM-LEDGER.md` §2, §3; `CLAUDE.md` Project State.

---

### P8 · The birth certificate already exists FOUR times, for four artifact types, with four different exemption conventions and no shared predicate. Build the predicate, not a fifth instance

`X1` is the strongest proposal in `concepts.md` and I want it built. But its own "Enforced by" line is
wrong in a way that changes the design: it says *"`scripts/check-registration.mjs` already implements the
hard half — the dead-path check."*

**It does not. The dead-path check runs in the opposite direction** `[M]`. At
`scripts/check-registration.mjs:120` the rule is *reference → existence*: a governing document mentions a
path, so that path must exist. X1 needs *existence → reference*: an artifact exists, so a caller must
name it. Those are different checks and the first does not provide half of the second.

**The reverse direction does exist — four times, independently, each hardcoded to one artifact type**
`[M]`:

| Artifact type | Where the check lives | Exemption convention |
|---|---|---|
| **Skills** | `scripts/build-skill-routers.mjs:76` — *"in NO namespace, so unreachable via routers"* | **none at all** — an orphan simply fails |
| **Test files** | `scripts/check-suite.test.mjs` (line 3169 at the session branch's version of the file) — *"every `scripts/*.test.mjs` is named by a package.json script, or carries its reason"* | `TEST_FILES_RUN_BY_NOTHING` — a JS object, free prose, no length floor |
| **Gates** | `scripts/check-gates.mjs:226` — no playbook names it | `unused_reason:` in YAML, **≥40 characters**, and it fails if you carry a reason *while being used* |
| **Suite steps** | `scripts/lib/check-suite.js:143` | `EXCLUDED` — a JS object with long prose reasons |

Four implementations of one predicate — *this artifact must have a caller, or a written reason someone
can argue with* — with four different exemption shapes and no shared code. That is the A5 failure class
already realised, four-fold, in the very machinery meant to prevent it.

**And the gap is exactly where the pain is.** **Workflows are governed by none of the four.** Which is
why the next position is possible at all.

**Mechanism:** one `hasCaller(artifact, callerSet, exemptions)` predicate in `scripts/lib/`, one
exemption schema with the `unused_reason` shape (a length floor and a fails-when-used rule, which is the
strongest of the four), and the four call sites migrated to it. Then adding `workflows`, `packs`,
`personas` and `commands` is a config entry rather than a fifth implementation.

Confidence: **high**. Evidence: measured `[M]`; `check-registration.mjs:120`; `build-skill-routers.mjs:76`;
`scripts/check-suite.test.mjs` (line 3160 at the session branch's version of the file); `check-gates.mjs:226`; `check-suite.js:143`; `concepts.md` X1, A5.

---

### P9 · "Wire what exists" has a runtime constraint under it that the agenda does not name — and it is the same constraint that makes the gate safe

`STARTUP-OS.md` §8 job 1 is *"Wire, then delete… Invoke `design.js` and `research.js`."* The census is
right that this is connection work rather than invention. **It is not, however, a one-line change, and
the reason is structural.**

First, the measurement `[M]`. Every reference to `design.js` and `research.js` in the tree is prose, a
tier rule, or a path string in a test fixture:

```
design.js    → docs/*.md, session files, concepts.md, scripts/classifier.test.mjs:75  (a PATH STRING
                in a tier-classification fixture — not a call)
research.js  → docs/*.md, .claude/gsa-file-manifest.json, produce-verdict.test.mjs:562 (a fixture
                asserting the path must NOT reach the gate session)
coding.js    → .claude/workflows/qa.js — a COMMENT about a caller; qa.js itself records
                "It is invoked by no SLASH COMMAND — zero hits for `coding` across .claude/commands/"
```

**Zero executable callers for all three.** Contrast `qa.js`, which has ~60 references including
`scripts/run-checks.mjs`, `scripts/lib/load-qa.mjs` and `.github/workflows/ci.yml`.

**Now the constraint.** A workflow runs under the `Workflow` tool, and `Workflow` is a **main-session
tool**. Measured two independent ways:

- `probe-workflow-reach.mjs`: 0 of 55 recorded `Workflow` calls came from a sidechain, against 57,590
  subagent `Bash` calls in the same scan.
- `probe-agent-tool-inheritance.mjs`, run by hand 2026-08-28 against claude 2.1.246: verdict
  **CONTAINED, exit 0** — a `--agent orchestrator` session is offered 5 tools and `Workflow` is not one
  of them.
- `grep -c '^tools:.*Workflow' .claude/agents/*.md` → **0 on all eighteen files**.

`.claude/gates.yml` states the consequence plainly: *"A DISPATCHED ENGINE DOES NOT HAVE THE TOOL, and a
missing tool reads as a silent no-op rather than an error — so a stage that made its dispatched engine
run the gate would report success having gated nothing."*

**So "invoke `design.js`" has exactly three candidate callers, and two of them cannot.** A dispatched
engine cannot (CONTAINED). A loop living beside the mission-control server cannot — `crosscheck.test.ts`
bans a shell call under `server/**` at zero exceptions, deliberately, having closed three RCEs. **Only a
main session can**, which means either the creativity machinery is reachable only when the founder is
typing — the precise complaint that opened this rethink — or the loop is itself a main session, which is
`STARTUP-OS.md` §8 question 2 and is undecided.

**This is a real seam and it is currently invisible.** The containment (`PS-WORKFLOW-CONTAINMENT`) is
correct and should be kept — *the gate may not be invocable by the thing it gates*. But the same
containment silently blocks the *producing* workflows, and nothing in the repo distinguishes
"contained on purpose" from "unreachable by accident" for `design.js`.

**Mechanism:** the containment lint currently governs `Workflow` as one class. Split the declaration —
`gate` workflows stay contained, `producer` workflows get a declared invoker — and make the invoker a
`hasCaller` entry (P8). Until then, `design.js` is not wire-able and saying so is more useful than a
task that will silently fail.

Confidence: **high**. Evidence: measured `[M]`; `.claude/gates.yml`; `scripts/probe-workflow-reach.mjs`;
`scripts/lib/check-suite.js` `EXCLUDED['test:probe-agent-tool-inheritance']`;
`mission-control/test/crosscheck.test.ts:290`.

---

### P10 · The policy seam is the right consolidation, and its reach must be measured before it is designed — because PreToolUse cannot currently see a dispatch or a fetch

Omnigent's policy-as-code is the best structural idea in the reference studies and I endorse it without
reservation: an event occurs, typed handlers vote, the strictest verdict wins, nothing takes effect until
the verdict is final. Five planned subsystems become one seam. Take it.

**But the founder decision fixes the substrate — *"built on the eight hook events currently unused;
`pre-tool-use.sh` untouched"* — and the substrate has a measured reach limit that changes what the seam
can enforce.** The live matcher `[M]`:

```json
"PreToolUse": [{ "matcher": "Bash|Edit|Write|NotebookEdit|mcp__", ... }]
```

Five tool classes. **`Task` is not among them. Neither is `WebFetch`, `WebSearch`, nor `Read`.**

Two consequences land directly on proposals already on the table:

- **H3 (taint tracking) has no `tool_call` hook to hang on for its own trigger.** The taint *source* is
  `WebFetch` / `WebSearch` — the moment foreign instructions enter context — and neither reaches the
  hook. H3's own entry is honest that the un-mediated path is a `WISH`; this measurement names which
  path.
- **A dispatch is invisible to the seam.** `Task` is not matched, so a policy handler cannot see a worker
  being launched — which is the natural place to check a budget, a WIP limit, a trust level or a kill
  switch *before* spend begins. `budget-guard.js` already knows this problem from the other side: its
  header records *"The Phase 6 gate said the ceiling must fire 'before dispatch'."*

**Two honest repairs, and the choice is a founder's.** Widen the matcher (a `.claude/settings.json`
edit — `irreversible` tier, denied to the write tools, which is why it needs the founder), or accept that
the seam governs tool *use* and not tool *dispatch* and put the dispatch checks in the dispatcher.

**Either way, measure the reach before designing the handlers.** The precedent for what happens
otherwise is exact: 52 agent files once declared `mcpServers` while no MCP config existed anywhere, and
`schema-lint.js:104-113` now carries the lesson — *"a field that looks like a boundary and enforces
nothing"*.

Confidence: **high**. Evidence: measured `[M]` `.claude/settings.json`; `concepts.md` H3;
`.claude/hooks/budget-guard.js:13`; `.claude/hooks/schema-lint.js:104-113`.

---

### P11 · A pack cannot be a new frontmatter key, and the runtime offers no way to grant tools at dispatch time. Decision 3's mechanism is undecided and it blocks first

Decision 3 — *"Workers = thin capability packs"* — is right, and it has no implementation path today.
Two measured walls:

1. **The agent-file frontmatter schema is a closed allowlist of 15 keys** `[M]`, at
   `.claude/hooks/schema-lint.js:356`: `name, description, model, effort, tools, maxTurns, color,
   isolation, skills, mcpServers, risk_tier_default, escalates_to, escalates_when, return_contract,
   pre_flight_reads`. The comment above it states the reason — *"an unknown key is decoration by
   definition: nothing reads it, and it will be mistaken for a grant. That is the `mcpServers` failure
   exactly, which 52 files carried."* So a `pack:` key fails the lint, and adding one edits
   `schema-lint.js`, which is `irreversible` tier.
2. **The dispatch tool takes no grant parameter.** The `Agent` tool's parameters are `description`,
   `prompt`, `subagent_type`, `model`, `isolation`, `name` and `team_name`. There is no `tools` and no
   `mcpServers`. **A grant can therefore only come from an agent file on disk.**

So "engine + pack" has exactly two possible shapes, and neither is chosen:

- **(a) One generated agent file per (engine × pack).** Works today, requires no runtime change — and it
  is roster growth by multiplication, which is what took this repo to 26 agents and forced the collapse
  to 7. `X4`'s ratchet exists for this exact pressure.
- **(b) A pack as a separate file, composed at dispatch.** This is the better design and **the runtime
  does not support it.** It would need either a wrapper that materialises an agent file per dispatch, or
  a capability the harness does not expose.

**This is the first thing that blocks and the board should decide it explicitly.** Every other L2
question — how many packs, which four families, what a `done:` looks like — is downstream of whether a
pack is a file the runtime already understands or a thing we must synthesise.

Confidence: **high**. Evidence: measured `[M]` `.claude/hooks/schema-lint.js:353-360`; the `Agent` tool
parameter schema; `concepts.md` X4; `CLAUDE.md` "the roster axis was wrong".

---

### P12 · Cost to reverse — the ranking that should drive sequencing

Cheap to reverse means *`git revert` restores the previous state and no external fact has changed.*

| Component | Cost to reverse | Why |
|---|---|---|
| **Identity on the row** (D0) | **Unbounded** | The history has no column. Every event written without it is permanently unattributable |
| **The event schema** | **High** | Consumers accumulate; a shape change breaks every reader at once |
| **The grant model** (D1) | **High** | Packs, personas and the balcony all encode assumptions about what a worker holds |
| **Widening the classifier** (D4a) | **Medium** | A signature change with many callers, but every caller is in-repo and typed |
| **The policy seam** (D2) | **Medium** | `settings.json` edits are `irreversible` tier; the *handlers* are cheap |
| **Anything outbound** — publish, send, pay | **NONE. Not reversible at all** | `git revert` does not unsend an email or unpublish a video. This is ADR-001's own test |
| Packs, personas, the council, board, missions file, balcony views, FIELDS | **Cheap — days** | Data files and prompts. Wrong-in-a-week is fine |

**The operational rule this yields, and it is the one I would write into the design:** the *reversible*
half should be built fast, loose and continuously — matching the founder's stated cadence of small
landings with no phase numbers, and matching Omnigent's fifteen releases in ten weeks with the phrase
"Phase N" appearing nowhere. **The five load-bearing components should be built slowly, once, with a
mechanism named for each.** Treating both halves at the same speed is what produced nine phases and one
venture task.

Confidence: **high**. Evidence: `docs/03-system-design/adr/001-claim-ledger-as-enforcement-spine.md`
(the `git revert` test); `STARTUP-OS.md` §8b (Omnigent changelog observation); `CLAUDE.md` Project State.

---

### P13 · The ledger caught a false belief about its own substrate, dispositioned it, and named its successor — while the prose that quotes it is still stale. This is the argument for D3 as foundation

I went looking for a contradiction and found the mechanism working, which is worth reporting as
carefully as a defect would be.

Two ledger claims assert opposite things about the same mechanism `[M]`:

- `c-mcp-hook-matcher-must-name-the-tool` — *"reaches `pre-tool-use.sh` **only if** the matcher names
  that exact tool. The matcher names exactly one — `mcp__playwright__browser_navigate` — … every other
  MCP tool on this machine is unhooked."*
- `c-mcp-matcher-names-the-prefix-and-policy-decides` — *"**Every** `mcp__*` tool call reaches
  `pre-tool-use.sh`, because the matcher names the `mcp__` **PREFIX**."*

**The ledger has already resolved it.** `verify` reports the first as `deprecated — no longer claimed`,
with a disposition that reads, in part: *"THE CHANGE-DETECTOR FIRED, AND IT WAS RIGHT. PR #73 moved both
pinned strings… The assert above is retained UNEDITED because it is now false in both halves, and a
stale assert preserved beside its correction is this ledger's own argument for expiry… Succeeded by
`c-mcp-matcher-names-the-prefix-and-policy-decides`."* The live matcher is
`Bash|Edit|Write|NotebookEdit|mcp__` `[M]`, which is the successor's version.

**And CLAUDE.md still teaches the deprecated one** — its "Durable facts are claims now" bullet lists
*"an MCP call reaches `pre-tool-use.sh` only if the matcher names that exact tool
(`c-mcp-hook-matcher-must-name-the-tool`)"* as a live registered fact.

That is the whole architecture argument in one instance. **The data caught its own error, recorded the
correction, and pointed at the replacement. The prose beside it did not, and cannot.** Any durable fact
in the new system — a pack's grant, a field's best practice, a done-test's threshold, a trust level —
belongs in the ledger with an expiry, and any fact that lives only in a markdown paragraph will be wrong
within a month and will still be read.

Confidence: **high**. Evidence: measured `[M]` `node scripts/ledger.mjs verify --offline`;
`.claude/ledger/index.json`; `CLAUDE.md` Project State.

---

### P14 · `budget-guard.js` is registered in no settings file, and its 1,422 events came from being run by hand

A small correction that matters for the "wire what exists" list, measured `[M]`:

```
grep -c 'budget-guard' .claude/settings.json          → 0
grep -c 'budget-guard' ~/.claude/settings.json        → 0
.claude/settings.local.json / ~/.claude/settings.local.json → no match
events on disk: budget.block 474 · budget.allowed_safelisted 948   (2026-08-26 → 2026-09-01)
```

1,422 real budget events with zero registrations. The guard is **executing when a person runs it** and
**never firing as a hook**, which is exactly the census's finding and is worth restating because the
event volume could easily be mistaken for the thing being live.

**The architectural consequence:** the rope (Decision 8) protects nothing today, and registering it is a
`.claude/settings.json` edit — `irreversible` tier, denied to the write tools, so it needs the founder.
It is on the list of three founder-only permissions that the shared context records as **not yet
authorised**. **The loop cannot safely run before that permission is granted**, because the rope is the
only thing standing between an unattended loop and the founder's own 5-hour quota. This is a dependency
from a leaf (the loop) onto a decision only a person can make, and it should be surfaced as such rather
than discovered at 3am.

Confidence: **high**. Evidence: measured `[M]`; `r0-shared.md` founder decisions;
`.claude/qa-tier-floor.yml` (settings.json is `irreversible`).

---

## 3 · What must be true for this thesis to hold

1. **The grant arrives, or it can be made to.** If `mcpServers` cannot be made to arrive reliably across
   a dispatch, then "workers = capability packs" is not implementable on this runtime and L2 needs a
   different shape — probably one main session per mission rather than dispatched workers.
2. **The runtime lets a pack exist as something other than a hand-written agent file**, or the roster
   grows by multiplication and X4's ratchet becomes load-bearing much earlier than anyone plans.
3. **The founder grants the three permissions.** The rope cannot be registered, the second model family
   cannot be tested, and the hook bypass cannot be closed without them. All three are `irreversible`
   tier by this repo's own classifier.
4. **A `task_id` is available at the point `logEvent` is called.** If the loop cannot thread an id
   through a dispatch boundary, D0 is harder than one field and should be re-scoped before it is
   promised.
5. **Non-diff work can carry a binding of some kind** — or the board accepts, explicitly, that video,
   content and outbound work run with the ledger only and no verdict record.

---

## 4 · What I refuse

| What | Why |
|---|---|
| **A second risk classifier, in any form** — including a small "is this outbound?" helper | `classify.mjs`'s own header: *"Two implementations of risk classification will disagree, and you find out during the incident."* It has already happened once here. Widen `classifyFile`; never parallel it |
| **A fifth independent birth-certificate check** | Four already exist with four exemption conventions (P8). A fifth makes the disease it treats |
| **Any `done:` resolved by the producing model** | A3, and the local measurement: a design PASS/BLOCK judge at 0.543 against a panel only 0.741 self-consistent |
| **A `total:` field summed from judge outputs, anywhere** | A1. `design.js` already does this and it is the one creativity mechanism in the repo |
| **Deleting `PS-WORKFLOW-CONTAINMENT` to "unblock" the workflows** | The zero is the guarantee. Split the declaration by workflow kind instead (P9) |
| **A pack that names a tool no probe has confirmed arrives** | P2. Record it `unprobed`, per H2's own failure clause, rather than assuming |
| **Building missions before the loop** | Not forced by any dependency. A one-goal loop is a complete loop, and the tree is a leaf |
| **A rule in the new design with no named mechanism** | A6, and the standing rule. Label it `WISH` and let it be argued with |

---

## 5 · Build order, and what forces each step

**Forced by dependency:**

1. **`task_id` through `logEvent`** — five call sites today, unbounded cost later, and the loop's only
   working brake (P5) cannot be made correct without it. *Forced by retrofit impossibility.*
2. **Rule 10 made symmetric + the three `unchecked_exit` declarations** — one hour of work, and it is a
   precondition for ever promoting the ledger out of shadow. *Forced by P7: a gate that cries wolf on a
   missing `bun install` never gets promoted.*
3. **The grant-arrival probe (H2), generalised and scheduled** — everything in L2 is a hypothesis until
   it runs green. *Forced by P2: the primitive is measured unreliable, cause unknown.*
4. **Fix the stall counter's 6-hour truncation** — before the loop, not after. *Forced by P4: it fails
   toward passing, and the loop is the workload that exceeds six hours on night one.*
5. **`hasCaller` as one predicate, four call sites migrated** — then workflows, packs and personas
   become config entries. *Forced by P8: the alternative is a fifth implementation.*
6. **Widen `classifyFile` → `classifyAction`** — before any pack holds an outbound tool. *Forced by P6:
   afterwards, someone writes the second classifier under pressure.*

**Then, and only then, in whatever order the founder prefers — these are leaves:**
the loop with one hardcoded goal · the balcony's three verbs · packs · personas · the council ·
`FIELDS/` · missions as a tree.

**Founder-gated, and blocking item 4 and the loop:** register `budget-guard.js`, close the
`( npx --version )` bypass, test `gemini`.

---

## 6 · The seams — where two subsystems meet and could disagree silently

This is the section my framing exists for. Each row is a place where two things must agree, nothing
checks that they do, and the failure is silent rather than loud.

| # | Seam | How it fails silently | Detector |
|---|---|---|---|
| **S1** | **Declared grant ↔ arrived grant** | `Glob`/`Grep` dropped beside `Bash`; 24 MCP tools one day, 0 the next, cause unknown. A worker believes it can see a page and cannot | H2 probe, generalised and scheduled. **Does not exist as a step** |
| **S2** | **Account-wide token numerator ↔ repo-local artifact denominator** | Two concurrent missions each read the other's tokens as their own stall. The rope throttles the wrong lane | None. Fixed by `task_id` + a filter |
| **S3** | **Stall counter ↔ its own 6-hour retention horizon** | A 44-hour stall reports 6 hours of tokens. Reads as *progress* | None. `sinceLastArtifact` must return `unresolved` past the horizon |
| **S4** | **Path-shaped classifier ↔ pathless worldly actions** | An outbound action classifies as nothing, or is checked by a second implementation nobody reconciles | The A5 rule is prose. **No mechanism** — the second implementation would pass every check |
| **S5** | **`gate:` declarations ↔ what a dispatched engine can invoke** | A stage names a gate; a dispatched engine's `Workflow` call is a **no-op, not an error**; the stage reports success having gated nothing | `PS-WORKFLOW-CONTAINMENT` + `probe-workflow-reach.mjs`. **This one is closed** — and it is the model for the rest |
| **S6** | **Policy seam ↔ hook matcher reach** | A handler is written for `tool_call`; `Task` and `WebFetch` never reach `PreToolUse`; the handler is correct and never fires | None today. Measure reach per event before writing handlers |
| **S7** | **`claim-command` ↔ its execution environment** | A missing `bun install` renders as *the claim is false*. On promotion, a fresh checkout is a red build | `evidence.unchecked_exit` exists and these three do not use it |
| **S8** | **Prose facts ↔ ledger facts** | CLAUDE.md teaches a claim the ledger deprecated 17 days ago. Both are read; only one is checked | `check-registration.mjs` catches dead *paths*, not stale *assertions*. Partial |
| **S9** | **Four birth-certificate checks ↔ each other** | Four exemption conventions drift; an artifact type governed by none (workflows) is invisible to all four | None. They share no code |
| **S10** | **`mcp-policy.json` `mode: shadow` ↔ the belief that MCP calls are governed** | The file reads as a gate and logs. Only `credentialed: true` blocks, and neither configured server sets it | The file says so about itself, in prose, in the right place. **Honest, but prose** |

**S5 is the one to copy.** It is the only seam in the list that is closed, and it was closed by
*measuring the runtime* — 0 of 55 `Workflow` calls from a sidechain against 57,590 subagent `Bash`
calls — then encoding the measurement as a lint plus a probe. Every other row in this table is the same
shape at an earlier stage: a belief about how two parts meet, with no instrument between them.

---

## 7 · Open questions I cannot resolve from here

1. **Can a pack be composed at dispatch time, or must it be a file?** (P11.) Blocks the shape of L2.
   Answerable by one experiment against the runtime.
2. **Why did the designer's MCP grant arrive on 2026-08-16 and not on 2026-08-17?** Cause unknown, and
   it is the single most load-bearing unknown in the bill of materials.
3. **Where does the loop live?** `STARTUP-OS.md` §8 q2. It determines whether producing workflows are
   reachable at all (P9) and whether `task_id` can cross the dispatch boundary (P3).
4. **Does non-diff work get a binding?** If yes, what is the subject function for a published video?
   If no, say so in the design rather than discovering it.
5. **Is `RETAIN_HOURS = 6` a performance budget or an arbitrary constant?** The fix in P4 differs
   depending — raise it, or make the truncation `unresolved`, or both.

---

## 8 · The strongest argument against my own thesis

**That I have described a better truth machine, and the founder said the truth machine was the mistake.**

Four of my six forced build-order items are repairs to existing L1 machinery — symmetric Rule 10, the
stall counter, `hasCaller`, the classifier's domain. A founder who has watched nine phases produce 171
session files about the harness itself, and one venture task, can read my build order as *phase ten*,
and would not be obviously wrong. The census says six of ten asked-for things already exist and are
unwired; my answer to that is largely a set of instruments to detect unwiring better, and an instrument
is not a landing page.

**The honest counter-argument runs: build the synthetic mission first (Decision 7), let it fail, and let
what actually breaks select the components.** That is a real methodology, it is what Omnigent's fifteen
releases in ten weeks look like from outside, and it would have found the grant-arrival problem in an
afternoon instead of a board meeting.

**What I would say back, and where I think the line falls.** Of my five load-bearing components, exactly
one is genuinely un-discoverable-by-doing: **`task_id`**, because the mission that teaches you that you
need it has already run without it. The other four are all discoverable by attempting the synthetic
mission, and would be discovered faster that way. **So the defensible minimum is much smaller than my
build order: add the id, then run the mission, then let the failures pick the rest.**

I would still argue for the grant probe before the mission rather than after, on the grounds that a
silent capability absence produces a *confusing* failure rather than an instructive one — the beeond
lesson exactly, where eleven mockups were made and none could be looked at, and the diagnosis took a
design round. But that is an argument about the cost of one afternoon, not about architecture, and the
board should weigh it as such.
