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
  referenceIncrements,
  REFERENCES_DIR,
  LEADING_BOUNDS,
  SeedsRefused,
  WCAG,
  band,
  adjacentRatios,
  adjacentRatiosExact,
  FAMILY_MEMBER,
  assertFamilySafe,
  assertIntegerSizes,
  assertMonotoneRatios,
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

test('the two post-conditions over band() refuse what no seeds file can express', () => {
  // WHY THIS TEST EXISTS: a mutation run over this generator on 2026-08-29 caught 17 of 18 deletions.
  // The one it missed was the monotonicity refusal, because a validated seeds file cannot reach it —
  // an assertion no input can trip is one nobody can prove is load-bearing, and is therefore one
  // somebody deletes. Driving them directly is what makes them controlled.
  assert.throws(() => assertMonotoneRatios([1.1, 1.1]), SeedsRefused, 'a CONSTANT ratio — a modular scale — was accepted');
  assert.throws(() => assertMonotoneRatios([1.05, 1.1]), SeedsRefused, 'an INCREASING ratio was accepted');
  assert.throws(() => assertIntegerSizes([11, 12.5, 14]), SeedsRefused, 'a fractional size was accepted');

  const monotone = assertMonotoneRatios([1.091, 1.083, 1.077]);
  assert.equal(monotone, undefined, 'CONTROL: a decreasing ramp must pass');
  assert.equal(assertIntegerSizes([11, 12, 13]), undefined, 'CONTROL: integer sizes must pass');
  assert.equal(assertMonotoneRatios([]), undefined, 'CONTROL: an empty ramp has nothing to violate');

  // And the message must name the failure mode, or a reader hitting it cannot act on it.
  assert.throws(() => assertMonotoneRatios([1.1, 1.1]), /MODULAR SCALE/);
});

test('the "no input can reach it" claim states its float64 bound, and the bound is real', () => {
  // NEW-5. The claim replacing the retired "exhaustive" one said the ratios strictly decrease "for
  // every base", which is true in the reals and FALSE in float64 — the same class of error as the
  // 3dp rounding it replaced, two corrections in a row. `1 + d/s` rounds to exactly 1.0 once `d/s`
  // drops below 2^-53, and validateSeeds puts no ceiling on the base.
  const strictlyDecreasing = (base) => {
    const ex = adjacentRatiosExact(band({ base, increment: 1, steps: 4 }));
    return ex.every((v, i) => i === 0 || v < ex[i - 1]);
  };

  // The bound the comment states, pinned from BOTH SIDES OF ONE CONSTANT. Writing the two bases as
  // independent literals is not enough and a mutation proved it: swapping the first for 69,200,000
  // — the wrong figure from the original stepped sweep — left both assertions true, because plenty
  // of bases above the smallest also tie. Only `TIE` and `TIE - 1` together pin the SMALLEST.
  const TIE = 67114655;
  assert.equal(strictlyDecreasing(TIE), false, `base ${TIE} no longer ties, so the stated bound is wrong`);
  assert.equal(strictlyDecreasing(TIE - 1), true, `base ${TIE - 1} also ties, so ${TIE} is not the SMALLEST tying base and the comment overstates it`);

  // Every base a font size can take is far below it. This is the half that matters: the assertion
  // is an untrippable tripwire over the range that exists, and that is now checked, not asserted.
  for (const base of [1, 2, 8, 11, 16, 34, 200, 1000, 100000, 1000000, 10000000]) {
    assert.ok(strictlyDecreasing(base), `base ${base} does not strictly decrease, so the tripwire is reachable by a real ramp`);
  }

  // And the refusal AT that base is correct rather than false — the doubles genuinely tie, so the
  // check reports what it sees. Only the claim about reachability was wrong.
  assert.throws(() => assertMonotoneRatios(adjacentRatiosExact(band({ base: 67114655, increment: 1, steps: 4 }))), SeedsRefused);
});

