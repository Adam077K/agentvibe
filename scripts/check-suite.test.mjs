// POSTURE: BLOCKS. Wired into `npm run check` as `test:check-suite`, second in the suite —
// right after the tripwire, because this is the check that says whether the other checks are
// in the suite at all.
//
// scripts/check-suite.test.mjs — the drift guard for `npm run check`, and the mutation gate for
// the runner that replaced its `&&` chain.
//
// WHY THIS FILE EXISTS: the suite was thirty steps joined by `&&`. Step 21, `check:mc`, fails on
// any machine that has not run `bun install` in mission-control/, and `&&` stops there — so nine
// steps never ran, including every safety-hook test and `test:sandbox`, while the output reported
// one failure. The runner fixes the instance. This file fixes the class, in two halves:
//
//   THE DRIFT GUARD — a check:/test: script that exists in package.json but is reachable from
//   nothing in the suite fails here. A future script cannot be added and silently left out.
//
//   THE RUNNER'S BEHAVIOUR — that it keeps going after a failure, tallies honestly, exits
//   non-zero, and does not truncate. Every case CONSTRUCTS the condition in a fixture repo and
//   reads what came back, rather than asserting against the working tree, which would pass or
//   fail for reasons the test did not choose.
//
// WHAT IT ASSERTS, AND WHAT IT LEAVES OPEN:
//   ✓ the guard REFUSES a real package.json with a step removed from STEPS — proved by mutation,
//     not by a green run against a tree where nothing is wrong
//   ✓ transitive reach counts, so check:ledger's three tests are not duplicated into STEPS
//   ✓ the runner runs a step after an earlier one failed, and says so in the tally
//   ✓ ~200KB of step output survives to the caller through a pipe — the process.exit() defect
//   ✓ a ZERO-step run is refused, and --steps/--root are refused outright without the harness
//     variable. Both are new, and both are here because the runner shipped printing
//     "✓ check suite passed — every step ran." at exit 0 for `node scripts/run-checks.mjs
//     --steps ,` — a green floor from a process that ran nothing, reachable from `npm run check`
//     by appending arguments, in the one place a prompt-injected diff is modelled as steering
//     what the oracle reads
//   ✓ a passing SUBSET says it is a subset and does not print the whole-suite verdict
//   ✗ nothing here checks that a step ASSERTS anything. Wiring is not value: a step that exits 0
//     unconditionally passes this file and always will.
//   ✗ nothing here runs the real 30 steps for real. The full-suite verdict IS covered, against a
//     fixture that stubs all 30 names green — which proves the wording and the count, not the
//     checks. Running them for real is `npm run check` itself, and it takes minutes.
//     *Superseded 2026-08-25: this line said "the real 31 steps". STEPS held 31 only between
//     `test:check-suite` being added and `check:mc` being excluded; derive it, never recall it —
//     `node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"`.*

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { STEPS, EXCLUDED, auditSuite, reachable } = require('./lib/check-suite.js');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNNER = path.join(REPO, 'scripts', 'run-checks.mjs');
const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
const scripts = pkg.scripts;

// ── The drift guard, against the real package.json ───────────────────────────────────────────

test('every check:/test: script in package.json is reached by the suite, or excluded with a reason', () => {
  const { failures } = auditSuite({ scripts });
  assert.deepEqual(failures, [], `\n${failures.join('\n')}\n`);
});

test('the guard REFUSES a suite with a step removed — a guard that cannot fail is not evidence', () => {
  const without = STEPS.filter((s) => s !== 'test:sandbox');
  const { failures } = auditSuite({ scripts, steps: without });

  assert.equal(failures.length, 1, `expected exactly one finding, got:\n${failures.join('\n')}`);
  assert.match(failures[0], /"test:sandbox" is a check:\/test: script/);
  assert.match(failures[0], /never run under `npm run check`/);
});

