# THE PICTURE — the company fully grown, merged from three visions

```
written: 2026-09-02 · synthesizer, fresh context · contract: vision/r3-contract.md
inputs: 2026-09-02-flywheel.md · 2026-09-02-founder.md · 2026-09-02-machine.md
        2026-09-02-ceo-position.md (sealed before any vision returned — one input of four, not a verdict)
        STARTUP-OS.md Part II, read only at §3, as the contract requires
status: a vision, not a plan. Nothing here is decided and nothing authorises work.
```

**Provenance is on every paragraph:** `(flywheel)` `(founder)` `(machine)` `(ceo)` or `NEW`. Where two or
three agreed, the tag names all of them. Where they differed I decided, said why, and carried the losing
image as a named alternative — no averaging.

**Weighting, disclosed.** The flywheel vision read the year-one frame's §0–§6 before locking its picture and
said so. Where flywheel and the frame coincide, that coincidence is anchoring and is discounted here. The
founder and machine visions were sealed, so their agreements with the frame carry full weight.

---

# 1 · THE PICTURE

## The one sentence

**The company is an exposure engine with one register at its centre and one mouth at its door; the founder is
the mouth on day one, and every hand the mouth takes over later was earned by a count the founder can read.**
`(flywheel: the register · machine: the mouth and the ring model · ceo: hands earned by the record · founder:
the register belongs at the centre, conceded on reading the frame)`

Three visions named three centres — the exposure register, the founder's attention, and authority. They are
not three centres. **The register is the centre; attention and authority are the two budgets metered against
it.** The founder vision itself conceded the ordering after reading the frame: *"`EXPOSURES.yml` belongs at
the centre, not at store five of seven — the outcome signal is the prerequisite for trust, allocation and the
intervention metric."* The machine vision reached the same place from the other end: *"`EXPOSURES.yml` is not
primarily a world-verdict register — it is the first rows of the authority ledger."* `(founder, machine, ceo)`

## 03:14, a Tuesday in September 2028

The flat is dark. The founder's laptop has been shut since 23:40 and the company is not on it. `(machine,
founder, flywheel — all three leave the laptop)` The company runs on one always-on host in a cupboard and a
cloud twin that has come up four times this year. The laptop is a client. `(machine)` **No artifact of this
company uses the phrase 24/7 until `pmset -g` and one measured overnight say it may** — the frame's discipline,
adopted verbatim, and the machine vision said it should have applied it to itself. `(ceo, machine, frame §11)`

Nineteen processes. Twelve hold a model. **One can touch the outside world and it is not one of the twelve.**
`(machine)`

```
sentinel      launchd KeepAlive → supervise            (never supervises the tick; the tick exits)
minter        node bin/minter.mjs --policy warrants.yml --ledger WARRANTS.jsonl
bailiff       node bin/bailiff.mjs --rates rates.yml --rope rope.yml --stop STOP
mouth         node bin/mouth.mjs --queue outbound.q --register humans.yml     [NO MODEL]
relay         node bin/inbound.mjs  --ws … --watch drop/ --feeds feeds.yml    [NO MODEL]
tick ×4       node scripts/loop/tick.mjs --lane {pinefall,corvid,bramble,probe}
claude -p     --allowedTools "Read,Write,Edit,Bash,Glob,Grep" --add-dir wt/…   ×8  makers
claude -p     --allowedTools "Read,Grep"                                       ×2  judges
gemini        --model … --prompt-file panel-4471.md                            ×1  judge, 2nd family
claude -p     --allowedTools "Read,WebFetch,mcp__posthog__query,mcp__stripe_ro__*"  ×1  reader
```

Read the argv column, not the names. **A `claude -p` process cannot call a tool absent from its argv**, so the
eight makers cannot fetch, cannot send, cannot spend and cannot reach an MCP server — not because a prompt
asks them not to, but because the strings are not there. This is the only safety claim in the document that is
physics rather than policy, and half of it is already measured: `--disallowedTools` produced
`BASH_UNAVAILABLE` on 2026-09-02, and `--strict-mcp-config` made user-scope servers *absent* rather than
denied. `(machine §5.1, flywheel §2/02, frame §0 — three-way agreement, and the frame states it best)`

The `mouth` is 340 lines of Node holding every outbound credential, single-threaded, **with no model in it at
all**. It reads a queue, verifies an HMAC chain, compares a sha256, counts against a ceiling, and either
executes one action or refuses. There is nothing in it to persuade. `(machine — the strongest single idea in
the three visions, and adopted whole)`

Tonight the mouth has executed twice: a DNS record renewed at 01:12 and a preview deploy at 02:58. Both are on
the standing-warrant list, both reversible, both counted. **The other nine actions in the queue carry
`not_before: 08:00` and cannot fire while the founder is asleep.** `(machine)`

> **DECIDED, against flywheel.** The flywheel picture publishes to an owned channel at 03:22 under a rate
> rail. The machine picture stages everything behind `not_before` and publishes at 08:04. **The machine wins.**
> Publishing at 08:04 instead of 03:22 costs five hours and zero throughput, and buys the property that a
> mistake made at 04:00 has four hours to compound while one made at 08:04 has none. The rail is kept — it is
> what bounds the act once it fires — but the hour is a caveat on the token, not a policy someone remembers.
> **Named alternative:** flywheel's night-publishing, which becomes correct if the morning queue is ever
> measured as the binding constraint on exposure count rather than on decision count. `(machine over flywheel)`

At 03:41 a maker reaches a `blocking-human` gate: a copy change on a live pricing page, `reach:
outbound-public`, `reversible: partial`. The gate has no `run:` key and writing one is refused at schema time,
so nothing in the system can clear it — not a mode, not a flag, not a chain of reasoning. The machine mints a
warrant scoped to that file, that sha256, `not_before: 08:00`, `expires: 20:00`; writes a queue row with an
eleven-word `say:` line; and moves the mission to `blocked`, which frees the slot so another lane starts at
03:43. **The founder's phone stays silent, and overnight interruptions are a measured number on the balcony —
0.31 a night over ninety days.** When it rose to 1.4 in March the answer was to change what the loop attempts
overnight, never to weaken the gate. `(machine)`

## 07:52 — the morning

One screen, and it is a queue of decisions, not a dashboard of activity. `(machine, founder, flywheel — all
three)`

```
RELEASES · 6                        night of 11→12 Sep · $41.20 · 0 interruptions · rope 41%

 1 Pinefall  returning-user surface — two finalists, pick one       [A] [B] [neither]
 2 Corvid    essay "The cost of being early" — ready to publish     [go] [hold] [edit]   fuses 18:00 → hold
 3 Pinefall  pricing page copy: 3 words                             [go] [no]            fuses 20:00 → no
 4 Sable     wind-down: 4 open claims to deprecate in bulk          [do it] [read first]
 5 —         two negative claims failed to reproduce. World moved.  [read]
 6 Lantern   invoice #0091 drafted, £4,800, unsent                  [send] [edit] [hold]  NEVER fuses

