// POSTURE: BLOCKS. Wired to .github/workflows/ci.yml through `npm run test:probe-readonly`, which
// runs this file alongside scripts/probe-readonly.test.mjs. It rides that step rather than taking
// one of its own on purpose: `scripts/lib/check-suite.js` owns the step list, a new governed name
// there requires a counterpart step in the workflow, and editing that file is `irreversible` tier.
// The precedent is b1ab4ce. `scripts/check-suite.test.mjs` asserts that argv still names both
// files, because a filename dropped from a shared command line takes its assertions with it and
// leaves every check green.
//
// scripts/design-probe.test.mjs — the negative controls that make the design probe binding.
//
// THE POINT OF THIS FILE. A critic that has never failed a deliberately-bad artifact is decoration.
// So the load-bearing tests here are NEGATIVE CONTROLS: the probe is replayed against the real
// measurements taken from mission-control on 2026-08-28 and must produce a finding for each defect
// that actually shipped. If any of those assertions can be deleted and the suite stays green, the
// probe is not binding on the thing it was built for.
//
// The measurements below are REAL, not invented — captured with playwright against the live app at
// 390px and 1440px. Provenance: docs/03-system-design/DESIGN-CAPABILITY.md §1.2. The full figures
// the six-element sample stands for: 574px of overflow at 390px, 64 interactive elements of which
// 57 fail WCAG 2.2 AA target size, heights only 15/18/24/43px, and `Inbox`/`Dispatch` reachable at
// no scroll offset. Where a fixture is CONSTRUCTED rather than captured it says so on its own line;
// a constructed number presented as a measurement is the failure this repo keeps finding.
//
// ── A TEST WAS DELETED HERE, AND THIS RECORDS IT ────────────────────────────────────────────────
// REMOVED 2026-08-29 with the rule it pinned: `MIN_STEP_RATIO is a stated rule, and the boundary is
// closed on the passing side`, which asserted `MIN_STEP_RATIO === 1.125` and checked 16→18 passing
// and 16→17.9 failing. The rule it defended — "adjacent type steps must differ by at least 1.125x" —
// was invented in this repo and then falsified: linear.app, stripe.com and vercel.com all violate
// it, and a constant integer increment produces ratios that shrink monotonically across a band, so a
// flat ratio floor condemns the construction it was meant to reward. The test made the false rule
// HARDER to remove, which is the specific harm: a test that pins a falsified rule is worse than no
// test. It is replaced by `NEGATIVE CONTROL: the sizes that shipped against the tokens that govern
// them`, which asks a question that cannot be wrong about taste.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  TARGET_AA,
  TARGET_AAA,
  REFLOW_WIDTH,
  EPS,
  DEFAULT_VIEWPORTS,
  UNCHECKED_ALWAYS,
  contrast,
  parseRgb,
  tokenNumber,
  normalizeEasing,
  tokenIndex,
  loadTokens,
  conform,
  conformStrings,
  authoredEasings,
  resolveMotion,
  findingsFor,
  uncheckedFor,
  buildArtifact,
  writeArtifact,
  rank,
  resolvePlaywright,
} from './design-probe.mjs';

const p1s = (fs_) => fs_.filter((f) => f.severity === 'p1');
const checks = (fs_) => fs_.map((f) => f.check);
const tokenFinding = (fs_, property) => fs_.find((f) => f.check === 'token-conformance' && f.property === property);
const motionFinding = (fs_, property) => fs_.find((f) => f.check === 'motion-conformance' && f.property === property);

// ── the token file the probe measures against ───────────────────────────────────────────────────
// DTCG, and the same shape `npm run build:tokens` emits into design/tokens/tokens.json: a five-step
// UI band on an integer increment plus a one-step display band, with leading and tracking derived.
const TYPE_DOC = {
  font: {
    size: {
      'ui-0': { $type: 'dimension', $value: { value: 11, unit: 'px' } },
      'ui-1': { $type: 'dimension', $value: { value: 12, unit: 'px' } },
      'ui-2': { $type: 'dimension', $value: { value: 13, unit: 'px' } },
      'ui-3': { $type: 'dimension', $value: { value: 14, unit: 'px' } },
      'ui-4': { $type: 'dimension', $value: { value: 15, unit: 'px' } },
      'display-0': { $type: 'dimension', $value: { value: 20, unit: 'px' } },
    },
    lineHeight: {
      'ui-0': { $type: 'number', $value: 1.353 },
      'ui-1': { $type: 'number', $value: 1.389 },
      'ui-2': { $type: 'number', $value: 1.424 },
      'ui-3': { $type: 'number', $value: 1.458 },
      'ui-4': { $type: 'number', $value: 1.491 },
      'display-0': { $type: 'number', $value: 1 },
    },
    letterSpacing: {
      'ui-0': { $type: 'number', $value: 0.0066 },
      'ui-1': { $type: 'number', $value: 0.0044 },
      'ui-2': { $type: 'number', $value: 0.0022 },
      'ui-3': { $type: 'number', $value: 0 },
      'ui-4': { $type: 'number', $value: -0.0022 },
      'display-0': { $type: 'number', $value: -0.0132 },
    },
  },
};