test('the guard REFUSES a package.json that adds an unwired check: script', () => {
  const mutated = { ...scripts, 'check:brand-new': 'node scripts/does-not-matter.mjs' };
  const { failures } = auditSuite({ scripts: mutated });

  assert.equal(failures.length, 1, `expected exactly one finding, got:\n${failures.join('\n')}`);
  assert.match(failures[0], /"check:brand-new"/);
});

test('the guard REFUSES re-inlining the && chain into package.json', () => {
  const mutated = { ...scripts, check: 'npm run lint:agents && npm run test:sandbox' };
  const { failures } = auditSuite({ scripts: mutated, steps: [] });

  assert.ok(
    failures.some((f) => f.includes('no longer runs scripts/run-checks.mjs')),
    `expected a runner finding, got:\n${failures.join('\n')}`
  );
});

test('the guard REFUSES a stale or unreasoned exclusion', () => {
  const gone = auditSuite({ scripts, excluded: { ...EXCLUDED, 'test:deleted-long-ago': 'x'.repeat(60) } });
  assert.ok(
    gone.failures.some((f) => f.includes('no longer a script in package.json')),
    `expected a stale-exclusion finding, got:\n${gone.failures.join('\n')}`
  );

  // Every entry, not a representative one: an exclusion mechanism that accepts an empty reason for
  // the entry someone actually cares about is worse than no exclusion mechanism.
  for (const name of Object.keys(EXCLUDED)) {
    const thin = auditSuite({ scripts, excluded: { ...EXCLUDED, [name]: 'later' } });
    assert.ok(
      thin.failures.some((f) => f.includes(`EXCLUDED["${name}"] has no substantive reason`)),
      `stripping the reason from ${name} did not bite:\n${thin.failures.join('\n')}`
    );
  }

  const live = auditSuite({ scripts, excluded: { ...EXCLUDED, 'test:sandbox': 'y'.repeat(60) } });
  assert.ok(
    live.failures.some((f) => f.includes('but the suite does reach it')),
    `expected a live-exclusion finding, got:\n${live.failures.join('\n')}`
  );
});

test('the guard REFUSES a step naming a script that does not exist, and a duplicated step', () => {
  const ghost = auditSuite({ scripts, steps: [...STEPS, 'test:imaginary'] });
  assert.ok(
    ghost.failures.some((f) => f.includes('which is not a script in package.json')),
    `expected a ghost-step finding, got:\n${ghost.failures.join('\n')}`
  );

  const twice = auditSuite({ scripts, steps: [...STEPS, 'test:sandbox'] });
  assert.ok(
    twice.failures.some((f) => f.includes('more than once')),
    `expected a duplicate-step finding, got:\n${twice.failures.join('\n')}`
  );
});

test('transitive reach counts — the five delegating parents are not duplicated into STEPS', () => {
  const reached = reachable(scripts, STEPS);
  for (const [child, parent] of [
    ['test:claims', 'check:ledger'],
    ['test:classifier', 'check:ledger'],
    ['test:ledger', 'check:ledger'],
    ['test:dispatch', 'check:dispatch'],
    ['test:warroom', 'check:warroom'],
    ['test:memory', 'check:memory'],
    ['test:dispatch-prompt', 'check:dispatch-prompt'],
  ]) {
    assert.ok(reached.has(child), `${child} is not reachable — ${parent} should reach it`);
    assert.ok(!STEPS.includes(child), `${child} was duplicated into STEPS; ${parent} already runs it`);
  }
});

test('the nine steps the && chain used to skip are all in the suite', () => {
  const skipped = [
    'test:probe-readonly', 'test:pre-tool-use', 'test:run-gate', 'test:tier-gate',
    'test:merge-gate', 'test:skill-clamp', 'test:probe-stop-reason',
    'test:launcher-permissions', 'test:sandbox',
  ];
  for (const s of skipped) {
    assert.ok(STEPS.includes(s), `${s} is not in the suite — it is the reason this file exists`);
  }
});

