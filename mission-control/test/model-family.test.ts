// test/model-family.test.ts — B0-20 / DR-83: a launch's family comes from the model id, never the
// slot. Acceptance (frozen): "A Codex model launched in a 'Claude' slot is logged `family: codex`;
// a slot/model mismatch is recorded as an event".
//
// Nothing here launches `claude -p` or `codex exec`: runMission() gets a fake spawn that replays
// fixture lines, and every test uses its own temp MC_MISSIONS_DIR.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendMissionLine } from '../server/index-cache.ts';
import { boardPath, eventsPath, foldBoard, foldTeam, readBoardLines, readLaunchReceipts, type Mission, type TeamEvent } from '../server/missions.ts';
import { familyOf, stampFamily } from '../server/model-family.ts';
import { appendLaunchCsv, LAUNCH_CSV_HEADER, runMission, type LaunchRow, type RunFn, type RunnerDeps } from '../scripts/run-missions.ts';

let dir: string;
let prevDir: string | undefined;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-family-'));
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
  return foldBoard(readBoardLines(boardPath(dir))).find((x) => x.id === id)!;
}

/** Runs one mission whose Builder writes out.md and whose Referee passes; returns receipts, events, CSV rows. */
async function launch(models: RunnerDeps['models']) {
  const m = seedMission();
  const out = path.join(dir, 'out.md');
  fs.writeFileSync(out, 'hello\n');
  const claude = [
    { type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'tool_use', id: 't1', name: 'Write', input: { file_path: out } }] } },
    // A write counts only on its successful tool_result (see createWriteTracker).
    { type: 'user', parent_tool_use_id: null, message: { content: [{ type: 'tool_result', tool_use_id: 't1', is_error: false, content: 'ok' }] } },
    { type: 'result', subtype: 'success', is_error: false, num_turns: 1, total_cost_usd: 0.01, result: 'done' },
  ];
  const codex = [{ type: 'item.completed', item: { type: 'agent_message', text: 'VERDICT: {"verdict":"PASS","reasons":["ok"]}' } }];
  const run: RunFn = async (bin, _a, _c, onLine) => {
    for (const l of bin.includes('codex') ? codex : claude) onLine(JSON.stringify(l));
    return { code: 0, stderr: '' };
  };
  // The real CSV writer, pointed at a temp file: the family column is computed inside it.
  const csv = path.join(dir, 'launches.csv');
  const deps: RunnerDeps = { run, logLaunch: (row: LaunchRow) => appendLaunchCsv(csv, row), models };
  await runMission(m, deps);
  const events = fs.readFileSync(eventsPath(m.id, dir), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as TeamEvent);
  const rows = fs.readFileSync(csv, 'utf8').trim().split('\n').map((l) => l.split(','));
  return { m, events, receipts: readLaunchReceipts(m.id, dir), mismatches: events.filter((e) => e.kind === 'slot_model_mismatch'), rows };
}

/** A run whose Builder stream carries one nested-agent message, so a builder-subagent receipt is written. */
async function launchWithChild(models: RunnerDeps['models']) {
  const m = seedMission();
  const claude = [
    { type: 'assistant', parent_tool_use_id: 'toolu_A', message: { content: [{ type: 'text', text: 'nested' }] } },
    { type: 'result', subtype: 'success', is_error: false, num_turns: 1, total_cost_usd: 0.01, result: 'done' },
  ];
  const run: RunFn = async (_bin, _a, _c, onLine) => {
    for (const l of claude) onLine(JSON.stringify(l));
    return { code: 0, stderr: '' };
  };
  await runMission(m, { run, logLaunch: () => {}, models });
  return readLaunchReceipts(m.id, dir);
}

describe('familyOf: model id → family', () => {
  test('derives from the id alone; an unrecognised id is unknown, never guessed', () => {
    expect(familyOf('claude-sonnet-5')).toBe('claude');
    expect(familyOf('gpt-6-astra')).toBe('codex');
    expect(familyOf('o4-mini')).toBe('codex');
    expect(familyOf('codex-mini-latest')).toBe('codex');
    expect(familyOf('gemini-3-pro')).toBe('unknown');
    expect(familyOf('')).toBe('unknown');
    expect(familyOf('opus')).toBe('unknown'); // starts with "o" but is not the o<digit> line
  });
});

