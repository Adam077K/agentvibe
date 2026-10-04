// B0-12 — Scorecard v0 + Budget Ledger v0. Pure-function tests: no filesystem, no clock.
import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { buildScorecard, isoWeekWindow, MAX_LAUNCH_MS, MAX_MINUTES, MAX_TURNS, renderMarkdown, type Cell, type Scorecard, type SourceText } from '../scripts/scorecard.ts';

const WEEK = '2026-W40'; // Mon 2026-09-28 .. Mon 2026-10-05 (UTC)
const T = Date.UTC(2026, 8, 30, 10, 0, 0); // Wed of that week
const REGISTRY: SourceText = {
  file: 'build/providers/registry.yml',
  text: ['rows:', '  - plan: Claude Max 20x', '    model: claude-sonnet-5', '    weekly_cap: unknown',
    '  - plan: ChatGPT Pro (Codex)', '    model: gpt-6-astra'].join('\n'),
};
const receipt = (o: Record<string, unknown> = {}) => JSON.stringify({
  launchId: 'L1', missionId: 'M1', role: 'builder', argvHash: 'h', model: 'claude-sonnet-5',
  startedAt: T, endedAt: T + 152_900, exit: 0, turns: 12, resultSubtype: 'success', ...o,
});
const allCells = (s: Scorecard): Cell[] => [
  ...s.metrics.map((m) => m.cell),
  ...s.budgetLedger.flatMap((f) => [f.launches, f.turns, f.wallClock, f.windowCap, f.weeklyCap]),
];
const metric = (s: Scorecard, measure: string) => s.metrics.find((m) => m.measure === measure)!.cell;

