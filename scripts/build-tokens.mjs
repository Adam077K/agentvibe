#!/usr/bin/env node
// POSTURE: BLOCKS (in --check mode). `npm run check:tokens`.
//
// scripts/build-tokens.mjs — the design system's manufacturing step.
//
// ── WHAT IS DERIVED, WHAT IS CARRIED, WHAT IS COMPUTED ───────────────────────────────────────────
//
//   TYPE      is DERIVED.   Sizes, line-heights and tracking are arithmetic over four seed numbers.
//                           No size is typed anywhere in this repository.
//   COLOUR    is CARRIED.   The hex values pass through unchanged from seeds.json. Nothing about a
//                           palette is generated here, and saying otherwise would be a lie about the
//                           artifact: `design/system/palette.md` is where colour is decided.
//   CONTRAST  is COMPUTED.  Every pair, every run, from the carried colours.
//
// ── WHY THIS GENERATES tokens.json RATHER THAN VALIDATING AN AUTHORED ONE ────────────────────────
//
// `docs/03-system-design/agents/DESIGNER.md` §7.5 lists `design/tokens/tokens.json` as AUTHORED —
// "the only hand-edited file in tokens/". This script deliberately diverges: tokens.json is
// GENERATED from an authored `seeds.json`, and seeds.json is the only hand-edited file.
//
// CONSTRAIN BY INSTRUMENT, NOT BY RULE. A rule can be violated; a generator cannot emit what its
// arithmetic cannot produce. With the ramp derived, a fractional step is INEXPRESSIBLE rather than
// forbidden — there is no keystroke that produces `12.5px`, because no seed value maps to one.
// `docs/03-system-design/DESIGN-CAPABILITY.md` §3.4 states the general form of this move, from Shape
// Up's fat marker: "the robust implementation bans via instrument, not via rule: a rule can be
// violated, a marker width cannot."
//
// The measured defect this closes, taken from mission-control on 2026-08-29: 0 type tokens, 93
// hand-written `text-[Npx]` values across 9 sizes against 1 scale utility, 44 of them fractional,
// and `leading-relaxed` (1.625) applied 27 times across 10-15px where the rule is a curve.
//
// ── EVERY DERIVATION IS SOURCED. NONE IS THIS SCRIPT'S INVENTION ─────────────────────────────────
//
// All four rules come from `docs/03-system-design/DESIGN-CAPABILITY.md` §7.1, which measured them
// against linear.app, stripe.com, vercel.com and play.grafana.org:
//
//   1. UI BAND BY ABSOLUTE INCREMENT. size(i) = base + i*increment. The adjacent ratio is exactly
//      1 + increment/size, which DECREASES monotonically by construction. That is the arithmetic
//      signature measured on linear.app (1 1 1 1 1 1 2), stripe.com (1 1 1 1 2 2 2), vercel.com
//      (1 2 2 2 2 2 2) and play.grafana.org (2). A MODULAR SCALE HOLDS ITS RATIO CONSTANT AND IS
//      THE WRONG MODEL — it was falsified during that research and is not to be reintroduced.
//   2. DISPLAY BAND DERIVED SEPARATELY, same way, larger increment, JOINED BY A JUMP AND NEVER
//      INTERPOLATED. Neither band is derived from the other. Measured display increments:
//      linear 6 8 16 16 · stripe 4 4 6 16 · vercel 32 8.
//   3. LINE-HEIGHT IS A CURVE, peaking near 1.5-1.56 at 16-18px and reaching 1.0 at display sizes.
//   4. TRACKING IS MONOTONE WITH SIZE, positive below ~14px and increasingly negative above.
//
// THE SHAPE OF (3) AND (4) IS SOURCED; THE EXACT FUNCTION IS A FIT. Nothing in the corpus publishes
// a formula — §9.6 of the same document records that "every motion number in every design system
// traces to craft consensus, not measurement", and the typographic curves are no better evidenced.
// So the functions below are chosen to pass through the sourced landmarks and nothing more is
// claimed for them. EVERY CONSTANT LIVES IN seeds.json, never inline, so a disagreement with the
// fit is a one-line edit to an authored file rather than a code change.
//
// ── CONTRAST MATHS: MIRRORED, NOT IMPORTED, AND HERE IS THE MEASUREMENT ──────────────────────────
//
// `scripts/design-probe.mjs` exports `luminance`, `contrast` and `parseRgb`, and importing them
// would be the right move if the file existed. Measured 2026-08-29 in a worktree checked out at
// origin/main (4ddc5c6): `ls scripts/design-probe.mjs` -> No such file or directory. It is untracked
// work in another lane. An import of a file that is not on `main` fails `npm run check` on a fresh
// clone, so `luminance` and `contrast` below are byte-equivalent mirrors of that lane's, and
// `hexToRgb` is new because the probe reads `rgb()` strings out of a browser while seeds.json
// carries hex. WHEN design-probe.mjs LANDS, REPLACE THE MIRROR WITH AN IMPORT — the test file pins
// the two figures that make the swap safe.
//
// The contrast table is computed and never typed, and that is a correction to a dated defect rather
// than a preference. `mission-control/client/src/styles.css` says of its own figures: "re-measured
// on 2026-08-13 after review found every one of them wrong — by 0.06 to 0.3, in both directions ...
// do not carry a figure forward because it was in the comment." A generator cannot carry a figure
// forward.
//
// ── USAGE ───────────────────────────────────────────────────────────────────────────────────────
//
//   node scripts/build-tokens.mjs           # write the four generated files
//   node scripts/build-tokens.mjs --check   # exit 1 on drift, naming what drifted
//
// EXIT CODES, three of them, because "could not build" and "built and disagrees" are different
// facts and collapsing them is how a broken seeds file reads as clean drift:
//   0  built, or checked and in agreement
//   1  --check found drift
//   2  seeds.json is missing, unparseable, or REFUSED by a derivation rule

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_DIR = path.join(ROOT, 'design', 'tokens');