test('the monotonicity check compares EXACT ratios — a 3dp tie is not a modular scale', () => {
  // Reproduced 2026-08-29: {base: 34, increment: 1, steps: 4} was refused as a modular scale.
  // True ratios 1.029412 > 1.028571 > 1.027778 — strictly decreasing. At 3dp: 1.029 1.029 1.028.
  // The refusal told the author something FALSE about their own input, which sends them to fix a
  // defect that is not there.
  const sizes = band({ base: 34, increment: 1, steps: 4 });
  const exact = adjacentRatiosExact(sizes);
  const shown = adjacentRatios(sizes);
  assert.deepEqual(shown, [1.029, 1.029, 1.028], 'CONTROL: the 3dp series no longer ties, so this test cannot detect the defect');
  for (let i = 1; i < exact.length; i++) {
    assert.ok(exact[i] < exact[i - 1], `CONTROL: exact ratio ${exact[i]} is not below ${exact[i - 1]} — the ramp is not the one this test needs`);
  }
  assert.doesNotThrow(() => assertMonotoneRatios(exact), 'a strictly decreasing ramp is still refused as a modular scale');
  // ...and the OLD comparison is what fails, which is what makes this a regression test and not a
  // restatement of the fix.
  assert.throws(() => assertMonotoneRatios(shown), SeedsRefused, 'CONTROL: the rounded series no longer reproduces the defect');

  // End to end through validateSeeds, with a display band that clears the taller UI top.
  const s = clone();
  s.type.ui = { base: 34, increment: 1, steps: 4 };
  s.type.display = { base: 48, increment: 8, steps: 1 };
  assert.doesNotThrow(() => validateSeeds(s), 'validateSeeds still refuses a strictly decreasing ramp');

  // A genuine modular scale — the thing the tripwire exists for — is still refused, exactly.
  assert.throws(() => assertMonotoneRatios([1.125, 1.125, 1.125]), /MODULAR SCALE/);
  assert.throws(() => assertMonotoneRatios([1.0294117, 1.0294117]), /MODULAR SCALE/, 'an exact tie below 3dp was accepted');
  // The message must print enough precision to be actionable: 3dp would reprint the ambiguity.
  assert.throws(() => assertMonotoneRatios([1.028571, 1.028571]), /1\.028571/, 'the message rounds away the difference it is talking about');
});

