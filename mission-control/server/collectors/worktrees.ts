// server/collectors/worktrees.ts — real git worktree state for one project.
//
// `.worktrees/.registry` (see projects.ts) only names sessions a CEO launcher started;
// it says nothing about branch, HEAD, or lock state, and it can go stale (a worktree
// removed by hand leaves its registry line behind). `git worktree list --porcelain` is
// the ground truth; the registry is used only to attach a session name where the two
// agree on a path.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Project, RegistryEntry } from '../projects.ts';

/** realpath, falling back to a plain resolve if the path can't be stat'd (e.g. a fixture). */
function real(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

export interface WorktreeEntry {
  path: string;
  head: string;
  /** null when the worktree is in a detached-HEAD state. */
  branch: string | null;
  isMain: boolean;
  locked: boolean;
  prunable: boolean;
  registryMatch: RegistryEntry | null;
}

/** Parses `git worktree list --porcelain` output. Exported so tests can pin the format. */
export function parseWorktreePorcelain(text: string, project: Project): WorktreeEntry[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const entries: WorktreeEntry[] = [];

  for (const block of blocks) {
    let wtPath = '';
    let head = '';
    let branch: string | null = null;
    let locked = false;
    let prunable = false;

    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) wtPath = line.slice('worktree '.length).trim();
      else if (line.startsWith('HEAD ')) head = line.slice('HEAD '.length).trim();
      else if (line.startsWith('branch ')) branch = line.slice('branch '.length).trim().replace(/^refs\/heads\//, '');
      else if (line === 'detached') branch = null;
      else if (line === 'locked' || line.startsWith('locked ')) locked = true;
      else if (line === 'prunable' || line.startsWith('prunable ')) prunable = true;
    }
    if (!wtPath) continue;

    const base = path.basename(wtPath);
    const registryMatch =
      project.registry.entries.find((e: RegistryEntry) => base === `${e.name}-${e.token}`) ?? null;

    entries.push({
      path: wtPath,
      head,
      branch,
      // realpath, not plain resolve: mkdtemp-based fixtures (and macOS /tmp itself) route
      // through a symlink, so a naive path.resolve() comparison never matches the main
      // worktree in those cases even though it plainly is one.
      isMain: real(wtPath) === real(project.root),
      locked,
      prunable,
      registryMatch,
    });
  }
  return entries;
}

/** Runs `git worktree list --porcelain` in the project root. Read-only. */
export function listWorktrees(project: Project): WorktreeEntry[] {
  let out: string;
  try {
    out = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: project.root,
      encoding: 'utf8',
    });
  } catch {
    return []; // not a worktree-capable checkout, or git failed — honestly empty, not an error
  }
  return parseWorktreePorcelain(out, project);
}
