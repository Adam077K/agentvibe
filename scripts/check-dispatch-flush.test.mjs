// POSTURE: BLOCKS. Wired to package.json as `npm run test:dispatch-flush`, and reached by
// `npm run check` through `npm run check:dispatch`.
//
// scripts/check-dispatch-flush.test.mjs — the regression gate for the 64KB stdout truncation.
//
// THE DEFECT. `process.exit()` does not flush a queued stdout write. When stdout is a PIPE —
// how CI runs these checkers, and how any `| jq` runs them — console.log is asynchronous: Node
// fills the 64KB pipe buffer, queues the remainder, and process.exit() tears the process down
// before the queue drains. The payload is cut at exactly 65536 bytes and the exit status still
// reads 0, so a consumer receives truncated JSON reported as a clean run. `check:dispatch` is a
// blocking CI check, so that was silent corruption in a blocking path.
//
// WHY THIS TEST IS SHAPED THIS WAY. Two properties of the defect decide the shape, and getting
// either wrong makes the test vacuous:
//
//   1. It needs a payload OVER 65536 bytes. A small payload fits the pipe buffer in one write
//      and never truncates, so a small-payload test passes against the broken code.
//   2. It needs stdout to be a PIPE. Redirected to a FILE, Node writes stdout synchronously and
//      nothing is ever queued — the same broken code is complete through `> out.json`. That
//      asymmetry is why the original bug survived a spot-check.
//
// So every case below spawns the real checker as a child process with stdout as a pipe, and
// drives a fixture big enough that the payload clears 65536 bytes. Both facts are ASSERTED, not
// assumed: `assertOverPipeThreshold` fails if the fixture ever shrinks under the buffer.
//
// AND THE CANARY. `test('the harness can still detect truncation')` runs the OLD pattern —
// console.log then process.exit() — through the same spawn path and requires it to truncate. If
// a future Node or platform flushes on exit, that canary fails rather than every other case in
// this file passing for a reason that has nothing to do with the fix. A test that cannot fail
// is not evidence, and this repo has shipped one of those before.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The POSIX pipe buffer, and so the exact byte at which the unfixed code cut the payload. */
const PIPE_BUFFER_BYTES = 65536;

/**
 * Dispatch sites in the fixture. 500 already clears the buffer for both checkers; 800 leaves
 * headroom so a change to the per-site record cannot quietly drop the payload back under it
 * and make every case here vacuous. Measured 2026-08-24 at 800 sites:
 * agentType → 106,448 bytes · prompt-size → 139,271 bytes.
 */
const SITES = 800;

const roots = [];
process.on('exit', () => {
  for (const r of roots) { try { fs.rmSync(r, { recursive: true, force: true }); } catch { /* best effort */ } }
});

/** A fixture repo whose single workflow file carries `SITES` clean dispatches. */
function bigFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-flush-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(root, '.claude', 'workflows'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.claude', 'agents', 'builder.md'),
    ['---', 'name: builder', 'model: claude-sonnet-4-6', 'tools: [Read, Write, Edit, Bash, Glob, Grep]',
      'maxTurns: 30', 'isolation: worktree', '---', '', '# builder'].join('\n')
  );
  const lines = ["export const meta = { name: 'fx' }", "phase('Go')"];
  for (let i = 0; i < SITES; i++) {
    lines.push(
      `const r${i} = await agent('do the thing ${i}', ` +
        `{ label: 'go-${i}', phase: 'Go', agentType: 'builder', model: 'sonnet' })`
    );
  }
  fs.writeFileSync(path.join(root, '.claude', 'workflows', 'fx.js'), lines.join('\n'));
  return root;
}

/**
 * Spawn a script with stdout as a PIPE — the failing case. Not `stdio: 'inherit'`, which under
 * `node --test` is a file or a TTY and reproduces nothing.
 *
 * Buffers, never strings: a truncated payload can be cut mid-UTF-8, and decoding per chunk would
 * hide the byte count this test is measuring.
 */
function runPiped(args) {
  const r = spawnSync('node', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,   // far above any payload here; a maxBuffer cut is its own truncation
  });
  assert.equal(r.error, undefined, `spawn failed: ${r.error && r.error.message}`);
  assert.ok(r.stdout.length < 64 * 1024 * 1024, 'payload hit maxBuffer — raise it, the test is measuring the wrong cut');
  return { status: r.status, stdout: r.stdout, stderr: r.stderr.toString('utf8') };
}

/**
 * The anti-vacuity guard: a payload under the pipe buffer proves nothing about this defect.
 *
 * Order matters. A payload of EXACTLY the buffer size is the truncation itself, not a fixture
 * that shrank, and diagnosing it as "raise SITES" would send the next reader the wrong way.
 */
function assertOverPipeThreshold(bytes, what) {
  assert.notEqual(
    bytes, PIPE_BUFFER_BYTES,
    `${what} emitted EXACTLY ${PIPE_BUFFER_BYTES} bytes — the pipe buffer, to the byte. That is ` +
      'the truncation this file exists to catch: something reintroduced process.exit() after a ' +
      'stdout write. Set process.exitCode and let the process end on its own.'
  );
  assert.ok(
    bytes > PIPE_BUFFER_BYTES,
    `${what} emitted ${bytes} bytes, under the ${PIPE_BUFFER_BYTES}-byte pipe buffer. A payload ` +
      'this small fits one write and never truncates, so this case would pass against the broken ' +
      'code too. Raise SITES until it clears the buffer.'
  );
}

