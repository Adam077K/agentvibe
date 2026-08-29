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
// ── WHY EVERY FINDING THIS PROBE EMITS IS p1, DECIDED 2026-08-29 ─────────────────────────────────
//
// Conformance findings were `p2` while the verdict was `ok: !findings.some(p1)`. Measured against
// the real shipped `design/tokens/tokens.json` and the exact census this layer was built for —
// fontSize {12.5:30, 11.5:13, 13.5:1}, lineHeight {1.625:27}, 45 of 94 usages off-system and 27
// line-heights off-system — the probe emitted 2 findings, both p2, `ok: true`, exit 0,
// `state: "MEASURED — passed"`. The finder worked and the verdict did not read it, which made the
// whole conformance axis decorative: no token-conformance violation could ever fail a run.
//
// THE DECISION: a rendered value that appears in NO token BLOCKS. It is the binding class by
// construction — deterministic, reproducible twice from the same page, and it names the exact
// token to change to. This layer's claim is that conformance can bind; a severity that cannot
// reach the verdict is that claim withdrawn in the one field a machine reads.
//
// THE ALTERNATIVE THAT WAS REJECTED: keep `p2` and widen the verdict to "no p1 AND no conformance
// finding". It gates the same runs, and it leaves `severity: p2` sitting on a finding that blocks
// — so a reader who sees p2 and infers "does not block" is reading the field the way every other
// severity scale in this repo uses it. Two meanings of one word beats no meaning only until
// somebody acts on the wrong one.
//
// AND NO USAGE THRESHOLD. A value rendered once is exactly as unauthorised as one rendered thirty
// times; `count` travels with every offender so a reader can prioritise, but the probe does not
// decide that 3 usages are tolerable and 30 are not. That number would be invented here, which is
// how `MIN_STEP_RATIO` above got written and then falsified.
//
// THE CONSEQUENCE, STATED RATHER THAN LEFT TO BE DISCOVERED: every check this file emits is now
// p1, so `ok` is today equivalent to `findings.length === 0` and `rank()` sorts one class. That is
// not an argument against the change — it is what "everything this instrument measures is
// deterministic and cites a standard" implies. `severity` and `rank()` stay because the first
// non-blocking check needs somewhere to go: SC 2.5.5's 44px AAA target is the obvious next one,
// and it is advisory by the spec's own level. **No test asserts "every finding is p1"** — that
// would pin a rule this file expects to stop being true, which is the harm the deleted
// MIN_STEP_RATIO test did.
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
// IT IS NOT SILENTLY SKIPPED, and that is the whole design. FOUR exit states, kept distinct:
//     2 = could not measure (REFUSED)              1 = measured and failed
//     3 = measured, but an axis did not run        0 = measured everything, and passed
// so a probe that cannot see refuses rather than reporting a clean run over zero pages. State 3 is
// the one added last and it closes the hole the other three left: a run that measured SOME axes
// and reported the rest only in prose. Only an empty `gaps` list reaches 0. `--out`
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

/**
 * How Chromium serialises a fully transparent computed `background-color`. It is a SENTINEL, not a
 * colour, and the difference is the whole of the defect recorded on `canvasBackground()` below.
 */