describe('scorecard v0', () => {
  test('empty receipts and no minutes file: every cell is fog, and the render says FOG, never 0', () => {
    const s = buildScorecard({ week: WEEK, receipts: [], founderMinutes: null, registry: REGISTRY });
    const cells = allCells(s);
    expect(cells.length).toBeGreaterThan(12);
    for (const c of cells) expect(c.kind).toBe('fog');
    const md = renderMarkdown(s);
    expect(md).toContain('**FOG** — no receipt');
    expect(md).not.toMatch(/\| 0 (launches|turns|s|min|lines)\b/);
  });

  test('one receipt: its values, with launch id and file:line provenance', () => {
    const s = buildScorecard({ week: WEEK, receipts: [{ file: 'm/M1/launches.jsonl', text: receipt() + '\n' }], founderMinutes: null, registry: REGISTRY });
    const expectValue = (c: Cell, v: number) => {
      expect(c).toMatchObject({ kind: 'value', value: v, provenance: { n: 1, launchIds: ['L1'], locations: ['m/M1/launches.jsonl:1'] } });
    };
    expectValue(metric(s, 'launches'), 1);
    expectValue(metric(s, 'turns'), 12);
    expectValue(metric(s, 'wall-clock'), 153);
    expectValue(metric(s, 'launches exiting non-zero'), 0);
    const claude = s.budgetLedger.find((f) => f.family === 'Claude Max 20x')!;
    expectValue(claude.launches, 1);
    // caps stay fog even with a receipt: published registry text is not a measurement
    // and the reason is derived from the inputs, not an assertion about another job's state
    expect(claude.windowCap).toMatchObject({ kind: 'fog', reason: expect.stringContaining('no capacity measurement found') });
    expect(renderMarkdown(s)).not.toContain('B0-00 has not run');
    expect(s.budgetLedger.find((f) => f.family === 'ChatGPT Pro (Codex)')!.launches.kind).toBe('fog');
  });

  test('a receipt outside the week, or with turns: null, is fog for that cell rather than zero', () => {
    const s = buildScorecard({
      week: WEEK,
      receipts: [{ file: 'a.jsonl', text: [receipt({ startedAt: T - 14 * 86_400_000, endedAt: T - 14 * 86_400_000 + 1 }), receipt({ launchId: 'R', model: 'gpt-6-astra', turns: null })].join('\n') }],
      founderMinutes: null, registry: REGISTRY,
    });
    expect(metric(s, 'launches')).toMatchObject({ kind: 'value', value: 1, provenance: { launchIds: ['R'], locations: ['a.jsonl:2'] } });
    expect(metric(s, 'turns')).toMatchObject({ kind: 'fog', reason: expect.stringContaining('none carry turns') });
  });

  test('founder minutes present: summed for the week with file:line provenance; other weeks excluded', () => {
    const fm: SourceText = { file: 'build/founder-minutes.csv', text: 'date,minutes,kind,note\n2026-09-29,25,decision,review\n2026-09-30,10,rescue,\n2026-09-20,99,decision,old week\n' };
    const s = buildScorecard({ week: WEEK, receipts: [], founderMinutes: fm, registry: REGISTRY });
    expect(metric(s, 'decision + rescue minutes (hand-logged)')).toMatchObject({
      kind: 'value', value: 35, unit: 'min', provenance: { n: 2, locations: ['build/founder-minutes.csv:2-3'], coverage: 'decision, rescue' },
    });
  });

  test('founder minutes absent, or present with no entry for the week: fog with the distinct reason', () => {
    const absent = buildScorecard({ week: WEEK, receipts: [], founderMinutes: null, registry: REGISTRY });
    expect(metric(absent, 'decision + rescue minutes (hand-logged)')).toMatchObject({ kind: 'fog', reason: expect.stringContaining('does not exist') });
    const headerOnly = buildScorecard({ week: WEEK, receipts: [], founderMinutes: { file: 'f.csv', text: 'date,minutes,kind,note\n' }, registry: REGISTRY });
    expect(metric(headerOnly, 'decision + rescue minutes (hand-logged)')).toMatchObject({ kind: 'fog', reason: `no receipt: no hand-logged entry for ${WEEK}` });
  });

  test('malformed receipt lines are counted as unparsed with their location, never silently dropped', () => {
    const text = [receipt(), '{"torn": ', receipt({ launchId: 'L2', startedAt: 'yesterday' }), '', receipt({ launchId: 'L3' })].join('\n');
    const s = buildScorecard({ week: WEEK, receipts: [{ file: 'x.jsonl', text }], founderMinutes: null, registry: REGISTRY });
    expect(s.unparsed).toEqual([
      { file: 'x.jsonl', line: 2, reason: 'not a JSON object' },
      { file: 'x.jsonl', line: 3, reason: 'missing or mistyped: startedAt' },
    ]);
    expect(metric(s, 'unparsed input lines')).toMatchObject({ kind: 'value', value: 2, provenance: { locations: ['x.jsonl:2-3'] } });
    expect(metric(s, 'launches')).toMatchObject({ kind: 'value', value: 2, provenance: { locations: ['x.jsonl:1', 'x.jsonl:5'] } });
    expect(renderMarkdown(s)).toContain('`x.jsonl:2` — not a JSON object');
  });

  test('a child receipt (parentLaunchId) is counted on its own row and never adds launches or wall-clock', () => {
    const text = [
      receipt(), // parent: 152.9 s
      receipt({ launchId: 'L1:tu_1', role: 'builder-subagent', parentLaunchId: 'L1', startedAt: T + 1_000, endedAt: T + 100_000, turns: null }),
    ].join('\n');
    const s = buildScorecard({ week: WEEK, receipts: [{ file: 'p.jsonl', text }], founderMinutes: null, registry: REGISTRY });
    expect(metric(s, 'launches')).toMatchObject({ kind: 'value', value: 1, provenance: { launchIds: ['L1'] } });
    expect(metric(s, 'wall-clock')).toMatchObject({ kind: 'value', value: 153 });
    expect(metric(s, 'child launches (inside a parent)')).toMatchObject({ kind: 'value', value: 1, provenance: { launchIds: ['L1:tu_1'], locations: ['p.jsonl:2'] } });
    const claude = s.budgetLedger.find((f) => f.family === 'Claude Max 20x')!;
    expect(claude.launches).toMatchObject({ value: 1 });
    expect(claude.wallClock).toMatchObject({ value: 153 });
  });

  test('receipt unparsedLines is carried; a type-invalid field makes the receipt unparsed, not a value', () => {
    const text = [receipt({ unparsedLines: 3 }), receipt({ launchId: 'L2', exit: 'boom' }), receipt({ launchId: 'L3', unparsedLines: -1 })].join('\n');
    const s = buildScorecard({ week: WEEK, receipts: [{ file: 'u.jsonl', text }], founderMinutes: null, registry: REGISTRY });
    expect(metric(s, 'worker stream lines unread (receipt unparsedLines)')).toMatchObject({ kind: 'value', value: 3, provenance: { launchIds: ['L1'] } });
    expect(s.unparsed).toEqual([
      { file: 'u.jsonl', line: 2, reason: 'mistyped: exit' },
      { file: 'u.jsonl', line: 3, reason: 'mistyped: unparsedLines' },
    ]);
    expect(metric(s, 'launches')).toMatchObject({ kind: 'value', value: 1 });
    expect(metric(s, 'launches exiting non-zero')).toMatchObject({ kind: 'value', value: 0, provenance: { launchIds: ['L1'] } });
  });

  test('a model absent from the registry gets its own family row with fog caps, not a guessed family', () => {
    const s = buildScorecard({ week: WEEK, receipts: [{ file: 'y.jsonl', text: receipt({ model: 'mystery-9' }) }], founderMinutes: null, registry: REGISTRY });
    const row = s.budgetLedger.find((f) => f.family === 'unregistered model: mystery-9')!;
    expect(row.launches).toMatchObject({ kind: 'value', value: 1 });
    expect(row.weeklyCap).toMatchObject({ kind: 'fog', reason: expect.stringContaining('absent from the provider registry') });
  });

  test('ISO week parsing: real weeks resolve to Monday 00:00Z, invalid weeks throw', () => {
    expect(new Date(isoWeekWindow('2026-W40').start).toISOString()).toBe('2026-09-28T00:00:00.000Z');
    expect(new Date(isoWeekWindow('2026-W53').start).toISOString()).toBe('2026-12-28T00:00:00.000Z');
    expect(() => isoWeekWindow('2025-W53')).toThrow();
    expect(() => isoWeekWindow('2026-40')).toThrow();
    expect(() => isoWeekWindow('2026-W00')).toThrow();
  });
});

