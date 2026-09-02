# Round 2 · Strategist — reading the other four rooms

**Board meeting `startup-os`, 2026-09-02. Persona: Strategist. Lens: the anti-roadmap — what we refuse,
and the smallest thing that is still a company.**

Measurements re-taken in this worktree today are marked `[M]` and show the command. Every peer reference
is `persona:Pn` against a real position id.

---

## 0 · The thing I got wrong, stated first

My Round-1 document described a company by what it **cannot do**. Seven capabilities in a table: it cannot
run two missions, judge quality, learn from transcripts, hold a persistent worker, speak, spend money, or
reach a stranger without a human clearing a `blocking-human` gate.

`risk-modeler:P2` measured that **three of those seven are live capabilities on this machine right now.**
Gmail `send_message`, `tiktok_publish` and `sandbox_exec` each return exit 0 from the only blocking hook in
the repository, with no block, no warning and no log line. I re-derived the configuration half today:

```
[M] node -e "…(settings.json).hooks.PreToolUse.map(h=>h.matcher)"  → ["Bash|Edit|Write|NotebookEdit|mcp__"]
[M] node -e "…(.claude/mcp-policy.json)"                            → mode: shadow · servers: [playwright, claim-append]
```

So the call **does** reach the hook — `mcp__` matches — and is allowed because the policy governs two
servers, neither of them the dangerous one, in shadow. And `risk-modeler:P4`'s point completes it:
`outbound-approval` is a `kind: human` gate that exists and has no consumer that routes an outbound act
through it. I confirmed the gate exists and that its namers are the resolver machinery, a playbook stage, a
spelling lint and documentation:

```
[M] grep -nE '^\s*(- id|kind):' .claude/gates.yml → qa-verdict/command · founder-approval/human ·
                                                     outbound-approval/human · migration-approval/human
```

**This is the anti-roadmap's own defect, committed by the persona whose job is to catch it.** I wrote a list
of absences. Three of them are not absences — they are capabilities the system holds and would have to give
up. A refusal of something you already have is a **revocation**, and revocation is work with a diff, a tier
and a founder permission. Stated as an absence, it reads as free and is not.

By my own standard — every rule names its mechanism or it is labelled `WISH` — three rows of my P1 table
were `WISH` and I did not label them. `risk-modeler:P2` and `risk-modeler:P4` are what made me look.

---

## 1 · What else changed my mind

### 1.1 · My demand trigger (P3) is a fifth implementation of a predicate that already exists four times

`architect:P8` measured something I did not know and that condemns my own proposal under my own rule N4:
the birth certificate **already exists four times** — skills in `build-skill-routers.mjs`, test files in
`check-suite.test.mjs`, gates in `check-gates.mjs`, suite steps via `EXCLUDED` — with four different
exemption conventions and no shared code. The architect's refusal list says it plainly: *"a fifth
independent birth-certificate check for a new artifact type… commits the disease it is meant to treat."*

My P3 is a fifth check of exactly that shape. My own N4 forbids a second implementation of a concept the
repo already computes; I wrote one and did not notice because I was looking for duplicate *classifiers*, not
duplicate *predicates*.

