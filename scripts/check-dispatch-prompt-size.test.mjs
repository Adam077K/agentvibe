// POSTURE: BLOCKS (via npm run check:dispatch-prompt which includes this test).
//
// scripts/check-dispatch-prompt-size.test.mjs — mutation gate for the dispatch-prompt-size checker.
//
// Every case below CONSTRUCTS the defect and asserts the checker refuses it. The case asserting
// a pass runs against the real repo (no --root fixture) to pin the real floor.
//
// Fixtures are written to a temp directory with a minimal agent stub so the checker can find
// the workflow directory. --threshold is lowered for the size tests so fixtures stay small.

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

// A threshold low enough to make small fixtures testable.
const TEST_THRESHOLD = '100';

// A prompt just under the threshold — should pass.
const SMALL_PROMPT = "'x'.repeat(90)";

// A clean dispatch with a small prompt — the base fixture.
const CLEAN = (prompt = `'do the thing'`) =>
  `export const meta = { name: 'fx' }
phase('Go')
const r = await agent(${prompt}, { label: 'go', agentType: 'builder' })`;

// ── the clean fixture must pass ──────────────────────────────────────────────

test('clean fixture with a short inline string passes', () => {
  const r = check(fixture({ workflows: { 'fx.js': CLEAN("'short prompt'") } }), ['--threshold', TEST_THRESHOLD]);
  assert.equal(r.code, 0, `expected pass, got: ${JSON.stringify(r.failures)}`);
  assert.equal(r.sites.length, 1);
  assert.equal(r.sites[0].prompt_is_inline_literal, true);
});

test('clean fixture with a function-call prompt passes (runtime size is out of reach)', () => {
  const src = CLEAN('buildPrompt(s)');
  const r = check(fixture({ workflows: { 'fx.js': src } }), ['--threshold', TEST_THRESHOLD]);
  assert.equal(r.code, 0, `expected pass for function-call prompt, got: ${JSON.stringify(r.failures)}`);
  assert.equal(r.sites.length, 1);
  // Function calls are NOT marked as inline literals — their size is not checked.
  assert.equal(r.sites[0].prompt_is_inline_literal, false);
});

// ── MUTATION: oversized inline string ────────────────────────────────────────

test('MUTATION: inline string over the threshold is flagged', () => {
  // 110-char string, threshold is 100
  const bigPrompt = `'${'x'.repeat(110)}'`;
  const r = check(fixture({ workflows: { 'fx.js': CLEAN(bigPrompt) } }), ['--threshold', TEST_THRESHOLD]);
  assert.equal(r.code, 1);
  const hasFail = r.failures.some((f) => f.includes('oversized-inline-prompt'));
  assert.ok(hasFail, `expected oversized-inline-prompt, got: ${JSON.stringify(r.failures)}`);
  // The failure message must name the char count and the threshold.
  assert.ok(r.failures.some((f) => f.includes('110') || f.includes('chars')),
    'message should mention char count');
});

test('MUTATION: inline template literal over the threshold is flagged', () => {
  const big = 'x'.repeat(110);
  const src = CLEAN(`\`${big}\``);
  const r = check(fixture({ workflows: { 'fx.js': src } }), ['--threshold', TEST_THRESHOLD]);
  assert.equal(r.code, 1);
  assert.ok(r.failures.some((f) => f.includes('oversized-inline-prompt')),
    `expected oversized-inline-prompt, got: ${JSON.stringify(r.failures)}`);
  assert.ok(r.failures.some((f) => f.includes('template literal')),
    'message should name template literal');
});

test('inline string exactly at the threshold passes', () => {
  // Source text of the argument is `'` + N chars + `'`. At threshold=100, we want total=100,
  // so content is 98 chars. 100 chars in source is NOT > 100, so it passes.
  const content = 'x'.repeat(98); // + 2 quotes = 100 chars of source text
  const atLimit = `'${content}'`;
  assert.equal(atLimit.length, 100, 'fixture must be exactly at the threshold');
  const r = check(fixture({ workflows: { 'fx.js': CLEAN(atLimit) } }), ['--threshold', TEST_THRESHOLD]);
  const hasFail = r.failures.some((f) => f.includes('oversized-inline-prompt'));
  assert.ok(!hasFail, `exactly at threshold should pass: ${JSON.stringify(r.failures)}`);
});

// ── non-vacuity floor ────────────────────────────────────────────────────────

test('no workflow files triggers non-vacuity failure', () => {
  const r = check(fixture({ workflows: {} }), ['--threshold', TEST_THRESHOLD]);
  assert.equal(r.code, 1);
  assert.ok(r.failures.some((f) => f.includes('non-vacuity')),
    `expected non-vacuity, got: ${JSON.stringify(r.failures)}`);
});

// ── the script does not flag its own source ──────────────────────────────────
//
// check-dispatch-agenttype.mjs was bitten by its first version flagging its own constants.
// This check uses a different scan surface (.claude/workflows/*.js only), so the script's own
// source is never scanned. But verify it explicitly to pin the invariant.

test('the script itself is not in the scan surface (.claude/workflows/ only)', () => {
  // If the script is scanned, any large constant string in it would trip the check.
  // Run against the real repo to confirm it passes.
  const r = run(['--json']);
  const parsed = JSON.parse(r.out);
  // All scanned files must be under .claude/workflows/
  for (const site of parsed.sites) {
    assert.ok(
      site.file.startsWith('.claude/workflows/'),
      `unexpected file outside .claude/workflows/ in scan: ${site.file}`
    );
  }
});

// ── real repo must pass ──────────────────────────────────────────────────────

test('the actual repo workflow files pass the default threshold — pins the real floor', () => {
  const r = run(['--json']);
  const parsed = JSON.parse(r.out);
  assert.equal(r.code, 0,
    `real repo has oversized inline dispatch prompts: ${JSON.stringify(parsed.failures)}`
  );
  // Must have found at least 12 sites (the real min-sites floor).
  assert.ok(
    parsed.sites.length >= 12,
    `non-vacuity floor (12) not met: found ${parsed.sites.length} sites`
  );
});
