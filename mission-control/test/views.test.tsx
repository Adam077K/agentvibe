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
import type { FleetSummary, ModalGeneration } from '../server/collectors/fleet.ts';
import type { SessionsSlice } from '../server/state.ts';
import { FleetTable, FleetHeadline, GenerationFigure } from '../client/src/views/FleetView.tsx';
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

/** Every `title` attribute in one row, in document order — where exact instants live. */
function rowTitles(html: string, rowIndex: number): string[] {
  const tbody = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? '';
  const row = [...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)][rowIndex]?.[1] ?? '';
  return [...row.matchAll(/title="([^"]*)"/g)].map((m) =>
    (m[1] ?? '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x2F;/g, '/')
  );
}

/** Every grouped number in a fragment, in document order. */
function numbersIn(html: string): number[] {
  return [...textOf(html).matchAll(/\d[\d,]*/g)].map((m) => Number((m[0] ?? '').replace(/,/g, '')));
}

/** The test's own de-formatter. Shares nothing with client/src/format.ts, on purpose. */
function asNumber(displayed: string): number {
  return Number(displayed.replace(/,/g, '').trim());
}

/**
 * The test's own coarse relative-time formatter, written from the stated rule rather than
 * imported. THE TIME COLUMNS WERE NOT COMPARED AT ALL before this: a mutation rendering every
 * Last-activity as "never", and another showing a session's FIRST turn where its last belongs,
 * both survived the suite green. Checking only the ISO in the `title` would not have caught
 * either, because the title is produced by a different function than the visible cell — so the
 * visible string is what this reverses.
 */
function expectedRelative(at: number | null, now: number): string {
  if (at === null) return 'never';
  const delta = now - at;
  if (delta < 0) return 'just now';
  if (delta < 45_000) return `${Math.max(1, Math.round(delta / 1000))}s ago`;
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  return `${Math.round(delta / 86_400_000)}d ago`;
}

