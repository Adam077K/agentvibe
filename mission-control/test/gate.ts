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
