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

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
  MAX_BAND_STEPS,
  NOTE_FORBIDDEN,
  PALETTE_NAME,
  SEEDS_TEXT_MAX,
  SeedsRefused,
  WCAG,
  band,
  adjacentRatios,
  adjacentRatiosExact,
  FAMILY_MEMBER,
  FAMILY_SLOTS,
  SEEDS_KEYS,
  assertColorNameSafe,
  assertFamilySafe,
  assertNoteSafe,
  paletteNames,
  renderContrastMd,
  renderJson,
  renderTs,
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

// THE ONE IMPORT FROM THE OTHER LANE, AND IT BUYS EXACTLY ONE ASSERTION. `SEEDS_TEXT_MAX.note` and
// `UNTRUSTED_MAX` are deliberately equal — see SEEDS_TEXT_MAX — and prose saying so is what this
// repository keeps finding to have drifted. Importing the constant makes the reconciliation a thing
// that fails rather than a thing that reads well. extract-reference.mjs drives a browser only
// behind a dynamic import, so this costs no Chromium.
import { UNTRUSTED_MAX } from './extract-reference.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'build-tokens.mjs');
const TODAY = '2026-01-01';

// ── A FIXTURE DIRECTORY THAT DOES NOT DEPEND ON THE AMBIENT TMPDIR ──────────────────────────────
// These call sites read `fs.mkdtempSync(path.join(os.tmpdir(), …))`, and that made the verdict a
// function of an environment variable nobody sets deliberately: identical bytes scored 48/48 with
// TMPDIR pointing at a session scratchpad and 26/48 with TMPDIR at the macOS default
// `/var/folders/…`, where the armed sandbox denies the write. A suite whose result depends on
// where the OS happens to put temp files is not measuring the code.
//
// The repo root is the base instead — it is writable wherever this suite is allowed to run at all.
// Dotted so it is invisible to an ordinary listing. Cleanup is an `after()` HOOK rather than a
// per-caller `rmSync`, because a test that throws never reaches its own cleanup line, and the
// litter would then sit in the repo root rather than in a temp directory the OS reaps.
const TMP_DIRS = [];
function tmpDir(prefix) {
  const d = fs.mkdtempSync(path.join(REPO, `.${prefix}`));
  TMP_DIRS.push(d);
  return d;
}
after(() => {
  for (const d of TMP_DIRS) fs.rmSync(d, { recursive: true, force: true });
});

const seeds = readSeeds();
/** A deep clone, so a test that mutates its seeds cannot leak into the next one. */
const clone = () => JSON.parse(JSON.stringify(seeds));

// ── THE PINNED FIXTURE, AND WHY SEVEN TESTS READ IT INSTEAD OF design/tokens/seeds.json ─────────
//
// A test that builds its input by mutating the LIVE seeds file encodes that file's numbers as a
// premise. Seven tests below did, and the premise they encoded was this repository's own
// 11-15px control-plane band. Measured by porting this file unchanged into a project whose band is
// 12-20px: 44 pass, 7 FAIL — and the failures are not findings about the generator. They are the
// suite reporting that the fixture moved:
//
//   neither band is derived from the other   the `tooClose` arm (ui 12/+2) no longer closes the
//                                            gap to that project's display base, so nothing threw
//   the display band reaches displayRatio     leadingFor(48px) already clamps to 1.0 there, so the
//                                            `notEqual` that proves displayRatio is honoured is
//                                            vacuous — and the assertion said so: "actual 1,
//                                            expected 1"
//   __proto__ is refused by name              the splice anchor `"ink":` is not a colour name there
//   a contrast note cannot forge a row        "CONTROL: only 12 committed notes" against >= 13
//   contrast.md carries every pair            8.581:1 is this palette's figure, not that one's
//   drift() names the file AND what changed   `--text-ui-0: 11px;` is not a line in that stylesheet
//   the CLI distinguishes clean/drifted/…     the "drifted" seeds ARE that project's seeds, exit 0
//
// Every one of those is a true statement about a difference between two projects and a useless
// statement about build-tokens.mjs. Three of them fail through their own CONTROL, which is the
// suite correctly detecting its own vacuity and is exactly why the controls are there.
//
// So those seven read FIXTURE. It is a complete, valid seeds object — validateSeeds accepts it,
// including the unknown-key refusal — chosen so that every arm those tests need is expressible:
// the ui/display join is wide enough to survive a narrowed ui band and narrow enough that a
// 12/+2 band closes it; the leading curve at BOTH display sizes stays clear of the 1.0 clamp, so
// `displayRatio` being honoured is observable rather than coincidental; the palette names are
// `fx-`prefixed so a generation from it cannot accidentally equal any project's committed tokens;
// and the notes carry the prose punctuation (Δ, an em dash, parentheses, a semicolon) that the
// note deny-list must NOT refuse.
//
// WHAT DELIBERATELY STILL READS THE LIVE FILE, because it is genuinely about the live file:
// `the committed design/tokens/ matches a fresh generation`, `seeds.json is the only hand-edited
// file in design/tokens/`, `every generated file carries the GENERATED banner`, the CLI's CLEAN
// arm, `every increment the refusal cites is read from measured.json`, and every refusal test that
// mutates one field of the real seeds to prove the real seeds are one edit away from being
// refused. Those go red when THIS repository changes, which is the point of them.
const FIXTURE = {
  $comment: 'A pinned seeds fixture. Not derived from design/tokens/seeds.json and not to be synced with it.',
  type: {
    ui: { base: 11, increment: 1, steps: 5 },
    display: { base: 20, increment: 4, steps: 2 },
    leading: { peak: 1.5, peakAt: 16, falloff: 0.9, exponent: 2, displayRatio: 1 },
    tracking: { zeroAt: 14, slope: 0.001 },
    family: { sans: 'ui-sans-serif, system-ui, sans-serif', mono: 'ui-monospace, Menlo, monospace' },
  },
  color: {
    'fx-ink': '#101216',
    'fx-row': '#15171d',
    'fx-dim': '#8b93a7',
    'fx-text': '#e6e9ef',
    'fx-warn': '#d99b3f',
  },
  contrastPairs: [
    { fg: 'fx-text', bg: 'fx-ink', note: 'body copy on the base surface; the ratio is the metric here' },
    { fg: 'fx-dim', bg: 'fx-ink', note: 'secondary copy — must clear AA (4.5) at the smallest UI size' },
    { fg: 'fx-warn', bg: 'fx-ink', note: 'a warning label; TEXT, not a surface — read this before the verdict' },
    { fg: 'fx-row', bg: 'fx-ink', note: 'SURFACE PAIR — row banding. ΔE76 (4.82) is the right metric here; the ratio is not' },
  ],
};

