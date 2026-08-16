// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:probe-stop-reason`.
//
// scripts/probe-stop-reason.test.mjs — the aggregation that answers what ends a run.
//
// WHY THIS FILE EXISTS, STATED PLAINLY
// The probe shipped with 135 lines and zero tests, and the binding QA gate blocked its own PR
// for exactly that. The objection was not procedural: the very bucketing this file pins had
// ALREADY been silently wrong once. The first cut split the terminal bucket by "does this
// transcript contain a subagent turn anywhere", which is nearly every transcript and therefore
// measured nothing. It was caught by reading the output, not by a test — which is the failure
// mode the probe itself was written to investigate.
//
// Every transcript here is constructed. A test that reads this machine's real ~/.claude/projects
// passes or fails for reasons the test did not choose, and CI has no such directory at all.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'probe-stop-reason.mjs');

// One assistant turn. `stop` of undefined omits the field entirely (the "(absent)" case);
// `side` marks it as a subagent turn.
function turn({ stop, side = false, out = 10 }) {
  const message = { usage: { output_tokens: out } };
  if (stop !== undefined) message.stop_reason = stop;
  return JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), isSidechain: side, message });
}

// Build a projects dir. `files` maps filename -> array of turn objects (or a raw string).
function makeProjects(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-stop-'));
  const proj = path.join(dir, 'projects', 'someproject');
  fs.mkdirSync(proj, { recursive: true });
  for (const [name, turns] of Object.entries(files)) {
    const body = typeof turns === 'string' ? turns : turns.map(turn).join('\n') + '\n';
    fs.writeFileSync(path.join(proj, name), body);
  }
  return { dir, projects: path.join(dir, 'projects') };
}

function probe(projectsDir) {
  try {
    const stdout = execFileSync('node', [SCRIPT, '--json'], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, AGENTVIBE_PROJECTS_DIR: projectsDir },
    });
    return { code: 0, report: JSON.parse(stdout) };
  } catch (e) {
    return { code: e.status, stdout: (e.stdout || '').toString(), stderr: (e.stderr || '').toString() };
  }
}

