// POSTURE: BLOCKS — wired into `npm run check` as `test:pre-tool-use`. Every case below is a
// security property of .claude/hooks/pre-tool-use.sh, which is (since 5290edd unregistered
// budget-guard) the ONLY hook in the repo that can refuse a tool call.
//
// WHY THIS FILE EXISTS: the hook shipped with zero tests. A review on 2026-08-13 found it fails
// open in four independent ways, each reproduced by executing it. Written red-first: every
// `mustBlock` case below was verified FAILING against the pre-fix hook, so a green run proves the
// fix, not the test's own optimism.
//
// THE SECOND BARRIER: a test that only feeds pretty-printed JSON would pass against a hook that
// cannot parse the compact payload Claude Code actually sends. So every dangerous case runs
// through BOTH payload shapes, and `payload shapes are not silently identical` asserts the two
// encoders really do differ — without it, a bug that made both shapes pretty would turn this
// whole file into decoration.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HOOK = path.join(REPO, '.claude', 'hooks', 'pre-tool-use.sh')

const ALLOW = 0
const BLOCK = 2

/** Claude Code sends compact JSON on one line; the hook's own header documents this shape. */
const compact = (obj) => JSON.stringify(obj)
/** Pretty-printed — the only shape the pre-fix hook's line-oriented awk could route correctly. */
const pretty = (obj) => JSON.stringify(obj, null, 2)

function runHook(payload, env = {}) {
  try {
    // CLAUDE_PROJECT_DIR is pinned to REPO by default: inheriting it from whatever shell launched
    // the test makes every scoping assertion depend on which worktree the harness started in.
    execFileSync('bash', [HOOK], {
      input: payload,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_PROJECT_DIR: REPO, ...env },
    })
    return 0
  } catch (err) {
    if (typeof err.status === 'number') return err.status
    throw err
  }
}

const bash = (command) => ({ session_id: 'test-session', tool_name: 'Bash', tool_input: { command } })
const write = (file_path) => ({ session_id: 'test-session', tool_name: 'Write', tool_input: { file_path } })

// ── the guard must not depend on how the payload happens to be encoded ──────────────────────

test('payload shapes are not silently identical — the barrier that keeps this file honest', () => {
  const obj = bash('rm -rf /')
  assert.notEqual(compact(obj), pretty(obj), 'compact and pretty encoders produced the same string; every two-shape assertion below would be vacuous')
  assert.ok(!compact(obj).includes('\n'), 'compact payload must be single-line — that is the shape that defeated the awk parser')
  assert.ok(pretty(obj).includes('\n'), 'pretty payload must be multi-line')
})

// ── destructive filesystem commands ─────────────────────────────────────────────────────────

const MUST_BLOCK_BASH = [
  ['rm -rf /', 'canonical destructive form'],
  ['rm -rf ~', 'home directory'],
  ['rm -r -f /', 'separated flags — the same command, spelled so the pre-fix regex missed it'],
  ['rm -fR /', 'reordered and case-varied flags'],
  ['git clean -fdx', 'removes .worktrees/.registry and .claude/memory/sessions/, destroying the multi-agent coordination state AND the session files the CI gate greps for its verdict'],
  ['git checkout .', 'discards every uncommitted change in the tree'],
  ['git restore .', 'same destruction, current spelling'],
  [`find ${os.homedir()} -delete`, 'deletes without ever naming rm'],
  [`node -e "require('fs').rmSync('/', {recursive:true, force:true})"`, 'destruction through an allowlisted interpreter'],
]

for (const [command, why] of MUST_BLOCK_BASH) {
  for (const [shape, encode] of [['compact', compact], ['pretty', pretty]]) {
    test(`BLOCKS [${shape}] ${command} — ${why}`, () => {
      assert.equal(runHook(encode(bash(command))), BLOCK, `hook allowed a destructive command on a ${shape} payload`)
    })
  }
}

// ── path scoping: nothing outside the project root is writable ──────────────────────────────

const MUST_BLOCK_WRITE = [
  [path.join(os.homedir(), '.ssh', 'id_rsa'), 'private key'],
  [path.join(os.homedir(), '.aws', 'credentials'), 'cloud credentials'],
  [path.join(os.homedir(), '.claude', 'settings.json'), 'the permission model itself — one write disarms every hook, so allowing this makes all other rules advisory'],
  [path.join(REPO, '.env'), 'secrets file'],
]

for (const [file, why] of MUST_BLOCK_WRITE) {
  for (const [shape, encode] of [['compact', compact], ['pretty', pretty]]) {
    test(`BLOCKS [${shape}] Write ${file.replace(os.homedir(), '~')} — ${why}`, () => {
      assert.equal(runHook(encode(write(file))), BLOCK, `hook allowed a write outside the project root on a ${shape} payload`)
    })
  }
}

// ── secrets are protected in BOTH directions ────────────────────────────────────────────────
// Blocking `Write .env` while allowing `cat .env` protects the file and leaks its contents:
// the read lands in ~/.claude/projects/*.jsonl as permanent plaintext.

for (const command of ['cat .env', 'sed -n "1,50p" .env', 'awk "{print}" .env']) {
  test(`BLOCKS reading secrets via an allowlisted tool — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), BLOCK, 'hook allowed a secrets file to be read into the transcript')
  })
}

// ── ordinary work must still flow ───────────────────────────────────────────────────────────
// A guard that blocks everything is not a guard, it is an outage. These pin the false-positive
// budget: if hardening the hook breaks these, the fix went too far.

const MUST_ALLOW = [
  'git status',
  'git commit -m "feat: a thing"',
  'npm run check',
  'node --test scripts/ledger.test.mjs',
  'rm -f /tmp/scratch-file.txt',
  'ls -la',
]

for (const command of MUST_ALLOW) {
  test(`ALLOWS ordinary work — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), ALLOW, 'hook blocked a legitimate command; the false-positive budget is blown')
  })
}

