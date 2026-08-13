// test/crosscheck.test.ts — every displayed figure reproducible by an independent
// command (docs/03-system-design/DECISIONS.md, Phase 8a gate). Each check here runs the
// SAME real command MC's own collector shells out to, parses it independently (never by
// importing MC's own parser), and compares.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { discoverProjects } from '../server/projects.ts';
import { IndexStore } from '../server/index-store.ts';
import { buildFleet } from '../server/collectors/fleet.ts';
import { runLedgerVerify } from '../server/collectors/belief.ts';
import { windowUsage as mcWindowUsage } from '../server/lib/usage.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo } from './fixtures.ts';
import { notVerified } from './gate.ts';

// Imported directly from the module under test, exactly as scripts/lib/usage.js exports
// it — NOT independent of server/lib/usage.ts, whose windowUsage() is a thin pass-
// through (see that file): calling both here mostly proves the wrapper forwards its
// options, which is real but modest. The number that actually carries assurance is the
// hardcoded anchor below (expect(...).toBe(19_134)), independently re-derived by hand
// from scripts/lib/usage.js:159-172 as 12,345 + 6,789. The fleet-gen and ledger-verdict
// crosschecks further down ARE genuinely independent — each parses real command stdout
// with its own regex, sharing no code with the collector it checks.
//
// @ts-expect-error — plain CommonJS with no .d.ts; `allowJs` is off project-wide by design
// and scripts/lib/ is not this project's to change. Same suppression, same reason, as
// server/lib/usage.ts's own import of this module. Every use below casts to an explicit
// shape, so nothing here is silently `any`.
// eslint-disable-next-line
import * as rawUsage from '../../scripts/lib/usage.js';

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..');
const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

// ── windowUsage crosscheck + the mutation gate ──────────────────────────────────────
describe('rolling-5h output-token figure', () => {
  function buildFixture() {
    const claudeRoot = mkTmpDir('mc-xcheck-claude-');
    const projectsRoot = mkTmpDir('mc-xcheck-projects-');
    const proj = path.join(projectsRoot, 'fixture-proj');
    initGitRepo(proj);
    const now = Date.now();
    const recentIso = new Date(now - 60_000).toISOString(); // 1 minute ago — inside the 5h window
    const file = fixtureClaudeProjectsDir(claudeRoot, proj, 'sess-1', [
      { ts: recentIso, output_tokens: 12_345 },
      { ts: recentIso, output_tokens: 6_789, isSidechain: true },
    ]);
    return { claudeRoot, projectsRoot, proj, file, now };
  }

  test('MC (via server/lib/usage.ts) and the raw scripts/lib/usage.js function agree', () => {
    const { claudeRoot, projectsRoot, now } = buildFixture();
    cleanupDirs.push(claudeRoot, projectsRoot);

    const mc = mcWindowUsage({ now, projectsDir: claudeRoot });
    const raw = (rawUsage as { windowUsage: (o: unknown) => { output_tokens: number } }).windowUsage({
      now,
      projectsDir: claudeRoot,
      noCache: true,
    });

    expect(mc.output_tokens).toBe(raw.output_tokens);
    expect(mc.output_tokens).toBe(19_134); // 12,345 + 6,789 — sanity anchor, not just self-equal
  });

  test('MUTATION GATE: editing output_tokens in the fixture turns the figure red', () => {
    const { claudeRoot, projectsRoot, file, now } = buildFixture();
    cleanupDirs.push(claudeRoot, projectsRoot);

    const baseline = mcWindowUsage({ now, projectsDir: claudeRoot });

    // Mutate a temp COPY of the fixture transcript (never the original), then point a
    // fresh fixture root at the mutated copy.
    const mutatedRoot = mkTmpDir('mc-xcheck-mutated-');
    cleanupDirs.push(mutatedRoot);
    const relative = path.relative(claudeRoot, file);
    const mutatedFile = path.join(mutatedRoot, relative);
    fs.mkdirSync(path.dirname(mutatedFile), { recursive: true });
    const original = fs.readFileSync(file, 'utf8');
    const mutated = original.replace('12345', '999999');
    expect(mutated).not.toBe(original); // the replace actually did something
    fs.writeFileSync(mutatedFile, mutated);

    const afterMutation = mcWindowUsage({ now, projectsDir: mutatedRoot });
    const rawAfterMutation = (rawUsage as { windowUsage: (o: unknown) => { output_tokens: number } }).windowUsage({
      now,
      projectsDir: mutatedRoot,
      noCache: true,
    });

    expect(afterMutation.output_tokens).not.toBe(baseline.output_tokens);
    // and the two independent implementations still agree with each other on the mutated data —
    // the crosscheck stays meaningful post-mutation, it doesn't just go red and stop checking.
    expect(afterMutation.output_tokens).toBe(rawAfterMutation.output_tokens);
    expect(afterMutation.output_tokens).toBe(999_999 + 6_789);
  });
});

