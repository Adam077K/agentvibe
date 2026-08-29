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
| **Full-surface** — drawer, bottom sheet, side panel, full-screen overlay | 400–600ms | Traverses a whole viewport dimension and covers most of the screen; users expect native-sheet timing. |
| **Ambient / marketing** — hero, scroll-reveal, onboarding, intro | up to 1000ms | Not inside a task loop; the motion IS the content. |

**How to check it.** Identify the element class from the selector, component name or role, then compare
the declared duration against that row only. Report a finding when the duration falls outside its own
row's range — never against another row's. Frequency is the tie-breaker: an element animated on every
keystroke or every scroll frame is held to the row above.

**Severity is MEDIUM, not HIGH.** A duration outside its class budget is a craft defect, not a
correctness or accessibility defect.

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
> **External figures were offered as further evidence and are deliberately NOT quoted here.** IBM
> Carbon's `slow01`/`slow02` motion tokens, Vaul's shipped drawer duration and Material's upper bound
> were all cited to me second-hand; this tree can reach no network, so none could be checked at source,
> and encoding an unverified number is the exact defect this rule is being repaired for. Check them
> yourself before adding them: Carbon <https://carbondesignsystem.com/elements/motion/overview/>, Vaul
> `src/constants.ts` <https://github.com/emilkowalski/vaul>, Material 3 motion
> <https://m3.material.io/styles/motion/easing-and-duration/tokens-specs>. The two in-repo checks above
> are sufficient on their own.

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
