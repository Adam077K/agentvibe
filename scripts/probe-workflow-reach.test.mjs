// POSTURE: REPORTS. NOT wired to CI and not a step of `npm run check` — nothing runs this on a
// runner. The reason, the measurement behind it and the one-commit fix are in the EXCLUDED entry
// for `test:probe-workflow-reach` in scripts/lib/check-suite.js; run it by hand with
// `npm run test:probe-workflow-reach`.
//
// This line read "POSTURE: BLOCKS. Wired to .github/workflows/ci.yml" in the commit that created
// the file — while that same commit's EXCLUDED entry said the opposite and was correct. Two
// statements about one file, in one diff, disagreeing, and nothing catches it: only
// gen-codebase-map.mjs parses `POSTURE:`, and not for the test-file table, so `check:map` stayed
// green with the false line in place. It is the exact defect this branch exists to fix — a comment
// asserting a property nothing checks — committed inside the fix for it.
//
// scripts/probe-workflow-reach.test.mjs — the bucketing behind "only a main session reaches the gate".
//
// WHY THIS FILE EXISTS
// The probe's headline output is an ABSENCE: zero subagent `Workflow` calls. An absence is the
// easiest result in this repo to get wrong, because `0` is byte-identical whether the tool is
// unreachable, the corpus is empty, the parser broke, or the path was wrong. The probe answers
// that with a control it requires to fire, and this file is what stops the control from quietly
// becoming decorative — the same failure `probe-stop-reason.test.mjs` was written for after its
// own bucketing was silently wrong once.
//
// Every transcript here is constructed. A test that reads this machine's real ~/.claude/projects
// passes or fails for reasons the test did not choose, and CI has no such directory at all —
// which is itself one of the cases pinned below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'probe-workflow-reach.mjs');

/** One tool_use turn. `side: true` marks it as a subagent (sidechain) turn. */
const call = (name, side = false, extra = {}) =>
  JSON.stringify({ isSidechain: side, ...extra, message: { content: [{ type: 'tool_use', name }] } });

function makeProjects(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-wf-'));
  const proj = path.join(dir, 'projects', 'someproject');
  fs.mkdirSync(proj, { recursive: true });
  for (const [name, lines] of Object.entries(files)) {
    fs.writeFileSync(path.join(proj, name), (typeof lines === 'string' ? lines : lines.join('\n')) + '\n');
  }
  return { dir, projects: path.join(dir, 'projects') };
}

/** Returns the exit code alongside the report — the code is the whole point of this probe. */
function probe(projectsDir) {
  const env = { ...process.env, AGENTVIBE_PROJECTS_DIR: projectsDir };
  try {
    const stdout = execFileSync('node', [SCRIPT, '--json'], {
      cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env,
    });
    return { code: 0, report: JSON.parse(stdout) };
  } catch (e) {
    let report = null;
    try { report = JSON.parse((e.stdout || '').toString()); } catch { /* refusal before any report */ }
    return { code: e.status, report, stdout: (e.stdout || '').toString() };
  }
}

const withProjects = (files, fn) => {
  const { dir, projects } = makeProjects(files);
  try { fn(probe(projects)); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};

test('CONTAINED requires BOTH a firing control and an empty subject bucket', () => {
  // The shape of the real corpus: subagents are busy, and none of them reaches Workflow.
  withProjects({
    'a.jsonl': [call('Bash', true), call('Read', true), call('Agent', true), call('Workflow', false)],
  }, ({ code, report }) => {
    assert.equal(code, 0);
    assert.equal(report.verdict, 'CONTAINED');
    assert.equal(report.subject_subagent, 0);
    assert.equal(report.subject_main, 1);
    assert.equal(report.control_fired, true);
  });
});

test('an empty subject bucket WITHOUT a firing control is UNRESOLVED, never CONTAINED', () => {
  // The heart of it. This corpus would report "0 subagent Workflow calls" just like the real one,
  // and concluding containment from it would be concluding from an instrument that never moved.
  withProjects({
    'a.jsonl': [call('Workflow', false), call('Bash', false), call('Read', false)],
  }, ({ code, report }) => {
    assert.equal(code, 2, 'a silent instrument must not produce a pass');
    assert.equal(report.verdict, 'UNRESOLVED');
    assert.equal(report.subject_subagent, 0, 'the subject bucket is empty in BOTH cases — that is the point');
    assert.equal(report.control_fired, false);
    assert.match(report.note, /control did not fire/);
  });
});

test('a subagent Workflow call is admitted and BREACHES — the fixture that defeats the claim', () => {
  // A fixture built from the fix cannot fail. This is the input that refutes
  // c-workflow-invocation-contained, and the probe must report it rather than absorb it.
  withProjects({
    'a.jsonl': [call('Bash', true), call('Workflow', true, { agentType: 'reviewer', spawnDepth: 1 })],
  }, ({ code, report }) => {
    assert.equal(code, 1);
    assert.equal(report.verdict, 'BREACHED');
    assert.equal(report.subject_subagent, 1);
    assert.equal(report.breaches.length, 1);
    assert.equal(report.breaches[0].agentType, 'reviewer');
  });
});

test('a missing corpus is UNRESOLVED — the CI case, and it concludes nothing', () => {
  // CI has no ~/.claude/projects. The probe must say so rather than report a clean containment
  // from an empty read, which is how a check comes to pass by looking at nothing.
  const { code, report } = probe(path.join(os.tmpdir(), 'probe-wf-does-not-exist-' + process.pid));
  assert.equal(code, 2);
  assert.equal(report.verdict, 'UNRESOLVED');
  assert.match(report.note, /no transcript directory/);
});

test('main and subagent buckets are counted separately for the same tool', () => {
  // If the two collapsed, a main-session Workflow call would read as a breach and the probe would
  // report BREACHED against the real corpus — failing loudly but for the wrong reason.
  withProjects({
    'a.jsonl': [call('Bash', true), call('Workflow', false), call('Workflow', false)],
  }, ({ code, report }) => {
    assert.equal(code, 0);
    assert.equal(report.subject_main, 2);
    assert.equal(report.subject_subagent, 0);
    assert.equal(report.control.Bash.subagent, 1);
    assert.equal(report.control.Bash.main, 0);
  });
});

test('unparseable lines are skipped without derailing the scan', () => {
  // Real transcripts hold partial writes. A throw here would turn a corrupt line into a
  // conclusion about the runtime.
  withProjects({
    'a.jsonl': ['{"type":"tool_use" not json', call('Bash', true), call('Workflow', false), ''].join('\n'),
  }, ({ code, report }) => {
    assert.equal(code, 0);
    assert.equal(report.subject_main, 1);
    assert.equal(report.control_fired, true);
  });
});
