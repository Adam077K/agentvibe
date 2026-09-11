export const meta = {
  name: 'vision-round-1b',
  description: 'Re-run the three lanes that produced no artifact: worker-and-mind, engines, autopsy — this time on a write-capable engine.',
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
    bytes_written: { type: 'number' },
    headline: { type: 'string' },
    claims: {
      type: 'array', maxItems: 12,
      items: {
        type: 'object',
        required: ['claim', 'basis', 'confidence'],
        properties: {
          claim: { type: 'string' },
          basis: { type: 'string' },
          confidence: { type: 'string', enum: ['measured', 'sourced', 'reasoned', 'speculative'] },
        },
      },
    },
    refusals: { type: 'array', maxItems: 8, items: { type: 'string' } },
    unknowns: { type: 'array', maxItems: 8, items: { type: 'string' } },
    fields_covered: { type: 'array', items: { type: 'number' } },
  },
}

const WRITE_FIRST = (slug) => `
## WRITE THE FILE FIRST. THIS IS NOT OPTIONAL AND IT IS WHY THIS LANE IS RUNNING AGAIN.

An earlier run of this exact lane produced NO ARTIFACT. Do not repeat that.

1. FIRST, before any long research, create ${OUT}/${slug}.md with a heading and an outline.
   Confirm it exists (Read it back).
2. Then research, and APPEND to that file as you go — do not hold everything in your head to write
   at the end. A lane that runs out of room mid-thought must still leave its findings on disk.
3. The FILE is the deliverable. Long is good. The JSON return is only an index to it.
4. Your return MUST include the real byte count of the file you wrote (\`bytes_written\`). If that
   number is 0 you have failed the task regardless of how good your reasoning was.

Do not paste the file contents back in the return value. Commit nothing.
`

const SEALED = `
YOU ARE SEALED. Read ONLY ${FIELDS} from docs/03-system-design/final-v2/.

You MUST NOT read: FINAL-PLAN-v2.md, SPINE.md, parts/, rethink/, rethink-2/, review/, research/,
COVERAGE.md, DECISIONS.md, vision/, or final-v3/round-1/. Two earlier attempts were thrown away for
being written inside the frame of a design already chosen — a question phrased in an existing plan's
vocabulary can only find the gaps that plan anticipated. Your value is not knowing what was decided.

Reading the CODEBASE to learn what is technically possible is allowed. Reading it to learn what was
already designed is not.

LOOK OUTWARD, HARD. Use WebSearch and WebFetch. Real systems people shipped, real post-mortems, real
practitioner reports. Prefer a thing someone shipped and wrote up over a thing someone theorised.
Cite URLs. Mark speculation as speculative — ambition and honesty are not in tension.

THINK WITHOUT A CEILING. A conservative restatement of current practice is a failed lane.
`

