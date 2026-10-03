// test/run-missions.test.ts — the founder-run runner's trust-bearing helpers.
//
// The runner spawns real workers and is not run here. What is tested is the part that decides
// what the board is allowed to say: who counts as having written a file, which line of the
// Referee's output counts as a verdict, and who may run a mission.
//
// Every test uses its own temp MC_MISSIONS_DIR; nothing here touches ~/.agentvibe.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
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
