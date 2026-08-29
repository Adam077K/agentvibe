---
title: Use Momentum-Based Dismissal
impact: HIGH
impactDescription: flick gestures feel natural, threshold-only feels rigid
tags: interact, momentum, velocity, swipe, dismiss, gesture
---

## Use Momentum-Based Dismissal

Allow users to dismiss elements with a fast flick, not just by dragging past a threshold. Calculate velocity and dismiss if either distance OR velocity exceeds threshold.

**Incorrect (distance-only threshold):**

```tsx
const onDragEnd = (dragDistance) => {
  if (Math.abs(dragDistance) > 100) {
    dismiss()
  }
}
// Fast flicks don't dismiss if distance is short
```

**Correct (momentum-based):**

```tsx
const onDragEnd = (dragDistance, dragDuration) => {
  const velocity = Math.abs(dragDistance) / dragDuration

  if (Math.abs(dragDistance) > 100 || velocity > 0.4) {
    dismiss()
  }
}
// Fast flicks dismiss even with short distance
```

**0.4 pixels per millisecond**, and the unit matters as much as the number.

## Where 0.4 comes from, and what it replaced

This file carried `0.11 px/ms` until 2026-08-29. Vaul — Emil Kowalski's own drawer library, the one
this skill's ease and duration rules already cite — ships **3.6x that value**. Verified in shipped
source, not recalled:

```ts
// vaul 1.1.2 · src/constants.ts
export const VELOCITY_THRESHOLD = 0.4;
```
```tsx
// vaul 1.1.2 · src/index.tsx — the unit, and the comparison
const timeTaken = dragEndTime.current.getTime() - dragStartTime.current.getTime();
const velocity = Math.abs(distMoved) / timeTaken;
if (velocity > VELOCITY_THRESHOLD) {
  closeDrawer();
}
```

Source: <https://raw.githubusercontent.com/emilkowalski/vaul/main/src/constants.ts> and `src/index.tsx`,
both accessed 2026-08-29, vaul 1.1.2.

**The units are the same, checked from both sides — so the 3.6x gap was real and not a unit error.**
`getTime()` returns milliseconds and `distMoved` is pixels, so Vaul's `velocity` is px/ms. The formula
in the example above — `Math.abs(dragDistance) / dragDuration` — is the identical computation. Two
thresholds in one unit, differing 3.6x, is a defect rather than a difference of convention. That
question was asked before the number was changed, because if the units had differed the correct repair
would have been to state the unit and leave the value alone.

> ## ⛔ OPEN — UNVERIFIED. THIS RULE'S ORIGINAL ATTRIBUTION IS NOT SOURCED.
>
> **Read this before citing 0.4 as settled for every component.**
>
> The `Reference` line below points at *Building a Toast Component* — that is **Sonner**, a toast
> library. `0.4` is verified from **Vaul**, a drawer library. Nobody has yet read Sonner's shipped
> swipe threshold, so it remains possible that `0.11` was correct **for a toast** and that this rule
> was always conflating two components with genuinely different thresholds — exactly the mistake
> `12-principles-of-animation` made with duration, where one number was applied across element
> classes that do not share one.
>
> **What would close this:** fetch Sonner's `src/index.tsx` / `src/constants.ts`, quote the swipe or
> velocity constant verbatim with its URL and access date, and then either (a) confirm one threshold
> serves both and delete this block, or (b) split the rule by component the way the duration rule was
> split. Until one of those happens, treat `0.4` as **sourced for drawers and assumed for toasts**.
>
> **This marker is ADVISORY — no mechanism enforces it.** Nothing in `npm run check` fails while it
> is unresolved; a step in `scripts/lib/check-suite.js` would be needed for that. It is written to be
> impossible to mistake for finished prose, because the figure it replaces survived for exactly that
> reason: it read as settled and cited an article that never contained it. **Do not delete this block
> to tidy the file. Deleting it IS the regression.**

Reference: [Building a Drawer Component](https://emilkowal.ski/ui/building-a-drawer-component) ·
[Building a Toast Component](https://emilkowal.ski/ui/building-a-toast-component) — see the open
question above about which of the two this rule describes.