BLOCKED · 2   m-8841 waits on you (row 1) · m-8756 waits on Stripe support, expires in 3d
SHELF  · +14  archive gained 14 cells overnight; 3 recombinations queued
ASKS   · 1    "Two variants say 'built for teams'. TASTE.md says no corporate register. Violation?"
NEXT   · m-8802 Corvid weekly, instead of m-8814 Pinefall onboarding email   (why: ⏎)
```

Twelve minutes, five taps and one read. Row 1 is a pair rather than a report, because a pair is a two-second
decision and a report is a five-minute one, and **every pair the founder answers is a labelled preference
example at zero marginal cost.** `(machine, founder, flywheel, ceo — unanimous, and the highest-yield act in
the company)` `promote` is built to be cheaper than `approve`: approving gates one artifact and teaches
nothing; choosing between three writes a reusable calibration example. `(flywheel)`

**Every row carries a fuse: a deadline and a stated default that fires if the founder does not answer, and the
default is always the reversible branch.** Silence is recorded as a decision with the reason `fused`, never as
an unread item. Rows 2 and 3 fuse; rows 1, 4 and 6 cannot, because irreversible, financial and first-contact
classes are structurally incapable of fusing. `(founder — the single most valuable mechanism in the three
visions, and the only direct answer to the frame's own named weakest point)`

`NEW` — **the fuse and the warrant are one object seen from two sides.** A warrant that expires unexercised
*is* the fused default; the queue row and the authority ledger read the same expiry. Justified in one line:
one expiry mechanism means the surface and the authority layer can never disagree about what the founder's
silence meant.

The `ASKS` row is the machine's one question a day, and **it is required to spend it.** A machine that never
asks is a machine that guesses, and guessing is invisible until an artifact is wrong for a reason nobody can
name. The answer becomes a rule with an expiry, shown back in a quarter. `(founder)`

> **DECIDED, against founder.** The founder vision gives the day five appointments — Table 07:10, Deck 07:35,
> ask 14:00, world 16:00, Night Order 17:30. **Collapsed to one daily appointment and one weekly reckoning.**
> The reason is the founder vision's own first assumption: the measured base rate of this founder looking is
> zero, and five appointments are five chances to fail rather than five chances to succeed. The question, the
> world's readings and the night's intent all survive — as rows in the one queue, not as calendar entries.
> **Named alternative:** the five-window day, which becomes right the moment the balcony's own done-test
> passes twice over. `(NEW decision; founder's mechanisms kept, founder's schedule refused)`

The founder's day also holds one thing the machine may not touch: **a protected making block, three and a half
hours, interruptions zero, exceptions enumerated as a closed set in `DAY.yml`.** In a company where a machine
does the producing, the founder is the only remaining source of taste, and taste exercised only as judgement
degrades into preference. `(founder; flywheel reaches the same conclusion by a different route — "a founder
who never makes anything loses the ability to judge what is being made for them")`

## The week, the month

Friday, forty minutes, the only recurring meeting the company has, and **the two most consequential minutes of
it are the warrant audit**: every standing warrant, its exercise count, its refusal count, its reversal count,
and any the record now justifies widening or narrowing. This is where the machine's size is actually set.
`(machine)` Beside it: the intervention metric with both components visible so a fall caused by fewer
surviving artifacts cannot read as a win `(founder, machine, flywheel)`; the retirement queue, zero calls in
ninety days, computed rather than proposed `(all three)`; the waiver count, because three waivers on one block
is a decision being avoided `(founder)`; and the unspent question budget, reported as a finding about the
machine `(founder)`.

Monthly, four pages: money · the retirement queue · **every standing refusal with the command that reads its
reopen trigger** · the flywheel page. The third of those is what makes this whole document survivable: a
refusal with a countable trigger and a monthly reader is a decision that expires on schedule, and a refusal
without one is a permanent opinion in a mechanism's clothes. `(flywheel, machine — and the machine vision
recorded that the frame's version of this is better than its own and adopted it unchanged)`

## What it makes, and what it costs

Four live ventures, one in intake, and a graveyard. `(all three converge on four)` One flagship carrying the
revenue, one media property that *is* the distribution, one experiment run falsifier-first, one services line
for cashflow. Venture zero is the harness itself and it gets a declared share of the window with a floor and a
ceiling like any other — because the alternative, the harness taking everything because it is nearest, is the
exact failure of 2026, when 171 session files were about the harness and none about a customer. `(machine)`

| | per night | per week |
|---|---|---|
| candidate artifacts | ~240 | |
| releases the founder actions | 6 | ~40 |
| exposures that leave the building | 4–7 | ~41 |
| spend | ~$60 | |

Machine cost ~$3,100/month, roughly 4% of revenue — **which is the wrong number to look at. The real budget is
the founder's twelve minutes, and the honest accounting is decisions spent per pound earned.** `(machine)`

> **DECIDED, against flywheel, on the revenue figure only.** Flywheel's picture is $2.58M across four ventures
> in 2028; the machine's is one venture crossing $35k MRR with two between $2k and $6k. **The machine's shape
> is taken**, because it is the sealed one and because no vision offered a derivation for revenue while the
> machine offered one for everything downstream of the morning. Flywheel's number is the **named alternative**
> and what would have to be true for it is precise: owned reach compounding to the ~338,000 people its own
> flywheel page assumes. `(machine over flywheel; flywheel's own §"where this vision is weakest" concedes its
> numbers are illustrative)`

**A good year is not revenue up.** It is founder minutes per week falling while exposures at rung ≥ 2 rise.
Those two moving in opposite directions is the only definition of "the founder stopped being the bottleneck"
that cannot be faked by working harder. Revenue up, exposures up, founder minutes up is a services business
with extra steps and it does not compound. `(flywheel)`

## How the machine gets bigger

Three levers, ascending in cost. **Make each decision cheaper** — pairs instead of prose, `say:` lines instead
of rows; ceiling about 3×, a surface-design problem. **Remove whole classes of decision** — a class the
founder has answered the same way forty times becomes a standing warrant, once, in daylight; the only lever
that raises the ceiling permanently. **A second human** — linear, expensive, and the only one that adds
judgement rather than removing the need for it. `(machine §5.3)`

**The gate on lever two is the most consequential rule in this document, and it is a conjunction of three
tests, not one.** `NEW` — justified in one line: the world's verdict tests reach, the founder's own hand tests
appetite, and the match between the machine's nomination and the founder's choice tests taste, and any one of
the three alone is defeatable by a machine optimising for it.

> A class of act earns a standing warrant when **(a)** the founder has performed that act by hand N times
> through the queue, **(b)** the machine's nominated action matched the founder's choice on the last N
> occasions, and **(c)** the exposures of that class resolved at rung ≥ 2 with zero incidents. Then the
> warrant is minted by code, hash-bound, rate-ceilinged, `not_before`-caveated, and audited weekly with its
> reversal count. Nothing that crosses the physics line ever earns one, at any count.

`(ceo supplies (a) and (b) · flywheel supplies (c) · machine supplies the token · founder supplies the classes
that may never fuse)`. **Losing images, named:** flywheel's world-verdict-alone, which does not test taste and
would promote a pack the founder quietly reworks every time; and the founder vision's `blocking-human` on all
public reach forever, which is right about the classes above and wrong as a universal, because it fixes the
company's ceiling at the founder's morning permanently.

## The physics line

Not a trust level — **a permanent reserve.** A signature, a legal statement, a purchase of a durable asset, a
letter in the post, first contact with a human not on the register. A pack with a thousand clean exposures
still may not sign a contract, and no count is the count. `(flywheel's tier F · founder's `blocking-human` by
type · machine's "not a hand" · ceo — four-way agreement, stated four ways)`

---

# 2 · THE FOURTEEN, GROWN

## 01 · Missions & drive

A forest, not a tree: one `MISSIONS.yml` per venture, each an uncapped goal tree, one mission in flight per
lane. `(all three)` `next.mjs` stays pure and prints its arithmetic; at four lanes its input is four leaf
lists and it ranks on cost of delay against a calendar, because at this scale the world has dates the company
does not control. `(flywheel, founder — machine keeps the pure function and adds the portfolio allocator
above it, which is the same shape)` Intent is task · purpose · end state · constraints, and the schema refuses
`steps:`, `how:`, `method:`, `implementation:` — the predicate already exists for playbook stages. `(founder,
machine)` `falsifier:` is required and cheap-first; `none` is allowed, counted, reported. `(all three)`
`evidence_of_demand` is the one field a model may not assert: it resolves through `claim-source` and needs a
URL and a quote, because it is the field the system benefits from inflating. `(founder, machine)` States:
`blocked` is authored with a `clearable_by:`, `stalled` is computed by a meter the worker cannot author,
`stuck` is derived from distinct approach hashes, and **`railed`** is added — the move is fine, the actor is
fine, the day's rate is spent; it frees the slot like `blocked` and clears on a clock rather than on a person.
`(flywheel)` Every dispatch records `instead_of:`, free when priority is computed, which makes what the
company systematically never gets to visible after six months instead of invisible forever. `(founder,
machine)` **Missions can be woken by the world** — an inbound reply, a failed payment, a funnel spike, a
competitor's changelog creates a leaf with a deadline. `(flywheel, machine)`

## 02 · Workers & roster

Fourteen to twenty-six **packs** across five families, plus `orient` (read-only, the field learner) and
`sweep` (the outcome resolver). **Zero new agent files, ever.** A pack is `(tools × mcp × warrant kinds ×
done-tests × field)` — a grant and a stop, never a procedure. `(all three, unanimously)` **Trust is computed,
never declared, and the key is `(pack × field)`, not the worker**: a pack excellent at short-form video has no
standing on regulated claims, and an unknown pair fails closed to supervised. Recomputed at every dispatch
from the event log, so a hand-edited value is overwritten. `(all three, and all three independently argue the
frame is wrong here — see §3 row 02)` Promotion needs N consecutive moves whose artifacts survived the
world's verdict; demotion is the same counter running backwards on an incident, no restore and no appeal that
skips the count. `(founder, machine)` A new pack serves an apprenticeship in shadow: real moves, real
artifacts, ships nothing, one move in five, graduates on a record. `(flywheel, founder)` Retirement fires on
zero dispatches in ninety days, computed at the chokepoint, and is archival with a resolvable stub, never
deletion; above the declared ceiling a new pack requires a retired one. `(all three)` Personas exist
separately, argue, and are structurally forbidden from producing or holding a warrant. `(founder, machine)`

## 03 · Hands

**Four tiers, decided by which process holds the hand.** `(flywheel's four-tier scheme, with machine's mouth
occupying tier R)`

| tier | who holds it | examples |
|---|---|---|
| **H** harness, outside the sandbox | `tick.mjs` and its scripts | `git` `gh` `ffmpeg` `sips` `say` `gemini` `codex`, worktrees, archive and field writes |
| **W** the pack's argv | a `claude -p` child | Read/Write/Edit/Glob/Grep/Bash where granted; `playwright`; nothing outbound |
| **R** the mouth | one process, no model | publish · spend · send · deploy — each against a warrant, each counted |
| **F** the founder | a human hand | the physics line, forever |

Roughly fifty hands at full scale, each a file. **Every hand is admitted by a five-part test, not by someone
judging it wise** — declares `reversible:` and `blast_radius:` or does not load · has a dry branch where the
default call produces an artifact and the effecting call takes a hash · has a credential narrower than the
hand (vendor read-only endpoints, restricted keys, fine-grained PATs — half the narrowing is already published
and free) · has a probe a dispatched worker can actually make, because **unprobed is unavailable** · has a
counter and a ceiling. Pass 1–5 → a night hand. Pass 1–4 → a day hand, `not_before` in the morning. Fewer →
not a hand; it is a morning row and a human does it. `(machine §5.5, adopted whole)` **Why this matters more
than the list:** every one of the five is checked by a loader, a wrapper, a counter, a probe or a schema, so
**the cost of admitting the fiftieth hand equals the cost of the first**, which is the only thing that makes a
fifty-hand roster governable. `(machine)` The honest hole, stated: the five tests bound *authority*, not
*correctness*. A hand that passes all five can send a perfectly authorised, catastrophically wrong email.
`(machine)` A daily `claude mcp list` plus one probe call per grant plus credential expiry is the capability
oracle the 2026 system never had. `(founder, machine)`

## 04 · Knowledge

Skills are **injected, never discovered**: the router index plus the pack's one namespace under a byte cap
that only ratchets down, and the harness meters what was actually read, so a skill nobody reads leaves on the
same schedule as a pack nobody dispatches. `(all three)` `~/.agentvibe/fields/` holds ~180 field notes by
2028 — how cold email works, how a thumbnail works, how trial-to-paid moves, how VAT works in three
jurisdictions. **Global by design**, because *how a field works* is the same for every venture and *what this
venture sounds like* never is. `(all three; Decision 9)` A note is **three annotated exemplars — good, bad,
near-miss — each sourced, with rules subordinate to them**, and every fact a claim with an expiry, so a note
about a platform's algorithm rots on schedule rather than becoming folklore. `(all three)` Learning a new
field is a bounded protocol with a checkable exit — practitioners named, canonical artifacts sourced, rules
extracted, one proposed done-test — and then it **stops**. `(founder, machine)` `ORIENT` is computed by the
harness and prepended: matching dead-ends as actual entries, attempts already made, archive cells occupied,
the field's exemplars, one thinking model's stop rule. **The harness does the retrieval, so a worker cannot
skip it.** `(all three, and it is the property that makes the graveyard load-bearing)` The maker's prompt
carries no rubric, no scoring axis and no reference URL — divergence and convergence separated in capability,
not merely in instruction. `(flywheel, founder)` **The founder never reads the Book. If they have to, the
knowledge layer has failed.** `(founder)`

## 05 · Memory

Ten stores, each with exactly one writer, each append-only or rewritten whole, all in git, none a service.
`(all three)` The four physics that decide routing: `events.jsonl` holds *what happened* and never expires and
is never evidence for a belief without a claim · the ledger holds *what is true* and expires and forces a
disposition · the fields hold *how a field works* · the taste stores hold *what this venture is*. `(founder)`
Added at full scale: `AUDIENCE.yml` per venture (channel, owned or rented, size, measured at a date)
`(flywheel)`, `people.yml` the named-human register `(all three)`, `WARRANTS.jsonl` append-only with one row
per issue, exercise and refusal `(machine)`, and the attention record `(founder)`. Conflict resolves
newer-wins **with the older retained in place carrying the evidence that moved it** — the practice this repo
already follows by hand in every supersession block, made a data operation. `(founder)` Forgetting is a
program with four rules and a stub under every original heading, never a judgement call, and **nothing is
deleted to meet a cap**. `(all three)` Retrieval is by construction plus `Grep`; still no vector store. By
2028 there is one rebuildable index over the append-only files because prefix sums over four years stopped
being instant — an index, never a second source of truth. `(flywheel)` **RAG over transcripts is refused as
memory**: transcripts are full of confidently-stated superseded beliefs and retrieval cannot tell a corrected
belief from a current one. They are instrumentation. `(founder, machine)`

## 06 · Communication

**Star, and it is physics: a `claude -p` child has no address.** Eight makers at 03:14 are eight islands and
the conductor alone reads all eight — not a limitation, it is what makes their variants actually different.
No worker messages a worker at any scale. `(all three; the founder vision explicitly adopted the frame's
physics framing over its own withheld-messaging-hand version, because a grant can be widened by an oversight
and an address that does not exist cannot)` The baton is SBAR with a per-section byte cap, read back in the
receiver's own words on first return, with large divergence raised as a **finding rather than a block** —
the receiver may be right and the baton wrong. `(founder, machine)` Help is the return's required `tried:`
list, which doubles as the raw material for a dead-end, so negative knowledge is a by-product of asking rather
than a separate act nobody performs. `(all three)` **One edge is added at full scale: inbound.** A relay holds
the socket, the mailbox, a watched drop directory and the feeds, and does exactly one thing with what arrives
— it writes a leaf. `(flywheel, machine)` **A received body never enters a producing context.** It enters an
argv with no Write, no Edit, no Bash and no outbound grant; the artifact it produces carries `taint: foreign`
stamped by the wrapper that fetched it; and the mouth refuses a tainted artifact without a morning release.
`(ceo and flywheel supply the argv control — "this is physics, not policy" · machine supplies the taint stamp
as the audit trail that survives into the artifact · both legs, and they are not redundant)` The stated hole:
foreign content arriving by a path the wrapper does not mediate is untainted and nothing notices. `(machine)`

## 07 · Context & cost

**Every row carries a real task id and a `say:` line, minted at dispatch, from the first commit.** `(all
three; `say:` is founder's and machine's)` Both are unretrofittable for the same reason: the balcony, the
briefing, the queue, the register, the attention meter and `explain.mjs` are six projections of one log, and
without the id they are six logs that disagree, discovered during an incident. `(founder, machine)` Cost per
mission is a prefix sum; cost per venture, field and pack are the same sum grouped differently. `(flywheel)`
The prompt is assembled in cache order — stable prefix first, varying suffix last — and the cache-read ratio
is a **measured** number, because a saving nobody measures is a saving nobody has. `(all three)` Every
injected surface has a byte cap that only ratchets **down**; exceeding it never raises the cap, it forces a
two-tier split into ids plus summaries with content on demand. Twice proven here already: skills discovery
15,000 → 1,070 tokens, `session-start.js` 27,069 → 2,941 bytes, at which point the content reached agent
context for the first time. `(founder, machine)` Compaction is designed out: the process exits, and a move
that would need it is recorded `truncated`, which is never `done`. `(all three, and the machine vision judged
the frame's answer here better than its own)` Overnight work goes through the Batch API at half price where
reachable — flagged unverified, because the frame states Batch is not on the CLI; if unreachable it moves the
model line by ~$700/month and changes nothing else. `(machine §8.8)`

## 08 · Quality & truth

**A deterministic oracle runs first, per artifact type, before any model is asked anything** — code is the
check suite, a page is a screenshot at two viewports plus link resolution plus zero console errors, an image
is its pixel dimensions, a video is `ffprobe` streams and duration, copy is non-empty with resolving links.
Then the embarrassment linter over the artifact: placeholders, TODOs, `#` hrefs, unreplaced template
variables, alt text equal to the filename, off-palette colour. **Named precisely as hygiene, never reported as
taste** — and it converts "no placeholder UI" from a wish into a mechanism. `(all three)` **The evidence
ladder is the spine**, declared per medium: rung 0 *it renders* · 1 *a stranger understands it in five
seconds* · 2 *someone clicked* · 3 *someone came back* · 4 *someone paid*. A claim's assertion string is
generated from its rung, so a rung-0 result is structurally incapable of being phrased as a rung-2 one, and
most work sits at 0–1 for a long time and the ladder reads as an indictment, which is the correct reading.
`(all three)` **No judge, of any family, ever resolves a done-test.** `(all three, and ceo)` Panels return
**findings, never scores**; there is no `total` field anywhere and a check refuses one. Judges compare blind,
identity stripped, order randomised, swapped twin run, and **a pair that flips resolves `unresolved`, never to
a winner**. `(founder, machine)` Selection is arithmetic over findings: eliminate any candidate with a P1,
prefer fewest distinct P2s, tie-break on archive distance. `(all three)` **The panel holds ≥2 model families
and the second seat may be empty; empty resolves `unresolved`, never `pass`.** `(ceo, founder — machine's
three-families-every-night is the named alternative and costs more than it is measured to buy)` Taste enters
twice and never as a score: the taste file before MAKE, the founder's tap after. `(all three)`

## 09 · Control & safety

**Three rings distinguished by credential, never by prompt**: ring 0 makers hold no network, no credential in
env, no MCP, and can lose only their own worktree; ring 1 readers hold credentials that are read-only *by the
vendor's construction*; ring 2 is the mouth, exactly one process. `(machine)` **Risk has three axes on one
classifier — never a second implementation, because this repo has already paid to learn what two deciders
cost**: `path` (what it touches), `reach` (`local · outbound-read · outbound-write · spends · speaks-as`), and
**`rate`** (how much, how often, in what window). Effective tier is the max. `(all three; the rate axis is
flywheel's and the machine vision independently named it the axis the 2026 tier scheme lacked)` **Authority is
a warrant**: attenuable, expiring, hash-bound to the artifact's bytes, carrying `not_before`, minted by code
with no natural-language surface in the issuing path, delegated by appending caveats down an HMAC chain so a
sub-worker holds strictly less than its parent, and logged on issue, exercise and refusal. `(machine §5.2)`
That last property is what makes delegation safe with nothing awake to ask: at 3am there is no central
authority to consult and none is needed. Anything with `blast_radius: stranger|public` or `reversible: no`
is `blocking-human` **by type, not by policy**, and a `kind: human` gate carrying a `run:` is refused at
schema time, so no mode, flag or reasoning chain can clear it. `(founder, machine)` Three kill switches, none
in a prompt: unload the agent · `touch STOP`, a file, checked first at every dispatch, reachable from a phone,
and **if the check errors, refuse** · `stop:` halting at the next durable artifact rather than the next token.
`(all three)` **Maximum damage on the worst possible night is a number the founder sets and the balcony
prints**: *"tonight the machine may spend $180, publish to 2 accounts, email 9 named humans and deploy 4
previews."* You do not make that sentence safer by arguing; you edit a file in daylight. `(machine)`

## 10 · Surfaces

One queue, not seven views, with three renderers over one event log — founder, operator, auditor — and a test
that all three render from the same query. `(founder, machine)` Rows are goal-sized, one line each, every one
carrying `say:` — ≤ 15 words, no paths, no hashes — **written at emission by the thing that knew what
happened**, so voice reads a field rather than summarising a record and there is no model between what
happened and what the founder hears. `(founder, machine)` The briefing has four sections always in one order
— *what changed · what is blocked · what needs you · what I would do next* — money first, each may be
"nothing", and **"nothing" is spoken, because silence is indistinguishable from failure.** `(all three)` Four
verbs with deliberately unequal yields: **promote** writes a preference pair and is the highest · **annotate**
writes a line of taste · **approve** gates one artifact and teaches nothing · **redirect** is a symptom, and a
high redirect rate is a brief defect rather than a worker defect. So the surface **shows the round, not the
pick**: the nominated cell plus up to three others ordered by archive distance, each with a ≤ 60-word pitch.
`(flywheel, founder, machine)` **Every card carries reversibility on its first line, before the
recommendation**, both cases argued by workers with no sight of each other, a "what would change my mind" line
that is arithmetic where priority is computed, a cost of waiting, and a fuse. `(founder)` Explanation is a
**replay, not a generation**: given a task id, reconstruct the chain from rows and invent no connective
tissue; **an explanation with a hole says so** and prints `[no record]`. Early on most explanations are mostly
holes, which is the surface reporting honestly that the instrumentation is thin. `(all three)` The balcony has
its own done-test: opened twice unprompted, more than 48 hours apart. `(all three, from the frame)`

## 11 · Runtime

One always-on host that is not the founder's laptop, one cloud twin, and the laptop is a client. `(all three
— the one place all three depart from Decision 4, and all three say so plainly)` `launchd` `KeepAlive`
supervises the long-lived mouth, minter and bailiff; **the tick is never kept alive, because a body that exits
has nothing to keep alive and a line-1 crash under `KeepAlive` relaunches forever.** `(all three; the frame's
reasoning, adopted)` Dual-layer supervision with the layers not supervising each other's failure, and **the
outer daemon has the circuit breaker the reference implementation everyone copies does not have.** `(founder,
machine)` Every move declares `idempotent: true|false` with **no default**, because a default is silently
wrong for the dangerous half; a non-idempotent move takes a lease that survives its death and is never
auto-restarted, it escalates. `(founder, machine)` Crash-only: read state from disk, take one move, write,
exit; recovery is the next tick. That design is portable off the laptop unchanged, which is exactly what makes
the move a purchase rather than a redesign. `(flywheel, machine)` Models pinned by id and chosen by job —
Haiku for probes, oracles and triage; Sonnet for MAKE; Opus for a genuinely novel field and synthesis; a
second family for judge seats and nothing else — **and the model is recorded on the row, because a done-test
passed on a cheaper model is a different fact.** `(all three)` **An absent night is reported as absent, never
as quiet**: if both hosts die the morning queue says *"nothing ran: unreachable since 01:14."* `(machine —
Rule 10 applied to the loop itself)`

## 12 · Self-improvement

`monthly.mjs` is the only self-improvement mechanism and it is **a report, not a loop**, because every studied
system's self-improvement loop was prose that nothing checked ran. `(flywheel, and all three converge)` It
prints last-use per governed artifact with a computed retirement queue · founder interventions per surviving
exposure paired with the engagement count · archive coverage and promotion rate · corrections mined from
transcripts **by regex, not by a model**, since a mechanical detector cannot decide something was unimportant
`(founder, machine)` · and **every standing refusal with the command that reads its reopen trigger.** `(all
three)` **Nothing merges without a caller in the same diff** — not a plan to wire it, the wire — because six
of ten things the founder asked for already existed connected to nothing, and every existing cure is a
detector that runs after the fact. `(founder, machine)` Everything carries `retire_on`, staggered at creation
so a quiet month does not produce fifty simultaneous decisions. `(machine)` Post-mortems end in a row with a
**Mechanism** column, tags from a closed enum, `none` permitted and **counted**, so a class with three
`none`s escalates by the count rather than by memory. `(all three)` Patterns promote at three independent
sightings to *candidacy*, never to an automatic write. `(founder)` A/B on the company's own prompts stays
refused at this volume: an underpowered comparison read as a result is worse than no comparison. `(flywheel,
founder)`

## 13 · Economics

Three files: the rope holds the token window, the rails hold the money, the limits hold the clock. **The
binding constraint changes over three years and naming the change is the point** — in year one it is a rolling
token window shared with the founder, so the mechanism is a reserved fraction; by 2028 it is dollars, so the
mechanism is a table of rates. A design that hard-codes the window as *the* constraint gets rebuilt on the day
billing changes. `(flywheel)` The rope never competes with the founder for their own quota, and at the ceiling
a safelist still permits **landing** work — commit, push, check, PR, ledger — because only *starting* new work
is blocked. `(founder, machine)` A hard cost ceiling **downgrades the model rather than stopping the work**,
failing closed when a model has no catalogue price rather than scoring the spend at zero. `(founder, machine)`
Rates are per (venture × hand × day), read at argv compile time, and **the compiler refuses when the meter is
unreadable** — Rule 10 applied to money. `(flywheel, machine)` `PL.md` per venture, monthly, machine
generated, with **revenue read from Stripe as a claim, never typed by a human**, because rung 4 is the
strongest evidence the company will ever have and a rung-4 reading with human provenance is not one; an
unreachable instrument reads `unresolved` and `unresolved` months are counted. `(flywheel)` Two numbers drive
allocation and neither can be gamed by working harder: **cost per surviving exposure**, printed `undefined` at
a zero denominator and never a flattering low number, and **cost to falsify** — the price of the company's
option on being right. `(all three; the `undefined` rule is unanimous)` 10% of the window is reserved for work
with no requested outcome, spent or lost, never banked, never asked to pay off. `(founder)` **Money in is a
gap in this territory and is named as one:** nothing in the fourteen covers pricing, offers, billing, dunning,
churn or cohorts, which is to say nothing covers the only rung-4 signal the company has. `(flywheel)`

## 14 · The company itself

**Intake produces exactly three artifacts and stops**: a taste file, one mission with a falsifier, one
approved done-test at a declared rung. No move dispatches against a venture missing any of the three, which
forces the founder's one unavoidable contribution to happen at the only moment it is cheap. One sitting, about
forty minutes, machine-drafted and founder-edited; at nine intakes a year that is under six hours annually for
the entire top of the funnel. `(all three, unanimously)` **Wind-down is a harvest, not a cleanup**: stop
dispatch · resolve every open claim to a disposition, bulk `deprecate` with one shared reason allowed and
honest · write one dead-end for the venture as a whole · archive with a stub. **Field notes and archive cells
survive the venture and stay global**, which is the strongest argument for Decision 9's split: a dead venture
still pays. `(all three)` Twenty-three wound-down ventures at a median of ~$2,400 is $55,000 spent on being
wrong, and it is the best money the company spent — it bought twenty-three markets' worth of evidence and a
functioning appetite for killing things. What makes it an asset rather than a loss is that the harvest is
**compulsory**. `(flywheel)` A second human is a role with declared decision rights per decision *type*,
exactly one accountable, and a human gate names **which** human. For one founder that field is ceremony, and
its value is making the exception visible on the day it arrives. `(all three)`

## …and the eight territories the fourteen do not contain

| # | territory | what it holds | from |
|---|---|---|---|
| **15** | **Distribution & audience** | Owned vs rented channels and their asymmetric risk; acquisition as a first-class mission type; platform rate limits as physics; and the reach-to-rung ceiling — **an exposure's reachable rung is bounded by the audience that can see it.** The fourteen ask *can I post* and *is it good* and never *who hears it*. | flywheel |
| **16** | **Authority** | Minting, attenuation, delegation, exercise, expiry, audit, widening, revocation. Territory 09 is entirely about *stopping*; **nothing in the fourteen is about granting**, and a company with no theory of how permission is created can only get smaller. | machine |
| **17** | **Attention** | `DAY.yml`, the interruption budget, the question budget, the fuse, the attention record. Territory 10 is *where the founder looks*, not *how much they can be asked, by whom, at what cost, and what happens when the budget runs out.* | founder |
| **18** | **Obligation, and the people it is owed to** | What the company *owes* — a reply promised, a refund due, an invoice, an SLA, a renewal — plus the relationship state that makes each legible: consent, last contact, promise kept. Different physics from a mission: a counterparty, no deprioritisation, and reputational rather than monetary cost. | founder, machine, flywheel |
| **19** | **Identity & standing** | Consistency with everything the company has already said in public, a list of things it may never say, the legal entity behind the name, machine-work disclosure — **which cannot be retrofitted onto three years of unlabelled exposures** — and the accounts, domains and sending reputation that are **damaged by correct actions taken too often**. | founder, machine, flywheel |
| **20** | **The calendar and the clock** | *When things are due in the world* (seasons, launches, quarter ends, a VAT deadline) and *what hour an act fires* (`not_before`, quiet hours, the fact that a mistake at 04:00 has four hours to compound). Priority computed from purely internal fields ships good work at the wrong time, systematically. | all three |
| **21** | **Silence** | The right to produce nothing, measured: the explore reservation not justified by outcome, the deliberate no-publish night, the count of nights where the correct action was none. **A machine that cannot report "we should not have done anything tonight" will never say it.** | machine |
| **22** | **Succession** | What happens when the one human is unreachable for a month; who can pull the cord; what a handover file must contain. And the asset it creates almost by accident: a company whose durable knowledge lives in files is unusually transferable — the exposures, fields, pairs, dead-ends and warrants *are* the company. | founder, flywheel |

---

# 3 · SLICE OR SMALL — the year-one frame against the picture

*SLICE = the same shape, smaller; it grows into the picture through its own reopen triggers.
SMALL = a different shape that would have to be torn out.*

| # | territory | verdict | specifically, and what it costs |
|---|---|---|---|
| 01 | Missions & drive | **SLICE** | Tree, id format, state table, falsifier, `blocked` freeing the slot — all grow unchanged. Leftmost-open-leaf **is** the degenerate case of a deterministic priority function at WIP=1, and refusal 5 reopens on "a second mission in flight", which is exactly the growth path. A small answer that names its own successor is a slice of the process even where it is not a slice of the shape. |
| 02 | Workers & roster | **SMALL** — refusal 9 | Packs-as-argv is the strongest slice in the frame. But **refusal 9 dissolves trust with `reopen: never`** on the ground that fresh context leaves no subject. **All three visions rejected this independently, and they are right: the subject is the pack, not the worker.** A `claude -p` process has no identity across moves; `packs/web-feature.yml` is a durable file whose outcomes join on the task id. **What the frame should say instead:** *"Worker trust is dissolved; **pack-field** trust reopens when a second pack ships."* **Cost now:** one sentence. **Cost later:** the machine's ceiling is permanently the founder's morning, because the only lever that raises it needs a track record this refusal forbids collecting. |
| 03 | Hands | **SLICE**, the cleanest | **The founder is the mouth.** Ring 2 at full scale is one process that verifies a warrant and executes one action; in year one it is a person who reads a row and taps. Same position, same single-threading, same record. The day-4 grant census is admission test 4. Tests 2 and 5 are absent because there is no outbound hand to apply them to — absence because unneeded, not a different shape. **Two additive columns** on `expose.mjs`: which act, by whose hand, how many times, reversed how often. |
| 04 | Knowledge | **SLICE** | Injection under a byte cap, metering, the exemplar triad, fields global with expiries, ORIENT computed by the harness, decks drawn without replacement. Identical shape, including the property that makes it work — the harness retrieves, so a worker cannot skip it. One additive gap: `dead-ends/` never expires, so `retry_if:` is a predicate nothing evaluates; the nightly re-test needs only a scheduled reader over a field that already exists. |
| 05 | Memory | **SLICE** | One writer per store, append-only, greppable, nothing deleted to meet a cap, newer-wins with the older superseded in place. The full-scale additions (`AUDIENCE.yml`, `people.yml`, `WARRANTS.jsonl`, the attention record, one rebuildable index) are new stores under the same discipline, not a different discipline. |
| 06 | Communication | **SLICE**, and permanent | The star is physics, stated better in the frame than in any vision. `tried:` doubling as the dead-end is exact. Inbound is refused with `reopen: never` — **and the frame's stated reason is the picture's own mechanism** (*"a fetch enters only a no-Write argv"*), so the refusal is of the wrong shape of inbound, not of inbound. The relay and the taint stamp are additive on top of it. |
| 07 | Context & cost | **SLICE**, and the most important | The task id on every row from day three is the decision that cannot be made later. Cache order, prefix sums, `undefined` never zero, compaction designed out: all correct at any scale. `say:` should land here rather than at step 13 — see §4 step 3 — but that is an ordering change, not a shape change. |
| 08 | Quality & truth | **SLICE**, and it inverts a common assumption usefully | Year one builds the **deterministic selector** and leaves the panel's input empty. The selector is the durable half; the panel is an optional input with a stated reopen. That ordering is right and should not be inverted to chase a second family. Oracle first, ladder 0–4, rung generated into the assertion, no judge resolving a done-test, no `total` anywhere. |
| 09 | Control & safety | **SMALL** — authority | The seam, the reach axis on the one classifier, the three kill switches and the 3am never-list are all the right shape. But **year one computes authority as `reach:` on a pack at compile time**, and `reach:` cannot express four things the picture needs: bind to *these exact bytes*, forbid an act *at 3am*, let a spawned worker hold *less* than its parent, or print *"tonight the machine may do X"* as a number. **What the frame should say instead:** add `warrant_kind:` to `packs/<id>.yml` on day 7 — a name, unused in year one, refused if not in a declared enum. **Cost now:** one line and one test. **Cost later:** retrofitting an attenuation chain after two outbound hands exist means finding every path that reaches one. **Falsifiable exit criterion:** on the day the first `reach: outbound-write` pack is proposed, `grep -rn 'reach' scripts/loop/ packs/` and count the deciders — one file and the warrant is a small addition; two and it is a rewrite. |
| 10 | Surfaces | **SMALL** — the fuse | The briefing, `say:`, `[no record]`, the four verbs, the promote tap and the balcony's own done-test are the picture at one venture. **The card with a fuse is absent in any size.** The frame's block requires `until:` and forces one of three dispositions — cleared, escalated, waived — and **all three require the founder to act**, so an absent founder produces an accumulating queue, which is the empty escalation inbox in a new costume. **What the frame should say instead:** every founder-clearable block carries `default_if_unanswered:` and a fourth disposition, `fused`, where the default is always the reversible branch. **Cost now:** one schema field and one branch in `tick.mjs`. **Cost later:** every block consumer changes and the historical meaning of "unanswered" cannot be recovered. **This is the frame's own §17 weakness with a mechanism attached, and it is the cheapest important change in this table.** |
| 11 | Runtime | **SLICE** | `tick.mjs` under launchd is the same program on a laptop and on an always-on host; the plists do not change. Crash-only, exits, no `KeepAlive` on the tick, recovery is the next tick — portable unchanged, which is what a slice means. The genuinely different piece is the balcony becoming a client of a remote host, and it reads files, so it is cheap. **The frame's refusal to say 24/7 before `pmset -g` and one overnight is adopted into the picture verbatim, and the machine vision said it should have applied it to itself.** |
| 12 | Self-improvement | **SLICE**, and better than any vision wrote | The `.out-of-scope` file with `reopen_when` as a countable predicate and `reading:` as the command is the mechanism that makes every other refusal in this document survivable. The machine vision wrote its refusals as prose, read this, and adopted it unchanged. Nothing else in the frame does as much work per line. |
| 13 | Economics | **SMALL** — revenue's provenance | Cost per surviving exposure printed `undefined` at a zero denominator is exactly right and scales unchanged; `usd_per_day: null` with a compile-time refusal *is* the authority total set to zero in daylight, which is the picture's headline mechanism in its degenerate case. **But revenue is a founder-entered number**, and rung 4 is the strongest evidence this company will ever have. A typed number has no `unresolved` state, no expiry and no provenance. **What the frame should say instead:** revenue resolves through a Stripe read as a claim, landing the day there is a first dollar. **Cost now:** near zero, there is no dollar. **Cost later:** every month before the change is permanently rung-4 evidence with rung-1 provenance. The cheapest SMALL in this table, and still a different shape. |
| 14 | The company itself | **SLICE** | Intake producing three artifacts and stopping, and wind-down preserving fields and archive cells, are both exactly the full-scale shapes. *"Mission 2 must be real, or the machine has only tested itself"* is worth more than any mechanism in the row. "Second venture reopens on the first's rung ≥ 2 reading" is slower than the picture wants and is the right trigger, because a portfolio of unmeasured ventures is not a portfolio. |

**Count over the fourteen: 10 SLICE · 4 SMALL** (02 refusal 9 · 09 authority · 10 the fuse · 13 revenue's
provenance). Three of the four are one-line or one-field changes made now; the fourth is one sentence.

### The eight new territories against the frame

| # | territory | verdict | what the frame should do |
|---|---|---|---|
| 15 | Distribution & audience | **ABSENT, and it should not be** | The one gap to fix inside the thirty days. The frame's build order reaches its first published artifact at step 14 and has no channel at all. **A month spent building a loop that will publish into silence is a month of instrument-building whose instruments cannot read anything.** |
| 16 | Authority | **ABSENT, one string now** | `warrant_kind:` at step 7. See row 09. |
| 17 | Attention | **ABSENT, and 60% of it is one field** | `notify_per_day: 3` is a cap without an account. The fuse (row 10) plus one line in `monthly.mjs` turning the cap into a meter is most of the value. `DAY.yml` and the question budget follow. |
| 18 | Obligation & relationships | **ABSENT, correctly** | Follows the first customer. |
| 19 | Identity & standing | **ABSENT, with one deadline** | Follows the first entity — **except machine-work disclosure, which cannot be retrofitted onto unlabelled exposures and therefore has a date attached to the first machine-published artifact.** |
| 20 | The calendar and the clock | **ABSENT, correctly, with one caveat now** | Follows the second lane. But `not_before:` is a single field on a queue row and is worth having the day the first act leaves. |
| 21 | Silence | **ABSENT, correctly** | Follows the explore reservation, which the frame refuses with a stated reopen. |
| 22 | Succession | **ABSENT, correctly** | Follows everything. Worth a written acceptance with a review date rather than an omission. |

---

# 4 · THE PATH BACKWARDS — month one, derived from the picture

The picture's minimum viable unit is **one full turn of the wheel at the smallest radius that still turns.**
Not "build the loop" — the loop is a means. The measurement that matters on day 30 is that **one exposure went
out, one outcome came back at a named rung, one preference pair was written, one field note was read by
something that did not write it, and the founder's own hand on that exposure was recorded as row one of the
authority ledger.** If month one produces a working loop and none of those five, month one produced a
workshop. `(flywheel's four, machine's fifth)`

| # | step | vs frame §15 |
|---|---|---|
| 1 | **Demand test posted by hand.** One real page, real URL, analytics, posted once, pass threshold and "uninformative" threshold written down first. Day 8: the numbers recorded without chasing. | **same** (step 1) — and the single most important agreement across all four documents |
| 2 | Probes: M1 Bash path, M6, M7, M10, M11, `pmset -g`, notification render, playwright reachability, and **H2 — what a dispatched process can actually touch**, which is the load-bearing half and the direction that hides. | **same** (step 2) |
| 3 | **Task id and `say:` in one landing**, plus a `BRIEFING.md` writer over whatever rows exist. **Day 5: the founder is handed something to look at.** | **moved** — `say:` and the briefing sit at step 13 in the frame. A row emitted without `say:` can never be spoken and backfilling it rewrites every emitter. And the frame's own §17 says the spine rests on the founder looking; testing that on day 5 rather than day 19 is what makes shrinking cheap |
| 4 | **The channel.** Not a page — an *address* a stranger can subscribe to, on infrastructure the company owns. | **missing** — the frame has no distribution landing. Audience has the longest lead time of any asset here and every rung ≥ 2 is gated by it |
| 5 | Grant census, `probe-grants.mjs`, `claude mcp list` → `hands.json`, playwright's two-scope fix. | **same** (step 4) |
| 6 | Stall repair in `usage.js` with the 19h ≠ 6h test, then `budget-guard.js` and the telemetry hooks in one settings edit. Repair before registration, because registration first is a believed brake. | **same** (step 5) |
| 7 | `MISSIONS.yml` schema and state table · `next.mjs` with its determinism test · `BOARD.md` cap · `STEER.md` · `LIMITS.yml`. | **same** (step 6) |
| 8 | `packs/web-feature.yml` · `pack.mjs` · `pack.test.mjs` · `prompt.mjs` at the byte cap in cache order · the return schema · **`warrant_kind:` as a declared-enum label, unused**. | **moved** — frame step 7 plus one string. The place to hang `artifact_sha256`, `not_before` and an attenuation chain exists and is tested before it is needed under pressure |
| 9 | `tick.mjs` · `oracle.mjs` rung 0 · `embarrass.mjs` · `orient.mjs`. Run once in the foreground, by hand. | **same** (step 8) |
| 10 | **Intake for the synthetic venture**: taste file, one mission with a falsifier, one approved done-test. | **same** (step 9) |
| 11 | Reach axis and `classifyGrant` · `outbound-approval` gets its caller in tick step 7 · `expose.mjs` **with the authority columns** (which act · whose hand · how many times · reversed how often). | **moved** — frame step 10 plus two columns. The gate exists before the hand, and the track record exists before the first warrant is ever asked for |
| 12 | The balcony with four verbs, `promote.mjs` → `PAIRS.jsonl`, `explain.mjs`, and **`default_if_unanswered:` with the `fused` disposition on every founder-clearable block**. `promote` before `approve`, so the first founder touch writes a pair rather than a signature. | **moved and partly missing** — frame step 13, moved ahead of the plists; the fuse is absent from the frame in any size |
| 13 | Three plists, `caffeinate`, `tick.lock`, `plist.test.mjs`. **First unattended run, daytime, founder present, `reach: local`.** | **same** (step 11) |
| 14 | Synthetic mission runs unattended and is staged · `design.js`'s `total` deleted · `distance.js` · `select.js` · one variation round · `archive/INDEX.jsonl`. Then **intake for a real venture**, mission 2 made by the machine and **published by the founder's hand**, `EXPOSURES.yml` row with `check_on`, `claim-world` returning its first `unresolved`, one `gemini -p` run from the harness, `monthly.mjs` on day 30. | **same** (steps 12–14, compressed) |

**Eight same · four moved · two missing.** Nothing in the frame's fourteen landings is removed.

---

# 5 · WHAT COMPOUNDS

**A store nothing reads is a diary, not an asset**, so the reader column is the one to audit. `(flywheel,
founder)`

| # | store | fed by | read by | what it changes |
|---|---|---|---|---|
| 1 | **The register** — `EXPOSURES.yml` + `outcomes.jsonl` | `expose.mjs` writes a row **before** the outbound call; the sweep resolves it on `check_on` | field priors · pack-field trust · the allocator · `PL.md` · the briefing · the warrant audit | **What the machine believes about the world, and how far each pack may reach.** The load-bearing wheel; everything else is geared to it. Write-ahead matters: a crash between "posted" and "recorded" loses an exposure permanently, so the row before the act makes the register a superset of reality rather than a subset. Four terminal values, never three — `pass` · `no_data` · `not_checked` · `unresolved`. `(flywheel, machine, founder, ceo)` |
| 2 | **The audience** — `AUDIENCE.yml` | every exposure that acquires a subscriber, follower or address; the sweep measures | the rung ceiling · the allocator · intake | **Which evidence rungs are reachable at all.** Publish to nobody and the world's verdict is silence; silence resolves `no_data`; `no_data` teaches nothing. **A company with no audience cannot learn, however good its instruments.** Audience is not a marketing outcome, it is epistemic infrastructure, it compounds multiplicatively across ventures sharing a channel, and it has the longest lead time of anything here. `(flywheel — no reference system has this, and the 128-mechanism catalogue has no entry for it)` |
| 3 | **The pairs** — `PAIRS.jsonl` + the taste files | every `promote` at the queue: two artifacts, the pick, one sentence of why | judge calibration as few-shot · the MAKE prompt · the archive falsifier | **How often the founder must be asked at all.** The only store whose feed rate equals the founder's decision rate, so it grows exactly as fast as the thing it models. **Every founder touch must leave a durable asset behind; a touch that leaves nothing is a leak** — which is why the surface makes choosing cheaper than approving. Pairs expire, because taste drifts. `(all three, and ceo)` |
| 4 | **The shelf** — the quality-diversity archive | every maker, winners and losers alike, tagged by field and niche coordinates | the conductor before dispatch (empty cells) · makers (recombination parents) · the boredom detector (distance baseline) · the queue (occupied cells greyed) | **The machine's creative *range*, accumulating instead of resetting.** A tournament returns one winner and throws away five, and the five contain the ideas you want in three weeks. This is why shelf work is worth doing while the founder sleeps, and it is the only asset that gets strictly better every night. Its weakness: descriptors that are both proxies for quality fill every cell with the same thing. `(all three)` |
| 5 | **The fields** — `~/.agentvibe/fields/` | `orient` moves with no Write, returning JSON the harness writes; wound-down ventures | every MAKE prompt, in every venture | **The quality of the first draft, before any iteration is spent — and it is the entire reason to run four ventures instead of one.** Venture four launches knowing what one through three learned about landing pages, cold email, thumbnails and pricing, so fewer rounds are needed and cost per surviving exposure falls. Also the most falsifiable claim here, already dated. `(flywheel, founder, machine)` |
| 6 | **The graveyard** — `dead-ends/` + negative claims | every abandoned move (the loop refuses to close `failed|abandoned` without one) and every help request's `tried:` list | the harness before ORIENT, injected as actual entries · the "we already tried that" tripwire, which refuses a third identical approach hash unless the dispatch names a difference | **The size of the search space and the price of the next bet.** Fresh context is right for quality and wrong for memory, so the memory goes outside the context. And because a failure with a reproducing command is a claim with an expiry, **the night re-tests them on a schedule** — about twelve come due a night and roughly one in fifteen no longer reproduces, so the map of what the company cannot do stays current instead of calcifying into folklore. `(all three)` |
| 7 | **The warrant ledger** — `WARRANTS.jsonl` | the minter, append-only: one row per issue, exercise and refusal | the mouth (verification) · the bailiff (counting) · the founder (Friday audit) · the trust function | **The company's total nightly blast radius, as a computable number rather than a feeling** — and, over time, the number of decisions the founder no longer makes. A warrant kind exercised 400 times with zero morning reversals is evidence, and evidence is what lets the next one be granted. **This is the only store whose growth permanently raises the machine's ceiling.** `(machine)` |
| 8 | **The attention record** | every card: answered or fused, how fast, and whether the founder later reversed the fuse; every queue session: looked at or skipped | the card generator · the attention meter · the Friday reckoning | **What reaches the queue at all.** A card class the founder has let fuse eleven times running should stop being a card, and the machine proposes retiring it with the eleven instances shown. A class the founder always reverses after fusing is a class whose default is wrong — a finding about the machine, not the founder. **The failure to watch:** this store can quietly train the machine to stop asking about things the founder is *avoiding*. The guard: reversals counted separately from non-answers, and a class with any reversal history can never be auto-retired. `(founder)` |

**And one wheel that is the absence of a store.** Model progress arrives free, on the vendors' schedule.
**Procedure is a depreciating asset; evidence and taste are appreciating ones.** Every release writes down the
value of accumulated step lists, templates and rubrics, because the model now does that better unprompted than
the procedure describes — and writes *up* the value of accumulated exemplars, outcomes and preference pairs,
because a better model does more with each. So the founder's instinct to push back on super-specified packs is
not a style preference, it is correct **asset allocation**, and the mechanism already exists and needs only a
new target: the schema predicate refusing `steps:`, `how:`, `method:` and `implementation:`, pointed at packs,
briefs and field notes alike. `(flywheel — the deepest answer any vision gave to the founder's complaint)`

**The flywheel, stated once.** The shelf makes variants cheaper → more variants per night → the morning is a
choice rather than a report → a choice is a preference pair → pairs calibrate the judges → fewer things need
the founder → and the warrant ledger converts *"the founder always says yes to this"* into *"the machine no
longer asks."* The register measures whether any of it worked. **The audience decides whether the register can
read anything at all.** `(machine's chain · flywheel's two endpoints)`

**The anti-flywheels**, because a wheel that only spins one way is a story: accumulated procedure (braked by
the `steps:` refusal) · unresolved exposures past `check_on` (braked by a suite check that fails on a past-due
row) · serially waived blocks (three on one block surfaces as "decision avoided") · unretired artifacts (X2
last-use) · **reputational debt**, which destroys faster than it builds and is braked only by the physics
line, the rails and the fact that the exposure row exists before the act · founder attention spent on rework ·
and a second implementation of anything that classifies risk. `(flywheel)`

---

# 6 · WHAT WOULD HAVE TO BE TRUE

Ranked by how much of the picture collapses if false. **M** = measurable inside the first thirty days.

| # | assumption | if false | M |
|---|---|---|---|
| 1 | **The founder looks, and looking is cheap enough to keep doing.** All three visions rank this first and the frame names it as its own weakest point. The measured base rate of this founder looking is **zero** — an escalation inbox empty on every project, seven balcony views of which one acts, eleven mockups unlooked at. | Everything collapses. The correct machine is smaller and stranger: it stages, it does not ask, it keeps no register and no rungs, and its value is entirely in the shelf. That is a real design and it is not this one. **A failure here should stop this vision rather than be worked around.** | **YES** — day-8 numbers recorded without chasing; `BRIEFING.md` opened twice unprompted 48h apart. Both fall inside 30 days, and step 3 moves the second test to day 5 so acting on it is still cheap |
| 2 | **`--allowedTools` produces ABSENCE, not denial, on every path — built-in, MCP, and under launchd.** Half measured true on 2026-09-02: `BASH_UNAVAILABLE`, exit 0; `--strict-mcp-config` makes user-scope servers absent rather than denied. | Every "safe by construction" claim is *denial* in the costume of physics, the rings collapse into one, and the honest posture is that nothing runs unattended holding any credential. | **YES** — and it is the cheapest measurement in the document. The unmeasured half is H2: what a dispatched process can actually *touch*, where the precedent finding was a silent no-op rather than an error |
| 3 | **The world answers.** Exposures reach someone, so outcomes are readings rather than `no_data`. | Every outcome is `no_data`, no priors form, no reach is earned, the allocator has no input, trust never grows and the founder is the permanent bottleneck. **The most likely to be false in a mild, corrosive way.** Say in advance that `unresolved` will vastly outnumber `pass`, and treat a run of consecutive `no_data` as a finding **about the instrument, not about the work.** | **PARTIAL** — the ratio over the first five exposures is suggestive and should be reported as suggestive |
| 4 | **A pack's track record is a coherent subject** (refusal 9's scope). | The ceiling is the founder's morning forever, and lever two — the only lever that raises it permanently — does not exist. **The largest consequence-to-cost ratio in this document: a wording question.** | no — but it is a decision available now, and its consequence is testable at the first standing warrant |
| 5 | **Authority stays computed in exactly one place.** | Standing warrants are decorative and the Friday audit measures one path while another exists. This repo has already paid once to learn what two deciders cost in risk classification, and the resulting action is taken *during* the incident rather than merely discovered in it. | **YES** — `grep -rn 'reach' scripts/loop/ packs/`, count the deciders. Trivial |
| 6 | **Owned distribution is buildable by a machine at all.** Platforms disagree at different rates: LinkedIn ~100 calls/day/member, Reddit one post per ten minutes for a new account with karma and age rules, several restrict automated posting outright. | The accelerator is capped and the company is a slower thing — probably SEO and email rather than multi-channel. Not fatal; it changes the numbers by an order of magnitude. | **PARTIAL** — the channel exists and the first subscriber arrives inside 30 days; throttling and account health need ninety |
| 7 | **An always-on host is affordable and the loop is portable to it.** Lid shut, nothing runs — measured today. | "The unattended machine" becomes a question about laptop habits: the night is between zero and eight hours and a mission spanning two nights spans an unknown gap. The picture does not die; it stops being about the night. | **YES** — `pmset -g` and one measured overnight, both in step 2. **And no artifact says 24/7 until both are done** |
| 8 | **Taste extracted from picks generalises into rules a maker can use.** The known limit is real: the extractable part of taste is the measurable part, and the measurable part is not the interesting part. It gets you correct proportions, not a point of view. | The pairs store is a log rather than a flywheel, the intervention metric never falls, and the founder re-supplies the same judgement every week forever. | no — needs ~30 pairs. Hold out twenty and ask whether a panel given the rest predicts the held-out picks better than one given none |
| 9 | **A rate can be enforced *before* the spend.** Some vendors expose a balance in-band; ad platforms generally do not expose today's spend with useful latency. | Autonomous spend is off the table, paid distribution stays the founder's hand forever, and about a quarter of the picture's reach goes with it. Anything above an hour of meter latency is not a rail. | no — nothing spends in year one, which is why the refusal-while-null is the honest year-one mechanism |
| 10 | **A process with no model can hold the credentials.** Every outbound hand must have a call shape checkable without reasoning: a target, a hash, a recipient, a count. | The mouth needs a model, there is a natural-language surface inside the enforcement path, and the correct posture reverts to the founder's hand for that class — **which is year one's posture, and survivable.** | no — the founder is the mouth in year one, which is exactly why this is deferrable |
| 11 | **A second model family is reachable from the harness.** `gemini` is installed and was blocked only by the sandbox denying a read of `~/.gemini`; `codex` exits 0 with empty stdout when detached from a TTY, which is how a resolver runs. Each fix is small. | The panel is single-family, `risk: high` stays an accepted risk to its stated exit date, and the deterministic selector carries the load alone — which is why the selector-first ordering is right and should not be inverted to chase this. | **YES** — one `gemini -p` run from the harness, outside the sandbox, fail-closed on empty stdout. Already in step 14 |
| 12 | **Field knowledge transfers across ventures.** | The fields are a private diary, four ventures are four small companies sharing a host, and the right move is to concentrate rather than diversify. | no — the frame's own falsifier dates it 2026-12-02: a field note read by a task outside the mission that wrote it |
| 13 | **Nothing under the company's name blows up.** One bad exposure destroys reputational capital faster than three years of good ones build it, and the embarrassment linter catches hygiene rather than judgement. | Not recoverable by mechanism. **There is no good forward test**, which is precisely why this is handled by the physics line and the rails rather than by measurement. It is the assumption most deserving a second pair of eyes before any tier-R hand is granted. | no |
| 14 | **Sample sizes ever reach significance.** Most readings at this volume are underpowered, and acting on a point estimate below the minimum detectable effect launders a guess as evidence. | The ladder's top three rungs are aspirational and the company should say so out loud. **Mechanism:** a power calculation in the resolver; below threshold, `unresolved`, and count how often. | no |

