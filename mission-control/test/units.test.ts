// test/units.test.ts — the three small rules this PR introduced, pinned directly:
// what "drift" means, what the model column reads, and what the formatter is allowed to do
// to a figure.

import { describe, test, expect } from 'bun:test';
import { modalInScopeGeneration, parseWarroomFleetOutput, type LauncherRow } from '../server/collectors/fleet.ts';
import { latestModelFrom } from '../server/index-store.ts';
import { formatCount, formatRelative, formatShare, shortId, isLive, LIVE_WINDOW_MS } from '../client/src/format.ts';

const row = (name: string, gen: string, scope: 'in scope' | 'excluded'): LauncherRow => ({
  name,
  lines: 2741,
  fns: 47,
  gen,
  scope,
});

describe('modalInScopeGeneration', () => {
  test('is the most common generation among in-scope launchers', () => {
    expect(
      modalInScopeGeneration([
        row('a', 'a86770a9', 'in scope'),
        row('b', 'a86770a9', 'in scope'),
        row('c', '6eb0f729', 'in scope'),
      ])
    ).toEqual({ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 3, driftedLaunchers: 1 });
  });

  // THE NUMERATOR AND THE DENOMINATOR COME OUT OF ONE ARRAY, which is why they live in one
  // return value. `driftedLaunchers` used to be computed in the view over PROJECT rows while
  // `inScopeLaunchers` counted launchers, and the sentence "N of M in-scope launchers" put
  // one on each side of it. On this machine that read "2 of 11" while four in-scope
  // launchers were genuinely off-modal: a launcher with no discovered project produces no
  // row and could never be counted, and a case-differing directory name lost another.
  test('counts drifted launchers over launchers, including ones no project matches', () => {
    const result = modalInScopeGeneration([
      row('quarry', 'a86770a9', 'in scope'),
      row('sundial', 'a86770a9', 'in scope'),
      row('lodestar', 'c146d297', 'in scope'),
      row('orphaned', 'b0000001', 'in scope'),
      row('brackish', '30e0c7aa', 'excluded'),
    ]);
    expect(result).toEqual({
      kind: 'modal',
      generation: 'a86770a9',
      inScopeLaunchers: 4, // excluded is out of BOTH halves
      driftedLaunchers: 2, // lodestar and orphaned
    });
    if (result.kind === 'modal') {
      // The invariant the CRITICAL violated: a part cannot exceed its whole, and it only
      // cannot when both are drawn from the same population.
      expect(result.driftedLaunchers).toBeLessThanOrEqual(result.inScopeLaunchers);
    }
  });

  test('ignores excluded launchers entirely — they are not expected to converge', () => {
    // Three excluded copies of one generation must not out-vote two in-scope copies of
    // another, or the "current" generation names something nothing updates to.
    expect(
      modalInScopeGeneration([
        row('x', '30e0c7aa', 'excluded'),
        row('y', '30e0c7aa', 'excluded'),
        row('z', '30e0c7aa', 'excluded'),
        row('a', 'a86770a9', 'in scope'),
        row('b', 'a86770a9', 'in scope'),
      ])
    ).toEqual({ kind: 'modal', generation: 'a86770a9', inScopeLaunchers: 2, driftedLaunchers: 0 });
  });

  // THE THREE NO-COMPARISON CASES ARE DISTINCT VALUES, not one shared null. They used to
  // collapse into `null`, and the headline could tell none of them apart — from each other,
  // or from "compared, and everything agrees". So it rendered a convergence claim for all
  // three. Named cases make that unrepresentable.
  test('a tie is its own answer, naming the candidates, never a side picked at random', () => {
    expect(modalInScopeGeneration([row('a', 'aaaaaaaa', 'in scope'), row('b', 'bbbbbbbb', 'in scope')])).toEqual({
      kind: 'tie',
      candidates: ['aaaaaaaa', 'bbbbbbbb'],
      leaderCount: 1,
      generations: 2,
      inScopeLaunchers: 2,
    });
  });

  test('all-excluded and no-launchers-at-all are different answers', () => {
    expect(modalInScopeGeneration([])).toEqual({ kind: 'no-launchers' });
    expect(modalInScopeGeneration([row('x', '30e0c7aa', 'excluded')])).toEqual({
      kind: 'none-in-scope',
      launchers: 1,
    });
  });

  test('agrees with the real `warroom-install.mjs fleet` table format', () => {
    // Parsed by the collector's own parser from a verbatim slice of that command's stdout.
    const parsed = parseWarroomFleetOutput(
      [
        '  LAUNCHER          LINES  FN   GEN       SCOPE',
        '  acme               2769  47   c146d297  in scope',
        '  adamos             2407  45   30e0c7aa  excluded',
        '  beeond             2741  47   a86770a9  in scope',
        '  etsyc              2741  47   a86770a9  in scope',
        '  finfun             2741  47   a86770a9  in scope',
        '',
        '  5 launchers, 3 generations total',
      ].join('\n')
    );
    expect(parsed).toHaveLength(5);
    expect(modalInScopeGeneration(parsed)).toEqual({
      kind: 'modal',
      generation: 'a86770a9',
      inScopeLaunchers: 4,
      driftedLaunchers: 1, // acme, on c146d297
    });
  });
});

