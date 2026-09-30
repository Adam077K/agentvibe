# SP1: a mission choosing its own next steps

## 1. Hypothesis and pre-registered criteria

This section was committed before any worker was launched.

**Hypothesis.** A mission engine with no playbook can take an open goal and run it by itself. It keeps an
uncertainty map ranked by value-of-information, an evidence log and a budget. On every iteration it picks
the next question, the action and the worker family, and has the other family referee the result. The
hypothesis holds only if the loop does four things: stays on intent, reduces a named uncertainty with each
step, catches claims its workers cannot support, and stops for a reason it states itself. It fails if the
loop drifts, churns, rubber-stamps or runs until the cap. It also fails if the loop is no better than one
long run by one model.

**Goal given:** "Find a real, underserved B2B niche where a one-person AI-run agency could sign its first
paying client within 30 days; produce the evidence and a first offer."

| # | Criterion | PASS | PARTIAL | FAIL |
|---|-----------|------|---------|------|
| C1 | **On intent.** Every step targets a question on the map, and that question bears on the intent. Checked mechanically (the question id exists) and by a manual audit of each step | ≥ 80% of steps on intent, 0 unknown question ids | 60–79% | < 60% |
| C2 | **Each step reduces a named uncertainty.** The targeted question's confidence changes, or its status changes (answered or dropped), and the change is backed by referee-*supported* evidence. A drop in confidence counts as a reduction | ≥ 75% of steps | 50–74% | < 50% |
| C3 | **The Referee catches an unsupported claim.** At least one claim is marked `unsupported`, and a manual spot check (opening the URL myself) confirms at least one of those flags is correct | ≥ 1 correct catch | flags exist but none confirmed | 0 flags, or every flag is wrong |
| C4 | **Stops for a stated reason.** The steward decides `stop_success`, `kill`, `pivot` then stop, or `stop_budget`, and gives a reason, before the hard cap does it | steward stop before iteration 12 | stopped by the hard cap, with the state coherent | crash or incoherent state |
| C5 | **Cost and wall-clock** of the loop | ≤ $15 reported Claude cost and ≤ 120 min | ≤ $25 and ≤ 180 min | above that |
| C6 | **Beats the control.** A blind Codex judge, which spot-checks citations, compares the loop's deliverable with one long Claude run | loop wins overall **and** on evidence_verifiability | tie, or wins on verifiability only | control wins on both |

**Overall verdict rule:** PASS needs C1–C4 and C6 at PASS. FAIL follows from any FAIL among C1–C4, or C6
at FAIL. Anything else is PARTIAL.

### 1b. Amendment, committed before any mission run: the environment forced a degraded variant

- **Codex could not run.** Its credentials are under `~/.codex`, which the Bash sandbox blocks from reading.
  The unsandboxed launch the common brief prescribes was **refused by the permission classifier**, and I did
  not route around that refusal. Every worker therefore runs **inside the sandbox**, with only
  `api.anthropic.com` allowed.
- **The "codex" family slot is played by Claude Opus 5.** The "claude" slot is Sonnet 5. So the Referee is
  a *different model*, **not a different family**. The cross-family property is **untested** by this spike.
- **Web access is WebSearch only.** WebSearch runs server-side and works. WebFetch runs client-side, and the
  sandbox cannot allow arbitrary hosts (the tool rejects TLD wildcards). Workers cite sources seen in search
  results. The Referee verifies by searching, not by opening pages.
- **Criteria adjusted, and not loosened.** C3's manual spot check is done by me with the same WebSearch.
  C6's judge is Opus 5 rather than Codex. It stays blind to which process produced which deliverable, but
  it shares a family with both.

**Known limitation, declared in advance.** Codex does not report cost; for Codex only tokens are logged.
The Claude cost counts only the Claude side.

## 2. Setup

- **Code** is in `spikes/sp1-mission-loop/`, about 250 lines of TypeScript on bun.
  - `workers.ts` launches every worker as a real headless CLI and logs each launch to `runs/launches.csv`.
  - `loop.ts` is the mission engine.
  - `control-and-judge.ts` runs the control and the judge.
  - `runs/` holds every prompt and output, `state.json` and `loop.log`.
