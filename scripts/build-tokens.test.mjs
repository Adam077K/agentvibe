// scripts/build-tokens.test.mjs — the gate over the token generator.
//
// A GENERATOR WHOSE TESTS ONLY CHECK IT RUNS IS DECORATION. Every test below is written so that
// deleting the derivation it covers turns it red; the mutation runs that prove that are recorded in
// the session file, and the list of derivations is here so a future reader can repeat them:
//
//   band()               -> the arithmetic-signature and integer-size tests
//   leadingFor()         -> the curve tests (peak, falloff, display clamp)
//   trackingFor()        -> the monotonicity tests
//   contrast()           -> the reproduced-figure tests
//   the fractional refusal, the {1,2} clamp, the display-band floor, the band-join jump,
//   the hex strictness and the dangling-pair refusal -> one test each, all asserting the MESSAGE
//   carries its citation, not merely that something threw
//
// and the drift test covers all of them at once: the committed design/tokens/* must equal a fresh
// generation, so any change to any derivation reddens it even if its own test were deleted.
//
// WIRED THROUGH `test:lenses`, NOT THROUGH A STEP OF ITS OWN. A new governed `check:*`/`test:*` name
// in scripts/lib/check-suite.js STEPS requires a counterpart step in .github/workflows/ci.yml, and
// editing a workflow file is `irreversible` tier. The landed precedent is b1ab4ce, which moved
// `test:produce-verdict` into `test:merge-gate`'s argv for exactly this reason. Piggybacking trades
// a guarded position for cheaper wiring — a filename can be deleted from an argv with every check
// still green — so scripts/check-suite.test.mjs carries the counterweight assertion that buys it
// back, in the same shape as the one b1ab4ce shipped.
//
// `test:lenses` is the host because scripts/lenses.test.mjs guards .claude/lenses.yml, whose
// `design` lens is five judging steps with no production step. This generator IS that missing
// production step, so its negative controls now run in the same command as the tests over the file
// that is missing it.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  OUT,
  SEEDS_PATH,
  GENERATED_BANNER,
  REFERENCE_INCREMENTS,
  LEADING_BOUNDS,
  SeedsRefused,
  WCAG,
  band,
  adjacentRatios,
  buildModel,
  comparable,
  contrast,
  drift,
  generate,
  hexToRgb,
  leadingFor,
  luminance,
  readSeeds,
  renderCss,
  trackingFor,
  validateSeeds,
} from './build-tokens.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'build-tokens.mjs');
const TODAY = '2026-01-01';

const seeds = readSeeds();
/** A deep clone, so a test that mutates its seeds cannot leak into the next one. */
const clone = () => JSON.parse(JSON.stringify(seeds));

/** Assert a seeds mutation is refused AND that the refusal says why, citing something checkable. */
function refusedWith(mutate, ...mustMention) {
  const s = clone();
  mutate(s);
  let caught = null;
  try {
    validateSeeds(s);
  } catch (e) {
    caught = e;
  }
  assert.ok(caught, 'the seeds file was ACCEPTED — the refusal this test covers is gone');
  assert.ok(caught instanceof SeedsRefused, `threw ${caught.name}, not SeedsRefused: ${caught.message}`);
  for (const m of mustMention) {
    assert.ok(
      caught.message.includes(m),
      `the refusal does not mention ${JSON.stringify(m)}, so a reader cannot check it:\n  ${caught.message}`
    );
  }
  return caught.message;
}

// ── DERIVATION 1 & 2: the arithmetic signature ───────────────────────────────────────────────────

test('every adjacent ratio is exactly 1 + increment/size, to 3dp', () => {
  const { increment } = seeds.type.ui;
  const sizes = band(seeds.type.ui);
  const ratios = adjacentRatios(sizes);
  assert.ok(ratios.length >= 3, `CONTROL: only ${ratios.length} adjacent pairs — the band is too short to prove anything`);

  for (let i = 1; i < sizes.length; i++) {
    const predicted = Math.round((1 + increment / sizes[i - 1]) * 1000) / 1000;
    assert.equal(
      ratios[i - 1],
      predicted,
      `${sizes[i - 1]}->${sizes[i]} measured ${ratios[i - 1]}, but 1 + ${increment}/${sizes[i - 1]} = ${predicted}. ` +
        'The ramp is no longer built by absolute increment.'
    );
  }
});

