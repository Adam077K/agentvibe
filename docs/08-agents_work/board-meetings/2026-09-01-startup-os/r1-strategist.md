# Round 1 · Strategist — The Anti-Roadmap

**Board meeting `startup-os`, 2026-09-01. Persona: Strategist. Lens: what this system will never do.**

Every position below carries evidence pointing at a real file and section, or is labelled `INVENTED`.
Every proposed rule names the thing that enforces it, or is labelled `WISH`. Measurements taken in this
worktree on 2026-09-02 are marked `[M]` and show the command.

---

## 0 · Thesis

The problem here has never been a shortage of ambition. It has been that **ambition was spent on the
machine instead of through it.**

```
[M] ls docs/08-agents_work/sessions | wc -l                          → 172
[M] grep -ril 'beeond' docs/08-agents_work/sessions | wc -l          →   1
[M] git rev-list --count HEAD                                        → 858
[M] find docs -name '*.md' -exec cat {} + | wc -l                    → 45,430
[M] find scripts -name '*.test.mjs' | xargs cat | wc -l              → 30,446
[M] find scripts -name '*.mjs' ! -name '*.test.mjs' | xargs cat|wc -l→ 16,839
```

One hundred and seventy-two session files. One of them touches a venture. Forty-five thousand lines of
documentation and forty-seven thousand lines of script, of which the verification code outweighs the
producing code **1.8 to 1**. `STARTUP-OS.md` §8b says it in the repo's own words: *"nine phases and one
venture task to show for it."*

So the anti-roadmap's job is not to be cautious. It is to make the system's growth **conditional on
external output**, and to notice that a large fraction of the ~420-item catalogue this board has been
handed does not need to be refused on judgement — it needs to be refused because **the smallest honest
version of this company does not have the problem those items solve.**

**The smallest thing that still deserves the name "company"** holds one mission across sessions, dispatches
one move at a time with fresh context, produces an artifact with real hands, stops itself on budget or
stall, records every row against a task id, has a done-test resolved by something that is not the
producer, and asks the world whether it worked — reporting `unresolved` when it cannot check. That is
**six mechanisms out of roughly four hundred and twenty**. Everything else is year two, or never.

And "think big" is not thereby refused. It is **relocated**: to the depth of the goal tree, to how far one
move travels without a human, and to the ~15 hands that are already bought and currently broken. Those are
unbounded and they all show up outside this repo. The mechanism list is the one thing that gets a ceiling.

---

## 1 · The finding that should govern this meeting

**Four of the twelve never-named gaps dissolve under refusals rather than being built, three are already
half-built, and five are real work — of which two are deferrable. That leaves three.** They are the same
three `STARTUP-OS.md` §8 already named: goals, the loop, and hands.

| # | Gap (`00-TERRITORY.md`) | Disposition | Why |
|---|---|---|---|
| 1 | Hands bought, 2 of 18 agents reach any | **BUILD** | The forced work. Also the cheapest breadth available. |
| 2 | Nothing reads the 2,936 transcripts | **DISSOLVES** | `concepts.md` §15 A4 — as *memory* it resurrects superseded beliefs. Refuse retrieval; mining is year two instrumentation. |
| 3 | Nothing decides what to do next | **DISSOLVES** | A WIP limit of one mission (`concepts.md` §2 P5) removes the decision. You cannot mis-prioritise a set of size one. |
| 4 | Cannot steer something running | **BUILD, cheap** | A steer file polled at loop boundaries (`concepts.md` §3 S2) plus a kill-switch file (§14 RT3). Two files. |
| 5 | No verdict from the world | **BUILD** | `concepts.md` §4 W1. Nothing downstream works without an outcome signal. |
| 6 | Blocked and stalled look identical | **HALF-BUILT** | `budget-guard.js`'s stall ceiling already computes the computed half (`concepts.md` §5 B1). |
| 7 | Nothing records what failed | **DEFER** | Negative knowledge pays at volume. At one mission there is almost nothing to forget. |
| 8 | Worldly risk has no tier | **BUILD, scoped** | Only for the hands actually granted. Scales with position P11, not ahead of it. |
| 9 | Voice is undesigned | **DEFER** | Position P10. |
| 10 | Every worker trusted equally forever | **DISSOLVES** | Fresh context per move plus a pack that is a grant means there is no persistent worker to trust (`concepts.md` §9 T6). |
| 11 | Nothing ever retires | **CHEAP NOW** | Set `retire_on` at creation (`concepts.md` §10 X3). Nothing comes due in year one; the field costs an hour and cannot be retrofitted honestly. |
| 12 | It cannot explain itself | **DISSOLVES** | `concepts.md` §11 E1 — explanation is a *replay of the log*, not a generation. With a task id on every row (which is forced anyway), the replay is nearly free. |

