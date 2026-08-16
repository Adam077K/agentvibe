// POSTURE: BLOCKS. Wired to `npm run test:sandbox` and included in `npm run check`.
//
// scripts/sandbox-config.test.mjs — proves the Bash sandbox is built but unarmed.
//
// WHAT THIS TESTS
// ---------------
// The sandbox block in .claude/settings.json controls the Claude Code Bash sandbox
// (macOS Seatbelt / Linux bubblewrap). The Founder's standing instruction is "build
// everything; activate nothing needing founder secrets or binding founder sessions.
// OS sandbox off by default."
//
// This file is the machine-checked form of that instruction. It will fail the build
// if `sandbox.enabled` is set to `true` without a corresponding Founder approval
// recorded in docs/08-agents_work/sessions/.
//
// FAILURE CONSTRUCTION (per builder brief)
// ----------------------------------------
// The test is deliberately constructed so that flipping `sandbox.enabled` to `true`
// in settings.json causes the "sandbox must remain unarmed" assertion to fail with
// exit code 1. That is the guard that stops the sandbox being armed by accident.
//
// WHAT THIS DOES NOT TEST
// -----------------------
// Whether the sandbox actually sandboxes anything at runtime — that requires a live
// Claude Code session and is outside the scope of a unit test. See
// docs/03-system-design/SANDBOX.md for the arming procedure and a note on
// `dangerouslyDisableSandbox` (the escape hatch that limits sandbox guarantees).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTINGS_PATH = path.join(REPO, '.claude', 'settings.json');

const REQUIRED_DENY_READS = [
  '~/.ssh',
  '~/.aws',
  '~/.config/gh',
  '~/.netrc',
  '**/.env',
  '**/.env.*',
];

// ── Parse once; every test uses the same parsed object ──────────────────────

let settings;
try {
  settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
} catch (e) {
  throw new Error(`.claude/settings.json missing or invalid JSON: ${e.message}`);
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('sandbox block exists in .claude/settings.json', () => {
  assert.ok(
    settings.sandbox !== undefined,
    'sandbox block is absent — add it (see docs/03-system-design/SANDBOX.md)',
  );
  assert.equal(typeof settings.sandbox, 'object', 'sandbox must be an object');
});

// This is the guard that stops the sandbox being armed by accident.
// It fails if someone sets enabled: true without following the arming procedure.
test('sandbox.enabled is false — unarmed by design', () => {
  assert.equal(
    settings.sandbox.enabled,
    false,
    [
      'sandbox.enabled must remain false until explicitly armed by the Founder.',
      'Arming procedure: docs/03-system-design/SANDBOX.md § Arming procedure.',
      'If you intentionally set enabled: true, add a session file with Founder sign-off',
      'and delete this assertion (with the Founder\'s approval) at the same time.',
    ].join(' '),
  );
});

test('sandbox.failIfUnavailable is false — fail-open is intentional until Founder arms', () => {
  assert.equal(
    settings.sandbox.failIfUnavailable,
    false,
    [
      'failIfUnavailable must stay false while sandbox.enabled is false.',
      'Set it to true only when enabled is also true, and only via the arming procedure.',
    ].join(' '),
  );
});

test('sandbox.filesystem.denyRead covers the required credential paths', () => {
  const denyRead = settings.sandbox?.filesystem?.denyRead;
  assert.ok(Array.isArray(denyRead), 'sandbox.filesystem.denyRead must be an array');

  for (const required of REQUIRED_DENY_READS) {
    assert.ok(
      denyRead.includes(required),
      `sandbox.filesystem.denyRead must include '${required}'`,
    );
  }
});

test('sandbox.filesystem.allowWrite is an array', () => {
  const allowWrite = settings.sandbox?.filesystem?.allowWrite;
  assert.ok(Array.isArray(allowWrite), 'sandbox.filesystem.allowWrite must be an array');
});

test('sandbox block contains no network.allowedDomains — requires Founder input', () => {
  const network = settings.sandbox?.network;
  const domains = network?.allowedDomains;
  assert.ok(
    domains === undefined || domains === null,
    'network.allowedDomains must not be set without Founder input (see SANDBOX.md)',
  );
});

test('sandbox block does not touch permissions or hooks keys', () => {
  // The sandbox block is isolated: permissions and hooks must be top-level siblings,
  // not nested inside sandbox.
  const sandboxKeys = Object.keys(settings.sandbox || {});
  assert.ok(!sandboxKeys.includes('permissions'), 'sandbox block must not contain permissions');
  assert.ok(!sandboxKeys.includes('hooks'), 'sandbox block must not contain hooks');
});
