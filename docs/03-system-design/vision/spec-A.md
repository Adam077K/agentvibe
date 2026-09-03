# The full system spec — Group A · territories 01–07

```
written: 2026-09-02 · framer, group A · brief: vision/01-SPEC-BRIEF.md
territories: 01 Missions & drive · 02 Workers & roster · 03 Hands · 04 Knowledge
             05 Memory · 06 Communication · 07 Context & cost
inputs: vision/2026-09-02-THE-PICTURE.md (primary) · STARTUP-OS.md Part II §0–§17, Part IV
        vision/2026-09-02-{flywheel,founder,machine}.md §2 rows 01–07, plus machine §5.1–5.8
status: a specification of the full-scale system with the year-one slice inside it.
        It authorises nothing. The founder's decisions of 2026-09-02 bind; Part II binds
        for year one and is condensed here, never contradicted.
```

## How to read this

**Numbers.** Every figure the three visions supplied is an **illustration** and is labelled inline. It is
what one envisioner pictured, never a measurement and never a target. Figures actually measured in this
repository carry `MEASURED` and a date. A figure with neither label does not appear.

**Rules.** Every rule in an *Enforced by* block names the thing that would fail if the rule were broken —
an argv absence, a schema refusal, a named test, a resolver, a hook, or a human gate. A rule with no such
thing is marked **`WISH`** and says what would give it one. `WISH` is not a defect; an unlabelled wish is.

**Physics.** Four facts bound every design below and none of them is policy:

| fact | standing |
|---|---|
| A `claude -p` process cannot call a tool absent from its argv | `MEASURED` 2026-09-02 for built-ins: `--disallowedTools Bash` → the child reports `BASH_UNAVAILABLE`, exit 0, `is_error: false` |
| `--strict-mcp-config` makes user-scope servers **absent**, not denied | `MEASURED` 2026-09-02 |
| `PostToolUse` cannot block; the only blocking hook is `PreToolUse` exit 2 | standing repo fact; `pre-tool-use.sh` |
| A `Workflow` is main-session only; a dispatched engine calling one gets a silent no-op | `MEASURED`: 0 of 55 recorded `Workflow` calls came from a sidechain, against 57,590 subagent `Bash` calls in the same scan |

`PreToolUse` firing under `claude -p` is `MEASURED` true for `Write` (2026-09-02, the refusal string is in
`pre-tool-use.sh` and nowhere in Claude Code). The **Bash** path is unmeasured from inside a session and is
M1 in the frame's measure-before-build list. Nothing below rests on the unmeasured half.

**Boundaries.** Group C writes the cross-cutting maps: the process list, the store map, the pack roster and
pack schema in full, the hand admission test as a table, the warrant lifecycle, the founder's day, and THE
BUILD PATH. Where a section below would restate one of those, it names the map instead and gives only what
its own territory needs. Two descriptions of one thing disagree silently — this repository has paid for
that lesson twice, in risk classification and in CI step parsing.

---

## 01 · Missions & drive

