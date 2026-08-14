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
import { PROJECT_PROBE_TIMEOUT_MS } from './probe-bounds.ts';

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
 * The bound, and the measurements behind it, live in `probe-bounds.ts` — a leaf module with
 * no imports, so the VIEW can state the same number instead of spelling it out in prose. It
 * said "bounded at ten seconds" while this file interpolated the constant, which made the
 * pending state a lie waiting on somebody changing the number. Re-exported so every existing
 * importer of this module keeps working.
 */
export { PROJECT_PROBE_TIMEOUT_MS } from './probe-bounds.ts';

/** grep can emit a lot of paths on a large tree; 8 MB rather than Node's 1 MB default. */
const PROJECT_PROBE_MAX_BUFFER = 8 * 1024 * 1024;

/**
 * How many probes may have a grep running at the same time.
 *
 * THIS PR CREATED THE NEED FOR IT. Under `execFileSync` two probes could not overlap — one
 * grep at a time, by construction of the blocking call. That accidental limit of 1 went away
 * with the stall, and nothing replaced it: measured, 20 simultaneous requests produced 20
 * concurrent greps, each entitled to 8 MB and 10 seconds. `/api/project/:id` is a GET with no
 * Origin check (F6), so a visited page can issue those without ever reading a response — and
 * it is not only adversarial, because by the same measurement that motivated the bound, a
 * large project holds a probe for the full 10 s PER REQUEST, so ordinary tab-switching stacks
 * them.
 *
 * Two rather than one: the old limit of 1 was an accident of the blocking call, not a
 * decision, and serialising a second browser tab behind a 10-second scan is a worse dashboard
 * than allowing one to overlap. Two bounds the damage at 16 MB and two children while keeping
 * a second reader responsive.
 */
export const PROJECT_PROBE_MAX_CONCURRENT = 2;

/**
 * How long a probe may wait for a slot before giving up WITHOUT RUNNING.
 *
 * Equal to the probe's own bound, so the worst case a request can experience is one full wait
 * plus one full scan — bounded, and stated here rather than discovered in production. Piling
 * up work that will be abandoned anyway is what a queue with no limit does.
 */
export const PROJECT_PROBE_QUEUE_WAIT_MS = PROJECT_PROBE_TIMEOUT_MS;

interface Waiter {
  settled: boolean;
  admit: (ok: boolean) => void;
}
const waiting: Waiter[] = [];
let running = 0;

