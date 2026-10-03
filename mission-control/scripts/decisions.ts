// scripts/decisions.ts — v3 thin slice: the runner's half of Decisions.
//
// A Builder that needs the founder to choose ends its reply with one line:
//
//   DECISION: <question> || <option 1> | <option 2> | …
//
// withDecisions() wraps one Builder run. When the run ends on such a line it appends a
// `decision_needed` record, waits for the founder's answer in the UI (the server appends
// `decision_answered`; this process only reads), and runs the Builder again with the answer added
// to its prompt. The wait is bounded: past MC_DECISION_TIMEOUT_MS the decision is marked expired and
// the card goes back to Waiting, so a founder who walked away does not leave a runner pinned forever.
//
// Lives outside server/** like run-missions.ts: it waits on a file and may be followed by a spawn.
// It is its own module so the runner's edit is one call site and the logic is testable without one.

import { randomUUID } from 'node:crypto';
import { appendMissionLine } from '../server/index-cache.ts';
import {
  MAX_OPTIONS,
  MAX_OPTION_CHARS,
  MAX_QUESTION_CHARS,
  MIN_OPTIONS,
  decisionsPath,
  foldDecisions,
  readDecisionLines,
  type Decision,
  type DecisionExpired,
  type DecisionNeeded,
} from '../server/decisions.ts';
import { boardPath, missionsDir, type MissionLine } from '../server/missions.ts';

/** The error a timed-out wait leaves on the card, one spelling shared with the tests. */
export const DECISION_TIMEOUT = 'decision_timeout';

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_POLL_MS = 1000;
/** A Builder that keeps asking is not converging. After this many answers the next one is ignored. */
export const MAX_DECISION_ROUNDS = 3;

export interface ParsedDecision {
  question: string;
  options: string[];
}

const clipTo = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/**
 * The FINAL non-empty line only: a `DECISION:` quoted mid-reply (say, inside the Builder's account of
 * what it did) is not a request. Returns null for anything that is not a well-formed question with
 * between MIN_OPTIONS and MAX_OPTIONS distinct options, so a malformed line is an ordinary reply
 * rather than a decision nobody can answer.
 */
export function parseDecision(text: string): ParsedDecision | null {
  const last = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .pop();
  const m = last?.match(/^DECISION:\s*(.+?)\s*\|\|\s*(.+)$/);
  if (!m) return null;
  const question = clipTo(m[1]!.trim(), MAX_QUESTION_CHARS);
  const options = [...new Set(m[2]!.split('|').map((o) => clipTo(o.trim(), MAX_OPTION_CHARS)).filter(Boolean))];
  if (!question || options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) return null;
  return { question, options };
}

/**
 * Lines appended to the Builder's prompt. The first run gets only the protocol; a resumed run also
 * gets each question it asked and the founder's answer, so the Builder never has to ask it twice.
 */
export function decisionPromptLines(answered: { question: string; choice: string }[]): string[] {
  const protocol = [
    ``,
    `If you cannot continue without the founder choosing between options, stop and end your reply with exactly one final line:`,
    `DECISION: <question> || <option 1> | <option 2>`,
    `(2 to ${MAX_OPTIONS} short options). Ask only when the choice is genuinely theirs; otherwise decide and proceed.`,
  ];
  if (answered.length === 0) return protocol;
  return [
    ...protocol,
    ``,
    `You paused earlier to ask the founder a question. They answered:`,
    ...answered.flatMap((a) => [`Question: ${a.question}`, `Answer: ${a.choice}`]),
    `Continue the work using the answer, and finish it. Do not ask the same question again.`,
  ];
}

/** What withDecisions needs to see of a Builder run; runBuilder's result satisfies it. */
export interface BuilderRound {
  ok: boolean;
  refused: boolean;
  files: string[];
  summary: string;
  cost?: number;
}

