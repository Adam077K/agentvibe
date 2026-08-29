// scripts/extract-reference.test.mjs — the falsification harness, driven by real measurements.
//
// RUNS WITHOUT A BROWSER, BY CONSTRUCTION. Every fixture below is a frozen snapshot of a real
// capture, so the pure analysis — ramp fitting, increment detection, ratio arithmetic, the leading
// and tracking fits, robots parsing, and the falsifier — is exercised on the same numbers a live
// run produces, with no Chromium anywhere. That matters here more than usual: Chromium is
// SIGTRAP-killed under the armed sandbox, so a test that needed one would be a test nobody runs.
//
// THE FIXTURES ARE FROZEN AND THE LIVE ARTIFACTS ARE NOT. `design/references/<slug>/measured.json`
// is what the tool wrote on the day it ran and will change the next time anyone re-captures; the
// arrays below are copies taken on 2026-08-29 and are deliberately NOT read from those files. A
// test whose fixtures change when a website changes is a test that goes red for reasons that have
// nothing to do with this repository.
//
// THE LOAD-BEARING TEST IN THIS FILE IS `falsifier can kill a rule this repo enforces`. Everything
// else checks arithmetic. That one checks that the instrument can produce the answer its authors
// did not want — the 1.125 threshold is live in scripts/design-probe.mjs as MIN_STEP_RATIO, and if
// this harness could not report it REFUTED against references that violate it, the harness would
// be a machine for confirming whatever it was handed.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contrast,
  deriveSeeds,
  distinctWithCounts,
  evaluateRule,
  falsify,
  fitIntegerRamp,
  fitLeading,
  fitTracking,
  luminance,
  parseRgb,
  parseRobots,
  rampSteps,
  robotsPathMatches,
  robotsVerdict,
  checkRobots,
  slugFor,
  splitBands,
  toYaml,
  sourceRecord,
  analyse,
  RULE_KINDS,
  UA_TOKENS,
} from './extract-reference.mjs';

const withCounts = (pairs) => pairs.map(([value, count]) => ({ value, count }));

// ── REAL MEASUREMENTS, frozen ───────────────────────────────────────────────────────────────────
// Captured 2026-08-29 by this tool at 1440x900 with the scroll pass on, logged out, after checking
// /robots.txt (all four ALLOWED). Reproduce with:
//   node scripts/extract-reference.mjs https://linear.app
const FIX = {
  'linear-app': withCounts([[10, 26], [11, 3], [12, 171], [13, 143], [14, 218], [15, 52], [16, 4], [18, 20], [20, 1], [24, 7], [32, 2], [48, 2], [64, 3], [72, 1]]),
  'stripe-com': withCounts([[8, 25], [9, 47], [10, 210], [11, 85], [12, 47], [13, 5], [14, 40], [15, 3], [16, 154], [18, 9], [20, 1], [21, 1], [22, 20], [24, 1], [26, 42], [32, 11], [48, 16], [56, 1]]),
  'vercel-com': withCounts([[11, 10], [12, 7], [14, 122], [16, 13], [24, 5], [56, 5], [64, 1]]),
  'play-grafana-org': withCounts([[11.9, 1], [12, 1], [12.6, 1], [14, 53], [15.4, 1], [16.8, 3], [18.2, 1], [28, 1]]),
};

// mission-control's ten rendered sizes across all seven views, measured 2026-08-28 by the
// design-probe run that found the 574px overflow. Counts are not carried by that measurement, so
// this fixture has none — which also exercises the count-less path through every fitter.
const MISSION_CONTROL = [10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 20];

const ref = (slug, sizes) => ({ slug, measured: { type: { sizes } } });

// ── the ramp ────────────────────────────────────────────────────────────────────────────────────