test('adjacent ratios decrease monotonically — the signature a modular scale cannot have', () => {
  const ratios = adjacentRatios(band(seeds.type.ui));
  for (let i = 1; i < ratios.length; i++) {
    assert.ok(
      ratios[i] < ratios[i - 1],
      `ratio ${i} (${ratios[i]}) is not below ratio ${i - 1} (${ratios[i - 1]}). A modular scale holds its ` +
        'ratio CONSTANT, which DESIGN-CAPABILITY.md §7.1 falsified against every measured reference.'
    );
  }
  // The measured band: linear/stripe/vercel sit in 1.07-1.17. Ours must land inside it, or the ramp
  // is outside every reference the rule was derived from — which is exactly mission-control's defect
  // (its ratios bottomed out at 1.037, below the reference floor of 1.067).
  for (const r of ratios) {
    assert.ok(r >= 1.05 && r <= 1.167, `adjacent ratio ${r} is outside the measured reference band [1.05, 1.167]`);
  }
});

test('no seeds file that validateSeeds accepts can produce a fractional size', () => {
  // Exhaustive over the whole accepted input space for base and increment, not a sample: if any
  // combination reached a fractional size, the "inexpressible rather than forbidden" claim is false.
  let accepted = 0;
  for (let base = 9; base <= 16; base++) {
    for (const increment of [1, 2]) {
      for (let steps = 2; steps <= 8; steps++) {
        const s = clone();
        s.type.ui = { base, increment, steps };
        let ok = true;
        try {
          validateSeeds(s);
        } catch {
          ok = false;
        }
        if (!ok) continue;
        accepted++;
        for (const size of band(s.type.ui)) {
          assert.ok(Number.isInteger(size), `base=${base} increment=${increment} produced ${size}`);
        }
      }
    }
  }
  assert.ok(accepted > 20, `CONTROL: only ${accepted} seed combinations were accepted — the sweep proves little`);
});

test('the two bands are joined by a jump, and an interpolated join is REFUSED', () => {
  const { ui, display, joinRatio, ratios } = validateSeeds(seeds);
  assert.ok(
    joinRatio > Math.max(...ratios),
    `the join (${joinRatio}) is not larger than the widest UI step (${Math.max(...ratios)})`
  );
  assert.ok(display[0] > ui[ui.length - 1], 'the display band does not start above the UI band');

  // Set the display base one step above the UI band's top: a continuation, not a second band.
  refusedWith(
    (s) => {
      s.type.display.base = band(s.type.ui).at(-1) + 1;
    },
    'INTERPOLATION',
    'never interpolate'
  );
});

test('neither band is derived from the other — changing the UI band moves no display size', () => {
  const a = buildModel(seeds).scale.filter((s) => s.band === 'display').map((s) => s.size);
  const s = clone();
  s.type.ui = { base: 11, increment: 1, steps: 4 }; // 11 12 13 14 — still a jump to 20
  const b = buildModel(s).scale.filter((x) => x.band === 'display').map((x) => x.size);
  assert.deepEqual(b, a, 'a display size moved when only the UI band changed — one band is derived from the other');

  // The other direction, and it is why the fixture above is 11/+1 rather than 12/+2: a UI band of
  // 12 14 16 18 tops out one step of 1.167 below a display base of 20, and the join (1.111) is then
  // NARROWER than a step inside the band. That is not a jump, and the generator refuses it — the
  // instrument catching a ramp that reads fine as a list of numbers.
  const tooClose = clone();
  tooClose.type.ui = { base: 12, increment: 2, steps: 4 };
  assert.throws(() => buildModel(tooClose), SeedsRefused, 'a band that closes the gap to 20px was accepted');
});

// ── THE REFUSAL THAT MATTERS MOST: the defect that shipped ───────────────────────────────────────

