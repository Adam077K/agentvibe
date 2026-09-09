---
status: unanswered
artifact: none
---

# Space

**UNANSWERED.** There is a spacing system in use. Nobody chose it.

## The question

Is Tailwind's 4px scale this project's spacing system, or is it an inheritance nobody decided on —
and what is allowed to deviate from it?

## What is actually true today

Measured in mission-control: **136 Tailwind-scale spacing utilities against 2 arbitrary values**
(both `7px`). `docs/03-system-design/DESIGN-CAPABILITY.md` §10.1 withdrew the earlier reading that
this repo has "0 spacing tokens → nothing to measure against" on exactly that evidence.

**The counting rule, because 136 means nothing without it — padding and margin utilities only, on
Tailwind's numeric scale, under `mission-control/client/src`:**

```bash
# 136 — the scale utilities
grep -rhoE '\b(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-[0-9]+(\.5)?\b' mission-control/client/src | wc -l

# 2 — the arbitrary ones, same prefix set, which is what makes "136 against 2" one measurement
grep -rhoE '\b(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-\[[^]]+\]' mission-control/client/src | sort | uniq -c
# ->   2 py-[7px]
```

> **Stated 2026-08-29 — the figure was reproducible and the RULE was not, which is the defect.** 136
> was carried from §10.1 with no prefix set, no path and no command, so a reader re-deriving it lands
> anywhere: adding `gap-*` and `space-x|y` — spacing utilities by any ordinary reading — gives **168**,
> and adding `w-*`/`h-*`/`size-*` gives 174. Three defensible readings, one unlabelled number. A
> figure whose counting rule is unstated cannot be checked, only believed; the commands above are the
> fix and the number is now a consequence of them. Note what the rule excludes and why it is still the
> right one here: `py-[7px]` is a *padding* utility, so the 2 and the 136 come from one prefix set,
> and "136 against 2" is a ratio rather than two unrelated counts.

**So the spacing situation is the opposite of the type situation, and the contrast is the useful
part:** the team kept Tailwind's spacing scale and abandoned its type scale. One dimension inherited a
system and stayed inside it; the other opted out and drifted to +0.5px steps. The tool shapes the
system — you author colour because Tailwind gives you none, and you inherit spacing because it gives
you one.

## What this file will hold when it is answered

- Ratify the 4px scale, or replace it — and either way say so, so that it is a decision.
- What may deviate, and what may not. The two `7px` values are either a considered exception or an
  accident, and nothing distinguishes them today.
- Whether optical correction is baked into any value. `text-box-trim` reached Baseline in August 2026
  and removes half-leading, which means **every spacing value authored before that date may carry
  hand-tuned optical compensation** that is now doing the job twice.

## Why there is no generator here yet

There is nothing to derive. A spacing scale that is already consistent does not need an instrument to
make a bad value inexpressible — it needs a sentence saying it was chosen. That sentence is what is
missing.
