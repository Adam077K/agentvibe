---
title: Use Momentum-Based Dismissal
impact: HIGH
impactDescription: flick gestures feel natural, threshold-only feels rigid
tags: interact, momentum, velocity, swipe, dismiss, gesture
---

## Use Momentum-Based Dismissal

Allow users to dismiss elements with a fast flick, not just by dragging past a threshold. Calculate
velocity and dismiss if either distance OR velocity exceeds threshold.

**Incorrect (distance-only threshold):**

```tsx
const onDragEnd = (swipeAmount) => {
  if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD) {
    dismiss()
  }
}
// Fast flicks don't dismiss if distance is short
```

**Correct (momentum-based).** The constants and the condition below are Sonner's, shipped; the
function signature is illustrative, because Sonner reads these from component state rather than from
arguments:

```tsx
const SWIPE_THRESHOLD = 45   // px — sonner 2.0.8

const onDragEnd = (swipeAmount, timeTaken) => {
  const velocity = Math.abs(swipeAmount) / timeTaken

  if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
    dismiss()
  }
}
// Fast flicks dismiss even with short distance
```

## The threshold is 0.11 px/ms FOR A TOAST, and that scope is the point

The cited article is **[Building a Toast Component](https://emilkowal.ski/ui/building-a-toast-component)**, which builds **Sonner**. Naming the library
matters: this rule was once compared against **Vaul**, Kowalski's *drawer* library, and judged 3.6x
wrong on that basis. It is not wrong. Sonner ships exactly this number, in exactly this condition:

```tsx
// sonner 2.0.8 · src/index.tsx
const SWIPE_THRESHOLD = 45;
const timeTaken = new Date().getTime() - dragStartTime.current?.getTime();
const velocity = Math.abs(swipeAmount) / timeTaken;
if (isAllowedDirection && (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11)) {
```

Source: <https://raw.githubusercontent.com/emilkowalski/sonner/main/src/index.tsx>, accessed
2026-08-29, sonner 2.0.8, corroborated in the shipped bundle and by the article itself.

**The unit is px/ms**: `getTime()` returns milliseconds and `swipeAmount` is pixels, so
`Math.abs(swipeAmount) / timeTaken` is pixels per millisecond. Check the unit before comparing this
number to any other one — the arithmetic shape, not the name, is what makes two thresholds comparable.

**`0.11` is not a general constant, and its own author says so.** In the cited article he writes:
*"0.11 is just a number that I ended up on through trial and error."* One component, arrived at
empirically. And the **same author** ships a different value for a different component:

```ts
// vaul 1.1.2 · src/constants.ts — a DRAWER, same unit, same arithmetic shape
export const VELOCITY_THRESHOLD = 0.4;
```

Source: <https://raw.githubusercontent.com/emilkowalski/vaul/main/src/constants.ts>, accessed
2026-08-29.

So: **0.11 px/ms for a toast, 0.4 px/ms for a drawer — 3.6x apart, same author, same unit.** A toast
is small, peripheral and frequent; a drawer is large, central and deliberate. Take `0.11` as the
starting point for a toast-sized element and expect a larger surface to want a higher bar. **Do not
restate either number as the threshold for swipe-to-dismiss in general** — this file used to say
`0.11` "works well for most swipe-to-dismiss interactions", and that word "most" is what invited the
comparison against a library where it is false.

> **Why this file is careful about a number that turned out to be right.** The 3.6x claim was
> well-formed, and it was a category error: it compared a toast constant to a drawer library because
> nothing in this file named which library the article builds. The number survived; the sentence
> around it did not. The scope is now stated at the number rather than left to the reader.
>
> **This skill carried the same defect TWICE, and the second one is three lines from the first.** A
> scoped number written as universal:
>
> | Instance | Was | Scope it actually had |
> |---|---|---|
> | this rule | "works well for **most** swipe-to-dismiss interactions" | one component, by the author's own account trial and error |
> | the Key Values table | `300ms` — "Maximum duration for UI animations" | small, local transitions; [the same skill's own file](timing-300ms-max.md) allows 250–400ms for context switches, and [its drawer rule](timing-drawer-500ms.md) ships 500ms |
>
> Both were repaired on 2026-08-29, and `12-principles-of-animation` had a third instance of it — a
> flat 300ms hard fail — repaired the same day. **Three in two skills. When you add a number to this
> skill, write the scope beside it in the same sentence**; a number that has to be scoped by the
> reader will eventually be read unscoped by someone comparing it to something else.


Reference: [Building a Toast Component](https://emilkowal.ski/ui/building-a-toast-component) — builds
**Sonner**, and is the source of the `0.11` above. For the drawer counterpart see
[Building a Drawer Component](https://emilkowal.ski/ui/building-a-drawer-component), which builds
**Vaul**.
