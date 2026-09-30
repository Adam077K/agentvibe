// B0-12 — Scorecard v0 + Budget Ledger v0. Pure-function tests: no filesystem, no clock.
import { describe, expect, test } from 'bun:test';
import { buildScorecard, isoWeekWindow, renderMarkdown, type Cell, type Scorecard, type SourceText } from '../scripts/scorecard.ts';

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
