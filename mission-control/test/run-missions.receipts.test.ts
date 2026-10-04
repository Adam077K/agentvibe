// test/run-missions.receipts.test.ts — B0-03: runner receipts, refused_subagent, and child jobs keyed by
// parent_tool_use_id.
//
// Nothing here launches `claude -p` or `codex exec`. runMission() takes its spawn as a dependency;
// each test hands it a fake that replays fixture stream-json lines and records which binaries were
// asked for. Every test uses its own temp MC_MISSIONS_DIR, so ~/.agentvibe is never touched.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendMissionLine } from '../server/index-cache.ts';
import {
  boardPath,
  eventsPath,
  foldBoard,
  foldTeam,
  readBoardLines,
  readLaunchReceipts,
  type Mission,
  type TeamEvent,
} from '../server/missions.ts';
import { builderArgs, REFUSED_SUBAGENT, runMission, type RunFn, type RunnerDeps } from '../scripts/run-missions.ts';

let dir: string;
let prevDir: string | undefined;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-runner-'));
  prevDir = process.env.MC_MISSIONS_DIR;
  process.env.MC_MISSIONS_DIR = dir;
});
afterEach(() => {
  if (prevDir === undefined) delete process.env.MC_MISSIONS_DIR;
  else process.env.MC_MISSIONS_DIR = prevDir;
  fs.rmSync(dir, { recursive: true, force: true });
});

function seedMission(): Mission {
  const id = randomUUID();
  const ts = Date.now();
  appendMissionLine({ id, ts, status: 'waiting', title: 'Fixture', goal: 'write out.md' }, boardPath(dir));
  appendMissionLine({ id, ts: ts + 1, status: 'queued' }, boardPath(dir));
  const m = foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === id);
  if (!m) throw new Error('seed failed');
  return m;
}

/** A fake spawn: replays `script[bin]` line by line, records every launch, never forks. */
function fakeDeps(script: Record<'claude' | 'codex', unknown[]>) {
  const launched: string[] = [];
  const run: RunFn = async (bin, _args, _cwd, onLine) => {
    const key = bin.includes('codex') ? 'codex' : 'claude';
    launched.push(key);
    for (const l of script[key]) onLine(typeof l === 'string' ? l : JSON.stringify(l));
    return { code: 0, stderr: '' };
  };
  const deps: RunnerDeps = { run, logLaunch: () => {} };
  return { deps, launched };
}

const init = { type: 'system', subtype: 'init', session_id: 's-1', model: 'claude-sonnet-5', parent_tool_use_id: null };
const result = { type: 'result', subtype: 'success', parent_tool_use_id: null, is_error: false, num_turns: 3, total_cost_usd: 0.01, result: 'done' };
const passVerdict = [{ type: 'item.completed', item: { type: 'agent_message', text: 'ok\nVERDICT: {"verdict":"PASS","reasons":["fine"]}' } }];
const writeOk = (id: string) => ({ type: 'user', parent_tool_use_id: null, message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: false, content: 'ok' }] } });
const writeRefused = (id: string) => ({ type: 'user', parent_tool_use_id: null, message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: 'permission denied' }] } });
const agentCall = (name: string, id: string) => ({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id, name, input: { prompt: 'help' } }] } });

function events(id: string): TeamEvent[] {
  return fs.readFileSync(eventsPath(id, dir), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as TeamEvent);
}

describe('run-missions: builder argv', () => {
  test('forbids nested-agent tools and keeps the SLICE registration (no Bash)', () => {
    const a = builderArgs('P');
    expect(a[a.indexOf('--disallowedTools') + 1]).toBe('Bash,Agent,Task');
    expect(a[a.indexOf('--allowedTools') + 1]).toBe('Read,Write,Edit,Glob,Grep');
    expect(a[a.indexOf('--permission-mode') + 1]).toBe('acceptEdits');
    expect(a.slice(0, 2)).toEqual(['-p', 'P']);
    expect(a).toContain('--no-session-persistence');
    expect(a.join(' ')).not.toContain('dangerously');
    expect(a.join(' ')).not.toContain('--bare');
  });
});

