// test/fixtures.ts — shared fixture builders. Not itself a test file (no `.test.` in the
// name), so `bun test` does not pick it up.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { encodeProjectDir } from '../server/projects.ts';

export function mkTmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
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