test('a fractional increment is REFUSED, and the refusal names the measured references', () => {
  const msg = refusedWith(
    (s) => {
      s.type.ui.increment = 0.5;
    },
    'not an integer',
    'DESIGN-CAPABILITY.md §7.1'
  );
  // The refusal must cite the measurement, not assert the rule. All four references, by name.
  for (const site of Object.keys(REFERENCE_INCREMENTS)) {
    assert.ok(msg.includes(site), `the refusal does not name ${site}: ${msg}`);
  }
  assert.ok(msg.includes('+0.5'), 'the refusal does not name the measured defect it exists to stop');
  assert.ok(msg.includes('1.067'), 'the refusal does not carry the reference floor the defect fell below');
});

test('a fractional increment is refused in the DISPLAY band too', () => {
  refusedWith(
    (s) => {
      s.type.display.increment = 8.5;
    },
    'not an integer'
  );
});

test('a fractional base is refused — a whole-number increment does not save it', () => {
  refusedWith(
    (s) => {
      s.type.ui.base = 11.5;
    },
    'not an integer',
    'fractional'
  );
});

test('the UI band steps by +1 or +2 and nothing else', () => {
  const msg = refusedWith(
    (s) => {
      s.type.ui.increment = 3;
    },
    '+1 or +2'
  );
  // This refusal is the weaker of the two and the message must SAY SO, because n=4 maximally
  // correlated references is not the same evidence as "no reference does this at all".
  assert.ok(msg.includes('WEAKER'), 'the weaker refusal does not disclose that it is the weaker one');
  assert.ok(msg.includes('n=4'), 'the weaker refusal does not state its sample size');
});

test('a display increment inside the UI band range is refused as a continuation', () => {
  refusedWith(
    (s) => {
      s.type.display.increment = 2;
    },
    'derived SEPARATELY',
    'continuation of the UI band'
  );
});

// ── DERIVATION 3: the line-height curve ──────────────────────────────────────────────────────────

test('line-height is a CURVE, not a constant, and it peaks where the sources say', () => {
  const { peak, peakAt } = seeds.type.leading;
  const values = band(seeds.type.ui).map((s) => leadingFor(s, seeds.type.leading));
  assert.ok(new Set(values).size > 1, `line-height is constant across the band (${values[0]}) — the curve is gone`);

  assert.equal(leadingFor(peakAt, seeds.type.leading), peak, 'the curve does not reach its peak at peakAt');
  assert.ok(peak >= 1.5 && peak <= 1.56, `peak ${peak} is outside the sourced 1.5-1.56 band (§7.1)`);
  assert.ok(peakAt >= 16 && peakAt <= 18, `peakAt ${peakAt} is outside the sourced 16-18px band (§7.1)`);

  // It falls away on BOTH sides of the peak, which is what makes it a curve rather than a ramp.
  assert.ok(leadingFor(peakAt - 5, seeds.type.leading) < peak, 'the curve does not fall below the peak going down');
  assert.ok(leadingFor(peakAt + 5, seeds.type.leading) < peak, 'the curve does not fall below the peak going up');
});

test('the curve makes leading-relaxed (1.625) at UI sizes inexpressible', () => {
  // The measured defect: 1.625 applied 27 times across 10-15px. The clamp is what stops it.
  for (const s of [10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 32, 64]) {
    const v = leadingFor(s, seeds.type.leading);
    assert.ok(v <= seeds.type.leading.peak, `leading(${s}) = ${v} exceeds the peak — the clamp is gone`);
    assert.ok(v >= 1, `leading(${s}) = ${v} is below 1.0 — the floor is gone`);
    assert.notEqual(v, 1.625, `leading(${s}) produced 1.625, the exact value this generator exists to make unreachable`);
  }
});

test('the display band reaches displayRatio exactly, and the curve is not applied to it', () => {
  const { displayRatio } = seeds.type.leading;
  const model = buildModel(seeds);
  const displaySteps = model.scale.filter((s) => s.band === 'display');
  assert.ok(displaySteps.length >= 1, 'CONTROL: no display steps to check');
  for (const s of displaySteps) {
    assert.equal(s.lineHeight, displayRatio, `display step ${s.name} is ${s.lineHeight}, not displayRatio`);
    assert.notEqual(
      s.lineHeight,
      leadingFor(s.size, seeds.type.leading),
      `display leading equals the UI curve at ${s.size}px — displayRatio is being ignored`
    );
  }
  assert.equal(displayRatio, 1, '§7.1: display sizes reach exactly 1.0');
});

