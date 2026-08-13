// test/perf.test.ts — cold index build under 3s, incremental refresh under 250ms,
// against fixtures (Phase 8a gate in .claude/memory/DECISIONS.md). The real
// ~/.claude/projects figures (1,283ms cold / 13ms incremental, 72 files / 0.44GB) are
// documented in README.md; this pins the technique on a controlled, reproducible input
// so the assertion doesn't depend on how much history this machine happens to have.

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

  test('cold build completes in under 3000ms', () => {
    const store = new IndexStore();
    const t0 = performance.now();
    const result = store.buildCold(projects);
    const elapsedMs = performance.now() - t0;

    expect(result.filesScanned).toBe(PROJECTS * SESSIONS_PER_PROJECT);
    expect(elapsedMs).toBeLessThan(3000);
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
