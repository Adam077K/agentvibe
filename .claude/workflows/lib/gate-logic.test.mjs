import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeArgs, isConfirmed, decideVerdict, capBySeverity, isBlockEligible, makeVerifyBudget } from './gate-logic.mjs'

test('isBlockEligible: P1 always eligible', () => {
  assert.equal(isBlockEligible('P1', 'full'), true)
  assert.equal(isBlockEligible('P1', 'irreversible'), true)
})
test('isBlockEligible: P2 eligible only at irreversible', () => {
  assert.equal(isBlockEligible('P2', 'full'), false)
  assert.equal(isBlockEligible('P2', 'irreversible'), true)
})
test('isBlockEligible: P3 never eligible', () => {
  assert.equal(isBlockEligible('P3', 'full'), false)
  assert.equal(isBlockEligible('P3', 'irreversible'), false)
})

test('normalizeArgs: object passes through', () => {
  assert.deepEqual(normalizeArgs({ tier: 'full' }), { tier: 'full' })
})
test('normalizeArgs: JSON string is parsed', () => {
  assert.deepEqual(normalizeArgs('{"tier":"irreversible","ref":"HEAD~1"}'), { tier: 'irreversible', ref: 'HEAD~1' })
})
test('normalizeArgs: bad string -> {}', () => {
  assert.deepEqual(normalizeArgs('not json'), {})
})
test('normalizeArgs: undefined/null -> {}', () => {
  assert.deepEqual(normalizeArgs(undefined), {})
  assert.deepEqual(normalizeArgs(null), {})
})

test('isConfirmed: no votes -> false', () => {
  assert.equal(isConfirmed([]), false)
  assert.equal(isConfirmed([null, null]), false)
})
test('isConfirmed: lone 1-of-1 real -> false (quorum)', () => {
  assert.equal(isConfirmed([{ is_real: true }]), false)
})
test('isConfirmed: 1-of-2 tie -> false', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: false }]), false)
})
test('isConfirmed: 2-of-2 -> true', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: true }]), true)
})
test('isConfirmed: 2-of-3 -> true', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: true }, { is_real: false }]), true)
})
test('isConfirmed: 1-of-3 -> false', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: false }, { is_real: false }]), false)
})
test('isConfirmed: tolerates a dropped (null) verifier', () => {
  // 2 cast, both real -> confirmed even though a 3rd dropped
  assert.equal(isConfirmed([{ is_real: true }, { is_real: true }, null]), true)
})

test('decideVerdict: confirmed P1 -> BLOCK even if judge says PASS', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P1' }], judgeVerdict: 'PASS' }), 'BLOCK')
})
test('decideVerdict: critical coverage gap -> BLOCK', () => {
  assert.equal(decideVerdict({ confirmed: [], failedDims: ['security'], judgeVerdict: 'PASS' }), 'BLOCK')
})
test('decideVerdict: full tier, P2 only, judge PASS -> PASS', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P2' }], tier: 'full', judgeVerdict: 'PASS' }), 'PASS')
})
test('decideVerdict: irreversible tier, P2 -> BLOCK', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P2' }], tier: 'irreversible', judgeVerdict: 'PASS' }), 'BLOCK')
})
test('decideVerdict: clean + judge BLOCK -> BLOCK', () => {
  assert.equal(decideVerdict({ confirmed: [], judgeVerdict: 'BLOCK' }), 'BLOCK')
})
test('decideVerdict: clean + judge PASS -> PASS', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P3' }], judgeVerdict: 'PASS' }), 'PASS')
})
test('decideVerdict: non-critical dim gap does NOT block on its own', () => {
  assert.equal(decideVerdict({ confirmed: [], failedDims: ['perf'], judgeVerdict: 'PASS' }), 'PASS')
})

