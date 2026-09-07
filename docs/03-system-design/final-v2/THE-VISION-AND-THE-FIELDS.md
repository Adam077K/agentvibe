# Keel — the vision, and every field the system has to have an answer for

*Written 2026-09-07 for the founder. Part one is the system stated whole, in plain language. Part two is
the field map: every domain the system must take a position on, with its sub-fields, so that nothing
important is missing merely because nobody named it. **The map is deliberately larger than the plan.**
A field with no answer yet is a field that has been found; a field nobody listed is a field that gets
discovered during an incident.*

---

## Part one · The system, stated whole

**Keel is a company that one person owns and almost never operates.** Not a person with better tools —
a person with a company. The founder supplies direction and taste; the system supplies everything
between an intention and a finished thing that a stranger paid for. It runs several ventures at once,
it keeps running while the founder sleeps or is away, and it hands back, each morning, a short account
of what it did, what it learned, what it spent, and the small number of questions that genuinely
needed a human. Its ambition is not to answer faster. It is to **hold direction over time** — to still
be pointed at the right thing in week nine, having been corrected in week three, without the founder
having to remember why.

**Four things are the system's own and everything else is a wrapper.** *Direction* — what this company
is for, whose intents bind, and what may never be done in its name. *Record* — an append-only account of
what happened, who decided it, what it cost, and what was believed at the time. *Truth* — a discipline
that separates what was measured from what was asserted, and refuses to let the second wear the clothes
of the first. *Taste* — the judgement that a thing is good enough to put a name on. Everything else the
system does today, the vendors will eventually ship: better models, better tool-calling, better
sandboxes, better browsers. Those are rented. The four above are the keel, which is why they are built
rather than bought, and why every mechanism the system owns is marked with which of the two it is.

**It is a team, not a pipeline.** Agents hold roles with real boundaries: one that produces cannot be
the one that judges; one that judges cannot edit what it judged; the thing being gated cannot invoke its
own gate. They hand work to each other on a written form, they may object, they escalate rather than
guess, they are asked to say what they could *not* determine, and they carry an expiry date so the
roster can shrink as well as grow. Their disagreements are evidence and get recorded rather than
resolved by whoever spoke last.

**It runs itself, and improves itself, inside a boundary the founder sets.** It takes a standing
intention and moves it without being driven. It works at night on this machine and on hosted lanes when
the machine is off. It reads its own transcripts, notices where it wasted the founder's attention or its
own budget, and proposes changes to its own rules — which the founder ratifies or refuses, and which are
then reopenable by name rather than argued again from scratch. It widens its own permissions only by
earning them: a ladder, where each rung is unlocked by a run of clean results and revoked by one bad
one. It knows what it costs, against a window rather than a fiction, and it stops rather than overrun.

**The scarcest input is the founder's attention, and the whole design is organised around spending it
well.** A question reaches them only when it turns on their money, their machine, their hours, their
business, or their appetite for risk. Everything else is decided from rules already written down, and
recorded so it can be reopened by name. What reaches them is shaped to be read: the answer first, the
numbers and the warnings intact, and short enough that a tired person at the end of a day still takes it
in. The system's success condition is not throughput. It is that **the founder can be absent, return,
and still be in charge.**

---

## Part two · The field map

**How to read this.** Each numbered field is a domain the system must take a position on. Under it are
the sub-fields — the specific questions inside it that need a decision, a mechanism, or an explicit
refusal. **An honest "refused, and here is why" is a complete answer.** A silence is not.

---

### 1 · Direction and intent — what the company is trying to do

Mission and its statement form · the charter as a thing every run reads · goal and sub-goal structure ·
intent versus candidate work · standing intents and their cadence · one-off intents and their expiry ·
done-tests written before work starts · binding versus proposed goals · who may author an intent · the
read-back that makes an intent binding · intent ownership · priority and ranking · the ranking's tie-break ·
goal conflict resolution · dependencies and readiness · opportunity detection · unsolicited work policy ·
the parking lot · abandonment and stop criteria · sunk-cost exclusion · pivot triggers · wrong-goal
detection · blocked and stalled states · what clears a block · intent decay · the north-star question
and whether to refuse it · scope boundaries and out-of-scope recording · reversibility of a direction
change · what a venture may never do in the company's name

### 2 · Work and tasks — how an intention becomes moves

