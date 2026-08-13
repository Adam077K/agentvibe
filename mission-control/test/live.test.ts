// test/live.test.ts — the routes the views read from, against the REAL roots on this
// machine.
//
// The gate is test/gate.ts, shared with test/views.test.tsx so there is ONE implementation of
// "can this machine answer" — read its header for the rule and for the three separate live
// failures that produced it. In short: it fires only when the corpus, resolved the way the
// code under test resolves it, holds no transcripts. Once it does, everything else —
// including discovery returning zero projects — is a RESULT and gets asserted, not excused.
//
// "Cold" below means a cold INDEX, not a cold page cache: nothing here can evict the OS's
// file cache, so the figure is what a daemon restart costs, not what a machine reboot costs.

import { describe, test, expect } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { LiveState } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import type { FleetSummary } from '../server/collectors/fleet.ts';
import type { SessionsSlice } from '../server/state.ts';
import { discoverProjects } from '../server/projects.ts';
import { listTranscripts, projectsDir } from '../server/lib/usage.ts';
import { machineGate, notVerified, corpusPresent, claudeProjectsRoot } from './gate.ts';

function liveApp(): Hono {
  const app = new Hono();
  app.route('/api', createApi(new LiveState()));
  return app;
}

describe('GET /api/fleet against the real roots', () => {
  test(
    'returns at least 3 projects other than agentvibe carrying real session or worktree data',
    async () => {
      const blocked = machineGate();
      if (blocked) {
        notVerified('real-fleet content check', blocked);
        return;
      }

      const payload = (await (await liveApp().fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
      const others = payload.projects.filter((p) => p.id.toLowerCase() !== 'agentvibe');
      const withData = others.filter((p) => p.sessionCount > 0 || p.worktreeCount > 0);

      // eslint-disable-next-line no-console
      console.log(
        `  [fleet] ${payload.projects.length} projects discovered; ${withData.length} non-agentvibe with data: ${withData
          .map((p) => `${p.id}(${p.sessionCount}s/${p.worktreeCount}w)`)
          .join(', ')}`
      );

      // Asserted, never skipped: with the corpus present, "discovery returned nothing" is a
      // failure of the thing under test. Pointing MC_PROJECT_ROOTS at an empty or missing
      // directory turns this suite RED, which is the whole point.
      expect(payload.projects.length).toBeGreaterThan(0);
      expect(withData.length).toBeGreaterThanOrEqual(3);
      // Discovered, never configured: the fleet must not be a list someone typed.
      for (const project of payload.projects) {
        expect(fs.existsSync(path.join(project.root, '.git'))).toBe(true);
      }
    },
    120_000
  );
});

describe('GET /api/sessions performance against the real corpus', () => {
  test(
    'a cold call is under 10s and the next one is under 250ms',
    async () => {
      const blocked = machineGate();
      if (blocked) {
        notVerified('real-corpus /api/sessions perf', blocked);
        return;
      }

      const app = liveApp(); // a genuinely unbuilt LiveState — this app has served nothing

      const t0 = performance.now();
      const coldRes = await app.fetch(new Request('http://127.0.0.1/api/sessions'));
      const coldMs = performance.now() - t0;
      const cold = (await coldRes.json()) as SessionsSlice;

      const t1 = performance.now();
      const warmRes = await app.fetch(new Request('http://127.0.0.1/api/sessions'));
      const warmMs = performance.now() - t1;
      const warm = (await warmRes.json()) as SessionsSlice;

      // eslint-disable-next-line no-console
      console.log(
        `  [perf] /api/sessions cold ${coldMs.toFixed(0)}ms (${cold.sessions.length} sessions), second call ${warmMs.toFixed(0)}ms`
      );

      expect(cold.sessions.length).toBeGreaterThan(0); // it measured a real read, not an empty one
      expect(warm.sessions.length).toBe(cold.sessions.length);
      expect(coldMs).toBeLessThan(10_000);
      expect(warmMs).toBeLessThan(250);
    },
    120_000
  );
});

describe('the machine gate reads the same corpus the code under test reads', () => {
  // THE FOURTH TIME THIS CLASS SHIPPED, and the first three fixes could not have caught it.
  // The gate held one implementation of the RULE and a second implementation of the VALUE
  // that rule consumes: it recomputed `~/.claude/projects`, while every collector resolves
  // the corpus through scripts/lib/usage.js's projectsDir(), which honours
  // AGENTVIBE_PROJECTS_DIR. Point that at an empty directory and the gate inspected the real
  // corpus, opened, and the real-fleet parity test compared nineteen rows of zeros to
  // nineteen rows of zeros: 25 pass, 0 fail, no NOT VERIFIED printed.
  test('the path is projectsDir() itself, not a second copy of its default', () => {
    expect(claudeProjectsRoot()).toBe(projectsDir());
  });

  test('AGENTVIBE_PROJECTS_DIR moves the gate, because it moves the corpus', () => {
    const previous = process.env.AGENTVIBE_PROJECTS_DIR;
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-gate-empty-'));
    try {
      process.env.AGENTVIBE_PROJECTS_DIR = empty;
      expect(claudeProjectsRoot()).toBe(empty);
      expect(corpusPresent()).toBe(false); // the directory exists; it holds no transcripts
      expect(machineGate()).not.toBeNull();
      expect(machineGate()).toContain(empty);
    } finally {
      if (previous === undefined) delete process.env.AGENTVIBE_PROJECTS_DIR;
      else process.env.AGENTVIBE_PROJECTS_DIR = previous;
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  test('a directory that exists but holds no transcript is not a corpus', () => {
    // Existence alone was the old predicate, and it is exactly what let an empty override
    // through — the directory was there, so the gate opened on nothing.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-gate-shape-'));
    try {
      expect(fs.existsSync(dir)).toBe(true);
      expect(listTranscripts(dir)).toHaveLength(0);
      fs.mkdirSync(path.join(dir, 'someproject'));
      fs.writeFileSync(path.join(dir, 'someproject', 's.jsonl'), '{}\n');
      expect(listTranscripts(dir)).toHaveLength(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the machine gate itself', () => {
  // The gate is the component most likely to rot into "always skips", so its predicate is
  // pinned AGAINST THE FILESYSTEM rather than against the wording of its own excuse. An
  // earlier version asserted `reason.toMatch(/does not exist|found 0 git repositories/)`,
  // which validated the excuse and passed happily while every real test was being skipped.
  test('a reason exists only when the corpus really holds nothing', () => {
    const reason = machineGate();
    const present = listTranscripts(claudeProjectsRoot()).length > 0;

    expect(corpusPresent()).toBe(present); // the helper reads the same disk fact
    expect(reason === null).toBe(present); // skipping and absence are the same condition

    if (reason !== null) {
      expect(present).toBe(false);
      expect(reason).toContain(claudeProjectsRoot());
    }
  });

  test('the gate does not consult discovery — an empty root fails the suite, it does not excuse it', () => {
    if (!corpusPresent()) {
      notVerified('machine-gate independence check', `${claudeProjectsRoot()} holds no transcripts on this machine`);
      return;
    }
    // Point discovery at a directory that cannot exist. The gate must STILL be open (the
    // corpus is what it looks at), even though discovery now returns nothing — so the real
    // tests above would run their assertions and go red rather than print a skip.
    const previous = process.env.MC_PROJECT_ROOTS;
    process.env.MC_PROJECT_ROOTS = path.join(path.sep, 'mission-control-no-such-root');
    try {
      expect(discoverProjects()).toHaveLength(0);
      expect(machineGate()).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.MC_PROJECT_ROOTS;
      else process.env.MC_PROJECT_ROOTS = previous;
    }
  });
});
