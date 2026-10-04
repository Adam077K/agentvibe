// server/routes/decisions.ts — v3 thin slice: /api/decisions.
//
//   GET  /api/decisions               { pending: Decision[], answered: Decision[] } — answered is the
//                                     most recent RECENT_ANSWERED, newest first; expired ones ride
//                                     along in it, marked by status
//   POST /api/decisions/:id/answer    { choice } → appends one `decision_answered` line
//
// The server answers; it never waits and never spawns. scripts/decisions.ts, run by the founder
// inside the mission runner, is what polls the file and resumes the Builder.
//
// THE POST'S GUARDS, and where each one lives. The app-level crossSiteGuard (server/app.ts) already
// runs before this router, refusing Sec-Fetch-Site: cross-site and a foreign Origin — the same
// protection the dispatch POST relies on. Two more are local to this route, because an answer is
// the one request here that makes a program continue on this machine:
//   · Content-Type must be application/json. A cross-origin <form> can only send the three "simple"
//     types, so this closes that vector even for a browser too old to send Sec-Fetch-Site, and a
//     plain-text body is never parsed as JSON by accident.
//   · The body is read as text and capped before it is parsed, so an oversized one costs a length
//     comparison rather than a JSON.parse.

import { Hono } from 'hono';
import { appendMissionLine } from '../index-cache.ts';
import {
  DECISION_ID,
  MAX_OPTION_CHARS,
  decisionsPath,
  foldDecisions,
  readDecisionLines,
  type Decision,
  type DecisionAnswered,
} from '../decisions.ts';
import { boardPath, foldBoard, missionsDir, readBoardLines, type Mission, type MissionStatus } from '../missions.ts';

export const RECENT_ANSWERED = 20;
/** An answer is `{"choice": "<≤120 chars>"}`; 2 KiB is generous and still a hard ceiling. */
export const MAX_BODY_BYTES = 2048;

export interface DecisionRow extends Decision {
  /** The mission's title, joined from the board so the card can say what it is about. */
  missionTitle?: string;
  /** The mission's status now, so an answer that landed just before a stop can be told from one that was acted on. */
  missionStatus?: MissionStatus;
}
export interface DecisionsPayload {
  pending: DecisionRow[];
  answered: DecisionRow[];
}
export interface DecisionError {
  error: string;
}
export type { Decision };

