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
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  TARGET_AA,
  TARGET_AAA,
  REFLOW_WIDTH,
  EPS,
  TRANSPARENT,
  DEFAULT_VIEWPORTS,
  DEFAULT_TOKENS_PATH,
  UNCHECKED_ALWAYS,
  contrast,
  parseRgb,
  tokenNumber,
  normalizeEasing,
  tokenIndex,
  loadTokens,
  conform,
  conformStrings,
  observed,
  alphaOf,
  safeLabel,
  authoredEasings,
  resolveMotion,
  coverageGaps,
  canvasBackground,
  resolveContrast,
  pairColors,
  findingsFor,
  uncheckedFor,
  buildArtifact,
  writeArtifact,
  rank,
  blocking,
  isPass,
  probe,
  resolvePlaywright,
} from './design-probe.mjs';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPTS_DIR, '..');

/**
 * A FIXTURE DIRECTORY THAT DOES NOT DEPEND ON THE AMBIENT TMPDIR. Seven tests here called
 * `fs.mkdtempSync(path.join(os.tmpdir(), …))`, and under the armed sandbox `os.tmpdir()` is
 * writable only when TMPDIR points somewhere the sandbox allows. Measured 2026-08-29 on one tree,
 * one commit, minutes apart: `TMPDIR=/tmp/claude-501` -> 66 pass, exit 0; TMPDIR at the macOS
 * default `/var/folders/...` -> 59 pass, 7 FAIL, EPERM. `test:probe-readonly` carries this file,
 * so the outcome of `npm run check` depended on an environment variable nobody sets deliberately —
 * and every "48 of 48" reported on 2026-08-29 was taken with TMPDIR set to a session scratchpad.
 *
 * The repo root is the base instead: it is writable wherever this suite is allowed to run at all,
 * and `scripts/lenses.test.mjs` already writes `.lens-fixture-*.yml` there by the same reasoning.
 * Dotted so it is invisible to an ordinary listing, and each caller removes its own.
 */
function tmpDir() {
  return fs.mkdtempSync(path.join(REPO_ROOT, '.design-probe-tmp-'));
}

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

// ── RUNNING collect() IN NODE, WHICH NOTHING COULD DO BEFORE ────────────────────────────────────
//
// `collect()` is serialised into the browser by `page.evaluate`, so it can reference nothing from
// module scope and is not exported — which is why the only assertion this file ever made about it
// read its SOURCE for a string. Its source is read here too, and then RUN, against a document
// built by hand. That turns "the guard is spelled correctly" into "the guard filters what it
// claims and keeps what it must".
//
// WHAT THIS PROVES: what the walk does with a given computed style and rect.
// WHAT IT DOES NOT PROVE, and no node test can: what Chromium computes for a <title>, or that a
// child of a display:none parent reports `display: block`. Those are browser facts, measured in
// Chromium on 2026-08-29 and recorded in the table inside collect(). The fixtures below CARRY
// those measured values rather than deriving them — a fixture that assumed `display: none` on
// <title> would be assuming the answer the browser was asked for.
const COLLECT_SRC = (() => {
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'design-probe.mjs'), 'utf8');
  const body = src.slice(src.indexOf('function collect()'), src.indexOf('/* c8 ignore stop */'));
  assert.ok(body.includes("querySelectorAll('*')"), 'CONTROL: collect() source must have been found, or every test below is vacuous');
  return body;
})();

const CSS_DEFAULTS = {
  display: 'block', visibility: 'visible', fontSize: '16px', lineHeight: 'normal',
  letterSpacing: 'normal', fontWeight: '400', color: 'rgb(0, 0, 0)',
  backgroundColor: TRANSPARENT, overflowX: 'visible', colorScheme: 'normal',
};

/** Run the real collect() against a hand-built document. `css` and `rect` are per-element. */
function runCollect(specs, { clientWidth = 390, scrollWidth = 390 } = {}) {
  const nodes = specs.map((s) => {
    // `ancestors` is nearest-first and exists for one reason: the backdrop walk in collect() reads
    // `parentElement` and nothing else in this harness had a parent, so the walk always terminated
    // at the first element and the transparent-ancestor defect could not be reached from a test.
    let parent = null;
    for (const a of [...(s.ancestors ?? [])].reverse()) {
      parent = { tagName: 'DIV', css: { ...CSS_DEFAULTS, ...a }, parentElement: parent, children: [] };
    }
    return {
      tagName: s.tag ?? 'P',
      textContent: s.text ?? 'text',
      children: [],
      parentElement: parent,
      css: { ...CSS_DEFAULTS, ...(s.css ?? {}) },
      rect: { width: 100, height: 20, left: 0, ...(s.rect ?? {}) },
      interactive: Boolean(s.interactive),
      getBoundingClientRect() { return this.rect; },
      getAttribute() { return null; },
    };
  });
  const de = { tagName: 'HTML', clientWidth, scrollWidth, parentElement: null, css: { ...CSS_DEFAULTS } };
  const doc = {
    documentElement: de,
    body: { css: { ...CSS_DEFAULTS } },
    getAnimations: () => [],
    querySelectorAll: (sel) => (sel === '*' ? nodes : nodes.filter((n) => n.interactive)),
  };
  const gcs = (n) => n.css ?? CSS_DEFAULTS;
  const win = { matchMedia: () => ({ matches: false }) };
  // eslint-disable-next-line no-new-func
  return new Function('document', 'getComputedStyle', 'window', `${COLLECT_SRC}\nreturn collect();`)(doc, gcs, win);
}

// The page the p1 was measured on: one visible 14px paragraph, and five things a browser does not
// paint. Every `css`/`rect` value here is what Chromium reported for that element on 2026-08-29.
const RENDERED_AND_NOT = [
  { tag: 'TITLE', text: 'a title nobody renders', css: { display: 'none', fontSize: '16px' }, rect: { width: 0, height: 0 } },
  { tag: 'STYLE', text: 'body { margin: 0 }', css: { display: 'none', fontSize: '16px' }, rect: { width: 0, height: 0 } },
  { tag: 'SCRIPT', text: 'window.__x = 1;', css: { display: 'none', fontSize: '16px' }, rect: { width: 0, height: 0 } },
  { tag: 'P', text: 'hidden by visibility', css: { visibility: 'hidden', fontSize: '77px' }, rect: { width: 390, height: 180 } },
  { tag: 'P', text: 'hidden by display', css: { display: 'none', fontSize: '99px' }, rect: { width: 0, height: 0 } },
  // The one the style test alone does not catch: its own computed display is `block` and its own
  // visibility is `visible`; the ancestor is what is display:none, and only the rect shows it.
  { tag: 'P', text: 'a child of a display:none parent', css: { fontSize: '88px' }, rect: { width: 0, height: 0 } },
  { tag: 'P', text: 'the only text this page renders', css: { fontSize: '14px', lineHeight: '21px', letterSpacing: 'normal' }, rect: { width: 390, height: 21 } },
];

// ── NEGATIVE CONTROLS — each names a defect that really shipped ──────────────────────────────────

test('NEGATIVE CONTROL: catches the 574px overflow that shipped', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'horizontal-overflow');
  assert.ok(hit, 'the overflow that made Inbox and Dispatch unreachable must be a p1');
  assert.match(hit.measured, /574px/);
});

test('NEGATIVE CONTROL: a page that under-reports its own overflow is contradicted by its operands', () => {
  // `collect()` returns overflow, scrollWidth and clientWidth in ONE payload and the first is the
  // difference of the other two, so this is the one axis where the probe holds a second view of
  // the same fact. It did not use it: flipping `overflow` 574 -> 0 with the operands untouched
  // turned exit 1 with 5 blocking findings into exit 0, while the artifact still carried 964 and
  // 390 for anyone who read them.
  const lying = WITH(MC_NARROW, { overflow: 0 });   // scrollWidth 964, clientWidth 390 -> 574
  const f = findingsFor('narrow', lying, { tokens: TOKENS });
  const integrity = f.find((x) => x.check === 'measurement-integrity');
  assert.ok(integrity, 'the contradiction must itself be a finding');
  assert.match(integrity.measured, /reported overflow 0px/);
  assert.match(integrity.measured, /964 minus clientWidth 390 is 574px/);
  assert.equal(integrity.severity, 'p1');
  // And the overflow finding is still made, on the larger of the two, so the lie buys nothing.
  const over = f.find((x) => x.check === 'horizontal-overflow');
  assert.ok(over, 'the overflow itself must still be reported');
  assert.match(over.measured, /^574px beyond a 390px viewport/);
  assert.equal(isPass(f), false);
  // The other direction — a page OVER-reporting — is also a contradiction and also still fails.
  const inflating = WITH(CLEAN, { overflow: 999 });
  const g = findingsFor('narrow', inflating, { tokens: TOKENS_MOTION });
  assert.ok(g.find((x) => x.check === 'measurement-integrity'), 'over-reporting is a contradiction too');
  assert.match(g.find((x) => x.check === 'horizontal-overflow').measured, /^999px/);
  // CONTROL: an honest measurement produces NO integrity finding, or this fires on every run.
  assert.equal(findingsFor('narrow', MC_NARROW, { tokens: TOKENS }).find((x) => x.check === 'measurement-integrity'), undefined);
  assert.equal(findingsFor('narrow', CLEAN, { tokens: TOKENS_MOTION }).find((x) => x.check === 'measurement-integrity'), undefined);
  assert.equal(findingsFor('reflow-320', MC_REFLOW, { tokens: TOKENS }).find((x) => x.check === 'measurement-integrity'), undefined);
});

test('NEGATIVE CONTROL: catches interactive elements no scroll offset can reach', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'unreachable-interactive');
  assert.ok(hit, 'unreachable nav items must be a p1');
  assert.match(hit.measured, /Inbox/);
  assert.match(hit.measured, /Dispatch/);
});

