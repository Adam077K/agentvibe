// scripts/design-lib.test.mjs — the pins on the design layer's shared arithmetic.
//
// WHAT THIS FILE IS FOR, in one sentence: `build-tokens.mjs`, `extract-reference.mjs` and
// `design-probe.mjs` each carried their own `luminance` and `contrast`, they agreed exactly on the
// day they were collapsed, and this file is what makes a future re-divergence a RED TEST rather
// than a discovery made during an incident.
//
// The identity test at the bottom is the load-bearing one and it is not the obvious kind. Testing
// that three copies produce the same NUMBERS only proves they agree on the inputs someone thought
// to try — which is exactly the state the three copies were already in, for months, while one of
// the four shared functions was quietly NOT equivalent. Testing that the three consumers resolve to
// the same FUNCTION OBJECT proves there is only one implementation to disagree with, on every input
// including the ones nobody enumerated.
//
// Run by `test:lenses` (see package.json), alongside `scripts/build-tokens.test.mjs`. It rides an
// existing step rather than taking a governed `test:*` name of its own, because a new governed name
// must appear in `scripts/lib/check-suite.js` STEPS and that file is `irreversible` tier — the same
// trade b1ab4ce made for produce-verdict. `scripts/check-suite.test.mjs` carries the counterweight
// assertion that buys back what the trade gives up.

import assert from 'node:assert/strict';
import test from 'node:test';

import * as lib from './design-lib.mjs';
import * as tokens from './build-tokens.mjs';
import * as extract from './extract-reference.mjs';
import * as probe from './design-probe.mjs';

const { contrast, luminance, parseRgb, resolvePlaywright } = lib;

const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];

// ── the published values ────────────────────────────────────────────────────────────────────────
//
// WCAG 2.x defines the ratio as (L1 + 0.05) / (L2 + 0.05), which bounds it to [1, 21]. Both bounds
// are checkable against a value published outside this repository, which is the whole reason they
// are the anchors: an internal convention can drift and still look consistent, an external
// definition cannot.

test('black on white is exactly 21:1 — the upper bound of the WCAG 2.x range', () => {
  assert.equal(contrast(BLACK, WHITE), 21);
});

test('a colour on itself is exactly 1:1 — the lower bound', () => {
  assert.equal(contrast(WHITE, WHITE), 1);
  assert.equal(contrast(BLACK, BLACK), 1);
  // Not only at the extremes: an arbitrary mid-tone against itself is also 1, or the bound is being
  // satisfied by the luminance happening to be 0 or 1 rather than by the formula.
  assert.equal(contrast([90, 140, 200], [90, 140, 200]), 1);
});

test('luminance sits at the endpoints the sRGB transfer function defines', () => {
  assert.equal(luminance(WHITE), 1);
  assert.equal(luminance(BLACK), 0);
  // The linear segment below 0.03928 is a real branch and is reachable: 8/255 = 0.0314 takes it.
  // Without this, the whole `s <= 0.03928` arm could be deleted and every other test still passes.
  assert.equal(luminance([8, 8, 8]), (8 / 255 / 12.92) * (0.2126 + 0.7152 + 0.0722));
});

test('the channel weights are the WCAG ones and are not interchangeable', () => {
  // 0.2126 R + 0.7152 G + 0.0722 B. Pure-channel luminances must come out in G > R > B order and
  // in that ratio; a transposed pair of coefficients would still sum to 1 and still return 1 for
  // white, so the endpoint tests above cannot see it.
  const r = luminance([255, 0, 0]);
  const g = luminance([0, 255, 0]);
  const b = luminance([0, 0, 255]);
  assert.equal(r, 0.2126);
  assert.equal(g, 0.7152);
  assert.equal(b, 0.0722);
  assert.ok(g > r && r > b, `expected G > R > B, got ${g} ${r} ${b}`);
});

// ── symmetry ────────────────────────────────────────────────────────────────────────────────────