export const TRANSPARENT = 'rgba(0, 0, 0, 0)';

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
 * THE BOUND, CORRECTED 2026-08-29. This said "the divergence is one-directional: wherever this
 * returns a triple, that copy returns the SAME triple. So the permissive one is a strict superset,
 * and adopting it would only ever turn a null into a value." All three clauses are false, measured:
 *
 *   `rgb(1 2, 3, 4)`  → [1,3,4] here · [1,2,3] there   DIFFERENT triples, not null-vs-value
 *   `rgb(1 x, 2, 3)`  → [1,2,3] here · null    there   THIS copy is the permissive one
 *
 * Mixed separators split differently rather than more permissively: the shared copy treats a space
 * as a separator and shifts components left, while `parseFloat` here reads the leading number of a
 * whitespace-joined chunk and silently drops the rest.
 *
 * THAT CORRECTION WAS ALSO TOO BROAD. It read "on values separated by commas alone the two agree",
 * and `rgb(1,2,3,)`, `rgb(1,,2,3)`, `rgb(,1,2,3)` and `rgb(1,2,3,x)` all refute it — the last being
 * the same non-numeric-alpha class listed as divergent above. Two hand-written allowlists produced
 * two false universals; the fix is a sweep, not a third list.
 *
 * THE BOUND THAT SURVIVES IS THE SAFETY ONE: **wherever this copy returns a triple, the shared one
 * returns the SAME triple** — 66,000 inputs across both pure grammars, zero violations, 6,048 of
 * them non-vacuous. A null here is a colour the probe could not read, which its caller reports as
 * NOT CHECKED, so a disagreement in that direction is safe. Mixed separators are valid in neither
 * grammar, sit outside the sweep, and are where the property genuinely fails.
 *
 * IT IS STILL NOT A FREE CHANGE, WHICH IS WHY IT WAS NOT MADE HERE — and the correction above
 * makes that case STRONGER rather than weaker. A null from this function means a colour the probe
 * could not read, and a colour it cannot read is a contrast check that does not run. Adopting the
 * shared copy is therefore not a widening at all: it would turn some nulls into values, some values
 * into nulls, and some values into DIFFERENT values. That changes what this instrument measures on
 * live pages, in a direction nobody has reviewed, and this file's own header insists an unmeasured
 * thing must read as "not checked" rather than as conformance. It is a decision about the probe,
 * not a side effect a deduplication gets to make.
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

/**
 * The findings that fail a run. ONE definition, because there were three: `probe()` computed
 * `ok`, the CLI counted p1s for its closing line, and every caller re-derived the same filter.
 * Three implementations of one predicate is this repo's most-cited failure mode, and here it also
 * hid the defect above — the verdict and the finder disagreed about what counts, in a file where
 * they sit 200 lines apart.
 *
 * Exported so the gate is testable without a browser. Before this existed, the only way to ask
 * "does this page pass?" was to launch Chromium, and the one thing no test in this repo can do is
 * launch Chromium.
 */
export function blocking(findings = []) {
  return findings.filter((f) => f.severity === 'p1');
}

/**
 * The verdict, derived from `blocking()` and nowhere else.
 *
 * And `blocking()` is derived from findings, which are derived from what `collect()` read out of
 * the page — so this verdict is only as trustworthy as the page it was taken from. See the trust
 * boundary note above `collect()`; it is sound for a local dev server and is not a claim about an
 * arbitrary URL.
 */
export function isPass(findings = []) {
  return blocking(findings).length === 0;
}

// ── the in-page measurement ─────────────────────────────────────────────────────────────────────
// Runs inside the browser. Pure geometry, computed style and the Web Animations API; no judgement.
//
// THE TRUST BOUNDARY IS HERE, AND THE VERDICT SITS ON THE WRONG SIDE OF IT. Say it plainly rather
// than leave a reader to work it out: everything `probe()` returns — every finding, and therefore
// `ok`, which is `isPass(findings)` over findings that come from nowhere else — is computed from
// values this function reads out of the page under test. The page can decide what
// `getComputedStyle` reports, what `getBoundingClientRect` returns and what `getAnimations()`
// yields. A page that wanted a PASS could produce one, and nothing outside the page contradicts
// it. There is no second observer here; there is one, and it is the subject.
//
// THAT IS SOUND FOR WHAT THIS INSTRUMENT IS FOR AND UNSOUND FOR ANYTHING ELSE. The stated target
// is the operator's own local dev server, where the page and the operator are the same party and a
// self-flattering measurement is only a way of lying to yourself — which the rest of the run would
// contradict anyway. Point it at a URL you do not control and `ok` stops being evidence about that
// site and becomes a report of what that site chose to say about itself. `scripts/extract-
// reference.mjs` measures third-party pages and makes no pass/fail claim about them for exactly
// this reason: it emits numbers, and the judging happens here, against a token file this
// repository owns.
//
// This is a NOTE, not a defect left open. Re-architecting it would mean a second, out-of-page
// oracle — a screenshot pipeline or a rendering engine of our own — which is a far larger
// instrument than the job needs and would itself need trusting. What is required is that nobody
// reads `ok: true` from an arbitrary URL as a fact about that URL.
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

    // The walk finds the nearest ancestor that declares a background, up to and including <html> —
    // and CSS propagates <body>'s background to the canvas when <html> declares none, so both are
    // reached here. What it CANNOT find is the case where nothing declares one: `bg` is then left
    // as the transparent sentinel, RAW, and resolveContrast() in node decides what that means.
    // Substituting a colour here would put an untestable judgement inside page context.
    let bg = 'rgba(0, 0, 0, 0)';
    let n = el;
    while (n && bg === 'rgba(0, 0, 0, 0)') {
      bg = getComputedStyle(n).backgroundColor;
      n = n.parentElement;
    }
    contrastPairs.push({ fg: cs.color, bg, px, bold: parseInt(cs.fontWeight, 10) >= 700 });
  });

  // The two inputs the UA canvas colour depends on, reported rather than interpreted.
  const colorScheme = String(getComputedStyle(de).colorScheme || 'normal');
  const prefersDark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
    colorScheme,
    prefersDark,
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

