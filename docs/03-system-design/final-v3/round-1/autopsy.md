# Autopsy of the v2 Planning Corpus — the UNSEALED lane

*Round 1, final-v3. Written 2026-09-11. Diagnosis, not summary.*

**The question this lane was given.** The founder's verdict, verbatim:

> "all the other planning of the system were bad... at some point in the process, the planning
> became something we didn't want. They focused on a specific area. They lost the want and need to
> fix the other areas, to think big, to envision the whole new agentic type of system."

One artifact is exempt: `THE-VISION-AND-THE-FIELDS.md`. That document states its own two
predecessors were rejected for being *"written inside the frame of a design already chosen"*, and
names its cure: **sealed lanes**. The sharpest available test of the founder's complaint is whether
that cure was ever applied to the REST of the corpus, or only to the one document that names it.

## The finding, before the evidence

**The narrowing was not a drift. It was a rule, written on day one and re-stated in every brief.**
`SPINE.md`, committed 37 minutes into the session, declares that the previous plan *stands* unless
a founder overrule or a world fact moves it — and **"this is the wrong shape" is not one of the two
admitted forces.** Every later round inherited that. The round literally named *rethink* was briefed
`Nothing reverses one`. The completeness instrument was built on a denominator frozen at 671 items
inherited from the previous round, and reports as proof that *"671 before, 671 after — no item was
added."* Seven review rounds ran; six of them check whether the document agrees with itself.

The system found the founder's complaint by itself on 2026-09-06 at 12:09 — three sealed lanes
converging on *"No stranger in the build graph"* — and then neutralised it by **appending a row**
next to the row it contradicted, marked `v64 stands`.

The cure was also found, written down, and not applied: `vision/` is the only place in 5.3 MB where
lanes were sealed from **the design** rather than from **each other**.

## Outline

1. The corpus, by the numbers
2. The chronology — what git says about the order of writing
3. WHERE the narrowing happened — three nested narrowings, and the day it became visible
4. WHAT mechanism caused it — six hypotheses, tested
5. The sealed-lane test — the cure was applied once, to one document
6. WHICH parts are genuinely worth keeping
7. WHAT the next round must structurally do differently — M1–M12
8. The diagnosis in one page
   · Appendix: evidence log

## 1. The corpus, by the numbers

Measured 2026-09-11 on branch `ceo-1-1788609834`.

| | |
|---|---|
| Files under `final-v2/` | 89 |
| Total lines | 45,936 |
| Total bytes | 5,270,836 (~5.3 MB) |
| Commits touching `final-v2/` | 167 |
| Elapsed wall-clock, first commit to last | **5 days** — 2026-09-05 15:17 to 2026-09-10 22:45 |
| Largest single artifact | `FINAL-PLAN-v2.md`, 12,344 lines / 1.26 MB |
| Second | `SPINE.md`, 1,630 lines / 523 KB |
| Third | `COVERAGE.md`, 988 lines / 132 KB |

Commits per day:

```
2026-09-05   55
2026-09-06   68
2026-09-07   31
2026-09-09   10
2026-09-10    3
```

**The first thing the numbers say: this was not a long, slow drift.** 123 of 167 commits — 74% —
landed in the first 41 hours. The corpus reached 5 MB in two days. Whatever narrowed, narrowed fast,
and the pace is itself part of the mechanism: there was never a gap in which someone could have
noticed.

## 2. The chronology — what git says about the order of writing

`git log --reverse --format='%ad|%s'` over `final-v2/` gives the order things were written. It falls
into eight distinct phases, and the phase boundaries are unusually crisp.

| # | Window | Phase | What it produced |
|---|---|---|---|
| 0 | 09-05 15:17 – 15:43 | **Research, 7 sealed lanes** | `research/{cognition,memory,models,roster,runtimes,skills,surfaces}.md`, "51 parts" |
| 1 | 09-05 **15:54** | **THE SPINE IS LAID** | `SPINE.md` — "35 rows, 14 agents plus the Operator, one launcher drives both runtimes" |
| 2 | 09-05 15:58 – 17:06 | Parts + assembly + review round 1 | 25 `parts/*`, `FINAL-PLAN-v2.md`, `census`, `challenge-a`, `challenge-b`, fix round, reassemble |
| 3 | 09-05 20:49 – 21:40 | Founder interview | rows v54–v65, `research/{room,cloud}.md`, page v2.1 |
| 4 | 09-06 07:24 – 11:38 | **"rethink round"** — 8 lanes L1–L8 | `rethink/*`, `SYNTHESIS.md`, rows v66–v82, O1–O80, W1–W32, R1–R26, challenge C, census C, page v2.2 |
| 5 | 09-06 11:59 – 12:17 | **thinker round** — 3 lanes on "Keel as a whole" | `review/thinker-{A,B,C}.md`, 64 findings, **"nothing applied"** |
| 6 | 09-06 17:18 – 23:40 | **"fixer round" (rethink-2)** | `rethink-2/{A,B,C}.md`, rows v83–v106, O81–O127, challenge D, census D, fix round D, page v2.3 |
| 7 | 09-07 09:44 – 13:58 | **the sandbox / hook / permission day** | `review/sandbox-P{1..5}`, `hook-gaps`, `r46-classifier`, `restricted-hook-cell`, `night-safety`, `probes/r33/*`, `research/five-hour-window.md`, row v107 |
| 8 | 09-07 18:43 – 09-09 14:38 | **THE-VISION-AND-THE-FIELDS** + sealed vision lanes | the one artifact the founder kept |
| 9 | 09-09 14:50 – 09-10 22:45 | Codex CLI measurement, warroom implementation fixes | `research/codex-in-the-pane.md`, two `fix(warroom)` commits |

Read that table as a graph of *scope* against time and the shape is a funnel with one late flare:

```
scope
  ^
  |  ##                                                    ####
  |  ####                                                  ######
  |  ######  ####                                          #######
  |  ######  ######  ####  ###                             #######
  |  ######  ######  ######  ####  ##   #                  #######
  +--phase0--p1-2----p3-4----p5----p6---p7-----------------p8------> time
     research SPINE   fold   think fix  SANDBOX            VISION
```

Phase 8 is the only place the scope goes back up, and phase 8 is the only artifact the founder
considers good. **That correlation is the whole finding, and the rest of this document is its
mechanism.**

## 3. WHERE the narrowing happened

There are **three** narrowings, nested, and the founder's complaint is about all three at once. Only
the third is visible from the outside; the first is the one that made the other two inevitable.

### 3.1 Narrowing #1 — the frame was fixed in the first file, before any v2 thinking happened

`SPINE.md` was committed 2026-09-05 **15:54**, thirty-seven minutes after the session's first commit.
Its own header block declares its terms of reference:

```
binds:      the founder's direction of 2026-09-05 (docs/08-agents_work/handoffs/
            2026-09-05-THE-PLAN-NEXT-TEAM-PROMPT.md, branch ceo-3-1788468144) — where it contradicts
            FINAL-PLAN.md, the founder wins, the cost is stated once in one line, and the chosen
            thing is then built properly. Never re-litigated
base:       final/FINAL-PLAN.md (branch ceo-3-1788468144) stands wherever the founder did not
            overrule it and no research fact overturns it
```

Read `base:` carefully. **v2 is not a plan. v2 is a diff against v1.** The default disposition of
every sentence in the previous plan is *stands*. Only two forces can move a row: a founder overrule,
or a research fact. **"This is the wrong shape" is not one of the two admitted forces**, and no
lane in the corpus was ever given standing to say it.

That is the frame problem `THE-VISION-AND-THE-FIELDS.md` later diagnoses in itself — *"written
inside the frame of a design already chosen"* — installed at 15:54 on day one and never revisited.
The commit subject for the same file is the other half of the tell: *"the decision spine — **35
rows, 14 agents plus the Operator, one launcher drives both runtimes**"*. The roster count, the
Operator's existence and the launcher topology were all settled before a single section of v2 had
been written.

### 3.2 Narrowing #2 — the unit of work became the row, and rows only ever accumulate

From 15:54 on day one, every phase of the corpus produced the same artifact type: **numbered rows
appended to SPINE.md.** By 2026-09-07 the counts stood at:

| Register | Span | Count | What it is |
|---|---|---|---|
| §A | v1 → v108 | 108 | decisions |
| §L | O1 → O135 | 135 | "mechanisms decided by the orchestrator" |
| §M | W1 → W69 | 69 | world facts that moved a row |
| §N | R1 → R52 | 52 | research questions gating a build |
| §J | 1 → 91 | 91 | **losing images** — alternatives recorded as having lost |

**The §J register deserves its own sentence. It is a ledger of rejected alternatives, maintained so
that they stay rejected.** Ninety-one roads not taken, each preserved with a name so that reopening
one has to overcome a written record. A corpus that keeps a losing-images ledger has made
re-litigation expensive on purpose. That is a fine property for a plan you are executing and a fatal
one for a plan you are still deciding.

None of the five registers has a **delete** or a **reverse** operation. SPINE's own prose says so:

> **What the rethink round did NOT do.** No founder row was reversed.

### 3.3 Narrowing #3 — "rethink" rounds were briefed *never to reverse anything*

This is the single most damning line in the corpus, and it is in the brief block of the round
literally named *rethink*:

`rethink/L1-drive.md:9`
```
fixed:    v1-v5 and v54-v65 are the founder's. Every proposal below improves INSIDE them.
          Nothing reverses one
```

The same constraint, in the same slot, on the other lanes:

- `rethink/L2-company.md:9` — *"v1–v5 and v54–v65 are the founder's. **Fourteen agents plus the Operator, in two waves, is not reopened.**"*
- `rethink/L4-knowledge.md:9` — *"Nothing below reverses one; three proposals improve inside"*
- `rethink/SYNTHESIS.md:6` — *"founder rows v1–v5 and v54–v65. Nothing below reverses one."*

A round called "rethink", with eight lanes and 78,088 words of output, whose brief forbids reversing
a decision, **cannot rethink. It can only refine.** And note what L2 was forbidden from reopening:
not a safety invariant, not a founder value — *the agent count and the wave structure*, which are
design choices, not commitments.

### 3.4 The date of the visible collapse: 2026-09-07

The narrowing the founder can *see* — "they focused on a specific area" — has a date and it is
**2026-09-07**. Thirty-one commits; twenty-six of them are sandbox, hook, permission, classifier or
night-safety work:

```
09-07 10:48  review: sandbox panel lanes P3, P4, P5
09-07 10:57  review: sandbox panel lanes P1 and P2 — the panel is complete
09-07 11:03  review: P1 round 2 — allowLocalBinding reverses two standing plan facts
09-07 11:18  review: P1 replication — the deterministic claim is dead, the asymmetry stands
09-07 11:24  review: P1 round 4 — denyRead stops the shell, not the agent; plus the R33 probe
09-07 11:32  spine: fold 3 — the sandbox panel's facts, and no posture
09-07 11:46  review: the night-safety design — safety from shape, not from permission
09-07 12:01  review: R46 answered — no classifier in a -p child, but the hook does fire
09-07 12:10  review: R46 round 2 — the hook fires everywhere, and five of its rules share a bypass
09-07 12:33  review: --restricted discards the project tier entirely — both lanes were right
09-07 12:39  spine: fold R46's two halves, the night-safety design, and the settling cell
09-07 12:46  review: twelve pre-existing gaps in the pre-tool-use guard, ranked
09-07 13:03  decisions: §30 — the hook, the classifier, and the night's real floor
```

The register growth that day tells the same story numerically. Of the last 27 world facts ever
recorded in SPINE §M, **23 are about the sandbox, the hook, the classifier or `--restricted`**
(W47–W58 the sandbox panel, W59–W68 the classifier and night-safety, W69 the `--restricted`
settling cell). Of §N's last seven research questions, **all seven** (R46–R52) are the same subject.

### 3.5 The narrowing, measured

Two vocabulary sets counted across the corpus, normalised per 10,000 words. "Business" =
`customer|revenue|market|pricing|sell|selling|sales|stranger|buyer|profit|competitor|brand`.
"Mechanism" = `sandbox|hook|permission|denyRead|restricted|argv|classifier|tmux|pmset|keychain|egress|allowWrite`.

| Phase | Words | business /10k | mechanism /10k | ratio mech:biz |
|---|---:|---:|---:|---:|
| 0 · research lanes (09-05, pre-SPINE) | 17,423 | **21.8** | 59.1 | 2.7 |
| 2 · `parts/` — the plan body | 203,364 | 9.2 | 49.7 | 5.4 |
| 4 · `rethink/` L1–L8 | 78,088 | 8.2 | 30.9 | 3.8 |
| 5 · thinker round | 18,055 | **32.7** | 69.2 | 2.1 |
| 6 · fixer round `rethink-2/` | 30,825 | **32.8** | 50.0 | 1.5 |
| 7 · **the sandbox day** | 33,297 | **1.5** | **294.9** | **197** |
| 8 · `vision/` + THE-VISION-AND-THE-FIELDS | 10,070 | **21.8** | **6.0** | 0.3 |

Phase 7 is not a shift in emphasis. It is a **197:1** ratio against a corpus baseline between 1.5
and 5.4 — a two-orders-of-magnitude excursion. 33,297 words — a seventh of the whole corpus by
volume — contain the word "customer", "market", "revenue" or "stranger" a total of **five times.**

And phase 8, the one document the founder kept, is the only phase where the ratio inverts.

---

## 4. WHAT mechanism caused it — five hypotheses, tested against the corpus

The brief named five candidate mechanisms and asked that they be tested rather than chosen. All five
are present. They are not equally load-bearing, and two of them are consequences of a sixth that the
brief did not name. Verdicts first:

| # | Hypothesis | Verdict | Strength |
|---|---|---|---|
| H1 | The plan got long enough that editing was cheaper than rethinking | **CONFIRMED, but secondary** | contributory |
| H2 | Review rounds optimise what exists rather than what is missing | **CONFIRMED, and mechanised** | **primary** |
| H3 | A security/QA loop consumed the attention breadth | **CONFIRMED as the visible symptom** | proximate |
| H4 | The harness became the subject instead of the instrument | **CONFIRMED, and it was a recorded decision** | **primary** |
| H5 | Each round inherited the previous round's vocabulary | **CONFIRMED, and the corpus knew it** | **primary** |
| H6 | *(not in the brief)* Every round was briefed **not to reverse** anything | **CONFIRMED, verbatim** | **root** |

### H1 · Length made editing cheaper than rethinking — TRUE, and it is a consequence not a cause

`FINAL-PLAN-v2.md` was reassembled from `parts/` **eleven times** in five days. Its length by commit:

```
09-05 16:28   6,252 lines   first assembly
09-05 17:02   6,337         after review round 1's fix round
09-05 21:20   6,979         after the founder interview
09-06 10:36   9,747         after the rethink round      (+2,768 in one fold)
09-06 11:38   9,968         after challenge C / census C
09-06 22:53  12,094         after the fixer round        (+2,126 in one fold)
09-06 23:39  12,344         after challenge D / census D
```

**The plan grew by 97% in 31 hours and never once shrank.** No fold in the corpus has a negative
line delta. The only deletion event in the entire record is SPINE row **v82**, described as *"the
one deletion the founder took"* — one deletion, against 108 decisions, 135 mechanisms and 6,092
added lines.

But note the direction of causation. The corpus did not stop rethinking *because* the document got
long; the document got long *because* the only admitted operation was append. H1 is real and it is
downstream of H6.

**The strongest single artefact for H1 is `COVERAGE.md`'s reassembly note**, which shows the cost of
a fold being paid in pure bookkeeping:

> *"This file cited none of it: its highest citation was v81, and `grep -c 'v8[3-9]\|v9[0-9]\|v10[0-6]'`
> returned **0**. Twenty-four decisions were invisible to the artifact whose whole job is proving
> nothing was dropped. **147 rows are amended in this pass**."*

147 rows of an 671-row table re-amended so that the table could keep agreeing with itself. That is
the marginal cost of one more decision late in the corpus, and it is why the last rounds produced
smaller ideas.

### H2 · Review rounds optimised what existed — CONFIRMED, and the instrument is identifiable by name

This is the strongest mechanical finding in the autopsy, because the corpus **built a completeness
oracle and froze its denominator.**

`COVERAGE.md`, first line:

> *"What this is: the founder's checklist (35 sections · 9 wings · 2 closing blocks · **671 items**)
> placed, item by item, against the v2 plan."*

and later, as a proof of rigour:

> *"Every founder item still has exactly one row: **671 before, 671 after — no item was added**,
> because none of the twenty-four created one."*

Read that sentence as an instrument specification and the defect is structural. **COVERAGE.md can
detect a dropped item. It cannot, by construction, detect a missing area** — because its denominator
is a checklist inherited from the *previous* round (`round-5/FOUNDER-LIST.md` on branch
`ceo-1-1788468144`) and its placement floor is the *previous* plan's coverage file
(`final/COVERAGE.md` on branch `ceo-3-1788468144`). An area nobody thought of in round 5 has no row,
so it cannot come up missing.

The file is aware of the risk and disposes of it with an assertion rather than a mechanism —
`final/COVERAGE.md` is *"read as a floor and not as a frame"*. Nothing checks that. Compare with the
later, good artifact, which fixed exactly this by **building a new denominator from scratch**: 56
fields and 566 questions in `THE-VISION-AND-THE-FIELDS.md`, derived without the plan open.

The rest of the review apparatus points the same way. Seven review rounds ran:

| Round | Type | What it was asked to find |
|---|---|---|
| census (09-05) | consistency | do figures on the page match disk |
| challenge A (09-05) | consistency | rules with no mechanism, contradictions, holes |
| challenge B (09-05) | provenance | does every figure and quote trace to evidence |
| challenge C (09-06) | consistency | same, after the rethink round |
| census C (09-06) | consistency | "one fact two ways" instances |
| challenge D (09-06) | consistency | same, after the fixer round |
| census D (09-06) | consistency | dangling refs, unmarked paths, figure match |

**Six of seven are internal-consistency checks.** Their outputs are counted in `P1 · P2 · P3` and the
verdicts read like `zero dangling refs, zero unmarked paths, 48 of 60 figures matching`. A document
can pass all of that while being about the wrong thing, and this one did.

The one round that was *not* a consistency check — the thinker round of 09-06 12:09 — is treated
below, and its treatment is the single clearest demonstration of H2.

### H2b · The thinker round found the founder's complaint, and the corpus absorbed it as a row

On 2026-09-06 at 12:09, three sealed lanes returned 64 findings. `review/thinkers-digest.md` §1
lists the eight places where postures *designed not to overlap* converged. Convergent finding #2,
verbatim:

> **"No stranger in the build graph.** The only venture is the harness; 'worked' is defined as a
> stranger acting and no node reaches one. The first venture after the harness must be one whose
> anchor is a stranger's action."

Convergent finding #3:

> **"R12 on the harness cannot test assumption 1.** The harness is the most anchorable venture
> possible, so the fraction returns high whatever the truth for pricing, copy, positioning.
> **Selection on the dependent variable.**"

Convergent finding #4:

> **"Vendors are shipping the bottom half of the plan** … The doctrine has no rule for *not
> building*."

**That is the founder's verdict, discovered by the system, five days before the founder said it.**
The digest's own header records what happened to it:

> *"64 findings in all: A 21 · B 23 · C 20. **Nothing in the plan was changed by this round.**"*

What happened next is the mechanism, not the neglect. The fixer round (09-06 17:18–23:40) converted
the findings into answers, and the answers became **SPINE rows**. Finding #2 became row **v85**:

> `v85 | The first stranger | A second, customer-facing venture from the founder's existing projects
> joins wave one … **v64 stands** | FOUNDER, fixer round 2026-09-06: E2`

Note `v64 stands`. Row v64 is *"The first venture: **the harness itself**"*, `class: originated`.
The critique "the plan never reaches a stranger" was resolved by **adding a 109th row** beside the
row it contradicted, and marking the original as still standing.

**A corpus that can absorb any criticism as a row is immune to criticism.** The reviewer's
satisfaction condition ("my finding was dispositioned") and the plan's satisfaction condition ("no
row was reversed") are both met, simultaneously, by an operation that changes nothing about the
shape. That is H2's exact mechanism, and it is why seven review rounds produced a narrower document
rather than a wider one.

Finding #3 is even starker: the founder **overruled** the recommendation that would have tested it
(DECISIONS §28, F2), and the record states the consequence plainly and then moves on —

> *"every review's finding that R12 on the harness cannot falsify the assumption **stands
> unanswered**."*

