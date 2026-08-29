#!/usr/bin/env node
// scripts/extract-reference.mjs — measure a real site's design system, and let the measurement
// kill a stated rule.
//
// WHY THIS EXISTS. The founder's direction is that agents derive small design decisions from
// REFERENCES rather than being handed a number. The reference corpus is the only route by which
// taste enters this system — no downstream judge can recover it — so the instrument that reads a
// reference is load-bearing.
//
// It replaces a mechanism that could not be trusted. `.claude/skills/design-mirror/scripts/`
// shipped `scrape_html.sh` and `screenshot.sh`: both require a `BRIGHTDATA_API_KEY` and a
// `BRIGHTDATA_UNLOCKER_ZONE` that appear nowhere else in this repo, and both call `curl -k` —
// TLS verification disabled. A measurement taken over an unverified connection is not a
// measurement. This file does not modify that skill; it is the honest replacement for its
// mechanism.
//
// WHAT IS ACTUALLY NEW HERE, stated so nobody oversells it: extractors that dump a site's
// computed styles already exist and are MIT-licensed (dembrandt, design-extract, designlang).
// What does not exist is a FALSIFICATION HARNESS — a tool that holds a STATED RULE against
// measured references and reports the rule REFUTED when every reference violates it. That is
// `--against`, and it is the reason this file is worth its weight. Three rules died this way
// during the research that commissioned it:
//
//   · "6 sizes = restraint"                       — a count cannot see near-duplicates
//   · "adjacent ratios below 1.125 are a defect"  — EVERY reference violates it
//   · "no display band"                           — a category error; play.grafana.org, a real
//                                                   dashboard, ships `12 14` and nothing else
//
// So the harness must be able to kill the rule its own sibling `design-probe.mjs` enforces
// (MIN_STEP_RATIO = 1.125). It can, and `scripts/extract-reference.test.mjs` proves it does —
// that test is the negative control for the whole idea.
//
// WHAT IT DELIBERATELY DOES NOT DO:
//   · judge whether a reference is GOOD. It reports what a site's system IS. Taste is the
//     founder's selection of the corpus, not this file's arithmetic.
//   · guess. Where a value cannot be honestly fitted it emits `null` and a note saying why.
//     A plausible number with no derivation behind it is the failure mode this repo exists to
//     refuse, and `leading.falloff`/`leading.exponent` are emitted as null for exactly that
//     reason — the contract names them but does not state the curve they parameterise.
//
// LEGAL AND SAFETY POSTURE — non-negotiable, and it is why the old scripts are gone:
//   · logged-out, robots-respecting, low volume, one page at a time. Never logs in.
//   · /robots.txt is fetched and honoured BEFORE any page load. Disallowed → refuse, exit 2.
//   · TLS verification is never disabled.
//   · The risk that bites is CONTRACT, not the CFAA: hiQ won on the CFAA and then LOST on breach
//     of LinkedIn's User Agreement, paid damages, and destroyed the data.
//
// SANDBOX. Chromium is SIGTRAP-killed under the armed sandbox — measured, binary present and
// requireable, launch fails. Capture must run in an escalated lane. Exit codes match
// design-probe.mjs so the two instruments cannot mean different things by the same number:
//
//   0 = measured, and nothing failed
//   1 = measured, and something failed (a rule came back REFUTED)
//   2 = COULD NOT MEASURE — no browser, no launch, or robots said no. Never a clean-looking zero.

// `createRequire` was here solely so `resolvePlaywright` could `require()` a CJS entry point. That
// function moved to `./design-lib.mjs`, which carries its own, so the shim is dead here and is
// removed rather than left as a loaded gun for the next reader.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const TOOL = 'scripts/extract-reference.mjs';

// ── THE DUPLICATION IS RESOLVED, AND THIS IS THE RECORD OF IT ───────────────────────────────────
// `resolvePlaywright`, `parseRgb`, `luminance` and `contrast` were DEFINED HERE, copied because
// `scripts/design-probe.mjs` was untracked as of 4ddc5c6 and a branch importing it would not have
// built from a clean checkout. The note that stood here set the end condition explicitly — "WHEN
// design-probe.mjs LANDS ON main, DELETE THESE FOUR AND IMPORT THEM FROM IT". It has landed, and
// this is that deletion.
//
// They come from `./design-lib.mjs` rather than from `design-probe.mjs`: three files shared this
// arithmetic, not two, and importing an instrument to borrow its maths would have made the probe a
// dependency of the extractor for no reason either one asked for.
//
// ONE OF THE FOUR DID NOT SURVIVE THE CLAIM ABOVE. "byte-equivalent in behaviour" was true of
// `luminance`, `contrast` and `resolvePlaywright` and FALSE of `parseRgb`: design-probe's copy
// splits on `,` alone and rejects a non-numeric alpha, so it returns null where this one returns a
// triple — measured 2026-08-29 on `rgb(0 0 0)`, `rgb(11 12 14 / 0.5)` and `rgba(0, 0, 0, var(--a))`.
// THIS file's copy is the permissive one and is what moved to design-lib; design-probe keeps its
// own, and `scripts/design-lib.test.mjs` pins both. Nothing this file computes changes.
//
// The contrast pins in `scripts/extract-reference.test.mjs` (21:1 black on white, 1:1 for a colour
// on itself) still stand and still run — they now guard the shared copy through this re-export.
import { contrast, luminance, parseRgb, resolvePlaywright } from './design-lib.mjs';

// Re-exported, not merely imported: `extract-reference.test.mjs` imports `luminance` and `parseRgb`
// from this file by name, and removing them would break a caller to save nothing.
export { contrast, luminance, parseRgb, resolvePlaywright };

/**
 * Identities this crawler answers to when reading robots.txt.
 *
 * Standard robots matching picks the ONE most specific group. We deliberately do something
 * stricter: if ANY identity we could plausibly be seen as is disallowed, we refuse. We run a real
 * Chromium under Claude Code, so an operator who name-blocks `ClaudeBot` has expressed a wish
 * about us, whatever the UA header happens to say. Measured during the research that commissioned
 * this file: godly.website carries `Disallow: /` for ClaudeBot by name.
 */
export const UA_TOKENS = ['AgentvibeReferenceExtractor', 'ClaudeBot', '*'];

/** Default freshness window on a captured reference. A measurement of a live site is perishable. */
export const DEFAULT_EXPIRY_DAYS = 90;

// ── robots.txt ──────────────────────────────────────────────────────────────────────────────────

/**
 * Parse robots.txt into groups. Pure — no network.
 *
 * Returns a Map of lowercased user-agent token -> { allow: [], disallow: [], crawlDelay: number|null }.
 * Consecutive `User-agent:` lines share the group that follows them, which is the one part of this
 * format people routinely get wrong.
 */
export function parseRobots(txt) {
  const groups = new Map();
  let pending = [];
  let current = null;

  for (const raw of String(txt).split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      // A user-agent line AFTER rules starts a new group.
      if (current) {
        pending = [];
        current = null;
      }
      pending.push(value.toLowerCase());
      continue;
    }
    if (!pending.length) continue; // a rule with no group above it belongs to nobody

    if (!current) {
      current = { allow: [], disallow: [], crawlDelay: null };
      for (const ua of pending) {
        if (!groups.has(ua)) groups.set(ua, { allow: [], disallow: [], crawlDelay: null });
      }
    }
    for (const ua of pending) {
      const g = groups.get(ua);
      if (field === 'allow' && value) g.allow.push(value);
      else if (field === 'disallow') {
        // `Disallow:` with an EMPTY value means "allow everything" — it is not a path.
        if (value) g.disallow.push(value);
      } else if (field === 'crawl-delay') {
        const n = Number(value);
        if (Number.isFinite(n)) g.crawlDelay = n;
      }
    }
  }
  return groups;
}