/** Resolves true when a slot is held, false when the wait ran out and nothing was started. */
function acquireSlot(waitMs: number): Promise<boolean> {
  if (running < PROJECT_PROBE_MAX_CONCURRENT) {
    running++;
    return Promise.resolve(true);
  }
  return new Promise<boolean>((resolve) => {
    const waiter: Waiter = { settled: false, admit: () => {} };
    const timer = setTimeout(() => {
      if (waiter.settled) return;
      waiter.settled = true;
      const i = waiting.indexOf(waiter);
      if (i >= 0) waiting.splice(i, 1);
      resolve(false);
    }, waitMs);
    // A pending probe must never be the reason a process stays alive.
    timer.unref?.();
    waiter.admit = (ok: boolean) => {
      if (waiter.settled) return;
      waiter.settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    waiting.push(waiter);
  });
}

/** Hands the slot to the next waiter, or gives it back. `running` never goes negative. */
function releaseSlot(): void {
  const next = waiting.shift();
  if (next === undefined) {
    running = Math.max(0, running - 1);
    return;
  }
  next.admit(true); // handed straight over — the slot was never free, so `running` is unchanged
}

/**
 * Both bounds are the CALLER's to SHORTEN and neither is the caller's to lengthen.
 *
 * `queueWaitMs` — how long this call will wait for a slot before being told the probe never
 * ran.
 *
 * `timeoutMs` — how long the scan itself may take, CLAMPED to the default. That clamp is the
 * whole design: the constant protects the machine, so passing a larger number cannot weaken
 * it, and passing a smaller one can only make this call give up sooner. Injectable because a
 * bound that can only be reached by waiting ten real seconds is a bound no test reaches — and
 * measured, it reached none: `empty.ts` lines 124-134, the entire timeout branch, had zero
 * coverage while the test named after it asserted the OPPOSITE branch. That is #30's C1 in
 * this file: a barrier at the pixel with the producer invertible underneath it.
 */
export async function projectEmptyState(
  project: Project,
  opts: { queueWaitMs?: number; timeoutMs?: number } = {}
): Promise<EmptyState> {
  const queueWaitMs = opts.queueWaitMs ?? PROJECT_PROBE_QUEUE_WAIT_MS;
  // Clamped into [1, default]. The upper clamp is the machine protection; the LOWER one
  // closes a footgun the upper one opens — `timeout: 0` is Node's "no timeout", so a caller
  // asking for zero would silently get an unbounded scan, which is the failure this option
  // exists to make testable.
  const timeoutMs = Math.max(1, Math.min(opts.timeoutMs ?? PROJECT_PROBE_TIMEOUT_MS, PROJECT_PROBE_TIMEOUT_MS));
  const probeCmd = projectEmptyStateProbe(project);
  const base = { probe: renderProbe(probeCmd), would_fill: PROJECT_WOULD_FILL };

  // NEVER STARTED is its own answer, and it is not "nothing found". A reader has to be able
  // to tell "I searched and there is no marker" from "so many probes were already running
  // that this one never got to look", or the queue quietly manufactures empty states.
  if (!(await acquireSlot(queueWaitMs))) {
    return {
      ...base,
      found: false,
      readable: false,
      reason:
        `the probe never started: ${PROJECT_PROBE_MAX_CONCURRENT} probes were already running and a slot did not ` +
        `come free within ${queueWaitMs}ms, so NO part of ${project.root} was searched. This is not "nothing is ` +
        'here" — nothing was looked at. Re-running when the fleet is quieter will answer it.',
    };
  }

  try {
    const { stdout } = await execFileAsync(probeCmd.cmd, probeCmd.args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: PROJECT_PROBE_MAX_BUFFER,
    });
    return { ...base, found: stdout.trim().length > 0 };
  } catch (e) {
    const err = e as { code?: number | string; status?: number; killed?: boolean; stdout?: string; stderr?: string };
    // TIMEOUT IS CHECKED FIRST, and the order matters: a killed process also carries a
    // non-zero code, so testing the code first would file a timeout as a grep exit status
    // and lose the one fact that explains the answer.
    //
    // `found` IS UNCONDITIONALLY FALSE HERE, and this branch used to compute it from
    // `err.stdout` with a comment claiming parity with the exit-2 path below. It does not
    // have that parity. Measured on a 219 MB tree with the marker planted in the
    // FIRST-VISITED directory and the bound then firing — the branch's own best case:
    //
    //   bun  killed=true stdout_bytes=0
    //   node killed=true stdout_bytes=0
    //
    // grep block-buffers a pipe, and `-rl` on a marker that matches almost nothing emits far
    // less than one buffer before SIGTERM, so there is nothing in flight to recover. (The
    // runtimes DO differ once the match set is megabytes — bun recovered 524,288 bytes and
    // node 1,441,790 for a pattern matching nearly every file — but that is not this probe's
    // pattern, and a probe whose answer is one boolean does not get streaming plumbing to
    // chase a byte count it will reduce to `false` anyway.) So the code says what it does:
    // a killed probe found nothing, and could not look at everything.
    //
    // The exit-2 path below is different and its recovery is real — verified under both
    // runtimes, same tree, stdout preserved identically — so that branch keeps it.
    if (err.killed) {
      return {
        ...base,
        found: false,
        readable: false,
        reason:
          // The EFFECTIVE bound, not the constant: a caller that shortened it must see the
          // number that actually stopped the scan, or the sentence explains the wrong thing.
          `grep did not finish within ${timeoutMs}ms against ${project.root} and was stopped, so ` +
          'part of the tree was never searched and nothing it may have matched there was recovered. This is "I ' +
          'could not look at all of it", not "there is nothing here" — a 34 GB project measured 107,806ms for ' +
          'this scan on 2026-08-14, and an unbounded probe on a live dashboard has no upper bound at all.',
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
  } finally {
    releaseSlot();
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
