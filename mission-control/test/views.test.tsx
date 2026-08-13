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
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Hono } from 'hono';
import { LiveState } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import {
  buildFleet,
  modalInScopeGeneration,
  type FleetSummary,
  type LauncherRow,
  type ModalGeneration,
} from '../server/collectors/fleet.ts';
import { discoverProjects } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import type { SessionsSlice } from '../server/state.ts';
import { FleetTable, FleetHeadline, GenerationFigure, sortFleet } from '../client/src/views/FleetView.tsx';
import { SessionsTable, SessionsView } from '../client/src/views/SessionsView.tsx';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo, writeRegistry, addWorktree } from './fixtures.ts';
import { machineGate, notVerified } from './gate.ts';

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

/** Every `aria-label` in one row, in document order — where the status dots say their state. */
function rowLabels(html: string, rowIndex: number): string[] {
  const tbody = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? '';
  const row = [...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)][rowIndex]?.[1] ?? '';
  return [...row.matchAll(/aria-label="([^"]*)"/g)].map((m) =>
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
    { ts: new Date(now - 5 * 86_400_000).toISOString(), output_tokens: 1_238_441, model: 'claude-sonnet-4-6' },
    { ts: new Date(now - 95_000).toISOString(), output_tokens: 417_902, isSidechain: true, model: 'claude-opus-5' },
  ]);
  // MAIN ONLY, and the long model id — the one that truncates in a 20ch column.
  fixtureClaudeProjectsDir(claudeRoot, busy, 'ffeeddcc-9999-8888-7777-666655554444', [
    { ts: new Date(now - 3 * 3_600_000).toISOString(), output_tokens: 92_614, model: 'claude-haiku-4-5-20251001' },
  ]);
  // SUBAGENT ONLY, in the `agent-a<role>-<slug>-<16 hex>` shape the real corpus uses.
  fixtureClaudeProjectsDir(claudeRoot, busy, 'agent-acode-reviewer-mc-views-4b13769c18ece5b0', [
    { ts: new Date(now - 26 * 3_600_000).toISOString(), output_tokens: 58_296, isSidechain: true, model: 'claude-opus-5' },
  ]);
  // NO OUTPUT AT ALL — a real turn record carrying zero output tokens — and NO MODEL, so the
  // Model column's `unrecorded` branch has a row. Every fixture omitted the model until now,
  // which meant the opposite branch was the one nothing exercised.
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
  return { app, now, projectsRoot, claudeRoot, state };
}

/**
 * A fleet payload whose launcher table is INJECTED, so `launcherDrift` takes its `true` and
 * `false` values instead of the `null` every other fixture produces.
 *
 * Why this exists: `buildFleet` shells out to the real `warroom-install.mjs fleet`, which
 * reads `~/bin` and has no env override. So no fixture project ever matched a launcher, so
 * every fixture row had `launcherDrift === null`, so the Drift column's two informative
 * branches were never executed by any test. Inverting `DriftCell`'s condition — making
 * drifted launchers read "current" and current ones read "drift" — left the suite green.
 *
 * The payload is JSON round-tripped, so it is the collector's real return over the wire,
 * not a hand-written object.
 */