test('a displayRatio looser than the peak inverts the curve and is refused', () => {
  refusedWith(
    (s) => {
      s.type.leading.displayRatio = s.type.leading.peak + 0.1;
    },
    'inverts the curve'
  );
});

test('a peak outside the enforced band is refused, and the refusal owns its widening', () => {
  // The enforced bound is the sourced 1.5-1.56 / 16-18px band, widened. That widening is not in any
  // source, so the message must say whose it is — otherwise a reader takes the enforced number for
  // the measured one, which is the exact error §7.1 catalogues four times over.
  const a = refusedWith((s) => { s.type.leading.peak = 1.9; }, 'SOURCED peak is 1.5-1.56', "THIS SCRIPT'S");
  assert.ok(a.includes(String(LEADING_BOUNDS.peak[1])), 'the refusal does not state the bound it enforced');
  const b = refusedWith((s) => { s.type.leading.peakAt = 11; }, 'SOURCED', "THIS SCRIPT'S");
  assert.ok(b.includes(String(LEADING_BOUNDS.peakAt[0])), 'the refusal does not state the bound it enforced');

  // CONTROL: the authored seeds sit inside the bound, so the bound is not refusing everything.
  assert.doesNotThrow(() => validateSeeds(clone()));
  assert.ok(LEADING_BOUNDS.peak[0] < 1.5 && LEADING_BOUNDS.peak[1] > 1.56, 'the bound no longer contains the sourced band');
});

// ── DERIVATION 4: tracking ───────────────────────────────────────────────────────────────────────

test('tracking is monotone with size: positive below zeroAt, zero at it, negative above', () => {
  const { zeroAt } = seeds.type.tracking;
  const sizes = [...band(seeds.type.ui), ...band(seeds.type.display)];
  const values = sizes.map((s) => trackingFor(s, seeds.type.tracking));

  for (let i = 1; i < values.length; i++) {
    assert.ok(
      values[i] < values[i - 1],
      `tracking is not monotone: ${sizes[i - 1]}px -> ${values[i - 1]}, ${sizes[i]}px -> ${values[i]}`
    );
  }
  assert.equal(trackingFor(zeroAt, seeds.type.tracking), 0, 'tracking is not zero at zeroAt');
  assert.ok(trackingFor(zeroAt - 3, seeds.type.tracking) > 0, 'tracking is not positive below zeroAt');
  assert.ok(trackingFor(zeroAt + 6, seeds.type.tracking) < 0, 'tracking is not negative above zeroAt');
  assert.ok(
    trackingFor(zeroAt + 12, seeds.type.tracking) < trackingFor(zeroAt + 6, seeds.type.tracking),
    'tracking is not INCREASINGLY negative above zeroAt (§7.1)'
  );
});

test('a negative slope inverts the sourced rule and is refused', () => {
  refusedWith((s) => { s.type.tracking.slope = -0.0022; }, 'sourced rule inverted');
});

// ── CONTRAST: reproduced, not asserted ───────────────────────────────────────────────────────────

test('contrast reproduces the two figures the brief names', () => {
  assert.equal(contrast(hexToRgb('#e6e8ec'), hexToRgb('#0d0e11')), 15.734, 'body copy pair');
  // The divider pair, given in the rgb() form styles.css documents as 3.139:1.
  assert.equal(contrast([90, 98, 112], [13, 14, 17]), 3.139, '--color-divider on --color-ink');
  // And the hex spelling of the same colours must agree with the rgb spelling.
  assert.equal(contrast(hexToRgb('#5a6270'), hexToRgb('#0d0e11')), 3.139, 'the hex path disagrees with the rgb path');
});