const CHECKERS = [
  { name: 'check-dispatch-agenttype.mjs', script: path.join(REPO, 'scripts', 'check-dispatch-agenttype.mjs') },
  { name: 'check-dispatch-prompt-size.mjs', script: path.join(REPO, 'scripts', 'check-dispatch-prompt-size.mjs') },
];

for (const { name, script } of CHECKERS) {
  test(`${name} --json survives a >64KB payload through a pipe`, () => {
    const root = bigFixture();
    const r = runPiped([script, '--root', root, '--json', '--min-sites', '1']);

    assertOverPipeThreshold(r.stdout.length, name);

    // Not "starts with {" and not "is long enough" — the whole payload must parse. A cut at the
    // pipe buffer lands mid-object and JSON.parse is the exact oracle for that.
    let parsed;
    const text = r.stdout.toString('utf8');
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      assert.fail(
        `${name} emitted ${r.stdout.length} bytes that do not parse as JSON: ${e.message}\n` +
          (r.stdout.length === PIPE_BUFFER_BYTES
            ? `The payload is EXACTLY ${PIPE_BUFFER_BYTES} bytes — this is the pipe-buffer truncation. ` +
              'Something reintroduced process.exit() after the stdout write. Use process.exitCode.'
            : `Tail: ${JSON.stringify(text.slice(-120))}`)
      );
    }

    // Whole, not merely parseable: every site the fixture declared is present.
    assert.equal(parsed.sites.length, SITES,
      `expected all ${SITES} sites in the payload, got ${parsed.sites.length} — the payload is short`);
    assert.equal(parsed.failures.length, 0, `fixture should be clean: ${JSON.stringify(parsed.failures)}`);
    assert.equal(r.status, 0, `expected exit 0, got ${r.status}. stderr: ${r.stderr}`);
  });
}

// NOT a truncation test, and labelled so. MEASURED 2026-08-24 against the UNFIXED code: this
// path emitted all 263,096 bytes and exited 1, identically across three runs. It cannot
// distinguish fixed from unfixed, so calling it a truncation case would be the vacuous-test
// failure this file's header warns about.
//
// WHY it does not truncate, since the reason is the useful part: the defect bites on ONE write
// larger than the pipe buffer. The human path emits ~800 SMALL console.log calls, and libuv
// tries a synchronous write per call — against a reader that is draining, each ~250-byte write
// lands whole and nothing is ever queued for process.exit() to discard. Only the single
// JSON.stringify write is big enough to be partially written and queued.
//
// What this case DOES pin is the if/else restructure that replaced process.exit(): the failing
// human path must still emit every warning and must still exit 1.
test('the human-readable FAILURE path emits in full and still exits 1', () => {
  const root = bigFixture();
  const script = path.join(REPO, 'scripts', 'check-dispatch-prompt-size.mjs');
  const r = runPiped([script, '--root', root, '--min-sites', String(SITES + 1), '--threshold', '10']);

  const text = r.stdout.toString('utf8');
  assert.ok(
    text.includes('PS-DISPATCH-BRIEF-SIZE'),
    'expected the warning block on stdout'
  );
  assert.equal(
    text.split('\n').filter((l) => l.startsWith('⚠ [PS-DISPATCH-BRIEF-SIZE]')).length,
    SITES,
    `expected all ${SITES} warnings on stdout — a short count is the truncation`
  );
  assert.equal(r.status, 1, `the non-vacuity floor must still fail the run, got ${r.status}`);
});

test('CANARY: the harness can still detect truncation — the old pattern must still truncate', () => {
  // Guards against the whole file passing for the wrong reason. If Node ever flushes stdout on
  // process.exit(), or a platform's pipe never fills, the cases above stop being evidence and
  // this fails first, naming why.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-flush-canary-'));
  roots.push(root);
  const broken = path.join(root, 'broken.mjs');
  const payload = `const payload = JSON.stringify({ pad: 'x'.repeat(300000) });`;
  fs.writeFileSync(broken, `${payload}\nconsole.log(payload);\nprocess.exit(0);\n`);
  const fixed = path.join(root, 'fixed.mjs');
  fs.writeFileSync(fixed, `${payload}\nprocess.exitCode = 0;\nconsole.log(payload);\n`);

  const bad = runPiped([broken]);
  const good = runPiped([fixed]);

  assert.ok(
    good.stdout.length > PIPE_BUFFER_BYTES,
    `the control wrote only ${good.stdout.length} bytes; the canary cannot measure anything`
  );
  assert.ok(
    bad.stdout.length < good.stdout.length,
    'console.log + process.exit() did NOT truncate on this platform. The 64KB defect these ' +
      'tests guard against may no longer exist here — which means the cases above no longer ' +
      'prove the fix. Re-measure before deleting anything.'
  );
  assert.equal(bad.status, 0, 'and the truncating run still reports success — that is the danger');
});