test('a label cannot repaint the operator\'s terminal', () => {
  // `.trim()` does not strip ESC. The label comes from aria-label or textContent, the CLI prints
  // six per finding to a tty, and `\x1b[2J\x1b[H` clears the screen — about 240 attacker-controlled
  // bytes, enough to repaint a forged closing line under a real one. The artifact was never at
  // risk (JSON.stringify escapes ESC) and neither was the exit code; the human channel was, and
  // the CLI's own comment says the two cannot say different things.
  const hostile = '\u001b[2J\u001b[HInbox';
  const m = WITH(MC_NARROW, { targets: [{ label: hostile, w: 44, h: 43, unreachable: true }] });
  const hit = findingsFor('narrow', m, { tokens: TOKENS }).find((x) => x.check === 'unreachable-interactive');
  assert.ok(hit);
  assert.ok(!/\u001b/.test(hit.measured), 'no ESC may reach a string the CLI prints');
  assert.match(hit.measured, /Inbox/, 'and the readable part of the label must survive — this is not "drop the label"');
  assert.match(hit.measured, /\ufffd/, 'a label that carried control bytes must be visibly one that did');
  assert.equal(safeLabel('plain label'), 'plain label', 'CONTROL: an ordinary label is untouched');
  assert.equal(safeLabel('a\u0007b\u009fc'), 'a\ufffdb\ufffdc', 'C0 and C1 both');
  assert.equal(safeLabel(undefined), '');
  // CONTROL: the raw label still travels in `measurements`, where JSON escaping makes it safe and
  // an operator can see what the page actually claimed.
  assert.equal(m.targets[0].label, hostile);
});

test('NEGATIVE CONTROL: catches the WCAG AA target-size failures', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  const hit = p1s(f).find((x) => x.check === 'target-size-aa');
  assert.ok(hit, 'sub-24px targets must be a p1');
  // THE COUNT IS INSIDE THE PATTERN NOW. It read `/of 6 below 24x24/`, leaving the leading number
  // outside — so a mutation that changed how many targets failed produced the identical string.
  // The comment here also said the 43px-tall nav items "fail on WIDTH (40px wide)"; 40 is not
  // below 24 and they fail nothing. The two rows that fail are `agentvibe` 44x18 and
  // `no launcher` 81x15, both on HEIGHT, which is why the width alternative had no coverage at
  // all — see the test below.
  assert.match(hit.measured, /^2 of 6 below 24x24/);
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

// ── p1: THE WALK MEASURED WHAT THE BROWSER NEVER PAINTED ────────────────────────────────────────
//
// The type/colour walk filtered empty text and elements with children, and nothing else, while the
// interactive-targets walk 24 lines above it in the SAME FUNCTION already tested the rect and the
// computed style. Measured end to end in Chromium on a page whose only visible text is one 14px
// paragraph: `fontSize {"14":1,"16":3,"77":1,"88":1,"99":1}` and a p1 reading "4 of 5 rendered
// font-size value(s) appear in no token".
//
// It blocked every run against every real page, and it named values nobody can act on: 16px x3 is
// <title>, <style> and <script> at the UA default, and there is no token to assign to <title>.

test('NEGATIVE CONTROL: collect() measures only what the browser actually paints', () => {
  const m = runCollect(RENDERED_AND_NOT);
  assert.deepEqual(m.type.fontSize, { 14: 1 }, 'the UA 16px on <title>/<style>/<script>, the 77px visibility:hidden, the 99px display:none and the 88px child of a display:none parent are all unpainted');
  assert.deepEqual(m.type.lineHeight, { 1.5: 1 }, '21px over 14px — and no `normal` from the five the browser does not render');
  assert.deepEqual(m.type.letterSpacing, { 0: 1 });
  assert.deepEqual(m.weights, { 400: 1 }, 'the same walk feeds weights, so they are filtered too');
  assert.equal(m.contrastPairs.length, 1, 'and contrast pairs — invisible text cannot fail a contrast floor');
});

test('POSITIVE CONTROL: a VISIBLE element is still measured — the guard did not eat the page', () => {
  // REQUIRED, and it is the arm that makes the one above safe: a guard that filtered everything
  // would leave the probe measuring nothing, and until the fix below it that read as a PASS. The
  // two defects compose, which is why they were fixed together.
  const m = runCollect([
    { css: { fontSize: '14px', lineHeight: '21px' }, rect: { width: 390, height: 21 } },
    { css: { fontSize: '20px', lineHeight: '20px', fontWeight: '600' }, rect: { width: 200, height: 20 } },
  ]);
  assert.deepEqual(m.type.fontSize, { 14: 1, 20: 1 });
  assert.deepEqual(m.weights, { 400: 1, 600: 1 });
  assert.equal(m.contrastPairs.length, 2);
});

test('each half of the render guard is load-bearing — neither alone closes it', () => {
  // Mutation-shaped on purpose. Delete the rect test and the child of a display:none parent comes
  // back (its own computed style says block/visible); delete the style test and visibility:hidden
  // comes back (it occupies 390x180 of layout). Testing them together would let either deletion
  // survive, which is the two-alternative-predicate class this repo has now been bitten by twice.
  const childOfNone = runCollect([{ css: { fontSize: '88px' }, rect: { width: 0, height: 0 } }]);
  assert.deepEqual(childOfNone.type.fontSize, {}, 'a zero rect is not painted, whatever its own computed display says');
  const visHidden = runCollect([{ css: { fontSize: '77px', visibility: 'hidden' }, rect: { width: 390, height: 180 } }]);
  assert.deepEqual(visHidden.type.fontSize, {}, 'visibility:hidden occupies layout and is still not painted');
  const displayNone = runCollect([{ css: { fontSize: '99px', display: 'none' }, rect: { width: 0, height: 0 } }]);
  assert.deepEqual(displayNone.type.fontSize, {});
});

test('NEGATIVE CONTROL: the exact census the unguarded walk produced is a finding, and the guarded one is not', () => {
  // The measured before-and-after, replayed through the finder against a token file carrying 14.
  const before = { 14: 1, 16: 3, 77: 1, 88: 1, 99: 1 };  // Chromium, 2026-08-29, guard absent
  const after = runCollect(RENDERED_AND_NOT).type.fontSize;  // the same page, guard present
  const only14 = tokenIndex({ font: { size: { s: { $value: { value: 14, unit: 'px' } } } } });
  const hitBefore = tokenFinding(findingsFor('narrow', WITH(CLEAN, { type: { ...CLEAN.type, fontSize: before } }), { tokens: only14 }), 'font-size');
  assert.ok(hitBefore, 'CONTROL: the unguarded census must still be a finding, or this proves nothing');
  assert.deepEqual(hitBefore.offenders.map((o) => o.value).sort((a, b) => a - b), [16, 77, 88, 99]);
  const hitAfter = tokenFinding(findingsFor('narrow', WITH(CLEAN, { type: { ...CLEAN.type, fontSize: after } }), { tokens: only14 }), 'font-size');
  assert.equal(hitAfter, undefined, 'the guarded census authorises every value it measured');
});

test('NEGATIVE CONTROL: the bad artifact does NOT pass', () => {
  const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS });
  assert.ok(p1s(f).length >= 3, `expected >=3 p1 findings, got ${p1s(f).length}`);
});

// ── THE GATE — findings must reach the verdict, which is where this probe was broken ─────────────
//
// Everything above tests the FINDER. Until 2026-08-29 nothing tested that a finding reaches the
// exit code, and the finder and the verdict disagreed: conformance findings were emitted at `p2`
// while `ok` gated on `p1`, so the entire conformance axis could not fail a run. These tests are
// the ones that would have caught it, and they run without a browser because `blocking()`,
// `isPass()` and `buildArtifact()` are pure.

// THE MEASURED CENSUS, not a constructed one. mission-control's off-system type against the
// shipped design/tokens/tokens.json: 45 font-size usages and 27 of 27 `leading-relaxed`
// line-heights appear in no token.
//
// `10: 1` WAS MISSING UNTIL 2026-08-29 and the fixture summed to 44 while four places in two files
// said 45 — one population, two numbers. 10px is off-system against the ramp 11 12 13 14 15 20,
// and this file's own conformance test lists exactly four offenders, [10, 11.5, 12.5, 13.5], while
// the census listed three. The verdicts never moved (still 2 findings, both p1, isPass false), so
// what the control below was guarding was a population one narrower than the one it documents.
//
// PROVENANCE, asked and answered rather than corroborated: the figure is STATIC — a source census,
// not a probe reading. Three independent reasons, and the test below re-derives it. (1)
// DESIGN-CAPABILITY.md states "12.5px is 30 usages, 31.9%" beside it, and 30/0.319 = 94.0, which is
// a USAGE count over source; a probe reports per-viewport computed values and has no such
// denominator. (2) The same document records the values as literal utilities — `text-[11.5px]` —
// and labels the method "source census across all seven views". (3) A probe run at that sha would
// have carried the p1-1 contamination (16px x3 from <title>/<style>/<script>) into any count taken
// from it, and no off-system census anywhere in this repo carries a 16.
// SO IT IS NOT CONTAMINATED BY p1-1 and needs no re-derivation after that fix.
//
// ONE RESIDUAL, REPORTED RATHER THAN QUIETLY CORRECTED: the NUMERATOR re-derives exactly and the
// DENOMINATOR does not. `git grep -hEo 'text-\[[0-9.]+px\]' <rev> -- mission-control` gives 93
// utilities, not 94, identically at origin/main, at 3b528fa and at HEAD; adding the three
// `font-size:` declarations in styles.css gives 96. So "45 of 94" is 45 of 93 or of 96 by the only
// method that reproduces the 45. The off-by-one is in the denominator alone, it is nobody's
// verdict, and it is left as an open question rather than a fifth revision of a number.
const OFF_SYSTEM_CENSUS = {
  overflow: 0,
  scrollWidth: 390,
  clientWidth: 390,
  reflow: false,
  targets: [],
  type: { fontSize: { 10: 1, 12.5: 30, 11.5: 13, 13.5: 1 }, lineHeight: { 1.625: 27 }, letterSpacing: {} },
  motion: { animationsApi: true, duration: {}, easing: {}, animations: [] },
  weights: {},
  textColors: 0,
  contrastPairs: [],
};

