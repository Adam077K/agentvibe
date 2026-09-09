#!/usr/bin/env node
// POSTURE: BLOCKS. The drift check runs as an assertion in scripts/build-tokens.test.mjs, which
// `test:lenses` runs — a STEP of `npm run check` and a step of the CI workflow. `--check` below is
// the same comparison for a human at a terminal; it is deliberately NOT a named npm script, because
// a `check:*` name is a GOVERNED prefix that must be a suite STEP or an EXCLUDED entry, and an
// EXCLUDED script runs in no automated lane at all — the name would have cost an `irreversible`-tier
// edit to scripts/lib/check-suite.js and bought zero coverage.
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
//      1 + increment/size, which DECREASES monotonically by construction. A MODULAR SCALE HOLDS
//      ITS RATIO CONSTANT AND IS THE WRONG MODEL — it was falsified during that research and is
//      not to be reintroduced.
//   2. DISPLAY BAND DERIVED SEPARATELY, same way, larger increment, JOINED BY A JUMP AND NEVER
//      INTERPOLATED. Neither band is derived from the other.
//   3. LINE-HEIGHT IS A CURVE, peaking near 1.5-1.56 at 16-18px and reaching 1.0 at display sizes.
//   4. TRACKING IS MONOTONE WITH SIZE, positive below ~14px and increasingly negative above.
//
// ── THE MEASURED INCREMENTS ARE DELIBERATELY NOT WRITTEN DOWN HERE ───────────────────────────────
//
// Read them off the corpus instead. Verified to run, 2026-08-29, from the repository root:
//
//   for d in design/references/*/; do node -e "const j=require('./$d/measured.json');
//     const s=a=>((a||[]).slice(1).map((v,i)=>+(v-a[i]).toFixed(3)).join(' ')||'(none)');
//     console.log('$d', 'ui', s(j.type.bands.ui.sizes), 'display', s(j.type.bands.display.sizes))"; done
//
// Every refusal in this file already does exactly that: `citeUi()`, `citeDisplay()` and
// `citeBandWidths()` all go through `referenceIncrements()`, which reads design/references/ on
// each call and reports an unreadable reference rather than shrinking `n` in silence.
//
// > **Superseded 2026-08-29.** Rules 1 and 2 above carried a table of increments — "the arithmetic
// > signature measured on linear.app (1 1 1 1 1 1 2), stripe.com (1 1 1 1 2 2 2), vercel.com
// > (1 2 2 2 2 2 2) and play.grafana.org (2)", and "linear 6 8 16 16 · stripe 4 4 6 16 · vercel
// > 32 8". Against the committed corpus, exactly ONE of those seven sub-figures holds — vercel's
// > display `32 8`. Derived with the command above on 2026-08-29:
// >
// >     docs.stripe.com   ui 1 1                          display 5 3 8
// >     linear.app        ui 1 1 1 1 1 1                  display 2 4 8 16 16 8
// >     play.grafana.org  ui 0.6 1.4                      display 1.4 1.4 9.8
// >     stripe.com        ui 1 1 1 1 1 1 1 1 2 2 1 1 2 2  display 16 8
// >     vercel.com        ui 2 2                          display 32 8
// >
// > **AND THE NUMBERS WERE NOT INVENTED — THEY ARE AN ACCURATE QUOTATION OF §7.1, WHICH IS THE
// > SHARPER PROBLEM.** That document carries those exact rows; find the table by what it holds,
// > never by a line number — `grep -n '1 1 1 1 2 2 2' docs/03-system-design/DESIGN-CAPABILITY.md`.
// > It omits docs.stripe.com because that reference did not exist when it was written. So this is
// > not a typo and not a stale copy of the corpus: it is **the source document and this
// > repository's own measurements disagreeing**, with the header presenting the document's figures
// > under the word "measured". §15.16 of that same document already says its unanimity claim is
// > "FALSE as written", and `uiSplit()` below says so to every reader who trips a refusal. The
// > disagreement is left standing in DESIGN-CAPABILITY.md on purpose: reconciling it is a change to
// > the sourced research, not to a generator, and quietly editing a cited document to match code is
// > the worse of the two failures available here.
// >
// > **The provenance is the part worth keeping.** `referenceIncrements()` below already records
// > that this same table "WAS A HAND-WRITTEN CONSTANT AND IT WAS WRONG ON EVERY ENTRY". That fix
// > removed the constant from the REFUSAL PATH and left its twin here, seventy lines above it,
// > still asserted — so the file documented that the table was refuted and went on asserting it in
// > its own header. A correction applied at one site and not at its twin is the shape this
// > repository keeps finding. **The cure is not a corrected table.** Every SOURCE.yml carries
// > `expires: 2026-11-27`, so the corpus WILL be recaptured and a corrected constant rots on that
// > day. A command does not.
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

// The colour arithmetic lives in ONE place now — see scripts/design-lib.mjs for why. Re-exported
// below rather than merely imported, because `build-tokens.test.mjs` imports `luminance` and
// `contrast` from this file and other callers may too.
import { contrast, luminance } from './design-lib.mjs';

export { contrast, luminance };

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

export const REFERENCES_DIR = path.join(ROOT, 'design', 'references');

/**
 * The measured reference increments, DERIVED FROM THE CORPUS ON EVERY CALL rather than typed here.
 *
 * THIS WAS A HAND-WRITTEN CONSTANT AND IT WAS WRONG ON EVERY ENTRY. It was labelled "the measured
 * reference increments" and interpolated verbatim into the refusal a user reads, and it disagreed
 * with `design/references/<slug>/measured.json` — shipped in the same change — on all four sites it
 * named, in both bands, while omitting a fifth reference that exists. Measured 2026-08-29:
 *
 *   site               typed here          measured.json
 *   linear.app         ui 1 1 1 1 1 1 2    ui 1 1 1 1 1 1
 *   stripe.com         ui 1 1 1 1 2 2 2    ui 1 1 1 1 1 1 1 1 2 2 1 1 2 2
 *   vercel.com         ui 1 2 2 2 2 2 2    ui 2 2
 *   play.grafana.org   ui 2                ui 0.6 1.4        <- FRACTIONAL
 *   docs.stripe.com    (absent)            ui 1 1
 *
 * A citation typed by hand is a second copy of the evidence, and a second copy of evidence is a
 * thing that drifts from it silently — which is what happened, in the same diff that added the
 * corpus. Deriving costs one directory read inside a refusal path that is already terminal.
 *
 * Returns `{ sites, integer, fractional, n, source }`. When the corpus cannot be read it returns
 * `n: 0` and a `source` that says so, and `citeUi()` then reports THAT rather than quoting numbers:
 * a citation with no corpus behind it must not look like a citation with one.
 */
