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
//   ✓ BOTH FLOORS ARE DERIVED FROM THE SUITE UNDER TEST, not from this repository's size. They
//     were `scripts.size > 20` and `files.length >= 24`, calibrated against 48 steps, and a
//     nine-step port failed them with nothing wrong anywhere. A floor that only holds at one
//     repository's scale reports the port as broken and says nothing about the walk.
//   ✗ nothing here checks the runtime's real deny set. The tripwire's list is a hardcoded floor,
//     measured 2026-08-24; if the sandbox widens, this suite will not notice.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { STEPS, reachable } = require('./lib/check-suite.js')

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

/**
 * Writes a one-case test file into tmp that writes to `target`, and runs it under the tripwire.
 *
 * ── THE PROBE ANNOUNCES ITSELF BY TOUCHING A FILE, NOT BY ITS REPORTER'S WORDING ─────────────
 * "The probe actually ran a case" used to be checked with `assert.match(out, /^ℹ tests 1$/m)`.
 * That `ℹ` line is the SPEC reporter's summary, and `node --test` chooses its default reporter by
 * version: Node 20 emits TAP (`# tests 1`), Node 22+ emits spec (`ℹ tests 1`). Locally on Node 24
 * it passed; `ci.yml` pins node-version 20, where it could never match. It turned main red on the
 * first step of the suite, with everything after it skipped — and the probe itself had worked
 * perfectly, EPROTECTEDWRITE and all. The DETECTOR failed, by asserting a format rather than a
 * fact, and no seam had ever run this file on the version CI uses.
 *
 * So the case now records that it started by creating a marker in tmp, and this function asserts
 * the marker exists. It is the load-bearing check: a file either is there or is not, under any
 * reporter, on any Node, whatever the runner prints. The marker is written BEFORE the probed
 * write, because the blocked case is supposed to throw on that line and must still prove it ran.
 *
 * The reporter is ALSO pinned to tap, for the other assertions — the callers match
 * EPROTECTEDWRITE and the offending path out of this same output, so the format being parsed
 * should be chosen rather than inherited from whatever Node is installed. TAP because it is the
 * machine-readable one and is available on every version this repo supports. The summary line is
 * still checked, but as a deterministic consequence of that pin rather than as the whole proof.
 *
 * The failure mode both are aimed at: NODE_TEST_CONTEXT leaking into the grandchild makes it run
 * no files, print nothing, and exit 0 — which a probe asserting "the write was refused" would
 * pass for the wrong reason, silently and forever. See probeEnv().
 */
function runProbe(target) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tripwire-probe-'))
  const probe = path.join(dir, 'probe.test.mjs')
  const marker = path.join(dir, 'case-ran.marker')
  fs.writeFileSync(probe, [
    "import { test } from 'node:test'",
    "import fs from 'node:fs'",
    "test('probe write', () => {",
    "  fs.writeFileSync(process.env.PROBE_MARKER, 'ran\\n')",
    "  fs.writeFileSync(process.env.PROBE_TARGET, 'probe\\n')",
    '})',
    '',
  ].join('\n'))

  const args = ['--require', TRIPWIRE, '--test', '--test-reporter=tap', probe]
  const env = probeEnv({ PROBE_TARGET: target, PROBE_MARKER: marker })

  /** Both exit paths prove the same thing the same way. */
  const check = (out) => {
    assert.ok(
      fs.existsSync(marker),
      `the probe ran no test case — it proved nothing:\n${out}`
    )
    assert.match(
      out,
      /^# tests 1$/m,
      `the probe's reporter is not the pinned TAP — the other assertions parse this output:\n${out}`
    )
  }

  try {
    const out = execFileSync(process.execPath, args, {
      cwd: REPO, encoding: 'utf8', stdio: 'pipe', env,
    })
    check(out)
    return { code: 0, out }
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    check(out)
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

/**
 * Every npm script the suite reaches, mapped to its command.
 *
 * This used to walk `npm run X` out of package.json's `check` string itself. That string is now
 * a single runner — the `&&` chain silently skipped every step after the first failure — so the
 * walk starts from STEPS in scripts/lib/check-suite.js, which is where the suite lives. It
 * delegates to that module's `reachable()` rather than reimplementing the traversal: two
 * implementations of "what does the suite run" would disagree, and this file's whole job is to
 * notice when a test joins the suite unguarded.
 */
const PKG_SCRIPTS = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).scripts