test('the census sums to the 45 it is described as, and re-derives from the corpus', (t) => {
  // THE FIXTURE SUMMED TO 44 while design-probe.mjs and three lines in this file said 45 — one
  // population, two numbers — because `10: 1` was missing. No verdict moved, which is exactly why
  // it survived: the control beneath this one passed over a population one narrower than the one
  // it documents.
  const counts = OFF_SYSTEM_CENSUS.type.fontSize;
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 45, 'the census must sum to the figure every prose statement of it uses');
  const res = conform(counts, TOKENS.fontSize, EPS.px);
  assert.equal(res.offenders.length, 4, 'and all four sizes are off-system against 11 12 13 14 15 20');
  assert.deepEqual(res.offenders.map((o) => o.value).sort((a, b) => a - b), [10, 11.5, 12.5, 13.5]);

  // ── EXCLUSION WITH A REASON, AND A SKIP IS NOT A PASS ────────────────────────────────────────
  // The arm below re-derives the census from mission-control/client/src, which exists only in this
  // repository. Ported into a project with no such surface it threw ENOENT out of readdirSync,
  // which reads as a BROKEN TEST rather than as an absent subject — so it declines explicitly and
  // names what is missing instead.
  //
  // WHAT STILL RUNS ABOVE THIS LINE, EVERYWHERE: the fixture must sum to 45 and conform() must find
  // exactly the four off-system sizes. That arithmetic is portable and is the assertion that caught
  // the 44-vs-45 drift recorded above, so it is deliberately NOT inside the guard.
  //
  // Here the directory exists, the guard is false, and this test runs exactly as it always has. Do
  // not satisfy the guard by creating the directory: a fabricated fixture that makes a census test
  // pass is worse than a skip, because it re-derives a real number from invented source.
  const CENSUS_CORPUS = path.join(REPO_ROOT, 'mission-control', 'client', 'src');
  if (!fs.existsSync(CENSUS_CORPUS)) {
    t.skip(
      'the census re-derives from mission-control/client/src, which exists only in agentvibe; ' +
        'this repository has no such surface. The arithmetic arm above ran and passed.'
    );
    return;
  }

  // PROVENANCE, RE-DERIVED FROM THE CORPUS RATHER THAN REMEMBERED. This is the arm that makes the
  // header's "not a constructed one" a checkable claim: the counts are read out of
  // mission-control's source, which is where they were counted from — statically, not off a probe
  // run, so the p1-1 contamination (<title> at the UA 16px) never touched them. If the app's type
  // changes this goes red, and that is a change worth reading rather than a flake.
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
  const src = walk(CENSUS_CORPUS).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const all = src.match(/text-\[[0-9.]+px\]/g) ?? [];
  assert.ok(all.length > 50, `CONTROL: the corpus must have been read, found ${all.length} size utilities`);
  const usages = {};
  for (const u of all) {
    const v = u.slice(6, -3);
    usages[v] = (usages[v] ?? 0) + 1;
  }
  for (const [size, n] of Object.entries(counts)) {
    assert.equal(usages[size], n, `the census claims ${n} usages of ${size}px and the corpus has ${usages[size]}`);
  }
  const offSystem = Object.entries(usages)
    .filter(([v]) => !TOKENS.fontSize.values.includes(Number(v)))
    .reduce((a, [, n]) => a + n, 0);
  assert.equal(offSystem, 45, 'the corpus itself yields 45 off-system usages');

  // THE DENOMINATOR IS THE PART THAT DOES NOT RE-DERIVE, and it is recorded rather than corrected:
  // four places say "45 of 94" and this method counts 93 size utilities (96 with the three
  // `font-size:` declarations in styles.css). The numerator is exact; the total is off by one by
  // the only method that reproduces the numerator. Nobody's verdict depends on it.
  assert.equal(all.length, 93, 'if this moves, the "of 94" question is live again and must be re-settled, not re-typed');
});

test('NEGATIVE CONTROL: the census that used to exit 0 now fails the run', () => {
  // BEFORE this change, on exactly this input: 2 findings, both [p2] token-conformance, no p1,
  // ok:true, exit 0, state "MEASURED — passed" — 45 off-system usages and a passing verdict.
  const f = findingsFor('narrow', OFF_SYSTEM_CENSUS, { tokens: TOKENS, tokensPath: DEFAULT_TOKENS_PATH });
  assert.equal(f.length, 2, 'CONTROL: the finder must still produce exactly the two findings it always did');
  assert.equal(tokenFinding(f, 'font-size').offenders.length, 4, 'over the FOUR off-system sizes, not the three the fixture used to carry');
  assert.deepEqual(checks(f), ['token-conformance', 'token-conformance']);
  assert.equal(blocking(f).length, 2, 'a value that appears in no token must reach the verdict');
  assert.equal(isPass(f), false, 'the run must not pass');

  const a = buildArtifact({
    url: 'http://localhost:4317',
    tokens: { path: DEFAULT_TOKENS_PATH, loaded: true, reason: null, index: TOKENS },
    result: { ok: isPass(f), findings: f, measurements: { narrow: OFF_SYSTEM_CENSUS }, unchecked: [] },
  });
  assert.equal(a.exit, 1, 'the artifact a machine reads must carry a NON-ZERO exit');
  assert.equal(a.state, 'MEASURED — failed');
});

test('NEGATIVE CONTROL: the same census against the REAL shipped token file also fails', () => {
  // The fixture above is the deterministic pin; this arm is the provenance — it is the file the
  // reviewer reproduced against, loaded from disk. If the shipped ramp ever grows a 12.5px step
  // this goes red, and that is a change worth reading rather than a flake.
  const t = loadTokens(DEFAULT_TOKENS_PATH, { cwd: REPO_ROOT });
  assert.equal(t.loaded, true, `CONTROL: ${DEFAULT_TOKENS_PATH} must load, or this test proves nothing`);
  assert.equal(t.index.fontSize.present, true, 'CONTROL: the shipped file must declare font sizes');
  const f = findingsFor('narrow', OFF_SYSTEM_CENSUS, { tokens: t.index, tokensPath: t.path });
  assert.ok(blocking(f).length > 0, 'the shipped tokens must not authorise 12.5 / 11.5 / 13.5 / 1.625');
  assert.equal(isPass(f), false);
});

test('a conforming page still passes — the gate did not become "always fail"', () => {
  // The counterweight. Raising a severity is only a fix if the clean case is untouched: a gate
  // that blocks everything is as useless as one that blocks nothing, and cheaper to reach by
  // accident.
  //
  // `measurements` IS LOAD-BEARING AND WAS `{}` UNTIL 2026-08-29. This test asserted exit 0 over a
  // run that measured no viewport at all, so it pinned the p1 below rather than the pass above it.
  // Do not empty it again to shorten the line: CLEAN is what makes this a conforming PAGE rather
  // than a conforming absence of one.
  const f = findingsFor('narrow', CLEAN, { tokens: TOKENS_MOTION });
  assert.deepEqual(f, []);
  assert.equal(isPass(f), true);
  assert.equal(
    buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: isPass(f), findings: f, measurements: { narrow: CLEAN }, unchecked: [] } }).exit,
    0,
  );
});

test('blocking() is the ONE definition of what fails a run', () => {
  // It replaced three copies of `f.severity === 'p1'` — in probe(), in the CLI's closing line, and
  // in every caller. Two of them disagreeing is what the census test above documents.
  const mixed = [{ severity: 'p1', check: 'a' }, { severity: 'p2', check: 'b' }, { severity: 'p3', check: 'c' }];
  assert.deepEqual(blocking(mixed).map((f) => f.check), ['a']);
  assert.equal(isPass(mixed), false);
  assert.equal(isPass([{ severity: 'p2' }, { severity: 'p3' }]), true, 'a non-blocking finding must not fail a run');
  assert.equal(isPass([]), true);
  assert.equal(isPass(), true, 'no findings at all is a pass, not a crash');
});

