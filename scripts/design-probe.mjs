#!/usr/bin/env node
// scripts/design-probe.mjs — the design measurement instrument.
//
// WHY THIS EXISTS. On 2026-08-28 this repo's one substantial design output shipped with 574px of
// horizontal overflow at 390px and 57 of 64 interactive elements below the WCAG 2.2 AA target size.
// Neither defect was missed by a careless reviewer. Both were STRUCTURALLY INVISIBLE:
//
//   · the `design` lens says "check the small-screen rendering" — and `lenses.test.mjs` has 20 tests,
//     every one validating file SHAPE. Nothing checks that a procedure was ever performed. The step
//     was lint-clean, non-vague, provenance-verified, and enforced by nothing.
//   · the `craft` lens reports only "a measured difference from a stated rule", and no rule mentioned
//     width. The critic did not miss the overflow. It could not form the sentence.
//   · the perception loop had never worked at all — the armed sandbox SIGTRAPs Chromium, so both
//     designer runs fell back to source-only and said so honestly.
//
// So this is not another lens. A rule can be violated; a measurement either ran or it did not.
// Every check below is DETERMINISTIC — computed styles, geometry, and the Web Animations API, read
// out of a real browser. There is no model judgement anywhere in the measurement path, by design: an
// agent grading its own design grades against a rubric that demonstrably does not match a professional
// designer panel (TASTE, arXiv 2605.20731).
//
// WHAT "CONFORMANCE" MEANS HERE, precisely, because the first version of this file got it wrong.
// The probe holds NO VIEW about what a good ramp, a good line-height or a good easing curve is. It
// checks ONE thing about type, spacing and motion: **every rendered value appears in the token file**.
// That question cannot be wrong about taste, because it has no opinion about taste. The token file is
// where taste lives, it is reviewed as a design artifact, and it is somebody's decision — not this
// script's. Accessibility floors (contrast, target size, reflow) are the exception and are cited to
// WCAG rather than to the token file, because they are law-shaped, not taste-shaped.
//
// ── THE RULE THAT WAS DELETED, AND WHY IT IS RECORDED RATHER THAN QUIETLY REMOVED ────────────────
//
// REMOVED 2026-08-29: `MIN_STEP_RATIO = 1.125`, the `scaleGaps()` adjacent-ratio analysis, and the
// `type-scale-near-duplicates` finding built on them. The rule said "adjacent steps in a type scale
// must differ by at least 1.125x". It was invented here, and the research then falsified it:
// linear.app, stripe.com and vercel.com — the most-imitated type in developer SaaS — all violate it.
//
// The deeper error is arithmetic, not taste. A UI band built on a constant INTEGER increment has
// ratio = 1 + d/s, which DECREASES monotonically as s grows: 11→12 is 1.091, 12→13 is 1.083,
// 14→15 is 1.071. Adjacent ratios that shrink across a band are the signature of exactly the
// disciplined construction the rule was written to reward, and a flat ratio floor condemns it. So
// the rule was not merely mis-tuned — a different threshold would not have saved it — it was the
// wrong MODEL. `scripts/design-probe.test.mjs` asserted the 1.125 boundary in both directions, which
// made a falsified rule harder to remove rather than easier: a test that pins a false rule is worse
// than no test, and that test is deleted with it.
//
// Nothing replaces its OPINION. `token-conformance` replaces its JOB.
//
// WHAT IT DELIBERATELY DOES NOT DO, stated so the gap is visible rather than assumed covered — see
// UNCHECKED below, which is emitted on stdout AND into the JSON artifact so a reviewer who cannot
// run a browser cannot mistake silence for coverage.
//
// ── SANDBOX, AND WHY THIS SCRIPT IS IN NO AUTOMATED LANE ────────────────────────────────────────
//
// NOT A SUITE STEP, BECAUSE IT NEEDS TWO THINGS THE SUITE CANNOT GIVE IT: a running dev server to
// point at, and an escalated sandbox. Chromium is SIGTRAP-killed under the armed sandbox — measured
// 2026-08-28 and again 2026-08-29, binary present and requireable, launch fails; with the sandbox
// disabled the same command captures every viewport. That is a containment fact, not a verdict on
// the check, and it is the same shape as `check:mc`.
//
// IT IS NOT SILENTLY SKIPPED, and that is the whole design. Three exit states, kept distinct:
//     2 = could not measure (REFUSED)   1 = measured and failed   0 = measured and passed
// so a probe that cannot see refuses rather than reporting a clean run over zero pages. `--out`
// writes that refusal INTO the JSON artifact, so a reviewer reading only the file cannot mistake an
// empty findings list for a pass. Both states are verified: sandboxed it exits 2 with the SIGTRAP
// explanation; escalated against a real page it exits 1 with findings across five viewports.
//
// WHERE THE COVERAGE IS — AND IT IS PARTIAL, SAY SO. Nothing runs this script itself, anywhere.
// What runs is `scripts/design-probe.test.mjs`, which replays the real measured numbers through the
// same finding-construction code, so the conformance arithmetic, the reflow and motion checks and
// the negative controls are exercised wherever `test:probe-readonly` runs — it is a STEP, and the
// test file sits in its argv. What no test can cover is whether a browser launches at all — exactly
// the failure that produced two source-only designer runs on 2026-08-17.
//
// NOTHING SCHEDULES THIS SCRIPT'S RETURN as an automated step. It returns when the design layer has
// a defined escalation lane, which is an open founder decision, not a code change.
//
// ── HOW THE TESTS ARE WIRED, AND THE TRAP THAT DECIDED IT ────────────────────────────────────────
//
// There is deliberately NO `test:design-probe` script, and no entry for this file in
// `scripts/lib/check-suite.js`. The suite's `GOVERNED` predicate is
// `/^(?:check|test|lint|verify|audit):/`: a script named `test:design-probe` is governed and would
// then REQUIRE either a STEPS entry — which requires a counterpart step in the CI workflow, an
// `irreversible`-tier edit — or an EXCLUDED entry justifying zero coverage. `design-probe` does not
// match the predicate and so needs neither, and never did.
//
// THE TRAP IS THAT THE NAMING CONVENTION AND THE TIER SYSTEM POINT OPPOSITE WAYS, with no warning at
// the point of naming: every peer test in this repo is called `test:<thing>`, so reaching for that
// name is the obvious move, and it silently prices the change at founder sign-off. Two independent
// builders hit it on 2026-08-29, this one and the token builder, which is why it is written down
// here rather than remembered. The cure is the landed precedent b1ab4ce: append the test FILE to an
// existing step's argv. `STEPS.length` stays 48, no workflow file is touched, and the assertions
// actually run — where an EXCLUDED entry would have bought a written explanation for zero coverage.
//
// That trade gives up one guarded position: `test:check-suite` pins STEPS against script NAMES, not
// against their argv, so deleting a filename from a shared command line removes its tests with every
// check still green. `scripts/check-suite.test.mjs` asserts that `test:probe-readonly`'s argv still
// names both of its files, which buys the position back.

