// test/views.test.tsx — RENDER PARITY: the number a view displays is the number its
// collector returned.
//
// Formatting may differ; magnitude may not. So these tests render the real components to
// static markup, pull the text out of every cell with their own throwaway HTML reader, and
// reverse the displayed string back to a number using their OWN de-formatter — never
// client/src/format.ts. A parity test that formats with the same function the component
// formats with is a test of `x === x`.
//
// It also means no assertion here is against a hardcoded string. Every expected value comes
// out of the payload the route actually returned in the same test.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hono } from 'hono';
import { LiveState } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import type { FleetSummary } from '../server/collectors/fleet.ts';
import type { SessionsSlice } from '../server/state.ts';
import { FleetTable } from '../client/src/views/FleetView.tsx';
import { SessionsTable, SessionsView } from '../client/src/views/SessionsView.tsx';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo, writeRegistry, addWorktree } from './fixtures.ts';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

// ── an independent, deliberately dumb HTML reader ───────────────────────────────────
// renderToStaticMarkup emits well-formed markup with no nested <td>, so a non-greedy cell
// match is sound here. Tags become spaces (not nothing) so two adjacent spans do not
// concatenate into one false token.
function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function bodyRows(html: string): string[][] {
  const tbody = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? '';
  return [...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((rowMatch) =>
    [...(rowMatch[1] ?? '').matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => textOf(cell[1] ?? ''))
  );
}

/** The test's own de-formatter. Shares nothing with client/src/format.ts, on purpose. */
function asNumber(displayed: string): number {
  return Number(displayed.replace(/,/g, '').trim());
}

// ── fixture fleet: runs everywhere, including a CI runner with no ~/VibeCoding ───────
function buildFixtureState(prefix: string) {
  const claudeRoot = mkTmpDir(`mc-views-claude-${prefix}-`);
  const projectsRoot = mkTmpDir(`mc-views-projects-${prefix}-`);
  cleanupDirs.push(claudeRoot, projectsRoot);

  const now = Date.now();
  // Deliberately un-round figures: a formatter bug that drops a thousands separator or
  // truncates is invisible against 100 or 1000.
  const busy = path.join(projectsRoot, 'ashcroft');
  initGitRepo(busy);
  writeRegistry(busy, [{ name: 'ceo-1', token: '1786445435' }]);
  addWorktree(busy, path.join(busy, '.worktrees', 'ceo-1-1786445435'), 'ceo-1-1786445435');
  fixtureClaudeProjectsDir(claudeRoot, busy, 'a1b2c3d4-1111-2222-3333-444455556666', [
    { ts: new Date(now - 90_000).toISOString(), output_tokens: 1_238_441 },
    { ts: new Date(now - 60_000).toISOString(), output_tokens: 417_902, isSidechain: true },
  ]);
  fixtureClaudeProjectsDir(claudeRoot, busy, 'ffeeddcc-9999-8888-7777-666655554444', [
    { ts: new Date(now - 3 * 3600_000).toISOString(), output_tokens: 92_614 },
  ]);

  const quiet = path.join(projectsRoot, 'tessellate');
  initGitRepo(quiet);
  fixtureClaudeProjectsDir(claudeRoot, quiet, '0f0e0d0c-5555-4444-3333-222211110000', [
    { ts: new Date(now - 9 * 86_400_000).toISOString(), output_tokens: 7_305 },
  ]);

  const state = new LiveState({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });
  const app = new Hono();
  app.route('/api', createApi(state));
  return { app, now };
}

describe('render parity — Fleet', () => {
  test('every figure in the rendered table reverses to the /api/fleet payload', async () => {
    const { app, now } = buildFixtureState('fleet');
    const res = await app.fetch(new Request('http://127.0.0.1/api/fleet'));
    expect(res.status).toBe(200);
    const payload = (await res.json()) as FleetSummary;
    expect(payload.projects.length).toBeGreaterThan(0);

    const rows = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={now} />));
    expect(rows).toHaveLength(payload.projects.length); // nothing silently dropped

    let compared = 0;
    for (const project of payload.projects) {
      const row = rows.find((cells) => (cells[1] ?? '').split(' ')[0] === project.id);
      expect(row).toBeDefined();
      const cells = row!;
      // Column order: dot · project · generation · drift · worktrees · sessions ·
      // output tokens · subagent · last activity.
      expect(asNumber(cells[4]!)).toBe(project.worktreeCount);
      expect(asNumber(cells[5]!)).toBe(project.sessionCount);
      expect(asNumber(cells[6]!)).toBe(project.outputTokens);
      expect(asNumber(cells[7]!)).toBe(project.subagentOutputTokens);
      if ('gen' in project.launcher) {
        expect(cells[2]).toBe(project.launcher.gen);
      } else {
        expect(cells[2]).toBe('no launcher'); // named absence, not a blank cell
      }
      compared++;
    }
    expect(compared).toBe(payload.projects.length);
  });

  test('MUTATION GATE: changing one payload figure changes what is rendered', async () => {
    const { app, now } = buildFixtureState('fleet-mutation');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;

    const before = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={now} />));
    const target = payload.projects[0]!;
    const original = target.outputTokens;
    const mutated: FleetSummary = {
      ...payload,
      projects: payload.projects.map((p) => (p.id === target.id ? { ...p, outputTokens: original + 61_197 } : p)),
    };
    const after = bodyRows(renderToStaticMarkup(<FleetTable fleet={mutated} now={now} />));

    const find = (rows: string[][]) => rows.find((cells) => (cells[1] ?? '').split(' ')[0] === target.id)!;
    expect(asNumber(find(before)[6]!)).toBe(original);
    expect(asNumber(find(after)[6]!)).toBe(original + 61_197);
  });

  test('agent-active projects sort above dormant ones, and dormant ones are never dropped', async () => {
    const { app, now } = buildFixtureState('fleet-order');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const active = payload.projects.filter((p) => p.agentActive).map((p) => p.id);
    const dormant = payload.projects.filter((p) => !p.agentActive).map((p) => p.id);
    expect(active.length).toBeGreaterThan(0);
    expect(dormant.length).toBeGreaterThan(0);

    const ids = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={now} />)).map(
      (cells) => (cells[1] ?? '').split(' ')[0]
    );
    expect(ids).toHaveLength(payload.projects.length);
    for (const id of active) {
      for (const other of dormant) {
        expect(ids.indexOf(id)).toBeLessThan(ids.indexOf(other));
      }
    }
  });

  test('a null fleet renders skeleton rows, never a table of zeroes', () => {
    const html = renderToStaticMarkup(<FleetTable fleet={null} now={Date.now()} />);
    expect(html).toContain('skeleton');
    expect(bodyRows(html).every((cells) => cells.every((c) => c === ''))).toBe(true);
  });
});

