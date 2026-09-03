# Round 1 — Visionary · future-backwards from September 2028

**Board meeting `startup-os`, first convening. Persona: Visionary. Written 2026-09-02.**
Framing answered: `r0-framing-visionary.md`. Shared context: `r0-shared.md`.

Every position below carries evidence pointing at a real file and section, or is labelled `INVENTED`.
Every proposed rule names the mechanism that would enforce it, or is labelled `WISH`.
I do not re-litigate the nine decisions in `STARTUP-OS.md` §2.

---

## Part I — September 2028

### An ordinary week in which nobody types anything

It is a Tuesday. Nobody has typed since Sunday evening.

At 06:40 the loop wakes. It reads `MISSIONS.yml`, which holds four live goals across two ventures and
one internal one. It does not ask a model what to do next; a deterministic function over declared
fields returns the ready set, and a WIP limit of one at the mission level means three of the four are
simply not eligible today. It picks a move. It mints a task id. Every row, cost record, artifact and
verdict produced in the next ninety minutes carries that id, and in 2028 that is the unremarkable
thing about the system that makes every interesting question answerable.

The worker that picks up the move starts at zero context. It holds a pack: a `tools:` grant, a
`done:` test the founder approved once eleven months ago and has not thought about since, and a
budget. It orients — it has not touched this field in five weeks, so it reads the `FIELDS/` file,
which contains three annotated exemplars and seven extracted rules, two of which are marked
superseded in place with the date and the reason. It makes. It attacks its own output. It looks at
what it made. The done-test fails. It makes again. The done-test passes at rung 2.

Rung 2 means *someone clicked*. Not *it renders*. The distinction is the reason the system is worth
anything in 2028.

By 09:00 there are two rows on the balcony. Not two hundred. The founder reads them on a phone during
a walk, out loud, because every row has a spoken form. One row says a video is ready to publish and
is waiting at a `blocking-human` gate that the machine structurally cannot clear, however autonomous
it has become. The founder says yes. That is the entire day's founder input, and it took forty
seconds.

At 14:00 a different worker hits a wall — a vendor API changed shape. It does not loop. It authors a
block, with a reason and an expiry, which frees the mission slot; the loop moves to the next goal
rather than burning the afternoon on a wall. At 19:00 the stall ceiling fires on a third worker that
has produced 190,000 output tokens since the last durable artifact on disk. It stops itself. That is
not a failure; that is the circling brake working, and in 2028 it fires perhaps twice a week and
nobody notices.

Overnight, the register of shipped things reaches four `check_on` dates. Three resolve. One resolves
`no data`, which is a different value from `not checked`, and the difference is why the register is
still alive after two years instead of quietly dead like every register that conflated them.

### What it has shipped that a person would be proud of

Not "43 mockups." The 2028 artifact list has a shape: perhaps 300 things left the machine, of which
maybe 90 reached rung 2 or above and about a dozen reached rung 4 — someone paid. Two ventures
exist that did not exist in 2026, at least one of which the founder did not personally design; they
described a market and a taste and the machine found the shape. There are landing pages that
converted, short-form videos with view counts attached to claims that expired and were refreshed,
email sequences with reply rates, and a codebase or two.

And there is one artifact class that would surprise a 2026 reader: **the machine's own honest
inventory of what it tried and abandoned.** A `DEAD-ENDS/` store with several hundred entries, each
naming an approach, why it failed, and a command that reproduces the failure. Venture three skipped
six weeks that venture one spent, because something checked before it started.

### What it learned that it did not know on day one

Three things, and none of them is code.

**The founder's taste, as data.** Roughly two hundred preference pairs: two candidates, the pick, one
sentence of why. In 2026 that information was produced several times a week and thrown away at the
end of every session. In 2028 it is the calibration set injected into every judge before it judges,
and it is the single most valuable file on the machine. No vendor sells it. It exists only because
the system ran and someone chose.

**How fields actually work, globally, with expiry.** Not a wiki. A store where "best practice in
short-form video" carries a date and a forced disposition, so the 2027 belief either got refreshed by
someone re-checking or got deprecated. The store is *smaller* in 2028 than its peak, and better.

**Which of its own packs produce surviving artifacts and which produce activity.** Computed, not
opined. Two of the four original pack families turned out to be the spine. One was retired. One was
split.

### How the founder relates to it

The founder has exactly two jobs nothing else can do.

**Taste oracle.** They approve a done-test once per artifact type, and they choose between candidates
when the machine surfaces a fork. Every such choice is captured. They do not review work; they set
the exit and pick between exits.