/**
 * THE UA CANVAS COLOUR, WHICH IS NOT IN ANY COMPUTED STYLE — and reading the sentinel instead was
 * wrong in BOTH directions, measured 2026-08-29:
 *
 *   `rgb(51, 51, 51)`    on an undeclared canvas → p1 `text-contrast` "1.662:1". Truth: 12.635:1.
 *                        A FALSE BLOCKER on ordinary dark-grey body text.
 *   `rgb(240, 240, 240)` on an undeclared canvas → nothing emitted at all. Truth: 1.14:1.
 *                        A MISSED BLOCKER on text that is very nearly invisible.
 *
 * The mechanism: the ancestor walk exits carrying `rgba(0, 0, 0, 0)` when nothing between the text
 * and the root declares a background, and `parseRgb` reads that as `[0, 0, 0]` — opaque black. The
 * sentinel and black are one string apart and are opposite ends of the scale.
 *
 * WHAT IS RETURNED, AND WHAT IS DELIBERATELY NOT GUESSED. In a light colour scheme the UA canvas is
 * white, and white is what every pixel of an undeclared page actually composites against. In a dark
 * one it is a UA-chosen colour that this probe HAS NOT MEASURED — Chromium's dark canvas is not
 * `rgb(0, 0, 0)` and putting a number here that nobody ran would re-create the defect in the other
 * direction. So dark returns `color: null`, every pair on that page becomes unreadable, and
 * `uncheckedFor()` reports the count as NOT CHECKED. An honest hole beats a plausible number.
 *
 * The used scheme, per CSS Color Adjustment 1: `dark` alone forces dark whatever the user prefers;
 * `light dark` follows the preference; anything else (`normal`, `light`, absent) is light.
 */
export function canvasBackground({ colorScheme = 'normal', prefersDark = false } = {}) {
  const s = String(colorScheme ?? 'normal');
  const usedDark = /\bdark\b/.test(s) && (Boolean(prefersDark) || !/\blight\b/.test(s));
  return { color: usedDark ? null : 'rgb(255, 255, 255)', colorScheme: s, usedDark };
}

/**
 * Substitute the canvas into every pair whose backdrop nothing declared. Pure and separate from
 * `collect()` for the same reason `resolveMotion` is: `collect()` is serialised into the browser
 * and cannot be unit-tested, so no judgement may live there.
 *
 * `canvasBg: true` travels with the substituted pairs so a finding can say the backdrop was the
 * UA default rather than a decision anyone made.
 */
export function resolveContrast(raw = {}) {
  const canvas = canvasBackground(raw);
  const pairs = (raw.contrastPairs ?? []).map((p) =>
    p?.bg === TRANSPARENT ? { ...p, bg: canvas.color, canvasBg: true } : { ...p, canvasBg: false },
  );
  return { canvas, pairs };
}

