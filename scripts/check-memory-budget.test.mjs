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
function fixture({ decisions = '', longTerm = '', archive = '' }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-budget-fixture-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'memory'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'DECISIONS.md'), decisions);
  fs.writeFileSync(path.join(root, '.claude', 'memory', 'LONG-TERM.md'), longTerm);
  if (archive) {
    fs.writeFileSync(path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE.md'), archive);
  }
  return root;
}

process.on('exit', () => {
  for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true }); } catch { /* best effort */ } }
});

function run(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    // `err` on both branches: it was present only on failure, so an assertion about stderr on a
    // passing run compared against `undefined` and silently held for the wrong reason.
    return { code: 0, out: stdout, err: '' };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString() };
  }
}

/** Run with a hard wall-clock cap. A hang is the one failure a suite never holds a control for. */
function runCapped(args, ms) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: ms, killSignal: 'SIGKILL',
    });
    return { code: 0, out: stdout, err: '', timedOut: false };
  } catch (e) {
    return {
      code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString(),
      // execFileSync reports a timeout kill as a signal with no exit status.
      timedOut: e.killed === true || e.signal === 'SIGKILL',
    };
  }
}

function check(root) {
  const r = run(['--root', root, '--json']);
  // `JSON.parse(r.out)` alone turned every crash into `Unexpected end of JSON input` — a refusal
  // naming neither the command nor the reason, while the checker had written one to stderr. The
  // cases below deliberately drive paths that used to crash, so the helper reading them has to
  // stop discarding the answer. Third instance of this shape found in this repo; see
  // scripts/run-gate.test.mjs for the first.
  if (!r.out.trim()) {
    throw new Error(
      'check-memory-budget.mjs produced no stdout where --json was required.\n' +
      `  root:   ${root}\n  exit:   ${r.code}\n  stderr: ${r.err.trim() || '(empty)'}`
    );
  }
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

// ── `existsSync` ANSWERS "IS SOMETHING THERE", NOT "CAN I READ IT" ────────────────────────────
//
// Every memory file was guarded by `existsSync` and then handed to `readFileSync`. Safe for a
// regular file, safe for a symlink to one, and safe for a DANGLING symlink — `existsSync` follows
// links, so a broken one reads as absent and `missing-file` already covers it. Not safe for
// anything else.
//
// The FIFO is why this block exists. `check:memory` is a BLOCKING CI step, and there a crash names
// itself while a hang is indistinguishable from a slow build. It is the failure a suite is least
// likely to hold a control for, because a suite that hangs reports nothing at all.
//
// The last three are CONTROLS on the fix rather than coverage of the bug. Two pin that the check
// RESOLVES symlinks — swap `statSync` for `lstatSync` and both go red — and one pins that the
// dangling-symlink path is left exactly as it was. A narrowing attracts no test cases, so these
// are the cases.

/** A fixture whose `.claude/memory` is then given one entry `fixture()` cannot write. */
function typedFixture(build) {
  const root = fixture({ decisions: makeDecisions(1), longTerm: makeLines(10) });
  build(path.join(root, '.claude', 'memory'));
  return root;
}

/** Replace a path that `fixture()` already wrote with something that is not a regular file. */
function replaceWith(mem, name, make) {
  const p = path.join(mem, name);
  fs.rmSync(p, { force: true });
  make(p);
}

test('a DIRECTORY where a memory file belongs is refused BY NAME, not by EISDIR', () => {
  const root = typedFixture((mem) => replaceWith(mem, 'DECISIONS.md', (p) => fs.mkdirSync(p)));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /memory-file-not-a-file/, 'the refusal must be a named check, not a throw');
  assert.match(r.err, /DECISIONS\.md/, 'the refusal must name the path it refused');
  assert.match(r.err, /a directory/, 'and say what kind of thing it found');
  assert.doesNotMatch(r.err, /EISDIR/, 'a raw errno means it crashed rather than refused');
  assert.doesNotMatch(r.err, /^\s+at /m, 'a stack trace is a refusal nobody can act on');
});