/** Does a robots path pattern match this URL path? Supports the `*` and `$` extensions. */
export function robotsPathMatches(pattern, path) {
  const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  let re = esc.replace(/\*/g, '.*');
  let anchored = false;
  if (re.endsWith('\\$')) {
    re = `${re.slice(0, -2)}$`;
    anchored = true;
  }
  return new RegExp(`^${re}${anchored ? '' : ''}`).test(path);
}

/**
 * The verdict for one path, across every identity we could be.
 *
 * Longest matching pattern wins within a group; Allow beats Disallow at equal length, which is the
 * documented tie-break. Across groups we take the most restrictive answer — see UA_TOKENS.
 */
export function robotsVerdict(txt, path, tokens = UA_TOKENS) {
  const groups = parseRobots(txt);
  const decisions = [];
  let crawlDelay = null;

  for (const token of tokens) {
    const g = groups.get(token.toLowerCase());
    if (!g) continue;
    if (g.crawlDelay !== null) crawlDelay = Math.max(crawlDelay ?? 0, g.crawlDelay);

    let best = null;
    for (const p of g.disallow) {
      if (robotsPathMatches(p, path) && (!best || p.length > best.len)) best = { allow: false, len: p.length, rule: `Disallow: ${p}` };
    }
    for (const p of g.allow) {
      if (robotsPathMatches(p, path) && (!best || p.length >= best.len)) best = { allow: true, len: p.length, rule: `Allow: ${p}` };
    }
    if (best) decisions.push({ token, ...best });
  }

  const blocking = decisions.find((d) => !d.allow);
  if (blocking) {
    return { allowed: false, matchedBy: blocking.token, rule: blocking.rule, crawlDelay };
  }
  const permitting = decisions.find((d) => d.allow);
  return {
    allowed: true,
    matchedBy: permitting ? permitting.token : null,
    rule: permitting ? permitting.rule : 'no matching rule — default allow',
    crawlDelay,
  };
}

/**
 * Fetch and evaluate robots.txt. Network. Returns the same shape as robotsVerdict plus `fetched`.
 *
 * A robots.txt that cannot be fetched is NOT treated as permission: 4xx is the documented
 * "no restrictions" case and is allowed, but a network error or a 5xx is UNKNOWN and refuses.
 * A crawler that reads "I could not ask" as "yes" is the crawler that ends up in a contract claim.
 */
export async function checkRobots(url, { tokens = UA_TOKENS, fetchImpl = fetch } = {}) {
  const u = new URL(url);
  const robotsUrl = `${u.origin}/robots.txt`;
  let res;
  try {
    res = await fetchImpl(robotsUrl, { redirect: 'follow', headers: { accept: 'text/plain' } });
  } catch (cause) {
    return { allowed: false, reason: 'unknown', fetched: false, robotsUrl, rule: `could not fetch robots.txt: ${cause.message}`, matchedBy: null, crawlDelay: null };
  }
  if (res.status >= 400 && res.status < 500) {
    return { allowed: true, reason: 'no-robots-published', fetched: true, status: res.status, robotsUrl, rule: `${res.status} — no robots.txt published, default allow`, matchedBy: null, crawlDelay: null };
  }
  if (!res.ok) {
    return { allowed: false, reason: 'unknown', fetched: false, status: res.status, robotsUrl, rule: `robots.txt returned ${res.status} — permission is UNKNOWN, refusing`, matchedBy: null, crawlDelay: null };
  }
  const txt = await res.text();
  const v = robotsVerdict(txt, u.pathname + u.search, tokens);
  return { ...v, reason: v.allowed ? 'allowed' : 'disallowed', fetched: true, status: res.status, robotsUrl };
}

// ── pure analysis ───────────────────────────────────────────────────────────────────────────────

const r3 = (n) => Math.round(n * 1000) / 1000;
const r4 = (n) => Math.round(n * 10000) / 10000;

/** [{value, count}] sorted by value ascending. Accepts a raw array or a value->count object. */
export function distinctWithCounts(input) {
  const counts = new Map();
  if (Array.isArray(input)) {
    for (const v of input) counts.set(v, (counts.get(v) ?? 0) + 1);
  } else {
    for (const [k, v] of Object.entries(input ?? {})) counts.set(Number(k), v);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value: Number(value), count }))
    .filter((e) => Number.isFinite(e.value))
    .sort((a, b) => a.value - b.value);
}

/** Is this increment an integer, within float tolerance? */
export function isIntegerStep(d, tol = 1e-6) {
  return Math.abs(d - Math.round(d)) < tol;
}

/**
 * Adjacent-step analysis over a sorted size list.
 *
 * Reports BOTH the increment and the ratio for every adjacent pair, and whether the increment is
 * an integer. `ratio = 1 + d/s` is asserted here as arithmetic, not as a finding: it is exact by
 * construction, and the research that reported it holding to 3dp across five references was
 * confirming its own arithmetic. What is NOT arithmetic — and is the measurement that matters —
 * is whether d is an integer.
 */
export function rampSteps(sizes) {
  const uniq = [...new Set(sizes.map(Number))].filter((n) => n > 0).sort((a, b) => a - b);
  const steps = [];
  for (let i = 1; i < uniq.length; i++) {
    const from = uniq[i - 1];
    const to = uniq[i];
    const d = r3(to - from);
    steps.push({ from, to, increment: d, ratio: r3(to / from), integer: isIntegerStep(to - from) });
  }
  return steps;
}

/**
 * Fit the best arithmetic run with an INTEGER increment over a set of sizes.
 *
 * "Best" = covers the most measured sizes. Ties break toward higher total usage, then the smaller
 * increment, then the smaller base — stated because a tie-break nobody wrote down is a tie-break
 * that changes between runs.
 *
 * Returns {base, increment, steps, covered, uncoveredInRange} or null when no integer increment
 * reaches two sizes. Null is a real answer here, not a failure: a reference with one rendered size
 * has no ramp, and inventing one would be the guess this file refuses.
 */
export function fitIntegerRamp(entries, { maxIncrement = 24 } = {}) {
  const list = Array.isArray(entries) && typeof entries[0] === 'object' ? entries : distinctWithCounts(entries ?? []);
  const sizes = list.map((e) => e.value);
  const countOf = new Map(list.map((e) => [e.value, e.count ?? 0]));
  const has = (v) => sizes.some((s) => Math.abs(s - v) < 1e-6);
  if (sizes.length < 2) return null;

  let best = null;
  for (let d = 1; d <= maxIncrement; d++) {
    for (const base of sizes) {
      const covered = [];
      for (let v = base; has(v); v += d) covered.push(r3(v));
      if (covered.length < 2) continue;
      const usage = covered.reduce((a, v) => a + (countOf.get(v) ?? 0), 0);
      const cand = { base, increment: d, steps: covered.length, covered, usage };
      if (
        !best ||
        cand.steps > best.steps ||
        (cand.steps === best.steps && cand.usage > best.usage) ||
        (cand.steps === best.steps && cand.usage === best.usage && cand.increment < best.increment) ||
        (cand.steps === best.steps && cand.usage === best.usage && cand.increment === best.increment && cand.base < best.base)
      ) {
        best = cand;
      }
    }
  }
  if (!best) return null;
  const lo = best.covered[0];
  const hi = best.covered[best.covered.length - 1];
  return {
    base: best.base,
    increment: best.increment,
    steps: best.steps,
    covered: best.covered,
    // Sizes INSIDE the fitted range that the fit does not land on. This is where a +0.5 ramp shows
    // itself: mission-control's 11.5/12.5/13.5 sit here against a base-10 increment-1 fit.
    uncoveredInRange: sizes.filter((s) => s > lo && s < hi && !best.covered.some((c) => Math.abs(c - s) < 1e-6)),
  };
}

