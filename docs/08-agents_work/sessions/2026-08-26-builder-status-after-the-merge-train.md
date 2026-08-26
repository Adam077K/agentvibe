---
role: builder
task: status-after-the-merge-train
date: 2026-08-26
branch: docs/status-after-the-merge-train
worktree: .worktrees/w4-eviction
tier: irreversible
risk: irreversible
tier_note: "node scripts/classify.mjs over the four paths returns floor=irreversible, driven by scripts/lib/figures.js (scripts/lib/**, block). NOTE THE BRIEF ASSUMED OTHERWISE: it said CLAUDE.md is irreversible and docs/STATUS.md is not. The classifier tiers BOTH as trivial (**/*.md). Recorded as computed, not as assumed — and the fact that CLAUDE.md, which defines the operating rules, classifies trivial is reported as a finding rather than fixed here."
qa_verdict: PASS
verification: "npm run check in the branch worktree -> Tally: 46 of 46 passed · 0 failed, exit 0. npm run check:figures -> 27 checked across 3 files, 0 findings (was 24 across 2 before this change). Every recipe printed in either file was executed: STEPS.length -> 46; for-each-ref -> main 71fd58d / origin/main 244e8db; rev-parse --abbrev-ref HEAD -> docs/status-after-the-merge-train; git rev-parse --short main origin/main -> exit 128 as documented; ls-tree .qa -> 23; check:citations wiring -> false true."
mutation_proof: "The three new CLAUDE.md registry entries are not vacuous: mutating the gate headline 46 -> 45 produced `[mismatch] CLAUDE.md:481 — claude-suite-steps states 45, derived 46`, and restoring returned it to green."
---

# The block agents read to know where they are was three denominators behind

**`check:figures` was already green on `main` — 24 checked, 0 findings — and that IS the finding.** The wired figures were correct; every stale thing was in the places it cannot reach. Running it first turned a hunt into a boundary: a sha, a branch name, an artifact count, and project state.
**`CLAUDE.md` was not in the registry at all**, so Project State said `30 of 30 steps` and printed a derivation returning **30** against a real `STEPS.length` of **46** — wrong through at least two denominators, its own notes recording `29` and `30`. Its rule *"change this block in the same PR"* is a sentence, and the sentence is what failed. **Wired it — 3 entries, 24 → 27 checked, 2 → 3 files** — with no `history: 'blockquote'` (CLAUDE.md keeps history as inline italics), each locator pinning a whole sentence and confirmed to match exactly once. Mutation: `46 → 45` gives `[mismatch] CLAUDE.md:481 … states 45, derived 46`.
**The `origin/main` sha expired FOUR times in one day** — `71fd58d` → `7f7bddd` → `3731087` → `244e8db` — and the three prior corrections each swapped one dead sha for a fresh one, each buying under a day. Not a problem to try harder at: **the sha is gone**, only the command remains.
**The wall-clock range I published this morning failed again, at the other end:** 137.6s and 273.5s on one tree minutes apart, a 2.0x spread with nothing changed but lane load. Now 90–275s and labelled for what it is — too wide to plan with, because it measures the machine, not the suite. Only the tally and exit code carry information.
**Left open and not softened:** four live bypasses of the exit-code guard (one class — `parseCiSteps` never sees the step), `check-citations` still unwired, wave-2 items 2.2/2.5, `enforce_admins` false, and single-family review still an accepted risk — #103 landed the *seam*, which is a mechanism, not a second opinion.
**The classifier contradicted the brief and the classifier wins:** `CLAUDE.md` tiers **trivial**, not irreversible. The floor is irreversible only because of `scripts/lib/figures.js`. That the file defining the harness's rules classifies trivial is reported, not fixed here.