const LANES = [
  {
    slug: 'worker-and-mind',
    label: 'worker',
    sealed: true,
    prompt: `Re-imagine THE WORKER: what an agent is, what roster exists, and how one thinks. Fields 3, 4, 5, 33, 39, 45.

What roles need to exist at all, and how would you know one is missing? Generalist or specialist?
What must never be done by the worker that did the other thing? How does a worker tell what it knows
from what it is assuming, and is its confidence actually related to being right? How does it notice
it is going in circles? How would it discover its whole APPROACH was wrong rather than its execution?
What does it do with something it could not determine? When should it ask rather than decide?

On instructions (33): what is actually written to steer behaviour; how long before an instruction
stops being read properly; how would you know one had quietly stopped being followed; when is the
right fix a better instruction and when is it a different mechanism entirely; what happens to
instructions as the models underneath them change.

On delegation (39) and handover (45): how deep before nobody can follow it; who is accountable —
the one who did it or the one who asked; how you stop delegation being used to avoid a hard
judgement; what must survive every handover no matter what; how a chain of steps avoids degrading
a little at each one.

Look outward: published agent architectures and their retrospectives, what practitioners report
about role proliferation and when a roster stops helping, prompt-as-code practice, and the actual
evidence on whether persona/role prompting changes measured outcomes. Be willing to conclude a
popular practice is cargo cult — but bring a source when you do.`,
  },
  {
    slug: 'engines',
    label: 'engines',
    sealed: true,
    prompt: `Re-imagine THE ENGINE LAYER: the model runtimes the work actually executes in. Fields 18, 17, 9, 20, 28.

Find out what is ACTUALLY TRUE, as of today, about the major agentic CLIs and harnesses — Claude
Code, OpenAI's Codex CLI, Gemini CLI, and any serious alternative you find. For each: what it is
architecturally, what it exposes (hooks, sub-agents, config, MCP, headless/exec modes, permissions
and sandboxing), what it costs and on what terms, what its limits are and when they reset, and what
practitioners report breaks. Do not assume; check, and cite.

Then reason: Is depending on a single supplier a risk worth taking, and what would moving cost? How
does the company know whether a substitute did as well? How would it notice that the same request
now produces a DIFFERENT QUALITY of answer than it used to — treat this as the hard measurement
problem it is. What are the terms of service, and do they permit this use?

On cost (20): the difference between money spent and capacity consumed; how much may be spent
without asking; what happens at the ceiling — stop, ask, or continue; and the cost of the OWNER'S
OWN TIME, which is the only genuinely fixed input and is usually uncounted.

Where a heterogeneous fleet genuinely buys something — real independence for review, cost arbitrage,
capability differences — say precisely what, and at what integration cost. Where it buys nothing but
complexity, say that instead.`,
  },
  {
    slug: 'autopsy',
    label: 'autopsy',
    sealed: false,
    prompt: `You are the UNSEALED lane. Read the existing planning corpus and diagnose WHY IT WENT WRONG.

The founder's verdict, verbatim: "all the other planning of the system were bad... at some point in
the process, the planning became something we didn't want. They focused on a specific area. They
lost the want and need to fix the other areas, to think big, to envision the whole new agentic type
of system."

Read widely across ${ROOT}/docs/03-system-design/final-v2/ — FINAL-PLAN-v2.md (12,344 lines; sample
intelligently, do not read every line), SPINE.md (1,630), parts/ (24 files), rethink/, rethink-2/,
review/, research/, vision/, COVERAGE.md, DECISIONS.md. Use git history too: \`git log\` over that
directory shows the ORDER things were written, which is evidence about when the narrowing happened.
Also read THE-VISION-AND-THE-FIELDS.md — the one artifact the founder considers good.

Produce a DIAGNOSIS, not a summary:
  - WHERE did the narrowing happen? Find the point where the work stopped being about the whole
    system and became about one area. Cite files, quote, and date it from git.
  - WHAT mechanism caused it? Test these against evidence rather than picking one: the plan got long
    enough that editing was cheaper than rethinking; review rounds optimise what exists rather than
    what is missing; a security/QA loop consumed the attention breadth needed; the harness became
    the subject instead of the instrument; each round inherited the previous round's vocabulary.
  - WHICH parts are genuinely worth keeping? Be specific and concrete. Discarding good work because
    its frame was wrong is its own failure mode.
  - WHAT must the next round structurally do differently? Mechanisms, not resolutions.

The strongest evidence available to you: THE-VISION-AND-THE-FIELDS.md states its own two
predecessors were rejected for being "written inside the frame of a design already chosen", and the
cure was sealed lanes. Test whether that cure was ever applied to the REST of the corpus, or only to
that one document. That test is close to the heart of the founder's complaint.`,
  },
]

const results = await parallel(
  LANES.map((lane) => () =>
    agent(
      `${lane.sealed ? SEALED : ''}\n\n${lane.prompt}\n\n${WRITE_FIRST(lane.slug)}`,
      { label: `lane:${lane.label}`, phase: 'Explore', agentType: 'builder', schema: SCHEMA },
    ).then((r) => ({ lane: lane.slug, ...r })).catch((e) => ({ lane: lane.slug, error: String(e) })),
  ),
)

return { out_dir: OUT, results }
