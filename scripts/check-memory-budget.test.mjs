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
import { constants as bufferConstants } from 'node:buffer';
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
    // `err` on both branches: it was present only on failure, so an assertion about stderr on a
    // passing run compared against `undefined` and silently held for the wrong reason.
    return { code: 0, out: stdout, err: '' };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '').toString(), err: (e.stderr || '').toString() };
  }
}

function check(root) {
  const r = run(['--root', root, '--json']);
  // `JSON.parse(r.out)` alone turned every crash into `Unexpected end of JSON input` — a refusal
  // naming neither the command nor the reason, when the checker had written one to stderr. The
  // volume-type cases below deliberately drive paths that used to crash, so this helper is the
  // first thing that has to stop lying about them.
  if (!r.out.trim()) {
    throw new Error(
      `check-memory-budget.mjs produced no stdout where --json was required.\n` +
      `  root:   ${root}\n  exit:   ${r.code}\n  stderr: ${(r.err || '').trim() || '(empty)'}`
    );
  }
  return { code: r.code, ...JSON.parse(r.out) };
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

test('MUTATION: an archive-named file the WRITE pattern rejects is still CAPPED', () => {
  // THIS TEST USED TO ASSERT THE OPPOSITE, and the assertion was the hole. It said
  // `DECISIONS_ARCHIVE_NOTES.md` "is not a volume" and passed a 41,000-byte file, on the
  // reasoning that the eviction tool would never create that name. But the cap is not about who
  // wrote the file — it bounds what a reader must load, and a reader loads it by what it holds.
  // Two patterns, two jobs: the WRITER stays narrow, the CAP is wide.
  const cases = {
    'DECISIONS_ARCHIVE_NOTES.md': 'a hand-named archive',
    'DECISIONS_ARCHIVE_2026-08.md': 'the period-keyed form this design did not adopt',
    'decisions_archive_002.md': "a case-insensitive filesystem's version of a volume",
  };
  for (const [name, why] of Object.entries(cases)) {
    const r = check(fixture({
      decisions: makeDecisions(3, 100),
      longTerm: makeLines(10),
      volumes: { 'DECISIONS_ARCHIVE.md': '# Archive\n', [name]: 'q'.repeat(ARCHIVE_BYTE_CAP + 1) },
    }));
    assert.equal(r.code, 1, `${name} (${why}) must be capped`);
    assert.ok(r.failures.some((f) => f.includes(name)), `${name} must be named in the failure`);
  }
});

test('MUTATION: a file that is not an archive at all is left alone', () => {
  // The wide pattern must still be a pattern. LONG-TERM.md and CODEBASE-MAP.md live in the same
  // directory and are governed by their own rules or by none.
  const r = check(fixture({
    decisions: makeDecisions(3, 100),
    longTerm: makeLines(10),
    volumes: { 'DECISIONS_ARCHIVE.md': '# Archive\n', 'ARCHIVE_OF_DECISIONS.md': 'q'.repeat(ARCHIVE_BYTE_CAP + 1) },
  }));
  assert.equal(r.code, 0, 'only DECISIONS_ARCHIVE* names are archive volumes');
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


// ── the parser is shared, and its hardening must hold HERE too ─────────────────
//
// `check-memory-budget.mjs` counts entries through scripts/lib/memory-entries.js. A parser bug
// is therefore a CAP bug: an entry the parser cannot see is an entry the 50-entry cap does not
// count, and the cap fails open on a file the checker calls smaller than it is.

test('MUTATION: a CRLF file is counted — it used to report ZERO entries', () => {
  const decisions = `# Decisions\n\n## 2026-01-01 — First\n\nBody.\n\n## 2026-01-02 — Second\n\nBody.\n`.replace(/\n/g, '\r\n');
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.decisions.entries, 2, 'CRLF must not hide entries from the entry cap');
});

test('MUTATION: dated headings inside a code fence are not counted as entries', () => {
  // The real DECISIONS.md documents exactly this construct in its own `## Format` section.
  const decisions = [
    '# Decisions', '', '## Format', '', '```markdown', '## 2026-01-01 — [Decision title]',
    '**Reversibility:** reversible', '```', '', '## 2026-02-02 — A real entry', '', 'Body.', '',
  ].join('\n');
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.decisions.entries, 1, 'only the unfenced entry counts');
});

// ── an ambiguous parse must BLOCK, because the entry cap cannot be enforced against it ────────

test('MUTATION: an unterminated fence FAILS the blocking checker', () => {
  // Measured before this: 60 entries plus one unterminated fence gave exit 0, entries: 2,
  // failures: []. The 50-entry cap failed OPEN on a file the checker called small — and
  // `evict-memory` REFUSED that same input, so the blocking CI check was the more permissive of
  // two consumers of one parser. Sharing a parser is not enough if they disagree about what its
  // output means.
  const decisions = `# Decisions\n\n${makeDecisions(60, 50).replace(/^# Architecture.*\n\*.*\n\n---\n\n/m, '')}\n\`\`\`\n## 2026-12-31 — swallowed\n`;
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.code, 1, `an unterminated fence must fail: ${JSON.stringify(r)}`);
  assert.ok(r.failures.some((f) => f.includes('decisions-parse-ambiguous')),
    `expected decisions-parse-ambiguous, got: ${JSON.stringify(r.failures)}`);
  assert.ok(r.decisions.parse_ambiguous, 'the JSON report must carry the reason');
});