/**
 * The two colours of one pair, or null when either cannot be read. ONE predicate, because
 * `findingsFor` decides whether to check a pair and `uncheckedFor` counts the ones it skipped, and
 * those two answers must be the same answer.
 *
 * The sentinel is refused HERE as well as substituted in `resolveContrast`, so a caller that
 * forgets to resolve gets "not checked" rather than a confident measurement against black. Before
 * this, an unreadable pair was `continue`d with no counter and no `unchecked` entry — so a page
 * whose colours this cannot read was SILENT, which is the one thing this file's header says a hole
 * may never be. That hole widens on its own: Chromium emits more CSS Color 4 serialization over
 * time, and `parseRgb` here refuses all of it (see the fork note above).
 */
export function pairColors(p = {}) {
  if (p?.fg === TRANSPARENT || p?.bg === TRANSPARENT) return null;
  const fg = parseRgb(p?.fg);
  const bg = parseRgb(p?.bg);
  return fg && bg ? { fg, bg } : null;
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
    // p1 — see "WHY EVERY FINDING THIS PROBE EMITS IS p1" in the header. This was `p2` while the
    // verdict gated on p1, so no conformance violation could fail a run; the census that exposed
    // it is pinned in design-probe.test.mjs as `the census that used to exit 0`.
    severity: 'p1',
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
    // A pair this cannot read is SKIPPED, and the skip is counted — by uncheckedFor(), through the
    // same pairColors() predicate, so the two cannot disagree about which pairs were measured.
    const c = pairColors(p);
    if (!c) continue;
    const large = p.px >= 24 || (p.bold && p.px >= 18.66);
    const floor = large ? 3.0 : 4.5;
    const ratio = contrast(c.fg, c.bg);
    if (ratio < floor) {
      const f = {
        severity: 'p1',
        check: 'text-contrast',
        viewport: tag,
        measured: `${ratio}:1 at ${p.px}px`,
        standard: `WCAG 2.2 SC 1.4.3 Contrast (Minimum), level AA — ${floor}:1`,
      };
      if (p.canvasBg) {
        f.note =
          'the backdrop is the UA canvas default — nothing between this text and the root declares a ' +
          'background, so this is measured against what the browser paints, not against a stated colour';
      }
      out.push(f);
      break; // one representative finding per viewport; the full set is in the raw measurement
    }
  }

  return rank(out);
}

/** The five axes this probe can measure conformance on, and how each is named to a reader. */
const GROUP_LABELS = {
  fontSize: 'font-size',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  duration: 'motion duration',
  easing: 'motion easing',
};

/**
 * THE AXES THIS RUN COULD HAVE MEASURED AND DID NOT. This is the verdict's second input, and it
 * exists because of a defect that survived the first two fixes on this file.
 *
 * WHAT WENT WRONG, MEASURED. `ENOTOKENS` refuses when the token file cannot be READ. A token file
 * that is readable and declares nothing — literally `{}` — is `loaded: true`, so it does not
 * refuse; every group reports `present: false`, `conform()` returns `checked: false`, and against
 * the same off-system census as before:
 *
 *     tokens.loaded : true     groups present: all five false
 *     findings      : 0        isPass: true      exit: 0     state: "MEASURED — passed"
 *
 * 45 off-system usages, a passing verdict. **And this file's own header PRESCRIBED that exact
 * file** as the way to run the WCAG axis alone, claiming "the artifact says NOT CHECKED rather
 * than passed". That clause was false. So the documented way to opt out of conformance was also
 * the way to obtain a pass over an axis nobody measured — the same disclosure-is-not-enough
 * argument that made the unreadable case a refusal, arriving by a path the file recommended.
 *
 * WHY A FOURTH STATE RATHER THAN AN OPT-IN FLAG. The alternative on the table was to refuse unless
 * an explicit opt-in names the axes being skipped. It is worse for the reason `--no-tokens` was
 * refused: whatever a flag makes you enumerate, the fastest path to green is to enumerate
 * everything, and a flag can be copied into a script once and never read again. A STATE cannot be
 * silenced — it is computed from what the run actually covered. It also covers the case an opt-in
 * cannot: an axis that failed to run when nobody intended to skip it (a browser without
 * `getAnimations()`, a dark canvas whose colour is unknowable), which is the same seam one
 * magnitude down.
 *
 * WHAT IS A GAP AND WHAT IS NOT, and the line is mechanical rather than a judgement: **a gap is a
 * hole this run could have closed.** A token group is declared or it is not; a colour is readable
 * or it is not — both vary with the input, so a verdict that reads them carries information. The
 * entries in `UNCHECKED_ALWAYS` are true of EVERY run by construction (rAF animation is invisible
 * to `getAnimations()` and always will be; composition is not measurable). A verdict reacting to
 * those is a constant, and a constant verdict says nothing. They stay declared and stay out of it.
 *
 * KNOWN AND ACCEPTED: against this repo's own `design/tokens/tokens.json`, `duration` and `easing`
 * are absent today, so a real run here is INCOMPLETE and cannot reach exit 0 until motion tokens
 * exist. That is the honest reading — `design/system/motion.md` is `status: unanswered` and the
 * `craft` lens dropped its motion check for the same reason — and unlike an unsatisfiable check it
 * has a reachable, mechanical exit condition: declare the tokens.
 */
