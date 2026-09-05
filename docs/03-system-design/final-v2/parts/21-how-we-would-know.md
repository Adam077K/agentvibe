## 21 · How we would know it worked

*obeys: SPINE §B.2's anchor column; v6, v31 — the roster's own claim is falsifiable; §D, v14 · inherits: FINAL §20*

**(FINAL)** Not a dashboard. Six numbers on the briefing, one line each, tracked over weeks. **(NEW: and v14 changes
where they can be looked at, not what they are)** — the founder asked for a cost, tokens and efficiency page, it is
admitted, and every number on it taps to the thing that acts on it. A number that only informs is still refused; a
number that has a tap is not.

---

### 21.1 The six numbers

**(FINAL, unchanged)**

| Number | What it means | Direction |
|---|---|---|
| **Interventions per finished artifact** | how often the founder had to correct or redo | ↓ — the one that matters most; the only number that directly measures walking *for* versus being carried |
| **Rung-1 fraction** | of finished work, how much was checked by something deterministic | ↑ |
| **Acted-on rate of interruptions** | of the times it woke you, how often you did something | ↑, and above the threshold |
| **Cost per finished intent** | measured, per venture, per window | ↓ on repeated kinds of work |
| **Reserve hit rate** | how often the reserve was needed versus expired unused | neither extreme |
| **Time from spoken intent to first artifact** | the founder's actual experience of the thing | ↓ |

**(FINAL)** And five lines beside them: **books agree with the bank**, every night, incidents counted · **the week's
most expensive refusal**, never the same four weeks running · **the harness's share of every window**, under its
ceiling · **founder-originated work that shipped**, above a floor, which is the capture check, and if it falls it is
the first line of the briefing · **founder-minutes per finished intent**, falling.

**(NEW: v22 splits one of these in two, and it is not cosmetic)** *Cost per finished intent* and *reserve hit rate*
are now **per window and per week**, because there are two windows per seat, shared with Claude chat and Cowork. **A
weekly exhaustion is a different event from a five-hour one** — one is a stop, the other is a pause — and a single
reserve number would average them into something that describes neither.

---

### 21.2 The roster's own claims, and what would falsify each

**(NEW: v1 and v31 are the largest bet in the plan, so they are written as claims and not as a design)** The founder
chose fourteen agents plus the Operator, with the evidence in hand: **every shipped running roster measured is 5–6,
every roster of 150+ is a catalogue you pick from, and ten to fifteen sits in a band nobody publishes evidence for,
in either direction.** That is an unoccupied band, not a refuted one. Which means it is measurable here first.

| Claim | Falsified by | Where the record already exists |
|---|---|---|
| **v6 — one artifact, one agent, continuous context.** The roster names *who* does a kind of work; it never splits one build across two builders | a measured build of one artifact by two agents in parallel that beats one agent on the same done-test, at comparable cost. Anthropic's own post says coding is *"not a good fit for multi-agent systems today"*, and Cognition's failure is on one artifact — so a counter-measurement here would be news, not noise | `keel/logbook/runs/<id>/` and the done-test's exit code |
| **v6's other half — `scout` is the only agent that parallelises** | a `scout` fan-out whose subtasks turn out **not** to be independent, so two scouts return conflicting facts and the Operator cannot reconcile them without a third read | the citation check: two claims with the same subject and different quotes |
| **v31 — fourteen pays for itself** | the Operator's routing collapsing: if over a working month the routing counts show work reaching only five or six of the fourteen, the roster is a catalogue and the plan should say so. **Equally falsified in the other direction:** if any agent's work is routinely re-done by another agent, the cut between them is wrong | routing counts per agent per venture per month, from the logbook. **This is the number no source in the world publishes**, and it is cheap to keep |
| **v7 — the architect's output is an artifact with its own done-test, handed over whole** | builders filing objections against contracts at a rate that means the contract was never usable, or builders editing the architect's paths despite the grant excluding them | the objection count, and the probe: an edit outside `--add-dir` fails rather than logs |
| **v8 — the tester writes the anchor blind** | anchor tests that pass on a broken build, or that fail on a correct one, at a rate above the builder's own self-check. A test written by the author of the code grades its own homework; if the blind test is no better, the second agent is not paying | tests that fail before the change and pass after, per §B.2's tester anchor |
| **v30 — the challenger is an agent and not a step** | the challenger's findings being no better than a same-run self-critique pass on matched artifacts. The measured claim behind it is external: *"at times, their performance even degrades after self-correction"* (arXiv 2310.01798), and Reflexion's 91% is not a counterexample because its feedback is external | findings that name the mechanism that would have caught them; an opinion does not count |
| **v33 — the trifecta split holds** | any single agent found holding untrusted input, a private credential and an outward channel at once. **This one is not a trend to watch; it is a nightly assertion** | `keel/bin/probe`, which asserts what a run can actually touch |

