// server/collectors/empty.ts — the honest-empty-state helper shared by Project and
// Inbox (constraint 3, PR2 brief). Neither view has a real data source yet: nothing in
// this repo emits playbook stage progress, and no project's `~/.<id>/messages/` has ever
// held a message. Both facts are executed here, not asserted — `probe` is the literal
// command/glob a caller (or a test) can re-run to see the same answer independently.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Project } from '../projects.ts';

// NO SHELL: a literal binary, an args array, and a `--` sentinel before the one path
// positional (see projectEmptyStateProbe). Same shape as the conflicts sweep.
const execFileAsync = promisify(execFile);

export interface EmptyState {
  /** Human-readable rendering of the probe, for display/logging only — never executed. */
  probe: string;
  found: boolean;
  would_fill: string;
  /**
   * Present and `false` only when the probe could not even check (e.g. an unreadable or
   * vanished directory) — never omit this to let `found: false` stand in for "I could not
   * look" as though it meant "I looked and found nothing." Absent (undefined) means the
   * probe ran to completion and `found` is the real answer.
   */
  readable?: boolean;
  /** Set alongside `readable: false` — why the probe could not check. */
  reason?: string;
}

export interface ProbeCommand {
  cmd: string;
  args: string[];
}

/**
 * Renders a `{cmd, args}` pair as a readable string. Purely cosmetic — this output is
 * never fed back into a shell. Quoting here only has to look right to a human; it does
 * not have to be shell-safe, because nothing downstream re-parses it.
 */
