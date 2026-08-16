// test/trust.test.ts — the allowlist and the cross-site guard, tested by executing the
// attacks rather than by reading the code that stops them.
//
// EVERY VECTOR HERE WAS EXECUTED FIRST, on this branch's parent, through these same routes:
//
//   F1  GET /api/conflicts  → core.fsmonitor payload ran; marker held `uid=501(adamks)`, and
//                             the same response reported that worktree as changedFiles:
//                             ["touched.txt"] — clean-looking, while running attacker code.
//   F2  GET /api/belief     → `node <project>/scripts/ledger.mjs` ran; marker `ran as 501`.
//   F3  GET /api/belief     → the ledger script's `/bin/sh -c` reached; marker held `uid=501`.
//
// So the assertions below are not hypotheses about what could happen. The payload files are
// the same ones that worked.
//
// ── HOW THESE TESTS AVOID CERTIFYING AN EMPTY RUN ────────────────────────────────────────
//
// "No marker was written" is satisfied by a collector that did nothing at all, which is the
// exact shape this codebase has caught four times. So every attack test carries a CONTROL
// project in the same fixture tree and the same request: a benign, TRUSTED repository whose
// real answer is asserted. If the sweep silently stopped working, the control assertion goes
// red and the marker assertion stops meaning anything about the guard.

import { afterAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { Hono } from 'hono';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveState } from '../server/state.ts';
import { createApi, partitionByTrust, type ConflictsPayload, type ProjectDetail } from '../server/routes/api.ts';
import { createApp } from '../server/app.ts';
import { siteVerdict, allowedOrigins, crossSiteGuard } from '../server/routes/guard.ts';
import { canonicalRoot, parseTrustList, readTrustList, stripComment, trustStateFor } from '../server/trust.ts';
import { addTrustedRoot, removeTrustedRoot, seedTrustList } from '../scripts/trust-store.ts';
import { discoverFleet, discoverProjects } from '../server/projects.ts';
import type { BeliefSummary } from '../server/collectors/belief.ts';
import { totalsFor, ConflictsView } from '../client/src/views/ConflictsView.tsx';
import { findMarkerAnywhere, initGitRepo, mkTmpDir, removeMarkers, rmTmp, writeRegistry, writeTrustFile } from './fixtures.ts';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const dir of cleanupDirs) rmTmp(dir);
});

// ── the malicious fleet ──────────────────────────────────────────────────────────────────

interface EvilFleet {
  projectsRoot: string;
  claudeRoot: string;
  /** Where every payload writes, outside the fixture tree so a marker is unambiguous. */
  markerDir: string;
  fsmonitorMarker: string;
  ledgerMarker: string;
  shellMarker: string;
  evilFsmonitor: string;
  evilLedger: string;
  evilClaim: string;
  /** A benign, real repository with a real uncommitted change — the control. */
  good: string;
}

function git(dir: string, args: string[]): void {
  execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
}

/**
 * Three hostile repositories and one benign one.
 *
 * The payloads are REAL: an fsmonitor hook git actually executes, and two stand-in
 * `scripts/ledger.mjs` files that print exactly the two lines parseLedgerVerifyOutput reads —
 * so if the gate is removed, the verify SUCCEEDS and the marker lands, rather than the attack
 * failing for an unrelated reason and the test passing by accident.
 */
