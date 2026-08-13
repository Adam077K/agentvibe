#!/usr/bin/env bun
// mission-control/scripts/check-cold-start.ts — evidence.cmd for the
// c-mission-control-cold-start claim (see README.md's claims block).
//
// Measures IndexStore.buildCold() against the REAL local transcript corpus — never
// fixtures; the fixture regression guard lives at test/perf.test.ts and is what CI runs,
// since a CI runner has no ~/.claude/projects to measure against.
//
// Rule 10 (CLAUDE.md): a resolver must never pass what it could not check. So there are
// three distinct outcomes, not two:
//   exit 0   corpus present, cold build completed within budget       — checked, held
//   exit 1   corpus present, cold build completed OVER budget          — checked, broken
//   exit 2   no corpus on this machine (e.g. a CI runner) — UNCHECKED, never reported as 0

import fs from 'node:fs';
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

function main(): number {
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