/**
 * Split the measured sizes into a UI band, a display band, and anything below.
 *
 * The UI band is the best integer arithmetic run — that is where a working interface puts its
 * text, and it is the densest consecutive cluster. Everything strictly above the run's top is the
 * display band. Band membership is by MEASURED size, not by the fit, so a fractional size inside
 * the range stays visible; hiding it behind the fit would defeat the instrument.
 *
 * A reference with no display band is a normal result, not an error — play.grafana.org ships
 * `12 14` and nothing else, which is what killed the "no display band" rule.
 */
export function splitBands(entries, { minCount = 1, minShare = 0 } = {}) {
  const all = Array.isArray(entries) && typeof entries[0] === 'object' ? entries : distinctWithCounts(entries ?? []);
  // THE USAGE FLOOR IS OFF BY DEFAULT AND THAT IS DELIBERATE. Filtering by default would make the
  // instrument quietly disagree with its own measured.json, which is the thing this file exists to
  // stop. But a floor has to be REACHABLE, because without one a size rendered by ONE element sits
  // in the ramp beside a size rendered by 210: measured on play.grafana.org 2026-08-29, 14px
  // carries 53 of 62 text nodes while 11.9, 12, 12.6, 15.4, 18.2 and 28 carry exactly one each, and
  // the fractional increment that made the corpus look interesting came entirely from singletons.
  const total = all.reduce((a, e) => a + (e.count ?? 0), 0);
  const list = minCount > 1 || minShare > 0 ? all.filter((e) => (e.count ?? Infinity) >= minCount && (total === 0 || (e.count ?? 0) / total >= minShare)) : all;
  const dropped = all.filter((e) => !list.includes(e));
  const fit = fitIntegerRamp(list);
  if (!fit) {
    return { ui: list, uiFit: null, display: [], displayFit: null, below: [], dropped };
  }
  const lo = fit.covered[0];
  const hi = fit.covered[fit.covered.length - 1];
  const ui = list.filter((e) => e.value >= lo && e.value <= hi);
  const display = list.filter((e) => e.value > hi);
  const below = list.filter((e) => e.value < lo);
  return { ui, uiFit: fit, display, displayFit: display.length >= 2 ? fitIntegerRamp(display) : null, below, dropped };
}

/**
 * Linear fit of tracking (em) against size (px), then the contract's two parameters.
 *
 * The model the contract implies is `tracking(s) = slope * (zeroAt - s)` — zero at one size,
 * looser below it, tighter above. So a least-squares line `t = b0 + b1*s` gives
 * `slope = -b1` and `zeroAt = -b0/b1`.
 *
 * REFUSES rather than fits when: fewer than 3 distinct sizes carry tracking, the line is flat
 * (b1 ~ 0, so zeroAt is a division by nothing), or r2 is below `minR2`. A regression through
 * noise produces a number, and a number with no fit behind it is worse than null.
 */
