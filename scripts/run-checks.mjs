#!/usr/bin/env node
/**
 * run-checks.mjs — `npm run check`. Runs EVERY step, reports EVERY failure.
 *
 * POSTURE: BLOCKS. This is the deterministic floor `.claude/workflows/qa.js` runs as its ORACLE
 * before any review agent is dispatched, and the entry point contributors invoke by hand. CI
 * (.github/workflows/ci.yml) runs the same scripts individually rather than through this file.
 *
 * WHY IT REPLACED A ONE-LINE `&&` CHAIN. The chain stopped at the first failure. `check:mc` sat at
 * step 21 of 30 and fails on any machine without `bun install` in mission-control/, so nine steps
 * after it — every safety-hook test, the gate's own tests, and `test:sandbox` — had not run for as
 * long as that was true, while the output showed exactly one failure. `check:mc` has since left the
 * suite for an unrelated reason: the armed sandbox denies it a loopback bind(), wherever it runs.
 * *Superseded 2026-08-25: this said "as a child process", which was the belief at the time and is
 * refuted by a matched pair — standalone fails too, once `sandbox.excludedCommands` was reverted.*
 * The full argument, and that one, are in scripts/lib/check-suite.js, which owns the step list.
 *
 * ── WHAT THE OUTPUT PROMISES ─────────────────────────────────────────────────────────────────
 * The reader of this output is an agent deciding whether a diff proceeds. It must not be able to
 * mistake a partial run for a clean one, so:
 *
 *   · every step runs, whatever the ones before it did
 *   · each step's own stdout and stderr go straight to this process's, unbuffered and untruncated
 *     (stdio: 'inherit' — the child writes to the same file descriptor)
 *   · the summary names every failing step, and the FAILED verdict is printed BEFORE the tally,
 *     with no ✓ anywhere above it. Passing steps are marked `·`, not `✓`, for the same reason
 *   · an interrupted run prints INCOMPLETE and names the steps that never started, rather than
 *     ending silently
 *   · a run of a SUBSET of the suite says so in its banner and in its verdict, and never claims
 *     "every step ran" — only a run of the whole declared list may say that
 *   · a run of ZERO steps is REFUSED. It is the maximal partial run, and it used to print the
 *     clean verdict at exit 0
 *
 * ── THE SUBSET FLAGS ARE A GATE, NOT A CONVENTION ────────────────────────────────────────────
 * `--steps` and `--root` exist for scripts/check-suite.test.mjs, which has to construct a failing
 * suite in a fixture repo to prove this runner reports one. A comment calling them "test-only"
 * stopped nobody: they were read straight off `process.argv` with no guard, and `npm run check`
 * forwards anything after `--` to this script. `--steps ,` resolved to the empty list, which the
 * loop below iterated zero times and the summary then reported as
 *
 *     Tally: 0 of 0 passed · 0 failed · 0.0s
 *     ✓ check suite passed — every step ran.          exit 0
 *
 * — an authentic green floor, real exit code and all, from a process that ran no check at all.
 * That output is not read by a human: .claude/workflows/qa.js runs `npm run check` as its ORACLE
 * and dispatches an agent to read the result, and qa.js names prompt injection from the diff under
 * review as the way that agent gets subverted. A diff that talks the oracle into appending
 * `-- --steps ,` is the whole attack. So the flags now require CHECK_SUITE_TEST_HARNESS=1 in the
 * environment, and argv carrying them without it is a hard failure rather than an ignored
 * argument — an argument string alone can no longer decide how much of the floor runs. The empty
 * list is refused independently, because a guard whose only defence is another guard is one guard.
 *
 * NO TIMEOUT, deliberately. `check:ledger` takes 45-70s and `check:mc` took about three minutes
 * while it was still a step, looking hung throughout. A timeout would turn a slow check into a
 * flaky one, and the slowest steps here are the ones whose failure matters most.
 *
 * NO `process.exit()` ON ANY PATH THAT HAS RUN A STEP, deliberately. It does not flush an async
 * pipe write: a sibling branch just fixed six scripts that printed a large payload and then
 * exited, cutting stdout at exactly 65536 bytes with status 0. This runner emits more output than
 * any of them. It sets `process.exitCode` and lets the process end on its own.
 * scripts/check-suite.test.mjs pins that with a step that prints ~200KB.
 *   THE ONE EXCEPTION is `refuse()` below, which runs before any child has been spawned and whose
 *   only output went through `writeOut` — `fs.writeSync`, which has already handed every byte to
 *   the OS by the time it returns, EAGAIN retries included. The truncation hazard is a property of
 *   async writes and does not reach that path. It has its own pipe test, for the same reason.
 *
 * AND ITS OWN LINES GO OUT SYNCHRONOUSLY, for a second reason that is easy to miss. The children
 * write straight to fd 1 (stdio: 'inherit'), and `spawnSync` blocks the event loop — so a banner
 * queued through `process.stdout.write` while stdout is a PIPE can be flushed only after the child
 * it introduces has already finished writing. Small writes usually slip through synchronously and
 * the ordering looks fine, which is exactly how this would be missed until a run under load put a
 * failing step's output under the wrong banner. `writeOut` uses `fs.writeSync` so the ordering is
 * not left to the pipe buffer.
 *
 * Usage:
 *   npm run check                       # the suite, and the only spelling a contributor needs
 *   node scripts/run-checks.mjs         # identical
 *
 *   CHECK_SUITE_TEST_HARNESS=1 node scripts/run-checks.mjs --root DIR --steps a,b,c
 *     Test-only, and gated on that variable rather than merely documented as test-only — see
 *     "THE SUBSET FLAGS ARE A GATE, NOT A CONVENTION" below.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { STEPS } = require('./lib/check-suite.js');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const RULE = '═'.repeat(78);

/** A 1ms sleep with no event loop — the only kind available between two blocking writes. */
const nap = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1);

