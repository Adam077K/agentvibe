// scripts/run-missions.ts — v3 thin slice: the founder-run runner for the Missions board.
//
//   bun run scripts/run-missions.ts [--once] [--workdir DIR] [--launch-log FILE]
//
// Polls ~/.agentvibe/missions/board.jsonl (MC_MISSIONS_DIR overrides). For each mission the
// server marked `queued`, it claims it (`working`), then runs a two-agent, two-family team:
//
//   1. Builder  — Claude Code headless (`claude -p … --output-format stream-json --verbose`).
//                 Does the task in --workdir, with file tools only (no Bash).
//   2. Referee  — Codex headless (`codex exec --json -s read-only`). Cross-family review of what
//                 the Builder produced; ends with a machine-readable VERDICT line.
//
// WHY BUILDER + REFEREE AND NOT TWO EQUAL BUILDERS. The slice has to prove the design's riskiest
// seam, and that is not "two models can each write a file" — it is that the authority which
// judges the work is a different party (and model family) from the one that made it, and that
// its verdict reaches the board as data. Split builders would show parallelism, which v3 does
// not doubt, and leave the Referee (the separated verification authority) unexercised.
//
// Every worker stdout line is mapped to a TeamEvent and appended to <id>/events.jsonl as it
// arrives, so the page sees the team live. Receipts (session ids, sha256 of each file written,
// cost) are events too. The server reads this file; it never runs anything.
//
// This script, like consume-dispatch.ts, is OUTSIDE server/**: spawning is its whole job.

import { spawn } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { appendMissionLine } from '../server/index-cache.ts';
import { expireOrphanedDecisions, withDecisions } from './decisions.ts';
import {
  boardPath,
  eventsPath,
  launchesPath,
  type LaunchReceipt,
  foldBoard,
  missionsDir,
  readBoardLines,
  type Mission,
  type MissionLine,
  type TeamEvent,
  type Verdict,
} from '../server/missions.ts';
import { familyOf, stampFamily, type ModelFamily } from '../server/model-family.ts';

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const opt = (name: string, dflt: string) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1]! : dflt;
};

const REPO_ROOT = path.resolve(import.meta.dir, '..', '..');
const WORKDIR = path.resolve(opt('--workdir', REPO_ROOT));
const LAUNCH_LOG = path.resolve(opt('--launch-log', path.join(REPO_ROOT, 'spikes', 'slice', 'launches.csv')));
const CLAUDE_MODEL = process.env.MC_CLAUDE_MODEL ?? 'claude-sonnet-5';
const CODEX_MODEL = process.env.MC_CODEX_MODEL ?? 'gpt-6-astra';
const CLAUDE_BUDGET = process.env.MC_CLAUDE_BUDGET_USD ?? '2';
const CLAUDE_BIN = process.env.MC_CLAUDE_BIN ?? 'claude';
const CODEX_BIN = process.env.MC_CODEX_BIN ?? 'codex';

// `slot` is the family a seat DECLARES. It is compared against, never logged as, the family of the
// model that actually ran (DR-83) — see server/model-family.ts.
const BUILDER = { agent: 'builder', title: 'Builder', model: CLAUDE_MODEL, family: 'anthropic', slot: 'claude' as ModelFamily };
const REFEREE = { agent: 'referee', title: 'Referee', model: CODEX_MODEL, family: 'openai', slot: 'codex' as ModelFamily };
const RUNNER = { agent: 'runner', title: 'Runner', model: '-', family: '-', slot: 'unknown' as ModelFamily };
export const SUBAGENT = { agent: 'builder-subagent', title: 'Builder › subagent', model: CLAUDE_MODEL, family: 'anthropic', slot: 'claude' as ModelFamily };
type Who = typeof BUILDER;

/** The error a refused run carries on the board. One spelling, shared with the tests. */
export const REFUSED_SUBAGENT = 'refused_subagent';