// `createRequire` was here only so `resolvePlaywright` could `require()` a CJS entry point. That
// function moved to `./design-lib.mjs`, which carries its own, so the shim is dead here.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ── WCAG 2.2, cited rather than asserted ────────────────────────────────────────────────────────
// SC 2.5.8 Target Size (Minimum) — level AA  — 24x24 CSS px
// SC 2.5.5 Target Size (Enhanced) — level AAA — 44x44 CSS px
// The 44px figure is widely misquoted as "the minimum"; it is AAA (and the Apple HIG figure).
// This repo made that error on 2026-08-28 and it is pinned here so it is not made again.
export const TARGET_AA = 24;
export const TARGET_AAA = 44;

// SC 1.4.10 Reflow — level AA. Vertically-scrolling content must present without two-dimensional
// scrolling at a width equivalent to 320 CSS px. The spec states that equivalence itself: 320 CSS px
// is 1280 device px at 400% zoom, which is why the two viewports below differ only in scale factor.
export const REFLOW_WIDTH = 320;
export const REFLOW_HEIGHT = 256;

// Tolerances for "this rendered value IS that token". Sub-pixel layout and 3-4dp token rounding both
// produce differences that are not decisions. Wide enough to absorb those, narrow enough that 11.5px
// is never mistaken for 11px or 12px.
export const EPS = { px: 0.01, ratio: 0.005, em: 0.0005, ms: 0.5 };

export const DEFAULT_VIEWPORTS = [
  { w: REFLOW_WIDTH, h: REFLOW_HEIGHT, tag: 'reflow-320', reflow: true },
  // The same 320 CSS px of layout at a 4x scale factor — which IS 1280 device px at 400% browser
  // zoom. It is a separate measurement, not a restatement: resolution media queries, image
  // selection and any layout keyed on devicePixelRatio can differ between the two.
  { w: REFLOW_WIDTH, h: REFLOW_HEIGHT, tag: 'reflow-zoom400', reflow: true, dsf: 4 },
  { w: 390, h: 844, tag: 'narrow' },
  { w: 768, h: 1024, tag: 'mid' },
  { w: 1440, h: 900, tag: 'wide' },
];

/** The token file this probe measures conformance against, relative to the repo root. */
export const DEFAULT_TOKENS_PATH = 'design/tokens/tokens.json';

// Holes that exist whatever the page contains. Declared, not assumed covered.
export const UNCHECKED_ALWAYS = [
  'state coverage (empty / loading / error) — needs app-specific drivers',
  'requestAnimationFrame-driven animation — INVISIBLE to document.getAnimations(), and a hand-rolled rAF loop is the animation most likely to be badly tuned. The motion check below cannot see it at all',
  'CSS transitions that are not mid-flight — getAnimations() returns a transition only while it runs, so a static capture sees the animations and misses most transitions',
  'composition, hierarchy and typographic quality — not measurable, and pretending otherwise is the failure mode this file exists to end',
  'the SC 1.4.10 exception for content that genuinely requires two-dimensional layout — this probe cannot tell a data table from a broken layout',
  'the SC 2.5.8 spacing exception — not evaluated, so target-size findings are candidates, not verdicts',
];