test('argument order cannot change a verdict', () => {
  // The brighter colour is always the numerator, so contrast(a, b) === contrast(b, a) for ALL
  // inputs. A caller that transposes foreground and background gets the right answer rather than a
  // plausible wrong one, and several call sites depend on that without saying so.
  const pairs = [
    [BLACK, WHITE],
    [[230, 232, 236], [13, 14, 17]],
    [[90, 98, 112], [13, 14, 17]],
    [[63, 191, 143], [217, 164, 65]],
    [[1, 2, 3], [4, 5, 6]],
  ];
  for (const [a, b] of pairs) {
    assert.equal(contrast(a, b), contrast(b, a), `asymmetric on ${JSON.stringify([a, b])}`);
  }
  // NEGATIVE CONTROL: symmetry must not be holding because every pair returns the same number.
  assert.notEqual(contrast(BLACK, WHITE), contrast([1, 2, 3], [4, 5, 6]));
});

test('every ratio lands inside the WCAG range', () => {
  for (let i = 0; i <= 255; i += 17) {
    for (let j = 0; j <= 255; j += 51) {
      const v = contrast([i, i, i], [j, j, j]);
      assert.ok(v >= 1 && v <= 21, `${i} on ${j} gave ${v}, outside [1, 21]`);
    }
  }
});

// ── the figures mission-control publishes ───────────────────────────────────────────────────────

/**
 * `mission-control/client/src/styles.css` writes a contrast figure in a comment beside each colour,
 * against `--color-ink`. Those comments are the design record — the file's own header says every
 * one of them was found WRONG on 2026-08-13, by 0.06 to 0.3, in both directions, and re-measured.
 * Pinning them here means the arithmetic that produced them cannot move without a red test, which
 * is the half of that incident nothing was guarding.
 *
 * Hardcoded rather than parsed out of the CSS on purpose: a test that reads its expected values
 * from the file it is checking passes whatever the file says.
 */
const INK = [0x0d, 0x0e, 0x11]; // --color-ink: #0d0e11

const PUBLISHED = [
  ['--color-text', [0xe6, 0xe8, 0xec], 15.734],
  ['--color-divider', [0x5a, 0x62, 0x70], 3.139],
  ['--color-dim', [0x7b, 0x84, 0x94], 5.12],
];

test('the contrast figures in styles.css reproduce exactly', () => {
  for (const [name, rgb, expected] of PUBLISHED) {
    assert.equal(contrast(rgb, INK), expected, `${name} against --color-ink`);
  }
});

test('the published figures are distinguishable from each other at 3dp', () => {
  // CONTROL on the test above: three assertions against one rounding are worth nothing if the
  // rounding flattens them together. 3.139 and 5.120 are two dp apart at the third decimal, which
  // is precisely the precision the contract fixes.
  const values = PUBLISHED.map(([, rgb]) => contrast(rgb, INK));
  assert.equal(new Set(values).size, PUBLISHED.length);
});

test('the 3dp rounding is the contract, not a display detail', () => {
  // --color-divider is the sharpest case in the set: it decides whether the app's one horizontal
  // rule clears 3:1. A change of precision here silently invalidates every figure in styles.css.
  const v = contrast([0x5a, 0x62, 0x70], INK);
  assert.equal(v, Number(v.toFixed(3)));
  assert.equal(v, 3.139);
});

// ── parseRgb ────────────────────────────────────────────────────────────────────────────────────

test('parseRgb reads the legacy comma syntax and drops alpha', () => {
  assert.deepEqual(parseRgb('rgb(0, 0, 0)'), [0, 0, 0]);
  assert.deepEqual(parseRgb('rgba(255, 255, 255, 0.5)'), [255, 255, 255]);
  assert.deepEqual(parseRgb('  rgb( 12 , 13 , 14 )  '), [12, 13, 14]);
});

test('parseRgb refuses what it cannot read rather than guessing', () => {
  assert.equal(parseRgb('rgb(1,2)'), null, 'two components is not a colour');
  assert.equal(parseRgb('color(srgb 0 0 0)'), null, 'a colour space this cannot convert');
  assert.equal(parseRgb('transparent'), null);
  assert.equal(parseRgb('#0d0e11'), null, 'hex is hexToRgb\'s job, not this one\'s');
  assert.equal(parseRgb(''), null);
  assert.equal(parseRgb(null), null);
  assert.equal(parseRgb(undefined), null);
});

test('parseRgb reads CSS Color 4 space-separated syntax', () => {
  assert.deepEqual(parseRgb('rgb(0 0 0)'), [0, 0, 0]);
  assert.deepEqual(parseRgb('rgb(11 12 14 / 0.5)'), [11, 12, 14]);
  assert.deepEqual(parseRgb('rgba(0, 0, 0, var(--a))'), [0, 0, 0], 'a non-numeric alpha is dropped, not fatal');
});

