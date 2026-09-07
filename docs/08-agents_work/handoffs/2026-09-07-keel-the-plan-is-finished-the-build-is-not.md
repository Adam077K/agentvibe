# Handoff — Keel: the plan is finished, the build is not, and the kernel is what starts

**From:** ceo (`ceo-1-1788609834`) · **Date:** 2026-09-07 · **Base:** local `main` = `b2cabad`, 131 commits
on top · **Landing branch:** `docs/final-v2`, composed onto `origin/docs/final-plan` (PR #131 head `7fe8ede`)
· **Pushed:** nothing. **Built:** nothing. **Spent:** nothing.

---

## 0 · Read this first, in this order

1. `docs/03-system-design/final-v2/FINAL-PLAN-v2.md` — the plan. 12,344 lines, 25 sections, 36 flowcharts.
   Assembled from `parts/`; **never edit it, edit a part and reassemble.**
2. `docs/03-system-design/final-v2/SPINE.md` — what binds. §A 106 decision rows, §I 18 open decisions,
   §J 90 losing images, §K the section plan, §L 127 mechanisms, §M 41 world facts, §N 41 research questions.
   **The spine wins over the plan wherever they disagree.**
3. `docs/03-system-design/final-v2/DECISIONS.md` — §1–§28, the decision log. §24, §25, §26, §27, §28 are
   this session's.
4. `docs/03-system-design/final-v2/page/final-plan-v2.html` — the plan for a phone, 143 tiles.
   `page/three-lenses-on-keel.html` — the criticism, presented.

Do **not** open `docs/03-system-design/round-6/`. The founder has refused it three times. It is not a
judgement about its contents; it is a decision about scope, and re-opening it re-opens a settled argument.

---

## 1 · Where the work stands

The plan is finished **as a plan**. It has been through four rounds: a research and build round, an interview
round, a rethink round, and a criticism round. The last of these is the one that matters to you.

| Artifact | State |
|---|---|
| The plan | 12,344 lines · 25 sections · 36 flowcharts · assembled, current |
| The spine | 106 rows · 127 mechanisms · 41 facts · 41 questions · 90 losing images |
| Coverage | **STALE** — predates the fixer round, mentions none of rows v83–v106 |
| Reviews | 11 files under `review/`, all recorded verbatim, none summarised away |
| Pages | 2, both current |
| Mechanisms built | **1 of 127.** 117 are ABSENT with a named path; the rest are marked otherwise |

**One thing is unfinished and it is the only documentation gap I know of:** `COVERAGE.md` was last touched
before the fixer round and does not mention the twenty-four rows that round added. Coverage is the artifact
that certifies every item of the founder's original direction landed somewhere, so it is the one file that
can still be wrong about completeness. One builder pass closes it.

---

## 2 · What the criticism round found, because it changes how you should read the plan

Three sealed expert lanes read the whole plan without seeing each other or any producer's account, and
returned 64 findings. Three more designed the fixes. The founder decided fourteen merged questions. Then a
sealed challenge and a sealed census read the result and returned 30 more findings, all closed in two fix
rounds. Everything is in `review/` and `rethink-2/`.

**Eight findings arrived from all three lanes independently.** Take these seriously; convergence across
postures that were designed not to overlap is the strongest signal the round produced.

1. **The founder's attention is the scarcest input and nothing budgeted it.** Now three gauges: the window,
   the founder's decisions, the founder's hours.
2. **No stranger in the build graph.** The plan defined *worked* as a stranger acting and had no node that
   reached one. Now there is a second, customer-facing venture in wave one.
3. **The test of the central assumption was circular** — run on the harness, the most anchorable venture
   possible. Split three ways. **Still open, by the founder's decision. See §4.**
4. **The vendors are shipping the bottom half of the plan.** Every mechanism now carries
   `class: kernel | adapter | refuse` and a `vendor_wins_if:`. Kernel is direction, record, truth, taste;
   94 of 127. Everything else is a thin wrapper that dies when the vendor ships its surface.
5. **The night was designed before the machine that could run it.** No box was bought; the Watch now
   computes a `night_capable` predicate and refuses when it is false.
6. **Sixteen-of-sixteen agreement was a warning, not a mandate.** Founder rows now carry
   `class: originated | ratified`. 28 are the founder's words and cannot be reopened by an engine; 24 were
   picked from an agent's list and can be, with a reason and a falsifier.
7. **The plan is too long to bind anything.** Nothing that acts can read 12,344 lines. The fix is designed
   and unbuilt: seven data files the prose is rendered from, and a constitution inside the runtime's own
   payload budget as the Operator's pre-flight read.
8. **Capacity was an economic question carried as a legal footnote.**

**The plan's header now carries `confidence: LOW` until one measured overnight has run, and §21 counts the
rows whose text changes after it.** That count is this document's real verdict on itself. If a third of them
move, the whole pre-build design was noise and the next round should have been a build.

---

## 3 · The founder's decisions you may not re-litigate

Five overrules, in their own words, each against the recommendation of one or more expert lanes. They are
recorded in `DECISIONS.md` §24 and §28 with the reasoning that lost.

| Decision | The founder's words | What it killed |
|---|---|---|
| No box | *"dont need for now. use this mac and when cant use cloude"* | The always-on box all three lanes wanted; §J 73, 76 |
| No keys | *"no keys, codex and gemini cli use."* | The checker-family API key; §J 74. §I row 17 CLOSED |
| First contact widens | *"Yes, after N recall-free sends per venture"* | The ladder stopping below first contact; §J 84 |
| No vanilla week | *"No, compare Keel's modes only"* | The null hypothesis against a plain session; §J 75 |
| Row 16 stays open | *"Skip it, accept row 16 open"* | The thirty-minute sitting that would test the anchor assumption |

The last one deserves a sentence, because a future reader will find it and think it an oversight. **It is
not.** Every review said the plan's central assumption is untested and that testing it on the founder's own
past work costs nothing. The founder read that and chose to leave it open. The consequence is stated in the
plan and stands: the architecture is untested against non-software work until the first venture supplies its
own thirty done-tests.

---

## 4 · What is open, and whose it is

**The founder's, five rows in SPINE §I:**

| Row | The question | Waiting on |
|---|---|---|
| 1 | The terms — automated access on a subscription | A lane is fetching and quoting them; the founder decides after |
| 4 | `LICENSE-CONTENT` in the skills upstream | A lane is reading it raw |
| 5 | Install Codex and run the headless rehearsal | **Codex installed 2026-09-07, 0.153.4.** The rehearsal has not run |
| 15 | Which hosted lane may make when the Mac is off | The measurement is done; the decision is not |
| 16 | Whether a deterministic anchor exists for most company work | **Open by the founder's decision, not by oversight** |

**Research: 39 of 41 open when this session ended.** Three lanes were dispatched on the twenty-nine that can
close without building, and their returns may have landed after this was written — check
`scratchpad/returns/research-{W,M,C}.md` and `DECISIONS.md` for a §29. The triage, which holds regardless:

- **12 are documentary** — a vendor page, a licence, a changelog, a published measurement.
- **5 are measurements that spawn nothing.**
- **12 are measurements that spawn a `claude -p` child.** The founder authorised one temporary background
  agent for two of them, to be removed after and reported.
- **10 need the system running and cannot close in planning.** Do not guess at these. They are named.

---

## 5 · What to build, and why not more

The founder asked whether the system is ready to build. The answer recorded in `DECISIONS.md` §27 is: **the
kernel is, and the whole system is not.**

**Gate A — three things, and only the first is work.** Lift the no-building hold. Write the managed settings
file, which after the founder's auto-mode decision is two keys, not four. Authenticate Gemini, one login.

**Gate B — twelve things, the bounded day.** The data files and the constitution; `bin/log`; `bin/run` thin
over the vendor's own flags; `bin/reconcile` with its read-only instruments; the Sender staged behind a tap;
`bin/check-stores`; `bin/probe`, **authored by a different lane than the launcher**; the two charters
including the first stranger; page 4; the scoreboard.

**Gate C is not a to-do list, it is a research programme.** 117 absent mechanisms, 30 programs, 104 store
paths, 15 agent files, 39 open questions. Do not attempt it as one run. The plan is staged specifically so
you do not have to.

**The order matters and here is why.** The data files come first because nothing else can produce a builder
brief that fits in a context window. The log comes second because it is the sensor the whole controller
lacks. One real intent comes third because every number after it divides by a rate that does not exist yet.

**Four programs are a trusted base and are reviewed differently:** `bin/send`, `bin/inbound`, `bin/watch`,
`bin/run`. They touch the world, they carry a line budget, their only admission test is `keel/fixtures/`,
and the founder line-reviews them. The vendor's own flags are the floor beneath them, so a defect in the
launcher can narrow a grant but never widen one. **That is deliberate. Do not collapse it into one program.**

---

## 6 · How to work here — what this session learned the hard way

- **A message to a running lane is delivered only when the lane's return quotes it.** Two additions never
  drained and the decision log had to be corrected. Treat every addition as undelivered until the return
  names it; send it again as a numbered round rather than assuming.
- **Verify a lane's work on disk before committing it, with a grep per finding.** Every round of this
  session that skipped that step produced a correction in the next one.
- **A strikethrough looks like a live sentence to a grep.** Count `~~old~~ new` explicitly or you will
  report a fix that did not happen, and a fix that did happen as missing.
- **Escape pipes inside table cells.** Two spine rows broke because a re-derivation command contained one.
- **The late sections drift.** Three rounds running, the fix landed in §0–§12 and not in §15, §19, §20, §21.
  Review those first, not last.
- **A figure in prose rots; a command does not.** Six tree figures moved between the census reading and the
  fix round two hours later. The plan now writes the number *and* the command that reproduces it. Do this.
- **Ask the founder only what only they can answer** — their money, their machine, their hours, their
  business, their appetite for risk. Everything else you decide from rules already on the page and record,
  reopenable by name. This is the founder's own standing instruction, given 2026-09-07.

---

## 7 · The standing constraints, still in force

Nothing built, installed, authenticated, spent, published or pushed **without the founder saying so**. The
Codex install of 2026-09-07 was authorised for that one act and lifts nothing else. `round-6/` is not opened.
Never a bare `git stash` — the stack is shared with other worktrees and other sessions. Never commit to
`main`. Founder overrules are final and are not re-litigated, including in a later round by a different lane.

---

## 8 · The honest caveat, which belongs in every summary of this work

Every review of this plan was one model family reading prose. By the plan's own evidence ladder that ranks
and flags and certifies nothing. Eleven review files, three thinker lanes, three fixer lanes, two censuses
and four challenges do not add up to an independent panel; they add up to one family's reasoning applied
many times, which is a real but bounded thing. The `irreversible` tier's two-of-three multi-judge and the
two-model-family predicate are **unmet on every artifact here**, and that is an accepted risk with an exit
condition of 2026-11-17.

The only remaining test of this plan is running it.