---

# 7 · THE FOUNDER'S CHOICES

Every place the picture asks for a decision the frame made differently. **Nothing here is decided.**

| # | topic | the frame says | the picture says | what changes if the founder picks the picture |
|---|---|---|---|---|
| **1** | **Pack trust** (refusal 9) | Worker trust, apprenticeship, promotion and retirement are dissolved — fresh context per move leaves no subject — **reopen: never** | The subject is the **pack**, not the worker: a durable file whose outcomes join on the task id. Narrow the refusal to workers; pack-field trust **reopens when a second pack ships** | **The machine acquires a ceiling it can raise.** Without it, every act stops at the founder's morning forever, because the only permanent lever needs a track record this refusal forbids collecting. Cost today: one sentence in `.out-of-scope`. **All three visions asked for this independently** |
| **2** | **The fuse** | A founder-clearable block requires `until:` and forces one of three dispositions — cleared, escalated, waived — all of which require the founder to act | Every such block also carries `default_if_unanswered:` and a fourth disposition, `fused`. The default is always the reversible branch. Irreversible, financial and first-contact classes cannot fuse | **Founder silence becomes a recorded decision instead of an accumulating queue.** This is the direct mechanical answer to the frame's own §17 — a queue with no fuse is a queue nobody has to work — and it costs one schema field and one branch |
| **3** | **Distribution in month one** | No distribution landing at all; the first published artifact is step 14, days 20–30, by the founder's hand | An owned **address** a stranger can subscribe to, inside the first thirty days, as step 4 | **Rung ≥ 2 becomes attainable.** Every outcome above rung 1 is bounded by the audience that can see it, so a loop built to publish into silence has instruments that cannot read. Audience also has the longest lead time of any asset in the picture |
| **4** | **Authority as a token** | `reach:` on a pack, evaluated at compile time, in one place | Add `warrant_kind:` to the pack schema on day 7 — a name, unused, refused if not in a declared enum | **One line and one test now, versus finding every path that reaches an outbound hand later.** Falsifiable: on the day the first `reach: outbound-write` pack is proposed, count the deciders — one file and it is small, two and it is a rewrite |
| **5** | **Revenue's provenance** | Founder-entered in `PL.md` | Read from Stripe as a claim with a `valid_until`; an unreachable instrument reads `unresolved` and `unresolved` months are counted | **Rung 4 stops having rung-1 provenance.** Lands with the first dollar, so it costs nothing today; every month before it is permanently the company's strongest evidence recorded at its weakest standard |
| **6** | **The night's host** | The founder's Mac; **lid shut, nothing runs**, and 24/7 forbidden as a phrase until measured | One always-on host that is not the laptop, one cloud twin, the balcony as a client | **The night becomes a fact rather than a laptop habit.** Same `tick.mjs`, same plists, same paths — a purchase, not a redesign. **The frame's measurement gate is kept exactly as written**, and the CEO position insists on it: nothing claims 24/7 before `pmset -g` and one overnight |
| **7** | **When the founder first looks** | The balcony lands at step 13, days 17–19, after the loop | A `BRIEFING.md` writer at step 3, day 5, over whatever rows exist; the full balcony still at step 12 | **The frame's weakest point is tested before days 6–19 are spent on it.** The frame already declares this self-test; it runs it two weeks too late to act on |
| **8** | **The hour as a caveat** | Nothing; the frame's 3am table is a list of what may never run, with no notion of what may run *later* | `not_before:` on every act that leaves, defaulting to the morning | **An act at 04:00 has four hours to compound; at 08:04 it has none.** One field on a queue row, and it is what makes staging a property of the token rather than a policy someone remembers |
| **9** | **The rate axis** | `usd_per_day: null`, a single global scalar, with `pack.mjs` refusing `reach: spends` while it is null | A table keyed on (venture × hand × day), read at compile time, **refusing when the meter is unreadable** | **Nothing changes in year one** — a scalar is the degenerate case of a table and the refusal-while-null is the honest version. It decides whether autonomous spend is ever defensible, and the picture's answer is that it is not without a meter that reads before the money moves |
| **10** | **The founder's day as an object** | `notify_per_day: 3` and a 08:00–22:00 window: a cap without an account | `DAY.yml` with a protected making block, enumerated exceptions, a metered interruption budget, and one line in `monthly.mjs` turning the cap into a meter | **The machine schedules around the founder rather than into them**, and work whose output needs looking at is planned to land before the morning. If the override is exercised daily it is not a budget and should be removed rather than tuned |
| **11** | **The machine's question** | None. The machine may report, block or wait | One question a day, surfaced in the briefing's NEEDS YOU, stating the machine's own best guess so the answer can be "yes", becoming a rule with an expiry | **The machine's ignorance becomes visible instead of being resolved by a guess.** An unspent budget is reported as a finding about the machine, not as efficiency |
| **12** | **The second model family** | Refused as a mechanism in year one; one measurement run at step 14 | ≥2 families on the panel, the second seat may be empty, **empty resolves `unresolved`, never `pass`** | **Nothing in month one** — the frame's ordering (deterministic selector first, panel later) is right and the picture keeps it. What changes is the reopen trigger: the seat is designed in from the start as a seat that can be empty, which is the shape Rule 10 already requires |

**The three that change the most: rows 1, 2 and 3.** Row 1 sets the ceiling of the entire company and costs
one sentence. Row 2 is the only mechanical answer anyone offered to the frame's own named weakest point and
costs one field. Row 3 decides whether the register can read anything at all, and it is the only one of the
three that costs real days inside the first month.
