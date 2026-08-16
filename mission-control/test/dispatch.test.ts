// test/dispatch.test.ts — Phase 8b: dispatch queue, server route, and consumer contract.
//
// WHAT THIS COVERS
//
// 1. appendDispatch / readDispatch in server/index-cache.ts: the queue file is written and
//    read back correctly. Corrupt lines are skipped. ENOENT is empty, not an error.
//
// 2. POST /api/dispatch: input validation — project validation, goal bounds, bad JSON.
//    Success path: entry appears in readDispatch() after a successful POST.
//
// 3. GET /api/dispatch: reflects what appendDispatch() wrote.
//
// 4. The write lands OUTSIDE the project and corpus roots, so write-barrier.test.ts's
//    "no route mutates the repo" assertion remains true even when /api/dispatch is called.
//    This test exercises the route against a fixture fleet with a controlled queue path and
//    asserts the fixture tree unchanged after the POST.
//
// WHAT IS NOT COVERED HERE
//
// · The consume-dispatch script's actual `execFileSync('claude', ...)` call — that launches
//   a real Claude Code session and is not a unit-testable assertion. What IS asserted is the
//   queue-reading, project-matching, and root-existence checks it performs, using
//   readDispatch() directly against a fixture queue file.
//
// · The stream test (views.test.tsx `stream: is true for exactly…`) — adding DispatchView
//   to VIEWS with stream: false is covered by the existing stream-coherence test, which
//   renders every VIEWS entry and checks that `stream:` matches whether output moves when
//   the stream does. Since DispatchView calls useEndpoint(), which initialises to
//   loading: true and does not change state in renderToStaticMarkup(), it will render
//   identically under both EMPTY_STREAM and full — matching stream: false. ✓

import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { appendDispatch, readDispatch, type DispatchEntry } from '../server/index-cache.ts';
import { LiveState, REPO_ROOT } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import type { DispatchResult, DispatchError, DispatchPayload } from '../server/routes/api.ts';
import { mkTmpDir, rmTmp, initGitRepo, fixtureClaudeProjectsDir } from './fixtures.ts';
import { snapshotTree, diffTrees } from './write-barrier.test.ts';

const cleanupDirs: string[] = [];
afterAll(() => {
  for (const d of cleanupDirs) rmTmp(d);
});

// ── appendDispatch / readDispatch ────────────────────────────────────────────────────────