// ── SHARED ARITHMETIC, NOW IMPORTED RATHER THAN COPIED ──────────────────────────────────────────
// `resolvePlaywright`, `luminance` and `contrast` were defined here and duplicated verbatim in
// `build-tokens.mjs` and `extract-reference.mjs`, each author naming the duplication because the
// other files were untracked when they wrote. All three copies of `contrast` were measured against
// each other on 2026-08-29 across ten mission-control colour pairs and agreed to the last digit;
// they collapse into `./design-lib.mjs` with no number moving. Re-exported because
// `design-probe.test.mjs` imports `contrast` and `resolvePlaywright` from this file by name.
import { contrast, luminance, resolvePlaywright } from './design-lib.mjs';

export { contrast, luminance, resolvePlaywright };

/**
 * `parseRgb` IS DELIBERATELY NOT SHARED, and this is the one exception in the collapse.
 *
 * `extract-reference.mjs` carried a copy of this whose comment claimed byte-equivalence with this
 * one. It was not equivalent. Measured 2026-08-29, that copy splits on `[,\s/]+` and NaN-checks
 * only the first three components, so it returns a triple on three shapes where this one returns
 * null:
 *
 *   `rgb(0 0 0)`               → null here · [0,0,0]   there
 *   `rgb(11 12 14 / 0.5)`      → null here · [11,12,14] there
 *   `rgba(0, 0, 0, var(--a))`  → null here · [0,0,0]   there
 *
 * The divergence is one-directional: wherever this returns a triple, that copy returns the SAME
 * triple. So the permissive one is a strict superset, and adopting it would only ever turn a null
 * into a value.
 *
 * IT IS STILL NOT A FREE CHANGE, WHICH IS WHY IT WAS NOT MADE HERE. A null from this function means
 * a colour the probe could not read, and a colour it cannot read is a contrast check that does not
 * run. Widening acceptance changes what this instrument MEASURES, on live pages, in a direction
 * nobody has reviewed — and this file's own header insists an unmeasured thing must read as "not
 * checked" rather than as conformance. That is a decision about the probe, not a side effect a
 * deduplication gets to make.
 *
 * WORTH KNOWING BEFORE ANYONE DECIDES: the three divergent shapes are exactly CSS Color 4
 * serialization, which Chromium already emits for some computed colours and is emitting for more
 * over time. This copy failing closed on them is a coverage hole that will widen on its own.
 *
 * `scripts/design-lib.test.mjs` pins BOTH behaviours, so this fork cannot drift any further without
 * turning a test red, and cannot be quietly "tidied" into agreement either.
 */
export function parseRgb(str) {
  const m = String(str).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((n) => parseFloat(n.trim()));
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return [parts[0], parts[1], parts[2]];
}

// ── the token file ──────────────────────────────────────────────────────────────────────────────
// DTCG shape. Read defensively: this probe is not the token file's validator, and a token file it
// cannot parse must degrade to "not checked", never to "everything conforms".

const GROUP_PATHS = {
  fontSize: ['font.size', 'fontSize', 'typography.size', 'type.size'],
  lineHeight: ['font.lineHeight', 'lineHeight', 'typography.lineHeight', 'type.lineHeight'],
  letterSpacing: ['font.letterSpacing', 'letterSpacing', 'typography.letterSpacing', 'type.letterSpacing'],
  duration: ['duration', 'motion.duration', 'animation.duration', 'transition.duration'],
  easing: ['easing', 'motion.easing', 'animation.easing', 'transition.easing'],
};

function at(doc, dotted) {
  let n = doc;
  for (const k of dotted.split('.')) {
    if (!n || typeof n !== 'object' || !(k in n)) return null;
    n = n[k];
  }
  return n && typeof n === 'object' ? n : null;
}

/** Every `$value`-bearing leaf under a group node, as `{name, raw, $type}`. One level or nested. */
function leaves(node, prefix = '') {
  const out = [];
  if (!node || typeof node !== 'object') return out;
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if ('$value' in v) out.push({ name, raw: v.$value, $type: v.$type ?? null });
    else out.push(...leaves(v, name));
  }
  return out;
}

/**
 * Normalize a DTCG `$value` to a number in the group's canonical unit, or null if it is not a
 * number at all. px and unitless pass through; rem is taken at the CSS initial root size of 16px;
 * s becomes ms. An unknown unit returns null and the token is dropped — a token this probe cannot
 * read must not silently become a token that matches nothing.
 */
export function tokenNumber(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (raw && typeof raw === 'object' && typeof raw.value === 'number') {
    const u = String(raw.unit ?? '').toLowerCase();
    if (u === 'px' || u === '') return raw.value;
    if (u === 'rem') return raw.value * 16;
    if (u === 'ms') return raw.value;
    if (u === 's') return raw.value * 1000;
    return null;
  }
  if (typeof raw === 'string') {
    const m = raw.trim().match(/^(-?\d*\.?\d+)(px|rem|em|ms|s)?$/i);
    if (!m) return null;
    const v = parseFloat(m[1]);
    const u = (m[2] ?? '').toLowerCase();
    if (u === 'rem') return v * 16;
    if (u === 's') return v * 1000;
    return v;
  }
  return null;
}

