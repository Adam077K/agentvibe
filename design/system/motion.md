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
Vaul ships 500ms and Material runs to 1000ms. **Do not import that number here.**

> **Superseded 2026-08-29 — the second example this bullet gave was refuted by this same branch, and
> the refutation landed two files away while the claim stayed here.** It read: *"our
> `emilkowal-animations` skill carries a velocity threshold of `0.11` where the shipped source it is
> named after uses **0.4** — 3.6× off. The skill named after Emil Kowalski would fail his own most-used
> component."* **`0.11` is correct.** The article the skill is named for builds **Sonner**, which ships
> exactly `0.11` in exactly that condition; `0.4` is **Vaul**, a drawer library by the same author.
> Measuring a toast's dismiss velocity against a drawer's is a category error — and it is the category
> error this file's own §3 warns about, committed inside this file. Verify:
>
> ```bash
> git log --oneline origin/main..HEAD | grep f3d0165   # revert+fix(skills): 0.11 px/ms is CORRECT
> grep -n '0\.11\|category error' \
>   .claude/skills/emilkowal-animations/references/interact-momentum-dismiss.md
> ```
>
> **How it got there:** commit `c8c1e53` changed the skill's `0.11` to `0.4` on the 3.6× reading, and
> `f3d0165` reverted the value and narrowed the sentence instead. This file was written against the
> intermediate state and never re-read, so one diff shipped two files disagreeing about one number —
> with the wrong one in the design system's own motion rule, which is the copy a reader trusts.

**What survives is the better example, and it is a scope defect rather than a value defect.** The
skill did carry `0.11` as the threshold for *"most swipe-to-dismiss interactions"* — a
component-scoped constant written as a universal, which is what invited a comparison against a library
where it is false. That is precisely the failure a motion token table invites. **Import neither `0.11`
nor `0.4` here without the component each was tuned for.**

**3 · Every motion figure in every design system traces to craft consensus, not measurement.**
NN/g's 100–500ms range cites no peer-reviewed research. Material's 16-step scale, Carbon's two modes
and Apple's spring presets are all published without studies. **Nobody in this repository may cite a
millisecond figure as evidence.** The defensible framing is cost, not taste: an animation spends from
budgets built to catch slowness, so **an animation is latency you chose.**

## The structural rule worth starting from

Frequency, not taste. An animation's value divides by how often it is seen, so a once-per-session
transition and a once-per-second one are not the same object — *"sometimes the best animation is no
animation."*
