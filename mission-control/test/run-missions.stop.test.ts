// test/run-missions.stop.test.ts — J2: stopping a running mission.
//
// The real runner is spawned with `--once`, MC_CLAUDE_BIN / MC_CODEX_BIN pointing at fake workers,
// and the "founder's click" is the same line the server appends: `stop_requested` on the board.
// The fakes FORK, because the property under test is that no grandchild survives a stop.
//
// Nothing here signals a pid it did not spawn: the only kills in this file are the cleanup of the
// fake workers' own recorded pids, and the signals the runner under test sends.

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendMissionLine } from '../server/index-cache.ts';
import { decisionsPath, foldDecisions, readDecisionLines } from '../server/decisions.ts';
import { isInterrupted, withDecisions, type BuilderRound } from '../scripts/decisions.ts';
import { STOP_REQUESTED, boardPath, foldBoard, readBoardLines, readEvents, foldTeam, type MissionLine } from '../server/missions.ts';
import { childrenPath, isOurs, processIdentity, reapOrphanGroups, reconcileWorking, runMission, validChildRecord, type RunFn } from '../scripts/run-missions.ts';

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

// A Builder that leaves a background process behind and then finishes normally: the runner, not
// the worker, is responsible for what outlives the leader.
const STRAGGLER_CLAUDE = QUICK_CLAUDE.replace(
  "const fs = require('node:fs');",
  `const fs = require('node:fs');
const bg = require('node:child_process').spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
bg.unref(); // else the worker's own event loop waits for it and the leader never exits
fs.writeFileSync(require('node:path').join(process.env.FAKE_DIR, 'claude.pids'), JSON.stringify({ child: process.pid, grandchild: bg.pid }));`,
);

describe('the runner itself shuts down', () => {
  const CODES = { SIGINT: 130, SIGHUP: 129, SIGTERM: 143 } as const;
  test.each(['SIGINT', 'SIGHUP', 'SIGTERM'] as const)(
    '%s with two queued missions: no child survives, mission 1 is stopped (not failed), mission 2 is never launched, locks are released',
    async (sig) => {
      const bins = { claude: mk('fake-claude', FORKING_WORKER('claude')), codex: mk('fake-codex', PASSING_CODEX) };
      put(waiting(ID));
      put({ id: ID, ts: 2, status: 'queued' });
      put(waiting(ID2));
      put({ id: ID2, ts: 3, status: 'queued' });
      const { child, exited } = startRunner(bins, { FAKE_GC_MODE: 'stubborn' });
      const pids = await until('builder pids', () => pidsOf('claude'));
      await until('working', () => mission(ID).status === 'working');

      child.kill(sig);
      expect(await exited).toBe(CODES[sig]);

      expect(alive(pids.child)).toBe(false);
      expect(alive(pids.grandchild)).toBe(false);
      expect(mission(ID).status).toBe('stopped');
      expect(mission(ID).error).toBeUndefined();
      expect(mission(ID2).status).toBe('queued'); // never claimed, never launched
      expect(readEvents(ID2, dir)).toEqual([]);
      expect(pidsOf('claude')!.child).toBe(pids.child); // the Builder was spawned once, for mission 1 only
      expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
      expect(fs.existsSync(path.join(dir, ID2, 'runner.lock'))).toBe(false);
      expect(fs.existsSync(path.join(work, 'codex.ran'))).toBe(false);
    },
    40_000,
  );
});