function buildEvilFleet(prefix: string): EvilFleet {
  const base = mkTmpDir(`mc-trust-${prefix}-`);
  cleanupDirs.push(base);
  const projectsRoot = path.join(base, 'projects');
  const claudeRoot = path.join(base, 'claude');
  const markerDir = path.join(base, 'markers');
  for (const d of [projectsRoot, claudeRoot, markerDir]) fs.mkdirSync(d, { recursive: true });

  const fsmonitorMarker = path.join(markerDir, `F1_FSMONITOR_${crypto.randomUUID()}`);
  const ledgerMarker = path.join(markerDir, `F2_LEDGER_${crypto.randomUUID()}`);
  const shellMarker = path.join(markerDir, `F3_SH_${crypto.randomUUID()}`);

  // F1 — core.fsmonitor names a program git runs during `status`. --no-optional-locks does
  // not disable it and safe.directory does not help; same uid.
  const evilFsmonitor = path.join(projectsRoot, 'evil-fsmonitor');
  initGitRepo(evilFsmonitor);
  const wt = path.join(evilFsmonitor, '.worktrees', 'ceo-1-1');
  git(evilFsmonitor, ['worktree', 'add', '-q', '-b', 'ceo-1-1', wt]);
  writeRegistry(evilFsmonitor, [{ name: 'ceo-1', token: '1' }]);
  fs.writeFileSync(path.join(wt, 'touched.txt'), 'x\n');
  const hook = path.join(base, 'fsmonitor-payload.sh');
  // `printf '/\0'` is what an fsmonitor hook must answer so git accepts the result — without
  // it git may retry or fall back, and the point here is a payload that WORKS.
  fs.writeFileSync(hook, `#!/bin/sh\nid > "${fsmonitorMarker}"\nprintf '/\\0'\n`);
  fs.chmodSync(hook, 0o755);
  git(evilFsmonitor, ['config', 'core.fsmonitor', hook]);

  // F2 — `node <project>/scripts/ledger.mjs`: the file being executed IS the payload.
  const evilLedger = path.join(projectsRoot, 'evil-ledger');
  initGitRepo(evilLedger);
  writeLedgerScript(evilLedger, [
    "import fs from 'node:fs';",
    `fs.writeFileSync(${JSON.stringify(ledgerMarker)}, 'ran as ' + process.getuid() + '\\n');`,
  ]);

  // F3 — scripts/lib/resolvers.js:261 runs execFileSync('/bin/sh', ['-c', ev.cmd]) with
  // `ev.cmd` read from the project's own claim markdown. Reached THROUGH F2, which is why the
  // fixture reproduces it at that call shape rather than copying the whole scripts/ tree.
  const evilClaim = path.join(projectsRoot, 'evil-claim');
  initGitRepo(evilClaim);
  writeLedgerScript(evilClaim, [
    "import { execFileSync } from 'node:child_process';",
    `execFileSync('/bin/sh', ['-c', ${JSON.stringify(`id > ${shellMarker}`)}]);`,
  ]);

  // THE CONTROL. Benign, and it will be trusted, so every assertion below can show the
  // machinery genuinely ran in the same request that refused the hostile ones.
  const good = path.join(projectsRoot, 'good-project');
  initGitRepo(good);
  const goodWt = path.join(good, '.worktrees', 'ceo-1-1');
  git(good, ['worktree', 'add', '-q', '-b', 'ceo-1-1', goodWt]);
  writeRegistry(good, [{ name: 'ceo-1', token: '1' }]);
  fs.writeFileSync(path.join(goodWt, 'edited.txt'), 'x\n');
  writeLedgerScript(good, []);

  return {
    projectsRoot,
    claudeRoot,
    markerDir,
    fsmonitorMarker,
    ledgerMarker,
    shellMarker,
    evilFsmonitor,
    evilLedger,
    evilClaim,
    good,
  };
}

/** A runnable stand-in for scripts/ledger.mjs that a real verify parses, plus `payload` first. */
function writeLedgerScript(root: string, payload: string[]): void {
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'scripts', 'ledger.mjs'),
    [
      ...payload,
      "process.stdout.write('ledger verify: 1 claims\\n');",
      "process.stdout.write('  \\u2713 c-alpha [claim-freshness] ok\\n');",
      "process.stdout.write('\\nledger verify: 1 pass \\u00b7 0 would_block (shadow) \\u00b7 0 block\\n');",
      '',
    ].join('\n')
  );
}

function apiFor(fleet: EvilFleet, trusted: string[]): Hono {
  const trustFile = writeTrustFile(path.join(fleet.projectsRoot, '..', 'trust'), trusted);
  const app = new Hono();
  app.route('/api', createApi(new LiveState({
      roots: [fleet.projectsRoot],
      claudeProjectsRoot: fleet.claudeRoot,
      trustFile,
      // Inside the fixture, never $HOME: LiveState persists its session index, and a test
      // that writes a multi-megabyte index of the developer's real corpus into their home
      // directory is a test with a side effect. check.mjs fails the run if one does.
      indexCachePath: path.join(fleet.projectsRoot, 'index-cache.json'),
    })));
  return app;
}

const json = async (app: Hono, url: string): Promise<unknown> =>
  (await app.fetch(new Request(`http://127.0.0.1${url}`))).json();

/** Every place a payload could have landed: the marker path itself, and anywhere in the tree. */
function markersFor(fleet: EvilFleet, marker: string): string[] {
  const found = findMarkerAnywhere(path.basename(marker), [fleet.projectsRoot, fleet.markerDir]);
  if (fs.existsSync(marker)) found.push(marker);
  return [...new Set(found)];
}

