# The company-first design · 2026-09-02

**One of four whole-system designs, written from the company angle.** The instruction was to start from what
a company *is* and derive the machine, rather than starting from the machine and hoping a company falls out
of it. Written as an operator specifying the thing that will run their company at 3am without them.

Every section states **what it is** (a file, a format, a mechanism), **what it is built from** (a catalogue
id, a repo path, or `INVENTED`), **which board decisions bind it**, and **what enforces it**. A rule with no
mechanism is labelled `WISH`, per the standing rule.

Sibling designs exist under this directory and were deliberately not read.

---

## 0 · THESIS

**A company is a machine for turning the founder's attention into exposures, exposures into evidence, and
evidence into the next exposure. The center of this design is the exposure — a thing that left the building
with the company's name on it, and what came back.**

Everything else is accounting around that register. Missions exist to decide which exposure to make next.
Workers exist to make one. Hands exist because an exposure has to physically leave. Memory exists so the
second exposure is better than the first. Money exists as the rate at which exposures can be attempted. The
truth layer — which is excellent and which we keep — exists to stop us lying about what came back.

The current system has an outstanding answer to *is what we said true* and no answer at all to *did anything
leave, and did anyone respond*. Its own record says so: 171 session files, essentially all about the harness;
`.qa/verdicts/` holds 50 PASS records and every one of them is about this repository. **Nothing in the
building has ever been exposed to anybody.** That is not a missing feature. It is the missing organ.

So the design is organised around **four books**, in the order an operator opens them:

| Book | File | Answers | Status today |
|---|---|---|---|
| **Record** | `EXPOSURES/` | What left, and what came back | **Absent. This is the center.** |
| **Intent** | `ventures/<v>/missions/M-####.yml` | What we are chasing and why | Absent |
| **Money** | `ventures/<v>/PL.md` + the claim ledger | What it cost and what it returned | Half — cost pricing exists in `bin/warroom`, unwired |
| **Learning** | `FIELDS/` · `DEAD-ENDS/` · `ventures/<v>/CHARTER.md` | What we now know that we did not | Absent, on excellent foundations (the ledger's forced expiry) |

**What serves what.** L1 truth serves the record: it is what makes an exposure's outcome believable. The
engines serve intent: they are how a mission becomes an artifact. The balcony serves the founder's attention,
which is the only genuinely scarce input in a one-founder company and the one thing no mechanism can
manufacture.

**The one-sentence test for anything proposed below:** *does it move an exposure closer to leaving, or make
its reading more honest?* If neither, it is overhead, and this design refuses overhead by name in §16.

---

## 1 · Missions & drive

### 1.1 What a mission is

A mission is a **one-page memo a business person would recognise**: an objective, one accountable name, a
date, a budget, a kill rule written before the work starts, and a test for done. Not a ticket. Not a "goal
node". A memo.

**File:** `ventures/<venture>/missions/M-0007.yml` — one file per mission, ids globally unique across the
company, because a company has one numbering scheme for its objectives.

```yaml
id: M-0007
venture: northwind
one_liner: Fifty people on the waitlist who did not hear about it from me.
accountable: founder             # exactly one name. CY3.
opened: 2026-09-02
review_on: 2026-09-16            # a forced disposition date, not a deadline

budget:
  window_share: 0.15             # fraction of the rolling 5h window. CY2.
  money_per_day_usd: 0           # D2 holds this at 0 until the founder sets a rate.
  founder_minutes: 30            # the scarcest input, budgeted like any other

kill_when:                       # written BEFORE any work. P6.
  - "review_on passes with ≥3 exposures recorded and rung ≥2 on none of them"
  - "the constraint moves to another mission and this one has no exposure in flight"

constraint: true                 # at most one mission per venture carries this. P2.

done:
  rung: 2                        # W2's ladder — see §8.4
  test: "50 distinct sessions in one 7-day window from a source that is not the founder"
  instrument: world-read://plausible/northwind/sessions
  proposed_by: agent             # the agent proposes after ORIENT
  approved_by: founder           # the founder approves ONCE, then it binds (STARTUP-OS §4)
  approved_on: 2026-09-02

state: in_flight                 # in_flight | parked | blocked | shipped | killed
moves:
  - id: "3"
    intent: "A page that states the offer in five seconds."
    moves:
      - { id: "1", intent: "Write the offer in one sentence.", pack: content-copy }
      - { id: "2", intent: "Build and stage the page.", pack: web-feature }
```

**Built from:** P7 (commander's intent — task, purpose, end state, constraints, and never method) · CY1
(intake produces exactly three artifacts) · W2 (the rung) · P6 (kill rule) · P2 (the constraint pointer).

**Binds:** D7 (`done.proposed_by: agent`, `approved_by: founder`, never resolved by the producing model) ·
D12 (the goal tree under `moves:` is explicitly **uncapped**; the ceiling lives on packs and mechanisms, not
here) · D2 (`money_per_day_usd` cannot be non-zero until a rate ceiling exists).

**Enforced by:** `scripts/check-missions.mjs`, a new step in the check suite.
1. A mission whose `review_on` has passed with no recorded disposition **fails** — the identical shape to
   `claim-freshness`, which already fails a claim once its date passes.
2. A `done:` block with no `instrument:` resolvable by `world-read` fails. Rule 10: a done-test whose
   instrument cannot be reached resolves `unresolved`, never `pass`.
3. A `moves:` entry carrying `steps:`, `how:`, `method:` or `implementation:` fails — the predicate
   `.claude/hooks/schema-lint.js` already runs against playbook stages, pointed at a second file.
4. `money_per_day_usd > 0` fails while `packs/RATES.yml` has no founder-signed entry. This is D2 as a
   check rather than as a sentence.

### 1.2 What a move is, and why the definition is a business one

`STARTUP-OS.md` §8 open question 4 asks what a move is. The company-first answer:

> **A move is one thing the founder could be shown.** If it cannot be a single row on the balcony, it is not
> a move; it is two.

That definition does three jobs at once, which is why it beats a technical one. It sets the fresh-context
boundary (one move, one `claude -p` process). It sets cycle cost (one move, one artifact, one row). And it
makes the founder's 2–4 rows a day a **design constraint on decomposition** rather than a filter applied
afterwards: if a mission generates forty rows a day, the mission was cut wrong.

### 1.3 The task id — D1, and it carries the org chart

**Format:** `M-0007.3.1#2` — mission, path in the goal tree, attempt number.
**Regex:** `^M-\d{4}(\.\d+)*#\d+$`

This is not merely an identifier. Because it is a *path*, cost, event and exposure aggregation are prefix
matches: everything under `M-0007.` is that mission's spend; everything under `M-0007.3.` is that branch's.
Because it carries an **attempt number**, the anti-circling detector is free — attempt 4 on one leaf with no
passing done-test is `stuck` (§1.5), and CAST's failure to answer "what did this task cost" is structurally
impossible here.

**Binds:** D1 — the only decision on the board whose omission cost is unbounded.
**Enforced by:** `scripts/lib/events.js`'s `logEvent()` gains a required `task` key and **refuses to write a
row without one**. Note the posture comment at the top of that file — *it never exits and it never throws* —
so "refuses" means: writes the row to `events.jsonl` with `task: null` **and** increments a counter that
`scripts/check-events.mjs` fails on. A logger that can abort the thing it is logging is worse than no logger;
a logger whose omissions are invisible is worse than that.

### 1.4 Priority — the next move is computed, and the arithmetic is printed

At 3am nobody is available to have an opinion, and a model choosing what the company works on is an
unauditable judgement in the control path. So it is a function.

**File:** `scripts/next.mjs` → prints the pick, the score, the arithmetic and the runner-up.
**Rule:** `score = cost_of_delay ÷ size`, filtered to moves whose mission names the current `constraint`.

```
$ node scripts/next.mjs --venture northwind
PICK   M-0007.3.2   rewrite the page headline against the 6 HN referrers
       cost_of_delay 8 (deadline 14d · unlocks 2 moves · demand evidence rung 2)
       size          2 (one artifact, one pack, ≤1 attempt estimated)
       score         4.00
INSTEAD OF  M-0009.1  blog post — score 1.33
CONSTRAINT  M-0007 (northwind) — the founder's attention, per CHARTER.md
```

**Built from:** P1 (deterministic function over declared fields) · P3 (WSJF) · P2 (theory of constraints as
the filter) · EC3 (`instead_of` recorded on every dispatch).

**Enforced by:** a determinism test — the same `missions/` directory must always yield the same pick, which
is the entire property. `scripts/lib/classifier.js` is the precedent: one file computes the answer, and this
repository has already paid to learn what two implementations cost. `evidence_of_demand` is the one gameable
field and it is sourced through the ledger's `claim-source` resolver, so it cannot be asserted without a URL
and a quote.

### 1.5 Blocked, stuck, stalled — three states from three different authors

The cheapest good idea in the catalogue, and it costs one sentence:

| State | Authored by | Means | Response |
|---|---|---|---|
| `blocked` | the **worker**, as a declaration | an external dependency is missing | a person clears it |
| `stuck` | the **counter**, from attempt hashes | N approaches tried, all failed | a different method, or the council |
| `stalled` | the **meter**, from token spend | no durable artifact and no declaration | kill the move |

A worker cannot author `stalled` and the meter cannot author `blocked`, so they are structurally
indistinguishable-proof. **Built from:** B1, B2.

A `blocked` declaration carries `clearable_by:` (the founder, a named credential, a named external party) and
`until:` — a block with no expiry is refused at write time, and when it comes due exactly one disposition is
recorded: cleared, escalated, or waived with a new deadline. **Built from:** B3, reusing Rule 9's machinery
wholesale rather than inventing a second expiry system.

`blocked` is **not** `in_flight`, so it frees the mission slot (B5) and the machine does not idle for a week
behind one missing API key.

**Enforced by:** `budget-guard.js`'s stall ceiling computes `stalled` — **after the repair D4 requires.**
Measured 2026-09-02 in this worktree with the last durable artifact 19.1 hours old, `sinceLastArtifact()` and
`windowUsage()` returned the same number, 193,027: past `RETAIN_HOURS = 6` the stall counter degenerates into
the window counter, and a 24/7 loop crosses six hours on night one by construction. **This design does not
build on the stall counter until that repair lands**, and until then `stalled` is `WISH`. Saying so is the
whole point of D4.

### 1.6 The loop's cycle

One cycle = one move. Read the board, ask `next.mjs`, take a lease, run one worker in a fresh process,
record, rewrite the board, sleep. Full runtime in §11.

---

## 2 · Workers & roster

### 2.1 Engines stay; the roster the company sees is packs

The seven engines are the right decomposition of *shape of work* and they survive. But a company does not
have engines. It has **jobs with keys**, and what separates the person who makes videos from the person who
ships features is which keys they hold and what proves they finished. That is the pack.

### 2.2 A pack is a grant and a stop, and it is NOT an agent file

This is the design's sharpest structural choice, and it exists to answer D12's measured objection: the
frontmatter schema is a closed 15-key allowlist, and the `Agent` dispatch tool has no `tools` parameter — so
the only pack shape the runtime supports on the subagent path is *one generated agent file per engine × pack*.
That is roster growth by multiplication, and it is exactly the pressure that took this repo to 26 agents.

**So packs do not live on the subagent path.** A pack is a row the **launcher** reads to build argv:

```yaml
# packs/content-video.yml
id: content-video
summary: Short-form video, from idea to a file on disk. Never publishes.

allowed_tools:                              # verbatim, into `claude -p --allowedTools`
  [Read, Write, Bash, mcp__higgsfield__generate_video, mcp__higgsfield__generate_audio,
   mcp__exposure-register__stage, mcp__next__claim_move]

disallowed_tools:                           # belt and braces, into --disallowedTools
  [mcp__higgsfield__tiktok_publish, mcp__higgsfield__sandbox_exec, mcp__gmail__send_message]

grants:                                     # R2 — declared once, at the moment a capability enters
  mcp__higgsfield__generate_video: { reversible: yes, blast_radius: self,    spends: no  }
  mcp__exposure-register__stage:   { reversible: yes, blast_radius: self,    spends: no  }

stop:
  attempts: 3
  stall_output_tokens: 60000
  wall_clock_seconds: 1800

done:
  proposed_by: agent
  approved_by: founder
  approved_on: 2026-09-05
  rung: 1
  test: "three strangers name the subject of the video within five seconds of it starting"

model: claude-sonnet-5
```

**No `method:`. No `steps:`. Nothing about how to make a video.** The founder's instruction — *give them the
tools, the way and the understanding on how to learn, and push back on super-specified packs* — is honoured
by the schema refusing those keys, not by anybody remembering to be restrained.

**The first four packs** (Decision 6): `web-feature` · `design-brand` · `content-video` · `customer-market`.
A fifth, `content-copy`, is the one addition this design argues for, because copy is the highest-frequency
artifact in every venture and bundling it into `design-brand` gives one pack two done-tests.

**Enforced by:** `scripts/check-packs.mjs`, a check-suite step.
1. Every entry in `allowed_tools` beginning `mcp__` has a `grants:` entry with all three fields, or fail —
   the identical shape to `schema-lint.js`'s existing rule that fails an agent declaring `mcpServers` no
   configuration backs.
2. A `steps|how|method|implementation` key anywhere in the file fails.
3. `stop:` with all three sub-keys, or fail. Per the standing rule: if a budget is not enforced by something
   that can stop a worker, the field is not written. Sixteen war-room routines once declared budgets nothing
   read.
4. Any granted tool with `spends: yes` fails while `packs/RATES.yml` carries no founder-signed rate — **D2,
   as a check.**
5. Every tool in `allowed_tools` must appear in `.mcp.json` or in Claude Code's built-in tool list. A grant
   nothing backs is the defect this repo already fixed once.

### 2.3 How many at once

**Two workers, and the reason is the window, not the CPU.** The binding constraint on this Mac is the rolling
five-hour token window that the founder also uses. Concurrency beyond two makes the rope (EC4) fire mid-move
and lose work.

One lane is reserved for the venture holding the `constraint`; the second is free. **Enforced by:**
`flock ventures/<v>/.lease` in `bin/loop.sh`, and a global semaphore file at `~/.agentvibe/lanes/`. A lease
is on a **path prefix**, not a file (CO4), because two workers editing different files in one directory still
collide on the build.

### 2.4 Fresh context

Every move starts at zero. Not by instruction — **structurally**, because the loop body is a new `claude -p`
process (D10). There is no accumulation to compact and no predecessor's text to notice. This is where this
design differs from the Ralph loop as actually implemented, whose conversation accumulates and is compacted
only past 70% of a 150k window.

### 2.5 How a worker learns a field it lacks

The founder asked for *the way and the understanding on how to learn*. That is ORIENT, and it is a **bounded
protocol with a checkable exit**, not a procedure:

```
ORIENT (only when FIELDS/<field>.md is absent or expired)
  find 3 exemplars of excellent work in this field, with URLs
  extract 5 RULES from them — what makes them work, not what they look like   [C15]
  write FIELDS/<field>.md: 3 exemplars, 5 rules, each a claim with valid_until
  EXIT CHECK: the file has ≥3 sourced exemplars and `npm run check:ledger` passes on it
```

**Built from:** K1 (bounded protocol, checkable exit) · C15 (taste transfer as rule extraction, never
imitation) · C16 (exemplars over rules — the exemplars are kept, not just the rules derived from them) ·
Decision 9 (global facts, project taste).

**Enforced by:** the ledger. A rule written into `FIELDS/` is a claim with `valid_until`, so best practice in
short-form video expires and forces a disposition — refresh, deprecate, or waive. **This is the job the
ledger deserves.** It was built to stop the harness's claims about itself from rotting; learned field
knowledge rots the same way and faster.

**What is refused:** a pack that ships with the field knowledge baked in. The field file is written by
whoever went and looked, at the time they looked, and it expires. A pack that carried it would be the
super-specified pack the founder pushed back on, wearing a data format.

---

## 3 · Hands

### 3.1 What a company has to be able to touch

An operator's list, in the order a company needs them: **make** the thing · **stage** it where it can be seen
· **send** it into the world · **read** what happened · **take money** · **spend money**. Today this machine
can make and cannot honestly do any of the other five, while holding the credentials for the two most
dangerous.

The measured state is the whole argument for this section: `higgsfield`'s `tiktok_publish`, Gmail
`send_message`, `sandbox_exec` and an authenticated Chrome are **live right now**, each returning exit 0 from
the only blocking hook; PostHog, Sentry and a read-only Stripe key are **not connected**. The riskiest hands
are granted and the cheapest safe ones are not.

### 3.2 The grant matrix

| Pack | Make | Stage | Send | Read the world | Spend |
|---|---|---|---|---|---|
| `web-feature` | Read/Write/Bash, Playwright | `exposure-register.stage` | — | `world-read` | — |
| `design-brand` | Figma, Pencil, Playwright | `exposure-register.stage` | — | — | — |
| `content-video` | higgsfield generate_* | `exposure-register.stage` | — | `world-read` | — |
| `content-copy` | Read/Write | `exposure-register.stage` | — | `world-read` | — |
| `customer-market` | Read/Write, WebSearch | `exposure-register.stage` | — | `world-read` | — |

**No pack holds `send`. Ever.** Sending is not a worker capability; it is what happens after a human gate
clears (§9). The `exposure-register` server accepts a `stage` call from a worker and a `send` call from the
loop **only** with a founder approval token bound to the staged artifact's hash.

### 3.3 The five servers to build

Each earns its existence by one of two tests: *it must be the sole path*, or *it must be read-only*.

| # | Server | Why a server and not a tool | Enforces |
|---|---|---|---|
| 1 | **`exposure-register`** | Sole path for anything leaving the building. A wrapper is a control only if nothing else reaches the capability — and here nothing else does, because the direct tools are struck from the argv. | R4 dry-run by default · R5 rate ceiling · R6 named-human register · D2 money ceiling · writes the `EXPOSURES/` record |
| 2 | **`world-read`** | Read-only, and it must return **parsed numbers, never fetched prose**. | D9's concession exactly: a deterministic parse into a data file, never a fetched body into a producing context |
| 3 | **`next`** | Sole path for "what do I work on", so a worker cannot pick its own work and cannot skip the constraint. Also issues the lease. | P1/P2/P3 · the lease · D1 (it mints the task id) |
| 4 | **`transcript-mine`** | Read-only over the 2,936 transcripts, returning **counts and `file:line`, never prose**. | A4 — transcripts as instrumentation, never as memory |
| 5 | **`claim-append`** *(exists, extended)* | Already the only audited write into the ledger. Extended to accept `verified_by: world`. | W1 · Rule 10 |

Note what #4's constraint buys: RAG over the transcripts would resurrect superseded beliefs stated
confidently, which is precisely what the supersession discipline exists to bury. Returning only counts and
line references makes that failure unavailable rather than discouraged.

### 3.4 What is refused

- **`mcp__higgsfield__tiktok_publish`, `sandbox_exec`, Gmail `send_message`** on every pack roster. Struck
  from `--allowedTools` and named in `--disallowedTools`.
- **Any ad platform, GPU rental, postage or paid-per-call API** until `packs/RATES.yml` carries a
  founder-signed dollars-per-day figure. **D2**, and it is the only decision on the board that costs nothing
  to honour: a missed spend costs nothing, a wrong spend is a bill `git revert` cannot refund.
- **Inbound of any kind** until the outbound path is closed and exercised. **D9.** Inbound plus outbound with
  nothing between them is injection-to-irreversible-action in one hop, and `WebFetch` currently returns exit
  0 from the only blocking hook, so there is no point at which a fetched body is marked foreign.

### 3.5 The honest limit on the wrapper

The board could not resolve whether an outbound wrapper is buildable as one artifact, and the Architect's
critique is correct as stated: `pre-tool-use.sh` has two verbs, allow and deny, and cannot rewrite
`mcp__higgsfield__tiktok_publish` into `wrapper.publish(hash)`.

**This design's answer is not to interpose. It is to remove.** On the unattended path the roster is built by
`claude -p --allowedTools`, so the direct tool is not present to be intercepted. That is physics on that
path. **On the founder's own interactive session it is not, and this design does not claim otherwise** — the
founder's user-scope MCP servers remain reachable when the founder is typing, and `mcp-policy.json` governs
two servers in `mode: shadow`, neither of them the dangerous one. Stated rather than discovered.

---

## 4 · Knowledge

**Global facts, project taste** (Decision 9), enforced by *where the file lives*, not by convention:

| Store | Path | Scope | Expiry | Written by |
|---|---|---|---|---|
| Field knowledge | `FIELDS/<field>.md` | global | ledger claims | ORIENT |
| Venture taste | `ventures/<v>/CHARTER.md` | project | founder edit only | founder + intake |
| Dead ends | `DEAD-ENDS/<field>.md` | global | **never** | any worker on failure |
| Exemplars | `FIELDS/<field>/exemplars/` | global | with the field | ORIENT |

**`CHARTER.md` is the taste file and a business person wrote it:**

```markdown
# Northwind — charter
WHAT IT IS      A weekly briefing for independent grocers on wholesale price moves.
WHO IT IS FOR   Owner-operators of 1–3 stores who currently phone three suppliers.
IN THEIR WORDS  "I find out the price went up when the invoice comes."
REFERENCES      stratechery.com (density) · morningbrew.com (voice) · nothing that looks like a SaaS site
ADJECTIVES      plain · early · specific
NO-GOS          no stock photography · no "revolutionise" · never mail anyone who did not ask
ACCOUNTABLE     founder
```

**Taste enters once, at the top.** The founder supplies references, adjectives and no-gos; every value below
is derived by the worker. No downstream judge can recover taste that was never set, which is why intake
refuses to dispatch a move for a venture with no charter (CY1).

**How a worker finds what it needs:** the two-tier router that is already proven here — `INDEX.md` naming the
namespaces (~370 tokens), then one namespace file (~700), then 2–3 skills. A typical lookup is ~1,070 tokens
against the ~15,000 that reading `MANIFEST.json` whole once cost. The same pattern is applied to `FIELDS/`:
one `FIELDS/INDEX.md` line per field, then the field file on demand.

**Negative knowledge — `DEAD-ENDS/`.** One file per failed approach: what was tried, what happened, the
command that reproduces it. Read **before** ORIENT, not after failure (C25). **Enforced by:** the move brief
is constructed by the harness, not by the agent, and it injects the matching dead-end entries; a test asserts
they appear in the constructed prompt. *The harness does it, not the agent* is the pattern that made this
repo's QA oracle trustworthy.

---

## 5 · Memory

Five stores, one rule each. The rule is what makes each one safe to trust.

| Store | One rule |
|---|---|
| `ventures/<v>/missions/` | **Intent expires by decision, never by silence.** `review_on` forces a disposition. |
| `EXPOSURES/` | **Append-only. Nothing that left the building is ever edited or deleted.** |
| `FIELDS/` | **Every fact is a claim with `valid_until`.** Rot forces refresh, deprecate or waive. |
| `ventures/<v>/CHARTER.md` | **Only the founder changes taste.** An agent may propose a diff; it may not apply one. |
| `DEAD-ENDS/` | **Never expires.** A dead end does not stop being dead. |

**Retrieval.** By construction, not by search: the harness injects the charter, the field file for the move's
field, the matching dead-ends, `BOARD.md`, and `STEER.md`. A worker that has to *search* for its own context
will sometimes not find it, and the failure is silent.

**Conflict.** Newer wins, older superseded **in place with its reason** (MEM2) — the discipline this repo
already practises in `CLAUDE.md`, generalised. The reason matters more than the correction: a supersession
block that says only "this was wrong" teaches nothing.

**Forgetting is a tool, not a judgement call.** `scripts/evict-memory.mjs` already classifies entries, prints
net bytes freed, refuses to archive an `irreversible` entry while its subject exists, pins anything a live
claim cites, and leaves a stub so a citation still resolves. It is extended to `EXPOSURES/` **read-only** —
exposures are never evicted, only indexed — because the company's history of what it did in the world is the
one thing that cannot be regenerated.

**What transcripts are for.** Instrumentation, never memory (A4). Three readings, all mechanical, all through
`transcript-mine`: where the founder corrected us (M1, a regex classifier, ~50 lines), promises that never
landed (M3), and where sessions die (M4). **Never** retrieved into a producing context.

---

## 6 · Communication

**Star topology. Workers never message workers** (CO3). Every message goes through the loop, which is the only
thing that holds state. Two workers negotiating is an org chart forming, and this repo already paid to
collapse one.

**The baton:** `ventures/<v>/BOARD.md`, rewritten every cycle, hard-capped, never grown. Fixed shape (CO1,
SBAR):

```markdown
# northwind · board · cycle 412 · 2026-09-02T03:15Z
SITUATION    Waitlist page live 4h. 41 sessions, 6 referred from Hacker News.
BACKGROUND   M-0007 in flight. Constraint: founder attention. 2 exposures open.
ASSESSMENT   Headline is generic against the audience that actually arrived.
NEXT         M-0007.3.2 — rewrite the headline against the 6 HN referrers.
BLOCKED      M-0007.5 — ad account not connected. clearable_by: founder. until: 2026-09-05.
```

**Read-back on the baton** (CO2): the worker's first act is to restate the NEXT line **in its own words** into
its return. A restatement in different words confirms intent; echoing the text confirms only that the text
was copied. Aviation settled this decades ago.

**Collisions:** leases on path prefixes (CO4), not file locks.

**Help:** the escalation ladder with maximum dwell times (B4). L1 the worker tries another approach, capped by
the stall ceiling · L2 the council convenes, capped at one cycle · L3 the founder is woken, no cap because it
is their call. **Exceeding a dwell auto-promotes, mechanically.** If promotion needs a judgement, the ladder
has the same failure as the escalation Inbox, which has been empty on every project ever.

**Enforced by:** `BOARD.md` has a byte cap checked by `check-memory-budget.mjs` (a new target for an existing
checker); the five section headings are required and a missing one fails; rung entry timestamps are event rows
and a scheduled check promotes on expiry.

---

## 7 · Context & cost

**What is injected into a worker, and nothing else.** The brief is constructed by `scripts/brief-move.mjs`,
outside the worker:

| Injected | Size budget | Why |
|---|---|---|
| The move brief — task · purpose · end state · constraints | 400 B | P7. Four fields, no method. |
| `CHARTER.md` | 800 B | Taste enters once. |
| `FIELDS/<field>.md` | 2 KB | What good looks like here. |
| Matching `DEAD-ENDS/` entries | 1 KB | C25 — before ORIENT, not after failure. |
| `BOARD.md` | 1 KB | The baton. |
| `STEER.md` | 500 B | S2 — the founder's live redirect. |
| **Total** | **≤ 6 KB** | |

**Enforced by:** a byte-budget ratchet with forced progressive disclosure (the GSD steal, CT1) and the
precedent that already worked twice here — skills discovery 15,000 → ~1,070 tokens, `session-start.js`
27,069 → 2,941 bytes. At 27KB the runtime *truncated* the payload and the content never reached agent context
at all; a pointer did. A budget that is checked is the difference between injection and decoration.

**Caching.** The pre-flight block is cached as one block. System prompts are stable and cached at 10% of input
cost, which is why pack files are data the launcher reads into argv rather than prose that varies per run.

**Compaction declares what it dropped** (CT3). A compaction that silently loses the blocked item is how a
loop forgets it is blocked.

**Cost per mission.** Prefix aggregation over `events.jsonl` on the task id: `M-0007.` sums the mission,
`M-0007.3.` sums the branch. This is exactly what CAST could not do — it needs a heuristic 60-second
time-window join because there is no key — and it is the one thing on this whole list that cannot be
retrofitted.

---

## 8 · Quality & truth

### 8.1 Two different questions, and the company needs both

*Is it right* is L1, it is excellent, and it is kept unchanged (Decision 1). *Did it work* does not exist.
This section builds the second without touching the first.

### 8.2 The oracle runs first, and it is deterministic

`qa.js` already runs a deterministic oracle before any panel agent is dispatched, and it has blocked its own
author. Kept as-is for code. For non-code exposures the oracle is the rung-0 check: the video plays at the
right aspect ratio, the page builds and renders, the email renders in two clients. **Deterministic, no model.**

### 8.3 The verdict subject must stop being a diff — and this is the design's largest single technical claim

`scripts/verdict.mjs` binds `subject = sha256(git diff)`. **A published video, a sent email, a live landing
page and a price change have no diff, therefore no subject, therefore no verdict record.** For three of the
four pack families the truth layer simply does not reach.

The Architect raised this seam in Round 2 and the board's own note records that **nobody engaged with it in
either round**, and that the first non-code mission discovers it by shipping. A company-first design cannot
leave it there, because three of the four packs it ships are the non-code ones.

**The fix, and it is one function, not a second implementation:**

```
subject = sha256(git diff)                    # kind: diff        — unchanged, for code
subject = sha256(bytes of the artifact)       # kind: artifact    — new, for everything that leaves
```

Every exposure has bytes. The video is a file. The page is a build output. The email is a body. The ad is a
creative plus a target. `verdict.mjs` gains one `--subject-kind` and refuses an unknown value rather than
guessing — the lesson already learned in #116, where a mistyped `--dry-run` was dropped in silence and the
real thing ran.

**Binds:** Decision 1 (L1 survives — this extends it, it does not replace it) · A5 by analogy (one
implementation of the subject, never two) · D3's reasoning applied to a different file.
**Enforced by:** `scripts/verdict.test.mjs` pins that an artifact-subject verdict does not validate against a
diff-subject record and vice versa. Two subject kinds that can be confused are worse than one that is
narrow.

### 8.4 The done-test, and the evidence ladder

**The agent proposes the done-test after ORIENT. The founder approves it once. Then it binds.** Taste enters
once, at the top; it is not re-asked at every step. **D7 binds absolutely: no done-test is ever resolved by
the producing model, and no score is ever summed or averaged.**

The ladder, per artifact type. **This is the table an operator wants and no engineering-first design
produces**, because it is written in the vocabulary of the medium rather than of the harness:

| Exposure | 0 · it renders | 1 · a stranger gets it | 2 · someone acted | 3 · someone came back | 4 · someone paid |
|---|---|---|---|---|---|
| **Landing page** | builds, renders in 2 browsers | stranger states the offer in 5s | ≥1 session not from the founder | a returning visitor | a payment |
| **Short video** | plays, right aspect, audio synced | 3 strangers name the subject | ≥100 views | a follow or a save | a click through to the site |
| **Newsletter** | renders in 2 clients, no broken links | subject line understood without the body | an open | a click | a reply from a human |
| **Ad** | passes platform policy review | a human reads it as an offer | an impression served | a click | a landing-page conversion |
| **Feature (internal)** | tests pass | the founder uses it once | **the founder uses it twice, unprompted, >48h apart** (W5) | someone else uses it | it is in a paid plan |
| **Price change** | it is published | a customer reads it without asking | a purchase at the new price | a repeat purchase | net revenue up over 30d |

**Rules on the ladder, all enforced:**
1. Every `done:` block names its `rung:`. A rung-0 result may never be phrased as a rung-2 claim — the
   claim's `assert` string is **generated from the rung**, so it cannot overstate.
2. **No aggregation across rungs**, ever. D7 names this: a rung-1 result reported as a rung-4 claim is how a
   machine spends two years learning to lie to itself.
3. Rungs 0–1 are reachable at n=1 with no instrument and no third-party auth. **That is where the first
   ninety days live**, and saying so in advance stops the ladder reading as an indictment when it sits at
   rung 1 for a month.

**Enforced by:** `rung:` validated against the declared ladder in `LADDERS.yml`; the claim generator; and a
check that no claim's `assert` contains rung-2 language on a rung-0 resolution.

### 8.5 The world's verdict

`verified_by: world` — a fifth resolver alongside `source`, `command`, `judge` and `freshness`. Its evidence
names an **instrument** and a **threshold**; the resolver queries the instrument through `world-read`.

**Rule 10 governs it absolutely: unreachable instrument → `unresolved`, never `pass`.** Say in advance what
will happen, because it will feel like failure: most instruments are third-party APIs with their own auth,
and the system will report `unresolved` far more often than `pass`. That is honest, and it is the correct
reading.

**W3, the shipped register:** every exposure carries `check_on`. On that date an outcome is recorded, and
**`no_data` is an allowed outcome, distinct from `not_checked`.** Conflating them is how this kind of
register dies. A run of consecutive `no_data` is itself a finding — it means the founder became the
instrument and stopped answering.

**Enforced by:** `scripts/check-exposures.mjs` fails an exposure past `check_on` with no disposition —
structurally identical to `claim-freshness`.

### 8.6 The second family, and the council

`gemini` is installed at `~/.npm-global/bin/gemini` and has never been executed. `codex` is not installed.
The repository states in four places that no non-Anthropic model is reachable and carries the multi-family
gap as accepted risk to 2026-11-17. **That claim is falsifiable and probably false, and one test settles it**
— but it spends the founder's Google quota, so it is theirs to authorise.

When it lands, the second family is a **judge, never a maker**, invoked as a subprocess (GSD's shipped
pattern). **Fail-closed:** empty stdout, non-zero exit, or a timeout resolves `unresolved`, never `pass`.
Codex bug #19945 — exit 0 with empty stdout when detached from a TTY, which is exactly how a resolver runs —
is the reason this clause is not optional.

**The council:** personas argue and never build. Fresh instances every round with zero visibility into prior
findings, named as anchoring-bias avoidance; a 3-iteration cap; then escalation carrying an iteration-history
table (Metaswarm). **Findings, never scores** — union, never average. And per **D13**, the council does not
convene without an agent file per persona that narrows its roster: five Opus personas once ran a governance
meeting holding `tiktok_publish`, `sandbox_exec` and Gmail `send_message`, which made the governance body the
least governed thing in the repository.

### 8.7 Taste vs correctness

They are different resolvers and must never share a field. **Correctness is `command` or `world`.** **Taste
is `human`, always** — there is no artifact a process could read that distinguishes founder approval from an
agent writing the string "approved", which `.claude/gates.yml` already says about itself.

The one mechanism that makes taste compound without re-asking: **preference pairs.** Every time the founder
picks A over B on the balcony, a row is written: the two candidates, the pick, and the founder's one-line
reason. That corpus conditions the *judge's prompt*, never a worker's. Trust-in-a-worker has no subject here
because context is fresh per move; calibration-of-a-judge has one, because the prompt persists.

**Stated as `WISH` on its input, honestly:** the board could not settle whether this corpus has a source, and
the measurement is against it — the only surface where a pair could be written is a balcony with seven views,
one of which acts, and an escalation inbox empty on every project ever. §10 is where that gets fixed, and
until a founder pick is recorded on a real balcony row, this mechanism has no input and should not be
described as working.

---

## 9 · Control & safety

### 9.1 The policy seam

One shape, six phases, evaluated in order, **first DENY short-circuits** (Omnigent). Built on the eight hook
events currently unused, per the founder's constraint; **`pre-tool-use.sh` is untouched.**

```
PolicyEvent → PolicyResponse | null
phases: dispatch · tool_call · tool_result · artifact · exposure · cycle_end
levels: pack → venture → machine defaults          (first DENY wins; ASK accumulates;
                                                    a later DENY still beats an earlier ASK;
                                                    side effects apply only on final ALLOW)
```

**Why this is one thing and not five.** The budget guard, the QA gate, tool grants, approval gates and the
loop's stopping rules are the same shape: an event occurs, typed handlers vote, the strictest verdict wins,
nothing takes effect until the verdict is final. Build the seam once and every future guardrail is a small
function rather than a new subsystem — including the ones nobody has thought of.

**Enforced by:** handler registration is a dotted path in `policies.yml`; `scripts/check-policies.mjs` fails
a declared handler that does not resolve (the dead-path check, which already exists in
`check-registration.mjs`) and fails a handler with no test.

### 9.2 Reach — one classifier, two axes

`scripts/lib/classifier.js` computes tier from a normalised path string. Measured:
`node scripts/classify.mjs assets/promo.mp4 posts/launch.txt` returns `tier=lite · enforcement=shadow` for
both — a video and a caption about to be published under the company's name, unattended.

**The fix (D3, R1):** a second declared axis, `reach: internal · outbound-private · outbound-public ·
financial · human-contact`. **Effective tier = max(path tier, reach tier).** One function, two inputs, one
answer.

**Reach is declared on the GRANT, not at the call site** (D3, R2). Declared per action it would be declared
hundreds of times and would be wrong somewhere; declared per tool it is declared once, at the moment a
capability enters the system, which is also the moment somebody is thinking about it.

**A second implementation of risk classification is refused outright**, including a small helper answering
"is this outbound?". `scripts/classify.mjs`'s own header says why: *two implementations of risk
classification will disagree, and you find out during the incident.* This repository has already paid for
that once.

### 9.3 Gates — and the class the machine structurally cannot clear

`.claude/gates.yml` already declares `kind: command` and `kind: human`, and `scripts/check-gates.mjs`
**refuses a human gate written with a `run:`**. That refusal is the structural impossibility D6 needs, and it
is already built. What it lacks is a caller in any executing path.

**Anything with `blast_radius: stranger|public` or `reversible: no` is `blocking-human` BY TYPE.** Not by
policy, not by mode, not by a reasoning chain. No configuration clears it.

**And note what §8.3 means for this gate.** Because a published video, a sent email and a live page have no
diff, the human gate is not one control among several for three of the four pack families — **it is the
entire enforcement spine.** That composition is the board's, and it is the single most important sentence in
this section.

`.claude/gates.yml` gains a required `who:` on every human gate (CY3). A gate that names no human is invalid.
For a one-founder company this is ceremony — and its value is that it makes the exception visible the day a
second human arrives.

### 9.4 The kill switch lives in the supervisor

**File:** `~/.agentvibe/STOP`. `bin/loop.sh` checks it before anything else and exits 0 if it exists. The
switch is in the supervisor and not in the prompt, because a switch a model can reason about is a switch a
model can reason around.

Second layer, the andon cord (S3): a pull sets a flag, and the worker halts at its **next durable artifact** —
a commit, a written file, a claim event — reporting where it stopped so the state is resumable. Not the next
token, and not eventually. `scripts/lib/usage.js`'s `lastArtifactAt()` already defines "durable artifact on
disk" and **never the agent's own claim to be done**, which is the property that makes it unforgeable.

**Honest limit:** a worker that produces no durable artifact never reaches a station, so the cord is a wish
for exactly the worker you most want to stop. That is what the inner watchdog is for (§11).

### 9.5 What runs at 3am and what never does

| Runs unattended | Never runs unattended |
|---|---|
| Make an artifact | Send anything to a person |
| Stage it to a preview URL | Publish anything public |
| Read an instrument | Spend money outside model tokens |
| Write a claim, a field note, a dead end | Edit `CHARTER.md` or a `done:` that already binds |
| Open a PR | Merge a PR |
| Record an exposure's outcome | Register a new tool grant |

**Enforced by:** the right column is either absent from every pack's `allowed_tools` or gated
`blocking-human` by type. Not by a rule anybody remembers.

### 9.6 The residual, named rather than implied

A design that implies the residual is closed is worse than one that admits it. Eight, from the board, adopted
verbatim as constraints on how this design may be described:

1. The sandbox is a guardrail against accident, **not containment** — `dangerouslyDisableSandbox` exists.
2. `Bash` is a general capability and cannot be enumerated.
3. **No reasoning-layer control survives prompt injection.** This is why D9 puts inbound last.
4. A verdict is **hash-bound, not signed** — anyone with repo write can author one.
5. The panel is single-family until a second family is reachable and executed.
6. A policy file is an ordinary file.
7. A `blocking-human` gate **stops overnight work while the founder is asleep.** That is the correct trade
   and it is a real cost.
8. **The founder is a single point of failure for every human gate**, while watching 2–4 rows a day.

---

## 10 · Surfaces

### 10.1 The morning briefing — what a CEO actually reads

Money first, because that is what an operator reads first. Five sections, fixed order, always present, each
allowed to say "nothing" — and "nothing" is spoken aloud rather than skipped.

**File:** `ventures/<v>/BRIEFING.md`, generated by `scripts/brief.mjs` at 06:00. The balcony renders it; the
terminal cats it; the phone shows it.

```
NORTHWIND · Tuesday 2 September · 06:00
$412 out this month · $0 in · 3 exposures live · 47 of your minutes used

WHAT CHANGED (2)
  › Waitlist page went live at 23:14. 41 sessions since; 6 came from Hacker News.   M-0007.3.1#1
  › Three video hooks made. None sent — they need you.                              M-0007.4.2#1

WHAT IS BLOCKED (1)
  › Ad account not connected. You clear this. Raised 19h ago. Expires Friday.        M-0007.5#1

WHAT NEEDS YOU (1)
  › Publish hook B to TikTok?  reach: outbound-public  ·  [approve] [reject] [look]  M-0007.4.2#1

WHAT I WOULD DO NEXT
  › Rewrite the page headline against the six Hacker News referrers.                 M-0007.3.2
    Instead of: a blog post (M-0009.1), which scores 1.33 against 4.00.
```

**Built from:** V2 (four sections, fixed order) plus a money line, which is this design's addition and is not
optional — a briefing without cash is a status report, not a briefing. EC3 supplies `instead_of`. D1 supplies
the id on every row.

**Enforced by:** a test asserts all five sections are present; a briefing missing a section **fails rather
than silently shortening**. "What I would do next" is labelled an opinion until `next.mjs` exists, and after
that it prints the arithmetic.

### 10.2 The balcony — goal-sized rows, and it acts

Mission control has seven views and one that acts, and the escalation Inbox has been empty on every project
ever. **The remedy is fewer views that act, not more views that mirror.** Two views survive: the briefing,
and the exposure register. The others are cut or fold into those.

Every row carries: task id · `say:` · cost · rung · and exactly the actions its reach permits.

**Containment is preserved and is not negotiable.** `mission-control/test/crosscheck.test.ts` bans a shell
call under `server/` at zero exceptions — deliberately; it closed three RCEs on 2026-08-14. So **the balcony
never spawns.** Approving writes an intent row to a queue file; the loop reads it on its next cycle. That is
the 8b dispatch shape, already built, reused rather than reinvented.

### 10.3 Redirect and annotate are two different acts

Merging them is why steering feels impossible.

| | Targets | Latency | Acknowledged | Lands in |
|---|---|---|---|---|
| **REDIRECT** | a task id | next phase boundary | **yes** | `STEER.md`, changes the current move |
| **ANNOTATE** | a field or a venture | next artifact | no | `CHARTER.md`, for everything after |

**Enforced by:** two event kinds in `scripts/lib/events.js`; two verbs on the balcony; **a redirect with no
task id is refused** — CAST's lesson, that without an id there is no join and no accountability. On the
surface, a redirect is one tap on the row it applies to, so the target is implicit and cannot be mistyped.

### 10.4 Phone and voice

**Phone: three verbs. approve · redirect · stop.** Anything richer queues for a keyboard. Three verbs is what
fits under a thumb at a traffic light and it covers the founder's entire overnight role. The evidence for
poorer-but-used over richer-but-unused is the empty Inbox.

**Voice** is not a skin on the dashboard. It changes the data:
- Every row carries `say:` — one sentence, ≤15 words, no paths, no hashes, no ids. **Written at emission by
  the thing that knows what happened**, so voice reads a field rather than putting a model in the path.
  Enforced by a lint that fails a `say:` containing `/`, a 7+ hex run, or more than 15 words. It improves the
  written surface too: a row that cannot be said in fifteen words usually bundles two events.
- **Confirm-back (V4):** a voice instruction is restated **in the system's own words** — not the transcript —
  and binds only on confirmation. Echoing the transcript confirms the transcription, not the intent. A
  voice-originated move carries `confirmed: true` or the loop refuses to dispatch it. Required above
  `reach: internal`, skipped below it.

Per Decision 5 this is **balcony-only and Claude-native**. No Telegram, no bot, no third-party plumbing.

### 10.5 When it may interrupt

Three cases, and no others: a `blocking-human` gate on an action with `reach: outbound-public | financial |
human-contact` · L3 of the escalation ladder · the rope firing with work in flight. Everything else waits for
the 06:00 briefing.

**Enforced by:** the notification is emitted by the policy handler at the `exposure` phase, and there is no
other emitter. Count human-gate stops per night; if it is high, the answer is to change **what the loop
attempts overnight**, not to weaken the gate.

### 10.6 The walkthrough

"Explain what you did" is a **replay of the log, not a generation** (E1). `scripts/replay.mjs <task-id>`
prints the rows in order: brief, tool calls, artifacts, gate results, cost. **An explanation with a hole must
say so** (E2) — Rule 10 applied to self-explanation. An answer that cannot be sourced to a row is refused
rather than composed.

---

## 11 · Runtime

### 11.1 Where the loop lives

**`launchd`, running `bin/loop.sh`.** Not in the control plane — `crosscheck.test.ts` forbids it and should.
Not in a session — a session ends. **Binds: D10.**

```bash
# bin/loop.sh — one cycle. launchd: StartInterval 300, KeepAlive.
[ -f ~/.agentvibe/STOP ] && exit 0                       # kill switch, in the supervisor  [RT3]
node scripts/rope.mjs || exit 0                          # window headroom                 [EC4]
read TASK PACK < <(node scripts/next.mjs --json)         # the pick + the lease            [P1,P3]
flock "ventures/$V/.lease" -c '
  timeout 1800 claude -p "$(node scripts/brief-move.mjs "$TASK")" \
    --allowedTools    "$(node scripts/pack.mjs allow "$PACK")" \
    --disallowedTools "$(node scripts/pack.mjs deny  "$PACK")"
'                                                        # inner watchdog                  [S4]
node scripts/record.mjs "$TASK"                          # rows, cost, artifact, exposure
node scripts/board.mjs "$V"                              # rewrite the baton, capped
```

**Two supervisors, two different failures** (S4): `timeout 1800` kills a hung call; launchd's `KeepAlive`
restarts the script if the script dies. Neither supervises the other's failure, which is the point. Auto-Co
ships both; this repo has neither.

**The load-bearing half is the tool list**, not the plist. With the direct outbound tools on the roster, every
other outbound control in this design is advisory.

### 11.2 The measurement that has to happen before this is believed

`claude -p` under launchd has **never been run on this machine**, and D10's confidence is `med` for exactly
that reason: the workflow-reachability half is an inference. `Workflow` is a main-session tool — 0 of 55
recorded calls came from a sidechain against 57,590 subagent `Bash` calls — and a `claude -p` process under
launchd is *not* a sidechain, so it should reach them. **Should is not measured.**

**Founder action item 9, and it is the first thing in §15 that needs a human:** run it once, record whether a
`Workflow` invocation succeeds. If it fails, the producing workflows are reachable only while the founder is
typing, and the 24/7 premise needs re-examining rather than re-wording.

### 11.3 Recovery

The loop is **stateless between cycles.** Everything needed to resume is on disk: `BOARD.md`, the mission
files, `EXPOSURES/`. A cycle that dies mid-move loses that move's tokens and nothing else. Moves are
idempotent, or they declare that they are not and take a lease (RT1).

### 11.4 Models per job

| Job | Model | Why |
|---|---|---|
| Make an artifact | `claude-sonnet-5` | The default. Most moves. |
| Council persona, judge, synthesis | `claude-opus-5` | Depth, and it is a small fraction of cycles. |
| Classify, parse, lint, tally | `claude-haiku-4-5` | Or no model at all, which is better. |
| Second-family judge | `gemini` subprocess | Fail-closed on empty stdout. |

**A hard cost ceiling downgrades the model rather than stopping the work** (EC1), and **fails closed when a
model has no catalogue price** — asking rather than silently scoring the spend at zero. Record the model on
the artifact: a done-test passed on a downgraded model is a different fact.

### 11.5 What runs with the lid shut

**Unmeasured, and it decides whether "24/7" is literal.** A Mac with the lid closed on battery sleeps, and a
sleeping Mac runs no launchd job. `pmset -g` and one overnight run settle it; `caffeinate -i` wrapped around
`bin/loop.sh` is the likely remedy on AC power.

**Labelled `WISH` until measured**, and it is the kind of thing an operator names on day one and a diagram
never shows.

---

## 12 · Self-improvement

**Corrections become mechanisms, or an explicit "none" that is counted.** The input is mechanical: M1's regex
classifier over the transcripts finds where the founder corrected us — *"no, that's not what I meant"*, *"I
said"*, *"actually"* — as against asking a model to notice. ~50 lines, an afternoon.

Each correction gets one of three dispositions, and **"none" is a legitimate answer that is counted** (SI1):
a mechanism, a field-note, or none-with-a-reason. A post-mortem whose output is prose is a post-mortem that
changed nothing.

**Promotion at three sightings** (SI2). The same workaround appearing in three moves becomes a field rule or a
pack change. Below three it is noise; the threshold is arbitrary and declared rather than defended.

**Retirement is telemetry, not opinion.** X2: last-use is keyed on the task id, so a pack, a check step or a
skill with zero calls in 90 days is a **fact somebody has to answer for** rather than a thing nobody
remembers. Retirement is archival, never deletion (X5) — the same stub discipline `evict-memory.mjs` already
enforces.

**Measuring "better" — one company metric:** **founder interventions per shipped exposure.** Not tokens, not
velocity, not artifacts. If the machine is working, that number falls while the exposure count rises. If it
falls while exposures also fall, the machine has learned to stop bothering the founder by doing nothing,
which is the failure this metric is designed to make visible.

**And the standing monthly count (D15):** harness work against venture work, over session-file frontmatter,
classified through `scripts/lib/classifier.js` rather than a second implementation of it. **It is a finding
and nothing fires.** N consecutive months of harness work exceeding venture work is reported to the founder.
It is the only instrument in this design that would have fired during the last three weeks, while every
mechanism was being built correctly and nothing was pointed at anybody.

---

## 13 · Economics

### 13.1 The company's P&L

**File:** `ventures/<v>/PL.md`, regenerated monthly by `scripts/pl.mjs` from event rows joined on the task id
prefix.

```
NORTHWIND · September 2026
  Model spend                      $ 412.19
  Tools and services               $   0.00
  Advertising                      $   0.00     ← D2: no rate, therefore no spend
  ─────────────────────────────────────────
  Total cost                       $ 412.19
  Revenue                          $   0.00
  ─────────────────────────────────────────
  Exposures made                        12
  Exposures reaching rung ≥ 2            3
  Cost per surviving exposure      $ 137.40
  Founder minutes                       47
  Founder interventions per exposure    3.9
```

**Cost per *surviving* exposure, never cost per run** (EC2). Cost per run rewards cheap runs that produce
nothing. A month of cheap runs producing nothing has an **undefined** cost per surviving exposure, and
undefined is reported as undefined — never as zero and never as excellent. Rule 10 applied to a metric.

**Built from:** `bin/warroom` already implements per-worker cost pricing and a typed `events.jsonl`. The bash
program goes; **this is one of the six features that must be reborn as data.**

### 13.2 The rate ceiling

**Money is the one risk axis with a RATE, and no tier in this repository can express one.** Every tier here
is about reversibility or blast radius. A pack's `budget:` field is a `WISH` until a counter exists at the
wrapper.

**File:** `packs/RATES.yml`, and it is **founder-written**:

```yaml
# Only the founder edits this file. An agent proposing a diff is fine; applying one is not.
northwind:
  money_per_day_usd: 0        # founder action item 2 — nothing else on the board waits on a
                              # number only the founder holds
  outbound_public_per_hour: 0
  outbound_public_per_day: 0
  first_contact_per_day: 0
```

**Enforced by:** the `exposure-register` counts from the event log at the wrapper and refuses over the
ceiling — not advisory, not model-visible in a way it can argue with. Exceeding requires a founder override
**logged with the numbers**, which is the shape `budget-guard.js` already implements. The log of overrides is
itself data about whether the cap is set right.

**Zero is a legitimate value and is the starting value.** D2 is the only board decision that is free to
honour: the refusal is inaction.

### 13.3 The rope

The loop stops itself at a set fraction of the rolling five-hour window, so it never competes with the founder
for their own quota (Decision 8, EC4). At the ceiling a **safelist** still permits `git commit/push`,
`npm run check`, `gh pr create`, ledger writes and session-file writes — **landing work is never blocked, only
starting new work is.**

**`budget-guard.js` is this, already built, verified by execution at 0.08s warm latency, and registered
nowhere.** Registering it edits `.claude/settings.json`, which is `irreversible` tier and denied to the write
tools, so it is a founder act.

**And D4 binds the order: repair the stall counter first.** Registering it in its current state does not give
the loop a brake; it gives the founder a reason to believe there is one. That distinction is the difference
between this design working at 3am and this design failing at 3am while reporting that it is fine.

### 13.4 Opportunity cost

Every dispatch records `instead_of:` — the runner-up the priority function ranked second. **Free, because the
function already knows.** Over months it reveals what the company systematically never gets to, which is
invisible today. `instead_of: none` is allowed and counted: a queue that is always length one is a finding
about how work is generated.

---

## 14 · The company itself

### 14.1 Venture intake — bounded, three artifacts, one sitting

Intake produces exactly three things and then **stops**:

1. `ventures/<v>/CHARTER.md` — taste: references, adjectives, no-gos, who it is for, in their words
2. **one mission with a falsifier** — the cheapest thing that could kill the idea (C36)
3. **one approved done-test** with its rung

**Enforced by:** the loop **refuses to dispatch against a venture missing any of the three.** Mechanical, and
it puts the founder's one unavoidable contribution at the only moment it is cheap. Taste, the first mission
and the done-tests are exactly the things that cannot be added later without redoing the work.

**Capped at one sitting**, and the system proposes drafts the founder edits rather than asking open questions.
An intake that becomes a questionnaire is an intake the founder abandons.

### 14.2 Several ventures at once

Each venture declares a share of the window with a **floor** and a **ceiling** (CY2). The floor stops a quiet
venture being starved to zero; the ceiling stops a loud one taking everything. **Shares are reviewed on a
cadence, never continuously** — continuous reallocation is precisely how the loudest wins.

**Enforced by:** `windowUsage()` already meters account-wide across every project, which is exactly the meter
multi-venture allocation needs. The shares are config `next.mjs` reads.

**A floor can keep a dead venture on life support.** So a venture carries `retire_on:` like any other governed
artifact.

### 14.3 A second human

Decision rights per decision *type*, RACI-style: exactly one Accountable, plus Consulted and Informed. Every
`kind: human` gate names `who:`. **A gate that names no human is invalid.**

For a one-founder company the founder is Accountable for everything and the field is ceremony. That is fine
and honest. Its value is that the day a second human arrives, the exception is visible rather than assumed —
and the documented failure mode of two people is boring and reliable: both assume the other approved.

### 14.4 Wind-down

Four steps, in order (CY4): **stop dispatch · resolve every open claim to a disposition · write a dead-end
record for the venture as a whole · archive with a stub.** Bulk `deprecate` with one shared reason is allowed,
because resolving every claim individually is real work at exactly the moment nobody wants to do it.

**The global facts stay global.** Decision 9's split means a dead venture still contributes to `FIELDS/`, and
that is the strongest argument for the split: a venture that failed still taught the company how short-form
video works.

**Enforced by:** a check that a venture marked `wound_down` has no unresolved claims and no exposure past its
`check_on`.

### 14.5 The first mission

**Two first missions, answering two different questions, and conflating them is a mistake.**

- **The outside question — D5, the founder's hand, no machine.** One real page at a real URL with analytics,
  posted once to one place a real audience reads, hands off for seven days, three numbers recorded. **The
  pass and the uninformative-sample thresholds are written down before it runs.** No agent publishes, sends
  or spends, so it needs none of the controls in §9. It is a **finding, not a gate** — the IF-AND-ONLY-IF is
  deleted.
- **The inside question — Decision 7, the synthetic mission.** A landing page for a fake company, run end to
  end through the machine, graded internally at rungs 0 and 1 only. It answers *can the machine hold a
  mission*, and it answers nothing about demand.

Running the first without the second wastes seven days of calendar time that cost nothing. Running the second
and calling it demand evidence is the exact inflation W2's ladder exists to prevent.

---

## 15 · THE FIRST 30 DAYS

Continuous cadence, no phase numbers. Each landing is useful alone and named by what it unlocks. Dates are
indicative; the **order** is forced.

### Position 1 — and the Adversary's dissent is right

> *"Position 1 must be an artifact, not a mechanism. Measured across all four peer build orders: position 1
> is a mechanism in four of four cases, and an artifact that reaches a person outside this system appears at
> no position in any of them."*

**Accepted, and it changes this build order rather than being noted beside it.**

**Position 1 is the founder posting one page, by hand, on day 1.** It is D5, it is already locked, it needs
no machine, no controls and no agent, and it is the only item that reads a signal from outside the system.
Nothing in this design is on its critical path and it is on the critical path of everything: the exposure
register's first row is that page, and the world-read instrument's first reading is its seven-day number.

**The machine's position 1 is therefore the thing that reads that artifact's outcome** — not the thing that
makes the next one. That ordering falls out of the company frame rather than being conceded to it: a company's
first day is a sale attempt, and its second is learning whether the attempt worked.

**One exemption, and it is the Architect's, granted:** the **task id** ships in the same week, because it is a
field and not a mechanism, it costs an agent's minutes, it competes with the founder for nothing, and its
omission cost is the only unbounded one on the board. Recorded as a dated `.out-of-scope/` entry rather than
a verbal carve-out.

### The order

| # | Landing | Unlocks | Who |
|---|---|---|---|
| **1** | **The page is posted, by hand. Thresholds written first.** | The only outside signal. Everything downstream has something to read. | **Founder** |
| **2** | **Task id on every row.** `logEvent()` requires `task`; `check-events.mjs` fails a null. | Cost per mission, last-use telemetry, the stall counter's per-lane fix, every join in this document. **Cannot be retrofitted.** | Agent |
| **3** | **The exposure register.** `EXPOSURES/` + `scripts/exposure.mjs` + `check-exposures.mjs`. Row 1 is landing 1. | The company's memory of what it did in the world. `check_on` forces a reading. | Agent |
| **4** | **Repair the stall counter, then register `budget-guard.js`.** | The loop's only brake, and the circling detector. **In this order** — D4. | Agent, then **Founder** |
| **5** | **Dispatch-path grant census.** What a worker on each path can actually touch. | The only item that can make the safety list *shorter*. One leaky launcher turns four controls into "stop using that path". | Agent |
| **6** | **Reach on the classifier + the `blocking-human` caller.** `max(path, reach)`; gates get a caller. | Makes §9.5's right-hand column structural instead of advisory. | Agent |
| **7** | **`exposure-register` server + `RATES.yml` at zero.** Dry-run default, rate counter, named-human register. | The only path out of the building. Nothing publishes before this. | Agent |
| **8** | **`claude -p` under launchd, once, recorded.** Does a `Workflow` invocation succeed? | D10's whole premise. If it fails, the 24/7 design changes shape. | **Founder authorises** |
| **9** | **The loop, dry: `next.mjs` + `bin/loop.sh` + `BOARD.md`.** Picks and records, dispatches nothing. | The pick becomes auditable before it becomes autonomous. | Agent |
| **10** | **The first pack: `content-copy`.** Cheapest artifact, fastest rung-1 reading. | The first end-to-end move. | Agent |
| **11** | **The briefing + the balcony's two acting views.** | The founder can approve and redirect. **Preference pairs get their first input.** | Agent |
| **12** | **The synthetic mission, end to end.** Decision 7. Rungs 0–1 only. | The acceptance test of the whole machine. | Agent |
| **13** | **The world reading of landing 1.** Seven days on, three numbers, recorded against the exposure. | Rung 2 or `no_data`, and either is information. | Agent |
| **14** | **Second family: run `gemini` once, fail-closed.** | Retires an accepted risk that runs to 2026-11-17 — or confirms it, which is also worth knowing. | **Founder authorises** |

**What is deliberately NOT in the first 30 days:** inbound of any kind (D9) · outbound money (D2) · worker
trust (D11) · the council · the QD archive · voice · more than one venture · packs 2 through 5. Each is
refused in §16 with the thing it protects.

---

## 16 · WHAT THIS DESIGN REFUSES

Naming what not to build is cheaper than un-building it, and a rejection recorded with its reasoning before
code exists is GSD's `.out-of-scope/` practice.

| # | Refused | What the refusal protects |
|---|---|---|
| 1 | **A score summed or averaged from judge outputs, anywhere.** `design.js`'s `total` over four 0-10 axes is the named live instance. | The findings. Averaging converts specific findings into one number that has lost the findings and gained nothing. A variant scoring 10/2/2/2 loses to four 5s every time, and the 10 is the interesting part. **D7, A1.** |
| 2 | **A done-test resolved by the producing model.** | Honesty about done. A design PASS/BLOCK judge measured 0.543 against a panel only 0.741 self-consistent. **D7, A3.** |
| 3 | **A second implementation of risk classification** — including a small helper answering "is this outbound?". | The incident you find it in. `classify.mjs`'s own header, and one PR split already paid for it. **D3, A5.** |
| 4 | **Outbound money before an enforced rate.** | The bill `git revert` cannot refund. The asymmetry is total: a missed spend costs nothing. **D2.** |
| 5 | **Inbound before the outbound path is closed.** | The one-hop path from injection to irreversible action. **D9.** |
| 6 | **Worker trust, apprenticeship, promotion, demotion, retirement.** | A year of the highest-cost, least-precedented item in a 177-repo survey. And the subject is **dissolved, not deferred**: fresh context per move plus a pack that is a grant leaves no persistent worker for trust to accrue to. **D11.** |
| 7 | **One agent file per engine × pack.** | The roster. That shape is multiplication, and it is the exact pressure that produced 26 agents. Packs are launcher argv. **D12.** |
| 8 | **RAG over the 2,936 transcripts as memory.** | The supersession discipline. Retrieval cannot tell a corrected belief from a current one, so it resurrects exactly what supersession buries. **A4.** |
| 9 | **A method, procedure or step list inside a pack.** | The founder's actual complaint. A model researching a field today beats a procedure written today, and this repo already produced a critic's checklist in the maker's slot by trying. |
| 10 | **A dashboard view that only mirrors.** | Attention. Seven views, one that acts, an Inbox empty on every project ever. A poorer-but-used surface beats a richer-but-unused one. |
| 11 | **Telegram, Linear, or any third-party escalation plumbing.** | Decision 5, and the founder's stated preference. Balcony-only, Claude-native. |
| 12 | **Phase numbers.** | The cadence. Nine phases produced one venture task; Omnigent shipped fifteen releases in ten weeks and the phrase "Phase N" appears nowhere in its changelog. Continuous landings, each useful alone. |
| 13 | **Template extraction for other founders.** | Focus. Decision 4 — built for this Mac, for this founder. It is a later question and pretending otherwise doubles every design decision. |
| 14 | **Any rule stated without its mechanism.** | Every rule in this document names one or says `WISH`. Eight unenforced rules once sat in `CLAUDE.md`'s rules table. **A6.** |

---

## 17 · WHERE THIS DESIGN IS WEAKEST

### 17.1 The strongest argument against it, stated fairly

**The company frame assumes exposures are the scarce input. The measured record says the scarce input is the
founder's willingness to look — and this design has no mechanism for that, because none exists.**

The evidence is against me and it is this repository's own. Beeond produced eleven mockups and the founder
could not look at one. The escalation Inbox has been empty on every project ever built. The balcony has seven
views and one that acts. `.qa/verdicts/` holds fifty PASS records and nobody has read most of them.

If the founder does not look, this design degrades in a specific and unpleasant way. `EXPOSURES/` fills with
rows whose outcome is `no_data`. W3 says a run of consecutive `no_data` is a finding — **but that finding is
delivered to the founder, who by hypothesis is not looking.** Every human gate stops overnight work, the
briefing goes unread, and the machine becomes a very well-instrumented way of not knowing anything, at a
higher cost than the current one because it now also maintains a register.

The preference-pair corpus in §8.7 has the same hole and I have labelled it `WISH` for that reason: its only
possible input is a founder pick on a balcony row, and the board could not demonstrate that this input
exists.

**What would change my mind, concretely:** landing 1 gets its seven-day reading recorded by the founder, on
time, without being chased. If that does not happen for the founder's *own* hand-posted page, no amount of
mechanism will make it happen for the machine's twelfth video, and the design should shrink to the one thing
that survives an absent founder — a machine that makes artifacts and stages them, with no register, no rungs
and no claim that it knows whether anything worked.

**A second, narrower weakness, named rather than defended:** §8.3 generalises the verdict subject from
`sha256(git diff)` to `sha256(artifact bytes)`. That is one function and one flag, but it touches
`verdict.mjs`, which is on the blocking merge path, and it is `irreversible` tier. If the two subject kinds
can ever be confused, a code verdict could validate a video, which is worse than either working alone. I have
specified a test that pins them apart; I have not written it, and I would not merge that change on a
single-family review.

### 17.2 The one board decision I would overturn — D12

I honour fourteen. I would argue against **D12 — a declared ceiling on the number of governed artifacts** —
not because a ceiling is wrong, but because **it counts the wrong noun, and the board's own measurement shows
which noun is right.**

**The evidence.** The Adversary's cost curve (`adversary:R2:P6`), which no lane rebutted, measures the
self-correction bill in this repository: **637 lines of `STATUS.md`, the main sha stale four times in one
day, the branch name five times, the session count five times, the suite denominator four times.** The
Strategist's supporting argument for D12 (`strategist:R2:P2`) cites the same record: *"nothing in that record
was hard to reverse and all of it was expensive to hold."*

**Now check that measurement against what D12 actually governs: packs, personas, workflows, commands, skills
and check-suite steps.** Not one item in the measured cost curve is any of those. `STATUS.md` is **one
document**. `CLAUDE.md` is **one document**. Together they are two artifacts against a ceiling that counts in
dozens, and they carry the entire measured cost. Meanwhile the 48 check-suite steps — which D12 does cap —
run in a single `npm run check` invocation, are read by nobody, and cost a reader nothing.

**So D12 binds hardest on the cheapest things and does not bind at all on the expensive ones.** A count
ceiling would have let both documents grow to a thousand lines while refusing a 49th check step.

**The replacement, and it is the same instinct with the right unit: a ceiling on bytes a reader must load
before doing work.** This repository has already proved that unit works, three times: skills discovery from
~15,000 tokens to ~1,070; `session-start.js` from 27,069 bytes to 2,941; `DECISIONS.md` capped at 40,000
bytes with a checker that *"asks the checker, do not read a number here."* That mechanism exists, it is
already in the check suite, and pointing it at `STATUS.md`, `CLAUDE.md`, `BOARD.md` and the pack directory
covers everything D12 wanted plus everything D12's own evidence was actually about.

**What I keep from D12 unchanged:** the goal tree is uncapped, and *think big* is relocated to the depth of
the tree rather than the count of mechanisms. That half is right and this design is built on it.

**Why this is an argument and not a preference:** D12 is `confidence: med` with a live dissent
(`architect:R1:P12`), and it is the only decision on the board whose supporting evidence, read carefully,
measures something the decision does not govern.

---

## Claims this design asserts

Registered as ledger claims when this design is adopted, each with `valid_until`, per Rule 9.

> The ids in this table were proposed by this design and never registered in the ledger; `proposed:` marks them so the ledger lint reads them as proposals, not as citations of claims that exist.

| id | Assertion | verified_by | Expires |
|---|---|---|---|
| `proposed:c-exposure-is-the-center` | Every artifact leaving the building has an `EXPOSURES/` row with a `check_on`, and a run of consecutive `no_data` is reported | command (`check-exposures.mjs`) | 2026-12-02 |
| `proposed:c-verdict-subject-generalises` | `verdict.mjs` binds a non-code artifact by `sha256(bytes)` and cannot confuse it with a diff subject | command (`verdict.test.mjs`) | 2026-12-02 |
| `proposed:c-pack-is-argv-not-agent-file` | No pack adds an agent file; the roster is built by `claude -p --allowedTools` from `packs/*.yml` | command (`check-packs.mjs`) | 2026-12-02 |
| `proposed:c-no-send-on-any-pack` | No pack's `allowed_tools` contains a publish, send or spend tool | command (`check-packs.mjs`) | 2026-11-02 |
| `proposed:c-stall-counter-repaired` | `sinceLastArtifact()` and `windowUsage()` return different values at a 19h stall | command (`usage.test.mjs`) | 2026-10-02 |
| `proposed:c-loop-reaches-workflows` | A `claude -p` process under launchd can invoke a `Workflow` | command (probe) | 2026-10-02 |
| `proposed:c-lid-shut-runtime` | `bin/loop.sh` executes with the lid closed on AC power | command (probe) | 2026-10-02 |

**Three of these are currently `WISH`** — the stall repair, the launchd probe and the lid-shut probe — and
they are the three that decide whether "24/7" is a description or an aspiration. They are cheap, they are
measurable this week, and every one of them is measured before anything in this design is described as
working.
