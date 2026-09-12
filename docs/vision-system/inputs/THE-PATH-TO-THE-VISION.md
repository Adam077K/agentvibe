# The path to the vision

*The route from 53 fields and 566 questions to one document that is the founder's. Written 2026-09-09.*

---

## What this is for

`THE-VISION-AND-THE-FIELDS.md` (EXISTS) asks 566 questions and answers none of them. That was
deliberate — a question phrased in the language of a design already chosen can only find the gaps
that design anticipated. But an unanswered question map is not a vision, and the gap between them is
where this document lives.

**The artifact this path produces:** `THE-VISION.md` — the founder's account of the company they
want, written so that someone who has never read the plan could build toward it and get something
recognisable.

**The test it has to pass, stated before the work rather than after:** hand `THE-VISION.md` to a
stranger with no access to `SPINE.md`, `FINAL-PLAN-v2.md`, or this repository. Ask them to describe
what the company does, who it serves, what it refuses, and how the owner spends their day. If their
description is one the founder recognises, the vision holds. If they describe the plan we already
have, the vision has collapsed back into the design — which is the failure mode the founder named
twice: *"the vision is not k or any added framework that you've already planned."*

---

## The problem the path has to solve first

566 questions is not a workload problem. It is an **attention** problem, and the founder has already
written the rule that governs it:

> *"Ask the founder only what only they can answer — their money, their machine, their hours, their
> business, their appetite for risk."*

Ask all 566 and the rule is broken 500-odd times. Ask none and the document is mine, not theirs —
which the founder has already rejected once. **So the first step is not answering. It is sorting.**

---

## Step 1 — Triage every question by who can answer it

**Input:** `THE-VISION-AND-THE-FIELDS.md`, Part two, fields 1–53.
**Mechanism:** `docs/03-system-design/final-v2/vision/TRIAGE.md` (ABSENT — this path creates it).

Every one of the 566 questions goes in exactly one of four buckets. The bucket is decided by *what
kind of thing would settle it*, never by how interesting it is.

| Bucket | The question turns on | Who answers | What happens if we guess |
|---|---|---|---|
| **F · Founder** | Their money, machine, hours, business, or appetite for risk | The founder, and only them | We build the wrong company and find out late |
| **D · Decidable** | A rule already on the page, or a defensible default | Me, recorded by name and reopenable | Nothing — a wrong default is cheap to reverse if it is named |
| **W · World** | A fact about how something actually behaves | Measurement or a source | We assert something false and it propagates |
| **L · Later** | Nothing until something else is settled | Nobody yet — it names its blocker | We answer in a vacuum and answer badly |

**Exit criterion:** every question carries a bucket, and the count in each is derived rather than
quoted — the triage file is a table, and a reader runs `grep -c` on it rather than trusting a number
in prose. **A question in D carries the answer and the name of the rule it came from, in the same
row.** A D-bucket question with no rule named is an F-bucket question wearing a disguise.

**The honest expectation:** F should be small. If F comes out over about forty, the triage is
lazy — it has pushed judgement onto the founder rather than doing it. That is a finding about the
triage, not about the founder.

---

## Step 2 — Answer D and W without touching the founder's time

**Input:** the D and W rows from Step 1.
**Mechanism:** D answers are written straight into the triage file with the rule named. W answers go
to lanes: `sourcer` for anything with a URL behind it, `builder` for anything that needs a shell to
measure. (`sourcer` has neither `Write` nor `Bash`; `reviewer` has `Bash` but no `Write`. When the
deliverable is a file and the work needs a shell, the engine is `builder`.)

**Exit criterion:** zero D rows and zero W rows without an answer or a named blocker. A W row whose
measurement failed records the failure — *unresolved* is a real answer and is not *pass*.

---

## Step 3 — Put the F questions to the founder, in rounds

**Input:** the F rows.
**Mechanism:** `AskUserQuestion`, four rows per round, multiple choice with an open field,
recommended option first.

This is the founder's established shape and it is not negotiable by me. Three things travel with it:

- **They pick against the recommendation often** — five of eight on one measured day. That is the
  system working, not a failure of the recommendation. State the cost once and build the chosen
  thing properly.
- **Free text in the open field is a new row, not a footnote.** Every requirement typed there gets
  its own line in the triage, or it is lost.
- **"idk" means decide.** Take the recommendation already given, say plainly that it is being taken,
  move on.

**Exit criterion:** every F row has an answer, a deliberate deferral with the reason, or a refusal.
*An honest "we refuse this, and here is why" is a complete answer. A silence is not.*

---

## Step 4 — Write the vision, from the answers, without the plan open

**Input:** the completed triage.
**Mechanism:** a sealed lane that has read the triage, `vision/A-ambition.md`, `vision/B-sceptic.md`,
`vision/C-consequences.md` (all EXIST) — **and has not read `SPINE.md` or `FINAL-PLAN-v2.md`.**

The sealing is the whole method. A writer with the plan open writes the plan back; three sealed lanes
already produced independent postures precisely because they could not see each other's work, and the
convergence between them was the signal. The same discipline applies here for the same reason.

**Exit criterion:** the draft contains no term that exists only inside this repository. Mechanised:
build a stop-list from the plan's own vocabulary and fail the draft if it uses one. A vision that
needs a glossary of ours to read is a design document with the word "vision" on it.

---

## Step 5 — Test the vision against the thing it is not

**Input:** the draft.
**Mechanism:** two reviewers, sealed from each other.

- **The stranger.** Given only the draft, describe the company. Compared against the founder's own
  words. This is the test declared at the top, run for real rather than asserted.
- **The sceptic.** Given the draft and the repository, name every sentence that is true of the plan
  we already have rather than of the company the founder wants. Every hit is a place the vision
  collapsed back into the design.

**Exit criterion:** the stranger's description is one the founder recognises, and the sceptic's hit
list is empty or each hit is answered in place.

---

## Step 6 — The founder signs, or does not

The vision is theirs. A vision the founder has not said "yes, that is it" to is a draft, whatever its
quality, and calling it finished would be the same error as reading a green check suite as a
satisfied requirement.

---

## What would make this path fail

**The failure that already happened once.** The first vision draft was rewritten four times because
it kept describing the system we had planned instead of the company the founder wants. The stop-list
in Step 4 and the sceptic in Step 5 exist because of that, and neither existed when it happened.

**The failure this path could still have.** Triage is where all the judgement is, and it is the step
with no independent check on it. A question mis-sorted from F into D is a decision quietly taken away
from the founder — and it would look exactly like efficiency. **The cheap guard: the founder reads
the F list itself before Step 3 runs, not just the questions in it.** Reading forty rows costs
minutes; discovering in Step 6 that a decision was taken for them costs the document.

**The failure nobody would notice.** 566 answered questions and a vision nobody can act from. Length
is not the deliverable — the stranger test is, and it is the only step here that can fail loudly.

---

## Provenance

Written after `THE-VISION-AND-THE-FIELDS.md` reached 53 fields and 566 questions with none answered.
The founder's direction that shaped it, in their words: *"its not a dictionary, its filds that in the
thinking prosses we need to think about"* · *"the vision is not k or any added framework that you've
already planned"* · *"I wanted to give me only the answers that only I can answer."*