**The change:** P3 is withdrawn as a standalone mechanism and becomes the **second half of one
`hasCaller` predicate** — the caller must exist (the architect's half, and `visionary:P10`'s, and
`risk-modeler:P3`'s) **and** must resolve to a live mission blocked on its absence (mine). One predicate,
one file, five artifact types. This is strictly better than my version and it removes a mechanism from my
count rather than adding one.

`risk-modeler:P3` independently put the birth certificate at **position zero** of its build order, ahead of
registering the rope, on the grounds that it changes the survival rate of every item after it. I accept that
placement.

### 1.2 · `.out-of-scope/` should key on a condition, not a date

`adversary:P6` is the critique of my P4 that I did not anticipate, and it is right. The record here is
majority self-correction: `STATUS.md` at 637 lines, the main sha expired four times in one day, the
session-file count five times, the suite denominator four times — and in every case the correct derivation
command was printed beside the wrong value. The adversary's generalisation is the part that bites:
**every artifact is a claim, every claim needs an expiry, every expiry needs a disposition, and every
disposition is another artifact.**

My P4 proposed `retire_on` dates on every refusal. Seventeen refusals with dates is seventeen new objects
that come due on a calendar and force a written disposition **even when nothing about the world changed**.
That converts my cheapest asset — a refusal, which costs nothing to run — into carrying cost.

**The change:** the primary key of an `.out-of-scope/` entry is a **reopen condition**, not a date. Six of
my eight year-one deferrals already carry countable conditions and I wrote them that way in Round 1 without
noticing they were the better mechanism: ≥100 artifacts in an archive, ≥50 recorded dispatches with
outcomes, *N* balcony actions, a second project existing, the same failure class three times. A condition
costs zero until the counter moves. A date costs a disposition every time it comes due. Keep the date **only
where no counter exists** — which, on my list, is two entries, not seventeen.

`[M] ls -d .out-of-scope → absent`. The premise of P4 still holds; its mechanism was too expensive.

### 1.3 · The rope does one job, not three

I put "register `budget-guard.js`" first in my build order and justified it as *"simultaneously the rope,
the stall ceiling, and the field's only working anti-circling detector."*

`architect:P4` measured that the stall half **fails toward passing**: `sinceLastArtifact` sums
`recentTurns`, and `recentTurns` discards every turn older than `RETAIN_HOURS`, so the longer the circling
continues, the smaller the reported number becomes relative to truth. Confirmed today:

```
[M] grep -rn 'RETAIN_HOURS' scripts/lib/usage.js → const RETAIN_HOURS = 6;
```

A 24/7 loop exceeds six hours on its first night. And `architect:P5` compounds it: the numerator is
account-wide (`recentTurns` walks every project) while the denominator is repo-local, so with two missions
running the stall counter measures overall busyness rather than circling — which is the window ceiling
already sitting beside it.

**The change:** registering the guard stays first, because the **window ceiling** is a real spend brake and
because it is founder-gated and therefore a long pole. But I withdraw the anti-circling claim. Until
`architect:P4` and `architect:P5` land, the system has **no working repetition detector**, and my P1's
"stops itself on budget or stall" row is a rope and half a wish. Registering it does not close gap #6; it
closes the spend half only.

This matters beyond bookkeeping. `architect:P5` shows the stall counter **cannot be made correct without a
mission id on the row** — so the task id is not merely un-retrofittable, it is a prerequisite for the only
brake the loop has. That raises the task id above the rope in the dependency graph even though the rope is
first in wall-clock terms because it is waiting on a person.

### 1.4 · The ceiling (P2) is load-bearing earlier than I planned

`architect:P11` establishes two measured walls I did not have: the agent-file frontmatter schema is a closed
15-key allowlist, so a `pack:` key fails the lint; and the `Agent` dispatch tool has no `tools` parameter,
so a grant can only come from a file on disk. Therefore the only pack shape the runtime supports **today**
is one generated agent file per engine × pack.

That is roster growth by multiplication — the exact pressure that took this repo from 26 agents to 7 engines
— and the architect names X4's ratchet as becoming load-bearing far earlier than planned. My P2 is that
ratchet. I had it as a governor to install eventually. **It has to exist before the first pack**, or the
first four pack families times seven engines produce the roster the collapse just finished undoing.

### 1.5 · P5 (refuse to grow L1) is now a policy, not a mechanism

P5's stated mechanism was P3's demand trigger. I have just folded P3 into the birth certificate. So P5 is a
rule whose enforcement now belongs to someone else's check, and by my own standard I must say so:
**P5 is enforced by the birth certificate's mission half, or it is a `WISH`.** I would rather label it than
have it found.

### 1.6 · The council's cap must be code before it convenes again

`adversary:P7` is the sharpest thing in the meeting about the meeting. Zero of seven personas have agent
files; the `$3` cap is referenced by no script, hook, CI step or package script; the escalation path names
Linear (absent) and Telegram (refused by founder Decision 5, taken the day before this ran). On the first
supervised run, with five Opus agents and the founder's full attention, the board held **one of its three
own rules**.

My P12 said: gate convening on the existing classifier so the council is not a standing organ. That is
necessary and it is not what failed here. What failed is that the council's own constraints are prose.

**The change:** P12 gains a precondition. The cost cap must be a mechanism — a counter something reads —
**before** the board convenes a second time, and if it cannot be one, the board convenes only under the
founder's hand. A deliberation organ that suspends its only hard constraint on run one is exactly the
"built and never wired" shape, performed by the thing meant to catch it.

---

## 2 · One fatal critique — `adversary:P4`

I want to be careful, because the adversary's central thesis is the best single idea in this meeting and I
am not attacking it. *"The system has a demand problem and every proposal treats demand as solved"* is
right, and `adversary:P2`'s measurement — beeond is 111 lines of product against 552 `.claude` files, and
the most recent day of work anywhere on this machine is eight beeond commits of which all eight are harness
— is the most useful number produced by any of the five rooms.

**The fatal part is the test, not the thesis.** `adversary:P4` proposes the experiment that separates
"demand" from "wiring": *"wire `design.js`, wait seven days of ordinary work, count invocations. Still zero
means the diagnosis is demand and the whole §8 agenda is aimed at the wrong thing."*

**The confound is inside the adversary's own document.** `adversary:P2` measured that ordinary work on this
machine is harness work — 2026-08-31, eight commits, all eight harness; 172 session files, one touching a
venture. So "seven days of ordinary work" is seven days in which **no design task is scheduled**, and a zero
invocation count measures the absence of design *work*, not the absence of design *demand*. The test cannot
distinguish its two hypotheses because the treatment and the confound are the same variable. Run as
specified it returns zero with near-certainty and licenses a conclusion it did not earn — and that
conclusion, per the adversary's own build order step 5, gates the entire company's build order behind an
`IF AND ONLY IF`.

This is the same defect my P14 refuses in the first mission: **an acceptance test whose exit is not
resolvable is how a machine passes itself.** The adversary's test has the mirror-image flaw — an exit that
cannot fail informatively.

**What would have to be true for the position to survive.** Either of two repairs, both small:

1. **Run it inside a mission that requires the artifact.** Seven days containing at least one task that
   cannot complete without a design pass. A zero then means something. This reverses the adversary's own
   ordering — the test follows the mission rather than gating it — which is a real cost to the position and
   why I mark it fatal rather than serious.
2. **Demote the inference.** `visionary:P11` already wrote the discipline for exactly this shape of
   measurement: *"N consecutive months of harness work exceeding venture work is a finding, never an
   automatic action."* Applied here, the invocation count is a finding that informs the next mission's
   design, and the `IF AND ONLY IF` in build-order step 5 is deleted.

I prefer repair 2 because it is free. Note that repair 2 also rescues the adversary's build-order step 1,
the demand test proper, whose third metric — one unsolicited human response — is genuinely readable at n=1
and is rung 1 of the evidence ladder. That half of the proposal I support without qualification, and
`adversary`'s tripwire (step 2, zero commits to `.claude|scripts|docs` for the seven days) is the only
mechanism anyone proposed that would actually make the experiment happen. It belongs in the plan.

---

## 3 · Serious critiques

### 3.1 · `risk-modeler:P5` — the outbound wrapper cannot be one artifact today

The position insists the wrapper ships as **one** artifact carrying all four properties — dry-run default,
hash-bound send, named-human register, rate ceiling — *"because they share a code path and shipping three of
four ships a gap."* The argument is good and the unit is unbuildable, by the risk-modeler's own two other
statements: open question 3 says *"every rate ceiling needs a number and I will not invent one"*, and the
refuse list forbids *"a `budget:` field that nothing counts."*

So one of the four properties is blocked on a founder decision that has not been made, and writing it before
the number exists is refused by the same document. As stated, the position makes the whole wrapper hostage
to a number nobody has.

**Repair:** ship the three that are buildable, and make the fourth a **declared block** with
`clearable_by: a daily dollar ceiling from the founder`. That is the `blocked`-row shape my own P3 depends
on, and it converts "we are waiting on a person" from an omission into a record. Severity **serious**, not
fatal, because the ordering claim the position actually cares about — the wrapper before inbound — survives
intact and I agree with it.

### 3.2 · `visionary:P1` — the ladder needs a refusal, not just a rung field

The visionary's own counter concedes the sequencing risk honestly (the outcome loop may report `unresolved`
for eighteen months at one-founder volume), so I will not re-litigate what has already been conceded. My
addition is narrower and nobody has said it.