/**
 * THE ONE FUNCTION THAT WAS NOT COLLAPSED, PINNED AS A DIVERGENCE RATHER THAN LEFT AS A FORK.
 *
 * `extract-reference.mjs` carried a comment asserting its four shared functions were
 * "byte-equivalent in behaviour" to design-probe's. Three of them were. `parseRgb` was not, and
 * nothing anywhere would have said so — which is the failure this whole collapse exists to end,
 * caught in the act of ending it.
 *
 * The probe's copy is kept deliberately: widening what a measurement instrument accepts changes
 * what it measures on live pages, and that is a decision for whoever owns the probe. The divergence
 * is recorded HERE, with both behaviours asserted, so it cannot widen and cannot be tidied away by
 * someone who assumes the two were always meant to match.
 *
 * IF YOU ARE HERE BECAUSE THIS TEST WENT RED: someone changed one of the two copies. That is the
 * question this test was written to raise, not a failure to route around.
 */
test('design-probe.parseRgb diverges from the shared copy, and exactly where documented', () => {
  const DIVERGENT = ['rgb(0 0 0)', 'rgb(11 12 14 / 0.5)', 'rgba(0, 0, 0, var(--a))'];
  for (const s of DIVERGENT) {
    assert.equal(probe.parseRgb(s), null, `design-probe.parseRgb should still refuse ${s}`);
    assert.notEqual(lib.parseRgb(s), null, `the shared parseRgb should still accept ${s}`);
  }
  // THE BOUND, AND THIS IS THE THIRD STATEMENT OF IT. Each was narrower than the last and the
  // first two were false, so the shape of the mistake is the durable lesson:
  //
  //   v1  "wherever the probe returns a triple the shared one returns the SAME triple, AND NOWHERE
  //        ELSE" — backed by a 7-item hand-written allowlist. Refuted by `rgb(1 2, 3, 4)`.
  //   v2  "on values separated by COMMAS ALONE, the two agree" — backed by a 9-item hand-written
  //        allowlist. ALSO FALSE: `rgb(1,2,3,)`, `rgb(1,,2,3)`, `rgb(,1,2,3)` and `rgb(1,2,3,x)`
  //        all disagree, and `rgb(1,2,3,x)` is the SAME non-numeric-alpha class the DIVERGENT list
  //        four lines up already names — so the two arms of this one test contradicted each other.
  //
  // BOTH FAILURES ARE ONE SHAPE: a universal quantified over a grammar, backed by a list somebody
  // typed. A hand-written list is a sample of the cases its author already had in mind, which is
  // precisely the population that cannot refute them. The cure is not a third careful list.
  //
  // v3 IS THE SAFETY PROPERTY, SWEPT RATHER THAN SAMPLED. It is also the property that actually
  // matters: a null from the probe means "a colour it could not read", which is reported as NOT
  // CHECKED and is safe. What would be unsafe is the probe returning a triple that the shared copy
  // reads differently — a silent disagreement about a measured value. Swept below across both pure
  // grammars: ZERO violations, and 6,048 of the inputs are cases where the probe DOES return a
  // triple, so the property is not vacuously true.
  const ATOMS = ['0', '1', '255', '12.5', '-3', '.5', '', ' ', 'x', 'var(--a)'];
  const sweep = [];
  for (const fn of ['rgb', 'rgba']) {
    for (const a of ATOMS) for (const b of ATOMS) for (const c of ATOMS) {
      for (const sep of [',', ', ']) {
        sweep.push(`${fn}(${[a, b, c].join(sep)})`);
        for (const d of ATOMS) sweep.push(`${fn}(${[a, b, c, d].join(sep)})`);
      }
      sweep.push(`${fn}(${a} ${b} ${c})`); // CSS Color 4, space-separated
      for (const d of ATOMS) sweep.push(`${fn}(${a} ${b} ${c} / ${d})`);
    }
  }

  let probeReturnedATriple = 0;
  let disagreedOutright = 0;
  for (const s of sweep) {
    const p = probe.parseRgb(s);
    const l = lib.parseRgb(s);
    if (JSON.stringify(p) !== JSON.stringify(l)) disagreedOutright += 1;
    if (p === null) continue; // the probe declining says nothing about the shared copy
    probeReturnedATriple += 1;
    assert.deepEqual(l, p, `SAFETY VIOLATION on ${JSON.stringify(s)}: probe ${JSON.stringify(p)} vs shared ${JSON.stringify(l)}`);
  }
  assert.equal(sweep.length, 66000, 'the sweep must cover what it says it covers');
  assert.equal(probeReturnedATriple, 6048, 'CONTROL: if the probe never returned a triple the assertion above is vacuous');
  assert.ok(disagreedOutright > 8000, `CONTROL: the copies DO disagree constantly (${disagreedOutright}) — it is the direction that is bounded, not the agreement`);

  // The four shapes that killed v2, named so the sweep's result is not the only record of them.
  // Every one is the SAFE direction — probe null, shared a triple.
  for (const s of ['rgb(1,2,3,)', 'rgb(1,,2,3)', 'rgb(,1,2,3)', 'rgb(1,2,3,x)']) {
    assert.equal(probe.parseRgb(s), null, `${s}: the probe refuses`);
    assert.notEqual(lib.parseRgb(s), null, `${s}: the shared copy accepts — so "they agree on comma-separated" is false`);
  }

  // AND THE BOUND IS TIGHT: outside both pure grammars the safety property genuinely fails, in two
  // directions. If these ever start agreeing, the sweep above has stopped being the right test.
  assert.deepEqual(probe.parseRgb('rgb(1 2, 3, 4)'), [1, 3, 4], 'parseFloat reads the leading number and drops the rest');
  assert.deepEqual(lib.parseRgb('rgb(1 2, 3, 4)'), [1, 2, 3], 'a space is a separator here, so components shift left');
  assert.deepEqual(probe.parseRgb('rgb(1 x, 2, 3)'), [1, 2, 3], 'and on THIS shape the probe is the permissive one');
  assert.equal(lib.parseRgb('rgb(1 x, 2, 3)'), null, 'the shared copy NaN-checks a component the other never sees');
});