/** Write to fd 1 synchronously, so this runner's lines cannot overtake or trail a child's. */
function writeOut(text) {
  const buf = Buffer.from(text, 'utf8');
  let off = 0;
  while (off < buf.length) {
    try {
      off += fs.writeSync(1, buf, off, buf.length - off);
    } catch (err) {
      if (err.code === 'EAGAIN') { nap(); continue; }  // non-blocking pipe, reader has not drained
      if (err.code === 'EPIPE') return;                // reader is gone; there is no one to tell
      throw err;
    }
  }
}

const w = (line = '') => writeOut(`${line}\n`);

/**
 * Stop before running anything, loudly and non-zero.
 *
 * Deliberately carries no ✓ and no tally: the reader is an agent skimming for a verdict, and a
 * refusal that looks like a summary is the defect this file exists to prevent. `process.exit` is
 * safe here and nowhere else — see the header.
 */
function refuse(lines) {
  w(RULE);
  w('REFUSED — no check ran. This is NOT a pass and NOT a failing suite; it is a runner that');
  w('declined to start, and nothing about the tree under it has been established either way.');
  w('');
  for (const line of lines) w(line);
  w(RULE);
  process.exit(1);
}

const argv = process.argv.slice(2);

/**
 * `undefined` when the flag is absent, `null` when it is present with nothing usable after it.
 *
 * The distinction is load-bearing, and collapsing it is how `--steps ""` came to run the WHOLE
 * suite while the banner called it a subset: an empty string is falsy, so a truthiness test on
 * the result silently fell back to STEPS. Present-with-no-value is malformed, not absent.
 */
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? null : v;
};

// ── Guard 1: the subset flags are gated on the harness variable ──────────────────────────────
const SUBSET_FLAGS = ['--steps', '--root'];
const usedFlags = SUBSET_FLAGS.filter((f) => argv.includes(f));

if (usedFlags.length && process.env.CHECK_SUITE_TEST_HARNESS !== '1') {
  refuse([
    `${usedFlags.join(' and ')} — test-only, and this process was not started by the test harness.`,
    'Those flags select which steps run, so honouring them from an ordinary invocation would let an',
    'argument string decide how much of the deterministic floor executes, and `npm run check`',
    'forwards everything after a bare double dash straight to this script.',
    '',
    '  the whole suite       npm run check',
    '  one step, by hand     npm run <step>',
    '  from a test           CHECK_SUITE_TEST_HARNESS=1 node scripts/run-checks.mjs --steps a,b',
  ]);
}

const rootArg = argOf('--root');
const stepsArg = argOf('--steps');

const malformed = SUBSET_FLAGS.filter((f) => (f === '--root' ? rootArg : stepsArg) === null);
if (malformed.length) {
  refuse([
    `${malformed.join(' and ')} was given with no value after it.`,
    'Refused rather than ignored: a flag this runner drops on the floor is a flag whose caller',
    'believes it took effect, and every one of these decides what does and does not run.',
  ]);
}