/** A deep clone of the fixture, for the same reason `clone()` exists for the live seeds. */
const fixture = () => JSON.parse(JSON.stringify(FIXTURE));

test('CONTROL over the fixture: it is a VALID seeds object, and it is not the committed one', () => {
  // If this goes red every fixture-based test below is measuring the fixture rather than the
  // generator, so it runs first and says so plainly.
  assert.doesNotThrow(() => validateSeeds(fixture()), 'the pinned fixture is refused by the generator it is meant to drive');
  assert.notDeepEqual(
    paletteNames(FIXTURE.color).sort(),
    paletteNames(seeds.color).sort(),
    'the fixture palette equals the committed one, so "a generation from the fixture drifts" is no longer guaranteed'
  );
  const displaySteps = buildModel(FIXTURE).scale.filter((s) => s.band === 'display');
  for (const s of displaySteps) {
    assert.notEqual(
      leadingFor(s.size, FIXTURE.type.leading),
      FIXTURE.type.leading.displayRatio,
      `the fixture curve at ${s.size}px equals displayRatio, so the displayRatio test below is vacuous`
    );
  }
});

/**
 * Assert a seeds mutation is refused AND that the refusal says why, citing something checkable.
 *
 * `base` is the seeds object the mutation is applied to a CLONE of. Two thin wrappers follow: one
 * over the live file, for refusals that are about the live file being one edit from refused, and
 * one over FIXTURE, for refusals whose arms need a band this repository does not happen to ship.
 */
