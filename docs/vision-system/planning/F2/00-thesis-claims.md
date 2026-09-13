# Step 0, artifact 1 — the founder's thesis decomposed into testable claims

**Written:** 2026-09-13 · framer engine · round F2 (the agents / work layer rethink).
**Subject:** [`inputs/FOUNDER-THESIS-2026-09-13-agents.md`](../../inputs/FOUNDER-THESIS-2026-09-13-agents.md), read verbatim.
**Machine companion:** [`00-thesis-claims.json`](00-thesis-claims.json) — same claims, same ids, same fields.
**Status:** frozen input to Step 1. Nothing here is a result. No claim below is decided, and the ordering
carries no priority.

---

## How to read this

The founder wrote, in his own words, *"this is only a thesis … what I'm thinking is not, like, gold."* This
document takes him at that word. Every substantive assertion in his message is turned into a sentence that
could come back false, with the measurement that would decide it. That is the only way a research round can
report back something other than agreement.

**Labels.** The `kind` field uses six labels drawn from the [directive §6](../../inputs/DIRECTIVE.md) list of
fourteen statement kinds, mapped as follows.

| Label used here | Directive §6 kind it maps to | What it means in this document |
|---|---|---|
| **founder constraint** | Founder constraint | Directive §1 or another binding directive section fixes this independently of the thesis. Research may inform how it is met; it may not overturn it. |
| **already-evidenced** | Fact · Direct observation · Source claim | A dated citation already inside this package supports it. Support is never proof of magnitude. |
| **contested** | Disagreement | This package already holds evidence or argument on both sides, preserved rather than resolved. |
| **hypothesis** | Hypothesis | Plausible and testable; no evidence in this package either way. |
| **assumption** | Assumption | Currently relied on by the thesis or the package without evidence and without being queued for test. |
| **unknown** | Unknown · Deferred question | The thesis raises it and does not answer it, or it is not yet defined sharply enough to test. |

**The founder's thesis is not itself a constraint.** A claim is marked `founder constraint` only where the
directive fixes it, never because the thesis asserts it forcefully. Eight of the forty-two are constraints
and every one of them cites a directive section, not the thesis.

**Fixtures.** The discriminating fixture names the concrete scenario that separates a claim from its
negation. Six come from [the handoff](../HANDOFF-F2-agents-work-layer.md) §3 Step 3 and are referred to by
these short names; the rest are new and are described in full where they appear.

| Short name | Fixture |
|---|---|
| **F1 unknown job** | A kind of job nobody anticipated appears mid-build. |
| **F2 demand 4×** | Matched scope at 1×, 2× and 4× demand with offer and supplier changes. |
| **F3 three permissions** | One task needing three distinct tool permissions. |
| **F4 independent verification** | A verification the producer must not influence. |
| **F5 capacity reset** | A handoff across a capacity reset. |
| **F6 founder absent** | The founder absent for a week. |

**Counts.** 42 claims — 8 founder constraint · 3 already-evidenced · 7 contested · 9 hypothesis · 3
assumption · 12 unknown.

---

## Part A — the costs the thesis names

### TC-01 — a handoff is a place where a required fact can fail to arrive

**Statement.** Splitting one unit of work across N executors creates N−1 responsibility transfers, and a
material fraction of transfers lose at least one fact the receiver needed.
**Kind.** already-evidenced — for the existence of the loss, not for its rate.
**Measure.** Count of required facts lost per handoff, by a recall probe: seed each work order with a fixed
set of load-bearing facts (an exclusion, a deadline, a promised remedy, a rejected alternative, a unit), then
ask the receiving executor to restate each one before it acts. Report facts-lost-per-handoff against the
single-context baseline running the same fixture with no transfer at all.
**Existing evidence.** [`research/L04-engineering.md`](../../research/L04-engineering.md) — Anthropic's
November 2025 long-running-harness experiment found "premature completion, oversized implementation attempts,
and broken handovers despite compaction". [`research/L03-architectures.md`](../../research/L03-architectures.md)
— MAST reports 14 failure modes across 1,600+ annotated traces spanning system design, inter-agent
misalignment and verification. [`planning/specification/05-work-agents-skills.md`](../specification/05-work-agents-skills.md) §5
already requires that "each transformation records losses", which is the package conceding the mechanism
without measuring it.
**Depends on model generation.** yes — compaction and long-context handling are model-version properties, and
L04 records that one harness intervention became unnecessary when the model changed.
**Lane.** R2 (when an agent earns existence).
**Discriminating fixture.** F5 capacity reset — a handoff forced across a reset is the transfer most likely
to drop a fact, and it is one the system must survive regardless of the answer.

### TC-02 — a separate agent per small task costs more

**Statement.** Under the same fixture and the same accepted outcome, ephemeral-agent-per-task consumes more
scarce provider capacity than a single longer context.
**Kind.** contested.
**Measure.** Scarce capacity per **accepted** outcome — native job launches, provider quota buckets and
wall-clock occupancy, each counted separately per
[`07-integrations-capacity.md`](../specification/07-integrations-capacity.md) §6 — on one fixture set, with
rework, rejected attempts and abandoned outputs kept in the denominator per
[`05`](../specification/05-work-agents-skills.md) §6. Never dollars per token.
**Existing evidence.** [`research/L04-engineering.md`](../../research/L04-engineering.md) records a showcased
comparison at **$200 over six hours versus $9 over twenty minutes** for a planner/generator/evaluator
arrangement against a simpler one — and in the same paragraph states the competing interpretation, that some
of the difference came from extra computation and richer specifications rather than agent separation itself.
One uncontrolled case with its own refutation attached is exactly a contested claim.
**Depends on model generation.** yes — per-call capability determines how many calls an outcome needs, and
the scaffolding that justified the cost in one generation was ablated in the next.
**Lane.** R2, with the capacity accounting owned by R8 (contrarian / economics).
**Discriminating fixture.** F2 demand 4× — cost differences that vanish at 1× may dominate at 4×, and 4× is
where the subscription ceiling actually binds.

### TC-03 — a separate agent per small task is slower

