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
  // real test suites. This test runs it TWICE — once directly, once through runLedgerVerify.
  //
  // THE TIMEOUT WAS WRITTEN AGAINST A WRONG MEASUREMENT. It said "~5.5s measured for one
  // invocation" and allowed 30s for two. Re-measured 2026-08-13 with the exit code and the
  // output length actually checked: 10,385 ms for one run idle, 17,547 ms under load (8.2
  // load average) — so two runs is 21-35 s and this test was failing on a busy machine for
  // no reason connected to the code under test. That is the §0 defect class in a test
  // budget: a number nobody verified, treated as fact. 120 s is 3.4x the measured
  // worst-case, and the figure it is derived from is written here so the next person can
  // check it rather than guess again.
  test(
    "MC's ledger summary equals `node scripts/ledger.mjs verify --offline`, parsed independently",
    async () => {
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

      const mc = await runLedgerVerify(REPO_ROOT, { offline: true });
      expect('pass' in mc ? mc : null).not.toBeNull();
      if ('pass' in mc) {
        expect(mc.totalClaims).toBe(independent.totalClaims); // pins belief.ts's HEADER_RE fallback path too
        expect(mc.pass).toBe(independent.pass);
        expect(mc.wouldBlock).toBe(independent.wouldBlock);
        expect(mc.block).toBe(independent.block);
      }
    },
    120_000
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

// ── no disk writes outside the cache module, and no shell, anywhere in server/** ────────
//
// THIS DESCRIBE USED TO SAY "performs no disk mutation". That stopped being true the moment
// Mission Control began persisting its session index, and the honest move was to re-scope the
// guard and rename it — not to keep the words and carve an exception underneath them. A guard
// whose name outruns its body reads as rigour while asserting something weaker, which is the
// defect this phase has found most often; "writes nothing, except…" is that defect in its most
// persuasive form.
//
// SO THE CLAIM IS NOW SPLIT ACROSS TWO INDEPENDENT CHECKS, because neither can make it alone:
//
//   this file        WHICH FILE may contain a write call. A regex over source text: it can see
//                    a call site, and can say nothing whatever about where the bytes go.
//   write-barrier    WHERE THE BYTES LANDED. Runs the server against a real fixture fleet,
//                    snapshots the tree by CONTENT before and after, and asserts the cache file
//                    is the only path that changed. Reads no source at all.
//
// That is the same demotion the shell guard got: the source-text check is the cheap one and a
// behavioural probe stands behind it. Two cheap independent checks beat one careful one.
//
// AND THE CHEAP ONE IS DEMONSTRABLY NOT SUFFICIENT. Executed 2026-08-16, before the re-scope:
// `fs.copyFileSync(project.root + '/README.md', project.root + '/X.txt')` injected into the
// /api/project/:id handler scored ZERO offenders across this entire scan — a plainly spelled
// write API, no aliasing, simply absent from the token list — while the behavioural barrier
// failed and named both files it created. The token list below has since been widened with the
// write-only APIs that omission exposed; the barrier is what covers the ones nobody has
// thought of yet.
describe('server/** mutates nothing outside server/index-cache.ts, and never invokes a shell', () => {
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

  /**
   * Source text with comments removed — `/* … *\/` blocks first, then `//` to end of line.
   *
   * CLOSES ISSUE #27, which is logged in PHASE-8A-HANDOFF.md §5: "that guard false-positives
   * on prose merely mentioning `exec(` across a line wrap". Only `//` comments were stripped,
   * so a JSDoc block explaining why a shell must never be spawned could trip the guard that
   * forbids spawning one. server/** is heavily documented in `/** … *\/` blocks, and this file
   * is about to gain write-API tokens whose plain-English words (rename, truncate, copy)
   * appear in that prose constantly — so leaving block comments in the scan would have turned
   * a strengthening into a guard that cries wolf until someone weakens it.
   *
   * Each block is replaced by its own newlines rather than deleted, so line numbers stay true
   * and the per-line scan below still points a human at the right line.
   *
   * Known limitation, unchanged: this is text processing, not parsing. A `/*` inside a string
   * literal or a regex would be mistaken for a comment opener. None exists in server/** today,
   * and an AST walk (issue #26) is what removes the caveat rather than another regex.
   */
  function stripComments(text: string): string {
    return text
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n');
  }

  // Per-line scan: gives a human a line number to look at, but is blind to a call split
  // across lines (`execSync\n  (cmd)` — each line tested alone contains neither
  // "execSync(" nor anything else a single-line pattern matches). Found live in review
  // round 3: this alone let a real, executing execSync(...) call sit in server/** with
  // the guard at 8/8 green.
  function findOffendersPerLine(pattern: RegExp, files: string[]): string[] {
    const offenders: string[] = [];
    for (const f of files) {
      const raw = fs.readFileSync(f, 'utf8');
      const rawLines = raw.split('\n');
      stripComments(raw)
        .split('\n')
        .forEach((code, i) => {
          if (pattern.test(code)) offenders.push(`${path.relative(serverDir, f)}:${i + 1}: ${(rawLines[i] ?? '').trim()}`);
        });
    }
    return offenders;
  }

  // Whole-file scan with every run of whitespace — including newlines — collapsed to a
  // single space, so a call artificially split across lines cannot hide from a pattern
  // that reads fine as one line. No line number; findOffendersPerLine above is what
  // points a human at the spot when it can. Comments — BOTH kinds — are stripped first by
  // stripComments above; this note used to record a block-comment blind spot that no longer
  // exists (issue #27), and the reason it had to go is written there.
  function findOffendersCollapsed(pattern: RegExp, files: string[]): string[] {
    const offenders: string[] = [];
    for (const f of files) {
      const collapsed = stripComments(fs.readFileSync(f, 'utf8')).replace(/\s+/g, ' ');
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
  // WHAT CHANGED IN PR4, AND WHY IT IS A NARROWING RATHER THAN A WEAKENING.
  //
  // This list used to carry `/(?<!\.)\bexecFile\s*\(/` — bare execFile, flagged with the
  // comment "new spawn surface this codebase doesn't use". That was true when it was
  // written and it is no longer: PR4 converts the conflicts sweep and the ledger verify from
  // the *Sync forms to the promisified async ones, because both were blocking Bun's single
  // JS thread for seventeen and nineteen seconds respectively and stalling the SSE tick for
  // every connected client while they ran.
  //
  // The invariant this file defends is NO SHELL. `execFile(binary, [args])` spawns the
  // binary directly — it is exactly as shell-free as `execFileSync(binary, [args])`, which
  // this list has always permitted, and the two are matched the same way now: flagged when
  // the binary is a shell literal, not flagged for being the API. The alternative was to
  // switch to `spawn`, which no pattern here matches at all — i.e. to pick an API for the
  // property of being invisible to the guard. That is the move this codebase must never
  // make, so it was not made.
  //
  // A regex over source text is gameable by construction (finding 26), and relaxing any
  // pattern widens that. So the relaxation does not stand alone: test/collectors.test.ts
  // carries a BEHAVIOURAL barrier that reads no source at all — it builds a real worktree
  // named `evilproj;touch <marker>;echo done`, runs the real sweep across it, and asserts
  // the marker file does not exist afterwards. §0: two cheap independent checks beat one
  // careful one, and the source-text guard is now the cheap one.
  // THE NARROWING, CORRECTED — the first version of it was worse than useless.
  //
  // Round 1 replaced `\bexecFile\s*\(` with `\bexecFile\s*\(\s*['"`](bash|sh|…)`. That
  // requires `(` IMMEDIATELY after `execFile`, so it matched none of the `execFileAsync(`
  // calls this PR introduces — it stopped matching the exact spelling `server/**` now uses
  // everywhere, and the pinning test beneath it asserted the discrimination for
  // `execFile('bash', …)`, a spelling this tree no longer contains. Verified by the
  // reviewer: a synthetic server file doing `promisify(execFile)` and then
  // `execFileAsync('bash', ['-lc', cmd])` scored ZERO offenders across the whole scan.
  //
  // Three widenings, each closing a hole that version had:
  //   1. A FAMILY NAME FOLLOWED BY IDENTIFIER CHARACTERS — named from the body, not from the
  //      intention. This comment previously said "ANY ALIAS", which is not what the pattern
  //      does: `const run = execFile; run('bash', …)` is an alias and is invisible to it.
  //      What it does catch is the shape this codebase actually produces — exec/execFile/
  //      spawn promisified into execAsync/execFileAsync/spawnAsync, where the family name is
  //      still a prefix of the identifier that runs. An AST walk (finding 26) is what would
  //      cover real aliasing.
  //   2. ANY PATH to a shell, not two enumerated prefixes. `/usr/local/bin/bash` and
  //      `/opt/homebrew/bin/bash` — the latter is the real bash on this machine — sat
  //      outside `/bin/` and `/usr/bin/` and were invisible.
  //   3. The whole `-c` FAMILY. `sh -lc`, `-ic` and `-ec` execute a string exactly as `-c`
  //      does; the old rule matched those two characters literally.
  const SHELL_BINARY = String.raw`['"\`](?:[^'"\`]*\/)?(?:bash|sh|zsh|dash|ksh|fish)['"\`]`;
  const SPAWN_FAMILY = String.raw`(?:exec|execFile|execFileSync|execSync|spawn|spawnSync)[A-Za-z0-9_$]*`;

  const SHELL_INVOCATION_PATTERNS = [
    /\bexecSync\s*\(/, // always shells out, unlike execFileSync
    // Bare exec( plus the three promisified spellings this codebase would plausibly use.
    // ENUMERATED, not open-ended: the previous `exec[A-Za-z0-9_$]*\(` matched executeQuery(
    // and executionPlan( — issue #27's false-positive-on-unrelated-identifiers failure mode,
    // reappearing inside the widened pattern. `(?<!\.)` keeps it off someRegex.exec(str).
    /(?<!\.)\bexec(?:Async|Promise|P)?\s*\(/,
    /shell\s*:\s*true/, // the opt-in shell flag on exec/spawn, as an object-literal property
    // A shell binary as the first argument of any spawn-family identifier, by any path.
    // Open-ended suffix is safe HERE in a way it was not above, because this rule only fires
    // when the first argument is a literal shell name — `executeQuery('bash')` is not a
    // shape anyone writes by accident.
    new RegExp(String.raw`\b${SPAWN_FAMILY}\s*\(\s*${SHELL_BINARY}`),
    /(['"`])-[a-z]*c\1/, // -c and -lc/-ic/-ec: the flags that turn any binary into "run this string"
    /\bBun\.\$/, // Bun's own shell-execution tag
  ];

  /**
   * The one file allowed to contain a write call, and it is one file rather than a directory.
   *
   * server/index-cache.ts is the whole of the persistence: load, save, atomic rename. Scoping
   * the permission to that path means adding a write anywhere else in server/** is still a
   * failing test, which is the only property that makes an allowlist worth having.
   */
  const WRITE_OWNER = 'index-cache.ts';

  /**
   * Write-family APIs. WIDENED 2026-08-16 with every token after `appendFile`, each one a real
   * write API that the previous list could not see.
   *
   * NOT A THEORETICAL WIDENING. `fs.copyFileSync` was injected into the /api/project/:id
   * handler and this scan reported ZERO offenders while the file was demonstrably being
   * created — no aliasing, no computed string, just an API nobody had enumerated. The same was
   * true of renameSync, truncateSync, symlinkSync, cpSync and createWriteStream.
   *
   * `openSync` IS DELIBERATELY ABSENT and cannot be added: server/index-store.ts opens files
   * read-only with it on the append and boundary-probe paths, so banning it would forbid the
   * read path. `fs.openSync(p, 'w')` is therefore a live blind spot in THIS check — named
   * here, and covered by test/write-barrier.test.ts, which sees the file appear regardless of
   * which API made it.
   */
  const WRITE_PATTERN =
    /\b(writeFile(Sync)?|writeSync|mkdir(Sync)?|rm(Sync)?|rmdir(Sync)?|unlink(Sync)?|appendFile(Sync)?|copyFile(Sync)?|cpSync|rename(Sync)?|truncate(Sync)?|ftruncate(Sync)?|symlink(Sync)?|link(Sync)?|createWriteStream|git\s+commit|git\s+push)\b/;

  test(`no write-API call sites in server/** outside ${WRITE_OWNER}`, () => {
    // This is a TEXT grep, not a semantic check: it cannot catch a write assembled from
    // a runtime string (e.g. execFileSync('sh', ['-c', someComputedString])), and it cannot
    // tell WHERE a write it does see would land. test/write-barrier.test.ts answers the
    // second question by running the server and looking at the disk.
    const files = walkServerTs().filter((f) => path.basename(f) !== WRITE_OWNER);
    expect(files.length).toBeGreaterThan(0);
    expect(findOffenders(WRITE_PATTERN, files)).toEqual([]);
  });

  // A TEST MUST NOT WRITE TO THE DEVELOPER'S HOME DIRECTORY, and this exists because one did.
  //
  // `LiveState` persists its index to ~/.agentvibe/mission-control/index.json by default. Every
  // test that builds one therefore has to say where its cache goes — `indexCache: false` for the
  // ones measuring a genuine full read, `indexCachePath` for the ones that want persistence in
  // a fixture they own. Three sites in test/views.test.tsx did neither, and a full `npm run
  // check` left a 4.3 MB index of the real corpus in $HOME. It was found by looking at the
  // filesystem afterwards, not by any assertion — the earlier sweep for these call sites
  // globbed `test/*.ts` and this file is `.tsx`, so it was never examined.
  //
  // Named for what it does: a TEXT scan for the constructor. It cannot see a LiveState built
  // through a helper or from a variable holding the options; the durable check would be an
  // afterAll asserting the default path was not created, which needs the whole suite in one
  // process and is not how these files run.
  test('every LiveState in test/** says where its index cache goes', () => {
    const testDir = path.join(REPO_ROOT, 'mission-control', 'test');
    const files = fs
      .readdirSync(testDir)
      .filter((n) => n.endsWith('.ts') || n.endsWith('.tsx'))
      .map((n) => path.join(testDir, n));
    expect(files.length).toBeGreaterThan(5); // non-vacuity: the scan found the test tree

    const offenders: string[] = [];
    let constructions = 0;
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/new LiveState\(([\s\S]{0,400}?)\)\s*[;,)]/g)) {
        constructions++;
        const args = m[1] ?? '';
        if (!args.includes('indexCache')) {
          const line = text.slice(0, m.index).split('\n').length;
          offenders.push(`${path.basename(f)}:${line}`);
        }
      }
    }
    // NON-VACUITY: the scan actually matched constructors. A regex that silently stopped
    // matching would leave this green forever while every new test wrote to $HOME.
    expect(constructions).toBeGreaterThanOrEqual(6);
    expect(offenders).toEqual([]);
  });

  // AN ALLOWLIST WITH NO TEST THAT IT IS NARROW IS JUST A HOLE. Both halves are asserted:
  // the exempt file really does contain the writes (so the exemption is load-bearing and not
  // a leftover), and the exemption really is scoped to that one path (so the same code in any
  // other server file still fails).
  test(`the ${WRITE_OWNER} exemption is load-bearing, and is scoped to that one file`, () => {
    const all = walkServerTs();
    const owner = all.filter((f) => path.basename(f) === WRITE_OWNER);
    expect(owner).toHaveLength(1); // the exempt file exists and is unique — the allowlist cannot rot

    // Load-bearing: without the exemption this scan is red. If this ever goes green the
    // exemption is dead weight and should be deleted rather than carried.
    expect(findOffenders(WRITE_PATTERN, owner).length).toBeGreaterThan(0);

    // Scoped: the SAME source text under any other name in server/** is still an offender.
    // Proven by scanning the exempt file's own bytes through the non-exempt code path, so the
    // two cannot drift — this is not a synthetic line that resembles the real one.
    const ownerText = fs.readFileSync(owner[0]!, 'utf8');
    const decoy = path.join(serverDir, '__scope-probe.ts');
    fs.writeFileSync(decoy, ownerText);
    try {
      const rescan = walkServerTs().filter((f) => path.basename(f) !== WRITE_OWNER);
      expect(rescan).toContain(decoy);
      expect(findOffenders(WRITE_PATTERN, rescan).length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(decoy, { force: true });
    }
    // …and the decoy is gone, so a later run of this suite scans the real tree.
    expect(fs.existsSync(decoy)).toBe(false);
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
      "execFile('bash', ['-c', probe], cb)", // the async form of the original RCE
      "execFile('/bin/sh', ['-c', probe], cb)", // …and by absolute path
      // THE SHAPE ROUND 1 OF THE NARROWING MISSED ENTIRELY, in every spelling the reviewer
      // demonstrated. This is the alias `server/**` itself uses, so a regression of the code
      // this PR ships would look exactly like one of these lines.
      "execFileAsync('bash', ['-c', cmd])",
      "execFileAsync('bash', ['-lc', cmd])", // -lc, which the two-character -c rule missed
      "execFileAsync('/opt/homebrew/bin/bash', ['-lc', cmd])", // the real bash on this machine
      "execFileAsync('/usr/local/bin/bash', ['-ic', cmd])",
      "execAsync(`git status ${root}`)", // promisified bare exec
      "spawnAsync('zsh', ['-ec', cmd])",
      'execSync(`grep -rl playbook_stage ${root}`)',
      "spawnSync('bash', ['-c', probe])",
      "execFileSync(bin, argsArr, { encoding: 'utf8', shell: true })", // object-literal shell:true
      "execFileAsync('git', args, { shell: true })", // the promisified form, opted into a shell
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
      // The two calls PR4 introduces. Both spawn a named binary with an args array and no
      // shell — the same shape as the three lines above, in the async form.
      "execFileAsync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: worktreePath })",
      "execFileAsync('node', args, { cwd: projectRoot, encoding: 'utf8' })",
      'const execFileAsync = promisify(execFile);',
      'const m = CEILING_RE.exec(reason);',
      'const header = HEADER_RE.exec(text);',
      // Unrelated identifiers that merely START with a family name. The widened pattern
      // flagged both — issue #27's failure mode reappearing inside the fix for #38.
      'const rows = await executeQuery(sql);',
      'const plan = executionPlan(query);',
      'const s = spawnPointFor(entity);',
    ];
    for (const line of legitimate) {
      const falsePositive = SHELL_INVOCATION_PATTERNS.some((p) => p.test(line));
      expect(falsePositive).toBe(false);
    }
  });

  // THE PATTERN THAT WAS RELAXED, PINNED FROM BOTH SIDES — and pinned for the spelling
  // `server/**` ACTUALLY USES, which is what round 1 of this test got wrong: it asserted the
  // discrimination for `execFile('bash', …)` while every call site in the tree had become
  // `execFileAsync(…)`, so it certified a rule against a spelling that no longer existed.
  test('the spawn-family rule catches a shell binary under every alias and path, and only a shell binary', () => {
    const shellLiterals = [
      // The exact identifier…
      "execFile('bash', a, cb)",
      "execFileSync('sh', a)",
      "spawnSync('zsh', a)",
      "execFile('/usr/bin/dash', a, cb)",
      // …and the promisified aliases, which are what this codebase now contains.
      "execFileAsync('bash', a)",
      "execFileAsync('/opt/homebrew/bin/bash', a)",
      "execFileAsync('/usr/local/bin/zsh', a)",
      "spawnAsync('sh', a)",
      "execFileP('ksh', a)",
    ];
    for (const line of shellLiterals) {
      expect(SHELL_INVOCATION_PATTERNS.some((p) => p.test(line))).toBe(true);
    }
    // A named non-shell binary with an args array is the permitted shape, under every alias.
    const permitted = [
      "execFile('git', a, cb)",
      "execFile('node', a, cb)",
      "execFile('grep', a, cb)",
      "execFileAsync('git', a)",
      "execFileAsync('node', a)",
      "execFileAsync('/usr/bin/git', a)",
    ];
    for (const line of permitted) {
      expect(SHELL_INVOCATION_PATTERNS.some((p) => p.test(line))).toBe(false);
    }
  });

  // The -c family, pinned separately because it is the second half of every shell-string
  // exploit and the old rule matched exactly two characters.
  test('the -c rule covers the whole family, and does not fire on ordinary flags', () => {
    for (const flag of ["'-c'", "'-lc'", "'-ic'", "'-ec'", '"-lc"']) {
      expect(SHELL_INVOCATION_PATTERNS.some((p) => p.test(`args = [${flag}, cmd]`))).toBe(true);
    }
    // Real flags this codebase passes. None may trip it.
    for (const flag of ["'--porcelain'", "'--no-optional-locks'", "'--offline'", "'-rl'", "'verify'", "'--'"]) {
      expect(SHELL_INVOCATION_PATTERNS.some((p) => p.test(`args = [${flag}]`))).toBe(false);
    }
  });

  // THE GUARD, RUN AGAINST A DELIBERATELY VULNERABLE FILE. Every test above checks the
  // patterns against string literals; this one checks the SCAN — the thing that actually runs
  // in CI — against a file on disk written in the shape the reviewer used to defeat round 1.
  // Without it, a bug in findOffenders rather than in the patterns goes unnoticed.
  test('the scan itself flags a synthetic server file using promisify(execFile) with bash -lc', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-guard-synthetic-'));
    cleanupDirs.push(dir);
    const file = path.join(dir, 'vulnerable.ts');
    fs.writeFileSync(
      file,
      [
        "import { execFile } from 'node:child_process';",
        "import { promisify } from 'node:util';",
        'const execFileAsync = promisify(execFile);',
        'export async function sweep(root: string) {',
        "  const { stdout } = await execFileAsync('/opt/homebrew/bin/bash', ['-lc', `git status ${root}`]);",
        '  return stdout;',
        '}',
        '',
      ].join('\n')
    );

    const offenders = SHELL_INVOCATION_PATTERNS.flatMap((p) => findOffenders(p, [file]));
    expect(offenders.length).toBeGreaterThan(0);

    // And the mirror, so this is not passing because findOffenders flags everything: the
    // real, safe shape in the same position produces nothing.
    const safe = path.join(dir, 'safe.ts');
    fs.writeFileSync(
      safe,
      [
        "import { execFile } from 'node:child_process';",
        "import { promisify } from 'node:util';",
        'const execFileAsync = promisify(execFile);',
        'export async function sweep(cwd: string) {',
        "  const { stdout } = await execFileAsync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd });",
        '  return stdout;',
        '}',
        '',
      ].join('\n')
    );
    expect(SHELL_INVOCATION_PATTERNS.flatMap((p) => findOffenders(p, [safe]))).toEqual([]);
  });
});
