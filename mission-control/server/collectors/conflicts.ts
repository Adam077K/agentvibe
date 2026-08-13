// server/collectors/conflicts.ts — cross-worktree file-conflict map for one project.
//
// Per docs/03-system-design/AGENT-SYSTEM-REBUILD.md §3.9, Conflicts reads "git for
// worktrees and conflicts". First-pass signal, real and computable without a second
// source of truth: for every swept worktree, the files it has uncommitted changes to
// (`git status --porcelain`); a file touched by more than one worktree at once is a
// conflict-in-waiting — two agents are about to fight over it at merge time. This does
// not (yet) catch two worktrees that both committed non-overlapping-in-time changes to
// the same file with no uncommitted state left; that needs a merge-base diff and is next.
//
// THREE DEFECTS THIS FILE SHIPPED WITH, all fixed here, all the same shape as the nine in
// PHASE-8A-HANDOFF.md §0 — a mechanism reporting success about something it did not measure.
//
// 1. THE SWEEP WAS SYNCHRONOUS. `execFileSync` per worktree, on Bun's single JS thread.
//    Measured on this machine 2026-08-13, through the real route: 21,079 ms cold / 17,007 ms
//    warm across 285 worktrees. For every one of those seconds the event loop was blocked,
//    so the SSE tick stopped for EVERY connected client — a control plane freezing itself
//    while reporting on other people's work. Now async, and the per-worktree calls run
//    concurrently within a project.
//
// 2. `catch { return [] }` REPORTED "NO CHANGED FILES" WHEN IT MEANT "I COULD NOT LOOK."
//    A pruned, vanished or unreadable worktree rendered as CLEAN — indistinguishable from a
//    worktree genuinely holding no edits, and the clean answer is the one nobody
//    investigates. Now three-state, modelled exactly on server/collectors/empty.ts's
//    handling of grep's exit 2: success → files; failure → whatever files were recoverable
//    from the partial stdout, PLUS `readable: false` and a `reason`. The view renders
//    could-not-look differently from clean.
//
// 3. THE SWEEP WAS UNSCOPED. It took every non-main worktree on the machine — 285 of them,
//    across 19 projects, of which only 30 were ever started by an agent (evalove alone
//    carries 105 hand-made ones). Now scoped to worktrees the project's own
//    `.worktrees/.registry` knows about, skipping prunable ones. NARROWING IS VISIBLE, NEVER
//    SILENT: `excluded` carries the count and the reason, the view renders it under the
//    header, and both numbers come from ONE pass over ONE array — the §0 corollary the Fleet
//    headline violated when it rendered "2 of 11" for an answer of 4.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project } from '../projects.ts';
import { listWorktrees, type WorktreeEntry } from './worktrees.ts';

// The promisified callback form. NO SHELL: the binary is a literal and every argument is a
// separate array element, exactly as the sync form this replaced. `promisify` is applied
// once, at module scope, rather than wrapping each call in a new Promise — a hand-rolled
// wrapper is where the error's own `stdout` gets dropped, and that stdout is the partial
// result defect 2 exists to preserve.
const execFileAsync = promisify(execFile);

/**
 * Per-worktree ceiling. `git status --porcelain` in a worktree with a large untracked tree
 * can exceed Node's 1 MB default, and a hung filesystem can hang the call forever — either
 * one would take out the route. Both are handled as failures with a reason rather than as an
 * empty answer, so an overflow reports the files it did recover AND `readable: false`.
 */
const STATUS_MAX_BUFFER = 8 * 1024 * 1024;
const STATUS_TIMEOUT_MS = 10_000;

export interface WorktreeChanges {
  path: string;
  branch: string | null;
  changedFiles: string[];
  /**
   * Present and `false` only when git could not be run or read there — never omit this to
   * let an empty `changedFiles` stand in for "I could not look" as though it meant "I looked
   * and found nothing". Absent (undefined) means the sweep ran to completion and
   * `changedFiles` is the real answer. Same contract, same wording, as EmptyState.readable.
   */
  readable?: boolean;
  /** Set alongside `readable: false` — why the sweep could not check. */
  reason?: string;
}

export interface FileConflict {
  file: string;
  worktrees: { path: string; branch: string | null }[];
}

/** What the sweep deliberately did not look at, and why. Rendered, never silent. */
export interface ExcludedWorktrees {
  count: number;
  reason: string;
}

