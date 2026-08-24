// POSTURE: BLOCKS. Wired into `npm run check` as `test:protected-write`, first in the chain,
// because it is the check that says whether the other checks are being watched at all.
//
// scripts/protected-write.test.mjs — proof that scripts/protected-write-tripwire.cjs fires.
//
// WHY THIS FILE EXISTS: `npm run check` had two steps that could not pass in the environment it
// actually runs in. Arming the OS sandbox (#94) made .claude/agents/ and .claude/hooks/
// write-denied in the session the binding QA gate runs in, and two tests built their fixtures
// there, so the gate BLOCKed on its own oracle for every diff — before any reviewer ran. CI
// stayed green because CI runs unsandboxed. It went unnoticed for a day: no PR had ever
// completed a gate run, so nothing exercised the path where it was broken.
//
// The tripwire is the durable half of the fix. This file is what stops the tripwire from
// becoming the same class of decoration it exists to prevent: a guard nobody has watched fire
// is not a guard. Every case below CONSTRUCTS the violation in a child process and reads what
// came back.
//
// WHAT THIS FILE ASSERTS, AND WHAT IT LEAVES OPEN:
//   ✓ the tripwire refuses a write into a protected directory, and names the path
//   ✓ it permits an ordinary fixture write elsewhere in the tree — it is not a blanket refusal
//   ✓ every `node --test` step reachable from `npm run check` preloads it, so a new test file
//     cannot join the chain unguarded
//   ~ no guarded test reaches for an fs API the tripwire does not wrap — this one is a GREP.
//     It reads the source for the async and promise write APIs. Indirection defeats it, and it
//     says nothing about a test that shells out.
//   ✗ nothing here checks the runtime's real deny set. The tripwire's list is a hardcoded floor,
//     measured 2026-08-24; if the sandbox widens, this suite will not notice.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TRIPWIRE = path.join(REPO, 'scripts', 'protected-write-tripwire.cjs')
const PRELOAD = './scripts/protected-write-tripwire.cjs'

/**
 * The environment for a probe, minus the test runner's own bookkeeping.
 *
 * NODE_TEST_CONTEXT is set in every file the runner executes. Inherited by a grandchild that is
 * itself `node --test`, it makes that grandchild believe it is already a test worker: it runs no
 * files, prints nothing and exits 0. A probe that asserts "the write was refused" would then pass
 * for the wrong reason — silently, and forever. Found by watching this file fail.
 */
function probeEnv(extra) {
  const env = { ...process.env, ...extra }
  for (const k of Object.keys(env)) if (k.startsWith('NODE_TEST')) delete env[k]
  return env
}