describe('launch log family (DR-83)', () => {
  test('ACCEPTANCE: a Codex model in the Claude slot is logged family: codex, and the mismatch is an event', async () => {
    const { receipts, mismatches, rows } = await launch({ claude: 'gpt-6-astra', codex: 'gpt-6-astra' });
    const builder = receipts.find((r) => r.role === 'builder')!;
    expect(builder).toMatchObject({ model: 'gpt-6-astra', family: 'codex', slotFamily: 'claude', slotModelMismatch: true });
    expect(rows[0]!.join(',')).toBe(LAUNCH_CSV_HEADER);
    const builderRow = rows.find((r) => r[1] === 'claude')!; // worker column = the slot
    expect(builderRow[2]).toBe('gpt-6-astra');
    expect(builderRow[7]).toBe('codex');
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]!.data).toMatchObject({ launchId: builder.launchId, role: 'builder', slotFamily: 'claude', family: 'codex' });
  });

  test('claude in the Claude slot: family claude, no flag, no mismatch event', async () => {
    const { receipts, mismatches, rows } = await launch({ claude: 'claude-sonnet-5', codex: 'gpt-6-astra' });
    expect(receipts.map((r) => [r.role, r.family])).toEqual([['builder', 'claude'], ['referee', 'codex']]);
    for (const r of receipts) expect(r.slotModelMismatch).toBeUndefined();
    expect(rows.slice(1).map((r) => r[7])).toEqual(['claude', 'codex']);
    expect(mismatches).toHaveLength(0);
  });

  test('an unknown model id is logged unknown, never the slot family, and raises a mismatch event', async () => {
    const { receipts, mismatches, rows } = await launch({ claude: 'claude-sonnet-5', codex: 'mystery-model-9' });
    const referee = receipts.find((r) => r.role === 'referee')!;
    expect(referee).toMatchObject({ family: 'unknown', slotFamily: 'codex', slotModelMismatch: true });
    expect(rows.find((r) => r[1] === 'codex')![7]).toBe('unknown');
    expect(mismatches.map((e) => e.data?.role)).toEqual(['referee']);
  });

  test('a mismatch is written once per launch, and an old launches.csv header gains the family column', async () => {
    const csv = path.join(dir, 'launches.csv');
    fs.writeFileSync(csv, 'ts,worker,model,mission,seconds,cost_usd,exit\n2026-09-30T00:00:00.000Z,claude,claude-sonnet-5,m,1.0,,0\n');
    const { mismatches, rows } = await launch({ claude: 'o3', codex: 'claude-opus-5' });
    // Two launches, both mismatched: exactly one event each, none duplicated.
    expect(mismatches.map((e) => e.data?.role)).toEqual(['builder', 'referee']);
    expect(rows[0]!.join(',')).toBe(LAUNCH_CSV_HEADER);
    expect(rows).toHaveLength(4); // header, the pre-existing row, two new rows
    expect(rows.slice(2).map((r) => r[7])).toEqual(['codex', 'claude']);
  });
});

describe('familyOf: prefix anchoring and case', () => {
  test('a model id that merely CONTAINS a family name is not that family', () => {
    expect(familyOf('my-claude-clone')).toBe('unknown');
    expect(familyOf('not-claude-3')).toBe('unknown');
    expect(familyOf('xgpt-4')).toBe('unknown');
    expect(familyOf('meta-codex-1')).toBe('unknown');
    expect(familyOf('proto3')).toBe('unknown'); // an o<digit> in the middle is not the o-line
    expect(familyOf('claude')).toBe('unknown'); // the family prefix is `claude-`, not any id starting with the word
  });

  test('case and surrounding whitespace do not change the family', () => {
    expect(familyOf('CLAUDE-Sonnet-5')).toBe('claude');
    expect(familyOf('  claude-opus-5  ')).toBe('claude');
    expect(familyOf('GPT-6-Astra')).toBe('codex');
    expect(familyOf('Codex-Mini-Latest')).toBe('codex');
    expect(familyOf('O3')).toBe('codex');
    expect(familyOf('o')).toBe('unknown');
    expect(familyOf('oa1')).toBe('unknown');
  });

  test('stampFamily flags a mismatch only when the derived family differs from the slot', () => {
    expect(stampFamily('claude', 'Claude-Sonnet-5')).toEqual({ family: 'claude', slotFamily: 'claude' });
    expect(stampFamily('codex', 'claude-opus-5')).toEqual({ family: 'claude', slotFamily: 'codex', slotModelMismatch: true });
    expect(stampFamily('claude', 'mystery')).toEqual({ family: 'unknown', slotFamily: 'claude', slotModelMismatch: true });
  });
});

describe('the subagent receipt is stamped from the model id too', () => {
  test('claude model in the claude slot: family claude, no flag', async () => {
    const receipts = await launchWithChild({ claude: 'claude-sonnet-5', codex: 'gpt-6-astra' });
    const child = receipts.find((r) => r.role === 'builder-subagent')!;
    expect(child).toMatchObject({ model: 'claude-sonnet-5', family: 'claude', slotFamily: 'claude' });
    expect(child.slotModelMismatch).toBeUndefined();
  });

  test('a Codex model in the Claude slot: the child says codex and is flagged, like its parent', async () => {
    const receipts = await launchWithChild({ claude: 'gpt-6-astra', codex: 'gpt-6-astra' });
    const child = receipts.find((r) => r.role === 'builder-subagent')!;
    expect(child).toMatchObject({ model: 'gpt-6-astra', family: 'codex', slotFamily: 'claude', slotModelMismatch: true });
  });
});