### H3 · The security/QA loop — CONFIRMED as the visible symptom, not as the cause

2026-09-07 is the day the founder can see. Thirty-one commits, twenty-six on the sandbox, the hook,
the classifier, `--restricted` or night-safety; a 197:1 mechanism-to-business vocabulary ratio
against a corpus baseline under 5.4; five sealed lanes (P1–P5) plus four follow-up rounds on a single
question (`R46`) plus a twelve-item ranked list of pre-existing guard defects.

But the day is a symptom with a cause upstream of it, and the cause is visible in DECISIONS §27,
committed the night before at **23:40**:

> *"The kernel is ready to build and the whole system is not … **the only remaining test is running
> it.**"*

**The corpus reached its own declared exit condition and did not exit.** The next morning it opened a
five-lane panel on the permission model. §27 had already named what to do — *"the data files and the
constitution; `bin/log` and `bin/run`… one bounded-day intent on the first-stranger venture through
one anchor, read in the morning"* — and none of the three happened. What happened instead was 33,297
words in which the words "customer", "market", "revenue" and "stranger" appear five times in total.

So H3 is true as described but it is the *shape* of the failure, not its engine. Something had to
fill 09-07, and the sandbox was what was available to be rigorous about.

### H4 · The harness became the subject — CONFIRMED, and it was ratified as a founder decision

This is not drift. It is row **v64**, `class: originated`, in the founder's own words: *"The harness
itself."* The row records its own cost:

> *"**The cost, once, and LONG-TERM.md's standing note applies:** the machine tests itself again; **no
> customer-facing work has ever run through it.**"*

Once the harness is the venture, everything true about the harness is also strategy, and there is no
longer a boundary between "improving the instrument" and "doing the work". The corpus says so about
itself, twice, in the method notes it earned on 09-07:

> *"One model family **measuring its own runtime and reviewing its own guard**, in one day."*

> *"**The guard refused this session five times while documenting itself** — a probe command, a commit
> message, vendor documentation quoted into a file, and twice while writing the file describing its
> own bugs. A guard that prevents its own defects being written down is a guard whose defects do not
> get fixed."*

And the corpus's own last two commits, 2026-09-10, are `fix(warroom): close the fourth-gate P2s` and
`fix(warroom): the Codex acknowledgment leaves git`. **A planning corpus for a company that mostly
runs itself ends in two bug fixes to its own permission plumbing.** That is H4 with a timestamp.

### H5 · Vocabulary inheritance — CONFIRMED, and the corpus diagnosed it correctly in one place only

Each round's unit of thought was the previous round's unit of record:

- The **rethink** lanes were briefed by *keyword lists taken from the plan's own section index* — `L1-drive.md`: *"sections: 01 Missions & drive (30) · 21 Agent cognition (36) · 22 Task & ticket breakdown (17) = **83 keywords**"*. A lane that enumerates the plan's keywords finds gaps *between* the plan's keywords.
- The **fixer** lanes took the thinker reports as `Primary input` and read `SPINE §A–§N, FINAL-PLAN-v2 §0–§23` *whole*.
- Every product of every round landed in one of five registers — `v`, `O`, `W`, `R`, `§J` — that existed before the round started.
- The `§J` **losing-images ledger** grew to 91 entries, each a named alternative recorded as having lost. The register's existence converts "we considered this" into "this is settled".

The corpus solved this exactly once, in `THE-PATH-TO-THE-VISION.md` Step 4, and the solution is a
*mechanism*, not a resolution:

> *"**Exit criterion:** the draft contains no term that exists only inside this repository.
> Mechanised: **build a stop-list from the plan's own vocabulary and fail the draft if it uses one.**
> A vision that needs a glossary of ours to read is a design document with the word 'vision' on it."*

That stop-list was never applied to `SPINE.md`, to any `parts/` file, to `COVERAGE.md`, or to any
review round.

### H6 · The root: every round was briefed never to reverse anything

None of H1–H5 explains why the *round named `rethink`* did not rethink. The brief does:

```
rethink/L1-drive.md:9      fixed:  v1-v5 and v54-v65 are the founder's. Every proposal below
                                   improves INSIDE them. Nothing reverses one
rethink/L2-company.md:9    fixed:  … Fourteen agents plus the Operator, in two waves, is not reopened.
rethink/L4-knowledge.md:9  fixed:  … Nothing below reverses one; three proposals improve inside
rethink/SYNTHESIS.md:6     fixed:  … Nothing below reverses one.
```

and above them, in `SPINE.md`'s own terms of reference, committed at 15:54 on day one:

```
binds:  the founder's direction of 2026-09-05 … Never re-litigated
base:   final/FINAL-PLAN.md (branch ceo-3-1788468144) **stands** wherever the founder did not
        overrule it and no research fact overturns it
```

Two forces could move a row: a founder overrule, or a world fact. **"This is the wrong shape" was
not an admitted force at any point in the corpus.** Every lane that wanted to say it had to say it
as a finding, and every finding became a row, and no row reverses another.

That is the complete mechanism, and the founder's sentence — *"they lost the want and need to fix
the other areas, to think big"* — is a description of the brief they were given.

---

## 5. The sealed-lane test — the cure was applied once, to one document

`THE-VISION-AND-THE-FIELDS.md` names both the disease and the cure in its own third paragraph:

> *"**Two earlier versions were rejected for being written inside the frame of a design already
> chosen.** This one was produced differently: **three lanes reasoned about the ambition without
> reading the plan**, one of them tasked with attacking it and given the means to check things in
> the world. Their files are in `vision/`. Where they disagreed, this text says so rather than
> picking a winner."*

The brief asked whether that cure was ever applied to the rest of the corpus. **It was not, and the
reason is a collision of two different meanings of one word.**

The corpus uses "sealed" constantly — 30+ occurrences across 14 files. In every case except the
`vision/` lanes, **"sealed" means sealed from sibling lanes and from prior review output, while
reading the entire plan.** Here is every lane in the corpus, with what its own header says it read:

| Lane | Date | Sealed FROM | Read the plan? |
|---|---|---|---|
| `research/{7 lanes}` | 09-05 | each other | **n/a — ran before SPINE existed** |
| `review/census` | 09-05 | siblings | YES (it is a census *of* the plan) |
| `review/challenge-a` | 09-05 | siblings | YES — *"sealed lane (plan + handoff only)"* |
| `review/challenge-b` | 09-05 | siblings | YES — *"sealed lane (plan + research only)"* |
| `rethink/L1–L8` | 09-06 | each other | YES, and briefed `fixed: … Nothing reverses one` |
| `rethink/SYNTHESIS` | 09-06 | — | YES |
| `review/challenge-c` | 09-06 | siblings | YES — *"sealed lane (plan + founder's list only)"* |
| `review/census-c` | 09-06 | siblings | YES (*"sealed from SPINE by brief"* — from SPINE, not from the plan) |
| `review/thinker-A/B/C` | 09-06 | *"no review/, round-6/, returns/ or session files read"* | **YES — "I read SPINE, all 25 sections of FINAL-PLAN-v2, SYNTHESIS, world.md, DECISIONS §15–§22, and the harness"** |
| `rethink-2/A,B,C` | 09-06 | siblings | **YES — "Read whole: SPINE §A–§N, FINAL-PLAN-v2 §0–§23…"**, briefed *"doctrine stands unless argued; founder rows … never decided here"* |
| `review/challenge-d` | 09-06 | *"no review/, rethink-2/, returns/ or session file"* | YES |
| `review/census-d` | 09-06 | siblings | YES |
| `review/sandbox-P1…P5` | 09-07 | each other | YES (and scoped to the permission model) |
| `research/close-W/M/C` | 09-07 | each other | YES |
| **`vision/A-ambition`** | **09-09** | siblings | **NO — "Written without reading the plan"** |
| **`vision/B-sceptic`** | **09-09** | siblings | **NO — "I did not read `SPINE.md`, `FINAL-PLAN-v2.md` or `COVERAGE.md`"** |
| **`vision/C-consequences`** | **09-09** | siblings | **NO — reasons from success, not from the design** |

**Seventeen lane-families. Three of them — all three written on the last research day, all three
feeding the one document the founder kept — were sealed from the design.**

### Why lane-sealing without design-sealing makes the narrowing *worse*, not better

This is the part worth being precise about, because the corpus was not lazy. It ran a genuinely
rigorous independence protocol; it just ran it on the wrong axis.

Sealing lanes from each other buys **independence of judgement**. When three sealed lanes converge,
the convergence is real signal — `thinkers-digest.md` §1 says so and is right to. But independence
of judgement over a shared input **does not buy independence of frame**. Three readers who all read
the same 12,344-line plan will disagree about details and agree about scope, because scope is what
the input fixed for all of them.

That is visible in the output. The thinker round's convergences are the sharpest criticism in the
corpus — and every one of the eight is phrased as *something the plan does not do*, never as
*something other than this plan*. Finding 7: *"The plan cannot bind because nothing that acts can
read it."* Finding 1: *"The founder's attention is the scarcest input and nothing budgets it."* Each
is a correct, valuable, **inside-the-frame** finding. No lane said "this should not be a fourteen-
agent company with an Operator", because no lane had standing to and the one lane that touched the
count (B22, C15) proposed *renaming the row* to `converged` rather than changing it.

Meanwhile the sealed-from-design lanes produced, in one day and 10,070 words:

- the reframing of trust as **consequence-bounded rather than record-bounded** — *"Freedom would then be widest exactly when nobody had looked recently"* — which reverses a premise the plan had carried since v1;
- the identification of the durable position as **the account, not the work** — *"What nobody sells, and what no vendor will build, is a truthful account of work you did not watch"* — which is the answer to thinker finding #4 that the fixer round could not produce from inside;
- the reframing of the goal from output to **the cost of being wrong** — *"how many real attempts reached real strangers, and how quickly the failures were buried"*;
- **the competence-decay problem**, which has no row anywhere in SPINE's 108: *"There is no signal for this from inside, because the owner is the instrument and the instrument is what drifted."*

None of those four is reachable by a lane reading the plan, because none of them is a defect *of*
the plan. **That is the test, and the corpus fails it everywhere except `vision/`.**

### The second half of the cure was also applied once

`THE-PATH-TO-THE-VISION.md` Step 4 states the *mechanised* form:

> *"Exit criterion: the draft contains no term that exists only inside this repository. Mechanised:
> build a stop-list from the plan's own vocabulary and fail the draft if it uses one."*

And `THE-VISION-AND-THE-FIELDS.md` Part two states why:

> *"**A question phrased in the language of a design already chosen can only find the gaps that
> design anticipated.** The point of this list is the opposite: to be answerable by someone who has
> never read a line of the plan, so that **a missing answer shows up as missing rather than as
> already handled**."*

Compare that sentence with `COVERAGE.md`'s guarantee — *"671 before, 671 after — no item was
added"* — and the two instruments are exact opposites. One is built so that a missing area shows up.
The other is built so that it cannot.

### The single clearest worked example of the failure: row v31

Everything above happens in miniature inside one SPINE row, and it is worth reading as a unit.

1. **09-05 15:38** — `research/roster.md`, an outward-facing lane with 15 sources fetched, returns:
   *"Every shipped **running** roster I could verify is **5–6 agents**; every roster of **150+** is a
   *catalogue* you pick from, not a team that runs together. That distinction is the single most
   load-bearing fact for the founder's 'ten to fifteen'."*
2. **09-05 15:54** — `SPINE.md` v1 is written: *"**Fourteen named agents plus the Operator**"*,
   `class: originated`.
3. The research fact is absorbed into v31 as a **cost note**: *"The cost, stated once and not
   re-litigated: every shipped running roster verified is 5–6 agents … Ten to fifteen sits in a band
   nobody publishes evidence for."*
4. The alternatives go to the losing-images column: *"Magentic-One's five; ChatDev's six;
   Anthropic's 3–5 concurrent subagents."*
5. **09-06 07:47** — `rethink/L2-company.md` is briefed: *"**Fourteen agents plus the Operator, in
   two waves, is not reopened.**"*
6. **09-06 12:09** — two thinkers challenge it anyway (B22, C15) and the strongest thing they can
   propose from inside the frame is to *relabel the row* `converged`.

Evidence found → recorded as a cost → alternatives filed as losers → reopening forbidden by brief →
challenge absorbed as a relabel. **Five steps, twenty hours, and the frame is now load-bearing for
everything built on top of it.** The corpus did this 108 times.

### 5.1 The last finding in this section, and it is the sharpest one

`THE-PATH-TO-THE-VISION.md` — the six-step method, with a falsifiable exit criterion on every
step — was committed **2026-09-09 at 14:38**. Its Step 1 produces `vision/TRIAGE.md`. Its Step 4
produces `THE-VISION.md`. Its Step 5 runs the stranger test, *"the only step here that can fail
loudly."*

```
$ find docs -name 'TRIAGE*'      →  (nothing)
$ find docs -name 'THE-VISION.md' →  (nothing)
```

**Neither exists. Step 1 was never begun.** The next commit in the repository is **09-09 14:50** —
twelve minutes later — *"docs(research): measure the real Codex CLI before driving it"*. The two
after that are Codex sandbox disclosure, and the final two commits of the entire corpus, on
2026-09-10, are `fix(warroom)` bug fixes to the permission plumbing.

The corpus wrote down the correct method, and then, inside twelve minutes, went back to measuring a
CLI and fixing its own guard. **That twelve-minute gap is the founder's complaint with a
timestamp.** It is not that the work was bad. It is that the work knew what to do next and did
something narrower instead, because the narrower thing was tractable and the method was not yet
anybody's dispatched task.

---

## 6. WHICH parts are genuinely worth keeping