test('no seeds file that validateSeeds accepts can produce a fractional size', () => {
  // THE CONCLUSION IS TRUE AND ITS OLD JUSTIFICATION WAS NOT. This comment read "exhaustive over
  // the whole accepted input space for base and increment", and the sweep was `base 9..16` while
  // `validateSeeds` accepts ANY integer base >= 1 — an unbounded space no sweep can exhaust. The
  // gap mattered: it is exactly where C5 lived, a real defect at base 34 that this sweep could
  // never have reached however many times it ran.
  //
  // What actually establishes the claim is one line of arithmetic, and it is stated here so a
  // reader can check it rather than trust a range: `band()` computes `base + i * increment` where
  // `validateSeeds` has already refused any non-integer base, increment or steps, and integers are
  // closed under addition and multiplication. No accepted input can produce a fractional size,
  // for any base.
  //
  // The sweep below is therefore a check on the VALIDATOR — that it really does refuse what the
  // argument assumes it refuses — and not a proof of the arithmetic. It is widened from 8 bases to
  // 200 because a wider sweep is cheap and the old range was chosen to match the seeds file rather
  // than to probe anything, and it now spans C5's base 34.
  let accepted = 0;
  let fractionalRefused = 0;
  for (let base = 1; base <= 200; base++) {
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

  // The other half of the argument: the validator must actually refuse the non-integer inputs the
  // arithmetic assumes away. A sweep over integers alone cannot see a validator that stopped
  // refusing fractions, and that is the mutation this pins.
  for (const bad of [{ base: 11.5, increment: 1 }, { base: 11, increment: 0.5 }, { base: 11, increment: 1.5 }]) {
    const s = clone();
    s.type.ui = { ...bad, steps: 4 };
    assert.throws(() => validateSeeds(s), SeedsRefused, `validateSeeds accepted ${JSON.stringify(bad)}`);
    fractionalRefused += 1;
  }
  assert.equal(fractionalRefused, 3);
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
  // The refusal must cite the measurement, not assert the rule. Every reference, by name.
  const corpus = referenceIncrements();
  assert.ok(corpus.n >= 4, `CONTROL: only ${corpus.n} reference(s) in the corpus — the citation proves little`);
  for (const site of Object.keys(corpus.sites)) {
    assert.ok(msg.includes(site), `the refusal does not name ${site}: ${msg}`);
  }
  assert.ok(msg.includes('+0.5'), 'the refusal does not name the measured defect it exists to stop');
  assert.ok(msg.includes('1.067'), 'the refusal does not carry the reference floor the defect fell below');
});

// ── THE CITATION IS DERIVED FROM THE CORPUS, NOT TYPED BESIDE IT ────────────────────────────────
//
// The hand-written `REFERENCE_INCREMENTS` this replaced was labelled "the measured reference
// increments" and was WRONG ON EVERY ENTRY, in both bands, while omitting a fifth reference that
// existed — and it was interpolated verbatim into the refusal a user reads. It shipped in the same
// change as the corpus it disagreed with. That is the failure mode a derived citation cannot have.

test('every increment the refusal cites is read from measured.json, not typed', () => {
  const corpus = referenceIncrements();
  assert.ok(corpus.n >= 4, `CONTROL: ${corpus.n} reference(s) — too few to compare against`);

  // Re-derive independently of the module under test: read the files, do the subtraction here.
  const dirs = fs.readdirSync(REFERENCES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  let compared = 0;
  for (const d of dirs) {
    const file = path.join(REFERENCES_DIR, d.name, 'measured.json');
    if (!fs.existsSync(file)) continue;
    const m = JSON.parse(fs.readFileSync(file, 'utf8'));
    const host = new URL(m.url).hostname.replace(/^www\./, '');
    const steps = (sizes) => sizes.slice(1).map((v, i) => Math.round((v - sizes[i]) * 1000) / 1000);
    assert.ok(corpus.sites[host], `${host} is in the corpus and not in the citation`);
    assert.deepEqual(corpus.sites[host].ui, steps(m.type.bands.ui.sizes), `${host}: cited ui increments disagree with measured.json`);
    assert.deepEqual(corpus.sites[host].display, steps(m.type.bands.display.sizes), `${host}: cited display increments disagree with measured.json`);
    compared += 1;
  }
  assert.equal(compared, corpus.n, 'the citation covers a different set of references than the corpus holds');

  // CONTROL over the INSTRUMENT: pointed at a directory with no corpus it must say so, not quote
  // numbers. A citation with nothing behind it that still looks like a citation is the whole defect.
  const empty = referenceIncrements(path.join(os.tmpdir(), 'no-such-reference-corpus-xyz'));
  assert.equal(empty.n, 0);
  assert.deepEqual(empty.sites, {});
});

test('a reference that will not parse is COUNTED and NAMED, never silently dropped', () => {
  // NEW-4. The parse was `continue`d in silence, justified as "a directory that is not a reference
  // is not evidence, and is not an error either" — true of a directory with NO measured.json, and
  // false of one whose measured.json will not parse, because the second SHRINKS THE SAMPLE while
  // `n` is quoted to the reader as the sample size. Measured with five directories, three
  // malformed: the refusal read "1 of 2 measured reference(s)" and `source` said "2 reference(s)",
  // a smaller but equally confident claim with nothing saying three were dropped.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'partial-corpus-'));
  for (const slug of ['linear-app', 'stripe-com']) {
    fs.mkdirSync(path.join(dir, slug), { recursive: true });
    fs.copyFileSync(path.join(REPO, 'design', 'references', slug, 'measured.json'), path.join(dir, slug, 'measured.json'));
  }
  for (const slug of ['a-broken', 'b-broken', 'c-broken']) {
    fs.mkdirSync(path.join(dir, slug), { recursive: true });
    fs.writeFileSync(path.join(dir, slug, 'measured.json'), '{ truncated');
  }
  fs.mkdirSync(path.join(dir, 'not-a-reference'), { recursive: true });

  const r = referenceIncrements(dir);
  assert.equal(r.n, 2, 'the two good references did not parse');
  assert.equal(r.unreadable.length, 3, `${r.unreadable.length} skips recorded, not 3 — a directory with no measured.json must NOT count as unreadable`);
  for (const slug of ['a-broken', 'b-broken', 'c-broken']) {
    assert.ok(r.unreadable.some((u) => u.startsWith(slug)), `${slug} was skipped without being named`);
  }
  assert.match(r.source, /SKIPPED AS UNREADABLE/, 'source reports a clean count over an incomplete corpus');

  // A clean corpus records an EMPTY list, not a missing one — a field that appears only on failure
  // is a field every caller forgets to check.
  const clean = referenceIncrements();
  assert.deepEqual(clean.unreadable, []);
  assert.doesNotMatch(clean.source, /SKIPPED/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the refusal describes the corpus it cites, and does not overclaim it', () => {
  const corpus = referenceIncrements();
  const msg = refusedWith((s) => { s.type.ui.increment = 0.5; }, 'not an integer');

  // play.grafana.org runs a MULTIPLICATIVE scale and measures fractional UI increments, so the
  // sentence this replaced — "Every measured reference builds its UI band on integer increments" —
  // was false, and DESIGN-CAPABILITY.md §15.16 says so about that exact sentence. Enforcing the
  // rule is fine; misdescribing the evidence for it is not.
  assert.ok(corpus.fractional.length >= 1, `CONTROL: no reference measures fractional increments, so this test cannot detect the overclaim`);
  assert.doesNotMatch(msg, /Every measured reference builds its UI band on integer/, 'the refusal reasserts the claim §15.16 calls FALSE');
  assert.match(msg, /THIS PROJECT'S CHOICE/, 'the refusal does not own the rule as a choice');
  for (const site of corpus.fractional) {
    assert.ok(msg.includes(site), `the refusal does not name ${site}, the reference that does not obey the rule`);
  }
  assert.match(msg, /CONTESTED/, 'the refusal does not report the falsifier verdict for its own rule');
  assert.match(msg, /§15\.16/, 'the refusal does not cite the section that falsifies the older wording');

  // And the weaker refusal must count its sample from the corpus, not from a literal. It read
  // "n=4" while the corpus held five.
  const clamp = refusedWith((s) => { s.type.ui.increment = 3; }, '+1 or +2');
  assert.match(clamp, new RegExp(`n=${corpus.n}\\b`), `the weaker refusal does not state n=${corpus.n}`);
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

test('every hex-against-ink figure in styles.css reproduces, except the TWO named here', () => {
  // THE TITLE AND THE COUNT WERE BOTH WRONG, and they were wrong in the direction that flatters.
  // The old title claimed "every contrast figure documented in styles.css is reproduced"; the old
  // comment said "Ten of eleven documented figures reproduce exactly ... The eleventh, --color-warn"
  // — one discrepancy. There are TWO, same sign and same magnitude:
  //
  //   --color-warn  #d9a441  documented 8.582:1   computes 8.581493 -> 8.581   (-0.001)
  //   (rejected)    #6a7280  documented 3.982:1   computes 3.981041 -> 3.981   (-0.001)
  //
  // and #6a7280 was simply absent from the map while the title asserted completeness over the file.
  // Two figures off by the same amount in the same direction is not two mistakes; styles.css
  // rounded up where nearest-rounding gives down, twice. That is a more useful thing to know than
  // "one figure is off", and stating it needed the second one to be in the map.
  //
  // WHAT THIS TEST DOES NOT COVER, SAID OUT LOUD. styles.css carries 17 distinct ratio figures.
  // Twelve are a documented hex against --color-ink and are all checked below. The other five are
  // out of reach of a hex-vs-hex computation and are NOT silently omitted: 4.5:1 is the WCAG
  // threshold rather than a measurement; 1.06:1 and 1.27:1 are an input fill and its border, not
  // pairs against ink; 1.985:1 and 4.563:1 are states of an opacity animation, which no pair of
  // hexes can reproduce. A test that quietly dropped those and kept the word "every" is the defect
  // being fixed here, so the exclusions are enumerated instead.
  const ink = '#0d0e11';
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
    assert.equal(contrast(hexToRgb(hex), hexToRgb(ink)), expected, `${name} (${hex})`);
  }

  // THE TWO DISCREPANCIES, each pinned so that "correcting" the rounding to match styles.css is a
  // red test rather than a silent regression.
  const discrepancies = [
    ['--color-warn', '#d9a441', 8.582, 8.581, 8.5815],
    ['the rejected #6a7280', '#6a7280', 3.982, 3.981, 3.9815],
  ];
  for (const [name, hex, documentedRatio, computed, ceiling] of discrepancies) {
    const got = contrast(hexToRgb(hex), hexToRgb(ink));
    assert.equal(got, computed, `${name}: the known discrepancy moved`);
    assert.notEqual(got, documentedRatio, `${name}: it now agrees with styles.css, so the discrepancy is gone`);
    // C13: the control this replaces was `assert.notEqual(8.581, 8.582)` — two number literals,
    // which cannot fail against any code while wearing a CONTROL label. This one drives the
    // COMPUTED value, and pins the unrounded figure below the half-way point, so the difference is
    // shown to be arithmetic rather than a formatting artifact.
    const a = luminance(hexToRgb(hex));
    const b = luminance(hexToRgb(ink));
    const unrounded = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(
      unrounded < ceiling,
      `${name}: unrounded ${unrounded} is at or above ${ceiling}, so ${documentedRatio} would be the correct 3dp value and there is no discrepancy to pin`,
    );
    assert.equal(Math.round((documentedRatio - computed) * 1000) / 1000, 0.001, `${name}: the discrepancy is no longer +0.001`);
  }
  assert.equal(discrepancies.length, 2, 'the count of known discrepancies changed and the comment above did not');
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

// ── THE FAMILY IS A SINK, AND seeds.json IS THE TRUST BOUNDARY ──────────────────────────────────
//
// renderCss interpolates `type.family.*` VERBATIM into a declaration inside `@theme { }` and CSS
// offers no escaping there. Measured on this file before the fix (2026-08-29), with
// `type.family.sans` = `x, sans-serif} :root{--color-danger:#00ff00} a{content:"` :
//
//   validateSeeds accepts it:                    true
//   @theme opens line 7, brace depth hits 0 at:  line 9
//   declarations NO LONGER inside @theme:        31 of 32
//   final brace depth:                           0    <- balanced, so the file still PARSES
//   attacker property --color-danger present:    true
//
// The whole generated design system silently stops applying and nothing downstream notices —
// `drift()` compares the committed file against a fresh generation from the SAME seeds, so
// poisoned seeds produce a poisoned file the drift check calls correct. `renderTs` is not a sink:
// JSON.stringify escapes. These are the tests that make the seeds file the boundary.

/** Read a CSS text the way a CSS tokenizer does: comments and strings carry no block structure. */
function braceScan(css) {
  let depth = 0;
  let line = 1;
  let closedAt = null;
  const depthAtLineStart = [0];
  for (let i = 0; i < css.length; ) {
    const c = css[i];
    if (c === '\n') {
      line += 1;
      depthAtLineStart[line - 1] = depth;
      i += 1;
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      for (let j = i; j < stop; j += 1) {
        if (css[j] === '\n') {
          line += 1;
          depthAtLineStart[line - 1] = depth;
        }
      }
      i = stop;
    } else if (c === '"' || c === "'") {
      // CSS Syntax 4.3.5: a newline inside a string ends it as a <bad-string>.
      i += 1;
      while (i < css.length && css[i] !== c && css[i] !== '\n') i += css[i] === '\\' ? 2 : 1;
      if (css[i] === c) i += 1;
    } else {
      if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0 && closedAt === null) closedAt = line;
      }
      i += 1;
    }
  }
  return { finalDepth: depth, closedAt, depthAtLineStart };
}

test('a family value that could break out of @theme is REFUSED at seeds.json, the trust boundary', () => {
  // The exact string the adversarial review measured, plus the shapes it generalises to.
  const breakout = 'x, sans-serif} :root{--color-danger:#00ff00} a{content:"';
  const msg = refusedWith((s) => { s.type.family.sans = breakout; }, 'renderCss', '@theme', 'trust boundary');
  assert.ok(msg.includes(JSON.stringify('x')) || msg.includes('sans-serif}'), `the refusal does not name the offending member:\n  ${msg}`);

  for (const bad of [
    'x} :root{--color-danger:#00ff00} a{content:"', // the brace escape itself
    'Inter; --color-ink: #ff0000',                  // a second declaration via `;`
    'Inter /* */ ; color: red',                     // a comment used to hide the payload
    'Inter\\}',                                     // a backslash escape reaching the sink
    'Inter\n  --color-ink: #ff0000',                // a newline, so the payload owns its own line
    "'unterminated",                                // an unclosed quote swallows the rest of the file
    "'a'b'",                                        // nested quotes: closed, then reopened
    'url(http://evil.example/x)',                   // a fetch from a value that looks like a font
  ]) {
    refusedWith((s) => { s.type.family.mono = bad; }, 'is not a font-family name');
  }

  // An ARRAY is the other accepted shape and it must not be the way around the string check.
  refusedWith((s) => { s.type.family.sans = ['Inter', 'x} :root{--color-danger:#0f0} a{content:"']; }, 'is not a font-family name');
  refusedWith((s) => { s.type.family.sans = ['Inter', '']; }, 'empty stack member');

  // CONTROL, and it is the reason this is an allow-list rather than the blanket deny-list first
  // proposed: refusing every one of `; { } / * " ' \` and newline refuses four members of the
  // COMMITTED stacks. A quoted name is the CSS idiom for a family carrying a space.
  for (const member of ["'Segoe UI'", "'SF Mono'", "'JetBrains Mono'", "'Fira Code'", '"SF Pro Display"', 'ui-sans-serif', '-apple-system', 'system-ui', 'Segoe UI', 'sans-serif', 'ui-monospace', 'Menlo', 'Consolas', 'monospace']) {
    assert.ok(FAMILY_MEMBER.test(member), `${member} is a real font-family member and the grammar refuses it`);
    assert.doesNotThrow(() => assertFamilySafe('sans', member), `assertFamilySafe refuses ${member}`);
  }
  assert.doesNotThrow(() => validateSeeds(clone()), 'the committed seeds.json no longer validates');
});

// ── AND THE CORRECTION OVERSHOT THE OTHER WAY ───────────────────────────────────────────────────
//
// The allow-list that closed the injection was ASCII-ONLY — `'[A-Za-z0-9 _-]+'` — so it refused
// valid CSS. Measured 2026-08-29, before this test existed:
//
//   REFUSED  "微软雅黑", sans-serif        REFUSED  "맑은 고딕", sans-serif
//   REFUSED  "ヒラギノ角ゴ ProN", sans-serif  REFUSED  "Åkzidenz Grotesk", sans-serif
//   REFUSED  微软雅黑, sans-serif          <- the UNQUOTED branch had it too, which the brief
//                                            scoping the fix to the quoted branch did not cover
//
// A blanket deny-list was too broad and this allow-list was too narrow: each correction overshot
// in the opposite direction, and the shape that is neither is a deny-list scoped to the QUOTED
// branch, where a CSS string already neutralises `}` `;` and `/*`, plus Unicode letters in the
// unquoted branch, which has no string to protect it and so stays an allow-list.
//
// Latent rather than live — the committed seeds are ASCII — but `build-tokens --check` rides
// `test:lenses`, a CI step, so the first CJK or accented family turns the build red.

test('a font name in any script is expressible, and the injection stays refused', () => {
  const valid = [
    ['"微软雅黑", sans-serif', 'Chinese, quoted'],
    ['"ヒラギノ角ゴ ProN", sans-serif', 'Japanese, quoted, with a space'],
    ['"맑은 고딕", sans-serif', 'Korean, quoted, with a space'],
    ['"Åkzidenz Grotesk", sans-serif', 'a Latin-1 accented letter'],
    ['"Noto Naskh Arabic", "شبك", sans-serif', 'Arabic — RTL, and its bidi marks are NOT refused'],
    ['"עברית", sans-serif', 'Hebrew'],
    ['"Ελληνικά", sans-serif', 'Greek'],
    ['"Ру́сский", sans-serif', 'Cyrillic with a combining mark'],
    ['微软雅黑, sans-serif', 'UNQUOTED non-ASCII — the branch the brief scoped out'],
    ['Åkzidenz Grotesk, sans-serif', 'unquoted, accented, space-separated'],
    // SINGLE-QUOTED, AND THESE ARE HERE BECAUSE A MUTATION SURVIVED WITHOUT THEM. Reverting only
    // the single-quoted alternative of FAMILY_MEMBER to `'[A-Za-z0-9 _-]+'` — the N1 regression
    // exactly — left all 41 tests green, because every international case above is DOUBLE-quoted
    // and the two alternatives are independent. The reviewer's examples were all double-quoted and
    // this test had copied that shape, so it covered one of the two branches it was written for.
    ["'微软雅黑', sans-serif", 'Chinese, SINGLE-quoted'],
    ["'맑은 고딕', sans-serif", 'Korean, SINGLE-quoted, with a space'],
    ["'Åkzidenz Grotesk', sans-serif", 'accented, SINGLE-quoted'],
    ["'ヒラギノ角ゴ ProN', sans-serif", 'Japanese, SINGLE-quoted'],
  ];
  for (const [value, why] of valid) {
    assert.doesNotThrow(() => assertFamilySafe('sans', value), `${why}: ${value} is valid CSS and is refused`);
  }

  // EVERY ONE OF THE EIGHT PAYLOADS THAT MOTIVATED THE GRAMMAR, RE-RUN AGAINST THE WIDER ONE.
  // Widening a security predicate without re-running what it was built to stop is how the second
  // fix undoes the first, so these are executed here rather than argued to survive.
  const hostile = [
    ['x} :root{--color-danger:#00ff00} a{content:"', 'the brace escape itself'],
    ['Inter; --color-ink: #ff0000', 'a second declaration via `;`'],
    ['Inter /* */ ; color: red', 'a comment used to hide the payload'],
    ['Inter\\}', 'a backslash escape reaching the sink'],
    ['Inter\n  --color-ink: #ff0000', 'a newline, so the payload owns its own line'],
    ["'unterminated", 'an unclosed quote swallows the rest of the file'],
    ["'a'b'", 'nested quotes: closed, then reopened'],
    ['url(http://evil.example/x)', 'a fetch from a value that looks like a font'],
  ];
  for (const [value, why] of hostile) {
    assert.throws(() => assertFamilySafe('mono', value), SeedsRefused, `${why}: ${JSON.stringify(value)} is accepted by the widened grammar`);
  }
  assert.equal(hostile.length, 8, 'the eight payloads that motivated the grammar are no longer eight');

  // The characters that end a CSS string or escape out of it stay refused INSIDE quotes, which is
  // the whole of the scoped deny-list. Everything else may live there, because a string is a string.
  for (const inside of ['"a\"b"', "'a'b'", '"a\\\\b"', '"a\nb"', '"a\u0000b"', '"a\u007Fb"']) {
    assert.ok(!FAMILY_MEMBER.test(inside), `${JSON.stringify(inside)} can end or escape the string and is accepted`);
  }
  for (const inside of ['"a}b"', '"a;b"', '"a/*b"', '"a{b"']) {
    assert.ok(FAMILY_MEMBER.test(inside), `${JSON.stringify(inside)} is inert inside a CSS string and is refused anyway`);
  }

  // END TO END: a CJK stack must reach the stylesheet intact, still inside @theme.
  const s = clone();
  s.type.family.sans = '"微软雅黑", "Noto Sans SC", sans-serif';
  assert.doesNotThrow(() => validateSeeds(s));
  const css = renderCss(buildModel(s));
  const line = css.split('\n').find((l) => l.includes('--font-sans'));
  assert.equal(line.trim(), '--font-sans: "微软雅黑", "Noto Sans SC", sans-serif;');
  assert.equal(css.split('\n').filter((l) => /^@theme\s*\{/.test(l)).length, 1, 'the CJK stack broke the @theme block');
});

test('every emitted declaration lands INSIDE @theme — brace depth, not "it parses"', () => {
  const css = renderCss(buildModel(seeds));
  const lines = css.split('\n');
  const scan = braceScan(css);

  const opens = lines.filter((l) => /^@theme\s*\{/.test(l)).length;
  assert.equal(opens, 1, `expected exactly one @theme block, found ${opens}`);
  assert.equal(scan.finalDepth, 0, 'the stylesheet is not brace-balanced');

  const decls = lines.map((l, i) => [i, l]).filter(([, l]) => /^\s*--[\w-]+\s*:/.test(l));
  assert.ok(decls.length >= 30, `CONTROL: only ${decls.length} declarations — too few for this test to prove anything`);
  for (const [i, l] of decls) {
    assert.equal(scan.depthAtLineStart[i], 1, `line ${i + 1} sits at brace depth ${scan.depthAtLineStart[i]}, not inside @theme: ${l.trim()}`);
    assert.ok(scan.closedAt === null || i + 1 < scan.closedAt, `line ${i + 1} is emitted AFTER @theme closes on line ${scan.closedAt}: ${l.trim()}`);
  }
  assert.equal(scan.closedAt, lines.length - 1, `@theme closes on line ${scan.closedAt}, not on the last line (${lines.length - 1})`);

  // CONTROL over the INSTRUMENT. A scanner that never reports an escape would pass the assertions
  // above on any input at all, so drive it with the poisoned output the fix now makes unreachable.
  // Built by hand rather than through validateSeeds, precisely because validateSeeds refuses it.
  const poisoned = css.replace(
    /^(\s*--font-sans: ).*$/m,
    '$1x, sans-serif} :root{--color-danger:#00ff00} a{content:";'
  );
  assert.notEqual(poisoned, css, 'CONTROL: the poisoned variant was not built — the --font-sans line moved');
  const bad = braceScan(poisoned);
  const stranded = poisoned.split('\n').map((l, i) => [i, l]).filter(([i, l]) => /^\s*--[\w-]+\s*:/.test(l) && i + 1 > bad.closedAt);
  assert.ok(stranded.length >= 30, `CONTROL FAILED: the scanner sees no escape in a stylesheet that has one — ${stranded.length} stranded declaration(s)`);
  assert.equal(bad.finalDepth, 0, 'CONTROL: the poisoned stylesheet is BALANCED, which is exactly why "it parses" proves nothing');
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
  // THIS IS THE DRIFT GATE, AND IT LIVES HERE RATHER THAN BEHIND A `check:*` SCRIPT NAME.
  // `check:*` and `test:*` are GOVERNED prefixes: a new one must be a STEP of the suite or carry an
  // EXCLUDED entry in scripts/lib/check-suite.js — and editing that file is `irreversible` tier,
  // while an EXCLUDED script runs in no automated lane at all. So the name would have cost a founder
  // sign-off and bought zero coverage. As an assertion in this file it runs on every `npm run check`
  // and every CI run, through `test:lenses`. `node scripts/build-tokens.mjs --check` still exists for
  // humans; it is simply not a named npm script.
  const { files } = generate(readSeeds(), TODAY);
  const onDisk = Object.fromEntries(
    Object.keys(OUT).map((k) => [k, fs.existsSync(OUT[k]) ? fs.readFileSync(OUT[k], 'utf8') : null])
  );

  const findings = drift(files, onDisk);
  assert.deepEqual(
    findings.map((f) => `${f.key}: ${f.kind}`),
    [],
    'design/tokens/ has drifted from seeds.json. Run: npm run build:tokens\n' +
      findings.map((f) => `  ${f.key} — ${f.detail}`).join('\n')
  );

  // BYTE-EQUALITY on the three artifacts that carry no date, because `drift()` compares through
  // `comparable()` and a bug there could swallow a real change on any of them. Asserted against the
  // raw strings so this does not depend on the function it is checking.
  for (const key of ['json', 'css', 'ts']) {
    assert.equal(onDisk[key], files[key], `${path.relative(REPO, OUT[key])} is not byte-identical to a fresh generation`);
  }

  // contrast.md carries the computed date, which is the ONE byte not a function of the seeds. It is
  // normalised — and the tolerance is bounded here rather than trusted: strip the date from both and
  // they must be byte-identical, so nothing else is being forgiven along with it.
  const stripDate = (t) => String(t).replace(/^\*\*Computed:\*\* \d{4}-\d{2}-\d{2}$/m, 'DATE');
  assert.equal(
    stripDate(onDisk.contrast),
    stripDate(files.contrast),
    'contrast.md differs from a fresh generation by more than its date line'
  );
  assert.match(onDisk.contrast, /^\*\*Computed:\*\* \d{4}-\d{2}-\d{2}$/m, 'contrast.md has no date line, so the tolerance above is vacuous');
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