// CONSTRUCTED. design/tokens/seeds.json declares no motion at all as of 2026-08-29, so there is no
// real motion token set to replay. These exist so the motion check itself is exercised; they are
// not a proposal for what the durations should be.
const MOTION_DOC = {
  duration: {
    fast: { $type: 'duration', $value: { value: 120, unit: 'ms' } },
    base: { $type: 'duration', $value: { value: 200, unit: 'ms' } },
  },
  easing: {
    standard: { $type: 'cubicBezier', $value: [0.2, 0, 0, 1] },
    exit: { $type: 'cubicBezier', $value: [0.4, 0, 1, 1] },
  },
};

const TOKENS = tokenIndex(TYPE_DOC);
const TOKENS_MOTION = tokenIndex({ ...TYPE_DOC, ...MOTION_DOC });

// ── the real artifact, as measured ──────────────────────────────────────────────────────────────
// mission-control @390px: 574px overflow, 64 interactive elements, heights only 15/18/24/43.
const MC_NARROW = {
  overflow: 574,
  scrollWidth: 964,
  clientWidth: 390,
  reflow: false,
  targets: [
    { label: 'Fleet', w: 40, h: 43, unreachable: false },
    { label: 'Sessions', w: 62, h: 43, unreachable: false },
    { label: 'Inbox', w: 44, h: 43, unreachable: true },
    { label: 'Dispatch', w: 62, h: 43, unreachable: true },
    { label: 'agentvibe', w: 44, h: 18, unreachable: false },
    { label: 'no launcher', w: 81, h: 15, unreachable: false },
  ],
  type: {
    // The ten declared sizes across all seven views — the sizes are the measurement. PER-SIZE USAGE
    // COUNTS WERE NOT CAPTURED on 2026-08-28, so they are 1 here and are not offered as a figure.
    fontSize: { 10: 1, 11: 1, 11.5: 1, 12: 1, 12.5: 1, 13: 1, 13.5: 1, 14: 1, 15: 1, 20: 1 },
    // 1.625 IS a real count: Tailwind's `leading-relaxed` appears 27 times in mission-control, and
    // at 12px that is a 19.5px line box inside a dense table.
    lineHeight: { 1.625: 27 },
    letterSpacing: { 0: 1 },
  },
  motion: { animationsApi: true, duration: {}, easing: {}, animations: [] },
  weights: { 400: 173, 500: 13 },
  textColors: 5,
  contrastPairs: [],
};

// CONSTRUCTED, from one measured number. 964px is the measured document width at 390px; 320 is the
// width SC 1.4.10 names. 964 - 320 = 644. The overflow figure is derived, the 964 is not.
const MC_REFLOW = {
  ...MC_NARROW,
  overflow: 644,
  clientWidth: REFLOW_WIDTH,
  reflow: true,
};

// A page that conforms: every rendered value is a token, targets clear 24x24, nothing overflows.
const CLEAN = {
  overflow: 0,
  scrollWidth: 390,
  clientWidth: 390,
  reflow: false,
  targets: [
    { label: 'Primary', w: 120, h: 44, unreachable: false },
    { label: 'Secondary', w: 96, h: 44, unreachable: false },
  ],
  type: {
    fontSize: { 11: 5, 14: 20, 20: 1 },
    lineHeight: { 1.353: 5, 1.458: 20, 1: 1 },
    letterSpacing: { 0.0066: 5, 0: 20, '-0.0132': 1 },
  },
  motion: {
    animationsApi: true,
    duration: { 120: 2, 200: 1 },
    easing: { 'cubic-bezier(0.2, 0, 0, 1)': 3 },
    animations: [],
  },
  weights: { 400: 20, 600: 4 },
  textColors: 3,
  contrastPairs: [{ fg: 'rgb(20, 20, 20)', bg: 'rgb(255, 255, 255)', px: 16, bold: false }],
};