The failure mode this section exists to avoid: *discarding good work because its frame was wrong.*
Most of the 5.3 MB is frame-dependent. A usable amount is not, and the dividing line is sharp and
mechanical:

> **A measurement survives a reframing. A decision does not. A method may, if it names its own exit
> criterion.**

Sort the corpus on that line and it separates cleanly.

### 6.1 KEEP WHOLE — the frame-free artifacts (~66 KB, four files plus three lanes)

**`THE-VISION-AND-THE-FIELDS.md` (55.5 KB).** The founder already says so. What makes it reusable
rather than merely liked: it is **a denominator built from outside**, 56 fields and 566 questions,
in nobody's vocabulary. It is the only instrument in the corpus that can report an area as missing.
Round 2's completeness check should be *this file*, not `COVERAGE.md`.

**`THE-PATH-TO-THE-VISION.md` (162 lines).** Unexecuted and therefore uncontaminated. It is the only
document in 5.3 MB where every step carries a stated exit criterion, the failure modes are named
before the work, and the hardest one is named honestly: *"Triage is where all the judgement is, and
it is the step with no independent check on it. A question mis-sorted from F into D is a decision
quietly taken away from the founder — and it would look exactly like efficiency."* **Execute it.
Do not rewrite it.**

**`vision/A-ambition.md`, `vision/B-sceptic.md`, `vision/C-consequences.md` (~86 KB).** The only
design-sealed lanes. Four specific arguments in them are load-bearing and appear nowhere else in the
corpus:
1. **Permission follows consequence, never track record.** *"Freedom would then be widest exactly when nobody had looked recently."* This inverts a premise the plan carried from v1.
2. **The durable position is the account, not the work.** *"What nobody sells, and what no vendor will build, is a truthful account of work you did not watch … because such an account has to be adversarial toward whoever produced the work, and they are the producer."* This is the answer to thinker finding #4 that no inside-the-frame lane could reach.
3. **Success is the cost of being wrong, not output.** *"how many real attempts reached real strangers, and how quickly the failures were buried."*
4. **Owner-competence decay.** *"There is no signal for this from inside, because the owner is the instrument and the instrument is what drifted."* There is no SPINE row for this, in 108.

### 6.2 KEEP AS DATA — the measurements (frame-independent, but perishable)

These cost real shell time and real fetches and are true regardless of what gets built. **Every one
must carry the binary version and date it was taken against, and several are already at risk of
being stale** — they were measured against `claude 2.1.263` and `codex-cli 0.153.4` on
`Darwin 25.5.0`.

| Source | What it holds | Why it survives a reframe |
|---|---|---|
| `research/{roster,skills,runtimes,surfaces,models,memory,cognition}.md` (09-05) | 15+ sources fetched on what shipped systems actually do; *"every shipped running roster verified is 5–6 agents; every roster of 150+ is a catalogue"* | facts about other people's systems |
| `research/world.md` (09-06) | changelogs of Claude Code, Codex, Gemini CLI; Devin; Factory | the vendor-overlap picture any plan needs |
| `research/close-{W,M,C}.md` (09-07) | 12 documentary answers · 5 Mac measurements · 12 child-spawning measurements, each with its command | runtime facts |
| `research/codex-in-the-pane.md` (09-09) | what `codex-cli 0.153.4` actually does, every row with its command and exit code, *"nothing here is inferred from the vendor's documentation"* | the best-disciplined measurement file in the corpus |
| `research/five-hour-window.md` (09-07) | the rolling-5-hour-window claim sourced to support.claude.com 2026-08-07, and *"the claim is wrong in two ways"* | a vendor fact with a citation |
| `review/sandbox-P1…P5` + `review/{hook-gaps,r46-classifier,restricted-hook-cell}.md` (09-07) | the permission-model facts: `--restricted` discards the project tier; `denyRead` stops the shell not the agent; no classifier in a `-p` child but the hook does fire; the semicolon bypass; twelve ranked pre-existing guard gaps | **this is the one thing worth keeping from the day that broke the corpus** — the day was a narrowing, its findings are still true |
| `review/thinker-A.md` §A1–A13 | the founder's actual machine: sleeps every ~19 min on battery with the lid closed; 219 of 224 teammates `in-process` with no pane; 3,116 transcripts / 3.1 GB outside the erasure path; sandboxed Bash cannot reach loopback; `--fallback-model` reroutes silently; `--autocompact` on by default; ~53 tokens per skill | facts about the hardware and runtime any round 2 also runs on |

**The disposition for all of the above: move them to a `facts/` directory with an expiry and a
re-derivation command, and cite them. Do not re-measure what is still in date.**

### 6.3 KEEP AS MECHANISM — five ideas that are good independently of the plan they were built for

1. **The commodity line (`v96`).** Every mechanism carries `class: kernel | adapter | refuse` and a `vendor_wins_if:` — *"build a mechanism only where no vendor surface exists or is announced, or where it is one of the kernel four"*, and *"a matched `vendor_wins_if:` forces Delete rather than a second implementation."* This is the direct antidote to *"vendors are shipping the bottom half of the plan"*, and it is a rule with teeth. **Keep the rule; discard the 135 rows it was applied to.**
2. **Data-first (`v97`).** The binding 2% (roster, routing, schemas, prices, facts, rules) becomes YAML the prose is rendered from, with a constitution inside the runtime's payload budget. This is the answer to thinker finding #7, *"the plan cannot bind because nothing that acts can read it"* — and it is the answer to a 12,344-line plan generally.
3. **`class: originated | ratified` (`v89`/E5).** A decision picked from an agent's list is a different object from one the founder said, and a ratified row is *"reopenable by any engine that brings a reason and a falsifier."* Round 2 should make this the **default**, and invert the burden: a row is reopenable unless it names a consequence that cannot be undone.
4. **The shape rule**, stated in `rethink-2/A-practitioner.md`: *"the thing that sends holds no model, the thing that judges cannot edit, the thing that reads the world holds no key."* Three separations, each mechanical, none dependent on there being fourteen agents.
5. **The four kernel concerns**, same file: *"direction with a done-test, an append-only record with provenance, truth from anchors and reconciliation, and one founder's taste."* This is the shortest honest statement of what the system is for that the design side of the corpus produced.

### 6.4 KEEP AS EPISTEMICS — the method notes, which are better than the plan they served

`DECISIONS.md` §29 and §30 contain the best writing in the corpus, and none of it is about Keel:

- *"**Attribute a control by verbatim signature, never by an action having failed.** Reasoning from a failure is what made two capable lanes appear to contradict each other for half a day."*
- *"**A probe that names what it is testing measures the model, not the mechanism.**"*
- *"**A lane measures precisely; the orchestrator compresses; the compression is what propagates.** Every one was caught by a lane checking the file rather than accepting the brief."* (four instances in one day)
- *"**A guard that prevents its own defects being written down is a guard whose defects do not get fixed.**"*
- *"**A wrong diagnosis that produces a plausible fix is the expensive kind.**"*
- *"A teammate relaying the founder's authorization is not what grants capability here."*

