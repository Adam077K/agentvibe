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
import {
  appendDispatch,
  readDispatch,
  resolveDispatchStates,
  classifyDispatches,
  deriveGateReachability,
  GATE_OUTCOMES,
  type GateOutcome,
  KNOWN_DISPATCH_STATUSES,
  classifyVerdictProduction,
  VERDICT_PRODUCTION_STATES,
  PRODUCER_SPAWN_LIMITS,
  type DispatchEntry,
  type ProducerRun,
} from '../server/index-cache.ts';
// THE PRODUCER'S OWN TABLES, imported so a rename there goes red HERE. Importing the module
// does not run it: its entry point is guarded on `process.argv[1]` being the script itself.
import { OUTCOME as REAL_OUTCOME, EXIT as REAL_EXIT } from '../../scripts/produce-verdict.mjs';
import { execFileSync } from 'node:child_process';
import { LiveState, REPO_ROOT } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import type { DispatchResult, DispatchError, DispatchPayload } from '../server/routes/api.ts';
import { mkTmpDir, rmTmp, initGitRepo, fixtureClaudeProjectsDir } from './fixtures.ts';
import { snapshotTree, diffTrees } from './write-barrier.test.ts';

/**
 * Make a fixture root look like a harness-installed project, because a dispatch target IS one.
 *
 * WHY THE OLD FIXTURES WERE WRONG AND STILL PASSED. They created an empty directory and called it a
 * project root. The consumer only ever did `existsSync(root)` with it, so nothing noticed — until
 * routing began reading the project's playbooks and agent declaration out of that root, at which
 * point four tests failed and one PASSED FOR THE WRONG REASON: the `no claude on PATH is
 * not-started` test got `not-started` from the missing playbook, never reaching the spawn it exists
 * to test. A fixture that omits what the subject reads does not test the subject.
 */
function installHarness(
  root: string,
  opts: { playbooks?: string[]; tools?: string; spelling?: 'flow' | 'block'; rawTools?: string; maxTurns?: number | null } = {},
): void {
  const agents = path.join(root, '.claude', 'agents');
  const playbooks = path.join(root, '.claude', 'playbooks');
  fs.mkdirSync(agents, { recursive: true });
  fs.mkdirSync(playbooks, { recursive: true });
  const flow = opts.tools ?? '[Read, Write, Edit, Bash, Glob, Grep, Task]';
  // F2. THE FIXTURE AND THE PARSER SHARED ONE ASSUMPTION, WHICH IS WHY NEITHER CAUGHT IT. Every
  // entry in the old table was flow-form, so a parser reading only flow form passed every test.
  // `spelling: 'block'` renders the SAME list as YAML's other legal sequence form; `rawTools`
  // writes an arbitrary value for the refusal cases.
  const tools = opts.rawTools ?? (opts.spelling === 'block'
    ? '\n' + flow.replace(/^\[|\]$/g, '').split(',').map((t) => `  - ${t.trim()}`).join('\n')
    : flow);
  // The body deliberately mentions the gate tool in PROSE, exactly as all 7 real engine files do.
  // A derivation that greps the file rather than the `tools:` line reports this agent as
  // gate-capable, so every fixture built by this helper carries that trap.
  // `maxTurns` IS PART OF A FAITHFUL FIXTURE. Every real engine file declares one, and routing
  // through `--agent` makes it bind — a fixture omitting it cannot exercise the field the record
  // now carries, which is the same "fixture omits what the subject reads" defect as the empty root.
  const maxTurns = opts.maxTurns === null ? '' : `maxTurns: ${opts.maxTurns ?? 30}\n`;
  fs.writeFileSync(
    path.join(agents, 'orchestrator.md'),
    `---\nname: orchestrator\ntools: ${tools}\n${maxTurns}---\nThe Workflow tool is how qa.js is invoked.\n`,
  );
  for (const name of opts.playbooks ?? ['ship-feature.yml']) {
    fs.writeFileSync(path.join(playbooks, name), 'name: fixture\nstages: []\n');
  }
}

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


// ── The consumer records WHAT HAPPENED, not merely THAT it acted ──────────────────────────
//
// THE DEFECT THESE TESTS PIN, quoted exactly as it stood in consume-dispatch.ts:
//
//     const updated: DispatchEntry = { ...entry, status: ok ? 'consumed' : 'consumed' };
//
// A launch that exited non-zero produced a durable record byte-identical to one that succeeded.
// The failure was printed once to a console nobody reads; the queue — the only record that
// persists — said success either way. Measured against a fake `claude` exiting 3 before the fix:
// both records were `"status":"consumed"`, differing in nothing but id and goal.
//
// WHY THESE SPAWN A REAL PROCESS. The header above says the `execFileSync('claude', …)` call is
// "not a unit-testable assertion" and that was true while `claude` meant the real binary. It is a
// PATH lookup, so a fixture `claude` that exits 0, exits 3, or kills itself makes all three
// outcomes reachable without an API call, in about a second. The thing under test is precisely
// the mapping from a launch's exit to a durable record, and no test that stubs the launch can
// assert it — the earlier note was reasoning about cost, not about testability.
//
// EACH ASSERTION IS PAIRED WITH THE OUTCOME IT MUST NOT EQUAL. `status === 'failed'` alone would
// pass against a build that wrote `'failed'` unconditionally; asserting it DIFFERS from the
// success record is what makes the pair evidence.

const CONSUMER = path.join(REPO_ROOT, 'mission-control', 'scripts', 'consume-dispatch.ts');

/** A fixture `claude` on PATH, and a queue file: the whole harness. */
function dispatchFixture(prefix: string, script: string, entries: Partial<DispatchEntry>[]) {
  const dir = mkTmpDir(prefix);
  cleanupDirs.push(dir);
  const bin = path.join(dir, 'bin');
  const root = path.join(dir, 'root');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(root, { recursive: true });
  installHarness(root);
  fs.writeFileSync(path.join(bin, 'claude'), script);
  fs.chmodSync(path.join(bin, 'claude'), 0o755);

  const queue = path.join(dir, 'queue.jsonl');
  const lines = entries.map((e) => JSON.stringify({
    id: 'fixture-id', project: path.basename(REPO_ROOT), root, goal: 'a goal', enqueuedAt: 1_000,
    status: 'pending', ...e,
  }));
  fs.writeFileSync(queue, lines.join('\n') + '\n');
  return { dir, bin, queue, root };
}