**Reach authority.** They clear the gates that touch the world irreversibly — money leaving,
a message to a named human, a publish. Not because the machine is untrusted, but because those gates
are a *type*, and a type cannot be auto-cleared however much trust accumulates.

The number that says whether this is working is founder interventions per *surviving* artifact, and
it has fallen for two years. It is reported next to an engagement count, so a fall caused by the
founder losing interest cannot be read as a win.

---

## Part II — Working backwards

### The three-way taxonomy that decides everything

Of the 420-odd options on the table, every one is exactly one of three things, and the whole build
order falls out of sorting them:

| Class | Definition | Test |
|---|---|---|
| **Flywheel** | Output improves as a function of prior output. Turn N is cheaper or better *because of* turns 1..N-1. | Remove it and the system stops getting better, not merely stops doing a thing. |
| **Feeder** | Raises the rate of an input to a flywheel. Linear, valuable, never compounding. | Doubling it doubles throughput once and never again. |
| **Inventory** | Grows, costs to hold, returns nothing until something reads it. | Nothing reads it today, and nothing is scheduled to. |

**Most of what this repo has built and most of what the expansion studies surfaced is inventory.**
134 curated skills with 0 of 18 agents citing one; 2,936 transcripts nothing reads; ~15 MCP servers of
which two are reachable by an agent; 4 workflows of which 1 runs; 7 mission-control views of which 1
acts; 171 session files essentially all about the harness itself
(`00-TERRITORY.md` "Current state, measured on this machine"; `STARTUP-OS.md` §1 table).

**And this repo has invented the one thing that converts inventory into a flywheel: forced expiry
with a compelled disposition.** A claim that comes due must be refreshed, deprecated or waived with a
new date (`CLAUDE.md` Rules table, rule 9; `STARTUP-OS.md` §6). Refreshing deepens the store;
deprecating shrinks it. Either way the store improves as a function of time rather than merely
growing. That mechanism is currently pointed at one object type. **Pointing it at every store is the
single largest strategic move available**, and it is why `STARTUP-OS.md` §6's line — *"the ledger
finally gets a job worth doing"* — is more important than it reads.

### The only true flywheel, and it is not built

Four candidate flywheels exist in the material. Only one of them is load-bearing for the others.

**F1 · The outcome loop.** `artifact → world → recorded outcome → what we do next`.
Today there is no verdict from the world at all (`00-TERRITORY.md` twelve-things #5;
`concepts.md` §4 preamble). This is the flywheel because *four other proposed flywheels read from it
and none can be built before it*: trust promotion requires N moves whose artifacts survived
(`concepts.md` T1, whose own "Fails when" says trust is downstream of the world's verdict and cannot
be built first); bandit allocation across creative directions needs a reward (C34); cost per
*surviving* artifact needs a survival signal (EC2); and the one company metric needs a denominator of
surviving artifacts (SI4). **Sequencing is therefore forced, not chosen.**

**F2 · The archive and the preference corpus.** Keep an elite per behavioural cell rather than one
winner (C2); measure novelty against this project's own corpus, which grows (C31); capture every
founder choice as a durable pair and inject the relevant ones into future judges (C21). Each round
makes the next round's judging better calibrated and the next round's novelty measurable against a
larger base. **This is the direct answer to the founder's stated core complaint** — that the system
loses creativity to playbooks (`00-TERRITORY.md` "What is being built").

**F3 · `FIELDS/`, global.** How a field works is learned once and shared across ventures
(`STARTUP-OS.md` §2 Decision 9; `concepts.md` K3). This is the only cross-venture compounding in the
entire design, and it is what makes venture three cheaper than venture one. It is also the whole
economic argument for calling this a *company* rather than a very fast contractor.

**F4 · Negative knowledge.** `DEAD-ENDS/` with a reproducing command (`concepts.md` N1, N2), and a
tripwire that fires when the same approach is attempted again (C24). This compounds by *removing*
cost rather than adding capability, which is why it will be skipped, and why skipping it is a
mistake.

Everything else is a feeder or inventory. Voice is a feeder — a very good one, because it raises the
rate at which the founder supplies taste, which is F2's input. The balcony is a feeder. A sixteenth
MCP server is inventory. A second model family is a feeder into the quality of F1's judgements, not a
flywheel.

### The first month — what had to be true

**One decision in month one is irreversible and the rest are not: the task id.**
CAST cannot answer "what did this task cost" because there is no foreign key; it needs a heuristic
60-second time-window join between two tables (`STARTUP-OS.md` §8b CAST section; `concepts.md` CT2).
Steal #7 on the consolidated list says it in one line: *cannot be retrofitted*. Everything else in
this document can be added in month nine at ordinary cost. The id cannot. So month one mints ids and
writes rows even when the payload is trivial.