// ── resolvePlaywright ───────────────────────────────────────────────────────────────────────────

test('resolvePlaywright returns a chromium-bearing module or null, never a half-answer', () => {
  const r = resolvePlaywright();
  if (r === null) return; // no browser on this machine; both callers map that to exit 2.
  assert.ok(typeof r.from === 'string' && r.from.length > 0, 'a resolution must say where it came from');
  assert.ok(r.mod?.chromium, 'a non-null result must carry chromium, or the caller degrades silently');
});

// ── THE IDENTITY PINS — the reason this file exists ─────────────────────────────────────────────

test('all three consumers resolve to the SAME luminance and contrast function object', () => {
  // Not "produce the same numbers" — THE SAME FUNCTION. Three copies that agree on every input
  // anyone tried is the exact state this collapse replaced, and it held for months while a fourth
  // function had already diverged unnoticed. Identity is the only assertion that cannot be
  // satisfied by a copy that happens to agree today.
  for (const name of ['luminance', 'contrast']) {
    assert.equal(tokens[name], lib[name], `build-tokens.${name} has forked from design-lib`);
    assert.equal(extract[name], lib[name], `extract-reference.${name} has forked from design-lib`);
    assert.equal(probe[name], lib[name], `design-probe.${name} has forked from design-lib`);
  }
});

test('both browser-driven consumers resolve to the same resolvePlaywright and parseRgb', () => {
  assert.equal(extract.resolvePlaywright, lib.resolvePlaywright);
  assert.equal(probe.resolvePlaywright, lib.resolvePlaywright);
  assert.equal(extract.parseRgb, lib.parseRgb);
  // probe.parseRgb is the documented exception above — asserted here too, so the exception is
  // stated in both directions rather than only where it is convenient.
  assert.notEqual(probe.parseRgb, lib.parseRgb, 'design-probe.parseRgb is the ONE documented fork');
});

test('the identity assertions are falsifiable', () => {
  // NEGATIVE CONTROL. `assert.equal` on two functions passes trivially if both sides are the same
  // expression, and a future refactor could make these tests self-satisfying without anyone
  // noticing. A distinct function with identical behaviour must FAIL an identity check — that is
  // what proves the tests above are checking identity and not behaviour.
  const clone = ([r, g, b]) => luminance([r, g, b]);
  assert.equal(clone(WHITE), lib.luminance(WHITE), 'the clone must behave identically');
  assert.notEqual(clone, lib.luminance, 'identity must distinguish it anyway');
});
