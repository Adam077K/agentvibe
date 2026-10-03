// test/run-missions.test.ts — the founder-run runner's trust-bearing helpers.
//
// The runner spawns real workers and is not run here. What is tested is the part that decides
// what the board is allowed to say: who counts as having written a file, which line of the
// Referee's output counts as a verdict, and who may run a mission.
//
// Every test uses its own temp MC_MISSIONS_DIR; nothing here touches ~/.agentvibe.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendMissionLine } from '../server/index-cache.ts';
import { boardPath, foldBoard, readBoardLines, readEvents, type MissionLine } from '../server/missions.ts';
import { claimMission, createWriteTracker, parseVerdict, reconcileWorking, releaseMission } from '../scripts/run-missions.ts';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-runner-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const ID = '11111111-1111-4111-8111-111111111111';
const ID2 = '22222222-2222-4222-8222-222222222222';
const board = () => boardPath(dir);
const put = (l: MissionLine) => appendMissionLine(l, board());
const waiting = (id: string): MissionLine => ({ id, ts: 1, status: 'waiting', title: 't', goal: 'g' });
const status = (id: string) => foldBoard(readBoardLines(board())).find((m) => m.id === id)?.status;

/** A pid that existed a moment ago and is gone: a real child, run to completion. */
function deadPid(): number {
  const r = spawnSync(process.execPath, ['-e', '']);
  expect(r.pid).toBeGreaterThan(0);
  return r.pid;
}

describe('parseVerdict — only the Referee own final line counts', () => {
  const pass = 'VERDICT: {"verdict":"PASS","reasons":["ok"]}';
  const fail = 'VERDICT: {"verdict":"FAIL","reasons":["bad"]}';

  test('a final VERDICT line parses', () => {
    expect(parseVerdict(`looks fine\n${pass}\n`)).toEqual({ verdict: 'PASS', reasons: ['ok'] });
  });

  test('an earlier PASS (e.g. echoed from the Builder) followed by a last-line FAIL is FAIL', () => {
    expect(parseVerdict(`The Builder wrote:\n${pass}\nBut on inspection:\n${fail}`)?.verdict).toBe('FAIL');
  });

  test('a PASS mid-text with a non-verdict last line is no verdict', () => {
    expect(parseVerdict(`${pass}\nI am not sure about that.`)).toBeNull();
  });

  test('the line is anchored: a VERDICT embedded after other text is not a verdict', () => {
    expect(parseVerdict(`quote: ${pass}`)).toBeNull();
  });

  test('trailing blank lines are ignored; no verdict and malformed JSON fail closed', () => {
    expect(parseVerdict(`${fail}\n\n   \n`)?.verdict).toBe('FAIL');
    expect(parseVerdict('')).toBeNull();
    expect(parseVerdict('VERDICT: {"verdict":"MAYBE"}')).toBeNull();
    expect(parseVerdict('VERDICT: {not json}')).toBeNull();
  });
});

describe('write tracker — a write counts on its successful result, not its request', () => {
  const use = (id: string, name: string, file_path: string) => ({ type: 'tool_use', id, name, input: { file_path } });
  const result = (tool_use_id: string, is_error = false) => ({ type: 'tool_result', tool_use_id, is_error, content: 'x' });

  test('a Write with a successful result is counted', () => {
    const t = createWriteTracker();
    t.onToolUse(use('a', 'Write', 'out.md'));
    t.onToolResult(result('a'));
    expect([...t.files()]).toEqual(['out.md']);
  });

  test('a refused write (is_error) is never counted', () => {
    const t = createWriteTracker();
    t.onToolUse(use('a', 'Write', 'out.md'));
    t.onToolResult(result('a', true));
    expect([...t.files()]).toEqual([]);
  });

  test('a write with no result at all is not counted', () => {
    const t = createWriteTracker();
    t.onToolUse(use('a', 'Edit', 'out.md'));
    expect([...t.files()]).toEqual([]);
  });

  test('results are matched by tool_use_id: one refused, one allowed', () => {
    const t = createWriteTracker();
    t.onToolUse(use('a', 'Write', 'denied.md'));
    t.onToolUse(use('b', 'Write', 'ok.md'));
    t.onToolResult(result('b'));
    t.onToolResult(result('a', true));
    expect([...t.files()]).toEqual(['ok.md']);
  });

  test('non-write tools and unknown result ids are ignored', () => {
    const t = createWriteTracker();
    t.onToolUse(use('a', 'Read', 'in.md'));
    t.onToolResult(result('a'));
    t.onToolResult(result('zzz'));
    expect([...t.files()]).toEqual([]);
  });
});