export const SEEDS_PATH = path.join(TOKENS_DIR, 'seeds.json');
export const OUT = {
  json: path.join(TOKENS_DIR, 'tokens.json'),
  css: path.join(TOKENS_DIR, 'tokens.css'),
  ts: path.join(TOKENS_DIR, 'tokens.ts'),
  contrast: path.join(TOKENS_DIR, 'contrast.md'),
};

/** The line every generated file carries. Spelled once so all four cannot disagree. */
export const GENERATED_BANNER = 'GENERATED — do not edit, run `npm run build:tokens`';

/**
 * The measured reference increments, kept as data so a refusal message can cite them rather than
 * assert them. Source: DESIGN-CAPABILITY.md §7.1, five ramps measured 2026-08-29.
 */
export const REFERENCE_INCREMENTS = {
  'linear.app': { ui: [1, 1, 1, 1, 1, 1, 2], display: [6, 8, 16, 16] },
  'stripe.com': { ui: [1, 1, 1, 1, 2, 2, 2], display: [4, 4, 6, 16] },
  'vercel.com': { ui: [1, 2, 2, 2, 2, 2, 2], display: [32, 8] },
  'play.grafana.org': { ui: [2], display: [] },
};

const citeUi = () =>
  Object.entries(REFERENCE_INCREMENTS)
    .map(([site, r]) => `${site} (${r.ui.join(' ')})`)
    .join(' · ');

const citeDisplay = () =>
  Object.entries(REFERENCE_INCREMENTS)
    .filter(([, r]) => r.display.length)
    .map(([site, r]) => `${site} (${r.display.join(' ')})`)
    .join(' · ');

/**
 * The enforced bounds on the leading curve's peak — SOURCED VALUES, WIDENED, AND THE WIDENING IS
 * DISCLOSED. §7.1 gives 1.5-1.56 at 16-18px; enforcing exactly that would make the source's own
 * measurement error budget unrepresentable in an authored file, so each bound is opened by roughly
 * one step. Nothing in the corpus publishes a tolerance, so this one is chosen here and is the
 * weakest constant in the file. It is data rather than an inline literal for that reason: disagree
 * with it by editing this object, where the disagreement is visible.
 */
export const LEADING_BOUNDS = { peak: [1.45, 1.65], peakAt: [15, 19] };

/** A refusal is not a drift and not a crash. It is its own kind and carries its own exit code. */
export class SeedsRefused extends Error {
  constructor(message) {
    super(message);
    this.name = 'SeedsRefused';
  }
}

const refuse = (msg) => {
  throw new SeedsRefused(msg);
};

const isInt = (n) => typeof n === 'number' && Number.isInteger(n);
const round = (n, dp) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

// ── colour ───────────────────────────────────────────────────────────────────────────────────────

/** Mirror of scripts/design-probe.mjs `luminance`. Relative luminance per WCAG 2.x. */
export function luminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Mirror of scripts/design-probe.mjs `contrast`. WCAG 2.x ratio, rounded to 3dp. */
export function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 1000) / 1000;
}

/**
 * New here, and deliberately strict: `#rgb` shorthand is REFUSED rather than expanded. Two
 * spellings of one colour is how a palette acquires a near-duplicate nobody sees, and the seeds
 * file is small enough that the long form costs nothing.
 */
export function hexToRgb(hex) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(String(hex).trim());
  if (!m) return null;
  const h = m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// ── the four derivations ─────────────────────────────────────────────────────────────────────────

/**
 * DERIVATION 1 and 2 — a band by absolute increment. size(i) = base + i*increment.
 *
 * Returns integers, always, because base and increment are validated as integers. There is no
 * arithmetic path here that reaches a fractional size, which is the entire point of the file.
 */