export function referenceIncrements(dir = REFERENCES_DIR) {
  const sites = {};
  const unreadable = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
  } catch {
    return { sites, integer: [], fractional: [], n: 0, unreadable, source: `no corpus at ${path.relative(ROOT, dir)}` };
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, e.name, 'measured.json');
    if (!fs.existsSync(file)) continue; // not a reference directory; not evidence and not an error
    let m;
    try {
      m = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (cause) {
      // COUNTED AND NAMED, NEVER SILENTLY SKIPPED. This was a bare `continue`, justified in a
      // comment as "a directory that is not a reference is not evidence, and is not an error
      // either" — true of a directory with NO measured.json, and false of one whose measured.json
      // will not parse. The difference is that the second SHRINKS THE SAMPLE while `n` is quoted
      // to the reader as the sample size ("rests on n=… maximally-correlated references").
      // Measured 2026-08-29 with five directories, three of them malformed: the refusal read
      // "1 of 2 measured reference(s) use integer UI increments" and `source` said
      // "2 reference(s)" — a smaller but equally confident claim, with nothing saying three were
      // dropped. The all-fail branch was explicit and the partial-fail branch was not.
      unreadable.push(`${e.name} (${cause.message.split('\n')[0]})`);
      continue;
    }
    const steps = (sizes) => (sizes ?? []).slice(1).map((v, i) => round(v - sizes[i], 3));
    let host;
    try {
      host = new URL(m.url).hostname.replace(/^www\./, '');
    } catch {
      host = e.name;
    }
    sites[host] = {
      ui: steps(m.type?.bands?.ui?.sizes),
      display: steps(m.type?.bands?.display?.sizes),
      // The ADJACENT RATIOS of the UI band, read rather than recomputed from the increments,
      // because `uiSteps` is what the falsification harness reads and two derivations of one
      // quantity disagree eventually. Used for the floor a fractional-increment refusal cites.
      uiRatios: (m.type?.uiSteps ?? []).map((t) => t.ratio).filter((r) => typeof r === 'number'),
    };
  }
  const names = Object.keys(sites);
  const allRatios = names.flatMap((h) => sites[h].uiRatios);
  return {
    sites,
    integer: names.filter((h) => sites[h].ui.length && sites[h].ui.every(isInt)),
    fractional: names.filter((h) => sites[h].ui.some((d) => !isInt(d))),
    n: names.length,
    // The lowest adjacent UI-band ratio anywhere in the corpus, or null when nothing is readable.
    // NULL RATHER THAN A FALLBACK NUMBER, deliberately: a floor with no corpus behind it must not
    // look like a floor with one, which is the same rule `citeUi()` follows one function down.
    uiRatioFloor: allRatios.length ? Math.min(...allRatios) : null,
    // Always present, empty when the corpus read cleanly. A field that appears only on failure is
    // a field every caller forgets to check.
    unreadable,
    source:
      `${names.length} reference(s) under ${path.relative(ROOT, dir)}` +
      (unreadable.length ? `, and ${unreadable.length} SKIPPED AS UNREADABLE: ${unreadable.join('; ')}` : ''),
  };
}

/**
 * WHAT THE CORPUS ACTUALLY SHOWS, stated so the refusal cannot overclaim.
 *
 * The sentence this replaced was *"Every measured reference builds its UI band on integer
 * increments"*, and `docs/03-system-design/DESIGN-CAPABILITY.md` §15.16 — the same document the
 * refusal cites — says of that exact sentence: **"FALSE as written."** play.grafana.org runs a
 * MULTIPLICATIVE scale off a 14px base, which produces fractional pixels by construction, and this
 * repository's own falsifier returns CONTESTED rather than HELD for the integer-increment rule:
 * `node scripts/extract-reference.mjs --against design/rules/type-scale.rules.json`.
 *
 * So the refusal no longer claims the corpus is unanimous. It reports the split and then says
 * plainly that the refusal is THIS PROJECT'S CHOICE. A rule the evidence merely favours is still a
 * rule worth enforcing; a rule that misdescribes its own evidence teaches the reader something
 * false about four websites and invites them to dismiss the rule when they find out.
 */
const listSites = (pick) => {
  const r = referenceIncrements();
  const rows = Object.entries(r.sites)
    .map(([site, v]) => [site, pick(v)])
    .filter(([, v]) => v.length);
  return { r, text: rows.map(([site, v]) => `${site} (${v.join(' ')})`).join(' · '), rows };
};

/** Every reference's UI increments, by name, exactly as `measured.json` records them. */
const skipNote = (r) =>
  r.unreadable?.length
    ? ` [INCOMPLETE CORPUS: ${r.unreadable.length} reference(s) could not be parsed and are NOT in the ` +
      `figures above — ${r.unreadable.join('; ')}. Every count here, including n, is over what parsed.]`
    : '';

const citeUi = () => {
  const { r, text } = listSites((v) => v.ui);
  if (!r.n) return `NO REFERENCE CORPUS IS READABLE (${r.source}), so this refusal cites no measurement`;
  return `${text}${skipNote(r)}`;
};

/** Every reference's display increments. A reference with fewer than 2 display sizes has none. */
const citeDisplay = () => {
  const { r, text, rows } = listSites((v) => v.display);
  if (!r.n) return `NO REFERENCE CORPUS IS READABLE (${r.source})`;
  return rows.length ? `${text}${skipNote(r)}` : `no reference in the corpus has a display band of 2+ sizes (${r.source})`;
};

/**
 * THE FLOOR THE +0.5 DEFECT FELL BELOW, DERIVED — it used to be the literal `1.067`, and that was
 * the wrong number as well as the wrong shape.
 *
 * `1.067` is linear.app's 15→16, and it was read off the hand-written increment table that
 * `referenceIncrements()` above exists to replace. The measured floor over `type.uiSteps` across
 * the corpus is stripe.com's 21→22. The two errors travelled together because they came from the
 * same table, and the refusal below quoted the figure to a user at the moment it blocked them.
 *
 * SAY WHICH FLOOR. Minimising over `type.steps` instead of `type.uiSteps` spans the display bands
 * and returns a much lower number that mission-control's ratios sit ABOVE — that comparison does
 * not support the refusal. Every mission-control authored size is a UI-band size, so the UI band
 * is the like-for-like set, and it is the one read here.
 */
const citeUiFloor = () => {
  const r = referenceIncrements();
  if (r.uiRatioFloor === null) {
    return `NO REFERENCE CORPUS IS READABLE (${r.source}), so this refusal cites no floor`;
  }
  return `${r.uiRatioFloor}, the lowest adjacent UI-band ratio across ${r.source}`;
};

/**
 * THE SPLIT, STATED RATHER THAN AVERAGED — and this sentence is the whole of finding C3.
 *
 * The refusals below used to read *"Every measured reference builds its UI band on integer
 * increments"*. `docs/03-system-design/DESIGN-CAPABILITY.md` §15.16 — the same document those
 * refusals cite as their source — says of that exact sentence: **"FALSE as written."**
 * play.grafana.org runs a MULTIPLICATIVE scale off a 14px base, which produces fractional pixels by
 * construction, and this repository's own falsifier agrees: the integer-increment rule comes back
 * CONTESTED, not HELD —
 * `node scripts/extract-reference.mjs --against design/rules/type-scale.rules.json`.
 *
 * So the generator refused a fractional increment while citing, as its evidence, a corpus in which
 * one reference measures fractional. The rule is still worth enforcing. What it may not do is
 * misdescribe its own evidence: a reader who checks the citation and finds it overstated has been
 * given a reason to dismiss the rule, and the rule did not need that reason.
 */