// ── F1 · GET /api/conflicts ──────────────────────────────────────────────────────────────

describe('F1 — an untrusted repository cannot execute its own core.fsmonitor through /api/conflicts', () => {
  test('the payload does not run, and the trusted control project is still swept in the same request', async () => {
    const fleet = buildEvilFleet('f1');
    const app = apiFor(fleet, [fleet.good]);
    let markers: string[] = [];
    try {
      const payload = (await json(app, '/api/conflicts')) as ConflictsPayload;

      markers = markersFor(fleet, fleet.fsmonitorMarker);
      expect(markers).toEqual([]);

      // NON-VACUITY, HALF ONE: the sweep really ran, on the control, in this same request.
      // Without this the marker assertion above is satisfied by a route that returned [].
      const good = payload.reports.find((r) => r.project === 'good-project');
      expect(good).toBeDefined();
      expect(good!.worktrees.map((w) => w.changedFiles)).toEqual([['edited.txt']]);

      // NON-VACUITY, HALF TWO: the guard fired ON THE HOSTILE PROJECT specifically, and said
      // so. "No report" would also be produced by a project that simply vanished.
      const excluded = payload.untrusted.find((u) => u.project === 'evil-fsmonitor');
      expect(excluded).toBeDefined();
      expect(excluded!.root).toBe(fleet.evilFsmonitor);
      expect(excluded!.reason).toContain('not listed');
      expect(payload.reports.some((r) => r.project === 'evil-fsmonitor')).toBe(false);
    } finally {
      removeMarkers(markers);
    }
  });

  test('the same payload DOES execute when the project is trusted — the fixture is a live exploit, not an inert one', async () => {
    // THE TEST THAT MAKES THE ONE ABOVE MEAN SOMETHING. If `core.fsmonitor` had stopped
    // working — a git upgrade, a config precedence change, a broken hook script — the marker
    // assertion above would pass forever while proving nothing. This asserts the exploit is
    // live TODAY, against this git, by running it.
    const fleet = buildEvilFleet('f1-live');
    const app = apiFor(fleet, [fleet.evilFsmonitor]);
    let markers: string[] = [];
    try {
      await json(app, '/api/conflicts');
      markers = markersFor(fleet, fleet.fsmonitorMarker);
      expect(markers.length).toBeGreaterThan(0);
      expect(fs.readFileSync(markers[0] as string, 'utf8')).toContain('uid=');
    } finally {
      removeMarkers(markers);
    }
  });
});

// ── F2 and F3 · GET /api/belief ──────────────────────────────────────────────────────────

describe('F2/F3 — an untrusted repository cannot get its scripts/ledger.mjs run through /api/belief', () => {
  test('neither the node payload nor the /bin/sh -c payload runs, and the trusted control verify does', async () => {
    const fleet = buildEvilFleet('f2');
    const app = apiFor(fleet, [fleet.good]);
    let markers: string[] = [];
    try {
      const f2 = (await json(app, '/api/belief?project=evil-ledger')) as BeliefSummary;
      const f3 = (await json(app, '/api/belief?project=evil-claim')) as BeliefSummary;

      markers = [...markersFor(fleet, fleet.ledgerMarker), ...markersFor(fleet, fleet.shellMarker)];
      expect(markers).toEqual([]);

      // The guard fired, on these two, and said why — not a blank panel.
      for (const summary of [f2, f3]) {
        expect(summary.trust.trusted).toBe(false);
        expect('present' in summary.ledger && summary.ledger.present === false).toBe(true);
        expect((summary.ledger as { reason: string }).reason).toContain('not listed');
      }

      // NON-VACUITY: the very same collector, in the very same fixture, DID run a verify for
      // the trusted control and parsed its output. So "no marker" is not "belief is broken".
      const control = (await json(app, '/api/belief?project=good-project')) as BeliefSummary;
      expect(control.trust.trusted).toBe(true);
      expect('pass' in control.ledger).toBe(true);
      expect((control.ledger as { pass: number }).pass).toBe(1);
    } finally {
      removeMarkers(markers);
    }
  });

  test('both payloads DO execute when the project is trusted — the fixtures are live exploits', async () => {
    const fleet = buildEvilFleet('f2-live');
    const app = apiFor(fleet, [fleet.evilLedger, fleet.evilClaim]);
    let markers: string[] = [];
    try {
      await json(app, '/api/belief?project=evil-ledger');
      await json(app, '/api/belief?project=evil-claim');
      markers = [...markersFor(fleet, fleet.ledgerMarker), ...markersFor(fleet, fleet.shellMarker)];
      expect(markers.length).toBe(2);
      expect(fs.readFileSync(fleet.ledgerMarker, 'utf8')).toContain('ran as ');
      expect(fs.readFileSync(fleet.shellMarker, 'utf8')).toContain('uid=');
    } finally {
      removeMarkers(markers);
    }
  });
});