test('MUTATION: the ambiguity failure says the entry count is a LOWER BOUND', () => {
  // The count is still printed, because it is the only number available — but a reader must not
  // take it as a measurement, so the message says which it is.
  const decisions = `# Decisions\n\n## 2026-01-01 — One\n\nBody.\n\n\`\`\`\n## 2026-01-02 — swallowed\n`;
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  const msg = r.failures.find((f) => f.includes('decisions-parse-ambiguous'));
  assert.match(msg, /LOWER BOUND/);
  assert.match(msg, /cannot be enforced/);
});

test('MUTATION: a well-formed fence does NOT trip the ambiguity failure', () => {
  // Otherwise the check above would fire on the real file, which documents a fenced example.
  const decisions = `# Decisions\n\n## Format\n\n\`\`\`markdown\n## 2026-01-01 — [Decision title]\n\`\`\`\n\n## 2026-02-02 — A real entry\n\nBody.\n`;
  const r = check(fixture({ decisions, longTerm: makeLines(10) }));
  assert.equal(r.code, 0, `a closed fence must pass: ${JSON.stringify(r.failures)}`);
  assert.equal(r.decisions.parse_ambiguous, null);
  assert.equal(r.decisions.entries, 1);
});

// ── A NAME IS NOT A FILE ──────────────────────────────────────────────────────────────────────
//
// `ARCHIVE_VOLUME_RE` matches a NAME, and every matching name went straight to `readFileSync`.
// The three cases below are the ones that behave differently, and they are here rather than
// folded into one because they FAIL differently: two crash and one does not.
//
// The FIFO is why this block exists. `check:memory` is a BLOCKING CI step, and a crash there
// names itself while a hang reads as a slow build. Measured on the unfixed checker: killed by an
// 8s cap having printed nothing at all about the volume.
//
// The two symlink cases are CONTROLS on the fix, not extra coverage. The scan must RESOLVE
// symlinks — `statSync`, not `lstatSync` — because a volume reached through one is content the
// cap has to bound. Swap in `lstatSync` and both of them go red while the three refusal cases
// above stay green, which is the only reason those two can be trusted to hold the line.

/** A fixture whose `.claude/memory` gets one extra entry that `fixture()` cannot write. */
function volumeFixture(build) {
  const root = fixture({ decisions: '', longTerm: 'one line\n' });
  build(path.join(root, '.claude', 'memory'));
  return root;
}

test('a DIRECTORY named like an archive volume is refused BY NAME, not by EISDIR', () => {
  const root = volumeFixture((mem) => fs.mkdirSync(path.join(mem, 'DECISIONS_ARCHIVE_002.md')));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  // The refusal is written to STDERR — that is where this checker reports every failure, and
  // where the unfixed version wrote its stack trace. Same stream, so the stream cannot be what
  // makes this pass; the CONTENT is.
  assert.match(r.err, /archive-volume-not-a-file/, 'the refusal must be a named check, not a throw');
  assert.match(r.err, /DECISIONS_ARCHIVE_002\.md/, 'the refusal must name the entry it refused');
  assert.match(r.err, /a directory/, 'and say what kind of thing it found');
  assert.doesNotMatch(r.err, /EISDIR/, 'a raw errno means it crashed rather than refused');
  assert.doesNotMatch(r.err, /^\s+at /m, 'a stack trace is a refusal nobody can act on');
});