const uiSplit = () => {
  const r = referenceIncrements();
  if (!r.n) return `no corpus is readable (${r.source}), so nothing here is measured`;
  if (!r.fractional.length) {
    return `all ${r.n} measured reference(s) use integer UI increments, so the corpus is unanimous on this point`;
  }
  const plural = r.fractional.length === 1 ? 'does not' : 'do not';
  return (
    `${r.integer.length} of ${r.n} measured reference(s) use integer UI increments; ` +
    `${r.fractional.join(', ')} ${plural} — a multiplicative scale off a base produces fractional pixels ` +
    `BY CONSTRUCTION. The falsifier returns CONTESTED for this rule rather than HELD, and ` +
    `DESIGN-CAPABILITY.md §15.16 says "every reference builds its UI band on integer steps" is FALSE ` +
    `as written. SO THIS REFUSAL IS THIS PROJECT'S CHOICE of integer steps, and NOT a claim that ` +
    `every reference obeys it`
  );
};

/**
 * The widest band the corpus actually ships, DERIVED ON EACH CALL for the same reason `citeUi()`
 * is: a hand-typed count is a second copy of the evidence, and this file has already watched one
 * drift from it. Counted as increments + 1, which is what `referenceIncrements()` records.
 */
const citeBandWidths = () => {
  const r = referenceIncrements();
  if (!r.n) return `NO REFERENCE CORPUS IS READABLE (${r.source}), so this ceiling cites no measurement`;
  const widths = Object.entries(r.sites).flatMap(([site, v]) => [
    ...(v.ui.length ? [[`${site} ui`, v.ui.length + 1]] : []),
    ...(v.display.length ? [[`${site} display`, v.display.length + 1]] : []),
  ]);
  if (!widths.length) return `no reference in the corpus has a band of 2+ sizes (${r.source})`;
  const [where, n] = widths.reduce((a, b) => (b[1] > a[1] ? b : a));
  return `the widest band in the corpus is ${where} at ${n} distinct size(s), over ${r.n} reference(s)${skipNote(r)}`;
};

/**
 * THE CEILING ON `steps`, AND IT IS A REFUSAL BECAUSE THE ALTERNATIVE IS NOT A CRASH — IT IS AN
 * ABORT THAT NO `catch` CAN CONVERT.
 *
 * `steps` was validated as an integer >= 1 with no upper bound, and `band()` pushes one element per
 * step before anything else looks at the value. Measured 2026-08-29, `--max-old-space-size=200` so
 * the measurement is fast rather than fatal, reading `$?` directly:
 *
 *   type.ui.steps = 1e9   ->  exit 134  JavaScript heap out of memory (SIGABRT)
 *   type.ui.steps = 1e10  ->  exit 134  JavaScript heap out of memory (SIGABRT)
 *
 * NOT 2, WHICH IS THIS FILE'S CODE FOR "REFUSED BY A DERIVATION RULE", and not the RangeError an
 * over-length array would throw either — V8 aborts on heap exhaustion long before it reaches
 * 2^32-1 elements. That distinction is the reason the bound is here rather than a `try/catch` at
 * the CLI: the process is gone, so the handler that turns SeedsRefused into exit 2 never runs, and
 * a caller reading exit codes sees a signal death where the contract promises a refusal.
 *
 * 64 IS THIS FILE'S CHOICE AND THE MEASUREMENT BEHIND IT IS THE CORPUS. The widest band any
 * measured reference ships is stripe.com's UI band at 15 distinct sizes; the widest arithmetic run
 * `deriveSeeds` fits to one is 10. So 64 is ~4x the widest thing the evidence contains, which is
 * headroom rather than a limit anyone will meet — a design system with 64 sizes in one band has a
 * problem this generator is not the place to solve. Widen it here if a reference ever needs it; do
 * not edit an output. The citation is derived, so it moves when the corpus does.
 */
export const MAX_BAND_STEPS = 64;

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
//
// `luminance` and `contrast` were HERE, described as a "mirror of scripts/design-probe.mjs". They
// are now imported from `./design-lib.mjs` and re-exported at the top of this file, so there is
// nothing left to mirror. `hexToRgb` stays: it is this file's own, has no second copy anywhere, and
// its strictness is a seeds-file policy rather than shared arithmetic.

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
 * The same ratios UNROUNDED — what the monotonicity check compares, and it must never be `round`ed.
 *
 * ROUNDING TO 3dp DESTROYED THE PROPERTY BEING TESTED. `assertMonotoneRatios` was fed
 * `adjacentRatios()`, so a ramp whose ratios genuinely decrease could be refused as a modular scale
 * when two of them happened to round to the same 3dp figure. Reproduced 2026-08-29 with
 * `type.ui = {base: 34, increment: 1, steps: 4}`: true ratios 1.029412 > 1.028571 > 1.027778,
 * strictly decreasing; at 3dp they read `1.029 1.029 1.028`, and the generator exited 2 saying
 * they "do not decrease monotonically". THE MESSAGE TOLD THE AUTHOR SOMETHING FALSE ABOUT THEIR
 * OWN INPUT, which is worse than a refusal with no explanation: it sends them to fix a defect that
 * is not there. 3dp is a presentation choice for tokens.json; it is not the ramp.
 */
export function adjacentRatiosExact(sizes) {
  const out = [];
  for (let i = 1; i < sizes.length; i++) out.push(sizes[i] / sizes[i - 1]);
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
 * gap, not tidiness. These follow from the validated inputs, so a mutation run that DELETES them
 * turns nothing red: measured 2026-08-29 across 18 mutations of this file, 17 were caught by a test
 * and the monotonicity one was not. That is exactly the shape of an assertion somebody deletes as
 * dead code. Pulled out as pure functions so a test can hand them the input that seeds.json cannot
 * express, which turns an uncontrolled assertion into a controlled one.
 *
 * WHY "no input exists that would trip it" IS AN ARGUMENT NOW AND WAS A GUESS THEN. That sentence
 * stood here and it was FALSE when written: `{base: 34, increment: 1, steps: 4}` tripped
 * `assertMonotoneRatios` — three lines, a perfectly ordinary ramp — because the check compared
 * ratios ROUNDED TO 3dp, and 1.029412 and 1.028571 both read 1.029. The claim was not merely
 * unproven; the mutation run that produced it could not have found the counterexample either,
 * because a mutation run explores edits to the code and this was an untried INPUT.
 *
 * The comparison is exact as of the same day (see `adjacentRatiosExact`), and the claim now rests
 * on arithmetic rather than on a survey: for a constant increment d, ratio(i) = 1 + d/s(i), and
 * s(i) strictly increases, so the ratios strictly DECREASE — **in the reals, for every base and
 * every d > 0**.
 *
 * IN float64 THAT IS FALSE ABOVE A BOUND, AND SAYING "for every base" WAS THE SAME CLASS OF ERROR
 * AS THE 3dp ROUNDING IT REPLACED — a claim about numbers that ignored how they are represented,
 * two corrections in a row. `1 + d/s` rounds to exactly 1.0 once `d/s` falls below 2^-53, and
 * `validateSeeds` puts no upper bound on the base. Found by sweep, not by reading, 2026-08-29:
 *
 *   base 11         ratios 1.0909090909090908 1.0833333333333333 1.0769230769230769   decreasing
 *   base 10,000,000 ratios 1.0000001 1.00000009999999 1.00000009999998               decreasing
 *   base 67,114,654 ratios strictly decreasing                                       decreasing
 *   base 67,114,655 ratios 1.0000000148998753 1.0000000148998751 1.0000000148998751  TIE -> exit 2
 *
 * So the honest statement is: the ratios strictly decrease **for every base a font size can take**,
 * and the smallest base at which float64 ties, for increment 1 and 4 steps, is **67,114,655 px** —
 * roughly 8,700 times the width of an 8K display. No accepted seeds file that describes type can
 * reach the refusal.
 *
 * THAT FIGURE IS FROM AN EXHAUSTIVE SCAN OF EVERY INTEGER BASE BELOW IT, NOT FROM A SWEEP, and the
 * distinction earned its place: the first report of this gave 69,200,000 from a stepped sweep, and
 * a bisection to refine it returned 89,013,671 — higher than the value it was refining. Bisection
 * is invalid here because tying is NOT monotonic in the base: 69,100,000 does not tie and
 * 69,200,000 does. Three plausible numbers, two of them wrong, for a property that admits a
 * definite answer. Re-derive rather than trusting the constant:
 *   node -e "for(let b=2;b<7e7;b++){const x=(b+1)/b,y=(b+2)/(b+1),z=(b+3)/(b+2);
 *            if(!(x>y&&y>z)){console.log(b);break}}"
 *
 * NOTE WHAT IS AND IS NOT WRONG AT THAT BASE. The refusal there is CORRECT, not a false message:
 * the float64 ratios genuinely do tie, so the tripwire reports what it actually sees. What was
 * wrong is only the claim that no input could reach it. The base is deliberately left unbounded —
 * adding a ceiling would be a new refusal on an input nobody has, and the bound is more useful
 * written down than enforced.
 *
 * They are still not dead code. They are tripwires over `band()`: if a future edit makes it emit a
 * fractional size or a ramp that holds its ratio constant, these are what say so.
 */