function renderProbe({ cmd, args }: ProbeCommand): string {
  const quote = (s: string) => (/[\s"'$`;|&<>(){}]/.test(s) ? JSON.stringify(s) : s);
  return [cmd, ...args].map(quote).join(' ');
}

/**
 * Project view: "nothing anywhere emits playbook stage progress" (PR2 brief). The probe
 * is a literal grep for the one marker a stage-progress emitter would have to write.
 * Scoped away from .git/node_modules/.worktrees so it stays cheap on a large repo.
 *
 * `project.root` is a real, attacker-influenceable directory name (discoverProjects()
 * reads it straight off disk under ~/VibeCoding) — it is passed to execFileSync as ONE
 * argv element below, never through a shell. A directory named
 * `x;touch PWNED;echo done` or containing a space is inert here: grep receives it as a
 * single literal path argument, not a boundary in a command line. Exported so a test can
 * re-run the exact same argv array independently, never by re-parsing `probe` as shell.
 *
 * The leading `--` closes a narrower gap than shell injection: argument injection. Under
 * the shipped default (MC_PROJECT_ROOTS unset, roots always absolute) `project.root`
 * cannot start with `-`, so this is inert today — but `path.join('.', '-foo')` collapses
 * to `-foo`, so a relative root would let a directory named e.g. `--include=*.env` reach
 * grep as a FLAG rather than a path, making it silently search the wrong place and
 * return a boolean based on that. `--` costs one array element and closes the whole
 * class regardless of how project.root is ever constructed later.
 */
export function projectEmptyStateProbe(project: Project): ProbeCommand {
  return {
    cmd: 'grep',
    args: ['-rl', '--exclude-dir=.git', '--exclude-dir=node_modules', '--exclude-dir=.worktrees', 'playbook_stage', '--', project.root],
  };
}

const PROJECT_WOULD_FILL =
  'Goals, playbook stage progress, open claims, expired claims, blocked items — once something in this project emits playbook stage progress, this view has real data to show.';

/**
 * How long the probe may scan before it stops and says so.
 *
 * NOT A TUNING CONSTANT — it is the difference between a control plane and a hostage
 * situation. Measured on this machine 2026-08-14, the probe itself, timed independently of
 * Mission Control:
 *
 *   agentvibe (1.1 GB tree)      331 ms
 *   Beamix    (34 GB tree)   107,806 ms
 *
 * The brief carried 3,657 ms for Beamix; the real figure is thirty times that, and every
 * millisecond of it blocked Bun's single JS thread. `GET /api/project/Beamix` took 113,158 ms
 * end to end, 100% of it synchronous, which stalls the SSE tick for every connected client
 * for nearly two minutes.
 *
 * Async fixes the stall and does NOT fix the wait: an unbounded recursive grep over an
 * arbitrarily large tree has no upper bound at all, and this one is a PROBE — it answers a
 * yes/no question whose "no" is already the expected answer everywhere. So it is bounded, and
 * when the bound is hit the existing three-state says so: `readable: false` with a reason.
 * That is the same contract changedFilesFor uses for its own timeout, and the same principle
 * the whole file is built on — never report absence when you mean "I could not look at
 * everything". A probe that reports `found: false` after 108 seconds and one that reports it
 * after 10 seconds with "I stopped early" are different claims, and only the second is true.
 */
export const PROJECT_PROBE_TIMEOUT_MS = 10_000;

/** grep can emit a lot of paths on a large tree; 8 MB rather than Node's 1 MB default. */
const PROJECT_PROBE_MAX_BUFFER = 8 * 1024 * 1024;

export async function projectEmptyState(project: Project): Promise<EmptyState> {
  const probeCmd = projectEmptyStateProbe(project);
  const base = { probe: renderProbe(probeCmd), would_fill: PROJECT_WOULD_FILL };
  try {
    const { stdout } = await execFileAsync(probeCmd.cmd, probeCmd.args, {
      encoding: 'utf8',
      timeout: PROJECT_PROBE_TIMEOUT_MS,
      maxBuffer: PROJECT_PROBE_MAX_BUFFER,
    });
    return { ...base, found: stdout.trim().length > 0 };
  } catch (e) {
    const err = e as { code?: number | string; status?: number; killed?: boolean; stdout?: string; stderr?: string };
    // TIMEOUT IS CHECKED FIRST, and the order matters: a killed process also carries a
    // non-zero code, so testing the code first would file a timeout as a grep exit status
    // and lose the one fact that explains the answer.
    if (err.killed) {
      const stdout = (err.stdout ?? '').toString();
      return {
        ...base,
        found: stdout.trim().length > 0,
        readable: false,
        reason:
          `grep did not finish within ${PROJECT_PROBE_TIMEOUT_MS}ms against ${project.root} and was stopped, so ` +
          'part of the tree was never searched. This is "I could not look at all of it", not "there is nothing ' +
          'here" — a 34 GB project measures 107,806ms for this scan, and an unbounded probe on a live dashboard ' +
          'has no upper bound at all.',
      };
    }
    if (err.code === 1 || err.status === 1) {
      // grep's genuine "no match" exit — the honest, checked answer, not a failure.
      return { ...base, found: false };
    }
    // Anything else — exit >=2 (unreadable/nonexistent directory, permission denied) or
    // the process failing to spawn at all. This is NOT simply "nothing here"; it is
    // "the probe could not look at everything". Critically, grep still writes any
    // matches it DID find to stdout before it reports the unreadable subdirectory on
    // stderr and exits 2 -- verified directly (a readable file with a real match, plus
    // a chmod 000 sibling directory: exit 2, stdout non-empty). execFileSync throws on
    // any non-zero exit, so `out` above is never assigned; the match has to be read
    // from the thrown error's own .stdout, or it is silently discarded -- which would
    // be the exact failure this function exists to prevent, just inverted: reporting
    // absence when it means "I found something AND I also couldn't see everything".
    // Both truths are reported. Same UNCHECKED distinction check-cold-start.ts makes
    // with its own exit 2, but that script has no partial-success case to preserve.
    const stdout = (err.stdout ?? '').toString();
    const stderrTail = (err.stderr ?? '').toString().trim().slice(0, 300);
    return {
      ...base,
      found: stdout.trim().length > 0,
      readable: false,
      reason: `grep exited ${err.code ?? err.status ?? 'unknown'} against ${project.root} (${stderrTail || 'no stderr'})`,
    };
  }
}

const INBOX_WOULD_FILL =
  'Pending outbound approvals, escalations, binary pings — once this project writes into its messages/ directory, this view has real data to show.';

/**
 * Inbox view: "no project has a populated ~/.<name>/messages/ dir" (PR2 brief). The
 * probe is the literal glob a human would run to check.
 *
 * THE CATCH USED TO SWALLOW EVERY ERROR into `found: false`. An absent directory really is
 * the honest "nothing here" — the feature that would create it has never run — but EACCES
 * and ENOTDIR are not: they are "I could not look", reported as a clean inbox. That is the
 * §0 defect this file was written to prevent, in the file that prevents it, and it also left
 * the view's could-not-look branch unreachable by any input. ENOENT is the ONLY code that
 * means absence; everything else three-states.
 */
export function inboxEmptyState(project: Project, homeDir: string = os.homedir()): EmptyState {
  const dir = path.join(homeDir, `.${project.id}`, 'messages');
  const probe = `${dir}/*`;
  const base = { probe, would_fill: INBOX_WOULD_FILL };
  try {
    return { ...base, found: fs.readdirSync(dir).length > 0 };
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return { ...base, found: false }; // absent === empty, for a reader waiting
    return {
      ...base,
      found: false,
      readable: false,
      reason: `${dir} could not be read (${code ?? 'unknown error'}) — this project's messages were NOT checked, so "none" below would be a claim about a directory nobody opened.`,
    };
  }
}