export function band({ base, increment, steps }) {
  const sizes = [];
  for (let i = 0; i < steps; i++) sizes.push(base + i * increment);
  return sizes;
}

/** Adjacent ratios of a band, 3dp. For a constant increment these equal 1 + increment/size. */
export function adjacentRatios(sizes) {
  const out = [];
  for (let i = 1; i < sizes.length; i++) out.push(round(sizes[i] / sizes[i - 1], 3));
  return out;
}

/**
 * DERIVATION 3 — the line-height curve.
 *
 *   leading(s) = peak - (|s - peakAt| / peakAt)^exponent * falloff,  clamped to [1.0, peak]
 *
 * SHAPE SOURCED, FUNCTION FITTED (DESIGN-CAPABILITY.md §7.1: "line-height is a curve peaking near
 * 1.5-1.56 at 16-18px and reaching exactly 1.0 at display sizes"). No source publishes this
 * formula; it is the simplest form that peaks where the sources say and falls away on both sides.
 * The clamp is what makes `leading-relaxed` (1.625) at 12px inexpressible: the curve cannot exceed
 * `peak`, so no seed value produces it.
 */
export function leadingFor(size, { peak, peakAt, falloff, exponent }) {
  const distance = Math.abs(size - peakAt) / peakAt;
  const raw = peak - distance ** exponent * falloff;
  return round(Math.min(peak, Math.max(1, raw)), 3);
}

/**
 * DERIVATION 4 — tracking, monotone with size.
 *
 *   tracking(s) = (zeroAt - s) * slope,  in em
 *
 * SHAPE SOURCED, FUNCTION FITTED (§7.1: "tracking is monotone with size, positive below ~14px and
 * increasingly negative above"). Linear is the simplest function with that property; nothing in the
 * corpus argues for a curve, and a curve would need a constant nobody has measured.
 */
export function trackingFor(size, { zeroAt, slope }) {
  return round((zeroAt - size) * slope, 4);
}

// ── validation: the refusals that make a bad ramp inexpressible ──────────────────────────────────

/**
 * THE TWO POST-CONDITIONS, EXPORTED SO THEY CAN BE DRIVEN DIRECTLY — and the reason is a measured
 * gap, not tidiness. These follow from the validated inputs: a validated seeds file cannot reach
 * either refusal, so a mutation run that DELETES them turns nothing red. Measured 2026-08-29 across
 * 18 mutations of this file: 17 were caught by a test and this one was not, because no input exists
 * that would trip it. That is exactly the shape of an assertion that gets deleted as dead code.
 *
 * They are not dead code. They are tripwires over `band()`: if a future edit makes it emit a
 * fractional size or a ramp that holds its ratio constant, these are what say so. Pulled out as pure
 * functions so a test can hand them the input that seeds.json cannot express, which turns an
 * uncontrolled assertion into a controlled one.
 */
export function assertIntegerSizes(sizes) {
  for (const s of sizes) {
    if (!isInt(s)) refuse(`derived size ${s} is not an integer — band() no longer preserves integers.`);
  }
}

export function assertMonotoneRatios(ratios) {
  for (let i = 1; i < ratios.length; i++) {
    if (ratios[i] >= ratios[i - 1]) {
      refuse(
        `UI adjacent ratios ${ratios.join(' ')} do not decrease monotonically. A constant absolute ` +
          `increment makes them decrease by construction; a ramp that holds its ratio CONSTANT is a ` +
          `MODULAR SCALE, which DESIGN-CAPABILITY.md §7.1 falsified against every measured reference.`
      );
    }
  }
}

/**
 * Every refusal names the measurement it rests on, because the two refusals are NOT equally strong
 * and a caller deserves to know which one it hit.
 *
 *   FRACTIONAL INCREMENT is refused on the strongest evidence in the corpus: no measured reference
 *   uses one, mission-control used +0.5 seven times consecutively, and its adjacent ratios fell
 *   entirely below the reference band.
 *
 *   THE {1,2} CLAMP on the UI band is the WEAKER of the two and says so here. It rests on n=4
 *   references which DESIGN-CAPABILITY.md §6.4 itself flags as "maximally correlated" — Linear,
 *   Stripe and Vercel are the most-imitated design language in developer SaaS. It is the stated
 *   production rule of §7.1 and it is enforced, but a future reader with a fifth measured reference
 *   has grounds to widen it. Widen it there, in this list, not by hand-editing an output.
 */