describe('the board carries the family of the model that ran, and the mismatch', () => {
  test('every event of a launch is stamped from ITS model id, not from the slot', async () => {
    const { events } = await launch({ claude: 'gpt-6-astra', codex: 'claude-opus-5' });
    const of = (agent: string) => events.filter((e) => e.agent === agent);
    expect(of('builder').length).toBeGreaterThan(1);
    for (const e of of('builder')) expect([e.model, e.family]).toEqual(['gpt-6-astra', 'codex']);
    expect(of('referee').length).toBeGreaterThan(1);
    for (const e of of('referee')) expect([e.model, e.family]).toEqual(['claude-opus-5', 'claude']);
    // The runner is not a model; it keeps its own marker.
    for (const e of of('runner')) expect(e.family).toBe('-');
  });

  test('foldTeam puts the mismatch on the card of the launch that raised it, and only there', async () => {
    const { m, events } = await launch({ claude: 'claude-sonnet-5', codex: 'claude-opus-5' });
    const { agents } = foldTeam(m.id, events);
    const builder = agents.find((a) => a.agent === 'builder')!;
    const referee = agents.find((a) => a.agent === 'referee')!;
    expect(referee).toMatchObject({ family: 'claude', model: 'claude-opus-5', slotMismatch: { slotFamily: 'codex', family: 'claude' } });
    expect(builder.slotMismatch).toBeUndefined();
    expect(builder.family).toBe('claude');
  });

  test('a clean run puts no mismatch on any card', async () => {
    const { m, events } = await launch({ claude: 'claude-sonnet-5', codex: 'gpt-6-astra' });
    for (const a of foldTeam(m.id, events).agents) expect(a.slotMismatch).toBeUndefined();
  });
});

describe('appendLaunchCsv: header migration', () => {
  const OLD = 'ts,worker,model,mission,seconds,cost_usd,exit';
  const row: LaunchRow = { worker: 'claude', model: 'claude-sonnet-5', mission: 'm1', seconds: 1, cost: '0.01', exit: 0 };

  test('is a rename, not an in-place rewrite: no temp file is left and old rows survive byte for byte', () => {
    const csv = path.join(dir, 'launches.csv');
    const oldRow = '2026-09-30T00:00:00.000Z,claude,claude-sonnet-5,m0,1.0,,0';
    fs.writeFileSync(csv, `${OLD}\n${oldRow}\n`);
    const inoBefore = fs.statSync(csv).ino;
    appendLaunchCsv(csv, row);
    expect(fs.readdirSync(dir)).toEqual(['launches.csv']);
    // A reader that had the old file open keeps a complete file; the new one replaces it whole.
    expect(fs.statSync(csv).ino).not.toBe(inoBefore);
    const lines = fs.readFileSync(csv, 'utf8').split('\n');
    expect(lines[0]).toBe(LAUNCH_CSV_HEADER);
    expect(lines[1]).toBe(oldRow); // old rows keep their 7 fields; the family column reads empty for them
    expect(lines[1]!.split(',')).toHaveLength(7);
    expect(lines[2]!.split(',')).toHaveLength(8);
  });

  test('a CRLF header is migrated too, and the file stays CRLF throughout', () => {
    const csv = path.join(dir, 'launches.csv');
    fs.writeFileSync(csv, `${OLD}\r\n2026-09-30T00:00:00.000Z,claude,claude-sonnet-5,m0,1.0,,0\r\n`);
    appendLaunchCsv(csv, row);
    const text = fs.readFileSync(csv, 'utf8');
    expect(text.startsWith(LAUNCH_CSV_HEADER + '\r\n')).toBe(true);
    expect(text.split('\r\n')).toHaveLength(4); // header, old row, new row, trailing empty
    expect(text.replace(/\r\n/g, '')).not.toContain('\n'); // no bare LF anywhere
  });

  test('an up-to-date header is left alone and not rewritten', () => {
    const csv = path.join(dir, 'launches.csv');
    fs.writeFileSync(csv, LAUNCH_CSV_HEADER + '\n');
    const inoBefore = fs.statSync(csv).ino;
    appendLaunchCsv(csv, row);
    expect(fs.statSync(csv).ino).toBe(inoBefore);
    expect(fs.readFileSync(csv, 'utf8').split('\n')).toHaveLength(3);
  });
});
