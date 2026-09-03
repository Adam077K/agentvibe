# The full system spec · Group C — territories 15–22, the cross-cutting maps, and the build path

```
written: 2026-09-02 · framer, group C · brief: vision/01-SPEC-BRIEF.md
sources: vision/2026-09-02-THE-PICTURE.md (primary) · STARTUP-OS.md Part II §0–§17, Part IV
         vision/2026-09-02-{flywheel,founder,machine}.md §5 and §6 · docs/02-competitive/expansion/
status: a specification of the big system. The year-one slice inside it is DECIDED (Part IV).
        Everything outside that slice is specified, not authorised.
```

## How to read this

**Four statuses, on every mechanism**, because a spec that cannot tell what is running from what is drawn is a
defect this repository has already paid for. `[exists]` — running here today, named by its file ·
`[year-one]` — a landing of Part II §15, decided but not yet written, and `scripts/loop/` does not exist ·
`[full-scale]` — specified here, authorised by nothing, its trigger in the build path · `[WISH]` — no
mechanism and none proposed, named so it cannot be mistaken for enforcement. **Every vision number is an
illustration**, tagged so, never the thing to build against; the build path names what to measure instead.

**On counts, once.** The picture says *"Nineteen processes"* while its own block sums to twenty-one at the
fan-out it states, and *"Ten stores"* while the frame's year-one table has eleven rows. Neither is worth
correcting: **both are functions of fan-out and venture count, and neither is a constant.**

# Part A · The eight territories

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
company's own domain, by the founder's hand, before mission 2 publishes** — §15 step 14, founder's choice 3,
accepted **later in the month** rather than at step 4 as the picture asked. No `AUDIENCE.yml`, no `channels/`,
no `reach_ceiling:`, no acquisition mission kind. The frame's own verdict is *"ABSENT, and it should not be"*;
the founder's decision narrowed the timing, not the substance.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| The address has one subscriber | `AUDIENCE.yml` with one row, an `instrument:` and a `measured_on` |
| Three consecutive exposures resolve `no_data` | the finding is filed against the **instrument**; `reach.mjs` prints the ceiling that made it inevitable |
| A second channel is proposed | `channels/<id>.yml`, the rate table, the mouth's per-channel counter |
| The first rented channel is proposed | `revocable: true` and the `mirror:` requirement — a rented publish needs an owned twin; and `intent.kind: acquire` with its `AUDIENCE.yml`-delta resolver |

**Would have to be true.** (1) **Owned distribution is buildable by a machine at all** — several platforms
restrict automated posting outright; if false the company is a slower thing, probably email and search.
**Partially measurable in 30 days**: the address exists and one subscriber arrives; throttling needs ninety.
(2) The world answers — measurable only as *suggestive* over the first five exposures.

**grafted_from.** picture §2/15 · §3 row 15 · §5 wheel 2 · §7 row 3 · flywheel §6/15, §3-B · frame §15 step 14,
§16 refusal 1, Part IV row 15. **Catalogue: none** — no entry exists for audience, which is itself the finding.

## 16 · Authority

**At full scale — what it IS.** Territory 09 is entirely about stopping; this one is about **granting**, and
it produces a number no other territory does: *"tonight the machine may spend $180, publish to 2 accounts,
email 9 named humans and deploy 4 previews"* (illustration). The object is a **warrant**, minted by
`bin/minter.mjs` from `policy/warrants.yml` and the trust table, with **no natural-language surface anywhere
in the issuing path**. It names one hand, one mission, one pack, and carries caveats: a project scope, an
`artifact_sha256` binding it to bytes already on disk, `max_calls`, `not_before`, `expires`, `spend_cents`,
`taint: clean`. Its `chain:` is an HMAC over those caveats, so **any holder may append one and nobody can
remove one** — a spawned sub-worker holds strictly less than its parent, verified by arithmetic rather than by
a central authority, which is what makes delegation safe at 3am when nothing is awake to ask. Issue, exercise
and refusal all append to `WARRANTS.jsonl`. **The fuse and the warrant are one object seen from two sides** —
a warrant that expires unexercised *is* the fused default, and the queue row and the ledger read the same
`expires`, so the surface and the authority layer cannot disagree about what the founder's silence meant.