export function validateSeeds(seeds) {
  if (!seeds || typeof seeds !== 'object') refuse('seeds.json did not parse to an object.');

  const type = seeds.type;
  if (!type || typeof type !== 'object') refuse('seeds.json has no `type` block.');

  for (const [name, spec] of [
    ['ui', type.ui],
    ['display', type.display],
  ]) {
    if (!spec || typeof spec !== 'object') refuse(`seeds.json has no \`type.${name}\` block.`);
    for (const key of ['base', 'increment', 'steps']) {
      if (typeof spec[key] !== 'number' || !Number.isFinite(spec[key])) {
        refuse(`type.${name}.${key} must be a finite number; got ${JSON.stringify(spec[key])}.`);
      }
    }
    if (!isInt(spec.base)) {
      refuse(
        `type.${name}.base is ${spec.base}, which is not an integer. A band whose base is fractional ` +
          `produces fractional sizes at every step. No measured reference has one: ${citeUi()}.`
      );
    }
    if (!isInt(spec.steps) || spec.steps < 1) {
      refuse(`type.${name}.steps must be an integer >= 1; got ${JSON.stringify(spec.steps)}.`);
    }
    if (!isInt(spec.increment)) {
      refuse(
        `type.${name}.increment is ${spec.increment}, which is not an integer. THIS IS THE DEFECT ` +
          `THAT SHIPPED: mission-control's UI band steps by +0.5 seven times consecutively, and its ` +
          `adjacent ratios (1.045 ... 1.037) sit entirely below the reference band, which bottoms out ` +
          `at 1.067. Every measured reference builds its UI band on integer increments — ${citeUi()} — ` +
          `and its display band on integer increments too: ${citeDisplay()}. ` +
          `Source: docs/03-system-design/DESIGN-CAPABILITY.md §7.1.`
      );
    }
    if (spec.base < 1) refuse(`type.${name}.base must be >= 1; got ${spec.base}.`);
  }

  if (![1, 2].includes(type.ui.increment)) {
    refuse(
      `type.ui.increment is ${type.ui.increment}. The UI band steps by +1 or +2 and by nothing else: ` +
        `${citeUi()}. Source: docs/03-system-design/DESIGN-CAPABILITY.md §7.1, "build the UI band by ` +
        `absolute increment (+1 or +2 across 12-20px)". THIS REFUSAL IS THE WEAKER OF THE TWO and ` +
        `rests on n=4 maximally-correlated references (§6.4); if you have a fifth, widen the list in ` +
        `validateSeeds() rather than editing an output.`
    );
  }

  // The display band's job is to be a DIFFERENT band. An increment inside the UI band's range makes
  // it a continuation of the UI band under another name, which is exactly the interpolation §7.1
  // forbids. No upper bound: vercel.com ships +32, so any ceiling below that is already falsified.
  if (type.display.increment < 4) {
    refuse(
      `type.display.increment is ${type.display.increment}. The display band is derived SEPARATELY ` +
        `with a larger increment — measured: ${citeDisplay()} — and an increment of 1-3 makes it a ` +
        `continuation of the UI band rather than a second band. Source: DESIGN-CAPABILITY.md §7.1.`
    );
  }

  const ui = band(type.ui);
  const display = band(type.display);
  assertIntegerSizes([...ui, ...display]);
  const ratios = adjacentRatios(ui);
  assertMonotoneRatios(ratios);

  // THE JOIN. Two bands are joined by a jump, never interpolated. A jump is checkable: the step from
  // the top of the UI band into the display band must be larger than any step inside the UI band.
  const topUi = ui[ui.length - 1];
  const joinRatio = round(display[0] / topUi, 3);
  const widestUiRatio = ratios.length ? Math.max(...ratios) : 1;
  if (display[0] <= topUi) {
    refuse(
      `type.display.base (${display[0]}) is not above the top of the UI band (${topUi}). The bands ` +
        `overlap, so one of them is not a band.`
    );
  }
  if (joinRatio <= widestUiRatio) {
    refuse(
      `the join from ${topUi}px to ${display[0]}px is a ratio of ${joinRatio}, which is no larger than ` +
        `the widest step inside the UI band (${widestUiRatio}). That is an INTERPOLATION between the ` +
        `bands, not a jump. DESIGN-CAPABILITY.md §7.1: "join them with a jump, never interpolate; ` +
        `never derive one band from the other."`
    );
  }

  const lead = type.leading;
  if (!lead || typeof lead !== 'object') refuse('seeds.json has no `type.leading` block.');
  for (const key of ['peak', 'peakAt', 'falloff', 'exponent', 'displayRatio']) {
    if (typeof lead[key] !== 'number' || !Number.isFinite(lead[key])) {
      refuse(`type.leading.${key} must be a finite number; got ${JSON.stringify(lead[key])}.`);
    }
  }
  if (lead.peak < LEADING_BOUNDS.peak[0] || lead.peak > LEADING_BOUNDS.peak[1]) {
    refuse(
      `type.leading.peak is ${lead.peak}, outside [${LEADING_BOUNDS.peak.join(', ')}]. The SOURCED peak is ` +
        `1.5-1.56 at 16-18px (docs/03-system-design/DESIGN-CAPABILITY.md §7.1); the enforced bound is that ` +
        `band widened by ~0.1 in each direction, and THE WIDENING IS THIS SCRIPT'S, not the source's — ` +
        `see LEADING_BOUNDS.`
    );
  }
  if (lead.peakAt < LEADING_BOUNDS.peakAt[0] || lead.peakAt > LEADING_BOUNDS.peakAt[1]) {
    refuse(
      `type.leading.peakAt is ${lead.peakAt}, outside [${LEADING_BOUNDS.peakAt.join(', ')}]. The SOURCED ` +
        `peak sits at 16-18px (§7.1); the enforced bound is that band widened by one pixel in each ` +
        `direction, and THE WIDENING IS THIS SCRIPT'S — see LEADING_BOUNDS.`
    );
  }
  if (lead.exponent <= 0) refuse(`type.leading.exponent must be > 0; got ${lead.exponent}.`);
  if (lead.falloff < 0) refuse(`type.leading.falloff must be >= 0; got ${lead.falloff}.`);
  if (lead.displayRatio < 1 || lead.displayRatio > lead.peak) {
    refuse(
      `type.leading.displayRatio is ${lead.displayRatio}, outside [1, ${lead.peak}]. Display sizes ` +
        `reach 1.0 (§7.1); looser leading on a display size than on body copy inverts the curve.`
    );
  }

  const track = type.tracking;
  if (!track || typeof track !== 'object') refuse('seeds.json has no `type.tracking` block.');
  for (const key of ['zeroAt', 'slope']) {
    if (typeof track[key] !== 'number' || !Number.isFinite(track[key])) {
      refuse(`type.tracking.${key} must be a finite number; got ${JSON.stringify(track[key])}.`);
    }
  }
  if (track.zeroAt <= 0) refuse(`type.tracking.zeroAt must be > 0; got ${track.zeroAt}.`);
  if (track.slope < 0) {
    refuse(
      `type.tracking.slope is ${track.slope}. A negative slope makes tracking NEGATIVE below zeroAt ` +
        `and POSITIVE above, which is the sourced rule inverted (§7.1: "positive below ~14px and ` +
        `increasingly negative above").`
    );
  }

  if (!type.family || typeof type.family !== 'object') refuse('seeds.json has no `type.family` block.');
  for (const key of ['sans', 'mono']) {
    const v = type.family[key];
    const ok = typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) && v.length > 0;
    if (!ok) refuse(`type.family.${key} must be a non-empty string or array of strings.`);
  }

  if (!seeds.color || typeof seeds.color !== 'object') refuse('seeds.json has no `color` block.');
  const colorNames = Object.keys(seeds.color).filter((k) => !k.startsWith('$'));
  if (!colorNames.length) refuse('seeds.json `color` block is empty.');
  for (const name of colorNames) {
    if (!hexToRgb(seeds.color[name])) {
      refuse(
        `color.${name} is ${JSON.stringify(seeds.color[name])}, which is not a 6-digit hex value. ` +
          `Shorthand (#abc) is refused on purpose: two spellings of one colour is how a palette ` +
          `acquires a near-duplicate that nobody sees.`
      );
    }
  }

  const pairs = seeds.contrastPairs;
  if (!Array.isArray(pairs)) refuse('seeds.json `contrastPairs` must be an array.');
  for (const [i, p] of pairs.entries()) {
    for (const side of ['fg', 'bg']) {
      if (!colorNames.includes(p?.[side])) {
        refuse(
          `contrastPairs[${i}].${side} is ${JSON.stringify(p?.[side])}, which is not a colour in the ` +
            `\`color\` block. A contrast pair naming a colour that does not exist would be silently ` +
            `dropped from the table, and a missing row reads exactly like a passing one.`
        );
      }
    }
    if (typeof p.note !== 'string' || !p.note.trim()) {
      refuse(`contrastPairs[${i}] has no \`note\`. A ratio with no stated job cannot be judged by a reader.`);
    }
  }

  return { ui, display, ratios, joinRatio };
}