export function coverageGaps({ tokens = null, loaded = true, path = DEFAULT_TOKENS_PATH, reason = null, measurements = {} } = {}) {
  const gaps = [];
  if (!loaded) {
    gaps.push({
      axis: 'token-conformance',
      message: `TOKEN CONFORMANCE DID NOT RUN AT ALL — ${reason ?? `no token file at ${path}`}. Every type and motion value on this page is unmeasured, not conforming.`,
    });
    return gaps;
  }
  for (const [group, label] of Object.entries(GROUP_LABELS)) {
    if (!tokens?.[group]?.present) {
      gaps.push({
        axis: `token-conformance:${group}`,
        message: `${label} conformance — ${path} declares no ${label} tokens, so nothing was compared. Silence here is absence of a standard, not conformance to one.`,
      });
    }
  }
  if (Object.values(measurements).some((m) => m?.motion && m.motion.animationsApi === false)) {
    gaps.push({
      axis: 'motion:api',
      message: 'motion — document.getAnimations() is not available in this browser, so no animation was read',
    });
  }

  // Pairs the contrast check could not read. They were `continue`d with no counter and no entry
  // anywhere, so an unreadable-colour page was indistinguishable from a page with nothing to
  // report — silence read as coverage, which is the failure this list exists to prevent.
  const skipped = [];
  let skippedTotal = 0;
  let darkCanvas = false;
  for (const [tag, m] of Object.entries(measurements)) {
    const pairs = m?.contrastPairs ?? [];
    const n = pairs.filter((p) => !pairColors(p)).length;
    if (m?.canvas?.usedDark) darkCanvas = true;
    if (n > 0) {
      skipped.push(`${tag}: ${n} of ${pairs.length}`);
      skippedTotal += n;
    }
  }
  if (skippedTotal > 0) {
    gaps.push({
      axis: 'text-contrast',
      message:
        `text contrast — ${skippedTotal} text/background pair(s) were NOT measured because a colour could ` +
        `not be read (${skipped.join(', ')}). Causes: a CSS Color 4 serialization this probe's parseRgb ` +
        'refuses' +
        (darkCanvas
          ? ', and a dark used colour scheme, where the UA canvas colour is not knowable from computed style and is not guessed'
          : '') +
        '. These pairs produced no finding, which is not the same as passing.',
    });
  }
  return gaps;
}

/**
 * Everything this run did not check, as a list a reviewer can read. The token-derived entries are
 * the load-bearing ones: a token file that does not govern a property produces NO findings for it,
 * and without this list that silence is indistinguishable from conformance.
 *
 * RENDERS `coverageGaps()` — it does not re-derive them. Two answers to "what did not run", one
 * feeding the prose and one feeding the exit code, is the shape this repo names in five places and
 * is exactly how the p2/p1 defect above survived: a finder and a verdict that disagreed.
 */
