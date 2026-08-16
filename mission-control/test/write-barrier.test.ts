// test/write-barrier.test.ts — THE BEHAVIOURAL BARRIER: run the server for real, and look at
// the disk afterwards.
//
// WHY THIS EXISTS, AND WHY IT LANDS BEFORE ANYTHING ELSE.
//
// test/crosscheck.test.ts pins "server/** performs no disk mutation" with a REGEX OVER SOURCE
// TEXT, and its own comment says what that cannot catch. It is the replacement for a guard
// that let a live command-injection RCE through — a project directory named
// `evilproj;touch PWNED;echo done` executing arbitrary shell on GET /api/project/:id — which
// the write guard missed because that call site contained none of its tokens.
//
// Mission Control is about to start persisting its session index, so the server WILL write to
// one specific path. The regex has to be re-scoped from "writes nothing" to "mutates nothing
// outside its own cache directory". That re-scope is the dangerous moment: the window where
// the old guard is weakened and the new one is unproven is the window nobody should be in. So
// this file lands FIRST, proves it catches a real write, and only then does the regex change.
// Extract, prove parity, then switch.
//
// WHAT THIS CHECKS THAT A REGEX CANNOT. It reads no source. It exercises every route against a
// real fixture fleet — real git repos, real worktrees, real transcripts — and compares the
// tree before and after, byte for byte. A write assembled from a runtime string, performed by
// a spawned process, through an aliased API, or by any mechanism nobody has thought of yet,
// lands on the disk all the same, and this sees it there.
//
// WHAT IT ASSERTS ON, AND WHY NOT MTIME. The assertion is over CONTENT — size plus sha256 —
// not modification time. Measured on the real corpus 2026-08-16: five transcripts across two
// unrelated projects had their mtimes rewritten to the same millisecond (four by exactly
// 3600.0 s) with byte-identical content, identical size and identical inode. Something did a
// bulk metadata touch; nothing wrote a byte. An assertion of the form "mtime moved => content
// changed" is false on this machine, so mtime drift is REPORTED and not asserted. "Mutates
// nothing" means the bytes, and the bytes are what this compares.
//
// KNOWN GAPS, listed rather than papered over — this codebase has shipped a guard whose name
// outran its reach three times, and the fix is to stop writing the name aspirationally:
//   · `.git` internals of the fixture repos are walked, but `.git` under REPO_ROOT is NOT:
//     REPO_ROOT's `.git` is a worktree pointer into a repository other agents write to, so it
//     is not a stable oracle. A write into the real .git directory would not be seen here.
//   · `node_modules` is skipped everywhere. 87 packages, none of them read by the server.
//   · A write followed by a restore inside one request is invisible to a before/after
//     comparison. Nothing observed does this; it is a real gap in the technique, not a
//     hypothetical one.
//   · A write OUTSIDE every root below — /tmp, the home directory at large — is not seen.
//     The cache path this PR adds lives in ~/.agentvibe, which is exactly such a place, and
//     that is why the cache test asserts on that path directly rather than relying on this.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Hono } from 'hono';
import { LiveState, REPO_ROOT } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo, addWorktree, writeRegistry } from './fixtures.ts';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.next']);

/**
 * path -> `${size}:${sha256(content)}`. Content, not metadata: see the header for the measured
 * reason mtime is reported rather than asserted.
 */
export function snapshotTree(roots: string[], skipGit = false): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string, depth: number) => {
    if (depth > 12) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // unreadable: recorded as absent by both snapshots, so it cannot mask a change
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (skipGit && entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.isFile()) {
        try {
          const buf = fs.readFileSync(full);
          out.set(full, `${buf.length}:${crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16)}`);
        } catch {
          out.set(full, 'UNREADABLE');
        }
      }
    }
  };
  for (const root of roots) walk(root, 0);
  return out;
}

