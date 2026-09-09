# Round 1 · Adversary — the refutation

**Persona:** Adversary (broad, `decision_type: strategic`) · **Round 1** · written 2026-09-02.

Every figure below was measured in this worktree or on this machine on 2026-09-02, with the command
shown. Where I could not measure, the position is labelled `INVENTED`. Where a proposed rule has no
enforcing mechanism, it is labelled `WISH`. Those are this repo's own standards and I am held to them.

I do not re-litigate the nine founder decisions in `STARTUP-OS.md` §2. I attack the thesis above them.

---

## 0 · What I was asked to argue, and where I refuse the framing

The brief asks me to argue that *"the last nine phases failed for a reason the tenth will repeat."*

**I will not, because it is false and I can measure that it is false.**

```
git log --reverse --format='%ad %s' --date=short | head -1
  → 2026-08-11 feat: initial project setup from GSA Startup Kit
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c
  →  858 2026-08
```

This repository is **twenty-two days old** and holds **858 commits, every one of them in August 2026**.
Nine "phases" in twenty-one days is not nine attempts. It is one continuous sprint with phase labels
applied to it after the fact. Nothing in it "failed" in the ordinary sense either: the gate blocked its
own author on PR #47, the check suite is 48 of 48 green, and the claim ledger does a thing no surveyed
system does.

A cheap adversary would take the framing and score points off it. The framing is wrong, and taking it
would let the board dismiss everything downstream of it. **What the evidence actually supports is
narrower and considerably worse**, and it is what the rest of this document argues:

> The sprint has never once been pointed at anyone outside it, and its velocity signature is
> indistinguishable from that of six abandoned projects on the same disk.

---

## 1 · Thesis

**The system does not have a creativity problem, a wiring problem, or a capability problem. It has a
demand problem, and every proposal on the table treats demand as solved.**

Nothing in the record shows anyone — the founder included — consuming this system's output for a purpose
outside the system. *Built and never wired* is the correct observation reported at the wrong altitude:
a mechanism goes unwired because no task demanded it, not because a call site was forgotten. Wiring six
of them produces six callable mechanisms, not six called ones. Building 420 more produces 420 more
unwired things, faster and at higher confidence.

The founder's own machine gives the base rate the thesis has to beat, and the harness is currently
sitting on that curve rather than above it.

---

## 2 · P1 · The base rate on this machine is abandonment at three weeks

Measured across every sibling project, `~/VibeCoding/*/`:

```
for d in */; do git -C "$d" log --reverse --format='%ad' --date=short | head -1; ...; done
```

| Project | First commit | Last commit | Span | Commits | State |
|---|---|---|---|---|---|
| overstory | 2026-02-12 | 2026-03-06 | 23d | 1142 | dead 6 months |
| Beamix | 2026-02-27 | 2026-06-13 | 107d | 795 | dead 3 months |
| etsyc | 2026-07-14 | 2026-07-25 | 11d | 689 | dead 5 weeks |
| evalove | 2026-08-02 | 2026-08-12 | 10d | 452 | dead 3 weeks |
| ghostb | 2026-06-01 | 2026-06-23 | 22d | 104 | dead 10 weeks |
| noam-website | 2026-06-06 | 2026-06-25 | 19d | 90 | dead 10 weeks |
| N8N | 2025-03-12 | 2025-06-30 | 110d | 67 | dead 14 months |
| adamos | 2026-07-27 | 2026-08-26 | 30d | 26 | dormant |
| realestate | 2026-06-13 | 2026-06-14 | 1d | 25 | dead |
| **beeond** | 2026-06-25 | 2026-08-31 | 67d | 104 | **alive** |
| **agentvibe** | 2026-08-11 | 2026-08-31 | 20d | 858 | **alive, day 22** |

Eleven projects with more than twenty commits. **Nine are dead.** The two alive are the harness, on day
twenty-two, and the one venture the harness has colonised (§3).

The thesis requires that **the founder's presence is the scarce resource** the loop frees. The record
says otherwise. Founder attention on this machine is not scarce — it is torrential and short-lived.
overstory absorbed 1,142 commits in 23 days and died. etsyc absorbed 689 in 11 days and died. What ran
out was never hours in the day. It was interest, or the absence of anyone waiting.