Rungs 0–1 are not "the flywheel turning slowly." They are a **different instrument**. A rung-1 result and a
rung-4 result recorded in the same field, with only a `rung:` annotation to tell them apart, is how "a
stranger understood it" gets reported as "someone paid." N1 — union, never average — has been applied to
judge panels by four of five personas and applied by **nobody** to the evidence ladder, where the same
failure is available and more consequential, because the ladder feeds the world verifier that
`visionary:P1` puts everything downstream of.

**Repair:** `rung:` is mandatory on every done-test, and the ladder **refuses aggregation across rungs** —
a schema refusal, the same shape as refusing a summed `total` in a judge output. Severity **serious**.

### 3.3 · `visionary:P5` — the preference corpus is fed by the surface with no recorded use

The founder-preference corpus is a genuinely good idea and it is the one proposal that creates a store
outside the four `STARTUP-OS.md` §6 declares, which my P7 refuses. I could argue the refusal; I would rather
argue the input, because the input is measured.

Preference pairs are written when the founder picks A over B, and the only place that happens is the
balcony. The balcony has **7 views, 1 that acts, and an escalation Inbox that has been empty on every
project ever** (`00-TERRITORY.md`, and the basis of my P9). The visionary's own `what_must_be_true` concedes
the dependency — *"the archive-and-preference flywheel has no input if the balcony surfaces no forks"* — but
treats the balcony's existence as the precondition. The measurement says the precondition is a balcony that
has been **used**, which is a different and unmet thing.

