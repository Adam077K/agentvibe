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
import { summarizeClaims, type BeliefSummary, type ClaimsSummary, type VerdictCounts, type Waiver } from '../server/collectors/belief.ts';
import type { ConflictReport } from '../server/collectors/conflicts.ts';
import type { LedgerClaim } from '../server/projects.ts';
import { FleetTable, FleetHeadline, GenerationFigure, sortFleet } from '../client/src/views/FleetView.tsx';
import { SessionsTable, SessionsView } from '../client/src/views/SessionsView.tsx';
import { BeliefView, ExpiringTable, WaiverList } from '../client/src/views/BeliefView.tsx';
import { ConflictsTable, ConflictsView, totalsFor } from '../client/src/views/ConflictsView.tsx';
import { ProjectEvents, ProjectHeadline, ProjectStageProbe, ProjectView } from '../client/src/views/ProjectView.tsx';
import { InboxHeadline, InboxTable, InboxView, inboxTotals } from '../client/src/views/InboxView.tsx';
import { HeadlineBar } from '../client/src/ui.tsx';
import App, { VIEWS, AppBar, StreamNotices, FetchedBadge, badgeFor, type Freshness, type ViewDef } from '../client/src/App.tsx';
import {
  failureMessage,
  initialEndpointState,
  requestBegan,
  requestSettled,
  type EndpointState,
  type StreamState,
} from '../client/src/api.ts';
import type { ProjectDetail, InboxPayload, InboxProject } from '../server/routes/api.ts';
import { inboxEmptyState } from '../server/collectors/empty.ts';
import { PROJECT_PROBE_TIMEOUT_MS, PROJECT_PROBE_TIMEOUT_SECONDS } from '../server/collectors/probe-bounds.ts';
import type { Project } from '../server/projects.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo, writeRegistry, addWorktree } from './fixtures.ts';
import { machineGate, notVerified } from './gate.ts';

const cleanupDirs: string[] = [];
/** Paths chmod-ed to 000 by a fixture — restored before rmTmp, which cannot delete them. */
const cleanupChmods: string[] = [];
afterAll(() => {
  for (const p of cleanupChmods) {
    try {
      fs.chmodSync(p, 0o644);
    } catch {
      /* already restored by the fixture's own finally */
    }
  }
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

/**
 * Every `<Figure>` in a fragment, in document order, split into its three parts.
 *
 * READ A BAND WITH THIS, NEVER WITH `numbersIn`. `numbersIn` is a digit scanner, and a
 * headline is full of things that contain digits without being figures. Two live examples,
 * both measured:
 *
 *   Project band sub-line   `~/…/mc-views-projects-7f3a1/…`   → six numbers before figure #1
 *   Fleet drift sub-line    `off a86770a9`                    → [11, 86770, 9]
 *                           `30e0c7aa`                        → [2, 30, 0, 7]
 *
 * A generation hash is not prose, and the Fleet assertions that used `numbersIn` survived
 * only because every index they read — `[0]`, `[1]`, `slice(0, 7)` — happened to fall before
 * the hash. That is a property of the current band's ORDER, not of the data: add a figure,
 * reorder the band, or extend the slice by one and the comparison silently starts reading
 * hexadecimal. Nothing stated the invariant those assertions depended on, so nothing could
 * enforce it.
 *
 * `numbersIn` survives for ONE job: reading a single figure's `sub` when that sub is known to
 * hold no identifier. Never a whole band.
 *
 * `<div class="label">` with no other class is Figure's own signature — the other three
 * `label` usages in the client are `<span>`s or carry `mb-1.5`.
 *
 * A FIGURE STATES ITS PROVENANCE IN ONE OF TWO PLACES, and which one depends on what the
 * value is. A measured value carries it as `Figure`'s own `title`, on the value div. A value
 * that could not be measured is an `<Unavailable>`, which carries the same kind of sentence
 * on the span itself, alongside an `aria-label` and a tab stop — more than the div `title`
 * gives, not less. So `provenance` is read from whichever element holds it, and `unavailable`
 * records which shape this figure took, because the two are asserted differently.
 */
interface RenderedFigure {
  label: string;
  value: string;
  sub: string;
  /** `Figure`'s own title, on the value div. Empty for an Unavailable value. */
  title: string;
  /** Whichever of the two elements states it. */
  provenance: string;
  /** Present only on an Unavailable value — a title attribute alone is not announced. */
  ariaLabel: string;
  unavailable: boolean;
}
function unescape(s: string): string {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/');
}
function figuresIn(html: string): RenderedFigure[] {
  return html
    .split('<div class="label">')
    .slice(1)
    .map((chunk) => {
      const valueDiv = /<div\b([^>]*\bclass="fig mt-1[^"]*"[^>]*)>([\s\S]*?)<\/div>/.exec(chunk);
      const valueMarkup = valueDiv?.[2] ?? '';
      const title = unescape(/title="([^"]*)"/.exec(valueDiv?.[1] ?? '')?.[1] ?? '');
      // Scoped to the VALUE, never the sub-line: Project's subagent share is an Unavailable
      // in the sub of a figure whose value is a perfectly ordinary number.
      const unavailable = /<span[^>]*class="unavailable/.test(valueMarkup);
      const valueTitle = unescape(/<span[^>]*\btitle="([^"]*)"/.exec(valueMarkup)?.[1] ?? '');
      return {
        label: textOf(/^([\s\S]*?)<\/div>/.exec(chunk)?.[1] ?? ''),
        value: textOf(valueMarkup),
        sub: textOf(/<div class="mt-1\.5 truncate[^"]*">([\s\S]*?)<\/div>/.exec(chunk)?.[1] ?? ''),
        title,
        provenance: title !== '' ? title : valueTitle,
        ariaLabel: unescape(/<span[^>]*\baria-label="([^"]*)"/.exec(valueMarkup)?.[1] ?? ''),
        unavailable,
      };
    });
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