function fleetWithLaunchers(prefix: string): FleetSummary {
  const claudeRoot = mkTmpDir(`mc-views-claude-${prefix}-`);
  const projectsRoot = mkTmpDir(`mc-views-projects-${prefix}-`);
  cleanupDirs.push(claudeRoot, projectsRoot);

  // `Sundial` is deliberately capitalised while its launcher is lowercase: `warroom fleet`
  // names launchers by the .warroom.yml session name, and a case-sensitive lookup reported
  // "no launcher" for a launcher the very same command was listing.
  for (const id of ['Sundial', 'quarry', 'lodestar', 'brackish']) {
    const dir = path.join(projectsRoot, id);
    initGitRepo(dir);
    fixtureClaudeProjectsDir(claudeRoot, dir, `${id.toLowerCase()}-0000-1111-2222-333344445555`, [
      { ts: new Date(Date.now() - 3_600_000).toISOString(), output_tokens: 1_000 },
    ]);
  }
  writeRegistry(path.join(projectsRoot, 'quarry'), [{ name: 'ceo-1', token: '1786445435' }]);

  const launchers: LauncherRow[] = [
    { name: 'sundial', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' }, // on modal, case-mismatched
    { name: 'quarry', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' }, // on modal
    { name: 'lodestar', lines: 2769, fns: 47, gen: 'c146d297', scope: 'in scope' }, // DRIFTED
    { name: 'brackish', lines: 2407, fns: 45, gen: '30e0c7aa', scope: 'excluded' }, // excluded → n/a
    // No project on disk for this one. It is drifted, it needs updating, and it produces no
    // row — which is exactly why the headline count must come from launchers.
    { name: 'orphaned', lines: 2769, fns: 47, gen: 'b0000001', scope: 'in scope' },
  ];

  const projects = discoverProjects({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });
  const store = new IndexStore();
  store.buildCold(projects);
  const payload = buildFleet(projects, store, '', { launchers, claudeProjectsRoot: claudeRoot });
  return JSON.parse(JSON.stringify(payload)) as FleetSummary;
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

  // TITLES ARE CONTENT TOO, and were checked in 2 of 6 places. A mutation battery got four
  // through: the generation cell's `lines` and `fns` swapped, the burn provenance swapped,
  // the subagent share inverted so a row could read "296% of this project's output tokens",
  // and first/last turn instants exchanged. Everything a title asserts is now reversed to
  // the payload the same way a visible figure is.
  // BOTH FIXTURES, because neither alone exercises every branch. buildFixtureState's two
  // projects match no launcher, so `'gen' in launcher` was false on 2 of 2 rows and the
  // lines/fns assertion below was DEAD CODE — swapping the two left the suite green, while
  // the commit message listed that swap as caught. fleetWithLaunchers supplies the matched
  // rows. An assertion inside a branch that never runs is worse than no assertion: it reads
  // as coverage.
  test.each([
    ['no launchers matched', () => buildFixtureState('fleet-titles').app],
    ['launchers matched', null],
  ])('every title in a Fleet row reverses to the payload (%s)', async (_name, makeApp) => {
    const payload = makeApp
      ? ((await (await makeApp().fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary)
      : fleetWithLaunchers('fleet-titles-matched');
    const now = Date.now();
    const html = renderToStaticMarkup(<FleetTable fleet={payload} now={now} />);
    // INDEPENDENT ordering. Using sortFleet here made the row-to-project mapping
    // self-fulfilling: any sort bug moved both sides together and nothing could disagree.
    const ordered = payload.projects.slice().sort((a, b) => {
      if (a.agentActive !== b.agentActive) return a.agentActive ? -1 : 1;
      const byActivity = (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0);
      return byActivity !== 0 ? byActivity : a.id.localeCompare(b.id);
    });

    let launcherRowsChecked = 0;
    ordered.forEach((project, i) => {
      const titles = rowTitles(html, i).join('\n');

      expect(titles).toContain(
        project.lastActivityAt === null ? 'no recorded turn' : new Date(project.lastActivityAt).toISOString()
      );
      expect(titles).toContain(project.root);
      if ('gen' in project.launcher) {
        expect(titles).toContain(`${project.launcher.lines} lines · ${project.launcher.fns} functions`);
        expect(titles).toContain(project.launcher.scope);
        launcherRowsChecked++;
      } else {
        expect(titles).toContain(project.launcher.reason);
      }
      // Subagent share: a real ratio, or an explicit statement that there is none. It can
      // never exceed 100%, which the inverted version did.
      if (project.outputTokens > 0) {
        const share = Math.round((project.subagentOutputTokens / project.outputTokens) * 100);
        expect(share).toBeLessThanOrEqual(100);
        expect(titles).toContain(`${share}% of this project's all-time output tokens`);
      } else {
        expect(titles).toContain('no output tokens recorded');
      }
    });

    // The branch coverage this test previously only appeared to have.
    if (!makeApp) expect(launcherRowsChecked).toBeGreaterThan(0);
  });

  test('every title in a Sessions row reverses to the payload', async () => {
    const { app, now } = buildFixtureState('sessions-titles');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/sessions'))).json()) as SessionsSlice;
    const html = renderToStaticMarkup(<SessionsTable slice={payload} now={now} limit={payload.sessions.length} />);

    let unrecordedModelRows = 0;
    payload.sessions.forEach((session, i) => {
      const cellTitles = rowTitles(html, i);
      const titles = cellTitles.join('\n');
      expect(titles).toContain(session.sessionId);
      expect(titles).toContain(session.file);
      // PER-CELL, not against the joined blob: `projectId` is a substring of `file`, so
      // asserting it against everything was satisfied by the Session cell's own title and
      // said nothing about the Project cell. The Project cell's title must BE the id.
      expect(cellTitles).toContain(session.projectId);
      // first and last, each labelled, each the right one — the swap made these identical
      // strings in the old fixture and so was undetectable.
      expect(titles).toContain(
        `first turn ${session.firstTurnAt === null ? 'no recorded turn' : new Date(session.firstTurnAt).toISOString()}`
      );
      expect(titles).toContain(
        `last turn ${session.lastTurnAt === null ? 'no recorded turn' : new Date(session.lastTurnAt).toISOString()}`
      );
      if (session.latestModel !== null) expect(cellTitles).toContain(session.latestModel);
      else unrecordedModelRows++;
    });

    // `latestModel === null` was 0 of 2 fixtures, so that branch never ran here either.
    expect(unrecordedModelRows).toBeGreaterThan(0);
  });

  test('the burn tooltip describes the burn, and does not go stale', async () => {
    const { app } = buildFixtureState('fleet-burn-title');
    const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const html = renderToStaticMarkup(<FleetHeadline fleet={payload} />);
    const titles = [...html.matchAll(/title="([^"]*)"/g)].map((m) => m[1] ?? '');
    const burnTitle = titles.find((t) => t.includes('rolling')) ?? '';

    expect(burnTitle).toContain(`${payload.budget.window_hours}-hour window`);
    expect(burnTitle).toContain('scripts/lib/usage.js');
    // filesScanned and bytesRead are EXCLUDED from the slice hash, so no frame is pushed
    // when only they move. Rendering them would put the one guaranteed-stale value on
    // screen, which the previous version of this tooltip did. Asserted by phrasing, not by
    // the numbers themselves — `filesScanned` is 5 in this fixture and "5-hour window"
    // contains a 5, so a bare substring check on the value is not a check on anything.
    expect(burnTitle).not.toContain('transcripts scanned');
    expect(burnTitle).not.toContain('bytes read');
    // And nothing else in the headline renders them either.
    expect(textOf(html)).not.toContain('bytes read');
  });

  // B1. The headline used to print "every in-scope launcher on the modal generation" whenever
  // `drifted === 0` — and with no modal generation, every row's drift is null, so `drifted`
  // IS 0. A positive convergence claim, in the biggest type on the screen, in exactly the
  // three cases where nothing was compared.
  describe('the drift headline never claims convergence without a comparison', () => {
    const cases: { name: string; modal: ModalGeneration }[] = [
      { name: 'a tie', modal: { kind: 'tie', candidates: ['aaaaaaaa', 'bbbbbbbb'], leaderCount: 1, generations: 2, inScopeLaunchers: 2 } },
      { name: 'every launcher excluded', modal: { kind: 'none-in-scope', launchers: 3 } },
      { name: 'no launchers at all', modal: { kind: 'no-launchers' } },
    ];

    for (const { name, modal } of cases) {
      test(`${name} renders "not compared" and names what would fill it`, () => {
        const html = renderToStaticMarkup(<GenerationFigure modal={modal} />);
        const text = textOf(html);
        expect(text).toContain('not compared');
        expect(text.toLowerCase()).not.toContain('all '); // no "all N launchers on …"
        // The reason is reachable, and it says what would resolve the case.
        expect(/title="[^"]*would fill this[^"]*"/.test(html)).toBe(true);
        // Every branch says it in the same population — launchers — because that is what the
        // headline counts. Three different wordings for one fact is how the CRITICAL started.
        expect(/title="[^"]*[Nn]o launcher was compared/.test(html)).toBe(true);
        // …and reachable WITHOUT a pointer: focusable, with the reason as its accessible name.
        expect(/tabindex="0"/i.test(html)).toBe(true);
        expect(/aria-label="[^"]*would fill this[^"]*"/.test(html)).toBe(true);
      });
    }

    test('a real comparison, and only then, states convergence', () => {
      const clean = textOf(
        renderToStaticMarkup(
          <GenerationFigure
            modal={{ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 11, driftedLaunchers: 0 }}
          />
        )
      );
      expect(clean).toContain('all 11 in-scope launchers on a86770a9');
      expect(clean).not.toContain('not compared');

      const dirty = textOf(
        renderToStaticMarkup(
          <GenerationFigure
            modal={{ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 11, driftedLaunchers: 4 }}
          />
        )
      );
      expect(numbersIn(dirty)[0]).toBe(4); // the figure is the drift count, not the hash
      expect(dirty).toContain('of 11 in-scope launchers, off a86770a9');
    });

    test('the tooltip that documents the population rule says what the code does', () => {
      // Inverting this one sentence — "counted over the projects below" — survived the whole
      // suite green. It is the only place the CRITICAL's rule is written down for a reader,
      // so an inversion is a lie in the UI even while the arithmetic underneath is right.
      const html = renderToStaticMarkup(
        <GenerationFigure modal={{ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 11, driftedLaunchers: 4 }} />
      );
      const title = /title="([^"]*)"/.exec(html)?.[1] ?? '';
      expect(title).toContain('Counted over launchers, not over the projects below');
      expect(title).toContain('a launcher with no discovered project still needs updating');
      expect(title).not.toContain('Counted over the projects');
    });

    test('the tie names the real distribution, not an evenness it never counted', () => {
      // a,a,b,b,c: five launchers, three generations, two tied at two each. The old label
      // read "5 in-scope launchers are split evenly across 2 generations (a, b)" — false
      // twice: five are not split evenly across two, and `c` was named nowhere.
      const modal = modalInScopeGeneration([
        { name: 'l1', lines: 1, fns: 1, gen: 'aaaaaaaa', scope: 'in scope' },
        { name: 'l2', lines: 1, fns: 1, gen: 'aaaaaaaa', scope: 'in scope' },
        { name: 'l3', lines: 1, fns: 1, gen: 'bbbbbbbb', scope: 'in scope' },
        { name: 'l4', lines: 1, fns: 1, gen: 'bbbbbbbb', scope: 'in scope' },
        { name: 'l5', lines: 1, fns: 1, gen: 'cccccccc', scope: 'in scope' },
      ]);
      expect(modal).toEqual({
        kind: 'tie',
        candidates: ['aaaaaaaa', 'bbbbbbbb'],
        leaderCount: 2,
        generations: 3,
        inScopeLaunchers: 5,
      });

      const html = renderToStaticMarkup(<GenerationFigure modal={modal} />);
      const label = /aria-label="([^"]*)"/.exec(html)?.[1] ?? '';
      expect(label).toContain('5 in-scope launchers sit on 3 different generations');
      expect(label).toContain('2 are level at the front with 2 launchers each');
      expect(label).toContain('1 further generation trails behind'); // `c` is accounted for
      expect(label).not.toContain('split evenly');
      // And the tie is visibly a warning, not the same grey as the two benign cases —
      // `.unavailable` sets its own colour, so a tone on the Figure around it was inert.
      expect(html).toContain('text-warn');
    });

    test('a fleet of one reads "launcher", not "launchers"', () => {
      const one = textOf(
        renderToStaticMarkup(
          <GenerationFigure modal={{ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 1, driftedLaunchers: 0 }} />
        )
      );
      expect(one).toContain('all 1 in-scope launcher on a86770a9');
      expect(one).not.toContain('launchers');
    });
  });

  // ── THE CRITICAL: one claim, one population ────────────────────────────────────────
  describe('the drift sentence counts launchers on both sides', () => {
    test('a drifted launcher with no discovered project is still counted', () => {
      const payload = fleetWithLaunchers('drift-population');
      const modal = payload.modalGeneration;
      expect(modal.kind).toBe('modal');
      if (modal.kind !== 'modal') return;

      // Five launchers: 4 in scope (sundial, quarry on a86770a9; lodestar and orphaned off
      // it), 1 excluded. `orphaned` has no project on disk, so it produces no row.
      const driftedProjects = payload.projects.filter((p) => p.launcherDrift === true).length;
      expect(driftedProjects).toBe(1); // lodestar only — orphaned has no row to count
      expect(modal.driftedLaunchers).toBe(2); // lodestar AND orphaned
      expect(modal.inScopeLaunchers).toBe(4);

      // The rendered sentence must use the launcher figure, not the project figure. Reading
      // "1 of 4" here would be the defect: numerator projects, denominator launchers.
      const text = textOf(renderToStaticMarkup(<GenerationFigure modal={modal} />));
      expect(numbersIn(text)[0]).toBe(modal.driftedLaunchers);
      expect(text).toContain('2');
      expect(text).toContain('of 4 in-scope launchers');
      expect(text).not.toContain('of 1 ');
    });

    test('the all-clear is unreachable while any in-scope launcher is off modal', () => {
      // The precise shape of the CRITICAL: zero drifted PROJECTS, non-zero drifted
      // LAUNCHERS. The old code rendered "all N in-scope launchers on X" here.
      const launchers: LauncherRow[] = [
        { name: 'quarry', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' },
        { name: 'sundial', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' },
        { name: 'ghosted-a', lines: 2769, fns: 47, gen: 'c146d297', scope: 'in scope' },
        { name: 'ghosted-b', lines: 2769, fns: 47, gen: 'b0000001', scope: 'in scope' },
      ];
      const modal = modalInScopeGeneration(launchers);
      expect(modal).toEqual({
        kind: 'modal',
        generation: 'a86770a9',
        inScopeLaunchers: 4,
        driftedLaunchers: 2,
      });

      // GenerationFigure receives no project data at all — there is no second population it
      // could reach for even if a future edit tried. That is the structural half of the fix.
      const text = textOf(renderToStaticMarkup(<GenerationFigure modal={modal} />));
      expect(text).not.toContain('all '); // no convergence claim
      expect(text).toContain('2');
      expect(text).toContain('of 4 in-scope launchers, off a86770a9');
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

  // ── the two state columns, which no test rendered ──────────────────────────────────
  // A 24-mutation battery caught 17. The survivors were not titles: inverting DriftCell's
  // condition made drifted launchers read "current" and current ones read "drift" with the
  // suite green, because every fixture row had launcherDrift === null and neither
  // informative branch ever executed. Same for both status dots.
  describe('state columns', () => {
    test('Drift renders each of its three states from the payload, not from a shared null', () => {
      const payload = fleetWithLaunchers('drift-states');
      const rows = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={Date.now()} />));

      const seen = new Map<string, string>();
      for (const project of payload.projects) {
        const cells = rows.find((r) => (r[1] ?? '').split(' ')[0] === project.id)!;
        expect(cells).toBeDefined();
        const rendered = cells[3]!;
        seen.set(project.id, rendered);
        if (project.launcherDrift === true) expect(rendered).toBe('drift');
        else if (project.launcherDrift === false) expect(rendered).toBe('current');
        else expect(rendered).toBe('n/a');
      }

      // All three branches were executed — the point of the injected launcher table.
      expect(new Set(seen.values())).toEqual(new Set(['drift', 'current', 'n/a']));
      expect(seen.get('lodestar')).toBe('drift');
      expect(seen.get('quarry')).toBe('current');
      expect(seen.get('brackish')).toBe('n/a'); // excluded launcher — a difference is not drift
    });

    test('a case-differing directory still matches its launcher, and does not claim otherwise', () => {
      // `Sundial` on disk, `~/bin/sundial` in the table. The case-sensitive lookup rendered
      // "no launcher" and gave, as its reason, that warroom fleet did not list it — untrue
      // about the very table it had just read.
      const payload = fleetWithLaunchers('drift-case');
      const sundial = payload.projects.find((p) => p.id === 'Sundial')!;
      expect('gen' in sundial.launcher).toBe(true);
      expect(sundial.launcherDrift).toBe(false);

      const rows = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={Date.now()} />));
      const cells = rows.find((r) => (r[1] ?? '').split(' ')[0] === 'Sundial')!;
      expect(cells[2]).toBe('a86770a9');
      expect(cells[3]).toBe('current');
    });

    test('the agent dot reflects agentActive on every row, by shape not only colour', () => {
      const payload = fleetWithLaunchers('dots');
      const html = renderToStaticMarkup(<FleetTable fleet={payload} now={Date.now()} />);
      const ordered = sortFleet(payload.projects);
      expect(ordered.some((p) => p.agentActive)).toBe(true);
      expect(ordered.some((p) => !p.agentActive)).toBe(true);

      ordered.forEach((project, i) => {
        const labels = rowLabels(html, i);
        expect(labels[0]).toBe(
          project.agentActive ? 'Agent-active — live .worktrees/.registry' : 'Dormant — no registry file'
        );
      });
      // Shape, not just colour: the dormant marker is a ring, the live one a filled disc.
      expect(html).toContain('border-muted');
      expect(html).toContain('bg-live');
    });
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
      // THE SHARED GATE, imported. This test used to re-implement it inline, and the
      // re-implementation still contained the exact defect gate.ts was extracted to remove:
      // an early return on `payload.projects.length === 0`, which is the result of the
      // operation under test. Measured before the fix: MC_PROJECT_ROOTS=/mc-no-such-root
      // turned live.test.ts red (correct) and left this file at 17 pass / 0 fail — one file
      // fixed, the other still skipping green, while three comments said the consolidation
      // was done.
      const blocked = machineGate();
      if (blocked) {
        notVerified('real-fleet render parity', blocked);
        return;
      }

      const app = new Hono();
      app.route('/api', createApi(new LiveState()));
      const payload = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;

      expect(payload.projects.length).toBeGreaterThan(0); // asserted, never excused
      const rows = bodyRows(renderToStaticMarkup(<FleetTable fleet={payload} now={Date.now()} />));
      expect(rows).toHaveLength(payload.projects.length);
      for (const project of payload.projects) {
        const cells = rows.find((r) => (r[1] ?? '').split(' ')[0] === project.id)!;
        expect(cells).toBeDefined();
        expect(asNumber(cells[5]!)).toBe(project.sessionCount);
        expect(asNumber(cells[6]!)).toBe(project.outputTokens);
      }

      // AND IT COMPARED SOMETHING. Nineteen zeros equal nineteen zeros, so the loop above
      // passes just as happily against an empty corpus as against a real one — which is
      // precisely what it did when AGENTVIBE_PROJECTS_DIR was pointed at an empty directory.
      // The gate now catches that case; this asserts the same thing from the other side, so
      // a vacuous comparison cannot report success even if the gate is fooled again.
      expect(payload.projects.some((p) => p.outputTokens > 0)).toBe(true);
      expect(payload.projects.some((p) => p.sessionCount > 0)).toBe(true);
    },
    60_000
  );
});