test('an UNCLASSIFIED severity blocks — the predicate fails closed', () => {
  // It was `f.severity === 'p1'`, which fails OPEN on everything else: 'P1', 'p1 ', 'critical',
  // 'high', undefined and null all returned blocking 0 and isPass true. Nothing is miscounted
  // today because every finding this file constructs hardcodes 'p1' — but blocking() is exported
  // AS the definition of what fails a run, and `critical`/`high` are the blocking vocabulary of
  // .claude/review-lenses.yml, so the first finding to arrive from anywhere else bought a pass.
  for (const sev of ['critical', 'high', 'P1', 'p1 ', 'blocker', undefined, null, 0]) {
    assert.equal(blocking([{ severity: sev, check: 'x' }]).length, 1, `severity ${JSON.stringify(sev)} must block until somebody classifies it`);
    assert.equal(isPass([{ severity: sev, check: 'x' }]), false);
  }
  assert.equal(blocking([{}]).length, 1, 'a finding with no severity at all blocks');
  // CONTROL: the two that do not block still do not, or this becomes "everything blocks".
  assert.deepEqual(blocking([{ severity: 'p2' }, { severity: 'p3' }]), []);
  assert.equal(blocking([{ severity: 'p1' }]).length, 1);
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

test('a target failing on WIDTH ALONE is caught, and so is one failing on HEIGHT ALONE', () => {
  // `t.h < TARGET_AA || t.w < TARGET_AA` — both of MC_NARROW's failures are HEIGHT failures, so
  // deleting the width alternative yielded a byte-identical message and stayed green across the
  // whole suite. A 20x44 target would have been missed. THIS IS THE TWO-ALTERNATIVE-PREDICATE
  // CLASS, third instance in this repo: each alternative gets its own fixture, because widening
  // the regex on a fixture that exercises one side reaches the other side never.
  const sized = (targets) =>
    findingsFor('t', WITH(CLEAN, { targets: targets.map((t, i) => ({ label: `t${i}`, unreachable: false, ...t })) }), { tokens: TOKENS_MOTION })
      .find((x) => x.check === 'target-size-aa');

  const widthOnly = sized([{ w: 20, h: 44 }]);
  assert.ok(widthOnly, 'a 20x44 target fails SC 2.5.8 on width alone');
  assert.match(widthOnly.measured, /^1 of 1 below 24x24/);
  const heightOnly = sized([{ w: 44, h: 20 }]);
  assert.ok(heightOnly, 'a 44x20 target fails on height alone');
  assert.match(heightOnly.measured, /^1 of 1 below 24x24/);
  // The boundary, closed on the passing side: 24 IS the minimum, so exactly 24x24 conforms.
  assert.equal(sized([{ w: TARGET_AA, h: TARGET_AA }]), undefined, 'exactly 24x24 meets SC 2.5.8');
  assert.ok(sized([{ w: 23.9, h: 24 }]), 'and a hair under does not');
  assert.ok(sized([{ w: 24, h: 23.9 }]), 'on either dimension');
  // Both alternatives in one measurement, with the count inside the pattern.
  const mixed = sized([{ w: 20, h: 44 }, { w: 44, h: 20 }, { w: 44, h: 44 }]);
  assert.match(mixed.measured, /^2 of 3 below 24x24/);
});

test('the em and ms tolerances absorb rounding and nothing else', () => {
  // EPS.px and EPS.ratio were pinned by the 3dp/4dp test above; EPS.em and EPS.ms were pinned by
  // nothing. Measured: EPS.em 0.0005 -> 0.5 takes a page rendering 0.25em, -0.3em and 0.11em
  // against a token file declaring only 0 from three offenders to ZERO, still reporting
  // `checked: true` and exit 0 — every authored tracking value on the page silently authorised.
  const only0 = tokenIndex({ font: { letterSpacing: { 'ui-3': { $type: 'number', $value: 0 } } } });
  assert.deepEqual(only0.letterSpacing.values, [0], 'CONTROL: one token, and it is 0');
  const res = conform({ 0.25: 1, '-0.3': 1, 0.11: 1 }, only0.letterSpacing, EPS.em);
  assert.equal(res.checked, true);
  assert.equal(res.offenders.length, 3, 'three authored tracking values, none of them the one token');
  assert.deepEqual(conform({ 0.0004: 1 }, only0.letterSpacing, EPS.em).offenders, [], '4dp token rounding is still absorbed');
  assert.equal(conform({ 0.001: 1 }, only0.letterSpacing, EPS.em).offenders.length, 1, '0.001em is a decision, not rounding');
  // The same, in milliseconds, against the 120/200 duration tokens.
  assert.deepEqual(conform({ 200.4: 1 }, TOKENS_MOTION.duration, EPS.ms).offenders, [], 'sub-millisecond drift is not a motion decision');
  assert.equal(conform({ 201: 1 }, TOKENS_MOTION.duration, EPS.ms).offenders.length, 1, '201ms is a duration no token carries');
});

test('an empty rendered value is an offender, not the number zero', () => {
  // `raw === ''` in conform() reads as redundant beside the isFinite test and is not: Number('')
  // is 0, and the letterSpacing token `ui-3` IS 0 — so dropping it would read a value the browser
  // reported as empty as conforming to a real token. Deleting it survived the whole suite.
  const res = conform({ '': 3 }, TOKENS.letterSpacing, EPS.em);
  assert.equal(res.checked, true);
  assert.equal(res.offenders.length, 1, 'a value the browser reported as empty conforms to nothing');
  assert.equal(res.offenders[0].value, '');
  assert.equal(res.offenders[0].nearest, null, 'and there is no token to change it to');
  assert.equal(res.offenders[0].count, 3, 'the usage count still travels');
  // CONTROL: a real 0 IS the ui-3 token and must NOT be reported, or this test would pass by
  // reporting everything.
  assert.deepEqual(conform({ 0: 5 }, TOKENS.letterSpacing, EPS.em).offenders, []);
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
  const t = loadTokens('design/tokens/does-not-exist.json', { cwd: REPO_ROOT });
  assert.equal(t.loaded, false);
  assert.match(t.reason, /no token file at/);
  for (const g of Object.values(t.index)) assert.equal(g.present, false);
  const f = findingsFor('narrow', MC_NARROW, { tokens: t.index });
  assert.equal(tokenFinding(f, 'font-size'), undefined, 'no token file must produce no conformance finding');
  const u = uncheckedFor(t.index, { loaded: false, reason: t.reason, path: t.path });
  assert.match(u[0], /TOKEN CONFORMANCE DID NOT RUN AT ALL/);
});

test('a token file that is not readable JSON degrades to NOT CHECKED, never to conforming', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'broken.json'), '{ not json');
  const t = loadTokens('broken.json', { cwd: dir });
  assert.equal(t.loaded, false);
  assert.match(t.reason, /not readable JSON/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── AN UNUSABLE TOKEN FILE IS A REFUSAL — the other half of the gate defect ──────────────────────
//
// The two tests above pin that `loadTokens` degrades honestly. Neither asked what the RUN does
// with that, and the answer until 2026-08-29 was: zero findings, ok:true, exit 0, state
// "MEASURED — passed", with the reason visible only to a reader who scrolled to `unchecked[0]`.
// The existing refusal test covered the browser axis only, where `refused` is non-null.

test('probe() REFUSES a token file it cannot read, before it even looks for a browser', async () => {
  // Ordering matters and is asserted by construction: this machine may or may not have Chromium,
  // and the test must give the same answer either way. It does, because the token check runs first.
  await assert.rejects(
    () => probe('http://localhost:4317', { tokensPath: 'design/tokens/NOPE.json', cwd: REPO_ROOT }),
    (e) => {
      assert.equal(e.code, 'ENOTOKENS', 'the refusal must be identifiable, not a bare Error');
      assert.match(e.message, /no token file at/, 'the refusal must carry the reason');
      assert.equal(e.tokens.loaded, false, 'the token state must travel so the artifact can report it');
      return true;
    },
  );
});

test('probe() REFUSES an unparseable token file too, not only a missing one', async () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'tokens.json'), '{ not json');
  await assert.rejects(
    () => probe('http://localhost:4317', { tokensPath: 'tokens.json', cwd: dir }),
    (e) => e.code === 'ENOTOKENS' && /not readable JSON/.test(e.message),
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── INCOMPLETE — the state that stops "readable but governs nothing" reading as a pass ──────────
//
// The ENOTOKENS refusal above fires on `loaded === false`. A token file that is readable and
// declares nothing is `loaded: true`, so it does not refuse — and against the same census it
// produced 0 findings, isPass:true, exit 0, "MEASURED — passed". This file's own header
// PRESCRIBED that file as the way to run the WCAG axis alone. The verdict now reads coverage.

test('NEGATIVE CONTROL: an empty-but-readable token file is INCOMPLETE, never passed', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'tokens.json'), '{}');
  const t = loadTokens('tokens.json', { cwd: dir });
  assert.equal(t.loaded, true, 'CONTROL: it must LOAD, or this is the refusal case and proves nothing');

  const f = findingsFor('narrow', OFF_SYSTEM_CENSUS, { tokens: t.index, tokensPath: t.path });
  assert.equal(f.length, 0, 'CONTROL: an ungoverned axis still produces no findings — that is the trap');
  assert.equal(isPass(f), true, 'CONTROL: `ok` still means only "no blocking findings"');

  const a = buildArtifact({ url: 'u', tokens: t, result: { ok: isPass(f), findings: f, measurements: { narrow: OFF_SYSTEM_CENSUS }, unchecked: [] } });
  assert.equal(a.exit, 3, 'exit MUST NOT be 0 over 45 off-system usages nothing measured');
  assert.match(a.state, /INCOMPLETE/);
  assert.ok(!/passed/.test(a.state), 'the field a skimming reader acts on must not say passed');
  assert.equal(a.gaps.length, 5, 'all five axes are ungoverned by an empty token file');
  assert.deepEqual(a.gaps.map((g) => g.axis).sort(), [
    'token-conformance:duration', 'token-conformance:easing', 'token-conformance:fontSize',
    'token-conformance:letterSpacing', 'token-conformance:lineHeight',
  ]);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ── A PAGE THAT RENDERED NOTHING — THE FOURTH INSTANCE OF ONE CLASS ─────────────────────────────
//
// The three before it: a passing verdict while findings existed; an unreadable token file reading
// as a clean run; a readable-but-empty token file reading as passed. The third was cured by
// `coverageGaps()`, which asks whether the token group is DECLARED and never whether anything was
// OBSERVED — so with a token file declaring all five groups and a page that rendered nothing:
//
//     findings 0 · gaps 0 · exit 0 · state "MEASURED — passed"
//     artifact body: {"fontSize":{},"lineHeight":{},"letterSpacing":{}}
//
// The artifact stated in its own body that nothing was measured while the two fields a machine
// reads said passed. Reproduced with no browser on 2026-08-29; the fix extends the mechanism that
// exists rather than adding a fourth beside it.

// A viewport that RAN and observed nothing — the page loaded and rendered no measurable text.
const RENDERED_NOTHING = {
  overflow: 0, scrollWidth: 390, clientWidth: 390, reflow: false, targets: [],
  type: { fontSize: {}, lineHeight: {}, letterSpacing: {} },
  motion: { animationsApi: true, duration: {}, easing: {}, animations: [] },
  weights: {}, textColors: 0, contrastPairs: [],
};

test('NEGATIVE CONTROL: a page that rendered NOTHING is INCOMPLETE, never passed', () => {
  const full = { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION };
  const f = findingsFor('narrow', RENDERED_NOTHING, { tokens: TOKENS_MOTION });
  assert.deepEqual(f, [], 'CONTROL: nothing measured produces nothing to find — that is the trap');
  assert.equal(isPass(f), true, 'CONTROL: `ok` still means only "no blocking findings"');

  const a = buildArtifact({ url: 'u', tokens: full, result: { ok: isPass(f), findings: f, measurements: { narrow: RENDERED_NOTHING }, unchecked: [] } });
  assert.equal(a.exit, 3, 'exit MUST NOT be 0 when every axis the token file governs measured nothing');
  assert.match(a.state, /INCOMPLETE/);
  assert.ok(!/passed/.test(a.state), 'the field a skimming reader acts on must not say passed');
  assert.deepEqual(a.gaps.map((g) => g.axis).sort(), [
    'token-conformance:fontSize', 'token-conformance:letterSpacing', 'token-conformance:lineHeight',
  ], 'the three type axes are declared and unobserved');
  assert.ok(a.gaps.every((g) => /NO VIEWPORT RENDERED A SINGLE/.test(g.message)), 'the gap must say nothing was rendered, not that no token was declared');
  // The artifact's body and its verdict now say the same thing, which is the whole defect.
  assert.deepEqual(a.measurements.narrow.type, { fontSize: {}, lineHeight: {}, letterSpacing: {} });
});

test('NEGATIVE CONTROL: a run that measured NO VIEWPORT cannot pass either', () => {
  // `probe(url, { viewports: [] })` returns `measurements: {}`, and nothing anywhere asserted that
  // a single viewport was measured. It was exit 0, "MEASURED — passed", from a run that never
  // opened a browser.
  const full = { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION };
  const a = buildArtifact({ url: 'u', tokens: full, result: { ok: true, findings: [], measurements: {}, unchecked: [] } });
  assert.equal(a.exit, 3);
  assert.deepEqual(a.gaps.map((g) => g.axis), ['viewports'], 'named once, as the cause — not five times as its consequences');
  assert.match(a.gaps[0].message, /NO VIEWPORT WAS MEASURED/);
  // And it reaches the prose a human reads, through the same list — both by the route probe()
  // takes (uncheckedFor over the run's own measurements) and by buildArtifact's fallback, which
  // read `measurements: {}` regardless of the run until 2026-08-29 and so could describe a
  // different run from the one the gaps came from.
  assert.ok(uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'p', measurements: {} }).some((x) => /NO VIEWPORT WAS MEASURED/.test(x)));
  const derived = buildArtifact({ url: 'u', tokens: full, result: { ok: true, findings: [], measurements: {} } });
  assert.ok(derived.unchecked.some((x) => /NO VIEWPORT WAS MEASURED/.test(x)), 'the fallback must read the same measurements the gaps did');
  // THE OTHER DIRECTION, and it is the one that catches a fallback ignoring its argument: a run
  // that DID measure a page must not have prose saying no viewport was measured. Before the fix
  // the fallback always read `{}`, so exit 0 shipped beside a line claiming nothing ran.
  const real = buildArtifact({ url: 'u', tokens: full, result: { ok: true, findings: [], measurements: { narrow: CLEAN } } });
  assert.equal(real.exit, 0, 'CONTROL: this run measured a conforming page');
  assert.ok(!real.unchecked.some((x) => /NO VIEWPORT WAS MEASURED/.test(x)), 'the prose must describe the run the verdict came from');
  assert.equal(real.unchecked.length, UNCHECKED_ALWAYS.length, 'a fully covered run declares only the permanent holes');
  assert.equal(a.unchecked.length, 0, 'NOTED, not endorsed: `unchecked` is caller-supplied where `gaps` is derived, so a caller CAN omit the prose — it cannot omit the verdict');
});

