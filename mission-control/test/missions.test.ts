// test/missions.test.ts — v3 slice: /api/missions board, launch, and team routes.
//
// Every test uses its own temp MC_MISSIONS_DIR; nothing here touches ~/.agentvibe.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMissionsApi } from '../server/routes/missions.ts';
import { createApp } from '../server/app.ts';
import { appendMissionLine } from '../server/index-cache.ts';
import { STOP_REQUESTED, boardPath, eventsPath, foldBoard, foldTeam, readBoardLines, type MissionLine, type TeamEvent } from '../server/missions.ts';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-missions-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const post = (api: ReturnType<typeof createMissionsApi>, url: string, body?: unknown) =>
  api.request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });

describe('/api/missions', () => {
  test('create → Waiting; launch → queued (one appended line each); board folds to current state', async () => {
    const api = createMissionsApi(dir);
    const r = await post(api, '/', { title: 'Hello', goal: 'write docs/demo/hello-mission.md' });
    expect(r.status).toBe(201);
    const { mission } = (await r.json()) as { mission: { id: string; status: string } };
    expect(mission.status).toBe('waiting');

    const l = await post(api, `/${mission.id}/launch`);
    expect(l.status).toBe(200);
    expect(readBoardLines(boardPath(dir)).map((x) => x.status)).toEqual(['waiting', 'queued']);

    const board = (await (await api.request('/')).json()) as { missions: { id: string; status: string; title: string }[] };
    expect(board.missions).toHaveLength(1);
    expect(board.missions[0]).toMatchObject({ id: mission.id, status: 'queued', title: 'Hello' });
  });

  test('a second launch of the same card is refused (409) and appends nothing', async () => {
    const api = createMissionsApi(dir);
    const { mission } = (await (await post(api, '/', { title: 't', goal: 'g' })).json()) as { mission: { id: string } };
    expect((await post(api, `/${mission.id}/launch`)).status).toBe(200);
    expect((await post(api, `/${mission.id}/launch`)).status).toBe(409);
    expect(readBoardLines(boardPath(dir))).toHaveLength(2);
  });

  test('validation: empty/oversize fields → 400; non-UUID id → 400 (never reaches path.join); unknown id → 404', async () => {
    const api = createMissionsApi(dir);
    expect((await post(api, '/', { title: '', goal: 'g' })).status).toBe(400);
    expect((await post(api, '/', { title: 't', goal: 'x'.repeat(2001) })).status).toBe(400);
    expect((await post(api, '/', ['not', 'object'])).status).toBe(400);
    expect((await post(api, '/..%2F..%2Fetc/launch')).status).toBe(400);
    expect((await api.request('/..%2Fboard/team')).status).toBe(400);
    expect((await post(api, `/00000000-0000-4000-8000-000000000000/launch`)).status).toBe(404);
    expect(fs.existsSync(boardPath(dir))).toBe(false);
  });

  test('team route folds the runner events JSONL into one card per agent, with receipts', async () => {
    const api = createMissionsApi(dir);
    const id = '11111111-2222-4333-8444-555555555555';
    const file = eventsPath(id, dir);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const ev = (e: Partial<TeamEvent>): string => JSON.stringify({ ts: 1, title: 'x', model: 'm', family: 'f', ...e }) + '\n';
    fs.writeFileSync(
      file,
      ev({ agent: 'builder', title: 'Builder', model: 'claude-sonnet-5', kind: 'status', status: 'working' }) +
        ev({ agent: 'builder', title: 'Builder', model: 'claude-sonnet-5', kind: 'result', status: 'finished', costUsd: 0.12 }) +
        ev({ agent: 'runner', kind: 'receipt', text: 'file docs/demo/hello-mission.md', data: { sha256: 'ab' } }) +
        ev({ agent: 'referee', title: 'Referee', model: 'gpt-6-astra', kind: 'verdict', status: 'finished', text: 'PASS' }) +
        '{"torn',
    );
    const team = (await (await api.request(`/${id}/team`)).json()) as ReturnType<typeof foldTeam>;
    expect(team.total).toBe(4);
    expect(team.agents.map((a) => [a.title, a.model, a.status])).toEqual([
      ['Builder', 'claude-sonnet-5', 'finished'],
      ['Referee', 'gpt-6-astra', 'finished'],
    ]);
    expect(team.agents[0]!.costUsd).toBe(0.12);
    expect(team.receipts).toHaveLength(1);
  });

  test('done carries the Referee verdict; a transition with no waiting origin is ignored', () => {
    const f = boardPath(dir);
    appendMissionLine({ id: 'a', ts: 1, status: 'waiting', title: 'T', goal: 'G' }, f);
    appendMissionLine({ id: 'a', ts: 2, status: 'working' }, f);
    appendMissionLine({ id: 'a', ts: 3, status: 'done', verdict: 'FAIL', verdictReasons: ['claim unsupported'] }, f);
    appendMissionLine({ id: 'ghost', ts: 4, status: 'done', verdict: 'PASS' }, f);
    const b = foldBoard(readBoardLines(f));
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ status: 'done', verdict: 'FAIL', verdictReasons: ['claim unsupported'] });
  });

  test('mounted in the shipped app under the cross-site guard', async () => {
    const prev = process.env.MC_MISSIONS_DIR;
    process.env.MC_MISSIONS_DIR = dir;
    try {
      const app = createApp();
      expect((await app.request('/api/missions')).status).toBe(200);
      const x = await app.request('/api/missions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' },
        body: JSON.stringify({ title: 't', goal: 'g' }),
      });
      expect(x.status).toBe(403);
      expect(fs.existsSync(boardPath(dir))).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.MC_MISSIONS_DIR;
      else process.env.MC_MISSIONS_DIR = prev;
    }
  });
});

