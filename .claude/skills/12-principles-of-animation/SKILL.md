---
name: 12-principles-of-animation
description: Audit animation code against Disney's 12 principles adapted for web. Use when reviewing motion, implementing animations, or checking animation quality. Outputs file:line findings.
license: MIT
metadata:
  author: raphael-salaja
  version: "2.0.0"
  source: /content/12-principles-of-animation/index.mdx
---

# 12 Principles of Animation

Review animation code for compliance with Disney's 12 principles adapted for web interfaces.

## How It Works

1. Read the specified files (or prompt user for files/pattern)
2. Check against all rules below
3. Output findings in `file:line` format

## Rule Categories

| Priority | Category | Prefix |
|----------|----------|--------|
| 1 | Timing | `timing-` |
| 2 | Easing | `easing-` |
| 3 | Physics | `physics-` |
| 4 | Staging | `staging-` |

## Rules

### Timing Rules

#### `timing-duration-by-class`
An animation's duration must fall inside the budget for **its own element class**. There is no single
universal ceiling: the budget is set by how far the element travels, how much of the viewport it covers,
and how often the user sees it.

| Element class | Budget | Why |
|---|---|---|
| **Micro feedback** — button press, toggle, checkbox, hover, focus ring | 100–200ms | Travels a few px and is seen dozens of times per session. Slower reads as lag. |
| **Local transition** — dropdown, tooltip, popover, accordion, inline expand | 150–250ms | Small travel, high frequency, no change of context. |
| **Context switch** — modal, dialog, route transition, tab panel | 250–400ms | Larger travel and a change in what the user is looking at; needs long enough to stay legible. |
| **Full-surface** — drawer, bottom sheet, side panel, full-screen overlay, background dimming | 400–700ms | Traverses a whole viewport dimension and covers most of the screen; users expect native-sheet timing. |
| **Ambient / marketing** — hero, scroll-reveal, onboarding, intro | up to 1000ms | Not inside a task loop; the motion IS the content. |

**How to check it.** Identify the element class from the selector, component name or role, then compare
the declared duration against that row only. Report a finding when the duration falls outside its own
row's range — never against another row's. Frequency is the tie-breaker: an element animated on every
keystroke or every scroll frame is held to the row above.

**Severity is MEDIUM, not HIGH.** A duration outside its class budget is a craft defect, not a
correctness or accessibility defect.

**Every figure in the evidence block below lands INSIDE one of these rows, by construction.** That is
the test this table has to pass and the old rule failed: Carbon `slow-01` 400ms and Vaul 500ms sit in
full-surface, Carbon `slow-02` 700ms sits at its top edge — which is why that row reads 400–700 and
not the 400–600 it was first drafted with — and Material's 1000ms `DurationExtraLong4` sits in
ambient. If you retune a row, re-check it against that block before committing, or the rule starts
failing the systems it cites for authority.


**Fail:**
```css
.button   { transition: transform 400ms; }        /* micro feedback, budget 100–200ms */
.dropdown { transition: opacity 500ms ease-out; } /* local transition, budget 150–250ms */
```

**Pass:**
```css
.button   { transition: transform 200ms; }
.dropdown { transition: opacity 200ms ease-out; }
.drawer   { transition: transform 500ms cubic-bezier(0.32, 0.72, 0, 1); }  /* full-surface */
```

> **Why this is not `timing-under-300ms`, and please do not re-tighten it from memory.** This rule used
> to read *"User-initiated animations must complete within 300ms"*, show `400ms` as a **Fail**, and rate
> itself **HIGH**. As a universal hard fail it was wrong, because the predicate could not tell a drawer
> from a dropdown. Two checks inside this repository, both of which you can run right now:
>
> - `.claude/skills/emilkowal-animations/references/timing-drawer-500ms.md` ships **500ms** as the
>   *correct* drawer duration and titles the reasoning "Drawer components are an exception to the 300ms
>   rule". Our two animation skills would therefore have flagged each other, and this one would have
>   failed the drawer component of the designer it is named after.
> - `.claude/skills/emilkowal-animations/references/timing-300ms-max.md` — the very file the 300ms number
>   comes from — already scopes itself: **"150–250ms for micro UI changes, 250–400ms for larger context
>   switches, longer durations only for marketing/intro animations."** So the flat 300ms fail contradicted
>   its own source. The table above is that scoping, made checkable.
>
> **Three shipped design systems, all sourced 2026-08-29. Every one of them ships a duration the old
> rule called a HIGH-severity failure.**
>
> | System | Token | Value | Quoted from source |
> |---|---|---|---|
> | IBM Carbon | `slow-01` | **400ms** | `"$value": { "value": 400, "unit": "ms" }` |
> | IBM Carbon | `slow-02` | **700ms** | `"$value": { "value": 700, "unit": "ms" }` |
> | Vaul 1.1.2 | `TRANSITIONS.DURATION` | **0.5s = 500ms** | `DURATION: 0.5,` |
> | Material 3 | `DurationExtraLong4` | **1000ms** | `const val DurationExtraLong4 = 1000.0` |
>
> Sources: Carbon `packages/motion/src/dtcg/motion.json` and `packages/motion/src/tokens.ts` on `main`;
> vaul `src/constants.ts` at 1.1.2; Material `androidx/compose/material3/tokens/MotionTokens.kt` on
> `androidx-main`, corroborated by Flutter's `static const Duration extralong4 = Duration(milliseconds:
> 1000);` and material-web tokens v0.192. **The Material unit is confirmed by that Flutter line** —
> `1000.0` alone is a bare Float and would not have settled it.
>
> **Spell the Carbon tokens one of these three ways and no other.** The plausible-looking SCSS form
> `$duration-slow-01` was searched for and **does not exist**: `packages/styles/scss/_motion.scss` uses
> an entirely different convention (`$transition-base: 250ms`, `$transition-expansion: 300ms`) with no
> `$duration-*` variables at all. Verified spellings: JS record key `'slow-01'` / `'slow-02'`, JS export
> `durationSlow01` / `durationSlow02`, DTCG path `duration.slow.01` / `duration.slow.02`.
>
> **Quote Carbon's own scoping if you cite its tokens** — it ships in the same JSON as a `$description`
> field, and it is a factual qualifier in both directions: these are a published scale for named uses,
> not defaults.
> - `slow-01`: *"Large expansion, important system notifications. Deliberate, prominent transitions."*
> - `slow-02`: *"Background dimming, large hero transitions. Slow, immersive motion for maximum emphasis."*
>
> **Evidence grade.** These were read through a fetching agent, so they are verbatim-as-read rather than
> a byte-for-byte local checkout. Each figure is corroborated across two or more independent shipped
> implementations, which is why they are quoted here at all. The two in-repo checks above need no such
> caveat and remain the load-bearing evidence: they are checkable by anyone reading this file, offline.


#### `timing-consistent`
Similar elements must use identical timing values.

**Fail:**
```css
.button-primary { transition: 200ms; }
.button-secondary { transition: 150ms; }
```

**Pass:**
```css
.button-primary { transition: 200ms; }
.button-secondary { transition: 200ms; }
```

#### `timing-no-entrance-context-menu`
Context menus should not animate on entrance (exit only).

**Fail:**
```tsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