const root = path.resolve(rootArg || REPO);
const steps = stepsArg !== undefined
  ? stepsArg.split(',').map((s) => s.trim()).filter(Boolean)
  : STEPS;

/** True only when this run covers the whole declared suite. Every other run is a subset. */
const isFullSuite = stepsArg === undefined;

// ── Guard 2: an empty step list is a refusal, never a pass ───────────────────────────────────
// Independent of guard 1 on purpose. This one also catches a STEPS list emptied in the library,
// which no amount of argv checking would see.
if (steps.length === 0) {
  refuse([
    stepsArg === undefined
      ? 'STEPS in scripts/lib/check-suite.js is empty, so the suite declares no checks at all.'
      : `--steps ${JSON.stringify(stepsArg)} resolved to no step names at all.`,
    'Zero steps is the maximal partial run: it can be reported only as a refusal, because every',
    'other verdict this runner prints would be a statement about checks that never executed.',
  ]);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const total = steps.length;
const results = [];
let aborted = null;
const suiteStarted = Date.now();

w(RULE);
if (isFullSuite) {
  w(`check suite — ${total} steps, all of them, regardless of individual failure`);
} else {
  w(`check suite — SUBSET RUN: ${total} step(s) named on the command line, NOT the ${STEPS.length}-step suite`);
}
w(RULE);

for (const [i, step] of steps.entries()) {
  const n = `${String(i + 1).padStart(2)}/${total}`;
  w('');
  w(`━━ [${n}] ${step} ${'━'.repeat(Math.max(0, 60 - step.length))}`);

  const started = Date.now();
  const r = spawnSync(npm, ['run', step], { cwd: root, stdio: 'inherit' });
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  const detail = r.error
    ? `could not start: ${r.error.message}`
    : r.signal
      ? `killed by signal ${r.signal}`
      : `exit ${r.status}`;
  const failed = Boolean(r.error) || r.signal != null || r.status !== 0;

  results.push({ index: i + 1, step, failed, detail, secs });

  if (failed) w(`\n✗ [${n}] ${step} FAILED — ${detail} (${secs}s)`);
  else w(`\n· [${n}] ${step} ok (${secs}s)`);

  // A run the operator interrupted must not keep grinding through the remaining steps, and must
  // not be reported as if it had finished.
  if (r.signal === 'SIGINT' || r.signal === 'SIGTERM') {
    aborted = step;
    break;
  }
}

// ── summary ──────────────────────────────────────────────────────────────────────────────────
const failures = results.filter((r) => r.failed);
const attempted = results.length;
const passed = attempted - failures.length;
const elapsed = ((Date.now() - suiteStarted) / 1000).toFixed(1);

w('');
w(RULE);

if (aborted) {
  w(`INCOMPLETE — interrupted during "${aborted}". This is NOT a clean run and NOT a failing run;`);
  w(`it is ${total - attempted} step(s) that never started. Do not read the tally below as coverage.`);
  w('');
  w('Never started:');
  for (const s of steps.slice(attempted)) w(`  ? ${s}`);
  w('');
}

if (failures.length) {
  w(`FAILED — ${failures.length} of ${attempted} step(s) run did not pass.`);
  w('');
  w('Failing steps, in order:');
  for (const f of failures) {
    w(`  ✗ ${String(f.index).padStart(2)}. ${f.step} — ${f.detail}   reproduce: npm run ${f.step}`);
  }
  w('');
  w(`Tally: ${passed} of ${total} passed · ${failures.length} failed${
    aborted ? ` · ${total - attempted} never started` : ''
  } · ${elapsed}s`);
  w("Each failing step's own output is above, under its ━━ banner.");
  process.exitCode = 1;
} else if (aborted) {
  w(`Tally: ${passed} of ${total} passed · 0 failed · ${total - attempted} never started · ${elapsed}s`);
  process.exitCode = 1;
} else {
  w(`Tally: ${passed} of ${total} passed · 0 failed · ${elapsed}s`);
  if (isFullSuite) {
    w('✓ check suite passed — every step ran.');
  } else {
    // A subset that passed is still a subset. The clean verdict above is reserved for the run
    // that earns it, so an agent matching on it cannot be handed a green three-step run instead.
    w(`✓ ${passed} of ${passed} SELECTED step(s) passed — SUBSET RUN, not the ${STEPS.length}-step suite.`);
    w('  This says nothing about the steps that were not selected. It is not a clean floor.');
  }
  process.exitCode = 0;
}

w(RULE);
