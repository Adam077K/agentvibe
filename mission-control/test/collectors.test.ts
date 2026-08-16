// test/collectors.test.ts — unit and fixture-integration coverage for every collector.
import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

/** The test's own async spawner — used to measure what asking for a child costs. */
const execFileAsync = promisify(execFile);
import { discoverProjects, encodeProjectDir, readLedgerIndex, type Project } from '../server/projects.ts';
import { INDEX_KEY_ORDER, STAMPED_FIELDS } from '../server/lib/claim-shape.ts';
import { validateClaim } from '../server/lib/claims.ts';
import { IndexStore } from '../server/index-store.ts';
import { listWorktrees, parseWorktreePorcelain, type WorktreeEntry } from '../server/collectors/worktrees.ts';
import {
  changedFilesFor,
  detectConflicts,
  parseStatusPorcelain,
  scopeSweep,
  wholeLinesOf,
  EXCLUDED_REASON,
  STATUS_ARGV,
  statusConfigEnv,
} from '../server/collectors/conflicts.ts';
import { parseWarroomFleetOutput } from '../server/collectors/fleet.ts';
import {
  attributeVerdicts,
  collectWaivers,
  ledgerVerifyArgs,
  parseLedgerVerifyLines,
  parseLedgerVerifyOutput,
  readGlobalLedger,
  runLedgerVerify,
  summarizeClaims,
  type GlobalClaim,
  type LedgerVerifySummary,
} from '../server/collectors/belief.ts';
import { summarizeEvents, bucketBudgetBlock, readConfiguredCeilings } from '../server/collectors/events.ts';
import {
  projectEmptyState,
  projectEmptyStateProbe,
  inboxEmptyState,
  PROJECT_PROBE_MAX_CONCURRENT,
  PROJECT_PROBE_TIMEOUT_MS,
  PROJECT_PROBE_QUEUE_WAIT_MS,
} from '../server/collectors/empty.ts';
import {
  mkTmpDir,
  rmTmp,
  fixtureClaudeProjectsDir,
  findMarkerAnywhere,
  initGitRepo,
  addWorktree,
  removeMarkers,
  writeRegistry,
  indexClaim,
  globalClaim,
  writeLedgerFixture,
} from './fixtures.ts';
import { notVerified, median, stallGateVerdict } from './gate.ts';

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..');
const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

// ── encodeProjectDir ─────────────────────────────────────────────────────────────────
describe('encodeProjectDir', () => {
  test('replaces every non-alnum char, including the dot before .worktrees', () => {
    const p = '/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-1-1786445435';
    expect(encodeProjectDir(p)).toBe('-Users-adamks-VibeCoding-agentvibe--worktrees-ceo-1-1786445435');
  });

  test('matches the real directory observed under ~/.claude/projects for this repo', () => {
    // Ground truth, captured with `ls ~/.claude/projects | od -c` against a real worktree
    // session — pinned here so a future change to the encoding logic is caught even
    // though the real ~/.claude/projects layout is not fixtured.
    expect(encodeProjectDir('/Users/adamks/VibeCoding/agentvibe')).toBe('-Users-adamks-VibeCoding-agentvibe');
  });
});

// ── discoverProjects ─────────────────────────────────────────────────────────────────
describe('discoverProjects', () => {
  const root = mkTmpDir('mc-discover-');
  const claudeRoot = mkTmpDir('mc-claude-');
  cleanupDirs.push(root, claudeRoot);

  // Two sibling projects whose names share a prefix but not at a hyphen boundary —
  // "widget" must not swallow "widgetfoo"'s transcripts, and vice versa. (Note: a
  // hyphenated sibling like "widget-other" is genuinely ambiguous under this encoding —
  // a literal hyphen in a directory name is indistinguishable from the hyphen the
  // encoding substitutes for '/', so "widget" vs "widget-other" is not a fair test of
  // the boundary logic; "widget" vs "widgetfoo" is.)
  const projA = path.join(root, 'widget');
  const projB = path.join(root, 'widgetfoo');
  const notGit = path.join(root, 'not-a-repo');
  initGitRepo(projA);
  initGitRepo(projB);
  fs.mkdirSync(notGit, { recursive: true });

  writeRegistry(projA, [{ name: 'ceo-1', token: '1111' }]);

  fixtureClaudeProjectsDir(claudeRoot, projA, 'session-a', [{ ts: new Date().toISOString(), output_tokens: 10 }]);
  fixtureClaudeProjectsDir(claudeRoot, projB, 'session-b', [{ ts: new Date().toISOString(), output_tokens: 20 }]);

  const projects = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot });

  test('only real git repos are discovered', () => {
    const ids = projects.map((p) => p.id).sort();
    expect(ids).toEqual(['widget', 'widgetfoo']);
  });

  test('a project with .worktrees/.registry is agentActive; one without is not', () => {
    const a = projects.find((p) => p.id === 'widget')!;
    const b = projects.find((p) => p.id === 'widgetfoo')!;
    expect(a.agentActive).toBe(true);
    expect(a.registry.entries).toEqual([{ name: 'ceo-1', token: '1111' }]);
    expect(b.agentActive).toBe(false);
  });

  test('transcript-dir prefix matching does not let "widget" swallow "widgetfoo"', () => {
    const a = projects.find((p) => p.id === 'widget')!;
    const b = projects.find((p) => p.id === 'widgetfoo')!;
    expect(a.transcriptDirs).toHaveLength(1);
    expect(a.transcriptDirs[0]).toBe(path.join(claudeRoot, encodeProjectDir(projA)));
    expect(b.transcriptDirs).toHaveLength(1);
    expect(b.transcriptDirs[0]).toBe(path.join(claudeRoot, encodeProjectDir(projB)));
  });

  test('a project with no scripts/ledger.mjs reports present:false with a reason, not zero claims', () => {
    const a = projects.find((p) => p.id === 'widget')!;
    expect(a.ledgerIndex.present).toBe(false);
    expect(a.ledgerIndex.reason).toMatch(/no scripts\/ledger\.mjs/);
    expect(a.ledgerIndex.claims).toEqual([]);
  });

  test('a project WITH scripts/ledger.mjs and a built index.json loads its claims', () => {
    const projC = path.join(root, 'proj-with-ledger');
    initGitRepo(projC);
    writeLedgerFixture(projC, [indexClaim({ id: 'c-x', source_file: 'a.md' })]);
    const [proj] = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot }).filter((p) => p.id === 'proj-with-ledger');
    expect(proj!.ledgerIndex.present).toBe(true);
    expect(proj!.ledgerIndex.claims).toHaveLength(1);
    // Nothing was refused, and the field the UI renders as the claim's origin survived the read.
    expect(proj!.ledgerIndex.rejected).toBe(0);
    expect(proj!.ledgerIndex.claims[0]!.source_file).toBe('a.md');
  });

  // ── the boundary #53 is about ──────────────────────────────────────────────────────
  //
  // These write RAW entries on purpose — the whole point is what happens when a producer
  // emits something `indexClaim()` would refuse to build, which is exactly the state the
  // builder exists to make impossible to reach by accident.

  test('an entry missing source_file is REFUSED and counted, not passed through as undefined', () => {
    const proj = path.join(root, 'proj-index-nosource');
    initGitRepo(proj);
    const good = indexClaim({ id: 'c-good' });
    const { source_file: _dropped, ...withoutSourceFile } = good;
    writeLedgerFixture(proj, [], [good, withoutSourceFile]);
    const found = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot }).find((p) => p.id === 'proj-index-nosource');
    expect(found!.ledgerIndex.present).toBe(true);
    expect(found!.ledgerIndex.claims).toHaveLength(1); // the good one survives
    expect(found!.ledgerIndex.rejected).toBe(1); // and the bad one is REPORTED
    expect(found!.ledgerIndex.issues.join('\n')).toContain('claims[1]');
    expect(found!.ledgerIndex.issues.join('\n')).toContain('source_file');
    // Nothing typed `source_file: string` ever holds undefined — the defect that reached
    // the UI as `file:undefined` when source_line was dropped from KEY_ORDER.
    for (const c of found!.ledgerIndex.claims) expect(typeof c.source_file).toBe('string');
  });

  test('a field outside the index projection is refused — the projection is closed', () => {
    const proj = path.join(root, 'proj-index-extra');
    initGitRepo(proj);
    // `source_line` is the field PR #52 removed from KEY_ORDER. An index still carrying it is
    // a producer this reader does not understand, and saying so beats rendering it.
    writeLedgerFixture(proj, [], [{ ...indexClaim({ id: 'c-extra' }), source_line: 12 }]);
    const found = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot }).find((p) => p.id === 'proj-index-extra');
    expect(found!.ledgerIndex.rejected).toBe(1);
    expect(found!.ledgerIndex.issues.join('\n')).toContain('source_line');
    expect(found!.ledgerIndex.issues.join('\n')).toMatch(/projection is closed/);
  });

  test('an index whose every entry is refused is present:false with a reason, never an empty band', () => {
    const proj = path.join(root, 'proj-index-allbad');
    initGitRepo(proj);
    writeLedgerFixture(proj, [], [{ id: 'c-a' }, { id: 'c-b' }]);
    const found = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot }).find((p) => p.id === 'proj-index-allbad');
    // "33 claims, none of which I could read" must not render as "this project has no claims".
    expect(found!.ledgerIndex.present).toBe(false);
    expect(found!.ledgerIndex.rejected).toBe(2);
    expect(found!.ledgerIndex.reason).toMatch(/none matched the shape this reader understands/);
  });

  test('a JSON file with no claims list is present:false — different from a project with none', () => {
    const proj = path.join(root, 'proj-index-noclaims');
    initGitRepo(proj);
    fs.mkdirSync(path.join(proj, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(proj, 'scripts', 'ledger.mjs'), '// fixture stand-in\n');
    fs.mkdirSync(path.join(proj, '.claude', 'ledger'), { recursive: true });
    fs.writeFileSync(path.join(proj, '.claude', 'ledger', 'index.json'), JSON.stringify({ version: 1 }));
    const found = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot }).find((p) => p.id === 'proj-index-noclaims');
    expect(found!.ledgerIndex.present).toBe(false);
    expect(found!.ledgerIndex.reason).toMatch(/no "claims" list/);
  });
});