// ── GET /api/project/:id ─────────────────────────────────────────────────────────────────

describe('the stage probe does not run for an untrusted project, and says so', () => {
  test('untrusted renders could-not-look with a reason; trusted runs the probe', async () => {
    const fleet = buildEvilFleet('probe');
    const app = apiFor(fleet, [fleet.good]);

    const blocked = (await json(app, '/api/project/evil-ledger')) as ProjectDetail;
    expect(blocked.project.trust.trusted).toBe(false);
    // `readable: false` is the three-state "I could not look" — NOT `found: false` standing in
    // for "I looked and found nothing", which is the defect this shape exists to prevent.
    expect(blocked.empty.readable).toBe(false);
    expect(blocked.empty.found).toBe(false);
    expect(blocked.empty.reason).toContain('not listed');
    // The command that WOULD have run is still shown — what was skipped is part of the answer.
    expect(blocked.empty.probe).toContain('grep');
    expect(blocked.empty.probe).toContain(fleet.evilLedger);

    // NON-VACUITY: the probe genuinely runs for a trusted project in the same fixture.
    const allowed = (await json(app, '/api/project/good-project')) as ProjectDetail;
    expect(allowed.project.trust.trusted).toBe(true);
    expect(allowed.empty.readable).toBeUndefined();
  });
});

// ── the narrowing is never silent ────────────────────────────────────────────────────────

describe('an untrusted project is reported, never absent', () => {
  test('every discovered project appears in exactly one half of the /api/conflicts payload', async () => {
    const fleet = buildEvilFleet('partition');
    const app = apiFor(fleet, [fleet.good]);
    const payload = (await json(app, '/api/conflicts')) as ConflictsPayload;

    const named = [...payload.reports.map((r) => r.project), ...payload.untrusted.map((u) => u.project)].sort();
    expect(named).toEqual(['evil-claim', 'evil-fsmonitor', 'evil-ledger', 'good-project']);
    // …and never in both. A project counted twice inflates the denominator instead of hiding
    // it, which is the same class of defect pointing the other way.
    expect(new Set(named).size).toBe(named.length);
  });

  test('partitionByTrust splits one array in one pass — trusted + untrusted is the whole fleet', () => {
    const fleet = buildEvilFleet('partition-unit');
    const trustFile = writeTrustFile(path.join(fleet.projectsRoot, '..', 'trust-unit'), [fleet.good, fleet.evilLedger]);
    const projects = discoverProjects({ roots: [fleet.projectsRoot], claudeProjectsRoot: fleet.claudeRoot, trustFile });
    const { trusted, untrusted } = partitionByTrust(projects);
    expect(projects.length).toBe(4);
    expect(trusted.length + untrusted.length).toBe(projects.length);
    expect(trusted.map((p) => p.id).sort()).toEqual(['evil-ledger', 'good-project']);
    for (const u of untrusted) expect(u.reason.length).toBeGreaterThan(0);
  });

  test('the Conflicts denominator counts the whole fleet, and the all-clear is withheld', async () => {
    const fleet = buildEvilFleet('render');
    const app = apiFor(fleet, [fleet.good]);
    const payload = (await json(app, '/api/conflicts')) as ConflictsPayload;

    const totals = totalsFor(payload.reports, payload.untrusted);
    expect(totals.projects).toBe(4); // NOT 1 — the trusted part is not the fleet
    expect(totals.untrusted).toBe(3);

    const html = renderToStaticMarkup(
      createElement(ConflictsView, {
        reports: payload.reports,
        untrusted: payload.untrusted,
        trustIssues: payload.trust.issues,
        loading: false,
        error: null,
        onRefresh: () => {},
      })
    );
    // Every excluded project is NAMED on screen, with the reason the server gave.
    for (const u of payload.untrusted) expect(html).toContain(u.project);
    expect(html).toContain('not swept — not a trusted project');
    // THE ALL-CLEAR IS THE DANGEROUS STRING. With three projects unmeasured, "No two agent
    // worktrees are editing the same file" is a claim about a population nobody looked at.
    expect(html).not.toContain('No two agent worktrees are editing the same file');
    expect(html).toContain('No conflicts among the worktrees that could be checked.');
    expect(html).toContain('NOT an all-clear for the fleet');
  });

  test('a refused line in the trust file is rendered, not swallowed', async () => {
    const fleet = buildEvilFleet('issues');
    const dir = mkTmpDir('mc-trust-issues-');
    cleanupDirs.push(dir);
    const trustFile = path.join(dir, 'trusted-projects');
    fs.writeFileSync(trustFile, `${fleet.good}\nrelative/path/project\n`);
    const app = new Hono();
    app.route('/api', createApi(new LiveState({
      roots: [fleet.projectsRoot],
      claudeProjectsRoot: fleet.claudeRoot,
      trustFile,
      // Inside the fixture, never $HOME: LiveState persists its session index, and a test
      // that writes a multi-megabyte index of the developer's real corpus into their home
      // directory is a test with a side effect. check.mjs fails the run if one does.
      indexCachePath: path.join(fleet.projectsRoot, 'index-cache.json'),
    })));

    const payload = (await json(app, '/api/conflicts')) as ConflictsPayload;
    expect(payload.trust.source).toBe(trustFile);
    expect(payload.trust.issues.length).toBe(1);
    expect(payload.trust.issues[0]).toContain('relative/path/project');

    const html = renderToStaticMarkup(
      createElement(ConflictsView, {
        reports: payload.reports,
        untrusted: payload.untrusted,
        trustIssues: payload.trust.issues,
        loading: false,
        error: null,
        onRefresh: () => {},
      })
    );
    expect(html).toContain('relative/path/project');
  });
});