/** The five CSS easing keywords, as the cubic-bezier curves the spec defines them to be. */
const EASING_KEYWORDS = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

/**
 * Canonical form for an easing value, so `ease-out` and `cubic-bezier(0, 0, 0.58, 1)` compare equal.
 * Anything this cannot canonicalise (steps(), linear() with stops) is lowercased and whitespace-
 * stripped, so it still compares exactly rather than becoming unmatchable.
 */
export function normalizeEasing(v) {
  if (Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number')) {
    return `cubic-bezier(${v.map((n) => Math.round(n * 1000) / 1000).join(',')})`;
  }
  const s = String(v ?? '').trim().toLowerCase();
  if (s in EASING_KEYWORDS) return normalizeEasing(EASING_KEYWORDS[s]);
  const m = s.match(/^cubic-bezier\(([^)]*)\)$/);
  if (m) {
    const nums = m[1].split(',').map((n) => parseFloat(n.trim()));
    if (nums.length === 4 && nums.every(Number.isFinite)) return normalizeEasing(nums);
  }
  return s.replace(/\s+/g, '');
}

/**
 * Index a parsed DTCG document into the five groups this probe can check.
 * `present: false` means the token file does not govern that property — which is reported as
 * UNCHECKED, never as conformance. The two are different facts and the artifact keeps them apart.
 */
export function tokenIndex(doc) {
  const idx = {};
  for (const [group, paths] of Object.entries(GROUP_PATHS)) {
    const node = paths.map((p) => at(doc, p)).find(Boolean) ?? null;
    const found = node ? leaves(node) : [];
    const byName = {};
    if (group === 'easing') {
      for (const l of found) byName[l.name] = normalizeEasing(l.raw);
    } else {
      for (const l of found) {
        const n = tokenNumber(l.raw);
        if (n !== null) byName[l.name] = n;
      }
    }
    const values = Object.values(byName);
    idx[group] = { present: values.length > 0, values, byName };
  }
  return idx;
}

/**
 * Load and index the token file. NEVER throws: a missing or unreadable token file degrades every
 * group to `present: false`, and the reason travels with it into the artifact.
 */
export function loadTokens(path = DEFAULT_TOKENS_PATH, { cwd = process.cwd() } = {}) {
  const abs = resolve(cwd, path);
  if (!existsSync(abs)) {
    return { path, abs, loaded: false, reason: `no token file at ${abs}`, index: tokenIndex({}) };
  }
  try {
    const doc = JSON.parse(readFileSync(abs, 'utf8'));
    return { path, abs, loaded: true, reason: null, index: tokenIndex(doc) };
  } catch (e) {
    return { path, abs, loaded: false, reason: `token file is not readable JSON: ${e.message}`, index: tokenIndex({}) };
  }
}

/**
 * The conformance question, for one property: which rendered values are absent from the token file?
 * `counts` maps a rendered value to how many elements render it. Returns every non-member with its
 * usage count and the nearest token, so the report says what to change it TO, not only that it is
 * wrong. A value that is not a number at all (`normal`) is a non-member with no nearest — the token
 * file cannot carry it, and dropping it would hide it.
 */
export function conform(counts, group, eps = EPS.px) {
  if (!group || !group.present) return { checked: false, offenders: [], usages: 0, distinct: 0 };
  const offenders = [];
  let usages = 0;
  let distinct = 0;
  for (const [raw, count] of Object.entries(counts ?? {})) {
    const n = Number(count) || 0;
    usages += n;
    distinct += 1;
    const v = Number(raw);
    if (!Number.isFinite(v) || raw === '' || raw === 'normal') {
      offenders.push({ value: raw, count: n, nearest: null, delta: null });
      continue;
    }
    if (group.values.some((t) => Math.abs(t - v) <= eps)) continue;
    const nearest = group.values.reduce((best, t) => (Math.abs(t - v) < Math.abs(best - v) ? t : best), group.values[0]);
    offenders.push({ value: v, count: n, nearest, delta: Math.round((v - nearest) * 10000) / 10000 });
  }
  offenders.sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
  return { checked: true, offenders, usages, distinct };
}

/** The same question for a string-valued property (easing), compared on canonical form. */
export function conformStrings(counts, group) {
  if (!group || !group.present) return { checked: false, offenders: [], usages: 0, distinct: 0 };
  const allowed = new Set(group.values.map(normalizeEasing));
  const offenders = [];
  let usages = 0;
  let distinct = 0;
  for (const [raw, count] of Object.entries(counts ?? {})) {
    const n = Number(count) || 0;
    usages += n;
    distinct += 1;
    if (allowed.has(normalizeEasing(raw))) continue;
    offenders.push({ value: raw, count: n, nearest: null, delta: null });
  }
  offenders.sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
  return { checked: true, offenders, usages, distinct };
}

/** Severity ranking so callers can gate on p1 without re-deriving it. */
export function rank(findings) {
  const order = { p1: 0, p2: 1, p3: 2 };
  return [...findings].sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
}