/** Run the consumer against a fixture and return the LAST line of the queue. */
function runConsumer(f: { bin: string; queue: string }): DispatchEntry {
  execFileSync('bun', [CONSUMER], {
    env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const entries = readDispatch(f.queue);
  return entries[entries.length - 1] as DispatchEntry;
}

const CLAUDE_OK = '#!/bin/sh\nexit 0\n';
const CLAUDE_FAILS = '#!/bin/sh\necho boom >&2\nexit 3\n';
const CLAUDE_SIGNALLED = '#!/bin/sh\nkill -TERM $$\n';

describe('consume-dispatch records a distinguishable outcome', () => {
  test('a launch that exits 0 is `exited-clean`, and a launch that exits 3 is NOT', () => {
    const ok = runConsumer(dispatchFixture('mc-dispatch-ok-', CLAUDE_OK, [{}]));
    const bad = runConsumer(dispatchFixture('mc-dispatch-bad-', CLAUDE_FAILS, [{}]));

    expect(ok.status).toBe('exited-clean');
    expect(bad.status).toBe('failed');
    expect(bad.exitCode).toBe(3);

    // THE PAIR THAT IS THE POINT. Before the fix these two objects differed in nothing.
    const shape = (e: DispatchEntry) => JSON.stringify({ status: e.status, exitCode: e.exitCode, signal: e.signal });
    expect(shape(bad)).not.toBe(shape(ok));
  });

  test('a launch killed by a signal is `no-result`, distinct from BOTH success and failure', () => {
    const sig = runConsumer(dispatchFixture('mc-dispatch-sig-', CLAUDE_SIGNALLED, [{}]));
    expect(sig.status).toBe('no-result');
    expect(sig.signal).toBe('SIGTERM');
    // Not folded into `failed`: a program taken away mid-flight reported nothing, and a program
    // that exited 3 reported something. `exitCode` must be ABSENT rather than 0 — writing 0 here
    // would recreate the defect one field along.
    expect(sig.exitCode).toBeUndefined();
  });

  test('`running` is durable BEFORE the launch, so a consumer that dies leaves evidence', () => {
    const f = dispatchFixture('mc-dispatch-running-', CLAUDE_OK, [{}]);
    runConsumer(f);
    const all = readDispatch(f.queue);
    const statuses = all.map((e) => e.status);
    // THE THESIS IS UNCHANGED: `running` is written BEFORE the launch, so a consumer that dies
    // mid-flight leaves evidence it started. What changed is that the terminal state is now written
    // TWICE \u2014 once before the verdict step and once with it \u2014 so an exact-sequence assertion would
    // pin an incidental line count instead. Each clause below names what it is for.
    expect(statuses[0]).toBe('pending');
    expect(statuses[1]).toBe('running');
    expect(statuses.at(-1)).toBe('exited-clean');
    expect(statuses.filter((x) => x === 'running').length).toBe(1);
    // AND THE DOUBLE WRITE IS THE F3 FIX, ASSERTED HERE RATHER THAN ASSUMED: the first terminal
    // line is durable before the panel window and carries no verdict; the last one carries it.
    const terminal = all.filter((e) => e.status === 'exited-clean');
    expect(terminal.length).toBe(2);
    expect(terminal[0]?.verdictProduction).toBeUndefined();
    expect(terminal[1]?.verdictProduction).toBeDefined();
  });

  test('an entry left `running` resolves to `no-result` and is NOT relaunched', () => {
    // THE FIXTURE ADMITS THE INPUT THAT WOULD DEFEAT THE FIX: `claude` here EXITS 0. If the
    // consumer relaunched a `running` entry it would record `consumed` and this test would pass
    // for the wrong reason — so the launch-count assertion below is what carries it.
    const f = dispatchFixture('mc-dispatch-crashed-', CLAUDE_OK, [
      { status: 'pending' },
      // No consumerPid at all — the pre-N1 shape, and recent so age is not the cause either.
      { status: 'running', startedAt: Date.now() },
    ]);
    const last = runConsumer(f);
    expect(last.status).toBe('no-result');

    // Exactly one line was appended — the verdict. No `running` line, so no second launch.
    const statuses = readDispatch(f.queue).map((e) => e.status);
    expect(statuses).toEqual(['pending', 'running', 'no-result']);
  });

  test('a finished dispatch is NOT relaunched on a later run — the re-dispatch bug', () => {
    // Before the fix the consumer filtered RAW lines by `status === 'pending'`. The original
    // pending line is never removed by an append-only queue, so every run relaunched every goal
    // ever dispatched. Measured: a second run appended a third `consumed` line.
    const f = dispatchFixture('mc-dispatch-rerun-', CLAUDE_OK, [{}]);
    runConsumer(f);
    const afterFirst = readDispatch(f.queue).length;
    runConsumer(f);
    expect(readDispatch(f.queue).length).toBe(afterFirst);
  });
});

describe('resolveDispatchStates / classifyDispatches', () => {
  const line = (id: string, status: DispatchEntry['status']): DispatchEntry => ({
    id, project: 'p', root: '/p', goal: 'g', enqueuedAt: 1, status,
  });

  test('the current state of a dispatch is its LAST line', () => {
    const resolved = resolveDispatchStates([line('a', 'pending'), line('a', 'running'), line('a', 'failed')]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.status).toBe('failed');
  });

  test('order is first-seen, not last-changed', () => {
    const resolved = resolveDispatchStates([line('a', 'pending'), line('b', 'pending'), line('a', 'consumed')]);
    expect(resolved.map((e) => e.id)).toEqual(['a', 'b']);
  });

  test('only `pending` is launchable and only `running` is reconcilable', () => {
    const entries = [line('done', 'consumed'), line('bad', 'failed'), line('gone', 'no-result'),
                     line('none', 'not-started'), line('wait', 'pending'), line('mid', 'running')];
    const work = classifyDispatches(entries);
    expect(work.launchable.map((e) => e.id)).toEqual(['wait']);
    expect(work.reconcilable.map((e) => e.id)).toEqual(['mid']);
    expect(work.settled.map((e) => e.id)).toEqual(['done', 'bad', 'gone', 'none']);
    expect(work.unrecognised).toEqual([]);
  });

  test('a dispatch that reached a terminal state is not launchable, though its first line is pending', () => {
    expect(classifyDispatches([line('a', 'pending'), line('a', 'consumed')]).launchable).toEqual([]);
  });

  // ── THE ALLOW-LIST, AND THE FOUR INPUTS THAT DEFEATED THE DENY-LIST ────────────────────────
  //
  // The first cut of this change selected work with `!TERMINAL_DISPATCH_STATUSES.includes(status)`.
  // That is a DENY-LIST: every value it did not recognise fell through to "launch it". Measured on
  // that build with a `claude` that logged its own argv, all four rows below were LAUNCHED and then
  // OVERWRITTEN with `consumed` — destroying whatever the previous status said.
  //
  // `readDispatch()` does not validate `status` (deliberately — forward-compatibility with a newer
  // writer), so nothing upstream stops any of these reaching the consumer.
  const UNRECOGNISED: [string, unknown][] = [
    ['a status from a newer consumer', 'timed-out'],
    ['no status field at all', undefined],
    ['a numeric status', 7],
    ['a null status', null],
  ];

  for (const [what, status] of UNRECOGNISED) {
    test(`${what} is NOT launchable, NOT reconcilable, and NOT settled`, () => {
      const e = { ...line('x', 'pending'), status } as unknown as DispatchEntry;
      const work = classifyDispatches([e]);
      expect(work.unrecognised.map((x) => x.id)).toEqual(['x']);
      expect(work.launchable).toEqual([]);
      expect(work.reconcilable).toEqual([]);
      expect(work.settled).toEqual([]);
    });
  }

  test('the two CONTROLS still classify — an allow-list that admits nothing proves nothing', () => {
    expect(classifyDispatches([line('p', 'pending')]).launchable.map((e) => e.id)).toEqual(['p']);
    expect(classifyDispatches([line('c', 'consumed')]).settled.map((e) => e.id)).toEqual(['c']);
  });
});

describe('an unrecognised status is neither launched nor overwritten — END TO END', () => {
  // The p1 this reproduces, in the only terms that matter: does the goal RUN, and does the record
  // SURVIVE. Both are observed rather than inferred — the fixture `claude` appends its argv to a
  // file, so "not launched" is a measured absence with a control that fires beside it.
  function launchLoggingFixture(prefix: string, status: unknown) {
    const dir = mkTmpDir(prefix);
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(root, { recursive: true });
    const log = path.join(dir, 'launches.txt');
    // ARGV GOES TO ITS OWN FILE, NUL-SEPARATED, AND THE COUNTER GETS ONE LINE PER LAUNCH. The
    // routed prompt CONTAINS NEWLINES, so the old `echo "LAUNCHED $@"` wrote many lines for one
    // launch and the line-counting `launches()` below would have reported a single launch as
    // several — an instrument broken by the subject it measures.
    const argv = path.join(dir, 'argv.bin');
    fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nprintf '%s\\0' "$@" >> ${argv}\necho LAUNCHED >> ${log}\nexit 0\n`);
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    installHarness(root);
    const queue = path.join(dir, 'queue.jsonl');
    const entry: Record<string, unknown> = {
      id: 'target', project: path.basename(REPO_ROOT), root, goal: 'a goal', enqueuedAt: 1_000,
    };
    if (status !== undefined) entry.status = status;
    fs.writeFileSync(queue, JSON.stringify(entry) + '\n');
    return { bin, queue, log, root, argv: path.join(dir, 'argv.bin') };
  }

  const launches = (log: string) => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).length : 0);

  for (const [what, status] of [
    ['a status from a newer consumer', 'timed-out'],
    ['no status field at all', undefined],
    ['a numeric status', 7],
    ['a null status', null],
  ] as [string, unknown][]) {
    test(`${what}: the goal does not run and the record is left exactly as found`, () => {
      const f = launchLoggingFixture('mc-dispatch-unk-', status);
      const before = fs.readFileSync(f.queue, 'utf8');
      execFileSync('bun', [CONSUMER], {
        env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
        encoding: 'utf8', stdio: 'pipe',
      });
      expect(launches(f.log)).toBe(0);
      // NOT OVERWRITTEN. The old build appended `consumed`, destroying the original status.
      expect(fs.readFileSync(f.queue, 'utf8')).toBe(before);
    });
  }

  test('CONTROL: a `pending` entry in the same harness DOES run and IS recorded', () => {
    // Without this the four absences above are worthless — an absence is byte-identical whether
    // the harness works or does nothing at all.
    const f = launchLoggingFixture('mc-dispatch-unk-control-', 'pending');
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(launches(f.log)).toBe(1);
    const entries = readDispatch(f.queue);
    expect(entries[entries.length - 1]?.status).toBe('exited-clean');
  });
});

describe('a launch that never started is not a launch that returned nothing', () => {
  test('no `claude` on PATH is `not-started`, not `no-result`', () => {
    const dir = mkTmpDir('mc-dispatch-nopath-');
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'empty-bin');   // deliberately contains no `claude`
    const root = path.join(dir, 'root');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(root, { recursive: true });
    // THE HARNESS IS REQUIRED HERE OR THIS TEST PASSES FOR THE WRONG REASON, and it did: without a
    // playbooks directory the consumer refuses before spawning and records `not-started` — the very
    // status asserted below — and `readdir`'s own failure message CONTAINS the string 'ENOENT', so
    // even the error assertion held. The test would have gone green while never reaching the spawn
    // it exists to test. The `notStartedFrom` assertion below is what keeps the two apart.
    installHarness(root);
    const queue = path.join(dir, 'queue.jsonl');
    fs.writeFileSync(queue, JSON.stringify({
      id: 'nopath', project: path.basename(REPO_ROOT), root, goal: 'g', enqueuedAt: 1_000, status: 'pending',
    }) + '\n');

    // PATH IS REPLACED, NOT PREPENDED — the point is that `claude` is absent everywhere, which
    // prepending cannot achieve. It must still contain the runtime running this test, so it is
    // `bin` plus bun's own directory and nothing else.
    const runtimeDir = path.dirname(process.execPath);
    const isolatedPath = `${bin}:${runtimeDir}`;

    // THE ABSENCE IS ASSERTED, NOT ASSUMED. If `claude` happened to live beside bun, this test
    // would launch it for real and still pass for the wrong reason.
    for (const d of isolatedPath.split(':')) {
      expect(fs.existsSync(path.join(d, 'claude'))).toBe(false);
    }

    execFileSync(process.execPath, [CONSUMER], {
      env: { ...process.env, PATH: isolatedPath, MC_DISPATCH_QUEUE: queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    const entries = readDispatch(queue);
    const last = entries[entries.length - 1] as DispatchEntry;
    expect(last.status).toBe('not-started');
    expect(last.status).not.toBe('no-result');
    expect(last.error).toContain('ENOENT');
    // DISCRIMINATES THE TWO WAYS TO REACH `not-started`. The spawn failed; the routing did not
    // refuse. Both produce `not-started` and both carry 'ENOENT', so status and message alone
    // cannot tell them apart.
    expect(last.error).not.toContain('no playbook to route through');
    // AND THE LAUNCH WAS ACTUALLY ATTEMPTED: a refusal never writes a `running` line.
    expect(entries.some((e) => e.status === 'running')).toBe(true);
  });
});

describe('a `running` entry whose launcher is ALIVE is left alone', () => {
  test('a live consumerPid means in-flight, not no-result', () => {
    const f = dispatchFixture('mc-dispatch-inflight-', CLAUDE_OK, [
      { status: 'pending' },
      // process.pid of the TEST is alive by construction — the strongest available liveness case.
      // `startedAt` MUST BE RECENT: it was `1_500` (i.e. 1970) and the age bound added for N1
      // correctly settled it, turning this test red. The fixture was asserting liveness while
      // supplying an entry 56 years old — a detail that meant nothing until age became evidence.
      { status: 'running', startedAt: Date.now(), consumerPid: process.pid },
    ]);
    const out = execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(out).toContain('IN FLIGHT');
    // Nothing appended: not relaunched, and NOT declared no-result while it is still running.
    expect(readDispatch(f.queue).map((e) => e.status)).toEqual(['pending', 'running']);
  });

  // ── `0` AND `-1` ARE NOT PIDS, AND ADMITTING THEM WAS A DENIAL PRIMITIVE ──────────────────
  //
  // POSIX gives kill() `0` for "my process group" and `-1` for "every process I may signal".
  // Neither ever raises ESRCH, so a liveness check that passes them to process.kill answers `true`
  // forever. Measured on the build these tests were added to: three consecutive runs each left the
  // entry `running`, never launched and never terminal, while the control resolved on run one. One
  // appended line `{"id": <existing>, "status": "running", "consumerPid": 0}` made a goal
  // permanently unrunnable while the UI showed the most innocuous state it has — and the only
  // remedy was hand-editing the queue.
  for (const [what, pid] of [['0, the caller\'s process group', 0], ['-1, the POSIX broadcast target', -1]] as [string, number][]) {
    test(`consumerPid ${what} is rejected as a pid, and the dispatch is settled`, () => {
      const f = dispatchFixture(`mc-dispatch-pid${pid}-`, CLAUDE_OK, [
        { status: 'pending' },
        { status: 'running', startedAt: Date.now(), consumerPid: pid },
      ]);
      execFileSync('bun', [CONSUMER], {
        env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
        encoding: 'utf8', stdio: 'pipe',
      });
      const entries = readDispatch(f.queue);
      expect(entries[entries.length - 1]?.status).toBe('no-result');
      // Not relaunched either: the entry is SETTLED, not retried.
      expect(entries.map((e) => e.status)).toEqual(['pending', 'running', 'no-result']);
    });
  }

  test('an ALIVE pid past the age bound is reconciled — liveness cannot bound pid reuse', () => {
    // pid 1 is launchd: always alive, and reached through the EPERM branch, so this is the
    // strongest available "alive" case. `startedAt` is 7h old against a 6h bound.
    const f = dispatchFixture('mc-dispatch-oldalive-', CLAUDE_OK, [
      { status: 'pending' },
      { status: 'running', startedAt: Date.now() - 7 * 60 * 60 * 1000, consumerPid: 1 },
    ]);
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    const entries = readDispatch(f.queue);
    expect(entries[entries.length - 1]?.status).toBe('no-result');
    expect(entries[entries.length - 1]?.error).toContain('bound');
  });

  test('CONTROL: the SAME alive pid INSIDE the age bound is still held', () => {
    // One field different from the test above. Without this, the age test could pass because pid 1
    // was never held at all, and the C3 property — do not settle a dispatch that is running — would
    // be silently gone.
    const f = dispatchFixture('mc-dispatch-freshalive-', CLAUDE_OK, [
      { status: 'pending' },
      { status: 'running', startedAt: Date.now(), consumerPid: 1 },
    ]);
    const out = execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(out).toContain('IN FLIGHT');
    expect(readDispatch(f.queue).map((e) => e.status)).toEqual(['pending', 'running']);
  });

  test('--force-reconcile settles a held entry — the in-tool remedy for a reused pid', () => {
    const f = dispatchFixture('mc-dispatch-force-', CLAUDE_OK, [
      { status: 'pending' },
      { status: 'running', startedAt: Date.now(), consumerPid: 1 },
    ]);
    execFileSync('bun', [CONSUMER, '--force-reconcile'], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    const entries = readDispatch(f.queue);
    expect(entries[entries.length - 1]?.status).toBe('no-result');
    expect(entries[entries.length - 1]?.error).toContain('--force-reconcile');
  });

  test('--dry-run says what the real run would do for a HELD entry', () => {
    // A dry run that misstates the real run is worse than no dry run. Both paths now ask the same
    // inFlight() function, so this pins that they cannot drift apart again.
    const f = dispatchFixture('mc-dispatch-dryheld-', CLAUDE_OK, [
      { status: 'pending' },
      { status: 'running', startedAt: Date.now(), consumerPid: 1 },
    ]);
    const out = execFileSync('bun', [CONSUMER, '--dry-run'], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(out).toContain('would LEAVE ALONE');
    expect(out).not.toContain('would run: claude');
    // A dry run writes nothing.
    expect(readDispatch(f.queue).map((e) => e.status)).toEqual(['pending', 'running']);
  });

  test('CONTROL: an unreachable pid IS declared no-result', () => {
    // Same harness, same shape, one field different — so the test above cannot pass by accident.
    const f = dispatchFixture('mc-dispatch-deadpid-', CLAUDE_OK, [
      { status: 'pending' },
      // Recent, so this settles because the PID IS UNREACHABLE and not because of the age bound.
      { status: 'running', startedAt: Date.now(), consumerPid: 2_147_483_646 },
    ]);
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(readDispatch(f.queue).map((e) => e.status)).toEqual(['pending', 'running', 'no-result']);
  });
});

// ── Routing, and the gate gap it does NOT close ──────────────────────────────────────────
//
// Two halves, and the second is the one that matters. Routing buys the orchestrator, the lens and
// the playbook. It does NOT buy the QA gate, because `qa.js` is invoked through a `Workflow` tool
// that no engine declares. The failure being closed is therefore not "not gated" — it is "looks
// gated, wasn't", which is strictly worse because the first is visible and the second is not.

describe('a dispatched goal is ROUTED through the orchestrator', () => {
  /** A fixture whose `claude` records its argv NUL-separated, so a multi-line prompt survives. */
  function routedFixture(prefix: string, harness: 'full' | 'no-playbooks' | 'none') {
    const dir = mkTmpDir(prefix);
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(root, { recursive: true });
    if (harness === 'full') installHarness(root, { playbooks: ['ship-feature.yml', 'design-pass.yml'] });
    if (harness === 'no-playbooks') installHarness(root, { playbooks: [] });
    const argv = path.join(dir, 'argv.bin');
    const log = path.join(dir, 'launches.txt');
    fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nprintf '%s\\0' "$@" >> ${argv}\necho LAUNCHED >> ${log}\nexit 0\n`);
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    const queue = path.join(dir, 'queue.jsonl');
    fs.writeFileSync(queue, JSON.stringify({
      id: 'routed', project: path.basename(REPO_ROOT), root, goal: 'THE-DISPATCHED-GOAL', enqueuedAt: 1_000, status: 'pending',
    }) + '\n');
    return { bin, queue, argv, log, root };
  }
  const run = (f: { bin: string; queue: string }) =>
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${f.bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: f.queue },
      encoding: 'utf8', stdio: 'pipe',
    });
  const argvOf = (file: string) =>
    fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\0').filter(Boolean) : [];
  const launched = (log: string) => fs.existsSync(log);

  test('the launch selects the orchestrator agent — and is NOT the bare `--print <goal>` form', () => {
    const f = routedFixture('mc-dispatch-routed-', 'full');
    run(f);
    const argv = argvOf(f.argv);
    expect(argv[0]).toBe('--agent');
    expect(argv[1]).toBe('orchestrator');
    expect(argv[2]).toBe('--print');
    // THE NEGATIVE, which the positives above cannot give: the superseded form put `--print` first
    // and the raw goal second. Asserting only "--agent is present" would still hold if a future
    // change appended the bare form as a fall-back beside it.
    expect(argv[0]).not.toBe('--print');
    expect(argv).not.toContain('THE-DISPATCHED-GOAL');   // the goal is EMBEDDED, never a bare argv
    expect(argv.length).toBe(4);
  });

  test('the prompt carries the goal and bounds the playbook choice to the project’s own', () => {
    const f = routedFixture('mc-dispatch-prompt-', 'full');
    run(f);
    const prompt = argvOf(f.argv)[3] ?? '';
    expect(prompt).toContain('THE-DISPATCHED-GOAL');
    expect(prompt).toContain('ship-feature.yml');
    expect(prompt).toContain('design-pass.yml');
    // NEGATIVE CONTROL: a playbook this project does not have must NOT be offered. Without this,
    // a prompt that listed every playbook name it could think of would satisfy the two above.
    expect(prompt).not.toContain('price-a-product.yml');
    // The session must be told the gate is out of reach, or it writes a qa_verdict in good faith.
    expect(prompt).toContain('NOT REACHABLE');
    expect(prompt).toContain('DO NOT record a qa_verdict you did not obtain');
  });

  test('EVERY line the consumer writes carries how it routed and what it derived about the gate', () => {
    const f = routedFixture('mc-dispatch-record-', 'full');
    run(f);
    const entries = readDispatch(f.queue);
    const running = entries.find((e) => e.status === 'running') as DispatchEntry;
    const terminal = entries[entries.length - 1] as DispatchEntry;
    expect(terminal.status).toBe('exited-clean');
    // BOTH LINES, not just the terminal one: a dispatch that dies mid-flight must still leave a
    // record saying how it was launched and what was known about the gate.
    for (const e of [running, terminal]) {
      expect(e.route).toBe('orchestrator-playbook');
      expect(e.gate?.outcome).toBe('unreachable');
      expect(e.gate?.agent).toBe('orchestrator');
      expect(e.playbooksOffered).toEqual(['design-pass.yml', 'ship-feature.yml']);
    }
    // DERIVED, NOT ASSERTED. The reason names the tools actually read out of the fixture's own
    // agent file, so a constant hardcoding "unreachable" could not produce this string.
    expect(terminal.gate?.tools).toContain('Task');
    expect(terminal.gate?.why).toContain('Workflow');
  });

  test('the recorded gate outcome FOLLOWS the declaration — grant Workflow and it changes itself', () => {
    // THE MUTATION THAT PROVES THE DERIVATION IS ONE. If `unreachable` were a constant, this
    // fixture would produce it too, and every assertion in the test above would still pass.
    const f = routedFixture('mc-dispatch-granted-', 'full');
    installHarness(f.root, { playbooks: ['ship-feature.yml'], tools: '[Read, Bash, Workflow]' });
    run(f);
    const entries = readDispatch(f.queue);
    const terminal = entries[entries.length - 1] as DispatchEntry;
    expect(terminal.gate?.outcome).toBe('unverified');
    // AND IT IS STILL NOT A PASS. Reachable is not run: the launch is out of process and this
    // consumer sees an exit code and nothing else.
    expect(terminal.gate?.outcome).not.toBe('unreachable');
    expect(terminal.gate?.why).toContain('does not claim one ran');
  });

  test('no playbook to route through is `not-started`, and the goal does NOT run', () => {
    const f = routedFixture('mc-dispatch-nopb-', 'no-playbooks');
    run(f);
    expect(launched(f.log)).toBe(false);
    const entries = readDispatch(f.queue);
    const terminal = entries[entries.length - 1] as DispatchEntry;
    expect(terminal.status).toBe('not-started');
    expect(terminal.error).toContain('no playbook to route through');
    // A REFUSAL LEAVES NO `running` LINE. If it did, the next run would reconcile it to
    // `no-result` — "started and told us nothing" about a launch that never began.
    expect(entries.some((e) => e.status === 'running')).toBe(false);
  });

  test('CONTROL: the same harness WITH a playbook does launch — an absence needs a fired control', () => {
    const f = routedFixture('mc-dispatch-nopb-control-', 'full');
    run(f);
    expect(launched(f.log)).toBe(true);
    const entries = readDispatch(f.queue);
    expect((entries[entries.length - 1] as DispatchEntry).status).toBe('exited-clean');
  });

  test('a root with no harness at all records `underivable`, not `unreachable`', () => {
    // "I could not check" is not "I checked and it cannot". A resolver never passes what it could
    // not check, and it must not report negative KNOWLEDGE it does not have either.
    const f = routedFixture('mc-dispatch-noharness-', 'none');
    run(f);
    const terminal = readDispatch(f.queue).at(-1) as DispatchEntry;
    expect(terminal.status).toBe('not-started');
    expect(terminal.gate?.outcome).toBe('underivable');
    expect(terminal.gate?.outcome).not.toBe('unreachable');
  });
});