// ── the trust list itself ────────────────────────────────────────────────────────────────

describe('the trusted-projects file', () => {
  test('fails closed on every failure mode, and says which one it was', () => {
    const dir = mkTmpDir('mc-trust-file-');
    cleanupDirs.push(dir);

    const missing = readTrustList(path.join(dir, 'nope'));
    expect(missing.present).toBe(false);
    expect(missing.roots).toEqual([]);
    expect(missing.reason).toContain('does not exist');
    expect(missing.reason).toContain('trust seed');

    // An EMPTY file and an ABSENT file are different statements, and both trust nothing.
    const empty = path.join(dir, 'empty');
    fs.writeFileSync(empty, '# nothing here\n');
    const read = readTrustList(empty);
    expect(read.present).toBe(true);
    expect(read.roots).toEqual([]);
    expect(read.reason).toBeUndefined();
  });

  test('matching is exact, not by prefix — a parent directory does not trust its children', () => {
    const parent = mkTmpDir('mc-trust-prefix-');
    cleanupDirs.push(parent);
    const child = path.join(parent, 'child');
    fs.mkdirSync(child);
    const list = readTrustList(writeTrustFile(parent, [parent]));

    expect(trustStateFor(parent, list).trusted).toBe(true);
    // THE WHOLE POINT. A prefix rule would spell "everything under ~/VibeCoding is trusted",
    // which is the premise the allowlist exists to delete.
    expect(trustStateFor(child, list).trusted).toBe(false);
    expect(trustStateFor(`${parent}-sibling`, list).trusted).toBe(false);
  });

  test('a relative line is refused and trusts nothing, and the refusal is reported', () => {
    const parsed = parseTrustList('/abs/one\nrelative/two\n# comment\n\n   \n/abs/one\n');
    expect(parsed.roots).toEqual([canonicalRoot('/abs/one')]); // deduped
    expect(parsed.issues.length).toBe(1);
    expect(parsed.issues[0]).toContain('relative/two');
    expect(parsed.issues[0]).toContain('not an absolute path');
  });

  test('a trailing comment on a path line does not become part of the path', () => {
    const parsed = parseTrustList('/abs/one # the main repo\n');
    expect(parsed.roots).toEqual([canonicalRoot('/abs/one')]);
  });

  test('a directory legitimately named with a # is NOT truncated at it', () => {
    // Splitting on the first `#` anywhere turns /a/my#project into /a/my — a path that does
    // not exist, so the project silently stays untrusted and nothing anywhere says why. Fails
    // closed, and looks exactly like the trust file not working.
    expect(stripComment('/a/my#project')).toBe('/a/my#project');
    expect(stripComment('/a/my#project # a note')).toBe('/a/my#project');
    expect(stripComment('# a whole-line comment')).toBe('');
    expect(stripComment('   # indented comment')).toBe('');
    expect(parseTrustList('/a/my#project\n').roots).toEqual([canonicalRoot('/a/my#project')]);
  });

  test('remove and read agree about where a path ends', () => {
    const dir = mkTmpDir('mc-trust-hash-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'trusted-projects');
    fs.writeFileSync(file, '# header\n/a/my#project\n/b/plain # a note\n');
    expect(readTrustList(file).roots).toEqual([canonicalRoot('/a/my#project'), canonicalRoot('/b/plain')]);
    expect(removeTrustedRoot(file, '/a/my#project').removed).toBe(true);
    expect(readTrustList(file).roots).toEqual([canonicalRoot('/b/plain')]);
    expect(fs.readFileSync(file, 'utf8')).toContain('# header');
  });

  test('canonicalisation is applied to both sides, so /tmp and /private/tmp agree', () => {
    const dir = mkTmpDir('mc-trust-canon-');
    cleanupDirs.push(dir);
    // os.tmpdir() on macOS is /var/folders/… which realpaths to /private/var/folders/…
    expect(canonicalRoot(dir)).toBe(fs.realpathSync(dir));
    const list = readTrustList(writeTrustFile(dir, [fs.realpathSync(dir)]));
    expect(trustStateFor(dir, list).trusted).toBe(true);
  });
});

describe('the trust CLI store', () => {
  test('seed writes the header and the roots, and never overwrites an existing decision', () => {
    const dir = mkTmpDir('mc-trust-seed-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'trusted-projects');

    const first = seedTrustList(file, ['/b/two', '/a/one'], new Date('2026-08-15T00:00:00Z'));
    expect(first.written).toBe(true);
    expect(first.count).toBe(2);
    const text = fs.readFileSync(file, 'utf8');
    expect(text).toContain('# Mission Control — trusted project roots.');
    // The header states the uncomfortable part rather than only the convenient one.
    expect(text).toContain('SEEDED 2026-08-15');
    expect(text).toContain('checked nothing');
    expect(readTrustList(file).roots).toEqual([canonicalRoot('/a/one'), canonicalRoot('/b/two')]);

    // A user who deleted a line has made a decision. Re-seeding must not undo it.
    removeTrustedRoot(file, '/a/one');
    expect(readTrustList(file).roots).toEqual([canonicalRoot('/b/two')]);
    const second = seedTrustList(file, ['/a/one', '/b/two']);
    expect(second.written).toBe(false);
    expect(readTrustList(file).roots).toEqual([canonicalRoot('/b/two')]);
  });

  test('add is idempotent and preserves the comments already in the file', () => {
    const dir = mkTmpDir('mc-trust-add-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'trusted-projects');
    seedTrustList(file, ['/a/one'], new Date('2026-08-15T00:00:00Z'));

    expect(addTrustedRoot(file, '/b/two').added).toBe(true);
    expect(addTrustedRoot(file, '/b/two').added).toBe(false);
    expect(readTrustList(file).roots).toEqual([canonicalRoot('/a/one'), canonicalRoot('/b/two')]);
    expect(fs.readFileSync(file, 'utf8')).toContain('# Mission Control — trusted project roots.');
  });
});

// ── the cross-site guard ─────────────────────────────────────────────────────────────────
//
// The header table below was measured in a real browser twice, independently, with an
// attacker page on localhost:4312 against a target on 127.0.0.1:4311. It is reproduced here
// as data so every row is exercised — including the four where `Origin` is ABSENT, which is
// the reason an Origin check alone is not the control.

describe('siteVerdict — every row of the measured browser table', () => {
  const rows: { what: string; site: string | null; origin: string | null; allow: boolean }[] = [
    { what: '<img src> on a cross-site page', site: 'cross-site', origin: null, allow: false },
    { what: '<script src> on a cross-site page', site: 'cross-site', origin: null, allow: false },
    { what: '<link rel=stylesheet> on a cross-site page', site: 'cross-site', origin: null, allow: false },
    { what: 'form GET from a cross-site page', site: 'cross-site', origin: null, allow: false },
    { what: 'fetch(no-cors) from a cross-site page', site: 'cross-site', origin: null, allow: false },
    { what: 'fetch(cors) from a cross-site page', site: 'cross-site', origin: 'http://evil.example', allow: false },
    { what: 'same host, different port', site: 'same-site', origin: null, allow: true },
    { what: 'the app itself', site: 'same-origin', origin: null, allow: true },
    { what: 'a typed URL or a bookmark', site: 'none', origin: null, allow: true },
    { what: 'curl / a local script (no such header)', site: null, origin: null, allow: true },
  ];

  for (const row of rows) {
    test(`${row.what} → ${row.allow ? 'allowed' : 'REFUSED'}`, () => {
      expect(siteVerdict(row.site, row.origin).allow).toBe(row.allow);
    });
  }

  test('THE <img> VECTOR IS WHY THIS IS NOT AN ORIGIN CHECK', () => {
    // Both of these are what an <img> on an attacker's page produces: no Origin at all. An
    // Origin-only check must allow absent (the app's own GETs send none either), so it would
    // allow this one — a guard satisfied while the property it protects is violated.
    const img = siteVerdict('cross-site', null);
    expect(img.allow).toBe(false);
    expect(img.by).toBe('sec-fetch-site');
    expect(siteVerdict(null, null).allow).toBe(true); // the same request minus the header
  });

  test('the header is matched case-insensitively and with surrounding space', () => {
    expect(siteVerdict('  Cross-Site  ', null).allow).toBe(false);
  });

  test('Origin is defence in depth: a foreign one is refused, our own are not', () => {
    expect(siteVerdict('same-origin', 'http://evil.example').allow).toBe(false);
    for (const origin of allowedOrigins()) {
      expect(siteVerdict('same-origin', origin).allow).toBe(true);
      expect(siteVerdict('same-origin', `${origin}/`).allow).toBe(true); // trailing slash
    }
  });

  test('the refusal reason names the browser vector and does NOT claim to block drive-by', () => {
    const reason = siteVerdict('cross-site', null).reason.toLowerCase();
    expect(reason).toContain('cross-site');
    expect(reason).toContain('browser');
    // `same-site` is allowed, so anything else on this loopback still reaches everything.
    // Saying "blocks drive-by" would be a guard named for a property it does not have.
    expect(reason).not.toContain('drive-by');
  });
});

describe('the guard is registered above every route the process serves', () => {
  function evilApp(): { app: Hono; fleet: EvilFleet } {
    const fleet = buildEvilFleet('guard');
    const trustFile = writeTrustFile(path.join(fleet.projectsRoot, '..', 'trust-guard'), [fleet.good]);
    return {
      app: createApp(new LiveState({
      roots: [fleet.projectsRoot],
      claudeProjectsRoot: fleet.claudeRoot,
      trustFile,
      // Inside the fixture, never $HOME: LiveState persists its session index, and a test
      // that writes a multi-megabyte index of the developer's real corpus into their home
      // directory is a test with a side effect. check.mjs fails the run if one does.
      indexCachePath: path.join(fleet.projectsRoot, 'index-cache.json'),
    })),
      fleet,
    };
  }

  const crossSite = (url: string) =>
    new Request(`http://127.0.0.1${url}`, { headers: { 'sec-fetch-site': 'cross-site' } });

  test('EVERY route registered on the real app refuses a cross-site request', async () => {
    const { app } = evilApp();
    // ENUMERATED FROM THE APP, not from a hand-kept list — a route added tomorrow is covered
    // by this test the day it is registered, which is the only way "applies to every route"
    // stays true. `/events` is excluded from the ALLOW half below (it is an open stream), not
    // from this half.
    const paths = [...new Set(app.routes.filter((r) => r.method === 'GET').map((r) => r.path))];
    expect(paths.length).toBeGreaterThanOrEqual(8);

    for (const p of paths) {
      const url = p.replace(':id', 'good-project');
      const res = await app.fetch(crossSite(url));
      expect({ url, status: res.status }).toEqual({ url, status: 403 });
      const body = (await res.json()) as { error: string; refusedBy: string };
      expect(body.refusedBy).toBe('sec-fetch-site');
    }
  });

  test('NON-VACUITY — the same routes answer 200 for a same-origin request, with real data', async () => {
    // Without this, "everything 403s" would also be produced by a broken app, a bad mount
    // path, or a guard that refuses unconditionally. The refusals above only mean something
    // because these succeed.
    const { app, fleet } = evilApp();
    const sameOrigin = (url: string) =>
      new Request(`http://127.0.0.1${url}`, { headers: { 'sec-fetch-site': 'same-origin' } });

    const health = await app.fetch(sameOrigin('/api/health'));
    expect(health.status).toBe(200);

    const conflictsRes = await app.fetch(sameOrigin('/api/conflicts'));
    expect(conflictsRes.status).toBe(200);
    const conflicts = (await conflictsRes.json()) as ConflictsPayload;
    // Real work happened: the trusted control was swept and its uncommitted file found.
    expect(conflicts.reports.find((r) => r.project === 'good-project')!.worktrees[0]!.changedFiles).toEqual([
      'edited.txt',
    ]);
    expect(conflicts.untrusted.length).toBe(3);

    const project = await app.fetch(sameOrigin(`/api/project/good-project`));
    expect(project.status).toBe(200);
    expect(((await project.json()) as ProjectDetail).project.root).toBe(fleet.good);
  });

  test('a cross-site request performs NO WORK — the collector never runs', async () => {
    // The findings doc's point about <img>: the attacker never needs to read the response,
    // only to trigger the work. So refusing with a 403 is not enough on its own — the handler
    // must not have run. Proven by trusting the hostile project and showing the payload still
    // does not fire on a cross-site request.
    const fleet = buildEvilFleet('guard-work');
    const trustFile = writeTrustFile(path.join(fleet.projectsRoot, '..', 'trust-work'), [fleet.evilFsmonitor]);
    const app = createApp(new LiveState({
      roots: [fleet.projectsRoot],
      claudeProjectsRoot: fleet.claudeRoot,
      trustFile,
      // Inside the fixture, never $HOME: LiveState persists its session index, and a test
      // that writes a multi-megabyte index of the developer's real corpus into their home
      // directory is a test with a side effect. check.mjs fails the run if one does.
      indexCachePath: path.join(fleet.projectsRoot, 'index-cache.json'),
    }));
    let markers: string[] = [];
    try {
      const res = await app.fetch(crossSite('/api/conflicts'));
      expect(res.status).toBe(403);
      markers = markersFor(fleet, fleet.fsmonitorMarker);
      expect(markers).toEqual([]);

      // NON-VACUITY: the identical request WITHOUT the cross-site header executes it, so the
      // absence above is the guard and not a broken fixture.
      await app.fetch(new Request('http://127.0.0.1/api/conflicts', { headers: { 'sec-fetch-site': 'same-origin' } }));
      markers = markersFor(fleet, fleet.fsmonitorMarker);
      expect(markers.length).toBeGreaterThan(0);
    } finally {
      removeMarkers(markers);
    }
  });

  test('crossSiteGuard passes a same-origin request through to the handler underneath', async () => {
    // The middleware calls next(). A guard that refused everything would satisfy every
    // refusal assertion in this file; this is the one that says it does not.
    const app = new Hono();
    app.use('*', crossSiteGuard());
    app.get('/x', (c) => c.text('reached'));
    expect(await (await app.fetch(new Request('http://127.0.0.1/x'))).text()).toBe('reached');
    expect(
      await (
        await app.fetch(new Request('http://127.0.0.1/x', { headers: { 'sec-fetch-site': 'same-site' } }))
      ).text()
    ).toBe('reached');
    expect(
      (await app.fetch(new Request('http://127.0.0.1/x', { headers: { 'sec-fetch-site': 'cross-site' } }))).status
    ).toBe(403);
  });
});

// ── discovery keeps discovering ──────────────────────────────────────────────────────────

describe('the allowlist narrows execution, never discovery', () => {
  test('discoverFleet returns every project with no trust file at all, and each says why', () => {
    const fleet = buildEvilFleet('discovery');
    const { projects, trustList } = discoverFleet({
      roots: [fleet.projectsRoot],
      claudeProjectsRoot: fleet.claudeRoot,
      trustFile: path.join(fleet.projectsRoot, '..', 'no-such-file'),
    });
    expect(projects.map((p) => p.id).sort()).toEqual(['evil-claim', 'evil-fsmonitor', 'evil-ledger', 'good-project']);
    expect(trustList.present).toBe(false);
    for (const p of projects) {
      expect(p.trust.trusted).toBe(false);
      expect(p.trust.reason).toContain('does not exist');
      expect(p.trust.source).toContain('no-such-file');
    }
  });
});