export function assertIntegerSizes(sizes) {
  for (const s of sizes) {
    if (!isInt(s)) refuse(`derived size ${s} is not an integer — band() no longer preserves integers.`);
  }
}

/**
 * THE ONE GRAMMAR A FONT-FAMILY STACK MEMBER MAY HAVE, and it is an ALLOW-LIST on purpose.
 *
 * `renderCss` interpolates the family straight into a declaration inside `@theme { … }`, and CSS
 * has no escaping there — a value is copied to the sink verbatim. Measured 2026-08-29 against the
 * committed seeds with `type.family.sans` set to
 * `x, sans-serif} :root{--color-danger:#00ff00} a{content:"`:
 * the previous check (`typeof v === 'string' && v.trim().length > 0`) ACCEPTED it, the `}` closed
 * `@theme` on its own line, **31 of the 32 emitted declarations landed outside the block**, an
 * attacker-chosen `--color-danger` was live, and the final brace depth was **0** — so the file
 * still parses and the whole generated design system silently stops applying.
 *
 * A BALANCED FILE IS THE FAILURE MODE, WHICH IS WHY "it parses" PROVES NOTHING and why the drift
 * check cannot see this: `drift()` compares the committed output to a fresh generation from the
 * SAME seeds, so poisoned seeds produce a poisoned file the comparison calls correct. The trust
 * boundary is seeds.json — this refusal — not the renderer and not the extractor that suggests a
 * value for a human to paste.
 *
 * TWO CORRECTIONS OVERSHOT IN OPPOSITE DIRECTIONS BEFORE THIS SHAPE, and both are worth keeping.
 *
 * A BLANKET DENY-LIST WAS THE FIRST DESIGN AND IT REFUSED THIS REPO'S OWN SEEDS. Refusing every
 * one of ``; { } / * " ' \`` and newline refuses `'Segoe UI'`, `'SF Mono'`, `'JetBrains Mono'` and
 * `'Fira Code'` — four members of the committed stacks, and the CSS idiom for any family name
 * carrying a space. A quoted string is not the danger: a `}` inside a CSS string does not close a
 * block. An UNTERMINATED or nested quote is.
 *
 * THE ALLOW-LIST THAT REPLACED IT WAS ASCII-ONLY, AND THAT WAS THE OPPOSITE MISTAKE. The quoted
 * branch read `'[A-Za-z0-9 _-]+'`, so it refused valid CSS — measured 2026-08-29:
 *
 *   REFUSED   "微软雅黑", sans-serif            REFUSED   "맑은 고딕", sans-serif
 *   REFUSED   "ヒラギノ角ゴ ProN", sans-serif     REFUSED   "Åkzidenz Grotesk", sans-serif
 *   REFUSED   微软雅黑, sans-serif              <- the UNQUOTED branch had it too
 *
 * The safety argument above never asked for that: the dangerous characters are the ones that end
 * the string or escape out of it, and **a non-ASCII letter is neither**. Latent rather than live —
 * the committed seeds are ASCII — but `build-tokens --check` rides `test:lenses`, a CI step, so
 * the first CJK or accented family would have turned the build red. For a design-token generator
 * that is an ordinary thing to add.
 *
 * So: deny-list too broad, then allow-list too narrow. The shape that is neither is a deny-list
 * SCOPED TO THE QUOTED BRANCH, and Unicode letters admitted in the unquoted one.
 *
 * Admits exactly two shapes, and nothing reaches the sink that is not one of them:
 *   · a quoted name — `'Segoe UI'`, `"SF Mono"`, `"微软雅黑"` — closed, and containing none of
 *     `"` `'` `\` or a control character. Everything else may live inside it, because a CSS string
 *     is a string: `}`, `;` and `/*` inside one close nothing and start nothing.
 *   · unquoted identifiers — `ui-sans-serif`, `-apple-system`, `Segoe UI`, `微软雅黑` — letters,
 *     marks and digits of ANY script plus `_` and `-`, space-separated, with an optional leading
 *     `-`. Unquoted values have no string to protect them, so this branch stays an allow-list.
 *
 * BIDI AND JOINING MARKS ARE DELIBERATELY NOT REFUSED. U+061C, U+200E and U+200F appear in
 * ordinary Arabic and Hebrew text, and refusing them to pre-empt a display-spoofing worry nobody
 * has raised would recreate exactly the defect above, one script over. C0/C1 controls and DEL are
 * refused because they are not text.
 */

/**
 * THE FONT-FAMILY SLOTS, AND WHY `serif` IS OPTIONAL RATHER THAN ABSENT OR REQUIRED.
 *
 * `type.family` was read as `{sans, mono}` and as nothing else. A `serif` key in an authored seeds
 * file was therefore WORSE THAN NO KEY AT ALL: `renderJson` copies `seeds.type` VERBATIM into
 * tokens.json's `$extensions["org.agentvibe.seeds"]`, so the key reached the token file a reader
 * consults, while `renderCss` emitted no `--font-serif` and `renderTs` exported nothing for it.
 * Measured before this slot existed: the family appears in tokens.json and in NEITHER the
 * stylesheet nor the TypeScript, so a reader of the token file concludes a display face is bound
 * when no declaration anywhere binds one. That is the same failure `assertKnownKeys` refuses one
 * level up, and the cure here is the opposite direction: make the slot REAL rather than refuse it.
 *
 * OPTIONAL, NOT REQUIRED, AND THE ASYMMETRY IS DELIBERATE. `sans` and `mono` are required because
 * every generated artifact references both and a missing one is a broken stylesheet. A serif face
 * is a choice a design system may not have made — this repository's own seeds have not made it —
 * so requiring it would refuse every seeds file that ships today. An absent slot emits nothing
 * anywhere, so a seeds file without `serif` generates BYTE-IDENTICALLY to one built before this
 * slot existed. That is checked rather than asserted: `build-tokens --check` rides `test:lenses`.
 *
 * Every renderer iterates THIS LIST rather than naming the slots itself, so a fourth slot is one
 * edit here instead of four edits that can disagree — the rule `paletteNames` states about the
 * colour keys being spelled once, applied to the field beside it.
 */