/** Agent/Task in any case: a tool name that differs only by case must not slip past the refusal. */
const NESTED_AGENT_TOOL = /^(agent|task)$/i;

export type RunFn = (bin: string, args: string[], cwd: string, onLine: (l: string) => void) => Promise<{ code: number | null; stderr: string }>;

/**
 * What runMission() reaches outside itself. Defaults are the real spawn and the real CSV log; the
 * fixture tests replace both, so no test ever launches `claude -p` or `codex exec`.
 */
export interface RunnerDeps {
  run: RunFn;
  logLaunch: (row: LaunchRow) => void;
  /** Model ids per slot. Absent → MC_CLAUDE_MODEL / MC_CODEX_MODEL. A slot may be given any id. */
  models?: { claude?: string; codex?: string };
}

export type LaunchRow = { worker: string; model: string; mission: string; seconds: number; cost: string; exit: number | null };

export const LAUNCH_CSV_HEADER = 'ts,worker,model,mission,seconds,cost_usd,exit,family';

/**
 * Append one row to launches.csv. `family` is familyOf(row.model) — computed here from the model id
 * and nowhere else, so no caller can pass a slot's family in its place. A file still carrying the
 * pre-B0-20 header gains the `family` column in place; its older rows read that column as empty.
 */
export function appendLaunchCsv(file: string, row: LaunchRow): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, LAUNCH_CSV_HEADER + '\n');
  else {
    const text = fs.readFileSync(file, 'utf8');
    const nl = text.indexOf('\n');
    const head = nl < 0 ? text : text.slice(0, nl);
    if (head === 'ts,worker,model,mission,seconds,cost_usd,exit') fs.writeFileSync(file, LAUNCH_CSV_HEADER + text.slice(head.length));
  }
  fs.appendFileSync(
    file,
    [new Date().toISOString(), row.worker, row.model, row.mission, row.seconds.toFixed(1), row.cost, String(row.exit), familyOf(row.model)].join(',') + '\n',
  );
}

/**
 * Stamp a launch with its derived family and, when the slot declared another, record exactly one
 * `slot_model_mismatch` event for that launch. Returns the receipt fields.
 */
function stampLaunch(emit: ReturnType<typeof emitter>, who: Who, role: string, model: string, launchId: string) {
  const stamp = stampFamily(who.slot, model);
  if (stamp.slotModelMismatch) {
    emit(RUNNER, {
      kind: 'slot_model_mismatch',
      text: `${role} slot declares ${stamp.slotFamily} but model ${model} is ${stamp.family}`,
      data: { launchId, role, model, slotFamily: stamp.slotFamily, family: stamp.family },
    });
  }
  return stamp;
}

/**
 * The Builder's pinned launch line (09a-ENGINEERING "Pinned launch lines": forbid nested-agent
 * tools). `Bash` stays disallowed as well: the SLICE was registered as "Claude `acceptEdits`
 * without Bash" (12-SPIKE-RESULTS), and this Builder writes files, it does not run them.
 */
export function builderArgs(prompt: string, model: string = CLAUDE_MODEL): string[] {
  return [
    '-p', prompt,
    '--model', model,
    '--output-format', 'stream-json', '--verbose',
    '--permission-mode', 'acceptEdits',
    '--allowedTools', 'Read,Write,Edit,Glob,Grep',
    '--disallowedTools', 'Bash,Agent,Task',
    '--max-budget-usd', CLAUDE_BUDGET,
    '--no-session-persistence',
  ];
}

function board(): string {
  return boardPath(missionsDir());
}

