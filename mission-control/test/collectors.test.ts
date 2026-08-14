// test/collectors.test.ts — unit and fixture-integration coverage for every collector.
import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { discoverProjects, encodeProjectDir, type Project } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import { listWorktrees, parseWorktreePorcelain, type WorktreeEntry } from '../server/collectors/worktrees.ts';
import {
  changedFilesFor,
  detectConflicts,
  parseStatusPorcelain,
  scopeSweep,
  EXCLUDED_REASON,
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
} from './fixtures.ts';
import { notVerified } from './gate.ts';

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
    fs.mkdirSync(path.join(projC, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(projC, 'scripts', 'ledger.mjs'), '// fixture stand-in\n');
    fs.mkdirSync(path.join(projC, '.claude', 'ledger'), { recursive: true });
    fs.writeFileSync(
      path.join(projC, '.claude', 'ledger', 'index.json'),
      JSON.stringify({ claims: [{ id: 'c-x', assert: 'x', kind: 'behavior', scope: 'project', verified_by: 'command', source_file: 'a.md', source_line: 1 }] })
    );
    const [proj] = discoverProjects({ roots: [root], claudeProjectsRoot: claudeRoot }).filter((p) => p.id === 'proj-with-ledger');
    expect(proj!.ledgerIndex.present).toBe(true);
    expect(proj!.ledgerIndex.claims).toHaveLength(1);
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

    // THE MEASUREMENT — the real, shipped sweep.
    const t0 = performance.now();
    const report = await detectConflicts(project);
    const sweepMs = performance.now() - t0;
    await settle();
    const asyncStallMs = worstGapSince();

    // THE CONTROL — the same git calls, sequential and synchronous. This is the blocking
    // implementation, measured under identical conditions moments later.
    const sweptPaths = report.worktrees.map((w) => w.path);
    const c0 = performance.now();
    for (const wt of sweptPaths) {
      execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: wt, encoding: 'utf8' });
    }
    const controlMs = performance.now() - c0;
    await settle();
    const controlStallMs = worstGapSince();
    sampling = false;

    // eslint-disable-next-line no-console
    console.log(
      `  [async] worst stall: async ${asyncStallMs.toFixed(1)}ms (sweep ${sweepMs.toFixed(1)}ms) · ` +
        `sync control ${controlStallMs.toFixed(1)}ms (${controlMs.toFixed(1)}ms) · idle noise ${idleNoiseMs.toFixed(1)}ms · ` +
        `ratio ${(asyncStallMs / controlStallMs).toFixed(3)}`
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
    // that the sweep regressed. Load is measured and is not the risk: 0.033-0.049 unloaded,
    // 0.036-0.070 under eight busy CPU processes, idle gate never firing.
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

    // THE MEASUREMENT — every project swept the way the route does it: concurrently.
    const t0 = performance.now();
    const reports = await Promise.all(projects.map((p) => detectConflicts(p)));
    const sweepMs = performance.now() - t0;
    await settle();
    const asyncStallMs = worstGapSince();

    // THE CONTROL — the ENUMERATION PHASE ONLY, sequential and synchronous: exactly what
    // reverting listWorktreesAsync produces, and nothing else.
    const c0 = performance.now();
    for (const p of projects) {
      execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: p.root, encoding: 'utf8' });
    }
    const controlMs = performance.now() - c0;
    await settle();
    const controlStallMs = worstGapSince();
    sampling = false;

    // eslint-disable-next-line no-console
    console.log(
      `  [async] ${PROJECTS} projects — async ${asyncStallMs.toFixed(1)}ms (sweep ${sweepMs.toFixed(1)}ms) · ` +
        `sync enumeration control ${controlStallMs.toFixed(1)}ms (${controlMs.toFixed(1)}ms) · ` +
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

    // Same bound as the status-phase test, for the same reason and with the same failure
    // direction. Both terms scale with PROJECTS, so this holds on any machine.
    expect(asyncStallMs).toBeLessThan(controlStallMs * 0.75);
  });
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
  function claim(id: string, disposition: unknown): GlobalClaim {
    return {
      id,
      assert: 'x',
      kind: 'runtime-capability',
      scope: 'global',
      verified_by: 'command',
      source_file: '~/.warroom/ledger/global.yml',
      source_line: 0,
      ...(disposition === undefined ? {} : { disposition }),
    } as GlobalClaim;
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

  test('a waiver whose until is not a date is lapsed, with days null — never quietly live', () => {
    const [w] = collectWaivers([claim('c-bad', { action: 'waive', until: 'someday', reason: 'r' })], NOW);
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
      { id: 'c-1', assert: 'a', kind: 'behavior', scope: 'project', verified_by: 'command', valid_until: '2026-08-20', source_file: 'a.md', source_line: 1 },
      { id: 'c-2', assert: 'b', kind: 'behavior', scope: 'global', verified_by: 'command', valid_until: '2027-08-20', source_file: 'b.md', source_line: 1 },
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