export function uncheckedFor(tokens, opts = {}) {
  const gaps = coverageGaps({ ...opts, tokens });
  return [...gaps.map((g) => g.message), ...UNCHECKED_ALWAYS];
}

/**
 * The artifact a reviewer with no browser and no shell reads. Pure, so its shape is pinned by a
 * test rather than by a run. `exit` is written into the file on purpose: the three-state exit is the
 * reason a blind probe cannot report a clean run, and a reader of the JSON alone must be able to see
 * which of the three states produced it.
 */
export function buildArtifact({ url, tokens, result, refused = null, generatedAt = new Date().toISOString() }) {
  // Gaps are DERIVED here, never taken from the caller, so no call site can omit them and fall
  // back to the passing verdict this state exists to prevent.
  const gaps = refused
    ? []
    : coverageGaps({
        tokens: tokens?.index ?? null,
        loaded: tokens?.loaded ?? false,
        path: tokens?.path,
        reason: tokens?.reason,
        measurements: result?.measurements ?? {},
      });
  // FOUR states, and the order of the tests is the precedence. A refusal outranks everything: it
  // measured nothing. A blocking finding outranks incompleteness, because a run that already has
  // work to do gains nothing from being told its coverage was partial — the gaps are in the
  // artifact either way, and they surface as state 3 on the re-run that clears the findings.
  const exit = refused ? 2 : !result?.ok ? 1 : gaps.length > 0 ? 3 : 0;
  return {
    tool: 'design-probe',
    schema: 3, // 2 -> 3: `gaps` added and `exit` gained a fourth value. A reader keyed on schema 2
    // and switching on `state` would silently mis-read INCOMPLETE as one of the three it knows.
    generatedAt,
    url: url ?? null,
    exit,
    state:
      exit === 2 ? 'REFUSED — could not measure'
        : exit === 1 ? 'MEASURED — failed'
          : exit === 3 ? 'INCOMPLETE — measured, but an axis did not run'
            : 'MEASURED — passed',
    refused: refused ? { message: refused.message, code: refused.code ?? null } : null,
    // The axes this run could have covered and did not. Empty is the only shape that permits
    // exit 0, so a reader can check the verdict against its own coverage without leaving the file.
    gaps,
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

  // A TOKEN FILE THIS CANNOT READ IS A REFUSAL, NOT A CLEAN RUN — added 2026-08-29, and this is
  // the second half of the same defect as the severity above. `loadTokens` never throws by design,
  // so a missing or unparseable file degraded every group to `present: false`, `conform()` returned
  // `checked: false`, and the run produced zero findings, `ok: true`, exit 0, `state: "MEASURED —
  // passed"`. Reproduced with `--tokens design/tokens/NOPE.json`. The reason DID reach
  // `unchecked[0]` and `tokens.loaded: false`, so it was disclosed — and the two fields a machine
  // or a skimming reader acts on, `exit` and `state`, both said passed. This file's own contract
  // is that a probe which cannot see refuses; it held on the browser axis and not on this one.
  //
  // Checked BEFORE the browser is resolved on purpose: it is deterministic, it costs nothing, and
  // when both are broken the token reason is the one a reader can act on without an escalated lane.
  //
  // THE DELIBERATE CONSEQUENCE: there is no `--no-tokens` opt-out, so this probe cannot run at all
  // against a project with no readable token file. Conformance is half of what it measures, and an
  // opt-out that silences a refusal is the thing contributors learn to reach for — the same
  // reasoning that removed the unsatisfiable checks from the `craft` lens. A project that wants
  // only the WCAG axis should say so by shipping a token file that declares no groups: that file
  // loads, every group reports `present: false`, and the run is INCOMPLETE — exit 3, never a pass.
  // Readable-but-empty and unreadable are different facts and stay different, and NEITHER of them
  // is a pass.
  //
  // THAT LAST CLAUSE WAS FALSE WHEN WRITTEN, and it is the reason `coverageGaps()` exists. It read
  // "the artifact says NOT CHECKED rather than passed", and the artifact said `exit: 0`,
  // `state: "MEASURED — passed"` — so the file's own recommended way to opt out of conformance was
  // also the way to obtain a passing verdict over an unmeasured axis. Disclosure in `unchecked[]`
  // was not enough here for exactly the reason it was not enough for an unreadable file.
  if (!tokens.loaded) {
    const e = new Error(
      `the token file could not be read — ${tokens.reason}. Token conformance is half of this ` +
        'probe; it is refusing rather than reporting a clean run over a standard it never loaded.',
    );
    e.code = 'ENOTOKENS';
    e.tokens = tokens;
    throw e;
  }

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
      const c = resolveContrast(m);
      m.contrastPairs = c.pairs;
      m.canvas = c.canvas;
      m.reflow = Boolean(v.reflow);
      m.deviceScaleFactor = v.dsf ?? 1;
      measurements[v.tag] = m;
      findings.push(...findingsFor(v.tag, m, { tokens: tokens.index, tokensPath: tokens.path }));
      await page.close();
    }
  } finally {
    await browser.close();
  }

  // `ok` still means exactly "no blocking findings" and nothing wider. It is NOT the verdict:
  // `buildArtifact` combines it with coverage, and a run with ok:true and a gap is exit 3, not 0.
  // Kept narrow deliberately — the last time a field in this file quietly meant more than it said,
  // it was `severity: p2`.
  return {
    ok: isPass(findings),
    findings: rank(findings),
    measurements,
    tokens,
    gaps: coverageGaps({ tokens: tokens.index, loaded: tokens.loaded, reason: tokens.reason, path: tokens.path, measurements }),
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
    // ONE artifact, and the process exit code is READ OFF IT rather than computed a second time.
    // `process.exit(r.ok ? 0 : 1)` beside `exit = refused ? 2 : ok ? 0 : 1` in buildArtifact() was
    // two implementations of one mapping, which is how the file and the shell come to disagree.
    const artifact = buildArtifact({ url, tokens: r.tokens, result: r });
    if (outPath) {
      const written = writeArtifact(outPath, artifact);
      console.error(`artifact: ${written}`);
    }
    if (asJson) {
      console.log(JSON.stringify(artifact, null, 2));
    } else {
      for (const f of r.findings) {
        console.log(
          `[${f.severity}] ${f.check}${f.property ? `/${f.property}` : ''} @${f.viewport}\n    measured: ${f.measured}\n    standard: ${f.standard}${f.note ? `\n    note: ${f.note}` : ''}`,
        );
      }
      console.log(`\ntokens: ${r.tokens.path} — ${r.tokens.loaded ? 'loaded' : `NOT LOADED (${r.tokens.reason})`}`);
      console.log(`\nNOT CHECKED (declared, not assumed covered):\n${r.unchecked.map((u) => `  · ${u}`).join('\n')}`);
      // The closing line is read off the artifact's own state, so the words a human sees and the
      // code a machine reads cannot say different things.
      console.log(
        artifact.exit === 0
          ? '\n✓ no blocking findings, and every axis was measured'
          : artifact.exit === 3
            ? `\n! INCOMPLETE — no blocking findings, but ${artifact.gaps.length} axis/axes did not run. This is NOT a pass:\n${artifact.gaps.map((g) => `    · ${g.axis}`).join('\n')}`
            : `\n✗ ${blocking(r.findings).length} blocking finding(s)`,
      );
    }
    process.exit(artifact.exit);
  } catch (e) {
    // The refusal is written to the artifact too. A reviewer reading only the JSON must not be able
    // to mistake "no findings" for "measured and clean" — that is the whole point of exit 2.
    const artifact = buildArtifact({ url, tokens: e.tokens ?? loadTokens(tokensPath), result: null, refused: e });
    if (outPath) {
      try {
        writeArtifact(outPath, artifact);
      } catch (w) {
        console.error(`could not write the refusal artifact: ${w.message}`);
      }
    }
    console.error(`design-probe REFUSED: ${e.message}`);
    process.exit(artifact.exit); // 2 = could not measure. Distinct from 1 = measured and failed.
  }
}
/* c8 ignore stop */
