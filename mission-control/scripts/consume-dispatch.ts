#!/usr/bin/env bun
// mission-control/scripts/consume-dispatch.ts — the founder-run dispatch consumer.
//
// WHAT THIS IS. Phase 8b's Dispatch view POSTs goals to /api/dispatch; the server
// validates them and appends JSON lines to ~/.agentvibe/dispatch-queue.jsonl. This script
// reads that queue and acts on each pending entry by launching a Claude Code session in the
// named project directory.
//
// RUN THIS YOURSELF — the server never spawns it. Mission Control's crosscheck.test.ts
// enforces a shell ban at zero exceptions inside server/**. Dispatch is implemented as a
// queue the server writes plus a consumer the founder runs, rather than as a server
// subprocess, because that is the only design that satisfies both "the server writes this
// view's output" and "the server spawns nothing".
//
// USAGE:
//   bun mission-control/scripts/consume-dispatch.ts              # process all pending
//   bun mission-control/scripts/consume-dispatch.ts --dry-run    # print without acting
//   bun mission-control/scripts/consume-dispatch.ts --list       # list the queue and exit
//
// REDUCED SCOPE — stated, not hidden. Phase 8b's original gate requires claims to land in
// a second project's ledger. No sibling project has a ledger (measured 2026-08-12); that
// requires Phase 9, which the 2026-08-16 founder decision defers. This consumer targets
// agentvibe only — it dispatches goals into the agentvibe project directory — and says so
// explicitly rather than pretending the full gate is reachable now.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  readDispatch,
  appendDispatch,
  dispatchQueuePath,
  resolveDispatchStates,
  unfinishedDispatches,
  type DispatchEntry,
} from '../server/index-cache.ts';

// ── The one project this consumer targets ────────────────────────────────────────────────
//
// Phase 9 gives the consumer a fleet of harrness-installed projects to dispatch against.
// Until then, the target is agentvibe: the repo this script lives in. Any entry whose
// `project` does not match is SKIPPED WITH A WARNING rather than silently dropped or
// erroneously dispatched to a wrong directory.

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..');
const AGENTVIBE_PROJECT_ID = path.basename(REPO_ROOT);

// ── Argument parsing ─────────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const LIST_ONLY = args.has('--list');

// ── Recording an outcome ─────────────────────────────────────────────────────────────────

/** The fields that distinguish one terminal outcome from another. */
type TerminalUpdate = {
  status: 'consumed' | 'failed' | 'no-result';
  exitCode?: number;
  signal?: string;
  error?: string;
};

/**
 * Append the terminal state of a dispatch, and SAY SO WHEN THAT WRITE FAILS.
 *
 * The failure path here is the one that matters. If the outcome cannot be recorded, the entry
 * stays `running` in the queue and the next run resolves it to `no-result` — which is correct,
 * and is why `running` is written first. What must not happen is this function returning
 * quietly, leaving an operator believing an outcome was stored when it was not.
 */