test('mission-control reproduces the +0.5 ramp the research reported, from its own measurement', () => {
  const bands = splitBands(MISSION_CONTROL);
  const ui = bands.ui.map((e) => e.value);
  assert.deepEqual(ui, [10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15]);
  assert.deepEqual(
    rampSteps(ui).map((s) => s.increment),
    [1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    'the research reported this sequence as "1 0.5 0.5 0.5 0.5 0.5 0.5 1"; it is reproduced here from the raw sizes rather than copied from the report',
  );
  // The research prose said "+0.5 SEVEN times consecutively". The measurement says SIX. Pinned so
  // the discrepancy is a red test if anyone re-derives it, rather than a number nobody rechecks.
  assert.equal(rampSteps(ui).filter((s) => s.increment === 0.5).length, 6);
});

test('a display band is separated from the UI band, and 20px is not part of mission-control\'s ramp', () => {
  const bands = splitBands(MISSION_CONTROL);
  assert.deepEqual(bands.display.map((e) => e.value), [20]);
  assert.deepEqual(bands.below, []);
});

test('ratio = 1 + d/s holds to 3dp on every adjacent pair of every fixture', () => {
  for (const [slug, sizes] of [...Object.entries(FIX), ['mission-control', withCounts(MISSION_CONTROL.map((v) => [v, 1]))]]) {
    for (const s of rampSteps(sizes.map((e) => e.value))) {
      const expected = Math.round((1 + s.increment / s.from) * 1000) / 1000;
      assert.ok(Math.abs(expected - s.ratio) <= 0.001, `${slug} ${s.from}→${s.to}: ${s.ratio} vs ${expected}`);
    }
  }
});

test('integer and fractional increments are told apart, and grafana renders both', () => {
  const grafanaUi = splitBands(FIX['play-grafana-org']).ui.map((e) => e.value);
  const steps = rampSteps(grafanaUi);
  assert.ok(steps.some((s) => !s.integer), 'play.grafana.org renders fractional sizes (rem multipliers off a 14px root)');
  assert.ok(rampSteps(splitBands(FIX['linear-app']).ui.map((e) => e.value)).every((s) => s.integer));
});

test('fitIntegerRamp picks coverage, reports what it does not cover, and refuses below two sizes', () => {
  assert.deepEqual(fitIntegerRamp([12, 14]), { base: 12, increment: 2, steps: 2, covered: [12, 14], uncoveredInRange: [] });

  const mc = fitIntegerRamp(MISSION_CONTROL);
  assert.equal(mc.base, 10);
  assert.equal(mc.increment, 1);
  assert.equal(mc.steps, 6);
  assert.deepEqual(mc.uncoveredInRange, [11.5, 12.5, 13.5], 'the +0.5 sizes are reported, not silently absorbed by the fit');

  assert.equal(fitIntegerRamp([14]), null, 'one size is no ramp, and a ramp is not invented for it');
  assert.equal(fitIntegerRamp([]), null);
});

test('the usage floor is off by default and drops singletons when asked', () => {
  const unfiltered = splitBands(FIX['play-grafana-org']);
  assert.ok(unfiltered.ui.some((e) => e.value === 12.6), 'default keeps every measured size, including n=1');
  assert.equal(unfiltered.dropped.length, 0);

  const floored = splitBands(FIX['play-grafana-org'], { minCount: 3 });
  assert.ok(!floored.ui.some((e) => e.value === 12.6));
  assert.ok(floored.dropped.length > 0, 'what the floor removed is reported, never silently discarded');
});

// ── the seeds contract ──────────────────────────────────────────────────────────────────────────

test('deriveSeeds emits exactly the contract shape', () => {
  const s = deriveSeeds({ type: { sizes: FIX['linear-app'] } });
  assert.deepEqual(Object.keys(s.type).sort(), ['display', 'leading', 'tracking', 'ui']);
  assert.deepEqual(Object.keys(s.type.ui).sort(), ['base', 'increment', 'steps']);
  assert.deepEqual(Object.keys(s.type.leading).sort(), ['displayRatio', 'exponent', 'falloff', 'peak', 'peakAt']);
  assert.deepEqual(Object.keys(s.type.tracking).sort(), ['slope', 'zeroAt']);
  assert.equal(s.type.ui.base, 10);
  assert.equal(s.type.ui.increment, 1);
  assert.equal(s.type.ui.steps, 7);
});

test('a single display size yields a null increment and a note, never a plausible number', () => {
  const s = deriveSeeds({ type: { sizes: withCounts(MISSION_CONTROL.map((v) => [v, 1])) } });
  assert.equal(s.type.display.base, 20);
  assert.equal(s.type.display.steps, 1);
  assert.equal(s.type.display.increment, null);
  assert.ok(s.notes.some((n) => /single point/.test(n)));
});

test('NO DISPLAY BAND is a result, not a gap — the shape that killed the "no display band" rule', () => {
  const s = deriveSeeds({ type: { sizes: withCounts([[12, 40], [14, 60]]) } });
  assert.equal(s.type.display, null);
  assert.ok(s.notes.some((n) => /NO DISPLAY BAND/.test(n)));
  assert.deepEqual({ base: s.type.ui.base, increment: s.type.ui.increment, steps: s.type.ui.steps }, { base: 12, increment: 2, steps: 2 });
});

test('every null in the seeds carries a note explaining it — the no-silent-guess invariant', () => {
  for (const [slug, sizes] of Object.entries(FIX)) {
    const s = deriveSeeds({ type: { sizes } });
    const nulls = [];
    for (const [group, obj] of Object.entries(s.type)) {
      if (obj === null) nulls.push(group);
      else for (const [k, v] of Object.entries(obj)) if (v === null) nulls.push(`${group}.${k}`);
    }
    if (nulls.length) assert.ok(s.notes.length > 0, `${slug}: ${nulls.join(', ')} are null with no note`);
  }
});

// ── the fits refuse rather than guess ───────────────────────────────────────────────────────────

test('fitTracking recovers a clean line exactly', () => {
  // tracking = 0.0022 * (14 - size)
  const rows = [10, 12, 14, 16, 18].map((size) => ({ size, trackingEm: 0.0022 * (14 - size) }));
  const f = fitTracking(rows);
  assert.ok(Math.abs(f.zeroAt - 14) < 0.01);
  assert.ok(Math.abs(f.slope - 0.0022) < 0.0001);
  assert.equal(f.r2, 1);
});

test('fitTracking refuses a crossing outside the measured range — the linear.app -8.3px regression', () => {
  // The real linear.app rows, all 14 sizes. Before this refusal existed the fit returned
  // zeroAt: -8.302 — a font size that cannot exist — and it had passed the r2 test to get there.
  const rows = [[10, -0.015], [11, 0], [12, 0], [13, -0.01], [14, 0], [15, -0.011], [16, 0], [18, -0.0092], [20, -0.012], [24, -0.012], [32, -0.022], [48, -0.022], [64, -0.022], [72, -0.022]].map(([size, trackingEm]) => ({ size, trackingEm }));
  const f = fitTracking(rows);
  assert.equal(f.zeroAt, null);
  assert.equal(f.slope, null);
  assert.ok(f.notes.length > 0);

  // And a line whose crossing IS inside the data is still returned, so the guard is not a blanket refusal.
  const inRange = fitTracking([10, 12, 14, 16, 18].map((size) => ({ size, trackingEm: 0.003 * (15 - size) })));
  assert.ok(inRange.zeroAt !== null && Math.abs(inRange.zeroAt - 15) < 0.01);
});

test('fitTracking refuses noise, a constant, and too few points', () => {
  const noise = fitTracking([{ size: 10, trackingEm: 0.02 }, { size: 12, trackingEm: -0.03 }, { size: 14, trackingEm: 0.01 }, { size: 16, trackingEm: -0.02 }]);
  assert.equal(noise.zeroAt, null);
  assert.ok(noise.r2 < 0.5);

  const flat = fitTracking([10, 12, 14].map((size) => ({ size, trackingEm: -0.02 })));
  assert.equal(flat.zeroAt, null);
  assert.equal(flat.slope, null, 'slope 0 beside a null zeroAt would hand a consumer NaN; both go null together');
  assert.ok(flat.notes.some((n) => /constant/.test(n)));

  assert.equal(fitTracking([{ size: 12, trackingEm: 0 }, { size: 14, trackingEm: 0 }]).zeroAt, null);
});

test('fitLeading excludes under-sampled sizes — the linear.app 2.75@16px regression', () => {
  const rows = [[10, 1.4, 26], [11, 1.273, 3], [12, 1.167, 171], [13, 1.5, 132], [14, 1.714, 218], [15, 1.6, 52], [16, 2.75, 4]].map(([size, leadingRatio, count]) => ({ size, leadingRatio, count }));
  const f = fitLeading(rows, { uiSizes: [10, 11, 12, 13, 14, 15, 16] });
  assert.equal(f.peak, 1.714);
  assert.equal(f.peakAt, 14, '2.75 at 16px is carried by 4 of 586 elements and is not this reference\'s leading');
  assert.ok(f.notes.some((n) => /under-sampled/.test(n)));
});

test('fitLeading never fits the curve parameters the contract does not define', () => {
  const rows = [10, 12, 14, 16, 18].map((size) => ({ size, leadingRatio: 1.5, count: 50 }));
  const f = fitLeading(rows, { uiSizes: [10, 12, 14, 16, 18] });
  assert.equal(f.falloff, null);
  assert.equal(f.exponent, null);
  assert.ok(f.notes.some((n) => /without stating the curve/.test(n)));
  assert.equal(fitLeading([{ size: 12, leadingRatio: 1.4 }], {}).peak, null);
});

// ── THE FALSIFICATION HARNESS ───────────────────────────────────────────────────────────────────

const RULE_1125 = { id: 'min-step-ratio-1125', kind: 'min-adjacent-ratio', value: 1.125, band: 'ui', statement: 'adjacent steps must differ by at least 1.125x' };

test('falsifier can kill a rule this repo enforces — 1.125 REFUTED by three real references', () => {
  // MIN_STEP_RATIO = 1.125 is live in scripts/design-probe.mjs and fires as a p2 finding today.
  const corpus = [ref('linear-app', FIX['linear-app']), ref('stripe-com', FIX['stripe-com']), ref('mission-control', withCounts(MISSION_CONTROL.map((v) => [v, 1])))];
  const report = falsify([RULE_1125], corpus);
  assert.equal(report.rules[0].verdict, 'REFUTED');
  assert.deepEqual(report.refuted, ['min-step-ratio-1125']);
  assert.equal(report.rules[0].violated_by, 3);
  assert.equal(report.rules[0].measured_against, 3);
  for (const r of report.rules[0].references) {
    assert.equal(r.verdict, 'VIOLATES');
    assert.match(r.measured, /below 1\.125/, 'a verdict must carry the numbers it was reached from');
  }
});

test('ONE conforming reference is enough to stop REFUTED — vercel.com, measured 2026-08-29', () => {
  // THE HONEST DISAGREEMENT, PINNED. The brief that commissioned this harness expected the 1.125
  // rule REFUTED against linear + stripe + vercel. It is not: vercel.com's UI band as this tool
  // measured it is 12/14/16, ratios 1.167 and 1.143, which CONFORMS. The research reported a vercel
  // ramp of "1 2 2 2 2 2 2" — eight sizes — and this capture found three. Something differs
  // (page variant, viewport, date); the measurement is what is recorded, and the expectation is
  // not quietly bent to meet it.
  const corpus = [ref('linear-app', FIX['linear-app']), ref('stripe-com', FIX['stripe-com']), ref('vercel-com', FIX['vercel-com'])];
  const report = falsify([RULE_1125], corpus);
  assert.equal(report.rules[0].verdict, 'CONTESTED');
  assert.deepEqual(report.refuted, []);
  assert.equal(report.rules[0].references.find((r) => r.reference === 'vercel-com').verdict, 'CONFORMS');
});

test('one reference is UNDERPOWERED, never REFUTED — a single site cannot kill a rule', () => {
  const report = falsify([RULE_1125], [ref('linear-app', FIX['linear-app'])]);
  assert.equal(report.rules[0].verdict, 'UNDERPOWERED');
  assert.deepEqual(report.refuted, []);
  assert.equal(report.rules[0].references[0].verdict, 'VIOLATES', 'the per-reference verdict is still reported; only the corpus verdict is withheld');
});

test('HELD, CONTESTED and UNMEASURED are distinct outcomes', () => {
  const conform = [ref('a', withCounts([[12, 9], [16, 9]])), ref('b', withCounts([[14, 9], [20, 9]]))];
  assert.equal(falsify([RULE_1125], conform).rules[0].verdict, 'HELD');

  const mixed = [ref('a', withCounts([[12, 9], [16, 9]])), ref('b', FIX['linear-app'])];
  assert.equal(falsify([RULE_1125], mixed).rules[0].verdict, 'CONTESTED');

  const empty = [ref('a', withCounts([[14, 9]])), ref('b', withCounts([[16, 9]]))];
  const r = falsify([RULE_1125], empty);
  assert.equal(r.rules[0].verdict, 'UNMEASURED');
  assert.ok(r.rules[0].references.every((x) => x.verdict === 'UNMEASURED'));
});

test('an unknown rule kind is UNSUPPORTED and never quietly CONFORMS', () => {
  const report = falsify([{ id: 'made-up', kind: 'vibes-check', band: 'ui' }], [ref('linear-app', FIX['linear-app']), ref('stripe-com', FIX['stripe-com'])]);
  assert.equal(report.rules[0].verdict, 'UNSUPPORTED');
  assert.deepEqual(report.unsupported, ['made-up']);
  assert.notEqual(report.rules[0].verdict, 'HELD');
});

test('the three rules that died during the research all reach a verdict against the real corpus', () => {
  const corpus = Object.entries(FIX).map(([slug, sizes]) => ref(slug, sizes));
  const rules = [
    RULE_1125,
    { id: 'six-sizes', kind: 'max-distinct-sizes', value: 6, band: 'ui' },
    { id: 'needs-display', kind: 'requires-band', value: 'display' },
  ];
  const report = falsify(rules, corpus);
  for (const r of report.rules) {
    assert.ok(['HELD', 'CONTESTED', 'REFUTED'].includes(r.verdict), `${r.id} came back ${r.verdict}`);
    assert.equal(r.measured_against, 4);
  }
  // "6 sizes = restraint" passes mission-control's +0.5 ramp — the failure that made it worth killing.
  const sixOnMc = evaluateRule({ kind: 'max-distinct-sizes', value: 6, band: 'ui' }, ref('mission-control', withCounts(MISSION_CONTROL.map((v) => [v, 1]))));
  assert.equal(sixOnMc.verdict, 'VIOLATES');
  const ratioOnMc = evaluateRule(RULE_1125, ref('mission-control', withCounts(MISSION_CONTROL.map((v) => [v, 1]))));
  assert.equal(ratioOnMc.verdict, 'VIOLATES', 'the ratio rule sees the near-duplicates the count could not');
});

test('a per-rule usage floor changes the basis a verdict is reached on', () => {
  const g = ref('play-grafana-org', FIX['play-grafana-org']);
  const unfiltered = evaluateRule({ kind: 'integer-increments', band: 'ui' }, g);
  const floored = evaluateRule({ kind: 'integer-increments', band: 'ui', minCount: 3 }, g);
  assert.equal(unfiltered.verdict, 'VIOLATES');
  assert.equal(floored.verdict, 'VIOLATES');
  assert.notEqual(unfiltered.measured, floored.measured, 'the two forms of the rule must be distinguishable, or one of them is redundant');
  assert.match(unfiltered.measured, /12→12\.6/);
  assert.match(floored.measured, /14→16\.8/);
});

test('every declared rule kind is implemented — the list and the switch cannot drift apart', () => {
  const subject = ref('linear-app', FIX['linear-app']);
  for (const kind of RULE_KINDS) {
    const v = evaluateRule({ id: kind, kind, value: kind === 'increment-in' ? [1, 2] : kind === 'requires-band' || kind === 'forbids-band' ? 'display' : 2, band: 'ui' }, subject);
    assert.notEqual(v.verdict, 'UNSUPPORTED', `${kind} is declared in RULE_KINDS and not implemented`);
  }
});

// ── robots.txt ──────────────────────────────────────────────────────────────────────────────────

test('a named ClaudeBot block refuses — the godly.website shape', () => {
  const txt = 'User-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n';
  const v = robotsVerdict(txt, '/');
  assert.equal(v.allowed, false);
  assert.equal(v.matchedBy, 'ClaudeBot');
  assert.match(v.rule, /Disallow: \//);
});

test('the most restrictive identity wins across every token we could be seen as', () => {
  assert.deepEqual(UA_TOKENS, ['AgentvibeReferenceExtractor', 'ClaudeBot', '*']);
  // Standard matching would take the '*' group and allow this. We do not.
  assert.equal(robotsVerdict('User-agent: *\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /gallery/\n', '/gallery/x').allowed, false);
});

test('an empty Disallow allows, and Allow beats Disallow at equal specificity', () => {
  assert.equal(robotsVerdict('User-agent: *\nDisallow:\n', '/anything').allowed, true);
  assert.equal(robotsVerdict('User-agent: *\nDisallow: /a\nAllow: /a\n', '/a').allowed, true);
  assert.equal(robotsVerdict('User-agent: *\nDisallow: /a/b\nAllow: /a\n', '/a/b').allowed, false, 'the longer pattern wins');
});

test('consecutive user-agent lines share the group beneath them', () => {
  const g = parseRobots('User-agent: alpha\nUser-agent: beta\nDisallow: /x\n');
  assert.deepEqual(g.get('alpha').disallow, ['/x']);
  assert.deepEqual(g.get('beta').disallow, ['/x']);
});

test('robots wildcards and the $ anchor are honoured', () => {
  assert.equal(robotsPathMatches('/*.pdf$', '/a/b.pdf'), true);
  assert.equal(robotsPathMatches('/*.pdf$', '/a/b.pdf?x=1'), false);
  assert.equal(robotsPathMatches('/private', '/private/x'), true);
  assert.equal(robotsPathMatches('/private', '/public'), false);
});

test('comments and crawl-delay are parsed, and a delay is surfaced to the caller', () => {
  const v = robotsVerdict('# a comment\nUser-agent: *\nCrawl-delay: 5\nDisallow: /x # trailing\n', '/y');
  assert.equal(v.allowed, true);
  assert.equal(v.crawlDelay, 5);
});

test('an unfetchable robots.txt is NOT permission — 4xx allows, 5xx and network errors refuse', async () => {
  const res = (status, body = '') => async () => ({ status, ok: status >= 200 && status < 300, text: async () => body });
  assert.equal((await checkRobots('https://x.test/p', { fetchImpl: res(404) })).allowed, true);
  assert.equal((await checkRobots('https://x.test/p', { fetchImpl: res(503) })).allowed, false);
  assert.equal(
    (await checkRobots('https://x.test/p', { fetchImpl: async () => { throw new Error('ENOTFOUND'); } })).allowed,
    false,
    '"I could not ask" must never read as "yes"',
  );
  const ok = await checkRobots('https://x.test/p', { fetchImpl: res(200, 'User-agent: *\nDisallow: /p\n') });
  assert.equal(ok.allowed, false);
  assert.equal(ok.robotsUrl, 'https://x.test/robots.txt');
});

test('a refusal says WHOSE decision it was — "site said no" and "could not ask" are distinct', async () => {
  // Both fail closed. Reporting them with one sentence made the tool say
  // "linear.app disallows this path" when the armed sandbox had blocked the fetch — a false
  // statement about a third party, produced by a refusal that was otherwise correct.
  const res = (status, body = '') => async () => ({ status, ok: status >= 200 && status < 300, text: async () => body });
  const said = await checkRobots('https://x.test/p', { fetchImpl: res(200, 'User-agent: *\nDisallow: /p\n') });
  const couldNotAsk = await checkRobots('https://x.test/p', { fetchImpl: async () => { throw new Error('ENOTFOUND'); } });
  const alsoCouldNot = await checkRobots('https://x.test/p', { fetchImpl: res(503) });

  assert.equal(said.allowed, false);
  assert.equal(couldNotAsk.allowed, false);
  assert.equal(alsoCouldNot.allowed, false);
  assert.equal(said.reason, 'disallowed');
  assert.equal(couldNotAsk.reason, 'unknown');
  assert.equal(alsoCouldNot.reason, 'unknown');
  assert.notEqual(said.reason, couldNotAsk.reason, 'if these ever collapse to one value the message collapses with them');
  assert.equal((await checkRobots('https://x.test/p', { fetchImpl: res(404) })).reason, 'no-robots-published');
});

// ── the duplicated WCAG arithmetic, pinned against its external definition ───────────────────────

test('contrast matches the WCAG worked examples — the tripwire on the design-probe duplication', () => {
  assert.equal(contrast([0, 0, 0], [255, 255, 255]), 21);
  assert.equal(contrast([18, 52, 86], [18, 52, 86]), 1);
  assert.equal(luminance([255, 255, 255]), 1);
  assert.equal(luminance([0, 0, 0]), 0);
});

test('parseRgb reads every spelling a computed style produces', () => {
  assert.deepEqual(parseRgb('rgb(1, 2, 3)'), [1, 2, 3]);
  assert.deepEqual(parseRgb('rgba(1, 2, 3, 0.5)'), [1, 2, 3]);
  assert.deepEqual(parseRgb('rgb(1 2 3 / 50%)'), [1, 2, 3]);
  assert.equal(parseRgb('transparent'), null);
  assert.equal(parseRgb(''), null);
});

// ── output plumbing ─────────────────────────────────────────────────────────────────────────────

test('slugFor is stable and filesystem-safe', () => {
  assert.equal(slugFor('https://linear.app'), 'linear-app');
  assert.equal(slugFor('https://www.stripe.com/'), 'stripe-com');
  assert.equal(slugFor('https://play.grafana.org/d/abc/dash'), 'play-grafana-org-d-abc-dash');
});

test('SOURCE.yml carries the five required fields and an expiry after the access date', () => {
  const rec = sourceRecord('https://linear.app', { accessDate: new Date('2026-08-29T00:00:00Z'), expiryDays: 90 });
  assert.deepEqual(Object.keys(rec).sort(), ['access_date', 'captured_by', 'expires', 'licence_note', 'url']);
  assert.equal(rec.access_date, '2026-08-29');
  assert.equal(rec.expires, '2026-11-27');
  const yaml = toYaml(rec);
  // The URL is quoted because it carries a colon — unquoted it would parse as a nested mapping.
  assert.match(yaml, /^url: "https:\/\/linear\.app"$/m);
  assert.match(yaml, /^access_date: "2026-08-29"$/m);
  assert.ok(!yaml.includes('\n\n'), 'flat scalars only — no accidental block structure');
});

test('analyse folds raw tallies into the measured shape, with contrast on the pairs that occur', () => {
  const raw = {
    sizes: { 12: 10, 14: 30 },
    weights: { 400: 40 },
    families: { Inter: 40 },
    textColors: { 'rgb(0, 0, 0)': 40 },
    bgColors: { 'rgb(255, 255, 255)': 5 },
    pairs: { 'rgb(0, 0, 0)|rgb(255, 255, 255)|14|0': 30, 'rgb(200, 200, 200)|rgb(255, 255, 255)|12|0': 10 },
    leading: { '12|1.5': 8, '12|1.2': 2, '14|1.4': 30 },
    leadingNormal: { 14: 3 },
    tracking: { '12|0': 10, '14|-0.01': 30 },
    spacing: { margin: { 8: 4 }, padding: { 4: 6, 8: 9 } },
    title: 'x',
  };
  const m = analyse(raw, { url: 'https://x.test', viewport: '1440x900', scrolled: true });
  assert.deepEqual(m.type.sizes.map((e) => e.value), [12, 14]);
  assert.equal(m.type.sizes.find((e) => e.value === 14).share, 0.75);
  assert.equal(m.type.leading.find((r) => r.size === 12).leadingRatio, 1.5, 'the MODE, not a mean over a bimodal set');
  assert.equal(m.type.leading.find((r) => r.size === 12).count, 10);
  assert.equal(m.colour.pairs.find((p) => p.size === 14).contrast, 21);
  assert.equal(m.colour.belowWcagAA, 1, 'the light-grey-on-white pair is below its 4.5 floor');
  assert.deepEqual(m.spacing.padding.map((e) => e.value), [4, 8]);
  assert.equal(m.scrolled, true);
});

test('distinctWithCounts accepts both a raw array and a value->count tally', () => {
  assert.deepEqual(distinctWithCounts([14, 12, 14]), [{ value: 12, count: 1 }, { value: 14, count: 2 }]);
  assert.deepEqual(distinctWithCounts({ 14: 2, 12: 1 }), [{ value: 12, count: 1 }, { value: 14, count: 2 }]);
  assert.deepEqual(distinctWithCounts({}), []);
});