describe('the gate record cannot express a pass, and reachability is read not assumed', () => {
  test('no gate outcome can be read as a pass — the union has no such member', () => {
    // THE STRUCTURAL GUARANTEE, ASSERTED SO A FUTURE ADDITION TRIPS IT. Every member is either
    // negative knowledge (`unreachable`) or stated ignorance (`unverified`, `underivable`). A
    // member meaning "the gate ran and passed" is what turns "not gated" into "looks gated,
    // wasn't", and nothing but this test stands between the type and someone adding one.
    expect([...GATE_OUTCOMES].sort()).toEqual(['underivable', 'unreachable', 'unverified']);
    for (const o of GATE_OUTCOMES) {
      expect(['pass', 'passed', 'ok', 'gated', 'verified', 'clean']).not.toContain(o);
    }
  });

  const table: [string, string, GateOutcome][] = [
    ['[Read, Write, Edit, Bash, Glob, Grep, Task]', 'the real orchestrator declaration', 'unreachable'],
    ['[Read, Workflow, Bash]', 'the gate tool granted', 'unverified'],
    ['[Read, WorkflowRunner]', 'a SUBSTRING of the gate tool is not the gate tool', 'unreachable'],
  ];
  for (const [tools, what, want] of table) {
    test(`${what} -> ${want}`, () => {
      const dir = mkTmpDir('mc-gate-derive-');
      cleanupDirs.push(dir);
      installHarness(dir, { tools });
      expect(deriveGateReachability(dir, 'orchestrator').outcome).toBe(want);
    });
  }

  test('MUST NOT FIRE: `Workflow` in the agent’s PROSE is not a declaration of it', () => {
    // Measured 2026-08-28 in this repo: the word appears in the BODY of 7 of 7 engine files and in
    // the `tools:` list of ZERO of them, so a file-level grep calls every engine gate-capable.
    // installHarness() writes that prose into every fixture, so this trap is armed everywhere.
    const dir = mkTmpDir('mc-gate-prose-');
    cleanupDirs.push(dir);
    installHarness(dir, { tools: '[Read, Bash]' });
    const body = fs.readFileSync(path.join(dir, '.claude', 'agents', 'orchestrator.md'), 'utf8');
    expect(body).toContain('Workflow');                       // the trap is really present
    expect(deriveGateReachability(dir, 'orchestrator').outcome).toBe('unreachable');
  });

  test('an unreadable or tool-less agent file is `underivable`, with the path in the reason', () => {
    const dir = mkTmpDir('mc-gate-underivable-');
    cleanupDirs.push(dir);
    const missing = deriveGateReachability(dir, 'orchestrator');
    expect(missing.outcome).toBe('underivable');
    expect(missing.why).toContain('orchestrator.md');
    fs.mkdirSync(path.join(dir, '.claude', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'agents', 'orchestrator.md'), '---\nname: x\n---\nWorkflow\n');
    expect(deriveGateReachability(dir, 'orchestrator').outcome).toBe('underivable');
  });
});