describe('POST /api/missions/:id/stop', () => {
  const ID = '33333333-3333-4333-8333-333333333333';
  const f = () => boardPath(dir);
  const seed = (...lines: Partial<MissionLine>[]) => {
    appendMissionLine({ id: ID, ts: 1, status: 'waiting', title: 'T', goal: 'G' }, f());
    lines.forEach((l, i) => appendMissionLine({ id: ID, ts: 2 + i, ...l }, f()));
  };
  const mission = () => foldBoard(readBoardLines(f())).find((m) => m.id === ID)!;

  test.each(['queued', 'working'] as const)('a %s mission: appends one stop_requested line, answers 202, status is unchanged', async (status) => {
    seed({ status });
    const before = readBoardLines(f()).length;
    const r = await post(createMissionsApi(dir), `/${ID}/stop`);
    expect(r.status).toBe(202);
    expect(await r.json()).toMatchObject({ ok: true, id: ID, status, stopRequested: true });
    const lines = readBoardLines(f());
    expect(lines).toHaveLength(before + 1);
    expect(lines.at(-1)).toMatchObject({ id: ID, status: STOP_REQUESTED });
    expect(mission()).toMatchObject({ status, stopRequested: true });
  });

  test.each(['waiting', 'done', 'failed', 'stopped'] as const)('a %s mission is refused (409) and nothing is appended', async (status) => {
    if (status === 'waiting') seed();
    else seed({ status: 'working' }, { status });
    const before = readBoardLines(f()).length;
    const r = await post(createMissionsApi(dir), `/${ID}/stop`);
    expect(r.status).toBe(409);
    expect(readBoardLines(f())).toHaveLength(before);
  });

  test('a second stop while the first is pending is accepted but appends nothing', async () => {
    seed({ status: 'working' });
    const api = createMissionsApi(dir);
    expect((await post(api, `/${ID}/stop`)).status).toBe(202);
    const n = readBoardLines(f()).length;
    const again = await post(api, `/${ID}/stop`);
    expect(again.status).toBe(202);
    expect(await again.json()).toMatchObject({ alreadyRequested: true });
    expect(readBoardLines(f())).toHaveLength(n);
  });

  test('a stop_requested line missing its id or ts is not a board line at all', () => {
    // `a && b && status-in-list || status === stop_requested` let the right arm through alone.
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f(), [{ status: STOP_REQUESTED }, { ts: 1, status: STOP_REQUESTED }, { id: ID, status: STOP_REQUESTED }, { id: 7, ts: 1, status: STOP_REQUESTED }].map((l) => JSON.stringify(l)).join('\n') + '\n');
    expect(readBoardLines(f())).toEqual([]);
  });

  test('a non-UUID id is 400 and never reaches path.join; an unknown id is 404', async () => {
    const api = createMissionsApi(dir);
    expect((await post(api, '/..%2F..%2Fetc/stop')).status).toBe(400);
    expect((await post(api, '/00000000-0000-4000-8000-000000000000/stop')).status).toBe(404);
    expect(fs.existsSync(f())).toBe(false);
  });

  test('under the shipped app a cross-site POST is refused (403) and appends nothing', async () => {
    seed({ status: 'working' });
    const prev = process.env.MC_MISSIONS_DIR;
    process.env.MC_MISSIONS_DIR = dir;
    try {
      const app = createApp();
      const n = readBoardLines(f()).length;
      const x = await app.request(`/api/missions/${ID}/stop`, { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } });
      expect(x.status).toBe(403);
      expect(readBoardLines(f())).toHaveLength(n);
      expect((await app.request(`/api/missions/${ID}/stop`, { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' } })).status).toBe(202);
    } finally {
      if (prev === undefined) delete process.env.MC_MISSIONS_DIR;
      else process.env.MC_MISSIONS_DIR = prev;
    }
  });

  test('server/** never signals a process: the stop route appends a request and the runner does the killing', () => {
    const root = path.resolve(import.meta.dir, '..', 'server');
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name));
        else if (e.name.endsWith('.ts')) files.push(path.join(d, e.name));
      }
    };
    walk(root);
    // Comments are stripped crudely (block, then line): this is the cheap guard, and the
    // behavioural half is the route test above, which finds no process to signal.
    const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const offenders = files.filter((p) => /\.kill\s*\(|\bkillpg\b/.test(code(fs.readFileSync(p, 'utf8'))));
    expect(offenders.map((p) => path.relative(root, p))).toEqual([]);
  });
});