export function fitTracking(rows, { minR2 = 0.5, restrictTo = null } = {}) {
  const keep = restrictTo ? new Set(restrictTo.map(Number)) : null;
  const pts = (rows ?? [])
    .filter((r) => Number.isFinite(r.size) && Number.isFinite(r.trackingEm) && (!keep || keep.has(r.size)))
    .map((r) => ({ x: r.size, y: r.trackingEm }));
  const notes = [];
  if (pts.length < 3) {
    return { zeroAt: null, slope: null, r2: null, n: pts.length, notes: [`only ${pts.length} size(s) carry a letter-spacing value; a line needs 3 to be worth fitting`] };
  }
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  const sxx = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  const sxy = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
  if (sxx === 0) return { zeroAt: null, slope: null, r2: null, n, notes: ['every sample sits at one size; the line is undetermined'] };
  const b1 = sxy / sxx;
  const b0 = my - b1 * mx;
  const ssTot = pts.reduce((a, p) => a + (p.y - my) ** 2, 0);
  const ssRes = pts.reduce((a, p) => a + (p.y - (b0 + b1 * p.x)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  if (Math.abs(b1) < 1e-6) {
    // BOTH parameters go null together, deliberately. `slope: 0` with `zeroAt: null` is a pair a
    // consumer cannot evaluate — `slope * (zeroAt - size)` is NaN — so it would hand the generator
    // a value shaped like an answer. The constant this reference actually uses is in the note and
    // in measured.json.
    notes.push(`tracking does not vary with size — it is a constant ${r4(my)}em across all ${n} measured size(s), so there is no zeroAt to find and neither parameter is guessed`);
    return { zeroAt: null, slope: null, r2: r3(r2), n, notes };
  }
  if (r2 < minR2) {
    notes.push(`r2 = ${r3(r2)} is below ${minR2}; the sizes do not lie on a line, so no zeroAt/slope is emitted`);
    return { zeroAt: null, slope: null, r2: r3(r2), n, notes };
  }
  const zeroAt = r3(-b0 / b1);
  // A crossing OUTSIDE the measured sizes is extrapolation, not measurement — and it is how a
  // regression launders noise into a confident number. Measured on linear.app 2026-08-29: fitting
  // all 14 sizes produced `zeroAt: -8.302`, a font size that cannot exist, and it passed the r2
  // test on the way. A parameter the data does not reach is null here, with the line it came from
  // reported so the refusal can be argued with.
  const lo = Math.min(...pts.map((p) => p.x));
  const hi = Math.max(...pts.map((p) => p.x));
  if (zeroAt < lo || zeroAt > hi) {
    notes.push(`the fitted line crosses zero at ${zeroAt}px, outside the measured range ${lo}–${hi}px; that is extrapolation, not measurement, so zeroAt and slope are null (line: tracking = ${r4(b0)} + ${r4(b1)}·size, r2 = ${r3(r2)})`);
    return { zeroAt: null, slope: null, r2: r3(r2), n, notes };
  }
  return { zeroAt, slope: r4(-b1), r2: r3(r2), n, notes };
}

/**
 * The leading curve, fitted only where the data determines it.
 *
 * `peak`/`peakAt` are measurable maxima and are emitted. `displayRatio` is the mean over the
 * display band and is emitted when that band has data.
 *
 * `falloff` and `exponent` are emitted as NULL, always, and this is a deliberate refusal rather
 * than a gap: the seeds contract names the two parameters but does not state the curve they
 * parameterise, and four candidate curves fit the same peak equally well. The full measured table
 * ships in measured.json so the consumer can fit its own model. When the generator's formula is
 * written down, this function fits it — and not before.
 */
export function fitLeading(rows, { displaySizes = [], uiSizes = null, minSamples = 3, minShare = 0.02 } = {}) {
  const pts = (rows ?? []).filter((r) => Number.isFinite(r.size) && Number.isFinite(r.leadingRatio));
  const notes = [
    'falloff and exponent are null because the seeds contract names them without stating the curve they parameterise; the measured leading table is emitted in full so a consumer can fit its own model',
  ];
  if (pts.length < 3) {
    return { peak: null, peakAt: null, falloff: null, exponent: null, displayRatio: null, n: pts.length, notes: [...notes, `only ${pts.length} size(s) carry a resolved line-height; peak is not fitted below 3`] };
  }
  const displaySet = new Set(displaySizes.map(Number));
  // The peak is a property of the UI band. Selecting by "not display" let a size BELOW the band in:
  // measured on vercel.com 2026-08-29, an 11px outlier at ratio 1.818 was reported as the peak
  // while the band itself is 12/14/16. When the caller knows the band, use it.
  const uiSet = uiSizes ? new Set(uiSizes.map(Number)) : null;
  const uiPts = pts.filter((p) => (uiSet ? uiSet.has(p.size) : !displaySet.has(p.size)));
  const source = uiPts.length >= 3 ? uiPts : pts;

  // THE PEAK IS THE MAXIMUM OVER SIZES THE REFERENCE ACTUALLY USES, not over every size that
  // appears once. Measured on linear.app 2026-08-29: the raw maximum was 2.75 at 16px, carried by
  // FOUR elements, while 14px carried 218 elements at 1.714. A raw max reports the decorative
  // outlier as the reference's leading peak, which is the opposite of what the corpus is for.
  // A row with no count is treated as eligible so a hand-written fixture still fits.
  const total = source.reduce((a, p) => a + (p.count ?? 0), 0);
  const eligible = source.filter((p) => p.count === undefined || (p.count >= minSamples && (total === 0 || p.count / total >= minShare)));
  const excluded = source.filter((p) => !eligible.includes(p));
  const basis = eligible.length ? eligible : source;
  if (!eligible.length) notes.push(`no size met the ${minSamples}-sample / ${minShare * 100}%-share floor, so the peak is taken over every measured size and may be an outlier`);
  else if (excluded.length) notes.push(`peak excludes ${excluded.length} under-sampled size(s) (${excluded.map((p) => `${p.size}px n=${p.count}`).join(', ')}) — a size carried by a handful of elements is not this reference's leading`);

  const top = basis.reduce((a, p) => (p.leadingRatio > a.leadingRatio ? p : a), basis[0]);
  const dispPts = pts.filter((p) => displaySet.has(p.size));
  return {
    peak: r3(top.leadingRatio),
    peakAt: top.size,
    falloff: null,
    exponent: null,
    displayRatio: dispPts.length ? r3(dispPts.reduce((a, p) => a + p.leadingRatio, 0) / dispPts.length) : null,
    n: basis.length,
    notes: dispPts.length ? notes : [...notes, 'displayRatio is null: this reference has no display band to average over'],
  };
}

/**
 * Pick the sans and mono stacks a reference actually renders text in.
 *
 * seeds.json carries these as comma-separated CSS stack STRINGS. A stack is classified mono when
 * its own declaration names a monospace family — `monospace`, `ui-monospace`, or a well-known face
 * — because that is what the site itself asserted; guessing from a name we do not recognise would
 * be the invention this file refuses. Both are null when nothing qualifies, and null is a real
 * answer: a page with one stack has no mono face and saying so beats naming its sans one twice.
 */
export function fitFamilies(families) {
  const list = [...(families ?? [])].sort((a, b) => b.count - a.count);
  const isMono = (v) => /\b(monospace|ui-monospace)\b/i.test(v) || /\b(SF ?Mono|Menlo|Consolas|Courier|Berkeley Mono|SourceCodePro|Roboto Mono|IBM Plex Mono|JetBrains Mono)\b/i.test(v);
  const mono = list.find((f) => isMono(f.value));
  const sans = list.find((f) => !isMono(f.value));
  const notes = [];
  if (!sans) notes.push('family: no non-monospace stack was rendered; sans is null rather than filled with the mono stack');
  if (!mono) notes.push('family: no monospace stack was rendered; mono is null rather than guessed');
  return { sans: sans ? sans.value : null, mono: mono ? mono.value : null, notes };
}

/**
 * What `scripts/build-tokens.mjs` will REFUSE, checked here so a human reading this file learns it
 * before pasting rather than from an exit code afterwards.
 *
 * THE MEASURED VALUE IS KEPT, NOT NULLED, and that is a deliberate departure from what the tokens
 * lane suggested. This file is a measurement-derived proposal a person reads; the generator never
 * reads it, and a null here would make the file LIE about the reference to please a validator it
 * does not talk to. So the number stays and the note says exactly what will bounce and why —
 * the human gets the fact and the warning, and the bounce itself is a loud exit 2 either way.
 */
export function consumerRefusals(ui, display, bands) {
  const out = [];
  if (ui.increment !== null && ui.increment !== 1 && ui.increment !== 2) {
    out.push(`WILL BE REFUSED BY build-tokens: ui.increment must be 1 or 2, and this reference measures +${ui.increment}. The measurement is kept; the seeds cannot express it.`);
  }
  if (display && display.increment !== null && display.increment < 4) {
    out.push(`WILL BE REFUSED BY build-tokens: display.increment must be at least 4, and this reference measures +${display.increment}.`);
  }
  if (display && display.base !== null && bands.uiFit) {
    const topUi = bands.ui.length ? bands.ui[bands.ui.length - 1].value : bands.uiFit.covered[bands.uiFit.covered.length - 1];
    const internal = rampSteps(bands.ui.map((e) => e.value));
    const widest = internal.length ? Math.max(...internal.map((s) => s.ratio)) : 0;
    const join = Math.round((display.base / topUi) * 1000) / 1000;
    if (join <= widest) {
      out.push(`WILL BE REFUSED BY build-tokens (THE BAND JOIN): display.base/${topUi} = ${join} is not larger than the widest step inside the ui band (${widest}), so the join reads as an interpolation rather than a jump.`);
    }
  }
  return out;
}

/**
 * Turn a measured reference into the `type` block of design/tokens/seeds.json.
 *
 * Every field is either derived from the measurement or null-with-a-reason. There is no branch in
 * this function that produces a plausible default.
 */
export function deriveSeeds(measured, { minCount = 1, minShare = 0 } = {}) {
  const notes = [];
  const sizes = measured?.type?.sizes ?? [];
  const bands = splitBands(sizes, { minCount, minShare });
  if (bands.dropped?.length) {
    notes.push(`usage floor (minCount=${minCount}, minShare=${minShare}) excluded ${bands.dropped.length} size(s) from the fit: ${bands.dropped.map((e) => `${e.value}px n=${e.count}`).join(', ')} — they remain in measured.json`);
  }

  let ui = { base: null, increment: null, steps: null };
  if (bands.uiFit) {
    ui = { base: bands.uiFit.base, increment: bands.uiFit.increment, steps: bands.uiFit.steps };
    if (bands.uiFit.uncoveredInRange.length) {
      // Two different facts, and conflating them was a real defect in this file: a size can sit off
      // the fitted ramp while still being an integer. stripe.com renders 9 and 11 beside a +2 ramp
      // from 8 — off the ramp, not fractional. mission-control renders 11.5 — both.
      const fractional = bands.uiFit.uncoveredInRange.filter((v) => !isIntegerStep(v));
      notes.push(
        `ui: ${bands.uiFit.uncoveredInRange.length} measured size(s) inside the fitted range do not sit on the +${bands.uiFit.increment} ramp (${bands.uiFit.uncoveredInRange.join(', ')})` +
          (fractional.length ? `, of which ${fractional.join(', ')} are fractional sizes` : ' — all of them integer sizes, so the reference has more than one ramp rather than a fractional one'),
      );
    }
  } else {
    notes.push(`ui: no integer increment fits ${sizes.length} distinct size(s); base/increment/steps are null rather than guessed`);
  }

  let display = null;
  if (bands.display.length === 1) {
    display = { base: bands.display[0].value, increment: null, steps: 1 };
    notes.push('display: one size above the ui band, so increment is undetermined by the data and is null — a single point fixes no spacing');
  } else if (bands.display.length >= 2) {
    const f = bands.displayFit;
    display = f
      ? { base: f.base, increment: f.increment, steps: f.steps }
      : { base: bands.display[0].value, increment: null, steps: bands.display.length };
    if (!f) notes.push('display: no integer increment fits the display sizes; increment is null');
    else {
      // A display band is usually geometric, not arithmetic, so the best arithmetic run can cover
      // a minority of it and still look tidy. Measured on linear.app 2026-08-29: 24/48/72 is a
      // genuine run and it leaves 18, 20, 32 and 64 outside. Say what the fit does not reach.
      const missed = bands.display.map((e) => e.value).filter((v) => !f.covered.some((c) => Math.abs(c - v) < 1e-6));
      if (missed.length) {
        notes.push(`display: the +${f.increment} run from ${f.base} covers ${f.steps} of ${bands.display.length} measured display size(s); ${missed.join(', ')} ${missed.length === 1 ? 'sits' : 'sit'} outside it. Display bands are commonly geometric — treat this arithmetic fit as a suggestion, not a description.`);
      }
    }
  } else {
    notes.push('display: NO DISPLAY BAND — every measured size sits in the ui band. This is a real result, not a gap; play.grafana.org ships 12 and 14 and nothing else.');
  }

  if (bands.below.length) {
    notes.push(`below the ui band and not modelled by these seeds: ${bands.below.map((e) => e.value).join(', ')}`);
  }

  const leading = fitLeading(measured?.type?.leading ?? [], { displaySizes: bands.display.map((e) => e.value), uiSizes: bands.ui.map((e) => e.value) });
  // Tracking is fitted over the UI band ONLY. The seeds contract carries a single zeroAt/slope
  // pair, and display type routinely uses one flat negative value that has nothing to do with the
  // UI ramp — folding it in drags the line until the crossing leaves the data entirely.
  const tracking = fitTracking(measured?.type?.tracking ?? [], { restrictTo: bands.ui.map((e) => e.value) });
  notes.push(...leading.notes.map((n) => `leading: ${n}`), ...tracking.notes.map((n) => `tracking: ${n}`));

  const family = fitFamilies(measured?.type?.families ?? []);
  notes.push(...family.notes);
  notes.push(...consumerRefusals(ui, display, bands));

  return {
    type: {
      ui,
      display,
      leading: { peak: leading.peak, peakAt: leading.peakAt, falloff: leading.falloff, exponent: leading.exponent, displayRatio: leading.displayRatio },
      tracking: { zeroAt: tracking.zeroAt, slope: tracking.slope },
      family: { sans: family.sans, mono: family.mono },
    },
    notes,
  };
}

// ── the falsification harness ───────────────────────────────────────────────────────────────────

/**
 * Rule kinds this harness can evaluate. An unknown kind is REFUSED, never passed — a harness that
 * silently ignores the rule it was handed reports a clean sweep it did not run.
 */
export const RULE_KINDS = ['min-adjacent-ratio', 'max-adjacent-ratio', 'max-distinct-sizes', 'min-distinct-sizes', 'integer-increments', 'increment-in', 'requires-band', 'forbids-band'];

function bandOf(measured, which, floor = {}) {
  const bands = splitBands(measured?.type?.sizes ?? [], floor);
  if (which === 'display') return bands.display;
  if (which === 'all') return [...bands.below, ...bands.ui, ...bands.display];
  return bands.ui;
}

/** Evaluate one rule against one measured reference. CONFORMS | VIOLATES | UNMEASURED. */
export function evaluateRule(rule, ref) {
  const which = rule.band ?? 'ui';
  // A rule may state its own usage floor — "over sizes this reference actually uses" is a different
  // and often better rule than "over every size that appears once", and both must be sayable.
  const floor = { minCount: rule.minCount ?? 1, minShare: rule.minShare ?? 0 };
  const band = bandOf(ref.measured, which, floor);
  const sizes = band.map((e) => e.value);
  const steps = rampSteps(sizes);

  const unmeasured = (why) => ({ reference: ref.slug, verdict: 'UNMEASURED', measured: why });

  switch (rule.kind) {
    case 'min-adjacent-ratio': {
      if (steps.length === 0) return unmeasured(`the ${which} band has fewer than 2 sizes`);
      const bad = steps.filter((s) => s.ratio < rule.value);
      return {
        reference: ref.slug,
        verdict: bad.length ? 'VIOLATES' : 'CONFORMS',
        measured: bad.length
          ? `${bad.length} of ${steps.length} adjacent pair(s) below ${rule.value}: ${bad.map((s) => `${s.from}→${s.to} (${s.ratio})`).join(', ')}`
          : `every adjacent ratio is at or above ${rule.value} (min ${Math.min(...steps.map((s) => s.ratio))})`,
      };
    }
    case 'max-adjacent-ratio': {
      if (steps.length === 0) return unmeasured(`the ${which} band has fewer than 2 sizes`);
      const bad = steps.filter((s) => s.ratio > rule.value);
      return { reference: ref.slug, verdict: bad.length ? 'VIOLATES' : 'CONFORMS', measured: bad.length ? `${bad.map((s) => `${s.from}→${s.to} (${s.ratio})`).join(', ')} exceed ${rule.value}` : `max ratio ${Math.max(...steps.map((s) => s.ratio))} is at or below ${rule.value}` };
    }
    case 'max-distinct-sizes': {
      if (!sizes.length) return unmeasured(`the ${which} band is empty`);
      return { reference: ref.slug, verdict: sizes.length > rule.value ? 'VIOLATES' : 'CONFORMS', measured: `${sizes.length} distinct size(s) in the ${which} band against a ceiling of ${rule.value}` };
    }
    case 'min-distinct-sizes': {
      if (!sizes.length) return unmeasured(`the ${which} band is empty`);
      return { reference: ref.slug, verdict: sizes.length < rule.value ? 'VIOLATES' : 'CONFORMS', measured: `${sizes.length} distinct size(s) in the ${which} band against a floor of ${rule.value}` };
    }
    case 'integer-increments': {
      if (steps.length === 0) return unmeasured(`the ${which} band has fewer than 2 sizes`);
      const frac = steps.filter((s) => !s.integer);
      return { reference: ref.slug, verdict: frac.length ? 'VIOLATES' : 'CONFORMS', measured: frac.length ? `${frac.length} fractional increment(s): ${frac.map((s) => `${s.from}→${s.to} (+${s.increment})`).join(', ')}` : `every increment is an integer: ${steps.map((s) => `+${s.increment}`).join(' ')}` };
    }
    case 'increment-in': {
      if (steps.length === 0) return unmeasured(`the ${which} band has fewer than 2 sizes`);
      const allowed = new Set((rule.value ?? []).map(Number));
      const bad = steps.filter((s) => !allowed.has(s.increment));
      return { reference: ref.slug, verdict: bad.length ? 'VIOLATES' : 'CONFORMS', measured: bad.length ? `${bad.map((s) => `+${s.increment}`).join(' ')} outside {${[...allowed].join(', ')}}` : `every increment is in {${[...allowed].join(', ')}}: ${steps.map((s) => `+${s.increment}`).join(' ')}` };
    }
    case 'requires-band': {
      const target = bandOf(ref.measured, rule.value ?? 'display', floor);
      return { reference: ref.slug, verdict: target.length ? 'CONFORMS' : 'VIOLATES', measured: target.length ? `${target.length} size(s) in the ${rule.value ?? 'display'} band` : `no ${rule.value ?? 'display'} band at all` };
    }
    case 'forbids-band': {
      const target = bandOf(ref.measured, rule.value ?? 'display', floor);
      return { reference: ref.slug, verdict: target.length ? 'VIOLATES' : 'CONFORMS', measured: target.length ? `${target.length} size(s) in the ${rule.value ?? 'display'} band: ${target.map((e) => e.value).join(', ')}` : `no ${rule.value ?? 'display'} band` };
    }
    default:
      return { reference: ref.slug, verdict: 'UNSUPPORTED', measured: `rule kind "${rule.kind}" is not one this harness can evaluate (${RULE_KINDS.join(', ')})` };
  }
}

/**
 * Hold a set of stated rules against a corpus of measured references.
 *
 * Corpus verdicts, and the boundaries are the whole design:
 *   REFUTED      every measurable reference VIOLATES, and there are at least 2 of them. The rule
 *                describes nothing real. Reported loudly, and it exits the process non-zero.
 *   HELD         every measurable reference CONFORMS.
 *   CONTESTED    some of each. The rule is a preference, not a law — say so rather than averaging.
 *   UNDERPOWERED exactly one measurable reference. One site can neither hold nor kill a rule, and
 *                a harness that lets it is a harness that launders an opinion into a finding.
 *   UNMEASURED   no reference carries the data the rule needs.
 *   UNSUPPORTED  the harness cannot evaluate the rule. Refuses; never silently conforms.
 */
export function falsify(rules, refs) {
  const results = (rules ?? []).map((rule) => {
    const perRef = (refs ?? []).map((ref) => evaluateRule(rule, ref));
    const unsupported = perRef.some((r) => r.verdict === 'UNSUPPORTED');
    const measurable = perRef.filter((r) => r.verdict === 'CONFORMS' || r.verdict === 'VIOLATES');
    const violates = measurable.filter((r) => r.verdict === 'VIOLATES');

    let verdict;
    if (unsupported) verdict = 'UNSUPPORTED';
    else if (measurable.length === 0) verdict = 'UNMEASURED';
    else if (measurable.length === 1) verdict = 'UNDERPOWERED';
    else if (violates.length === measurable.length) verdict = 'REFUTED';
    else if (violates.length === 0) verdict = 'HELD';
    else verdict = 'CONTESTED';

    return {
      id: rule.id,
      statement: rule.statement ?? null,
      kind: rule.kind,
      value: rule.value ?? null,
      band: rule.band ?? 'ui',
      verdict,
      violated_by: violates.length,
      measured_against: measurable.length,
      references: perRef,
    };
  });

  return {
    corpus: (refs ?? []).map((r) => r.slug),
    rules: results,
    refuted: results.filter((r) => r.verdict === 'REFUTED').map((r) => r.id),
    unsupported: results.filter((r) => r.verdict === 'UNSUPPORTED').map((r) => r.id),
  };
}

// ── capture ─────────────────────────────────────────────────────────────────────────────────────

export function slugFor(url) {
  const u = new URL(url);
  const path = u.pathname.replace(/\/+$/, '').replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
  return [u.hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-'), path].filter(Boolean).join('-').toLowerCase();
}

/* c8 ignore start — executes in the page context, not under node coverage */
function collectReference() {
  const px = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const bump = (o, k) => {
    if (k === undefined || k === null || k === '') return;
    o[k] = (o[k] || 0) + 1;
  };

  const sizes = {};
  const weights = {};
  const families = {};
  const textColors = {};
  const bgColors = {};
  const pairs = {};
  const leading = {}; // "size|ratio" -> count
  const leadingNormal = {};
  const tracking = {}; // "size|em" -> count
  const spacing = { margin: {}, padding: {} };

  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;

    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const m = px(cs[`margin${side}`]);
      const p = px(cs[`padding${side}`]);
      if (m) bump(spacing.margin, m);
      if (p) bump(spacing.padding, p);
    }
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') bump(bgColors, bg);

    // Type is read off LEAF text nodes only. An ancestor inherits a font-size it may not render.
    const t = (el.textContent || '').trim();
    if (!t || el.children.length > 0) return;
    const size = px(cs.fontSize);
    if (!size) return;

    bump(sizes, size);
    bump(weights, cs.fontWeight);
    bump(families, cs.fontFamily);
    bump(textColors, cs.color);

    if (cs.lineHeight === 'normal') bump(leadingNormal, size);
    else {
      const lh = px(cs.lineHeight);
      if (lh) bump(leading, `${size}|${Math.round((lh / size) * 1000) / 1000}`);
    }

    const ls = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
    if (ls !== null) bump(tracking, `${size}|${Math.round((ls / size) * 10000) / 10000}`);

    let n = el;
    let behind = 'rgba(0, 0, 0, 0)';
    while (n && behind === 'rgba(0, 0, 0, 0)') {
      behind = getComputedStyle(n).backgroundColor;
      n = n.parentElement;
    }
    bump(pairs, `${cs.color}|${behind}|${size}|${parseInt(cs.fontWeight, 10) >= 700 ? 1 : 0}`);
  });

  return { sizes, weights, families, textColors, bgColors, pairs, leading, leadingNormal, tracking, spacing, title: document.title || null };
}
/* c8 ignore stop */

