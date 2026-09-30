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

**Known limitation, declared in advance.** Codex does not report cost; for Codex only tokens are logged.
The Claude cost counts only the Claude side.