// ── the in-page measurement ─────────────────────────────────────────────────────────────────────
// Runs inside the browser. Pure geometry, computed style and the Web Animations API; no judgement.
/* c8 ignore start — executes in the page context, not under node coverage */
function collect() {
  const de = document.documentElement;
  const vw = de.clientWidth;

  const isScrollableX = (el) => {
    let n = el;
    while (n && n !== document.body && n !== de) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth) return true;
      n = n.parentElement;
    }
    return de.scrollWidth > vw;
  };

  const SEL = 'button,a[href],[role="button"],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const targets = [];
  document.querySelectorAll(SEL).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    targets.push({
      label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40),
      w: Math.round(r.width),
      h: Math.round(r.height),
      // Beyond the viewport AND nothing between it and the root scrolls horizontally →
      // no scroll offset brings it into view. This is the nav-clipped-behind-a-sticky-header case.
      unreachable: r.left >= vw && !isScrollableX(el),
    });
  });

  // Rendered type, as value → usage count. line-height and letter-spacing are converted to the
  // units the token file states them in — a ratio and em respectively — because a token file cannot
  // carry "19.5px at 12px" and a probe comparing px against a ratio would report every value wrong.
  const fontSize = {};
  const lineHeight = {};
  const letterSpacing = {};
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const r4 = (n) => Math.round(n * 10000) / 10000;

  const weights = {};
  const textColors = {};
  const contrastPairs = [];
  document.querySelectorAll('*').forEach((el) => {
    const t = (el.textContent || '').trim();
    if (!t || el.children.length > 0) return;
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    if (!(px > 0)) return;
    bump(fontSize, String(r3(px)));

    // `line-height: normal` is font-dependent and is NOT 1.2 — it cannot be converted to a ratio,
    // so it is carried through as the string and reported as a value no token authorises.
    if (cs.lineHeight === 'normal') bump(lineHeight, 'normal');
    else {
      const lh = parseFloat(cs.lineHeight);
      if (Number.isFinite(lh)) bump(lineHeight, String(r3(lh / px)));
    }

    // `letter-spacing: normal` IS exactly zero tracking, so it maps to 0 rather than to a string.
    if (cs.letterSpacing === 'normal') bump(letterSpacing, '0');
    else {
      const ls = parseFloat(cs.letterSpacing);
      if (Number.isFinite(ls)) bump(letterSpacing, String(r4(ls / px)));
    }

    weights[cs.fontWeight] = (weights[cs.fontWeight] || 0) + 1;
    textColors[cs.color] = (textColors[cs.color] || 0) + 1;

    let bg = 'rgba(0, 0, 0, 0)';
    let n = el;
    while (n && bg === 'rgba(0, 0, 0, 0)') {
      bg = getComputedStyle(n).backgroundColor;
      n = n.parentElement;
    }
    contrastPairs.push({ fg: cs.color, bg, px, bold: parseInt(cs.fontWeight, 10) >= 700 });
  });

  // Motion, via document.getAnimations() — Baseline since September 2020, and the one API that
  // returns CSS animations, CSS transitions and Web Animations through a single interface.
  // RAW ONLY. Both places the authored timing function can live are read and handed back
  // unresolved; deciding which one holds it is judgement, and judgement happens in node where
  // resolveMotion() can be tested. This function reports.
  const animationsApi = typeof document.getAnimations === 'function';
  const animations = [];
  if (animationsApi) {
    for (const a of document.getAnimations()) {
      const eff = a.effect;
      const timing = eff && typeof eff.getTiming === 'function' ? eff.getTiming() : null;
      const computed = eff && typeof eff.getComputedTiming === 'function' ? eff.getComputedTiming() : null;
      const d = computed && typeof computed.duration === 'number' ? computed.duration
        : timing && typeof timing.duration === 'number' ? timing.duration : null;
      let keyframeEasings = [];
      try {
        if (eff && typeof eff.getKeyframes === 'function') {
          keyframeEasings = eff.getKeyframes().map((k) => (k.easing == null ? null : String(k.easing)));
        }
      } catch (_) { /* some effects refuse getKeyframes(); the timing easing still travels */ }
      animations.push({
        kind: (a.constructor && a.constructor.name) || 'Animation',
        name: a.animationName || a.transitionProperty || null,
        playState: a.playState,
        duration: d,
        timingEasing: timing && timing.easing != null ? String(timing.easing) : null,
        keyframeEasings,
      });
    }
  }

  return {
    overflow: de.scrollWidth - vw,
    scrollWidth: de.scrollWidth,
    clientWidth: vw,
    targets,
    type: { fontSize, lineHeight, letterSpacing },
    motion: { animationsApi, animations },
    weights,
    textColors: Object.keys(textColors).length,
    contrastPairs,
  };
}
/* c8 ignore stop */