/**
 * Fold the raw in-page tallies into measured.json's shape. Pure — this is the half the tests drive.
 *
 * Per size, leading and tracking are reported as the MODE, with every observed value beside it.
 * A mean over a bimodal set describes neither mode, and a reference that uses two line-heights at
 * one size is a fact about that reference, not noise to be averaged out.
 */
export function analyse(raw, { url, viewport, scrolled } = {}) {
  const counted = distinctWithCounts(raw.sizes ?? {});
  const grand = counted.reduce((a, e) => a + e.count, 0);
  // `share` is emitted because a bare count cannot be read without the denominator, and the
  // denominator is what separates a reference's ramp from its one-off sizes.
  const sizes = counted.map((e) => ({ ...e, share: grand ? Math.round((e.count / grand) * 1000) / 1000 : 0 }));
  const bands = splitBands(sizes);

  const foldPairs = (obj) => {
    const bySize = new Map();
    for (const [k, count] of Object.entries(obj ?? {})) {
      const [s, v] = k.split('|').map(Number);
      if (!bySize.has(s)) bySize.set(s, []);
      bySize.get(s).push({ value: v, count });
    }
    return [...bySize.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([size, vs]) => {
        const mode = vs.reduce((a, v) => (v.count > a.count ? v : a), vs[0]);
        return { size, mode: mode.value, count: vs.reduce((a, v) => a + v.count, 0), samples: vs.sort((a, b) => b.count - a.count) };
      });
  };

  const leadingRows = foldPairs(raw.leading).map((r) => ({ size: r.size, leadingRatio: r.mode, count: r.count, samples: r.samples }));
  const trackingRows = foldPairs(raw.tracking).map((r) => ({ size: r.size, trackingEm: r.mode, count: r.count, samples: r.samples }));

  const contrastPairs = [];
  for (const [k, count] of Object.entries(raw.pairs ?? {})) {
    const [fg, bg, s, bold] = k.split('|');
    const f = parseRgb(fg);
    const b = parseRgb(bg);
    if (!f || !b) continue;
    const size = Number(s);
    const large = size >= 24 || (bold === '1' && size >= 18.66);
    contrastPairs.push({ fg, bg, size, bold: bold === '1', count, contrast: contrast(f, b), wcagFloor: large ? 3.0 : 4.5 });
  }
  contrastPairs.sort((a, b) => b.count - a.count);

  return {
    url,
    viewport,
    scrolled: scrolled ?? null,
    title: raw.title ?? null,
    type: {
      sizes,
      bands: {
        ui: { sizes: bands.ui.map((e) => e.value), fit: bands.uiFit ? { base: bands.uiFit.base, increment: bands.uiFit.increment, steps: bands.uiFit.steps, uncoveredInRange: bands.uiFit.uncoveredInRange } : null },
        display: { sizes: bands.display.map((e) => e.value), fit: bands.displayFit ? { base: bands.displayFit.base, increment: bands.displayFit.increment, steps: bands.displayFit.steps } : null },
        below: bands.below.map((e) => e.value),
      },
      steps: rampSteps(sizes.map((e) => e.value)),
      uiSteps: rampSteps(bands.ui.map((e) => e.value)),
      allIncrementsInteger: rampSteps(bands.ui.map((e) => e.value)).every((s) => s.integer),
      leading: leadingRows,
      leadingNormalAt: distinctWithCounts(raw.leadingNormal ?? {}),
      tracking: trackingRows,
      families: Object.entries(raw.families ?? {}).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      weights: distinctWithCounts(raw.weights ?? {}),
    },
    colour: {
      text: Object.entries(raw.textColors ?? {}).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      background: Object.entries(raw.bgColors ?? {}).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
      pairs: contrastPairs,
      belowWcagAA: contrastPairs.filter((p) => p.contrast < p.wcagFloor).length,
    },
    spacing: {
      margin: distinctWithCounts(raw.spacing?.margin ?? {}),
      padding: distinctWithCounts(raw.spacing?.padding ?? {}),
    },
  };
}

