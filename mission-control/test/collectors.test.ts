// test/collectors.test.ts — unit and fixture-integration coverage for every collector.
import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { discoverProjects, encodeProjectDir, type Project } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import { listWorktrees, parseWorktreePorcelain, type WorktreeEntry } from '../server/collectors/worktrees.ts';
import { changedFilesFor, detectConflicts, parseStatusPorcelain, scopeSweep } from '../server/collectors/conflicts.ts';
import { parseWarroomFleetOutput } from '../server/collectors/fleet.ts';
import {
  attributeVerdicts,
  collectWaivers,
  ledgerVerifyArgs,
  parseLedgerVerifyLines,
  parseLedgerVerifyOutput,
  readGlobalLedger,
  summarizeClaims,
  type GlobalClaim,
  type LedgerVerifySummary,
} from '../server/collectors/belief.ts';
import { summarizeEvents, bucketBudgetBlock, readConfiguredCeilings } from '../server/collectors/events.ts';
import { projectEmptyState, projectEmptyStateProbe, inboxEmptyState } from '../server/collectors/empty.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo, addWorktree, writeRegistry } from './fixtures.ts';

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
    expect(report.excluded.reason).toContain('.worktrees/.registry');
    // The reason names both halves of the fraction, so the figure on screen is legible
    // without reading this source file.
    expect(report.excluded.reason).toContain('1 of 3');
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
  test('a project directory built from shell metacharacters executes nothing', async () => {
    const parent = mkTmpDir('mc-conflicts-security-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_CONFLICTS_${crypto.randomUUID()}`;
    const markerPath = path.join(process.cwd(), bareMarker);
    const maliciousRoot = path.join(parent, `evilproj;touch ${bareMarker};echo done`);

    initGitRepo(maliciousRoot);
    const wt = path.join(maliciousRoot, '.worktrees', 'ceo-1-1');
    addWorktree(maliciousRoot, wt, 'ceo-1-1');
    writeRegistry(maliciousRoot, [{ name: 'ceo-1', token: '1' }]);
    fs.writeFileSync(path.join(wt, 'touched.txt'), 'x\n');

    const claudeRoot = mkTmpDir('mc-conflicts-security-claude-');
    cleanupDirs.push(claudeRoot);
    const proj = discoverProjects({ roots: [parent], claudeProjectsRoot: claudeRoot }).find((p) => p.root === maliciousRoot)!;

    try {
      const report = await detectConflicts(proj);
      expect(fs.existsSync(markerPath)).toBe(false); // nothing was executed
      // and the read-only answer is still CORRECT, not merely safe — a guard that works by
      // breaking the feature is not a guard.
      expect(report.worktrees).toHaveLength(1);
      expect(report.worktrees[0]!.readable).toBeUndefined();
      expect(report.worktrees[0]!.changedFiles).toEqual(['touched.txt']);
    } finally {
      try {
        fs.rmSync(markerPath);
      } catch {
        /* never created — the expected, safe outcome */
      }
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
  test('projectEmptyState: found=false when nothing matches, found=true when a marker exists', () => {
    const root = mkTmpDir('mc-project-empty-');
    cleanupDirs.push(root);
    const projectNoMarker = { id: 'p1', root } as Project;
    const before = projectEmptyState(projectNoMarker);
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
    const after = projectEmptyState(projectNoMarker);
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

  // grep exits 1 on a genuine no-match (the honest found:false) and exits >=2 when it
  // could not even read the directory — a nonexistent path or a permission error. The
  // two must not collapse into the same found:false, or an unreadable project reports
  // as "nothing here" instead of "the probe could not look" — the exact failure the
  // honest-empty-state rule exists to prevent.
  test('projectEmptyState distinguishes "no match" from "could not check" (grep exit 1 vs >=2)', () => {
    const noMatchDir = mkTmpDir('mc-noperm-nomatch-');
    cleanupDirs.push(noMatchDir);
    const clean = projectEmptyState({ id: 'clean', root: noMatchDir } as Project);
    expect(clean.found).toBe(false);
    expect(clean.readable).toBeUndefined(); // ran cleanly — no "could not check" flag at all

    const nonexistent = projectEmptyState({ id: 'gone', root: path.join(noMatchDir, 'does-not-exist') } as Project);
    expect(nonexistent.found).toBe(false);
    expect(nonexistent.readable).toBe(false);
    expect(nonexistent.reason).toMatch(/grep exited 2/);

    const noPermDir = mkTmpDir('mc-noperm-actual-');
    cleanupDirs.push(noPermDir);
    fs.chmodSync(noPermDir, 0o000);
    try {
      const unreadable = projectEmptyState({ id: 'locked', root: noPermDir } as Project);
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
  test('projectEmptyState reports a real match even when a sibling directory is unreadable', () => {
    const root = mkTmpDir('mc-mixed-match-');
    cleanupDirs.push(root);
    const readableDir = path.join(root, 'subdir-readable');
    const lockedDir = path.join(root, 'subdir-locked');
    fs.mkdirSync(readableDir, { recursive: true });
    fs.mkdirSync(lockedDir, { recursive: true });
    fs.writeFileSync(path.join(readableDir, 'visible-match.txt'), 'playbook_stage: yes\n');
    fs.chmodSync(lockedDir, 0o000);

    try {
      const state = projectEmptyState({ id: 'mixed', root } as Project);
      expect(state.found).toBe(true); // the real match must not be discarded
      expect(state.readable).toBe(false); // and the partial blindness must still be reported
      expect(state.reason).toMatch(/grep exited 2/);
    } finally {
      fs.chmodSync(lockedDir, 0o755); // restore so afterAll's rmTmp can clean it up
    }
  });

  // A directory NAME starting with '-' must reach grep as a path, not a flag — the `--`
  // sentinel in projectEmptyStateProbe is what makes that true regardless of how
  // project.root is ever constructed. Under the shipped default (roots always absolute)
  // this is inert; asserted directly here rather than only in a code comment.
  test("projectEmptyStateProbe inserts '--' before project.root (argument-injection guard)", () => {
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
    const state = projectEmptyState({ id: 'dashy', root: dashDir } as Project);
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

  test('a directory name built from shell metacharacters executes nothing', () => {
    const parent = mkTmpDir('mc-security-parent-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_MARKER_${crypto.randomUUID()}`;
    const markerPath = markerPathIfExploited(bareMarker);
    // Mirrors the reviewer's live repro: semicolons, a space, and a trailing command —
    // the exact directory-name shape that popped a shell under the old implementation.
    const maliciousDir = path.join(parent, `evilproj;touch ${bareMarker};echo done`);
    fs.mkdirSync(maliciousDir, { recursive: true });

    try {
      const state = projectEmptyState({ id: 'evil', root: maliciousDir } as Project);
      expect(fs.existsSync(markerPath)).toBe(false); // nothing was executed
      expect(state.found).toBe(false); // and the read-only answer is still correct: no marker file inside
    } finally {
      cleanupMarker(markerPath);
    }
  });

  test('...and the same directory, containing a real playbook_stage marker, still answers found=true (not a crash, not a false negative)', () => {
    const parent = mkTmpDir('mc-security-parent2-');
    cleanupDirs.push(parent);
    const bareMarker = `PWNED_MARKER_${crypto.randomUUID()}`;
    const markerPath = markerPathIfExploited(bareMarker);
    const maliciousDir = path.join(parent, `evilproj;touch ${bareMarker};echo done`);
    fs.mkdirSync(path.join(maliciousDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(maliciousDir, 'docs', 'progress.md'), 'playbook_stage: build\n');

    try {
      const state = projectEmptyState({ id: 'evil2', root: maliciousDir } as Project);
      expect(fs.existsSync(markerPath)).toBe(false);
      expect(state.found).toBe(true);
    } finally {
      cleanupMarker(markerPath);
    }
  });

  // MINOR 1 from review: same root cause, non-adversarial — a plain space in a real
  // project name ("My Project") word-split under the old shell-string implementation,
  // so grep silently failed and the answer was wrong (found:false) rather than a crash.
  test('a directory name containing a space is handled correctly, not silently wrong', () => {
    const parent = mkTmpDir('mc-security-spaced-');
    cleanupDirs.push(parent);
    const spacedDir = path.join(parent, 'My Project');
    fs.mkdirSync(path.join(spacedDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(spacedDir, 'docs', 'progress.md'), 'playbook_stage: build\n');

    expect(projectEmptyState({ id: 'spaced', root: spacedDir } as Project).found).toBe(true);
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