// ── THE MUTATION GATE: the fixtures are bound to the real artifact ────────────────────
//
// Issue #54's acceptance criterion, stated as a test rather than as a procedure someone has
// to remember to run: strip a required field from the REAL `.claude/ledger/index.json` and
// the mission-control suite must go red. Before this existed it did not — measured at
// 320 pass / 0 fail with `source_file` gone from all 33 claims — because every test that
// reached readLedgerIndex wrote its own fixture that still supplied the field, and the one
// test reading the real repo (crosscheck) compared a COUNT, which a vanishing field does not
// change.
//
// It reads the repo this checkout is in, through the production reader, and asserts on claim
// FIELDS. That is the binding: no fixture stands between the producer and this assertion.
describe('the real .claude/ledger/index.json, through the production reader', () => {
  const indexPath = path.join(REPO_ROOT, '.claude', 'ledger', 'index.json');

  // Gate on whether the SUBJECT exists on this machine, never on what looking at it returned —
  // test/gate.ts's rule. A checkout always has this file; a consumer of this repo as a
  // template might not, and "the index is missing" is a property of the tree, not a result.
  const present = fs.existsSync(indexPath);

  test('every claim in the built index satisfies the shape Mission Control reads it with', () => {
    if (!present) {
      notVerified('real ledger index', `${indexPath} does not exist in this checkout`);
      expect(present).toBe(false); // the gate's own premise, asserted rather than assumed
      return;
    }
    const info = readLedgerIndex(REPO_ROOT);
    expect(info.present).toBe(true);
    // Zero refusals. A producer that drops a field from KEY_ORDER fails HERE, on its own PR.
    expect(info.issues).toEqual([]);
    expect(info.rejected).toBe(0);
    // And the file really did hold claims — an empty list would satisfy every line above
    // while comparing nothing, which is the shape of failure this file keeps finding.
    expect(info.claims.length).toBeGreaterThan(0);
    for (const c of info.claims) {
      expect(typeof c.source_file).toBe('string');
      expect(c.source_file.length).toBeGreaterThan(0);
    }
  });

  test('the index projection this reader enforces IS the producer KEY_ORDER, read from it', () => {
    // scripts/ledger.mjs is read, never imported and never edited: another agent owns it, and
    // a KEY_ORDER edit must fail on ITS pull request rather than silently re-shape this
    // reader's idea of a claim. Matching the literal is the whole check.
    const src = fs.readFileSync(path.join(REPO_ROOT, 'scripts', 'ledger.mjs'), 'utf8');
    const literal = /const KEY_ORDER = \[([^\]]*)\]/.exec(src);
    expect(literal).not.toBeNull();
    const producerKeys = [...literal![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(producerKeys).toEqual([...INDEX_KEY_ORDER]);
  });

  test('STAMPED_FIELDS really are the ones validateClaim refuses — pinned, not assumed', () => {
    // The split between "validateClaim owns this field" and "the ledger stamps it after
    // validation" is a fact about scripts/lib/claims.js, so it is measured against the real
    // validator. If that schema ever adopts source_file, or drops another index field, this
    // goes red instead of claim-shape.ts's comment going quietly stale.
    const wellFormed = { id: 'c-probe', assert: 'x', kind: 'behavior', scope: 'task', verified_by: 'command', evidence: { cmd: 'true' }, confidence: 0.5 };
    for (const field of INDEX_KEY_ORDER) {
      const refused = validateClaim({ ...wellFormed, [field]: wellFormed[field as keyof typeof wellFormed] ?? 'x' }, 'probe')
        .some((p) => p.includes(`unknown field "${field}"`));
      expect([field, refused]).toEqual([field, (STAMPED_FIELDS as readonly string[]).includes(field)]);
    }
  });
});

// ── worktrees ────────────────────────────────────────────────────────────────────────
describe('parseWorktreePorcelain', () => {
  const fakeProject = { id: 'x', root: '/tmp/x', registry: { present: true, path: '', entries: [{ name: 'ceo-1', token: '999' }] } } as unknown as Project;

  test('parses worktree/HEAD/branch/detached/locked/prunable blocks', () => {
    const text = [
      'worktree /tmp/x',
      'HEAD aaaa',
      'branch refs/heads/main',
      '',
      'worktree /tmp/x/.worktrees/ceo-1-999',
      'HEAD bbbb',
      'branch refs/heads/feat/thing',
      '',
      'worktree /tmp/x/.worktrees/detached-one',
      'HEAD cccc',
      'detached',
      'locked',
      'prunable gitdir file points to non-existent location',
      '',
    ].join('\n');
    const entries = parseWorktreePorcelain(text, fakeProject);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({ path: '/tmp/x', branch: 'main', isMain: true });
    expect(entries[1]).toMatchObject({ path: '/tmp/x/.worktrees/ceo-1-999', branch: 'feat/thing', isMain: false, registryMatch: { name: 'ceo-1', token: '999' } });
    expect(entries[2]).toMatchObject({ branch: null, locked: true, prunable: true, registryMatch: null });
  });

  test('a registry entry only matches a worktree whose basename is exactly name-token', () => {
    const text = ['worktree /tmp/x', 'HEAD aaaa', 'branch refs/heads/main', '', 'worktree /tmp/x/.worktrees/ceo-1-999-extra', 'HEAD bbbb', 'branch refs/heads/feat/thing', ''].join('\n');
    const entries = parseWorktreePorcelain(text, fakeProject);
    expect(entries[1]!.registryMatch).toBeNull();
  });
});

describe('listWorktrees + detectConflicts against a real git repo', () => {
  const root = mkTmpDir('mc-git-');
  cleanupDirs.push(root);
  initGitRepo(root);
  const wtA = path.join(root, '.worktrees', 'ceo-1-100');
  const wtB = path.join(root, '.worktrees', 'ceo-2-200');
  addWorktree(root, wtA, 'ceo-1-100');
  addWorktree(root, wtB, 'ceo-2-200');
  writeRegistry(root, [{ name: 'ceo-1', token: '100' }, { name: 'ceo-2', token: '200' }]);
  const project = discoverProjects({ roots: [path.dirname(root)], claudeProjectsRoot: mkTmpDir('mc-empty-claude-') }).find((p) => p.root === root)
    ?? { id: path.basename(root), root, registry: { present: true, path: '', entries: [{ name: 'ceo-1', token: '100' }, { name: 'ceo-2', token: '200' }] } } as Project;

  test('lists the main worktree plus both added worktrees', () => {
    const entries = listWorktrees(project);
    expect(entries.map((e) => e.isMain)).toContain(true);
    expect(entries).toHaveLength(3);
  });

  test('two worktrees editing the same file are flagged as a conflict', async () => {
    fs.writeFileSync(path.join(wtA, 'shared.txt'), 'from A\n');
    fs.writeFileSync(path.join(wtB, 'shared.txt'), 'from B\n');
    fs.writeFileSync(path.join(wtA, 'only-a.txt'), 'a only\n');
    const report = await detectConflicts(project);
    expect(report.conflicts.map((c) => c.file)).toContain('shared.txt');
    const sharedConflict = report.conflicts.find((c) => c.file === 'shared.txt')!;
    expect(sharedConflict.worktrees).toHaveLength(2);
    // only-a.txt touches one worktree only — not a conflict.
    expect(report.conflicts.some((c) => c.file === 'only-a.txt')).toBe(false);
  });

  // ONE POPULATION, ONE FIGURE. The count rendered under the Conflicts header has to be the
  // count this sweep actually skipped — the §0 corollary the Fleet headline broke when it
  // drew a numerator from projects and a denominator from launchers. listWorktrees is called
  // again here, independently of the collector, and the partition is checked against it.
  test('excluded.count + swept worktrees === every non-main worktree, counted independently', async () => {
    const report = await detectConflicts(project);
    const nonMain = listWorktrees(project).filter((w) => !w.isMain);
    expect(nonMain.length).toBeGreaterThan(0); // the arithmetic below is not 0 === 0
    expect(report.worktrees.length + report.excluded.count).toBe(nonMain.length);
    // Both fixture worktrees are named by .worktrees/.registry, so nothing is excluded here.
    expect(report.worktrees).toHaveLength(2);
    expect(report.excluded.count).toBe(0);
  });

  test('a worktree the registry does not name is excluded, and the exclusion is reported', async () => {
    // The real machine shape, in miniature: a hand-made worktree nobody's registry knows
    // about. Before PR4 the sweep took all of them — 285 on this machine, of which 30 are
    // agent-started — and said nothing about having done so.
    const handMade = path.join(root, '.worktrees', 'hand-made-by-a-human');
    addWorktree(root, handMade, 'hand-made-by-a-human');
    const report = await detectConflicts(project);

    expect(report.worktrees.map((w) => w.path)).not.toContain(handMade);
    expect(report.excluded.count).toBe(1);

    // THE COUNT IS A FIELD; THE REASON IS A CONSTANT. They were fused into one interpolated
    // sentence ("1 of 3 non-main worktrees are not swept: …"), which meant the view either
    // restated the explanation or rendered a count it had already computed itself. It also
    // ended with "…cost 17 seconds per request" — a hardcoded measurement of the synchronous
    // sweep this PR deleted, and one that would have been asserted about any fleet size.
    expect(report.excluded.reason).toBe(EXCLUDED_REASON);
    expect(report.excluded.reason).toContain('.worktrees/.registry');
    expect(report.excluded.reason).not.toMatch(/\d/); // no counts, and no durations
  });
});

// ── THE SWEEP MUST NOT BLOCK THE EVENT LOOP ──────────────────────────────────────────
//
// THE HEADLINE FIX OF THIS PR WAS PINNED BY NOTHING. A reviewer reverted changedFilesFor to
// execFileSync — reintroducing the full 17,007 ms stall — and all 140 tests passed with tsc
// clean. Every test asserted on the CONTENT of the report, which a synchronous implementation
// produces identically; the source-text guard only ever looked for a *shell*, and the async
// conversion was deliberately made invisible to it. §0 exactly: the second barrier was built
// and there was never a first one.
//
// So this asserts the OBSERVABLE PROPERTY — not source text, not wall-clock cost: while the
// sweep is in flight, the event loop still runs other work. That is the entire reason the
// conversion exists (a blocking sweep stalls the SSE tick for every connected client), and it
// is false for any implementation that does its subprocess work synchronously, however fast
// that work happens to be against a fixture.
describe('the conflicts sweep leaves the event loop free', () => {
  const parent = mkTmpDir('mc-async-proof-');
  cleanupDirs.push(parent);
  const root = path.join(parent, 'proj');
  initGitRepo(root);
  const registry: { name: string; token: string }[] = [];
  // Several worktrees, so a synchronous implementation has a real block to produce and the
  // measurement is not decided by a single process spawn. Six measures ~71 ms of blocking
  // git calls on this machine, comfortably above timer noise.
  const WORKTREES = 6;
  for (let i = 1; i <= WORKTREES; i++) {
    const wt = path.join(root, '.worktrees', `ceo-${i}-${i}00`);
    addWorktree(root, wt, `ceo-${i}-${i}00`);
    fs.writeFileSync(path.join(wt, 'shared.txt'), `from ${i}\n`);
    registry.push({ name: `ceo-${i}`, token: `${i}00` });
  }
  writeRegistry(root, registry);
  const claudeRoot = mkTmpDir('mc-async-proof-claude-');
  cleanupDirs.push(claudeRoot);
  const project = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find((p) => p.root === root)!;

  test('a timer queued before the sweep runs BEFORE the sweep resolves', async () => {
    let timerFired = false;
    let timerFiredBeforeSweep = false;

    // A macrotask with no delay. It cannot run until the call stack unwinds, so if any part of
    // the sweep blocks — execFileSync anywhere in the path, listWorktrees included — this does
    // not fire until the whole sweep is over and the flag below is false.
    const timer = new Promise<void>((resolve) => {
      setTimeout(() => {
        timerFired = true;
        resolve();
      }, 0);
    });

    const sweep = detectConflicts(project).then((r) => {
      timerFiredBeforeSweep = timerFired;
      return r;
    });

    const [report] = await Promise.all([sweep, timer]);

    expect(timerFiredBeforeSweep).toBe(true);
    // And the sweep really did the work — this is not passing because it returned early.
    expect(report.worktrees).toHaveLength(WORKTREES);
    expect(report.conflicts.map((c) => c.file)).toContain('shared.txt');
  });

  // A THIRD TEST STOOD HERE — `syncPrefixMs < totalMs / 2` — AND IT IS DELETED, NOT LOOSENED.
  //
  // It was introduced as "a second, independent reading of the same property". It was
  // neither. It passed under all three ways of breaking the property it named: blocking in
  // changedFilesFor, blocking in listWorktreesAsync, and blocking in both — measured
  // independently by the lead and by the correctness reviewer, across three commits, zero
  // firings. A barrier that has never fired under any real mutation is worse than none,
  // because it is counted as coverage and makes the test beside it look corroborated. That
  // is the "two green checks over one untested capability" pattern already in DECISIONS.md.

  // THE TIMER TEST ABOVE IS NOT ENOUGH, and that is measured rather than suspected.
  //
  // Both observe only the window BEFORE the first `await`. Reverting `changedFilesFor` alone
  // to execFileSync — the exact C1 revert the reviewer performed — leaves
  // `await listWorktreesAsync(…)` in front of it, so the loop yields once, the queued timer
  // fires, the prefix records 0.4 ms, and BOTH tests pass while the sweep blocks for ~71 ms
  // immediately afterwards. Verified with that revert applied: `bun test -t "event loop"`
  // reported 2 pass / 0 fail. A test that only watches the start of a function cannot speak
  // for the middle of it.
  //
  // So this samples the loop THROUGHOUT the sweep and takes the worst gap between successive
  // ticks. A blocking call anywhere — before the first await, between awaits, or inside a
  // `.map` whose callbacks run synchronously — appears as one long gap.
  //
  // THE SAMPLER IS setImmediate, NOT setInterval(…, 1), and that is the difference between a
  // test that works and one that only works on a slow machine. The first version used a 1 ms
  // interval. It caught the revert here (71.6 ms gap of an 83.3 ms sweep) and then FAILED ON
  // CI against the CORRECT implementation: that runner sweeps six worktrees in 6.9 ms, too
  // short for a 1 ms timer to resolve, so it recorded a 6.3 ms "gap" spanning nearly the
  // whole sweep and the ratio assertion went red. Its validity depended on the machine being
  // slow enough to observe — a property of the runner, not of the code, which is precisely a
  // mechanism reporting about something it could not measure. A self-rescheduling
  // setImmediate fires as fast as the loop allows, so the resolution scales with the machine
  // instead of being fixed at 1 ms.
  //
  // The trailing macrotask is load-bearing too, and its absence was a bug in that same first
  // version: when the sweep resolves, the continuation and the sampler teardown run as
  // MICROTASKS, which drain before the loop reaches the timers phase — so the tick that would
  // record the big gap never fires. That version reported a 2.4 ms maximum against an
  // implementation blocking for 71 ms.
  // THE DENOMINATOR IS A SYNCHRONOUS CONTROL, NEVER THE RUN'S OWN TOTAL — and that is the
  // difference between this version and the two before it.
  //
  // `maxGap < total / 2` cannot catch blocking work that INFLATES ITS OWN DENOMINATOR. The
  // block is part of the total it is measured against, and the sweep fires six concurrent
  // spawns besides, so a single blocking phase is structurally almost guaranteed to land
  // under half. That is arithmetic, not tuning. Measured: with listWorktreesAsync reverted
  // alone, the sampler SAW the block (15.3 ms against a 2.5-5.8 ms baseline) and the ratio
  // permitted it — 15.3 of 38.9 is 0.39. On the real 19-project fleet the same mutation held
  // the loop for 359 ms of an 897 ms request, ratio 0.40, and the assertion still said pass.
  // A 359 ms contiguous stall on the control plane, rendered as "fine" by a six-worktree
  // fixture.
  //
  // An absolute millisecond bound has the opposite failure: this machine sweeps in ~36 ms and
  // the CI runner in 14 ms, so any number calibrated here is either red there or asleep here.
  //
  // So the run measures BOTH implementations, in the same process, on the same fixture,
  // under the same load: the real async sweep, and a deliberately synchronous control doing
  // the same git calls sequentially. The control is a fixture, never shipped code, and it is
  // what a blocking implementation looks like on THIS machine right now. Asserting the async
  // stall is a small fraction of the control's stall needs no magic number and no
  // calibration: on a fast runner both shrink together, here both grow together, and the
  // separation holds. It also enforces the whole mutation matrix by construction — revert
  // either half of the conversion and the "async" measurement converges on the control.
  test('the sweep stalls the event loop far less than a synchronous implementation of the same work', async () => {
    let gaps: number[] = [];
    let last = performance.now();
    let sampling = true;
    const sample = () => {
      if (!sampling) return;
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      setImmediate(sample);
    };
    const worstGapSince = () => {
      const worst = Math.max(...gaps, 0);
      gaps = [];
      last = performance.now();
      return worst;
    };
    /** One macrotask of grace, so the timer phase runs and records the gap just created. */
    const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

    setImmediate(sample);
    await new Promise((resolve) => setTimeout(resolve, 20)); // warm-up, discarded

    // IDLE CONTROL — nothing under test running. Whatever the loop does here is this
    // process's own background noise: a property of the ENVIRONMENT, not a result of the code
    // under test, which is what makes gating on it legitimate (test/gate.ts). Observed real:
    // under the full suite another file's synchronous work contributed a 42.5 ms gap.
    await new Promise((resolve) => setTimeout(resolve, 30));
    const idleNoiseMs = worstGapSince();

    // THREE ROUNDS — INTERLEAVED AND REPEATED. A single-round measurement cannot see its own
    // variance: on CI (git ~2ms, async stall ~6ms, control ~13ms, ratio 0.460), one OS
    // pre-emption during the sweep inflates asyncStallMs from 6ms to 10ms without raising the
    // idle measurement taken before it. The existing idle gate does not fire (idleNoiseMs was
    // low when measured) and the ratio goes 0.77 > 0.75, red. Median of three rounds absorbs
    // a single bad round: [10ms, 6ms, 7ms] → median 7ms, passes; a blocking implementation
    // [71ms, 71ms, 71ms] → median 71ms, still fails. The multi-project enumeration test below
    // uses 5 rounds for the same reason; three suffice here because each round is shorter.
    // INTERLEAVED, so a machine that slows or quickens mid-test moves async and control together.
    const asyncStalls: number[] = [];
    const controlStalls: number[] = [];
    const sweepMsByRound: number[] = [];
    let report!: Awaited<ReturnType<typeof detectConflicts>>;
    let sweptPaths: string[] = [];
    const ROUNDS = 3;

    for (let round = 0; round < ROUNDS; round++) {
      // THE MEASUREMENT — the real, shipped sweep.
      const t0 = performance.now();
      report = await detectConflicts(project);
      sweepMsByRound.push(performance.now() - t0);
      await settle();
      asyncStalls.push(worstGapSince());

      // THE CONTROL — the same git calls, sequential and synchronous. This is the blocking
      // implementation, measured each round so load changes move both terms together.
      if (round === 0) sweptPaths = report.worktrees.map((w) => w.path);
      for (const wt of sweptPaths) {
        execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: wt, encoding: 'utf8' });
      }
      await settle();
      controlStalls.push(worstGapSince());
    }
    sampling = false;

    // MEDIAN FOR BOTH, and the asymmetry of the multi-project test (max for subject, median for
    // environment) does not apply here: at one project the status-phase subject's stall is one
    // spawn syscall, not N concurrent ones, so a per-round max is already the round's answer.
    const asyncStallMs = median(asyncStalls);
    const controlStallMs = median(controlStalls);
    const asyncRound = asyncStalls.indexOf(asyncStallMs);

    // eslint-disable-next-line no-console
    console.log(
      `  [async] status-phase stall: async median ${asyncStallMs.toFixed(1)}ms ` +
        `(round ${asyncRound + 1}, sweep ${sweepMsByRound[asyncRound]!.toFixed(1)}ms, ` +
        `all ${asyncStalls.map((x) => x.toFixed(1)).join('/')}ms) · ` +
        `sync control median ${controlStallMs.toFixed(1)}ms ` +
        `(all ${controlStalls.map((x) => x.toFixed(1)).join('/')}ms) · ` +
        `idle noise ${idleNoiseMs.toFixed(1)}ms · ratio ${(asyncStallMs / controlStallMs).toFixed(3)}`
    );

    expect(report.worktrees).toHaveLength(WORKTREES); // the sweep really ran
    expect(sweptPaths).toHaveLength(WORKTREES); // …and the control did the same work

    // NON-VACUITY: the control must have really blocked. If it did not, the fixture did no
    // work worth measuring and the comparison below means nothing.
    expect(controlStallMs).toBeGreaterThan(1);

    // Environment gate, on the environment and never on the result: if the process was
    // already stalling comparably to the control before anything ran, no gap can be
    // attributed to the sweep.
    if (idleNoiseMs > controlStallMs / 4) {
      notVerified(
        'sweep event-loop binding',
        `this process was already blocking for ${idleNoiseMs.toFixed(1)}ms at a time while idle, against a ` +
          `${controlStallMs.toFixed(1)}ms synchronous control — the loop is too noisy here to attribute a stall to ` +
          'the sweep'
      );
      return;
    }

    // THE BOUND IS 0.75, AND THE QUANTITY THAT DECIDES IT IS GIT'S SPEED. The async sweep's
    // worst stall is not zero: `swept.map(…)` issues every spawn in one synchronous turn, so
    // it is N x the spawn syscall, while the control is N x (spawn + wait). The baseline
    // ratio is therefore
    //
    //     spawn / (spawn + wait)
    //
    // which is a property of the machine, not of the code:
    //
    //   this machine (git ~12 ms):  async 2.6 ms · control 70.0 ms · ratio 0.037
    //   CI runner    (git  ~2 ms):  async 6.0 ms · control 13.1 ms · ratio 0.460
    //
    // An eighth held here and was RED ON CI against correct code. 0.75 holds on both and
    // still fails hard on the mutations this test binds: changedFilesFor blocking lands at
    // 1.02, both blocking at 1.27.
    //
    // THE RESIDUAL RISK IS FALSE-RED, NOT FALSE-GREEN, and the variable is git speed rather
    // than load: a runner with faster git or slower process spawning pushes the baseline
    // ratio UP toward the bound, and CI's 1.6x margin is thinner than this machine's 20x. If
    // this goes red on a new runner, read the three printed numbers before touching the
    // threshold — a baseline ratio drifted to ~0.7 means spawn now costs as much as git, not
    // that the sweep regressed.
    //
    // This test binds the STATUS phase. The enumeration phase — one `git worktree list` per
    // project, which is where reverting listWorktreesAsync does its damage — is bound by the
    // multi-project test below, because at one project that phase is a single git call.
    expect(asyncStallMs).toBeLessThan(controlStallMs * 0.75);
  });

  // NAMED FROM ITS BODY. This reads the source text of ONE file and checks that it does not
  // NAME the synchronous helpers. That is all it does, and it is worth having: reverting the
  // call site in conflicts.ts is the most likely accidental regression, it is what a careless
  // merge produces, and this fires on it deterministically on every machine.
  //
  // WHAT IT DOES NOT DO — and an earlier version of this comment claimed it bound the
  // enumeration mutation outright, which was wrong twice over. The mutation the reviewer ran
  // edits `worktrees.ts`, not this file, so nothing here reads it at all. And the pin was
  // defeated three ways, all tsc-clean: an aliased import (`listWorktrees as readWorktrees`,
  // one `as`), a new module re-exporting the same enumeration (full suite green, 157 pass),
  // and the computed-property shape from F5. The first two are what PR5 unifying the two
  // listers looks like on an ordinary Tuesday.
  //
  // The enumeration phase is bound BEHAVIOURALLY by the multi-project test below. This is
  // the cheap literal check beside it, not a substitute for it.
  test('conflicts.ts calls no synchronous git helper AT ITS OWN CALL SITES', () => {
    const source = fs.readFileSync(
      path.join(import.meta.dir, '..', 'server', 'collectors', 'conflicts.ts'),
      'utf8'
    );
    const code = source
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n');

    // Matched tokens rather than the whole file, so a failure names the offending call
    // instead of printing 250 lines of source into the test output.
    //   listWorktrees(  — the sync lister, whose `catch { return [] }` is why C2 existed and
    //                    which puts a blocking git call in front of every project on the route
    //   execFileSync    — in any spelling, including an aliased import
    const syncGitCalls = [...code.matchAll(/\blistWorktrees\s*\(|\bexecFileSync\b/g)].map((m) => m[0]);
    expect(syncGitCalls).toEqual([]);

    // …and the async forms ARE used, so this cannot pass because the file stopped calling git.
    expect(code).toMatch(/\blistWorktreesAsync\s*\(/);
    expect(code).toMatch(/\bexecFileAsync\s*\(/);
  });
});

// ── THE ENUMERATION PHASE, WHERE THE OTHER HALF OF THE CONVERSION LIVES ───────────────
//
// I argued that no timing test at fixture scale could bind a synchronous enumeration, and
// that was wrong. The claim rested on "more projects enlarge the baseline spawn burst too" —
// true, and irrelevant: BOTH terms scale linearly with the project count, so the ratio is
// scale-INVARIANT. Baseline stays spawn/(spawn+wait); a synchronous enumeration goes to 1.0.
//
// The real defect in my fixture was its SHAPE, not its size. One project with six worktrees
// puts the enumeration phase at exactly one git call, so it scaled the wrong axis. Twelve
// projects with one worktree each scales the right one, and the control measures THE
// ENUMERATION PHASE ONLY — one `git worktree list` per project, sequentially — rather than
// the status phase the test above already covers.
//
// Measured by the reviewer, reproduced here:
//   baseline            async   9.5 ms · control 129.5 ms · ratio 0.074
//   listWorktrees sync  async 141.1 ms · control 138.7 ms · ratio 1.018
// which the existing 0.75 bound separates with 10x margin below and 1.4x above — no new
// threshold, same instrument. This is what actually binds the enumeration half; the
// structural pin above catches only the call-site revert in one file.
describe('enumerating many projects leaves the event loop free', () => {
  /**
   * TWELVE — AND BOTH LEVERS FOR MAKING THE RUNNER ABLE TO RESOLVE THIS WERE TRIED THERE AND
   * MEASURED TO FAIL. Written down so the next reader does not spend the afternoon I did.
   *
   * 1. MORE WORK PER SPAWN. Unavailable: `git worktree list --porcelain` is irreducibly
   *    spawn-dominated. Measured — 1 / 8 / 24 worktrees in a repo cost 31.8 / 33.7 / 38.2 ms
   *    per call, so twenty-four times the subject buys twenty percent more time. No fixture
   *    SHAPE makes this command's work outweigh its own startup.
   *
   * 2. MORE CHILDREN. The argument was that `async / control` is scale-invariant — true, and
   *    what makes 0.75 valid anywhere — while the room correct code has, `0.75 * control -
   *    floor`, is a fixed positive quantity per child and so grows linearly with N, against a
   *    resolution that stays put. The first half is right. The second is not:
   *
   *      N=12   control 19.6ms  floor 10.4ms  room 4.3ms  resolution 3.3ms
   *      N=48   control 73.3ms  floor 46.3ms  room 8.7ms  resolution 9.7ms
   *
   *    Room doubled and NOISE TRIPLED. Worse, the ratio at N=48 measured 0.784 on correct
   *    code — above the 0.750 line, the exact red this change exists to remove, arriving from
   *    the direction I had just argued would fix it. It also cost fifteen seconds of local
   *    suite time to buy that.
   *
   * So the pin enforces where the difference can be resolved — a developer machine, ratio
   * 0.141 against a mutated 1.136 — and says so honestly where it cannot. The bound is
   * untouched at 0.75. This is not a loosened threshold; it is a refusal to report a coin
   * toss as a verdict.
   */
  const PROJECTS = 12;
  const parent = mkTmpDir('mc-enum-scale-');
  cleanupDirs.push(parent);
  const claudeRoot = mkTmpDir('mc-enum-scale-claude-');
  cleanupDirs.push(claudeRoot);

  for (let i = 0; i < PROJECTS; i++) {
    const root = path.join(parent, `proj-${i}`);
    initGitRepo(root);
    const wt = path.join(root, '.worktrees', `ceo-1-${i}`);
    addWorktree(root, wt, `ceo-1-${i}`);
    writeRegistry(root, [{ name: 'ceo-1', token: String(i) }]);
    fs.writeFileSync(path.join(wt, 'touched.txt'), 'x\n');
  }
  const projects = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot });

  test('sweeping N projects stalls the loop far less than enumerating them synchronously', async () => {
    expect(projects).toHaveLength(PROJECTS); // the fixture is the shape this test needs

    let gaps: number[] = [];
    let last = performance.now();
    let sampling = true;
    const sample = () => {
      if (!sampling) return;
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      setImmediate(sample);
    };
    const worstGapSince = () => {
      const worst = Math.max(...gaps, 0);
      gaps = [];
      last = performance.now();
      return worst;
    };
    const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

    setImmediate(sample);
    await new Promise((resolve) => setTimeout(resolve, 20)); // warm-up, discarded
    await new Promise((resolve) => setTimeout(resolve, 30));
    const idleNoiseMs = worstGapSince();

    // THREE QUANTITIES, MEASURED REPEATEDLY AND INTERLEAVED.
    //
    //   async   — the sweep, the way the route does it: concurrently
    //   control — the ENUMERATION PHASE ONLY, sequential and synchronous: exactly what
    //             reverting listWorktreesAsync produces, and nothing else
    //   floor   — THE CONFOUND THIS TEST WAS NOT MEASURING, and the reason it flaked. Both
    //             paths pay the same synchronous cost of ASKING for twelve children; the
    //             parent's side of a spawn is synchronous wherever it happens. The control's
    //             stall is that floor PLUS the blocking wait, the async path's is the floor
    //             and nothing else — so as git's real work shrinks the floor becomes most of
    //             both terms and the ratio walks toward 1 with nothing wrong. It is the SAME
    //             twelve commands in the same directories, asked for concurrently instead of
    //             blocked on; not `git --version`, which skips repo discovery and would
    //             under-state it.
    //
    // REPEATED, because the flake was variance and one sample cannot see its own. Measured on
    // CI across five runs: 0.613 · 0.622 · 0.655 · 0.746 · 0.835, the last red, against a
    // 0.750 bound — a spread of 0.22 on a quantity being compared to a fixed line.
    //
    // INTERLEAVED, so a machine that slows down halfway through moves all three together
    // rather than making one of them look bad. Medians rather than means: one descheduled
    // iteration should not move the answer, and on this measurement it otherwise would.
    const asyncStalls: number[] = [];
    const controlStalls: number[] = [];
    const floorStalls: number[] = [];
    // PER ROUND, NOT LAST-ROUND SURVIVORS. These were three `let`s reassigned every iteration,
    // so every duration printed below belonged to round 5 while the reported async stall is
    // the max over all five — and the diagnostic then contradicted itself on precisely the
    // regression it exists to report. Captured under the memoised mutation:
    // `async worst 147.6ms (sweep 40.6ms, spread 139.6)` — a 147.6 ms stall inside a 40.6 ms
    // sweep. Whoever reads that during a real regression disbelieves the number, and a
    // diagnostic nobody believes is worse than no diagnostic.
    const sweepMsBy: number[] = [];
    const controlMsBy: number[] = [];
    const floorMsBy: number[] = [];
    let reports: Awaited<ReturnType<typeof detectConflicts>>[] = [];
    const ROUNDS = 5;

    for (let round = 0; round < ROUNDS; round++) {
      const t0 = performance.now();
      reports = await Promise.all(projects.map((p) => detectConflicts(p)));
      sweepMsBy.push(performance.now() - t0);
      await settle();
      asyncStalls.push(worstGapSince());

      const c0 = performance.now();
      for (const p of projects) {
        execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: p.root, encoding: 'utf8' });
      }
      controlMsBy.push(performance.now() - c0);
      await settle();
      controlStalls.push(worstGapSince());

      // THE REJECTION IS CAUGHT, because what is timed here is the cost of ASKING, not the
      // answer. At this concurrency a spawn can fail with EAGAIN, and an uncaught rejection
      // takes the whole suite down with "Unhandled error between tests" — which is how the
      // first run at this project count failed, my defect and not the collector's. Whether a
      // child succeeded is `detectConflicts`'s business and is asserted above.
      const f0 = performance.now();
      await Promise.all(
        projects.map((p) =>
          execFileAsync('git', ['worktree', 'list', '--porcelain'], { cwd: p.root, encoding: 'utf8' }).catch(
            () => undefined
          )
        )
      );
      floorMsBy.push(performance.now() - f0);
      await settle();
      floorStalls.push(worstGapSince());
    }
    sampling = false;

    const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);

    // MAX FOR THE SUBJECT, MEDIAN FOR THE ENVIRONMENT, and the difference is the question
    // each one answers. "Did this ever block" is a question about the WORST round, so a
    // median is the wrong reducer for it: a memoised lister that blocks only on a cache miss
    // — an ordinary optimisation, a shape that already exists twice in this repo — puts one
    // slow round among four warm ones, and the median reports the warm ones. Measured by the
    // review lens: 5 runs of 5 rounds, ratio 0.081-0.153, `1 pass 0 fail` on an
    // implementation that blocks 350 ms on every cold path.
    //
    // The control and the floor are measurements OF THIS MACHINE, where a median is right:
    // one descheduled round should not move an environment estimate.
    // THE GATE'S VERDICT, TAKEN ONCE AND USED EVERYWHERE — the diagnostic below prints the
    // same numbers the gate decides on, because two computations of one quantity is how the
    // printed line and the enforced line drift apart. See test/gate.ts for why this is a pure
    // function rather than four lines here: its withhold branch had never fired.
    const gate = stallGateVerdict(controlStalls, floorStalls, PROJECTS);

    const asyncStallMs = Math.max(...asyncStalls);
    // `gate.controlStallMs`, not a second `median(controlStalls)`. It was computed twice —
    // identical today across 20,163 differential cases, which makes it a consistency question
    // rather than a defect, and exactly the duplicate this file already removed for the floor.
    const controlStallMs = gate.controlStallMs;
    const floorStallMs = median(floorStalls); // the DIAGNOSTIC's floor; the gate reads the max

    // WHICH ROUND EACH REPORTED STALL CAME FROM, so every duration printed beside a stall is
    // that same round's duration and the line cannot contradict itself. `median` returns an
    // element of the array rather than an interpolation, so both lookups find a real round.
    const asyncRound = asyncStalls.indexOf(asyncStallMs);
    const controlRound = controlStalls.indexOf(controlStallMs);
    const floorRound = floorStalls.indexOf(floorStallMs);

    // eslint-disable-next-line no-console
    console.log(
      `  [async] ${PROJECTS} projects x${ROUNDS} — async WORST ${asyncStallMs.toFixed(1)}ms ` +
        `(round ${asyncRound + 1}, sweep ${sweepMsBy[asyncRound]!.toFixed(1)}ms, spread ` +
        `${spread(asyncStalls).toFixed(1)}) · sync enumeration control MEDIAN ${controlStallMs.toFixed(1)}ms ` +
        `(round ${controlRound + 1}, ${controlMsBy[controlRound]!.toFixed(1)}ms, spread ` +
        `${spread(controlStalls).toFixed(1)}) · spawn floor MEDIAN ${floorStallMs.toFixed(1)}ms ` +
        `(round ${floorRound + 1}, ${floorMsBy[floorRound]!.toFixed(1)}ms, spread ` +
        `${spread(floorStalls).toFixed(1)}, worst ${gate.ceilingMs.toFixed(1)}ms — the gate reads this) · ` +
        `idle noise ${idleNoiseMs.toFixed(1)}ms · ratio ${(asyncStallMs / controlStallMs).toFixed(3)}`
    );

    expect(reports).toHaveLength(PROJECTS); // every project really was swept
    expect(reports.every((r) => r.enumerated.readable)).toBe(true); // …and really enumerated
    expect(controlStallMs).toBeGreaterThan(1); // NON-VACUITY: the control really blocked

    if (idleNoiseMs > controlStallMs / 4) {
      notVerified(
        'enumeration event-loop binding',
        `this process was already blocking for ${idleNoiseMs.toFixed(1)}ms at a time while idle, against a ` +
          `${controlStallMs.toFixed(1)}ms synchronous control — too noisy here to attribute a stall to the sweep`
      );
      return;
    }

    // THE FLOOR AS A GATE, DELIBERATELY NOT AS A DIVISOR. Subtracting it from both terms —
    // `(async - floor) / (control - floor)` — is arithmetically tidy and numerically wrong
    // here: where the floor is most of both terms it divides two small differences of noisy
    // quantities, so the variance explodes and the bound flakes HARDER than the one it
    // replaces, in the direction that reads as a real failure. Read as a gate instead, the
    // same quantity fails safe.
    //
    // EVERY INPUT TO THIS GATE IS AN ENVIRONMENT MEASUREMENT, and it took a review to make
    // that true. An earlier version of this comment claimed both inputs were
    // mutation-independent. THERE WERE THREE, and the third was `spread(asyncStalls)` — the
    // subject's own variance, taken straight from `detectConflicts`. So the code under test
    // could widen the gate and hide behind it, and it did:
    //
    //   plain sync revert     13 runs, 12 caught, ONE ESCAPED — spread 174.8ms against
    //                         244ms of headroom, gate fired, `1 pass 0 fail` with a
    //                         blocking enumeration, on the machine with the MOST headroom
    //   memoised lister       blocks on a cache miss, async on a hit — an ordinary
    //                         optimisation, a shape this repo already has twice — escaped
    //                         5 runs out of 5
    //
    // That is a false-GREEN, and the flake this PR replaced was a false-RED. For a guarantee
    // the first is strictly worse, and it is not a trade I would have taken knowingly.
    //
    // THERE IS NO RESOLUTION TERM AT ALL. An earlier revision of this comment said it was
    // "now the spread of the CONTROL and the FLOOR only", which was false as written and
    // contradicted by the paragraph below it: the variance term was removed outright, not
    // narrowed. Two claims about one gate, disagreeing silently, which is the failure this
    // file keeps having.
    //
    // AND "NOTHING THE SUBJECT DOES CAN MOVE THIS THRESHOLD" WAS FALSE TOO — SYNTACTICALLY
    // TRUE, CAUSALLY REFUTED, and this is the honest statement of what the gate binds. No
    // gate input reads a value `detectConflicts` returned; that was verified by trace. It
    // leaks through the MACHINE instead. A review lens built a stale-while-revalidate lister
    // — the async answer returned immediately, a synchronous `execFileSync` revalidation
    // fired later on a timer — and measured:
    //
    //   revalidate at 100 ms    1 of 4 runs caught, 3 escaped
    //   revalidate at 220 ms    4 of 4 `1 pass 0 fail`, FULLY INVISIBLE — and the leak RAISED
    //                           the gate. Landing inside the control window, it pushed
    //                           median(control) 129 -> 190 ms, so lineMs went 96 -> 143 ms.
    //                           The code under test widened its own pass bound by ~48%.
    //
    // SO THE GENERAL RULE IS BIGGER THAN THE ONE THIS PR FIXED. Not merely "any statistic
    // computed from the subject's own timings is under the subject's influence" — also ANY
    // STATISTIC TAKEN FROM A WINDOW THE SUBJECT MAY STILL BE RUNNING IN. Removing the
    // variance term closed the escape that existed. No reducer and no fixture closes the
    // class, because the contamination is causal rather than arithmetic; only an instrument
    // with no clock does, which is #45 — intercept `child_process` and assert the specific
    // `*Sync` exports were never called.
    //
    // WHAT THIS TEST BINDS, THEN: an implementation that BLOCKS. It does not bind one that
    // LEAKS synchronous work into a neighbouring measurement window. That is a real limit of
    // any timing instrument and it is stated here rather than in a PR body, because this is
    // where the next person will look.
    //
    // THE THRESHOLD IS MEASURED, NOT PICKED, AND IT COMPARES LIKE WITH LIKE. The assertion
    // below is on the subject's WORST round, so the question the gate must answer is: how high
    // can a CORRECT implementation's worst round reach? That is the floor, reduced the same
    // way — `max(floorStalls)` — because the floor is exactly what correct code pays and
    // nothing more. The line it must stay under is `0.75 * control`. Requiring the line to be
    // at least twice the floor's worst round says, in the machine's own numbers, that a pass
    // is a pass rather than a coin landing well.
    //
    // AN EARLIER VERSION COMPARED HEADROOM AGAINST `max - min` ACROSS ROUNDS, and that
    // estimator is the reason two mutations still escaped after the subject's own term was
    // removed: one slow round inflates a range without limit, and measured here, a control
    // spread of 160.9ms and one of 426.0ms fired the gate while the mutation sat in plain
    // sight at ratio 1.192 and 1.247. A range over five samples is not a dispersion estimate,
    // it is the worst thing that happened; the median control is stable across those same
    // runs (363-399ms) precisely because a median is not.
    // THE ARITHMETIC IS IN test/gate.ts AND ITS BRANCHES ARE UNIT-TESTED THERE. It used to be
    // four lines here, and the withhold branch had never executed — in 20 clean runs or in any
    // of eight mutations. Reaching it through a real measurement needs a genuinely marginal
    // machine, which a suite cannot arrange; as a pure function it takes synthetic samples.
    if (!gate.resolves) {
      notVerified('enumeration event-loop binding', gate.reason!);
      return;
    }

    // Same bound as the status-phase test, for the same reason and with the same failure
    // direction. Both terms scale with PROJECTS, so this holds on any machine.
    //
    // `gate.lineMs` rather than a second `controlStallMs * 0.75`: the bound the assertion
    // enforces is now literally the bound the gate cleared, not a copy of it that agrees today.
    expect(asyncStallMs).toBeLessThan(gate.lineMs);
  }, 120_000); // EXPLICIT, because three rounds over 48 projects exceeds bun's 5s default —
  // which is how this first failed at the larger count: the runner SIGTERMed the child mid-
  // measurement and the error read as a git failure rather than as a test timeout.
});

