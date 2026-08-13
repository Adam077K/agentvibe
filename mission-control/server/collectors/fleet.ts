// server/collectors/fleet.ts — the Fleet view's data: per-project health plus the
// account-wide rolling-5h budget figure.
//
// Constraint 1 (PR2 brief): never reimplement a figure the repo already computes. The
// launcher-generation table already exists as `node scripts/warroom-install.mjs fleet`
// stdout — this shells out and parses that exact table rather than re-deriving the
// per-launcher hash from ~/bin by hand, so there is one implementation of "what
// generation is this launcher" and Mission Control is not a second one that can drift
// from the first.

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Project } from '../projects.ts';
import { windowUsage, type WindowUsage } from '../lib/usage.ts';
import { listWorktrees } from './worktrees.ts';
import { collectProjectStats } from './transcripts.ts';
import type { IndexStore } from '../index-store.ts';

export interface LauncherRow {
  name: string;
  lines: number;
  fns: number;
  gen: string;
  scope: 'in scope' | 'excluded';
}

export type LauncherInfo = LauncherRow | { present: false; reason: string };

export interface FleetRow {
  id: string;
  root: string;
  agentActive: boolean;
  worktreeCount: number;
  sessionCount: number;
  /** All-time output tokens across this project's indexed transcripts (collectProjectStats). */
  outputTokens: number;
  subagentOutputTokens: number;
  lastActivityAt: number | null;
  launcher: LauncherInfo;
  ledgerPresent: boolean;
  /**
   * True when this project's launcher generation differs from the modal in-scope one.
   * Null — never false — when the question does not apply: no launcher at all, an
   * `excluded` launcher (deliberately unmanaged, so divergence is not drift), or no modal
   * generation to compare against.
   */
  launcherDrift: boolean | null;
}

/**
 * Whether there IS a generation the fleet converges on, and when there is not, WHICH of the
 * three reasons applies. This replaced a bare `string | null`, and the null was the defect:
 * three different situations collapsed into one absence, so the view could not tell "every
 * launcher agrees on nothing to report" from "nothing was compared". It rendered the former
 * for all three — a convergence claim in the case where no comparison happened. Named cases
 * make that unrepresentable.
 */
export type ModalGeneration =
  | { kind: 'modal'; generation: string; inScopeLaunchers: number }
  | { kind: 'tie'; candidates: string[]; inScopeLaunchers: number }
  | { kind: 'none-in-scope'; launchers: number }
  | { kind: 'no-launchers' };

export interface FleetSummary {
  generatedAt: number;
  projects: FleetRow[];
  budget: WindowUsage;
  /** The generation a fleet-wide update converges on, or why there is not one. */
  modalGeneration: ModalGeneration;
}

const ROW_RE = /^\s*(\S+)\s+(\d+)\s+(\d+)\s+([0-9a-f]{8})\s+(in scope|excluded)\s*$/;

/** Parses `node scripts/warroom-install.mjs fleet` stdout. Exported so tests can pin the format. */
export function parseWarroomFleetOutput(text: string): LauncherRow[] {
  const rows: LauncherRow[] = [];
  for (const line of text.split('\n')) {
    const m = ROW_RE.exec(line);
    if (!m) continue;
    rows.push({
      name: m[1] as string,
      lines: Number(m[2]),
      fns: Number(m[3]),
      gen: m[4] as string,
      scope: m[5] as 'in scope' | 'excluded',
    });
  }
  return rows;
}

/** Runs `node scripts/warroom-install.mjs fleet` from the given repo root. Read-only. */
export function runWarroomFleet(repoRoot: string): LauncherRow[] {
  const script = path.join(repoRoot, 'scripts', 'warroom-install.mjs');
  let out: string;
  try {
    out = execFileSync('node', [script, 'fleet'], { cwd: repoRoot, encoding: 'utf8' });
  } catch (e) {
    const err = e as { stdout?: string };
    out = err.stdout ?? '';
  }
  return parseWarroomFleetOutput(out);
}

/**
 * The single generation a fleet-wide launcher update converges on: the most common one
 * among in-scope launchers. `warroom fleet` reports the same population ("N generations in
 * scope"); this reduces it to the one every in-scope launcher is expected to match.
 *
 * Excluded launchers are left out of the count entirely — they are deliberately not
 * managed, so letting one of them win the vote would name a target nothing updates to.
 * A tie returns null: with two equally common generations there is no current one, and
 * flagging either side as drift would be a coin toss presented as a finding.
 */
export function modalInScopeGeneration(launchers: LauncherRow[]): ModalGeneration {
  if (launchers.length === 0) return { kind: 'no-launchers' };

  const counts = new Map<string, number>();
  let inScopeLaunchers = 0;
  for (const l of launchers) {
    if (l.scope !== 'in scope') continue;
    inScopeLaunchers++;
    counts.set(l.gen, (counts.get(l.gen) ?? 0) + 1);
  }
  if (counts.size === 0) return { kind: 'none-in-scope', launchers: launchers.length };

  let bestCount = 0;
  for (const count of counts.values()) if (count > bestCount) bestCount = count;
  const leaders = [...counts.entries()].filter(([, count]) => count === bestCount).map(([gen]) => gen);

  if (leaders.length > 1) {
    return { kind: 'tie', candidates: leaders.sort(), inScopeLaunchers };
  }
  return { kind: 'modal', generation: leaders[0] as string, inScopeLaunchers };
}

export function buildFleet(
  projects: Project[],
  store: IndexStore,
  repoRoot: string,
  opts: { now?: number; claudeProjectsRoot?: string } = {}
): FleetSummary {
  const launchers = runWarroomFleet(repoRoot);
  const byName = new Map(launchers.map((l) => [l.name, l]));
  const modalGeneration = modalInScopeGeneration(launchers);

  const rows: FleetRow[] = projects.map((p) => {
    const row = byName.get(p.id);
    const launcher: LauncherInfo = row ?? {
      present: false,
      reason: `no ~/bin/${p.id} launcher — not in the standalone launcher set (warroom fleet does not list it)`,
    };
    const stats = collectProjectStats(p, store);
    return {
      id: p.id,
      root: p.root,
      agentActive: p.agentActive,
      worktreeCount: listWorktrees(p).filter((w) => !w.isMain).length,
      sessionCount: stats.sessionCount,
      outputTokens: stats.totalOutputTokens,
      subagentOutputTokens: stats.totalSubagentOutputTokens,
      lastActivityAt: stats.lastActivityAt,
      launcher,
      ledgerPresent: p.ledgerIndex.present,
      launcherDrift:
        row && row.scope === 'in scope' && modalGeneration.kind === 'modal'
          ? row.gen !== modalGeneration.generation
          : null,
    };
  });

  const budget = windowUsage({ now: opts.now, projectsDir: opts.claudeProjectsRoot });

  return { generatedAt: opts.now ?? Date.now(), projects: rows, budget, modalGeneration };
}
