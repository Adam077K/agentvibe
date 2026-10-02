---
date: 2026-10-02
engine: builder
task: kernel-budget
branch: fix/kernel-budget
qa_verdict: PENDING
tier: lite
---
Final ruling (founder, 2026-10-03, superseding the 2026-10-02 exclude-and-10k ruling): the Kernel budget is 11,000 lines and nothing is excluded, so the counted set matches `origin/main`. Measured: 8,318 of 11,000, exit 0. `origin/main` @ 76ca095 failed at 8,318 of 8,000.
The review of `d52dd75` found a MED loophole: Kernel code in `package boundary` would run uncounted. A refusal rule for it was written and mutation-tested, then dropped when the exclusion was removed, because without the exclusion there is no loophole. That work is kept in stash `kb-abandoned-import-rule-2026-10-03`. The hook refused `git checkout -- <file>`; per the hook's own advice I stashed the work instead.
`size_test.go` pins that 11,000 passes, 11,001 fails and a checker-package file counts. No done-test register is frozen on this (`check-done-tests`: 64 hashes match).
Canon updated: 09a §2, the 14-BUILD-PLAN G1(d), B0-16 and "Kernel stays small" rows, the B0-16 title in `build/jobs.yml` and `kernel/README.md`. Row 518 no longer claims CI enforcement; #144 wires that. Decision note: `docs/vision-v3/_process/DR-KERNEL-BUDGET-2026-10-02.md`.
Tier: `classify.mjs` floor=lite.