test('check:mc is EXCLUDED, not merely absent — and the reason carries its measurement', () => {
  // Absent-with-no-entry is the silent omission this guard exists to catch, and it would look
  // identical to a considered decision from the outside. Only the EXCLUDED entry tells them apart.
  assert.ok(!STEPS.includes('check:mc'), 'check:mc is back in STEPS; it cannot pass as a child under the sandbox');
  assert.ok(
    Object.prototype.hasOwnProperty.call(EXCLUDED, 'check:mc'),
    'check:mc left STEPS with no EXCLUDED entry — that is the silent omission, wearing the fix as a hat'
  );
  assert.match(EXCLUDED['check:mc'], /345 pass \/ 0 fail/);
  assert.match(EXCLUDED['check:mc'], /344 pass \/ 1 fail/);
});

// ── The runner's behaviour, against fixture repos ────────────────────────────────────────────

const fixtures = [];
process.on('exit', () => {
  for (const d of fixtures) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ } }
});

/** A throwaway npm project whose scripts do exactly what a case needs and nothing else. */
function fixture(fixtureScripts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-suite-fixture-'));
  fixtures.push(dir);
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'fixture', version: '0.0.0', private: true, scripts: fixtureScripts }, null, 2)
  );
  return dir;
}

/**
 * Drive the runner over a fixture repo.
 *
 * `--steps`/`--root` are gated on CHECK_SUITE_TEST_HARNESS, so every case here sets it. `harness:
 * false` is how the gate itself gets tested — the same spawn an ordinary caller would make.
 * `steps: null` omits `--steps` entirely, which is what makes a run the FULL suite.
 */
