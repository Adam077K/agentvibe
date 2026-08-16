// POSTURE: BLOCKS — wired into `npm run check` as `test:registration` and into
// .github/workflows/ci.yml next to the registration check it covers.
//
// WHY THIS FILE EXISTS: check 11 of scripts/check-registration.mjs exists because
// `.claude/mcp-policy.json` was a SILENT off-switch. Deleting it turns MCP governance
// entirely off — `[ -f "$_policy" ] || return 0` in .claude/hooks/pre-tool-use.sh — while
// deleting the hook it belongs to turns CI red via check 1. One file was guarded, the other
// held the rules.
//
// A check for a silent failure must not itself be asserted silently. Every case below
// CONSTRUCTS the failure — the policy file is really moved off disk and the real checker is
// really executed — because a test that only asserts the check exists would have the same
// shape as the bug it is here to prevent.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECKER = path.join(REPO, 'scripts', 'check-registration.mjs')
const POLICY = path.join(REPO, '.claude', 'mcp-policy.json')

/** Runs the real checker. Returns {code, out} rather than throwing, so a FAILING run is data. */
function runChecker() {
  try {
    const out = execFileSync('node', [CHECKER], { cwd: REPO, encoding: 'utf8', stdio: 'pipe' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

/**
 * Moves a file aside for the duration of fn and puts it back.
 *
 * rename, not delete: the content never exists only in memory, so an abrupt exit leaves the
 * bytes on disk under a sibling name rather than losing them. `finally` covers the throwing
 * case, and the caller asserts the restore actually happened — an unrestored policy file
 * would leave the repo in exactly the ungoverned state this check exists to refuse.
 */
function withFileMovedAside(file, fn) {
  const stash = `${file}.test-moved-aside`
  fs.renameSync(file, stash)
  try {
    return fn()
  } finally {
    fs.renameSync(stash, file)
  }
}

test('the registration checker passes on this repo as it stands', () => {
  const { code, out } = runChecker()
  assert.equal(code, 0, `checker failed on an unmodified tree:\n${out}`)
})

test('DELETING .claude/mcp-policy.json fails the registration check', () => {
  const before = fs.readFileSync(POLICY)

  const { code, out } = withFileMovedAside(POLICY, () => {
    assert.equal(fs.existsSync(POLICY), false, 'the policy file was not actually moved aside')
    return runChecker()
  })

  // The restore is asserted, not hoped for.
  assert.ok(fs.existsSync(POLICY), 'the policy file was not restored')
  assert.deepEqual(fs.readFileSync(POLICY), before, 'the policy file came back changed')

  assert.equal(code, 1, `a missing MCP policy did not fail the check. Output:\n${out}`)
  assert.match(out, /hook-data-file/)
  assert.match(out, /\.claude\/mcp-policy\.json/)
  // The message must name the fix, not just the fact.
  assert.match(out, /ungoverned/)
  assert.match(out, /matcher/)
})

test('the failure names the hook that reads the file, so the fix has an address', () => {
  const { out } = withFileMovedAside(POLICY, runChecker)
  assert.match(out, /\.claude\/hooks\/pre-tool-use\.sh reads \.claude\/mcp-policy\.json/)
})

test('the rule is derived from the hook, not a hardcoded filename', () => {
  // If check 11 hardcoded `mcp-policy.json`, a SECOND policy file introduced later would be
  // unguarded and nothing would say so. Constructing that second file proves the rule
  // generalises: a hook naming a top-level .claude/*.json that does not exist must fail.
  const hook = path.join(REPO, '.claude', 'hooks', 'pre-tool-use.sh')
  const original = fs.readFileSync(hook)
  const invented = path.join(REPO, '.claude', 'invented-policy.json')

  try {
    fs.writeFileSync(hook, `${original.toString()}\n# reads .claude/invented-policy.json\n`)
    assert.equal(fs.existsSync(invented), false, 'the invented policy file should not exist')

    const { code, out } = runChecker()
    assert.equal(code, 1, `a hook naming an absent .claude/*.json did not fail:\n${out}`)
    assert.match(out, /\.claude\/invented-policy\.json/)
  } finally {
    fs.writeFileSync(hook, original)
  }

  // And the tree is clean again afterwards.
  assert.deepEqual(fs.readFileSync(hook), original)
  assert.equal(runChecker().code, 0)
})

test('a NESTED .claude path is not swept in — check 4 owns MANIFEST.json', () => {
  // The regex is deliberately top-level-only. Without that bound, every hook mentioning
  // .claude/skills/MANIFEST.json would be judged by a checker that has no business with it.
  const hook = path.join(REPO, '.claude', 'hooks', 'pre-tool-use.sh')
  const original = fs.readFileSync(hook)

  try {
    fs.writeFileSync(hook, `${original.toString()}\n# reads .claude/nowhere/absent.json\n`)
    const { code } = runChecker()
    assert.equal(code, 0, 'a nested path was treated as a top-level hook data file')
  } finally {
    fs.writeFileSync(hook, original)
  }
})