test('a DANGLING SYMLINK named like an archive volume is refused by name, not by ENOENT', () => {
  const root = volumeFixture((mem) =>
    fs.symlinkSync(path.join(mem, 'no-such-target.md'), path.join(mem, 'DECISIONS_ARCHIVE_003.md')));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-not-a-file/);
  assert.match(r.err, /DECISIONS_ARCHIVE_003\.md/);
  assert.match(r.err, /ENOENT/, 'the errno belongs IN the message — it is the diagnosis, not the delivery');
  assert.doesNotMatch(r.err, /^\s+at /m, 'a stack trace is a refusal nobody can act on');
});

test('a FIFO named like an archive volume is refused in milliseconds, not read forever', () => {
  // THE HANG. `readFileSync` on a FIFO with no writer never returns. Without the cap below this
  // test would not fail — it would never finish, and a suite that never finishes reports nothing.
  const root = volumeFixture((mem) => execFileSync('mkfifo', [path.join(mem, 'DECISIONS_ARCHIVE_004.md')]));
  const started = Date.now();
  const r = runCapped(['--root', root], 8000);
  const elapsed = Date.now() - started;
  assert.equal(r.timedOut, false,
    `the checker never returned: readFileSync blocked on the FIFO (killed after ${elapsed}ms)`);
  assert.ok(elapsed < 4000, `refusing a FIFO took ${elapsed}ms — it must not be reading it at all`);
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-not-a-file/);
  assert.match(r.err, /FIFO/, 'the message must name the kind, or the operator cannot act on it');
});

test('CONTROL: a volume reached through a SYMLINK is still read and still capped', () => {
  // The scan resolves. `lstatSync` here would refuse this valid volume — verified: it reports
  // "not a regular file" for exactly this tree.
  const root = volumeFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'real-volume.md'), '# Real volume\n\nbody\n');
    fs.symlinkSync(path.join(mem, 'real-volume.md'), path.join(mem, 'DECISIONS_ARCHIVE_005.md'));
  });
  const r = check(root);
  assert.equal(r.code, 0, `a symlinked volume must be accepted: ${JSON.stringify(r.failures)}`);
  const vol = r.decisions_archive_volumes.find((v) => v.name === 'DECISIONS_ARCHIVE_005.md');
  assert.ok(vol, 'the symlinked volume is missing from the report — it was skipped, not read');
  assert.equal(vol.problem, null);
  assert.ok(vol.bytes > 0, 'a volume reported as zero bytes was never read');
});

test('CONTROL: an OVERSIZED volume behind a symlink still overflows its cap', () => {
  // The one that makes the choice load-bearing. Skip symlinks and this file stops being capped
  // while the checker still reports success — the cap silently stops binding.
  const root = volumeFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'big-volume.md'), `# Big\n\n${'x'.repeat(45_000)}`);
    fs.symlinkSync(path.join(mem, 'big-volume.md'), path.join(mem, 'DECISIONS_ARCHIVE_006.md'));
  });
  const r = check(root);
  assert.equal(r.code, 1, 'a 45,000-byte volume behind a symlink was not capped');
  assert.ok(r.failures.some((f) => f.includes('decisions-archive-byte-overflow')),
    `expected a byte-overflow failure, got ${JSON.stringify(r.failures)}`);
  assert.ok(!r.failures.some((f) => f.includes('archive-volume-not-a-file')),
    'it must overflow on BYTES — refusing it as a non-file means the bytes were never measured');
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