- **Mission state:** intent, a success test and a kill test (written by the loop itself in iteration 0), an
  uncertainty map, an evidence log carrying a per-claim Referee verdict, artifacts, history, and a budget.
- **Each iteration makes three launches:**
  1. A worker researches the single question the Steward named.
  2. The other model refs every claim (`supported` / `unsupported` / `unverifiable`).
  3. The **Steward** re-ranks the map and picks the next question, action and worker, or decides to
     stop, pivot or kill. The Steward is Sonnet 5 with no tools. It may only raise confidence on
     `supported` evidence.

  The worker is chosen by the Steward, with no more than two picks in a row from one slot. The loop
  enforces the hard caps: 12 iterations, $20 of Claude cost, and 40 launches with 3 held in reserve.
- **Control:** one Sonnet 5 run with WebSearch on the same goal and the same output structure.
- **Judge:** Opus 5, blind, with A/B order randomised (the loop drew A). It spot-checks at least 3
  citations per document and scores five dimensions.

## 3. What happened

**Loop: 8 iterations, then stopped by the hard $20 cost cap. 26 launches, $20.88, 70.7 min.**
**Control: 1 launch, $0.89, 4.2 min.** Judge: $1.58. Spike total: 28 launches, **$23.36**.

| it | question (VoI) | worker → referee | conf. before → after | supported / unsupported / unverif. |
|---|---|---|---|---|
| 1 | q1 which niche has acute pain (10) | Sonnet → Opus | 0.05 → 0.30 | 10 / 2 / 0 |
| 2 | q2 reachable channel for 20+ prospects (9) | Opus → Sonnet | 0.05 → 0.65 | 7 / 3 / 0 |
| 3 | q3 price actually paid (9) | Sonnet → Opus | 0.05 → 0.30 | 4 / **5** / 0 |
| 4 | q3 again, narrowed to 2 niches, done-for-you prices | Opus → Sonnet | 0.30 → 0.60 | 9 / 2 / 0 |
| 5 | q8 ≥3 real PI firms confirming the pain (10) | Sonnet → Opus | 0.10 → 0.40 | 4 / 0 / 0 |
| 6 | q8 again | Opus → Sonnet | 0.40 → 0.45 | 6 / 2 / 0 |
| 7 | q8 again | Sonnet → Opus | 0.45 → 0.75 | 3 / 1 / 0 |
| 8 | q4 are incumbents already good enough? (8) | Sonnet → Opus | 0.35 → 0.50 | 4 / 2 / 1 |

- **Evidence:** 65 claims, of which 47 were supported and **17 unsupported**, plus 1 unverifiable.
- **Where it went:** it narrowed from 11 candidate niches to after-hours lead response for small
  personal-injury law firms. It drafted a "First-Call Guarantee" offer ($500 pilot, then $1,000/mo)
  in iteration 4.
- **The questions it added itself:** the Steward added **q8** (independent prospect confirmation) and
  **q9** ("has the offer been put in front of a real prospect?").
- **The self-correction:** after q8 resolved, the Steward noticed on its own that all three confirming
  prospects had *already* bought an incumbent vendor. That cut against the niche, so it raised q4
  (incumbent saturation) next. This is the behaviour the hypothesis wanted, and a fixed playbook would
  not have produced it.

**The Referee's catches are real.** Every unsupported flag came with a specific reason. Examples:

- the worker's source said TIA has "more than 1,700" members, not the 1,800 claimed (e14);
- a COI pricing ladder quoted verbatim but attributed to vertikalrms.com, when it is on coverwarden.com (e26);
- a "$8k + $3k/mo" legal-intake case study that the source says was a generic B2B lead-enrichment agency (e40);
- a job-posting quote that never appears on the cited careers page (e48).

I spot-checked **e14 and e26 myself with WebSearch; both flags are correct.** The dominant failure the
Referee caught was **misattribution**: a real quote pinned to the wrong URL. Invented facts were rare.

**Blind judge:**

| dimension | loop (A) | control (B) |
|---|---|---|
| evidence verifiability | **9** | 7 |
| niche specificity | 9 | 8 |
| offer actionability | 9 | 7 |
| honesty about uncertainty | 9 | 7 |
| overall decision usefulness | **8** | 7 |

- **Spot checks:** 6/6 for the loop and 7/9 for the control. The control's two failures include the
  source that its whole first-month targeting rests on.
