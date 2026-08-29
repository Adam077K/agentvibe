---
title: Use 500ms Duration for Drawer Animations
impact: MEDIUM
impactDescription: matches iOS Sheet timing users expect
tags: timing, duration, drawer, ios, modal, vaul
---

## Use 500ms Duration for Drawer Animations

Drawer components are an exception to the 300ms rule. The 500ms duration with iOS-style easing matches native mobile behavior users expect.

**Incorrect (too fast for drawer):**

```css
.drawer {
  transition: transform 200ms ease-out;
}
/* Feels rushed, doesn't match native behavior */
```

**Correct (iOS-matched timing):**

```css
.drawer {
  transition: transform 500ms cubic-bezier(0.32, 0.72, 0, 1);
}
/* Matches iOS Sheet, feels native and polished */
```

The 500ms duration works because:
- Drawers cover large screen areas
- Users expect mobile-native behavior
- The custom easing makes it feel faster than it is

## Verified in shipped source

Both the duration and the curve on this page are what Vaul actually ships — checked 2026-08-29, not
recalled:

```ts
// vaul 1.1.2 · src/constants.ts
export const TRANSITIONS = {
  DURATION: 0.5,
  EASE: [0.32, 0.72, 0, 1],
};
```

**Note the unit: the constant is `0.5` SECONDS, not `500`.** Vaul consumes it both ways in
`src/index.tsx` — `transform ${TRANSITIONS.DURATION}s cubic-bezier(...)` for CSS, and
`TRANSITIONS.DURATION * 1000` for a `setTimeout`. So `500ms` above is the correct *derived* value and
the right thing to write in CSS; it is not a literal you will find in the file. Quote `0.5` if you are
quoting the source.

Source: <https://raw.githubusercontent.com/emilkowalski/vaul/main/src/constants.ts>, accessed
2026-08-29, vaul 1.1.2.

This file is cited by `12-principles-of-animation` as the evidence that a single 300ms ceiling cannot
be right for every element class. Keep it sourced.

Reference: [Building a Drawer Component](https://emilkowal.ski/ui/building-a-drawer-component)

