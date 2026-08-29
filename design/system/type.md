---
status: answered
generated_by: none — this file is AUTHORED. The values it describes are generated.
artifact: design/tokens/seeds.json
---

# Type

**The rule comes first. The reasoning is after it, and the sources are after that.**

Every number below is produced by `scripts/build-tokens.mjs` from `design/tokens/seeds.json`. None of
them is typed into a stylesheet, and that is the point: **constrain by instrument, not by rule.** A
rule can be violated. A generator cannot emit what its arithmetic cannot produce.

---

## The rules

### 1 · The UI band is built by absolute increment

```
size(i) = base + i * increment          base = 11, increment = 1, steps = 5
```

→ **11 12 13 14 15**

The adjacent ratio is exactly `1 + increment/size`, so it **decreases monotonically by
construction**: `1.091 1.083 1.077 1.071`.

`increment` and `base` must be integers, and `increment` must be 1 or 2. Anything else is refused
with a message naming the references the rule was measured against.

### 2 · The display band is built separately, and joined by a jump

```
size(i) = base + i * increment          base = 20, increment = 8, steps = 1
```

→ **20**

The display band is **never interpolated from the UI band and never derived from it.** The join is
checkable and is checked: the step from the top of the UI band into the display band must be *larger*
than any step inside the UI band. Here it is `20/15 = 1.333` against a widest UI step of `1.091`.

A display base that closes that gap is refused. So is a display increment below 4 — that is a
continuation of the UI band wearing a second band's name.

### 3 · Line-height is a curve

```
leading(s) = peak - (|s - peakAt| / peakAt)^exponent * falloff,   clamped to [1.0, peak]
             peak = 1.55 · peakAt = 17 · falloff = 0.62 · exponent = 1.1
```

The display band does not use the curve. It takes `displayRatio` — **1.0**, exactly.

| size | 11 | 12 | 13 | 14 | 15 | 20 |
|---|---|---|---|---|---|---|
| leading | 1.353 | 1.389 | 1.424 | 1.458 | 1.491 | 1.000 |

The clamp is load-bearing rather than defensive. `leading-relaxed` (1.625) is applied **27 times
across 10–15px** in mission-control, where the rule is a curve that peaks at 1.55 near 17px. Under
this arithmetic 1.625 is unreachable at any size.

### 4 · Tracking is monotone with size

```
tracking(s) = (zeroAt - s) * slope,  in em        zeroAt = 14 · slope = 0.0022
```

Positive below 14px, zero at 14px, increasingly negative above.

| size | 11 | 12 | 13 | 14 | 15 | 20 |
|---|---|---|---|---|---|---|
| tracking (em) | 0.0066 | 0.0044 | 0.0022 | 0 | −0.0022 | −0.0132 |

### 5 · Families

Two, carried unchanged from `mission-control/client/src/styles.css`: a system sans stack and a system
mono stack. **No webfont.** Choosing a typeface is one of the three irreducible human seed judgements
(below) and it has not been made — the system stack is the honest default, not a decision.

---

## Where the rules come from

All four are recorded in `docs/03-system-design/DESIGN-CAPABILITY.md` §7.1, corrected in §15.16, and
held against five committed references under `design/references/`. **Do not re-derive them here and
do not restate them in a third place** — this section restated them anyway, in a hand-typed table,
and four of its five rows were false.

**So this section states COMMANDS and carries no measured figure at all. That is a decision, not an
omission.** The generator this file governs already made the same one about itself, in
`referenceIncrements()`:

> *"A citation typed by hand is a second copy of the evidence, and a second copy of evidence is a
> thing that drifts from it silently."* — `scripts/build-tokens.mjs`

**And the rot rate is measured rather than feared.** `git log --oneline origin/main..HEAD --
design/references/` returns **five** commits on this branch alone: four references, a stripe.com
re-capture, docs.stripe.com added as a fifth product-surface control, then two passes over the
leading curve. The re-capture and the fifth reference are precisely what falsified the table that
used to sit here. It will move again — every `design/references/*/SOURCE.yml` carries
`expires: "2026-11-27"`.