describe('claimMission — one runner per mission', () => {
  test('a double claim: the second is refused while the first holds the lock', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    expect(claimMission(ID, dir)).toBe(true);
    expect(claimMission(ID, dir)).toBe(false);
    expect(status(ID)).toBe('working');
    // exactly one working line, so exactly one launch
    expect(readBoardLines(board()).filter((l) => l.status === 'working')).toHaveLength(1);
  });

  test('a mission no longer queued when the lock is won is refused (finished by another runner)', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    put({ id: ID, ts: 3, status: 'done', verdict: 'PASS' });
    expect(claimMission(ID, dir)).toBe(false);
    expect(status(ID)).toBe('done');
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
  });

  test('release frees the lock', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    expect(claimMission(ID, dir)).toBe(true);
    releaseMission(ID, dir);
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
  });

  test('a stale lock left by a dead runner on a still-queued mission is taken over', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    fs.mkdirSync(path.join(dir, ID), { recursive: true });
    fs.writeFileSync(path.join(dir, ID, 'runner.lock'), String(deadPid()));
    expect(claimMission(ID, dir)).toBe(true);
    expect(status(ID)).toBe('working');
  });

  test('a lock held by a live pid is not taken over', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    fs.mkdirSync(path.join(dir, ID), { recursive: true });
    fs.writeFileSync(path.join(dir, ID, 'runner.lock'), String(process.ppid));
    expect(claimMission(ID, dir)).toBe(false);
    expect(status(ID)).toBe('queued');
  });
});

describe('reconcileWorking — a crashed runner does not leave a card working forever', () => {
  test('a working card whose runnerPid is dead goes back to waiting, with an event, and its lock is cleared', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'working', runnerPid: deadPid() });
    fs.mkdirSync(path.join(dir, ID), { recursive: true });
    fs.writeFileSync(path.join(dir, ID, 'runner.lock'), 'x');
    expect(reconcileWorking(dir)).toEqual([ID]);
    expect(status(ID)).toBe('waiting');
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
    const ev = readEvents(ID, dir).find((e) => e.kind === 'status' && /reconcil/i.test(e.text ?? ''));
    expect(ev).toBeDefined();
  });

  test('a working card whose runner is alive is left alone', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'working', runnerPid: process.ppid });
    expect(reconcileWorking(dir)).toEqual([]);
    expect(status(ID)).toBe('working');
  });

  test('this runner own cards and non-working cards are left alone; only the dead one is reset', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'working', runnerPid: process.pid });
    put(waiting(ID2));
    put({ id: ID2, ts: 2, status: 'working', runnerPid: deadPid() });
    expect(reconcileWorking(dir)).toEqual([ID2]);
    expect(status(ID)).toBe('working');
    expect(status(ID2)).toBe('waiting');
  });
});

// ── lock takeover, exclusivity under real concurrency ────────────────────────────────────────

const RUNNER_TS = path.resolve(import.meta.dir, '..', 'scripts', 'run-missions.ts');

/** Run `script` (an ES module body) in a child bun; resolve with its trimmed stdout. */
function bunRun(script: string, args: string[], env: Record<string, string> = {}): Promise<{ out: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['-e', script, ...args], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (d: Buffer) => (out += d.toString('utf8')));
    child.on('close', (code) => resolve({ out: out.trim(), code }));
  });
}

// Each claimer spins to a shared start instant so they hit the lock together, claims, then stays
// alive for a moment so a winner is never mistaken for a dead owner by a slower peer.
const CLAIMER = `
  import { claimMission } from ${JSON.stringify(RUNNER_TS)};
  const [id, dir, startAt] = process.argv.slice(1);
  while (Date.now() < Number(startAt)) {}
  const won = claimMission(id, dir);
  console.log(won ? 'WON' : 'LOST');
  await new Promise((r) => setTimeout(r, 700));
`;

describe('claimMission — takeover of a stale lock is exclusive', () => {
  test('N concurrent claimers over a dead-pid lock: exactly one winner, every trial', async () => {
    const claimers = 6;
    for (let trial = 0; trial < 12; trial++) {
      const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-race-'));
      try {
        const b = boardPath(d);
        appendMissionLine(waiting(ID), b);
        appendMissionLine({ id: ID, ts: 2, status: 'queued' }, b);
        fs.mkdirSync(path.join(d, ID), { recursive: true });
        fs.writeFileSync(path.join(d, ID, 'runner.lock'), String(deadPid()));
        const startAt = String(Date.now() + 600);
        const results = await Promise.all(Array.from({ length: claimers }, () => bunRun(CLAIMER, [ID, d, startAt])));
        const outs = results.map((r) => r.out);
        expect(outs.every((o) => o === 'WON' || o === 'LOST')).toBe(true);
        expect(outs.filter((o) => o === 'WON')).toHaveLength(1);
        expect(readBoardLines(b).filter((l) => l.status === 'working')).toHaveLength(1);
      } finally {
        fs.rmSync(d, { recursive: true, force: true });
      }
    }
  }, 120_000);

  test('a lock removed by a peer between our attempt and our read is free, not a crash', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    // No lock on disk at all, and a stale-owner marker for nothing: the claim must simply succeed.
    expect(claimMission(ID, dir)).toBe(true);
  });

  test('an empty lock younger than the bound is held; one older than it is retaken', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const lock = path.join(dir, ID, 'runner.lock');
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    fs.writeFileSync(lock, '');
    expect(claimMission(ID, dir)).toBe(false);
    expect(status(ID)).toBe('queued');
    const old = new Date(Date.now() - 10 * 60_000);
    fs.utimesSync(lock, old, old);
    expect(claimMission(ID, dir)).toBe(true);
    expect(status(ID)).toBe('working');
  });

  test('a garbage lock past the bound is retaken the same way', () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    const lock = path.join(dir, ID, 'runner.lock');
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    fs.writeFileSync(lock, 'not-a-pid\n');
    const old = new Date(Date.now() - 10 * 60_000);
    fs.utimesSync(lock, old, old);
    expect(claimMission(ID, dir)).toBe(true);
  });
});