**Components.**
- `WARRANTS.jsonl` — append-only, one row per issue, exercise, refusal — written by minter and mouth; read by the mouth, the bailiff, the Friday audit, the trust function.
- `policy/warrants.yml` — the mint policy and the `urgency: wake` allowlist — written by the founder in daylight.
- `bin/minter.mjs --policy warrants.yml --ledger WARRANTS.jsonl` — issues or refuses; deterministic.
- `bin/bailiff.mjs --rates rates.yml --rope rope.yml --stop STOP` — counts exercises against ceilings · `packs/<id>.yml` `warrant_kind:`, the declared-enum label the whole object hangs on.

**Enforced by.**
| rule | mechanism |
|---|---|
| A warrant cannot be reused on different bytes | sha256 compare at the mouth, before execution `[full-scale]` |
| A warrant cannot fire before its hour | `not_before` compare at the mouth `[full-scale]` |
| A delegate holds strictly less than its parent | HMAC chain verification; a removed caveat fails the chain `[full-scale]` |
| A `kind: human` gate carrying a `run:` is refused | schema refusal — `.claude/gates.yml` + `check-gates.mjs`, pinned by `gates.test.mjs` `[exists]` |
| Authority is computed in exactly one place | `scripts/lib/classifier.js` is the one decider `[exists]`; re-derive by `grep -rn 'reach' scripts/loop/ packs/` |
| The founder widens a warrant only in daylight | `[WISH]` — a ritual. What is mechanised is the audit's input, not the founder's attendance |

**Year one — the slice.** Two strings, both decided. **`warrant_kind:` on `packs/<id>.yml`** — a name from the
enum `none | standing | morning`, read by nothing, refused if not in the enum (choice 4, §2, §15 step 7). It is
the tested home for `artifact_sha256`, `not_before` and the attenuation chain on the day the first outbound
pack is proposed. And **`not_before:` on every staged act that would leave**, default `08:00` the next morning
(choice 8, §3, §15 step 8). The picture adds two columns to `expose.mjs` — which act, by whose hand, how many
times, reversed how often — so **row one of the authority ledger is the founder's own hand**.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| The first `reach: outbound-write` pack is proposed | count the deciders first: one file and the warrant is an addition, two and it is a rewrite |
| `EXPOSURES.yml` shows 3 by-hand outbound acts of one class | `WARRANTS.jsonl`, `minter.mjs`, the warrant object; the first is a **morning** warrant |
| Two hands pass admission tests 1–5 with no process able to hold them | the mouth; rings separated by credential |
| A maker first spawns a sub-worker under a warrant | the HMAC attenuation chain and its verification |
| The three-count conjunction holds for one class | the first **standing** warrant, minted by code at the audit (Map 5) |

**Would have to be true.** (1) **Authority stays computed in exactly one place.** If false, standing warrants
are decorative and the Friday audit measures one path while another exists — and this repository has already
paid once to learn what two risk deciders cost. **Measurable in 30 days**, trivially, by the grep above.
(2) A pack's track record is a coherent subject; if false, the ceiling is the founder's morning permanently.

**grafted_from.** picture §1 · §2/09 · §5 wheel 7 · §7 rows 4 and 8 · machine §5.2, §5.4, §6.1 · frame §2, §3,
§9, §16 refusal 1, Part IV row 16 · catalogue `R2` `R4` `R5` `R6` · `hands.md` §5.1 pattern 10 (macaroons).

## 17 · Attention

**At full scale — what it IS.** Territory 10 is *where the founder looks*. This is *how much they can be
asked, by whom, at what cost, and what happens when the budget runs out* — and only the second is a
constraint. `DAY.yml` is a declared object the loop reads as a hard scheduling input: protected blocks with
`interruptions: 0` and an **enumerated, closed** exception set, an `interruptions_per_day` ceiling, a
`questions_per_day` budget the machine is required to spend. Work whose output needs looking at is planned to
land before the morning appointment, and a card so its fuse does not fall inside a protected block. The budget
is metered like the token window: a ceiling, a safelist, an override that demands a written reason and logs the
numbers. **The fuse is the load-bearing mechanism** — every founder-clearable block carries
`default_if_unanswered:`, always the reversible branch, and a fourth disposition `fused`; irreversible,
financial and first-contact classes carry no default and cannot fuse. **The failure to watch**, named by the
vision that proposed the attention record: it can quietly train the machine to stop asking about things the
founder is *avoiding*. The guard is arithmetic — reversals counted separately from non-answers, and a class
with any reversal history can never be auto-retired.

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

