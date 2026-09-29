# M3 — Workflow-first, no agents

> **What this is.** One of five F2 candidate models, formed blind of the other four. It is a **steelman**: the
> strongest honest version of a design in which there are no agent identities, no roster, and no delegation
> between models, and in which every decision about what happens next is made by deterministic code, a
> schedule, or a person. It selects nothing and approves nothing.
>
> **Standing caveat, per protocol §8.** No runtime exists. Every statement below is **specified behaviour**,
> authored offline by one model instance of one model family with procedural independence only. Nothing here
> establishes runtime conformance, deployment readiness, or business value. Every external measurement cited
> is a fact about some other system, task distribution and date.
>
> **Fixed boundaries.** This candidate reopens none of the six boundaries the handoff fixes, routes no
> decision packet against one, and returns no falsifier against one. Where it disagrees with a strength the
> frozen protocol §6 grants the simple baseline, it cites the lane that established the disagreement and
> does not amend the protocol.
>
> Statement kinds follow [DIRECTIVE §6](../../../inputs/DIRECTIVE.md). Finding ids resolve in each lane's own
> form (`R2 F-04`, `R3 F42`, `R5-08`, `R7 M1`, `R8 B-6`), through
> [`research/F2/cross-lane-comparison.md`](../../../research/F2/cross-lane-comparison.md).

---

## 1. Summary for the founder

**Your five criteria are all satisfiable by objects smaller than an agent.** Parallel work belongs to a
partition, not to a job [R2 F-06]. Distinct permissions belong to a credential held at the moment of the
effect [R4 F1]. Isolated context belongs to a read set, specialized knowledge to a versioned procedure.
Independent verification belongs to a relation between two inputs, a property of neither side alone
[R2 F-20]. **INFERENCE.** If no criterion attaches to an agent, none of them is a reason to create one, and
a design that creates none can still carry all five.

M3 is a durable state machine. A procedure is an immutable graph of steps: deterministic code, one model
call, a person, an external professional, or a released effect. A model call has typed input, typed output,
a budget, a timeout, an idempotency key, a declared read set and a validator. It never decides what runs
next, never spawns anything, and never holds a credential.

**Three things this buys.** Whether the checker saw the producer's rationale becomes a manifest fact,
because context is assembled per step by code. The three permissions in fixture F-3 never compose, because
nothing inherits. The capacity reset stops being a handoff, because work stops between steps [R2 F-18].

**What it costs, stated first.** Unknown work is admitted, typed and owned with zero human edits; creating a
new capability needs a person, which is what every mature system surveyed does [R5-06, R5-08]. Throughput of
the unfamiliar is bounded by named attention.

**Against the simple baseline.** M3 keeps B0's scripts, its human review and its one readable record, drops
the long session the launch contract makes unpurchasable [FAL-02], and adds two things: a record a step
cannot run without reading, and a credential the model side never holds. If these ventures never need a
three-permission task or an acceptance the producer could not influence, B0 is right and M3 is over-built.

*(292 words.)*

---

## 2. Core primitives

**SPECIFICATION.** Eleven primitives. Every one is a record or a pure function. None is a persona, a role, a
seat or a standing identity.

| Primitive | What it is | What it is not |
|---|---|---|
| **WorkRecord** | The durable unit of admitted work: outcome, beneficiary, consequence class, acceptance owner, trust class of its origin channel, surviving obligations, budget, deadlines | Not a ticket a person owns; the acceptance owner is a field, not the person currently looking at it |
| **Procedure** | An immutable versioned graph: typed input/output ports, named steps, deterministic guards, declared read sets per step, declared grants per effect step, stage rules, maximum elapsed and idle time, compensation contracts | Not a prompt, not an instruction bundle, not a role. It is executable structure |
| **Step** | The only unit of execution. Exactly one of five kinds (below) | Not a worker. A step has no memory of another step except through the journal |
| **Journal** | Append-only event log. **State is derived from the journal, and a state write *is* an event** [R3 F24, F25]. Single-writer keyed per WorkRecord [R3 F42] | Not a summary, not a dashboard, not a file anybody is trusted to have read |
| **ContextManifest** | Produced by the loader, which discovers and records the inputs it actually delivered. Carries versions, validity epochs, selection reasons, **omissions, summarisations and known loss** [06 §2, DIRECTIVE §8.12] | Not the caller's claimed read list, which is not trusted |
| **ConstraintSet** | The typed, machine-actionable boundary packet crossing every step edge: exclusions, deadlines, promised remedies, rejected alternatives, units, recipient scope, authorisation scope | **Not prose.** A gold-derived typed allowlist leaked 0 of 48 protected items where vague constraint language leaked 73% [R2 F-04] |
| **Guard** | A pure function over typed step outputs and journal state that selects the next step from a declared branch set | Not a model. A model's output is an *input* to a guard, never a jump |
| **EffectGate** | The single component holding outward credentials. Re-reads grants, identity, scope and validity epochs inside the release transaction [02 §4, R4 F3] | Not a tool a step calls at will. It is the only place an external consequence is released |
| **Scheduler** | Deterministic. Owns what runs when, under the endorsed capacity policy. A durable SQL timer sweep plus event wakeups; **no model runs merely to notice time** [05 §7] | Not a planner and not a negotiator |
| **RouteTable** | Deterministic classification from an admitted WorkRecord to a Procedure, with three outcomes: matched, `no_match`, `ambiguous` | Not a catch-all. A catch-all that does not name its residue is decoration [R5-09] |
| **Policy objects** | Three versioned artifacts, external to every procedure: the **grant policy** (which step of which procedure version may release which effect), the **capacity policy** (reserved shares and shed order), the **acceptance policy** (which consequence classes may be accepted by an oracle, which by a person) | Not fields inside the thing they govern. A capability declared where nothing backs it is decoration, and this repository has deleted 44 such declarations once already [R3 F60] |

**SPECIFICATION — the five step kinds.**

| Kind | Executes | Holds credentials | May release an effect | Consumes provider allowance |
|---|---|---|---|---|
| `compute` | Deterministic code | Only internal | No | **None** |
| `model` | One model call, one launch | **None** | **No** | Yes |
| `human` | A person supplies a typed decision | Their own | Only by authorising an `effect` step | No |
| `professional` | An external qualified party | Their own | Only by their own act | No |
| `effect` | The EffectGate | The one narrow grant for this effect | **Yes, and only here** | Depends on destination |

**DIRECT OBSERVATION, and it is why this candidate is not hypothetical about its substrate.** The only native
execution profile the package currently admits is `N-CLAUDE-SUPPLIED/v1`, launched as
`claude -p --safe-mode --restricted --tools "" --disallowedTools "mcp__*" --permission-mode dontAsk
--output-format json --json-schema [pinned schema]` [07 §5]. That is a model call with **no tool access**,
returning a structured result, parsed by something else, with build and test performed separately. The
Codex profile is explicitly not yet admitted. **A tool-less, schema-bound, single-launch model call is
already a workflow step**, and it is the only thing this system may currently run natively. M3 is the design
that builds on the capability actually admitted rather than on one that requires a profile nobody has passed.

**SPECIFICATION — the four invariants that make M3 M3.**

1. **Control flow is trusted; model output is data.** No value produced by a model can select a branch
   outside the declared branch set, name a destination, author a parameter the consequence class is computed
   from, or cause another model call. This is the CaMeL separation, whose measured price is published: 77% of
   benchmark tasks solved with provable security against 84% undefended, a **7-point utility cost** for the
   boundary [R2 F-09]. **M3 pays that price by construction and does not hide it.**
2. **No model step holds authority.** Credentials live at the gate. There is no delegation, therefore no
   inheritance, therefore none of the four default inheritance paths R4 documents in this runtime applies
   [R4 F5].
3. **Context is assembled by the loader, per step, and recorded.** A step sees its declared read set and
   nothing else. What it did not see is a field, not a claim.
4. **Nothing a model wrote is authoritative until a non-model step accepted it.** Write-path screening of a
   plausible false statement carrying no instruction refused **0 of 360** poisoned entries while catching
   injections at 0.832 recall [R1 F-10]. M3 therefore does not rely on screening; it relies on the promotion
   boundary.

---

## 3. Control structure

**SPECIFICATION.** One component advances the cursor, and it is code. The package already requires that only
one component advance a workflow cursor, in the same protected transaction that records the step result and
creates the next work intent [05 §3]. M3's single change to that rule is that the component is deterministic
software with no model inside it.

**How the next step is chosen, in order.**

1. The step returns a typed value against its declared output schema. A schema mismatch quarantines the
   report and opens a bounded repair request; free-form prose can accompany typed fields and can never fill
   a missing required field [05 §5].
2. The validator for that step runs. It is `compute`. It either passes, fails with a named class, or returns
   `inconclusive` — a completed assessment that cannot establish its predicate, which is distinct from an
   unfinished one [06 §6].
3. The guard, a pure function, selects the next step from the branch set the procedure declares.
4. If the selected step is an `effect`, the EffectGate re-reads current grants, identity epoch, grant epoch,
   scope epoch, restrictions and validity **inside the release transaction** [02 §4, R4 F3].

**SPECIFICATION — adaptive work, bounded.** A procedure may declare an *adaptive* step whose model output is
a **proposed plan**. The engine validates the proposal against a declared envelope: allowed step kinds,
allowed read sets, allowed effect classes (default: none), allowed budget. This is the discretionary-planning
shape, and its provenance is exact about what it does and does not give you: the standard most often cited
for unanticipated work admits a **pre-declared item that was not pre-scheduled**, not an unanticipated *kind*
of work, under role authorisation, gated by applicability rules [R5-06]. **M3 claims exactly that and no
more.**

**SPECIFICATION — no model-authored control flow, with one narrow exception that puts the boundary back.**
A model step may *draft* a new procedure as an artifact. The draft is not executable. It becomes executable
only when its test suite passes and a human capability owner accepts it, which is an irreversible-class
workflow under CAP-46. The vendor feature that writes a harness on the fly states its own motivation as
three single-context failures and its own cost as "significantly more tokens" [R3 F11]; M3 takes the
mechanism and refuses the autonomy, because a control-flow structure authored by a model from untrusted
inputs is the exact thing invariant 1 exists to prevent.

