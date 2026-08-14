// test/gate.ts — THE machine gate. One implementation, the way scripts/lib/classifier.js is
// the one implementation of risk. Not a `.test.` file, so `bun test` does not collect it.
//
// IT WAS NOT ONE IMPLEMENTATION FOR A ROUND. This file was extracted and `live.test.ts`
// imported it, while `views.test.tsx` kept an inline copy carrying the exact defect described
// below — and three comments, this one included, stated the consolidation was complete.
// Measured then: `MC_PROJECT_ROOTS=/mc-no-such-root` turned live.test.ts red and left
// views.test.tsx at 17 pass / 0 fail. Before trusting this paragraph again, grep `test/` for
// `existsSync` and for `projects.length === 0`.
//
// A test must never assert what it could not check — and it must never SKIP what it could.
// The first version of this gate got the second half wrong, and the bug is worth writing down
// because it is the shape every "skip when the environment is missing" helper drifts into:
//
//   it skipped whenever discovery returned zero projects.
//
// Discovery returning zero IS THE RESULT OF THE OPERATION UNDER TEST, not a property of the
// machine. So `MC_PROJECT_ROOTS=/nonexistent bun test test/live.test.ts` reported **3 pass,
// 1 expect() call** — every real assertion skipped, the gate's own pin still green, and the
// suite reporting success while comparing nothing. Verified live before the fix.
//
// THE RULE, and the only one: gate on whether the SUBJECT EXISTS ON THIS MACHINE, never on
// what looking at it returned.
//
//   ~/.claude/projects absent   → this machine has no transcript corpus. Genuinely nothing
//                                 to measure; this is the CI-runner condition that caused
//                                 the original failure. SKIP, loudly.
//   ~/.claude/projects present  → the subject exists. Every outcome from here — including
//                                 "discovery found zero projects" — is a RESULT, and results
//                                 are asserted. FAIL, never skip.
//
// The pin in live.test.ts checks that predicate against the filesystem, not against the
// wording of the excuse: a reason string is only allowed to exist when the directory really
// is absent.
//
// AND THE PREDICATE IS NOT THE ONLY THING THAT HAS TO BE SHARED. This file held one
// implementation of the RULE and a second implementation of the VALUE it consumes: it
// recomputed the corpus path as `~/.claude/projects` while everything under test resolves it
// through scripts/lib/usage.js's `projectsDir()`, which honours `AGENTVIBE_PROJECTS_DIR`.
// Point that variable at an empty directory and the gate looked at the real corpus, saw it,
// and opened — while the code under test read the empty one. Measured:
// `AGENTVIBE_PROJECTS_DIR=<empty> bun test test/views.test.tsx` reported 25 pass / 0 fail,
// comparing nineteen rows of zeros and printing no NOT VERIFIED.
//
// That was the fourth time this class shipped, and the header's own advice — grep `test/`
// for `existsSync` — could not have caught it: the divergence was not in the predicate, it
// was one level down, in a value the predicate read. So the path is now IMPORTED from the
// same module the collectors use, and `test/live.test.ts` pins that the two agree rather
// than trusting this paragraph.

import { listTranscripts, projectsDir } from '../server/lib/usage.ts';

/**
 * Where the corpus is, resolved exactly as the code under test resolves it — including the
 * `AGENTVIBE_PROJECTS_DIR` override.
 *
 * A FUNCTION, not a constant, because `projectsDir()` reads that variable at call time. A
 * module-level constant would freeze whatever it was at import, which is the same divergence
 * in a slower form.
 */
export function claudeProjectsRoot(): string {
  return projectsDir();
}

/**
 * "Does this machine have a corpus" — a directory containing at least one transcript, not
 * merely a directory. Read with `listTranscripts`, the same function the index itself walks
 * with, so there is one implementation of the question rather than one for the tests.
 *
 * Existence alone was not enough: pointed at an empty directory, an existence check opens the
 * gate, the real-fleet parity test then compares nineteen rows of zeros to nineteen rows of
 * zeros, and passes. This is the same condition `scripts/check-cold-start.ts` already exits 2
 * on ("0 .jsonl files found … No corpus, nothing measured"), and it is a property of the
 * machine, not a result Mission Control produced.
 */
export function corpusPresent(): boolean {
  return listTranscripts(claudeProjectsRoot()).length > 0;
}

/**
 * Returns a reason when this machine genuinely lacks the subject, else null. Deliberately
 * takes no arguments and consults no result of the code under test: adding a "…and discovery
 * found something" clause here is exactly the regression this file exists to prevent.
 */
export function machineGate(): string | null {
  if (!corpusPresent()) {
    return `${claudeProjectsRoot()} holds no transcripts on this machine (e.g. a CI runner with no local corpus, or AGENTVIBE_PROJECTS_DIR pointed somewhere empty)`;
  }
  return null;
}

/**
 * Prints to stdout unconditionally — `bun test` renders an early `return` as a pass, so a
 * silent skip reads as "verified" to anyone skimming CI output.
 */
export function notVerified(what: string, reason: string): void {
  // eslint-disable-next-line no-console
  console.log(`${what} NOT VERIFIED — ${reason}. Nothing was compared; this is not a pass on the merits.`);
}

