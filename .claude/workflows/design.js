export const meta = {
  name: 'design',
  description: 'Agentvibe T5 design workflow — generates N independent design variations from different angles, scores each with parallel read-only judges against the brand bar, and synthesizes a winning direction (grafting the best ideas from runners-up). Optimizes for craft/quality, not speed.',
  phases: [
    { title: 'Explore', detail: 'N independent design directions, distinct angles' },
    { title: 'Critique', detail: 'a read-only reviewer scores each variation' },
    { title: 'Synthesize', detail: 'pick winner + graft best runner-up ideas', model: 'opus' },
  ],
}

// args: { brief: string, target?: string (screen/component), variations?: number (default 4), reference?: string }
// args may arrive as an object OR a JSON string — normalize either way.
// NOTE: this normalizer is duplicated across all .claude/workflows/*.js — keep the 4 copies in sync (the Workflow runtime has no shared-module import).
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = {} } }
A = A || {}
const BRIEF = A.brief || ''
const TARGET = A.target || 'the screen described in the brief'
const N = A.variations || 4
const REFERENCE = A.reference || ''

if (!BRIEF) return { error: 'design.js requires args.brief.' }

const ANGLES = [
  'editorial / typographic-led — let type hierarchy and whitespace carry the design',
  'data-dense / dashboard-led — maximize information clarity at a glance',
  'guided / progressive-disclosure — minimize cognitive load, reveal complexity on demand',
  'bold / brand-forward — lean hardest into the project\'s primary accent and motion budget',
  'minimal / restraint-led — fewest elements that still does the job, Linear-grade calm',
  'conversion-led — optimize the primary action and trust signals above the fold',
]

const VARIATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['angle', 'concept', 'layout', 'rationale'],
  properties: {
    angle: { type: 'string' },
    concept: { type: 'string', description: 'the core idea in 1-2 sentences' },
    layout: { type: 'string', description: 'structural description: sections, hierarchy, key components, states' },
    rationale: { type: 'string', description: 'why this serves the brief and the user' },
    risks: { type: 'array', items: { type: 'string' } },
  },
}

const SCORE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['brand_fidelity', 'craft', 'usability', 'brief_fit', 'total', 'best_idea', 'verdict'],
  properties: {
    brand_fidelity: { type: 'number', description: '0-10 vs the project brand bar (honor the project\'s brand bar — accent color, type scale, spacing, motion budget — load the project\'s brand/design-system skill if one exists)' },
    craft: { type: 'number', description: '0-10 billion-dollar-feel polish' },
    usability: { type: 'number', description: '0-10 clarity + flow' },
    brief_fit: { type: 'number', description: '0-10 how well it answers the brief' },
    total: { type: 'number', description: 'sum of the four (0-40)' },
    best_idea: { type: 'string', description: 'the single strongest idea in this variation, worth grafting even if it loses' },
    verdict: { type: 'string' },
  },
}

const SYNTH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['winning_angle', 'final_direction', 'grafted_ideas', 'spec'],
  properties: {
    winning_angle: { type: 'string' },
    final_direction: { type: 'string' },
    grafted_ideas: { type: 'array', items: { type: 'string' }, description: 'ideas pulled from runner-up variations' },
    spec: { type: 'string', description: 'a build-ready description the designer/builder engines can implement' },
  },
}

const chosen = ANGLES.slice(0, Math.max(2, Math.min(N, ANGLES.length)))

function explorePrompt(angle) {
  return `Design a direction for: ${TARGET}.
Brief: ${BRIEF}
${REFERENCE ? 'Reference/inspiration: ' + REFERENCE : ''}
Take THIS angle and commit to it fully: ${angle}.
Honor the project's brand bar (accent color, type scale, spacing, motion budget) — load the project's brand/design-system skill if one exists. MANDATORY: before designing, Read and apply these global craft skills — ~/.claude/skills/{ui-typography,baseline-ui,frontend-design,12-principles-of-animation,design-audit,web-design-guidelines}/SKILL.md (project brand tokens win on conflict). Return concept, layout, rationale, risks.`
}