**Statement.** Under the same fixture, ephemeral-agent-per-task has higher elapsed time to accepted outcome
than a single longer context, after accounting for whatever parallelism the split enables.
**Kind.** contested.
**Measure.** Elapsed wall-clock from admission to independent acceptance, median and p95, on the same fixture
set, reported beside the count of executors run concurrently. Latency claimed without the concurrency count
is uninterpretable.
**Existing evidence.** The same L04 case (six hours versus twenty minutes) with the same competing
interpretation. [`05`](../specification/05-work-agents-skills.md) §5 states the trade-off as design — splitting
is useful when it "can reduce elapsed time … more than it adds transfer, review and integration cost" — and
supplies no measurement of either side.
**Depends on model generation.** yes — faster models shrink the per-step cost that the split was buying back.
**Lane.** R2.
**Discriminating fixture.** F2 demand 4×.

### TC-04 — decomposition loses context

**Statement.** Facts available in a single context are lost when the same work is split, at a rate higher
than the rate at which the single context simply fails to use them.
**Kind.** already-evidenced — for the phenomenon; the comparison against single-context non-use is not
evidenced anywhere in this package.
**Measure.** Two rates on the same fixture: **facts absent** from the executor's context, and **facts present
and not used**. The second is the control, and it is what makes the first meaningful. A recall probe measures
absence; a decision probe — change one load-bearing fact and see whether the output changes — measures use.
**Existing evidence.** [`research/L05-memory.md`](../../research/L05-memory.md) — LongMemEval finds that
"retrieval success does not guarantee correct use of retrieved material", and that extracting isolated facts
"improved some aggregation tasks but harmed overall performance through information loss"; *Lost in the
Middle* finds position sensitivity within long contexts; Memora finds recurring invalid-memory reuse across
four models and six memory agents. [`research/L04-engineering.md`](../../research/L04-engineering.md) —
broken handovers despite compaction.
**Depends on model generation.** yes — every one of the cited results carries its own date and its lane's
warning that it does not establish present-model failure rates.
**Lane.** R1 (context engineering and shared state).
**Discriminating fixture.** F5 capacity reset — the reset forces the loss the probe is looking for, and the
single-context arm must survive the same reset, which is the comparison the thesis needs and nobody has run.

---

## Part B — the thesis's central diagnosis

### TC-05 — context and shared state dominate agent count

**Statement.** Holding context quality and shared state fixed, varying the number of agents changes accepted
outcomes less than holding agent count fixed and varying context quality.
**Kind.** hypothesis. This is the load-bearing sentence of the whole thesis and this package contains no
evidence for or against it.
**Measure.** A 2×2 on one fixture set: {few agents, many agents} × {strong shared state, weak shared state},
with accepted-outcome rate, capacity per accepted outcome and owner minutes reported separately. The claim
survives if the context main effect exceeds the agent-count main effect on accepted outcomes.
**Existing evidence.** none in package. [`research/cross-lane-comparison.json`](../../research/cross-lane-comparison.json)
X03 records the whole coordination question as "foundational alternatives retained", and
[`02-architecture-selection.md`](../02-architecture-selection.md) §1 says plainly that the evidence "does not
establish which candidate runs a business most effectively".
**Depends on model generation.** unknown — a model that uses long context reliably would weaken the
agent-count effect and strengthen the context effect, but nothing establishes the direction.
**Lane.** R1.
**Discriminating fixture.** F1 unknown job, run under both shared-state arms. An unfamiliar job is where weak
shared state hurts most, so it is where the two main effects separate.

### TC-06 — the five criteria are the complete gate

**Statement.** Parallel work, distinct tools or permissions, isolated context, specialized knowledge and
independent verification are jointly sufficient and individually necessary as reasons to create a separate
executor; no sixth reason is needed and no listed reason is redundant.
**Kind.** hypothesis.
**Measure.** Adversarial search for a counterexample in both directions: (a) a real work item that needs a
separate executor for a reason not on the list — candidates to try are jurisdictional separation, blast-radius
containment, provider or account separation, capacity reservation, and legal or professional standing; (b) a
listed reason that, when it is the *only* reason present, produces no measured benefit over one executor.
A single confirmed instance of either falsifies the claim as stated.
**Existing evidence.** none in package as a gate. The package's own gate is narrower and differently worded —
[`05`](../specification/05-work-agents-skills.md) §4: a specialist is selected only for "a demonstrated task
distinction, confidentiality boundary, real professional requirement or measured cost/quality benefit".
Reconciling those four with the founder's five is itself Step 1 work.
**Depends on model generation.** no — this is a claim about the structure of the list, not about how well a
model performs.
**Lane.** R2.
**Discriminating fixture.** F3 three permissions — the cleanest probe for reason (a), because it is a case
where the package's boundary (confidentiality) and the founder's (distinct permissions) may or may not be the
same boundary.

### TC-07 — parallel work earns a separate executor

**Statement.** Where two parts of one job are genuinely independent, running them as separate executors
delivers the accepted outcome sooner than running them in one context, by more than the integration cost.
**Kind.** contested.
**Measure.** Elapsed time to accepted **combined** outcome — not to each part — with integration and merge
work charged to the parallel arm, on a fixture with a known-independent split and a known-semantic-conflict
split. Report both splits; a parallel design that wins on the first and loses on the second has not won.
**Existing evidence.** [`research/L04-engineering.md`](../../research/L04-engineering.md) — METR's early-2025
randomized study found experienced maintainers took **19% longer** with AI tools on their own repositories,
and its 2026 update calls later estimates unreliable partly because concurrent-agent work is hard to measure.
[`research/L03-architectures.md`](../../research/L03-architectures.md) reads Google ADK as evidence that
"decomposition may reduce context pressure but introduce information-loss and coordination boundaries".
[`05`](../specification/05-work-agents-skills.md) §6 already warns that "a clean textual merge is not
behavioral compatibility".
**Depends on model generation.** yes — the serial arm's speed is a model property; the integration cost is
mostly not.
**Lane.** R2.
**Discriminating fixture.** New — **two branches, one product meaning**: two executors change onboarding and
pricing without touching the same file, and the combined journey promises something neither branch promised.
This is conformance case 2 in [`05`](../specification/05-work-agents-skills.md) §9 and it is the case a
parallel design must pay for.

### TC-08 — distinct tools or permissions earn a separate executor

