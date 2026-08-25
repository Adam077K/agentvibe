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
/**
 * @param {object} o
 * @param {string} [o.archive]   volume 1, by its legacy name — the shape most cases need
 * @param {object} [o.volumes]   any archive volume by filename, for the rotation cases
 */
function fixture({ decisions = '', longTerm = '', archive = '', volumes = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-budget-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'memory'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'DECISIONS.md'), decisions);
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'LONG-TERM.md'), longTerm);
  if (archive) {
    fs.writeFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), archive);
  }
  for (const [name, body] of Object.entries(volumes)) {
    fs.writeFileSync(path.join(root, '.claude', 'memory', name), body);
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
const ARCHIVE_BYTE_CAP = 40_000;
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

// ── DECISIONS_ARCHIVE.md mutations ─────────────────────────────────────────────

test('MUTATION: archive over the byte cap is flagged', () => {
  const bigArchive = 'x'.repeat(ARCHIVE_BYTE_CAP + 1);
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    archive: bigArchive,
  }));
  assert.equal(r.code, 1);
  const hasArchiveFail = r.failures.some((f) => f.includes('decisions-archive-byte-overflow'));
  assert.ok(hasArchiveFail, `expected decisions-archive-byte-overflow, got: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: archive exactly at the byte cap passes', () => {
  const atCapArchive = 'x'.repeat(ARCHIVE_BYTE_CAP);
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    archive: atCapArchive,
  }));
  const hasArchiveFail = r.failures.some((f) => f.includes('decisions-archive-byte-overflow'));
  assert.ok(!hasArchiveFail, `ARCHIVE_BYTE_CAP itself should not trigger overflow: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: absent DECISIONS_ARCHIVE.md passes (archive check is optional)', () => {
  // No archive= provided: fixture does not write the file.
  const r = check(fixture({ decisions: makeDecisions(3, 100), longTerm: makeLines(10) }));
  assert.equal(r.code, 0, `no archive file should pass: ${JSON.stringify(r.failures)}`);
});

// ── the archive is a SET of volumes, each capped ───────────────────────────────
//
// The archive used to be one file and this checker used to name it. A second volume was
// therefore governed by nothing — the state the single archive was in before it was capped at
// all (18,538 bytes, checked by nothing). Discovery is by pattern now, and these cases pin it
// by putting the defect in a volume the old code would not have opened.

test('MUTATION: a numbered volume over the byte cap is flagged, and named', () => {
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    volumes: {
      'DECISIONS_ARCHIVE.md': '# Archive\n',
      'DECISIONS_ARCHIVE_002.md': 'x'.repeat(ARCHIVE_BYTE_CAP + 1),
    },
  }));
  assert.equal(r.code, 1, 'an over-cap volume 2 must fail the blocking check');
  assert.ok(r.failures.some((f) => f.includes('DECISIONS_ARCHIVE_002.md')),
    `the failing volume must be named: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: volume 1 within cap does not excuse volume 3 over it', () => {
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    volumes: {
      'DECISIONS_ARCHIVE.md': 'x'.repeat(ARCHIVE_BYTE_CAP),
      'DECISIONS_ARCHIVE_002.md': 'y'.repeat(100),
      'DECISIONS_ARCHIVE_003.md': 'z'.repeat(ARCHIVE_BYTE_CAP + 1),
    },
  }));
  assert.equal(r.code, 1);
  assert.equal(r.decisions_archive_volumes.length, 3, 'all three volumes must be measured');
  const named = r.failures.filter((f) => f.includes('decisions-archive-byte-overflow'));
  assert.equal(named.length, 1, 'exactly the over-cap volume fails');
  assert.ok(named[0].includes('DECISIONS_ARCHIVE_003.md'));
});

test('MUTATION: many volumes, all within cap, pass — the cap is per volume, not a total', () => {
  // The lifetime total here is 3× the cap and that is CORRECT. What the cap bounds is what one
  // reader must load. A checker that summed the volumes would be a mechanism for losing history.
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    volumes: {
      'DECISIONS_ARCHIVE.md': 'x'.repeat(ARCHIVE_BYTE_CAP),
      'DECISIONS_ARCHIVE_002.md': 'y'.repeat(ARCHIVE_BYTE_CAP),
      'DECISIONS_ARCHIVE_003.md': 'z'.repeat(ARCHIVE_BYTE_CAP),
    },
  }));
  assert.equal(r.code, 0, `per-volume caps must not sum: ${JSON.stringify(r.failures)}`);
});

test('MUTATION: a file that only looks like a volume is not measured', () => {
  // `DECISIONS_ARCHIVE_2026-08.md` is the period-keyed name this design deliberately did not
  // adopt. If the pattern accepted it, an operator could believe a period file was governed
  // when it was not — so the pattern is exact and this pins it.
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    volumes: {
      'DECISIONS_ARCHIVE.md': '# Archive\n',
      'DECISIONS_ARCHIVE_NOTES.md': 'q'.repeat(ARCHIVE_BYTE_CAP + 1),
    },
  }));
  assert.equal(r.code, 0, 'only DECISIONS_ARCHIVE.md and DECISIONS_ARCHIVE_NNN.md are volumes');
  assert.equal(r.decisions_archive_volumes.length, 1);
});

test('MUTATION: the overflow message refuses to advise deleting records', () => {
  // It used to read "compress or DELETE fully superseded entries" — an instruction to lose
  // decisions, written into the one check that exists to preserve them, and reachable: the
  // single archive stood at 34,472 of 40,000 while DECISIONS.md had 325 bytes of headroom.
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    archive: 'x'.repeat(ARCHIVE_BYTE_CAP + 1),
  }));
  const msg = r.failures.find((f) => f.includes('decisions-archive-byte-overflow'));
  assert.ok(msg, 'the overflow must be reported');
  assert.match(msg, /Do NOT resolve this by deleting records/);
  assert.match(msg, /evict-memory\.mjs/, 'the message must name the tool that rotates');
});

// ── entry counting has ONE implementation ──────────────────────────────────────

test('MUTATION: an archive STUB still counts as an entry', () => {
  // A stub costs bytes and occupies a heading. Hiding it from the count would make the file
  // look emptier than it reads — and this checker's whole job is to report what it costs.
  const decisions =
    `# Decisions\n\n` +
    `## 2026-01-01 — A real entry\n\nBody.\n\n` +
    `## 2026-01-02 — An evicted entry\n*Archived to \`DECISIONS_ARCHIVE.md\` (2026-08-25). Complete.*\n`;
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.decisions.entries, 2, 'the stub is an entry');
});

test('MUTATION: a heading with no title is still an entry', () => {
  // The shared parser allows a bare `## YYYY-MM-DD`. If the checker carried its own regex the
  // two could disagree, and the file would be counted differently by the tool that reports it
  // and the tool that edits it.
  const r = check(fixture({
    decisions: `# Decisions\n\n## 2026-01-01\n\nBody.\n\n## 2026-01-02 — Titled\n\nBody.\n`,
    longTerm: makeLines(10),
  }));
  assert.equal(r.decisions.entries, 2);
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