/**
 * path -> mtimeMs, over the same walk. SEPARATE FROM CONTENT ON PURPOSE.
 *
 * The header explains why the content comparison does not assert on mtime: five real
 * transcripts had their mtimes rewritten to the same millisecond with byte-identical content,
 * so "mtime moved => content changed" is false on this machine. That justified REPORTING mtime
 * rather than asserting it — and then nothing reported it, which left the sentence as a claim
 * with no implementation behind it. This is the implementation.
 *
 * It is not merely a print. MTIME IS THE INDEX'S INVALIDATION KEY, so a call that moves a
 * transcript's mtime without changing its bytes attacks freshness directly and is invisible to
 * a content diff. Drift inside the TRANSCRIPT CORPUS is therefore asserted — nothing legitimate
 * touches those files while a request is served — while drift elsewhere in the fixture is
 * printed, because git plumbing legitimately touches its own metadata.
 */
export function mtimeMap(roots: string[], skipGit = false): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (dir: string, depth: number) => {
    if (depth > 12) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (skipGit && entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.isFile()) {
        try {
          out.set(full, fs.statSync(full).mtimeMs);
        } catch {
          /* vanished between listing and stat */
        }
      }
    }
  };
  for (const root of roots) walk(root, 0);
  return out;
}

/** Paths present in both readings whose mtime moved. */
export function mtimeDrift(before: Map<string, number>, after: Map<string, number>): string[] {
  const moved: string[] = [];
  for (const [p, t] of after) {
    const prev = before.get(p);
    if (prev !== undefined && prev !== t) moved.push(p);
  }
  return moved.sort();
}

export interface TreeDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

export function diffTrees(before: Map<string, string>, after: Map<string, string>): TreeDiff {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  for (const [p, v] of after) {
    const prev = before.get(p);
    if (prev === undefined) added.push(p);
    else if (prev !== v) modified.push(p);
  }
  for (const p of before.keys()) if (!after.has(p)) removed.push(p);
  return { added: added.sort(), removed: removed.sort(), modified: modified.sort() };
}

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

function buildFleetFixture() {
  const claudeRoot = mkTmpDir('mc-barrier-claude-');
  const projectsRoot = mkTmpDir('mc-barrier-projects-');
  cleanupDirs.push(claudeRoot, projectsRoot);

  // Two real git repos, one with a worktree and a live registry, so the conflicts, worktrees
  // and empty-state collectors all have something to actually do. A barrier that runs the
  // routes over an empty fleet proves the routes did nothing, which is not the claim.
  for (const name of ['alpha', 'beta']) {
    const root = path.join(projectsRoot, name);
    initGitRepo(root);
    fixtureClaudeProjectsDir(claudeRoot, root, `${name}-sess-1`, [
      { ts: '2026-08-14T10:00:00.000Z', output_tokens: 120, model: 'claude-opus-5' },
      { ts: '2026-08-14T10:01:00.000Z', output_tokens: 340, isSidechain: true },
    ]);
  }
  const alpha = path.join(projectsRoot, 'alpha');
  addWorktree(alpha, path.join(alpha, '.worktrees', 'wt-1'), 'feat/barrier-fixture');
  writeRegistry(alpha, [{ name: 'wt-1', token: 'tok' }]);

  return { claudeRoot, projectsRoot };
}