That an anti-roadmap written from the refusal side lands on the same three items the spec reached from the
build side is the strongest available evidence that neither list is arbitrary. **The rebuild is small. The
danger is that the catalogue makes it large again**, and this document exists to stop that.

---

## 2 · Where the ambition actually goes

The framing asks it directly, so answer it directly. "Think big" has three legitimate destinations here and
one illegitimate one.

**Legitimate — the goal tree's ceiling.** A mission may say *"one hundred paying customers for a real
product."* It is free to declare and it is resolvable at rung 4 of the evidence ladder
(`concepts.md` §4 W2 — *someone paid*). Nothing about a big goal costs anything until a move is dispatched
against it. This is where the founder's "no limits" belongs, and it is the only place it is free.

**Legitimate — distance travelled per human touch.** `concepts.md` §14 SI4 proposes one company metric:
**founder interventions per shipped artifact.** Driving that number down is unbounded work, it is
adversarially honest (it cannot be gamed by shipping nothing, because the denominator is shipped
artifacts), and every improvement shows up in the world rather than in the repo. *Mechanism: derivable once
every row carries a task id (`concepts.md` §14 CT2); until then, `WISH`.*

**Legitimate — reach, using hands already bought.** `hands.md` §8 is the most under-weighted page in the
entire catalogue: *"The hands are not merely unused — several are broken, and nothing looks."* Three
connected servers need re-auth, two fail outright, both second-family model pins are retired
(`hands.md` §0.3), and `claude mcp list` — the only capability oracle that exists — is run by nothing
(`hands.md` §0.1). This is breadth in exactly the dimensions the founder asked for: video, image,
publishing, design. It is measured in minutes, not phases.

**Illegitimate — the mechanism list.** This is where nine phases went. The catalogue offers ~420 further
opportunities to spend ambition there. **The mechanism list is the one thing in this system that gets a
declared ceiling** (position P2), and raising it is an act someone performs rather than a drift nobody
notices.

**The test to apply to every proposal in this meeting:** *does this change what the machine can produce for
someone outside this repo, this month?* If no, it is year two. Not wrong — later.

---

## 3 · The smallest company · P1

Three properties, from the framing: it runs unattended, it produces something, it knows whether it worked.

### What it is