// ── THE PROJECT PROBE, SAME SHAPE AS THE ENUMERATION PIN ──────────────────────────────
//
// projectEmptyState shelled out to a recursive grep with execFileSync. Measured 2026-08-14,
// the probe alone, independently of Mission Control:
//
//   agentvibe (1.1 GB)      331 ms
//   Beamix    (34 GB)   107,806 ms
//
// and `GET /api/project/Beamix` was 113,158 ms end to end with 100% of it synchronous. The
// brief carried 3,657 ms for that project; the real figure is thirty times larger.
//
// The lesson the enumeration fixture taught, applied directly: the CONTROL MUST ISOLATE THE
// PHASE THE MUTATION LIVES IN, and the ratio must be scale-invariant. So the control here is
// the grep phase only — one synchronous probe per project, sequentially — against N projects
// probed concurrently. Both terms scale linearly with N, so the ratio is a property of the
// code and not of the fixture size or the machine: baseline stays spawn/(spawn+scan), a
// synchronous probe goes to 1.0. Same 0.75 bound as the other two, same instrument, same
// false-RED-not-false-green failure direction.
describe('probing many projects leaves the event loop free', () => {
  const PROBE_PROJECTS = 10;
  const parent = mkTmpDir('mc-probe-scale-');
  cleanupDirs.push(parent);
  const claudeRoot = mkTmpDir('mc-probe-scale-claude-');
  cleanupDirs.push(claudeRoot);

  for (let i = 0; i < PROBE_PROJECTS; i++) {
    const root = path.join(parent, `proj-${i}`);
    initGitRepo(root);
    // Enough files that one grep is a measurable scan rather than pure process startup —
    // otherwise the control does no real work and the comparison is vacuous.
    const src = path.join(root, 'src');
    fs.mkdirSync(src, { recursive: true });
    for (let f = 0; f < 120; f++) {
      fs.writeFileSync(path.join(src, `file-${f}.ts`), `// fixture ${f}\n${'const x = 1;\n'.repeat(40)}`);
    }
  }
  const projects = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot });

  test('probing N projects stalls the loop far less than probing them synchronously', async () => {
    expect(projects).toHaveLength(PROBE_PROJECTS); // the fixture is the shape this test needs

    let gaps: number[] = [];
    let last = performance.now();
    let sampling = true;
    const sample = () => {
      if (!sampling) return;
      const now = performance.now();
      gaps.push(now - last);
      last = now;
      setImmediate(sample);
    };
    const worstGapSince = () => {
      const worst = Math.max(...gaps, 0);
      gaps = [];
      last = performance.now();
      return worst;
    };
    const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

    setImmediate(sample);
    await new Promise((resolve) => setTimeout(resolve, 20)); // warm-up, discarded
    await new Promise((resolve) => setTimeout(resolve, 30));
    const idleNoiseMs = worstGapSince();

    // THE MEASUREMENT — every project probed concurrently, as /api/project/:id does one at a
    // time but the loop must survive either way.
    const t0 = performance.now();
    const states = await Promise.all(projects.map((p) => projectEmptyState(p)));
    const probeMs = performance.now() - t0;
    await settle();
    const asyncStallMs = worstGapSince();

    // THE CONTROL — the grep phase only, sequential and synchronous: exactly what the
    // execFileSync implementation produced, and nothing else.
    const c0 = performance.now();
    for (const p of projects) {
      const cmd = projectEmptyStateProbe(p);
      try {
        execFileSync(cmd.cmd, cmd.args, { encoding: 'utf8' });
      } catch {
        /* grep exits 1 on no-match, which is the expected answer for these fixtures */
      }
    }
    const controlMs = performance.now() - c0;
    await settle();
    const controlStallMs = worstGapSince();
    sampling = false;

    // eslint-disable-next-line no-console
    console.log(
      `  [async] ${PROBE_PROJECTS} project probes — async ${asyncStallMs.toFixed(1)}ms (${probeMs.toFixed(1)}ms) · ` +
        `sync grep control ${controlStallMs.toFixed(1)}ms (${controlMs.toFixed(1)}ms) · ` +
        `idle noise ${idleNoiseMs.toFixed(1)}ms · ratio ${(asyncStallMs / controlStallMs).toFixed(3)}`
    );

    expect(states).toHaveLength(PROBE_PROJECTS); // every project really was probed
    expect(states.every((s) => s.readable === undefined)).toBe(true); // …and every probe ran clean
    expect(controlStallMs).toBeGreaterThan(1); // NON-VACUITY: the control really blocked

    if (idleNoiseMs > controlStallMs / 4) {
      notVerified(
        'project probe event-loop binding',
        `this process was already blocking for ${idleNoiseMs.toFixed(1)}ms at a time while idle, against a ` +
          `${controlStallMs.toFixed(1)}ms synchronous control — too noisy here to attribute a stall to the probe`
      );
      return;
    }

    expect(asyncStallMs).toBeLessThan(controlStallMs * 0.75);
  });
});

// ── the probe is bounded, and says so when the bound is hit ───────────────────────────
describe('projectEmptyState stops rather than scanning forever', () => {
  // THE COLLECTOR HITS ITS OWN BOUND. This test previously did not: it called `execFile`
  // directly with a 1 ms budget to show that `killed: true` is the shape — a fact about Node,
  // not about projectEmptyState — and then called the collector with the shipped 10 s bound,
  // which this tree finishes inside, and asserted the OPPOSITE branch. Its own comment
  // conceded that. Coverage agreed: empty.ts 124-134, the whole timeout branch, was never
  // executed, so three mutations left the suite green — the killed branch returning a genuine
  // no-match (the exact defect the bound exists to prevent), `timeout:` deleted outright, and
  // the constant set to 0, which is Node's "no timeout".
  //
  // The bound is now injectable, CLAMPED so injection can only tighten it, and the branch is
  // driven through the real function in milliseconds.
  test('the collector hits its own bound, and says so in the honest three-state', async () => {
    const root = mkTmpDir('mc-probe-timeout-');
    cleanupDirs.push(root);
    // ~4,000 files of real content — enough that a 1 ms budget cannot finish them, on any
    // machine. A MARKER IS PLANTED TOO, so the answer below is not trivially "nothing here":
    // this tree really does contain what the probe looks for, and a completed scan says so.
    for (let d = 0; d < 20; d++) {
      const dir = path.join(root, `d-${d}`);
      fs.mkdirSync(dir, { recursive: true });
      for (let f = 0; f < 200; f++) {
        fs.writeFileSync(path.join(dir, `f-${f}.txt`), 'const x = 1;\n'.repeat(200));
      }
    }
    fs.writeFileSync(path.join(root, 'aaa-marker.md'), 'playbook_stage: build\n');

    const cut = await projectEmptyState({ id: 'huge', root } as Project, { timeoutMs: 1 });
    expect(cut.readable).toBe(false);
    expect(cut.found).toBe(false); // no partial recovery — see the comment in empty.ts
    expect(cut.reason).toContain('1ms'); // the EFFECTIVE bound, not the constant
    expect(cut.reason).toContain('part of the tree was never searched');
    expect(cut.reason).toContain(root);

    // THE MIRROR, and it is what makes the assertions above about the BOUND rather than about
    // this tree: the same probe with the shipped bound completes and finds the marker.
    const completed = await projectEmptyState({ id: 'huge', root } as Project);
    expect(completed.readable).toBeUndefined();
    expect(completed.found).toBe(true);

    // THE LOWER CLAMP. `timeout: 0` is Node's "no timeout", so a caller passing zero would
    // silently get an unbounded scan — the exact condition this option exists to test for.
    // Zero is floored to 1 ms, so it cuts off rather than running free.
    const zero = await projectEmptyState({ id: 'huge', root } as Project, { timeoutMs: 0 });
    expect(zero.readable).toBe(false);
    expect(zero.reason).toContain('1ms');

    // A CALLER'S BAD ARGUMENT IS NOT ATTRIBUTED TO GREP. `Math.max(1, NaN)` is `NaN`, so
    // these all passed straight through the clamp; Node then rejected the spawn with
    // ERR_OUT_OF_RANGE and the catch three-stated it correctly — never unbounded, never a
    // false all-clear — but the reason read "grep exited ERR_OUT_OF_RANGE" for a grep that
    // never ran, in 0 ms. Reporting about something that did not happen, in the file that
    // exists to prevent exactly that.
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 'abc', {}, null] as unknown as number[]) {
      const answered = await projectEmptyState({ id: 'huge', root } as Project, { timeoutMs: bad });
      const where = { bad: String(bad) };
      // Falls back to the default the machine is protected by, so this tree completes.
      expect({ ...where, readable: answered.readable }).toEqual({ ...where, readable: undefined });
      expect({ ...where, found: answered.found }).toEqual({ ...where, found: true });
      expect(answered.reason ?? '').not.toContain('ERR_OUT_OF_RANGE');
      expect(answered.reason ?? '').not.toContain('grep exited');
    }

    // …and `1.9`, the realistic caller: Node refuses a fractional timeout, so it is floored to
    // 1 ms and really does cut the scan off — neither refused nor blamed on grep.
    const fractional = await projectEmptyState({ id: 'huge', root } as Project, { timeoutMs: 1.9 });
    expect(fractional.readable).toBe(false);
    expect(fractional.reason).toContain('1ms');
    expect(fractional.reason).not.toContain('ERR_OUT_OF_RANGE');

    // The upper clamp — a caller cannot lengthen the bound past the constant — is asserted in
    // the FIFO test below, because observing it needs a scan that would otherwise run longer
    // than the constant, and this tree finishes in milliseconds.
  }, 60_000);

  // THE BRANCH ITSELF, driven end to end — which the test above does NOT do. It observes the
  // rejection shape through execFile and then asserts the mirror, so `projectEmptyState`'s
  // killed branch was executed by nothing, which is how a comment claiming partial-stdout
  // recovery survived in it while the code recovered nothing.
  //
  // A FIFO is the deterministic way to make a probe unable to finish: a reader blocks on it
  // forever, so the bound is what ends the scan rather than the size of the tree. The marker
  // is planted in a file that sorts BEFORE the FIFO, so this is also the non-recovery claim's
  // own best case — a real match, matched before the block, and still not in `stdout` when
  // SIGTERM arrives, because grep block-buffers a pipe and `-rl` never fills one.
  test('a probe stopped at the bound reports could-not-look, and recovers no partial match', async () => {
    // GATE ON THE MECHANISM, not on the result: GNU grep skips FIFOs when recursing
    // (`--devices` defaults to reading them only on the command line), so on such a machine
    // there is no way to build a probe that cannot finish, and nothing to measure.
    const gateDir = mkTmpDir('mc-fifo-gate-');
    cleanupDirs.push(gateDir);
    try {
      execFileSync('mkfifo', [path.join(gateDir, 'blocker')]);
    } catch {
      notVerified('probe bound', 'mkfifo is unavailable, so a never-finishing probe could not be constructed');
      return;
    }
    const gateCmd = projectEmptyStateProbe({ id: 'gate', root: gateDir } as Project);
    let blocks = false;
    try {
      await promisify(execFile)(gateCmd.cmd, gateCmd.args, { encoding: 'utf8', timeout: 700 });
    } catch (e) {
      blocks = (e as { killed?: boolean }).killed === true;
    }
    if (!blocks) {
      notVerified(
        'probe bound',
        `${gateCmd.cmd} on this machine skips FIFOs when recursing, so a probe that cannot finish is not constructible here`
      );
      return;
    }

    const root = mkTmpDir('mc-fifo-bound-');
    cleanupDirs.push(root);
    fs.writeFileSync(path.join(root, 'aaa-marker.md'), 'playbook_stage: build\n');
    execFileSync('mkfifo', [path.join(root, 'zzz-blocker')]);

    // ASKED FOR AN HOUR — the upper clamp is what stops it at ten seconds, and this scan
    // would genuinely run forever otherwise, which is the only condition under which that
    // clamp is observable. A caller cannot lengthen the bound that protects the machine.
    const startedAt = Date.now();
    const state = await projectEmptyState({ id: 'blocked', root } as Project, { timeoutMs: 3_600_000 });
    const elapsed = Date.now() - startedAt;

    expect(state.readable).toBe(false);
    expect(state.reason).toContain(`${PROJECT_PROBE_TIMEOUT_MS}ms`); // the constant, not the hour asked for
    expect(state.reason).not.toContain('3600000ms');
    expect(elapsed).toBeLessThan(PROJECT_PROBE_TIMEOUT_MS * 2); // it really did stop at the constant
    expect(state.reason).toContain('part of the tree was never searched');
    // NOT RECOVERED, and the code says so rather than a comment claiming otherwise. Measured
    // directly on a 219 MB tree with the marker first-visited: bun 0 bytes, node 0 bytes.
    expect(state.found).toBe(false);
    expect(state.reason).toContain('nothing it may have matched there was recovered');

    // NON-VACUITY: the bound is what ended this, not a fast failure that never scanned. Half
    // the bound is a floor no spawn error or immediate exit can reach.
    expect(elapsed).toBeGreaterThan(PROJECT_PROBE_TIMEOUT_MS / 2);

    // THE MIRROR: the same tree without the blocker completes, finds the marker, and never
    // claims it was cut short — so the assertions above read the killed branch and not a
    // state this input produces regardless.
    fs.rmSync(path.join(root, 'zzz-blocker'));
    const completed = await projectEmptyState({ id: 'blocked', root } as Project);
    expect(completed.readable).toBeUndefined();
    expect(completed.found).toBe(true);
  }, 60_000);
});