const DEFAULT_LAUNCHERS: LauncherRow[] = [
  { name: 'sundial', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' }, // on modal, case-mismatched
  { name: 'quarry', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' }, // on modal
  { name: 'lodestar', lines: 2769, fns: 47, gen: 'c146d297', scope: 'in scope' }, // DRIFTED
  { name: 'brackish', lines: 2407, fns: 45, gen: '30e0c7aa', scope: 'excluded' }, // excluded → n/a
  // No project on disk for this one. It is drifted, it needs updating, and it produces no
  // row — which is exactly why the headline count must come from launchers.
  { name: 'orphaned', lines: 2769, fns: 47, gen: 'b0000001', scope: 'in scope' },
];

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
 *
 * `launchers` is a parameter because the machine's own answer is not one state, it is four:
 * a modal generation, a tie, everything excluded, and NO LAUNCHERS AT ALL — which is what a
 * CI runner with no ~/bin produces, and is the state that turned PR5's title assertion red.
 * A test that wants to cover them cannot ask the machine; it has to say which one it means.
 */
function fleetWithLaunchers(prefix: string, launchers: LauncherRow[] = DEFAULT_LAUNCHERS): FleetSummary {
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

      const dirtyHtml = renderToStaticMarkup(
        <GenerationFigure modal={{ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 11, driftedLaunchers: 4 }} />
      );
      // THE VALUE ELEMENT, not the first number on screen. `numbersIn` on this fragment
      // returns [4, 11, 86770, 9] — the last two mined out of the generation hash.
      expect(asNumber(figuresIn(dirtyHtml)[0]!.value)).toBe(4);
      expect(textOf(dirtyHtml)).toContain('of 11 in-scope launchers, off a86770a9');
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
      const html = renderToStaticMarkup(<GenerationFigure modal={modal} />);
      const text = textOf(html);
      expect(asNumber(figuresIn(html)[0]!.value)).toBe(modal.driftedLaunchers);
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
    const figures = figuresIn(html);

    const active = payload.projects.filter((p) => p.agentActive).length;
    expect(payload.budget.output_tokens).toBeGreaterThan(0); // the shape below assumes a share is shown

    // FIGURE BY FIGURE, each read positionally WITHIN its own element. This was one
    // `numbersIn(html).slice(0, 7)` over the whole band, which worked only because seven was
    // where the generation hash started — `off a86770a9` scans as [86770, 9]. The slice was
    // the invariant and nothing said so; one more figure in the band and it read hex.
    expect(figures.map((f) => f.label)).toEqual([
      `Burn · rolling ${payload.budget.window_hours}h · account-wide`,
      'Projects',
      'Launcher drift',
    ]);
    expect(asNumber(figures[0]!.value)).toBe(payload.budget.output_tokens);
    // Subagent then share%, in the sub of the figure they are a share OF — the two are read
    // together so a numerator from one population and a denominator from another cannot pass.
    expect(numbersIn(figures[0]!.sub)).toEqual([
      payload.budget.subagent_output_tokens,
      Math.round((payload.budget.subagent_output_tokens / payload.budget.output_tokens) * 100),
    ]);
    expect(asNumber(figures[1]!.value)).toBe(payload.projects.length);
    expect(numbersIn(figures[1]!.sub)).toEqual([active, payload.projects.length - active]);
    expect(payload.budget.output_tokens).not.toBe(payload.budget.subagent_output_tokens); // the swap is detectable
    // The drift figure's content depends on this machine's ~/bin, so it is asserted by the
    // GenerationFigure tests above, which pass an explicit ModalGeneration and need no
    // machine state. Its LABEL is asserted here, because a band that lost the figure
    // entirely would otherwise still pass.

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
    const burnOf = (f: FleetSummary) => asNumber(figuresIn(renderToStaticMarkup(<FleetHeadline fleet={f} />))[0]!.value);
    expect(burnOf(payload)).toBe(payload.budget.output_tokens);
    expect(burnOf(swapped)).toBe(
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

  // THE ONE ACTIVATABLE THING IN THE TABLE MUST NOT WEAR THE CANNOT-SHOW MARKER. The
  // drill-down button was `underline decoration-dotted underline-offset-[3px]`, which is
  // `.unavailable`'s own grammar in styles.css — "a value the UI knows it cannot show",
  // `cursor: help`, same offset — and it renders two cells away from `no launcher` and `n/a`
  // wearing it literally, differing only in colour. It is also the drill-down's ONLY
  // announcement, so the affordance was borrowed from the vocabulary of things you cannot do.
  test('the drill-down reads as activatable, not as a value that cannot be shown', () => {
    const payload = fleetWithLaunchers('drill-affordance');
    const html = renderToStaticMarkup(<FleetTable fleet={payload} now={Date.now()} onOpenProject={() => {}} />);

    const button = /<button\b[^>]*>/.exec(html)?.[0] ?? '';
    expect(button).not.toBe(''); // premise: the drill-down is rendered at all
    expect(button).toContain('underline'); // it announces itself as activatable
    expect(button).toContain('cursor-pointer');
    expect(button).not.toContain('decoration-dotted'); // …in the link vocabulary, not the help one
    expect(button).not.toContain('unavailable');

    // NON-VACUITY: this fixture really does render `.unavailable` cells in the same table, so
    // the collision the assertion forbids is one this input could actually produce.
    expect(html).toContain('class="unavailable');
    // And they are still distinguishable after the change: the cannot-show cells keep the
    // dotted decoration that the button no longer has.
    const unavailableSpan = /<span[^>]*class="unavailable[^>]*>/.exec(html)?.[0] ?? '';
    expect(unavailableSpan).not.toBe('');
    expect(unavailableSpan).toContain('role="note"');
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

// ── render parity — Conflicts ────────────────────────────────────────────────────────
// The figure under the header ("N worktrees not swept") and the figure in the rows come
// from ONE array in ONE pass (totalsFor), and this reverses both out of the rendered HTML
// back to the payload the route returned. The §0 corollary being defended: the Fleet
// headline once rendered "2 of 11" for an answer of 4 because its numerator and denominator
// were drawn from two populations.
describe('render parity — Conflicts', () => {
  /**
   * A real /api/conflicts payload over a fixture fleet with a genuine two-worktree clash —
   * AND, when asked, a genuinely unreadable third one.
   *
   * `withUnreadable` exists because `read === attempted - unreadable` was asserted on a
   * fixture where `unreadable` was always 0, so the identity reduced to `2 === 2` and
   * `read: attempted` passed the whole suite. The premise two lines below it was guarded
   * explicitly — "so the assertion below is not 0 === 0" — but aimed at `excluded`, which did
   * not need it, and not at `unreadable`, which is the entire point of the split.
   *
   * Unreadable is made by chmod-ing the `.git` POINTER FILE, not the directory: chmod 000 on
   * the directory makes `git worktree list --porcelain` report it prunable, so it is dropped
   * from the sweep before it can be unreadable, and the branch is never reached.
   */
  async function conflictsPayload(prefix: string, withUnreadable = false): Promise<ConflictReport[]> {
    const projectsRoot = mkTmpDir(`mc-views-conflicts-${prefix}-`);
    const claudeRoot = mkTmpDir(`mc-views-conflicts-claude-${prefix}-`);
    cleanupDirs.push(projectsRoot, claudeRoot);

    const root = path.join(projectsRoot, 'ashcroft');
    initGitRepo(root);
    const wtA = path.join(root, '.worktrees', 'ceo-1-100');
    const wtB = path.join(root, '.worktrees', 'ceo-2-200');
    addWorktree(root, wtA, 'ceo-1-100');
    addWorktree(root, wtB, 'ceo-2-200');
    // A third worktree no registry names — the excluded population, non-zero on purpose so
    // the header's figure is not 0 === 0.
    addWorktree(root, path.join(root, '.worktrees', 'by-hand'), 'by-hand');
    const registry = [
      { name: 'ceo-1', token: '100' },
      { name: 'ceo-2', token: '200' },
    ];

    fs.writeFileSync(path.join(wtA, 'shared.ts'), 'from A\n');
    fs.writeFileSync(path.join(wtB, 'shared.ts'), 'from B\n');
    fs.writeFileSync(path.join(wtA, 'only-a.ts'), 'a\n');

    let blindedPointer: string | null = null;
    if (withUnreadable) {
      const wtC = path.join(root, '.worktrees', 'ceo-3-300');
      addWorktree(root, wtC, 'ceo-3-300');
      registry.push({ name: 'ceo-3', token: '300' });
      blindedPointer = path.join(wtC, '.git');
      fs.chmodSync(blindedPointer, 0o000);
      cleanupChmods.push(blindedPointer);
    }
    writeRegistry(root, registry);

    const state = new LiveState({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });
    const app = new Hono();
    app.route('/api', createApi(state));
    try {
      const res = await app.fetch(new Request('http://127.0.0.1/api/conflicts'));
      expect(res.status).toBe(200);
      return ((await res.json()) as { reports: ConflictReport[] }).reports;
    } finally {
      if (blindedPointer !== null) fs.chmodSync(blindedPointer, 0o644);
    }
  }

  test('the conflict table reverses to the /api/conflicts payload', async () => {
    const reports = await conflictsPayload('table');
    const report = reports.find((r) => r.project === 'ashcroft')!;
    expect(report).toBeDefined();
    expect(report.conflicts.length).toBeGreaterThan(0); // it compared something real

    const rows = bodyRows(renderToStaticMarkup(<ConflictsTable report={report} />));
    expect(rows).toHaveLength(report.conflicts.length); // nothing silently dropped

    let compared = 0;
    for (const conflict of report.conflicts) {
      const row = rows.find((cells) => cells[0] === conflict.file);
      expect(row).toBeDefined();
      expect(asNumber(row![1]!)).toBe(conflict.worktrees.length);
      for (const w of conflict.worktrees) {
        if (w.branch !== null) expect(row![2]).toContain(w.branch);
      }
      compared++;
    }
    expect(compared).toBeGreaterThan(0);
  });

  test('the excluded figure under the header is the number the sweep excluded', async () => {
    const reports = await conflictsPayload('excluded', true);
    const totals = totalsFor(reports);
    // The premise: something really was excluded, so the assertion below is not 0 === 0.
    expect(totals.excluded).toBeGreaterThan(0);
    expect(totals.excluded).toBe(reports.reduce((n, r) => n + r.excluded.count, 0));

    const html = renderToStaticMarkup(
      <ConflictsView reports={reports} loading={false} error={null} onRefresh={() => {}} />
    );
    const text = textOf(html);
    expect(text).toContain(`${totals.excluded} worktrees not swept (not agent-started)`);
    // And the attempted count on screen is the number of worktree entries the payload
    // carries — the other half of the same partition.
    expect(text).toContain(`${totals.attempted} agent worktrees swept`);
    expect(totals.attempted + totals.excluded).toBe(
      reports.reduce((n, r) => n + r.worktrees.length + r.excluded.count, 0)
    );

    // ONE WORD, ONE QUANTITY. `swept` used to mean "attempted" in the header and "attempted
    // minus unreadable" in each project line, so the project lines never summed to the
    // headline and a reader could not tell which meaning was in front of them. The two
    // quantities now have two names, and the identity between them is asserted.
    //
    // THE PREMISE THAT MAKES THAT IDENTITY MEAN ANYTHING: something really was unreadable.
    // Without it `unreadable` is 0, the identity reduces to `attempted === attempted`, and
    // `read: attempted` — the collapse the split exists to prevent — passes the whole suite.
    // Measured: 181 pass, and the one failure was pre-existing. The premise below was guarded
    // for `excluded`, which did not need it, and not for `unreadable`, which is the point.
    expect(totals.unreadable).toBeGreaterThan(0);
    expect(totals.read).toBe(totals.attempted - totals.unreadable);
    expect(totals.read).toBeLessThan(totals.attempted); // …and the two are now distinguishable
  });

  // NOTHING CHECKED IS NOT AN ALL-CLEAR. With no registry file anywhere the sweep has an
  // empty scope, and this rendered "0 agent-started worktrees … every one of them was
  // readable, so this is a measured all-clear" — the exact shape FleetView's GenerationFigure
  // documents and forbids. One missing .registry away from being the normal state.
  test('zero worktrees swept renders as nothing-checked, never as a measured all-clear', () => {
    const nothingSwept: ConflictReport[] = [
      { project: 'ashcroft', worktrees: [], conflicts: [], excluded: { count: 7, reason: 'not agent-started' }, enumerated: { readable: true } },
      { project: 'tessellate', worktrees: [], conflicts: [], excluded: { count: 0, reason: 'not agent-started' }, enumerated: { readable: true } },
    ];
    expect(totalsFor(nothingSwept).attempted).toBe(0); // the premise
    const text = textOf(
      renderToStaticMarkup(<ConflictsView reports={nothingSwept} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(text).toContain('Nothing was checked');
    expect(text).not.toContain('measured all-clear');
    expect(text).toContain('7 worktrees exist and were excluded'); // it says what it skipped

    // An empty reports array is the same condition and must answer the same way — it used to
    // print the all-clear across "0 of 0 projects" too.
    const emptyText = textOf(
      renderToStaticMarkup(<ConflictsView reports={[]} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(emptyText).toContain('Nothing was checked');
    expect(emptyText).not.toContain('measured all-clear');
  });

  // C2 AT THE PIXEL. A project git refused to enumerate arrives as `worktrees: []` with
  // `excluded.count: 0`, which is byte-identical to a healthy project that simply has no
  // agent worktrees — so the view must read `enumerated`, or it renders an all-clear over a
  // population nobody could list.
  test('a project that could not be enumerated is never folded into the all-clear', () => {
    const unknown: ConflictReport[] = [
      {
        project: 'orphaned',
        worktrees: [],
        conflicts: [],
        excluded: { count: 0, reason: 'not agent-started' },
        enumerated: { readable: false, reason: 'git worktree list --porcelain exited 128 in /x (fatal: not a git repository) — this project\'s worktrees could not be enumerated, so the list is UNKNOWN rather than empty.' },
      },
      {
        project: 'healthy',
        worktrees: [{ path: '/y/.worktrees/ceo-1-1', branch: 'ceo-1-1', changedFiles: ['a.ts'] }],
        conflicts: [],
        excluded: { count: 0, reason: 'not agent-started' },
        enumerated: { readable: true },
      },
    ];
    expect(totalsFor(unknown).unenumerated).toBe(1); // the premise
    const text = textOf(
      renderToStaticMarkup(<ConflictsView reports={unknown} loading={false} error={null} onRefresh={() => {}} />)
    );

    expect(text).toContain('1 of 2 projects could not be enumerated at all');
    expect(text).toContain('exited 128'); // the reason reaches the screen
    expect(text).toContain('worktree list unreadable');
    // The all-clear's exact wording must NOT appear — the honest headline is used instead.
    expect(text).not.toContain('measured all-clear');
    expect(text).toContain('No conflicts among the worktrees that could be checked');
    expect(text).toContain('NOT an all-clear for the fleet');
  });

  // The all-clear's own branch, so the tests above are not merely asserting the absence of a
  // string that no input ever produces.
  test('…and with worktrees actually read, the all-clear IS printed', async () => {
    const reports = (await conflictsPayload('allclear')).map((r) => ({ ...r, conflicts: [] }));
    expect(totalsFor(reports).read).toBeGreaterThan(0); // the premise
    const text = textOf(
      renderToStaticMarkup(<ConflictsView reports={reports} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(text).toContain('measured all-clear');
    expect(text).not.toContain('Nothing was checked');
  });

  // ONE WORDING, ONE PLACE. The excluded explanation is the collector's constant, rendered —
  // not a second sentence maintained in the view. The two had already drifted apart, and the
  // view's copy quoted "17 seconds per request": a measurement of the SYNCHRONOUS sweep this
  // PR deleted, printed next to a computed worktree count as though it applied to it.
  test("the excluded explanation on screen is the collector's own string, and prices nothing", async () => {
    const reports = await conflictsPayload('reason');
    const withExclusion = reports.find((r) => r.excluded.count > 0)!;
    expect(withExclusion).toBeDefined();

    const text = textOf(
      renderToStaticMarkup(<ConflictsView reports={reports} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(text).toContain(withExclusion.excluded.reason);
    expect(text).not.toContain('17 seconds');
    expect(text).not.toMatch(/cost \d+ seconds/);

    // Every non-zero exclusion carries the identical constant, which is what makes "render
    // the first one" correct in the view rather than a lucky guess.
    const reasons = new Set(reports.filter((r) => r.excluded.count > 0).map((r) => r.excluded.reason));
    expect(reasons.size).toBe(1);
  });

  // COULD-NOT-LOOK MUST NOT RENDER AS CLEAN. Defect 2 of the conflicts collector, checked at
  // the pixel rather than at the payload — the collector returning `readable: false` is worth
  // nothing if the view draws it the same as a clean worktree.
  test('an unreadable worktree renders as could-not-look, with its reason, and is not counted clean', () => {
    const report: ConflictReport = {
      project: 'ashcroft',
      worktrees: [
        { path: '/x/.worktrees/ceo-1-100', branch: 'ceo-1-100', changedFiles: ['a.ts'] },
        {
          path: '/x/.worktrees/ceo-2-200',
          branch: 'ceo-2-200',
          changedFiles: [],
          readable: false,
          reason: 'git status --porcelain exited 128 in /x/.worktrees/ceo-2-200 (fatal: error opening .git)',
        },
      ],
      conflicts: [],
      excluded: { count: 0, reason: 'none' },
      enumerated: { readable: true },
    };
    const html = renderToStaticMarkup(
      <ConflictsView reports={[report]} loading={false} error={null} onRefresh={() => {}} />
    );
    const text = textOf(html);

    // THE SECTION LABEL, capitalised — not the lowercase phrase. The footnote at the bottom
    // of this view ends with the sentence "…because “I could not look” and “there is nothing
    // here” are different answers", so a case-insensitive check for that phrase passes on
    // EVERY render including the clean one. Caught by the mirror assertion below going red:
    // the positive check was vacuous and the negative check is what proved it.
    expect(text).toContain('Could not look');
    expect(text).toContain('exited 128'); // the reason reaches the screen, not just the payload
    // Stated as a fraction of what was attempted, so the unreadable count and the swept
    // count on screen are visibly drawn from the same population.
    expect(text).toContain('1 of the 2 swept worktrees could not be read');
    expect(text).toContain('1 worktree read · 1 unreadable'); // and the project line agrees
    // The all-clear must NOT be printed while one worktree could not be read.
    expect(text).not.toContain('measured all-clear');

    // And the mirror: with both worktrees readable and no conflicts, the all-clear IS shown.
    const clean: ConflictReport = {
      ...report,
      worktrees: [{ path: '/x/.worktrees/ceo-1-100', branch: 'ceo-1-100', changedFiles: ['a.ts'] }],
    };
    const cleanText = textOf(
      renderToStaticMarkup(<ConflictsView reports={[clean]} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(cleanText).toContain('measured all-clear');
    expect(cleanText).not.toContain('Could not look');
    expect(cleanText).not.toContain('could not be read');
  });
});

// ── render parity — Belief ───────────────────────────────────────────────────────────

/**
 * A payload shaped exactly like the route's, with both bands populated.
 *
 * At module scope because the headline-band block at the bottom of this file renders Belief
 * too, and a second copy of this fixture would be a second thing to keep in step.
 */
function beliefPayload(waivers: Waiver[]): BeliefSummary {
    return {
      project: 'agentvibe',
      trust: { trusted: true, source: '/x/.warroom/trusted-projects' },
      fleet: { projectsDiscovered: 19, projectsWithLedgerIndex: 1 },
      ledger: { totalClaims: 35, pass: 64, wouldBlock: 6, block: 0, raw: '' },
      bands: [
        {
          scope: 'project',
          source: '/x/.claude/ledger/index.json',
          claims: {
            total: 31,
            byKind: { behavior: 20, 'internal-fact': 11 },
            byScope: { project: 31 },
            expiringWithin30Days: [
              {
                id: 'c-shadow-window-open',
                assert: 'the shadow window is open',
                kind: 'behavior',
                scope: 'project',
                verified_by: 'command',
                valid_until: '2026-09-08',
                source_file: 'docs/x.md',
                source_line: 12,
              },
            ],
          },
          verdicts: { pass: 57, wouldBlock: 5, block: 0 },
          waivers: { present: false, reason: 'Project-scope waivers are not in the built index: …' },
        },
        {
          scope: 'global',
          source: '/home/x/.warroom/ledger/global.yml',
          claims: {
            total: 4,
            byKind: { 'runtime-capability': 3, 'external-fact': 1 },
            byScope: { global: 4 },
            expiringWithin30Days: [
              {
                id: 'c-rolling-five-hour-window',
                assert: 'usage is governed by a rolling 5h window',
                kind: 'external-fact',
                scope: 'global',
                verified_by: 'judge',
                valid_until: '2026-09-08',
                source_file: '~/.warroom/ledger/global.yml',
                source_line: 0,
              },
            ],
          },
          verdicts: { pass: 7, wouldBlock: 1, block: 0 },
          waivers,
        },
      ],
    };
}

describe('render parity — Belief', () => {
  const NOW = Date.parse('2026-08-13T12:00:00Z');

  test('every band figure reverses to the payload, and the header is the computed N of M', () => {
    const payload = beliefPayload([
      { claimId: 'c-rolling-five-hour-window', until: '2026-09-08', reason: 'vendor fact', lapsed: false, days: 26 },
    ]);
    const html = renderToStaticMarkup(
      <BeliefView belief={payload} loading={false} error={null} now={NOW} onRefresh={() => {}} />
    );
    const text = textOf(html);

    // The coverage figure, both halves, from the collector's own computed pair.
    expect(text).toContain(
      `${payload.fleet.projectsWithLedgerIndex} of ${payload.fleet.projectsDiscovered}`
    );

    for (const band of payload.bands) {
      const verdicts = band.verdicts as VerdictCounts;
      const claims = band.claims as ClaimsSummary;
      // Verdict counts, reversed out of the rendered text.
      expect(text).toContain(`${verdicts.pass} pass`);
      expect(text).toContain(`${verdicts.wouldBlock} would_block`);
      expect(text).toContain(`${verdicts.block} block`);
      expect(text).toContain(`${claims.total} claims`);
      // Every expiring claim is on screen with its date — the four landing 2026-09-08 are
      // the whole reason this section exists.
      for (const c of claims.expiringWithin30Days) {
        expect(text).toContain(c.id);
        expect(text).toContain(c.valid_until!);
      }
    }
    // Both scopes are labelled, so a global claim cannot read as a repository detail.
    expect(text).toContain('Project scope');
    expect(text).toContain('Global scope');
  });

  test('expiring claims render in date order, soonest first', () => {
    const claims: LedgerClaim[] = [
      { id: 'c-later', assert: 'x', kind: 'behavior', scope: 'project', verified_by: 'command', valid_until: '2026-09-08', source_file: 'a.md', source_line: 1 },
      { id: 'c-sooner', assert: 'x', kind: 'behavior', scope: 'project', verified_by: 'command', valid_until: '2026-08-20', source_file: 'a.md', source_line: 2 },
    ];
    // summarizeClaims is what sorts; the table must not reorder behind it.
    const sorted = summarizeClaims(claims, NOW).expiringWithin30Days;
    const rows = bodyRows(renderToStaticMarkup(<ExpiringTable claims={sorted} now={NOW} />));
    expect(rows.map((r) => r[0])).toEqual(['c-sooner', 'c-later']);
    // 7, by the same floor rule resolvers.js's waiverState uses: the claim is live through
    // the end of 2026-08-20, so the deadline is 2026-08-21T00:00Z and 7.5 whole days remain
    // from noon on 2026-08-13. See daysUntil for why this is floor and not ceil.
    expect(asNumber(rows[0]![3]!)).toBe(7);
  });

  // A LAPSED WAIVER MUST BE VISUALLY DISTINCT FROM AN UNEXPIRED ONE — rule 9, and the
  // distinction is the entire point of the disposition mechanism. This machine has no lapsed
  // waiver today (the one live waiver runs to 2026-09-08 and c-runtime-nested-spawn was
  // Refreshed on 2026-08-13), so without this fixture the lapsed branch would ship having
  // never once been rendered. §0: an assertion inside a branch that never runs reads as
  // coverage and is not.
  test('a lapsed waiver renders differently from a live one, in words and not only in colour', () => {
    const live = renderToStaticMarkup(
      <WaiverList waivers={[{ claimId: 'c-live', until: '2026-09-08', reason: 'still in force', lapsed: false, days: 26 }]} />
    );
    const lapsed = renderToStaticMarkup(
      <WaiverList waivers={[{ claimId: 'c-lapsed', until: '2026-07-01', reason: 'nobody came back', lapsed: true, days: 43 }]} />
    );

    expect(textOf(live)).toContain('waived until 2026-09-08');
    expect(textOf(live)).toContain('26d left');
    expect(textOf(live)).not.toContain('LAPSED');

    // The lapsed one says so IN WORDS — a reader on a greyscale screenshot, or a screen
    // reader, gets the same signal a colour conveys.
    expect(textOf(lapsed)).toContain('WAIVER LAPSED');
    expect(textOf(lapsed)).toContain('43d ago');
    expect(textOf(lapsed)).toContain('worse than no disposition');

    // …and it is ALSO encoded structurally, not only in the sentence: the two render
    // different markup, so the distinction survives a reader who is skimming.
    expect(lapsed).toContain('border-l-bad');
    expect(live).not.toContain('border-l-bad');
  });

  test('an absent global ledger states why, and never renders as an empty band', () => {
    const payload = beliefPayload([]);
    const reason =
      '/home/x/.warroom/ledger/global.yml does not exist on this machine, so no claim reaches every project here.';
    payload.bands[1]!.claims = { present: false, reason };
    payload.bands[1]!.waivers = { present: false, reason };
    payload.bands[1]!.verdicts = { present: false, reason };

    const text = textOf(
      renderToStaticMarkup(<BeliefView belief={payload} loading={false} error={null} now={NOW} onRefresh={() => {}} />)
    );
    expect(text).toContain('does not exist on this machine');
    // The empty-but-present wording must NOT appear — that is the sentence a genuinely empty
    // ledger gets, and absent must not borrow it.
    expect(text).not.toContain('No claim in this scope carries a waiver');
  });

  test('an empty-but-present waiver list says something different from an absent one', () => {
    // The other side of the same distinction, so neither wording can drift into the other.
    const text = textOf(renderToStaticMarkup(<WaiverList waivers={[]} />));
    expect(text).toContain('No claim in this scope carries a waiver');
    expect(text).not.toContain('does not exist');
  });

  // The heading promised "within 30 days" while the list has no lower bound, so the canary
  // (valid_until 2026-01-02, deliberately in the past) sat under it beside a cell reading
  // "expired 224d ago". The filter is correct and unchanged — an overdue claim is what a
  // reader needs most — so the heading is what had to say so.
  test('the expiry heading admits that the list includes already-expired claims', () => {
    const payload = beliefPayload([]);
    const overdue: LedgerClaim = {
      id: 'c-canary-unresolvable',
      assert: 'built to fail',
      kind: 'behavior',
      scope: 'project',
      verified_by: 'command',
      valid_until: '2026-01-02',
      source_file: 'docs/x.md',
      source_line: 1,
    };
    (payload.bands[0]!.claims as ClaimsSummary).expiringWithin30Days = summarizeClaims([overdue], NOW).expiringWithin30Days;
    expect((payload.bands[0]!.claims as ClaimsSummary).expiringWithin30Days).toHaveLength(1); // the premise

    const text = textOf(
      renderToStaticMarkup(<BeliefView belief={payload} loading={false} error={null} now={NOW} onRefresh={() => {}} />)
    );
    expect(text).toContain('Expired, or expiring within 30 days');
    expect(text).toMatch(/expired \d+d ago/); // the row states it too, in words not only colour
  });

  // Same shape as the Conflicts zero-swept all-clear: a band that holds no claims must not
  // report that nothing is expiring, and must not leave a dangling "0 claims ·" separator.
  test('a band with zero claims says so, instead of printing an all-clear over nothing', () => {
    const payload = beliefPayload([]);
    payload.bands[1]!.claims = { total: 0, byKind: {}, byScope: {}, expiringWithin30Days: [] };
    const text = textOf(
      renderToStaticMarkup(<BeliefView belief={payload} loading={false} error={null} now={NOW} onRefresh={() => {}} />)
    );
    expect(text).toContain('no claims in this scope');
    expect(text).not.toContain('0 claims ·');
    expect(text).not.toContain('0 claims were checked');
  });

  test('the pending state names what is running rather than showing a bare spinner', () => {
    const text = textOf(
      renderToStaticMarkup(<BeliefView belief={null} loading={true} error={null} now={NOW} onRefresh={() => {}} />)
    );
    expect(text).toContain('scripts/ledger.mjs verify');
    expect(text).toContain('ten seconds');
  });
});

// ── render parity — Project ──────────────────────────────────────────────────────────
describe('render parity — Project', () => {
  /**
   * A real /api/project/:id payload. `events` optionally points the project's `.warroom.yml`
   * at a state dir this test writes, which is how the events-found branch gets exercised:
   * `resolveEventsPath` reads that file per project, and the route re-discovers on every
   * request, so writing it after the state is constructed still takes effect.
   */
  async function projectPayload(
    prefix: string,
    events?: string[]
  ): Promise<{ payload: ProjectDetail; now: number; projectsRoot: string }> {
    const { app, now, projectsRoot } = buildFixtureState(prefix);
    if (events !== undefined) {
      const stateDir = mkTmpDir(`mc-views-events-${prefix}-`);
      cleanupDirs.push(stateDir);
      fs.writeFileSync(path.join(projectsRoot, 'ashcroft', '.warroom.yml'), `state_dir: ${stateDir}\n`);
      fs.writeFileSync(path.join(stateDir, 'events.jsonl'), `${events.join('\n')}\n`);
    }
    const res = await app.fetch(new Request('http://127.0.0.1/api/project/ashcroft'));
    expect(res.status).toBe(200);
    return { payload: (await res.json()) as ProjectDetail, now, projectsRoot };
  }

  test('every headline figure reverses to the /api/project payload, in order', async () => {
    const { payload, now } = await projectPayload('project-headline');
    const { stats } = payload.project;
    // Premises: the fixture really has sessions, real output, and a subagent share, so none
    // of the equalities below is 0 === 0.
    expect(stats.sessionCount).toBeGreaterThan(0);
    expect(stats.totalOutputTokens).toBeGreaterThan(0);
    expect(stats.totalSubagentOutputTokens).toBeGreaterThan(0);
    expect(stats.totalOutputTokens).not.toBe(stats.totalSubagentOutputTokens); // a swap is detectable

    const html = renderToStaticMarkup(
      <ProjectHeadline project={payload.project} now={now} loading={false} onRefresh={() => {}} />
    );
    const figures = figuresIn(html);
    // Document order: project · sessions · output tokens. Read POSITIONALLY, which is what
    // catches the swap a set-membership check would pass.
    expect(figures.map((f) => f.label)).toEqual(['Project', 'Sessions · all time', 'Output tokens · all time']);
    expect(figures[0]!.value).toBe(payload.project.id);
    expect(asNumber(figures[1]!.value)).toBe(stats.sessionCount);
    expect(asNumber(figures[2]!.value)).toBe(stats.totalOutputTokens);
    // The sub-line under the largest figure is the subagent split of that same figure — one
    // population, stated twice, so a reader can see the share is of what is above it.
    expect(numbersIn(figures[2]!.sub)).toEqual([
      stats.totalSubagentOutputTokens,
      Math.round((stats.totalSubagentOutputTokens / stats.totalOutputTokens) * 100),
    ]);
    // Last activity is the visible relative string, reversed with this file's own formatter.
    expect(stats.lastActivityAt).not.toBeNull();
    expect(figures[1]!.sub).toBe(`last activity ${expectedRelative(stats.lastActivityAt, now)}`);
    // The root is shown, home-collapsed, so two same-named projects under different roots are
    // distinguishable — the id alone does not identify a project on this screen.
    expect(figures[0]!.sub.replace(/^~/, '')).toBe(
      payload.project.root.replace(/^\/(?:Users|home)\/[^/]+/, '')
    );
  });

  test('MUTATION GATE: changing one stat changes the figure rendered', async () => {
    const { payload, now } = await projectPayload('project-mutation');
    const original = payload.project.stats.totalOutputTokens;
    const mutated: ProjectDetail = {
      ...payload,
      project: { ...payload.project, stats: { ...payload.project.stats, totalOutputTokens: original + 61_197 } },
    };
    const figureAt = (d: ProjectDetail) =>
      asNumber(
        figuresIn(
          renderToStaticMarkup(<ProjectHeadline project={d.project} now={now} loading={false} onRefresh={() => {}} />)
        )[2]!.value
      );
    expect(figureAt(payload)).toBe(original);
    expect(figureAt(mutated)).toBe(original + 61_197);
  });

  // THE PROBE'S THREE STATES AT THE PIXEL. `readable: false` is the state this PR added to
  // projectEmptyState — the 10 s bound firing on a 34 GB tree — and it is worth nothing if
  // the view draws it the same as a probe that finished and matched nothing.
  test('a probe that was cut off never renders as a completed empty state', async () => {
    const { payload } = await projectPayload('project-probe');
    // The real fixture probe RAN — small tmp tree, well inside the bound — so the
    // could-not-look strings below are absent from a genuine completed run, not merely from
    // a hand-written object.
    expect(payload.empty.readable).toBeUndefined();
    expect(payload.empty.found).toBe(false);

    const completed = textOf(renderToStaticMarkup(<ProjectStageProbe empty={payload.empty} />));
    expect(completed).toContain('ran to completion and matched nothing');
    expect(completed).toContain(payload.empty.probe); // the argv a reader can re-run
    expect(completed).not.toContain('could not look');

    const cutOff = textOf(
      renderToStaticMarkup(
        <ProjectStageProbe
          empty={{
            ...payload.empty,
            readable: false,
            reason: 'grep did not finish within 10000 ms and was killed — the tree was NOT fully searched.',
          }}
        />
      )
    );
    expect(cutOff).toContain('could not look');
    expect(cutOff).toContain('did not finish within 10000 ms'); // the reason reaches the screen
    expect(cutOff).toContain('not the same as nothing existing');
    expect(cutOff).not.toContain('ran to completion');

    // THE QUEUE'S STATE, which shares this branch and must not inherit a heading that claims
    // partial coverage. It looked at NONE of the tree, so "could not look at all of it" was
    // wrong for it in the one line a reader takes the panel from — and "in the part that was
    // searched" was wrong for it too, because there is no such part. Both now hold at any
    // coverage, including none, and the reason underneath is what says which.
    const neverStarted = textOf(
      renderToStaticMarkup(
        <ProjectStageProbe
          empty={{
            ...payload.empty,
            readable: false,
            reason: 'the probe never started: 2 probes were already running … so NO part of /x was searched.',
          }}
        />
      )
    );
    expect(neverStarted).toContain('could not look');
    expect(neverStarted).not.toContain('could not look at all of it'); // it looked at none of it
    expect(neverStarted).not.toContain('in the part that was searched');
    expect(neverStarted).toContain('NO part of /x was searched'); // the distinction, in the body
    expect(neverStarted).toContain('whatever this probe covered'); // true at zero coverage

    // And the third state: a marker found in the part that WAS searched is neither of the
    // above — it is a partial yes, and says so.
    const partial = textOf(
      renderToStaticMarkup(
        <ProjectStageProbe empty={{ ...payload.empty, found: true, readable: false, reason: 'stopped early' }} />
      )
    );
    expect(partial).toContain('the count below it is simply incomplete');
    expect(partial).not.toContain('not the same as nothing existing');
  });

  test('an absent event log states what would write it, and is never rendered as zero events', async () => {
    const { payload } = await projectPayload('project-no-events');
    expect(payload.project.events.found).toBe(false); // premise: ~/.ashcroft/ does not exist
    const text = textOf(renderToStaticMarkup(<ProjectEvents events={payload.project.events} />));
    expect(text).toContain('no event log');
    expect(text).toContain(payload.project.events.path); // where it would appear
    expect(text).toContain('NOT that both ran clean');
    expect(text).not.toContain('0 lines');
  });

  test('the event rows reverse to the payload, and unparseable lines are counted not dropped', async () => {
    const { payload } = await projectPayload('project-events', [
      JSON.stringify({ event: 'claim.would_block', claim: 'c-one' }),
      JSON.stringify({ event: 'claim.would_block', claim: 'c-two' }),
      JSON.stringify({ event: 'budget.block', reason: 'stall ceiling 999999 exceeded' }),
      '{ this line is not json',
      JSON.stringify({ event: 'session.start' }),
    ]);
    const events = payload.project.events;
    expect(events.found).toBe(true); // premise: the .warroom.yml redirect took effect
    expect(events.totalLines).toBe(5);
    expect(events.unparseableLines).toBe(1);

    const html = renderToStaticMarkup(<ProjectEvents events={events} />);
    const rows = bodyRows(html);
    // Every event kind in the payload has exactly one row, and no row exists that the
    // payload does not carry — a dropped kind and an invented one both fail here.
    expect(rows.map((cells) => cells[0])).toEqual(
      expect.arrayContaining(Object.keys(events.byEvent))
    );
    expect(rows).toHaveLength(Object.keys(events.byEvent).length);
    for (const [event, count] of Object.entries(events.byEvent)) {
      const row = rows.find((cells) => cells[0] === event);
      expect(row).toBeDefined();
      expect(asNumber(row![1]!)).toBe(count);
    }

    const text = textOf(html);
    expect(text).toContain(`${events.totalLines} lines`);
    expect(text).toContain(`${events.unparseableLines} unparseable`);
    // The budget-block split, and the word that keeps a fixture's own block out of the real
    // column: this reason cites a ceiling nothing is configured with, so it is synthetic.
    expect(events.budgetBlock.synthetic + events.budgetBlock.unknown).toBe(1);
    expect(events.budgetBlock.real).toBe(0);
    expect(text).toContain('0 real');
  });

  test('the pending state names what is running rather than showing a bare spinner', () => {
    const text = textOf(
      renderToStaticMarkup(
        <ProjectView detail={null} loading={true} error={null} now={Date.now()} onRefresh={() => {}} onBack={() => {}} />
      )
    );
    expect(text).toContain('recursive');
    // THE BOUND, FROM THE CONSTANT THE COLLECTOR ENFORCES. This assertion used to read
    // 'bounded at ten seconds' — a third spelling of one quantity, in the test that was
    // supposed to be watching the other two agree. Changing PROJECT_PROBE_TIMEOUT_MS now
    // fails here unless the view moved with it.
    expect(text).toContain(`bounded at ${PROJECT_PROBE_TIMEOUT_SECONDS} seconds`);
    expect(PROJECT_PROBE_TIMEOUT_SECONDS * 1000).toBe(PROJECT_PROBE_TIMEOUT_MS); // one quantity, two units
  });

  test('a project that vanished renders the error, not an empty project', () => {
    const text = textOf(
      renderToStaticMarkup(
        <ProjectView
          detail={null}
          loading={false}
          error='GET /api/project/gone failed: 404 Not Found'
          now={Date.now()}
          onRefresh={() => {}}
          onBack={() => {}}
        />
      )
    );
    expect(text).toContain('404 Not Found');
    expect(text).toContain('could not be read');
    expect(text).not.toContain('Run log');
  });

  // The route itself: an unknown id is a 404 with the id in it, not a 200 carrying an empty
  // project — the view above renders whichever of the two arrives.
  test('/api/project/:id 404s on an unknown id rather than inventing a project', async () => {
    const { app } = buildFixtureState('project-404');
    const res = await app.fetch(new Request('http://127.0.0.1/api/project/no-such-project'));
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('no-such-project');
  });
});

/**
 * Real `inboxEmptyState` output against a home directory this test builds — three rows in
 * the three states the collector can return. At module scope, and taking `homeDir` rather
 * than reading `os.homedir()`, because the headline block at the bottom of this file needs
 * the same rows and a test that renders markup should not depend on whose machine it is on.
 */
function inboxRows(prefix: string): InboxProject[] {
  const home = mkTmpDir(`mc-views-inbox-${prefix}-`);
  cleanupDirs.push(home);

  // waiting: a real message file in a real directory
  fs.mkdirSync(path.join(home, '.ashcroft', 'messages'), { recursive: true });
  fs.writeFileSync(path.join(home, '.ashcroft', 'messages', 'approval-1.json'), '{}');
  // could not look: a plain file where the directory belongs → ENOTDIR
  fs.mkdirSync(path.join(home, '.brackish'), { recursive: true });
  fs.writeFileSync(path.join(home, '.brackish', 'messages'), 'not a directory\n');
  // none: nothing at all, which for this feature is the honest empty answer

  return ['ashcroft', 'brackish', 'tessellate'].map((id) => ({
    project: id,
    ...inboxEmptyState({ id } as Project, home),
  }));
}

// ── render parity — Inbox ────────────────────────────────────────────────────────────
//
// THE VACUITY TRAP THIS BLOCK IS BUILT AROUND: the view's footnote ends with the sentence
// "A row reading could not look is neither", so `textOf(html)).toContain('could not look')`
// passes on EVERY render including the all-clear. PR4 shipped exactly that assertion in the
// Conflicts block and it took a mirror assertion to expose it. So the row states here are
// read out of the table body with bodyRows(), never out of the page text.
describe('render parity — Inbox', () => {
  test('one row per discovered project, and the headline counts the same array', async () => {
    const { app } = buildFixtureState('inbox-route');
    const res = await app.fetch(new Request('http://127.0.0.1/api/inbox'));
    expect(res.status).toBe(200);
    const payload = (await res.json()) as InboxPayload;
    expect(payload.projects.length).toBeGreaterThan(0); // premise: something was discovered

    const totals = inboxTotals(payload.projects);
    expect(totals.projects).toBe(payload.projects.length);

    const rows = bodyRows(renderToStaticMarkup(<InboxTable projects={payload.projects} />));
    expect(rows).toHaveLength(payload.projects.length); // nothing silently dropped
    expect(rows.map((cells) => cells[0]).sort()).toEqual(payload.projects.map((p) => p.project).sort());

    const headline = figuresIn(
      renderToStaticMarkup(<InboxHeadline totals={totals} loading={false} onRefresh={() => {}} />)
    );
    // Numerator in the value, denominator in the sub beneath it — one array, counted once.
    expect(asNumber(headline[0]!.value)).toBe(totals.withMessages);
    expect(numbersIn(headline[0]!.sub)).toEqual([totals.projects]);
  });

  test('a directory that could not be read is not counted as an empty inbox', () => {
    const projects = inboxRows('unreadable');
    const totals = inboxTotals(projects);
    // Premises: all three states are really present, so nothing below is vacuous.
    expect(totals.projects).toBe(3);
    expect(totals.withMessages).toBe(1);
    expect(totals.unreadable).toBe(1);

    const html = renderToStaticMarkup(<InboxView projects={projects} loading={false} error={null} onRefresh={() => {}} />);
    // ROW CELLS, not page text — see the block comment above.
    const messagesCells = bodyRows(html).map((cells) => cells[1]);
    expect(messagesCells.filter((c) => c === 'could not look')).toHaveLength(1);
    expect(messagesCells.filter((c) => c === 'waiting')).toHaveLength(1);
    expect(messagesCells.filter((c) => c === 'none')).toHaveLength(1);

    const text = textOf(html);
    expect(text).toContain('1 could not be read'); // the headline says so too
    expect(text).not.toContain('measured all-clear'); // and no all-clear is printed over it

    // THE MIRROR. With the unreadable project dropped, no row reads could-not-look — which is
    // what proves the assertion above is reading the row and not the footnote.
    const cleanCells = bodyRows(
      renderToStaticMarkup(
        <InboxView projects={projects.filter((p) => p.readable !== false)} loading={false} error={null} onRefresh={() => {}} />
      )
    ).map((cells) => cells[1]);
    expect(cleanCells).not.toContain('could not look');
  });

  // THE REASON MUST BE REACHABLE WITHOUT A POINTER. It was a bare `<span title>`: no tab
  // stop, no aria-label, so a keyboard reader got the words "could not look" and no way to
  // learn why — while every sibling could-not-look in this codebase uses `Unavailable`, which
  // exists to satisfy exactly that rule (ui.tsx).
  test('an unreadable row states its reason to a keyboard reader, not only to a hover', () => {
    const projects = inboxRows('a11y');
    const unreadable = projects.find((p) => p.readable === false)!;
    expect(unreadable).toBeDefined(); // premise
    expect(unreadable.reason).toBeTruthy();

    const html = renderToStaticMarkup(<InboxTable projects={projects} />);
    const rowIndex = projects.findIndex((p) => p.readable === false);
    const labels = rowLabels(html, rowIndex);
    expect(labels.some((l) => l.includes(unreadable.reason!))).toBe(true);
    expect(labels.some((l) => l.startsWith('could not look:'))).toBe(true);
    // …and it is focusable, which a title attribute is not.
    expect(html).toContain('tabindex="0"');

    // THE MIRROR: a readable row has no such marker, so the assertions above are reading the
    // unreadable branch rather than something every row carries.
    const readableIndex = projects.findIndex((p) => p.readable !== false);
    expect(rowLabels(html, readableIndex)).toHaveLength(0);
  });

  // A TABLE OF NOTHING IS NOT AN EMPTY STATE. Fleet and Sessions render the empty state
  // INSTEAD of the table; this rendered "Nothing was checked." above three column labels and
  // no rows, which reads as a table that failed to load rather than a question not asked.
  test('with nothing discovered there is no table, only the reason there is none', () => {
    const html = renderToStaticMarkup(<InboxView projects={[]} loading={false} error={null} onRefresh={() => {}} />);
    expect(textOf(html)).toContain('Nothing was checked');
    expect(html).not.toContain('<table'); // no header row over an empty body
    expect(textOf(html)).not.toContain('Probe'); // nor the column labels on their own

    // THE MIRROR: with projects, the table IS rendered — so the assertion above is about the
    // empty case and not about a table this view never draws.
    const withRows = renderToStaticMarkup(
      <InboxView projects={inboxRows('has-rows')} loading={false} error={null} onRefresh={() => {}} />
    );
    expect(withRows).toContain('<table');
    expect(bodyRows(withRows).length).toBeGreaterThan(0);
  });

  // THE THIRD CASE OF THE ALL-CLEAR HAD NO SENTENCE. Nothing waiting, but something
  // unreadable: neither empty-state branch fires, so the only trace of "we could not check
  // everything" was an 11px sub-line — while Conflicts gives the same fact a bordered band.
  test('nothing waiting but something unreadable gets a stated summary, not just a sub-line', () => {
    const projects = inboxRows('quiet-but-blind').filter((p) => !p.found);
    const totals = inboxTotals(projects);
    // Premises: this is exactly the state that fell between the two branches.
    expect(totals.withMessages).toBe(0);
    expect(totals.unreadable).toBe(1);
    expect(totals.projects).toBeGreaterThan(1);

    const text = textOf(
      renderToStaticMarkup(<InboxView projects={projects} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(text).toContain(`${totals.unreadable} of ${totals.projects} projects could not be checked`);
    expect(text).toContain('NOT an all-clear for your inbox');
    expect(text).toContain(`${totals.projects - totals.unreadable} that were read`);
    // And the measured all-clear must NOT be claimed over it.
    expect(text).not.toContain('measured all-clear');
    expect(text).not.toContain('No project has a message waiting');

    // THE MIRROR: with every directory readable, that band is absent and the all-clear is the
    // one that speaks.
    const allRead = textOf(
      renderToStaticMarkup(
        <InboxView projects={projects.filter((p) => p.readable !== false)} loading={false} error={null} onRefresh={() => {}} />
      )
    );
    expect(allRead).not.toContain('could not be checked');
    expect(allRead).toContain('measured all-clear');
  });

  test('the all-clear is printed only when every directory was actually read', () => {
    const projects = inboxRows('allclear').filter((p) => p.readable !== false && !p.found);
    expect(projects.length).toBeGreaterThan(0); // premise
    expect(inboxTotals(projects)).toEqual({ projects: projects.length, withMessages: 0, unreadable: 0 });

    const text = textOf(
      renderToStaticMarkup(<InboxView projects={projects} loading={false} error={null} onRefresh={() => {}} />)
    );
    expect(text).toContain('measured all-clear');
    expect(text).toContain('Nothing in this repository writes into those directories yet');
    expect(text).not.toContain('Nothing was checked');
  });

  // ZERO PROJECTS IS NOT ZERO MESSAGES. The same distinction the Conflicts sweep draws, in
  // the view where it is likeliest to be reached: one mis-set MC_PROJECT_ROOTS away.
  test('no projects discovered renders as nothing-checked, never as an empty inbox', () => {
    expect(inboxTotals([]).projects).toBe(0); // premise
    const text = textOf(renderToStaticMarkup(<InboxView projects={[]} loading={false} error={null} onRefresh={() => {}} />));
    expect(text).toContain('Nothing was checked');
    expect(text).toContain('MC_PROJECT_ROOTS');
    expect(text).not.toContain('measured all-clear');
    expect(text).not.toContain('No project has a message waiting');
  });

  test('a project with a message waiting is called out, and the all-clear is withheld', () => {
    const projects = inboxRows('waiting').filter((p) => p.readable !== false);
    const totals = inboxTotals(projects);
    expect(totals.withMessages).toBe(1); // premise
    const html = renderToStaticMarkup(<InboxView projects={projects} loading={false} error={null} onRefresh={() => {}} />);
    const figure = figuresIn(
      renderToStaticMarkup(<InboxHeadline totals={totals} loading={false} onRefresh={() => {}} />)
    )[0]!;
    expect(asNumber(figure.value)).toBe(totals.withMessages);
    expect(numbersIn(figure.sub)).toEqual([totals.projects]);
    const text = textOf(html);
    expect(text).not.toContain('measured all-clear');
    expect(text).not.toContain('Nothing was checked');
    // The probe column carries the literal glob for the project that has one.
    const waitingRow = bodyRows(html).find((cells) => cells[1] === 'waiting')!;
    expect(waitingRow).toBeDefined();
    expect(waitingRow[2]).toBe(projects.find((p) => p.found)!.probe);
  });
});

// ── the app bar's freshness, and the registry field that selects it (#39) ────────────
//
// D4 split "when the data arrived" from "when the attempt gave up" and NOTHING referenced
// Freshness, FetchedBadge, loadedAt or `stream:` in any test — so flipping `stream: false` to
// `true` on Belief restored the original defect (a live-stream age displayed above figures
// fetched once at mount) with the suite green.
//
// A DELIBERATE DECISION ABOUT DOM, AND AN HONEST ACCOUNTING OF WHAT IT COSTS. These tests
// add no jsdom/happy-dom dependency. App.tsx exports the registry, the badge, `badgeFor`,
// `AppBar` and `StreamNotices` instead, so every pure part of the shell is reachable from
// renderToStaticMarkup and is rendered below.
//
// THE FIRST VERSION OF THIS PARAGRAPH SAID the gap was "one line of JSX". It was 91 lines:
// App.tsx measured 135/226, with the whole of `App()` unexecuted, and the trade was accepted
// on that wrong number. What is reachable has since been pulled out and IS covered — the nav
// filter, the breadcrumb, the badge selection, both notices and the shell's first paint.
//
// WHAT REMAINS UNREACHABLE WITHOUT A DOM — and the honest sentence is not the percentage.
//
// App.tsx measures 215/217 lines, uncovered [403, 404]. That number is exact and it CERTIFIES
// MORE THAN IT MEASURES: line coverage marks a line hit when the HOOK CALL runs, not when the
// callback it was handed runs. Three one-line callback bodies sit inside the 99.08% and every
// one of them mutates green:
//
//   397  useEffect(() => setFreshness(null), [tab])   delete it — stale freshness carries
//                                                     across tabs, the rule D4 exists for
//   405  setTab('project')                            drill-down never opens the tab
//   407  openTab                                      Back becomes a no-op
//
// (405 is inside `openProject`'s body, so that body is 403-405, not 403-404 as an earlier
// version of this comment said.)
//
// So: 99.08% of lines, AND EVERY CALLBACK BODY IN THE COMPONENT IS UNEXECUTED — the number
// counts the hook calls that create them. `renderToStaticMarkup` renders once and fires no
// effect, so every state TRANSITION is out of reach, and that is the whole of the gap.
//
// The decision not to add a DOM stands: a shim renders differently from a browser and parity
// with what ships is the point of this file. What does not stand is quoting a coverage
// percentage as though it settled the question — that is a green check over an untested
// capability, which is the entry already in DECISIONS.md under my own name.
describe('the app bar says where the figures on screen came from', () => {
  const NOW = Date.parse('2026-08-14T12:00:00Z');
  const EMPTY_STREAM: StreamState = { fleet: null, sessions: null, connection: 'connecting', lastEventAt: null };

  function renderEntry(view: ViewDef, stream: StreamState): string {
    return renderToStaticMarkup(
      <>
        {view.render({
          stream,
          now: NOW, // FIXED, so a relative timestamp can never be the difference detected below
          onFreshness: () => {},
          openProject: () => {},
          projectId: 'ashcroft',
          openTab: () => {},
        })}
      </>
    );
  }

  /**
   * Whether a view's own output actually moves when the stream slice does — measured by
   * rendering it twice, NOT read off the `stream:` field it is being compared against. That
   * independence is the whole point: the flag is config, this is behaviour.
   */
  async function respondsToStream(): Promise<Map<string, boolean>> {
    const { app } = buildFixtureState('app-bar');
    const fleet = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const sessions = (await (await app.fetch(new Request('http://127.0.0.1/api/sessions'))).json()) as SessionsSlice;
    expect(fleet.projects.length).toBeGreaterThan(0); // premise: the two slices differ from null
    expect(sessions.sessions.length).toBeGreaterThan(0);
    const full: StreamState = { fleet, sessions, connection: 'live', lastEventAt: NOW - 6_000 };

    return new Map(VIEWS.map((v) => [v.id, renderEntry(v, EMPTY_STREAM) !== renderEntry(v, full)]));
  }

  test('`stream:` is true for exactly the views whose output changes when the stream does', async () => {
    const responds = await respondsToStream();
    // NON-VACUITY: the biconditional below is satisfiable by "nothing ever responds", so both
    // sides must actually occur in this run.
    expect([...responds.values()].filter(Boolean).length).toBeGreaterThan(0);
    expect([...responds.values()].filter((r) => !r).length).toBeGreaterThan(0);

    for (const view of VIEWS) {
      expect({ id: view.id, stream: view.stream }).toEqual({ id: view.id, stream: responds.get(view.id)! });
    }
  });

  test('the badge follows that field: a fetched view never shows the stream’s age', async () => {
    const responds = await respondsToStream();
    const freshness: Freshness = { loadedAt: NOW - 90_000, failedAt: null, loading: false };
    const stream: StreamState = { fleet: null, sessions: null, connection: 'live', lastEventAt: NOW - 6_000 };

    for (const view of VIEWS) {
      const text = textOf(renderToStaticMarkup(<>{badgeFor(view, { stream, freshness, now: NOW })}</>));
      if (responds.get(view.id)) {
        // A stream view reports the SUBSCRIPTION's age — 6s — because that is what its
        // figures are.
        expect(text).toBe(`live · updated ${expectedRelative(stream.lastEventAt, NOW)}`);
      } else {
        // A fetched view reports ITS OWN fetch's age — 2m — and must never claim the
        // stream's, which is the exact wording #39 was filed about.
        expect(text).toBe(`fetched · ${expectedRelative(freshness.loadedAt, NOW)}`);
        expect(text).not.toContain('updated');
        expect(text).not.toContain('live');
      }
    }
  });

  // THE SHELL, rendered. The bar's nav filter, the breadcrumb for a non-nav view and the
  // gating on both notices are all inside the app shell, and nothing rendered it: App.tsx was
  // 135/226 lines covered with the whole of `App()` — 91 lines — unexecuted. Splitting the
  // pure parts out is what makes them reachable without a DOM.
  test('the bar names the view you are actually on, tab or not', async () => {
    const { app } = buildFixtureState('app-bar-shell');
    const fleet = (await (await app.fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
    const stream: StreamState = { fleet, sessions: null, connection: 'live', lastEventAt: NOW - 6_000 };
    const bar = (active: ViewDef, projectId: string | null) =>
      renderToStaticMarkup(
        <AppBar
          active={active}
          tab={active.id}
          projectId={projectId}
          stream={stream}
          freshness={null}
          now={NOW}
          onSelect={() => {}}
        />
      );

    const navViews = VIEWS.filter((v) => v.nav);
    const hidden = VIEWS.filter((v) => !v.nav);
    // Premises: the registry really does hold both kinds, so neither branch below is vacuous.
    expect(navViews.length).toBeGreaterThan(1);
    expect(hidden.length).toBeGreaterThan(0);

    // A NAV VIEW: one button per nav entry, none for the hidden ones, and the active one is
    // the only `aria-current`.
    const fleetHtml = bar(VIEWS[0], null);
    const buttons = [...fleetHtml.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => textOf(m[0]));
    expect(buttons).toEqual(navViews.map((v) => v.label));
    for (const h of hidden) expect(buttons).not.toContain(h.label);
    expect((fleetHtml.match(/aria-current="page"/g) ?? []).length).toBe(1);

    // A NON-NAV VIEW: it gets no button, and the bar says where you are anyway — with the
    // project it is showing. Without this the bar claimed you were on Fleet while Project
    // filled the screen.
    const project = hidden[0]!;
    const projectHtml = bar(project, 'ashcroft');
    const projectButtons = [...projectHtml.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((m) => textOf(m[0]));
    expect(projectButtons).toEqual(navViews.map((v) => v.label)); // still no button of its own
    expect(projectHtml).not.toContain('aria-current'); // and no nav tab claims to be current
    expect(textOf(projectHtml)).toContain(`/ ${project.label} ashcroft`);
    // The breadcrumb is absent on a nav view, which is what makes the line above about the
    // hidden branch rather than about something the bar always draws.
    expect(textOf(fleetHtml)).not.toContain(`/ ${project.label}`);
  });

  test('the stream notices never appear over a view that fetched its own bytes', async () => {
    const streamView = VIEWS.find((v) => v.stream)!;
    const fetchedView = VIEWS.find((v) => !v.stream)!;
    const cold: StreamState = { fleet: null, sessions: null, connection: 'connecting', lastEventAt: null };
    const dead: StreamState = { fleet: null, sessions: null, connection: 'failed', lastEventAt: null };
    const notices = (active: ViewDef, stream: StreamState) =>
      textOf(renderToStaticMarkup(<StreamNotices active={active} stream={stream} />));

    // On a stream view both notices are facts about what is on screen.
    expect(notices(streamView, cold)).toContain('Building the session index');
    expect(notices(streamView, dead)).toContain('The live stream is closed');

    // On a fetched view neither is — "Everything below is the last state received" is simply
    // false above a panel that fetched a moment ago. Same stream states, no notice.
    expect(notices(fetchedView, cold)).toBe('');
    expect(notices(fetchedView, dead)).toBe('');
  });

  test('the shell renders, and its default tab is a stream view with the stream badge', () => {
    // renderToStaticMarkup runs the component; effects do not fire, so the stream is at its
    // initial state and no fetch is issued — which is exactly the first paint a reader sees.
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('Mission Control');
    expect(textOf(html)).toContain('connecting'); // the stream badge, not the fetched one
    expect(textOf(html)).not.toContain('fetched');
    expect(textOf(html)).toContain('Building the session index'); // the cold-start notice
    expect((html.match(/aria-current="page"/g) ?? []).length).toBe(1);
  });

  // THE PRODUCER, which nothing reached. `useEndpoint`'s fetch effect — every line of it —
  // was uncovered, so the code that COMPUTES the freshness this bar renders was invertible
  // underneath seven consumer-side assertions. Three mutations restored #39 with the suite
  // green, one of them the original defect verbatim. Third PR running in which a rendered
  // fact was pinned and its producer was free; the fix that worked the last two times is the
  // same one — make the decision a pure function of what came in.
  test('the stamps a settled request produces are the ones the badge needs', () => {
    const loaded: EndpointState<string> = {
      data: 'first',
      error: null,
      loading: false,
      loadedAt: NOW - 300_000,
      failedAt: null,
    };

    // A SUCCESS stamps arrival and CLEARS any earlier failure — otherwise "could not fetch"
    // hangs over data that arrived after it.
    const recovered = requestSettled({ ...loaded, failedAt: NOW - 60_000 }, { ok: true, payload: 'second' }, NOW);
    expect(recovered).toEqual({ data: 'second', error: null, loading: false, loadedAt: NOW, failedAt: null });

    // A FAILURE stamps the attempt and LEAVES the arrival, because the figures on screen
    // really did arrive when they say they did — it is the refresh that failed. Stamping
    // `loadedAt` here is #39 verbatim.
    const failed = requestSettled(loaded, { ok: false, message: 'GET /api/belief failed: 500' }, NOW);
    expect(failed).toEqual({
      data: 'first', // the panel below is still showing it
      error: 'GET /api/belief failed: 500',
      loading: false,
      loadedAt: NOW - 300_000, // untouched
      failedAt: NOW,
    });

    // FIRST-LOAD FAILURE: nothing ever arrived, so `loadedAt` stays null — which is what
    // makes the bar say "fetch failed" instead of the resting word with no timestamp.
    const firstLoadFailed = requestSettled(initialEndpointState<string>(), { ok: false, message: 'x' }, NOW);
    expect(firstLoadFailed.loadedAt).toBeNull();
    expect(firstLoadFailed.failedAt).toBe(NOW);

    // A REQUEST BEGINNING keeps what is on screen — clearing it would blank the view on every
    // refresh — and clears only the error it is retrying.
    expect(requestBegan(failed)).toEqual({ ...failed, loading: true, error: null });

    // PRODUCER AND CONSUMER IN ONE ASSERTION, which is what neither side had: the badge reads
    // each produced state the way that state says.
    const badge = (s: EndpointState<string>) =>
      textOf(renderToStaticMarkup(<FetchedBadge freshness={{ ...s, loading: false }} now={NOW} />));
    expect(badge(failed)).toContain('stale · refresh failed');
    expect(badge(firstLoadFailed)).toContain('fetch failed');
    expect(badge(recovered)).toBe(`fetched · ${expectedRelative(NOW, NOW)}`);
  });

  test('the failure message names the route, so five views are distinguishable', () => {
    expect(failureMessage('/api/belief', new Error('500 Internal Server Error'))).toBe(
      'GET /api/belief failed: 500 Internal Server Error'
    );
    // A non-Error rejection still names the route rather than rendering "[object Object]".
    expect(failureMessage('/api/inbox', { nope: true })).toBe('GET /api/inbox failed');
  });

  test('a failed fetch never reads as a fetch', () => {
    const states: { name: string; freshness: Freshness | null }[] = [
      { name: 'first load', freshness: { loadedAt: null, failedAt: null, loading: true } },
      { name: 'failed, no data', freshness: { loadedAt: null, failedAt: NOW - 5_000, loading: false } },
      { name: 'fetched', freshness: { loadedAt: NOW - 5_000, failedAt: null, loading: false } },
      { name: 'stale after a failed refresh', freshness: { loadedAt: NOW - 300_000, failedAt: NOW - 5_000, loading: false } },
      { name: 'refreshing', freshness: { loadedAt: NOW - 300_000, failedAt: null, loading: true } },
    ];
    const rendered = states.map((s) => ({
      name: s.name,
      text: textOf(renderToStaticMarkup(<FetchedBadge freshness={s.freshness} now={NOW} />)),
    }));
    const by = (name: string) => rendered.find((r) => r.name === name)!.text;

    // THE DEFECT: `loadedAt` null with `loading` false rendered the resting word "fetched"
    // and no timestamp, directly above the panel explaining the failure.
    expect(by('failed, no data')).toBe(`fetch failed · ${expectedRelative(NOW - 5_000, NOW)}`);
    expect(by('failed, no data')).not.toContain('fetched');

    expect(by('fetched')).toBe(`fetched · ${expectedRelative(NOW - 5_000, NOW)}`);
    expect(by('stale after a failed refresh')).toContain('stale · refresh failed');
    expect(by('stale after a failed refresh')).toContain(expectedRelative(NOW - 300_000, NOW));
    expect(by('first load')).toBe('loading');
    expect(by('refreshing')).toContain('refreshing');

    // FIVE INPUTS, FIVE DISTINCT READINGS. Any collapse — the state machine folding two of
    // these together — fails here rather than shipping a badge that is right four times out
    // of five.
    expect(new Set(rendered.map((r) => r.text)).size).toBe(rendered.length);

    // And with nothing reported at all, the bar does not assert a fetch happened.
    expect(textOf(renderToStaticMarkup(<FetchedBadge freshness={null} now={NOW} />))).toBe('loading');
  });
});

// ── one headline band, and every figure in it says where it came from (#40) ──────────
//
// D7/D8. Belief and Conflicts hand-rolled the same three elements HeadlineBar renders, with
// `py-3` and no divider against Fleet's `py-1` — ~8 px taller, so switching tabs moved
// everything below the bar and read as a page reload. And none of the new figures carried a
// provenance `title`, while every Fleet figure did, so the largest numbers on three of five
// screens were the only ones a reader could not ask "counted how, over what?" of.
//
// Neither is checkable by rendering one view: both are statements about all of them.
//
// AND NEITHER IS CHECKABLE BY ASKING THE MACHINE. The first version of this block took its
// fleet payload from `/api/fleet`, which shells out to `warroom-install.mjs fleet` and reads
// the real `~/bin` — so on this laptop the drift figure rendered its measured branch and on a
// CI runner with no ~/bin it rendered "not compared", and the assertion below was written
// against whichever one the author happened to have. It went red on the runner, correctly.
//
// This test needs no machine data: it renders components and reads their markup. So it names
// its states — all four launcher states, including the runner's — and renders each.
describe('every view uses the one headline band, and titles its figures', () => {
  const NOW = Date.parse('2026-08-14T12:00:00Z');

  /** HeadlineBar's own opening tag, taken from the component — never written out here. */
  const BAND_TAG = /^<div[^>]*>/.exec(
    renderToStaticMarkup(
      <HeadlineBar>
        <span />
      </HeadlineBar>
    )
  )![0];

  /**
   * Every headline, in every state its figures take shape in — from fixtures, never from
   * this machine. The four fleet entries are the four `ModalGeneration` kinds, and the kind
   * each one produced is asserted, so a state silently collapsing into another (which is how
   * this test could quietly stop covering the runner's case) fails rather than passes.
   */
  async function everyHeadlineState(): Promise<{ state: string; html: string }[]> {
    const { app, now } = buildFixtureState('headline-band');
    const json = async (url: string) => (await app.fetch(new Request(`http://127.0.0.1${url}`))).json();
    const project = (await json('/api/project/ashcroft')) as ProjectDetail;
    const conflicts = ((await json('/api/conflicts')) as { reports: ConflictReport[] }).reports;
    expect(conflicts.length).toBeGreaterThan(0); // premise: a real sweep, not an empty one

    const fleets = {
      modal: fleetWithLaunchers('band-modal'),
      // THE CI RUNNER'S STATE: `warroom-install.mjs fleet` lists nothing at all.
      'no launchers': fleetWithLaunchers('band-none', []),
      tie: fleetWithLaunchers('band-tie', [
        { name: 'quarry', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'in scope' },
        { name: 'lodestar', lines: 2769, fns: 47, gen: 'c146d297', scope: 'in scope' },
      ]),
      'all excluded': fleetWithLaunchers('band-excluded', [
        { name: 'quarry', lines: 2741, fns: 47, gen: 'a86770a9', scope: 'excluded' },
        { name: 'brackish', lines: 2407, fns: 45, gen: '30e0c7aa', scope: 'excluded' },
      ]),
    };
    // The four states really are four different kinds — asserted, not assumed.
    expect(Object.values(fleets).map((f) => f.modalGeneration.kind)).toEqual([
      'modal',
      'no-launchers',
      'tie',
      'none-in-scope',
    ]);

    // A project with nothing recorded — the runner's transcript corpus, and the state whose
    // subagent share has no denominator to be a share of.
    const emptyProject: ProjectDetail['project'] = {
      ...project.project,
      stats: { ...project.project.stats, totalOutputTokens: 0, totalSubagentOutputTokens: 0, lastActivityAt: null },
    };
    expect(project.project.stats.totalOutputTokens).toBeGreaterThan(0); // and its opposite

    const inbox = inboxRows('band');

    return [
      ...Object.entries(fleets).map(([state, fleet]) => ({
        state: `fleet · ${state}`,
        html: renderToStaticMarkup(<FleetHeadline fleet={fleet} />),
      })),
      {
        state: 'project · with transcripts',
        html: renderToStaticMarkup(
          <ProjectHeadline project={project.project} now={now} loading={false} onRefresh={() => {}} />
        ),
      },
      {
        state: 'project · nothing recorded',
        html: renderToStaticMarkup(
          <ProjectHeadline project={emptyProject} now={now} loading={false} onRefresh={() => {}} />
        ),
      },
      {
        state: 'inbox · one waiting, one unreadable',
        html: renderToStaticMarkup(<InboxHeadline totals={inboxTotals(inbox)} loading={false} onRefresh={() => {}} />),
      },
      {
        state: 'inbox · nothing discovered',
        html: renderToStaticMarkup(<InboxHeadline totals={inboxTotals([])} loading={false} onRefresh={() => {}} />),
      },
      {
        state: 'belief',
        html: renderToStaticMarkup(
          <BeliefView belief={beliefPayload([])} loading={false} error={null} now={NOW} onRefresh={() => {}} />
        ),
      },
      {
        state: 'conflicts',
        html: renderToStaticMarkup(
          <ConflictsView reports={conflicts} loading={false} error={null} onRefresh={() => {}} />
        ),
      },
    ];
  }

  test('the band is HeadlineBar on every view — no view rolls its own', async () => {
    const states = await everyHeadlineState();
    expect(states.length).toBeGreaterThan(1); // the claim is about more than one screen

    for (const { state, html } of states) {
      const bands = html.split(BAND_TAG).length - 1;
      // EXACTLY ONE. Zero means a hand-rolled band; two means a second band was added beside
      // it, which is the same 8 px problem with an extra step.
      expect({ state, bands }).toEqual({ state, bands: 1 });
      // …and the figures are INSIDE it. A hand-rolled row above a real HeadlineBar would
      // satisfy the count above and still shift the page.
      expect({ state, figureBeforeBand: html.indexOf('<div class="label">') < html.indexOf(BAND_TAG) }).toEqual({
        state,
        figureBeforeBand: false,
      });
    }
  });

  // ONE RULE, TWO SHAPES, ASSERTED SEPARATELY. A measured figure states its provenance in
  // `Figure`'s own `title`, on the value div. A figure that COULD NOT be measured states it
  // on the `<Unavailable>` that replaces the value — where it also gets a tab stop and an
  // aria-label, which the div title does not have. Asserting the div title over both states
  // is what turned this red on CI, and duplicating the sentence onto the div to satisfy it
  // would put one explanation in two places.
  test('every headline figure states its provenance, wherever that figure keeps it', async () => {
    const states = await everyHeadlineState();
    let measured = 0;
    let notCompared = 0;

    for (const { state, html } of states) {
      const figures = figuresIn(html);
      expect({ state, figures: figures.length > 0 }).toEqual({ state, figures: true });
      for (const figure of figures) {
        const where = { state, label: figure.label };
        // NOT "has a title" — a title reading "Sessions" is a tooltip that answers nothing.
        // What a reader needs is the population and the method, which does not fit in a
        // label-length string.
        expect({ ...where, stated: figure.provenance.length >= 40 }).toEqual({ ...where, stated: true });
        expect(figure.provenance).not.toBe(figure.label);

        if (figure.unavailable) {
          // The sentence must be the one on the value, and it must also be announced: a
          // `title` attribute is not read out, and this is the state where the figure IS the
          // explanation.
          expect({ ...where, onTheDiv: figure.title }).toEqual({ ...where, onTheDiv: '' });
          expect(figure.ariaLabel).toContain(figure.provenance);
          // "not compared" is not "zero". Whatever the short word is, it must not read as a
          // measurement, and every one of these branches says the same thing.
          expect(figure.value).toBe('not compared');
          notCompared++;
        } else {
          expect(figure.provenance).toBe(figure.title);
          measured++;
        }
      }
    }

    // NON-VACUITY, twice over. An empty `figures` array everywhere would pass the loop
    // silently, and asserting a rule about two shapes while only one of them ever renders is
    // the branch-that-never-runs problem this file keeps finding.
    expect(measured).toBeGreaterThan(0);
    expect(notCompared).toBeGreaterThan(0);
  });

  // D9's other half, and the reason the wording matters: `ledgerIndex.present` is a BUILT
  // index — .claude/ledger/index.json — not "has a ledger". A project can hold claims in
  // markdown and have never run `ledger.mjs index`, and the old sub-line counted it as
  // having none.
  test('the ledger-index figure is worded as the built index it counts', () => {
    const text = textOf(
      renderToStaticMarkup(
        <BeliefView belief={beliefPayload([])} loading={false} error={null} now={NOW} onRefresh={() => {}} />
      )
    );
    expect(text).toContain('projects have a built ledger index');
    expect(text).not.toContain('projects carry a claim ledger');
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
