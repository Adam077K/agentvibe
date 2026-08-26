---
date: 2026-08-26
role: builder
task: figures-merge-resolution
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: feat/documented-figures-checked
commits: 2
---
# The check's first real exercise was the merge that falsified every figure it asserts
**Conflict set, measured — identical to the one reported to me:** `CONFLICT .claude/memory/CODEBASE-MAP.md · .github/workflows/ci.yml · docs/STATUS.md`; `package.json` and `scripts/lib/check-suite.js` auto-merged. Every hunk in `ci.yml` was a figure this check asserts, so the conflict set and the registry are the same list — which is the check working before it was even run.
**Resolved by taking `main`'s prose everywhere, then letting the check say what was wrong.** Never `--theirs` on a whole file: that drops this branch's own two steps out of `ci.yml`. Hunk-by-hunk, keeping main's text, then `check:figures` at the merged head: **16 findings across 22 checked** — 14 mismatches and **2 `unmatched`**.
**The two `unmatched` are the fail-closed rule earning its place.** `main` replaced the two `grep -c` recipes with a `parseCiSteps` derivation — the same argument this file makes, arrived at independently — so both locators matched nothing and the check said *"now UNCHECKED — re-aim the locator, never delete it"* instead of passing over them. Re-aimed at the new recipe, kept as two entries because run-steps and guarded-steps are equal today and are not the same question.
**One figure was already false ON `main`, and no change of mine caused it.** `ci.yml` states *"18 checks behind those 5 names"* and *"They are 18 steps here"* twice; at `3731087` the derivation is **19** — `check:memory` gained `test:eviction` in the #103 merge. Verified against `origin/main` directly, not against my merged tree. That is the class this check was built for, caught in the wild on its first outing.
**Cross-check of the three numbers I was handed: all three confirmed at `3731087`** — `STEPS.length` 44, ci.yml run steps 45, guarded 45, derived through `parseCiSteps` on `git show origin/main:` copies. At the merged head: **46 · 47 · 47**, plus `aliasLinkTotal` 19.
**Three prose defects the check could NOT have caught — the boundary, made concrete.** (1) `origin/main` stated as `7f7bddd` and the tree named as `feat/memory-eviction`; both falsified by the merge train — its **third** expiry in one day, and neither a sha nor a branch name is a number the suite derives. (2) *"`.qa/` does not exist in the tree at all — not an empty directory, absent"* — there are **19 verdict records on `origin/main`**; restated against what is actually still missing, the multi-judge panel. (3) A **second statement of the floor tally** 230 lines above the one in the registry, stale at 44 while the check reported green — the "figures nobody wired" limitation, live. Wired as `status-floor-tally-summary`; the other two cannot be.
**Also decided here:** `main` kept `~46 red steps` where this branch had deleted it. Wiring beats both — it is exactly `ciRunSteps + 1`, so the tilde was hedging an exact quantity. Now `ciRunStepsPlusOne`, asserted.
**Residual, unsoftened.** `irreversible` tier (`scripts/lib/**` drives the floor): one author, one model family, **no independent reviewer and no 2-of-3 multi-judge**. Recorded on the merge authority given, not as a satisfied gate.
Verified at the merged head: `npm run check` → **Tally: 46 of 46 passed · 0 failed · 125.0s** (M derived: `STEPS.length` → 46) · `check:figures` **24 checked across 2 files** · `test:figures` **18 pass · 0 fail · 0 skipped** · `test:check-suite` **59 pass · 0 fail**.
