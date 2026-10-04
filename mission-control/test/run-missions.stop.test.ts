// test/run-missions.stop.test.ts — J2: stopping a running mission.
//
// The real runner is spawned with `--once`, MC_CLAUDE_BIN / MC_CODEX_BIN pointing at fake workers,
// and the "founder's click" is the same line the server appends: `stop_requested` on the board.
// The fakes FORK, because the property under test is that no grandchild survives a stop.
//
// Nothing here signals a pid it did not spawn: the only kills in this file are the cleanup of the
// fake workers' own recorded pids, and the signals the runner under test sends.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendMissionLine } from '../server/index-cache.ts';
import { STOP_REQUESTED, boardPath, foldBoard, readBoardLines, readEvents, foldTeam, type MissionLine } from '../server/missions.ts';
import { reconcileWorking } from '../scripts/run-missions.ts';

const RUNNER_TS = path.resolve(import.meta.dir, '..', 'scripts', 'run-missions.ts');
const ID = '11111111-1111-4111-8111-111111111111';
const ID2 = '22222222-2222-4222-8222-222222222222';

let dir: string;
let work: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-stop-'));
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-stop-work-'));
});
afterEach(() => {
  // Belt and braces: a failed test must not leave the fakes' sleepers running.
  for (const f of fs.readdirSync(work)) {
    if (!f.endsWith('.pids')) continue;
    for (const pid of Object.values(JSON.parse(fs.readFileSync(path.join(work, f), 'utf8')) as Record<string, number>)) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* already gone — the expected case */
      }
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(work, { recursive: true, force: true });
});

const board = () => boardPath(dir);
const put = (l: MissionLine) => appendMissionLine(l, board());
const waiting = (id: string): MissionLine => ({ id, ts: 1, status: 'waiting', title: 't', goal: 'g' });
const mission = (id: string) => foldBoard(readBoardLines(board())).find((m) => m.id === id)!;
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until<T>(what: string, f: () => T | undefined | false, ms = 15_000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = f();
    if (v) return v;
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

// A worker that forks one grandchild and then stays alive. FAKE_GC_MODE picks the grandchild:
//   plain    — sleeps
//   stubborn — ignores SIGTERM, so only the SIGKILL escalation can end it
// FAKE_GC_STDIO=inherit gives the grandchild the worker's stdout pipe, which holds the runner's
// `close` event open until the grandchild dies.
const FORKING_WORKER = (kind: 'claude' | 'codex') => `#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const stubborn = process.env.FAKE_GC_MODE === 'stubborn';
// The grandchild reports readiness once its signal handler is installed: a SIGTERM that lands
// during node's startup kills it by default and would make the "stubborn" case pass for nothing.
const ready = path.join(process.env.FAKE_DIR, '${kind}.ready');
const gc = spawn(process.execPath, ['-e', (stubborn ? 'process.on("SIGTERM", () => {});' : '') + 'require("node:fs").writeFileSync(' + JSON.stringify(ready) + ', "1"); setInterval(() => {}, 1000)'], {
  stdio: process.env.FAKE_GC_STDIO === 'inherit' ? ['ignore', 'inherit', 'inherit'] : 'ignore',
});
fs.writeFileSync(path.join(process.env.FAKE_DIR, '${kind}.pids'), JSON.stringify({ child: process.pid, grandchild: gc.pid }));
${kind === 'claude'
  ? `console.log(JSON.stringify({ type: 'system', subtype: 'init', model: 'fake', session_id: 's1' }));`
  : `console.log(JSON.stringify({ type: 'thread.started', thread_id: 'th1' }));`}
setInterval(() => {}, 1000);
`;

// A Builder that finishes normally (so the Referee is reached) and a Referee that never returns.
const QUICK_CLAUDE = `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync('out.md', 'hello');
const out = (o) => console.log(JSON.stringify(o));
out({ type: 'system', subtype: 'init', model: 'fake', session_id: 's1' });
out({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'Write', input: { file_path: 'out.md' } }] } });
out({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', is_error: false, content: 'ok' }] } });
out({ type: 'result', is_error: false, result: 'wrote out.md', total_cost_usd: 0.01, subtype: 'success' });
`;
const PASSING_CODEX = `#!/usr/bin/env node
require('node:fs').writeFileSync(require('node:path').join(process.env.FAKE_DIR, 'codex.ran'), '1');
console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'ok\\nVERDICT: {"verdict":"PASS","reasons":["ok"]}' } }));
`;
const MARKING_CLAUDE = `#!/usr/bin/env node
require('node:fs').writeFileSync(require('node:path').join(process.env.FAKE_DIR, 'claude.ran'), '1');
` + QUICK_CLAUDE.split('\n').slice(1).join('\n');

function mk(name: string, body: string): string {
  const f = path.join(work, name);
  fs.writeFileSync(f, body, { mode: 0o755 });
  return f;
}

/** Spawn the real runner; resolves with its exit code when it has settled its one mission. */
function startRunner(bins: { claude: string; codex: string }, env: Record<string, string> = {}) {
  const child = spawn(process.execPath, [RUNNER_TS, '--once', '--workdir', work, '--launch-log', path.join(work, 'launches.csv')], {
    env: { ...process.env, MC_MISSIONS_DIR: dir, MC_CLAUDE_BIN: bins.claude, MC_CODEX_BIN: bins.codex, FAKE_DIR: work, MC_STOP_GRACE_MS: '400', ...env },
    stdio: 'ignore',
  });
  const exited = new Promise<number | null>((resolve) => child.on('close', resolve));
  return { child, exited };
}
const pidsOf = (kind: 'claude' | 'codex') => {
  const f = path.join(work, `${kind}.pids`);
  if (!fs.existsSync(f) || !fs.existsSync(path.join(work, `${kind}.ready`))) return undefined;
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8')) as { child: number; grandchild: number };
  } catch {
    return undefined; // read between the open and the write: the next poll sees it whole
  }
};
const requestStop = (id: string) => put({ id, ts: Date.now(), status: STOP_REQUESTED });