**Year one — the slice.** The fuse, decided, landing twice: the schema field at §15 step 6 and the branch in
`tick.mjs` at step 8 (choice 2). `notify_per_day: 3` in `LIMITS.yml` as **a cap without an account** — the
frame's own honest description. `DAY.yml`, the attention record, the question budget and the meter are
designed-in shapes with **no change in year one** (picture §7 row 10). The nearest thing to an attention
instrument that does exist is the balcony's own done-test: opened twice unprompted, more than 48 hours apart.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| The first month in which `notify_per_day` is hit | the cap becomes a meter — one line in `monthly.mjs` |
| Fused count exceeds answered count in one month | card classes proposed for retirement, with their instances shown |
| A second lane in flight | `DAY.yml`, because scheduling now has something to schedule around |
| Any fuse is reversed by the founder | that class loses auto-retirement eligibility permanently |
| The override is exercised on consecutive days | the budget is removed, not tuned |

**Would have to be true.** (1) **The founder looks, and looking is cheap enough to keep doing.** The measured
base rate is zero; everything collapses if this is false, and the correct response is to **stop the vision, not
work around it**. **Measurable in 30 days, twice**: the day-8 numbers recorded without chasing, and
`BRIEFING.md` opened twice unprompted 48h apart. (2) A metered budget is not overridden every day.

**grafted_from.** picture §1 · §3 rows 10 and 17 · §5 wheel 8 · §7 rows 2, 10, 11 · founder §4, §6/15 · frame
§1, §10, §13, §16, §17, Part IV row 17 · catalogue `C21` `E3` `S2` `S3`.

## 18 · Obligation, and the people it is owed to

**At full scale — what it IS.** Missions are things the company **chose**; claims are things that are
**true**; neither is a thing the company **owes**. An obligation has different physics from both: a
counterparty, no deprioritisation by a ranking function, no expiry when it becomes inconvenient, and a default
that costs reputation, which no artifact repairs. `ventures/<slug>/OBLIGATIONS.yml` holds `counterparty` (an
id in `people.yml`), `kind:` from a closed enum (`reply | refund | invoice | sla | renewal | regulatory`),
`due:`, `promised_in:` — the task or exposure id where the promise was made, so every obligation traces to the
act that created it — and `state:` (`open | met | missed | waived`). `people.yml` is the named-human register
and is more than an allowlist: id, name, address, `consent:` with its source and date, `last_contact:`, and
promises kept and broken. **The register is a mouth check, not a prompt**: every recipient must resolve in it,
and an unparseable recipient **fails closed**. First contact with anyone not on it is tier F, forever, at any
count, and reply-in-thread is a distinct and narrower permission. A per-person cooldown counter stops the
specific failure a 24/7 machine is built to commit: approaching the same person twice about the same thing.

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
What year one provides is the hook the first one hangs on: every row carries a task id from day three, and
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

**Would have to be true.** (1) The register scales past one venture without becoming a burden the founder
abandons. If false it rots into a stale allowlist that fails closed on real customers and gets routed around,
which is worse than not having it. Not measurable in 30 days; nobody is in it. (2) Obligations accumulate fast
enough to warrant a store before the first one is missed.

**grafted_from.** picture §2/table row 18 · founder §6/16 · machine §6.3 · flywheel §6/18 · frame §14, Part IV
row 18 · catalogue `R6` `B1` `N4`.

## 19 · Identity & standing

**At full scale — what it IS.** Three things joined because they are all *the company's name as an asset*.
**What it has said**: `SAID.jsonl`, one row per published statement, generated from `EXPOSURES.yml` plus the
staged artifact bytes, so the corpus is a projection of the register rather than a second source of truth.
**What it may never say**: `NEVER-SAY.yml`, a refusal list — claims it cannot substantiate, comparisons it
will not make — checked before publication by a deterministic pattern check with the embarrassment linter's
posture: **named precisely as hygiene, never reported as taste**. Detecting that two ventures have contradicted
each other under one name is a judgement and stays a `[WISH]`. **Disclosure**: `made_by: machine | founder |
mixed` on every exposure row, the one part carrying a deadline rather than a trigger, because **it cannot be
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