**Promote these out of a decision log and into the operating standard.** They are the return on the
five days that is certain.

### 6.5 KEEP, BUT WITH ITS STATUS VOIDED — the losing-images ledger

`SPINE §J`, 91 entries, plus `parts/22-losing-images.md` (47 KB). Every alternative the corpus
considered and set aside, kept by name with the reason. **The content is a gift to round 2 and the
status is poison.** Re-import it as `considered.yml` with every entry's disposition reset to
`open`, and with the reason preserved as an *argument to answer*, not a verdict to respect.

### 6.6 DEMOTE — what should not be carried forward as binding

- **`FINAL-PLAN-v2.md` (12,344 lines).** Its own thinkers found it cannot bind because nothing that acts can read it, and the fix (`v97`, data-first) was ratified and never built. Keep it as an archive; do not edit it again. **Editing it is the trap: eleven reassemblies, +97% lines, zero deletions.**
- **`COVERAGE.md`'s 671-item frame.** Keep the founder's checklist as *one input among several*; never again as the denominator. Its guarantee — *"671 before, 671 after — no item was added"* — must be read in round 2 as a **failure report**.
- **`SPINE §A` v1–v108 as binding rows.** Keep as a historical record of what was decided and why. Reset every row to `proposed` and let round 2 re-derive which ones survive contact with a denominator built from outside.
- **`SPINE §L` O1–O135.** 135 mechanisms decided inside the frame, most of them adapters to a design that may not survive. Re-derive from the commodity line rather than re-reading.
- **`page/*.html` (353 KB).** Renderings of the above.

---

## 7. WHAT the next round must structurally do differently

Mechanisms, not resolutions. Each one below names what it checks, what it fails on, and — where the
evidence supports it — the exact moment in the v2 corpus it would have fired. A resolution
("think bigger", "stay strategic") is what the v2 corpus already had: `COVERAGE.md` asserted its
predecessor was *"read as a floor and not as a frame"*, and nothing checked it.

### M1 · Sealing is declared on two axes, and every round must have a design-sealed lane

Every lane brief carries:

```
sealed_from: [siblings]           # independence of judgement
             [design]             # independence of frame — did not read the plan
             [vocabulary]         # output checked against the stop-list of M5
```

**Fails when:** a round dispatches zero lanes with `design` in `sealed_from`.
**Would have fired:** on every round of the v2 corpus except `vision/` (09-09) — seventeen
lane-families, three sealed from design, all three on the last research day.

### M2 · The completeness denominator is rebuilt from outside, never inherited

The instrument that answers "is anything missing" is regenerated each round by a design-sealed lane,
in ordinary language, and then **diffed against the previous round's**.

**Fails when:** the new item list contains zero items absent from the previous one, and no lane
explains why.
**Would have fired:** at `COVERAGE.md`'s own proudest sentence — *"671 before, 671 after — no item
was added."* Under M2 that is the alarm, not the proof. (For calibration: the design-sealed
instrument built two days later found **56 fields and 566 questions** from scratch.)

### M3 · REVERSE is an admitted operation with its own register, and zero reversals is a reportable result

Add a register beside the decisions table: **retired rows**, each with the reason and the round that
retired it. A round reports `N decided · M retired`.

**Fails when:** a round closes with `M = 0` and no lane recorded an attempt.
**Would have fired:** the entire corpus. 108 decisions, 135 mechanisms, 6,092 net added lines,
**one deletion** (`v82`), and `SPINE.md`'s own line *"What the rethink round did NOT do. No founder
row was reversed."* written as reassurance.

### M4 · No brief may fix a design choice; briefs may fix only values and irreversibilities

A brief's `fixed:` block may contain only: what costs the founder money, what cannot be undone, what
spends the founder's hours, and what the founder said they want in their own words *as a want*, not
as an implementation.