// ── "git would not list them" is not "there are none" ────────────────────────────────
// C2, and it is the level above the three-state: listWorktrees returned [] for a real git
// failure, so a project whose worktrees could not be enumerated produced
// `{worktrees: [], excluded: {count: 0}}` — and the view printed a measured all-clear with
// "0 of 0 not swept" beneath it. The mechanism built to make narrowing visible was itself
// silent about the one case where the entire population is unknown.
// ── A QUOTED PATH IS NOT THE PATH ─────────────────────────────────────────────────────
//
// THE SECOND FABRICATION, AND IT NEEDED NO TRUNCATION AT ALL. parseStatusPorcelain split on
// ` -> ` and never un-C-quoted, so every path git quotes — anything holding a space, a quote,
// a backslash, a control character or a non-ASCII byte — reached the conflict map with its
// quotes and octal escapes still on it. Measured on a four-file fixture, nothing truncated,
// `readable === undefined` throughout: 3 of 4 rendered paths did not exist.
//
//   MISSING  "\"nonascii-caf\\303\\251.ts\""     <- octal escapes, undecoded
//   MISSING  "\"with space.ts\""                 <- quotes, unstripped
//   MISSING  "looking.ts\""                      <- ` -> ` found INSIDE a quoted name
//   EXISTS   "plain.ts"
//
// The third line is the nastiest: a file named `arrow -> looking.ts` is quoted BECAUSE it has
// spaces, and searching for the rename separator finds the one in the name.
describe('parseStatusPorcelain un-C-quotes the paths git quotes', () => {
  // GROUND TRUTH, captured verbatim from `git status --porcelain` (git 2.50.1) against a
  // worktree holding exactly these names. Pinned as the bytes git actually wrote so the
  // decoder is checked against git's format rather than against this test's idea of it —
  // the same technique as the encodeProjectDir pin above.
  const REAL_PORCELAIN =
    [
      '?? "arrow -> looking.ts"',
      '?? "back\\\\slash.ts"',
      '?? "emoji-\\360\\237\\224\\245.ts"',
      '?? "nonascii-caf\\303\\251.ts"',
      '?? plain.ts',
      '?? "quote\\".ts"',
      '?? "tab\\tinside.ts"',
      '?? "with space.ts"',
    ].join('\n') + '\n';

  test('every quoted form decodes to the name on disk', () => {
    expect(parseStatusPorcelain(REAL_PORCELAIN)).toEqual([
      'arrow -> looking.ts', // the arrow is part of the NAME, not a separator
      'back\\slash.ts',
      'emoji-🔥.ts', // \360\237\224\245 — four BYTES of one code point, decoded together
      'nonascii-café.ts', // \303\251 — two bytes of one code point, likewise
      'plain.ts', // unquoted paths still pass through untouched
      'quote".ts',
      'tab\tinside.ts',
      'with space.ts',
    ]);
  });

  // OCTAL ESCAPES ARE BYTES. Decoding each one to its own character yields `Ã©` — a name that
  // does not exist, which is the fabrication moved rather than removed.
  test('a multi-byte code point is decoded from its bytes, not per escape', () => {
    expect(parseStatusPorcelain('?? "caf\\303\\251.ts"\n')).toEqual(['café.ts']);
    expect(parseStatusPorcelain('?? "caf\\303\\251.ts"\n')[0]).not.toContain('Ã');
  });

  // A RAW ASTRAL CHARACTER INSIDE A QUOTED BODY — the shape `core.quotePath=false` produces,
  // pinned as bytes so it is checked without depending on any git config at all.
  //
  // Indexing a JS string yields UTF-16 CODE UNITS, so `🔥` comes back as two lone surrogates,
  // and encoding a lone surrogate gives `EF BF BD` — U+FFFD. Measured through changedFilesFor
  // before the fix, readable === undefined and nothing truncated: `"fire 🔥 space.ts"` parsed
  // to `"fire �� space.ts"`, and 3 of 6 paths named files that do not exist.
  test('a raw astral character inside a quoted path is not destroyed', () => {
    expect(parseStatusPorcelain('?? "fire 🔥 space.ts"\n')).toEqual(['fire 🔥 space.ts']);
    expect(parseStatusPorcelain('?? "math 𝛼 space.ts"\n')).toEqual(['math 𝛼 space.ts']);
    // The replacement character must not appear — that IS the defect's signature.
    expect(parseStatusPorcelain('?? "fire 🔥 space.ts"\n')[0]).not.toContain('�');
    // …and it survives alongside escapes in the same body, which is where index arithmetic
    // over a code-point array could still go wrong.
    expect(parseStatusPorcelain('?? "a\\tb 🔥 caf\\303\\251.ts"\n')).toEqual(['a\tb 🔥 café.ts']);
  });

  // A LEADING BOM IS PART OF THE NAME, and `TextDecoder`'s flag for it is named backwards:
  // `ignoreBOM: false` — the DEFAULT — makes the decoder STRIP a leading U+FEFF, which renames
  // the file. Measured through changedFilesFor with the forced config on: 4 parsed, 2 MISSING.
  // A BOM in the MIDDLE always survived, which is what made this easy to miss.
  test('a leading BOM is kept, not swallowed by the decoder', () => {
    expect(parseStatusPorcelain('?? "\\357\\273\\277bom-lead.ts"\n')).toEqual(['﻿bom-lead.ts']);
    expect(parseStatusPorcelain('?? "\\357\\273\\277 lead bom space.ts"\n')).toEqual(['﻿ lead bom space.ts']);
    expect(parseStatusPorcelain('?? "mid\\357\\273\\277bom.ts"\n')).toEqual(['mid﻿bom.ts']); // never broken
  });

  // THE STATUS FIELD IS FIXED WIDTH, so the path is sliced at a known offset rather than
  // trimmed. `slice(2).trimStart()` ate the first character of any name starting with Unicode
  // whitespace — JS `trimStart` strips the entire WhiteSpace class — and under
  // `core.quotePath=false` git emits such names RAW and unquoted. Measured on the raw form:
  // 6 parsed, 5 MISSING.
  test('a name beginning with Unicode whitespace keeps its first character', () => {
    expect(parseStatusPorcelain('??  nbsp-lead.ts\n')).toEqual([' nbsp-lead.ts']);
    expect(parseStatusPorcelain('?? 　ideographic.ts\n')).toEqual(['　ideographic.ts']);
    expect(parseStatusPorcelain('??  emsp.ts\n')).toEqual([' emsp.ts']);
    expect(parseStatusPorcelain('?? ﻿bom-raw.ts\n')).toEqual(['﻿bom-raw.ts']);
    // …and ordinary names are unaffected, so the slice is not off by one.
    expect(parseStatusPorcelain('?? plain.ts\n')).toEqual(['plain.ts']);
    expect(parseStatusPorcelain(' M src/alpha.ts\n')).toEqual(['src/alpha.ts']);
  });

  // GROUND TRUTH for renames, same capture. Note git's v1 text form is `orig -> new` while
  // `-z` emits the pair in the OPPOSITE order; the new path is the one on disk.
  test('a rename yields the new path, with either side quoted or bare', () => {
    const renames =
      [
        'R  "old caf\\303\\251.ts" -> "new caf\\303\\251.ts"',
        'R  "old plain.ts" -> "new plain.ts"',
        'R  oldsimple.ts -> newsimple.ts',
      ].join('\n') + '\n';
    expect(parseStatusPorcelain(renames)).toEqual(['new café.ts', 'new plain.ts', 'newsimple.ts']);
  });

  // THE MIXED FORM, because git quotes each side independently and a fixture that only ever
  // quotes both would not notice a parser that assumed symmetry.
  test('a rename with only one side quoted parses both ways round', () => {
    expect(parseStatusPorcelain('R  bare.ts -> "new name.ts"\n')).toEqual(['new name.ts']);
    expect(parseStatusPorcelain('R  "old name.ts" -> bare.ts\n')).toEqual(['bare.ts']);
  });

  // An escaped quote must not end the quoted span early.
  test('an escaped quote does not terminate the path', () => {
    expect(parseStatusPorcelain('?? "a\\"b -> c.ts"\n')).toEqual(['a"b -> c.ts']);
  });

  /**
   * `status.showUntrackedFiles=all` appended to whatever the ambient value is, for the tests
   * that deliberately read BARE git. They must not inherit a hostile `=no`, which would empty
   * their fixtures and fail them on their premise instead of on the behaviour under test.
   */
  const forceShowUntrackedAll = () => {
    const ours = "'status.showUntrackedFiles=all'";
    const existing = process.env.GIT_CONFIG_PARAMETERS;
    return existing ? `${existing} ${ours}` : ours;
  };

  /** Every name git has a reason to quote, including the two that broke the decoder. */
  const EXOTIC_NAMES = [
    'plain.ts',
    'with space.ts',
    'nonascii-café.ts',
    'emoji-🔥.ts',
    // BOTH A SPACE AND AN ASTRAL CHARACTER, which is the exact gap the surrogate defect lived
    // in: `emoji-🔥.ts` alone has no reason to be quoted when core.quotePath is off, so it
    // arrives bare and never reaches the decoder. The space is what forces quoting; the astral
    // character inside that quoted body is what the code-unit loop destroyed.
    'fire 🔥 space.ts',
    'math 𝛼 space.ts', // outside the BMP too, and not an emoji — a lone surrogate pair
    'arrow -> looking.ts',
    'quote".ts',
    'back\\slash.ts',
    'tab\tinside.ts',
    'newline\ninside.ts', // the name that makes wholeLinesOf sound: git C-quotes it
  ];

  test('the forced config beats every channel that can set it, including an inherited one', () => {
    const root = mkTmpDir('mc-quote-flag-');
    cleanupDirs.push(root);
    initGitRepo(root);
    execFileSync('git', ['config', 'core.quotePath', 'false'], { cwd: root });
    fs.writeFileSync(path.join(root, 'fire 🔥 space.ts'), 'x\n');
    const escaped = '\\360\\237\\224\\245';
    const run = (env: NodeJS.ProcessEnv) => execFileSync('git', [...STATUS_ARGV], { cwd: root, encoding: 'utf8', env });

    // The repo's own config is beaten…
    expect(run({ ...process.env, ...statusConfigEnv() })).toContain(escaped);
    // …and so is a hostile GIT_CONFIG_PARAMETERS, WHICH THE FIRST VERSION OF THIS DID NOT DO.
    // `GIT_CONFIG_COUNT` alone loses to it: git reads PARAMETERS afterwards, and EXPORTS that
    // variable into every child of a command-line override, into aliases, hooks, `rebase -x`,
    // `bisect run` and `submodule foreach`. Since the sweep spreads `...process.env`, Mission
    // Control run from inside a hook silently lost its own override. Measured, and the reason
    // "identical precedence to the command line" was false as written: true against every
    // config a user EDITS, false against the one that arrives by INHERITANCE.
    const hostile = { ...process.env, GIT_CONFIG_PARAMETERS: "'core.quotePath=false'" };
    expect(run({ ...hostile, ...statusConfigEnv(hostile) })).toContain(escaped);
    // NON-VACUITY: that ambient really does defeat the COUNT pairs on their own, so the line
    // above is testing the append rather than a hostile value that never had any effect.
    expect(run({ ...hostile, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.quotePath', GIT_CONFIG_VALUE_0: 'true' })).not.toContain(escaped);
    // …and with no override at all the repo's config wins, so the fixture is genuinely hostile.
    expect(run({ ...process.env })).not.toContain(escaped);

    // The ambient value is APPENDED, never replaced — dropping someone else's git config on the
    // floor would be its own silent behaviour change.
    const OURS = "'core.quotePath=true' 'status.showUntrackedFiles=all'";
    expect(statusConfigEnv(hostile).GIT_CONFIG_PARAMETERS).toBe(`'core.quotePath=false' ${OURS}`);
    expect(statusConfigEnv({}).GIT_CONFIG_PARAMETERS).toBe(OURS);
  });

  // EACH SIDE OF THE PIN, WHICH IS THE TEST THE LAST ROUND DID NOT HAVE. Forcing a value is a
  // clamp in BOTH directions, and the previous forced value — `normal` — was an INTERIOR point
  // of `no | normal | all`, so it raised `no` as intended and silently LOWERED `all`. The
  // mutation matrix only ever asked "what if the setting is absent?", which samples a point
  // rather than the space. `all` is an ENDPOINT, so the clamp is one-directional by
  // construction; this asserts that over the whole domain rather than trusting the argument.
  test('the forced untracked setting raises every ambient value and lowers none', async () => {
    // FOUR VALUES x FIVE CHANNELS. The first version swept the values but set them only through
    // repo-local config — one channel of five — which is a coverage gap that narrows silently
    // the moment someone adds a channel. `GIT_CONFIG_PARAMETERS` is the one that already beat an
    // earlier override, so it is not hypothetical.
    const channels = ['repo-local', 'GLOBAL', 'SYSTEM', 'PARAMETERS', 'COUNT'] as const;
    const outcomes: { ambient: string; files: string[] }[] = [];
    for (const ambient of ['no', 'normal', 'all', '(absent)'])
    for (const channel of channels) {
      if (ambient === '(absent)' && channel !== 'repo-local') continue; // absent is one case
      const root = mkTmpDir(`mc-clamp-${ambient.replace(/[^a-z]/g, '')}-`);
      cleanupDirs.push(root);
      initGitRepo(root);
      // OUTSIDE the repo: written inside it, this config file is itself an untracked file and
      // lands in the swept list, failing the comparison for a reason that has nothing to do with
      // the clamp. Caught by running it.
      const envDir = mkTmpDir(`mc-clamp-cfg-${channel}-`);
      cleanupDirs.push(envDir);
      const envFile = path.join(envDir, 'gitconfig');
      const prior = { ...process.env };
      if (ambient !== '(absent)') {
        if (channel === 'repo-local') execFileSync('git', ['config', 'status.showUntrackedFiles', ambient], { cwd: root });
        else if (channel === 'GLOBAL' || channel === 'SYSTEM') {
          fs.writeFileSync(envFile, `[status]\n\tshowUntrackedFiles = ${ambient}\n`);
          process.env[`GIT_CONFIG_${channel}`] = envFile;
        } else if (channel === 'PARAMETERS') process.env.GIT_CONFIG_PARAMETERS = `'status.showUntrackedFiles=${ambient}'`;
        else {
          process.env.GIT_CONFIG_COUNT = '1';
          process.env.GIT_CONFIG_KEY_0 = 'status.showUntrackedFiles';
          process.env.GIT_CONFIG_VALUE_0 = ambient;
        }
      }
      try {
      fs.mkdirSync(path.join(root, 'newdir'), { recursive: true });
      fs.writeFileSync(path.join(root, 'newdir', 'a.ts'), 'x\n');
      fs.writeFileSync(path.join(root, 'newdir', 'b.ts'), 'x\n');
        const swept = await changedFilesFor(root);
        expect(swept.readable).toBeUndefined();
        outcomes.push({ ambient: `${ambient} via ${channel}`, files: [...swept.changedFiles].sort() });
      } finally {
        for (const k of Object.keys(process.env)) if (k.startsWith('GIT_CONFIG')) delete process.env[k];
        Object.assign(process.env, prior);
      }
    }
    expect(outcomes.length).toBe(4 * 5 - 4); // NON-VACUITY: every channel/value pair really ran
    // IDENTICAL FOR EVERY AMBIENT VALUE — that is what "the collector does not depend on the
    // user's config" means, asserted rather than asserted-about.
    for (const o of outcomes) {
      expect({ ambient: o.ambient, files: o.files }).toEqual({
        ambient: o.ambient,
        files: ['newdir/a.ts', 'newdir/b.ts'],
      });
    }
  });

  // THE FALSE POSITIVE THE INTERIOR VALUE CREATED, pinned at the consumer. Under `normal` —
  // which is GIT'S OWN DEFAULT, so this was unconditional and pre-existing rather than
  // introduced — git collapses an untracked directory to `?? newdir/`, and detectConflicts keys
  // on the exact string. Two worktrees adding DIFFERENT files under one new directory therefore
  // both reported `newdir/` and collided: a conflict nobody has, which is the class this file
  // exists to remove.
  test('two worktrees adding different files under one new directory do not collide', async () => {
    const parent = mkTmpDir('mc-clamp-conflicts-');
    cleanupDirs.push(parent);
    const projectRoot = path.join(parent, 'ashcroft');
    initGitRepo(projectRoot);
    const wtA = path.join(projectRoot, '.worktrees', 'ceo-1-1');
    const wtB = path.join(projectRoot, '.worktrees', 'ceo-2-2');
    addWorktree(projectRoot, wtA, 'ceo-1-1');
    addWorktree(projectRoot, wtB, 'ceo-2-2');
    writeRegistry(projectRoot, [
      { name: 'ceo-1', token: '1' },
      { name: 'ceo-2', token: '2' },
    ]);
    fs.mkdirSync(path.join(wtA, 'newdir'), { recursive: true });
    fs.mkdirSync(path.join(wtB, 'newdir'), { recursive: true });
    fs.writeFileSync(path.join(wtA, 'newdir', 'only-a.ts'), 'a\n');
    fs.writeFileSync(path.join(wtB, 'newdir', 'only-b.ts'), 'b\n');
    // …and one genuinely shared file, so the test proves it still finds REAL conflicts rather
    // than passing because it found none.
    fs.writeFileSync(path.join(wtA, 'shared.ts'), 'a\n');
    fs.writeFileSync(path.join(wtB, 'shared.ts'), 'b\n');

    const claudeRoot = mkTmpDir('mc-clamp-conflicts-claude-');
    cleanupDirs.push(claudeRoot);
    const project = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find(
      (p) => p.root === projectRoot
    )!;
    const report = await detectConflicts(project);

    expect(report.conflicts.map((c) => c.file)).toEqual(['shared.ts']);
    // Stated as the negative too, because that is the defect: the directory must not be a key.
    expect(report.conflicts.map((c) => c.file)).not.toContain('newdir/');
  });

  // THE OTHER CONFIG THAT SURVIVED THE OVERRIDE, and it fails in the quieter direction:
  // `status.showUntrackedFiles=no` does not corrupt a path, it makes the path DISAPPEAR — with
  // `readable: undefined`, so the sweep reports a clean read over a population git was told not
  // to look at. Absence is the answer nobody investigates, which makes this worse than the
  // fabrication this PR was opened for.
  test('a repo that hides untracked files cannot make the sweep report a clean read', async () => {
    const root = mkTmpDir('mc-untracked-');
    cleanupDirs.push(root);
    initGitRepo(root);
    execFileSync('git', ['config', 'status.showUntrackedFiles', 'no'], { cwd: root });
    fs.writeFileSync(path.join(root, 'untracked.ts'), 'x\n');

    // NON-VACUITY: the setting really does hide it from a bare status, so the assertion below
    // is about the override rather than about a config that never had any effect.
    expect(execFileSync('git', [...STATUS_ARGV], { cwd: root, encoding: 'utf8' }).trim()).toBe('');

    const swept = await changedFilesFor(root);
    expect(swept.readable).toBeUndefined(); // it really did run clean…
    expect(swept.changedFiles).toEqual(['untracked.ts']); // …and it really did see the file
  });

  // THAT THE SWEEP ACTUALLY PASSES IT — BEHAVIOURALLY, which I previously said was impossible.
  //
  // I was wrong in a specific way worth writing down: I reasoned that the override is invisible
  // because both input formats decode to the same PATH SET, and that is true. It is not true of
  // the RETURN. The octal form is roughly four times the bytes of the raw form, so against a
  // small `maxBuffer` the two recover DIFFERENT NUMBERS OF RECORDS and differ in `readable`.
  // The path set is identical; how much of it survives a fixed budget is not.
  //
  // So this needs no source grep and no env manipulation, and it kills the mutation that
  // deleting the `env:` line from changedFilesFor used to survive — which left the whole suite
  // green at 84 pass 0 fail, the same vacuity this PR already fixed once at the consumer
  // barrier, reappearing inside the test written for that fix.
  test('changedFilesFor passes the forced config to git, not just declares it', async () => {
    const root = mkTmpDir('mc-quote-passed-');
    cleanupDirs.push(root);
    initGitRepo(root);
    execFileSync('git', ['config', 'core.quotePath', 'false'], { cwd: root });
    for (let i = 0; i < 60; i++) fs.writeFileSync(path.join(root, `café-${String(i).padStart(2, '0')}-ünïcödé.ts`), 'x\n');

    // THE MARGIN THIS PIN RESTS ON, ASSERTED RATHER THAN ASSUMED. It kills the mutation only
    // because the RAW stream fits under the budget while the ESCAPED one does not — measured
    // 1620 B raw against 3540 B escaped at a 2000 B budget. That is 380 B of headroom, about
    // 19%, and roughly 14 more fixture files would close it silently: the raw stream would
    // overrun too, `readable` would be false either way, and this test would go GREEN with the
    // mutation it exists to kill. The same fixture-margin shape the barrier above already had
    // twice, now in the pin that replaced the source-text one.
    const BUDGET = 2000;
    // `showUntrackedFiles` PINNED, `quotePath` DELIBERATELY NOT — pinning quoting here would
    // destroy the raw stream this comparison exists to measure. Without the pin this read
    // returned 130 bytes clean and **0 bytes** under an ambient `=no`, so `0 < BUDGET` passed
    // for the exact opposite of the stated reason: the headroom was asserted against nothing.
    const raw = execFileSync('git', [...STATUS_ARGV], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, GIT_CONFIG_PARAMETERS: forceShowUntrackedAll() },
    });
    // NON-VACUITY, and it is the assertion whose absence let the above happen: the raw read has
    // to have read something before its size means anything. `0 < 2000` should never have been
    // writable as a pass.
    expect(Buffer.byteLength(raw, 'utf8')).toBeGreaterThan(0);
    const escaped = execFileSync('git', [...STATUS_ARGV], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, ...statusConfigEnv() },
    });
    expect(Buffer.byteLength(raw, 'utf8')).toBeLessThan(BUDGET); // the mutation's path fits
    expect(Buffer.byteLength(escaped, 'utf8')).toBeGreaterThan(BUDGET); // …and the real one does not

    const cut = await changedFilesFor(root, { maxBuffer: BUDGET });
    expect(cut.readable).toBe(false); // …which only happens if git was asked to escape
    expect(cut.changedFiles.length).toBeGreaterThan(0);
    expect(cut.changedFiles.length).toBeLessThan(60);
    // Whatever survived is still real — the truncation must not have invented anything.
    expect(cut.changedFiles.filter((f) => !fs.existsSync(path.join(root, f)))).toEqual([]);
  });

  // THE LIVE END, against real git rather than pinned bytes: every path git reports must be a
  // path that exists. Existence rather than name equality, because macOS normalises Unicode
  // in filenames and the pinned test above is where exact decoding is asserted.
  //
  // HERMETIC WITH RESPECT TO GIT CONFIG, because it was not. It ran plain `git status` and
  // asserted its own premise on `\303\251`, so a developer with `core.quotePath=false` set
  // globally — or `GIT_CONFIG_GLOBAL` pointed anywhere — failed on the premise rather than on
  // the behaviour. It now runs the collector's own argv, so the test and the collector cannot
  // disagree about what git was asked.
  test('every path real git reports for exotic names exists on disk', () => {
    const root = mkTmpDir('mc-quote-live-');
    cleanupDirs.push(root);
    initGitRepo(root);
    for (const n of EXOTIC_NAMES) fs.writeFileSync(path.join(root, n), 'x\n');

    const raw = execFileSync('git', [...STATUS_ARGV], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, ...statusConfigEnv() },
    });
    // THE PREMISE: git really did quote these, so the decoder is being exercised. Without
    // this the test would still pass against a git that quoted nothing.
    expect(raw).toContain('\\303\\251'); // non-ASCII went out as octal bytes
    expect(raw).toContain('\\360\\237\\224\\245'); // …including the four bytes of an astral one
    expect(raw.split('\n').filter((l) => l.includes('"')).length).toBeGreaterThan(5);
    // …and no record contains a raw newline, which is what lets wholeLinesOf split on one.
    expect(raw.split('\n').filter((l) => l).length).toBe(EXOTIC_NAMES.length);

    const parsed = parseStatusPorcelain(raw);
    expect(parsed).toHaveLength(EXOTIC_NAMES.length);
    const missing = parsed.filter((f) => !fs.existsSync(path.join(root, f)));
    expect(missing).toEqual([]);
  });

  // THE SECOND BARRIER, and it must hold with the flag deliberately turned OFF. The flag
  // decides what the parser RECEIVES; this decides what the parser DOES with what arrives.
  // They fail for different reasons — the flag to an edit of the argv, the loop to an edit of
  // the loop — so a test that only ever sees C-quoted ASCII cannot tell you the parser is
  // correct, only that the flag is still there.
  test('a RAW astral character survives, even with core.quotePath off', () => {
    const root = mkTmpDir('mc-quote-raw-');
    cleanupDirs.push(root);
    initGitRepo(root);
    execFileSync('git', ['config', 'core.quotePath', 'false'], { cwd: root });
    for (const n of EXOTIC_NAMES) fs.writeFileSync(path.join(root, n), 'x\n');

    // Deliberately NOT forcing quotePath: the repo's own config must win so git emits non-ASCII
    // raw while still quoting for the space. But `status.showUntrackedFiles` IS forced, because
    // an ambient `=no` empties this fixture and the test then fails on its premise rather than
    // on the behaviour — vary one variable, pin the rest.
    const raw = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, GIT_CONFIG_PARAMETERS: forceShowUntrackedAll() },
    });
    // THE PREMISE: this really is the raw form. `\360\237\224\245` must NOT appear, and a
    // quoted record holding a literal astral character must — otherwise the surrogate path is
    // not being exercised and this test proves nothing.
    expect(raw).not.toContain('\\360\\237\\224\\245');
    expect(raw).toContain('"fire 🔥 space.ts"');

    const parsed = parseStatusPorcelain(raw);
    const missing = parsed.filter((f) => !fs.existsSync(path.join(root, f)));
    expect(missing).toEqual([]);
    expect(parsed).toContain('fire 🔥 space.ts');
    expect(parsed.join('')).not.toContain('�'); // no character was replaced
  });
});

