// test/units.test.ts — the three small rules this PR introduced, pinned directly:
// what "drift" means, what the model column reads, and what the formatter is allowed to do
// to a figure.

import { describe, test, expect } from 'bun:test';
import { modalInScopeGeneration, parseWarroomFleetOutput, type LauncherRow } from '../server/collectors/fleet.ts';
import { latestModelFrom } from '../server/index-store.ts';
import { formatCount, formatRelative, formatShare, shortId, isLive, LIVE_WINDOW_MS } from '../client/src/format.ts';
import { median, stallGateVerdict, STALL_BOUND, RESOLUTION_FACTOR } from './gate.ts';

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

// ── THE STALL GATE'S WITHHOLD BRANCH, WHICH HAD NEVER FIRED ───────────────────────────
//
// `stallGateVerdict` decides whether the enumeration stall test's assertion is trusted or
// withheld — so it guards the trustworthiness of every other assertion in that test. Until
// this file it had never executed its withhold branch: not in 20 clean runs, not in any of
// the eight mutations run against it. Reaching it through a real measurement needs a machine
// marginal enough that asking for 12 children costs most of what blocking on them costs, and
// a suite cannot arrange that. With the arithmetic extracted it takes synthetic samples.
//
// AND ITS OWN ASSUMPTION IS ALREADY VIOLATED ON CLEAN RUNS: the gate assumes correct code's
// worst round stays under twice the floor's worst, and over 20 clean runs that ratio hit a
// max of 3.15, exceeding the factor of 2 in 3 of them. Only a `lineMs/fmax` margin of
// 5.4–16.3 kept the withhold from firing. On a runner with less headroom those two meet, and
// this branch decides what happens then.
describe('stallGateVerdict', () => {
  // 400 is chosen so every number below is exact in binary floating point: 400 × 0.75 = 300
  // exactly, and F × 2 is exact for every F on a 0.5 grid. The boundary case is therefore
  // genuinely the boundary and not a rounding artefact.
  //
  // Three unequal values, so the reducer is pinned as well as the threshold: the median of
  // this is 400 — not the mean (466.7) and not the max (900).
  const CONTROL = [100, 400, 900];

  test('the withhold ratio is STALL_BOUND / RESOLUTION_FACTOR, and it is 0.375', () => {
    // The sweep below derives its expectation from the constants rather than hardcoding
    // 0.375, so retuning either constant retunes the expectation instead of silently leaving
    // a test of the old design. This is the assertion that pins what 0.375 currently is.
    expect(STALL_BOUND / RESOLUTION_FACTOR).toBe(0.375);
  });

  test('median is the middle element — not the mean, not the max', () => {
    expect(median(CONTROL)).toBe(400);
    expect(median([1, 2, 3, 4])).toBe(3); // even-length: the UPPER of the two middles
    expect(median([7])).toBe(7);
  });

  // THE COMPARATOR, PINNED BY THE ONE SAMPLE THAT CAN SEE IT. `[...xs].sort()` with no
  // comparator sorts LEXICOGRAPHICALLY — JavaScript's most famous single defect — and every
  // other sample in this file is blind to it. `[100,400,900]`, `[4,4,4,4,200]`,
  // `[400,400,400,400,9000]` and `[1,2,3,4]` all sort identically either way, so deleting
  // `(a, b) => a - b` left the entire suite green. Measured, not supposed.
  //
  // `[2, 10]` is the smallest sample that separates them: numerically it sorts to [2, 10] and
  // the median is 10; lexicographically to [10, 2] and the median is 2.
  test('median sorts numerically, not lexicographically', () => {
    expect(median([2, 10])).toBe(10);
    // …and at the scale this actually runs at, where '9' would outrank '100'.
    expect(median([100, 9, 80])).toBe(80);
  });

  test('withholds exactly when max(floor) > 0.375 × median(control), swept across the range', () => {
    const withholdRatio = STALL_BOUND / RESOLUTION_FACTOR;
    const threshold = withholdRatio * 400; // 150
    const disagreements: { floor: number; got: boolean; expected: boolean }[] = [];
    const seen = new Set<boolean>();

    for (let f = 0.5; f <= 200; f += 0.5) {
      const verdict = stallGateVerdict(CONTROL, [0.5, f], 12);
      const expected = !(f > threshold);
      seen.add(verdict.resolves);
      if (verdict.resolves !== expected) disagreements.push({ floor: f, got: verdict.resolves, expected });
    }

    expect(disagreements).toEqual([]);
    // NON-VACUITY OF THE SWEEP ITSELF: both outcomes really occur in it, so this cannot pass
    // by checking one side 400 times.
    expect(seen).toEqual(new Set([true, false]));
  });

  test('the boundary itself resolves, and a hair past it withholds', () => {
    // lineMs is 300 and RESOLUTION_FACTOR × 150 is 300, so the comparison is `300 < 300`.
    // The gate opens on equality — it withholds only when the line is strictly under.
    expect(stallGateVerdict(CONTROL, [150], 12).resolves).toBe(true);
    expect(stallGateVerdict(CONTROL, [149.5], 12).resolves).toBe(true);
    expect(stallGateVerdict(CONTROL, [150.5], 12).resolves).toBe(false);
  });

  // THE FLOOR IS REDUCED BY MAX, and this is the test that says so. A gate reading the floor's
  // median would call this machine fine on the strength of four good rounds.
  test('one bad floor round withholds even when the median floor is tiny', () => {
    const floor = [4, 4, 4, 4, 200];
    expect(median(floor)).toBe(4); // …which would have resolved
    expect(stallGateVerdict(CONTROL, floor, 12).resolves).toBe(false);
  });

  // THE CONTROL IS REDUCED BY MEDIAN, likewise. Reading its max here would give a line of
  // 6750 ms and open the gate on one descheduled round.
  test('one slow control round does not open the gate on its own', () => {
    const control = [400, 400, 400, 400, 9000];
    expect(median(control)).toBe(400);
    expect(stallGateVerdict(control, [200], 12).resolves).toBe(false);
  });

  // THE TWO REAL MACHINES THIS GATE HAS SEEN, as the numbers that were actually measured.
  test('the CI runner behind the original flake is withheld; this laptop is not', () => {
    // floor/control ran ≈0.61–0.84 on the CI runs that produced the flake — far above 0.375,
    // so the gate abstains there rather than asserting. That is the mechanism working, and it
    // is why the PR body's "nothing is skipped on fast machines" had to be struck.
    for (const ratio of [0.61, 0.84]) {
      const verdict = stallGateVerdict([356.4], [356.4 * ratio], 12);
      expect({ ratio, resolves: verdict.resolves }).toEqual({ ratio, resolves: false });
    }
    // …and a real clean local run — control 131.7 ms, floor worst 7.3 ms — asserts.
    expect(stallGateVerdict([131.7], [7.3], 12).resolves).toBe(true);
  });

  test('lineMs, ceilingMs and controlStallMs are the documented quantities', () => {
    const verdict = stallGateVerdict(CONTROL, [4, 4, 30], 12);
    expect(verdict.controlStallMs).toBe(400); // median(control)
    expect(verdict.lineMs).toBe(300); // STALL_BOUND × median(control)
    expect(verdict.ceilingMs).toBe(30); // max(floor)
  });

  // NaN IS PINNED BECAUSE THE FORM WAS CHOSEN FOR IT. `stallGateVerdict` writes its comparison
  // as `!(lineMs < ceilingMs × RESOLUTION_FACTOR)` rather than `>=` specifically because the
  // two differ when either side is NaN, and the extraction preserved what the inline original
  // did. Nothing pinned that: replacing the form with `>=` SURVIVED the whole suite. An
  // argument made at length in a comment and guarded by nothing is the defect class this phase
  // is named for, so here it is as two assertions.
  //
  //   !(NaN < 20)  === true   -> resolves      NaN >= 20  === false -> withholds
  //   !(300 < NaN) === true   -> resolves      300 >= NaN === false -> withholds
  //
  // This pins the CURRENT behaviour, and it is not an endorsement of it: a NaN measurement
  // resolving means the assertion is attempted on a degenerate sample. It is recorded here so
  // that changing it is a decision someone makes, rather than a side effect of tidying an
  // operator.
  test('a NaN measurement resolves — the comparison form is load-bearing, not stylistic', () => {
    expect(stallGateVerdict([NaN], [10], 12).resolves).toBe(true);
    expect(stallGateVerdict([400], [NaN], 12).resolves).toBe(true);
    // …and the numbers that produced it are NaN, so a reader can see why rather than guessing.
    expect(stallGateVerdict([NaN], [10], 12).lineMs).toBeNaN();
    expect(stallGateVerdict([400], [NaN], 12).ceilingMs).toBeNaN();
  });

  test('the reason is null when resolving, and names every number when withholding', () => {
    expect(stallGateVerdict(CONTROL, [10], 12).reason).toBeNull();

    const withheld = stallGateVerdict(CONTROL, [200], 12);
    expect(withheld.resolves).toBe(false);

    // THE WHOLE SENTENCE, NOT THREE INDEPENDENT `toContain` CALLS. Those pass whichever number
    // lands in whichever slot, so swapping lineMs and ceilingMs inside the template survived —
    // and the message would then read "must stay under 200.0ms … cost as much as 300.0ms",
    // inverted, sending a reader to tune the wrong knob. This matters more now than before:
    // the inline copy in collectors.test.ts is gone, so this is the only guardian left of that
    // entire human-readable output.
    expect(withheld.reason).toBe(
      'correct code must stay under 300.0ms here — three quarters of a 400.0ms control — while merely ASKING ' +
        'for the same 12 children cost as much as 200.0ms in its worst round. There is not enough room between ' +
        'the two for a ratio to mean anything on this machine'
    );
  });

  // THE DEGENERATE INPUT, and the reason it throws rather than returning something.
  //
  // THE TWO EMPTY CASES ARE NOT THE SAME DEFECT, and the first draft of this comment said they
  // were. Only the FLOOR fails silently:
  //
  //   empty FLOOR    max of nothing is -Infinity, so `lineMs < -Infinity × 2` is false, the
  //                  gate OPENS, and it opens carrying a real-looking 300.0 ms line while
  //                  having measured nothing. Silent, and the failure this gate exists to stop.
  //   empty CONTROL  median of nothing makes lineMs NaN, and bun FAILS `toBeLessThan(NaN)`.
  //                  Still a bug, but it goes red rather than quietly asserting.
  //
  // Both throw now. The distinction is recorded because "silently always assert" is precise
  // for one of them and wrong for the other, and a comment that overstates its own danger is
  // the thing this file keeps being asked to stop doing.
  test('an empty sample throws instead of silently opening the gate', () => {
    expect(() => stallGateVerdict([], [10], 12)).toThrow(/needs both samples/);
    expect(() => stallGateVerdict([400], [], 12)).toThrow(/needs both samples/);
    expect(() => median([])).toThrow(/empty sample/);

    // The two facts behind the table above, pinned so the reasoning is checkable rather than
    // asserted: the max of nothing is -Infinity, and -Infinity opens the comparison.
    expect(Math.max(...([] as number[]))).toBe(-Infinity);
    expect(300 < -Infinity * RESOLUTION_FACTOR).toBe(false); // …so `!(…)` resolves
  });
});