test('a stop_reason on a NON-final turn counts in overall and never in terminal', () => {
  // The split that makes the whole probe meaningful. If mid-run tool_use leaked into the
  // terminal bucket, every transcript would look stranded.
  const { dir, projects } = makeProjects({
    'a.jsonl': [
      { stop: 'tool_use' },
      { stop: 'tool_use' },
      { stop: 'end_turn' }, // final
    ],
  });
  try {
    const { report } = probe(projects);
    assert.equal(report.stopReasonAllTurns.tool_use, 2, 'both mid-run tool_use turns belong to overall');
    assert.equal(report.stopReasonAllTurns.end_turn, 1);
    assert.deepEqual(report.stopReasonFinalTurn, { end_turn: 1 }, 'terminal counts one transcript, not one turn');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the terminal bucket splits on whether the FINAL turn was a subagent turn', () => {
  // The regression that already happened once: bucketing by "contains a subagent turn anywhere"
  // instead of "the last turn was one". `mixed.jsonl` is the discriminating fixture — it holds a
  // subagent turn but ends on the main thread.
  const { dir, projects } = makeProjects({
    'sub.jsonl':   [{ stop: 'end_turn', side: true },  { stop: 'tool_use', side: true }],
    'main.jsonl':  [{ stop: 'tool_use', side: false }, { stop: 'end_turn', side: false }],
    'mixed.jsonl': [{ stop: 'tool_use', side: true },  { stop: 'end_turn', side: false }],
  });
  try {
    const { report } = probe(projects);
    assert.deepEqual(report.stopReasonFinalTurnSidechain, { tool_use: 1 }, 'only sub.jsonl ends on a subagent turn');
    assert.deepEqual(report.stopReasonFinalTurnMainThread, { end_turn: 2 }, 'main.jsonl and mixed.jsonl both end on the main thread');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the stranded-subagent headline is derived from that split, not from the whole corpus', () => {
  const { dir, projects } = makeProjects({
    'stranded.jsonl': [{ stop: 'tool_use', side: true }],
    'clean.jsonl':    [{ stop: 'end_turn', side: true }],
    'mainmid.jsonl':  [{ stop: 'tool_use', side: false }], // main thread mid-tool — NOT a stranded subagent
  });
  try {
    const { report } = probe(projects);
    assert.equal(report.headline.strandedSubagents, 1, 'a main-thread mid-tool ending must not inflate the headline');
    assert.equal(report.headline.truncatedByOutputCeiling, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('max_tokens is counted in the headline when it actually occurs', () => {
  // The real corpus reported 0. A counter that can only ever report 0 proves nothing, so pin
  // that it can count.
  const { dir, projects } = makeProjects({ 'trunc.jsonl': [{ stop: 'max_tokens' }] });
  try {
    const { report } = probe(projects);
    assert.equal(report.headline.truncatedByOutputCeiling, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('absent stop_reason is its own bucket and is never folded into a total', () => {
  // A resolver must never pass what it could not check. "no stop_reason on the line" and
  // "we did not look" must not collapse into one number.
  const { dir, projects } = makeProjects({
    'absent.jsonl': [{ stop: undefined }, { stop: undefined }],
    'named.jsonl':  [{ stop: 'end_turn' }],
  });
  try {
    const { report } = probe(projects);
    assert.equal(report.stopReasonAllTurns['(absent)'], 2);
    assert.equal(report.stopReasonFinalTurn['(absent)'], 1);
    assert.equal(report.stopReasonAllTurns.end_turn, 1);
    assert.equal(report.stopReasonAllTurns.null, undefined, 'null must not appear as a bucket name');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('files holding no parseable turn are counted, not silently dropped', () => {
  const { dir, projects } = makeProjects({
    'good.jsonl':  [{ stop: 'end_turn' }],
    'empty.jsonl': '',
    'noise.jsonl': 'not json at all\n{"type":"user","message":{"content":"hi"}}\n',
  });
  try {
    const { report } = probe(projects);
    assert.equal(report.scanned.files, 3, 'every file must be reported as read');
    assert.equal(report.filesWithNoParsedTurns, 2);
    assert.equal(report.scanned.turns, 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('an existing but empty projects dir reports zeros and exits 0', () => {
  const { dir, projects } = makeProjects({});
  try {
    const { code, report } = probe(projects);
    assert.equal(code, 0, 'an empty corpus is a valid answer, not an error');
    assert.equal(report.scanned.files, 0);
    assert.equal(report.scanned.turns, 0);
    assert.equal(report.headline.strandedSubagents, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a missing projects dir exits non-zero rather than reporting an empty corpus', () => {
  // Reporting "0 stranded subagents" because the directory was not there is the fail-open
  // version of this probe, and it would read as good news.
  const r = probe(path.join(os.tmpdir(), 'definitely-not-a-projects-dir-xyz'));
  assert.equal(r.code, 1);
});

test('the --json key set is pinned, so a rename breaks a test rather than a consumer', () => {
  const { dir, projects } = makeProjects({ 'a.jsonl': [{ stop: 'end_turn' }] });
  try {
    const { report } = probe(projects);
    assert.deepEqual(Object.keys(report).sort(), [
      'filesWithNoParsedTurns',
      'headline',
      'scanned',
      'stopReasonAllTurns',
      'stopReasonFinalTurn',
      'stopReasonFinalTurnMainThread',
      'stopReasonFinalTurnSidechain',
    ]);
    assert.deepEqual(Object.keys(report.scanned).sort(), ['files', 'megabytes', 'root', 'turns']);
    assert.deepEqual(Object.keys(report.headline).sort(), ['strandedSubagents', 'truncatedByOutputCeiling']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