test('`checked` means a comparison HAPPENED, which needs a standard AND a reading', () => {
  // The predicate underneath both gaps above. It used to report only whether the group was
  // present, so an empty reading came back `checked: true` with zero offenders — identical in
  // every field a caller reads to a page whose every value conforms.
  assert.equal(observed({}), false);
  assert.equal(observed(undefined), false);
  assert.equal(observed({ 14: 1 }), true);
  assert.deepEqual(conform({}, TOKENS.fontSize, EPS.px), { checked: false, offenders: [], usages: 0, distinct: 0 });
  assert.deepEqual(conformStrings({}, TOKENS_MOTION.easing), { checked: false, offenders: [], usages: 0, distinct: 0 });
  assert.equal(conform(undefined, TOKENS.fontSize).checked, false);
  // CONTROL: the same groups with a reading ARE checked, so `checked: false` is not "always false".
  assert.equal(conform({ 14: 1 }, TOKENS.fontSize).checked, true);
  assert.equal(conformStrings({ 'ease-out': 1 }, TOKENS_MOTION.easing).checked, true);
});

test('a MOTIONLESS page is not INCOMPLETE — an unclosable hole is still not a gap', () => {
  // The line `coverageGaps()` already draws, applied rather than widened: a gap is a hole THIS RUN
  // COULD HAVE CLOSED. A page with no running animation is an ordinary fully-rendered page, and
  // getAnimations() returns a transition only while it is mid-flight — no re-run closes that, so
  // it belongs to UNCHECKED_ALWAYS's class and not to the verdict. Making it a gap would put every
  // motionless page permanently at exit 3, and a verdict that is nearly constant carries nothing.
  const motionless = WITH(CLEAN, { motion: { animationsApi: true, duration: {}, easing: {}, animations: [] } });
  const gaps = coverageGaps({ tokens: TOKENS_MOTION, loaded: true, path: 'p', measurements: { narrow: motionless } });
  assert.deepEqual(gaps, [], 'declared motion tokens with nothing to compare is not a coverage hole');
  const f = findingsFor('narrow', motionless, { tokens: TOKENS_MOTION });
  const a = buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: isPass(f), findings: f, measurements: { narrow: motionless }, unchecked: [] } });
  assert.equal(a.exit, 0, 'a conforming page that simply does not animate still passes');
  // CONTROL: the SAME page with no TYPE reading is INCOMPLETE — so this is a per-axis decision
  // that `GROUPS.mustObserve` makes, not a blanket "empty readings are fine".
  const typeless = WITH(motionless, { type: { fontSize: {}, lineHeight: {}, letterSpacing: {} } });
  assert.equal(coverageGaps({ tokens: TOKENS_MOTION, loaded: true, path: 'p', measurements: { narrow: typeless } }).length, 3);
});

test('NEGATIVE CONTROL: the two p1s COMPOSE — a walk that filtered the page cannot read as a pass', () => {
  // Why they were fixed together. The render guard added to collect() is exactly the change that
  // could leave a page measuring nothing, and before this fix that outcome was exit 0. Run the
  // real collect() over a document in which the browser paints nothing at all.
  const m = runCollect(RENDERED_AND_NOT.slice(0, 6));
  assert.deepEqual(m.type.fontSize, {}, 'CONTROL: this document has nothing the walk keeps');
  const meas = { ...m, motion: resolveMotion(m.motion), reflow: false };
  const f = findingsFor('narrow', meas, { tokens: TOKENS_MOTION });
  assert.deepEqual(f, [], 'CONTROL: a page measured as empty produces no finding');
  const a = buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: isPass(f), findings: f, measurements: { narrow: meas }, unchecked: [] } });
  assert.equal(a.exit, 3, 'a filter that ate the page must not report a clean run');
  assert.match(a.state, /INCOMPLETE/);
});

test('only an EMPTY gap list reaches exit 0, and the precedence is refused > failed > incomplete', () => {
  const full = { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION };
  const partial = { path: 'p', loaded: true, reason: null, index: TOKENS }; // no duration/easing
  // Every `measurements` here was `{}` until 2026-08-29, when an unmeasured axis became a gap —
  // so the first assertion below was pinning exit 0 over a run that opened no page. A fixture that
  // rendered something is what makes "every axis covered" mean anything.
  const clean = { ok: true, findings: [], measurements: { narrow: CLEAN }, unchecked: [] };
  const failed = { ok: false, findings: findingsFor('narrow', MC_NARROW, { tokens: TOKENS }), measurements: { narrow: MC_NARROW }, unchecked: [] };

  assert.equal(buildArtifact({ url: 'u', tokens: full, result: clean }).exit, 0, 'every axis covered and nothing found');
  assert.equal(buildArtifact({ url: 'u', tokens: partial, result: clean }).exit, 3, 'two motion axes ungoverned');
  // A blocking finding outranks incompleteness — same partial tokens, so the gaps are still there.
  const f1 = buildArtifact({ url: 'u', tokens: partial, result: failed });
  assert.equal(f1.exit, 1, 'a finding to act on outranks partial coverage');
  assert.ok(f1.gaps.length > 0, 'and the gaps still travel in the artifact rather than being dropped');
  // A refusal outranks everything and carries no gaps: it measured nothing at all.
  const e = new Error('x'); e.code = 'ENOTOKENS';
  assert.equal(buildArtifact({ url: 'u', tokens: partial, result: null, refused: e }).exit, 2);
});

test('the VERDICT is derived by buildArtifact too — `ok` was the field nobody guarded', () => {
  // The guard was applied to one of the two caller-supplied fields and not the other. The test
  // below titles itself "so no caller can omit them into a pass", and its own object literal
  // passed `ok: true` — which was believed. Measured before this fix:
  //
  //   buildArtifact({ result: { ok: true, findings: [<a p1 reflow-1410>] } })
  //   -> exit 0 | state "MEASURED — passed" | findings 1 | blocking() 1 | isPass() false
  //
  // An artifact carrying a blocker and a passing verdict at once, with the blocker in plain view
  // in `findings`. No live verdict was ever wrong, because probe() computes `ok` from the same
  // findings — but this constructor is exported and this is the shape a caller reaches for.
  const full = { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION };
  const p1 = { severity: 'p1', check: 'reflow-1410', viewport: 'reflow-320', measured: '644px', standard: 'SC 1.4.10' };
  const a = buildArtifact({ url: 'u', tokens: full, result: { ok: true, findings: [p1], measurements: { narrow: CLEAN } } });
  assert.equal(a.exit, 1, 'a caller-supplied ok:true must not outrank a p1 in the same artifact');
  assert.equal(a.state, 'MEASURED — failed');
  assert.equal(a.findings.length, 1, 'CONTROL: the blocker is in the artifact where anyone could read it');
  // The other direction: `ok: false` with nothing to act on does not manufacture a failure either.
  // A run that could not measure says so with a REFUSAL, which is exit 2 and a different field.
  const b = buildArtifact({ url: 'u', tokens: full, result: { ok: false, findings: [], measurements: { narrow: CLEAN } } });
  assert.equal(b.exit, 0, 'the verdict reads the evidence, in both directions');
  // And a non-blocking finding still does not fail a run.
  const c = buildArtifact({ url: 'u', tokens: full, result: { ok: true, findings: [{ severity: 'p2', check: 'x' }], measurements: { narrow: CLEAN } } });
  assert.equal(c.exit, 0);
});