describe('render parity — Sessions', () => {
  test('every figure in the rendered table reverses to the /api/sessions payload', async () => {
    const { app, now } = buildFixtureState('sessions');
    const res = await app.fetch(new Request('http://127.0.0.1/api/sessions'));
    expect(res.status).toBe(200);
    const payload = (await res.json()) as SessionsSlice;
    expect(payload.sessions.length).toBeGreaterThan(0);

    const rows = bodyRows(renderToStaticMarkup(<SessionsTable slice={payload} now={now} limit={payload.sessions.length} />));
    expect(rows).toHaveLength(payload.sessions.length);

    payload.sessions.forEach((session, i) => {
      const cells = rows[i]!;
      // Column order: dot · session · project · model · turns · output · subagent · last turn.
      // The label is a contiguous substring of the id it came from (see format.ts's shortId)
      // — the id itself is a label, not a figure, so parity here is provenance, not magnitude.
      expect(session.sessionId.includes(cells[1]!)).toBe(true);
      expect(cells[2]).toBe(session.projectId);
      expect(cells[3]).toBe(session.latestModel ?? 'unrecorded');
      expect(asNumber(cells[4]!)).toBe(session.turnCount);
      expect(asNumber(cells[5]!)).toBe(session.outputTokens);
      expect(asNumber(cells[6]!)).toBe(session.subagentOutputTokens);
    });
  });

  test('there is no cost column, and the absence is stated once with its reason', async () => {
    const { app, now } = buildFixtureState('sessions-cost');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/sessions'))).json()) as SessionsSlice;

    // The table itself has no cost cell — no per-row placeholder, in any wording.
    const tableHtml = renderToStaticMarkup(<SessionsTable slice={payload} now={now} limit={payload.sessions.length} />);
    expect(textOf(tableHtml).toLowerCase()).not.toContain('cost');
    for (const cells of bodyRows(tableHtml)) expect(cells).toHaveLength(8);

    // The view states it once, and names what would fill it.
    const viewHtml = renderToStaticMarkup(<SessionsView slice={payload} now={now} />);
    const text = textOf(viewHtml);
    expect(text).toContain('There is no cost column');
    expect(text).toContain('price table');
    expect(text.match(/no cost column/g)).toHaveLength(1); // said once, not once per row
  });

  test('the row limit is honoured and nothing outside it is rendered', async () => {
    const { app, now } = buildFixtureState('sessions-limit');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/sessions'))).json()) as SessionsSlice;
    expect(payload.sessions.length).toBeGreaterThan(1);

    const rows = bodyRows(renderToStaticMarkup(<SessionsTable slice={payload} now={now} limit={1} />));
    expect(rows).toHaveLength(1);
    expect(payload.sessions[0]!.sessionId.includes(rows[0]![1]!)).toBe(true);
  });
});

// ── the same parity check, against the REAL fleet on this machine ────────────────────
describe('render parity against the real local fleet', () => {
  test(
    'the Fleet table reverses to the real /api/fleet payload',
    async () => {
      const claudeRoot = path.join(os.homedir(), '.claude', 'projects');
      if (!fs.existsSync(claudeRoot)) {
        // eslint-disable-next-line no-console
        console.log(
          `real-fleet render parity NOT VERIFIED — ${claudeRoot} does not exist on this machine (e.g. a CI runner with no local transcript corpus). Nothing was compared; this is not a pass on the merits.`
        );
        return;
      }

      const app = new Hono();
      app.route('/api', createApi(new LiveState()));
      const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
      if (payload.projects.length === 0) {
        // eslint-disable-next-line no-console
        console.log(
          'real-fleet render parity NOT VERIFIED — discovery found 0 projects under the configured roots on this machine. Nothing was compared; this is not a pass on the merits.'
        );
        return;
      }

      const rows = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={Date.now()} />));
      expect(rows).toHaveLength(payload.projects.length);
      for (const project of payload.projects) {
        const cells = rows.find((r) => (r[1] ?? '').split(' ')[0] === project.id)!;
        expect(cells).toBeDefined();
        expect(asNumber(cells[5]!)).toBe(project.sessionCount);
        expect(asNumber(cells[6]!)).toBe(project.outputTokens);
      }
    },
    60_000
  );
});