// ── GIT IS THE ORACLE, BECAUSE A FIXTURE'S COVERAGE IS WHOEVER WROTE IT ───────────────
//
// Every barrier above checks the text parser against a LIST OF NAMES SOMEBODY THOUGHT OF, and
// that list has been wrong twice, both times for the same reason. It caught the C-quoting
// fabrication only BECAUSE someone had added a space and an octal escape to it. It then MISSED
// the astral-under-`core.quotePath=false` defect, because no entry carried BOTH a space and an
// astral character — the one combination the defect lived in — and `emoji-🔥.ts` alone never
// reaches the decoder, since without a space git has no reason to quote it. The entry that
// closed it (`fire 🔥 space.ts`) was added AFTER the defect was found, by the person who found
// it. A fixture cannot enumerate what nobody thought of, and no amount of care makes it able
// to; the ceiling is a property of enumeration, not of the enumerator.
//
// `git status -z` REMOVES THE ENUMERATOR FROM THE LOOP. It is NUL-separated and the paths are
// emitted VERBATIM — no C-quoting at all, so there is nothing to un-quote and no decoder to get
// wrong. NUL is sound as a separator in a way `\n` is not: a filename can contain a newline (see
// `newline\ninside.ts` above) and cannot contain a NUL, because the kernel's own path API is
// NUL-terminated. So git itself supplies the right answer for whatever names are actually there,
// and coverage stops being a list and starts being a population.
//
// THE TRAP, NAMED SO IT IS NOT WALKED INTO: running this comparison over EXOTIC_NAMES would
// build a second instrument carrying the first one's blind spot, while looking like progress.
// Both arms below therefore draw their population from somewhere OTHER than a hand-written list
// — the repository's own path set, and a seeded random draw over the code-point space — and
// neither one is EXOTIC_NAMES.
//
// WHAT THIS DOES NOT COVER, stated here rather than discovered later:
//   · NON-UTF-8 PATHS. `-z` hands back raw bytes and this decodes them as UTF-8, so an invalid
//     name still becomes U+FFFD on both sides and the differential agrees about a wrong answer.
//     Unreachable on APFS (EILSEQ, executed) and reachable on Linux. Same limit as unquoteCStyle
//     documents; `-z` moves it no closer.
//   · THE `showUntrackedFiles` CLAMP. `all` cannot split a NESTED REPOSITORY, so two worktrees
//     vendoring different repos at `vendor/thing` still collide. That is a property of what git
//     REPORTS, identical in both formats, so a format differential is blind to it by
//     construction. Filed as #52.
//   · A FIXED SEED IS A SAMPLE, NOT THE DOMAIN. The random arm draws ~120 names per repo from
//     the code-point ranges below; ranges nobody listed (Deseret, Linear B, private-use planes)
//     are outside it. This is a much larger sample than a hand list and it is still a sample.
describe('git status -z is the oracle the text parser is checked against', () => {
  /** The sweep's own argv plus `-z`, DERIVED so the two forms cannot drift apart. */
  const STATUS_Z_ARGV = [...STATUS_ARGV, '-z'] as const;

  interface ZRecord {
    xy: string;
    path: string;
  }

  /**
   * Reads `git status --porcelain -z` from BYTES.
   *
   * BYTES, NOT A STRING, because the point of this reader is to be a source of truth: decoding
   * the whole buffer to UTF-8 first and then splitting would be one more decode step that could
   * be wrong in the same way the thing under test is wrong. Split on NUL over the raw buffer,
   * decode each field once.
   *
   * A RENAME IS TWO RECORDS AND `-z` PUTS THEM IN THE OPPOSITE ORDER FROM THE TEXT FORM. Text
   * writes `R  <orig> -> <new>`; `-z` writes `R  <new>` NUL `<orig>` NUL. Executed against
   * `git mv` (git 2.50.1): `["R  moved 🔥 there.ts", "fire 🔥 space.ts", ""]`. Taking the first
   * and consuming the second matches parseStatusPorcelain's "return the NEW path" contract — and
   * getting this backwards is the one way the oracle could be wrong, so it is pinned by its own
   * test below rather than argued for here.
   */
  function recordsFromStatusZ(buf: Buffer): ZRecord[] {
    const fields: Buffer[] = [];
    let start = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) {
        fields.push(buf.subarray(start, i));
        start = i + 1;
      }
    }
    const out: ZRecord[] = [];
    for (let i = 0; i < fields.length; i++) {
      const rec = fields[i]!;
      if (rec.length === 0) continue;
      const xy = rec.subarray(0, 2).toString('latin1');
      out.push({ xy, path: rec.subarray(3).toString('utf8') });
      // The original path of a rename or copy follows in its own field — consumed, never read
      // as a record of its own.
      if (xy.includes('R') || xy.includes('C')) i++;
    }
    return out;
  }

  /** Appended, never replaced — the precedence lesson statusConfigEnv already paid for. */
  const appendParams = (...settings: string[]) => {
    const ours = settings.map((s) => `'${s}'`).join(' ');
    const existing = process.env.GIT_CONFIG_PARAMETERS;
    return existing ? `${existing} ${ours}` : ours;
  };

  /**
   * BOTH QUOTING MODES, AND RUNNING ONLY ONE MADE THIS INSTRUMENT VACUOUS ONCE ALREADY.
   *
   * The standalone harness this test grew out of forced `statusConfigEnv()` on every run, so git
   * emitted octal escapes every time and unquoteCStyle's code-point loop was never exercised at
   * all — every escape git writes is ASCII, so iterating by code UNIT gives the same answer.
   * Executed against that harness with `Array.from(body)` mutated back to `body.split('')`: **0
   * divergences over 413 records**, green on the exact defect it was written for. With `raw`
   * added it found **4 diverging trials and 58 fabricated paths over 257 records**.
   *
   * `forced` is what production runs. `raw` is the only mode in which the decoder is under test.
   * The draw arm below asserts per repo that the two really are two — see the premise there.
   */
  const MODE_ENV = {
    forced: () => ({ ...process.env, ...statusConfigEnv() }),
    raw: () => ({
      ...process.env,
      // Through PARAMETERS rather than repo-local `git config`, so an inherited hostile
      // PARAMETERS cannot beat it and fail this test on its premise instead of its behaviour.
      GIT_CONFIG_PARAMETERS: appendParams('core.quotePath=false', 'status.showUntrackedFiles=all'),
    }),
  } as const;

  /** One `git status` in each format over the same tree, with the same environment. */
  function differential(root: string, mode: keyof typeof MODE_ENV) {
    const env = MODE_ENV[mode]();
    const opts = { cwd: root, env, maxBuffer: 64 * 1024 * 1024 };
    const text = execFileSync('git', [...STATUS_ARGV], { ...opts, encoding: 'utf8' });
    const records = recordsFromStatusZ(execFileSync('git', [...STATUS_Z_ARGV], opts));
    const sorted = (xs: string[]) => [...xs].sort();
    return { text, records, fromText: sorted(parseStatusPorcelain(text)), fromZ: sorted(records.map((r) => r.path)) };
  }

  /**
   * A SECOND, INDEPENDENT ORACLE, restricted to the records it can speak for. A deletion
   * legitimately names a path that is gone, so `fs.existsSync` is only the truth for everything
   * else — and this was a real bug in the harness that found it: the first run reported 20
   * "fabrications" that were all ` D ` records, i.e. the check was wrong, not the parser.
   */
  function nonexistentAmongSurvivors(root: string, records: ZRecord[]): string[] {
    return records.filter((r) => !r.xy.includes('D')).map((r) => r.path).filter((p) => !fs.existsSync(path.join(root, p)));
  }

  // ── the seeded draw ────────────────────────────────────────────────────────────────
  // mulberry32. SEEDED AND FIXED, so a failure is reproducible and CI does not flake; the cost
  // is that this is a sample of the domain rather than the domain, which the header states.
  function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * The code-point ranges drawn from. Chosen to span the CLASSES git and JS treat specially —
   * C0 controls, ASCII, Latin-1, combining marks, RTL, the Unicode whitespace block, CJK,
   * variation selectors, the BOM, and three ASTRAL blocks — rather than to name any particular
   * character. What lands in a name is the draw's business, not this list's.
   */
  const RANGES: [number, number][] = [
    [0x01, 0x1f], // C0 controls: tab, newline, ESC — everything git C-quotes unconditionally
    [0x20, 0x7e], // ASCII, including space, `"`, `\`, `-` and `>`
    [0x80, 0xff], // Latin-1 / C1
    [0x0300, 0x036f], // combining marks
    [0x0590, 0x08ff], // RTL scripts
    [0x2000, 0x206f], // Unicode whitespace + bidi controls, incl. U+2028/U+2029
    [0x3000, 0x303f], // CJK punctuation, incl. the ideographic space
    [0x4e00, 0x9fff], // CJK
    [0xfe00, 0xfe0f], // variation selectors
    [0xfeff, 0xfeff], // BOM — the character the decoder used to swallow
    [0x1f300, 0x1f6ff], // emoji — ASTRAL
    [0x1d400, 0x1d7ff], // math alphanumerics — ASTRAL, and not emoji
    [0xe0000, 0xe007f], // tag characters — ASTRAL and invisible
  ];

  /**
   * Multi-character tokens drawn as WHOLE UNITS. Without these the separator ` -> ` appears
   * inside a name only by drawing four specific code points in order — probability ~1e-9 per
   * name, i.e. never. Weighting them in is not enumerating the ANSWER (git still supplies that);
   * it is making the population reach the shapes at all. The census below asserts it did.
   */
  const SPECIALS = [' -> ', ' ', '"', '\\', '\n', '\t', ' -> "', '" -> ', '->', '  ', '\\"'];

  function randomSegment(r: () => number): string {
    const len = 1 + Math.floor(r() * 8);
    let s = '';
    for (let i = 0; i < len; i++) {
      if (r() < 0.28) {
        s += SPECIALS[Math.floor(r() * SPECIALS.length)]!;
        continue;
      }
      const [lo, hi] = RANGES[Math.floor(r() * RANGES.length)]!;
      const cp = lo + Math.floor(r() * (hi - lo + 1));
      if (cp === 0x2f || (cp >= 0xd800 && cp <= 0xdfff)) continue; // `/` separates; lone surrogates are not code points
      s += String.fromCodePoint(cp);
    }
    return s;
  }

  /** A nested path, so directory components are drawn from the same space as leaf names. */
  function randomPath(r: () => number): string | null {
    const parts: string[] = [];
    for (let d = 0, depth = 1 + Math.floor(r() * 3); d < depth; d++) parts.push(randomSegment(r) || `d${d}`);
    const p = parts.join('/') + '.ts';
    // Never let the draw escape the temp tree or corrupt the repo it is being read from.
    if (/(^|\/)\.{1,2}(\/|$)/.test(p) || /(^|\/)\.git(\/|$)/.test(p)) return null;
    return p;
  }

  /** Writes `name` under `root`; returns false when the filesystem refuses it (EILSEQ etc.). */
  function tryCreate(root: string, name: string): boolean {
    try {
      fs.mkdirSync(path.join(root, path.dirname(name)), { recursive: true });
      fs.writeFileSync(path.join(root, name), 'x\n');
      return true;
    } catch {
      return false;
    }
  }

  // THE TWO PROPERTIES THE WHOLE INSTRUMENT RESTS ON. If either were false the differential
  // would be comparing two escaped streams — two readings of one format — and would inherit
  // exactly the blind spot it exists to remove.
  test('-z is verbatim under either quotePath setting, and frames a rename new-then-orig', () => {
    const root = mkTmpDir('mc-z-props-');
    cleanupDirs.push(root);
    initGitRepo(root);
    fs.writeFileSync(path.join(root, 'fire 🔥 space.ts'), 'x\n');

    for (const mode of ['forced', 'raw'] as const) {
      const zbuf = execFileSync('git', [...STATUS_Z_ARGV], { cwd: root, env: MODE_ENV[mode]() });
      // NOT C-quoted: no octal escape, no wrapping quotes, the astral character intact.
      expect(zbuf.toString('latin1')).not.toContain('\\360');
      expect(zbuf.toString('utf8')).not.toContain('"');
      expect(recordsFromStatusZ(zbuf).map((r) => r.path)).toEqual(['fire 🔥 space.ts']);
    }
    // NON-VACUITY: the TEXT form really does differ between the two modes, so "verbatim under
    // either" is a property of `-z` rather than of a config that never had any effect.
    const textForced = execFileSync('git', [...STATUS_ARGV], { cwd: root, encoding: 'utf8', env: MODE_ENV.forced() });
    const textRaw = execFileSync('git', [...STATUS_ARGV], { cwd: root, encoding: 'utf8', env: MODE_ENV.raw() });
    expect(textForced).toContain('\\360\\237\\224\\245');
    expect(textRaw).toContain('fire 🔥 space.ts');
    expect(textForced).not.toBe(textRaw);

    // …and the rename framing, against a real `git mv` rather than against this test's idea of it.
    execFileSync('git', ['add', '-A'], { cwd: root });
    execFileSync('git', ['commit', '-qm', 'base'], { cwd: root });
    execFileSync('git', ['mv', 'fire 🔥 space.ts', 'moved 🔥 there.ts'], { cwd: root });
    const renamed = execFileSync('git', [...STATUS_Z_ARGV], { cwd: root, env: MODE_ENV.forced() });
    expect(renamed.toString('utf8').split('\0')).toEqual(['R  moved 🔥 there.ts', 'fire 🔥 space.ts', '']);
    // The reader takes the NEW path and consumes the original — the same answer the text parser
    // gives, which is what makes them comparable at all.
    expect(recordsFromStatusZ(renamed).map((r) => r.path)).toEqual(['moved 🔥 there.ts']);
    expect(differential(root, 'forced').fromText).toEqual(['moved 🔥 there.ts']);
  });

  // THE FAILURE MODE EVERY ARM BELOW GUARDS AGAINST, EXHIBITED RATHER THAN ASSERTED ABOUT. On a
  // clean tree both sides are `[]`, the comparison passes, and it has compared NOTHING. That is
  // why each arm asserts a record floor, and why the floor is the load-bearing line rather than
  // the equality.
  test('a clean repo makes the comparison pass having compared nothing', () => {
    const root = mkTmpDir('mc-z-vacuous-');
    cleanupDirs.push(root);
    initGitRepo(root);
    const d = differential(root, 'forced');
    expect(d.records).toHaveLength(0);
    expect(d.fromText).toEqual(d.fromZ); // …and it passes. `0 === 0` is not evidence.
    expect(d.fromText).toEqual([]);
  });

  // ARM 1 — THE POPULATION IS THIS REPOSITORY'S OWN PATH SET, so nobody chose it and it grows
  // with the repo. If someone commits a file with a space in it next month this arm covers it
  // with no edit here, which is the property a fixture cannot have.
  //
  // A RECONSTRUCTION, NOT THE LIVE TREE, and the distinction is not cosmetic: reading `git
  // status` in the real checkout would compare `[]` to `[]` on a clean CI clone — the vacuous
  // pass above. The names are real; the dirt is manufactured, so every one of them yields a
  // record.
  //
  // AND IT IS ALREADY DOING WORK NOBODY ARRANGED. Of the 670 paths tracked here today, exactly
  // ONE needs C-quoting — `war-room/dashboard/client/public/Office Background.png`, a real asset
  // with a space in it that no fixture author put there.
  //
  // WHAT THAT ONE PATH BUYS, STATED SHARPLY, BECAUSE A LOOSER VERSION OF THIS SENTENCE WAS
  // WRONG. It has a space and NOTHING else: no backslash, no escape, no non-ASCII byte. So
  // **this arm tests quote-stripping and nothing else.** It dies to a mutation that leaves the
  // quotes on (executed: M3, and M4 as written here, which replaces the whole path-field read).
  // It does NOT die to a mutation that strips the quotes but breaks ESCAPE decoding — executed
  // against exactly that variant, 0 of 670 paths went missing — nor to the per-character octal
  // mutation M5, since no tracked path holds a non-ASCII byte. Escapes and multi-byte decoding
  // are arm 2's job. The earlier wording ("dies to a mutation handing quoted paths through
  // un-decoded") blurred quote-stripping and escape-decoding into one claim and overstated this.
  //
  // ONE EFFECTIVE MODE TODAY, NOT TWO, AND THAT IS WHY THE LOOP IS GONE. This arm used to run
  // `forced` and `raw` exactly as arm 2 does. With no non-ASCII byte anywhere in the tracked set,
  // `core.quotePath` has nothing to act on: the two streams are BYTE-IDENTICAL — executed, 33,760
  // bytes each, `forced === raw` true. The second iteration re-compared the same input and
  // reported it as a second mode. Arm 2 asserts per repo that its two modes really are two, and
  // that assertion is documented there as having caught a real vacuity; the same assertion
  // written here would FAIL. Rather than make a gesture at coverage this arm cannot provide, it
  // runs the one mode that exists and says so. It becomes two modes the moment a non-ASCII path
  // is tracked — at which point the assertion below starts distinguishing them for free.
  //
  // NOT ASSERTED, DELIBERATELY: "the repo contains at least one quoted path" would fail the day
  // someone renames one PNG, for a reason with nothing to do with the parser. The arm's strength
  // tracks the repository, which is the point of drawing from it and also its weakness.
  test('every path git reports for the repository\'s own file set round-trips against -z', () => {
    const repoPaths = execFileSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 })
      .toString('utf8')
      .split('\0')
      .filter(Boolean);
    // NON-VACUITY at the source: a checkout that returned nothing would make the arm empty.
    expect(repoPaths.length).toBeGreaterThan(100);

    const root = mkTmpDir('mc-z-repopaths-');
    cleanupDirs.push(root);
    initGitRepo(root);
    const created = repoPaths.filter((p) => tryCreate(root, p));
    expect(created.length).toBe(repoPaths.length); // every real path was materialisable

    const d = differential(root, 'forced');
    expect({ mode: 'forced', paths: d.fromText }).toEqual({ mode: 'forced', paths: d.fromZ });
    expect(nonexistentAmongSurvivors(root, d.records)).toEqual([]);

    // NON-VACUITY, AND IT NAMES THE PATH RATHER THAN A COUNT. The previous form was
    // `records.length >= created.length` — 670 >= 670, tight to the file, and a TRIPWIRE: the
    // materialised set includes the repo's own tracked `.gitignore` files, so the day someone
    // tracks a path matching a tracked ignore pattern (`*.local`, `.env.*`, `node_modules/`,
    // `.worktrees/`) git stops reporting it, the count drops by one and this arm goes red for a
    // reason with nothing to do with the parser. Nothing matches today — checked. Asserting the
    // MISSING SET instead means that failure arrives naming the file, and
    // `git status --porcelain --ignored` in the temp root confirms it in one command. The floor
    // is not loosened, because a silently smaller comparison is the vacuity this block exists to
    // prevent; only the diagnosis is made legible.
    const reported = new Set(d.records.map((r) => r.path));
    expect(created.filter((p) => !reported.has(p))).toEqual([]);
  }, 60_000);

  // ARM 2 — THE POPULATION IS A DRAW OVER THE CODE-POINT SPACE, and this is the arm that would
  // have caught the astral defect without anybody knowing to look for it.
  //
  // THE COMPARISON WITH THE FIXTURE, IN NUMBERS THIS BLOCK ACTUALLY PRODUCES: EXOTIC_NAMES
  // contains TWO names carrying both a space and an astral character, and both were added after
  // the defect they cover was found by hand. One run of the three seeds below draws **294 names,
  // 134 of them carrying both** — plus 151 containing the ` -> ` separator, 82 containing a
  // newline and 66 beginning with a JS-WhiteSpace character. (An earlier version of this
  // paragraph quoted 337/157/150/74/54, which were the DEVELOPMENT HARNESS's figures, not this
  // block's. The census constants under FLOORS are the shipped ones and these now match them.)
  // The census below asserts that richness on every run rather than trusting this paragraph,
  // because a generator that quietly stopped producing astral characters would leave the arm
  // green and empty.
  //
  // WHAT THIS BLOCK COSTS, MEASURED RATHER THAN GUESSED: **~3.3–4.5 s** for all four tests in
  // isolation (3.31 / 3.33 / 3.42 s at load 1.8 here; 3.40 / 3.83 / 4.53 s at load 4.1–4.2 on
  // the reviewer's runs), against a suite of roughly 75 s. It creates **6 git repositories and
  // ~1,030 files**. A before/after comparison of total suite wall time does NOT resolve this
  // cost — measured before 72.4–82.3 s and after 71.6–87.3 s, overlapping ranges with some
  // "after" runs faster than some "before" — so the isolated figure is the only defensible one.
  //
  // ASSERTING THE CENSUS IS NOT RE-ENUMERATING THE ANSWER. It asserts the POPULATION is rich;
  // git still decides what is CORRECT for each name. The distinction is the whole difference
  // between this and a fixture.
  test('a seeded draw over the code-point space agrees with -z, in both quoting modes', () => {
    const SEEDS = [0x5eed, 0xc0ffee, 0x9e3779b9];
    const PER_REPO = 120;
    const population: string[] = [];
    let records = 0;
    let renames = 0;

    for (const seed of SEEDS) {
      const r = rng(seed);
      const root = mkTmpDir(`mc-z-draw-${seed.toString(16)}-`);
      cleanupDirs.push(root);
      initGitRepo(root);
      execFileSync('git', ['config', 'status.renames', 'copies'], { cwd: root });

      const made: string[] = [];
      for (let i = 0; i < PER_REPO; i++) {
        const name = randomPath(r);
        if (name && tryCreate(root, name)) made.push(name);
      }
      // A RENAME, A MODIFICATION AND A DELETION, so `XY` is not always `??` — the rename is
      // the record whose framing differs between the two formats, and an arm that only ever
      // saw untracked files would never exercise it.
      if (made.length > 3) {
        execFileSync('git', ['add', '--', made[0]!, made[1]!, made[2]!], { cwd: root });
        execFileSync('git', ['commit', '-qm', 'base'], { cwd: root });
        const to = randomPath(r);
        if (to) {
          try {
            fs.mkdirSync(path.join(root, path.dirname(to)), { recursive: true });
            execFileSync('git', ['mv', made[0]!, to], { cwd: root, stdio: 'pipe' });
            renames++;
          } catch {
            // The filesystem refused the destination — APFS returns EILSEQ for some byte
            // sequences, which is a fact about the draw and not about the parser. The
            // modification and the deletion below still stand, and `renames` is asserted
            // non-zero across the whole run so this cannot quietly swallow every one.
          }
        }
        fs.appendFileSync(path.join(root, made[1]!), 'y\n');
        fs.rmSync(path.join(root, made[2]!));
      }
      population.push(...made);

      // ONE TREE, BOTH MODES, so the two text streams are directly comparable — and that
      // comparison is what makes "both modes" a fact rather than a label.
      const runs = { forced: differential(root, 'forced'), raw: differential(root, 'raw') };

      // THE PREMISE, ASSERTED PER REPO, AND IT CAUGHT A REAL VACUITY IN THIS TEST. A mutation
      // that collapsed `raw` onto `forced` left every assertion below green — the arm would
      // have been running the escaped stream twice and calling it two modes, which is exactly
      // the blind spot that let `Array.from` regress in the first place. Two independent
      // statements: the streams DIFFER, and the forced one really is escaped (`\3xx` is the
      // lead byte of any non-ASCII UTF-8 sequence, so it appears iff git escaped one).
      expect(runs.forced.text).not.toBe(runs.raw.text);
      expect(runs.forced.text).toMatch(/\\3[0-7][0-7]/);

      for (const mode of ['forced', 'raw'] as const) {
        const d = runs[mode];
        // NON-VACUITY, per repo: a draw that created nothing would compare nothing.
        expect(d.records.length).toBeGreaterThan(PER_REPO / 2);
        records += d.records.length;
        // The seed rides along so a failure names the run that produced it.
        expect({ seed: seed.toString(16), mode, paths: d.fromText }).toEqual({
          seed: seed.toString(16),
          mode,
          paths: d.fromZ,
        });
        expect(nonexistentAmongSurvivors(root, d.records)).toEqual([]);
      }
    }

    // THE CENSUS. Floors, not exact counts — the draw is seeded so these are stable, and stating
    // them as floors means a generator improvement does not have to edit them.
    const astral = (s: string) => [...s].some((c) => c.codePointAt(0)! > 0xffff);
    // The JS WhiteSpace class, spelled in escapes: these are the characters `trimStart` used to
    // eat off the front of a name, which is the defect the fixed-width slice replaced.
    const leadingJsWhitespace = /^[\t\v\f \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/;
    const count = (pred: (s: string) => boolean) => population.filter(pred).length;
    const shapes = {
      total: population.length,
      records,
      // The record whose FRAMING differs between the two formats. If every `git mv` were
      // refused this would be 0 and the rename half of the oracle would be untested — the
      // arm would still be green, which is exactly the shape of vacuity being guarded here.
      renames,
      spaceAndAstral: count((s) => s.includes(' ') && astral(s)),
      arrowSeparatorInsideAName: count((s) => s.includes(' -> ')),
      doubleQuote: count((s) => s.includes('"')),
      backslash: count((s) => s.includes('\\')),
      newline: count((s) => s.includes('\n')),
      tab: count((s) => s.includes('\t')),
      leadingJsWhitespace: count((s) => leadingJsWhitespace.test(s)),
      bom: count((s) => s.includes('\ufeff')),
      nested: count((s) => s.includes('/')),
    };
    // FLOORS WITH HEADROOM, not the observed figures. The draw is seeded, so on this machine
    // the census is exact and reproducible — measured 2026-08-15, git 2.50.1, APFS:
    // total 294 · records 586 · renames 2 · spaceAndAstral 134 · arrow 151 · doubleQuote 160 ·
    // backslash 112 · newline 82 · tab 72 · leadingJsWhitespace 66 · bom 102 · nested 181.
    // The floors sit roughly 40% below because WHICH DRAWS THE FILESYSTEM ACCEPTS is not
    // portable: APFS rejects some byte sequences with EILSEQ that ext4 takes, so a Linux CI
    // box legitimately lands on different totals from the same seeds. Pinning the exact
    // numbers would fail there for a reason that has nothing to do with the parser.
    const FLOORS: Record<keyof typeof shapes, number> = {
      total: 200,
      records: 400,
      renames: 1,
      spaceAndAstral: 80, // EXOTIC_NAMES carries exactly 2, and both were added after the fact
      arrowSeparatorInsideAName: 80, // …and exactly 1
      doubleQuote: 80,
      backslash: 60,
      newline: 40,
      tab: 30,
      leadingJsWhitespace: 30,
      bom: 50,
      nested: 100,
    };
    // Asserted as ONE object rather than per-shape, so a failure prints the whole census beside
    // the floors it missed instead of stopping at the first one and naming a boolean.
    const met = Object.fromEntries(Object.entries(FLOORS).map(([k, v]) => [k, shapes[k as keyof typeof shapes] >= v]));
    expect({ shapes, met }).toEqual({ shapes, met: Object.fromEntries(Object.keys(FLOORS).map((k) => [k, true])) });
  }, 120_000);
});

