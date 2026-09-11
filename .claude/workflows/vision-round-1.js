export const meta = {
  name: 'vision-round-1',
  description: 'Nine lanes re-imagine the agentic company from the 53-field map: eight sealed from the existing plan, one autopsying why it narrowed.',
  phases: [{ title: 'Explore' }],
}

const ROOT = '/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-1-1788609834'
const OUT = `${ROOT}/docs/03-system-design/final-v3/round-1`
const FIELDS = `${ROOT}/docs/03-system-design/final-v2/THE-VISION-AND-THE-FIELDS.md`

const SCHEMA = {
  type: 'object',
  required: ['file', 'headline', 'claims', 'refusals', 'unknowns'],
  properties: {
    file: { type: 'string' },
    headline: { type: 'string', description: 'One sentence: the most important thing this lane found.' },
    claims: {
      type: 'array', maxItems: 12,
      items: {
        type: 'object',
        required: ['claim', 'basis', 'confidence'],
        properties: {
          claim: { type: 'string' },
          basis: { type: 'string', description: 'A URL, a product actually examined, a measurement, or "reasoned" — say which.' },
          confidence: { type: 'string', enum: ['measured', 'sourced', 'reasoned', 'speculative'] },
        },
      },
    },
    refusals: { type: 'array', maxItems: 8, items: { type: 'string' }, description: 'Things this lane says the system should NOT do, and why.' },
    unknowns: { type: 'array', maxItems: 8, items: { type: 'string' }, description: 'What it could not determine. A silence is not an answer.' },
    fields_covered: { type: 'array', items: { type: 'number' } },
  },
}

const SEALED = `
YOU ARE SEALED. Read ONLY these, and nothing else under docs/03-system-design/final-v2/:
  - ${FIELDS}   (the ambition, and 53 fields of plain questions)

You MUST NOT read: FINAL-PLAN-v2.md, SPINE.md, parts/, rethink/, rethink-2/, review/, research/,
COVERAGE.md, DECISIONS.md, or vision/. You must not read the repo's CLAUDE.md or AGENTS.md as a
source of design. Two earlier attempts at this were thrown away for being written inside the frame
of a design already chosen — a question phrased in the vocabulary of an existing plan can only find
the gaps that plan anticipated. Your value is that you do not know what was already decided.

Reading the current codebase to learn WHAT IS TECHNICALLY POSSIBLE is allowed and encouraged.
Reading it to learn WHAT WAS ALREADY DESIGNED is what you must not do. If you find yourself about to
adopt a structure because it exists, stop and re-derive it from the questions instead.

LOOK OUTWARD. The founder's explicit instruction is to learn from what other people have actually
built. Use WebSearch and WebFetch hard: real multi-agent systems, real agent harnesses, published
post-mortems, how actual companies run the function you are reasoning about, what practitioners say
breaks. Prefer a thing someone shipped and wrote up over a thing someone theorised. Cite URLs.

THINK WITHOUT A CEILING. The founder's words: think big, no limits, envision something never seen
before, include things nobody has thought of. A conservative restatement of current practice is a
failed lane. But mark speculation AS speculative — ambition and honesty are not in tension here.
`

const OUTPUT = (slug) => `
WRITE YOUR FILE to ${OUT}/${slug}.md — create the directory if needed. Long is fine; this is the
artifact. Structure it however the material wants. It must contain: what you found outward (with
URLs), what you would build and why, what you would refuse, where you disagree with the obvious
answer, and what you could not determine. Do NOT paste the file back in your return value — return
the compact JSON only. Commit nothing; leave the file on disk.
`