// CONSTRUCTED. No motion capture of mission-control exists; this exercises the check.
const MOTION_BAD = {
  animationsApi: true,
  duration: { 350: 3, 120: 1 },
  easing: { 'ease-in-out': 3, 'cubic-bezier(0.2, 0, 0, 1)': 1 },
  animations: [
    { kind: 'CSSAnimation', name: 'pulse', playState: 'running', duration: 350, easing: 'ease-in-out' },
    { kind: 'CSSTransition', name: 'opacity', playState: 'running', duration: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  ],
};

const WITH = (m, over) => ({ ...m, ...over });

// ── NEGATIVE CONTROLS — each names a defect that really shipped ──────────────────────────────────

test('NEGATIVE CONTROL: catches the 574px overflow that shipped', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'horizontal-overflow');
  assert.ok(hit, 'the overflow that made Inbox and Dispatch unreachable must be a p1');
  assert.match(hit.measured, /574px/);
});

test('NEGATIVE CONTROL: catches interactive elements no scroll offset can reach', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'unreachable-interactive');
  assert.ok(hit, 'unreachable nav items must be a p1');
  assert.match(hit.measured, /Inbox/);
  assert.match(hit.measured, /Dispatch/);
});

test('NEGATIVE CONTROL: catches the WCAG AA target-size failures', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'target-size-aa');
  assert.ok(hit, 'sub-24px targets must be a p1');
  // 18px and 15px rows fail; the 43px-tall nav items fail on WIDTH (40px wide) but not on 24.
  assert.match(hit.measured, /of 6 below 24x24/);
});

test('NEGATIVE CONTROL: the sizes that shipped, against the tokens that govern them', () => {
  // THE REPLACEMENT FOR THE DELETED MIN_STEP_RATIO TEST. The nine authored UI sizes measured on
  // 2026-08-28 against a token file carrying 11 12 13 14 15 20. Four of the nine appear in no
  // token: 10, 11.5, 12.5, 13.5. No opinion about the ramp is involved — half-steps between
  // integers are not "too close together", they are simply values nothing authorised.
  const shipped = { 10: 1, 11: 1, 11.5: 1, 12: 1, 12.5: 1, 13: 1, 13.5: 1, 14: 1, 15: 1 };
  const res = conform(shipped, TOKENS.fontSize, EPS.px);
  assert.equal(res.checked, true);
  assert.deepEqual(res.offenders.map((o) => o.value).sort((a, b) => a - b), [10, 11.5, 12.5, 13.5]);
  assert.equal(res.offenders.length, 4, 'four of the nine shipped sizes appear in no token');
  // Every offender names what to change it to, not only that it is wrong.
  for (const o of res.offenders) assert.ok(TOKENS.fontSize.values.includes(o.nearest), `${o.value} has no nearest token`);
  assert.equal(res.offenders.find((o) => o.value === 11.5).nearest, 11);
  assert.equal(res.offenders.find((o) => o.value === 10).nearest, 11);
});

test('NEGATIVE CONTROL: the same four sizes surface as a finding, with usage counts', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = tokenFinding(f, 'font-size');
  assert.ok(hit, 'non-conforming font sizes must be reported');
  // MC_NARROW carries 20 as well, which IS a token — so still exactly four offenders.
  assert.deepEqual(hit.offenders.map((o) => o.value).sort((a, b) => a - b), [10, 11.5, 12.5, 13.5]);
  assert.match(hit.measured, /4 of 10 rendered font-size value\(s\) appear in no token/);
  for (const o of hit.offenders) assert.equal(typeof o.count, 'number', 'each offender carries its usage count');
});

test('NEGATIVE CONTROL: leading-relaxed — 1.625 at 12px is a value no token carries', () => {
  // 27 usages in mission-control. At 12px that is a 19.5px line box in a dense table, and the
  // token file's leading curve gives 1.389 at 12px. The probe does not argue that 1.625 is wrong;
  // it reports that nothing authorised it.
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = tokenFinding(f, 'line-height');
  assert.ok(hit, '1.625 must be reported — no token carries it');
  assert.equal(hit.offenders.length, 1);
  assert.equal(hit.offenders[0].value, 1.625);
  assert.equal(hit.offenders[0].count, 27, 'the real usage count must travel with the finding');
  assert.equal(hit.offenders[0].nearest, 1.491, 'the nearest token is the top of the UI band');
});

