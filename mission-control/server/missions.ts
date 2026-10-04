// server/missions.ts — v3 thin slice: the Missions board and a mission's live team, READ side.
//
// THE SAME SPLIT AS DISPATCH, ON PURPOSE. The server appends one line to a board file and stops.
// A founder-run runner (scripts/run-missions.ts) picks the line up, launches the team, and writes
// a per-mission events JSONL. The server only ever READS that file back. It spawns nothing —
// crosscheck.test.ts keeps that at zero exceptions — and its only write goes through
// index-cache.ts's appendMissionLine(), the one server file allowed a write call.
//
// ONE FOLD, TWO READERS. The board fold and the team fold live here and nowhere else. The runner
// imports foldBoard() to decide what to launch; the routes import it to decide what to draw. Two
// implementations of "what state is this mission in" would disagree the first time a status was
// added to one and not the other.
//
// Files (both overridable by MC_MISSIONS_DIR, so a test never touches the real one):
//   ~/.agentvibe/missions/board.jsonl            append-only state transitions, one per line
//   ~/.agentvibe/missions/<id>/events.jsonl      append-only team events, written by the runner

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FamilyStamp } from './model-family.ts';

export function missionsDir(): string {
  return process.env.MC_MISSIONS_DIR ?? path.join(os.homedir(), '.agentvibe', 'missions');
}

export function boardPath(dir: string = missionsDir()): string {
  return path.join(dir, 'board.jsonl');
}

/** A mission id is a server-minted UUID. Anything else never reaches path.join. */
export const MISSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function eventsPath(id: string, dir: string = missionsDir()): string {
  if (!MISSION_ID.test(id)) throw new Error(`invalid mission id: ${id}`);
  return path.join(dir, id, 'events.jsonl');
}

/**
 * waiting — on the board, not launched. queued — launch requested (server wrote it).
 * working — a runner claimed it. done — the team finished and the Referee returned a verdict.
 * failed  — the team could not finish (a worker exited non-zero, or no verdict was parsed).
 *
 * `done` carries the Referee's verdict, which may be FAIL. "The team finished" and "the work is
 * good" are different facts, and the card shows both.
 */
export type MissionStatus = 'waiting' | 'queued' | 'working' | 'done' | 'failed';
export const MISSION_STATUSES: readonly MissionStatus[] = ['waiting', 'queued', 'working', 'done', 'failed'];

export type Verdict = 'PASS' | 'FAIL';

/** One line of board.jsonl. Only `id`, `ts`, `status` are required; the rest merge forward. */
export interface MissionLine {
  id: string;
  ts: number;
  status: MissionStatus;
  title?: string;
  goal?: string;
  verdict?: Verdict;
  verdictReasons?: string[];
  costUsd?: number;
  error?: string;
  runnerPid?: number;
}

export interface Mission {
  id: string;
  title: string;
  goal: string;
  status: MissionStatus;
  createdAt: number;
  updatedAt: number;
  verdict?: Verdict;
  verdictReasons?: string[];
  costUsd?: number;
  error?: string;
}

export type BoardColumn = 'Waiting' | 'Working' | 'Done';

export function columnOf(status: MissionStatus): BoardColumn {
  if (status === 'waiting') return 'Waiting';
  if (status === 'queued' || status === 'working') return 'Working';
  return 'Done';
}

export function readBoardLines(file: string = boardPath()): MissionLine[] {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const out: MissionLine[] = [];
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue;
    try {
      const p = JSON.parse(raw) as MissionLine;
      if (typeof p.id === 'string' && typeof p.ts === 'number' && MISSION_STATUSES.includes(p.status)) out.push(p);
    } catch {
      // A torn final line from a crashed writer: skip, never half-parse.
    }
  }
  return out;
}

/** Fold transitions into current state, first-seen order. A line with no `waiting` origin is dropped. */
export function foldBoard(lines: MissionLine[]): Mission[] {
  const byId = new Map<string, Mission>();
  for (const l of lines) {
    const cur = byId.get(l.id);
    if (!cur) {
      if (l.status !== 'waiting' || !l.title || !l.goal) continue;
      byId.set(l.id, { id: l.id, title: l.title, goal: l.goal, status: 'waiting', createdAt: l.ts, updatedAt: l.ts });
      continue;
    }
    cur.status = l.status;
    cur.updatedAt = l.ts;
    // A launch starts a new attempt: the reason the last one did not advance (refused_subagent)
    // must not ride along onto a card that then finishes.
    if (l.status === 'queued' || l.status === 'working') delete cur.error;
    if (l.verdict) cur.verdict = l.verdict;
    if (l.verdictReasons) cur.verdictReasons = l.verdictReasons;
    if (typeof l.costUsd === 'number') cur.costUsd = l.costUsd;
    if (l.error) cur.error = l.error;
  }
  return [...byId.values()];
}