const LANES = [
  {
    slug: 'surfaces',
    label: 'surfaces',
    prompt: `Re-imagine THE SURFACES a person uses to run a company they do not watch. Fields 21, 22, 12, 46, 24, 42.

The founder wants these reconsidered from nothing, explicitly refusing to inherit what exists:
  - The VIBE CODING surface — today a tmux/terminal "war room" of CEO panes. Should it be a terminal
    at all? What is the right shape for directing many workers while code is being written?
  - MISSION CONTROL — a web surface. The founder names: a canvas to add/remove/edit agents and see
    what they are doing; a playful pixel-art "company" view; tickets and tasks draggable on a
    timeline; goals you set that the system then works toward on its own like a whole team.
  - What surface does NOT exist yet that should? Phone? Ambient? Voice? Something with no precedent?

Hard questions to answer, not dodge: what does the owner see in the first 30 seconds of a morning?
What is live versus a record? How does a surface avoid claiming more certainty than exists? How does
it stop the owner becoming a rubber stamp — and how does it HAND WORK BACK to keep them competent?
What is visible from a phone, standing up? How does someone catch up after a week away?

Look at what real people have built: agent observability UIs, orchestration dashboards, ops consoles,
RTS and factory-game interfaces (they solved "many autonomous units, one commander" decades ago),
air-traffic and NOC displays, Figma/Miro-style canvases. Steal from outside software where better.`,
  },
  {
    slug: 'worker-and-mind',
    label: 'worker',
    prompt: `Re-imagine THE WORKER: what an agent is, what roster exists, and how one thinks. Fields 3, 4, 5, 33, 39, 45.

Questions that must get real answers: What roles need to exist at all, and how would you know one is
missing? Generalist or specialist? What must never be done by the worker that did the other thing?
How does a worker tell what it knows from what it is assuming, and is its confidence related to being
right? How does it notice it is going in circles? How would it discover its whole APPROACH was wrong
rather than its execution? What does it do with something it could not determine?

On instructions (field 33): what is actually written to steer behaviour, how long before an
instruction stops being read, how would you know one had quietly stopped being followed, and when is
the right fix a better instruction versus a different mechanism entirely?

On delegation (39) and handover (45): how deep before nobody can follow it; what must survive every
handover no matter what; how a chain of steps avoids degrading a little at each one.

Look outward at real practice: published agent architectures, how people actually structure roles,
what practitioners report about role proliferation, prompt-as-code practices, and the evidence on
whether persona/role prompting does anything measurable. Be willing to conclude that a popular
practice is cargo cult — say so with a source.`,
  },
  {
    slug: 'memory-and-context',
    label: 'memory',
    prompt: `Re-imagine MEMORY, KNOWLEDGE and CONTEXT ENGINEERING. Fields 6, 7, 44, 13 (partly), 48.

The founder named "memory" and "context engineering" explicitly as things to rethink from scratch.

Answer: What must a worker know before it can start, and where does it get it? What is worth
remembering beyond one piece of work? How does the company remember a DECISION as opposed to a fact?
What should be forgotten on purpose? How do you tell something still true from something that was
true when written? What happens when the record contradicts itself? How does memory stay small enough
to be useful? What does a worker lose when it starts fresh, and does that matter?

On grounding (44): when to look something up versus rely on what it knows; how an answer shows where
it came from; what stops a plausible answer with no source; how looked-up material is kept APART from
instruction (this is a security question as much as a quality one).

On reproducibility (48): what minimum must be captured for an answer to be defensible later.

Look outward: real retrieval architectures and their failure reports, published work on context rot
and long-context degradation, what practitioners found about memory systems that seemed to work and
did not, knowledge-graph attempts and why they stall, and how human organisations actually retain
knowledge (they mostly fail at it — study how).`,
  },
  {
    slug: 'capability',
    label: 'capability',
    prompt: `Re-imagine CAPABILITY: skills, connections, tool use, workflows, stages. Fields 8, 34, 35, 36, 37, 38.

The founder named skills, MCP, tools and workflows as things to rethink completely.

Answer: What is the unit of reusable know-how, and what is inside one? When is something worth
writing down as reusable rather than doing once? How does a worker FIND the right one at the moment
it needs it without reading everything — and what does looking cost as the collection grows? At what
size does having more start making selection WORSE? How do you tell an unused one from an unnecessary
one? How would you know one is being loaded and then not actually followed?

On connections (35): what connecting an outside service actually exposes — read, write, spend, or act
as you; whether a connected service can influence behaviour through what it RETURNS; what should
never be connected.

On workflows (37) and stages (38): which work should follow a fixed sequence and which is figured out
as it goes, who decides which, what a fixed path does with the case it did not anticipate, and how
much ceremony is worth it for small work.

Look outward: the MCP ecosystem as it actually is (including its security literature and known
attack classes), tool-selection degradation as tool counts rise, skill/plugin systems in real
harnesses, and how workflow engines handle partial failure and resumption.`,
  },
  {
    slug: 'truth-and-quality',
    label: 'truth',
    prompt: `Re-imagine TRUTH, REVIEW and SELF-KNOWLEDGE — the part the ambition calls the binding constraint. Fields 13, 14, 32, 40, 41, 43, 49, 50.

Part one of the vision argues the durable product is "a truthful account of work you did not watch",
whose value lives in its NEGATIVE SPACE — what was skipped, what is stale, what was assumed, what it
could not determine, what it chose not to tell you and why. Take that seriously and design it.

Answer: What separates something measured from something it was told, and told from inferred? How
does a belief expire, and what happens when it comes due and nobody re-checked? How would the company
discover it had been wrong about something for a LONG TIME? How does it record that it does not know?

On review (14, 49): should the thing that made it judge it; what makes two reviews genuinely
independent; is agreement between two similar sources evidence or only correlation; how do you keep a
checker from drifting into agreeing by default; how do you test that the tests would notice a problem.

On guardrails (43): what fails open versus closed, and how would you know a check has stopped
checking while still passing.

On evaluation (40): what good looks like for work with no single right answer; how to avoid improving
the score without improving the thing.

On field 50: what stops the system calcifying, and what stops the opposite.

Look outward: LLM-as-judge and its measured failure modes, self-consistency and sycophancy research,
eval practice that survived contact with production, and how audit and assurance professions handle
exactly this problem (they have centuries on it).`,
  },
  {
    slug: 'engines',
    label: 'engines',
    prompt: `Re-imagine THE ENGINE LAYER: the actual model runtimes the work executes in. Fields 18, 17, 9, 20, 28.

The founder explicitly wants to understand how such systems work with Claude Code, Codex, and Gemini
CLI, and to think about cost and efficiency without inheriting prior conclusions.

Go find out what is actually true, as of now, about each of the major agentic CLIs and harnesses:
what each one IS architecturally, what it exposes (hooks, sub-agents, config, MCP, headless/exec
modes, permissions/sandboxing), what it costs and on what terms, what its limits are and when they
reset, and what practitioners report breaks. Do not assume; check.

Then reason: Is depending on one supplier a risk worth taking, and what would it take to move? How
does the company know whether a substitute did as well? How does it notice the same request now
produces a DIFFERENT QUALITY of answer than it used to — this is a hard measurement problem, treat it
as one. What are the terms of what is being used, and do they permit this use?

On cost (20): what is the difference between money spent and capacity consumed; how much may be
spent without asking; what happens at the ceiling — stop, ask, or continue; what is the cost of the
OWNER'S OWN TIME and is it counted.

Where a heterogeneous fleet genuinely buys something — real independence for review, cost arbitrage,
capability differences — say precisely what and at what integration cost.`,
  },
  {
    slug: 'company-operations',
    label: 'operations',
    prompt: `Re-imagine THE COMPANY ITSELF: how real organisations run, and what automating every department actually means. Fields 1, 2, 19, 23, 24, 25, 27, 29, 53, and Part three §3.3.

The founder's ask: understand how companies actually run the teams and the people they use to run
them, then work out how to automate all the departments.

So go and study the real thing, not a caricature: how sales, support, finance, legal, marketing,
recruiting, and operations actually function day to day in small companies; what the handoffs are;
where the tacit knowledge lives; which parts are genuinely judgement and which are form-filling. Use
sources — practitioner accounts, ops playbooks, published org handbooks (several companies publish
theirs openly). Then say what survives automation, what does not, and what changes SHAPE entirely
rather than being automated or not.

Answer from the fields: How does something large become something a worker can start? What is the
smallest useful unit of work? How does work carry its purpose with it? What decides that NOW is the
time to do something? What should the system do when there is nothing that needs doing?

Field 53 is concrete and unglamorous — what it takes for an effort to legally exist and take money.
Part three §3.3 names STAGE as the axis nobody lists, and singles out WINDING DOWN as the capability
that makes a many-cheap-attempts strategy affordable. Design that. Nobody builds it until too late.`,
  },
  {
    slug: 'consequences',
    label: 'consequences',
    prompt: `Re-imagine what this DOES TO THE WORLD AND TO THE OWNER — the sectors of consequence. Part three §3.2, plus fields 15, 16, 26, 27, 30, 31, 51.

This lane is the one that is allowed to say the ambition is wrong in places. Do not be polite.

The owner: competence decaying without contact, attention as the only fixed input, the residue of
unpleasant escalated decisions, isolation, identity as builder versus judge, burnout with no usual
warning signs. The vision claims there is NO SIGNAL for competence decay from inside, because the
owner is the instrument and the instrument is what drifted. Design the mechanism that catches it
anyway, or argue convincingly that none can exist.

Liability and standing: who is liable for what the machine says; what "reasonable diligence" means
when nobody watched; whether insurance responds; disclosure obligations. Find actual cases and actual
regulation — this is a research task with real sources, not an opinion.

Security (15, 16): the system acting on text an attacker wrote; credentials in an unattended process;
what ONE compromised run can reach; an adversary who learns how it decides.

Trust (30): how a customer feels on learning how the work was done; what disclosure costs and what
concealment costs more; the first public mistake.

Outward effects: what happens to a market when many participants run this way; displacement of the
exact work this replaces; verification as a public good solved privately while worsening publicly.

Name the things the ambition has not thought of. That is the point of this lane.`,
  },
]