function emitter(id: string) {
  const file = eventsPath(id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return (who: Who, e: Omit<TeamEvent, 'ts' | 'agent' | 'title' | 'model' | 'family'> & { model?: string }) => {
    const ev: TeamEvent = { ts: Date.now(), agent: who.agent, title: who.title, model: e.model ?? who.model, family: who.family, ...e } as TeamEvent;
    fs.appendFileSync(file, JSON.stringify(ev) + '\n');
  };
}

function logLaunch(row: LaunchRow) {
  appendLaunchCsv(LAUNCH_LOG, row);
}

/** Spawn with an args array (no shell), feed each stdout line to `onLine`, resolve with the exit code. */
const run: RunFn = (bin, args, cwd, onLine) => {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => {
      buf += d.toString('utf8');
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line) onLine(line);
      }
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr = (stderr + d.toString('utf8')).slice(-4000);
    });
    child.on('error', (err) => resolve({ code: -1, stderr: String(err) }));
    child.on('close', (code) => {
      if (buf.trim()) onLine(buf.trim());
      resolve({ code, stderr });
    });
  });
};

const REAL_DEPS: RunnerDeps = { run, logLaunch };

const clip = (s: string, n = 240) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

function sha256File(p: string): { sha256: string; bytes: number } | null {
  try {
    const b = fs.readFileSync(p);
    return { sha256: createHash('sha256').update(b).digest('hex'), bytes: b.length };
  } catch {
    return null;
  }
}

// ── Builder: Claude Code ─────────────────────────────────────────────────────────────────────

/**
 * Which files the Builder actually wrote. A Write/Edit is a REQUEST at `tool_use`; it is a write
 * only once its matching `tool_result` (same tool_use_id) comes back without `is_error`. Counting
 * at the request gave a refused write a `by: builder` receipt for a file nothing wrote.
 */
export function createWriteTracker() {
  const pending = new Map<string, string>();
  const written = new Set<string>();
  return {
    onToolUse(c: { id?: unknown; name?: unknown; input?: { file_path?: unknown } }) {
      if ((c.name === 'Write' || c.name === 'Edit') && typeof c.id === 'string' && typeof c.input?.file_path === 'string') pending.set(c.id, c.input.file_path);
    },
    onToolResult(c: { tool_use_id?: unknown; is_error?: unknown }) {
      if (typeof c.tool_use_id !== 'string') return;
      const file = pending.get(c.tool_use_id);
      if (file === undefined) return;
      pending.delete(c.tool_use_id);
      if (!c.is_error) written.add(file);
    },
    files: (): ReadonlySet<string> => written,
  };
}