const build = (text: string, extra: { founderMinutes?: SourceText | null; registry?: SourceText | null; file?: string } = {}) =>
  buildScorecard({
    week: WEEK, receipts: [{ file: extra.file ?? 'r.jsonl', text }],
    founderMinutes: extra.founderMinutes ?? null, registry: extra.registry === undefined ? REGISTRY : extra.registry,
  });
const minutes = (rows: string[]): SourceText => ({ file: 'm.csv', text: ['date,minutes,kind,note', ...rows].join('\n') });
const founder = (s: Scorecard) => metric(s, 'decision + rescue minutes (hand-logged)');

describe('scorecard v0 — registry fingerprint', () => {
  test('the registry sha256 is carried in the scorecard and the render, and moves when the registry does', () => {
    const sha = (t: string) => createHash('sha256').update(t).digest('hex');
    const a = build(receipt());
    expect(a.sources.registrySha256).toBe(sha(REGISTRY.text));
    expect(renderMarkdown(a)).toContain(sha(REGISTRY.text));
    const b = build(receipt(), { registry: { ...REGISTRY, text: REGISTRY.text + '\n# edited' } });
    expect(b.sources.registrySha256).toBe(sha(REGISTRY.text + '\n# edited'));
    expect(b.sources.registrySha256).not.toBe(a.sources.registrySha256);
    expect(build(receipt(), { registry: null }).sources.registrySha256).toBeNull();
  });
});

