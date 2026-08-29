---
date: 2026-08-29
role: orchestrator
task: design-layer
qa_verdict: PENDING
tier: full
risk: full
branch: integration/design-layer
commits: 65
---

# The design layer — what shipped, and what it cost to find out

**`qa_verdict: PENDING` is deliberate and will be corrected in the last commit.** Two blinded reviewers
are in flight under `independence: provenance`. Writing `PASS` before they return would be the exact
defect this layer exists to prevent — a verdict recorded ahead of the check that justifies it. The
deterministic floor is green and that is a different statement.

## What shipped

Six lanes, `floor=full`, no irreversible edit. `scripts/lib/check-suite.js` and
`.github/workflows/ci.yml` are byte-identical to `origin/main`; `STEPS.length` is 48, unmoved.

| Lane | Artifact |
|---|---|
| `build-tokens` | seeds -> DTCG tokens + CSS + TS + a computed contrast table, with `--check` |
| `extract-reference` | measures real sites; holds a stated rule against them and can refute it |
| `design-probe` | conformance to the token file; reflow at 320px; motion via `getAnimations()` |
| `design-lib` | the arithmetic the other three shared, collapsed to one copy |
| `design-lens` | the `design` lens gains 7 making steps ahead of its 5 judging ones |
| `design-skill-repairs` | `impeccable` made loadable; three scoped-number defects repaired |

**The loop closes.** Measured on the integrated tree: of 94 sized-text usages in mission-control,
**45 (47.9%) sit outside the generated system**, each finding naming its nearest token. Motion reports
`unchecked` rather than passing, because no motion tokens exist yet.

## The line that governs it

**CONFORMANCE CAN BIND. QUALITY CAN ONLY INFORM.** A design-quality judge is ~0.543 accurate against a
panel 0.741 self-consistent — a biased coin on the merge path, reproducible and invalid. So conformance
binds by being a test, and by nothing else. Four of the ten changed surfaces are mechanism; six are
documentation and are labelled `ADVISORY` in the diff, because no code path in this repo loads a lens's
`procedure:` or a playbook's stages and acts on them.

## What this cost, stated plainly

**Nine of the orchestrator's findings were falsified during the work**, nearly all by builders trying to
build on them: the 1.125 ratio rule (invented here, violated by every reference), the velocity comparison
(two different libraries), "+0.5 is the defect" (missed usage share), the "no display band" withdrawal
(rested on an unscrolled page), a session-start cost model that would have rationed something free, a
`.mjs` count off by 2.5x, a five-ramp table that is not reproducible from what was recorded, a
line-height curve tested against sites when it was sourced from systems, and "no agent can register a
claim" when a CLI existed.

**Three of the orchestrator's own process errors are in the record**: two sections of the findings
document written into a child worktree, three more destroyed by a copy in the wrong direction, and a
merge resolution that kept a newer test with an older implementation. The third was loud only because the
two halves desynchronised; had the conflict covered both, it would have been green and silently missing a
feature.

> **Every one of those was caught by someone building on the finding, never by anyone reading the prose.**
> That is the strongest result of the day and it is not about design: the errors surface when a finding is
> loaded into an instrument. It is the argument for the conformance layer, made accidentally and at the
> orchestrator's expense.

## Open, and founder-owned

1. **Motion tokens do not exist.** The probe measures motion and has nothing to measure against. Someone
   must choose duration and easing seeds; inventing them to green a check is the defect this layer exists
   to prevent.
2. **`design-probe`'s `parseRgb` fails closed on CSS Color 4** — `rgb(0 0 0)`, `rgb(11 12 14 / 0.5)`,
   `rgba(0,0,0,var(--a))`. Each is a contrast check that does not run, and Chromium emits more of that
   syntax over time. **Silent under-measurement is invisible to every check here.**
3. **What `designer` declares in `skills:`** — `impeccable` is now loadable, 4,370 of 4,959 lines usable.
   `.claude/agents/**` is irreversible tier.
4. **Whether to import five verified skills** — `design-tokens`, `information-architecture`,
   `design-brief`, `break`, `better-writing`. Only worth doing alongside (3).
5. **The reference corpus.** Four sites captured; the research establishes this is the only route by
   which taste enters the system.

## Verification

```
npm run check                    48 of 48 passed · 0 failed · exit 0 · every step ran
classify.mjs <full diff>         floor=full
git diff origin/main -- scripts/lib/check-suite.js .github/workflows/ci.yml   empty
STEPS.length                     48
```

Exit codes read directly, never through a pipe — a mistake made once today and recorded at 15.28.