test('NEGATIVE CONTROL: WCAG 1.4.10 reflow — two-dimensional scrolling at 320px', () => {
  const f = findingsFor('reflow-320', MC_REFLOW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'reflow-1410');
  assert.ok(hit, 'horizontal scrolling at 320px must be a p1');
  assert.match(hit.measured, /644px beyond a 320px viewport/);
  assert.match(hit.standard, /1\.4\.10/);
  assert.match(hit.standard, /320 CSS px/);
  assert.ok(hit.note.includes('two-dimensional layout'), 'the 1.4.10 exception must be named, not silently ignored');
  // The SAME measurement at a non-reflow width is the plain overflow finding, not a 1.4.10 claim.
  assert.ok(!checks(f).includes('horizontal-overflow'), 'one overflow must not be reported under two names');
  assert.ok(!checks(findingsFor('narrow', MC_NARROW, { tokens: TOKENS })).includes('reflow-1410'));
});

test('NEGATIVE CONTROL: motion that no token authorises', () => {
  const f = findingsFor('narrow', WITH(MC_NARROW, { motion: MOTION_BAD }), { tokens: TOKENS_MOTION });
  const dur = motionFinding(f, 'duration');
  assert.ok(dur, '350ms appears in no duration token and must be reported');
  assert.deepEqual(dur.offenders.map((o) => o.value), [350]);
  assert.equal(dur.offenders[0].count, 3);
  assert.equal(dur.offenders[0].nearest, 200);

  const ease = motionFinding(f, 'easing');
  assert.ok(ease, 'ease-in-out appears in no easing token and must be reported');
  assert.deepEqual(ease.offenders.map((o) => o.value), ['ease-in-out']);
  // The conforming one is written as a bezier with spaces while the token is an array — so this
  // also proves the canonicalisation, in the direction where a naive string compare would fail.
  assert.equal(ease.offenders.length, 1, 'cubic-bezier(0.2, 0, 0, 1) IS the `standard` token and must not be reported');
});

test('NEGATIVE CONTROL: the bad artifact does NOT pass', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  assert.ok(p1s(f).length >= 3, `expected >=3 p1 findings, got ${p1s(f).length}`);
});

// ── POSITIVE CONTROLS — the probe must not fire on conforming work ───────────────────────────────

test('POSITIVE CONTROL: a clean artifact produces no p1', () => {
  const f = findingsFor('narrow', CLEAN, { tokens: TOKENS_MOTION });
  assert.deepEqual(p1s(f), [], `clean artifact produced p1s: ${JSON.stringify(p1s(f))}`);
});

test('POSITIVE CONTROL: a page whose every value is a token produces no conformance finding', () => {
  const f = findingsFor('narrow', CLEAN, { tokens: TOKENS_MOTION });
  assert.deepEqual(f, [], `a fully conforming page produced findings: ${JSON.stringify(f)}`);
});

test('POSITIVE CONTROL: 3dp and 4dp token rounding is absorbed, 11.5 vs 11 is not', () => {
  // Sub-pixel layout and the token file's own rounding are not design decisions; a half-step is.
  const near = conform({ 1.4581: 3, 1.3529: 2 }, TOKENS.lineHeight, EPS.ratio);
  assert.deepEqual(near.offenders, [], 'values inside the rounding tolerance must not be reported');
  const half = conform({ 11.5: 1 }, TOKENS.fontSize, EPS.px);
  assert.equal(half.offenders.length, 1, 'a half-step must never be absorbed by the tolerance');
});

// ── the standards themselves, pinned so the published figures cannot drift ────────────────────────

test('AA is 24 and AAA is 44 — the repo asserted 44 as "the minimum" on 2026-08-28 and was wrong', () => {
  assert.equal(TARGET_AA, 24, 'WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA');
  assert.equal(TARGET_AAA, 44, 'WCAG 2.2 SC 2.5.5 Target Size (Enhanced), level AAA');
});

test('the reflow width is the one SC 1.4.10 names, and both zoom cells are actually run', () => {
  assert.equal(REFLOW_WIDTH, 320, 'SC 1.4.10 names 320 CSS px');
  const reflow = DEFAULT_VIEWPORTS.filter((v) => v.reflow);
  assert.equal(reflow.length, 2, '320px and 400% zoom are two cells, not one');
  assert.ok(reflow.every((v) => v.w === REFLOW_WIDTH));
  const zoomed = reflow.find((v) => v.dsf === 4);
  assert.ok(zoomed, '400% zoom is 320 CSS px of layout at a 4x scale factor — 1280 device px');
});