describe('run-missions: receipts', () => {
  test('a normal run writes exactly one receipt, and the card reaches Done with the verdict', async () => {
    const m = seedMission();
    const out = path.join(dir, 'out.md');
    fs.writeFileSync(out, 'hello\n');
    const write = { type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id: 't1', name: 'Write', input: { file_path: out } }] } };
    const { deps, launched } = fakeDeps({ claude: [init, write, writeOk('t1'), result], codex: passVerdict });
    await runMission(m, deps);

    // One receipt per launched process: two launches, two receipts.
    const receipts = readLaunchReceipts(m.id, dir);
    expect(launched).toEqual(['claude', 'codex']);
    expect(receipts.map((r) => r.role)).toEqual(['builder', 'referee']);
    expect(receipts[0]).toMatchObject({ missionId: m.id, role: 'builder', exit: 0, turns: 3, resultSubtype: 'success', unparsedLines: 0 });
    expect(receipts[1]).toMatchObject({ missionId: m.id, role: 'referee', exit: 0, unparsedLines: 0 });
    for (const r of receipts) {
      expect(r.parentLaunchId).toBeUndefined();
      expect(r.argvHash).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(receipts[0]!.launchId).not.toBe(receipts[1]!.launchId);
    const after = foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!;
    expect(after).toMatchObject({ status: 'done', verdict: 'PASS' });
  });

  test('a Builder that calls Agent is refused_subagent: no Referee, card not advanced', async () => {
    const m = seedMission();
    const { deps, launched } = fakeDeps({ claude: [init, agentCall('Agent', 'toolu_A'), result], codex: passVerdict });
    await runMission(m, deps);

    expect(launched).toEqual(['claude']);
    const lines = readBoardLines(boardPath(dir)).filter((l) => l.id === m.id);
    expect(lines.map((l) => l.status)).toEqual(['waiting', 'queued', 'working', 'waiting']);
    expect(lines.at(-1)!.error).toBe(REFUSED_SUBAGENT);
    const after = foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!;
    expect(after.status).toBe('waiting');
    expect(after.error).toBe(REFUSED_SUBAGENT);
    expect(after.verdict).toBeUndefined();

    const receipts = readLaunchReceipts(m.id, dir);
    expect(receipts.map((r) => r.role)).toEqual(['builder']);
    const builder = foldTeam(m.id, events(m.id)).agents.find((a) => a.agent === 'builder')!;
    expect(builder.status).toBe('failed');
    expect(events(m.id).some((e) => e.agent === 'runner' && e.text?.includes(REFUSED_SUBAGENT))).toBe(true);
  });

  test('the nested-agent match is case-insensitive', async () => {
    const m = seedMission();
    const { deps, launched } = fakeDeps({ claude: [init, agentCall('agent', 'toolu_a'), result], codex: passVerdict });
    await runMission(m, deps);
    expect(launched).toEqual(['claude']);
    expect(foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!.error).toBe(REFUSED_SUBAGENT);
  });

  test('unparseable stream lines are counted into the receipt, not dropped silently', async () => {
    const m = seedMission();
    const out = path.join(dir, 'out.md');
    fs.writeFileSync(out, 'hello\n');
    const write = { type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id: 't1', name: 'Write', input: { file_path: out } }] } };
    const { deps } = fakeDeps({ claude: [init, 'not json', write, writeOk('t1'), '{torn', result], codex: ['garbage', ...passVerdict] });
    await runMission(m, deps);
    const receipts = readLaunchReceipts(m.id, dir);
    expect(receipts.map((r) => [r.role, r.unparsedLines])).toEqual([['builder', 2], ['referee', 1]]);
  });

  test('a refused write (is_error tool_result) gets no builder file receipt and the card fails', async () => {
    const m = seedMission();
    const out = path.join(dir, 'out.md');
    fs.writeFileSync(out, 'pre-existing\n');
    const write = { type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id: 't1', name: 'Write', input: { file_path: out } }] } };
    const { deps, launched } = fakeDeps({ claude: [init, write, writeRefused('t1'), result], codex: passVerdict });
    await runMission(m, deps);
    expect(events(m.id).filter((e) => e.kind === 'receipt' && (e.data as any)?.file)).toEqual([]);
    expect(launched).toEqual(['claude']); // nothing written, so no Referee
    expect(foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)).toMatchObject({ status: 'failed', error: 'builder reported no files written' });
  });

  test('a write with no result at all gets no receipt; one with a successful result does', async () => {
    const m = seedMission();
    const a = path.join(dir, 'a.md');
    const b = path.join(dir, 'b.md');
    fs.writeFileSync(a, 'a\n');
    fs.writeFileSync(b, 'b\n');
    const w = (id: string, f: string) => ({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id, name: 'Write', input: { file_path: f } }] } });
    const { deps } = fakeDeps({ claude: [init, w('ta', a), w('tb', b), writeOk('tb'), result], codex: passVerdict });
    await runMission(m, deps);
    const files = events(m.id).filter((e) => e.kind === 'receipt' && (e.data as any)?.file).map((e) => (e.data as any).file);
    expect(files).toHaveLength(1);
    expect(String(files[0])).toEndWith('/b.md');
  });

  // Every line of a real stream carries `parent_tool_use_id` -- null at the top level. A
  // reader that treats the key's presence (or null) as "child" would refuse every run.
  const REAL = path.resolve(import.meta.dir, '..', '..', 'kernel', 'internal', 'adapter', 'testdata', 'claude');
  const replay = (name: string) => fs.readFileSync(path.join(REAL, name), 'utf8').split('\n').filter(Boolean);

  test('a real top-level stream (success.jsonl, parent_tool_use_id: null everywhere) is NOT a refusal', async () => {
    const lines = replay('success.jsonl');
    expect(lines.filter((l) => l.includes('"parent_tool_use_id":null')).length).toBeGreaterThan(0); // the fixture is what it claims
    const m = seedMission();
    const { deps } = fakeDeps({ claude: lines, codex: passVerdict });
    await runMission(m, deps);
    const after = foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!;
    expect(after.error).not.toBe(REFUSED_SUBAGENT); // it wrote nothing, so it fails -- for that reason only
    expect(after.error).toBe('builder reported no files written');
    expect(readLaunchReceipts(m.id, dir).map((r) => r.role)).toEqual(['builder']);
  });

  test('positive control: a real stream with nested children (children.jsonl) IS a refusal', async () => {
    const m = seedMission();
    const { deps } = fakeDeps({ claude: replay('children.jsonl'), codex: passVerdict });
    await runMission(m, deps);
    expect(foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!.error).toBe(REFUSED_SUBAGENT);
  });

  test('Task is refused the same way as Agent', async () => {
    const m = seedMission();
    const { deps, launched } = fakeDeps({ claude: [init, agentCall('Task', 'toolu_T'), result], codex: passVerdict });
    await runMission(m, deps);
    expect(launched).toEqual(['claude']);
    expect(foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!.error).toBe(REFUSED_SUBAGENT);
  });

  test('parent_tool_use_id messages become a linked child receipt drawn as "Builder › subagent"', async () => {
    const m = seedMission();
    const child = (text: string) => ({ type: 'assistant', parent_tool_use_id: 'toolu_A', message: { content: [{ type: 'text', text }] } });
    const { deps } = fakeDeps({ claude: [init, agentCall('Agent', 'toolu_A'), child('child one'), child('child two'), result], codex: passVerdict });
    await runMission(m, deps);

    const receipts = readLaunchReceipts(m.id, dir);
    expect(receipts).toHaveLength(2);
    const [parent, sub] = receipts as [(typeof receipts)[0], (typeof receipts)[0]];
    expect(parent.role).toBe('builder');
    expect(sub.role).toBe('builder-subagent');
    expect(sub.parentLaunchId).toBe(parent.launchId);
    expect(sub.launchId).toBe(`${parent.launchId}:toolu_A`);
    expect(sub.endedAt).toBeGreaterThanOrEqual(sub.startedAt);

    const team = foldTeam(m.id, events(m.id));
    const card = team.agents.find((a) => a.agent === 'builder-subagent')!;
    expect(card.title).toBe('Builder › subagent');
    expect(card.status).toBe('failed');
    // The child's words are drawn on the child's card, never on the Builder's.
    const builderText = events(m.id).filter((e) => e.agent === 'builder').map((e) => e.text ?? '');
    expect(builderText.some((t) => t.includes('child one'))).toBe(false);
    expect(events(m.id).some((e) => e.agent === 'builder-subagent' && e.text === 'child two')).toBe(true);
    expect(foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!.status).toBe('waiting');
  });

  test('a child whose parent tool_use line never arrived still gets its own receipt', async () => {
    const m = seedMission();
    const orphan = { type: 'assistant', parent_tool_use_id: 'toolu_Z', message: { content: [{ type: 'text', text: 'orphan' }] } };
    const { deps } = fakeDeps({ claude: [init, orphan, result], codex: passVerdict });
    await runMission(m, deps);
    const receipts = readLaunchReceipts(m.id, dir);
    expect(receipts.map((r) => r.role)).toEqual(['builder', 'builder-subagent']);
    expect(foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === m.id)!.error).toBe(REFUSED_SUBAGENT);
  });
});