The work item and its fields · decomposition into moves · the unit of a single run · move-level
outcomes · task states and their transitions · queueing and the work store · WIP limits · batching ·
task dependencies and ordering · retry ladders and the re-attempt ceiling · same-failure detection ·
idempotency and replay · partial completion · handoff at the boundary of a run · task expiry ·
cancellation mid-flight · the cord that stops a running child · what a stop leaves behind ·
resumability · checkpointing · the definition of done, per class of work · acceptance evidence ·
rework and its cost · task provenance — which intent, which decision, which agent

### 3 · Agents and the roster — who does the work

The agent file and its schema · role definition and boundaries · the count and why it is that count ·
which roles exist on day one versus later waves · specialisation versus generality · the producing /
judging separation · read-only roles and why they carry no write tool · shims and name-squatting ·
agent creation — who may add one · agent expiry and forced disposition · retirement, merge, refresh ·
trust levels and probation · the widening ladder and its rungs · demotion on a bad result · agent
capability declarations · tool grants per agent · model assignment per agent · fallback chains when a
family is unreachable · concurrency per agent · cost caps per agent · the curator · the challenger ·
the operator and how many of them · cold-start routability · how an agent becomes discoverable ·
agent-to-agent trust · what an agent may never delegate

### 4 · Agent cognition — how a single agent thinks

Reasoning depth and when to spend it · planning before acting · the read-before-write discipline ·
hypothesis and falsification · self-correction and when to stop correcting · uncertainty expression ·
saying what could not be determined · confidence calibration · overconfidence detection · the
distinction between measured and asserted · asking versus assuming · escalation criteria · the stopping
rule · loop detection and breaking · context contamination on retry · clean-restart versus contaminated
retry · attention to instructions versus drift · instruction conflict resolution · prompt structure and
what belongs where · reasoning traces and whether to keep them · thinking budgets · the difference
between a probe that measures the mechanism and one that measures the model · adversarial self-review ·
knowing which questions are above its pay grade

### 5 · Orchestration and dispatch — how work reaches an agent

The dispatch decision · brief construction and what a brief must carry · dispatch by reference versus by
value · the payload size boundary · fan-out width · depth and nesting limits · sequential versus
parallel · the swarm shape for large work · one writer per artifact · file-level conflict avoidance ·
lane sealing and independence · convergence as signal · the return schema · return validation ·
what counts as delivery of a message to a running lane · waking an idle lane · double-writer detection ·
work stealing and rebalancing · the orchestrator's own defect surface — summary compression · dispatch
cost accounting · which engine has which tool, checked against the deliverable · timeouts and what a
timeout means · orphan and zombie cleanup

### 6 · Memory and context — what is remembered and what is carried

Working context versus durable memory · the context window as a budget · what is loaded at session
start · payload size against the runtime's own limit · two-tier discovery — index then detail · what is
never preloaded · compaction and when it fires · what compaction costs · cache loss after compaction ·
context contamination · session boundaries · resumption and what survives it · cross-session facts ·
the long-term memory file and its caps · decision memory, append-only · archive rotation and eviction ·
eviction rules and what is pinned · stub-on-archive so citations still resolve · per-project versus
global memory · user preferences and how they are learned · customer language and pain phrases · the
codebase map · what is regenerated versus hand-written · memory write authority — who may write what ·
memory conflict and precedence · staleness detection · the difference between a fact and a fact that was
true when written · forgetting as a deliberate act · what a night child receives, and what binds it

### 7 · Knowledge and learning — what the company knows

The knowledge store and its shape · sources and their provenance · access dates on everything ·
research questions as first-class objects · open versus answered versus refused · re-specification when
a question was malformed · the negatives store — what was tried and did not work, and why · handovers as
knowledge · mining transcripts for what was learned · what makes a lesson durable enough to write down ·
the difference between a lesson and an anecdote · knowledge decay and expiry · contradiction detection
across documents · reconciling two sources that disagree · absence of evidence versus evidence of
absence · the unread window problem · citation and whether it resolves · dead-path detection · knowledge
that only exists in one agent's head · onboarding a new agent into what is known

### 8 · Skills and capability — what the system can do

The skill as a unit · skill authoring · skill discovery and its cost · the router pattern · selection
accuracy as the library grows · the measured degradation threshold · curation and what gets cut · the
record of every cut and the test that made it · drift between the directory and the decision ·
vendoring versus referencing · licence obligations on imported bodies · derivative work and attribution ·
skill activation events and whether the runtime emits one · skill effectiveness measurement · dead
skills · overlapping skills competing for selection · per-agent skill budgets · skills versus playbooks
versus prompts — which layer owns what