test('a FIFO where a memory file belongs is refused in milliseconds, not read forever', () => {
  // THE HANG. `readFileSync` on a FIFO with no writer never returns. Without the cap below this
  // test would not fail — it would never finish, and a suite that never finishes reports nothing.
  const root = typedFixture((mem) =>
    replaceWith(mem, 'DECISIONS.md', (p) => execFileSync('mkfifo', [p])));
  const started = Date.now();
  const r = runCapped(['--root', root], 8000);
  const elapsed = Date.now() - started;
  assert.equal(r.timedOut, false,
    `the checker never returned: readFileSync blocked on the FIFO (killed after ${elapsed}ms)`);
  assert.ok(elapsed < 4000, `refusing a FIFO took ${elapsed}ms — it must not be reading it at all`);
  assert.equal(r.code, 1);
  assert.match(r.err, /memory-file-not-a-file/);
  assert.match(r.err, /FIFO/, 'the message must name the kind, or the operator cannot act on it');
});

test('the OPTIONAL archive path is type-checked too — absent and unreadable are not the same', () => {
  // DECISIONS_ARCHIVE.md is not required to exist, so it runs the other branch of the loader.
  // "Not there" is fine and silent; "there but unreadable" must not inherit that silence.
  const root = typedFixture((mem) =>
    execFileSync('mkfifo', [path.join(mem, 'DECISIONS_ARCHIVE.md')]));
  const r = runCapped(['--root', root], 8000);
  assert.equal(r.timedOut, false, 'the optional path blocked on a FIFO');
  assert.equal(r.code, 1, 'an unreadable archive must not be treated as an absent one');
  assert.match(r.err, /memory-file-not-a-file/);
  assert.match(r.err, /DECISIONS_ARCHIVE\.md/);
});

test('--json does not re-read the paths, so it cannot re-hang on them', () => {
  // The JSON branch used to repeat `existsSync ? readFileSync : ''` for all three paths — a second
  // copy of the same defect on the same paths, reached only with --json. It now reuses what the
  // checks loaded. Without the cap this test would hang rather than fail.
  const root = typedFixture((mem) =>
    replaceWith(mem, 'DECISIONS.md', (p) => execFileSync('mkfifo', [p])));
  const r = runCapped(['--root', root, '--json'], 8000);
  assert.equal(r.timedOut, false, '--json re-read the FIFO and blocked');
  assert.equal(r.code, 1);
  const parsed = JSON.parse(r.out);
  assert.match(parsed.decisions.problem, /FIFO/,
    'the JSON must say WHY it has no bytes — 0 with no reason reads as plenty of headroom');
});

test('CONTROL: a DANGLING SYMLINK is still handled by existsSync, exactly as before', () => {
  // Deliberately NOT widened. `existsSync` follows the link, so a broken one is already "absent"
  // and already refused by name. If this starts reporting `memory-file-not-a-file`, the change
  // widened something it did not need to.
  const root = typedFixture((mem) =>
    replaceWith(mem, 'DECISIONS.md', (p) => fs.symlinkSync(path.join(mem, 'no-such-target.md'), p)));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /missing-file/, 'the dangling case must keep its original refusal');
  assert.doesNotMatch(r.err, /memory-file-not-a-file/, 'it must not be re-routed through the new one');
});

test('CONTROL: a memory file reached through a SYMLINK is still read and still measured', () => {
  // The check resolves. `lstatSync` here would refuse this perfectly valid file.
  const root = typedFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'real-decisions.md'), makeDecisions(3));
    replaceWith(mem, 'DECISIONS.md', (p) => fs.symlinkSync(path.join(mem, 'real-decisions.md'), p));
  });
  const r = check(root);
  assert.equal(r.code, 0, `a symlinked memory file must be accepted: ${JSON.stringify(r.failures)}`);
  assert.equal(r.decisions.problem, null);
  assert.equal(r.decisions.entries, 3, 'a symlinked file reported as empty was never read');
});

test('CONTROL: an OVERSIZED file behind a symlink still overflows its cap', () => {
  // The one that makes the choice load-bearing. Stop resolving and this file stops being capped
  // while the checker still reports success — the cap silently stops binding.
  const root = typedFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'real-decisions.md'), makeDecisions(60));
    replaceWith(mem, 'DECISIONS.md', (p) => fs.symlinkSync(path.join(mem, 'real-decisions.md'), p));
  });
  const r = check(root);
  assert.equal(r.code, 1, 'a 60-entry file behind a symlink was not capped');
  assert.ok(r.failures.some((f) => f.includes('decisions-entry-overflow')),
    `expected an entry-overflow failure, got ${JSON.stringify(r.failures)}`);
  assert.ok(!r.failures.some((f) => f.includes('memory-file-not-a-file')),
    'it must overflow on CONTENT — refusing it as a non-file means the content was never measured');
});
