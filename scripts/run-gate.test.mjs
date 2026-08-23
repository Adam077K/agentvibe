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
import fs from 'node:fs';

const fsExists = (p) => fs.existsSync(p);

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

// ── The `full` tier boundary — found missing by the binding QA gate on this file's own PR ────
// GATE_REQUIRED_TIERS (run-gate.mjs) has TWO members. The suite above exercised only
// `irreversible`. Narrowing the set to ['irreversible'], or typoing 'full', passed every test
// while silently un-gating the common case the router exists to catch: API, DB, auth, billing.
// A set boundary must be asserted from both sides or it is not asserted at all.

test('a full-tier path requires the gate — the common API/DB/auth case', () => {
  const r = json(['--files', 'scripts/foo.mjs']);
  assert.equal(r.floor, 'full');
  assert.equal(r.gateRequired, true, 'the full tier must require the binding gate');
  assert.equal(r.invocation.args.tier, 'full', 'qa.js must be told full, not irreversible');
});

test('--require exits 1 at full tier too, not only at irreversible', () => {
  assert.equal(run(['--files', 'scripts/foo.mjs', '--require']).code, 1);
});

test('a lite-tier path does NOT require the gate — the other side of the boundary', () => {
  const r = json(['--files', 'package.json']);
  assert.equal(r.floor, 'lite');
  assert.equal(r.gateRequired, false, 'lite is code-reviewer + qa-engineer + semgrep, not the panel');
  assert.equal(r.invocation, null);
  assert.equal(run(['--files', 'package.json', '--require']).code, 0);
});

test('both members of GATE_REQUIRED_TIERS are exercised, and both non-members', () => {
  // The explicit statement of what this file now covers, so a future reader can see the set is
  // closed rather than inferring it from scattered cases.
  const seen = {
    irreversible: json(['--files', '.claude/hooks/pre-tool-use.sh']),
    full:         json(['--files', 'scripts/foo.mjs']),
    lite:         json(['--files', 'package.json']),
    trivial:      json(['--files', 'docs/a.md']),
  };
  assert.deepEqual(
    Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.gateRequired])),
    { irreversible: true, full: true, lite: false, trivial: false }
  );
  for (const [tier, r] of Object.entries(seen)) {
    assert.equal(r.floor, tier, `${tier} fixture no longer floors at ${tier} — update the fixture, not the assertion`);
  }
});

test('a ref beginning with "-" is refused before it reaches git as an option', () => {
  // P3 from the binding gate. No shell is involved, so this is not shell injection — but git
  // reads a leading dash as an option, and some options write files.
  // Note the SINGLE dash: arg() already refuses a following token starting with `--`, so the
  // double-dash form never reaches git. The single-dash form did.
  const r = run(['--ref', '-O/tmp/run-gate-should-never-exist']);
  assert.equal(r.code, 2, 'a dash-leading ref must exit 2');
  assert.match(r.stderr, /refusing a ref/);
  assert.equal(fsExists('/tmp/run-gate-should-never-exist'), false, 'git was allowed to act on the option');
});

// ── Fix B: the emitted ref must be cwd-independent ──────────────────────────────────────────
//
// Observed 2026-08-17 against PR #77: run-gate emitted "origin/main...HEAD" by default, which
// was pasted verbatim into a different session. HEAD resolved to the parent worktree branch
// (fix/ledger-blind-spots, 7 unrelated files), not the caller's branch (feat/qa-verdict-binding,
// 9 changed files). The gate reviewed the wrong diff. Caught by the adversarial verifier only
// because the two branches were unrelated enough that a cited file didn't exist.

test('the emitted ref does not contain bare HEAD — cwd-dependent ref reviews the wrong branch', () => {
  // RED before fix: the default was "origin/main...HEAD" which resolves in the WORKFLOW cwd,
  // not the caller's. Pasting the invocation into a different session reviewed the wrong branch.
  const r = json(['--files', '.claude/hooks/pre-tool-use.sh']);
  assert.ok(r.invocation, 'gate must be required');
  assert.ok(
    !r.invocation.args.ref.includes('HEAD'),
    `emitted ref "${r.invocation.args.ref}" contains bare HEAD — paste it into a different worktree and HEAD resolves to that tree's branch, reviewing the wrong diff`
  );
});

test('a bare HEAD ref passed via --ref is refused — the cwd-dependence trap', () => {
  // RED before fix: "origin/main...HEAD" was accepted and emitted verbatim. When pasted into
  // a different session, HEAD resolved to whatever that session's HEAD was — a different branch.
  const r = run(['--ref', 'origin/main...HEAD', '--files', 'docs/a.md']);
  assert.equal(r.code, 2, 'a bare HEAD ref must be refused — it is cwd-dependent');
  assert.match(r.stderr, /HEAD/);
});

test('the emitted ref is a resolved SHA — immune to which worktree you paste it into', () => {
  // A SHA always refers to the same commit regardless of cwd.
  // Verify from two directories to prove cwd-independence by construction.
  const r = json(['--files', '.claude/hooks/pre-tool-use.sh']);
  assert.ok(r.invocation, 'gate must be required');
  const emittedRef = r.invocation.args.ref;

  // Proof 1: no symbolic HEAD in the ref string
  assert.ok(!emittedRef.includes('HEAD'),
    `ref "${emittedRef}" is HEAD-based and therefore cwd-dependent`);

  // Proof 2: same diff output from two different working directories
  const worktreeOut = execFileSync('git', ['worktree', 'list'], { cwd: REPO, encoding: 'utf8' });
  const mainPath = worktreeOut.trim().split('\n')[0].split(/\s+/)[0];

  if (mainPath === REPO) return; // single-worktree setup — proof 1 is sufficient

  try {
    const filesHere = execFileSync('git', ['diff', '--name-only', emittedRef],
      { cwd: REPO, encoding: 'utf8' }).trim();
    const filesMain = execFileSync('git', ['diff', '--name-only', emittedRef],
      { cwd: mainPath, encoding: 'utf8' }).trim();
    assert.equal(filesHere, filesMain,
      `ref "${emittedRef}" produced different diffs from different directories — it is cwd-dependent.\n` +
      `  ${REPO}: [${filesHere.replace(/\n/g, ', ')}]\n` +
      `  ${mainPath}: [${filesMain.replace(/\n/g, ', ')}]`);
  } catch (e) {
    if (e instanceof assert.AssertionError) throw e;
    assert.fail(`ref "${emittedRef}" failed to resolve cwd-independently: ${e.message}`);
  }
});
