// scripts/design-lib.mjs — the ONE copy of the design layer's shared arithmetic.
//
// WHY THIS EXISTS. `build-tokens.mjs`, `extract-reference.mjs` and `design-probe.mjs` were each
// written in a session where the other two were untracked, so each carried its own `luminance` and
// `contrast`, and two of them carried their own `parseRgb` and `resolvePlaywright`. All three
// authors NAMED the duplication in-source and stated its end condition — "when the others land on
// main, delete these and import them". This file is that end condition, discharged.
//
// The duplication was not hypothetical harm. This repo's most-cited failure is two implementations
// of one thing agreeing right up until the incident, and the risk classifier and the CI chain guard
// have both produced it. What made this instance cheap to fix is that it was caught while the
// copies still AGREED: measured 2026-08-29 across ten mission-control colour pairs, all three
// `contrast` implementations returned identical values to the last digit, and all three
// `luminance` implementations were identical bit-for-bit. Collapsing agreeing copies is a
// refactor; collapsing disagreeing ones is an incident with a decision inside it.
//
// ── WHAT IS NOT HERE, AND WHY ───────────────────────────────────────────────────────────────────
//
// `design-probe.mjs` keeps its OWN `parseRgb`. The two copies were NOT equivalent — see the note
// on `parseRgb` below — and collapsing them would have widened what the probe accepts. That is a
// behaviour change to a measurement instrument, which is a decision for whoever owns the probe,
// not a side effect of a deduplication. `scripts/design-lib.test.mjs` pins BOTH behaviours, so the
// divergence is now a recorded, tested exception rather than an unnoticed fork.
//
// ── SCOPE ───────────────────────────────────────────────────────────────────────────────────────
//
// This module holds arithmetic with an EXTERNAL definition (WCAG 2.x) and one module-resolution
// order. It holds no policy, no thresholds and no taste. A rule about what a good contrast ratio
// IS belongs to the caller: `design-probe.mjs` cites WCAG floors, `build-tokens.mjs` reports every
// pair, and `extract-reference.mjs` refuses to judge at all. Putting a threshold here would give
// three instruments one opinion they did not agree to share.
//
// It lives at `scripts/`, not `scripts/lib/`, deliberately: `scripts/lib/**` classifies
// `irreversible` and this is `full`. Verified with `node scripts/classify.mjs`.

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// ── colour ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Relative luminance per WCAG 2.x.
 *
 * The 0.03928 threshold and the 1/12.92 linear segment are the sRGB transfer function as WCAG 2.1
 * states it. WCAG 3 / APCA uses a different curve and would give different numbers; this is 2.x,
 * which is what the accessibility floors cited by the probe are written against.
 */
export function luminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * WCAG 2.x contrast ratio between two rgb triples, rounded to 3dp.
 *
 * SYMMETRIC BY CONSTRUCTION — the brighter of the two is always the numerator, so argument order
 * cannot change a verdict. That property is load-bearing: a caller that passes (bg, fg) by mistake
 * gets the right answer rather than a plausible wrong one, and `design-lib.test.mjs` pins it.
 *
 * THE 3dp ROUNDING IS THE CONTRACT, not an implementation detail. Every contrast figure written
 * into `mission-control/client/src/styles.css` is a 3dp value produced by this function, and
 * `build-tokens.test.mjs` reproduces them. Changing the precision silently invalidates those
 * comments, so it is kept exactly as the three original copies had it.
 */
export function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 1000) / 1000;
}

/**
 * Parse an `rgb()` / `rgba()` string into a triple, or null when it is not one.
 *
 * THIS IS THE PERMISSIVE COPY, and the difference from `design-probe.mjs`'s is measured rather than
 * assumed. Splitting on `[,\s/]+` accepts CSS Color 4 space-separated syntax and a slash-separated
 * alpha; checking only the first three components for NaN accepts a non-numeric alpha. Measured
 * 2026-08-29, the two copies disagree on exactly three shapes:
 *
 *   `rgb(0 0 0)`               → [0,0,0]  here · null in design-probe.mjs
 *   `rgb(11 12 14 / 0.5)`      → [11,12,14] here · null in design-probe.mjs
 *   `rgba(0, 0, 0, var(--a))`  → [0,0,0]  here · null in design-probe.mjs
 *
 * THE BOUND ON THE DIVERGENCE, NARROWED 2026-08-29 BECAUSE THE PREVIOUS ONE WAS FALSE. This said
 * "on every shape where design-probe's copy returns a triple, this one returns the SAME triple —
 * the divergence is one-directional". It is not one-directional, and the difference is not only
 * acceptance. Measured:
 *
 *   `rgb(1 2, 3, 4)`   → [1,2,3] here · [1,3,4] in design-probe.mjs   DIFFERENT TRIPLES
 *   `rgb(1 x, 2, 3)`   → null    here · [1,2,3] in design-probe.mjs   the fork is the PERMISSIVE one
 *
 * Mixed separators do not merely split more permissively, they split DIFFERENTLY: this one treats
 * a space as a separator, so components shift left; design-probe's `parseFloat` reads the leading
 * number of a whitespace-joined chunk and drops the rest. Either can then be the one that returns
 * a value.
 *
 * WHAT IS ACTUALLY TRUE, and it is what the test now checks: **on any value whose components are
 * separated by commas alone, the two return the same result.** That is the entire legacy `rgb()`
 * grammar, and it is the only shape where "superset" was ever the right word. Mixed separators are
 * not valid in either grammar — legacy `rgb()` is comma-separated, modern `rgb()` is
 * space-separated with an optional `/` before alpha — so no live measurement is known to depend on
 * the difference. That is reasoning from the grammar, not a capture: nobody has enumerated what
 * Chromium serialises, and this note claims only what it checked.
 *
 * Both behaviours are pinned in `design-lib.test.mjs`.
 *
 * Alpha is dropped on purpose. A contrast ratio is defined between two opaque colours; compositing
 * a translucent foreground against its actual backdrop is a different calculation, and returning
 * [r,g,b] from `rgba(…, 0.5)` as though it were opaque would overstate the ratio. Callers that
 * need it must composite first. Neither instrument does today.
 */
export function parseRgb(str) {
  const m = String(str).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map((n) => parseFloat(n.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
  return [parts[0], parts[1], parts[2]];
}

// ── browser resolution ──────────────────────────────────────────────────────────────────────────

/**
 * Resolve playwright without hardcoding an absolute path.
 *
 * `.claude/agents/designer.md` pins `/Users/adamks/node_modules/playwright/index.js`, which throws
 * on any other machine and silently degrades the caller to source-only — the exact state that
 * produced two source-only designer runs. Try the normal resolution order, then the known global
 * root, then give up LOUDLY by returning null rather than returning a probe that reports nothing.
 *
 * A null here must never be read as "nothing to report": both callers map it to exit 2, COULD NOT
 * MEASURE, kept distinct from exit 0. That is the callers' contract, not this function's, and it
 * is why this returns null instead of throwing — the caller decides what an absent browser means.
 */
export function resolvePlaywright() {
  const candidates = [
    'playwright',
    `${process.env.HOME ?? ''}/node_modules/playwright/index.js`,
    '/usr/local/lib/node_modules/playwright/index.js',
  ];
  for (const c of candidates) {
    try {
      if (c.startsWith('/') && !existsSync(c)) continue;
      const mod = require(c);
      if (mod?.chromium) return { mod, from: c };
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}