// ── fixture fleet: runs everywhere, including a CI runner with no ~/VibeCoding ───────
function buildFixtureState(prefix: string) {
  const claudeRoot = mkTmpDir(`mc-views-claude-${prefix}-`);
  const projectsRoot = mkTmpDir(`mc-views-projects-${prefix}-`);
  cleanupDirs.push(claudeRoot, projectsRoot);

  const now = Date.now();
  // Deliberately un-round figures: a formatter bug that drops a thousands separator or
  // truncates is invisible against 100 or 1000. And deliberately WIDE-APART timestamps, so a
  // cell showing a session's first turn where its last belongs renders a visibly different
  // string — with the two 30 seconds apart, that mutation formatted identically and survived.
  const busy = path.join(projectsRoot, 'ashcroft');
  initGitRepo(busy);
  writeRegistry(busy, [{ name: 'ceo-1', token: '1786445435' }]);
  addWorktree(busy, path.join(busy, '.worktrees', 'ceo-1-1786445435'), 'ceo-1-1786445435');

  // MIXED: main output and subagent output in one transcript. Zero sessions on the real
  // corpus are mixed (measured: 1,918 all-subagent, 66 main, 0 mixed), so without this
  // fixture the Kind column's mixed branch would ship never having been executed.
  fixtureClaudeProjectsDir(claudeRoot, busy, 'a1b2c3d4-1111-2222-3333-444455556666', [
    { ts: new Date(now - 5 * 86_400_000).toISOString(), output_tokens: 1_238_441 },
    { ts: new Date(now - 95_000).toISOString(), output_tokens: 417_902, isSidechain: true },
  ]);
  // MAIN ONLY.
  fixtureClaudeProjectsDir(claudeRoot, busy, 'ffeeddcc-9999-8888-7777-666655554444', [
    { ts: new Date(now - 3 * 3_600_000).toISOString(), output_tokens: 92_614 },
  ]);
  // SUBAGENT ONLY, in the `agent-a<role>-<slug>-<16 hex>` shape the real corpus uses.
  fixtureClaudeProjectsDir(claudeRoot, busy, 'agent-acode-reviewer-mc-views-4b13769c18ece5b0', [
    { ts: new Date(now - 26 * 3_600_000).toISOString(), output_tokens: 58_296, isSidechain: true },
  ]);
  // NO OUTPUT AT ALL — a real turn record carrying zero output tokens.
  fixtureClaudeProjectsDir(claudeRoot, busy, 'bbbbcccc-0000-1111-2222-333344445555', [
    { ts: new Date(now - 7 * 3_600_000).toISOString(), output_tokens: 0 },
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
      // The time column, which nothing compared before: the VISIBLE string, reversed by the
      // test's own coarse formatter. A cell hardcoded to "never" fails here.
      expect(cells[8]).toBe(expectedRelative(project.lastActivityAt, now));
      if ('gen' in project.launcher) {
        expect(cells[2]).toBe(project.launcher.gen);
      } else {
        expect(cells[2]).toBe('no launcher'); // named absence, not a blank cell
      }
      compared++;
    }
    expect(compared).toBe(payload.projects.length);
  });

  test('the exact instant behind each relative time is the payload timestamp', async () => {
    const { app, now } = buildFixtureState('fleet-instants');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const html = renderToStaticMarkup(<FleetTable fleet={payload} now={now} />);
    const ordered = payload.projects.slice().sort((a, b) => {
      if (a.agentActive !== b.agentActive) return a.agentActive ? -1 : 1;
      return (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0) || a.id.localeCompare(b.id);
    });

    ordered.forEach((project, i) => {
      const titles = rowTitles(html, i);
      const expected = project.lastActivityAt === null ? 'no recorded turn' : new Date(project.lastActivityAt).toISOString();
      expect(titles).toContain(expected);
    });
  });

  // B1. The headline used to print "every in-scope launcher on the modal generation" whenever
  // `drifted === 0` — and with no modal generation, every row's drift is null, so `drifted`
  // IS 0. A positive convergence claim, in the biggest type on the screen, in exactly the
  // three cases where nothing was compared.
  describe('the drift headline never claims convergence without a comparison', () => {
    const cases: { name: string; modal: ModalGeneration }[] = [
      { name: 'a tie', modal: { kind: 'tie', candidates: ['aaaaaaaa', 'bbbbbbbb'], inScopeLaunchers: 2 } },
      { name: 'every launcher excluded', modal: { kind: 'none-in-scope', launchers: 3 } },
      { name: 'no launchers at all', modal: { kind: 'no-launchers' } },
    ];

    for (const { name, modal } of cases) {
      test(`${name} renders "not compared" and names what would fill it`, () => {
        const text = textOf(renderToStaticMarkup(<GenerationFigure modal={modal} drifted={0} />));
        expect(text).toContain('not compared');
        expect(text.toLowerCase()).not.toContain('all '); // no "all N launchers on …"
        // The reason is reachable, and it says what would resolve the case.
        const why = renderToStaticMarkup(<GenerationFigure modal={modal} drifted={0} />);
        expect(/title="[^"]*would fill this[^"]*"/.test(why)).toBe(true);
        expect(/title="[^"]*[Nn]o project was compared|title="[^"]*Nothing was compared/.test(why)).toBe(true);
      });
    }

    test('a real comparison, and only then, states convergence', () => {
      const modal: ModalGeneration = { kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 11 };
      const clean = textOf(renderToStaticMarkup(<GenerationFigure modal={modal} drifted={0} />));
      expect(clean).toContain('all 11 in-scope launchers on a86770a9');
      expect(clean).not.toContain('not compared');

      const dirty = textOf(renderToStaticMarkup(<GenerationFigure modal={modal} drifted={2} />));
      expect(numbersIn(dirty)[0]).toBe(2); // the figure is the drift count, not the hash
      expect(dirty).toContain('of 11 in-scope launchers, off a86770a9');
    });
  });

  // M1. FleetHeadline was rendered by no test at all — the three largest figures on screen,
  // including the account-wide burn, were entirely uncovered. Swapping output tokens for
  // subagent tokens in it survived the whole suite green.
  test('the headline figures reverse to the /api/fleet payload, in order', async () => {
    const { app } = buildFixtureState('fleet-headline');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const html = renderToStaticMarkup(<FleetHeadline fleet={payload} />);
    const numbers = numbersIn(html);

    const active = payload.projects.filter((p) => p.agentActive).length;
    expect(payload.budget.output_tokens).toBeGreaterThan(0); // the shape below assumes a share is shown

    // Document order: burn window hours · burn · subagent · share% · projects · active ·
    // dormant. Reading them POSITIONALLY is what catches a swap; a set membership check
    // would pass with output and subagent exchanged. The drift figure that follows depends
    // on this machine's ~/bin, so it is asserted by the GenerationFigure tests above, which
    // pass an explicit ModalGeneration and need no machine state.
    expect(numbers.slice(0, 7)).toEqual([
      payload.budget.window_hours,
      payload.budget.output_tokens,
      payload.budget.subagent_output_tokens,
      Math.round((payload.budget.subagent_output_tokens / payload.budget.output_tokens) * 100),
      payload.projects.length,
      active,
      payload.projects.length - active,
    ]);
    expect(payload.budget.output_tokens).not.toBe(payload.budget.subagent_output_tokens); // the swap is detectable

    // And the label collision is gone: the headline no longer shares a name with the column
    // headed "Output tokens · all time", which means something ~30x larger and scoped
    // differently. (`.label` uppercases in CSS; the DOM text is the sentence case below.)
    const text = textOf(html);
    expect(text).toContain('Burn · rolling 5h · account-wide');
    expect(text).not.toContain('Output tokens ·');
  });

  test('MUTATION GATE: swapping the headline burn for its subagent share turns it red', async () => {
    const { app } = buildFixtureState('fleet-headline-mutation');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const swapped: FleetSummary = {
      ...payload,
      budget: { ...payload.budget, output_tokens: payload.budget.subagent_output_tokens },
    };
    expect(numbersIn(renderToStaticMarkup(<FleetHeadline fleet={payload} />))[1]).toBe(payload.budget.output_tokens);
    expect(numbersIn(renderToStaticMarkup(<FleetHeadline fleet={swapped} />))[1]).toBe(
      payload.budget.subagent_output_tokens
    );
    expect(payload.budget.output_tokens).not.toBe(payload.budget.subagent_output_tokens);
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
      // Column order: dot · session · project · model · turns · output · kind · last turn.
      // The label is a contiguous substring of the id it came from (see format.ts's shortId)
      // — the id itself is a label, not a figure, so parity here is provenance, not magnitude.
      // The non-empty guard matters: `''` is a substring of everything, so without it this
      // assertion is satisfied by a cell that rendered nothing at all.
      expect(cells[1]!.length).toBeGreaterThan(0);
      expect(session.sessionId.includes(cells[1]!)).toBe(true);
      expect(cells[2]).toBe(session.projectId);
      expect(cells[3]).toBe(session.latestModel === null ? 'unrecorded' : session.latestModel.replace(/^<|>$/g, ''));
      expect(asNumber(cells[4]!)).toBe(session.turnCount);
      expect(asNumber(cells[5]!)).toBe(session.outputTokens);
      // The time column, which nothing compared before. A cell rendering firstTurnAt where
      // lastTurnAt belongs fails here — the fixture puts them days apart for that reason.
      expect(cells[7]).toBe(expectedRelative(session.lastTurnAt, now));
    });
  });

  // D8 / M1. "Subagent tokens" repeated "Output tokens" verbatim on 1,918 of 2,037 real
  // sessions — two adjacent identical eight-digit numbers encoding one bit. The column now
  // says the bit, and every branch including the mixed one (which no real session exercises)
  // is derived from the payload and checked against it here.
  test('the Kind column is derived from the payload split, on every branch', async () => {
    const { app, now } = buildFixtureState('sessions-kind');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/sessions'))).json()) as SessionsSlice;
    const html = renderToStaticMarkup(<SessionsTable slice={payload} now={now} limit={payload.sessions.length} />);
    const rows = bodyRows(html);

    const seen = new Set<string>();
    payload.sessions.forEach((session, i) => {
      const kind = rows[i]![6]!;
      seen.add(kind);
      if (session.outputTokens === 0) {
        // No denominator, so no split to report — an explicit absence, never "0% subagent"
        // or a bare dash. There is no ratio to keep reachable either.
        expect(kind).toBe('no output');
        expect(rowTitles(html, i).join(' ')).toContain('no output tokens at all');
        return;
      }
      if (session.subagentOutputTokens === 0) expect(kind).toBe('main');
      else if (session.subagentOutputTokens === session.outputTokens) expect(kind).toBe('subagent');
      else {
        // The mixed branch shows the share, and the share reverses to the payload split.
        const percent = Number(/^(\d+)% subagent$/.exec(kind)?.[1]);
        expect(Number.isFinite(percent)).toBe(true);
        expect(percent).toBe(Math.round((session.subagentOutputTokens / session.outputTokens) * 100));
      }
      // The exact figures stay reachable on every branch that has them.
      expect(rowTitles(html, i).join(' ')).toContain(
        `${session.subagentOutputTokens.toLocaleString('en-US')} of ${session.outputTokens.toLocaleString('en-US')} output tokens`
      );
    });

    // All four branches were actually executed, not just the two the real corpus has.
    expect(seen).toEqual(new Set(['main', 'subagent', 'no output', '25% subagent']));
  });

  test('a `<synthetic>` model reads as a value, not as a broken tag', () => {
    const slice: SessionsSlice = {
      generatedAt: Date.now(),
      sessions: [
        {
          sessionId: 'aaaabbbb-1111-2222-3333-444455556666',
          projectId: 'ashcroft',
          file: '/tmp/x.jsonl',
          turnCount: 3,
          outputTokens: 120,
          subagentOutputTokens: 0,
          firstTurnAt: Date.now() - 1000,
          lastTurnAt: Date.now() - 1000,
          latestModel: '<synthetic>',
        },
      ],
    };
    const html = renderToStaticMarkup(<SessionsTable slice={slice} now={Date.now()} />);
    const cell = bodyRows(html)[0]![3]!;
    expect(cell).toBe('synthetic'); // no angle brackets rendered as literal text
    expect(html).toContain('class="unavailable"'); // treated as a value that is not a model id
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
