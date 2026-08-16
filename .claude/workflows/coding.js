export const meta = {
  name: 'coding',
  description: 'Agentvibe T5 complex-coding workflow — implements independent slices in parallel isolated worktrees, then chains the combined diff into the binding qa.js gate. Returns per-slice results + the QA verdict. Does NOT merge — merge is Adam-gated after a qa.js PASS.',
  phases: [
    { title: 'Build', detail: 'one engineer per slice, isolated worktrees' },
    { title: 'QA', detail: 'chain combined diff into the binding qa.js gate', model: 'opus' },
  ],
}

// args: { slices: [{ id, agentType, brief, files }], tier?: "full"|"irreversible", ref?: string }
// agentType ∈ DISPATCHABLE, below. Optional — it defaults to `builder`.
// args may arrive as an object OR a JSON string — normalize either way.
// NOTE: this normalizer is duplicated across all .claude/workflows/*.js — keep the 4 copies in sync (the Workflow runtime has no shared-module import).
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = {} } }
A = A || {}
const SLICES = A.slices || []
const TIER = A.tier || 'full'
const REF = A.ref || 'origin/main...HEAD'

if (!SLICES.length) {
  return { error: 'coding.js requires args.slices = [{id, agentType, brief, files}] — nothing to build.' }
}

// DISPATCH IDENTITY IS NOT THE CALLER'S TO CHOOSE FREELY.
//
// Until 2026-08-16 this file passed `s.agentType || 'backend-engineer'` straight to `agent()`,
// and that one expression carried two defects.
//
//   The default was a phantom. No `.claude/agents/backend-engineer.md` exists — it was collapsed
//   into `builder` in Phase 4b — so every slice that did not name an agentType dispatched a name
//   the runtime could not resolve and fell back to `general-purpose`, tools `*`.
//
//   The caller-supplied half was unvalidated. `agentType` decides the tool grant, the model and
//   the isolation, so a workflow that forwards an arbitrary name from its caller lets the caller
//   pick its own container — dispatch-identity injection, and it gets worse the day a
//   credentialed engine (`operator`, `instrument`) exists to be named.
//
// The list is frozen, it is checked BEFORE anything is dispatched, and
// scripts/check-dispatch-agenttype.mjs verifies that every member is a real, non-shim engine —
// so a name that rots out of .claude/agents/ fails CI here rather than silently widening a grant.
const DISPATCHABLE = Object.freeze(['builder', 'designer'])

const badTypes = SLICES.filter(s => s.agentType && !DISPATCHABLE.includes(s.agentType)).map(s => `${s.id} -> ${s.agentType}`)
if (badTypes.length) {
  return {
    status: 'BLOCKED',
    error: `coding.js refuses to dispatch an agentType outside its frozen allowlist [${DISPATCHABLE.join(', ')}]. Offending slice(s): ${badTypes.join('; ')}. agentType selects the tool grant, so it is not a caller-chosen field.`,
    dispatchable: DISPATCHABLE,
  }
}

const SLICE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'branch', 'files_changed', 'summary'],
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'BLOCKED'] },
    branch: { type: 'string' },
    worktree: { type: 'string' },
    files_changed: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    decisions_made: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'string' } },
  },
}

function buildPrompt(s) {
  return `You are implementing ONE focused Agentvibe coding slice in an isolated git worktree branched from origin/main.
Slice [${s.id}] — ${s.brief}
Files in scope: ${(s.files || []).join(', ') || '(determine from the brief — stay narrow)'}.
Rules: TypeScript strict, Zod validation on all inputs, no placeholder UI, all four UI states, atomic conventional commits, never touch files outside scope. If a real architectural ambiguity blocks you, return status:BLOCKED with the specific question rather than guessing.
Verify it compiles/builds per the repo's documented build requirements (see CLAUDE.md / package.json scripts) before returning. Return the structured fields exactly.`
}

// ── Phase 1: parallel build, each slice isolated so worktrees don't collide ──
phase('Build')
const built = await parallel(SLICES.map(s => () =>
  agent(buildPrompt(s), {
    label: `build:${s.id}`,
    phase: 'Build',
    // `builder` is the engine that produces an artifact in an isolated worktree and returns
    // exactly what landed — it is the only default that matches what this phase does. The
    // caller may override it, but only with a member of DISPATCHABLE, checked above.
    agentType: s.agentType || 'builder',
    model: 'sonnet',
    isolation: 'worktree',
    schema: SLICE_SCHEMA,
  })
))

// Detect slice-agent dropout BEFORE filtering — `built` is positional with SLICES, so a null
// at index i means SLICES[i] never returned. Never run QA on a silently-partial diff.
const missing = SLICES.filter((s, i) => !built[i]).map(s => s.id)
if (missing.length) {
  log(`${missing.length}/${SLICES.length} slice agents dropped out (no structured return): ${missing.join(', ')}`)
  return { status: 'BLOCKED', reason: 'slice agent dropout — refusing to QA a partial diff', missing, slices: built.filter(Boolean) }
}

const slices = built.filter(Boolean)
const blocked = slices.filter(s => s.status === 'BLOCKED')
const branches = slices.filter(s => s.status === 'COMPLETE').map(s => s.branch)

if (blocked.length) {
  log(`${blocked.length}/${SLICES.length} slices BLOCKED — skipping QA gate, returning for CEO re-brief.`)
  return { status: 'BLOCKED', slices, blocked: blocked.map(b => ({ branch: b.branch, blockers: b.blockers })), branches }
}

// ── Phase 2: chain the combined work into the binding QA gate ──
// LIMITATION: slices build in ISOLATED worktrees, so their commits live on separate branches
// (see each slice's `branch`). The default REF (origin/main...HEAD) reflects the CEO worktree,
// NOT the slice work — so the caller MUST pass `args.ref` spanning the integrated slice diff
// (merge the slice branches into an integration branch first, then pass that range). If the
// default REF is in use with >0 slices, warn loudly: qa.js may otherwise review an empty/wrong diff.
phase('QA')
if (REF === 'origin/main...HEAD') {
  log(`WARNING: qa.js is using the default ref but slices built in isolated worktrees (branches: ${branches.join(', ')}). Pass args.ref spanning the integrated slice diff, or qa.js may review the wrong range.`)
}
log(`All ${slices.length} slices COMPLETE — running binding qa.js (${TIER}) over ref ${REF}.`)
const qa = (await workflow('qa', {
  tier: TIER,
  ref: REF,
  context: `Combined diff from ${slices.length} parallel coding slices: ${SLICES.map(s => s.id).join(', ')} (branches: ${branches.join(', ')}). Review the integration surface between slices as well as each slice.`,
}).catch(err => ({ verdict: 'BLOCK', summary: `qa.js sub-workflow threw: ${err && err.message ? err.message : err}`, blockers: [{ id: 'qa-workflow-failure', file: '(gate)', title: 'qa.js sub-workflow failed to return a verdict', fix: 'Re-run coding.js, or run qa.js independently to diagnose.' }] })))

if (!qa || !qa.verdict) {
  return { status: 'BLOCKED_BY_QA', slices, branches, qa_verdict: 'BLOCK', qa_summary: 'qa.js returned no verdict — failing safe.', note: 'No merge — gate did not produce a verdict.' }
}

return {
  status: qa.verdict === 'PASS' ? 'READY_TO_MERGE' : 'BLOCKED_BY_QA',
  slices,
  branches,
  qa_verdict: qa.verdict,
  qa_blockers: qa.blockers,
  qa_summary: qa.summary,
  note: 'No merge performed — Adam confirmation required after a PASS verdict.',
}