describe('BEHAVIOURAL BARRIER: exercising every route mutates nothing on disk', () => {
  const { claudeRoot, projectsRoot } = buildFleetFixture();
  const roots = [projectsRoot, claudeRoot];

  test('no route adds, removes or modifies any file under the fixture fleet or the repo', async () => {
    // THE CACHE LIVES OUTSIDE THE WALKED ROOTS, so this test still asserts what its name says:
    // exercising the routes changes NOTHING here. The cache file is the one path the server is
    // allowed to write, and it gets its own assertion in the test below rather than an
    // exception carved out of this one — an exception is how a guard stops guarding.
    const cacheDir = mkTmpDir('mc-barrier-cache-');
    cleanupDirs.push(cacheDir);
    const state = new LiveState({
      roots: [projectsRoot],
      claudeProjectsRoot: claudeRoot,
      indexCachePath: path.join(cacheDir, 'index.json'),
    });
    const app = new Hono();
    app.route('/api', createApi(state));

    const before = snapshotTree(roots);
    const beforeRepo = snapshotTree([REPO_ROOT], true);
    const beforeCorpusMtimes = mtimeMap([claudeRoot]);
    const beforeFixtureMtimes = mtimeMap(roots);

    // NON-VACUITY, FIRST CLASS. An empty walk would make every assertion below pass by having
    // compared nothing — the exact shape §0 of the handoff calls "an assertion inside a branch
    // that never runs reads as coverage". These floors fail at zero and at "suspiciously few".
    expect(before.size).toBeGreaterThan(8);
    expect(beforeRepo.size).toBeGreaterThan(100);

    const paths = [
      '/api/fleet',
      '/api/sessions',
      '/api/sessions?project=alpha',
      '/api/belief',
      '/api/conflicts',
      '/api/project/alpha',
      '/api/project/beta',
      '/api/inbox',
    ];
    const statuses: number[] = [];
    for (const p of paths) {
      const res = await app.fetch(new Request(`http://127.0.0.1${p}`));
      statuses.push(res.status);
      await res.json(); // drain, so a lazily-evaluated handler actually runs
    }

    // THE ROUTES RAN AND DID SOMETHING. A 500 from every handler would also mutate nothing.
    expect(statuses).toEqual([200, 200, 200, 200, 200, 200, 200, 200]);
    expect(state.index.fileCount).toBeGreaterThan(0);

    const after = snapshotTree(roots);
    const afterRepo = snapshotTree([REPO_ROOT], true);

    // MTIME, THE INVALIDATION KEY — asserted where it matters and printed where it does not.
    // A `utimesSync` on a transcript changes no bytes, so the content diff below cannot see it,
    // and it would make the index consider a changed file unchanged (or the reverse). Nothing
    // legitimate touches the corpus while a request is served, so drift there is a failure.
    expect(beforeCorpusMtimes.size).toBeGreaterThan(0); // non-vacuity: transcripts were watched
    expect(mtimeDrift(beforeCorpusMtimes, mtimeMap([claudeRoot]))).toEqual([]);

    // Elsewhere in the fixture, git plumbing may legitimately touch its own metadata, so this
    // is the report the header promises rather than an assertion.
    const fixtureDrift = mtimeDrift(beforeFixtureMtimes, mtimeMap(roots));
    if (fixtureDrift.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`  [barrier] mtime moved on ${fixtureDrift.length} fixture path(s), content unchanged: ${fixtureDrift.slice(0, 5).join(', ')}`);
    }

    const fixtureDiff = diffTrees(before, after);
    const repoDiff = diffTrees(beforeRepo, afterRepo);

    expect(fixtureDiff).toEqual({ added: [], removed: [], modified: [] });
    expect(repoDiff).toEqual({ added: [], removed: [], modified: [] });
  });
});

// ── The one path the server is allowed to write, pinned as EXACTLY one ────────────────────
//
// This is the half of "mutates nothing outside its own cache directory" that the regex in
// test/crosscheck.test.ts cannot express. That regex can say which FILE contains a write call;
// only running the thing can say where the write LANDED. Here the cache directory is inside
// the walked roots, so the cache file appears in the diff and every other path must not.
describe('BEHAVIOURAL BARRIER: the index cache is the only path the server writes', () => {
  const { claudeRoot, projectsRoot } = buildFleetFixture();
  const cacheDir = mkTmpDir('mc-barrier-onlypath-');
  cleanupDirs.push(cacheDir);
  const cacheFile = path.join(cacheDir, 'index.json');
  const roots = [projectsRoot, claudeRoot, cacheDir];

  test('after serving every route, the cache file is the ONLY thing that changed', async () => {
    const state = new LiveState({
      roots: [projectsRoot],
      claudeProjectsRoot: claudeRoot,
      indexCachePath: cacheFile,
    });
    const app = new Hono();
    app.route('/api', createApi(state));

    const before = snapshotTree(roots);
    expect(before.size).toBeGreaterThan(8); // non-vacuity: the walk found the fixture
    expect(before.has(cacheFile)).toBe(false); // …and the cache does not exist yet

    for (const p of ['/api/fleet', '/api/sessions', '/api/conflicts', '/api/project/alpha', '/api/inbox']) {
      const res = await app.fetch(new Request(`http://127.0.0.1${p}`));
      expect(res.status).toBe(200);
      await res.json();
    }

    // THE WRITE REALLY HAPPENED. Without this the assertion below would also pass if the cache
    // were never written at all — "nothing changed" is the trivial way to satisfy "only the
    // cache changed", and it is exactly the vacuous pass this codebase keeps finding.
    expect(state.cacheSave?.ok).toBe(true);
    expect(state.cacheSave && state.cacheSave.ok && state.cacheSave.entries).toBeGreaterThan(0);

    const diff = diffTrees(before, snapshotTree(roots));
    expect(diff.added).toEqual([cacheFile]);
    expect(diff.removed).toEqual([]);
    expect(diff.modified).toEqual([]);
  });

  test('the temp file used for the atomic rename does not survive the write', () => {
    // A .tmp left behind is a real defect: it is a second file the server wrote, it accumulates
    // one per process, and the diff above would have caught it — this names it so a failure
    // reads as "the rename did not happen" rather than "some extra file appeared".
    const strays = fs.readdirSync(cacheDir).filter((n) => n.includes('.tmp'));
    expect(strays).toEqual([]);
  });
});

