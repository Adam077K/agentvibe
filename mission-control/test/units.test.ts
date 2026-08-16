// test/units.test.ts — the three small rules this PR introduced, pinned directly:
// what "drift" means, what the model column reads, and what the formatter is allowed to do
// to a figure.

import { describe, test, expect, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { modalInScopeGeneration, parseWarroomFleetOutput, type LauncherRow } from '../server/collectors/fleet.ts';
import { IndexStore, latestModelFrom } from '../server/index-store.ts';
import { discoverProjects, type Project } from '../server/projects.ts';
import { listTranscripts } from '../server/lib/usage.ts';
import { mkTmpDir, rmTmp, fixtureClaudeProjectsDir, initGitRepo } from './fixtures.ts';
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

// ── the read counters, on a fixture where every byte is known ─────────────────────────
//
// `RefreshResult.filesRead/bytesRead/distinctFilesRead` exist so test/live.test.ts can assert
// "a cold build reads each transcript exactly once" WITHOUT a clock — #50 established that the
// clock on that path reports OS memory reclaim (r = 0.915 against pageins) rather than code
// quality, so the deterministic invariant is what actually guards the algorithm.
//
// PINNED HERE TOO, AND NOT ONLY THERE, because two of the properties are unreachable from the
// live test and its mutation matrix said so rather than my guessing: N5 (counters never reset
// between builds) SURVIVED there, because that test performs exactly one cold build. Repeated
// builds are this file's job. So is the refresh-side property, which live.test.ts never
// exercises at all.
describe('IndexStore read counters', () => {
  const roots: string[] = [];
  afterAll(() => {
    for (const r of roots) rmTmp(r);
  });

  /** A project whose transcripts are written here, so the exact byte total is known. */
  function fixture(sizes: number[]): { project: Project; bytes: number } {
    const claudeRoot = mkTmpDir('mc-counters-claude-');
    const projectRoot = mkTmpDir('mc-counters-project-');
    roots.push(claudeRoot, projectRoot);
    initGitRepo(projectRoot);
    let bytes = 0;
    sizes.forEach((n, i) => {
      // Turns carrying real usage records, so the index has something to summarise; the byte
      // total is whatever these lines actually are, measured rather than assumed.
      const turns = Array.from({ length: n }, () => ({ ts: new Date().toISOString(), output_tokens: 5 }));
      const file = fixtureClaudeProjectsDir(claudeRoot, projectRoot, `s-${i}`, turns);
      bytes += fs.statSync(file).size;
    });
    const project = discoverProjects({ roots: [path.dirname(projectRoot)], claudeProjectsRoot: claudeRoot }).find(
      (p) => p.root === projectRoot
    )!;
    return { project, bytes };
  }

  test('a cold build reads each transcript exactly once, and the bytes are the files on disk', () => {
    const { project, bytes } = fixture([3, 5, 1]);
    const r = new IndexStore().buildCold([project]);
    expect(r.filesScanned).toBe(3);
    expect(r.filesRead).toBe(3);
    expect(r.distinctFilesRead).toBe(3);
    // EXACT, not bracketed: unlike the live corpus, nothing is appending to this fixture while
    // the test runs, so an approximate comparison here would be hiding a real guarantee.
    expect(r.bytesRead).toBe(bytes);
  });

  // ── THE ORACLE'S INDEPENDENCE, PINNED ─────────────────────────────────────────────
  //
  // The whole design rests on `bytesRead` and the filesystem walk it is compared against coming
  // from DIFFERENT SOURCES: the store counts `Buffer.byteLength` of what it decoded, the checks
  // sum `statSync().size`. Change index-store.ts to `this.bytes += st.size` and the comparison
  // silently becomes stat-vs-stat — an identity, true no matter what the reader actually does.
  // Reported in review, and nothing went red: units 31 pass, live 7 pass. Worse, with that one
  // line changed, a reader truncated to 10 characters ALSO passed everything, because the rate
  // assertion is a CEILING and doing less work is faster.
  //
  // Independence was a fact about the code and not a property anything checked. This checks it.
  //
  // AND THE DIVERGENCE IT RELIES ON IS A FEATURE HERE, NOT A LURKING INCONSISTENCY. `bytesRead`
  // is a decoded-text count and `st.size` is an on-disk count; the two agree for valid UTF-8 and
  // only for valid UTF-8. Today 0 of the real corpus's 2,536 transcripts diverge, so the live
  // test's byte bracket holds — the day one does, that test fails for a reason about ENCODING
  // rather than about the code, and this is where that is written down. The fixture below makes
  // the divergence deliberate and tiny so it pins the independence instead of lurking.
  test('bytesRead counts DECODED bytes, so the byte oracle is not stat-vs-stat', () => {
    const { project } = fixture([2]);
    const dir = project.transcriptDirs[0]!;
    // 0x80 is a lone UTF-8 continuation byte and cannot begin a valid sequence, so
    // readFileSync(..., 'utf8') yields U+FFFD — which re-encodes to THREE bytes where the file
    // holds one. The decoded count and st.size therefore cannot be equal.
    fs.writeFileSync(path.join(dir, 'invalid-utf8.jsonl'), Buffer.from([0x78, 0x80, 0x0a]));

    const files = listTranscripts(dir);
    const statBytes = files.reduce((s, f) => s + fs.statSync(f).size, 0);
    const decodedBytes = files.reduce((s, f) => s + Buffer.byteLength(fs.readFileSync(f, 'utf8'), 'utf8'), 0);
    // NON-VACUITY: the fixture really does make the two disagree, so the assertions below
    // distinguish two sources rather than comparing a number with itself.
    expect(decodedBytes).not.toBe(statBytes);

    const r = new IndexStore().buildCold([project]);
    expect(r.bytesRead).toBe(decodedBytes); // the read-side count…
    expect(r.bytesRead).not.toBe(statBytes); // …and provably NOT the stat-side one
  });

  // N5, CLOSED. The counters are per-build state on a long-lived object, so a second build must
  // report its own work and not the sum of both. Deleting `startCounting`'s body leaves the live
  // test green — it builds once — and fails this.
  test('a second build reports its own reads, not the running total', () => {
    const { project, bytes } = fixture([2, 2]);
    const store = new IndexStore();
    const first = store.buildCold([project]);
    const second = store.buildCold([project]);
    expect(first.filesRead).toBe(2);
    expect(second.filesRead).toBe(2); // not 4
    expect(second.bytesRead).toBe(bytes); // not 2x bytes
    expect(store.lastResult).toEqual(second);
  });

  // THE REFRESH-SIDE PROPERTY, and it is deliberately NOT `filesRead === filesScanned`: the
  // whole point of refresh() is that an untouched file is skipped without being read. The
  // corresponding invariant is that it reads exactly what changed.
  test('a refresh reads only what changed, so filesRead tracks filesChanged and not filesScanned', () => {
    const { project } = fixture([2, 2, 2]);
    const store = new IndexStore();
    store.buildCold([project]);

    const unchanged = store.refresh([project]);
    expect(unchanged.filesScanned).toBe(3);
    expect(unchanged.filesChanged).toBe(0);
    expect(unchanged.filesRead).toBe(0); // nothing was opened at all
    expect(unchanged.bytesRead).toBe(0);

    const target = listTranscripts(project.transcriptDirs[0]!)[0]!;
    const before = fs.statSync(target).size;
    fs.appendFileSync(target, JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), message: { usage: { input_tokens: 1, output_tokens: 7 } } }) + '\n');
    const added = fs.statSync(target).size - before;

    const appended = store.refresh([project]);
    expect(appended.filesScanned).toBe(3);
    expect(appended.filesChanged).toBe(1);
    expect(appended.filesRead).toBe(1);
    expect(appended.distinctFilesRead).toBe(1);
    // ONLY THE APPENDED BYTES — this is the tail-read path, and reading the whole file here
    // would be a silent performance regression that no timing assertion on a 6-line fixture
    // could ever detect.
    expect(appended.bytesRead).toBe(added);
  });

  // ── THE BUCKETS PARTITION THE SCAN ────────────────────────────────────────────────────
  //
  // `filesScanned === filesRead + filesSkipped + filesUnread` is the cold-path invariant, and
  // it is deterministic: a file is scanned once and lands in exactly one bucket, on every
  // machine, whatever the clock is doing. It exists because the pre-existing
  // `filesScanned === filesRead` stops being true the moment a build can skip — and a sum that
  // silently fails to close is how "the skip logic has a bug" gets diagnosed for an hour when
  // the answer was one unreadable transcript.
  test('every scanned file lands in exactly one bucket: read, skipped, or unread', () => {
    const { project } = fixture([2, 2, 2]);
    const store = new IndexStore();

    const cold = store.buildCold([project]);
    expect(cold.filesScanned).toBe(cold.filesRead + cold.filesSkipped + cold.filesUnread);
    expect(cold.filesSkipped).toBe(0); // no prior state exists, so nothing CAN be skipped…
    expect(cold.filesRead).toBe(3); // …and the old equality still holds exactly as before
    expect(cold.filesScanned).toBe(cold.filesRead);

    const warm = store.refresh([project]);
    expect(warm.filesScanned).toBe(warm.filesRead + warm.filesSkipped + warm.filesUnread);
    // NON-VACUITY: the invariant above is trivially true when every bucket is 0. This is the
    // assertion that the skip bucket actually filled — i.e. the sum was tested on real work.
    expect(warm.filesSkipped).toBe(3);
    expect(warm.filesRead).toBe(0);
  });

  // N4: THE `statSync` BRANCH, WHICH HAD NO FIXTURE. `filesUnread`'s first documented cause —
  // "statSync threw, nothing could be learned about the path" — was reachable only in prose
  // until this. A dangling symlink is the cheapest real instance: `listTranscripts` finds the
  // name (readdir does not follow it) and the stat then fails.
  //
  // WHY IT MATTERS BEYOND COVERAGE: without this branch exercised, `filesScanned === filesRead +
  // filesSkipped + filesUnread` had never once been tested with a non-zero `filesUnread` on a
  // COLD build, so the third bucket was carrying no weight in the only place it exists for.
  test('a transcript that cannot be stat-ed is counted unread, and the sum still closes', () => {
    const { project } = fixture([3, 3]);
    const dir = project.transcriptDirs[0]!;
    const dangling = path.join(dir, 'vanished.jsonl');
    fs.symlinkSync(path.join(dir, 'no-such-target.jsonl'), dangling);
    // NON-VACUITY, BOTH HALVES: the corpus really lists it, and stat-ing it really fails.
    expect(listTranscripts(dir)).toContain(dangling);
    expect(() => fs.statSync(dangling)).toThrow();

    const cold = new IndexStore().buildCold([project]);
    expect(cold.filesScanned).toBe(3); // two real transcripts plus the broken link
    expect(cold.filesRead).toBe(2);
    expect(cold.filesSkipped).toBe(0);
    expect(cold.filesUnread).toBe(1);
    expect(cold.filesScanned).toBe(cold.filesRead + cold.filesSkipped + cold.filesUnread);
    // …and the old equality is now FALSE, which is exactly why the third bucket exists. Before
    // it, a corpus holding one unreadable file made `filesScanned === filesRead` quietly wrong.
    expect(cold.filesRead).not.toBe(cold.filesScanned);

    // The same on a refresh: the unreadable path is still not a read and still not a skip.
    const store = new IndexStore();
    store.buildCold([project]);
    const warm = store.refresh([project]);
    expect(warm.filesUnread).toBe(1);
    expect(warm.filesScanned).toBe(warm.filesRead + warm.filesSkipped + warm.filesUnread);

    fs.rmSync(dangling);
  });

  // A cold build performs NO boundary probes, and that is what keeps `bytesRead` a clean
  // transcript-byte count there — which test/live.test.ts brackets against an independent walk
  // of the corpus. A probe folded into that figure would quietly break the oracle.
  test('a cold build verifies nothing, so its byte count is transcript bytes only', () => {
    const { project, bytes } = fixture([4, 4]);
    const r = new IndexStore().buildCold([project]);
    expect(r.filesVerified).toBe(0);
    expect(r.verifyBytesRead).toBe(0);
    expect(r.filesStale).toBe(0);
    expect(r.bytesRead).toBe(bytes);
  });

  // The mtime-moved-but-size-unchanged case, which is NOT hypothetical: measured on the real
  // corpus 2026-08-16, five transcripts across two unrelated projects had their mtimes
  // rewritten to the same millisecond (four by exactly 3600.0 s) with byte-identical content.
  // The cheap key calls that "changed"; the disk says nothing was added. It must not be
  // reported as a read, because nothing was read.
  test('a metadata touch with no new bytes is counted as unread, not as a read', () => {
    const { project } = fixture([3, 3]);
    const store = new IndexStore();
    store.buildCold([project]);

    const target = listTranscripts(project.transcriptDirs[0]!)[0]!;
    const sizeBefore = fs.statSync(target).size;
    const future = new Date(Date.now() + 3600_000);
    fs.utimesSync(target, future, future);
    // NON-VACUITY: the touch really did move mtime and really did not change the size.
    expect(fs.statSync(target).size).toBe(sizeBefore);

    const r = store.refresh([project]);
    expect(r.filesChanged).toBe(1); // the key says changed…
    expect(r.filesRead).toBe(0); // …and not one transcript byte was read
    expect(r.bytesRead).toBe(0);
    expect(r.filesUnread).toBe(1);
    expect(r.filesScanned).toBe(r.filesRead + r.filesSkipped + r.filesUnread);
  });
});