// ── A REGULAR FILE IS NOT A READABLE FILE ─────────────────────────────────────────────────────
//
// The block above closed three ways a NAME can fail to be a readable file: a directory, a FIFO,
// a dangling symlink. Each is a KIND failure, and `statSync` answers kind. It does not answer
// ACCESS — `stat(2)` needs no read permission on its subject — so a regular file at mode 0000
// walks through the kind guard and throws `EACCES` out of `readFileSync` on the next line.
//
// MEASURED ON THE UNFIXED CHECKER at `origin/main` e8c8ae5, so these fixtures are known to be
// able to express the failure rather than merely built from the fix: both arms produced a raw
// `Error: EACCES` with a stack trace naming `check-memory-budget.mjs:316` and `:332`, exit 1,
// and nothing at all identifying which memory file the operator should look at.
//
// The two assertions that carry the whole point are `doesNotMatch(/^\s+at /m)` — a stack trace is
// a refusal nobody can act on — and the named code. `EACCES` itself must APPEAR, in the message,
// because it is the diagnosis; what must not appear is node's own `Error: EACCES` throw line.

/** chmod 000, then assert the denial actually holds — as root it does not, and the case is void. */
function denyRead(p) {
  fs.chmodSync(p, 0o000);
  try {
    fs.readFileSync(p, 'utf8');
    return false; // readable anyway: root, or a filesystem that ignores the mode
  } catch (e) {
    return e && e.code === 'EACCES';
  }
}

const AS_ROOT = typeof process.getuid === 'function' && process.getuid() === 0;

test('an UNREADABLE archive volume is refused BY NAME, not by EACCES', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads, so the fixture cannot express the defect' }, () => {
  const root = volumeFixture((mem) => {
    const p = path.join(mem, 'DECISIONS_ARCHIVE_005.md');
    fs.writeFileSync(p, '# Volume 5\n\nbody\n');
  });
  const target = path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE_005.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = run(['--root', root]);
  fs.chmodSync(target, 0o644); // so the exit-time cleanup is unremarkable
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-unreadable/, 'the refusal must be a named check, not a throw');
  assert.match(r.err, /DECISIONS_ARCHIVE_005\.md/, 'the refusal must name the entry it refused');
  assert.match(r.err, /EACCES/, 'the errno belongs IN the message — it is the diagnosis, not the delivery');
  assert.doesNotMatch(r.err, /^\s+at /m, 'a stack trace is a refusal nobody can act on');
  assert.doesNotMatch(r.err, /Error: EACCES/, 'that is node throwing, not this checker refusing');
  // NOT `archive-volume-not-a-file`: it IS a file, and the remedies differ — one moves something
  // out of the way, the other restores permission.
  assert.doesNotMatch(r.err, /archive-volume-not-a-file/);
});

test('an UNREADABLE archive volume reports bytes: null, never 0', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  const root = volumeFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'DECISIONS_ARCHIVE_006.md'), '# Volume 6\n\nbody\n');
  });
  const target = path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE_006.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = check(root);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  const v = r.decisions_archive_volumes.find((x) => x.name === 'DECISIONS_ARCHIVE_006.md');
  assert.ok(v, 'the unreadable volume must still be REPORTED — silence would hide it entirely');
  // A volume nothing could read is not a volume of zero bytes. A machine consumer that saw 0
  // would conclude there is 40,000 bytes of room in a file it has never read one byte of.
  assert.equal(v.bytes, null);
  assert.match(v.problem, /EACCES/);
});

test('an UNREADABLE memory file is refused BY NAME, not by EACCES', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads, so the fixture cannot express the defect' }, () => {
  const root = typedFixture(() => {});
  const target = path.join(root, '.claude', 'memory', 'DECISIONS.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = run(['--root', root]);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  assert.match(r.err, /memory-file-unreadable/, 'the refusal must be a named check, not a throw');
  assert.match(r.err, /DECISIONS\.md/, 'the refusal must name the path it refused');
  assert.match(r.err, /EACCES/, 'the errno belongs IN the message');
  assert.doesNotMatch(r.err, /^\s+at /m, 'a stack trace is a refusal nobody can act on');
  assert.doesNotMatch(r.err, /Error: EACCES/, 'that is node throwing, not this checker refusing');
  assert.doesNotMatch(r.err, /memory-file-not-a-file/, 'it IS a file; the remedy is permission, not relocation');
});

test('an UNREADABLE LONG-TERM.md is refused too — the guard is on the reader, not on one path', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  const root = typedFixture(() => {});
  const target = path.join(root, '.claude', 'memory', 'LONG-TERM.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = run(['--root', root]);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  assert.match(r.err, /memory-file-unreadable/);
  assert.match(r.err, /LONG-TERM\.md/);
  assert.doesNotMatch(r.err, /^\s+at /m);
});

