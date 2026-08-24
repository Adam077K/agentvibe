// POSTURE: BLOCKS in the binding QA gate. BLOCKS in CI for 14 of the 25 steps it is wired to.
// Preloaded with `--require` by every `node --test` script in `npm run check` — 25 of them — and
// scripts/protected-write.test.mjs fails if one stops carrying it.
//
// scripts/protected-write-tripwire.cjs — a test may not write where the armed sandbox refuses.
//
// ── WHERE IT ACTUALLY BINDS, counted rather than assumed (2026-08-24) ────────────────────────
//   • THE GATE — .claude/workflows/qa.js names `npm run check` as the oracle that BLOCKs before
//     any panel agent is dispatched, and `test:protected-write` is first in that chain. This is
//     the environment the defect lived in, so this is the one that matters.
//   • CI — .github/workflows/ci.yml invokes 14 of the 25 by name via `npm run`, and those carry
//     the preload.
//   • NOT ci.yml's "Gate logic tests" step, which runs
//     `node --test .claude/workflows/lib/gate-logic.test.mjs` DIRECTLY rather than through
//     `test:gate`. That script carries the preload and CI does not use it, so that one file is
//     run unpreloaded on a runner. A KNOWN GAP, left open deliberately: closing it edits a
//     workflow file, which takes a test fix from `full` to `irreversible` tier and puts a
//     founder sign-off in front of it. Queued for the irreversible follow-up.
//   • NOT CI for this file's own assertions either — `test:protected-write` is not named in
//     ci.yml, so the wiring check runs in the gate and locally, not on a runner.
//
// WHAT WENT WRONG, AND WHY A COMMENT WOULD NOT HAVE CAUGHT IT. Two tests in `npm run check`
// built their fixtures inside .claude/agents/ and .claude/hooks/. Arming the OS sandbox (#94)
// made those directories write-denied in the session the binding QA gate runs in — arming it
// protects them precisely BECAUSE writing there disarms the harness. So `npm run check`, which
// is the gate's own oracle, became unpassable in the only place it runs, and the gate BLOCKed
// on its oracle for every diff before any reviewer was dispatched. CI stayed green throughout,
// because CI runs unsandboxed, and nothing noticed for a day: no PR had ever completed a gate
// run. Neither test was wrong and neither change was wrong. Two correct requirements collided,
// and no mechanism was watching the seam.
//
// This preload turns the next collision into a red test, in the gate's own oracle, with the
// reason attached.
//
// ── THE RULE ────────────────────────────────────────────────────────────────────────────────
// A write is refused when it lands inside a directory this repo's own harness lives in:
//
//     <repo>/.claude/agents      <repo>/.claude/commands     <repo>/.claude/hooks
//     <repo>/.claude/skills      <repo>/.claude/workflows    <repo>/.claude/settings.json
//     ~/.claude
//
// That is ONE armed session's deny set, measured 2026-08-24 at the SESSION ROOT under
// `sandbox.enabled: true` + `failIfUnavailable: true`. It is not a reading of the sandbox's own
// rule, which belongs to the binary and is not exposed to a process. Everything else under
// .claude/ was writable in the same probe — memory/, playbooks/, lenses.yml, review-lenses.yml,
// qa-tier-floor.yml, mcp-policy.json — as was the repo root.
//
// AND THE DENY SET IS PER SESSION ROOT, WHICH IS THE TRAP. The same probe run inside a NESTED
// worktree reported .claude/hooks, .claude/skills and .claude/workflows as WRITABLE, because the
// deny entries name the open project's paths literally. A test can therefore pass in a child
// worktree and EPERM at the session root, which is where the gate runs — that is how the
// .claude/hooks half of this defect was nearly scoped out as "not reproducing". This list is a
// floor over both locations rather than a mirror of either, which is also why it is stated as a
// floor in limit 1 and not as the sandbox's answer.
//
// Fixture writes elsewhere in the tree are left alone — scripts/lenses.test.mjs writes
// .lens-fixture-*.yml at the repo root and is not doing anything wrong. The paths are anchored
// at the REAL repo root, so a test that copies the tree into os.tmpdir() and edits
// .claude/hooks/ THERE is unaffected. That is the seam this guard is asking for.
//
// ── WHAT IT CATCHES ─────────────────────────────────────────────────────────────────────────
// A synchronous `fs` mutation, from the preloaded process or any Node child that inherits the
// flag, that resolves into one of those paths. It catches it however the path was spelled — a
// constant, a join, a variable — because it checks the resolved argument at call time.
//
// ── WHAT IT DOES NOT CATCH, STATED SO NOBODY OVER-READS IT ──────────────────────────────────
//   1. It is a HARDCODED list, not a reading of the sandbox. The runtime's real deny set is
//      not exposed to a process, and settings.json does not hold these entries — they are the
//      binary's own protections. If the runtime widens its deny set, this list will not follow;
//      treat it as a floor.
//   2. Only SYNCHRONOUS fs mutators — the list below. A callback or promise write
//      (fs.writeFile, fs.promises.writeFile, fs.createWriteStream) passes unnoticed.
//      scripts/protected-write.test.mjs asserts textually that no guarded test file reaches for
//      one; that assertion is a grep and indirection defeats it.
//   3. Non-Node children. A test that shells out to `sed` or a shell redirect writes freely.
//   4. Only the npm scripts that preload it — every `node --test` step of `npm run check`. A
//      non-test step of that chain is unguarded, and so is ci.yml's direct invocation of
//      gate-logic.test.mjs, per the binding note at the top of this file.
//   5. It says nothing about reads, and nothing about the credential `denyRead` paths.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

