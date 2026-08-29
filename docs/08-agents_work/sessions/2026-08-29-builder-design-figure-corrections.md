---
date: 2026-08-29
role: builder
task: design-figure-corrections
qa_verdict: PASS
tier: lite
risk: lite
branch: integration/design-layer
---

# Nine figures in the design system's own rule documents, re-derived

**Every number below came from a command that was run, and the command is now next to the number in
the file.** Where a figure was wrong and its argument was sound, the figure moved and the argument
stayed. Corrections are marked in place, not overwritten.

| File | Was | Is | Derived by |
|---|---|---|---|
| `design/system/type.md` | reference increment table, 4 of 5 rows false, docs.stripe.com omitted | table replaced by the derivation command; values kept as dated provenance | `node -e "…measured.json…bands[b].sizes"` per slug |
| `design/system/type.md` | "+0.5 **seven** times consecutively" | **six** | `node -e "[10,…,15] increments; filter(0.5).length"` → 6 |
| `design/system/type.md` | "the reference band … bottoms out at **1.067**" | UI-band floor **1.048**; all-steps floor 1.008 and it does *not* carry the argument | `Math.min` over `type.uiSteps` / `type.steps` across five slugs |
| `design/system/type.md` | "every measured reference visibly decreases" | scoped to "within every constant-increment run" — grafana increases, stripe is non-monotone | ratios per slug from `measured.json` |
| `design/system/motion.md` | `emilkowal-animations` "carries 0.11 where the source uses 0.4 — 3.6× off" | `0.11` is correct (Sonner); `0.4` is Vaul, a drawer — category error | `git log … grep f3d0165`, `c8c1e53` |
| `design/INDEX.md` | "one is still off by 0.001 (`--color-warn`)" | **two** — `#d9a441` 8.582→8.581 and `#6a7280` 3.982→3.981 | `node --test scripts/build-tokens.test.mjs` (51 pass) |
| `design/INDEX.md` | "the `design` lens has five procedure steps, every one a judging action" | **12** steps, first **7** are making actions | `awk` walk of `.claude/lenses.yml` → 12 |
| `design/system/space.md` | "136 Tailwind-scale spacing utilities" with no counting rule | 136 **is** reproducible — padding+margin prefixes under `mission-control/client/src`; rule and command now stated | two `grep -rhoE … \| wc -l` → 136 and `2 py-[7px]` |
| `design/rules/type-scale.rules.json` | `min-step-ratio-1125.expected` named 3 refuting references | names **4** — play.grafana.org added (1.05, 1.111) | `extract-reference.mjs --against … --json` |

**One row of the brief was wrong and is recorded as such:** 136 was called "not reproducible". It is —
`(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-[0-9]+(\.5)?` under `mission-control/client/src` returns
exactly 136, and the same prefix set returns exactly the 2 `py-[7px]` arbitrary values, which is what
makes "136 against 2" a single measurement. The *defect* named in the brief was real and is what was
fixed: the counting rule was unstated, and three defensible readings give 136, 168 and 174.

**`expected_verdict` values are untouched and all six still reproduce** — CONTESTED ×5, HELD ×1.
Only `expected_verdict` is asserted by the harness test, which is precisely why a wrong reason could
sit beside a right verdict undetected.