export const FAMILY_REQUIRED = ['sans', 'mono'];
export const FAMILY_OPTIONAL = ['serif'];
export const FAMILY_SLOTS = [...FAMILY_REQUIRED, ...FAMILY_OPTIONAL];

/** Ends a CSS string or escapes out of it. Nothing else inside a quoted name can reach the sink. */
const QUOTED_FORBIDDEN = '"\'\\\\\\u0000-\\u001F\\u007F-\\u009F';
export const FAMILY_MEMBER = new RegExp(
  `^(?:'[^${QUOTED_FORBIDDEN}]+'|"[^${QUOTED_FORBIDDEN}]+"|-?[\\p{L}\\p{M}_][\\p{L}\\p{M}\\p{N}_-]*(?: +[\\p{L}\\p{M}_][\\p{L}\\p{M}\\p{N}_-]*)*)$`,
  'u'
);

/**
 * Refuse any `type.family.*` value that could leave the declaration it is written into.
 *
 * Splits a string form on `,` the way `familyList` does, so the unit checked here is the unit
 * emitted there. A member carrying a comma inside quotes is refused by the grammar rather than
 * split, so the two cannot disagree about where a member ends.
 */
export function assertFamilySafe(key, value) {
  const members = Array.isArray(value) ? value : String(value).split(',');
  for (const raw of members) {
    const member = String(raw).trim();
    if (!member) {
      refuse(
        `type.family.${key} has an empty stack member. An empty member emits a stray comma into ` +
          `--font-${key}, which is a malformed declaration rather than a font choice.`
      );
    }
    if (!FAMILY_MEMBER.test(member)) {
      refuse(
        `type.family.${key} member ${JSON.stringify(member)} is not a font-family name. This value ` +
          `is interpolated VERBATIM into a declaration inside \`@theme { }\` by renderCss, where CSS ` +
          `offers no escaping: a member carrying \`}\` closes the block, and every declaration after ` +
          `it — 31 of 32, measured 2026-08-29 — is emitted OUTSIDE @theme while the file stays ` +
          `brace-balanced and parses cleanly. The drift check cannot see it, because it compares the ` +
          `committed output against a fresh generation from these same seeds. A stack member is ` +
          `either a QUOTED name whose contents are letters, digits, space, _ and - ('Segoe UI'), or ` +
          `unquoted identifiers (ui-sans-serif, -apple-system, system-ui). Nothing else reaches the ` +
          `stylesheet. seeds.json is the trust boundary; scripts/extract-reference.mjs only SUGGESTS ` +
          `a family read off a remote page, and a suggestion is not a validated input.`
      );
    }
  }
}

/**
 * THE ONE GRAMMAR A COLOUR NAME MAY HAVE — FAMILY_MEMBER's sibling, and it exists because that
 * guard hardened one field into a sink and left the field beside it open.
 *
 * `validateSeeds` ran every colour VALUE through `hexToRgb` and never looked at the KEY. Measured
 * 2026-08-29 against the committed generator: `assertFamilySafe('sans', s)` REFUSES
 * `x, sans-serif} :root{--color-danger:#00ff00} a{content:"`, and the same string as a colour NAME
 * was ACCEPTED, exit 0, four files written. One field into `renderCss`'s sink guarded and its
 * sibling into the same sink not — THE ASYMMETRY IS THE FINDING, not either payload below.
 *
 * A COLOUR NAME REACHES FOUR SINKS IN FOUR LANGUAGES, so a guard scoped to CSS would be the same
 * defect one renderer over:
 *
 *   renderCss         `  --color-${name}: ${hex};`    a CSS custom-property ident, inside @theme
 *   renderTs          `  '${name}': '${hex}',`        a SINGLE-QUOTED TypeScript string key
 *   renderJson        `color[name] = …`               a JavaScript object key
 *   renderContrastMd  `| \`${name}\` | … |`           a cell of a markdown TABLE
 *
 * Both payloads were reproduced verbatim on 2026-08-29 from a seeds file this generator ACCEPTED,
 * and the second is CODE EXECUTION rather than a spoiled stylesheet — design/tokens/tokens.ts is
 * imported by the app build:
 *
 *   name  a: b; } :root{ --color-text:#ff0000 } @media all { --z
 *     ->  --color-a: b; } :root{ --color-text:#ff0000 } @media all { --z: #ff0000;
 *         @theme is closed and :root reopened carrying an attacker-chosen --color-text.
 *
 *   name  x': String(globalThis.__PWNED = 'code-executed') //
 *     ->  'x': String(globalThis.__PWNED = 'code-executed') //': '#ff0000',
 *         evaluating the generated object literal sets globalThis.__PWNED. Confirmed by EXECUTION.
 *
 * `drift()` CANNOT SEE EITHER, for the reason FAMILY_MEMBER already states about its own payload:
 * `--check` compares the committed output against a fresh generation from the SAME seeds, so
 * poisoned seeds yield a poisoned file the comparison calls correct. seeds.json is the trust
 * boundary. A BALANCED FILE IS THE FAILURE MODE here too.
 *
 * WHY THIS IS AN ALLOW-LIST WITH NO QUOTED BRANCH. FAMILY_MEMBER admits two shapes because CSS
 * gives a family name a quoted form, and inside a CSS string `}` and `;` are inert. A colour name
 * has NO quoted form at any of its four sinks — `--color-"x"` is not a custom property — so the
 * only shape available to it is the unquoted one. This is FAMILY_MEMBER's unquoted branch with the
 * space dropped: a space is legal inside a quoted family name and is not a CSS ident code point.
 *
 * NON-ASCII LETTERS ARE ADMITTED, DELIBERATELY, AND THE OPPOSITE DECISION HAS ALREADY BEEN MADE
 * ONCE IN THIS FILE AND WAS WRONG. CSS Syntax Level 3 §4.2 defines an ident code point as "a
 * letter, a digit, U+005F LOW LINE (_), U+002D HYPHEN-MINUS (-), or a non-ASCII code point", so
 * `--color-ミッド` is valid CSS; a TS string key and a markdown cell take any letter too. The
 * ASCII-only allow-list FAMILY_MEMBER once carried refused 微软雅黑, 맑은 고딕 and Åkzidenz
 * Grotesk — all valid CSS — and a palette nameable in one script and unnameable in another is that
 * same defect one field over.
 *
 * AND IT IS STILL NARROWER THAN CSS ALLOWS, on purpose. CSS would take U+00A0 and every other
 * non-ASCII code point, including invisible ones. This grammar takes only letters, marks and
 * digits of any script plus `_` and `-`, so a space, a no-break space and a zero-width joiner are
 * refused — the same line FAMILY_MEMBER's unquoted branch draws, at no cost to any palette.
 */
export const PALETTE_NAME = /^[\p{L}\p{M}\p{N}_-]+$/u;