// ── a recovered buffer is a PREFIX, and a prefix cuts mid-path ────────────────────────
//
// The partial-recovery branch parsed `err.stdout` whole. Measured on a real busy worktree:
// 30,000 modified files, 2.4 MB of status output, 1,048,576 bytes recovered, 13,108 entries
// parsed — the last of them `dir_with_a_re`, a path that does not exist, invented by the cut.
// It entered `changedFiles` and from there the `byFile` map, so a conflict could be rendered
// against a file nobody has. Fabricated data reaching a displayed figure.
//
// PINNED AT THE PRODUCER, not at the render. The producer is this recovery path and the
// consumer is the conflict map; the shape that got past three lenses three times is a barrier
// on the consumer with the producer free underneath it.
describe('a truncated git status never invents a filename', () => {
  /** A worktree with enough modified files that a small maxBuffer cuts mid-path. */
  function busyWorktree(prefix: string): { root: string; files: string[] } {
    const root = mkTmpDir(`mc-truncate-${prefix}-`);
    cleanupDirs.push(root);
    initGitRepo(root);
    // Deliberately LONG names: a cut lands inside one, which is the whole defect. Short names
    // would let a buffer boundary fall between records by luck and hide it.
    const files: string[] = [];
    for (let i = 0; i < 400; i++) {
      const name = `directory_with_a_really_long_name_${String(i).padStart(4, '0')}/source_file_with_a_long_name.ts`;
      fs.mkdirSync(path.join(root, path.dirname(name)), { recursive: true });
      fs.writeFileSync(path.join(root, name), 'x\n');
      files.push(name);
    }
    return { root, files };
  }

  test('wholeLinesOf keeps every complete record and nothing else', () => {
    const full = ' M src/alpha.ts\n M src/beta.ts\n M dir_with_a_really_long_name/gamma.ts\n';
    expect(wholeLinesOf(full)).toBe(full); // a complete buffer is untouched

    const cut = full.slice(0, full.indexOf('dir_with_a_re') + 'dir_with_a_re'.length);
    expect(parseStatusPorcelain(cut)).toContain('dir_with_a_re'); // THE DEFECT, reproduced
    expect(parseStatusPorcelain(wholeLinesOf(cut))).toEqual(['src/alpha.ts', 'src/beta.ts']);

    // A buffer with no complete record at all yields nothing rather than half a path.
    expect(wholeLinesOf(' M dir_with')).toBe('');
    expect(parseStatusPorcelain(wholeLinesOf(' M dir_with'))).toEqual([]);
  });

  test('a buffer cut mid-path yields a prefix of the real files, never a new one', async () => {
    const { root, files } = busyWorktree('midpath');
    const complete = await changedFilesFor(root);
    expect(complete.readable).toBeUndefined();
    expect(complete.changedFiles).toHaveLength(files.length); // the premise: a real, full answer

    // A buffer far too small for the output, so Node kills the child and hands back a prefix.
    const truncated = await changedFilesFor(root, { maxBuffer: 4_096 });

    // THE FABRICATION IS GONE. Every recovered entry is one git really reported — checked
    // against the complete answer, not against this test's own idea of the names.
    const real = new Set(complete.changedFiles);
    const invented = truncated.changedFiles.filter((f) => !real.has(f));
    expect(invented).toEqual([]);

    // NON-VACUITY: the cut really happened, and it really landed mid-path — so the assertion
    // above is about the fix rather than about a buffer that never needed one.
    expect(truncated.changedFiles.length).toBeGreaterThan(0);
    expect(truncated.changedFiles.length).toBeLessThan(complete.changedFiles.length);
    expect(truncated.reason).toContain('trailing bytes discarded as a partial path');

    // AND IT IS REPORTED AS PARTIAL, which is the half no parsing can supply.
    expect(truncated.readable).toBe(false);
    expect(truncated.reason).toContain('PREFIX');
  });

  // THE HALF THAT CANNOT COME FROM THE BYTES. A recovered buffer ending exactly on a newline
  // is byte-identical to a complete one, so an implementation that decided "partial" by
  // inspecting the tail would call this clean — flipping the failure from a conflict
  // fabricated to a conflict silently MISSED, which is quieter and worse.
  test('a truncation that lands exactly on a record boundary is still reported as partial', async () => {
    const { root } = busyWorktree('boundary');
    const complete = await changedFilesFor(root);
    expect(complete.readable).toBeUndefined();

    // THE BOUNDARY MUST BE GIT'S, AND IT IS READ FROM GIT. An earlier version rebuilt the
    // record as ` M ${complete.changedFiles[0]}\n` — an invented ` M ` prefix wrapped around
    // an already-PARSED field — and landed on git's real 43 bytes only because git happens to
    // emit `?? directory_…/` at the same width. Two assumptions, both silent, and the second
    // is now false in general: a quoted path's raw record is longer than the path it parses
    // to. Take the bytes git actually wrote and count them.
    const raw = execFileSync('git', [...STATUS_ARGV], {
      cwd: root,
      encoding: 'utf8',
      // THE COLLECTOR'S OWN ENV, because the boundary has to be the one changedFilesFor really
      // receives. Reading bare git here measured a different stream from the one being cut, and
      // an ambient `status.showUntrackedFiles=no` emptied it outright.
      env: { ...process.env, ...statusConfigEnv() },
    });
    const records = raw.split('\n').filter((l) => l);
    expect(records.length).toBeGreaterThan(3); // premise: there is somewhere to cut between
    // maxBuffer is counted in BYTES by Node, so the boundary is measured in bytes too.
    const exact = Buffer.byteLength(records.slice(0, 3).join('\n') + '\n', 'utf8');

    const truncated = await changedFilesFor(root, { maxBuffer: exact });
    expect(truncated.changedFiles).toHaveLength(3); // the cut landed exactly where intended
    expect(truncated.readable).toBe(false); // …even though the bytes look complete
    expect(truncated.reason).not.toContain('trailing bytes discarded'); // nothing WAS discarded
    expect(truncated.changedFiles.length).toBeLessThan(complete.changedFiles.length);
    for (const f of truncated.changedFiles) expect(complete.changedFiles).toContain(f);
  });

  // THE CONSUMER, and the assertion is independent of the parser: every file a conflict names
  // must EXIST ON DISK in the worktrees it names. A path invented by a cut does not, and
  // neither does one still wearing its C-quotes.
  //
  // THIS TEST WAS VACUOUS AND IT WAS THE EXACT SHAPE IT EXISTS TO PREVENT. detectConflicts
  // took no opts, so the sweep ran at the full 8 MiB ceiling against a fixture producing 8,600
  // bytes — 0.10% of the bound. Both worktrees came back `readable === undefined`; the
  // recovery branch never executed. PROVEN by restoring the defect in full
  // (`parseStatusPorcelain(stdout)`): this test still passed, and only the direct producer
  // test failed. A barrier that cannot reach the branch it guards is the defect it guards
  // against, one level up.
  //
  // Two things fix it, and both are asserted below rather than assumed: the maxBuffer seam so
  // the cut really happens, and exotic names so the quoting path is really exercised.
  test('no rendered conflict names a file that does not exist', async () => {
    const parent = mkTmpDir('mc-truncate-conflicts-');
    cleanupDirs.push(parent);
    const projectRoot = path.join(parent, 'ashcroft');
    initGitRepo(projectRoot);

    const wtA = path.join(projectRoot, '.worktrees', 'ceo-1-1');
    const wtB = path.join(projectRoot, '.worktrees', 'ceo-2-2');
    addWorktree(projectRoot, wtA, 'ceo-1-1');
    addWorktree(projectRoot, wtB, 'ceo-2-2');
    writeRegistry(projectRoot, [
      { name: 'ceo-1', token: '1' },
      { name: 'ceo-2', token: '2' },
    ]);

    // EVERY NAME GIT QUOTES, in both worktrees. All sort before the `zzz_` bulk below, so they
    // survive the cut and the exists-on-disk barrier is actually applied to quoted paths —
    // the old fixture was pure ASCII, which is why F2 sailed through it.
    //
    // THE PROPERTY IS NOT A RUNTIME INVARIANT, AND MUST NEVER BE PROMOTED TO ONE. "No rendered
    // conflict names a file that does not exist" is FALSE on the success path for DELETED
    // files: `changedFilesFor` correctly returns `deleted.ts` with `readable: undefined` and
    // the path is genuinely absent from disk. Reporting a deletion is right — two worktrees
    // deleting the same file is a real conflict — so the absence is the answer, not a defect.
    // This test holds only because its fixture contains no deletions. It is a FIXTURE-SCOPED
    // barrier against fabrication, not a claim about every path the collector can emit.
    //
    // AND THE PRECONDITION, because the mutation table in the PR body omitted it and read as
    // though this fires unconditionally: reverting BOTH quoting halves only renders a bad path
    // on a machine that already has `core.quotePath=false` somewhere ambient. In a clean
    // environment git's default quoting saves it and nothing bad renders. The property is still
    // true — no SINGLE mutation lets a fabricated path through — but this barrier is only
    // reachable on a machine configured the way the bug requires, which is a weaker statement
    // than the table made and is the honest one.
    //
    // AND THE FIXTURE IS WHY THE BARRIER STAYED GREEN THROUGH THE SURROGATE DEFECT TOO: a
    // space-and-astral name is the combination that reaches the decoder with a raw astral
    // character in it, and the first version of this list did not have one. That is twice now
    // that this barrier was only as good as the names someone thought to write down, which is
    // the argument for #46 — assert against `git status -z`, where git supplies the names.
    const exotic = [
      'with space.ts',
      'nonascii-café.ts',
      'emoji-🔥.ts',
      'fire 🔥 space.ts', // space FORCES the quoting; the astral char is what got destroyed
      'math 𝛼 space.ts', // outside the BMP, and not an emoji
      'arrow -> looking.ts',
      'quote".ts',
      'back\\slash.ts',
      'tab\tinside.ts',
      'newline\ninside.ts',
    ];
    // The SAME files in both worktrees, so there are real conflicts to find and a cut has
    // something long to land in the middle of.
    for (const wt of [wtA, wtB]) {
      for (const n of exotic) fs.writeFileSync(path.join(wt, n), `from ${path.basename(wt)}\n`);
      for (let i = 0; i < 200; i++) {
        const name = `zzz_directory_with_a_really_long_name_${String(i).padStart(4, '0')}/shared_source_file.ts`;
        fs.mkdirSync(path.join(wt, path.dirname(name)), { recursive: true });
        fs.writeFileSync(path.join(wt, name), `from ${path.basename(wt)}\n`);
      }
    }
    // A REAL RENAME, committed then moved, so the ` -> ` branch is on the swept path too.
    for (const wt of [wtA, wtB]) {
      fs.writeFileSync(path.join(wt, 'old renamed.ts'), 'shared\n');
      execFileSync('git', ['add', '--', 'old renamed.ts'], { cwd: wt });
      execFileSync('git', ['-c', 'user.email=t@t.t', '-c', 'user.name=t', 'commit', '-qm', 'seed'], { cwd: wt });
      execFileSync('git', ['mv', '--', 'old renamed.ts', 'new renamed.ts'], { cwd: wt });
    }

    const claudeRoot = mkTmpDir('mc-truncate-conflicts-claude-');
    cleanupDirs.push(claudeRoot);
    const project = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find(
      (p) => p.root === projectRoot
    )!;

    // THE SEAM, AND THE WHOLE POINT OF IT: small enough that git's output really is cut, so
    // the recovery branch this test exists to guard actually runs.
    const report = await detectConflicts(project, { maxBuffer: 4_096 });

    // NON-VACUITY 1 — the cut happened. Without this the test can silently go back to
    // measuring nothing the moment the fixture or the ceiling changes.
    expect(report.worktrees.length).toBe(2);
    expect(report.worktrees.every((w) => w.readable === false)).toBe(true);
    for (const w of report.worktrees) {
      expect(w.reason).toContain('trailing bytes discarded as a partial path');
      expect(w.changedFiles.length).toBeLessThan(200); // a prefix, not the whole answer
      expect(w.changedFiles.length).toBeGreaterThan(exotic.length);
    }

    // NON-VACUITY 2 — the quoted names really are in what got rendered, so the barrier below
    // is applied to paths that needed decoding rather than only to plain ASCII.
    const conflictFiles = new Set(report.conflicts.map((c) => c.file));
    for (const n of exotic) expect(conflictFiles).toContain(n);
    expect(conflictFiles).toContain('new renamed.ts'); // the rename's NEW path, decoded

    // Premise: this fixture really does produce conflicts, so the loop below is not empty.
    expect(report.conflicts.length).toBeGreaterThan(0);

    // THE BARRIER. Collected and asserted once, so a failure names every bad path instead of
    // stopping at the first.
    const missing: string[] = [];
    let checked = 0;
    for (const conflict of report.conflicts) {
      for (const w of conflict.worktrees) {
        if (!fs.existsSync(path.join(w.path, conflict.file))) missing.push(conflict.file);
        checked++;
      }
    }
    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(0);
  }, 60_000);
});

describe('detectConflicts reports a failed enumeration rather than an empty one', () => {
  test('a project git refuses to enumerate returns enumerated.readable === false with a reason', async () => {
    const parent = mkTmpDir('mc-enum-fail-');
    cleanupDirs.push(parent);
    const root = path.join(parent, 'notarepo');
    // A directory carrying a `.git` FILE that points nowhere: discoverProjects sees a project
    // (it tests for the presence of .git), and `git worktree list` exits non-zero inside it.
    // This is the orphaned-worktree shape the reviewer reproduced, in miniature.
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, '.git'), 'gitdir: /nonexistent/gitdir/for/this/test\n');
    const claudeRoot = mkTmpDir('mc-enum-fail-claude-');
    cleanupDirs.push(claudeRoot);
    const project = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find((p) => p.root === root)!;
    expect(project).toBeDefined(); // the premise: this IS discovered as a project

    const report = await detectConflicts(project);

    expect(report.enumerated.readable).toBe(false);
    if (!report.enumerated.readable) {
      expect(report.enumerated.reason).toContain(root);
      expect(report.enumerated.reason).toMatch(/UNKNOWN rather than empty/);
    }
    // The empty list is still empty — the point is that it now carries the reason it is
    // empty, so nothing downstream can read it as "this project has no worktrees".
    expect(report.worktrees).toEqual([]);
    expect(report.excluded.count).toBe(0);
  });

  test('a healthy project reports enumerated.readable === true — the flag is not always false', async () => {
    const parent = mkTmpDir('mc-enum-ok-');
    cleanupDirs.push(parent);
    const root = path.join(parent, 'proj');
    initGitRepo(root);
    const claudeRoot = mkTmpDir('mc-enum-ok-claude-');
    cleanupDirs.push(claudeRoot);
    const project = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find((p) => p.root === root)!;
    const report = await detectConflicts(project);
    expect(report.enumerated.readable).toBe(true);
  });
});

// ── the sweep's scope: narrowing must be visible, never silent ────────────────────────
describe('scopeSweep', () => {
  function entry(over: Partial<WorktreeEntry>): WorktreeEntry {
    return {
      path: '/x/.worktrees/w',
      head: 'aaaa',
      branch: 'feat/x',
      isMain: false,
      locked: false,
      prunable: false,
      registryMatch: { name: 'ceo-1', token: '1' },
      ...over,
    };
  }

  test('sweeps registry-named, non-prunable, non-main worktrees and excludes the rest', () => {
    const entries = [
      entry({ path: '/x', isMain: true }),
      entry({ path: '/x/.worktrees/agent' }),
      entry({ path: '/x/.worktrees/hand-made', registryMatch: null }),
      entry({ path: '/x/.worktrees/stale', prunable: true }),
    ];
    const { swept, excluded } = scopeSweep(entries);
    expect(swept.map((w) => w.path)).toEqual(['/x/.worktrees/agent']);
    expect(excluded.map((w) => w.path)).toEqual(['/x/.worktrees/hand-made', '/x/.worktrees/stale']);
  });

  test('the partition is total: every non-main entry lands in exactly one side', () => {
    const entries = [
      entry({ path: '/x', isMain: true }),
      entry({ path: '/a' }),
      entry({ path: '/b', registryMatch: null }),
      entry({ path: '/c', prunable: true }),
      entry({ path: '/d', registryMatch: null, prunable: true }),
    ];
    const { swept, excluded } = scopeSweep(entries);
    const nonMain = entries.filter((e) => !e.isMain).length;
    expect(swept.length + excluded.length).toBe(nonMain);
    expect(new Set([...swept, ...excluded]).size).toBe(nonMain); // no entry counted twice
  });
});

// ── "I could not look" is not "there is nothing here" ────────────────────────────────
// Defect 2 in server/collectors/conflicts.ts: `catch { return [] }` rendered a pruned or
// unreadable worktree as CLEAN — the one answer nobody investigates. Modelled on the exit-2
// handling in empty.ts, which shipped this distinction first.
describe('changedFilesFor reports could-not-look separately from clean', () => {
  test('a path that does not exist returns readable:false with a real reason', async () => {
    const parent = mkTmpDir('mc-conflicts-gone-');
    cleanupDirs.push(parent);
    const gone = path.join(parent, 'no-such-worktree');
    expect(fs.existsSync(gone)).toBe(false); // the premise of this test is true

    const result = await changedFilesFor(gone);

    expect(result.readable).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason!.length).toBeGreaterThan(0);
    expect(result.reason).toContain(gone);
    // NON-VACUITY. The defect being pinned is not "readable is false" — it is that the
    // could-not-look flag exists AT ALL rather than the shape `{changedFiles: [], readable:
    // undefined}`, which is byte-for-byte what a clean worktree returns. An empty file list
    // on its own must never be the whole answer here.
    expect(result.readable).not.toBeUndefined();
    expect({ changedFiles: result.changedFiles, readable: result.readable }).not.toEqual({
      changedFiles: [],
      readable: undefined,
    });
  });

  test('a real, readable worktree returns readable:undefined — the flag is not always set', async () => {
    // The mirror image, and the reason the test above is not vacuous: if `readable: false`
    // were returned unconditionally, this assertion goes red.
    const root = mkTmpDir('mc-conflicts-clean-');
    cleanupDirs.push(root);
    initGitRepo(root);
    const result = await changedFilesFor(root);
    expect(result.readable).toBeUndefined();
    expect(result.reason).toBeUndefined();
    expect(result.changedFiles).toEqual([]);
  });

  test('an unreadable worktree survives the whole detectConflicts path as readable:false', async () => {
    // Through the real collector, not the helper — the three-state has to reach the payload
    // the view renders, not merely exist in a function no data flows through.
    const parent = mkTmpDir('mc-conflicts-noperm-parent-');
    cleanupDirs.push(parent);
    const root = path.join(parent, 'proj');
    initGitRepo(root);
    const wt = path.join(root, '.worktrees', 'ceo-9-900');
    addWorktree(root, wt, 'ceo-9-900');
    writeRegistry(root, [{ name: 'ceo-9', token: '900' }]);
    const claudeRoot = mkTmpDir('mc-conflicts-noperm-claude-');
    cleanupDirs.push(claudeRoot);
    const proj = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find((p) => p.root === root)!;

    // The `.git` FILE, not the worktree directory — and the difference is load-bearing.
    // Probed directly: `chmod 000` on the directory makes `git worktree list --porcelain`
    // report `prunable gitdir file points to non-existent location`, so scopeSweep excludes
    // it and it never reaches the sweep at all (correctly — git considers it dead). Making
    // the `.git` pointer file unreadable leaves the worktree live in git's own listing while
    // `git status` there exits 128, which is the real could-not-look shape.
    const gitPointer = path.join(wt, '.git');
    fs.chmodSync(gitPointer, 0o000);
    try {
      const report = await detectConflicts(proj);
      // realpath, not the fixture string: mkdtemp hands back /var/folders/… while macOS
      // routes that through a symlink, so git reports the same worktree as /private/var/…
      // and a direct comparison finds nothing. Same trap worktrees.ts's isMain documents.
      const swept = report.worktrees.find((w) => fs.realpathSync(w.path) === fs.realpathSync(wt));
      expect(swept).toBeDefined(); // it WAS swept — not silently excluded
      expect(swept!.readable).toBe(false);
      expect(swept!.reason).toBeTruthy();
      expect(report.conflicts).toEqual([]); // and it is NOT reported as clean-with-nothing-to-say
      expect(report.excluded.count).toBe(0);
    } finally {
      fs.chmodSync(gitPointer, 0o644);
    }
  });
});