describe('scorecard v0 — hostile receipt content', () => {
  const FAKE = 'x\n| Injected | row | here |';

  test('a model that fails /^[\\w.:-]{1,64}$/ makes the receipt unparsed, and no fake table row is rendered', () => {
    const s = build(receipt({ model: FAKE }));
    expect(s.unparsed).toEqual([{ file: 'r.jsonl', line: 1, reason: 'mistyped: model' }]);
    expect(metric(s, 'launches').kind).toBe('fog');
    const md = renderMarkdown(s);
    expect(md.split('\n').some((l) => l.startsWith('| Injected'))).toBe(false);
    expect(md).not.toContain('Injected');
  });

  test.each([['back`tick'], ['<img src=x>'], ['pi|pe'], ['sp ace'], ['a'.repeat(65)], ['x\ry']])('model %j is unparsed', (model) => {
    expect(build(receipt({ model })).unparsed).toHaveLength(1);
  });

  test.each([['claude-sonnet-5-5'], ['gpt-6-astra'], ['a'.repeat(64)], ['vendor:model.v1_2']])('model %j is accepted', (model) => {
    expect(build(receipt({ model })).unparsed).toHaveLength(0);
  });

  test('every rendered string is escaped: a file label carrying newline, pipe, backtick and < cannot start a row or open a tag', () => {
    const file = 'a\n## Injected heading\n| fake | row |\n`<img src=x onerror=1>`.jsonl';
    const text = ['{"torn": ', receipt()].join('\n');
    const md = renderMarkdown(build(text, { file }));
    for (const line of md.split('\n')) {
      expect(line.startsWith('| fake')).toBe(false);
      expect(line.startsWith('## Injected')).toBe(false);
    }
    expect(md).not.toContain('<img');
    expect(md).not.toMatch(/^`<img/m);
  });
});

describe('scorecard v0 — duplicates and outliers', () => {
  test('a duplicate launchId is counted once and reported, with the first occurrence named', () => {
    const text = [receipt({ turns: 5 }), receipt({ turns: 5 })].join('\n');
    const s = build(text);
    expect(metric(s, 'launches')).toMatchObject({ kind: 'value', value: 1 });
    expect(metric(s, 'turns')).toMatchObject({ kind: 'value', value: 5 });
    expect(s.unparsed).toEqual([{ file: 'r.jsonl', line: 2, reason: 'duplicate launchId L1 (first seen at r.jsonl:1); not counted' }]);
    expect(renderMarkdown(s)).toContain('duplicate launchId L1');
  });

  test('a duplicate across two files is also caught', () => {
    const s = buildScorecard({
      week: WEEK, founderMinutes: null, registry: REGISTRY,
      receipts: [{ file: 'a.jsonl', text: receipt() }, { file: 'b.jsonl', text: receipt() }],
    });
    expect(metric(s, 'launches')).toMatchObject({ value: 1, provenance: { locations: ['a.jsonl:1'] } });
    expect(s.unparsed).toHaveLength(1);
    expect(s.unparsed[0]).toMatchObject({ file: 'b.jsonl', line: 1 });
  });

  test('a duration above MAX_LAUNCH_MS is flagged and excluded from every total', () => {
    const ok = receipt({ launchId: 'OK' });
    const wild = receipt({ launchId: 'WILD', endedAt: T + 1e13 });
    const edge = receipt({ launchId: 'EDGE', endedAt: T + MAX_LAUNCH_MS });
    const over = receipt({ launchId: 'OVER', endedAt: T + MAX_LAUNCH_MS + 1 });
    const s = build([ok, wild, edge, over].join('\n'));
    expect(metric(s, 'launches')).toMatchObject({ value: 2, provenance: { launchIds: ['OK', 'EDGE'] } });
    expect((metric(s, 'wall-clock') as { value: number }).value).toBeLessThan(MAX_LAUNCH_MS);
    expect(s.unparsed.map((u) => u.line)).toEqual([2, 4]);
    for (const u of s.unparsed) expect(u.reason).toContain('exceeds');
    expect(renderMarkdown(s)).toContain('exceeds');
  });

  test('turns and unparsedLines above their bounds are flagged and excluded', () => {
    const text = [
      receipt({ launchId: 'A', turns: MAX_TURNS }),
      receipt({ launchId: 'B', turns: MAX_TURNS + 1 }),
      receipt({ launchId: 'C', turns: 1e9 }),
      receipt({ launchId: 'D', unparsedLines: 1e12 }),
    ].join('\n');
    const s = build(text);
    expect(metric(s, 'turns')).toMatchObject({ value: MAX_TURNS, provenance: { launchIds: ['A'] } });
    expect(metric(s, 'launches')).toMatchObject({ value: 1 });
    expect(s.unparsed.map((u) => u.line)).toEqual([2, 3, 4]);
  });
});

describe('scorecard v0 — orphan children', () => {
  test('a child naming an unknown parent is a top-level launch and is flagged as an anomaly', () => {
    const orphan = receipt({ launchId: 'C1', role: 'builder-subagent', parentLaunchId: 'GONE', startedAt: T + 1_000, endedAt: T + 5_000 });
    const s = build([receipt(), orphan].join('\n'));
    expect(metric(s, 'launches')).toMatchObject({ value: 2, provenance: { launchIds: ['L1', 'C1'] } });
    expect(metric(s, 'child launches (inside a parent)').kind).toBe('fog');
    expect(s.anomalies).toHaveLength(1);
    expect(s.anomalies[0]).toMatchObject({ file: 'r.jsonl', line: 2 });
    expect(s.anomalies[0]!.reason).toContain('GONE');
    expect(renderMarkdown(s)).toContain('GONE');
  });

  test('a child with a known parent is not an anomaly', () => {
    const child = receipt({ launchId: 'L1:t', role: 'builder-subagent', parentLaunchId: 'L1', startedAt: T + 1_000, endedAt: T + 5_000 });
    const s = build([receipt(), child].join('\n'));
    expect(s.anomalies).toEqual([]);
    expect(metric(s, 'launches')).toMatchObject({ value: 1 });
  });
});

describe('scorecard v0 — id shape', () => {
  const IMG = '![x](https://evil.example/p.png)';

  test('a launchId or parentLaunchId that is not a plain id makes the receipt unparsed, so no image or link reaches the render', () => {
    const s = build([
      receipt({ launchId: IMG }),
      receipt({ launchId: 'OK', parentLaunchId: IMG }),
      receipt({ launchId: '[a](javascript:alert(1))' }),
      receipt({ launchId: 'x'.repeat(129) }),
      receipt({ launchId: 'with space' }),
    ].join('\n'));
    expect(s.unparsed.map((u) => [u.line, u.reason])).toEqual([
      [1, 'mistyped: launchId'], [2, 'mistyped: parentLaunchId'], [3, 'mistyped: launchId'],
      [4, 'mistyped: launchId'], [5, 'mistyped: launchId'],
    ]);
    const md = renderMarkdown(s);
    expect(md).not.toContain('evil.example');
    expect(md).not.toMatch(/!\[x\]\(/);
    expect(metric(s, 'launches').kind).toBe('fog');
  });

  test.each([['L1'], ['L1:tu_1'], ['3f2b8c1e-9d4a-4e0b-8a77-2f6c1d9e5b10'], ['x'.repeat(128)]])('id %j is accepted', (launchId) => {
    expect(build(receipt({ launchId })).unparsed).toEqual([]);
  });
});

describe('scorecard v0 — parent graph', () => {
  const child = (launchId: string, parentLaunchId: string) =>
    receipt({ launchId, role: 'builder-subagent', parentLaunchId, startedAt: T + 1_000, endedAt: T + 5_000 });

  test('a self-parent is an orphan: top-level and flagged, not a child that deflates launches', () => {
    const s = build(child('S', 'S'));
    expect(metric(s, 'launches')).toMatchObject({ kind: 'value', value: 1, provenance: { launchIds: ['S'] } });
    expect(metric(s, 'child launches (inside a parent)').kind).toBe('fog');
    expect(s.anomalies).toHaveLength(1);
    expect(s.anomalies[0]!.reason).toContain('S');
  });

  test('a 2-cycle: both are top-level and both flagged', () => {
    const s = build([child('A', 'B'), child('B', 'A')].join('\n'));
    expect(metric(s, 'launches')).toMatchObject({ value: 2, provenance: { launchIds: ['A', 'B'] } });
    expect(metric(s, 'child launches (inside a parent)').kind).toBe('fog');
    expect(s.anomalies.map((a) => a.line)).toEqual([1, 2]);
  });

  test('a child of a child is an orphan; a child of a top-level launch is still a child', () => {
    const s = build([receipt(), child('C1', 'L1'), child('C2', 'C1')].join('\n'));
    expect(metric(s, 'launches')).toMatchObject({ value: 2, provenance: { launchIds: ['L1', 'C2'] } });
    expect(metric(s, 'child launches (inside a parent)')).toMatchObject({ value: 1, provenance: { launchIds: ['C1'] } });
    expect(s.anomalies.map((a) => a.line)).toEqual([3]);
  });
});

describe('scorecard v0 — founder minutes validation', () => {
  test.each([
    ['2026-02-30,10,decision,x', 'date'],
    ['2026-13-01,10,decision,x', 'date'],
    ['2026-09-31,10,decision,x', 'date'],
    ['2026-09-29,0x10,decision,x', 'minutes'],
    ['2026-09-29,1e3,decision,x', 'minutes'],
    ['2026-09-29,12.5,decision,x', 'minutes'],
    ['2026-09-29,-5,decision,x', 'minutes'],
    ['2026-09-29,,decision,x', 'minutes'],
    [`2026-09-29,${MAX_MINUTES + 1},decision,x`, 'minutes'],
    ['2026-09-29,10,banana,x', 'kind'],
    ['2026-09-29,10,,x', 'kind'],
    ['2026-09-29,10,Decision,x', 'kind'],
  ])('%s is unparsed (%s)', (row, what) => {
    const s = build('', { founderMinutes: minutes([row]) });
    expect(s.unparsed).toHaveLength(1);
    expect(s.unparsed[0]!.reason).toContain(what);
    expect(founder(s).kind).toBe('fog');
  });

  test('valid rows are accepted, including a leap day and the bound itself', () => {
    const s = build('', { founderMinutes: minutes([`2026-09-29,${MAX_MINUTES},rescue,x`, '2026-09-30,0,decision,x', '2028-02-29,5,decision,leap']) });
    expect(s.unparsed).toEqual([]);
    expect(founder(s)).toMatchObject({ kind: 'value', value: MAX_MINUTES });
  });
});
