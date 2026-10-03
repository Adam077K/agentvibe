// server/decisions.ts — v3 thin slice: Decisions, READ side and the one fold.
//
// An agent that needs the founder to choose writes a question; the founder answers it in the UI;
// the waiting mission continues. Same split as Missions and Dispatch, on purpose: the server
// APPENDS one line and stops, the founder-run runner (scripts/decisions.ts) is what waits on the
// answer and resumes the Builder. The server spawns nothing — crosscheck.test.ts keeps that at
// zero exceptions — and its only write goes through index-cache.ts's appendMissionLine(), the
// one server file allowed a write call.
//
// ONE FOLD, TWO READERS. The routes import foldDecisions() to decide what to draw and what to
// accept; the runner imports it to decide whether its question was answered. Two folds would
// disagree the first time a record type was added to one.
//
// File (overridable by MC_DECISIONS_FILE, so a test never touches the real one):
//   ~/.agentvibe/decisions.jsonl     append-only, one record per line, three record types:
//     decision_needed   { type, id, mission_id, question, options[], created_at }   runner writes
//     decision_answered { type, id, choice, by: 'founder', at }                      server writes
//     decision_expired  { type, id, at }                                             runner writes
//
// `decision_expired` is not in the founder's brief and is here for one reason: when the runner's
// bounded wait runs out the card goes back to Waiting, and a question that is still "pending"
// afterwards is one whose answer goes nowhere. Expiry takes it out of pending, and an answer to
// an expired decision is refused — the founder is told, instead of clicking into a void.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MISSION_ID } from './missions.ts';

export function decisionsPath(): string {
  return process.env.MC_DECISIONS_FILE ?? path.join(os.homedir(), '.agentvibe', 'decisions.jsonl');
}

/** A decision id is a UUID the runner mints. Anything else never reaches a comparison. */
export const DECISION_ID = MISSION_ID;

/** Bounds shared by the runner (clips to them), the fold (drops what exceeds them) and the route. */
export const MAX_QUESTION_CHARS = 500;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 8;
export const MAX_OPTION_CHARS = 120;

export interface DecisionNeeded {
  type: 'decision_needed';
  id: string;
  mission_id: string;
  question: string;
  options: string[];
  created_at: number;
}
export interface DecisionAnswered {
  type: 'decision_answered';
  id: string;
  choice: string;
  by: 'founder';
  at: number;
}
export interface DecisionExpired {
  type: 'decision_expired';
  id: string;
  at: number;
}
export type DecisionLine = DecisionNeeded | DecisionAnswered | DecisionExpired;

export type DecisionStatus = 'pending' | 'answered' | 'expired';

export interface Decision {
  id: string;
  missionId: string;
  question: string;
  options: string[];
  createdAt: number;
  status: DecisionStatus;
  choice?: string;
  answeredAt?: number;
}

function validOptions(o: unknown): o is string[] {
  return (
    Array.isArray(o) &&
    o.length >= MIN_OPTIONS &&
    o.length <= MAX_OPTIONS &&
    o.every((x) => typeof x === 'string' && x.length > 0 && x.length <= MAX_OPTION_CHARS) &&
    new Set(o).size === o.length
  );
}

function validLine(p: unknown): p is DecisionLine {
  if (p === null || typeof p !== 'object') return false;
  const r = p as Record<string, unknown>;
  if (typeof r.id !== 'string' || !DECISION_ID.test(r.id)) return false;
  if (r.type === 'decision_needed') {
    return (
      typeof r.mission_id === 'string' &&
      MISSION_ID.test(r.mission_id) &&
      typeof r.question === 'string' &&
      r.question.length > 0 &&
      r.question.length <= MAX_QUESTION_CHARS &&
      validOptions(r.options) &&
      typeof r.created_at === 'number'
    );
  }
  if (r.type === 'decision_answered') return typeof r.choice === 'string' && r.by === 'founder' && typeof r.at === 'number';
  if (r.type === 'decision_expired') return typeof r.at === 'number';
  return false;
}

export function readDecisionLines(file: string = decisionsPath()): DecisionLine[] {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  const out: DecisionLine[] = [];
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue;
    try {
      const p: unknown = JSON.parse(raw);
      if (validLine(p)) out.push(p);
    } catch {
      // A torn final line from a crashed writer: skip, never half-parse.
    }
  }
  return out;
}

/**
 * Fold lines into one row per decision, in the order the questions were asked.
 *   · a `decision_needed` is the only line that creates a row; the first for an id wins;
 *   · the FIRST valid terminal line (answered or expired) for a pending row settles it, and every
 *     later one is ignored — so a second answer, or a hand-appended one, can never rewrite history;
 *   · an answer whose choice is not one of the row's options does not count;
 *   · an answered/expired line with no `decision_needed` before it is dropped.
 */
export function foldDecisions(lines: DecisionLine[]): Decision[] {
  const byId = new Map<string, Decision>();
  for (const l of lines) {
    const cur = byId.get(l.id);
    if (l.type === 'decision_needed') {
      if (!cur) {
        byId.set(l.id, {
          id: l.id,
          missionId: l.mission_id,
          question: l.question,
          options: l.options,
          createdAt: l.created_at,
          status: 'pending',
        });
      }
      continue;
    }
    if (!cur || cur.status !== 'pending') continue;
    if (l.type === 'decision_answered') {
      if (!cur.options.includes(l.choice)) continue;
      cur.status = 'answered';
      cur.choice = l.choice;
      cur.answeredAt = l.at;
    } else {
      cur.status = 'expired';
      cur.answeredAt = l.at;
    }
  }
  return [...byId.values()];
}