// ── the sweep must not become a shell ─────────────────────────────────────────────────
// THE SECOND, INDEPENDENT BARRIER behind the source-text guard in crosscheck.test.ts.
// PR4 converts this collector from execFileSync to the async form, which meant relaxing one
// pattern in that regex guard — and a regex over source text is gameable by construction.
// This test reads no source: it builds a real worktree whose path carries shell
// metacharacters, runs the real sweep over it, and checks the filesystem for the marker a
// shell would have created. §0: two cheap independent checks beat one careful one.
describe('detectConflicts is not vulnerable to shell injection via a worktree path', () => {
  // ACROSS ALL THREE STATES, not just the happy one.
  //
  // The first version of this barrier built a HEALTHY worktree, so it exercised exactly one
  // of changedFilesFor's three outcomes. A reviewer wrote variant C: safe execFile on the
  // happy path, a shell string only in the CATCH branch — "git failed, so try harder" — and
  // this barrier passed it on both assertions, because the fixture never made git fail. That
  // is §0's own corollary aimed at the barrier: an assertion inside a branch that never runs
  // reads as coverage, and the branch that never ran was the error path the three-state fix
  // exists for.
  //
  // So one malicious project now carries all three: a healthy worktree, an unreadable one
  // (the catch branch, reached by making the `.git` pointer unreadable — chmod 000 on the
  // DIRECTORY instead makes git report it prunable, which excludes it and never enters the
  // sweep), and one the registry does not name (excluded). The states are asserted to have
  // actually occurred, so the fixture cannot quietly stop covering them.
  test('a malicious project executes nothing on ANY of the three sweep outcomes', async () => {
    const parent = mkTmpDir('mc-conflicts-security-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_CONFLICTS_${crypto.randomUUID()}`;
    const maliciousRoot = path.join(parent, `evilproj;touch ${bareMarker};echo done`);

    initGitRepo(maliciousRoot);
    const healthy = path.join(maliciousRoot, '.worktrees', 'ceo-1-1');
    const unreadable = path.join(maliciousRoot, '.worktrees', 'ceo-2-2');
    const excluded = path.join(maliciousRoot, '.worktrees', 'by-hand');
    addWorktree(maliciousRoot, healthy, 'ceo-1-1');
    addWorktree(maliciousRoot, unreadable, 'ceo-2-2');
    addWorktree(maliciousRoot, excluded, 'by-hand');
    writeRegistry(maliciousRoot, [
      { name: 'ceo-1', token: '1' },
      { name: 'ceo-2', token: '2' },
    ]);
    fs.writeFileSync(path.join(healthy, 'touched.txt'), 'x\n');
    fs.writeFileSync(path.join(excluded, 'ignored.txt'), 'x\n');

    const claudeRoot = mkTmpDir('mc-conflicts-security-claude-');
    cleanupDirs.push(claudeRoot);
    const proj = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find((p) => p.root === maliciousRoot)!;

    const gitPointer = path.join(unreadable, '.git');
    fs.chmodSync(gitPointer, 0o000);
    let markers: string[] = [];
    try {
      const report = await detectConflicts(proj);

      // ANYWHERE, not one guessed path. changedFilesFor passes `cwd: worktreePath`, so a
      // shell it spawned would drop the marker in the WORKTREE — which the first version of
      // this assertion never looked at. See findMarkerAnywhere for the two-variant repro
      // proving that version passed against a live RCE.
      markers = findMarkerAnywhere(bareMarker, [parent]);
      expect(markers).toEqual([]);

      // THE THREE STATES REALLY OCCURRED. Without these the marker check above could be
      // passing because the sweep silently did nothing — a barrier certifying an empty run.
      const ok = report.worktrees.find((w) => w.readable === undefined);
      const failed = report.worktrees.find((w) => w.readable === false);
      expect(ok).toBeDefined(); // happy path
      expect(failed).toBeDefined(); // catch branch — variant C's hiding place
      expect(report.excluded.count).toBe(1); // excluded path
      expect(ok!.changedFiles).toEqual(['touched.txt']); // …and the answer is still correct
      expect(failed!.reason).toBeTruthy();
    } finally {
      fs.chmodSync(gitPointer, 0o644);
      removeMarkers(markers);
    }
  });
});

// runLedgerVerify had NO behavioural barrier — only ledgerVerifyArgs' `--` shape test, which
// checks an array literal and executes nothing. Its inputs are just as attacker-influenceable
// as the sweep's: `projectRoot` is a directory name read off disk by discoverProjects(), and
// it reaches the call twice — joined into the script path, and as `cwd`. A shape test cannot
// tell you what the process did; only running it can.
describe('runLedgerVerify is not vulnerable to shell injection via the project root', () => {
  test('a project directory built from shell metacharacters executes nothing, anywhere', async () => {
    const parent = mkTmpDir('mc-belief-security-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_BELIEF_${crypto.randomUUID()}`;
    const maliciousRoot = path.join(parent, `evilproj;touch ${bareMarker};echo done`);

    // A real, runnable stand-in for scripts/ledger.mjs that prints the exact two lines
    // parseLedgerVerifyOutput reads. The verify has to genuinely SUCCEED here, or "no marker"
    // would be satisfied by the command never running at all — which is a pass for the wrong
    // reason, and the failure mode this whole review round is about.
    fs.mkdirSync(path.join(maliciousRoot, 'scripts'), { recursive: true });
    fs.writeFileSync(
      path.join(maliciousRoot, 'scripts', 'ledger.mjs'),
      [
        "process.stdout.write('ledger verify: 2 claims · offline\\n');",
        "process.stdout.write('  ✓ c-alpha [claim-freshness] ok\\n');",
        "process.stdout.write('  ⚠ would_block c-beta [claim-source] unresolved: offline\\n');",
        "process.stdout.write('\\nledger verify: 1 pass · 1 would_block (shadow) · 0 block\\n');",
        '',
      ].join('\n')
    );

    let markers: string[] = [];
    try {
      const result = await runLedgerVerify(maliciousRoot, { offline: true });

      markers = findMarkerAnywhere(bareMarker, [parent]);
      expect(markers).toEqual([]);

      // The command really ran and really parsed — this barrier is not passing because the
      // subprocess failed to start.
      expect('pass' in result).toBe(true);
      if ('pass' in result) {
        expect(result.pass).toBe(1);
        expect(result.wouldBlock).toBe(1);
        expect(result.totalClaims).toBe(2);
      }
    } finally {
      removeMarkers(markers);
    }
  });
});

describe('parseStatusPorcelain', () => {
  test('handles plain changes and renames', () => {
    const text = ' M modified.txt\n?? untracked.txt\nR  old.txt -> new.txt\n';
    expect(parseStatusPorcelain(text)).toEqual(['modified.txt', 'untracked.txt', 'new.txt']);
  });
});

// ── fleet ────────────────────────────────────────────────────────────────────────────
describe('parseWarroomFleetOutput', () => {
  test('parses the LAUNCHER/LINES/FN/GEN/SCOPE table', () => {
    const text = [
      'warroom fleet — READ-ONLY, nothing is written',
      '',
      '  LAUNCHER          LINES  FN   GEN       SCOPE',
      '  acme               2769  47   c146d297  in scope',
      '  adamos             2407  45   30e0c7aa  excluded',
      '',
      '  2 launchers, 2 generations total',
    ].join('\n');
    const rows = parseWarroomFleetOutput(text);
    expect(rows).toEqual([
      { name: 'acme', lines: 2769, fns: 47, gen: 'c146d297', scope: 'in scope' },
      { name: 'adamos', lines: 2407, fns: 45, gen: '30e0c7aa', scope: 'excluded' },
    ]);
  });
});

// ── belief ───────────────────────────────────────────────────────────────────────────
describe('parseLedgerVerifyOutput', () => {
  test('parses the summary line and the claim-count header', () => {
    const text = 'ledger verify: 34 claims · offline\n  events → /tmp/x\n\n  ✓ c-a [claim-command] ok\n\nledger verify: 30 pass · 4 would_block (shadow) · 0 block\n';
    expect(parseLedgerVerifyOutput(text)).toMatchObject({ totalClaims: 34, pass: 30, wouldBlock: 4, block: 0 });
  });
});

describe('ledgerVerifyArgs', () => {
  // MINOR from review round 3: ledgerScript is derived from project.root (an
  // attacker-influenceable directory name), passed to `node` as a bare positional argv
  // element — the same shape empty.ts's grep sentinel guards against. Inert under the
  // shipped default (roots always absolute) but closes the class unconditionally.
  test("inserts '--' immediately before the ledger script path", () => {
    const args = ledgerVerifyArgs('/some/project/scripts/ledger.mjs', true);
    expect(args[0]).toBe('--');
    expect(args[1]).toBe('/some/project/scripts/ledger.mjs');
    expect(args).toEqual(['--', '/some/project/scripts/ledger.mjs', 'verify', '--offline']);
  });

  test('omits --offline when offline:false', () => {
    expect(ledgerVerifyArgs('/x/scripts/ledger.mjs', false)).toEqual(['--', '/x/scripts/ledger.mjs', 'verify']);
  });
});

// The global ledger — ~/.warroom/ledger/global.yml. Nothing in server/ read this file
// before PR4, so the Belief view could not show either of the waivers holding claims open.
// ABSENT AND EMPTY MUST NOT RENDER IDENTICALLY: every failure path below returns
// {present: false, reason} and none of them returns an empty claim list.
describe('readGlobalLedger', () => {
  function writeGlobal(body: string): string {
    const dir = mkTmpDir('mc-global-ledger-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'global.yml');
    fs.writeFileSync(file, body);
    return file;
  }

  const ONE_CLAIM = [
    'claims:',
    '  - id: c-example-global',
    '    assert: "something true of this machine"',
    '    kind: runtime-capability',
    '    scope: global',
    '    verified_by: command',
    '    evidence:',
    '      cmd: "true"',
    '      expect_exit: 0',
    '    valid_until: 2026-11-09',
    '    confidence: 1',
    '',
  ].join('\n');

  test('a file that does not exist is present:false with a reason — never an empty list', () => {
    const missing = path.join(mkTmpDir('mc-global-missing-'), 'global.yml');
    cleanupDirs.push(path.dirname(missing));
    const result = readGlobalLedger(missing);

    expect(result.present).toBe(false);
    if (result.present) throw new Error('unreachable — narrowing only');
    expect(result.reason).toContain(missing);
    expect(result.reason).toMatch(/does not exist/);
    // NON-VACUITY: the shape must not carry a claims array at all. An absent ledger that
    // answered `{claims: []}` would render as "this machine believes nothing globally",
    // which is a completely different statement from "there is no global ledger here".
    expect((result as unknown as { claims?: unknown }).claims).toBeUndefined();
  });

  test('a real file parses through the ledger\'s own parser and keeps scope:global claims', () => {
    const result = readGlobalLedger(writeGlobal(ONE_CLAIM));
    expect(result.present).toBe(true);
    if (!result.present) throw new Error('unreachable — narrowing only');
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0]!.id).toBe('c-example-global');
    // ledger.mjs stamps the same two fields onto these claims; a row in the view names
    // where a claim lives exactly as the ledger would.
    expect(result.claims[0]!.source_file).toBe('~/.warroom/ledger/global.yml');
    expect(result.rejected).toBe(0);
  });

  test('a file the strict parser refuses is present:false, not silently zero claims', () => {
    // A tab in indentation — one of the shapes scripts/lib/claims.js throws on rather than
    // guessing at. A parser that returned [] here would report "0 global claims, all good"
    // for a file full of real ones, which is the exact failure the ledger exists to prevent.
    const file = writeGlobal('claims:\n\t- id: c-tabbed\n');
    const result = readGlobalLedger(file);
    expect(result.present).toBe(false);
    if (result.present) throw new Error('unreachable — narrowing only');
    expect(result.reason).toContain(file);
    expect(result.reason).toMatch(/refused/);
  });

  test('a parseable file with no claims: list is present:false, and says why', () => {
    const result = readGlobalLedger(writeGlobal('something_else: 1\n'));
    expect(result.present).toBe(false);
    if (result.present) throw new Error('unreachable — narrowing only');
    expect(result.reason).toMatch(/no "claims:" list/);
  });

  test('an entry the schema rejects is counted, not silently kept or silently dropped', () => {
    const result = readGlobalLedger(writeGlobal(ONE_CLAIM + '  - id: c-broken\n    kind: nonsense\n'));
    expect(result.present).toBe(true);
    if (!result.present) throw new Error('unreachable — narrowing only');
    expect(result.claims).toHaveLength(1); // the good one survives
    expect(result.rejected).toBeGreaterThan(0); // and the bad one is REPORTED
    // validateClaim locates a bad entry by index, not by id — an entry can be malformed
    // precisely because it has no usable id, so the index is the thing that always exists.
    expect(result.issues.join('\n')).toContain('claims[1]');
    expect(result.issues.join('\n')).toContain('nonsense');
  });
});

// A LAPSED WAIVER MUST BE DISTINGUISHABLE FROM A LIVE ONE — rule 9's whole point, and the
// state this machine cannot demonstrate today: the one live waiver here expires 2026-09-08
// and c-runtime-nested-spawn was Refreshed on 2026-08-13. So the lapsed branch would ship
// having never been executed unless a fixture forces it.
describe('collectWaivers', () => {
  const NOW = Date.parse('2026-08-13T12:00:00Z');
  // Built through validateGlobalClaim — the same function readGlobalLedger uses — so a waiver
  // fixture cannot describe a claim the global ledger would refuse. As a literal with `as
  // GlobalClaim` it carried no confidence and no valid_until, both of which the schema
  // requires of a scope:global claim.
  function claim(id: string, disposition: unknown): GlobalClaim {
    return globalClaim({ id, assert: 'x', ...(disposition === undefined ? {} : { disposition }) });
  }

  test('an unexpired waiver is lapsed:false with days remaining', () => {
    const [w] = collectWaivers([claim('c-live', { action: 'waive', until: '2026-09-08', reason: 'r' })], NOW);
    expect(w!.lapsed).toBe(false);
    expect(w!.days).toBe(26);
    expect(w!.until).toBe('2026-09-08');
  });

  test('a waiver past its date is lapsed:true with days overdue', () => {
    const [w] = collectWaivers([claim('c-lapsed', { action: 'waive', until: '2026-07-01', reason: 'r' })], NOW);
    expect(w!.lapsed).toBe(true);
    expect(w!.days).toBeGreaterThan(0);
  });

  // THE ONE FIXTURE HERE THE VALIDATOR WOULD REFUSE, and deliberately so. `validateClaim`
  // requires a real YYYY-MM-DD `until` on action:waive, so readGlobalLedger can no longer hand
  // this shape to collectWaivers — which makes this a defense-in-depth branch, not a reachable
  // one. It is kept, and built around the builder with the reason stated, because "an
  // unparseable deadline reads as still in force" is the one way this function could be wrong
  // that nobody would notice: it fails silently, in the safe-looking direction.
  test('a waiver whose until is not a date is lapsed, with days null — never quietly live', () => {
    const bad: GlobalClaim = { ...claim('c-bad', undefined), disposition: { action: 'waive', until: 'someday', reason: 'r' } };
    const [w] = collectWaivers([bad], NOW);
    expect(w!.lapsed).toBe(true);
    expect(w!.days).toBeNull();
  });

  test('refresh and deprecate dispositions are not waivers, and neither is no disposition', () => {
    const claims = [
      claim('c-refreshed', { action: 'refresh', reason: 'r' }),
      claim('c-deprecated', { action: 'deprecate', reason: 'r' }),
      claim('c-plain', undefined),
    ];
    expect(collectWaivers(claims, NOW)).toEqual([]);
  });

  test('lapsed waivers sort first — the triage order, not the file order', () => {
    const ids = collectWaivers(
      [
        claim('c-live', { action: 'waive', until: '2026-09-08', reason: 'r' }),
        claim('c-lapsed', { action: 'waive', until: '2026-07-01', reason: 'r' }),
      ],
      NOW
    ).map((w) => w.claimId);
    expect(ids).toEqual(['c-lapsed', 'c-live']);
  });
});

// Per-scope verdict counts are attributed from the per-claim lines of ONE verify run —
// never a second `verify --scope=` invocation, because verify appends to events.jsonl and
// running it twice doubles the writes. The attribution is then checked against the SAME
// run's own summary line, which is the second, independent reading.
describe('attributeVerdicts', () => {
  const RAW = [
    'ledger verify: 3 claims · offline',
    '  events → /tmp/x',
    '',
    '  ✓ c-proj-one [claim-freshness] ok',
    '  ✓ c-proj-one [claim-command] ok',
    '  ⚠ would_block c-proj-two [claim-source] unresolved: offline',
    '  ✓ c-glob-one [claim-freshness] ok',
    '',
    'ledger verify: 3 pass · 1 would_block (shadow) · 0 block',
  ].join('\n');

  const summary: LedgerVerifySummary = parseLedgerVerifyOutput(RAW);
  const scopeOf = new Map<string, 'project' | 'global'>([
    ['c-proj-one', 'project'],
    ['c-proj-two', 'project'],
    ['c-glob-one', 'global'],
  ]);

  test('parses one entry per RESOLVER RUN, not per claim', () => {
    const lines = parseLedgerVerifyLines(RAW);
    expect(lines).toHaveLength(4); // 3 claims, 4 runs — c-proj-one has two resolvers
    expect(lines.filter((l) => l.claimId === 'c-proj-one')).toHaveLength(2);
    expect(lines.find((l) => l.claimId === 'c-proj-two')!.verdict).toBe('would_block');
  });

  test('splits by scope and agrees with the run\'s own summary line', () => {
    const attributed = attributeVerdicts(summary, scopeOf);
    expect(attributed.consistent).toBe(true);
    expect(attributed.unattributed).toBe(0);
    expect(attributed.byScope.project).toEqual({ pass: 2, wouldBlock: 1, block: 0 });
    expect(attributed.byScope.global).toEqual({ pass: 1, wouldBlock: 0, block: 0 });
  });

  // THE SECOND BARRIER, PROVEN ABLE TO FIRE. Without this the consistency check is a
  // branch nothing ever executes, which reads as coverage and is not.
  test('a claim in neither scope set makes the split inconsistent rather than wrong', () => {
    const attributed = attributeVerdicts(summary, new Map([['c-proj-one', 'project' as const]]));
    expect(attributed.unattributed).toBe(2);
    expect(attributed.consistent).toBe(false);
    expect(attributed.reason).toContain('unattributed');
  });

  test('a summary that disagrees with its own per-claim lines is caught', () => {
    // The shape a reworded verdict prefix would produce: lines parse, totals do not match.
    const drifted: LedgerVerifySummary = { ...summary, pass: 99 };
    const attributed = attributeVerdicts(drifted, scopeOf);
    expect(attributed.consistent).toBe(false);
    expect(attributed.reason).toMatch(/disagree/);
  });
});

// C4. runLedgerVerify's return type promises {present: false, reason} for a run it could not
// read, and the implementation threw instead: parseLedgerVerifyOutput throws when the summary
// line is missing, and the partial-stdout branch deliberately feeds it partial output. A
// verify that printed some claims and then died — including via this file's own 60 s timeout,
// which exists for exactly that case — escaped the collector, passed the route, and reached
// the browser as HTTP 500. A type that says "I report my failures" while throwing is worse
// than no type, because every caller was written against the promise.
describe('runLedgerVerify never throws where its type promises an absence', () => {
  function fixtureProject(prefix: string, script: string): string {
    const parent = mkTmpDir(prefix);
    cleanupDirs.push(parent);
    const root = path.join(parent, 'proj');
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(root, 'scripts', 'ledger.mjs'), script);
    return root;
  }

  test('partial stdout with no summary line returns {present:false, reason}, not a throw', async () => {
    // The exact shape of an interrupted run: real claim lines, then death before the summary.
    const root = fixtureProject(
      'mc-verify-partial-',
      [
        "process.stdout.write('ledger verify: 35 claims · offline\\n');",
        "process.stdout.write('  ✓ c-alpha [claim-freshness] ok\\n');",
        'process.exit(1);',
        '',
      ].join('\n')
    );

    const result = await runLedgerVerify(root, { offline: true });

    expect('present' in result).toBe(true);
    if ('present' in result) {
      expect(result.present).toBe(false);
      expect(result.reason).toMatch(/do not contain its own summary line/);
      expect(result.reason).toMatch(/partial or interrupted run/);
    }
  });

  test('a run that emits nothing parseable at all is also reported, not thrown', async () => {
    const root = fixtureProject('mc-verify-garbage-', "process.stdout.write('not a ledger at all\\n');\n");
    const result = await runLedgerVerify(root, { offline: true });
    expect('present' in result && result.present === false).toBe(true);
  });

  test('a run that produces no stdout at all names the failure', async () => {
    const root = fixtureProject('mc-verify-crash-', "throw new Error('boom');\n");
    const result = await runLedgerVerify(root, { offline: true });
    expect('present' in result && result.present === false).toBe(true);
    if ('present' in result && result.present === false) {
      expect(result.reason).toMatch(/failed to run/);
    }
  });

  test('…and a complete run still parses — the failure paths did not swallow the success one', async () => {
    const root = fixtureProject(
      'mc-verify-ok-',
      [
        "process.stdout.write('ledger verify: 2 claims · offline\\n');",
        "process.stdout.write('  ✓ c-alpha [claim-freshness] ok\\n');",
        "process.stdout.write('\\nledger verify: 1 pass · 1 would_block (shadow) · 0 block\\n');",
        '',
      ].join('\n')
    );
    const result = await runLedgerVerify(root, { offline: true });
    expect('pass' in result).toBe(true);
    if ('pass' in result) expect(result.totalClaims).toBe(2);
  });
});

describe('summarizeClaims', () => {
  test('buckets by kind/scope and flags claims expiring within 30 days', () => {
    const now = Date.parse('2026-08-13T00:00:00Z');
    const claims = [
      indexClaim({ id: 'c-1', assert: 'a', valid_until: '2026-08-20', source_file: 'a.md' }),
      indexClaim({ id: 'c-2', assert: 'b', scope: 'global', valid_until: '2027-08-20', source_file: 'b.md' }),
    ];
    const summary = summarizeClaims(claims, now);
    expect(summary.total).toBe(2);
    expect(summary.byKind).toEqual({ behavior: 2 });
    expect(summary.byScope).toEqual({ project: 1, global: 1 });
    expect(summary.expiringWithin30Days.map((c) => c.id)).toEqual(['c-1']);
  });
});

// ── events ───────────────────────────────────────────────────────────────────────────
describe('readConfiguredCeilings + bucketBudgetBlock', () => {
  test('reads the real ceilings out of .claude/hooks/budget-guard.js', () => {
    const ceilings = readConfiguredCeilings(REPO_ROOT);
    expect(ceilings).toEqual({ window: 3_000_000, stall: 400_000 });
  });

  test('buckets a matching ceiling as real, a mismatched one as synthetic, unparseable as unknown', () => {
    const ceilings = { window: 3_000_000, stall: 400_000 };
    expect(bucketBudgetBlock('rolling 5h window at 3,100,000 output tokens (ceiling 3,000,000)', 'window', ceilings)).toBe('real');
    expect(bucketBudgetBlock('rolling 5h window at 105 output tokens (ceiling 100)', 'window', ceilings)).toBe('synthetic');
    expect(bucketBudgetBlock(undefined, 'window', ceilings)).toBe('unknown');
    expect(bucketBudgetBlock('no ceiling text here', 'window', ceilings)).toBe('unknown');
  });
});

describe('summarizeEvents', () => {
  const dir = mkTmpDir('mc-events-');
  cleanupDirs.push(dir);
  const file = path.join(dir, 'events.jsonl');

  test('counts by event kind and buckets budget.block real vs synthetic vs unknown', () => {
    const lines = [
      JSON.stringify({ event: 'claim.would_block' }),
      JSON.stringify({ event: 'budget.block', kind: 'window', reason: 'rolling 5h window at 3,050,000 output tokens (ceiling 3,000,000)' }),
      JSON.stringify({ event: 'budget.block', kind: 'window', reason: 'rolling 5h window at 105 output tokens (ceiling 100)' }),
      JSON.stringify({ event: 'budget.block' }), // no reason at all — unknown
      'not json at all',
    ];
    fs.writeFileSync(file, lines.join('\n') + '\n');
    const summary = summarizeEvents(file, REPO_ROOT);
    expect(summary.found).toBe(true);
    expect(summary.totalLines).toBe(5);
    expect(summary.unparseableLines).toBe(1);
    expect(summary.byEvent['claim.would_block']).toBe(1);
    expect(summary.byEvent['budget.block']).toBe(3);
    expect(summary.budgetBlock).toEqual({ real: 1, synthetic: 1, unknown: 1 });
  });

  test('a missing events file is an honest empty summary, not an error', () => {
    const summary = summarizeEvents(path.join(dir, 'does-not-exist.jsonl'), REPO_ROOT);
    expect(summary.found).toBe(false);
    expect(summary.totalLines).toBe(0);
  });
});