async function runBuilder(m: Mission, emit: ReturnType<typeof emitter>, deps: RunnerDeps, extraPrompt: string[] = []) {
  const prompt = [
    `You are the Builder on a mission from a Mission Control board.`,
    `Mission title: ${m.title}`,
    `Goal: ${m.goal}`,
    ``,
    `Work in the current directory. Write only the file(s) the goal names. Do not modify anything else.`,
    `When done, reply with one short paragraph naming each file you wrote.`,
    ...extraPrompt,
  ].join('\n');
  const launchId = randomUUID();
  const model = deps.models?.claude ?? CLAUDE_MODEL;
  const args = builderArgs(prompt, model);
  const argvHash = createHash('sha256').update(args.join('\u0000')).digest('hex');
  emit(BUILDER, { kind: 'status', status: 'starting', model, text: `claude -p (${model}) in ${WORKDIR}` });
  const stamp = stampLaunch(emit, BUILDER, 'builder', model, launchId);
  const writes = createWriteTracker();
  let cost: number | undefined;
  let summary = '';
  let isError = false;
  let turns: number | null = null;
  let resultSubtype: string | null = null;
  // A message carrying a parent_tool_use_id came from a nested agent, whether or not the tool_use
  // that spawned it was seen first: only Agent/Task produce such messages, and a child whose parent
  // line was dropped must still get its own receipt rather than be drawn as the Builder.
  const children = new Map<string, LaunchReceipt>();
  let refused = false;
  let refusalTool: string | undefined;
  let unparsed = 0;
  const t0 = Date.now();
  const { code, stderr } = await deps.run(CLAUDE_BIN, args, WORKDIR, (line) => {
    let j: any;
    try {
      j = JSON.parse(line);
    } catch {
      unparsed++;
      return;
    }
    const parentId: string | undefined = typeof j.parent_tool_use_id === 'string' && j.parent_tool_use_id ? j.parent_tool_use_id : undefined;
    if (parentId) {
      refused = true;
      const seen = children.get(parentId);
      if (seen) seen.endedAt = Date.now();
      else {
        children.set(parentId, {
          launchId: `${launchId}:${parentId}`,
          missionId: m.id,
          role: 'builder-subagent',
          argvHash,
          model,
          ...stampFamily(SUBAGENT.slot, model),
          startedAt: Date.now(),
          endedAt: Date.now(),
          exit: null,
          turns: null,
          resultSubtype: null,
          parentLaunchId: launchId,
        });
        emit(SUBAGENT, { kind: 'status', status: 'starting', text: `Builder subagent (parent tool_use ${parentId})` });
      }
      if (j.type === 'assistant') {
        for (const c of j.message?.content ?? []) {
          if (c.type === 'text' && c.text?.trim()) emit(SUBAGENT, { kind: 'message', text: clip(c.text.trim()) });
        }
      }
      return;
    }
    if (j.type === 'system' && j.subtype === 'init') {
      emit(BUILDER, { kind: 'status', status: 'working', model: j.model, text: `session ${j.session_id}`, data: { session_id: j.session_id } });
    } else if (j.type === 'assistant') {
      for (const c of j.message?.content ?? []) {
        if (c.type === 'text' && c.text?.trim()) emit(BUILDER, { kind: 'message', text: clip(c.text.trim()) });
        if (c.type === 'tool_use') {
          if (NESTED_AGENT_TOOL.test(String(c.name ?? ''))) {
            refused = true;
            refusalTool = c.name;
            emit(BUILDER, { kind: 'status', status: 'failed', text: `${REFUSED_SUBAGENT}: Builder called ${c.name}, which is disallowed` });
            continue;
          }
          const fp = c.input?.file_path ?? c.input?.path ?? c.input?.pattern ?? '';
          writes.onToolUse(c);
          emit(BUILDER, { kind: 'tool', text: `${c.name} ${clip(String(fp), 120)}` });
        }
      }
    } else if (j.type === 'user') {
      for (const c of Array.isArray(j.message?.content) ? j.message.content : []) if (c.type === 'tool_result') writes.onToolResult(c);
    } else if (j.type === 'result') {
      cost = j.total_cost_usd;
      summary = String(j.result ?? '');
      isError = !!j.is_error;
      turns = typeof j.num_turns === 'number' ? j.num_turns : null;
      resultSubtype = j.subtype ?? null;
      emit(BUILDER, {
        kind: 'result',
        status: isError ? 'failed' : 'finished',
        costUsd: cost,
        text: clip(summary, 400),
        data: { subtype: j.subtype, num_turns: j.num_turns, duration_ms: j.duration_ms, session_id: j.session_id },
      });
    }
  });
  const secs = (Date.now() - t0) / 1000;
  deps.logLaunch({ worker: 'claude', model, mission: m.id, seconds: secs, cost: cost?.toFixed(4) ?? '', exit: code });
  const receipt: LaunchReceipt = {
    launchId, missionId: m.id, role: 'builder', argvHash, model, ...stamp,
    startedAt: t0, endedAt: Date.now(), exit: code, turns, resultSubtype, unparsedLines: unparsed,
  };
  appendMissionLine(receipt, launchesPath(m.id));
  for (const child of children.values()) appendMissionLine(child, launchesPath(m.id));
  if (refused) {
    // The result line may have drawn the Builder `finished`; a refused run must not end that way,
    // and a child card must not be left `starting` after the process that carried it has exited.
    const why = refusalTool ? `Builder called ${refusalTool}` : 'a nested agent ran';
    emit(BUILDER, { kind: 'status', status: 'failed', text: `${REFUSED_SUBAGENT}: ${why}` });
    for (const [parentId] of children) emit(SUBAGENT, { kind: 'status', status: 'failed', text: `${REFUSED_SUBAGENT}: nested agent under tool_use ${parentId}` });
    emit(RUNNER, { kind: 'receipt', text: `builder ${REFUSED_SUBAGENT} (${refusalTool ?? 'nested agent'}); card not advanced`, data: { by: 'builder', refused: true, launchId, children: children.size } });
    return { ok: false, files: [] as string[], summary, cost, refused: true };
  }
  if (code !== 0 && !isError) emit(BUILDER, { kind: 'status', status: 'failed', text: `exit ${code}: ${clip(stderr)}` });
  const files = [...writes.files()].map((f) => path.resolve(WORKDIR, f));
  for (const f of files) {
    const h = sha256File(f);
    emit(RUNNER, { kind: 'receipt', text: `file ${path.relative(WORKDIR, f)}`, data: { by: 'builder', file: path.relative(WORKDIR, f), ...(h ?? { missing: true }) } });
  }
  emit(RUNNER, { kind: 'receipt', text: `builder exit ${code}, ${secs.toFixed(1)}s, $${cost?.toFixed(4) ?? '?'}`, data: { by: 'builder', exit: code, seconds: secs, costUsd: cost } });
  return { ok: code === 0 && !isError, files, summary, cost, refused: false };
}