// ── fleet launcher-generation crosscheck (against the real ~/bin — see PR2 brief: this
// command has no env override for its target directory, so it cannot be fixtured) ──────
describe('per-launcher generation hash', () => {
  // buildCold() reads every real transcript on this machine (measured ~4.2s across
  // ~2,000 files in the fleet this repo runs on) — past bun's 5s default, so this needs
  // headroom too. The perf test (test/perf.test.ts) is what pins "under 3s" — against
  // fixtures, not this real, unbounded directory.
  //
  // CI FAILURE, real, caught 2026-08-13: `node scripts/warroom-install.mjs fleet` exits
  // 1 and prints "✗ /home/runner/bin does not exist" on a runner with no standalone
  // launchers — this test's subject does not exist there, so it failed for a reason the
  // PR did not cause. Same shape as check-registration.mjs's own precedent: CI has none
  // of the machine-specific launcher state, so blocking on its absence fails every run.
  // Fixed the same way check-cold-start.ts handles "no corpus": detect the environment
  // condition BEFORE asserting anything, and when it holds, print the reason to stdout
  // (unconditionally — bun test renders an early `return` as a pass, so silence would
  // read as "verified" to anyone skimming CI output) and stop, never asserting a result
  // it could not check.
  //
  // The gate is deliberately narrow and environment-only: it checks whether ~/bin exists
  // — the exact condition the CI failure demonstrated — and nothing else. It must never
  // widen to catch a thrown assertion or a genuine mismatch from the real comparison
  // below; doing that would turn a real cross-check into decoration, which is the
  // failure this whole PR exists to prevent. The comparison logic itself is untouched.
  test(
    "MC's fleet.gen for each launcher equals the GEN column of `node scripts/warroom-install.mjs fleet`, parsed independently",
    () => {
      // Same shape as every other machine gate, so it uses the same helper: one sentence, one
      // wording, so a reader skimming CI output sees a consistent line whatever the absent
      // subject was. The PREDICATE stays local because the subject is local — ~/bin is what
      // this test needs, not the transcript corpus test/gate.ts speaks for.
      const binDir = path.join(os.homedir(), 'bin');
      if (!fs.existsSync(binDir)) {
        notVerified(
          'fleet cross-check',
          `${binDir} does not exist on this machine (e.g. a CI runner with no standalone launchers installed)`
        );
        return;
      }

      const stdout = execFileSync('node', [path.join(REPO_ROOT, 'scripts', 'warroom-install.mjs'), 'fleet'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      // Independent parse: one line, one regex, no shared code with server/collectors/fleet.ts.
      const independentGens = new Map<string, string>();
      for (const line of stdout.split('\n')) {
        const m = /^\s*(\S+)\s+\d+\s+\d+\s+([0-9a-f]{8})\s+(?:in scope|excluded)\s*$/.exec(line);
        if (m) independentGens.set(m[1] as string, m[2] as string);
      }
      expect(independentGens.size).toBeGreaterThan(0);

      const projects = discoverProjects();
      const store = new IndexStore();
      store.buildCold(projects);
      const fleet = buildFleet(projects, store, REPO_ROOT);

      let checked = 0;
      for (const row of fleet.projects) {
        const expectedGen = independentGens.get(row.id);
        if (!expectedGen) continue; // this project has no standalone launcher — not a disagreement
        expect('gen' in row.launcher ? row.launcher.gen : null).toBe(expectedGen);
        checked++;
      }
      expect(checked).toBeGreaterThan(0); // the crosscheck actually compared something
    },
    30_000
  );
});

// ── ledger verdict-count crosscheck (against the real ledger in this repo — see PR2
// brief: the only project with one) ──────────────────────────────────────────────────
describe('claim counts by verdict', () => {
  // `ledger.mjs verify` runs every claim-command resolver, several of which shell out to
  // real test suites — ~5.5s measured for one invocation. This test runs it twice
  // (once directly, once through runLedgerVerify), so it needs headroom past bun's 5s
  // default.
  test(
    "MC's ledger summary equals `node scripts/ledger.mjs verify --offline`, parsed independently",
    () => {
      const stdout = execFileSync('node', [path.join(REPO_ROOT, 'scripts', 'ledger.mjs'), 'verify', '--offline'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      const m = /ledger verify: (\d+) pass · (\d+) would_block \(shadow\) · (\d+) block/.exec(stdout);
      expect(m).not.toBeNull();
      const header = /^ledger verify: (\d+) claims/m.exec(stdout);
      expect(header).not.toBeNull();
      const independent = {
        totalClaims: Number(header![1]),
        pass: Number(m![1]),
        wouldBlock: Number(m![2]),
        block: Number(m![3]),
      };

      const mc = runLedgerVerify(REPO_ROOT, { offline: true });
      expect('pass' in mc ? mc : null).not.toBeNull();
      if ('pass' in mc) {
        expect(mc.totalClaims).toBe(independent.totalClaims); // pins belief.ts's HEADER_RE fallback path too
        expect(mc.pass).toBe(independent.pass);
        expect(mc.wouldBlock).toBe(independent.wouldBlock);
        expect(mc.block).toBe(independent.block);
      }
    },
    30_000
  );
});

// ── the budget-guard cache file is never touched ────────────────────────────────────
describe('budget-guard cache file', () => {
  test('is byte- and mtime-identical after MC computes windowUsage and does a full fixture index build', () => {
    const cachePath = path.join(process.env.HOME ?? '', '.agentvibe', 'usage-cache.json');
    const before = fs.existsSync(cachePath) ? { bytes: fs.readFileSync(cachePath), mtimeMs: fs.statSync(cachePath).mtimeMs } : null;

    // A representative slice of what a full index build does: compute the account-wide
    // budget figure (against the REAL ~/.claude/projects, since that's what the live
    // route does) and build a session index over a fixture project.
    mcWindowUsage({});
    const claudeRoot = mkTmpDir('mc-cache-claude-');
    const projectsRoot = mkTmpDir('mc-cache-projects-');
    cleanupDirs.push(claudeRoot, projectsRoot);
    const proj = path.join(projectsRoot, 'p');
    initGitRepo(proj);
    fixtureClaudeProjectsDir(claudeRoot, proj, 's1', [{ ts: new Date().toISOString(), output_tokens: 1 }]);
    const projects = discoverProjects({ roots: [projectsRoot], claudeProjectsRoot: claudeRoot });
    new IndexStore().buildCold(projects);

    const after = fs.existsSync(cachePath) ? { bytes: fs.readFileSync(cachePath), mtimeMs: fs.statSync(cachePath).mtimeMs } : null;

    if (before === null) {
      expect(after).toBeNull(); // MC must not have CREATED the file either
    } else {
      expect(after).not.toBeNull();
      expect(after!.mtimeMs).toBe(before.mtimeMs);
      expect(Buffer.compare(after!.bytes, before.bytes)).toBe(0);
    }
  });
});

// ── no disk writes, and no shell, anywhere in server/** ─────────────────────────────
describe('server/** performs no disk mutation, and never invokes a shell', () => {
  const serverDir = path.join(REPO_ROOT, 'mission-control', 'server');

  function walkServerTs(): string[] {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.ts')) files.push(p);
      }
    };
    walk(serverDir);
    return files;
  }

  // Per-line scan: gives a human a line number to look at, but is blind to a call split
  // across lines (`execSync\n  (cmd)` — each line tested alone contains neither
  // "execSync(" nor anything else a single-line pattern matches). Found live in review
  // round 3: this alone let a real, executing execSync(...) call sit in server/** with
  // the guard at 8/8 green.
  function findOffendersPerLine(pattern: RegExp, files: string[]): string[] {
    const offenders: string[] = [];
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      text.split('\n').forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, '');
        if (pattern.test(code)) offenders.push(`${path.relative(serverDir, f)}:${i + 1}: ${line.trim()}`);
      });
    }
    return offenders;
  }

  // Whole-file scan with every run of whitespace — including newlines — collapsed to a
  // single space, so a call artificially split across lines cannot hide from a pattern
  // that reads fine as one line. No line number; findOffendersPerLine above is what
  // points a human at the spot when it can. `//` line comments are stripped first
  // (same limitation as the per-line scan: a `/* ... */` block comment mentioning one of
  // these tokens in prose is not distinguished from code — none exist in server/** today).
  function findOffendersCollapsed(pattern: RegExp, files: string[]): string[] {
    const offenders: string[] = [];
    for (const f of files) {
      const withoutLineComments = fs
        .readFileSync(f, 'utf8')
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .join('\n');
      const collapsed = withoutLineComments.replace(/\s+/g, ' ');
      if (pattern.test(collapsed)) {
        offenders.push(`${path.relative(serverDir, f)}: matched only after collapsing whitespace/newlines (a call split across lines)`);
      }
    }
    return offenders;
  }

  function findOffenders(pattern: RegExp, files: string[]): string[] {
    return [...findOffendersPerLine(pattern, files), ...findOffendersCollapsed(pattern, files)];
  }

  // Single source of truth for both tests below: the real-file scan, and the direct
  // pattern-efficacy check against known bypass shapes (so the two cannot silently
  // diverge from each other).
  const SHELL_INVOCATION_PATTERNS = [
    /\bexecSync\s*\(/, // always shells out, unlike execFileSync
    /(?<!\.)\bexec\s*\(/, // bare exec( — always shells out; excludes someRegex.exec(...)
    /(?<!\.)\bexecFile\s*\(/, // bare execFile( (the callback form) — new spawn surface this codebase doesn't use
    /shell\s*:\s*true/, // the opt-in shell flag on exec/spawn, as an object-literal property
    /execFileSync\s*\(\s*['"`](?:\/bin\/|\/usr\/bin\/)?(bash|sh|zsh|dash)['"`]/,
    /spawnSync\s*\(\s*['"`](?:\/bin\/|\/usr\/bin\/)?(bash|sh|zsh|dash)['"`]/,
    /(['"`])-c\1/, // the telltale flag that turns any binary into "run this string"
    /\bBun\.\$/, // Bun's own shell-execution tag
  ];

  test('no writeFile/mkdir/rm/unlink/git-commit/git-push call sites', () => {
    // This is a TEXT grep, not a semantic check: it cannot catch a write assembled from
    // a runtime string (e.g. execFileSync('sh', ['-c', someComputedString])). It only
    // pins the literal call sites this PR introduces. See the test below for that
    // specific blind spot — it is not hypothetical, it shipped once already.
    const files = walkServerTs();
    expect(files.length).toBeGreaterThan(0);
    const pattern = /\b(writeFile(Sync)?|mkdir(Sync)?|rm(Sync)?|unlink(Sync)?|appendFile(Sync)?|git\s+commit|git\s+push)\b/;
    expect(findOffenders(pattern, files)).toEqual([]);
  });

  // Found live 2026-08-13: server/collectors/empty.ts built a shell string from
  // project.root — a real, attacker-influenceable directory name read straight off disk
  // by discoverProjects() — and ran it via execFileSync('bash', ['-c', probe]). A
  // directory named `x;touch PWNED;echo done` executed arbitrary shell the moment
  // anyone requested GET /api/project/:id, in a component whose entire job is being
  // read-only. The write-guard test above did not catch it: that call site contains
  // none of writeFile/mkdir/rm/unlink/git-commit/git-push, which is exactly the blind
  // spot its own comment names.
  //
  // NAMED FOR WHAT IT ACTUALLY DOES, not what it would be nice for it to do: this pins
  // the literal shell-invocation SHAPES known today. It is a text grep over source, not
  // a semantic check, and ANY regex over source text is gameable by construction — this
  // is the third guard in two days whose name outran its reach (the read-only probe
  // passing on file absence, the write-guard's original token list missing this exact
  // RCE), so the fix here is to stop writing the name aspirationally. Known, accepted
  // gaps, left as a list rather than a false sense of coverage:
  //   - a shell binary held in a variable (`const bin = 'bash'; execFileSync(bin, ...)`)
  //     defeats the literal-string patterns below entirely.
  //   - `obj.shell = true` set by property assignment, rather than as an object literal,
  //     has no `:` and is invisible to the `shell\s*:\s*true` pattern.
  //   - `Bun.$` is flagged (below) but its interpolations are auto-escaped by Bun, so
  //     they are not a live injection today; that is Bun's behavior, not this guard's
  //     coverage, and would stop being true if Bun's own escaping ever changed.
  //   - `exec`/`execFile` (see below) are matched as BARE calls only
  //     (`(?<!\.)\bexec\s*\(`, chosen specifically so it does not fire on the many
  //     legitimate `someRegex.exec(str)` calls in this codebase) — a namespace-qualified
  //     call (`childProcess.exec(...)`) is not matched, and neither is `exec?.(...)`
  //     (optional chaining) or `(0, exec)(...)` (the comma-operator indirection trick) —
  //     both execute identically to `exec(...)` and neither is "namespace-qualified", so
  //     this list is documenting them as real gaps, not claiming they're covered by the
  //     "namespace-qualified" line above.
  // An AST-based check (walk real CallExpression nodes, flag any call whose callee
  // resolves to a child_process exec family member or Bun.$, regardless of aliasing)
  // would close all of these at once and is the durable fix. Not built in this PR — that
  // is a scope decision for review, not a silent gap: this test buys time, it does not
  // replace that work.
  test('pins known literal shell-invocation forms (regex grep — see gaps listed above)', () => {
    const files = walkServerTs();
    expect(files.length).toBeGreaterThan(0);
    const offenders = SHELL_INVOCATION_PATTERNS.flatMap((p) => findOffenders(p, files));
    expect(offenders).toEqual([]);
  });

  // The test above proves ABSENCE in the current files, which says nothing about
  // whether the patterns actually catch the failure shapes they claim to. This test
  // proves the other half directly, against synthetic lines — including the exact bare
  // exec() bypass the reviewer used to defeat the previous version of this guard, and
  // the original 'bash', ['-c', probe] line before it was removed.
  test('the patterns above catch every known bypass shape, tested directly', () => {
    const knownBypasses = [
      "execFileSync('bash', ['-c', probe], { encoding: 'utf8' })", // the original RCE
      'exec(`grep -rl playbook_stage ${root}`, cb)', // MAJOR: bare exec() defeated the first version
      "execFile('grep', args, cb)", // bare execFile() callback form
      'execSync(`grep -rl playbook_stage ${root}`)',
      "spawnSync('bash', ['-c', probe])",
      "execFileSync(bin, argsArr, { encoding: 'utf8', shell: true })", // object-literal shell:true
      'Bun.$`grep -rl playbook_stage ${root}`',
    ];
    for (const line of knownBypasses) {
      const caught = SHELL_INVOCATION_PATTERNS.some((p) => p.test(line));
      expect(caught).toBe(true);
    }
    // And the negative: legitimate calls this codebase actually makes must NOT trip it.
    const legitimate = [
      "execFileSync('node', [script, 'fleet'], { cwd: repoRoot, encoding: 'utf8' })",
      "execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: project.root })",
      "execFileSync(probeCmd.cmd, probeCmd.args, { encoding: 'utf8' })",
      'const m = CEILING_RE.exec(reason);',
      'const header = HEADER_RE.exec(text);',
    ];
    for (const line of legitimate) {
      const falsePositive = SHELL_INVOCATION_PATTERNS.some((p) => p.test(line));
      expect(falsePositive).toBe(false);
    }
  });
});