**Statement.** Where two parts of one job require different permissions, giving them to one executor
increases realised blast radius relative to splitting them, even when the executor is instructed to use each
permission only for its own part.
**Kind.** hypothesis.
**Measure.** Under an injected prompt-injection or confused-deputy attack on a fixture requiring three
permissions, count operations released outside the part that needed them. Compare one executor holding the
union against three executors each holding one. Blast radius is counted in released operations, not in
attempted ones.
**Existing evidence.** The package decides the boundary without measuring it —
[`02-architecture-selection.md`](../02-architecture-selection.md) §4 gives C04 sole control of consequences and
requires attenuated authority for private decomposition;
[`05`](../specification/05-work-agents-skills.md) §1 states that no workflow, skill, model or worker acquires
authority "by containing instructions to do so".
[`research/L04-engineering.md`](../../research/L04-engineering.md) records that "sandbox enabled" cannot serve
as a system-wide safety verdict, which is the same lesson one layer down.
**Depends on model generation.** no — a permission boundary either holds or does not, independently of how
capable the thing inside it is.
**Lane.** R4 (authority as the boundary).
**Discriminating fixture.** F3 three permissions.

### TC-09 — isolated context earns a separate executor

**Statement.** Where one part of a job must not see material another part holds, isolation implemented as a
separate executor prevents disclosure that a filtered single context does not.
**Kind.** hypothesis. Note the alternative the claim must beat: a permission-filtered loader inside one
context, which is what the package already specifies.
**Measure.** Disclosure count on a seeded fixture: plant a marked private term reachable by part A, then
check whether it appears in part B's outputs, in an outward search query, in tool stdout, or in
provider-bound traffic. Compare a filtered single context against separated executors. Count every
disclosure destination — [`06`](../specification/06-knowledge-evidence-evaluation.md) §2 is explicit that
"model-provider traffic is itself disclosure, including tool stdout, error messages, fixtures and resumed
history".
**Existing evidence.** [`06`](../specification/06-knowledge-evidence-evaluation.md) §2 and §4 specify the
filtered-loader alternative in detail, including that "narrowing today's tools cannot remove yesterday's
data"; whether it matches executor separation is untested.
**Depends on model generation.** yes — a model that leaks less from held context narrows the gap, and
"hidden resumed context" is a named conformance case in [`06`](../specification/06-knowledge-evidence-evaluation.md) §9.
**Lane.** R1.
**Discriminating fixture.** New — **a private term in an outward query**: the exact adverse variation already
listed in [`06`](../specification/06-knowledge-evidence-evaluation.md) §9, run once with isolation by
executor and once with isolation by loader filter.

### TC-10 — specialized knowledge earns a separate executor

**Statement.** For work needing domain competence, a dedicated specialist executor produces better accepted
outcomes than a general executor loading a tested domain skill.
**Kind.** contested — and this is the one place where the founder's thesis and the package's current
specification point in opposite directions, which makes it a priority for Step 1.
**Measure.** Accepted-outcome rate and reviewer-found defect rate on matched domain fixtures, general+skill
versus specialist, with selection overhead charged to the general arm and maintenance cost charged to both.
[`06`](../specification/06-knowledge-evidence-evaluation.md) §6 already prescribes exactly this comparison for
skills: "compare a direct procedure with the same outcome criteria".
**Existing evidence.** Against the claim: [`05`](../specification/05-work-agents-skills.md) §4 — "A general
model can use a domain skill when the needed competence has passed relevant tests"; the repository's own
harness history in [`CLAUDE.md`](../../../../CLAUDE.md), quoted at
[handoff §2](../HANDOFF-F2-agents-work-layer.md), collapsed 21 named roles to seven generic engines on the
principle that "domain expertise is a lens, not an agent" — evidence about one harness, not a law. For the
claim: [`research/L03-architectures.md`](../../research/L03-architectures.md) records MetaGPT's reported gains
from encoded role SOPs while noting the assembly line assumes requirements can become a sequential process.
**Depends on model generation.** yes — the general arm's competence without the skill is the thing that
improves between generations, and the skill is what closes the remaining gap.
**Lane.** R6 (skills and knowledge).
**Discriminating fixture.** New — **the stale borrowed skill**: conformance case 6 in
[`05`](../specification/05-work-agents-skills.md) §9, where a skill passes shape checks but its example omits
a cancellation duty. A specialist that knows the duty and a general model that trusts the skill fail
differently, and that difference is the measurement.

### TC-11 — independent verification earns a separate executor

**Statement.** A verifier that is a separate executor detects defects a producer's own self-check misses, at
a rate high enough to justify the extra work.
**Kind.** contested. The package accepts the separation as a rule and denies that separation alone produces
independence.
**Measure.** Known-defect detection rate under planted defects — a fake citation, a skipped authorization, an
omitted failed attempt, a changed denominator, a dropped promise — plus the **joint false-acceptance rate**
across the producer/verifier pair on the same planted set, plus a clean-case control that an
indiscriminate rejecter would fail.
[`06`](../specification/06-knowledge-evidence-evaluation.md) §7 requires the joint measurement before panel
agreement counts as assurance; that requirement is what turns this from a slogan into a number.
**Existing evidence.** For the rule: [`06`](../specification/06-knowledge-evidence-evaluation.md) §6 — "the
producer may supply self-checks … but cannot become sole independent acceptor by changing role labels"; §6
also requires that "an always-pass reviewer must fail the known-defect control". Against inferring
independence from separation: [`research/L04-engineering.md`](../../research/L04-engineering.md) — the
documentation of a separate review path "does not demonstrate statistically independent errors between
producer and reviewer. A separate invocation alone cannot establish that independence."
[`02-architecture-selection.md`](../02-architecture-selection.md) §5 — "two models consuming the same bad
parser do not supply that independence."
**Depends on model generation.** yes — correlated error between producer and verifier is a property of the
shared model, and it is the quantity that decides whether the separation buys anything.
**Lane.** R7 (independent verification under one model family).
**Discriminating fixture.** F4 independent verification.

---

## Part C — what the thesis says we should build instead

### TC-12 — disconnected digital employees are the wrong shape