**A 24/7 autonomous loop does not manufacture interest. It lowers the cost of starting**, which is the
one thing that has never been the bottleneck here, and it removes the friction that currently forces a
choice between projects. On the evidence, the predicted effect of the proposed system is *more* dead
projects, reached faster.

**Territories:** 01 missions & drive · 14 the company itself.
**Confidence:** high. The measurement is unambiguous; the causal reading ("interest, not hours") is my
inference and is the part a fair critic should push on.

---

## 3 · P2 · beeond is the thesis's only live test, and it returned 111 lines

`STARTUP-OS.md` §1 grounds the entire rethink in beeond: *"The founder used the system on a real project
(beeond) and it did not feel like the thing they wanted."* So beeond is the experiment. Here is what it
produced.

**The product surface, measured:**

```
find ~/VibeCoding/beeond/apps/web/src -type f | xargs wc -l
  → 111 total
```

Six files: `layout.tsx`, `page.tsx`, `not-found.tsx`, `globals.css`, `robots.ts`, `sitemap.ts`. That is
a Next.js scaffold. There is no product.

**The harness surface, same repository, same command family:**

```
git -C ~/VibeCoding/beeond ls-files | awk -F/ '{print $1}' | sort | uniq -c | sort -rn
  → 552 .claude · 257 docs · 62 war-room · 55 war-room-dashboard · 35 scripts · 31 apps · 22 design
```

**552 harness configuration files against 6 product files. A ratio of 92 to 1**, in the venture, not in
the harness repo.

**And `design/` contains no designs.** All 22 files are instrumentation: `measured.json` and
`seeds.suggestion.json` for five reference sites (Stripe, Linear, Vercel, Grafana, Stripe docs), plus
`tokens.json`, `tokens.css`, `tokens.ts`, `contrast.md`, `type-scale.rules.json`. A measuring apparatus
for design, and nothing designed with it. That is the same pattern as the parent repo, one level down,
in the layer the founder says is the missing one.

**The load-bearing observation is the commit log, not the ratio.** The most recent day of work anywhere
on this machine is 2026-08-31, and all eight of its commits are beeond commits, and all eight are
harness:

```
docs(session): the harness port, and beeond's first ledger claim
chore(harness): re-port four files that were adaptations of an old upstream
feat(agents): 26 C-suite roles become 7 engines, with a shim for every retired name
feat(skills): two-tier discovery, generated from beeond's own library
fix(ledger): take the upstream exemptions fix, keep beeond's true posture header
feat(harness): waves 2-4 — a check runner, beeond's first CI, and the enforcement spine
feat(skills): generate MANIFEST.json from disk instead of maintaining it
chore(skills,tier): reconcile the skill tree to 147 and author a real tier map
```

**The harness is not a tool the ventures use. It is a competing venture that consumes them.** The
rethink proposes a substantially larger one.

**Territories:** 02 workers · 14 the company itself.
**Confidence:** high.

---

## 4 · P3 · The harness has already damaged its only customer, measurably

beeond spent 2026-08-26 — a full working day, twenty-one commits — undoing what the harness template
did to it:

```
fix(agents): remove a whole other company's brand, pricing and ICP from 22 agent files
chore(context): delete .agent/ mirror + foreign agent kit (1,395 files)
fix(agents): repoint 9 C-suite pre-flight blocks off a docs/00-brain that never existed
docs: flag the 10 pre-reset docs that assert reopened decisions
chore(web): strip apps/web to an instrumented Next 16 shell
docs(marketing): cut all Beeond design output, keep external references
chore(memory): correct all four memory files to the post-reset truth
```

Read those in order. A different company's brand, pricing and ideal-customer-profile were carried into
twenty-two agent files by the template. 1,395 files of foreign agent kit were deleted. Nine agents
pointed at a directory that never existed. **And the product was stripped to a shell** — which is why
§3's 111 lines is a post-reset figure and not a cumulative one.

**Net contribution of the harness to its only user, over ten weeks: negative.** A day of decontamination
and a deleted product, against no shipped artifact.