test('capBySeverity: under cap returns all, nothing dropped', () => {
  const f = [{ severity: 'P1' }, { severity: 'P2' }]
  assert.deepEqual(capBySeverity(f, 5), { kept: f, dropped: [] })
})
test('capBySeverity: over cap keeps highest severity first', () => {
  const f = [{ severity: 'P3', id: 'a' }, { severity: 'P1', id: 'b' }, { severity: 'P2', id: 'c' }]
  const { kept, dropped } = capBySeverity(f, 2)
  assert.equal(dropped.length, 1)
  assert.deepEqual(kept.map(x => x.id), ['b', 'c'])
})
test('capBySeverity: dropped carries the FINDINGS, not a count', () => {
  // It returned a count until 2026-08-24, and qa.js needs the objects: it reports them as
  // `unverified_truncated` and names each one in the blocker. A mirror that hands back a number
  // cannot express what the caller has to do with them.
  const f = [{ severity: 'P3', id: 'a' }, { severity: 'P1', id: 'b' }, { severity: 'P2', id: 'c' }]
  const { dropped } = capBySeverity(f, 1)
  assert.deepEqual(dropped.map(x => x.id), ['c', 'a'])
  assert.deepEqual(dropped.map(x => x.severity), ['P2', 'P3'])
})

// ── The running verifier budget, and the third block condition it feeds ────

test('makeVerifyBudget: a RUNNING total, not a fresh allowance per call', () => {
  // The defect this exists to prevent: MAX_VERIFY was applied to Phase 2 only, and each of up to
  // three sweep rounds then verified an unbounded number of findings.
  const b = makeVerifyBudget(40)
  const mk = (n, sev) => Array.from({ length: n }, (_, i) => ({ id: `${sev}-${i}`, severity: sev, dimension: 'correctness' }))
  assert.equal(b.take(mk(30, 'P1')).length, 30, 'phase 2')
  assert.equal(b.remaining(), 10)
  assert.equal(b.take(mk(5, 'P1')).length, 5, 'sweep round 1')
  assert.equal(b.take(mk(12, 'P1')).length, 5, 'sweep round 2 — only 5 of the budget left')
  assert.equal(b.take(mk(4, 'P1')).length, 0, 'sweep round 3 — exhausted')
  assert.equal(b.remaining(), 0)
  assert.equal(b.truncated().length, 11, '7 from round 2 + 4 from round 3')
})

test('makeVerifyBudget: truncated() records id, severity and dimension, worst severity kept', () => {
  const b = makeVerifyBudget(1)
  const kept = b.take([
    { id: 'a', severity: 'P3', dimension: 'craft' },
    { id: 'b', severity: 'P1', dimension: 'security' },
    { id: 'c', severity: 'P2', dimension: 'correctness' },
  ])
  assert.deepEqual(kept.map(x => x.id), ['b'], 'P1 is verified first')
  assert.deepEqual(b.truncated(), [
    { id: 'c', severity: 'P2', dimension: 'correctness' },
    { id: 'a', severity: 'P3', dimension: 'craft' },
  ])
})

test('makeVerifyBudget: under budget truncates nothing', () => {
  const b = makeVerifyBudget(40)
  assert.equal(b.take([{ id: 'a', severity: 'P1' }]).length, 1)
  assert.deepEqual(b.truncated(), [])
  assert.equal(b.remaining(), 39)
})

test('decideVerdict: an unverified truncated finding -> BLOCK even if judge says PASS', () => {
  // THE THIRD BLOCK CONDITION. Missing from this file until 2026-08-24 while qa.js had it, so
  // this suite was green and pinning the fail-open as correct. A block-eligible finding that was
  // never examined is the same class of event as a critical dimension that never reported.
  assert.equal(decideVerdict({
    confirmed: [], failedDims: [], judgeVerdict: 'PASS',
    unverifiedTruncated: [{ id: 'x', severity: 'P1', dimension: 'correctness' }],
  }), 'BLOCK')
})

test('decideVerdict: 40 verified, 55 truncated, judge PASS -> BLOCK', () => {
  // The scenario from the review, end to end through both functions.
  const b = makeVerifyBudget(40)
  const findings = Array.from({ length: 95 }, (_, i) => ({ id: `f${i}`, severity: 'P1', dimension: 'correctness' }))
  const verified = b.take(findings)
  assert.equal(verified.length, 40)
  assert.equal(b.truncated().length, 55)
  assert.equal(decideVerdict({ confirmed: [], judgeVerdict: 'PASS', unverifiedTruncated: b.truncated() }), 'BLOCK')
})

test('decideVerdict: an EMPTY truncated list does not block — absent and empty must differ', () => {
  assert.equal(decideVerdict({ confirmed: [], judgeVerdict: 'PASS', unverifiedTruncated: [] }), 'PASS')
  assert.equal(decideVerdict({ confirmed: [], judgeVerdict: 'PASS' }), 'PASS', 'omitted defaults to empty')
})