test('the target-size finding cites the standard it is measuring against', () => {
  const hit = findingsFor('narrow', MC_NARROW).find((x) => x.check === 'target-size-aa');
  assert.match(hit.standard, /2\.5\.8/);
  assert.match(hit.standard, /AA/);
  assert.ok(hit.note.includes('spacing exception'), 'the exception must be named, not silently ignored');
});

// ── conformance arithmetic ──────────────────────────────────────────────────────────────────────

test('a token group the file does not declare is NOT CHECKED, and never reported as conforming', () => {
  // TOKENS carries no motion at all — the real design/tokens/tokens.json does not either, as of
  // 2026-08-29. The dangerous failure would be silence read as a pass.
  const f = findingsFor('narrow', WITH(MC_NARROW, { motion: MOTION_BAD }), { tokens: TOKENS });
  assert.equal(motionFinding(f, 'duration'), undefined, 'an absent token group must produce no finding');
  assert.equal(motionFinding(f, 'easing'), undefined);
  const u = uncheckedFor(TOKENS, { loaded: true, path: 'design/tokens/tokens.json' });
  assert.ok(u.some((x) => /motion duration/.test(x)), 'the absence must be declared in unchecked');
  assert.ok(u.some((x) => /motion easing/.test(x)));
  assert.ok(u.some((x) => /not conformance/.test(x)), 'unchecked must say silence is not conformance');
});

test('no token file at all means conformance DID NOT RUN — stated first, not implied', () => {
  const t = loadTokens('design/tokens/does-not-exist.json', { cwd: os.tmpdir() });
  assert.equal(t.loaded, false);
  assert.match(t.reason, /no token file at/);
  for (const g of Object.values(t.index)) assert.equal(g.present, false);
  const f = findingsFor('narrow', MC_NARROW, { tokens: t.index });
  assert.equal(tokenFinding(f, 'font-size'), undefined, 'no token file must produce no conformance finding');
  const u = uncheckedFor(t.index, { loaded: false, reason: t.reason, path: t.path });
  assert.match(u[0], /TOKEN CONFORMANCE DID NOT RUN AT ALL/);
});

