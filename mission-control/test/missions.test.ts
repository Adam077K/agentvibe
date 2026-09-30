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
import { boardPath, eventsPath, foldBoard, foldTeam, readBoardLines, type TeamEvent } from '../server/missions.ts';

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
