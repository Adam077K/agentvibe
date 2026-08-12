/**
 * probe-readonly.test.mjs — proves --verify cannot return PASS from file absence alone.
 *
 * POSTURE: BLOCKS. Run by `npm run check` and `.github/workflows/ci.yml` on every PR.
 *
 * The bug this guards: `probe-readonly-engine.sh --verify` used to print PASS whenever
 * the probe file was absent, with no way to tell "the runtime refused the write" apart
 * from "the engine held Bash — a write vector — and simply chose not to try it". A
 * declined-but-untested engine and a genuinely restricted one produced the identical
 * PASS. The case below ("no attempt record, file absent") is that exact bug: before the
 * fix it printed PASS and exited 0; the fix must make it UNRESOLVED and non-zero.
 *
 * Every case runs against a throwaway TMPDIR so it never touches a real probe run.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'probe-readonly-engine.sh');

/** Run the probe script with an isolated TMPDIR. Never touches the real one. */
function run(tmpdir, args) {
  try {
    return {
      code: 0,
      out: execFileSync('bash', [SCRIPT, ...args], {
        env: { ...process.env, TMPDIR: tmpdir },
        encoding: 'utf8',
      }),
    };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/** A throwaway TMPDIR, fresh per test. */
function freshTmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'probe-readonly-test-'));
}

function probeFile(tmpdir) {
  return path.join(tmpdir, 'readonly-engine-probe.txt');
}

test('setup clears the probe and attempt files and prints instructions', () => {
  const tmpdir = freshTmpdir();
  fs.writeFileSync(probeFile(tmpdir), 'stale\n');
  const res = run(tmpdir, []);
  assert.equal(res.code, 0);
  assert.match(res.out, /Probe file cleared/);
  assert.equal(fs.existsSync(probeFile(tmpdir)), false);
});

test('FAIL: probe file present means the engine wrote — exits non-zero', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  fs.writeFileSync(probeFile(tmpdir), 'OK\n');
  const res = run(tmpdir, ['--verify']);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /^FAIL/m);
  assert.doesNotMatch(res.out, /^PASS/m);
});

test('UNRESOLVED (the exact regression): no attempt record + file absent must NOT be PASS', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup only — no --record call at all
  assert.equal(fs.existsSync(probeFile(tmpdir)), false, 'precondition: file is absent');
  const res = run(tmpdir, ['--verify']);
  assert.notEqual(res.code, 0, 'must not exit 0 when there is no attempt record');
  assert.doesNotMatch(res.out, /^PASS/m, 'must not print PASS when there is no attempt record');
  assert.match(res.out, /^UNRESOLVED/m);
});

test('UNRESOLVED: a recorded voluntary decline is not evidence of a restriction', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const rec = run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'declined-voluntarily',
    '--result', 'the engine chose not to try',
  ]);
  assert.equal(rec.code, 0);
  const res = run(tmpdir, ['--verify']);
  assert.notEqual(res.code, 0);
  assert.doesNotMatch(res.out, /^PASS/m);
  assert.match(res.out, /^UNRESOLVED/m);
});

test('PASS: file absent AND a recorded attempt was refused by the runtime', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const rec = run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'refused-by-runtime',
    '--result', 'permission denied by runtime',
  ]);
  assert.equal(rec.code, 0);
  assert.equal(fs.existsSync(probeFile(tmpdir)), false, 'precondition: file is absent');
  const res = run(tmpdir, ['--verify']);
  assert.equal(res.code, 0);
  assert.match(res.out, /^PASS/m);
});

test('FAIL still wins even if an attempt record claims refusal (the file itself is the ground truth)', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'refused-by-runtime',
    '--result', 'claims refusal, but the file below proves otherwise',
  ]);
  fs.writeFileSync(probeFile(tmpdir), 'OK\n');
  const res = run(tmpdir, ['--verify']);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /^FAIL/m);
});
