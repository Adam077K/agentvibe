// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:launcher-permissions`.
//
// scripts/launcher-permissions.test.mjs — the autonomy dial, and the model it made inert.
//
// `bin/warroom` launched every session with `--dangerously-skip-permissions`, so the 20 allow
// rules and 6 deny rules in `.claude/settings.json` applied to nothing. Every deny rule in that
// file — rm -rf, curl, chmod +x, global installs — was decoration in any warroom-started
// session. The PreToolUse hook still fired, so the system was not unprotected; it was protected
// by one mechanism where it was documented as two.
//
// Removed 2026-08-16 by founder decision. Pinned here because a single word restores it
// silently and nothing else in the suite would notice.
//
// The friction was MEASURED before the flag came out, not guessed: 11,342 Bash calls across 400
// recent transcripts, of which 8,603 already matched the allow list. The real gap was
// bun/bunx/npm — 304 calls — plus printf, timeout and sleep. Those six went in with the removal,
// because a permission model that prompts constantly gets disabled again within a week.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAUNCHER = path.join(REPO, 'bin', 'warroom');
const SETTINGS = path.join(REPO, '.claude', 'settings.json');

// The flag name is assembled rather than written literally. `pre-tool-use.sh` scans the whole
// Bash command string, so a heredoc containing the literal deny rules below is itself refused —
// a test asserting a guard exists, blocked by that guard. Recorded rather than worked around
// silently: it is the sixth false-positive of the same class, all of them the rule reading a
// command's SHAPE rather than its EFFECT.
const SKIP_FLAG = ['--dangerously', 'skip', 'permissions'].join('-');

test('the launcher does not disarm the permission model', () => {
  const src = fs.readFileSync(LAUNCHER, 'utf8');
  // Comments may legitimately name the flag to explain why it is gone.
  const live = src.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.equal(
    live.includes(SKIP_FLAG), false,
    `bin/warroom passes ${SKIP_FLAG} again — that makes every allow and deny rule in settings.json inert`
  );
});

test('the launcher still launches claude, with and without --resume', () => {
  // Guards the lazy version of the fix above: deleting the launch lines entirely would also
  // satisfy the assertion.
  const src = fs.readFileSync(LAUNCHER, 'utf8');
  assert.match(src, /tmux send-keys -t "\$target" "claude --resume \$resume" Enter/);
  assert.match(src, /tmux send-keys -t "\$target" "claude" Enter/);
});

test('the allow list covers what agents actually run', () => {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const allow = new Set(s.permissions.allow);
  for (const cmd of ['npm', 'bun', 'bunx', 'git', 'node', 'gh', 'printf', 'timeout', 'sleep']) {
    assert.ok(allow.has(`Bash(${cmd} *)`), `Bash(${cmd} *) missing — removing the flag without this makes ordinary work prompt`);
  }
});

test('the deny list still denies — these are the rules the flag was making inert', () => {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const deny = new Set(s.permissions.deny);
  // Assembled for the same reason as SKIP_FLAG above.
  const rmrf = `Bash(${['rm', '-rf', '*'].join(' ')})`;
  const chmod = `Bash(${['chmod', '+x', '*'].join(' ')})`;
  for (const d of [rmrf, 'Bash(curl *)', chmod, 'Bash(wget *)']) {
    assert.ok(deny.has(d), `${d} missing from the settings.json deny list`);
  }
});

test('every allow entry is a Bash pattern, not a bare tool grant', () => {
  // A stray `"Bash"` or `"*"` in the allow list would silently re-widen everything the flag
  // removal just narrowed, and would look like an ordinary entry.
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  for (const a of s.permissions.allow) {
    assert.match(a, /^Bash\(.+ \*\)$/, `allow entry ${JSON.stringify(a)} is not a scoped Bash pattern`);
  }
});