This is not an argument against harnesses in general. It is an argument that **the cost of harness
surface is not zero and has been paid once already, in the only place it was ever tested.** Any proposal
in this meeting that adds surface must carry that cost in its estimate. None currently does.

**Territories:** 02 workers · 04 knowledge · 14 the company itself.
**Confidence:** high.

---

## 5 · P4 · "Built and never wired" is a demand signal, misread as an engineering defect

`STARTUP-OS.md` §1b lists six mechanisms built and unwired, and §8b finds the same defect in four of four
studied systems. The conclusion drawn is: *"This repo diagnoses the disease better than anyone studied
and has not taken its own medicine."*

**That inverts the causality, and the inversion is the most consequential error in the rethink.**

Take the file the document itself calls the whole argument. `design.js` produces blind variations from
distinct angles, judges them blind, and synthesises the winner grafting the runner-up's ideas — precisely
what the founder asked for in beeond, and it has **zero invocations ever**. §1b reads this as a wiring
failure: *"It was not a creativity problem. It was a wiring problem, and it cost a design round."*

But `design.js` did not go uninvoked because a call site was missing. `.claude/commands/design.md` exists
and a founder can type `/design`. It went uninvoked because **no design work was pending that anyone was
waiting on.** In the same ten weeks, beeond's design layer produced token files and reference
measurements and not one mockup that reached a person.

Wiring a mechanism makes it *callable*. It does not make it *called*. The proposed cure — §8 item 1,
*"wire what exists, then delete whatever still has no caller"* — treats the symptom and will report
success: after wiring, everything has a caller, because wiring *is* adding a caller.

**The test that separates the two readings is cheap and nobody has run it.** Wire `design.js`. Wait
seven days of ordinary work. Count invocations. If it is still zero, the diagnosis was demand, not
wiring, and the entire §8 agenda is aimed at the wrong thing.

**Territories:** 12 self-improvement · 08 quality · 01 missions.
**Confidence:** med-high. I can measure zero invocations and zero shipped designs; the causal claim is
an inference, and the experiment above is what would settle it.

---

## 6 · P5 · The catalogue is negative-value at this volume, and its own discipline proves it

Measured:

```
grep -cE '^\*\*[A-Z]+[0-9]+ · ' concepts.md                          → 134
grep -oE 'github\.com/[^ )]+' open-source.md | ... | sort -u | wc -l → 177
grep -cE '^### ' hands.md                                            →  35
```

311 discrete options from two files, before the third. The research quality is genuinely high — 44
`[SOURCED]`, 37 `[ANALOGY]`, 26 `[INVENTED]` inline provenance tags, ten entries honestly labelled
`WISH`, and `open-source.md` §0 volunteering that its own star counts passed through a summariser and
should be treated as order-of-magnitude only. This is better research discipline than most funded teams
manage.

**And it is already drifting, one day after it was written, in exactly the way this repo spends 637 lines
hunting.** `concepts.md`'s header states *"128 mechanisms — re-derive rather than trusting this line"*
and prints the command. The command returns **134**. The number is defensible — the six §15
anti-mechanisms sit inside the pattern and outside the stated count — so this is the mild form of the
defect, not the severe one. That is precisely what makes it evidence: **the author had just read
`STATUS.md`'s rule that "a derivation published beside a stale value reads as evidence and is not", and
published one anyway, within a day, at 2,157 lines.**

The failure is not carelessness. It is that **at 311 options the discipline cannot be held by anyone**,
including an author who is unusually good at it. And the cost lands twice: once to write, once again in
the filtering conversation this catalogue exists to feed, which must now triage 311 items to find three.

**Building the top three costs less than the meeting that selects them.** The catalogue's own §17 already
names five, and `hands.md` §6 already ranks fifteen by capability-per-effort with the top five free and
measured in minutes. The selection work is done. What is being proposed is to do it again, larger.

**Territories:** 04 knowledge · 07 context & cost · 13 economics.
**Confidence:** high on the measurement, med on "negative-value" as a verdict.

---

## 7 · P6 · The record is majority self-correction, and that is the real cost curve

`docs/STATUS.md` is 637 lines. Its documented expiry history, taken from its own supersession blocks:

| Figure | Times it went stale | Detail |
|---|---|---|
| `main` sha | **4 times in one day** | `71fd58d` → `7f7bddd` → `3731087` → `244e8db` (§ item 1) |
| The branch name | **5 times** | ending in the file dropping the pin entirely (§ item 1) |
| Session-file count | **5 recorded** | 105 → 117 → 118 → 119 → 150, now 172 (§5) |
| `.qa/verdicts` count | 2 | 23 → 50 (§ item 3) |
| Suite denominator | 4 | 30 → 43 → 44 → 46 → 48 (§4) |

In every one of those cases **the correct derivation command was printed beside the wrong value.** §4
carries five nested supersession blocks. §1 documents a line-number citation that rotted twice inside a
single change, *while being corrected, under observation.*

The repo reads this as a documentation-hygiene problem it is winning. **I read it as the cost curve of a
system whose only output is statements about itself.** Every artifact is a claim; every claim needs an
expiry; every expiry needs a disposition; every disposition is another artifact. The truth machine is
excellent and it is metabolising its own exhaust.

L1 is `✓✓ excellent` in §1's own layer diagram. Adding L2 through L5 above it **multiplies the claim
surface without adding one claim about the world.** A mission, a move, a done-test, a field note, a
balcony row and a pack grant are all claims that will expire, and none of them is checkable against
anything outside the repository.

**Territories:** 05 memory · 07 context & cost · 08 quality.
**Confidence:** high on the measurement. The interpretation is the argument.

---

## 8 · P7 · This meeting is a live instance of the failure it convened to diagnose

Measured in this worktree, 2026-09-02:

```
for p in visionary strategist architect risk-modeler customer-voice adversary synthesizer; do
  ls .claude/agents/$p.md; done
  → 7 of 7: No such file
grep -rn 'board-meeting' scripts/ .claude/hooks/ .github/ package.json
  → (empty)
```

- **Zero of seven personas have an agent file.** This board is convened by prompt, not by the roster its
  own spec names. `STARTUP-OS.md` §1b already recorded that and it has not changed.
- **The `$3/meeting` cap is enforced by nothing** — no script, no hook, no CI step, no package script
  references the command at all. It is the spec's only hard number and it is prose. It was suspended on
  run one, by instruction, which is legitimate; what is not legitimate is calling it a cap.
- **The escalation path names two systems that do not exist here.**
  `.claude/commands/board-meeting.md:29`: *"Synthesizer posts to a Linear ticket and Telegram-pings
  Adam."* There is no Linear integration in the tree, and Telegram is **explicitly refused by founder
  Decision 5** — *"No Telegram, no bot, no third-party plumbing"* — taken the day before this ran.

So: the first convening of the thinking board runs without its roster, suspends its only hard
constraint, and depends on an escalation channel that a decision taken yesterday forbids.

**This is not a gotcha about a slash command. It is the smallest available test of the central premise.**
The thesis is that this system will hold its own rules while nobody watches at 3am. On its first
supervised run, with five Opus agents and the founder's full attention, it held one of three. That is a
data point about rule-holding under the *best* conditions the system will ever have.

**Territories:** 08 quality · 09 control & safety · 10 surfaces.
**Confidence:** high.

---

## 9 · P8 · "Creativity" is the wrong diagnosis, and §4's cure imports the founder it removes

The founder's complaint is *"we lose the creativity to playbooks… I want a creative moving forward
system."* The rethink answers it with §4's pack model — a grant and a stop, no method — and §5's worker
loop with `ORIENT` and `ATTACK` as the restored creativity.

Two objections, in ascending order of seriousness.

**First, the diagnosis does not match the repo's own illustration.** §1b's boxed argument is that
`design.js` already did the thing asked for and was never invoked. Read plainly, that says the system
*was* creative and *was not used*. Substituting "make it more creative" for "make someone need it"
designs for a problem that the document's own centrepiece disproves.

**Second, and this is structural: §4's `done:` field re-imports the founder into the middle of the loop.**

> *"the agent proposes the done-test after researching the field, the founder approves it once, and then
> it binds."*