/**
 * Load the page and measure it. Throws ENOPLAYWRIGHT / ENOLAUNCH — never returns an empty result.
 *
 * THE SCROLL PASS IS NOT OPTIONAL POLISH. Measured on vercel.com 2026-08-29: without it the DOM
 * carried 7 distinct sizes and a 3-step UI band, because the sections below the fold had not
 * mounted. A ramp measured off the hero alone is not the reference's ramp, and it produced a
 * falsification result that disagreed with the research corpus for a reason that was about the
 * instrument, not about vercel. It is still ONE page load — the volume the legal posture promises
 * is unchanged.
 */
export async function capture(url, { viewport = { w: 1440, h: 900 }, settleMs = 2500, timeoutMs = 30000, scroll = true, scrollSteps = 12, scrollPauseMs = 350 } = {}) {
  const resolved = resolvePlaywright();
  if (!resolved) {
    const e = new Error('playwright could not be resolved — this cannot measure, and is not reporting an empty capture as a clean run');
    e.code = 'ENOPLAYWRIGHT';
    throw e;
  }
  let browser;
  try {
    browser = await resolved.mod.chromium.launch({ headless: true });
  } catch (cause) {
    const e = new Error('chromium failed to launch. Under the armed sandbox this is SIGTRAP and is EXPECTED — capture must run in an escalated lane. Refusing rather than emitting an empty reference.');
    e.code = 'ENOLAUNCH';
    e.cause = cause;
    throw e;
  }
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.w, height: viewport.h });
    // domcontentloaded, never networkidle — a long-lived stream keeps networkidle from resolving.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForTimeout(settleMs);
    if (scroll) {
      for (let i = 1; i <= scrollSteps; i++) {
        await page.evaluate((frac) => window.scrollTo(0, document.documentElement.scrollHeight * frac), i / scrollSteps);
        await page.waitForTimeout(scrollPauseMs);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(scrollPauseMs);
    }
    const raw = await page.evaluate(collectReference);
    await page.close();
    return analyse(raw, { url, viewport: `${viewport.w}x${viewport.h}`, scrolled: scroll });
  } finally {
    await browser.close();
  }
}