**The first thing that ran unattended was the capability probe, and its job was not to be useful.**
`claude mcp list` reports health per server and is run by nothing (`hands.md` §0.1, §6 item 5). Nine
connected, three unauthenticated, two failing, one unapproved; both second-family model pins retired
six months ago and nothing looked (`hands.md` §0.3, §8 sentence 1). A daily probe is one command with
zero blast radius, and it produces exactly the artifact the system needs first: a row on the balcony,
carrying a task id, written by something nobody typed at. It exercises the loop's home, the row
schema and the id wire under conditions where being wrong costs nothing. Everything unattended after
it reuses that wire.

That is the honest answer to *"what was the first thing that ran unattended, and why that"*: not the
most valuable thing, the thing whose failure was free and whose output was a row.

**The policy seam had to be first among the architectural choices**, because five separately-planned
subsystems — the budget guard, the QA gate, tool grants, approval gates, and the loop's stopping
rules — are one shape: an event fires, typed handlers vote, the strictest verdict wins, side effects
withheld until the verdict is final (`STARTUP-OS.md` §8b Omnigent section, steal #1). Building any of
the five before the seam means building it twice. This is the only architectural decision on the
table that makes *later* work smaller, which is the definition of a compounding architecture choice.

**And the gate types had to exist before the first unattended night.** `blocking` versus
`blocking-human`, where the second is never auto-approved even in full-auto mode (`STARTUP-OS.md` §8b
GSD section, steal #2; `concepts.md` R3). Without a gate class the machine structurally cannot clear,
24/7 is not a feature, it is an unbounded liability. Safety by type, not by policy, is what makes the
2028 Tuesday above boring instead of frightening.

### What turned out to be the spine, and what turned out to be decoration

**Spine — seven things.** The task id (CT2). The policy seam with two gate types (Omnigent #1, GSD
#2). The `world` resolver and the evidence ladder (W1, W2). Expiry applied to every store, not only
claims (X3, on Rule 9's mechanism). The archive plus the preference corpus (C2, C21). `FIELDS/` with
enforced global scope (K3). The birth certificate (X1).

**Decoration — and some of it is expensive decoration.** The 177 verified open-source repositories
are a menu, not a plan (`open-source.md` §0 preamble says so explicitly). The 21-harness abstraction,
the 8-provider sandbox matrix, three native mobile codebases, a 17-table multi-tenant schema — all
correctly rejected already (`STARTUP-OS.md` §8b Omnigent "Reject"). The current size of the skills
library. Six of the seven mission-control views. Breadth of MCP connection beyond what a pack
actually grants: the sixteenth server is worth less than fixing the five broken ones
(`hands.md` §6, free-today items 1–3).

**The one that will look like spine and is not: the persona roster.** Personas argue and never build
(`STARTUP-OS.md` §3, §7). A board that convenes is a feeder into F2 — it produces framed choices for
the founder, which produce preference pairs. A board that convenes and produces nothing the founder
chooses between is inventory with a high token cost. This meeting is the test case, and it should be
measured that way.

### The failure mode that ends this story badly

Two years from now the machine could be excellent and worthless in exactly one way: **it spends the
two years improving itself.** The evidence that this is the live risk is not speculative. 171 session
files, essentially all about the harness (`STARTUP-OS.md` §1 table). Nine phases shipped and one
venture task (`STARTUP-OS.md` §8b, the Omnigent changelog observation). *"No venture work has ever run
through this harness"*, carried as an accepted risk (`CLAUDE.md` Project State, "Known and accepted").

That is not a culture problem and it will not be fixed by intent. It needs a number.

---

## Part III — Positions

Twelve positions. Evidence, mechanism, and confidence on each.

### P1 · The world's verdict is the only true flywheel, and four other proposals are downstream of it

Trust promotion (T1), bandit allocation (C34), cost-per-surviving-artifact (EC2) and the one company
metric (SI4) all read an outcome signal that does not exist. T1's own failure note states the
sequencing: *"trust is downstream of the world's verdict and cannot be built first."* This makes the
build order forced rather than preferred, which is the strongest kind of argument available here.

**Mechanism:** a fifth resolver, `verified_by: world`, in `scripts/lib/resolvers.js` — the
registration shape already exists for five resolvers, and `scripts/ledger.test.mjs` already pins
`unresolved` as distinct from `pass` for every one of them (`concepts.md` W1 "Enforced by").
Rule 10 governs it absolutely: unreachable instrument → `unresolved`, never `pass`.

**Evidence:** `concepts.md` §4 W1 · `concepts.md` T1 "Fails when" · `00-TERRITORY.md` twelve-things #5.
**Confidence:** high. **Territories:** 08, 01, 12.

### P2 · Forced expiry is the repo's one invention that converts inventory into a flywheel, and it should govern every store

A store that only grows is inventory; a store whose entries come due and force a disposition improves
with time. The claim ledger already does this and it is the reason the ledger is the best thing in
the repository. Packs, skills, personas, field files, tool grants and shipped-register entries rot the
same way and faster — *"best practice in short-form video is different in six months"*
(`STARTUP-OS.md` §6). Today expiry points at one object type.

**Mechanism:** `retire_on` on every governed artifact, resolved by `claim-freshness`'s exact
shape — fails once the date passes, refuses a waiver with no `until`, and a lapsed waiver fails
harder than none (`concepts.md` X3 "Enforced by"; `CLAUDE.md` Rules table rule 9). New object type,
existing mechanism, no new subsystem. **Known failure:** mass expiry in a quiet month produces fifty
simultaneous decisions and everything is waived in a batch — stagger dates at creation.

**Evidence:** `STARTUP-OS.md` §6 · `concepts.md` X3 · `CLAUDE.md` Rules table rule 9.
**Confidence:** high. **Territories:** 12, 05, 04, 02.

### P3 · The task id is the only irreversible decision in the first month

CAST cannot answer what a task cost, because there is no foreign key and the join is a heuristic
60-second time window. The consolidated steal list marks it *cannot be retrofitted*. Every other
mechanism in this document can be added in month nine at ordinary cost; this one cannot be added at
all without rewriting history.

**Mechanism:** the dispatch wrapper refuses to dispatch without an id; the row schema requires it; a
check in the suite asserts no row lacks one (`concepts.md` CT2 "Enforced by"). Parent/child pair from
the start, because adding a hierarchy later has the same retrofit problem.

**Evidence:** `STARTUP-OS.md` §8b CAST section · `STARTUP-OS.md` §8b steal list #7 · `concepts.md` CT2.
**Confidence:** high. **Territories:** 07, 10, 12, 13.

### P4 · The first unattended run should be the capability probe, because its job is to mint a row, not to be valuable

The strongest argument for it is not its output. It is that it exercises the loop's home, the row
schema and the id wire with zero blast radius, so the parts that cannot be retrofitted get their
first real traffic under conditions where being wrong is free. Its output is genuinely useful anyway:
three connected servers need re-auth, two fail outright, both second-family model pins are retired,
and the one command that reports all of it is run by nothing.

**Mechanism:** `claude mcp list` plus the reachability probe (`concepts.md` H2) on a Claude-native
scheduled task, writing a balcony row. Territory 03 has no oracle today and this is the cheapest one
available (`hands.md` §0.1 closing note).

**Evidence:** `hands.md` §0.1 · `hands.md` §6 item 5 · `hands.md` §8 sentence 1 · `STARTUP-OS.md` §8
question 2. **Confidence:** med-high. **Territories:** 03, 11, 10.

### P5 · The preference corpus is the company's moat by 2028, and today it is destroyed at the end of every session

Every time the founder picks A over B, that information is currently lost when the session ends
(`concepts.md` C21 "Problem"). Two hundred such pairs, each with the pick and one sentence of why, is
a calibration asset no vendor can sell and that exists only as a by-product of running. It is the
thing that makes judging get better rather than merely happening again.

**This does not contradict §7's "taste enters once, at the top."** §7 forbids re-asking the founder
for taste at every step; C21 forbids *forgetting* what they already said. The two are compatible and
the spec does not currently say so — worth recording, because read carelessly §7 forbids exactly the
mechanism that would make taste compound.

**Mechanism:** the balcony's approve/redirect surface writes the pair, since it is the only place a
founder choice happens; the judge dispatch injects the N most relevant pairs and a test asserts the
injection (`concepts.md` C21 "Enforced by"). **`WISH` on the "why" being accurate** — a one-line
rationalisation may not be the real reason and nothing can check that. Pairs expire, per P2.

**Evidence:** `concepts.md` C21 · `STARTUP-OS.md` §7 "Taste enters once".
**Confidence:** med-high. **Territories:** 05, 08, 14.

### P6 · `FIELDS/` global scope is the only cross-venture compounding in the design, and it is what makes this a company

Decision 9 already settles the split. What has not been said is why it matters more than it looks:
it is the entire mechanism by which venture three is cheaper than venture one. Without it, each
venture pays full price to learn the same field, and the system is a fast contractor rather than a
company that accumulates.

Decision 4 — built for this Mac, for the founder — does not conflict with this. Global here means
*across the founder's ventures*, not across customers.

**Mechanism:** the ledger already carries `scope` on every claim and already fails a `global`/`project`
claim with no expiry, so the scope concept is live; add a lint that a `global` field file names no
project proper noun, with a marked example block excluded (`concepts.md` K3 "Enforced by").
Field files carry three annotated exemplars, not just rules (`concepts.md` C16).

**Evidence:** `STARTUP-OS.md` §2 Decision 9 · `STARTUP-OS.md` §6 memory table · `concepts.md` K3 ·
`concepts.md` C16. **Confidence:** med-high. **Territories:** 04, 05, 14.

### P7 · The archive is the creative asset; the winner is just the cell we shipped from this time

The founder's complaint is that the system loses creativity to playbooks. The fix is not a better
playbook, and it is not a better judge. It is refusing to throw away five candidates to keep one.
Keep an elite per behavioural cell; the archive is the durable asset (C2). Measure novelty against
this project's own corpus, which grows, so the measure gets more meaningful over time (C31). Reserve
a fraction of each round for candidates judged only on distance (C3).

**And the repo's one creativity mechanism currently uses the selector its own evidence rejects.**
`design.js` sums four 0-10 scores into a `total` and sorts, against §7's stated rule *"union, never
average"* and a measured design judge at 0.543 against a panel only 0.741 self-consistent
(`concepts.md` "How to read this", the finding stated before §1). Smallest diff, largest correction.

**Mechanism:** an `archive/` directory per project, one file per occupied cell; a suite check that a
design round producing no new occupied cell records `filled: 0` rather than success; descriptors
declared in the pack so `schema-lint.js` can refuse a QD phase with no descriptors — the same shape
as its existing "declares `mcpServers` that no config backs" rule (`concepts.md` C2 "Enforced by").
Selection is `select()` in `scripts/lib/` with unit tests: eliminate any candidate with a P1 finding,
prefer fewest distinct P2s, break ties by archive distance (`concepts.md` C17 "Enforced by").
**Known failure:** bad descriptors. If both axes proxy quality, every cell fills with the same thing
and the archive is theatre.

**Evidence:** `concepts.md` C2 · `concepts.md` C17 · `concepts.md` "How to read this" (the `design.js`
finding) · `STARTUP-OS.md` §7 "Union, never average". **Confidence:** med-high. **Territories:** 04, 08, 12.

### P8 · The policy seam is the only architectural choice that makes later work smaller

Five planned subsystems are one shape. Build the seam once and every future guardrail — including the
ones nobody has thought of — is a small typed function rather than a new subsystem. That is
compounding at the architecture layer, and it is the reason this is the top item on the consolidated
steal list rather than an implementation detail.

Two independent systems arrived at the same governing rule from opposite directions: Omnigent's cost
gate fails closed when a model has no catalogue price, which is this repo's Rule 10 applied to money.
That convergence is the strongest evidence available that the rule is right.

**Mechanism:** the seam is built on the eight hook events currently unused, with `pre-tool-use.sh`
untouched — the founder settled this in session 2 (`r0-shared.md`, founder decisions since the spec).
Precedence in code, not prose: first DENY short-circuits, ASK accumulates, a later DENY still wins,
side effects only on final ALLOW or human-approved ASK (`STARTUP-OS.md` §8b Omnigent section).

**Evidence:** `STARTUP-OS.md` §8b Omnigent section · `STARTUP-OS.md` §8b steal list #1 · `r0-shared.md`
founder decisions. **Confidence:** high. **Territories:** 09, 13, 01.

### P9 · Two-tier gates by type are what make 24/7 possible at all

There is no unattended night without a gate class the machine structurally cannot clear, however
autonomous it becomes. Safety by type rather than by policy is the difference between a 2028 Tuesday
that is boring and one that is frightening. Note that trust (P1's downstream) makes gates *rarer*; it
must never make `blocking-human` *clearable*.

**Mechanism:** the gate kinds already exist. `.claude/gates.yml` declares four gates, one
`kind: command` and three `kind: human`; a `human` gate has no `run:` and writing one is refused;
`scripts/gates.test.mjs` is blocking via `npm run test:playbooks` (`CLAUDE.md` Project State, Wave 2
bullet, item 2.2). The addition is that `blocking-human` is never auto-approvable in full-auto mode
(`STARTUP-OS.md` §8b GSD section).

**Evidence:** `STARTUP-OS.md` §8b GSD section · `STARTUP-OS.md` §8b steal list #2 · `concepts.md` R3 ·
`CLAUDE.md` Project State Wave 2 item 2.2. **Confidence:** high. **Territories:** 09, 01, 02.

### P10 · The birth certificate protects the flywheel's denominator, and it is the only proposal that prevents rather than detects

Built-and-never-wired is present in four of four studied systems, in code, today. This repo diagnoses
the disease better than anyone studied and has not taken its own medicine. Every existing cure — the
dead-path check, `PS-WORKFLOW-CONTAINMENT`, `check:curation`, stop condition 7 — detects after the
fact. X1 prevents at merge.

The flywheel connection is the part worth stating: every unwired artifact inflates the count of what
the system "has" while contributing nothing to what it does. It corrupts the denominator of every
metric that matters, including SI4.

**Mechanism:** a CI check on the diff — for each added artifact of a governed type, require a
reference from a governed caller set. `scripts/check-registration.mjs` already implements the hard
half (`concepts.md` X1 "Enforced by"). **Known hole, and it is real:** a caller can be a stub that
satisfies the check and invokes nothing. X2's last-use telemetry is what closes it — the caller must
eventually *fire*, not merely exist — and X2 needs a chokepoint, so instrument the dispatch harness,
not each artifact.

**Evidence:** `STARTUP-OS.md` §8b "The meta-finding" · `concepts.md` X1 · `concepts.md` X2 ·
`concepts.md` §17 item 1. **Confidence:** high. **Territories:** 12, 02, 04.

### P11 · The stop condition nobody will set: harness work versus venture work

This is the position I would fight hardest for, because it is the only one that can detect the way
this story ends badly. 171 session files essentially all about the harness. Nine phases and one
venture task. *"No venture work has ever run through this harness"*, recorded as an accepted risk so
that it is a choice rather than an oversight — which is honest, and which is also exactly how a
system spends two years polishing itself.

A ratio, reported monthly, makes the drift visible while it is still cheap to correct.

**Mechanism:** a monthly count over session-file frontmatter, classifying each by the paths it
affects, *reading* `scripts/lib/classifier.js` rather than paralleling it — `scripts/classify.mjs`'s
own header warns that two implementations of risk classification will disagree and you find out
during the incident, and `concepts.md` A5 forbids a second one. N consecutive months of harness work
exceeding venture work is a finding, not an automatic action.

**Evidence:** `STARTUP-OS.md` §1 table (171 session files) · `CLAUDE.md` Project State "Known and
accepted" · `STARTUP-OS.md` §8b Omnigent changelog observation · `concepts.md` A5.
**Confidence:** high. **Territories:** 12, 14, 01.

### P12 · Money is the axis with no mechanism, and a 24/7 loop is exactly what turns that into a real loss

Every tier this repo has is about reversibility or blast radius. Ad spend, GPU-seconds and postage
need a *rate* limit, and nothing here can express one. `git revert` does not refund. The riskiest
capabilities are already granted — publishing to TikTok, sending mail as the founder, remote code
execution and an authenticated Chrome are live right now — while the cheapest safe ones, PostHog,
Sentry, a read-only Stripe key, are not connected.

A loop that walks relentlessly until a goal is met, holding a live ad account, is the specific
combination that turns a missing mechanism into a bill.

**Mechanism:** absolute rate limits on outbound action, independent of reasoning (`concepts.md` R5),
expressed as policy handlers on the P8 seam; reversibility and blast radius declared on the tool
grant rather than the call (`concepts.md` R2); dry-run by default on outbound tools, following #116's
shape where an unknown flag is refused instead of performing the non-dry action (`concepts.md` R4).
Meta Ads is *"the best possible forcing function for the risk tier, and the worst possible thing to
connect before that tier exists"* (`hands.md` §6 item 13) — connect it after, never before.

**Evidence:** `hands.md` §8 sentence 3 · `hands.md` §8 sentence 2 · `hands.md` §6 item 13 ·
`concepts.md` R5, R2, R4. **Confidence:** med-high. **Territories:** 09, 13, 03.

### P13 · Negative knowledge is the cheapest compounding asset and the one most likely to be dropped

It compounds by removing cost rather than adding capability, so it never looks urgent and it never
demos well. It is also the only asset that makes a *second* venture structurally faster than the
first in the short run, before `FIELDS/` has depth. There is essentially one small implementation in
the world, under MIT, with a gate that warns before an agent repeats a failed fix.

**Mechanism:** `DEAD-ENDS/`, a file per failed approach (`concepts.md` N1); negative claims of the
form "X does not work because Y" carrying a reproducing command, which makes them resolvable by the
existing `command` verifier rather than by anyone's memory (`concepts.md` N2); help requests carry
"what I tried", so negative knowledge is a by-product of asking rather than a separate discipline
(N3). **Known failure:** a dead end recorded once and never expired becomes a false constraint —
apply P2, since "X does not work" rots as fast as "X works".

**Evidence:** `concepts.md` §6 N1, N2, N3 · `open-source.md` §1 item 5 (`riponcm/projectmem`) ·
`open-source.md` §16 item 5. **Confidence:** med. **Territories:** 05, 12, 04.

### P14 · Every governed artifact declares whether it compounds, and inventory must name its reader

This is my own contribution rather than a re-ranking of someone else's mechanism, and it
operationalises the taxonomy in Part II. The endemic failure is not that people build unwired things;
it is that nothing forces the author to say, at creation, which of the three kinds of thing they are
building. "Inventory" is a legitimate answer — a corpus, an archive, a log — but inventory that names
no reader is the exact object this repo keeps producing.

**Mechanism:** a `compounds: flywheel|feeder|inventory` field on every governed artifact, checked by
`schema-lint.js`; `inventory` additionally requires `read_by:` naming a real caller, resolved by the
dead-path check `check-registration.mjs` already performs. The declaration is *falsifiable* rather
than merely stated: X2's last-use telemetry contradicts a `flywheel` declaration with zero events in
90 days, and that contradiction is the retirement queue's entry criterion.
**Known failure, and it is the obvious one:** everyone declares `flywheel`. X2 is the only reason the
field is not decoration, so this position is void without P10's second half.

**Evidence:** `INVENTED` — the taxonomy and the field are mine. The mechanisms it composes are real:
`concepts.md` X1, `concepts.md` X2, `STARTUP-OS.md` §8b "The meta-finding".
**Confidence:** med. **Territories:** 12, 02, 04.

---

## Part IV — What must be true, what I refuse, and the order

### What must be true for this thesis to hold

1. **The loop actually runs unattended somewhere.** `STARTUP-OS.md` §8 question 2 is open; the
   control plane structurally cannot spawn — `crosscheck.test.ts` bans a shell call under `server/`
   at zero exceptions, deliberately, having closed three RCEs. The proposed home is a Claude-native
   scheduled task beside the server. If no home is agreed, every position here is a plan for a system
   that still begins where a person types.
2. **At least one instrument reports a world outcome.** Without one, P1 returns `unresolved` forever
   and the sequencing argument becomes an argument for waiting.
3. **The founder authorises the three founder-only permissions, or the loop runs without a spend
   brake.** `budget-guard.js` is Decision 8 already built, verified by execution, and registered
   nowhere; registering it edits `.claude/settings.json`, which is `irreversible` tier and denied to
   the write tools (`STARTUP-OS.md` §1b). None of the three is authorised yet (`r0-shared.md`).
4. **The synthetic first mission actually runs, and its done-test names a rung above 0.** Decision 7
   is the end-to-end acceptance test. A rung-0 pass reported as success is how the machine learns to
   lie to itself for two years.
5. **The founder keeps choosing.** F2 has no input if the balcony surfaces no forks. A system that
   never asks the founder to pick between two things produces no preference corpus and its judges
   never improve.

### What I refuse

- **A memory built over the 2,936 transcripts.** Retrieval cannot distinguish a corrected belief from
  a current one, so it resurrects exactly the errors the supersession discipline exists to bury
  (`concepts.md` A4). Take them as instrumentation — a regex correction classifier, ~50 lines — never
  as memory (`concepts.md` M1, M2; `STARTUP-OS.md` §8b Metaswarm section).
- **Any score summed from judge outputs, and any weights on voices.** `concepts.md` A1, A2, A3.
  This includes the `total` field in `design.js` today.
- **A second implementation of risk classification.** Extend `scripts/lib/classifier.js`; never
  parallel it. It has already happened here once (`concepts.md` A5; `CLAUDE.md` Risk-Tiered QA Gate).
- **The 177-repository menu as a build plan.** `open-source.md` §0 says it is deliberately unfiltered
  and nothing in it is decided. Adopt only where a named gap has no in-repo answer, and only behind
  the birth certificate.
- **Enterprise breadth.** 21 harnesses in 4 modes, the 8-provider sandbox matrix, mobile codebases,
  multi-tenant schemas (`STARTUP-OS.md` §8b Omnigent "Reject").
- **Connecting any write-capable money or publishing hand before the reach tier and rate limits
  exist.** `hands.md` §6 item 13 states the trap precisely.
- **Trust as a field anyone can set.** Any trust system where trust can be asserted is a trust system
  that will be asserted (`concepts.md` T1). Recompute at dispatch or do not have trust.

### Build order — forced, not preferred

Each step is forced by a dependency in the evidence, not by taste. Where a step is merely preferred,
I say so.

1. **Task id and row schema.** Forced: not retrofittable (`concepts.md` CT2; `STARTUP-OS.md` §8b CAST).
2. **The policy seam, with `blocking` and `blocking-human` as types.** Forced: five subsystems are one
   shape, and building any of them first means building the seam twice (`STARTUP-OS.md` §8b
   Omnigent, steal #1 and #2).
3. **`world` resolver plus a `rung:` field on every done-test.** Forced: T1, C34, EC2 and SI4 all read
   it and none can precede it (`concepts.md` W1, W2, T1).
4. **First unattended run — the capability probe writing a row.** Forced by risk shape rather than by
   dependency: it exercises 1–3 with zero blast radius (`hands.md` §0.1, §6 item 5).
5. **Register `budget-guard.js` as the loop's circling brake.** Forced before any relentless walking:
   the stall ceiling is the only detector of repetition anyone has, and the field's two reference
   loops have none (`STARTUP-OS.md` §8b "Anti-repetition is unsolved"). Founder-only action.
6. **Missions, the loop, the synthetic first mission.** Decision 2 and Decision 7.
7. **Archive and preference pairs.** Forced to follow 6: there is no founder choice to capture until
   the machine produces forks (`concepts.md` C2, C21).
8. **Trust.** Forced to be last (`concepts.md` T1 "Fails when").

Preferred rather than forced, and I would take them early anyway because they are cheap: the birth
certificate (P10), `DEAD-ENDS/` (P13), and the harness-versus-venture ratio (P11).

### Open questions I cannot settle from here

- **Where the loop lives** is genuinely open (`STARTUP-OS.md` §8 question 2). My positions assume the
  scheduled-task proposal; if it is rejected, P4's sequencing argument survives but its vehicle does
  not.
- **What a "move" is** (`STARTUP-OS.md` §8 question 4) determines the fresh-context boundary and what
  a balcony row means. The founder's "goal-sized rows, 2–4 a day" constrains it from the top; nothing
  constrains it from the bottom.
- **Whether the second model family survives contact.** `gemini` is installed and never executed and
  the sandbox hides it for a config-read reason; both Ollama pins are retired but the account
  authenticates (`hands.md` §0.3). One test settles it and it spends the founder's Google quota.
- **Whether one-founder volume can ever populate F1.** See the counter below.
- **Whether the persona board is a feeder or inventory.** This meeting is the first data point.

---

## Part V — The strongest argument against my own thesis

**The outcome loop may never produce a signal at one-founder volume, in which case I have sequenced
the entire company behind an instrument that reports `unresolved` for eighteen months.**

The evidence for this counter is in the same documents I am citing, and it is not weak. W1's own
failure note says most instruments are third-party APIs with their own auth and will be unreachable
most of the time, so the system *"will report `unresolved` far more often than `pass`, which is
honest and will feel like failure."* W4 says that at one-founder traffic volumes nearly everything is
below the minimum detectable effect, so the mechanism mostly says "cannot tell". SI3 states plainly
that A/B on the system's own prompts is *"probably not achievable"* at this volume. Put together:
the world may simply not answer a company of one, often enough, for anything to compound.

If that is right, then P1 is wrong in an expensive way. Trust never promotes, so everything stays
`supervised` forever and the 2028 Tuesday above never happens. Bandits have no reward. SI4 has a zero
denominator and cannot even be computed. And I will have argued for waiting on a signal, which is the
most costly kind of error a visionary can make.

**The competing thesis is coherent and I want it stated fairly:** at n=1, the founder *is* the only
oracle that reliably answers. Compound on founder preference (C21) and field knowledge (K1, K3, C16)
instead. Both signals arrive on every single cycle, with no third-party auth, no traffic threshold
and no power calculation. That builds a system that gets better at *pleasing this founder* and at
*knowing fields*, which is a smaller ambition than a company that learns from the world — and it is
achievable now rather than conditionally.

**My rebuttal, and I do not think it fully closes the gap.** Two rungs of the evidence ladder are
reachable at n=1 without any instrument: rung 0, it renders, and rung 1, a stranger understands it in
five seconds. W5 adds a third that is free and mechanically observable for internal work — did the
founder use it twice, unprompted, more than 48 hours apart. So F1 can turn slowly on rungs 0–1 and W5
while rungs 2–4 wait for traffic, and the ladder's real value is that it stops a rung-0 result being
reported as a rung-2 claim, which is worth building even if rung 2 never arrives.

But that is a slower flywheel than I have argued for, and the honest version of my thesis is
conditional: **the outcome loop is the only true flywheel, and at this volume it may turn too slowly
to be the thing everything else waits on.** If the board concludes that, the correct response is not
to drop P1 — it is to build F2 and F3 in parallel rather than downstream, and to accept that trust
(P1's main dependent) simply does not get built in the first year.