// ── the model every renderer reads ───────────────────────────────────────────────────────────────

/** Font family as an array of stack members, whatever shape the seed used. */
const familyList = (v) =>
  Array.isArray(v) ? v.slice() : String(v).split(',').map((s) => s.trim()).filter(Boolean);

const familyCss = (v) => familyList(v).join(', ');

/**
 * WCAG 2.x text thresholds, named rather than inlined so `contrast.md` and `tokens.ts` cannot
 * disagree about them. SC 1.4.3 (AA) and SC 1.4.6 (AAA), normal-weight body text.
 */
export const WCAG = { AA: 4.5, AAA: 7 };

export function buildModel(seeds) {
  const { ui, display, ratios, joinRatio } = validateSeeds(seeds);
  const { leading, tracking, family } = seeds.type;

  const step = (bandName, index, size, lineHeight) => ({
    name: `${bandName}-${index}`,
    band: bandName,
    size,
    lineHeight,
    tracking: trackingFor(size, tracking),
  });

  const scale = [
    ...ui.map((s, i) => step('ui', i, s, leadingFor(s, leading))),
    ...display.map((s, i) => step('display', i, s, round(leading.displayRatio, 3))),
  ];

  const colors = Object.keys(seeds.color)
    .filter((k) => !k.startsWith('$'))
    .map((name) => ({ name, hex: seeds.color[name].toLowerCase(), rgb: hexToRgb(seeds.color[name]) }));

  const byName = new Map(colors.map((c) => [c.name, c]));
  const pairs = seeds.contrastPairs.map((p) => {
    const fg = byName.get(p.fg);
    const bg = byName.get(p.bg);
    const ratio = contrast(fg.rgb, bg.rgb);
    return { fg: p.fg, bg: p.bg, note: p.note, fgHex: fg.hex, bgHex: bg.hex, ratio };
  });

  return {
    scale,
    ratios,
    joinRatio,
    colors,
    pairs,
    family: { sans: familyList(family.sans), mono: familyList(family.mono) },
  };
}

