#!/usr/bin/env bun
// mission-control/scripts/check-cold-start.ts — evidence.cmd for the
// c-mission-control-cold-start claim (see README.md's claims block).
//
// Measures IndexStore.buildCold() against the REAL local transcript corpus — never
// fixtures; the fixture regression guard lives at test/perf.test.ts and is what CI runs,
// since a CI runner has no ~/.claude/projects to measure against.
//
// Rule 10 (CLAUDE.md): a resolver must never pass what it could not check. So there are
// four distinct outcomes:
//   exit 0   corpus present, load low, cold build completed within budget — checked, held
//   exit 1   corpus present, load low, cold build completed OVER budget   — checked, broken
//   exit 2   no corpus on this machine (e.g. a CI runner) — UNCHECKED, never reported as 0
//   exit 2   load above ceiling — UNCHECKED, measured time unreliable under sustained load

import fs from 'node:fs';
import os from 'node:os';
import { discoverProjects } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import { projectsDir } from '../server/lib/usage.ts';

const BUDGET_MS = 10_000;

function countJsonlFiles(project: ReturnType<typeof discoverProjects>[number]): number {
  let n = 0;
  for (const dir of project.transcriptDirs) {
    try {
      n += fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).length;
    } catch {
      // a transcript dir that vanished between discovery and count is not a corpus to count
    }
  }
  return n;
}

// The load ceiling under which a wall-clock cold-start measurement is trusted. When several
// lanes build concurrently (observed: load averages of 12–15 while 8 parallel agents ran),
// OS memory reclaim inflates the measured time from the typical ~9.7s to 15+ s — a 50%
// overshoot against a 10s budget, caused entirely by OS scheduling, not by the code under
// test. This is the same defect as the stall-test and the ledger-verify-timeout — a check
// whose answer depends on machine state, run where that state does not exist. The load gate
// here mirrors the logic in scripts/check-cold-start.ts's comment and the §0 rule: gate on
// ENVIRONMENT (load), never on RESULT (elapsed time).
//
// 1.5 × cpuCount is deliberately conservative: on this machine (10 cpus), 15.0 is the
// threshold; a sustained load average above that means at least 1.5 cores per CPU are
// waiting, which is enough to produce the observed inflation pattern. A clean interactive
// session idles at 2–4 on this machine, well below the ceiling.
const LOAD_CEILING_FACTOR = 1.5;

function main(): number {
  const cpus = os.cpus().length;
  const loadCeiling = cpus * LOAD_CEILING_FACTOR;
  const load1m = os.loadavg()[0]!;

  if (load1m > loadCeiling) {
    console.error(
      `check-cold-start: UNCHECKED — load average ${load1m.toFixed(2)} exceeds ${loadCeiling.toFixed(2)} ` +
        `(${cpus} cpus × ${LOAD_CEILING_FACTOR}). Cold-start time is unreliable under sustained load; ` +
        'run again from a quiet machine.'
    );
    return 2;
  }

  const claudeRoot = projectsDir();
  if (!fs.existsSync(claudeRoot)) {
    console.error(`check-cold-start: UNCHECKED — ${claudeRoot} does not exist on this machine. No corpus, nothing measured.`);
    return 2;
  }

  const projects = discoverProjects();
  const fileCount = projects.reduce((n, p) => n + countJsonlFiles(p), 0);
  if (fileCount === 0) {
    console.error('check-cold-start: UNCHECKED — 0 .jsonl files found under any discovered project. No corpus, nothing measured.');
    return 2;
  }

  const store = new IndexStore();
  const t0 = performance.now();
  const result = store.buildCold(projects);
  const elapsedMs = performance.now() - t0;

  const line = `check-cold-start: ${result.filesScanned} files, ${elapsedMs.toFixed(0)}ms (budget ${BUDGET_MS}ms)`;
  if (elapsedMs > BUDGET_MS) {
    console.error(`${line} — OVER BUDGET`);
    return 1;
  }
  console.log(`${line} — within budget`);
  return 0;
}

process.exit(main());
