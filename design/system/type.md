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

All four are recorded in `docs/03-system-design/DESIGN-CAPABILITY.md` §7.1, measured across five
ramps on 2026-08-29. **Do not re-derive them here and do not restate them in a third place.**

**Measured UI-band increments:**

| Reference | UI band | Display band |
|---|---|---|
| linear.app | `1 1 1 1 1 1 2` | `6 8 16 16` |
| stripe.com | `1 1 1 1 2 2 2` | `4 4 6 16` |
| vercel.com | `1 2 2 2 2 2 2` | `32 8` |
| play.grafana.org | `2` | *(none — two sizes is the whole ramp)* |
| **mission-control** | **`1 0.5 0.5 0.5 0.5 0.5 0.5 1`** | `5` |

**A modular scale is the wrong model and was falsified, not merely rejected.** A modular scale holds
its ratio *constant* by definition; every measured reference visibly decreases. The 1.07–1.17 band
that looked like a "compressed modular scale" is just the arithmetic signature of a constant +1/+2px
step.

**The defect this closes** is the fourth diagnosis of mission-control's type ramp and the first
correct one: it steps by **+0.5 seven times consecutively**, and its adjacent ratios (1.045 … 1.037)
sit entirely *below* the reference band, which bottoms out at 1.067. The three earlier diagnoses were
each well-formed and each wrong — "six sizes is disciplined restraint", "adjacent ratios below 1.125",
"no display band". §7.1 keeps all three in place, and the lesson it draws is the one that governs this
file: **a measurement without a construction model produces confident nonsense.**

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