/**
 * THE CAPS ON AUTHORED SEEDS TEXT — the reconciliation with the extractor's side, stated rather
 * than left to be noticed.
 *
 * `scripts/extract-reference.mjs` caps every string it reads off a remote page at
 * `UNTRUSTED_MAX = 512`. Nothing capped a string on the seeds side, so a 100,000-character colour
 * name and a 200,000-character note both passed straight into four generated files.
 *
 * THE TWO CAPS BOUND DIFFERENT THINGS AND ARE SEPARATE CONSTANTS FOR THAT REASON. The extractor's
 * bounds a QUOTATION from a page nobody here controls. These bound an AUTHORED file, where the
 * grammar above is the defence and the cap only keeps a generated artifact a thing a human can
 * open. Neither is the other's defence and neither should be read as one — UNTRUSTED_MAX says the
 * same about itself.
 *
 * The numbers, measured against the committed seeds.json on 2026-08-29:
 *   colorName  64   longest committed name `line-strong`, 11 characters — ~5.8x headroom.
 *   note       512  longest committed note, 139 characters — ~3.7x headroom, and equal to
 *                   UNTRUSTED_MAX deliberately: seeds.json is where extractor output is pasted by
 *                   hand, and a string the extractor is allowed to EMIT should not fail the gate
 *                   on the other side. `deriveSeeds` emits no `color` block and no `contrastPairs`
 *                   today — checked, not assumed — so that is headroom against a path that does
 *                   not exist yet rather than a live one.
 */
export const SEEDS_TEXT_MAX = { colorName: 64, note: 512 };

/**
 * The colour keys that become tokens. `$`-prefixed keys are seeds-file metadata — seeds.json
 * carries `color.$comment`, which is why no `--color-$comment` appears in tokens.css — and are
 * skipped BEFORE validation and BEFORE rendering.
 *
 * SPELLED ONCE HERE BECAUSE IT WAS SPELLED TWICE: `validateSeeds` and `buildModel` each carried
 * their own `Object.keys(seeds.color).filter((k) => !k.startsWith('$'))`. Two copies of "which
 * keys are tokens" is two answers waiting to disagree, and one direction of that disagreement is
 * the dangerous one — a key validateSeeds skips and buildModel renders reaches all four sinks
 * having been validated by nothing.
 */
export const paletteNames = (color) => Object.keys(color ?? {}).filter((k) => !k.startsWith('$'));

/**
 * Refuse any colour name that could leave the declaration, the string literal, the object key or
 * the table cell it is written into.
 *
 * Three clauses, ONE guard. The `__proto__` clause is not a second mechanism bolted beside the
 * grammar; it is the one case the grammar cannot express, because `__proto__` is spelled entirely
 * in characters a colour name is allowed to use.
 */
export function assertColorNameSafe(name) {
  // Length first, so every message below can interpolate the name without printing 100,000
  // characters of it into a terminal.
  if (name.length > SEEDS_TEXT_MAX.colorName) {
    refuse(
      `color.${name.slice(0, 32)}… is ${name.length} characters, over the ` +
        `${SEEDS_TEXT_MAX.colorName}-character cap; the longest committed name, \`line-strong\`, is 11. ` +
        `THE CAP IS NOT THE DEFENCE — the grammar below it is — it is what keeps four generated ` +
        `files things a human can open. See SEEDS_TEXT_MAX for why it is not the extractor's ` +
        `UNTRUSTED_MAX even where the two numbers agree.`
    );
  }

  if (!PALETTE_NAME.test(name)) {
    refuse(
      `color key ${JSON.stringify(name)} is not a token name. A colour name is interpolated ` +
        `VERBATIM into FOUR sinks in four languages, none of which offers it any escaping: a CSS ` +
        `custom-property ident inside \`@theme { }\` (renderCss), a SINGLE-QUOTED TypeScript string ` +
        `key (renderTs), a JavaScript object key (renderJson) and a markdown TABLE cell ` +
        `(renderContrastMd). Measured 2026-08-29 on this generator before this refusal existed: a ` +
        `name carrying \`}\` closed @theme and reopened :root with an attacker-chosen --color-text, ` +
        `and a name carrying \`'\` closed the TypeScript key and ran an expression — globalThis.__PWNED ` +
        `was set by EVALUATING design/tokens/tokens.ts's own object literal, and that file is ` +
        `imported by the app build. The drift check cannot see either, because it compares the ` +
        `committed output against a fresh generation from these same seeds. A colour name is ` +
        `letters, marks and digits of ANY script plus \`_\` and \`-\` (ink, row-alt, line-strong, ` +
        `ミッド) and nothing else. seeds.json is the trust boundary; this is the same refusal ` +
        `assertFamilySafe makes for the field beside this one.`
    );
  }

  // `__proto__` PASSES the grammar above — it is letters and underscores — and it is the one name
  // whose damage is not escape but DISAGREEMENT BETWEEN ARTIFACTS. `renderJson` builds its palette
  // with `color[c.name] = …`, so this key invokes Object.prototype's `__proto__` SETTER instead of
  // creating a property. Measured 2026-08-29 from a seeds FIXTURE (JSON.parse defines the key, so
  // a real file reaches this where a hand-written object literal would not): the token appears in
  // tokens.css `true`, in tokens.ts `true`, and in tokens.json `FALSE`. Object.prototype itself is
  // NOT polluted — the assignment sets the prototype of one local object — so what ships is two
  // generated files that disagree about what the palette contains, with a drift check that reports
  // both as correct. Refused HERE rather than repaired in renderJson because seeds.json is the
  // trust boundary and because the disagreement has no innocent form: no palette needs this name.
  if (name === '__proto__') {
    refuse(
      `color.__proto__ is not a token name. renderJson builds the palette with \`color[name] = …\`, ` +
        `where this key invokes Object.prototype's \`__proto__\` setter rather than creating a ` +
        `property: measured 2026-08-29, the token is emitted into tokens.css and tokens.ts and is ` +
        `ABSENT from tokens.json, so two generated artifacts disagree about what the palette ` +
        `contains and \`--check\` calls both correct. Object.prototype is not polluted — the damage ` +
        `is the disagreement. It passes the colour-name grammar, being letters and underscores, ` +
        `which is why it is refused by name.`
    );
  }
}

/** Ends a markdown table row, or splits a cell. Nothing else in a note can reach the table. */
export const NOTE_FORBIDDEN = new RegExp('[|\\u0000-\\u001F\\u007F-\\u009F]');

/**
 * Refuse a contrast note that could forge a row of contrast.md.
 *
 * `renderContrastMd` interpolates `note` as the LAST cell of a markdown table row, and markdown
 * offers no escaping there that survives a newline. Measured 2026-08-29 with one note set to
 * "body copy | 99.999 | pass | pass | forged", a newline, then a full hand-written row: the
 * generator emitted a table carrying A FOURTEENTH ROW FOR A PAIR NOBODY AUTHORED, reading
 * `**21.000:1** · pass · pass`. The table is the artifact a reader consults to decide whether a
 * colour pair is legible, so a forged PASS row is the whole of the damage — and the file's own
 * header tells that reader to read the note column "before reading the verdict".
 *
 * A DENY-LIST, NOT AN ALLOW-LIST, AND THAT IS THE OPPOSITE CHOICE FROM THE COLOUR NAME ONE FIELD
 * OVER. A note is PROSE — the committed thirteen carry `Δ`, `—`, `(4.82)`, `;` and parentheses —
 * and an allow-list over prose is how the family guard first refused this repo's own seeds. What
 * ends a row is `|`, CR and LF; a deny-list of exactly those plus the control characters that are
 * not text refuses every committed note zero times.
 *
 * COLOUR NAMES GO INTO THIS TABLE TOO and are NOT re-checked here: `assertColorNameSafe` already
 * refuses `|` and every control character, so a second guard over the same value would be a second
 * answer to one question. If that grammar is ever widened, this is a sink the widening has to be
 * checked against.
 */