const AUTOPSY = {
  slug: 'autopsy',
  label: 'autopsy',
  prompt: `You are the ONE UNSEALED LANE. Your job is the opposite of the others: read the existing
planning corpus and work out WHY IT WENT WRONG, so the next round does not repeat it.

The founder's verdict, in their words: "all the other planning of the system were bad... at some
point in the process, the planning became something we didn't want. They focused on a specific area.
They lost the want and need to fix the other areas, to think big, to envision the whole new agentic
type of system."

Read widely across ${ROOT}/docs/03-system-design/final-v2/ — FINAL-PLAN-v2.md (12,344 lines; sample
it intelligently rather than reading every line), SPINE.md, parts/, rethink/, rethink-2/, review/,
research/, vision/, COVERAGE.md, DECISIONS.md. Also read THE-VISION-AND-THE-FIELDS.md, which is the
one artifact the founder considers good.

Produce a diagnosis, not a summary. Specifically:
  - WHERE did the narrowing happen? Find the point where the work stopped being about the whole
    system and became about one area. Cite files and quote.
  - WHAT mechanism caused it? Candidates worth testing against the evidence: the plan became long
    enough that editing it was cheaper than rethinking; review rounds optimise what exists rather
    than what is missing; a security/QA loop consumed attention that breadth needed; the harness
    became the subject instead of the instrument. Find which actually happened.
  - WHICH parts are genuinely worth keeping? Be concrete and specific. Discarding good work because
    the frame was wrong is its own failure mode.
  - WHAT must the next round structurally do differently so this does not recur? Not resolutions —
    mechanisms.

Note the strongest evidence available to you: THE-VISION-AND-THE-FIELDS.md says its own two
predecessors were rejected for being "written inside the frame of a design already chosen", and the
cure was sealed lanes. Test whether that cure was actually applied to the rest of the corpus, or only
to that one document.`,
}

const all = [...LANES, AUTOPSY]

const results = await parallel(
  all.map((lane) => () =>
    agent(
      `${lane.slug === 'autopsy' ? '' : SEALED}\n\n${lane.prompt}\n\n${OUTPUT(lane.slug)}`,
      {
        label: `lane:${lane.label}`,
        phase: 'Explore',
        // A LITERAL, and `builder` for every lane including the sealed ones. This read
        // `lane.slug === 'autopsy' ? 'builder' : 'sourcer'` on the run of 2026-09-11 and cost the
        // round most of its artifacts: `sourcer` carries [Read, Glob, Grep, WebSearch, WebFetch]
        // and NO Write, by design, so seven sealed lanes researched for real and could not author
        // the file they were asked for. Their findings survived only because the JSON return was
        // salvageable from the workflow journal. A research lane that must write a file needs a
        // write-capable engine; sealing is enforced by the prompt, not by removing the tool.
        agentType: 'builder',
        schema: SCHEMA,
      },
    ).then((r) => ({ lane: lane.slug, ...r })).catch((e) => ({ lane: lane.slug, error: String(e) })),
  ),
)

return {
  out_dir: OUT,
  lanes: results.length,
  sealed: LANES.length,
  results,
}