test('every contrast figure documented in styles.css is reproduced — with one 0.001 discrepancy, named', () => {
  // FOUND BY THIS GENERATOR, 2026-08-29. Ten of eleven documented figures reproduce exactly. The
  // eleventh, --color-warn, is documented as 8.582:1 and computes 8.58149... -> 8.581. That is the
  // point of a computed table: styles.css says its own figures were "all re-measured on 2026-08-13
  // after review found every one of them wrong", and one is still off. Pinned here so that
  // "correcting" the rounding to make it 8.582 is a red test rather than a silent regression.
  const documented = {
    'row-alt': ['#15171d', 1.077],
    raised: ['#1e222b', 1.212],
    line: ['#2a2f39', 1.438],
    'line-strong': ['#3d4451', 1.971],
    divider: ['#5a6270', 3.139],
    text: ['#e6e8ec', 15.734],
    muted: ['#9aa1ad', 7.422],
    dim: ['#7b8494', 5.12],
    live: ['#3fbf8f', 8.327],
    bad: ['#e2727a', 6.362],
  };
  for (const [name, [hex, expected]] of Object.entries(documented)) {
    assert.equal(contrast(hexToRgb(hex), hexToRgb('#0d0e11')), expected, `${name} (${hex})`);
  }
  assert.equal(contrast(hexToRgb('#d9a441'), hexToRgb('#0d0e11')), 8.581, 'warn: the known discrepancy moved');
  assert.notEqual(8.581, 8.582, 'CONTROL: the discrepancy is real, not a formatting artifact');
});

test('luminance is the WCAG piecewise function, at both ends and across the knee', () => {
  assert.equal(luminance([0, 0, 0]), 0);
  assert.equal(luminance([255, 255, 255]), 1);
  // The 0.03928 knee: below it the transfer is linear, above it a power curve. A single-branch
  // implementation passes black and white and fails here.
  const below = luminance([9, 9, 9]); // 9/255 = 0.0353, under the knee
  assert.ok(Math.abs(below - 9 / 255 / 12.92) < 1e-12, 'the linear branch below 0.03928 is gone');
  const above = luminance([11, 11, 11]); // 11/255 = 0.0431, over the knee
  assert.ok(
    Math.abs(above - ((11 / 255 + 0.055) / 1.055) ** 2.4) < 1e-12,
    'the power branch above 0.03928 is gone'
  );
  assert.ok(above > below, 'luminance is not monotone across the knee');
});

test('hex parsing refuses shorthand and anything that is not 6 digits', () => {
  assert.deepEqual(hexToRgb('#0d0e11'), [13, 14, 17]);
  assert.deepEqual(hexToRgb('#FFFFFF'), [255, 255, 255]);
  for (const bad of ['#abc', '0d0e11', '#0d0e1', '#0d0e111', 'rgb(1,2,3)', '', null, undefined]) {
    assert.equal(hexToRgb(bad), null, `${JSON.stringify(bad)} was accepted`);
  }
});

test('a colour that is not 6-digit hex is refused, and so is a pair naming a colour that does not exist', () => {
  refusedWith((s) => { s.color.ink = '#abc'; }, 'not a 6-digit hex');
  refusedWith((s) => { s.contrastPairs[0].fg = 'nosuchcolour'; }, 'not a colour in the', 'silently dropped');
  refusedWith((s) => { delete s.contrastPairs[0].note; }, 'no stated job');
});

test('every seeded pair appears in the computed table, with both hexes carried', () => {
  const model = buildModel(seeds);
  assert.equal(model.pairs.length, seeds.contrastPairs.length, 'a pair was dropped between seeds and model');
  for (const p of model.pairs) {
    assert.equal(p.fgHex, seeds.color[p.fg].toLowerCase());
    assert.equal(p.bgHex, seeds.color[p.bg].toLowerCase());
    assert.ok(p.ratio >= 1 && p.ratio <= 21, `ratio ${p.ratio} is outside the possible range [1, 21]`);
  }
  // The AA/AAA thresholds are WCAG's, not ours.
  assert.equal(WCAG.AA, 4.5);
  assert.equal(WCAG.AAA, 7);
});

// ── COLOUR IS CARRIED, NOT DERIVED ───────────────────────────────────────────────────────────────

test('colour passes through unchanged — nothing about a palette is generated', () => {
  const model = buildModel(seeds);
  const seeded = Object.keys(seeds.color).filter((k) => !k.startsWith('$'));
  assert.deepEqual(model.colors.map((c) => c.name), seeded, 'the colour set changed shape');
  for (const c of model.colors) {
    assert.equal(c.hex, seeds.color[c.name].toLowerCase(), `${c.name} was altered on the way through`);
  }
  assert.equal(seeded.length, 12, 'the twelve mission-control colours are no longer twelve');
});