// ── renderers ────────────────────────────────────────────────────────────────────────────────────

/**
 * DTCG-shaped, with ONE divergence stated rather than hidden: tracking is emitted as `$type:
 * "number"` carrying an em value, because DTCG's `dimension` type admits only `px` and `rem` and
 * there is no unit for em. Emitting it as a dimension with a made-up unit would be a token file that
 * claims conformance it does not have.
 */
export function renderJson(model, seeds) {
  const dim = (px) => ({ value: px, unit: 'px' });
  const colorValue = (c) => ({
    colorSpace: 'srgb',
    components: c.rgb.map((v) => round(v / 255, 6)),
    alpha: 1,
    hex: c.hex,
  });

  const size = {};
  const lineHeight = {};
  const letterSpacing = {};
  for (const s of model.scale) {
    size[s.name] = { $type: 'dimension', $value: dim(s.size), $description: `${s.band} band, step ${s.name.split('-')[1]}` };
    lineHeight[s.name] = { $type: 'number', $value: s.lineHeight, $description: `derived from the leading curve at ${s.size}px` };
    letterSpacing[s.name] = {
      $type: 'number',
      $value: s.tracking,
      $description: `em; derived from the tracking line at ${s.size}px`,
      $extensions: { 'org.agentvibe.unit': 'em' },
    };
  }

  const color = {};
  for (const c of model.colors) color[c.name] = { $type: 'color', $value: colorValue(c) };

  return {
    $description:
      `${GENERATED_BANNER}. Source: design/tokens/seeds.json. ` +
      'Type is DERIVED by arithmetic, colour is CARRIED unchanged, contrast is COMPUTED (see contrast.md). ' +
      'DTCG-shaped, with one stated divergence: letterSpacing is $type "number" in em, because DTCG dimension admits only px and rem.',
    font: {
      family: {
        sans: { $type: 'fontFamily', $value: model.family.sans },
        mono: { $type: 'fontFamily', $value: model.family.mono },
      },
      size,
      lineHeight,
      letterSpacing,
    },
    color,
    $extensions: {
      'org.agentvibe.seeds': seeds.type,
      'org.agentvibe.uiAdjacentRatios': model.ratios,
      'org.agentvibe.bandJoinRatio': model.joinRatio,
    },
  };
}

export function renderCss(model) {
  const L = [];
  L.push('/* ' + GENERATED_BANNER + '.');
  L.push(' * Source: design/tokens/seeds.json. Type is DERIVED, colour is CARRIED, contrast is COMPUTED.');
  L.push(' * Tailwind v4 reads --text-*, --text-*--line-height, --text-*--letter-spacing, --color-* and');
  L.push(' * --font-* out of @theme and generates the utilities from them, so an arbitrary value like');
  L.push(' * text-[12.5px] is no longer the shortest path to a size — it is the only path to a size that');
  L.push(' * is not in this file. */');
  L.push('@theme {');
  L.push('  /* families */');
  L.push(`  --font-sans: ${familyCss(model.family.sans)};`);
  L.push(`  --font-mono: ${familyCss(model.family.mono)};`);
  L.push('');
  L.push('  /* type — derived. adjacent UI ratios: ' + model.ratios.join(' ') + ' · band join: ' + model.joinRatio + ' */');
  for (const s of model.scale) {
    L.push(`  --text-${s.name}: ${s.size}px;`);
    L.push(`  --text-${s.name}--line-height: ${s.lineHeight};`);
    L.push(`  --text-${s.name}--letter-spacing: ${s.tracking}em;`);
  }
  L.push('');
  L.push('  /* colour — carried unchanged from seeds.json. contrast figures: design/tokens/contrast.md */');
  for (const c of model.colors) L.push(`  --color-${c.name}: ${c.hex};`);
  L.push('}');
  return L.join('\n') + '\n';
}

