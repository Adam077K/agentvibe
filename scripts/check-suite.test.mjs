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
//   ✓ a real Ctrl+C — SIGINT to the process GROUP, not to the child alone — reaches the
//     INCOMPLETE verdict. It did not before: the parent took Node's default kill while spawnSync
//     had the event loop blocked, so the path the header promises was unreachable for the one
//     case that happens
//   ✓ deleting `lint:agents` from STEPS now fails. GOVERNED matched only check:/test:, so the
//     agent schema linter could leave the suite in silence — and every STEP is now checked for
//     being governed at all, which covers the next prefix rather than the three we thought of
//   ✗ nothing here can check that the pass/fail figures written into EXCLUDED['check:mc'] are
//     TRUE. A regex over the reason string used to pin them, kept passing after they stopped
//     reproducing, and so reported green on exactly the defect it sat next to. The citations are
//     checked instead — ci.yml, .claude/settings.json — because those resolve.
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
import { spawn, spawnSync } from 'node:child_process';
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

test('the guard REFUSES deleting lint:agents from STEPS — the prefix that was not governed', () => {
  // GOVERNED read /^(?:check|test):/, so `lint:agents` — the agent schema linter, step 3 of the
  // suite — could be removed from STEPS and this guard stayed GREEN. Reproduced before the fix:
  // auditSuite() returned zero failures. It is the same silent-omission defect as check:mc leaving
  // without an EXCLUDED entry, arriving through the name instead of the list.
  const without = STEPS.filter((s) => s !== 'lint:agents');
  const { failures } = auditSuite({ scripts, steps: without });

  assert.ok(
    failures.some((f) => f.includes('"lint:agents"') && f.includes('never run under `npm run check`')),
    `deleting lint:agents from STEPS did not bite:\n${failures.join('\n') || '(no failures at all)'}`
  );
});

