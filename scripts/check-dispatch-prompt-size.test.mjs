// POSTURE: the non-vacuity check FAILS (exits 1); PS-DISPATCH-BRIEF-SIZE itself WARNS (exits 0).
//
// scripts/check-dispatch-prompt-size.test.mjs — mutation gate for the PS-DISPATCH-BRIEF-SIZE checker.
// Rule spec: docs/03-system-design/agents/PROMPT-STANDARD.md §6.2.
//
// Every case below CONSTRUCTS the defect and asserts the checker warns on it. The "exits 0" cases
// verify the WARN posture: the script must NOT fail the build on oversized briefs, only warn.
// The non-vacuity failure is the one case that exits 1 — it means the scanner is broken.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'check-dispatch-prompt-size.mjs');

const roots = [];
function fixture({ workflows = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-prompt-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'workflows'), { recursive: true });
  for (const [name, body] of Object.entries(workflows)) {
    fs.writeFileSync(path.join(root, '.claude', 'workflows', name), body);
  }
  return root;
}

process.on('exit', () => {
  for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true }); } catch { /* best effort */ } }
});

function run(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: stdout };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString() };
  }
}

function check(root, extra = []) {
  const r = run(['--root', root, '--json', '--min-sites', '1', ...extra]);
  return { code: r.code, ...JSON.parse(r.out) };
}

// Use small overrides so fixtures don't need to carry 30k+ chars of source.
const TEST_THRESHOLD = '100';      // override the 30,000-char default
const TEST_FENCED = '5';           // override the 200-line fenced-block default

const CLEAN = (prompt = `'do the thing'`) =>
  `export const meta = { name: 'fx' }
phase('Go')
const r = await agent(${prompt}, { label: 'go', agentType: 'builder' })`;

// ── WARN posture: oversized inline brief WARNS but exits 0 ───────────────────
// This is the core property: PS-DISPATCH-BRIEF-SIZE cannot block per PROMPT-STANDARD.md §6.2.

test('oversized inline string WARNS and exits 0 — posture is WARN not FAIL', () => {
  const big = `'${'x'.repeat(110)}'`; // 112 chars, over test threshold of 100
  const r = check(fixture({ workflows: { 'fx.js': CLEAN(big) } }), ['--threshold', TEST_THRESHOLD, '--fenced-lines', TEST_FENCED]);
  // Exit 0 even with an oversized brief
  assert.equal(r.code, 0, `PS-DISPATCH-BRIEF-SIZE must WARN (exit 0), not FAIL (exit 1): ${JSON.stringify(r.failures)}`);
  // But a warning must be emitted
  assert.ok(r.warnings.some((w) => w.includes('PS-DISPATCH-BRIEF-SIZE')),
    `expected a PS-DISPATCH-BRIEF-SIZE warning, got: ${JSON.stringify(r.warnings)}`);
  assert.equal(r.failures.length, 0, 'no hard failures expected for an oversized brief');
});

test('oversized template literal WARNS and exits 0', () => {
  const big = `\`${'x'.repeat(110)}\``; // 112 chars, over threshold
  const r = check(fixture({ workflows: { 'fx.js': CLEAN(big) } }), ['--threshold', TEST_THRESHOLD, '--fenced-lines', TEST_FENCED]);
  assert.equal(r.code, 0);
  assert.ok(r.warnings.some((w) => w.includes('PS-DISPATCH-BRIEF-SIZE') && w.includes('template literal')),
    `expected template literal warning: ${JSON.stringify(r.warnings)}`);
});

test('inline brief exactly at the threshold passes silently', () => {
  const content = 'x'.repeat(98); // + 2 quotes = 100 chars, not > 100
  const atLimit = `'${content}'`;
  assert.equal(atLimit.length, 100);
  const r = check(fixture({ workflows: { 'fx.js': CLEAN(atLimit) } }), ['--threshold', TEST_THRESHOLD, '--fenced-lines', TEST_FENCED]);
  assert.equal(r.code, 0);
  assert.equal(r.warnings.length, 0, `exactly at threshold should produce no warning: ${JSON.stringify(r.warnings)}`);
});

// ── fenced block over limit WARNS and exits 0 ────────────────────────────────

test('inline brief with oversized fenced block WARNS and exits 0', () => {
  // Build a template literal containing a fenced block of 6 lines (> fenced limit of 5)
  const fenced = '\`some prompt\n```js\n' + 'line\n'.repeat(6) + '```\`';
  const r = check(fixture({ workflows: { 'fx.js': CLEAN(fenced) } }), ['--threshold', TEST_THRESHOLD, '--fenced-lines', TEST_FENCED]);
  assert.equal(r.code, 0, `oversized fenced block must WARN not FAIL: ${JSON.stringify(r.failures)}`);
  assert.ok(r.warnings.some((w) => w.includes('PS-DISPATCH-BRIEF-SIZE') && w.includes('fenced')),
    `expected fenced-block warning: ${JSON.stringify(r.warnings)}`);
});

// ── function-call prompts are not checked for size ───────────────────────────

test('function-call prompt passes without warning (runtime size is out of reach)', () => {
  const src = CLEAN('buildPrompt(s)');
  const r = check(fixture({ workflows: { 'fx.js': src } }), ['--threshold', TEST_THRESHOLD, '--fenced-lines', TEST_FENCED]);
  assert.equal(r.code, 0);
  assert.equal(r.warnings.length, 0);
  assert.equal(r.sites[0].prompt_is_inline_literal, false);
});

// ── non-vacuity floor FAILS (exits 1) ────────────────────────────────────────
// The hard failure: if the scanner finds no dispatch sites, it is broken.

test('no workflow files triggers non-vacuity hard failure (exits 1)', () => {
  const r = check(fixture({ workflows: {} }), ['--threshold', TEST_THRESHOLD, '--fenced-lines', TEST_FENCED]);
  assert.equal(r.code, 1);
  assert.ok(r.failures.some((f) => f.includes('non-vacuity')),
    `expected non-vacuity failure, got: ${JSON.stringify(r.failures)}`);
});

// ── script does not flag its own source ──────────────────────────────────────

test('the script itself is not in the scan surface (.claude/workflows/ only)', () => {
  const r = run(['--json']);
  const parsed = JSON.parse(r.out);
  for (const site of parsed.sites) {
    assert.ok(
      site.file.startsWith('.claude/workflows/'),
      `unexpected file outside .claude/workflows/ in scan: ${site.file}`
    );
  }
});

// ── real repo must pass and meet the non-vacuity floor ───────────────────────

test('real repo workflow files pass the 30,000-char threshold — pins the real floor', () => {
  const r = run(['--json']);
  const parsed = JSON.parse(r.out);
  // Script must exit 0 (warnings are fine; hard failures are not)
  assert.equal(r.code, 0,
    `real repo has a hard failure in dispatch-prompt check: ${JSON.stringify(parsed.failures)}`
  );
  // Must have found enough sites to satisfy the non-vacuity floor
  assert.ok(
    parsed.sites.length >= 12,
    `non-vacuity floor (12) not met: found ${parsed.sites.length} sites`
  );
  // No oversized inline literals in the current codebase
  assert.equal(parsed.warnings.length, 0,
    `unexpected PS-DISPATCH-BRIEF-SIZE warnings on real repo: ${JSON.stringify(parsed.warnings)}`
  );
});