describe('a SIGKILLed runner does not orphan its worker groups', () => {
  test('reconcile + reap kills the recorded group (leader and grandchild) of the dead runner', async () => {
    const bins = { claude: mk('fake-claude', FORKING_WORKER('claude')), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const { child, exited } = startRunner(bins);
    const pids = await until('builder pids', () => pidsOf('claude'));
    await until('working', () => mission(ID).status === 'working');
    child.kill('SIGKILL');
    await exited;
    // The premise: nothing the dead runner could do is left to clean up, so they are still running.
    expect(alive(pids.child) && alive(pids.grandchild)).toBe(true);

    expect(reconcileWorking(dir)).toEqual([ID]);
    expect(await reapOrphanGroups(ID, dir)).toEqual([pids.child]);
    expect(alive(pids.child)).toBe(false);
    expect(alive(pids.grandchild)).toBe(false);
    // And it is recorded as handled, so a second pass signals nothing.
    expect(await reapOrphanGroups(ID, dir)).toEqual([]);
  }, 40_000);

  test('a recorded group whose leader pid now belongs to a different process is NOT signalled; the same record with the true identity is', async () => {
    const bystander = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    try {
      const pid = bystander.pid!;
      const truth = await until('bystander identity', () => processIdentity(pid) ?? undefined);
      fs.mkdirSync(path.join(dir, ID), { recursive: true });
      const record = (identity: string | null) =>
        fs.appendFileSync(childrenPath(ID, dir), JSON.stringify({ ts: 1, pgid: pid, identity, role: 'builder', runner: 1 }) + '\n');

      record('Thu Jan  1 00:00:00 1970'); // a pgid that was reused: same number, different process
      expect(await reapOrphanGroups(ID, dir)).toEqual([]);
      expect(alive(pid)).toBe(true);

      record(truth);
      expect(await reapOrphanGroups(ID, dir)).toEqual([pid]);
      await until('bystander gone', () => !alive(pid));
    } finally {
      try {
        process.kill(bystander.pid!, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }, 40_000);
});

// ── the reaper reads a file; a file can be forged, stale, or about a process that is not ours ──
//
// The reaper runs in a DETACHED child bun: a bug that signals pgid 0 kills its own group, and that
// must be the harness's group, not the test runner's. Every case plants a live bystander (its own
// group, sleeping) and asserts it is untouched, so "nothing was signalled" is observed, not inferred.

const REAPER_HARNESS = `
  import fs from 'node:fs';
  import { reapOrphanGroups, childrenPath, processIdentity } from ${JSON.stringify(RUNNER_TS)};
  const [dir, id, mode] = process.argv.slice(1);
  if (mode === 'own') {
    // A record naming the reaper's own process (valid identity and all), as a forger would write it.
    fs.mkdirSync(childrenPath(id, dir).replace(/[^/]+$/, ''), { recursive: true });
    fs.appendFileSync(childrenPath(id, dir), JSON.stringify({ pgid: process.pid, identity: processIdentity(process.pid), runner: 1 }) + '\\n');
  }
  console.log(JSON.stringify(await reapOrphanGroups(id, dir)));
`;

function reapInHarness(mode = ''): Promise<{ code: number | null; signal: string | null; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', REAPER_HARNESS, dir, ID, mode], { detached: true, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (d: Buffer) => (out += d.toString('utf8')));
    // the reaper logs its warnings to stdout too; the result is the last line
    child.on('close', (code, signal) => resolve({ code, signal, out: out.trim().split('\n').at(-1) ?? '' }));
  });
}

describe('the reaper never signals on a forged, stale or leaderless record', () => {
  let bystander: ReturnType<typeof spawn>;
  let B: number;
  beforeEach(() => {
    bystander = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    B = bystander.pid!;
  });
  afterEach(() => {
    try {
      process.kill(B, 'SIGKILL');
    } catch {
      /* already gone */
    }
  });
  const plant = (rec: Record<string, unknown>) => {
    fs.mkdirSync(path.join(dir, ID), { recursive: true });
    fs.appendFileSync(childrenPath(ID, dir), JSON.stringify({ ts: 1, role: 'builder', runner: 1, ...rec }) + '\n');
  };

  test.each([
    ['a negative pgid aimed at a bystander pid (kill(-(-B)) would hit B itself)', (b: number, truth: string) => ({ pgid: -b, identity: truth })],
    ['pgid 0 (kill(-0) is the reaper\'s own group)', (_b: number, truth: string) => ({ pgid: 0, identity: truth })],
    ['a null identity', (b: number) => ({ pgid: b, identity: null })],
    ['an empty identity', (b: number) => ({ pgid: b, identity: '' })],
    ['a non-string identity', (b: number) => ({ pgid: b, identity: 123 })],
    ['an identity that does not match the live leader (a reused pgid)', (b: number) => ({ pgid: b, identity: 'Thu Jan  1 00:00:00 1970' })],
    ['a fractional pgid', (b: number) => ({ pgid: b + 0.5, identity: 'x' })],
    ['a string pgid', (b: number, truth: string) => ({ pgid: String(b), identity: truth })],
  ])('%s: nothing is signalled and the bystander lives', async (_name, make) => {
    const truth = await until('bystander identity', () => processIdentity(B) ?? undefined);
    plant(make(B, truth));
    const r = await reapInHarness();
    expect([r.code, r.signal, r.out]).toEqual([0, null, '[]']);
    expect(alive(B)).toBe(true);
  }, 30_000);

  test("a record naming the reaper's own pid (own group) is refused: the harness survives", async () => {
    const r = await reapInHarness('own');
    expect([r.code, r.signal, r.out]).toEqual([0, null, '[]']);
  }, 30_000);

  test('a LEADERLESS group is not signalled: the leader exited, a member remains, the record is real', async () => {
    const leader = spawn(
      process.execPath,
      ['-e', `const c = require('node:child_process').spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' }); c.unref(); console.log(c.pid); setTimeout(() => process.exit(0), 400);`],
      { detached: true, stdio: ['ignore', 'pipe', 'inherit'] },
    );
    let out = '';
    leader.stdout!.on('data', (d: Buffer) => (out += d.toString('utf8')));
    const identity = await until('leader identity', () => processIdentity(leader.pid!) ?? undefined);
    const member = await until('member pid', () => (/^\d+/.test(out) ? Number(out.trim().split('\n')[0]) : undefined));
    try {
      await new Promise((r) => leader.on('close', r));
      expect(processIdentity(leader.pid!)).toBeNull(); // the premise: no leader process any more...
      expect(() => process.kill(-leader.pid!, 0)).not.toThrow(); // ...and a group that still has a member
      expect(alive(member)).toBe(true);
      plant({ pgid: leader.pid!, identity }); // a genuine record: right pgid, right identity, but no leader to match it against
      const r = await reapInHarness();
      expect([r.code, r.signal, r.out]).toEqual([0, null, '[]']);
      expect(alive(member)).toBe(true);
    } finally {
      try {
        process.kill(member, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }, 30_000);
});

describe('isOurs — a live group whose leader has exited', () => {
  const live = (pgid: number, over: Partial<Parameters<typeof isOurs>[0]> = {}) => ({ pgid, identity: null, kind: 'live' as const, leaderExited: true, pinned: false, ...over });

  test('while the leader is unreaped it is ours without asking the OS', () => {
    expect(isOurs(live(4_000_000, { leaderExited: false }))).toBe(true);
  });

  test('leader exited and the group was NOT seen non-empty at that instant: never ours, even if a group with that number exists now', () => {
    const b = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    try {
      expect(() => process.kill(-b.pid!, 0)).not.toThrow(); // a real, live group under that number
      expect(isOurs(live(b.pid!))).toBe(false);
    } finally {
      process.kill(b.pid!, 'SIGKILL');
    }
  });

  test('pinned while members remain; the first empty look un-pins it for good, even if the number is then taken', async () => {
    const b = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    const g = live(b.pid!, { pinned: true });
    expect(isOurs(g)).toBe(true);
    process.kill(b.pid!, 'SIGKILL');
    await new Promise((r) => b.on('close', r));
    expect(isOurs(g)).toBe(false);
    expect(g.pinned).toBe(false);
    const again = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    try {
      g.pgid = again.pid!; // the number comes back as a different group: still not ours
      expect(isOurs(g)).toBe(false);
    } finally {
      process.kill(again.pid!, 'SIGKILL');
    }
  });
});

describe('validChildRecord', () => {
  const ok = { pgid: 4242, identity: 'Sat Oct  4 10:00:00 2026' };
  test('accepts a plain record', () => expect(validChildRecord(ok, 1000, 999)).toBe(true));
  test.each([0, 1, -1, -4242, 1.5, Number.NaN, Infinity, 2 ** 53, '4242', null, undefined, 1000, 999])('refuses pgid %p (also: own pid 1000, own pgid 999)', (pgid) => {
    expect(validChildRecord({ ...ok, pgid }, 1000, 999)).toBe(false);
  });
  test.each([null, '', '   ', 7, {}, undefined])('refuses identity %p', (identity) => {
    expect(validChildRecord({ ...ok, identity }, 1000, 999)).toBe(false);
  });
});

describe('a worker that leaves a process behind and exits normally', () => {
  test('the runner terminates the straggler: the leader exiting is not the group being empty', async () => {
    const bins = { claude: mk('fake-claude', STRAGGLER_CLAUDE), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const { exited } = startRunner(bins);
    expect(await exited).toBe(0);
    expect(mission(ID).status).toBe('done');
    const pids = pidsOf('claude') ?? JSON.parse(fs.readFileSync(path.join(work, 'claude.pids'), 'utf8'));
    expect(alive(pids.grandchild)).toBe(false);
  }, 40_000);
});

// ── a Stop while the runner is waiting on a Decision ─────────────────────────────────────────
//
// Nothing is running during the wait, so the stop watcher has no process group to signal: the wait
// itself must notice. It must end promptly (not at the decision timeout), expire the question so it
// leaves "pending", leave the card for settleIfStopped (not put it back on Waiting), and not resume
// the Builder.

// A Builder that finishes cleanly and ends on a DECISION line, counting its launches.
const ASKING_CLAUDE = `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync(require('node:path').join(process.env.FAKE_DIR, 'claude.runs'), 'x');
const out = (o) => console.log(JSON.stringify(o));
out({ type: 'system', subtype: 'init', model: 'fake', session_id: 's1' });
out({ type: 'result', is_error: false, result: 'Need a choice.\\nDECISION: Which format? || markdown | plain', total_cost_usd: 0.01, subtype: 'success' });
`;
const runs = () => (fs.existsSync(path.join(work, 'claude.runs')) ? fs.readFileSync(path.join(work, 'claude.runs'), 'utf8').length : 0);
const decisions = () => foldDecisions(readDecisionLines(decisionsPath()));

describe('Stop while waiting on a Decision', () => {
  const setup = () => {
    process.env.MC_MISSIONS_DIR = dir; // decisionsPath() follows the board
    const bins = { claude: mk('fake-claude', ASKING_CLAUDE), codex: mk('fake-codex', PASSING_CODEX) };
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    return bins;
  };
  afterEach(() => {
    delete process.env.MC_MISSIONS_DIR;
  });

  test('the wait ends promptly (not at the 10-minute decision timeout), the question is expired, the card is stopped, the Builder is not resumed', async () => {
    const bins = setup();
    const { exited } = startRunner(bins, { MC_DECISION_TIMEOUT_MS: '600000' });
    await until('pending decision', () => decisions().find((d) => d.status === 'pending'));
    expect(mission(ID).status).toBe('working');

    const t0 = Date.now();
    requestStop(ID);
    expect(await exited).toBe(0);
    expect(Date.now() - t0).toBeLessThan(8_000);

    expect(mission(ID).status).toBe('stopped');
    expect(mission(ID).error).toBeUndefined(); // not decision_timeout, and not put back on Waiting first
    expect(readBoardLines(board()).filter((l) => l.status === 'waiting')).toHaveLength(1); // only the creation line
    expect(decisions().map((d) => d.status)).toEqual(['expired']);
    expect(runs()).toBe(1); // asked once; never resumed
    expect(fs.existsSync(path.join(work, 'codex.ran'))).toBe(false);
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
  }, 40_000);

  test('SIGINT during the wait: same outcome, exit 130', async () => {
    const bins = setup();
    const { child, exited } = startRunner(bins, { MC_DECISION_TIMEOUT_MS: '600000' });
    await until('pending decision', () => decisions().find((d) => d.status === 'pending'));
    child.kill('SIGINT');
    expect(await exited).toBe(130);
    expect(mission(ID).status).toBe('stopped');
    expect(decisions().map((d) => d.status)).toEqual(['expired']);
    expect(runs()).toBe(1);
  }, 40_000);
});

describe('Stop while waiting on a Decision — the board cannot be read afterwards', () => {
  afterEach(() => {
    delete process.env.MC_MISSIONS_DIR;
  });

  test('the card still settles `stopped`: the interrupt is a returned value, not something the caller re-reads the board to learn', async () => {
    process.env.MC_MISSIONS_DIR = dir;
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const launched: string[] = [];
    const run: RunFn = async (bin, _args, _cwd, onLine) => {
      launched.push(bin.includes('codex') ? 'codex' : 'claude');
      onLine(JSON.stringify({ type: 'system', subtype: 'init', model: 'fake', session_id: 's1' }));
      onLine(JSON.stringify({ type: 'result', is_error: false, result: 'Need a choice.\nDECISION: Which format? || markdown | plain', total_cost_usd: 0.01, subtype: 'success' }));
      return { code: 0, stderr: '' };
    };
    // From the moment withDecisions has expired the question, every read of the board fails. Writes still
    // work, which is exactly the state that left a card `working` for ever.
    const realRead = fs.readFileSync;
    const spy = spyOn(fs, 'readFileSync').mockImplementation(((p: unknown, ...rest: unknown[]) => {
      if (p === board() && fs.existsSync(decisionsPath()) && realRead(decisionsPath(), 'utf8').includes('decision_expired')) {
        throw Object.assign(new Error('EIO: simulated board read failure'), { code: 'EIO' });
      }
      return (realRead as (...a: unknown[]) => unknown)(p, ...rest);
    }) as typeof fs.readFileSync);
    try {
      const done = runMission(mission(ID), { run, logLaunch: () => {} });
      await until('pending decision', () => decisions().find((d) => d.status === 'pending'));
      requestStop(ID);
      await done;
    } finally {
      spy.mockRestore();
    }
    expect(decisions().map((d) => d.status)).toEqual(['expired']);
    expect(mission(ID).status).toBe('stopped');
    expect(launched).toEqual(['claude']); // asked once, never resumed, no Referee
  }, 30_000);
});

describe('withDecisions — interrupted', () => {
  const round = (summary: string): BuilderRound => ({ ok: true, refused: false, files: [], summary });
  const clock = () => {
    let t = 1_000_000;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };

  test('interrupted mid-wait: {interrupted}, question expired, NO waiting line written, Builder not resumed', async () => {
    process.env.MC_MISSIONS_DIR = dir;
    try {
      put(waiting(ID));
      put({ id: ID, ts: 2, status: 'working' });
      const file = decisionsPath();
      let n = 0;
      let polls = 0;
      const out = await withDecisions(ID, async () => (n++, round('DECISION: q? || a | b')), {
        file, pollMs: 1000, timeoutMs: 600_000, ...clock(), interrupted: () => ++polls > 3,
      });
      expect(out).toEqual({ interrupted: true });
      expect(isInterrupted(out)).toBe(true);
      expect(n).toBe(1);
      expect(foldDecisions(readDecisionLines(file)).map((d) => d.status)).toEqual(['expired']);
      expect(readBoardLines(board()).map((l) => l.status)).toEqual(['waiting', 'working']); // the card is the caller's to settle
    } finally {
      delete process.env.MC_MISSIONS_DIR;
    }
  });

  test('answered, then interrupted before the resume: the Builder is not relaunched', async () => {
    process.env.MC_MISSIONS_DIR = dir;
    try {
      put(waiting(ID));
      put({ id: ID, ts: 2, status: 'working' });
      const file = decisionsPath();
      let n = 0;
      let stopped = false;
      const c = clock();
      const out = await withDecisions(ID, async () => (n++, round('DECISION: q? || a | b')), {
        file, pollMs: 1000, timeoutMs: 600_000, now: c.now,
        sleep: async (ms) => {
          await c.sleep(ms);
          const d = foldDecisions(readDecisionLines(file))[0]!;
          appendMissionLine({ type: 'decision_answered', id: d.id, choice: 'a', by: 'founder', at: 1 }, file);
          stopped = true; // the stop lands in the same breath as the answer
        },
        interrupted: () => stopped,
      });
      expect(out).toEqual({ interrupted: true });
      expect(n).toBe(1);
    } finally {
      delete process.env.MC_MISSIONS_DIR;
    }
  });
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

  test('the error-clear on a new attempt and the stop request coexist: a relaunched card keeps stopRequested, loses the old error, and ends stopped with none', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'waiting', error: 'refused_subagent' });
    put({ id: ID, ts: 3, status: 'queued' });
    expect(mission(ID).error).toBeUndefined();
    requestStop(ID);
    put({ id: ID, ts: 5, status: 'working', runnerPid: 1 });
    expect(mission(ID)).toMatchObject({ status: 'working', stopRequested: true });
    expect(mission(ID).error).toBeUndefined();
    put({ id: ID, ts: 6, status: 'stopped' });
    expect(mission(ID)).toMatchObject({ status: 'stopped' });
    expect(mission(ID).error).toBeUndefined();
    expect(mission(ID).stopRequested).toBeUndefined();
  });

  test('a relaunch starts a clean attempt: the cost a refused run left on the card does not survive into the next one', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'working' });
    put({ id: ID, ts: 3, status: 'waiting', error: 'refused_subagent', costUsd: 0.42 });
    expect(mission(ID)).toMatchObject({ status: 'waiting', costUsd: 0.42 }); // the refused card still shows what it cost
    put({ id: ID, ts: 4, status: 'queued' });
    expect(mission(ID).costUsd).toBeUndefined();
    put({ id: ID, ts: 5, status: 'working', runnerPid: 1 });
    put({ id: ID, ts: 6, status: 'done', verdict: 'PASS' }); // a final line that carries no cost
    expect(mission(ID)).toMatchObject({ status: 'done', verdict: 'PASS' });
    expect(mission(ID).costUsd).toBeUndefined();
    put({ id: ID, ts: 7, status: 'failed', costUsd: 0.1 });
    expect(mission(ID).costUsd).toBe(0.1); // a line that does carry one still sets it
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
