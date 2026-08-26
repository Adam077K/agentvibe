---
role: builder
task: 102-merge-resolution
date: 2026-08-26
branch: feat/memory-eviction
worktree: .worktrees/w4-eviction
tier: irreversible
risk: irreversible
tier_note: "node scripts/classify.mjs over the 18 changed paths returns floor=irreversible — .github/workflows/** (block), scripts/lib/check-suite.js and scripts/lib/memory-entries.js (scripts/lib/**, block). Recorded as the classifier computes it."
qa_verdict: PASS
verification: "npm run check at the SESSION ROOT (not a nested worktree — the sandbox deny-set is per session root) → `Tally: 44 of 44 passed · 0 failed`, '✓ check suite passed — every step ran.' M derived, not recalled: node -e require('./scripts/lib/check-suite.js').STEPS.length → 44. npm run test:check-suite → 52 pass · 0 fail. npm run build:map → regenerated, check:map green inside the suite."
---

# The merge where both sides were wrong about the same line

**One line, two correct edits, and taking either verbatim breaks the property both were protecting.** `origin/main` (#100) made `check:memory` an **EXCLUDED alias** whose links are steps of the suite and discrete steps of `ci.yml`; this branch added `test:eviction` to the **old `&&`-chain** form of the same script. Main's side drops `test:eviction` out of `npm run check` **and** out of CI while the npm script survives — green, running nothing. The branch's side reverts the split. Resolved as the union: alias form, three links.
**The sweep found a fourth site that recall does not.** `grep -rn "check:memory\|test:memory\|check:memory-budget"` over `package.json scripts/ .github/ docs/ CLAUDE.md` returned 4 sites needing the edit, not the 3 the brief named: `scripts/check-suite.test.mjs:215` **pins the link list in `ALIASES`** and fails on a two-link `check:memory`. Stopping at three would have made the guard the thing that reported the omission — after the merge, not before it.
**Every count this change moves is derived, and only the ones it moves were touched.** Guarded `ci.yml` checks **44 → 45**, `STEPS` **43 → 44**, links behind the five aliases **18 → 19** — each computed with the repo's own `parseCiSteps`/`aliasLinks`, never counted by eye. The `18` in ci.yml's history sentence stays: it is the count at the time of the split, not a claim about now.
**`.claude/memory/CODEBASE-MAP.md` was resolved and then regenerated, not merged.** It is generated; a hand-picked side is a map that is accurate until the first person forgets. `npm run build:map` added the `test:eviction`, `memory:evict` and `scripts/evict-memory.test.mjs` rows the conflict had no way to produce.
**Verified by execution at the session root, because location changes the answer here.** A nested worktree can write `.claude/hooks`, `.claude/skills` and `.claude/workflows` that the session root cannot, so a suite that passes in one can fail in the other. `Tally: 44 of 44 passed · 0 failed`.
**Left open, found and not fixed — scope was the merge.** `scripts/check-memory-budget.mjs:5` and `scripts/check-memory-budget.test.mjs:1` both say CI runs them "via `npm run check:memory`". CI does not, and has not since #100: it runs `test:memory` and `check:memory-budget` as their own steps, and `check:memory` is an alias nothing automated invokes. Already false on `main` before this merge, so it is reported rather than swept in.
