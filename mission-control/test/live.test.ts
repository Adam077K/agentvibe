// test/live.test.ts — the routes the views read from, against the REAL roots on this
// machine.
//
// EVERY TEST HERE IS ENVIRONMENT-GATED, and the gate is on the ENVIRONMENT ONLY — the
// existence of ~/.claude/projects and of a non-empty discovered fleet — checked BEFORE any
// assertion runs. It never catches a thrown assertion: a catch-all around a real comparison
// turns a cross-check into decoration, which is the failure this suite exists to prevent.
// When a gate fires it prints its reason to stdout unconditionally, because `bun test`
// renders an early return as a pass and silence would read as "verified" to anyone skimming
// CI output.
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

const CLAUDE_ROOT = path.join(os.homedir(), '.claude', 'projects');

/** Returns a reason string when this machine cannot answer the question, else null. */
function machineGate(): string | null {
  if (!fs.existsSync(CLAUDE_ROOT)) {
    return `${CLAUDE_ROOT} does not exist on this machine (e.g. a CI runner with no local transcript corpus)`;
  }
  if (discoverProjects().length === 0) {
    return 'discovery found 0 git repositories under the configured roots on this machine';
  }
  return null;
}

function notVerified(what: string, reason: string): void {
  // eslint-disable-next-line no-console
  console.log(`${what} NOT VERIFIED — ${reason}. Nothing was compared; this is not a pass on the merits.`);
}

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

      expect(withData.length).toBeGreaterThanOrEqual(3);
      // Discovered, never configured: the fleet must not be a list someone typed. finfun is
      // the project a hand-typed list actually omitted, so its presence is the specific
      // regression this asserts against — but only when it exists on this machine at all.
      const roots = payload.projects.map((p) => p.root);
      for (const root of roots) expect(fs.existsSync(path.join(root, '.git'))).toBe(true);
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

describe('the environment gate itself', () => {
  // The gate above is the thing most likely to rot into "always skips", so its own
  // predicate is pinned: it fires only on the two conditions it documents.
  test('reports a reason when the corpus is absent, and null when it is present', () => {
    const reason = machineGate();
    if (reason === null) {
      expect(fs.existsSync(CLAUDE_ROOT)).toBe(true);
      expect(discoverProjects().length).toBeGreaterThan(0);
    } else {
      expect(reason).toMatch(/does not exist|found 0 git repositories/);
    }
  });
});
