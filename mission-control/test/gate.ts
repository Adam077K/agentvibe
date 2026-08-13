// test/gate.ts — THE machine gate. One implementation, the way scripts/lib/classifier.js is
// the one implementation of risk. Not a `.test.` file, so `bun test` does not collect it.
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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The one condition under which this machine cannot answer: no transcript corpus at all. */
export const CLAUDE_PROJECTS_ROOT = path.join(os.homedir(), '.claude', 'projects');

export function corpusPresent(): boolean {
  return fs.existsSync(CLAUDE_PROJECTS_ROOT);
}

/**
 * Returns a reason when this machine genuinely lacks the subject, else null. Deliberately
 * takes no arguments and consults no result: adding a "…and discovery found something"
 * clause here is exactly the regression this file exists to prevent.
 */
export function machineGate(): string | null {
  if (!corpusPresent()) {
    return `${CLAUDE_PROJECTS_ROOT} does not exist on this machine (e.g. a CI runner with no local transcript corpus)`;
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
