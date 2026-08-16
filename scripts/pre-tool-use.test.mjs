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

// ── the force-push rule: both orderings, and the word boundary that was missing ──────────────
// The rule is written twice, once per argument order. Only the first carried `\b` after the
// `-f` alternation, so the second matched `-f` inside ANY hyphenated word appearing after the
// literal "main" — `--body-file`, `risk-full`, `notes-final`. Found when `gh pr create
// --base main --body-file ...` in the same command as a `git push` was refused as a
// force-push to main. Both orderings are pinned here so a future edit cannot fix one and
// leave the other, which is exactly how this defect survived.

const FORCE_PUSH_MUST_BLOCK = [
  'git push --force origin main',
  'git push origin main --force',
  'git push -f origin main',
  'git push origin main -f',
  'git push --force origin master',
  'git push origin master -f',
  'git push --force-with-lease origin main',
]

for (const command of FORCE_PUSH_MUST_BLOCK) {
  test(`BLOCKS force-push to a protected branch — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), BLOCK, 'a genuine force-push to main/master was allowed')
  })
}

const FORCE_PUSH_MUST_ALLOW = [
  // The exact shape that exposed the bug: a push, then a PR opened against main, one command.
  'git push -u origin feat/thing && gh pr create --base main --body-file /tmp/body.md',
  // `-f` inside a hyphenated word after "main" — the unbounded alternation matched all of these.
  'git push origin feat/thing && gh pr edit --base main --add-label risk-full',
  'git push origin feat/thing && echo "merged to main" > notes-final.txt',
  // A force-push to a branch that is not main/master is the author's own business.
  'git push --force origin feat/my-topic-branch',
  // Ordinary pushes, including to a branch whose name merely contains the word.
  'git push -u origin fix/safety-floor-and-gate',
  'git push origin feat/domain-model',
]

for (const command of FORCE_PUSH_MUST_ALLOW) {
  test(`ALLOWS non-force-push work — ${command}`, () => {
    assert.equal(runHook(compact(bash(command))), ALLOW, 'hook blocked a legitimate push; the false-positive budget is blown')
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

// ── The browser grant: localhost only ────────────────────────────────────────────────────
// designer got the playwright MCP on 2026-08-16 — the first live MCP capability here. The
// binding QA gate found that MCP calls reached NO safety control: the hook was registered with
// matcher "Bash|Edit|Write|NotebookEdit", which no MCP tool name matches. Meanwhile DECISIONS.md
// justified removing the permissions flag partly on "the PreToolUse hook still fired". True for
// Bash; false for this.
//
// Localhost-only is the whole grant, and it is not a compromise: the perception loop is "look at
// what I just rendered". References come from the refero/figma/stitch MCP servers; docs from
// WebFetch. A deployed preview host goes in AGENTVIBE_BROWSER_HOSTS when one exists.

const nav = (url) => ({ session_id: 'test-session', tool_name: 'mcp__playwright__browser_navigate', tool_input: { url } })

const BROWSER_ALLOWED = [
  'http://localhost:3000',
  'http://localhost:3000/pricing',
  'http://localhost',
  'https://localhost:8443/x',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5173/a/b?c=d',
  'http://[::1]:3000/',
  'about:blank',
]

for (const url of BROWSER_ALLOWED) {
  test(`ALLOWS browsing our own output — ${url}`, () => {
    assert.equal(runHook(compact(nav(url))), ALLOW, 'the perception loop must be able to look at localhost')
  })
}

const BROWSER_BLOCKED = [
  ['https://example.com', 'the open internet'],
  ['http://169.254.169.254/latest/meta-data/', 'cloud metadata endpoint'],
  ['http://192.168.1.1/', 'the local network is not the local machine'],
  ['http://10.0.0.5:8080/', 'private range'],
  ['file:///etc/passwd', 'local file read through the browser'],
  ['https://localhost.evil.com/', 'a hostname that merely STARTS with localhost'],
  ['http://127.0.0.1.evil.com/', 'the same trick on the IP form'],
]

for (const [url, why] of BROWSER_BLOCKED) {
  test(`BLOCKS browsing off-machine — ${url} (${why})`, () => {
    assert.equal(runHook(compact(nav(url))), BLOCK, `hook allowed navigation to ${url}`)
  })
}

test('BLOCKS a navigation whose url cannot be read — fails closed like every other rule here', () => {
  assert.equal(runHook(compact({ session_id: 'test-session', tool_name: 'mcp__playwright__browser_navigate', tool_input: {} })), BLOCK)
})

test('a deployed preview host can be permitted without touching the hook', () => {
  const env = { AGENTVIBE_BROWSER_HOSTS: 'agentvibe.vercel.app' }
  assert.equal(runHook(compact(nav('https://agentvibe.vercel.app/pricing')), env), ALLOW)
  // and it does not become a wildcard
  assert.equal(runHook(compact(nav('https://evil.com')), env), BLOCK)
  assert.equal(runHook(compact(nav('https://agentvibe.vercel.app.evil.com')), env), BLOCK)
})

test('other MCP servers are untouched — the guard only understands the browser', () => {
  // Gating tools this hook has no rules for would be theatre with an outage attached.
  for (const t of ['mcp__figma__get_design_context', 'mcp__notion__notion-search']) {
    assert.equal(runHook(compact({ session_id: 'test-session', tool_name: t, tool_input: { q: 'x' } })), ALLOW, `${t} was gated`)
  }
})
