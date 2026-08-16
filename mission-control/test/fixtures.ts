// test/fixtures.ts — shared fixture builders. Not itself a test file (no `.test.` in the
// name), so `bun test` does not pick it up.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { encodeProjectDir, type LedgerClaim } from '../server/projects.ts';
import {
  validateGlobalClaim,
  validateIndexClaim,
  type GlobalClaimShape,
} from '../server/lib/claim-shape.ts';

export function mkTmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ── claim fixtures, BUILT THROUGH THE PRODUCTION VALIDATOR ────────────────────────────
//
// Issue #54: every claim fixture in this suite used to be a hand-written literal typed as
// `LedgerClaim[]`. A literal satisfies tsc by construction and describes whatever shape its
// author last typed — which may be a shape the producer can no longer emit, or never could.
// That is not a hypothetical: `source_line` was dropped from scripts/ledger.mjs's KEY_ORDER,
// the fixtures went on supplying `source_line: 12`, and 319 tests stayed green over a live UI
// break. Measured again on this branch before the fix: stripping `source_file` from all 33
// claims of the real index left 320/320 passing.
//
// So a fixture is now BUILT, not written: every one goes through the same validator
// server/projects.ts and collectors/belief.ts use, and a fixture describing a claim the
// producer could not emit THROWS. The throw is the point — an unbuildable fixture must fail
// the suite rather than quietly describe an impossible world.
//
// The bases below are minimal claims that really do satisfy the schema: `verified_by: command`
// requires `evidence.cmd`, and scope project/global requires `valid_until`. The old fixtures
// carried neither, which is how far they had drifted from anything the ledger would accept.

/** Overrides are deliberately loosely typed: a BAD fixture must be caught at run time by the
 * validator, not rejected at compile time by a type that would hide the very drift under test.
 * A key set to `undefined` means OMIT that field — the way to write "this claim is missing
 * source_file" without reaching around the builder. */
export type ClaimOverrides = Record<string, unknown>;

function applyOverrides(base: Record<string, unknown>, overrides: ClaimOverrides): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base, ...overrides };
  for (const [k, v] of Object.entries(out)) if (v === undefined) delete out[k];
  return out;
}

const INDEX_CLAIM_BASE: Record<string, unknown> = {
  id: 'c-fixture',
  assert: 'a fixture claim shaped like one the producer could actually emit',
  kind: 'behavior',
  scope: 'project',
  verified_by: 'command',
  evidence: { cmd: 'true' },
  valid_until: '2026-12-31',
  confidence: 0.9,
  source_file: 'docs/fixture.md',
};

const GLOBAL_CLAIM_BASE: Record<string, unknown> = {
  id: 'c-fixture-global',
  assert: 'a fixture global claim shaped like one the producer could actually emit',
  kind: 'runtime-capability',
  scope: 'global',
  verified_by: 'command',
  evidence: { cmd: 'true' },
  valid_until: '2026-12-31',
  confidence: 0.9,
};

/** Where the global builder stamps from — the same literal collectors/belief.ts passes in. */
export const GLOBAL_LEDGER_LABEL = '~/.warroom/ledger/global.yml';

/**
 * One claim as `.claude/ledger/index.json` carries it, validated by
 * server/lib/claim-shape.ts's `validateIndexClaim` — the same function the real reader uses.
 * THROWS when the result would not be a claim the producer could emit.
 */
export function indexClaim(overrides: ClaimOverrides = {}): LedgerClaim {
  const raw = applyOverrides(INDEX_CLAIM_BASE, overrides);
  const result = validateIndexClaim(raw, 'test/fixtures.ts indexClaim()');
  if (!result.ok) {
    throw new Error(
      `indexClaim() fixture is not a claim the ledger could produce:\n  ${result.problems.join('\n  ')}\n` +
        'Fix the fixture, or — if the producer really did change — fix the producer and the ' +
        'validator together. A fixture that describes an impossible claim tests nothing.'
    );
  }
  return result.claim;
}

/**
 * One claim as `~/.warroom/ledger/global.yml` carries it, through `validateGlobalClaim`.
 * `source_file` is NOT an input: the ledger stamps it after validation and the closed schema
 * refuses it in the file, so the builder stamps it exactly as the collector does.
 */
export function globalClaim(overrides: ClaimOverrides = {}): GlobalClaimShape {
  const raw = applyOverrides(GLOBAL_CLAIM_BASE, overrides);
  const result = validateGlobalClaim(raw, 'test/fixtures.ts globalClaim()', GLOBAL_LEDGER_LABEL);
  if (!result.ok) {
    throw new Error(
      `globalClaim() fixture is not a claim the global ledger could hold:\n  ${result.problems.join('\n  ')}`
    );
  }
  return result.claim;
}

/**
 * A project with `scripts/ledger.mjs` and a built `index.json` — written in the producer's own
 * envelope (version/note/total/claims), from claims that went through the validator. Returns
 * the index path.
 *
 * `rawClaims` exists for the tests that must write something the validator would REFUSE; it
 * bypasses the builder on purpose and every call site says why.
 */
export function writeLedgerFixture(
  projectRoot: string,
  claims: LedgerClaim[],
  rawClaims?: unknown[]
): string {
  fs.mkdirSync(path.join(projectRoot, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'scripts', 'ledger.mjs'), '// fixture stand-in\n');
  const dir = path.join(projectRoot, '.claude', 'ledger');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'index.json');
  const body = rawClaims ?? claims;
  fs.writeFileSync(
    file,
    JSON.stringify({ version: 1, note: 'fixture — see test/fixtures.ts', total: body.length, claims: body }, null, 2) + '\n'
  );
  return file;
}