// ── Phase 1+2: explore variations → critique each (pipelined) ──
//
// TWO CONTAINERS, SPLIT ON WHETHER THE PHASE PRODUCES OR JUDGES.
// Until 2026-08-16 these named `product-designer` and `design-critic`. Neither file exists —
// both were collapsed in Phase 4b — so both dispatches resolved to nothing and ran as
// `general-purpose`, tools `*`. The grader held Write on the work it was grading.
phase('Explore')
const judged = await pipeline(
  chosen,
  // EXPLORE → `designer`: the only engine carrying `mcpServers: [playwright]` AND `Write`.
  // This phase has to produce a rendered artifact and then look at what rendered; an engine
  // without a browser can only describe a design it has never seen.
  angle => agent(explorePrompt(angle), { label: `explore:${angle.split(' ')[0]}`, phase: 'Explore', agentType: 'designer', model: 'sonnet', schema: VARIATION_SCHEMA }).catch(() => null),
  // CRITIQUE → `reviewer-readonly`: no Write, no Edit, no Bash. Its whole input is the
  // serialized variation below and its whole output is a score, so it reads nothing from disk
  // and runs nothing. The grader must not be able to edit what it grades.
  (variation) => variation
    ? agent(
        `Score this Agentvibe design variation against the brand quality bar and the brief.
Brief: ${BRIEF}
Variation: ${JSON.stringify(variation, null, 2)}
Score each axis 0-10 (brand_fidelity, craft, usability, brief_fit), give total, name the single best idea worth keeping even if this loses, and a one-line verdict. Be a demanding critic — billion-dollar bar.`,
        { label: `critique:${variation.angle?.split(' ')[0] ?? 'unknown'}`, phase: 'Critique', agentType: 'reviewer-readonly', model: 'sonnet', schema: SCORE_SCHEMA }
      ).then(score => ({ variation, score })).catch(() => null)
    : null
)

// Drop any chain where explore OR critique dropped out (null variation/score) before ranking.
const ranked = judged.filter(r => r && r.variation && r.score).sort((a, b) => (b.score.total || 0) - (a.score.total || 0))

// Never synthesize from nothing — if every explore/critique chain failed, return an error
// rather than fabricating a spec from an empty ranking.
if (!ranked.length) {
  return { error: 'All design variations failed to explore/critique — no ranked data to synthesize.', variations_explored: 0 }
}

// ── Phase 3: synthesize winner + graft best ideas ──
phase('Synthesize')
const synthesis = await agent(
  `Synthesize the final Agentvibe design direction for: ${TARGET}.
Brief: ${BRIEF}
Ranked variations (best first):
${JSON.stringify(ranked.map(r => ({ angle: r.variation.angle, concept: r.variation.concept, total: r.score.total, best_idea: r.score.best_idea })), null, 2)}
Pick the winning angle, but graft the strongest ideas from the runners-up where they strengthen it. Produce a build-ready spec.`,
  // SYNTHESIZE → `reviewer-readonly` for the same reason as Critique: everything it needs is
  // the ranked array serialized into the prompt above, and everything it emits leaves through
  // SYNTH_SCHEMA. The caller writes the spec file; this dispatch has no reason to hold a pen.
  // Before 2026-08-16 this site named no agentType at all, so it ran as `general-purpose`.
  { label: 'synthesize', phase: 'Synthesize', agentType: 'reviewer-readonly', model: 'opus', schema: SYNTH_SCHEMA }
).catch(() => null)

if (!synthesis) {
  // Don't lose the explore/critique work if synthesis drops out — hand back the ranking.
  return { error: 'Synthesis agent dropped out — returning raw ranking for manual synthesis.', variations_explored: ranked.length, ranking: ranked.map(r => ({ angle: r.variation.angle, total: r.score.total })) }
}

return {
  variations_explored: ranked.length,
  ranking: ranked.map(r => ({ angle: r.variation.angle, total: r.score.total })),
  ...synthesis,
}