test('gaps are DERIVED by buildArtifact, so no caller can omit them into a pass', () => {
  // The defect this guards is the one that produced the whole finding: a verdict computed from a
  // field a caller supplies. Passing a bogus `gaps` must change nothing.
  const partial = { path: 'p', loaded: true, reason: null, index: TOKENS };
  const a = buildArtifact({ url: 'u', tokens: partial, result: { ok: true, findings: [], measurements: { narrow: CLEAN }, unchecked: [], gaps: [] } });
  assert.equal(a.exit, 3, 'a caller-supplied empty gaps list must not buy a pass');
  assert.equal(a.gaps.length, 2, 'duration and easing, derived from the token index');
});

test('an unclosable hole is NOT a gap — or the verdict would be a constant', () => {
  // UNCHECKED_ALWAYS is true of every run by construction: rAF animation is invisible to
  // getAnimations() and no configuration closes it. A verdict that reacted to those could never
  // reach 0, and a verdict that is always the same value carries no information. The line is
  // mechanical: a gap is a hole THIS RUN COULD HAVE CLOSED.
  const gaps = coverageGaps({ tokens: TOKENS_MOTION, loaded: true, path: 'p', measurements: { narrow: CLEAN } });
  assert.deepEqual(gaps, [], 'a fully-governed run over readable colours has no gaps');
  const u = uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'p', measurements: { narrow: CLEAN } });
  assert.equal(u.length, UNCHECKED_ALWAYS.length, 'the permanent holes are still declared');
  assert.ok(u.some((x) => /requestAnimationFrame/.test(x)), 'and still name rAF');
});

test('uncheckedFor RENDERS coverageGaps rather than re-deriving them', () => {
  // Two answers to "what did not run" — one feeding prose, one feeding the exit code — is how the
  // p2/p1 defect survived in this same file. Every gap message must appear verbatim in unchecked.
  const opts = { loaded: true, path: 'p', measurements: { narrow: { ...CLEAN, contrastPairs: [{ fg: 'color(srgb 0 0 0)', bg: 'rgb(255,255,255)', px: 14 }] } } };
  const gaps = coverageGaps({ ...opts, tokens: TOKENS });
  const u = uncheckedFor(TOKENS, opts);
  assert.ok(gaps.length >= 3, `CONTROL: this fixture must produce gaps, got ${gaps.length}`);
  for (const g of gaps) assert.ok(u.includes(g.message), `gap ${g.axis} is missing from unchecked`);
  assert.equal(u.length, gaps.length + UNCHECKED_ALWAYS.length, 'unchecked is exactly gaps + the permanent holes');
});

test('a dark undeclared canvas makes the run INCOMPLETE, not passed — the same seam, one axis down', () => {
  const raw = { ...CLEAN, contrastPairs: [{ fg: 'rgb(240, 240, 240)', bg: TRANSPARENT, px: 14, bold: false }], colorScheme: 'dark', prefersDark: true };
  const r = resolveContrast(raw);
  const m = { ...raw, contrastPairs: r.pairs, canvas: r.canvas };
  const f = findingsFor('narrow', m, { tokens: TOKENS_MOTION });
  assert.deepEqual(f, [], 'CONTROL: an unknown backdrop still produces no finding');
  const a = buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: isPass(f), findings: f, measurements: { narrow: m }, unchecked: [] } });
  assert.equal(a.exit, 3, 'zero contrast findings over zero readable pairs is not a pass');
  assert.deepEqual(a.gaps.map((g) => g.axis), ['text-contrast']);
});

test('a readable token file that declares NOTHING is not a refusal — the two are different facts', () => {
  // CONTROL, and the reason there is no `--no-tokens` flag. "I could not read the standard" and
  // "the standard governs nothing here" must not collapse into one state: the first is a refusal,
  // the second is a run whose unchecked list names every ungoverned group. Without this arm the
  // refusal above could be widened to `!tokens.index.fontSize.present` and nothing would object.
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'tokens.json'), '{}');
  const t = loadTokens('tokens.json', { cwd: dir });
  assert.equal(t.loaded, true, 'an empty but valid JSON document IS loaded');
  assert.equal(t.index.fontSize.present, false);
  const u = uncheckedFor(t.index, { loaded: true, path: 'tokens.json' });
  assert.ok(!u.some((x) => /DID NOT RUN AT ALL/.test(x)), 'a loaded file must not claim conformance never ran');
  assert.ok(u.some((x) => /font-size conformance/.test(x)), 'every ungoverned group must still be declared');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the CLI exits 2 on an unreadable token file, and writes that into the artifact', () => {
  // END TO END, through the real process, because `exit` is the field this defect was hiding in
  // and a pure-function assertion cannot prove a process exit code. Cheap: the refusal happens
  // before Chromium is resolved, so this never launches a browser and never touches the network.
  const dir = tmpDir();
  const out = path.join(dir, 'probe.json');
  const r = spawnSync(
    process.execPath,
    [path.join(SCRIPTS_DIR, 'design-probe.mjs'), 'http://127.0.0.1:1', '--tokens', 'design/tokens/NOPE.json', '--out', out],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  assert.equal(r.status, 2, `expected exit 2 (could not measure), got ${r.status}\n${r.stderr}`);
  assert.match(r.stderr, /design-probe REFUSED/);
  const a = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(a.exit, 2, 'the artifact must not say 0');
  assert.match(a.state, /REFUSED/, 'the artifact must not say "MEASURED — passed"');
  assert.equal(a.refused.code, 'ENOTOKENS');
  assert.deepEqual(a.findings, []);
  assert.equal(a.tokens.loaded, false);
  assert.match(a.unchecked[0], /TOKEN CONFORMANCE DID NOT RUN AT ALL/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadTokens reads the DTCG file the token builder actually emits', () => {
  const dir = tmpDir();
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

test('a passing run is exit 0 and says which of the four states produced it', () => {
  const a = buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: true, findings: [], measurements: { narrow: CLEAN }, unchecked: [] } });
  assert.equal(a.exit, 0);
  assert.equal(a.state, 'MEASURED — passed');
  // `schema` was asserted by NOWHERE until 2026-08-29: mutating it to 2 changed no test. It is the
  // field a reader keys on to know that `state` has four values and not three, so a silent
  // downgrade would tell them INCOMPLETE cannot happen.
  assert.equal(a.schema, 3, 'the artifact must declare the schema whose fourth state it can emit');
});

test('writeArtifact creates the directory and round-trips as JSON', () => {
  const dir = tmpDir();
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
  //
  // TIGHTENED 2026-08-29. This read `assert.ok(Math.abs(r - 3.139) < 0.02)` in a test whose name
  // claims to REPRODUCE a 3dp figure: +-0.02 is 20x the last digit it reproduces, so it passed at
  // 3.12 and at 3.15. `contrast()` rounds to 3dp as its stated contract, so the reproduction is
  // exact or it is not a reproduction — a tolerance here could only ever hide a real divergence.
  const r = contrast(parseRgb('rgb(90, 98, 112)'), parseRgb('rgb(13, 14, 17)'));
  assert.equal(r, 3.139, `styles.css documents 3.139:1, got ${r}`);
});

test('parseRgb handles rgb and rgba, and refuses what it cannot read', () => {
  assert.deepEqual(parseRgb('rgb(1, 2, 3)'), [1, 2, 3]);
  assert.deepEqual(parseRgb('rgba(1, 2, 3, 0.5)'), [1, 2, 3]);
  assert.equal(parseRgb('transparent'), null);
  assert.equal(parseRgb('#fff'), null);
});

// ── THE TRANSPARENT SENTINEL, WHICH WAS READ AS OPAQUE BLACK ─────────────────────────────────────
//
// `rgba(0, 0, 0, 0)` is how Chromium serialises "no background", and `parseRgb` returns [0,0,0]
// for it — black, the far end of the scale from the white canvas Chrome actually paints. Both
// directions of the resulting error were reproduced on 2026-08-29 and are pinned below.

test('NEGATIVE CONTROL: the sentinel is never read as a colour, in either direction', () => {
  // FALSE BLOCKER: ordinary #333 body text on an undeclared canvas was reported as 1.662:1.
  assert.equal(contrast(parseRgb('rgb(51, 51, 51)'), parseRgb(TRANSPARENT)), 1.662, 'the old, wrong figure');
  assert.equal(contrast([51, 51, 51], [255, 255, 255]), 12.635, 'the truth on the canvas Chrome paints');
  // MISSED BLOCKER: near-invisible #f0f0f0 text scored 18.427:1 against black and emitted nothing.
  assert.equal(contrast(parseRgb('rgb(240, 240, 240)'), parseRgb(TRANSPARENT)), 18.427, 'the old, wrong figure');
  assert.equal(contrast([240, 240, 240], [255, 255, 255]), 1.14, 'the truth — text you cannot read');
  // parseRgb still returns black for the sentinel; the guard is in pairColors, not in the parser,
  // because widening what the probe's parseRgb accepts is a separate, reviewed decision.
  assert.deepEqual(parseRgb(TRANSPARENT), [0, 0, 0]);
  assert.equal(pairColors({ fg: 'rgb(51, 51, 51)', bg: TRANSPARENT }), null, 'the sentinel is not a backdrop');
  assert.equal(pairColors({ fg: TRANSPARENT, bg: 'rgb(255, 255, 255)' }), null, 'invisible text is not measurable');
});

test('the sentinel constant and the literal inside collect() cannot drift apart', () => {
  // collect() is serialised into the page, so it CANNOT reference TRANSPARENT — it has to carry
  // the literal. That is two spellings of one value: change the constant alone and the walk keeps
  // emitting the old string, pairColors stops recognising it, and the sentinel flows through to
  // parseRgb as opaque black again — the exact defect this section fixes, restored silently.
  // Nothing else can see inside collect(), so this reads the source.
  const src = fs.readFileSync(path.join(SCRIPTS_DIR, 'design-probe.mjs'), 'utf8');
  const collectBody = src.slice(src.indexOf('function collect()'), src.indexOf('/* c8 ignore stop */'));
  assert.ok(collectBody.length > 100, 'CONTROL: collect() must have been found, or this test checks nothing');
  assert.ok(
    collectBody.includes(`'${TRANSPARENT}'`),
    `collect() no longer carries the literal '${TRANSPARENT}' that TRANSPARENT declares`,
  );
});