function reachableScripts() {
  return new Map([...reachable(PKG_SCRIPTS, STEPS)].map((name) => [name, PKG_SCRIPTS[name]]))
}

/** The command shape this file guards: a step that runs `node --test`. */
const RUNS_TESTS = /\bnode\b[^&|]*--test\b/

test('every node --test step reachable from `npm run check` preloads the tripwire', () => {
  const scripts = reachableScripts()

  // ── THE NON-VACUITY FLOOR, DERIVED FROM THE SUITE UNDER TEST ───────────────────────────────
  // It read `scripts.size > 20`, a number calibrated to a 48-step suite. Ported to a nine-step
  // project it fired on a correct suite — a floor of twenty against nine asserts only that this is
  // a different repository, which is not a property of the walk. What it was reaching for is that
  // the walk RESOLVES: every STEP that exists as a script must come back from it. That fails the
  // same way a walk which has stopped finding anything fails, and it holds at any suite size.
  const declared = STEPS.filter((s) => Object.prototype.hasOwnProperty.call(PKG_SCRIPTS, s))
  assert.ok(declared.length > 0, 'no STEP names a script in package.json — the suite is not wired at all')
  for (const step of declared) {
    assert.ok(scripts.has(step), `${step} is a STEP and the walk did not reach it — the walk is not finding them`)
  }

  const unguarded = []
  for (const [name, cmd] of scripts) {
    if (!RUNS_TESTS.test(cmd)) continue
    if (!cmd.includes(PRELOAD)) unguarded.push(name)
  }
  assert.deepEqual(
    unguarded, [],
    `these test steps run without the tripwire, so a fixture written into .claude/agents/ ` +
    `would go unnoticed until the gate BLOCKed on its oracle: ${unguarded.join(', ')}`
  )
})

test('this file is itself in the chain — a guard outside the chain guards nothing', () => {
  assert.ok(reachableScripts().has('test:protected-write'), 'test:protected-write is not in STEPS — a guard outside the suite guards nothing')
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

  // ── THE SCOPE CONTROL, EXPRESSED AGAINST THE SUITE UNDER TEST ──────────────────────────────
  // This used to name one path — .claude/workflows/lib/gate-logic.test.mjs — as proof the scan
  // reaches outside scripts/, and `files.length >= 24` as proof it is finding anything at all.
  // Both are facts about one repository: the path is absent from a port, and the count fires on a
  // correct nine-step suite. The property is that the scan's SCOPE is the `--test` ARGUMENTS and
  // not a glob of scripts/, so it is cross-checked against a raw token scan of the same commands —
  // an extraction wrong in a different way, the same idiom the ci.yml parser is held to. A scan
  // narrowed to a directory still drops every guarded file outside it, and now says so wherever
  // the suite names one.
  const rawNamed = new Set()
  let testScripts = 0
  for (const cmd of reachableScripts().values()) {
    if (!RUNS_TESTS.test(cmd)) continue
    testScripts += 1
    for (const token of cmd.split(/\s+/)) {
      if (/\.test\.[cm]?js$/.test(token)) rawNamed.add(path.join(REPO, token))
    }
  }
  assert.ok(testScripts > 0, 'no reachable script runs `node --test` — the walk is not finding them')
  assert.deepEqual(
    files, [...rawNamed].sort(),
    'the argument scan and a raw token scan disagree about which files the suite runs — a scan whose ' +
    'scope is a directory rather than the `--test` arguments silently drops every guarded test file ' +
    'that lives outside it'
  )
  assert.ok(
    files.length >= testScripts,
    `${testScripts} reachable scripts run \`node --test\` and only ${files.length} files came back — ` +
    'the argument scan is missing some'
  )

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