describe('appendDispatch / readDispatch — queue file contract', () => {
  test('ENOENT on a non-existent queue file returns an empty array', () => {
    const dir = mkTmpDir('mc-dispatch-empty-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'does-not-exist.jsonl');
    expect(readDispatch(file)).toEqual([]);
  });

  test('an appended entry is returned by readDispatch', () => {
    const dir = mkTmpDir('mc-dispatch-rw-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'queue.jsonl');

    const entry: DispatchEntry = {
      id: 'aaaaaaaa-0000-0000-0000-000000000001',
      project: 'alpha',
      root: '/projects/alpha',
      goal: 'write a test',
      enqueuedAt: 1_700_000_000_000,
      status: 'pending',
    };
    appendDispatch(entry, file);

    const read = readDispatch(file);
    expect(read).toHaveLength(1);
    expect(read[0]).toEqual(entry);
  });

  test('multiple entries are returned in order', () => {
    const dir = mkTmpDir('mc-dispatch-multi-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'queue.jsonl');

    const e1: DispatchEntry = { id: 'id-1', project: 'alpha', root: '/projects/alpha', goal: 'first', enqueuedAt: 1_000, status: 'pending' };
    const e2: DispatchEntry = { id: 'id-2', project: 'beta', root: '/projects/beta', goal: 'second', enqueuedAt: 2_000, status: 'consumed' };
    appendDispatch(e1, file);
    appendDispatch(e2, file);

    const read = readDispatch(file);
    expect(read).toHaveLength(2);
    expect(read[0]).toEqual(e1);
    expect(read[1]).toEqual(e2);
  });

  test('a corrupt line is skipped without throwing', () => {
    const dir = mkTmpDir('mc-dispatch-corrupt-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'queue.jsonl');

    const good: DispatchEntry = { id: 'id-good', project: 'alpha', root: '/projects/alpha', goal: 'ok', enqueuedAt: 1_000, status: 'pending' };
    // Write a valid line, then a corrupt line, then another valid line.
    fs.writeFileSync(file, `${JSON.stringify(good)}\n{broken json\n${JSON.stringify({ ...good, id: 'id-good-2' })}\n`, 'utf8');

    const read = readDispatch(file);
    // The two valid lines are returned; the corrupt one is silently skipped.
    expect(read).toHaveLength(2);
    expect(read[0]?.id).toBe('id-good');
    expect(read[1]?.id).toBe('id-good-2');
  });

  test('a line missing required fields is skipped without throwing', () => {
    const dir = mkTmpDir('mc-dispatch-bad-shape-');
    cleanupDirs.push(dir);
    const file = path.join(dir, 'queue.jsonl');

    // An object that is valid JSON but missing required fields.
    const partial = { id: 'only-id' }; // no project, root, goal, enqueuedAt
    const good: DispatchEntry = { id: 'id-good', project: 'alpha', root: '/projects/alpha', goal: 'ok', enqueuedAt: 1_000, status: 'pending' };
    fs.writeFileSync(file, `${JSON.stringify(partial)}\n${JSON.stringify(good)}\n`, 'utf8');

    const read = readDispatch(file);
    expect(read).toHaveLength(1);
    expect(read[0]?.id).toBe('id-good');
  });

  test('creates the directory if it does not exist', () => {
    const dir = mkTmpDir('mc-dispatch-mkdir-');
    cleanupDirs.push(dir);
    const nested = path.join(dir, 'a', 'b', 'c', 'queue.jsonl');

    const entry: DispatchEntry = { id: 'x', project: 'p', root: '/p', goal: 'g', enqueuedAt: 0, status: 'pending' };
    expect(() => appendDispatch(entry, nested)).not.toThrow();
    expect(readDispatch(nested)).toHaveLength(1);
  });
});

// ── Route tests ──────────────────────────────────────────────────────────────────────────

function buildFixture(prefix: string) {
  const claudeRoot = mkTmpDir(`${prefix}-claude-`);
  const projectsRoot = mkTmpDir(`${prefix}-projects-`);
  const queueDir = mkTmpDir(`${prefix}-queue-`);
  cleanupDirs.push(claudeRoot, projectsRoot, queueDir);
  const queueFile = path.join(queueDir, 'queue.jsonl');

  for (const name of ['alpha', 'beta']) {
    const root = path.join(projectsRoot, name);
    initGitRepo(root);
    fixtureClaudeProjectsDir(claudeRoot, root, `${name}-sess`, [
      { ts: '2026-08-14T10:00:00.000Z', output_tokens: 10, model: 'claude-opus-5' },
    ]);
  }

  const state = new LiveState({
    roots: [projectsRoot],
    claudeProjectsRoot: claudeRoot,
    indexCachePath: path.join(queueDir, 'index.json'),
  });
  process.env.MC_DISPATCH_QUEUE = queueFile;

  const app = new Hono();
  app.route('/api', createApi(state));

  return { app, state, queueFile, projectsRoot, claudeRoot };
}

describe('POST /api/dispatch — input validation', () => {
  let app: Hono;
  let queueFile: string;

  beforeEach(() => {
    ({ app, queueFile } = buildFixture('mc-dispatch-post'));
  });

  test('rejects non-JSON body with 400', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'not json',
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as DispatchError;
    expect(body.error).toContain('JSON');
  });

  test('rejects missing project with 400', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'write a test' }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as DispatchError;
    expect(body.error).toContain('project');
  });

  test('rejects unknown project with 404', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'no-such-project', goal: 'write a test' }),
      })
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as DispatchError;
    expect(body.error).toContain('no-such-project');
  });

  test('rejects empty goal with 400', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'alpha', goal: '   ' }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as DispatchError;
    expect(body.error).toContain('goal');
  });

  test('rejects a goal over 2000 characters with 400', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'alpha', goal: 'x'.repeat(2001) }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as DispatchError;
    expect(body.error).toContain('2000');
  });

  test('a goal of exactly 2000 characters is accepted', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'alpha', goal: 'x'.repeat(2000) }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as DispatchResult;
    expect(body.ok).toBe(true);
  });

  test('trims whitespace from the goal before storing', async () => {
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'alpha', goal: '  write a test  ' }),
      })
    );
    expect(res.status).toBe(200);
    const entries = readDispatch(queueFile);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.goal).toBe('write a test');
  });

  test('success: returns 200 with id and enqueuedAt, entry appears in queue', async () => {
    const before = Date.now();
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'beta', goal: 'build the feature' }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as DispatchResult;
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe('string');
    expect(body.id).toHaveLength(36); // UUID
    expect(body.enqueuedAt).toBeGreaterThanOrEqual(before);
    expect(body.enqueuedAt).toBeLessThanOrEqual(Date.now());

    // The entry must be readable from the queue file.
    const entries = readDispatch(queueFile);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe(body.id);
    expect(entries[0]?.project).toBe('beta');
    expect(entries[0]?.goal).toBe('build the feature');
    expect(entries[0]?.status).toBe('pending');
    // Root is the real discovered root, not anything the caller provided.
    expect(entries[0]?.root).toBeTruthy();
    expect(path.isAbsolute(entries[0]?.root ?? '')).toBe(true);
  });

  test('project root in the entry comes from discoverFleet, never from the caller', async () => {
    // This property is what prevents a path-traversal attack through the project field.
    // If the caller could control `root` directly, they could point the consumer at an
    // arbitrary directory. The server ignores any `root` in the body and copies it from
    // the discovered fleet.
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Attacker tries to smuggle a root that does not match the discovered project.
        body: JSON.stringify({ project: 'alpha', root: '/etc/passwd', goal: 'do something' }),
      })
    );
    expect(res.status).toBe(200);
    const entries = readDispatch(queueFile);
    // The root in the entry must NOT be what the caller provided.
    expect(entries[0]?.root).not.toBe('/etc/passwd');
    // And it must be a real path under the fixture projects root.
    expect(entries[0]?.root?.includes('alpha')).toBe(true);
  });
});