function writeTerminal(entry: DispatchEntry, update: TerminalUpdate): void {
  const finished: DispatchEntry = { ...entry, ...update, finishedAt: Date.now() };
  try {
    appendDispatch(finished);
    const detail =
      update.status === 'failed' ? ` (exit ${update.exitCode})`
      : update.signal ? ` (${update.signal})`
      : '';
    console.log(`  Recorded ${update.status}${detail}.`);
  } catch (writeErr) {
    console.error(
      `  COULD NOT RECORD '${update.status}': ${writeErr}\n` +
      `  The queue still says 'running' for ${entry.id.slice(0, 8)}; the next run will resolve it to 'no-result'.`
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────

function main() {
  const queueFile = dispatchQueuePath();
  console.log(`Queue: ${queueFile}`);

  let entries: DispatchEntry[];
  try {
    entries = readDispatch();
  } catch (err) {
    console.error(`Could not read queue: ${err}`);
    process.exit(1);
  }

  if (entries.length === 0) {
    console.log('Queue is empty. Nothing to do.');
    return;
  }

  // CURRENT STATE, NOT EVERY LINE. The queue is append-only, so `entries` holds the whole
  // history and an id appears once per state change. Counting or filtering raw lines double-
  // counts, and filtering them by `status === 'pending'` re-selects work already done — the
  // re-dispatch bug documented on resolveDispatchStates().
  const current = resolveDispatchStates(entries);
  const unfinished = unfinishedDispatches(entries);
  const byStatus = new Map<string, number>();
  for (const e of current) byStatus.set(e.status, (byStatus.get(e.status) ?? 0) + 1);
  const tally = [...byStatus.entries()].map(([k, n]) => `${n} ${k}`).join(', ');
  console.log(`${current.length} dispatches (${entries.length} queue lines) — ${tally}`);

  if (LIST_ONLY) {
    console.log('\nAll dispatches (current state):');
    for (const e of current) {
      const age = Math.round((Date.now() - e.enqueuedAt) / 1000);
      const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.round(age / 60)}m ago` : `${Math.round(age / 3600)}h ago`;
      console.log(`  [${e.status}] ${e.project}  ${ageStr}`);
      console.log(`         ${e.goal.slice(0, 120)}${e.goal.length > 120 ? '…' : ''}`);
    }
    return;
  }

  if (unfinished.length === 0) {
    console.log('Nothing unfinished. Nothing to do.');
    return;
  }

  for (const entry of unfinished) {
    console.log(`\nProcessing ${entry.id.slice(0, 8)}  project=${entry.project}`);
    console.log(`  Goal: ${entry.goal.slice(0, 140)}${entry.goal.length > 140 ? '…' : ''}`);

    // SCOPE CHECK. Only agentvibe is supported until Phase 9 brings a harness-installed
    // fleet. A goal dispatched to an unknown project is skipped rather than guessed.
    if (entry.project !== AGENTVIBE_PROJECT_ID) {
      console.warn(`  SKIPPED — project "${entry.project}" is not "${AGENTVIBE_PROJECT_ID}". Phase 9 extends this to the full fleet.`);
      continue;
    }

    // ROOT CHECK. The root in the entry was set by the server from discoverFleet(), but a
    // stale queue entry could have been written when the project existed at a different path.
    // Verify it is still present before attempting to launch.
    if (!fs.existsSync(entry.root)) {
      console.warn(`  SKIPPED — root "${entry.root}" no longer exists.`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] would run: claude --print in ${entry.root}`);
      console.log(`  [dry-run] goal: ${entry.goal}`);
      continue;
    }

    // DISPATCH. `claude --print` runs the goal headlessly in the project directory and
    // returns when the agent finishes. stdout is the agent's response; stderr carries
    // cost/timing info. The exit code is 0 on success, non-zero on tool/API error.
    //
    // The caller's PATH must include `claude`. If the warroom launcher is installed, it
    // may be more appropriate to use that — it carries the project's own warroom config.
    // Using `claude --print` directly here keeps the consumer free of assumptions about
    // which version of the launcher is installed, while remaining compatible with both.
    //
    // ── THAT ARGUMENT IS SOUND, AND IT HAS A COST NOBODY HAS PRICED ─────────────────────────
    // Freedom from assumptions about the harness is exactly freedom from the harness. A goal
    // launched this way reaches no orchestrator, no playbook, no lens and no QA gate: it is a
    // bare model session in a project directory. Everything this repo builds to govern work —
    // the tiered gate, the claim ledger, the review lenses — sits on the other side of a seam
    // this line does not cross. Dispatch is therefore the one entry point into the project that
    // is ungoverned by construction, and the comment above explains why without saying so.
    //
    // MEASURED 2026-08-26, so the next person starts from facts rather than from this note:
    //   · `claude --agent <agent>` EXISTS (`claude --help`), so selecting `orchestrator` for a
    //     dispatched session is available at the CLI today. That is the easy half.
    //   · NO ENGINE CAN REACH THE GATE. `qa.js` is invoked through a `Workflow` tool, and no
    //     agent declares one: 7 of 7 engine files carry a `tools:` line and none lists it —
    //     the orchestrator's is `[Read, Write, Edit, Bash, Glob, Grep, Task]`. So routing
    //     through `--agent orchestrator` would buy the lens and the playbook and would NOT buy
    //     the gate, while looking from the outside as though it had.
    //
    // NOT FIXED HERE, DELIBERATELY. How workflow invocation is actually granted in this runtime
    // is being established elsewhere; committing a seam here would give this repo two answers to
    // one question, which is a failure mode it has already paid for twice. This comment records
    // the measurement and the gap. It does not choose the design.
    // A `running` ENTRY IS OWED A VERDICT, NOT A RELAUNCH. Reaching this loop it means some
    // earlier run started this dispatch and never came back to record an outcome — the consumer
    // was killed, the machine slept, the terminal was closed. We do not know what the launch did,
    // and re-running it would convert "unknown" into a fresh "success" while hiding that a
    // previous attempt may already have acted. Record the ignorance instead.
    if (entry.status === 'running') {
      console.warn(`  NO RESULT — a previous run started this and never reported back. Not relaunching.`);
      writeTerminal(entry, {
        status: 'no-result',
        error: 'found still `running` by a later consumer run; the launching run never recorded an outcome',
      });
      continue;
    }

    // DURABLE BEFORE THE FACT. This line is what makes the paragraph above possible: if this
    // process dies during the launch, the queue already says `running`, so the next run can tell
    // "started and unknown" from "never started". Written before, not after — a marker written
    // afterwards records nothing about the interval it is supposed to cover.
    const startedAt = Date.now();
    try {
      appendDispatch({ ...entry, status: 'running', startedAt });
    } catch (writeErr) {
      // Refuse rather than launch blind. If we cannot record that we started, a crash mid-launch
      // is indistinguishable from never having run — which is the whole defect.
      console.error(`  SKIPPED — could not record 'running', so the launch would be unaccountable: ${writeErr}`);
      continue;
    }

    console.log(`  Launching claude in ${entry.root} …`);
    let outcome: TerminalUpdate;
    try {
      execFileSync('claude', ['--print', entry.goal], {
        cwd: entry.root,
        stdio: 'inherit',
        // No shell: false is the default for execFileSync; repeating it is explicit intent.
      });
      outcome = { status: 'consumed', exitCode: 0 };
    } catch (err) {
      // THE THREE OUTCOMES ARE DISTINGUISHED HERE, and the distinction is in the error object.
      // A non-zero exit sets `status`; a signal kill sets `signal` and leaves `status` null. They
      // are not the same event: the first is a program that ran and reported failure, the second
      // is a program that was taken away mid-flight and reported nothing. Collapsing them loses
      // exactly the case that is most common.
      const e = err as NodeJS.ErrnoException & { status?: number | null; signal?: string | null };
      const message = err instanceof Error ? err.message : String(err);
      if (typeof e.status === 'number') {
        outcome = { status: 'failed', exitCode: e.status, error: message };
      } else if (e.signal) {
        outcome = { status: 'no-result', signal: e.signal, error: message };
      } else {
        // Spawn never happened (ENOENT: no `claude` on PATH) or the failure is unmodelled. Either
        // way no exit code exists, so `no-result` is the honest state — NOT `failed`, which would
        // assert the launch ran and reported something.
        outcome = { status: 'no-result', error: message };
      }
      console.error(`  Launch did not succeed: ${message}`);
    }

    writeTerminal({ ...entry, startedAt }, outcome);
  }

  console.log('\nDone.');
}

main();
