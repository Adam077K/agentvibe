// server/routes/missions.ts — v3 thin slice: /api/missions.
//
//   GET  /api/missions                 the board, folded: { missions: Mission[] }
//   POST /api/missions                 { title, goal } → a new card in Waiting
//   POST /api/missions/:id/launch      Waiting → queued. The runner does the rest.
//   GET  /api/missions/:id/team        the live team, folded from the runner's events JSONL
//
// The server launches nothing. `launch` appends one line; scripts/run-missions.ts, run by the
// founder, is what spawns workers. The team route is polled (1s) rather than pushed over SSE:
// the existing /events stream is a fleet-wide diff channel with its own hashing contract, and
// a per-mission tail is a different shape. Polling a folded view of a small file is the least
// machinery that is honestly "live" at human speed — see SLICE-board-to-team.md §what it taught.

import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { appendMissionLine } from '../index-cache.ts';
import {
  MISSION_ID,
  boardPath,
  foldBoard,
  foldTeam,
  missionsDir,
  readBoardLines,
  readEvents,
  type Mission,
  type MissionLine,
  type TeamView,
} from '../missions.ts';

export interface MissionsPayload {
  missions: Mission[];
}
export interface MissionCreateRequest {
  title: string;
  goal: string;
}
export interface MissionError {
  error: string;
}
export type { Mission, TeamView };

/** `dir` is resolved per request so MC_MISSIONS_DIR set by a test after import still binds. */
export function createMissionsApi(dirOverride?: string): Hono {
  const api = new Hono();
  const dir = () => dirOverride ?? missionsDir();

  api.get('/', (c) => {
    try {
      return c.json({ missions: foldBoard(readBoardLines(boardPath(dir()))) } satisfies MissionsPayload);
    } catch (err) {
      return c.json({ error: `could not read board: ${String(err)}` } satisfies MissionError, 500);
    }
  });

  api.post('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'request body must be JSON' } satisfies MissionError, 400);
    }
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return c.json({ error: 'request body must be a JSON object' } satisfies MissionError, 400);
    }
    const raw = body as Record<string, unknown>;
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    const goal = typeof raw.goal === 'string' ? raw.goal.trim() : '';
    if (!title || title.length > 120) return c.json({ error: 'title must be 1–120 characters' } satisfies MissionError, 400);
    if (!goal || goal.length > 2000) return c.json({ error: 'goal must be 1–2000 characters' } satisfies MissionError, 400);
    const line: MissionLine = { id: randomUUID(), ts: Date.now(), status: 'waiting', title, goal };
    try {
      appendMissionLine(line, boardPath(dir()));
    } catch (err) {
      return c.json({ error: `could not write board: ${String(err)}` } satisfies MissionError, 500);
    }
    const [mission] = foldBoard([line]);
    return c.json({ mission }, 201);
  });

  api.post('/:id/launch', (c) => {
    const id = c.req.param('id');
    if (!MISSION_ID.test(id)) return c.json({ error: 'invalid mission id' } satisfies MissionError, 400);
    const file = boardPath(dir());
    const mission = foldBoard(readBoardLines(file)).find((m) => m.id === id);
    if (!mission) return c.json({ error: 'unknown mission' } satisfies MissionError, 404);
    // Only Waiting launches. A second drag of a card already working must not queue it twice —
    // the dispatch queue's re-launch bug (index-cache.ts, resolveDispatchStates) is the precedent.
    if (mission.status !== 'waiting') {
      return c.json({ error: `mission is ${mission.status}, not waiting` } satisfies MissionError, 409);
    }
    const line: MissionLine = { id, ts: Date.now(), status: 'queued' };
    try {
      appendMissionLine(line, file);
    } catch (err) {
      return c.json({ error: `could not write board: ${String(err)}` } satisfies MissionError, 500);
    }
    return c.json({ ok: true, id, status: 'queued' });
  });

  api.get('/:id/team', (c) => {
    const id = c.req.param('id');
    if (!MISSION_ID.test(id)) return c.json({ error: 'invalid mission id' } satisfies MissionError, 400);
    try {
      return c.json(foldTeam(id, readEvents(id, dir())) satisfies TeamView);
    } catch (err) {
      return c.json({ error: `could not read events: ${String(err)}` } satisfies MissionError, 500);
    }
  });

  return api;
}