| Property | The whole implementation |
|---|---|
| **Runs unattended** | The loop, plus `budget-guard.js` registered — the rope (a fraction of the rolling 5-hour window, Decision 8) and the stall ceiling (output tokens since the last *durable artifact on disk*, never the agent's own claim to be done). Plus a kill-switch file checked at every dispatch. |
| **Produces something** | One pack: `tools:` grant + `done:` + `stop_after:`. Fresh context per move. Real hands, from the ~15 already connected. |
| **Knows whether it worked** | A done-test whose resolver is **never the producer**, at a declared rung; and `verified_by: world` on the ledger, fail-closed per Rule 10. |

**Five files carry the state.** `MISSIONS.yml` (one `state: in_flight`, ever) · `BOARD.md` (the baton,
capped) · `packs/*.yml` · `.out-of-scope/` (the refusals, with dates) · the event log, where **every row
carries a task id from the first row**. Plus `DECISIONS.md` and the whole of L1, unchanged.

**Six mechanisms.** Registered budget guard · the loop · the non-producer done-test · the task id · the
`world` verifier · `.out-of-scope/` with expiry. Against a catalogue of roughly 420, that is **1.4%**.

### What it deliberately cannot do

This list is the load-bearing half. Each line is a capability the system will not have, and each is a
problem it therefore does not need to solve.

- **It cannot run two missions**, and therefore never has to choose between them. Gap #3 closes by refusal.
- **It cannot judge quality.** Taste enters once, at the top, as references and no-gos (`STARTUP-OS.md` §7).
  No downstream judge recovers taste that was not set, and one that pretends to is worse than none —
  a design PASS/BLOCK judge measured **0.543 against a panel only 0.741 self-consistent**
  (`STARTUP-OS.md` §4).
- **It cannot learn from its own transcripts.** By refusal, not by omission (P8).
- **It has no worker that persists**, so no worker earns trust and none retires (P9).
- **It does not speak** (P10).
- **It cannot spend money** — no ads, no GPU rental, no postage — until a rate limit exists that is not a
  wish (P11).
- **It cannot reach a stranger** without a human clearing a gate that is `blocking-human` by type and
  therefore structurally not auto-approvable, however autonomous the run
  (`STARTUP-OS.md` §8b, steal list #2).

### The first mission, and the one constraint on it

Decision 7 is settled: a synthetic landing page for a fake company, as an end-to-end acceptance test. The
constraint the anti-roadmap adds is not about *what* — it is about the exit:

**The first mission's done-test may not contain a quality judgement.** Rung 0 (*it renders*) and rung 1
(*a stranger understands it in five seconds*) only, per the evidence ladder (`concepts.md` §4 W2). A
landing page spans web/feature, design/brand and content — three of the four families Decision 6 names —
and only one of those three has a resolver today that is not the producing model. If the acceptance test of
the whole system carries a quality gate, the acceptance test is unresolvable, and an unresolvable
acceptance test is how a machine passes itself.

This is a consequence, not a preference. It follows from `concepts.md` §15 A3 and the 0.543 measurement,
and it respects Decision 6 rather than re-opening it: all four families exist; they simply do not all get a
*resolvable exit* on day one, so they do not all get dispatched on day one.

---

## 4 · Permanent refusals — things this system never does

A refusal is load-bearing when removing it would break something specific. Each of these names what it
protects. Six of the eight already have a mechanism in this repo or a mechanism of a shape this repo has
already built once.

| # | Never | Protects | Mechanism |
|---|---|---|---|
| N1 | **Sum or average judge outputs into a score.** | The one creativity mechanism the repo has. `design.js` today sums four 0-10 axes into a `total` and sorts — the exact selector `STARTUP-OS.md` §7 forbids and the repo's own 0.543 measurement discredits. | `schema-lint.js` refuses a numeric aggregation field in a judge output — the same shape as its existing refusal of `steps:` in a playbook stage. **Smallest diff in this document, largest correction.** |
| N2 | **Let a producer resolve its own done-test.** | Every exit condition in the system. A loop that walks relentlessly toward a self-scored goal is a token furnace with a completion certificate. | The dispatch refuses a move whose goal's `done:` names the producing model as resolver. Schema refusal. |
| N3 | **Weight the voices on a panel.** | The council's honesty. Weights require a trust model for opinions that cannot be validated at this volume; Auto-Co's Munger veto is the cautionary instance — prose in `CLAUDE.md`, all 14 personas at `model: inherit`, nothing checking disagreement occurred (`STARTUP-OS.md` §8b). | Findings-only return shape, validated. Union, never average. |
| N4 | **Write a second implementation of risk classification.** | The gate. It has already happened here once: `qa-lead-pass.yml` computed a stricter second answer than the classifier. | Extend `scripts/lib/classifier.js`; never parallel it. `concepts.md` §15 A5. |
| N5 | **Dispatch a persona to produce.** | The org chart staying dead. This is the wall (`STARTUP-OS.md` §7). | A persona holds no producing tools. The `tools:` grant is the enforcement. |
| N6 | **Retrieve over transcripts as memory.** | The supersession discipline. Transcripts are full of confidently-stated superseded beliefs and retrieval cannot tell a corrected belief from a current one (`concepts.md` §15 A4). | A structural rule that no agent or pack references a transcript path — same shape as `PS-WORKFLOW-CONTAINMENT`, which already enforces a reachability property by grep. |
| N7 | **Pass what it could not check.** | Everything. Rule 10. Ralph's shipped judge fails open twice — on error, and when the verdict tool was never called (`STARTUP-OS.md` §8b). The field ships the bug; we hold the rule. | `scripts/ledger.test.mjs` already pins `unresolved` as distinct from `pass` for every resolver. Running today. |
| N8 | **Auto-approve a `blocking-human` gate.** | The safety of running at 3am. Two-tier gates make 24/7 safe *by type* rather than by policy (`STARTUP-OS.md` §8b, steal #2). | `.claude/gates.yml` already distinguishes `kind: command` from `kind: human`, and `gates.test.mjs` blocks. A `human` gate has no `run:` and writing one is refused. |

---

## 5 · Year-one deferrals — with an exit condition each

A deferral without an exit condition is a permanent refusal wearing a polite face, and a permanent refusal
without a stated reason is how a good idea gets rediscovered from scratch in eight months. Every row names
the observation that reopens it.

| Deferred | Catalogue | Reopens when |
|---|---|---|
| **Template / fleet / multi-project** | Decision 4; `concepts.md` §14 CY1–CY4 | A second project exists *and* the first has shipped an artifact that survived a world verdict. A template of a system that has never run is a template of nothing. |
| **Worker trust, apprenticeship, retirement** | `concepts.md` §9 T1–T5 | A pack has ≥50 recorded dispatches with outcomes. `open-source.md` §16.1: *"This is a genuine build, not a buy"* — the most expensive item in the catalogue, with the least precedent, and meaningless below a volume year one will not reach. |
| **Voice and phone surfaces** | `concepts.md` §8 V1–V5 | The terminal balcony has changed a running mission *N* times. Today: 7 views, 1 acts, and the escalation Inbox has been empty on every project ever (`00-TERRITORY.md`). Adding a third surface to a surface nobody uses is the endemic defect in its purest form. |
| **Evolutionary search** — quality-diversity archive, island model, novelty search, bandits | `concepts.md` §1 C2, C3, C4, C34; `open-source.md` §1.3 | ≥100 artifacts exist in one project's archive. This is the most intellectually attractive block in the catalogue and it needs a corpus this system will not produce in year one. Diversity machinery over an archive of nine is theatre. |
| **Negative knowledge as a store** | `concepts.md` §6 N1–N5; `open-source.md` §1.5 | A failure taxonomy shows the same failure class ≥3 times. Until then the anti-circling job is done by the stall ceiling, which already exists. |
| **Transcript mining** | `concepts.md` §12 M1–M4 | Free to reopen; it is instrumentation, not memory, and the regex correction classifier is ~50 lines. But it is a *report a human reads*, never a context injection — see N6. |
| **Money-spending hands** | `hands.md` §6.11–13 | A rate limit exists that something enforces. See P11. |
| **A second human** | `concepts.md` §14 CY3 | There is a second human. |

---

## 6 · Positions

### P2 · The mechanism list gets a ceiling; the goal tree does not

**Claim.** Declare a ceiling on the count of governed artifacts — packs, personas, workflows, commands,
skills, check-suite steps — in a config file. Above it, adding one requires retiring one.

**Reasoning.** Rosters grow monotonically and this one has the scar: 26 agents → 7 engines in a single
correction, where the correction was right and the growth that forced it was never resisted at the margin
(`concepts.md` §10 X4). The check suite went 29 → 30 → 46 → 48 steps inside three days
(`CLAUDE.md` §Project State) while venture output stayed at one. A ceiling does not stop growth; it makes
raising the ceiling **an act someone performs** rather than a drift nobody notices.

**Mechanism.** A count check in `scripts/lib/check-suite.js`'s own suite against a declared ceiling — the
same shape as the byte-budget ratchet that already governs `DECISIONS.md`. `test:check-suite` already fails
when `package.json` drifts from the STEPS list, so the list is governed today; this adds a bound to it.

**Confidence:** high. **Territories:** 02, 04, 12, 14.

---

### P3 · The demand trigger — nothing new merges without a mission blocked on its absence

**Claim.** Extend the birth certificate (`concepts.md` §10 X1). A new pack, skill, workflow, persona,
command or check may not merge unless the same diff contains a caller **and** the caller resolves to a
mission in `MISSIONS.yml` with `state: in_flight` that carries a `blocked` row naming the missing
capability, authored before the diff.

**Reasoning.** X1 as written prevents built-and-never-wired. It does not prevent
built-and-wired-to-nothing-anyone-needed, which is the failure mode of nine phases. Six of ten things the
founder asked for already existed and were connected to nothing (`STARTUP-OS.md` §1b) — the wire is
necessary and not sufficient. The trigger converts "think big" from a plan into a queue: the catalogue does
not shrink, it waits.

**Mechanism.** A CI check on the diff, the same class as `check-registration.mjs`'s dead-path check. Git
timestamp ordering makes "authored before the diff" checkable.

**The honest weakness, stated rather than discovered.** This is the most gameable proposal in this
document — anyone with repo-write can author a mission and a block. It is the same bounded guarantee
`qa-lead-pass.yml` already documents about itself: a verdict record is hash-bound, not signed. It stops
drift, not a determined author. Say so; do not oversell it.

**The bootstrap exemption, and it must be a claim.** The forced five (§7) predate any mission, so the
trigger cannot govern them. Grant one exemption window, expressed as a ledger claim with a `valid_until`,
so it **expires rather than drifts**. A lapsed waiver failing harder than none is already the ledger's
behaviour.

**Confidence:** med. **Territories:** 12, 01, 02, 04.

---

### P4 · Refusals must be data with an expiry, or this document is a wish

**Claim.** Create `.out-of-scope/` — one file per refusal, carrying the reasoning, the evidence, and a
`retire_on` date. Nothing merges whose category is listed there without the refusal being explicitly
retired first.

**Reasoning.** Every rule names its mechanism or it is a wish, and that applies to an anti-roadmap more
than to anything else, because a refusal decays silently: nobody notices the absence of a decision not to
build something. `CLAUDE.md`'s Rules table carried eight unenforced rules and the cure was labelling them
honestly, not deleting them (`concepts.md` §15 A6). `.out-of-scope/` is GSD's practice, already at #9 on
the consolidated steal list (`STARTUP-OS.md` §8b) — and it is **absent from disk**
(`[M] ls -d .out-of-scope → absent`).

**Mechanism.** Existence and category check in CI (`check-registration.mjs` shape) plus expiry via
`claim-freshness`'s exact behaviour: fails once the date passes, refuses a waiver with no `until`, and a
lapsed waiver fails harder than none. A refusal that comes due forces exactly one disposition — renew,
retire, or waive with a new date.

**Confidence:** high. **Territories:** 12, 09, 14.

---

### P5 · Refuse to grow L1

**Claim.** No new step enters the 48-step check suite unless it fails on a defect found in work that is not
about the harness.

**Reasoning.** L1 is the best thing in this repo and `STARTUP-OS.md` Decision 1 keeps it. It is also where
**30,446 of 47,285 script lines** live `[M]`, and it verifies a machine whose external output is one
venture task. The suite is the single largest consumer of the founder's build attention. This refusal does
not shrink it — nothing here proposes deleting a check — it stops it consuming the attention that the
mission needs.

**Mechanism.** The same demand trigger as P3, applied to the STEPS list, which `test:check-suite` already
governs.

**Where this is wrong, if it is wrong:** a check that would have caught a real defect but has not yet,
because the defect has not yet shipped. The counter-argument is that this is exactly the reasoning that
produced 48 steps and one venture, and that the eight exit-code-guard bypasses were found by an
independent review rather than by a pre-emptive check.

**Confidence:** med. **Territories:** 08, 12, 13.

---

### P6 · Take the five headline projects as ideas; refuse all five as dependencies in year one

**Claim.** `gastownhall/beads`, `temporalio/temporal`, `icaros-usc/pyribs` + `SakanaAI/ShinkaEvolve`,
`UKGovernmentBEIS/inspect_ai`, `riponcm/projectmem` (`open-source.md` §1) — steal the design, adopt none.

**Reasoning.** Each is genuinely better in isolation than what we would write, and each introduces a
**second source of truth** for something this system will already compute: beads for what-to-do-next
(duplicates `MISSIONS.yml`), Temporal for durable state (duplicates the loop's own record), projectmem for
negative knowledge (duplicates the ledger's shape), inspect_ai for grading (duplicates the panel),
pyribs/ShinkaEvolve for search over an archive that does not yet exist. `concepts.md` §15 A5 names the
failure precisely — *"two implementations will disagree, and you find out during the incident"* — and this
repo has already lived it once.

**The sharper reason, which is about psychology rather than architecture:** **an unwired dependency is
worse than an unimplemented idea, because it looks done.** Built-and-never-wired is present in four of four
studied systems (`STARTUP-OS.md` §8b) and adding dependencies is the cheapest way to manufacture more of
it. A `package.json` entry produces the feeling of capability at zero capability.

**Mechanism.** An `.out-of-scope/` entry per project, each naming the thing in this repo that computes the
same concept, and each carrying a reopen condition.

**Confidence:** high. **Territories:** 01, 05, 08, 12.

---

### P7 · Refuse a fifth memory store

**Claim.** `STARTUP-OS.md` §6 declares four stores with one rule each. That is the whole memory system for
year one. No vector store, no `mem0`, no episodic index, no transcript retrieval.

**Reasoning.** Memory is where unwired code accumulates fastest, because **nothing fails when memory is not
read.** The proof is on this machine: 2,936 transcripts, nothing reads them, and no test has ever gone red
over it. A missing check fails loudly; a missing recall returns a plausible answer. The four stores each
have a scope and an expiry rule, and `FIELDS/` inherits the ledger's forced disposition — which is the
mechanism that makes memory *shrink* as well as grow, and no proposed fifth store has one.

**Mechanism.** Structural: a rule that no pack or agent references a store outside the declared four —
`PS-WORKFLOW-CONTAINMENT`'s shape. `mem0` stays in the MCP roster as an unauthenticated server, which is
where it already is (`hands.md` §0.1), and its being logged out is not a bug to fix this year.

**Confidence:** med-high. **Territories:** 05, 04, 12.

---

### P8 · Refuse worker trust, apprenticeship and retirement — the grant is the entire trust model

**Claim.** Adopt `concepts.md` §9 T6, the competing position: **no trust at all, only reach.** Build no
trust score, no apprenticeship, no promotion, no demotion.

**Reasoning.** Three converging reasons. First, `open-source.md` §16.1 records that nothing in the surveyed
world implements it — *"a genuine build, not a buy"* — making it the highest-cost, lowest-precedent item in
the catalogue. Second, trust is a statistical object and needs a volume of outcomes this system will not
produce in year one. Third and decisively, **the architecture removes the subject**: fresh context per unit
of work (`STARTUP-OS.md` §7) plus a pack that is a grant and a stop means there is no persistent worker for
trust to accrue to. What varies between two dispatches is the grant, and the grant is already the security
boundary — *"an agent cannot research its way into holding a tool it was not granted"* (`STARTUP-OS.md` §4).

**Mechanism.** None required to refuse; the `tools:` grant is the existing mechanism that makes the refusal
safe. That is what distinguishes this from prudence: gap #10 is not deferred, it is **answered**.

**Confidence:** high. **Territories:** 02, 09.

---

### P9 · Refuse new surfaces until the existing one has changed a running mission

**Claim.** No voice, no phone, no second web surface, until the terminal balcony has been used to approve,
redirect or retarget a mission *N* times, with *N* declared in advance.

**Reasoning.** Mission control has 7 views, 1 acts, and **the escalation Inbox has been empty on every
project ever** (`00-TERRITORY.md`). That is not a missing feature; it is a measurement, and what it
measures is that the surface has never been the bottleneck. Building a third surface over a surface with
zero recorded actions is the endemic defect performed deliberately. The founder does talk to this system by
voice, and that is a real observation — but it is an observation about *input convenience*, and a surface
nobody acts through does not become useful by being easier to reach.

**Mechanism.** `concepts.md` §10 X2, last-use telemetry: the balcony writes an event when the founder acts,
and the count is the gate. `scripts/lib/events.js` already writes typed events. The Inbox emptiness is
already the measurement — it simply was never treated as one.

**Confidence:** med. **Territories:** 10, 12.

---

### P10 · Refuse money-spending hands until a rate limit exists that something enforces

**Claim.** No tool grant that spends money outside model tokens — ad platforms, GPU rental, postage,
paid-per-call APIs — until an absolute rate limit exists and is enforced.

**Reasoning.** `hands.md` §8.3 states the gap exactly: *"Money is the missing axis. Every tier this repo
has is about reversibility or blast radius; ad spend, GPU-seconds and postage need a rate limit, and no
mechanism here can express one."* And §6.13 names Meta Ads MCP as *"the best possible forcing function for
the risk tier, and the worst possible thing to connect before that tier exists."* A 24/7 unattended loop
with a spend hand and no rate limit has unbounded downside against bounded upside — and unlike every other
risk in this system, `git revert` does not undo it.

**Mechanism.** The pack `tools:` grant is enforced and is what withholds the capability. `concepts.md` §7
R5 (absolute rate limits independent of reasoning) is currently a **`WISH`**, and this refusal stands
precisely until it is not.

**Note on what is already granted, because it inverts the usual worry.** `hands.md` §8.2: publishing to
TikTok, sending mail as the founder, remote code execution and an authenticated Chrome are **live right
now**; PostHog, Sentry and a read-only Stripe key are not connected. The riskiest hands are granted and the
cheapest safe ones are not. This refusal is therefore about *the next* grant, and the audit of the current
ones is separate and more urgent.

**Confidence:** high. **Territories:** 03, 09, 13.

---

### P11 · Refuse a global sandbox disable as the fix for the second model family

**Claim.** Both second-family runtimes are invisible to a sandboxed agent for two different reasons
(`hands.md` §0.3): `~/.gemini` is in `denyRead`, and `ollama` needs a loopback bind. The tempting fix is to
flip `sandbox.enabled`. Refuse it. Narrow, per-command exemptions only.

**Reasoning.** `CLAUDE.md` is explicit that the sandbox is *"a guardrail against accident, not containment
against the agent"* — and a 24/7 unattended loop **is the accident case**, at the exact hour when nobody is
watching. The whole point of running when the founder is asleep is that the founder is asleep. A blanket
disable trades the one control that is armed and tested for a convenience that two narrow exemptions
deliver anyway.

**Mechanism.** Already running: `npm run test:sandbox` fails if `enabled` or `failIfUnavailable` is
flipped, and CI runs it. This is a refusal whose enforcement predates the refusal.

**And note what is actually broken:** both pulled Ollama models are **retired on a version pin nobody
watched**, while the account authenticates fine (`hands.md` §0.3). That is not a sandbox problem at all. It
is `built-and-never-wired` in the capability layer, and one `ollama pull` plus one narrow exemption is the
whole distance to the multi-family panel that `CLAUDE.md` carries as accepted risk to 2026-11-17.

**Confidence:** high. **Territories:** 09, 11, 08.

---

### P12 · Refuse the council as a standing organ

**Claim.** The board convenes on `irreversible`-tier forks only, gated by the existing classifier. Never on
a routine move, never on a schedule.

**Reasoning.** Said from inside a board meeting, which is the only honest place to say it. This convening
exceeds its own spec's `$3` cap by founder instruction, and the spec's own limit of 8 per month exists
because deliberation is the most expensive thing this system can do per unit of decision. A council that
convenes routinely becomes the org chart returning through the side door — and the wall against that is
already written: *"a persona may never be dispatched to produce"* (`STARTUP-OS.md` §7). The complement is
that a persona may not be dispatched *cheaply*, either, or the wall gets worn down by traffic.

Metaswarm's convergence rule is the right internal discipline and should be taken as-is
(`STARTUP-OS.md` §8b): fresh instances every round with zero visibility into prior findings, named as
anchoring-bias avoidance, a **3-iteration cap**, then human escalation carrying an iteration-history table.

**Mechanism.** `scripts/lib/classifier.js` already computes tier for a path — one file, and never a second
(N4). Gate convening on it. The roster distinctness test the spec proposes (fail below 40% inter-persona
distinctness) stays.

**Confidence:** med. **Territories:** 08, 14, 13.

---

### P13 · Refuse phase numbers

**Claim.** No phase numbering in the rebuild. Continuous landings, each useful alone — which is already the
founder's decision on cadence, and this position is the argument for why it is load-bearing rather than
stylistic.

**Reasoning.** `STARTUP-OS.md` §8b records the observation and it is uncomfortable on purpose: Omnigent
shipped **fifteen releases in ten weeks, no vendor harness ever dropped, and the phrase "Phase N" appears
nowhere.** This repo organises around phases and rewrites and has nine phases and one venture task. A phase
number is a promise that a set of work ships together, which means the last item in a phase is hostage to
the first, and a phase that turns out to be wrong is expensive to abandon because abandoning it means
admitting the number was wrong. Continuous landings have no such hostage.

**Mechanism.** `WISH`. There is no check that catches a phase number in a plan document, and inventing a
lint for prose vocabulary would be theatre. What makes it real is P3's demand trigger — work that must
justify itself against a live mission cannot be batched into a phase, because missions do not arrive in
batches. **The mechanism for this rule is another rule's mechanism**, and that is worth saying plainly
rather than claiming an enforcement that does not exist.

**Confidence:** med. **Territories:** 14, 12.

---

### P14 · Refuse to build the loop before the exit rule binds

**Claim.** Forced ordering, not preference: the non-producer done-test resolver lands **before** the
unattended loop is armed.

**Reasoning.** The founder's phrase is *"walk relentlessly until they achieve the goal."* The relentlessness
is the easy half — Ralph proves it is four lines. **The done-test is what makes relentless walking
different from a token furnace**, and `STARTUP-OS.md` §4 already says why the resolver cannot be the
producer: 0.543 against a panel only 0.741 self-consistent. Arm the loop first and the first thing it does
at 3am is satisfy itself.

Note the second-order reason, which is about evidence rather than cost: a loop that self-certifies produces
a *record* of successes, and that record then becomes the input to every downstream mechanism — trust,
bandits, cost-per-surviving-artifact. Bad outcome data is worse than none, because it is actionable.

**Mechanism.** Schema refusal at dispatch — a move whose goal's `done:` resolver is the producing model is
rejected. Same shape as `schema-lint.js` refusing a playbook stage that carries `steps:`.

**Confidence:** high. **Territories:** 01, 08.

---

## 7 · The forced build order

Five items. Each is here because something breaks or becomes unrecoverable if it comes later — this is
forced ordering, not a preference ranking.

1. **Register `budget-guard.js`.** Decision 8, already built and verified by execution, registered nowhere
   (`[M] grep -c budget-guard .claude/settings.json → 0`, per `STARTUP-OS.md` §1b). Forced first because it
   is simultaneously the rope, the stall ceiling, and the field's only working anti-circling detector — and
   because arming a 24/7 loop without it is the single most expensive mistake available. It needs a founder
   permission; it is `irreversible` tier.
2. **A real task id on every row.** Forced second because **it cannot be retrofitted** — CAST proved it,
   and its cost figures now require a heuristic 60-second time-window join because there is no foreign key
   (`STARTUP-OS.md` §8b). Every mechanism downstream — cost per surviving artifact, the retirement queue,
   founder-interventions-per-artifact, replay-based explanation — reads this field.
3. **The non-producer done-test resolver.** Forced third, before the loop, per P14.
4. **The loop, minimal.** Ralph's shape, fenced by 1, recorded by 2, exited by 3.
5. **The `world` verifier, fail-closed.** Forced before a *second* mission, because without it nothing
   distinguishes a mission that worked from a mission that finished. Expect `unresolved` far more often
   than `pass` — `concepts.md` §4 W1 says so, and saying it in advance is what stops it reading as failure.

`.out-of-scope/` runs alongside item 1 because it costs an hour and everything after it depends on refusals
being durable.

**Everything else in the catalogue is demand-triggered.** Not rejected — queued behind a mission that is
blocked on its absence.

---

## 8 · Open questions

1. **Is the demand trigger's bootstrap exemption one window or a standing allowance?** One window with an
   expiry is my proposal. A standing allowance for "harness work" reproduces the last nine months exactly.
2. **What counts as a mission that is not about the system?** Without a definition the trigger is gameable
   by naming the harness a venture. Proposed: the mission's done-test must resolve against something
   outside this repository.
3. **Does the founder accept a deliberately mediocre year one on design, video and content?** The four pack
   families are decided; what is not decided is whether all four get *resolvable exits* before any of them
   gets dispatched unattended.
4. **What is *N* for P9 — how many balcony actions before a second surface is earned?** It must be declared
   before the balcony is built, or it will be set retroactively to whatever number was reached.
5. **Which currently-granted hands should be revoked rather than merely not extended?** `hands.md` §8.2
   says publish-to-TikTok, send-as-founder and remote code execution are live now. P10 governs the next
   grant; nothing in this document governs the existing ones, and something should.
6. **Does refusing the evolutionary-search family contradict the founder's central complaint** that the
   system loses creativity to playbooks? I argue no — the creativity fix is C1/C17, killing the score, which
   is a small diff and is in scope. But it is the closest call in this document.

---

## 9 · The strongest argument against this position

**Stated as fairly as I can put it, because it is a good argument.**

The founder's diagnosis is that *"almost everything built is a stopping mechanism rather than a producing
one"* (`00-TERRITORY.md`). This document is thirteen stopping mechanisms. A board persona whose entire
contribution is refusals has produced exactly the artifact the founder identified as the disease, and has
done so with more rigour than the disease usually manages.

The sharper form of the objection is structural. **A demand trigger can only fire for capabilities the
system already has enough of to notice missing.** A mission blocked on a hand that does not exist does not
generate a `blocked` row — it generates a worker that tries something else, fails quietly, and gets
abandoned. So the trigger risks running as a ratchet in the wrong direction, permanently freezing the
capability set at whatever it was on the day the rule landed. That is a real failure mode and it is not
hypothetical: it is how organisations stop being able to do new things.

My defence is partial and I will not overstate it. The trigger keys on *blocked*, which is **authored** by a
worker with a `clearable_by:` naming what would clear it (`concepts.md` §5 B1) — not on *failed*, which is
observed after the fact. A worker that cannot reach a capability is exactly the case B1 exists to make
declarable, and `clearable_by: <a capability that does not exist>` is a legitimate block. But that only
works if workers reliably author blocks instead of improvising around them, and nothing in this repo has
ever tested whether they do.

**The second objection, and it is the one I find harder.** `STARTUP-OS.md` §1b already concluded the
rebuild is small: six things exist unwired, three are genuinely absent, one works. If most of the remaining
work is *wiring*, then a refusal-heavy posture is fighting a war that was already won, and what the moment
needs is execution rather than another filter. The catalogue arrived after that census and is not evidence
against it.

My answer is that ~420 options is precisely the condition under which a settled small plan becomes a large
one again, and that the filtering conversation is where it happens. But that answer is an assertion about
this board's discipline, and I cannot mechanise it. It is the one place in this document where I am
proposing a governor on a machine whose complaint is that it already has too many governors, and I would
rather say so than have it found.

---

## 10 · One sentence I would not want lost

**Three of the twelve never-named gaps close by refusing to have the problem** — nothing decides what to do
next (one mission in flight), every worker is trusted forever (there is no persistent worker), and it
cannot explain itself (explanation is a replay of a log that has to exist anyway). **A refusal that removes
a problem is worth more than a mechanism that solves one**, because it never rots, never needs a caller,
and cannot become the next thing that was built and never wired.
