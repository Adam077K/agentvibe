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
import { createHash, randomUUID } from 'node:crypto';
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

const BUILDER = { agent: 'builder', title: 'Builder', model: CLAUDE_MODEL, family: 'anthropic' };
const REFEREE = { agent: 'referee', title: 'Referee', model: CODEX_MODEL, family: 'openai' };
const RUNNER = { agent: 'runner', title: 'Runner', model: '-', family: '-' };
export const SUBAGENT = { agent: 'builder-subagent', title: 'Builder › subagent', model: CLAUDE_MODEL, family: 'anthropic' };
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
  logLaunch: (row: { worker: string; model: string; mission: string; seconds: number; cost: string; exit: number | null }) => void;
}

/**
 * The Builder's pinned launch line (09a-ENGINEERING "Pinned launch lines": forbid nested-agent
 * tools). `Bash` stays disallowed as well: the SLICE was registered as "Claude `acceptEdits`
 * without Bash" (12-SPIKE-RESULTS), and this Builder writes files, it does not run them.
 */
export function builderArgs(prompt: string): string[] {
  return [
    '-p', prompt,
    '--model', CLAUDE_MODEL,
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

function logLaunch(row: { worker: string; model: string; mission: string; seconds: number; cost: string; exit: number | null }) {
  fs.mkdirSync(path.dirname(LAUNCH_LOG), { recursive: true });
  if (!fs.existsSync(LAUNCH_LOG)) fs.writeFileSync(LAUNCH_LOG, 'ts,worker,model,mission,seconds,cost_usd,exit\n');
  fs.appendFileSync(
    LAUNCH_LOG,
    [new Date().toISOString(), row.worker, row.model, row.mission, row.seconds.toFixed(1), row.cost, String(row.exit)].join(',') + '\n',
  );
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
  const args = builderArgs(prompt);
  const argvHash = createHash('sha256').update(args.join('\u0000')).digest('hex');
  emit(BUILDER, { kind: 'status', status: 'starting', text: `claude -p (${CLAUDE_MODEL}) in ${WORKDIR}` });
  const written = new Set<string>();
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
          model: CLAUDE_MODEL,
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
          if ((c.name === 'Write' || c.name === 'Edit') && c.input?.file_path) written.add(c.input.file_path);
          emit(BUILDER, { kind: 'tool', text: `${c.name} ${clip(String(fp), 120)}` });
        }
      }
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
  deps.logLaunch({ worker: 'claude', model: CLAUDE_MODEL, mission: m.id, seconds: secs, cost: cost?.toFixed(4) ?? '', exit: code });
  const receipt: LaunchReceipt = {
    launchId, missionId: m.id, role: 'builder', argvHash, model: CLAUDE_MODEL,
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
  const files = [...written].map((f) => path.resolve(WORKDIR, f));
  for (const f of files) {
    const h = sha256File(f);
    emit(RUNNER, { kind: 'receipt', text: `file ${path.relative(WORKDIR, f)}`, data: { by: 'builder', file: path.relative(WORKDIR, f), ...(h ?? { missing: true }) } });
  }
  emit(RUNNER, { kind: 'receipt', text: `builder exit ${code}, ${secs.toFixed(1)}s, $${cost?.toFixed(4) ?? '?'}`, data: { by: 'builder', exit: code, seconds: secs, costUsd: cost } });
  return { ok: code === 0 && !isError, files, summary, cost, refused: false };
}

// ── Referee: Codex ───────────────────────────────────────────────────────────────────────────

export function parseVerdict(text: string): { verdict: Verdict; reasons: string[] } | null {
  const lines = text.trim().split('\n').reverse();
  for (const l of lines) {
    const m = l.match(/VERDICT:\s*(\{.*\})\s*$/);
    if (!m) continue;
    try {
      const j = JSON.parse(m[1]!);
      if (j.verdict === 'PASS' || j.verdict === 'FAIL') return { verdict: j.verdict, reasons: Array.isArray(j.reasons) ? j.reasons.map(String) : [] };
    } catch {
      /* fall through */
    }
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
  const args = ['exec', '--json', '--skip-git-repo-check', '-s', 'read-only', '-m', CODEX_MODEL, '-C', WORKDIR, '-o', outFile, prompt];
  const launchId = randomUUID();
  const argvHash = createHash('sha256').update(args.join('\u0000')).digest('hex');
  let unparsed = 0;
  emit(REFEREE, { kind: 'status', status: 'starting', text: `codex exec (${CODEX_MODEL}) read-only` });
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
  deps.logLaunch({ worker: 'codex', model: CODEX_MODEL, mission: m.id, seconds: secs, cost: '', exit: code });
  // One receipt per launched process (server/missions.ts): the Referee is a launch like the Builder.
  appendMissionLine({
    launchId, missionId: m.id, role: 'referee', argvHash, model: CODEX_MODEL,
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

export async function runMission(m: Mission, deps: RunnerDeps = REAL_DEPS) {
  const claim: MissionLine = { id: m.id, ts: Date.now(), status: 'working', runnerPid: process.pid };
  appendMissionLine(claim, board());
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