**At full scale — what it IS.**
A forest, not a tree. `ventures/<slug>/MISSIONS.yml`, one file per venture, each an uncapped goal tree, with
exactly one mission `in_flight` per lane and one lane per venture that has been allocated window tonight. A
mission is `intent:` {task, purpose, end_state, constraints} · `falsifier:` {move, cost_usd} · `done:`
{rung, resolver, test, approved_by, approved_on} · `deadline:` · `evidence_of_demand:` (a claim id, never a
literal) · `reversibility:` · `cost_estimate:` · `unlocks:` · `blocks:` · `goals:` nested, each leaf with its
own `end_state` and `done`. The schema refuses `steps:`, `how:`, `method:` and `implementation:` anywhere
under `intent:` — a mission states an end, never a route. Task id `M-0007.3.1#2` = mission · path · attempt,
regex `^M-\d{4}(\.\d+)*#\d+(v\d+)?$`, `v` marking a variant inside a round, minted by `tick.mjs` before
spawn. `scripts/loop/next.mjs --lane <slug>` is pure, prints its own arithmetic, and takes no field a model
benefits from filling; at one open leaf it degenerates to leftmost-open-leaf, and at many it ranks on cost of
delay against a calendar the company does not control. `scripts/loop/allocate.mjs` sits above it and reads
`PORTFOLIO.yml`: a declared share of the window per venture with a **floor** so a quiet venture is not
starved and a **ceiling** so a loud one cannot take everything, reviewed monthly rather than continuously,
because continuous reallocation is how the loudest venture wins. Venture zero — the harness itself — holds a
declared share with the same floor and ceiling as any other, because the alternative is what happened in
2026, when 171 session files were about the harness and none about a customer. States are
`queued · in_flight · blocked · stalled · stuck · railed · shipped · abandoned`, and a transition not in the
table is refused. **Missions can be woken by the world**: an inbound reply, a failed payment, a funnel spike
or a competitor's changelog becomes a leaf with a deadline, written by the relay (§06) and never by a model.
Every dispatch records `instead_of:` — the runner-up leaf id — which is free where priority is computed and
makes what the company systematically never gets to visible after six months instead of invisible forever.

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
allowed, counted, reported. `blocked` authored with `because`, `clearable_by: founder`, `until`, plus
`default_if_unanswered:` and the fourth disposition `fused`, so the founder's silence is a recorded decision
rather than an unread item (*founder's choice 2*). Three waivers on one block surface on the balcony as
"decision avoided". Attempt ≥ 3 on one leaf with no pass is `stuck`, free. `constraint:` is one pointer with
an expiry and does not gate dispatch. The cycle is eleven steps: STOP file → `STEER.md` → brakes → next leaf
→ mint id → compile pack → spawn one `claude -p` → oracle → record rows → rewrite `BOARD.md` → exit. Priority
over declared fields is refused (refusal 5) because WIP 1 leaves nothing to rank and every declared field is
gameable by the thing that fills it. `railed`, `deadline:`, `PORTFOLIO.yml`, `allocate.mjs` and world-woken
leaves do not exist.

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
1. **Tree order is a good enough proxy for value at WIP 1.** Measurable in the first 30 days: count how often
   the founder's `steer.mjs` redirect names a leaf other than the leftmost. Two or more in the first ten
   dispatches falsifies it and reopens refusal 5 early.
2. **A model fills fields honestly when a function chooses.** Partially measurable: the first
   `evidence_of_demand` that resolves `unresolved` rather than `pass` is the signal, and it arrives with
   mission 2.
3. **The world can wake a mission without becoming the priority function.** Not measurable in 30 days;
   nothing inbound exists. Its guard is that the relay writes a leaf and never a rank.

**grafted_from.** picture §2/01 · §3 row 01 · §7 rows 2, 8 · flywheel §2/01 (forest, cost of delay, `railed`,
world-woken) · machine §2/01 (allocator, `instead_of:`, `evidence_of_demand`), §5.6 (four states, four
sources) · founder §2/01 (commander's intent, blocked-authored / stalled-computed) · frame §1, §15 step 6,
§16 items 5 and 6 · catalogue P1 P2 P3 P5 P7 B1 B2 B3 B5 C24 C36 EC3.

---

## 02 · Workers & roster

**At full scale — what it IS.**
**Zero new agent files, ever.** The seven engines stay as files and the loop never dispatches through
`Agent`; it spawns `claude -p` children whose argv is the whole of their authority. A **pack** is
`(tools × mcp × warrant kinds × done-tests × field)` — a grant and a stop, never a procedure —
declared in `packs/<id>.yml` and compiled by `scripts/loop/pack.mjs` into:

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
dispatch from `outcomes.jsonl`, so a hand-edited number is overwritten rather than honoured. Promotion needs
N consecutive moves whose artifacts survived **the world's verdict** — rung ≥ 2, zero incidents — which is
what makes the signal unforgeable by an internal judge. Demotion is the same counter running backwards on an
incident: no restore, no appeal that skips the count. A new pack serves an apprenticeship in shadow — real
moves, real artifacts, ships nothing, one move in five — and graduates on a record. Retirement fires on zero
dispatches in ninety days, computed at the dispatch chokepoint rather than proposed by anyone, and is
archival with a resolvable stub, never deletion; above the declared ceiling a new pack requires a retired
one. Personas exist separately, argue, and are structurally forbidden from producing an artifact or holding a
warrant. Concurrency is one move per lane per tick, with parallelism only **inside** a move as harness-side
fan-out: `tick.mjs` spawns `variation.n` processes under one grant with different constraint cards. Workers
never hold `Task`, so there is no nesting and no worker-to-worker edge (§06).

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
`design-brand`, `content-video`, `customer-market` and `content-copy` are **named and unbuilt**. `orient`
exists as a grant, not as a family. `warrant_kind:` is on the pack schema from day 7 as a name from the
declared enum `none | standing | morning`, **read by nothing** and refused if not in the enum — the tested
home for `artifact_sha256`, `not_before` and an attenuation chain on the day the first outbound pack is
proposed (*founder's choice 4*). **Worker** trust, apprenticeship, promotion and retirement stay dissolved
(D11): a `claude -p` process has no identity across moves, so there is no subject. **Pack-field** trust is
the subject that does exist — a durable file whose outcomes join on the task id — and it reopens when a
second pack ships (*founder's choice 1*). Which unbuilt pack comes second is set by the first blocked row
whose `clearable_by: founder` says the granted tools cannot meet an approved done-test, never by a plan.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| A blocked row states that an approved done-test cannot be met by the granted tools | The second pack, of whichever family that row names |
| A second pack ships | Pack-field trust is computed (refusal 9's narrowed reopen). `scripts/lib/trust.js`, `outcomes.jsonl` as its only input, `trust.test.mjs` with the hand-edit positive control |
| A third pack | `sweep` becomes its own pack rather than a harness script; the shadow apprenticeship gains its one-in-five counter |
| N consecutive rung ≥ 2 exposures with zero incidents on one `(pack × field)` | That pair's promotion, and the first of the three counts the standing-warrant rule needs (§03) |
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
   Measurable in the first 30 days and the cheapest measurement in the document. Half `MEASURED` true. The
   unmeasured half is H2: what a dispatched process can actually *touch*, where the precedent finding was a
   silent no-op rather than an error.
3. **Outcomes accrue fast enough that trust is computed from more than a handful of rows.** Not measurable
   in 30 days; the first venture produces single-digit exposures.

**grafted_from.** picture §2/02 · §3 row 02 · §7 rows 1, 4 · flywheel §2/02 (reach earned from the world,
shadow, retirement) · machine §2/02 (packs as shapes vs instances, ceiling, demotion) · founder §2/02
(`(pack × field)`, fails closed to supervised) · frame §2, §15 step 7, §16 item 9 (as narrowed) ·
catalogue C4 C16 K1 P5 T1 T2 T4 T5 X2 X4 X5.

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

Roughly fifty hands *(illustration; the machine vision's split is ~30 night, ~15 day, ~5 not-a-hand)*, each
a file in `policy/hands/<id>.yml`. **A hand is admitted by a five-part test, not by someone judging it
wise** — declares `reversible:` and `blast_radius:` or does not load · has a dry branch where the default
call produces an artifact and the effecting call takes a hash · has a credential narrower than the hand ·
has a probe a dispatched worker can actually make, because **unprobed is unavailable** · has a counter and a
ceiling. Pass 1–5 → a **night hand**. Pass 1–4 → a **day hand**, exercisable only against a warrant with
`not_before` in the morning. Fewer → **not a hand**; it is a morning row and a human does it. Group C holds
the test as a map with its loader, wrapper, counter and probe; what matters here is the property it buys:
every one of the five is checked by something other than an agent reading a policy, so **the cost of
admitting the fiftieth hand equals the cost of the first**, which is the only thing that makes a fifty-hand
roster governable. Tier R is one process, `bin/mouth.mjs`, holding every outbound credential,
single-threaded, **with no model in it at all** — it reads a queue, verifies an HMAC chain, compares a
sha256, counts against a ceiling, and either executes one action or refuses. There is nothing in it to
persuade. Its eight checks run in order and any failure is a refusal plus a morning row: STOP absent · the
warrant's chain verifies · `not_before` passed and `expires` not · the named artifact exists and its sha256
matches the caveat · `taint: clean` or a morning release exists · every human recipient is in
`policy/humans.yml` · the per-hand hour and night counters are under ceiling · the spend caveat plus today's
spend is under the daily ceiling. **The honest hole, stated rather than discovered:** the five tests bound
*authority*, not *correctness*. A hand that passes all five can send a perfectly authorised, catastrophically
wrong email to an approved recipient. That is what the oracle, the done-test and the founder's tap are for;
no capability model substitutes for them.

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
carries `not_before:`, default 08:00 the next morning** — one field on a row, so the hour is a property of
the token and not a policy someone remembers (*founder's choice 8*). Refused on every argv:
`mcp__higgsfield__tiktok_publish`, `sandbox_exec`, Gmail `send_message`, Drive `share_file`,
`claude-in-chrome`, n8n, and any ad, registrar, postage or GPU-rental hand. `higgsfield generate_*` and
`virality_predictor` are workshop hands held for `content-video` when it reopens. A daily `claude mcp list`
writes `~/.agentvibe/hands.json` from the briefing plist; it is a **report, not a check** — it exits 0 when a
server is unhealthy (`MEASURED`) — and an unhealthy server the current pack grants becomes a balcony row.
`playwright` is measured failing across two scopes, and rung 0 for pages depends on it. Of the five admission
tests, test 4 exists as the day-4 grant census and tests 1 and 3 apply to the granted MCP servers; **tests 2
and 5 are absent because there is no outbound hand to apply them to** — absence because unneeded, not a
different shape.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `EXPOSURES.yml` shows the founder performing the same outbound act by hand **3×** | Refusal 1 reopens for that act only. The act becomes a candidate hand and is put through the five tests |
| A candidate hand passes tests 1–4 | A **day hand**: exercisable only against a warrant with `not_before` in the morning. The `not_before` field already exists on the row, which is why this is additive |
| A candidate hand passes tests 1–5 | A **night hand**, and with it the first need for `bin/mouth.mjs`, `WARRANTS.jsonl` and the minter (territory 16) |
| The founder has performed a class by hand N times **and** the machine's nomination matched on the last N **and** that class resolved rung ≥ 2 with zero incidents | A **standing warrant** for the class: minted by code, hash-bound, rate-ceilinged, `not_before`-caveated, audited weekly with its reversal count. All three counts are required; any one alone is defeatable by a machine optimising for it |
| The first tier-R hand exists | The nightly `hands.mjs probe` becomes blocking rather than reportorial: a hand that fails its probe is unavailable tonight, not degraded-and-used |
| A worker's JSON return cannot express a state change it needs mid-move | Refusal 11 reopens; the first MCP server is built, with its caller in the same diff |
| `content-video` reopens | `higgsfield`'s 84 tools are narrowed by per-tool names in `--allowedTools`. The narrowing is available: M3 is `MEASURED` true |
| Any count at all, on any class that crosses the physics line | **Nothing.** No count is the count. A signature, a legal statement, a purchase of a durable asset, a letter in the post, first contact with a human not on the register — permanently tier F |

**Would have to be true.**
1. **A process with no model can hold the credentials** — every outbound hand has a call shape checkable
   without reasoning: a target, a hash, a recipient, a count. Not measurable in 30 days, and deferrable
   without loss, because the founder is the mouth in year one and that posture is survivable indefinitely.
2. **`--allowedTools` narrowing survives dispatch and launchd (H2).** Measurable in the first 30 days and
   load-bearing: if a missing hand is *denial* rather than *absence*, the rings collapse into one and the
   honest posture is that nothing runs unattended holding any credential.
3. **The narrowest credential a vendor offers is narrower than the hand.** Partially measurable at the grant
   census; where the narrowest available credential is "everything", the hand is ring-2-only or it is not a
   hand.

**grafted_from.** picture §2/03 · §3 row 03 · §7 rows 4, 8 · the physics line · machine §2/03, §5.1 (rings by
credential), §5.4 (the mouth, eight checks), §5.5 (the five-part test) · flywheel §2/03 (four tiers, tier R,
tier F as a reserve) · founder §2/03 (grant shape, dry-by-default, the named-human register) · frame §3, §9,
§15 steps 4, 10 · catalogue H1 H2 R2 R4 R5 R6 · `docs/02-competitive/expansion/hands.md` §0.1 §3.3 §5.1 §8.

---

## 04 · Knowledge

**At full scale — what it IS.**
Skills are **injected, never discovered.** `scripts/loop/prompt.mjs` inlines
`.claude/skills/routers/INDEX.md` plus the pack's one namespace under a byte cap that only ratchets down,
and the harness meters what was actually read, so a skill nobody reads leaves on the same schedule as a pack
nobody dispatches. `~/.agentvibe/fields/<slug>.md` holds about 180 field notes *(illustration)* — how cold
email works, how a thumbnail works, how trial-to-paid moves, how VAT works in three jurisdictions. **Global
by design**, because *how a field works* is the same for every venture and *what this venture sounds like*
never is. A note is **three annotated exemplars — good, bad, near-miss — each sourced, with rules
subordinate to them**, and every fact is a claim with an expiry, so a note about a platform's algorithm rots
on schedule rather than quietly becoming folklore. Learning a new field is a bounded protocol with a
checkable exit — practitioners named, canonical artifacts sourced, rules extracted, one proposed done-test —
and then it **stops**; "research it" is not a move. `ORIENT` is computed by `scripts/loop/orient.mjs` and
prepended to the maker's prompt: matching dead-ends as **actual entries** rather than as a pointer, attempts
already made on this leaf, archive cells occupied, the field's exemplars, and one thinking model's stop rule
drawn by the harness. **The harness does the retrieval, so a worker cannot skip it** — which is the property
that makes the graveyard load-bearing rather than decorative. The maker's prompt carries **no rubric, no
scoring axis and no reference URL**: divergence and convergence are separated in capability, not merely in
instruction. Constraint and far-transfer decks are drawn without replacement, one card per variant, checked
mechanically where the card declares a check. `dead-ends/<goal>-<n>.md` carries `retry_if:` as a **command**,
and a scheduled reader re-tests those that come due — about twelve a night, of which roughly one in fifteen
no longer reproduces *(both illustrations)* — so the map of what the company cannot do stays current instead
of calcifying. `ventures/<slug>/TASTE.md` is per venture, founder-only, ≤ 20 lines, injected whole into MAKE.
**The founder never reads the Book. If they have to, the knowledge layer has failed.**

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
`allowWrite` path outside the project root, so the global store is global because of where the sandbox lets
the harness write, not because a convention says so. Notes are written **only** by the harness from an
`orient` move's return, never by a maker. `TASTE.md` is founder-only, ≤ 20 lines, seven headings, tiered
`irreversible` in `qa-tier-floor.yml`, injected whole into MAKE. `dead-ends/` never expires, and
`retry_if:` is therefore **a predicate nothing evaluates** — the one additive gap in this territory, named
here rather than discovered later. ORIENT is computed and prepended. Decks exist as two files. `FIELDS/`
carries its own falsifier from the frame: by **2026-12-02**, if the meter shows no field note read by a task
outside the mission that wrote it, `FIELDS/` freezes.

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
3. **The byte cap does not starve the maker.** Measurable in the first 30 days as the count of `truncated`
   returns and of moves that ask for a file the cap excluded.

**grafted_from.** picture §2/04 · §3 row 04 · §5 rows 5, 6 · flywheel §2/04 (180 notes, decks, C18) ·
machine §2/04 (two stores, the graveyard at 3am, the harness retrieves) · founder §2/04 (the exemplar triad,
the bounded protocol, K3 by scope, the founder never reads it) · frame §4, §15 step 8 · catalogue C9 C13 C16
C18 C25 K1 K2 K3 N1 X2 · Decision 9.

---

## 05 · Memory

**At full scale — what it IS.**
Ten stores *(illustration; the count is whatever the store map holds)*, each with **exactly one writer**,
each append-only or rewritten whole, all in git, **none a service.** Group C's store map is the authoritative
list — path, format, one writer, readers, expiry rule, cap — and it is not restated here, because two
descriptions of one table disagree silently. What belongs to this territory is the **routing rule**: four
physics decide which store a thing goes in.

| store class | holds | physics |
|---|---|---|
| `events.jsonl` | *what happened* | append-only, never expires, and **never evidence for a belief without a claim** |
| the claim ledger | *what is true* | expires, and expiry forces exactly one disposition — refresh, deprecate, or waive with a new deadline |
| `~/.agentvibe/fields/` | *how a field works* | global, exemplar-first, every fact expiring |
| `TASTE.md` + `PAIRS.jsonl` | *what this venture is* | per venture, preference pairs plus an extracted rubric, expiring quarterly because taste drifts |

Get the routing wrong and the failure is specific and familiar: an event used as evidence produces a belief
nobody can date, and a belief stored as an event never expires. The full-scale additions are new stores under
the same discipline, not a new discipline: `AUDIENCE.yml` per venture (channel, owned or rented, size,
measured at a date), `people.yml` (the named-human register), `WARRANTS.jsonl` (append-only, one row per
issue, exercise and refusal), and the attention record (every card: answered or fused, how fast, and whether
the founder later reversed the fuse). Conflict resolves **newer-wins with the older retained in place
carrying the evidence that moved it** — the practice this repository already follows by hand in every
supersession block, made a data operation. Forgetting is a program with four rules and a stub under every
original heading, never a judgement call, and **nothing is deleted to meet a cap**; the archive rotates by
volume and each volume is capped independently, because a cap on the lifetime total of an append-only log is
a mechanism for losing decisions. Retrieval is by construction — the harness injects — plus `Grep` and
`mdfind` over an append-only corpus. **Still no vector store.** By full scale there is one rebuildable index
over the append-only files, because prefix sums over four years stopped being instant: an index, never a
second source of truth, and deletable at any moment without loss. **RAG over transcripts is refused as
memory**: transcripts are full of confidently-stated superseded beliefs and retrieval cannot tell a corrected
belief from a current one. They are instrumentation — mined monthly for corrections, for promises that never
landed, and for where sessions die.

**Components.**
- The store map — group C — path · format · one writer · readers · expiry · cap for every store.
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
Eleven rows, one writer each: `MISSIONS.yml` (transitions from a table; `tick.mjs` for state, founder for
intent) · `BOARD.md` (rewritten whole, ≤ 4,000 bytes) · `STEER.md` (read at tick top; `stop:` is the andon
cord; founder-written) · `TASTE.md` (founder only, ≤ 20 lines) · `EXPOSURES.yml` (append-only, `check_on`
required, `no_data` ≠ `not_checked`; written by `expose.mjs`) · `~/.agentvibe/fields/` (every fact a claim
with `valid_until`; harness) · `dead-ends/` (never expires; `tick.mjs`) ·
`archive/<slug>/<field>/<cells>/<task>/card.yml` + `INDEX.jsonl` (every candidate kept, rotates by volume,
never deleted) · `taste/PAIRS.jsonl` (only `promote.mjs` writes) · `~/.agentvibe/events.jsonl` and
`tasks.jsonl` (no row without `task`) · `DECISIONS.md` and the ledger, unchanged. Retrieval by construction
and by `Grep`/`mdfind`; no vector store. Conflict newer-wins, older superseded in place. Forgetting is
`evict-memory.mjs` pointed at each new store with its four rules re-derived. Transcripts are read monthly by
the harness and never enter a producing context. The archive is **built**, with its falsifier: 30 days after
the first `card.yml` exists, zero founder promotions of a non-nominated cell **and** zero ships from a
non-nominated cell deletes `archive/` and keeps `distance.js` and `select.js`; if no round has run by
**2026-10-02**, that is itself the finding and the archive is not built.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| The first subscriber to the owned address | `AUDIENCE.yml` per venture: channel, owned or rented, size, measured at a date. Its reader is the rung ceiling (§15, group C) |
| The first named human the company contacts | `people.yml`, and with it the mouth's check 6 — nobody is contacted who is not on it |
| The first warrant minted | `WARRANTS.jsonl`, append-only, one row per issue, exercise and refusal. **The only store whose growth permanently raises the machine's ceiling** |
| The first fuse fires | The attention record's first row. Reversals are counted **separately** from non-answers, and a card class with any reversal history can never be auto-retired |
| `balcony.mjs` wall clock exceeds the founder's stated latency budget | The one rebuildable index. The budget is a number the founder sets; it is not invented here |
| A second archive volume is needed | Rotation, with the per-volume cap applied independently — the lifetime total is never capped |
| A store acquires a second writer in a diff | Nothing "lands": the single-writer test fails and the diff does not merge. This is a brake, listed here so it is not mistaken for a growth step |
| Four lanes run | The one-writer discipline is tested for real; last-writer-wins on a whole file stops being free and the store map's per-store lock column has an input |

**Would have to be true.**
1. **One writer per store survives concurrency.** Measurable the day two lanes run, which is inside 30 days
   only if the four-hour trigger fires; otherwise it is the first thing to measure in stage two.
2. **Grep over an append-only corpus stays fast enough that no vector store is needed.** Measurable in the
   first 30 days at trivial volume, and the measurement is nearly meaningless there — say so rather than
   bank it.
3. **Newer-wins-in-place is cheap enough to do every time.** The evidence is that this repository already
   does it by hand in every supersession block; the risk is that a data operation is skipped where a prose
   habit was not.

**grafted_from.** picture §2/05 · §3 row 05 · §5 (the compounding stores) · flywheel §2/05 (the store table,
the index, `outcomes.jsonl` split from `EXPOSURES.yml`) · machine §2/05 (episodic / semantic / procedural,
transcripts as instrumentation) · founder §2/05 (the four physics as a **routing rule**, MEM2 in place) ·
frame §5, §15 · catalogue A4 C2 C21 MEM1 MEM2 MEM3 W3 X5 · Decision 1.

---

## 06 · Communication

**At full scale — what it IS.**
**A star, and it is physics: a `claude -p` child has no address.** Eight makers running at once *(the
machine vision's illustration)* are eight islands, and the conductor alone reads all eight — not a
limitation but the thing that makes their variants actually different. **No worker messages a worker at any
scale**, and the reason is worth stating precisely: a grant can be widened by an oversight, and an address
that does not exist cannot. Down is the compiled prompt. Up is JSON on stdout, parsed by `tick.mjs` into a
fixed return: `outcome ∈ {done, blocked, stuck, failed, truncated}` · `artifacts[]` · `tried[]` · `learned` ·
`blocked{because, clearable_by, until, default_if_unanswered}` · optional `proposed_done_test`. The baton is
SBAR with a per-section byte cap, read back in the receiver's own words on first return, with large
divergence raised as a **finding rather than a block** — the receiver may be right and the baton wrong. Help
is the return's required `tried:` list, which doubles as the raw material for a dead-end, so negative
knowledge is a by-product of asking rather than a separate act nobody performs. Escalation is three rungs
with maximum dwell times: retry to `attempts`, counted by the harness from event rows and never by the
worker; block with `clearable_by: founder`, which frees the slot; and **wake**, which only a warrant carrying
`urgency: wake` may do — a caveat held by a small closed set of warrant kinds, listed **by name** in
`policy/warrants.yml` and changeable only in daylight. The size of that set is a founder setting, not a
figure this document supplies. **One edge is added at full scale: inbound.** A relay holds the socket, the
mailbox, a watched drop directory and the feeds, and does exactly one thing with what arrives — **it writes a
leaf.** It does not summarise, classify or rank. **A received body never enters a producing context.** It
enters an argv with no Write, no Edit, no Bash and no outbound grant; the artifact it produces carries
`taint: foreign`, stamped by the wrapper that fetched it and propagating through the context; and the mouth
refuses a tainted artifact without a morning release. The two legs are not redundant: the argv is the
control, and the taint stamp is the audit trail that survives into the artifact. **The stated hole:** foreign
content arriving by a path the wrapper does not mediate is untainted and nothing notices. Every path must be
mediated or the property is not a property.

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
The star, with **no sideways channel at all**. Down is the compiled prompt; up is the fixed JSON return
parsed by `tick.mjs`; `stop_reason` marks `truncated` and a truncated move is never `done`. `BOARD.md` in
SBAR — Situation · Background · Assessment · Next (a real leaf id) · Blocked — and a missing heading fails.
Help is the return's `tried:`. Escalation has **two** rungs: L1 retry up to `attempts: 3`, counted by
`tick.mjs` from event rows; L2 blocked with `clearable_by: founder`, then the next leaf. **No L3 wake and no
council.** Interrupts: one `osascript display notification` per new founder-clearable block, inside
08:00–22:00, at most `notify_per_day`, from the harness. Everything else waits for the 08:00 briefing.
Inbound into a producing context is refused (D9, refusal 3) — and the frame's stated reason *is* the
full-scale mechanism: a fetch enters only the `orient` argv. So the refusal is of the wrong **shape** of
inbound, not of inbound, and the relay and the taint stamp are additive on top of it. **The H3 taint flag is
`WISH` in year one**, and the frame says so; it gains a mechanism the day a mediated fetch path exists to
stamp.

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
1. **Argv absence is absence on the MCP path as well as the built-in path.** `MEASURED` for user-scope
   servers via `--strict-mcp-config`; the remaining half is H2, and it is measurable in the first 30 days.
2. **A leaf written by the world does not become the priority function.** Guarded by construction — the relay
   writes a leaf and never a rank — and not measurable until inbound exists.
3. **Every inbound path can be mediated.** Not measurable in 30 days, and the honest statement is that the
   registry closes the enumerable half only.

**grafted_from.** picture §2/06 · §3 row 06 · flywheel §2/06 (the relay, escalation dwell times) ·
machine §2/06, §5.8 (four inbound channels, taint at the wrapper, the stated hole) · founder §2/06 (the baton
read back as a finding, the pod, no messaging hand) · frame §6, §9, §16 items 3, 6, 7 · catalogue B4 CO1 CO2
CO3 CO4 H3 N3 S1.

---

## 07 · Context & cost

**At full scale — what it IS.**
**Every row carries a real task id and a `say:` line, both minted at dispatch, from the first commit.** Both
are unretrofittable for the same reason: the balcony, the briefing, the queue, the register, the attention
meter and `explain.mjs` are six projections of **one** log, and without the id they are six logs that
disagree — discovered during an incident. A row emitted without `say:` can never be spoken, and backfilling
it rewrites every emitter. Cost per mission is a prefix sum over `tasks.jsonl`; cost per venture, per field
and per pack are **the same sum grouped differently**, which is why none of them needs a store. The prompt is
assembled in cache order — stable prefix first, varying suffix last — and the cache-read ratio is a
**measured** number taken from `usage.cache_read_input_tokens`, because a saving nobody measures is a saving
nobody has. Every injected surface has a byte cap that only ratchets **down**; exceeding it never raises the
cap, it forces a two-tier split into ids plus one-line summaries with content on demand. That cure is proven
twice in this repository already: skills discovery 15,000 → ~1,070 tokens, and `session-start.js` 27,069 →
2,941 bytes, at which point the injected content **reached agent context for the first time** — under the old
size the runtime truncated it and inlined a preview, so the lenses and playbooks never arrived at all. Both
`MEASURED`. Compaction is designed out: the process exits, and a move that would have needed it is recorded
`truncated`, which is never `done`. Overnight work goes through the Batch API at half price where reachable —
**flagged unverified**, because the frame states Batch is not on the CLI; if it is unreachable it moves the
model line by roughly $700 a month *(illustration)* and changes nothing else about the design.

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
Into a worker: `prompt.mjs` output **≤ 4,096 bytes**, in cache order — (1) pack preamble, (2) router index
plus namespace, (3) `TASTE.md`, (4) `BOARD.md`, (5) `STEER.md`, (6) the ORIENT block, (7) task id, intent and
done-test. The stable prefix is the grant; the varying suffix is the idea. **Batch: none on the CLI.
Compaction: designed out** — the process exits, and a move that would need it is recorded `truncated` and the
founder splits the leaf. The join lands on day 3, not day 19: `logEvent(task, obj)` as an arity change across
five call sites, **and `say:` in the same landing** as a column on the row, plus a first `BRIEFING.md` writer
over whatever rows exist, so the founder is handed something to look at on **day 5** (*founder's choice 7*).
`~/.agentvibe/tasks.jsonl` maps task → `session_id`, `total_cost_usd`, `num_turns`, `stop_reason`, every one
of them `MEASURED` present in the JSON result. Cost per mission is a prefix sum. Cost per surviving exposure
is spend ÷ exposures at rung ≥ 2, printed `undefined` while the denominator is zero — which it will be for
most of the first month, and that is the honest reading rather than a defect.

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
| A seventh projection of the log is proposed | It must render from the same query as the other six, and the test that all renderers share one query (§10, group B) is what admits it |
| Prefix sums stop being instant | The one rebuildable index (§05) — an index, never a second source of truth |

**Would have to be true.**
1. **The task id and `say:` are minted before anything else is built.** Not an assumption so much as a
   decision, already taken, and the only one in this group that cannot be made later at any price.
   Measurable in the first 30 days trivially: the day-3 landing either carries both or it does not.
2. **`--append-system-prompt` at 4 KB is accepted and cache-stable across ticks.** Measurable in the first 30
   days; it is on the frame's own measure-before-build list, and both the byte cap and the cost argument rest
   on it.
3. **Prefix sums stay instant long enough that no index is needed early.** Measurable in the first 30 days,
   and nearly meaningless at first-month volume — which is the point of stating it as an assumption with a
   later trigger rather than as a fact.

**grafted_from.** picture §2/07 · §3 row 07 · §5 (six projections of one log) · §7 row 7 · flywheel §2/07
(cache order, one sum grouped differently, Batch) · machine §2/07 (the ratchet, the two measured cures,
`cache_read_input_tokens`) · founder §2/07 (`say:` at emission, the id from the first commit) · frame §7,
§15 step 3 · catalogue CT1 CT2 CT3 EC2.

---

## What this group refused to invent

Three numbers were available to make this document look more finished and are deliberately absent.

- **The latency budget that triggers the rebuildable index** (§05) and **the cache-read floor that triggers
  re-deriving the prompt order** (§07). Both are founder settings. A specification that picks them turns a
  founder's threshold into an author's guess, and the guess would then be cited as a requirement.
- **N in the standing-warrant rule** (§03) — how many hand-performed acts, how many matched nominations. The
  picture states the three-part conjunction and not the count, correctly: the count is set once, in daylight,
  against a record that does not exist yet.
- **The pack ceiling** (§02). `LIMITS.yml` holds it; it is a number someone raises deliberately, and
  deliberately is the whole content of the rule.

Two figures that look like measurements in the source documents are illustrations and are labelled as such
wherever they appear above: the roster size (fourteen to twenty-six packs) and the hand count (roughly fifty,
split thirty night, fifteen day, five not-a-hand). Neither has been counted. Both are what one envisioner
pictured at a scale nothing in this system has reached.