// ── empty states — the probe is executed, not trusted ──────────────────────────────────
describe('empty.ts probes are executed, matching what the collector reports', () => {
  test('projectEmptyState: found=false when nothing matches, found=true when a marker exists', async () => {
    const root = mkTmpDir('mc-project-empty-');
    cleanupDirs.push(root);
    const projectNoMarker = { id: 'p1', root } as Project;
    const before = await projectEmptyState(projectNoMarker);
    expect(before.found).toBe(false);
    // Independently re-run the exact {cmd, args} the collector used — no shell, ever
    // (see the "shell injection" describe block below for why that matters).
    const probeCmd = projectEmptyStateProbe(projectNoMarker);
    let independentlyFound = false;
    try {
      const out = execFileSync(probeCmd.cmd, probeCmd.args, { encoding: 'utf8' });
      independentlyFound = out.trim().length > 0;
    } catch {
      independentlyFound = false;
    }
    expect(independentlyFound).toBe(before.found);

    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'progress.md'), 'playbook_stage: build\n');
    const after = await projectEmptyState(projectNoMarker);
    expect(after.found).toBe(true);
    const afterProbeCmd = projectEmptyStateProbe(projectNoMarker);
    const outAfter = execFileSync(afterProbeCmd.cmd, afterProbeCmd.args, { encoding: 'utf8' });
    expect(outAfter.trim().length > 0).toBe(after.found);
  });

  test('inboxEmptyState: found=false for a missing/empty messages dir, true once a message is written', () => {
    const home = mkTmpDir('mc-home-');
    cleanupDirs.push(home);
    const project = { id: 'p2' } as Project;

    const before = inboxEmptyState(project, home);
    expect(before.found).toBe(false);
    expect(fs.existsSync(before.probe.replace(/\*$/, ''))).toBe(false); // dir doesn't even exist yet

    fs.mkdirSync(path.join(home, '.p2', 'messages'), { recursive: true });
    fs.writeFileSync(path.join(home, '.p2', 'messages', 'msg-1.json'), '{}');
    const after = inboxEmptyState(project, home);
    expect(after.found).toBe(true);
    // Independently execute the glob the probe names.
    const dirEntries = fs.readdirSync(path.dirname(after.probe));
    expect(dirEntries.length > 0).toBe(after.found);
  });

  // THE SAME PARTITION grep's exit codes force on projectEmptyState, at the readdir. An
  // absent directory is a real "nothing here" — the feature that would create it has never
  // run — but a directory that exists and cannot be opened is "I could not look", and the
  // catch swallowed both into found:false. This is the file that exists to prevent exactly
  // that, so an unreachable third state here was worse than one anywhere else.
  test('inboxEmptyState: an unreadable messages dir is could-not-look, an absent one is not', () => {
    const home = mkTmpDir('mc-home-3state-');
    cleanupDirs.push(home);

    // ABSENT → found:false with NO readable flag. The honest empty answer.
    const absent = inboxEmptyState({ id: 'gone' } as Project, home);
    expect(absent.found).toBe(false);
    expect(absent.readable).toBeUndefined();
    expect(absent.reason).toBeUndefined();

    // EXISTS BUT UNOPENABLE → readable:false. A plain file where the directory belongs
    // gives ENOTDIR deterministically on every platform and without depending on the test
    // user's privileges — chmod 000 is a no-op for root, which is how CI often runs.
    fs.mkdirSync(path.join(home, '.blocked'), { recursive: true });
    fs.writeFileSync(path.join(home, '.blocked', 'messages'), 'not a directory\n');
    const blocked = inboxEmptyState({ id: 'blocked' } as Project, home);
    expect(blocked.readable).toBe(false);
    expect(blocked.found).toBe(false);
    expect(blocked.reason).toContain('ENOTDIR');
    expect(blocked.reason).toContain(path.join(home, '.blocked', 'messages'));

    // Independently: the path the probe names really is unreadable as a directory, and the
    // error code the reason quotes is the one the OS gave.
    let independentCode: string | undefined;
    try {
      fs.readdirSync(path.dirname(blocked.probe));
    } catch (e) {
      independentCode = (e as NodeJS.ErrnoException).code;
    }
    expect(independentCode).toBe('ENOTDIR');
    // NON-VACUITY: the two calls above really did take different branches. Without this the
    // whole test passes with `readable: false` returned unconditionally.
    expect(blocked.readable).not.toBe(absent.readable);
  });

  // grep exits 1 on a genuine no-match (the honest found:false) and exits >=2 when it
  // could not even read the directory — a nonexistent path or a permission error. The
  // two must not collapse into the same found:false, or an unreadable project reports
  // as "nothing here" instead of "the probe could not look" — the exact failure the
  // honest-empty-state rule exists to prevent.
  test('projectEmptyState distinguishes "no match" from "could not check" (grep exit 1 vs >=2)', async () => {
    const noMatchDir = mkTmpDir('mc-noperm-nomatch-');
    cleanupDirs.push(noMatchDir);
    const clean = await projectEmptyState({ id: 'clean', root: noMatchDir } as Project);
    expect(clean.found).toBe(false);
    expect(clean.readable).toBeUndefined(); // ran cleanly — no "could not check" flag at all

    const nonexistent = await projectEmptyState({ id: 'gone', root: path.join(noMatchDir, 'does-not-exist') } as Project);
    expect(nonexistent.found).toBe(false);
    expect(nonexistent.readable).toBe(false);
    expect(nonexistent.reason).toMatch(/grep exited 2/);

    const noPermDir = mkTmpDir('mc-noperm-actual-');
    cleanupDirs.push(noPermDir);
    fs.chmodSync(noPermDir, 0o000);
    try {
      const unreadable = await projectEmptyState({ id: 'locked', root: noPermDir } as Project);
      expect(unreadable.found).toBe(false);
      expect(unreadable.readable).toBe(false);
      expect(unreadable.reason).toMatch(/grep exited 2/);
      expect(unreadable.reason).toContain(noPermDir);
    } finally {
      fs.chmodSync(noPermDir, 0o755); // restore so afterAll's rmTmp can clean it up
    }
  });

  // MAJOR from review round 3: a wholly-unreadable input is not the only unreadable
  // shape. GNU grep writes any matches it DID find to stdout BEFORE reporting an
  // unreadable subdirectory on stderr and exiting 2 — so a real match and a real
  // "couldn't see everything" can both be true at once. execFileSync throws on exit 2,
  // discarding `out`, so the match has to come from the thrown error's own .stdout or it
  // is silently lost — reporting absence when it means "I found something AND I also
  // couldn't check everything". The two prior tests only covered wholly-unreadable
  // inputs (nothing to find either way), which is exactly why this survived them.
  test('projectEmptyState reports a real match even when a sibling directory is unreadable', async () => {
    const root = mkTmpDir('mc-mixed-match-');
    cleanupDirs.push(root);
    const readableDir = path.join(root, 'subdir-readable');
    const lockedDir = path.join(root, 'subdir-locked');
    fs.mkdirSync(readableDir, { recursive: true });
    fs.mkdirSync(lockedDir, { recursive: true });
    fs.writeFileSync(path.join(readableDir, 'visible-match.txt'), 'playbook_stage: yes\n');
    fs.chmodSync(lockedDir, 0o000);

    try {
      const state = await projectEmptyState({ id: 'mixed', root } as Project);
      expect(state.found).toBe(true); // the real match must not be discarded
      expect(state.readable).toBe(false); // and the partial blindness must still be reported
      expect(state.reason).toMatch(/grep exited 2/);
    } finally {
      fs.chmodSync(lockedDir, 0o755); // restore so afterAll's rmTmp can clean it up
    }
  });

  // THE LIMIT THIS PR DELETED, PUT BACK ON PURPOSE. `execFileSync` could not overlap: one
  // grep at a time, by construction. Going async removed that accidental cap of 1 and put
  // nothing in its place — measured before the fix, 20 simultaneous calls produced 20
  // concurrent greps, each entitled to 8 MB and 10 seconds, reachable from a visited page
  // because /api/project/:id is a GET with no Origin check.
  //
  // COUNTED AT THE OS, not from a counter this module owns: `pgrep -f <tmp root>` asks the
  // kernel how many grep processes exist with that path in their argv. A test that read an
  // exported `running` variable would pass just as happily if the semaphore were decremented
  // twice and four children ran.
  test('N concurrent probes never put more than the cap of greps on the machine', async () => {
    // GATE ON THE ENVIRONMENT, never on the result (test/gate.ts). pgrep is present on macOS
    // and on GitHub's ubuntu runners; if some machine lacks it, say so loudly rather than
    // reporting a pass nobody measured.
    try {
      execFileSync('pgrep', ['-f', 'mc-cap-no-such-process-xyz'], { stdio: 'ignore' });
    } catch (e) {
      const code = (e as { status?: number; code?: string }).status;
      if (code !== 1) {
        notVerified('probe concurrency cap', 'pgrep is not available on this machine, so children could not be counted');
        return;
      }
    }

    // MAKE THE SUBJECT LONGER RATHER THAN THE SAMPLER FASTER — and let the machine say how
    // much longer, because guessing got it wrong twice. At ~19 MB the runner's probe lasted
    // 26 ms against 15.2 ms samples and the overlap went unobserved; tripling the BYTES to
    // 56 MB moved it only to 35 ms, because the runner is not byte-bound — 3x the data bought
    // 1.35x the time, so its cost is per-file traversal, not per-byte scanning, and this
    // laptop's grep is the opposite (1,086 ms on the same tree). No single fixture size is
    // right for both.
    //
    // The alternative — counting children through /proc on Linux — was rejected: a platform
    // branch nothing here can execute, shipped to close a gate that was telling the truth, is
    // an unexecuted branch reading as coverage.
    //
    // So the tree GROWS UNTIL THIS MACHINE'S PROBE OUTLASTS THIS MACHINE'S SAMPLER, in small
    // files because that is the axis a fast runner actually feels, bounded so a pathological
    // machine stops rather than filling a disk.
    const root = mkTmpDir('mc-cap-');
    cleanupDirs.push(root);
    const pgrepAsync = promisify(execFile);

    let files = 0;
    let dirs = 0;
    const addFiles = (n: number) => {
      const dir = path.join(root, `d${dirs++}`);
      fs.mkdirSync(dir, { recursive: true });
      for (let f = 0; f < n; f++) fs.writeFileSync(path.join(dir, `f${f}.txt`), 'lorem ipsum dolor sit amet\n');
      files += n;
    };
    const timeOneProbe = async () => {
      const t0 = Date.now();
      await projectEmptyState({ id: 'cap', root } as Project);
      return Math.max(1, Date.now() - t0);
    };

    addFiles(2_000);

    // THE SAMPLER'S OWN COST, measured with nothing else running — the ruler, before the
    // thing being measured. `pgrep` forks and scans every process on the box, so this is tens
    // of milliseconds on a laptop and single digits on a runner, and it is the number the
    // tree has to beat.
    const cadenceStart = Date.now();
    for (let i = 0; i < 10; i++) {
      try {
        await pgrepAsync('pgrep', ['-f', root], { encoding: 'utf8' });
      } catch {
        /* exit 1, no matches — expected, nothing is running yet */
      }
    }
    const idleCadenceMs = Math.max(0.5, (Date.now() - cadenceStart) / 10);

    let probeMs = await timeOneProbe();
    let grew = 0;
    while (probeMs < idleCadenceMs * 4 && grew < 6) {
      addFiles(6_000);
      grew++;
      probeMs = await timeOneProbe();
    }

    // AND THE SAMPLER DOES NOT BLOCK THE THREAD IT IS WATCHING. `execFileSync` here was worse
    // than slow: starting the next grep needs this same JS thread (the semaphore hands the
    // slot over in a microtask), so a blocking sampler and the probe lifecycle interleaved —
    // greps ran entirely inside the sampler's own sleep and it saw none of them. Async pgrep,
    // back to back with no sleep, leaves the loop free between samples.
    let sampling = true;
    let maxSeen = 0;
    let samples = 0;
    const samplerStart = Date.now();
    const sampler = (async () => {
      while (sampling) {
        try {
          const { stdout } = await pgrepAsync('pgrep', ['-f', root], { encoding: 'utf8' });
          const n = stdout.trim().split('\n').filter(Boolean).length;
          if (n > maxSeen) maxSeen = n;
        } catch {
          /* pgrep exits 1 with no matches — zero children, nothing to record */
        }
        samples++;
      }
    })();

    // N IS DERIVED FROM THE CONTROL, because a bigger tree moves the OTHER bound: at 56 MB
    // twenty probes took 11 s here, overran PROJECT_PROBE_QUEUE_WAIT_MS, and the queue
    // correctly turned the last ones away — so the test was measuring the wait rather than
    // the cap. Sizing N to fit inside 60% of that wait keeps both premises true on a fast
    // runner and a slow laptop without either number being written down for one machine.
    // Floor of 4 so `maxSeen < N` still says something; ceiling of 20, the reviewer's figure.
    const N = Math.max(4, Math.min(20, Math.floor((PROJECT_PROBE_QUEUE_WAIT_MS * 0.6 * PROJECT_PROBE_MAX_CONCURRENT) / probeMs)));
    const runStart = Date.now();
    const results = await Promise.all(
      Array.from({ length: N }, () => projectEmptyState({ id: 'cap', root } as Project))
    );
    const runMs = Date.now() - runStart;
    sampling = false;
    await sampler;
    const cadenceMs = (Date.now() - samplerStart) / Math.max(1, samples);

    // eslint-disable-next-line no-console
    console.log(
      `  [cap] ${N} probes in ${runMs}ms · max concurrent greps ${maxSeen} (cap ${PROJECT_PROBE_MAX_CONCURRENT}) · ` +
        `one probe ${probeMs}ms over ${files} files (grew ${grew}x, idle pgrep ${idleCadenceMs.toFixed(1)}ms) · ` +
        `${samples} samples at ${cadenceMs.toFixed(1)}ms`
    );

    // GATE ON THE INSTRUMENT, not on the answer. If this machine cannot take several samples
    // inside one probe's lifetime, an overlap it never saw is a fact about the sampler's
    // resolution — reporting that as a pass would be the §0 defect, and reporting it as a
    // failure would be blaming the code for the ruler.
    //
    // AND THE WITHHELD HALF IS THE ENFORCEMENT ITSELF, not a nicety. With the sampler blind,
    // `maxSeen` is 0 and every remaining assertion passes trivially: 0 <= 2, 0 < N, 2 <= 4.
    // So on a coarse runner a RAISED CONSTANT is still caught, by the static `<= 4` check
    // below — but a cap DECLARED AND NOT APPLIED is caught by nothing. The reviewer proved
    // that by disabling the semaphore in place, constant untouched: it fails here (maxSeen 20
    // against a cap of 2) and would pass on a machine that cannot see. Saying "the cap
    // assertions still run" was true and misleading; run is not verify.
    const canObserve = cadenceMs * 3 <= probeMs;
    if (!canObserve) {
      notVerified(
        'probe concurrency cap',
        `one probe lasts ${probeMs}ms and samples are ${cadenceMs.toFixed(1)}ms apart, too coarse to catch two at ` +
          'once — so ENFORCEMENT IS NOT VERIFIED ON THIS RUNNER AT ALL. A semaphore that was declared and never ' +
          'applied would look identical from here. What remains checked is only that the declared constant is small'
      );
    } else {
      // NON-VACUITY: the sampler really looked, and it really saw greps overlapping — so the
      // ceiling below is holding something back rather than describing probes that happened
      // to run one after another.
      expect(samples).toBeGreaterThan(3);
      expect(maxSeen).toBeGreaterThan(1);
    }

    // TWO BOUNDS, AND THE SECOND ONE IS NOT THE CONSTANT. Asserting only
    // `maxSeen <= PROJECT_PROBE_MAX_CONCURRENT` reads the value it is supposed to be
    // checking: raising the constant to 64 raises this assertion with it, and the test stays
    // green while 20 greps run at once. Measured — that mutation passed 71/0 before this
    // line existed. So the contract is checked against the declared cap AND against a ceiling
    // the declaration cannot move. BOTH ARE VACUOUS AT maxSeen 0 — they bound an observation,
    // and an unobserved run has none.
    expect(maxSeen).toBeLessThanOrEqual(PROJECT_PROBE_MAX_CONCURRENT);
    expect(maxSeen).toBeLessThan(N); // a cap that does not cap fails here regardless of its value
    // The one assertion that holds without observing anything: the declared cap is a SMALL
    // number. That is the decision under review — the limit exists to bound 8 MB and ten
    // seconds per child — and it is also the ONLY thing this test still enforces on a machine
    // whose sampler could not see, which is what the gate above now says out loud.
    expect(PROJECT_PROBE_MAX_CONCURRENT).toBeLessThanOrEqual(4);

    // Every queued probe still ran and still answered, with no marker in this tree — which is
    // only the right assertion while the whole run fits inside the queue's own wait. At a
    // 56 MB tree it did not: twenty probes took 11 s, the last ones were correctly turned
    // away, and this loop failed for a reason that had nothing to do with the cap. So the
    // premise is checked rather than assumed, and a machine slow enough to break it says so.
    expect(results).toHaveLength(N);
    if (runMs < PROJECT_PROBE_QUEUE_WAIT_MS * 0.8) {
      for (const r of results) {
        expect(r.found).toBe(false);
        expect(r.readable).toBeUndefined(); // none of them was turned away
      }
    } else {
      notVerified(
        'queued probes all complete',
        `${N} probes took ${runMs}ms against a ${PROJECT_PROBE_QUEUE_WAIT_MS}ms queue wait, so being turned away is the correct behaviour here rather than a defect`
      );
    }
  }, 120_000);

  // AND THE QUEUE'S OWN ANSWER IS NOT AN EMPTY ONE. A probe turned away because the cap was
  // full never looked at anything, so reporting `found: false` alone would be the queue
  // manufacturing empty states under load — the same §0 failure the timeout branch avoids,
  // arriving through the mechanism added to prevent a different one.
  test('a probe that never got a slot says so, and is not an all-clear', async () => {
    const busy = mkTmpDir('mc-cap-busy-');
    cleanupDirs.push(busy);
    for (let d = 0; d < 6; d++) {
      const dir = path.join(busy, `d${d}`);
      fs.mkdirSync(dir, { recursive: true });
      for (let f = 0; f < 200; f++) {
        fs.writeFileSync(path.join(dir, `f${f}.txt`), 'lorem ipsum dolor sit amet '.repeat(400));
      }
    }

    // Fill every slot, then ask for one with a wait far shorter than those scans.
    const holding = Array.from({ length: PROJECT_PROBE_MAX_CONCURRENT }, () =>
      projectEmptyState({ id: 'holder', root: busy } as Project)
    );
    const turnedAway = await projectEmptyState({ id: 'waiter', root: busy } as Project, { queueWaitMs: 1 });

    expect(turnedAway.readable).toBe(false);
    expect(turnedAway.found).toBe(false);
    expect(turnedAway.reason).toContain('never started');
    expect(turnedAway.reason).toContain('NO part of'); // nothing was searched, not "nothing is here"
    expect(turnedAway.reason).not.toContain('did not finish'); // NOR the timeout's wording

    const held = await Promise.all(holding);
    // THE MIRROR: the same probe, uncontended, answers cleanly with no could-not-look flag —
    // which is what proves the assertions above read the queue's branch and not a state this
    // input produces anyway.
    for (const r of held) expect(r.readable).toBeUndefined();
    const uncontended = await projectEmptyState({ id: 'waiter', root: busy } as Project, { queueWaitMs: 1 });
    expect(uncontended.readable).toBeUndefined();
    expect(uncontended.found).toBe(false);
  }, 120_000);

  // A directory NAME starting with '-' must reach grep as a path, not a flag — the `--`
  // sentinel in projectEmptyStateProbe is what makes that true regardless of how
  // project.root is ever constructed. Under the shipped default (roots always absolute)
  // this is inert; asserted directly here rather than only in a code comment.
  test("projectEmptyStateProbe inserts '--' before project.root (argument-injection guard)", async () => {
    const probe = projectEmptyStateProbe({ id: 'x', root: '--include=*.env' } as Project);
    const sentinelIndex = probe.args.indexOf('--');
    expect(sentinelIndex).toBeGreaterThan(-1);
    expect(probe.args[sentinelIndex + 1]).toBe('--include=*.env');
    expect(probe.args[probe.args.length - 1]).toBe('--include=*.env'); // root is the last, post-sentinel arg

    // And the behavioral proof: a real directory named like a grep flag is searched as
    // a path (found: false, empty dir) rather than misparsed as an option.
    const parent = mkTmpDir('mc-argsentinel-');
    cleanupDirs.push(parent);
    const dashDir = path.join(parent, '--include=*.env');
    fs.mkdirSync(dashDir, { recursive: true });
    const state = await projectEmptyState({ id: 'dashy', root: dashDir } as Project);
    expect(state.readable).toBeUndefined(); // grep ran cleanly against it as a real path
    expect(state.found).toBe(false);
  });
});

// ── security: project.root is attacker-influenceable (a real directory name read off
// disk) and must never reach a shell. Regression coverage for the command-injection
// finding of 2026-08-13 — see server/collectors/empty.ts and the write-guard extension
// in test/crosscheck.test.ts. ─────────────────────────────────────────────────────────
describe('projectEmptyState is not vulnerable to shell injection via project.root', () => {
  // A filesystem directory NAME cannot contain '/', so the marker `touch` targets must
  // be bare filenames, not paths — otherwise fs.mkdirSync({recursive:true}) would
  // silently create a chain of real nested directories instead of one adversarial name
  // (found the hard way: an earlier version of this file used an absolute marker path
  // and every test passed for the wrong reason). If the old shell-string bug were still
  // present, `touch <bareName>` runs with the CALLING PROCESS's cwd (bun test's cwd,
  // i.e. mission-control/) — that is exactly where these tests look for the marker.
  function markerPathIfExploited(bareName: string): string {
    return path.join(process.cwd(), bareName);
  }
  function cleanupMarker(p: string) {
    try {
      fs.rmSync(p);
    } catch {
      /* it was never created — the expected, safe outcome */
    }
  }

  test('a directory name built from shell metacharacters executes nothing', async () => {
    const parent = mkTmpDir('mc-security-parent-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_MARKER_${crypto.randomUUID()}`;
    const markerPath = markerPathIfExploited(bareMarker);
    // Mirrors the reviewer's live repro: semicolons, a space, and a trailing command —
    // the exact directory-name shape that popped a shell under the old implementation.
    const maliciousDir = path.join(parent, `evilproj;touch ${bareMarker};echo done`);
    fs.mkdirSync(maliciousDir, { recursive: true });

    try {
      const state = await projectEmptyState({ id: 'evil', root: maliciousDir } as Project);
      expect(fs.existsSync(markerPath)).toBe(false); // nothing was executed
      expect(state.found).toBe(false); // and the read-only answer is still correct: no marker file inside
    } finally {
      cleanupMarker(markerPath);
    }
  });

  test('...and the same directory, containing a real playbook_stage marker, still answers found=true (not a crash, not a false negative)', async () => {
    const parent = mkTmpDir('mc-security-parent2-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_MARKER_${crypto.randomUUID()}`;
    const markerPath = markerPathIfExploited(bareMarker);
    const maliciousDir = path.join(parent, `evilproj;touch ${bareMarker};echo done`);
    fs.mkdirSync(path.join(maliciousDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(maliciousDir, 'docs', 'progress.md'), 'playbook_stage: build\n');

    try {
      const state = await projectEmptyState({ id: 'evil2', root: maliciousDir } as Project);
      expect(fs.existsSync(markerPath)).toBe(false);
      expect(state.found).toBe(true);
    } finally {
      cleanupMarker(markerPath);
    }
  });

  // MINOR 1 from review: same root cause, non-adversarial — a plain space in a real
  // project name ("My Project") word-split under the old shell-string implementation,
  // so grep silently failed and the answer was wrong (found:false) rather than a crash.
  test('a directory name containing a space is handled correctly, not silently wrong', async () => {
    const parent = mkTmpDir('mc-security-spaced-');
    cleanupDirs.push(parent);
    const spacedDir = path.join(parent, 'My Project');
    fs.mkdirSync(path.join(spacedDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(spacedDir, 'docs', 'progress.md'), 'playbook_stage: build\n');

    expect((await projectEmptyState({ id: 'spaced', root: spacedDir } as Project)).found).toBe(true);
  });

  // Full round-trip through the real Hono app — the reviewer's exact demonstration
  // (created a malicious directory, issued a real GET /api/project/:id, confirmed a
  // marker file was written) reproduced as a regression test rather than left as a
  // one-off finding.
  test('GET /api/project/:id against a maliciously-named real project executes nothing', async () => {
    const projectsRoot = mkTmpDir('mc-security-e2e-root-');
    cleanupDirs.push(projectsRoot);
    const bareMarker = `PWNED_MARKER_E2E_${crypto.randomUUID()}`;
    const markerPath = markerPathIfExploited(bareMarker);
    const maliciousName = `evilproj;touch ${bareMarker};echo done`;
    const maliciousDir = path.join(projectsRoot, maliciousName);
    initGitRepo(maliciousDir);

    const savedRoots = process.env.MC_PROJECT_ROOTS;
    process.env.MC_PROJECT_ROOTS = projectsRoot;
    // MC_INDEX_CACHE too, and it is not incidental. This test boots the REAL server module —
    // that is its whole point, since the RCE it pins was only reachable end to end — so it gets
    // the real `live` singleton, which persists its session index to ~/.agentvibe by default.
    // Without this the suite leaves a multi-megabyte index of the developer's actual corpus in
    // their home directory. Found by looking at the filesystem after a full `npm run check`,
    // not by any assertion; check.mjs now asserts it.
    const savedCache = process.env.MC_INDEX_CACHE;
    process.env.MC_INDEX_CACHE = path.join(projectsRoot, 'index-cache.json');
    try {
      const mc = (await import('../server/index.ts')).default;
      const res = await mc.fetch(new Request(`http://127.0.0.1/api/project/${encodeURIComponent(maliciousName)}`));
      expect(res.status).toBe(200);
      const body = (await res.json()) as { project: { id: string }; empty: { found: boolean } };
      expect(body.project.id).toBe(maliciousName);
      expect(body.empty.found).toBe(false);
      expect(fs.existsSync(markerPath)).toBe(false); // the real, end-to-end path executed nothing
    } finally {
      if (savedRoots === undefined) delete process.env.MC_PROJECT_ROOTS;
      else process.env.MC_PROJECT_ROOTS = savedRoots;
      if (savedCache === undefined) delete process.env.MC_INDEX_CACHE;
      else process.env.MC_INDEX_CACHE = savedCache;
      cleanupMarker(markerPath);
    }
  });
});

// ── index-store ──────────────────────────────────────────────────────────────────────
describe('IndexStore incremental refresh', () => {
  const root = mkTmpDir('mc-store-root-');
  const claudeRoot = mkTmpDir('mc-store-claude-');
  cleanupDirs.push(root, claudeRoot);
  initGitRepo(root);
  const now = new Date();
  fixtureClaudeProjectsDir(claudeRoot, root, 'sess-1', [{ ts: now.toISOString(), output_tokens: 100 }]);
  const project = discoverProjects({ roots: [path.dirname(root)], claudeProjectsRoot: claudeRoot }).find((p) => p.root === root)!;

  test('cold build reads the fixture session', () => {
    const store = new IndexStore();
    const result = store.buildCold([project]);
    expect(result.filesScanned).toBe(1);
    const sessions = store.sessionsFor(project.id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.outputTokens).toBe(100);
  });

  test('refresh() skips an untouched file (filesChanged: 0) and picks up an append', async () => {
    const store = new IndexStore();
    store.buildCold([project]);

    const untouched = store.refresh([project]);
    expect(untouched.filesChanged).toBe(0);

    // Append more turns to the same transcript file, forcing mtime forward.
    await new Promise((r) => setTimeout(r, 10));
    const file = project.transcriptDirs[0]!;
    const target = fs.readdirSync(file).find((f) => f.endsWith('.jsonl'))!;
    const full = path.join(file, target);
    fs.appendFileSync(full, JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), isSidechain: false, message: { usage: { output_tokens: 50 } } }) + '\n');
    fs.utimesSync(full, new Date(), new Date());

    const appended = store.refresh([project]);
    expect(appended.filesChanged).toBe(1);
    const sessions = store.sessionsFor(project.id);
    expect(sessions[0]!.outputTokens).toBe(150);
  });
});