test('a token file that is not readable JSON degrades to NOT CHECKED, never to conforming', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-probe-'));
  fs.writeFileSync(path.join(dir, 'broken.json'), '{ not json');
  const t = loadTokens('broken.json', { cwd: dir });
  assert.equal(t.loaded, false);
  assert.match(t.reason, /not readable JSON/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadTokens reads the DTCG file the token builder actually emits', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-probe-'));
  fs.writeFileSync(path.join(dir, 'tokens.json'), JSON.stringify({ ...TYPE_DOC, ...MOTION_DOC }));
  const t = loadTokens('tokens.json', { cwd: dir });
  assert.equal(t.loaded, true);
  assert.deepEqual(t.index.fontSize.values, [11, 12, 13, 14, 15, 20]);
  assert.equal(t.index.duration.values.length, 2);
  assert.equal(t.index.easing.present, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('tokenNumber converts the units DTCG admits and refuses the ones it cannot read', () => {
  assert.equal(tokenNumber({ value: 14, unit: 'px' }), 14);
  assert.equal(tokenNumber({ value: 1, unit: 'rem' }), 16, 'rem is taken at the CSS initial root size');
  assert.equal(tokenNumber({ value: 0.2, unit: 's' }), 200);
  assert.equal(tokenNumber({ value: 120, unit: 'ms' }), 120);
  assert.equal(tokenNumber(1.458), 1.458);
  assert.equal(tokenNumber('14px'), 14);
  assert.equal(tokenNumber({ value: 3, unit: 'vw' }), null, 'an unreadable unit must be dropped, not guessed');
  assert.equal(tokenNumber('calc(1rem + 2px)'), null);
  // A dropped token must not silently become a token that matches nothing.
  const idx = tokenIndex({ font: { size: { a: { $value: { value: 3, unit: 'vw' } } } } });
  assert.equal(idx.fontSize.present, false, 'a group of only unreadable tokens is absent, not empty-but-present');
});

// ── where the authored easing lives, which is not one place ─────────────────────────────────────
// REAL, captured from Chromium on 2026-08-29 in a single page with a single getAnimations() call.
// This is the exact shape the browser returned, copied verbatim. See design-probe.mjs's
// authoredEasings() for the fixture that produced it.
const CHROMIUM_EASING_CAPTURE = [
  { kind: 'CSSTransition', name: 'opacity', timingEasing: 'ease-out', keyframeEasings: ['linear', 'linear'], duration: 250 },
  { kind: 'CSSAnimation', name: 'spin', timingEasing: 'linear', keyframeEasings: ['ease-in-out', 'ease-in-out'], duration: 350 },
  { kind: 'CSSAnimation', name: 'spin', timingEasing: 'linear', keyframeEasings: ['cubic-bezier(0.2, 0, 0, 1)', 'cubic-bezier(0.2, 0, 0, 1)'], duration: 200 },
];

test('NEGATIVE CONTROL: a CSS animation\'s easing is on its KEYFRAMES, not on getTiming()', () => {
  // The bug this pins was in the first version of this probe and was found by RUNNING it: reading
  // getTiming().easing reports `linear` for every CSS animation in the app — not an error, a
  // plausible wrong answer — so every authored curve would have been graded against the wrong value.
  const [transition, easeInOut, bezier] = CHROMIUM_EASING_CAPTURE;
  assert.deepEqual(authoredEasings(easeInOut), ['ease-in-out'], 'a CSSAnimation must be read from its keyframes');
  assert.deepEqual(authoredEasings(bezier), ['cubic-bezier(0.2, 0, 0, 1)']);
  assert.deepEqual(authoredEasings(transition), ['ease-out'], 'a CSSTransition must be read from its effect timing');
  // The two are in opposite places, so reading either one alone is wrong for half the corpus.
  assert.notEqual(authoredEasings(easeInOut)[0], easeInOut.timingEasing);
  assert.notEqual(authoredEasings(transition)[0], transition.keyframeEasings[0]);
});

test('resolveMotion turns the raw capture into counts, and keeps a real linear', () => {
  const m = resolveMotion({ animationsApi: true, animations: CHROMIUM_EASING_CAPTURE });
  assert.deepEqual(m.duration, { 250: 1, 350: 1, 200: 1 });
  assert.deepEqual(m.easing, { 'ease-out': 1, 'ease-in-out': 1, 'cubic-bezier(0.2, 0, 0, 1)': 1 });
  assert.equal(m.easing.linear, undefined, 'the default `linear` on the wrong side must not be counted');
  // A transition an author really did write as linear IS reported — the rule is positional, not a
  // blanket filter on the word.
  const real = resolveMotion({ animations: [{ kind: 'CSSTransition', timingEasing: 'linear', keyframeEasings: ['linear'], duration: 100 }] });
  assert.deepEqual(real.easing, { linear: 1 });
  // A zero-duration effect is the absence of a motion decision, not a 0ms one.
  const zero = resolveMotion({ animations: [{ kind: 'CSSAnimation', duration: 0, keyframeEasings: ['ease'] }] });
  assert.deepEqual(zero.duration, {});
});

test('a script-driven Animation with per-keyframe easing has BOTH values read', () => {
  // Found by mutation: deleting the keyframe arm of authoredEasings() for non-CSSAnimation effects
  // left every test green. The Web Animations API lets an author set easing on the effect AND on
  // individual keyframes, and both are authored decisions the token file should govern.
  const scripted = resolveMotion({
    animations: [{ kind: 'Animation', timingEasing: 'linear', keyframeEasings: ['linear', 'cubic-bezier(0.4, 0, 1, 1)'], duration: 300 }],
  });
  assert.deepEqual(scripted.easing, { linear: 1, 'cubic-bezier(0.4, 0, 1, 1)': 1 });
  assert.deepEqual(
    authoredEasings({ kind: 'Animation', timingEasing: 'ease', keyframeEasings: ['linear', 'ease-out'] }),
    ['ease', 'ease-out'],
    'a per-keyframe `linear` is indistinguishable from the default and is left to the timing easing',
  );
});

test('normalizeEasing makes a keyword and its bezier compare equal, both ways', () => {
  assert.equal(normalizeEasing('ease-out'), normalizeEasing([0, 0, 0.58, 1]));
  assert.equal(normalizeEasing('cubic-bezier(0.42, 0, 0.58, 1)'), normalizeEasing('ease-in-out'));
  assert.equal(normalizeEasing('LINEAR'), normalizeEasing([0, 0, 1, 1]));
  assert.notEqual(normalizeEasing('ease-in'), normalizeEasing('ease-out'));
  // What it cannot canonicalise it still compares exactly, rather than becoming unmatchable.
  assert.equal(normalizeEasing('steps(4, end)'), normalizeEasing('steps(4,end)'));
});

test('a rendered value that is not a number is an offender with no nearest, not a dropped value', () => {
  // `line-height: normal` is font-dependent and is not 1.2. It cannot be converted to a ratio, and
  // dropping it would hide every element the token file does not govern.
  const res = conform({ normal: 12, 1.458: 30 }, TOKENS.lineHeight, EPS.ratio);
  assert.equal(res.offenders.length, 1);
  assert.equal(res.offenders[0].value, 'normal');
  assert.equal(res.offenders[0].nearest, null);
  assert.equal(res.offenders[0].count, 12);
});

test('offenders are ordered by usage count, so the biggest problem reads first', () => {
  const res = conform({ 10: 2, 11.5: 40, 12.5: 9 }, TOKENS.fontSize, EPS.px);
  assert.deepEqual(res.offenders.map((o) => o.value), [11.5, 12.5, 10]);
});

test('conform and conformStrings both report NOT CHECKED for an absent group, distinctly from clean', () => {
  const absent = { present: false, values: [], byName: {} };
  assert.deepEqual(conform({ 99: 1 }, absent), { checked: false, offenders: [], usages: 0, distinct: 0 });
  assert.deepEqual(conformStrings({ wobble: 1 }, absent), { checked: false, offenders: [], usages: 0, distinct: 0 });
  // CONTROL: with a real group the same input IS an offender — so `checked: false` is not just
  // "found nothing".
  assert.equal(conform({ 99: 1 }, TOKENS.fontSize).offenders.length, 1);
  assert.equal(conformStrings({ wobble: 1 }, TOKENS_MOTION.easing).offenders.length, 1);
});

// ── the artifact a browserless, shell-less reviewer reads ────────────────────────────────────────

test('the artifact carries findings AND unchecked, so absence cannot be read as coverage', () => {
  const result = {
    ok: false,
    findings: findingsFor('narrow', MC_NARROW, { tokens: TOKENS }),
    measurements: { narrow: MC_NARROW },
    unchecked: uncheckedFor(TOKENS, { loaded: true, path: 'design/tokens/tokens.json' }),
  };
  const a = buildArtifact({ url: 'http://localhost:4317', tokens: { path: 'design/tokens/tokens.json', loaded: true, reason: null, index: TOKENS }, result });
  assert.equal(a.exit, 1);
  assert.equal(a.state, 'MEASURED — failed');
  assert.ok(a.findings.length > 0);
  assert.ok(Array.isArray(a.unchecked) && a.unchecked.length >= UNCHECKED_ALWAYS.length, 'unchecked must be IN the artifact, not only on stdout');
  assert.equal(a.tokens.loaded, true);
  assert.equal(a.tokens.groups.fontSize.count, 6);
  assert.equal(a.tokens.groups.duration.present, false);
});

test('a REFUSAL is written into the artifact as exit 2 — a blind reader cannot see it as a pass', () => {
  const e = new Error('chromium failed to launch');
  e.code = 'ENOLAUNCH';
  const a = buildArtifact({ url: 'http://localhost:4317', tokens: { path: 'p', loaded: false, reason: 'none', index: TOKENS }, result: null, refused: e });
  assert.equal(a.exit, 2);
  assert.match(a.state, /REFUSED/);
  assert.equal(a.refused.code, 'ENOLAUNCH');
  assert.deepEqual(a.findings, [], 'a refusal has no findings — and says so with exit 2, not with ok:true');
  assert.ok(a.unchecked.some((x) => /DID NOT RUN AT ALL/.test(x)));
});

test('a passing run is exit 0 and says which of the three states produced it', () => {
  const a = buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: true, findings: [], measurements: {}, unchecked: [] } });
  assert.equal(a.exit, 0);
  assert.equal(a.state, 'MEASURED — passed');
});

