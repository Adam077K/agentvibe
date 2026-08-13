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
  | {
      kind: 'modal';
      generation: string;
      inScopeLaunchers: number;
      /**
       * In-scope LAUNCHERS whose generation differs from `generation`. Same population as
       * `inScopeLaunchers`, and that is the whole point of it living here.
       *
       * It used to be computed in the view as `projects.filter(p => p.launcherDrift).length`
       * — projects — and rendered as the numerator of "N of M in-scope launchers". Numerator
       * projects, denominator launchers. On this machine that read "2 of 11" while four
       * in-scope launchers were genuinely off-modal: `acme` has no discovered project at all
       * and so could never be counted, and `beamix` was missed by a case-sensitive lookup
       * against a `Beamix` directory. Worse, the mismatch could drive `drifted` to 0 with
       * launchers still off-modal, re-reaching the all-clear sentence the named union above
       * exists to prevent.
       *
       * Carrying it inside the same variant as its denominator is what makes the wrong
       * version unrepresentable: GenerationFigure takes no second count, so there is no
       * other population to reach for.
       */
      driftedLaunchers: number;
    }
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
 * among in-scope launchers, together with how many in-scope launchers are off it.
 *
 * BOTH NUMBERS COME OUT OF THIS ONE FUNCTION, over one array, because a claim whose
 * numerator and denominator are drawn from different populations is false however carefully
 * each half is computed. The count of drifted launchers is not derivable from the project
 * rows: a launcher with no discovered project (`acme` on this machine) produces no row at
 * all, so counting rows undercounts by exactly the launchers a fleet-wide update would still
 * have to touch.
 *
 * Excluded launchers are left out of the count entirely — they are deliberately not
 * managed, so letting one of them win the vote would name a target nothing updates to.
 * A tie is its own answer: with two equally common generations there is no current one, and
 * flagging either side as drift would be a coin toss presented as a finding.
 */
export function modalInScopeGeneration(launchers: LauncherRow[]): ModalGeneration {
  if (launchers.length === 0) return { kind: 'no-launchers' };

  const inScope = launchers.filter((l) => l.scope === 'in scope');
  if (inScope.length === 0) return { kind: 'none-in-scope', launchers: launchers.length };

  const counts = new Map<string, number>();
  for (const l of inScope) counts.set(l.gen, (counts.get(l.gen) ?? 0) + 1);

  let bestCount = 0;
  for (const count of counts.values()) if (count > bestCount) bestCount = count;
  const leaders = [...counts.entries()].filter(([, count]) => count === bestCount).map(([gen]) => gen);

  if (leaders.length > 1) {
    return { kind: 'tie', candidates: leaders.sort(), inScopeLaunchers: inScope.length };
  }
  const generation = leaders[0] as string;
  return {
    kind: 'modal',
    generation,
    inScopeLaunchers: inScope.length,
    driftedLaunchers: inScope.filter((l) => l.gen !== generation).length,
  };
}

/**
 * `warroom fleet` names launchers by the session name in `.warroom.yml`, which is lowercase
 * by convention; project directories are whatever they are on disk. `Beamix` and `~/bin/
 * beamix` are the same thing, and a case-sensitive lookup reported "no launcher — warroom
 * fleet does not list it" about a launcher `warroom fleet` was listing three lines above.
 * An untrue reason is worse than a bare absence: it sends the reader to check the wrong
 * thing.
 */
function launchersByLowercaseName(launchers: LauncherRow[]): Map<string, LauncherRow> {
  return new Map(launchers.map((l) => [l.name.toLowerCase(), l]));
}

export function buildFleet(
  projects: Project[],
  store: IndexStore,
  repoRoot: string,
  opts: {
    now?: number;
    claudeProjectsRoot?: string;
    /**
     * Overrides the launcher table. `warroom-install.mjs fleet` reads `~/bin` and has no env
     * override for it, so this is the only way a test can construct a fleet where a project
     * IS on the modal generation or IS drifted — the two branches every real fixture leaves
     * at `null`, and which therefore shipped once with the Drift column untested.
     */
    launchers?: LauncherRow[];
  } = {}
): FleetSummary {
  const launchers = opts.launchers ?? runWarroomFleet(repoRoot);
  const byName = launchersByLowercaseName(launchers);
  const modalGeneration = modalInScopeGeneration(launchers);

  const rows: FleetRow[] = projects.map((p) => {
    const row = byName.get(p.id.toLowerCase());
    const launcher: LauncherInfo = row ?? {
      present: false,
      reason: `\`node scripts/warroom-install.mjs fleet\` lists no launcher named "${p.id.toLowerCase()}" (matched case-insensitively against this project's directory name, "${p.id}"), so this project has no ~/bin launcher in the standalone set`,
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