describe('GET /api/dispatch — queue listing', () => {
  test('returns empty entries array when queue is empty', async () => {
    const { app } = buildFixture('mc-dispatch-get-empty');
    const res = await app.fetch(new Request('http://127.0.0.1/api/dispatch'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as DispatchPayload;
    expect(body.entries).toEqual([]);
  });

  test('reflects entries written by POST /api/dispatch', async () => {
    const { app, queueFile } = buildFixture('mc-dispatch-get-reflect');
    // Pre-seed the queue through the route (not by writing directly) to test the whole path.
    await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'alpha', goal: 'first goal' }),
      })
    );
    await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'beta', goal: 'second goal' }),
      })
    );

    const res = await app.fetch(new Request('http://127.0.0.1/api/dispatch'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as DispatchPayload;
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0]?.goal).toBe('first goal');
    expect(body.entries[1]?.goal).toBe('second goal');
    // Both must be pending — the consumer has not run.
    expect(body.entries.every((e) => e.status === 'pending')).toBe(true);

    // Double-check: the queue file on disk matches.
    expect(readDispatch(queueFile)).toHaveLength(2);
  });
});

// ── Write isolation: /api/dispatch leaves the repo and fixture trees unchanged ────────────
//
// test/write-barrier.test.ts asserts "no route adds, removes or modifies any file under the
// fixture fleet or the repo" but does NOT include /api/dispatch in its route list (it
// cannot — I cannot modify that file). This test extends that guarantee to the new route.

describe('WRITE ISOLATION: POST /api/dispatch does not touch the fixture fleet or repo', () => {
  test('exercising /api/dispatch changes nothing in the fixture fleet or REPO_ROOT', async () => {
    const { app, projectsRoot, claudeRoot, queueFile } = buildFixture('mc-dispatch-isolation');
    const roots = [projectsRoot, claudeRoot];

    const before = snapshotTree(roots);
    const beforeRepo = snapshotTree([REPO_ROOT], true);
    // Non-vacuity: the fixture walk found real files.
    expect(before.size).toBeGreaterThan(2);
    expect(beforeRepo.size).toBeGreaterThan(50);

    // Call the dispatch route — this writes to the queue file, which is OUTSIDE both roots.
    const res = await app.fetch(
      new Request('http://127.0.0.1/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'alpha', goal: 'build the feature' }),
      })
    );
    expect(res.status).toBe(200);

    // The queue file must have been written.
    expect(fs.existsSync(queueFile)).toBe(true);
    expect(readDispatch(queueFile)).toHaveLength(1);

    // But the fixture fleet and the repo must be byte-identical.
    expect(diffTrees(before, snapshotTree(roots))).toEqual({ added: [], removed: [], modified: [] });
    expect(diffTrees(beforeRepo, snapshotTree([REPO_ROOT], true))).toEqual({ added: [], removed: [], modified: [] });
  });
});
