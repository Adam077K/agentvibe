// POSTURE: BLOCKS (via npm run check:memory which includes this test).
//
// scripts/check-memory-budget.test.mjs — mutation gate for the memory-budget checker.
//
// Every case below CONSTRUCTS the defect — a DECISIONS.md that overflows its entry cap, one that
// overflows its byte cap, a LONG-TERM.md that overflows its line cap — and asserts the checker
// refuses it. The one case that asserts a pass runs against this repo as it stands (no --root
// fixture), pinning the real floor rather than an easy synthetic.
//
// Fixtures are written to a temp directory and the checker is pointed at them with --root.
// A test that read the working tree directly would pass or fail for reasons the test did not choose.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'check-memory-budget.mjs');

const roots = [];
function fixture({ decisions = '', longTerm = '' }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-budget-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'memory'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'DECISIONS.md'), decisions);
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'LONG-TERM.md'), longTerm);
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

function check(root) {
  const r = run(['--root', root, '--json']);
  return { code: r.code, ...JSON.parse(r.out) };
}

// ── helpers ─────────────────────────────────────────────────────────────────

/** Produce N dated decision entries, each BODY_BYTES bytes long. */
function makeDecisions(count, bodyBytes = 200) {
  const header = `# Architecture & Strategy Decisions\n*Append-only.*\n\n---\n\n`;
  const pad = 'x'.repeat(bodyBytes);
  const entries = Array.from({ length: count }, (_, i) =>
    `## 2026-01-${String((i % 28) + 1).padStart(2, '0')} — Entry ${i + 1}\n\n${pad}\n`
  ).join('\n');
  return header + entries;
}

/** Produce N lines. */
function makeLines(n) {
  return Array.from({ length: n }, (_, i) => `Line ${i + 1}`).join('\n');
}

const ENTRY_CAP = 50;
const BYTE_CAP = 40_000;
const LINE_CAP = 100;

// ── clean fixture must pass ─────────────────────────────────────────────────

test('clean fixture passes — otherwise every mutation below proves nothing', () => {
  const decisions = makeDecisions(10, 200);
  const longTerm = makeLines(50);
  const r = check(fixture({ decisions, longTerm }));
  assert.equal(r.code, 0, `expected pass, got: ${JSON.stringify(r.failures)}`);
  assert.equal(r.failures.length, 0);
  assert.equal(r.decisions.entries, 10);
  assert.ok(r.decisions.bytes < BYTE_CAP);
  assert.equal(r.long_term.lines, 50);
});

// ── DECISIONS.md mutations ──────────────────────────────────────────────────

test('MUTATION: one entry over the entry cap is flagged', () => {
  const r = check(fixture({ decisions: makeDecisions(ENTRY_CAP + 1, 50), longTerm: makeLines(10) }));
  assert.equal(r.code, 1);
  const hasEntryFail = r.failures.some((f) => f.includes('decisions-entry-overflow'));
  assert.ok(hasEntryFail, `expected decisions-entry-overflow, got: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: exactly at the entry cap passes', () => {
  // 50 entries × 50 bytes body = ~5k total, well under byte cap
  const r = check(fixture({ decisions: makeDecisions(ENTRY_CAP, 50), longTerm: makeLines(10) }));
  const entryFail = r.failures.some((f) => f.includes('decisions-entry-overflow'));
  assert.ok(!entryFail, `ENTRY_CAP itself should not trigger overflow: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: file over the byte cap is flagged', () => {
  // 5 entries × 9,000 bytes body = ~45k, over the 40k cap
  const decisions = makeDecisions(5, 9_000);
  assert.ok(Buffer.byteLength(decisions, 'utf8') > BYTE_CAP, 'fixture must actually exceed byte cap');
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.code, 1);
  const hasByteFail = r.failures.some((f) => f.includes('decisions-byte-overflow'));
  assert.ok(hasByteFail, `expected decisions-byte-overflow, got: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: the format-section heading ## Format is not counted as a decision entry', () => {
  // The real DECISIONS.md has a "## Format" heading. It must not add to the count.
  const decisions =
    `# Decisions\n\n## Format\n\nIgnored.\n\n` +
    makeDecisions(3, 100).replace(/^# Architecture.*\n\*.*\n\n---\n\n/m, '');
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.decisions.entries, 3, 'only dated entries should count, not ## Format');
});

// ── LONG-TERM.md mutations ──────────────────────────────────────────────────

test('MUTATION: one line over the line cap is flagged', () => {
  const r = check(fixture({ decisions: makeDecisions(3, 100), longTerm: makeLines(LINE_CAP + 1) }));
  assert.equal(r.code, 1);
  const hasLineFail = r.failures.some((f) => f.includes('long-term-line-overflow'));
  assert.ok(hasLineFail, `expected long-term-line-overflow, got: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: exactly at the line cap passes', () => {
  const r = check(fixture({ decisions: makeDecisions(3, 100), longTerm: makeLines(LINE_CAP) }));
  const lineFail = r.failures.some((f) => f.includes('long-term-line-overflow'));
  assert.ok(!lineFail, `LINE_CAP itself should not trigger overflow: ${JSON.stringify(r.failures)}`);
});

// ── real repo must pass ─────────────────────────────────────────────────────

test('the actual repo DECISIONS.md and LONG-TERM.md pass — pins the real floor', () => {
  // No --root: runs against this checkout.
  const r = run(['--json']);
  const parsed = JSON.parse(r.out);
  assert.equal(r.code, 0,
    `real repo memory files exceeded budget: ${JSON.stringify(parsed.failures)}\n` +
    `DECISIONS.md: ${parsed.decisions?.entries} entries, ${parsed.decisions?.bytes} bytes\n` +
    `LONG-TERM.md: ${parsed.long_term?.lines} lines`
  );
});
