// test/collectors.test.ts — unit and fixture-integration coverage for every collector.
import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { discoverProjects, encodeProjectDir, type Project } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import { listWorktrees, parseWorktreePorcelain } from '../server/collectors/worktrees.ts';
import { detectConflicts, parseStatusPorcelain } from '../server/collectors/conflicts.ts';
import { parseWarroomFleetOutput } from '../server/collectors/fleet.ts';
import { parseLedgerVerifyOutput, summarizeClaims, ledgerVerifyArgs } from '../server/collectors/belief.ts';
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

  test('two worktrees editing the same file are flagged as a conflict', () => {
    fs.writeFileSync(path.join(wtA, 'shared.txt'), 'from A\n');
    fs.writeFileSync(path.join(wtB, 'shared.txt'), 'from B\n');
    fs.writeFileSync(path.join(wtA, 'only-a.txt'), 'a only\n');
    const report = detectConflicts(project);
    expect(report.conflicts.map((c) => c.file)).toContain('shared.txt');
    const sharedConflict = report.conflicts.find((c) => c.file === 'shared.txt')!;
    expect(sharedConflict.worktrees).toHaveLength(2);
    // only-a.txt touches one worktree only — not a conflict.
    expect(report.conflicts.some((c) => c.file === 'only-a.txt')).toBe(false);
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