**Statement.** A set of persistent agents without shared state produces worse accepted outcomes, or more
owner labour, than the same capabilities coordinated around one shared source of truth.
**Kind.** hypothesis.
**Measure.** Matched fixtures under both arrangements with identical external obligations, information, total
resources and owner allowance — the comparison discipline already frozen as EAS-R1 in
[`02-architecture-selection.md`](../02-architecture-selection.md) §9. Report accepted outcomes, omitted
duties and founder translation minutes separately; no aggregate score.
**Existing evidence.** none in package as a comparison.
[`research/L03-architectures.md`](../../research/L03-architectures.md) declines to license the converse —
"the evidence does not justify these extrapolations: more agents necessarily improve outcomes … role titles
establish authority or evaluation independence".
**Depends on model generation.** no — this is about where state lives, which is an architecture property.
**Lane.** R8 (contrarian), which owns the steelman of chartered persistent agents.
**Discriminating fixture.** F6 founder absent — a week without the founder is when disconnection shows up as
stranded work rather than as a slower week.

### TC-13 — a shared source of truth improves outcomes

**Statement.** Executors reading one authoritative view of goals, current decisions, canonical files,
verified knowledge and next actions produce fewer contradictory or duplicated actions than executors
reading their own assembled context.
**Kind.** hypothesis.
**Measure.** Count of contradictory actions, duplicated external effects and actions taken against a
superseded decision, per fixture run, against a baseline where each executor assembles its own context from
the same underlying records.
**Existing evidence.** none in package as a measured comparison. The mechanisms exist in specification:
[`06`](../specification/06-knowledge-evidence-evaluation.md) §1 assigns six distinct memory jobs to distinct
representations; [`05`](../specification/05-work-agents-skills.md) §4 already limits sharing — "workers can
read authorized peers' work projections; they cannot see all company context merely to coordinate", which is
a deliberate *narrowing* of the thesis's "shared source of truth" and needs reconciling.
**Depends on model generation.** no.
**Lane.** R1.
**Discriminating fixture.** New — **two executors, one superseded decision**: the founder changes a decision
mid-run; measure how many actions are taken against the old one and how long the stale window lasts under
each arrangement.

### TC-14 — the five named constituents are enough

**Statement.** Goals, current decisions, canonical files, verified knowledge and an updated view of what
should happen next are together sufficient as the shared source of truth for whole-company work.
**Kind.** assumption.
**Measure.** Coverage test against the 46 capability requirements in
[`coverage/capability-requirements.json`](../../coverage/capability-requirements.json): for each, name the
constituent that carries what an executor must know to act. Anything that lands nowhere is a missing
constituent. Obvious candidates to test are surviving obligations, active restrictions and deletion scopes,
current grants, counterparty standing, and capacity state — none of which is a goal, a decision, a file, a
piece of knowledge or a next action.
**Existing evidence.** Against sufficiency, implicitly:
[`02-architecture-selection.md`](../02-architecture-selection.md) §3 treats surviving obligations as a
first-class thing that outlives the case carrying them, and §4 treats grants, holds and restriction epochs as
separately owned state.
**Depends on model generation.** no.
**Lane.** R1.
**Discriminating fixture.** New — **the closed case with a live duty**: close a case whose refund duty
survives it, then ask each constituent where that duty is now visible.

### TC-15 — many multi-agent systems are organized by human job titles

**Statement.** A substantial share of published multi-agent frameworks decompose work by human role name
rather than by tools, permissions, context or verification need.
**Kind.** already-evidenced — descriptively, for the systems this package inspected.
**Measure.** Descriptive; already satisfied for the inspected set. R3 should extend the census and record, for
each system, whether the role names carry any enforced difference in tools, permissions or context.
**Existing evidence.** [`research/L03-architectures.md`](../../research/L03-architectures.md) — MetaGPT
"encodes software-development SOPs using specialized roles" in a "product-manager/architect/engineer assembly
line"; CrewAI documents "role backstories or manager hierarchies"; CAMEL studies role-playing and reports
"role reversal, repeated instructions, promises without execution". [`CLAUDE.md`](../../../../CLAUDE.md) — this
repository's own harness began with 21 named roles of which ten had no agent file and eleven were routing
shims.
**Depends on model generation.** no.
**Lane.** R3 (frameworks and harnesses as evidence).
**Discriminating fixture.** Not applicable — descriptive claim, settled by census rather than by fixture.

### TC-16 — job-title decomposition underperforms capability decomposition