**Pass:**
```tsx
<motion.div exit={{ opacity: 0 }} />
```

### Easing Rules

#### `easing-entrance-ease-out`
Entrances must use `ease-out` (arrive fast, settle gently).

**Fail:**
```css
.modal-enter { animation-timing-function: ease-in; }
```

**Pass:**
```css
.modal-enter { animation-timing-function: ease-out; }
```

#### `easing-exit-ease-in`
Exits must use `ease-in` (build momentum before departure).

**Fail:**
```css
.modal-exit { animation-timing-function: ease-out; }
```

**Pass:**
```css
.modal-exit { animation-timing-function: ease-in; }
```

#### `easing-no-linear-motion`
Linear easing should only be used for progress indicators, not motion.

**Fail:**
```css
.card { transition: transform 200ms linear; }
```

**Pass:**
```css
.progress-bar { transition: width 100ms linear; }
```

#### `easing-natural-decay`
Use exponential ramps, not linear, for natural decay.

**Fail:**
```ts
gain.gain.linearRampToValueAtTime(0, t + 0.05);
```

**Pass:**
```ts
gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
```

### Physics Rules

#### `physics-active-state`
Interactive elements must have active/pressed state with scale transform.

**Fail:**
```css
.button:hover { background: var(--gray-3); }
/* Missing :active state */
```

**Pass:**
```css
.button:active { transform: scale(0.98); }
```

#### `physics-subtle-deformation`
Squash/stretch deformation must be subtle (0.95-1.05 range).

**Fail:**
```tsx
<motion.div whileTap={{ scale: 0.8 }} />
```

**Pass:**
```tsx
<motion.div whileTap={{ scale: 0.98 }} />
```

#### `physics-spring-for-overshoot`
Use springs (not easing) when overshoot-and-settle is needed.

**Fail:**
```tsx
<motion.div transition={{ duration: 0.3, ease: "easeOut" }} />
// When element should bounce/settle
```

**Pass:**
```tsx
<motion.div transition={{ type: "spring", stiffness: 500, damping: 30 }} />
```

#### `physics-no-excessive-stagger`
Stagger delays must not exceed 50ms per item.

**Fail:**
```tsx
transition={{ staggerChildren: 0.15 }}
```

**Pass:**
```tsx
transition={{ staggerChildren: 0.03 }}
```

### Staging Rules

#### `staging-one-focal-point`
Only one element should animate prominently at a time.

**Fail:**
```tsx
// Multiple elements with competing entrance animations
<motion.div animate={{ scale: 1.1 }} />
<motion.div animate={{ scale: 1.1 }} />
```

#### `staging-dim-background`
Modal/dialog backgrounds should dim to direct focus.

**Fail:**
```css
.overlay { background: transparent; }
```

**Pass:**
```css
.overlay { background: var(--black-a6); }
```

#### `staging-z-index-hierarchy`
Animated elements must respect z-index layering.

**Fail:**
```css
.tooltip { /* No z-index, may render behind other elements */ }
```

**Pass:**
```css
.tooltip { z-index: 50; }
```

## Output Format

When reviewing files, output findings as:

```
file:line - [rule-id] description of issue

Example:
components/dropdown/menu.tsx:45 - [timing-duration-by-class] Dropdown 500ms exceeds the 150-250ms local-transition budget
components/button/styles.module.css:12 - [physics-active-state] Missing :active transform
```

## Summary Table

After findings, output a summary:

| Rule | Count | Severity |
|------|-------|----------|
| `timing-duration-by-class` | 2 | MEDIUM |
| `physics-active-state` | 3 | MEDIUM |
| `easing-entrance-ease-out` | 1 | MEDIUM |

## References

- [The Illusion of Life: Disney Animation](https://www.amazon.com/Illusion-Life-Disney-Animation/dp/0786860707)
- [Apple WWDC23: Animate with Springs](https://developer.apple.com/videos/play/wwdc2023/10158)