export function assertNoteSafe(index, note) {
  if (note.length > SEEDS_TEXT_MAX.note) {
    refuse(
      `contrastPairs[${index}].note is ${note.length} characters, over the ` +
        `${SEEDS_TEXT_MAX.note}-character cap; the longest committed note is 139. The cap bounds the ` +
        `artifact — contrast.md is a table a human reads — and is not the defence against forgery, ` +
        `which is the character check below it.`
    );
  }
  const bad = NOTE_FORBIDDEN.exec(note);
  if (bad) {
    refuse(
      `contrastPairs[${index}].note carries ${JSON.stringify(bad[0])}, which ends or splits a row of ` +
        `contrast.md. The note is the LAST cell of a markdown table row and markdown offers no ` +
        `escaping across a newline: measured 2026-08-29, one note carrying \`|\` and a newline added ` +
        `a row for a pair nobody authored, asserting **21.000:1 · pass · pass**, and that table is ` +
        `what a reader consults to decide whether a pair is legible. Prose is otherwise ` +
        `unrestricted here — only \`|\`, CR, LF and control characters are refused, and the thirteen ` +
        `committed notes carry none of them.`
    );
  }
}

/**
 * Feed this `adjacentRatiosExact()`, never `adjacentRatios()`. See that function for the measured
 * defect. The message prints 6dp, because the case a reader is most likely to hit is two ratios
 * that differ below the 3dp the rest of the file shows — printing 3dp here would reprint the very
 * ambiguity that made the old comparison wrong.
 */
export function assertMonotoneRatios(ratios) {
  for (let i = 1; i < ratios.length; i++) {
    if (ratios[i] >= ratios[i - 1]) {
      refuse(
        `UI adjacent ratios ${ratios.map((r) => round(r, 6)).join(' ')} do not decrease ` +
          `monotonically: ratio ${i + 1} (${round(ratios[i], 6)}) is not below ratio ${i} ` +
          `(${round(ratios[i - 1], 6)}). A constant absolute increment makes them decrease by ` +
          `construction; a ramp that holds its ratio CONSTANT is a MODULAR SCALE, which ` +
          `DESIGN-CAPABILITY.md §7.1 falsified against every measured reference.`
      );
    }
  }
}

/**
 * DECLARE WHAT IS READ, REFUSE THE REST — the rule this repository applied to its CI step parser,
 * here at the KEY rather than at the value.
 *
 * `validateSeeds` read `type`, `color` and `contrastPairs`, and silently accepted anything else.
 * Measured before this refusal existed: a seeds file carrying
 * `motion: {duration: {enter: 200, exit: 150}, easing: {…}}` was ACCEPTED at exit 0 and emitted
 * NOTHING in any of the four generated files — so an author who wrote a motion system into the one
 * hand-edited file in design/tokens/ got a clean build, no motion tokens, and nothing anywhere
 * saying the block had been ignored.
 *
 * A SILENTLY IGNORED KEY IS THE DEFECT THIS FILE ALREADY REFUSES ONE LEVEL DOWN: an authored value
 * that reaches an artifact a reader trusts while binding nothing. The two levels differ in WHERE
 * the ignored key surfaces, and the refusal says which:
 *
 *   top level      read by no derivation and emitted into no artifact. It vanishes.
 *   inside `type`  COPIED VERBATIM into tokens.json's $extensions["org.agentvibe.seeds"] by
 *                  renderJson, so it appears in the token file while no renderer emits it.
 *
 * `$`-PREFIXED KEYS ARE METADATA AND STAY LEGAL. seeds.json carries `$comment` at the top level,
 * inside `type` and inside `color`. `paletteNames` already skips them for the palette; this is the
 * same rule at the two levels above it. A metadata key is not an unread key — being unread is its
 * whole purpose.
 *
 * SCOPED TO THREE LEVELS ON PURPOSE — the top level, `type`, and `type.family`. The numeric blocks
 * (`type.ui`, `type.display`, `type.leading`, `type.tracking`) are already validated field by
 * field, and widening this to them is a separate decision with its own compatibility question.
 * Adding a level is one entry in the object below.
 */
export const SEEDS_KEYS = {
  '': ['type', 'color', 'contrastPairs'],
  type: ['ui', 'display', 'leading', 'tracking', 'family'],
  'type.family': FAMILY_SLOTS,
};

/** Refuse any key at `where` that no derivation reads. `where` is '' for the top level. */
export function assertKnownKeys(where, object) {
  const known = SEEDS_KEYS[where];
  if (!known) refuse(`assertKnownKeys was asked about ${JSON.stringify(where)}, which declares no key list.`);
  const prefix = where ? `${where}.` : '';
  const carried =
    where === ''
      ? 'Nothing carries it anywhere: no derivation reads it and no renderer emits it, so the ' +
        'authored file states a thing the design system does not have. Measured before this ' +
        'refusal existed, a seeds file carrying `motion` with duration and easing blocks was ' +
        'ACCEPTED at exit 0 and appeared in NONE of tokens.json, tokens.css, tokens.ts or ' +
        'contrast.md.'
      : "renderJson copies `seeds.type` VERBATIM into tokens.json's " +
        '$extensions["org.agentvibe.seeds"], so an unknown key here is WORSE THAN AN ABSENT ONE: ' +
        'it reaches the token file a reader consults while no stylesheet declaration and no ' +
        'TypeScript export binds it. That is exactly what `type.family.serif` did before it ' +
        'became a real slot — see FAMILY_SLOTS.';
  for (const key of Object.keys(object)) {
    if (key.startsWith('$')) continue; // seeds-file metadata; seeds.json carries $comment here
    if (known.includes(key)) continue;
    refuse(
      `seeds.json carries \`${prefix}${key}\`, which this generator does not read. ${carried} ` +
        `The keys read at this level are: ${known.join(', ')} (plus any $-prefixed metadata key). ` +
        `A key that is accepted and ignored is indistinguishable, from inside the file, from a key ` +
        `that is honoured. If \`${prefix}${key}\` should mean something, add it to SEEDS_KEYS AND to ` +
        `the derivation that reads it; do not widen the list to silence a refusal.`
    );
  }
}

/**
 * Every refusal names the measurement it rests on, because the two refusals are NOT equally strong
 * and a caller deserves to know which one it hit.
 *
 *   FRACTIONAL INCREMENT is refused on the strongest evidence in the corpus: no measured reference
 *   uses one, mission-control's UI band steps by +0.5 repeatedly, and its adjacent ratios across
 *   those steps fell entirely below the corpus's UI-band ratio floor.
 *
 *   *Superseded 2026-08-29: this read "+0.5 SEVEN times consecutively". It is six — nine authored
 *   sizes admit eight increments — and DESIGN-CAPABILITY.md §7.1's own table printed six two lines
 *   above the prose that said seven. The count is dropped rather than corrected: it carries none of
 *   the refusal's force, and "six" is a constant that rots the next time mission-control's type
 *   changes.*
 *
 *   THE {1,2} CLAMP on the UI band is the WEAKER of the two and says so here. It rests on n=4
 *   references which DESIGN-CAPABILITY.md §6.4 itself flags as "maximally correlated" — Linear,
 *   Stripe and Vercel are the most-imitated design language in developer SaaS. It is the stated
 *   production rule of §7.1 and it is enforced, but a future reader with a fifth measured reference
 *   has grounds to widen it. Widen it there, in this list, not by hand-editing an output.
 */