---

### 21.3 Mission control's own claims

**(FOUNDER, v4)** The website is a control, so its tests are acts and not renders. Three, and each is falsifiable in
one attempt.

| Claim | The test | Failed when |
|---|---|---|
| **The board launched a session that finished a done-test** | drag one card into *working on it*; a team starts; the intent's done-test exits 0; the card carries the run id and the PR | the card moves and no session exists · the session exists and the card does not know its id · the done-test never runs. **This is the claim with no prior art anywhere** (v16): every board-to-session project found maps one task to one agent, so a card that launches a **team** is ours to prove |
| **The page popped the right terminal** | tap an agent on page 2; `tmux attach-session -t <name>` opens **that** agent's pane on the founder's Mac, with its live output | the wrong session attaches · nothing attaches · it opens in a terminal whose split panes are unsupported, which is VS Code's integrated terminal, Windows Terminal and Ghostty. **The page must say which terminal it opens into**, so an unstated terminal is itself a failure |
| **The cost page's number matched the runner's record** | one run's cost on page 3 equals the same run's row in `keel/logbook/ledger.jsonl`, joined by id, priced from `keel/shared/prices.yml` | the numbers differ · the join has no id · the model has no price row, which is **refused and not scored at zero**. Note what this does **not** prove: `--max-budget-usd` is computed locally at list price and *"the session cost figure isn't relevant for billing purposes"* for subscribers, so agreement with the runner is not agreement with a bill |

**(NEW: one page-level rule is testable across all seven)** Every element is a fact or a tap, and every number names
the tap that acts on it. **Falsified by one element on one page that is neither.** That is a check somebody can run
by looking, which is the cheapest anchor in the plan and the only one on this list that needs no instrument.

---

### 21.4 What *worked* and *did not work* look like

**(FINAL, and it stands unchanged)** *Worked* looks like: a venture reaches **rung 2** — a stranger did something —
on an intent that began as the founder's own sentence, with the reconciliation line green and the founder's mornings
ten minutes long. *Did not* looks like: month three with the harness's share above its ceiling, or interventions per
finished artifact rising while every other number improves, or one refusal topping the line a month running.

**(FINAL)** The first measurable thing, before any of the above: **the briefing opened unprompted twice in
forty-eight hours** — the looking test, whose base rate is unknown and is not zero.

**(FINAL)** The assumptions this rests on, each with what would prove it false: most valuable company work has a
deterministic anchor cheaper than the work (falsified if done-tests routinely reach only rung 4) · a done-test
constrains quality as well as a procedure would (falsified if the founder routinely rejects passed work on grounds
nobody could have written down) · the envelope can be written once and mostly stays true (falsified if `wake-me`
changes weekly) · idle capacity spent on knowing more compounds (falsified if six weeks of mining do not move
interventions per artifact) · two driven ventures is the right limit (falsified if cycle time does not improve when
the third is parked) · a different family is a good enough checker.

**(NEW: the last assumption is the one v2 cannot yet test, and it is stated plainly)** A different family is
**unreachable from inside Claude Code today**. `codex` is not installed and `gemini` is unauthenticated, so every
review behind this plan is single-family, author-recorded against a deterministic floor. The `independent: true`
predicate in `.claude/review-lenses.yml` requires ≥2 distinct model families and is unmet; `.qa/verdicts/` holds 68
records on this branch (80 on `origin/main`), every one `verdict: PASS`, and **not one of them satisfies the `irreversible` tier's 2-of-3 multi-judge
requirement**. *The checks ran and are green* is not *the tier was satisfied*. Accepted risk, exit condition
**2026-11-17**.

**(NEW: the one number that would settle the biggest open question, and nothing else will)** FINAL §19.12's overnight
premise is still unmeasured — **one week overnight against one week bounded, on the same venture, judged by rung
movement per window spent and the reconciliation line.** Every other number on this page can improve while that one
stays unknown, and it is the number that decides whether this system runs at night at all.