The reasoning is sound — A3 in `concepts.md` §15 is right that a model cannot score its own work, and
the 0.543-against-0.741 measurement is real. But follow the consequence. Four pack families (Decision 6),
times new fields agents research their way into, times projects (the founder has 26 directories in
`VibeCoding`), each needing a one-time founder approval. **That is an unbounded stream of human approvals
sitting on the critical path of a system whose entire premise is that the human is absent.**

`STARTUP-OS.md` §7 states the resolution — *"Taste enters once, at the top"* — but §4 places it once
*per pack*, and those are different claims. Which one binds is undecided, and it decides whether the
system can run unattended at all.

**Territories:** 01 missions · 02 workers · 08 quality.
**Confidence:** med-high.

---

## 10 · P9 · The rope cannot hold — the loop and the founder share one quota, and no mechanism allocates it

Decision 8: *"The rope: reserve headroom in the rolling window. The loop stops itself at a set fraction
of the 5-hour window. It never competes with the founder for their own quota."*

Measured, from `STARTUP-OS.md` §1b's own live run of `budget-guard.js`:

```
live windowUsage()      588,652 output tokens / 5h
live sinceLastArtifact  199,103 output tokens
2,927 transcript files   (2,944 today; 2.40 GB across ~26 project roots)
```

Those figures were produced by **ordinary founder-driven work**, not by a loop. A 24/7 worker must fit
inside whatever is left of a window the founder already saturates during waking hours.

The dilemma has no stated resolution:

- Give the loop the remainder, and it cannot *"walk relentlessly until the goal is met"* — it walks
  during the hours the founder sleeps, at whatever fraction is left, and stops.
- Give the loop priority, and the founder is throttled inside their own factory by their own workers.

`budget-guard.js` is a **brake, not an allocator**. Its two ceilings stop spend; neither divides it
between two consumers with different priorities. There is no scheduler, no reservation, no preemption,
and no mechanism named anywhere that expresses "the founder outranks the loop."

**Labelled `WISH`.** Decision 8 states a property the system should have and names no mechanism that
produces it. That is this repo's own standard, applied to a founder decision's *implementation* rather
than to the decision, which I am not re-litigating.

**Territories:** 07 context & cost · 11 runtime · 13 economics.
**Confidence:** high.

---

## 11 · P10 · Autonomy raises blast radius before the axis that would bound it exists

Three measured facts, from the studies commissioned for this meeting:

**The dangerous hands are already granted and the safe ones are not.** `hands.md` §8: *"Publishing to
TikTok, sending mail as the founder, remote code execution and an authenticated Chrome are live right
now; PostHog, Sentry and a read-only Stripe key are not connected."*

**Money has no axis at all.** `hands.md` §8: *"Every tier this repo has is about reversibility or blast
radius; ad spend, GPU-seconds and postage need a rate limit, and no mechanism here can express one."*
The `risk:trivial|lite|full|irreversible` ladder in `CLAUDE.md` is about whether `git revert` saves you.
It has nothing to say about £500 of ad spend, which reverts perfectly and is still gone.

**The containment is porous, by measurement, today.** `STARTUP-OS.md` §1b:

```
  npx --version     BLOCKED by .claude/hooks/pre-tool-use.sh
( npx --version )   ran — returned 11.10.0
```

A blocking control defeated by one pair of parentheses, on a machine that can post publicly and send
mail as the founder. §8 item 7 flags it and asks whether the other rules share the shape. **Nobody has
checked**, and the honest reading is that a rule set with one known bypass of that shape probably has
more.

The order of operations being proposed is: build autonomy, then build the risk axis. `concepts.md` §17
item 3 argues the reverse — *"worldly risk is the gap that makes 24/7 dangerous rather than merely
expensive"* — and I agree with the study over the plan.

**Territories:** 03 hands · 09 control & safety · 13 economics.
**Confidence:** high.

---

## 12 · P11 · Fair credit, stated plainly, and why it does not rescue the thesis

A brutal critic who will not concede is a useless one. So:

**L1 is genuinely excellent and I found nothing comparable in the five studied systems.** Forced claim
expiry with a mandatory disposition. sha256 verdict binding to a diff. One classifier, with the second
implementation deliberately refused. A 48-of-48 check suite that reports its own tally and refuses a
zero-step run. A gate that blocked its own author on PR #47 and then found a path traversal, eleven SSRF
bypasses and an auto-approved RCE path in work already called finished. `open-source.md` §16 lists six
things the author went looking for and could not find in 177 verified repositories, and one of them —
worker trust and retirement — has no OSS answer at all.

And the field ships the opposite. `STARTUP-OS.md` §8b: Ralph's judge *"fails open twice: it auto-approves
on error, and auto-approves when the verdict tool was never called."* Rule 10 forbids exactly that and is
enforced by `scripts/ledger.test.mjs`.

**None of it is evidence for the thesis.** Every mechanism I just praised answers *is this statement
true?* Not one answers *did anyone want it?* `STARTUP-OS.md` §1 says this itself — *"Nothing in it
answers is this good?, what should we do next?, or make me a video"* — and then proposes to build the
missing layers rather than to test whether the finished one has a customer.

**A truth machine with no demand is a very well-audited zero.** That is the whole of my case, and the
credit above is why it is worth saying rather than merely scoring.

**Territories:** 08 quality · 14 the company itself.
**Confidence:** high.

---

## 13 · P12 · The strongest argument FOR the thesis, which I could not defeat

Stated at full strength, because the board needs it more than it needs another position of mine.

**You cannot safely automate what you cannot verify, and the field's graveyard is full of systems that
automated first.**

All five studied systems shipped autonomy before verification, and all five carry the consequence in
code today: GSD's 40 KB `verify-phase` workflow wired to nothing; Metaswarm's disagreement classifier no
longer called by the command that documents it; CAST's dispatch endpoint querying the wrong table for
two months with the audit finding open; Auto-Co's circuit breaker existing only as a line in its own
`.gitignore`; Ralph's judge auto-approving when the verdict tool was never called. **Every one of those
is a system that ran unattended without a control that could refuse.**

If that is the real hazard, then the last twenty-two days were not misallocated. They built the one
precondition for leaving something running overnight: a machine that **mechanically refuses to pass what
it could not check.** A prerequisite is not a project. It does not have to survive on its own, attract
users, or beat a base rate — it has to be *finished*, and it is nearly finished.

Under that reading my P1 collapses on its own terms. I counted the harness as one more three-week
project heading for the graveyard, but the graveyard projects were all attempts at *products*. This is
scaffolding, and scaffolding that gets abandoned at day 22 having produced a working enforcement spine
has not failed; it has completed. And the demand test I demand in §14 **could not have been run safely
before now** — an unattended system with an authenticated Chrome, publishing rights and mail-send, with
no gate that can refuse, is exactly the configuration `hands.md` §8 warns about.

**I could not defeat this.** What I can say is where it becomes falsifiable rather than merely
plausible: it predicts that the demand test is now *cheap and safe to run*. If the next three weeks
produce a tenth phase instead of the test, then verification-first was not a prerequisite argument, it
was a preference dressed as one — and there is no third reading, which is what makes it a fair test.

**Territories:** 08 quality · 09 control & safety · 12 self-improvement.
**Confidence:** high that the argument is strong; that is the point of stating it.

---

## 14 · What would change my mind, and the smallest experiment that would produce it

### The evidence I would accept

Exactly one thing, and no substitute for it:

> **One artifact produced by this system, with the founder not in the loop for its production, that a
> person who is not the founder used, paid for, or responded to.**

Not a passing check. Not a `PASS` verdict. Not a mockup nobody looked at. Not a synthetic landing page
graded by its own author — Decision 7's synthetic mission is an end-to-end test of the *machine*, and
`concepts.md` §15 A3 already names why that cannot settle this: the producing party cannot be the
scoring party. A synthetic mission tests whether the factory runs. It cannot test whether anyone wants
what comes off the line.

### The smallest experiment

**One real artifact, one real audience, seven days, existing tooling only. No new mechanism.**

1. Use **beeond**. It already has design tokens, a five-site reference set, and an instrumented Next 16
   shell. Nothing needs inventing.