// ── Team events ─────────────────────────────────────────────────────────────────────────────

export type AgentStatus = 'starting' | 'working' | 'finished' | 'failed';

/** One line of <id>/events.jsonl. `agent` is a stable key; `title` and `model` are what we draw. */
export interface TeamEvent {
  ts: number;
  agent: string;
  title: string;
  model: string;
  family: string;
  /** `slot_model_mismatch` (B0-20, DR-83): a launch whose model id's family differs from its slot's. */
  kind: 'status' | 'tool' | 'message' | 'result' | 'receipt' | 'verdict' | 'slot_model_mismatch';
  status?: AgentStatus;
  text?: string;
  costUsd?: number;
  data?: Record<string, unknown>;
}

export interface AgentCard {
  agent: string;
  title: string;
  model: string;
  family: string;
  status: AgentStatus;
  costUsd?: number;
  eventCount: number;
  latest: TeamEvent[];
}

export interface TeamView {
  missionId: string;
  agents: AgentCard[];
  receipts: TeamEvent[];
  total: number;
}

export function readEvents(id: string, dir: string = missionsDir()): TeamEvent[] {
  let text: string;
  try {
    text = fs.readFileSync(eventsPath(id, dir), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const out: TeamEvent[] = [];
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue;
    try {
      const p = JSON.parse(raw) as TeamEvent;
      if (typeof p.agent === 'string' && typeof p.kind === 'string') out.push(p);
    } catch {
      /* torn line */
    }
  }
  return out;
}

export function foldTeam(missionId: string, events: TeamEvent[], latestN = 6): TeamView {
  const cards = new Map<string, AgentCard>();
  const receipts: TeamEvent[] = [];
  for (const e of events) {
    if (e.kind === 'receipt') receipts.push(e);
    if (e.agent === 'runner') continue;
    let c = cards.get(e.agent);
    if (!c) {
      c = { agent: e.agent, title: e.title, model: e.model, family: e.family, status: 'starting', eventCount: 0, latest: [] };
      cards.set(e.agent, c);
    }
    c.eventCount++;
    if (e.model && e.model !== 'unknown') c.model = e.model;
    if (e.status) c.status = e.status;
    if (typeof e.costUsd === 'number') c.costUsd = e.costUsd;
    c.latest.push(e);
    if (c.latest.length > latestN) c.latest.shift();
  }
  return { missionId, agents: [...cards.values()], receipts, total: events.length };
}

// -- Launch receipts --------------------------------------------------------------------------
//
// One receipt per process the runner actually spawned: a Builder run, a Referee run, or -- when
// the Builder's --disallowedTools Agent,Task flag fails to hold -- a nested subagent whose
// stream-json messages carry a parent_tool_use_id matching a tool_use the Builder attempted.
// parentLaunchId links that child receipt back to the launch it grew out of; it is absent on a
// top-level launch. Written by scripts/run-missions.ts via index-cache.ts's generic
// appendMissionLine() -- this file stays read-only, matching every other export here.

/** Beside events.jsonl: one line per process the runner actually launched for this mission. */
export function launchesPath(id: string, dir: string = missionsDir()): string {
  if (MISSION_ID.exec(id) === null) throw new Error('invalid mission id: ' + id);
  return path.join(dir, id, 'launches.jsonl');
}

export interface LaunchReceipt extends FamilyStamp {
  launchId: string;
  missionId: string;
  role: string;
  argvHash: string;
  model: string;
  startedAt: number;
  endedAt: number;
  exit: number | null;
  turns: number | null;
  resultSubtype: string | null;
  /** stdout lines that were not JSON. Counted, never dropped silently: a nonzero count means the
   *  receipt was built from a stream the runner could not fully read. */
  unparsedLines?: number;
  parentLaunchId?: string;
}

// `family` is derived from `model` by familyOf() (server/model-family.ts), never from the slot;
// `slotFamily` is what the slot declared, and `slotModelMismatch` is set when the two differ.
// Receipts written before B0-20 carry none of the three.

export function readLaunchReceipts(id: string, dir: string = missionsDir()): LaunchReceipt[] {
  let text: string;
  try {
    text = fs.readFileSync(launchesPath(id, dir), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const out: LaunchReceipt[] = [];
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue;
    try {
      const p = JSON.parse(raw) as LaunchReceipt;
      if (typeof p.launchId === 'string' && typeof p.missionId === 'string' && typeof p.role === 'string') out.push(p);
    } catch {
      /* torn line */
    }
  }
  return out;
}