describe('latestModelFrom', () => {
  const line = (model: string, ts: string, extra: Record<string, unknown> = {}) =>
    JSON.stringify({ type: 'assistant', timestamp: ts, message: { model, usage: { output_tokens: 12 }, ...extra } });

  test('reads the model on the last usage-bearing turn, not the first', () => {
    const text = [line('claude-sonnet-4-6', '2026-08-01T00:00:00Z'), line('claude-opus-5', '2026-08-01T00:05:00Z')].join('\n');
    expect(latestModelFrom(text)).toBe('claude-opus-5');
  });

  test('is not fooled by a "model" key inside tool arguments', () => {
    // The whole-text regex this replaced returned `nano_banana_pro` here — a tool parameter
    // reported as though it were the session's model. Exact parse of one line, not a grep.
    const toolLine = JSON.stringify({
      type: 'user',
      timestamp: '2026-08-01T00:06:00Z',
      message: { role: 'user', content: [{ type: 'tool_result', content: '{"model":"nano_banana_pro"}' }] },
    });
    const text = [line('claude-opus-5', '2026-08-01T00:05:00Z'), toolLine].join('\n');
    expect(latestModelFrom(text)).toBe('claude-opus-5');
  });

  test('returns null when no turn carries usage at all', () => {
    expect(latestModelFrom('')).toBeNull();
    expect(latestModelFrom('{"type":"user","message":{"role":"user"}}\n')).toBeNull();
  });

  test('returns null on a truncated trailing line rather than throwing', () => {
    const text = line('claude-opus-5', '2026-08-01T00:05:00Z') + '\n' + '{"message":{"usage":{"output_tokens":9';
    expect(latestModelFrom(text)).toBeNull();
  });
});

describe('format', () => {
  test('token counts are grouped but never abbreviated — parity depends on it', () => {
    expect(formatCount(1_238_441)).toBe('1,238,441');
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
    // No 'k'/'M' suffix at any magnitude: an abbreviation cannot be reversed to the figure
    // the collector returned, which is the whole contract test/views.test.tsx enforces.
    expect(formatCount(4_000_000_000)).not.toMatch(/[kMB]/);
  });

  test('a share of nothing is null, not 0% — the caller must say so, not imply it', () => {
    // `'0%'` reads as a computed answer. It is not: nobody computed a ratio, because there
    // was no denominator. Every call site renders the null branch as an explicit absence.
    expect(formatShare(0, 0)).toBeNull();
    expect(formatShare(5, 0)).toBeNull();
    expect(formatShare(417_902, 1_238_441)).toBe('34%');
    expect(formatShare(0, 100)).toBe('0%'); // a real zero share still reads as 0%
  });

  test('relative time uses one unit and never renders a negative age', () => {
    const now = 1_800_000_000_000;
    expect(formatRelative(null, now)).toBe('never');
    expect(formatRelative(now + 500, now)).toBe('just now');
    expect(formatRelative(now - 12_000, now)).toBe('12s ago');
    expect(formatRelative(now - 7 * 60_000, now)).toBe('7m ago');
    expect(formatRelative(now - 3 * 3_600_000, now)).toBe('3h ago');
    expect(formatRelative(now - 9 * 86_400_000, now)).toBe('9d ago');
  });

  test('live is a stated window, not a feeling', () => {
    const now = 1_800_000_000_000;
    expect(isLive(now - (LIVE_WINDOW_MS - 1), now)).toBe(true);
    expect(isLive(now - (LIVE_WINDOW_MS + 1), now)).toBe(false);
    expect(isLive(null, now)).toBe(false);
  });

  test('shortId keeps the first uuid group for a main session', () => {
    const id = '47ad03a6-3903-4bf0-98a5-0a4e30ac69d6';
    expect(shortId(id)).toBe('47ad03a6');
    expect(id.includes(shortId(id))).toBe(true);
  });

  test('shortId keeps subagent ids apart — the real shapes on disk, verbatim', () => {
    // All four are real filenames from ~/.claude/projects/**/subagents/. Splitting on the
    // first hyphen (the first version of shortId) rendered every one of them as the word
    // "agent" — caught by looking at the rendered fleet, not by this test existing first.
    const ids = [
      'agent-a8e85914b34bd46cc',
      'agent-adesign-critic-kol-designsystem-1c07b49fe79f68be',
      'agent-acode-reviewer-kol-scaffold-c0bb6aa5019972e9',
      'agent-acode-reviewer-kol-scaffold-reverify-31c694ec82be196a',
    ];
    const labels = ids.map(shortId);

    expect(new Set(labels).size).toBe(ids.length); // every row is distinguishable
    for (const label of labels) expect(label).not.toBe('agent');
    // Every label is a contiguous substring of its id, so it can be pasted into the filter.
    ids.forEach((id, i) => expect(id.includes(labels[i] as string)).toBe(true));
    expect(labels[1]).toBe('design-critic-kol-designsystem-1c07');
    expect(labels[0]).toBe('8e85914b'); // no name recorded — the hex is what there is
  });
});