### 9 · Tools and hands — how the system touches things

The tool inventory · tool granting per agent · capability declarations that must be backed by real
configuration · tools that exist versus tools that are named · the MCP server boundary · project-scope
versus user-scope servers · which servers hold credentials · policy over servers and what it governs ·
shadow versus blocking enforcement · tool call auditing · tool failure and its signature · distinguishing
a tool that refused from a tool that failed · rate limits per tool · tool cost · tool latency budgets ·
browser automation and its risks · file system access · shell access and who has it · network access ·
the local model tier and whether it can be a service · new tool admission — who decides

### 10 · The world's door — what comes in

Inbound sources and their inventory · polling versus listening · cursor-based reads · change feeds and
their completeness guarantees · retention windows on each source · sources that need a public endpoint ·
webhook relay when no endpoint exists · deduplication · ordering · the wake decision — what is worth
waking for · triage and classification of inbound · attacker-influenceable text · quarantine of fetched
content · the taint that travels with untrusted text · separating the run that reads from the run that
acts · prompt injection through tool output · what the system does with an instruction it finds in data ·
inbound rate and burst handling · source authentication · source failure and silent stopping

### 11 · Outbound and the world — what goes out

The Sender and what it gates · staged versus sent · the tap and who releases it · outward classes and
their ladder · the first stranger · what may be sent unattended · approval before send · content review
before send · voice and whether it sounds like the company · irreversibility of a send · retraction ·
publishing and its permanence · rate limits on outbound · identity — whose name is on it · disclosure
that a machine wrote it · outbound in a venture's name versus the company's · the record of what was
sent · bounce and failure handling

### 12 · Communication and handover — between agents, and to the founder

The handover form and its required fields · handover as the unit of transfer · objections and how they
travel · asks with a deadline and a stated fallback · what happens when nobody answers · peer-to-peer
messaging and its transport · message provenance · lost-update surfaces · the difference between a
message sent and a message delivered · escalation paths · the briefing and what it must contain · the
bell — when to interrupt a human · what may never be written by a model · the wake message · status
without noise · the shape of anything a human reads · answer-first discipline · protecting numbers and
warnings from compression · what a control that refuses silently teaches — nothing

### 13 · Truth and evidence — how a claim comes to be believed

The claim as a first-class object · claim kinds · scope — global, project, local · what verifies a
claim · deterministic checks versus judgement · the evidence ladder and its rungs · what the bottom rung
means — proves nothing · anchors and what an anchor is · anchor rungs · resolvers and their contract ·
a resolver never passing what it could not check · unresolved as distinct from pass and from fail ·
expiry on every durable claim · forced disposition at expiry — refresh, deprecate, waive · waivers and
their deadlines · a lapsed waiver failing harder than none · shadow mode and measuring friction before
enforcing · which failures block from day one · the judge panel · model-family independence · why a
single-family panel is not a panel · claim citations in prose and whether they resolve · declared debt
and its ratchet · fabrication detection · the difference between a cell and a check

### 14 · Quality and review — how work is judged

Review as an out-of-band act · the reviewer who cannot edit · review lenses and what each judges ·
lens selection per change · risk tiering · what raises a tier · the gate and what it blocks · who may
override a gate — nobody · the verdict and its binding to a specific diff · hash-binding versus signing ·
forgeability of a verdict · multi-judge panels · two-of-three · the second opinion and where it comes
from · adversarial review · what a review of a review finds · sealed review and independence ·
convergence across postures as signal · false positives and the cost of over-blocking · a control people
route around · test quality — a test that passes while asserting nothing · mutation and whether the test
would notice · negative controls · pinning a known bug rather than leaving it prose

### 15 · Control and safety — what stops a bad thing

The threat model, written down · accident versus injection versus insider · blast radius per act ·
what one unattended run can destroy · reversibility as the permission axis · one-way versus two-way
doors · the may-alone decision and what makes it at runtime · deterministic guards versus model
judgement · which controls exist when no human is watching · hooks and where they are registered ·
which settings tier survives which invocation · enumerating dangerous forms versus allowing one safe
region · the guard that documents its own defects · ceilings and what they are denominated in · the
cord · what a stop needs to work · kill and cleanup · quiescence · the dead-man's switch · drills and
rehearsals · the failure nobody has rehearsed · defence in depth versus a single point · a control
whose failure is silent