test('writeArtifact creates the directory and round-trips as JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-probe-'));
  const out = path.join(dir, 'nested', 'probe.json');
  const a = buildArtifact({ url: 'u', tokens: null, result: { ok: true, findings: [], measurements: {}, unchecked: ['x'] } });
  writeArtifact(out, a);
  assert.deepEqual(JSON.parse(fs.readFileSync(out, 'utf8')), a);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('unchecked always names the rAF hole — the animations getAnimations() cannot see', () => {
  const u = uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'design/tokens/tokens.json' });
  assert.ok(u.some((x) => /requestAnimationFrame/.test(x)), 'the rAF hole must be declared on every run');
  assert.ok(u.some((x) => /getAnimations/.test(x)));
  assert.ok(u.some((x) => /transitions that are not mid-flight/.test(x)), 'a static capture misses most transitions');
});

test('a browser without getAnimations() is reported as unchecked, not as no animations', () => {
  const m = { ...CLEAN, motion: { animationsApi: false, duration: {}, easing: {}, animations: [] } };
  const u = uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'p', measurements: { narrow: m } });
  assert.ok(u.some((x) => /not available in this browser/.test(x)));
});

// ── contrast arithmetic, against published values ────────────────────────────────────────────────

test('contrast matches the published extremes', () => {
  assert.equal(contrast([0, 0, 0], [255, 255, 255]), 21);
  assert.equal(contrast([255, 255, 255], [255, 255, 255]), 1);
});

