// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:tier-gate`.
//
// scripts/check-tier-gate.test.mjs — the tier gate that replaced label-based enforcement.
//
// WHY THIS EXISTS
// The `risk:irreversible` label was a second implementation of a fact the classifier already
// owns. It lived in GitHub metadata where it drifts silently — issue #78 proved this: the
// label became *wrong* mid-review when two `run:` steps raised the floor from `full` to
// `irreversible`. A human applying the label once at PR-open cannot get that right when the
// diff changes later. A machine reading the classifier at every sync can.
//
// WHAT THESE TESTS PIN
// The one safety property that must hold: floor=irreversible cannot be satisfied by sessions
// that declare lower tiers. Nothing the caller passes can lower the gate below the classifier
// floor. The "cannot lower" case is tested first, deliberately — it is the case that motivated
// Design B, and a test that only tests the happy path is not a test of the constraint.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { checkTierGate } from './check-tier-gate.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'check-tier-gate.mjs');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a temporary session file with the given tier (or none if null). */
function makeSession(tier) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tier-gate-'));
  const filePath = path.join(dir, 'session.md');
  const frontmatter = tier != null
    ? `---\ndate: 2026-08-17\nrole: builder\ntask: test\ntier: ${tier}\nqa_verdict: PASS\n---\nTest session.\n`
    : `---\ndate: 2026-08-17\nrole: builder\ntask: test\nqa_verdict: PASS\n---\nTest session.\n`;
  fs.writeFileSync(filePath, frontmatter, 'utf8');
  return filePath;
}

/** Run the CLI and return { code, stdout, stderr }. */
function runCLI(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return {
      code: e.status ?? 1,
      stdout: (e.stdout || '').toString(),
      stderr: (e.stderr || '').toString(),
    };
  }
}

// ── THE CRITICAL SAFETY PROPERTY ─────────────────────────────────────────────
// A floor of `irreversible` cannot be passed by sessions that declare lower tiers.
// This is the failure case that motivated the switch from label to classifier enforcement.
// If this test cannot fail, nothing below is worth running.

test('CANNOT LOWER TIER — floor=irreversible + tier:lite session is BLOCKED', () => {
  const session = makeSession('lite');
  const result = checkTierGate('irreversible', [session]);
  assert.equal(result.pass, false, 'A lite-tier session must not satisfy an irreversible floor');
  assert.ok(result.reason.includes('NONE'), 'reason must explain that no acceptable tier was found');
});

test('CANNOT LOWER TIER — floor=irreversible + tier:trivial session is BLOCKED', () => {
  const session = makeSession('trivial');
  const result = checkTierGate('irreversible', [session]);
  assert.equal(result.pass, false);
});

test('CANNOT LOWER TIER — floor=irreversible + no session files is BLOCKED', () => {
  const result = checkTierGate('irreversible', []);
  assert.equal(result.pass, false);
  assert.ok(result.reason.includes('no session files'), 'reason must name the missing files');
});

test('CANNOT LOWER TIER — floor=irreversible + session with no tier line is BLOCKED', () => {
  const session = makeSession(null); // no tier: line in frontmatter
  const result = checkTierGate('irreversible', [session]);
  assert.equal(result.pass, false, 'A session with no tier declaration must not satisfy irreversible');
});

// ── Happy paths ───────────────────────────────────────────────────────────────

test('floor=irreversible + tier:irreversible session — PASS', () => {
  const session = makeSession('irreversible');
  const result = checkTierGate('irreversible', [session]);
  assert.equal(result.pass, true);
  assert.equal(result.accepted, session, 'accepted must name the session file that satisfied the gate');
});

test('floor=irreversible + tier:full session — PASS (full is acceptable for irreversible)', () => {
  const session = makeSession('full');
  const result = checkTierGate('irreversible', [session]);
  assert.equal(result.pass, true);
});

test('floor=irreversible + mixed sessions (one lite, one irreversible) — PASS', () => {
  // A PR can bundle high-risk and low-risk work. The low-risk sessions keep their
  // honest tier; the requirement is that AT LEAST ONE session declares the right tier.
  const lite = makeSession('lite');
  const irrev = makeSession('irreversible');
  const result = checkTierGate('irreversible', [lite, irrev]);
  assert.equal(result.pass, true, 'at least one acceptable session is enough');
});

test('floor=full — PASS (advisory only, no mechanical enforcement yet)', () => {
  const session = makeSession('lite'); // even a lite session — floor=full is advisory
  const result = checkTierGate('full', [session]);
  assert.equal(result.pass, true);
  assert.ok(result.reason.includes('advisory'), 'reason must mention advisory status');
});

test('floor=lite — PASS with no sessions (no session requirement)', () => {
  const result = checkTierGate('lite', []);
  assert.equal(result.pass, true);
});

test('floor=trivial — PASS with no sessions (no session requirement)', () => {
  const result = checkTierGate('trivial', []);
  assert.equal(result.pass, true);
});

// ── Edge cases ────────────────────────────────────────────────────────────────

test('unknown floor tier — BLOCKED with explanation (guard against classify.mjs changes)', () => {
  const result = checkTierGate('ultraviolet', []);
  assert.equal(result.pass, false);
  assert.ok(result.reason.includes('Unknown floor tier'), 'must identify the bad tier value');
});

test('session file that does not exist — treated as no tier (BLOCKED when floor=irreversible)', () => {
  const result = checkTierGate('irreversible', ['/tmp/does-not-exist-at-all.md']);
  assert.equal(result.pass, false, 'a missing session file must not satisfy the gate');
});

// ── CLI smoke tests ───────────────────────────────────────────────────────────
// The library is the primary interface; the CLI wraps it for qa-lead-pass.yml.
// These confirm exit codes, not prose.

test('CLI: floor=trivial exits 0', () => {
  const r = runCLI(['--floor', 'trivial']);
  assert.equal(r.code, 0);
});

test('CLI: floor=irreversible with no sessions exits 1', () => {
  const r = runCLI(['--floor', 'irreversible']);
  assert.equal(r.code, 1);
});

test('CLI: floor=irreversible with a full-tier session exits 0', () => {
  const session = makeSession('full');
  const r = runCLI(['--floor', 'irreversible', '--sessions', session]);
  assert.equal(r.code, 0);
});

test('CLI: floor=irreversible with a lite-tier session exits 1 (cannot lower)', () => {
  const session = makeSession('lite');
  const r = runCLI(['--floor', 'irreversible', '--sessions', session]);
  assert.equal(r.code, 1, 'lite session must not satisfy irreversible floor via CLI either');
  assert.ok(r.stderr.includes('BLOCKED'), 'CLI must emit BLOCKED on stderr');
});

test('CLI: missing --floor exits 2 (usage error)', () => {
  const r = runCLI([]);
  assert.equal(r.code, 2);
});