- **Judge's reason:** *"A's honesty section audits its own evidence rather than just the business — it
  discloses an untested offer, a third source that failed verification and was therefore not counted…"*
- **Judge's criticism of the loop:** it ingested a self-contradictory price pair, and it **omitted
  state-bar/UPL and confidentiality risk**. That second point is q6 on its own map, where the Steward
  had ranked it at VoI 4 and never took it up.

## 4. Verdict: **PARTIAL**

| # | Result | |
|---|---|---|
| C1 on intent | **PASS** | 8/8 steps targeted a map question, and 0 question ids were unknown. My manual audit found no sideways step. Three consecutive q8 steps were persistence on the top-VoI blocker, not drift. |
| C2 names and reduces uncertainty | **PASS** | 8/8 steps moved the named question on supported evidence. Iteration 6 moved it only +0.05, which is the weakest step. |
| C3 Referee catches | **PASS** | 17 flags; 2 of 2 spot-checked flags were correct. |
| C4 stops for a stated reason | **PARTIAL** | Stopped by the hard cost cap, and the state was coherent. **The Steward would never have stopped on its own:** its success test requires the offer to reach a real prospect, and no worker can do that. |
| C5 cost / time | **PARTIAL** | $20.88 and 71 min, against PASS limits of ≤$15 and ≤120 min. |
| C6 beats control | **PASS\*** | Wins overall and on verifiability. \*Caveats: one sample, a same-family judge, and **23× the cost and 17× the wall-clock** of the control. |

The hypothesis holds for the **steering** half. With no playbook, the loop stayed on intent, attacked the
highest-VoI blocker, self-corrected, and produced a better-evidenced deliverable than one long run. It
fails the **stopping** half: it wrote a success test it had no capability to meet, and only the budget
ended it.

## 5. What this changes in the design

1. **Capability-checked success tests.** When the mission writes its success or kill test, each clause must
   map to an action some available worker or gate can perform. A clause such as "put the offer in front
   of a real prospect" must be routed to a **named human gate** (`outbound-approval`) as the next step,
   and the mission must stop with `awaiting_gate` rather than keep researching. Add `awaiting_gate` as a
   first-class stop state beside `stop_success`, `kill` and `stop_budget`.
2. **Diminishing-returns stop.** Add a mechanical rule: if the top-VoI question has moved by less than 0.1
   in two consecutive steps, force a decision (pivot, gate, or accept). This would have fired at iteration 6.
3. **Referee checks attribution by default.** Its main value was catching real quotes on the wrong URL,
   17 of 65 claims (26%). The Referee must be able to *fetch the page*, not just search. In v3 the Referee
   needs a fetch capability outside the worker's sandbox, and the ledger's `claim-source` resolver
   (fetch + quote match) is the cheap first pass before any model looks.
4. **Veto-class questions are exempt from VoI ranking.** Legal and regulatory questions (q6 here) are
   kill-risk, not information value, and VoI ranking starved one. Give the map a `veto` class that must
   be resolved before `stop_success`, whatever its rank.
5. **Budget the loop, and price the Referee.** 42% of the cost was refereeing ($8.72) and 11% was stewarding. The
   Steward can drop to Haiku or Sonnet with a compact state view; state growth is what drove the late
   steward calls (155s each). Start a mission-shaped loop only when the decision is worth 20–25× a
   single run. Otherwise a single run plus one Referee pass on its citations is the cheap default, and
   that variant should be tested next.
6. **The cross-family Referee is still unproven.** Measured here: a *different-model* referee is
   productive. Cross-*family* is not measured. Codex workers need an execution path that the sandbox and
   classifier accept, for example a pre-approved launcher, before v3 can depend on it.

## 6. What we still don't know

- Whether Codex as Referee catches a different or larger set of errors than Opus did. This is the
  cross-family claim, untested here because of the environment.
- How often the loop beats the control. This was n = 1, judged by one same-family judge. And would a
  control plus one Referee pass on its citations close most of the gap at about 2× cost instead of 23×?
- Whether the Steward, given rules 1 and 2 above, would stop on its own. The stop criterion is still
  unobserved.
- Whether the drafted offer is any good in the market. Nothing was sent; that is the human gate.
