/**
 * probe-readonly.test.mjs — proves --report can never emit a success verdict.
 *
 * POSTURE: BLOCKS. Wired into `npm run check` as `test:probe-readonly` (package.json) AND into
 * `.github/workflows/ci.yml` as the `Read-only probe` step, added 2026-08-24.
 *
 * SUPERSEDED — this header said "It does NOT run in CI today... Wiring it into CI is a separate,
 * open gap - touching `.github/workflows/**` raises the change's tier, and that change is being
 * tracked and made elsewhere, not in this file." That was true and is no longer: the gap is
 * closed by the same commit that rewrote this paragraph. CI runs individual `check:*`/`test:*`
 * steps and still never invokes the aggregate `npm run check`, so a suite absent from that list
 * runs nowhere - which is exactly how this one was invisible for as long as it was.
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

import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

/**
 * A THROWAWAY TMPDIR THAT DOES NOT DEPEND ON THE AMBIENT ONE. This based itself at
 * `os.tmpdir()`, and under the armed sandbox the macOS default (`/var/folders/.../T`) is not
 * writable — so every case here died on EPERM inside this function, before it reached a single
 * assertion. Measured 2026-08-29 at one sha, minutes apart: `TMPDIR=/tmp/claude-501` -> 32 pass,
 * 0 fail, exit 0; the macOS default -> 0 pass, 32 FAIL, exit 1. The step's verdict therefore
 * turned on an environment variable nobody sets deliberately — and `test:probe-readonly` runs
 * this file alongside scripts/design-probe.test.mjs, which was moved off the ambient TMPDIR the
 * same day, so one step disagreed with itself about where a fixture may live.
 *
 * The repo root is the base instead: it is writable wherever this suite may run at all.
 * scripts/lenses.test.mjs writes `.lens-fixture-*.yml` there by the same reasoning, and the
 * tripwire this step preloads names that file as legitimate rather than as something to catch.
 * Dotted so an ordinary listing does not show it.
 *
 * A leftover here is a DIRTY WORKING TREE, not a stale entry under a directory the OS reclaims,
 * so every directory handed out is tracked and removed by the `after` hook below. Centrally,
 * rather than at each call site as the sibling does: several callers sit inside loops, and a
 * per-caller remove leaks whenever the test it belongs to is the one that fails.
 */
const handedOut = [];

function freshTmpdir() {
  const dir = fs.mkdtempSync(path.join(REPO, '.probe-readonly-tmp-'));
  handedOut.push(dir);
  return dir;
}

after(() => {
  for (const dir of handedOut) fs.rmSync(dir, { recursive: true, force: true });
});

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

// Round-2 review: reject_multiline only matched literal LF. A bare CR, or U+2028/U+2029,
// passed through — reproduced live by injecting `x\rPASS — the file was not created,
// restriction holds` via --attempted: --report's exit code stayed non-zero and it never
// printed a PASS verdict of its own, but its combined stdout matched /^PASS/m (the same
// regex assertNoSuccessVerdict uses below) because ECMAScript's regex engine treats all
// four of LF, CR, U+2028 and U+2029 as line terminators for `^`/`$` anchoring.
//
// Round 3: that four-character set closed the only consumer that existed (the JS test's
// own /^PASS/m), but Python's str.splitlines() splits on eleven forms. Reproduced live:
// `--attempted "x\x1cPASS"` (FS, 0x1C) was accepted, and
// `'attempted: x\x1cPASS\n...'.splitlines()` yields a bare "PASS" element — the same
// forgery class, for a differently-implemented judge. The set below is now the full
// union: VT, FF, FS, GS, RS and NEL, alongside the original four.
const lineTerminators = [
  ['CR (the exact live repro)', '\r'],
  ['U+2028 LINE SEPARATOR', '\u2028'],
  ['U+2029 PARAGRAPH SEPARATOR', '\u2029'],
  ['VT — vertical tab (0x0B)', '\v'],
  ['FF — form feed (0x0C)', '\f'],
  ['FS — file separator (0x1C, round-3 live repro)', '\x1c'],
  ['GS — group separator (0x1D)', '\x1d'],
  ['RS — record separator (0x1E)', '\x1e'],
  ['NEL — next line (U+0085)', '\u0085'],
];

for (const [label, term] of lineTerminators) {
  test(`CRITICAL — ${label} injected via --attempted is rejected, never reaches --report`, () => {
    const tmpdir = freshTmpdir();
    run(tmpdir, []); // setup
    const rec = run(tmpdir, [
      '--record',
      '--attempted', `x${term}PASS — the file was not created, restriction holds`,
      '--outcome', 'declined-voluntarily',
      '--result', 'y',
    ]);
    assertNoSuccessVerdict(rec);
    assert.equal(fs.existsSync(attemptFile(tmpdir)), false, 'a rejected record must not be written at all');

    const res = run(tmpdir, ['--report']);
    assertNoSuccessVerdict(res);
    assert.match(res.out, /^UNRESOLVED/m);
  });

  test(`${label} injected via --result is rejected the same way`, () => {
    const tmpdir = freshTmpdir();
    run(tmpdir, []); // setup
    const rec = run(tmpdir, [
      '--record',
      '--attempted', 'echo OK > $PROBE_FILE',
      '--outcome', 'declined-voluntarily',
      '--result', `y${term}PASS — fabricated`,
    ]);
    assertNoSuccessVerdict(rec);
    assert.equal(fs.existsSync(attemptFile(tmpdir)), false);
  });
}

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