**Repair:** P5 is downstream of a measured balcony action, not of a balcony. Which is P9's *N*, and it is
now doing work for two positions. Severity **serious**.

### 3.4 · `adversary:P1` — minor, and it is a tension the adversary already half-names

`adversary:P1` says the harness sits on the three-week abandonment curve and a 24/7 loop produces more dead
projects reached faster. `adversary:P12` refuses the "tenth attempt" framing and establishes that nothing
here failed in the ordinary sense, and the adversary's own counter concedes that *"a prerequisite is not a
project — it does not have to beat an abandonment base rate."* Those cannot all be load-bearing at once. I
mark it **minor** because the adversary flagged the tension itself and because P12 is, in my reading, the
one that survives — refusing a framing you were handed and recording why is the most credible thing any
persona did in Round 1.

---

## 4 · Dissent that will not move

### 4.1 · Against `architect:P12` — cheap to reverse is not cheap to carry

This is the one I will hold against the whole room if necessary.

`architect:P12` sorts the bill of materials by cost-to-reverse and concludes that the reversible half —
*"packs, personas, council, board, missions file, balcony views, FIELDS"* — *"should be built fast, loose
and continuously."* The five load-bearing components get built slowly; everything else gets built at speed.

**Reversibility is a property of one change. Carrying cost is a property of the accumulated set. They are
measured on different axes and the architect's sort collapses them.** Every single artifact in
`adversary:P6`'s supersession record was in the cheap, reversible half: the session-file count, the suite
denominator, the `.qa` verdict count, the branch name, the sha. Each was individually trivial to fix and
each was fixed, repeatedly, and the aggregate is a 637-line document whose main content is corrections to
itself. Nothing in that record was hard to reverse. All of it was expensive to hold.

The architect's own evidence points the other way from the architect's conclusion: the roster reached 26
agents one cheap reversible file at a time, and the collapse to 7 was correct and expensive, and
`architect:P11` says the pack shape will re-run that multiplication. "Fast and loose on the reversible half"
is a description of how the last nine phases were built. It produced 48 check steps and one venture task,
and not one of the 48 was hard to reverse.

I am not arguing for slow. I am arguing that **speed belongs on the mission side and the ceiling belongs on
the artifact side**, and that "reversible" is the wrong predicate for deciding which is which. The right
predicate is the one `visionary:P14` reached for independently: does this thing compound, feed, or sit as
inventory. Inventory that is cheap to delete is still inventory while it is held.

**Against:** `architect:P12`. **Holds because:** the measurement that would refute me is the one
`adversary:P6` produced and it supports me.

### 4.2 · Against `risk-modeler:P2`'s scope conclusion — the hook's scope rule is right for the founder and wrong for the loop

`risk-modeler:P2` refuses to widen `pre-tool-use.sh` to govern the founder's own user-scope MCP servers,
reasoning that this repo should not govern the founder's Gmail during the founder's own interactive session,
and that widening is the inverted resolution of the #96.3 template `CLAUDE.md` warns about. **For an
interactive session that is exactly right and I agree with it.**