// ── output ──────────────────────────────────────────────────────────────────────────────────────

/** Minimal, quoting YAML emitter. Flat scalars only — that is all SOURCE.yml holds. */
export function toYaml(obj) {
  return `${Object.entries(obj)
    .map(([k, v]) => {
      if (v === null || v === undefined) return `${k}: null`;
      if (typeof v === 'number' || typeof v === 'boolean') return `${k}: ${v}`;
      const s = String(v);
      return `${k}: ${/[:#\-?{}[\],&*!|>'"%@`\n]/.test(s) || s !== s.trim() ? JSON.stringify(s) : s}`;
    })
    .join('\n')}\n`;
}

export function sourceRecord(url, { accessDate = new Date(), expiryDays = DEFAULT_EXPIRY_DAYS, capturedBy = TOOL, viewport = null, scrolled = null, surface = null } = {}) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const expires = new Date(accessDate.getTime() + expiryDays * 86400000);
  return {
    url,
    access_date: iso(accessDate),
    captured_by: capturedBy,
    // A computed-style census is SINGLE-VIEWPORT by construction, so a fixture that does not say
    // where it was measured cannot be reproduced. `scrolled` belongs here for the same reason and
    // is not cosmetic: play.grafana.org reports 2 sizes unscrolled and 8 scrolled.
    viewport,
    scrolled,
    // marketing | product | docs | unknown. linear.app and stripe.com at the bare domain are
    // MARKETING pages; docs.stripe.com and play.grafana.org are product surfaces. A corpus that
    // mixes them without saying so will disagree with itself and nobody will know why.
    surface,
    licence_note:
      'Computed styles and geometry only, read from a logged-out page load after checking /robots.txt. No page content, markup, images or text is reproduced or redistributed. Measurements are facts about a rendering, not a copy of the work. Re-check robots.txt and the site terms before any re-capture: the risk that bites is contract, not the CFAA.',
    expires: iso(expires),
  };
}

/** Write a reference directory. Returns the paths written. */
export function writeReference(outDir, { measured, seeds, source }) {
  mkdirSync(outDir, { recursive: true });
  const files = {
    measured: join(outDir, 'measured.json'),
    seeds: join(outDir, 'seeds.suggestion.json'),
    source: join(outDir, 'SOURCE.yml'),
  };
  writeFileSync(files.measured, `${JSON.stringify(measured, null, 2)}\n`);
  writeFileSync(files.seeds, `${JSON.stringify(seeds, null, 2)}\n`);
  writeFileSync(files.source, toYaml(source));
  return files;
}

/** Load every reference under a root directory (each a dir holding measured.json). */
export function loadReferences(root) {
  if (!existsSync(root)) return [];
  const out = [];
  for (const name of readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const p = join(root, name.name, 'measured.json');
    if (!existsSync(p)) continue;
    out.push({ slug: name.name, path: p, measured: JSON.parse(readFileSync(p, 'utf8')) });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────────
/* c8 ignore start */
const USAGE = `usage:
  node scripts/extract-reference.mjs <url> [--out <dir>] [--viewport 1440x900] [--settle 2500]
                                          [--no-scroll] [--min-count N] [--min-share F]
                                          [--surface marketing|product|docs] [--json]
  node scripts/extract-reference.mjs --against <rules.json> [--refs design/references] [--json]