**Year one — the slice.** **Disclosure only, and it carries a deadline rather than a trigger**: Part IV row 19
dates it to the first machine-published artifact. Everything else follows the first legal entity. *Proposed,
not decided*: `made_by:` as one column on the exposure row at §15 step 10, on exactly the argument that moved
`say:` and the task id from step 13 to step 3 — a row emitted without it can never be labelled, and backfilling
rewrites every emitter. One column now; every exposure before the change is permanently unlabelled. A founder's
call, recorded here as a proposal.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| The first machine-published artifact | `made_by:` is live, or the disclosure decision is permanently more expensive |
| The first legal entity exists | the entity file, the IP position, and the tier-F list that names them |
| The second venture publishes under the same name | `SAID.jsonl` and `NEVER-SAY.yml` |
| The first outbound hand with a sending domain | `STANDING.yml` for that account, with an instrument |
| An account's standing instrument returns `unresolved` twice | the hand is unavailable until it reads |

**Would have to be true.** (1) **Nothing under the company's name blows up.** One bad exposure destroys
reputational capital faster than three years of good ones build it, and the embarrassment linter catches
hygiene rather than judgement. Not recoverable by mechanism, not measurable in 30 days, and the assumption most
deserving a second pair of eyes before any tier-R hand. (2) Disclosure rules stay readable per medium.

**grafted_from.** picture §2/table row 19 · §6 row 13 · flywheel §6/17, §6/20 · founder §6/17 · machine §6.4 ·
frame §8, §9 (the residual eight), Part IV row 19 · catalogue `R5`.

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

**Year one — the slice.** **`not_before:` now, the rest with the second lane.** Founder's choice 8, accepted:
every staged act that would leave carries `not_before:` on its row, default `08:00` the next morning — one
field, landing in `tick.mjs` at §15 step 8, so the hour is a property of the row and not a policy someone
remembers. No `CALENDAR.yml`; priority is the leftmost open leaf of the single in-flight mission, and refusal 5
reopens it on *a second mission in flight*, which is exactly this territory's trigger.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| A second mission in flight (refusal 5's own reopen) | `CALENDAR.yml` and the cost-of-delay term in `next.mjs` |
| The first customer outside the founder's timezone | recipient-local windows on the queue row |
| The first dated external commitment — an embargo or a launch | `embargo:` as a warrant caveat, distinct from the morning default |
| The first night on an always-on host | the circadian split becomes real rather than incidental to when the lid is open |
| A mission is late because priority could not see a date | the finding is filed against the ranking function, not the worker |

**Would have to be true.** (1) A date term can be added without adding a field a model benefits from filling.
The calendar is founder-and-world-written, never worker-written, and that is the whole safeguard. **Measurable
in 30 days only as absence**: `next.mjs`'s determinism test exists at step 6 and must still pass when the term
lands. (2) The world's dates are knowable far enough ahead to rank against; if not, the calendar is a log.

**grafted_from.** picture §1 (the 08:04 decision) · §2/table row 20 · §7 row 8 · flywheel §6/19 · founder
§6/18 · machine §5.2, §6.2 · frame §1, §3, §16 refusal 5, Part IV row 20.

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
catastrophe, and **the shelf is the answer to both** — shelf work needs no decision, so it does not consume
the scarce resource.

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

**Year one — the slice.** **Nothing, and correctly.** Part II §13 refuses the explore reservation (`C33`) and
the boredom detector (`C23`) with a stated reopen: *the archive passes its falsifier*. Two seeds exist: cost
per surviving exposure prints `undefined` at a zero denominator, and `EXPOSURES.yml` distinguishes `no_data`
from `not_checked`. A machine keeping those honestly has the grammar for silence before it has the territory.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| The archive passes its falsifier — a founder promotion or a ship from a non-nominated cell | the explore reservation (`C33`) reopens |
| One approach appears in three missions' rows | the boredom detector (`C23`) reopens — the same thing produced repeatedly, not nothing produced |
| The first calendar month with zero exposures | the report must distinguish chosen from accidental, or the month is uninterpretable |
| The first standing warrant exists | a no-publish night becomes an authored refusal with a ledger row |
| Shelf artifacts exceed exposures by an order of magnitude | the two columns are load-bearing; a single total would have hidden it |