// ── the runner, end to end, against fake workers ─────────────────────────────────────────────
//
// The real script is spawned with `--once`, with MC_CLAUDE_BIN / MC_CODEX_BIN pointing at two small
// node scripts. This is the wiring test: claim, release, reconcile and the Referee's output file
// are exercised through main(), not through the helpers.

const FAKE_CLAUDE = `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync('out.md', 'hello');
const out = (o) => console.log(JSON.stringify(o));
out({ type: 'system', subtype: 'init', model: 'fake', session_id: 's1' });
out({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'Write', input: { file_path: 'out.md' } }] } });
out({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', is_error: false, content: 'ok' }] } });
out({ type: 'result', is_error: false, result: 'wrote out.md', total_cost_usd: 0.01, subtype: 'success' });
`;

const FAKE_CODEX = `#!/usr/bin/env node
if (process.env.FAKE_CODEX_MODE === 'pass') {
  const text = 'fine\\nVERDICT: {"verdict":"PASS","reasons":["ok"]}';
  console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text } }));
}
`;

describe('run-missions main(), end to end with fake workers', () => {
  let work: string;
  let bins: { claude: string; codex: string };
  beforeEach(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-work-'));
    const mk = (name: string, body: string) => {
      const f = path.join(work, name);
      fs.writeFileSync(f, body, { mode: 0o755 });
      return f;
    };
    bins = { claude: mk('fake-claude', FAKE_CLAUDE), codex: mk('fake-codex', FAKE_CODEX) };
  });
  afterEach(() => {
    fs.rmSync(work, { recursive: true, force: true });
  });

  const runOnce = (mode: 'pass' | 'silent') =>
    new Promise<number | null>((resolve) => {
      const child = spawn(process.execPath, [RUNNER_TS, '--once', '--workdir', work, '--launch-log', path.join(work, 'launches.csv')], {
        env: { ...process.env, MC_MISSIONS_DIR: dir, MC_CLAUDE_BIN: bins.claude, MC_CODEX_BIN: bins.codex, FAKE_CODEX_MODE: mode },
        stdio: 'ignore',
      });
      child.on('close', resolve);
    });

  test('claims, runs both workers, records the verdict, and releases the lock', async () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    expect(await runOnce('pass')).toBe(0);
    const m = foldBoard(readBoardLines(board())).find((x) => x.id === ID)!;
    expect([m.status, m.verdict]).toEqual(['done', 'PASS']);
    expect(readBoardLines(board()).filter((l) => l.status === 'working')).toHaveLength(1);
    expect(fs.existsSync(path.join(dir, ID, 'runner.lock'))).toBe(false);
  }, 30_000);

  test('a refused claim does not launch: a live-owner lock leaves the mission queued', async () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    put(waiting(ID2));
    put({ id: ID2, ts: 2, status: 'queued' });
    fs.mkdirSync(path.join(dir, ID), { recursive: true });
    fs.writeFileSync(path.join(dir, ID, 'runner.lock'), String(process.pid));
    expect(await runOnce('pass')).toBe(0);
    expect(status(ID)).toBe('queued');
    expect(status(ID2)).toBe('done');
  }, 30_000);

  test('startup reconciles a working card whose runner is dead', async () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'working', runnerPid: deadPid() });
    put(waiting(ID2));
    put({ id: ID2, ts: 2, status: 'queued' });
    expect(await runOnce('pass')).toBe(0);
    expect(status(ID)).toBe('waiting');
    expect(status(ID2)).toBe('done');
  }, 30_000);

  test("a previous run's referee-last-message.txt (PASS) is not read as this run's verdict", async () => {
    put(waiting(ID));
    put({ id: ID, ts: 2, status: 'queued' });
    fs.mkdirSync(path.join(dir, ID), { recursive: true });
    fs.writeFileSync(path.join(dir, ID, 'referee-last-message.txt'), 'old run\nVERDICT: {"verdict":"PASS","reasons":["stale"]}\n');
    expect(await runOnce('silent')).toBe(0);
    const m = foldBoard(readBoardLines(board())).find((x) => x.id === ID)!;
    expect(m.status).toBe('failed');
    expect(m.verdict).toBeUndefined();
  }, 30_000);
});