// ── THE ENUMERATION STALL GATE, EXTRACTED SO ITS WITHHOLD BRANCH CAN BE REACHED ────────
//
// This arithmetic lived inline in `collectors.test.ts` and decides whether that test's whole
// assertion is trusted or withheld. IT HAD NEVER FIRED — not in 20 clean runs, not in any of
// the eight mutations run against it. An untested guard on the trustworthiness of every other
// assertion in that test.
//
// And its own assumption is already violated on clean runs. The gate implicitly assumes a
// correct implementation's worst round stays under twice the floor's worst — `amax < 2·fmax`.
// Measured over 20 clean runs: median 1.28, p90 2.33, MAX 3.15, so 3 of 20 exceeded the factor
// of 2. Nothing went wrong only because `lineMs/fmax` sat at 5.4–16.3 on that machine, so the
// withhold never came near firing. On a runner with less headroom those two facts meet.
//
// Reaching that branch through a real measurement needs a genuinely marginal machine, which is
// not something a test suite can arrange. So the arithmetic is a pure function and the branch
// is exercised with synthetic samples. EXTRACTED WITHOUT CHANGING IT: same reducers, same
// constants, same comparison written the same way round, same reason string.

/** The fraction of the control a correct implementation's worst round must stay under. */
export const STALL_BOUND = 0.75;
/** How many times the floor's worst round the line must clear for the gate to open. */
export const RESOLUTION_FACTOR = 2;

/**
 * The median of a sample — AN ELEMENT of it, never an interpolation, and for an even-length
 * sample the upper of the two middles.
 *
 * Exported so `collectors.test.ts` stops carrying a second copy. That file's own history is
 * four separate occasions where one rule or one value had two implementations and they
 * diverged; a median defined twice is the same bet.
 *
 * THROWS ON AN EMPTY SAMPLE rather than returning `undefined`. Nothing measured is not a
 * measurement, and the alternative is genuinely dangerous — see stallGateVerdict.
 */
export function median(xs: number[]): number {
  if (xs.length === 0) throw new Error('median of an empty sample — nothing was measured');
  return [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
}

export interface StallGateVerdict {
  /** True when the measurement can discriminate here, so the assertion may be made. */
  resolves: boolean;
  /** `STALL_BOUND × median(control)` — the line correct code must stay under. */
  lineMs: number;
  /** `max(floor)` — what correct code pays merely to ASK, in its worst round. */
  ceilingMs: number;
  /** `median(control)` — the environment estimate the line is taken from. */
  controlStallMs: number;
  /** Set only when withholding; null when the gate opens. */
  reason: string | null;
}

/**
 * Whether this machine can resolve the enumeration measurement, and the numbers behind it.
 *
 * MEDIAN FOR THE CONTROL, MAX FOR THE FLOOR, and the asymmetry is deliberate. The control is
 * an environment estimate, where one descheduled round should not move the answer. The floor
 * is the ceiling a CORRECT implementation's worst round could reach, and the assertion it
 * guards is itself on a worst round — so it is reduced the same way the subject is.
 *
 * Algebraically the gate withholds exactly when `max(floor) > 0.375 × median(control)`.
 *
 * THROWS ON AN EMPTY SAMPLE, and this is where the guard earns its keep: `Math.max(...[])` is
 * `-Infinity`, which makes `lineMs < ceilingMs × 2` false, which OPENS the gate. An empty
 * sample would therefore make it silently always assert while having measured nothing —
 * reporting success about something it did not measure, which is the exact object this phase
 * is named after. The live caller runs a fixed 5 rounds and pushes unconditionally so it
 * cannot reach this; a future caller might.
 */
export function stallGateVerdict(
  controlStalls: number[],
  floorStalls: number[],
  projects: number
): StallGateVerdict {
  if (controlStalls.length === 0 || floorStalls.length === 0) {
    throw new Error(
      `stallGateVerdict needs both samples: got ${controlStalls.length} control and ${floorStalls.length} floor rounds`
    );
  }
  const controlStallMs = median(controlStalls);
  const ceilingMs = Math.max(...floorStalls);
  const lineMs = controlStallMs * STALL_BOUND;
  // WRITTEN THIS WAY ROUND ON PURPOSE. The inline original was `if (lineMs < ceiling × 2)
  // withhold`, and `!(a < b)` is not `a >= b` when either side is NaN — the original asserted
  // on a NaN measurement and so does this. Extraction is not the place to change what a
  // degenerate measurement does.
  const resolves = !(lineMs < ceilingMs * RESOLUTION_FACTOR);
  return {
    resolves,
    lineMs,
    ceilingMs,
    controlStallMs,
    reason: resolves
      ? null
      : `correct code must stay under ${lineMs.toFixed(1)}ms here — three quarters of a ${controlStallMs.toFixed(1)}ms ` +
        `control — while merely ASKING for the same ${projects} children cost as much as ` +
        `${ceilingMs.toFixed(1)}ms in its worst round. There is not enough room between the two for a ` +
        'ratio to mean anything on this machine',
  };
}