/** The request body as text, or null once it has passed `max` bytes (the rest is never read). */
async function readCapped(req: Request, max: number): Promise<string | null> {
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** `file` is resolved per request so MC_MISSIONS_DIR set by a test after import still binds. */
export function createDecisionsApi(fileOverride?: string): Hono {
  const api = new Hono();
  const file = () => fileOverride ?? decisionsPath();

  const withTitles = (rows: Decision[]): DecisionRow[] => {
    let missions: Map<string, Mission>;
    try {
      missions = new Map(foldBoard(readBoardLines(boardPath(missionsDir()))).map((m) => [m.id, m]));
    } catch {
      missions = new Map(); // The board is decoration here; a read failure must not hide a question.
    }
    return rows.map((d) => ({ ...d, missionTitle: missions.get(d.missionId)?.title, missionStatus: missions.get(d.missionId)?.status }));
  };

  api.get('/', (c) => {
    try {
      const all = foldDecisions(readDecisionLines(file()));
      const pending = all.filter((d) => d.status === 'pending');
      const settled = all
        .filter((d) => d.status !== 'pending')
        .sort((a, b) => (b.answeredAt ?? 0) - (a.answeredAt ?? 0))
        .slice(0, RECENT_ANSWERED);
      return c.json({ pending: withTitles(pending), answered: withTitles(settled) } satisfies DecisionsPayload);
    } catch (err) {
      return c.json({ error: `could not read decisions: ${String(err)}` } satisfies DecisionError, 500);
    }
  });

  api.post('/:id/answer', async (c) => {
    const id = c.req.param('id');
    if (!DECISION_ID.test(id)) return c.json({ error: 'invalid decision id' } satisfies DecisionError, 400);

    const type = (c.req.header('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
    if (type !== 'application/json') {
      return c.json({ error: 'Content-Type must be application/json' } satisfies DecisionError, 415);
    }
    // A declared length over the cap is refused before a byte is read.
    const declared = Number(c.req.header('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return c.json({ error: 'request body too large' } satisfies DecisionError, 413);
    }
    // A chunked body declares no length, so the stream is read under a running cap and abandoned the
    // moment it passes it, rather than buffered whole and measured afterwards.
    const text = await readCapped(c.req.raw, MAX_BODY_BYTES);
    if (text === null) return c.json({ error: 'request body too large' } satisfies DecisionError, 413);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return c.json({ error: 'request body must be JSON' } satisfies DecisionError, 400);
    }
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return c.json({ error: 'request body must be a JSON object' } satisfies DecisionError, 400);
    }
    const choice = (body as Record<string, unknown>).choice;
    if (typeof choice !== 'string' || !choice || choice.length > MAX_OPTION_CHARS) {
      return c.json({ error: `choice must be a string of 1–${MAX_OPTION_CHARS} characters` } satisfies DecisionError, 400);
    }

    // Read, check and append with no await between them: the handler is synchronous from here, so
    // two answers to one id cannot interleave inside this process, and the fold ignores a second
    // one in the file regardless (server/decisions.ts), which covers a writer in another process.
    const path = file();
    let decision: Decision | undefined;
    try {
      decision = foldDecisions(readDecisionLines(path)).find((d) => d.id === id);
    } catch (err) {
      return c.json({ error: `could not read decisions: ${String(err)}` } satisfies DecisionError, 500);
    }
    if (!decision) return c.json({ error: 'unknown decision' } satisfies DecisionError, 404);
    if (decision.status === 'answered') return c.json({ error: 'decision already answered' } satisfies DecisionError, 409);
    if (decision.status === 'expired') {
      return c.json({ error: 'decision expired — the runner stopped waiting for it, so the mission is not listening' } satisfies DecisionError, 409);
    }
    // The runner claims a mission `working` and only a running runner is polling for the answer.
    // Any other state means nobody is listening — a runner that was killed mid-wait, a mission that
    // finished, one that was never launched — and a 200 here would be an answer into a void.
    let mission: Mission | undefined;
    try {
      mission = foldBoard(readBoardLines(boardPath(missionsDir()))).find((m) => m.id === decision!.missionId);
    } catch (err) {
      return c.json({ error: `could not read board: ${String(err)}` } satisfies DecisionError, 500);
    }
    if (mission?.status !== 'working') {
      return c.json({ error: `this mission is not being worked (${mission?.status ?? 'not on the board'}), so no runner is waiting for an answer` } satisfies DecisionError, 409);
    }
    // A stop is already on its way: the runner will expire this question on its next look, so an
    // answer now goes into the void the check above exists to prevent.
    if (mission.stopRequested) {
      return c.json({ error: 'this mission is being stopped, so no runner will read an answer' } satisfies DecisionError, 409);
    }
    if (!decision.options.includes(choice)) {
      return c.json({ error: 'choice must be one of the decision options' } satisfies DecisionError, 400);
    }

    const line: DecisionAnswered = { type: 'decision_answered', id, choice, by: 'founder', at: Date.now() };
    try {
      appendMissionLine(line, path);
    } catch (err) {
      return c.json({ error: `could not write decisions: ${String(err)}` } satisfies DecisionError, 500);
    }
    // A 200 is a claim that the row left pending, so check it did. The runner can write `expired`
    // between the read above and this append, and a torn line can still defeat a write — either way
    // the fold, not the append call, is what says whether the answer counts.
    let after: Decision | undefined;
    try {
      after = foldDecisions(readDecisionLines(path)).find((d) => d.id === id);
    } catch (err) {
      return c.json({ error: `could not confirm the answer: ${String(err)}` } satisfies DecisionError, 500);
    }
    if (after?.status === 'answered' && after.choice === choice) return c.json({ ok: true, id, choice });
    if (after?.status === 'answered') return c.json({ error: 'decision already answered' } satisfies DecisionError, 409);
    if (after?.status === 'expired') {
      return c.json({ error: 'decision expired just as it was answered — the runner stopped waiting, so the mission is not listening' } satisfies DecisionError, 409);
    }
    return c.json({ error: 'the answer was written but did not take effect' } satisfies DecisionError, 500);
  });

  return api;
}