export interface DecisionOptions {
  /** Overrides MC_DECISIONS_FILE / ~/.agentvibe/decisions.jsonl. */
  file?: string;
  pollMs?: number;
  timeoutMs?: number;
  /** Replaced in tests so a wait does not take wall-clock time. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** Where the runner's events go: one line of text plus structured data, shown as a receipt. */
  note?: (text: string, data: Record<string, unknown>) => void;
}

function timeoutFromEnv(): number {
  const n = Number(process.env.MC_DECISION_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

/**
 * Run the Builder; while it ends on a DECISION line, ask, wait, and run it again with the answers.
 * Returns the last round (files and cost accumulated across rounds), or null when the wait timed
 * out — in which case the card is already back on Waiting and the caller must stop.
 *
 * A run that was refused or failed is returned as-is: only a clean finish can be asking a question.
 */
export async function withDecisions<T extends BuilderRound>(
  missionId: string,
  run: (extraPrompt: string[]) => Promise<T>,
  opts: DecisionOptions = {},
): Promise<T | null> {
  const file = opts.file ?? decisionsPath();
  const pollMs = opts.pollMs ?? DEFAULT_POLL_MS;
  const timeoutMs = opts.timeoutMs ?? timeoutFromEnv();
  const sleep = opts.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  const note = opts.note ?? (() => {});

  const answered: { question: string; choice: string }[] = [];
  let round = await run(decisionPromptLines(answered));
  for (;;) {
    if (round.refused || !round.ok) return round;
    const asked = parseDecision(round.summary);
    if (!asked) return round;
    if (answered.length >= MAX_DECISION_ROUNDS) {
      note(`builder asked another question after ${MAX_DECISION_ROUNDS} answers; not asking the founder again`, { by: 'builder', decisionCap: MAX_DECISION_ROUNDS });
      return round;
    }

    const needed: DecisionNeeded = {
      type: 'decision_needed',
      id: randomUUID(),
      mission_id: missionId,
      question: asked.question,
      options: asked.options,
      created_at: now(),
    };
    appendMissionLine(needed, file);
    note(`needs you: ${asked.question} [${asked.options.join(' | ')}]`, { by: 'runner', decisionId: needed.id, awaiting: 'founder' });

    const settled = await waitForAnswer(needed.id, file, { pollMs, timeoutMs, sleep, now });
    if (settled.status !== 'answered' || settled.choice === undefined) {
      const expired: DecisionExpired = { type: 'decision_expired', id: needed.id, at: now() };
      appendMissionLine(expired, file);
      // Back to Waiting, the column it was launched from, carrying the reason: the launch route
      // only accepts `waiting`, so the founder can relaunch it, and the card says why it stopped.
      appendMissionLine({ id: missionId, ts: now(), status: 'waiting', error: DECISION_TIMEOUT, costUsd: round.cost } satisfies MissionLine, boardPath(missionsDir()));
      note(`no answer within ${Math.round(timeoutMs / 1000)}s; decision expired, card not advanced`, { by: 'runner', decisionId: needed.id, expired: true });
      return null;
    }

    note(`founder answered: ${settled.choice}`, { by: 'founder', decisionId: needed.id, choice: settled.choice });
    answered.push({ question: asked.question, choice: settled.choice });
    const next = await run(decisionPromptLines(answered));
    // Files written before the question still count, and so does what they cost.
    next.files = [...new Set([...round.files, ...next.files])];
    if (round.cost !== undefined || next.cost !== undefined) next.cost = (round.cost ?? 0) + (next.cost ?? 0);
    round = next;
  }
}

/** Poll the file until `id` is settled or the deadline passes. Reads only — the server writes the answer. */
async function waitForAnswer(
  id: string,
  file: string,
  t: { pollMs: number; timeoutMs: number; sleep: (ms: number) => Promise<void>; now: () => number },
): Promise<Decision | { status: 'pending'; choice?: undefined }> {
  const deadline = t.now() + t.timeoutMs;
  for (;;) {
    const d = foldDecisions(readDecisionLines(file)).find((x) => x.id === id);
    if (d && d.status !== 'pending') return d;
    if (t.now() >= deadline) return { status: 'pending' };
    await t.sleep(t.pollMs);
  }
}