export interface ConflictReport {
  project: string;
  worktrees: WorktreeChanges[];
  conflicts: FileConflict[];
  excluded: ExcludedWorktrees;
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

/**
 * Which worktrees this project's sweep covers, and which it skips.
 *
 * Exported and PURE so a test can hand it a synthetic worktree list and assert the split
 * without needing a real 285-worktree machine — and so the count the view renders and the
 * list the sweep walks are provably the same partition of the same array. `swept.length +
 * excluded.count === entries.length` is an invariant a test pins directly.
 *
 * The rule: a worktree is swept when the project's own `.worktrees/.registry` names it
 * (`registryMatch !== null`, matched on the exact `name-token` basename by
 * parseWorktreePorcelain) and git does not report it prunable. The main checkout is never
 * swept — it is the merge target, not a party to the conflict.
 */
export function scopeSweep(entries: WorktreeEntry[]): { swept: WorktreeEntry[]; excluded: WorktreeEntry[] } {
  const candidates = entries.filter((w) => !w.isMain);
  const swept: WorktreeEntry[] = [];
  const excluded: WorktreeEntry[] = [];
  for (const w of candidates) {
    if (w.registryMatch !== null && !w.prunable) swept.push(w);
    else excluded.push(w);
  }
  return { swept, excluded };
}

/**
 * THE sentence explaining an exclusion, and the only place it is written.
 *
 * It carries no count and no timing figure, deliberately. The count belongs to
 * `excluded.count`, which the view sums itself. The first version of this string ended
 * "…sweeping every worktree on the machine cost 17 seconds per request" — a hardcoded
 * measurement of the SYNCHRONOUS implementation this PR deleted, rendered beside a computed
 * worktree count so it read as though the 17 s had been measured for that number. It had
 * not been, and on a larger fleet it asserted a figure nobody ever took. A constant is a
 * fact about the rule; a duration is a measurement, and a measurement nobody can recompute
 * does not belong in a string.
 *
 * The view RENDERS this rather than restating it, so there is one wording instead of two
 * that drift. test/collectors.test.ts pins that every non-zero exclusion carries exactly
 * this text, so "one wording" is checked rather than merely intended.
 */
export const EXCLUDED_REASON =
  "these worktrees are not named by their project's .worktrees/.registry — so no agent session started them — " +
  'or git reports them prunable. They are real worktrees and may hold uncommitted work; they are simply outside ' +
  'what an agent-conflict view can speak for.';

/**
 * `git status --porcelain` in one worktree. Never throws; returns the three-state shape.
 *
 * `--no-optional-locks` is not decoration: plain `git status` opportunistically rewrites
 * `.git/index` to refresh its stat cache, which is a real mutation inside somebody else's
 * repository performed by a component whose entire posture is read-only. The flag tells git
 * to skip that. Output is byte-identical either way (checked against the same worktree with
 * and without it).
 *
 * The path reaches git as ONE argv element via `cwd`, never as text in a command line, and
 * no shell is involved — see the injection regression test in test/collectors.test.ts, which
 * sweeps a real worktree named with shell metacharacters and asserts nothing executed.
 */
export async function changedFilesFor(worktreePath: string): Promise<Omit<WorktreeChanges, 'path' | 'branch'>> {
  try {
    const { stdout } = await execFileAsync('git', ['--no-optional-locks', 'status', '--porcelain'], {
      cwd: worktreePath,
      encoding: 'utf8',
      maxBuffer: STATUS_MAX_BUFFER,
      timeout: STATUS_TIMEOUT_MS,
    });
    return { changedFiles: parseStatusPorcelain(stdout) };
  } catch (e) {
    // Same reasoning as empty.ts's grep branch, and the reason this is not `return []`:
    // git writes whatever it had produced to stdout before failing, and the promisified
    // form attaches it to the rejection rather than returning it. Discarding it would
    // report absence when the truth is "I found something AND I also could not see
    // everything" — both are reported here.
    const err = e as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean; message?: string };
    const stdout = (err.stdout ?? '').toString();
    const stderrTail = (err.stderr ?? '').toString().trim().slice(0, 300);
    const how = err.killed ? `timed out after ${STATUS_TIMEOUT_MS}ms` : `exited ${err.code ?? 'unknown'}`;
    return {
      changedFiles: parseStatusPorcelain(stdout),
      readable: false,
      reason: `git status --porcelain ${how} in ${worktreePath} (${stderrTail || err.message || 'no stderr'})`,
    };
  }
}

/**
 * The conflict map for one project. Async because the sweep is: see defect 1 above.
 *
 * The per-worktree calls run concurrently — the sweep is one `git status` per worktree with
 * no ordering between them, and after scoping the fan-out is bounded by how many worktrees a
 * project's registry names (30 across the whole machine, measured), not by how many exist.
 */
export async function detectConflicts(project: Project): Promise<ConflictReport> {
  const entries = listWorktrees(project);
  const { swept, excluded } = scopeSweep(entries);

  const worktrees: WorktreeChanges[] = await Promise.all(
    swept.map(async (w) => ({ path: w.path, branch: w.branch, ...(await changedFilesFor(w.path)) }))
  );

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

  return {
    project: project.id,
    worktrees,
    conflicts,
    // ONE POPULATION, ONE FIGURE. Both numbers come from the single partition above, so the
    // count rendered under the header is by construction the count the sweep skipped; there
    // is no second traversal that could drift from it.
    excluded: { count: excluded.length, reason: EXCLUDED_REASON },
  };
}
