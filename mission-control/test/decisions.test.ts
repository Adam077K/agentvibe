// test/decisions.test.ts — v3 slice: Decisions. The fold, the two routes (and their guards), and the
// runner's wait-and-resume loop.
//
// Every test uses a temp MC_DECISIONS_FILE / MC_MISSIONS_DIR; nothing here touches ~/.agentvibe, and
// nothing launches `claude` or `codex` — withDecisions() takes the Builder run as a function.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.ts';
import { createDecisionsApi } from '../server/routes/decisions.ts';
import { appendMissionLine } from '../server/index-cache.ts';
import {
  foldDecisions,
  readDecisionLines,
  type DecisionLine,
  type DecisionNeeded,
} from '../server/decisions.ts';
import { boardPath, foldBoard, readBoardLines } from '../server/missions.ts';
import {
  DECISION_TIMEOUT,
  MAX_DECISION_ROUNDS,
  decisionPromptLines,
  parseDecision,
  withDecisions,
  type BuilderRound,
} from '../scripts/decisions.ts';

let dir: string;
let file: string;
let prev: Record<string, string | undefined>;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-decisions-'));
  file = path.join(dir, 'decisions.jsonl');
  prev = { f: process.env.MC_DECISIONS_FILE, m: process.env.MC_MISSIONS_DIR };
  process.env.MC_DECISIONS_FILE = file;
  process.env.MC_MISSIONS_DIR = path.join(dir, 'missions');
});
afterEach(() => {
  for (const [k, v] of [['MC_DECISIONS_FILE', prev.f], ['MC_MISSIONS_DIR', prev.m]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

const MISSION = '11111111-2222-4333-8444-555555555555';
const needed = (over: Partial<DecisionNeeded> = {}): DecisionNeeded => ({
  type: 'decision_needed',
  id: randomUUID(),
  mission_id: MISSION,
  question: 'Which license?',
  options: ['MIT', 'Apache-2.0'],
  created_at: 1000,
  ...over,
});
const seed = (...lines: object[]) => lines.forEach((l) => appendMissionLine(l, file));

const answer = (api: { request: (u: string, i?: RequestInit) => Response | Promise<Response> }, id: string, body: unknown, headers: Record<string, string> = { 'content-type': 'application/json' }) =>
  api.request(`/${id}/answer`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('foldDecisions', () => {
  test('needed without answered is pending; an answer settles it with the choice', () => {
    const n = needed();
    const lines: DecisionLine[] = [n, { type: 'decision_answered', id: n.id, choice: 'MIT', by: 'founder', at: 2000 }];
    expect(foldDecisions([n])).toMatchObject([{ id: n.id, status: 'pending', missionId: MISSION }]);
    expect(foldDecisions(lines)).toMatchObject([{ id: n.id, status: 'answered', choice: 'MIT', answeredAt: 2000 }]);
  });

  test('a second answer for one id is ignored: the first stands', () => {
    const n = needed();
    const [d] = foldDecisions([
      n,
      { type: 'decision_answered', id: n.id, choice: 'MIT', by: 'founder', at: 2 },
      { type: 'decision_answered', id: n.id, choice: 'Apache-2.0', by: 'founder', at: 3 },
    ]);
    expect(d).toMatchObject({ status: 'answered', choice: 'MIT', answeredAt: 2 });
  });

  test('an answer outside the options, or with no question before it, does not count', () => {
    const n = needed();
    const stray = randomUUID();
    const rows = foldDecisions([
      { type: 'decision_answered', id: stray, choice: 'x', by: 'founder', at: 1 },
      n,
      { type: 'decision_answered', id: n.id, choice: 'GPL', by: 'founder', at: 2 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: n.id, status: 'pending' });
  });

  test('expiry settles a pending decision and a late answer cannot reopen it', () => {
    const n = needed();
    const [d] = foldDecisions([n, { type: 'decision_expired', id: n.id, at: 5 }, { type: 'decision_answered', id: n.id, choice: 'MIT', by: 'founder', at: 6 }]);
    expect(d).toMatchObject({ status: 'expired' });
    expect(d!.choice).toBeUndefined();
  });

  test('readDecisionLines drops torn, malformed and out-of-bounds lines and keeps the rest', () => {
    const good = needed();
    fs.writeFileSync(
      file,
      [
        JSON.stringify(good),
        JSON.stringify(needed({ options: ['only one'] })), // below MIN_OPTIONS
        JSON.stringify(needed({ question: 'q'.repeat(501) })),
        JSON.stringify(needed({ mission_id: '../etc' })),
        JSON.stringify({ type: 'decision_answered', id: good.id, choice: 'MIT', by: 'someone-else', at: 1 }),
        '{"type":"decision_needed","id":',
      ].join('\n'),
    );
    expect(readDecisionLines(file).map((l) => l.id)).toEqual([good.id]);
  });
});

describe('/api/decisions', () => {
  test('GET lists pending and recent answered, joined with the mission title', async () => {
    const mid = randomUUID();
    appendMissionLine({ id: mid, ts: 1, status: 'waiting', title: 'Write the README', goal: 'g' }, boardPath(process.env.MC_MISSIONS_DIR!));
    const a = needed({ mission_id: mid });
    const b = needed({ mission_id: mid, question: 'Which tone?', options: ['formal', 'casual'] });
    seed(a, b, { type: 'decision_answered', id: a.id, choice: 'MIT', by: 'founder', at: 9 });
    const api = createDecisionsApi();
    const body = (await (await api.request('/')).json()) as { pending: { id: string; missionTitle?: string }[]; answered: { id: string; choice?: string }[] };
    expect(body.pending.map((d) => d.id)).toEqual([b.id]);
    expect(body.pending[0]!.missionTitle).toBe('Write the README');
    expect(body.answered).toMatchObject([{ id: a.id, choice: 'MIT' }]);
  });

  test('GET with no file is empty, not an error', async () => {
    const body = await (await createDecisionsApi().request('/')).json();
    expect(body).toEqual({ pending: [], answered: [] });
  });

  test('POST answer appends exactly one decision_answered line and the decision is no longer pending', async () => {
    const n = needed();
    seed(n);
    const api = createDecisionsApi();
    const r = await answer(api, n.id, { choice: 'Apache-2.0' });
    expect(r.status).toBe(200);
    const lines = readDecisionLines(file);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatchObject({ type: 'decision_answered', id: n.id, choice: 'Apache-2.0', by: 'founder' });
    expect(foldDecisions(lines)[0]!.status).toBe('answered');
  });

  test('a second POST for the same id is refused (409) and appends nothing', async () => {
    const n = needed();
    seed(n);
    const api = createDecisionsApi();
    expect((await answer(api, n.id, { choice: 'MIT' })).status).toBe(200);
    const again = await answer(api, n.id, { choice: 'Apache-2.0' });
    expect(again.status).toBe(409);
    expect(readDecisionLines(file)).toHaveLength(2);
    expect(foldDecisions(readDecisionLines(file))[0]!.choice).toBe('MIT');
  });

  test('refusals append nothing: choice not in options, unknown id, non-UUID id, expired decision', async () => {
    const n = needed();
    const e = needed();
    seed(n, e, { type: 'decision_expired', id: e.id, at: 5 });
    const before = fs.readFileSync(file, 'utf8');
    const api = createDecisionsApi();
    expect((await answer(api, n.id, { choice: 'GPL' })).status).toBe(400);
    expect((await answer(api, n.id, { choice: 'mit' })).status).toBe(400); // exact match, not case-folded
    expect((await answer(api, randomUUID(), { choice: 'MIT' })).status).toBe(404);
    expect((await answer(api, '..%2F..%2Fetc', { choice: 'MIT' })).status).toBe(400);
    expect((await answer(api, e.id, { choice: 'MIT' })).status).toBe(409);
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
  });

  test('body validation: not JSON, not an object, missing/oversize/non-string choice, oversized body', async () => {
    const n = needed();
    seed(n);
    const before = fs.readFileSync(file, 'utf8');
    const api = createDecisionsApi();
    expect((await answer(api, n.id, '{nope')).status).toBe(400);
    expect((await answer(api, n.id, ['MIT'])).status).toBe(400);
    expect((await answer(api, n.id, {})).status).toBe(400);
    expect((await answer(api, n.id, { choice: 7 })).status).toBe(400);
    expect((await answer(api, n.id, { choice: 'x'.repeat(121) })).status).toBe(400);
    expect((await answer(api, n.id, { choice: 'MIT', pad: 'x'.repeat(3000) })).status).toBe(413);
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
  });

  test('a non-JSON Content-Type is refused (415) even when the body would parse', async () => {
    const n = needed();
    seed(n);
    const api = createDecisionsApi();
    for (const ct of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
      expect((await answer(api, n.id, { choice: 'MIT' }, { 'content-type': ct })).status).toBe(415);
    }
    expect((await answer(api, n.id, { choice: 'MIT' }, {})).status).toBe(415);
    expect(readDecisionLines(file)).toHaveLength(1);
    // The same body with a charset parameter is still JSON.
    expect((await answer(api, n.id, { choice: 'MIT' }, { 'content-type': 'application/json; charset=utf-8' })).status).toBe(200);
  });
});

describe('the assembled app guards the POST', () => {
  const post = (app: ReturnType<typeof createApp>, id: string, headers: Record<string, string>) =>
    app.request(`/api/decisions/${id}/answer`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ choice: 'MIT' }) });

  test('a cross-site browser POST is refused (403) and appends nothing; same-origin and non-browser are allowed', async () => {
    const n = needed();
    seed(n);
    const app = createApp();
    const cross = await post(app, n.id, { 'sec-fetch-site': 'cross-site' });
    expect(cross.status).toBe(403);
    const foreign = await post(app, n.id, { origin: 'http://evil.example' });
    expect(foreign.status).toBe(403);
    expect(readDecisionLines(file)).toHaveLength(1);

    expect((await post(app, n.id, { 'sec-fetch-site': 'same-origin', origin: 'http://127.0.0.1:4300' })).status).toBe(200);
    expect(readDecisionLines(file)).toHaveLength(2);
  });
});

describe('parseDecision', () => {
  test('reads the final non-empty line: question || options, trimmed and deduplicated', () => {
    expect(parseDecision('Wrote a.md.\nDECISION: Which license? || MIT | Apache-2.0 |  MIT \n\n')).toEqual({ question: 'Which license?', options: ['MIT', 'Apache-2.0'] });
  });
  test('a DECISION line that is not last, or malformed, is not a decision', () => {
    expect(parseDecision('DECISION: q || a | b\nthen I carried on')).toBeNull();
    expect(parseDecision('DECISION: no options here')).toBeNull();
    expect(parseDecision('DECISION: q || only-one')).toBeNull();
    expect(parseDecision('DECISION: q || ' + Array.from({ length: 9 }, (_, i) => `o${i}`).join(' | '))).toBeNull();
    expect(parseDecision('')).toBeNull();
  });
  test('over-long question and options are clipped to the shared bounds', () => {
    const r = parseDecision(`DECISION: ${'q'.repeat(900)} || ${'a'.repeat(400)} | b`)!;
    expect(r.question.length).toBe(500);
    expect(r.options[0]!.length).toBe(120);
  });
});

describe('withDecisions', () => {
  const round = (summary: string, over: Partial<BuilderRound> = {}): BuilderRound => ({ ok: true, refused: false, files: [], summary, ...over });

  /** A clock the fake sleep advances, so a "30 minute" wait takes no time. */
  const clock = () => {
    let t = 1_000_000;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };

  test('no DECISION line: one run, nothing written to the decisions file', async () => {
    const calls: string[][] = [];
    const out = await withDecisions(MISSION, async (extra) => (calls.push(extra), round('Wrote hello.md.', { files: ['hello.md'] })), { file, ...clock() });
    expect(out?.files).toEqual(['hello.md']);
    expect(calls).toHaveLength(1);
    expect(fs.existsSync(file)).toBe(false);
    // The first run is told how to ask.
    expect(calls[0]!.join('\n')).toContain('DECISION: <question> || <option 1> | <option 2>');
  });

  test('asks, waits for the founder, and resumes the Builder with the answer in its prompt', async () => {
    const notes: string[] = [];
    const prompts: string[] = [];
    const c = clock();
    let sleeps = 0;
    const out = await withDecisions(
      MISSION,
      async (extra) => {
        prompts.push(extra.join('\n'));
        return prompts.length === 1
          ? round('Drafted. \nDECISION: Which license? || MIT | Apache-2.0', { files: ['a.md'], cost: 0.5 })
          : round('Done, wrote b.md.', { files: ['b.md'], cost: 0.25 });
      },
      {
        file,
        pollMs: 1000,
        timeoutMs: 60_000,
        now: c.now,
        // The founder answers on the third poll, exactly as the server would: one appended line.
        sleep: async (ms) => {
          await c.sleep(ms);
          if (++sleeps === 3) {
            const d = foldDecisions(readDecisionLines(file))[0]!;
            expect(d.status).toBe('pending'); // still waiting until the answer line lands
            appendMissionLine({ type: 'decision_answered', id: d.id, choice: 'Apache-2.0', by: 'founder', at: c.now() }, file);
          }
        },
        note: (text) => notes.push(text),
      },
    );
    expect(sleeps).toBe(3);
    expect(prompts).toHaveLength(2);
    expect(prompts[0]).not.toContain('Answer:');
    expect(prompts[1]).toContain('Question: Which license?');
    expect(prompts[1]).toContain('Answer: Apache-2.0');
    // Files and cost from before the question are kept.
    expect(out).toMatchObject({ files: ['a.md', 'b.md'], cost: 0.75 });
    const d = foldDecisions(readDecisionLines(file));
    expect(d).toMatchObject([{ missionId: MISSION, question: 'Which license?', options: ['MIT', 'Apache-2.0'], status: 'answered', choice: 'Apache-2.0' }]);
    expect(notes[0]).toContain('needs you');
    expect(notes.some((n) => n.includes('founder answered: Apache-2.0'))).toBe(true);
  });

  test('timeout: the decision expires, the card goes back to Waiting with decision_timeout, the Builder is not resumed', async () => {
    const mid = randomUUID();
    appendMissionLine({ id: mid, ts: 1, status: 'waiting', title: 'T', goal: 'G' }, boardPath(process.env.MC_MISSIONS_DIR!));
    appendMissionLine({ id: mid, ts: 2, status: 'working' }, boardPath(process.env.MC_MISSIONS_DIR!));
    let runs = 0;
    const out = await withDecisions(mid, async () => (runs++, round('DECISION: q? || a | b', { cost: 0.1 })), { file, pollMs: 1000, timeoutMs: 5000, ...clock() });
    expect(out).toBeNull();
    expect(runs).toBe(1);
    expect(foldDecisions(readDecisionLines(file))[0]!.status).toBe('expired');
    const [m] = foldBoard(readBoardLines(boardPath(process.env.MC_MISSIONS_DIR!)));
    expect(m).toMatchObject({ status: 'waiting', error: DECISION_TIMEOUT, costUsd: 0.1 });
  });

  test('a late answer after the timeout is refused by the route', async () => {
    const out = await withDecisions(MISSION, async () => round('DECISION: q? || a | b'), { file, pollMs: 1000, timeoutMs: 2000, ...clock() });
    expect(out).toBeNull();
    const id = readDecisionLines(file)[0]!.id;
    expect((await answer(createDecisionsApi(), id, { choice: 'a' })).status).toBe(409);
  });

  test('a refused or failed Builder run is returned untouched, even if its text ends in a DECISION line', async () => {
    for (const over of [{ refused: true }, { ok: false }]) {
      const out = await withDecisions(MISSION, async () => round('DECISION: q? || a | b', over), { file, ...clock() });
      expect(out).toMatchObject(over);
    }
    expect(fs.existsSync(file)).toBe(false);
  });

  test(`a Builder that keeps asking is cut off after ${MAX_DECISION_ROUNDS} answers`, async () => {
    const c = clock();
    let runs = 0;
    const out = await withDecisions(MISSION, async () => (runs++, round('DECISION: again? || a | b')), {
      file,
      ...c,
      // The founder answers at once, every time.
      sleep: async () => {
        const open = foldDecisions(readDecisionLines(file)).find((d) => d.status === 'pending');
        if (open) appendMissionLine({ type: 'decision_answered', id: open.id, choice: 'a', by: 'founder', at: 1 }, file);
      },
    });
    expect(runs).toBe(MAX_DECISION_ROUNDS + 1);
    expect(out).not.toBeNull();
    expect(foldDecisions(readDecisionLines(file))).toHaveLength(MAX_DECISION_ROUNDS);
  });

  test('decisionPromptLines carries each answered pair', () => {
    const text = decisionPromptLines([{ question: 'Q1', choice: 'A1' }, { question: 'Q2', choice: 'A2' }]).join('\n');
    expect(text).toContain('Question: Q1');
    expect(text).toContain('Answer: A2');
  });
});