test('CONTROL: the guard does not fire on a readable file — it is about ACCESS, not about reading at all', () => {
  // Without this the four cases above would still pass if `readGuarded` refused everything, which
  // is the instrument-measures-itself failure. The clean-fixture test at the top of this file
  // makes the same point globally; this one pins it against these exact fixture builders.
  const root = typedFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'DECISIONS_ARCHIVE_007.md'), '# Volume 7\n\nbody\n');
  });
  const r = check(root);
  assert.equal(r.code, 0);
  const v = r.decisions_archive_volumes.find((x) => x.name === 'DECISIONS_ARCHIVE_007.md');
  assert.equal(v.problem, null);
  assert.ok(v.bytes > 0, 'a readable volume must report real bytes');
});

// ── THE REMEDY IS PART OF THE BEHAVIOUR, AND UNTIL THIS BLOCK NOTHING PINNED IT ────────────────
//
// A blinded review mutated the `archive-volume-unreadable` remedy to "reboot the mainframe." and
// NOTHING WENT RED. Every case above asserts a failure CODE and a path; none asserted what the
// operator is told to do about it, which is the half of a refusal that gets acted on. These cases
// pin the text — narrowly, on the clauses that carry a decision, not on whole sentences.

/** The size that defeats `readFileSync`'s string conversion, DERIVED — never a frozen number. */
const TOO_LONG_BYTES = bufferConstants.MAX_STRING_LENGTH + 1024;

/** A sparse file of `bytes` — instant, and it occupies ~4K on disk however large it claims to be. */
function sparse(p, bytes) {
  fs.writeFileSync(p, '');
  fs.truncateSync(p, bytes);
  assert.equal(fs.statSync(p).size, bytes, 'the fixture did not reach the size it needs');
}

test('an OVERSIZED memory file is diagnosed by SIZE, and never as a permissions problem', () => {
  // MEASURED on the version this replaces: a 545,259,520-byte DECISIONS.md against a 40,000-byte
  // cap was refused with "restore read permission, or move whatever is at that path out of the
  // way" — so an operator follows it, runs chmod 644 on a file already at 644, and concludes the
  // checker is broken. `decisions-byte-overflow`, the check that exists for this exact file, can
  // never fire: nothing can read it. The refusal is the only thing that can carry the diagnosis.
  // No root skip: this case does not depend on permissions, so it runs everywhere.
  const root = typedFixture((mem) => sparse(path.join(mem, 'DECISIONS.md'), TOO_LONG_BYTES));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /memory-file-unreadable/);
  assert.match(r.err, /ERR_STRING_TOO_LONG/, 'the cause belongs in the message');
  assert.match(r.err, new RegExp(TOO_LONG_BYTES.toLocaleString().replace(/,/g, ',')),
    'the size that caused it must be REPORTED — st.size was in hand one line before the throw');
  assert.match(r.err, /maximum string length/, 'and the limit it is measured against');
  assert.match(r.err, /SIZE PROBLEM AND NOT A PERMISSIONS ONE/);
  assert.match(r.err, /evict-memory\.mjs/, 'the remedy must name the tool that actually shrinks it');
  // THE ASSERTION THAT REDDENS AGAINST THE OLD MESSAGE. Everything above could be satisfied by
  // appending; this one cannot be satisfied while the permissions remedy is still there.
  assert.doesNotMatch(r.err, /restore read permission/,
    'chmod cannot fix a file that is too large to read — sending an operator there wastes the one ' +
    'action they take before they stop trusting the checker');
  assert.doesNotMatch(r.err, /^\s+at /m);
});

test('CONTROL: the size remedy does NOT displace the permissions one — the branch goes both ways', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  // Without this, a remedy hardcoded to the SIZE text would satisfy the case above. The pair is
  // the test; either alone is satisfied by a constant.
  const root = typedFixture(() => {});
  const target = path.join(root, '.claude', 'memory', 'DECISIONS.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = run(['--root', root]);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  assert.match(r.err, /restore read permission/);
  assert.doesNotMatch(r.err, /SIZE PROBLEM/);
  assert.doesNotMatch(r.err, /evict-memory\.mjs/);
});

