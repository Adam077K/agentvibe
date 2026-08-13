// server/collectors/conflicts.ts — cross-worktree file-conflict map for one project.
//
// Per docs/03-system-design/AGENT-SYSTEM-REBUILD.md §3.9, Conflicts reads "git for
// worktrees and conflicts". First-pass signal, real and computable without a second
// source of truth: for every non-main worktree, the files it has uncommitted changes to
// (`git status --porcelain`); a file touched by more than one worktree at once is a
// conflict-in-waiting — two agents are about to fight over it at merge time. This does
// not (yet) catch two worktrees that both committed non-overlapping-in-time changes to
// the same file with no uncommitted state left; that needs a merge-base diff and is next.

import { execFileSync } from 'node:child_process';
import type { Project } from '../projects.ts';
import { listWorktrees } from './worktrees.ts';

export interface WorktreeChanges {
  path: string;
  branch: string | null;
  changedFiles: string[];
}

export interface FileConflict {
  file: string;
  worktrees: { path: string; branch: string | null }[];
}

export interface ConflictReport {
  project: string;
  worktrees: WorktreeChanges[];
  conflicts: FileConflict[];
}

/** Parses `git status --porcelain` short-format lines into plain file paths. */
export function parseStatusPorcelain(text: string): string[] {
  const files: string[] = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const rest = line.slice(2).trim(); // strip the 2-char XY status code
    if (!rest) continue;
    const arrow = rest.indexOf(' -> ');
    files.push(arrow === -1 ? rest : rest.slice(arrow + 4));
  }
  return files;
}

function changedFilesFor(worktreePath: string): string[] {
  let out: string;
  try {
    out = execFileSync('git', ['status', '--porcelain'], { cwd: worktreePath, encoding: 'utf8' });
  } catch {
    return [];
  }
  return parseStatusPorcelain(out);
}

export function detectConflicts(project: Project): ConflictReport {
  const active = listWorktrees(project).filter((w) => !w.isMain);
  const worktrees: WorktreeChanges[] = active.map((w) => ({
    path: w.path,
    branch: w.branch,
    changedFiles: changedFilesFor(w.path),
  }));

  const byFile = new Map<string, { path: string; branch: string | null }[]>();
  for (const w of worktrees) {
    for (const file of w.changedFiles) {
      const list = byFile.get(file) ?? [];
      list.push({ path: w.path, branch: w.branch });
      byFile.set(file, list);
    }
  }

  const conflicts: FileConflict[] = [];
  for (const [file, list] of byFile) {
    if (list.length > 1) conflicts.push({ file, worktrees: list });
  }
  conflicts.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

  return { project: project.id, worktrees, conflicts };
}