2. Ship **one page** to a real URL. `vercel` is installed (`hands.md` §0.2).
3. Put **PostHog** on it — free, one hosted endpoint, `hands.md` §6 item 6, ranked there as *"the largest
   single step toward a verdict from the world."*
4. Post it **once**, to one place a real audience reads.
5. The founder does not touch it for **seven days**.
6. Record three numbers: **sessions · one conversion event · one unsolicited human response.**

**Cost:** hours. **New subsystems:** zero. **New vendors:** one, free.
Every hand it needs is already connected or installed: `vercel`, `ffmpeg`, `higgsfield`, `figma`, and
`playwright` once the duplicate-scope definition `claude mcp list` already warns about is fixed
(`hands.md` §0.1).

### What it settles, in both directions

**If the numbers are non-zero** — even one real response — then demand exists, the bottleneck genuinely
is throughput, and P1 through P8 collapse. Build the loop. Build the packs. Build the policy seam. I
would withdraw the whole case, and the board should read this document as having been wrong.

**If the numbers are zero**, then a 24/7 system would have produced that same zero faster, at higher
cost, with an authenticated Chrome and publishing rights attached. The correct next move is to find the
audience before building the factory, and §8's agenda is premature by one step rather than wrong.

### The tripwire, and it names its mechanism

The experiment is worthless without a control on where the week's effort actually goes, because the last
three weeks of every week went to the harness.

```
git log --since='<start>' --until='<start+7d>' --name-only --pretty=format: \
  | grep -cE '^(\.claude|scripts|docs)/'
```

**Must return 0, in both repositories.** Not a wish: it is a one-line command, it is checkable by anyone
at any time, and it can be a CI step or a `Stop` hook on either tree. If it returns anything but zero,
the experiment did not happen — whatever else was accomplished that week.

---

## 15 · What I would refuse

| # | Refuse | Why |
|---|---|---|
| 1 | **The policy seam as the first build.** | It is the best idea in `STARTUP-OS.md` §8b and it is a generalisation over five mechanisms of which one exists (`budget-guard.js`, unregistered) and four do not. Generalising before the second instance is how 420 options happen. Build it when there are three real handlers to unify. |
| 2 | **The 420-option filtering conversation.** | 311 options measured across two files. Selection has already been done twice — `concepts.md` §17's five, `hands.md` §6's ranked fifteen with the top five free. Re-running selection at full breadth costs more than building the top three. |
| 3 | **A `done:` test approved by the founder per pack, per project.** | §4 places a human approval on the critical path of a system premised on human absence, and §7's *"taste enters once, at the top"* says something different. Resolve which binds before either is built. |
| 4 | **Any new mechanism before the demand test returns a number.** | Including ones I would otherwise support. The test costs hours; every mechanism costs weeks and adds claim surface (§7). |
| 5 | **Reading §8's "wire, then delete" as a test of demand.** | Wiring *is* adding a caller, so the check passes by construction. It measures the fix, not the disease (§5). |

---

## 16 · Open questions I could not settle

1. **Was there ever a consumer?** I can measure zero shipped artifacts. I cannot see the founder's inbox,
   revenue, or conversations. If beeond has customers waiting, P1 weakens sharply and I could not detect
   it from the tree.
2. **Is the harness a product?** If the intended customer is other founders, then "no venture work" is
   not a defect and §3's ratio is the *product*, not a symptom. `TEMPLATE-USAGE.md` and Decision 4
   (*"built for this Mac"*) point in opposite directions on this, and it changes the whole analysis.
3. **Does the abandonment pattern have a cause the loop actually addresses?** I inferred "interest, not
   hours." If the true cause is that solo projects stall on the boring 60% — and a loop genuinely eats
   boring work — then P1 inverts and the thesis is right for a reason I dismissed.
4. **Do the other `pre-tool-use.sh` rules share the parenthesis bypass?** Unchecked. It is a
   thirty-minute test and it gates how dangerous autonomy is today.
5. **What did the 858 commits cost in money?** `ccusage` answers per session and `open-source.md` §16
   item 6 says cost-per-mission is answerable by nobody. Without it, "is this worth it" is unanswerable
   in either direction, including in mine.