test('an UNREADABLE volume is NOT told to rename itself out of the check', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  // MEASURED, one fixture, three states: a 50,013-byte volume fails `decisions-archive-byte-
  // overflow`; the same file at mode 000 fails `archive-volume-unreadable`; RENAMED so it no
  // longer matches ARCHIVE_VOLUME_RE, with the mode restored, it PASSES at exit 0 with 50,013
  // bytes still on disk. The refusal was instructing the operator to disable the check. The two
  // states below are the first two of that cell, run here; the third is asserted in the case after.
  const big = '#'.repeat(50_013);
  const root = volumeFixture((mem) => fs.writeFileSync(path.join(mem, 'DECISIONS_ARCHIVE_011.md'), big));
  const target = path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE_011.md');

  const overflow = run(['--root', root]);
  assert.equal(overflow.code, 1);
  assert.match(overflow.err, /decisions-archive-byte-overflow/,
    'readable, this volume is over its cap — which is what the rename advice would have hidden');

  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = run(['--root', root]);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-unreadable/);
  assert.match(r.err, /restore read permission/, 'the remedy that is actually sound here');
  assert.doesNotMatch(r.err, /rename this entry/,
    'this file HOLDS content the cap must bound; renaming it is how you make an over-cap volume ' +
    'invisible, so the checker must not be the thing that suggests it');
  assert.doesNotMatch(r.err, /no longer matches/);
});

test('CONTROL: the rename advice SURVIVES where it is sound — a volume that is not a file at all', () => {
  // The deletion above is narrow ON PURPOSE. A directory holds no cappable content, so renaming it
  // loses nothing and is a real remedy. Without this control the fix reads as "the clause is bad",
  // and the next person removes it from both arms.
  const root = volumeFixture((mem) => fs.mkdirSync(path.join(mem, 'DECISIONS_ARCHIVE_012.md')));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-not-a-file/);
  assert.match(r.err, /rename this entry so it no longer matches/);
});

test('a SELF-REFERENTIAL SYMLINK is refused by KIND, never reaching the read guard', () => {
  // This pins a corrected premise, not a fix. The comment above `readGuarded` claimed ELOOP was one
  // of four codes reaching it, justifying a catch over an access(2) pre-check. MEASURED: statSync
  // throws ELOOP inside entryKind, which refuses FIRST — so the code arrives as a KIND verdict and
  // `readGuarded` is never entered. The argument survives on ERR_STRING_TOO_LONG, which is pinned
  // above. If someone later routes ELOOP through the read path, this goes red and they will find
  // the comment that explains why it must not.
  const root = volumeFixture((mem) =>
    fs.symlinkSync('DECISIONS_ARCHIVE_013.md', path.join(mem, 'DECISIONS_ARCHIVE_013.md')));
  const r = run(['--root', root]);
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-not-a-file/);
  assert.match(r.err, /ELOOP/);
  assert.doesNotMatch(r.err, /archive-volume-unreadable/, 'it never reached the read');
});

test('CONTROL: a symlink to an UNREADABLE regular file is refused as unreadable, not as a kind', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  // The one symlink shape this file had no control for. The scan RESOLVES symlinks, so the target's
  // mode is what decides — a link is not a way to smuggle an unreadable volume past the guard, and
  // it must not be misreported as "not a regular file" either.
  const root = volumeFixture((mem) => {
    fs.writeFileSync(path.join(mem, 'real-unreadable.md'), '# Real\n\nbody\n');
    fs.symlinkSync(path.join(mem, 'real-unreadable.md'), path.join(mem, 'DECISIONS_ARCHIVE_014.md'));
  });
  const target = path.join(root, '.claude', 'memory', 'real-unreadable.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = run(['--root', root]);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  assert.match(r.err, /archive-volume-unreadable/);
  assert.match(r.err, /DECISIONS_ARCHIVE_014\.md/, 'named by the entry, not by its target');
  assert.doesNotMatch(r.err, /not a regular file/);
});

