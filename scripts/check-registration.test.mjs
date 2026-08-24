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
//
// ── WHICH TREE IS MUTATED, AND WHY IT MOVED ─────────────────────────────────────────────────
// These cases used to construct their failures by editing THIS repo's own
// .claude/hooks/pre-tool-use.sh and CLAUDE.md, restoring them in `finally`. With the OS sandbox
// armed (#94, `sandbox.enabled: true`), .claude/hooks/ is write-denied in the session the
// binding QA gate runs in — arming it protects that directory precisely BECAUSE writing there
// disarms the harness. The writes raised EPERM, so `npm run check` — the gate's own oracle —
// could not pass, and the gate BLOCKed on its oracle before dispatching any reviewer. CI never
// saw it: CI runs unsandboxed.
//
// The seam is a throwaway COPY of the tree under os.tmpdir(). check-registration.mjs derives
// ROOT from its own location (import.meta.url), so a copy of the checker inside a copy of the
// tree checks the copy — the same technique scripts/ledger.test.mjs already uses. Every
// mutation now lands in the throwaway, and a crashed run can no longer leave this repo in the
// ungoverned state check 11 exists to refuse.
//
// WHAT THE COPY PRESERVES, AND WHAT IT DOES NOT:
//   • Preserved — file content, byte for byte, and the tracked-file list. The copy is built FROM
//     that list rather than by walking the directory, and is then given its own index, so
//     `tracked()` answers with exactly the set the real tree does. `the throwaway copy is a
//     faithful stand-in` asserts both and fails if either stops holding. Without an index every
//     tracked()-driven check would inspect NOTHING and still exit 0, which is the failure shape
//     this file exists to refuse; and building from the list rather than the directory keeps a
//     stray untracked scratch file in someone's working tree from changing what gets checked.
//   • Not preserved — version-control history, and anything untracked. No check reads them.
//   • The two statements that are ABOUT this repo rather than about the rules — that the
//     checker passes on the tree as it stands, and that its GOVERNING docs carry no dead agent
//     names — run the REAL checker against the REAL tree. A copy cannot make those claims.

import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const trackedIn = (root) =>
  execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(Boolean).sort()

const COPY = fs.mkdtempSync(path.join(os.tmpdir(), 'registration-tree-'))
for (const rel of trackedIn(REPO)) {
  const src = path.join(REPO, rel)
  // A tracked file missing from the working tree is a broken checkout, not something to skip:
  // the copy would silently lose a file every check below assumes is there.
  assert.ok(fs.existsSync(src), `tracked file is absent from the working tree: ${rel}`)
  const dst = path.join(COPY, rel)
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  fs.copyFileSync(src, dst)
}
// `tracked()` in the checker shells out to `git ls-files`. Give the copy its own index, or it
// answers "no tracked files" and several checks pass by inspecting nothing. `-f` because a file
// can be tracked upstream while matching the .gitignore that came along with it.
execFileSync('git', ['init', '-q'], { cwd: COPY, stdio: 'pipe' })
execFileSync('git', ['add', '-A', '-f'], { cwd: COPY, stdio: 'pipe' })

after(() => fs.rmSync(COPY, { recursive: true, force: true }))

const CHECKER = path.join(COPY, 'scripts', 'check-registration.mjs')
const POLICY = path.join(COPY, '.claude', 'mcp-policy.json')