```bash
# UI-band and display-band increments, one reference.
# Slugs: linear-app · stripe-com · vercel-com · play-grafana-org · docs-stripe-com
node -e "const j=require('./design/references/<slug>/measured.json');
  for (const b of ['ui','display']) { const a = j.type.bands[b].sizes;
    console.log(b, JSON.stringify(a.slice(1).map((v,i) => +(v - a[i]).toFixed(3)))); }"

# Adjacent ratios, which is what the 'modular scale' paragraph below is about:
node -e "const j=require('./design/references/<slug>/measured.json');
  console.log(j.type.uiSteps.map(s => s.ratio).join(' '))"

# The whole corpus, held against every stated rule, verdict by verdict:
node scripts/extract-reference.mjs --against design/rules/type-scale.rules.json --refs design/references --json

# mission-control's own ramp, from its source rather than from the corpus:
grep -rhoE 'text-\[[0-9.]+px\]' mission-control/client/src | grep -oE '[0-9.]+' | sort -n -u
```

mission-control's authored sizes are `text-[Npx]` arbitrary values, which is what that last grep
finds. Its single display size is the one `text-xl` in `client/src/ui.tsx` — Tailwind's 20px — and no
grep for `text-[Npx]` will ever show it.

> **Superseded 2026-08-29 — a hand-typed table stood here and the corpus it cited refuted it.** It
> read: linear.app `1 1 1 1 1 1 2` / `6 8 16 16` · stripe.com `1 1 1 1 2 2 2` / `4 4 6 16` ·
> vercel.com `1 2 2 2 2 2 2` / `32 8` · play.grafana.org `2` / *(none — two sizes is the whole
> ramp)*. Only vercel's display row survived contact with `design/references/`, and the table
> **omitted docs.stripe.com**, the fifth committed reference, entirely.
>
> **How it got there.** The seeds commit that wrote this section predates the measured corpus: the
> figures were transcribed from a secondhand list, `scripts/extract-reference.mjs` later measured the
> five sites live, and nothing reconciled the two.
>
> **The first repair attempted here was a CORRECTED table, and it was rejected.** A corrected table
> is the same defect with better numbers, and the numbers are the part that rots — it would have been
> false again at the next re-capture, which the five commits above say is a matter of when. The false
> figures are kept, because a record of an error cannot drift; the true ones are deliberately not
> written down.
>
> **The row that moved most is play.grafana.org's, and it carries an argument rather than a
> correction.** Run the increments command against `play-grafana-org` and it does not return `2`: the
> band is **fractional**, because grafana runs a multiplicative scale off a 14px base. That is a live
> counterexample to §7.1's "every reference builds its UI band on integer steps", and §15.16 states
> what survives it — the defect was never *fractional*, it was **fractional AND load-bearing by usage
> share**.

**A modular scale is the wrong model and was falsified, not merely rejected.** A modular scale holds
its ratio *constant* by definition; every constant-increment run in the corpus visibly *decreases*,
by `1 + d/s` with `s` rising. The 1.07–1.17 band that looked like a "compressed modular scale" is
just the arithmetic signature of a constant +1/+2px step.

> **Scoping corrected 2026-08-29, same cause as the table.** This read *"every measured reference
> visibly decreases"*, unqualified, and the corpus breaks it twice: run the ratios command above
> against `play-grafana-org` and the sequence **increases**; run it against `stripe-com` and it is
> **non-monotone**, returning to a higher ratio where the increment changes from +1 to +2. §7.1's own
> wording is the correct one and is restored here — *"monotonically decreasing within every
> constant-increment run"* — which both references satisfy. The argument is unchanged; the quantifier
> was too wide.

**The defect this closes** is the fourth diagnosis of mission-control's type ramp: it steps by **+0.5
six times consecutively**, and the adjacent ratios across those six steps sit entirely *below* the
lowest adjacent UI-band ratio anywhere in the corpus. **That comparison is a command, not a
constant** — it reads both sides live and prints the verdict:

```bash
node -e "
const fs = require('fs'), { execSync } = require('child_process');
const floor = Math.min(...fs.readdirSync('design/references').flatMap(d =>
  JSON.parse(fs.readFileSync('design/references/' + d + '/measured.json', 'utf8')).type.uiSteps.map(s => s.ratio)));
const mc = [...new Set(execSync(\"grep -rhoE 'text-\\\\[[0-9.]+px\\\\]' mission-control/client/src\")
  .toString().match(/[0-9.]+/g).map(Number))].sort((a, b) => a - b);
const half = mc.slice(1).map((v, i) => [+(v - mc[i]).toFixed(3), +(v / mc[i]).toFixed(3)]).filter(([d]) => d === 0.5);
console.log('ui-band floor', floor, '| +0.5 steps', half.length,
            '| ratios', half.map(([, r]) => r).join(' '),
            '| ALL BELOW FLOOR', half.every(([, r]) => r < floor));
"
```

The three earlier diagnoses were each well-formed and each wrong — "six sizes is disciplined
restraint", "adjacent ratios below 1.125", "no display band". §7.1 keeps all three in place, and the
lesson it draws is the one that governs this file: **a measurement without a construction model
produces confident nonsense.** §15.16 then found a fourth error in v4 itself, so do not read "fourth"
as "final".

> **Superseded 2026-08-29 — two figures in that sentence were wrong, and its conclusion is
> unchanged.** It read *"+0.5 **seven** times consecutively"* (it is **six**: nine authored sizes
> admit eight increments, not nine) and *"the reference band, which bottoms out at **1.067**"* — a
> figure taken from the *refuted* table above, linear's 15→16, which is why the two errors travelled
> together. Neither replacement figure is written here, for the reason the table is not.
>
> **Say which floor, because only one of the two carries the argument.** The command above minimises
> over `type.uiSteps` — the UI bands, which is where all of mission-control's authored sizes sit.
> Minimising over `type.steps` instead spans the display bands too and returns a much lower number
> that mission-control's ratios are comfortably *above*; that comparison does not bite, and quoting it
> would look like stronger evidence while being none. Swap the key and see for yourself.

---

## What is sourced, what is fitted, and what is nobody's to derive

**Honesty about evidence strength, because these three are not equal.**

| Element | Standing |
|---|---|
| The two-band split, integer increments, the jump | **Sourced and measured.** Five ramps, reproducible |
| The line-height curve's *shape* | **Sourced.** Peaks near 1.5–1.56 at 16–18px, reaches 1.0 at display sizes |
| The line-height curve's *formula* | **A fit.** No source publishes one. It is the simplest function with the sourced shape |
| The tracking *direction* | **Sourced.** Positive below ~14px, increasingly negative above |
| The tracking *formula* | **A fit.** Linear is the simplest function with that property |
| `peak`, `falloff`, `exponent`, `slope`, `zeroAt` | **Chosen here.** Every one lives in `design/tokens/seeds.json`, never inline, so disagreeing with a fit is a one-line edit to an authored file |
| The `+1 or +2` clamp | **The weaker of the two refusals**, and it says so when it fires. n=4 references, and §6.4 flags them as maximally correlated — Linear, Stripe and Vercel are the most-imitated design language in developer SaaS, so the rule was falsified against the canon, not against the range of legitimate practice |

**Three judgements are irreducibly human and no arithmetic reaches them** (§7.5, practitioners
conceding the limit against their own interest): the base colour, the increment itself, and brand
adjectives → typeface. Everything downstream of those three is stated procedure in at least one
primary source. This file implements the downstream part. **It does not claim to have taste.**

**An ordering rule worth keeping, from the same section:** Butterick ranks the four decisions that
determine typographic quality as (1) point size, (2) line spacing, (3) line length, (4) font choice —
**font is last.** Line length is the one dimension in that list this file does not yet cover.

---

## What this file does not decide

- **Measure (line length).** Not in the ramp, not in `seeds.json`, not checked anywhere.
- **Weight.** mission-control ships two and that is a good decision nobody has written down.
- **Which token goes where.** A ramp is not a hierarchy. Pairing size with weight, colour and space
  is `system/principles.md`'s question and it is unanswered.
- **The remap.** These values are a **proposal**. No mission-control source file has been changed.

---

## Changing any of this

Edit `design/tokens/seeds.json` and run `npm run build:tokens`. Never edit a generated file; never
type a size into a stylesheet. `scripts/build-tokens.test.mjs` fails on drift AND fails if a
derivation is removed — verified by mutation, 18 of 18 deletions caught. It runs on every
`npm run check`. For a quick answer at a terminal: `node scripts/build-tokens.mjs --check`.