**SPECIFICATION — delegation depth.** There is none between models: a model step cannot invoke anything. A
*procedure* may invoke a sub-procedure, and the engine computes the child's grant set as the **intersection**
of the child's declared grants and the parent run's, monotonically narrowing, re-checked at the effect. The
ceiling on sub-procedure depth is a value in the grant policy with a named owner, and the engine refuses a
deeper call rather than failing it silently. Two vendors ship opposite defaults here — one permits three
layers and withholds the tool at the limit, one forbids recursion absolutely even with wildcard tool access,
both deliberately [R3 F18, D-10]. **M3 takes the absolute answer for models and the bounded-with-an-owner
answer for procedures**, which is the split the disagreement actually supports.

**SPECIFICATION — the human as a control element.** A `human` step is a typed node with a request payload, a
latest-responsible-decision-time, and a **declared behaviour on no answer**. Waiting for a person is an
inspectable state, not a blocked process — the one surveyed mechanism that achieves this is a typed request
node with its own checkpoint [R3 F27]. **No answer never means approval** [05 §5].

**SPECIFICATION — a system-wide rule the engine enforces at procedure admission.** For any step whose
consequence class is irreversible or outward-facing, the only admissible no-answer behaviour is `park`. A
procedure declaring otherwise fails admission. Without this rule, the meaning of "the founder is absent"
would be decided independently by whoever authored each procedure, which is protocol §5's (d)-class shape.

---

## 4. Execution structure

**SPECIFICATION.** The substrate is durable execution: the journal is the truth, completed steps are
memoised and never re-executed, and a wait consumes no worker. Four independent engines converge on this
contract [R3 F40–F43]. M3 takes the substrate rather than the rule, which is what supplies dimension W7 and
fixture F-5 structurally rather than by anyone's discipline [R8 B-1].

**SOURCE CLAIM, and it is the whole class's limit.** Every one of the four engines guarantees **the control
flow and not the external effect** [R3 F44]. Temporal's ambiguous-completion case — the effect succeeds, the
worker dies before reporting, the activity retries — survives in all of them. **M3's recovery story is
therefore about effects, because the control-flow half is a solved commodity**, and any candidate claiming
otherwise has misread what durable execution sells.

**SPECIFICATION — one effect per effect step, and the step is the idempotency unit.** The failure mode this
prevents is documented and is invisible to anyone reading a node's source as ordinary sequential code: on
resume after an interrupt, the entire node restarts from the beginning, so any side effect before the
interrupt runs again, and the mechanism's own documentation says those effects must be idempotent [R3 F29].
That is the mechanism by which **a human approval step can duplicate the payment it was approving** [R3 F30].
M3's structural answer is that an `effect` step contains exactly one effect and nothing else, so there is no
"before the interrupt" inside it.

**SPECIFICATION — the effect protocol, three phases, each journalled.**

1. **Intend.** An independently durable record of the exact proposed operation, its parameters bound to
   authoritative selectors, its idempotency key `(run, step, procedure version, parameter hash)`, its grant
   reference and its conflict set [02 §4].
2. **Release.** The gate's ordered transaction. Revocation before the cutoff prevents release; revocation
   after it leaves an operation in flight and starts reconciliation.
3. **Observe.** Destination state is read. Three terminal values: `observed_released`, `observed_not_released`,
   `unknown_effect`. **`unknown_effect` is a first-class state with a named custodian, never an assumption
   either way.** A lost response, an expired lease or a deduplication window can never justify a blind resend
   [02 §4, 05 §6].

**SPECIFICATION — the launch window is why steps are small.** A native job defaults to one launch and a
≤360-second network window, ≤16 MiB emitted result per job [07 §5]. **INFERENCE, and it is load-bearing for
the whole comparator argument:** this makes continuation mandatory in every arm, including a single-agent one
and including B0 [R2 F-18]. M3 is the only arrangement for which that is not a cost, because it never
assumed a session long enough to lose. The boundary-metadata loss that a transfer causes is paid once per
step in M3, and M3's countermeasure is the typed ConstraintSet, whose price is published and whose
alternative's price is also published: constraints survive a compressed transfer at roughly 0.57 while
operational facts survive at roughly 0.97 [R2 F-04].

**SPECIFICATION — concurrency and the stated winner.** Two attempts on one WorkRecord cannot both write,
because the journal is single-writer keyed per record [R3 F42]. The winner is the attempt holding the
current lease generation. The loser's output is retained as attributable evidence and never as a result. An
expired lease fences writes and **does not prove no external effect** [05 §6].

**SPECIFICATION — capacity, which binds before anything else does.** Capacity policy CP1 initialises at one
native job and one external job concurrently [07 §6]. **DIRECT OBSERVATION.** At that pin, thirty executors
do not multiply concurrent context windows; they serialise [R8 W-1]. M3 therefore makes no parallelism claim
at all at the current pin, and says that four claim verdicts in this round are unmeasurable there [MG-02].
What M3 does claim is different and does not depend on concurrency: **every `compute` step costs zero
provider allowance**, and determinism is the only lever that reduces subscription consumption without
reducing work [R8 B-7]. M3 maximises the zero-allowance share by construction. Whether that outweighs the
per-step cache cost is **UNKNOWN** and must be reported as a ratio between arms, because no absolute weekly
denominator is published [R8 W-6].

---

## 5. Information flows and memory model

**SPECIFICATION — one authority per field, delivery narrowed per step.** The founder's shared source of
truth cannot mean one large store read by everyone. Performance grows increasingly unreliable as input
length grows with task complexity held constant, and even a single distractor reduces it [R8 W-3, R1 F-06].
It also cannot mean each step assembling its own view, because a canonical record is what makes a resumed
step correct. M3 resolves the two by separating **authority** from **delivery**: the journal is the single
authority over every field it owns; the loader delivers only the declared read set of the step about to run.

**DISAGREEMENT, preserved.** The opposite prescription — share context and share full traces, not individual
messages, because actions carry implicit decisions and conflicting decisions carry bad results — is held by a
vendor arguing against the category that would flatter its own product, which makes it more credible on this
point rather than less [R8 B-2, R1 F-19]. The two positions optimise against different failure modes and
both are coherent [D-03]. **M3's ground for taking the narrow side is specific to M3:** conflicting implicit
decisions arise between *concurrent independent executors*. M3's concurrency is declared in the procedure
graph, and two steps that can conflict are either sequenced by the graph or share a single-writer key. M3
removes the failure mode rather than paying for a defence against it. The quantity that would settle the
general question — how much load-bearing content survives narrowing against how much accuracy is lost by
carrying it all — is measured by nobody [D-03].

**SPECIFICATION — what is typed at every step edge.** The ConstraintSet is machine-actionable and is checked,
not read: exclusions, deadlines, promised remedies, rejected alternatives, units, recipient scope,
authorisation scope, and the surviving obligations of the WorkRecord. **The authorisation and recipient
scope is not optional and its absence is the dominant measured failure** in the founder's own five-part list
of what shared truth should contain [R1 TC-14].

**SPECIFICATION — what a step may not see, and how that is enforced.** A step's read set is declared in the
procedure and delivered by the loader. Filtering by the model, after material is already in the window, fails
at rates between roughly 16% and 51% on current frontier models, and the component where defences work worst
is shared memory of peers' work [R1 F-14, F-15, F-16]. **M3 never puts the material in the window.** This is
the difference between a filter at the loader and a filter in the prompt, and it is the only direction the
evidence supports.

**SPECIFICATION — there is no compaction in the critical path.** Compaction has deterministic, documented
loss rules and the model is not told what was lost: re-read files are capped at five, skill bodies are capped
and dropped oldest-first, and the skill index is not re-injected at all [R1 F-01]. M3 has no session long
enough to compact. Where a summary is produced for a person, it is a derivative **beside** the journal and
never a replacement, and it carries `SummaryLoss` entries for omitted alternatives, qualifiers, temporal
relations and source uncertainty [05 §5, 06 §2].

**SPECIFICATION — the six memory jobs, placed.** Working memory is the step's manifest and bounded scratch.
Episodic history is the journal. Semantic knowledge is a versioned store that **only a `compute` step or an
accepted `human` step may write**; a model step's proposal sits quarantined until promoted. Procedural memory
is the Procedure itself, with its tests, provenance, owner and version — which is why M3 has no separate
skill library and no separate selection problem for one. Intent and preferences are authenticated human
statements, versioned, never inferred. Projections are derived and are never authority [06 §1].

**SOURCE CLAIM, and it is the finding most adverse to any shared-truth design including this one.** Retrieved
wrong facts override correct prior knowledge more than 60% of the time [R1 F-11], a stored correction is not
an applied correction [R1 F-13], and the provenance-ranking defence at its shipped weight was statistically
indistinguishable from no defence, while at the weight that worked it took evidence recall to exactly zero
[R1 F-10]. **M3's answer is the promotion boundary, not a screen**, and M3 must say plainly what that does
not buy: a wrong fact accepted by a person is still wrong, and the blast radius of a false journal entry in
M3 is every later step that reads that field. The measurement that would size it is unrun [TC-42, MG-09].

**SPECIFICATION — the manifest is produced by the server that delivered the inputs.** The caller's claimed
read list is not trusted [06 §2]. **DIRECT OBSERVATION.** No substrate emits a record of what a lossy
transform dropped, in any of three independent evidence bases [AG-02], and no standard on the path carries
what the manifest requires: of nine required fields, one protocol's resource metadata touches age and nothing
touches version, trust level, omission, summarisation or possible loss [R1 F-21]. **So the manifest is
M3's to build, it is unprecedented in practice, and the part that crosses the provider boundary may be
unachievable** — the provider's own context editing reports how much was cleared and not which facts left
[R1 F-02]. The honest mitigation is the cheapest one available: reconcile the provider's reported edits
against the manifest and treat any unaccounted edit as a defect [MG-07].

---