/** Runs the real checker over a tree. Returns {code, out} rather than throwing, so a FAILING run is data. */
function check(root, script) {
  try {
    const out = execFileSync('node', [script], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
    return { code: 0, out }
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

/** The checker, over the throwaway copy — the only tree these cases are allowed to mutate. */
const runChecker = () => check(COPY, CHECKER)
/** The checker, over the tree that ships. Read-only: nothing below mutates the real repo. */
const runRealChecker = () => check(REPO, path.join(REPO, 'scripts', 'check-registration.mjs'))

/**
 * Moves a file aside for the duration of fn and puts it back.
 *
 * rename, not delete: the content never exists only in memory, so an abrupt exit leaves the
 * bytes on disk under a sibling name rather than losing them. `finally` covers the throwing
 * case, and the caller asserts the restore actually happened — an unrestored policy file
 * would leave the tree in exactly the ungoverned state this check exists to refuse.
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
  const { code, out } = runRealChecker()
  assert.equal(code, 0, `checker failed on an unmodified tree:\n${out}`)
})

test('the throwaway copy is a faithful stand-in for the tree', () => {
  // Every case below constructs its failure in the copy. If the copy drifts from the tree, or
  // if its index is empty, those cases stop describing this repo — and every tracked()-driven
  // check would inspect nothing while still exiting 0.
  const real = trackedIn(REPO)
  const copied = trackedIn(COPY)
  assert.ok(real.length > 0, 'the real tree reports no tracked files — version control is not answering')
  assert.deepEqual(copied, real, 'the copy tracks a different set of files than the tree it stands in for')

  const { code, out } = runChecker()
  assert.equal(code, 0, `the checker failed on an unmodified copy:\n${out}`)
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
  const hook = path.join(COPY, '.claude', 'hooks', 'pre-tool-use.sh')
  const original = fs.readFileSync(hook)
  const invented = path.join(COPY, '.claude', 'invented-policy.json')

  try {
    fs.writeFileSync(hook, `${original.toString()}\n# reads .claude/invented-policy.json\n`)
    assert.equal(fs.existsSync(invented), false, 'the invented policy file should not exist')

    const { code, out } = runChecker()
    assert.equal(code, 1, `a hook naming an absent .claude/*.json did not fail:\n${out}`)
    assert.match(out, /\.claude\/invented-policy\.json/)
  } finally {
    fs.writeFileSync(hook, original)
  }

  // And the copy is back to its original state afterwards.
  assert.deepEqual(fs.readFileSync(hook), original)
  assert.equal(runChecker().code, 0)
})

test('a NESTED .claude path is not swept in — check 4 owns MANIFEST.json', () => {
  // The regex is deliberately top-level-only. Without that bound, every hook mentioning
  // .claude/skills/MANIFEST.json would be judged by a checker that has no business with it.
  const hook = path.join(COPY, '.claude', 'hooks', 'pre-tool-use.sh')
  const original = fs.readFileSync(hook)

  try {
    fs.writeFileSync(hook, `${original.toString()}\n# reads .claude/nowhere/absent.json\n`)
    const { code } = runChecker()
    assert.equal(code, 0, 'a nested path was treated as a top-level hook data file')
  } finally {
    fs.writeFileSync(hook, original)
  }
})


// ── check 12: org-chart docs must not name dead agent identifiers ──────────
//
// WHY THIS TEST EXISTS: CLAUDE.md previously described a 3-layer C-suite org with 21
// roles, ten of which had no agent file at all. The org chart was the source of truth
// agents read to know who their teammates are. A fabricated teammate is worse than a
// missing one: agents route to them, briefs address them, and nothing fails.
//
// The test constructs the failure explicitly: it appends dead names to the copy's CLAUDE.md
// (which is in the GOVERNING scope) and asserts exit 1. Using CLAUDE.md avoids inflating the
// slash-command count (which would pollute the readme-count check). The `withFileMovedAside`
// helper is not used here because we append rather than replace — the restore is a writeSync
// of the original buffer, matching the pattern of tests 3 and 4 above.

test('CLAUDE.md naming a dead agent identifier fails check 12', () => {
  const claudeMd = path.join(COPY, 'CLAUDE.md')
  const original = fs.readFileSync(claudeMd)
  // Append a line with dead names in a non-blockquote, non-table context.
  // No backticks (avoids dead-path scan), no markdown links (same), no paths.
  const injected = `${original.toString()}

INJECTED-TEST: the team includes backend-engineer, cto, and product-designer.
`

  let result
  try {
    fs.writeFileSync(claudeMd, injected)
    result = runChecker()
  } finally {
    fs.writeFileSync(claudeMd, original)
    assert.deepEqual(fs.readFileSync(claudeMd), original, 'CLAUDE.md was not restored')
  }

  assert.equal(result.code, 1, `dead agent names in CLAUDE.md did not fail the check. Output:\n${result.out}`)
  assert.match(result.out, /dead-agent-name/, 'failure must identify itself as check dead-agent-name')
  assert.ok(
    /backend-engineer|cto|product-designer/.test(result.out),
    `check output does not name any of the injected dead identifiers:\n${result.out}`
  )
})

test('check 12 does not fire on dead names in blockquotes (house-style correction text)', () => {
  // The house style puts superseded content in `>` blockquotes so corrections can mention
  // old names without tripping the rule they explain.
  const claudeMd = path.join(COPY, 'CLAUDE.md')
  const original = fs.readFileSync(claudeMd)
  // Append ONLY blockquoted dead names — should not trigger check 12.
  const injected = `${original.toString()}

> Superseded: the old roster included a backend-engineer and a cto.
> Those roles no longer exist as agent files.
`

  let code
  try {
    fs.writeFileSync(claudeMd, injected)
    ;({ code } = runChecker())
  } finally {
    fs.writeFileSync(claudeMd, original)
    assert.deepEqual(fs.readFileSync(claudeMd), original, 'CLAUDE.md was not restored')
  }

  assert.equal(code, 0, 'dead names inside blockquotes should not fail check 12')
})

test("check 12 passes when the repo's GOVERNING docs are clean", () => {
  // After the org-chart prose fix, CLAUDE.md and .claude/commands/color.md must contain no
  // dead agent names outside blockquotes. This verifies the CURRENT, REAL tree — a copy could
  // say nothing about the file a reader would open.
  const { code, out } = runRealChecker()
  assert.equal(code, 0, `registration check failed on the unmodified tree (check 12 may be misfiring):\n${out}`)
})