test('NEGATIVE CONTROL: #333 on an undeclared canvas is no longer a false blocker', () => {
  const raw = { ...CLEAN, contrastPairs: [{ fg: 'rgb(51, 51, 51)', bg: TRANSPARENT, px: 14, bold: false }], colorScheme: 'normal', prefersDark: false };
  const r = resolveContrast(raw);
  assert.equal(r.pairs[0].bg, 'rgb(255, 255, 255)');
  assert.equal(r.pairs[0].canvasBg, true, 'the substitution must be visible in the measurement');
  const f = findingsFor('t', { ...raw, contrastPairs: r.pairs }, { tokens: TOKENS_MOTION });
  assert.ok(!checks(f).includes('text-contrast'), '12.635:1 must not be reported as 1.662:1');
});

test('NEGATIVE CONTROL: #f0f0f0 on an undeclared canvas is now the blocker it always was', () => {
  const raw = { ...CLEAN, contrastPairs: [{ fg: 'rgb(240, 240, 240)', bg: TRANSPARENT, px: 14, bold: false }], colorScheme: 'normal', prefersDark: false };
  const f = findingsFor('t', { ...raw, contrastPairs: resolveContrast(raw).pairs }, { tokens: TOKENS_MOTION });
  const hit = p1s(f).find((x) => x.check === 'text-contrast');
  assert.ok(hit, 'near-invisible text must be reported, not silently skipped');
  assert.match(hit.measured, /1\.14:1/);
  assert.match(hit.note, /UA canvas default/, 'the finding must disclose that the backdrop was not declared');
});

test('a declared background is used as-is, and carries no canvas caveat', () => {
  // CONTROL: the substitution must reach only the pairs nothing declared.
  const raw = { ...CLEAN, contrastPairs: [{ fg: 'rgb(51, 51, 51)', bg: 'rgb(13, 14, 17)', px: 14, bold: false }], colorScheme: 'normal' };
  const r = resolveContrast(raw);
  assert.equal(r.pairs[0].bg, 'rgb(13, 14, 17)');
  assert.equal(r.pairs[0].canvasBg, false);
  const hit = findingsFor('t', { ...raw, contrastPairs: r.pairs }, { tokens: TOKENS_MOTION }).find((x) => x.check === 'text-contrast');
  assert.ok(hit, 'CONTROL: 1.3:1 must still be a finding');
  assert.equal(hit.note, undefined, 'a declared backdrop must not carry the canvas caveat');
});

// ── p1: A TRANSLUCENT COLOUR WAS MEASURED AS OPAQUE, AND A REAL WCAG FAILURE PASSED SILENTLY ────
//
// `parseRgb` drops the fourth component by an explicit, recorded decision — design-lib.mjs says so
// and ends "callers that need it must composite first". This is that caller, and it did neither:
// the pair was measured against a colour that is not on the screen, and the result was not a wrong
// finding but NO finding, with nothing in `gaps` and nothing in `unchecked` either. That breaks
// this file's own invariant, the one the other two p1s are about.

test('NEGATIVE CONTROL: a 3% black scrim is not a colour, and the pair over it is NOT CHECKED', () => {
  const scrim = { fg: 'rgb(238, 238, 238)', bg: 'rgba(0, 0, 0, 0.03)', px: 14, bold: false };
  // The measurement the probe used to make, kept as the thing that must not happen again.
  assert.equal(contrast(parseRgb('rgb(238, 238, 238)'), parseRgb('rgba(0, 0, 0, 0.03)')), 18.1, 'the old, wrong figure — read as opaque black');
  // The truth: 3% black over white composites to rgb(247,247,247), and #eee on that is 1.083:1
  // against a 4.5 floor. So the old reading was not merely imprecise, it was inverted.
  assert.equal(contrast([238, 238, 238], [247, 247, 247]), 1.083, 'the composited truth — a real AA failure');
  assert.equal(pairColors(scrim), null, 'a translucent backdrop is not measurable without compositing');
  const m = { ...CLEAN, contrastPairs: [scrim] };
  assert.deepEqual(findingsFor('t', m, { tokens: TOKENS_MOTION }), [], 'CONTROL: it still produces no finding — that is the trap');
  // …and now it is a HOLE rather than silence: the run cannot reach exit 0.
  const a = buildArtifact({ url: 'u', tokens: { path: 'p', loaded: true, reason: null, index: TOKENS_MOTION }, result: { ok: true, findings: [], measurements: { narrow: m }, unchecked: [] } });
  assert.equal(a.exit, 3, 'zero findings over an unmeasurable pair is not a pass');
  assert.deepEqual(a.gaps.map((g) => g.axis), ['text-contrast']);
  assert.match(a.gaps[0].message, /1 translucent colour\(s\) \(alpha < 1\)/, 'the cause must be named, not filed under "unreadable"');
  assert.match(a.gaps[0].message, /NOT read as opaque/);
});

test('the foreground direction is the same defect, and is refused too', () => {
  // `color: rgba(0, 0, 0, 0.05)` over white read as 21:1 — the maximum possible ratio, on text
  // that is very nearly invisible.
  assert.equal(contrast(parseRgb('rgba(0, 0, 0, 0.05)'), [255, 255, 255]), 21, 'the old, wrong figure');
  assert.equal(pairColors({ fg: 'rgba(0, 0, 0, 0.05)', bg: 'rgb(255, 255, 255)' }), null);
});

test('alphaOf reads the component count, not the function name', () => {
  assert.equal(alphaOf('rgb(1, 2, 3)'), 1, 'three components is opaque');
  assert.equal(alphaOf('rgba(1, 2, 3, 1)'), 1, 'an explicit alpha of 1 is opaque');
  assert.equal(alphaOf('rgba(1, 2, 3, 0.5)'), 0.5);
  // CSS Color 4 permits alpha on rgb(), Chromium emits it, and parseRgb accepts that form and
  // drops it — so a check on the function name would have missed exactly the dangerous case.
  assert.equal(alphaOf('rgb(0, 0, 0, 0.03)'), 0.03);
  assert.deepEqual(parseRgb('rgb(0, 0, 0, 0.03)'), [0, 0, 0], 'CONTROL: parseRgb still reads it as a triple');
  assert.equal(pairColors({ fg: 'rgb(255,255,255)', bg: 'rgb(0, 0, 0, 0.03)' }), null, 'and pairColors still refuses it');
  // Unreadable alpha fails CLOSED, and so does anything that is not comma-separated rgb.
  assert.equal(alphaOf('rgba(0, 0, 0, var(--a))'), null);
  assert.equal(alphaOf('color(srgb 0 0 0)'), null);
  assert.equal(alphaOf('#fff'), null);
  assert.equal(alphaOf(null), null);
  assert.equal(alphaOf(TRANSPARENT), 0, 'the sentinel is simply an alpha of zero');
});

test('NEGATIVE CONTROL: a non-sentinel transparent backdrop is not opaque white paint', () => {
  // The walk halted on `bg === 'rgba(0, 0, 0, 0)'` — the exact string — so rgba(255,255,255,0)
  // stopped it and was measured as white. Widening the sentinel list would have been the wrong
  // fix: alpha is the property, not the spelling.
  assert.equal(pairColors({ fg: 'rgb(120, 120, 120)', bg: 'rgba(255, 255, 255, 0)' }), null);
  // And collect() now walks PAST it to the ancestor that actually paints.
  const m = runCollect([{ css: { fontSize: '14px', color: 'rgb(120, 120, 120)' }, ancestors: [{ backgroundColor: 'rgba(255, 255, 255, 0)' }, { backgroundColor: 'rgb(13, 14, 17)' }] }]);
  assert.equal(m.contrastPairs.length, 1);
  assert.equal(m.contrastPairs[0].bg, 'rgb(13, 14, 17)', 'the first backdrop that is not fully transparent is the backdrop');
  // CONTROL: a PARTIALLY transparent ancestor stops the walk and travels as itself, because
  // compositing it needs every layer beneath and collect() returns one.
  const partial = runCollect([{ css: { fontSize: '14px' }, ancestors: [{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }, { backgroundColor: 'rgb(255, 255, 255)' }] }]);
  assert.equal(partial.contrastPairs[0].bg, 'rgba(0, 0, 0, 0.03)');
  assert.equal(pairColors(partial.contrastPairs[0]), null, 'and node refuses to measure it');
});

test('NEGATIVE CONTROL: an INVISIBLE failing pair must not consume the one finding slot', () => {
  // THE OTHER HALF OF THE VISIBILITY DEFECT, and it is a FALSE NEGATIVE rather than a false
  // blocker. findingsFor() emits one representative contrast finding per viewport and breaks;
  // pairs arrive in document order; so an unpainted element earlier in the document took the slot
  // and the real failure after it appeared in NO finding. Measured in Chromium: a display:none
  // element at 1.044:1 preceding a VISIBLE element at 1.92:1 produced five findings, all five
  // reading 1.044:1.
  //
  // The cure is the walk, not the message: only a fix that stops COLLECTING the invisible pair
  // moves this, which is why the assertion runs the real collect().
  const m = runCollect([
    { text: 'invisible', css: { fontSize: '14px', color: 'rgb(250, 250, 250)', display: 'none' }, rect: { width: 0, height: 0 }, ancestors: [{ backgroundColor: 'rgb(255, 255, 255)' }] },
    { text: 'visible and failing', css: { fontSize: '14px', color: 'rgb(187, 187, 187)' }, ancestors: [{ backgroundColor: 'rgb(255, 255, 255)' }] },
  ]);
  assert.equal(m.contrastPairs.length, 1, 'the unpainted pair is not collected at all');
  const hit = findingsFor('t', { ...m, motion: resolveMotion(m.motion), reflow: false }, { tokens: TOKENS_MOTION }).find((x) => x.check === 'text-contrast');
  assert.ok(hit, 'the visible failure must be reported');
  assert.match(hit.measured, /^1\.92:1 at 14px/, 'and it must be THE VISIBLE ONE — 1.044:1 is the pair that used to take the slot');
});