export function validateSeeds(seeds) {
  if (!seeds || typeof seeds !== 'object') refuse('seeds.json did not parse to an object.');
  assertKnownKeys('', seeds);

  const type = seeds.type;
  if (!type || typeof type !== 'object') refuse('seeds.json has no `type` block.');
  assertKnownKeys('type', type);

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
          `produces fractional sizes at every step. Measured UI increments across the corpus: ` +
          `${citeUi()} — ${uiSplit()}.`
      );
    }
    if (!isInt(spec.steps) || spec.steps < 1) {
      refuse(`type.${name}.steps must be an integer >= 1; got ${JSON.stringify(spec.steps)}.`);
    }
    // BEFORE band(), which allocates one element per step. See MAX_BAND_STEPS: unbounded, this
    // field does not reach a refusal, it reaches exit 134.
    if (spec.steps > MAX_BAND_STEPS) {
      refuse(
        `type.${name}.steps is ${spec.steps}, over the ceiling of ${MAX_BAND_STEPS}. band() allocates ` +
          `one size per step BEFORE any other rule sees the value, so an unbounded steps is not a ` +
          `refusal but a heap-exhaustion ABORT: measured 2026-08-29, steps 1e9 and 1e10 both exit ` +
          `134 (SIGABRT, "JavaScript heap out of memory"), never exit 2, and no catch can convert a ` +
          `signal death into a refusal. The ceiling is this file's choice against the corpus — ` +
          `${citeBandWidths()} — so ${MAX_BAND_STEPS} is roughly 4x the widest band anything measured ` +
          `ships. If a reference needs more, capture it into design/references/ and widen ` +
          `MAX_BAND_STEPS; do not edit an output.`
      );
    }
    if (!isInt(spec.increment)) {
      refuse(
        `type.${name}.increment is ${spec.increment}, which is not an integer. THIS IS THE DEFECT ` +
          `THAT SHIPPED: mission-control's UI band steps by +0.5 repeatedly, and its adjacent ratios ` +
          `across those steps (1.045 ... 1.037) sit entirely below the corpus floor of ` +
          `${citeUiFloor()}. Measured UI increments, per reference: ${citeUi()}. ` +
          `${uiSplit()}. Display increments: ${citeDisplay()}. ` +
          `Source: docs/03-system-design/DESIGN-CAPABILITY.md §7.1 for the rule, §15.16 for the ` +
          `reference that does not obey it, and design/references/ for every figure above — those ` +
          `are read from measured.json on each call, never typed here.`
      );
    }
    if (spec.base < 1) refuse(`type.${name}.base must be >= 1; got ${spec.base}.`);
  }

  if (![1, 2].includes(type.ui.increment)) {
    refuse(
      `type.ui.increment is ${type.ui.increment}. The UI band steps by +1 or +2 and by nothing else: ` +
        `${citeUi()}. Source: docs/03-system-design/DESIGN-CAPABILITY.md §7.1, "build the UI band by ` +
        `absolute increment (+1 or +2 across 12-20px)". THIS REFUSAL IS THE WEAKER OF THE TWO and ` +
        `rests on n=${referenceIncrements().n} maximally-correlated references (§6.4) — of which ` +
        `${uiSplit()}. If you have another, capture it into design/references/ and widen the list in ` +
        `validateSeeds(); do not edit an output. The n is counted from the corpus on each call: it ` +
        `read a hardcoded "n=4" while the corpus held five, which is the same defect as the ` +
        `hardcoded increments this now derives.`
    );
  }

  // The display band's job is to be a DIFFERENT band. An increment inside the UI band's range makes
  // it a continuation of the UI band under another name, which is exactly the interpolation §7.1
  // forbids. No upper bound: vercel.com ships +32, so any ceiling below that is already falsified.
  if (type.display.increment < 4) {
    refuse(
      `type.display.increment is ${type.display.increment}. The display band is derived SEPARATELY ` +
        `with a larger increment — measured: ${citeDisplay()} — and an increment of 1-3 makes it a ` +
        `continuation of the UI band rather than a second band. Note that these figures are the ` +
        `corpus as measured, not a set of values this generator would accept: play.grafana.org's ` +
        `display increments are fractional too. Source: DESIGN-CAPABILITY.md §7.1.`
    );
  }

  const ui = band(type.ui);
  const display = band(type.display);
  assertIntegerSizes([...ui, ...display]);
  const ratios = adjacentRatios(ui);
  // EXACT, not `ratios`. The 3dp series is what the generated files display; comparing it here
  // refused strictly-decreasing ramps as modular scales — see adjacentRatiosExact().
  assertMonotoneRatios(adjacentRatiosExact(ui));

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
  assertKnownKeys('type.family', type.family);
  for (const key of FAMILY_SLOTS) {
    const v = type.family[key];
    // AN ABSENT OPTIONAL SLOT IS NOT AN EMPTY ONE. `serif` may be omitted entirely — see
    // FAMILY_SLOTS — and then nothing is emitted for it in any of the four artifacts.
    // Present-but-empty stays a refusal: an empty stack member emits a stray comma into a live
    // declaration, which is a malformed rule rather than a font choice.
    if (v === undefined && !FAMILY_REQUIRED.includes(key)) continue;
    const ok = typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) && v.length > 0;
    if (!ok) refuse(`type.family.${key} must be a non-empty string or array of strings.`);
    assertFamilySafe(key, v);
  }

  if (!seeds.color || typeof seeds.color !== 'object') refuse('seeds.json has no `color` block.');
  const colorNames = paletteNames(seeds.color);
  if (!colorNames.length) refuse('seeds.json `color` block is empty.');
  for (const name of colorNames) {
    // NAME BEFORE VALUE. Every colour VALUE was validated here and no colour KEY ever was, while
    // the key is interpolated into four sinks and the value into none — see assertColorNameSafe.
    assertColorNameSafe(name);
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
    // "is a non-empty string" was the whole of the note's validation, and the note is the last cell
    // of a markdown table row. See assertNoteSafe for the forged row that fact produced.
    assertNoteSafe(i, p.note);
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

  const colors = paletteNames(seeds.color).map((name) => ({
    name,
    hex: seeds.color[name].toLowerCase(),
    rgb: hexToRgb(seeds.color[name]),
  }));

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
    // Only the slots the seeds file actually declares. An absent optional slot is absent from the
    // model, so every renderer skips it without needing to know which slots are optional — the
    // list is FAMILY_SLOTS and it is spelled once.
    family: Object.fromEntries(
      FAMILY_SLOTS.filter((slot) => family[slot] !== undefined).map((slot) => [slot, familyList(family[slot])])
    ),
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
      family: Object.fromEntries(
        FAMILY_SLOTS.filter((slot) => model.family[slot]).map((slot) => [
          slot,
          { $type: 'fontFamily', $value: model.family[slot] },
        ])
      ),
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
  for (const slot of FAMILY_SLOTS) {
    if (!model.family[slot]) continue;
    L.push(`  --font-${slot}: ${familyCss(model.family[slot])};`);
  }
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
  for (const slot of FAMILY_SLOTS) {
    if (!model.family[slot]) continue;
    L.push(`  ${slot}: ${JSON.stringify(familyCss(model.family[slot]))},`);
  }
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
