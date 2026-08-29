---
status: unanswered
artifact: none
---

# Motion

**UNANSWERED.** No durations, no easings, no rules.

## The question

What animates, what must not, and at what durations?

## What this file will hold when it is answered

- The duration and easing tokens, and the frequency band each one is for.
- What must not animate, stated as a refusal.
- The reduced-motion policy — **substitution, not deletion.**

## Three things already established that constrain the answer

**1 · Motion conformance is checkable; motion quality is not.**
`document.getAnimations()` has been Baseline since September 2020 and exposes duration, easing, delay
and iterations. So *"the declared token is the token that ran"* can bind. Whether the motion is
**good** cannot be checked by anyone — and both dominant visual-QA tools delete motion so a static
assertion can pass.

**2 · The `300ms` rule this repo already ships is wrong, and it is wrong in a named skill.**
`docs/03-system-design/DESIGN-CAPABILITY.md` §9.1: our `12-principles-of-animation` skill fails an
exit animation at 400ms as HIGH severity, while Carbon ships `slow01 = 400ms` and `slow02 = 700ms`,
Vaul ships 500ms and Material runs to 1000ms. And our `emilkowal-animations` skill carries a velocity
threshold of `0.11` where the shipped source it is named after uses **0.4** — 3.6× off. **The skill
named after Emil Kowalski would fail his own most-used component.** Do not import either number here.

**3 · Every motion figure in every design system traces to craft consensus, not measurement.**
NN/g's 100–500ms range cites no peer-reviewed research. Material's 16-step scale, Carbon's two modes
and Apple's spring presets are all published without studies. **Nobody in this repository may cite a
millisecond figure as evidence.** The defensible framing is cost, not taste: an animation spends from
budgets built to catch slowness, so **an animation is latency you chose.**

## The structural rule worth starting from

Frequency, not taste. An animation's value divides by how often it is seen, so a once-per-session
transition and a once-per-second one are not the same object — *"sometimes the best animation is no
animation."*