// ── The barrier, proven against the barrier's own walk ────────────────────────────────────
//
// A detector nobody has seen fail is a detector nobody has seen. These run snapshotTree over
// the SAME fixture tree the test above walks, perform a real write between the two snapshots,
// and require the diff to name it. Every mutation is the shape a defect would take: a cache
// file appearing where it should not, an existing transcript rewritten, a file removed.
describe('MUTATION GATE: the barrier detects a write, and says which one', () => {
  const { claudeRoot, projectsRoot } = buildFleetFixture();
  const roots = [projectsRoot, claudeRoot];

  test('an added file outside a cache directory is reported', () => {
    const before = snapshotTree(roots);
    expect(before.size).toBeGreaterThan(8); // non-vacuity: the walk found the fixture
    const stray = path.join(projectsRoot, 'alpha', 'index-cache.json');
    fs.writeFileSync(stray, '{"v":1}\n');
    try {
      const diff = diffTrees(before, snapshotTree(roots));
      expect(diff.added).toEqual([stray]);
      expect(diff.removed).toEqual([]);
      expect(diff.modified).toEqual([]);
    } finally {
      fs.rmSync(stray, { force: true });
    }
  });

  test('a modified file is reported even when its length is unchanged', () => {
    // Same size, so a size-only comparison would miss it. The barrier hashes content for
    // exactly this reason — it must not inherit the weakness of the key it is checking.
    const dir = path.join(claudeRoot, fs.readdirSync(claudeRoot)[0]!);
    const file = path.join(dir, fs.readdirSync(dir)[0]!);
    const original = fs.readFileSync(file);
    const before = snapshotTree(roots);
    expect(before.has(file)).toBe(true); // non-vacuity: the walk reached the file being mutated

    const mutated = Buffer.from(original.toString('utf8').replace('"output_tokens":120', '"output_tokens":999'));
    expect(mutated.length).toBe(original.length); // the mutation really is length-preserving
    expect(mutated.equals(original)).toBe(false); // ...and really is a mutation
    fs.writeFileSync(file, mutated);
    try {
      const diff = diffTrees(before, snapshotTree(roots));
      expect(diff.modified).toEqual([file]);
      expect(diff.added).toEqual([]);
      expect(diff.removed).toEqual([]);
    } finally {
      fs.writeFileSync(file, original);
    }
  });

  test('a removed file is reported', () => {
    const dir = path.join(claudeRoot, fs.readdirSync(claudeRoot)[1]!);
    const file = path.join(dir, fs.readdirSync(dir)[0]!);
    const original = fs.readFileSync(file);
    const before = snapshotTree(roots);
    expect(before.has(file)).toBe(true);

    fs.rmSync(file);
    try {
      const diff = diffTrees(before, snapshotTree(roots));
      expect(diff.removed).toEqual([file]);
      expect(diff.added).toEqual([]);
      expect(diff.modified).toEqual([]);
    } finally {
      fs.writeFileSync(file, original);
    }
  });

  test('an unchanged tree produces an empty diff — the barrier is not reporting everything', () => {
    // The inverse of the three above. A diffTrees that returned every path would pass all of
    // them and be useless; this is what makes the green meaningful.
    const before = snapshotTree(roots);
    expect(before.size).toBeGreaterThan(8);
    expect(diffTrees(before, snapshotTree(roots))).toEqual({ added: [], removed: [], modified: [] });
  });
});