exit codes (identical to scripts/design-probe.mjs, deliberately):
  0  measured, nothing failed
  1  measured, and something failed — a rule came back REFUTED
  2  COULD NOT MEASURE — no playwright, chromium refused to launch, or robots.txt said no`;

function parseArgs(argv) {
  const a = { _: [], json: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--json') a.json = true;
    else if (t === '--out') a.out = argv[++i];
    else if (t === '--against') a.against = argv[++i];
    else if (t === '--refs') a.refs = argv[++i];
    else if (t === '--viewport') a.viewport = argv[++i];
    else if (t === '--settle') a.settle = Number(argv[++i]);
    else if (t === '--no-scroll') a.scroll = false;
    else if (t === '--min-count') a.minCount = Number(argv[++i]);
    else if (t === '--min-share') a.minShare = Number(argv[++i]);
    else if (t === '--surface') a.surface = argv[++i];
    else if (t === '--expires-days') a.expiryDays = Number(argv[++i]);
    else if (t.startsWith('--')) a.unknown = (a.unknown ?? []).concat(t);
    else a._.push(t);
  }
  return a;
}

function printFalsification(report) {
  for (const r of report.rules) {
    const head = `[${r.verdict}] ${r.id} — ${r.statement ?? r.kind}`;
    if (r.verdict === 'REFUTED') {
      console.log(`\n${'='.repeat(78)}\n!! RULE REFUTED !!  ${r.id}\n   ${r.statement ?? r.kind}\n   Every one of the ${r.measured_against} measurable reference(s) VIOLATES it. A rule that no\n   reference obeys is not a standard — it is a preference with a citation missing.\n${'='.repeat(78)}`);
    } else {
      console.log(`\n${head}`);
    }
    console.log(`   violated by ${r.violated_by} of ${r.measured_against} measurable reference(s), band=${r.band}`);
    for (const ref of r.references) console.log(`   · ${ref.reference.padEnd(28)} ${ref.verdict.padEnd(12)} ${ref.measured}`);
  }
  console.log(`\ncorpus: ${report.corpus.join(' · ') || '(empty)'}`);
  if (report.unsupported.length) console.log(`UNSUPPORTED rule(s), evaluated by nothing: ${report.unsupported.join(', ')}`);
  console.log(report.refuted.length ? `\n✗ REFUTED: ${report.refuted.join(', ')}` : '\n✓ no rule was refuted by this corpus');
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (args.unknown?.length) {
    console.error(`unknown flag(s): ${args.unknown.join(', ')}\n\n${USAGE}`);
    process.exit(2);
  }

  // ── falsification-only mode. No browser, no network. ──
  if (args.against && !args._.length) {
    const rulesPath = resolve(args.against);
    if (!existsSync(rulesPath)) {
      console.error(`no such rules file: ${rulesPath}`);
      process.exit(2);
    }
    const doc = JSON.parse(readFileSync(rulesPath, 'utf8'));
    const refs = loadReferences(resolve(args.refs ?? 'design/references'));
    if (!refs.length) {
      console.error(`no references under ${resolve(args.refs ?? 'design/references')} — a corpus of zero falsifies nothing, and reporting a clean sweep over it would be a lie`);
      process.exit(2);
    }
    const report = falsify(doc.rules ?? [], refs);
    if (args.json) console.log(JSON.stringify(report, null, 2));
    else printFalsification(report);
    if (report.unsupported.length) process.exit(2);
    process.exit(report.refuted.length ? 1 : 0);
  }

  const url = args._[0];
  if (!url) {
    console.error(USAGE);
    process.exit(2);
  }

  let robots;
  try {
    robots = await checkRobots(url);
  } catch (e) {
    console.error(`extract-reference REFUSED: could not evaluate robots.txt (${e.message})`);
    process.exit(2);
  }
  const label = robots.allowed ? 'ALLOWED' : robots.reason === 'unknown' ? 'UNKNOWN' : 'DISALLOWED';
  console.error(`robots.txt: ${robots.robotsUrl} → ${label} (${robots.rule}${robots.matchedBy ? `, matched as ${robots.matchedBy}` : ''})`);
  if (!robots.allowed) {
    // TWO REFUSALS THAT MUST NOT WEAR THE SAME SENTENCE. Both fail closed, and that part is
    // settled. But "the site said no" is a fact about the site, and "I could not ask" is a fact
    // about US — and the first version of this message reported the second as the first. Measured
    // 2026-08-29 under the armed sandbox, which denies the network: the tool printed
    // "linear.app disallows this path", which is false about linear.app. A refusal that
    // misattributes itself teaches the reader something untrue about a third party.
    if (robots.reason === 'unknown') {
      console.error(`\nextract-reference REFUSED: could not READ ${new URL(url).hostname}/robots.txt, so permission is UNKNOWN. This is NOT a statement that the site disallows anything.\nFailing closed is deliberate — "I could not ask" must never read as "yes". Under the armed sandbox the network is denied and this is the expected result; capture needs an escalated lane.`);
    } else {
      console.error(`\nextract-reference REFUSED: ${new URL(url).hostname} disallows this path in its own robots.txt. Not fetching it.\nThis is the tool working, not the tool failing — the risk here is contract, not the CFAA.`);
    }
    process.exit(2);
  }
  if (robots.crawlDelay) {
    console.error(`honouring Crawl-delay: ${robots.crawlDelay}s`);
    await new Promise((r) => setTimeout(r, robots.crawlDelay * 1000));
  }

  const vp = args.viewport ? { w: Number(args.viewport.split('x')[0]), h: Number(args.viewport.split('x')[1]) } : undefined;
  let measured;
  try {
    measured = await capture(url, { viewport: vp, settleMs: args.settle, scroll: args.scroll !== false });
  } catch (e) {
    console.error(`extract-reference REFUSED: ${e.message}`);
    if (e.cause) console.error(`  cause: ${e.cause.message?.split('\n')[0]}`);
    process.exit(2);
  }

  const slug = slugFor(url);
  const outDir = resolve(args.out ?? join('design', 'references', slug));
  const seeds = deriveSeeds(measured, { minCount: args.minCount ?? 1, minShare: args.minShare ?? 0 });
  const files = writeReference(outDir, {
    measured,
    seeds,
    source: sourceRecord(url, { expiryDays: args.expiryDays, viewport: measured.viewport, scrolled: measured.scrolled, surface: args.surface ?? 'unknown' }),
  });

  if (args.json) {
    console.log(JSON.stringify({ slug, files, measured, seeds }, null, 2));
  } else {
    const ui = measured.type.bands.ui;
    console.log(`\n${slug} — ${measured.type.sizes.length} distinct rendered size(s) at ${measured.viewport}`);
    console.log(`  ui band     ${ui.sizes.join(' ') || '(none)'}`);
    console.log(`  increments  ${measured.type.uiSteps.map((s) => `+${s.increment}`).join(' ') || '(none)'}  → ${measured.type.allIncrementsInteger ? 'ALL INTEGER' : 'FRACTIONAL increments present'}`);
    console.log(`  ratios      ${measured.type.uiSteps.map((s) => s.ratio).join(' ') || '(none)'}`);
    console.log(`  display     ${measured.type.bands.display.sizes.join(' ') || '(no display band — a real result, not a gap)'}`);
    console.log(`  colour      ${measured.colour.text.length} text · ${measured.colour.background.length} background · ${measured.colour.belowWcagAA} pair(s) below their WCAG AA floor`);
    console.log(`  spacing     ${measured.spacing.padding.length} padding · ${measured.spacing.margin.length} margin value(s)`);
    console.log(`\n  seeds: ui=${JSON.stringify(seeds.type.ui)}  display=${JSON.stringify(seeds.type.display)}`);
    console.log(`         leading=${JSON.stringify(seeds.type.leading)}\n         tracking=${JSON.stringify(seeds.type.tracking)}`);
    for (const n of seeds.notes) console.log(`  note: ${n}`);
    console.log(`\nwrote ${Object.values(files).join('\n      ')}`);
  }

  if (args.against) {
    const doc = JSON.parse(readFileSync(resolve(args.against), 'utf8'));
    const report = falsify(doc.rules ?? [], [{ slug, measured }]);
    printFalsification(report);
    if (report.unsupported.length) process.exit(2);
    process.exit(report.refuted.length ? 1 : 0);
  }
  process.exit(0);
}
/* c8 ignore stop */
