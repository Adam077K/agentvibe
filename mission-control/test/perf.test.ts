// test/perf.test.ts — cold index build under 10s, incremental refresh under 250ms,
// against fixtures (Phase 8a gate, raised from 3s 2026-08-13 — see README.md).
//
// CORRECTED BASELINE (2026-08-13): the real corpus is 2,029 files / 2.83 GB, not the
// 72 files / 0.44 GB first reported — that scan walked ~/.claude/projects only two
// levels deep and undercounted by 28x. A raw full parse of the real corpus measures
// 9,252ms; MC's own IndexStore.buildCold() against it measures 3.6-4.1s (comfortably
// better than the naive parse, and under the corrected 10s budget — see
// mission-control/scripts/check-cold-start.ts, the live measurement behind
// c-mission-control-cold-start). The incremental figure was never wrong: 4ms, both
// stat-all and a real 5h-window tail-read. This file still pins the fixture technique on
// a controlled, reproducible input — the real-corpus numbers are what the claim checks,
// not this test, since a CI runner has no ~/.claude/projects to measure against.
//
// ── DELIBERATELY NOT CHANGED BY #50, AND HERE IS THE REASON ───────────────────────────
//
// #50 rebuilt the cold-start assertion in test/live.test.ts: the clock came out of the
// blocking assertion entirely, because the same code doing the same work varies 2–2.5x from OS
// memory reclaim and the old 10 s line sat INSIDE the observed 2,158–12,610 ms spread. Two
// duration assertions now look different, so the next reader would reasonably suspect one was
// missed. It was not.
//
// THE TWO ARE NOT EXPOSED TO THE SAME THING, and the difference is the working set:
//
//   live.test.ts   the real corpus — 3.04 GB, 2,536 transcripts, GROWING ~0.8 GB a week.
//                  Exposed to corpus growth AND to machine state, and both are large:
//                  measured 2,024 ms for a bare build, up to 5,422 ms through the route.
//   perf.test.ts   24 synthetic fixture files. Cold build 4.7–12.1 ms. IMMUNE to corpus
//                  growth by construction — the fixture is a fixed shape this file creates —
//                  and while the same reclaim mechanism applies, a 2.5x multiplier on 12.1 ms
//                  is 30 ms against a 10 s budget: ~330x headroom, about two and a half orders
//                  of magnitude.
//
// BOTH FIGURES IN THAT LINE WERE WRONG WHEN FIRST WRITTEN. It said "18 ms" — 12 x 2.5 is 30 —
// and "six orders of magnitude", where the real span is ~2.5. The CONCLUSION never changed,
// which is exactly what made them easy to carry: they arrived in the brief that commissioned
// this work and were repeated rather than checked. This phase keeps finding the same defect,
// a figure repeated instead of verified, and it is worth more here as a corrected example
// than as a silent fix.
//
// So the flakiness that justified the rebuild does not exist here, and changing this file
// would be motion with no finding behind it. If this test ever DOES start varying, the cause
// will not be the one #50 found — it would mean the fixture stopped being 24 small files.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { discoverProjects } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo } from './fixtures.ts';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

describe('IndexStore performance against a fixture fleet', () => {
  const claudeRoot = mkTmpDir('mc-perf-claude-');
  const projectsRoot = mkTmpDir('mc-perf-projects-');
  cleanupDirs.push(claudeRoot, projectsRoot);

  // 8 projects x 3 sessions x 400 turns ≈ 9,600 lines total — enough to exercise the
  // real read path without turning this suite itself into a multi-second test.
  const PROJECTS = 8;
  const SESSIONS_PER_PROJECT = 3;
  const TURNS_PER_SESSION = 400;

  for (let p = 0; p < PROJECTS; p++) {
    const projectDir = path.join(projectsRoot, `fixture-${p}`);
    initGitRepo(projectDir);
    for (let s = 0; s < SESSIONS_PER_PROJECT; s++) {
      const turns = Array.from({ length: TURNS_PER_SESSION }, (_, i) => ({
        ts: new Date(Date.now() - i * 1000).toISOString(),
        output_tokens: 100 + i,
      }));
      fixtureClaudeProjectsDir(claudeRoot, projectDir, `sess-${s}`, turns);
    }
  }

  const projects = discoverProjects({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });

  test(`discovers all ${PROJECTS} fixture projects`, () => {
    expect(projects).toHaveLength(PROJECTS);
  });

  test('cold build completes in under 10000ms', () => {
    const store = new IndexStore();
    const t0 = performance.now();
    const result = store.buildCold(projects);
    const elapsedMs = performance.now() - t0;

    expect(result.filesScanned).toBe(PROJECTS * SESSIONS_PER_PROJECT);
    expect(elapsedMs).toBeLessThan(10000);
    // eslint-disable-next-line no-console
    console.log(`  [perf] cold build: ${elapsedMs.toFixed(1)}ms for ${result.filesScanned} files`);
  });

  test('incremental refresh (nothing changed) completes in under 250ms', () => {
    const store = new IndexStore();
    store.buildCold(projects);

    const t0 = performance.now();
    const result = store.refresh(projects);
    const elapsedMs = performance.now() - t0;

    expect(result.filesChanged).toBe(0);
    expect(elapsedMs).toBeLessThan(250);
    // eslint-disable-next-line no-console
    console.log(`  [perf] incremental refresh: ${elapsedMs.toFixed(1)}ms for ${result.filesScanned} files, 0 changed`);
  });

  test('incremental refresh after a single append also completes in under 250ms', () => {
    const store = new IndexStore();
    store.buildCold(projects);

    const dir = projects[0]!.transcriptDirs[0]!;
    const file = path.join(dir, fs.readdirSync(dir)[0]!);
    fs.appendFileSync(
      file,
      JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), isSidechain: false, message: { usage: { output_tokens: 1 } } }) + '\n'
    );
    fs.utimesSync(file, new Date(), new Date());

    const t0 = performance.now();
    const result = store.refresh(projects);
    const elapsedMs = performance.now() - t0;

    expect(result.filesChanged).toBe(1);
    expect(elapsedMs).toBeLessThan(250);
    // eslint-disable-next-line no-console
    console.log(`  [perf] incremental refresh after append: ${elapsedMs.toFixed(1)}ms, ${result.filesChanged} file changed`);
  });
});