**Fails when:** a lane brief's `fixed:` or `rule:` line names a count, a topology, a roster, a
component or a wave. Grep the briefs for `is not reopened | nothing reverses one | never
re-litigated | stands unless argued`.
**Would have fired four times on one morning:**
`rethink/L1-drive.md:9` · `rethink/L2-company.md:9` (*"Fourteen agents plus the Operator, in two
waves, is not reopened"*) · `rethink/L4-knowledge.md:9` · `rethink/SYNTHESIS.md:6`, and again on
`rethink-2/B-outsider.md` (*"doctrine stands unless argued"*).

### M5 · The vocabulary stop-list is built and actually run

`THE-PATH-TO-THE-VISION.md` Step 4 already specifies it: *"build a stop-list from the plan's own
vocabulary and fail the draft if it uses one."* Build it from v2's terms — *Keel, the Operator, the
Desk, the Watch, the Floor, the cord, the rung, a which, the spine, a losing image, the charter, an
intent, a pack, an anchor, sterility* — and apply it to every framing artifact of round 2.

**Fails when:** a framing artifact uses a term that exists only inside this repository.
**Note:** this is the one mechanism in the corpus that was *specified* and never *run*. Running it
is most of the work.

### M6 · Breadth is budgeted and measured, with the counter from §3.5 of this file

Before a round opens, declare the maximum share of its output that may concern the harness's own
runtime — permissions, sandboxes, hooks, launchers, panes. Measure it with a vocabulary-density
count and report it at every round close.

**Fails when:** one subject exceeds its declared share.
**Would have fired at 2026-09-07 10:57**, when the fifth sandbox lane returned. That day ran to
33,297 words at a **197:1** mechanism-to-business ratio against a corpus baseline under 5.4, and
contained the words customer, market, revenue or stranger **five times in total.**

### M7 · A declared exit condition terminates the round

When a round writes down what remains to be done, that sentence is a **stop**, and further dispatch
requires a new, named round with a new brief.

**Fails when:** a round continues past its own declared exit.
**Would have fired at 2026-09-06 23:40**, when `DECISIONS.md` §27 wrote *"The kernel is ready to
build and the whole system is not … **the only remaining test is running it**"* and named the three
next steps. None of the three happened; the corpus ran four more days, on the permission model and
then on its own bug fixes.

### M8 · A criticism may not be dispositioned by appending

If a finding contradicts a standing row, the round closes with exactly one of the two marked
`retired`. **"X stands, and here is Y beside it" is refused.**

**Fails when:** a new row's justification cites a finding against an existing row that the same
round leaves standing.
**Would have fired on `v85`:** *"A second, customer-facing venture … joins wave one … **v64
stands**"*, where v64 is *"The first venture: the harness itself"* and the finding it answers is
*"No stranger in the build graph"* — a convergence of all three sealed thinker lanes. Under M8, one
of v64 and v85 ends that round retired, and the founder decides which. Under v2's rules both
survived, and the critique was neutralised by arithmetic.

### M9 · Lane-allocation is reported per subject, and concentration is itself a finding

Count lanes per subject per round. A subject taking more than a declared share of a round's lanes is
escalated as a finding *about the round*, addressed to whoever briefs the next one.

**Would have fired** the same morning as M6: five sealed lanes (P1–P5) plus four follow-up rounds on
a single question (R46) plus a twelve-item ranked guard-defect list, all on the permission model, in
one day.

### M10 · Every world fact carries the binary it was measured against, and expires

`claude 2.1.263` · `codex-cli 0.153.4` · `Darwin 25.5.0` · a date · a re-derivation command. The
corpus already does this well in `research/codex-in-the-pane.md` and unevenly elsewhere. Make it the
rule, and make an expired fact `unresolved` rather than `true`.

**Rationale from the corpus itself:** seven SPINE rows were falsified by the research close of
09-07, and one of those seven corrections was falsified again by a correction round the same
morning — because *"the metric everything rested on was structurally incapable of returning the
answer it was asked for."*

### M11 · The stranger test is run, and it is the round's gate

`THE-PATH-TO-THE-VISION.md` Step 5: hand the artifact to a reader with no access to the repository,
ask them to describe the company, and compare against the founder's own words. *"the only step here
that can fail loudly."*

**Fails when:** the round closes without it having been run.
**Would have fired** on 2026-09-09 at 14:50, twelve minutes after the method that specifies it was
committed.

### M12 · The founder-facing question filter, already written, becomes a check

`DECISIONS.md` §28 records the founder's standing instruction — *"I wanted to give me only the
answers that only I can answer"* — and the orchestrator's own test: *"a question reaches the founder
only if it turns on their money, their machine, their hours, their business or their appetite for
risk."* The same section records it being violated in the same breath it was given (F4). Make it a
predicate on the question set before the round opens, not a reflection after.

---

## 8. The diagnosis in one page

**What went wrong is not that the planners were narrow. It is that every instrument they built was
an instrument for *internal agreement*, and they built seven of them.**

Seven review rounds: census, challenge A, challenge B, challenge C, census C, challenge D, census D.
Six of seven check whether the document agrees with itself. Their verdicts read *zero dangling
references, zero absent-and-unmarked paths, 48 of 60 figures matching*. A coverage file with a
frozen 671-item denominator proves nothing was dropped. A losing-images ledger, 91 entries, proves
that alternatives were considered. A decision spine with five monotonic registers proves that every
choice has provenance.

**All of it is true, and none of it can detect the failure the founder is describing**, because the
failure is not an inconsistency, a drop, an unconsidered alternative or an unsourced claim. It is
that the whole apparatus was pointed at a shape fixed thirty-seven minutes into day one —
`base: final/FINAL-PLAN.md … stands`, `binds: … Never re-litigated`, *"35 rows, 14 agents plus the
Operator"* — and the only two forces admitted to move that shape were a founder overrule and a world
fact. **"This is the wrong shape" was never an admitted force.**

The system was not blind to this. On 2026-09-06 at 12:09, three lanes sealed from each other
converged on *"No stranger in the build graph"*, *"R12 on the harness cannot test assumption 1 —
selection on the dependent variable"*, and *"vendors are shipping the bottom half of the plan; the
doctrine has no rule for not building."* That is the founder's verdict, discovered by the corpus,
three days early. The digest that recorded it also recorded its fate in one clause: **"Nothing in
the plan was changed by this round."** The fixer round then converted the criticism into rows, and
the row answering *"no stranger in the build graph"* ends with the words **`v64 stands`**.

A corpus that can absorb any criticism as a row cannot be criticised. That is the mechanism. Length
(H1), inward focus (H4) and vocabulary inheritance (H5) are all real and all downstream of it; the
sandbox day (H3) is what a rigorous team does with a day when the frame is closed and the exit
condition has already been declared and ignored.

**And the cure was found, written down, and not applied.** Two vision drafts were rejected for being
*"written inside the frame of a design already chosen"*; three lanes were then sealed from the
design and produced, in one day and 10,070 words, four arguments that 5.2 MB of inside-the-frame
work had not reached. Twelve minutes after the method for generalising that cure was committed, the
corpus went back to measuring a CLI binary, and its last two commits are bug fixes to its own
permission guard.

**Round 2's job is not to think bigger. It is to make "this is the wrong shape" an operation the
process can perform** — M3's retire register, M4's ban on design in a brief, M8's refusal to
disposition a criticism by appending — **and to point at least one lane per round at a denominator
the plan did not write** — M1's design-sealed lane, M2's rebuilt item list, M5's stop-list, M11's
stranger.

Everything else in this document is evidence for those four.

---

## Appendix · evidence log

Every claim above is re-derivable. The commands, run 2026-09-11 on branch `ceo-1-1788609834` from
the repository root:

```bash
# corpus size and shape
find docs/03-system-design/final-v2 -type f | wc -l                       # 89
find docs/03-system-design/final-v2 -type f -exec wc -lc {} + | tail -1   # 45936 lines, 5270836 bytes

# chronology — the order things were written
git log --reverse --format='%ad|%s' --date=format:'%m-%d %H:%M' \
  -- docs/03-system-design/final-v2/
git log --format='%ad' --date=short -- docs/03-system-design/final-v2/ | sort | uniq -c
#   55 2026-09-05 · 68 2026-09-06 · 31 2026-09-07 · 10 2026-09-09 · 3 2026-09-10

# the plan only ever grew
for c in $(git log --format=%h --reverse -- docs/03-system-design/final-v2/FINAL-PLAN-v2.md); do
  git show $c:docs/03-system-design/final-v2/FINAL-PLAN-v2.md | wc -l; done
#   6252 6337 6979 6979 6979 9747 9771 9963 9968 9968 12094 12344

# the briefs that forbade reversal
grep -n '^fixed:' docs/03-system-design/final-v2/rethink/*.md

# what "sealed" meant, everywhere it is used
grep -rn '[Ss]ealed' docs/03-system-design/final-v2/

# the frozen denominator
grep -n '671' docs/03-system-design/final-v2/COVERAGE.md

# the criticism, and its disposition
sed -n '9,20p'  docs/03-system-design/final-v2/review/thinkers-digest.md
grep -n 'v64\|v85' docs/03-system-design/final-v2/SPINE.md

# the method that was written and never run
find docs -name 'TRIAGE*' -o -name 'THE-VISION.md'        # (nothing)

# the vocabulary-density counter used in §3.5 — business terms vs mechanism terms per 10k words
biz='customer|revenue|market|pricing|sell|selling|sales|stranger|buyer|profit|competitor|brand'
sec='sandbox|hook|permission|denyRead|restricted|argv|classifier|tmux|pmset|keychain|egress|allowWrite'
# applied per phase directory; see the table in §3.5
```

**Standing caveat on this document.** One lane, one model family, one day, reading a corpus written
by the same model family. Every finding here is the kind of finding the corpus itself would rank
`rung 4`. What makes the central claims checkable rather than merely argued is that they rest on
git timestamps, file counts, grep results and verbatim quotation rather than on judgement — and
every one of those is re-derivable with the commands above. The judgement is in §6 and §7, and
should be read as judgement.