describe('the runner stops a running mission', () => {
  test('Builder and its forked grandchild are gone, the card is stopped, no Referee runs, the lock is released', async () => {
    const bins = { claude: mk('fake-claude', FORKING_WORKER('claude')), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const { exited } = startRunner(bins);
    const pids = await until('builder pids', () => pidsOf('claude'));
    await until('working', () => mission(ID).status === 'working');
    expect(alive(pids.child) && alive(pids.grandchild)).toBe(true);

    requestStop(ID);
    expect(await exited).toBe(0);

    expect(mission(ID).status).toBe('stopped');
    expect(mission(ID).stopRequested).toBeUndefined();
    expect(alive(pids.child)).toBe(false);
    expect(alive(pids.grandchild)).toBe(false);
    expect(fs.existsSync(path.join(work, 'codex.ran'))).toBe(false);
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
    // `stopped` is its own terminal state: no verdict, no error, and the Referee never launched.
    expect(mission(ID).verdict).toBeUndefined();
    expect(mission(ID).error).toBeUndefined();
    const team = foldTeam(ID, readEvents(ID, dir));
    expect(team.agents.map((a) => [a.agent, a.status])).toEqual([['builder', 'stopped']]);
  }, 40_000);

  test('a grandchild that ignores SIGTERM and holds the stdout pipe is SIGKILLed after the grace, before `stopped` is written', async () => {
    const bins = { claude: mk('fake-claude', FORKING_WORKER('claude')), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const { exited } = startRunner(bins, { FAKE_GC_MODE: 'stubborn', FAKE_GC_STDIO: 'inherit' });
    const pids = await until('builder pids', () => pidsOf('claude'));
    await until('working', () => mission(ID).status === 'working');

    const t0 = Date.now();
    requestStop(ID);
    // The moment the board says stopped, nothing may still be running: stopped means gone.
    await until('stopped', () => mission(ID).status === 'stopped');
    expect(alive(pids.child)).toBe(false);
    expect(alive(pids.grandchild)).toBe(false);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(300); // it waited out the grace (400ms), not an instant kill
    expect(await exited).toBe(0);
  }, 40_000);

  test('stop during the Referee: the Referee and its grandchild are killed, the Builder card keeps its result, no verdict is recorded', async () => {
    const bins = { claude: mk('fake-claude', QUICK_CLAUDE), codex: mk('fake-codex', FORKING_WORKER('codex')) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const { exited } = startRunner(bins);
    const pids = await until('referee pids', () => pidsOf('codex'));
    requestStop(ID);
    expect(await exited).toBe(0);
    expect(mission(ID).status).toBe('stopped');
    expect(mission(ID).verdict).toBeUndefined();
    expect(alive(pids.child)).toBe(false);
    expect(alive(pids.grandchild)).toBe(false);
    const team = foldTeam(ID, readEvents(ID, dir));
    expect(team.agents.map((a) => [a.agent, a.status])).toEqual([
      ['builder', 'finished'],
      ['referee', 'stopped'],
    ]);
  }, 40_000);

  test('a queued mission stopped before it is claimed is never launched; the next mission still runs', async () => {
    const bins = { claude: mk('fake-claude', MARKING_CLAUDE), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    requestStop(ID);
    put(waiting(ID2));
    put({ id: ID2, ts: 3, status: 'queued' });
    const { exited } = startRunner(bins);
    expect(await exited).toBe(0);
    expect(mission(ID).status).toBe('stopped');
    expect(readEvents(ID, dir).some((e) => e.agent === 'builder')).toBe(false); // no Builder card: nothing was spawned for it
    expect(mission(ID2).status).toBe('done');
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
  }, 40_000);

  test('a stop request for a mission that already finished changes nothing', async () => {
    const bins = { claude: mk('fake-claude', QUICK_CLAUDE), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const { exited } = startRunner(bins);
    expect(await exited).toBe(0);
    requestStop(ID);
    expect(mission(ID)).toMatchObject({ status: 'done', verdict: 'PASS' });
    expect(mission(ID).stopRequested).toBeUndefined();
  }, 40_000);
});

describe('reconcile and fold', () => {
  const deadPid = () => {
    const r = Bun.spawnSync([process.execPath, '-e', '']);
    return r.pid;
  };

  test('a working card whose runner died AFTER a stop was requested goes to stopped, not back to waiting', () => {
    process.env.MC_MISSIONS_DIR = dir;
    try {
      put(waiting(ID));
      put({ id: ID, ts: 2, status: 'working', runnerPid: deadPid() });
      requestStop(ID);
      expect(reconcileWorking(dir)).toEqual([ID]);
      expect(mission(ID).status).toBe('stopped');
    } finally {
      delete process.env.MC_MISSIONS_DIR;
    }
  });

  test('the stop request survives the queued -> working claim and ends with the run', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    requestStop(ID);
    expect(mission(ID).stopRequested).toBe(true);
    put({ id: ID, ts: 4, status: 'working', runnerPid: 1 });
    expect(mission(ID)).toMatchObject({ status: 'working', stopRequested: true });
    put({ id: ID, ts: 5, status: 'stopped' });
    expect(mission(ID)).toMatchObject({ status: 'stopped' });
    expect(mission(ID).stopRequested).toBeUndefined();
  });

  test('a stop request never moves the status: one landing after `done` leaves it done', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'working' });
    put({ id: ID, ts: 3, status: 'done', verdict: 'PASS' });
    put({ id: ID, ts: 4, status: STOP_REQUESTED });
    expect(mission(ID)).toMatchObject({ status: 'done', verdict: 'PASS' });
    expect(mission(ID).stopRequested).toBeUndefined();
  });

  test('a stop request for an unknown id is dropped, like any line with no waiting origin', () => {
    put({ id: ID, ts: 1, status: STOP_REQUESTED });
    expect(foldBoard(readBoardLines(board()))).toEqual([]);
  });
});
