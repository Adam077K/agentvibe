// POSTURE: BLOCKS. Wired to `npm run test:sandbox` and included in `npm run check`.
//
// scripts/sandbox-config.test.mjs — proves the Bash sandbox is built and ARMED.
//
// WHAT THIS TESTS
// ---------------
// The sandbox block in .claude/settings.json controls the Claude Code Bash sandbox
// (macOS Seatbelt / Linux bubblewrap). The Founder explicitly authorised arming
// on 2026-08-17. This file is the machine-checked form of that state.
//
// It will fail the build if:
//   · sandbox.enabled is set back to false  (sandbox disarmed without a decision)
//   · sandbox.failIfUnavailable is false    (fail-open defeats the gate)
//   · any required denyRead credential path is removed
//
// FAILURE CONSTRUCTION (per builder brief)
// ----------------------------------------
// The test is deliberately constructed so that setting `sandbox.enabled: false`
// causes the "sandbox must remain armed" assertion to fail with exit code 1. That
// is the guard that stops the sandbox being disarmed accidentally.
//
// Similarly, setting `failIfUnavailable: false` causes its assertion to fail — a
// sandbox that silently falls back to unsandboxed operation is not a security gate.
//
// WHAT THIS DOES NOT TEST
// -----------------------
// Whether the sandbox actually sandboxes anything at runtime — that requires a live
// Claude Code session and is outside the scope of a unit test. See
// docs/03-system-design/SANDBOX.md for a note on `dangerouslyDisableSandbox`
// (the escape hatch that limits sandbox guarantees) and the revert procedure.
//
// WHAT CANNOT BE VERIFIED FROM INSIDE THIS SESSION
// -------------------------------------------------
// Settings are read at session start. Flipping `enabled: true` in the worktree does
// not sandbox the already-running Bash of the build agent that made the change. First
// real verification happens on the Founder's next session start. This is a limit of
// the mechanism, not an omission — stated here so the test is not misread as a
// runtime proof.

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

// This is the guard that pins the armed state.
// It fails if someone sets enabled: false without following the disarm procedure.
test('sandbox.enabled is true — armed by Founder decision 2026-08-17', () => {
  assert.equal(
    settings.sandbox.enabled,
    true,
    [
      'sandbox.enabled must be true (the sandbox is armed).',
      'Revert procedure: set sandbox.enabled: false and sandbox.failIfUnavailable: false',
      'in .claude/settings.json and restart your Claude Code session.',
      'See docs/03-system-design/SANDBOX.md § Emergency revert.',
    ].join(' '),
  );
});

// A sandbox that falls back to unsandboxed operation on startup failure is not a gate.
test('sandbox.failIfUnavailable is true — fail-open is not acceptable for a security gate', () => {
  assert.equal(
    settings.sandbox.failIfUnavailable,
    true,
    [
      'failIfUnavailable must be true when sandbox.enabled is true.',
      'Setting it false means the sandbox silently does not run when it cannot start,',
      'which is worse than no sandbox — it appears active while providing no protection.',
      'Revert procedure: docs/03-system-design/SANDBOX.md § Emergency revert.',
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

// The scratchpad root is required. $TMPDIR in a non-sandboxed session is
// /var/folders/.../T/ — a different tree from /private/tmp/claude-501/... — so
// the sandbox's default "session temp" does not cover the agent scratchpad.
// Without this entry, every scratchpad write is a hard failure under
// failIfUnavailable: true. See SANDBOX.md § Write-path justification.
const REQUIRED_ALLOW_WRITES = [
  '~/.agentvibe',
  '/private/tmp/claude-501',
];

test('sandbox.filesystem.allowWrite covers the required paths', () => {
  const allowWrite = settings.sandbox?.filesystem?.allowWrite;
  assert.ok(Array.isArray(allowWrite), 'sandbox.filesystem.allowWrite must be an array');

  for (const required of REQUIRED_ALLOW_WRITES) {
    assert.ok(
      allowWrite.includes(required),
      `sandbox.filesystem.allowWrite must include '${required}' — see SANDBOX.md § Write-path justification`,
    );
  }
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