### 16 · Permissions and identity — who may do what

The permission model and its axis · permission modes · allow lists and deny lists · which verb widens
and which narrows · scope of each setting — project, user, managed · which tier a child inherits ·
per-run permission carriers · the settings file the dispatcher owns · never accepting a settings file as
a parameter · credential storage · credential scope — dedicated and revocable versus the founder's own ·
keychain and its lock policy · what fails fast versus what hangs · secrets in environment versus files ·
egress credential injection · what the proxy sees · identity of the actor · attribution of an action ·
impersonation and what is forbidden · terms of service as a constraint · first-party versus third-party
boundaries · what may never be modified

### 17 · Runtime and execution — where and how it runs

The machine and its capacity · concurrency ceilings · the instrument that detects the crossing · memory
per child · swap as the real signal · process trees and which one a control governs · the sandbox and
what it actually covers · nested execution · what a child inherits · what a child loses · headless
invocation · TTY and its absence · detached execution and its known failures · exit codes and their
meanings · silent failure — exit zero with no output · distinguishing two failures that look identical ·
worktrees and isolation · protected paths · escalation for a single command · the launcher and what it
records · process groups and signalling · logs and where they go · the sensor the controller lacks

### 18 · Models and providers — which minds do the work

Model selection per task class · cost per tier · escalation to a stronger model and when · downgrade to
a cheaper one · effort levels · model identifiers and their churn · a retired identifier failing a lint ·
provider inventory · provider reachability · what is documented versus what is inferred · vendor pages
that contradict each other · vendor pages that contradict measurement · second-family routing · why a
second family matters · rung demotion on a cross-family reroute · the calibration set that is never
edited · drift detection · a family limit as a company-wide stop · provider outage drills · terms per
provider · automated access clauses · what a subscription permits · usage windows and their reset ·
which limit actually binds

### 19 · Scheduling and the night — when work happens

The watch and its tick · what wakes it · sleep and the machine's real off-hours · measuring spans
rather than episodes · a metric that cannot return the wrong answer · catch-up after a missed run ·
coalescing versus running every miss · schedulers available and their floors · cloud lanes and what they
may do · hosted output landing as a proposal rather than into the house · reconciliation on wake ·
night capability as a computed predicate · refusing to start a night that cannot finish · the bounded
day versus the open night · time zones and fixed resets · what is schedulable because its reset is fixed

### 20 · Cost and economics — what it spends and what it earns

The budget and its denomination · a window gauge against an observed high-water mark · wall clock beside
it · a shadow dollar price and what it is not · the bill nobody sends · per-intent ceilings · per-venture
ceilings · why per-venture ceilings do not compose · the reserve · exploration versus driven work ·
which seat exploration runs on · idle capacity and what it buys · cost per finished intent · cost per
founder-minute · unit economics of a venture · pricing · make versus buy · vendor spend caps and which
providers expose one · balance reads · spend alerts · what happens at the ceiling · overage policy ·
the cost of a control, measured in work refused

### 21 · Surfaces and interfaces — how the founder sees and steers

The pages and their order · the phone as the primary surface · the briefing page · the scoreboard · the
floor — where the founder works alongside · mission control · the portfolio view · the child-flow view ·
what renders live versus what is a record · notification policy · what may interrupt · what waits for
morning · the read-back before a binding act · the which — a decision put to the founder · the shape of
a which · batching decisions into one round · the founder's measured throughput · rejection rate as a
signal about relevance, not throughput · voice input · voice output · accessibility · what a surface
must never claim

### 22 · The founder boundary — attention, decisions, authority

Which questions only the founder can answer · money, machine, hours, business, risk · everything else
decided and recorded, reopenable by name · founder hours as a budgeted input · the decision budget per
window · originated versus ratified decisions · what may never be re-litigated · how an overrule is
recorded · how a withdrawn disposition is marked so it cannot resurface · the founder as the only
approver of irreversible acts · away mode · the burst edge · what happens when the founder is
unreachable · succession and continuity · the founder's own transcripts as training material · consent
for that · the difference between direction and micromanagement

### 23 · Self-improvement — how the system gets better

