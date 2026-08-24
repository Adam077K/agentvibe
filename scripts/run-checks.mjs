#!/usr/bin/env node
/**
 * run-checks.mjs — `npm run check`. Runs EVERY step, reports EVERY failure.
 *
 * POSTURE: BLOCKS. This is the deterministic floor `.claude/workflows/qa.js` runs as its ORACLE
 * before any review agent is dispatched, and the entry point contributors invoke by hand. CI
 * (.github/workflows/ci.yml) runs the same scripts individually rather than through this file.
 *
 * WHY IT REPLACED A ONE-LINE `&&` CHAIN. The chain stopped at the first failure. `check:mc` sits
 * at step 22 of 31 and fails on any machine without `bun install` in mission-control/, so nine
 * steps after it — every safety-hook test, the gate's own tests, and `test:sandbox` — had not run
 * for as long as that was true, while the output showed exactly one failure. The full argument,
 * with the measurement, is in scripts/lib/check-suite.js, which owns the step list.
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
 *
 * NO TIMEOUT, deliberately. `check:mc` takes about three minutes with dependencies installed and
 * looks hung throughout. A timeout here would turn a slow check into a flaky one.
 *
 * NO `process.exit()`, deliberately. It does not flush an async pipe write: a sibling branch just
 * fixed six scripts that printed a large payload and then exited, cutting stdout at exactly 65536
 * bytes with status 0. This runner emits more output than any of them. It sets `process.exitCode`
 * and lets the process end on its own. scripts/check-suite.test.mjs pins that with a step that
 * prints ~200KB.
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
 *   node scripts/run-checks.mjs
 *   node scripts/run-checks.mjs --root DIR --steps a,b,c   # test-only: see check-suite.test.mjs
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { STEPS } = require('./lib/check-suite.js');

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
};

const root = path.resolve(argOf('--root') || REPO);
const stepsArg = argOf('--steps');
const steps = stepsArg
  ? stepsArg.split(',').map((s) => s.trim()).filter(Boolean)
  : STEPS;

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

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const total = steps.length;
const results = [];
let aborted = null;
const suiteStarted = Date.now();

w(RULE);
w(`check suite — ${total} steps, all of them, regardless of individual failure`);
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
  w('✓ check suite passed — every step ran.');
  process.exitCode = 0;
}

w(RULE);