/** Measured 2026-08-24: writing to any of these disarms the harness, and the sandbox refuses. */
const PROTECTED = [
  path.join(REPO, '.claude', 'agents'),
  path.join(REPO, '.claude', 'commands'),
  path.join(REPO, '.claude', 'hooks'),
  path.join(REPO, '.claude', 'skills'),
  path.join(REPO, '.claude', 'workflows'),
  path.join(REPO, '.claude', 'settings.json'),
];
if (os.homedir()) PROTECTED.push(path.join(os.homedir(), '.claude'));

const isProtected = (p) => PROTECTED.some((r) => p === r || p.startsWith(r + path.sep));

function targetPath(arg) {
  if (typeof arg === 'string') return path.resolve(arg);
  if (Buffer.isBuffer(arg)) return path.resolve(arg.toString());
  if (arg instanceof URL && arg.protocol === 'file:') return path.resolve(arg.pathname);
  return null; // a file descriptor, or something this guard cannot read — see limit 2
}

function refuse(fn, resolved) {
  const err = new Error(
    `[protected-write-tripwire] BLOCKED ${fn} -> ${resolved}\n` +
    `A test may not write inside the harness it is testing. The armed OS sandbox denies this ` +
    `path in the session the binding QA gate runs in, so a fixture written here makes ` +
    `\`npm run check\` — the gate's own oracle — unpassable exactly where the gate needs it, ` +
    `while CI stays green because CI runs unsandboxed. Build the fixture in a throwaway root ` +
    `under os.tmpdir() and point the tool under test at THAT root: schema-lint.js resolves its ` +
    `paths from process.cwd(), and check-registration.mjs from its own location, so a copy of ` +
    `either inside a temp tree checks the temp tree. scripts/skill-clamp.test.mjs and ` +
    `scripts/check-registration.test.mjs both do this and are worth reading first.`
  );
  err.code = 'EPROTECTEDWRITE';
  throw err;
}

/** name → indices of the arguments that name a write target. */
const MUTATORS = {
  appendFileSync: [0],
  chmodSync: [0],
  chownSync: [0],
  copyFileSync: [1],
  cpSync: [1],
  linkSync: [1],
  mkdirSync: [0],
  mkdtempSync: [0],
  renameSync: [0, 1],
  rmSync: [0],
  rmdirSync: [0],
  symlinkSync: [1],
  truncateSync: [0],
  unlinkSync: [0],
  utimesSync: [0],
  writeFileSync: [0],
};

for (const [name, indices] of Object.entries(MUTATORS)) {
  const original = fs[name];
  if (typeof original !== 'function') continue;
  fs[name] = function guarded(...args) {
    for (const i of indices) {
      const resolved = targetPath(args[i]);
      if (resolved !== null && isProtected(resolved)) refuse(name, resolved);
    }
    return original.apply(this, args);
  };
}

// openSync is a mutator only when the flags ask to write. Reading must stay free, or a guarded
// test could not read the roster it is asserting about.
const openSync = fs.openSync;
fs.openSync = function guardedOpen(file, flags = 'r', ...rest) {
  const writes = typeof flags === 'number'
    ? (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT)) !== 0
    : /[wa+]/.test(String(flags));
  if (writes) {
    const resolved = targetPath(file);
    if (resolved !== null && isProtected(resolved)) refuse('openSync', resolved);
  }
  return openSync.call(this, file, flags, ...rest);
};

// Exported for scripts/protected-write.test.mjs, which makes the tripwire actually trip rather
// than trusting that a guard nobody has watched fire is a guard.
module.exports = { REPO, PROTECTED, isProtected, MUTATORS };
