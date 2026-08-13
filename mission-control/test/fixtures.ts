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