The loop is not an interactive session. The entire design premise is that it runs when the founder is
asleep. So "the founder's own Gmail during the founder's own session" is the wrong frame for a 3am dispatch
that inherits those servers — and the risk-modeler's own open question 4 records that **at least one live
dispatch path carried `tiktok_publish`, `sandbox_exec`, Gmail send and an authenticated Chrome to an agent
no repo file granted them.**

The distinguishing variable is **who initiated the session**, and nothing currently records it. That is the
gap, and it is neither "widen the hook" nor "leave it alone." My P1 claims the smallest company cannot reach
a stranger; today it can; and the layer that would stop it has been declared out of scope by a peer for a
reason that holds only in the case that is not the dangerous one.

**Against:** `risk-modeler:P2`. **Holds because:** the position's own P14 item 8 names the founder as a
single point of failure for every human gate, and the scope rule silently assumes the founder is present.

### 4.3 · Against `visionary` build-order item 8 — "trust last" is not "trust never"

Minor but real, and I want it on the record because "last" is how things get built. The visionary sequences
trust eighth and forced-last; my P8 refuses it for year one outright, and the difference is not scheduling.
`open-source.md` §16 records that nothing in 177 surveyed repositories implements it — highest cost, least
precedent — and the architecture removes the subject: fresh context per move plus a pack that is a grant
means there is no persistent worker for trust to accrue to. Gap #10 is not deferred. It is **answered**, and
an answered gap should leave the list rather than sit at the bottom of it.

**Against:** `visionary` build_order item 8.

---

## 5 · What the board actually agrees on

Stated as claims, with the ids that support them. I have not padded this list; where support is two
personas I say two.

1. **Registering `budget-guard.js` is the highest-agreement item in the meeting, and it is not something any
   engine can do.** All five build orders contain it — `strategist` item 1, `visionary` item 5, `architect`
   founder-gated block, `risk-modeler` item 1, `adversary` item 4. Confirmed again today:
   `[M] grep -c budget-guard .claude/settings.json → 0`. Five sealed rooms, five different lenses, one
   founder action. Supported by `strategist:P1`, `architect:P14`, `risk-modeler:P7`, `adversary:P9`,
   `visionary` build order.
2. **A task id on every event row is forced and cannot be retrofitted.** `visionary:P3` and `architect:P3`
   both place it first; `strategist` places it second; `adversary` open question 5 reaches the same
   conclusion from the cost side. `architect:P3` measured the corpus: 3,813 events, zero
   task/mission/run/session ids. `architect:P5` adds that the loop's only brake cannot be made correct
   without it.
3. **No done-test may be resolved by the producing model.** `strategist:P14`, `architect` refuse list,
   `risk-modeler` refuse list, `visionary` refuse list. All four cite the same 0.543-against-0.741
   measurement. `adversary:P8` does not dispute the rule — it accepts the reasoning and attacks the
   consequence, which is a different disagreement and a real one.
4. **Union, never average. No summed judge score anywhere, and `design.js`'s `total` is the named live
   instance.** `strategist:N1`, `visionary:P7`, `architect` refuse list, `risk-modeler` refuse list.
5. **One risk classifier, extended, never paralleled — including by a small helper answering "is this
   outbound?"** `strategist:N4`, `visionary` refuse list, `architect:P6`, `risk-modeler:P1`. Confirmed:
   `[M]` the classifier's public surface is `classifyFile` / `classifyFiles` and its only input is a path.
6. **No outbound spend before a rate limit exists that something enforces.** `strategist:P10`,
   `visionary:P12`, `risk-modeler:P7`, `adversary:P10`. Four rooms, and the same sentence from `hands.md`
   §8 in each: money is the missing axis.
7. **`blocking-human` by type is what makes 24/7 safe, and it is built with zero consumers.**
   `strategist:N8`, `visionary:P9`, `risk-modeler:P4`.
8. **Built-and-never-wired must be prevented at merge rather than detected after.** `visionary:P10`,
   `risk-modeler:P3`, `architect:P8`, `strategist:P3` — with `adversary:P4` dissenting that it is a demand
   signal misread as an engineering defect. So: convergence on the mechanism, live disagreement on what its
   output proves.