test('every STEP is GOVERNED — an ungoverned step could leave the suite in silence', () => {
  // The class fix behind the case above. Widening a prefix list only covers the prefixes someone
  // thought of; this covers the next one. Asserted against the real STEPS, and then by mutation.
  const { failures } = auditSuite({ scripts });
  assert.deepEqual(failures, [], `\n${failures.join('\n')}\n`);

  const smuggled = auditSuite({
    scripts: { ...scripts, 'build:something': 'node scripts/does-not-matter.mjs' },
    steps: [...STEPS, 'build:something'],
  });
  assert.ok(
    smuggled.failures.some((f) => f.includes('outside GOVERNED')),
    `an ungoverned step was accepted into the suite:\n${smuggled.failures.join('\n')}`
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
  assert.ok(!STEPS.includes('check:mc'), 'check:mc is back in STEPS; it fails under the armed sandbox');
  assert.ok(
    Object.prototype.hasOwnProperty.call(EXCLUDED, 'check:mc'),
    'check:mc left STEPS with no EXCLUDED entry — that is the silent omission, wearing the fix as a hat'
  );

  // NO PIN ON THE PASS/FAIL FIGURES, deliberately, and this is a retraction.
  //
  // This test used to assert /345 pass \/ 0 fail/ and /344 pass \/ 1 fail/ over the reason string.
  // Both kept passing for weeks after the measurement they quoted stopped reproducing: the pair was
  // taken while .claude/settings.json carried a `sandbox.excludedCommands` entry, ab46d40 reverted
  // the key, and a regex over prose cannot tell that the world moved. It reported green on the exact
  // defect it was positioned to catch, which is worse than not existing — it made the entry look
  // pinned. A number appearing in a comment is not evidence the number is true, and nothing here can
  // make it evidence without running check:mc, which takes 3.5 minutes and needs bun deps.
  //
  // So the figures are checked by a human re-measuring, and this file checks the CITATIONS instead,
  // in the test below: they are the parts of the reason that live in this repo and can be resolved.
});

test('an exclusion that says CI still covers it is checked against ci.yml, not trusted', () => {
  // auditSuite() can only measure that a reason is 40-odd characters long. It cannot tell a true
  // reason from a false one, and one went false without a sound: the check:mc entry justified
  // itself by a `sandbox.excludedCommands` key in .claude/settings.json that ab46d40 had already
  // reverted. Citations to files in this repo CAN be checked, so these are.
  const ci = fs.readFileSync(path.join(REPO, '.github', 'workflows', 'ci.yml'), 'utf8');

  /** Names whose reason claims ci.yml covers them, where ci.yml does not invoke them. */
  const uncovered = (excluded, workflow) =>
    Object.entries(excluded)
      .filter(([name, reason]) => /ci\.yml/.test(reason) && !workflow.includes(`npm run ${name}`))
      .map(([name]) => name);

  assert.deepEqual(
    uncovered(EXCLUDED, ci),
    [],
    'an exclusion tells the reader ci.yml still runs it, and ci.yml does not. Either the CI step was ' +
      'deleted — in which case that exclusion now hides a check running NOWHERE — or the reason cites ' +
      'coverage that never existed.'
  );

  // Proved by mutation, like every other guard here: delete the CI step and the claim must bite.
  const withoutStep = ci.replace(/npm run check:mc/g, 'npm run something-else');
  assert.deepEqual(
    uncovered(EXCLUDED, withoutStep),
    ['check:mc'],
    'removing the Mission Control step from ci.yml did not fail this check, so it is not evidence'
  );

  // And the fact the check:mc entry's account of its own history depends on. If someone reinstates
  // a sandbox.excludedCommands key, that entry has to be re-measured, not re-read.
  const settings = JSON.parse(fs.readFileSync(path.join(REPO, '.claude', 'settings.json'), 'utf8'));
  assert.ok(
    !(settings.sandbox && 'excludedCommands' in settings.sandbox),
    'sandbox.excludedCommands is back in .claude/settings.json. The check:mc exclusion states that both ' +
      'its cells fail BECAUSE that key is absent; with it present, standalone check:mc may pass again and ' +
      'the entry needs re-measuring rather than a re-read.'
  );
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

test('a real Ctrl+C prints INCOMPLETE and names what never started', async () => {
  // The header promises this path and, for the case that actually happens, it could not run. A
  // terminal signals the whole process GROUP; with no listener the parent took Node's default kill
  // while spawnSync had the event loop blocked, so it died without ever reading r.signal. The path
  // was reachable only when something killed the child alone, which is not what Ctrl+C does.
  const dir = fixture({
    'test:slow': `node -e "console.log('SLOW-STARTED'); setTimeout(() => {}, 30000)"`,
    'test:never': OK('NEVER-SHOULD-RUN'),
  });

  const child = spawn('node', [RUNNER, '--root', dir, '--steps', 'test:slow,test:never'], {
    detached: true,                       // its own group, so a negative pid signals it like a tty does
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CHECK_SUITE_TEST_HARNESS: '1' },
  });

  let out = '';
  child.stdout.on('data', (d) => { out += d; });

  const deadline = (ms, what) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${what}\n${out}`)), ms).unref());

  try {
    // Interrupt only once the step is genuinely running. Signalling before spawnSync has started
    // the child would exercise a different path and then hang here for the full 30s.
    await Promise.race([
      new Promise((resolve) => {
        const poll = setInterval(() => {
          if (out.includes('SLOW-STARTED')) { clearInterval(poll); resolve(); }
        }, 25);
      }),
      deadline(20_000, 'the slow step never started'),
    ]);

    process.kill(-child.pid, 'SIGINT');

    const code = await Promise.race([
      new Promise((resolve) => child.on('exit', resolve)),
      deadline(20_000, 'the runner did not exit after SIGINT to its process group'),
    ]);

    assert.match(out, /INCOMPLETE — interrupted during "test:slow"/, `no INCOMPLETE verdict:\n${out}`);
    assert.match(out, /Never started:[\s\S]*\?\s+test:never/, `the step that never ran was not named:\n${out}`);
    assert.ok(!out.includes('NEVER-SHOULD-RUN'), 'the runner kept going after the interrupt');
    assert.ok(!out.includes('✓'), `a ✓ appears in an interrupted run:\n${out}`);
    assert.equal(code, 1, 'an interrupted run must not exit 0');
  } finally {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
  }
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