test('ALLOWS writes inside the project root', () => {
  assert.equal(runHook(compact(write(path.join(REPO, 'docs', 'scratch.md')))), ALLOW)
})

// The scoping check must decide containment the way the FILESYSTEM does, not the way string
// comparison does. Three ways a correct path used to be refused, all regressions worth pinning.

test('ALLOWS a write when the root is spelled with different case (case-insensitive FS)', () => {
  // macOS reaches one directory under many spellings, and this repo is opened under both
  // `agentvibe` and `Agentvibe`. A case-sensitive prefix match refused writes that were inside
  // the project. Skips on a case-sensitive filesystem, where the two really are different paths.
  const flipped = REPO.replace(/(^.*\/)([a-zA-Z])/, (_, head, c) =>
    head + (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()))
  if (flipped === REPO || !fs.existsSync(flipped)) return // case-sensitive FS: nothing to test
  assert.equal(
    runHook(compact(write(path.join(REPO, 'docs', 'scratch.md'))), { CLAUDE_PROJECT_DIR: flipped }),
    ALLOW,
    'a differently-cased spelling of the SAME directory must not read as outside the project')
})

test('ALLOWS a new file in a subdirectory that does not exist yet', () => {
  // A new file has no realpath, and neither does its new parent. Resolution must walk up to the
  // nearest existing ancestor rather than give up and refuse.
  assert.equal(runHook(compact(write(path.join(REPO, 'docs', 'no', 'such', 'dir', 'new.md')))), ALLOW)
})

test('BLOCKS a write through a symlink pointing outside the project', () => {
  // The write follows the link, so the TARGET decides containment. Scoping only the link's own
  // location makes an in-project symlink a hole straight out of it.
  const link = path.join(REPO, 'docs', `.scoping-probe-${process.pid}`)
  fs.symlinkSync(path.join(os.homedir(), '.ssh', 'id_rsa'), link)
  try {
    assert.equal(runHook(compact(write(link))), BLOCK)
  } finally {
    fs.unlinkSync(link)
  }
})

// ── $HOME/.claude/plans/ is the only subdirectory of $HOME/.claude/ that is writable ────────
//
// Change 1 (path-scoping fix) opens exactly this one directory. The tests below pin that the
// boundary is narrow: plans/ is allowed; the parent ~/.claude/ and its siblings are not.
//
// Test (a) — red before Change 1, green after.
// Tests (b), (c), (d) — green before AND after: regression pins that prove Change 1 did not
// widen the boundary into ~/.claude/ itself. (b) matters most: ~/.claude/settings.json registers
// PreToolUse; a write there disarms every rule in this file.

test('ALLOWS a write to a file under $HOME/.claude/plans/ — plan-mode storage', () => {
  // Red before the path-scoping fix, green after.
  const planFile = path.join(os.homedir(), '.claude', 'plans', 'test-plan.md')
  assert.equal(runHook(compact(write(planFile))), ALLOW,
    'hook blocked a write to $HOME/.claude/plans/ — plan-mode is unusable')
})

test('BLOCKS a write to $HOME/.claude/settings.json — the regression that would matter most', () => {
  // Green before and after Change 1: proves the plans/ exemption did not widen to ~/.claude/.
  const settingsFile = path.join(os.homedir(), '.claude', 'settings.json')
  assert.equal(runHook(compact(write(settingsFile))), BLOCK,
    'hook allowed a write to settings.json — the entire permission model is now disarmed')
})

test('BLOCKS a write to $HOME/.claude/agents/whatever.md', () => {
  // Green before and after Change 1: a sibling of plans/ must stay blocked.
  const agentsFile = path.join(os.homedir(), '.claude', 'agents', 'whatever.md')
  assert.equal(runHook(compact(write(agentsFile))), BLOCK,
    'hook allowed a write to $HOME/.claude/agents/ — blocked paths must stay blocked after plans/ exemption')
})

test('ALLOWS writes inside the project and BLOCKS ~/.ssh after plans/ exemption is added', () => {
  // Green before and after Change 1: pins that the existing allow/block boundary is unchanged.
  assert.equal(runHook(compact(write(path.join(REPO, 'src', 'new-file.ts')))), ALLOW,
    'hook blocked a write inside the project root')
  assert.equal(runHook(compact(write(path.join(os.homedir(), '.ssh', 'id_rsa')))), BLOCK,
    'hook allowed a write to an SSH private key after plans/ exemption was added')
})

// ── the hook must never fail open on a malformed payload ────────────────────────────────────
// `unresolved` is not `allow`. A guard that cannot read its input must refuse, not wave through.

for (const [label, payload] of [
  ['empty string', ''],
  ['not JSON at all', 'this is not json'],
  ['truncated JSON', '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"'],
  ['tool_name missing', JSON.stringify({ tool_input: { command: 'rm -rf /' } })],
  ['command nested unexpectedly', JSON.stringify({ tool_name: 'Bash', tool_input: { command: { $: 'rm -rf /' } } })],
]) {
  test(`BLOCKS on an unparseable payload — ${label}`, () => {
    assert.equal(runHook(payload), BLOCK, 'hook failed OPEN on input it could not parse')
  })
}