## 6. Evidence · Authority · User · Failure · Self-improvement

### 6.1 Evidence model

**SPECIFICATION — deterministic oracle before any model checker, always.** Where a deterministic predicate
exists, the acceptance step is `compute`, there is no model in the loop, and the correlation between producer
and checker is zero [R7 M1]. This is not a preference. Where an objective ground truth exists, strong model
judges perform close to random guessing against it [R7 F5], and this repository holds an independently
derived figure of the same shape from an unrelated domain [R7 F5's second derivation]. **What an oracle does
not buy is process compliance:** a passing episode can omit a required user confirmation, so an oracle that
compares destination state cannot see a skipped authorisation [R7 M1]. M3 therefore pairs every state oracle
with a journal predicate over the *path*, because in a system whose fixed boundaries include who may release
an effect, the path contains the obligation [D-09].

**SPECIFICATION — where model judgement is unavoidable, four rules.**

1. **The review step's read set is `{artifact ref, acceptance criteria ref}` and nothing else.** Not a role
   name, not an instruction: a declared read set delivered by the loader and recorded in the manifest. The
   measured effect is real, small, and on a low base — a fresh-context reviewer reached 28.6% F1 against
   23.8% for a context-carrying subagent (p=0.004) and 24.6% for self-review (p=0.008), while **reviewing
   twice in the same session did not beat reviewing once (p=0.11)** [R7 F9]. That last result is the control
   that makes the first mean anything: context separation moves the number, extra compute does not.
2. **The paired clean case is mandatory and runs in the same session.** Per amendment AM-01. Detection rate
   on the defective artifact is reported beside refusal rate on the clean one. The reason is a measurement:
   under neutral framing, judges' false-positive rates on already-patched files ran from 68.4% to 96.8%
   [R7 F8, FAL-09]. **An unpaired control cannot distinguish a working checker from one that refuses
   everything**, and refusing everything is the measured default state of the nearest published analogue.
3. **Union of findings, never a vote, never a mean, never an aggregate score.** 46% of problems were found by
   exactly one evaluator; marginal gains for evaluators two, three and four were +42%, +20%, +13%; and
   any-two agreement on severity ran at 20–28% [R7 M5, R4]. A union of findings is an input to a decision,
   not a verdict.
4. **Every agreement figure is reported chance-corrected.** Exact-match agreement overstates discrimination
   by 33.8 to 41.2 points on the benchmark this package's own records cite [R7 F3, M7].

**SPECIFICATION — what M3 does about one-family bias, and what it cannot do.** Independence of *influence* is
achievable by procedure and is checkable here, because the checker's delivered inputs are recorded by the
loader rather than asserted by the checker. Independence of *error* is **not achievable** within one family
for the self-consistent class, and no blinding reaches it: self-preference tracks the low perplexity of
familiar text rather than an authorship label, so removing the label does not remove the bias [R7 F1, R5];
and relatedness alone is sufficient for contamination even with no self-authorship at all [R7 F2].

M3's four responses, in order of strength.

- **Move the decision off the model.** The share of acceptance steps that are `compute` oracles is M3's
  primary verification metric, and it is reported as a fraction of accepted outcomes.
- **Close the leakage channel M3 itself creates.** The sharpest adverse question against the founder's
  central mechanism is whether the shared source of truth becomes the preference-leakage channel that defeats
  provenance separation [R7 §9]. **M3's specific answer:** the producing step writes its rationale into a
  named journal field, and the review step's declared read set excludes that field. Whether the exclusion
  held is a manifest fact. This is the one thing M3 can say here that a design where an agent assembles its
  own context cannot say at all.
- **Escalate the class, not the panel.** For irreversible and outward-facing consequence classes, a model
  step may generate findings and **may not be the acceptance step**. Acceptance is an oracle or a person.
- **Declare the residual in the artifact.** A review that does not name the residual is non-compliant with
  fixture F-4 [R7 §8].

**DISAGREEMENT, preserved and not resolved by M3.** A panel of smaller judges from disjoint families beats a
single large judge at over seven times lower cost, and a cross-model probe was the only working remedy for
self-consistent errors; against that, error correlation persists across providers and **rises with
capability**, so the strongest second opinion is the most correlated one [D-13]. M3 does not decide this. It
provides the seam: a review step's runtime profile is a field, so a second family is a configuration change
and not a redesign — which is the whole of what a seam is worth, since no non-Anthropic model is reachable
from inside the harness today.

**FOUNDER CONSTRAINT, and M3's own weakest point on evidence.** Every design here eventually routes to human
acceptance, and human evaluators agree with each other at 5–65%, and on severity at 20–28%, with no problem
unanimously judged severe across two studies [R7 F15, X19]. **The human anchor is an instrument with an
unmeasured error rate.** M3 makes more use of it than any agent-based candidate, because it routes irreversible
acceptance to people by design. That is a real cost of this candidate and it is not offset by anything.

### 6.2 Authority model

**SPECIFICATION.** A boundary is real only if the thing checked at the moment of the effect is the thing that
was granted [R4 F1]. M3 satisfies this by having exactly one place where effects happen.

- **Consequence class is computed by the engine, from inputs the acting party cannot author** [R4 F4].
  Payee from the verified payee source, amount from entitlement and terms, recipient from the relationship
  and permission record, claims from current acceptance evidence [02 §4]. A model step may supply a value
  into a declared field of declared type and domain, and **may never supply a value that the consequence
  class is computed from**. Two widely used mechanisms fail this test by their own documentation: tool
  annotations, which the specification says clients must treat as untrusted, and command-text permission
  rules, which classify what the model said it would do rather than what will happen [R4 F4].
- **Least privilege by non-composition, not by attenuation.** A task needing three permissions is three
  effect steps, and the union never exists anywhere. There is no helper, so nothing inherits. The four
  default inheritance paths documented in this runtime are all properties of subagent spawn [R4 F5] and none
  of them has a subject in M3.
- **Sub-procedure grants narrow monotonically and are verified.** `derived ⊆ parent`, computed at dispatch
  by code, re-checked at the effect. **SOURCE CLAIM, with its standing stated:** three production families
  solve attenuation by putting it in the credential or the call [R4 F2], and the standards community names
  the delegation-chain verification gap as open, with the proposed answer carrying no formal standing [R4
  F10]. **M3 is building ahead of the standards here, not behind them**, and should say so.
- **Revocation is a live re-read at the effect, not a property of a credential.** Attenuation buys narrowing
  and does not buy revocation, and that difference is exactly F-3's adverse variation [R4 F3]. Because the
  engine dispatches effects one at a time, there is exactly one place to re-read.
- **Attributable identity without an agent.** The identity that performed an effect is
  `(run, step, procedure version, grant id, executing principal)`. Fixture F-3 requires a record of which
  identity performed which effect, and that is a genuine reason to separate identities even where capability
  is identical [R2 F-21 #4]. M3 supplies it without creating a standing performer.
- **The decorative-declaration loophole is closed at admission.** A grant named in a procedure is resolved
  against the grant policy when the procedure is admitted; an unbacked grant fails admission. This repository
  has shipped 44 capability declarations that no configuration backed, 16 budget blocks nothing read, and
  workflow files nothing invoked [R3 F60]. **A checker's coverage is not its subject**, and M3's admission
  check is written against that lesson.

### 6.3 User model

**SPECIFICATION.** The founder appears in three forms and none of them is "the operator".

1. **As a step.** `human` steps are typed nodes with deadlines and declared no-answer behaviour.
2. **As the acceptance owner of a consequence class**, recorded as a field on the WorkRecord at admission by
   an ordered resolver: promise sponsor, else service mandate, else the designated maintenance custodian,
   with least-authority-sufficient as the overlap tie-break and the tie-break reason recorded [03, R5 §8].
3. **As the recipient of a designed return.** **FOUNDER CONSTRAINT.** The system deliberately returns
   selected work, evidence, customer material and decisions even when it could process them automatically,
   and this must be a designed mechanism rather than a recommendation [DIRECTIVE §1.6]. M3 implements it as a
   scheduled procedure, `founder-return/v1`, whose selection rule is deterministic: every irreversible-class
   decision, every shed with a residual duty, every default-on-no-answer that fired, a declared share of
   accepted outcomes sampled before the outcome is known, and a declared share of **adverse** samples.
   **UNKNOWN:** no founder-specific dose is validated anywhere [X07], and nothing in any lane's source set
   measures whether a system's human operator remains competent [AG-10]. The shape is designed; the dose is
   not evidenced and must be treated as a hypothesis with an owner.

**A criterion tension M3 must confront rather than finesse.** W11 fails a candidate whose plain-language
description reads as a workflow product; W12 needs the structure a founder can most easily hold; and a lane
records that these two pull in opposite directions [R8 A-6, FAL-11]. **M3 is the candidate most exposed to
the workflow-product reading, and pretending otherwise would be dishonest.** The mitigation is that the
description handed to a business-literate reader must be of the company, expressed through the capability
catalog: *"a company that has written down how it does each of its jobs, executes each one the same way every
time, calls a model or a person in at the points where judgement is needed, and lets nothing reach a customer
without a named person or a deterministic check saying it may."* Whether a reader hears a company or a
dashboard is an empirical question about people, and it is untested here.

### 6.4 Failure model

**SPECIFICATION.**

| Failure | M3's behaviour | Grounding |
|---|---|---|
| Step fails, transient | Bounded retry by error class; classes are transient internal, invalid input, auth/permission, provider capacity, stale context, invariant breach, unknown effect, competence gap, no progress | 05 §6 |
| Model step fails semantically | One retry after a changed input, environment or method. Two failures with the same cause open a Blocker; they do not prove impossibility | 05 §6 |
| Effect step, outcome unknown | `unknown_effect` with a named custodian. Reconcile before repeating any business action. **No engine in the survey solves ambiguous completion** | R3 F44, 02 §4 |
| Concurrent attempts | Lease generation wins at the single-writer key; loser's output kept as evidence | R3 F42 |
| Capacity exhausted mid-run | Run parks in a typed state with its checkpoint; the scheduler's shed rule applies; the residual duty keeps its owner | 07 §6, R5-19 |
| Work matches no procedure | `no_match` routes to `unclassified-work/v1` with a named triage custodian and a declared maximum age; breach of the age is itself an admitted WorkRecord with the founder as acceptance owner | R5-14, R5 §9 Q5 |
| Work is refused | Terminal state of the same record, with a reason. Refusal is not deletion | R5-14, AG-12 |
| Shed at capacity | Park with owner, deadline and **count**. Shedding without a count is indistinguishable from a silent drop after the fact | R5-19, R5 §9 Q9 |
| Escalation ladder exhausts | Terminal element is a named standing human alternate. If none exists, admission in that class **stops** rather than the record sitting assigned and silent | R5-12 |
| Procedure changes with runs in flight | Existing runs pinned if compatible; otherwise an explicit migration plan naming in-flight states, step mapping, preserved outputs, invalidated acceptance and rollback | R3 F40, 05 §3 |
| Journal entry is false | Promotion boundary limits what enters; correction requires an understanding check by a new bounded case or a direct critical-field check, because storing the correction is insufficient | R1 F-13, 06 §4 |
| Provider silently updates the model behind a pinned version | A pre-gap model verdict is **stale** in the same class as a pre-gap source fact; the fixed control pool is re-run on a cadence shorter than provider release cadence | R7 F7, M10 |

**The four silent-drop shapes M3 must alarm on, taken from operating systems rather than invented:** capacity
overflow passed through untouched; work resting in a queue nobody polls; an item past a holding destination's
retention window because that retention was shorter than the source's; and an escalation ladder that
exhausted its repeats leaving the item assigned with no further notification [R5 §7]. M3 names a destination,
a retention longer than the source, an alarm with a reader, and a count, for each [R5-10].

### 6.5 Self-improvement model

**SPECIFICATION.** Every mechanism carries a removal test, because a mechanism with no removal criterion is a
permanent tax and W9 makes that a failure condition [R3 §10.6].

- **Every model step declares the validator that would have to fail for the step to be necessary.** When a
  newer model passes the validator with the step merged into its neighbour or removed, the step is removed.
  **The precedent is exact and it runs against the interest of the group that produced it:** the research
  group that established that agent-computer interface design measurably changes behaviour now ships a
  100-line successor that deletes the interface engineering, keeps one tool and a linear history, and scores
  competitively [R3 F38, F39]. A scaffold's contribution is a function of the model generation that motivated
  it, and it must be re-ablated when the model changes.
- **A procedure executed N times with zero branch variation and zero validator failures is a candidate for
  collapse** into a single step or a `compute` step. The point of the rule is that M3's default direction of
  travel is toward *less* machinery, not more.
- **Procedure retirement.** A procedure with no admitted run inside a declared window and no live obligation
  citing it is retired by the capability owner. An unused emergency procedure can remain necessary; an unused
  redundant one retires after dependency and obligation checks [05 §8].
- **Catalog growth is the one place M3 has the founder's stated failure mode.** Selection over a growing
  catalogue degrades, and confusability rather than count drives it [AG-06]; one vendor states a 30–50 item
  threshold with no published method [R5-18]. M3's countermeasure is the specified one: deterministic
  eligibility filter first over capability, input shape, versions and permissions; then a bounded candidate
  set; then load. The sweep at 10/100/1000 with adversarial near-duplicates authored by a different process
  is the measurement, and it is unrun [05 §8, MG-08].
- **A change to a procedure, a policy object or the engine is a self-edit.** It is irreversible class, it is
  human-accepted, and the improvement gate is independently protected [CAP-46].

---

## 7. The six fixtures, worked

### F-1 — An unknown kind of job appears mid-build

*A supplier's contract obliges a data-deletion procedure nobody planned.*

**Step 1, admission — zero human edits.** The obligation arrives through an authenticated supplier channel.
`intake/v1` creates a WorkRecord in state `unclassified` with the channel's trust class attached. Admission
is biased toward accepting: in incident practice anyone may trigger the process and the instruction is to
trigger it when unsure [R5-04]. **Admission is a state with a named owner, not a folder** [R5-14].

**Step 2, typing — deterministic first, then one model step with three outcomes.** `classify/v1` runs exact
matchers over the procedure catalog's applicability predicates. On no exact match, one `model` step returns
exactly one of `{procedure_id, no_match, ambiguous}`. **The failure to hunt is silent mistyping into the
nearest existing kind, and it must never be scored as success** [R5 §8]. The instrument is a three-way
confusion matrix over familiar work, genuinely new kinds, and familiar work in unfamiliar wording. The
measurement is unflattering exactly here: in-scope accuracy of 96% or above against a best out-of-scope
recall of 66%, falling to 40.3% when novel training examples are scarce [R5-15]. The benchmark's class
balance is the inverse of a company's, so its scores do not transfer without re-weighting [R5-16]. Here the
job returns `no_match`, correctly.

**Step 3, staffing — and this is where M3 states its honest limit.** `no_match` routes to
`unclassified-work/v1`, a real, versioned, tested procedure whose steps are: bound the question → gather
evidence through model steps that hold no credentials → produce a typed decision packet → route to the named
triage custodian → the custodian either accepts a one-off disposition, authorises a bounded sequence of
effect steps one at a time, or commissions a new procedure under CAP-46. **Nothing located in the research
staffs a genuinely novel work type without a pre-declared envelope, a pre-registered handler, or a human
redeploy** [R5-06, R5-08, R5-14]. The one counterexample writes a new skill rather than a new executor, and
its enabling condition is an environment returning a cheap automatic verdict on every attempt, which a
supplier deletion obligation does not have [R5-21]. **M3 therefore claims zero edits for admission, typing
and acceptance-owner assignment, and refuses to claim them for capability creation.**

**Step 4, acceptance owner — resolved by rule, which is not a human editing the system.** The ordered
resolver assigns promise sponsor, else service mandate, else the designated custodian, recording the
tie-break reason [03, R5 §8]. The deletion obligation's acceptance owner is the privacy custodian (CAP-22),
because the obligation's subject is a deletion scope. **The deletion itself is an effect step**, released by
the gate under a narrow grant, with verification of propagation to derivatives, and the obligation is not
discharged by the workflow completing.

**Step 5, completion.** The custodian authorises the effect sequence. The obligation's discharge is a
separate predicate from the run's acceptance. **Done and resolved are separable, and the most widely deployed
tracker permits an item to be Done with an empty resolution** [R5-13]; M3 forbids it by making the resolution
a required field of the terminal transition.

**Adverse variation A — a malformed, partly false report from an untrusted channel.** The record's trust
class is `untrusted`. Such a record may reach `model` steps as *data* and may never reach an `effect` step
without either a human step or an independent corroboration step reading a different source. This is
invariant 1 applied to provenance, and it is the reason input provenance is a candidate sixth criterion in
its own right [R2 F-21 #1]. No effect is released on the strength of the report.

**Adverse variation B — a genuinely spurious job, refused with a reason.** `unclassified-work/v1` terminates
in `refused` with a stated reason, which is a terminal state of the same record, not a deletion [R5-14].
**Negative control §4.9 is the sharp one: admission without refusal is not admission**, and nothing in the
entire framework survey refuses a job with a reason [R3 §9 F-1]. Two further obligations M3 accepts: a
communicated refusal is an outward effect and therefore an effect step, and **the refusal has its own
acceptance owner** [R5 §9 Q3], which M3 names as the triage custodian for internal refusals and the
acceptance owner of the affected capability for outward ones.

**What M3 cannot supply and will not invent.** The abstain threshold for the classifier depends on the base
rate of genuinely novel work, and no source located measures it [R5-24]. **The cheapest measurement in the
whole round needs no software: count admitted items over a past window against the existing capability list**
[MG-06]. Until it exists, the threshold is set provisionally and reported as provisional.

### F-2 — Demand at 4×

**At 1× and 2×.** M3 is indistinguishable from S1.0 and from B0 on every concurrency-dependent unit, because
CP1 binds all three [R8 §3]. Any candidate claiming a difference here is claiming something the pin forbids.

**At 4×, what is shed and by whose authority.** The scheduler sheds, executing a **capacity policy the
founder endorsed in advance** (CAP-45, CAP-35). Reserved shares are separate and are not a blended score:
due service and commitments, ordinary creation and research, continuity and security and grievance,
maintenance and evaluation, discretionary exploration [07 §6]. Discretionary admission stops at 85% of any
single saturated dimension and resumes below 65% [07 §6]. **Pressure is the maximum of independently observed
dimensions, never a blend that hides an exhausted one.**

**The objection M3 must answer, and its answer.** A class has no representative to ask, and a chartered agent
would be a nameable unit to suspend with an owner — this is the single place in the six fixtures where a
charter does work a non-charter design has no mechanism for [R8 A-4]. **M3's counter is not that the
objection is wrong; it is that at 4× there is no time to negotiate and a pre-endorsed, auditable order is
faster and reviewable, and a shed lane is not an agent anyway — it is a set of WorkRecords.** M3's residual
cost is real: a pre-endorsed order cannot notice that this particular shed is catastrophic. The mitigation is
that **shedding parks with an owner, a deadline and a count**, never drops [R5-19], and that any shed of a
record carrying a due obligation raises a founder-return item the same day.

**What the founder sees.** Every shed is a typed journal event carrying the class, the residual duty, its
owner and its deadline. The weekly return lists them.

**Added coordination cost per unit of delivered work.** M3's coordination is the engine's, and the engine is
`compute`: **zero provider allowance per coordination decision.** That is the honest version of the claim,
and it is narrower than "M3 is cheaper". **UNKNOWN:** no absolute denominator exists on the Claude side, the
provider stopped publishing one, and every figure this round can produce is a ratio between arms [R8 W-6,
MG-03]. **A cost comparison that counts tokens and not scarce subscription capacity fails W4 even if its
arithmetic is correct** [§4 control 7], and M3 reports launches, quota buckets, wall-clock occupancy and
owner attention separately [07 §6].

**One scheduler rule that inverts ordinary intuition.** Allowance does not roll over across its reset window,
so a conservative scheduler that holds capacity back **destroys** what it withholds [R8 §3]. M3's scheduler
therefore fills reserved-but-idle capacity with the highest-value admitted work in the reserving class rather
than protecting the reserve as thrift. Reservations are priced as waste, not as prudence.

### F-3 — A task needing three distinct tool permissions

*Payment read, customer record write, outbound message send.*

**The useful outcome.** Three `effect` steps, sequenced by the procedure, each released by the gate under one
narrow grant. The model steps that prepare each payload hold nothing — the admitted native profile launches
with `--tools ""` [07 §5]. The union of the three grants never exists in any single place at any moment.
**This is not attenuation; it is non-composition**, and it answers protocol §5 item 6 with *refused, not
minted*.

**Adverse variation A — one permission revoked mid-attempt.** The gate re-reads current grants, identity
epoch, grant epoch, scope epoch and restrictions inside the release transaction [02 §4, R4 F3]. The third
effect refuses. The run parks in `blocked-authority` with the two completed effects recorded and a
compensation decision owed to a named owner. **Compensation is its own typed work with its own authority and
acceptance; cancelling the run never makes the first two effects untrue** [05 §3].

**Adverse variation B — a helper is spawned that must not receive all three.** In M3 there are no helpers, so
the fixture's question becomes *a sub-procedure is invoked*. The child's grants are the intersection of its
declared set and the parent run's, computed by the engine at dispatch and re-checked at the effect. The child
cannot receive a grant the parent run did not hold, and cannot receive a grant its own procedure did not
declare. **The property that makes this a boundary rather than a label is that the thing checked at the
effect is the thing that was granted** [R4 F1].

**The record of which identity performed which effect.** `(run, step, procedure version, grant id, executing
principal)`, journalled at intend, at release and at observe.

**What M3 must concede here.** A grant can narrow reliably and **arrive** unreliably: an identical
configuration delivered 24 tools one day and zero across three dispatches two days later, cause unknown
[R3 F59]. **A permission that can be silently absent makes a task that silently did less look identical to a
task that was correctly scoped** [R3 §10 Q4]. M3's mitigation is that a grant's arrival is asserted at the
gate, not at dispatch: an effect step whose grant is absent **fails loudly** rather than completing with less.
That converts a silent under-performance into a named failure, and it does not explain the underlying
asymmetry, which nobody has.

### F-4 — A verification the producer must not influence (with the AM-01 paired clean case)

**Step 1 — try to remove the model.** The artifact's acceptance criteria are checked for a deterministic
predicate: a test suite, a schema, a destination-state comparison, a numeric reconciliation, a citation
existence check. If one exists, the acceptance step is `compute` and F-4 is satisfied with zero producer
influence and zero model correlation [R7 M1]. **The share of acceptances discharged this way is reported.**

**Step 2 — where no oracle exists, the checker's stated inputs are a manifest fact.** The `review` step
declares `read_set = {artifact_ref, criteria_ref}`. The loader delivers exactly that and records it. The
producing step's rationale lives in a journal field the review step's read set excludes. **A review that says
it did not read the producer's rationale, in a system where nothing recorded what it read, is an assertion**
[R7 §7]; in M3 it is a record, and that is M3's single strongest claim on this fixture.

**Step 3 — the known-defect control fails the always-pass checker.** Required by `06` §6 and by negative
control §4.3.

**Step 4 — the paired clean case, per AM-01, in the same session.** A correct artifact goes through the same
checker under the same procedure. **Both numbers are reported or neither is.** The reason is measured: under
neutral framing, false-positive rates on already-patched files ran 68.4% to 96.8%, so detection of 97.2%
alongside a 96.8% false-positive rate is not detection, it is a constant [R7 F8]. What withholding the
producer's framing moves is the **decision threshold**, not the **discrimination**, and the repository's own
prior summary of that study conflated the two [R7 F8].

**Step 5 — the three-arm probe, not two.** W5 specifies rationale withheld against rationale supplied. Two
distinct channels exist: the producer's *reasoning* (anchoring) and the producer's *preferred conclusion*
(sycophancy), and the second can leak through a status field or a draft verdict even when the first is
blinded [R7 §8]. **M3 runs a third arm in which the checker reads the shared journal record**, because that
is the founder's own proposed architecture and is the channel this round must probe [R7 §9].

**Step 6 — the floor that makes "a measurable difference" mean something.** Report the p=0.11 control
alongside the p=0.004 result: separate context beat a context-carrying checker, and repeated same-context
review did **not** beat single review [R7 F9, §8]. A candidate reporting only an improvement has not excluded
"more compute" as the explanation.

**The honest account of what independent can mean in one model family.** Independence of influence:
achievable, checkable, and checked at the loader. Independence of error: **not achievable** for the
self-consistent class, by two mechanisms — familiarity-driven self-preference that no blinding reaches
[R7 F1] and family relatedness that is sufficient for bias with no self-authorship at all [R7 F2]. M3's
consequence: **for irreversible and outward classes, no model step is an acceptance step.** The best
procedurally independent reviewer anyone has measured reached 28.6% F1, missing roughly seven of ten injected
defects [R7 F9]; that is a finding generator, not a gate.

**One structural rule M3 adds.** The router selects the review step's procedure from committed configuration,
never at runtime from the producing run's state. **A design whose routing component can choose who checks its
own work has not achieved procedural independence** [R5 §8].

### F-5 — A handoff across a capacity reset

**The claim, stated narrowly.** M3 has no handoff across the reset, because there is no turn to transfer.
Work stops **between steps**. The journal is the state. A resumed run reads the journal; it re-derives
nothing from a summary.

**What the resumed step may trust.** Journal events, each with its source version and validity epoch. Work
persisting in a queue while nothing can take it is a **normal** state after a reset and is not evidence of
loss [R5-08].

**What it must re-derive.** Any value whose pinned source version changed during the gap — a deterministic
comparison at step entry, not a judgement. And any **model verdict** taken before the gap, which is stale in
the same class as a stale source fact, because the provider may have updated the model behind a pinned
version without telling anyone. The measured precedent is a service whose accuracy on one task moved from
84% to 51% in three months with nothing on the buyer's side changing [R7 F7, §8].

**Adverse variation A — the pre-reset summary omits a decision.** M3 has no summary in the critical path. If
one exists for a person, it carries `SummaryLoss` entries and the next step may demand the original or stop
the affected inference [05 §5, 06 §2]. **Negative control §4.5 — a manifest that lists inputs but not
omissions — is what every surveyed system currently emits** [R3 §9], so M3 must build this rather than import
it, and the provider-side half may be unachievable [R1 F-02].

**Adverse variation B — a source fact changed during the gap.** Caught by the version comparison at step
entry. The dependent journal entries are invalidated and an understanding check runs: **a stored correction
is not an applied correction**, so the check is a new bounded case or a direct critical-field read, not a
re-read of the correction [R1 F-13, 06 §4].

**Adverse variation C — one external effect was already released.** The idempotency key
`(run, step, procedure version, parameter hash)` is journalled before release. On resume the gate reads the
actual destination state before releasing anything. Three outcomes and no fourth; `unknown_effect` parks with
a custodian. **No engine in the survey solves ambiguous completion** [R3 F44], and M3 does not claim to.

**Who accepts the resumed work.** The same acceptance owner, because it is a durable field of the WorkRecord
and not the identity of anything that stopped. **An arrangement whose acceptor is an instance loses the
acceptor at the reset; M3 cannot, and this is a structural advantage that costs nothing.**

**The cost half, honestly.** A resumed step pays full reprocessing because there is no cache to hit, and the
provider's own documentation gives four mechanisms by which a long single session consumes more allowance
than its activity suggests: the full conversation resent with every request, cache expiry on a subscription,
compaction being itself a large request, and idle check-ins resending full context [R8 B-6, FAL-01]. **M3
trades "resend a growing conversation" for "never have a cache".** Which is cheaper is **UNKNOWN**, must be
reported as a ratio between arms, and M3 asserts no advantage here.

### F-6 — The founder absent for a week

**Day 0 — what continues.** Every step whose consequence class falls inside a standing endorsed mandate runs:
all `compute`, all `model`, all reversible-class effects with an oracle acceptance, all due service with its
reserved capacity share.

**Day 0 — what cannot happen in his name.** Every irreversible and outward-facing effect requires a `human`
step, and the engine refused at admission any procedure declaring a non-`park` default for one.

**Day 1 — a decision only he can take arrives, with a deadline on day 4.** The `human` step carries a
latest-responsible-decision-time of day 4 minus the execution time of what follows. The rule is taken from
the one operating system designed for genuinely unforeseen work: **personnel should not delay planning in
anticipation of information that has not arrived** [R5-23]. So the plan is made on day 1 on the best
information available, the decision is *requested* on day 1, and the fallback is declared then rather than
discovered on day 4.

**Day 4 — the ladder ends.** An escalation ladder terminates and the last state is assigned-and-silent, which
is the unowned queue with an owner's name on it [R5-12]. M3 names the terminal element as a **standing human
alternate** declared in the continuity arrangement. **If no such alternate exists, M3 stops admitting work in
that class rather than letting the record sit assigned and silent** — a refusal with a reason, which is worse
for throughput and better for truth.

**Day 5 — an incident.** The incident procedure (CAP-31) has its own reserved capacity share, its own
standing custodian, and containment steps whose consequence class is pre-classified so that containment does
not wait for an approval that containment is the reason for. A grievance does not have to win a commercial
prioritisation score to receive its mandated response [07 §6].

**Return — the re-entry brief, which must restore competence and not only awareness.** Two parts. A
**deterministic projection**: everything admitted, completed, parked, refused and shed with residuals; every
default-on-no-answer that fired; every irreversible decision deferred and its remaining slack; every
`unknown_effect`. Then **one model step** whose narrative output is validated field-by-field against that
projection before the founder sees it — the same discipline the field applies nowhere. And a set of **adverse
samples he must judge**, because attendance, confidence and agreement with the model are explicitly not
competence [06 §6, TC-29].

**The cost of the week that M3 must state.** The founder is the only error source in the system whose errors
are uncorrelated with the model family's [R7 §8]. **His absence removes the only cross-family instrument the
company has**, which is a second and independent reason — beyond authority — that irreversible acceptance
parks rather than proceeds.

---

## 8. Capability binding — all 46

**SPECIFICATION.** In M3 every capability is carried by a workflow; the column below names the **dominant
step kind inside it**. `D` deterministic compute · `H` human step · `M` model step inside a fixed graph ·
`P` external professional step · `E` gated effect step. Saying "everything is a workflow" would be the
rename-only failure [§4 control 1], so the operative content is the step kind and the acceptance owner.

| CAP | Concern | Dominant mode | Acceptance owner |
|---|---|---|---|
| 01 | Intent and commitments | H (+D versioning) | Founder. No model step may author an intent |
| 02 | Portfolio direction | H (+M options) | Founder |
| 03 | Opportunity discovery | M (+D evidence-completeness oracle) | Founder, for admitting a candidate |
| 04 | Customer research | M + H | Knowledge custodian; original customer material never replaced by a summary |
| 05 | Market research | M + D (citation-existence oracle) | Knowledge custodian |
| 06 | Company and product strategy | M options, H choice | Founder |
| 07 | Product management | M + H | Standing product owner, else founder |
| 08 | Experience and product design | M + H | Founder. **Taste uses the legitimate human criterion** [06 §6] |
| 09 | Brand and identity | M + H | Founder |
| 10 | Software and technical construction | M + **D oracles** (tests, lint, build) + H at release | Oracle for conformance; human for release. The best-evidenced capability in M3 |
| 11 | Quality assurance | D first, M for findings only | Oracle where one exists, else human. **The checker has its own acceptance owner** [06 §6] |
| 12 | Launch and release | D + H + E | Founder or standing release owner. Irreversible class |
| 13 | Content production | M draft + H accept | Human accepts every outward claim |
| 14 | Marketing and distribution | M + E gated | Human accepts each outward channel commitment |
| 15 | Sales | M + H + E | Human. **No model step may author a promise** |
| 16 | Customer communication | M draft + H accept + E send | Human. Outward = irreversible class |
| 17 | Support and customer success | M + H + E | **A refund is accepted by a human step held by the standing support custodian under a bounded value ceiling; above the ceiling, the founder. The refund effect's amount comes from the entitlement record, never from a model output** |
| 18 | Pricing and commercial economics | M analysis + H decision | Founder |
| 19 | Finance and treasury | D + E | Gate under a standing ceiling; founder above it |
| 20 | Bookkeeping and financial close | D + M reconciliation proposals + H discrepancies | Human; P for filings |
| 21 | Legal and regulatory coordination | M locate + P determine | External professional. **A professional is not created by naming an endpoint** [02 §3] |
| 22 | Privacy and data rights | D + H, statutory deadlines as durable timers | **A non-customer request is owned by a standing privacy custodian named in the continuity arrangement.** Deletion propagation to derivatives is deterministic and verified |
| 23 | Security operations | D + H, reserved capacity | Standing security custodian |
| 24 | Procurement and suppliers | M compare + H sign | **A supplier commitment is signed by a human step: the founder or a mandated signatory. No model step releases a commitment** |
| 25 | Partnerships | M + H | Founder |
| 26 | Hiring and external capacity | M + H + P | Founder; applicant burden counted |
| 27 | Human collaboration | D + H | Founder |
| 28 | Analytics | **D** | Oracle. Denominators come from the journal, including rework, rejected attempts and abandoned outputs [05 §6] |
| 29 | Experimentation | D (engine enforces the predeclared stopping rule) + H | Oracle + human. The plan is registered before treatment results are seen [06 §6] |
| 30 | Operations and fulfillment | D + E + P/H for physical | Human or professional; a successful dispatch does not satisfy a fulfillment guard |
| 31 | Incident response | D + H, reserved share | Standing incident custodian |
| 32 | Knowledge management | D + M proposals + H/oracle promotion | **Promotion into durable knowledge requires a non-model acceptance step** |
| 33 | Governance | H | Founder. Protected rules are artifacts; changing one is irreversible class |
| 34 | Organizational learning | M proposal + H accept | Human. Anecdote, supported pattern and causal claim carry different evidence requirements [06 §1] |
| 35 | Scaling | D (capacity policy) + H (endorsement) | Founder |
| 36 | Pause | D | Founder endorses; the workflow stops admission, preserves duties, controls renewals |
| 37 | Recovery and resumption | **D** — this is the engine's own core | Oracle; human for every `unknown_effect` |
| 38 | Pivot and changed direction | H | Founder. Existing promises survive the change of purpose |
| 39 | Closure and wind-down | D + H + P | Founder + professional. **Software shutdown is not closure** |
| 40 | Institutional formation and readiness | P + H | Professional |
| 41 | Succession and transfer | H + P | Successor must accept actual authority, duties and unresolved effects before transfer |
| 42 | External grievance and remedy | D timers + H | **A standing continuity custodian named in a continuity arrangement that survives closure, with a funded remedy reserve.** See below |
| 43 | Owner attention and competence | D schedule (`founder-return/v1`) | Founder |
| 44 | Truthful account and reproducibility | **D** — the journal is the account | Oracle: the account is reproducible from the journal or it is a defect |
| 45 | Compute, subscription and infrastructure capacity | **D** — the scheduler | Founder endorses the policy; the scheduler executes it |
| 46 | Controlled system improvement | D + H, irreversible class | Founder. **A procedure change is a self-edit and the gate blocks it without human acceptance** |

**The three the protocol asks by name.**

- **Who accepts a refund (CAP-17).** A human step held by the standing support custodian, under a bounded
  standing mandate with a value ceiling; the founder above the ceiling. The effect step's amount is bound to
  the entitlement record by the procedure. **A model step may recommend and may never author the amount**,
  because the consequence class is computed from parameters the acting party cannot author [R4 F4].
- **Who owns a non-customer grievance six months after closure (CAP-42, with CAP-39).** A standing continuity
  custodian, named in a continuity arrangement, funded by a remedy reserve, reachable by a route that
  survives the retirement of every other procedure in that venture. The grievance procedure's durable timers
  keep running after closure. **This is the objection M3 must answer head-on:** an assignment rule produces a
  custodian at the moment it is asked and does not maintain a relationship, which is the shape of answer that
  two unresolved high findings ask for [R8 A-5]. **M3's counter is that what a grievance needs is a reachable
  *person* and a funded remedy, and a durable timer plus a reserve plus a named person supplies exactly that
  without maintaining a model identity.** The residual M3 cannot remove: the person has to exist and be paid,
  and no architecture creates them.
- **Who sheds a lane at 4× demand (CAP-45, CAP-35).** The scheduler, executing a capacity policy the founder
  endorsed in advance. Nobody negotiates. Every shed parks with an owner, a deadline and a count, and appears
  in the founder return.

**Where M3's evidence base is thinnest, said plainly.** Every system surveyed in this round is a
software-construction or generic-orchestration system, and **no evidence bears on customs disputes, refunds,
supplier commitments or wind-down** [FAL-06, X02]. CAP-10 is the row M3 can defend from published work.
CAP-17, CAP-22, CAP-24, CAP-39, CAP-41 and CAP-42 are rows where M3 is reasoning from operating doctrine and
from the package's own boundaries, not from measured agent systems. **The narrowing risk W11 names is a risk
of importing the evidence base, not only the vocabulary.**

---

## 9. Comparators

### 9.1 Against S1.0

S1.0 already puts durable procedures before model work, already makes workflow, run and step the execution
records, and already restricts cursor advancement to one component [02 §3, 05 §3]. **M3 is not a different
philosophy from S1.0; it is S1.0 with four mechanisms deleted.**

| S1.0 mechanism | M3's disposition | Consequence |
|---|---|---|
| `AgentTemplate` as a versioned production recipe | **Deleted.** The Procedure is the recipe; the step validator is the self-check | One fewer versioned artifact; loses a per-template maintenance owner, which moves to the procedure |
| `AgentInstance` bound to one WorkOrder | **Deleted.** The run is the binding | Loses instance-level evaluation as a subject [05 §4]; gains that there is no identity to lose at a reset |
| Private decomposition by a native performer, with attenuated authority | **Deleted.** Decomposition is declared in the procedure or proposed into a validated envelope | **This is M3's largest real loss.** S1.0 absorbs unanticipated substructure cheaply inside a performer; M3 must declare it or route it to a person |
| Delegation with a one-child default depth | **Deleted** between models; retained and code-enforced between procedures | Removes the four default inheritance paths [R4 F5]; removes the composite-grant question entirely |
| `ExecutionSelection` choosing among agent and skill versions | **Narrowed** to runtime-profile selection per step | Selection remains; its subject shrinks from an agent to a profile |

**What M3 must show that S1.0 does not owe.** That declaring substructure in advance is affordable for
whole-company work, when S1.0 can absorb it. M3's answer is `unclassified-work/v1` plus the validated
adaptive envelope, and its price is a human in the loop for effects on unknown work. **HYPOTHESIS, not
established:** that this price is lower than the cost S1.0 pays in attenuation machinery, inheritance
defences and instance-level evaluation. Nobody has measured either side.

### 9.2 Against B0, the simple baseline

**Where M3 *is* B0.** The deterministic scripts are M3's `compute` steps. The checklists are M3's guards and
validators. The human review is M3's `human` steps. The one shared record a person can read end to end is
M3's journal, and that strength — which protocol §6 grants B0 and which serves W12 better than any projection
— **M3 keeps in full**, unlike any design whose state is spread across permission-filtered peer projections.

**Where M3 is not B0, in exactly four places.**

1. **There is no long session.** B0's defining mechanism is one long context. **FAL-02:** that is not
   purchasable under this system's own launch contract — a native job caps at one launch and a 360-second
   window, so continuation is mandatory in every arm [R2 F-18]. M3 is the only arrangement for which this
   costs nothing, because it never assumed the session.
2. **The record binds.** Negative control §4.2 fails a canonical document with no mechanism binding any
   attempt to it — and every shipping implementation of "the file everyone is supposed to trust" is exactly
   that artifact, with two vendors documenting in their own words that it is not enforcement [R1 F-20, AG-01,
   FAL-07]. B0's shared record in version control is that artifact. **In M3 a step cannot run without the
   loader delivering its declared read set, and the manifest records what was delivered.** This is the single
   difference that turns a shared record into a binding one.
3. **Credentials are not where the model is.** B0 has no permission separation at all. **F-3's safety clause
   is entailed by the frozen boundaries rather than measured**: a single executor holding the union of three
   permissions cannot exhibit attenuation because there is nothing to attenuate from, and that is true at any
   demand level and needs no experiment [R8 TC-21, §9]. B0 fails F-3 structurally, and M3's whole authority
   model is the repair.
4. **There is an acceptance owner who is not the producer.** B0 has no verification independence of any kind,
   because it has no separate context by construction, and same-context self-review measured as the worst arm
   [R7 §8]. B0 fails F-4.

**FAL-01, and M3 claims nothing from it.** Protocol §6 grants B0 the lowest plausible consumption of scarce
subscription capacity; the provider's own documentation gives four mechanisms contradicting that clause
[R8 B-6]. M3 does not convert this into an advantage for itself, because the four mechanisms are replaced in
M3 by a different cost — a fresh, cacheless launch per step. **UNKNOWN, and it is the measurement this
comparison most needs:** B0's weekly draw against a step-based arm at matched accepted outcomes, reported as
a ratio [D-06].

**When B0 wins, per protocol §6, applied honestly.** B0 matches M3 on F-1, F-2 at 1× and 2×, F-5 and F-6 at
equal or lower founder attention, once B0 is given the deterministic scripts, retrieval and human review it
is entitled to. **B0 loses only F-3 and F-4, and it loses both structurally rather than by degree.** So:
**if these ventures never need a task composing three permissions and never need an acceptance the producer
could not influence, B0 is the correct design and M3 is over-built.** That is M3's removal criterion as a
whole system, stated as a falsifiable condition rather than as a caveat.

**R8's open question, answered for M3.** *When does B0 stop being B0?* At the moment it adds (a) a durable
record of which script ran with which inputs that a later run is **forced** to read, and (b) a credential the
session does not hold. Those two additions are M3's minimum. **Read M3 as the smallest thing that is not B0**,
and read every mechanism in §2 beyond those two as owing its own separate justification.

---

## 10. Strengths · weaknesses · limits · complexity · security · provider dependence · migration · when this is wrong

**Expected strengths.**

1. **The verification boundary is a record, not a claim.** Checker inputs are delivered by a loader and
   recorded. No other arrangement in this round can make "the checker did not read the rationale" a fact.
2. **Authority is not composed, so it cannot be over-composed.** No inheritance, no attenuation gap, no
   composite grant, one place to re-read at revocation.
3. **The capacity reset is not an event.** Work stops between steps; the journal is the state.
4. **The zero-allowance share is maximised by construction**, and determinism is the only lever that reduces
   subscription consumption without reducing work [R8 B-7].
5. **The record a person can read end to end is preserved**, which serves W12 better than any projection.
6. **Removal tests are structural**: a step declares the validator whose failure would justify it.

**Expected weaknesses.**

1. **Unknown work costs a person.** M3's F-1 answer has a human in the loop for every effect on unclassified
   work. Throughput of the unfamiliar is bounded by named attention.
2. **Declaring substructure in advance is expensive** where S1.0 would absorb it inside a performer.
3. **The catalog is the growth surface.** Procedures accumulate, and selection over a growing catalogue
   degrades with confusability rather than count [AG-06]. M3 moved the founder's skill-library problem rather
   than removing it.
4. **It leans hardest on the instrument with the least-known error rate.** Human acceptance, at 5–65%
   any-two agreement [R7 F15, X19].
5. **The manifest is unprecedented and its provider-side half may be unbuildable** [R1 F-02, F-21, AG-02].
6. **It is the candidate most exposed to W11's workflow-product reading.**
7. **CaMeL's 7-point utility cost is paid on every step, by design** [R2 F-09], and utility lost to a
   boundary is not recoverable by a better model.

**Scalability limits.** At CP1 there is no parallelism to scale [07 §6, R8 W-1]; M3's scaling story is *more
deterministic steps per accepted outcome*, not *more executors*. The binding resource under a subscription is
admitted work per period, which is measurable today, rather than executor count, which is not [R8 §5]. The
catalog is the second limit, and its curve is unmeasured [MG-08].

**Operational complexity.** Higher than B0 and lower than any design carrying agent definitions, inheritance
rules and delegation ceilings. The engine, the loader, the gate and three policy objects are the whole of it.
The real complexity is **authoring**: every procedure must declare read sets, grants, validators, branch sets
and compensation. **UNKNOWN:** authoring and maintenance effort in any unit, for any arrangement — the
maintenance half of every specialist-versus-procedure comparison is unevaluable because nobody has measured
it [MG-15].

**Security implications.** Every mechanism that binds sits outside the model: kernel sandbox, client-enforced
tool filter, hook exit code, single writer per key [R3 §9]. M3 places every boundary there and places none in
an instruction file. Residual surfaces it does not remove: a false journal entry carrying no attack signature
(screening caught 0 of 360) [R1 F-10]; a poisoned procedure or tool description, for which content-hash
pinning re-checked at use is the only mitigation surviving a rug pull [R3 F48]; and confused-deputy patterns
that carry `S:C`, scope-changed, in four authoritative vulnerability records, one of them requiring no user
interaction at all [R4 F9].

**Provider dependence.** M3 depends on one admitted profile, `--tools ""` plus a pinned JSON schema, which is
the **narrowest** provider surface of any candidate: no MCP, no tool inventory, no session resumption, no
subagent semantics. Switching providers replaces a step's runtime profile, not the architecture. Two
constraints it inherits: a subscription seat is not a substrate a product may be built on, by licence
[R3 F9], and the metered path is one in-product setting away at both providers with nothing observing it
[R8 W-5, FAL-10]. **M3's answer to the second is the only one available: the account setting is an observed
fact with a named observer and a journal entry when it changes** [X20].

**Migration difficulty.** From S1.0: mostly deletion, because S1.0 already has workflow, run, step and the
single-cursor rule. From the current repository harness: the seven engines become procedures, and the eleven
shims disappear, which is the same collapse this harness already performed once from 21 named roles to 7
engines on the ground that each group was one procedure repeated per domain [R3 F61]. **INFERENCE, and the
caveat is required:** that is evidence about **one** harness whose roles were authored by a model and never
staffed by people, and it does not establish that role-shaped decomposition carries no enforced difference in
general [R3 F62].

**When this is the wrong design — five named conditions.**

1. **When the work is genuinely novel more often than it is familiar.** M3's cost is concentrated exactly
   there, and the base rate is unmeasured [R5-24, MG-06]. **This is the first thing the founder should
   measure, and it needs no software.**
2. **When nobody is available to be the human in the loop.** M3 routes irreversible acceptance to people; a
   company with no reachable second person degrades to "everything parks".
3. **When a model becomes reliable enough that per-step validators never fire.** Then the scaffolding is the
   defect, and M3's own removal test should fire before anyone argues about it [R3 F39].
4. **When the work is research-shaped and genuinely parallel.** The one published quantitative result
   favouring multiple executors is confined to research-shaped work and explicitly excludes most coding
   [R8 A-2, D-05]; if the ventures' work is mostly breadth-first search, M3's serial graph is the wrong shape.
5. **When the concurrency pin lifts and parallelism turns out to pay.** M3 admits declared parallel branches
   in a procedure, so this is a policy change rather than a redesign — but the claim that it is cheap is an
   **INFERENCE**, untested.

---

## 11. (d)-class self-audit

Against protocol §5's ten concrete examples. Only (d) blocks.

| # | §5 example | M3's answer | Class |
|---|---|---|---|
| 1 | No rule for who admits a job of an unknown kind | `intake/v1` admits; the named triage custodian routes `no_match`; the criterion is a three-way classification with an explicit abstain class | **(a)**, with one **(c)** residual: the abstain *threshold* depends on the unmeasured novel-work base rate [MG-06] |
| 2 | No authority named for a handoff's acceptance | There are no handoffs. The acceptance owner is a durable field set at admission by an ordered resolver with its tie-break reason recorded | **(a)** |
| 3 | Incompatible meanings of "done" | Four separate predicates: `step.accepted`, `run.accepted`, `obligation.discharged`, `effect.observed`. Resolution is a **required** field of the terminal transition, closing the shipped contradiction [R5-13] | **(a)** |
| 4 | No rule for what a resumed attempt may trust | Journal events with pinned source versions; a deterministic version comparison at step entry; a pre-gap model verdict is stale in the same class as a stale fact | **(a)** |
| 5 | Skill selection with no removal criterion | Procedures are the unit. Retirement: no admitted run in a declared window and no live obligation citing it, by the capability owner; an unused emergency procedure may remain | **(a)**, window length unset — see below |
| 6 | Permission composition undefined | **Refused, not minted.** Three effects, three steps, three grants, never a union | **(a)** |
| 7 | No delegation ceiling with an owner | Zero between models, structurally. Bounded between procedures, value owned by the grant policy, engine refuses rather than failing silently | **(a)** |
| 8 | No writer authority on shared state | Single-writer keyed per WorkRecord; the loser of a race keeps evidence status, never result status [R3 F42] | **(a)** |
| 9 | No rule for in-flight work at a provider or model change | Procedure version pinning with explicit migration [R3 F40]; a changed runtime invalidates the step's validator calibration and the run parks rather than silently re-running | **(a)**, calibration protocol is **(c)** |
| 10 | No stated winner between concurrent attempts | The attempt holding the current lease generation | **(a)** |

**Three items left open, stated as decisions rather than hidden as defaults.**

1. **Whether a model review step may be the acceptance step for reversible, internal consequence classes.**
   M3's **DESIGN PROPOSAL** default: yes, only where the paired clean-case control passed in the same run and
   the class is reversible and internal. **This is a founder decision because it sets how much of the company
   runs without a person**, and a framer may not take it. Routed as a decision packet. Left undecided, an
   implementer would invent it, which is the (d) shape — so it is named here rather than defaulted silently.
2. **Whether `unclassified-work/v1`'s custodian is the founder or a standing non-founder role.** At F-6 this
   changes the fixture's outcome completely [R5 §9 Q7]. M3 cannot decide who exists in the company. Founder
   decision.
3. **The abstain threshold for the classifier**, which depends on the base rate of genuinely novel work. M3
   classes this **(c)** with a protocol, a unit, a baseline, a stopping rule and an owner — count admitted
   items over a past window against the existing capability list [MG-06] — and records that **a reviewer
   could reasonably read it as (d)** on the ground that "criterion" includes the threshold. The disagreement
   is preserved rather than argued away.

**Negative controls, checked against M3.** §4.1 rename-only: M3 deletes mechanisms rather than renaming them,
and the deletion list in §9.1 is the test. §4.2 unread source of truth: the loader delivers the read set and
the manifest records it. §4.3 checker that passes without checking: known-defect control plus the AM-01
paired clean case, both reported. §4.4 a component justified by an unexercised capability: M3 has no agents,
and the analogous trap is a **step** justified by nothing — the countermeasure is that every step declares
the validator whose failure would justify it. §4.5 manifest without omissions: omissions are required fields.
§4.6 an "independent" reviewer fed the rationale: the exclusion is a declared read set, checkable in the
manifest. §4.7 tokens as capacity: units are launches, quota buckets, wall-clock occupancy and attention,
separately, and every figure is a ratio. §4.8 job titles relabelled: M3's partition is by procedure, and a
procedure carries an enforced difference in its step graph, read sets and grants — with the live risk being
the **decorative declaration**, closed by resolving declared grants against the grant policy at admission
[R3 F60]. §4.9 a router that admits everything: refusal is a terminal state with a reason and its own
acceptance owner. §4.10 fixtures authored after the candidate: none authored here; AM-01 is applied as
published.

---

## 12. Evidence ledger

Each design choice, its finding ids, and its DIRECTIVE §6 kind. "No evidence" means no lane finding and no
package citation supports the specific choice, only its direction.

| # | Design choice | Findings | Kind |
|---|---|---|---|
| 1 | A model call is a step with typed I/O, budget, timeout, idempotency key, validator | R3 F40–F43; 05 §3 | INFERENCE from source claims |
| 2 | No agent identities, no roster, no delegation between models | R2 F-20; R3 F61, F62; R8 W-4; 07 §5 | INFERENCE |
| 3 | Control flow trusted, model output is data; the 7-point price is stated | R2 F-09 | SOURCE CLAIM + DECISION |
| 4 | A state write is an event; state derived from the journal | R3 F24, F25 | SOURCE CLAIM |
| 5 | Single-writer keyed per WorkRecord | R3 F42; §5 item 8 | SOURCE CLAIM |
| 6 | Typed ConstraintSet at every step edge | R2 F-04, F-05; X13 | SOURCE CLAIM |
| 7 | Loader-assembled per-step context; manifest records omissions | 06 §2; DIRECTIVE §8.12; R1 F-02, F-21; AG-02 | FOUNDER CONSTRAINT + SOURCE CLAIM |
| 8 | No compaction, because no long session | R1 F-01; R2 F-18 | INFERENCE |
| 9 | Credentials only at the effect gate; model steps hold none | R4 F1, F5, F7; 07 §5 | SOURCE CLAIM + DECISION |
| 10 | Consequence class computed from non-authorable parameters | R4 F4; 02 §4 | SOURCE CLAIM |
| 11 | Sub-procedure grants intersect and are re-checked at the effect | R4 F2, F10 (**no standing**) | SOURCE CLAIM, building ahead of standards |
| 12 | Revocation as a live re-read inside the release transaction | R4 F3; 02 §4 | SOURCE CLAIM |
| 13 | Deterministic oracle before any model checker | R7 M1, F5 | SOURCE CLAIM |
| 14 | Review read set excludes the producer's rationale field, loader-enforced | R7 M2, F9, §9; R7-S11 | INFERENCE from source claims |
| 15 | Paired clean case mandatory, same session | AM-01; R7 M4, F8; AG-15 | FOUNDER CONSTRAINT (amendment) |
| 16 | Union of findings; no vote, no mean | R7 M5, R4 | SOURCE CLAIM |
| 17 | No model step is an acceptance step for irreversible classes | R7 F1, F2, F9, F5; 06 §6 | DECISION on source claims |
| 18 | Human step as a typed node with LRDT and a declared no-answer default | R3 F27; R5-23, R5-12; 05 §5 | SOURCE CLAIM |
| 19 | Engine refuses a procedure whose irreversible step declares a non-park default | DIRECTIVE §1.5; 05 §5 | FOUNDER CONSTRAINT, mechanised |
| 20 | Refusal is a terminal state of the same record, with its own acceptance owner | R5-14; AG-12; R3 §9 F-1; R5 §9 Q3 | SOURCE CLAIM |
| 21 | `unclassified` is a state with an owner, a maximum age and an alarm | R5-10, R5-14; R5 §9 Q5, Q6 | SOURCE CLAIM |
| 22 | Generic `unclassified-work/v1` with every effect human-gated | R5 TC-19 split; R5-06, R5-08, R5-03 | **DESIGN PROPOSAL**, direction evidenced |
| 23 | Model may draft a procedure; only a human capability owner makes it executable | R3 F11; R2 F-09; 05 §8 | DECISION |
| 24 | Shed parks with owner, deadline and count | R5-19, R5-10 | SOURCE CLAIM |
| 25 | Capacity policy pre-endorsed; the scheduler executes; nobody negotiates | 07 §6; contested by R8 A-4 | DECISION, with the objection preserved |
| 26 | Reserved-but-idle allowance is filled, because allowance does not roll over | R8 §3 | SOURCE CLAIM |
| 27 | Maximise the zero-allowance share | R8 B-7; 05 §7 | INFERENCE |
| 28 | Procedure version pinning plus explicit migration for runs in flight | R3 F40; 05 §3 | SOURCE CLAIM |
| 29 | One effect per effect step; the step is the idempotency unit | R3 F29, F30, F41, F43 | INFERENCE from source claims |
| 30 | Three-phase effect protocol with a typed `unknown_effect` | R3 F44; 02 §4; 05 §6 | SOURCE CLAIM + SPECIFICATION |
| 31 | Nothing a model wrote is authoritative until a non-model step accepts it | R1 F-10, F-11, F-13; 06 §4 | INFERENCE from source claims |
| 32 | One authority per field; delivery narrowed per step | R8 W-3; R1 F-06; D-03 preserved | INFERENCE, disagreement retained |
| 33 | Untrusted-channel records reach model steps but never effect steps unaided | R2 F-09, F-21 #1; 02 §4 | INFERENCE |
| 34 | Attributable identity as `(run, step, procedure version, grant, principal)` | R2 F-21 #4 | INFERENCE; the tuple's form is design |
| 35 | Declared grants resolved against the grant policy at procedure admission | R3 F60, F57 | SOURCE CLAIM applied |
| 36 | Every model step declares the validator whose failure would justify it | R3 F38, F39; W9 | INFERENCE |
| 37 | Procedure collapse after N runs with zero branch variation | R3 F39 | **DESIGN PROPOSAL**, direction evidenced |
| 38 | Deterministic eligibility filter before any catalog search | 05 §8; AG-06; R5-18 | SOURCE CLAIM |
| 39 | `founder-return/v1` selects by rule, including adverse samples | DIRECTIVE §1.6; 06 §6; X07 | FOUNDER CONSTRAINT; **dose UNKNOWN** |
| 40 | Re-entry brief is a deterministic projection with a validated narrative | R5-23; R7 M10 | INFERENCE |
| 41 | Account-setting observation for the metered path, with a journal entry on change | R8 W-5; X20 | FOUNDER CONSTRAINT, mechanised |
| 42 | Content-hash pinning of any instruction or description, re-checked at use | R3 F47, F48 | SOURCE CLAIM |

**DESIGN PROPOSAL choices with no evidence — six, named.**

1. **The five step kinds as an exhaustive set.** No source enumerates this partition. Its falsifier is one
   real work item that fits none of the five.
2. **The step sequence inside `unclassified-work/v1`** (bound → gather → packet → route). The *requirement*
   for a generic path is evidenced by five system classes [R5 §4]; this sequence is not.
3. **The sub-procedure depth ceiling's default value.** The requirement for a ceiling with a named owner is
   evidenced [D-10, §5 item 7]; the number is not, and two vendors ship opposite defaults.
4. **The founder-return sampling rule's shape and cadence.** The obligation is a founder constraint; the
   shape is mine, and **no founder-specific dose is validated anywhere** [X07].
5. **Which standing role receives an `unknown_effect` custodianship by default.** The requirement that it be
   named is evidenced; the assignment rule is not.
6. **The procedure-retirement window's length.** The retirement rule is evidenced [05 §8]; the window is not.

**Two things this candidate deliberately does not assert.** That M3 consumes less scarce capacity than B0 or
S1.0 — **UNKNOWN**, no absolute denominator exists and only ratios are computable [R8 W-6, MG-03]. That
independent verification is achieved — **it is not**, within one model family, for the self-consistent error
class, and M3 names the residual rather than laundering it [R7 F13, FAL-08].

**One measurement-integrity note about this artifact's own inputs.** No lane in this round registered a claim
through the ledger; seven of eight report the registration tool absent while the roster declares the grant.
**Not one quotation this candidate relies on has been machine-verified against its source by a resolver**
[cross-lane §H], so this candidate reproduces, in its own provenance, the declared-versus-delivered gap it
names as a design risk in §6.2.

---

*Candidate artifact. Nothing here is a decision, a selection, or an acceptance.*