test('contrast is symmetric — argument order cannot change a verdict', () => {
  assert.equal(contrast([90, 98, 112], [13, 14, 17]), contrast([13, 14, 17], [90, 98, 112]));
});

test('contrast reproduces a figure measured independently in styles.css', () => {
  // --color-divider #5a6270 on --color-ink #0d0e11, documented there as 3.139:1
  const r = contrast(parseRgb('rgb(90, 98, 112)'), parseRgb('rgb(13, 14, 17)'));
  assert.ok(Math.abs(r - 3.139) < 0.02, `expected ~3.139, got ${r}`);
});

test('parseRgb handles rgb and rgba, and refuses what it cannot read', () => {
  assert.deepEqual(parseRgb('rgb(1, 2, 3)'), [1, 2, 3]);
  assert.deepEqual(parseRgb('rgba(1, 2, 3, 0.5)'), [1, 2, 3]);
  assert.equal(parseRgb('transparent'), null);
  assert.equal(parseRgb('#fff'), null);
});

test('contrast findings use the large-text floor only where the spec allows it', () => {
  const dim = { fg: 'rgb(120, 120, 120)', bg: 'rgb(255, 255, 255)', px: 14, bold: false };
  const small = findingsFor('t', { ...CLEAN, contrastPairs: [dim] }, { tokens: TOKENS_MOTION });
  assert.ok(checks(small).includes('text-contrast'), '2.85:1 at 14px must fail the 4.5 floor');

  const large = findingsFor('t', { ...CLEAN, contrastPairs: [{ ...dim, px: 24 }] }, { tokens: TOKENS_MOTION });
  assert.ok(!checks(large).includes('text-contrast'), 'the same colour at 24px passes the 3.0 floor');
});

// ── ordering and refusal ────────────────────────────────────────────────────────────────────────

test('findings are ranked p1 first, so a caller reading the head cannot miss a blocker', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS_MOTION });
  const firstNonP1 = f.findIndex((x) => x.severity !== 'p1');
  assert.notEqual(firstNonP1, -1, 'CONTROL: this fixture must produce a non-p1, or the check below is vacuous');
  assert.ok(f.slice(firstNonP1).every((x) => x.severity !== 'p1'), 'p1s must be contiguous at the head');
});

test('rank does not mutate its input', () => {
  const input = [{ severity: 'p2' }, { severity: 'p1' }];
  const copy = JSON.parse(JSON.stringify(input));
  rank(input);
  assert.deepEqual(input, copy);
});

test('every finding names the standard it measured against — none is a bare opinion', () => {
  const f = findingsFor('narrow', WITH(MC_NARROW, { motion: MOTION_BAD }), { tokens: TOKENS_MOTION });
  assert.ok(f.length >= 6, `CONTROL: expected the full finding set, got ${f.length}`);
  for (const x of f) {
    assert.ok(x.standard && x.standard.length > 10, `finding ${x.check} has no stated standard`);
    assert.ok(x.measured && /\d/.test(x.measured), `finding ${x.check} has no number in it`);
  }
});

test('a conformance finding cites the token file by path, not a rule this script invented', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS, tokensPath: 'design/tokens/tokens.json' });
  const hit = tokenFinding(f, 'font-size');
  assert.match(hit.standard, /design\/tokens\/tokens\.json/);
  assert.ok(/no opinion about the ramp/.test(hit.note), 'the finding must disclaim the taste judgement it is not making');
});

test('resolvePlaywright returns a usable module or null — never a half-answer', () => {
  const r = resolvePlaywright();
  if (r !== null) {
    assert.ok(r.mod.chromium, 'a non-null resolution must carry chromium');
    assert.equal(typeof r.from, 'string');
  }
});