function runRunner(dir, steps, { harness = true } = {}) {
  const args = [RUNNER, '--root', dir];
  if (steps !== null) args.push('--steps', Array.isArray(steps) ? steps.join(',') : steps);

  const env = { ...process.env };
  if (harness) env.CHECK_SUITE_TEST_HARNESS = '1';
  else delete env.CHECK_SUITE_TEST_HARNESS;

  const r = spawnSync('node', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

const OK = (marker) => `node -e "console.log('${marker}')"`;
const BAD = (marker) => `node -e "console.log('${marker}'); process.exitCode = 1"`;

test('a failing step does not stop the ones after it — the whole point', () => {
  const dir = fixture({
    'test:alpha': OK('ALPHA-RAN'),
    'test:beta': BAD('BETA-RAN'),
    'test:gamma': OK('GAMMA-RAN'),
  });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:beta', 'test:gamma']);

  assert.ok(out.includes('GAMMA-RAN'), `the step after the failure did not run:\n${out}`);
  assert.ok(out.includes('ALPHA-RAN') && out.includes('BETA-RAN'), `earlier steps missing:\n${out}`);
  assert.equal(code, 1, 'a suite with a failing step must exit non-zero');
});

test('the summary tallies honestly and names every failing step', () => {
  const dir = fixture({
    'test:alpha': OK('a'),
    'test:beta': BAD('b'),
    'test:gamma': OK('g'),
    'test:delta': BAD('d'),
  });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:beta', 'test:gamma', 'test:delta']);

  assert.match(out, /Tally: 2 of 4 passed · 2 failed/, `tally wrong or missing:\n${out}`);
  assert.match(out, /FAILED — 2 of 4 step\(s\) run did not pass/);
  assert.match(out, /✗\s+2\. test:beta — exit 1/);
  assert.match(out, /✗\s+4\. test:delta — exit 1/);
  assert.match(out, /reproduce: npm run test:beta/);
  assert.equal(code, 1);
});

test('nothing reassuring is printed above the failure list', () => {
  const dir = fixture({ 'test:alpha': OK('a'), 'test:beta': BAD('b') });
  const { out } = runRunner(dir, ['test:alpha', 'test:beta']);

  const verdict = out.indexOf('FAILED — ');
  assert.ok(verdict > 0, `no FAILED verdict in:\n${out}`);
  assert.ok(
    !out.slice(0, verdict).includes('✓'),
    'a ✓ appears above the failure list — an agent skimming the tail would read a partial run as clean'
  );
  assert.ok(!out.includes('check suite passed'), 'a failing run claimed the suite passed');
});

test('an all-passing SUBSET exits 0, says it is a subset, and does not claim the suite passed', () => {
  const dir = fixture({ 'test:alpha': OK('a'), 'test:beta': OK('b'), 'test:gamma': OK('g') });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:beta', 'test:gamma']);

  assert.equal(code, 0, `expected exit 0, got ${code}:\n${out}`);
  assert.match(out, /Tally: 3 of 3 passed · 0 failed/);
  assert.match(out, /SUBSET RUN/, `a three-step run did not announce itself as a subset:\n${out}`);
  assert.match(out, /✓ 3 of 3 SELECTED step\(s\) passed/);
  // The reserved wording. An agent matching the whole-suite verdict must not be handed a green
  // three-step run wearing it — that phrase is the one `npm run check` earns and nothing else does.
  assert.ok(
    !out.includes('check suite passed — every step ran'),
    `a subset run printed the whole-suite verdict:\n${out}`
  );
  assert.ok(!out.includes('FAILED'), `a clean run mentioned FAILED:\n${out}`);
});

test('a run of the FULL declared suite earns the whole-suite verdict', () => {
  // Every real step name, stubbed green. This exercises STEPS itself and the no---steps path, so
  // the reserved wording above is pinned by a passing case as well as by the negative one; it
  // proves the phrasing and the count, not that any check asserts anything.
  const dir = fixture(Object.fromEntries(STEPS.map((s) => [s, OK(`RAN-${s}`)])));
  const { code, out } = runRunner(dir, null);

  assert.equal(code, 0, `expected exit 0, got ${code}:\n${out.slice(-800)}`);
  assert.match(out, new RegExp(`check suite — ${STEPS.length} steps, all of them`));
  assert.match(out, new RegExp(`Tally: ${STEPS.length} of ${STEPS.length} passed · 0 failed`));
  assert.match(out, /✓ check suite passed — every step ran\./);
  assert.ok(!out.includes('SUBSET RUN'), `the full suite called itself a subset:\n${out}`);
});

// ── The refusals: a run that established nothing must not read as a run that established a floor ──

test('a ZERO-step run is REFUSED — it is the maximal partial run, not a pass', () => {
  const dir = fixture({ 'test:alpha': OK('a') });

  for (const empty of [',', '', '   ', ',,,', ' , , ']) {
    const { code, out } = runRunner(dir, empty);

    assert.equal(code, 1, `--steps ${JSON.stringify(empty)} did not exit 1:\n${out}`);
    assert.match(out, /REFUSED — no check ran/, `no refusal for ${JSON.stringify(empty)}:\n${out}`);
    assert.ok(
      !out.includes('✓'),
      `a ✓ appears in a run that executed nothing (--steps ${JSON.stringify(empty)}):\n${out}`
    );
    assert.ok(!out.includes('check suite passed'), `a zero-step run claimed the suite passed:\n${out}`);
    assert.ok(!/Tally:/.test(out), `a zero-step run printed a tally, which reads as coverage:\n${out}`);
  }
});

test('--steps and --root are REFUSED without the harness variable — the injection path', () => {
  // `npm run check -- --steps ,` forwards straight to the runner. This is the guard that stops an
  // argument string from deciding how much of the oracle's floor runs; the zero-step guard above
  // is deliberately independent of it, so neither is the only thing standing there.
  const dir = fixture({ 'test:alpha': OK('a') });

  const empty = runRunner(dir, ',', { harness: false });
  assert.equal(empty.code, 1, `unharnessed --steps , did not exit 1:\n${empty.out}`);
  assert.match(empty.out, /REFUSED — no check ran/);
  assert.match(empty.out, /--steps and --root — test-only/);
  assert.ok(!empty.out.includes('✓'), `a ✓ appears in a refusal:\n${empty.out}`);

  // Not just the empty case: a NON-empty subset is refused too, so the gate is the flags
  // themselves and not a second spelling of the zero-step check.
  const nonEmpty = runRunner(dir, ['test:alpha'], { harness: false });
  assert.equal(nonEmpty.code, 1, `unharnessed --steps test:alpha did not exit 1:\n${nonEmpty.out}`);
  assert.ok(!nonEmpty.out.includes('ALPHA'), 'a refused invocation still ran a step');

  // And the refusal survives a pipe intact — it is the one path that may call process.exit().
  assert.match(empty.out, /the whole suite\s+npm run check/, `refusal truncated:\n${empty.out}`);
  assert.match(empty.out, /═{78}\n$/, `refusal did not reach its closing rule:\n${empty.out.slice(-200)}`);
});

test('a subset flag with no value is REFUSED, not ignored', () => {
  // `--steps ""` used to fall through to the FULL suite — an empty string is falsy — while the
  // banner announced a subset. Present-with-no-value is malformed; dropping it on the floor
  // leaves a caller believing a flag took effect that decided what ran.
  const dir = fixture({ 'test:alpha': OK('ALPHA-RAN') });

  const r = spawnSync('node', [RUNNER, '--root', dir, '--steps'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CHECK_SUITE_TEST_HARNESS: '1' },
  });

  assert.equal(r.status, 1, `a valueless --steps exited ${r.status}:\n${r.stdout}`);
  assert.match(r.stdout, /--steps was given with no value after it/);
  assert.ok(!r.stdout.includes('✓'), `a ✓ appears in a refusal:\n${r.stdout}`);
});

test('a step set of only unknown names cannot report clean — unresolvable is failure, not zero', () => {
  // The other half of "an empty or unresolvable step set is never a pass": names that resolve to
  // no script must be counted and named as failures, not quietly dropped to produce a short green
  // run. `npm run <missing>` exits non-zero, and the runner must carry that through.
  const dir = fixture({ 'test:alpha': OK('a') });
  const { code, out } = runRunner(dir, ['test:ghost-one', 'test:ghost-two']);

  assert.equal(code, 1, `a suite of nothing-but-unknown steps exited ${code}:\n${out}`);
  assert.match(out, /Tally: 0 of 2 passed · 2 failed/, `unknown steps were not counted as failed:\n${out}`);
  assert.match(out, /✗\s+1\. test:ghost-one/);
  assert.match(out, /✗\s+2\. test:ghost-two/);
  assert.ok(!out.includes('check suite passed'), `an all-unknown run claimed the suite passed:\n${out}`);
});

test('a step that cannot start is a failure, not a skip', () => {
  const dir = fixture({ 'test:alpha': OK('a') });
  const { code, out } = runRunner(dir, ['test:alpha', 'test:no-such-script']);

  assert.match(out, /Tally: 1 of 2 passed · 1 failed/, `a missing script was not counted as failed:\n${out}`);
  assert.equal(code, 1);
});

test('~200KB of step output reaches the caller through a pipe — no 64KB truncation', () => {
  // process.exit() does not flush an async pipe write; the payload is cut at exactly 65536 bytes
  // and the status stays 0. The runner sets process.exitCode instead. This is the proof.
  const PAYLOAD = 200_000;
  const dir = fixture({
    'test:loud': `node -e "process.stdout.write('x'.repeat(${PAYLOAD}) + '\\n')"`,
    'test:after': OK('AFTER-THE-FLOOD'),
  });
  const { code, out } = runRunner(dir, ['test:loud', 'test:after']);

  const run = /x{1000,}/.exec(out);
  assert.ok(run, `the payload did not arrive at all:\n${out.slice(0, 500)}`);
  assert.equal(run[0].length, PAYLOAD, `payload truncated at ${run[0].length} bytes (64KB is 65536)`);
  assert.ok(out.includes('AFTER-THE-FLOOD'), 'the step after the large write did not run');
  assert.match(out, /Tally: 2 of 2 passed/, `the summary was lost after a large write:\n${out.slice(-400)}`);
  assert.equal(code, 0);
});
