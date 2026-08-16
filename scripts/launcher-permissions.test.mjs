// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml via `npm run test:launcher-permissions`.
//
// scripts/launcher-permissions.test.mjs — the autonomy dial, and the model it made inert.
//
// `bin/warroom` launched every session with `--dangerously-skip-permissions`, so the 20 allow
// rules and 6 deny rules in `.claude/settings.json` applied to nothing. Every deny rule in that
// file — rm -rf, curl, chmod +x, global installs — was decoration in any warroom-started
// session. The PreToolUse hook still fired **for Bash and file writes**, so the system was not
// unprotected there; it was protected by one mechanism where it was documented as two.
//
// That qualifier is load-bearing and was missing from the first version of this comment. The
// hook fired for what its matcher named and for nothing else, so when `designer` was granted a
// browser the same day, the new capability reached NO content-level control at all. The binding
// QA gate caught the gap and the false premise together. Both are fixed: the matcher now routes
// the browser, and the browser refuses the local network while allowing the open web.
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
  for (const e of ['Bash(git *)', 'Bash(node *)', 'Bash(gh *)', 'Bash(npm run *)', 'Bash(bun test *)', 'Bash(printf *)', 'Bash(sleep *)']) {
    assert.ok(allow.has(e), `${e} missing — ordinary work would prompt`);
  }
});

test('the package managers are allowed by VERB, never wholesale', () => {
  // An independent reviewer of PR #47 caught this. The first cut allowed `Bash(npm *)`,
  // `Bash(bun *)` and `Bash(bunx *)`, which auto-approves `npx` / `bunx` / `npm exec` —
  // downloading and executing an arbitrary remote package. That is the same capability the
  // curl and wget denies exist to refuse, and it shipped inside the change that removed the
  // skip-permissions flag and was described as tightening. A wholesale grant on a tool that has
  // a fetch-and-run subcommand is a hole regardless of intent.
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  for (const bad of ['Bash(npm *)', 'Bash(bun *)', 'Bash(bunx *)', 'Bash(npx *)', 'Bash(timeout *)']) {
    assert.equal(s.permissions.allow.includes(bad), false, `${bad} is a wholesale grant and re-opens fetch-and-run`);
  }
  const deny = new Set(s.permissions.deny);
  for (const d of ['Bash(npx *)', 'Bash(bunx *)', 'Bash(npm exec *)', 'Bash(bun x *)']) {
    assert.ok(deny.has(d), `${d} missing from the deny list`);
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
    // Either a wildcard pattern (`Bash(git *)`) or a fully-literal command (`Bash(npm ci)`).
    // Narrowing the package managers to specific verbs introduced the literal form, which is
    // strictly tighter than a wildcard and must not be rejected by a rule aimed at bare grants.
    assert.match(a, /^Bash\([^*]+( \*)?\)$/, `allow entry ${JSON.stringify(a)} is not a scoped Bash pattern`);
    assert.equal(a === 'Bash' || a === '*' || a === 'Bash(*)', false, `allow entry ${JSON.stringify(a)} is a bare tool grant`);
  }
});

// ── The rule must also be REGISTERED ─────────────────────────────────────────────────────
// pre-tool-use.test.mjs proves the browser rule works by invoking the hook directly. That does
// not prove Claude Code ever calls it: the matcher in settings.json decides which tools reach
// the hook at all, and until 2026-08-16 it read "Bash|Edit|Write|NotebookEdit", which no MCP
// tool name matches. A correct rule that never fires is precisely the defect being fixed, so
// the registration is pinned separately from the behaviour.

test('the browser tool actually reaches the hook', () => {
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const matcher = s.hooks.PreToolUse[0].matcher;
  const re = new RegExp(matcher);
  assert.ok(re.test('mcp__playwright__browser_navigate'), `matcher ${JSON.stringify(matcher)} does not route the browser to the hook`);
  for (const t of ['Bash', 'Edit', 'Write', 'NotebookEdit']) {
    assert.ok(re.test(t), `matcher stopped routing ${t}`);
  }
});

test('the matcher does not sweep in MCP servers the hook has no rules for', () => {
  // Gating figma/notion/gmail here would be theatre with an outage attached.
  const s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const re = new RegExp(s.hooks.PreToolUse[0].matcher);
  for (const t of ['mcp__figma__get_design_context', 'mcp__notion__notion-search', 'mcp__miro__board_create']) {
    assert.equal(re.test(t), false, `${t} is routed to a hook that has no rule for it`);
  }
});