// ── Referee: Codex ───────────────────────────────────────────────────────────────────────────

/**
 * The Referee's verdict is its LAST non-empty line, anchored `^VERDICT:`. Anything else is no
 * verdict. The Referee's prompt quotes the Builder's own summary, so a `VERDICT:` line earlier in
 * the output may be the Builder's words echoed back; scanning the whole text let one spoof it.
 */
export function parseVerdict(text: string): { verdict: Verdict; reasons: string[] } | null {
  const last = text.split('\n').map((l) => l.trim()).filter(Boolean).at(-1);
  const m = last?.match(/^VERDICT:\s*(\{.*\})$/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1]!);
    if (j.verdict === 'PASS' || j.verdict === 'FAIL') return { verdict: j.verdict, reasons: Array.isArray(j.reasons) ? j.reasons.map(String) : [] };
  } catch {
    /* fail closed */
  }
  return null;
}

async function runReferee(m: Mission, built: { files: string[]; summary: string }, emit: ReturnType<typeof emitter>, deps: RunnerDeps) {
  const rel = built.files.map((f) => path.relative(WORKDIR, f));
  const outFile = path.join(path.dirname(eventsPath(m.id)), 'referee-last-message.txt');
  const prompt = [
    `You are the Referee: an independent reviewer from a different model family than the Builder.`,
    `Mission title: ${m.title}`,
    `Goal: ${m.goal}`,
    `The Builder says it wrote: ${rel.length ? rel.join(', ') : '(no files reported)'}`,
    `Builder's own summary: ${clip(built.summary, 600)}`,
    ``,
    `Inspect the files (read-only) and any sources the goal names. Judge only whether the goal is met:`,
    `the file exists, it does what the goal asks, and every factual claim in it is supported by its sources.`,
    `Be brief. End your reply with exactly one final line of the form:`,
    `VERDICT: {"verdict":"PASS"|"FAIL","reasons":["short reason", "..."]}`,
  ].join('\n');
  const model = deps.models?.codex ?? CODEX_MODEL;
  const args = ['exec', '--json', '--skip-git-repo-check', '-s', 'read-only', '-m', model, '-C', WORKDIR, '-o', outFile, prompt];
  const launchId = randomUUID();
  const argvHash = createHash('sha256').update(args.join('\u0000')).digest('hex');
  let unparsed = 0;
  fs.rmSync(outFile, { force: true }); // a relaunch must not read the dead run's last message
  emit(REFEREE, { kind: 'status', status: 'starting', model, text: `codex exec (${model}) read-only` });
  const stamp = stampLaunch(emit, REFEREE, 'referee', model, launchId);
  const t0 = Date.now();
  let lastMessage = '';
  const { code, stderr } = await deps.run(CODEX_BIN, args, WORKDIR, (line) => {
    let j: any;
    try {
      j = JSON.parse(line);
    } catch {
      unparsed++;
      return;
    }
    const item = j.item ?? {};
    if (j.type === 'thread.started') emit(REFEREE, { kind: 'status', status: 'working', text: `thread ${j.thread_id}`, data: { thread_id: j.thread_id } });
    else if (j.type === 'item.started' && item.type === 'command_execution') emit(REFEREE, { kind: 'tool', text: `$ ${clip(String(item.command), 160)}` });
    else if (j.type === 'item.completed' && item.type === 'agent_message') {
      lastMessage = String(item.text ?? '');
      emit(REFEREE, { kind: 'message', text: clip(lastMessage, 400) });
    } else if (j.type === 'item.completed' && item.type === 'reasoning' && item.text) emit(REFEREE, { kind: 'message', text: `(thinking) ${clip(String(item.text), 160)}` });
    else if (j.type === 'turn.completed') emit(REFEREE, { kind: 'result', text: `tokens in ${j.usage?.input_tokens ?? '?'} / out ${j.usage?.output_tokens ?? '?'}`, data: { usage: j.usage } });
    else if (j.type === 'turn.failed' || j.type === 'error') emit(REFEREE, { kind: 'status', status: 'failed', text: clip(JSON.stringify(j)) });
  });
  const secs = (Date.now() - t0) / 1000;
  deps.logLaunch({ worker: 'codex', model, mission: m.id, seconds: secs, cost: '', exit: code });
  // One receipt per launched process (server/missions.ts): the Referee is a launch like the Builder.
  appendMissionLine({
    launchId, missionId: m.id, role: 'referee', argvHash, model, ...stamp,
    startedAt: t0, endedAt: Date.now(), exit: code, turns: null, resultSubtype: null, unparsedLines: unparsed,
  } satisfies LaunchReceipt, launchesPath(m.id));
  if (!lastMessage) {
    try {
      lastMessage = fs.readFileSync(outFile, 'utf8');
    } catch {
      /* none */
    }
  }
  const verdict = parseVerdict(lastMessage);
  if (verdict) emit(REFEREE, { kind: 'verdict', status: 'finished', text: `${verdict.verdict}: ${verdict.reasons.join('; ')}`, data: verdict });
  else emit(REFEREE, { kind: 'status', status: 'failed', text: `no VERDICT line (exit ${code}) ${clip(stderr)}` });
  emit(RUNNER, { kind: 'receipt', text: `referee exit ${code}, ${secs.toFixed(1)}s`, data: { by: 'referee', exit: code, seconds: secs, lastMessageFile: outFile } });
  return { code, verdict };
}