/**
 * Where the AUTHORED timing function actually lives, which is not one place.
 *
 * MEASURED in Chromium 2026-08-29, one page, one `getAnimations()` call, three effects:
 *   · `.a { animation: spin 350ms ease-in-out }` → getTiming().easing `"linear"`,
 *     getKeyframes()[].easing `"ease-in-out"`
 *   · `.b { animation: spin 200ms cubic-bezier(.2,0,0,1) }` → getTiming().easing `"linear"`,
 *     getKeyframes()[].easing `"cubic-bezier(0.2, 0, 0, 1)"`
 *   · `.t { transition: opacity 250ms ease-out }` → getTiming().easing `"ease-out"`,
 *     getKeyframes()[].easing `"linear"`
 *
 * The two are in OPPOSITE places, and the wrong one does not error — it returns `"linear"`, a
 * perfectly plausible easing. A probe reading only `getTiming().easing` reports every CSS animation
 * in the app as `linear` and is confidently wrong about half of all motion. The first version of
 * this file did exactly that, and it was caught by running the probe against a real page rather
 * than by reading it.
 */
export function authoredEasings(a = {}) {
  const kf = (Array.isArray(a.keyframeEasings) ? a.keyframeEasings : []).filter((e) => typeof e === 'string' && e);
  if (a.kind === 'CSSAnimation') return [...new Set(kf)];
  // CSSTransition and a script-driven Animation carry it on the effect timing, and their keyframes
  // read `linear` by default. A Web Animations author CAN also set per-keyframe easing, so a
  // keyframe value that is not the default is a real authored value and is kept; an explicit
  // per-keyframe `linear` is indistinguishable from the default and is left to the timing easing.
  const out = [];
  if (typeof a.timingEasing === 'string' && a.timingEasing) out.push(a.timingEasing);
  for (const e of kf) if (normalizeEasing(e) !== normalizeEasing('linear')) out.push(e);
  return [...new Set(out)];
}

/**
 * Turn the raw animation records the page handed back into the count maps the conformance check
 * consumes. Pure, and separate from `collect()` on purpose: `collect()` is serialised into the
 * browser and cannot be unit-tested, so nothing interpretive may live there.
 */
export function resolveMotion(raw = {}) {
  const animations = Array.isArray(raw.animations) ? raw.animations : [];
  const duration = {};
  const easing = {};
  const resolved = [];
  for (const a of animations) {
    const es = authoredEasings(a);
    // A zero-duration effect is not a motion decision; it is the absence of one.
    if (typeof a.duration === 'number' && a.duration > 0) {
      const k = String(Math.round(a.duration * 10) / 10);
      duration[k] = (duration[k] || 0) + 1;
    }
    for (const e of es) easing[e] = (easing[e] || 0) + 1;
    resolved.push({ ...a, easing: es });
  }
  return { animationsApi: raw.animationsApi !== false, duration, easing, animations: resolved };
}

function conformanceFinding({ tag, check, property, res, unit, source }) {
  if (!res.checked || res.offenders.length === 0) return null;
  const shown = res.offenders
    .slice(0, 8)
    .map((o) => {
      const near = o.nearest === null ? 'no numeric token to compare against' : `nearest token ${o.nearest}${unit}`;
      return `${o.value}${typeof o.value === 'number' ? unit : ''} x${o.count} (${near})`;
    })
    .join(', ');
  return {
    severity: 'p2',
    check,
    property,
    viewport: tag,
    measured: `${res.offenders.length} of ${res.distinct} rendered ${property} value(s) appear in no token: ${shown}`,
    standard: `every rendered ${property} must appear in ${source}`,
    offenders: res.offenders,
    note:
      'This check has no opinion about the ramp. It asks only whether the token file authorises the ' +
      'value. Taste is decided in the token file, which is reviewed as a design artifact.',
  };
}

