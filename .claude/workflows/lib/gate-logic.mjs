// Pure, testable logic for the {{PROJECT_NAME}} T5 QA gate.
//
// WHY THIS FILE EXISTS: the Workflow runtime runs each .claude/workflows/*.js script in a
// sandbox with NO module import. So qa.js cannot `import` from here at runtime — it MIRRORS
// these implementations inline. This module is the canonical, unit-tested spec; the inline
// copies in qa.js MUST stay in sync with it. (If the runtime ever gains relative-import support,
// switch qa.js to import these directly and delete the inline copies.)
//
// Run the tests:  node --test .claude/workflows/lib/

/** args may arrive as an object OR a JSON string — normalize to a plain object. */
export function normalizeArgs(args) {
  let a = args
  if (typeof a === 'string') {
    try { a = JSON.parse(a) } catch (e) { a = {} }
  }
  return a && typeof a === 'object' ? a : {}
}

/**
 * A finding is confirmed only with a quorum (>=2 votes cast) AND a strict majority real.
 * A lone 1-of-1 vote or a 1-of-2 tie must NOT confirm.
 */
export function isConfirmed(votes) {
  const valid = (votes || []).filter(Boolean)
  return valid.length >= 2 && valid.filter(v => v && v.is_real).length * 2 > valid.length
}

/**
 * A finding is block-eligible (worth spending 3 adversarial verifiers on) only if its severity
 * could actually BLOCK at this tier: P1 always; P2 only at irreversible. P3 (and P2 at full) are
 * non-blocking, so we report them advisory/unverified rather than paying to verify them.
 */
export function isBlockEligible(severity, tier) {
  return severity === 'P1' || (tier === 'irreversible' && severity === 'P2')
}

/**
 * Deterministic gate verdict — never trusts the judge LLM alone.
 *
 * THREE block conditions, and the third was missing until 2026-08-24:
 *   1. a critical dimension failed to review          — reviewed, nothing came back
 *   2. a confirmed P1 (or P1/P2 at irreversible)      — examined, and it is real
 *   3. a block-eligible finding was never examined    — the verifier budget ran out
 *
 * All three are the same question: is there something that could have blocked this and did not
 * get a fair hearing? Condition 3 arrived with the verifier cap in qa.js and did NOT arrive here,
 * so this file — the canonical, unit-tested spec — kept certifying the fail-open behaviour that
 * cap introduced. `npm run test:gate` was green the whole time, pinning the pre-fix arithmetic as
 * correct, and the header above instructs a future maintainer to delete qa.js's inline copies in
 * favour of this one. Following that instruction would have reinstated the fail-open with every
 * check green. Two copies of the verdict arithmetic is why `.claude/qa-tier-floor.yml` raises the
 * tier of an edit here rather than lowering it.
 */
export function decideVerdict({ confirmed = [], tier = 'full', failedDims = [], criticalDims = ['correctness', 'security'], judgeVerdict = 'PASS', unverifiedTruncated = [] }) {
  const criticalGap = failedDims.filter(d => criticalDims.includes(d))
  const mustBlock = confirmed.filter(f => f && (f.severity === 'P1' || (tier === 'irreversible' && f.severity === 'P2')))
  const truncated = (unverifiedTruncated || []).length
  if (criticalGap.length > 0 || mustBlock.length > 0 || truncated > 0) return 'BLOCK'
  return judgeVerdict === 'BLOCK' ? 'BLOCK' : 'PASS'
}

/**
 * Order a finding list by severity (P1>P2>P3) and cut it at `max`; returns {kept, dropped}.
 *
 * `dropped` IS AN ARRAY OF FINDINGS, and it was a COUNT until 2026-08-24. The count was the
 * divergence: qa.js needs the objects — it returns them as `unverified_truncated` and names them
 * in the blocker — and a mirror that hands back a number cannot express the thing the caller must
 * do with them. Two functions that agree on the arithmetic and disagree on the type are not
 * mirrors, and the disagreement is invisible in a diff of either one.
 *
 * This is the SINGLE-CALL primitive. qa.js does not cap per call; it draws down a running total
 * across Phase 2 and every sweep round — see makeVerifyBudget below, which is what qa.js mirrors.
 */
export function capBySeverity(findings, max) {
  if (!Array.isArray(findings) || findings.length <= max) return { kept: findings || [], dropped: [] }
  const order = { P1: 0, P2: 1, P3: 2 }
  const sorted = [...findings].sort((a, b) => (order[a && a.severity] ?? 3) - (order[b && b.severity] ?? 3))
  return { kept: sorted.slice(0, max), dropped: sorted.slice(max) }
}

/**
 * The RUNNING verifier budget qa.js actually uses — `max` findings verified across Phase 2 and
 * every sweep round combined, not `max` per round. This is the canonical spec for qa.js's inline
 * `takeVerifyBudget`; the two must stay in sync, and `truncated()` is what feeds `decideVerdict`'s
 * third condition.
 *
 * Each finding costs three verifier dispatches, so a `max` of 40 is a ceiling of 120 agents. Before
 * the budget existed the sweep was unbounded — which is why the cap is kept, and why it must not
 * be allowed to decide the verdict on its own.
 */
export function makeVerifyBudget(max) {
  let remaining = max
  const truncated = []
  return {
    take(findings) {
      const list = Array.isArray(findings) ? findings : []
      if (list.length <= remaining) { remaining -= list.length; return list }
      const { kept, dropped } = capBySeverity(list, remaining)
      truncated.push(...dropped.map(f => ({ id: f && f.id, severity: f && f.severity, dimension: f && f.dimension })))
      remaining = 0
      return kept
    },
    remaining: () => remaining,
    truncated: () => truncated,
  }
}