function refusedFrom(base, mutate, ...mustMention) {
  const s = JSON.parse(JSON.stringify(base));
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

const refusedWith = (mutate, ...mustMention) => refusedFrom(seeds, mutate, ...mustMention);
const refusedInFixture = (mutate, ...mustMention) => refusedFrom(FIXTURE, mutate, ...mustMention);

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
  // The bound below is the ARITHMETIC union over 12→20 — `1 + d/s` for d in {1,2} — which is what
  // DESIGN-CAPABILITY.md §7.1 derives, and it is NOT the same set as the measured band. Keep the two
  // apart: the measured band over the corpus is wider at the bottom, because stripe.com's UI band
  // runs to 26px and `1 + 1/21` = 1.048 sits below anything a 12→20 union contains. Derive it, do
  // not quote it:
  //   node -e "const s=['linear-app','stripe-com','vercel-com','play-grafana-org','docs-stripe-com'];
  //     const r=s.flatMap(x=>require('./design/references/'+x+'/measured.json').type.uiSteps.map(t=>t.ratio));
  //     console.log(Math.min(...r), Math.max(...r))"
  //
  // *Superseded 2026-08-29: this comment read "The measured band: linear/stripe/vercel sit in
  // 1.07-1.17 … (its ratios bottomed out at 1.037, below the reference floor of 1.067)." Both
  // figures were wrong and both came from the refuted increment table — the measured band is
  // [1.048, 1.167] and the floor is 1.048. 1.037 is correct and is mission-control's. The BOUND in
  // the assertion is deliberately unchanged: it is the arithmetic union, it is not the measured
  // band, and loosening a live assertion to match a comment would be fixing the wrong half.*
  for (const r of ratios) {
    assert.ok(r >= 1.05 && r <= 1.167, `adjacent ratio ${r} is outside the arithmetic band [1.05, 1.167]`);
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
  // FIXTURE, not the live seeds: the second arm needs a UI band that CLOSES the gap to the display
  // base, and whether 12/+2 does that is a fact about a particular project's display base rather
  // than about the generator. See FIXTURE.
  const a = buildModel(FIXTURE).scale.filter((s) => s.band === 'display').map((s) => s.size);
  const s = fixture();
  s.type.ui = { base: 11, increment: 1, steps: 4 }; // 11 12 13 14 — still a jump to 20
  const b = buildModel(s).scale.filter((x) => x.band === 'display').map((x) => x.size);
  assert.deepEqual(b, a, 'a display size moved when only the UI band changed — one band is derived from the other');
  assert.ok(a.length >= 2, `CONTROL: ${a.length} display size(s) — too few for a moved size to be observable`);

  // The other direction, and it is why the band above is 11/+1 rather than 12/+2: a UI band of
  // 12 14 16 18 tops out one step of 1.167 below a display base of 20, and the join (1.111) is then
  // NARROWER than a step inside the band. That is not a jump, and the generator refuses it — the
  // instrument catching a ramp that reads fine as a list of numbers.
  const tooClose = fixture();
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

  // THE FLOOR IS RE-DERIVED HERE, NOT PINNED — and the pinned version was asserting a FALSE figure.
  // This read `assert.ok(msg.includes('1.067'), ...)`. 1.067 is linear.app's 15→16, read off the
  // hand-written increment table that `referenceIncrements()` exists to replace; the measured floor
  // over `type.uiSteps` is stripe.com's 21→22. So a control was holding a false number in place in a
  // user-facing refusal: correcting the message would have turned this test red, which is what makes
  // a pinned constant in an assertion worse than the same constant in prose.
  //
  // Re-derived independently of the module under test — read the corpus, minimise here.
  const floor = Math.min(
    ...fs
      .readdirSync(REFERENCES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(REFERENCES_DIR, d.name, 'measured.json'))
      .filter((f) => fs.existsSync(f))
      .flatMap((f) => (JSON.parse(fs.readFileSync(f, 'utf8')).type?.uiSteps ?? []).map((t) => t.ratio))
  );
  assert.ok(Number.isFinite(floor), 'CONTROL: no UI-band ratios in the corpus — the assertion below proves nothing');
  assert.notEqual(floor, 1.067, 'CONTROL: the floor is the refuted 1.067 again — re-read the corpus before trusting this');
  assert.ok(
    msg.includes(String(floor)),
    `the refusal does not carry the corpus floor (${floor}) the defect fell below: ${msg}`
  );
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
  const empty = referenceIncrements(path.join(REPO, '.no-such-reference-corpus-xyz'));
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
  const dir = tmpDir('partial-corpus-');
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
  // FIXTURE, not the live seeds, and the reason is the `notEqual` below. The curve CLAMPS to 1.0
  // far enough from its peak, so at a large display size `leadingFor(size)` and `displayRatio: 1`
  // agree by coincidence and the assertion that proves displayRatio is honoured becomes vacuous —
  // "actual 1, expected 1", which is what it reported when this read the live file in a project
  // with a 48px display size. The fixture's display sizes sit inside the curve, so the two
  // quantities are genuinely distinguishable and the CONTROL over that is in the fixture test above.
  const { displayRatio } = FIXTURE.type.leading;
  const model = buildModel(FIXTURE);
  const displaySteps = model.scale.filter((s) => s.band === 'display');
  assert.ok(displaySteps.length >= 1, 'CONTROL: no display steps to check');
  for (const s of displaySteps) {
    assert.equal(s.lineHeight, displayRatio, `display step ${s.name} is ${s.lineHeight}, not displayRatio`);
    assert.notEqual(
      s.lineHeight,
      leadingFor(s.size, FIXTURE.type.leading),
      `display leading equals the UI curve at ${s.size}px — displayRatio is being ignored`
    );
  }
  assert.equal(displayRatio, 1, '§7.1: display sizes reach exactly 1.0');

  // AND THE LIVE FILE STILL HAS TO OBEY THE FIRST HALF. This arm carries no `notEqual`, because
  // whether the curve happens to clamp at this project's display sizes is not this test's subject.
  const live = buildModel(seeds);
  for (const s of live.scale.filter((x) => x.band === 'display')) {
    assert.equal(s.lineHeight, seeds.type.leading.displayRatio, `committed display step ${s.name} is not displayRatio`);
  }
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

// ── THE COLOUR NAME IS A SINK TOO, AND IT WAS THE UNGUARDED HALF ────────────────────────────────
//
// Everything above this line guards `type.family`, one field of seeds.json, into ONE renderer.
// `validateSeeds` ran every colour VALUE through hexToRgb and never looked at a colour KEY, which
// is interpolated into FOUR renderers. The tests below drive the same shapes the family tests do,
// against the sibling field, and the asymmetry test at the end is the finding itself: one string,
// two fields, two answers.

/** The exact payloads the review reproduced, both ACCEPTED with exit 0 before assertColorNameSafe. */
const CSS_ESCAPE = 'a: b; } :root{ --color-text:#ff0000 } @media all { --z';
const CODE_EXEC = "x': String(globalThis.__PWNED = 'code-executed') //";

test('a colour NAME that could break out of any of its four sinks is REFUSED at seeds.json', () => {
  for (const [payload, why] of [
    [CSS_ESCAPE, 'the CSS block escape — @theme closed, :root reopened with an attacker-chosen --color-text'],
    [CODE_EXEC, 'the code execution — the generated tokens.ts object literal sets globalThis.__PWNED'],
  ]) {
    const msg = refusedWith(
      (s) => {
        s.color[payload] = '#ff0000';
      },
      'renderCss',
      'renderTs',
      'renderJson',
      'renderContrastMd',
      'trust boundary'
    );
    assert.ok(msg.includes(JSON.stringify(payload)), `${why}: the refusal does not name the offending key:\n  ${msg}`);
  }

  // ONE CHARACTER PER SINK, so a grammar narrowed to CSS — or to TypeScript — is red rather than
  // plausible. Each entry names the sink it escapes.
  for (const [bad, sink] of [
    ['x}y', 'renderCss: `}` closes @theme'],
    ['x{y', 'renderCss: `{` opens a block'],
    ['x;y', 'renderCss: `;` ends the declaration and starts another'],
    ['x:y', 'renderCss: `:` ends the property name'],
    ['x/*y', 'renderCss: a comment hides the payload'],
    ['x y', 'renderCss: a space is not an ident code point'],
    ["x'y", "renderTs: an apostrophe closes the single-quoted key"],
    ['x"y', 'renderTs: `"` closes a double-quoted key if the renderer ever changes quote style'],
    ['x\\y', 'renderTs: a backslash escapes out of the string literal'],
    ['x`y', 'renderContrastMd: a backtick closes the code span the cell wraps the name in'],
    ['x|y', 'renderContrastMd: `|` splits the table cell'],
    ['x\ny', 'every sink: a newline gives the payload its own line'],
    ['x\ry', 'every sink: a carriage return does the same on the other line ending'],
    ['x\u0000y', 'every sink: a NUL is not text'],
    ['x\u00A0y', 'renderCss: CSS would take a no-break space as an ident code point; this grammar does not'],
    ['x\u200Dy', 'every sink: a zero-width joiner is invisible in a name a human is meant to read'],
    ['', 'every sink: an empty name emits `--color-: #hex`, which names nothing'],
  ]) {
    refusedWith(
      (s) => {
        s.color[bad] = '#ff0000';
      },
      'is not a token name'
    );
    assert.ok(!PALETTE_NAME.test(bad), `${sink}: ${JSON.stringify(bad)} is accepted by the grammar`);
  }

  // CONTROL, DERIVED FROM THE COMMITTED FILE RATHER THAN TYPED HERE. Every name this repository
  // actually ships must keep working — the family guard's first draft refused four members of this
  // same seeds.json, and a list typed into a test would not have caught that.
  const committed = paletteNames(seeds.color);
  assert.ok(committed.length >= 12, `CONTROL: only ${committed.length} committed colour names — too few to prove anything`);
  for (const name of committed) {
    assert.ok(PALETTE_NAME.test(name), `${name} is a committed colour name and the grammar refuses it`);
    assert.doesNotThrow(() => assertColorNameSafe(name), `assertColorNameSafe refuses the committed name ${name}`);
  }
  assert.doesNotThrow(() => validateSeeds(clone()), 'the committed seeds.json no longer validates');

  // ONE ENTRY PER ALTERNATIVE OF THE CHARACTER CLASS, because a mutation has already survived in
  // this file by a test exercising one alternative of two. Delete \p{N}, \p{M}, \p{L}, `_` or `-`
  // from PALETTE_NAME and exactly one of these rows goes red.
  for (const [name, why] of [
    ['ink', 'ASCII letters — the committed shape'],
    ['row-alt', 'a hyphen, U+002D'],
    ['gray-100', 'digits — \\p{N}'],
    ['_private', 'an underscore, U+005F'],
    ['-x', 'a LEADING hyphen, which `--color--x` accepts'],
    ['ミッド', 'a non-ASCII letter — \\p{L}, and CSS Syntax §4.2 admits it'],
    ['ру́сский', 'a combining mark — \\p{M}'],
    ['Åkzidenz', 'a Latin-1 accented letter, the case the family guard got wrong'],
  ]) {
    assert.ok(PALETTE_NAME.test(name), `${why}: ${name} is a nameable colour and the grammar refuses it`);
    assert.doesNotThrow(() => assertColorNameSafe(name), `${why}: assertColorNameSafe refuses ${name}`);
  }
});

test('the guard on `type.family` and the guard on a colour name give ONE answer — the asymmetry is closed', () => {
  // THIS IS THE FINDING, AS A TEST. Every payload below was refused by assertFamilySafe and
  // ACCEPTED by the colour path on the same seeds file, on the same day, into the same renderer.
  for (const payload of [
    CSS_ESCAPE,
    CODE_EXEC,
    'x} :root{--color-danger:#00ff00} a{content:"',
    'Inter; --color-ink: #ff0000',
    'Inter\\}',
  ]) {
    assert.throws(() => assertFamilySafe('sans', payload), SeedsRefused, `family: ${JSON.stringify(payload)} is accepted`);
    assert.throws(() => assertColorNameSafe(payload), SeedsRefused, `colour name: ${JSON.stringify(payload)} is accepted`);
  }

  // AND WHERE THEY DIFFER, THEY DIFFER ON PURPOSE. A family name has a QUOTED form — `'Segoe UI'`
  // — and inside a CSS string a space, a `}` and a `;` are inert. A colour name has no quoted form
  // at any of its four sinks (`--color-"x"` is not a custom property), so the same string that is a
  // legal font stack member is not a legal token name. Asserting the difference keeps a future
  // reader from "fixing" the inconsistency by widening the narrower one.
  for (const shared of ['Segoe UI', "'Segoe UI'", '"SF Mono"']) {
    assert.doesNotThrow(() => assertFamilySafe('sans', shared), `${shared} is a real font-family member and is refused`);
    assert.throws(() => assertColorNameSafe(shared), SeedsRefused, `${shared} has no quoted form as a custom-property ident and must not be a colour name`);
  }
});

test('__proto__ is refused by name, and the artifacts it splits are shown to split', () => {
  // JSON.parse DEFINES this key; an ASSIGNMENT invokes Object.prototype's setter and creates
  // nothing at all. So the fixture goes through the parser, exactly as readSeeds() does — a test
  // built with `s.color.__proto__ = …` would pass against a generator with no guard in it.
  // FIXTURE, not the live seeds: the splice needs a colour key it can anchor on, and `"ink":` is
  // this repository's palette rather than the generator's contract. The fixture names its colours
  // `fx-…`, so the anchor is derived from the fixture and the CONTROL below fails loudly if the
  // splice ever stops landing.
  const anchor = `"${paletteNames(FIXTURE.color)[0]}":`;
  const text = JSON.stringify(FIXTURE).replace(anchor, `"__proto__":"#ff0000",${anchor}`);
  assert.notEqual(text, JSON.stringify(FIXTURE), `CONTROL: the splice anchor ${anchor} is not in the fixture, so nothing was injected`);
  const s = JSON.parse(text);
  assert.ok(
    Object.prototype.hasOwnProperty.call(s.color, '__proto__'),
    'CONTROL: the fixture carries no __proto__ own property, so this test proves nothing'
  );
  assert.ok(PALETTE_NAME.test('__proto__'), 'CONTROL: __proto__ no longer passes the grammar, so the by-name clause is dead code');

  let caught = null;
  try {
    validateSeeds(s);
  } catch (e) {
    caught = e;
  }
  assert.ok(caught instanceof SeedsRefused, '__proto__ was accepted as a colour name');
  for (const m of ['renderJson', 'tokens.json', 'tokens.css']) {
    assert.ok(caught.message.includes(m), `the refusal does not mention ${m}:\n  ${caught.message}`);
  }

  // CONTROL OVER THE SINK. The refusal is only load-bearing if `color[name] = …` really does lose
  // the key — drive renderJson's mechanism directly rather than asserting it in a comment.
  const sink = {};
  sink['row-alt'] = '#15171d';
  sink['__proto__'] = '#ff0000';
  assert.deepEqual(
    Object.keys(sink),
    ['row-alt'],
    'CONTROL FAILED: `color[name] = …` no longer loses __proto__, so this refusal now guards nothing'
  );
  assert.equal(
    JSON.stringify(sink),
    '{"row-alt":"#15171d"}',
    'CONTROL FAILED: JSON.stringify no longer omits the key, so tokens.json and tokens.css would not disagree and this refusal would guard nothing'
  );
  assert.equal(Object.getPrototypeOf(sink), Object.prototype, 'Object.prototype itself is untouched — the damage is the disagreement between artifacts, not pollution');
});

// ── contrast.md IS A TABLE, AND A TABLE ROW IS A SINK ────────────────────────────────────────────

test('a contrast note cannot forge a row of contrast.md', () => {
  const forged =
    'body copy | 99.999 | pass | pass | forged\n| `x` | `y` | `#000` | `#fff` | **21.000:1** | pass | pass | a row nobody authored';
  // FIXTURE, not the live seeds. The refusals here are about the note deny-list and nothing else;
  // reading the live file made the CONTROL below a count of THIS repository's committed pairs,
  // which failed as "CONTROL: only 12 committed notes" in a project with twelve — a true statement
  // about a palette and a useless one about `assertNoteSafe`.
  refusedInFixture(
    (s) => {
      s.contrastPairs[0].note = forged;
    },
    'contrast.md',
    'markdown table row',
    '21.000:1'
  );

  // ONE CHARACTER AT A TIME, so a fix that catches the newline and misses the pipe is red.
  for (const [bad, why] of [
    ['a | b', 'a pipe splits the cell and shifts every column after it'],
    ['a\nb', 'a newline ends the row'],
    ['a\rb', 'a carriage return ends it on the other line ending'],
    ['a\u0000b', 'a NUL is not text'],
    ['a\u007Fb', 'DEL is not text'],
  ]) {
    refusedInFixture((s) => {
      s.contrastPairs[0].note = bad;
    }, 'ends or splits a row');
    assert.ok(NOTE_FORBIDDEN.test(bad), `${why}: ${JSON.stringify(bad)} is accepted by the deny-list`);
  }

  // CONTROL: A NOTE IS PROSE. An allow-list over prose is how the family guard's first draft refused
  // this repository's own seeds, so the deny-list has to leave ordinary punctuation alone. The
  // fixture notes carry a delta, an em dash, parentheses and a semicolon for exactly that reason,
  // and the characters are asserted rather than assumed — a fixture of bare words would make this
  // arm pass while proving nothing.
  const fixtureNotes = FIXTURE.contrastPairs.map((p) => p.note).join(' ');
  for (const c of ['Δ', '—', '(4.5)', ';']) {
    assert.ok(fixtureNotes.includes(c), `CONTROL: no fixture note carries ${JSON.stringify(c)}, so the prose arm proves less than it claims`);
  }
  for (const [i, p] of FIXTURE.contrastPairs.entries()) {
    assert.doesNotThrow(() => assertNoteSafe(i, p.note), `the fixture note ${JSON.stringify(p.note.slice(0, 40))} is refused`);
  }
  // AND THE COMMITTED NOTES TOO — whether THIS repository's seeds survive the deny-list is a real
  // question about this repository, and it is the half of the old control that was worth keeping.
  // The count is a floor of 1 rather than 13: thirteen was the number this palette happened to
  // ship, and a palette with twelve is not a defect in `assertNoteSafe`.
  assert.ok(seeds.contrastPairs.length >= 1, `CONTROL: ${seeds.contrastPairs.length} committed notes`);
  for (const [i, p] of seeds.contrastPairs.entries()) {
    assert.doesNotThrow(() => assertNoteSafe(i, p.note), `the committed note ${JSON.stringify(p.note.slice(0, 40))} is refused`);
  }
  assert.doesNotThrow(
    () => assertNoteSafe(0, 'SURFACE PAIR — row banding. ΔE76 (4.82) is the right metric here; the ratio is not'),
    'ordinary prose punctuation is refused'
  );

  // CONTROL OVER THE INSTRUMENT. The forgery has to be REAL or the refusal above is theatre.
  // renderContrastMd is driven directly with a poisoned model, because validateSeeds now refuses to
  // build one — the same move the @theme brace-scan test makes with its poisoned stylesheet.
  const model = buildModel(FIXTURE);
  const rows = (md) => md.split('\n').filter((l) => l.startsWith('| `')).length;
  assert.equal(rows(renderContrastMd(model, TODAY)), model.pairs.length, 'the clean table does not have one row per pair');
  const poisoned = { ...model, pairs: model.pairs.map((p, i) => (i === 0 ? { ...p, note: forged } : p)) };
  const forgedRows = rows(renderContrastMd(poisoned, TODAY));
  assert.equal(
    forgedRows,
    model.pairs.length + 1,
    `CONTROL FAILED: a note carrying a newline and pipes produced ${forgedRows} rows for ${model.pairs.length} pairs — the forgery this refuses is not reproducible, so the refusal proves nothing`
  );
  assert.ok(
    renderContrastMd(poisoned, TODAY).includes('| **21.000:1** | pass | pass |'),
    'CONTROL FAILED: the forged row does not assert a passing ratio, which is the shape that matters'
  );
});

// ── THE THIRD FAMILY SLOT ────────────────────────────────────────────────────────────────────────

test('serif is a REAL slot: it emits into all four artifacts, or it emits into none', () => {
  // THE DEFECT: `type.family` was read as {sans, mono}, so a `serif` key was WORSE THAN ABSENT.
  // renderJson copies `seeds.type` verbatim into $extensions["org.agentvibe.seeds"], so the family
  // reached tokens.json — the file a reader consults to learn what the design system binds — while
  // renderCss emitted no --font-serif and renderTs exported nothing. A reader concluded a display
  // face was bound when no declaration bound one.
  const withSerif = fixture();
  withSerif.type.family.serif = "'Iowan Old Style', Georgia, serif";
  const g = generate(withSerif, TODAY).files;
  const json = JSON.parse(g.json);

  assert.ok(
    json.$extensions['org.agentvibe.seeds'].family.serif,
    'CONTROL: the seeds echo no longer carries type.family, so the defect this closes is unreproducible and this test proves nothing'
  );
  assert.ok(g.css.includes("--font-serif: 'Iowan Old Style', Georgia, serif;"), `tokens.css has no --font-serif:\n${g.css.split('\n').slice(0, 12).join('\n')}`);
  assert.match(g.ts, /^ {2}serif: "'Iowan Old Style', Georgia, serif",$/m, 'tokens.ts exports no serif family');
  assert.deepEqual(
    json.font.family.serif,
    { $type: 'fontFamily', $value: ["'Iowan Old Style'", 'Georgia', 'serif'] },
    'tokens.json has no font.family.serif token'
  );

  // OPTIONAL MEANS ABSENT EMITS NOTHING, ANYWHERE. This is what keeps a seeds file with no serif
  // generating byte-identically to one built before the slot existed.
  const base = generate(FIXTURE, TODAY).files;
  assert.equal(FIXTURE.type.family.serif, undefined, 'CONTROL: the fixture declares a serif, so the absent case is untested');
  assert.ok(!base.css.includes('--font-serif'), 'a stylesheet declares --font-serif for a slot the seeds do not carry');
  assert.doesNotMatch(base.ts, /^ {2}serif: /m, 'tokens.ts exports a serif family for a slot the seeds do not carry');
  assert.equal(JSON.parse(base.json).font.family.serif, undefined, 'tokens.json carries a serif token for a slot the seeds do not carry');

  // ...and the same, on the committed artifacts, which is where "byte-identical" is actually
  // checked — `the committed design/tokens/ matches a fresh generation` is the assertion that
  // would go red if adding this slot had moved a byte of this repository's output.
  assert.equal(seeds.type.family.serif, undefined, 'CONTROL: the committed seeds now declare a serif, so this arm no longer tests the absent case');
  assert.ok(!fs.readFileSync(OUT.css, 'utf8').includes('--font-serif'), 'the committed stylesheet gained a --font-serif nothing seeded');

  // REQUIRED IS STILL REQUIRED, AND PRESENT-BUT-EMPTY IS STILL A REFUSAL. `serif` may be omitted;
  // it may not be omitted by writing nothing into it, because an empty stack member emits a stray
  // comma into a live declaration.
  for (const slot of ['sans', 'mono']) {
    refusedInFixture((s) => { delete s.type.family[slot]; }, `type.family.${slot} must be a non-empty`);
  }
  refusedInFixture((s) => { s.type.family.serif = ''; }, 'type.family.serif must be a non-empty');
  refusedInFixture((s) => { s.type.family.serif = []; }, 'type.family.serif must be a non-empty');

  // AND THE SLOT IS GUARDED LIKE ITS SIBLINGS. A third sink into `@theme` that skipped
  // assertFamilySafe would be the exact asymmetry assertColorNameSafe exists to close.
  refusedInFixture(
    (s) => { s.type.family.serif = 'x, serif} :root{--color-danger:#00ff00} a{content:"'; },
    'type.family.serif',
    'is not a font-family name'
  );

  // THE LIST IS SPELLED ONCE, so a fourth slot cannot reach three renderers and miss the fourth.
  assert.deepEqual(FAMILY_SLOTS, ['sans', 'mono', 'serif'], 'the slot list moved; every renderer iterates it, so check all four artifacts');
  assert.deepEqual(SEEDS_KEYS['type.family'], FAMILY_SLOTS, 'the unknown-key allow-list and the renderer list disagree — one of them would accept a slot the other drops');
});

// ── DECLARE WHAT IS READ, REFUSE THE REST ────────────────────────────────────────────────────────

test('a seed key no derivation reads is REFUSED at three levels, and the refusal names it', () => {
  // THE DEFECT, MEASURED: validateSeeds read `type`, `color` and `contrastPairs` and silently
  // accepted anything else. A seeds file carrying a whole `motion` block — duration and easing —
  // was ACCEPTED at exit 0 and emitted NOTHING in any of the four generated files. The author of
  // the one hand-edited file in design/tokens/ got a clean build and no motion tokens, with
  // nothing anywhere saying the block had been ignored.
  const cases = [
    ['top level', 'motion', (s) => { s.motion = { duration: { enter: 200, exit: 150 }, easing: { standard: 'cubic-bezier(.2, 0, 0, 1)' } }; }],
    ['type', 'type.spacing', (s) => { s.type.spacing = { base: 4, steps: 6 }; }],
    ['type.family', 'type.family.display', (s) => { s.type.family.display = 'Georgia, serif'; }],
  ];
  for (const [level, key, mutate] of cases) {
    const msg = refusedInFixture(mutate, key, 'does not read');
    assert.ok(msg.includes(SEEDS_KEYS[level === 'top level' ? '' : level].join(', ')), `the refusal at ${level} does not list the keys it DOES read:\n  ${msg}`);
  }

  // CONTROL OVER THE SINK, for the `type` level: renderJson really does copy `seeds.type` verbatim,
  // so an unread key there really does reach tokens.json. Driven directly, because validateSeeds
  // now refuses to build a model from it — the same move the @theme brace-scan test makes with its
  // poisoned stylesheet.
  // The value carries a SENTINEL rather than plausible numbers, because the substring that proves
  // "nothing emits this" has to be one no renderer can emit for another reason — `spacing` alone is
  // in every `--text-*--letter-spacing` declaration, and asserting its absence fails on a correct
  // stylesheet.
  const SENTINEL = 'UNREAD-SEED-KEY-SENTINEL';
  const poisoned = fixture();
  poisoned.type.spacing = { base: 4, marker: SENTINEL };
  const emitted = renderJson(buildModel(FIXTURE), poisoned);
  assert.deepEqual(
    emitted.$extensions['org.agentvibe.seeds'].spacing,
    { base: 4, marker: SENTINEL },
    'CONTROL FAILED: an unread type key no longer reaches tokens.json, so this refusal guards nothing'
  );
  assert.ok(JSON.stringify(emitted).includes(SENTINEL), 'CONTROL: the sentinel is not in the token file at all, so the carry is not being observed');
  const model = buildModel(FIXTURE);
  assert.ok(!renderCss(model).includes(SENTINEL), 'CONTROL FAILED: the stylesheet emits the unread key, so it is read after all');
  assert.ok(!renderTs(model).includes(SENTINEL), 'CONTROL FAILED: tokens.ts emits the unread key, so it is read after all');

  // $-PREFIXED KEYS ARE METADATA AND STAY LEGAL, at every level that has one. seeds.json carries
  // `$comment` at the top level, inside `type` and inside `color`; refusing them would refuse this
  // repository's own authored file.
  const metadata = fixture();
  metadata.$note = 'top level';
  metadata.type.$note = 'inside type';
  metadata.type.family.$note = 'inside family';
  metadata.color.$note = 'inside color, which paletteNames already skipped';
  assert.doesNotThrow(() => validateSeeds(metadata), 'a $-prefixed metadata key is refused, so seeds.json cannot carry a comment');
  assert.ok(Object.keys(seeds).some((k) => k.startsWith('$')), 'CONTROL: the committed seeds carry no $-prefixed key, so the metadata arm guards nothing here');

  // AND THE COMMITTED SEEDS PASS. If this repository's own authored file trips the new refusal,
  // that is the refusal being wrong rather than the file.
  assert.doesNotThrow(() => validateSeeds(clone()), 'the committed seeds.json is refused by the unknown-key check');
});

// ── THE CAPS, AND THE RECONCILIATION WITH THE EXTRACTOR'S SIDE ───────────────────────────────────

test('authored seeds text is bounded at both ends, and the bound is not the defence', () => {
  const at = (n) => 'a'.repeat(n);
  assert.doesNotThrow(() => assertColorNameSafe(at(SEEDS_TEXT_MAX.colorName)), 'a name AT the cap is refused — the bound is off by one');
  refusedWith((s) => {
    s.color[at(SEEDS_TEXT_MAX.colorName + 1)] = '#ff0000';
  }, 'THE CAP IS NOT THE DEFENCE');

  assert.doesNotThrow(() => assertNoteSafe(0, at(SEEDS_TEXT_MAX.note)), 'a note AT the cap is refused — the bound is off by one');
  refusedWith((s) => {
    s.contrastPairs[0].note = at(SEEDS_TEXT_MAX.note + 1);
  }, 'over the', 'The cap bounds the artifact');

  // THE RECONCILIATION, CHECKED RATHER THAN ASSERTED IN PROSE. The extractor caps every string it
  // reads off a remote page at UNTRUSTED_MAX and the seeds side capped nothing. The two are set
  // equal for the note so that a string extract-reference is allowed to EMIT cannot fail the gate
  // on the side it is pasted into. Moving one without the other is a decision, not a tidy-up, and
  // this line is what makes it one.
  assert.equal(
    SEEDS_TEXT_MAX.note,
    UNTRUSTED_MAX,
    'the seeds note cap and the extractor cap have drifted apart — see SEEDS_TEXT_MAX for why they were set equal'
  );
});

// ── AN UNBOUNDED FIELD MUST REFUSE, NOT DIE ──────────────────────────────────────────────────────

test('an unbounded `steps` is a REFUSAL, not the heap abort it used to be', () => {
  // The reported input. Measured before the ceiling: exit 134, SIGABRT, "JavaScript heap out of
  // memory" — not exit 2, and not a catchable RangeError either, so the CLI's own handler never
  // ran and the exit-code contract at the top of build-tokens.mjs was silently untrue.
  refusedWith((s) => {
    s.type.ui.steps = 1e9;
  }, 'exit 134', 'the widest band in the corpus is');

  // THE BOUNDARY, BOTH SIDES, ON THE DISPLAY BAND. The UI band cannot be grown to the ceiling
  // without its top colliding with type.display.base, which refuses for an unrelated reason and
  // would prove nothing about this one.
  refusedWith((s) => {
    s.type.display.steps = MAX_BAND_STEPS + 1;
  }, `over the ceiling of ${MAX_BAND_STEPS}`);
  const ok = clone();
  ok.type.display.steps = MAX_BAND_STEPS;
  assert.doesNotThrow(() => validateSeeds(ok), `steps at exactly ${MAX_BAND_STEPS} is refused — the ceiling is off by one`);

  // The citation is DERIVED from design/references/ on each call, never typed — the same rule the
  // increment refusals follow, and for the same reason: a typed count is a second copy of the
  // evidence, and this file has already watched one drift from it.
  const msg = refusedWith((s) => {
    s.type.display.steps = 1e6;
  }, 'distinct size(s)');
  assert.ok(/over \d+ reference\(s\)/.test(msg), `the ceiling's citation names no corpus size:\n  ${msg}`);
});

// ── $-PREFIXED KEYS ARE METADATA AT BOTH ENDS ───────────────────────────────────────────────────

test('a $-prefixed colour key is skipped by the validator AND the renderers, from one spelling', () => {
  // seeds.json carries `color.$comment`, which is why no `--color-$comment` appears in tokens.css.
  // The filter used to be spelled twice — once in validateSeeds, once in buildModel — and the
  // dangerous direction of that disagreement is a key the validator SKIPS and a renderer EMITS.
  assert.ok(Object.keys(seeds.color).includes('$comment'), 'CONTROL: the committed seeds no longer carry $comment');
  assert.ok(!generate(seeds, TODAY).files.css.includes('--color-$comment'), '$comment reached the stylesheet');

  const s = clone();
  s.color[`$${CSS_ESCAPE}`] = '#ff0000';
  assert.doesNotThrow(() => validateSeeds(s), 'a $-prefixed key is metadata and is deliberately not validated');
  assert.deepEqual(paletteNames(s.color), paletteNames(seeds.color), 'a $-prefixed key changed the palette');
  const { files } = generate(s, TODAY);
  for (const [name, text] of Object.entries(files)) {
    assert.ok(
      !text.includes('--color-text:#ff0000'),
      `the $-prefixed payload reached ${name}: validateSeeds skipped the key and the renderer did not, which is the exact disagreement paletteNames exists to prevent`
    );
  }
});

test('a colour named in any script reaches every generated file intact, still inside @theme', () => {
  const s = clone();
  s.color['ミッド'] = '#123456';
  assert.doesNotThrow(() => validateSeeds(s), "a CJK colour name is refused — this is the family guard's ASCII mistake one field over");
  const { files } = generate(s, TODAY);
  assert.ok(files.css.includes('  --color-ミッド: #123456;'), 'the CJK name did not reach tokens.css');
  assert.ok(files.ts.includes("  'ミッド': '#123456',"), 'the CJK name did not reach tokens.ts');
  assert.ok(Object.keys(JSON.parse(files.json).color).includes('ミッド'), 'the CJK name did not reach tokens.json');
  assert.equal(braceScan(files.css).finalDepth, 0, 'the CJK name unbalanced the stylesheet');
  assert.equal(
    braceScan(files.css).closedAt,
    files.css.split('\n').length - 1,
    '@theme no longer closes on the last line, so something escaped it'
  );
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
  // FIXTURE, and the "not a carried one" half is now DERIVED rather than typed. This read the
  // committed contrast.md and asserted the literals `8.581:1` present and `8.582:1` absent — this
  // palette's computed figure against the stale styles.css figure beside it. Both literals are
  // facts about one palette: ported, the test failed with "contrast.md carries a figure other than
  // the computed one for warn", which is true and says nothing about renderContrastMd.
  //
  // The shape that mattered is kept and made general: for EVERY pair, the computed figure must be
  // in the table and its 3dp NEIGHBOUR must not. A renderer that rounded differently, carried a
  // figure forward, or emitted a stale copy alongside the fresh one is caught by the second half —
  // and it needs no literal from any palette.
  const md = generate(FIXTURE, TODAY).files.contrast;
  const model = buildModel(FIXTURE);
  assert.ok(model.pairs.length >= 3, `CONTROL: only ${model.pairs.length} pair(s) in the fixture table`);
  const figures = model.pairs.map((p) => p.ratio);
  for (const [i, a] of figures.entries()) {
    for (const b of figures.slice(i + 1)) {
      assert.ok(
        Math.abs(a - b) > 0.0015,
        `CONTROL: fixture ratios ${a.toFixed(3)} and ${b.toFixed(3)} are within one 3dp step, so the neighbour check below would fire on a correct table`
      );
    }
  }
  for (const p of model.pairs) {
    assert.ok(md.includes(`**${p.ratio.toFixed(3)}:1**`), `contrast.md is missing the ratio for ${p.fg}/${p.bg}`);
    for (const delta of [0.001, -0.001]) {
      assert.ok(
        !md.includes(`**${(p.ratio + delta).toFixed(3)}:1**`),
        `contrast.md carries ${(p.ratio + delta).toFixed(3)}:1 beside the computed ${p.ratio.toFixed(3)}:1 for ${p.fg}/${p.bg} — a second figure for one pair is a carried figure`
      );
    }
  }
  assert.ok(/\*\*Computed:\*\* \d{4}-\d{2}-\d{2}/.test(md), 'contrast.md is not dated');

  // AND THE COMMITTED TABLE STILL HAS TO HOLD EVERY COMMITTED PAIR. This is the arm that is
  // genuinely about the live file, so it reads the live file — and `the committed design/tokens/
  // matches a fresh generation` is what makes it a full check rather than a spot one. The
  // provenance the two deleted literals carried (that these figures reproduce styles.css and its
  // corrections do not creep back) lives in design-lib.test.mjs, "the contrast figures in
  // styles.css reproduce exactly", which is where the shared arithmetic is tested.
  const committed = fs.readFileSync(OUT.contrast, 'utf8');
  for (const p of buildModel(seeds).pairs) {
    assert.ok(committed.includes(`**${p.ratio.toFixed(3)}:1**`), `the committed contrast.md is missing the ratio for ${p.fg}/${p.bg}`);
  }
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
  // FIXTURE, and every literal DERIVED from it. This typed `--text-ui-0: 11px;` and `"value": 11`,
  // which are this repository's UI base spelled into a test twice. Ported to a 12px base neither
  // string was in the generated files, `String.replace` returned the input unchanged, and drift()
  // correctly reported nothing — "a one-line change was not reported", actual 0, expected 1. The
  // test was measuring the seeds file, so the numbers come off the fixture's own model now, and a
  // CONTROL asserts each substitution actually landed before its finding is judged.
  const { files } = generate(FIXTURE, TODAY);
  const base = FIXTURE.type.ui.base;

  const cssLine = `--text-ui-0: ${base}px;`;
  const cssMutated = files.css.replace(cssLine, `--text-ui-0: ${base + 1}px;`);
  assert.notEqual(cssMutated, files.css, `CONTROL: ${cssLine} is not in the generated stylesheet, so nothing was mutated`);
  const findings = drift(files, { ...files, css: cssMutated });
  assert.equal(findings.length, 1, 'a one-line change was not reported, or was over-reported');
  assert.equal(findings[0].key, 'css');
  assert.ok(findings[0].detail.includes(`--text-ui-0: ${base + 1}px;`), 'the report does not say what drifted');

  const missing = drift(files, { json: null, css: files.css, ts: files.ts, contrast: files.contrast });
  assert.equal(missing[0].kind, 'missing', 'an absent file is not reported as missing');

  const jsonKey = `"value": ${base}`;
  const jsonMutated = files.json.replace(jsonKey, '"value": 99');
  assert.notEqual(jsonMutated, files.json, `CONTROL: ${jsonKey} is not in the generated token file, so nothing was mutated`);
  const jsonChanged = drift(files, { ...files, json: jsonMutated });
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

  const dir = tmpDir('build-tokens-');

  // REFUSED (2): a fractional increment, the defect that shipped.
  const bad = fixture();
  bad.type.ui.increment = 0.5;
  const badPath = path.join(dir, 'fractional.json');
  fs.writeFileSync(badPath, JSON.stringify(bad));
  const refused = cli(['--check', '--seeds', badPath]);
  assert.equal(refused.code, 2, `a refused seeds file exited ${refused.code}, not 2`);
  assert.match(refused.err, /REFUSED/);
  // THE CITATION, DERIVED FROM THE CORPUS RATHER THAN TYPED. This asserted /linear\.app/, which is
  // a fact about which references this repository happens to have captured. `citeUi()` already
  // reads design/references/ on every call and says so plainly when nothing is readable, so the
  // expectation is read from the same place — and a corpus of zero is checked for its OWN sentence
  // rather than skipped, because "the refusal cites nothing" is the failure mode that matters.
  const corpus = referenceIncrements();
  const expected = corpus.n ? Object.keys(corpus.sites)[0] : 'NO REFERENCE CORPUS IS READABLE';
  assert.ok(refused.err.includes(expected), `the CLI refusal does not carry the citation ${JSON.stringify(expected)}:\n${refused.err}`);

  // DRIFT (1): a valid seeds file that is not the committed one. The FIXTURE is that file by
  // construction — its palette names are `fx-`prefixed, so a generation from it cannot equal any
  // project's committed tokens — where the old arm typed a band (12/+2/5, display base 32) that
  // happened to differ from THIS repository's and happened to EQUAL another's, where it exited 0
  // and reported "a drifted tree exited 0, not 1". The premise is asserted rather than assumed.
  const fixturePath = path.join(dir, 'fixture.json');
  fs.writeFileSync(fixturePath, JSON.stringify(FIXTURE));
  assert.notEqual(
    comparable(generate(FIXTURE, TODAY).files.css),
    comparable(fs.readFileSync(OUT.css, 'utf8')),
    'CONTROL: the fixture generates the committed stylesheet, so this arm cannot observe drift'
  );
  const drifted = cli(['--check', '--seeds', fixturePath]);
  assert.equal(drifted.code, 1, `a drifted tree exited ${drifted.code}, not 1`);
  assert.match(drifted.err, /has drifted/);
  assert.match(drifted.err, /npm run build:tokens/, 'the drift report does not say how to fix it');

  // MISSING (2): not a drift. A seeds file that does not exist cannot be generated into one.
  const gone = cli(['--check', '--seeds', path.join(dir, 'nope.json')]);
  assert.equal(gone.code, 2, `a missing seeds file exited ${gone.code}, not 2`);
  assert.match(gone.err, /AUTHORED/);
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