test('the canvas is white in light mode, and NOT GUESSED in dark mode', () => {
  assert.equal(canvasBackground({}).color, 'rgb(255, 255, 255)', 'no color-scheme at all is light');
  assert.equal(canvasBackground({ colorScheme: 'normal', prefersDark: true }).color, 'rgb(255, 255, 255)',
    'a preference the page does not opt into does not change what the UA paints');
  assert.equal(canvasBackground({ colorScheme: 'light', prefersDark: true }).color, 'rgb(255, 255, 255)');
  // `dark` alone forces dark whatever the user prefers; `light dark` follows the preference.
  assert.equal(canvasBackground({ colorScheme: 'dark', prefersDark: false }).usedDark, true);
  assert.equal(canvasBackground({ colorScheme: 'light dark', prefersDark: true }).usedDark, true);
  assert.equal(canvasBackground({ colorScheme: 'light dark', prefersDark: false }).usedDark, false);
  // And the dark canvas colour is NULL, not a number nobody measured. Chromium's dark canvas is
  // not rgb(0,0,0), and inventing it here would rebuild the same defect facing the other way.
  assert.equal(canvasBackground({ colorScheme: 'dark' }).color, null);
});

test('a dark undeclared canvas is NOT CHECKED, and says so with a count', () => {
  const raw = { ...CLEAN, contrastPairs: [{ fg: 'rgb(240, 240, 240)', bg: TRANSPARENT, px: 14, bold: false }], colorScheme: 'dark', prefersDark: true };
  const r = resolveContrast(raw);
  assert.equal(r.pairs[0].bg, null);
  const m = { ...raw, contrastPairs: r.pairs, canvas: r.canvas };
  assert.deepEqual(findingsFor('narrow', m, { tokens: TOKENS_MOTION }), [], 'an unknown backdrop produces no finding');
  const u = uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'p', measurements: { narrow: m } });
  assert.ok(u.some((x) => /1 text\/background pair\(s\) were NOT measured/.test(x)), 'the skip must be counted');
  assert.ok(u.some((x) => /dark used colour scheme/.test(x)), 'the reason must name the dark canvas');
  assert.ok(u.some((x) => /not the same as passing/.test(x)));
});

test('a colour parseRgb cannot read is counted as unchecked, not silently dropped', () => {
  // The hole this closes widens on its own: Chromium emits more CSS Color 4 serialization over
  // time and design-probe's parseRgb refuses all of it, by a documented decision. An instrument
  // whose coverage shrinks silently is the failure this whole file was written against.
  const m = {
    ...CLEAN,
    contrastPairs: [
      { fg: 'rgb(20 20 20)', bg: 'rgb(255, 255, 255)', px: 14, bold: false },
      { fg: 'color(srgb 0 0 0)', bg: 'rgb(255, 255, 255)', px: 14, bold: false },
      { fg: 'rgb(20, 20, 20)', bg: 'rgb(255, 255, 255)', px: 14, bold: false },
    ],
  };
  assert.equal(pairColors(m.contrastPairs[0]), null, 'CONTROL: space-separated rgb is refused by this parseRgb');
  assert.ok(pairColors(m.contrastPairs[2]), 'CONTROL: the readable pair must still be readable');
  const u = uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'p', measurements: { narrow: m } });
  const hit = u.find((x) => /were NOT measured/.test(x));
  assert.ok(hit, 'two unreadable pairs must be declared');
  assert.match(hit, /2 text\/background pair\(s\)/);
  assert.match(hit, /narrow: 2 of 3/, 'the count must name the viewport and the denominator');
  assert.ok(!/dark used colour scheme/.test(hit), 'a light page must not blame the colour scheme');
});

test('a page whose every pair is readable declares NO contrast hole', () => {
  // CONTROL: the entry above must be conditional, or it becomes noise every reader learns to skip.
  const u = uncheckedFor(TOKENS_MOTION, { loaded: true, path: 'p', measurements: { narrow: CLEAN } });
  assert.ok(!u.some((x) => /were NOT measured/.test(x)));
});

/** The text-contrast finding for one pair, or undefined. */
const contrastHit = (pair) =>
  findingsFor('t', { ...CLEAN, contrastPairs: [pair] }, { tokens: TOKENS_MOTION }).find((x) => x.check === 'text-contrast');

// GREY-120 on white is 4.415:1 — above the 3.0 large-text floor and below the 4.5 small-text one,
// so this single colour separates every arm of the large-text predicate.
const DIM = { fg: 'rgb(120, 120, 120)', bg: 'rgb(255, 255, 255)' };

test('contrast findings use the large-text floor only where the spec allows it', () => {
  // THE MESSAGE HERE SAID "2.85:1 at 14px" AND THE FIXTURE MEASURES 4.415:1 — corrected 2026-08-29.
  // A wrong number in an assertion message is what a reader reaches for when the test goes red,
  // and 2.85 would have sent them looking for a defect in `contrast()`.
  assert.equal(contrast([120, 120, 120], [255, 255, 255]), 4.415, 'CONTROL: the fixture sits between the two floors');
  assert.ok(contrastHit({ ...DIM, px: 14, bold: false }), '4.415:1 at 14px must fail the 4.5 floor');
  assert.equal(contrastHit({ ...DIM, px: 24, bold: false }), undefined, 'the same colour at 24px passes the 3.0 floor');
});

test('the large-text predicate needs BOTH the size and the weight the spec names', () => {
  // `p.px >= 24 || (p.bold && p.px >= 18.66)` HAD ZERO COVERAGE IN ANY DIRECTION until 2026-08-29:
  // no fixture anywhere set `bold: true`, and the one test naming this behaviour used
  // `bold: false` on both arms. Three mutations survived the whole suite — 18.66 -> 14, deleting
  // the `(p.bold && …)` clause, and deleting the `p.bold` conjunct alone. The first of those
  // applies the 3.0 floor to 14px bold text: a real AA failure reported as a pass, every check
  // green. 18.66px is 14pt, which is the size the spec states for bold large text.
  assert.equal(contrastHit({ ...DIM, px: 18.66, bold: true }), undefined, '14pt bold IS large text — the 3.0 floor applies');
  assert.ok(contrastHit({ ...DIM, px: 18.65, bold: true }), 'a hair under 14pt is not large, whatever its weight');
  assert.ok(contrastHit({ ...DIM, px: 20, bold: false }), '20px REGULAR is not large — the weight is half the rule');
  assert.ok(contrastHit({ ...DIM, px: 14, bold: true }), 'bold does not make 14px large — the size is the other half');
  assert.equal(contrastHit({ ...DIM, px: 24, bold: false }), undefined, '24px is large at any weight');
  assert.ok(contrastHit({ ...DIM, px: 23.9, bold: false }), 'and 23.9px is not — both boundaries are closed on the passing side');
});

test('the large-text floor is 3.0, and the finding states the floor it used', () => {
  // `const floor = large ? 3.0 : 4.5` -> 2.5 survived the whole suite. The 4.5 arm WAS pinned, by
  // a 4.415:1 fixture sitting 0.085 below it — but nothing sat between 2.5 and 3.0, so the large
  // arm's value was free. Grey-153 on white is 2.849:1: a real AA failure for large text, and a
  // pass under any lowered floor.
  assert.equal(contrast([153, 153, 153], [255, 255, 255]), 2.849, 'CONTROL: below 3.0 and above 2.5');
  const hit = contrastHit({ fg: 'rgb(153, 153, 153)', bg: 'rgb(255, 255, 255)', px: 24, bold: false });
  assert.ok(hit, '2.849:1 must fail the 3.0 floor even at 24px');
  assert.match(hit.measured, /^2\.849:1 at 24px/);
  assert.match(hit.standard, /— 3:1$/, 'the finding must name the floor it actually applied');
  // CONTROL on the other side: 3.033:1 clears 3.0, so the floor is not silently higher either.
  assert.equal(contrast([148, 148, 148], [255, 255, 255]), 3.033);
  assert.equal(contrastHit({ fg: 'rgb(148, 148, 148)', bg: 'rgb(255, 255, 255)', px: 24, bold: false }), undefined);
  // And the small-text floor is still 4.5 and still says so.
  assert.match(contrastHit({ ...DIM, px: 14, bold: false }).standard, /— 4\.5:1$/);
});

// ── ordering and refusal ────────────────────────────────────────────────────────────────────────

test('findings are ranked p1 first, so a caller reading the head cannot miss a blocker', () => {
  // THE FIXTURE ARM OF THIS TEST WAS REMOVED 2026-08-29 AND THIS RECORDS WHY, because deleting a
  // control quietly is exactly what it was guarding against. It read:
  //
  //     const f = findingsFor('narrow', MC_NARROW, { tokens: TOKENS_MOTION });
  //     const firstNonP1 = f.findIndex((x) => x.severity !== 'p1');
  //     assert.notEqual(firstNonP1, -1, 'CONTROL: this fixture must produce a non-p1 …');
  //
  // and it went red the moment conformance findings became p1: every check the probe emits is now
  // p1, so NO fixture can satisfy that control. Pinning the ordering to a fixture made ordering
  // depend on the severity policy, which is the coupling that broke it.
  //
  // It is NOT replaced by `assert.ok(f.every(p1))`. That would pin "every finding is p1" — a rule
  // design-probe.mjs's header says it expects to stop being true the day a non-blocking check
  // (SC 2.5.5's 44px AAA target) lands, and a test that pins a rule the source is planning to
  // retire is the MIN_STEP_RATIO harm again. Ordering is asserted where ordering lives:
  const mixed = [{ severity: 'p3', check: 'c' }, { severity: 'p1', check: 'a' }, { severity: 'p2', check: 'b' }];
  assert.deepEqual(rank(mixed).map((x) => x.check), ['a', 'b', 'c'], 'p1 must sort to the head');
  assert.deepEqual(rank([{ severity: 'p2' }, { severity: 'p2' }]).length, 2, 'a single class must survive ranking');
  // An unknown severity sorts last rather than crashing or sorting first — a finding nobody
  // classified must never displace a blocker at the head.
  assert.deepEqual(rank([{ severity: 'wat' }, { severity: 'p1' }]).map((x) => x.severity), ['p1', 'wat']);
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