**Would have to be true.** (1) Shelf work earns its money — an artifact needing no decision still has value
later. If false the explore reservation is a subsidy. Not measurable in 30 days; the archive's own falsifier is
the first reading. (2) A quiet week is distinguishable from a stalled one by the clock brake rather than by
judgement — already true, because `stalled` is measured by a meter the worker cannot author.

**grafted_from.** picture §2/table row 21 · §5 wheel 4 · machine §5.6, §6.5 · frame §13 (`C33` and `C23`
refused with a reopen), §5 (the archive falsifier), Part IV row 21 · catalogue `C2` `C6` `C23` `C30` `C33`.

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
| `STOP` is checked before anything else, and an errored check refuses | `tick.mjs` step 2, pinned by `loop.test.mjs` `[year-one]` |
| The handover file cannot go stale | it is **generated**; a hand-written `HANDOVER.md` is refused by the rule that refuses a hand-edited archive `[full-scale]` |
| Durable knowledge stays transferable | the store map's own discipline — one writer, append-only, in git, no service `[year-one]` |
| A legal transfer of the company | **physics line** — tier F, a human hand, forever. `[WISH]` as anything automatable |
| The founder is not a single point of failure | `[WISH]` — already **accepted in writing** as one of the residual eight |

**Year one — the slice.** **A written acceptance with a review date** (Part IV row 22) — and the acceptance
already exists: *"the founder is a single point of failure"* is the eighth of the residual eight accepted in
writing in Part II §9. There is no handover file, no dead-man's switch and no second human; every human gate
carries `decided_by: founder`. What year one does build, without calling it succession, is the entire
precondition: eleven stores with one writer each, append-only, in git, none a service. A handover file is a
projection of that map, and a company whose state lives in a service cannot generate one.