export interface FixtureTurn {
  ts: string;
  output_tokens: number;
  isSidechain?: boolean;
  /**
   * Written as `message.model` when given, omitted entirely when not. Both are real shapes on
   * disk and the index reports `latestModel: null` for the second — but EVERY fixture
   * transcript omitted it, so the Model column's recorded branch was never once exercised by
   * a test that reads a fixture.
   */
  model?: string;
}

/** Writes one .jsonl transcript with real per-turn `usage` records. Returns its path. */
export function writeTranscript(dir: string, sessionId: string, turns: FixtureTurn[]): string {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${sessionId}.jsonl`);
  const lines = turns.map((t) =>
    JSON.stringify({
      type: 'assistant',
      timestamp: t.ts,
      isSidechain: !!t.isSidechain,
      message: {
        ...(t.model === undefined ? {} : { model: t.model }),
        usage: { input_tokens: 10, output_tokens: t.output_tokens },
      },
    })
  );
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

/**
 * Builds a fake ~/.claude/projects-shaped directory for one project root, with the same
 * cwd → dir-name encoding Claude Code itself uses (see projects.ts's encodeProjectDir).
 */
export function fixtureClaudeProjectsDir(claudeRoot: string, projectRoot: string, sessionId: string, turns: FixtureTurn[]): string {
  const dir = path.join(claudeRoot, encodeProjectDir(projectRoot));
  return writeTranscript(dir, sessionId, turns);
}

/** A minimal real git repo — `git init` plus one commit, so `git worktree`/`status` work. */
export function initGitRepo(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  const run = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
  run(['init', '-q', '-b', 'main']);
  run(['config', 'user.email', 'fixture@example.com']);
  run(['config', 'user.name', 'Fixture']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# fixture\n');
  run(['add', '.']);
  run(['commit', '-q', '-m', 'initial']);
}

export function addWorktree(repoRoot: string, worktreeDir: string, branch: string): void {
  execFileSync('git', ['worktree', 'add', '-q', '-b', branch, worktreeDir], { cwd: repoRoot, stdio: 'pipe' });
}

export function writeRegistry(repoRoot: string, entries: { name: string; token: string }[]): void {
  const dir = path.join(repoRoot, '.worktrees');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '.registry'), entries.map((e) => `${e.name}:${e.token}`).join('\n') + '\n');
}

export function rmTmp(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Writes a trusted-projects file listing `roots`, and returns its path for
 * `DiscoverOptions.trustFile`.
 *
 * EVERY FIXTURE STATE NEEDS ONE, and that is the mechanism working rather than friction. The
 * allowlist fails closed: with no trust file, no project gets a program run for it, so a test
 * that wants a real sweep has to say which fixture directories it trusts. A test that forgets
 * gets an empty sweep and a red assertion, which is the correct direction for a security
 * control to be wrong in.
 *
 * Never point this at the real ~/.warroom/trusted-projects: `trustFile` exists so a test never
 * reads or writes the machine's own trust decision.
 */
export function writeTrustFile(dir: string, roots: string[]): string {
  const file = path.join(dir, 'trusted-projects');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, `# fixture trust list\n${roots.join('\n')}\n`);
  return file;
}

/**
 * Every file named `name` anywhere a shell spawned by the code under test could have created
 * it. Returns the paths found — an empty array is the safe outcome.
 *
 * WHY THIS IS NOT `existsSync(path.join(process.cwd(), name))`, which is what the conflicts
 * injection barrier did until review round 4 caught it. `touch <bareName>` writes relative to
 * the CHILD PROCESS'S cwd, so where the marker lands is decided by the `cwd` option of the
 * call being attacked, not by the test's own cwd:
 *
 *   empty.ts's grep probe passes NO cwd       → the marker lands in process.cwd()
 *   changedFilesFor passes cwd: worktreePath  → the marker lands in the WORKTREE
 *
 * The barrier was copied from the first case into the second, keeping the assumption and
 * losing its precondition, so it stat'd a path the exploit would never touch. A reviewer
 * built the vulnerable implementation both ways and ran it: with cwd unset the old barrier
 * failed correctly, and with `cwd` set — the shape this codebase actually uses everywhere —
 * it PASSED against a live RCE. A guard that looks in one place cannot certify that nothing
 * happened anywhere.
 *
 * So: walk the fixture tree exhaustively (it is small, and it contains every cwd the code
 * under test passes), and check process.cwd() and its parent shallowly (they are large, and
 * a marker dropped there lands at the top rather than nested).
 */
export function findMarkerAnywhere(name: string, fixtureRoots: string[]): string[] {
  const found: string[] = [];

  const walk = (dir: string, depth: number) => {
    if (depth > 8) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // an unreadable directory cannot hold a marker we could observe
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.name === name) {
        found.push(full);
        continue;
      }
      if (entry.isDirectory() && entry.name !== 'node_modules') walk(full, depth + 1);
    }
  };

  for (const root of fixtureRoots) walk(root, 0);

  // Shallow, because these are real working directories: the no-cwd case drops the marker
  // directly into them, and recursing through mission-control/node_modules would cost
  // seconds per assertion for no added reach.
  for (const dir of [process.cwd(), path.dirname(process.cwd())]) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) found.push(candidate);
  }

  return [...new Set(found)];
}

/** Deletes whatever findMarkerAnywhere located, so a failing barrier leaves no litter. */
export function removeMarkers(paths: string[]): void {
  for (const p of paths) {
    try {
      fs.rmSync(p, { recursive: true, force: true });
    } catch {
      /* nothing to remove */
    }
  }
}