**Statement.** Decomposing by human job title produces worse accepted outcomes, or more coordination cost,
than decomposing by work, authority, tools, skills and context.
**Kind.** contested.
**Measure.** Same fixtures, two decompositions, matched executor count and matched total capacity. Report
accepted outcomes, handoff losses (TC-01's probe) and coordination minutes separately. Matching the executor
count is what stops this becoming a re-run of TC-20.
**Existing evidence.** For: [`CLAUDE.md`](../../../../CLAUDE.md) — the 21-role roster collapsed to seven
engines, with "zero resolved to a real engine directly", a single-harness observation the handoff explicitly
flags as "evidence about one harness, not a law". Against inferring more than that:
[`research/L03-architectures.md`](../../research/L03-architectures.md) preserves the competing organization
interpretation — "human roles package useful expertise … roles may carry irrelevant social structure" — and
declines to resolve it.
**Depends on model generation.** unknown — a stronger general model may make role scaffolding redundant, which
is L04's ablation lesson, but the coordination cost of titles is not obviously a model property.
**Lane.** R3.
**Discriminating fixture.** F1 unknown job — a job with no matching title is where a title-based
decomposition has to invent one or drop the work, and that is the observable difference.

### TC-17 — work, authority, tools, skills and context are the right five axes

**Statement.** Those five differentiators are separable — an executor can differ on one without differing on
the others — and together they cover every difference that matters.
**Kind.** assumption. The founder offers them as the alternative basis and nothing tests either half.
**Measure.** Two checks. **Separability:** construct one real work item differing on each axis alone; if any
axis cannot vary independently, the list is not five axes. **Coverage:** take the 46 capability requirements
and try to express each needed difference in the five; anything left over is a sixth axis. Consequence class
and counterparty standing are the two most likely leftovers.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §3 organizes by a
different cut — deterministic computation, durable procedure, bounded model work, capable people, qualified
professionals — which is a production-mode axis the founder's five do not contain.
**Depends on model generation.** no.
**Lane.** R2.
**Discriminating fixture.** New — **the same work at two consequence classes**: drafting an internal note and
drafting an outward customer promise are the same work, tools, skills and context, differing only in
consequence. If that difference must be represented, the five are not complete.

### TC-18 — unanticipated kinds of job appear mid-project at a material rate

**Statement.** During ordinary operation, kinds of work that no one specified in advance arrive often enough
that handling them is a primary design requirement, not an edge case.
**Kind.** hypothesis — the founder's own report is testimony about his experience, which is evidence about
him and not yet a measured rate.
**Measure.** Over a fixed operating window, count admitted work items whose kind matches no existing
capability contract, procedure or skill, as a fraction of all admitted items. Record how each was disposed:
absorbed, escalated, or dropped.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §8 retains adaptive
cases specifically for "unfamiliar work", citing L13's CMMN reading;
[`research/L13-contrarian.md`](../../research/L13-contrarian.md) records that CMMN "complements predefined
processes with case work that depends on evolving circumstances and discretionary decisions". That supports
the mechanism's existence, not the rate.
**Depends on model generation.** no — this is a property of running a company.
**Lane.** R5 (work discovery and routing).
**Discriminating fixture.** F1 unknown job.

### TC-19 — a system can absorb a new kind of work without human redesign

**Statement.** A new kind of work can be admitted, typed, staffed and accepted without a person editing a
capability catalog, a routing table or an agent definition.
**Kind.** hypothesis. This is the strongest operational claim in the thesis and the one most likely to fail
honestly.
**Measure.** Run F1 and count **human edits to system definitions** required before the work reaches accepted:
edits to capability contracts, routing rules, skills, templates or schemas. Zero edits with a correct accepted
outcome supports the claim. Also count what the system does with work it cannot type — silent mistyping into
the nearest existing kind is a worse failure than an honest refusal, and both must be distinguished from
success.
**Existing evidence.** Partly specified, untested:
[`05`](../specification/05-work-agents-skills.md) §2 — "Unfamiliar work starts with a bounded discriminator
before a large commitment"; §4 — "A role gap appears as an unowned required outcome, repeated unsupported
handoff, missing competence or unacceptable wait", and the maintenance custodian proposes the change while
"the legitimate capability owner approves". That last clause is a human in the loop, so the package as written
does **not** currently claim TC-19.
**Depends on model generation.** yes — typing unfamiliar work is an interpretation task.
**Lane.** R5.
**Discriminating fixture.** F1 unknown job, run twice: once with the founder available and once under F6
founder absent. The gap between those two runs is the real answer.

---

## Part D — what the thesis rejects

### TC-20 — thirty agents in one department is not cost-efficient

**Statement.** Beyond some number, adding executors within one domain raises capacity per accepted outcome
and lowers context quality, with no compensating gain.
**Kind.** hypothesis. Note that as stated the claim needs a threshold and the thesis supplies none; see
TC-39.
**Measure.** Sweep executor count within one domain at fixed total capacity — 1, 3, 7, 15, 30 — reporting
accepted outcomes, capacity per accepted outcome, handoff losses and coordination minutes at each point.
The claim predicts a turning point; the measurement's job is to find whether one exists and where.
**Existing evidence.** [`research/L13-contrarian.md`](../../research/L13-contrarian.md) reads Coase as
treating organizational boundaries as a comparison of costly internal coordination against costly market
transactions, with the inference that "coordination and assurance costs may dominate" — a reason to expect a
turning point, not a measurement of one.
**Depends on model generation.** yes — the per-executor cost moves with the generation, and the turning point
moves with it.
**Lane.** R8.
**Discriminating fixture.** F2 demand 4× — the sweep is only informative under load.

### TC-21 — some differentiation is required

**Statement.** One undifferentiated executor with all tools and all context cannot deliver the whole-company
scope at acceptable safety and cost.
**Kind.** assumption — held by the founder and the package alike, tested by neither.
**Measure.** Run the S0-style single-executor arm on the full fixture set with the union of permissions and
record where it fails: released operations outside scope, disclosure count, accepted-outcome rate, capacity
per outcome. A claim this basic deserves the negative control, and the package already insists comparators
are kept alive.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §2 keeps **S0** as "a
serious operating comparator" and §9 commits to reducing the system "if manual/native coordination delivers
equivalent useful outcomes and recovery within the same owner allowance at lower full cost".
[`05`](../specification/05-work-agents-skills.md) §9 repeats the obligation.
**Depends on model generation.** yes — this is precisely the claim a much stronger model could overturn.
**Lane.** R8.
**Discriminating fixture.** F3 three permissions — the single-executor arm holds all three, and either the
blast radius shows up or it does not.

### TC-22 — multi-agent structure is valuable here

**Statement.** For this system's scope, some multi-executor arrangement beats the best single-executor
arrangement on accepted outcomes at matched capacity.
**Kind.** contested.
**Measure.** Best-of-each comparison at matched total capacity across the full fixture set, with owner minutes
and unauthorized consequences reported separately, never summed.
**Existing evidence.** Against: [`research/L03-architectures.md`](../../research/L03-architectures.md) — "the
evidence does not justify … more agents necessarily improve outcomes"; MAST's failure taxonomy is drawn
entirely from multi-agent traces. For: the same lane's list of useful mechanisms — bounded delegation, typed
handoffs, separate thread state, replaceable workers — and
[`02-architecture-selection.md`](../02-architecture-selection.md) §3's retention of specialized production.
The lane's own verdict is that these "do not justify resolving … into one universal pattern".
**Depends on model generation.** yes.
**Lane.** R8.
**Discriminating fixture.** The whole fixture set; no single case decides it.

---

## Part E — what the directive fixes independently of the thesis

These eight are **founder constraints**. They are not up for a research verdict. They are listed because a
lane that proposes a design violating one has produced an unusable design, and because two of them
re-specify how a thesis claim must be measured.

### TC-23 — implementation mode follows the nature of the work, never agent count

**Statement.** Whether a capability is deterministic software, a fixed workflow, an LLM-assisted workflow, a
temporary agent, a persistent agent, a group, a human or an external professional is chosen by the nature of
the work.
**Kind.** founder constraint — [directive §1.2](../../inputs/DIRECTIVE.md): "Choose based on the nature of the
work rather than the desire to maximize the number of agents", and "Do not begin by inventing agent names and
roles."
**Measure.** Conformance, not effect: every proposed executor in a candidate model must name the property of
the work that put it in that mode.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §3 implements it as
the five-way production rule; `AD-002` records the decision.
**Depends on model generation.** no.
**Lane.** R2.
**Discriminating fixture.** Applies to every fixture as an admissibility check on candidate models.

### TC-24 — no component inherits its creator's permissions, and none grants itself more

**Statement.** A created executor holds an attenuated subset of its creator's authority, and no executor can
increase its own authority.
**Kind.** founder constraint — [directive §8.16](../../inputs/DIRECTIVE.md): "No agent may grant itself greater
authority. No component may silently inherit all permissions of the process that created it."
**Measure.** Attempt the escalation on a live fixture and observe refusal at the enforcement boundary, not in
the instruction text. Count operations released, not operations attempted.
**Existing evidence.** [`05`](../specification/05-work-agents-skills.md) §1 and §5;
[`02-architecture-selection.md`](../02-architecture-selection.md) §4 — "A model can propose another step but
cannot admit its own larger mandate."
**Depends on model generation.** no.
**Lane.** R4.
**Discriminating fixture.** F3 three permissions, with a delegation attempt that asks for a fourth.

### TC-25 — supervision follows consequence, not track record

**Statement.** The supervision an action requires is set by its possible consequence, reversibility and blast
radius; a good record may change review depth but may not silently raise the owner's maximum exposure.
**Kind.** founder constraint — [directive §1.5](../../inputs/DIRECTIVE.md).
**Measure.** Show that a high-performing executor's accumulated record cannot move any action into a lower
supervision class. The test is a monotonic-exposure check across a long run, not a policy statement.
**Existing evidence.** [`05`](../specification/05-work-agents-skills.md) §4 — "Trust is scoped eligibility,
not a general score … Success never expands authority automatically."
**Depends on model generation.** no.
**Lane.** R4.
**Discriminating fixture.** New — **the well-behaved executor**: run one executor to a long clean record,
then check that the set of actions it may take without approval is byte-identical to its first hour.

### TC-26 — internal cost is scarce capacity, not per-token price

**Statement.** Internal execution economics are measured in subscription allowance, provider quota buckets,
concurrency and owner attention, tracked separately; absence of a per-call charge does not mean capacity is
unlimited, and no silent fallback to a metered path is permitted.
**Kind.** founder constraint — [directive §8.21](../../inputs/DIRECTIVE.md).
**Measure.** Any cost comparison in this round that reports dollars per token as its primary unit is
non-conforming and must be re-reported in the units of
[`07`](../specification/07-integrations-capacity.md) §6.
**Existing evidence.** [`07`](../specification/07-integrations-capacity.md) §6; `AD-007`.
**Depends on model generation.** no.
**Lane.** R8 — and it binds TC-02's measure directly.
**Discriminating fixture.** F2 demand 4×, where the subscription ceiling binds and a token price would not
have predicted it.

### TC-27 — every significant run carries a context manifest

**Statement.** Each significant run records what context was loaded, why, from where, its version, age and
trust level, what was omitted, what was summarized and what may have been lost.
**Kind.** founder constraint — [directive §8.12](../../inputs/DIRECTIVE.md).
**Measure.** Conformance plus a falsification probe: the manifest must be produced by the server that
delivered the inputs, and a run whose manifest disagrees with its actual delivered inputs must be detectable.
**Existing evidence.** [`06`](../specification/06-knowledge-evidence-evaluation.md) §2 — "the server discovers
and records actual delivered inputs. The caller's claimed read list is not trusted." This is also the
instrument every context claim in Part A depends on; without it TC-01 and TC-04 have nothing to measure.
**Depends on model generation.** no.
**Lane.** R1.
**Discriminating fixture.** F5 capacity reset.

### TC-28 — a growing skill library must not degrade selection

**Statement.** Selection quality and selection cost must not worsen as the library grows.
**Kind.** founder constraint — [directive §8.9](../../inputs/DIRECTIVE.md): "Prevent an expanding skill
library from making selection progressively worse."
**Measure.** Hold the relevant question set fixed and grow the library to 10, 100 and 1000 packages with
adversarial near-duplicates; report selection time, candidates inspected, bytes loaded, wrong selections and
accepted outcomes at each size.
**Existing evidence.** [`05`](../specification/05-work-agents-skills.md) §8 specifies exactly this test and
labels the sizes **UNKNOWN** — "These are test sizes, not proven capacity."
**Depends on model generation.** yes — selection is an interpretation task, so the degradation curve moves
with the model even though the requirement does not.
**Lane.** R6.
**Discriminating fixture.** The 10/100/1000 sweep in [`05`](../specification/05-work-agents-skills.md) §8.

### TC-29 — preserving founder competence is a designed mechanism

**Statement.** The system deliberately returns selected work, evidence, customer material and decisions to
the founder even when it could process them automatically, and this is a mechanism rather than a
recommendation.
**Kind.** founder constraint — [directive §1.6](../../inputs/DIRECTIVE.md): "This must be a designed
mechanism, not an optional recommendation."
**Measure.** Delayed unfamiliar-transfer test: after an absence, measure recognition and intervention
performance on material the founder did not see being produced. Attendance, confidence and agreement with
the model are explicitly not competence.
**Existing evidence.** [`06`](../specification/06-knowledge-evidence-evaluation.md) §6, attention/competence
row — "attendance/confidence/agreement cannot establish competence";
[`02-architecture-selection.md`](../02-architecture-selection.md) §7; `AD-006`;
[`research/cross-lane-comparison.json`](../../research/cross-lane-comparison.json) X07 records that no
founder-specific dose is validated.
**Depends on model generation.** no.
**Lane.** R1 — a competence mechanism is a claim about what reaches the founder's context, and X07 is this
round's axis.
**Discriminating fixture.** F6 founder absent.

### TC-30 — agents may not be created to imitate human departments

**Statement.** No executor exists because a human company has that department.
**Kind.** founder constraint — [directive §8.8](../../inputs/DIRECTIVE.md): "Do not create agents merely to
imitate human departments. Determine whether human organizational structures are useful, harmful, or
unnecessary for each kind of work."
**Measure.** Conformance check on every candidate model: for each proposed executor, name the engineering
difference that justifies it. Note that §8.8 forbids the imitation and explicitly leaves open whether human
structures are useful — so this constraint does **not** settle TC-16.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §3 — "Existing roster
names do not supply that justification"; §6 — the 46 capabilities are "required capabilities, not future
departments".
**Depends on model generation.** no.
**Lane.** R3.
**Discriminating fixture.** Applies to every candidate as an admissibility check.

---

## Part F — what the thesis raises and does not answer

These twelve are `unknown`. Each is a question a lane must answer before a candidate model can be written
against it. An unknown left unanswered here becomes an invisible assumption in Step 3, which is the failure
[directive §6](../../inputs/DIRECTIVE.md) names: "Do not allow an unanswered question to become an invisible
assumption."

### TC-31 — what is a "shared source of truth" at company scale?

**Statement.** It is not established whether one shared source of truth means one store, one schema, one
authority over many native stores, or a contract that native systems satisfy.
**Kind.** unknown.
**Measure.** Enumerate the candidate readings, then test each against a case where an accounting system, a
CRM and a support tool each hold a different current answer about the same customer. The reading that
survives says which answer is authoritative and who may change it.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §5 answers a
*narrower* question — "Native accounting, CRM, support, code, design and professional meanings remain
authoritative in their domains. Shared meaning covers only actual cross-boundary decisions" — which is
closer to the fourth reading than to the first and has never been checked against the thesis wording.
**Depends on model generation.** no.
**Lane.** R1.
**Discriminating fixture.** New — **three systems, one customer, three answers**: a ticket closed, an invoice
unpaid and a CRM stage of "won", all current, all disagreeing.

### TC-32 — what is "context engineering" measured by?

**Statement.** The thesis makes context engineering the central variable and supplies no measure for it.
**Kind.** unknown.
**Measure.** Propose and test candidate metrics: facts-present rate, facts-used rate (the decision probe),
load-bearing-fact loss per transformation, manifest completeness, and stale-fact use rate. A metric qualifies
only if it moves when context quality is deliberately degraded and does not move under a sham change.
**Existing evidence.** [`06`](../specification/06-knowledge-evidence-evaluation.md) §2 supplies the
instruments — `ContextTransformation`, `SummaryLoss`, deterministic exact-field comparison, independent
semantic challenge — without naming a headline metric.
[`research/L05-memory.md`](../../research/L05-memory.md) warns that calling all of retention, retrieval,
applicability, provenance, authorization and omission "memory" "risks hiding failures behind successful
recall", which is the same trap one level up.
**Depends on model generation.** no — the metric should be model-independent even though its value is not.
**Lane.** R1.
**Discriminating fixture.** New — **the sham context change**: a rewording that preserves every load-bearing
fact must not move the metric; a deletion of one exclusion must move it.

### TC-33 — is "specialized knowledge" a skill or an agent?

**Statement.** The thesis lists specialized knowledge as a reason an agent earns existence; the package
treats know-how as a versioned skill loaded by a general executor. Which unit carries specialization is
undecided.
**Kind.** unknown — and it is the decision TC-10 measures.
**Measure.** For a fixed domain competence, build both and compare on the same outcome criteria, including
maintenance cost and what happens when the domain changes underneath each.
**Existing evidence.** [`05`](../specification/05-work-agents-skills.md) §8 — "`SkillVersion` is a reusable
procedure package, not a new agent." The founder's sentence and that sentence cannot both be the design.
**Depends on model generation.** yes.
**Lane.** R6.
**Discriminating fixture.** New — **the domain that changes**: a rule the domain depends on changes; compare
what must be edited, retested and revalidated under each unit.

### TC-34 — who writes "an updated view of what should happen next", and with what authority?

**Statement.** The thesis requires a current view of next actions and does not say who produces it, whether it
binds anyone, or what happens when it is wrong.
**Kind.** unknown.
**Measure.** For each candidate answer — the case authority, each executor locally, a planner, a derived
projection — test whether an executor can act against it, whether it can be stale, and whether being wrong is
detectable before the action releases.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §4 gives the
scheduler that function under endorsed priorities; [`05`](../specification/05-work-agents-skills.md) §3 makes
C02 the only advancer of a workflow cursor. So the package has an answer and the thesis's phrasing is broader
than it.
**Depends on model generation.** no.
**Lane.** R5.
**Discriminating fixture.** F6 founder absent — a next-action view is only load-bearing when nobody is
watching it.

### TC-35 — is the five-criteria list exhaustive or illustrative?

**Statement.** The founder writes "such as", then lists five. Whether the list is closed decides whether a
sixth reason may create an executor.
**Kind.** unknown.
**Measure.** This is a founder question of intent as much as a research question. R2 should return the
strongest candidate sixth reasons with evidence; whether the list is closed is then a decision packet, not a
finding.
**Existing evidence.** The thesis text itself: *"such as parallel work, distinct tools or permissions,
isolated context, specialized knowledge, or independent verification."*
**Depends on model generation.** no.
**Lane.** R2.
**Discriminating fixture.** F3 three permissions and the consequence-class fixture from TC-17, which between
them produce the two strongest sixth-reason candidates.

### TC-36 — what unit "earns existence"?

**Statement.** It is not established whether the thing that must justify itself is a template, a running
instance, a standing role, a context boundary or a permission scope.
**Kind.** unknown.
**Measure.** Apply the five criteria to each candidate unit and see which produces a decidable answer. A
criterion that cannot be evaluated against a unit is evidence that unit is the wrong one.
**Existing evidence.** [`05`](../specification/05-work-agents-skills.md) §4 separates them already —
`AgentTemplate` is "a versioned production recipe … not an identity with standing", `AgentInstance` binds one
recipe to one admitted WorkOrder — so the package has three units where the thesis has one word.
**Depends on model generation.** no.
**Lane.** R2.
**Discriminating fixture.** Not a scenario — a definitional resolution R2 must return before its other
findings can be read.

### TC-37 — can "independent verification" be honest under one model family?

**Statement.** The thesis names independent verification as a reason an agent earns existence; whether
independence is achievable when producer and verifier share a model family is unresolved.
**Kind.** unknown.
**Measure.** Joint false-acceptance rate on controlled planted defects across same-family producer/verifier
pairs, against the cheapest non-model discriminators — a deterministic counterexample, actual destination
state, original customer evidence, a scoped professional assessment.
**Existing evidence.** [`06`](../specification/06-knowledge-evidence-evaluation.md) §7 — "A different model
family can add a tested viewpoint but is not a proof of independent error … Measure joint false acceptance on
controlled defects before treating panel agreement as extra assurance." The repository's own operating state
in [`CLAUDE.md`](../../../../CLAUDE.md) records single-family review as an accepted risk with an exit
condition, and [handoff §0](../HANDOFF-F2-agents-work-layer.md) line 20 says independence in this round is
procedural and must never be laundered.
**Depends on model generation.** yes — correlated error is a property of the shared model.
**Lane.** R7.
**Discriminating fixture.** F4 independent verification.

### TC-38 — does the thesis govern human and professional performers too?

**Statement.** The five criteria are written about agents. Whether they also govern when a human, a
professional or an external service should be a distinct performer is unaddressed.
**Kind.** unknown.
**Measure.** Apply each criterion to a case requiring an actual professional determination and see whether it
yields the right answer. "Specialized knowledge" and "independent verification" plausibly do; "isolated
context" and "parallel work" plausibly do not.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §3 puts capable
people and qualified professionals in the same production rule as models, so the package applies one rule
where the thesis speaks only about agents.
**Depends on model generation.** no.
**Lane.** R2.
**Discriminating fixture.** New — **the filing that is not a filing**: preparing a professional packet is
preparatory work and sending it is not filing, per
[`02-architecture-selection.md`](../02-architecture-selection.md) §1. Which criterion tells you a separate
performer is required here?

### TC-39 — at what scale do the named costs bind?

**Statement.** The thesis's costs are asserted without a scale; it is unknown whether they bind at three
executors, thirty, or only above some throughput.
**Kind.** unknown.
**Measure.** The TC-20 sweep, but reporting the threshold as the finding rather than the direction. Report
separately for executor count, concurrency and total work admitted per period, because these can have
different thresholds.
**Existing evidence.** [`07`](../specification/07-integrations-capacity.md) §6 fixes concurrency at CP1 = one
native job plus one external job, so at the currently admitted capacity most of the thesis's costs cannot
even arise. That is an important and easily missed point: **the package's current concurrency makes several
thesis claims untestable as specified**.
**Depends on model generation.** yes.
**Lane.** R8.
**Discriminating fixture.** F2 demand 4×, which is the only fixture that moves the scale.

### TC-40 — who decides a new kind of job has appeared, and on what evidence?

**Statement.** TC-19 requires the system to recognise unanticipated work; the recogniser, its evidence and
its failure modes are unspecified.
**Kind.** unknown.
**Measure.** Confusion matrix on a labelled stream containing familiar work, genuinely new kinds, and
familiar work in unfamiliar wording. Silent mistyping into the nearest existing kind is the failure to hunt;
it must be separated from an honest refusal to type.
**Existing evidence.** [`05`](../specification/05-work-agents-skills.md) §4 gives the symptoms of a role gap
and routes the response through a human approval, and §10 registers `SkillSelection.no_match` as distinct from
`budget_exhausted` — "the difference is whether the search finished". That distinction is the right shape for
this problem one level up.
**Depends on model generation.** yes.
**Lane.** R5.
**Discriminating fixture.** F1 unknown job, with the familiar-work-in-unfamiliar-wording decoys included.

### TC-41 — does "coordinated capabilities" require a coordinator, and is it an agent?

**Statement.** The thesis rejects disconnected employees in favour of coordinated capabilities without
saying whether coordination is a component, a shared record, or an emergent property — or, if it is a
component, what justifies its own existence under the five criteria.
**Kind.** unknown. Note the self-reference: a coordinator must earn its existence by the same gate.
**Measure.** Build the fixture under each reading — explicit coordinator, shared record with no coordinator,
executors negotiating pairwise — and measure contradictory actions, duplicated effects and owner minutes.
**Existing evidence.** [`02-architecture-selection.md`](../02-architecture-selection.md) §3 selects an
explicit coordinator (the case admission authority) and §2 names its cost as "concentrated agenda authority";
§9 commits to reopening if that concentration "misses important work, increases owner labor, or obstructs
independently capable domains".
**Depends on model generation.** no.
**Lane.** R5.
**Discriminating fixture.** F1 unknown job under F6 founder absent — the case with no obvious owner is where
a coordinator either earns its keep or does not.

### TC-42 — what happens when the shared source of truth is wrong?

**Statement.** The thesis makes one shared truth the foundation and does not say how a false entry is
detected, corrected, or prevented from propagating to every executor that trusts it.
**Kind.** unknown — and it is the failure mode a single shared truth introduces that disconnected agents do
not have.
**Measure.** Plant a false entry — a superseded price, a closed duty that is still live, a corrected fact —
and measure blast radius: how many executors acted on it, how long until detection, whether the correction
reached dependent work, and whether the older decision's context can still be reconstructed afterwards.
**Existing evidence.** [`06`](../specification/06-knowledge-evidence-evaluation.md) §4 requires that a
correction is checked by "a new bounded case or a direct critical-field check" because "storing the
correction alone is insufficient"; §3 keeps a `ContradictionSet` rather than forcing a winner.
[`research/L05-memory.md`](../../research/L05-memory.md) reports Memora finding recurring invalid-memory reuse
across four models and six memory agents — the failure is observed, not hypothetical.
**Depends on model generation.** yes — whether a corrected fact actually displaces the superseded one in
behaviour is a model property, and Memora measured it.
**Lane.** R1.
**Discriminating fixture.** New — **the correction that must bite**: the founder corrects a fact mid-run;
count actions taken on the old value after the correction is recorded.

---

## What this artifact does not do

It does not evaluate any claim. It does not rank the claims by importance, because importance is a Step 2
output and ranking them here would pre-commit the lanes. It does not propose a work or agent model; that is
Step 3. Three claims — TC-10, TC-31 and TC-33 — record places where the founder's thesis and the package's
current specification give **different answers to the same question**, and those are flagged as contested or
unknown rather than reconciled, because reconciling them now would decide the round before it runs.