// ── Mission loop ─────────────────────────────────────────────────────────────────────────────

// One runner per mission. The lock is an O_EXCL file, `<id>/runner.lock`, holding the owner's pid —
// the same append-only, file-per-fact style as the board, with no server in the path. Winning the
// lock is not enough: the board is re-read under it, because another runner may have run the
// mission to its end and released the lock between our fold and our claim.

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code !== 'ESRCH'; // EPERM: it exists, it is just not ours
  }
}

const lockPath = (id: string, dir: string) => path.join(path.dirname(eventsPath(id, dir)), 'runner.lock');

/** An unparseable lock (empty, garbage) is retaken once it is this old. Locks are written whole, so this is outside damage. */
export const LOCK_STALE_MS = 60_000;

/**
 * Take the lock iff it does not exist. The pid is written to a private temp file first and then
 * link()ed into place — link() fails with EEXIST if the target exists, so the lock is created
 * atomically AND complete: a peer can never read it half-written and mistake it for garbage.
 */
function takeLock(file: string): boolean {
  const tmp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}`;
  fs.writeFileSync(tmp, String(process.pid));
  try {
    fs.linkSync(tmp, file);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
    return false;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/**
 * `free` — no lock. `held` — a live owner (or an unparseable lock still inside LOCK_STALE_MS).
 * `stale` — the owner is gone; `key` names THIS lock file's identity (inode + mtime), read through
 * one open fd so the identity and the pid are of the same file.
 */
function inspectLock(file: string): 'free' | 'held' | { stale: string } {
  let fd: number;
  try {
    fd = fs.openSync(file, 'r');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return 'free'; // a peer removed it: not an error
    throw e;
  }
  try {
    const st = fs.fstatSync(fd);
    const text = fs.readFileSync(fd, 'utf8').trim();
    const owner = /^\d+$/.test(text) ? Number(text) : 0;
    const dead = owner > 0 ? !pidAlive(owner) : Date.now() - st.mtimeMs > LOCK_STALE_MS;
    return dead ? { stale: `${st.ino}-${st.mtimeMs}` } : 'held';
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * True iff this runner now owns `id`: it held the lock, found the mission still `queued`, and wrote `working`.
 *
 * Replacing a STALE lock is exclusive too. Every claimer that sees the same stale lock races to
 * create one marker file named for that lock's identity (O_EXCL); only the winner may remove it
 * and retake. Remove-then-create without that gate let a second claimer delete the first one's
 * brand-new lock. A marker whose creator crashed is itself reaped after LOCK_STALE_MS.
 */
export function claimMission(id: string, dir: string = missionsDir()): boolean {
  const file = lockPath(id, dir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let owned = false;
  for (let attempt = 0; attempt < 3 && !owned; attempt++) {
    if (takeLock(file)) {
      owned = true;
      break;
    }
    const seen = inspectLock(file);
    if (seen === 'free') continue; // lost it to a peer's release between our attempt and our look: retry
    if (seen === 'held') return false;
    const marker = `${file}.takeover-${seen.stale}`;
    try {
      fs.writeFileSync(marker, String(process.pid), { flag: 'wx' });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      try {
        if (Date.now() - fs.statSync(marker).mtimeMs > LOCK_STALE_MS) fs.rmSync(marker, { force: true }); // reaped; the next poll retakes
      } catch {
        /* gone */
      }
      return false;
    }
    fs.rmSync(file, { force: true });
  }
  if (!owned) return false;
  const mission = foldBoard(readBoardLines(boardPath(dir))).find((m) => m.id === id);
  if (mission?.status !== 'queued') {
    fs.rmSync(file, { force: true });
    return false;
  }
  try {
    appendMissionLine({ id, ts: Date.now(), status: 'working', runnerPid: process.pid } satisfies MissionLine, boardPath(dir));
  } catch (e) {
    fs.rmSync(file, { force: true });
    throw e;
  }
  return true;
}

export function releaseMission(id: string, dir: string = missionsDir()): void {
  const file = lockPath(id, dir);
  fs.rmSync(file, { force: true });
  let names: string[] = [];
  try {
    names = fs.readdirSync(path.dirname(file));
  } catch {
    /* no mission dir, nothing to clear */
  }
  for (const n of names) if (n.startsWith('runner.lock.takeover-')) fs.rmSync(path.join(path.dirname(file), n), { force: true });
}

/** `working` cards whose runner died go back to `waiting`, each with an event. Returns the ids reset. */
export function reconcileWorking(dir: string = missionsDir()): string[] {
  const lines = readBoardLines(boardPath(dir));
  const pidOf = new Map<string, number>();
  for (const l of lines) if (typeof l.runnerPid === 'number') pidOf.set(l.id, l.runnerPid);
  const reset: string[] = [];
  for (const m of foldBoard(lines)) {
    const pid = pidOf.get(m.id);
    if (m.status !== 'working' || pid === undefined || pid === process.pid || pidAlive(pid)) continue;
    appendMissionLine({ id: m.id, ts: Date.now(), status: 'waiting' } satisfies MissionLine, boardPath(dir));
    releaseMission(m.id, dir);
    const file = eventsPath(m.id, dir);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const ev: TeamEvent = { ts: Date.now(), agent: RUNNER.agent, title: RUNNER.title, model: RUNNER.model, family: RUNNER.family, kind: 'status', text: `reconciled: runner pid ${pid} is gone; mission returned to waiting` };
    fs.appendFileSync(file, JSON.stringify(ev) + '\n');
    reset.push(m.id);
  }
  return reset;
}

export async function runMission(m: Mission, deps: RunnerDeps = REAL_DEPS) {
  if (!claimMission(m.id)) {
    console.log(`[runner] mission ${m.id} — not claimed (another runner holds it, or it is no longer queued)`);
    return;
  }
  try {
    await runClaimed(m, deps);
  } finally {
    releaseMission(m.id);
  }
}

async function runClaimed(m: Mission, deps: RunnerDeps) {
  const emit = emitter(m.id);
  emit(RUNNER, { kind: 'status', text: `claimed by runner pid ${process.pid}; workdir ${WORKDIR}` });
  console.log(`[runner] mission ${m.id} "${m.title}" — builder starting`);
  const built = await withDecisions(m.id, (extra) => runBuilder(m, emit, deps, extra), {
    note: (text, data) => emit(RUNNER, { kind: 'receipt', text, data }),
  });
  if (!built) return; // asked the founder, no answer in time: withDecisions put the card back on Waiting
  if (built.refused) {
    // Not a generic failure, and not a Done card. The Builder broke the one-process rule, so its
    // output is not the Builder's alone and the Referee is not asked to judge it. The card goes
    // back to Waiting -- the column it was launched from -- carrying the reason, so the founder
    // sees why it did not advance and can relaunch it (the launch route only accepts `waiting`).
    appendMissionLine({ id: m.id, ts: Date.now(), status: 'waiting', error: REFUSED_SUBAGENT, costUsd: built.cost } satisfies MissionLine, board());
    console.log(`[runner] mission ${m.id} ${REFUSED_SUBAGENT}: card not advanced`);
    return;
  }
  if (!built.ok || built.files.length === 0) {
    const error = built.ok ? 'builder reported no files written' : 'builder failed';
    appendMissionLine({ id: m.id, ts: Date.now(), status: 'failed', error, costUsd: built.cost } satisfies MissionLine, board());
    console.log(`[runner] mission ${m.id} failed: ${error}`);
    return;
  }
  console.log(`[runner] mission ${m.id} — referee starting`);
  const ref = await runReferee(m, built, emit, deps);
  const line: MissionLine = ref.verdict
    ? { id: m.id, ts: Date.now(), status: 'done', verdict: ref.verdict.verdict, verdictReasons: ref.verdict.reasons, costUsd: built.cost }
    : { id: m.id, ts: Date.now(), status: 'failed', error: 'referee returned no verdict', costUsd: built.cost };
  appendMissionLine(line, board());
  console.log(`[runner] mission ${m.id} → ${line.status} ${line.verdict ?? line.error}`);
}

async function main() {
  console.log(`[runner] board ${board()} · workdir ${WORKDIR} · builder ${CLAUDE_MODEL} · referee ${CODEX_MODEL}`);
  for (const id of reconcileWorking()) console.log(`[runner] mission ${id} — previous runner is gone; back to waiting`);
  const orphaned = expireOrphanedDecisions();
  if (orphaned.length) console.log(`[runner] expired ${orphaned.length} decision(s) left pending by a runner that is gone`);
  for (;;) {
    const queued = foldBoard(readBoardLines(board())).filter((m) => m.status === 'queued');
    for (const m of queued) await runMission(m);
    if (flag('--once') && queued.length > 0) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
}

if (import.meta.main) await main();