The improvement loop · noticing a defect in its own operation · proposing a rule change · who ratifies ·
the record of what changed and why · harness self-edit as an irreversible act · the eval loop · a
frozen calibration set · rehearsals · measuring whether a change helped · regression detection ·
learning from a failed run versus a successful one · the curator's nightly pass · knowledge proposals
with no writer · retiring what is no longer used · the plan's own text expiring · counting the rows that
change after the first real run · what would falsify the whole design

### 24 · Ventures and the portfolio — many companies at once

The venture as an object · venture charter · what crosses ventures and what must not · shared taste ·
shared knowledge versus isolated beliefs · cross-venture resource contention · ranking across ventures ·
venture lifecycle — start, run, park, kill · the kill criteria · a venture's own done-tests · the first
stranger per venture · venture-level permissions · a venture saying no to a capability · reporting per
venture · the portfolio view · what the founder owns versus what a venture owns

### 25 · Departments and domains — the business functions

Product — specs, prioritisation, acceptance criteria · design — the system, the render, the critique ·
engineering — decomposition, review, merge discipline · data and analytics — metrics, events, dashboards ·
marketing and content — voice, campaigns, calendar · sales and growth — funnel, outreach, conversion ·
customer service — support, onboarding, retention, churn diagnosis · finance — bookkeeping, forecasting,
runway · legal — contracts, terms, IP, disclosure · research — market, competitive, sourced enquiry ·
operations — vendors, subscriptions, renewals · each department's lens, and why a lens is not an agent

### 26 · Data and privacy — what is held and about whom

Data inventory · personal data and where it lives · customer data isolation · retention policy ·
deletion and whether it is real · transcripts and what they contain · mining transcripts and consent ·
anonymisation · data in prompts · data leaving the machine · third-party processors · residency ·
encryption at rest and in transit · access logging · the right to be forgotten · what the system may
learn about the founder · what it may learn about a customer · what it may never store

### 27 · Legal and compliance — the outside constraints

Terms of service per vendor · automated access clauses · subscription versus API boundaries ·
first-party versus third-party use · what constitutes reselling · licences on imported material ·
copyleft and its reach · attribution obligations · derivative works · undeclared upstream licences ·
disclosure that a machine authored something · advertising and claims substantiation · contracts and who
may sign · liability · insurance · regulatory triggers by jurisdiction · the acts only a human may
perform · when to ask a lawyer rather than an agent

### 28 · Deployment and operations — getting things live

Environments · configuration and its tiers · secrets management · build and release · CI and what blocks ·
the deterministic floor versus the judged layer · rollback · migrations and their irreversibility ·
feature flags · monitoring · alerting and who is woken · on-call when there is one person · incident
response · post-incident record · uptime expectations for a one-person company · backups · restore,
tested · disaster recovery · what happens if the machine dies

### 29 · Growth and external communications — how the company is seen

Positioning · the audience and its language · landing pages · content and its cadence · SEO and
generative-engine visibility · social presence · community · the launch · outreach and its ladder ·
first contact with a stranger · reputation · what a mistake in public costs · the voice guide · what the
company will not say · measurement of growth versus vanity

### 30 · Culture, onboarding and the record — how the company holds itself

What the company values and how that shows in a decision · onboarding a new agent · onboarding a human
collaborator · the handoff document and what it must carry · read-order for a newcomer · what a
newcomer must not re-litigate · session records and their caps · decision logs · the archive · naming
and identity per session · provenance on every artifact · strike-don't-delete as a discipline · why the
wrong reading is kept beside the right one · the honest caveat that travels with every summary

### 31 · Failure, recovery and continuity — when it goes wrong

Failure taxonomy · silent failure and how it is detected · a control that is green while checking
nothing · a metric that cannot return the wrong answer · false regressions from location · flaky versus
deterministic · the retry that contaminates · partial work and how it is recovered · a lane killed
mid-write · concurrent writers on one artifact · snapshotting before overwrite · what is lost when a
session ends · resumption fidelity · the corrupted record · reconciling two accounts of one event ·
graceful degradation · what the system does when it cannot tell whether it succeeded

### 32 · Measurement and instruments — knowing what is actually true

What is measured versus what is assumed · the instrument for each claim · an instrument that cannot
detect the crossing · choosing the unit before the measurement · a positive control on every negative
result · attribution by verbatim signature rather than by an action having failed · a probe that names
what it tests · baseline drift · stating a delta rather than an absolute when the baseline moves ·
sample size and replication · one run is not a result · the measurement that falsifies its own premise ·
figures in prose versus commands · re-derivation over recall · who checks the checker