/** Writes a one-case test file into tmp that writes to `target`, and runs it under the tripwire. */
function runProbe(target) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tripwire-probe-'))
  const probe = path.join(dir, 'probe.test.mjs')
  fs.writeFileSync(probe, [
    "import { test } from 'node:test'",
    "import fs from 'node:fs'",
    "test('probe write', () => { fs.writeFileSync(process.env.PROBE_TARGET, 'probe\\n') })",
    '',
  ].join('\n'))
  try {
    const out = execFileSync(process.execPath, ['--require', TRIPWIRE, '--test', probe], {
      cwd: REPO, encoding: 'utf8', stdio: 'pipe', env: probeEnv({ PROBE_TARGET: target }),
    })
    assert.match(out, /^ℹ tests 1$/m, `the probe ran no test case — it proved nothing:\n${out}`)
    return { code: 0, out }
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    assert.match(out, /^ℹ tests 1$/m, `the probe ran no test case — it proved nothing:\n${out}`)
    return { code: e.status ?? 1, out }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * Removes a path from an UNGUARDED child.
 *
 * This process preloads the tripwire too — deliberately, so no script needs an exemption — and
 * the tripwire would refuse to delete a protected path from here. Cleanup after a MISS therefore
 * has to happen somewhere the guard is not installed.
 */
function removeUnguarded(target) {
  execFileSync(process.execPath, ['-e', 'require("fs").rmSync(process.argv[1], { force: true })', target], {
    stdio: 'pipe',
  })
}

test('the tripwire refuses a write into a protected directory, and says why', () => {
  // .claude/agents is the directory the original defect wrote into. If the tripwire misses, the
  // file lands for real, so the cleanup below runs unconditionally and the assertion still fails.
  const target = path.join(REPO, '.claude', 'agents', 'zz-protected-write-probe.md')
  let result
  try {
    result = runProbe(target)
  } finally {
    removeUnguarded(target)
  }

  assert.notEqual(result.code, 0, `a write into .claude/agents/ was allowed:\n${result.out}`)
  assert.match(result.out, /EPROTECTEDWRITE/, 'the failure must be the tripwire, not an incidental error')
  assert.match(result.out, /zz-protected-write-probe\.md/, 'the message must name the path that was refused')
  assert.match(result.out, /os\.tmpdir\(\)/, 'the message must name the fix, not only the fact')
})

test('the tripwire permits an ordinary fixture write elsewhere in the tree', () => {
  // Guarding against the lazy fix: refusing every write would satisfy the case above and break
  // scripts/lenses.test.mjs, which writes .lens-fixture-*.yml at the repo root and is right to.
  const target = path.join(REPO, '.zz-protected-write-probe.yml')
  let result
  try {
    result = runProbe(target)
    assert.equal(result.code, 0, `an ordinary fixture write was refused:\n${result.out}`)
    assert.equal(fs.readFileSync(target, 'utf8'), 'probe\n', 'the write was reported as allowed but did not happen')
  } finally {
    fs.rmSync(target, { force: true })
  }
})

test('the protected list names the directories whose contents ARE the harness', () => {
  const { PROTECTED } = JSON.parse(execFileSync(
    process.execPath,
    ['-e', 'const t = require(process.argv[1]); process.stdout.write(JSON.stringify({ PROTECTED: t.PROTECTED }))', TRIPWIRE],
    { encoding: 'utf8', stdio: 'pipe' }
  ))
  // Every .claude/ entry that a probe found write-denied at the SESSION ROOT on 2026-08-24.
  // .claude/commands and .claude/workflows were missed on the first cut and added after review:
  // commands/ holds the slash-command definitions, workflows/ holds the gate itself, and a
  // fixture built in either reproduces this PR's defect somewhere nobody was looking.
  for (const rel of [
    '.claude/agents', '.claude/commands', '.claude/hooks', '.claude/skills', '.claude/workflows',
  ]) {
    assert.ok(
      PROTECTED.includes(path.join(REPO, ...rel.split('/'))),
      `${rel} is not protected — writing there is what disarms the harness`
    )
  }
})

// ── The wiring, so a new test file cannot join the chain unguarded ───────────────────────────

/** Every npm script reachable from `check`, following `npm run X` references. */
function reachableScripts() {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'))
  const seen = new Map()
  const walk = (name) => {
    if (seen.has(name)) return
    const cmd = pkg.scripts[name]
    if (cmd === undefined) return
    seen.set(name, cmd)
    for (const m of cmd.matchAll(/npm run ([\w:-]+)/g)) walk(m[1])
  }
  walk('check')
  return seen
}

test('every node --test step reachable from `npm run check` preloads the tripwire', () => {
  const scripts = reachableScripts()
  assert.ok(scripts.size > 20, `only ${scripts.size} scripts reachable from check — the walk is not finding them`)

  const unguarded = []
  for (const [name, cmd] of scripts) {
    if (!/\bnode\b[^&|]*--test\b/.test(cmd)) continue
    if (!cmd.includes(PRELOAD)) unguarded.push(name)
  }
  assert.deepEqual(
    unguarded, [],
    `these test steps run without the tripwire, so a fixture written into .claude/agents/ ` +
    `would go unnoticed until the gate BLOCKed on its oracle: ${unguarded.join(', ')}`
  )
})

test('this file is itself in the chain — a guard outside the chain guards nothing', () => {
  assert.ok(reachableScripts().has('test:protected-write'), 'test:protected-write is not reachable from check')
})

/**
 * The test files the guarded scripts actually run, read off the `--test` arguments.
 *
 * Reading them from the scripts rather than globbing scripts/*.test.mjs is what pulls in
 * .claude/workflows/lib/gate-logic.test.mjs, which the first cut of the grep below silently
 * skipped — a scan whose scope is a directory rather than the thing under test.
 */
function guardedTestFiles() {
  const files = new Set()
  for (const cmd of reachableScripts().values()) {
    const m = cmd.match(/--test\s+([^&|]+)/)
    if (!m) continue
    for (const token of m[1].trim().split(/\s+/)) {
      if (token.startsWith('-')) continue
      files.add(path.join(REPO, token))
    }
  }
  return [...files].sort()
}

test('no guarded test reaches for an fs write API the tripwire does not wrap', () => {
  // A GREP, and honest about it: the tripwire wraps the synchronous mutators only, so an async
  // or promise write would slip past it silently. This reads the sources for those APIs rather
  // than trusting the convention. Indirection (`const w = fs.writeFile`) defeats it.
  const ASYNC_WRITE = /\bfs\.(?:promises\b|createWriteStream\b|(?:writeFile|appendFile|mkdir|mkdtemp|rename|symlink|rm|rmdir|unlink|copyFile|cp|truncate|chmod)\s*\()/g
  const files = guardedTestFiles()
  assert.ok(
    files.includes(path.join(REPO, '.claude', 'workflows', 'lib', 'gate-logic.test.mjs')),
    'the scan is not reaching outside scripts/ — gate-logic.test.mjs is guarded and must be read'
  )
  assert.ok(files.length >= 24, `only ${files.length} test files found — the argument scan is missing some`)

  const offenders = []
  for (const file of files) {
    assert.ok(fs.existsSync(file), `a guarded script names a test file that does not exist: ${file}`)
    const src = fs.readFileSync(file, 'utf8')
    for (const m of src.matchAll(ASYNC_WRITE)) offenders.push(`${path.relative(REPO, file)}: ${m[0]}`)
  }
  assert.deepEqual(
    offenders, [],
    'these calls are outside what the tripwire wraps — either use the Sync form or widen the tripwire'
  )
})