// ── THE GENERATED FILES ──────────────────────────────────────────────────────────────────────────

test('the committed design/tokens/ matches a fresh generation', () => {
  const { files } = generate(readSeeds(), TODAY);
  const onDisk = Object.fromEntries(
    Object.keys(OUT).map((k) => [k, fs.existsSync(OUT[k]) ? fs.readFileSync(OUT[k], 'utf8') : null])
  );
  const findings = drift(files, onDisk);
  assert.deepEqual(
    findings.map((f) => `${f.key}: ${f.kind}`),
    [],
    `design/tokens/ has drifted from seeds.json. Run: npm run build:tokens\n` +
      findings.map((f) => `  ${f.key} — ${f.detail}`).join('\n')
  );
});

test('every generated file carries the GENERATED banner; seeds.json does not', () => {
  for (const [key, p] of Object.entries(OUT)) {
    const text = fs.readFileSync(p, 'utf8');
    assert.ok(text.includes(GENERATED_BANNER), `${key} (${path.relative(REPO, p)}) carries no generated banner`);
    assert.ok(text.includes('npm run build:tokens'), `${key} does not say how to regenerate itself`);
  }
  const seedText = fs.readFileSync(SEEDS_PATH, 'utf8');
  assert.ok(!seedText.includes(GENERATED_BANNER), 'seeds.json is AUTHORED and must not claim to be generated');
  assert.ok(seedText.includes('AUTHORED'), 'seeds.json does not say it is the authored one');
});

test('tokens.css emits only integer px sizes and Tailwind v4 theme namespaces', () => {
  const css = fs.readFileSync(OUT.css, 'utf8');
  const sizes = [...css.matchAll(/^\s*--text-[a-z0-9-]+:\s*([\d.]+)px;$/gm)].map((m) => m[1]);
  assert.ok(sizes.length >= 5, `CONTROL: only ${sizes.length} sizes found — the regex is aimed wrong`);
  for (const s of sizes) {
    assert.ok(/^\d+$/.test(s), `tokens.css emitted a fractional size: ${s}px`);
  }
  assert.ok(css.includes('@theme {'), 'tokens.css is not an @theme block');
  for (const ns of ['--text-', '--text-ui-0--line-height', '--text-ui-0--letter-spacing', '--color-', '--font-']) {
    assert.ok(css.includes(ns), `tokens.css does not use the ${ns} namespace Tailwind v4 reads`);
  }
});

test('tokens.ts is valid TypeScript-shaped output with one entry per scale step', () => {
  const ts = fs.readFileSync(OUT.ts, 'utf8');
  const model = buildModel(seeds);
  for (const s of model.scale) {
    assert.ok(ts.includes(`'${s.name}': { size: ${s.size},`), `tokens.ts is missing ${s.name}`);
  }
  assert.ok(ts.includes('export type TypeToken'), 'tokens.ts exports no token union type');
  assert.ok(ts.includes('export type ColorToken'), 'tokens.ts exports no colour union type');
});

test('contrast.md carries every pair and the computed figure, not a carried one', () => {
  const md = fs.readFileSync(OUT.contrast, 'utf8');
  const model = buildModel(seeds);
  for (const p of model.pairs) {
    assert.ok(md.includes(`**${p.ratio.toFixed(3)}:1**`), `contrast.md is missing the ratio for ${p.fg}/${p.bg}`);
  }
  assert.ok(md.includes('8.581:1'), 'contrast.md carries a figure other than the computed one for warn');
  assert.ok(!md.includes('8.582:1'), 'contrast.md reproduced the stale styles.css figure');
  assert.ok(/\*\*Computed:\*\* \d{4}-\d{2}-\d{2}/.test(md), 'contrast.md is not dated');
});

test('--check is stable across days: only the date line is normalised', () => {
  const a = generate(seeds, '2026-01-01').files.contrast;
  const b = generate(seeds, '2099-12-31').files.contrast;
  assert.notEqual(a, b, 'CONTROL: the date is not actually in the output, so this test proves nothing');
  assert.equal(comparable(a), comparable(b), 'a date change is reported as drift');
  // And the normalisation must not swallow a REAL change that happens to be on another line.
  const s = clone();
  s.color.text = '#ffffff';
  assert.notEqual(
    comparable(generate(s, '2026-01-01').files.contrast),
    comparable(a),
    'a changed colour was normalised away with the date'
  );
});