// ── The gate ROUTER, which needs no grant ────────────────────────────────────────────────
//
// `GateRecord` says whether the launched session COULD have run the gate. This says whether the
// gate is REQUIRED for what the dispatch produced, and what would run it. The repo's own
// `scripts/run-gate.mjs` answers that, and its header names the defect: "a router that is never
// called is exactly the defect it was written to fix."

describe('a dispatch records what the gate router decided about its output', () => {
  /** A fixture project whose `scripts/run-gate.mjs` emits exactly what the test wants to test. */
  function routerFixture(prefix: string, routerBody: string | null) {
    const dir = mkTmpDir(prefix);
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(root, { recursive: true });
    installHarness(root);
    if (routerBody !== null) {
      fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
      fs.writeFileSync(path.join(root, 'scripts', 'run-gate.mjs'), routerBody);
    }
    fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    const queue = path.join(dir, 'queue.jsonl');
    fs.writeFileSync(queue, JSON.stringify({
      id: 'router', project: path.basename(REPO_ROOT), root, goal: 'g', enqueuedAt: 1_000, status: 'pending',
    }) + '\n');
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    return readDispatch(queue).at(-1) as DispatchEntry;
  }
  const emits = (obj: unknown, exit = 0) =>
    `console.log(${JSON.stringify(JSON.stringify(obj))});\nprocess.exit(${exit});\n`;

  const REAL_SHAPE = {
    ref: 'origin/main...abc123', files: 5, floor: 'full', gateRequired: true,
    drivers: ['a.ts'], gateSelfReview: null,
    // THE RESOLVED TIP THE ROUTER PINNED. The top-level `ref` above is what it was ASKED; this is
    // what that resolves to, and the two differ exactly when the caller passed a symbolic ref.
    verdictRef: { ref: 'abc123abc123abc123abc123abc123abc123abcd', reason: null },
    invocation: { tool: 'Workflow', scriptPath: '.claude/workflows/qa.js', args: { ref: 'origin/main...abc123', tier: 'full', tree: '/t' } },
  };

  test('a decided routing is recorded whole — required, floor, files, ref and the invocation', () => {
    const last = routerFixture('mc-router-ok-', emits(REAL_SHAPE));
    expect(last.gateRouting?.decided).toBe(true);
    const r = last.gateRouting as Extract<typeof last.gateRouting, { decided: true }>;
    expect(r.required).toBe(true);
    expect(r.floor).toBe('full');
    expect(r.files).toBe(5);
    expect(r.ref).toBe('origin/main...abc123');
    expect(r.invocation?.scriptPath).toBe('.claude/workflows/qa.js');
    expect(r.invocation?.args).toMatchObject({ tier: 'full' });
    // THE RESOLVED TIP IS RECORDED BESIDE THE ASKED-FOR REF, not instead of it. `ref` above is a
    // symbolic range; this is the immutable thing a reader should quote.
    expect(r.refTip).toBe('abc123abc123abc123abc123abc123abc123abcd');
    expect(r.refTipReason).toBeNull();
    expect(r.refTip).not.toBe(r.ref);
  });

  test('THE HONEST SHAPE: `required: true` sits beside no verdict, and none can be written', () => {
    const last = routerFixture('mc-router-honest-', emits(REAL_SHAPE));
    // A dispatch that produced gate-requiring work and no verdict must say BOTH halves. The record
    // carries the requirement and the means to satisfy it, and nothing that could be read as
    // having satisfied it.
    const serialised = JSON.stringify(last);
    for (const forbidden of ['"verdict"', '"passed"', '"qa_verdict"', '"PASS"']) {
      expect(serialised).not.toContain(forbidden);
    }
    expect((last.gateRouting as { required: boolean }).required).toBe(true);
    expect(last.gate?.outcome).toBe('unreachable');
  });

  test('A ZERO-FILE DIFF IS UNDECIDED, NOT `required: false` — a zero is not evidence', () => {
    // The router reads origin/main...HEAD in the project ROOT. An engine that worked in a child
    // worktree — which this repo's builders always do — leaves that ref untouched, so an empty
    // classification means "nothing was measured here", not "nothing needs the gate".
    const last = routerFixture('mc-router-zero-', emits({ ...REAL_SHAPE, files: 0, gateRequired: false }));
    expect(last.gateRouting?.decided).toBe(false);
    expect((last.gateRouting as { why: string }).why).toContain('0 files');
    expect((last.gateRouting as { why: string }).why).toContain('worktree');
    // THE NEGATIVE THAT MATTERS: it must not have been recorded as a clean "no gate needed".
    expect(last.gateRouting).not.toMatchObject({ decided: true, required: false });
  });

  test('the router refusing (exit 2) is recorded WITH ITS OWN REASON, not as a spawn failure', () => {
    // run-gate.mjs exits 2 when it cannot verify the tree and prints why as JSON on stdout.
    // execFileSync throws on that exit, and believing the throw would discard the one thing the
    // router was trying to say.
    const last = routerFixture('mc-router-refuse-', emits({ error: 'could not verify tree HEAD' }, 2));
    expect(last.gateRouting?.decided).toBe(false);
    expect((last.gateRouting as { why: string }).why).toContain('could not verify tree HEAD');
    expect((last.gateRouting as { why: string }).why).toContain('exited 2');
  });

  test('a router emitting a shape this consumer does not read is refused, not partially believed', () => {
    // Declare what is read and refuse the rest. A router that renamed `gateRequired` must not be
    // read through a partial match that yields a plausible decision from the fields that survived.
    const { gateRequired, ...missing } = REAL_SHAPE;
    const last = routerFixture('mc-router-shape-', emits(missing));
    expect(last.gateRouting?.decided).toBe(false);
    expect((last.gateRouting as { why: string }).why).toContain('missing a field');
  });

  test('an invocation lacking the fields that make it actionable becomes null, not a plausible shape', () => {
    const last = routerFixture('mc-router-inv-', emits({ ...REAL_SHAPE, invocation: { tool: 'Workflow' } }));
    const r = last.gateRouting as Extract<typeof last.gateRouting, { decided: true }>;
    expect(r.decided).toBe(true);
    expect(r.invocation).toBeNull();
  });

  test('no router in the project is undecided, and the reason names the path it looked for', () => {
    const last = routerFixture('mc-router-absent-', null);
    expect(last.gateRouting?.decided).toBe(false);
    expect((last.gateRouting as { why: string }).why).toContain('run-gate.mjs');
    expect((last.gateRouting as { why: string }).why).toContain('does not exist');
  });

  // ── THE RECORDED REF MUST NOT NAME A MOVING TARGET ─────────────────────────────────────
  //
  // MEASURED, both arms producing both outcomes, at `d559dbe`:
  //   --ref origin/main...feat/w3-caller  ->  top-level ref SYMBOLIC, invocation.args.ref RESOLVED
  //   no --ref (default path)             ->  both resolved, they agree
  // So the top-level field is symbolic ONLY sometimes, which is why reading it alone looked fine.

  test('a SYMBOLIC top-level ref is recorded beside its resolved tip, never in place of it', () => {
    const last = routerFixture('mc-router-symbolic-', emits({
      ...REAL_SHAPE,
      ref: 'origin/main...my-branch',
      verdictRef: { ref: 'd559dbeedf5261ac845c81b15b60ddcc1e63dfdb', reason: null },
    }));
    const r = last.gateRouting as Extract<typeof last.gateRouting, { decided: true }>;
    expect(r.ref).toBe('origin/main...my-branch');
    expect(r.refTip).toBe('d559dbeedf5261ac845c81b15b60ddcc1e63dfdb');
    // THE PAIR IS THE POINT: a record carrying only the first names a branch, and a branch moves.
    expect(r.refTip).not.toBe(r.ref);
  });

  test('an UNPINNABLE tip is recorded as null WITH THE ROUTER\u2019S REASON, never as the symbolic ref', () => {
    const last = routerFixture('mc-router-nopin-', emits({
      ...REAL_SHAPE,
      ref: 'origin/main..d1294a4',
      verdictRef: { ref: null, reason: 'the range uses "..", not "..."' },
    }));
    const r = last.gateRouting as Extract<typeof last.gateRouting, { decided: true }>;
    expect(r.refTip).toBeNull();
    expect(r.refTipReason).toContain('not "..."');
    // AND THE NULL DID NOT SILENTLY BECOME THE SYMBOLIC REF, which is the substitution that would
    // make an unresolvable tip indistinguishable from a resolved one.
    expect(r.refTip).not.toBe(r.ref);
  });

  // EACH CONJUNCT OF THE WIDENED PREDICATE GETS ITS OWN CASE, or some conjunct is decoration.
  // The predicate is: verdictRef is an object, it carries both keys, and not both are null.
  const badVerdictRefs: [string, unknown][] = [
    ['absent entirely \u2014 an older or foreign run-gate.mjs', undefined],
    ['null', null],
    ['an ARRAY, which is an object and has neither key', []],
    ['a bare string that looks like a sha', 'd559dbeedf5261ac845c81b15b60ddcc1e63dfdb'],
    ['missing `reason`, so a null ref could not explain itself', { ref: null }],
    ['missing `ref`', { reason: 'why' }],
    ['BOTH NULL \u2014 asserting neither a tip nor a reason for having none', { ref: null, reason: null }],
    // A2. THE SHAPE WAS CHECKED AND THE FORM WAS NOT. This is well-shaped and accepted before the
    // fix, recorded, and printed as `at feat/my-branch` in the RESOLVED-TIP position \u2014 which
    // reinstates the exact defect the field was added to close. Unreachable from the shipped
    // router, and the stated reason for requiring the field is FOREIGN routers, which is where the
    // form is unguaranteed.
    ['a BRANCH NAME where a 40-hex sha belongs', { ref: 'feat/my-branch', reason: null }],
    ['a short sha \u2014 abbreviations are ambiguous and not what verdict.mjs binds', { ref: 'd559dbe', reason: null }],
    ['a 40-char string that is not hex', { ref: 'z'.repeat(40), reason: null }],
  ];
  for (const [what, vr] of badVerdictRefs) {
    test(`a verdictRef that is ${what} is REFUSED, not partially believed`, () => {
      const shape: Record<string, unknown> = { ...REAL_SHAPE };
      if (vr === undefined) delete shape.verdictRef; else shape.verdictRef = vr;
      const last = routerFixture('mc-router-vr-', emits(shape));
      expect(last.gateRouting?.decided).toBe(false);
      expect((last.gateRouting as { why: string }).why).toContain('verdictRef');
      // REFUSAL IS NEVER A SPEND — AND THE ASSERTION NAMES ITS SUBJECT. This row previously read
      // `state === 'not-asked'`, which this fixture ALSO yields on the accepted path because it
      // installs no producer: the assertion ran, passed, and could not separate the two. The `why`
      // is what distinguishes them — a routing refusal, not a missing producer.
      expect(last.verdictProduction?.state).toBe('not-asked');
      const why = (last.verdictProduction as { why: string }).why;
      expect(why).toContain('did not decide');
      expect(why).not.toContain('produce-verdict.mjs does not exist');
    });
  }

  test('CONTROL: the SAME fixture with a well-formed verdictRef still DECIDES', () => {
    // Without this the seven rows above are satisfied by a build that refuses every router.
    const last = routerFixture('mc-router-vr-ok-', emits(REAL_SHAPE));
    expect(last.gateRouting?.decided).toBe(true);
  });

  test('ANTI-DRIFT: the REAL run-gate.mjs emits all SIX fields this consumer reads', () => {
    // The six tests above drive a FIXTURE router, so they all stay green if the real one changes
    // shape — a fixture built from my own parser cannot fail. This runs the real emitter.
    //
    // F3a — IT COVERED FOUR OF THE FIVE. There were zero assertions naming `invocation` (control:
    // six named `gateRequired`). Renaming it in the real router left every test green while
    // `isInvocation` returned false and the entry recorded `invocation: null` — `required: true`
    // beside no invocation, which is the shrug `GateInvocation`'s own doc-comment exists to replace.
    //
    // F3b — AND THE DENOMINATOR HAD TO BE FORCED. Run with no arguments on `main` after merge the
    // diff is EMPTY, and the router's empty path emits `{files: 0, floor: 'trivial',
    // gateRequired: false}` with NO invocation — so a bare run can satisfy four of these assertions
    // while exercising only the degenerate branch, and would have to SKIP the fifth. `--files`
    // classifies an explicit list, so the non-empty branch is reached wherever this runs, and
    // `files > 0` below is the assertion that proves it was.
    const out = execFileSync('node', [
      path.join(REPO_ROOT, 'scripts', 'run-gate.mjs'),
      '--files', 'mission-control/server/index-cache.ts', '--json',
    ], { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const j = JSON.parse(out) as Record<string, unknown>;
    expect(typeof j.ref).toBe('string');
    expect(typeof j.files).toBe('number');
    expect(typeof j.floor).toBe('string');
    expect(typeof j.gateRequired).toBe('boolean');
    // THE SIXTH FIELD, added when the recorded ref was found to be able to name a moving target.
    // The five above were the contract before that; a test still saying FIVE while the consumer
    // reads six is how a rename goes green. Named by key AND by inner shape, like `invocation`.
    expect(Object.keys(j)).toContain('verdictRef');
    const vr = j.verdictRef as Record<string, unknown>;
    expect(vr).not.toBeNull();
    expect(Object.keys(vr).sort()).toEqual(['reason', 'ref']);
    // THIS RUN USES `--files`, so the router deliberately declines to pin a tip and says why. That
    // is the null-WITH-A-REASON branch, and it is the one the consumer must accept rather than
    // refuse — asserting it here means the real emitter, not a fixture, proves that branch exists.
    expect(vr.ref).toBeNull();
    expect(typeof vr.reason).toBe('string');
    expect((vr.reason as string).length).toBeGreaterThan(0);
    // THE DENOMINATOR, READ RATHER THAN ASSUMED: the non-degenerate branch was the one exercised.
    expect(j.files as number).toBeGreaterThan(0);
    expect(j.gateRequired).toBe(true);
    // THE FIFTH FIELD. Named by key so a rename goes red here, and shaped so a rename of its
    // INNER keys — which `isInvocation` also reads — goes red too.
    expect(Object.keys(j)).toContain('invocation');
    const inv = j.invocation as Record<string, unknown>;
    expect(typeof inv.tool).toBe('string');
    expect(typeof inv.scriptPath).toBe('string');
    expect(typeof inv.args).toBe('object');
    // And the four names the consumer would silently mis-read if any were renamed.
    for (const k of ['ref', 'files', 'floor', 'gateRequired']) expect(Object.keys(j)).toContain(k);
  });
});

// ── F1 · what the session is TOLD must follow the same derivation as what is RECORDED ────
//
// The record and the prompt are two consumers of one derivation. The record followed it; the
// prompt carried a hard-coded "NOT REACHABLE" for all three outcomes, so the one place the
// distinction reached something that ACTS on it collapsed it. These tests fail on that code.

describe('the prompt tells the session what was derived, not a fixed sentence', () => {
  // NO TRAILING PERIOD, AND THAT IS LOAD-BEARING. The defective build emitted
  // "…FROM THIS SESSION (unverified)." — the outcome interpolated between the sentence and its
  // full stop — so a constant ending in `SESSION.` does not match it, and the contradiction test
  // below PASSED against the very code it was written to defeat. Measured by mutation: with the
  // period, 3 of 4 prompt tests went red on the pre-fix source and this one stayed green.
  const NOT_REACHABLE = 'THE BINDING QA GATE IS NOT REACHABLE FROM THIS SESSION';
  const MAY_BE = 'THE BINDING QA GATE MAY BE REACHABLE FROM THIS SESSION, AND NOTHING HAS RUN IT FOR YOU';
  const UNDETERMINED = 'WHETHER THE BINDING QA GATE IS REACHABLE FROM THIS SESSION COULD NOT BE DETERMINED';

  function promptFor(prefix: string, harness: (root: string) => void) {
    const dir = mkTmpDir(prefix);
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(root, { recursive: true });
    harness(root);
    const argv = path.join(dir, 'argv.bin');
    fs.writeFileSync(path.join(bin, 'claude'), `#!/bin/sh\nprintf '%s\\0' "$@" >> ${argv}\nexit 0\n`);
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    const queue = path.join(dir, 'queue.jsonl');
    fs.writeFileSync(queue, JSON.stringify({
      id: 'p', project: path.basename(REPO_ROOT), root, goal: 'GOALTEXT', enqueuedAt: 1_000, status: 'pending',
    }) + '\n');
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    const args = fs.existsSync(argv) ? fs.readFileSync(argv, 'utf8').split('\0').filter(Boolean) : [];
    return { prompt: args[3] ?? '', entry: readDispatch(queue).at(-1) as DispatchEntry };
  }

  // Each row: the headline it MUST carry, and the two it must NOT. Stating the negatives is the
  // whole test — the defective build satisfied every positive for `unreachable` and also emitted
  // that same positive for the other two.
  const rows: [string, (r: string) => void, GateOutcome, string, string[]][] = [
    ['unreachable', (r) => installHarness(r), 'unreachable', NOT_REACHABLE, [MAY_BE, UNDETERMINED]],
    ['unverified', (r) => installHarness(r, { tools: '[Read, Bash, Workflow]' }), 'unverified', MAY_BE, [NOT_REACHABLE, UNDETERMINED]],
    ['underivable', (r) => {
      // Playbooks present so the launch is REACHED; the agent file unreadable so the gate is not
      // derivable. This needs no founder grant and is the case that shipped a confident falsehood.
      fs.mkdirSync(path.join(r, '.claude', 'playbooks'), { recursive: true });
      fs.writeFileSync(path.join(r, '.claude', 'playbooks', 'ship-feature.yml'), 'name: f\n');
    }, 'underivable', UNDETERMINED, [NOT_REACHABLE, MAY_BE]],
  ];

  for (const [what, harness, outcome, must, mustNot] of rows) {
    test(`${what}: the prompt says its own headline and NOT the other two`, () => {
      const { prompt, entry } = promptFor(`mc-prompt-${what}-`, harness);
      expect(entry.gate?.outcome).toBe(outcome);
      expect(prompt).toContain(must);
      for (const other of mustNot) expect(prompt).not.toContain(other);
    });
  }

  test('the prompt never contradicts the reason printed directly beneath it', () => {
    // The defect in its sharpest form: headline "NOT REACHABLE" with `gate.why` saying "so the
    // gate is REACHABLE" on the next line. Asserted as a relation between the two, so it holds
    // however the strings are later reworded.
    const { prompt, entry } = promptFor('mc-prompt-contradiction-', (r) => installHarness(r, { tools: '[Read, Bash, Workflow]' }));
    expect(entry.gate?.why).toContain('so the gate is REACHABLE');
    expect(prompt).toContain(entry.gate?.why as string);
    expect(prompt).not.toContain(NOT_REACHABLE);
  });

  test('every outcome still forbids writing a verdict that was not obtained', () => {
    // The one instruction that is correct in all three states, and must survive the split.
    for (const [what, harness] of rows.map((r) => [r[0], r[1]] as const)) {
      const { prompt } = promptFor(`mc-prompt-verdict-${what}-`, harness);
      expect(prompt).toContain('DO NOT record a qa_verdict you did not obtain');
    }
  });

  test('F5: the goal is fenced and the constraint restated after it', () => {
    const { prompt } = promptFor('mc-prompt-fence-', (r) => installHarness(r));
    const begin = prompt.indexOf('--- BEGIN GOAL ---');
    const end = prompt.indexOf('--- END GOAL ---');
    expect(begin).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(begin);
    expect(prompt.slice(begin, end)).toContain('GOALTEXT');
    // The constraint appears AFTER the goal, not only before it.
    expect(prompt.indexOf('do not record', end)).toBeGreaterThan(end);
  });
});

// ── F2 · the derivation must read both legal YAML spellings ──────────────────────────────

describe('a tools: declaration is read in either legal YAML spelling', () => {
  for (const spelling of ['flow', 'block'] as const) {
    test(`${spelling} form: Workflow absent -> unreachable, present -> unverified`, () => {
      const dir = mkTmpDir(`mc-yaml-${spelling}-`);
      cleanupDirs.push(dir);
      installHarness(dir, { tools: '[Read, Write, Edit, Bash, Glob, Grep, Task]', spelling });
      expect(deriveGateReachability(dir, 'orchestrator').outcome).toBe('unreachable');
      installHarness(dir, { tools: '[Read, Bash, Workflow]', spelling });
      const granted = deriveGateReachability(dir, 'orchestrator');
      expect(granted.outcome).toBe('unverified');
      expect(granted.tools).toEqual(['Read', 'Bash', 'Workflow']);
    });
  }

  test('THE DEFEATER: the two spellings of ONE list derive identically', () => {
    // This is the assertion the old parser fails. A reformat that schema-lint accepts — it asserts
    // only Array.isArray(fm.tools) — took the derivation to `underivable`, and through the prompt
    // then told the session the gate could not run.
    const mk = (spelling: 'flow' | 'block') => {
      const d = mkTmpDir(`mc-yaml-eq-${spelling}-`);
      cleanupDirs.push(d);
      installHarness(d, { tools: '[Read, Bash, Workflow]', spelling });
      return deriveGateReachability(d, 'orchestrator');
    };
    const a = mk('flow');
    const b = mk('block');
    expect(b.outcome).toBe(a.outcome);
    expect(b.tools).toEqual(a.tools as string[]);
    expect(a.outcome).toBe('unverified');   // and not both `underivable`, which would also be equal
  });

  const refusals: [string, string][] = [
    ['a scalar is not a list', 'Read'],
    ['an empty value', ''],
    ['a mapping', '\n  read: true'],
  ];
  for (const [what, raw] of refusals) {
    test(`${what} -> underivable, never an empty grant list`, () => {
      const d = mkTmpDir('mc-yaml-refuse-');
      cleanupDirs.push(d);
      installHarness(d, { rawTools: raw });
      const r = deriveGateReachability(d, 'orchestrator');
      // `underivable` and NOT `unreachable`: "I could not read it" must not become "it declares
      // nothing", which is a confident wrong answer.
      expect(r.outcome).toBe('underivable');
      expect(r.outcome).not.toBe('unreachable');
    });
  }

  test('a `tools:` line in the BODY is not the declaration', () => {
    const d = mkTmpDir('mc-yaml-body-');
    cleanupDirs.push(d);
    fs.mkdirSync(path.join(d, '.claude', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(d, '.claude', 'agents', 'orchestrator.md'),
      '---\nname: orchestrator\n---\ntools: [Read, Workflow]\n');
    expect(deriveGateReachability(d, 'orchestrator').outcome).toBe('underivable');
  });
});

// ── F7 · a terminal state may not claim what was never observed ──────────────────────────

describe('a clean exit is recorded as a clean exit, not as a completion', () => {
  function runClean(prefix: string, harness: (r: string) => void) {
    const dir = mkTmpDir(prefix);
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(root, { recursive: true });
    harness(root);
    fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    const queue = path.join(dir, 'queue.jsonl');
    fs.writeFileSync(queue, JSON.stringify({
      id: 'f7', project: path.basename(REPO_ROOT), root, goal: 'g', enqueuedAt: 1_000, status: 'pending',
    }) + '\n');
    execFileSync('bun', [CONSUMER], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: queue },
      encoding: 'utf8', stdio: 'pipe',
    });
    return readDispatch(queue);
  }

  test('exit 0 is `exited-clean` and is NEVER `consumed` — the word claimed a completion', () => {
    // The launch runs with stdio: 'inherit', so nothing about the session's content is captured.
    // `consumed` asserted the session finished; the only observation is the exit code.
    const entries = runClean('mc-f7-clean-', (r) => installHarness(r));
    const last = entries.at(-1) as DispatchEntry;
    expect(last.status).toBe('exited-clean');
    expect(last.exitCode).toBe(0);
    // THE NEGATIVE, and it is the finding: no line this build wrote may carry the old claim.
    for (const e of entries) expect(e.status).not.toBe('consumed');
  });

  test('the turn cap in force is recorded as CONTEXT, and is not the diagnosis', () => {
    const entries = runClean('mc-f7-cap-', (r) => installHarness(r));
    const last = entries.at(-1) as DispatchEntry;
    expect(last.declaredMaxTurns).toBe(30);
    // It says what limit applied. It does NOT say the limit fired — nothing here observed that,
    // and no field claims it.
    expect(last.status).toBe('exited-clean');
    expect(JSON.stringify(last)).not.toContain('truncat');
    expect(JSON.stringify(last)).not.toContain('capped');
  });

  test('an agent declaring no maxTurns records null, not a default that looks measured', () => {
    const entries = runClean('mc-f7-nocap-', (r) => installHarness(r, { maxTurns: null }));
    expect((entries.at(-1) as DispatchEntry).declaredMaxTurns).toBeNull();
  });

  test('LEGACY: `consumed` still classifies as settled, so old records are not orphaned', () => {
    // Dropping it from the union would make every existing queue entry `unrecognised` — reported
    // and then left alone forever, which is a worse outcome than a stale label.
    const line = (id: string, status: string): DispatchEntry =>
      ({ id, project: 'p', root: '/r', goal: 'g', enqueuedAt: 1, status } as DispatchEntry);
    const work = classifyDispatches([line('old', 'consumed'), line('new', 'exited-clean')]);
    expect(work.settled.map((e) => e.id).sort()).toEqual(['new', 'old']);
    expect(work.unrecognised).toEqual([]);
    expect(KNOWN_DISPATCH_STATUSES).toContain('consumed');
    expect(KNOWN_DISPATCH_STATUSES).toContain('exited-clean');
  });
});

// ── PRODUCING a verdict, not merely routing to one ───────────────────────────────────────
//
// `scripts/produce-verdict.mjs` landed on `main` in #125 and was invoked by NOTHING. Measured at
// `4ddc5c6`, controls in both directions: 3 files referenced it — a test argv in package.json, the
// registration check naming that argv, and generated documentation — against 24 files referencing
// `run-gate.mjs`, which IS invoked, and 0 for an impossible name. 24 against 3 is what made that a
// measured gap rather than a suggestive zero.
//
// The cells below pin the two halves that can fail silently: WHEN the producer is asked (the
// denominator — a spend, not a detail) and WHAT is believed when it answers (the artifact, never
// the receipt).

describe('classifyVerdictProduction — the exit code is a receipt, the payload is the outcome', () => {
  const run = (o: Partial<ProducerRun>): ProducerRun =>
    ({ status: null, signal: null, spawnCode: null, stdout: '', ...o });
  const said = (outcome: string, extra: Record<string, unknown> = {}) =>
    JSON.stringify({ outcome, reason: 'the producer said so', ...extra });

  // THE CELL THAT MUST NOT FIRE. Without it every row below is satisfied by a function that
  // returns `unresolved` unconditionally, and a table where every cell agrees looks like rigour.
  test('CONTROL: an agreeing PRODUCED run IS `produced`, and carries the artifact evidence', () => {
    const v = classifyVerdictProduction(run({
      status: 0,
      stdout: said('PRODUCED', { subject: 'abc123', head: 'deadbeef', established: true }),
    }));
    expect(v.state).toBe('produced');
    expect(v).toMatchObject({ exitCode: 0, subject: 'abc123', head: 'deadbeef' });
  });

  test('each of the producer\u2019s four terminal states maps to its own recorded state', () => {
    expect(classifyVerdictProduction(run({ status: 0, stdout: said('PRODUCED') })).state).toBe('produced');
    expect(classifyVerdictProduction(run({ status: 1, stdout: said('BLOCKED') })).state).toBe('blocked');
    expect(classifyVerdictProduction(run({ status: 2, stdout: said('REFUSED') })).state).toBe('unresolved');
    expect(classifyVerdictProduction(run({ status: 3, stdout: said('NOT_REQUIRED') })).state).toBe('not-required');
    // AND THEY ARE FOUR DISTINCT ANSWERS, not one value asserted four times. Four inputs produce
    // four states; REFUSED is the only one whose name differs from the producer's, so the SET is
    // four wide and `produced` is in it exactly once.
    const names = ['PRODUCED', 'BLOCKED', 'REFUSED', 'NOT_REQUIRED'];
    const seen = new Set(names.map((n, i) =>
      classifyVerdictProduction(run({ status: i, stdout: said(n) })).state));
    expect(seen.size).toBe(4);
    expect([...seen].sort()).toEqual(['blocked', 'not-required', 'produced', 'unresolved']);
  });

  // ── THE INPUTS CONSTRUCTED TO DEFEAT THIS VERY FIX ───────────────────────────────────────
  //
  // Each row below is a way a run could END UP LOOKING like a pass without one having been read
  // out of `.qa/verdicts/`. Every one must be `unresolved`, and none may be `produced`.
  const attacks: [string, ProducerRun][] = [
    ['exit 0 with a payload that does NOT say PRODUCED — a wrapper swallowing the real code',
      run({ status: 0, stdout: said('REFUSED') })],
    ['a payload saying PRODUCED behind an exit code that means something else',
      run({ status: 3, stdout: said('PRODUCED') })],
    ['exit 0 and NO output at all — a stub named `produce-verdict.mjs` on the path',
      run({ status: 0, stdout: '' })],
    ['exit 0 and human prose rather than JSON — the non-`--json` renderer',
      run({ status: 0, stdout: 'PRODUCED  (established=true)\n  a verdict record is committed\n' })],
    ['JSON that is not an object — a bare string naming the state',
      run({ status: 0, stdout: '"PRODUCED"' })],
    ['JSON that is an ARRAY — indexable, truthy, and not an outcome',
      run({ status: 0, stdout: '[{"outcome":"PRODUCED"}]' })],
    ['an outcome word this build does not know, spelled like success',
      run({ status: 0, stdout: said('PASSED') })],
    ['an outcome that is not a string',
      run({ status: 0, stdout: JSON.stringify({ outcome: true, reason: 'r' }) })],
    ['exit 64 — USAGE, deliberately outside the four so it can never be read as one',
      run({ status: 64, stdout: said('PRODUCED') })],
    ['a producer KILLED after it had already printed a PRODUCED payload',
      run({ status: null, signal: 'SIGKILL', stdout: said('PRODUCED') })],
    // THE SHAPE NODE REALLY PRODUCES ON A TIMEOUT: execFileSync kills the child, so BOTH are set.
    // The old row modelled `signal: null` with `code: 'ETIMEDOUT'`, which Node does not emit \u2014 so
    // the fixture and the comment beside it agreed with each other and with nothing else.
    ['a producer that hit the outer TIMEOUT \u2014 signal AND code, as Node emits it',
      run({ status: null, signal: 'SIGTERM', spawnCode: 'ETIMEDOUT', stdout: said('PRODUCED'), message: 'timed out' })],
    ['the defensive shape: a spawn code with no signal',
      run({ status: null, signal: null, spawnCode: 'ETIMEDOUT', stdout: said('PRODUCED'), message: 'timed out' })],
    ['no producer on PATH at all, with stdout somehow non-empty',
      run({ status: null, spawnCode: 'ENOENT', stdout: said('PRODUCED'), message: 'spawn node ENOENT' })],
  ];
  for (const [what, r] of attacks) {
    test(`UNRESOLVED, never produced: ${what}`, () => {
      const v = classifyVerdictProduction(r);
      expect(v.state).toBe('unresolved');
      // PAIRED WITH THE OUTCOME IT MUST NOT EQUAL — `state === 'unresolved'` alone would pass
      // against a build that wrote it unconditionally, which the CONTROL above rules out.
      expect(v.state).not.toBe('produced');
      expect(v.state).not.toBe('not-required');
    });
  }

  test('a signal is settled BEFORE stdout is read — the order is the design', () => {
    // Both are wrong-looking; only the signal explains it. The reason must name the signal rather
    // than the payload, or a reader diagnoses a parse problem that did not happen.
    const v = classifyVerdictProduction(run({ status: null, signal: 'SIGTERM', stdout: said('PRODUCED') }));
    expect(v).toMatchObject({ state: 'unresolved', signal: 'SIGTERM' });
    expect((v as { reason: string }).reason).toContain('SIGTERM');
  });

  test('`not-asked` is NOT reachable from a producer run — only the caller may write it', () => {
    // Every state except this one comes from a run. `not-asked` says the run never happened, and a
    // function that reads a run's remains must not be able to claim that.
    const everyState = new Set(VERDICT_PRODUCTION_STATES);
    expect(everyState.has('not-asked')).toBe(true); // the vocabulary really does contain it
    const fromRuns = new Set([
      classifyVerdictProduction(run({ status: 0, stdout: said('PRODUCED') })).state,
      classifyVerdictProduction(run({ status: 1, stdout: said('BLOCKED') })).state,
      classifyVerdictProduction(run({ status: 2, stdout: said('REFUSED') })).state,
      classifyVerdictProduction(run({ status: 3, stdout: said('NOT_REQUIRED') })).state,
      classifyVerdictProduction(run({ status: null, signal: 'SIGKILL', stdout: '' })).state,
    ]);
    expect(fromRuns.has('not-asked')).toBe(false);
    // THE DENOMINATOR, READ RATHER THAN ASSUMED: four of the five states were reached here, so the
    // absence of the fifth is a fact about the function and not about a thin sample.
    expect(fromRuns.size).toBe(4);
  });

  test('an outcome reached through the PROTOTYPE CHAIN is an unknown word, not a disagreement', () => {
    // A3. `declared in TABLE` walks the prototype, so `{"outcome":"toString"}` found a FUNCTION and
    // skipped the "declares no outcome this build knows" branch \u2014 falling through to the exit
    // cross-check and reporting a DISAGREEMENT. No bypass (it is `unresolved` either way), but the
    // wrong diagnosis, and the diagnosis is what an operator acts on.
    for (const word of ['toString', 'constructor', 'valueOf', 'hasOwnProperty']) {
      const v = classifyVerdictProduction(run({ status: 0, stdout: said(word) }));
      expect(v.state).toBe('unresolved');
      const why = (v as { reason: string }).reason;
      expect(why).toContain('declares no outcome this build knows');
      expect(why).not.toContain('disagreeing');
    }
    // CONTROL: a genuine exit/payload disagreement STILL says `disagreeing`, so the assertion above
    // is not satisfied by a build that never uses that word.
    const real = classifyVerdictProduction(run({ status: 3, stdout: said('PRODUCED') }));
    expect((real as { reason: string }).reason).toContain('disagreeing');
  });

  test('the producer spawn declares BOTH bounds, and the call site uses them', () => {
    // Deleting either `timeout` or `maxBuffer` from the spawn was green at 126/0, which makes them
    // decoration rather than controls. They are values in a module now, so a deletion at the call
    // site breaks the reference and a deletion here fails this.
    expect(PRODUCER_SPAWN_LIMITS.timeoutMs).toBeGreaterThan(0);
    expect(PRODUCER_SPAWN_LIMITS.maxBufferBytes).toBeGreaterThan(1024 * 1024);
    // LOOSER THAN THE PRODUCER'S OWN ONE-HOUR DEFAULT, deliberately: one authority for the panel
    // budget, and it is the producer's, so its bounded refusal wins whenever it can.
    expect(PRODUCER_SPAWN_LIMITS.timeoutMs).toBeGreaterThan(60 * 60 * 1000);
    const src = fs.readFileSync(path.join(REPO_ROOT, 'mission-control', 'scripts', 'consume-dispatch.ts'), 'utf8');
    expect(src).toContain('timeout: PRODUCER_SPAWN_LIMITS.timeoutMs');
    expect(src).toContain('maxBuffer: PRODUCER_SPAWN_LIMITS.maxBufferBytes');
  });

  test('ANTI-DRIFT: the REAL produce-verdict.mjs still spells its states and codes this way', () => {
    // The rows above drive a FIXTURE payload, so they all stay green if the producer renames a
    // state or renumbers an exit code — a fixture built from my own reader cannot fail. This drives
    // the producer's OWN exported tables through the consumer's classifier. It is the same F3a
    // lesson the run-gate anti-drift test above was written for.
    // EVERY LOOKUP CHECKED, and that is not ceremony: `noUncheckedIndexedAccess` types these as
    // `string | undefined`, and the FIRST draft cast the pair instead — which would have turned a
    // producer that dropped an exit code into `undefined` flowing on as a plausible value. `tsc`
    // refused it; `bun test` had already passed 116 of 116 with it in.
    const pairs: [string, number][] = [];
    for (const o of Object.values(REAL_OUTCOME)) {
      const code = REAL_EXIT[o];
      expect(typeof code).toBe('number');
      pairs.push([o, code as number]);
    }
    expect(pairs.length).toBe(4);
    for (const [outcome, code] of pairs) {
      const v = classifyVerdictProduction(run({ status: code, stdout: said(outcome) }));
      expect((v as { reason: string }).reason).not.toContain('disagreeing');
      expect((v as { reason: string }).reason).not.toContain('declares no outcome this build knows');
      expect(VERDICT_PRODUCTION_STATES).toContain(v.state);
    }
    // CONTROL ON THE SAME ARM: a deliberately mismatched pair from the SAME real tables must be
    // caught, or the loop above proves only that the classifier says yes to everything.
    const notRequired = REAL_OUTCOME.NOT_REQUIRED;
    const produced = REAL_OUTCOME.PRODUCED;
    expect(typeof notRequired).toBe('string');
    expect(typeof produced).toBe('string');
    const mismatchCode = REAL_EXIT[notRequired as string];
    expect(typeof mismatchCode).toBe('number');
    const mismatch = classifyVerdictProduction(run({
      status: mismatchCode as number, stdout: said(produced as string),
    }));
    expect(mismatch.state).toBe('unresolved');
    expect((mismatch as { reason: string }).reason).toContain('disagreeing');
  });
});

describe('the consumer asks the producer for the RIGHT DENOMINATOR, and for nothing else', () => {
  /**
   * A fixture project with its own router and its own producer, and a LOG THE PRODUCER WRITES.
   *
   * THE LOG IS THE WHOLE POINT. `verdictProduction.state === 'not-asked'` is byte-identical whether
   * the producer was skipped or ran and was misread, so every cell below asserts the RUN COUNT as
   * well as the state — a spend is the thing being controlled and only the log observes it.
   */
  function producerFixture(
    prefix: string,
    opts: { router: string | null; producer: string | null; args?: string[]; ids?: string[] },
  ) {
    const dir = mkTmpDir(prefix);
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    const log = path.join(dir, 'producer-runs.log');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    installHarness(root);
    if (opts.router !== null) fs.writeFileSync(path.join(root, 'scripts', 'run-gate.mjs'), opts.router);
    if (opts.producer !== null) fs.writeFileSync(path.join(root, 'scripts', 'produce-verdict.mjs'), opts.producer);
    // F1. THE LAUNCH LOGS TO THE SAME FILE, SO ORDER BECOMES AN ASSERTION RATHER THAN A COMMENT.
    // The producer must run AFTER the dispatch commits, because the subject hashes the diff — and
    // moving the whole verdict block above the launch left `tsc` clean and this suite byte-identical
    // at 126/0. Disclosure is not a control; a shared log is.
    fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\necho launch >> "$MC_PRODUCER_LOG"\nexit 0\n');
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    const queue = path.join(dir, 'queue.jsonl');
    const ids = opts.ids ?? ['producer'];
    fs.writeFileSync(queue, ids.map((id) => JSON.stringify({
      id, project: path.basename(REPO_ROOT), root, goal: 'g', enqueuedAt: 1_000, status: 'pending',
    })).join('\n') + '\n');
    const stdout = execFileSync('bun', [CONSUMER, ...(opts.args ?? [])], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: queue, MC_PRODUCER_LOG: log },
      encoding: 'utf8', stdio: 'pipe',
    });
    const logText = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
    const lines = logText.trim().split('\n').filter(Boolean);
    // COUNTED BY PREFIX, because two different programs now write here and a bare line count would
    // silently conflate a launch with a panel — which is the very thing being measured.
    const runs = lines.filter((l) => l.startsWith('run')).length;
    const launches = lines.filter((l) => l.startsWith('launch')).length;
    return {
      entry: readDispatch(queue).at(-1) as DispatchEntry,
      entries: readDispatch(queue),
      runs, launches, lines, logText, stdout,
    };
  }

  const ROUTER = (over: Record<string, unknown> = {}) => {
    const shape = {
      ref: 'origin/main...abc123', files: 5, floor: 'full', gateRequired: true,
      verdictRef: { ref: 'abc123abc123abc123abc123abc123abc123abcd', reason: null },
      invocation: { tool: 'Workflow', scriptPath: '.claude/workflows/qa.js', args: { ref: 'r', tier: 'full', tree: '/t' } },
      ...over,
    };
    return `console.log(${JSON.stringify(JSON.stringify(shape))});\n`;
  };
  /** A producer that records that it ran, prints a payload, and exits with a chosen code. */
  const PRODUCER = (payload: unknown, exit: number) =>
    `import fs from 'node:fs';\n`
    // F3, OBSERVED FROM INSIDE THE WINDOW. The producer reads the queue as it finds it and logs the
    // status of the last line. If the terminal record is written BEFORE the producer, it sees a
    // settled status; if it is withheld until after, it sees `running` \u2014 and an interrupted run
    // then leaves the entry `running` forever, which `inFlight()` later reclaims and re-dispatches,
    // paying for a second panel. Nothing else in this suite can see that ordering.
    + `const q = fs.readFileSync(process.env.MC_DISPATCH_QUEUE, 'utf8').trim().split('\\n').filter(Boolean);\n`
    + `const seen = JSON.parse(q[q.length - 1]).status;\n`
    + `fs.appendFileSync(process.env.MC_PRODUCER_LOG, 'run ' + process.argv.slice(2).join(' ') + ' saw=' + seen + '\\n');\n`
    + `console.log(${JSON.stringify(JSON.stringify(payload))});\n`
    + `process.exit(${exit});\n`;

  test('a REQUIRED gate asks the producer exactly once, and the artifact answer is recorded', () => {
    const { entry, runs, logText } = producerFixture('mc-prod-yes-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'binds this diff and reads PASS', subject: 'sub1' }, 0),
    });
    expect(runs).toBe(1);
    // ASKED WITH `--json`, read from the argv the producer LOGGED rather than from this test's
    // expectation of it. Without the flag the producer prints prose, which the classifier refuses.
    expect(logText).toContain('--json');
    expect(entry.verdictProduction).toMatchObject({ state: 'produced', exitCode: 0, subject: 'sub1' });
    // AND IT WAS ASKED WITH `--json`, because the payload is the only thing that may be believed.
    // The fixture producer logs its own argv, so this reads what the consumer really passed rather
    // than what this test would like it to have passed.
    expect(entry.verdictProduction).not.toHaveProperty('why');
  });

  test('a NOT-REQUIRED gate never spends a panel — the denominator is diffs, not dispatches', () => {
    const { entry, runs } = producerFixture('mc-prod-notreq-', {
      router: ROUTER({ gateRequired: false }),
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'should never be reached' }, 0),
    });
    // THE PRODUCER WOULD HAVE SAID `produced`. It was not asked, so it did not.
    expect(runs).toBe(0);
    expect(entry.verdictProduction?.state).toBe('not-asked');
    expect((entry.verdictProduction as { why: string }).why).toContain('does not require the gate');
  });

  test('an UNDECIDED routing never spends a panel either — a zero is not a question', () => {
    const { entry, runs } = producerFixture('mc-prod-undecided-', {
      router: null,
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'should never be reached' }, 0),
    });
    expect(runs).toBe(0);
    expect(entry.verdictProduction?.state).toBe('not-asked');
    expect((entry.verdictProduction as { why: string }).why).toContain('did not decide');
  });

  test('--no-verdict declines the spend even when the gate IS required', () => {
    const { entry, runs } = producerFixture('mc-prod-optout-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'should never be reached' }, 0),
      args: ['--no-verdict'],
    });
    expect(runs).toBe(0);
    expect((entry.verdictProduction as { why: string }).why).toContain('--no-verdict');
  });

  test('a project with NO producer is `not-asked` naming the path, not a failed gate run', () => {
    const { entry, runs } = producerFixture('mc-prod-absent-', { router: ROUTER(), producer: null });
    expect(runs).toBe(0);
    expect(entry.verdictProduction?.state).toBe('not-asked');
    expect((entry.verdictProduction as { why: string }).why).toContain('produce-verdict.mjs');
    expect((entry.verdictProduction as { why: string }).why).toContain('does not exist');
  });

  test('END TO END: a producer exiting 0 while its payload REFUSES is `unresolved`, not `produced`', () => {
    // The attack, through the real spawn path rather than through the classifier alone: a producer
    // that ran, was asked, exited cleanly, and established nothing.
    const { entry, runs } = producerFixture('mc-prod-lie-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'REFUSED', reason: 'the router refused to emit an invocation' }, 0),
    });
    expect(runs).toBe(1);
    expect(entry.verdictProduction?.state).toBe('unresolved');
    expect(entry.verdictProduction?.state).not.toBe('produced');
    expect(JSON.stringify(entry)).not.toContain('"PASS"');
  });

  test('END TO END: a producer that exits 1 with a BLOCKED payload is recorded as blocked', () => {
    const { entry, runs } = producerFixture('mc-prod-blocked-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'BLOCKED', reason: 'the panel ran and said no' }, 1),
    });
    expect(runs).toBe(1);
    expect(entry.verdictProduction).toMatchObject({ state: 'blocked', exitCode: 1 });
  });

  // ── A1 · N ENTRIES, ONE DIFF, ONE PANEL ────────────────────────────────────────────────
  //
  // Measured before the fix: 5 pending entries against one root and one diff produced 5 observed
  // producer invocations. Every cost filter was per-ENTRY; the thing being paid for is per-DIFF.
  // A panel ending REFUSED writes no binding record, so the producer's own short-circuit \u2014 which
  // fires only on PRODUCED or BLOCKED \u2014 does not catch the second entry either.

  test('FIVE entries, one subject: five launches, ONE panel', () => {
    const five = ['e1', 'e2', 'e3', 'e4', 'e5'];
    const { entries, runs, launches } = producerFixture('mc-prod-fanout-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'REFUSED', reason: 'establishes nothing, so no record binds' }, 2),
      ids: five,
    });
    // THE REFUSED PAYLOAD IS THE POINT: it writes no binding record, so nothing downstream can
    // dedupe for us. Before the fix this fixture measured 5.
    expect(runs).toBe(1);
    // CONTROL ON THE SAME LOG: all five really were dispatched, so `runs === 1` is a dedupe and
    // not a fixture that quietly processed one entry.
    expect(launches).toBe(5);
    const current = resolveDispatchStates(entries);
    expect(current.length).toBe(5);
    const states = current.map((e) => e.verdictProduction?.state).sort();
    expect(states).toEqual(['already-launched', 'already-launched', 'already-launched', 'already-launched', 'unresolved']);
    // THE SKIP HAS ITS OWN STATE AND NAMES WHO PAID \u2014 `not-asked` already means something else.
    const skipped = current.filter((e) => e.verdictProduction?.state === 'already-launched');
    for (const e of skipped) {
      const v = e.verdictProduction as { firstEntryId: string; subject: string };
      expect(five).toContain(v.firstEntryId);
      expect(typeof v.subject).toBe('string');
    }
  });

  test('CONTROL: five entries with --no-verdict spend NOTHING, and are not `already-launched`', () => {
    const { entries, runs, launches } = producerFixture('mc-prod-fanout-optout-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'never reached' }, 0),
      ids: ['a', 'b', 'c', 'd', 'e'],
      args: ['--no-verdict'],
    });
    expect(runs).toBe(0);
    expect(launches).toBe(5);
    // DEDUPE MUST NOT SWALLOW THE OPT-OUT: these are declined, not ridden on someone else's launch.
    for (const e of resolveDispatchStates(entries)) expect(e.verdictProduction?.state).toBe('not-asked');
  });

  // ── F1 · THE POST-LAUNCH POSITION, ASSERTED RATHER THAN DISCLOSED ───────────────────────

  test('the producer runs AFTER the launch \u2014 order read off one shared log', () => {
    const { lines } = producerFixture('mc-prod-order-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'r' }, 0),
    });
    // BOTH MUST BE PRESENT, or an order assertion over an empty log is vacuous.
    expect(lines.filter((l) => l.startsWith('launch')).length).toBe(1);
    expect(lines.filter((l) => l.startsWith('run')).length).toBe(1);
    expect(lines.findIndex((l) => l.startsWith('launch')))
      .toBeLessThan(lines.findIndex((l) => l.startsWith('run')));
  });

  // ── F3 · THE TERMINAL RECORD IS DURABLE BEFORE THE PANEL WINDOW OPENS ───────────────────

  test('the producer sees a SETTLED entry, not `running` \u2014 so an interrupted run cannot re-dispatch', () => {
    const { lines, entry } = producerFixture('mc-prod-order-record-', {
      router: ROUTER(),
      producer: PRODUCER({ outcome: 'PRODUCED', reason: 'r' }, 0),
    });
    const observed = lines.find((l) => l.startsWith('run')) as string;
    // `running` HERE IS THE DEFECT: the entry would stay that way if the consumer died mid-panel,
    // `inFlight()` would reconcile the dead pid, and a later run would pay for a second panel.
    expect(observed).toContain('saw=exited-clean');
    expect(observed).not.toContain('saw=running');
    // AND THE FINAL LINE STILL CARRIES THE VERDICT: writing early must not lose the update.
    expect(entry.verdictProduction?.state).toBe('produced');
    expect(entry.status).toBe('exited-clean');
  });

  test('--dry-run states the spend WITHOUT making it — a dry run that misstates the real run is worse than none', () => {
    const dir = mkTmpDir('mc-prod-dry-');
    cleanupDirs.push(dir);
    const bin = path.join(dir, 'bin');
    const root = path.join(dir, 'root');
    const log = path.join(dir, 'producer-runs.log');
    fs.mkdirSync(bin, { recursive: true });
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
    installHarness(root);
    fs.writeFileSync(path.join(root, 'scripts', 'run-gate.mjs'), ROUTER());
    fs.writeFileSync(path.join(root, 'scripts', 'produce-verdict.mjs'), PRODUCER({ outcome: 'PRODUCED', reason: 'x' }, 0));
    fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'claude'), 0o755);
    const queue = path.join(dir, 'queue.jsonl');
    fs.writeFileSync(queue, JSON.stringify({
      id: 'dry', project: path.basename(REPO_ROOT), root, goal: 'g', enqueuedAt: 1_000, status: 'pending',
    }) + '\n');
    const out = execFileSync('bun', [CONSUMER, '--dry-run'], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: queue, MC_PRODUCER_LOG: log },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(out).toContain('verdict production');
    expect(fs.existsSync(log)).toBe(false);
    // AND THE OPT-OUT IS MIRRORED TOO, or the dry run describes only one of the two real paths.
    const out2 = execFileSync('bun', [CONSUMER, '--dry-run', '--no-verdict'], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MC_DISPATCH_QUEUE: queue, MC_PRODUCER_LOG: log },
      encoding: 'utf8', stdio: 'pipe',
    });
    expect(out2).toContain('DECLINED');
    expect(out2).not.toBe(out);
  });
});
