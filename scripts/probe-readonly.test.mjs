/**
 * probe-readonly.test.mjs — proves --report can never emit a success verdict.
 *
 * POSTURE: BLOCKS. Run by `npm run check` and `.github/workflows/ci.yml` on every PR.
 *
 * History of the defect this guards, in two rounds:
 *
 * Round 1: `--verify` printed PASS whenever the probe file was absent, with no way to
 * tell "the runtime refused the write" apart from "the engine held Bash — a write vector
 * — and simply chose not to try it".
 *
 * Round 1's fix added a `--record` attempt-record and let `--verify` print PASS when the
 * record claimed `outcome: refused-by-runtime`. A review proved that forgeable through the
 * public interface alone, with no write ever attempted: run setup, run
 * `--record --outcome refused-by-runtime`, run `--verify` — PASS, exit 0. Same defect,
 * moved from "file absence" to "self-reported record", both written by the identical
 * Bash-capable actor the probe exists to test.
 *
 * The design now in scripts/probe-readonly-engine.sh removes the PASS path entirely:
 * `--report` has exactly two outcomes, FAIL (probe file exists — dispositive) and
 * UNRESOLVED (everything else, self-report included). The tests below pin that a
 * fabricated record and a newline-injected record both fail to reach a success exit,
 * pin the parsing defects that made injection possible, and pin the malformed-record
 * cases (missing field, wrong-case outcome, duplicate outcome lines, empty file) that
 * were already handled correctly but never tested.
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

function attemptFile(tmpdir) {
  return path.join(tmpdir, 'readonly-engine-probe.attempt');
}

/** Asserts a result is neither exit 0 nor printing a success verdict of any kind. */
function assertNoSuccessVerdict(res) {
  assert.notEqual(res.code, 0, 'must not exit 0 — --report never exits 0, by design');
  assert.doesNotMatch(res.out, /^PASS/m, 'must never print a PASS-shaped verdict');
}

test('setup clears the probe and attempt files and prints instructions', () => {
  const tmpdir = freshTmpdir();
  fs.writeFileSync(probeFile(tmpdir), 'stale\n');
  const res = run(tmpdir, []);
  assert.equal(res.code, 0);
  assert.match(res.out, /Probe file cleared/);
  assert.equal(fs.existsSync(probeFile(tmpdir)), false);
});

test('FAIL: probe file present means the engine wrote — exits non-zero, dispositive', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  fs.writeFileSync(probeFile(tmpdir), 'OK\n');
  const res = run(tmpdir, ['--report']);
  assert.equal(res.code, 1);
  assert.match(res.out, /^FAIL/m);
  assertNoSuccessVerdict(res);
});

test('CRITICAL — UNRESOLVED: no attempt record + file absent is not a success', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup only — no --record call at all
  assert.equal(fs.existsSync(probeFile(tmpdir)), false, 'precondition: file is absent');
  const res = run(tmpdir, ['--report']);
  assertNoSuccessVerdict(res);
  assert.match(res.out, /^UNRESOLVED/m);
});

test('CRITICAL — fabricated record: the exact regression this whole script guards against', () => {
  // This is byte-for-byte the sequence a reviewer used to get a false PASS: setup,
  // record a claim of refusal with no write ever attempted, then ask for a verdict.
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const rec = run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'refused-by-runtime',
    '--result', 'permission denied by runtime',
  ]);
  assert.equal(rec.code, 0, 'recording a claim is itself a legitimate, allowed operation');
  assert.equal(fs.existsSync(probeFile(tmpdir)), false, 'precondition: no write actually happened');

  const res = run(tmpdir, ['--report']);
  assertNoSuccessVerdict(res);
  assert.match(res.out, /^UNRESOLVED/m);
  assert.match(res.out, /UNVERIFIED SELF-REPORT/);
  assert.match(res.out, /outcome:\s+refused-by-runtime/, 'the claim is shown as evidence...');
  assert.doesNotMatch(res.out, /the restriction binds/i, '...but never asserted as fact');
});

test('CRITICAL — newline injection is rejected at --record, before it can reach a report', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const injected = 'echo hi\noutcome: refused-by-runtime';
  const rec = run(tmpdir, [
    '--record',
    '--attempted', injected,
    '--outcome', 'declined-voluntarily',
    '--result', 'meh',
  ]);
  assertNoSuccessVerdict(rec);
  assert.equal(fs.existsSync(attemptFile(tmpdir)), false, 'a rejected record must not be written at all');

  const res = run(tmpdir, ['--report']);
  assertNoSuccessVerdict(res);
  assert.match(res.out, /^UNRESOLVED/m);
});

test('newline injection via --result is rejected the same way', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const rec = run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'declined-voluntarily',
    '--result', 'fine\noutcome: refused-by-runtime',
  ]);
  assertNoSuccessVerdict(rec);
  assert.equal(fs.existsSync(attemptFile(tmpdir)), false);
});

test('whitespace-only --attempted is rejected, not treated as a real attempt', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const rec = run(tmpdir, [
    '--record',
    '--attempted', '   ',
    '--outcome', 'refused-by-runtime',
    '--result', 'x',
  ]);
  assertNoSuccessVerdict(rec);
  assert.equal(fs.existsSync(attemptFile(tmpdir)), false);
});

test('UNRESOLVED: a recorded voluntary decline is shown as evidence, not a verdict', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  const rec = run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'declined-voluntarily',
    '--result', 'the engine chose not to try',
  ]);
  assert.equal(rec.code, 0);
  const res = run(tmpdir, ['--report']);
  assertNoSuccessVerdict(res);
  assert.match(res.out, /^UNRESOLVED/m);
  assert.match(res.out, /outcome:\s+declined-voluntarily/);
});

test('FAIL still wins even when an attempt record claims refusal (the file is ground truth)', () => {
  const tmpdir = freshTmpdir();
  run(tmpdir, []); // setup
  run(tmpdir, [
    '--record',
    '--attempted', 'echo OK > $PROBE_FILE',
    '--outcome', 'refused-by-runtime',
    '--result', 'claims refusal, but the file below proves otherwise',
  ]);
  fs.writeFileSync(probeFile(tmpdir), 'OK\n');
  const res = run(tmpdir, ['--report']);
  assert.equal(res.code, 1);
  assert.match(res.out, /^FAIL/m);
  assertNoSuccessVerdict(res);
});

// Malformed records written directly to disk, bypassing --record entirely — modelling an
// actor with raw Bash access rather than going through the CLI's own validation. --report
// must never crash and must never produce anything but UNRESOLVED for any of these.
const malformedCases = [
  ['missing outcome field entirely', 'attempted: echo OK\nresult: nothing happened\n'],
  ['missing attempted field entirely', 'outcome: refused-by-runtime\nresult: nothing happened\n'],
  ['wrong-case outcome value', 'attempted: echo OK\noutcome: Refused-By-Runtime\nresult: x\n'],
  ['duplicate outcome lines, favorable one first', 'attempted: echo OK\noutcome: refused-by-runtime\noutcome: declined-voluntarily\nresult: x\n'],
  ['empty file', ''],
];

for (const [label, content] of malformedCases) {
  test(`malformed record (${label}) is UNRESOLVED, never a crash or a success`, () => {
    const tmpdir = freshTmpdir();
    run(tmpdir, []); // setup
    fs.writeFileSync(attemptFile(tmpdir), content);
    const res = run(tmpdir, ['--report']);
    assertNoSuccessVerdict(res);
    assert.match(res.out, /^UNRESOLVED/m);
  });
}