test('drift() names the file AND what changed inside it', () => {
  const { files } = generate(seeds, TODAY);
  const mutated = { ...files, css: files.css.replace('--text-ui-0: 11px;', '--text-ui-0: 12px;') };
  const findings = drift(files, { ...mutated, json: files.json, ts: files.ts, contrast: files.contrast });
  assert.equal(findings.length, 1, 'a one-line change was not reported, or was over-reported');
  assert.equal(findings[0].key, 'css');
  assert.ok(findings[0].detail.includes('--text-ui-0: 12px;'), 'the report does not say what drifted');

  const missing = drift(files, { json: null, css: files.css, ts: files.ts, contrast: files.contrast });
  assert.equal(missing[0].kind, 'missing', 'an absent file is not reported as missing');

  const jsonChanged = drift(files, {
    ...files,
    json: files.json.replace('"value": 11', '"value": 99'),
  });
  assert.ok(jsonChanged[0].detail.includes('->'), 'a JSON change is not reported down to the key');
});

// ── EXIT CODES, through the real CLI ─────────────────────────────────────────────────────────────

function cli(args) {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: stdout, err: '' };
  } catch (e) {
    return { code: e.status, out: String(e.stdout || ''), err: String(e.stderr || '') };
  }
}

test('the CLI distinguishes clean, drifted and refused — three states, three codes', () => {
  const clean = cli(['--check']);
  assert.equal(clean.code, 0, `--check on a clean tree exited ${clean.code}:\n${clean.err}`);
  assert.match(clean.out, /matches seeds\.json/);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-tokens-'));
  try {
    // REFUSED (2): a fractional increment, the defect that shipped.
    const bad = clone();
    bad.type.ui.increment = 0.5;
    const badPath = path.join(dir, 'fractional.json');
    fs.writeFileSync(badPath, JSON.stringify(bad));
    const refused = cli(['--check', '--seeds', badPath]);
    assert.equal(refused.code, 2, `a refused seeds file exited ${refused.code}, not 2`);
    assert.match(refused.err, /REFUSED/);
    assert.match(refused.err, /linear\.app/, 'the CLI refusal does not carry the citation');

    // DRIFT (1): a valid seeds file that is not the committed one.
    const other = clone();
    other.type.ui = { base: 12, increment: 2, steps: 5 };
    other.type.display.base = 32;
    const otherPath = path.join(dir, 'other.json');
    fs.writeFileSync(otherPath, JSON.stringify(other));
    const drifted = cli(['--check', '--seeds', otherPath]);
    assert.equal(drifted.code, 1, `a drifted tree exited ${drifted.code}, not 1`);
    assert.match(drifted.err, /has drifted/);
    assert.match(drifted.err, /npm run build:tokens/, 'the drift report does not say how to fix it');

    // MISSING (2): not a drift. A seeds file that does not exist cannot be generated into one.
    const gone = cli(['--check', '--seeds', path.join(dir, 'nope.json')]);
    assert.equal(gone.code, 2, `a missing seeds file exited ${gone.code}, not 2`);
    assert.match(gone.err, /AUTHORED/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── THE SEEDS FILE IS THE ONLY AUTHORED ONE ──────────────────────────────────────────────────────

test('seeds.json is the only hand-edited file in design/tokens/', () => {
  const dir = path.dirname(SEEDS_PATH);
  const present = fs.readdirSync(dir).sort();
  assert.deepEqual(present, ['contrast.md', 'seeds.json', 'tokens.css', 'tokens.json', 'tokens.ts'].sort());
  const generated = present.filter((f) => f !== 'seeds.json');
  for (const f of generated) {
    assert.ok(
      fs.readFileSync(path.join(dir, f), 'utf8').includes(GENERATED_BANNER),
      `${f} sits in design/tokens/ and does not declare itself generated — so it is a second authored file`
    );
  }
});

test('renderCss is pure over the model — same model, same bytes', () => {
  const model = buildModel(seeds);
  assert.equal(renderCss(model), renderCss(buildModel(seeds)), 'the renderer is not deterministic');
});
