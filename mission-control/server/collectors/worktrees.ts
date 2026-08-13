// server/collectors/worktrees.ts — real git worktree state for one project.
//
// `.worktrees/.registry` (see projects.ts) only names sessions a CEO launcher started;
// it says nothing about branch, HEAD, or lock state, and it can go stale (a worktree
// removed by hand leaves its registry line behind). `git worktree list --porcelain` is
// the ground truth; the registry is used only to attach a session name where the two
// agree on a path.

import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project, RegistryEntry } from '../projects.ts';

const execFileAsync = promisify(execFile);

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

/**
 * Whether `git worktree list` could enumerate at all.
 *
 * "Git returned no worktrees" and "git refused to answer" are different facts, and collapsing
 * them is how a control plane prints an all-clear over a population nobody looked at.
 */
export type Enumeration = { readable: true } | { readable: false; reason: string };

export interface WorktreeListing {
  entries: WorktreeEntry[];
  enumerated: Enumeration;
}

function enumerationFailure(project: Project, e: unknown): WorktreeListing {
  const err = e as { stderr?: string; status?: number; code?: number | string; message?: string };
  const stderrTail = (err.stderr ?? '').toString().trim().slice(0, 300);
  return {
    entries: [],
    enumerated: {
      readable: false,
      reason:
        `git worktree list --porcelain exited ${err.status ?? err.code ?? 'unknown'} in ${project.root} ` +
        `(${stderrTail || err.message || 'no stderr'}) — this project's worktrees could not be enumerated, so the ` +
        'list is UNKNOWN rather than empty.',
    },
  };
}

/**
 * `git worktree list --porcelain` in the project root, ASYNC and three-state. Read-only.
 *
 * WHY THIS EXISTS ALONGSIDE THE SYNC ONE BELOW, which it does not replace: `listWorktrees` is
 * also called by collectors/fleet.ts on the SSE tick, and converting that means changing
 * /api/fleet's own 778 ms synchronous block — logged for PR5 and deliberately not widened into
 * this PR. Both share parseWorktreePorcelain, so there is exactly one parser and only the
 * spawn differs; when PR5 converts fleet, the sync one goes and this is what remains.
 *
 * The conflicts sweep uses this one because a SINGLE sync call before the first await keeps
 * the whole request synchronous no matter how async the rest is: across 19 projects,
 * `listWorktrees` alone accounted for 603 ms of a 606 ms /api/conflicts request. The collector
 * was async and the request was not.
 */
export async function listWorktreesAsync(project: Project): Promise<WorktreeListing> {
  let out: string;
  try {
    const result = await execFileAsync('git', ['worktree', 'list', '--porcelain'], {
      cwd: project.root,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
      timeout: 10_000,
    });
    out = result.stdout;
  } catch (e) {
    return enumerationFailure(project, e);
  }
  return { entries: parseWorktreePorcelain(out, project), enumerated: { readable: true } };
}

/**
 * The synchronous form, still used by collectors/fleet.ts.
 *
 * KNOWN, AND PART OF WHY listWorktreesAsync EXISTS: this `catch` returns `[]` for a real git
 * failure — the same "reported absence when it meant I could not look" defect the conflicts
 * sweep was fixed for. Reproduced end to end: an orphaned worktree whose `.git` points at a
 * deleted gitdir makes git exit non-zero, and every caller of THIS function reads that as
 * "the project has no worktrees" (Fleet renders a worktree count of 0). That is real, it is
 * logged, and it is not fixed here — the conflicts path, where it produced a false all-clear
 * over an unknown population, is.
 */
export function listWorktrees(project: Project): WorktreeEntry[] {
  let out: string;
  try {
    out = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: project.root,
      encoding: 'utf8',
    });
  } catch {
    return [];
  }
  return parseWorktreePorcelain(out, project);
}
