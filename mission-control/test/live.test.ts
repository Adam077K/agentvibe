// test/live.test.ts — the routes the views read from, against the REAL roots on this
// machine.
//
// The gate is test/gate.ts, shared with test/views.test.tsx so there is ONE implementation of
// "can this machine answer" — read its header for the rule and for the live failure that
// produced it. In short: it fires only when ~/.claude/projects is absent. Once the corpus
// exists, everything else — including discovery returning zero projects — is a RESULT and
// gets asserted, not excused.
//
// "Cold" below means a cold INDEX, not a cold page cache: nothing here can evict the OS's
// file cache, so the figure is what a daemon restart costs, not what a machine reboot costs.

import { describe, test, expect } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { LiveState } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import type { FleetSummary } from '../server/collectors/fleet.ts';
import type { SessionsSlice } from '../server/state.ts';
import { discoverProjects } from '../server/projects.ts';
import { machineGate, notVerified, corpusPresent, CLAUDE_PROJECTS_ROOT } from './gate.ts';

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

describe('the machine gate itself', () => {
  // The gate is the component most likely to rot into "always skips", so its predicate is
  // pinned AGAINST THE FILESYSTEM rather than against the wording of its own excuse. The
  // previous version asserted `reason.toMatch(/does not exist|found 0 git repositories/)`,
  // which validated the excuse and passed happily while every real test was being skipped.
  test('a reason exists only when the corpus directory really is absent', () => {
    const reason = machineGate();
    const present = fs.existsSync(CLAUDE_PROJECTS_ROOT);

    expect(corpusPresent()).toBe(present); // the helper reads the same disk fact
    expect(reason === null).toBe(present); // skipping and absence are the same condition

    if (reason !== null) {
      expect(present).toBe(false);
      expect(reason).toContain(CLAUDE_PROJECTS_ROOT);
    }
  });

  test('the gate does not consult discovery — an empty root fails the suite, it does not excuse it', () => {
    if (!corpusPresent()) {
      notVerified('machine-gate independence check', `${CLAUDE_PROJECTS_ROOT} does not exist on this machine`);
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