test('--json reports UNKNOWN as null, never as zero, at BOTH sites', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  // The principle was stated at the volume site and applied only there. MEASURED on the version
  // this replaces: an unreadable DECISIONS.md emitted `"bytes": 0, "entries": 0` beside its
  // `problem` — and 0 bytes against a 40,000-byte cap reads to a machine consumer as plenty of
  // room, which is the exact sentence the volume site uses to justify null.
  const root = typedFixture(() => {});
  const target = path.join(root, '.claude', 'memory', 'DECISIONS.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = check(root);
  fs.chmodSync(target, 0o644);
  assert.equal(r.code, 1);
  assert.equal(r.decisions.bytes, null, 'a file nothing could read does not occupy 0 bytes');
  assert.equal(r.decisions.entries, null, 'nor does it hold 0 entries');
  assert.equal(r.decisions.parse_ambiguous, null);
  assert.match(r.decisions.problem, /EACCES/);
  // The counterpart must be untouched: LONG-TERM.md was readable in this fixture.
  assert.equal(r.long_term.problem, null);
  assert.ok(r.long_term.lines > 0, 'the readable file must still report a real measurement');
});

test('--json reports null for a DIRECTORY too — the pre-existing false zero goes with it', () => {
  // Same shape, reached by the kind guard rather than the read guard, and wrong for the same
  // reason. It predates the read guard; it is corrected here because leaving one site emitting a
  // false zero is how the principle gets read as "a volumes rule" rather than a rule.
  const root = typedFixture((mem) => replaceWith(mem, 'DECISIONS.md', (p) => fs.mkdirSync(p)));
  const r = check(root);
  assert.equal(r.code, 1);
  assert.equal(r.decisions.bytes, null);
  assert.equal(r.decisions.entries, null);
  assert.match(r.decisions.problem, /a directory/);
});

test('--json carries `unreadable` so a consumer need not string-match the prose', { skip: AS_ROOT && 'running as root: chmod 000 does not deny reads' }, () => {
  // Two stderr CODES encode "wrong kind" vs "could not read"; the JSON encoded neither, so the only
  // way to recover the distinction was to match on `problem` — reading the message instead of the
  // cause, which is why `readGuarded` returns a code separate from its prose.
  const root = volumeFixture((mem) => fs.writeFileSync(path.join(mem, 'DECISIONS_ARCHIVE_015.md'), 'x\n'));
  const target = path.join(root, '.claude', 'memory', 'DECISIONS_ARCHIVE_015.md');
  assert.ok(denyRead(target), 'the fixture could not deny the read, so this case proves nothing');
  const r = check(root);
  fs.chmodSync(target, 0o644);
  const v = r.decisions_archive_volumes.find((x) => x.name === 'DECISIONS_ARCHIVE_015.md');
  assert.equal(v.unreadable, true);
  assert.equal(v.bytes, null);
});

test('CONTROL: a volume of the wrong KIND reports unreadable:false — the flag discriminates', () => {
  const root = volumeFixture((mem) => fs.mkdirSync(path.join(mem, 'DECISIONS_ARCHIVE_016.md')));
  const r = check(root);
  const v = r.decisions_archive_volumes.find((x) => x.name === 'DECISIONS_ARCHIVE_016.md');
  assert.equal(v.unreadable, false, 'a flag that is always true carries no information');
  assert.equal(v.bytes, null);
});

test('THE SUITE REFUSES TO RUN AS ROOT, because ten of its cases would vanish in silence', () => {
  // NOT A COUNT ASSERTION — a refusal. Ten cases carry `skip: AS_ROOT` because `chmod 000` does not
  // deny reads to uid 0, so as root they report SKIPPED and the suite still reports 0 failures: an
  // instrument that measured nothing, wearing a passing verdict. That is the shape this repo names
  // most often, and a skipped-count assertion would only restate the number that is already printed.
  //
  // EXPOSURE, MEASURED 2026-09-01 rather than assumed: `.github/workflows/ci.yml` is `ubuntu-latest`
  // with no `container:` KEY in any workflow: `grep -nE '^\s*container:' .github/workflows/*.yml`
  // returns nothing, while a bare `grep container` returns two PROSE lines — which is why the KEY
  // form is what is quoted. GitHub's hosted runners execute
  // as a non-root user — so the blocking path is not affected and this refusal cannot fire there.
  // It fires under `act`, under a self-hosted root runner, or in a container, which are exactly the
  // places the silent version would have been believed.
  assert.equal(AS_ROOT, false,
    'running as root: ten permission-dependent cases in this file cannot express their defect, ' +
    'so a green run here means less than it appears to. Run the suite as a non-root user.');
});
