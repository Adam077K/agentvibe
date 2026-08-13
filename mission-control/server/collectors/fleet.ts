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
  launcher: LauncherInfo;
  ledgerPresent: boolean;
}

export interface FleetSummary {
  generatedAt: number;
  projects: FleetRow[];
  budget: WindowUsage;
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

export function buildFleet(
  projects: Project[],
  store: IndexStore,
  repoRoot: string,
  opts: { now?: number; claudeProjectsRoot?: string } = {}
): FleetSummary {
  const launchers = runWarroomFleet(repoRoot);
  const byName = new Map(launchers.map((l) => [l.name, l]));

  const rows: FleetRow[] = projects.map((p) => {
    const row = byName.get(p.id);
    const launcher: LauncherInfo = row ?? {
      present: false,
      reason: `no ~/bin/${p.id} launcher — not in the standalone launcher set (warroom fleet does not list it)`,
    };
    return {
      id: p.id,
      root: p.root,
      agentActive: p.agentActive,
      worktreeCount: listWorktrees(p).filter((w) => !w.isMain).length,
      sessionCount: store.sessionsFor(p.id).length,
      launcher,
      ledgerPresent: p.ledgerIndex.present,
    };
  });

  const budget = windowUsage({ now: opts.now, projectsDir: opts.claudeProjectsRoot });

  return { generatedAt: opts.now ?? Date.now(), projects: rows, budget };
}