/** Turn one viewport's raw measurement into ranked findings. Pure — unit-testable without a browser. */
export function findingsFor(tag, m, opts = {}) {
  const tokens = opts.tokens ?? null;
  const source = opts.tokensPath ?? DEFAULT_TOKENS_PATH;
  const out = [];

  // Overflow is one measurement cited against two different standards depending on the width it was
  // taken at. At the reflow widths it IS SC 1.4.10; anywhere else it is the plain usability finding.
  if (m.overflow > 0) {
    out.push(
      m.reflow
        ? {
            severity: 'p1',
            check: 'reflow-1410',
            viewport: tag,
            measured: `${m.overflow}px beyond a ${m.clientWidth}px viewport (document is ${m.scrollWidth}px) — content scrolls in two dimensions`,
            standard:
              'WCAG 2.2 SC 1.4.10 Reflow, level AA — vertically-scrolling content must present without two-dimensional scrolling at a width equivalent to 320 CSS px (1280 CSS px at 400% zoom)',
            note:
              'SC 1.4.10 excepts parts of the content requiring two-dimensional layout for usage or meaning (data tables, maps, diagrams). This probe cannot tell such a part from a broken layout, so the exception must be argued explicitly or the layout fixed.',
          }
        : {
            severity: 'p1',
            check: 'horizontal-overflow',
            viewport: tag,
            measured: `${m.overflow}px beyond a ${m.clientWidth}px viewport (document is ${m.scrollWidth}px)`,
            standard: 'content must not require horizontal scrolling at the target width',
          },
    );
  }

  const unreachable = m.targets.filter((t) => t.unreachable);
  if (unreachable.length) {
    out.push({
      severity: 'p1',
      check: 'unreachable-interactive',
      viewport: tag,
      measured: `${unreachable.length} interactive element(s) past the viewport with no horizontal scroll: ${unreachable
        .map((t) => t.label)
        .slice(0, 6)
        .join(', ')}`,
      standard: 'every interactive element must be reachable at some scroll offset',
    });
  }

  const failAA = m.targets.filter((t) => t.h < TARGET_AA || t.w < TARGET_AA);
  if (failAA.length) {
    out.push({
      severity: 'p1',
      check: 'target-size-aa',
      viewport: tag,
      measured: `${failAA.length} of ${m.targets.length} below ${TARGET_AA}x${TARGET_AA}`,
      standard: 'WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA — 24x24 CSS px',
      note: 'SC 2.5.8 allows a spacing exception; this probe does not evaluate it, so treat these as candidates requiring the exception to be argued explicitly.',
    });
  }

  const type = m.type ?? {};
  const specs = [
    { key: 'fontSize', property: 'font-size', unit: 'px', eps: EPS.px },
    { key: 'lineHeight', property: 'line-height', unit: '', eps: EPS.ratio },
    { key: 'letterSpacing', property: 'letter-spacing', unit: 'em', eps: EPS.em },
  ];
  for (const s of specs) {
    const res = conform(type[s.key], tokens?.[s.key], s.eps);
    const f = conformanceFinding({ tag, check: 'token-conformance', property: s.property, res, unit: s.unit, source });
    if (f) out.push(f);
  }

  const motion = m.motion ?? {};
  const durRes = conform(motion.duration, tokens?.duration, EPS.ms);
  const durF = conformanceFinding({ tag, check: 'motion-conformance', property: 'duration', res: durRes, unit: 'ms', source });
  if (durF) out.push(durF);
  const easeRes = conformStrings(motion.easing, tokens?.easing);
  const easeF = conformanceFinding({ tag, check: 'motion-conformance', property: 'easing', res: easeRes, unit: '', source });
  if (easeF) out.push(easeF);

  for (const p of m.contrastPairs ?? []) {
    const fg = parseRgb(p.fg);
    const bg = parseRgb(p.bg);
    if (!fg || !bg) continue;
    const large = p.px >= 24 || (p.bold && p.px >= 18.66);
    const floor = large ? 3.0 : 4.5;
    const ratio = contrast(fg, bg);
    if (ratio < floor) {
      out.push({
        severity: 'p1',
        check: 'text-contrast',
        viewport: tag,
        measured: `${ratio}:1 at ${p.px}px`,
        standard: `WCAG 2.2 SC 1.4.3 Contrast (Minimum), level AA — ${floor}:1`,
      });
      break; // one representative finding per viewport; the full set is in the raw measurement
    }
  }

  return rank(out);
}

/**
 * Everything this run did not check, as a list a reviewer can read. The token-derived entries are
 * the load-bearing ones: a token file that does not govern a property produces NO findings for it,
 * and without this list that silence is indistinguishable from conformance.
 */
export function uncheckedFor(tokens, { loaded = true, reason = null, path = DEFAULT_TOKENS_PATH, measurements = {} } = {}) {
  const out = [...UNCHECKED_ALWAYS];
  if (!loaded) {
    out.unshift(
      `TOKEN CONFORMANCE DID NOT RUN AT ALL — ${reason ?? `no token file at ${path}`}. Every type and motion value on this page is unmeasured, not conforming.`,
    );
    return out;
  }
  const labels = {
    fontSize: 'font-size',
    lineHeight: 'line-height',
    letterSpacing: 'letter-spacing',
    duration: 'motion duration',
    easing: 'motion easing',
  };
  for (const [group, label] of Object.entries(labels)) {
    if (!tokens?.[group]?.present) {
      out.unshift(`${label} conformance — ${path} declares no ${label} tokens, so nothing was compared. Silence here is absence of a standard, not conformance to one.`);
    }
  }
  if (Object.values(measurements).some((m) => m?.motion && m.motion.animationsApi === false)) {
    out.unshift('motion — document.getAnimations() is not available in this browser, so no animation was read');
  }
  return out;
}

/**
 * The artifact a reviewer with no browser and no shell reads. Pure, so its shape is pinned by a
 * test rather than by a run. `exit` is written into the file on purpose: the three-state exit is the
 * reason a blind probe cannot report a clean run, and a reader of the JSON alone must be able to see
 * which of the three states produced it.
 */
export function buildArtifact({ url, tokens, result, refused = null, generatedAt = new Date().toISOString() }) {
  const exit = refused ? 2 : result?.ok ? 0 : 1;
  return {
    tool: 'design-probe',
    schema: 2,
    generatedAt,
    url: url ?? null,
    exit,
    state: exit === 2 ? 'REFUSED — could not measure' : exit === 1 ? 'MEASURED — failed' : 'MEASURED — passed',
    refused: refused ? { message: refused.message, code: refused.code ?? null } : null,
    tokens: tokens
      ? { path: tokens.path, loaded: tokens.loaded, reason: tokens.reason, groups: Object.fromEntries(Object.entries(tokens.index).map(([k, v]) => [k, { present: v.present, count: v.values.length }])) }
      : null,
    findings: result?.findings ?? [],
    unchecked: result?.unchecked ?? uncheckedFor(tokens?.index, { loaded: tokens?.loaded ?? false, reason: tokens?.reason, path: tokens?.path }),
    measurements: result?.measurements ?? {},
  };
}