export function renderTs(model) {
  const L = [];
  L.push('// ' + GENERATED_BANNER + '.');
  L.push('// Source: design/tokens/seeds.json. Type is DERIVED, colour is CARRIED, contrast is COMPUTED.');
  L.push('');
  L.push('export const fontFamily = {');
  L.push(`  sans: ${JSON.stringify(familyCss(model.family.sans))},`);
  L.push(`  mono: ${JSON.stringify(familyCss(model.family.mono))},`);
  L.push('} as const;');
  L.push('');
  L.push('/** Every size in the ramp. There is no other size. */');
  L.push('export const type = {');
  for (const s of model.scale) {
    L.push(
      `  '${s.name}': { size: ${s.size}, lineHeight: ${s.lineHeight}, tracking: ${s.tracking}, band: '${s.band}' },`
    );
  }
  L.push('} as const;');
  L.push('');
  L.push('export const color = {');
  for (const c of model.colors) L.push(`  '${c.name}': '${c.hex}',`);
  L.push('} as const;');
  L.push('');
  L.push('export type TypeToken = keyof typeof type;');
  L.push('export type ColorToken = keyof typeof color;');
  L.push('');
  L.push('/** Adjacent ratios of the UI band, and the jump into the display band. */');
  L.push(`export const uiAdjacentRatios = ${JSON.stringify(model.ratios)} as const;`);
  L.push(`export const bandJoinRatio = ${model.joinRatio};`);
  return L.join('\n') + '\n';
}

/** The one line in the output that is not a function of seeds.json. See DATE_LINE below. */
const datePrefix = '**Computed:** ';

export function renderContrastMd(model, today) {
  const L = [];
  L.push('# Contrast — every pair, computed');
  L.push('');
  L.push('> ' + GENERATED_BANNER + '.');
  L.push('> Source: `design/tokens/seeds.json`. WCAG 2.x relative-luminance ratio, rounded to 3dp.');
  L.push('');
  L.push(datePrefix + today);
  L.push('');
  L.push(
    'Every figure below is recomputed on every run. `mission-control/client/src/styles.css` records ' +
      'what happens otherwise: its contrast figures were "all re-measured on 2026-08-13 after review ' +
      'found every one of them wrong — by 0.06 to 0.3, in both directions". A generator cannot carry a ' +
      'figure forward.'
  );
  L.push('');
  L.push(
    `**The AA and AAA columns apply to TEXT** (WCAG SC 1.4.3, ${WCAG.AA}:1 · SC 1.4.6, ${WCAG.AAA}:1, ` +
      'normal weight). For a pair of surfaces the ratio is the wrong metric entirely — contrast ratio is ' +
      'defined for legibility, and comparing a 1px rule to a full-row fill is a category error. The ' +
      '`note` column says which kind each row is; read it before reading the verdict.'
  );
  L.push('');
  L.push('| fg | bg | fg hex | bg hex | ratio | AA | AAA | note |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const p of model.pairs) {
    L.push(
      `| \`${p.fg}\` | \`${p.bg}\` | \`${p.fgHex}\` | \`${p.bgHex}\` | **${p.ratio.toFixed(3)}:1** | ` +
        `${p.ratio >= WCAG.AA ? 'pass' : 'fail'} | ${p.ratio >= WCAG.AAA ? 'pass' : 'fail'} | ${p.note} |`
    );
  }
  L.push('');
  L.push(`${model.pairs.length} pair(s) over ${model.colors.length} colour(s).`);
  return L.join('\n') + '\n';
}

// ── build / check ────────────────────────────────────────────────────────────────────────────────