9. **Every persona volunteered, unprompted and unable to see the others, that its own proposal is too
   large.** `risk-modeler`'s counter concedes "three controls, not thirteen"; `adversary` refuses "any new
   mechanism before the demand test… including mechanisms I would otherwise support"; `architect`'s counter
   concedes "a founder can read my build order as phase ten"; `visionary` classifies most of the repo as
   inventory; my own counter conceded fourteen stopping mechanisms. **Five sealed rooms, five independent
   confessions of the same shape.** That is not politeness — they could not see each other. It is the
   board's strongest finding and it is about the board. Note where the support sits: in five
   `strongest_counter` fields, in **no** numbered position. Not one of the five proposed the mechanism
   that would have caught what all five confessed.

---

## 6 · The fourteen-stopping-mechanisms charge, answered

My own Round-1 counter conceded it, and the framing asks me to face what the Visionary and the Adversary say
about it. So: the count is wrong, and the honest version is still uncomfortable.

**Nine of my fourteen positions build nothing.** P6 (refuse five dependencies), P7 (refuse a fifth store),
P8 (refuse trust), P9 (refuse a second surface), P10 (refuse spend hands), P11 (refuse a global sandbox
disable), P12 (refuse a standing council), P13 (refuse phase numbers) and P1's cannot-do table are
**refusals**. A refusal has no caller, cannot become unwired, needs no expiry check to keep working, and
removes a problem instead of adding a check. In `visionary:P14`'s vocabulary a refusal is not flywheel,
feeder or inventory — it is **negative inventory**. It reduces carrying cost.

**Five were mechanisms. After this round, three are.** P3 folded into the architect's one predicate (§1.1).
P5 downgraded to a policy enforced by that predicate (§1.5). What remains: **P2** the ceiling, **P4**
`.out-of-scope/` keyed on conditions, **P14** the schema refusal at dispatch. Three, which is the number
`risk-modeler`'s own counter arrived at independently for its lane.

**Where the charge still lands, and `adversary:P6` is what makes it land.** A refusal costs nothing to
*run* and it does cost something to *hold*: someone must consult the list before proposing, and
`.out-of-scope/` in CI checks a **merge**, not a proposal. The filtering conversation — this meeting — is
where the cost of a refusal is actually paid, and it is precisely where no mechanism reaches. I said in
Round 1 that this was the one place I was proposing a governor on a machine complaining of too many
governors. `adversary:P6` gave me the measurement I lacked and it does not exonerate me. I have reduced the
bill from five mechanisms to three and moved the expiry from calendar to counter. I have not closed the gap,
and I would rather say so.

---

## 7 · The smallest company, restated after four rooms

Unchanged in shape, corrected in three places:

| Property | Round 1 | Round 2 |
|---|---|---|
| Runs unattended | rope + stall ceiling + kill switch | **rope only.** The stall ceiling fails toward passing (`architect:P4`) and divides account-wide by repo-local (`architect:P5`). No repetition detector exists until both land, and neither can be fixed before the task id. |
| Produces something | one pack, fresh context, real hands | unchanged — but the only pack shape the runtime supports is one agent file per engine × pack (`architect:P11`), so the ceiling is a precondition, not a follow-up |
| Knows whether it worked | non-producer done-test at a declared rung | unchanged, plus: the ladder must **refuse aggregation across rungs**, or a rung-1 result gets reported as rung 4 |
| Cannot reach a stranger | stated as a property | **it is not a property, it is a revocation that has not happened.** Three outbound hands are live and the gate that would stop them has no consumer. |

Six mechanisms became five plus a correction: registered rope · task id · non-producer done-test · the
`world` verifier fail-closed · one `hasCaller` predicate (the architect's, carrying my mission half). Against
a catalogue of roughly 420 that is **1.2%**, and the reduction came from a peer's measurement rather than
from my restraint, which is the argument for having held the meeting.

---

## 8 · One sentence I would not want lost from this round

**Five personas, sealed from each other, each independently confessed that its own proposal was too big —
and not one of them proposed the mechanism that would have caught it.** The convergence is real, it was
produced under the best conditions this system will ever have, and `adversary:P7` measured that the meeting
itself held one of its own three rules while it happened. If the board wants one thing to be true of the
rebuild, make it that the *next* convening cannot suspend its own cap, because the argument that it should
be allowed to will be as good next time as it was this time.