export function writeArtifact(path, artifact) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), `${JSON.stringify(artifact, null, 2)}\n`);
  return resolve(path);
}

/** Run the probe. Returns {ok, findings, measurements, unchecked, tokens}. Throws on launch failure. */
export async function probe(url, { viewports = DEFAULT_VIEWPORTS, settleMs = 2000, tokensPath = DEFAULT_TOKENS_PATH, cwd = process.cwd() } = {}) {
  const tokens = loadTokens(tokensPath, { cwd });

  const resolved = resolvePlaywright();
  if (!resolved) {
    const e = new Error('playwright could not be resolved — the probe cannot see, and is not reporting a clean run');
    e.code = 'ENOPLAYWRIGHT';
    e.tokens = tokens;
    throw e;
  }

  let browser;
  try {
    browser = await resolved.mod.chromium.launch({ headless: true });
  } catch (cause) {
    const e = new Error(
      'chromium failed to launch. Under the armed sandbox this is SIGTRAP and is EXPECTED — ' +
        'the probe must run in an escalated lane. It is refusing rather than reporting zero findings.',
    );
    e.code = 'ENOLAUNCH';
    e.cause = cause;
    e.tokens = tokens;
    throw e;
  }

  const measurements = {};
  const findings = [];
  try {
    for (const v of viewports) {
      const page = await browser.newPage({
        viewport: { width: v.w, height: v.h },
        ...(v.dsf ? { deviceScaleFactor: v.dsf } : {}),
      });
      // domcontentloaded, never networkidle — an SSE stream keeps networkidle from ever resolving.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(settleMs);
      const m = await page.evaluate(collect);
      m.motion = resolveMotion(m.motion);
      m.reflow = Boolean(v.reflow);
      m.deviceScaleFactor = v.dsf ?? 1;
      measurements[v.tag] = m;
      findings.push(...findingsFor(v.tag, m, { tokens: tokens.index, tokensPath: tokens.path }));
      await page.close();
    }
  } finally {
    await browser.close();
  }

  return {
    ok: !findings.some((f) => f.severity === 'p1'),
    findings: rank(findings),
    measurements,
    tokens,
    unchecked: uncheckedFor(tokens.index, { loaded: tokens.loaded, reason: tokens.reason, path: tokens.path, measurements }),
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────
/* c8 ignore start */
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const argv = process.argv.slice(2);
  const flagValue = (name) => {
    const i = argv.indexOf(name);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
  };
  const url = argv.find((a) => !a.startsWith('--') && a !== flagValue('--tokens') && a !== flagValue('--out'));
  if (!url) {
    console.error('usage: node scripts/design-probe.mjs <url> [--json] [--tokens <path>] [--out <path>]');
    process.exit(2);
  }
  const asJson = argv.includes('--json');
  const outPath = flagValue('--out');
  const tokensPath = flagValue('--tokens') ?? DEFAULT_TOKENS_PATH;

  try {
    const r = await probe(url, { tokensPath });
    if (outPath) {
      const written = writeArtifact(outPath, buildArtifact({ url, tokens: r.tokens, result: r }));
      console.error(`artifact: ${written}`);
    }
    if (asJson) {
      console.log(JSON.stringify(buildArtifact({ url, tokens: r.tokens, result: r }), null, 2));
    } else {
      for (const f of r.findings) {
        console.log(
          `[${f.severity}] ${f.check}${f.property ? `/${f.property}` : ''} @${f.viewport}\n    measured: ${f.measured}\n    standard: ${f.standard}${f.note ? `\n    note: ${f.note}` : ''}`,
        );
      }
      console.log(`\ntokens: ${r.tokens.path} — ${r.tokens.loaded ? 'loaded' : `NOT LOADED (${r.tokens.reason})`}`);
      console.log(`\nNOT CHECKED (declared, not assumed covered):\n${r.unchecked.map((u) => `  · ${u}`).join('\n')}`);
      console.log(r.ok ? '\n✓ no p1 findings' : `\n✗ ${r.findings.filter((f) => f.severity === 'p1').length} p1 finding(s)`);
    }
    process.exit(r.ok ? 0 : 1);
  } catch (e) {
    // The refusal is written to the artifact too. A reviewer reading only the JSON must not be able
    // to mistake "no findings" for "measured and clean" — that is the whole point of exit 2.
    if (outPath) {
      try {
        writeArtifact(outPath, buildArtifact({ url, tokens: e.tokens ?? loadTokens(tokensPath), result: null, refused: e }));
      } catch (w) {
        console.error(`could not write the refusal artifact: ${w.message}`);
      }
    }
    console.error(`design-probe REFUSED: ${e.message}`);
    process.exit(2); // 2 = could not measure. Distinct from 1 = measured and failed.
  }
}
/* c8 ignore stop */