export function readSeeds(seedsPath = SEEDS_PATH) {
  let text;
  try {
    text = fs.readFileSync(seedsPath, 'utf8');
  } catch {
    refuse(`${path.relative(ROOT, seedsPath)} does not exist. It is AUTHORED — this script cannot invent it.`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    refuse(`${path.relative(ROOT, seedsPath)} is not valid JSON: ${e.message}`);
  }
}

export function generate(seeds, today) {
  const model = buildModel(seeds);
  return {
    model,
    files: {
      json: JSON.stringify(renderJson(model, seeds), null, 2) + '\n',
      css: renderCss(model),
      ts: renderTs(model),
      contrast: renderContrastMd(model, today),
    },
  };
}

/**
 * THE DATE IS THE ONE BYTE THAT IS NOT A FUNCTION OF THE SEEDS, so it is normalised out before
 * comparison — the same move `scripts/build-skills-manifest.mjs` makes for its `generated` field,
 * for the same reason. Without it, `--check` fails at midnight on a tree nobody touched.
 *
 * The build side carries the mirror of this rule: if the only difference is the date, the existing
 * file is kept byte-for-byte, so a rebuild does not produce a daily diff either.
 */
const DATE_LINE = new RegExp('^' + datePrefix.replace(/[*]/g, '\\$&') + '.*$', 'm');
export const comparable = (text) => String(text).replace(DATE_LINE, datePrefix + 'DATE');

/** Reports WHAT drifted, per file, and for tokens.json down to the changed keys. */
export function drift(files, onDisk) {
  const out = [];
  for (const key of Object.keys(files)) {
    const want = files[key];
    const got = onDisk[key];
    if (got === null || got === undefined) {
      out.push({ key, kind: 'missing', detail: 'the file does not exist' });
      continue;
    }
    if (comparable(got) === comparable(want)) continue;
    out.push({ key, kind: 'changed', detail: describeChange(key, got, want) });
  }
  return out;
}

function flatten(value, prefix = '', acc = new Map()) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, acc);
  } else {
    acc.set(prefix, JSON.stringify(value));
  }
  return acc;
}

function describeChange(key, got, want) {
  if (key === 'json') {
    let a;
    try {
      a = flatten(JSON.parse(got));
    } catch {
      return 'the committed file is not valid JSON';
    }
    const b = flatten(JSON.parse(want));
    const lines = [];
    for (const [k, v] of b) {
      if (!a.has(k)) lines.push(`      + ${k} = ${v}`);
      else if (a.get(k) !== v) lines.push(`      ~ ${k}: ${a.get(k)} -> ${v}`);
    }
    for (const k of a.keys()) if (!b.has(k)) lines.push(`      - ${k} (${a.get(k)})`);
    return lines.length ? `${lines.length} key(s) differ:\n${lines.slice(0, 40).join('\n')}` : 'byte difference outside the key set';
  }
  const gl = String(got).split('\n');
  const wl = String(want).split('\n');
  const lines = [];
  for (let i = 0; i < Math.max(gl.length, wl.length) && lines.length < 12; i++) {
    if (gl[i] === wl[i]) continue;
    if (gl[i] !== undefined) lines.push(`      - ${gl[i]}`);
    if (wl[i] !== undefined) lines.push(`      + ${wl[i]}`);
  }
  return `${lines.length} line(s) differ:\n${lines.join('\n')}`;
}

const readIfPresent = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};

export function run({
  check = false,
  seedsPath = SEEDS_PATH,
  today = new Date().toISOString().slice(0, 10),
  log = console.log,
  err = console.error,
} = {}) {
  const seeds = readSeeds(seedsPath);
  const { files } = generate(seeds, today);
  const onDisk = Object.fromEntries(Object.keys(OUT).map((k) => [k, readIfPresent(OUT[k])]));

  if (check) {
    const findings = drift(files, onDisk);
    if (findings.length) {
      err('✗ design/tokens/ has drifted from design/tokens/seeds.json.');
      err('  Run: npm run build:tokens');
      for (const f of findings) {
        err(`  ${path.relative(ROOT, OUT[f.key])} — ${f.kind}`);
        err(`      ${f.detail.replace(/\n/g, '\n')}`);
      }
      return 1;
    }
    log(`✓ design/tokens/ matches seeds.json — ${Object.keys(files).length} generated file(s) in agreement.`);
    return 0;
  }

  fs.mkdirSync(TOKENS_DIR, { recursive: true });
  let written = 0;
  for (const key of Object.keys(files)) {
    // Keep the byte-identical-modulo-date file, so a rebuild on a later day is not a diff.
    if (onDisk[key] !== null && comparable(onDisk[key]) === comparable(files[key])) continue;
    fs.writeFileSync(OUT[key], files[key]);
    written++;
  }
  log(
    `✓ design/tokens/ built from seeds.json — ${written} of ${Object.keys(files).length} file(s) rewritten` +
      ` (unchanged files are left alone so the date does not churn).`
  );
  return 0;
}

/* c8 ignore start */
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  // `--seeds <path>` exists so the exit codes are testable against a fixture without a test ever
  // writing to design/tokens/seeds.json, which is AUTHORED and is the one file nothing may generate.
  const at = process.argv.indexOf('--seeds');
  const seedsPath = at >= 0 && process.argv[at + 1] ? path.resolve(process.argv[at + 1]) : SEEDS_PATH;
  try {
    process.exit(run({ check: process.argv.includes('--check'), seedsPath }));
  } catch (e) {
    if (e instanceof SeedsRefused) {
      console.error(`build-tokens REFUSED design/tokens/seeds.json:\n  ${e.message}`);
      process.exit(2);
    }
    throw e;
  }
}
/* c8 ignore stop */