**Growth path.**
| trigger (countable) | what lands |
|---|---|
| N consecutive days with every card fused | the dead-man's switch — the cheapest mechanism here, because the count is over a store that exists |
| The first standing warrant | `HANDOVER.md` becomes required: unattended authority the founder cannot explain is not transferable |
| Someone else holds a credential this system uses (§14's own reopen) | decision rights per decision *type*, exactly one accountable; `may_stop: true` |
| A month passes with no queue session opened | the acceptance's review arrives by count rather than by calendar |
| The first legal entity | the transfer question becomes real, and stays tier F |

**Would have to be true.** (1) The stores really are the company — durable knowledge is in files and not in the
founder's head. If false, `HANDOVER.md` is a table of contents for something that does not exist. **Partially
measurable in 30 days**: the field-note falsifier asks the same question at one remove. (2) A second human
could act on the handover without the first; there is no forward test short of trying it.

**grafted_from.** picture §2/table row 22 · founder §6/19 · flywheel §6/21 · frame §5 (the store map), §9, §14
(the second-human reopen), Part IV row 22 · catalogue `CY3` `S3` `RT3`.

# Part B · The cross-cutting maps

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

One writer each, append-only or rewritten whole, all in git, none a service. Year-one rows are the frame's §5
table; full-scale rows carry their territory number.

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
transcripts is refused as memory, because retrieval cannot tell a corrected belief from a current one.
**The reader column is the one to audit — a store nothing reads is a diary, not an asset.**

## Map 3 · The pack roster, and the pack schema in full

Fourteen to twenty-six packs (illustration) across **five families**, plus two special grants. **Zero new agent
files, ever.** A pack is `(tools × mcp × warrant kinds × done-tests × field)` — a grant and a stop.

| family | year one | what it makes |
|---|---|---|
| `web-feature` | **built** — the one pack of the first 30 days | pages, features, code behind a flag |
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

**Enforced by.** Every argv contains `--strict-mcp-config`; `tools ⊆ engine`; any denied name
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
carries the schema and one pack; **pack-field** trust reopens when a second pack ships (choice 1).*

## Map 4 · The hand admission test

**A hand is admitted by passing tests, not by someone judging it wise** — each test a property *of the hand*, checkable at load by something that is not a model.

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
tests 1, 3 and 4 and cannot apply 2 and 5**, there being no outbound hand to apply them to — and the day-4
grant census, `probe-grants.mjs` plus `claude mcp list → hands.json`, **is** admission test 4.

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

**The eight checks at exercise, in this order, any failure a refusal plus a morning row**: `STOP` absent · the
HMAC chain verifies · `not_before` passed and `expires` not · the artifact exists and its sha256 matches ·
`taint: clean` or a morning release · every recipient resolves in the register · the per-hand hour/day/night
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
its reversal count. **N is not set here.** It is the founder's number, and inventing one would put a figure
with no derivation into the single rule governing how large the unattended machine may become. What the spec
fixes is the **conjunction**: the world's verdict tests reach, the founder's own hand tests appetite, and the
match between nomination and choice tests taste — any one alone is defeatable by a machine optimising for it.
**Nothing that crosses the physics line earns a warrant at any count**: a signature, a legal statement, a
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
`balcony.mjs` with four verbs, and `monthly.mjs` on day 30. No `DAY.yml`, no warrant audit, no reckoning. What
a good year looks like is Stage 6's measurement, and it is not revenue up.

# Part C · THE BUILD PATH

**Stages, by trigger. No dates, anywhere.** A stage begins when its entry trigger fires, which is a countable
condition over a store and not a point in time. **The stages are ordered by dependency, not by calendar, and
two may be open at once** — a co-landing states its own trigger. Every "what reopens" names a refusal from
Part II §16 and uses that refusal's own reopen predicate, because one that reopens on a trigger someone
invented later is not a refusal.

## Stage 0 · The thirty days — Part II §15, unchanged

**Entry trigger.** None. This is where the company is.

**What lands.** The fourteen landings of Part II §15, **in the order given there, which is not re-ordered
here.** Three of them carry this group's territories and are the ones to watch: step 6 and step 8 land the
fuse (territory 17) · step 7 lands `warrant_kind:` and step 8 lands `not_before:` (territories 16 and 20) ·
step 14 lands **the owned address** (territory 15), intake for a real venture, mission 2 published by the
founder's hand, `claim-world`'s first `unresolved`, one `gemini -p` run, and `monthly.mjs`.

**What reopens.** Nothing. Every refusal of §16 stands.

**What must be measured before Stage 1.** Five readings — and if the month produces a working loop and none of
them, it produced a workshop: **one exposure went out · one outcome came back at a named rung · one preference
pair was written · one field note was read by something that did not write it · the founder's own hand on that
exposure was recorded as row one of the authority ledger.** Plus the two looking tests: the day-8 demand numbers
recorded **without chasing**, and `BRIEFING.md` opened twice unprompted more than 48 hours apart.

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
row with `clearable_by: founder` — Part II §2's own reopen predicate. **Which unbuilt pack comes second is set
by that row, not by a plan.**

**What lands.** The second pack, from the family the blocked row names · **pack-field trust**, computed at every
dispatch from the event log and never stored, so a hand-edited value is overwritten · the apprenticeship in
shadow — real moves, real artifacts, ships nothing, one move in five · the retirement counter, zero dispatches
in ninety days, archival with a resolvable stub and never deletion. **Co-landing on its own trigger** — *the
first venture has a rung ≥ 2 reading* — the second venture, `instead_of:` on every dispatch, and a declared
share of the window for venture zero with a floor and a ceiling, because the alternative is the harness taking
everything because it is nearest.

**What reopens.** Refusal 9's **pack-field** half, already narrowed by founder's choice 1. Refusal 13, the
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
merely refused · and `expose.mjs`'s authority columns become the audit's input rather than a record nobody joins.

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
the relay, which holds the socket, the mailbox, the drop directory and the feeds and does exactly one thing with
what arrives: it writes a leaf · `taint: foreign` stamped by the wrapper that fetched it and propagating into
the artifact, with the mouth refusing a tainted artifact absent a morning release · `people.yml` as mouth check
6, failing closed on an unparseable recipient.

**What reopens.** Refusal 3 is **not** reopened and does not need to be: its own text says a fetch enters only a
no-Write argv, and the relay is additive on top of that rather than a contradiction of it. Refusal 11, new MCP
servers, stays closed — its predicate is *a worker's JSON return cannot express a state change it needs
mid-move*, and the mouth is not a worker.

**What must be measured before Stage 5.** On the worst possible night, **the number the founder set is the
number the ledger sums to**; if those two disagree there is a second authority path. And the stated hole gets a
reading rather than a shrug: how many inbound paths exist that the wrapper does not mediate? Foreign content
arriving by an unmediated path is untainted and nothing notices, so **every path must be mediated or the
property is not a property.**

## Stage 5 · The night stops being a laptop habit

**Entry trigger.** **One measured overnight on the Mac, plus `pmset -g`.** Founder's choice 6 deferred the box
to exactly this condition, and no artifact of this company may use the phrase **24/7** until both are done.

**What lands.** One always-on host that is not the founder's laptop, one cloud twin, and the laptop as a client
— the same `tick.mjs`, the same plists, the same paths, so it is **a purchase rather than a redesign** ·
dual-layer supervision with the layers not supervising each other's failure, and a circuit breaker in the outer
daemon · `idempotent: true|false` on every move with **no default**, because a default is silently wrong for the
dangerous half, and a non-idempotent move takes a lease that survives its death and escalates rather than
auto-restarting · **the absent night reported as absent, never as quiet**: if both hosts die, the morning queue
says *"nothing ran: unreachable since 01:14."* **Co-landing on its own trigger** — *a second mission in flight*,
refusal 5's own reopen — `CALENDAR.yml` and the cost-of-delay term in `next.mjs`, plus `DAY.yml`.

**What reopens.** Refusal 5, the priority function, on a second mission in flight. Refusal 14's `KeepAlive`
clause **only if** the probe shows process startup dominating the cycle; the rest of refusal 14 never reopens.

**What must be measured before Stage 6.** That `next.mjs` is **still deterministic** with the date term in it:
same inputs, same leaf. And the interruption count per night, since the machine now has nights the founder is
not adjacent to — the picture's figure is 0.31 a night over ninety days (illustration), and the point is not the
number but that **when it rose, the answer was to change what the loop attempts overnight, never to weaken the
gate.**

## Stage 6 · The company earns the right not to be asked

**Entry trigger.** The **three-count conjunction** holds for one class of act: the founder has performed it by
hand N times through the queue **and** the machine's nomination matched on the last N occasions **and** the
exposures of that class resolved at rung ≥ 2 with zero incidents. **N is the founder's number and is not set in
this spec.**

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

**No stage reverses a refusal.** Part II §16 items 4, 8, 9, 10, 12 and 14 keep their own reopen predicates and
appear nowhere above, because a stage for a refused thing is a plan to reverse a decision nobody has revisited.
And two rules this spec asserts about itself: **nothing merges without a caller in the same diff**, because six
of ten things the founder asked for already existed connected to nothing; and **everything carries `retire_on`,
staggered at creation**, so a quiet month does not produce fifty simultaneous decisions.

## Claims this spec asserts

> The ids in this table were proposed by this design and never registered in the ledger; `proposed:` marks them so the ledger lint reads them as proposals, not as citations of claims that exist.

| id | assertion | kind | expires |
|---|---|---|---|
| `proposed:c-spec-c-reach-bounds-rung` | An exposure's reachable rung is bounded by the audience that can see it; publishing to nobody resolves `no_data`, which teaches nothing | `judge` | at the first exposure reaching rung ≥ 2 with a measured audience |
| `proposed:c-spec-c-authority-one-decider` | Authority is computed in exactly one place; `grep -rn 'reach' scripts/loop/ packs/` returns one decider | `command` | at the first `reach: outbound-write` pack |
| `proposed:c-spec-c-fuse-is-warrant-expiry` | The fuse and the warrant are one object; the queue row and the ledger read the same `expires` | `command` | at the first standing warrant |
| `proposed:c-spec-c-hand-cost-is-flat` | The cost of admitting the fiftieth hand equals the cost of the first, because all five admission tests are checked by non-model machinery | `judge` | at the tenth hand |
| `proposed:c-spec-c-good-year` | A good year is founder minutes per week falling while exposures at rung ≥ 2 rise | `command` | at the first full year of both series |
| `proposed:c-spec-c-process-count` | The full-scale process total is a function of fan-out and venture count, not a constant; the picture's "nineteen" is an illustration and its own block sums to twenty-one | `command` | never — it is arithmetic |

*The two `judge` rows will read `unresolved` until the panel has a second model family, because an empty panel
resolves `unresolved` forever and no non-Anthropic model is reachable from inside Claude Code. Honest, not an
oversight.*
