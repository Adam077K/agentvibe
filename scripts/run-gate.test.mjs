// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:run-gate`.
//
// scripts/run-gate.test.mjs — the router that decides whether the binding gate runs.
//
// These pin the decision, not the prose. A router that silently stops requiring the gate is
// indistinguishable from no router at all, and that is the exact failure it was written to fix:
// qa.js worked and had run, but nothing routed to it, so the merge gate fell back to grepping
// a string the change's own author wrote.
//
// Every case uses an explicit --files list. A test that reads the working tree's real diff
// passes or fails for reasons the test did not choose.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'run-gate.mjs');

function run(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status, stdout: (e.stdout || '').toString(), stderr: (e.stderr || '').toString() };
  }
}

const json = (args) => JSON.parse(run([...args, '--json']).stdout);

test('a docs-only change does not require the binding gate', () => {
  const r = json(['--files', 'docs/a.md', 'docs/08-agents_work/sessions/x.md']);
  assert.equal(r.floor, 'trivial');
  assert.equal(r.gateRequired, false);
  assert.equal(r.invocation, null, 'no invocation should be emitted when no gate is required');
});

test('a hook change requires the gate at irreversible, and names what set the floor', () => {
  const r = json(['--files', '.claude/hooks/pre-tool-use.sh']);
  assert.equal(r.floor, 'irreversible');
  assert.equal(r.gateRequired, true);
  assert.deepEqual(r.drivers, ['.claude/hooks/pre-tool-use.sh']);
});

test('the emitted invocation is complete enough to run — script path and tier both present', () => {
  const r = json(['--files', '.github/workflows/ci.yml']);
  assert.equal(r.gateRequired, true);
  assert.equal(r.invocation.tool, 'Workflow');
  assert.equal(r.invocation.scriptPath, '.claude/workflows/qa.js');
  assert.equal(r.invocation.args.tier, r.floor, 'the tier passed to qa.js must be the floor that was computed');
  assert.ok(r.invocation.args.ref, 'a diff range must be passed or the gate reviews nothing');
});

test('one risky path in an otherwise harmless change still requires the gate', () => {
  // The floor is a MAXIMUM, not a vote. A PR that is 40 docs and one hook is an irreversible PR.
  const r = json(['--files', 'docs/a.md', 'docs/b.md', 'README.md', '.claude/hooks/pre-tool-use.sh']);
  assert.equal(r.floor, 'irreversible');
  assert.equal(r.gateRequired, true);
});

test('--require exits non-zero when the gate is required, and zero when it is not', () => {
  assert.equal(run(['--files', '.claude/hooks/pre-tool-use.sh', '--require']).code, 1);
  assert.equal(run(['--files', 'docs/a.md', '--require']).code, 0);
});

test('without --require, a required gate still exits 0 — deciding is not blocking', () => {
  // This script routes. qa-lead-pass.yml blocks. Conflating the two would put a second
  // implementation of "does this merge" in the repo, which is the defect F13 already has.
  assert.equal(run(['--files', '.claude/hooks/pre-tool-use.sh']).code, 0);
});

test('the tier map is the only source of tiers — an unknown path takes the default, not a guess', () => {
  const r = json(['--files', 'some/unmapped/path.xyz']);
  assert.ok(['trivial', 'lite'].includes(r.floor), `unmapped paths must fall to the map default, got ${r.floor}`);
});

test('a bad ref fails loudly rather than reporting an empty diff as nothing to gate', () => {
  // Silently returning "no files, nothing to gate" on a broken ref is fail-OPEN for a router.
  const r = run(['--ref', 'definitely-not-a-real-ref-xyz...HEAD']);
  assert.equal(r.code, 2, 'an unreadable diff must exit 2, never 0');
});
